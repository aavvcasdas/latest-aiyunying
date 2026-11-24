#!/usr/bin/env python3
"""《勾指起誓》三份历史上传工程的素材还原（当前仓库中这三份目录均已删除）。

早期 zip 只带源码：图集、字体、音轨要按各工程写死的路径补齐。现在这三份工程
都不在 `番外MV/` 里，所以本脚本默认 check-only 并跳过缺失目录；仓库里现存素材
以 `assets.manifest.json` 的 SHA256 为准。不要为了跑这个脚本重建已删作品目录。

用法：
  python3 tools/build_gouzhiqishi_assets.py            # 只检查，不写盘
  python3 tools/build_gouzhiqishi_assets.py --check    # 同上
  python3 tools/build_gouzhiqishi_assets.py --write    # 目录存在时才补齐
"""
from __future__ import annotations

import argparse
import hashlib
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ATLAS = ROOT / '通用模板/engine/assets/cast_atlas.png'
FONT = ROOT / '通用模板/engine/assets/fonts/ZCOOLKuaiLe-Regular.ttf'
SONG = ROOT / '《勾指起誓》.mp3'

PLAN = {
    '勾指起誓_fable5.1max': [
        (ATLAS, '源码/src/assets/cast_atlas.png'),
        (FONT, '源码/src/assets/ZCOOLKuaiLe-Regular.ttf'),
        (SONG, '源码/src/assets/goujiqishi.mp3'),
    ],
    '勾指起誓_gemini4': [
        (ATLAS, '源码/src/engine/assets/cast_atlas.png'),
        (FONT, '源码/src/engine/assets/ZCOOLKuaiLe-Regular.ttf'),
        (SONG, '源码/src/assets/gouzhiqishi.mp3'),
    ],
    '勾指起誓_opus5.5': [
        (ATLAS, '源码/src/assets/atlas.png'),
        (SONG, '源码/src/assets/song.mp3'),
    ],
}
WOFF2 = ('勾指起誓_opus5.5', '源码/src/assets/zcool-sub.woff2')


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def make_woff2(dst: Path) -> None:
    try:
        from fontTools.ttLib import TTFont
        f = TTFont(str(FONT))
        f.flavor = 'woff2'
        f.save(str(dst))
    except Exception as e:  # noqa: BLE001
        print(f'  ! 转 woff2 失败（{e}），改用 TTF：opus5.5 的 index.css 需要指向 ZCOOLKuaiLe-Regular.ttf')
        shutil.copyfile(FONT, dst.with_name('ZCOOLKuaiLe-Regular.ttf'))
        css = dst.parent.parent / 'index.css'
        s = css.read_text()
        s = s.replace('./assets/zcool-sub.woff2', './assets/ZCOOLKuaiLe-Regular.ttf').replace('format("woff2")', 'format("truetype")')
        css.write_text(s)


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('--check', action='store_true')
    ap.add_argument('--write', action='store_true')
    a = ap.parse_args()
    write = a.write and not a.check

    missing_src = [p for p in (ATLAS, FONT, SONG) if not p.exists()]
    if missing_src:
        print('缺素材源：', *[str(p.relative_to(ROOT)) for p in missing_src], sep='\n  ')
        sys.exit(1)

    bad = 0
    for work, pairs in PLAN.items():
        work_dir = ROOT / '番外MV' / work
        if not work_dir.exists():
            print(f'== {work}  SKIP 历史工程已删，不重建目录')
            continue
        print(f'== {work}')
        for src, rel in pairs:
            dst = work_dir / rel
            ok = dst.exists() and sha256(dst) == sha256(src)
            print(f'  {"✓" if ok else "✗"} {rel}  {dst.stat().st_size if dst.exists() else 0} B')
            if not ok:
                bad += 1
                if write:
                    dst.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copyfile(src, dst)
                    print(f'    → 已写入 {dst.stat().st_size} B')

    work_dir, rel = WOFF2
    base = ROOT / '番外MV' / work_dir
    if base.exists():
        dst = base / rel
        ok = dst.exists()
        print(f'== {work_dir}')
        print(f'  {"✓" if ok else "✗"} {rel}  {dst.stat().st_size if ok else 0} B')
        if not ok:
            bad += 1
            if write:
                dst.parent.mkdir(parents=True, exist_ok=True)
                make_woff2(dst)
                print('    → 已生成')
    else:
        print(f'== {work_dir}  SKIP 历史工程已删，不生成 woff2')

    if not write:
        sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
