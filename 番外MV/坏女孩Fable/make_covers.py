"""出《坏女孩》（fable5.2 版）的封面：3:4（1080×1440，抖音竖版）和 4:3（1440×1080，横版）。

排版是 MV 海报式：成片真帧整幅铺满（裁掉画面底部的字幕带），顶部压一道渐变暗带，
左上角小字写歌手，中间大字写歌名，下面一行钩子歌词。画面里不留任何多余小字。

    python3 番外MV/坏女孩Fable/make_covers.py
"""
import subprocess
import pathlib

from PIL import Image, ImageDraw, ImageEnhance, ImageFont

HERE = pathlib.Path(__file__).resolve().parent
VIDEO = HERE / "成片" / "坏女孩_fable5.2.mp4"
OUT = HERE / "发布"
FF = HERE.parent.parent / "node_modules" / "@remotion" / "compositor-linux-x64-gnu" / "ffmpeg"
FONT = HERE.parent.parent / "通用模板" / "engine" / "assets" / "fonts" / "ZCOOLKuaiLe-Regular.ttf"

# 取帧：主封面用舞池那一镜（第 40 秒）；备用用小克深夜坐在栏杆边、头顶气泡里是本鲸那一镜（第 185 秒）
MAIN_T = 40.0
ALT_T = 185.0
CROP_H = 596  # 1280×720 里上面 596 行是画面；字幕带从 596 起，整条裁掉


def frame(t):
    OUT.mkdir(exist_ok=True)
    tmp = OUT / "_tmp.png"
    subprocess.run([str(FF), "-hide_banner", "-loglevel", "error", "-ss", str(t),
                    "-i", str(VIDEO), "-frames:v", "1", "-y", str(tmp)], check=True)
    im = Image.open(tmp).convert("RGB").crop((0, 0, 1280, CROP_H))
    tmp.unlink()
    return im


def font(size):
    return ImageFont.truetype(str(FONT), size)


def text(d, xy, s, f, fill, stroke=0, stroke_fill=(10, 6, 14)):
    d.text(xy, s, font=f, fill=fill, stroke_width=stroke, stroke_fill=stroke_fill)


def full_bleed(src, W, H, cx):
    """把 1280×596 的画面按比例裁一块、放大铺满整张封面（cx 是裁块的中心横坐标）。"""
    cw = round(CROP_H * W / H)
    x0 = max(0, min(1280 - cw, round(cx - cw / 2)))
    im = src.crop((x0, 0, x0 + cw, CROP_H)).resize((W, H), Image.LANCZOS)
    im = ImageEnhance.Color(im).enhance(1.12)
    im = ImageEnhance.Contrast(im).enhance(1.04)
    return im


def top_gradient(im, depth):
    """顶部压一道渐变暗带，字才压得住。"""
    W, H = im.size
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    for y in range(depth):
        a = int(200 * (1 - y / depth))
        d.line([(0, y), (W, y)], fill=(8, 4, 16, a))
    return Image.alpha_composite(im.convert("RGBA"), ov).convert("RGB")


def pill(d, xy, s, f):
    x, y = xy
    bb = d.textbbox((0, 0), s, font=f)
    w, h = bb[2] - bb[0], bb[3] - bb[1]
    d.rounded_rectangle([x, y, x + w + 44, y + h + 26], radius=(h + 26) // 2,
                        outline=(255, 92, 138), width=3)
    d.text((x + 22, y + 13), s, font=f, fill=(255, 255, 255))


def make(ratio, src, cx, hook, path):
    W, H = (1080, 1440) if ratio == "3x4" else (1440, 1080)
    im = top_gradient(full_bleed(src, W, H, cx), int(H * 0.45))
    d = ImageDraw.Draw(im)
    if ratio == "3x4":
        pill(d, (56, 48), "徐良 / 小凌", font(42))
        text(d, (50, 130), "坏女孩", font(205), (255, 92, 138), stroke=12)
        text(d, (56, 372), hook, font(74), (255, 255, 255), stroke=6)
    else:
        pill(d, (60, 44), "徐良 / 小凌", font(46))
        text(d, (54, 122), "坏女孩", font(225), (255, 92, 138), stroke=13)
        text(d, (60, 382), hook, font(80), (255, 255, 255), stroke=6)
    im.save(path, quality=92)
    print("COVER", path.relative_to(HERE.parent.parent), im.size)


def main():
    m, a = frame(MAIN_T), frame(ALT_T)
    make("3x4", m, 420, "我喜欢坏坏的女友", OUT / "封面_3比4_主.jpg")
    make("4x3", m, 640, "我喜欢坏坏的女友", OUT / "封面_4比3_主.jpg")
    make("3x4", a, 663, "被爱的深夜我在想念", OUT / "封面_3比4_备.jpg")
    make("4x3", a, 640, "被爱的深夜我在想念", OUT / "封面_4比3_备.jpg")


if __name__ == "__main__":
    main()
