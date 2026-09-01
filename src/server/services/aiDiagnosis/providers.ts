import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import type { AiProvider } from "~/schemas/ai-analysis";

type GenerateRequest = {
  provider: AiProvider;
  apiKey: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
};

export const isTransientProviderError = (error: unknown) => {
  if (error instanceof TypeError) return true;
  if (!error || typeof error !== "object") return false;
  const candidate = error as { status?: unknown; code?: unknown; message?: unknown };
  const status = typeof candidate.status === "number" ? candidate.status : null;
  if (status !== null && (status === 408 || status === 409 || status === 425 || status === 429 || status >= 500)) {
    return true;
  }
  const code = typeof candidate.code === "string" ? candidate.code.toUpperCase() : "";
  if (["ECONNRESET", "ECONNREFUSED", "ETIMEDOUT", "EAI_AGAIN"].includes(code)) return true;
  const message = typeof candidate.message === "string" ? candidate.message.toLowerCase() : "";
  return /(?:timeout|network|fetch failed|\b429\b|\b5\d\d\b)/.test(message);
};

const cleanJson = (text: string) =>
  text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();

const generateOpenAiCompatible = async (
  request: GenerateRequest,
  baseURL?: string,
) => {
  const client = new OpenAI({ apiKey: request.apiKey, baseURL });
  const response = await client.chat.completions.create({
    model: request.model,
    messages: [
      ...(request.systemPrompt.trim()
        ? [{ role: "system" as const, content: request.systemPrompt }]
        : []),
      { role: "user", content: request.userPrompt },
    ],
    response_format: { type: "json_object" },
    max_completion_tokens: 12_000,
  });
  return cleanJson(response.choices[0]?.message.content ?? "");
};

const generateGemini = async (request: GenerateRequest) => {
  const client = new GoogleGenerativeAI(request.apiKey);
  const model = client.getGenerativeModel({
    model: request.model,
    ...(request.systemPrompt.trim()
      ? { systemInstruction: request.systemPrompt }
      : {}),
    generationConfig: { responseMimeType: "application/json" },
  });
  const response = await model.generateContent(request.userPrompt);
  return cleanJson(response.response.text());
};

const generateAnthropic = async (request: GenerateRequest) => {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": request.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: request.model,
      max_tokens: 12_000,
      ...(request.systemPrompt.trim()
        ? { system: request.systemPrompt }
        : {}),
      messages: [{ role: "user", content: request.userPrompt }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic request failed (${response.status})`);
  }
  const body = await response.json() as {
    content?: Array<{ type: string; text?: string }>;
  };
  return cleanJson(body.content?.find((item) => item.type === "text")?.text ?? "");
};

export const generateStructuredAnalysis = (request: GenerateRequest) => {
  switch (request.provider) {
    case "OPENAI":
      return generateOpenAiCompatible(request);
    case "GROQ":
      return generateOpenAiCompatible(request, "https://api.groq.com/openai/v1");
    case "GEMINI":
      return generateGemini(request);
    case "ANTHROPIC":
      return generateAnthropic(request);
  }
};

export const validateProviderConfiguration = async (
  input: Pick<GenerateRequest, "provider" | "apiKey" | "model">,
) => {
  const text = await generateStructuredAnalysis({
    ...input,
    systemPrompt: "Responda exclusivamente com JSON valido.",
    userPrompt: 'Retorne exatamente um objeto JSON com o campo booleano "ok" igual a true.',
  });
  const parsed = JSON.parse(text) as { ok?: unknown };
  if (parsed.ok !== true) throw new Error("Resposta de validacao inesperada");
};
