"use client";

import { api } from "~/trpc/react";
import { CREDITS_MIN_TO_START, CREDITS_MIN_PER_BATCH } from "../config";

export const useConsultationCredits = () => {
  const query = api.credits.getBalance.useQuery();
  const balance = query.data ?? 0;

  return {
    balance,
    isLoading: query.isLoading,
    hasMinimumForSession: balance >= CREDITS_MIN_TO_START,
    hasMinimumForBatch: balance >= CREDITS_MIN_PER_BATCH,
    refresh: query.refetch,
  };
};
