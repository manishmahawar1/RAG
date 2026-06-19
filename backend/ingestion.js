require("dotenv").config();
const fs = require("fs");
const path = require("path");
const PDF2Json = require("pdf2json");
const { pool } = require("./db");

// Local embedding model — no API key needed!
let embedder = null;

async function loadEmbedder() {
  if (!embedder) {
    console.log("⏳ Loading embedding model (first time ~50MB download)...");
    const { pipeline } = await import("@xenova/transformers");
    embedder = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );
    console.log("✅ Embedding model loaded!");
  }
  return embedder;
}

// ─────────────────────────────────────
// STEP 1: PDF se text nikalo
// ─────────────────────────────────────
async function extractTextFromPDF(filePath) {
  console.log("\n📄 STEP 1: Extracting text from PDF...");

  return new Promise((resolve, reject) => {
    const pdfParser = new PDF2Json();

    pdfParser.on("pdfParser_dataError", (err) => {
      reject(err.parserError);
    });

    pdfParser.on("pdfParser_dataReady", (pdfData) => {
      let fullText = "";
      pdfData.Pages.forEach((page) => {
        page.Texts.forEach((textItem) => {
          textItem.R.forEach((r) => {
            try {
              fullText += decodeURIComponent(r.T) + " ";
            } catch (e) {
              fullText += r.T + " ";
            }
          });
        });
        fullText += "\n";
      });

      const cleanText = fullText.replace(/\s+/g, " ").trim();
      console.log(`✅ Extracted ${cleanText.split(" ").length} words`);
      console.log(`📝 Sample: "${cleanText.substring(0, 100)}..."`);
      resolve(cleanText);
    });

    pdfParser.loadPDF(filePath);
  });
}

// ─────────────────────────────────────
// STEP 2: Chunks banao
// ─────────────────────────────────────
function chunkText(text, chunkSize = 250, overlap = 30) {
  console.log("\n✂️  STEP 2: Creating chunks...");

  const words = text.split(" ");
  const chunks = [];

  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(" ");
    if (chunk.trim().split(" ").length > 50) {
      chunks.push(chunk.trim());
    }
  }

  console.log(`✅ Created ${chunks.length} chunks`);
  console.log(`📦 Chunk 1: "${chunks[0]?.substring(0, 80)}..."`);
  return chunks;
}

// ─────────────────────────────────────
// STEP 3: Local embeddings banao
// ─────────────────────────────────────
async function createEmbeddings(chunks) {
  console.log("\n🔢 STEP 3: Creating embeddings locally...");
  console.log("   No API key needed! Running on your PC! 🖥️");

  const model = await loadEmbedder();
  const embeddings = [];

  for (let i = 0; i < chunks.length; i++) {
    const output = await model(chunks[i], {
      pooling: "mean",
      normalize: true,
    });

    const vector = Array.from(output.data);
    embeddings.push(vector);

    console.log(`   ✅ Chunk ${i + 1}/${chunks.length} embedded (${vector.length} numbers)`);
  }

  console.log(`✅ All embeddings done!`);
  console.log(`📐 Each embedding: ${embeddings[0].length} numbers`);
  return embeddings;
}

// ─────────────────────────────────────
// STEP 4: PostgreSQL mein store karo
// ─────────────────────────────────────
async function storeInPostgres(chunks, embeddings, fileName) {
  console.log("\n🗄️  STEP 4: Storing in PostgreSQL...");

  for (let i = 0; i < chunks.length; i++) {
    await pool.query(
      `INSERT INTO documents 
        (text, embedding, source, chunk_index)
       VALUES ($1, $2::vector, $3, $4)`,
      [
        chunks[i],
        JSON.stringify(embeddings[i]),
        fileName,
        i,
      ]
    );
    console.log(`   💾 Stored ${i + 1}/${chunks.length} chunks...`);
  }

  console.log(`✅ All chunks stored!`);
}

// ─────────────────────────────────────
// MAIN PIPELINE
// ─────────────────────────────────────
async function ingestDocument(filePath, fileName) {
  console.log("\n" + "=".repeat(50));
  console.log(`🚀 STARTING INGESTION: ${fileName}`);
  console.log("=".repeat(50));

  const startTime = Date.now();

  try {
    const text = await extractTextFromPDF(filePath);
    const chunks = chunkText(text);
    const embeddings = await createEmbeddings(chunks);
    await storeInPostgres(chunks, embeddings, fileName);

    const timeTaken = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log("\n" + "=".repeat(50));
    console.log("🎉 INGESTION COMPLETE!");
    console.log(`   File: ${fileName}`);
    console.log(`   Chunks: ${chunks.length}`);
    console.log(`   Time: ${timeTaken}s`);
    console.log("=".repeat(50));

    return { success: true, chunks: chunks.length, timeTaken };

  } catch (error) {
    console.log("\n❌ INGESTION FAILED!");
    console.log(`   Error: ${error.message}`);
    throw error;
  }
}

module.exports = { ingestDocument };