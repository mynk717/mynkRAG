import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { SrtParser, VttParser } from "@/lib/parsers/subtitle-parser";
import { SubtitleChunker } from "@/lib/chunking/subtitle-chunker";
import { SubtitleCue } from "@/lib/types/subtitle";

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

    const files = scanDirectory(folderPath);
    if (files.length === 0) {
      return NextResponse.json({ error: "No .srt or .vtt files found in directory" }, { status: 404 });
    }

    const srtParser = new SrtParser();
    const vttParser = new VttParser();
    const chunker = new SubtitleChunker();

    const results = [];
    let totalCuesCount = 0;
    let totalChunksCount = 0;

    // Limit to processing first 5 files for a safe summary/preview response to control footprint
    const filesToProcess = files.slice(0, 5);

    for (const filePath of filesToProcess) {
      const ext = path.extname(filePath).toLowerCase();
      const content = fs.readFileSync(filePath, "utf-8");
      
      const fileName = path.basename(filePath);
      const parentDirName = path.basename(path.dirname(filePath));
      // Derive lesson name: use parent folder name + file name for better clarity
      const lessonName = `${parentDirName} - ${fileName}`;
      const sourceId = fileName.replace(/\.[^/.]+$/, ""); // strip extension

      let cues: SubtitleCue[] = [];
      if (ext === ".srt") {
        cues = await srtParser.parse(content, lessonName, sourceId);
      } else if (ext === ".vtt") {
        cues = await vttParser.parse(content, lessonName, sourceId);
      }

      const chunks = chunker.createChunks(cues);
      totalCuesCount += cues.length;
      totalChunksCount += chunks.length;

      results.push({
        fileName,
        lessonName,
        cuesCount: cues.length,
        chunksCount: chunks.length,
        sampleChunks: chunks.slice(0, 2).map(c => ({
          chunk_id: c.chunk_id,
          chunk_text: c.chunk_text,
          start_label: c.start_label,
          end_label: c.end_label,
          token_count: c.token_count
        }))
      });
    }

    return NextResponse.json({
      summary: {
        totalFilesFound: files.length,
        processedCount: filesToProcess.length,
        totalCuesIndexed: totalCuesCount,
        totalChunksGenerated: totalChunksCount,
      },
      preview: results
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to process folder ingestion" }, { status: 500 });
  }
}
