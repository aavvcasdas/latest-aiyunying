#!/usr/bin/env python3
"""Encode a deterministic PNG (or legacy JPEG) frame sequence to MP4 and mix audio.

Defaults come from tools/render_defaults.json: lossless PNG frames, CRF 16 and a
12000k cap. The script still accepts legacy `f%05d.jpg` sequences.

Usage:
  python3 tools/encode_frames.py --frames /tmp/frames --audio 番外MV/情歌_opus5.5max/素材/情歌.mp3 \
      --out 番外MV/情歌_opus5.5max/成片/情歌_opus5.5max.mp4

--fps defaults to 30; --width/--height scale at encode time (negative preserves size).
"""
from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path

import imageio_ffmpeg

ROOT = Path(__file__).resolve().parents[1]
DEFAULTS = json.loads((ROOT / "tools/render_defaults.json").read_text(encoding="utf-8"))


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--frames', required=True, help='f%%05d.png 或 f%%05d.jpg 序列所在目录')
    ap.add_argument('--audio', default='', help='音轨文件；不给就是无声片')
    ap.add_argument('--out', required=True, help='输出 mp4')
    ap.add_argument('--fps', type=float, default=30)
    ap.add_argument('--crf', type=int, default=DEFAULTS['crf'])
    ap.add_argument('--maxrate', default=DEFAULTS['maxrate'], help='视频码率上限（控制文件体积）')
    ap.add_argument('--width', type=int, default=-2)
    ap.add_argument('--height', type=int, default=-2)
    ap.add_argument('--preset', default='medium')
    ap.add_argument('--grain', type=int, default=0, help='补胶片颗粒（alls 强度，0=不加）；给摘掉 CSS grain 的片子用')
    ap.add_argument('--multiply', type=float, default=1.0, help='整体压暗系数（1=不压）。摘掉 multiply 混合的颗粒层后用它把亮度还原回去')
    ap.add_argument('--afade-out', default='', help='音轨淡出（秒，格式「起点:时长」）。页面里靠 audio.volume 做的淡出，导出静帧再编码时不会生效，用这里补')
    a = ap.parse_args()

    frame_dir = Path(a.frames)
    frames = sorted(f for f in os.listdir(frame_dir) if f.startswith('f') and f.lower().endswith(('.png', '.jpg', '.jpeg')))
    if not frames:
        print(f'没有帧：{frame_dir}', file=sys.stderr)
        return 2
    exts = {Path(f).suffix.lower() for f in frames}
    if len(exts) != 1:
        print(f'帧目录里混用了多种格式：{sorted(exts)}', file=sys.stderr)
        return 2
    ext = next(iter(exts))
    # ffmpeg's image2 demuxer uses the literal extension in the pattern.
    pattern = os.path.join(str(frame_dir), f'f%05d{ext}')
    print(f'[frames] {len(frames)} 张 {ext}，{a.fps} fps → {len(frames) / a.fps:.2f} 秒')

    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    cmd = [ffmpeg, '-y', '-hide_banner', '-loglevel', 'error',
           '-framerate', str(a.fps), '-start_number', '0', '-i', pattern]
    if a.audio:
        cmd += ['-i', a.audio]
    # Both PNG and JPEG inputs are full-range RGB; convert to limited-range BT.709
    # so players do not render the frames washed out or dirty.
    vf = f'scale={a.width}:{a.height}:flags=lanczos:in_range=full:out_range=tv'
    if a.multiply and a.multiply != 1.0:
        vf += f',colorlevels=rimax={a.multiply}:gimax={a.multiply}:bimax={a.multiply}'
    if a.grain:
        vf += f',noise=alls={a.grain}:allf=t'
    vf += ',format=yuv420p'
    cmd += ['-vf', vf,
            '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
            '-c:v', 'libx264', '-preset', a.preset, '-crf', str(a.crf),
            '-maxrate', a.maxrate, '-bufsize', '2M',
            '-movflags', '+faststart']
    if a.audio:
        if a.afade_out:
            st, du = a.afade_out.split(':')
            cmd += ['-af', f'afade=t=out:st={st}:d={du}']
        cmd += ['-c:a', 'aac', '-b:a', '192k', '-shortest']
    cmd += [a.out]
    subprocess.run(cmd, check=True)
    size = os.path.getsize(a.out)
    print(f'ENCODE_OK {a.out} {size / 1024 / 1024:.1f} MB')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
