import type { PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import type { ClinicalChatAvailability } from "../../../schemas/clinical-chat";
import { CLINICAL_CHAT_MODEL } from "./constants";

export const getClinicalChatAvailability = async (
  db: PrismaClient,
  profileId: string,
): Promise<{
  state: ClinicalChatAvailability;
  model: string;
  activeProvider: string | null;
}> => {
  const settings = await db.aiAnalysisSettings.findUnique({
    where: { profileId },
    select: { provider: true },
  });

  if (!settings) {
    return {
      state: "NOT_CONFIGURED",
      model: CLINICAL_CHAT_MODEL,
      activeProvider: null,
    };
  }
  if (settings.provider !== "OPENAI") {
    return {
      state: "OPENAI_REQUIRED",
      model: CLINICAL_CHAT_MODEL,
      activeProvider: settings.provider,
    };
  }

  const credential = await db.aiProviderCredential.findUnique({
    where: { profileId_provider: { profileId, provider: "OPENAI" } },
    select: { id: true, verifiedAt: true },
  });
  if (!credential?.verifiedAt) {
    return {
      state: "OPENAI_CREDENTIAL_UNVERIFIED",
      model: CLINICAL_CHAT_MODEL,
      activeProvider: "OPENAI",
    };
  }

  return {
    state: "AVAILABLE",
    model: CLINICAL_CHAT_MODEL,
    activeProvider: "OPENAI",
  };
};

export const resolveClinicalChatCredential = async (
  db: PrismaClient,
  profileId: string,
) => {
  const availability = await getClinicalChatAvailability(db, profileId);
  if (availability.state !== "AVAILABLE") {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message:
        availability.state === "OPENAI_REQUIRED"
          ? "O chat clinico esta disponivel inicialmente apenas quando a OpenAI e o provedor ativo."
          : "Configure e valide uma credencial OpenAI para usar o chat clinico.",
    });
  }

  const credential = await db.aiProviderCredential.findUnique({
    where: { profileId_provider: { profileId, provider: "OPENAI" } },
  });
  if (!credential?.verifiedAt) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "A credencial OpenAI precisa ser validada novamente.",
    });
  }
  const { decryptApiKey } = await import("../aiDiagnosis/credentials");
  return decryptApiKey(credential);
};
