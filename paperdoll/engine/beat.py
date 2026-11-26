"""实验性 onset 候选检测，不等于鼓点/歌词实测对齐。正式制作复用模板 align。"""
from __future__ import annotations

import subprocess
from pathlib import Path

import imageio_ffmpeg
import numpy as np

SR = 22050


def decode_audio(path: str | Path, sr=SR) -> tuple[np.ndarray, float]:
    if not Path(path).is_file():
        raise FileNotFoundError(path)
    raw = subprocess.run([imageio_ffmpeg.get_ffmpeg_exe(), "-v", "error", "-i", str(path),
                          "-ac", "1", "-ar", str(sr), "-f", "f32le", "pipe:1"],
                         check=True, capture_output=True).stdout
    samples = np.frombuffer(raw, dtype="<f4").copy()
    if not samples.size:
        raise ValueError("音频为空")
    return samples, len(samples) / sr


def energy_envelope(samples: np.ndarray, sr: int, fps=30) -> np.ndarray:
    if sr <= 0 or fps <= 0 or fps > sr:
        raise ValueError("采样率和 fps 无效")
    # 用每帧精确边界，避免 floor(sr/fps) 累积漂移。
    n = int(np.ceil(len(samples) / sr * fps))
    env = np.zeros(n, dtype=np.float32)
    for i in range(n):
        seg = samples[int(i * sr / fps):int((i + 1) * sr / fps)]
        if seg.size:
            env[i] = np.sqrt(np.mean(seg ** 2))
    peak = float(env.max()) if env.size else 0
    return env / peak if peak > 0 else env


def detect_beats(samples: np.ndarray, sr: int) -> list[float]:
    """名字沿用原型；实际只检测频谱正增量峰，不推算 BPM、不强行补拍。"""
    n_fft, hop = 1024, 512
    if len(samples) < n_fft:
        return []
    window = np.hanning(n_fft)
    prev = np.zeros(n_fft // 2 + 1)
    flux = []
    for start in range(0, len(samples) - n_fft + 1, hop):
        mag = np.abs(np.fft.rfft(samples[start:start + n_fft] * window))
        flux.append(float(np.maximum(0, mag - prev).sum()))
        prev = mag
    result = []
    for i in range(1, len(flux) - 1):
        threshold = np.mean(flux[max(0, i - 20):i + 21]) * 1.4 + 1e-6
        t = (i * hop + n_fft / 2) / sr
        if flux[i] > threshold and flux[i] > flux[i - 1] and flux[i] >= flux[i + 1]:
            if not result or t - result[-1] >= 0.25:
                result.append(t)
    return result


def analyze(path: str | Path, fps=30) -> dict:
    samples, duration = decode_audio(path)
    return {"measured": False, "method": "experimental-onset-candidates-not-aligned",
            "duration": duration, "beats": detect_beats(samples, SR),
            "energy": energy_envelope(samples, SR, fps).tolist(), "fps": fps}
