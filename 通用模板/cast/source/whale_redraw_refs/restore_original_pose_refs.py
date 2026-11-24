#!/usr/bin/env python3
"""Restore the exact old wave / point poses as the canonical 本鲸 base sprites.

The 2026-11-24 V2 AI redraw still left the pointing hand looking wrong in the
browser preview. These two poses are therefore restored from the pre-redraw
atlas references pixel-for-pixel; the other three base sprites remain V2
generated art. encode_whale_sprites.py still quantizes them to the fixed 248
color palette and fits them to the unchanged atlas rectangles.
"""
from __future__ import annotations

import shutil
from pathlib import Path

HERE = Path(__file__).resolve().parent

for pose in ("wave", "point"):
    src = HERE / f"whale_{pose}_ref.png"
    dst = HERE / f"whale_{pose}_clean.png"
    v3 = HERE / f"whale_{pose}_v3_clean.png"
    shutil.copy2(src, dst)
    shutil.copy2(src, v3)
    print(f"restored {pose}: {src.name} -> {dst.name} (also {v3.name})")
