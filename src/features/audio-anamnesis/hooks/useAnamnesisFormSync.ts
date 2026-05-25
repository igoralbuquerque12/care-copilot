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

const parseFormState = (value: unknown) => {
  if (typeof value === "string") {
    try {
      return consolidatedFormStateSchema.safeParse(JSON.parse(value));
    } catch {
      return consolidatedFormStateSchema.safeParse(value);
    }
  }

  return consolidatedFormStateSchema.safeParse(value);
};

const parseRow = (row: SessionRow): SyncedSession | null => {
  const parsed = parseFormState(row.current_form_state);
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
    if (!initial) return;

    setSession((prev) => {
      if (!prev || initial.lastBatchIndex >= prev.lastBatchIndex) {
        return initial;
      }
      return prev;
    });
  }, [initial]);

  useEffect(() => {
    if (!sessionId) return;

    const supabase = getSupabaseBrowserClient();
    console.log("[useAnamnesisFormSync] subscribing to realtime updates for session: audio-session:", sessionId);
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
          console.log("[useAnamnesisFormSync] realtime payload recebido:", {
            eventType: payload.eventType,
            new: payload.new,
            old: payload.old,
          });
          const next = parseRow(payload.new as SessionRow);
          console.log("[useAnamnesisFormSync] realtime payload parseado:", next);
          if (!next) return;
          setSession((prev) => {
            if (!prev || next.lastBatchIndex >= prev.lastBatchIndex) {
              return next;
            }
            return prev;
          });
        },
      )
      .subscribe((status, error) => {
        console.log("[useAnamnesisFormSync] realtime subscription:", {
          channel: `audio-session:${sessionId}`,
          status,
          error,
        });
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [sessionId]);

  return { session, setSession };
};
