# Mynk RAG

Mynk RAG is a search and question-answering application designed for course transcripts and video lectures. It allows you to upload and index standard subtitle files (`.srt` and `.vtt`) or paste YouTube links to extract captions. Once indexed, you can ask questions via a conversational thread, obtaining precise answers grounded in the lecture transcripts, complete with source lesson names, timestamp ranges, and verbatim quotes.

## Features

- **SRT & VTT Upload** — Index single or multiple subtitle files directly from your computer.
- **YouTube Ingestion** — Paste any YouTube video URL to automatically fetch and index English captions.
- **Hybrid Retrieval** — Combines direct vector search with hypothetical document embeddings (HyDE) for better query accuracy.
- **Conversation Thread** — Visual interface showing sequential user questions and assistant answers without losing context.
- **Timestamp Grounding** — Every answer pins the specific timestamp offset where the topic is discussed.
- **Source Excerpts** — View exact verbatim segments from the lecture transcripts supporting the response.
- **Lesson Tracking** — Clear visual labels linking each answer to its primary source lesson.

## Tech Stack

- **Framework** — Next.js 16 (App Router) & TypeScript
- **Database** — Neon PostgreSQL + `pgvector`
- **Embeddings & LLM** — OpenAI API (`text-embedding-3-small` and `gpt-4o-mini`)
- **Deployment** — Optimized for Vercel Serverless (pure Node.js dependencies, no Python required)

## How It Works

1. **Ingest** — Select local subtitle files or paste a YouTube URL.
2. **Parse** — The application extracts captions into timestamped segments (or cues).
3. **Chunk & Embed** — Segments are merged into overlapping chunks and converted into 1536-dimensional vector embeddings using OpenAI.
4. **Store** — Embeddings are saved to PostgreSQL with an HNSW index.
5. **Retrieve** — Direct vector similarity search is performed. If results fall below a confidence threshold, the retriever falls back to a hypothetical generated answer (HyDE) to find matching contexts.
6. **Generate** — The LLM reads the retrieved context, generates a conversational answer, and attributes it to the exact lesson and timestamp.

## Local Setup

### Prerequisites
- Node.js (v22 or later recommended)
- A PostgreSQL database with the `vector` extension enabled (e.g., Neon Postgres)
- OpenAI API Key

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the project root:
```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
OPENAI_API_KEY=your_openai_key
```

### 3. Initialize Database Schema
Run the admin database setup endpoint once to configure the tables and indexes:
```bash
curl -X POST http://localhost:3000/api/admin/db-setup
```

### 4. Run Development Server
```bash
npm run dev
```
Navigate to [http://localhost:3000](http://localhost:3000) to use the app.

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string with SSL enabled. |
| `OPENAI_API_KEY` | Key for generating embeddings and running model reasoning. |
| `HYDE_SIMILARITY_THRESHOLD` | *Optional.* Cosine similarity threshold for direct retrieval. Defaults to `0.35`. |
| `HYDE_MIN_CONFIDENT_CHUNKS` | *Optional.* Min chunks needed above threshold to skip HyDE. Defaults to `2`. |

## Usage

1. **Upload Transcripts** — Expand the Library panel, click "Files" or "Folder", select `.srt` or `.vtt` transcripts, and click "Upload & Index".
2. **Import YouTube Video** — Click the "YouTube" tab in the sidebar, paste a video link, and click "Index YouTube Transcript".
3. **Ask Questions** — Type your query in the composer text area at the bottom and press Enter.
4. **Read Grounded Answers** — The answer will output the lesson source, exact timestamp window, clear explanation, and a collapsible evidence quote.

## Notes & Limitations

- **Timestamp Jumping** — The "Jump to timestamp" action button is only supported for YouTube imports (opening the video in a new tab at the correct second). It is hidden for local file uploads.
- **Dev-only Ingestion** — The local folder path ingest scanner is only loaded when `NODE_ENV=development` and is hidden in production.

## Screenshots

### Conversations & Q&A Flow
![Conversation Flow](./public/screenshots/conversation.jpg)

### Library & Knowledge Upload
![Polished Dashboard](./public/screenshots/dashboard.jpg)
