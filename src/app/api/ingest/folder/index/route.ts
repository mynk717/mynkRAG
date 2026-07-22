import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { SrtParser, VttParser } from "@/lib/parsers/subtitle-parser";
import { SubtitleChunker } from "@/lib/chunking/subtitle-chunker";
import { PostgresVectorService } from "@/lib/vector/postgres";
import { getEmbedding } from "@/lib/embeddings/openai";
import { SubtitleCue, RetrievalChunk } from "@/lib/types/subtitle";

function scanDirectory(dir: string, fileList: string[] = []): string[] {
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== "__MACOSX") {
        scanDirectory(filePath, fileList);
      }
    } else {
      const ext = path.extname(file).toLowerCase();
      if (ext === ".srt" || ext === ".vtt") {
        fileList.push(filePath);
      }
    }
  }
  return fileList;
}

export async function POST(req: Request) {
  try {
    const { folderPath } = await req.json();
    if (!folderPath || !fs.existsSync(folderPath)) {
      return NextResponse.json({ error: "Directory folder path does not exist" }, { status: 400 });
    }

    const allFiles = scanDirectory(folderPath);
    if (allFiles.length === 0) {
      return NextResponse.json({ error: "No subtitle files found" }, { status: 404 });
    }

    // Canonical source selection:
    // Group files by module name + lesson name (parent folder base + basename minus extension)
    // Preference order: .vtt over .srt for WebVTT format natively
    const groups: Record<string, { vtt?: string; srt?: string }> = {};

    for (const filePath of allFiles) {
      const parentDir = path.basename(path.dirname(filePath));
      const fileName = path.basename(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const baseName = fileName.replace(/\.[^/.]+$/, ""); // strip extension

      // Unique key representing lesson identity
      const lessonKey = `${parentDir}/${baseName}`.toLowerCase();

      if (!groups[lessonKey]) {
        groups[lessonKey] = {};
      }
      if (ext === ".vtt") {
        groups[lessonKey].vtt = filePath;
      } else if (ext === ".srt") {
        groups[lessonKey].srt = filePath;
      }
    }

    const selectedFiles: { path: string; reason: string }[] = [];
    const skippedFiles: { path: string; reason: string }[] = [];

    for (const key of Object.keys(groups)) {
      const group = groups[key];
      if (group.vtt) {
        selectedFiles.push({ path: group.vtt, reason: "Preferred WebVTT over SubRip (SRT)" });
        if (group.srt) {
          skippedFiles.push({ path: group.srt, reason: "Duplicate subtitle file: WebVTT variant selected" });
        }
      } else if (group.srt) {
        selectedFiles.push({ path: group.srt, reason: "Selected SubRip (SRT) as default" });
      }
    }

    const srtParser = new SrtParser();
    const vttParser = new VttParser();
    const chunker = new SubtitleChunker();
    const vectorStore = new PostgresVectorService();

    let totalCuesCount = 0;
    let totalChunksIndexed = 0;

    // For safety during initial local testing, limit chunk embedding load to first 5 canonical files.
    // In production, this can process all files or run in a background worker.
    const filesToProcess = selectedFiles.slice(0, 5);

    for (const file of filesToProcess) {
      const ext = path.extname(file.path).toLowerCase();
      const content = fs.readFileSync(file.path, "utf-8");
      
      const fileName = path.basename(file.path);
      const parentDirName = path.basename(path.dirname(file.path));
      const moduleName = path.basename(path.dirname(path.dirname(file.path)));
      const lessonName = `${parentDirName} - ${fileName}`;
      const sourceId = fileName.replace(/\.[^/.]+$/, "");

      let cues: SubtitleCue[] = [];
      if (ext === ".srt") {
        cues = await srtParser.parse(content, lessonName, sourceId);
      } else if (ext === ".vtt") {
        cues = await vttParser.parse(content, lessonName, sourceId);
      }

      const chunks = chunker.createChunks(cues);
      
      // Generate embeddings and populate chunks
      for (const chunk of chunks) {
        const embedding = await getEmbedding(chunk.chunk_text);
        chunk.embedding = embedding;
        chunk.source_type = "local_folder";
        chunk.source_url = file.path;
        chunk.metadata = {
          source_path: file.path,
          module_name: moduleName,
          source_type: "file"
        };
      }

      if (chunks.length > 0) {
        await vectorStore.upsertChunks(chunks);
      }

      totalCuesCount += cues.length;
      totalChunksIndexed += chunks.length;
    }

    return NextResponse.json({
      summary: {
        totalFilesFound: allFiles.length,
        canonicalSelected: selectedFiles.length,
        processedCount: filesToProcess.length,
        totalCuesIndexed: totalCuesCount,
        totalChunksIndexed,
      },
      selectionReport: {
        selected: selectedFiles,
        skipped: skippedFiles,
      }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to index folder contents" }, { status: 500 });
  }
}
