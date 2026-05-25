/** Supabase Storage bucket for audio batch files. */
export const AUDIO_BUCKET = "audio-batches";

/** How long a signed download URL remains valid, in seconds (30 min). */
export const SIGNED_URL_TTL_SECONDS = 30 * 60;

/** Number of automatic retries for queued audio processing jobs. */
export const AUDIO_QUEUE_RETRIES = 3;
