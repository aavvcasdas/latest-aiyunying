"""完整像素贴图的确定性动作兜底；不是自动拆骨或 Live2D。"""
from __future__ import annotations

import bisect
import math
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from PIL import Image

ACTIONS = {"idle", "step", "hop", "sway"}


@dataclass(frozen=True)
class Pose:
    dx: float = 0.0
    lift: float = 0.0
    sx: float = 1.0
    sy: float = 1.0


def beat_phase(t: float, beats: list[float]) -> tuple[float, float]:
    if not beats or t < beats[0]:
        return 0.0, 0.0
    i = bisect.bisect_right(beats, t) - 1
    dt = t - beats[i]
    return dt, math.exp(-dt * 12)


def pose_for(action: str, t: float, beats: list[float]) -> Pose:
    """t 与 beats 都是全片秒数。跳跃以相邻拍点为边界，起落连续。"""
    if action not in ACTIONS:
        raise ValueError(f"不支持的动作（单层图没有独立手臂）: {action}")
    i = bisect.bisect_right(beats, t) - 1
    if i < 0 or i >= len(beats) - 1:
        return Pose()
    u = (t - beats[i]) / (beats[i + 1] - beats[i])
    if action == "step":
        sy = 1 - 0.045 * math.exp(-u * 10)
        return Pose(sx=1 / sy, sy=sy)
    if action == "hop":
        return Pose(lift=0.12 * 4 * u * (1 - u))
    if action == "sway":
        return Pose(dx=0.035 * math.sin((i + u) * math.pi))
    return Pose()


def split_bands(im: Image.Image, head_frac=0.28, leg_frac=0.62) -> dict:
    """仅导出水平裁片及原坐标；不能视为解剖分件，也不用于当前动画。"""
    if not 0 < head_frac < leg_frac < 1:
        raise ValueError("裁切比例须满足 0 < head < leg < 1")
    w, h = im.size
    bounds = [0, int(h * head_frac), int(h * leg_frac), h]
    return {k: {"image": im.crop((0, a, w, b)), "xy": [0, a]}
            for k, a, b in zip(("head", "torso", "legs"), bounds, bounds[1:])}


def make_character(path: str | Path) -> Image.Image:
    with Image.open(path) as src:
        im = src.convert("RGBA")
    bbox = im.getbbox()
    if not bbox:
        raise ValueError(f"空角色: {path}")
    return im.crop(bbox)


def render_character(im: Image.Image, pose: Pose, canvas_size: tuple[int, int],
                     foot: tuple[float, float], height_px: int) -> Image.Image:
    """整图同一变换，脚底锚定；禁止用横带错位伪装关节动作。"""
    h = max(1, round(height_px * pose.sy))
    w = max(1, round(im.width / im.height * height_px * pose.sx))
    scaled = im.resize((w, h), Image.Resampling.NEAREST)
    x = round(foot[0] - w / 2 + pose.dx * height_px)
    y = round(foot[1] - pose.lift * height_px - h)
    if x < 0 or y < 0 or x + w > canvas_size[0] or y + h > canvas_size[1]:
        raise ValueError("角色越出画框；请调整机位、身高或站位")
    layer = Image.new("RGBA", canvas_size)
    layer.alpha_composite(scaled, (x, y))
    return layer


def paper_texture(size: tuple[int, int], seed=7) -> Image.Image:
    rng = np.random.default_rng(seed)
    w, h = size
    noise = rng.normal(0, 1.2, (h, w, 1))
    base = np.array([250, 247, 240]).reshape(1, 1, 3)
    return Image.fromarray(np.clip(base + noise, 0, 255).astype("uint8")).convert("RGBA")
