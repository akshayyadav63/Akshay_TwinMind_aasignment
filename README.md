🧠 Second Brain — AI Knowledge Companion

Full-Stack & AI Systems Design Prototype

A foundational prototype of a “Second Brain” AI companion that ingests documents, audio, and text, stores them with semantic memory, and answers natural-language questions using hybrid retrieval (vector + keyword) and LLM synthesis.

.

📌 Project Goals

Build a scalable, modular AI system from first principles

Support multi-modal ingestion (documents, audio, text; extensible to images & web)

Enable semantic + keyword search with temporal awareness

Demonstrate strong system architecture, data flow, and AI integration


🏗️ High-Level Architecture
Browser (React)
   │
   ▼
Node.js + Express API
   │
   ├── Redis Queue (BullMQ)
   │        │
   │        ▼
   │   Background Worker
   │   (chunking, embeddings)
   │
   ▼
PostgreSQL (Neon + pgvector)
   │
   ▼
LLM (OpenAI)

🧩 Key Components
Frontend

React chat interface

File upload UI

Streaming AI responses (optional)

Backend

Node.js + Express

REST API for ingestion and Q&A

Redis job queue for async processing

Storage

Neon PostgreSQL

pgvector extension for embeddings

Chunk-level metadata with timestamps

AI

OpenAI Embeddings (vector search)

OpenAI Chat Completion (answer synthesis)

🔄 Multi-Modal Ingestion Pipeline
Supported Modalities (current)

📄 Documents (PDF, Markdown)

🎵 Audio (MP3 / M4A via transcription)

✍️ Plain text

Pipeline Flow

User uploads file or text

API stores metadata

Job pushed to Redis queue

Worker:

Extracts text

Chunks content

Generates embeddings

Stores in Postgres (pgvector)

🧠 Retrieval Strategy (Hybrid)

Semantic Search
Vector similarity using pgvector

Keyword Search (Optional Extension)
PostgreSQL Full-Text Search (FTS)

Temporal Filtering
Every chunk has created_at timestamp
Enables queries like:
“What did I work on last week?”

⚙️ Tech Stack
Layer	Technology
Frontend	React
Backend	Node.js, Express
Database	Neon PostgreSQL
Vector DB	pgvector
Queue	Redis + BullMQ
AI	OpenAI API
OS Support	Windows (via Docker for Redis)

🚀 How to Run Locally (Step-by-Step)
1️⃣ Prerequisites

Node.js (v18+)
Docker Desktop (for Redis)
Neon account
OpenAI API key
git clone https://github.com/akshayyadav63/Akshay_TwinMind_aasignment
cd second-brain
docker run -d --name redis -p 6379:6379 redis

4️⃣ Backend Setup
cd server
npm install

OPENAI_API_KEY=sk-xxxxxxxx
DATABASE_URL=postgresql://user:password@ep-xxxx.neon.tech/neondb
REDIS_URL=redis://localhost:6379

Start Backend API
npm run dev

