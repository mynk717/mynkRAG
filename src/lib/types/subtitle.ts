export interface SubtitleCue {
  source_id: string;
  source_type: 'file' | 'url';
  source_url?: string;
  course_id?: string;
  lesson_id: string;
  lesson_name: string;
  language: string;
  cue_id: string;
  cue_index: number;
  start_ms: number;
  end_ms: number;
  start_label: string;
  end_label: string;
  speaker?: string;
  text: string;
  normalized_text: string;
  is_generated: boolean;
  source_method: 'upload' | 'yt_api' | 'yt_dlp' | 'whisper';
  chunk_id?: string;
  neighbor_ids?: string[];
}

export interface RetrievalChunk {
  chunk_id: string;
  lesson_name: string;
  chunk_text: string;
  start_ms: number;
  end_ms: number;
  start_label: string;
  end_label: string;
  cue_ids: string[];
  token_count: number;
  embedding?: number[];
  metadata?: Record<string, unknown>;
  source_type?: string;
  source_url?: string;
}


export interface GroundedAnswer {
  answer: string;
  source_lesson: string;
  timestamp_range: string;
  transcript_snippets: string[];
  explanation: string;
  confidence_score?: number;
}

export interface IngestionJob {
  job_id: string;
  source_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  method: 'upload' | 'yt_api' | 'yt_dlp' | 'whisper';
  progress: number;
  error?: string;
}
