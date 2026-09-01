import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import {
  buildClinicalChatContext,
  buildClinicalChatResponseParams,
} from "./context";
import { validateClinicalAttachments } from "./storage";

const anamnesis = (id: string, date: string, complaint: string) => ({
  id,
  date: new Date(date),
  patientId: "patient",
  profileId: "profile",
  chiefComplaint: complaint,
  currentIllnessHistory: `Historia ${complaint}`,
  treatmentResponse: null,
  symptomEvolution: null,
  newEvents: null,
  nyhaClass: "I" as const,
  hasPalpitations: false,
  hasSyncope: false,
  hasEdema: false,
  hasChestPain: false,
  consultationId: null,
  templateId: null,
  customResponses: {},
  formSnapshot: null,
  contentVersion: 2,
  updatedAt: new Date(date),
  diagnosticHypothesis: "Hipotese medica",
  conduct: "Conduta medica",
  nextRecallDate: null,
  physicalExam: null,
  medications: [],
  template: null,
  surgicalRisk: null as Record<string, unknown> | null,
  aiDiagnoses: [] as Array<Record<string, unknown>>,
});

const fixture = () => {
  const old = anamnesis("old", "2025-01-01T12:00:00Z", "Dispneia");
  const current = anamnesis("current", "2026-01-01T12:00:00Z", "Dor toracica");
  current.surgicalRisk = { surgeryName: "Colecistectomia", leeScore: 1 };
  current.aiDiagnoses = [
    {
      result: { summary: "Analise existente" },
      summary: "Analise existente",
      anamnesisVersion: 2,
      resultSchemaVersion: 2,
      provider: "OPENAI",
      model: "configured-model-that-must-not-drive-chat",
      completedAt: new Date("2026-01-01T13:00:00Z"),
      createdAt: new Date("2026-01-01T13:00:00Z"),
    },
  ];
  const later = anamnesis("later", "2026-06-01T12:00:00Z", "Retorno futuro");
  const patient = {
    birthDate: new Date("1980-01-01T12:00:00Z"),
    gender: "Feminino",
    clinicalProfile: { hasHypertension: true },
    anamneses: [old, current, later],
  };
  const messages = [
    {
      role: "USER",
      status: "COMPLETED",
      content: "Explique o risco",
      sequence: 1,
      attachments: [],
    },
    {
      role: "ASSISTANT",
      status: "COMPLETED",
      content: "Resposta anterior",
      sequence: 2,
      attachments: [],
    },
    {
      role: "ASSISTANT",
      status: "FAILED",
      content: "Resposta parcial",
      sequence: 3,
      attachments: [],
    },
  ];
  const patientFindFirst = vi.fn().mockResolvedValue(patient);
  const settingsFindUnique = vi.fn().mockResolvedValue(null);
  const db = {
    patient: { findFirst: patientFindFirst },
    clinicalChatMessage: { findMany: vi.fn().mockResolvedValue(messages) },
    aiAnalysisSettings: { findUnique: settingsFindUnique },
  } as unknown as PrismaClient;
  return { db, patientFindFirst, settingsFindUnique };
};

describe("clinical chat context", () => {
  it("uses the selected anamnesis, current risk and analysis, and only earlier records", async () => {
    const { db, patientFindFirst } = fixture();
    const built = await buildClinicalChatContext(
      db,
      "profile",
      "patient",
      "chat",
      "current",
    );

    expect(built.currentAnamnesisId).toBe("current");
    expect(
      built.clinicalContext.currentAnamnesis?.fields["Queixa principal"],
    ).toBe("Dor toracica");
    expect(built.clinicalContext.currentSurgicalRisk).toMatchObject({
      surgeryName: "Colecistectomia",
    });
    expect(built.clinicalContext.currentAiAnalysis).toMatchObject({
      isCurrent: true,
    });
    expect(built.clinicalContext.previousAnamneses).toHaveLength(1);
    expect(
      built.clinicalContext.previousAnamneses[0]?.fields["Queixa principal"],
    ).toBe("Dispneia");
    expect(JSON.stringify(built.clinicalContext)).not.toContain(
      "Retorno futuro",
    );
    expect(JSON.stringify(built.clinicalContext)).not.toContain("cpf");
    expect(JSON.stringify(patientFindFirst.mock.calls[0]?.[0])).not.toContain(
      "isValid",
    );
  });

  it("builds a stateless request with the fixed model and complete local history", async () => {
    const { db } = fixture();
    const params = await buildClinicalChatResponseParams(
      db,
      "profile",
      "patient",
      "chat",
      "current",
    );

    expect(params.model).toBe("gpt-5.6-terra");
    expect(params.store).toBe(false);
    expect(params.stream).toBe(true);
    expect(params.truncation).toBe("disabled");
    expect(params).not.toHaveProperty("tools");
    expect(params).not.toHaveProperty("previous_response_id");
    expect(params.instructions).toContain("Dor toracica");
    expect(JSON.stringify(params.input)).toContain("Explique o risco");
    expect(JSON.stringify(params.input)).toContain("Resposta anterior");
    expect(JSON.stringify(params.input)).toContain("Resposta parcial");
    expect(JSON.stringify(params.input)).toContain("interrompida e incompleta");
  });

  it("resolves only the variables referenced by the physician prompt", async () => {
    const { db, settingsFindUnique } = fixture();
    settingsFindUnique.mockResolvedValue({
      clinicalChatPromptTemplate:
        "CASO ATUAL:\n${anamnese_atual}\nMODELO: ${modelo_chat}",
    });

    const params = await buildClinicalChatResponseParams(
      db,
      "profile",
      "patient",
      "chat",
      "current",
    );

    expect(params.instructions).toContain("Dor toracica");
    expect(params.instructions).toContain("gpt-5.6-terra");
    expect(params.instructions).not.toContain("Colecistectomia");
    expect(params.instructions).not.toContain("${anamnese_atual}");
  });
});

describe("clinical attachment validation", () => {
  it("accepts a PDF only when its binary signature matches", async () => {
    const valid = Object.assign(
      new Blob(["%PDF-1.7 test"], { type: "application/pdf" }),
      { name: "exame.pdf" },
    );
    await expect(validateClinicalAttachments([valid])).resolves.toMatchObject([
      { originalName: "exame.pdf", mimeType: "application/pdf" },
    ]);

    const disguised = Object.assign(
      new Blob(["not a pdf"], { type: "application/pdf" }),
      { name: "exame.pdf" },
    );
    await expect(validateClinicalAttachments([disguised])).rejects.toThrow(
      "nao corresponde",
    );
  });

  it("rejects unsupported file types", async () => {
    const file = Object.assign(new Blob(["text"], { type: "text/plain" }), {
      name: "exame.txt",
    });
    await expect(validateClinicalAttachments([file])).rejects.toThrow(
      "Formato nao permitido",
    );
  });
});
