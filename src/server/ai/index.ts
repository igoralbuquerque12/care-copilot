import { env } from "~/env";
import { createAudioLLMClient, createSmartLLMClient } from "./providers/groq";
import type { AIClient } from "./client";

const globalForAI = globalThis as unknown as {
  aiClientAudio: AIClient | undefined;
  aiClientSmart: AIClient | undefined;
};

export const aiClientAudio: AIClient =
  globalForAI.aiClientAudio ?? createAudioLLMClient();

export const aiClientSmart: AIClient =
  globalForAI.aiClientSmart ?? createSmartLLMClient();

if (env.NODE_ENV !== "production") {
  globalForAI.aiClientAudio = aiClientAudio;
  globalForAI.aiClientSmart = aiClientSmart;
}

// Compatibility alias for callers that have not selected a workload-specific client.
export const aiClient: AIClient = aiClientSmart;
