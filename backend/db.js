// db.js
// pg = PostgreSQL library for Node.js
const { Pool } = require("pg");

// Pool = connection manager
// Ek baar connect karo, baar baar use karo
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // neon.tech ke liye zaroori
});

// Table banane ka function
async function setupDatabase() {
  console.log("🔧 Setting up database...");

  // pgvector extension enable karo
  // Yeh PostgreSQL ko vectors store karne deta hai
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS vector;
  `);
  console.log("✅ pgvector extension enabled!");

  // Documents table banao
  // Yahan har chunk store hoga
  await pool.query(`
    CREATE TABLE IF NOT EXISTS documents (
      id        SERIAL PRIMARY KEY,
      text      TEXT NOT NULL,
      embedding vector(384),
      source    TEXT,
      chunk_index INTEGER,
      uploaded_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log("✅ Documents table ready!");

  // Index banao fast search ke liye
  await pool.query(`
    CREATE INDEX IF NOT EXISTS embedding_idx
    ON documents
    USING ivfflat (embedding vector_cosine_ops);
  `);
  console.log("✅ Vector index created!");
}

module.exports = { pool, setupDatabase };