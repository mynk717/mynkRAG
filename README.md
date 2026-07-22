# Subtitle RAG — Transcript-Grounded Q&A

A Next.js application that lets you index course subtitle files (.srt, .vtt) and YouTube video transcripts into a Neon Postgres + pgvector database, then ask natural-language questions grounded strictly in the indexed transcripts.

## Features

- **Upload & Index** — drag-and-drop single files, select a folder of subtitle files, or paste a YouTube URL
- **YouTube Ingestion** — pure Node.js caption extraction via `youtube-transcript` (no Python, Vercel-compatible)
- **Hybrid Retrieval** — direct vector search with conditional HyDE fallback for low-confidence queries
- **Grounded Answers** — GPT-4o-mini produces instructor-style responses with lesson name, timestamp range, and verbatim transcript evidence
- **pgvector** — Neon Postgres with HNSW indexing for fast cosine similarity search

## Tech Stack

- **Frontend** — Next.js 16 (App Router), Tailwind v4, inline CSS with CSS custom properties
- **Backend** — Next.js API Routes (Node.js serverless)
- **Database** — Neon Postgres + pgvector (`vector(1536)`, HNSW index)
- **Embeddings** — OpenAI `text-embedding-3-small`
- **LLM** — OpenAI `gpt-4o-mini`

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://<user>:<password>@<host>/<db>?sslmode=require
OPENAI_API_KEY=sk-...
```

> ⚠️ Never commit `.env` — it is listed in `.gitignore`.

### 3. Initialize the database schema

```bash
curl -X POST http://localhost:3000/api/admin/db-setup
```

This creates the `subtitle_chunks` table with `source_type`, `source_url` columns and an HNSW embedding index.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Ingestion Sources

| Source | How |
|---|---|
| `.srt` / `.vtt` files | Upload via sidebar (click or drag-and-drop, single or multi-file) |
| Folder | Browser folder-picker uploads all `.srt`/`.vtt` files recursively |
| YouTube URL | Paste URL in the YouTube tab — captions fetched via `youtube-transcript` npm package |
| Local server folder | Dev-only utility hidden under "Developer Ingest" in the sidebar |

## HyDE Configuration

Conditional HyDE (Hypothetical Document Embedding) is enabled by default. Tune via env vars:

```env
HYDE_SIMILARITY_THRESHOLD=0.35   # cosine similarity threshold (default 0.35)
HYDE_MIN_CONFIDENT_CHUNKS=2      # min chunks above threshold before skipping HyDE (default 2)
```

## Deployment (Vercel)

1. Push this repo to GitHub
2. Import into Vercel
3. Set `DATABASE_URL` and `OPENAI_API_KEY` as environment variables in the Vercel dashboard
4. Deploy — no Python runtime required

> **Note:** After first deploy, hit `POST /api/admin/db-setup` once to initialize the schema.
