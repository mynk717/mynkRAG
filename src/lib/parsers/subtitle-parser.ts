import { SubtitleCue } from '../types/subtitle';

export interface SubtitleParser {
  parse(rawContent: string, lessonName: string, sourceId: string): Promise<SubtitleCue[]>;
}

function parseTimestampToMs(timestamp: string): number {
  const parts = timestamp.split(/[:.,]/);
  if (parts.length < 3) return 0;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const seconds = parseInt(parts[2], 10);
  const ms = parts[3] ? parseInt(parts[3].padEnd(3, '0').slice(0, 3), 10) : 0;
  return ((hours * 60 + minutes) * 60 + seconds) * 1000 + ms;
}

export class SrtParser implements SubtitleParser {
  async parse(rawContent: string, lessonName: string, sourceId: string): Promise<SubtitleCue[]> {
    const cues: SubtitleCue[] = [];
    const blocks = rawContent.trim().replace(/\r\n/g, '\n').split('\n\n');

    let cueIndex = 0;
    for (const block of blocks) {
      const lines = block.split('\n');
      if (lines.length < 3) continue;

      const index = parseInt(lines[0].trim(), 10);
      const timeLine = lines[1].trim();
      const text = lines.slice(2).join(' ').trim();

      const timeMatch = timeLine.match(/(\d+:\d+:\d+,\d+)\s*-->\s*(\d+:\d+:\d+,\d+)/);
      if (!timeMatch) continue;

      const startMs = parseTimestampToMs(timeMatch[1]);
      const endMs = parseTimestampToMs(timeMatch[2]);

      cues.push({
        source_id: sourceId,
        source_type: 'file',
        lesson_id: sourceId,
        lesson_name: lessonName,
        language: 'en',
        cue_id: `${sourceId}-cue-${cueIndex}`,
        cue_index: cueIndex,
        start_ms: startMs,
        end_ms: endMs,
        start_label: timeMatch[1].replace(',', '.'),
        end_label: timeMatch[2].replace(',', '.'),
        text,
        normalized_text: text.toLowerCase().trim(),
        is_generated: false,
        source_method: 'upload',
      });
      cueIndex++;
    }

    return cues;
  }
}

export class VttParser implements SubtitleParser {
  async parse(rawContent: string, lessonName: string, sourceId: string): Promise<SubtitleCue[]> {
    const cues: SubtitleCue[] = [];
    const cleanContent = rawContent.trim().replace(/\r\n/g, '\n');
    if (!cleanContent.startsWith('WEBVTT')) {
      // Fallback: try parsing as SRT anyway
      return new SrtParser().parse(rawContent, lessonName, sourceId);
    }

    const blocks = cleanContent.split('\n\n');
    let cueIndex = 0;

    for (const block of blocks) {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length === 0 || (lines.length === 1 && lines[0] === 'WEBVTT')) continue;

      let timeLineIndex = 0;
      if (!lines[0].includes('-->') && lines.length > 1) {
        timeLineIndex = 1;
      }

      const timeLine = lines[timeLineIndex];
      const timeMatch = timeLine.match(/(\d+:\d+:\d+\.\d+|\d+:\d+\.\d+)\s*-->\s*(\d+:\d+:\d+\.\d+|\d+:\d+\.\d+)/);
      if (!timeMatch) continue;

      let startStr = timeMatch[1];
      let endStr = timeMatch[2];
      
      // Ensure hour format for timestamp parser
      if (startStr.split(':').length === 2) startStr = '00:' + startStr;
      if (endStr.split(':').length === 2) endStr = '00:' + endStr;

      const startMs = parseTimestampToMs(startStr);
      const endMs = parseTimestampToMs(endStr);
      const text = lines.slice(timeLineIndex + 1).join(' ').trim();

      cues.push({
        source_id: sourceId,
        source_type: 'file',
        lesson_id: sourceId,
        lesson_name: lessonName,
        language: 'en',
        cue_id: `${sourceId}-cue-${cueIndex}`,
        cue_index: cueIndex,
        start_ms: startMs,
        end_ms: endMs,
        start_label: startStr,
        end_label: endStr,
        text,
        normalized_text: text.toLowerCase().trim(),
        is_generated: false,
        source_method: 'upload',
      });
      cueIndex++;
    }

    return cues;
  }
}
