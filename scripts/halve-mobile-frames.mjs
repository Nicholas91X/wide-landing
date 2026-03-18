/**
 * Halve mobile frames: keeps every other frame from frames_9_16/section-2
 * and renames them sequentially (frame_0001.webp, frame_0002.webp, …).
 *
 * Usage:  node scripts/halve-mobile-frames.mjs
 *
 * The script:
 *   1. Reads all frame_XXXX.webp files from public/frames_9_16/section-2/
 *   2. Copies every 2nd frame to a temp directory with sequential names
 *   3. Replaces the original directory contents with the halved set
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRAMES_DIR = path.resolve(
  __dirname,
  "../public/frames_9_16/section-2"
);
const TEMP_DIR = path.resolve(__dirname, "../public/frames_9_16/_temp_halved");

// ── Read and sort existing frames ─────────────────────────────────────────────
const files = fs
  .readdirSync(FRAMES_DIR)
  .filter((f) => /^frame_\d{4}\.webp$/i.test(f))
  .sort();

console.log(`Found ${files.length} frames in ${FRAMES_DIR}`);

// ── Create temp dir ───────────────────────────────────────────────────────────
if (fs.existsSync(TEMP_DIR)) {
  fs.rmSync(TEMP_DIR, { recursive: true });
}
fs.mkdirSync(TEMP_DIR, { recursive: true });

// ── Copy every 2nd frame with sequential naming ───────────────────────────────
let newIndex = 1;
for (let i = 0; i < files.length; i += 2) {
  const src = path.join(FRAMES_DIR, files[i]);
  const newName = `frame_${String(newIndex).padStart(4, "0")}.webp`;
  const dest = path.join(TEMP_DIR, newName);
  fs.copyFileSync(src, dest);
  newIndex++;
}

const totalNew = newIndex - 1;
console.log(`Copied ${totalNew} frames to temp directory`);

// ── Replace originals ─────────────────────────────────────────────────────────
// Remove all original frames
for (const f of files) {
  fs.unlinkSync(path.join(FRAMES_DIR, f));
}

// Move halved frames back
const halvedFiles = fs.readdirSync(TEMP_DIR);
for (const f of halvedFiles) {
  fs.renameSync(path.join(TEMP_DIR, f), path.join(FRAMES_DIR, f));
}

// Clean up temp
fs.rmSync(TEMP_DIR, { recursive: true });

console.log(
  `✅ Done! Replaced ${files.length} frames with ${totalNew} halved frames.`
);
console.log(`   Update MOBILE_FRAME_COUNT to ${totalNew} in ScrollVideo.tsx`);
