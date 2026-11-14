#!/usr/bin/env python3
"""给两份 opus5.5 上传工程补齐缺失的素材（原 zip 里没带）。

两个 zip 都只给了源码：`song.mp3`、`atlas.png`（max 版）、`cast_atlas.png`（把回忆拼好版）与字体，一个都没有。
注意两版引用的目录不同：max 版全部在 `src/mv/assets/`，另一版在 `src/assets/`。这里从仓库自己的东西补：

  · 音轨       ← 仓库根的《把回忆拼好给你》.mp4 抽 aac 转 192k mp3（60.0 秒，和两支片子的 DURATION 一致）
  · max 版图集 ← 该工程 src/mv/data.ts 里的 ATLAS_RECTS（1024×1922，238 格）逐格贴回仓库图集的像素
  · 把回忆版   ← 该工程的 cast_atlas.json 与仓库 通用模板/engine/assets/cast_atlas.json 逐格一致，直接拷贝 PNG
  · 字体       ← 通用模板/engine/assets/fonts/ZCOOLKuaiLe-Regular.ttf（max 要 .ttf，另一支要 .woff，转一份）

用法：python3 tools/build_opus_assets.py            # 两个工程都补
      python3 tools/build_opus_assets.py --check    # 只检查缺不缺
"""
import argparse
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ATLAS_JSON = ROOT / '通用模板/engine/assets/cast_atlas.json'
ATLAS_PNG = ROOT / '通用模板/engine/assets/cast_atlas.png'
FONT_TTF = ROOT / '通用模板/engine/assets/fonts/ZCOOLKuaiLe-Regular.ttf'
SONG_SRC = ROOT / '《把回忆拼好给你》.mp4'
FFMPEG = ROOT / 'node_modules/@remotion/compositor-linux-x64-gnu/ffmpeg'

MAX_DIR = ROOT / '番外MV/把回忆拼好_opus5.5max'
MEM_DIR = ROOT / '番外MV/把回忆拼好_opus5.5'


def need(path: Path) -> bool:
    return not path.exists() or path.stat().st_size == 0


def make_song(out: Path, check: bool) -> None:
    if not need(out):
        print(f'  音轨已在：{out.relative_to(ROOT)}')
        return
    if check:
        print(f'  ✗ 缺音轨：{out.relative_to(ROOT)}')
        return
    out.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run([str(FFMPEG), '-y', '-v', 'error', '-i', str(SONG_SRC), '-vn',
                    '-c:a', 'libmp3lame', '-b:a', '192k', str(out)], check=True)
    print(f'  ✓ 抽出音轨 → {out.relative_to(ROOT)}')


def build_max_atlas(check: bool) -> None:
    src = MAX_DIR / '源码/src/mv/data.ts'
    out = MAX_DIR / '源码/src/mv/assets/atlas.png'
    if not need(out):
        print(f'  图集已在：{out.relative_to(ROOT)}')
        return
    if check:
        print(f'  ✗ 缺图集：{out.relative_to(ROOT)}')
        return
    from PIL import Image

    text = src.read_text(encoding='utf-8')
    m = re.search(r'ATLAS_RECTS: Record<string, \[number, number, number, number\]> = (\{.*?\});', text, re.S)
    if not m:
        raise SystemExit('在 data.ts 里找不到 ATLAS_RECTS')
    rects = json.loads(m.group(1))
    wm = re.search(r'ATLAS_W = (\d+); export const ATLAS_H = (\d+)', text)
    W, H = int(wm.group(1)), int(wm.group(2))

    repo = json.loads(ATLAS_JSON.read_text(encoding='utf-8'))['s']
    master = Image.open(ATLAS_PNG).convert('RGBA')
    canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    for name, (x, y, w, h) in rects.items():
        if name not in repo:
            raise SystemExit(f'仓库图集里没有 {name}')
        rx, ry, rw, rh = repo[name]
        if (rw, rh) != (w, h):
            raise SystemExit(f'{name} 尺寸对不上：仓库 {rw}×{rh}，工程 {w}×{h}')
        canvas.paste(master.crop((rx, ry, rx + rw, ry + rh)), (x, y))
    out.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(out)
    print(f'  ✓ 按 ATLAS_RECTS 重排图集 {W}×{H} {len(rects)} 格 → {out.relative_to(ROOT)}')


def copy_mem_atlas(check: bool) -> None:
    target_json = MEM_DIR / '源码/src/assets/cast_atlas.json'
    target_png = MEM_DIR / '源码/src/assets/cast_atlas.png'
    a = json.loads(ATLAS_JSON.read_text(encoding='utf-8'))['s']
    b = json.loads(target_json.read_text(encoding='utf-8'))['s']
    if a != b:
        raise SystemExit('工程自带的 cast_atlas.json 与仓库图集坐标不一致，不能直接拷贝 PNG')
    if not need(target_png):
        print(f'  图集已在：{target_png.relative_to(ROOT)}')
        return
    if check:
        print(f'  ✗ 缺图集：{target_png.relative_to(ROOT)}')
        return
    shutil.copyfile(ATLAS_PNG, target_png)
    print(f'  ✓ 拷贝仓库图集 → {target_png.relative_to(ROOT)}（坐标逐格一致）')


def copy_fonts(check: bool) -> None:
    ttf = MAX_DIR / '源码/src/mv/assets/zcool.ttf'
    woff = MEM_DIR / '源码/src/assets/kuaile.woff'
    for out, kind in ((ttf, 'ttf'), (woff, 'woff')):
        if not need(out):
            print(f'  字体已在：{out.relative_to(ROOT)}')
            continue
        if check:
            print(f'  ✗ 缺字体：{out.relative_to(ROOT)}')
            continue
        out.parent.mkdir(parents=True, exist_ok=True)
        if kind == 'ttf':
            shutil.copyfile(FONT_TTF, out)
        else:
            try:
                from fontTools.ttLib import TTFont
                f = TTFont(FONT_TTF)
                f.flavor = 'woff'
                f.save(out)
            except Exception as e:  # 转不了就原样塞 ttf：opentype.js / FontFace 都按内容嗅探
                print(f'  ! woff 转换失败（{e}），改为直接放 ttf 内容')
                shutil.copyfile(FONT_TTF, out)
        print(f'  ✓ 字体 → {out.relative_to(ROOT)}')


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('--check', action='store_true')
    args = ap.parse_args()

    print('把回忆拼好_opus5.5max：')
    make_song(MAX_DIR / '源码/src/mv/assets/song.mp3', args.check)
    build_max_atlas(args.check)
    copy_fonts(args.check)
    print('把回忆拼好_opus5.5：')
    make_song(MEM_DIR / '源码/src/assets/song.mp3', args.check)
    copy_mem_atlas(args.check)


if __name__ == '__main__':
    sys.exit(main())
