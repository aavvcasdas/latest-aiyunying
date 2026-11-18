// 核心模块：确定性数学 + 古风程序化纹理 + 渐变天穹 + 粒子场 + 分支八角色图集动作绑定
import * as THREE from 'three';
import atlasUrl from '../assets/cast_atlas.png';
import atlasData from '../assets/cast_atlas.json';
import actionsData from '../assets/cast_actions.json';
import type { CharId } from './timeline';

// ---------- 确定性数学与缓动 ----------
export const TAU = Math.PI * 2;
export const clamp = (x: number, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const range = (t: number, a: number, b: number) => clamp((t - a) / Math.max(1e-5, b - a));
export const smooth = (x: number) => { const t = clamp(x); return t * t * (3 - 2 * t); };
export const eOut = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
export const eIn = (x: number) => { const t = clamp(x); return t * t * t; };
export const eInOut = (x: number) => { const t = clamp(x); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const eBack = (x: number, s = 1.55) => {
  const t = clamp(x) - 1;
  return 1 + t * t * ((s + 1) * t + s);
};
export const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
};
export const C = (hex: number) => new THREE.Color(hex);

// ---------- 程序化纹理缓存 ----------
const TEX_CACHE = new Map<string, THREE.CanvasTexture>();
function cachedTex(key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, repeat = false): THREE.CanvasTexture {
  const hit = TEX_CACHE.get(key);
  if (hit) return hit;
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const g = cv.getContext('2d')!;
  draw(g, w, h);
  const tx = new THREE.CanvasTexture(cv);
  if (repeat) { tx.wrapS = tx.wrapT = THREE.RepeatWrapping; }
  tx.needsUpdate = true;
  TEX_CACHE.set(key, tx);
  return tx;
}

/** 柔和径向辉光贴图 */
export function glowTex() {
  return cachedTex('glow', 128, 128, (g, w) => {
    const gr = g.createRadialGradient(w / 2, w / 2, 1, w / 2, w / 2, w / 2);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.28, 'rgba(255,255,255,0.68)');
    gr.addColorStop(0.65, 'rgba(255,255,255,0.16)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, w, w);
  });
}

/** 樱花花瓣贴图（尖端带经典 V 形缺口 + 粉白渐变纹理） */
export function petalTex() {
  return cachedTex('petal', 128, 128, (g) => {
    g.clearRect(0, 0, 128, 128);
    g.save();
    g.translate(64, 68);
    g.beginPath();
    g.moveTo(0, 44);
    g.bezierCurveTo(-38, 24, -44, -22, -14, -48);
    g.lineTo(0, -32);
    g.lineTo(14, -48);
    g.bezierCurveTo(44, -22, 38, 24, 0, 44);
    g.closePath();
    const gr = g.createLinearGradient(0, 44, 0, -48);
    gr.addColorStop(0, 'rgba(255,152,188,0.98)');
    gr.addColorStop(0.55, 'rgba(255,212,228,0.96)');
    gr.addColorStop(1, 'rgba(255,248,252,0.92)');
    g.fillStyle = gr;
    g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.45)';
    g.lineWidth = 2;
    g.beginPath(); g.moveTo(0, 36); g.lineTo(0, -24); g.stroke();
    g.restore();
  });
}

/** 剑芒星火贴图（菱形锐光） */
export function sparkTex() {
  return cachedTex('spark', 96, 96, (g) => {
    const gr = g.createRadialGradient(48, 48, 0, 48, 48, 44);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.4, 'rgba(255,230,190,0.75)');
    gr.addColorStop(1, 'rgba(255,120,80,0)');
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(48, 2); g.quadraticCurveTo(54, 42, 94, 48);
    g.quadraticCurveTo(54, 54, 48, 94); g.quadraticCurveTo(42, 54, 2, 48);
    g.quadraticCurveTo(42, 42, 48, 2);
    g.fill();
  });
}

/** 霜雪六瓣冰晶贴图 */
export function frostTex() {
  return cachedTex('frost', 96, 96, (g) => {
    g.translate(48, 48);
    const gr = g.createRadialGradient(0, 0, 1, 0, 0, 44);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.55, 'rgba(215,240,255,0.75)');
    gr.addColorStop(1, 'rgba(180,220,255,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 42, 0, TAU); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.92)'; g.lineWidth = 3; g.lineCap = 'round';
    for (let i = 0; i < 6; i++) {
      g.save(); g.rotate((i * Math.PI) / 3);
      g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -34);
      g.moveTo(0, -20); g.lineTo(-9, -28); g.moveTo(0, -20); g.lineTo(9, -28);
      g.stroke(); g.restore();
    }
  });
}

/** 雨滴/泪珠贴图 */
export function dropTex() {
  return cachedTex('drop', 64, 96, (g) => {
    const gr = g.createLinearGradient(32, 6, 32, 88);
    gr.addColorStop(0, 'rgba(220,242,255,0.2)');
    gr.addColorStop(0.65, 'rgba(235,248,255,0.9)');
    gr.addColorStop(1, 'rgba(255,255,255,1)');
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(32, 6);
    g.bezierCurveTo(54, 48, 56, 82, 32, 88);
    g.bezierCurveTo(8, 82, 10, 48, 32, 6);
    g.fill();
  });
}

/** 树皮纹理 */
export function barkTex() {
  return cachedTex('bark', 256, 256, (g, w, h) => {
    g.fillStyle = '#3d2824'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 240; i++) {
      const x = hash(i * 3.1) * w, y = hash(i * 7.3) * h;
      g.fillStyle = i % 3 === 0 ? '#2b1a17' : i % 3 === 1 ? '#513630' : '#5e423b';
      g.fillRect(x, y, 2 + hash(i) * 4, 18 + hash(i * 2) * 34);
    }
    // 樱树皮横纹
    for (let i = 0; i < 65; i++) {
      const x = hash(i * 11) * w, y = hash(i * 17) * h;
      g.fillStyle = 'rgba(120,88,80,0.45)';
      g.fillRect(x, y, 14 + hash(i * 5) * 20, 2);
    }
  }, true);
}

/** 青苔古石纹理 */
export function stoneTex() {
  return cachedTex('stone', 256, 256, (g, w, h) => {
    g.fillStyle = '#6c7078'; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 420; i++) {
      const x = hash(i * 5.7) * w, y = hash(i * 9.1) * h, r = 3 + hash(i * 2.3) * 14;
      g.fillStyle = i % 7 === 0 ? 'rgba(88,118,82,0.32)' : i % 2 ? 'rgba(55,58,66,0.28)' : 'rgba(148,154,164,0.25)';
      g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    }
  }, true);
}

/** 宣纸水墨长卷底纹 */
export function scrollPaperTex() {
  return cachedTex('scrollPaper', 512, 256, (g, w, h) => {
    const gr = g.createLinearGradient(0, 0, w, h);
    gr.addColorStop(0, '#f4ead5');
    gr.addColorStop(0.5, '#faf3e4');
    gr.addColorStop(1, '#ede0c6');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    // 淡青绿远山晕染
    for (let layer = 0; layer < 3; layer++) {
      g.beginPath();
      const baseY = 125 + layer * 34;
      g.moveTo(0, h);
      for (let x = 0; x <= w; x += 8) {
        const y = baseY - Math.sin(x * 0.018 + layer * 2.1) * (34 - layer * 6) - Math.cos(x * 0.043 + layer) * 14;
        g.lineTo(x, y);
      }
      g.lineTo(w, h); g.closePath();
      g.fillStyle = layer === 0 ? 'rgba(116,158,154,0.28)' : layer === 1 ? 'rgba(72,112,110,0.34)' : 'rgba(46,62,72,0.38)';
      g.fill();
    }
    // 宣纸纤维与绯樱点染
    for (let i = 0; i < 120; i++) {
      g.fillStyle = i < 45 ? 'rgba(244,143,177,0.42)' : 'rgba(155,130,96,0.14)';
      g.beginPath();
      g.arc(hash(i * 4.1) * w, hash(i * 8.3) * h * 0.85, i < 45 ? 2 + hash(i) * 4.5 : 1.2, 0, TAU);
      g.fill();
    }
    // 朱砂印章
    g.fillStyle = 'rgba(196,54,54,0.78)';
    g.fillRect(w - 54, 34, 22, 26);
    g.strokeStyle = '#faf3e4'; g.lineWidth = 1.5;
    g.strokeRect(w - 50, 38, 14, 18);
  });
}

/** 角色地面软阴影贴图 */
export function shadowTex() {
  return cachedTex('shadow', 64, 64, (g) => {
    const gr = g.createRadialGradient(32, 32, 2, 32, 32, 30);
    gr.addColorStop(0, 'rgba(10,8,18,0.52)');
    gr.addColorStop(0.6, 'rgba(10,8,18,0.22)');
    gr.addColorStop(1, 'rgba(10,8,18,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  });
}

// ---------- 渐变天穹（支持日月辉光与暮霞晕染） ----------
const SKY_VS = `varying vec3 vDir;
void main() {
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const SKY_FS = `uniform vec3 uTop; uniform vec3 uMid; uniform vec3 uBot;
uniform vec3 uSunDir; uniform vec3 uSunCol; uniform float uSunSize; uniform float uSunGlow;
uniform float uAurora; uniform float uTime;
varying vec3 vDir;
void main() {
  vec3 d = normalize(vDir);
  float h = clamp(d.y * 0.5 + 0.5, 0.0, 1.0);
  vec3 col = h < 0.5
    ? mix(uBot, uMid, smoothstep(0.18, 0.5, h))
    : mix(uMid, uTop, smoothstep(0.5, 0.94, h));
  // 日/月圆盘与柔和大气散射（克制高光，绝不冲白前景角色）
  vec3 sd = normalize(uSunDir);
  float mu = max(0.0, dot(d, sd));
  col += uSunCol * pow(mu, 8.0) * uSunGlow * 0.24;
  col += uSunCol * pow(mu, 48.0) * uSunGlow * 0.34;
  float disc = smoothstep(1.0 - uSunSize * 1.3, 1.0 - uSunSize * 0.6, mu);
  col = mix(col, uSunCol * 1.08 + vec3(0.06), disc * clamp(uSunGlow * 0.85, 0.0, 0.92));
  // 灵曲极光带
  if (uAurora > 0.001 && d.y > 0.02) {
    float wave = sin(d.x * 5.2 + uTime * 0.55 + sin(d.z * 3.1)) * 0.5 + 0.5;
    float band = exp(-pow((d.y - 0.34 - wave * 0.14) * 6.5, 2.0));
    vec3 ac = mix(vec3(0.32, 0.92, 0.88), vec3(0.98, 0.58, 0.78), wave);
    col += ac * band * uAurora * 0.55;
  }
  gl_FragColor = vec4(col, 1.0);
}`;

export class Sky {
  mesh: THREE.Mesh;
  mat: THREE.ShaderMaterial;
  constructor() {
    this.mat = new THREE.ShaderMaterial({
      uniforms: {
        uTop: { value: C(0x283056) },
        uMid: { value: C(0x8c5f84) },
        uBot: { value: C(0xf7c5cc) },
        uSunDir: { value: new THREE.Vector3(0, 0.28, -1) },
        uSunCol: { value: C(0xffe6c2) },
        uSunSize: { value: 0.0045 },
        uSunGlow: { value: 0.7 },
        uAurora: { value: 0 },
        uTime: { value: 0 },
      },
      vertexShader: SKY_VS,
      fragmentShader: SKY_FS,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    });
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(420, 32, 24), this.mat);
    this.mesh.renderOrder = -100;
  }
  set(top: number, mid: number, bot: number, sunCol = 0xffe4be, sunDir: [number, number, number] = [0, 0.25, -1], sunGlow = 0.7, sunSize = 0.0045, aurora = 0, t = 0) {
    const u = this.mat.uniforms;
    u.uTop.value.setHex(top);
    u.uMid.value.setHex(mid);
    u.uBot.value.setHex(bot);
    u.uSunCol.value.setHex(sunCol);
    u.uSunDir.value.set(sunDir[0], sunDir[1], sunDir[2]).normalize();
    u.uSunGlow.value = sunGlow;
    u.uSunSize.value = sunSize;
    u.uAurora.value = aurora;
    u.uTime.value = t;
  }
}

// ---------- GPU 旋转精灵粒子场（落樱 / 飞雪 / 细雨 / 流萤 / 余烬 / 繁星） ----------
const PART_VS = `attribute float aSize; attribute float aRot; attribute vec3 aCol;
uniform float uScale; uniform float uPixelRatio;
varying vec3 vCol; varying float vRot;
void main() {
  vCol = aCol; vRot = aRot;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp(aSize * uScale * uPixelRatio * (260.0 / max(0.5, -mv.z)), 1.0, 96.0);
}`;

const PART_FS = `uniform sampler2D uMap; uniform float uOpacity;
varying vec3 vCol; varying float vRot;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float c = cos(vRot), s = sin(vRot);
  vec2 ruv = vec2(uv.x * c - uv.y * s, uv.x * s + uv.y * c) + 0.5;
  vec4 tx = texture2D(uMap, clamp(ruv, 0.0, 1.0));
  if (tx.a * uOpacity < 0.02) discard;
  gl_FragColor = vec4(tx.rgb * vCol, tx.a * uOpacity);
}`;

export class ParticleField {
  points: THREE.Points;
  pos: Float32Array;
  sz: Float32Array;
  rot: Float32Array;
  col: Float32Array;
  geo: THREE.BufferGeometry;
  mat: THREE.ShaderMaterial;
  count: number;
  constructor(count: number, opts: { map?: THREE.Texture; scale?: number; opacity?: number; additive?: boolean } = {}) {
    this.count = count;
    this.pos = new Float32Array(count * 3);
    this.sz = new Float32Array(count);
    this.rot = new Float32Array(count);
    this.col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      this.sz[i] = 1;
      this.col[i * 3] = 1; this.col[i * 3 + 1] = 1; this.col[i * 3 + 2] = 1;
    }
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.geo.setAttribute('aSize', new THREE.BufferAttribute(this.sz, 1));
    this.geo.setAttribute('aRot', new THREE.BufferAttribute(this.rot, 1));
    this.geo.setAttribute('aCol', new THREE.BufferAttribute(this.col, 3));
    this.mat = new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: opts.map ?? glowTex() },
        uScale: { value: opts.scale ?? 1 },
        uOpacity: { value: opts.opacity ?? 0.9 },
        uPixelRatio: { value: 1.5 },
      },
      vertexShader: PART_VS,
      fragmentShader: PART_FS,
      transparent: true,
      depthWrite: false,
      blending: opts.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    this.points = new THREE.Points(this.geo, this.mat);
    this.points.frustumCulled = false;
  }
  set(i: number, x: number, y: number, z: number, size = 1, rot = 0) {
    const k = i * 3;
    this.pos[k] = x; this.pos[k + 1] = y; this.pos[k + 2] = z;
    this.sz[i] = size;
    this.rot[i] = rot;
  }
  setColor(i: number, hex: number) {
    const k = i * 3;
    this.col[k] = ((hex >> 16) & 255) / 255;
    this.col[k + 1] = ((hex >> 8) & 255) / 255;
    this.col[k + 2] = (hex & 255) / 255;
  }
  commit(colors = false) {
    (this.geo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (this.geo.attributes.aSize as THREE.BufferAttribute).needsUpdate = true;
    (this.geo.attributes.aRot as THREE.BufferAttribute).needsUpdate = true;
    if (colors) (this.geo.attributes.aCol as THREE.BufferAttribute).needsUpdate = true;
  }
}

// ---------- 分支八角色图集加载与 Actor 绑定 ----------
type AtlasMap = Record<string, [number, number, number, number]>;
interface ActionDef { label: string; fps: number; loop: boolean; frames: string[]; fx: string | null; size: [number, number] }
const ATLAS_W = atlasData.w;
const ATLAS_H = atlasData.h;
const SPRITES = atlasData.s as unknown as AtlasMap;
const ACTIONS = actionsData.actions as unknown as Record<CharId, Record<string, ActionDef>>;

let ATLAS_TEX: THREE.Texture | null = null;
let ATLAS_IMG: HTMLImageElement | null = null;

export function getAtlasImage(): HTMLImageElement | null { return ATLAS_IMG; }
export function getSpriteRect(name: string): [number, number, number, number] {
  return SPRITES[name] ?? SPRITES.act_whale_idle_0 ?? [0, 0, 84, 90];
}

export async function loadAtlas(): Promise<THREE.Texture> {
  if (ATLAS_TEX) return ATLAS_TEX;
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ATLAS_IMG = img;
      const tx = new THREE.Texture(img);
      tx.magFilter = THREE.NearestFilter;
      tx.minFilter = THREE.NearestFilter;
      tx.generateMipmaps = false;
      tx.colorSpace = THREE.SRGBColorSpace;
      tx.flipY = true;
      tx.needsUpdate = true;
      ATLAS_TEX = tx;
      resolve(tx);
    };
    img.onerror = reject;
    img.src = atlasUrl;
  });
}

const ACTOR_VS = `varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const ACTOR_FS = `uniform sampler2D uTex;
uniform vec4 uRect; // u0, v0, du, dv
uniform float uFlip;
uniform vec3 uTint;
uniform float uAlpha;
uniform float uFlash;
uniform vec3 uFlashCol;
uniform float uSil;
uniform vec3 uSilCol;
uniform float uFrost;  // 发顶染霜雪 0..1
uniform float uSpirit; // 灵体半透明青粉光晕 0..1
varying vec2 vUv;
void main() {
  float ux = uFlip < 0.0 ? (1.0 - vUv.x) : vUv.x;
  vec2 uv = vec2(uRect.x + ux * uRect.z, uRect.y + vUv.y * uRect.w);
  vec4 tx = texture2D(uTex, uv);
  if (tx.a < 0.12) discard;
  vec3 c = tx.rgb * uTint;
  float lum = dot(c, vec3(0.299, 0.587, 0.114));
  // 适度柔化纯白高光，使龙娘白发与本鲸围裙的像素层次清晰通透
  c = mix(c, c * 0.9, smoothstep(0.75, 1.0, lum));
  // 哪怕黑发被浸染：保留眼眸与深色描边，将发顶与发丝渐染为晶莹银雪色
  if (uFrost > 0.001) {
    float lineKeep = smoothstep(0.14, 0.35, lum);
    float crown = smoothstep(0.52, 0.92, vUv.y) * uFrost * lineKeep;
    c = mix(c, vec3(0.86, 0.92, 0.99), crown * 0.68);
  }
  // 带去我的灵体：保留五官轮廓，通体化作澄澈青琉璃与淡樱灵光
  if (uSpirit > 0.001) {
    vec3 spDark = vec3(0.14, 0.38, 0.52);
    vec3 spBright = mix(vec3(0.45, 0.92, 0.95), vec3(0.96, 0.72, 0.86), vUv.y);
    vec3 sp = mix(spDark, spBright, smoothstep(0.12, 0.85, lum));
    c = mix(c, sp, uSpirit * 0.72);
  }
  c = mix(c, uSilCol, clamp(uSil, 0.0, 1.0));
  c = mix(c, uFlashCol, clamp(uFlash, 0.0, 1.0));
  gl_FragColor = vec4(c, tx.a * uAlpha);
}`;

const BASE_HEIGHT: Record<CharId, number> = {
  whale: 1.58,
  claude: 1.62,
  gpt: 2.15,
  qwen: 1.62,
  kimi: 1.6,
  gemini: 1.58,
  doubao: 1.54,
  zai: 1.56,
};

const SPRITE_GEO = new THREE.PlaneGeometry(1, 1);
SPRITE_GEO.translate(0, 0.5, 0); // 原点置于脚底中心，永不悬空或陷地！

function uvRect(name: string): [number, number, number, number] {
  const [x, y, w, h] = getSpriteRect(name);
  // 0.45px 内缩彻底杜绝像素图集邻格渗色
  const pad = 0.45;
  const u0 = (x + pad) / ATLAS_W;
  const du = Math.max(1, w - pad * 2) / ATLAS_W;
  const v0 = 1 - (y + h - pad) / ATLAS_H;
  const dv = Math.max(1, h - pad * 2) / ATLAS_H;
  return [u0, v0, du, dv];
}

export class Actor {
  id: CharId;
  root = new THREE.Group();
  body = new THREE.Group();
  mesh: THREE.Mesh;
  mat: THREE.ShaderMaterial;
  shadow: THREE.Mesh;
  halo: THREE.Sprite;
  propMesh: THREE.Mesh | null = null;
  propMat: THREE.ShaderMaterial | null = null;
  baseH: number;
  scaleMul = 1;
  private curSprite = '';
  private curW = 84;
  private curH = 90;

  constructor(id: CharId, scale = 1) {
    this.id = id;
    this.scaleMul = scale;
    this.baseH = BASE_HEIGHT[id] * scale;
    const defaultSprite = id === 'gpt' ? 'act_gpt_float_0' : `act_${id}_idle_0`;
    const r = uvRect(defaultSprite);
    this.mat = new THREE.ShaderMaterial({
      uniforms: {
        uTex: { value: ATLAS_TEX },
        uRect: { value: new THREE.Vector4(...r) },
        uFlip: { value: 1 },
        uTint: { value: C(0xffffff) },
        uAlpha: { value: 1 },
        uFlash: { value: 0 },
        uFlashCol: { value: C(0xffffff) },
        uSil: { value: 0 },
        uSilCol: { value: C(0x140d1e) },
        uFrost: { value: 0 },
        uSpirit: { value: 0 },
      },
      vertexShader: ACTOR_VS,
      fragmentShader: ACTOR_FS,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: true,
    });
    this.mesh = new THREE.Mesh(SPRITE_GEO, this.mat);
    this.body.add(this.mesh);

    this.shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1.15 * scale, 0.58 * scale),
      new THREE.MeshBasicMaterial({ map: shadowTex(), transparent: true, opacity: 0.72, depthWrite: false }),
    );
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = 0.015;

    this.halo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTex(),
        color: 0xffd6e7,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    this.halo.position.set(0, this.baseH * 0.54, -0.08);
    this.halo.scale.setScalar(this.baseH * 1.65);

    this.root.add(this.shadow, this.halo, this.body);
    this.setSprite(defaultSprite);
  }

  /** 每帧开头重置状态，确保任意 seek(t) 100% 确定性无残留 */
  reset() {
    this.root.visible = true;
    this.root.rotation.set(0, 0, 0);
    this.root.scale.set(1, 1, 1);
    this.body.position.set(0, 0, 0);
    this.body.rotation.set(0, 0, 0);
    this.shadow.visible = true;
    const u = this.mat.uniforms;
    u.uTex.value = ATLAS_TEX;
    u.uFlip.value = 1;
    u.uTint.value.setHex(0xffffff);
    u.uAlpha.value = 1;
    u.uFlash.value = 0;
    u.uSil.value = 0;
    u.uFrost.value = 0;
    u.uSpirit.value = 0;
    this.mat.blending = THREE.NormalBlending;
    this.mat.depthWrite = true;
    (this.halo.material as THREE.SpriteMaterial).opacity = 0;
    if (this.propMesh) this.propMesh.visible = false;
    return this;
  }

  hide() { this.root.visible = false; return this; }

  at(x: number, y: number, z: number) {
    // 防 NaN 保护：坐标绝不失效
    this.root.position.set(
      Number.isFinite(x) ? x : 0,
      Number.isFinite(y) ? y : 0,
      Number.isFinite(z) ? z : 0,
    );
    return this;
  }

  /** 朝向相机水平旋转（纸片立牌自然正对镜头，无透视扭曲） */
  faceCamera(cam: THREE.Camera) {
    const dx = cam.position.x - this.root.position.x;
    const dz = cam.position.z - this.root.position.z;
    this.body.rotation.y = Math.atan2(dx, dz);
    return this;
  }

  flip(left: boolean) { this.mat.uniforms.uFlip.value = left ? -1 : 1; return this; }

  setSprite(name: string) {
    if (!SPRITES[name]) return this;
    if (this.curSprite !== name) {
      this.curSprite = name;
      const [, , w, h] = SPRITES[name];
      this.curW = w; this.curH = h;
      const r = uvRect(name);
      this.mat.uniforms.uRect.value.set(r[0], r[1], r[2], r[3]);
    }
    const refH = this.id === 'gpt' ? 184 : 90;
    const worldH = this.baseH * (this.curH / refH);
    const worldW = worldH * (this.curW / Math.max(1, this.curH));
    this.mesh.scale.set(worldW, worldH, 1);
    return this;
  }

  /** 播放分支 cast_actions.json 中的官方动作序列 */
  act(action: string, t: number, rate = 1) {
    const dict = ACTIONS[this.id];
    const def = dict?.[action] ?? dict?.idle ?? dict?.float;
    if (!def || !def.frames.length) return this;
    const raw = Math.max(0, t) * def.fps * rate;
    const fi = def.loop
      ? Math.floor(raw) % def.frames.length
      : Math.min(def.frames.length - 1, Math.floor(raw));
    return this.setSprite(def.frames[fi]);
  }

  /** 播放 8 帧步态（龙娘自动切换 hover 振翅） */
  walk(t: number, rate = 1) {
    if (this.id === 'gpt') {
      this.act('hover', t, rate);
      this.body.position.y += 0.25 + Math.sin(t * 3.2) * 0.08;
      return this;
    }
    const fi = ((Math.floor(Math.max(0, t) * 8.5 * rate) % 8) + 8) % 8;
    const key = `walk_${this.id}_${fi}`;
    if (SPRITES[key]) this.setSprite(key);
    else this.act('idle', t, rate);
    return this;
  }

  /** 从 A 点走到 B 点，自动朝向、不打滑 */
  walkPath(x0: number, z0: number, x1: number, z1: number, p: number, t: number, y = 0) {
    const cp = clamp(p);
    this.at(lerp(x0, x1, cp), y, lerp(z0, z1, cp));
    this.flip(x1 < x0);
    if (cp > 0.01 && cp < 0.99) {
      const dist = Math.hypot(x1 - x0, z1 - z0);
      this.walk(t, clamp(dist * 0.28, 0.75, 1.45));
    } else {
      this.act(this.id === 'gpt' ? 'float' : 'idle', t);
    }
    return this;
  }

  lift(h: number) {
    this.body.position.y += h;
    const s = clamp(1 - h * 0.28, 0.25, 1);
    this.shadow.scale.setScalar(s);
    return this;
  }

  tilt(rad: number) { this.body.rotation.z = rad; return this; }

  /** 踩拍微弹（温柔克制，不用夸张缩放冒充动作） */
  bounce(pulse: number, amt = 0.06) {
    this.body.position.y += pulse * amt;
    return this;
  }

  tint(hex: number) { this.mat.uniforms.uTint.value.setHex(hex); return this; }
  alpha(a: number) {
    this.mat.uniforms.uAlpha.value = clamp(a);
    if (a < 0.95) this.mat.depthWrite = false;
    (this.shadow.material as THREE.MeshBasicMaterial).opacity = 0.72 * clamp(a);
    return this;
  }
  sil(amt: number, col = 0x160d22) {
    this.mat.uniforms.uSil.value = amt;
    this.mat.uniforms.uSilCol.value.setHex(col);
    return this;
  }
  flash(amt: number, col = 0xffffff) {
    this.mat.uniforms.uFlash.value = amt;
    this.mat.uniforms.uFlashCol.value.setHex(col);
    return this;
  }
  frost(amt: number) { this.mat.uniforms.uFrost.value = clamp(amt); return this; }
  spirit(amt: number) {
    this.mat.uniforms.uSpirit.value = clamp(amt);
    if (amt > 0.1) {
      this.mat.depthWrite = false;
      this.glow(0x67e8f9, amt * 0.32);
    }
    return this;
  }
  glow(hex: number, opacity: number) {
    const sm = this.halo.material as THREE.SpriteMaterial;
    sm.color.setHex(hex);
    // 柔和背光轮廓晕，不遮盖角色像素五官
    sm.opacity = clamp(opacity * 0.34, 0, 0.18);
    this.halo.position.set(0, this.baseH * 0.52, -0.14);
    return this;
  }
  noShadow() { this.shadow.visible = false; return this; }

  /** 水中倒影形态（上下翻转 + 柔蓝半透明） */
  asReflection(waterY = 0, opacity = 0.58) {
    this.noShadow();
    this.root.position.y = waterY - 0.02;
    this.root.scale.y = -0.92;
    this.tint(0xcdeeff);
    this.alpha(opacity);
    return this;
  }

  /** 佩戴/手持分支官方像素道具（prop_brush / prop_scroll / prop_fan / prop_book / prop_teacup 等） */
  prop(name: string, ox = 0.52, oy = 0.72, scale = 0.42, rotZ = 0) {
    if (!SPRITES[name]) return this;
    if (!this.propMesh) {
      this.propMat = new THREE.ShaderMaterial({
        uniforms: {
          uTex: { value: ATLAS_TEX },
          uRect: { value: new THREE.Vector4(...uvRect(name)) },
          uFlip: { value: 1 },
          uTint: { value: C(0xffffff) },
          uAlpha: { value: 1 },
          uFlash: { value: 0 },
          uFlashCol: { value: C(0xffffff) },
          uSil: { value: 0 },
          uSilCol: { value: C(0) },
          uFrost: { value: 0 },
          uSpirit: { value: 0 },
        },
        vertexShader: ACTOR_VS,
        fragmentShader: ACTOR_FS,
        transparent: true,
        side: THREE.DoubleSide,
      });
      this.propMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.propMat);
      this.body.add(this.propMesh);
    }
    const [, , w, h] = SPRITES[name];
    this.propMat!.uniforms.uTex.value = ATLAS_TEX;
    this.propMat!.uniforms.uRect.value.set(...uvRect(name));
    this.propMesh.visible = true;
    this.propMesh.position.set(ox * this.scaleMul, oy * this.scaleMul, 0.06);
    this.propMesh.rotation.z = rotZ;
    this.propMesh.scale.set(scale * (w / Math.max(1, h)) * this.scaleMul, scale * this.scaleMul, 1);
    return this;
  }
}
