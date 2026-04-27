import { SupabaseService } from "~/server/supabase/supabase-admin";

export const AUDIO_BUCKET = "audio-batches";
const SIGNED_URL_TTL_SECONDS = 30 * 60;

const buildPath = (
  profileId: string,
  sessionId: string,
  batchIndex: number,
) => `${profileId}/${sessionId}/${batchIndex}.wav`;

export const uploadAudioBatch = async (
  profileId: string,
  sessionId: string,
  batchIndex: number,
  file: Blob,
): Promise<string> => {
  const path = buildPath(profileId, sessionId, batchIndex);
  const { error } = await SupabaseService.client.storage
    .from(AUDIO_BUCKET)
    .upload(path, file, {
      contentType: "audio/wav",
      upsert: true,
    });

  if (error) {
    throw new Error(`Falha ao subir audio para storage: ${error.message}`);
  }

  return path;
};

export const createSignedAudioUrl = async (
  storagePath: string,
): Promise<string> => {
  const { data, error } = await SupabaseService.client.storage
    .from(AUDIO_BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);

  if (error || !data?.signedUrl) {
    throw new Error(
      `Falha ao gerar signed URL: ${error?.message ?? "unknown"}`,
    );
  }

  return data.signedUrl;
};

export const deleteAudioBatch = async (storagePath: string): Promise<void> => {
  const { error } = await SupabaseService.client.storage
    .from(AUDIO_BUCKET)
    .remove([storagePath]);

  if (error) {
    console.warn(
      `[audioBatchStorage] falha ao deletar ${storagePath}: ${error.message}`,
    );
  }
};

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
