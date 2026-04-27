import type { CreateAnamnesisInput } from "~/schemas/anamnesis";
import type { ConsolidatedFormState } from "~/schemas/audio-anamnesis-form";

type MapContext = {
  patientId: string;
  consultationId?: string;
};

export const mapConsolidatedFormToAnamnesisInput = (
  form: ConsolidatedFormState,
  ctx: MapContext,
): CreateAnamnesisInput => {
  const a = form.anamnesis;
  const px = a.physicalExam;

  const physicalExam =
    px.weight ??
    px.height ??
    px.bpSystolic ??
    px.bpDiastolic ??
    px.heartRate ??
    px.oxygenSaturation ??
    px.heartAuscultation ??
    px.lungAuscultation ??
    px.peripheralPulses ??
    px.edemaGrade
      ? {
          weight: px.weight ?? undefined,
          height: px.height ?? undefined,
          bpSystolic: px.bpSystolic ?? undefined,
          bpDiastolic: px.bpDiastolic ?? undefined,
          heartRate: px.heartRate ?? undefined,
          oxygenSaturation: px.oxygenSaturation ?? undefined,
          heartAuscultation: px.heartAuscultation ?? undefined,
          lungAuscultation: px.lungAuscultation ?? undefined,
          peripheralPulses: px.peripheralPulses ?? undefined,
          edemaGrade: px.edemaGrade ?? undefined,
        }
      : undefined;

  return {
    patientId: ctx.patientId,
    consultationId: ctx.consultationId,
    chiefComplaint: a.chiefComplaint || "Coletado por captura de audio",
    currentIllnessHistory:
      a.currentIllnessHistory || "Coletado por captura de audio",
    treatmentResponse: a.treatmentResponse || undefined,
    symptomEvolution: a.symptomEvolution || undefined,
    newEvents: a.newEvents || undefined,
    nyhaClass: a.nyhaClass ?? "I",
    hasPalpitations: a.hasPalpitations ?? false,
    hasSyncope: a.hasSyncope ?? false,
    hasEdema: a.hasEdema ?? false,
    hasChestPain: a.hasChestPain ?? false,
    physicalExam,
    medications: a.medications.length ? a.medications : undefined,
    diagnosticHypothesis: a.diagnosticHypothesis || undefined,
    conduct: a.conduct || undefined,
    nextRecallDate: a.nextRecallDate ?? undefined,
  };
};
