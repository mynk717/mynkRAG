import { PostgresVectorService } from "@/lib/vector/postgres";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const service = new PostgresVectorService();
    await service.ensureTable();
    return NextResponse.json({ success: true, message: "pgvector schema, table, and HNSW index initialized successfully" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Failed to initialize pgvector database schema" }, { status: 500 });
  }
}
