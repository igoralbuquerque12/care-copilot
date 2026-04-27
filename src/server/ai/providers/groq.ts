import OpenAI from "openai";
import { env } from "~/env";
import type { AIClient, AIGenerateRequest, AIGenerateResponse } from "../client";

const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

const createGroqSDK = () =>
  new OpenAI({ apiKey: env.GROQ_API_KEY, baseURL: GROQ_BASE_URL });

const globalForGroq = globalThis as unknown as {
  groqSDK: OpenAI | undefined;
};

const groqSDK: OpenAI = globalForGroq.groqSDK ?? createGroqSDK();
if (env.NODE_ENV !== "production") globalForGroq.groqSDK = groqSDK;

class GroqLLMClient implements AIClient {
  constructor(private readonly model: string) {}

  async generate(request: AIGenerateRequest): Promise<AIGenerateResponse> {
    const response = await groqSDK.chat.completions.create({
      model: this.model,
      messages: [{ role: "user", content: request.prompt }],
      ...(request.responseFormat === "json" && {
        response_format: { type: "json_object" },
      }),
    });

    const text = response.choices[0]?.message.content ?? "";

    return {
      text: text
        .replace(/```json\s*/g, "")
        .replace(/```\s*/g, "")
        .trim(),
    };
  }
}

/**
 * Client rapido para extracao audio → JSON.
 * Usa GROQ_LLM_AUDIO_MODEL (default: llama-4-scout, ~20B, 128k).
 */
export const createAudioLLMClient = (): AIClient =>
  new GroqLLMClient(env.GROQ_LLM_AUDIO_MODEL);

/**
 * Client de alta capacidade para diagnostico e avaliacao clinica.
 * Usa GROQ_LLM_SMART_MODEL (default: llama-4-maverick, ~120B, 128k).
 */
export const createSmartLLMClient = (): AIClient =>
  new GroqLLMClient(env.GROQ_LLM_SMART_MODEL);
