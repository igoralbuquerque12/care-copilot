import {
  AUDIO_SAMPLE_RATE,
  OVERLAP_SECONDS,
  OVERLAP_SAMPLES,
} from "../config";

export { AUDIO_SAMPLE_RATE, OVERLAP_SECONDS, OVERLAP_SAMPLES };

export const concatFloat32 = (chunks: Float32Array[]): Float32Array => {
  const total = chunks.reduce((acc, c) => acc + c.length, 0);
  const out = new Float32Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
};

export const floatTo16BitPCM = (input: Float32Array): Int16Array => {
  const out = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i] ?? 0));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
};

const writeString = (view: DataView, offset: number, str: string) => {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
};

export const encodeWav = (
  samples: Float32Array,
  sampleRate: number = AUDIO_SAMPLE_RATE,
): Blob => {
  const pcm = floatTo16BitPCM(samples);
  const buffer = new ArrayBuffer(44 + pcm.length * 2);
  const view = new DataView(buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + pcm.length * 2, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(view, 36, "data");
  view.setUint32(40, pcm.length * 2, true);

  let offset = 44;
  for (let i = 0; i < pcm.length; i++) {
    view.setInt16(offset, pcm[i] ?? 0, true);
    offset += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
};

export const extractTail = (samples: Float32Array): Float32Array =>
  samples.length <= OVERLAP_SAMPLES
    ? new Float32Array(samples)
    : samples.slice(-OVERLAP_SAMPLES);

export const computeDurationSeconds = (samples: Float32Array): number =>
  samples.length / AUDIO_SAMPLE_RATE;
