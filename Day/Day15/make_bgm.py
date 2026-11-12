#!/usr/bin/env python3
"""给 Day15 生成一段 BGM，并按人声自动压低（ducking），混进成片。

做法：
  1. 用 numpy 合成一段轻快的像素风衬底（拨弦 + 铺底 + 贝斯 + 轻打点，C–G–Am–F 四和弦循环）；
  2. 按片子的三段情绪排编制：白天（只有拨弦和铺底）→ 金黄/黄昏（加贝斯和打点）→
     夜里那几句（抽掉鼓和贝斯，只留铺底）→ 结尾（全编制收尾）；
  3. 从成片里量出人声的包络，人一说话 BGM 再压 3 dB，说完慢慢抬回来；
  4. 混好写 素材/Day15_混音.wav，再把人声那轨换掉、视频流直接 copy，输出成片。

    python3 Day/Day15/make_bgm.py
    → 素材/Day15_bgm.wav  素材/Day15_混音.wav  成片/Day15.mp4（音频换成带 BGM 的）
"""
import pathlib
import subprocess
import tempfile
import wave

import numpy as np

ROOT = pathlib.Path(__file__).resolve().parents[2]
HERE = pathlib.Path(__file__).resolve().parent
VIDEO = HERE / "成片" / "Day15.mp4"
VOICE_SRC = HERE / "成片" / "Day15_原片.mp4"   # 只带人声、还没叠 BGM 的那一版
BGM_WAV = HERE / "素材" / "Day15_bgm.wav"
MIX_WAV = HERE / "素材" / "Day15_混音.wav"
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
    """起音 + 指数衰减的包络"""
    t = np.arange(n) / SR
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    return a * np.exp(-t * 3.2)


def pluck(freq: float, dur: float, amp: float = 1.0) -> np.ndarray:
    """拨弦：三角波 + 二三次谐波，短促、干净；谐波给足一点，手机喇叭才听得出来"""
    n = int(dur * SR)
    t = np.arange(n) / SR
    ph = 2 * np.pi * freq * t
    tri = 2 / np.pi * np.arcsin(np.sin(ph))
    tone = tri * 0.65 + np.sin(ph * 2) * 0.22 + np.sin(ph * 3) * 0.13
    return tone * env_ad(n, 0.004) * amp


def pad(freq: float, dur: float, amp: float = 1.0) -> np.ndarray:
    """铺底：两个轻微失谐的正弦，慢起慢收"""
    n = int(dur * SR)
    t = np.arange(n) / SR
    a = np.clip(t / 0.35, 0, 1) * np.clip((dur - t) / 0.5, 0, 1)
    tone = np.sin(2 * np.pi * freq * t) + 0.5 * np.sin(2 * np.pi * freq * 1.004 * t) + 0.25 * np.sin(2 * np.pi * freq * 2.0 * t)
    return tone * a * amp / 3


def bell(freq: float, dur: float, amp: float = 1.0) -> np.ndarray:
    """高音铃（音乐盒那种），给中高频一点东西——不然在手机上听不到"""
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
    nz = np.diff(nz, prepend=0.0)          # 一阶高通，留“沙”的音色
    return nz * np.exp(-np.arange(n) / SR * 42) * amp


def add(buf: np.ndarray, sig: np.ndarray, at: float, gain: float = 1.0):
    i = int(at * SR)
    if i >= len(buf):
        return
    j = min(len(buf), i + len(sig))
    buf[i:j] += sig[: j - i] * gain


def highpass(x: np.ndarray, fc: float) -> np.ndarray:
    """一阶高通（频域做，简单且不引入延迟）"""
    n = len(x)
    spec = np.fft.rfft(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    spec *= 1 / (1 + (fc / np.maximum(f, 1e-6)) ** 2) ** 0.5
    return np.fft.irfft(spec, n)


def band_rms(x: np.ndarray, lo: float = 500.0, hi: float = 3000.0) -> float:
    """人声与手机喇叭共同有劲的频段（500–3000Hz）里的 RMS——比总 RMS 更接近「听不听得见」"""
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
        full = 4 <= bar <= 17
        sparse = 18 <= bar <= 20
        swell = 21 <= bar <= 22
        ending = bar >= 23

        # 铺底：高八度，落在 500–1000Hz（手机喇叭能出来的位置），全程都有
        for m in tones:
            add(music, pad(hz(m + 12), BAR * 0.98), t0, 0.30 if (sparse or swell) else 0.24)
        # 再叠一层更高更薄的光泽
        add(music, pad(hz(tones[2] + 24), BAR * 0.98), t0, 0.10 if (sparse or swell) else 0.07)

        # 拨弦：八分音符，上行下行交替，高八度为主
        if not sparse:
            pat = [0, 1, 2, 1, 0, 2, 1, 2]
            for k, idx in enumerate(pat):
                m = tones[idx] + 12 + (12 if k in (3, 6) else 0)
                add(music, pluck(hz(m), BEAT * 0.55), t0 + k * BEAT / 2, 0.20)
        else:
            # 夜里：一小节只留两下，像有人在很远的地方弹了一下
            add(music, pluck(hz(tones[0] + 24), BEAT * 1.2), t0 + BEAT * 0.5, 0.15)
            add(music, pluck(hz(tones[2] + 24), BEAT * 1.2), t0 + BEAT * 2.5, 0.12)

        # 高音铃：音乐盒那种，全程都有（夜里也要有，不然那几句又变哑巴）
        if sparse or swell:
            add(music, bell(hz(tones[0] + 24), BEAT * 1.4), t0, 0.13)
        else:
            add(music, bell(hz(tones[0] + 24), BEAT * 1.1), t0, 0.17)
            add(music, bell(hz(tones[2] + 24), BEAT * 0.9), t0 + BEAT * 2.5, 0.12)

        # 贝斯：一拍一换，只在有鼓的段落；只留一点身体感，不再抢低频
        if full or ending or swell:
            for b in range(4):
                add(music, bass(hz(root + 12), BEAT * 0.9), t0 + b * BEAT, 0.26 if (full or ending) else 0.16)

        # 打点：轻的底鼓 + 沙锤（沙锤是唯一的高频，别太小声）
        if full or ending:
            add(music, kick(), t0, 0.24)
            add(music, kick(), t0 + BEAT * 2, 0.20)
            for k in range(8):
                add(music, shaker(), t0 + k * BEAT / 2, 0.16 if k % 2 else 0.10)

    # 收尾：最后一个和弦长一点，整体淡出
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
    """人声包络 → 压 BGM 的增益曲线：说话时压 3 dB，说完慢慢回来"""
    mono = np.abs(voice).mean(axis=1)
    win = int(0.02 * sr)
    frames = int(np.ceil(len(mono) / win))
    pad_mono = np.pad(mono, (0, frames * win - len(mono)))
    rms = np.sqrt((pad_mono.reshape(frames, win) ** 2).mean(axis=1))
    thr = 0.012
    act = np.clip((rms - thr) / (thr * 1.5), 0, 1)
    # 快压慢放
    g = np.ones(frames)
    cur = 1.0
    for i, a in enumerate(act):
        target = 1.0 - 0.30 * a        # 说的时候再压 3 dB，句子中间抬回来
        cur = cur + (target - cur) * (0.5 if target < cur else 0.08)
        g[i] = cur
    g = np.repeat(g, win)[: len(voice)]
    return g


def main():
    # 1) 从「原片」取人声轨（原片没有 BGM，重跑多少次都不会叠两遍）
    with tempfile.TemporaryDirectory() as d:
        vo_path = pathlib.Path(d) / "vo.wav"
        src = VOICE_SRC if VOICE_SRC.exists() else VIDEO
        subprocess.run([FF, "-v", "error", "-y", "-i", str(src), "-vn", "-ac", "2", "-ar", str(SR),
                        "-c:a", "pcm_s16le", str(vo_path)], check=True)
        voice, sr = read_wav(vo_path)
    total = len(voice) / sr
    print(f"人声轨 {total:.2f}s")

    # 2) 合成 BGM，按人声 RMS 定标（500–3000Hz 比人声低 12 dB），再叠加进片子
    music = build(total)
    if len(music) < len(voice):
        music = np.pad(music, (0, len(voice) - len(music)))
    music = music[: len(voice)]
    # 行业常见做法：背景音乐在人说话时约比人声低 18–24 dB（W3C 建议非语音至少低 20 dB，
    # YouTube 口播常用 18–24 dB，情绪向的稀疏配乐 15–20 dB，Premiere 自动 ducking 常设 −18~−24 dB）。
    # 这一集是按「情绪向稀疏配乐」处理：说话时低 15–16 dB，停顿处抬回来。
    # 定标统一用 500–3000Hz 频段（人声和手机喇叭都在这儿），不用总 RMS——低频会把数值骗过去。
    voice_band = band_rms(voice.mean(axis=1))
    music *= voice_band * 10 ** (-12 / 20) / max(band_rms(music), 1e-9)   # 静音底 12 dB，说话时再压 3 dB → 约 15 dB
    g = duck_gain(voice, sr)
    bgm = np.stack([music * g, music * g], axis=1)
    write_wav(BGM_WAV, bgm, sr)
    print(f"BGM {BGM_WAV.relative_to(ROOT)}（{total:.2f}s，500–3000Hz 比人声低 12 dB，说话时再压 3 dB）")

    mix = np.clip(voice + bgm, -1, 1)
    write_wav(MIX_WAV, mix, sr)
    peak = 20 * np.log10(np.abs(mix).max())
    rms = 20 * np.log10(np.sqrt((mix ** 2).mean()))
    print(f"混音 峰值 {peak:.2f} dBFS  整体 RMS {rms:.2f} dBFS")

    # 3) 换音轨：视频流 copy，只重编音频
    tmp = MIX_WAV.with_suffix(".mp4")
    subprocess.run([FF, "-v", "error", "-y", "-i", str(VIDEO), "-i", str(MIX_WAV),
                    "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
                    "-shortest", "-movflags", "+faststart", str(tmp)], check=True)
    tmp.replace(VIDEO)
    print(f"BGM_OK {VIDEO.relative_to(ROOT)}（{VIDEO.stat().st_size/1e6:.1f} MB）")


if __name__ == "__main__":
    main()
