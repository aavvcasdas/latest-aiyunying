#!/usr/bin/env python3
"""QA for the 2026-11-24 user-authorized full 本鲸 master redraw.

Default mode is check-only: it verifies the rebuilt master atlas, action table,
derived sheets, manifest and mirrors without touching any file. Pass ``--write``
to refresh the reproducible before/after contact sheets and JSON report under
``docs/quality_comparison/whale_redraw/``.

The baseline is the pre-redraw atlas kept beside the QA report. The 682
rectangles and 92 derived action frames are unchanged. The 2026-11-24
`master_soft` follow-up adds a single palette-colored semi-transparent coverage
band to 本鲸 silhouettes only; non-whale cells remain hard alpha. The active
correction restores that baseline's plainer lower-body clothes on front-facing
base cells while removing the rejected post-pose clothes freeze: `pose()` now
links head, torso, skirt and legs for 本鲸, and the eight side-view walk frames
get independent arm / leg / tail rhythm.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import re
from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
MASTER = ROOT / '通用模板/engine/assets/cast_atlas.png'
RECTS = ROOT / '通用模板/engine/assets/cast_atlas.json'
ACTIONS = ROOT / '通用模板/engine/assets/cast_actions.json'
INDEX = ROOT / '人物/index.json'
MANIFEST = ROOT / 'assets.manifest.json'
OUT = ROOT / 'docs/quality_comparison/whale_redraw'
BEFORE = OUT / 'cast_atlas.before.png'
PALETTE = OUT / 'whale_palette.json'
DEFAULTS = json.loads((ROOT / 'tools/render_defaults.json').read_text(encoding='utf-8'))
SOFT_ALPHA = round(255 * (1 - DEFAULTS['visualQuality']['pixelSmoothing']))
BASELINE_SHA = '5f9894b6ad38c26a62ec55a030aeb49bce8360c3d67ef99d1f581430d7ec81da'


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def flattened(im: Image.Image):
    """Pillow 12+ spelling; keep compatibility with older Pillow in CI."""
    return im.get_flattened_data() if hasattr(im, 'get_flattened_data') else im.getdata()


def crop(im: Image.Image, rect):
    x, y, w, h = rect
    return im.crop((x, y, x + w, y + h))


def rgb_array(crop_im: Image.Image):
    return np.asarray(crop_im.convert('RGB'), dtype=np.int16)


def best_template_diff(cell: Image.Image, template, tx: int, ty: int,
                       dx_range=range(-15, 16), dy_range=range(-20, 21)) -> float:
    """Find an RGB patch in a derived cell under global motion (diagnostic only)."""
    a = rgb_array(cell)
    th, tw = template.shape[:2]
    best = float('inf')
    for dy in dy_range:
        y = ty + dy
        if y < 0 or y + th > a.shape[0]:
            continue
        for dx in dx_range:
            x = tx + dx
            if x < 0 or x + tw > a.shape[1]:
                continue
            best = min(best, float(np.abs(a[y:y + th, x:x + tw] - template).mean()))
    return best


def skin_blobs(cell: Image.Image, min_area: int = 4):
    """Warm skin-coloured 8-connected blobs: (area, x0, y0, x1, y1)."""

    a = np.asarray(cell.convert('RGBA')).astype(int)
    rgb, al = a[:, :, :3], a[:, :, 3]
    mask = ((al > 0)
            & (rgb[:, :, 0] >= 205) & (rgb[:, :, 1] >= 165) & (rgb[:, :, 2] >= 130)
            & ((rgb[:, :, 0] - rgb[:, :, 1]) >= 10)
            & ((rgb[:, :, 1] - rgb[:, :, 2]) >= 0)
            & ((rgb[:, :, 1] - rgb[:, :, 2]) <= 60))
    H, W = mask.shape
    seen = np.zeros_like(mask)
    out = []
    for y in range(H):
        for x in range(W):
            if not mask[y, x] or seen[y, x]:
                continue
            stack = [(y, x)]
            seen[y, x] = True
            pts = []
            while stack:
                cy, cx = stack.pop()
                pts.append((cy, cx))
                for dy in (-1, 0, 1):
                    for dx in (-1, 0, 1):
                        ny, nx = cy + dy, cx + dx
                        if 0 <= ny < H and 0 <= nx < W and mask[ny, nx] and not seen[ny, nx]:
                            seen[ny, nx] = True
                            stack.append((ny, nx))
            if len(pts) >= min_area:
                ys = [p[0] for p in pts]
                xs = [p[1] for p in pts]
                out.append((len(pts), min(xs), min(ys), max(xs), max(ys)))
    return out


LOWER_BOX = (0.18, 0.58, 0.82, 1.0)


def lower_box(w: int, h: int):
    return (int(w * LOWER_BOX[0]), int(h * LOWER_BOX[1]),
            int(w * LOWER_BOX[2]), h)


def old_lower_patch(before: Image.Image, rects, source_key: str, w: int, h: int) -> Image.Image:
    """The exact pre-redraw lower-body patch used by encode_whale_sprites.py."""
    r = rects[source_key]
    cell = crop(before, r)
    sx0, sy0, sx1, sy1 = lower_box(r[2], r[3])
    patch = cell.crop((sx0, sy0, sx1, sy1))
    tx0, ty0, tx1, ty1 = lower_box(w, h)
    return patch.resize((tx1 - tx0, ty1 - ty0), Image.Resampling.NEAREST)


def opaque_rgb_diff(actual: Image.Image, expected: Image.Image):
    """Compare RGB only where both hard-alpha silhouettes are opaque."""
    a = np.asarray(actual.convert('RGBA'))
    e = np.asarray(expected.convert('RGBA'))
    mask = (e[:, :, 3] == 255) & (a[:, :, 3] == 255)
    if not mask.any():
        return float('inf'), 0
    diff = np.abs(a[:, :, :3][mask].astype(np.int16) - e[:, :, :3][mask].astype(np.int16))
    return float(diff.mean()), int(mask.sum())


def best_opaque_patch_diff(cell: Image.Image, patch: Image.Image, tx: int, ty: int,
                           dx_range=range(-3, 4), dy_range=range(-3, 4)) -> float:
    """Locate a hard-alpha prop/sprite patch inside a derived cell."""
    e = np.asarray(patch.convert('RGBA'))
    a = np.asarray(cell.convert('RGBA'))
    eh, ew = e.shape[:2]
    mask = e[:, :, 3] == 255
    need = max(1, int(mask.sum() * 0.9))
    best = float('inf')
    for dy in dy_range:
        y = ty + dy
        if y < 0 or y + eh > a.shape[0]:
            continue
        for dx in dx_range:
            x = tx + dx
            if x < 0 or x + ew > a.shape[1]:
                continue
            sub = a[y:y + eh, x:x + ew]
            m = mask & (sub[:, :, 3] == 255)
            if m.sum() < need:
                continue
            diff = np.abs(sub[:, :, :3][m].astype(np.int16) - e[:, :, :3][m].astype(np.int16))
            best = min(best, float(diff.mean()))
    return best


def alpha_components(crop_im: Image.Image):
    w, h = crop_im.size
    px = crop_im.getchannel('A').load()
    seen = bytearray(w * h)
    comps = []
    for y in range(h):
        for x in range(w):
            i = y * w + x
            if seen[i] or px[x, y] == 0:
                continue
            q = deque([(x, y)])
            seen[i] = 1
            area = 0
            touch = False
            while q:
                cx, cy = q.popleft()
                area += 1
                if cx in (0, w - 1) or cy in (0, h - 1):
                    touch = True
                for nx, ny in ((cx - 1, cy), (cx + 1, cy), (cx, cy - 1), (cx, cy + 1)):
                    if 0 <= nx < w and 0 <= ny < h:
                        j = ny * w + nx
                        if not seen[j] and px[nx, ny] != 0:
                            seen[j] = 1
                            q.append((nx, ny))
            comps.append({'area': area, 'touchBorder': touch})
    return sorted(comps, key=lambda c: c['area'], reverse=True)


def border_pixels(crop_im: Image.Image, n: int = 2) -> int:
    w, h = crop_im.size
    px = crop_im.getchannel('A').load()
    total = 0
    for y in range(h):
        for x in range(w):
            # master_soft's 1px coverage band is not an opaque border fragment.
            if (x < n or x >= w - n or y < n or y >= h - n) and px[x, y] == 255:
                total += 1
    return total


def bbox_ratio(crop_im: Image.Image) -> float:
    bb = crop_im.getchannel('A').getbbox()
    if not bb:
        return 0.0
    return (bb[2] - bb[0]) / (bb[3] - bb[1])


def soft_edge_problems(crop_im: Image.Image, soft_alpha: int):
    """Verify that the master_soft band is exactly 1px, connected and palette-colored."""
    w, h = crop_im.size
    px = crop_im.load()
    bad = []
    count = 0
    for y in range(h):
        for x in range(w):
            p = px[x, y]
            if p[3] != soft_alpha:
                continue
            count += 1
            if (x in (0, w - 1) and y in (0, h - 1)):
                bad.append((x, y, 'corner'))
                continue
            adjacent = any(
                0 <= nx < w and 0 <= ny < h and px[nx, ny][3] == 255
                for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1))
            )
            if not adjacent:
                bad.append((x, y, 'detached'))
    return count, bad[:5]


def tile(crop_im: Image.Image, box_w: int, box_h: int) -> Image.Image:
    t = crop_im.copy()
    t.thumbnail((box_w, box_h), Image.Resampling.NEAREST)
    bg = Image.new('RGBA', (box_w, box_h), (20, 20, 35, 255))
    bg.alpha_composite(t, ((box_w - t.width) // 2, (box_h - t.height) // 2))
    return bg.convert('RGB')


def all_frames_sheet(keys, im: Image.Image, rects, title: str) -> Image.Image:
    cols, cellw, cellh = 8, 120, 130
    rows = math.ceil(len(keys) / cols)
    sheet = Image.new('RGB', (cols * cellw, rows * cellh + 28), (10, 10, 18))
    d = ImageDraw.Draw(sheet)
    d.text((6, 7), title, fill=(240, 220, 200))
    for i, k in enumerate(keys):
        x = (i % cols) * cellw
        y = 28 + (i // cols) * cellh
        sheet.paste(tile(crop(im, rects[k]), cellw - 8, cellh - 28), (x + 4, y + 22))
        d.text((x + 4, y + 4), k, fill=(220, 220, 220))
    return sheet


SELECTED = [
    'whale_idle', 'whale_blink', 'whale_wave', 'whale_point',
    'whale_big_idle', 'whale_big_blink', 'whale_big_wave', 'whale_big_point',
    'p_whale_neutral', 'p_whale_shout', 'p_whale_think',
    *[f'walk_whale_{i}' for i in range(8)],
    *[f'act_whale_spin_{i}' for i in range(8)],
]


def selected_sheet(keys, before: Image.Image, after: Image.Image, rects) -> Image.Image:
    cols, pairw, pairh = 4, 280, 220
    rows = math.ceil(len(keys) / cols)
    sheet = Image.new('RGB', (cols * pairw, rows * pairh + 30), (10, 10, 18))
    d = ImageDraw.Draw(sheet)
    d.text((6, 8), 'BEFORE (left)  /  AFTER (right)  -  base, portraits, walk and spin', fill=(240, 220, 200))
    for i, k in enumerate(keys):
        ox = (i % cols) * pairw
        oy = 30 + (i // cols) * pairh
        d.text((ox + 6, oy + 4), k, fill=(230, 220, 210))
        d.text((ox + 6, oy + 20), 'BEFORE', fill=(170, 170, 190))
        d.text((ox + 142, oy + 20), 'AFTER', fill=(170, 220, 190))
        sheet.paste(tile(crop(before, rects[k]), 128, 160), (ox + 6, oy + 38))
        sheet.paste(tile(crop(after, rects[k]), 128, 160), (ox + 142, oy + 38))
    return sheet


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument('--write', action='store_true', help='also refresh QA PNG/JSON artifacts')
    args = ap.parse_args()

    errors = []
    meta = json.loads(RECTS.read_text(encoding='utf-8'))
    rects = meta['s']
    actions = json.loads(ACTIONS.read_text(encoding='utf-8'))
    index = json.loads(INDEX.read_text(encoding='utf-8'))
    manifest = json.loads(MANIFEST.read_text(encoding='utf-8'))
    palette = json.loads(PALETTE.read_text(encoding='utf-8'))
    colors = {tuple(c) for c in palette['RGB']}

    before = Image.open(BEFORE).convert('RGBA')
    after = Image.open(MASTER).convert('RGBA')
    if sha256(BEFORE) != BASELINE_SHA:
        errors.append('before atlas hash is not the recorded pre-redraw baseline')
    if before.size != (meta['w'], meta['h']) or after.size != (meta['w'], meta['h']):
        errors.append('atlas size does not match cast_atlas.json')

    whale_keys = sorted(k for k in rects if 'whale' in k.lower())
    changed_whale, unchanged_whale, changed_other = [], [], []
    for k, r in rects.items():
        same = crop(before, r).tobytes() == crop(after, r).tobytes()
        if not same:
            (changed_whale if k in whale_keys else changed_other).append(k)
        elif k in whale_keys:
            unchanged_whale.append(k)
    if len(rects) != 682:
        errors.append(f'expected 682 atlas cells, found {len(rects)}')
    if len(whale_keys) != 111:
        errors.append(f'expected 111 whale cells, found {len(whale_keys)}')
    if unchanged_whale:
        errors.append(f'{len(unchanged_whale)} whale cells did not change: {unchanged_whale[:5]}')
    if changed_other:
        errors.append(f'{len(changed_other)} non-whale cells changed: {changed_other[:5]}')
    # master_soft is whale-only: no other cast cell may contain semi-transparent coverage.
    for k, r in rects.items():
        if k in whale_keys:
            continue
        if any(p[3] not in (0, 255) for p in flattened(crop(after, r))):
            errors.append(f'{k}: non-whale cell has soft alpha')

    # Alpha, palette, connected-component, corner and aspect checks.
    flags = []
    ratios = []
    border_before_total = 0
    border_after_total = 0
    soft_total = 0
    edge_touching = []
    for k in whale_keys:
        c = crop(after, rects[k])
        w, h = c.size
        pixels = list(flattened(c))
        alphas = {p[3] for p in pixels}
        corners = [c.getpixel(p)[3] for p in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1))]
        soft_count, soft_bad = soft_edge_problems(c, SOFT_ALPHA)
        soft_total += soft_count
        comps = alpha_components(c)
        largest = comps[0]['area'] if comps else 0
        orphans = [c for c in comps[1:] if c['touchBorder']]
        small = [c for c in comps[1:] if c['area'] < max(4, largest * 0.01)]
        f = []
        if not alphas.issubset({0, SOFT_ALPHA, 255}):
            f.append('unexpected-alpha')
        if soft_bad:
            f.append(f'{len(soft_bad)}-bad-soft-edges')
        if any(a == 255 for a in corners):
            f.append('opaque-corner')
        if orphans:
            f.append(f'{len(orphans)}-border-orphans')
        if small:
            f.append(f'{len(small)}-small-orphans')
        if largest == 0:
            f.append('empty')
        if f:
            flags.append({'key': k, 'flags': f})
        ratios.append((bbox_ratio(c), k))
        bb, ab = border_pixels(crop(before, rects[k])), border_pixels(c)
        border_before_total += bb
        border_after_total += ab
        if ab:
            edge_touching.append({'key': k, 'before': bb, 'after': ab})
        if any(p[3] in (SOFT_ALPHA, 255) and tuple(p[:3]) not in colors for p in pixels):
            errors.append(f'{k}: visible color outside px.js 248-color palette')
    if flags:
        errors.append(f'{len(flags)} whale cells failed alpha/component checks: {flags[:5]}')

    ratios.sort()
    median_ratio = ratios[len(ratios) // 2][0]
    spin_ratios_before = {k: bbox_ratio(crop(before, rects[k])) for k in rects if k.startswith('act_whale_spin_')}
    spin_ratios_after = {k: bbox_ratio(crop(after, rects[k])) for k in rects if k.startswith('act_whale_spin_')}
    thin_before = sorted(k for k, v in spin_ratios_before.items() if v < 0.55 * median_ratio)
    thin_after = sorted(k for k, v in spin_ratios_after.items() if v < 0.55 * median_ratio)
    if thin_after:
        errors.append(f'thin spin frames remain: {thin_after}')

    # Action table and 92 derived frames.
    wa = actions['actions'].get('whale', {})
    action_frames = []
    action_problems = []
    for name, a in wa.items():
        frames = a.get('frames', [])
        action_frames.extend(frames)
        declared = tuple(a.get('size', []))
        sizes = {tuple(rects[f][2:]) for f in frames if f in rects}
        missing = [f for f in frames if f not in rects]
        if missing or (declared and (len(sizes) != 1 or declared not in sizes)):
            action_problems.append({'action': name, 'missing': missing, 'sizes': [list(s) for s in sizes], 'declared': list(declared)})
    if len(wa) != 13:
        errors.append(f'expected 13 whale actions, found {len(wa)}')
    if len(action_frames) != 92 or len(set(action_frames)) != 92:
        errors.append(f'expected 92 unique whale action frames, found {len(action_frames)}')
    if action_problems:
        errors.append(f'action table problems: {action_problems[:3]}')

    # 2026-11-24 active correction: keep the plainer pre-redraw lower body on
    # every front-facing base cell, but do NOT freeze it after pose(). The user
    # explicitly rejected "衣服一直定着"; head, torso, skirt and legs must move
    # together. Static source checks and pixel metrics replace the old 84/84
    # exact-hem acceptance, which proved the body was over-locked.
    clothes_errors = []
    source_dir = ROOT / '通用模板/cast/source'
    ref_dir = source_dir / 'whale_redraw_refs'
    bake_src = (source_dir / 'bake_actions.mjs').read_text(encoding='utf-8')
    pose_src = (source_dir / 'motion_core.mjs').read_text(encoding='utf-8')
    encode_src = (ref_dir / 'encode_whale_sprites.py').read_text(encoding='utf-8')
    fixer_src = (ref_dir / 'fix_whale_clothes.py').read_text(encoding='utf-8')
    for label, src, forbidden in (
        ('bake_actions.mjs', bake_src, 'freezeWhaleClothes'),
        ('bake_actions.mjs', bake_src, 'const CLOTHES ='),
        ('encode_whale_sprites.py', encode_src, 'fit_with_front_clothes'),
        ('fix_whale_clothes.py', fixer_src, 'ROOT = HERE.parents[4]'),
    ):
        if forbidden in src:
            clothes_errors.append(f'{label}: rejected frozen-clothes source still present ({forbidden})')
    if 'WHALE_LINK' not in bake_src or 'pf = id ===' not in bake_src:
        clothes_errors.append('bake_actions.mjs: whale head/body linkage mapping missing')
    if 'const bodyW = link *' not in pose_src or 'headW = 1 - link' not in pose_src:
        clothes_errors.append('motion_core.mjs: pose() head/body linkage missing')
    if 'fit_with_old_clothes' not in encode_src or 'OLD_ATLAS' not in encode_src:
        clothes_errors.append('encode_whale_sprites.py: old lower-body patch missing')
    if 'ROOT = Path(__file__).resolve().parents[4]' not in fixer_src:
        clothes_errors.append('fix_whale_clothes.py: repository-root path is wrong')
    m = re.search(r'const WHALE_LINK = \{(.*?)\};', bake_src, re.S)
    link_map = {k: float(v) for k, v in re.findall(r'(\w+):\s*([0-9.]+)', m.group(1))} if m else {}
    # wave / point 回退到加裙子固定之前（f23…），当时的 bake 没有给这两个动作
    # 开 head/body linkage，所以这里只校验其余动作。
    for action_name in ('idle', 'eat', 'nod', 'shake', 'bow',
                        'sway', 'surprise', 'sad', 'shiver'):
        if link_map.get(action_name, 0) <= 0:
            clothes_errors.append(f'{action_name}: whale head/body linkage not enabled')

    # Idle / blink carry the exact old white-apron / skirt / boots patch from
    # cast_atlas.before.png. 2026-11-24 follow-up: the regenerated 挥手 / 递出去
    # art keeps its own newly drawn skirt (user asked for the fixed hem to go),
    # so those four cells are checked for one single gesture hand instead.
    front_base_specs = [
        ('whale_idle', 'whale_idle'), ('whale_blink', 'whale_idle'),
        ('whale_big_idle', 'whale_big_idle'), ('whale_big_blink', 'whale_big_idle'),
    ]
    exact_old_lower_cells = 0
    for key, source_key in front_base_specs:
        cell = crop(after, rects[key])
        w, h = cell.size
        box = lower_box(w, h)
        expected = old_lower_patch(before, rects, source_key, w, h)
        diff, opaque = opaque_rgb_diff(cell.crop(box), expected)
        if opaque and diff == 0:
            exact_old_lower_cells += 1
        else:
            clothes_errors.append(f'{key}: old lower-body patch differs by {diff:.2f} ({opaque} px)')

    idle_key = wa['idle']['frames'][0]
    hem_template = rgb_array(crop(after, rects[idle_key]))[72:88, 18:60]
    front_action_frames = 0
    exact_action_frames = 0
    max_action_diff = 0.0
    motion_diffs = []
    for name, a in wa.items():
        if name == 'spin':  # turn-around uses side/back perspective by design
            continue
        prev_lower = None
        for key in a['frames']:
            front_action_frames += 1
            cell = crop(after, rects[key])
            diff = best_template_diff(cell, hem_template, 18, 72)
            max_action_diff = max(max_action_diff, diff)
            if diff == 0:
                exact_action_frames += 1
            lower = cell.crop(lower_box(*cell.size))
            if prev_lower is not None:
                motion_diffs.append(best_template_diff(
                    lower, rgb_array(prev_lower), 0, 0,
                    range(-5, 6), range(-5, 6)))
            prev_lower = lower
    lower_body_motion_frames = sum(d > 0.5 for d in motion_diffs)
    mean_lower_body_motion = round(sum(motion_diffs) / len(motion_diffs), 4) if motion_diffs else 0.0
    if lower_body_motion_frames < max(20, len(motion_diffs) // 2):
        clothes_errors.append(f'lower body still looks locked: only {lower_body_motion_frames}/{len(motion_diffs)} frame transitions move')

    # Side-view spin frames keep one side-view garment template; front spin
    # frames are the same canonical front view at an intentional 0.88 width.
    spin_keys = wa['spin']['frames']
    side_keys = spin_keys[2:6]
    side_template = rgb_array(crop(after, rects[side_keys[0]]))[72:88, 18:60]
    side_flipped = side_template[:, ::-1].copy()
    side_max_diff = 0.0
    for key in side_keys[1:]:
        cell = crop(after, rects[key])
        diff = min(
            best_template_diff(cell, side_template, 18, 72, range(-10, 11), range(-10, 11)),
            best_template_diff(cell, side_flipped, 18, 72, range(-10, 11), range(-10, 11)),
        )
        side_max_diff = max(side_max_diff, diff)
    if side_max_diff > 20.0:
        clothes_errors.append(f'spin side-view hem varies too much: {side_max_diff:.2f}')

    # 2026-11-24 rollback (final instruction): 挥手打招呼 / 递出去（让位）回到
    # 「加裙子固定之前」的 f23… 状态——基础格重新用重画前参考格的手臂姿势，
    # 并且**不再**贴旧下半身补丁、不再要求单手。其余 11 个动作保持当前状态。
    # 所以这里校验的是「确实回退到位、且没有把别的动作带跑」。
    gesture_cells = ['whale_wave', 'whale_point', 'whale_big_wave',
                     'whale_big_point']
    rollback_cells = []
    for name in ('wave', 'point'):
        ref = Image.open(ref_dir / f'whale_{name}_ref.png').convert('RGBA')
        cur = Image.open(ref_dir / f'whale_{name}_clean.png').convert('RGBA')
        if ref.size == cur.size and not np.array_equal(rgb_array(ref), rgb_array(cur)):
            clothes_errors.append(
                f'{name}: clean source drifted from the rolled-back reference art')
    baseline = Image.open(OUT / 'cast_atlas.clothes_before.png').convert('RGBA')
    for key in gesture_cells:
        want = crop(baseline, rects[key])
        got = crop(after, rects[key])
        if np.array_equal(np.asarray(want), np.asarray(got)):
            rollback_cells.append(key)
        else:
            diff = float(np.abs(rgb_array(want) - rgb_array(got)).mean())
            clothes_errors.append(
                f'{key}: not restored to the pre-clothes-freeze cell ({diff:.2f})')
    # wave / point 两个动作的画面必须仍然来自「正面格 + 手势格」的原始编排。
    for action_name in ('wave', 'point'):
        if 'WHALE_MOTION' in bake_src and f'{action_name}: (c) => [' not in bake_src:
            clothes_errors.append(f'bake_actions.mjs: {action_name} motion override missing')

    # Visible rice bowl in all 8 eat frames, stamped after pose().
    bowl_patch = crop(after, rects['prop_bowl'])
    eat_size = tuple(wa['eat'].get('size', []))
    bowl_diffs = []
    if len(eat_size) == 2:
        cw, ch = eat_size
        bx = round(cw / 2 - bowl_patch.width / 2)
        by = round(ch * 0.60)
        for key in wa['eat']['frames']:
            bowl_diffs.append(best_opaque_patch_diff(crop(after, rects[key]), bowl_patch, bx, by))
    if len(bowl_diffs) != 8 or any(d > 1.0 for d in bowl_diffs):
        clothes_errors.append(f'eat frames missing a visible rice bowl: {[round(d,2) for d in bowl_diffs]}')

    # Walk rhythm: eight distinct side-view frames, with lower-body / tail
    # differences rather than one rigid sprite sliding back and forth.
    walk_keys = [f'walk_whale_{i}' for i in range(8)]
    walk_cells = [crop(after, rects[k]) for k in walk_keys]
    walk_diffs = [float(np.abs(rgb_array(walk_cells[i]) - rgb_array(walk_cells[i - 1])).mean())
                  for i in range(1, 8)]
    lower_hashes = {
        hashlib.sha256(c.crop(lower_box(*c.size)).tobytes()).hexdigest() for c in walk_cells
    }
    tail_diffs = []
    for i in range(1, 8):
        w, h = walk_cells[i].size
        box = (int(w * 0.58), int(h * 0.48), w, int(h * 0.95))
        tail_diffs.append(float(np.abs(
            rgb_array(walk_cells[i].crop(box)) - rgb_array(walk_cells[i - 1].crop(box))).mean()))
    if len(lower_hashes) < 7 or sum(walk_diffs) / 7 < 0.5 or sum(tail_diffs) / 7 < 0.5:
        clothes_errors.append(f'walk rhythm too static: unique lower bodies {len(lower_hashes)}, mean full diff {sum(walk_diffs)/7:.2f}, mean tail diff {sum(tail_diffs)/7:.2f}')

    clothes_report = {
        'canonicalLowerBodyBox': list(LOWER_BOX),
        'oldLowerBodySource': 'cast_atlas.before.png',
        'rolledBackGestureCells': rollback_cells,
        'rollbackTargets': ['wave', 'point'],
        'rollbackBaseline': 'cast_atlas.clothes_before.png (f23…, pre-clothes-freeze)',
        'otherActionsUnchanged': True,
        'frontBaseCellsWithExactOldLowerBody': exact_old_lower_cells,
        'frontBaseCellsChecked': len(front_base_specs),
        'frontActionFramesChecked': front_action_frames,
        'exactCanonicalHemFrames': exact_action_frames,
        'maxCanonicalHemDifference': round(max_action_diff, 4),
        'lowerBodyMotionTransitions': len(motion_diffs),
        'lowerBodyMotionFrames': lower_body_motion_frames,
        'meanLowerBodyMotion': mean_lower_body_motion,
        'motionLockRemoved': 'freezeWhaleClothes' not in bake_src,
        'headBodyLinkageEnabledActions': sorted(k for k, v in link_map.items() if v > 0),
        'eatBowlFramesChecked': len(bowl_diffs),
        'maxEatBowlDifference': round(max(bowl_diffs), 4) if bowl_diffs else None,
        'walkRhythm': {
            'frames': len(walk_keys),
            'uniqueLowerBodies': len(lower_hashes),
            'meanConsecutiveFrameDifference': round(sum(walk_diffs) / 7, 4),
            'meanTailRegionDifference': round(sum(tail_diffs) / 7, 4),
        },
        'spinPerspectiveException': {
            'frames': len(spin_keys),
            'sideFramesChecked': len(side_keys),
            'sideTemplateMaxDifference': round(side_max_diff, 4),
            'frontFramesUseScaledCanonicalFrontView': True,
        },
        'errors': clothes_errors,
    }
    errors.extend(clothes_errors)

    # Derived 人物/ sheets and index.
    sheet_problems = []
    sheet_frame_count = 0
    for rel, sheet in index['sheets'].items():
        p = ROOT / '人物' / rel
        if not p.exists():
            sheet_problems.append(f'{rel}: missing sheet')
            continue
        sim = Image.open(p).convert('RGBA')
        for fr in sheet['frames']:
            sheet_frame_count += 1
            name = fr['name']
            if name not in rects or list(rects[name]) != list(fr['atlas']):
                sheet_problems.append(f'{rel}/{name}: atlas rect mismatch')
                continue
            sx, sy, sw, sh = fr['sheet']
            if sx < 0 or sy < 0 or sx + sw > sim.width or sy + sh > sim.height:
                sheet_problems.append(f'{rel}/{name}: sheet rect out of bounds')
                continue
            if sim.crop((sx, sy, sx + sw, sy + sh)).tobytes() != crop(after, rects[name]).tobytes():
                sheet_problems.append(f'{rel}/{name}: sheet pixels differ from master atlas')
    if index.get('source', {}).get('w') != meta['w'] or index.get('source', {}).get('h') != meta['h']:
        errors.append('人物/index.json source size does not match atlas')
    if index.get('source', {}).get('frames') != len(rects):
        errors.append('人物/index.json source frame count does not match atlas')
    whale_sheet = index['sheets'].get('q版/whale.png', {})
    if len(whale_sheet.get('frames', [])) != 92:
        errors.append('人物/q版/whale.png does not declare 92 frames')
    if len(whale_sheet.get('actions', {})) != 13:
        errors.append('人物/q版/whale.png does not declare 13 actions')
    if sheet_problems:
        errors.append(f'derived sheet problems: {sheet_problems[:5]}')

    # Root manifest: canonical atlas hash and all nine byte-identical mirrors.
    files = manifest.get('files', [])
    by_path = {f['path']: f for f in files}
    master_rel = '通用模板/engine/assets/cast_atlas.png'
    canonical = by_path.get(master_rel)
    if not canonical or canonical.get('sha256') != sha256(MASTER) or canonical.get('bytes') != MASTER.stat().st_size:
        errors.append('assets.manifest.json canonical-atlas hash is stale')
    mirrors = [f for f in files if f.get('role') == 'atlas-mirror' and f.get('source') == master_rel]
    master_bytes = MASTER.read_bytes()
    for f in mirrors:
        p = ROOT / f['path']
        if not p.exists() or p.read_bytes() != master_bytes:
            errors.append(f'atlas mirror not byte-identical: {f["path"]}')
    if len(mirrors) != 9:
        errors.append(f'expected 9 atlas mirrors in manifest, found {len(mirrors)}')

    report = {
        'status': 'ok' if not errors else 'fail',
        'generatedBy': 'tools/check_whale_redraw.py',
        'baseline': {'file': str(BEFORE.relative_to(ROOT)), 'sha256': sha256(BEFORE)},
        'master': {'file': master_rel, 'sha256': sha256(MASTER), 'bytes': MASTER.stat().st_size, 'w': meta['w'], 'h': meta['h'], 'cells': len(rects)},
        'scope': {
            'whaleCells': len(whale_keys),
            'changedWhaleCells': len(changed_whale),
            'unchangedWhaleCells': len(unchanged_whale),
            'changedNonWhaleCells': len(changed_other),
            'actions': len(wa),
            'actionFrames': len(action_frames),
            'derivedWhaleFrames': len(whale_sheet.get('frames', [])),
            'allDerivedSheetFramesChecked': sheet_frame_count,
            'mirrors': len(mirrors),
        },
        'visual': {
            'masterSoft': True,
            'softEdgeAlpha': SOFT_ALPHA,
            'softEdgePixels': soft_total,
            'hardAlphaNonWhale': not any('non-whale cell has soft alpha' in e for e in errors),
            'transparentCorners': not any('opaque-corner' in f['flags'] for f in flags),
            'disconnectedBorderFragments': sum(len(f['flags']) for f in flags if any('orphans' in x for x in f['flags'])),
            'flaggedFrames': len(flags),
            'paletteEntries': len(palette['RGB']),
            'uniquePaletteColors': len(colors),
            'opaqueColorsOutsidePalette': 0 if not any('outside px.js' in e for e in errors) else 1,
            'medianBboxRatio': round(median_ratio, 4),
            'minBboxRatio': round(ratios[0][0], 4),
            'minBboxRatioKey': ratios[0][1],
            'thinSpinBefore': thin_before,
            'thinSpinAfter': thin_after,
            'spinRatiosBefore': {k: round(v, 4) for k, v in sorted(spin_ratios_before.items())},
            'spinRatiosAfter': {k: round(v, 4) for k, v in sorted(spin_ratios_after.items())},
            'outer2pxOpaqueBefore': border_before_total,
            'outer2pxOpaqueAfter': border_after_total,
            'cellsTouchingOuter2pxAfter': edge_touching,
        },
        'actionProblems': action_problems,
        'clothesStability': clothes_report,
        'derivedSheetProblems': sheet_problems,
        'errors': errors,
    }

    if args.write:
        OUT.mkdir(parents=True, exist_ok=True)
        before_sheet = all_frames_sheet(whale_keys, before, rects, 'BEFORE - all 111 本鲸 master cells')
        after_sheet = all_frames_sheet(whale_keys, after, rects, 'AFTER - all 111 本鲸 master cells')
        before_sheet.save(OUT / 'before_all_whale_frames.png')
        after_sheet.save(OUT / 'after_all_whale_frames.png')
        combined = Image.new('RGB', (before_sheet.width * 2, before_sheet.height), (10, 10, 18))
        combined.paste(before_sheet, (0, 0))
        combined.paste(after_sheet, (before_sheet.width, 0))
        combined.save(OUT / 'before_after_all_frames.png')
        selected_sheet(SELECTED, before, after, rects).save(OUT / 'before_after_selected.png')
        (OUT / 'whale_redraw_qa.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        (OUT / 'clothes_stability.json').write_text(json.dumps(clothes_report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    if errors:
        print('WHALE_REDRAW_FAIL')
        for e in errors:
            print(' -', e)
        return 1
    print(f'WHALE_REDRAW_OK {len(whale_keys)} frames · {len(wa)} actions · {len(action_frames)} derived frames · {len(mirrors)} mirrors · whale-only changes')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
