export const CLINICAL_CHAT_MODEL = "gpt-5.6-terra";
export const CLINICAL_CHAT_BUCKET = "clinical-chat-attachments";
export const CLINICAL_CHAT_MAX_MESSAGE_LENGTH = 8_000;
export const CLINICAL_CHAT_MAX_ATTACHMENTS_PER_TURN = 5;
export const CLINICAL_CHAT_MAX_FILE_BYTES = 20_000_000;
export const CLINICAL_CHAT_MAX_TOTAL_ATTACHMENT_BYTES = 50_000_000;
export const CLINICAL_CHAT_SIGNED_URL_TTL_SECONDS = 30 * 60;
export const CLINICAL_CHAT_STALE_LOCK_MS = 10 * 60 * 1_000;

export const CLINICAL_CHAT_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
