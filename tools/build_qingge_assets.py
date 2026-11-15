#!/usr/bin/env python3
"""2026-11-15 上传的三份工程（《我好想你》、《情歌》opus5.5max、《情歌》opus5.5max-gpt6max开头）的素材还原。

三个 zip 里都只有源码：各自 import 的**图集、字体、音轨**一个都没带，直接 `vite build` 会因为 import 找不到文件而失败。
这里按各工程源码里写死的路径，从仓库自己的东西把素材补回去。

| 工程 | 图集 | 字体 | 音轨 |
|---|---|---|---|
| `我好想你` | `src/assets/cast.png`（1024×1816 · 196 格，按 `src/data/cast.json` 重排） | `src/assets/zcool-subset.woff2` | `src/assets/bgm.mp3` |
| `情歌_opus5.5max` | `src/assets/atlas.png`（2048×4096 · 501 格，按 `src/mv/generated.ts` 的 RECTS 重排） | `src/assets/zcool.woff2` | `src/assets/song.mp3` |
| `情歌_opus5.5max_gpt6max开头` | 同上 | 同上 | 同上 |

素材来源（都在本仓库里）：

* 图集：`通用模板/engine/assets/cast_atlas.png`（2048×3126 · 682 格）。三份工程用的都是**重排过**的图集，
  格子名与尺寸和仓库图集逐格一致，所以按「名字 → 仓库里的像素」一格一格贴到工程自己写的坐标上。
  名字找不到或尺寸对不上就报错，不拿别的造型顶替。
* 字体：`通用模板/engine/assets/fonts/ZCOOLKuaiLe-Regular.ttf`（站酷快乐体，OFL）整份转成 woff2
  （原工程用的是子集；整份是它的超集，画面上的字一个不少）。
* 音轨：仓库根的 `我好像你.MP3`（329.33 秒）与 `情歌 .mp3`（261.55 秒；文件名是 mp3，内容其实是 m4a 容器里的 aac）。
  都是**原样拷贝**，不重编码；浏览器按内容嗅探解码，不看扩展名。

没还原的（只影响网页外壳，不进成片画面）：`情歌_opus5.5max_gpt6max开头` 的
`src/assets/title.ttf`、`src/assets/ui-cjk.ttf`（Noto Serif SC / Noto Sans SC 的界面字体子集，仓库里没有这两套字）。
`src/assets/cover.jpg`（网页封面底图）是该工程自己的一帧，用 `tools/shoot_frames.mjs --cover` 重出。

用法：
  python3 tools/build_qingge_assets.py            # 还原
  python3 tools/build_qingge_assets.py --check    # 只检查，缺什么报什么
"""
import argparse
import json
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ATLAS_JSON = ROOT / '通用模板/engine/assets/cast_atlas.json'
ATLAS_PNG = ROOT / '通用模板/engine/assets/cast_atlas.png'
FONT = ROOT / '通用模板/engine/assets/fonts/ZCOOLKuaiLe-Regular.ttf'
SONG_MISS = ROOT / '我好像你.MP3'
SONG_LOVE = ROOT / '情歌 .mp3'

MV = ROOT / '番外MV'
MISS = MV / '我好想你/源码'
LOVE = [MV / '情歌_opus5.5max/源码', MV / '情歌_opus5.5max_gpt6max开头/源码']


def rects_from_cast_json(src: Path):
    d = json.loads(src.read_text(encoding='utf-8'))
    return d['w'], d['h'], d['frames']


def rects_from_generated(src: Path):
    text = src.read_text(encoding='utf-8')
    m = re.search(r'RECTS: Record<string, \[number, number, number, number\]> = (\{.*?\});', text, re.S)
    wm = re.search(r'ATLAS_W = (\d+); export const ATLAS_H = (\d+)', text)
    if not m or not wm:
        raise SystemExit(f'在 {src} 里找不到 RECTS / ATLAS_W / ATLAS_H')
    return int(wm.group(1)), int(wm.group(2)), json.loads(m.group(1))


def repack(out: Path, W: int, H: int, rects: dict) -> None:
    from PIL import Image

    repo = json.loads(ATLAS_JSON.read_text(encoding='utf-8'))['s']
    master = Image.open(ATLAS_PNG).convert('RGBA')
    canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    for name, (x, y, w, h) in rects.items():
        if name not in repo:
            raise SystemExit(f'仓库图集里没有 {name}')
        rx, ry, rw, rh = repo[name]
        if (rw, rh) != (w, h):
            raise SystemExit(f'{name} 尺寸对不上：仓库 {rw}×{rh}，工程 {w}×{h}')
        if x + w > W or y + h > H:
            raise SystemExit(f'{name} 超出图集边界 {W}×{H}')
        canvas.paste(master.crop((rx, ry, rx + rw, ry + rh)), (x, y))
    out.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(out, optimize=True)


def make_woff2(out: Path) -> None:
    from fontTools.ttLib import TTFont

    f = TTFont(str(FONT), recalcTimestamp=False)
    f.flavor = 'woff2'
    out.parent.mkdir(parents=True, exist_ok=True)
    f.save(str(out))


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('--check', action='store_true')
    a = ap.parse_args()

    missing_src = [p for p in (ATLAS_JSON, ATLAS_PNG, FONT, SONG_MISS, SONG_LOVE) if not p.exists()]
    if missing_src:
        print('缺素材源：', *[str(p.relative_to(ROOT)) for p in missing_src], sep='\n  ')
        sys.exit(1)

    # (目标, 说明, 生成函数)
    jobs = []
    W, H, R = rects_from_cast_json(MISS / 'src/data/cast.json')
    jobs.append((MISS / 'src/assets/cast.png', f'图集 {W}×{H} · {len(R)} 格', lambda o, W=W, H=H, R=R: repack(o, W, H, R)))
    jobs.append((MISS / 'src/assets/zcool-subset.woff2', '字体 woff2', make_woff2))
    jobs.append((MISS / 'src/assets/bgm.mp3', '音轨（原样拷贝）', lambda o: shutil.copyfile(SONG_MISS, o)))
    for d in LOVE:
        W, H, R = rects_from_generated(d / 'src/mv/generated.ts')
        jobs.append((d / 'src/assets/atlas.png', f'图集 {W}×{H} · {len(R)} 格', lambda o, W=W, H=H, R=R: repack(o, W, H, R)))
        jobs.append((d / 'src/assets/zcool.woff2', '字体 woff2', make_woff2))
        jobs.append((d / 'src/assets/song.mp3', '音轨（原样拷贝）', lambda o: shutil.copyfile(SONG_LOVE, o)))

    bad = 0
    for out, what, fn in jobs:
        ok = out.exists() and out.stat().st_size > 0
        rel = out.relative_to(ROOT)
        if ok:
            print(f'  ✓ {rel}  {out.stat().st_size} B')
            continue
        bad += 1
        if a.check:
            print(f'  ✗ {rel}  缺（{what}）')
            continue
        out.parent.mkdir(parents=True, exist_ok=True)
        fn(out)
        print(f'  → {rel}  {out.stat().st_size} B（{what}）')
    if a.check:
        sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
