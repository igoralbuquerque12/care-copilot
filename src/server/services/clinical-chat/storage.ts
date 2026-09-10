import { randomUUID } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { SupabaseService } from "../../supabase/supabase-admin";
import {
  CLINICAL_CHAT_BUCKET,
  CLINICAL_CHAT_MAX_ATTACHMENTS_PER_TURN,
  CLINICAL_CHAT_MAX_FILE_BYTES,
  CLINICAL_CHAT_MIME_TYPES,
  CLINICAL_CHAT_SIGNED_URL_TTL_SECONDS,
} from "./constants";

type AcceptedMimeType = (typeof CLINICAL_CHAT_MIME_TYPES)[number];

export type ValidatedClinicalAttachment = {
  file: Blob;
  originalName: string;
  mimeType: AcceptedMimeType;
  sizeBytes: number;
  extension: string;
};

export type StoredClinicalAttachment = Omit<
  ValidatedClinicalAttachment,
  "file" | "extension"
> & {
  storagePath: string;
};

let bucketPromise: Promise<void> | null = null;

const ensureBucket = async () => {
  bucketPromise ??= (async () => {
    const storage = SupabaseService.client.storage;
    const { data } = await storage.getBucket(CLINICAL_CHAT_BUCKET);
    if (data) return;
    const { error } = await storage.createBucket(CLINICAL_CHAT_BUCKET, {
      public: false,
      fileSizeLimit: CLINICAL_CHAT_MAX_FILE_BYTES,
      allowedMimeTypes: [...CLINICAL_CHAT_MIME_TYPES],
    });
    if (error && !/already exists|duplicate/i.test(error.message)) {
      throw new Error(
        `Falha ao preparar storage do chat clinico: ${error.message}`,
      );
    }
  })().catch((error) => {
    bucketPromise = null;
    throw error;
  });
  return bucketPromise;
};

const normalizedMimeType = (value: string): AcceptedMimeType | null => {
  const normalized =
    value.toLowerCase() === "image/jpg" ? "image/jpeg" : value.toLowerCase();
  return CLINICAL_CHAT_MIME_TYPES.includes(normalized as AcceptedMimeType)
    ? (normalized as AcceptedMimeType)
    : null;
};

const allowedExtensions: Record<AcceptedMimeType, string[]> = {
  "application/pdf": ["pdf"],
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
};

const matchesMagicBytes = (mimeType: AcceptedMimeType, bytes: Uint8Array) => {
  if (mimeType === "application/pdf") {
    return (
      bytes[0] === 0x25 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x44 &&
      bytes[3] === 0x46 &&
      bytes[4] === 0x2d
    );
  }
  if (mimeType === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (mimeType === "image/png") {
    return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every(
      (value, index) => bytes[index] === value,
    );
  }
  return (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  );
};

const safeOriginalName = (name: string) => {
  const basename = name.split(/[\\/]/).pop() ?? "arquivo";
  return (
    basename.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, 240) || "arquivo"
  );
};

export const validateClinicalAttachments = async (
  files: Array<Blob & { name?: string }>,
): Promise<ValidatedClinicalAttachment[]> => {
  if (files.length > CLINICAL_CHAT_MAX_ATTACHMENTS_PER_TURN) {
    throw new TRPCError({
      code: "PAYLOAD_TOO_LARGE",
      message: `Envie no maximo ${CLINICAL_CHAT_MAX_ATTACHMENTS_PER_TURN} arquivos por mensagem.`,
    });
  }

  return Promise.all(
    files.map(async (file) => {
      const originalName = safeOriginalName(file.name ?? "arquivo");
      const extension = originalName.includes(".")
        ? (originalName.split(".").pop()?.toLowerCase() ?? "")
        : "";
      const mimeType = normalizedMimeType(file.type);

      if (!mimeType || !allowedExtensions[mimeType].includes(extension)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Formato nao permitido em ${originalName}. Use PDF, JPEG, PNG ou WEBP.`,
        });
      }
      if (file.size <= 0 || file.size > CLINICAL_CHAT_MAX_FILE_BYTES) {
        throw new TRPCError({
          code: "PAYLOAD_TOO_LARGE",
          message: `${originalName} deve ter no maximo 20 MB.`,
        });
      }

      const header = new Uint8Array(await file.slice(0, 16).arrayBuffer());
      if (!matchesMagicBytes(mimeType, header)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `O conteudo de ${originalName} nao corresponde ao formato informado.`,
        });
      }

      return { file, originalName, mimeType, sizeBytes: file.size, extension };
    }),
  );
};

export const uploadClinicalAttachments = async (
  profileId: string,
  patientId: string,
  chatId: string,
  attachments: ValidatedClinicalAttachment[],
): Promise<StoredClinicalAttachment[]> => {
  await ensureBucket();
  const stored: StoredClinicalAttachment[] = [];
  try {
    for (const attachment of attachments) {
      const storagePath = `${profileId}/${patientId}/${chatId}/${randomUUID()}.${attachment.extension}`;
      const { error } = await SupabaseService.client.storage
        .from(CLINICAL_CHAT_BUCKET)
        .upload(storagePath, attachment.file, {
          contentType: attachment.mimeType,
          upsert: false,
        });
      if (error)
        throw new Error(
          `Falha ao enviar ${attachment.originalName}: ${error.message}`,
        );
      stored.push({
        storagePath,
        originalName: attachment.originalName,
        mimeType: attachment.mimeType,
        sizeBytes: attachment.sizeBytes,
      });
    }
    return stored;
  } catch (error) {
    await deleteClinicalAttachments(stored.map((item) => item.storagePath));
    throw error;
  }
};

export const deleteClinicalAttachments = async (storagePaths: string[]) => {
  if (storagePaths.length === 0) return;
  await ensureBucket();
  const { error } = await SupabaseService.client.storage
    .from(CLINICAL_CHAT_BUCKET)
    .remove(storagePaths);
  if (error) console.warn("[Clinical chat] attachment cleanup failed");
};

export const createSignedClinicalAttachmentUrl = async (
  storagePath: string,
) => {
  await ensureBucket();
  const { data, error } = await SupabaseService.client.storage
    .from(CLINICAL_CHAT_BUCKET)
    .createSignedUrl(storagePath, CLINICAL_CHAT_SIGNED_URL_TTL_SECONDS);
  if (error || !data?.signedUrl) {
    throw new Error("Nao foi possivel acessar um anexo do chat clinico.");
  }
  return data.signedUrl;
};
