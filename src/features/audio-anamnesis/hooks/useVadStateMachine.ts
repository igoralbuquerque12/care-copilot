"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { VadFsmState } from "../types/audio-session.types";
import { SILENCE_TIMEOUT_MS, MAX_BATCH_SECONDS } from "../config";

type VadOptions = {
  onSpeechEnd: (chunk: Float32Array) => void;
  onIdle: () => void;
  shouldFlush: (currentBufferSeconds: number) => boolean;
};

export const useVadStateMachine = (options: VadOptions) => {
  const [state, setState] = useState<VadFsmState>("IDLE");
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const vadInstanceRef = useRef<{ start: () => void; pause: () => void; destroy: () => void | Promise<void> } | null>(null);
  const startedAtRef = useRef<number>(Date.now());
  const optsRef = useRef(options);

  useEffect(() => {
    optsRef.current = options;
  }, [options]);

  const clearIdleTimer = () => {
    if (idleTimerRef.current) {
      clearTimeout(idleTimerRef.current);
      idleTimerRef.current = null;
    }
  };

  const scheduleIdle = useCallback(() => {
    clearIdleTimer();
    idleTimerRef.current = setTimeout(() => {
      setState("IDLE");
      optsRef.current.onIdle();
    }, SILENCE_TIMEOUT_MS);
  }, []);

  const start = useCallback(async () => {
    if (vadInstanceRef.current) {
      vadInstanceRef.current.start();
      setState("BUFFERING");
      scheduleIdle();
      return;
    }

    let mod;
    try {
      mod = await import("@ricky0123/vad-web");
    } catch (error) {
      console.error("[useVadStateMachine] VAD module not installed:", error);
      throw new Error(
        "Dependência '@ricky0123/vad-web' não instalada. Instale com `npm i @ricky0123/vad-web onnxruntime-web`.",
      );
    }

    const vad = await mod.MicVAD.new({
      model: "v5",
      baseAssetPath: "/",
      onnxWASMBasePath: "/",
      onSpeechStart: () => {
        clearIdleTimer();
        setState("LISTENING");
      },
      onSpeechEnd: (audio: Float32Array) => {
        optsRef.current.onSpeechEnd(audio);
        setState("BUFFERING");
        scheduleIdle();
      },
    });

    vadInstanceRef.current = vad;
    startedAtRef.current = Date.now();
    await vad.start();
    setState("BUFFERING");
    scheduleIdle();
  }, [scheduleIdle]);

  const pause = useCallback(() => {
    clearIdleTimer();
    vadInstanceRef.current?.pause();
    setState("IDLE");
  }, []);

  const stop = useCallback(async () => {
    clearIdleTimer();
    if (vadInstanceRef.current) {
      await vadInstanceRef.current.destroy();
      vadInstanceRef.current = null;
    }
    setState("IDLE");
  }, []);

  useEffect(() => {
    return () => {
      clearIdleTimer();
      void vadInstanceRef.current?.destroy();
      vadInstanceRef.current = null;
    };
  }, []);

  return { state, start, pause, stop, MAX_BATCH_SECONDS };
};
