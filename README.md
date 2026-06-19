# RAG Ingestion Pipeline 📚

**Student:** Manish  
**Assignment:** Implement RAG Ingestion Pipeline  
**Stack:** React + Node.js + Express + PostgreSQL  
**Date:** June 19, 2026

---

## Project Kya Hai?

RAG ka matlab hai **Retrieval Augmented Generation**.

Yeh ek AI system hai jo:
- Tumhare apne documents (PDF, Word, Excel) mein se answer dhundhta hai
- LLM (ChatGPT jaisa) ko sirf tumhare documents ki knowledge deta hai
- Company ki private information pe kaam karta hai

```
Normal ChatGPT:
User: "Hamari company mein kitne sick leaves milte hain?"
GPT:  "Mujhe nahi pata" ❌ (kyunki training mein nahi tha)

RAG System:
User: "Hamari company mein kitne sick leaves milte hain?"
RAG:  "10 sick leaves milte hain" ✅ (tumhare document se nikala)
```

---

## Is Assignment Mein Kya Banaya

**Ingestion Pipeline** — Yeh woh part hai jo documents ko process karke
database mein store karta hai, taaki baad mein search kiya ja sake.

```
PDF Upload
    ↓
Text Extract
    ↓
Chunks Banao
    ↓
Embeddings Banao
    ↓
PostgreSQL mein Store
```

---

## Project Structure

```
rag-ingestion/
│
├── backend/
│   ├── uploads/          ← PDF files yahan temporarily save hoti hain
│   ├── .env              ← Database URL aur PORT
│   ├── package.json      ← Node.js dependencies
│   ├── db.js             ← PostgreSQL connection aur table setup
│   ├── ingestion.js      ← Main pipeline (4 steps)
│   └── server.js         ← Express API server
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   └── App.jsx       ← React UI
    └── package.json
```

---

## Technologies Used

| Technology | Kaam | Version |
|---|---|---|
| React | Frontend UI | 18+ |
| Node.js | Backend runtime | 22 |
| Express | HTTP server | 4+ |
| PostgreSQL | Vector database | Neon.tech (cloud) |
| pgvector | Vectors store karna | Latest |
| pdf2json | PDF se text nikalna | Latest |
| @xenova/transformers | Local embeddings banana | Latest |
| multer | File upload handle karna | Latest |
| pg | PostgreSQL se connect karna | Latest |
| cors | React-Node connect karna | Latest |
| dotenv | .env file padhna | Latest |

---

## Har File Ka Kaam

### 1. db.js — Database Connection

```
Kaam:
→ PostgreSQL (Neon.tech) se connect karta hai
→ pgvector extension enable karta hai
→ documents table automatically banata hai
→ Fast search ke liye vector index banata hai

Table Structure:
┌─────────────┬───────────────┬─────────────────────┐
│ Column      │ Type          │ Kaam                │
├─────────────┼───────────────┼─────────────────────┤
│ id          │ SERIAL        │ Auto ID             │
│ text        │ TEXT          │ Chunk ka text       │
│ embedding   │ vector(384)   │ 384 numbers         │
│ source      │ TEXT          │ File ka naam        │
│ chunk_index │ INTEGER       │ Chunk number        │
│ uploaded_at │ TIMESTAMP     │ Upload time         │
└─────────────┴───────────────┴─────────────────────┘
```

### 2. ingestion.js — Main Pipeline (4 Steps)

```
STEP 1: PDF se Text Nikalo
→ Library: pdf2json
→ PDF ka har page padhta hai
→ Text extract karta hai
→ Clean karta hai (extra spaces hatata hai)
→ Output: 722 words (sample PDF ke liye)

STEP 2: Text ko Chunks mein Todo
→ 250 words per chunk
→ 30 words overlap (context preserve karne ke liye)
→ Output: 4 chunks (sample PDF ke liye)

Overlap kyun?
Chunk 1: words 1-250
Chunk 2: words 221-470  ← 30 words overlap
Chunk 3: words 441-690  ← 30 words overlap
Isse ek sentence ke beech mein cut nahi hota!

STEP 3: Chunks ko Vectors mein Badlo (Embeddings)
→ Model: Xenova/all-MiniLM-L6-v2
→ Local PC pe chalta hai (No API Key!)
→ Har chunk → 384 numbers
→ "sick leaves" → [-0.04, 0.007, 0.087, ...]
→ Similar text ke similar numbers hote hain!

STEP 4: PostgreSQL mein Store Karo
→ Library: pg
→ Har chunk alag row mein store hota hai
→ Text + Vector + Source sab save hota hai
```

### 3. server.js — Express Server

```
2 Routes:

POST /upload
→ multer file receive karta hai
→ ingestion pipeline call karta hai
→ Result return karta hai

GET /documents
→ Stored documents ki list return karta hai
→ Frontend mein table mein dikhta hai
```

### 4. App.jsx — React Frontend

```
Features:
→ PDF file select karna
→ "Start Ingestion" button
→ Live logs terminal style mein
→ Result card (chunks, time)
→ Stored documents table
```

---

## Poora Flow — Step by Step

```
👤 USER
   PDF select karke "Start Ingestion" click karta hai
   │
   ▼
⚛️  REACT (App.jsx)
   POST /upload request bhejta hai file ke saath
   │
   ▼
🟢 NODE.JS SERVER (server.js)
   multer file receive karta hai → uploads/ folder mein save
   ingestion.js ko call karta hai
   │
   ▼
⚙️  INGESTION PIPELINE (ingestion.js)
   │
   ├── STEP 1: PDF → Text
   │   pdf2json → 722 words extract
   │
   ├── STEP 2: Text → Chunks
   │   250 words per chunk → 4 chunks bane
   │
   ├── STEP 3: Chunks → Vectors
   │   all-MiniLM-L6-v2 model → 384 numbers per chunk
   │   (Local PC pe! No API needed!)
   │
   └── STEP 4: Vectors → PostgreSQL
       pg library → 4 rows insert
   │
   ▼
🗄️  POSTGRESQL (Neon.tech Cloud)
   documents table mein store hua:
   
   id | text              | embedding      | source    | chunk
   1  | EMPLOYMENT CON... | [-0.04, 0.007] | legal.pdf | 0
   2  | days) Maternity.. | [-0.047, 0.08] | legal.pdf | 1
   3  | to keep all co... | [-0.041, 0.08] | legal.pdf | 2
   4  | The decision o... | [-0.038, 0.06] | legal.pdf | 3
   │
   ▼
✅ INGESTION COMPLETE!
   File: sample_legal_contract.pdf
   Chunks: 4
   Time: 2.43 seconds
```

---

## Setup Aur Run Kaise Karein

### Prerequisites
```
Node.js v22+
npm
Neon.tech account (free)
```

### Step 1 — Clone/Download Project
```bash
cd rag-ingestion
```

### Step 2 — Backend Setup
```bash
cd backend
npm install
```

### Step 3 — .env File Banao
```env
PORT=5000
DATABASE_URL=postgresql://user:pass@host/dbname
```

### Step 4 — Frontend Setup
```bash
cd ../frontend
npm install
```

### Step 5 — Run Karo
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

### Step 6 — Browser mein kholo
```
http://localhost:3000
```

---

## Test Kaise Karein

```
1. Browser mein http://localhost:3000 kholo
2. "Choose File" click karo
3. sample_legal_contract.pdf select karo
4. "Start Ingestion" click karo
5. Live logs dekho:
   ✅ Step 1: Extracting text...
   ✅ Step 2: Creating chunks...
   ✅ Step 3: Creating embeddings...
   ✅ Step 4: Storing in PostgreSQL...
   🎉 INGESTION COMPLETE!
6. Neon.tech pe jaake verify karo:
   SELECT * FROM documents;
```

---

## Key Concepts Explained

### Chunking Kya Hai?
```
Bade document ko chhote pieces mein todna.

Kyun?
→ LLM ek baar mein poora document nahi padh sakta
→ Chhote chunks mein relevant part dhundhna easy hai
→ Token cost kam hoti hai

Example:
Document: 10 pages
Chunk size: 250 words
Result: ~20 chunks
```

### Embedding Kya Hai?
```
Text ko numbers mein convert karna.

"sick leaves"   → [-0.04, 0.08, 0.12, ...]
"annual leaves" → [-0.03, 0.09, 0.11, ...]  ← similar!
"football"      → [0.92, -0.45, 0.33, ...]  ← different!

Similar meaning = similar numbers
Isse semantic search possible hota hai!
```

### Vector Database Kya Hai?
```
Normal Database:
"sick" dhundho → sirf "sick" wale results

Vector Database:
"sick" dhundho → "sick", "ill", "unwell", "leaves" sab milte hain
                 kyunki vectors similar hain!

PostgreSQL + pgvector = Vector Database! ✅
```

### Overlap Kyun?
```
Bina overlap:
Chunk 1: "...Employee is entitled to 10"
Chunk 2: "sick leaves per year. The..."

Ek important sentence 2 chunks mein split ho gaya!

Overlap ke saath:
Chunk 1: "...Employee is entitled to 10 sick leaves per year."
Chunk 2: "...10 sick leaves per year. The termination..."

Ab dono chunks mein puri baat hai! ✅
```

---

## Database Verify Karna

Neon.tech pe SQL Editor mein yeh queries run karo:

```sql
-- Sab documents dekho
SELECT id, source, chunk_index, LEFT(text, 80) as preview
FROM documents
ORDER BY id;

-- Kitne chunks hain
SELECT COUNT(*) as total_chunks FROM documents;

-- Kaunsi files hain
SELECT DISTINCT source, COUNT(*) as chunks
FROM documents
GROUP BY source;
```

---

## Errors Jo Aaye Aur Fix

| Error | Cause | Fix |
|---|---|---|
| pdfParse is not a function | pdf-parse library issue | pdf2json use kiya |
| 401 Incorrect API key | Wrong OpenAI key | Local embeddings use kiye |
| 429 Quota exceeded | OpenAI credits khatam | Xenova local model use kiya |
| expected 768 dimensions | DB size mismatch | vector(768) → vector(384) |
| URI malformed | PDF encoding issue | try-catch lagaya |

---

## Agle Steps — Retrieval Pipeline

```
Ingestion Pipeline Complete ✅

Agle mein banana hai:

User Question
      ↓
Question → Vector (384 numbers)
      ↓
PostgreSQL mein similar vectors dhundo
      ↓
Top 3-5 chunks nikalo
      ↓
LLM (GPT/Gemini) ko bhejo
      ↓
Final Answer! ✅
```

---

## Project Summary

```
Kya sikha:
✅ RAG kya hai aur kyun use karte hain
✅ Ingestion Pipeline ke 4 steps
✅ PDF se text kaise nikalte hain
✅ Chunking strategy (size + overlap)
✅ Embeddings kya hain (text → numbers)
✅ Vector database kya hai
✅ PostgreSQL + pgvector setup
✅ React + Node.js + Express integration
✅ Neon.tech cloud database use karna
✅ Debugging aur error fixing
```

---

*Made with ❤️ while learning RAG — June 2026*