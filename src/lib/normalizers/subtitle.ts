import { SubtitleCue } from '../types/subtitle';

export function normalizeCue(cue: SubtitleCue): SubtitleCue {
  // TODO: Add text normalization (lowercase, trim, punctuation handling)
  return {
    ...cue,
    normalized_text: cue.text.toLowerCase().trim(),
  };
}

export function formatTimestamp(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
