"""Pillow -> 无损 RGB 管道 -> FFmpeg。仅无声技术样片，不是正式出片入口。"""
from __future__ import annotations

import math
import subprocess
import tempfile
from pathlib import Path

import imageio_ffmpeg
from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFont

from .rig import paper_texture, pose_for, render_character
from .storyboard import validate

W, H, FPS = 1280, 720, 30
FONT = Path(__file__).resolve().parents[2] / "通用模板/engine/assets/fonts/ZCOOLKuaiLe-Regular.ttf"


def checked_font(text: str, size=44):
    """与模板同一字体；缺字体、缺字均失败，不回退系统字体。"""
    with TTFont(FONT) as font:
        cmap = font.getBestCmap()
        missing = sorted({ch for ch in text if ord(ch) not in cmap})
    if missing:
        raise ValueError(f"模板字体缺字: {missing}")
    return ImageFont.truetype(str(FONT), size)


class Renderer:
    def __init__(self, storyboard: dict, beats_data: dict, characters: dict[str, Image.Image]):
        self.ranges = validate(storyboard, beats_data, characters)
        self.beats = beats_data["beats"]
        self.characters = characters
        self.paper = paper_texture((W, H))
        self.duration = self.ranges[-1][1]
        self.n_frames = math.ceil(self.duration * FPS)

    def frame(self, fi: int) -> Image.Image:
        if not 0 <= fi < self.n_frames:
            raise ValueError("帧号越界")
        t = fi / FPS
        shot = next(s for a, b, s in self.ranges if a <= t < b)
        frame = self.paper.copy()
        d = ImageDraw.Draw(frame)
        d.line([(100, 595), (W - 100, 595)], fill=(90, 80, 75), width=2)
        for actor in shot.get("cast", []):
            pose = pose_for(actor.get("action", "idle"), t, self.beats)
            layer = render_character(self.characters[actor["id"]], pose, (W, H),
                                     (W * actor.get("x", 0.5), 590), 300)
            frame.alpha_composite(layer)
        return frame.convert("RGB")


def render_storyboard(storyboard: dict, beats_data: dict, characters: dict,
                      output: str | Path, audio=None) -> Path:
    output = Path(output)
    if audio is not None:
        raise ValueError("实验入口不允许带音频出片；正式 MV 继续走模板 align/full")
    if "无声样片" not in output.stem or output.suffix.lower() != ".mp4":
        raise ValueError("输出须为文件名含‘无声样片’的 MP4")
    renderer = Renderer(storyboard, beats_data, characters)
    output.parent.mkdir(parents=True, exist_ok=True)
    # 临时视频与 RGB 管道都不进 Git；编码失败不留伪成品。
    with tempfile.TemporaryDirectory() as td:
        temp = Path(td) / "silent.mp4"
        cmd = [imageio_ffmpeg.get_ffmpeg_exe(), "-v", "error", "-y",
               "-f", "rawvideo", "-pixel_format", "rgb24", "-video_size", f"{W}x{H}",
               "-framerate", str(FPS), "-i", "pipe:0", "-an", "-c:v", "libx264",
               "-preset", "fast", "-crf", "16", "-pix_fmt", "yuv420p",
               "-movflags", "+faststart", str(temp)]
        with tempfile.TemporaryFile() as err:
            p = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=err)
            try:
                for fi in range(renderer.n_frames):
                    p.stdin.write(renderer.frame(fi).tobytes())
                p.stdin.close()
                if p.wait() != 0:
                    err.seek(0)
                    raise RuntimeError(err.read().decode(errors="replace"))
                output.write_bytes(temp.read_bytes())
            finally:
                if p.poll() is None:
                    p.kill()
                    p.wait()
                if p.stdin and not p.stdin.closed:
                    p.stdin.close()
    return output
