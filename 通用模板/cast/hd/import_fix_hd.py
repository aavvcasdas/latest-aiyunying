#!/usr/bin/env python3
"""把 fix.zip / fix2.zip 里的 4 倍基础格降到 2 倍，替换 人物/q版HD_2x/base/

fix 包（fix.zip 与 fix2.zip 内容逐字节相同，只是打包时间不同）里的 src/assets/base/*.webp
是 108 张基础格的 4 倍 Real-ESRGAN 超分版——带真实细节（蕾丝、发丝、眼睛高光），不是像素放大。
仓库的高清层取「2 倍」口径（体积小、够用），所以这里把 4 倍图降到 2 倍再入库：
尺寸与 index.json 里的 2 倍尺寸逐张对得上，动作派生、图集烘焙都不用改。

为什么要锐化一次：超分图本身是抗锯齿的，LANCZOS 降采样又糊一层，直接喂给引擎就是「柔焦方块」——
画面里看就是「还是模糊」。这里只对 RGB 做轻反锐化（alpha 不动，免得边上出现黑边）。

用法：
  python3 通用模板/cast/hd/import_fix_hd.py --zip fix.zip                 # 全部 108 张
  python3 通用模板/cast/hd/import_fix_hd.py --zip fix.zip --only whale    # 只换本鲸（whale / whale_big / p_whale / walk_whale）
  python3 通用模板/cast/hd/import_fix_hd.py --zip fix.zip --only whale --dry
改完要重烘：npm run cast:hd -- --only whale && npm run cast:hd:atlas
"""
import argparse
import io
import json
import os
import sys
import zipfile

REPO = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
PACK = os.path.join(REPO, '人物', 'q版HD_2x')
BASE = os.path.join(PACK, 'base')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--zip', required=True, help='fix.zip 或 fix2.zip')
    ap.add_argument('--only', action='append', default=[], help='只换包含这些字样的格（whale、p_whale、walk_whale），可写多次')
    ap.add_argument('--sharp', type=float, default=115, help='反锐化百分比，0 = 不锐化（默认 115）')
    ap.add_argument('--radius', type=float, default=1.1)
    ap.add_argument('--dry', action='store_true', help='只报会换哪些格，不写文件')
    a = ap.parse_args()
    try:
        from PIL import Image, ImageFilter
    except ImportError:
        sys.exit('需要 Pillow：python3 -m pip install pillow')

    idx = json.load(open(os.path.join(PACK, 'index.json'), encoding='utf-8'))
    want = idx['base']
    zf = zipfile.ZipFile(a.zip)
    names = {os.path.basename(n)[:-5]: n for n in zf.namelist()
             if n.startswith('src/assets/base/') and n.endswith('.webp')}
    meta = json.loads(zf.read('src/assets/patch/base_meta.json'))

    picked, skipped = [], []
    for key in sorted(want):
        if a.only and not any(p in key for p in a.only):
            continue
        if key not in names or key not in meta:
            skipped.append((key, '包里没有这一格'))
            continue
        hw, hh = meta[key]['hd']
        w2, h2 = hw // 2, hh // 2
        if (w2, h2) != (want[key]['w'], want[key]['h']):
            skipped.append((key, '尺寸对不上：4 倍降下来 %d×%d，index 记的是 %d×%d'
                            % (w2, h2, want[key]['w'], want[key]['h'])))
            continue
        picked.append(key)

    print('要换 %d 张，跳过 %d 张' % (len(picked), len(skipped)))
    for k, why in skipped:
        print('  跳过 %s：%s' % (k, why))
    if a.dry:
        print('（--dry，一个字都没写）')
        return

    for key in picked:
        im = Image.open(io.BytesIO(zf.read(names[key]))).convert('RGBA')
        hw, hh = meta[key]['hd']
        sm = im.resize((hw // 2, hh // 2), Image.LANCZOS)
        if a.sharp > 0:
            rgb = sm.convert('RGB').filter(ImageFilter.UnsharpMask(radius=a.radius, percent=int(a.sharp), threshold=0))
            alpha = sm.getchannel('A')
            sm = rgb.convert('RGBA')
            sm.putalpha(alpha)
        sm.save(os.path.join(BASE, key + '.png'))
    print('写完 %d 张基础格' % len(picked))
    print('接着重烘：npm run cast:hd -- --only <角色> && npm run cast:hd:atlas')


if __name__ == '__main__':
    main()
