"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { api } from "~/trpc/react";
import { useVadStateMachine } from "./useVadStateMachine";
import { useAudioBatchBuffer } from "./useAudioBatchBuffer";
import { useAudioBatchUploader } from "./useAudioBatchUploader";
import { useAnamnesisFormSync } from "./useAnamnesisFormSync";
import { resolveVisualState } from "../utils/visual-state";
import {
  consolidatedFormStateSchema,
  type ConsolidatedFormState,
} from "~/schemas/audio-anamnesis-form";

type Args = {
  sessionId: string;
};

export const useAudioConsultation = ({ sessionId }: Args) => {
  const sessionQuery = api.audioConsultation.getById.useQuery({ sessionId });

  const initialSession = useMemo(
    () =>
      sessionQuery.data
        ? {
            id: sessionQuery.data.id,
            status: sessionQuery.data.status,
            lastBatchIndex: sessionQuery.data.lastBatchIndex,
            currentFormState: consolidatedFormStateSchema.parse(
              sessionQuery.data.currentFormState,
            ),
            creditsConsumed: sessionQuery.data.creditsConsumed,
          }
        : null,
    [sessionQuery.data],
  );

  const { session } = useAnamnesisFormSync(sessionId, initialSession);

  const buffer = useAudioBatchBuffer();
  const uploader = useAudioBatchUploader();
  const batchIndexRef = useRef(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sendCurrentBatch = useCallback(() => {
    const ready = buffer.flush();
    if (!ready || !session) return;

    const idx = batchIndexRef.current;
    batchIndexRef.current += 1;

    uploader.enqueue({
      sessionId: session.id,
      patientId: session.id ? sessionQuery.data?.patientId ?? "" : "",
      consultationId: sessionQuery.data?.consultationId ?? null,
      batchIndex: idx,
      batch: ready,
    });
  }, [buffer, uploader, session, sessionQuery.data]);

  const vad = useVadStateMachine({
    onSpeechEnd: (chunk) => {
      buffer.pushChunk(chunk);
      if (buffer.shouldFlush()) {
        sendCurrentBatch();
      }
    },
    onIdle: () => {
      sendCurrentBatch();
    },
    shouldFlush: buffer.shouldFlush,
  });

  const start = useCallback(async () => {
    setErrorMessage(null);
    try {
      await vad.start();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Erro ao iniciar microfone",
      );
    }
  }, [vad]);

  const pause = useCallback(() => {
    vad.pause();
  }, [vad]);

  const stop = useCallback(async () => {
    sendCurrentBatch();
    await vad.stop();
  }, [sendCurrentBatch, vad]);

  const visualState = resolveVisualState(
    session?.status ?? null,
    vad.state,
    uploader.isUploading,
  );

  const formState: ConsolidatedFormState | null =
    session?.currentFormState ?? null;

  return {
    session,
    formState,
    visualState,
    isLoading: sessionQuery.isLoading,
    errorMessage,
    start,
    pause,
    stop,
  };
};
