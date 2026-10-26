#!/usr/bin/env bash
# Dựng video động thương hiệu D24 (Remotion) từ JSON bảng tin, có nhạc nền, chuẩn âm lượng -14 LUFS.
# Cách dùng: render/video.sh examples/bangtin-mau.json out/video.mp4 [--voice]
#   --voice: thêm giọng đọc Vbee (cần khóa Vbee trong môi trường, xem render/voice.py)
set -euo pipefail
json="$(realpath "$1")"; out="$(realpath -m "$2")"; voice="${3:-}"
root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$root/video"
[ -d node_modules ] || npm ci --no-audit --no-fund >/dev/null
[ -f public/music.wav ] || python3 "$root/render/music.py" public/ >/dev/null
tmp="$(mktemp -d)"
if [ "$voice" = "--voice" ]; then
  python3 "$root/render/voice.py" "$json" --out "$tmp/props.json" >/dev/null
  json="$tmp/props.json"
fi
npx remotion render BangTin "$tmp/raw.mp4" --props="$json" --codec=h264 --crf=20 --log=error
ffmpeg -y -loglevel error -i "$tmp/raw.mp4" -c:v copy -af loudnorm=I=-14:TP=-1.5:LRA=11 -c:a aac -b:a 192k -movflags +faststart "$out"
rm -rf "$tmp"
echo "$out"
