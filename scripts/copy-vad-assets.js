import { copyFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const root = process.cwd();
const pub = join(root, "public");

if (!existsSync(pub)) mkdirSync(pub);

const assets = [
  // ONNX Runtime WASM + threading glue
  "node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm",
  "node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.wasm",
  "node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.mjs",
  "node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.mjs",
  // VAD worklet + models
  "node_modules/@ricky0123/vad-web/dist/vad.worklet.bundle.min.js",
  "node_modules/@ricky0123/vad-web/dist/silero_vad_v5.onnx",
  "node_modules/@ricky0123/vad-web/dist/silero_vad_legacy.onnx",
];

for (const rel of assets) {
  const src = join(root, rel);
  const filename = rel.split("/").at(-1);
  const dest = join(pub, filename);
  try {
    copyFileSync(src, dest);
    console.log(`[copy-vad-assets] ✓ ${filename}`);
  } catch (e) {
    console.warn(`[copy-vad-assets] ✗ ${filename}: ${e.message}`);
  }
}
