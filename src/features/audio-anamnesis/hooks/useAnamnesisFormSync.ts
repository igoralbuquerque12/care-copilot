"use client";

import { useEffect, useState } from "react";
import {
  consolidatedFormStateSchema,
  type ConsolidatedFormState,
} from "~/schemas/audio-anamnesis-form";
import type { AudioSessionStatus } from "~/schemas/audio-session";
import { getSupabaseBrowserClient } from "~/lib/supabase/browser";

type SessionRow = {
  id: string;
  status: AudioSessionStatus;
  last_batch_index: number;
  current_form_state: unknown;
  credits_consumed: number;
};

type SyncedSession = {
  id: string;
  status: AudioSessionStatus;
  lastBatchIndex: number;
  currentFormState: ConsolidatedFormState;
  creditsConsumed: number;
};

const parseRow = (row: SessionRow): SyncedSession | null => {
  const parsed = consolidatedFormStateSchema.safeParse(row.current_form_state);
  if (!parsed.success) {
    console.warn("[useAnamnesisFormSync] form state invalido:", parsed.error);
    return null;
  }
  return {
    id: row.id,
    status: row.status,
    lastBatchIndex: row.last_batch_index,
    currentFormState: parsed.data,
    creditsConsumed: row.credits_consumed,
  };
};

export const useAnamnesisFormSync = (
  sessionId: string | null,
  initial: SyncedSession | null,
) => {
  const [session, setSession] = useState<SyncedSession | null>(initial);

  // useState only uses initial on mount; this syncs when the tRPC query resolves
  useEffect(() => {
    setSession((prev) => prev ?? initial);
  }, [initial]);

  useEffect(() => {
    if (!sessionId) return;

    const supabase = getSupabaseBrowserClient();
    const channel = supabase
      .channel(`audio-session:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "audio_consultation_session",
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          const next = parseRow(payload.new as SessionRow);
          if (!next) return;
          setSession((prev) => {
            if (!prev || next.lastBatchIndex >= prev.lastBatchIndex) {
              return next;
            }
            return prev;
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [sessionId]);

  return { session, setSession };
};
