import { env } from "~/env";
import { createAudioLLMClient, createSmartLLMClient } from "./providers/groq";
import type { AIClient } from "./client";

const globalForAI = globalThis as unknown as {
  aiClientAudio: AIClient | undefined;
  aiClientSmart: AIClient | undefined;
};

/**
 * Extracao estruturada de audio → JSON.
 * Modelo rapido (GROQ_LLM_AUDIO_MODEL), otimizado para latencia nos lotes.
 */
export const aiClientAudio: AIClient =
  globalForAI.aiClientAudio ?? createAudioLLMClient();

/**
 * Analises clinicas, diagnostico e avaliacao de resultados.
 * Modelo de alta capacidade (GROQ_LLM_SMART_MODEL).
 */
export const aiClientSmart: AIClient =
  globalForAI.aiClientSmart ?? createSmartLLMClient();

if (env.NODE_ENV !== "production") {
  globalForAI.aiClientAudio = aiClientAudio;
  globalForAI.aiClientSmart = aiClientSmart;
}

/**
 * Alias semantico para codigo legado que nao distingue contexto.
 * Aponta para aiClientSmart.
 */
export const aiClient: AIClient = aiClientSmart;
