"use client";

import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import type { ReadyBatch } from "./useAudioBatchBuffer";

type UploadInput = {
  sessionId: string;
  patientId: string;
  consultationId?: string | null;
  batchIndex: number;
  batch: ReadyBatch;
};

const MAX_RETRIES = 3;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

const getUploadErrorMessage = (error: unknown) => {
  if (!(error instanceof Error)) {
    return "Falha ao enviar lote de áudio";
  }

  const body = /^Falha no upload \(\d+\):\s*(.*)$/s.exec(error.message)?.[1];
  if (!body) {
    return error.message;
  }

  try {
    const parsed = JSON.parse(body) as { error?: unknown };
    if (typeof parsed.error === "string" && parsed.error.trim()) {
      return parsed.error;
    }
  } catch {
    return error.message;
  }

  return error.message;
};

const sendOnce = async (input: UploadInput): Promise<void> => {
  const form = new FormData();
  form.append(
    "file",
    input.batch.blob,
    `${input.sessionId}-${input.batchIndex}.wav`,
  );
  form.append(
    "payload",
    JSON.stringify({
      sessionId: input.sessionId,
      patientId: input.patientId,
      consultationId: input.consultationId ?? null,
      batchIndex: input.batchIndex,
      hasOverlap: input.batch.hasOverlap,
      audioDurationSeconds: input.batch.durationSeconds,
      startedAt: input.batch.startedAt.toISOString(),
      endedAt: input.batch.endedAt.toISOString(),
    }),
  );

  const res = await fetch("/api/audio/ingest", {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Falha no upload (${res.status}): ${text}`);
  }
};

export const useAudioBatchUploader = () => {
  const [isUploading, setIsUploading] = useState(false);
  const queueRef = useRef<UploadInput[]>([]);
  const runningRef = useRef(false);

  const drain = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setIsUploading(true);

    try {
      while (queueRef.current.length > 0) {
        const next = queueRef.current[0];
        if (!next) break;

        let attempt = 0;
        let lastError: unknown = null;

        while (attempt < MAX_RETRIES) {
          try {
            await sendOnce(next);
            lastError = null;
            break;
          } catch (error) {
            lastError = error;
            attempt += 1;
            await sleep(500 * 2 ** attempt);
          }
        }

        if (lastError) {
          console.error("[useAudioBatchUploader] desistindo do lote", lastError);
          toast.error(getUploadErrorMessage(lastError), {
            id: "audio-batch-upload-error",
          });
        }
        queueRef.current.shift();
      }
    } finally {
      runningRef.current = false;
      setIsUploading(false);
    }
  }, []);

  const enqueue = useCallback(
    (input: UploadInput) => {
      queueRef.current.push(input);
      void drain();
    },
    [drain],
  );

  return { enqueue, isUploading };
};
