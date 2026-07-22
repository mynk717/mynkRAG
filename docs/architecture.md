# Advanced Subtitle RAG Architecture Blueprint

## System Overview
This project implements an advanced RAG (Retrieval-Augmented Generation) system for course and video subtitle knowledge retrieval grounded strictly in SRT and WebVTT transcript evidence.

## Core Architecture & Components
1. **Ingestion Layer (`src/lib/ingest/adapters.ts`)**
   - `UploadAdapter`: Accepts `.srt` and `.vtt` file uploads.
   - `YouTubeTranscriptAdapter`: Fetches transcripts from YouTube URLs.
   - `YtDlpSubtitleAdapter`: Robust extraction via yt-dlp.
   - `WhisperFallbackAdapter`: Audio transcription fallback when no subtitle track exists.

2. **Parsing & Normalization (`src/lib/parsers/`, `src/lib/normalizers/`)**
   - Parse raw subtitle cues into standardized timestamped models (`start_ms`, `end_ms`, timestamps labels).
   - Normalize transcript text for consistent vector and lexical indexing.

3. **Chunking & Indexing (`src/lib/chunking/`, `src/lib/vector/`)**
   - Sliding cue-window chunking (3-8 cues per chunk with 1-2 cue overlap).
   - Ingestion-time embedding generation.
   - Storage and search via Qdrant vector database (`src/lib/vector/qdrant.ts`).

4. **Retrieval & Grounded Generation (`src/lib/retrieval/`, `src/lib/answer/`)**
   - Low-latency parallel dense vector search + keyword (BM25) search.
   - Candidate reranking and neighbor cue expansion.
   - Grounded LLM response generation enforcing lesson name, timestamp range, and exact transcript snippets.

5. **Voice Interface (`src/lib/voice/`)**
   - Push-to-talk STT query input.
   - TTS playback of textual grounded answers.

## Implementation Roadmap
- **Phase 1**: File upload (.srt, .vtt), parsing, chunking, Qdrant indexing, grounded answer retrieval with timestamps.
- **Phase 2**: URL ingestion adapters (YouTube API, yt-dlp, Whisper fallback).
- **Phase 3**: Push-to-talk voice interface, cross-encoder reranking, session analytics.
