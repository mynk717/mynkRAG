import { Client } from "pg";
import { RetrievalChunk } from "../types/subtitle";

export class PostgresVectorService {
  private getClient(): Client {
    return new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false,
      },
    });
  }

  async ensureTable(): Promise<void> {
    const client = this.getClient();
    try {
      await client.connect();
      await client.query("CREATE EXTENSION IF NOT EXISTS vector;");
      await client.query(`
        CREATE TABLE IF NOT EXISTS subtitle_chunks (
          id VARCHAR(255) PRIMARY KEY,
          lesson_name TEXT NOT NULL,
          chunk_text TEXT NOT NULL,
          start_ms INTEGER NOT NULL,
          end_ms INTEGER NOT NULL,
          start_label VARCHAR(50) NOT NULL,
          end_label VARCHAR(50) NOT NULL,
          cue_ids TEXT[] NOT NULL,
          token_count INTEGER NOT NULL,
          embedding vector(1536),
          metadata JSONB
        );
      `);
      
      // Dynamically add source_type and source_url columns if not present
      await client.query(`
        ALTER TABLE subtitle_chunks ADD COLUMN IF NOT EXISTS source_type VARCHAR(50);
        ALTER TABLE subtitle_chunks ADD COLUMN IF NOT EXISTS source_url TEXT;
      `);

      await client.query(`
        CREATE INDEX IF NOT EXISTS subtitle_chunks_embedding_idx 
        ON subtitle_chunks USING hnsw (embedding vector_cosine_ops);
      `);
    } finally {
      await client.end();
    }
  }

  async deleteChunksBySourceUrl(sourceUrl: string): Promise<void> {
    await this.ensureTable();
    const client = this.getClient();
    try {
      await client.connect();
      await client.query("DELETE FROM subtitle_chunks WHERE source_url = $1;", [sourceUrl]);
    } finally {
      await client.end();
    }
  }

  async upsertChunks(chunks: RetrievalChunk[]): Promise<void> {
    await this.ensureTable();
    const client = this.getClient();
    try {
      await client.connect();
      for (const chunk of chunks) {
        const vectorStr = chunk.embedding ? `[${chunk.embedding.join(",")}]` : null;
        await client.query(
          `INSERT INTO subtitle_chunks (
            id, lesson_name, chunk_text, start_ms, end_ms, 
            start_label, end_label, cue_ids, token_count, 
            embedding, metadata, source_type, source_url
          )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
           ON CONFLICT (id) DO UPDATE SET
             lesson_name = EXCLUDED.lesson_name,
             chunk_text = EXCLUDED.chunk_text,
             start_ms = EXCLUDED.start_ms,
             end_ms = EXCLUDED.end_ms,
             start_label = EXCLUDED.start_label,
             end_label = EXCLUDED.end_label,
             cue_ids = EXCLUDED.cue_ids,
             token_count = EXCLUDED.token_count,
             embedding = EXCLUDED.embedding,
             metadata = EXCLUDED.metadata,
             source_type = EXCLUDED.source_type,
             source_url = EXCLUDED.source_url;`,
          [
            chunk.chunk_id,
            chunk.lesson_name,
            chunk.chunk_text,
            chunk.start_ms,
            chunk.end_ms,
            chunk.start_label,
            chunk.end_label,
            chunk.cue_ids,
            chunk.token_count,
            vectorStr,
            JSON.stringify(chunk.metadata || {}),
            chunk.source_type || "upload",
            chunk.source_url || null,
          ]
        );
      }
    } finally {
      await client.end();
    }
  }

  async search(queryVector: number[], topK: number = 10): Promise<RetrievalChunk[]> {
    const client = this.getClient();
    try {
      await client.connect();
      const vectorStr = `[${queryVector.join(",")}]`;
      const res = await client.query(
        `SELECT id, lesson_name, chunk_text, start_ms, end_ms, start_label, end_label, cue_ids, token_count, metadata, source_type, source_url,
                (1 - (embedding <=> $1::vector)) AS similarity
         FROM subtitle_chunks
         ORDER BY embedding <=> $1::vector
         LIMIT $2;`,
        [vectorStr, topK]
      );

      return res.rows.map((row: any) => ({
        chunk_id: row.id,
        lesson_name: row.lesson_name,
        chunk_text: row.chunk_text,
        start_ms: row.start_ms,
        end_ms: row.end_ms,
        start_label: row.start_label,
        end_label: row.end_label,
        cue_ids: row.cue_ids,
        token_count: row.token_count,
        source_type: row.source_type,
        source_url: row.source_url,
        metadata: {
          ...row.metadata,
          similarity: row.similarity,
        },
      }));
    } finally {
      await client.end();
    }
  }
}
