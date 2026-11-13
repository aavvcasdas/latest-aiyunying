"""Build deterministic, transparent motion assets from the project's pixel cast."""
from pathlib import Path
import base64
import difflib
import hashlib
import json
import math
import shutil
import struct
import sys
import zipfile
import zlib

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / ".python-deps"))
from PIL import Image, ImageDraw
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / ".reference" / "通用模板"
PUBLIC = ROOT / "public"
ASSETS = PUBLIC / "assets" / "characters"
DOWNLOADS = PUBLIC / "downloads"
PACKAGE = ROOT / ".motion-package"
SIZE = 128
FRAMES = 24
DURATIONS = [80, 90, 80] * 8
BASE_COMMIT = "2779ffd5e407e39f8acee50bc274de2fa8beeaa7"

CAST = [
    ("whale", "鲸鱼娘", "DeepSeek", "蓝白女仆装 / 鲸鳍与鲸尾", "whale_idle", "whale_blink", "walk_whale_", "p_whale_neutral", "#7398d8", [("offer_rice", "递出饭碗", "饭先推给更饿的人"), ("tail_beat", "鲸尾打拍", "尾巴轻轻跟着节奏")]),
    ("gpt", "龙娘", "GPT", "白发龙角 / 淡紫礼服", "gpt_boss_idle", "gpt_boss_blink", "gpt_fly_", "p_gpt_neutral", "#a79ac7", [("hourglass", "举起沙漏", "接任务前先看两只沙漏"), ("shield", "展翼守护", "替同伴接住复杂任务")]),
    ("claude", "小克", "Claude", "橘色长发 / 花饰与书", "claude_front_0", "claude_front_1", "walk_claude_", "p_claude_neutral", "#db9b67", [("read", "认真翻书", "听完以后再改一个字"), ("tea", "端杯思考", "留一点时间，也留一杯茶")]),
    ("gemini", "猫猫", "Gemini", "蓝紫双马尾 / 异色瞳", "gemini_front_0", "gemini_front_1", "walk_gemini_", "p_gemini", "#b2a2db", [("clock", "对照时钟", "两个看法，最后选一个"), ("paint", "提笔创作", "把新点子画出来")]),
    ("kimi", "月球少女", "Kimi", "银紫发 / 月亮元素", "kimi_front_0", "kimi_front_1", "walk_kimi_", "p_kimi", "#9da6d1", [("scroll", "展开卷轴", "找回那句漏掉的旧话"), ("bookmark", "夹好书签", "把重要细节留在这里")]),
    ("doubao", "豆包", "Seed", "短发 / 温暖的陪伴者", "doubao_cage_0", "doubao_cage_1", "walk_doubao_big_", "p_doubao_neutral", "#c5a18e", [("basket", "递出篮子", "先陪你写出第一句"), ("dance", "轻快踩拍", "暖场之后，再退到一旁")]),
    ("qwen", "千问", "Qwen", "中式衣装 / 扇子", "qwen_front_0", "qwen_front_1", "walk_qwen_", "p_qwen", "#95accb", [("fan", "轻摇折扇", "先排好顺序，再动手"), ("serve_tea", "茶会邀请", "茶会东道主，轻声请入座")]),
    ("zai", "小狐狸", "GLM", "黑发狐耳 / 黑白衣装", "zai_front_0", "zai_front_1", "walk_zai_", "p_zai", "#9b9aa9", [("abacus", "拨动算盘", "先把单位和标准对齐"), ("wake", "睡醒认真", "听见问题，马上竖起耳朵")]),
    ("grok", "Grok", "Grok", "金发 / 黑色礼服与角饰", "grok_front_0", "grok_front_1", "walk_grok_", "p_grok", "#d5ac5d", [("verify", "放大镜查证", "先看看这条消息是谁说的"), ("phone", "核对消息", "发布之前，再看一次来源")]),
]
COMMON = [
    ("idle", "待机呼吸", "基础动作", "自然呼吸，发梢轻轻摆动"),
    ("walk", "轻快行走", "基础动作", "重排步态，统一脚底基线"),
    ("wave", "挥手招呼", "基础动作", "抬手、挥动，再自然收回"),
    ("talk", "开口说话", "基础动作", "有节奏的手势与身体起伏"),
    ("bow", "礼貌鞠躬", "基础动作", "缓入低头，停顿后回正"),
    ("sit", "安静坐下", "基础动作", "重心下移，整理裙摆"),
    ("happy", "开心雀跃", "情绪表达", "预备、起跳、轻轻落地"),
    ("think", "歪头思考", "情绪表达", "偏头停顿，视线轻轻转移"),
    ("surprise", "惊讶后退", "情绪表达", "短促后仰，缓慢恢复"),
    ("jump", "活力跳跃", "情绪表达", "落地缓冲，发梢延迟跟随"),
]


def crop(key):
    x, y, w, h = META["s"][key]
    return ATLAS.crop((x, y, x + w, y + h))


def normalized(key, char_id):
    im = crop(key)
    if key.startswith("gpt_boss"):
        im = im.resize((round(im.width * .55), round(im.height * .55)), Image.Resampling.NEAREST)
    return im


def ease(u):
    u = max(0, min(1, u))
    return u * u * (3 - 2 * u)


def envelope(t, start=.08, peak=.32, hold=.58, end=.92):
    if t < peak:
        return ease((t - start) / (peak - start))
    if t < hold:
        return 1
    return 1 - ease((t - hold) / (end - hold))


def articulate(im, phase, action, power):
    """Move head, fabric and lower body independently, without alpha blending."""
    src = np.asarray(im)
    h, w = im.height, im.width
    dst = np.zeros_like(src)
    for y in range(h):
        v = y / h
        hair = math.sin(phase + v * 4) * (1.3 if v < .65 else .55)
        tilt = (1 - v) * power if action in ("think", "bow", "surprise") else 0
        dx = round(hair + tilt)
        if dx >= 0:
            dst[y, dx:] = src[y, :w - dx] if dx else src[y]
        else:
            dst[y, :w + dx] = src[y, -dx:]
    return Image.fromarray(dst)


def arm_motion(im, phase, amount):
    # Keep the original pixels of the visible sleeve and hand together.
    w, h = im.size
    region = (round(w * .72), round(h * .43), w, round(h * .76))
    arm = im.crop(region)
    body = im.copy()
    body.paste((0, 0, 0, 0), region)
    angle = amount * (23 + math.sin(phase * 2) * 17)
    rotated = arm.rotate(angle, Image.Resampling.NEAREST, expand=True)
    body.alpha_composite(rotated, (region[0] - max(0, rotated.width - arm.width) // 2, region[1] - round(amount * 4)))
    return body


def draw_prop(canvas, kind, phase, e, color):
    if e < .03:
        return
    d = ImageDraw.Draw(canvas)
    cx, cy = 81 + round(e * 6), 91 - round(e * 3)
    ink, paper = "#455273", "#fff7e8"
    if kind == "offer_rice":
        cx += round(e * 8)
        cy -= 6
        d.ellipse((cx - 13, cy - 5, cx + 13, cy + 5), fill=ink)
        d.polygon([(cx - 13, cy), (cx + 13, cy), (cx + 8, cy + 11), (cx - 8, cy + 11)], fill="#6394d5", outline=ink)
        d.ellipse((cx - 11, cy - 4, cx + 11, cy + 3), fill=paper)
        for x in range(cx - 8, cx + 9, 4):
            d.line((x, cy - 2, x + 1, cy), fill="#d5dff1")
        d.line((cx - 7, cy + 8, cx + 7, cy + 8), fill="#b9dbf1", width=2)
    elif kind == "hourglass":
        cx, cy = 86, 73 - round(e * 10)
        d.polygon([(cx - 8, cy - 12), (cx + 8, cy - 12), (cx + 4, cy - 4), (cx + 1, cy), (cx + 5, cy + 5), (cx + 8, cy + 12), (cx - 8, cy + 12), (cx - 5, cy + 5), (cx - 1, cy), (cx - 4, cy - 4)], fill="#dbe6f5", outline=ink)
        d.rectangle((cx - 10, cy - 15, cx + 10, cy - 12), fill="#c29a60")
        d.rectangle((cx - 10, cy + 12, cx + 10, cy + 15), fill="#c29a60")
        d.polygon([(cx - 5, cy + 10), (cx + 5, cy + 10), (cx, cy + 3)], fill="#e7b96e")
        d.line((cx, cy - 5, cx, cy + 4), fill="#e7b96e")
    elif kind in ("read", "scroll", "bookmark"):
        d.polygon([(cx - 23, cy - 8), (cx - 3, cy - 5), (cx + 17, cy - 10), (cx + 17, cy + 12), (cx - 3, cy + 16), (cx - 23, cy + 10)], fill=paper, outline=ink)
        d.line((cx - 3, cy - 5, cx - 3, cy + 15), fill="#b2a196")
        for i in range(3):
            yy = cy - 2 + i * 4
            d.line((cx - 19, yy, cx - 7, yy + 2), fill="#b7b2ac")
            d.line((cx + 1, yy, cx + 13, yy - 3), fill="#b7b2ac")
        if kind == "bookmark":
            d.polygon([(cx + 6, cy - 10), (cx + 10, cy - 11), (cx + 10, cy + 4), (cx + 8, cy + 2), (cx + 6, cy + 5)], fill="#9d9bd3")
        if kind == "read":
            turn = math.sin(phase * 2) * 9
            d.polygon([(cx - 3, cy - 5), (cx + turn, cy - 10), (cx + turn, cy + 11), (cx - 3, cy + 15)], fill="#fffdf8", outline="#d7cabc")
        if kind == "scroll":
            d.rectangle((cx - 25, cy - 10, cx - 22, cy + 13), fill="#c5ae8c", outline=ink)
            d.rectangle((cx + 17, cy - 12, cx + 20, cy + 14), fill="#c5ae8c", outline=ink)
    elif kind in ("tea", "serve_tea"):
        cx -= 3
        d.ellipse((cx - 14, cy + 10, cx + 16, cy + 14), fill="#e1dfe9", outline=ink)
        d.ellipse((cx + 7, cy - 1, cx + 15, cy + 7), outline=ink, width=2)
        d.rectangle((cx - 9, cy - 5, cx + 8, cy + 8), fill="#fff8ec", outline=ink)
        d.ellipse((cx - 9, cy - 7, cx + 8, cy - 1), fill="#ad7753", outline=ink)
        steam = round(math.sin(phase) * 2)
        d.line((cx - 3, cy - 11, cx + steam, cy - 15, cx - 2, cy - 19), fill="#bcb8cb", width=1)
    elif kind == "clock":
        for x in [cx - 17, cx + 7]:
            d.ellipse((x - 10, cy - 13, x + 10, cy + 7), fill=paper, outline=ink, width=2)
            d.line((x, cy - 9, x, cy - 3, x + (5 if x < cx else -5), cy), fill=ink, width=1)
    elif kind == "paint":
        d.ellipse((cx - 18, cy - 2, cx + 8, cy + 14), fill="#e5c397", outline=ink)
        for x, co in [(cx - 12, "#9cbbe8"), (cx - 5, "#d5a8cb"), (cx + 2, "#d6bd70")]:
            d.rectangle((x, cy + 3, x + 3, cy + 6), fill=co)
        d.line((cx + 10, cy + 5, cx + 17, cy - 19), fill="#a5784a", width=3)
        d.polygon([(cx + 15, cy - 17), (cx + 19, cy - 17), (cx + 19, cy - 24)], fill="#8a9ed2")
    elif kind == "basket":
        d.arc((cx - 14, cy - 13, cx + 13, cy + 10), 180, 360, fill="#ae8052", width=3)
        d.polygon([(cx - 17, cy), (cx + 16, cy), (cx + 12, cy + 17), (cx - 12, cy + 17)], fill="#d9ae79", outline="#946c47")
        for yy in range(cy + 3, cy + 16, 4):
            d.line((cx - 12, yy, cx + 12, yy), fill="#bc9160")
        d.polygon([(cx - 15, cy), (cx + 14, cy), (cx + 8, cy + 7), (cx, cy + 3), (cx - 8, cy + 7)], fill="#d6979e")
    elif kind == "fan":
        cx, cy = 88, 96
        d.pieslice((cx - 24, cy - 36, cx + 24, cy + 12), 203, 337, fill="#c9d9ed", outline=ink)
        for angle in range(205, 338, 22):
            a = math.radians(angle)
            d.line((cx, cy - 12, cx + round(23 * math.cos(a)), cy - 12 + round(23 * math.sin(a))), fill="#93aac6")
        d.line((cx, cy - 12, cx, cy + 3), fill=ink, width=2)
    elif kind == "abacus":
        d.rectangle((cx - 24, cy - 7, cx + 17, cy + 15), fill="#cfa976", outline=ink, width=2)
        for xx in range(cx - 17, cx + 14, 7):
            d.line((xx, cy - 4, xx, cy + 12), fill=ink)
            off = round(math.sin(phase + xx) * 2)
            for yy in [cy - 1 + off, cy + 6 + off]:
                d.ellipse((xx - 3, yy - 2, xx + 3, yy + 2), fill="#705d66")
    elif kind == "verify":
        cx += round(math.sin(phase) * 4)
        cy -= 11
        d.ellipse((cx - 11, cy - 14, cx + 11, cy + 8), fill="#dbe8ee", outline="#a27d4d", width=3)
        d.line((cx + 8, cy + 6, cx + 17, cy + 17), fill="#725842", width=5)
        d.line((cx - 5, cy - 8, cx, cy - 11), fill="white", width=2)
    elif kind == "phone":
        d.rounded_rectangle((cx - 7, cy - 21, cx + 9, cy + 5), radius=3, fill="#49465a", outline="#d2b26f")
        d.rectangle((cx - 4, cy - 17, cx + 6, cy), fill="#d6e4eb")
        for yy in range(cy - 13, cy - 2, 4):
            d.line((cx - 2, yy, cx + 4, yy), fill="#93a6b4")
    elif kind == "shield":
        # Wings are costume silhouettes behind the original arms, not fake hands.
        for side in [-1, 1]:
            x = 64 + side * 24
            spread = round(15 * e)
            d.polygon([(x, 75), (x + side * (17 + spread), 48), (x + side * (12 + spread), 83), (x + side * 7, 77), (x, 91)], fill="#c9bfdf", outline="#8c80a9")
    elif kind == "tail_beat":
        x = 87 + round(math.sin(phase * 2) * 5)
        d.line((78, 114, x, 111, x + 12, 103), fill="#416d9f", width=5)
        d.polygon([(x + 10, 105), (x + 11, 96), (x + 17, 100), (x + 23, 95), (x + 21, 105)], fill="#72a7cf", outline="#416d9f")


def render(char, action, i):
    cid, _, _, _, idle, blink, walk, _, color, _ = char
    t, phase = i / FRAMES, i / FRAMES * math.tau
    e = envelope(t)
    key = blink if i in (17, 18) else idle
    if action == "walk":
        count = 2 if cid == "gpt" else 8
        key = f"{walk}{int(t * count * 2) % count}"
    elif cid == "whale" and action in ("wave", "talk", "offer_rice"):
        key = "whale_wave" if action == "wave" and e > .1 else "whale_point" if e > .1 else idle
    elif action in ("think", "bow", "sit", "wake") and .2 < t < .7:
        key = blink
    im = normalized(key, cid)
    power = {"think": 5 * e, "bow": 8 * e, "surprise": -6 * e}.get(action, 0)
    im = articulate(im, phase, action, power)
    if action in ("wave", "talk") and cid != "whale":
        im = arm_motion(im, phase, e * (1 if action == "wave" else .55))
    bob = 0
    shift, lift, angle = 0, 0, 0
    sx, sy = 1, 1
    if action == "idle":
        sy = 1 + .012 * math.sin(phase)
    if action == "walk":
        lift = round(abs(math.sin(phase * 4)) * 2)
    elif action in ("happy", "jump", "dance"):
        jumps = 2 if action in ("happy", "dance") else 1
        j = max(0, math.sin(phase * jumps - .6))
        lift = round(j * (13 if action == "jump" else 7))
        angle = math.sin(phase * jumps) * (5 if action == "dance" else 2)
        sy = 1 - max(0, math.sin(phase * jumps + .5)) * .035
    elif action == "bow":
        sy = 1 - e * .12
        lift = -round(e * 2)
        angle = -3 * e
    elif action == "think":
        angle = 5 * e
    elif action == "surprise":
        shift = round(-5 * e)
        angle = -5 * e
        sy = 1 + .035 * e
        lift = round(e * 4)
    elif action == "sit":
        sy = 1 - .19 * e
        sx = 1 + .035 * e
    elif action == "talk":
        lift = round(abs(math.sin(phase * 3)) * 2)
        angle = math.sin(phase * 2) * 1.5
    elif action == "wake":
        sy = .97 + .03 * e
        lift = round(e * 3)
    if sx != 1 or sy != 1:
        im = im.resize((round(im.width * sx), round(im.height * sy)), Image.Resampling.NEAREST)
    if angle:
        im = im.rotate(angle, Image.Resampling.NEAREST, expand=True)
    out = Image.new("RGBA", (SIZE, SIZE))
    if action == "shield":
        draw_prop(out, action, phase, e, color)
    out.alpha_composite(im, ((SIZE - im.width) // 2 + shift, SIZE - im.height - lift + bob - 1))
    if action not in ("shield", "dance", "wake"):
        draw_prop(out, action, phase, e, color)
    return out


def save_gif(frames, path):
    # One palette for the entire cycle prevents color flicker between frames.
    contact = Image.new("RGB", (SIZE * len(frames), SIZE), "#f5f2f9")
    for i, frame in enumerate(frames):
        contact.paste(frame.convert("RGB"), (i * SIZE, 0))
    palette = contact.quantize(colors=254, method=Image.Quantize.MEDIANCUT)
    pal = palette.getpalette()[:762] + [0, 0, 0, 0, 0, 0]
    template = Image.new("P", (1, 1))
    template.putpalette(pal)
    indexed = []
    for frame in frames:
        fr = frame.convert("RGB").quantize(palette=template, dither=Image.Dither.NONE)
        arr = np.asarray(fr).copy()
        arr[np.asarray(frame)[:, :, 3] < 128] = 255
        fr = Image.fromarray(arr).convert("P")
        fr.putpalette(pal)
        fr.info["transparency"] = 255
        indexed.append(fr.resize((256, 256), Image.Resampling.NEAREST))
    indexed[0].save(path, save_all=True, append_images=indexed[1:], duration=DURATIONS, loop=0, transparency=255, disposal=2, optimize=False)


def png_bytes(im):
    """Use unfiltered RGBA PNGs, also readable by the source repo's tests."""
    def chunk(kind, data):
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data))
    w, h = im.size
    b = im.tobytes()
    raw = b"".join(b"\0" + b[y * w * 4:(y + 1) * w * 4] for y in range(h))
    return b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0)) + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b"")


def generate():
    ASSETS.mkdir(parents=True, exist_ok=True)
    DOWNLOADS.mkdir(parents=True, exist_ok=True)
    PACKAGE.mkdir(parents=True, exist_ok=True)
    motion_data = {}
    manifest = {"version": "2.0.0", "baseCommit": BASE_COMMIT, "fps": 12, "frames": FRAMES, "duration": 2000, "cellSize": SIZE, "characters": []}
    for char in CAST:
        cid, name, model, desc, idle, _, _, portrait, color, signatures = char
        target = ASSETS / cid
        target.mkdir(exist_ok=True)
        actions = COMMON + [(key, title, "专属动作", note) for key, title, note in signatures]
        avatar = crop(portrait)
        avatar.save(target / "avatar.png")
        original = Image.new("RGBA", (SIZE, SIZE))
        im = normalized(idle, cid)
        original.alpha_composite(im, ((SIZE - im.width) // 2, SIZE - im.height - 1))
        original.save(target / "original.png")
        entries = []
        for action, title, group, note in actions:
            frames = [render(char, action, i) for i in range(FRAMES)]
            strip = Image.new("RGBA", (SIZE * FRAMES, SIZE))
            for i, frame in enumerate(frames):
                strip.paste(frame, (i * SIZE, 0))
                # Crop transparent headroom symmetrically around the fixed center.
                # Keeping the bottom edge preserves the world-space foot anchor.
                bounds = frame.getbbox()
                half = max(SIZE // 2 - bounds[0], bounds[2] - SIZE // 2)
                cell = frame.crop((SIZE // 2 - half, bounds[1], SIZE // 2 + half, SIZE))
                data = base64.b64encode(zlib.compress(cell.tobytes(), 9)).decode("ascii")
                motion_data[f"motion_{cid}_{action}_{i}"] = [cell.width, cell.height, data]
            strip.save(target / f"{action}.png", optimize=True)
            save_gif(frames, target / f"{action}.gif")
            frames[0].save(target / f"{action}-poster.png")
            entries.append({"id": action, "name": title, "category": group, "description": note, "gifBytes": (target / f"{action}.gif").stat().st_size})
        manifest["characters"].append({"id": cid, "name": name, "model": model, "description": desc, "color": color, "actions": entries})
        print(f"Built {cid}: {len(entries)} actions", flush=True)
    (ASSETS.parent / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2))
    (ROOT / "src" / "catalog.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2))
    (PACKAGE / "motion-v2.json").write_text(json.dumps(motion_data, separators=(",", ":")))
    (PACKAGE / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2))
    return manifest


def make_patch():
    original_actor = (SOURCE / "engine" / "actors.ts").read_text()
    method = '''  /** Deterministic motion-v2 playback. GIFs are for preview; rendering uses atlas cells. */
  motion(action: string, T: number, rate = 1, loop = true): this {
    const prefix = `motion_${this.id}_${action}_`;
    const n = framesIn(prefix, this.atlas.rects);
    if (!n) throw new Error(`[motion-v2] Missing sequence: ${prefix}`);
    if (!Number.isFinite(T) || !Number.isFinite(rate) || rate <= 0) {
      throw new Error('[motion-v2] Time must be finite and playback rate must be positive');
    }
    const raw = Math.floor(T * 12 * rate);
    const frame = loop ? cycleIndex(raw, n, prefix) : Math.max(0, Math.min(n - 1, raw));
    return this.set(`${prefix}${frame}`);
  }

'''
    modified_actor = original_actor.replace("  /** 步态：每格固定", method + "  /** 步态：每格固定", 1)
    original_bake = (SOURCE / "cast" / "bake_atlas.mjs").read_text()
    modified_bake = original_bake.replace("const rgba = Buffer.alloc(W * H * 4);", "const motionPath = path.join(PIXEL_MV, 'motion-v2.json');\nconst motionCells = fs.existsSync(motionPath) ? JSON.parse(fs.readFileSync(motionPath, 'utf8')) : {};\nconst rgba = Buffer.alloc(W * H * 4);", 1)
    modified_bake = modified_bake.replace("  const spr = getBakedSprite(key);", """  const motion = motionCells[key];
  if (motion) {
    if (motion[0] !== w || motion[1] !== h || x0 < 0 || y0 < 0 || x0 + w > W || y0 + h > H) {
      throw new Error(`[motion-v2] Invalid atlas rectangle: ${key}`);
    }
    const pixels = zlib.inflateSync(Buffer.from(motion[2], 'base64'));
    if (pixels.length !== w * h * 4) throw new Error(`[motion-v2] Invalid pixels: ${key}`);
    for (let y = 0; y < h; y++) pixels.copy(rgba, ((y0 + y) * W + x0) * 4, y * w * 4, (y + 1) * w * 4);
    continue;
  }
  const spr = getBakedSprite(key);""", 1)
    original_tests = (SOURCE / "tests" / "cast.test.mjs").read_text()
    modified_tests = original_tests.replace("assert.equal(Object.keys(ATLAS_META.s).length, 121);", "assert.equal(Object.keys(ATLAS_META.s).length, 121 + 2592);", 1)
    modified_tests += '''
test('motion-v2: complete sequences, deterministic time, finite input and clamped one-shot playback', () => {
  const atlas = fakeAtlas();
  for (const id of CHARS) {
    const actor = new Actor(atlas, id);
    for (const name of ['idle', 'walk', 'wave', 'talk', 'bow', 'sit', 'happy', 'think', 'surprise', 'jump']) {
      const prefix = `motion_${id}_${name}_`;
      assert.equal(framesIn(prefix), 24);
      for (const T of [-3, -.01, 0, .3, 1, 2, 10]) {
        const first = actor.motion(name, T).probe().key;
        actor.motion(name, T + .5);
        assert.equal(actor.motion(name, T).probe().key, first);
        assert.ok(ATLAS_META.s[first]);
      }
      assert.equal(actor.motion(name, -1, 1, false).probe().key, `${prefix}0`);
      assert.equal(actor.motion(name, 9, 1, false).probe().key, `${prefix}23`);
    }
    assert.throws(() => actor.motion('not-an-action', 0), /Missing sequence/);
    for (const T of [NaN, Infinity, -Infinity]) assert.throws(() => actor.motion('idle', T), /finite/);
    for (const rate of [0, -1, NaN, Infinity]) assert.throws(() => actor.motion('idle', 0, rate), /positive/);
  }
});
'''
    patch = ""
    for relative, old, new in [("通用模板/engine/actors.ts", original_actor, modified_actor), ("通用模板/cast/bake_atlas.mjs", original_bake, modified_bake), ("通用模板/tests/cast.test.mjs", original_tests, modified_tests)]:
        patch += f"diff --git a/{relative} b/{relative}\n"
        patch += "".join(difflib.unified_diff(old.splitlines(True), new.splitlines(True), fromfile=f"a/{relative}", tofile=f"b/{relative}"))
    (DOWNLOADS / "motion-v2.patch").write_text(patch)
    (PACKAGE / "motion-v2.patch").write_text(patch)


def package():
    make_patch()
    for source, name in [(ROOT / "tools" / "install-motion-v2.mjs", "install-motion-v2.mjs"), (ROOT / "docs" / "人物动作替换指南.md", "人物动作替换指南.md")]:
        shutil.copy2(source, PACKAGE / name)
        shutil.copy2(source, DOWNLOADS / name)
    shutil.copy2(ROOT / "docs" / "人物动作替换指南.md", DOWNLOADS / "replacement-guide.md")
    shutil.copy2(ASSETS.parent / "manifest.json", ROOT / "src" / "catalog.json")
    shutil.copy2(DOWNLOADS / "motion-v2.patch", DOWNLOADS / "character-motion-v2.patch")
    with zipfile.ZipFile(DOWNLOADS / "ai-motion-v2-complete.zip", "w", zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for file in PACKAGE.rglob("*"):
            if file.is_file():
                archive.write(file, Path("ai-motion-v2") / file.relative_to(PACKAGE))
        for file in ASSETS.rglob("*"):
            if file.is_file():
                archive.write(file, Path("ai-motion-v2") / "characters" / file.relative_to(ASSETS))
    for cid, *_ in CAST:
        with zipfile.ZipFile(DOWNLOADS / f"{cid}-motion-v2.zip", "w", zipfile.ZIP_DEFLATED) as archive:
            for file in (ASSETS / cid).glob("*"):
                archive.write(file, Path(cid) / file.name)
            archive.write(ROOT / "docs" / "人物动作替换指南.md", "人物动作替换指南.md")
    files = {}
    for file in DOWNLOADS.iterdir():
        if file.is_file() and file.name != "checksums.json":
            files[file.name] = {"bytes": file.stat().st_size, "sha256": hashlib.sha256(file.read_bytes()).hexdigest()}
    (DOWNLOADS / "checksums.json").write_text(json.dumps(files, ensure_ascii=False, indent=2))
    print("Packaged assets, patch, installer and replacement guide.")


if __name__ == "__main__":
    META = json.loads((SOURCE / "engine" / "assets" / "cast_atlas.json").read_text())
    ATLAS = Image.open(SOURCE / "engine" / "assets" / "cast_atlas.png").convert("RGBA")
    if "--package-only" not in sys.argv:
        generate()
    package()