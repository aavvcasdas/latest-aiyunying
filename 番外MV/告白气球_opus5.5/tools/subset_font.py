#!/usr/bin/env python3
"""把模板字体（站酷快乐体）裁成只含画面和页面标题用到的字。

用法：python3 tools/subset_font.py <仓库根>/通用模板/engine/assets/fonts/ZCOOLKuaiLe-Regular.ttf
字体就是模板自带的那一款（SIL OFL 1.1，许可证在同目录 OFL-ZCOOLKuaiLe.txt），只是裁小了。
改了歌词或画面上的字之后重跑；缺字直接报错。依赖：pip install fonttools brotli
"""
import re, sys, pathlib
from fontTools import subset
from fontTools.ttLib import TTFont

root = pathlib.Path(__file__).resolve().parent.parent
src = sys.argv[1]
text = (root / "src/mv/lyrics.ts").read_text(encoding="utf8")
rows = "".join(re.findall(r'"([^"]*)"', text.split("const ROWS")[1].split("];")[0]))
for f in ["shotsA.ts", "shotsB.ts", "paris.ts"]:
    s = (root / "src/mv" / f).read_text(encoding="utf8")
    # 画面上真正画出来的字：fillText / strokeText / sign / card / priceTag 的参数
    rows += "".join(re.findall(r'(?:fillText|strokeText)\("([^"]+)"', s))
    rows += "".join(re.findall(r'(?:sign|priceTag)\([^"]*"([^"]+)"', s))
    rows += "".join(re.findall(r'card\([^"]*"([^"]+)", "([^"]+)"', s) and sum(re.findall(r'card\([^"]*"([^"]+)", "([^"]+)"', s), ()))
extra = "\u3000告白气球番外这首歌在讲什么致小可小克最贵那天恋爱日记换她来讲同一首歌小克那一边左岸咖啡花店"
need = sorted(set(c for c in rows + extra if not c.isspace()))
cmap = TTFont(src).getBestCmap()
missing = [c for c in need if ord(c) not in cmap]
if missing:
    sys.exit("模板字体里没有这些字：" + "".join(missing))
opt = subset.Options(); opt.flavor = "woff2"; opt.layout_features = []; opt.name_IDs = [1, 2]; opt.notdef_outline = True
f = subset.load_font(src, opt); sub = subset.Subsetter(opt); sub.populate(text="".join(need)); sub.subset(f)
dst = root / "src/assets/kuaile.woff2"; subset.save_font(f, str(dst), opt)
print(f"{len(need)} 字 -> {dst} ({dst.stat().st_size} 字节)")
