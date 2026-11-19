#!/usr/bin/env python3
"""把母版图集拆成「按组」的人物图集，放进项目自己的 人物/ 目录。

为什么要有这个脚本：母版 `通用模板/engine/assets/cast_atlas.png`（2048×3439，747 帧，9 位角色）是
一张大拼图，人看不了、也没法单独复用。这里按用途拆成几张：一组 Q 版动作、一组行走、
一组头像、一组变体（boss / big / front / side / fly / 道具 / 特效），并生成坐标表。

输出（默认写到仓库根 人物/）：
    atlas.png              母版原图（不裁，留作对照）
    q版/<角色>.png          该角色 act_* 动作，等格网格，一行动作
    行走/walk.png           walk_* 56 帧
    头像/portraits.png      p_* 15 帧
    变体/variants.png       其余（boss / big / front / side / fly / cage）
    道具/props.png           prop_* 15 帧
    特效/fx.png              fx_* 21 帧
    index.json             每张图里的行列坐标 + 原图坐标
    立绘/                   七头身（art/raw 原图、art/tachie 抠图、rig 引擎），脚本不覆盖

用法：
    python3 tools/split_cast.py                     # 写进仓库根 人物/
    python3 tools/split_cast.py --out /tmp/cast     # 写到别处
"""
import argparse
import json
import math
import re
import os
import shutil

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_PNG = os.path.join(ROOT, '通用模板/engine/assets/cast_atlas.png')
SRC_JSON = os.path.join(ROOT, '通用模板/engine/assets/cast_atlas.json')
DEFAULT_OUT = os.path.join(ROOT, '人物')

PAD = 2        # 格子间距
MARGIN = 2     # 图边距


def grid_sheet(frames, atlas, cell_w, cell_h, cols):
    """把 frames（name -> (x,y,w,h)）摆成等格网格，返回 (image, layout)。"""
    rows = math.ceil(len(frames) / cols)
    sheet = Image.new('RGBA', (cols * (cell_w + PAD) + MARGIN * 2, rows * (cell_h + PAD) + MARGIN * 2), (0, 0, 0, 0))
    layout = []
    for i, (name, (x, y, w, h)) in enumerate(frames.items()):
        r, c = divmod(i, cols)
        cx = MARGIN + c * (cell_w + PAD)
        cy = MARGIN + r * (cell_h + PAD)
        # 底对齐：脚踩在格子底部，动画才不会上下跳
        dx = cx + (cell_w - w) // 2
        dy = cy + (cell_h - h)
        sheet.alpha_composite(atlas.crop((x, y, x + w, y + h)), (dx, dy))
        layout.append({'name': name, 'row': r, 'col': c,
                       'sheet': [dx, dy, w, h], 'atlas': [x, y, w, h]})
    return sheet, {'cell': [cell_w, cell_h], 'cols': cols, 'rows': rows, 'pad': PAD, 'margin': MARGIN, 'frames': layout}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default=DEFAULT_OUT)
    a = ap.parse_args()
    out = os.path.abspath(a.out)

    meta = json.load(open(SRC_JSON, encoding='utf-8'))
    rects = meta['s']
    atlas = Image.open(SRC_PNG).convert('RGBA')
    assert atlas.size == (meta['w'], meta['h']), (atlas.size, meta)

    groups = {'q版': {}, '行走': {}, '头像': {}, '变体': {}, '道具': {}, '特效': {}}
    # 角色顺序以动作表为准（grok 是后加的，排最后）
    act_path = os.path.join(ROOT, '通用模板/engine/assets/cast_actions.json')
    cast = list(json.load(open(act_path, encoding='utf-8'))['actions']) if os.path.exists(act_path) \
        else ['whale', 'gpt', 'claude', 'doubao', 'gemini', 'kimi', 'qwen', 'zai']
    for name, rect in rects.items():
        if name.startswith('act_'):
            who = name.split('_')[1]
            groups['q版'].setdefault(who, {})[name] = rect
        elif name.startswith('walk_'):
            groups['行走'].setdefault('walk', {})[name] = rect
        elif name.startswith('p_'):
            groups['头像'].setdefault('portraits', {})[name] = rect
        elif name.startswith('prop_'):
            groups['道具'].setdefault('props', {})[name] = rect
        elif name.startswith('fx_'):
            groups['特效'].setdefault('fx', {})[name] = rect
        else:
            groups['变体'].setdefault('variants', {})[name] = rect

    # 只重写自己管的子目录，别把 人物/动作总表.mp4 之类的成品删掉
    for sub in ('q版', '行走', '头像', '变体', '道具', '特效'):
        p_sub = os.path.join(out, sub)
        if os.path.isdir(p_sub):
            shutil.rmtree(p_sub)
        os.makedirs(p_sub, exist_ok=True)
    for f in ('atlas.png', 'index.json'):
        p_f = os.path.join(out, f)
        if os.path.exists(p_f):
            os.remove(p_f)

    shutil.copy2(SRC_PNG, os.path.join(out, 'atlas.png'))
    index = {'source': {'png': 'atlas.png', 'w': meta['w'], 'h': meta['h'], 'frames': len(rects)}, 'sheets': {}}

    # ① Q 版：一角色一张，等格网格（列数 = 该角色最多动作帧数）
    for who in cast:
        frames = groups['q版'].get(who, {})
        if not frames:
            continue
        cw = max(v[2] for v in frames.values()) + 6
        ch = max(v[3] for v in frames.values()) + 6
        by_action = {}
        for name, rect in frames.items():          # act_<who>_<action>_<index>
            parts = name.split('_')
            by_action.setdefault(parts[2], []).append((int(parts[3]), name))
        ordered = {}
        for act in sorted(by_action):
            for _, name in sorted(by_action[act]):
                ordered[name] = frames[name]
        cols = max(len(v) for v in by_action.values())
        sheet, lay = grid_sheet(ordered, atlas, cw, ch, cols)
        rel = f'q版/{who}.png'
        sheet.save(os.path.join(out, rel))
        lay['actions'] = {act: [n for _, n in sorted(v)] for act, v in sorted(by_action.items())}
        index['sheets'][rel] = lay
        print(f'{rel:20s} {sheet.size[0]}×{sheet.size[1]}  {len(ordered)} 帧 / {len(by_action)} 个动作')

    # ② 行走 / 头像 / 变体
    for group, frames in groups.items():
        if group == 'q版':
            continue
        for key, fr in frames.items():
            cw = max(v[2] for v in fr.values()) + 6
            ch = max(v[3] for v in fr.values()) + 6
            if group == '行走':
                # 一个角色一行：先按角色分组（walk_doubao_big_* 这种大只版单独一组），再按帧号，8 列
                by_who = {}
                for name, rect in fr.items():
                    m = re.match(r'walk_([a-z]+)(_big)?_(\d+)$', name)
                    who = (m.group(1) + (m.group(2) or '')) if m else name
                    by_who.setdefault(who, []).append((int(m.group(3)) if m else 0, name))
                order = [w for w in cast if w in by_who] + [w for w in by_who if w not in cast]
                ordered = {}
                for who in order:
                    for _, name in sorted(by_who[who]):
                        ordered[name] = fr[name]
                fr = ordered
                cols = 8
            else:
                fr = dict(sorted(fr.items()))
                cols = min(10, len(fr))
            sheet, lay = grid_sheet(fr, atlas, cw, ch, cols)
            rel = f'{group}/{key}.png'
            sheet.save(os.path.join(out, rel))
            index['sheets'][rel] = lay
            print(f'{rel:20s} {sheet.size[0]}×{sheet.size[1]}  {len(fr)} 帧')

    json.dump(index, open(os.path.join(out, 'index.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

    # ③ 长大立绘：已经在 人物/立绘/ 里（art/raw 原图 + art/tachie 抠图），这里只报数
    raw = os.path.join(out, '立绘/art/raw')
    n = sum(1 for who in cast if os.path.exists(os.path.join(raw, f'{who}.png')))
    print(f'立绘/art/raw {n} 张' + ('' if n == len(cast) else '（有角色缺原图）'))

    total = sum(os.path.getsize(os.path.join(dp, f)) for dp, _, fs in os.walk(out) for f in fs)
    print(f'人物/ 合计 {total / 1048576:.1f} MB，{sum(len(fs) for _, _, fs in os.walk(out))} 个文件')


if __name__ == '__main__':
    main()
