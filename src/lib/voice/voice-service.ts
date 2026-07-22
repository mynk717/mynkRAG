export class VoiceService {
  async speechToText(audioBlob: Blob): Promise<string> {
    // TODO: Convert audio stream/blob into query text (e.g. OpenAI Realtime / Whisper API)
    return '';
  }

  async textToSpeech(text: string): Promise<ArrayBuffer> {
    // TODO: Convert grounded textual response into audio for playback
    return new ArrayBuffer(0);
  }
}
