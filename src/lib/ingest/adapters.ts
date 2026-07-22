import { SubtitleCue } from '../types/subtitle';

export interface IngestionAdapter {
  ingest(input: string | File): Promise<SubtitleCue[]>;
}

export class UploadAdapter implements IngestionAdapter {
  async ingest(fileContent: string): Promise<SubtitleCue[]> {
    // TODO: Detect file type (.srt / .vtt) and run corresponding parser
    return [];
  }
}

export class YouTubeTranscriptAdapter implements IngestionAdapter {
  async ingest(url: string): Promise<SubtitleCue[]> {
    // TODO: Fetch YouTube transcript via API/adapter
    return [];
  }
}

export class YtDlpSubtitleAdapter implements IngestionAdapter {
  async ingest(url: string): Promise<SubtitleCue[]> {
    // TODO: Execute yt-dlp worker to extract subtitles
    return [];
  }
}

export class WhisperFallbackAdapter implements IngestionAdapter {
  async ingest(mediaUrl: string): Promise<SubtitleCue[]> {
    // TODO: Run Whisper speech-to-text fallback when subtitle tracks do not exist
    return [];
  }
}
