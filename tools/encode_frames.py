#!/usr/bin/env python3
"""把逐帧 JPEG 序列编码成 mp4，并把音轨混进去。

给 tools/shoot_vite_mv.mjs 出的帧用（那套脚本只负责截图，编码和混音在这里）。

用法：
  python3 tools/encode_frames.py --frames /tmp/frames_qg --audio 番外MV/情歌_opus5.5max/素材/情歌.mp3 \
      --out 番外MV/情歌_opus5.5max/成片/情歌_opus5.5max.mp4 --crf 21 --maxrate 3500k

--fps 默认 30；--width/--height 用来在编码时缩放（负数保持原样，默认不缩放）。
"""
import argparse
import os
import subprocess
import sys

import imageio_ffmpeg


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--frames', required=True, help='f%05d.jpg 序列所在目录')
    ap.add_argument('--audio', default='', help='音轨文件；不给就是无声片')
    ap.add_argument('--out', required=True, help='输出 mp4')
    ap.add_argument('--fps', type=float, default=30)
    ap.add_argument('--crf', type=int, default=21)
    ap.add_argument('--maxrate', default='3500k', help='视频码率上限（控制文件体积）')
    ap.add_argument('--width', type=int, default=-2)
    ap.add_argument('--height', type=int, default=-2)
    ap.add_argument('--preset', default='medium')
    ap.add_argument('--grain', type=int, default=0, help='补胶片颗粒（alls 强度，0=不加）；给摘掉 CSS grain 的片子用')
    a = ap.parse_args()

    frames = sorted(f for f in os.listdir(a.frames) if f.startswith('f') and f.endswith('.jpg'))
    if not frames:
        print(f'没有帧：{a.frames}', file=sys.stderr)
        return 2
    print(f'[frames] {len(frames)} 张，{a.fps} fps → {len(frames) / a.fps:.2f} 秒')

    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    cmd = [ffmpeg, '-y', '-hide_banner', '-loglevel', 'error',
           '-framerate', str(a.fps), '-start_number', '0', '-i', os.path.join(a.frames, 'f%05d.jpg')]
    if a.audio:
        cmd += ['-i', a.audio]
    # 逐帧 JPEG 是 full range（yuvj420p），这里显式压到 limited range 的 bt709，
    # 否则播放器按 tv range 解释会显得发灰/发脏（左边不加 in_range=full 就会偏）
    vf = f'scale={a.width}:{a.height}:flags=lanczos:in_range=full:out_range=tv'
    if a.grain:
        vf += f',noise=alls={a.grain}:allf=t'
    vf += ',format=yuv420p'
    cmd += ['-vf', vf,
            '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
            '-c:v', 'libx264', '-preset', a.preset, '-crf', str(a.crf),
            '-maxrate', a.maxrate, '-bufsize', '2M',
            '-movflags', '+faststart']
    if a.audio:
        cmd += ['-c:a', 'aac', '-b:a', '192k', '-shortest']
    cmd += [a.out]
    subprocess.run(cmd, check=True)
    size = os.path.getsize(a.out)
    print(f'ENCODE_OK {a.out} {size / 1024 / 1024:.1f} MB')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
