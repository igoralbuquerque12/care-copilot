import type { AudioSessionStatus } from "~/schemas/audio-session";
import type { AudioVisualState, VadFsmState } from "../types/audio-session.types";

const SERVER_STATUS_TO_VISUAL: Partial<Record<AudioSessionStatus, AudioVisualState>> = {
  WAITING_FOR_PATIENT: "waiting_for_patient",
  READY: "ready_to_record",
  PROCESSING: "processing",
  SYNCED: "synced",
  FINALIZED: "synced",
  ERROR: "error",
  INSUFFICIENT_CREDITS: "insufficient_credits",
};

export const resolveVisualState = (
  serverStatus: AudioSessionStatus | null,
  vadState: VadFsmState,
  isUploading: boolean,
): AudioVisualState => {
  if (!serverStatus) return "waiting_for_patient";

  if (serverStatus === "ERROR" || serverStatus === "INSUFFICIENT_CREDITS") {
    return SERVER_STATUS_TO_VISUAL[serverStatus] ?? "error";
  }

  if (isUploading) return "uploading";
  if (vadState === "LISTENING") return "listening";
  if (vadState === "BUFFERING") return "buffering";

  return SERVER_STATUS_TO_VISUAL[serverStatus] ?? "ready_to_record";
};

export const VISUAL_STATE_LABEL: Record<AudioVisualState, string> = {
  waiting_for_patient: "Aguardando paciente",
  ready_to_record: "Pronto para gravar",
  listening: "Ouvindo",
  buffering: "Aguardando proxima fala",
  uploading: "Enviando audio",
  processing: "Processando com IA",
  synced: "Atualizado",
  error: "Erro",
  insufficient_credits: "Creditos insuficientes",
};
