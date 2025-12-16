Second Brain — System Design & Prototype (React + Node + Express + React)

Deliverable: Comprehensive system design document + implementation plan + runnable prototype code snippets and instructions.

Table of Contents

Executive Summary

High-Level Architecture (diagram + components)

Multi-Modal Ingestion Pipeline

Audio

Documents

Web Content

Plain Text

Images

Information Retrieval & Querying Strategy (hybrid design)

Data Indexing & Storage Model

Chunking rules

Indexing techniques

Schemas (SQL & vector index)

Temporal Querying Support

Scalability, Privacy & Deployment Options

Backend Implementation Plan (Node + Express)

Async pipeline (implementation notes & sample code)

Q&A endpoint (retrieval + LLM orchestration)

Job queue and worker examples

Frontend Implementation Plan (React)

Chat UI

Streaming responses

Upload/ingest UI

Security, Observability & Testing

Deliverables & How to run locally (dev script) + CI/CD notes

Tradeoffs & Alternatives (short)

Appendix: API specs, DB schema SQL, sample code files

1. Executive Summary

This document describes a robust, scalable, and privacy-minded architecture for a "Second Brain" personal AI companion. The design prioritizes:

Hybrid retrieval: semantic search (vector similarity) + full-text search + graph relationships to capture different query types and support inference over both facts and relationships.

Modular ingestion: clear, asynchronous ingestion pipeline for audio, documents, web content, and images.

Temporal awareness: every piece of content stores timestamps and optional event context so time-based queries are first-class.

Privacy-first options: local-first deployment for privacy-sensitive users; cloud-hosted for easy scaling.

The document includes diagrams, schemas, and runnable code samples (Node/Express for backend workers + API, React for frontend chat). It also outlines how to implement transcription, chunking, embeddings, and LLM orchestration.

2. High-Level Architecture
flowchart LR
  User[User: Browser / Mobile]
  subgraph FE[Frontend]
    ChatUI[Chat UI]
    UploadUI[Upload / Link]
  end
  FE --> API[Backend API (Node + Express)]
  API --> Queue[(Message Queue: Redis/BullMQ or RabbitMQ)]
  Queue --> Worker1[Worker: Ingest (transcribe, extract, chunk)]
  Worker1 --> Storage[(Blob Store: S3 / MinIO)]
  Worker1 --> DB[(Metadata DB: Postgres + pgvector)]
  Worker1 --> VectorDB[(Vector DB: Pinecone / Weaviate / RedisVector / Chroma)]
  API --> Retriever[Retriever Service]
  Retriever --> VectorDB
  Retriever --> SearchEngine[(Full-text: Postgres FTS or ElasticSearch)]
  Retriever --> GraphDB[(Neo4j optional)]
  Retriever --> LLM[(LLM orchestration: OpenAI / Anthropic / local LLM)]
  LLM --> API


  style Storage fill:#f9f,stroke:#333
  style VectorDB fill:#ff9,stroke:#333
  style DB fill:#9f9,stroke:#333

Component list

Frontend: React app for chat, uploads, and settings.

API: Node + Express endpoints for ingest, query, user management.

Queue & Workers: Redis + BullMQ (or RabbitMQ) to process heavy jobs asynchronously (transcription, OCR, scraping, chunking, embedding).

Blob storage: S3 or MinIO for files (audio, PDFs, images).

Metadata DB: Postgres with pgvector to store chunk metadata and provide full-text search via Postgres FTS.

Vector DB: Pinecone/Weaviate/RedisVector for efficient vector similarity search.

Graph DB (optional): Neo4j for complex relationship queries; can be built later.

LLM: OpenAI / Anthropic for generation; optionally a local LLM for privacy.

Auth: JWT + refresh tokens; optional OAuth for integrations.

3. Multi-Modal Ingestion Pipeline
Goals

Accept multiple modalities and create normalized text chunks with metadata and embeddings.

Run ingestion asynchronously and idempotently.

Store original files and extracted structured metadata.

Flow (per item)

User uploads file or submits URL.

API stores raw file in Blob storage and creates a ingest_job record in Postgres.

API pushes job to queue.

Worker picks up job, downloads file, runs modality-specific extractors:

Audio -> Transcription (Whisper/OpenAI/AssemblyAI)

PDF/MD -> Text extraction (pdfminer, Apache Tika, or cloud OCR)

URL -> Headless browser scrape (Playwright) + content cleaning

Image -> OCR (Tesseract) + optional image captioning (CLIP/ViT)

Normalizer: cleans text, splits into semantic chunks (see chunking rules).

Embeddings: call embedding model for each chunk.

Index: persist chunks and metadata to Postgres and vector DB.

Mark job complete.

Audio (detailed)

Use OpenAI Whisper (or cloud ASR like AssemblyAI) for transcription.

Capture speaker diarization if available (tag speakers).

Keep transcript timestamps for each utterance.

Chunk by semantic boundaries (speaker turn + 300–800 tokens, with 50 token overlap).

Store both raw transcript and chunked segments.

Why Whisper? Open-source Whisper works well offline; cloud ASR gives higher accuracy and more features like diarization.

Documents

PDFs: Extract with pdfminer.six or Apache Tika; fall back to OCR for scanned PDFs using Tesseract.

Markdown: parse frontmatter, extract headings, maintain document structure.

For each document store: source_url (if any), original filename, content-type, page count, author (if detectable), created_at.

Web Content

Use Playwright to render JS-heavy pages, then extract main article content using Readability or Mercury parser logic.

Respect robots.txt and rate-limit.

Save page snapshot (HTML) and plaintext.

Images

Store in S3/MinIO and generate thumbnail.

Store captions (via an image captioning model) and any OCR text as searchable text.

Link images to documents/chunks with source_type = 'image'.

Plain Text

Minimal processing: normalize whitespace, sentence-split, and chunk.

4. Information Retrieval & Querying Strategy
Requirements

Fast, relevant context retrieval for LLM prompts.

Support for temporal filters and relationship queries.

Support for both factoid lookups and generative summarization.

Chosen Approach: Hybrid Retrieval

Semantic search via vector DB (primary relevance ranking).

Full-text / BM25 via Postgres FTS (useful for exact phrase and negation queries).

Graph relationships via Neo4j for queries that involve relations ("who reported to whom?", "which docs are linked to project X?").

Temporal filtering applied at retrieval-time using chunk metadata — e.g., only consider chunks with captured_at in the requested window.

Why hybrid? Semantic embeddings handle paraphrase and abstract similarity. FTS handles exact matches, dates, and boolean queries. Graph DB handles explicit relationships that are expensive to infer from purely vector similarity.

Retrieval pipeline (query-time)

Parse user query and detect intent (QA, summarization, timeline, search, follow-up).

Optional query rewriting (clarify pronouns, expand entities) using a small LLM call.

If user asked for time-bounded results, apply time filter early.

Vector search: query vector DB for top-K semantically similar chunks.

FTS search: run Postgres full-text query to get top-M results; union with vector results (dedupe by chunk id).

Merge & score: combine vector similarity score and FTS relevance score using configurable weights. Optionally boost recent documents.

Optional graph traversal: if the query suggests relationship exploration, query Neo4j to retrieve nodes/relations as additional context.

Rerank and select final N chunks for LLM context window (e.g., 6–12 chunks depending on size).

Prompting pattern: Use a retrieval-augmented generation (RAG) approach. Provide selected chunks as context, specify citation format (source + chunk id + timestamp), and ask model to synthesize and cite sources.

5. Data Indexing & Storage Model
Lifecycle of a piece of information (example: meeting audio)

Raw file uploaded -> saved to s3://bucket/userid/fileid.

ingest_job created with status pending.

Worker transcribes and extracts text -> produces transcript + timestamped utterances.

Normalizer segments into chunks (text + metadata).

For each chunk compute embedding and insert into vector_db and chunks table.

UI and API read from Postgres and vector DB for retrieval.
