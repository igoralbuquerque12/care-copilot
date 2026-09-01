import type { Prisma } from "@prisma/client";
import {
  createFormSnapshot,
  readFormSnapshot,
} from "./aiDiagnosis/form-snapshot";

export const clinicalTemplateInclude = {
  sections: {
    orderBy: { order: "asc" as const },
    include: { fields: { orderBy: { order: "asc" as const } } },
  },
};

export type AnamnesisWithClinicalRelations = Prisma.AnamnesisGetPayload<{
  include: {
    physicalExam: true;
    medications: true;
    template: { include: typeof clinicalTemplateInclude };
  };
}>;

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

export const anamnesisToClinicalRecord = (
  anamnesis: AnamnesisWithClinicalRelations,
) => {
  const snapshot =
    readFormSnapshot(anamnesis.formSnapshot) ??
    (anamnesis.template
      ? readFormSnapshot(createFormSnapshot(anamnesis.template, "APPROXIMATED"))
      : null);
  const labels = new Map(
    snapshot?.sections.flatMap((section) =>
      section.fields.map((field) => [field.key, field.label] as const),
    ) ?? [],
  );
  const custom = Object.fromEntries(
    Object.entries(asRecord(anamnesis.customResponses)).map(([key, value]) => [
      labels.get(key) ?? key,
      value,
    ]),
  );
  const exam = anamnesis.physicalExam;

  return {
    id: anamnesis.id,
    date: anamnesis.date,
    templateName:
      snapshot?.templateName ??
      anamnesis.template?.name ??
      "Formulario nao identificado",
    fields: {
      "Queixa principal": anamnesis.chiefComplaint,
      "Historia da doenca atual": anamnesis.currentIllnessHistory,
      "Resposta ao tratamento": anamnesis.treatmentResponse,
      "Evolucao dos sintomas": anamnesis.symptomEvolution,
      "Novos eventos": anamnesis.newEvents,
      "Classe NYHA": anamnesis.nyhaClass,
      Sintomas: {
        palpitacoes: anamnesis.hasPalpitations,
        sincope: anamnesis.hasSyncope,
        edema: anamnesis.hasEdema,
        dorToracica: anamnesis.hasChestPain,
      },
      "Exame fisico": exam
        ? {
            peso: exam.weight,
            altura: exam.height,
            pressaoSistolica: exam.bpSystolic,
            pressaoDiastolica: exam.bpDiastolic,
            frequenciaCardiaca: exam.heartRate,
            saturacaoOxigenio: exam.oxygenSaturation,
            auscultaCardiaca: exam.heartAuscultation,
            auscultaPulmonar: exam.lungAuscultation,
            pulsosPerifericos: exam.peripheralPulses,
            grauEdema: exam.edemaGrade,
          }
        : null,
      Medicamentos: anamnesis.medications.map(
        ({ name, dosage, frequency }) => ({
          name,
          dosage,
          frequency,
        }),
      ),
      "Hipotese diagnostica do medico": anamnesis.diagnosticHypothesis,
      "Conduta do medico": anamnesis.conduct,
      "Proximo retorno": anamnesis.nextRecallDate,
      "Campos personalizados": custom,
    },
  };
};

export const withoutInternalAnamnesisId = (
  record: ReturnType<typeof anamnesisToClinicalRecord>,
) => ({
  date: record.date,
  templateName: record.templateName,
  fields: record.fields,
});
