#!/usr/bin/env python3
"""把毛笔字体裁成只含画面上用到的字（歌词 + 片名 + 匾额 / 木牌 / 朱印）。

用法：python3 tools/subset_font.py /路径/MaShanZheng-Regular.ttf
字体：Ma Shan Zheng（马善政毛笔楷书），SIL OFL 1.1，
      https://github.com/google/fonts/tree/main/ofl/mashanzheng
改了歌词或画面上的字之后重跑一遍；缺字会直接报错，不会悄悄掉回系统字体。
依赖：pip install fonttools brotli
"""
import re, sys, pathlib
from fontTools import subset
from fontTools.ttLib import TTFont

root = pathlib.Path(__file__).resolve().parent.parent
src = sys.argv[1] if len(sys.argv) > 1 else "MaShanZheng-Regular.ttf"
lyr = (root / "src/mv/lyrics.ts").read_text(encoding="utf8")
rows = "".join(re.findall(r'"([^"]*)"', lyr.split("const ROWS")[1].split("];")[0]))
# 画面上其它的字：片名、朱印、匾、酒旗、木牌；以及页面标题用到的字
extra = "浪人琵琶番外题跋酒忘归楼天涯" + "大肥鱼翻唱本鲸小克分镜歌词选角交付手卷一帘美梦忆凝眸独酌梦回又程"
chars = sorted(set(c for c in rows + extra if ord(c) > 0x2E80))
cmap = TTFont(src).getBestCmap()
missing = [c for c in chars if ord(c) not in cmap]
if missing:
    sys.exit("字体里没有这些字：" + "".join(missing))
opt = subset.Options()
opt.flavor = "woff2"
opt.layout_features = []
opt.name_IDs = [1, 2]
opt.notdef_outline = True
sub = subset.Subsetter(opt)
f = subset.load_font(src, opt)
sub.populate(text="".join(chars))
sub.subset(f)
out = root / "src/assets/brush.woff2"
subset.save_font(f, str(out), opt)
print(f"{len(chars)} 个字 -> {out} ({out.stat().st_size} 字节)")
