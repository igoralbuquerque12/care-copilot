"use client";

import { useCallback, useRef } from "react";
import {
  AUDIO_SAMPLE_RATE,
  computeDurationSeconds,
  concatFloat32,
  encodeWav,
  extractTail,
} from "../utils/wav";
import { MAX_BATCH_SAMPLES } from "../config";

export type ReadyBatch = {
  blob: Blob;
  durationSeconds: number;
  hasOverlap: boolean;
  startedAt: Date;
  endedAt: Date;
};

export const useAudioBatchBuffer = () => {
  const chunksRef = useRef<Float32Array[]>([]);
  const previousTailRef = useRef<Float32Array | null>(null);
  const samplesInBufferRef = useRef<number>(0);
  const batchStartRef = useRef<Date>(new Date());

  const pushChunk = useCallback((chunk: Float32Array) => {
    if (chunksRef.current.length === 0) {
      batchStartRef.current = new Date();
    }
    chunksRef.current.push(chunk);
    samplesInBufferRef.current += chunk.length;
  }, []);

  const shouldFlush = useCallback(
    () => samplesInBufferRef.current >= MAX_BATCH_SAMPLES,
    [],
  );

  const flush = useCallback((): ReadyBatch | null => {
    if (chunksRef.current.length === 0) return null;

    const main = concatFloat32(chunksRef.current);
    const tail = previousTailRef.current;
    const final = tail ? concatFloat32([tail, main]) : main;

    const blob = encodeWav(final, AUDIO_SAMPLE_RATE);
    const batch: ReadyBatch = {
      blob,
      durationSeconds: computeDurationSeconds(final),
      hasOverlap: tail !== null,
      startedAt: batchStartRef.current,
      endedAt: new Date(),
    };

    previousTailRef.current = extractTail(final);
    chunksRef.current.length = 0;
    samplesInBufferRef.current = 0;

    return batch;
  }, []);

  const reset = useCallback(() => {
    chunksRef.current.length = 0;
    samplesInBufferRef.current = 0;
    previousTailRef.current = null;
  }, []);

  return { pushChunk, shouldFlush, flush, reset };
};
