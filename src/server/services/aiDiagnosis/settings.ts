import type { AiProvider, PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import type {
  SaveAiPromptTemplatesInput,
  SaveAnalysisSettingsInput,
} from "~/schemas/ai-analysis";
import { decryptApiKey, encryptApiKey } from "./credentials";
import { validateProviderConfiguration } from "./providers";
import { CLINICAL_CHAT_MODEL } from "../clinicalChat/constants";
import {
  ANALYSIS_PROMPT_VARIABLES,
  CLINICAL_CHAT_PROMPT_VARIABLES,
  DEFAULT_ANALYSIS_PROMPT_TEMPLATE,
  DEFAULT_CLINICAL_CHAT_PROMPT_TEMPLATE,
  validatePromptTemplate,
} from "../ai-prompt-templates";

export const MODEL_PRESETS = {
  OPENAI: ["gpt-5.6-sol", "gpt-5.6-terra", "gpt-5.6-luna"],
  GROQ: ["openai/gpt-oss-120b", "openai/gpt-oss-20b", "llama-3.3-70b-versatile"],
  GEMINI: ["gemini-3.7-flash", "gemini-3.6-flash", "gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-2.5-pro"],
  ANTHROPIC: ["claude-fable-5", "claude-opus-5", "claude-sonnet-5", "claude-haiku-4-5-20251001"],
} as const;

export const getSettings = async (db: PrismaClient, profileId: string) => {
  const [settings, credentials] = await Promise.all([
    db.aiAnalysisSettings.findUnique({ where: { profileId } }),
    db.aiProviderCredential.findMany({
      where: { profileId },
      select: { provider: true, lastFour: true, verifiedAt: true, updatedAt: true },
    }),
  ]);
  return {
    settings,
    credentials,
    presets: MODEL_PRESETS,
    chatModel: CLINICAL_CHAT_MODEL,
    promptConfiguration: {
      templates: {
        analysis:
          settings?.analysisPromptTemplate ?? DEFAULT_ANALYSIS_PROMPT_TEMPLATE,
        clinicalChat:
          settings?.clinicalChatPromptTemplate ??
          DEFAULT_CLINICAL_CHAT_PROMPT_TEMPLATE,
      },
      defaults: {
        analysis: DEFAULT_ANALYSIS_PROMPT_TEMPLATE,
        clinicalChat: DEFAULT_CLINICAL_CHAT_PROMPT_TEMPLATE,
      },
      variables: {
        analysis: ANALYSIS_PROMPT_VARIABLES,
        clinicalChat: CLINICAL_CHAT_PROMPT_VARIABLES,
      },
    },
  };
};

export const savePromptTemplates = async (
  db: PrismaClient,
  profileId: string,
  input: SaveAiPromptTemplatesInput,
) => {
  validatePromptTemplate(
    input.analysisPromptTemplate,
    ANALYSIS_PROMPT_VARIABLES,
  );
  validatePromptTemplate(
    input.clinicalChatPromptTemplate,
    CLINICAL_CHAT_PROMPT_VARIABLES,
  );
  const updated = await db.aiAnalysisSettings.updateMany({
    where: { profileId },
    data: input,
  });
  if (updated.count === 0) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Ative primeiro uma configuracao de IA para salvar os prompts.",
    });
  }
  return { ok: true as const };
};

export const saveCredential = async (
  db: PrismaClient,
  profileId: string,
  provider: AiProvider,
  apiKey: string,
) => {
  const encrypted = encryptApiKey(apiKey);
  return db.aiProviderCredential.upsert({
    where: { profileId_provider: { profileId, provider } },
    create: { profileId, provider, ...encrypted },
    update: { ...encrypted, verifiedAt: null },
    select: { provider: true, lastFour: true, verifiedAt: true, updatedAt: true },
  });
};

export const removeCredential = async (
  db: PrismaClient,
  profileId: string,
  provider: AiProvider,
) => {
  await db.aiProviderCredential.deleteMany({ where: { profileId, provider } });
};

export const saveSettings = async (
  db: PrismaClient,
  profileId: string,
  input: SaveAnalysisSettingsInput,
) => {
  const credential = await db.aiProviderCredential.findUnique({
    where: { profileId_provider: { profileId, provider: input.provider } },
  });
  if (!credential) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Cadastre a chave deste provedor antes de ativar o modelo.",
    });
  }

  try {
    await validateProviderConfiguration({
      provider: input.provider,
      model: input.model,
      apiKey: decryptApiKey(credential),
    });
  } catch {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Nao foi possivel validar a chave e o modelo selecionados.",
    });
  }

  const [settings] = await db.$transaction([
    db.aiAnalysisSettings.upsert({
      where: { profileId },
      create: { profileId, ...input },
      update: input,
    }),
    db.aiProviderCredential.update({
      where: { id: credential.id },
      data: { verifiedAt: new Date() },
    }),
  ]);
  return settings;
};

export const testCredential = async (
  db: PrismaClient,
  profileId: string,
  provider: AiProvider,
  model: string,
) => {
  const credential = await db.aiProviderCredential.findUnique({
    where: { profileId_provider: { profileId, provider } },
  });
  if (!credential) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Credencial nao encontrada." });
  }
  try {
    await validateProviderConfiguration({ provider, model, apiKey: decryptApiKey(credential) });
  } catch {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Nao foi possivel validar a chave e o modelo selecionados.",
    });
  }
  await db.aiProviderCredential.update({
    where: { id: credential.id },
    data: { verifiedAt: new Date() },
  });
  return { ok: true as const };
};

export const getResolvedConfiguration = async (
  db: PrismaClient,
  profileId: string,
) => {
  const settings = await db.aiAnalysisSettings.findUnique({ where: { profileId } });
  if (!settings) return null;
  const credential = await db.aiProviderCredential.findUnique({
    where: { profileId_provider: { profileId, provider: settings.provider } },
  });
  if (!credential) return null;
  return { settings, apiKey: decryptApiKey(credential) };
};
