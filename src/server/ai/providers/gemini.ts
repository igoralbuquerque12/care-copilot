import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "~/env";
import type { AIClient, AIGenerateRequest, AIGenerateResponse } from "../client";

const GEMINI_MODEL = "gemini-2.5-flash";

const createGeminiClient = () => new GoogleGenerativeAI(env.GEMINI_API_KEY);

const globalForGemini = globalThis as unknown as {
  gemini: ReturnType<typeof createGeminiClient> | undefined;
};

const geminiSDK = globalForGemini.gemini ?? createGeminiClient();
if (env.NODE_ENV !== "production") globalForGemini.gemini = geminiSDK;

export class GeminiClient implements AIClient {
  async generate(request: AIGenerateRequest): Promise<AIGenerateResponse> {
    const model = geminiSDK.getGenerativeModel({ model: GEMINI_MODEL });
    const result = await model.generateContent(request.prompt);
    const text = result.response.text();

    const cleaned = text
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .trim();

    return { text: cleaned };
  }
}
