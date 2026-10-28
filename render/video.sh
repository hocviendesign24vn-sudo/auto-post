#!/usr/bin/env bash
# Dựng video động thương hiệu D24 (Remotion, mẫu BangTinPro; COMP=BangTinNgan cho bản ngắn khoảng 35 giây; COMP=BangTin để dùng mẫu cũ) từ JSON bảng tin, có nhạc nền, chuẩn âm lượng -14 LUFS.
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
  style=pro; [ "${COMP:-BangTinPro}" = "BangTin" ] && style=basic; [ "${COMP:-}" = "BangTinNgan" ] && style=ngan
  python3 "$root/render/voice.py" "$json" --style "$style" --out "$tmp/props.json" >/dev/null
  json="$tmp/props.json"
fi
npx remotion render "${COMP:-BangTinPro}" "$tmp/raw.mp4" --props="$json" --codec=h264 --crf=20 --log=error
ffmpeg -y -loglevel error -i "$tmp/raw.mp4" -c:v copy -af loudnorm=I=-14:TP=-1.5:LRA=11 -c:a aac -b:a 192k -movflags +faststart "$out"
rm -rf "$tmp"
echo "$out"
