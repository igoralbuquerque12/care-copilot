import { type PrismaClient, Prisma } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { AI_CREDIT_CONFIG } from "~/server/ai/credits/config";
import type { CreditConsumptionBreakdown } from "~/server/ai/credits/utils";

export type DebitBatchInput = {
  profileId: string;
  sessionId: string;
  batchIndex: number;
  breakdown: CreditConsumptionBreakdown;
};

export const grantSignupBonus = async (
  db: PrismaClient,
  profileId: string,
) => {
  try {
    return await db.$transaction(async (tx) => {
      const existing = await tx.creditLedgerEntry.findFirst({
        where: { profileId, type: "SIGNUP_BONUS" },
        select: { id: true },
      });

      if (existing) return existing;

      const created = await tx.creditLedgerEntry.create({
        data: {
          profileId,
          type: "SIGNUP_BONUS",
          credits: AI_CREDIT_CONFIG.signupBonusCredits,
        },
      });

      await tx.profile.update({
        where: { id: profileId },
        data: { creditsBalance: { increment: AI_CREDIT_CONFIG.signupBonusCredits } },
      });

      return created;
    });
  } catch (error) {
    console.error("[CreditLedger - grantSignupBonus]:", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Erro ao conceder bonus de cadastro",
    });
  }
};

export const getBalance = async (db: PrismaClient, profileId: string) => {
  const profile = await db.profile.findUnique({
    where: { id: profileId },
    select: { creditsBalance: true },
  });

  return profile?.creditsBalance ?? 0;
};

export const assertMinimumBalanceForSession = async (
  db: PrismaClient,
  profileId: string,
) => {
  const balance = await getBalance(db, profileId);
  if (balance < AI_CREDIT_CONFIG.minimumRequiredCreditsToStartSession) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Saldo insuficiente para iniciar uma nova sessao",
    });
  }
};

export const assertMinimumBalanceForBatch = async (
  db: PrismaClient,
  profileId: string,
) => {
  const balance = await getBalance(db, profileId);
  if (balance < AI_CREDIT_CONFIG.minimumRequiredCreditsPerBatch) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Saldo insuficiente para processar novo lote",
    });
  }
};

export const debitBatch = async (
  db: PrismaClient,
  input: DebitBatchInput,
) => {
  const { profileId, sessionId, batchIndex, breakdown } = input;

  const entries = [
    {
      type: "AUDIO_TRANSCRIPTION" as const,
      credits: breakdown.audioCredits,
      metadata: { audioDurationSeconds: breakdown.audioDurationSeconds },
    },
    {
      type: "PROMPT_INPUT" as const,
      credits: breakdown.inputCredits,
      metadata: { inputTokens: breakdown.inputTokens },
    },
    {
      type: "LLM_OUTPUT" as const,
      credits: breakdown.outputCredits,
      metadata: { outputTokens: breakdown.outputTokens },
    },
  ];

  return db.$transaction(async (tx) => {
    let charged = 0;

    for (const entry of entries) {
      if (entry.credits <= 0) continue;

      try {
        await tx.creditLedgerEntry.create({
          data: {
            profileId,
            sessionId,
            batchIndex,
            type: entry.type,
            credits: entry.credits,
            metadata: entry.metadata as Prisma.InputJsonValue,
          },
        });
        charged += entry.credits;
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002"
        ) {
          continue;
        }
        throw error;
      }
    }

    if (charged > 0) {
      await tx.profile.update({
        where: { id: profileId },
        data: { creditsBalance: { decrement: charged } },
      });

      await tx.audioConsultationSession.update({
        where: { id: sessionId },
        data: { creditsConsumed: { increment: charged } },
      });
    }

    return { charged };
  });
};

export const getRecentLedger = async (
  db: PrismaClient,
  profileId: string,
  page: number,
  pageSize: number,
) => {
  const [items, total] = await Promise.all([
    db.creditLedgerEntry.findMany({
      where: { profileId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.creditLedgerEntry.count({ where: { profileId } }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
};
