import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  finalizeAudioSessionSchema,
  startAudioSessionSchema,
} from "~/schemas/audio-session";
import * as audioSession from "~/server/services/audio/services/session.service";

export const audioConsultationRouter = createTRPCRouter({
  start: protectedProcedure
    .input(startAudioSessionSchema)
    .mutation(({ ctx, input }) =>
      audioSession.startSession(ctx.db, ctx.user.id, input),
    ),

  getById: protectedProcedure
    .input(z.object({ sessionId: z.string().cuid() }))
    .query(({ ctx, input }) =>
      audioSession.getSession(ctx.db, ctx.user.id, input.sessionId),
    ),

  getReviewSummary: protectedProcedure
    .input(z.object({ sessionId: z.string().cuid() }))
    .query(({ ctx, input }) =>
      audioSession.getReviewSummary(ctx.db, ctx.user.id, input.sessionId),
    ),

  finalize: protectedProcedure
    .input(finalizeAudioSessionSchema)
    .mutation(({ ctx, input }) =>
      audioSession.finalizeSession(
        ctx.db,
        ctx.user.id,
        input.sessionId,
        input.formState,
      ),
    ),
});
