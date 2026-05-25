import { SupabaseService } from "~/server/supabase/supabase-admin";
import { AUDIO_BUCKET, SIGNED_URL_TTL_SECONDS } from "../audio.config";

const buildPath = (profileId: string, sessionId: string, batchIndex: number) =>
  `${profileId}/${sessionId}/${batchIndex}.wav`;

/**
 * Uploads a WAV audio batch to Supabase Storage.
 *
 * @param profileId - Owner's profile ID (used to namespace the storage path)
 * @param sessionId - Audio consultation session ID
 * @param batchIndex - Zero-based index of this batch within the session
 * @param file - WAV blob to upload
 * @returns The storage path (`profileId/sessionId/batchIndex.wav`)
 */
export const uploadAudioBatch = async (
  profileId: string,
  sessionId: string,
  batchIndex: number,
  file: Blob,
): Promise<string> => {
  const path = buildPath(profileId, sessionId, batchIndex);
  const { error } = await SupabaseService.client.storage
    .from(AUDIO_BUCKET)
    .upload(path, file, { contentType: "audio/wav", upsert: true });

  if (error) {
    throw new Error(`Falha ao subir audio para storage: ${error.message}`);
  }

  return path;
};

/**
 * Generates a short-lived signed download URL for a stored audio batch.
 *
 * @param storagePath - The storage path returned by `uploadAudioBatch`
 * @returns A signed URL valid for `SIGNED_URL_TTL_SECONDS`
 */
export const createSignedAudioUrl = async (storagePath: string): Promise<string> => {
  const { data, error } = await SupabaseService.client.storage
    .from(AUDIO_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    throw new Error(`Falha ao gerar signed URL: ${error?.message ?? "unknown"}`);
  }

  return data.signedUrl;
};

/**
 * Deletes an audio batch from Supabase Storage.
 * Failures are logged but not thrown — a stale file does not affect correctness.
 *
 * @param storagePath - The storage path returned by `uploadAudioBatch`
 */
export const deleteAudioBatch = async (storagePath: string): Promise<void> => {
  const { error } = await SupabaseService.client.storage
    .from(AUDIO_BUCKET)
    .remove([storagePath]);

  if (error) {
    console.warn(`[batchStorage] falha ao deletar ${storagePath}: ${error.message}`);
  }
};

/**
 * Downloads audio from a signed URL and returns it as a Node.js Buffer.
 *
 * @param signedUrl - A short-lived signed URL (from `createSignedAudioUrl`)
 * @returns Object with `buffer` (Node Buffer) and `mimeType` (from Content-Type header)
 */
export const downloadAudioFromSignedUrl = async (
  signedUrl: string,
): Promise<{ buffer: Buffer; mimeType: string }> => {
  const res = await fetch(signedUrl);
  if (!res.ok) {
    throw new Error(`Falha ao baixar audio: HTTP ${res.status}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    mimeType: res.headers.get("content-type") ?? "audio/wav",
  };
};
