#!/usr/bin/env python3
"""给两份 opus5.5 上传工程补齐缺失素材（历史辅助脚本）。

当前仓库只保留 `把回忆拼好_opus5.5max`；`把回忆拼好_opus5.5` 已删。默认只检查，
不再硬编码 Linux x64 的 Remotion ffmpeg，也不为已删工程重建目录。

用法：python3 tools/build_opus_assets.py            # 只检查
      python3 tools/build_opus_assets.py --check    # 同上
      python3 tools/build_opus_assets.py --write    # 目录存在时才补齐
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
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
MANIFEST = ROOT / 'assets.manifest.json'

MAX_DIR = ROOT / '番外MV/把回忆拼好_opus5.5max'
MEM_DIR = ROOT / '番外MV/把回忆拼好_opus5.5'


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def expected_hash(rel: str) -> str | None:
    if not MANIFEST.exists():
        return None
    data = json.loads(MANIFEST.read_text(encoding='utf-8'))
    for f in data.get('files', []):
        if f.get('path') == rel:
            return f.get('sha256')
    return None


def need(path: Path, rel: str | None = None) -> bool:
    if not path.exists() or path.stat().st_size == 0:
        return True
    if rel:
        want = expected_hash(rel)
        if want and sha256(path) != want:
            return True
    return False


def ffmpeg() -> str:
    try:
        import imageio_ffmpeg
        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:
        return os.environ.get('FFMPEG') or shutil.which('ffmpeg') or 'ffmpeg'


def make_song(out: Path, check: bool, write: bool) -> bool:
    if not need(out):
        print(f'  音轨已在：{out.relative_to(ROOT)}')
        return True
    print(f'  {"✗ 缺音轨" if check else "· 待补音轨"}：{out.relative_to(ROOT)}')
    if not write:
        return False
    out.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run([ffmpeg(), '-y', '-v', 'error', '-i', str(SONG_SRC), '-vn',
                    '-c:a', 'libmp3lame', '-b:a', '192k', str(out)], check=True)
    print(f'  ✓ 抽出音轨 → {out.relative_to(ROOT)}')
    return True


def build_max_atlas(check: bool, write: bool) -> bool:
    if not MAX_DIR.exists():
        print('  SKIP 把回忆拼好_opus5.5max 不在仓库里')
        return True
    src = MAX_DIR / '源码/src/mv/data.ts'
    out = MAX_DIR / '源码/src/mv/assets/atlas.png'
    rel = '番外MV/把回忆拼好_opus5.5max/源码/src/mv/assets/atlas.png'
    if not need(out, rel):
        print(f'  图集已在且哈希一致：{out.relative_to(ROOT)}')
        return True
    print(f'  {"✗ 图集缺失 / 哈希不符" if check else "· 待重排图集"}：{out.relative_to(ROOT)}')
    if not write or not src.exists():
        return False
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
    return True


def copy_mem_atlas(check: bool, write: bool) -> bool:
    if not MEM_DIR.exists():
        print('  SKIP 把回忆拼好_opus5.5 已删，不重建目录')
        return True
    target_json = MEM_DIR / '源码/src/assets/cast_atlas.json'
    target_png = MEM_DIR / '源码/src/assets/cast_atlas.png'
    a = json.loads(ATLAS_JSON.read_text(encoding='utf-8'))['s']
    b = json.loads(target_json.read_text(encoding='utf-8'))['s']
    if a != b:
        raise SystemExit('工程自带的 cast_atlas.json 与仓库图集坐标不一致，不能直接拷贝 PNG')
    if target_png.exists() and sha256(target_png) == sha256(ATLAS_PNG):
        print(f'  图集已在且哈希一致：{target_png.relative_to(ROOT)}')
        return True
    print(f'  {"✗ 图集缺失 / 哈希不符" if check else "· 待拷贝图集"}：{target_png.relative_to(ROOT)}')
    if not write:
        return False
    shutil.copyfile(ATLAS_PNG, target_png)
    print(f'  ✓ 拷贝仓库图集 → {target_png.relative_to(ROOT)}（坐标逐格一致）')
    return True


def copy_fonts(check: bool, write: bool) -> bool:
    ok = True
    targets = []
    if MAX_DIR.exists():
        targets.append((MAX_DIR / '源码/src/mv/assets/zcool.ttf', 'ttf'))
    if MEM_DIR.exists():
        targets.append((MEM_DIR / '源码/src/assets/kuaile.woff', 'woff'))
    if not targets:
        print('  SKIP 两个历史工程都不在仓库里')
        return True
    for out, kind in targets:
        if out.exists() and out.stat().st_size > 0 and (kind == 'woff' or sha256(out) == sha256(FONT_TTF)):
            print(f'  字体已在：{out.relative_to(ROOT)}')
            continue
        print(f'  {"✗ 缺字体" if check else "· 待补字体"}：{out.relative_to(ROOT)}')
        if not write:
            ok = False
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
    return ok


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('--check', action='store_true')
    ap.add_argument('--write', action='store_true')
    args = ap.parse_args()
    check = args.check or not args.write
    write = args.write and not args.check
    ok = True
    print('把回忆拼好_opus5.5max：')
    ok &= make_song(MAX_DIR / '源码/src/mv/assets/song.mp3', check, write)
    ok &= build_max_atlas(check, write)
    ok &= copy_fonts(check, write)
    print('把回忆拼好_opus5.5：')
    ok &= make_song(MEM_DIR / '源码/src/assets/song.mp3', check, write) if MEM_DIR.exists() else True
    ok &= copy_mem_atlas(check, write)
    if check:
        sys.exit(0 if ok else 1)


if __name__ == '__main__':
    main()
