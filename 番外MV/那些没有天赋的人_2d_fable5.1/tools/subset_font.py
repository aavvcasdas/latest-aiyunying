#!/usr/bin/env python3
"""把两款字体裁成只含画面上用到的字。

用法：python3 tools/subset_font.py <ZCOOLQingKeHuangYou-Regular.ttf> <MaShanZheng-Regular.ttf>
  站酷庆科黄油体（粗黑体，整屏大字用）与马善政毛笔楷书（题字、副句用），都是 SIL OFL 1.1，
  来自 https://github.com/google/fonts/tree/main/ofl/{zcoolqingkehuangyou,mashanzheng}
改了歌词或画面上的字之后重跑；缺字直接报错。依赖：pip install fonttools brotli
"""
import re, sys, pathlib
from fontTools import subset
from fontTools.ttLib import TTFont

root = pathlib.Path(__file__).resolve().parent.parent
heavy, brush = sys.argv[1], sys.argv[2]
lyr = (root / "src/mv/lyricsData.ts").read_text(encoding="utf8")
chars = "".join(re.findall(r'"text":"([^"]*)"', lyr))
extra = "譬如我番外小鱼服务器繁忙平庸狐狸千问小克龙娘猫豆包Kimi分镜歌词选角交付大字版这首歌在讲什么众多的里"
need = sorted(set(c for c in chars + extra if not c.isspace()))
for src, out in [(heavy, "heavy.woff2"), (brush, "brush.woff2")]:
    cmap = TTFont(src).getBestCmap()
    missing = [c for c in need if ord(c) not in cmap]
    if missing:
        sys.exit(f"{src} 里没有这些字：" + "".join(missing))
    opt = subset.Options(); opt.flavor = "woff2"; opt.layout_features = []; opt.name_IDs = [1, 2]; opt.notdef_outline = True
    f = subset.load_font(src, opt); sub = subset.Subsetter(opt); sub.populate(text="".join(need)); sub.subset(f)
    dst = root / "src/assets" / out; subset.save_font(f, str(dst), opt)
    print(f"{len(need)} 字 -> {dst} ({dst.stat().st_size} 字节)")
