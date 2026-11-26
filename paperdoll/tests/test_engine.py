import copy
import sys
import tempfile
import unittest
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "paperdoll"))
from engine.beat import detect_beats, energy_envelope
from engine.render import Renderer, checked_font, render_storyboard
from engine.rig import Pose, make_character, pose_for, render_character, split_bands
from engine.storyboard import validate
from tools.make_demo import demo_data


class EngineTests(unittest.TestCase):
    def setUp(self):
        self.story, self.beats, self.chars = demo_data()

    def test_demo_duration_and_boundaries(self):
        r = Renderer(self.story, self.beats, self.chars)
        self.assertEqual((r.duration, r.n_frames), (8, 240))
        for fi in [0, 59, 60, 119, 120, 179, 180, 239]:
            self.assertEqual(r.frame(fi).size, (1280, 720))
        with self.assertRaises(ValueError):
            r.frame(240)

    def test_order_independent(self):
        r = Renderer(self.story, self.beats, self.chars)
        frames = {i: r.frame(i).tobytes() for i in [0, 60, 121, 135, 180, 239]}
        for i in [239, 135, 60, 180, 0, 121, 135]:
            self.assertEqual(r.frame(i).tobytes(), frames[i])

    def test_global_clock_later_shot(self):
        self.assertLess(pose_for("step", 6.0, self.beats["beats"]).sy, 1)
        self.assertGreater(pose_for("hop", 6.25, self.beats["beats"]).lift, 0.1)

    def test_hop_continuous_landing(self):
        b = self.beats["beats"]
        for t in [0.5, 2, 5.5, 7.5]:
            self.assertLess(abs(pose_for("hop", t - 1e-6, b).lift - pose_for("hop", t, b).lift), 1e-5)

    def test_whole_image_lift_and_area(self):
        im = Image.new("RGBA", (20, 60), (255, 0, 0, 255))
        layer = render_character(im, Pose(lift=0.1), (200, 200), (100, 150), 100)
        self.assertEqual(layer.getbbox()[3], 140)
        self.assertEqual(len(set(np.asarray(layer)[:, :, 3].nonzero()[0])), 100)
        pose = pose_for("step", 2, self.beats["beats"])
        self.assertAlmostEqual(pose.sx * pose.sy, 1)

    def test_no_fake_wave(self):
        with self.assertRaises(ValueError):
            pose_for("wave", 0, self.beats["beats"])

    def test_invalid_timeline(self):
        for beats in [[], [0], [0, 0.5, 0.5], [0, float("nan")], [1, 2]]:
            with self.subTest(beats=beats), self.assertRaises(ValueError):
                validate(self.story, {"beats": beats}, self.chars)
        for start, count in [(1, 4), (0, 0), (0, 17), (0.0, 4)]:
            story = copy.deepcopy(self.story)
            story["shots"][0].update(start_beat=start, beats=count)
            with self.assertRaises(ValueError):
                validate(story, self.beats, self.chars)

    def test_missing_assets_and_unsupported_features(self):
        with self.assertRaises(FileNotFoundError):
            make_character("/missing-paperdoll-character.png")
        for change in [{"id": "unknown"}, {"action": "wave"}, {"x": float("inf")}]:
            story = copy.deepcopy(self.story)
            story["shots"][0]["cast"][0].update(change)
            with self.assertRaises(ValueError):
                validate(story, self.beats, self.chars)
        story = copy.deepcopy(self.story)
        story["shots"][0]["lyric"] = "未对齐的词"
        with self.assertRaises(ValueError):
            validate(story, self.beats, self.chars)

    def test_bounds_fail_not_clip(self):
        with self.assertRaises(ValueError):
            render_character(self.chars["whale"], Pose(), (100, 100), (50, 80), 300)

    def test_silent_only(self):
        with tempfile.TemporaryDirectory() as td:
            with self.assertRaises(ValueError):
                render_storyboard(self.story, self.beats, self.chars, Path(td) / "无声样片.mp4", audio="a.mp3")
            with self.assertRaises(ValueError):
                render_storyboard(self.story, self.beats, self.chars, Path(td) / "final.mp4")
            self.assertFalse(list(Path(td).iterdir()))

    def test_template_font(self):
        self.assertGreater(checked_font("风吹过").getlength("风"), 0)
        with self.assertRaises(ValueError):
            checked_font("\U0010ffff")

    def test_short_and_silent_audio(self):
        self.assertEqual(detect_beats(np.zeros(200), 22050), [])
        self.assertEqual(detect_beats(np.zeros(5000), 22050), [])
        self.assertTrue(np.all(energy_envelope(np.zeros(22050), 22050) == 0))
        self.assertEqual(len(energy_envelope(np.zeros(44101), 22050)), 61)

    def test_crops_reconstruct_exactly(self):
        im = self.chars["whale"]
        restored = Image.new("RGBA", im.size)
        for part in split_bands(im).values():
            restored.paste(part["image"], tuple(part["xy"]))
        self.assertEqual(restored.tobytes(), im.tobytes())


if __name__ == "__main__":
    unittest.main()
