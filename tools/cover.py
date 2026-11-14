#!/usr/bin/env python3
"""封面模板：一张剧照 + **只写主题（片名）**。

用户 2026-11-14 的要求：
  · 封面上只出现主题——片名本身。不要「AI养AI」这类品牌角标，也不要平台名、账号名、二维码、副标题。
  · 出两种比例：3:4（1080×1440）与 4:3（1440×1080）。

画法：
  · 竖版（3:4）：剧照等比放到满宽，上下留白用同一张剧照放大模糊压暗做底；片名压在剧照底部的一条暗带上。
  · 横版（4:3）：剧照裁成 4:3 铺满；片名同样压在底部暗带上。
  · 底部暗带正好盖住 MV 画面里自带的字幕条——封面上不留歌词碎片，只留片名。

用法：
  python3 tools/cover.py --still <剧照.jpg> --title 把回忆拼好给你 \
      --out 番外MV/xxx/封面 --name 把回忆拼好_opus5.5max
产物：<out>/<name>_3比4.png、<out>/<name>_4比3.png
"""
import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
FONT = ROOT / '通用模板/engine/assets/fonts/ZCOOLKuaiLe-Regular.ttf'


def cover_crop(img: Image.Image, w: int, h: int) -> Image.Image:
    """等比放大到铺满，再居中裁切（不拉伸变形）。"""
    sw, sh = img.size
    scale = max(w / sw, h / sh)
    nw, nh = max(w, round(sw * scale)), max(h, round(sh * scale))
    img = img.resize((nw, nh), Image.LANCZOS)
    return img.crop(((nw - w) // 2, (nh - h) // 2, (nw - w) // 2 + w, (nh - h) // 2 + h))


def shade(img: Image.Image, alpha: float) -> Image.Image:
    return Image.blend(img, Image.new('RGB', img.size, (6, 8, 18)), alpha)


def band(canvas: Image.Image, top: int, height: int, strength: int = 150, feather: int = 54) -> Image.Image:
    """底部暗带：在 feather 像素内迅速压到 strength，把 MV 自带的字幕条彻底盖住，给片名垫底。"""
    w, h = canvas.size
    mask = Image.new('L', (w, h), 0)
    d = ImageDraw.Draw(mask)
    feather = max(1, min(feather, height))
    for i in range(feather):
        a = int(strength * (i / (feather - 1)) ** 0.7) if feather > 1 else strength
        d.rectangle([0, top + i, w, top + i], fill=a)
    d.rectangle([0, top + feather, w, h], fill=strength)
    dark = Image.new('RGB', (w, h), (5, 6, 14))
    return Image.composite(dark, canvas, mask)


def fit_font(text: str, max_w: int, start: int, min_size: int = 36) -> ImageFont.FreeTypeFont:
    size = start
    while size > min_size:
        f = ImageFont.truetype(str(FONT), size)
        b = f.getbbox(text)
        if b[2] - b[0] <= max_w:
            return f
        size -= 4
    return ImageFont.truetype(str(FONT), min_size)


def draw_title(img: Image.Image, title: str, cy: int, size: int, max_w_ratio: float, style: dict) -> Image.Image:
    w, h = img.size
    font = fit_font(title, int(w * max_w_ratio), size)
    d = ImageDraw.Draw(img)
    b = d.textbbox((0, 0), title, font=font)
    tw, th = b[2] - b[0], b[3] - b[1]
    x = (w - tw) // 2 - b[0]
    y = cy - th // 2 - b[1]

    shadow = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).text((x + style['shadow_off'], y + style['shadow_off']), title,
                                font=font, fill=(0, 0, 0, 190))
    shadow = shadow.filter(ImageFilter.GaussianBlur(style['shadow_blur']))
    img = Image.alpha_composite(img.convert('RGBA'), shadow)

    d = ImageDraw.Draw(img)
    d.text((x, y), title, font=font, fill=tuple(style['color']),
           stroke_width=style['stroke'], stroke_fill=tuple(style['stroke_fill']))
    return img.convert('RGB')


def build(still: Path, title: str, w: int, h: int, style: dict) -> Image.Image:
    src = Image.open(still).convert('RGB')

    if style['layout'] == 'letterbox':
        fw = int(w * style['fg_w'])
        fh = round(src.height * fw / src.width)
        fy = int(h * style['fg_cy']) - fh // 2
        fg = src.resize((fw, fh), Image.LANCZOS)

        # 上下留白：用剧照自身镜像铺满（接缝处像素连续），重糊当底
        pad = Image.new('RGB', (w, h))
        pad.paste(fg.crop((0, 0, fw, min(h, fh))), (0, fy))
        if fy > 0:  # 上方：主图顶部镜像
            top = fg.crop((0, 0, fw, fy)).transpose(Image.FLIP_TOP_BOTTOM)
            pad.paste(top, (0, fy - top.height))
        bot_h = h - (fy + fh)
        if bot_h > 0:  # 下方：主图底部镜像
            bot = fg.crop((0, max(0, fh - bot_h), fw, fh)).transpose(Image.FLIP_TOP_BOTTOM)
            pad.paste(bot, (0, fy + fh))
        canvas = pad.filter(ImageFilter.GaussianBlur(22))

        # 留白区压暗（接缝处为 0，不留硬边）：上浅下深，底部正好垫片名
        ramp = Image.new('L', (1, h))
        px = ramp.load()
        for y in range(h):
            if y < fy:
                a = style['pad_top'] * (1 - y / max(1, fy)) ** 1.4
            elif y > fy + fh:
                a = style['pad_bottom'] * ((y - fy - fh) / max(1, bot_h)) ** 0.9
            else:
                a = 0
            px[0, y] = int(255 * a)
        mask = ramp.resize((w, h))
        canvas = Image.composite(Image.new('RGB', (w, h), (7, 8, 16)), canvas, mask)
        canvas.paste(fg, (0, fy))
        band_top = int(fy + fh * (style['band_top'] - 1)) if style['band_top'] > 1 else fy + fh
        band_top = max(band_top, fy + int(fh * min(1.0, style['band_top'])))
        canvas = band(canvas, band_top, h - band_top, strength=style['band'], feather=style['feather'])
        cy = band_top + int((h - band_top) * style.get('title_at', 0.42)) + style['title_dy']
    else:
        canvas = shade(cover_crop(src, w, h), 0.05)
        band_top = int(h * style['band_top'])
        canvas = band(canvas, band_top, h - band_top, strength=style['band'], feather=style['feather'])
        cy = band_top + (h - band_top) // 2 + style['title_dy']

    return draw_title(canvas, title, cy, int(h * style['size']), style['max_w'], style)


STYLES = {
    '3x4': dict(layout='letterbox', fg_w=1.0, fg_cy=0.45, band_top=1.0, band=238, feather=240, title_at=0.34, pad_top=0.46, pad_bottom=0.62, size=0.085, max_w=0.84,
                title_dy=0, color=(255, 252, 244), stroke=3, stroke_fill=(14, 18, 40),
                shadow_off=6, shadow_blur=12),
    '4x3': dict(layout='fill', band_top=0.79, band=206, feather=170, size=0.105, max_w=0.82,
                title_dy=0, color=(255, 252, 244), stroke=3, stroke_fill=(14, 18, 40),
                shadow_off=6, shadow_blur=12),
}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument('--still', required=True)
    ap.add_argument('--title', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--name', required=True)
    args = ap.parse_args()

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    for tag, (w, h) in {'3x4': (1080, 1440), '4x3': (1440, 1080)}.items():
        img = build(Path(args.still), args.title, w, h, STYLES[tag])
        path = out / f'{args.name}_{tag.replace("x", "比")}.png'
        img.save(path)
        print(f'✓ {path}  {img.size[0]}×{img.size[1]}')


if __name__ == '__main__':
    main()
