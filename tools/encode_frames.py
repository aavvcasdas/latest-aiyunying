#!/usr/bin/env python3
"""把 tools/shoot_frames.mjs 截下来的 JPEG 序列 + 一条音轨编成 mp4（h264 两遍码率控制 + aac）。

为什么是「两遍 + 按体积算码率」而不是以前的 crf：这一批片子有 4 分半到 5 分半长，
GitHub 单文件硬上限是 100 MiB，crf 21 会直接超（《情歌》的胶片颗粒在 1080p 下 crf 21 是 18 Mbps）。
所以反过来：先定体积（默认 92 MiB），扣掉音轨，剩下的全给画面，两遍编码把码率花在刀刃上。

用法：
  python3 tools/encode_frames.py --frames /tmp/frames_love --audio "情歌 .mp3" --audio-copy \
      --out 番外MV/情歌_opus5.5max/成片/情歌_opus5.5max_1080p30.mp4
  python3 tools/encode_frames.py --frames /tmp/frames_miss --audio 我好像你.MP3 \
      --out 番外MV/我好想你/成片/我好想你_1080p30.mp4

规矩（都是上一轮踩过的）：
  · 先写 /tmp/enc_<名字>.mp4，数过帧数、对过时长才挪进成片目录；同一个输出路径不会有两个 ffmpeg；
  · 帧序列必须从 f00000.jpg 起连续，缺一张就停（缺帧硬编出来的片子音画会错位）。
"""
import argparse
import hashlib
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FFDIR = ROOT / 'node_modules/@remotion/compositor-linux-x64-gnu'
FF = str(FFDIR / 'ffmpeg')
FP = str(FFDIR / 'ffprobe')
ENV = dict(os.environ, LD_LIBRARY_PATH=f"{FFDIR}:{os.environ.get('LD_LIBRARY_PATH', '')}")


def run(cmd, **kw):
    return subprocess.run(cmd, env=ENV, check=True, **kw)


def probe(path, entries, stream=None, count=False):
    cmd = [FP, '-v', 'error', '-of', 'json', '-show_entries', entries]
    if stream:
        cmd += ['-select_streams', stream]
    if count:
        cmd += ['-count_frames']
    return json.loads(run(cmd + [str(path)], capture_output=True, text=True).stdout)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('--frames', required=True)
    ap.add_argument('--audio', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--fps', type=int, default=30)
    ap.add_argument('--target-mib', type=float, default=92.0, help='成片体积目标（MiB），GitHub 单文件上限是 100')
    ap.add_argument('--max-kbps', type=float, default=9000.0, help='画面码率封顶：短片不必为了凑体积把码率拉到没意义')
    ap.add_argument('--audio-copy', action='store_true', help='音轨本来就是 aac 时原样封装，不重编码')
    ap.add_argument('--audio-kbps', type=int, default=192)
    ap.add_argument('--preset', default='medium')
    a = ap.parse_args()

    frames = Path(a.frames)
    n = len(list(frames.glob('f*.jpg')))
    missing = [i for i in range(n) if not (frames / f'f{i:05d}.jpg').exists()]
    if n == 0 or missing:
        sys.exit(f'帧序列不连续：共 {n} 张，缺 {missing[:10]}…')
    dur = n / a.fps

    audio = Path(a.audio)
    if a.audio_copy:
        ainfo = probe(audio, 'stream=codec_name,bit_rate', 'a:0')['streams'][0]
        if ainfo['codec_name'] != 'aac':
            sys.exit(f'--audio-copy 只对 aac 音轨有效，这条是 {ainfo["codec_name"]}')
        akbps = float(ainfo.get('bit_rate') or 0) / 1000 or a.audio_kbps
        acodec = ['-c:a', 'copy']
    else:
        akbps = a.audio_kbps
        acodec = ['-c:a', 'aac', '-b:a', f'{a.audio_kbps}k', '-ar', '44100']

    total_kbps = a.target_mib * 1024 * 1024 * 8 / 1000 / dur
    vkbps = min(a.max_kbps, total_kbps - akbps - 12)     # 12 kbps 留给 mp4 封装
    if vkbps < 500:
        sys.exit(f'这个体积目标下画面只剩 {vkbps:.0f} kbps，太低了')
    print(f'{n} 帧 / {dur:.3f} 秒 · 画面 {vkbps:.0f} kbps + 音轨 {akbps:.0f} kbps（{"原样封装" if a.audio_copy else "aac"}）', flush=True)

    out = Path(a.out)
    tmp = Path('/tmp') / f'enc_{out.stem}.mp4'
    log = Path('/tmp') / f'x264_{out.stem}'
    vin = ['-framerate', str(a.fps), '-i', str(frames / 'f%05d.jpg')]
    vcodec = ['-c:v', 'libx264', '-preset', a.preset, '-b:v', f'{vkbps:.0f}k', '-pix_fmt', 'yuv420p',
              '-profile:v', 'high', '-level', '4.1', '-vf', 'scale=out_color_matrix=bt709:out_range=tv',
              '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv',
              '-passlogfile', str(log)]
    base = [FF, '-hide_banner', '-v', 'error', '-stats', '-y']
    run(base + vin + vcodec + ['-pass', '1', '-an', '-f', 'null', '/dev/null'])
    run(base + vin + ['-i', str(audio)] + ['-map', '0:v:0', '-map', '1:a:0'] + vcodec + ['-pass', '2'] + acodec
        + ['-t', f'{dur:.6f}', '-movflags', '+faststart', str(tmp)])

    v = probe(tmp, 'stream=nb_read_frames,width,height,r_frame_rate', 'v:0', count=True)['streams'][0]
    f = probe(tmp, 'format=duration,bit_rate,size')['format']
    got = int(v['nb_read_frames'])
    size = int(f['size'])
    print(f'解码数帧：{got}（应为 {n}）· {v["width"]}×{v["height"]} @{v["r_frame_rate"]} · {float(f["duration"]):.3f} 秒 · {size} B = {size / 1048576:.1f} MiB', flush=True)
    if got != n:
        sys.exit('帧数对不上，成片没有挪进作品目录')
    if size >= 100 * 1024 * 1024:
        sys.exit('超过 100 MiB，GitHub 推不上去：调小 --target-mib 重编')
    out.parent.mkdir(parents=True, exist_ok=True)
    shutil.move(str(tmp), str(out))
    h = hashlib.sha256(out.read_bytes()).hexdigest()
    print(f'ENCODE_OK {out.relative_to(ROOT) if out.is_relative_to(ROOT) else out}  sha256 {h}', flush=True)


if __name__ == '__main__':
    main()
