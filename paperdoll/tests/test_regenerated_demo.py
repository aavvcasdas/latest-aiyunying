import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

TOOL = Path(__file__).resolve().parents[1] / "tools/make_regenerated_demo.py"
spec = importlib.util.spec_from_file_location("regenerated_demo", TOOL)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


class RegeneratedDemoTests(unittest.TestCase):
    def test_cutout_removes_border_preserves_enclosed_white(self):
        im = Image.new("RGB", (100, 100), "white")
        d = ImageDraw.Draw(im)
        d.rectangle((20, 20, 80, 80), fill="#182f65")
        d.rectangle((30, 30, 70, 70), fill="white")
        with tempfile.TemporaryDirectory() as td:
            path = Path(td) / "test.png"
            im.save(path)
            result = mod.cutout(path)
        self.assertEqual(result.size, (61, 61))
        self.assertEqual(result.getpixel((30, 30)), (255, 255, 255, 255))

    def test_actual_background_and_bounds(self):
        im = Image.open(mod.BASE / "assets/whale-regenerated-cutout.png")
        alpha = np.array(im.getchannel("A"))
        self.assertGreater((alpha == 0).sum(), alpha.size * 0.2)
        self.assertEqual(im.getpixel((0, 0))[3], 0)
        self.assertEqual(im.getbbox(), (0, 0, im.width, im.height))

    def test_all_frame_dimensions(self):
        im = Image.open(mod.BASE / "assets/whale-regenerated-cutout.png").convert("RGBA")
        preview = mod.Preview(im)
        for fi in (0, 59, 60, 119, 120, 135, 179, 180, 239):
            self.assertEqual(preview.frame(fi).size, (1280, 720))
        for fi in (-1, 240):
            with self.assertRaises(ValueError):
                preview.frame(fi)

    def test_out_of_order_determinism(self):
        im = Image.open(mod.BASE / "assets/whale-regenerated-cutout.png").convert("RGBA")
        preview = mod.Preview(im)
        first = preview.frame(136).tobytes()
        preview.frame(239)
        preview.frame(0)
        self.assertEqual(first, preview.frame(136).tobytes())


if __name__ == "__main__":
    unittest.main()
