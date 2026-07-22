import { NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";
import { SubtitleChunker } from "@/lib/chunking/subtitle-chunker";
import { PostgresVectorService } from "@/lib/vector/postgres";
import { getEmbedding } from "@/lib/embeddings/openai";
import { SubtitleCue } from "@/lib/types/subtitle";

/** Extract video ID from any YouTube URL format */
function parseVideoId(url: string): string | null {
  const patterns = [
    /(?:v=)([\w-]{11})/,           // ?v=ID
    /youtu\.be\/([\w-]{11})/,      // youtu.be/ID
    /embed\/([\w-]{11})/,          // /embed/ID
    /shorts\/([\w-]{11})/,         // /shorts/ID
  ];
  for (const pat of patterns) {
    const m = url.match(pat);
    if (m) return m[1];
  }
  return null;
}

function msToLabel(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  const ms3 = ms % 1_000;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(ms3).padStart(3, "0")}`;
}

async function fetchVideoTitle(videoId: string): Promise<string> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );
    if (res.ok) {
      const data = await res.json();
      if (data.title) return data.title as string;
    }
  } catch {
    /* fall through to fallback */
  }
  return `YouTube Video (${videoId})`;
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url?.trim()) {
      return NextResponse.json({ error: "YouTube URL is required" }, { status: 400 });
    }

    const videoId = parseVideoId(url.trim());
    if (!videoId) {
      return NextResponse.json(
        { error: "Could not parse a valid YouTube video ID from the provided URL." },
        { status: 400 }
      );
    }

    // 1. Fetch transcript via pure-Node npm package (no python3, no execFile)
    let rawItems: { text: string; duration: number; offset: number }[];
    try {
      rawItems = await YoutubeTranscript.fetchTranscript(videoId, { lang: "en" });
    } catch (err: any) {
      const msg: string = err?.message ?? "";
      if (msg.toLowerCase().includes("disabled") || msg.toLowerCase().includes("no transcript")) {
        return NextResponse.json(
          { error: "No captions are available for this video. The owner may have disabled them." },
          { status: 400 }
        );
      }
      if (msg.toLowerCase().includes("unavailable") || msg.toLowerCase().includes("private")) {
        return NextResponse.json(
          { error: "This video is unavailable or private." },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: `Failed to fetch transcript: ${msg || "Unknown error"}` },
        { status: 500 }
      );
    }

    if (!rawItems || rawItems.length === 0) {
      return NextResponse.json(
        { error: "No captions found for this video." },
        { status: 400 }
      );
    }

    // 2. Fetch real video title via oEmbed (no fallback needed — function handles it)
    const videoTitle = await fetchVideoTitle(videoId);

    // 3. Normalize to SubtitleCue schema
    const cues: SubtitleCue[] = rawItems.map((item, idx) => {
      const startMs = item.offset;
      const endMs = item.offset + item.duration;
      const cleanText = item.text.replace(/&#39;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"');
      return {
        source_id: videoId,
        source_type: "url",
        source_url: url.trim(),
        lesson_id: videoId,
        lesson_name: videoTitle,
        language: "en",
        cue_id: `yt-${videoId}-${idx}`,
        cue_index: idx,
        start_ms: startMs,
        end_ms: endMs,
        start_label: msToLabel(startMs),
        end_label: msToLabel(endMs),
        text: cleanText,
        normalized_text: cleanText.toLowerCase().trim(),
        is_generated: true,
        source_method: "yt_api",
      };
    });

    const chunker = new SubtitleChunker();
    const chunks = chunker.createChunks(cues);

    for (const chunk of chunks) {
      const embedding = await getEmbedding(chunk.chunk_text);
      chunk.embedding = embedding;
      chunk.source_type = "youtube";
      chunk.source_url = url.trim();
      chunk.metadata = {
        video_id: videoId,
        source_url: url.trim(),
        source_method: "youtube-transcript-npm",
        indexed_at: new Date().toISOString(),
      };
    }

    // 4. Replace existing chunks for this URL, then upsert fresh ones
    const vectorStore = new PostgresVectorService();
    await vectorStore.deleteChunksBySourceUrl(url.trim());
    await vectorStore.upsertChunks(chunks);

    return NextResponse.json({
      success: true,
      summary: {
        videoId,
        lessonName: videoTitle,
        totalCuesIndexed: cues.length,
        totalChunksIndexed: chunks.length,
      },
    });
  } catch (error: any) {
    console.error("YouTube ingestion failed:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process YouTube URL transcript" },
      { status: 500 }
    );
  }
}
