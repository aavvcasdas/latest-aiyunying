"""授权重绘本鲸的独立无声样片；不覆盖现行图集。"""
import hashlib
import json
import math
import subprocess
import sys
import tempfile
import time
from pathlib import Path

import imageio_ffmpeg
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT / "paperdoll"
W, H, FPS, FRAMES = 1280, 720, 30, 240


def cutout(source):
    """仅删除与边界连通的近白背景，保留封闭白衣和眼睛高光。"""
    im = Image.open(source).convert("RGBA")
    arr = np.array(im)
    rgb = arr[:, :, :3].astype(np.int16)
    white = (rgb.min(axis=2) > 235) & ((rgb.max(axis=2) - rgb.min(axis=2)) < 18)
    mask = np.zeros((im.height + 2, im.width + 2), dtype=np.uint8)
    mask[1:-1, 1:-1] = np.where(white, 0, 255)
    # fromarray 的共享缓冲区可能只读；floodfill 需要可写图像。
    flood = Image.fromarray(mask).copy()
    ImageDraw.floodfill(flood, (0, 0), 128, thresh=0)
    external = np.array(flood)[1:-1, 1:-1] == 128
    arr[external, 3] = 0
    result = Image.fromarray(arr)
    bbox = result.getbbox()
    if bbox is None:
        raise ValueError("抠图结果为空")
    return result.crop(bbox)


class Preview:
    def __init__(self, character):
        self.character = character
        yy, xx = np.mgrid[0:H, 0:W]
        u = np.clip(np.sqrt(((xx - 640) / 850) ** 2 + ((yy - 270) / 750) ** 2), 0, 1)[..., None]
        rgb = np.array([241, 250, 255]) * (1 - u) + np.array([211, 229, 245]) * u
        self.background = Image.fromarray(rgb.astype("uint8")).convert("RGBA")

    def frame(self, fi):
        if not 0 <= fi < FRAMES:
            raise ValueError("帧号越界")
        t = fi / FPS
        shot = min(3, int(t / 2))
        lt = t - shot * 2
        # 各镜头在起止处回到相同基准，切镜无突然放大/缩小。
        phase = (lt % 0.5) / 0.5
        envelope = math.sin(math.pi * lt / 2) ** 2
        sx, sy, lift, dx, rot = 1., 1., 0., 0., 0.
        if shot == 0:
            sy = 1 + 0.008 * math.sin(lt * math.pi)
            sx = 1 / sy
        elif shot == 1:
            sy = 1 - 0.04 * math.sin(math.pi * phase) ** 2 * envelope
            sx = 1 / sy
        elif shot == 2:
            lift = 42 * math.sin(math.pi * phase) ** 2 * envelope
            sy = 1 + 0.014 * math.sin(math.pi * phase) * envelope
            sx = 1 / sy
        else:
            dx = 28 * math.sin(math.pi * lt) * envelope
            rot = -3 * math.sin(math.pi * lt) * envelope
        h = round(570 * sy)
        w = round(self.character.width / self.character.height * 570 * sx)
        person = self.character.resize((w, h), Image.Resampling.LANCZOS)
        person = person.rotate(rot, Image.Resampling.BICUBIC, expand=True)
        frame = self.background.copy()
        # 背景仅用几何图形，无说明、水印、角色名烧进视频。
        d = ImageDraw.Draw(frame)
        d.ellipse((350, 70, 930, 650), fill=(255, 255, 255, 110))
        d.arc((195, 110, 1085, 1000), 195, 345, fill=(173, 207, 228, 255), width=2)
        sh = Image.new("RGBA", (W, H))
        sd = ImageDraw.Draw(sh)
        spread = 130 - lift * 0.6
        sd.ellipse((640 + dx - spread, 638 - 12, 640 + dx + spread, 638 + 12), fill=(44, 78, 115, round(55 - lift / 2)))
        frame.alpha_composite(sh.filter(ImageFilter.GaussianBlur(12)))
        frame.alpha_composite(person, (round(640 + dx - person.width / 2), round(638 - lift - person.height)))
        return frame.convert("RGB")


def main():
    assets = BASE / "assets"
    output_dir = BASE / "demo"
    output_dir.mkdir(exist_ok=True)
    source = assets / "whale-regenerated.png"
    person = cutout(source)
    person.save(assets / "whale-regenerated-cutout.png")
    preview = Preview(person)
    output = output_dir / "重绘本鲸无声样片.mp4"
    start = time.monotonic()
    with tempfile.TemporaryDirectory() as td:
        tmp = Path(td) / "preview.mp4"
        cmd = [imageio_ffmpeg.get_ffmpeg_exe(), "-v", "error", "-y", "-f", "rawvideo", "-pixel_format", "rgb24",
               "-video_size", f"{W}x{H}", "-framerate", str(FPS), "-i", "pipe:0", "-an",
               "-c:v", "libx264", "-preset", "fast", "-crf", "16", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(tmp)]
        with tempfile.TemporaryFile() as err:
            p = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=err)
            try:
                for fi in range(FRAMES):
                    p.stdin.write(preview.frame(fi).tobytes())
                p.stdin.close()
                if p.wait() != 0:
                    err.seek(0)
                    raise RuntimeError(err.read().decode())
                output.write_bytes(tmp.read_bytes())
            finally:
                if p.poll() is None:
                    p.kill()
                    p.wait()
                if not p.stdin.closed:
                    p.stdin.close()
    preview.frame(0).save(output_dir / "重绘样片封面.jpg", quality=95)
    # 验证随机跳帧重绘与重复求值结果一致。
    assert preview.frame(136).tobytes() == preview.frame(136).tobytes()
    report = {"measured": False, "audio": False, "grid": "synthetic 120 BPM", "duration": 8,
              "frames": FRAMES, "fps": FPS, "resolution": [W, H],
              "render_encode_seconds": round(time.monotonic() - start, 3),
              "source_sha256": hashlib.sha256(source.read_bytes()).hexdigest(),
              "human_sign_off": False, "scope": "authorized regeneration; single-layer transforms, not articulated animation"}
    (output_dir / "重绘样片qa.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    print(output)


if __name__ == "__main__":
    main()
