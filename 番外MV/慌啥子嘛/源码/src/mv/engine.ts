// Canvas2D 软 3D 引擎：透视投影 + 画家算法 + 柔光着色，像素角色当纸片人站在里面
import { atlasImage, fr, heightOf, type CharId } from './atlas';

export type V3 = [number, number, number];
export interface Cam {
  pos: V3;
  look: V3;
  fov?: number;
}
export interface Proj {
  x: number;
  y: number;
  s: number;
  z: number;
}

// ---------- 数学 ----------
export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const clamp = (x: number, a: number, b: number) => (x < a ? a : x > b ? b : x);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const ease = (t: number) => {
  t = clamp01(t);
  return t * t * (3 - 2 * t);
};
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
export const easeIn = (t: number) => Math.pow(clamp01(t), 3);
export const easeInOut = (t: number) => {
  t = clamp01(t);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
export const backOut = (t: number) => {
  t = clamp01(t);
  const c = 1.70158;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
};
export const bounceOut = (t: number) => {
  t = clamp01(t);
  const n = 7.5625,
    d = 2.75;
  if (t < 1 / d) return n * t * t;
  if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75;
  if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375;
  return n * (t -= 2.625 / d) * t + 0.984375;
};
export const seg = (u: number, a: number, b: number) => clamp01((u - a) / (b - a));
export const tri = (t: number) => 1 - Math.abs(2 * clamp01(t) - 1); // 0→1→0
export const hash = (i: number, salt = 0) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233 + 1.5) * 43758.5453;
  return x - Math.floor(x);
};
export const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
export const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const len = (a: V3) => Math.hypot(a[0], a[1], a[2]);
export const norm = (a: V3): V3 => {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
export const lerp3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const cam = (pos: V3, look: V3, fov = 40): Cam => ({ pos, look, fov });
export const glide = (A: Cam, B: Cam, t: number): Cam => ({
  pos: lerp3(A.pos, B.pos, t),
  look: lerp3(A.look, B.look, t),
  fov: lerp(A.fov ?? 40, B.fov ?? 40, t),
});

// ---------- 颜色 ----------
const colorCache = new Map<string, [number, number, number, number]>();
export function parseColor(c: string): [number, number, number, number] {
  let v = colorCache.get(c);
  if (v) return v;
  if (c[0] === '#') {
    const h = c.length === 4 ? c.slice(1).split('').map((x) => x + x).join('') : c.slice(1);
    v = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), h.length >= 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1];
  } else {
    const m = c.match(/[\d.]+/g) || ['0', '0', '0'];
    v = [+m[0], +m[1], +m[2], m[3] !== undefined ? +m[3] : 1];
  }
  colorCache.set(c, v);
  return v;
}
export const rgba = (r: number, g: number, b: number, a = 1) => `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${a.toFixed(3)})`;
export function mix(c1: string, c2: string, t: number): string {
  if (t <= 0) return c1;
  if (t >= 1) return c2;
  const a = parseColor(c1),
    b = parseColor(c2);
  return rgba(lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t), lerp(a[3], b[3], t));
}
export function alpha(c: string, a: number): string {
  const p = parseColor(c);
  return rgba(p[0], p[1], p[2], clamp01(a * p[3]));
}
export const lighten = (c: string, t: number) => mix(c, '#ffffff', t);
export const darken = (c: string, t: number) => mix(c, '#1a1f3a', t);

// ---------- 光照预设（时辰）----------
export interface Look {
  sky: [string, string, string];
  glow: string;
  glowA: number;
  ground: [string, string]; // 近 / 远
  fog: string;
  fogNear: number;
  fogFar: number;
  fogMax: number;
  tint: string;
  tintA: number;
  stars: number;
  light: [number, number]; // 屏幕空间光源方向（用于球体高光）
  shadowA: number;
}

export const LOOKS = {
  golden: {
    sky: ['#79a8e6', '#f7c9a6', '#ffe9c0'],
    glow: '#fff1c8',
    glowA: 0.55,
    ground: ['#79b874', '#b9cfae'],
    fog: '#f4ddc2',
    fogNear: 20,
    fogFar: 95,
    fogMax: 0.6,
    tint: '#ffb57a',
    tintA: 0.05,
    stars: 0,
    light: [-0.5, -0.6],
    shadowA: 0.22,
  },
  dusk: {
    sky: ['#5a6fb8', '#ee9fa3', '#ffd6a2'],
    glow: '#ffe2b0',
    glowA: 0.6,
    ground: ['#6a9c6b', '#a9b3a4'],
    fog: '#f0c6b4',
    fogNear: 18,
    fogFar: 85,
    fogMax: 0.62,
    tint: '#ff9a6a',
    tintA: 0.1,
    stars: 0.15,
    light: [-0.7, -0.4],
    shadowA: 0.22,
  },
  blueHour: {
    sky: ['#2b3a7c', '#7a6fb3', '#f1b2a4'],
    glow: '#ffc9b0',
    glowA: 0.45,
    ground: ['#4e7d60', '#8b93ab'],
    fog: '#bda8c8',
    fogNear: 16,
    fogFar: 80,
    fogMax: 0.62,
    tint: '#6a6fd8',
    tintA: 0.16,
    stars: 0.45,
    light: [-0.5, -0.5],
    shadowA: 0.2,
  },
  night: {
    sky: ['#0f1a40', '#273c7c', '#4f629d'],
    glow: '#8aa0dc',
    glowA: 0.3,
    ground: ['#2f4f5e', '#3c4d7a'],
    fog: '#3c4d7a',
    fogNear: 16,
    fogFar: 75,
    fogMax: 0.62,
    tint: '#4a5fd0',
    tintA: 0.26,
    stars: 1,
    light: [0.3, -0.7],
    shadowA: 0.18,
  },
  deepNight: {
    sky: ['#070d28', '#162452', '#2c3f7c'],
    glow: '#6b7fc4',
    glowA: 0.25,
    ground: ['#213848', '#2a3a68'],
    fog: '#2a3a68',
    fogNear: 15,
    fogFar: 72,
    fogMax: 0.64,
    tint: '#3c4fc0',
    tintA: 0.32,
    stars: 1,
    light: [0.2, -0.7],
    shadowA: 0.16,
  },
  predawn: {
    sky: ['#1f2d60', '#5d6cab', '#efb9c2'],
    glow: '#ffd3c4',
    glowA: 0.45,
    ground: ['#3f6c5c', '#8d93b4'],
    fog: '#b8abc9',
    fogNear: 16,
    fogFar: 80,
    fogMax: 0.62,
    tint: '#6f7fd0',
    tintA: 0.16,
    stars: 0.5,
    light: [0.6, -0.4],
    shadowA: 0.18,
  },
  dawn: {
    sky: ['#6e90d4', '#ffc4a8', '#fff0ca'],
    glow: '#fff0c0',
    glowA: 0.6,
    ground: ['#6fae73', '#b6c7b1'],
    fog: '#f6d8be',
    fogNear: 18,
    fogFar: 90,
    fogMax: 0.6,
    tint: '#ffb37a',
    tintA: 0.07,
    stars: 0,
    light: [0.7, -0.45],
    shadowA: 0.2,
  },
  morning: {
    sky: ['#7fb9eb', '#bfe1f7', '#fff6dd'],
    glow: '#ffffff',
    glowA: 0.35,
    ground: ['#7bbd79', '#bcd6b5'],
    fog: '#e3f0f7',
    fogNear: 22,
    fogFar: 100,
    fogMax: 0.55,
    tint: '#ffffff',
    tintA: 0,
    stars: 0,
    light: [0.5, -0.7],
    shadowA: 0.22,
  },
} satisfies Record<string, Look>;
export type LookName = keyof typeof LOOKS;

export function lookMix(a: Look, b: Look, t: number): Look {
  if (t <= 0) return a;
  if (t >= 1) return b;
  return {
    sky: [mix(a.sky[0], b.sky[0], t), mix(a.sky[1], b.sky[1], t), mix(a.sky[2], b.sky[2], t)],
    glow: mix(a.glow, b.glow, t),
    glowA: lerp(a.glowA, b.glowA, t),
    ground: [mix(a.ground[0], b.ground[0], t), mix(a.ground[1], b.ground[1], t)],
    fog: mix(a.fog, b.fog, t),
    fogNear: lerp(a.fogNear, b.fogNear, t),
    fogFar: lerp(a.fogFar, b.fogFar, t),
    fogMax: lerp(a.fogMax, b.fogMax, t),
    tint: mix(a.tint, b.tint, t),
    tintA: lerp(a.tintA, b.tintA, t),
    stars: lerp(a.stars, b.stars, t),
    light: [lerp(a.light[0], b.light[0], t), lerp(a.light[1], b.light[1], t)],
    shadowA: lerp(a.shadowA, b.shadowA, t),
  };
}

// ---------- 视图 ----------
export class View {
  cam: Cam = { pos: [0, 2, 10], look: [0, 1, 0], fov: 40 };
  f = 1;
  r: V3 = [1, 0, 0];
  u: V3 = [0, 1, 0];
  fw: V3 = [0, 0, -1];
  q: { z: number; fn: () => void }[] = [];
  look!: Look;
  constructor(
    public ctx: CanvasRenderingContext2D,
    public W: number,
    public H: number,
    public scratch: CanvasRenderingContext2D,
  ) {}
  setCam(c: Cam) {
    this.cam = c;
    const fov = ((c.fov ?? 40) * Math.PI) / 180;
    this.f = this.H / 2 / Math.tan(fov / 2);
    const fw = norm(sub(c.look, c.pos));
    let r = cross(fw, [0, 1, 0]);
    if (len(r) < 1e-4) r = [1, 0, 0];
    r = norm(r);
    const u = cross(r, fw);
    this.fw = fw;
    this.r = r;
    this.u = u;
  }
  project(p: V3): Proj | null {
    const d = sub(p, this.cam.pos);
    const z = dot(d, this.fw);
    if (z < 0.08) return null;
    const x = dot(d, this.r),
      y = dot(d, this.u);
    const s = this.f / z;
    return { x: this.W / 2 + x * s, y: this.H / 2 - y * s, s, z };
  }
  add(z: number, fn: () => void) {
    this.q.push({ z, fn });
  }
  flush() {
    this.q.sort((a, b) => b.z - a.z);
    for (const it of this.q) it.fn();
    this.q.length = 0;
  }
  fogT(z: number) {
    const L = this.look;
    return clamp01((z - L.fogNear) / (L.fogFar - L.fogNear)) * L.fogMax;
  }
  fogged(c: string, z: number) {
    return mix(c, this.look.fog, this.fogT(z));
  }
  horizonY(): number {
    const fwh: V3 = [this.fw[0], 0, this.fw[2]];
    if (len(fwh) < 1e-3) return this.H * 0.5;
    const far = add(this.cam.pos, mul(norm(fwh), 4000));
    far[1] = 0;
    const p = this.project(far);
    return p ? p.y : this.H * 0.5;
  }
}

// ---------- 天空 / 地面 ----------
export function sky(v: View, t: number, o: { stars?: number; moonless?: boolean } = {}) {
  const { ctx, W, H } = v;
  const L = v.look;
  const hy = clamp(v.horizonY(), -H, H * 1.2);
  const g = ctx.createLinearGradient(0, Math.min(0, hy - H * 0.9), 0, Math.max(hy, H * 0.3));
  g.addColorStop(0, L.sky[0]);
  g.addColorStop(0.62, L.sky[1]);
  g.addColorStop(1, L.sky[2]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // 地平线光晕
  const gg = ctx.createRadialGradient(W * 0.5, hy, 0, W * 0.5, hy, W * 0.75);
  gg.addColorStop(0, alpha(L.glow, L.glowA));
  gg.addColorStop(1, alpha(L.glow, 0));
  ctx.fillStyle = gg;
  ctx.fillRect(0, 0, W, H);
  const st = (o.stars ?? 1) * L.stars;
  if (st > 0.01) stars(v, t, st, hy);
}

export function stars(v: View, t: number, a: number, hy: number) {
  const { ctx, W } = v;
  const limit = Math.max(hy, 40);
  for (let i = 0; i < 150; i++) {
    const x = hash(i, 1) * W;
    const y = hash(i, 2) * limit * 0.96;
    const big = hash(i, 3);
    const tw = 0.55 + 0.45 * Math.sin(t * (1.2 + big * 2.2) + i * 1.7);
    const r = big > 0.9 ? 2.2 : big > 0.6 ? 1.5 : 1;
    ctx.globalAlpha = a * tw * (1 - (y / limit) * 0.5);
    ctx.fillStyle = '#fff9e8';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    if (big > 0.93) {
      ctx.globalAlpha = a * tw * 0.25;
      ctx.beginPath();
      ctx.arc(x, y, r * 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

export function ground(v: View, o: { near?: string; far?: string } = {}) {
  const { ctx, W, H } = v;
  const L = v.look;
  const hy = clamp(v.horizonY(), -H * 0.5, H * 1.5);
  const g = ctx.createLinearGradient(0, hy, 0, H);
  g.addColorStop(0, mix(o.far ?? L.ground[1], L.fog, L.fogMax * 0.75));
  g.addColorStop(0.14, mix(o.far ?? L.ground[1], L.fog, L.fogMax * 0.2));
  g.addColorStop(0.45, mix(o.near ?? L.ground[0], o.far ?? L.ground[1], 0.45));
  g.addColorStop(1, o.near ?? L.ground[0]);
  ctx.fillStyle = g;
  ctx.fillRect(0, hy, W, H - hy + 2);
}

// ---------- 通用几何 ----------
/** 地面椭圆（阴影、光斑、池塘）：按投影实际压扁 */
export function groundEllipse(v: View, p: V3, rx: number, rz: number): { x: number; y: number; rx: number; ry: number; z: number } | null {
  const c = v.project(p);
  if (!c) return null;
  const a = v.project([p[0] - rx, p[1], p[2]]);
  const b = v.project([p[0] + rx, p[1], p[2]]);
  const n = v.project([p[0], p[1], p[2] - rz]);
  const f = v.project([p[0], p[1], p[2] + rz]);
  if (!a || !b || !n || !f) return null;
  return { x: c.x, y: (n.y + f.y) / 2, rx: Math.abs(b.x - a.x) / 2, ry: Math.max(1.5, Math.abs(n.y - f.y) / 2), z: c.z };
}

export function shadow(v: View, p: V3, r: number, a?: number) {
  const e = groundEllipse(v, p, r, r);
  if (!e) return;
  const A = (a ?? v.look.shadowA) * (1 - v.fogT(e.z));
  v.add(e.z + 0.02, () => {
    const { ctx } = v;
    const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, Math.max(e.rx, 2));
    g.addColorStop(0, rgba(20, 30, 60, A));
    g.addColorStop(0.6, rgba(20, 30, 60, A * 0.55));
    g.addColorStop(1, rgba(20, 30, 60, 0));
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.scale(1, e.ry / Math.max(e.rx, 1));
    ctx.translate(-e.x, -e.y);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(e.x, e.y, Math.max(e.rx, 2), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

export function disc(v: View, p: V3, r: number, color: string, o: { alpha?: number; soft?: boolean; zBias?: number } = {}) {
  const e = groundEllipse(v, p, r, r);
  if (!e) return;
  const c = v.fogged(color, e.z);
  v.add(e.z + (o.zBias ?? 0.01), () => {
    const { ctx } = v;
    ctx.save();
    ctx.globalAlpha = o.alpha ?? 1;
    ctx.translate(e.x, e.y);
    ctx.scale(1, e.ry / Math.max(e.rx, 1));
    if (o.soft) {
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, e.rx);
      g.addColorStop(0, c);
      g.addColorStop(1, alpha(c, 0));
      ctx.fillStyle = g;
    } else ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(e.rx, 1), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

export interface SpriteOpts {
  flip?: boolean;
  alpha?: number;
  tint?: string;
  tintA?: number;
  noFog?: boolean;
  rot?: number;
  lift?: number;
  sil?: number;
  silColor?: string;
  scale?: number;
  zBias?: number;
  reflect?: number; // 水面倒影透明度
  reflectT?: number;
}

/** 像素纸片人 / 道具：p 为脚底中心，h 为世界高度 */
export function sprite(v: View, p: V3, name: string, h: number, o: SpriteOpts = {}) {
  const pr = v.project(p);
  if (!pr) return;
  const f = fr(name);
  const sc = o.scale ?? 1;
  const hp = h * pr.s * sc,
    wp = hp * (f.w / f.h);
  if (hp < 1.5 || pr.x < -wp || pr.x > v.W + wp) return;
  const L = v.look;
  const fogA = o.noFog ? 0 : v.fogT(pr.z);
  const tint = o.tint ?? L.tint;
  const tintA = o.tintA ?? L.tintA;
  const sil = o.sil ?? 0;
  v.add(pr.z + (o.zBias ?? 0), () => {
    const { ctx } = v;
    const img = atlasImage();
    const draw = (gy: number, flipY: boolean, a: number) => {
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(pr.x, gy);
      if (o.rot) ctx.rotate(o.rot);
      ctx.scale(o.flip ? -1 : 1, flipY ? -1 : 1);
      ctx.imageSmoothingEnabled = false;
      if (tintA > 0.01 || fogA > 0.01 || sil > 0.01) {
        const s = v.scratch;
        const cw = Math.ceil(wp) + 2,
          ch = Math.ceil(hp) + 2;
        const sc2 = s.canvas as HTMLCanvasElement;
        if (sc2.width < cw || sc2.height < ch) {
          sc2.width = Math.max(sc2.width, cw);
          sc2.height = Math.max(sc2.height, ch);
        }
        s.save();
        s.setTransform(1, 0, 0, 1, 0, 0);
        s.globalCompositeOperation = 'source-over';
        s.clearRect(0, 0, cw, ch);
        s.imageSmoothingEnabled = false;
        s.drawImage(img, f.x, f.y, f.w, f.h, 1, 1, wp, hp);
        s.globalCompositeOperation = 'source-atop';
        if (tintA > 0.01) {
          s.fillStyle = alpha(tint, tintA);
          s.fillRect(0, 0, cw, ch);
        }
        if (fogA > 0.01) {
          s.fillStyle = alpha(L.fog, fogA);
          s.fillRect(0, 0, cw, ch);
        }
        if (sil > 0.01) {
          s.fillStyle = alpha(o.silColor ?? '#1b2340', sil);
          s.fillRect(0, 0, cw, ch);
        }
        s.restore();
        ctx.drawImage(s.canvas, 0, 0, cw, ch, -wp / 2 - 1, -hp - 1, cw, ch);
      } else ctx.drawImage(img, f.x, f.y, f.w, f.h, -wp / 2, -hp, wp, hp);
      ctx.restore();
    };
    const lift = (o.lift ?? 0) * pr.s;
    if (o.reflect) {
      // 倒影：竖直翻转、压扁、带水纹
      ctx.save();
      ctx.translate(pr.x, pr.y);
      ctx.scale(1, -0.75);
      ctx.translate(-pr.x, -pr.y);
      const tt = o.reflectT ?? 0;
      ctx.translate(Math.sin(tt * 2.1) * 1.5, 0);
      draw(pr.y - lift, false, (o.alpha ?? 1) * o.reflect);
      ctx.restore();
    }
    draw(pr.y - lift, false, o.alpha ?? 1);
  });
}

/** 角色：自动算高度，顺手给个接触阴影 */
export function actor(v: View, id: CharId, p: V3, frame: string, o: SpriteOpts & { shadow?: boolean | number } = {}) {
  const h = heightOf(id, frame);
  const f = fr(frame);
  const w = h * (f.w / f.h);
  if (o.shadow !== false) shadow(v, [p[0], p[1], p[2]], (typeof o.shadow === 'number' ? o.shadow : 0.42) * w * (o.scale ?? 1) + 0.15, v.look.shadowA * (o.alpha ?? 1));
  sprite(v, p, frame, h, o);
}

/** 柔光球体 */
export function ball(v: View, p: V3, r: number, color: string, o: { glow?: number; glowA?: number; alpha?: number; flat?: number; noFog?: boolean; zBias?: number; light?: [number, number] } = {}) {
  const pr = v.project(p);
  if (!pr) return;
  const R = r * pr.s;
  if (R < 0.4) return;
  const L = v.look;
  const c = o.noFog ? color : v.fogged(color, pr.z);
  const flat = o.flat ?? 0;
  const lx = (o.light ?? L.light)[0],
    ly = (o.light ?? L.light)[1];
  v.add(pr.z + (o.zBias ?? 0), () => {
    const { ctx } = v;
    ctx.save();
    ctx.globalAlpha = o.alpha ?? 1;
    if (o.glow) {
      const gr = R * (1 + o.glow);
      const g = ctx.createRadialGradient(pr.x, pr.y, R * 0.6, pr.x, pr.y, gr);
      g.addColorStop(0, alpha(color, o.glowA ?? 0.5));
      g.addColorStop(1, alpha(color, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(pr.x, pr.y, gr, 0, Math.PI * 2);
      ctx.fill();
    }
    const g = ctx.createRadialGradient(pr.x + lx * R * 0.38, pr.y + ly * R * 0.38, R * 0.05, pr.x, pr.y, R);
    g.addColorStop(0, lighten(c, 0.42 * (1 - flat)));
    g.addColorStop(0.55, c);
    g.addColorStop(1, darken(c, 0.22 * (1 - flat)));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(pr.x, pr.y, R, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

/** 纯光晕（萤火、星光、灯光） */
export function glow(v: View, p: V3, r: number, color: string, a = 0.6, o: { zBias?: number; core?: number } = {}) {
  const pr = v.project(p);
  if (!pr) return;
  const R = r * pr.s;
  if (R < 0.5) return;
  v.add(pr.z + (o.zBias ?? -0.001), () => {
    const { ctx } = v;
    const g = ctx.createRadialGradient(pr.x, pr.y, 0, pr.x, pr.y, R);
    g.addColorStop(0, alpha(color, a));
    g.addColorStop(0.35, alpha(color, a * 0.45));
    g.addColorStop(1, alpha(color, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(pr.x, pr.y, R, 0, Math.PI * 2);
    ctx.fill();
    if (o.core) {
      ctx.fillStyle = alpha('#ffffff', Math.min(1, a * 1.3));
      ctx.beginPath();
      ctx.arc(pr.x, pr.y, R * o.core, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

/** 远山 / 土坡：上半椭圆 */
export function hill(v: View, p: V3, rx: number, ry: number, color: string, o: { zBias?: number } = {}) {
  const pr = v.project(p);
  if (!pr) return;
  const RX = rx * pr.s,
    RY = ry * pr.s;
  if (RX < 1) return;
  const c = v.fogged(color, pr.z);
  v.add(pr.z + (o.zBias ?? 0), () => {
    const { ctx } = v;
    const g = ctx.createLinearGradient(0, pr.y - RY, 0, pr.y);
    g.addColorStop(0, lighten(c, 0.22));
    g.addColorStop(0.7, c);
    g.addColorStop(1, darken(c, 0.08));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(pr.x, pr.y + 1, RX, RY, 0, Math.PI, Math.PI * 2);
    ctx.fill();
  });
}

/** 云：一团柔球 */
export function cloud(v: View, p: V3, size: number, color: string, o: { alpha?: number; scale?: number; glowColor?: string } = {}) {
  const pr = v.project(p);
  if (!pr) return;
  const sc = (o.scale ?? 1) * size;
  const parts: [number, number, number][] = [
    [0, 0.3, 0.55],
    [-0.62, 0.12, 0.42],
    [0.6, 0.14, 0.46],
    [-0.28, 0.5, 0.4],
    [0.3, 0.52, 0.37],
    [1.0, 0.0, 0.3],
    [-1.0, -0.02, 0.3],
  ];
  const c = v.fogged(color, pr.z);
  const S = pr.s;
  v.add(pr.z, () => {
    const { ctx } = v;
    ctx.save();
    ctx.globalAlpha = o.alpha ?? 1;
    if (o.glowColor) {
      const g = ctx.createRadialGradient(pr.x, pr.y - 0.2 * sc * S, 0, pr.x, pr.y - 0.2 * sc * S, 1.6 * sc * S);
      g.addColorStop(0, alpha(o.glowColor, 0.35));
      g.addColorStop(1, alpha(o.glowColor, 0));
      ctx.fillStyle = g;
      ctx.fillRect(pr.x - 2 * sc * S, pr.y - 2 * sc * S, 4 * sc * S, 4 * sc * S);
    }
    // 底座
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.ellipse(pr.x, pr.y, 1.25 * sc * S, 0.32 * sc * S, 0, 0, Math.PI * 2);
    ctx.fill();
    const lx = v.look.light[0],
      ly = v.look.light[1];
    for (const [ox, oy, r] of parts) {
      const cx = pr.x + ox * sc * S,
        cy = pr.y - oy * sc * S,
        R = r * sc * S;
      const g = ctx.createRadialGradient(cx + lx * R * 0.4, cy + ly * R * 0.4, R * 0.1, cx, cy, R);
      g.addColorStop(0, lighten(c, 0.3));
      g.addColorStop(0.7, c);
      g.addColorStop(1, darken(c, 0.1));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  });
}

/** 树：锥形树干 + 三团叶球 */
export function tree(v: View, p: V3, size: number, o: { leaf?: string; trunk?: string; sway?: number; bloom?: string } = {}) {
  const pr = v.project(p);
  if (!pr) return;
  const leaf = v.fogged(o.leaf ?? '#79b36f', pr.z);
  const trunk = v.fogged(o.trunk ?? '#8a6a52', pr.z);
  const S = pr.s * size;
  const sw = o.sway ?? 0;
  v.add(pr.z, () => {
    const { ctx } = v;
    ctx.save();
    // 干
    ctx.fillStyle = trunk;
    ctx.beginPath();
    ctx.moveTo(pr.x - 0.13 * S, pr.y);
    ctx.lineTo(pr.x + 0.13 * S, pr.y);
    ctx.lineTo(pr.x + 0.07 * S + sw * 0.1 * S, pr.y - 1.1 * S);
    ctx.lineTo(pr.x - 0.07 * S + sw * 0.1 * S, pr.y - 1.1 * S);
    ctx.closePath();
    ctx.fill();
    const lx = v.look.light[0],
      ly = v.look.light[1];
    const balls: [number, number, number][] = [
      [-0.45, 1.15, 0.5],
      [0.45, 1.2, 0.52],
      [0, 1.7, 0.6],
      [0.0, 1.05, 0.55],
    ];
    for (const [ox, oy, r] of balls) {
      const cx = pr.x + (ox + sw * 0.15 * oy) * S,
        cy = pr.y - oy * S,
        R = r * S;
      const g = ctx.createRadialGradient(cx + lx * R * 0.4, cy + ly * R * 0.4, R * 0.1, cx, cy, R);
      g.addColorStop(0, lighten(leaf, 0.35));
      g.addColorStop(0.65, leaf);
      g.addColorStop(1, darken(leaf, 0.2));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();
    }
    if (o.bloom) {
      ctx.fillStyle = o.bloom;
      for (let i = 0; i < 14; i++) {
        const a = hash(i, 7) * Math.PI * 2,
          rr = 0.2 + hash(i, 8) * 0.55;
        ctx.beginPath();
        ctx.arc(pr.x + Math.cos(a) * rr * S * 1.1, pr.y - (1.35 + Math.sin(a) * rr * 0.9) * S, 0.045 * S, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  });
}

/** 小花：茎 + 五瓣 + 花心，bloom 0..1 */
export function flower(v: View, p: V3, size: number, color: string, bloom: number, o: { glow?: boolean; center?: string; sway?: number } = {}) {
  if (bloom <= 0.01) return;
  const pr = v.project(p);
  if (!pr) return;
  const S = pr.s * size * 0.58;
  if (S < 1.2) return;
  const b = backOut(bloom);
  const c = v.fogged(color, pr.z);
  const stem = v.fogged('#5f9a5a', pr.z);
  const sw = o.sway ?? 0;
  v.add(pr.z, () => {
    const { ctx } = v;
    ctx.save();
    ctx.strokeStyle = stem;
    ctx.lineWidth = Math.max(1, 0.08 * S);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(pr.x, pr.y);
    ctx.quadraticCurveTo(pr.x + sw * 0.3 * S, pr.y - 0.5 * S, pr.x + sw * 0.5 * S, pr.y - 0.95 * S * Math.min(1, bloom * 1.5));
    ctx.stroke();
    const hx = pr.x + sw * 0.5 * S,
      hy = pr.y - 0.95 * S * Math.min(1, bloom * 1.5);
    if (o.glow) {
      const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, 0.9 * S * b);
      g.addColorStop(0, alpha(color, 0.45));
      g.addColorStop(1, alpha(color, 0));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(hx, hy, 0.9 * S * b, 0, Math.PI * 2);
      ctx.fill();
    }
    const pr2 = 0.24 * S * b;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const px = hx + Math.cos(a) * 0.26 * S * b,
        py = hy + Math.sin(a) * 0.26 * S * b;
      const g = ctx.createRadialGradient(px - pr2 * 0.3, py - pr2 * 0.3, 0, px, py, pr2);
      g.addColorStop(0, lighten(c, 0.45));
      g.addColorStop(1, c);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(px, py, pr2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = o.center ?? '#ffe28a';
    ctx.beginPath();
    ctx.arc(hx, hy, 0.15 * S * b, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

/** 柔软方块（书、箱、积木）：三面着色 */
export function cube(v: View, p: V3, w: number, h: number, d: number, color: string, o: { alpha?: number; rot?: number; round?: number; zBias?: number } = {}) {
  const [x, y, z] = p;
  const hw = w / 2,
    hd = d / 2;
  const rot = o.rot ?? 0;
  const cs = Math.cos(rot),
    sn = Math.sin(rot);
  const R = (dx: number, dz: number): [number, number] => [x + dx * cs - dz * sn, z + dx * sn + dz * cs];
  const cnr = (dx: number, dy: number, dz: number): V3 => {
    const [px, pz] = R(dx, dz);
    return [px, y + dy, pz];
  };
  const faces: { pts: V3[]; shade: number; n: V3 }[] = [
    { pts: [cnr(-hw, h, -hd), cnr(hw, h, -hd), cnr(hw, h, hd), cnr(-hw, h, hd)], shade: 0.28, n: [0, 1, 0] },
    { pts: [cnr(-hw, 0, hd), cnr(hw, 0, hd), cnr(hw, h, hd), cnr(-hw, h, hd)], shade: 0, n: [sn, 0, cs] },
    { pts: [cnr(-hw, 0, -hd), cnr(hw, 0, -hd), cnr(hw, h, -hd), cnr(-hw, h, -hd)], shade: 0, n: [-sn, 0, -cs] },
    { pts: [cnr(hw, 0, -hd), cnr(hw, 0, hd), cnr(hw, h, hd), cnr(hw, h, -hd)], shade: -0.16, n: [cs, 0, sn] },
    { pts: [cnr(-hw, 0, -hd), cnr(-hw, 0, hd), cnr(-hw, h, hd), cnr(-hw, h, -hd)], shade: -0.16, n: [-cs, 0, -sn] },
  ];
  const center: V3 = [x, y + h / 2, z];
  const pc = v.project(center);
  if (!pc) return;
  const base = v.fogged(color, pc.z);
  const vis = faces
    .map((f) => {
      const fc: V3 = [
        (f.pts[0][0] + f.pts[2][0]) / 2,
        (f.pts[0][1] + f.pts[2][1]) / 2,
        (f.pts[0][2] + f.pts[2][2]) / 2,
      ];
      const toCam = sub(v.cam.pos, fc);
      return { f, facing: dot(toCam, f.n), pts: f.pts.map((q) => v.project(q)) };
    })
    .filter((e) => e.facing > 0 && e.pts.every((q) => q));
  v.add(pc.z + (o.zBias ?? 0), () => {
    const { ctx } = v;
    ctx.save();
    ctx.globalAlpha = o.alpha ?? 1;
    ctx.lineJoin = 'round';
    for (const e of vis) {
      const col = e.f.shade >= 0 ? lighten(base, e.f.shade) : darken(base, -e.f.shade);
      ctx.fillStyle = col;
      ctx.strokeStyle = col;
      ctx.lineWidth = Math.max(0.5, (o.round ?? 0.05) * pc.s * Math.min(w, h));
      ctx.beginPath();
      e.pts.forEach((q, i) => (i ? ctx.lineTo(q!.x, q!.y) : ctx.moveTo(q!.x, q!.y)));
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  });
}

/** 任意多边形（路、桌面、水面） */
export function poly(v: View, pts: V3[], color: string, o: { alpha?: number; zBias?: number; grad?: [string, string]; noFog?: boolean } = {}) {
  const ps = pts.map((p) => v.project(p));
  if (ps.some((p) => !p)) return;
  const z = ps.reduce((a, p) => a + p!.z, 0) / ps.length;
  const c = o.noFog ? color : v.fogged(color, z);
  v.add(z + (o.zBias ?? 0), () => {
    const { ctx } = v;
    ctx.save();
    ctx.globalAlpha = o.alpha ?? 1;
    if (o.grad) {
      const ys = ps.map((p) => p!.y);
      const g = ctx.createLinearGradient(0, Math.min(...ys), 0, Math.max(...ys));
      g.addColorStop(0, o.grad[0]);
      g.addColorStop(1, o.grad[1]);
      ctx.fillStyle = g;
    } else ctx.fillStyle = c;
    ctx.beginPath();
    ps.forEach((p, i) => (i ? ctx.lineTo(p!.x, p!.y) : ctx.moveTo(p!.x, p!.y)));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  });
}

/** 带状曲线（风、绳、路径光） */
export function ribbon(v: View, pts: V3[], color: string, width: number, o: { alpha?: number; zBias?: number; taper?: boolean; noFog?: boolean } = {}) {
  const ps = pts.map((p) => v.project(p)).filter((p): p is Proj => !!p);
  if (ps.length < 2) return;
  const z = ps.reduce((a, p) => a + p.z, 0) / ps.length;
  const c = o.noFog ? color : v.fogged(color, z);
  v.add(z + (o.zBias ?? 0), () => {
    const { ctx } = v;
    ctx.save();
    ctx.globalAlpha = o.alpha ?? 1;
    ctx.strokeStyle = c;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // 逐段取宽：近处粗、远处细，透视才对
    for (let i = 1; i < ps.length; i++) {
      const sAvg = (ps[i - 1].s + ps[i].s) / 2;
      const tap = o.taper ? 1 - i / ps.length : 1;
      ctx.lineWidth = Math.max(0.6, Math.min(width * sAvg * tap, v.H * 0.3));
      ctx.beginPath();
      ctx.moveTo(ps[i - 1].x, ps[i - 1].y);
      ctx.lineTo(ps[i].x, ps[i].y);
      ctx.stroke();
    }
    ctx.restore();
  });
}

/** 地面上的小路：沿中心线向两侧铺开，一段一段画（雾与宽度都随深度变） */
export function groundPath(v: View, pts: V3[], width: number, color: string, o: { alpha?: number; zBias?: number } = {}) {
  if (pts.length < 2) return;
  const L: V3[] = [],
    R: V3[] = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)],
      b = pts[Math.min(pts.length - 1, i + 1)];
    let dx = b[0] - a[0],
      dz = b[2] - a[2];
    const l = Math.hypot(dx, dz) || 1;
    dx /= l;
    dz /= l;
    const nx = -dz,
      nz = dx;
    L.push([pts[i][0] + nx * width * 0.5, pts[i][1], pts[i][2] + nz * width * 0.5]);
    R.push([pts[i][0] - nx * width * 0.5, pts[i][1], pts[i][2] - nz * width * 0.5]);
  }
  for (let i = 0; i < pts.length - 1; i++) {
    // 每段再细分，让远近渐变更顺
    const n = 3;
    for (let k = 0; k < n; k++) {
      const t0 = k / n,
        t1 = (k + 1) / n;
      poly(v, [lerp3(L[i], L[i + 1], t0), lerp3(R[i], R[i + 1], t0), lerp3(R[i], R[i + 1], t1), lerp3(L[i], L[i + 1], t1)], color, { alpha: o.alpha, zBias: o.zBias ?? 0.03 });
    }
  }
}

/** 小房子：墙 + 屋顶 + 暖窗 */
export function house(v: View, p: V3, size: number, o: { wall?: string; roof?: string; windowGlow?: number; door?: number } = {}) {
  const [x, y, z] = p;
  const s = size;
  cube(v, [x, y, z], 2.4 * s, 1.7 * s, 2 * s, o.wall ?? '#f3e4cf');
  // 屋顶（三棱）
  const roofC = v.fogged(o.roof ?? '#d98c7e', v.project(p)?.z ?? 20);
  const a: V3 = [x - 1.35 * s, y + 1.7 * s, z + 1.15 * s],
    b: V3 = [x + 1.35 * s, y + 1.7 * s, z + 1.15 * s],
    c: V3 = [x, y + 2.75 * s, z + 1.15 * s];
  const a2: V3 = [x - 1.35 * s, y + 1.7 * s, z - 1.15 * s],
    b2: V3 = [x + 1.35 * s, y + 1.7 * s, z - 1.15 * s],
    c2: V3 = [x, y + 2.75 * s, z - 1.15 * s];
  poly(v, [a, b, c], darken(roofC, 0.05), { zBias: -0.02 });
  poly(v, [a, c, c2, a2], lighten(roofC, 0.12), { zBias: -0.01 });
  poly(v, [b, c, c2, b2], darken(roofC, 0.1), { zBias: -0.01 });
  // 窗
  const wg = o.windowGlow ?? 0.8;
  const win: V3[] = [
    [x - 0.5 * s, y + 0.75 * s, z + 1.01 * s],
    [x - 0.1 * s, y + 0.75 * s, z + 1.01 * s],
    [x - 0.1 * s, y + 1.2 * s, z + 1.01 * s],
    [x - 0.5 * s, y + 1.2 * s, z + 1.01 * s],
  ];
  poly(v, win, mix('#6a7a9a', '#ffd98a', wg), { zBias: -0.03, noFog: true });
  if (wg > 0.3) glow(v, [x - 0.3 * s, y + 0.97 * s, z + 1.05 * s], 0.9 * s, '#ffd27a', 0.35 * wg, { zBias: -0.04 });
  // 门
  const dw = 0.5 * s;
  const door: V3[] = [
    [x + 0.3 * s, y, z + 1.01 * s],
    [x + 0.3 * s + dw, y, z + 1.01 * s],
    [x + 0.3 * s + dw, y + 0.95 * s, z + 1.01 * s],
    [x + 0.3 * s, y + 0.95 * s, z + 1.01 * s],
  ];
  const openA = o.door ?? 0;
  poly(v, door, mix('#9a6f52', '#ffe2a0', openA), { zBias: -0.03, noFog: true });
  if (openA > 0.05) {
    // 门口光束
    const beam: V3[] = [
      [x + 0.3 * s, y + 0.01, z + 1.02 * s],
      [x + 0.3 * s + dw, y + 0.01, z + 1.02 * s],
      [x + 0.3 * s + dw + 1.1 * s, y + 0.01, z + 3.6 * s],
      [x + 0.3 * s - 1.1 * s, y + 0.01, z + 3.6 * s],
    ];
    poly(v, beam, '#ffe6a8', { alpha: 0.35 * openA, zBias: 0.05, noFog: true });
  }
}

/** 灯笼 / 路灯：杆 + 光球 */
export function lantern(v: View, p: V3, h: number, color = '#ffcf7a', a = 0.9, o: { post?: boolean; pulse?: number } = {}) {
  const [x, y, z] = p;
  if (o.post !== false) ribbon(v, [[x, y, z], [x, y + h, z]], '#6d5a4f', 0.07);
  const pulse = o.pulse ?? 0;
  glow(v, [x, y + h, z], 0.9 + pulse * 0.25, color, 0.55 * a, { zBias: -0.02 });
  ball(v, [x, y + h, z], 0.16, lighten(color, 0.3), { noFog: true, flat: 0.5, zBias: -0.03 });
}

export function sprite2d(ctx: CanvasRenderingContext2D, name: string, x: number, y: number, h: number, o: { flip?: boolean; alpha?: number } = {}) {
  const f = fr(name);
  const w = h * (f.w / f.h);
  ctx.save();
  ctx.globalAlpha = o.alpha ?? 1;
  ctx.imageSmoothingEnabled = false;
  ctx.translate(x, y);
  if (o.flip) ctx.scale(-1, 1);
  ctx.drawImage(atlasImage(), f.x, f.y, f.w, f.h, -w / 2, -h, w, h);
  ctx.restore();
}
