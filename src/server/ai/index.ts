import { GeminiClient } from "./providers/gemini";
import type { AIClient } from "./client";

export const aiClient: AIClient = new GeminiClient();
