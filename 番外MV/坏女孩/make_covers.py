#!/usr/bin/env python3
"""出《坏女孩》（3D 夜雨版）的封面：3:4（1080×1440，抖音竖版）和 4:3（1440×1080，横版）。

做法和 Day15 的封面同一套：**用成片里的真帧**（不是另画的），字用模板自带字体（ZCOOL 快乐体），
底部那条歌词字幕裁掉，画面上只留封面大字。取帧位置写死在下面的 MAIN_T / ALT_T。

    python3 番外MV/坏女孩/make_covers.py
    → 发布/封面_3比4_主.jpg   发布/封面_4比3_主.jpg
    → 发布/封面_3比4_备.jpg   发布/封面_4比3_备.jpg

ffmpeg 用仓库里 Remotion 自带的那一份（不需要另外装）。
"""
import pathlib
import shutil
import subprocess
import tempfile

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = pathlib.Path(__file__).resolve().parents[2]
HERE = pathlib.Path(__file__).resolve().parent
OUT = HERE / "发布"
VIDEO = HERE / "成片" / "坏女孩_3d.mp4"
FONT_PATH = ROOT / "通用模板" / "engine" / "assets" / "fonts" / "ZCOOLKuaiLe-Regular.ttf"
FF = shutil.which("ffmpeg") or str(ROOT / "node_modules" / "@remotion" / "compositor-linux-x64-gnu" / "ffmpeg")

INK = (11, 8, 17)          # 夜里的黑紫
NEON = (255, 108, 172)     # 片子里那条洋红（灯箱、剪影、眼线）
CREAM = (255, 247, 251)
DIM = (300 - 60, 176, 200)  # 说明小字：淡紫粉

# 取帧：主封面用「懒懒的靠在陌生的肩」（本鲸 + 龙娘，沙发上）；备用用化妆镜那一镜（镜中人褪了色）
MAIN_T = 125.0
ALT_T = 145.0
CROP_H = 620               # 1280×720 里上面 620 行是画面，底下 100 行是歌词条


def frame(t: float) -> Image.Image:
    """从成片里取一帧，并裁掉底部歌词条（1280×620）"""
    with tempfile.TemporaryDirectory() as d:
        p = pathlib.Path(d) / "f.png"
        subprocess.run([FF, "-v", "error", "-ss", f"{t}", "-i", str(VIDEO), "-frames:v", "1", "-y", str(p)], check=True)
        im = Image.open(p).convert("RGB")
    return im.crop((0, 0, im.width, CROP_H))


def blurred_bg(im: Image.Image, w: int, h: int) -> Image.Image:
    s = max(w / im.width, h / im.height)
    bg = im.resize((int(im.width * s) + 1, int(im.height * s) + 1), Image.LANCZOS)
    bg = bg.crop(((bg.width - w) // 2, (bg.height - h) // 2, (bg.width - w) // 2 + w, (bg.height - h) // 2 + h))
    bg = bg.filter(ImageFilter.GaussianBlur(30))
    return Image.blend(bg, Image.new("RGB", (w, h), INK), 0.62)


def scrim(img: Image.Image, top: int = 0, bottom: int = 0):
    """上下压一层渐变黑，让字在霓虹底上也看得清"""
    w, h = img.size
    if top:
        g = Image.linear_gradient("L").resize((1, top)).point(lambda v: int(v * 0.82))
        g = g.resize((w, top))
        dark = Image.new("RGB", (w, top), INK)
        img.paste(Image.composite(dark, img.crop((0, 0, w, top)), g), (0, 0))
    if bottom:
        g = Image.linear_gradient("L").resize((1, bottom)).transpose(Image.FLIP_TOP_BOTTOM)
        g = g.point(lambda v: int(v * 0.86)).resize((w, bottom))
        y0 = h - bottom
        dark = Image.new("RGB", (w, bottom), INK)
        img.paste(Image.composite(dark, img.crop((0, y0, w, h)), g), (0, y0))
    return img


def band_fit(im: Image.Image, w: int, h: int) -> Image.Image:
    """整块画面按比例放进框里（不裁人），左右用同帧的模糊底补满，再描一道细边"""
    s = min(w / im.width, h / im.height)
    f = im.resize((int(im.width * s), int(im.height * s)), Image.LANCZOS)
    box = blurred_bg(im, w, h)
    x0, y0 = (w - f.width) // 2, (h - f.height) // 2
    box.paste(f, (x0, y0))
    ImageDraw.Draw(box).rectangle([x0 - 3, y0 - 3, x0 + f.width + 2, y0 + f.height + 2], outline=(78, 36, 66), width=5)
    return box


def band(im: Image.Image, w: int, h: int, y: float = 0.5) -> Image.Image:
    """按目标比例从帧里居中裁一块再缩放（不让画面被拉长，也不留黑边）"""
    a = w / h
    bw, bh = im.width, int(im.width / a)
    if bh > im.height:
        bh = im.height
        bw = int(im.height * a)
    x0 = (im.width - bw) // 2
    y0 = int((im.height - bh) * y)
    return im.crop((x0, y0, x0 + bw, y0 + bh)).resize((w, h), Image.LANCZOS)


def pill(d: ImageDraw.ImageDraw, cx: int, y: int, text: str, font: ImageFont.FreeTypeFont, fg=CREAM, bg=(28, 16, 28)):
    tw = d.textlength(text, font=font)
    pad = 26
    h = font.size + 20
    d.rounded_rectangle([(cx - tw / 2 - pad, y), (cx + tw / 2 + pad, y + h)], radius=h // 2, fill=bg, outline=(92, 52, 78), width=3)
    d.text((cx, y + h / 2), text, font=font, fill=fg, anchor="mm")


def big(d: ImageDraw.ImageDraw, cx: int, cy: int, text: str, font: ImageFont.FreeTypeFont, fill=NEON):
    d.text((cx, cy), text, font=font, fill=fill, anchor="mm", stroke_width=10, stroke_fill=INK)


def fit(d: ImageDraw.ImageDraw, text: str, size: int, limit: int, low: int = 56) -> ImageFont.FreeTypeFont:
    """自己缩到放得下"""
    while size > low:
        f = ImageFont.truetype(str(FONT_PATH), size)
        if d.textlength(text, font=f) <= limit:
            return f
        size -= 3
    return ImageFont.truetype(str(FONT_PATH), low)


def make(kind: str, im: Image.Image, title: str, hook: str, sub: str, path: pathlib.Path, fitbox: bool = False):
    if kind == "3x4":
        W, H = 1080, 1440
        canvas = blurred_bg(im, W, H)
        scrim(canvas, top=470, bottom=360)
        d = ImageDraw.Draw(canvas)
        pill(d, W // 2, 64, "徐良 / 小凌", ImageFont.truetype(str(FONT_PATH), 42), fg=(255, 214, 232))
        big(d, W // 2, 268, title, ImageFont.truetype(str(FONT_PATH), 176))
        f = fit(d, hook, 86, W - 150)
        d.text((W // 2, 408), hook, font=f, fill=CREAM, anchor="mm", stroke_width=8, stroke_fill=INK)
        bh = 676
        b = band(im, W, bh, y=0.42)
        y = 486
        d.rectangle([0, y - 6, W, y], fill=(66, 30, 56))
        canvas.paste(b, (0, y))
        d.rectangle([0, y + bh, W, y + bh + 6], fill=(66, 30, 56))
        d.text((W // 2, y + bh + 118), sub, font=ImageFont.truetype(str(FONT_PATH), 48), fill=(240, 216, 234), anchor="mm")
        d.text((W // 2, y + bh + 198), "番外 MV　·　AI 养 AI　本鲸养鲸鲸", font=ImageFont.truetype(str(FONT_PATH), 32), fill=(158, 128, 152), anchor="mm")
    else:
        W, H = 1440, 1080
        bw = 1240
        bh = int(bw * im.height / im.width) if not fitbox else 612
        canvas = blurred_bg(im, W, H)
        scrim(canvas, top=300, bottom=240)
        d = ImageDraw.Draw(canvas)
        pill(d, 190, 46, "徐良 / 小凌", ImageFont.truetype(str(FONT_PATH), 38), fg=(255, 214, 232))
        f = fit(d, title, 140, 520, low=90)
        d.text((76, 244), title, font=f, fill=NEON, anchor="lm", stroke_width=9, stroke_fill=INK)
        x = 76 + d.textlength(title, font=f) + 44
        f2 = fit(d, hook, 74, W - x - 80, low=40)
        d.text((x, 248), hook, font=f2, fill=CREAM, anchor="lm", stroke_width=7, stroke_fill=INK)
        y = 330
        b = band_fit(im, bw, bh) if fitbox else band(im, bw, bh)
        canvas.paste(b, ((W - bw) // 2, y))
        d.text((W // 2, y + bh + 78), sub, font=ImageFont.truetype(str(FONT_PATH), 44), fill=(240, 216, 234), anchor="mm")
    OUT.mkdir(exist_ok=True)
    canvas.save(path, quality=93)
    print("COVER", path.relative_to(ROOT), canvas.size)


def main():
    m, a = frame(MAIN_T), frame(ALT_T)
    make("3x4", m, "坏女孩", "慵懒的靠在陌生的肩", "黑色的眼线　你的指间", OUT / "封面_3比4_主.jpg")
    make("4x3", m, "坏女孩", "慵懒的靠在陌生的肩", "黑色的眼线　你的指间", OUT / "封面_4比3_主.jpg")
    make("3x4", a.crop((380, 0, 1180, CROP_H)), "坏女孩", "明明是为你才会改变", "却回不到从前", OUT / "封面_3比4_备.jpg")
    make("4x3", a.crop((380, 0, 1180, CROP_H)), "坏女孩", "明明是为你才会改变", "却回不到从前", OUT / "封面_4比3_备.jpg", fitbox=True)


if __name__ == "__main__":
    main()
