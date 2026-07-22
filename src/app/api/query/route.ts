import { NextResponse } from "next/server";
import { HybridRetriever } from "@/lib/retrieval/hybrid";
import { AnswerGenerator } from "@/lib/answer/answer-generator";

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    if (!query || !query.trim()) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const retriever = new HybridRetriever();
    const generator = new AnswerGenerator();

    const contexts = await retriever.retrieve({ query, topK: 4 });
    const groundedResult = await generator.generateGroundedAnswer(query, contexts);

    const matchingContext = contexts.find(c => c.lesson_name === groundedResult.source_lesson) || contexts[0];

    return NextResponse.json({
      answer: groundedResult.answer,
      sourceLesson: groundedResult.source_lesson,
      timestampRange: groundedResult.timestamp_range,
      snippets: groundedResult.transcript_snippets.length > 0 ? groundedResult.transcript_snippets : contexts.slice(0, 1).map(c => c.chunk_text),
      explanation: groundedResult.explanation,
      sourceUrl: matchingContext?.source_url || null,
      sourceType: matchingContext?.source_type || null,
      startMs: matchingContext?.start_ms || null,
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to process query" }, { status: 500 });
  }
}
