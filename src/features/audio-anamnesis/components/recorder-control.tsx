"use client";

import { Mic, Pause, Square, Loader2 } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  VISUAL_STATE_LABEL,
} from "../utils/visual-state";
import type { AudioVisualState } from "../types/audio-session.types";

type Props = {
  visualState: AudioVisualState;
  onStart: () => void | Promise<void>;
  onPause: () => void;
  onStop: () => void | Promise<void>;
  onFinalize: () => void | Promise<void>;
  isFinalizing: boolean;
  canFinalize: boolean;
};

const PILL_CLASS: Record<AudioVisualState, string> = {
  waiting_for_patient: "bg-muted text-muted-foreground",
  ready_to_record: "bg-primary/10 text-primary",
  listening: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  buffering: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  uploading: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  processing: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400",
  synced: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  error: "bg-destructive/15 text-destructive",
  insufficient_credits: "bg-destructive/15 text-destructive",
};

export function RecorderControl({
  visualState,
  onStart,
  onPause,
  onStop,
  onFinalize,
  isFinalizing,
  canFinalize,
}: Props) {
  const isActive = visualState === "listening" || visualState === "buffering";
  const isBlocked =
    visualState === "error" || visualState === "insufficient_credits";

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
      <span
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${PILL_CLASS[visualState]}`}
      >
        {visualState === "uploading" && <Loader2 className="h-3 w-3 animate-spin" />}
        {VISUAL_STATE_LABEL[visualState]}
      </span>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        {!isActive ? (
          <Button onClick={onStart} disabled={isBlocked}>
            <Mic className="mr-2 h-4 w-4" /> Iniciar
          </Button>
        ) : (
          <Button onClick={onPause} variant="outline">
            <Pause className="mr-2 h-4 w-4" /> Pausar
          </Button>
        )}
        <Button onClick={onStop} variant="outline" disabled={isBlocked}>
          <Square className="mr-2 h-4 w-4" /> Parar lote
        </Button>
        <Button
          onClick={onFinalize}
          disabled={!canFinalize || isFinalizing}
          variant="default"
        >
          {isFinalizing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Finalizar consulta
        </Button>
      </div>
    </div>
  );
}
