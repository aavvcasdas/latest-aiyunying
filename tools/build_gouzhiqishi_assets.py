#!/usr/bin/env python3
"""《勾指起誓》三份上传工程（fable5.1max / gemini-4 / opus5.5）的素材还原。

三份 zip 里只有源码：三套引擎各自 import 的**图集、字体、音轨**都没带（zip 体积都在 250–450 KB）。
这里按各工程源码里写死的路径把素材放到该放的地方，然后（可选）把字体转成 opus5.5 那份 CSS 指定的 woff2。

| 工程 | 图集 | 字体 | 音轨 |
|---|---|---|---|
| `勾指起誓_fable5.1max` | `源码/src/assets/cast_atlas.png` | `源码/src/assets/ZCOOLKuaiLe-Regular.ttf` | `src/assets/goujiqishi.mp3` |
| `勾指起誓_gemini4` | `源码/src/engine/assets/cast_atlas.png` | `源码/src/engine/assets/ZCOOLKuaiLe-Regular.ttf` | `src/assets/gouzhiqishi.mp3` |
| `勾指起誓_opus5.5` | `源码/src/assets/atlas.png` | `源码/src/assets/zcool-sub.woff2` | `src/assets/song.mp3` |

素材来源（都在本仓库里）：

* 图集：`通用模板/engine/assets/cast_atlas.png`（2048×3126 · 682 格）。三份工程自带的 `cast_atlas.json` / `atlas.json`
  里的 `w/h` 都是 2048×3126、`s` 都是同一套 682 个 rect，所以直接拷过去就对齐，不需要重排。
* 字体：`通用模板/engine/assets/fonts/ZCOOLKuaiLe-Regular.ttf`（站酷快乐体，OFL）。
  opus5.5 的 `index.css` 写的是 `./assets/zcool-sub.woff2`，用 fontTools 转一份（转不了就退回 TTF + 改 CSS）。
* 音轨：仓库根的 `《勾指起誓》.mp3`（183.745 s，128 kbps）。

用法：
  python3 tools/build_gouzhiqishi_assets.py            # 还原
  python3 tools/build_gouzhiqishi_assets.py --check    # 只检查，缺什么报什么
"""
import argparse
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ATLAS = ROOT / '通用模板/engine/assets/cast_atlas.png'
FONT = ROOT / '通用模板/engine/assets/fonts/ZCOOLKuaiLe-Regular.ttf'
SONG = ROOT / '《勾指起誓》.mp3'

# 作品目录 → [(源, 目标相对路径), ...]
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
    a = ap.parse_args()

    missing_src = [p for p in (ATLAS, FONT, SONG) if not p.exists()]
    if missing_src:
        print('缺素材源：', *[str(p.relative_to(ROOT)) for p in missing_src], sep='\n  ')
        sys.exit(1)

    bad = 0
    for work, pairs in PLAN.items():
        print(f'== {work}')
        for src, rel in pairs:
            dst = ROOT / '番外MV' / work / rel
            ok = dst.exists() and dst.stat().st_size == src.stat().st_size
            print(f'  {"✓" if ok else "✗"} {rel}  {dst.stat().st_size if dst.exists() else 0} B')
            if not ok:
                bad += 1
                if not a.check:
                    dst.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copyfile(src, dst)
                    print(f'    → 已写入 {dst.stat().st_size} B')
    work_dir, rel = WOFF2
    dst = ROOT / '番外MV' / work_dir / rel
    ok = dst.exists()
    print(f'== {work_dir}')
    print(f'  {"✓" if ok else "✗"} {rel}  {dst.stat().st_size if ok else 0} B')
    if not ok:
        bad += 1
        if not a.check:
            dst.parent.mkdir(parents=True, exist_ok=True)
            make_woff2(dst)
            print('    → 已生成')
    if a.check:
        sys.exit(1 if bad else 0)


if __name__ == '__main__':
    main()
