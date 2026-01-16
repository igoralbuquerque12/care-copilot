import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

import { profileRouter } from "~/server/api/routers/profile.router";
import { patientRouter } from "~/server/api/routers/patient.router";
import { anamnesisRouter } from "~/server/api/routers/anamnesis.router";

export const appRouter = createTRPCRouter({
  profile: profileRouter,
  patient: patientRouter,
  anamnesis: anamnesisRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);