#!/usr/bin/env python3
"""Deterministically restore the connected waving / pointing arms from the original atlas refs.

The AI redraws occasionally leave a visually broken sleeve-to-hand connection even
when alpha connectivity is technically one component. For those two poses we
overlay the original sprite's arm region (transparent alpha, exact palette colors)
onto the v2 cleaned art at the same normalized coordinates. The result is still
quantized later by encode_whale_sprites.py, so no new source palette is invented.
"""
from __future__ import annotations

from pathlib import Path
from PIL import Image

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[3]
OUT = ROOT / "docs/quality_comparison/whale_redraw"

# Normalized (x0, y0, x1, y1) region around the right shoulder, sleeve and hand.
REGIONS = {
    "wave": (0.52, 0.32, 0.86, 0.64),
    "point": (0.54, 0.33, 0.89, 0.65),
}


def restore(name: str) -> Path:
    old = Image.open(HERE / f"whale_{name}_ref.png").convert("RGBA")
    target = Image.open(HERE / f"whale_{name}_v2_clean.png").convert("RGBA")
    x0, y0, x1, y1 = REGIONS[name]
    ow, oh = old.size
    tw, th = target.size
    crop = old.crop((int(ow * x0), int(oh * y0), int(ow * x1), int(oh * y1)))
    box = (int(tw * x0), int(th * y0), int(tw * x1), int(th * y1))
    crop = crop.resize((box[2] - box[0], box[3] - box[1]), Image.Resampling.NEAREST)
    layer = Image.new("RGBA", target.size, (0, 0, 0, 0))
    layer.alpha_composite(crop, (box[0], box[1]))
    fixed = Image.alpha_composite(target, layer)
    path = HERE / f"whale_{name}_v2_fixed_clean.png"
    fixed.save(path)
    print(f"restored {name} arm from original ref -> {path} {fixed.size}")
    return path


def zoom(name: str) -> Path:
    old = Image.open(HERE / f"whale_{name}_ref.png").convert("RGBA")
    before = Image.open(HERE / f"whale_{name}_v2_clean.png").convert("RGBA")
    after = Image.open(HERE / f"whale_{name}_v2_fixed_clean.png").convert("RGBA")
    x0, y0, x1, y1 = REGIONS[name]
    W, H = 420, 420
    sheet = Image.new("RGB", (W * 3, H), (10, 10, 18))
    for i, (label, im) in enumerate([("原版参考", old), ("修复前", before), ("修复后", after)]):
        w, h = im.size
        c = im.crop((int(w * x0), int(h * y0), int(w * x1), int(h * y1)))
        scale = min((W - 20) / c.width, (H - 50) / c.height)
        t = c.resize((max(1, int(c.width * scale)), max(1, int(c.height * scale))), Image.Resampling.NEAREST)
        bg = Image.new("RGBA", (W - 10, H - 40), (18, 18, 30, 255))
        bg.alpha_composite(t, ((bg.width - t.width) // 2, (bg.height - t.height) // 2))
        sheet.paste(bg.convert("RGB"), (i * W + 5, 35))
        from PIL import ImageDraw
        ImageDraw.Draw(sheet).text((i * W + 8, 8), f"{name} · {label}", fill=(240, 220, 200))
    path = OUT / f"{name}_arm_fix_zoom.png"
    sheet.save(path)
    print(f"zoom -> {path}")
    return path


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for n in REGIONS:
        restore(n)
        zoom(n)
