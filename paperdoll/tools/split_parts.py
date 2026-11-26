"""仅水平裁片+坐标清单；不抠像、不识别关节、不补画遮挡。"""
import argparse
import json
import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from engine.rig import split_bands


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    with Image.open(args.source) as im:
        parts = split_bands(im.convert("RGBA"))
        size = list(im.size)
    args.output.mkdir(parents=True, exist_ok=True)
    manifest = {"source_size": size, "mode": "horizontal-crops-not-anatomical", "parts": {}}
    for name, part in parts.items():
        part["image"].save(args.output / f"{name}.png")
        manifest["parts"][name] = {"file": f"{name}.png", "xy": part["xy"]}
    (args.output / "parts.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print("仅裁片完成；按 xy 可无损拼回，不能视为已绑骨")


if __name__ == "__main__":
    main()
