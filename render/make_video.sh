#!/usr/bin/env bash
# Ghép các khung v0.png ... v4.png (intro, 3 tin, outro) thành video dọc 1080x1920.
# Cách dùng: render/make_video.sh out/ out/post2_video.mp4
set -euo pipefail
dir="$1"; out="$2"
ffmpeg -y -loglevel error \
  -loop 1 -t 3.5 -i "$dir/v0.png" -loop 1 -t 5.5 -i "$dir/v1.png" -loop 1 -t 5.5 -i "$dir/v2.png" \
  -loop 1 -t 5.5 -i "$dir/v3.png" -loop 1 -t 4.5 -i "$dir/v4.png" -f lavfi -t 21 -i anullsrc=r=44100:cl=stereo \
  -filter_complex "[0][1]xfade=transition=slideleft:duration=0.5:offset=3[a];[a][2]xfade=transition=slideleft:duration=0.5:offset=8[b];[b][3]xfade=transition=slideleft:duration=0.5:offset=13[c];[c][4]xfade=transition=fade:duration=0.5:offset=18,format=yuv420p,fps=30[v]" \
  -map "[v]" -map 5:a -c:v libx264 -preset medium -crf 20 -c:a aac -shortest -movflags +faststart "$out"
