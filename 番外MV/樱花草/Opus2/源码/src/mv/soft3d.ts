// 软 3D：Canvas2D 画家算法。透视相机 + 低多边形面片（兰伯特光照 + 距离雾）+ 像素角色纸片人（广告牌）。
// 每帧重新收集可绘制体、按深度从远到近画；同一个时间点永远画出同一帧（无随机、无累积状态）。
import { atlasImage, rectOf } from './atlas';

export const W = 1280, H = 720;
export type V3 = [number, number, number];
export type RGB = [number, number, number];
export const PX = 1.7 / 88; // 一个像素格对应的世界长度：本鲸身高约 1.7

export const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const ease = (x: number) => { x = clamp(x); return x * x * (3 - 2 * x); };
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
export const backOut = (x: number) => { const t = clamp(x) - 1; return 1 + t * t * (2.7 * t + 1.7); };
export const hash = (n: number) => { const v = Math.sin(n * 127.1 + 3.7) * 43758.5453; return v - Math.floor(v); };
export const hex = (h: string): RGB => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
export const rgb = (c: RGB, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
export const mix = (a: RGB, b: RGB, t: number): RGB => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const norm = (a: V3): V3 => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
export const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

export interface Look {
  sky: [string, string, string]; // 天顶 / 中段 / 地平线
  fog: RGB; fogNear: number; fogFar: number;
  light: V3; amb: number; ground: RGB;
}

export interface SpriteOpts { flip?: boolean; alpha?: number; lift?: number; sq?: number; tilt?: number; tint?: string; glow?: string; shadow?: boolean; scale?: number }

type Item = { z: number; draw: (g: CanvasRenderingContext2D) => void };
const NEAR = 0.25;

export class Scene {
  readonly items: Item[] = [];
  readonly F: number;
  readonly pos: V3; readonly f: V3; readonly r: V3; readonly u: V3;
  readonly L: V3;
  constructor(public look: Look, pos: V3, tgt: V3, fovDeg: number, roll = 0) {
    this.pos = pos;
    this.F = (H / 2) / Math.tan((fovDeg * Math.PI) / 360);
    this.f = norm(sub(tgt, pos));
    let r = norm(cross(this.f, [0, 1, 0]));
    let u = cross(r, this.f);
    if (roll) { const c = Math.cos(roll), s = Math.sin(roll); const r2: V3 = [r[0] * c + u[0] * s, r[1] * c + u[1] * s, r[2] * c + u[2] * s]; u = cross(r2, this.f); r = r2; }
    this.r = r; this.u = u;
    this.L = norm(look.light);
  }
  toCam(p: V3): V3 { const d = sub(p, this.pos); return [dot(d, this.r), dot(d, this.u), dot(d, this.f)]; }
  proj(p: V3): [number, number, number] | null {
    const c = this.toCam(p);
    if (c[2] < NEAR) return null;
    return [W / 2 + (c[0] / c[2]) * this.F, H / 2 - (c[1] / c[2]) * this.F, c[2]];
  }
  /** 地平线在屏幕上的高度 */
  horizon(): number {
    const fh = norm([this.f[0], 0, this.f[2]]);
    const d = dot(fh, this.f);
    return H / 2 - (dot(fh, this.u) / Math.max(0.05, d)) * this.F;
  }
  yaw(): number { return Math.atan2(this.f[0], -this.f[2]); }
  fogK(z: number): number { return clamp((z - this.look.fogNear) / (this.look.fogFar - this.look.fogNear)); }
  fogged(c: RGB, z: number): RGB { return mix(c, this.look.fog, this.fogK(z)); }

  /** 低多边形面：center 给出时按「朝外」定法线并剔除背面 */
  poly(pts: V3[], col: RGB, o: { center?: V3; alpha?: number; emissive?: boolean; outline?: string; bias?: number } = {}): void {
    const qs: [number, number, number][] = [];
    for (const p of pts) { const q = this.proj(p); if (!q) return; qs.push(q); }
    let n = norm(cross(sub(pts[1], pts[0]), sub(pts[2], pts[0])));
    const c: V3 = [0, 0, 0]; for (const p of pts) { c[0] += p[0] / pts.length; c[1] += p[1] / pts.length; c[2] += p[2] / pts.length; }
    if (o.center) { if (dot(n, sub(c, o.center)) < 0) n = [-n[0], -n[1], -n[2]]; if (dot(n, sub(this.pos, c)) < 0) return; }
    else if (n[1] < 0) n = [-n[0], -n[1], -n[2]];
    const z = qs.reduce((a, q) => a + q[2], 0) / qs.length;
    const lit = o.emissive ? 1 : this.look.amb + (1 - this.look.amb) * Math.max(0, dot(n, this.L));
    const fc = this.fogged([col[0] * lit, col[1] * lit, col[2] * lit], z);
    const alpha = o.alpha ?? 1;
    this.items.push({ z: z + (o.bias ?? 0), draw: (g) => {
      g.globalAlpha = alpha; g.fillStyle = rgb(fc);
      g.beginPath(); g.moveTo(qs[0][0], qs[0][1]); for (let i = 1; i < qs.length; i++) g.lineTo(qs[i][0], qs[i][1]); g.closePath(); g.fill();
      g.strokeStyle = o.outline ?? rgb(fc); g.lineWidth = o.outline ? 1.2 : 0.8; g.stroke(); g.globalAlpha = 1;
    } });
  }
  line(a: V3, b: V3, w: number, col: RGB, alpha = 1): void {
    let ca = this.toCam(a), cb = this.toCam(b);
    if (ca[2] < NEAR && cb[2] < NEAR) return;
    if (ca[2] < NEAR) { const q = (NEAR - ca[2]) / (cb[2] - ca[2]); ca = lerp3(ca, cb, q); }
    else if (cb[2] < NEAR) { const q = (NEAR - cb[2]) / (ca[2] - cb[2]); cb = lerp3(cb, ca, q); }
    const z = (ca[2] + cb[2]) / 2, F = this.F;
    const x0 = W / 2 + (ca[0] / ca[2]) * F, y0 = H / 2 - (ca[1] / ca[2]) * F, x1 = W / 2 + (cb[0] / cb[2]) * F, y1 = H / 2 - (cb[1] / cb[2]) * F;
    const c = this.fogged(col, z), lw = Math.max(1, (w * F) / z);
    this.items.push({ z, draw: (g) => { g.globalAlpha = alpha; g.strokeStyle = rgb(c); g.lineWidth = lw; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.globalAlpha = 1; } });
  }
  glow(p: V3, r: number, col: RGB, a = 1, core = true): void {
    const q = this.proj(p); if (!q) return;
    const rr = (r * this.F) / q[2]; if (rr < 0.4) return;
    const fade = 1 - this.fogK(q[2]) * 0.6;
    this.items.push({ z: q[2] - 0.02, draw: (g) => {
      const gr = g.createRadialGradient(q[0], q[1], 0, q[0], q[1], rr);
      gr.addColorStop(0, rgb(col, a * fade)); gr.addColorStop(0.35, rgb(col, a * 0.45 * fade)); gr.addColorStop(1, rgb(col, 0));
      g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.beginPath(); g.arc(q[0], q[1], rr, 0, Math.PI * 2); g.fill();
      if (core) { g.fillStyle = rgb([255, 255, 240], a * fade); g.beginPath(); g.arc(q[0], q[1], Math.max(0.8, rr * 0.12), 0, Math.PI * 2); g.fill(); }
      g.globalCompositeOperation = 'source-over';
    } });
  }
  /** 自定义：fn 收到屏幕坐标与每世界单位像素数 */
  custom(p: V3, fn: (g: CanvasRenderingContext2D, x: number, y: number, s: number, z: number) => void, bias = 0): void {
    const q = this.proj(p); if (!q) return;
    const s = this.F / q[2];
    this.items.push({ z: q[2] - bias, draw: (g) => fn(g, q[0], q[1], s, q[2]) });
  }
  /** 像素角色纸片人：p 为脚底点 */
  sprite(p: V3, key: string, o: SpriteOpts = {}): void {
    const q = this.proj(p); if (!q) return;
    const [sx, sy, sw, sh] = rectOf(key);
    const k = ((this.F * PX) / q[2]) * (o.scale ?? 1);
    const w = sw * k, h = sh * k, lift = (o.lift ?? 0) * (this.F / q[2]);
    const alpha = o.alpha ?? 1; if (alpha <= 0.01) return;
    const fogA = this.fogK(q[2]);
    this.items.push({ z: q[2] - 0.05, draw: (g) => {
      g.save();
      if (o.shadow !== false && lift < h) {
        g.globalAlpha = 0.28 * alpha * (1 - lift / h); g.fillStyle = '#10101e';
        g.beginPath(); g.ellipse(q[0], q[1] + 1, w * 0.32, w * 0.09, 0, 0, Math.PI * 2); g.fill();
      }
      g.globalAlpha = alpha;
      g.translate(q[0], q[1] - lift);
      if (o.tilt) g.rotate(o.tilt);
      if (o.flip) g.scale(-1, 1);
      if (o.sq) g.scale(1 + o.sq * 0.9, 1 - o.sq);
      if (o.glow) {
        const gr = g.createRadialGradient(0, -h * 0.5, h * 0.1, 0, -h * 0.5, h * 0.8);
        gr.addColorStop(0, o.glow); gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = gr; g.beginPath(); g.ellipse(0, -h * 0.5, w, h * 0.8, 0, 0, Math.PI * 2); g.fill();
      }
      g.imageSmoothingEnabled = false;
      const tint = o.tint ?? (fogA > 0.05 ? rgb(this.look.fog, fogA * 0.8) : null);
      if (tint) {
        const oc = scratch(sw, sh), og = oc.getContext('2d')!;
        og.globalCompositeOperation = 'source-over'; og.clearRect(0, 0, sw, sh); og.imageSmoothingEnabled = false;
        og.drawImage(atlasImage(), sx, sy, sw, sh, 0, 0, sw, sh);
        og.globalCompositeOperation = 'source-atop'; og.fillStyle = tint; og.fillRect(0, 0, sw, sh);
        g.drawImage(oc, 0, 0, sw, sh, -w / 2, -h, w, h);
      } else g.drawImage(atlasImage(), sx, sy, sw, sh, -w / 2, -h, w, h);
      g.restore();
    } });
  }
  /** 小道具 / 表情贴（以中心点摆放，世界尺寸 size） */
  thing(p: V3, key: string, size: number, alpha = 1, rot = 0): void {
    const q = this.proj(p); if (!q) return;
    const [sx, sy, sw, sh] = rectOf(key);
    const k = ((size / Math.max(sw, sh)) * this.F) / q[2];
    this.items.push({ z: q[2] - 0.08, draw: (g) => {
      g.save(); g.globalAlpha = alpha; g.translate(q[0], q[1]); if (rot) g.rotate(rot); g.imageSmoothingEnabled = false;
      g.drawImage(atlasImage(), sx, sy, sw, sh, (-sw * k) / 2, (-sh * k) / 2, sw * k, sh * k); g.restore();
    } });
  }
  flush(g: CanvasRenderingContext2D): void {
    this.items.sort((a, b) => b.z - a.z);
    for (const it of this.items) it.draw(g);
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  }
}

let scratchCanvas: HTMLCanvasElement | null = null;
function scratch(w: number, h: number): HTMLCanvasElement {
  if (!scratchCanvas) scratchCanvas = document.createElement('canvas');
  if (scratchCanvas.width < w || scratchCanvas.height < h) { scratchCanvas.width = Math.max(w, scratchCanvas.width); scratchCanvas.height = Math.max(h, scratchCanvas.height); }
  return scratchCanvas;
}

// ---------------- 低多边形积木 ----------------
/** n 棱柱（竖直）：可倾斜（顶点偏移 lean） */
export function prism(sc: Scene, x: number, y: number, z: number, r: number, h: number, n: number, col: RGB, lean: [number, number] = [0, 0], top = true): void {
  const c: V3 = [x + lean[0] / 2, y + h / 2, z + lean[1] / 2];
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2;
    const b0: V3 = [x + Math.cos(a0) * r, y, z + Math.sin(a0) * r], b1: V3 = [x + Math.cos(a1) * r, y, z + Math.sin(a1) * r];
    const t0: V3 = [b0[0] + lean[0], y + h, b0[2] + lean[1]], t1: V3 = [b1[0] + lean[0], y + h, b1[2] + lean[1]];
    sc.poly([b0, b1, t1, t0], col, { center: c });
  }
  if (top) sc.poly(Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2; return [x + lean[0] + Math.cos(a) * r, y + h, z + lean[1] + Math.sin(a) * r] as V3; }), col, { center: c });
}
/** 圆锥 / 棱锥 */
export function cone(sc: Scene, x: number, y: number, z: number, r: number, h: number, n: number, col: RGB, rot = 0): void {
  const apex: V3 = [x, y + h, z], c: V3 = [x, y + h * 0.3, z];
  for (let i = 0; i < n; i++) {
    const a0 = rot + (i / n) * Math.PI * 2, a1 = rot + ((i + 1) / n) * Math.PI * 2;
    sc.poly([[x + Math.cos(a0) * r, y, z + Math.sin(a0) * r], [x + Math.cos(a1) * r, y, z + Math.sin(a1) * r], apex], col, { center: c });
  }
}
/** 低多边形球 / 团 */
export function blob(sc: Scene, x: number, y: number, z: number, r: number, col: RGB, seed = 0, ry = 1, seg = 6): void {
  const rings = 4, c: V3 = [x, y, z];
  const P = (i: number, j: number): V3 => {
    const th = (i / rings) * Math.PI, ph = (j / seg) * Math.PI * 2 + seed;
    const k = 1 + (hash(seed * 31 + i * 7 + (j % seg)) - 0.5) * 0.22 * (i > 0 && i < rings ? 1 : 0);
    return [x + Math.sin(th) * Math.cos(ph) * r * k, y + Math.cos(th) * r * ry * k, z + Math.sin(th) * Math.sin(ph) * r * k];
  };
  for (let i = 0; i < rings; i++) for (let j = 0; j < seg; j++) {
    const a = P(i, j), b = P(i, j + 1), cc = P(i + 1, j + 1), d = P(i + 1, j);
    const shade = 0.92 + hash(seed + i * 13 + j) * 0.16;
    const cl: RGB = [col[0] * shade, col[1] * shade, col[2] * shade];
    if (i === 0) sc.poly([a, cc, d], cl, { center: c }); else if (i === rings - 1) sc.poly([a, b, d], cl, { center: c }); else sc.poly([a, b, cc, d], cl, { center: c });
  }
}
export function box(sc: Scene, x: number, y: number, z: number, w: number, h: number, d: number, col: RGB, rotY = 0): void {
  const c: V3 = [x, y + h / 2, z], cs = Math.cos(rotY), sn = Math.sin(rotY);
  const P = (dx: number, dy: number, dz: number): V3 => [x + dx * cs - dz * sn, y + dy, z + dx * sn + dz * cs];
  const hw = w / 2, hd = d / 2;
  const v = [P(-hw, 0, -hd), P(hw, 0, -hd), P(hw, 0, hd), P(-hw, 0, hd), P(-hw, h, -hd), P(hw, h, -hd), P(hw, h, hd), P(-hw, h, hd)];
  const faces = [[0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7], [4, 5, 6, 7]];
  for (const f of faces) sc.poly(f.map((i) => v[i]), col, { center: c });
}
/** 地面：以 (cx, cz) 为中心的低多边形网格，顶点带起伏，颜色带噪点 */
export function groundGrid(sc: Scene, cx: number, cz: number, size: number, n: number, cA: RGB, cB: RGB, hfn: (x: number, z: number) => number = () => 0, seed = 0): void {
  const step = size / n, x0 = Math.floor((cx - size / 2) / step) * step, z0 = Math.floor((cz - size / 2) / step) * step;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const xa = x0 + i * step, za = z0 + j * step, xb = xa + step, zb = za + step;
    const k = hash(Math.round(xa / step) * 91.3 + Math.round(za / step) * 17.1 + seed);
    const col = mix(cA, cB, k);
    const p00: V3 = [xa, hfn(xa, za), za], p10: V3 = [xb, hfn(xb, za), za], p11: V3 = [xb, hfn(xb, zb), zb], p01: V3 = [xa, hfn(xa, zb), zb];
    sc.poly([p00, p10, p11], col, { bias: 0.3 }); sc.poly([p00, p11, p01], mix(col, cB, 0.15), { bias: 0.3 });
  }
}

// ---------------- 天空 ----------------
export function drawSky(g: CanvasRenderingContext2D, sc: Scene, T: number, o: { stars?: number; galaxy?: number; moon?: { dir: V3; r: number; crescent?: boolean } | null } = {}): void {
  const hy = sc.horizon(), lk = sc.look;
  const gr = g.createLinearGradient(0, hy - 620, 0, hy);
  gr.addColorStop(0, lk.sky[0]); gr.addColorStop(0.6, lk.sky[1]); gr.addColorStop(1, lk.sky[2]);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const yaw = sc.yaw();
  if (o.stars) {
    for (let i = 0; i < o.stars; i++) {
      const sx = ((((hash(i) * 3000 - yaw * 900) % 3000) + 3000) % 3000) - 860, sy = hy - 20 - hash(i + 99) * 700;
      if (sx < 0 || sx > W || sy < -5) continue;
      g.globalAlpha = (0.3 + 0.7 * hash(i + 7)) * (0.65 + 0.35 * Math.sin(T * (1.5 + hash(i) * 2) + i));
      g.fillStyle = '#fff'; const s = hash(i + 3) > 0.93 ? 2.6 : 1.6; g.fillRect(sx, sy, s, s);
    }
    g.globalAlpha = 1;
  }
  if (o.galaxy) {
    // 银河：一条斜过天空的光带
    const a = o.galaxy;
    g.save(); g.globalCompositeOperation = 'lighter';
    const off = ((-yaw * 900) % 3000);
    for (let i = 0; i < 260; i++) {
      const s = hash(i * 3.1), x = ((s * 2200 + off) % 2200 + 2200) % 2200 - 460;
      const y = hy - 120 - (x / W) * 380 + (hash(i * 7.7) - 0.5) * 120 * (1 - Math.abs(hash(i * 1.3) - 0.5));
      const r = 30 + hash(i * 5.3) * 70;
      const gg = g.createRadialGradient(x, y, 0, x, y, r);
      const hue = hash(i * 2.2) > 0.5 ? '180,170,255' : '255,190,230';
      gg.addColorStop(0, `rgba(${hue},${0.07 * a})`); gg.addColorStop(1, `rgba(${hue},0)`);
      g.fillStyle = gg; g.fillRect(x - r, y - r, r * 2, r * 2);
    }
    for (let i = 0; i < 380; i++) {
      const x = ((hash(i * 9.1) * 2200 + off) % 2200 + 2200) % 2200 - 460;
      const y = hy - 120 - (x / W) * 380 + (hash(i * 4.4) - 0.5) * 140;
      g.fillStyle = `rgba(255,255,255,${(0.4 + 0.6 * hash(i)) * a * (0.6 + 0.4 * Math.sin(T * 3 + i))})`;
      g.fillRect(x, y, 1.6, 1.6);
    }
    g.restore();
  }
  if (o.moon) {
    const m = o.moon, q = sc.proj([sc.pos[0] + m.dir[0] * 500, sc.pos[1] + m.dir[1] * 500, sc.pos[2] + m.dir[2] * 500]);
    if (q) {
      const r = m.r;
      const gg = g.createRadialGradient(q[0], q[1], r * 0.5, q[0], q[1], r * 4);
      gg.addColorStop(0, 'rgba(255,246,210,0.45)'); gg.addColorStop(1, 'rgba(255,246,210,0)');
      g.fillStyle = gg; g.fillRect(q[0] - r * 4, q[1] - r * 4, r * 8, r * 8);
      g.fillStyle = '#fff6d8'; g.beginPath(); g.arc(q[0], q[1], r, 0, Math.PI * 2); g.fill();
      if (m.crescent) { g.fillStyle = lk.sky[1]; g.beginPath(); g.arc(q[0] + r * 0.45, q[1] - r * 0.25, r * 0.92, 0, Math.PI * 2); g.fill(); }
      else { g.fillStyle = 'rgba(220,200,150,0.35)'; g.beginPath(); g.arc(q[0] - r * 0.3, q[1] - r * 0.1, r * 0.22, 0, 7); g.arc(q[0] + r * 0.25, q[1] + r * 0.3, r * 0.15, 0, 7); g.fill(); }
    }
  }
  // 地面底色（远处被雾吃掉）
  const gg = g.createLinearGradient(0, hy, 0, H);
  gg.addColorStop(0, rgb(lk.fog)); gg.addColorStop(0.35, rgb(mix(lk.fog, lk.ground, 0.7))); gg.addColorStop(1, rgb(lk.ground));
  g.fillStyle = gg; g.fillRect(0, Math.max(0, hy), W, H - Math.max(0, hy));
}
