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
#   public/videos/services-desktop.mp4  (~7MB da 908 frame WEBP desktop a 1280x720)
#   public/videos/services-mobile.mp4   (~6.5MB da 889 frame WEBP 720x1280)
#
# Profilo H.264 baseline + pixel format yuv420p + fastdecode per scrub fluido.
# Keyframe ogni 20 frame (GOP=20) per bilanciare seek precisione e dimensione file.
# Downscale 720p: il canvas fa cover del viewport, 720p è sufficiente per un background
# scrub scaled su display retina (nessuna differenza visibile con 1080p sul video scurito).
#
# Sorgente mobile (aggiornata 2026-04-24): la cartella MOBILE_SRC di default è
# l'archivio storico nel repo (223 frame, dimezzati). Per il re-encode più
# fluido usa le 889 frame originali esterne via env var MOBILE_SRC_OVERRIDE.
# Esempio:
#   MOBILE_SRC_OVERRIDE="/c/Users/Principale/Desktop/Progetti/wide-landing/assets/videos/scrolling/frames_9_16" \
#   bash scripts/convert-frames-to-video.sh
# Più frame sorgente = scroll delta per pixel più piccolo = decoder resta
# più spesso nello stesso GOP = scrub percepito più liscio.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DESKTOP_SRC="$REPO_ROOT/public/frames/section-2"
MOBILE_SRC="${MOBILE_SRC_OVERRIDE:-$REPO_ROOT/public/frames_9_16/section-2}"
OUT_DIR="$REPO_ROOT/public/videos"

mkdir -p "$OUT_DIR"

echo "→ Converting desktop frames (908 webp, 1920x1080 → 1280x720) to MP4..."
ffmpeg -y \
  -framerate 30 \
  -i "$DESKTOP_SRC/frame_%04d.webp" \
  -vf "scale=1280:720:flags=lanczos" \
  -c:v libx264 \
  -profile:v baseline \
  -level 3.0 \
  -preset slow \
  -crf 28 \
  -pix_fmt yuv420p \
  -g 20 \
  -keyint_min 20 \
  -sc_threshold 0 \
  -movflags +faststart \
  -tune fastdecode \
  -an \
  "$OUT_DIR/services-desktop.mp4"

echo "→ Converting mobile frames (~223 webp 9:16, downscale a 720x1280) to MP4..."
ffmpeg -y \
  -framerate 30 \
  -i "$MOBILE_SRC/frame_%04d.webp" \
  -vf "scale=720:1280:flags=lanczos" \
  -c:v libx264 \
  -profile:v baseline \
  -level 3.0 \
  -preset slow \
  -crf 30 \
  -pix_fmt yuv420p \
  -g 20 \
  -keyint_min 20 \
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
