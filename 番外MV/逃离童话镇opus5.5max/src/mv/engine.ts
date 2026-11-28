import * as THREE from 'three';
import atlasUrl from '../assets/cast_atlas.png';
import atlasJson from './cast_atlas.json';
import actionsJson from './cast_actions.json';

/* ───────────── 节拍（实测：117.5 BPM，乐句强拍 k≡7 mod 8） ───────────── */
export const BEAT = 0.51064;
export const T0 = 0.495;
export const bt = (k: number) => T0 + k * BEAT;
export const beatPulse = (t: number, sharp = 5) => {
  const x = ((t - T0) / BEAT) % 1;
  return Math.exp(-(x < 0 ? x + 1 : x) * sharp);
};
export const beatInfo = (t: number) => {
  const rel = (t - T0) / BEAT;
  const idx = Math.floor(rel);
  const phase = rel - idx;
  return { idx, phase, pulse: Math.exp(-(phase < 0 ? phase + 1 : phase) * 5), down: ((idx % 4) + 4) % 4 === 3, len: BEAT };
};

/* ───────────── 数学 ───────────── */
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const eo = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
export const ei = (x: number) => Math.pow(clamp(x), 3);
export const eio = (x: number) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
export const ease = (x: number) => { const t = clamp(x); return t * t * t * (t * (t * 6 - 15) + 10); };
export const back = (x: number) => { x = clamp(x); const c = 2.2; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
export const elastic = (x: number) => { x = clamp(x); return x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -9 * x) * Math.sin((x * 8 - 0.75) * 2.1) + 1; };
export const hit = (t: number, at: number, dur = 0.35) => (t < at ? 0 : Math.max(0, 1 - (t - at) / dur));
export const pop = (t: number, at: number, dur = 0.28) => back(seg(t, at, at + dur));
export const rnd = (i: number) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
export const many = <T,>(n: number, f: (i: number) => T): T[] => Array.from({ length: n }, (_, i) => f(i));
export function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const rgb = (hex: number) => new THREE.Vector3(((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255);
export const TAU = Math.PI * 2;
export const PI = Math.PI;
export const INK = 0x0b0a0c;
export const timeU = { value: 0 };

/* ───────────── 《童话镇》3D 天光预设 + 叛逆篇章光色 ───────────── */
export interface Look {
  top: number; hor: number; fog: [number, number]; sun: number; sunI: number; dir: [number, number, number];
  amb: number; ambI: number; card: number; stars: number;
}
export const LOOKS = {
  day: { top: 0x3e86de, hor: 0xbfe0f7, fog: [45, 340], sun: 0xfff2d2, sunI: 2.5, dir: [0.5, 0.8, 0.5], amb: 0xbcd0ff, ambI: 1.6, card: 0xffffff, stars: 0 },
  golden: { top: 0xf2915f, hor: 0xffd9a0, fog: [35, 280], sun: 0xffb36b, sunI: 2.8, dir: [-0.7, 0.36, 0.35], amb: 0x8f7fd0, ambI: 1.4, card: 0xffe8cf, stars: 0 },
  dusk: { top: 0x7d3a94, hor: 0xff8f6b, fog: [40, 300], sun: 0xffa27a, sunI: 2.4, dir: [0.6, 0.4, 0.5], amb: 0x8f6fd8, ambI: 1.5, card: 0xffe0d6, stars: 0.35 },
  forest: { top: 0x173f45, hor: 0x4f8a6a, fog: [11, 68], sun: 0xd8ffb0, sunI: 1.9, dir: [0.3, 0.9, 0.3], amb: 0x4f8a78, ambI: 1.35, card: 0xcfe8d4, stars: 0 },
  night: { top: 0x0a1036, hor: 0x39408f, fog: [30, 230], sun: 0xb4c8ff, sunI: 2.1, dir: [-0.4, 0.75, 0.5], amb: 0x5f6ac8, ambI: 1.7, card: 0xd4dcff, stars: 1 },
  magic: { top: 0x2c1763, hor: 0xb960d6, fog: [25, 200], sun: 0xf3b6ff, sunI: 2.0, dir: [0.4, 0.7, 0.6], amb: 0x7a5fd8, ambI: 1.5, card: 0xf0dcff, stars: 0.7 },
  sea: { top: 0x0d4f8f, hor: 0x2aa3c8, fog: [5, 52], sun: 0xb8f2ff, sunI: 1.9, dir: [0.1, 1, 0.2], amb: 0x3a9fd0, ambI: 1.7, card: 0xc4ecff, stars: 0 },
  cave: { top: 0x0a0206, hor: 0x2a060e, fog: [7, 46], sun: 0xff7080, sunI: 2.0, dir: [0.2, 0.9, 0.6], amb: 0x552236, ambI: 1.0, card: 0xf2ced6, stars: 0 },
  stage: { top: 0x160d1c, hor: 0x5a1842, fog: [20, 120], sun: 0xffe2b0, sunI: 2.6, dir: [0.2, 0.8, 0.8], amb: 0x7a5568, ambI: 1.3, card: 0xfff0dc, stars: 0 },
  savanna: { top: 0xd9481c, hor: 0xffb35a, fog: [35, 260], sun: 0xffd9a0, sunI: 2.7, dir: [-0.5, 0.5, 0.5], amb: 0xd07050, ambI: 1.4, card: 0xffe0c4, stars: 0 },
  crimson: { top: 0x240207, hor: 0x9e0a16, fog: [24, 180], sun: 0xffd8d8, sunI: 2.4, dir: [0.3, 0.8, 0.7], amb: 0x90202e, ambI: 1.5, card: 0xffeef0, stars: 0.35 },
  magenta: { top: 0x380428, hor: 0xe61082, fog: [26, 200], sun: 0xffffff, sunI: 2.4, dir: [0.2, 0.8, 0.8], amb: 0xc84090, ambI: 1.6, card: 0xffffff, stars: 0.2 },
  afterRain: { top: 0x5fb0ee, hor: 0xffd9c0, fog: [45, 340], sun: 0xfff4d6, sunI: 2.6, dir: [0.5, 0.75, 0.5], amb: 0xd4ccff, ambI: 1.7, card: 0xffffff, stars: 0.2 },
} satisfies Record<string, Look>;
export type LookName = keyof typeof LOOKS;

/* ───────────── 二值卡通材质 & 墨线外壳（源自《童话镇》kit.ts） ───────────── */
let grad: THREE.DataTexture | null = null;
function gradMap() {
  if (!grad) {
    grad = new THREE.DataTexture(new Uint8Array([92, 92, 180, 255]), 4, 1, THREE.RedFormat);
    grad.minFilter = grad.magFilter = THREE.NearestFilter;
    grad.needsUpdate = true;
  }
  return grad;
}
const toonCache = new Map<number, THREE.MeshToonMaterial>();
export function toon(color: number): THREE.MeshToonMaterial {
  let m = toonCache.get(color);
  if (!m) { m = new THREE.MeshToonMaterial({ color, gradientMap: gradMap() }); toonCache.set(color, m); }
  return m;
}
export function faceted<T extends THREE.BufferGeometry>(g: T): THREE.BufferGeometry {
  const n = g.index ? g.toNonIndexed() : g;
  n.computeVertexNormals();
  return n;
}
export const toonMap = (map: THREE.Texture) => new THREE.MeshToonMaterial({ map, gradientMap: gradMap() });
const basicCache = new Map<number, THREE.MeshBasicMaterial>();
export function basic(color: number): THREE.MeshBasicMaterial {
  let m = basicCache.get(color);
  if (!m) { m = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }); basicCache.set(color, m); }
  return m;
}
export const glowMat = (color: number, opacity = 1, additive = false) =>
  new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide, fog: !additive, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending });

const inkMat = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });
export function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, ink = 0.045): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat);
  if (ink > 0) {
    geo.computeBoundingBox();
    const bb = geo.boundingBox!, size = new THREE.Vector3(), c = new THREE.Vector3();
    bb.getSize(size); bb.getCenter(c);
    const hull = new THREE.Mesh(geo, inkMat);
    const sx = size.x > 1e-3 ? 1 + (2 * ink) / size.x : 1;
    const sy = size.y > 1e-3 ? 1 + (2 * ink) / size.y : 1;
    const sz = size.z > 1e-3 ? 1 + (2 * ink) / size.z : 1;
    hull.scale.set(sx, sy, sz);
    hull.position.set(c.x * (1 - sx), c.y * (1 - sy), c.z * (1 - sz));
    m.add(hull);
  }
  return m;
}

export const box = (w: number, h: number, d: number, color: number, ink = 0.045) => {
  const g = new THREE.BoxGeometry(w, h, d); g.translate(0, h / 2, 0); return mesh(g, toon(color), ink);
};
export const cyl = (rt: number, rb: number, h: number, color: number, segs = 14, ink = 0.045) => {
  const g = new THREE.CylinderGeometry(rt, rb, h, segs); g.translate(0, h / 2, 0); return mesh(segs < 8 ? faceted(g) : g, toon(color), ink);
};
export const cone = (r: number, h: number, color: number, segs = 12, ink = 0.045) => {
  const g = new THREE.ConeGeometry(r, h, segs); if (segs === 4) g.rotateY(PI / 4); g.translate(0, h / 2, 0); return mesh(segs < 8 ? faceted(g) : g, toon(color), ink);
};
export const ball = (r: number, color: number, flat = false, ink = 0.045) =>
  mesh(flat ? faceted(new THREE.IcosahedronGeometry(r, 1)) : new THREE.SphereGeometry(r, 18, 12), toon(color), ink);
export const roof = (w: number, d: number, h: number, color: number) => {
  const g = new THREE.ConeGeometry(1, h, 4); g.rotateY(PI / 4); g.scale(w * 0.82, 1, d * 0.82); g.translate(0, h / 2, 0);
  return mesh(faceted(g), toon(color), 0.05);
};
export const disc = (r: number, color: number, y = 0) => {
  const g = new THREE.CircleGeometry(r, 48); g.rotateX(-PI / 2); g.translate(0, y, 0); return new THREE.Mesh(g, toon(color));
};
export function put<T extends THREE.Object3D>(parent: THREE.Object3D, o: T, x = 0, y = 0, z = 0, ry = 0, s = 1): T {
  o.position.set(x, y, z); o.rotation.y = ry; if (s !== 1) o.scale.multiplyScalar(s); parent.add(o); return o;
}
export function setOp(o: THREE.Object3D, a: number) {
  const alpha = clamp(a);
  if ((o as THREE.Sprite).isSprite) { (o as THREE.Sprite).material.opacity = alpha; o.visible = alpha > 0.01; return; }
  o.traverse(x => {
    const m = (x as THREE.Mesh).material as THREE.Material | undefined;
    if (m && m !== inkMat) { m.transparent = true; m.opacity = alpha; }
  });
  o.visible = alpha > 0.01;
}

/* ───────────── Canvas 贴图 & 粒子贴片（源自《童话镇》） ───────────── */
export function canvasTex(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void, srgb = true): THREE.CanvasTexture {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  draw(cv.getContext('2d')!);
  const t = new THREE.CanvasTexture(cv);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

export type FxName = 'star' | 'glow' | 'heart' | 'note' | 'bubble' | 'butterfly' | 'zzz' | 'petal' | 'wolf' | 'smoke' | 'ring' | 'drop' | 'leaf';
const fxCache = new Map<string, THREE.Texture>();
export function fxTex(name: FxName): THREE.Texture {
  const hit = fxCache.get(name);
  if (hit) return hit;
  const S = name === 'wolf' ? 128 : 64;
  const t = canvasTex(S, S, (c) => {
    const radial = (stops: [number, string][], r = S / 2) => {
      const g = c.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, r);
      stops.forEach(([o, col]) => g.addColorStop(o, col)); c.fillStyle = g; c.fillRect(0, 0, S, S);
    };
    if (name === 'glow') radial([[0, 'rgba(255,255,255,1)'], [0.35, 'rgba(255,255,255,.5)'], [1, 'rgba(255,255,255,0)']]);
    else if (name === 'smoke') radial([[0, 'rgba(255,255,255,.85)'], [0.6, 'rgba(255,255,255,.35)'], [1, 'rgba(255,255,255,0)']]);
    else if (name === 'star') {
      radial([[0, 'rgba(255,255,255,1)'], [0.3, 'rgba(255,244,190,.5)'], [1, 'rgba(255,220,120,0)']]);
      c.translate(32, 32); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(0, -30);
      c.quadraticCurveTo(3, -3, 30, 0); c.quadraticCurveTo(3, 3, 0, 30); c.quadraticCurveTo(-3, 3, -30, 0); c.quadraticCurveTo(-3, -3, 0, -30); c.fill();
    } else if (name === 'heart') {
      c.translate(32, 34); c.beginPath(); c.moveTo(0, 20); c.bezierCurveTo(-36, -4, -18, -32, 0, -10); c.bezierCurveTo(18, -32, 36, -4, 0, 20);
      c.fillStyle = '#ff5c8a'; c.fill(); c.lineWidth = 4; c.strokeStyle = '#3a1028'; c.stroke();
      c.fillStyle = 'rgba(255,255,255,.8)'; c.beginPath(); c.ellipse(-10, -10, 5, 3, -0.6, 0, 7); c.fill();
    } else if (name === 'note') {
      c.strokeStyle = '#14213d'; c.fillStyle = '#7fe3ff'; c.lineWidth = 4; c.lineJoin = 'round';
      c.beginPath(); c.moveTo(33, 44); c.lineTo(33, 10); c.lineTo(52, 18); c.lineTo(52, 30); c.lineTo(33, 22); c.closePath(); c.fill(); c.stroke();
      c.beginPath(); c.ellipse(23, 46, 11, 8, -0.4, 0, 7); c.fill(); c.stroke();
    } else if (name === 'bubble') {
      c.beginPath(); c.arc(32, 32, 26, 0, 7); c.fillStyle = 'rgba(190,235,255,.22)'; c.fill(); c.lineWidth = 3.5; c.strokeStyle = 'rgba(235,250,255,.95)'; c.stroke();
      c.beginPath(); c.arc(32, 32, 18, 3.5, 4.6); c.lineWidth = 4.5; c.strokeStyle = '#fff'; c.stroke();
    } else if (name === 'ring') {
      c.beginPath(); c.arc(32, 32, 27, 0, 7); c.lineWidth = 4; c.strokeStyle = '#fff'; c.stroke();
    } else if (name === 'butterfly') {
      c.translate(32, 32); c.lineWidth = 3; c.strokeStyle = '#3a1f10';
      for (const s of [-1, 1]) {
        c.fillStyle = '#ffd166'; c.beginPath(); c.ellipse(s * 14, -7, 13, 10, s * 0.5, 0, 7); c.fill(); c.stroke();
        c.fillStyle = '#ff8fb3'; c.beginPath(); c.ellipse(s * 10, 11, 9, 7, -s * 0.5, 0, 7); c.fill(); c.stroke();
      }
      c.fillStyle = '#3a1f10'; c.fillRect(-2, -13, 4, 28);
    } else if (name === 'zzz') {
      c.lineWidth = 8; c.lineJoin = 'round'; c.strokeStyle = '#14213d'; c.fillStyle = '#bfe3ff';
      c.beginPath();
      ([[16, 13], [49.1, 13], [49.1, 19.1], [28, 44.4], [49.7, 44.4], [49.7, 52], [15.4, 52], [15.4, 45.9], [36.6, 20.6], [16, 20.6]] as const)
        .forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
      c.closePath(); c.stroke(); c.fill();
    } else if (name === 'petal') {
      c.translate(32, 32); c.rotate(0.6); c.fillStyle = '#ffb3cf'; c.beginPath(); c.ellipse(0, 0, 22, 11, 0, 0, 7); c.fill();
      c.fillStyle = '#ff7fae'; c.beginPath(); c.ellipse(8, 0, 9, 5, 0, 0, 7); c.fill();
    } else if (name === 'leaf') {
      c.translate(32, 32); c.rotate(-0.5); c.fillStyle = '#5fd06a'; c.beginPath(); c.ellipse(0, 0, 24, 11, 0, 0, 7); c.fill();
      c.strokeStyle = '#1f6b3a'; c.lineWidth = 3; c.stroke(); c.beginPath(); c.moveTo(-22, 0); c.lineTo(22, 0); c.stroke();
    } else if (name === 'drop') {
      radial([[0, 'rgba(255,255,255,1)'], [0.55, 'rgba(170,225,255,.95)'], [0.8, 'rgba(120,190,255,.6)'], [1, 'rgba(120,190,255,0)']], 28);
    } else if (name === 'wolf') {
      c.fillStyle = '#120e1f'; c.beginPath();
      const p: [number, number][] = [[18, 126], [22, 66], [12, 12], [42, 40], [58, 36], [74, 4], [78, 42], [116, 56], [84, 72], [114, 86], [76, 94], [62, 126]];
      p.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
      c.closePath(); c.fill();
      c.fillStyle = '#ff2d4a'; c.beginPath(); c.ellipse(62, 54, 6, 3.5, -0.3, 0, 7); c.fill();
    }
  });
  fxCache.set(name, t);
  return t;
}
export function sprite3D(name: FxName, size = 1, color = 0xffffff, additive = false, opacity = 1): THREE.Sprite {
  const m = new THREE.SpriteMaterial({
    map: fxTex(name), color, transparent: true, opacity, depthWrite: false, fog: !additive,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  const s = new THREE.Sprite(m);
  s.scale.set(size, size, 1);
  return s;
}

/* ───────────── 建筑立面贴图 + 七彩河水面着色器 + 天空穹顶 ───────────── */
const facadeCache = new Map<number, THREE.Texture>();
const css = (hex: number) => `#${hex.toString(16).padStart(6, '0')}`;
export function facadeTex(wall: number): THREE.Texture {
  let t = facadeCache.get(wall);
  if (t) return t;
  t = canvasTex(64, 64, (c) => {
    c.fillStyle = css(wall); c.fillRect(0, 0, 64, 64);
    c.fillStyle = 'rgba(40,20,30,.16)'; c.fillRect(0, 54, 64, 10); c.fillRect(0, 0, 64, 4);
    c.fillStyle = 'rgba(255,255,255,.12)'; for (let i = 0; i < 5; i++) c.fillRect(4 + ((i * 23) % 50), 8 + ((i * 17) % 38), 9, 2);
    for (const x of [8, 42]) {
      c.fillStyle = '#2a1c2e'; c.fillRect(x - 2, 12, 18, 20);
      c.fillStyle = '#ffe9a8'; c.fillRect(x, 14, 14, 16);
      c.fillStyle = '#2a1c2e'; c.fillRect(x + 6, 14, 2, 16); c.fillRect(x, 21, 14, 2);
    }
    c.fillStyle = '#2a1c2e'; c.fillRect(24, 34, 16, 30); c.fillStyle = '#8a5236'; c.fillRect(26, 36, 12, 28);
    c.fillStyle = '#ffd166'; c.fillRect(35, 50, 2, 3);
  });
  facadeCache.set(wall, t);
  return t;
}

export function waterMat(rainbow = 1, base = 0x35a7e8, deep = 0x1f6fc4): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide, fog: true,
    uniforms: {
      uTime: timeU, uRainbow: { value: rainbow }, uBase: { value: rgb(base) }, uDeep: { value: rgb(deep) },
      fogColor: { value: new THREE.Color() }, fogNear: { value: 1 }, fogFar: { value: 1000 },
    },
    vertexShader: `varying vec2 vUv;
#include <fog_pars_vertex>
void main(){ vUv = uv; vec4 mvPosition = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`,
    fragmentShader: `uniform float uTime; uniform float uRainbow; uniform vec3 uBase; uniform vec3 uDeep; varying vec2 vUv;
#include <fog_pars_fragment>
vec3 band(float i){
  if(i<0.5) return vec3(0.96,0.30,0.36); if(i<1.5) return vec3(1.0,0.60,0.22); if(i<2.5) return vec3(1.0,0.87,0.32);
  if(i<3.5) return vec3(0.42,0.84,0.42); if(i<4.5) return vec3(0.26,0.80,0.94); if(i<5.5) return vec3(0.33,0.52,0.96); return vec3(0.68,0.45,0.92);
}
void main(){
  float u = vUv.x + 0.03*sin(vUv.y*0.9 - uTime*1.6);
  float i = floor(clamp(u,0.0,0.999)*7.0);
  float f = fract(clamp(u,0.0,0.999)*7.0);
  float dash = step(0.84, fract(vUv.y*0.2 - uTime*0.6 + i*0.37)) * step(0.3,f) * step(f,0.7);
  vec3 rb = band(i) + dash*0.32;
  vec3 water = mix(uBase, uDeep, smoothstep(0.0,0.5,abs(vUv.x-0.5)));
  water += 0.22*step(0.88, fract(vUv.y*0.28 - uTime*0.5 + floor(vUv.x*5.0)*0.41));
  vec3 col = mix(water, rb, uRainbow);
  float foam = step(vUv.x,0.03) + step(0.97,vUv.x);
  col = mix(col, vec3(1.0), clamp(foam,0.0,1.0)*0.92);
  gl_FragColor = vec4(col,1.0);
#include <fog_fragment>
}`,
  });
}

export function ribbon(curve: THREE.Curve<THREE.Vector3>, width: number, segs: number, mat: THREE.Material, y = 0.06): THREE.Mesh {
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  let dist = 0; let prev: THREE.Vector3 | null = null;
  for (let i = 0; i <= segs; i++) {
    const u = i / segs;
    const p = curve.getPointAt(u), tan = curve.getTangentAt(u);
    const n = new THREE.Vector3(-tan.z, 0, tan.x).normalize().multiplyScalar(width / 2);
    if (prev) dist += p.distanceTo(prev);
    prev = p;
    pos.push(p.x + n.x, p.y + y, p.z + n.z, p.x - n.x, p.y + y, p.z - n.z);
    uv.push(0, dist, 1, dist);
    if (i < segs) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}

export function makeSky(): THREE.Mesh {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
    uniforms: { top: { value: new THREE.Vector3() }, hor: { value: new THREE.Vector3() }, low: { value: new THREE.Vector3() } },
    vertexShader: `varying vec3 vDir; void main(){ vDir = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 top; uniform vec3 hor; uniform vec3 low; varying vec3 vDir;
void main(){ float y = normalize(vDir).y; vec3 c = y > 0.0 ? mix(hor, top, pow(y, 0.55)) : mix(hor, low, pow(min(-y*5.0,1.0), 0.7)); gl_FragColor = vec4(c,1.0); }`,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(600, 24, 16), mat);
  m.renderOrder = -10; m.frustumCulled = false;
  return m;
}
export function makeStars(): THREE.Points {
  const pos: number[] = [];
  for (let i = 0; i < 520; i++) {
    const a = rnd(i * 1.7) * TAU, e = Math.asin(0.04 + rnd(i * 3.1 + 5) * 0.94), r = 560;
    pos.push(Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, Math.sin(a) * Math.cos(e) * r);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const p = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 2.6, sizeAttenuation: false, depthTest: false, depthWrite: false, fog: false }));
  p.renderOrder = -9; p.frustumCulled = false;
  return p;
}

/* ───────────── 三维空间字体牌（支持立体阴影与卡点砸入） ───────────── */
export const FONT = {
  brush: '"MV Brush","Ma Shan Zheng","KaiTi","STKaiti",serif',
  cute: '"MV Cute","ZCOOL KuaiLe","PingFang SC","Microsoft YaHei",sans-serif',
  hei: '"MV Hei","ZCOOL QingKe HuangYou","PingFang SC","Microsoft YaHei",sans-serif',
  serif: '"MV Serif","Noto Serif SC","Songti SC","SimSun",serif',
};
export interface TxtOpt { font?: string; color?: string; stroke?: string; sw?: number; vertical?: boolean; px?: number; sp?: number; weight?: string; rough?: boolean; depth?: boolean }
export function txt(s: string, h: number, o: TxtOpt = {}) {
  const px = o.px ?? 150, font = `${o.weight ?? '400'} ${px}px ${o.font ?? FONT.brush}`;
  const cv0 = document.createElement('canvas'); cv0.width = 4; cv0.height = 4; const g0 = cv0.getContext('2d')!; g0.font = font;
  const chars = [...s];
  const sp = (o.sp ?? 0) * px, pad = px * 0.28 + (o.sw ?? 0) * px;
  const ws = chars.map(c => g0.measureText(c).width);
  let W: number, H: number;
  if (o.vertical) { W = px + pad * 2; H = chars.length * px * 1.02 + sp * (chars.length - 1) + pad * 2; }
  else { W = ws.reduce((a, b) => a + b, 0) + sp * (chars.length - 1) + pad * 2; H = px * 1.2 + pad * 2; }
  const c = document.createElement('canvas'); c.width = Math.ceil(W); c.height = Math.ceil(H); const g = c.getContext('2d')!;
  g.font = font; g.textBaseline = 'middle'; g.textAlign = 'center'; g.lineJoin = 'round';
  let x = pad, y = pad;
  chars.forEach((ch, i) => {
    const cx = o.vertical ? W / 2 : x + ws[i] / 2, cy = o.vertical ? y + px * 0.51 : H / 2;
    if (o.stroke) { g.strokeStyle = o.stroke; g.lineWidth = (o.sw ?? 0.08) * px * 2; g.strokeText(ch, cx, cy); }
    g.fillStyle = o.color ?? '#fff'; g.fillText(ch, cx, cy);
    if (o.vertical) y += px * 1.02 + sp; else x += ws[i] + sp;
  });
  if (o.rough) {
    g.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < (W * H) / 950; i++) {
      g.fillStyle = `rgba(0,0,0,${0.25 + rnd(i) * 0.45})`;
      g.fillRect(rnd(i * 3.1) * W, rnd(i * 5.3) * H, 2 + rnd(i * 7.7) * px * 0.14, 1 + rnd(i * 9.1) * 2.5);
    }
  }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const k = h / px;
  const mesh0 = new THREE.Mesh(new THREE.PlaneGeometry(W * k, H * k),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  mesh0.renderOrder = 22;
  if (o.depth !== false) {
    const back0 = new THREE.Mesh(new THREE.PlaneGeometry(W * k, H * k),
      new THREE.MeshBasicMaterial({ map: tex, color: 0x090408, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide, fog: false }));
    back0.position.set(0.06, -0.06, -0.08);
    back0.renderOrder = 21;
    mesh0.add(back0);
  }
  mesh0.userData.w = W * k; mesh0.userData.h = H * k;
  return mesh0;
}
export function slam(o: THREE.Object3D, t: number, a: number, s = 1, dur = 0.22, from = 2.4) {
  if (t < a) { o.visible = false; return 0; }
  o.visible = true;
  const p = seg(t, a, a + dur);
  const k = lerp(from, 1, eo(p)) * (1 + 0.06 * Math.sin(p * PI));
  o.scale.setScalar(s * k);
  const op = clamp(p * 4);
  const m = (o as THREE.Mesh).material as THREE.Material | undefined;
  if (m) { m.transparent = true; m.opacity = op; }
  return 1 - p;
}

/* ───────────── 分支官方图集 + 像素角色 + 服饰叠层（源自《童话镇》actors.ts） ───────────── */
export type CharId = 'whale' | 'gpt' | 'claude' | 'doubao' | 'gemini' | 'kimi' | 'qwen' | 'zai';
export type Wear = 'crown' | 'hood' | 'tophat' | 'bow' | 'tiara' | 'ears' | 'tail';
type Rect = [number, number, number, number];
interface Anchor { cx: number; top: number; hw: number }
interface ActionMeta { label: string; fps: number; loop: boolean; frames: string[]; fx: string | null; size: [number, number] }
export interface AtlasData { tex: THREE.Texture; w: number; h: number; rects: Record<string, Rect>; anchors: Record<string, Anchor> }

const ATLAS_META = atlasJson as unknown as { w: number; h: number; s: Record<string, Rect> };
const ACT_FILE = actionsJson as unknown as { actions: Record<CharId, Record<string, ActionMeta>>; props: string[]; fx: Record<string, string[]> };
export const ACTIONS = ACT_FILE.actions;
export const FX = ACT_FILE.fx;

const PX = 0.0195;
const M = 48;
const WHALE_PIXEL_SMOOTHING = 0.28;
const scaleFor = (key: string) => (key.startsWith('whale_big') ? 0.6 : key.startsWith('gpt_boss') || (key.startsWith('act_gpt_') && !key.startsWith('act_gpt_hover_')) ? 0.58 : 1);

export const CAST_SETS: Record<CharId, { walk: string; front: [string, string] }> = {
  whale: { walk: 'walk_whale_', front: ['whale_idle', 'whale_blink'] },
  claude: { walk: 'walk_claude_', front: ['claude_front_0', 'claude_front_1'] },
  kimi: { walk: 'walk_kimi_', front: ['kimi_front_0', 'kimi_front_1'] },
  gemini: { walk: 'walk_gemini_', front: ['gemini_front_0', 'gemini_front_1'] },
  qwen: { walk: 'walk_qwen_', front: ['qwen_front_0', 'qwen_front_1'] },
  zai: { walk: 'walk_zai_', front: ['zai_front_0', 'zai_front_1'] },
  doubao: { walk: 'walk_doubao_big_', front: ['doubao_cage_0', 'doubao_cage_1'] },
  gpt: { walk: 'gpt_fly_', front: ['gpt_boss_idle', 'gpt_boss_blink'] },
};
function framesIn(prefix: string): number {
  let n = 0; while (ATLAS_META.s[`${prefix}${n}`]) n++; return n;
}
const WALK_N = Object.fromEntries(Object.entries(CAST_SETS).map(([id, s]) => [id, framesIn(s.walk)])) as Record<CharId, number>;
const cycleIndex = (i: number, n: number) => ((Math.floor(i) % n) + n) % n;

let atlasData: AtlasData | null = null;
export function getAtlas() { return atlasData!; }
export function loadAtlas(): Promise<AtlasData> {
  if (atlasData) return Promise.resolve(atlasData);
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
      const c = cv.getContext('2d', { willReadFrequently: true })!; c.drawImage(img, 0, 0);
      const data = c.getImageData(0, 0, img.width, img.height).data;
      const anchors: Record<string, Anchor> = {};
      for (const [key, r] of Object.entries(ATLAS_META.s)) {
        const [x0, y0, w, h] = r;
        let top = -1, minX = w, maxX = 0;
        for (let y = 0; y < h && (top < 0 || y < top + h * 0.3); y++) {
          for (let x = 0; x < w; x++) {
            if (data[((y0 + y) * img.width + x0 + x) * 4 + 3] > 128) {
              if (top < 0) top = y; if (x < minX) minX = x; if (x > maxX) maxX = x;
            }
          }
        }
        anchors[key] = { cx: (minX + maxX) / 2, top: Math.max(0, top), hw: Math.max(8, maxX - minX) };
      }
      const tex = new THREE.Texture(img);
      tex.flipY = false; tex.generateMipmaps = false; tex.premultiplyAlpha = false;
      tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.NearestFilter; tex.needsUpdate = true;
      atlasData = { tex, w: img.width, h: img.height, rects: ATLAS_META.s, anchors };
      res(atlasData);
    };
    img.onerror = () => rej(new Error(`角色图集加载失败：${atlasUrl}`));
    img.src = atlasUrl;
  });
}

export function pixelMat(tex: THREE.Texture, tw: number, th: number, soft = 0): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide, transparent: true, depthWrite: true,
    uniforms: {
      map: { value: tex }, texSize: { value: new THREE.Vector2(tw, th) }, rect: { value: new THREE.Vector4(0, 0, tw, th) },
      flip: { value: 0 }, tint: { value: new THREE.Vector3(1, 1, 1) }, sil: { value: 0 }, silColor: { value: rgb(0x120e1f) },
      flash: { value: 0 }, alpha: { value: 1 }, cut: { value: 2 }, soft: { value: soft },
      fogColor: { value: new THREE.Color() }, fogNear: { value: 1 }, fogFar: { value: 1000 },
    },
    vertexShader: `varying vec2 vUv;
#include <fog_pars_vertex>
void main(){ vUv = uv; vec4 mvPosition = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mvPosition;
#include <fog_vertex>
}`,
    fragmentShader: `uniform sampler2D map; uniform vec2 texSize; uniform vec4 rect; uniform float flip; uniform vec3 tint;
uniform float sil; uniform vec3 silColor; uniform float flash; uniform float alpha; uniform float cut; uniform float soft; varying vec2 vUv;
#include <fog_pars_fragment>
void main(){
  if (1.0 - vUv.y > cut) discard;
  vec2 uv = vUv; if (flip > 0.5) uv.x = 1.0 - uv.x;
  vec2 pix = rect.xy + vec2(uv.x, 1.0 - uv.y) * rect.zw;
  vec2 seam = floor(pix + 0.5);
  vec2 d = max(fwidth(pix), vec2(0.0001));
  pix = seam + clamp((pix - seam) / d, -0.5, 0.5);
  pix = clamp(pix, rect.xy + 0.5, rect.xy + rect.zw - 0.5);
  vec4 c = texture2D(map, pix / texSize);
  if (c.a < 0.5) discard;
  if (soft > 0.001) {
    vec2 lo = rect.xy + 0.5, hi = rect.xy + rect.zw - 0.5;
    vec4 l = texture2D(map, clamp(pix + vec2(-1.0, 0.0), lo, hi) / texSize);
    vec4 r = texture2D(map, clamp(pix + vec2( 1.0, 0.0), lo, hi) / texSize);
    vec4 u = texture2D(map, clamp(pix + vec2(0.0, -1.0), lo, hi) / texSize);
    vec4 dn = texture2D(map, clamp(pix + vec2(0.0,  1.0), lo, hi) / texSize);
    c.rgb = mix(c.rgb, (c.rgb * 2.0 + l.rgb + r.rgb + u.rgb + dn.rgb) / 6.0, soft);
  }
  float outA = c.a * alpha;
  if (outA < 0.004) discard;
  if (alpha < 0.999) { float n = fract(sin(dot(floor(gl_FragCoord.xy), vec2(12.9898, 78.233))) * 43758.5453); if (n > alpha) discard; }
  vec3 col = c.rgb;
  float eye = step(0.62, col.r) * step(col.g, 0.4) * step(col.b, 0.5);
  col *= tint;
  col = mix(col, mix(silColor, vec3(1.0, 0.16, 0.22), eye), sil);
  col = mix(col, vec3(1.0), flash);
  gl_FragColor = vec4(col, outA);
#include <fog_fragment>
}`,
  });
}

type Ctx = CanvasRenderingContext2D;
const R = (c: Ctx, col: string, x: number, y: number, w: number, h: number) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
const WEAR: Record<Wear, { back: boolean; draw: (c: Ctx, a: Anchor, w: number, h: number) => void }> = {
  crown: { back: false, draw: (c, a) => {
    const x = Math.round(a.cx) + M, y = a.top + M + 3;
    R(c, '#7a4a12', x - 7, y - 9, 15, 10); R(c, '#ffd166', x - 6, y - 4, 13, 4);
    R(c, '#ffd166', x - 6, y - 7, 3, 3); R(c, '#fff3b0', x - 1, y - 8, 3, 4); R(c, '#ffd166', x + 4, y - 7, 3, 3);
    R(c, '#e63946', x - 1, y - 3, 3, 2); R(c, '#d9822b', x - 6, y - 1, 13, 1);
  } },
  tiara: { back: false, draw: (c, a) => {
    const x = Math.round(a.cx) + M, y = a.top + M + 4;
    R(c, '#5a6988', x - 6, y - 3, 13, 4); R(c, '#eef6ff', x - 5, y - 2, 11, 2); R(c, '#2ce8f5', x - 1, y - 5, 3, 4); R(c, '#ffffff', x, y - 4, 1, 1);
  } },
  tophat: { back: false, draw: (c, a) => {
    const x = Math.round(a.cx) + M, y = a.top + M + 5;
    R(c, '#1c0f2e', x - 12, y - 4, 25, 5); R(c, '#1c0f2e', x - 8, y - 18, 17, 15);
    R(c, '#6a35a8', x - 7, y - 17, 15, 13); R(c, '#8a55c8', x - 6, y - 16, 3, 11); R(c, '#ffd166', x - 7, y - 7, 15, 3);
    R(c, '#4a2380', x - 11, y - 3, 23, 3); R(c, '#fff3b0', x + 3, y - 15, 3, 4);
  } },
  bow: { back: false, draw: (c, a) => {
    const x = Math.round(a.cx) + M, y = a.top + M + 1;
    for (let i = 0; i < 7; i++) { R(c, '#0a5f8f', x - 2 - i, y - 4 - i, 1, 2 * i + 3); R(c, '#0a5f8f', x + 2 + i, y - 4 - i, 1, 2 * i + 3); }
    for (let i = 0; i < 6; i++) { R(c, '#2ce8f5', x - 2 - i, y - 3 - i, 1, 2 * i + 1); R(c, '#2ce8f5', x + 2 + i, y - 3 - i, 1, 2 * i + 1); }
    R(c, '#0099db', x - 2, y - 5, 5, 5); R(c, '#bff8ff', x - 6, y - 5, 2, 2); R(c, '#bff8ff', x + 4, y - 5, 2, 2);
  } },
  ears: { back: false, draw: (c, a) => {
    const y = a.top + M + 8;
    for (const s of [-1, 1]) {
      const x = Math.round(a.cx + s * a.hw * 0.26) + M;
      for (let i = 0; i < 13; i++) R(c, '#241c36', x - Math.floor((13 - i) / 2), y - i, 13 - i, 1);
      for (let i = 2; i < 9; i++) R(c, '#6a557f', x - Math.floor((8 - i) / 2), y - i, 8 - i, 1);
    }
  } },
  hood: { back: true, draw: (c, a, _w, h) => {
    const r = Math.round(a.hw / 2) + 4, cx = Math.round(a.cx) + M, cy = a.top + M + r - 3;
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
      const d = x * x + y * y;
      if (d <= r * r) R(c, d > (r - 1.6) * (r - 1.6) ? '#8f1423' : '#e63946', cx + x, cy + y, 1, 1);
    }
    const y1 = M + h - 13;
    for (let y = cy; y <= y1; y++) {
      const half = Math.round(r - 3 + (y - cy) * 0.3), x0 = cx - 3 - half;
      R(c, '#e63946', x0, y, half * 2, 1); R(c, '#8f1423', x0 - 1, y, 2, 1); R(c, '#8f1423', x0 + half * 2 - 1, y, 2, 1);
      if ((y - cy) % 6 === 5) R(c, '#c22a3a', x0 + 3, y, half * 2 - 6, 1);
    }
    R(c, '#8f1423', cx - 3 - Math.round(r - 3 + (y1 - cy) * 0.3), y1 + 1, Math.round(r - 3 + (y1 - cy) * 0.3) * 2, 1);
  } },
  tail: { back: false, draw: (c, _a, w, h) => {
    const fs = Math.max(0.5, h / 148);
    const x0 = M + w * 0.5 - 2 * fs, y0 = M + h * 0.855, L = Math.round(54 * fs);
    const at = (u: number): [number, number, number] => [x0 + 36 * fs * Math.pow(u, 1.7), y0 + 50 * fs * u * (1 - 0.3 * u), (13.5 - 9.5 * u) * fs];
    const dot = (cx: number, cy: number, r: number, col: string) => { const n = Math.ceil(r); for (let y = -n; y <= n; y++) for (let x = -n; x <= n; x++) if (x * x + y * y <= r * r) R(c, col, cx + x, cy + y, 1, 1); };
    const [ex, ey] = at(1);
    const lobe = (k: number) => Array.from({ length: Math.round(15 * fs) }, (_, i): [number, number, number] => [ex + i * (k ? 0.45 : 1.0), ey + i * (k ? 1.0 : -0.5), Math.max(1.4, 4.2 * fs - i * 0.18)]);
    const pts: [number, number, number][] = [...Array.from({ length: L + 1 }, (_, i) => at(i / L)), ...lobe(0), ...lobe(1)];
    for (const [x, y, r] of pts) dot(x, y, r + 1.3, '#0f4f6e');
    for (const [x, y, r] of pts) dot(x, y, r, '#2bb6c9');
    for (let i = 0; i <= L; i++) {
      const [x, y, r] = at(i / L);
      if (i % 2 === 0) dot(x - r * 0.45, y - r * 0.2, Math.max(1, r * 0.28), '#8ff0f6');
      if (i % 5 === 2) R(c, '#1d8fa8', x + r * 0.15, y, Math.max(2, r * 0.55), 1);
    }
  } },
};
const overlayCache = new Map<string, THREE.CanvasTexture>();
function overlayTex(atlas: AtlasData, wear: Wear, key: string): THREE.CanvasTexture {
  const id = `${wear}:${key}`;
  let t = overlayCache.get(id);
  if (!t) {
    const r = atlas.rects[key];
    const cv = document.createElement('canvas'); cv.width = r[2] + 2 * M; cv.height = r[3] + 2 * M;
    WEAR[wear].draw(cv.getContext('2d')!, atlas.anchors[key], r[2], r[3]);
    t = new THREE.CanvasTexture(cv);
    t.flipY = false; t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; t.magFilter = THREE.NearestFilter;
    overlayCache.set(id, t);
  }
  return t;
}

const cardGeo = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0);
const shadowGeo = new THREE.CircleGeometry(0.5, 20).rotateX(-PI / 2);

export class Actor {
  holder = new THREE.Group();
  private bill = new THREE.Group();
  private inner = new THREE.Group();
  private card: THREE.Mesh;
  private mat: THREE.ShaderMaterial;
  private shadow: THREE.Mesh;
  private layers: { wear: Wear; mesh: THREE.Mesh; mat: THREE.ShaderMaterial }[] = [];
  private key = '';
  private seed: number;
  private k = 1;
  private _size = 1; private _sq = 0; private _tilt = 0; private _lift = 0; private _alpha = 1; private _flash = 0; private _sil = 0;
  private _silCol = new THREE.Vector3(0.07, 0.05, 0.12);
  private _flip = false; private _tint: THREE.Vector3 | null = null; private _shadow = true;
  private _emote = ''; private emoteCard: THREE.Mesh | null = null; private emoteMat: THREE.ShaderMaterial | null = null;
  height = 1.6;

  constructor(private atlas: AtlasData, public id: CharId, private baseSize = 1) {
    this.mat = pixelMat(atlas.tex, atlas.w, atlas.h, id === 'whale' ? WHALE_PIXEL_SMOOTHING : 0);
    this.card = new THREE.Mesh(cardGeo, this.mat);
    this.shadow = new THREE.Mesh(shadowGeo, new THREE.MeshBasicMaterial({ color: 0x0b0a16, transparent: true, opacity: 0.3, depthWrite: false }));
    this.shadow.position.y = 0.025;
    this.inner.add(this.card); this.bill.add(this.inner); this.holder.add(this.bill, this.shadow);
    this.seed = id.charCodeAt(0) * 0.37 + id.length;
    this.set(CAST_SETS[id].front[0]);
  }
  begin() {
    this._size = 1; this._sq = 0; this._tilt = 0; this._lift = 0; this._alpha = 1; this._flash = 0; this._sil = 0;
    this._flip = false; this._tint = null; this._shadow = true; this._emote = '';
  }
  wear(w: Wear): this {
    const tex = overlayTex(this.atlas, w, this.key);
    const mat = pixelMat(tex, tex.image.width, tex.image.height, this.id === 'whale' ? WHALE_PIXEL_SMOOTHING : 0);
    const m = new THREE.Mesh(cardGeo, mat);
    m.position.z = WEAR[w].back ? -0.012 : 0.012;
    this.inner.add(m);
    this.layers.push({ wear: w, mesh: m, mat });
    this.syncLayers();
    return this;
  }
  set(key: string): this {
    if (key === this.key) return this;
    const r = this.atlas.rects[key];
    if (!r) throw new Error(`[cast] 缺少角色精灵「${key}」`);
    this.key = key; this.k = scaleFor(key);
    (this.mat.uniforms.rect.value as THREE.Vector4).set(r[0], r[1], r[2], r[3]);
    this.card.scale.set(r[2] * PX * this.k, r[3] * PX * this.k, 1);
    this.height = r[3] * PX * this.k * this.baseSize;
    this.syncLayers();
    return this;
  }
  private syncLayers() {
    const r = this.atlas.rects[this.key];
    for (const l of this.layers) {
      const tex = overlayTex(this.atlas, l.wear, this.key);
      l.mat.uniforms.map.value = tex;
      (l.mat.uniforms.texSize.value as THREE.Vector2).set(tex.image.width, tex.image.height);
      (l.mat.uniforms.rect.value as THREE.Vector4).set(0, 0, tex.image.width, tex.image.height);
      l.mesh.scale.set((r[2] + 2 * M) * PX * this.k, (r[3] + 2 * M) * PX * this.k, 1);
      l.mesh.position.y = -M * PX * this.k;
    }
  }
  walkBy(dist: number, cycle = 1.15): this {
    const s = CAST_SETS[this.id], n = WALK_N[this.id];
    const sz = this.baseSize * this._size, L = cycle * sz;
    const ph = (((dist % L) + L) % L) / L;
    const f = cycleIndex(ph * n, n);
    this._lift += Math.abs(Math.sin(ph * TAU)) * 0.035 * sz;
    return this.set(`${s.walk}${f}`);
  }
  front(T: number): this {
    const s = CAST_SETS[this.id], ph = (T + this.seed * 1.3) % 2.6;
    return this.set(ph < 0.13 ? s.front[1] : s.front[0]);
  }
  act(name: string, T: number, t0 = 0): this {
    const m = ACTIONS[this.id]?.[name];
    if (!m) throw new Error(`[cast] 角色 ${this.id} 没有动作「${name}」`);
    const i = Math.floor(Math.max(0, T - t0) * m.fps + 1e-6);
    const idx = m.loop ? cycleIndex(i, m.frames.length) : Math.min(m.frames.length - 1, i);
    return this.set(m.frames[idx]);
  }
  idle(T: number): this { return this.act(ACTIONS[this.id]?.idle ? 'idle' : 'float', T + this.seed * 1.3); }
  emote(fx: string | null, T = 0): this {
    if (!fx) { this._emote = ''; return this; }
    const seq = FX[fx] ?? (this.atlas.rects[fx] ? [fx] : null);
    if (!seq) throw new Error(`[cast] 没有表情贴「${fx}」`);
    this._emote = seq[cycleIndex(Math.floor(T * 6), seq.length)];
    return this;
  }
  at(x: number, y: number, z: number): this { this.holder.position.set(x, y, z); return this; }
  flip(b = true): this { this._flip = b; return this; }
  size(s: number): this { this._size = s; return this; }
  sq(a: number): this { this._sq = a; return this; }
  tilt(r: number): this { this._tilt = r; return this; }
  lift(h: number): this { this._lift = h; return this; }
  alpha(a: number): this { this._alpha = a; return this; }
  flash(v: number): this { this._flash = v; return this; }
  sil(v: number, col = 0x120e1f): this { this._sil = v; this._silCol.copy(rgb(col)); return this; }
  tint(hex: number | null): this { this._tint = hex == null ? null : rgb(hex); return this; }
  noShadow(): this { this._shadow = false; return this; }
  hide(): this { this._alpha = 0; return this; }

  private commitEmote() {
    if (!this._emote) { if (this.emoteCard) this.emoteCard.visible = false; return; }
    if (!this.emoteCard) {
      this.emoteMat = pixelMat(this.atlas.tex, this.atlas.w, this.atlas.h);
      this.emoteCard = new THREE.Mesh(cardGeo, this.emoteMat);
      this.bill.add(this.emoteCard);
    }
    const r = this.atlas.rects[this._emote], s = this.baseSize * this._size * this.k, side = this._flip ? -1 : 1;
    (this.emoteMat!.uniforms.rect.value as THREE.Vector4).set(r[0], r[1], r[2], r[3]);
    this.emoteMat!.uniforms.alpha.value = this._alpha;
    this.emoteCard.scale.set(r[2] * PX * 1.15 * s, r[3] * PX * 1.15 * s, 1);
    const a = this.atlas.anchors[this.key], body = this.atlas.rects[this.key];
    const hx = a ? (a.cx + a.hw * 0.35 - body[2] / 2) * PX * s : 0.3 * s;
    const top = a ? (body[3] - a.top) * PX * s : this.height;
    this.emoteCard.position.set(side * hx, top - 0.02 * s, 0.02);
    this.emoteCard.visible = true;
  }

  commit(cam: THREE.Camera, cardTint: THREE.Vector3) {
    const vis = this._alpha > 0.02;
    this.holder.visible = vis;
    if (!vis) return;
    this.bill.quaternion.copy(cam.quaternion);
    this.bill.position.y = this._lift;
    this.commitEmote();
    const s = this.baseSize * this._size;
    this.inner.scale.set(s * (1 + this._sq * 0.6), s * (1 - this._sq), 1);
    this.inner.rotation.z = this._tilt;
    const tint = this._tint ?? cardTint;
    this.mat.uniforms.cut.value = this.key.startsWith('whale_big') && this.layers.some(l => l.wear === 'tail') ? 0.875 : 2;
    for (const m of [this.mat, ...this.layers.map(l => l.mat)]) {
      const u = m.uniforms;
      u.flip.value = this._flip ? 1 : 0; u.alpha.value = this._alpha; u.flash.value = this._flash; u.sil.value = this._sil;
      (u.silColor.value as THREE.Vector3).copy(this._silCol);
      (u.tint.value as THREE.Vector3).copy(tint);
    }
    const r = this.atlas.rects[this.key];
    const w = Math.min(1.5, r[2] * PX * this.k * s * 0.62);
    const k = Math.max(0.25, 1 - this._lift * 0.22);
    this.shadow.visible = this._shadow && this._sil < 0.5;
    this.shadow.scale.set(w * k, 1, w * 0.42 * k);
    (this.shadow.material as THREE.MeshBasicMaterial).opacity = 0.3 * k * this._alpha;
  }
}

export class PixelThing {
  holder = new THREE.Group();
  private card: THREE.Mesh;
  private mat: THREE.ShaderMaterial;
  constructor(private atlas: AtlasData, public key: string, private baseSize = 1) {
    const r = atlas.rects[key];
    if (!r) throw new Error(`[cast] 缺少道具格「${key}」`);
    this.mat = pixelMat(atlas.tex, atlas.w, atlas.h);
    (this.mat.uniforms.rect.value as THREE.Vector4).set(r[0], r[1], r[2], r[3]);
    this.card = new THREE.Mesh(cardGeo, this.mat);
    this.card.scale.set(r[2] * PX * baseSize, r[3] * PX * baseSize, 1);
    this.holder.add(this.card);
  }
  set(key: string): this {
    const r = this.atlas.rects[key]; if (!r) throw new Error(`[cast] 缺少道具格「${key}」`);
    this.key = key;
    (this.mat.uniforms.rect.value as THREE.Vector4).set(r[0], r[1], r[2], r[3]);
    this.card.scale.set(r[2] * PX * this.baseSize, r[3] * PX * this.baseSize, 1);
    return this;
  }
  at(x: number, y: number, z: number): this { this.holder.position.set(x, y, z); this.holder.visible = true; return this; }
  size(s: number): this { this.holder.scale.setScalar(s); return this; }
  flip(b = true): this { this.mat.uniforms.flip.value = b ? 1 : 0; return this; }
  hide(): this { this.holder.visible = false; return this; }
  face(cam: THREE.Camera, cardTint: THREE.Vector3) {
    this.card.quaternion.copy(cam.quaternion);
    (this.mat.uniforms.tint.value as THREE.Vector3).copy(cardTint);
  }
}

/* ───────────── 镜头与 Kit 容器 ───────────── */
export type V3 = [number, number, number];
export interface Hud { flash: number; flashCol: string; fade: number; bars: number; shake: number; tint: string; }
export interface CamState { p: V3; l: V3; fov: number; roll: number }
export const cam = (p: V3, l: V3, fov = 38, roll = 0): CamState => ({ p, l, fov, roll });
const mix3 = (a: V3, b: V3, e: number): V3 => [lerp(a[0], b[0], e), lerp(a[1], b[1], e), lerp(a[2], b[2], e)];
export const mixCam = (a: CamState, b: CamState, e: number): CamState => ({ p: mix3(a.p, b.p, e), l: mix3(a.l, b.l, e), fov: lerp(a.fov, b.fov, e), roll: lerp(a.roll, b.roll, e) });
export const glide = (a: CamState, b: CamState, u: number, k = 0.55): CamState => mixCam(a, b, lerp(u, ease(u), k));

export interface Frame {
  t: number; T: number; lt: number; p: number; u: number; dur: number; bp: number;
  bt: { idx: number; phase: number; pulse: number; down: boolean; len: number };
  hud: Hud;
}
export class Kit {
  root = new THREE.Group();
  actors: Actor[] = [];
  things: PixelThing[] = [];
  rnd: () => number;
  constructor(public atlas: AtlasData, seed: number, private pool: Map<string, unknown>) { this.rnd = mulberry(seed); }
  actor(id: CharId, size = 1): Actor {
    const a = new Actor(this.atlas, id, size); this.actors.push(a); this.root.add(a.holder); return a;
  }
  thing(key: string, size = 1): PixelThing {
    const t = new PixelThing(this.atlas, key, size); this.things.push(t); this.root.add(t.holder); return t;
  }
  shared<T>(key: string, make: () => T): T {
    if (!this.pool.has(key)) this.pool.set(key, make());
    return this.pool.get(key) as T;
  }
  add<T extends THREE.Object3D>(o: T, x = 0, y = 0, z = 0, ry = 0, s = 1): T { return put(this.root, o, x, y, z, ry, s); }
}

export interface ShotDef {
  id: string; a: number; b: number; look: LookName;
  build: (k: Kit) => (f: Frame) => CamState;
}
export const SHOTS: ShotDef[] = [];
export function shot(id: string, a: number, b: number, look: LookName, build: (k: Kit) => (f: Frame) => CamState) {
  SHOTS.push({ id, a, b, look, build });
}
