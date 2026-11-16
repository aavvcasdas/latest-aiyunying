// 底座：数学 / 缓动、音频曲线、歌词时间、程序贴图、像素纸片人（分支图集原像素）、天空、星星、雨、粒子与烟火。
// 规矩：所有画面只读参数里的时间 t（可任意跳转、可逐帧渲染）。
import * as THREE from 'three';
import atlasUrl from '../assets/cast.png';
import { ACTIONS, ATLAS_H, ATLAS_W, RECTS } from './atlasData';
import { BEAT_PERIOD, BEAT_PHASE, HIT, LINES, RMS, VOX } from './timing';

// ---------- 数学 ----------
export const clamp = (x: number, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const range = (t: number, a: number, b: number) => (b <= a ? (t >= b ? 1 : 0) : clamp((t - a) / (b - a)));
export const smooth = (t: number) => { const x = clamp(t); return x * x * (3 - 2 * x); };
export const eOut = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
export const eIn = (t: number) => Math.pow(clamp(t), 3);
export const eIO = (t: number) => { const x = clamp(t); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
export const eBack = (t: number, s = 1.7) => { const x = clamp(t) - 1; return 1 + x * x * ((s + 1) * x + s); };
export const bump = (t: number, a: number, d = 0.3) => { const x = (t - a) / d; return x < 0 || x > 1 ? 0 : Math.sin(x * Math.PI); };
export const decay = (t: number, a: number, k = 6) => (t < a ? 0 : Math.exp(-(t - a) * k));
export const hash = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export type V3 = [number, number, number];
export const mix3 = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export function setCam(cam: THREE.PerspectiveCamera, p: V3, look: V3, fov = 40, roll = 0) {
  cam.position.set(p[0], p[1], p[2]); cam.up.set(Math.sin(roll), Math.cos(roll), 0); cam.lookAt(look[0], look[1], look[2]);
  if (Math.abs(cam.fov - fov) > 1e-3) { cam.fov = fov; cam.updateProjectionMatrix(); }
}

// ---------- 音频曲线（20 Hz，实测） ----------
function curve(a: number[], t: number) {
  const x = t * 20, i = Math.floor(x), f = x - i;
  const g = (k: number) => a[Math.max(0, Math.min(a.length - 1, k))] ?? 0;
  return g(i) + (g(i + 1) - g(i)) * f;
}
export const rmsAt = (t: number) => curve(RMS, t);
export const voxAt = (t: number) => curve(VOX, t);
export function hitAt(t: number) { let m = 0; for (let k = 0; k < 6; k++) { const dt = k * 0.05; m = Math.max(m, curve(HIT, t - dt) * Math.exp(-dt * 9)); } return clamp(m); }
export const beatFrac = (t: number) => { const x = (t - BEAT_PHASE) / BEAT_PERIOD; return x - Math.floor(x); };
export const beatPulse = (t: number) => Math.exp(-beatFrac(t) * BEAT_PERIOD * 7);

// ---------- 歌词时间（句号从 0 开始） ----------
export const ON = (li: number, k: number) => { const o = LINES[li].on; return o[Math.max(0, Math.min(o.length - 1, k))]; };
export const LS = (li: number) => LINES[li].on[0];
export const LE = (li: number) => LINES[li].end;
export function charIdx(li: number, t: number) { const o = LINES[li].on; let k = -1; for (let i = 0; i < o.length; i++) if (t >= o[i]) k = i; return k; }

// ---------- 程序贴图 ----------
export function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; return t;
}
function radial(g: CanvasRenderingContext2D, s: number, stops: [number, string][]) {
  const r = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2); stops.forEach(([o, c]) => r.addColorStop(o, c)); g.fillStyle = r; g.fillRect(0, 0, s, s);
}
export const TEX = {} as Record<'glow' | 'blob' | 'cloud' | 'clock' | 'bubble' | 'moon' | 'spark' | 'petal' | 'ring' | 'beam' | 'lantern', THREE.Texture>;
export function makeTextures(font: string) {
  TEX.glow = canvasTex(128, 128, (g) => radial(g, 128, [[0, 'rgba(255,255,255,1)'], [0.22, 'rgba(255,255,255,0.5)'], [0.6, 'rgba(255,255,255,0.12)'], [1, 'rgba(255,255,255,0)']]));
  TEX.spark = canvasTex(64, 64, (g) => radial(g, 64, [[0, 'rgba(255,255,255,1)'], [0.3, 'rgba(255,255,255,0.8)'], [1, 'rgba(255,255,255,0)']]));
  TEX.blob = canvasTex(64, 64, (g) => radial(g, 64, [[0, 'rgba(0,0,0,0.55)'], [0.6, 'rgba(0,0,0,0.25)'], [1, 'rgba(0,0,0,0)']]));
  TEX.ring = canvasTex(128, 128, (g) => { g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = 5; g.beginPath(); g.arc(64, 64, 56, 0, Math.PI * 2); g.stroke(); });
  TEX.beam = canvasTex(64, 256, (g) => { const l = g.createLinearGradient(0, 0, 0, 256); l.addColorStop(0, 'rgba(255,255,255,0.9)'); l.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = l; g.fillRect(0, 0, 64, 256); const h = g.createLinearGradient(0, 0, 64, 0); h.addColorStop(0, 'rgba(0,0,0,1)'); h.addColorStop(0.5, 'rgba(0,0,0,0)'); h.addColorStop(1, 'rgba(0,0,0,1)'); g.globalCompositeOperation = 'destination-out'; g.fillStyle = h; g.fillRect(0, 0, 64, 256); });
  TEX.cloud = canvasTex(256, 128, (g) => {
    for (let i = 0; i < 14; i++) { const x = 40 + hash(i) * 176, y = 70 + (hash(i + 9) - 0.5) * 30, r = 22 + hash(i + 3) * 30; const rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, 'rgba(255,255,255,0.85)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = rg; g.fillRect(0, 0, 256, 128); }
  });
  TEX.petal = canvasTex(64, 64, (g) => { g.fillStyle = '#fff'; g.beginPath(); g.ellipse(32, 32, 13, 26, 0.5, 0, Math.PI * 2); g.fill(); });
  TEX.lantern = canvasTex(64, 96, (g) => { const l = g.createLinearGradient(0, 0, 0, 96); l.addColorStop(0, '#ffcf7a'); l.addColorStop(1, '#ff7a3a'); g.fillStyle = l; g.beginPath(); g.moveTo(14, 8); g.lineTo(50, 8); g.lineTo(56, 84); g.lineTo(8, 84); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,255,220,0.8)'; g.fillRect(24, 60, 16, 24); });
  TEX.clock = canvasTex(256, 256, (g) => {
    g.fillStyle = '#f6ecd6'; g.beginPath(); g.arc(128, 128, 120, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#7a5a3a'; g.lineWidth = 10; g.stroke(); g.lineWidth = 3; g.beginPath(); g.arc(128, 128, 104, 0, Math.PI * 2); g.stroke();
    for (let i = 0; i < 60; i++) { const a = (i / 60) * Math.PI * 2, r0 = i % 5 ? 96 : 84; g.lineWidth = i % 5 ? 2 : 6; g.beginPath(); g.moveTo(128 + Math.sin(a) * r0, 128 - Math.cos(a) * r0); g.lineTo(128 + Math.sin(a) * 102, 128 - Math.cos(a) * 102); g.stroke(); }
    g.fillStyle = '#7a5a3a'; g.beginPath(); g.arc(128, 128, 9, 0, Math.PI * 2); g.fill();
  });
  TEX.moon = canvasTex(256, 256, (g) => {
    radial(g, 256, [[0, 'rgba(255,250,220,0.0)'], [0.55, 'rgba(255,245,210,0.0)'], [0.62, 'rgba(255,240,200,0.25)'], [1, 'rgba(255,240,200,0)']]);
    g.fillStyle = '#fff6d8'; g.beginPath(); g.arc(128, 128, 76, 0, Math.PI * 2); g.fill();
    g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(162, 104, 70, 0, Math.PI * 2); g.fill();
  });
  TEX.bubble = canvasTex(256, 160, (g) => {
    g.fillStyle = '#ffffff'; g.strokeStyle = '#1d2340'; g.lineWidth = 6;
    const r = 34; g.beginPath(); g.moveTo(20 + r, 10); g.arcTo(236, 10, 236, 120, r); g.arcTo(236, 120, 20, 120, r); g.lineTo(70, 120); g.lineTo(46, 152); g.lineTo(52, 120); g.arcTo(20, 120, 20, 10, r); g.arcTo(20, 10, 236, 10, r); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#8a90a8'; g.font = `64px ${font}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('……', 128, 62);
  });
}
export function glow(color: THREE.ColorRepresentation, size: number, opacity = 1, tex = TEX.glow) {
  const m = new THREE.SpriteMaterial({ map: tex, color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const s = new THREE.Sprite(m); s.scale.set(size, size, 1); return s;
}

// ---------- 几何小工具 ----------
export const lam = (c: THREE.ColorRepresentation, o: THREE.MeshLambertMaterialParameters = {}) => new THREE.MeshLambertMaterial({ color: c, ...o });
export const emi = (c: THREE.ColorRepresentation, k = 1) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k) });
export function add<T extends THREE.Object3D>(parent: THREE.Object3D, o: T, x = 0, y = 0, z = 0): T { o.position.set(x, y, z); parent.add(o); return o; }
export const box = (w: number, h: number, d: number, m: THREE.Material) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
export const cyl = (rt: number, rb: number, h: number, m: THREE.Material, seg = 12) => new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
export const ball = (r: number, m: THREE.Material, seg = 16) => new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.max(6, seg >> 1)), m);

// ---------- 天空 ----------
export function skyDome(top: string, mid: string, bot: string) {
  const u = { top: { value: new THREE.Color(top) }, mid: { value: new THREE.Color(mid) }, bot: { value: new THREE.Color(bot) }, ex: { value: 0.55 } };
  const m = new THREE.ShaderMaterial({
    uniforms: u, side: THREE.BackSide, depthWrite: false,
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform vec3 top, mid, bot; uniform float ex; varying vec3 vP;
      void main(){ float h = normalize(vP).y; vec3 c = h > 0.0 ? mix(mid, top, pow(clamp(h,0.0,1.0), ex)) : mix(mid, bot, pow(clamp(-h*3.0,0.0,1.0), 0.6));
      gl_FragColor = vec4(c, 1.0);
      #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(420, 32, 16), m); mesh.renderOrder = -10; mesh.frustumCulled = false;
  return { mesh, u, set(a: string, b: string, c: string, k = 1) { u.top.value.lerp(new THREE.Color(a), k); u.mid.value.lerp(new THREE.Color(b), k); u.bot.value.lerp(new THREE.Color(c), k); } };
}
export type Sky = ReturnType<typeof skyDome>;

// ---------- 粒子（每帧按时间重算，可跳转） ----------
export class Particles {
  geo = new THREE.BufferGeometry(); pts: THREE.Points; n = 0; cap: number;
  pos: Float32Array; col: Float32Array; al: Float32Array; sz: Float32Array; mat: THREE.ShaderMaterial;
  constructor(cap: number, map: THREE.Texture = TEX.spark, additive = true) {
    this.cap = cap; this.pos = new Float32Array(cap * 3); this.col = new Float32Array(cap * 3); this.al = new Float32Array(cap); this.sz = new Float32Array(cap);
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3)); this.geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    this.geo.setAttribute('alpha', new THREE.BufferAttribute(this.al, 1)); this.geo.setAttribute('psize', new THREE.BufferAttribute(this.sz, 1));
    this.mat = new THREE.ShaderMaterial({
      uniforms: { map: { value: map } }, vertexColors: true, transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      vertexShader: 'attribute float alpha; attribute float psize; varying vec3 vC; varying float vA; void main(){ vC = color; vA = alpha; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = psize * (420.0 / max(0.2, -mv.z)); gl_Position = projectionMatrix * mv; }',
      fragmentShader: `uniform sampler2D map; varying vec3 vC; varying float vA; void main(){ vec4 s = texture2D(map, gl_PointCoord); if (s.a * vA < 0.003) discard; gl_FragColor = vec4(vC * s.rgb, s.a * vA);
        #include <colorspace_fragment>
        }`,
    });
    this.pts = new THREE.Points(this.geo, this.mat); this.pts.frustumCulled = false;
  }
  begin() { this.n = 0; }
  add(x: number, y: number, z: number, r: number, g: number, b: number, a: number, s: number) {
    if (this.n >= this.cap || a <= 0.002) return; const i = this.n++;
    this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z; this.col[i * 3] = r; this.col[i * 3 + 1] = g; this.col[i * 3 + 2] = b; this.al[i] = a; this.sz[i] = s;
  }
  commit() {
    this.geo.setDrawRange(0, this.n);
    for (const k of ['position', 'color', 'alpha', 'psize']) (this.geo.attributes[k] as THREE.BufferAttribute).needsUpdate = true;
  }
}

export function starField(n: number, r: number, seed = 1, size = 1.2) {
  const p = new Particles(n, TEX.spark, true); const base: number[] = [];
  for (let i = 0; i < n; i++) {
    const u = hash(i * 3.1 + seed), v = hash(i * 7.3 + seed * 2); const th = u * Math.PI * 2, y = 0.04 + v * 0.96, rr = Math.sqrt(1 - y * y);
    base.push(Math.cos(th) * rr * r, y * r, Math.sin(th) * rr * r, hash(i + seed * 5));
  }
  return {
    p, update(t: number, op: number, center: THREE.Vector3) {
      p.begin();
      for (let i = 0; i < n; i++) {
        const ph = base[i * 4 + 3], tw = 0.55 + 0.45 * Math.sin(t * (1.5 + ph * 3) + ph * 40); const w = ph > 0.8 ? [0.75, 0.85, 1] : [1, 0.96, 0.88];
        p.add(base[i * 4] + center.x, base[i * 4 + 1] + center.y * 0.2, base[i * 4 + 2] + center.z, w[0], w[1], w[2], op * tw, size * (0.6 + ph * 1.1) * r * 0.012);
      }
      p.commit();
    },
  };
}

export class Rain {
  lines: THREE.LineSegments; pos: Float32Array; n: number; mat: THREE.LineBasicMaterial;
  constructor(n = 1600) {
    this.n = n; this.pos = new Float32Array(n * 6); const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.mat = new THREE.LineBasicMaterial({ color: '#a9c4f2', transparent: true, opacity: 0.5, depthWrite: false });
    this.lines = new THREE.LineSegments(g, this.mat); this.lines.frustumCulled = false;
  }
  update(t: number, c: THREE.Vector3, amount: number, wind = 0.18, spread = 18) {
    const H = 12;
    for (let i = 0; i < this.n; i++) {
      const on = hash(i * 1.7) < amount; const o = i * 6;
      if (!on) { for (let k = 0; k < 6; k++) this.pos[o + k] = 0; this.pos[o + 1] = this.pos[o + 4] = -999; continue; }
      const sp = 11 + hash(i * 7.7) * 5, x = c.x + (hash(i * 3.1) - 0.5) * spread, z = c.z + (hash(i * 5.3) - 0.5) * spread;
      const y = c.y + H * 0.6 - ((t * sp + hash(i * 1.3) * H) % H), len = 0.32 + hash(i) * 0.2;
      this.pos[o] = x; this.pos[o + 1] = y; this.pos[o + 2] = z; this.pos[o + 3] = x + wind * len; this.pos[o + 4] = y + len; this.pos[o + 5] = z;
    }
    (this.lines.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  }
}

// ---------- 烟火 ----------
export interface Burst { t: number; at: V3; from?: V3; c1: string; c2: string; n?: number; v?: number; shape?: 'peony' | 'heart' | 'ring' | 'willow'; seed?: number }
const _c1 = new THREE.Color(), _c2 = new THREE.Color(), _c = new THREE.Color();
export function drawFireworks(P: Particles, bursts: Burst[], t: number, scale = 1) {
  for (const b of bursts) {
    const dt = t - b.t, n = b.n ?? 150, v = (b.v ?? 2.6) * scale, sd = b.seed ?? b.t * 13.7, shape = b.shape ?? 'peony';
    _c1.set(b.c1); _c2.set(b.c2);
    if (b.from && dt < 0 && dt > -0.75) {
      const e = eOut(1 + dt / 0.75);
      for (let k = 0; k < 12; k++) { const ee = Math.max(0, e - k * 0.018); const p = mix3(b.from, b.at, ee); P.add(p[0] + Math.sin(k * 3 + t * 30) * 0.01, p[1], p[2], 1, 0.85, 0.6, (1 - k / 12) * 0.9, 0.12 * scale); }
    }
    if (dt < 0 || dt > 3) continue;
    if (dt < 0.2) P.add(b.at[0], b.at[1], b.at[2], 1, 1, 1, 1 - dt / 0.2, 1.6 * scale);
    const life = shape === 'willow' ? 2.9 : 2.1, g = shape === 'willow' ? 0.55 : 0.9, kd = 1.7;
    for (let i = 0; i < n; i++) {
      let dx: number, dy: number, dz: number;
      if (shape === 'heart') { const th = (i / n) * Math.PI * 2; dx = 16 * Math.pow(Math.sin(th), 3) / 17; dy = (13 * Math.cos(th) - 5 * Math.cos(2 * th) - 2 * Math.cos(3 * th) - Math.cos(4 * th)) / 17 + 0.1; dz = (hash(i + sd) - 0.5) * 0.15; }
      else if (shape === 'ring') { const th = (i / n) * Math.PI * 2; dx = Math.cos(th); dy = Math.sin(th) * 0.55; dz = Math.sin(th) * 0.8; }
      else { const y = 1 - (2 * (i + 0.5)) / n, r = Math.sqrt(1 - y * y), th = i * 2.39996 + sd; dx = Math.cos(th) * r; dy = y; dz = Math.sin(th) * r; }
      const sp = v * (shape === 'heart' || shape === 'ring' ? 1 : 0.8 + 0.4 * hash(i * 1.3 + sd));
      for (let tail = 0; tail < 3; tail++) {
        const tt = dt - tail * 0.045; if (tt < 0) continue;
        const s = (sp * (1 - Math.exp(-kd * tt))) / kd, life01 = tt / life; if (life01 > 1) continue;
        const tw = 0.75 + 0.25 * Math.sin(tt * 40 + i);
        _c.copy(_c1).lerp(_c2, clamp(life01 * 1.3));
        P.add(b.at[0] + dx * s, b.at[1] + dy * s - 0.5 * g * tt * tt, b.at[2] + dz * s, _c.r, _c.g, _c.b, Math.pow(1 - life01, 1.4) * tw * (1 - tail * 0.33), (0.2 - tail * 0.04) * scale);
      }
    }
  }
}

// ---------- 图集 & 像素纸片人 ----------
export let ATLAS: THREE.Texture;
export async function loadAtlas() {
  const img = new Image(); img.src = atlasUrl; await img.decode();
  const tex = new THREE.Texture(img); tex.colorSpace = THREE.SRGBColorSpace; tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false; tex.needsUpdate = true;
  ATLAS = tex;
}
const PX = 1 / 88;
/** 图集里的一格：脚底（或中心）为原点的竖直纸片 */
export class Sprite {
  geo: THREE.PlaneGeometry; mat: THREE.MeshBasicMaterial; mesh: THREE.Mesh; key = ''; flip = false; size: number; w = 1; h = 1; billboard = true;
  constructor(size = 1, anchor: 'bottom' | 'center' = 'bottom', additive = false) {
    this.size = size; this.geo = new THREE.PlaneGeometry(1, 1); if (anchor === 'bottom') this.geo.translate(0, 0.5, 0);
    this.mat = new THREE.MeshBasicMaterial({ map: ATLAS, transparent: true, alphaTest: additive ? 0 : 0.35, side: THREE.DoubleSide, depthWrite: !additive, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending });
    this.mesh = new THREE.Mesh(this.geo, this.mat);
  }
  frame(key: string, flip = false) {
    if (key !== this.key || flip !== this.flip) {
      const r = RECTS[key]; if (!r) throw new Error('图集里没有这一格：' + key);
      const u0 = r[0] / ATLAS_W, u1 = (r[0] + r[2]) / ATLAS_W, v1 = 1 - r[1] / ATLAS_H, v0 = 1 - (r[1] + r[3]) / ATLAS_H;
      const a = flip ? u1 : u0, b = flip ? u0 : u1; const uv = this.geo.attributes.uv as THREE.BufferAttribute;
      uv.setXY(0, a, v1); uv.setXY(1, b, v1); uv.setXY(2, a, v0); uv.setXY(3, b, v0); uv.needsUpdate = true;
      this.w = r[2] * PX; this.h = r[3] * PX; this.key = key; this.flip = flip;
    }
    this.mesh.scale.set(this.w * this.size, this.h * this.size, 1);
    return this;
  }
  at(x: number, y: number, z: number) { this.mesh.position.set(x, y, z); return this; }
  face(cam: THREE.Camera) { if (this.billboard) this.mesh.rotation.set(0, Math.atan2(cam.position.x - this.mesh.position.x, cam.position.z - this.mesh.position.z), 0); return this; }
  tint(c: THREE.ColorRepresentation, op = 1) { this.mat.color.set(c); this.mat.opacity = op; this.mesh.visible = op > 0.01; return this; }
}
/** 角色：动作取自分支 cast_actions（fps / loop 原样） */
export class Actor extends Sprite {
  ch: string; shadow: THREE.Mesh;
  constructor(ch: string, size = 1) {
    super(size); this.ch = ch; if (!ACTIONS[ch]) throw new Error('没有这个角色：' + ch);
    this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: TEX.blob, transparent: true, depthWrite: false }));
    this.shadow.rotation.x = -Math.PI / 2;
  }
  addTo(o: THREE.Object3D) { o.add(this.mesh); o.add(this.shadow); return this; }
  pose(act: string, u: number, flip = false) {
    const A = ACTIONS[this.ch][act]; if (!A) throw new Error(`${this.ch} 没有动作 ${act}`);
    const n = A.frames.length; let i = Math.floor(Math.max(0, u) * A.fps); i = A.loop ? i % n : Math.min(n - 1, i);
    return this.frame(A.frames[i], flip);
  }
  place(x: number, y: number, z: number, cam: THREE.Camera, ground = y) {
    this.at(x, y, z).face(cam); const s = this.w * this.size * 0.9;
    this.shadow.position.set(x, ground + 0.012, z); this.shadow.scale.set(s, s * 0.45, 1); this.shadow.visible = this.mesh.visible && Math.abs(y - ground) < 1.5;
    (this.shadow.material as THREE.MeshBasicMaterial).opacity = clamp(1 - Math.abs(y - ground) * 0.8) * this.mat.opacity;
    return this;
  }
  show(v: boolean) { this.mesh.visible = v; this.shadow.visible = v; return this; }
}
