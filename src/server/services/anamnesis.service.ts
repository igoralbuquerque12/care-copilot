// src/server/services/anamnesis.service.ts
import { type PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { type CreateAnamnesisInput } from "~/schemas/anamnesis";

export const createAnamnesis = async (
  db: PrismaClient,
  profileId: string,
  data: CreateAnamnesisInput,
) => {
  const { physicalExam, medications, ...anamnesisData } = data;

  return await db.anamnesis.create({
    data: {
      ...anamnesisData,
      profileId,
      physicalExam: physicalExam ? { create: physicalExam } : undefined,
      medications: medications
        ? { createMany: { data: medications } }
        : undefined,
    },
    include: { physicalExam: true, medications: true },
  });
};

export const listAnamneses = async (
  db: PrismaClient,
  profileId: string,
  filters: { startDate?: Date; endDate?: Date; page: number; limit: number },
) => {
  try {
    const skip = (filters.page - 1) * filters.limit;

    const where = {
      profileId,
      date: {
        gte: filters.startDate,
        lte: filters.endDate,
      },
    };

    const [items, total] = await Promise.all([
      db.anamnesis.findMany({
        where,
        skip,
        take: filters.limit,
        orderBy: { date: "desc" },
        include: { patient: { select: { name: true } } },
      }),
      db.anamnesis.count({ where }),
    ]);

    return { items, total, pages: Math.ceil(total / filters.limit) };
  } catch (error) {
    console.error("[Anamnesis - list]: ", error);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Erro ao listar anamneses",
    });
  }
};
