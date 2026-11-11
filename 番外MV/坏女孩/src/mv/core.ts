// 核心常量与纯函数（所有画面只读时间参数：任意跳帧、任意分段渲染都得到同一帧）

export const W = 1280;
export const H = 720;
export const FPS = 30;

// 对这份音频实测的节拍网格：126.99 BPM，主歌第一小节强拍 22.365 s
export const BPM = 126.99;
export const BEAT = 60 / BPM; // 0.4725 s
export const BAR = BEAT * 4; // 1.890 s
export const BAR0 = 22.365;

/** 跳过前奏：从第一句人声前一小节的鼓点进入 */
export const START = BAR0 - BAR; // 20.475 s
/** 内嵌音轨从原曲 20.0 s 截起 */
export const AUDIO_OFFSET = 20.0;
/** 原视频里的音轨在 3:35.1 截止（原曲 4:04，最后一句中途被截断） */
export const AUDIO_END = 215.1;
export const END_CARD = 2.6;
export const TOTAL_END = AUDIO_END + END_CARD;
export const FADE_IN = 0.3;
export const FADE_OUT = 1.4;

export const barT = (b: number) => BAR0 + b * BAR;
export const barAt = (T: number) => (T - BAR0) / BAR;
/** 吸附到最近的半拍（八分音符），最多移动 BEAT/4 */
export const snapHalfBeat = (t: number) => BAR0 + Math.round((t - BAR0) / (BEAT / 2)) * (BEAT / 2);

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const seg = (u: number, a: number, b: number) => clamp01((u - a) / (b - a));
export const ease = (t: number) => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
export const easeIn = (t: number) => Math.pow(clamp01(t), 3);
export const backOut = (t: number) => {
  const x = clamp01(t) - 1;
  return 1 + x * x * (2.70158 * x + 1.70158);
};

/** 确定性伪随机 0..1 */
export const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export const hash2 = (a: number, b: number) => hash(a * 73.7 + b * 1.37 + 0.5);

export const fmtTime = (s: number) => {
  const v = Math.max(0, s);
  const m = Math.floor(v / 60);
  const r = v - m * 60;
  return `${m}:${r < 10 ? "0" : ""}${r.toFixed(1)}`;
};

export const FONT = `"ZCOOL KuaiLe","PingFang SC","Microsoft YaHei","Noto Sans CJK SC",sans-serif`;

export type V3 = [number, number, number];
