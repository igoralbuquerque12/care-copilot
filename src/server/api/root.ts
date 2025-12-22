import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

import { profileRouter } from "~/server/api/routers/profile.router";

export const appRouter = createTRPCRouter({
  profile: profileRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);