import type {
  AudioTranscriber,
  TranscriptionRequest,
  TranscriptionResponse,
} from "../client";

const OPENAI_TRANSCRIPTION_URL =
  "https://api.openai.com/v1/audio/transcriptions";
const DEFAULT_MODEL = "whisper-1";

export class WhisperTranscriber implements AudioTranscriber {
  constructor(private readonly apiKey: string, private readonly model: string = DEFAULT_MODEL) {}

  async transcribe(request: TranscriptionRequest): Promise<TranscriptionResponse> {
    const form = new FormData();
    const arrayBuffer = request.audio.buffer.slice(
      request.audio.byteOffset,
      request.audio.byteOffset + request.audio.byteLength,
    ) as ArrayBuffer;
    const blob = new Blob([arrayBuffer], { type: request.mimeType });
    form.append("file", blob, "batch.wav");
    form.append("model", this.model);
    form.append("response_format", "verbose_json");
    if (request.language) form.append("language", request.language);

    const res = await fetch(OPENAI_TRANSCRIPTION_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}` },
      body: form,
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new Error(`Whisper falhou (${res.status}): ${detail}`);
    }

    const data = (await res.json()) as { text: string; duration?: number };
    return { text: data.text, durationSeconds: data.duration };
  }
}
