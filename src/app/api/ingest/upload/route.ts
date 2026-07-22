import { NextResponse } from "next/server";
import { SrtParser, VttParser } from "@/lib/parsers/subtitle-parser";
import { SubtitleChunker } from "@/lib/chunking/subtitle-chunker";
import { PostgresVectorService } from "@/lib/vector/postgres";
import { getEmbedding } from "@/lib/embeddings/openai";
import { SubtitleCue } from "@/lib/types/subtitle";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const fileName = file.name;
    const ext = fileName.slice(fileName.lastIndexOf(".")).toLowerCase();
    
    if (ext !== ".srt" && ext !== ".vtt") {
      return NextResponse.json(
        { error: "Invalid file format. Only .srt and .vtt files are supported." },
        { status: 400 }
      );
    }

    const textContent = await file.text();
    const lessonName = fileName.replace(/\.[^/.]+$/, ""); // Use clean filename as lesson name
    const sourceId = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

    const srtParser = new SrtParser();
    const vttParser = new VttParser();
    const chunker = new SubtitleChunker();
    const vectorStore = new PostgresVectorService();

    let cues: SubtitleCue[] = [];
    if (ext === ".srt") {
      cues = await srtParser.parse(textContent, lessonName, sourceId);
    } else if (ext === ".vtt") {
      cues = await vttParser.parse(textContent, lessonName, sourceId);
    }

    if (cues.length === 0) {
      return NextResponse.json(
        { error: "No valid subtitle cues parsed from the file." },
        { status: 400 }
      );
    }

    const chunks = chunker.createChunks(cues);

    // Embed all chunks
    for (const chunk of chunks) {
      const embedding = await getEmbedding(chunk.chunk_text);
      chunk.embedding = embedding;
      chunk.source_type = "upload";
      chunk.source_url = fileName;
      chunk.metadata = {
        source_name: fileName,
        source_type: "file",
        uploaded_at: new Date().toISOString(),
      };
    }

    // Save to database
    await vectorStore.upsertChunks(chunks);

    return NextResponse.json({
      success: true,
      summary: {
        fileName,
        lessonName,
        totalCuesIndexed: cues.length,
        totalChunksIndexed: chunks.length,
      },
    });

  } catch (error: any) {
    console.error("File upload ingestion failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process uploaded file" },
      { status: 500 }
    );
  }
}
