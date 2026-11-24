#!/usr/bin/env python3
"""Validate generated moon assets: prompt/raw/output hashes, dimensions, alpha and copies.

`--write` creates 人物/生成/满月篇/assets.manifest.json from the files currently in
the repository. `--check` (default) verifies that manifest and also writes a small
report used by CI / docs/quality_comparison/fix_comparison.md.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from pathlib import Path
from typing import Any

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = ROOT / "人物/生成/满月篇/assets.manifest.json"
REPORT = ROOT / "docs/quality_comparison/generated_asset_report.json"

GEN = "番外MV/{project}/源码/src/assets/gen/{name}"
PROJECTS = ["若是月亮还没来", "若是月亮fable5.2high"]


def asset_spec() -> list[dict[str, Any]]:
    pose_prompt = {
        "whale_lookup": "人物/提示词/满月篇/whale_仰望_绿幕.txt",
        "whale_hug_benyu": "人物/提示词/满月篇/whale_抱笨鱼_绿幕.txt",
        "whale_hold_camellia": "人物/提示词/满月篇/whale_捧山茶_绿幕.txt",
    }
    raw = {
        "whale_lookup": "番外MV/若是月亮还没来/源码/gen_raw/whale_sit_lookup.png",
        "whale_hug_benyu": "番外MV/若是月亮还没来/源码/gen_raw/whale_hug_benyu.png",
        "whale_hold_camellia": "番外MV/若是月亮还没来/源码/gen_raw/whale_hold_camellia.png",
        "streetlamp": "番外MV/若是月亮还没来/源码/gen_raw/prop_streetlamp.png",
        "camellia_states": "番外MV/若是月亮还没来/源码/gen_raw/prop_camellia_stages.png",
        "benyu": "人物/q版/笨鱼.png",
    }
    canonical = {
        "whale_lookup": "人物/生成/满月篇/whale_lookup.png",
        "whale_hug_benyu": "人物/生成/满月篇/whale_hug_benyu.png",
        "whale_hold_camellia": "人物/生成/满月篇/whale_hold_camellia.png",
        "streetlamp": "人物/道具/满月篇/streetlamp.png",
        "camellia_bud": "人物/道具/满月篇/camellia_bud.png",
        "camellia_half": "人物/道具/满月篇/camellia_half.png",
        "camellia_bloom": "人物/道具/满月篇/camellia_bloom.png",
        "camellia_bud_hd": "人物/道具/满月篇/camellia_bud_hd.png",
        "camellia_half_hd": "人物/道具/满月篇/camellia_half_hd.png",
        "camellia_bloom_hd": "人物/道具/满月篇/camellia_bloom_hd.png",
        "benyu_px": "人物/q版/笨鱼_px.png",
    }
    entries: list[dict[str, Any]] = []
    for key, prompt in pose_prompt.items():
        entries.append({"id": key, "kind": "pose", "prompt": prompt, "raw": raw[key], "canonical": canonical[key]})
    entries.append({"id": "streetlamp", "kind": "prop", "prompt": "人物/提示词/满月篇/道具_路灯_绿幕.txt", "raw": raw["streetlamp"], "canonical": canonical["streetlamp"]})
    for key in ["camellia_bud", "camellia_half", "camellia_bloom", "camellia_bud_hd", "camellia_half_hd", "camellia_bloom_hd"]:
        entries.append({"id": key, "kind": "camellia", "prompt": "人物/提示词/满月篇/道具_白山茶三态_绿幕.txt", "raw": raw["camellia_states"], "canonical": canonical[key]})
    entries.append({"id": "benyu_px", "kind": "derived", "prompt": None, "raw": raw["benyu"], "canonical": canonical["benyu_px"]})
    for entry in entries:
        name = f"{entry['id']}.png" if entry["id"] != "benyu_px" else "benyu_px.png"
        entry["copies"] = [GEN.format(project=p, name=name) for p in PROJECTS]
    return entries


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def png_facts(path: Path) -> dict[str, Any]:
    im = Image.open(path).convert("RGBA")
    alpha = im.getchannel("A")
    bbox = alpha.getbbox()
    values = set(alpha.get_flattened_data() if hasattr(alpha, "get_flattened_data") else alpha.getdata())
    corners = [im.getpixel(xy) for xy in [(0, 0), (im.width - 1, 0), (0, im.height - 1), (im.width - 1, im.height - 1)]]
    return {
        "width": im.width,
        "height": im.height,
        "alpha_hard": values.issubset({0, 255}),
        "alpha_values": sorted(values),
        "bbox": list(bbox) if bbox else None,
        "foot_baseline": bbox[3] if bbox else None,
        "corner_alpha": [c[3] for c in corners],
        "corner_rgb": [c[:3] for c in corners],
    }


def green_corners(path: Path) -> bool:
    im = Image.open(path).convert("RGB")
    corners = [im.getpixel(xy)[:3] for xy in [(0, 0), (im.width - 1, 0), (0, im.height - 1), (im.width - 1, im.height - 1)]]
    return all(r <= 40 and g >= 215 and b <= 40 for r, g, b in corners)


def file_record(rel: str) -> dict[str, Any]:
    p = ROOT / rel
    if not p.exists():
        raise SystemExit(f"缺文件：{rel}")
    rec: dict[str, Any] = {"path": rel, "sha256": sha256(p), "bytes": p.stat().st_size}
    if p.suffix.lower() == ".png":
        rec.update(png_facts(p))
    return rec


def write_manifest() -> dict[str, Any]:
    assets = []
    for spec in asset_spec():
        item = {
            "id": spec["id"],
            "kind": spec["kind"],
            "prompt": file_record(spec["prompt"]) if spec["prompt"] else None,
            "raw": file_record(spec["raw"]),
            "canonical": file_record(spec["canonical"]),
            "copies": [file_record(p) for p in spec["copies"]],
        }
        if spec["raw"].endswith(".png") and spec["kind"] != "derived":
            item["raw"]["green_corners"] = green_corners(ROOT / spec["raw"])
        assets.append(item)
    manifest = {
        "schema": 1,
        "generatedBy": "tools/generated_assets/validate_generated.py --write",
        "policy": "Generated character assets are allowed only when recorded here with prompt/raw/output hashes and license provenance.",
        "generation": {
            "model": "unknown",
            "modelVersion": "unknown",
            "seed": None,
            "status": "legacy_unknown",
            "note": "These five images predate the manifest. Do not regenerate without recording model/version/seed and re-running --write.",
        },
        "license": "CC BY-NC-SA 4.0; see 素材许可与来源.md and 番外MV/若是月亮还没来/素材/remade.md",
        "assets": assets,
    }
    MANIFEST.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return manifest


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--write", action="store_true", help="regenerate the manifest from current files")
    ap.add_argument("--strict-provenance", action="store_true", help="fail when model/version/seed are unknown")
    ap.add_argument("--report", default=str(REPORT))
    args = ap.parse_args()

    manifest = write_manifest() if args.write else json.loads(MANIFEST.read_text(encoding="utf-8"))
    problems: list[str] = []
    warnings: list[str] = []
    generation = manifest.get("generation", {})
    if generation.get("status") == "legacy_unknown":
        warnings.append("model/version/seed are unknown for legacy generated assets; regeneration is not reproducible")
        if args.strict_provenance:
            problems.append("strict provenance requested but generation.status is legacy_unknown")

    for item in manifest["assets"]:
        for role in ["prompt", "raw", "canonical"]:
            rec = item.get(role)
            if not rec:
                continue
            actual = file_record(rec["path"])
            if actual["sha256"] != rec["sha256"] or actual["bytes"] != rec["bytes"]:
                problems.append(f"{item['id']} {role}: {rec['path']} hash/bytes mismatch")
            if role == "canonical":
                if not actual.get("alpha_hard"):
                    problems.append(f"{item['id']} canonical alpha is not hard-edged")
                if not actual.get("bbox"):
                    problems.append(f"{item['id']} canonical has no opaque pixels")
                if any(a != 0 for a in actual.get("corner_alpha", [])):
                    problems.append(f"{item['id']} canonical corners are not transparent")
        raw_rec = item.get("raw")
        if raw_rec and raw_rec.get("green_corners") and not green_corners(ROOT / raw_rec["path"]):
            problems.append(f"{item['id']} raw green-screen corners changed")
        canonical_hash = item["canonical"]["sha256"]
        for copy in item.get("copies", []):
            actual = file_record(copy["path"])
            if actual["sha256"] != canonical_hash:
                problems.append(f"{item['id']} copy {copy['path']} differs from canonical")
            if actual["sha256"] != copy["sha256"]:
                problems.append(f"{item['id']} copy {copy['path']} hash mismatch")

    report = {
        "status": "ok" if not problems else "fail",
        "assets": len(manifest["assets"]),
        "copiesChecked": sum(len(a.get("copies", [])) for a in manifest["assets"]),
        "provenanceStatus": generation.get("status"),
        "warnings": warnings,
        "problems": problems,
    }
    report_path = Path(args.report)
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if problems:
        print("GENERATED_ASSET_FAIL\n  - " + "\n  - ".join(problems), file=sys.stderr)
        return 1
    print(f"GENERATED_ASSET_OK {report['assets']} assets · {report['copiesChecked']} copies · report {report_path.relative_to(ROOT)}")
    for warning in warnings:
        print(f"WARNING {warning}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
