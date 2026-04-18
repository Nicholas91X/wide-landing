#!/usr/bin/env bash
# ┌─────────────────────────────────────────────────────────────────┐
# │ Conversione frame WEBP → video MP4 scrub-friendly per ScrollVideo │
# └─────────────────────────────────────────────────────────────────┘
#
# Usage:  bash scripts/convert-frames-to-video.sh
#
# Requires:  ffmpeg installato (brew install ffmpeg / scoop install ffmpeg)
#
# Genera:
#   public/videos/services-desktop.mp4  (~2-4MB da 908 frame WEBP desktop)
#   public/videos/services-mobile.mp4   (~1-2MB da ~223 frame WEBP 9:16)
#
# Profilo H.264 baseline + pixel format yuv420p + fastdecode per scrub fluido.
# Keyframe ogni 10 frame (GOP=10) per seek preciso su currentTime=.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DESKTOP_SRC="$REPO_ROOT/public/frames/section-2"
MOBILE_SRC="$REPO_ROOT/public/frames_9_16/section-2"
OUT_DIR="$REPO_ROOT/public/videos"

mkdir -p "$OUT_DIR"

echo "→ Converting desktop frames (908 webp) to MP4..."
ffmpeg -y \
  -framerate 30 \
  -i "$DESKTOP_SRC/frame_%04d.webp" \
  -c:v libx264 \
  -profile:v baseline \
  -level 3.0 \
  -preset slow \
  -crf 23 \
  -pix_fmt yuv420p \
  -g 10 \
  -keyint_min 10 \
  -sc_threshold 0 \
  -movflags +faststart \
  -tune fastdecode \
  -an \
  "$OUT_DIR/services-desktop.mp4"

echo "→ Converting mobile frames (~223 webp 9:16) to MP4..."
ffmpeg -y \
  -framerate 30 \
  -i "$MOBILE_SRC/frame_%04d.webp" \
  -c:v libx264 \
  -profile:v baseline \
  -level 3.0 \
  -preset slow \
  -crf 25 \
  -pix_fmt yuv420p \
  -g 10 \
  -keyint_min 10 \
  -sc_threshold 0 \
  -movflags +faststart \
  -tune fastdecode \
  -an \
  "$OUT_DIR/services-mobile.mp4"

echo ""
echo "✅ Output size:"
ls -lh "$OUT_DIR"/*.mp4
echo ""
echo "→ Ricorda: aggiorna src/components/ScrollVideo.tsx con i path video."
