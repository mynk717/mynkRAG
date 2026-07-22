import { NextResponse } from "next/server";
import { getEmbedding } from "@/lib/embeddings/openai";
import { PostgresVectorService } from "@/lib/vector/postgres";

export async function POST() {
  try {
    const text = "Verify pgvector inserts and dimensions correctness";
    const embedding = await getEmbedding(text);

    const testChunk = {
      chunk_id: "test-verif-chunk-id-12345",
      lesson_name: "Verification Lesson 01",
      chunk_text: text,
      start_ms: 1000,
      end_ms: 5000,
      start_label: "00:01",
      end_label: "00:05",
      cue_ids: ["cue-1"],
      token_count: 7,
      embedding: embedding,
      metadata: { debug: true, test_run: true }
    };

    const service = new PostgresVectorService();
    await service.upsertChunks([testChunk]);

    return NextResponse.json({
      success: true,
      message: "Push test row inserted successfully",
      data: {
        inserted_id: testChunk.chunk_id,
        lesson_name: testChunk.lesson_name,
        vector_dimension: embedding.length,
        embedding_preview: embedding.slice(0, 5)
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed push validation" }, { status: 500 });
  }
}
