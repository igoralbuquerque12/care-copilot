import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import * as creditLedger from "~/server/services/credits/creditLedger.service";

export const creditsRouter = createTRPCRouter({
  getBalance: protectedProcedure.query(({ ctx }) =>
    creditLedger.getBalance(ctx.db, ctx.user.id),
  ),

  getRecentLedger: protectedProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(20),
      }),
    )
    .query(({ ctx, input }) =>
      creditLedger.getRecentLedger(ctx.db, ctx.user.id, input.page, input.pageSize),
    ),
});
