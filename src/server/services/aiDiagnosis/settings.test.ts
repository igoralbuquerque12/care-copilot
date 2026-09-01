import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import {
  DEFAULT_ANALYSIS_PROMPT_TEMPLATE,
  DEFAULT_CLINICAL_CHAT_PROMPT_TEMPLATE,
} from "../ai-prompt-templates";

vi.mock("./credentials", () => ({
  decryptApiKey: vi.fn(),
  encryptApiKey: vi.fn(),
}));
vi.mock("./providers", () => ({
  validateProviderConfiguration: vi.fn(),
}));

import { savePromptTemplates } from "./settings";

describe("savePromptTemplates", () => {
  it("persists both templates without validating a provider again", async () => {
    const updateMany = vi.fn().mockResolvedValue({ count: 1 });
    const db = {
      aiAnalysisSettings: { updateMany },
    } as unknown as PrismaClient;

    await expect(
      savePromptTemplates(db, "profile", {
        analysisPromptTemplate: DEFAULT_ANALYSIS_PROMPT_TEMPLATE,
        clinicalChatPromptTemplate: DEFAULT_CLINICAL_CHAT_PROMPT_TEMPLATE,
      }),
    ).resolves.toEqual({ ok: true });
    expect(updateMany).toHaveBeenCalledWith({
      where: { profileId: "profile" },
      data: {
        analysisPromptTemplate: DEFAULT_ANALYSIS_PROMPT_TEMPLATE,
        clinicalChatPromptTemplate: DEFAULT_CLINICAL_CHAT_PROMPT_TEMPLATE,
      },
    });
  });

  it("rejects unknown variables before writing", async () => {
    const updateMany = vi.fn();
    const db = {
      aiAnalysisSettings: { updateMany },
    } as unknown as PrismaClient;

    await expect(
      savePromptTemplates(db, "profile", {
        analysisPromptTemplate: "${variavel_desconhecida}",
        clinicalChatPromptTemplate: DEFAULT_CLINICAL_CHAT_PROMPT_TEMPLATE,
      }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("requires an existing AI configuration", async () => {
    const db = {
      aiAnalysisSettings: {
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    } as unknown as PrismaClient;

    await expect(
      savePromptTemplates(db, "profile", {
        analysisPromptTemplate: "",
        clinicalChatPromptTemplate: "",
      }),
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });
});
