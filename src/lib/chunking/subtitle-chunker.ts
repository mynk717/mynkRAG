import { SubtitleCue, RetrievalChunk } from '../types/subtitle';

export interface ChunkerOptions {
  minCuesPerChunk?: number;
  maxCuesPerChunk?: number;
  overlapCues?: number;
  maxTokenCount?: number;
}

export class SubtitleChunker {
  private options: Required<ChunkerOptions>;

  constructor(options: ChunkerOptions = {}) {
    this.options = {
      minCuesPerChunk: options.minCuesPerChunk ?? 3,
      maxCuesPerChunk: options.maxCuesPerChunk ?? 8,
      overlapCues: options.overlapCues ?? 2,
      maxTokenCount: options.maxTokenCount ?? 512,
    };
  }

  // Estimate tokens by word count (approx. 1.3 words per token)
  private estimateTokens(text: string): number {
    return Math.ceil(text.split(/\s+/).filter(Boolean).length * 1.3);
  }

  createChunks(cues: SubtitleCue[]): RetrievalChunk[] {
    const chunks: RetrievalChunk[] = [];
    const step = this.options.maxCuesPerChunk - this.options.overlapCues;

    for (let i = 0; i < cues.length; i += step) {
      const slice = cues.slice(i, i + this.options.maxCuesPerChunk);
      if (slice.length < this.options.minCuesPerChunk && chunks.length > 0) {
        break; // Ignore very small trailing chunks if we already have chunks
      }

      const text = slice.map(c => c.text).join(' ');
      const tokenCount = this.estimateTokens(text);

      chunks.push({
        chunk_id: `chunk-${slice[0].source_id}-${i}`,
        lesson_name: slice[0].lesson_name,
        chunk_text: text,
        start_ms: slice[0].start_ms,
        end_ms: slice[slice.length - 1].end_ms,
        start_label: slice[0].start_label,
        end_label: slice[slice.length - 1].end_label,
        cue_ids: slice.map(c => c.cue_id),
        token_count: tokenCount,
      });
    }

    return chunks;
  }
}
