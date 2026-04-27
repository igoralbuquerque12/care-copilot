import { env } from "~/env";
import type { AudioTranscriber } from "./client";
import { GroqWhisperTranscriber } from "./providers/groq-whisper";

let cached: AudioTranscriber | null = null;

/**
 * Retorna o transcriber de audio configurado.
 * Provider: Groq (OpenAI-compatible), modelo configurado via GROQ_STT_MODEL.
 * Default: whisper-large-v3.
 */
export const getAudioTranscriber = (): AudioTranscriber => {
  if (cached) return cached;
  cached = new GroqWhisperTranscriber(env.GROQ_API_KEY, env.GROQ_STT_MODEL);
  return cached;
};
