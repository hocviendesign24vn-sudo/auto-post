#!/usr/bin/env bash
# Ghép các khung v0.png, v1.png, ... vN.png (intro, các trang tin, outro) thành video dọc 1080x1920.
# Số khung tùy ý (tối thiểu 2). Cách dùng: render/make_video.sh out/ out/post2_video.mp4
set -euo pipefail
dir="$1"; out="$2"
n=$(ls "$dir"/v[0-9]*.png | wc -l)
[ "$n" -ge 2 ] || { echo "Cần ít nhất v0.png và v1.png trong $dir" >&2; exit 1; }
FIRST=3.5; MID=6; LAST=4.5; T=0.5
inputs=(); filter=""; prev="0"; offset=0; total=0
for ((i = 0; i < n; i++)); do
  if ((i == 0)); then d=$FIRST; elif ((i == n - 1)); then d=$LAST; else d=$MID; fi
  inputs+=(-loop 1 -t "$d" -i "$dir/v$i.png")
  if ((i > 0)); then
    offset=$(echo "$total - $T" | bc)
    tr=$([ $i -eq $((n - 1)) ] && echo fade || echo slideleft)
    filter+="[$prev][$i]xfade=transition=$tr:duration=$T:offset=$offset[x$i];"
    prev="x$i"
    total=$(echo "$total + $d - $T" | bc)
  else
    total=$d
  fi
done
filter+="[$prev]format=yuv420p,fps=30[v]"
ffmpeg -y -loglevel error "${inputs[@]}" -f lavfi -t "$total" -i anullsrc=r=44100:cl=stereo \
  -filter_complex "$filter" -map "[v]" -map "$n:a" -c:v libx264 -preset medium -crf 20 -c:a aac -shortest -movflags +faststart "$out"
echo "$out ($n khung, ${total}s)"
