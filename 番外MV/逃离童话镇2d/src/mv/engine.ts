import * as THREE from 'three';
import atlasUrl from '../assets/atlas.png';
import atlasJson from './atlas.json';

/* ───────────── 节拍（实测：117.5 BPM，乐句强拍 k≡7 mod 8） ───────────── */
export const BEAT = 0.51064;
export const T0 = 0.495;
export const bt = (k: number) => T0 + k * BEAT;
export const beatPulse = (t: number, sharp = 5) => {
  const x = ((t - T0) / BEAT) % 1;
  return Math.exp(-(x < 0 ? x + 1 : x) * sharp);
};

/* ───────────── 数学 ───────────── */
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const eo = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
export const ei = (x: number) => Math.pow(clamp(x), 3);
export const eio = (x: number) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
export const back = (x: number) => { x = clamp(x); const c = 2.2; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
export const elastic = (x: number) => { x = clamp(x); return x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -9 * x) * Math.sin((x * 8 - 0.75) * 2.1) + 1; };
/** 从 at 时刻起 1→0 衰减的冲击量 */
export const hit = (t: number, at: number, dur = 0.35) => (t < at ? 0 : Math.max(0, 1 - (t - at) / dur));
/** 进场：at 时刻起 0→1（回弹） */
export const pop = (t: number, at: number, dur = 0.28) => back(seg(t, at, at + dur));
export const on = (t: number, a: number, b = 1e9) => (t >= a && t < b ? 1 : 0);
export const rnd = (i: number) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
export const TAU = Math.PI * 2;

/* ───────────── 调色板（木偶剧场 / 品红大字 / 红黑剪影 / 童话书） ───────────── */
export const C = {
  mag: 0xf0128a, magD: 0xa80c63, magDD: 0x5e0838, pinkL: 0xff7cc4,
  gold: 0xb58a1e, goldD: 0x6b4d0e, goldL: 0xe9c24a, wood: 0x4a3410, woodD: 0x2a1d08,
  red: 0xb30a14, redD: 0x5c0308, redDD: 0x2a0104, blood: 0xe01b24, rose: 0xff3355,
  ink: 0x0a0607, paper: 0xf6ecd6, paperD: 0xd9c8a2, white: 0xffffff,
  grass: 0x66c24f, grassD: 0x2f7d3b, pine: 0x1f6b45, pineD: 0x124a33, trunk: 0x7a4a26,
  sky: 0x8fd3ff, sea: 0x1e6fd0, seaD: 0x0b2f7a, seaL: 0x6fd6ff, sun: 0xffc85a,
  purple: 0x4b1f7a, purpleD: 0x1e0b3a, silver: 0xcfd6e6,
};

/* ───────────── 材质与几何 ───────────── */
const lamCache = new Map<number, THREE.MeshLambertMaterial>();
export const lam = (c: number) => {
  let m = lamCache.get(c);
  if (!m) { m = new THREE.MeshLambertMaterial({ color: c, flatShading: true }); lamCache.set(c, m); }
  return m;
};
export const flat = (c: number, o: Partial<THREE.MeshBasicMaterialParameters> = {}) =>
  new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide, ...o });

type V3 = [number, number, number];
export function at<T extends THREE.Object3D>(o: T, p: V3, parent?: THREE.Object3D): T {
  o.position.set(p[0], p[1], p[2]);
  if (parent) parent.add(o);
  return o;
}
export const box = (w: number, h: number, d: number, c: number, basic = false) =>
  new THREE.Mesh(new THREE.BoxGeometry(w, h, d), basic ? flat(c) : lam(c));
export const cyl = (rt: number, rb: number, h: number, c: number, s = 8, basic = false) =>
  new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, s), basic ? flat(c) : lam(c));
export const cone = (r: number, h: number, c: number, s = 6, basic = false) =>
  new THREE.Mesh(new THREE.ConeGeometry(r, h, s), basic ? flat(c) : lam(c));
export const ball = (r: number, c: number, basic = false, det = 1) =>
  new THREE.Mesh(new THREE.IcosahedronGeometry(r, det), basic ? flat(c) : lam(c));
export const quad = (w: number, h: number, c: number, o: Partial<THREE.MeshBasicMaterialParameters> = {}) =>
  new THREE.Mesh(new THREE.PlaneGeometry(w, h), flat(c, o));
export const disc = (r: number, c: number, o: Partial<THREE.MeshBasicMaterialParameters> = {}, s = 40) =>
  new THREE.Mesh(new THREE.CircleGeometry(r, s), flat(c, o));
export const ringM = (r0: number, r1: number, c: number, o: Partial<THREE.MeshBasicMaterialParameters> = {}, s = 64) =>
  new THREE.Mesh(new THREE.RingGeometry(r0, r1, s), flat(c, o));
/** 纸片剪影：由二维点列生成 */
export function paper(pts: number[][], c: number, o: Partial<THREE.MeshBasicMaterialParameters> = {}, holes: number[][][] = []) {
  const sh = new THREE.Shape(pts.map(p => new THREE.Vector2(p[0], p[1])));
  holes.forEach(h => sh.holes.push(new THREE.Path(h.map(p => new THREE.Vector2(p[0], p[1])))));
  return new THREE.Mesh(new THREE.ShapeGeometry(sh), flat(c, o));
}
export function shapeMesh(sh: THREE.Shape, c: number, o: Partial<THREE.MeshBasicMaterialParameters> = {}) {
  return new THREE.Mesh(new THREE.ShapeGeometry(sh, 24), flat(c, o));
}
export const grp = (...ch: THREE.Object3D[]) => { const g = new THREE.Group(); ch.forEach(c => g.add(c)); return g; };
export function lights(s: THREE.Scene, amb = 0.75, dir = 1.2, col = 0xffffff, sky = 0xffffff, gnd = 0x8866aa) {
  s.add(new THREE.HemisphereLight(sky, gnd, amb * 2));
  const d = new THREE.DirectionalLight(col, dir * 1.6);
  d.position.set(4, 9, 6);
  s.add(d);
}
export function setOpacity(o: THREE.Object3D, a: number) {
  o.traverse(x => {
    const m = (x as THREE.Mesh).material as THREE.Material | undefined;
    if (m && !(m as any).isShared) { m.transparent = true; m.opacity = a; }
  });
  o.visible = a > 0.003;
}

/* ───────────── 程序化背景贴图 ───────────── */
function cvs(w: number, h: number) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  return [c, c.getContext('2d')!] as const;
}
function texOf(c: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}
const hex = (c: number) => '#' + c.toString(16).padStart(6, '0');
const texCache = new Map<string, THREE.Texture>();
function cached(key: string, make: () => THREE.Texture) {
  let t = texCache.get(key); if (!t) { t = make(); texCache.set(key, t); } return t;
}
/** 径向渐变幕布 */
export const radialTex = (inner: number, outer: number, cx = 0.5, cy = 0.5, r = 0.75) =>
  cached(`rad${inner}_${outer}_${cx}_${cy}_${r}`, () => {
    const [c, g] = cvs(512, 288);
    const gr = g.createRadialGradient(512 * cx, 288 * cy, 0, 512 * cx, 288 * cy, 512 * r);
    gr.addColorStop(0, hex(inner)); gr.addColorStop(1, hex(outer));
    g.fillStyle = gr; g.fillRect(0, 0, 512, 288);
    return texOf(c);
  });
export const vertTex = (top: number, bottom: number, mid?: number) =>
  cached(`ver${top}_${bottom}_${mid}`, () => {
    const [c, g] = cvs(16, 256);
    const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, hex(top)); if (mid !== undefined) gr.addColorStop(0.55, hex(mid)); gr.addColorStop(1, hex(bottom));
    g.fillStyle = gr; g.fillRect(0, 0, 16, 256);
    return texOf(c);
  });
/** 红黑剪影风的斑驳深红底（带暗角与玫瑰暗纹） */
export const grungeTex = (base = C.red, dark = C.redDD, seed = 1) =>
  cached(`gr${base}_${dark}_${seed}`, () => {
    const [c, g] = cvs(1024, 576);
    const gr = g.createRadialGradient(512, 270, 40, 512, 288, 640);
    gr.addColorStop(0, hex(base)); gr.addColorStop(0.65, hex(base)); gr.addColorStop(1, hex(dark));
    g.fillStyle = gr; g.fillRect(0, 0, 1024, 576);
    for (let i = 0; i < 260; i++) {
      const x = rnd(i * 3 + seed) * 1024, y = rnd(i * 7 + seed) * 576, r = 8 + rnd(i * 11 + seed) * 70;
      g.fillStyle = rnd(i * 5 + seed) > 0.5 ? 'rgba(0,0,0,0.05)' : 'rgba(255,60,60,0.035)';
      g.beginPath(); g.ellipse(x, y, r, r * (0.4 + rnd(i) * 0.8), rnd(i * 13) * 3, 0, TAU); g.fill();
    }
    // 四角玫瑰暗纹
    const rose = (x: number, y: number, R: number) => {
      g.strokeStyle = 'rgba(0,0,0,0.33)'; g.lineWidth = R * 0.11; g.fillStyle = 'rgba(20,0,0,0.28)';
      g.beginPath(); g.arc(x, y, R, 0, TAU); g.fill();
      g.beginPath();
      for (let a = 0; a < 5.5 * Math.PI; a += 0.15) { const rr = R * 0.08 + (a / (5.5 * Math.PI)) * R * 0.9; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
      g.stroke();
    };
    [[40, 40, 90], [150, 10, 50], [990, 30, 80], [30, 540, 80], [960, 560, 110], [1010, 430, 50], [20, 300, 40]].forEach(p => rose(p[0], p[1], p[2]));
    return texOf(c);
  });
export function backdrop(tex: THREE.Texture, w = 64, h = 36, z = -14) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, depthWrite: false, fog: false }));
  m.position.set(0, h * 0.28, z); m.renderOrder = -10;
  return m;
}

/* ───────────── 文字（画布贴图 → 三维纸片字） ───────────── */
export const FONT = {
  brush: '"MV Brush","Ma Shan Zheng","KaiTi","STKaiti",serif',
  cute: '"MV Cute","ZCOOL KuaiLe","PingFang SC","Microsoft YaHei",sans-serif',
  hei: '"MV Hei","ZCOOL QingKe HuangYou","PingFang SC","Microsoft YaHei",sans-serif',
  serif: '"MV Serif","Noto Serif SC","Songti SC","SimSun",serif',
};
export interface TxtOpt { font?: string; color?: string; stroke?: string; sw?: number; vertical?: boolean; px?: number; sp?: number; weight?: string; rough?: boolean; }
/** 生成文字纸片；h = 单字的世界高度 */
export function txt(s: string, h: number, o: TxtOpt = {}) {
  const px = o.px ?? 150, font = `${o.weight ?? '400'} ${px}px ${o.font ?? FONT.brush}`;
  const [m0, g0] = cvs(4, 4); void m0; g0.font = font;
  const chars = [...s];
  const sp = (o.sp ?? 0) * px, pad = px * 0.28 + (o.sw ?? 0) * px;
  const ws = chars.map(c => g0.measureText(c).width);
  let W: number, H: number;
  if (o.vertical) { W = px + pad * 2; H = chars.length * px * 1.02 + sp * (chars.length - 1) + pad * 2; }
  else { W = ws.reduce((a, b) => a + b, 0) + sp * (chars.length - 1) + pad * 2; H = px * 1.2 + pad * 2; }
  const [c, g] = cvs(Math.ceil(W), Math.ceil(H));
  g.font = font; g.textBaseline = 'middle'; g.textAlign = 'center'; g.lineJoin = 'round';
  let x = pad, y = pad;
  chars.forEach((ch, i) => {
    const cx = o.vertical ? W / 2 : x + ws[i] / 2, cy = o.vertical ? y + px * 0.51 : H / 2;
    if (o.stroke) { g.strokeStyle = o.stroke; g.lineWidth = (o.sw ?? 0.08) * px * 2; g.strokeText(ch, cx, cy); }
    g.fillStyle = o.color ?? '#fff'; g.fillText(ch, cx, cy);
    if (o.vertical) y += px * 1.02 + sp; else x += ws[i] + sp;
  });
  if (o.rough) { // 干笔飞白
    g.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < W * H / 900; i++) {
      g.fillStyle = `rgba(0,0,0,${0.25 + rnd(i) * 0.5})`;
      const rx = rnd(i * 3.1) * W, ry = rnd(i * 5.3) * H;
      g.fillRect(rx, ry, 2 + rnd(i * 7.7) * px * 0.16, 1 + rnd(i * 9.1) * 2.5);
    }
  }
  const tex = texOf(c);
  const k = h / px;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(W * k, H * k),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  mesh.renderOrder = 20;
  mesh.userData.w = W * k; mesh.userData.h = H * k;
  return mesh;
}
/** 让一个物体在 at 时刻"砸"进来 */
export function slam(o: THREE.Object3D, t: number, a: number, s = 1, dur = 0.22, from = 2.4) {
  if (t < a) { o.visible = false; return 0; }
  o.visible = true;
  const p = seg(t, a, a + dur);
  const k = lerp(from, 1, eo(p)) * (1 + 0.06 * Math.sin(p * Math.PI));
  o.scale.setScalar(s * k);
  const m = (o as THREE.Mesh).material as THREE.Material | undefined;
  if (m) { m.transparent = true; m.opacity = clamp(p * 4); }
  return 1 - p;
}
export function show(o: THREE.Object3D, t: number, a: number, b = 1e9) { o.visible = t >= a && t < b; return o.visible; }

/* ───────────── 角色（像素纸片人） ───────────── */
const F = (atlasJson as any).f as Record<string, number[]>;
const AW = (atlasJson as any).w as number, AH = (atlasJson as any).h as number;
const seqCache = new Map<string, number[][]>();
function seqOf(prefix: string): number[][] {
  let s = seqCache.get(prefix);
  if (!s) {
    s = [];
    if (F[prefix]) s.push(F[prefix]);
    for (let i = 0; F[`${prefix}_${i}`]; i++) s.push(F[`${prefix}_${i}`]);
    if (!s.length) throw new Error('缺少角色帧: ' + prefix);
    seqCache.set(prefix, s);
  }
  return s;
}
let atlasTex: THREE.Texture | null = null;
export function loadAtlas(): Promise<void> {
  return new Promise((res, rej) => {
    new THREE.TextureLoader().load(atlasUrl, t => {
      t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false;
      t.colorSpace = THREE.SRGBColorSpace; atlasTex = t; res();
    }, undefined, rej);
  });
}
export type Who = 'whale' | 'gpt' | 'claude' | 'doubao' | 'kimi' | 'qwen' | 'gemini' | 'zai';
export class Actor extends THREE.Group {
  mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; who: Who; hgt: number; private cur = '';
  constructor(who: Who, h = 2) {
    super();
    this.who = who; this.hgt = h;
    const g = new THREE.PlaneGeometry(1, 1); g.translate(0, 0.5, 0);
    this.mat = new THREE.MeshBasicMaterial({ map: atlasTex!, alphaTest: 0.5, side: THREE.DoubleSide, fog: false });
    this.mesh = new THREE.Mesh(g, this.mat);
    this.add(this.mesh);
    this.raw(F[`act_${who}_idle_0`] ? `act_${who}_idle` : `act_${who}_hover`, 0);
  }
  /** 直接用帧名前缀（walk_whale / gpt_fly / whale_big_idle …） */
  raw(prefix: string, t = 0, fps = 8, loop = true) {
    const s = seqOf(prefix);
    let i = Math.floor(Math.max(0, t) * fps);
    i = loop ? i % s.length : Math.min(i, s.length - 1);
    const key = prefix + i;
    if (key !== this.cur) {
      this.cur = key;
      const [x, y, w, h] = s[i];
      const uv = this.mesh.geometry.attributes.uv as THREE.BufferAttribute;
      const u0 = x / AW, u1 = (x + w) / AW, v1 = 1 - y / AH, v0 = 1 - (y + h) / AH;
      uv.setXY(0, u0, v1); uv.setXY(1, u1, v1); uv.setXY(2, u0, v0); uv.setXY(3, u1, v0);
      uv.needsUpdate = true;
      this.mesh.scale.set((this.hgt * w) / h, this.hgt, 1);
    }
    return this;
  }
  act(name: string, t = 0, fps = 8, loop = true) {
    const p = `act_${this.who}_${name}`;
    return this.raw(F[p + '_0'] ? p : F[`act_${this.who}_idle_0`] ? `act_${this.who}_idle` : `act_${this.who}_hover`, t, fps, loop);
  }
  walk(t = 0, fps = 10) { return this.raw(this.who === 'doubao' ? 'walk_doubao_big' : `walk_${this.who}`, t, fps); }
  /** k: 0=原色 1=纯黑剪影 */
  sil(k: number, col = 0x000000) { this.mat.color.set(0xffffff).lerp(new THREE.Color(col), clamp(k)); return this; }
  alpha(a: number) { this.mat.transparent = a < 0.999; this.mat.opacity = a; this.visible = a > 0.003; return this; }
  face(dir: number) { this.scale.x = Math.abs(this.scale.x) * (dir < 0 ? -1 : 1); return this; }
  put(x: number, y: number, z: number) { this.position.set(x, y, z); return this; }
}
/** 图集里的道具 / 特效小贴片 */
export function sprite(name: string, h = 0.6) {
  const a = new Actor('whale', h); a.raw(name, 0); a.mesh.geometry.translate(0, -0.5, 0); return a;
}

/* ───────────── 镜头 ───────────── */
export interface Hud { flash: number; flashCol: string; fade: number; bars: number; shake: number; tint: string; glitch: number; }
export interface Frame {
  t: number; lt: number; p: number; dur: number; cam: THREE.PerspectiveCamera; hud: Hud; bp: number;
  look: (px: number, py: number, pz: number, tx: number, ty: number, tz: number, fov?: number, roll?: number) => void;
}
export interface Shot<O = any> { id: string; a: number; b: number; build: (s: THREE.Scene) => O; draw: (o: O, f: Frame) => void; scene?: THREE.Scene; obj?: O; }
export const SHOTS: Shot[] = [];
export function shot<O>(id: string, a: number, b: number, build: (s: THREE.Scene) => O, draw: (o: O, f: Frame) => void) {
  SHOTS.push({ id, a, b, build, draw });
}
