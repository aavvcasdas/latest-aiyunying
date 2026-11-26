"""小范围分镜契约；只支持无声、无歌词对齐声明的技术样片。"""
import math

from .rig import ACTIONS


def validate(storyboard: dict, beats_data: dict, character_ids) -> list[tuple[float, float, dict]]:
    beats = beats_data.get("beats", [])
    if len(beats) < 2 or any(not isinstance(t, (int, float)) or not math.isfinite(t) or t < 0 for t in beats):
        raise ValueError("拍点须为至少两个有限非负数")
    if beats[0] != 0 or any(b <= a for a, b in zip(beats, beats[1:])):
        raise ValueError("样片拍点须从零开始且严格递增")
    shots = storyboard.get("shots", [])
    if not shots:
        raise ValueError("分镜不能为空")
    ranges, cursor, ids = [], 0, set()
    for shot in shots:
        ident = shot["id"]
        if ident in ids:
            raise ValueError("镜头 id 重复")
        ids.add(ident)
        start, count = shot["start_beat"], shot["beats"]
        if type(start) is not int or type(count) is not int or start != cursor or count <= 0 or start + count >= len(beats):
            raise ValueError("镜头须连续、不重叠，且有明确结束拍点")
        for actor in shot.get("cast", []):
            if actor["id"] not in character_ids:
                raise ValueError(f"缺角色: {actor['id']}")
            if actor.get("action", "idle") not in ACTIONS:
                raise ValueError("动作未实现")
            x = actor.get("x", 0.5)
            if not isinstance(x, (int, float)) or not math.isfinite(x) or not 0 <= x <= 1:
                raise ValueError("x 须为 0..1")
        if shot.get("lyric") or shot.get("props") or shot.get("camera"):
            raise ValueError("样片尚未支持歌词对齐、道具接触或运镜，不可静默忽略")
        ranges.append((beats[start], beats[start + count], shot))
        cursor += count
    return ranges
