import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

import { profileRouter } from "~/server/api/routers/profile.router";
import { patientRouter } from "~/server/api/routers/patient.router";
import { anamnesisRouter } from "~/server/api/routers/anamnesis.router";
import { scheduleConsultationRouter } from "~/server/api/routers/scheduleConsultation.router";
import { creditsRouter } from "~/server/api/routers/credits.router";
import { audioConsultationRouter } from "~/server/api/routers/audioConsultation.router";
import { formTemplateRouter } from "~/server/api/routers/formTemplate.router";
import { surgicalRiskRouter } from "~/server/api/routers/surgicalRisk.router";

export const appRouter = createTRPCRouter({
  profile: profileRouter,
  patient: patientRouter,
  anamnesis: anamnesisRouter,
  scheduleConsultation: scheduleConsultationRouter,
  credits: creditsRouter,
  audioConsultation: audioConsultationRouter,
  formTemplate: formTemplateRouter,
  surgicalRisk: surgicalRiskRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
