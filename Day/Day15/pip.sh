#!/usr/bin/env bash
# 画中画：把「上一集」Day14（用现模板重渲的那一版）装进一台旧电视机，说到「重新装修」的时候推进画面里，
# 之后一直在右上角放着。
#
#   用法：bash Day/Day15/pip.sh                 # 读 成片/Day15_原片.mp4，写 成片/Day15.mp4
#          bash Day/Day15/pip.sh 原片 成片
#
# 电视框是 Day/Day15/make_tv_frame.py 画的（540×396，中间 378×212 是全透明的洞）；
# 推进来的时间 11.2 秒 = 第 4 句「小克把家重新装修了一遍」开口那一刻（见 cues.json）。
set -e
cd "$(dirname "$0")/../.."
FF=${FFMPEG:-/tmp/ffvenv/lib/python3.11/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v9.0.2}
SRC=${1:-Day/Day15/成片/Day15_原片.mp4}
OUT=${2:-Day/Day15/成片/Day15.mp4}
DAY14=${DAY14:-Day/Day14/成片/Day14_无声样片.mp4}
SPEED=${SPEED:-1.8}   # 电视里的倍速
TV=Day/Day15/素材/pip_tv.png

# 电视框 540×396，贴在右边距 16、上边距 16：框左上角 x = 1920-540-16 = 1364、y = 16
# 洞在框内 (72, 72)：画面贴在 x = 1364+72 = 1436、y = 88，尺寸 378×212
# E = 缓出（1-(1-p)^3），p = clip((t-11.2)/0.7, 0, 1)：11.2 秒之前整台电视在画面右边外面
E="(1-pow(1-clip((t-11.2)/0.7,0,1),3))"
# 输出必须显式限长：画中画那一路（Day14）比本片长，不写 -t 会一直渲到上一集放完
DUR=$("$FF" -hide_banner -i "$SRC" 2>&1 | sed -n 's/.*Duration: \([0-9:.]*\),.*/\1/p')

"$FF" -v error -y \
  -i "$SRC" -stream_loop -1 -i "$DAY14" -loop 1 -i "$TV" -filter_complex "
    [1:v]setpts=PTS/${SPEED},fps=30,scale=378:212,setsar=1[scr];
    [0:v][scr]overlay=x='W+40-(W+40-1436)*${E}':y=88:eof_action=pass[v0];
    [2:v]format=rgba[frame];
    [v0][frame]overlay=x='W+40-(W+40-1364)*${E}':y=16:eof_action=repeat[v1]
  " -map "[v1]" -map 0:a -t "$DUR" -c:v libx264 -preset veryfast -crf 20 -pix_fmt yuv420p -c:a copy -movflags +faststart "$OUT"
echo "PIP_OK $OUT（电视 11.2 秒推进来，${SPEED}× 循环放上一集：$DAY14）"
