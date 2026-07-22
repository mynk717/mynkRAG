import { NextResponse } from "next/server";
import { Client } from "pg";

export async function GET() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    // Check if subtitle_chunks table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'subtitle_chunks'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      return NextResponse.json({ sources: [] });
    }

    // Query distinct lessons with aggregate chunk count and approximate cue count
    const res = await client.query(`
      SELECT 
        lesson_name, 
        COUNT(*) as chunks_count, 
        SUM(COALESCE(cardinality(cue_ids), 0)) as cues_count
      FROM subtitle_chunks
      GROUP BY lesson_name
      ORDER BY lesson_name ASC;
    `);

    const sources = res.rows.map((row: any) => ({
      name: row.lesson_name,
      chunks: parseInt(row.chunks_count, 10),
      cues: parseInt(row.cues_count, 10),
      status: "indexed",
    }));

    return NextResponse.json({ sources });
  } catch (error: any) {
    console.error("Failed to query indexed sources:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch indexed sources" },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}
