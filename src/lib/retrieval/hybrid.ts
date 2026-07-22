import { PostgresVectorService } from "../vector/postgres";
import { getEmbedding } from "../embeddings/openai";
import { RetrievalChunk } from "../types/subtitle";
import { OpenAI } from "openai";

export interface HybridSearchOptions {
  query: string;
  topK?: number;
  lessonFilter?: string[];
}

// Minimum acceptable cosine similarity for direct retrieval results.
// Below this threshold we fall back to HyDE (Hypothetical Document Embedding).
// Configurable via env var HYDE_SIMILARITY_THRESHOLD (default 0.35).
const HYDE_THRESHOLD =
  parseFloat(process.env.HYDE_SIMILARITY_THRESHOLD ?? "0.35");

// Minimum number of "confident" chunks required from direct retrieval
// before we skip HyDE. Configurable via env var HYDE_MIN_CONFIDENT_CHUNKS (default 2).
const HYDE_MIN_CONFIDENT = parseInt(
  process.env.HYDE_MIN_CONFIDENT_CHUNKS ?? "2",
  10
);

export class HybridRetriever {
  private vectorStore: PostgresVectorService;
  private openai: OpenAI;

  constructor() {
    this.vectorStore = new PostgresVectorService();
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  /** Generate a short hypothetical answer for HyDE re-retrieval */
  private async generateHypotheticalAnswer(query: string): Promise<string> {
    const res = await this.openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a course instructor. Write a concise, factual answer (2–4 sentences) to the student's question as if it were addressed in a video lecture transcript. Do not add disclaimers.",
        },
        { role: "user", content: query },
      ],
      max_tokens: 150,
    });
    return res.choices[0].message.content ?? query;
  }

  async retrieve(options: HybridSearchOptions): Promise<RetrievalChunk[]> {
    const topK = options.topK ?? 5;

    try {
      // ── Phase 1: direct retrieval ──────────────────────────
      const queryVector = await getEmbedding(options.query);
      const directCandidates = await this.vectorStore.search(queryVector, topK * 2);

      const directFiltered = directCandidates.filter((chunk) => {
        if (options.lessonFilter?.length) {
          return options.lessonFilter.includes(chunk.lesson_name);
        }
        return true;
      });

      // Determine confidence: count chunks whose similarity exceeds threshold
      const confidentChunks = directFiltered.filter(
        (c) => ((c.metadata?.similarity as number) ?? 0) >= HYDE_THRESHOLD
      );

      const usedHyDE = confidentChunks.length < HYDE_MIN_CONFIDENT;

      if (!usedHyDE) {
        // Direct retrieval confidence is sufficient
        console.log(
          `[retrieval] path=direct confident=${confidentChunks.length} threshold=${HYDE_THRESHOLD}`
        );
        return directFiltered.slice(0, topK);
      }

      // ── Phase 2: HyDE fallback ─────────────────────────────
      console.log(
        `[retrieval] path=HyDE confident=${confidentChunks.length} < min=${HYDE_MIN_CONFIDENT} — generating hypothetical answer`
      );

      const hypotheticalAnswer = await this.generateHypotheticalAnswer(
        options.query
      );
      const hydeVector = await getEmbedding(hypotheticalAnswer);
      const hydeCandidates = await this.vectorStore.search(hydeVector, topK * 2);

      const hydeFiltered = hydeCandidates.filter((chunk) => {
        if (options.lessonFilter?.length) {
          return options.lessonFilter.includes(chunk.lesson_name);
        }
        return true;
      });

      // Merge: prefer HyDE results, de-duplicate by chunk_id, keep topK
      const seen = new Set<string>();
      const merged: RetrievalChunk[] = [];
      for (const chunk of [...hydeFiltered, ...directFiltered]) {
        if (!seen.has(chunk.chunk_id)) {
          seen.add(chunk.chunk_id);
          merged.push(chunk);
        }
        if (merged.length >= topK) break;
      }

      console.log(`[retrieval] HyDE merged=${merged.length} chunks returned`);
      return merged;
    } catch (error) {
      console.error("Failed to retrieve candidate chunks:", error);
      return [];
    }
  }
}
