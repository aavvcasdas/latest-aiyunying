#!/usr/bin/env python3
"""画一台旧电视的外框，给画中画用。

先按 600×440 画，再缩到 540×396（右上角不挡人），中间是**全透明**的洞：378×212，洞左上角 (72, 72)。
pip.sh 先把 Day14 的画面塞进洞里，再把这层框盖上去（数字在 pip.sh 里写死，改这里要同步改那边）。

    python3 Day/Day15/make_tv_frame.py        # → Day/Day15/素材/pip_tv.png
"""
import pathlib
from PIL import Image, ImageDraw, ImageFont

W, H = 600, 440
HOLE = (80, 80, 500, 316)          # 左, 上, 右, 下

img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
d = ImageDraw.Draw(img)

# 天线
d.line([(250, 70), (196, 8)], fill=(70, 46, 30, 255), width=7)
d.line([(350, 70), (404, 8)], fill=(70, 46, 30, 255), width=7)
d.ellipse([(190, 2), (204, 16)], fill=(70, 46, 30, 255))
d.ellipse([(396, 2), (410, 16)], fill=(70, 46, 30, 255))

# 机身（木壳）+ 一点点投影
d.rounded_rectangle([(24, 70), (576, 382)], radius=26, fill=(122, 74, 44, 255), outline=(58, 34, 20, 255), width=6)
d.rounded_rectangle([(40, 84), (560, 368)], radius=18, fill=(92, 54, 32, 255))

# 屏幕内框
d.rounded_rectangle([(68, 68), (512, 328)], radius=12, fill=(34, 22, 16, 255))

# 右侧旋钮 + 喇叭
for cy in (132, 186):
    d.ellipse([(528, cy - 20), (568, cy + 20)], fill=(217, 176, 106, 255), outline=(58, 34, 20, 255), width=3)
    d.line([(548, cy - 12), (548, cy + 12)], fill=(58, 34, 20, 255), width=3)
for gy in range(232, 316, 12):
    d.line([(524, gy), (572, gy)], fill=(58, 34, 20, 255), width=3)

# 腿
d.polygon([(140, 382), (176, 382), (186, 430), (150, 430)], fill=(92, 54, 32, 255))
d.polygon([(424, 382), (460, 382), (450, 430), (414, 430)], fill=(92, 54, 32, 255))

# 屏幕玻璃的高光（斜的一条，盖在画面上更像块屏）
hl = Image.new("RGBA", (W, H), (0, 0, 0, 0))
ImageDraw.Draw(hl).polygon([(80, 80), (200, 80), (80, 250)], fill=(255, 255, 255, 26))
img = Image.alpha_composite(img, hl)

# 挖洞：中间全透明
px = img.load()
for y in range(HOLE[1], HOLE[3]):
    for x in range(HOLE[0], HOLE[2]):
        px[x, y] = (0, 0, 0, 0)

# 缩小到 540×396，洞跟着变成 (72,72) 起、378×212
img = img.resize((540, 396), Image.LANCZOS)
px = img.load()
for y in range(72, 284):
    for x in range(72, 450):
        px[x, y] = (0, 0, 0, 0)

# 机身下方贴一张纸条：写清楚电视里放的是哪一版（「Day14 · Claude 重构版」）
d2 = ImageDraw.Draw(img)
FONT_PATH = pathlib.Path(__file__).resolve().parents[2] / "通用模板" / "engine" / "assets" / "fonts" / "ZCOOLKuaiLe-Regular.ttf"
label = "Day14 · Claude 重构版"
font = ImageFont.truetype(str(FONT_PATH), 27)
lw = int(d2.textlength(label, font=font)) + 28
d2.rounded_rectangle([(76, 292), (76 + lw, 336)], radius=8, fill=(243, 232, 205, 255), outline=(58, 34, 20, 255), width=3)
d2.text((76 + 14, 300), label, fill=(52, 34, 22, 255), font=font)

out = pathlib.Path(__file__).resolve().parent / "素材" / "pip_tv.png"
out.parent.mkdir(parents=True, exist_ok=True)
img.save(out)
print(f"TV_FRAME {out} {img.size[0]}x{img.size[1]} 洞 378x212（左上角 72,72）")
