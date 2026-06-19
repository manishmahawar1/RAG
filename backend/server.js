// server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const { setupDatabase } = require("./db");
const { ingestDocument } = require("./ingestion");

const app = express();
app.use(cors());
app.use(express.json());

// Multer — file upload handler
// Files /uploads folder mein save hongi
const upload = multer({ dest: "uploads/" });

// ─────────────────────────────
// Route: Upload & Ingest PDF
// ─────────────────────────────
app.post("/upload", upload.single("file"), async (req, res) => {
  console.log("\n📨 Upload request received!");
  
  try {
    const file = req.file;
    
    // Check karo PDF hai ya nahi
    if (!file.originalname.endsWith(".pdf")) {
      return res.status(400).json({ 
        error: "Only PDF files allowed!" 
      });
    }
    
    console.log(`📁 File received: ${file.originalname}`);
    console.log(`📏 File size: ${(file.size / 1024).toFixed(2)} KB`);
    
    // Ingestion pipeline start karo
    const result = await ingestDocument(file.path, file.originalname);
    
    res.json({
      success: true,
      message: `✅ ${file.originalname} ingested successfully!`,
      chunks: result.chunks,
      timeTaken: result.timeTaken,
    });
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────
// Route: Check stored documents
// ─────────────────────────────
app.get("/documents", async (req, res) => {
  const { pool } = require("./db");
  
  const result = await pool.query(`
    SELECT 
      source,
      COUNT(*) as total_chunks,
      MIN(uploaded_at) as uploaded_at
    FROM documents
    GROUP BY source
    ORDER BY uploaded_at DESC
  `);
  
  res.json(result.rows);
});

// ─────────────────────────────
// Start server
// ─────────────────────────────
async function startServer() {
  // Pehle database setup karo
  await setupDatabase();
  
  app.listen(process.env.PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${process.env.PORT}`);
    console.log(`📤 Upload endpoint: POST /upload`);
    console.log(`📋 View docs: GET /documents`);
  });
}

startServer();