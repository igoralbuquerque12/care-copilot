import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

import { profileRouter } from "~/server/api/routers/profile.router";
import { patientRouter } from "~/server/api/routers/patient.router";
import { anamnesisRouter } from "~/server/api/routers/anamnesis.router";
import { scheduleConsultationRouter } from "~/server/api/routers/scheduleConsultation.router";
import { aiDiagnosisRouter } from "~/server/api/routers/aiDiagnosis.router";
import { creditsRouter } from "~/server/api/routers/credits.router";
import { audioConsultationRouter } from "~/server/api/routers/audioConsultation.router";

export const appRouter = createTRPCRouter({
  profile: profileRouter,
  patient: patientRouter,
  anamnesis: anamnesisRouter,
  scheduleConsultation: scheduleConsultationRouter,
  aiDiagnosis: aiDiagnosisRouter,
  credits: creditsRouter,
  audioConsultation: audioConsultationRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);