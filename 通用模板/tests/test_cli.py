#!/usr/bin/env python3
"""音频工具的测试：全部用「已知答案」的合成信号（不是真人配音 / 真歌）。
    python3 -m unittest discover -s 通用模板/tests -p 'test_*.py'
覆盖：audio_mix.py（按采样对位、淡出、混音）、align_beats.py（实测拍点、吸附）。
"""
import json
import os
import subprocess
import sys
import tempfile
import unittest
import wave

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
CLI = os.path.join(HERE, '..', 'cli')
REPO = os.path.abspath(os.path.join(HERE, '..', '..'))


def write_wav(path, x, sr):
    x = np.asarray(x, dtype=np.float64)
    if x.ndim == 1:
        x = np.stack([x, x], axis=1)
    with wave.open(path, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes(np.round(np.clip(x, -1, 32767 / 32768) * 32768).astype('<i2').tobytes())


def read_wav(path):
    with wave.open(path, 'rb') as w:
        return w.getframerate(), np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').reshape(-1, w.getnchannels()).astype(np.float64) / 32768


def jload(path):
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def wtext(path, text):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(text)


def rtext(path):
    with open(path, encoding='utf-8') as f:
        return f.read()


def run(script, *args, ok=True):
    r = subprocess.run([sys.executable, os.path.join(CLI, script), *map(str, args)], capture_output=True, text=True)
    if ok and r.returncode != 0:
        raise AssertionError(f'{script} 失败：\n{r.stdout}\n{r.stderr}')
    return r


def speech_like(spans, dur, sr, seed=7):
    """在给定的时间段里放「像说话的声音」：带 6Hz 起伏的窄带噪声；段外是极轻的底噪"""
    rng = np.random.default_rng(seed)
    n = int(dur * sr)
    t = np.arange(n) / sr
    x = rng.normal(0, 0.0004, n)
    carrier = np.sin(2 * np.pi * 220 * t) * 0.5 + np.sin(2 * np.pi * 440 * t) * 0.3 + rng.normal(0, 0.15, n)
    for a, b in spans:
        i0, i1 = int(a * sr), int(b * sr)
        env = np.minimum(1, np.minimum((t[i0:i1] - a) / 0.01, (b - t[i0:i1]) / 0.01)) * (0.75 + 0.25 * np.sin(2 * np.pi * 6 * t[i0:i1]))
        x[i0:i1] += carrier[i0:i1] * env * 0.3
    return x


class AudioMix(unittest.TestCase):
    SR = 48000

    def mix(self, src, duration, *extra):
        d = tempfile.mkdtemp()
        s, o, r = os.path.join(d, 's.wav'), os.path.join(d, 'o.wav'), os.path.join(d, 'r.json')
        write_wav(s, src, self.SR)
        run('audio_mix.py', '--src', s, '--out', o, '--report', r, '--duration', duration, *extra)
        return read_wav(o)[1], jload(r), d

    def test_offset_zero_is_sample_exact(self):
        rng = np.random.default_rng(1)
        src = rng.uniform(-0.5, 0.5, self.SR * 3)
        out, rep, _ = self.mix(src, 2.0)
        self.assertEqual(len(out), 2 * self.SR)
        # 没有 fadeOut：片尾硬切要给出警告
        self.assertIn('warning', rep)
        ref = np.round(src[:2 * self.SR] * 32768) / 32768
        self.assertTrue(np.array_equal(out[:, 0], ref), '画面第 i 个采样必须就是音源第 i 个采样')

    def test_positive_and_negative_offset(self):
        rng = np.random.default_rng(2)
        src = rng.uniform(-0.5, 0.5, self.SR * 2)
        q = np.round(src * 32768) / 32768
        out, _, _ = self.mix(src, 3.0, '--offset', 0.5)   # 音源晚 0.5 秒进
        k = self.SR // 2
        self.assertTrue(np.all(out[:k] == 0))
        self.assertTrue(np.array_equal(out[k:k + len(q), 0], q))
        out, _, _ = self.mix(src, 1.0, '--offset', -0.25)  # 丢掉音源开头 0.25 秒
        self.assertTrue(np.array_equal(out[:, 0], q[self.SR // 4:self.SR // 4 + self.SR]))

    def test_fade_out_only_when_cut_mid_source(self):
        src = np.full(self.SR * 4, 0.5)
        out, rep, _ = self.mix(src, 2.0, '--fade-out', 1.0)
        self.assertEqual(rep['fade_out_seconds'], 1.0)
        self.assertAlmostEqual(out[self.SR - 1, 0], 0.5, places=3)          # 淡出开始前
        self.assertAlmostEqual(out[int(1.5 * self.SR), 0], 0.25, places=3)  # 线性：过半时一半音量
        self.assertLess(abs(out[-1, 0]), 1e-3)
        # 音源自己先结束：不淡出
        out, rep, _ = self.mix(np.full(self.SR, 0.5), 2.0, '--fade-out', 1.0)
        self.assertEqual(rep['fade_out_seconds'], 0)
        self.assertAlmostEqual(out[self.SR - 100, 0], 0.5, places=3)
        self.assertTrue(np.all(out[self.SR:] == 0))

    def test_full_scale_samples_already_in_the_source_are_not_mix_clipping(self):
        # 流行歌的母带常有顶到满刻度的采样。原样搬过来不是混音的错：只记数，不算削波
        rng = np.random.default_rng(3)
        src = rng.uniform(-0.5, 0.5, self.SR * 3)
        hot = [1000, 1001, 5000, 40000, 2 * self.SR - 10]   # 最后一个落在淡出段里，会被淡出压下去
        src[hot] = 1.0
        out, rep, _ = self.mix(src, 2.0, '--fade-out', 0.5)
        self.assertEqual(rep['clipped_by_mix'], 0)
        self.assertEqual(rep['full_scale_samples_from_source'], 4 * 2, '四个位置 × 左右声道')
        self.assertEqual(rep['clipped_samples'], 4 * 2)
        self.assertLess(abs(out[2 * self.SR - 10, 0]), 0.05, '淡出段里的那一个已经不在满刻度')

    def test_chip_bgm_ducks_under_voice_and_stem_subtracts_back(self):
        spans = [(0.5, 2.5), (3.5, 5.5)]
        src = speech_like(spans, 6.5, self.SR)
        d0 = tempfile.mkdtemp()
        stem = os.path.join(d0, 'stem.wav')
        out, rep, _ = self.mix(src, 6.5, '--bgm-chip', 128, '--stem', stem)
        b = rep['bgm']
        self.assertGreater(b['bgm_below_voice_db'], 12, '说话时伴奏至少比人声低 12 dB')
        self.assertGreater(b['bgm_rms_db_in_gaps'], b['bgm_rms_db_during_speech'], '气口里伴奏要回升')
        self.assertEqual(rep['clipped_samples'], 0)
        st = read_wav(stem)[1]
        dry = np.round(src * 32768) / 32768
        # 成片 − 伴奏 stem = 干声（各自量化到 16bit，允许 ±1 个量化台阶）
        self.assertLess(np.max(np.abs(out[:, 0] - st[:, 0] - dry[:len(out)])), 2.5 / 32768)


class Strip(unittest.TestCase):
    def test_strip_pages_and_missing_frame(self):
        from PIL import Image
        d = tempfile.mkdtemp()
        fr = os.path.join(d, 'frames'); os.makedirs(fr)
        for f in range(0, 10):
            Image.new('RGB', (64, 36), (f * 20, 80, 120)).save(os.path.join(fr, f'f{f:05d}.png'))
        info = os.path.join(d, 'info.json')
        json.dump({'fps': 2, 'frames': 10, 'width': 64, 'height': 36, 'shots': [{'id': 'A', 'a': 0}, {'id': 'B', 'a': 2.5}]}, open(info, 'w'))
        font = os.path.join(HERE, '..', 'engine', 'assets', 'fonts', 'ZCOOLKuaiLe-Regular.ttf')
        out = os.path.join(d, 'strip')
        txt = run('qa.py', 'strip', fr, out, '--info', info, '--font', font, '--step', 2, '--cols', 2, '--rows', 2, '--cell', 64).stdout
        self.assertIn('5 格 / 2 张', txt)                        # 第 0、2、4、6、8 帧 → 每页 4 格 → 两页
        a, b = Image.open(out + '_01.jpg'), Image.open(out + '_02.jpg')
        self.assertEqual(a.size, (128, 2 * (36 + 20)))
        self.assertEqual(b.size, (128, 1 * (36 + 20)))
        os.remove(os.path.join(fr, 'f00004.png'))
        r = run('qa.py', 'strip', fr, out, '--info', info, '--font', font, '--step', 2, ok=False)
        self.assertNotEqual(r.returncode, 0)
        self.assertIn('缺帧 4', r.stderr + r.stdout)


class AlignBeats(unittest.TestCase):
    def test_click_track_tempo_and_snap(self):
        sr, bpm, dur = 22050, 120.0, 40.0
        period = 60 / bpm
        n = int(sr * dur)
        t = np.arange(n) / sr
        x = np.zeros(n)
        for k in range(int(dur / period)):
            i0 = int((0.25 + k * period) * sr)
            m = min(n - i0, int(0.05 * sr))
            x[i0:i0 + m] += np.sin(2 * np.pi * (90 if k % 4 == 0 else 180) * t[:m]) * np.exp(-t[:m] * 60) * (0.9 if k % 4 == 0 else 0.5)
        d = tempfile.mkdtemp()
        wav, srt, out = os.path.join(d, 'c.wav'), os.path.join(d, 'l.srt'), os.path.join(d, 'cues.json')
        write_wav(wav, x, sr)
        # 四句歌词，起点故意各偏离拍点 ±0.1 秒左右
        starts = [10.25 + 0.09, 14.25 - 0.11, 18.25 + 0.06, 22.25 - 0.08]
        f = lambda s: f'{int(s // 3600):02d}:{int(s % 3600 // 60):02d}:{int(s % 60):02d},{int(round((s % 1) * 1000)):03d}'
        wtext(srt, '\n'.join(f'{i + 1}\n{f(s)} --> {f(s + 3)}\n第{i + 1}句\n' for i, s in enumerate(starts)))
        run('align_beats.py', '--wav', wav, '--srt', srt, '--out', out)
        cues = jload(out)
        self.assertTrue(cues['measured'])
        self.assertLess(abs(cues['beat']['period'] - period) / period, 0.005, f"拍长测成了 {cues['beat']['period']}")
        for line, s in zip(cues['lines'], starts):
            # 吸附后：离任意一个真实拍点（0.25 + k × 0.5）不超过 30 毫秒，且移动不超过半拍
            phase = (line['start'] - 0.25) / period
            self.assertLess(abs(phase - round(phase)) * period, 0.03, f"{line['text']} 吸到了 {line['start']}")
            self.assertLessEqual(abs(line['start'] - s), period / 2 + 1e-6)


if __name__ == '__main__':
    unittest.main()
