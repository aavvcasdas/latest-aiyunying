#!/usr/bin/env python3
"""Restore 本鲸's pre-redraw lower-body clothes on the clean base art.

The user rejected the V2/current apron with extra decorative swirls and asked
for the other, plainer version: the lower body from ``cast_atlas.before.png``.
This script replaces only the lower central clothing region of the idle /
blink clean arts. The 2026-11-24 rollback restored wave / point to the
pre-clothes-freeze `f23…` state: the original-reference arms plus their own
skirt, with no old lower-body patch. Heads, faces and bonnets stay untouched.

After this runs, ``encode_whale_sprites.py`` applies the same old-atlas patch
again after fitting to the fixed atlas rectangles for idle / blink, so the exact
canonical pixels survive resampling. The derived action baker never freezes the
lower body; pose() may move head, torso, skirt and legs naturally.
"""
from __future__ import annotations

import json
import shutil
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = Path(__file__).resolve().parents[4]
OLD_ATLAS = ROOT / 'docs/quality_comparison/whale_redraw/cast_atlas.before.png'
RECTS = json.loads((ROOT / '通用模板/engine/assets/cast_atlas.json').read_text(encoding='utf-8'))['s']
BOX = (0.18, 0.58, 0.82, 1.0)
# 2026-11-24 回退：挥手 / 递出去已回到「加裙子固定之前」的 f23… 状态
# （旧参考格手臂 + 自己的裙摆，不贴旧下半身补丁），所以只处理正面待机 / 眨眼。
TARGETS = ('front', 'blink')


def _box(im: Image.Image):
    w, h = im.size
    return (
        int(w * BOX[0]), int(h * BOX[1]),
        int(w * BOX[2]), int(h * BOX[3]),
    )


def _old_patch(key: str):
    x, y, w, h = RECTS[key]
    im = Image.open(OLD_ATLAS).convert('RGBA').crop((x, y, x + w, y + h))
    return im.crop(_box(im))


def apply_old_clothes() -> None:
    small = _old_patch('whale_idle')
    for name in TARGETS:
        dst = HERE / f'whale_{name}_clean.png'
        im = Image.open(dst).convert('RGBA')
        backup = HERE / f'whale_{name}_oldclothes_before.png'
        if not backup.exists():
            shutil.copy2(dst, backup)
        box = _box(im)
        scaled = small.resize((box[2] - box[0], box[3] - box[1]), Image.Resampling.NEAREST)
        # Replace alpha too: old V2 hem / decorative swirls must not survive.
        im.paste(scaled, (box[0], box[1]))
        im.save(dst)
        v3 = HERE / f'whale_{name}_v3_clean.png'
        if v3.exists():
            shutil.copy2(dst, v3)
        print(f'old lower-body clothes restored: {dst.name}')


if __name__ == '__main__':
    apply_old_clothes()
