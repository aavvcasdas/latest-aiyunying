#!/usr/bin/env python3
"""Visual QA: character-quality before/after demo, and frame-sequence motion checks.

Demo mode simulates the old delivery chain (blur + bloom + chromatic offset + two
JPEG passes) versus the new lossless/2x-supersampled chain, using a real atlas cell.
Frames mode scans a PNG/JPEG frame sequence for blanks, frozen runs and a contact sheet.
"""
from __future__ import annotations

import argparse
import io
import json
import math
from pathlib import Path
from typing import Any

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageStat

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_OUT = ROOT / "docs/quality_comparison"


def display_path(path: Path) -> str:
    """Repo-relative path when possible; absolute path for /tmp QA outputs."""
    try:
        return str(path.resolve().relative_to(ROOT))
    except ValueError:
        return str(path.resolve())


def psnr(reference: Image.Image, candidate: Image.Image) -> float:
    diff = ImageChops.difference(reference.convert("RGB"), candidate.convert("RGB"))
    rms = ImageStat.Stat(diff).rms
    mse = sum(v * v for v in rms) / len(rms)
    return 99.0 if mse == 0 else 10 * math.log10((255.0 ** 2) / mse)


def edge_energy(image: Image.Image) -> float:
    return ImageStat.Stat(image.convert("L").filter(ImageFilter.FIND_EDGES)).mean[0]


def composite_on_dark(rgba: Image.Image, size: tuple[int, int]) -> Image.Image:
    bg = Image.new("RGB", size, (14, 12, 28))
    bg.paste(rgba, mask=rgba.getchannel("A"))
    return bg


def simulate_before(src: Image.Image, scale: int = 3) -> Image.Image:
    # Old chain: smooth upscale, bloom, chromatic aberration, JPEG 0.92 capture,
    # then another lossy delivery pass approximating H.264 CRF 23 on sprites.
    smooth = src.resize((src.width * scale, src.height * scale), Image.Resampling.BICUBIC)
    base = composite_on_dark(smooth, smooth.size)
    bloom = ImageChops.screen(base, ImageEnhance.Brightness(base.filter(ImageFilter.GaussianBlur(2))).enhance(1.35))
    bloom = Image.blend(base, bloom, 0.45)
    r, g, b = bloom.split()
    bloom = Image.merge("RGB", (ImageChops.offset(r, 2, 0), g, ImageChops.offset(b, -2, 0)))
    first = io.BytesIO()
    bloom.save(first, format="JPEG", quality=92, subsampling=0)
    first.seek(0)
    second = io.BytesIO()
    Image.open(first).convert("RGB").save(second, format="JPEG", quality=85, subsampling=0)
    second.seek(0)
    return Image.open(second).convert("RGB")


def simulate_after(src: Image.Image, scale: int = 3) -> Image.Image:
    # New chain: 2x supersample, integer box downsample, no bloom/chroma, lossless PNG.
    super2 = src.resize((src.width * scale * 2, src.height * scale * 2), Image.Resampling.NEAREST)
    down = super2.resize((src.width * scale, src.height * scale), Image.Resampling.BOX)
    return composite_on_dark(down, down.size)


def comparison_demo(atlas: Path, meta: Path, key: str, out_dir: Path) -> dict[str, Any]:
    rects = json.loads(meta.read_text(encoding="utf-8"))["s"]
    if key not in rects:
        raise SystemExit(f"图集里没有这一格：{key}")
    x, y, w, h = rects[key]
    with Image.open(atlas) as im:
        src = im.convert("RGBA").crop((x, y, x + w, y + h))
    reference = composite_on_dark(src.resize((src.width * 3, src.height * 3), Image.Resampling.NEAREST), (src.width * 3, src.height * 3))
    before = simulate_before(src)
    after = simulate_after(src)

    before_psnr = psnr(reference, before)
    after_psnr = psnr(reference, after)
    before_edge = edge_energy(before)
    after_edge = edge_energy(after)
    metrics = {
        "source": {"atlas": str(atlas.relative_to(ROOT)), "key": key, "rect": [x, y, w, h], "scale": 3},
        "before": {
            "pipeline": "bicubic upscale → bloom → chromatic offset → JPEG Q92 → JPEG Q85",
            "psnrVsLosslessReference": round(before_psnr, 2),
            "edgeEnergy": round(before_edge, 2),
        },
        "after": {
            "pipeline": "2x nearest supersample → box downsample → no bloom/chroma → lossless PNG",
            "psnrVsLosslessReference": round(after_psnr, 2),
            "edgeEnergy": round(after_edge, 2),
        },
        "improvement": {
            "psnrDb": round(after_psnr - before_psnr, 2),
            "edgeEnergyDelta": round(after_edge - before_edge, 2),
        },
        "image": "docs/quality_comparison/character_quality_comparison.png",
    }

    pad, label_h = 24, 54
    canvas = Image.new("RGB", (before.width * 2 + pad * 3, before.height + label_h + pad * 2), (9, 10, 20))
    draw = ImageDraw.Draw(canvas)
    draw.text((pad, 10), "BEFORE  lossy JPEG + bloom + chroma", fill=(255, 170, 170))
    draw.text((before.width + pad * 2, 10), "AFTER  lossless PNG + 2x supersample", fill=(170, 255, 205))
    canvas.paste(before, (pad, label_h))
    canvas.paste(after, (before.width + pad * 2, label_h))
    out_dir.mkdir(parents=True, exist_ok=True)
    image_path = out_dir / "character_quality_comparison.png"
    json_path = out_dir / "comparison.json"
    canvas.save(image_path, format="PNG", optimize=True)
    json_path.write_text(json.dumps(metrics, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    metrics["image"] = display_path(image_path)
    json_path.write_text(json.dumps(metrics, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return metrics


def demo_motion_frames(atlas: Path, meta: Path, out_frames: Path) -> None:
    """Write a deterministic walk-cycle frame sequence to a temporary directory.

    It uses eight existing whale walk cells from the canonical atlas; no new
    character art is generated. The point is to exercise the blank/frozen-frame
    scanner and produce a reproducible contact sheet when no real MV render is
    available yet.
    """
    rects = json.loads(meta.read_text(encoding="utf-8"))["s"]
    keys = [f"walk_whale_{i}" for i in range(8)]
    for key in keys:
        if key not in rects:
            raise SystemExit(f"图集里没有这一格：{key}")
    out_frames.mkdir(parents=True, exist_ok=True)
    with Image.open(atlas) as im:
        for index in range(24):
            x, y, w, h = rects[keys[index % len(keys)]]
            sprite = im.convert("RGBA").crop((x, y, x + w, y + h))
            sprite = sprite.resize((w * 3, h * 3), Image.Resampling.NEAREST)
            frame = Image.new("RGB", (1280, 720), (14, 12, 28))
            offset = 180 + index * 18
            frame.paste(sprite, (offset, 260), mask=sprite.getchannel("A"))
            frame.save(out_frames / f"f{index:05d}.png", format="PNG", optimize=True)


def scan_frames(frames: Path, out_dir: Path, limit: int = 48, source: str = "real frame sequence") -> dict[str, Any]:
    files = sorted([p for p in frames.iterdir() if p.suffix.lower() in {".png", ".jpg", ".jpeg"}])
    if not files:
        raise SystemExit(f"没有帧：{frames}")
    problems: list[str] = []
    diffs: list[float] = []
    blank: list[str] = []
    frozen: list[int] = []
    thumbs: list[Image.Image] = []
    previous: Image.Image | None = None
    for index, file in enumerate(files):
        with Image.open(file) as raw:
            im = raw.convert("RGB")
            stat = ImageStat.Stat(im)
            if max(stat.stddev) < 1.0:
                blank.append(file.name)
            if previous is not None:
                d = ImageStat.Stat(ImageChops.difference(previous, im)).mean
                mean_diff = sum(d) / len(d)
                diffs.append(mean_diff)
                if mean_diff < 0.25:
                    frozen.append(index)
            previous = im.copy()
            if len(thumbs) < limit:
                thumbs.append(im.copy())
    if blank:
        problems.append(f"{len(blank)} blank/near-blank frames")
    if frozen:
        problems.append(f"{len(frozen)} repeated/near-identical frames")
    cols = min(6, len(thumbs))
    rows = math.ceil(len(thumbs) / cols) if cols else 0
    tw, th = (320, 180) if cols else (1, 1)
    sheet = Image.new("RGB", (cols * tw, rows * th), (8, 9, 18))
    for i, thumb in enumerate(thumbs):
        fitted = thumb.copy()
        fitted.thumbnail((tw, th), Image.Resampling.LANCZOS)
        sheet.paste(fitted, ((i % cols) * tw, (i // cols) * th))
    out_dir.mkdir(parents=True, exist_ok=True)
    sheet_path = out_dir / "motion_contact_sheet.png"
    sheet.save(sheet_path, format="PNG", optimize=True)
    report = {
        "status": "ok" if not problems else "warning",
        "source": source,
        "frames": len(files),
        "meanFrameDifference": round(sum(diffs) / len(diffs), 3) if diffs else None,
        "blankFrames": blank[:20],
        "frozenFrameIndices": frozen[:20],
        "problems": problems,
        "contactSheet": display_path(sheet_path),
    }
    (out_dir / "motion_qa.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return report


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--demo", action="store_true", help="generate character quality before/after comparison")
    ap.add_argument("--motion-demo", action="store_true", help="scan a deterministic atlas walk-cycle sequence (no generated art)")
    ap.add_argument("--atlas", default="通用模板/engine/assets/cast_atlas.png")
    ap.add_argument("--meta", default="通用模板/engine/assets/cast_atlas.json")
    ap.add_argument("--key", default="act_whale_idle_0")
    ap.add_argument("--frames", default="", help="optional frame directory for motion QA")
    ap.add_argument("--out", default=str(DEFAULT_OUT))
    ap.add_argument("--limit", type=int, default=48)
    args = ap.parse_args()
    out_dir = Path(args.out)
    if not out_dir.is_absolute():
        out_dir = ROOT / out_dir
    results: dict[str, Any] = {}
    if args.demo:
        results["qualityComparison"] = comparison_demo(ROOT / args.atlas, ROOT / args.meta, args.key, out_dir)
    if args.motion_demo:
        import tempfile
        with tempfile.TemporaryDirectory(prefix="quality_motion_") as tmp:
            demo_motion_frames(ROOT / args.atlas, ROOT / args.meta, Path(tmp))
            results["motionQa"] = scan_frames(Path(tmp), out_dir, args.limit, "canonical atlas walk-cycle demo")
    if args.frames:
        results["motionQa"] = scan_frames(Path(args.frames), out_dir, args.limit)
    if not results:
        ap.error("pass --demo, --motion-demo and/or --frames <dir>")
    print(json.dumps(results, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
