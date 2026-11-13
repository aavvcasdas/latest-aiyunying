// 画布尺寸、时间工具、剪纸风的基础画法。全片是 t 的纯函数：同一个 t 永远画出同一帧。
export const W = 1920;
export const H = 1080;
export const DUR = 47.63;
export const FONT = 'MVFont';
export const CREAM = '#f4eddc';

export type Ctx = CanvasRenderingContext2D;

// 运行环境注入点：浏览器里用 <canvas>，离线抽帧时换成别的画布实现
export const env = {
  makeCanvas(w: number, h: number): HTMLCanvasElement {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  },
};

export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const ease = (k: number) => k * k * (3 - 2 * k);
export const easeOut = (k: number) => 1 - Math.pow(1 - k, 3);
export const easeIn = (k: number) => k * k;
export const backOut = (k: number) => {
  const c = 1.70158;
  const x = k - 1;
  return 1 + (c + 1) * x * x * x + c * x * x;
};
export const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/** 关键帧插值：keys = [[时间, 值], ...]，段内用 smoothstep */
export function kf(t: number, keys: [number, number][], e: (k: number) => number = ease): number {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (t <= keys[i][0]) {
      const [t0, v0] = keys[i - 1];
      const [t1, v1] = keys[i];
      return lerp(v0, v1, e(seg(t, t0, t1)));
    }
  }
  return keys[keys.length - 1][1];
}

/** 从动作表里取当前动作：list = [[开始时间, 动作名], ...] */
export function pick(t: number, list: [number, string][]): { act: string; at: number } {
  let cur = list[0];
  for (const it of list) if (t >= it[0]) cur = it;
  return { act: cur[1], at: Math.max(0, t - cur[0]) };
}

// 实测节拍：96.75 BPM，第一拍落在 0.03 s（对原片音轨做起音包络梳状滤波得出）
export const BPM = 96.75;
export const BEAT = 60 / BPM;
export const BEAT0 = 0.03;
export const beatPulse = (t: number) => {
  const p = (((t - BEAT0) / BEAT) % 1 + 1) % 1;
  return Math.exp(-p * 5.5);
};

// ───────── 剪纸画法 ─────────

export function rr(ctx: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const q = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + q, y);
  ctx.lineTo(x + w - q, y);
  ctx.arcTo(x + w, y, x + w, y + q, q);
  ctx.lineTo(x + w, y + h - q);
  ctx.arcTo(x + w, y + h, x + w - q, y + h, q);
  ctx.lineTo(x + q, y + h);
  ctx.arcTo(x, y + h, x, y + h - q, q);
  ctx.lineTo(x, y + q);
  ctx.arcTo(x, y, x + q, y, q);
  ctx.closePath();
}

/** 一片剪纸：先描一圈米白纸边，再填色。path 里不要调用 beginPath。 */
export function cut(ctx: Ctx, fill: string | CanvasGradient, path: () => void, ow = 4, oc = CREAM) {
  ctx.beginPath();
  path();
  if (ow > 0) {
    ctx.lineJoin = 'round';
    ctx.lineWidth = ow * 2;
    ctx.strokeStyle = oc;
    ctx.stroke();
  }
  ctx.fillStyle = fill;
  ctx.fill();
}

export function box(ctx: Ctx, x: number, y: number, w: number, h: number, fill: string | CanvasGradient, ow = 4, r = 0, oc = CREAM) {
  cut(ctx, fill, () => (r ? rr(ctx, x, y, w, h, r) : ctx.rect(x, y, w, h)), ow, oc);
}

export function poly(ctx: Ctx, pts: number[]) {
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath();
}

export function heart(ctx: Ctx, x: number, y: number, s: number, color: string, alpha = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.globalAlpha *= alpha;
  ctx.beginPath();
  ctx.moveTo(0, 8);
  ctx.bezierCurveTo(-14, -2, -8, -13, 0, -5);
  ctx.bezierCurveTo(8, -13, 14, -2, 0, 8);
  ctx.closePath();
  ctx.lineJoin = 'round';
  ctx.lineWidth = 3.5;
  ctx.strokeStyle = CREAM;
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function heelPath(ctx: Ctx) {
  ctx.moveTo(-48, -46);
  ctx.bezierCurveTo(-30, -40, -8, -14, 14, -15);
  ctx.quadraticCurveTo(40, -20, 52, -5);
  ctx.quadraticCurveTo(54, 0, 46, 0);
  ctx.lineTo(8, 0);
  ctx.quadraticCurveTo(-14, -3, -26, -20);
  ctx.lineTo(-33, 0);
  ctx.lineTo(-41, 0);
  ctx.lineTo(-52, -26);
  ctx.quadraticCurveTo(-56, -40, -48, -46);
  ctx.closePath();
}

/** 那双红色高跟鞋（剪纸）：(x, y) 是鞋底中心，s=1 时一双约 150 宽 */
export function heels(ctx: Ctx, x: number, y: number, s: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.lineJoin = 'round';
  for (const [dx, col] of [[-26, '#b81a30'], [22, '#e02a42']] as [number, string][]) {
    ctx.save();
    ctx.translate(dx, dx < 0 ? -5 : 0);
    ctx.beginPath();
    heelPath(ctx);
    ctx.lineWidth = 7;
    ctx.strokeStyle = CREAM;
    ctx.stroke();
    ctx.fillStyle = col;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.55)';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(20, -9);
    ctx.quadraticCurveTo(36, -12, 44, -5);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

export function glow(ctx: Ctx, x: number, y: number, r: number, color: string, a: number) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.save();
  ctx.globalAlpha *= a;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
