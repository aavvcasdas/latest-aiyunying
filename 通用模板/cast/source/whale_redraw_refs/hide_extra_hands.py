#!/usr/bin/env python3
"""本鲸「挥手 / 递出去」基础稿：只留做手势的那一只手。

用户反馈 `act_whale_point_5` / `act_whale_wave_0` 看起来「3 只手」。
根因不是某一帧被贴了手，而是基础稿本来就有三只手：做手势的那只，
加上髋部左右两只（旧正面稿里「搭在裙边」的袖子手）。缩到 77×88 之后
髋部那两只只剩几像素，正好成了显眼的「第三只手」。

这个脚本不改任何一帧、也不往图上「贴」手：
  * 先缩到图集真正使用的尺寸（默认 308×352，与 whale_point_clean.png 一致）；
  * 找出除「脸」和「做手势的手」以外的所有肤色小块（含袖口白边）；
  * 在缩小后的尺寸上，把每块用最近的布料色（头发蓝 / 深藏青）整块补平。
在这个尺寸下每块只有十几像素，补出来就是干净的布料，没有糊影。
"""
from __future__ import annotations

import argparse
from collections import deque

import numpy as np
from PIL import Image


def skin_mask(a: np.ndarray) -> np.ndarray:
    rgb = a[..., :3].astype(int)
    al = a[..., 3]
    return (
        (al > 0)
        & (rgb[..., 0] >= 205)
        & (rgb[..., 1] >= 165)
        & (rgb[..., 2] >= 130)
        & ((rgb[..., 0] - rgb[..., 1]) >= 10)
        & ((rgb[..., 1] - rgb[..., 2]) >= 0)
        & ((rgb[..., 1] - rgb[..., 2]) <= 60)
    )


def components(mask: np.ndarray, min_area: int) -> list[list[tuple[int, int]]]:
    H, W = mask.shape
    seen = np.zeros_like(mask)
    out: list[list[tuple[int, int]]] = []
    for y in range(H):
        for x in range(W):
            if not mask[y, x] or seen[y, x]:
                continue
            q = deque([(y, x)])
            seen[y, x] = True
            pts: list[tuple[int, int]] = []
            while q:
                cy, cx = q.popleft()
                pts.append((cy, cx))
                for dy in (-1, 0, 1):
                    for dx in (-1, 0, 1):
                        ny, nx = cy + dy, cx + dx
                        if 0 <= ny < H and 0 <= nx < W and mask[ny, nx] and not seen[ny, nx]:
                            seen[ny, nx] = True
                            q.append((ny, nx))
            if len(pts) >= min_area:
                out.append(pts)
    return out


def bbox(pts):
    ys = [p[0] for p in pts]
    xs = [p[1] for p in pts]
    return min(xs), min(ys), max(xs), max(ys)


def run(src: str, dst: str, size: tuple[int, int] | None) -> None:
    im = Image.open(src).convert('RGBA')
    if size:
        im = im.resize(size, Image.Resampling.LANCZOS)
        a = np.array(im)
        a[..., 3] = np.where(a[..., 3] >= 128, 255, 0).astype(np.uint8)
        im = Image.fromarray(a)
    a = np.array(im)
    H, W = a.shape[:2]
    mask = skin_mask(a)
    comps = components(mask, 4)
    if not comps:
        raise SystemExit(f'{src}: no skin components found')

    face = max(comps, key=lambda p: (bbox(p)[2] - bbox(p)[0]) * (bbox(p)[3] - bbox(p)[1]))
    fw = bbox(face)[2] - bbox(face)[0]

    gesture = None
    for pts in comps:
        if pts is face:
            continue
        x0, y0, x1, y1 = bbox(pts)
        cx, cy = (x0 + x1) / 2 / W, (y0 + y1) / 2 / H
        if cx > 0.60 and cy < 0.62 and (x1 - x0) < fw * 0.9 and len(pts) >= max(20, len(face) * 0.03):
            gesture = pts
            break

    rgb_i = a[..., :3].astype(int)
    erase = np.zeros((H, W), bool)
    for pts in comps:
        if pts is face or pts is gesture:
            continue
        x0, y0, x1, y1 = bbox(pts)
        if (y0 + y1) / 2 / H > 0.87:
            continue  # 脚背皮肤
        for (y, x) in pts:
            erase[y, x] = True
        # 手正上方的袖口白边也一起收掉，别留下「没有手的袖口」
        for (y, x) in pts:
            for dy in range(-2, 3):
                for dx in range(-2, 3):
                    ny, nx = y + dy, x + dx
                    if not (0 <= ny < H and 0 <= nx < W):
                        continue
                    r, g, b = rgb_i[ny, nx]
                    mx, mn = max(r, g, b), min(r, g, b)
                    if mx >= 200 and mx - mn <= 24:
                        erase[ny, nx] = True

    if not erase.any():
        im.save(dst)
        print(f'no extra hands in {src}')
        return

    # 布料色：洞外、非白、非暖的综合色块。
    rgb = a[..., :3]
    alpha = a[..., 3]
    mx = rgb_i.max(axis=2)
    mn = rgb_i.min(axis=2)
    fabric = (alpha > 0) & ~erase
    fabric &= ~((mx - mn <= 24) & (mx >= 195))
    fabric &= ~((rgb_i[..., 0] >= 170) & (rgb_i[..., 0] - rgb_i[..., 2] >= 10))

    # 每块填料：先用多源 BFS 从最近的布料像素取色，保证颜色与周围一致。
    dist = np.full((H, W), -1, np.int32)
    owner = np.zeros((H, W, 2), np.int32)
    q = deque()
    for y in range(H):
        for x in range(W):
            if fabric[y, x]:
                dist[y, x] = 0
                owner[y, x] = (y, x)
                q.append((y, x))
    while q:
        y, x = q.popleft()
        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < H and 0 <= nx < W and dist[ny, nx] == -1:
                dist[ny, nx] = dist[y, x] + 1
                owner[ny, nx] = owner[y, x]
                q.append((ny, nx))

    out_rgb = rgb.copy()
    out_a = alpha.copy()
    for y in range(H):
        for x in range(W):
            if not erase[y, x]:
                continue
            if alpha[y, x] == 0:
                continue  # 本来就是透明的地方保持透明
            if dist[y, x] < 0:
                continue
            oy, ox = owner[y, x]
            out_rgb[y, x] = rgb[oy, ox]
            out_a[y, x] = 255

    a[..., :3] = out_rgb
    a[..., 3] = out_a
    Image.fromarray(a).save(dst)
    print(f'hid {int(erase.sum())} px of extra hands in {src} -> {dst} ({W}x{H})')


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('src')
    ap.add_argument('dst')
    ap.add_argument('--size', default='308x352',
                    help='先缩到的尺寸（WxH），传 none 表示不缩放')
    args = ap.parse_args()
    size = None if args.size.lower() == 'none' else tuple(int(v) for v in args.size.lower().split('x'))
    run(args.src, args.dst, size)


if __name__ == '__main__':
    main()
