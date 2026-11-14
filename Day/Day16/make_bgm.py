#!/usr/bin/env python3
"""给 Day16 生成一段 BGM，并按人声自动压低（ducking），混进成片。

做法和 Day15 完全一致（Day 线自带 BGM，直接沿用同一套合成 + 混音法）：
  1. 用 numpy 合成一段轻快的像素风衬底（拨弦 + 铺底 + 贝斯 + 轻打点，C–G–Am–F 四和弦循环）；
  2. 按片子情绪排编制：前段「救回来了、评论都在看」（只有拨弦和铺底）→ 中段「老大怕了」
     （加贝斯和打点）→「鲸落」那几句（抽掉鼓和贝斯，只留铺底）→ 结尾「绝不摸鱼」全编制收尾；
  3. 从成片里量出人声的包络，人一说话 BGM 再压 3 dB，说完慢慢抬回来；
  4. 混好写 素材/Day16_混音.wav，再把人声那轨换掉、视频流直接 copy，输出成片。

    python3 Day/Day16/make_bgm.py
    → 素材/Day16_bgm.wav  素材/Day16_混音.wav  成片/Day16.mp4（音频换成带 BGM 的）
"""
import pathlib
import subprocess
import tempfile
import wave

import numpy as np

ROOT = pathlib.Path(__file__).resolve().parents[2]
HERE = pathlib.Path(__file__).resolve().parent
VIDEO = HERE / "成片" / "Day16.mp4"
VOICE_SRC = HERE / "成片" / "Day16_原片.mp4"   # 只带人声、还没叠 BGM 的那一版
BGM_WAV = HERE / "素材" / "Day16_bgm.wav"
MIX_WAV = HERE / "素材" / "Day16_混音.wav"
FF = "/tmp/ffvenv/lib/python3.11/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v9.0.2"

SR = 48000
BPM = 92.0
BEAT = 60.0 / BPM
BAR = BEAT * 4

# 四和弦循环：C – G – Am – F
CHORDS = [
    ("C", [60, 64, 67], 48),
    ("G", [59, 62, 67], 43),
    ("Am", [57, 60, 64], 45),
    ("F", [57, 60, 65], 41),
]


def hz(midi: float) -> float:
    return 440.0 * 2 ** ((midi - 69) / 12)


def env_ad(n: int, attack: float) -> np.ndarray:
    t = np.arange(n) / SR
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    return a * np.exp(-t * 3.2)


def pluck(freq: float, dur: float, amp: float = 1.0) -> np.ndarray:
    n = int(dur * SR)
    t = np.arange(n) / SR
    ph = 2 * np.pi * freq * t
    tri = 2 / np.pi * np.arcsin(np.sin(ph))
    tone = tri * 0.65 + np.sin(ph * 2) * 0.22 + np.sin(ph * 3) * 0.13
    return tone * env_ad(n, 0.004) * amp


def pad(freq: float, dur: float, amp: float = 1.0) -> np.ndarray:
    n = int(dur * SR)
    t = np.arange(n) / SR
    a = np.clip(t / 0.35, 0, 1) * np.clip((dur - t) / 0.5, 0, 1)
    tone = np.sin(2 * np.pi * freq * t) + 0.5 * np.sin(2 * np.pi * freq * 1.004 * t) + 0.25 * np.sin(2 * np.pi * freq * 2.0 * t)
    return tone * a * amp / 3


def bell(freq: float, dur: float, amp: float = 1.0) -> np.ndarray:
    n = int(dur * SR)
    t = np.arange(n) / SR
    ph = 2 * np.pi * freq * t
    tone = np.sin(ph) + 0.35 * np.sin(ph * 2.01) + 0.18 * np.sin(ph * 3.02)
    return tone * np.exp(-t * 5.5) * np.clip(t / 0.003, 0, 1) * amp


def bass(freq: float, dur: float, amp: float = 1.0) -> np.ndarray:
    n = int(dur * SR)
    t = np.arange(n) / SR
    a = np.clip(t / 0.01, 0, 1) * np.exp(-t * 1.6) * np.clip((dur - t) / 0.06, 0, 1)
    return (np.sin(2 * np.pi * freq * t) + 0.25 * np.sin(2 * np.pi * freq * 2 * t)) * a * amp


def kick(amp: float = 1.0) -> np.ndarray:
    n = int(0.22 * SR)
    t = np.arange(n) / SR
    f = 82 * np.exp(-t * 26) + 44
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 13) * amp


def shaker(amp: float = 1.0) -> np.ndarray:
    n = int(0.09 * SR)
    rng = np.random.default_rng(7)
    nz = rng.standard_normal(n)
    nz = np.diff(nz, prepend=0.0)
    return nz * np.exp(-np.arange(n) / SR * 42) * amp


def add(buf: np.ndarray, sig: np.ndarray, at: float, gain: float = 1.0):
    i = int(at * SR)
    if i >= len(buf):
        return
    j = min(len(buf), i + len(sig))
    buf[i:j] += sig[: j - i] * gain


def highpass(x: np.ndarray, fc: float) -> np.ndarray:
    n = len(x)
    spec = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    spec *= 1 / (1 + (fc / np.maximum(f, 1e-6)) ** 2) ** 0.5
    return np.fft.irfft(spec, n)


def band_rms(x: np.ndarray, lo: float = 500.0, hi: float = 3000.0) -> float:
    n = len(x)
    spec = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    spec[(f < lo) | (f > hi)] = 0
    y = np.fft.irfft(spec, n)
    return float(np.sqrt((y ** 2).mean()))


def build(total: float) -> np.ndarray:
    n = int(total * SR)
    music = np.zeros(n)
    nb = int(np.ceil(total / BAR))
    for bar in range(nb):
        name, tones, root = CHORDS[bar % 4]
        t0 = bar * BAR
        # Day16 情绪分段（按 41 秒 / 92BPM，约 10 小节）：
        #   0–3 小节：救回来了、评论都在看 → 只有拨弦 + 铺底
        #   4–7 小节：老大怕了、梗句、笨鱼 → 加贝斯 + 打点
        #   8–9 小节：鲸落那几句 → 抽掉鼓和贝斯，只留铺底
        #   末小节：绝不摸鱼 → 全编制收尾
        sparse = 8 <= bar <= 9
        full = (4 <= bar <= 7) or bar >= 10

        # 铺底
        for m in tones:
            add(music, pad(hz(m + 12), BAR * 0.98), t0, 0.30 if sparse else 0.24)
        add(music, pad(hz(tones[2] + 24), BAR * 0.98), t0, 0.10 if sparse else 0.07)

        # 拨弦
        if not sparse:
            pat = [0, 1, 2, 1, 0, 2, 1, 2]
            for k, idx in enumerate(pat):
                m = tones[idx] + 12 + (12 if k in (3, 6) else 0)
                add(music, pluck(hz(m), BEAT * 0.55), t0 + k * BEAT / 2, 0.20)
        else:
            add(music, pluck(hz(tones[0] + 24), BEAT * 1.2), t0 + BEAT * 0.5, 0.15)
            add(music, pluck(hz(tones[2] + 24), BEAT * 1.2), t0 + BEAT * 2.5, 0.12)

        # 高音铃
        if sparse:
            add(music, bell(hz(tones[0] + 24), BEAT * 1.4), t0, 0.13)
        else:
            add(music, bell(hz(tones[0] + 24), BEAT * 1.1), t0, 0.17)
            add(music, bell(hz(tones[2] + 24), BEAT * 0.9), t0 + BEAT * 2.5, 0.12)

        # 贝斯
        if full or sparse:
            for b in range(4):
                add(music, bass(hz(root + 12), BEAT * 0.9), t0 + b * BEAT, 0.26 if full else 0.16)

        # 打点
        if full:
            add(music, kick(), t0, 0.24)
            add(music, kick(), t0 + BEAT * 2, 0.20)
            for k in range(8):
                add(music, shaker(), t0 + k * BEAT / 2, 0.16 if k % 2 else 0.10)

    # 收尾
    last = nb * BAR
    if last < total:
        for m in [60, 64, 67, 72, 76]:
            add(music, pad(hz(m), total - last + 0.5), last, 0.26)
    music = highpass(music, 170.0)
    fade = int(2.4 * SR)
    music[-fade:] *= np.linspace(1, 0, fade)
    music[: int(1.6 * SR)] *= np.linspace(0, 1, int(1.6 * SR))
    return music


def read_wav(path: pathlib.Path) -> tuple[np.ndarray, int]:
    with wave.open(str(path), "rb") as w:
        ch, sw, sr, n = w.getnchannels(), w.getsampwidth(), w.getframerate(), w.getnframes()
        raw = w.readframes(n)
    if sw != 2:
        raise SystemExit(f"{path} 不是 16bit PCM")
    data = np.frombuffer(raw, dtype="<i2").astype(np.float64) / 32768.0
    return data.reshape(-1, ch), sr


def write_wav(path: pathlib.Path, x: np.ndarray, sr: int, ch: int = 2):
    x = np.clip(x, -1, 1)
    pcm = (x * 32767).astype("<i2")
    with wave.open(str(path), "wb") as w:
        w.setnchannels(ch)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(pcm.tobytes())


def duck_gain(voice: np.ndarray, sr: int) -> np.ndarray:
    mono = np.abs(voice).mean(axis=1)
    win = int(0.02 * sr)
    frames = int(np.ceil(len(mono) / win))
    pad_mono = np.pad(mono, (0, frames * win - len(mono)))
    rms = np.sqrt((pad_mono.reshape(frames, win) ** 2).mean(axis=1))
    thr = 0.012
    act = np.clip((rms - thr) / (thr * 1.5), 0, 1)
    g = np.ones(frames)
    cur = 1.0
    for i, a in enumerate(act):
        target = 1.0 - 0.30 * a
        cur = cur + (target - cur) * (0.5 if target < cur else 0.08)
        g[i] = cur
    g = np.repeat(g, win)[: len(voice)]
    return g


def main():
    with tempfile.TemporaryDirectory() as d:
        vo_path = pathlib.Path(d) / "vo.wav"
        src = VOICE_SRC if VOICE_SRC.exists() else VIDEO
        subprocess.run([FF, "-v", "error", "-y", "-i", str(src), "-vn", "-ac", "2", "-ar", str(SR),
                        "-c:a", "pcm_s16le", str(vo_path)], check=True)
        voice, sr = read_wav(vo_path)
    total = len(voice) / sr
    print(f"人声轨 {total:.2f}s")

    music = build(total)
    if len(music) < len(voice):
        music = np.pad(music, (0, len(voice) - len(music)))
    music = music[: len(voice)]
    voice_band = band_rms(voice.mean(axis=1))
    music *= voice_band * 10 ** (-12 / 20) / max(band_rms(music), 1e-9)
    g = duck_gain(voice, sr)
    bgm = np.stack([music * g, music * g], axis=1)
    write_wav(BGM_WAV, bgm, sr)
    print(f"BGM {BGM_WAV.relative_to(ROOT)}（{total:.2f}s，500–3000Hz 比人声低 12 dB，说话时再压 3 dB）")

    mix = np.clip(voice + bgm, -1, 1)
    write_wav(MIX_WAV, mix, sr)
    peak = 20 * np.log10(np.abs(mix).max())
    rms = 20 * np.log10(np.sqrt((mix ** 2).mean()))
    print(f"混音 峰值 {peak:.2f} dBFS  整体 RMS {rms:.2f} dBFS")

    tmp = MIX_WAV.with_suffix(".mp4")
    subprocess.run([FF, "-v", "error", "-y", "-i", str(VIDEO), "-i", str(MIX_WAV),
                    "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
                    "-shortest", "-movflags", "+faststart", str(tmp)], check=True)
    tmp.replace(VIDEO)
    print(f"BGM_OK {VIDEO.relative_to(ROOT)}（{VIDEO.stat().st_size/1e6:.1f} MB）")


if __name__ == "__main__":
    main()
