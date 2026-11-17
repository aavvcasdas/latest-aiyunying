// 公共底座：数学 / 缓动、节拍网格、歌词时间、像素纸片人（分支图集原图，加厚成软立体卡）、贴图、粒子
import * as THREE from 'three';
import atlasUrl from '../assets/atlas.png';
import { ACTIONS, ATLAS_H, ATLAS_W, BEAT, KICK, LYRICS, PHASE, RECTS, RMS } from './data';

// ---------- 数学 ----------
export const clamp = (x: number, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const range = (t: number, a: number, b: number) => (b <= a ? (t >= b ? 1 : 0) : clamp((t - a) / (b - a)));
export const smooth = (t: number) => { const x = clamp(t); return x * x * (3 - 2 * x); };
export const eOut = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
export const eIn = (t: number) => Math.pow(clamp(t), 3);
export const eIO = (t: number) => { const x = clamp(t); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
export const eBack = (t: number, s = 1.9) => { const x = clamp(t) - 1; return 1 + x * x * ((s + 1) * x + s); };
/** 果冻弹：0→1，带衰减回弹 */
export const jelly = (t: number, k = 7) => (t <= 0 ? 0 : 1 - Math.exp(-t * k) * Math.cos(t * k * 1.9));
export const bump = (t: number, a: number, d = 0.3) => { const x = (t - a) / d; return x < 0 || x > 1 ? 0 : Math.sin(x * Math.PI); };
export const decay = (t: number, a: number, k = 6) => (t < a ? 0 : Math.exp(-(t - a) * k));
export const hash = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export type V3 = [number, number, number];
export const mix3 = (a: number[], b: number[], t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
/** Catmull-Rom 穿过所有控制点 */
export function path3(pts: number[][], t: number): V3 {
  const n = pts.length - 1; const x = clamp(t) * n; const i = Math.min(n - 1, Math.floor(x)); const f = x - i;
  const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n, i + 2)];
  const o: V3 = [0, 0, 0];
  for (let k = 0; k < 3; k++) {
    const a = p0[k], b = p1[k], c = p2[k], d = p3[k];
    o[k] = 0.5 * (2 * b + (-a + c) * f + (2 * a - 5 * b + 4 * c - d) * f * f + (-a + 3 * b - 3 * c + d) * f * f * f);
  }
  return o;
}
export function setCam(cam: THREE.PerspectiveCamera, p: number[], look: number[], fov = 40) {
  cam.position.set(p[0], p[1], p[2]); cam.up.set(0, 1, 0); cam.lookAt(look[0], look[1], look[2]);
  if (Math.abs(cam.fov - fov) > 1e-3) { cam.fov = fov; cam.updateProjectionMatrix(); }
}

// ---------- 节拍（130 BPM 实测网格） ----------
export const beatOf = (t: number) => (t - PHASE) / BEAT;
export const timeOfBeat = (b: number) => PHASE + b * BEAT;
export const barStart = (bar: number) => PHASE + bar * 4 * BEAT;
function curve(a: number[], t: number) {
  const x = t * 20; const i = Math.floor(x); const f = x - i;
  const v0 = a[Math.max(0, Math.min(a.length - 1, i))] ?? 0; const v1 = a[Math.max(0, Math.min(a.length - 1, i + 1))] ?? 0;
  return v0 + (v1 - v0) * f;
}
export const rmsAt = (t: number) => curve(RMS, t);
/** 鼓点脉冲：最近一拍的底鼓强度 × 指数衰减 */
export function kick(t: number, k = 7) {
  const b = beatOf(t); if (b < 0) return 0; const i = Math.floor(b); const dt = (b - i) * BEAT;
  return (KICK[i] ?? 0) * Math.exp(-dt * k);
}
/** 纯网格节拍：每拍一个 0..1 衰减脉冲（不看鼓点强弱） */
export function beatPulse(t: number, sub = 1, k = 8) { const b = beatOf(t) * sub; if (b < 0) return 0; return Math.exp(-(b - Math.floor(b)) * (BEAT / sub) * k); }
/** 弹跳：在第 sub 分拍上跳起来的高度 0..1 */
export function hopAt(t: number, sub = 1, phase = 0) { const b = beatOf(t) * sub + phase; const f = b - Math.floor(b); return Math.sin(f * Math.PI); }

// ---------- 歌词时间（行号从 1 开始） ----------
export const LS = (n: number) => LYRICS[n - 1].t[0];
export const LE = (n: number) => LYRICS[n - 1].end;
export const LT = (n: number, k: number) => { const l = LYRICS[n - 1]; const ks = k < 0 ? l.t.length + k : k; return l.t[Math.max(0, Math.min(l.t.length - 1, ks))]; };

// ---------- 画在 Canvas 上的小贴图 ----------
const _tex: Record<string, THREE.Texture> = {};
export function canvasTex(id: string, w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, srgb = true) {
  if (_tex[id]) return _tex[id];
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  _tex[id] = t; return t;
}
export const glowTex = () => canvasTex('glow', 64, 64, (g) => {
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.22, 'rgba(255,255,255,0.75)'); gr.addColorStop(0.55, 'rgba(255,255,255,0.16)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
}, false);
export const shadowTex = () => canvasTex('shadow', 64, 64, (g) => {
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(20,10,40,0.55)'); gr.addColorStop(0.6, 'rgba(20,10,40,0.22)'); gr.addColorStop(1, 'rgba(20,10,40,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
}, false);
export const petalTex = () => canvasTex('petal', 64, 64, (g) => {
  g.fillStyle = '#fff'; g.beginPath(); g.moveTo(32, 4); g.bezierCurveTo(58, 18, 52, 50, 32, 60); g.bezierCurveTo(12, 50, 6, 18, 32, 4); g.fill();
});
export const starTex = () => canvasTex('star', 64, 64, (g) => {
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 30); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.15, 'rgba(255,255,255,0.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  g.fillStyle = 'rgba(255,255,255,0.9)'; g.beginPath(); g.moveTo(32, 2); g.lineTo(35, 29); g.lineTo(62, 32); g.lineTo(35, 35); g.lineTo(32, 62); g.lineTo(29, 35); g.lineTo(2, 32); g.lineTo(29, 29); g.closePath(); g.fill();
}, false);

// ---------- 图集 & 纸片人 ----------
export let ATLAS: THREE.Texture | null = null;
export async function loadAtlas() {
  const img = new Image(); img.src = atlasUrl; await img.decode();
  const tex = new THREE.Texture(img);
  tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false; tex.needsUpdate = true;
  ATLAS = tex;
}
const PX = 1 / 88;
const _v = new THREE.Vector3();
function setUV(g: THREE.BufferGeometry, r: [number, number, number, number]) {
  const u0 = r[0] / ATLAS_W, u1 = (r[0] + r[2]) / ATLAS_W, v1 = 1 - r[1] / ATLAS_H, v0 = 1 - (r[1] + r[3]) / ATLAS_H;
  const uv = g.attributes.uv as THREE.BufferAttribute;
  uv.setXY(0, u0, v1); uv.setXY(1, u1, v1); uv.setXY(2, u0, v0); uv.setXY(3, u1, v0); uv.needsUpdate = true;
}
export const hasFrame = (k: string) => !!RECTS[k];

/** 像素纸片人：脚底为原点，始终面向镜头；背后叠四层加深的「厚度」，脚下一团软影子 —— 像一块软软的立体贴纸 */
export class Actor {
  root = new THREE.Group(); body = new THREE.Group(); front: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  layers: THREE.Mesh[] = []; shadow: THREE.Mesh; geo: THREE.PlaneGeometry;
  ch: string; act = 'idle'; t0 = 0; key: string | null = null; flip = false; size: number; spin = 0; lay = 0; squash = 0; flat = false;
  private last = ''; private w = 1; private h = 1;
  constructor(ch: string, size = 1) {
    this.ch = ch; this.size = size;
    this.geo = new THREE.PlaneGeometry(1, 1); this.geo.translate(0, 0.5, 0);
    const m = new THREE.MeshBasicMaterial({ map: ATLAS, transparent: true, alphaTest: 0.25, side: THREE.DoubleSide, fog: true });
    this.front = new THREE.Mesh(this.geo, m);
    const dm = new THREE.MeshBasicMaterial({ map: ATLAS, transparent: true, alphaTest: 0.25, color: 0x3b2a5c, fog: true });
    for (let k = 1; k <= 4; k++) { const d = new THREE.Mesh(this.geo, dm); d.position.z = -0.012 * k; this.layers.push(d); this.body.add(d); }
    this.body.add(this.front);
    this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: shadowTex(), transparent: true, depthWrite: false }));
    this.shadow.rotation.x = -Math.PI / 2; this.shadow.position.y = 0.02;
    this.root.add(this.body, this.shadow);
  }
  play(a: string, t0 = 0) { this.act = a; this.t0 = t0; this.key = null; return this; }
  still(k: string) { this.key = k; return this; }
  /** 到点切动作 */
  cue(t: number, list: [number, string][]) {
    let cur: [number, string] = list[0];
    for (const it of list) if (t >= it[0]) cur = it;
    if (hasFrame(cur[1])) this.still(cur[1]); else this.play(cur[1], cur[0]);
    return this;
  }
  at(x: number, y: number, z: number) { this.root.position.set(x, y, z); return this; }
  show(v = true) { this.root.visible = v; return this; }
  tint(hex: number, op = 1) { this.front.material.color.setHex(hex); this.front.material.opacity = op; return this; }
  frame(t: number): string {
    if (this.key) return this.key;
    const set = ACTIONS[this.ch];
    const a = set?.[this.act] ?? set?.idle ?? set?.float;
    if (!a) throw new Error(`图集缺动作 ${this.ch}:${this.act}`);
    const n = a.f.length; let i = Math.floor(Math.max(0, t - this.t0) * a.fps);
    i = a.loop ? i % n : Math.min(n - 1, i);
    return a.f[i];
  }
  update(t: number, cam: THREE.Camera) {
    if (!this.root.visible) return;
    const k = this.frame(t);
    if (k !== this.last) { const r = RECTS[k]; if (!r) throw new Error(`图集缺帧 ${k}`); setUV(this.geo, r); this.w = r[2]; this.h = r[3]; this.last = k; }
    const s = this.size * PX; const sq = this.squash;
    this.body.scale.set(this.w * s * (this.flip ? -1 : 1) * (1 + sq * 0.5), this.h * s * (1 - sq), 1);
    this.body.getWorldPosition(_v);
    const yaw = Math.atan2(cam.position.x - _v.x, cam.position.z - _v.z);
    if (this.flat) this.body.rotation.set(-Math.PI / 2, 0, this.spin + this.lay); else this.body.rotation.set(0, yaw, this.spin + this.lay);
    const lift = this.body.position.y;
    const sh = Math.max(0.15, 1 - lift * 0.35);
    this.shadow.scale.set(this.w * s * 1.1 * sh, this.w * s * 0.55 * sh, 1);
    (this.shadow.material as THREE.MeshBasicMaterial).opacity = sh * this.front.material.opacity;
  }
}

/** 软软的点粒子（星星 / 萤火 / 花瓣） */
export class Particles {
  points: THREE.Points; geo: THREE.BufferGeometry; pos: Float32Array; col: Float32Array; n: number;
  constructor(n: number, o: { size?: number; tex?: THREE.Texture; additive?: boolean; opacity?: number } = {}) {
    this.n = n; this.geo = new THREE.BufferGeometry(); this.pos = new Float32Array(n * 3); this.col = new Float32Array(n * 3).fill(1);
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); this.geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    const m = new THREE.PointsMaterial({ size: o.size ?? 0.2, map: o.tex ?? glowTex(), vertexColors: true, transparent: true, opacity: o.opacity ?? 1, depthWrite: false, blending: o.additive === false ? THREE.NormalBlending : THREE.AdditiveBlending, sizeAttenuation: true, fog: false });
    this.points = new THREE.Points(this.geo, m); this.points.frustumCulled = false;
  }
  set(i: number, x: number, y: number, z: number) { this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z; }
  color(i: number, c: THREE.Color, k = 1) { this.col[i * 3] = c.r * k; this.col[i * 3 + 1] = c.g * k; this.col[i * 3 + 2] = c.b * k; }
  commit() { (this.geo.attributes.position as THREE.BufferAttribute).needsUpdate = true; (this.geo.attributes.color as THREE.BufferAttribute).needsUpdate = true; }
  get mat() { return this.points.material as THREE.PointsMaterial; }
}
export const C = (h: number) => new THREE.Color(h);
