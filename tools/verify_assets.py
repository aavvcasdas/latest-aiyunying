"""Validate downloadable animations without requiring a browser."""
from pathlib import Path
import hashlib
import json
import sys
import zipfile

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / ".python-deps"))
from PIL import Image, ImageSequence

files = list((ROOT / "public/assets/characters").glob("*/*.gif"))
assert len(files) == 108, "Expected 108 GIFs"
for file in files:
    image = Image.open(file)
    assert image.size == (256, 256), file
    assert image.info.get("loop") == 0 and "transparency" in image.info, file
    duration = 0
    count = 0
    for frame in ImageSequence.Iterator(image):
        duration += frame.info.get("duration", 0)
        count += 1
    assert (count, duration) == (24, 2000), (file, count, duration)
    strip = Image.open(file.with_suffix(".png"))
    assert strip.size == (3072, 128) and strip.mode == "RGBA", file

downloads = ROOT / "public/downloads"
checksums = json.loads((downloads / "checksums.json").read_text())
for name, meta in checksums.items():
    data = (downloads / name).read_bytes()
    assert len(data) == meta["bytes"], name
    assert hashlib.sha256(data).hexdigest() == meta["sha256"], name
for file in downloads.glob("*.zip"):
    with zipfile.ZipFile(file) as archive:
        assert archive.testzip() is None, file

print("PASS: 108 transparent GIFs, frame timing, PNG strips, archives and download checksums")