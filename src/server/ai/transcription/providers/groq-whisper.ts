import OpenAI, { toFile } from "openai";
import type {
  AudioTranscriber,
  TranscriptionRequest,
  TranscriptionResponse,
} from "../client";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

type VerboseTranscription = { text: string; duration?: number };

let cachedSDK: OpenAI | undefined;

const getSDK = (apiKey: string): OpenAI => {
  if (cachedSDK) return cachedSDK;
  cachedSDK = new OpenAI({ apiKey, baseURL: GROQ_BASE_URL });
  return cachedSDK;
};

export class GroqWhisperTranscriber implements AudioTranscriber {
  constructor(
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  async transcribe(request: TranscriptionRequest): Promise<TranscriptionResponse> {
    const sdk = getSDK(this.apiKey);

    const arrayBuffer = request.audio.buffer.slice(
      request.audio.byteOffset,
      request.audio.byteOffset + request.audio.byteLength,
    ) as ArrayBuffer;
    const audioFile = await toFile(
      new Blob([arrayBuffer], { type: request.mimeType }),
      "batch.wav",
      { type: request.mimeType },
    );

    const response = (await sdk.audio.transcriptions.create({
      model: this.model,
      file: audioFile,
      response_format: "verbose_json",
      ...(request.language && { language: request.language }),
    })) as VerboseTranscription;

    return {
      text: response.text,
      durationSeconds: response.duration,
    };
  }
}
