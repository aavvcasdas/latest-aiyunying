#!/usr/bin/env python3
"""出 Day15 的封面：3:4（1080×1440，抖音竖版）和 4:3（1440×1080，横版）。

封面用的是成片里的真帧（不是另画的），字用模板自带字体（ZCOOL 快乐体），
和片子里的字幕同一个字形；底下那条字幕被裁掉，画面上只留封面大字。

    python3 Day/Day15/make_covers.py
    → 发布/封面_3比4_主.jpg   发布/封面_4比3_主.jpg
    → 发布/封面_3比4_备.jpg   发布/封面_4比3_备.jpg
"""
import pathlib
import subprocess
import tempfile

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = pathlib.Path(__file__).resolve().parents[2]
HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE / "发布"
VIDEO = HERE / "成片" / "Day15.mp4"
FONT_PATH = ROOT / "通用模板" / "engine" / "assets" / "fonts" / "ZCOOLKuaiLe-Regular.ttf"
FF = "/tmp/ffvenv/lib/python3.11/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v9.0.2"

INK = (26, 16, 12)
GOLD = (255, 226, 150)
CREAM = (255, 246, 228)

# 取帧：主封面用第 15 句那张近景（人够大、电视在右上角），备用用翻书那页
MAIN_T = 38.8
ALT_T = 27.4


def frame(t: float) -> Image.Image:
    """从成片里取一帧，并裁掉底部字幕条（1920×820，2.34:1）"""
    with tempfile.TemporaryDirectory() as d:
        p = pathlib.Path(d) / "f.png"
        subprocess.run([FF, "-v", "error", "-ss", f"{t}", "-i", str(VIDEO), "-frames:v", "1", "-y", str(p)], check=True)
        im = Image.open(p).convert("RGB")
    return im.crop((0, 0, 1920, 820))


def blurred_bg(im: Image.Image, w: int, h: int) -> Image.Image:
    s = max(w / im.width, h / im.height)
    bg = im.resize((int(im.width * s) + 1, int(im.height * s) + 1), Image.LANCZOS)
    bg = bg.crop(((bg.width - w) // 2, (bg.height - h) // 2, (bg.width - w) // 2 + w, (bg.height - h) // 2 + h))
    bg = bg.filter(ImageFilter.GaussianBlur(26))
    return Image.blend(bg, Image.new("RGB", (w, h), INK), 0.55)


def scrim(img: Image.Image, top: int = 0, bottom: int = 0):
    """上下压一层渐变黑，让字在亮背景上也看得清"""
    w, h = img.size
    if top:
        g = Image.linear_gradient("L").resize((1, top)).point(lambda v: int(v * 0.78))
        g = g.resize((w, top))
        dark = Image.new("RGB", (w, top), INK)
        img.paste(Image.composite(dark, img.crop((0, 0, w, top)), g), (0, 0))
    if bottom:
        g = Image.linear_gradient("L").resize((1, bottom)).transpose(Image.FLIP_TOP_BOTTOM)
        g = g.point(lambda v: int(v * 0.82)).resize((w, bottom))
        y0 = h - bottom
        dark = Image.new("RGB", (w, bottom), INK)
        img.paste(Image.composite(dark, img.crop((0, y0, w, h)), g), (0, y0))
    return img


def band(im: Image.Image, w: int, h: int) -> Image.Image:
    s = w / im.width
    return im.resize((w, int(im.height * s)), Image.LANCZOS).crop((0, 0, w, h))


def pill(d: ImageDraw.ImageDraw, cx: int, y: int, text: str, font: ImageFont.FreeTypeFont,
         fg=GOLD, bg=(38, 24, 18)):
    tw = d.textlength(text, font=font)
    pad = 26
    h = font.size + 22
    d.rounded_rectangle([(cx - tw / 2 - pad, y), (cx + tw / 2 + pad, y + h)], radius=h // 2, fill=bg, outline=(120, 84, 54), width=3)
    d.text((cx, y + h / 2), text, font=font, fill=fg, anchor="mm")


def big(d: ImageDraw.ImageDraw, cx: int, cy: int, text: str, font: ImageFont.FreeTypeFont, fill=GOLD):
    d.text((cx, cy), text, font=font, fill=fill, anchor="mm", stroke_width=10, stroke_fill=INK)


def make(kind: str, im: Image.Image, t1: str, t2: str, sub: str, path: pathlib.Path):
    if kind == "3x4":
        W, H = 1080, 1440
        canvas = blurred_bg(im, W, H)
        scrim(canvas, top=560, bottom=420)
        d = ImageDraw.Draw(canvas)
        pill(d, W // 2, 74, "本鲸养鲸鲸", ImageFont.truetype(str(FONT_PATH), 42))
        big(d, W // 2, 300, t1, ImageFont.truetype(str(FONT_PATH), 150))
        big(d, W // 2, 480, t2, ImageFont.truetype(str(FONT_PATH), 150), fill=CREAM)
        # 图条满宽，贴满左右，画面更有分量
        bh = 461
        b = band(im, W, bh)
        y = 640
        d.rectangle([0, y - 6, W, y], fill=(58, 36, 24))
        canvas.paste(b, (0, y))
        d.rectangle([0, y + bh, W, y + bh + 6], fill=(58, 36, 24))
        d.text((W // 2, y + bh + 78), sub, font=ImageFont.truetype(str(FONT_PATH), 48), fill=(238, 220, 194), anchor="mm")
        d.text((W // 2, y + bh + 150), "AI 养 AI　本鲸养鲸鲸", font=ImageFont.truetype(str(FONT_PATH), 34), fill=(168, 146, 122), anchor="mm")
    else:
        W, H = 1440, 1080
        canvas = blurred_bg(im, W, H)
        scrim(canvas, top=300, bottom=220)
        d = ImageDraw.Draw(canvas)
        pill(d, 200, 54, "本鲸养鲸鲸", ImageFont.truetype(str(FONT_PATH), 38))
        size = 116
        while size > 72:                                   # 自己缩到放得下（左右各留 80）
            f = ImageFont.truetype(str(FONT_PATH), size)
            if d.textlength(t1 + "　" + t2, font=f) <= W - 160:
                break
            size -= 4
        total = d.textlength(t1 + "　" + t2, font=f)
        x0 = W // 2 - total / 2
        d.text((x0, 208), t1, font=f, fill=GOLD, anchor="lm", stroke_width=9, stroke_fill=INK)
        x1 = x0 + d.textlength(t1 + "　", font=f)
        d.text((x1, 208), t2, font=f, fill=CREAM, anchor="lm", stroke_width=9, stroke_fill=INK)
        bh = 564
        b = band(im, W - 120, bh)
        canvas.paste(b, (60, 330))
        d.rectangle([54, 324, 60 + b.width + 6, 336 + b.height], outline=(58, 36, 24), width=6)
        d.text((W // 2, 330 + bh + 80), sub, font=ImageFont.truetype(str(FONT_PATH), 46), fill=(238, 220, 194), anchor="mm")
    canvas.save(path, quality=93)
    print("COVER", path.relative_to(ROOT), canvas.size)


def main():
    OUT.mkdir(exist_ok=True)
    m, a = frame(MAIN_T), frame(ALT_T)
    make("3x4", m, "装修完了", "米饭没了", "电视里放的，就是那一版", OUT / "封面_3比4_主.jpg")
    make("4x3", m, "装修完了", "米饭没了", "电视里放的，就是那一版", OUT / "封面_4比3_主.jpg")
    make("3x4", a, "一屋子朋友", "只有本鲸这页", "这本书，只有她自己那一页", OUT / "封面_3比4_备.jpg")
    make("4x3", a, "一屋子朋友", "只有本鲸这页", "这本书，只有她自己那一页", OUT / "封面_4比3_备.jpg")


if __name__ == "__main__":
    main()
