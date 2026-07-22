import { QdrantClient } from '@qdrant/js-client-rest';
import { RetrievalChunk } from '../types/subtitle';

export class VectorStoreService {
  private client: QdrantClient;

  constructor() {
    this.client = new QdrantClient({
      url: process.env.QDRANT_URL || 'http://localhost:6333',
      apiKey: process.env.QDRANT_API_KEY,
    });
  }

  async ensureCollection(collectionName: string = 'subtitles'): Promise<void> {
    try {
      const collections = await this.client.getCollections();
      const exists = collections.collections.some(c => c.name === collectionName);
      if (!exists) {
        await this.client.createCollection(collectionName, {
          vectors: {
            size: 1536, // Standard size for text-embedding-3-small or text-embedding-ada-002
            distance: 'Cosine',
          },
        });
      }
    } catch (error) {
      console.error('Failed to ensure Qdrant collection:', error);
      throw error;
    }
  }

  async upsertChunks(chunks: RetrievalChunk[], collectionName: string = 'subtitles'): Promise<void> {
    await this.ensureCollection(collectionName);
    const points = chunks.map((chunk) => ({
      id: chunk.chunk_id,
      vector: chunk.embedding || new Array(1536).fill(0),
      payload: {
        lesson_name: chunk.lesson_name,
        chunk_text: chunk.chunk_text,
        start_ms: chunk.start_ms,
        end_ms: chunk.end_ms,
        start_label: chunk.start_label,
        end_label: chunk.end_label,
        cue_ids: chunk.cue_ids,
        token_count: chunk.token_count,
        ...(chunk.metadata || {}),
      },
    }));

    // Chunk size limits for Qdrant batch payload
    const batchSize = 100;
    for (let i = 0; i < points.length; i += batchSize) {
      const batch = points.slice(i, i + batchSize);
      await this.client.upsert(collectionName, {
        wait: true,
        points: batch,
      });
    }
  }

  async search(queryVector: number[], topK: number = 10, collectionName: string = 'subtitles'): Promise<RetrievalChunk[]> {
    const results = await this.client.search(collectionName, {
      vector: queryVector,
      limit: topK,
      with_payload: true,
    });

    return results.map((res) => ({
      chunk_id: String(res.id),
      lesson_name: String(res.payload?.lesson_name || ''),
      chunk_text: String(res.payload?.chunk_text || ''),
      start_ms: Number(res.payload?.start_ms || 0),
      end_ms: Number(res.payload?.end_ms || 0),
      start_label: String(res.payload?.start_label || ''),
      end_label: String(res.payload?.end_label || ''),
      cue_ids: Array.isArray(res.payload?.cue_ids) ? res.payload.cue_ids.map(String) : [],
      token_count: Number(res.payload?.token_count || 0),
    }));
  }
}
