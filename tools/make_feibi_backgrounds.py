"""《譬如我》程序化背景生成（PIL，确定性）。

原始上传包只带代码，`public/images/` 里六张环境美术没跟过来。
这里按四幕的情绪和章节色，用渐变 + 剪影 + 光晕 + 颗粒重画六张 1920x1080 底图：

  rooftop   霓虹之外 · 深夜天台（俯瞰城市）
  alley     引子 · 雨后小巷
  workshop  未完成的梦 · 草稿工坊（台灯暖光）
  spotlight 天才的回声 · 追光舞台
  seedling  窗台幼芽
  bloom     角落开花 · 晨光

画面下方中央刻意留空：角色站那儿，字卡在下方浮出。
"""
from __future__ import annotations

import math
import os
import random

from PIL import Image, ImageChops, ImageDraw, ImageFilter

W, H = 1920, 1080
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "番外MV", "譬如我", "源码", "public", "images")


def vgrad(stops):
    im = Image.new("RGB", (1, H))
    px = im.load()
    for y in range(H):
        t = y / (H - 1)
        c = stops[-1][1]
        for i in range(len(stops) - 1):
            t0, c0 = stops[i]
            t1, c1 = stops[i + 1]
            if t0 <= t <= t1:
                k = (t - t0) / max(1e-6, t1 - t0)
                c = tuple(round(c0[j] + (c1[j] - c0[j]) * k) for j in range(3))
                break
        px[0, y] = c
    return im.resize((W, H), Image.BILINEAR)


def radial(cx, cy, r, color, steps=26):
    layer = Image.new("RGB", (W, H), (0, 0, 0))
    d = ImageDraw.Draw(layer)
    for i in range(steps, 0, -1):
        rr = r * i / steps
        a = (1 - i / steps) ** 1.8
        d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], fill=tuple(round(v * a) for v in color))
    return layer.filter(ImageFilter.GaussianBlur(r * 0.1))


def screen(base, layer, opacity=1.0):
    out = ImageChops.screen(base.convert("RGB"), layer.convert("RGB"))
    return out if opacity >= 1 else Image.blend(base.convert("RGB"), out, opacity)


def over(base, layer):
    base = base.convert("RGBA")
    base.alpha_composite(layer.convert("RGBA"))
    return base.convert("RGB")


def rgba(color, a=255):
    return (color[0], color[1], color[2], a)


def new_layer():
    return Image.new("RGBA", (W, H), (0, 0, 0, 0))


def grain(img, amount=9):
    noise = Image.effect_noise((W, H), amount).convert("L")
    return Image.blend(img, Image.merge("RGB", (noise, noise, noise)), 0.05)


def vignette(img, strength=0.5):
    mask = Image.new("L", (W // 4, H // 4), 0)
    ImageDraw.Draw(mask).ellipse([-W // 12, -H // 14, W // 4 + W // 12, H // 4 + H // 14], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(26)).resize((W, H), Image.BICUBIC)
    dark = Image.new("RGB", (W, H), (0, 0, 0))
    return Image.blend(img, Image.composite(img, dark, mask), strength)


def haze(img, color, strength=0.16, center=0.6):
    mask = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(mask)
    for y in range(H):
        v = int(255 * strength * max(0.0, 1 - abs(y / H - center) * 3.2))
        d.line([(0, y), (W, y)], fill=v)
    return Image.composite(Image.new("RGB", (W, H), color), img, mask.filter(ImageFilter.GaussianBlur(60)))


def finish(img, vig=0.5):
    return grain(vignette(img.convert("RGB"), vig))


# ------------------------------------------------------------------ 1. 天台
def rooftop():
    rnd = random.Random(11)
    img = vgrad([(0.0, (6, 14, 22)), (0.40, (11, 30, 44)), (0.62, (24, 62, 78)), (1.0, (7, 17, 24))])
    img = screen(img, radial(int(W * 0.68), int(H * 0.62), 640, (70, 190, 180)), 0.5)

    for top, color, blur, win in [(0.54, (18, 44, 58), 9, 24), (0.63, (12, 31, 43), 6, 18), (0.73, (7, 19, 27), 3, 13)]:
        layer = new_layer()
        d = ImageDraw.Draw(layer)
        x = -140
        while x < W + 140:
            bw = rnd.randint(110, 250)
            bh = rnd.randint(150, 430)
            y0 = int(H * top) - bh
            d.rectangle([x, y0, x + bw, H], fill=rgba(color))
            for wy in range(y0 + win, H - 60, win + 9):
                for wx in range(x + 12, x + bw - 16, win + 11):
                    if rnd.random() < 0.40:
                        c = rnd.choice([(255, 214, 150), (255, 231, 186), (150, 226, 214)])
                        d.rectangle([wx, wy, wx + 6, wy + 9], fill=rgba(c, 210))
            x += bw + rnd.randint(16, 48)
        img = over(img, layer.filter(ImageFilter.GaussianBlur(blur)))

    fore = new_layer()
    d = ImageDraw.Draw(fore)
    d.rectangle([0, int(H * 0.80), W, H], fill=rgba((5, 12, 18)))
    d.rectangle([0, int(H * 0.628), W, int(H * 0.646)], fill=rgba((9, 20, 28)))
    for i in range(0, W, 76):
        d.rectangle([i, int(H * 0.63), i + 9, int(H * 0.82)], fill=rgba((7, 16, 23)))
    img = over(img, fore)

    bokeh = new_layer()
    d = ImageDraw.Draw(bokeh)
    for _ in range(90):
        x, y = rnd.randint(0, W), rnd.randint(int(H * 0.44), int(H * 0.78))
        r = rnd.randint(4, 16)
        c = rnd.choice([(255, 205, 140), (140, 230, 215), (255, 240, 210)])
        d.ellipse([x - r, y - r, x + r, y + r], fill=rgba(c, rnd.randint(40, 120)))
    img = over(img, bokeh.filter(ImageFilter.GaussianBlur(5)))
    return finish(haze(img, (96, 160, 180), 0.15, 0.60), 0.5)


# ------------------------------------------------------------------ 2. 小巷
def alley():
    """雨后小巷：透视墙面 + 墙面砖缝 + 挂墙霓虹 + 湿地倒影 + 细雾。"""
    rnd = random.Random(22)
    vx, vy = int(W * 0.50), int(H * 0.475)          # 灭点
    img = vgrad([(0.0, (9, 13, 19)), (0.48, (15, 26, 34)), (1.0, (10, 17, 23))])

    # 地面
    ground = new_layer()
    ImageDraw.Draw(ground).polygon([(0, H), (vx, vy), (W, H)], fill=rgba((13, 22, 29)))
    img = over(img, ground)

    # 左右墙：远窄近宽
    for side in (0, 1):
        far_top = (vx - 40, int(H * 0.20)) if side == 0 else (vx + 40, int(H * 0.20))
        far_bot = (vx, vy + 10)
        near_top = (-60, -80) if side == 0 else (W + 60, -80)
        near_bot = (-60, int(H * 0.93)) if side == 0 else (W + 60, int(H * 0.93))
        wall = new_layer()
        ImageDraw.Draw(wall).polygon([near_top, far_top, far_bot, near_bot], fill=rgba((18, 29, 37)))
        img = over(img, wall)

        # 砖缝：横线 + 竖线，向灭点收敛
        lines = new_layer()
        ld = ImageDraw.Draw(lines)
        for i in range(16):                        # 横向砖缝
            k = (i / 16) ** 1.25
            y0 = near_top[1] + (far_top[1] - near_top[1]) * k
            y1 = near_bot[1] + (far_bot[1] - near_bot[1]) * k
            ld.line([near_top[0] + (far_top[0] - near_top[0]) * k, y0,
                     near_bot[0] + (far_bot[0] - near_bot[0]) * k, y1], fill=rgba((28, 43, 53), 190), width=2)
        for j in range(14):                        # 纵向：从近到远
            k = (j / 14) ** 2.1
            xt = near_top[0] + (far_top[0] - near_top[0]) * k
            xb = near_bot[0] + (far_bot[0] - near_bot[0]) * k
            ld.line([(xt, near_top[1] + (far_top[1] - near_top[1]) * k),
                     (xb, near_bot[1] + (far_bot[1] - near_bot[1]) * k)], fill=rgba((26, 40, 50), 150), width=2)
        img = over(img, lines.filter(ImageFilter.GaussianBlur(1.1)))

    # 巷尾的暖光（远处出口）
    img = screen(img, radial(vx, vy + 40, 300, (255, 206, 150)), 0.45)

    # 挂墙霓虹：贴着左右墙
    neons = [
        ((int(W * 0.05), int(H * 0.24), int(W * 0.19), int(H * 0.36)), (140, 235, 220)),
        ((int(W * 0.72), int(H * 0.18), int(W * 0.90), int(H * 0.33)), (255, 140, 200)),
        ((int(W * 0.62), int(H * 0.40), int(W * 0.73), int(H * 0.47)), (255, 210, 140)),
        ((int(W * 0.12), int(H * 0.44), int(W * 0.22), int(H * 0.50)), (150, 200, 255)),
    ]
    glow = Image.new("RGB", (W, H), (0, 0, 0))
    gd = ImageDraw.Draw(glow)
    for box, c in neons:
        gd.rectangle(box, fill=c)
    img = screen(img, glow.filter(ImageFilter.GaussianBlur(28)), 0.55)

    signs = new_layer()
    sd = ImageDraw.Draw(signs)
    for box, c in neons:
        sd.rectangle(box, fill=rgba(c, 40), outline=rgba(c, 235), width=4)
        for k in range(3):                          # 招牌上的「字」
            ty = box[1] + (box[3] - box[1]) * (0.28 + k * 0.22)
            sd.rounded_rectangle([box[0] + 16, ty, box[2] - 16, ty + 12], radius=6, fill=rgba(c, 150))
    img = over(img, signs.filter(ImageFilter.GaussianBlur(1.4)))

    # 湿地面：竖向倒影 + 水洼高光
    refl = new_layer()
    rd = ImageDraw.Draw(refl)
    for box, c in neons:
        cx = (box[0] + box[2]) // 2
        rd.rectangle([cx - 34, vy + 20, cx + 34, H], fill=rgba(c, 60))
    img = over(img, refl.filter(ImageFilter.GaussianBlur(30)))

    wet = new_layer()
    wd = ImageDraw.Draw(wet)
    for _ in range(70):
        x = rnd.randint(0, W)
        y = rnd.randint(vy + 30, H - 6)
        ww = rnd.randint(50, 220)
        wd.ellipse([x, y, x + ww, y + 7], fill=rgba((190, 218, 228), rnd.randint(10, 34)))
    img = over(img, wet.filter(ImageFilter.GaussianBlur(7)))

    # 细雨
    rain = new_layer()
    rd2 = ImageDraw.Draw(rain)
    for _ in range(260):
        x, y = rnd.randint(0, W), rnd.randint(0, H)
        ln = rnd.randint(14, 40)
        rd2.line([(x, y), (x - 6, y + ln)], fill=rgba((200, 224, 236), rnd.randint(16, 46)), width=1)
    img = over(img, rain.filter(ImageFilter.GaussianBlur(0.6)))
    return finish(haze(img, (86, 146, 166), 0.12, 0.62), 0.52)


# ------------------------------------------------------------------ 3. 工坊
def workshop():
    rnd = random.Random(33)
    img = vgrad([(0.0, (10, 9, 10)), (0.55, (26, 21, 18)), (1.0, (11, 9, 9))])
    img = screen(img, radial(int(W * 0.44), int(H * 0.46), 740, (255, 196, 128)), 0.62)

    desk = new_layer()
    ImageDraw.Draw(desk).polygon(
        [(-40, int(H * 0.72)), (W + 40, int(H * 0.66)), (W + 40, H), (-40, H)], fill=rgba((44, 31, 22))
    )
    img = over(img, desk)

    lx, ly = int(W * 0.20), int(H * 0.30)
    lamp = new_layer()
    d = ImageDraw.Draw(lamp)
    d.polygon([(lx - 150, ly + 120), (lx + 150, ly + 120), (lx + 92, ly - 44), (lx - 92, ly - 44)], fill=rgba((24, 20, 17)))
    d.line([(lx, ly - 44), (lx + 8, 0)], fill=rgba((20, 17, 15)), width=10)
    img = over(img, lamp)
    img = screen(img, radial(lx, ly + 150, 460, (255, 205, 145)), 0.5)

    papers = new_layer()
    pd = ImageDraw.Draw(papers)
    for _ in range(12):
        cx = rnd.randint(int(W * 0.30), int(W * 0.88))
        cy = rnd.randint(int(H * 0.66), int(H * 0.93))
        pw, ph = rnd.randint(150, 270), rnd.randint(100, 175)
        ang = math.radians(rnd.uniform(-16, 16))
        poly = []
        for dx, dy in [(-pw / 2, -ph / 2), (pw / 2, -ph / 2), (pw / 2, ph / 2), (-pw / 2, ph / 2)]:
            poly.append((cx + dx * math.cos(ang) - dy * math.sin(ang), cy + dx * math.sin(ang) + dy * math.cos(ang)))
        tone = rnd.choice([(232, 224, 208), (216, 205, 186), (240, 232, 214)])
        pd.polygon(poly, fill=rgba(tone, 238))
        for k in range(3):
            yy = cy - ph / 4 + k * (ph / 5)
            pd.line([(cx - pw / 2 + 22, yy), (cx + pw / 2 - 22, yy)], fill=rgba((120, 110, 96), 80), width=2)
    img = over(img, papers)

    # 蓝碗（设定里的「蓝饭碗」）：碗身 + 碗口 + 高光，侧四分之三视角
    bx, by, br = int(W * 0.16), int(H * 0.775), 104
    bowl = new_layer()
    bd = ImageDraw.Draw(bowl)
    bd.pieslice([bx - br, by - br * 0.86, bx + br, by + br * 1.1], 0, 180, fill=rgba((34, 78, 124), 252))
    bd.ellipse([bx - br, by - br * 0.34, bx + br, by + br * 0.22], fill=rgba((46, 100, 152), 255))
    bd.ellipse([bx - br * 0.84, by - br * 0.26, bx + br * 0.84, by + br * 0.12], fill=rgba((16, 30, 44), 255))
    bd.arc([bx - br * 0.94, by - br * 0.3, bx + br * 0.94, by + br * 0.18], 200, 340, fill=rgba((150, 205, 240), 210), width=5)
    bd.arc([bx - br * 0.7, by + br * 0.05, bx + br * 0.7, by + br * 1.0], 20, 160, fill=rgba((120, 180, 230), 120), width=6)
    img = over(img, bowl)
    img = screen(img, radial(bx, by, 230, (120, 180, 240)), 0.14)
    return finish(img, 0.62)


# ------------------------------------------------------------------ 4. 舞台
def spotlight():
    rnd = random.Random(44)
    img = vgrad([(0.0, (5, 5, 7)), (0.60, (12, 11, 16)), (1.0, (4, 4, 5))])

    cone = new_layer()
    ImageDraw.Draw(cone).polygon(
        [(int(W * 0.36), 0), (int(W * 0.52), 0), (int(W * 0.66), int(H * 0.92)), (int(W * 0.28), int(H * 0.92))],
        fill=rgba((180, 168, 224), 50),
    )
    img = over(img, cone.filter(ImageFilter.GaussianBlur(26)))
    img = screen(img, radial(int(W * 0.47), int(H * 0.80), 480, (150, 132, 205)), 0.3)

    pool = new_layer()
    ImageDraw.Draw(pool).ellipse([int(W * 0.24), int(H * 0.82), int(W * 0.74), int(H * 1.02)], fill=rgba((206, 198, 235), 44))
    img = over(img, pool.filter(ImageFilter.GaussianBlur(40)))

    # 帷幕
    curtain = new_layer()
    cd = ImageDraw.Draw(curtain)
    for i in range(0, W, 46):
        cd.rectangle([i, 0, i + 22, int(H * 0.86)], fill=rgba((14, 13, 20), 200))
    img = over(img, curtain.filter(ImageFilter.GaussianBlur(14)))
    img = over(img, pool.filter(ImageFilter.GaussianBlur(40)))

    seats = new_layer()
    sd = ImageDraw.Draw(seats)
    for i in range(0, W, 96):
        sd.ellipse([i, int(H * 0.93), i + 72, int(H * 1.06)], fill=rgba((9, 9, 12)))
    img = over(img, seats.filter(ImageFilter.GaussianBlur(6)))

    dust = new_layer()
    dd = ImageDraw.Draw(dust)
    for _ in range(240):
        x = rnd.randint(int(W * 0.30), int(W * 0.64))
        y = rnd.randint(int(H * 0.10), int(H * 0.86))
        r = rnd.randint(1, 3)
        dd.ellipse([x - r, y - r, x + r, y + r], fill=rgba((235, 230, 255), rnd.randint(40, 150)))
    return finish(over(img, dust), 0.55)


# ------------------------------------------------------------------ 5. 窗台
def seedling():
    img = vgrad([(0.0, (222, 226, 214)), (0.45, (198, 206, 196)), (1.0, (146, 150, 138))])

    win = new_layer()
    ImageDraw.Draw(win).rectangle([int(W * 0.10), int(H * 0.06), int(W * 0.90), int(H * 0.70)], fill=rgba((240, 242, 228)))
    img = over(img, win)
    img = screen(img, radial(int(W * 0.78), int(H * 0.24), 540, (255, 250, 225)), 0.45)

    frame = new_layer()
    fd = ImageDraw.Draw(frame)
    fd.rectangle([0, int(H * 0.71), W, H], fill=rgba((126, 120, 106)))
    fd.rectangle([0, int(H * 0.71), W, int(H * 0.735)], fill=rgba((160, 154, 138)))
    for x in (int(W * 0.10), int(W * 0.50), int(W * 0.895)):
        fd.rectangle([x - 11, int(H * 0.05), x + 11, int(H * 0.71)], fill=rgba((94, 88, 76)))
    for y in (int(H * 0.06), int(H * 0.38), int(H * 0.70)):
        fd.rectangle([int(W * 0.09), y - 10, int(W * 0.91), y + 10], fill=rgba((94, 88, 76)))
    img = over(img, frame)

    px, py = int(W * 0.30), int(H * 0.79)
    pot = new_layer()
    pd = ImageDraw.Draw(pot)
    pd.ellipse([px - 60, py + 96, px + 240, py + 150], fill=rgba((70, 66, 58), 90))
    pd.polygon([(px - 96, py), (px + 96, py), (px + 74, py + 130), (px - 74, py + 130)], fill=rgba((152, 108, 86)))
    pd.ellipse([px - 100, py - 22, px + 100, py + 22], fill=rgba((122, 86, 68)))
    pd.ellipse([px - 84, py - 16, px + 84, py + 14], fill=rgba((66, 52, 40)))
    pd.line([(px + 4, py - 40), (px + 8, py - 6)], fill=rgba((88, 132, 82)), width=6)
    pd.ellipse([px - 48, py - 98, px - 2, py - 36], fill=rgba((96, 148, 92)))
    pd.ellipse([px + 2, py - 116, px + 54, py - 42], fill=rgba((122, 172, 106)))
    img = over(img, pot)
    img = screen(img, radial(px, py - 60, 230, (210, 240, 190)), 0.2)
    return finish(img, 0.3)


# ------------------------------------------------------------------ 6. 晨光
def bloom():
    rnd = random.Random(66)
    img = vgrad([(0.0, (52, 72, 96)), (0.30, (118, 138, 140)), (0.55, (192, 176, 140)),
                 (0.74, (226, 196, 150)), (1.0, (120, 112, 84))])
    # 低角度的太阳
    img = screen(img, radial(int(W * 0.34), int(H * 0.66), 520, (255, 214, 150)), 0.75)
    img = screen(img, radial(int(W * 0.34), int(H * 0.66), 180, (255, 244, 214)), 0.8)

    rays = new_layer()
    rd = ImageDraw.Draw(rays)
    cx, cy = int(W * 0.34), int(H * 0.66)
    for i in range(9):
        a = math.radians(-96 + i * 12)
        rd.line([(cx, cy), (cx + math.cos(a) * W, cy + math.sin(a) * H)], fill=rgba((255, 236, 190), 40), width=34)
    img = over(img, rays.filter(ImageFilter.GaussianBlur(46)))

    # 远山两层
    for top, color, blur in [(0.70, (86, 96, 84), 10), (0.78, (58, 68, 56), 4)]:
        hill = new_layer()
        ImageDraw.Draw(hill).polygon(
            [(0, int(H * (top + 0.05))), (int(W * 0.28), int(H * top)), (int(W * 0.62), int(H * (top + 0.04))),
             (W, int(H * (top - 0.01))), (W, H), (0, H)], fill=rgba(color))
        img = over(img, hill.filter(ImageFilter.GaussianBlur(blur)))

    # 近处草坡
    near = new_layer()
    ImageDraw.Draw(near).polygon(
        [(-20, int(H * 0.93)), (int(W * 0.40), int(H * 0.85)), (int(W * 0.78), int(H * 0.90)), (W + 20, int(H * 0.86)),
         (W + 20, H), (-20, H)], fill=rgba((44, 54, 44)))
    img = over(img, near)

    flowers = new_layer()
    fd = ImageDraw.Draw(flowers)
    for _ in range(210):
        x, y = rnd.randint(0, W), rnd.randint(int(H * 0.84), H - 6)
        s = rnd.uniform(0.7, 1.6) * (0.5 + (y - H * 0.84) / (H * 0.16))
        r = 6.5 * s
        c = rnd.choice([(240, 230, 176), (232, 168, 176), (200, 216, 168), (248, 242, 214)])
        fd.line([(x, y), (x, y + 18 * s)], fill=rgba((70, 84, 62), 170), width=max(1, int(2 * s)))
        fd.ellipse([x - r, y - r, x + r, y + r], fill=rgba(c, 235))
        fd.ellipse([x - r * 0.34, y - r * 0.34, x + r * 0.34, y + r * 0.34], fill=rgba((255, 250, 214), 230))
    img = over(img, flowers)

    motes = new_layer()
    md = ImageDraw.Draw(motes)
    for _ in range(150):
        x, y = rnd.randint(0, W), rnd.randint(int(H * 0.10), int(H * 0.88))
        r = rnd.randint(1, 4)
        md.ellipse([x - r, y - r, x + r, y + r], fill=rgba((255, 248, 220), rnd.randint(40, 130)))
    return finish(over(img, motes.filter(ImageFilter.GaussianBlur(1))), 0.42)


def main():
    os.makedirs(OUT, exist_ok=True)
    for name, fn in [("rooftop", rooftop), ("alley", alley), ("workshop", workshop),
                     ("spotlight", spotlight), ("seedling", seedling), ("bloom", bloom)]:
        path = os.path.join(OUT, f"{name}.jpg")
        fn().convert("RGB").save(path, "JPEG", quality=92, subsampling=1, optimize=True)
        print(f"{name}.jpg  {os.path.getsize(path) / 1024:.0f} KB")


if __name__ == "__main__":
    main()
