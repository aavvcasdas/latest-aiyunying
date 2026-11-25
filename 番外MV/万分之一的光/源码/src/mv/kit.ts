// 绘图工具：缓动、柔光、网点、云、泡泡、文字。所有逐帧函数只读传入的时间。
import { ENERGY } from './energy';

export const W = 1280, H = 720, TAU = Math.PI * 2;
export type C = CanvasRenderingContext2D;
export const BPM = 116, BEAT0 = 0.108, BEAT = 60 / BPM;

export interface F { c: C; t: number; lt: number; p: number; d: number }
export interface Shot { s: number; e: number; draw: (f: F) => void; fi?: number; fo?: number; fc?: string; bloom?: number }

export const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const ss = (t: number) => { t = clamp(t); return t * t * (3 - 2 * t); };
export const eOut = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
export const eIn = (t: number) => Math.pow(clamp(t), 3);
export const eBack = (t: number) => { if (t <= 0) return 0; if (t >= 1) return 1; const k = 1.70158; return 1 + (k + 1) * Math.pow(t - 1, 3) + k * Math.pow(t - 1, 2); };
export const rnd = (i: number, s = 0) => { const x = Math.sin(i * 127.1 + s * 311.7 + 13.37) * 43758.5453; return x - Math.floor(x); };
export const beatPos = (t: number) => (t - BEAT0) / BEAT;
/** 每拍一次的衰减脉冲 */
export const kick = (t: number, sharp = 5, every = 1) => { const b = beatPos(t) / every; return Math.exp(-(b - Math.floor(b)) * sharp); };
export const energy = (t: number) => {
  const x = clamp(t * 10, 0, ENERGY.length - 1.001), i = Math.floor(x);
  return lerp(ENERGY.charCodeAt(i) - 48, ENERGY.charCodeAt(i + 1) - 48, x - i) / 9;
};
export const blink = (t: number, o = 0) => ((t + o) % 3.3) < 0.13;

export function mk(w: number, h: number): HTMLCanvasElement {
  const cv = document.createElement('canvas'); cv.width = Math.max(1, Math.ceil(w)); cv.height = Math.max(1, Math.ceil(h)); return cv;
}

const hc = new Map<string, [number, number, number]>();
export function rgb(hex: string): [number, number, number] {
  let v = hc.get(hex);
  if (!v) {
    if (hex[0] === '#') { const n = parseInt(hex.slice(1, 7), 16); v = [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
    else { const m = hex.match(/[\d.]+/g) ?? ['0', '0', '0']; v = [Number(m[0]), Number(m[1]), Number(m[2])]; }
    if (hc.size < 4000) hc.set(hex, v);
  }
  return v;
}
export const rgba = (hex: string, a: number) => { const [r, g, b] = rgb(hex); return `rgba(${r},${g},${b},${clamp(a)})`; };
export const mix = (h1: string, h2: string, t: number) => { const a = rgb(h1), b = rgb(h2); t = clamp(t); return `rgb(${Math.round(lerp(a[0], b[0], t))},${Math.round(lerp(a[1], b[1], t))},${Math.round(lerp(a[2], b[2], t))})`; };

export function cam(c: C, z: number, cx = W / 2, cy = H / 2, rot = 0) { c.translate(W / 2, H / 2); c.rotate(rot); c.scale(z, z); c.translate(-cx, -cy); }

export function bg(c: C, cols: string[], x0 = 0, y0 = 0, x1 = 0, y1 = H) {
  const g = c.createLinearGradient(x0, y0, x1, y1);
  cols.forEach((k, i) => g.addColorStop(cols.length > 1 ? i / (cols.length - 1) : 0, k));
  c.fillStyle = g; c.fillRect(-W, -H, 3 * W, 3 * H);
}
export function wash(c: C, color: string, a: number) { if (a <= 0) return; c.save(); c.globalAlpha *= clamp(a); c.fillStyle = color; c.fillRect(-W, -H, 3 * W, 3 * H); c.restore(); }

/** 径向柔光；亮底用 source-over，暗底用 lighter */
export function glow(c: C, x: number, y: number, r: number, hex: string, a = 1, op: GlobalCompositeOperation = 'source-over') {
  if (a <= 0 || r <= 0) return;
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(hex, a)); g.addColorStop(0.35, rgba(hex, a * 0.5)); g.addColorStop(1, rgba(hex, 0));
  c.save(); c.globalCompositeOperation = op; c.fillStyle = g; c.fillRect(x - r, y - r, 2 * r, 2 * r); c.restore();
}
export function vignette(c: C, hex: string, a: number, inner = 0.45) {
  const g = c.createRadialGradient(W / 2, H / 2, H * inner, W / 2, H / 2, W * 0.72);
  g.addColorStop(0, rgba(hex, 0)); g.addColorStop(1, rgba(hex, a));
  c.fillStyle = g; c.fillRect(0, 0, W, H);
}

const tiles = new Map<string, HTMLCanvasElement>();
/** 半调网点 */
export function dots(c: C, hex: string, a = 1, gap = 24, r = 5, ox = 0, oy = 0) {
  const key = `${hex}|${gap}|${r}`;
  let tile = tiles.get(key);
  if (!tile) { tile = mk(gap * 2, gap * 2); const g = tile.getContext('2d')!; g.fillStyle = hex; g.beginPath(); g.arc(gap, gap, r * 2, 0, TAU); g.fill(); tiles.set(key, tile); }
  const p = c.createPattern(tile, 'repeat'); if (!p) return;
  c.save(); c.globalAlpha *= a; c.translate(((ox % gap) + gap) % gap - gap, ((oy % gap) + gap) % gap - gap); c.scale(0.5, 0.5);
  c.fillStyle = p; c.fillRect(0, 0, (W + 3 * gap) * 2, (H + 3 * gap) * 2); c.restore();
}

export function rays(c: C, x: number, y: number, n: number, rot: number, hex: string, a: number, R = 1700, frac = 0.5) {
  c.save(); c.translate(x, y); c.rotate(rot); c.fillStyle = rgba(hex, a);
  for (let i = 0; i < n; i++) { c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, R, (i * TAU) / n, ((i + frac) * TAU) / n); c.closePath(); c.fill(); }
  c.restore();
}

export function cloud(c: C, x: number, y: number, s: number, hex = '#ffffff', a = 1, seed = 0) {
  c.save(); c.globalAlpha *= a; c.fillStyle = hex; c.beginPath();
  for (let i = 0; i < 7; i++) {
    const u = i / 6 - 0.5, r = s * (0.34 + 0.3 * rnd(i, seed + 5)) * (1 - Math.abs(u) * 1.1), px = x + u * s * 2.2, py = y - r * 0.7;
    c.moveTo(px + r, py); c.arc(px, py, r, 0, TAU);
  }
  c.moveTo(x + s * 1.25, y - s * 0.08); c.ellipse(x, y - s * 0.08, s * 1.25, s * 0.26, 0, 0, TAU);
  c.fill(); c.restore();
}

export function sky(c: C, t: number, o: { cols?: string[]; n?: number; sp?: number; sea?: number; seed?: number; ca?: number } = {}) {
  bg(c, o.cols ?? ['#2f8ff0', '#6cc4ff', '#c9efff']);
  const n = o.n ?? 7, sp = o.sp ?? 14, sd = o.seed ?? 0;
  for (let i = 0; i < n; i++) {
    const d = 0.4 + rnd(i, sd + 1) * 0.9, x = ((rnd(i, sd + 2) * 1700 + t * sp * d) % 1700) - 210;
    const y = 70 + rnd(i, sd + 3) * (o.sea ? o.sea - 150 : 520);
    cloud(c, x, y, 60 + d * 90, '#ffffff', (o.ca ?? 0.95) * (0.55 + 0.4 * d), i + sd);
  }
  if (o.sea) {
    const y = o.sea, g = c.createLinearGradient(0, y, 0, H);
    g.addColorStop(0, '#f2fdff'); g.addColorStop(0.12, '#9be0ff'); g.addColorStop(1, '#3aa6f2');
    c.fillStyle = g; c.fillRect(-W, y, 3 * W, H);
    c.fillStyle = 'rgba(255,255,255,.6)';
    for (let i = 0; i < 46; i++) {
      const k = rnd(i, 7) ** 2, gy = y + 6 + k * (H - y), gw = 20 + k * 150;
      const gx = (((rnd(i, 9) * 1500 + t * 18 * (i % 2 ? 1 : -1) * (0.3 + k)) % 1500) + 1500) % 1500 - 110;
      c.fillRect(gx, gy, gw, 1.5 + k * 3);
    }
    glow(c, W / 2, y, 520, '#ffffff', 0.7);
  }
}

export function stars(c: C, t: number, n = 120, seed = 0, a = 1, hex = '#ffffff') {
  c.save(); c.fillStyle = hex;
  for (let i = 0; i < n; i++) {
    const x = rnd(i, seed + 1) * W, y = rnd(i, seed + 2) * H * 0.8, r = 0.6 + rnd(i, seed + 3) * 1.8;
    c.globalAlpha = a * (0.35 + 0.65 * Math.abs(Math.sin(t * (0.6 + rnd(i, seed + 4) * 2) + i)));
    c.fillRect(x - r, y - r, r * 2, r * 2);
  }
  c.restore();
}

/** 漂浮光尘 */
export function motes(c: C, t: number, n: number, hex: string, a = 0.7, seed = 0, up = 14, op: GlobalCompositeOperation = 'source-over') {
  for (let i = 0; i < n; i++) {
    const x = (rnd(i, seed + 1) * W + Math.sin(t * 0.5 + i) * 30 + W) % W;
    const y = (((rnd(i, seed + 2) * H - t * up * (0.4 + rnd(i, seed + 3))) % H) + H) % H;
    const r = 3 + rnd(i, seed + 4) * 9;
    glow(c, x, y, r, hex, a * (0.4 + 0.6 * Math.abs(Math.sin(t * 1.3 + i * 2.1))), op);
  }
}

export function bubble(c: C, x: number, y: number, r: number, a = 1, tint = '#bfeaff') {
  c.save(); c.globalAlpha *= a;
  const g = c.createRadialGradient(x, y, r * 0.55, x, y, r);
  g.addColorStop(0, rgba(tint, 0.05)); g.addColorStop(0.8, rgba(tint, 0.28)); g.addColorStop(1, 'rgba(255,255,255,.95)');
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
  c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = Math.max(1.5, r * 0.035); c.stroke();
  c.lineCap = 'round'; c.lineWidth = Math.max(2, r * 0.07); c.beginPath(); c.arc(x, y, r * 0.74, Math.PI * 1.12, Math.PI * 1.42); c.stroke();
  c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.arc(x + r * 0.42, y + r * 0.46, r * 0.07, 0, TAU); c.fill();
  c.restore();
}

export function star4(c: C, x: number, y: number, r: number, color: string, a = 1, rot = 0) {
  if (a <= 0 || r <= 0) return;
  c.save(); c.translate(x, y); c.rotate(rot); c.globalAlpha *= a; c.fillStyle = color; c.beginPath();
  for (let i = 0; i < 8; i++) { const rr = i % 2 ? r * 0.16 : r, an = (i * TAU) / 8; c.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); }
  c.closePath(); c.fill(); c.restore();
}

export function note(c: C, x: number, y: number, s: number, color: string, a = 1, kind = 0, rot = 0) {
  if (!(s > 0.01) || a <= 0) return;
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s); c.globalAlpha *= a; c.fillStyle = color; c.strokeStyle = color; c.lineWidth = 2.6; c.lineCap = 'round';
  const head = (hx: number, hy: number) => { c.beginPath(); c.ellipse(hx, hy, 7.5, 5.4, -0.4, 0, TAU); c.fill(); };
  if (kind % 2 === 0) {
    head(0, 0); c.beginPath(); c.moveTo(6.6, -1.5); c.lineTo(6.6, -30); c.stroke();
    c.beginPath(); c.moveTo(6.6, -30); c.quadraticCurveTo(18, -24, 15, -12); c.quadraticCurveTo(15, -20, 6.6, -22); c.fill();
  } else {
    head(0, 0); head(22, -5); c.beginPath(); c.moveTo(6.6, -1.5); c.lineTo(6.6, -30); c.lineTo(28.6, -35); c.lineTo(28.6, -6.5); c.stroke();
    c.lineWidth = 6; c.beginPath(); c.moveTo(6.6, -28); c.lineTo(28.6, -33); c.stroke();
  }
  c.restore();
}

export function heart(c: C, x: number, y: number, s: number, color: string, a = 1, line?: string) {
  if (!(s > 0.2) || a <= 0) return;
  c.save(); c.translate(x, y); c.scale(s / 20, s / 20); c.globalAlpha *= a; c.beginPath();
  c.moveTo(0, 16); c.bezierCurveTo(-26, -2, -14, -22, 0, -8); c.bezierCurveTo(14, -22, 26, -2, 0, 16); c.closePath();
  if (color !== 'none') { c.fillStyle = color; c.fill(); }
  if (line) { c.strokeStyle = line; c.lineWidth = 3; c.lineJoin = 'round'; c.stroke(); }
  c.restore();
}

export function tear(c: C, x: number, y: number, s: number, color = '#8fd0ff', a = 1) {
  if (!(s > 0.01) || a <= 0) return;
  c.save(); c.translate(x, y); c.scale(s, s); c.globalAlpha *= a; c.fillStyle = color; c.beginPath();
  c.moveTo(0, -12); c.bezierCurveTo(9, 0, 8, 10, 0, 10); c.bezierCurveTo(-8, 10, -9, 0, 0, -12); c.fill();
  c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.arc(-2.4, 3, 2, 0, TAU); c.fill(); c.restore();
}

export function rr(c: C, x: number, y: number, w: number, h: number, r: number) {
  r = Math.min(r, w / 2, h / 2); c.beginPath(); c.moveTo(x + r, y); c.lineTo(x + w - r, y); c.quadraticCurveTo(x + w, y, x + w, y + r);
  c.lineTo(x + w, y + h - r); c.quadraticCurveTo(x + w, y + h, x + w - r, y + h); c.lineTo(x + r, y + h); c.quadraticCurveTo(x, y + h, x, y + h - r);
  c.lineTo(x, y + r); c.quadraticCurveTo(x, y, x + r, y); c.closePath();
}

export const FONT = '"ZCOOLKL","PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans SC","Noto Sans CJK SC","Source Han Sans SC",sans-serif';
export const HAND = '"ZCOOLKL","Kaiti SC","STKaiti","KaiTi","楷体","Noto Serif SC","Songti SC",serif';
export interface TO { w?: number; font?: string; align?: CanvasTextAlign; glow?: string; blur?: number; rot?: number; a?: number; stroke?: string; sw?: number; sc?: number; sx?: number }
export function txt(c: C, s: string, x: number, y: number, size: number, color: string, o: TO = {}) {
  if ((o.a != null && o.a <= 0) || size < 0.5 || (o.sc != null && o.sc < 0.01)) return;
  c.save(); c.translate(x, y); if (o.rot) c.rotate(o.rot); if (o.sc || o.sx) c.scale((o.sc ?? 1) * (o.sx ?? 1), o.sc ?? 1);
  if (o.a != null) c.globalAlpha *= clamp(o.a);
  c.font = `${o.w ?? 700} ${size}px ${o.font ?? FONT}`; c.textAlign = o.align ?? 'center'; c.textBaseline = 'middle';
  if (o.glow) { c.shadowColor = o.glow; c.shadowBlur = o.blur ?? size * 0.4; }
  if (o.stroke) { c.lineWidth = o.sw ?? size * 0.12; c.strokeStyle = o.stroke; c.lineJoin = 'round'; c.strokeText(s, 0, 0); }
  c.fillStyle = color; c.fillText(s, 0, 0); c.restore();
}

/** 铅笔乱线（糟糕、涂掉） */
export function scribble(c: C, x: number, y: number, w: number, h: number, seed: number, color: string, lw = 2.5, n = 22, p = 1) {
  c.save(); c.strokeStyle = color; c.lineWidth = lw; c.lineJoin = 'round'; c.lineCap = 'round'; c.beginPath();
  const m = Math.max(2, Math.floor(n * clamp(p)));
  for (let i = 0; i < m; i++) { const px = x + (rnd(i, seed) - 0.5) * w, py = y + (rnd(i, seed + 1) - 0.5) * h; if (i) c.lineTo(px, py); else c.moveTo(px, py); }
  c.stroke(); c.restore();
}

/** 五线谱光带：沿正弦流动的五条线，返回取点函数 */
export function staff(c: C, t: number, y0: number, amp: number, color: string, a = 1, o: { gap?: number; freq?: number; sp?: number; lw?: number; ph?: number; wild?: number } = {}) {
  const gap = o.gap ?? 13, fq = o.freq ?? 0.006, sp = o.sp ?? 1.2, ph = o.ph ?? 0, wild = o.wild ?? 0;
  const fy = (x: number) => y0 + Math.sin(x * fq + t * sp + ph) * amp + Math.sin(x * fq * 2.7 - t * sp * 1.6 + ph) * amp * 0.35 * (1 + wild) + Math.sin(x * fq * 6.1 + t * 3) * amp * 0.25 * wild;
  c.save(); c.globalAlpha *= a; c.strokeStyle = color; c.lineWidth = o.lw ?? 2;
  for (let k = -2; k <= 2; k++) { c.beginPath(); for (let x = -20; x <= W + 20; x += 16) { const y = fy(x) + k * gap; if (x === -20) c.moveTo(x, y); else c.lineTo(x, y); } c.stroke(); }
  c.restore();
  return fy;
}

/** 屏幕两侧漏光：复刻参考片的过曝柔光 */
export function leak(c: C, t: number, hex = '#ffffff', a = 0.6, side = 0) {
  const x = side ? W + 40 : -40;
  glow(c, x, 120 + Math.sin(t * 0.4) * 60, 620, hex, a);
  glow(c, W - x, H - 60, 420, hex, a * 0.55);
}

/** 像素烟花：方块粒子 */
export function firework(c: C, x: number, y: number, age: number, seed: number, hex: string, R = 190, n = 46) {
  if (age < 0 || age > 2.2) return;
  const k = eOut(age / 1.1), fade = 1 - seg(age, 0.9, 2.2);
  c.save(); c.globalCompositeOperation = 'lighter';
  glow(c, x, y, R * 1.3 * (1 - seg(age, 0, 0.5)) + 10, hex, 0.55 * (1 - seg(age, 0, 0.6)), 'lighter');
  for (let i = 0; i < n; i++) {
    const an = (i / n) * TAU + rnd(i, seed) * 0.5, rad = R * k * (0.45 + 0.55 * rnd(i, seed + 1));
    const px = x + Math.cos(an) * rad, py = y + Math.sin(an) * rad + age * age * 26, sz = 3 + rnd(i, seed + 2) * 5;
    c.globalAlpha = fade * (0.5 + 0.5 * Math.abs(Math.sin(age * 14 + i)));
    c.fillStyle = i % 3 === 0 ? '#ffffff' : hex; c.fillRect(Math.round(px - sz / 2), Math.round(py - sz / 2), sz, sz);
    c.globalAlpha = fade * 0.35; c.fillRect(Math.round(x + Math.cos(an) * rad * 0.8 - 1.5), Math.round(y + Math.sin(an) * rad * 0.8 + age * age * 20 - 1.5), 3, 3);
  }
  c.restore();
}
