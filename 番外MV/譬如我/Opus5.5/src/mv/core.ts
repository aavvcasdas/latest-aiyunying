// 公共底座：数学 / 缓动、音频能量曲线、歌词时间、像素纸片人、粒子、天空球
import * as THREE from 'three';
import atlasUrl from '../assets/atlas.png';
import { ACTIONS, ATLAS_H, ATLAS_W, BEAT, BEAT0, HIT, LYRICS, RECTS, RMS } from './generated';

export const clamp = (x: number, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const range = (t: number, a: number, b: number) => (b <= a ? (t >= b ? 1 : 0) : clamp((t - a) / (b - a)));
export const smooth = (t: number) => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};
export const eOut = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
export const eIn = (t: number) => Math.pow(clamp(t), 3);
export const eIO = (t: number) => {
  const x = clamp(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const eBack = (t: number, s = 1.9) => {
  const x = clamp(t) - 1;
  return 1 + x * x * ((s + 1) * x + s);
};
export const bump = (t: number, a: number, d = 0.3) => {
  const x = (t - a) / d;
  return x < 0 || x > 1 ? 0 : Math.sin(x * Math.PI);
};
export const decay = (t: number, a: number, k = 6) => (t < a ? 0 : Math.exp(-(t - a) * k));
export const beat = (t: number) => {
  let x = ((t - BEAT0) / BEAT) % 1;
  if (x < 0) x += 1;
  return Math.exp(-x * 4);
};
export const hash = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export function rng(seed: number) {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// 音频能量曲线（20Hz 采样）
function curve(a: number[], t: number) {
  const x = t * 20;
  const i = Math.floor(x);
  const f = x - i;
  const v0 = a[Math.max(0, Math.min(a.length - 1, i))] ?? 0;
  const v1 = a[Math.max(0, Math.min(a.length - 1, i + 1))] ?? 0;
  return v0 + (v1 - v0) * f;
}
export const rmsAt = (t: number) => curve(RMS, t);
export function pulse(t: number) {
  let m = 0;
  for (let k = 0; k < 7; k++) {
    const dt = k * 0.05;
    m = Math.max(m, curve(HIT, t - dt) * Math.exp(-dt * 8));
  }
  return clamp(m * 1.3);
}

// 歌词时间（行号从 1 开始）
export const LS = (n: number) => LYRICS[n - 1].t[0];
export const LE = (n: number) => LYRICS[n - 1].end;
export const LT = (n: number, k: number) => {
  const l = LYRICS[n - 1];
  return l.t[Math.max(0, Math.min(l.t.length - 1, k))];
};

// 图集 & 纸片人
export let ATLAS: THREE.Texture | null = null;
export let ATLAS_IMG: HTMLImageElement | null = null;
let atlasLoading: Promise<void> | null = null;

async function decodeAtlas() {
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('角色图集载入失败'));
    img.src = atlasUrl;
  });
  const tex = new THREE.Texture(img);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  ATLAS = tex;
  ATLAS_IMG = img;
}
export function loadAtlas() {
  if (!atlasLoading) {
    atlasLoading = decodeAtlas().catch((error) => {
      atlasLoading = null;
      throw error;
    });
  }
  return atlasLoading;
}

const PX = 1 / 88;
const _v = new THREE.Vector3();
function setUV(g: THREE.BufferGeometry, r: [number, number, number, number]) {
  const u0 = r[0] / ATLAS_W;
  const u1 = (r[0] + r[2]) / ATLAS_W;
  const v1 = 1 - r[1] / ATLAS_H;
  const v0 = 1 - (r[1] + r[3]) / ATLAS_H;
  const uv = g.attributes.uv as THREE.BufferAttribute;
  uv.setXY(0, u0, v1);
  uv.setXY(1, u1, v1);
  uv.setXY(2, u0, v0);
  uv.setXY(3, u1, v0);
  uv.needsUpdate = true;
}
export function hasFrame(k: string) {
  return !!RECTS[k];
}

export class Actor {
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  ch: string;
  act = 'idle';
  t0 = 0;
  key: string | null = null;
  flip = false;
  size: number;
  spin = 0;
  readonly baseSize: number;
  private last = '';
  private w = 1;
  private h = 1;

  constructor(ch: string, size = 1) {
    this.ch = ch;
    this.size = size;
    this.baseSize = size;
    const g = new THREE.PlaneGeometry(1, 1);
    g.translate(0, 0.5, 0);
    const m = new THREE.MeshBasicMaterial({
      map: ATLAS,
      transparent: true,
      alphaTest: 0.06,
      side: THREE.DoubleSide,
      depthWrite: true,
      fog: false,
    });
    this.mesh = new THREE.Mesh(g, m);
    this.mesh.renderOrder = 2;
  }

  play(a: string, t0 = 0) {
    this.act = a;
    this.t0 = t0;
    this.key = null;
    return this;
  }

  cue(t: number, list: [number, string][]) {
    let cur: [number, string] = list[0];
    for (const it of list) if (t >= it[0]) cur = it;
    if (cur[1].includes('_') && hasFrame(cur[1])) this.still(cur[1]);
    else this.play(cur[1], cur[0]);
    return this;
  }

  still(k: string) {
    this.key = k;
    return this;
  }

  at(x: number, y: number, z: number) {
    this.mesh.position.set(x, y, z);
    return this;
  }

  show(v = true) {
    this.mesh.visible = v;
    return this;
  }

  tint(hex: number, op = 1) {
    this.mesh.material.color.setHex(hex);
    this.mesh.material.opacity = op;
    return this;
  }

  frame(t: number): string {
    if (this.key) return this.key;
    const set = ACTIONS[this.ch];
    const a = set?.[this.act] ?? set?.idle ?? set?.float;
    if (!a) throw new Error(`图集缺动作 ${this.ch}:${this.act}`);
    const n = a.f.length;
    let i = Math.floor(Math.max(0, t - this.t0) * a.fps);
    i = a.loop ? i % n : Math.min(n - 1, i);
    return a.f[i];
  }

  update(t: number, cam: THREE.Camera) {
    if (!this.mesh.visible) return;
    const k = this.frame(t);
    if (k !== this.last) {
      const r = RECTS[k];
      if (!r) throw new Error(`图集缺帧 ${k}`);
      setUV(this.mesh.geometry, r);
      this.w = r[2];
      this.h = r[3];
      this.last = k;
    }
    const s = this.size * PX;
    this.mesh.scale.set(this.w * s * (this.flip ? -1 : 1), this.h * s, 1);
    this.mesh.getWorldPosition(_v);
    this.mesh.rotation.set(0, Math.atan2(cam.position.x - _v.x, cam.position.z - _v.z), this.spin);
  }
}

// 贴图小工具
const _tex: Record<string, THREE.Texture> = {};
function canvasTex(id: string, w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, srgb = true) {
  if (_tex[id]) return _tex[id];
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  _tex[id] = t;
  return t;
}

export const glowTex = () =>
  canvasTex(
    'glow',
    64,
    64,
    (g) => {
      const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, 'rgba(255,255,255,1)');
      gr.addColorStop(0.22, 'rgba(255,255,255,0.8)');
      gr.addColorStop(0.55, 'rgba(255,255,255,0.18)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr;
      g.fillRect(0, 0, 64, 64);
    },
    false,
  );

export const bubbleRingTex = () =>
  canvasTex(
    'bubble_ring',
    64,
    64,
    (g) => {
      const gr = g.createRadialGradient(24, 22, 2, 32, 32, 28);
      gr.addColorStop(0, 'rgba(255,255,255,0.12)');
      gr.addColorStop(0.72, 'rgba(180,220,255,0.28)');
      gr.addColorStop(0.92, 'rgba(220,245,255,0.92)');
      gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr;
      g.beginPath();
      g.arc(32, 32, 28, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = 'rgba(255,255,255,0.85)';
      g.beginPath();
      g.arc(22, 20, 4.5, 0, Math.PI * 2);
      g.fill();
    },
    false,
  );

export function glowSprite(color: number, size: number, op = 1) {
  const m = new THREE.SpriteMaterial({
    map: glowTex(),
    color,
    transparent: true,
    opacity: op,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
  });
  const s = new THREE.Sprite(m);
  s.scale.setScalar(size);
  s.renderOrder = 5;
  return s;
}

export function texSprite(tex: THREE.Texture, w: number, h: number, color = 0xffffff, additive = false) {
  const m = new THREE.SpriteMaterial({
    map: tex,
    color,
    transparent: true,
    depthWrite: false,
    fog: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  const s = new THREE.Sprite(m);
  s.scale.set(w, h, 1);
  s.renderOrder = 4;
  return s;
}

export function mat(color: number, o: THREE.MeshStandardMaterialParameters = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, flatShading: true, ...o });
}

export function mesh(g: THREE.BufferGeometry, m: THREE.Material, p: number[] = [0, 0, 0]) {
  const o = new THREE.Mesh(g, m);
  o.position.set(p[0], p[1], p[2]);
  return o;
}

const _up = new THREE.Vector3(0, 1, 0);
export function rod(a: number[], b: number[], r: number, m: THREE.Material) {
  const va = new THREE.Vector3(a[0], a[1], a[2]);
  const vb = new THREE.Vector3(b[0], b[1], b[2]);
  const len = va.distanceTo(vb);
  const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 6), m);
  o.position.copy(va).add(vb).multiplyScalar(0.5);
  o.quaternion.setFromUnitVectors(_up, vb.clone().sub(va).normalize());
  return o;
}

// 粒子系统
export const PUNI = { uH: { value: 600 } };
export class Particles {
  points: THREE.Points;
  pos: Float32Array;
  col: Float32Array;
  size: Float32Array;
  n: number;
  mat: THREE.ShaderMaterial;

  constructor(n: number, o: { size?: number; additive?: boolean; tex?: THREE.Texture } = {}) {
    this.n = n;
    this.pos = new Float32Array(n * 3);
    this.col = new Float32Array(n * 3).fill(1);
    this.size = new Float32Array(n).fill(1);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    g.setAttribute('pcol', new THREE.BufferAttribute(this.col, 3));
    g.setAttribute('psize', new THREE.BufferAttribute(this.size, 1));
    this.mat = new THREE.ShaderMaterial({
      uniforms: { map: { value: o.tex ?? glowTex() }, uScale: { value: o.size ?? 0.1 }, uOpacity: { value: 1 }, uH: PUNI.uH },
      vertexShader: `attribute float psize; attribute vec3 pcol; varying vec3 vC; uniform float uScale; uniform float uH;
        void main(){ vC = pcol; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mv; gl_PointSize = min(psize * uScale * uH / max(0.05, -mv.z), uH * 0.06); }`,
      fragmentShader: `uniform sampler2D map; uniform float uOpacity; varying vec3 vC;
        void main(){ vec4 t = texture2D(map, gl_PointCoord); if (t.a < 0.01) discard; gl_FragColor = vec4(vC * t.rgb, t.a * uOpacity); }`,
      transparent: true,
      depthWrite: false,
      blending: o.additive === false ? THREE.NormalBlending : THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(g, this.mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 6;
  }

  set(i: number, x: number, y: number, z: number, s = -1) {
    this.pos[i * 3] = x;
    this.pos[i * 3 + 1] = y;
    this.pos[i * 3 + 2] = z;
    if (s >= 0) this.size[i] = s;
  }

  color(i: number, c: THREE.Color, k = 1) {
    this.col[i * 3] = c.r * k;
    this.col[i * 3 + 1] = c.g * k;
    this.col[i * 3 + 2] = c.b * k;
  }

  commit() {
    const a = this.points.geometry.attributes;
    (a.position as THREE.BufferAttribute).needsUpdate = true;
    (a.pcol as THREE.BufferAttribute).needsUpdate = true;
    (a.psize as THREE.BufferAttribute).needsUpdate = true;
  }
}

// 深海天穹球
export class Sky {
  mesh: THREE.Mesh;
  u = {
    top: { value: new THREE.Color() },
    mid: { value: new THREE.Color() },
    bot: { value: new THREE.Color() },
    sunDir: { value: new THREE.Vector3(0, 1, -0.2) },
    sunCol: { value: new THREE.Color(0xffffff) },
    sunAmt: { value: 0 },
    hz: { value: 0 },
  };
  constructor() {
    this.mesh = new THREE.Mesh(
      new THREE.SphereGeometry(400, 32, 20),
      new THREE.ShaderMaterial({
        uniforms: this.u,
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        vertexShader: `varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 bot; uniform vec3 sunDir; uniform vec3 sunCol; uniform float sunAmt; uniform float hz; varying vec3 vD;
          void main(){ vec3 d = normalize(vD); float h = d.y;
            vec3 c = h > hz ? mix(mid, top, pow(clamp((h - hz) / (1.0 - hz), 0.0, 1.0), 0.55)) : mix(mid, bot, pow(clamp((hz - h) * 2.5, 0.0, 1.0), 0.7));
            float s = max(dot(d, normalize(sunDir)), 0.0);
            c += sunCol * sunAmt * (smoothstep(0.9990, 0.9994, s) * 1.4 + pow(s, 20.0) * 0.45 + pow(s, 4.0) * 0.16);
            gl_FragColor = vec4(c, 1.0); }`,
      }),
    );
    this.mesh.renderOrder = -10;
    this.mesh.frustumCulled = false;
  }
  set(top: number, mid: number, bot: number, hz = 0) {
    this.u.top.value.setHex(top);
    this.u.mid.value.setHex(mid);
    this.u.bot.value.setHex(bot);
    this.u.hz.value = hz;
    return this;
  }
  sun(dir: number[], col: number, amt: number) {
    this.u.sunDir.value.set(dir[0], dir[1], dir[2]);
    this.u.sunCol.value.setHex(col);
    this.u.sunAmt.value = amt;
    return this;
  }
}

const _cc = new Map<number, THREE.Color>();
export const C = (hex: number) => {
  let c = _cc.get(hex);
  if (!c) {
    c = new THREE.Color(hex);
    _cc.set(hex, c);
  }
  return c;
};
