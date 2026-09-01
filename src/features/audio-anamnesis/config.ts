/**
 * Configurações centralizadas do módulo de áudio-anamnese.
 * Modifique aqui para ajustar comportamento de VAD, batches, overlap e créditos.
 */

// --- Audio ---

/** Taxa de amostragem do microfone (Hz). O Whisper espera 16 kHz. */
export const AUDIO_SAMPLE_RATE = 16_000;

// --- VAD (Voice Activity Detection) ---

/**
 * Tempo de silencio (ms) sem deteccao de fala antes de encerrar o batch automaticamente.
 * Menor = mais responsivo, maior = menos cortes no meio de frases longas.
 */
export const SILENCE_TIMEOUT_MS = 7_000;

// --- Batches ---

/**
 * Duração máxima de um batch de áudio (segundos).
 * Ao atingir esse limite, o buffer é enviado mesmo sem silêncio detectado.
 * Limite pratico do Whisper: ~25 MB / ~30 min. 150 s e seguro e economico.
 */
export const MAX_BATCH_SECONDS = 15;

/** Número de amostras correspondente ao limite de batch. Derivado, não altere diretamente. */
export const MAX_BATCH_SAMPLES = MAX_BATCH_SECONDS * AUDIO_SAMPLE_RATE;

/**
 * Sobreposicao entre batches consecutivos (segundos).
 * Evita cortar palavras no limite de um batch.
 * Aumentar melhora continuidade, mas aumenta tokens enviados ao LLM.
 */
export const OVERLAP_SECONDS = 5;

/** Número de amostras de sobreposição. Derivado, não altere diretamente. */
export const OVERLAP_SAMPLES = AUDIO_SAMPLE_RATE * OVERLAP_SECONDS;

// --- Créditos ---

/** Saldo mínimo (créditos) para iniciar uma nova sessão. */
export const CREDITS_MIN_TO_START = 300;

/** Saldo mínimo (créditos) necessário para processar mais um batch. */
export const CREDITS_MIN_PER_BATCH = 100;
