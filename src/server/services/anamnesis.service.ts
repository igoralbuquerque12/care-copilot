// src/server/services/anamnesis.service.ts
import { type PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import {
  getDefaultTemplate,
  getTemplateById,
  sanitizeCustomResponses,
} from "~/server/services/formTemplate.service";
import { createFormSnapshot } from "~/server/services/aiDiagnosis/form-snapshot";
import { createAnalysisJob } from "~/server/services/aiDiagnosis";

export const getByPatient = async (
  db: PrismaClient,
  profileId: string,
  patientId: string,
) => {
  try {
    return await db.anamnesis.findMany({
      where: { patientId, profileId },
      orderBy: { date: "desc" },
      include: {
        physicalExam: true,
        medications: true,
        template: {
          include: {
            sections: {
              orderBy: { order: "asc" },
              include: { fields: { orderBy: { order: "asc" } } },
            },
          },
        },
      },
    });
  } catch (error) {
    console.error("[Anamnesis - getByPatient]: ", error);
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Erro ao buscar anamneses" });
  }
};
import { type CreateAnamnesisInput, type UpdateAnamnesisInput } from "~/schemas/anamnesis";

export const createAnamnesis = async (
  db: PrismaClient,
  profileId: string,
  data: CreateAnamnesisInput,
) => {
  const { physicalExam, medications, templateId, customResponses, ...anamnesisData } = data;
  const template = templateId
    ? await getTemplateById(db, profileId, templateId)
    : await getDefaultTemplate(db, profileId);

  const anamnesis = await db.anamnesis.create({
    data: {
      ...anamnesisData,
      profileId,
      templateId: template.id,
      customResponses: sanitizeCustomResponses(customResponses),
      formSnapshot: createFormSnapshot(template),
      physicalExam: physicalExam ? { create: physicalExam } : undefined,
      medications: medications
        ? { createMany: { data: medications } }
        : undefined,
    },
    include: { physicalExam: true, medications: true, template: true },
  });

  let analysis: Awaited<ReturnType<typeof createAnalysisJob>> | {
    id: undefined;
    status: "FAILED";
  };
  try {
    analysis = await createAnalysisJob(
      db,
      profileId,
      data.patientId,
      anamnesis.id,
    );
  } catch {
    analysis = { id: undefined, status: "FAILED" as const };
  }

  return { anamnesisId: anamnesis.id, patientId: data.patientId, analysis };
};

export const updateAnamnesis = async (
  db: PrismaClient,
  profileId: string,
  { id, physicalExam, medications, customResponses, templateId, ...fields }: UpdateAnamnesisInput,
) => {
  const existing = await db.anamnesis.findFirst({ where: { id, profileId } });
  if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Anamnese não encontrada" });

  const template = templateId
    ? await getTemplateById(db, profileId, templateId)
    : null;

  return db.anamnesis.update({
    where: { id },
    data: {
      ...fields,
      templateId,
      formSnapshot: template ? createFormSnapshot(template) : undefined,
      customResponses: customResponses
        ? sanitizeCustomResponses(customResponses)
        : undefined,
      physicalExam: physicalExam
        ? { upsert: { create: physicalExam, update: physicalExam } }
        : undefined,
      medications: medications
        ? { deleteMany: {}, createMany: { data: medications } }
        : undefined,
      contentVersion: { increment: 1 },
    },
    include: { physicalExam: true, medications: true, template: true },
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
