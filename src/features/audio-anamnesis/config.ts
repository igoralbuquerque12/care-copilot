/**
 * Configuracoes centralizadas do modulo de audio-anamnese.
 * Modifique aqui para ajustar comportamento de VAD, batches, overlap e creditos.
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
 * Duracao maxima de um batch de audio (segundos).
 * Ao atingir esse limite, o buffer e enviado mesmo sem silencio detectado.
 * Limite pratico do Whisper: ~25 MB / ~30 min. 150 s e seguro e economico.
 */
export const MAX_BATCH_SECONDS = 15;

/** Numero de amostras correspondente ao limite de batch. Derivado, nao altere diretamente. */
export const MAX_BATCH_SAMPLES = MAX_BATCH_SECONDS * AUDIO_SAMPLE_RATE;

/**
 * Sobreposicao entre batches consecutivos (segundos).
 * Evita cortar palavras no limite de um batch.
 * Aumentar melhora continuidade, mas aumenta tokens enviados ao LLM.
 */
export const OVERLAP_SECONDS = 5;

/** Numero de amostras de sobreposicao. Derivado, nao altere diretamente. */
export const OVERLAP_SAMPLES = AUDIO_SAMPLE_RATE * OVERLAP_SECONDS;

// --- Creditos ---

/** Saldo minimo (creditos) para iniciar uma nova sessao. */
export const CREDITS_MIN_TO_START = 300;

/** Saldo minimo (creditos) necessario para processar mais um batch. */
export const CREDITS_MIN_PER_BATCH = 100;
