import { OpenAI } from "openai";
import { GroundedAnswer, RetrievalChunk } from "../types/subtitle";

export class AnswerGenerator {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateGroundedAnswer(
    query: string,
    contexts: RetrievalChunk[]
  ): Promise<GroundedAnswer> {
    if (contexts.length === 0) {
      return {
        answer:
          "I couldn't find anything relevant in the indexed transcripts for this question. Try rephrasing, or make sure the relevant course videos have been uploaded.",
        source_lesson: "",
        timestamp_range: "",
        transcript_snippets: [],
        explanation: "",
      };
    }

    const contextPayload = contexts
      .map(
        (ctx, idx) =>
          `[Excerpt ${idx + 1}] ${ctx.lesson_name} · ${ctx.start_label} → ${ctx.end_label}\n${ctx.chunk_text}`
      )
      .join("\n\n");

    const systemPrompt = `You are a knowledgeable course assistant. A student has asked a question and you have been given relevant excerpts from course video transcripts.

Your job is to write a helpful, natural response — the way a patient, expert instructor would explain the concept after reviewing the transcript.

Rules:
- Answer the student's question directly and conversationally. Do NOT reference "context blocks", "chunk 1", "the provided text", or any internal retrieval terms.
- If the transcripts clearly answer the question, summarise what the instructor said, using your own words. Keep it concise (2–4 sentences max).
- Pick the single most relevant excerpt for source attribution. You may quote a short phrase (≤20 words) verbatim as evidence — use quotation marks.
- If the transcripts do not contain a clear answer, say so honestly in one sentence and suggest the student check the relevant course section.
- Never fabricate facts not present in the excerpts.

Respond ONLY with a JSON object in this exact shape (no markdown wrapper):
{
  "answer": "Conversational explanation answering the question.",
  "source_lesson": "Name of the primary source lesson.",
  "timestamp_range": "HH:MM:SS – HH:MM:SS",
  "transcript_snippets": ["One short verbatim quote that supports the answer."],
  "explanation": "One optional sentence of extra context or related detail from the transcript, if useful."
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Student question: ${query}\n\nTranscript excerpts:\n${contextPayload}`,
          },
        ],
        response_format: { type: "json_object" },
      });

      const parsed: GroundedAnswer = JSON.parse(
        response.choices[0].message.content || "{}"
      );
      return parsed;
    } catch (error: any) {
      console.error("Grounded answer generation failed:", error);
      return {
        answer:
          "Something went wrong while generating your answer. Please try again.",
        source_lesson: contexts[0]?.lesson_name ?? "",
        timestamp_range: contexts[0]
          ? `${contexts[0].start_label} – ${contexts[0].end_label}`
          : "",
        transcript_snippets: contexts[0] ? [contexts[0].chunk_text] : [],
        explanation: error.message || "",
      };
    }
  }
}
