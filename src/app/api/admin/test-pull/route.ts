import { NextResponse } from "next/server";
import { getEmbedding } from "@/lib/embeddings/openai";
import { PostgresVectorService } from "@/lib/vector/postgres";

export async function GET() {
  try {
    const query = "Verify pgvector inserts";
    const queryVector = await getEmbedding(query);

    const service = new PostgresVectorService();
    const results = await service.search(queryVector, 2);

    return NextResponse.json({
      success: true,
      message: "Pull similarity search executed successfully",
      query,
      results
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed pull validation" }, { status: 500 });
  }
}
