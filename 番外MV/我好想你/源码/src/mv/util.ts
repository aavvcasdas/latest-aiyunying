// 所有画面都是「时间 t 的纯函数」：没有随机、没有累积状态，拖动进度条到哪一秒都是同一帧。
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const eOut = (u: number) => 1 - Math.pow(1 - u, 3);
export const eIn = (u: number) => u * u * u;
export const eIO = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
export const back = (u: number, s = 1.9) => {
  const x = u - 1;
  return 1 + (s + 1) * x * x * x + s * x * x;
};
/** 确定性伪随机 0..1 */
export const rnd = (i: number, s = 0) => {
  const x = Math.sin(i * 127.1 + s * 311.7 + 13.37) * 43758.5453;
  return x - Math.floor(x);
};
/** 在 at 这一刻「啪」地弹出来：0 → 1（带过冲） */
export const pop = (t: number, at: number, d = 0.28) => (t < at ? 0 : back(seg(t, at, at + d)));
/** 定格动画感：一秒 8 次的小抖动 */
export const jit = (t: number, seed: number, amp = 1.5) => (rnd(Math.floor(t * 8), seed) - 0.5) * 2 * amp;
/** 鼓包：0 → 1 → 0 */
export const bump = (u: number) => (u <= 0 || u >= 1 ? 0 : Math.sin(Math.PI * u));
export const mix = (a: string, b: string, u: number) => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const f = (s: number) => Math.round(lerp((pa >> s) & 255, (pb >> s) & 255, clamp(u)));
  return `rgb(${f(16)},${f(8)},${f(0)})`;
};
export const FONT = '"ZK","PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif';
