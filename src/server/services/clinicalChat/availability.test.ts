import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { getClinicalChatAvailability } from "./availability";
import { CLINICAL_CHAT_MODEL } from "./constants";

const database = (
  settings: { provider: "OPENAI" | "GROQ" | "GEMINI" | "ANTHROPIC" } | null,
  credential: { id: string; verifiedAt: Date | null } | null,
) =>
  ({
    aiAnalysisSettings: { findUnique: vi.fn().mockResolvedValue(settings) },
    aiProviderCredential: { findUnique: vi.fn().mockResolvedValue(credential) },
  }) as unknown as PrismaClient;

describe("getClinicalChatAvailability", () => {
  it("requires an active AI configuration", async () => {
    await expect(
      getClinicalChatAvailability(database(null, null), "profile"),
    ).resolves.toMatchObject({
      state: "NOT_CONFIGURED",
      model: CLINICAL_CHAT_MODEL,
    });
  });

  it("does not fall back to a saved OpenAI key when another provider is active", async () => {
    await expect(
      getClinicalChatAvailability(
        database(
          { provider: "GROQ" },
          { id: "credential", verifiedAt: new Date() },
        ),
        "profile",
      ),
    ).resolves.toMatchObject({
      state: "OPENAI_REQUIRED",
      activeProvider: "GROQ",
    });
  });

  it("requires the OpenAI credential to be verified", async () => {
    await expect(
      getClinicalChatAvailability(
        database(
          { provider: "OPENAI" },
          { id: "credential", verifiedAt: null },
        ),
        "profile",
      ),
    ).resolves.toMatchObject({ state: "OPENAI_CREDENTIAL_UNVERIFIED" });
  });

  it("treats a missing OpenAI key as an unverified credential", async () => {
    await expect(
      getClinicalChatAvailability(
        database({ provider: "OPENAI" }, null),
        "profile",
      ),
    ).resolves.toMatchObject({ state: "OPENAI_CREDENTIAL_UNVERIFIED" });
  });

  it("enables the fixed model only for active, verified OpenAI", async () => {
    await expect(
      getClinicalChatAvailability(
        database(
          { provider: "OPENAI" },
          { id: "credential", verifiedAt: new Date() },
        ),
        "profile",
      ),
    ).resolves.toEqual({
      state: "AVAILABLE",
      model: "gpt-5.6-terra",
      activeProvider: "OPENAI",
    });
  });
});
