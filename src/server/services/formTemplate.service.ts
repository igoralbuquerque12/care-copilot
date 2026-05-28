import type { Prisma, PrismaClient } from "@prisma/client";
import { TRPCError } from "@trpc/server";

import {
  SYSTEM_ANAMNESIS_FIELD_KEY_SET,
  type CreateFormTemplateInput,
  type FormFieldConfig,
  type FormFieldType,
  type UpdateFormTemplateInput,
} from "~/schemas/form-template";

type DbClient = PrismaClient | Prisma.TransactionClient;

type DefaultField = {
  key: string;
  label: string;
  description?: string;
  order: number;
  fieldType: FormFieldType;
  isRequired?: boolean;
  config?: FormFieldConfig;
};

type DefaultSection = {
  name: string;
  description?: string;
  order: number;
  fields: DefaultField[];
};

const templateInclude = {
  sections: {
    orderBy: { order: "asc" as const },
    include: {
      fields: {
        orderBy: { order: "asc" as const },
      },
    },
  },
};

export const DEFAULT_ANAMNESIS_TEMPLATE: DefaultSection[] = [
  {
    name: "Anamnese",
    order: 0,
    fields: [
      {
        key: "chiefComplaint",
        label: "Queixa Principal",
        order: 0,
        fieldType: "TEXT",
        isRequired: true,
        config: { placeholder: "Descreva a queixa principal do paciente" },
      },
      {
        key: "currentIllnessHistory",
        label: "Historia da Doenca Atual",
        order: 1,
        fieldType: "TEXT",
        isRequired: true,
        config: { placeholder: "Descreva a historia da doenca atual" },
      },
      {
        key: "treatmentResponse",
        label: "Resposta ao Tratamento",
        order: 2,
        fieldType: "TEXT",
      },
      {
        key: "symptomEvolution",
        label: "Evolucao dos Sintomas",
        order: 3,
        fieldType: "TEXT",
      },
      {
        key: "newEvents",
        label: "Novos Eventos",
        order: 4,
        fieldType: "TEXT",
      },
      {
        key: "nyhaClass",
        label: "Classe NYHA",
        order: 5,
        fieldType: "NYHA_CLASS",
        isRequired: true,
      },
      {
        key: "hasPalpitations",
        label: "Palpitacoes",
        order: 6,
        fieldType: "BOOLEAN",
      },
      {
        key: "hasSyncope",
        label: "Sincope",
        order: 7,
        fieldType: "BOOLEAN",
      },
      {
        key: "hasEdema",
        label: "Edema",
        order: 8,
        fieldType: "BOOLEAN",
      },
      {
        key: "hasChestPain",
        label: "Dor Toracica",
        order: 9,
        fieldType: "BOOLEAN",
      },
    ],
  },
  {
    name: "Exame Fisico",
    order: 1,
    fields: [
      { key: "weight", label: "Peso", order: 0, fieldType: "NUMBER", config: { unit: "kg", step: 0.1 } },
      { key: "height", label: "Altura", order: 1, fieldType: "NUMBER", config: { unit: "cm", step: 0.1 } },
      { key: "bpSystolic", label: "PA Sistolica", order: 2, fieldType: "NUMBER", config: { unit: "mmHg" } },
      { key: "bpDiastolic", label: "PA Diastolica", order: 3, fieldType: "NUMBER", config: { unit: "mmHg" } },
      { key: "heartRate", label: "Frequencia Cardiaca", order: 4, fieldType: "NUMBER", config: { unit: "bpm" } },
      { key: "oxygenSaturation", label: "Saturacao O2", order: 5, fieldType: "NUMBER", config: { unit: "%" } },
      { key: "heartAuscultation", label: "Ausculta Cardiaca", order: 6, fieldType: "TEXT" },
      { key: "lungAuscultation", label: "Ausculta Pulmonar", order: 7, fieldType: "TEXT" },
      { key: "peripheralPulses", label: "Pulsos Perifericos", order: 8, fieldType: "SHORT_TEXT" },
      { key: "edemaGrade", label: "Grau de Edema", order: 9, fieldType: "SHORT_TEXT" },
    ],
  },
  {
    name: "Hipotese e Conduta",
    order: 2,
    fields: [
      { key: "medications", label: "Medicamentos", order: 0, fieldType: "MEDICATIONS" },
      { key: "diagnosticHypothesis", label: "Hipotese Diagnostica", order: 1, fieldType: "TEXT" },
      { key: "conduct", label: "Conduta", order: 2, fieldType: "TEXT" },
      { key: "nextRecallDate", label: "Data do Proximo Retorno", order: 3, fieldType: "DATE" },
    ],
  },
];

const normalizeJson = (value: unknown): Prisma.InputJsonValue | undefined => {
  if (value == null) return undefined;
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
};

const normalizeResponses = (
  value: Record<string, unknown> | undefined,
): Prisma.InputJsonObject => {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonObject;
};

const validateUniqueKeys = (sections: CreateFormTemplateInput["sections"]) => {
  const keys = new Set<string>();
  for (const section of sections) {
    for (const field of section.fields) {
      if (keys.has(field.key)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `A chave de campo "${field.key}" esta duplicada no template`,
        });
      }
      keys.add(field.key);
    }
  }
};

const toSectionCreate = (
  section: DefaultSection,
): Prisma.AnamnesisFormSectionCreateWithoutTemplateInput => ({
  name: section.name,
  description: section.description,
  order: section.order,
  fields: {
    create: section.fields.map((field) => ({
      key: field.key,
      label: field.label,
      description: field.description,
      order: field.order,
      fieldType: field.fieldType,
      isRequired: field.isRequired ?? false,
      isVisible: true,
      config: normalizeJson(field.config),
      isSystemField: true,
      systemKey: field.key,
    })),
  },
});

const createDefaultTemplate = (db: DbClient, profileId: string) => {
  return db.anamnesisFormTemplate.create({
    data: {
      profileId,
      name: "Formulario Padrao",
      description: "Template padrao de anamnese cardiologica",
      isDefault: true,
      sections: {
        create: DEFAULT_ANAMNESIS_TEMPLATE.map(toSectionCreate),
      },
    },
    include: templateInclude,
  });
};

export const seedDefaultTemplate = async (
  db: DbClient,
  profileId: string,
) => {
  const existing = await db.anamnesisFormTemplate.findFirst({
    where: { profileId, isDefault: true },
    include: templateInclude,
  });

  if (existing) return existing;

  return createDefaultTemplate(db, profileId);
};

export const getDefaultTemplate = async (
  db: PrismaClient,
  profileId: string,
) => seedDefaultTemplate(db, profileId);

export const listTemplates = async (db: PrismaClient, profileId: string) => {
  return db.anamnesisFormTemplate.findMany({
    where: { profileId, isArchived: false },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
    include: templateInclude,
  });
};

export const getTemplateById = async (
  db: PrismaClient,
  profileId: string,
  templateId: string,
) => {
  const template = await db.anamnesisFormTemplate.findFirst({
    where: { id: templateId, profileId },
    include: templateInclude,
  });

  if (!template) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Template nao encontrado" });
  }

  return template;
};

const toCustomSectionCreate = (
  section: CreateFormTemplateInput["sections"][number],
  systemFieldsByKey = new Map<string, { fieldType: FormFieldType; systemKey: string | null }>(),
): Prisma.AnamnesisFormSectionCreateWithoutTemplateInput => ({
  name: section.name,
  description: section.description ?? undefined,
  order: section.order,
  isCollapsible: section.isCollapsible,
  fields: {
    create: section.fields.map((field) => {
      const systemField = systemFieldsByKey.get(field.key);
      const isKnownSystemField =
        Boolean(systemField) ||
        Boolean(field.isSystemField && SYSTEM_ANAMNESIS_FIELD_KEY_SET.has(field.key));

      return {
        key: field.key,
        label: field.label,
        description: field.description ?? undefined,
        order: field.order,
        fieldType: systemField?.fieldType ?? field.fieldType,
        isRequired: field.isRequired,
        isVisible: field.isVisible,
        config: normalizeJson(field.config),
        isSystemField: isKnownSystemField,
        systemKey: isKnownSystemField ? (systemField?.systemKey ?? field.key) : null,
      };
    }),
  },
});

export const createTemplate = async (
  db: PrismaClient,
  profileId: string,
  input: CreateFormTemplateInput,
) => {
  validateUniqueKeys(input.sections);

  return db.$transaction(async (tx) => {
    if (input.isDefault) {
      await tx.anamnesisFormTemplate.updateMany({
        where: { profileId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return tx.anamnesisFormTemplate.create({
      data: {
        profileId,
        name: input.name,
        description: input.description ?? undefined,
        isDefault: input.isDefault,
        sections: {
          create: input.sections.map((section) => toCustomSectionCreate(section)),
        },
      },
      include: templateInclude,
    });
  });
};

export const updateTemplate = async (
  db: PrismaClient,
  profileId: string,
  input: UpdateFormTemplateInput,
) => {
  const existing = await getTemplateById(db, profileId, input.id);
  const sections = input.sections;

  if (sections) {
    validateUniqueKeys(sections);

    const incomingFieldsByKey = new Map(
      sections.flatMap((section) => section.fields.map((field) => [field.key, field] as const)),
    );

    for (const systemField of existing.sections.flatMap((section) =>
      section.fields.filter((field) => field.isSystemField),
    )) {
      const incoming = incomingFieldsByKey.get(systemField.key);
      if (!incoming) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `O campo do sistema "${systemField.label}" nao pode ser removido`,
        });
      }

      if (incoming.fieldType !== systemField.fieldType) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `O tipo do campo do sistema "${systemField.label}" nao pode ser alterado`,
        });
      }
    }
  }

  const systemFieldsByKey = new Map(
    existing.sections
      .flatMap((section) => section.fields)
      .filter((field) => field.isSystemField)
      .map((field) => [
        field.key,
        {
          fieldType: field.fieldType as FormFieldType,
          systemKey: field.systemKey,
        },
      ]),
  );

  return db.$transaction(async (tx) => {
    if (input.isDefault) {
      await tx.anamnesisFormTemplate.updateMany({
        where: { profileId, isDefault: true, id: { not: input.id } },
        data: { isDefault: false },
      });
    }

    await tx.anamnesisFormTemplate.update({
      where: { id: input.id },
      data: {
        name: input.name,
        description: input.description,
        isDefault: input.isDefault,
      },
    });

    if (sections) {
      await tx.anamnesisFormSection.deleteMany({
        where: { templateId: input.id },
      });

      for (const section of sections) {
        await tx.anamnesisFormSection.create({
          data: {
            templateId: input.id,
            ...toCustomSectionCreate(section, systemFieldsByKey),
          },
        });
      }
    }

    return tx.anamnesisFormTemplate.findUniqueOrThrow({
      where: { id: input.id },
      include: templateInclude,
    });
  });
};

export const setDefaultTemplate = async (
  db: PrismaClient,
  profileId: string,
  templateId: string,
) => {
  const template = await getTemplateById(db, profileId, templateId);
  if (template.isArchived) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Templates arquivados nao podem ser padrao",
    });
  }

  return db.$transaction(async (tx) => {
    await tx.anamnesisFormTemplate.updateMany({
      where: { profileId, isDefault: true },
      data: { isDefault: false },
    });

    return tx.anamnesisFormTemplate.update({
      where: { id: templateId },
      data: { isDefault: true },
      include: templateInclude,
    });
  });
};

export const duplicateTemplate = async (
  db: PrismaClient,
  profileId: string,
  templateId: string,
) => {
  const template = await getTemplateById(db, profileId, templateId);

  return db.anamnesisFormTemplate.create({
    data: {
      profileId,
      name: `${template.name} (copia)`,
      description: template.description,
      isDefault: false,
      sections: {
        create: template.sections.map((section) => ({
          name: section.name,
          description: section.description,
          order: section.order,
          isCollapsible: section.isCollapsible,
          fields: {
            create: section.fields.map((field) => ({
              key: field.key,
              label: field.label,
              description: field.description,
              order: field.order,
              fieldType: field.fieldType,
              isRequired: field.isRequired,
              isVisible: field.isVisible,
              config: normalizeJson(field.config),
              isSystemField: field.isSystemField,
              systemKey: field.systemKey,
            })),
          },
        })),
      },
    },
    include: templateInclude,
  });
};

export const archiveTemplate = async (
  db: PrismaClient,
  profileId: string,
  templateId: string,
) => {
  const template = await getTemplateById(db, profileId, templateId);

  if (template.isDefault) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Defina outro template como padrao antes de arquivar este",
    });
  }

  return db.anamnesisFormTemplate.update({
    where: { id: templateId },
    data: { isArchived: true },
  });
};

export const sanitizeCustomResponses = (
  responses: Record<string, unknown> | undefined,
) => {
  const filtered = Object.fromEntries(
    Object.entries(responses ?? {}).filter(
      ([key]) => !SYSTEM_ANAMNESIS_FIELD_KEY_SET.has(key),
    ),
  );

  return normalizeResponses(filtered);
};
