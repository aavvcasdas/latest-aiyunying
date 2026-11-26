"""8 秒 / 16 拍合成网格无声技术样片，无新生图、无歌词或实测对齐声明。"""
import argparse
import json
import sys
import time
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "paperdoll"))
from engine.render import Renderer, render_storyboard


def demo_data():
    atlas_dir = ROOT / "通用模板/engine/assets"
    atlas_data = json.loads((atlas_dir / "cast_atlas.json").read_text())
    x, y, w, h = atlas_data["s"]["whale_idle"]
    with Image.open(atlas_dir / "cast_atlas.png") as atlas:
        character = atlas.convert("RGBA").crop((x, y, x + w, y + h))
    beats = {"measured": False, "method": "synthetic-120-bpm", "beats": [i / 2 for i in range(17)]}
    shots = [{"id": f"S{i + 1}", "start_beat": i * 4, "beats": 4,
              "cast": [{"id": "whale", "x": 0.5, "action": action}]}
             for i, action in enumerate(("idle", "step", "hop", "sway"))]
    return {"shots": shots}, beats, {"whale": character}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=ROOT / "paperdoll/demo/无声样片.mp4")
    args = parser.parse_args()
    story, beats, characters = demo_data()
    start = time.monotonic()
    render_storyboard(story, beats, characters, args.output)
    elapsed = time.monotonic() - start
    renderer = Renderer(story, beats, characters)
    # 只保存可复查静帧，不存逐帧序列。
    renderer.frame(128).save(args.output.parent / "跳跃检查.png")
    (args.output.parent / "qa.json").write_text(json.dumps({
        "measured": False, "audio": False, "duration_seconds": renderer.duration,
        "frames": renderer.n_frames, "size": [1280, 720], "fps": 30,
        "render_and_encode_seconds": round(elapsed, 3),
        "throughput_fps": round(renderer.n_frames / elapsed, 2),
        "scope": "single-layer pixel sprite fallback only; not an old/new quality benchmark",
        "human_sign_off": False,
    }, ensure_ascii=False, indent=2) + "\n")
    print(f"完成: {args.output}; {renderer.n_frames} 帧 / {elapsed:.2f}s")


if __name__ == "__main__":
    main()
