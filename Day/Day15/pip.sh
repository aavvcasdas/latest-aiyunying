#!/usr/bin/env bash
# 画中画：把「上一集」Day14 的成片叠到右上角，从第一帧一直播到最后一帧。
# 用法：bash Day/Day15/pip.sh            （读 成片/Day15_原片.mp4，写 成片/Day15.mp4）
#      bash Day/Day15/pip.sh 成片/Day15_原片.mp4 成片/Day15.mp4
set -e
cd "$(dirname "$0")/../.."
FF=node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg
SRC=${1:-Day/Day15/成片/Day15_原片.mp4}
OUT=${2:-Day/Day15/成片/Day15.mp4}
DAY14=Day/Day14/成片/Day14_无声样片.mp4
# 420×236 的画中画 + 8px 木框，贴右上角（距边 28px）；声音还是本片的配音
"$FF" -v error -y -i "$SRC" -i "$DAY14" -filter_complex \
  "[1:v]scale=420:236:force_original_aspect_ratio=decrease,pad=436:252:8:8:color=0x2a1a12[pip];[0:v][pip]overlay=W-w-28:28:shortest=0" \
  -map 0:a -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -c:a copy -movflags +faststart "$OUT"
echo "PIP 完成：$OUT"
