// 工具包：数学缓动、卡通材质、拼图块几何（凸榫 / 凹槽）、天空球、发光贴图。
// 整支 MV 的「换风格」就落在这里：原片是扁平插画拼图，这一版把所有东西都做成立体拼图块。
import * as THREE from 'three';

export type V3 = [number, number, number];
export type Tabs = [number, number, number, number]; // [近(+Z)/下, 右, 远(-Z)/上, 左]：1 凸榫，-1 凹槽，0 平边
export type C = THREE.ColorRepresentation;

export const clamp = (x: number, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const inv = (a: number, b: number, x: number) => clamp((x - a) / (b - a || 1e-6));
export const smooth = (x: number) => { const t = clamp(x); return t * t * (3 - 2 * t); };
export const ease = (x: number) => { const t = clamp(x); return t * t * t * (t * (t * 6 - 15) + 10); };
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
export const easeIn = (x: number) => Math.pow(clamp(x), 3);
export const backOut = (x: number, s = 1.7) => { const t = clamp(x) - 1; return 1 + t * t * ((s + 1) * t + s); };
export const hash = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123; return x - Math.floor(x); };
export const mixV = (a: V3, b: V3, t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0; let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const hashStr = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

// ---------- 卡通材质 ----------
let _grad: THREE.DataTexture | null = null;
export function gradientMap(): THREE.DataTexture {
  if (!_grad) {
    const d = new Uint8Array([118, 118, 118, 255, 190, 190, 190, 255, 238, 238, 238, 255, 255, 255, 255, 255]);
    _grad = new THREE.DataTexture(d, 4, 1, THREE.RGBAFormat);
    _grad.minFilter = THREE.NearestFilter; _grad.magFilter = THREE.NearestFilter; _grad.generateMipmaps = false; _grad.needsUpdate = true;
  }
  return _grad;
}
const toonCache = new Map<string, THREE.MeshToonMaterial>();
/** 共享的卡通材质（同色复用，不要在镜头里改它的颜色） */
export function toon(color: C, emissive?: C, ei = 0): THREE.MeshToonMaterial {
  const key = new THREE.Color(color).getHexString() + (emissive !== undefined ? '|' + new THREE.Color(emissive).getHexString() + ei : '');
  let m = toonCache.get(key);
  if (!m) { m = toonU(color, emissive, ei); toonCache.set(key, m); }
  return m;
}
/** 独占的卡通材质（镜头里要逐帧改颜色 / 发光时用） */
export function toonU(color: C, emissive?: C, ei = 0): THREE.MeshToonMaterial {
  const m = new THREE.MeshToonMaterial({ color, gradientMap: gradientMap() });
  if (emissive !== undefined) { m.emissive = new THREE.Color(emissive); m.emissiveIntensity = ei; }
  return m;
}

// ---------- 拼图块 ----------
const TAB: [number, number][] = [[0.34, 0], [0.4, 0], [0.42, 0.06], [0.38, 0.12], [0.33, 0.2], [0.4, 0.3], [0.5, 0.3], [0.6, 0.3], [0.67, 0.2], [0.62, 0.12], [0.58, 0.06], [0.6, 0], [0.66, 0]];
function edge(s: THREE.Shape, ax: number, ay: number, bx: number, by: number, type: number) {
  if (!type) { s.lineTo(bx, by); return; }
  const dx = bx - ax, dy = by - ay, nx = dy * type, ny = -dx * type;
  const P = (i: number) => { const [u, h] = TAB[i]; return [ax + dx * u + nx * h, ay + dy * u + ny * h]; };
  const a = P(0); s.lineTo(a[0], a[1]);
  for (let i = 1; i < TAB.length; i += 3) { const c1 = P(i), c2 = P(i + 1), e = P(i + 2); s.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], e[0], e[1]); }
  s.lineTo(bx, by);
}
export function pieceShape(t: Tabs, inset = 0.985): THREE.Shape {
  const h = 0.5 * inset; const c = [[-h, -h], [h, -h], [h, h], [-h, h]];
  const s = new THREE.Shape(); s.moveTo(c[0][0], c[0][1]);
  for (let i = 0; i < 4; i++) { const a = c[i], b = c[(i + 1) % 4]; edge(s, a[0], a[1], b[0], b[1], t[i]); }
  return s;
}
const pgCache = new Map<string, THREE.BufferGeometry>();
/** 单位大小的拼图块。flat=true 平躺（顶面在 y=0），false 竖立（正面朝 +Z，厚度居中） */
export function pieceGeo(t: Tabs, depth = 0.2, flat = true): THREE.BufferGeometry {
  const key = t.join(',') + '|' + depth + '|' + (flat ? 1 : 0);
  let g = pgCache.get(key);
  if (!g) {
    const bev = Math.min(0.05, depth * 0.3);
    const eg = new THREE.ExtrudeGeometry(pieceShape(t), { depth, bevelEnabled: true, bevelThickness: bev, bevelSize: bev * 0.8, bevelOffset: -bev * 0.8, bevelSegments: 2, curveSegments: 6 });
    if (flat) { eg.rotateX(-Math.PI / 2); eg.translate(0, -(depth + bev), 0); } else eg.translate(0, 0, -depth / 2);
    g = eg; pgCache.set(key, g);
  }
  return g;
}
const heartCache = new Map<number, THREE.BufferGeometry>();
export function heartGeo(depth = 0.28): THREE.BufferGeometry {
  let g = heartCache.get(depth);
  if (!g) {
    const s = new THREE.Shape();
    s.moveTo(0, -0.5);
    s.bezierCurveTo(-0.15, -0.32, -0.62, -0.1, -0.55, 0.22);
    s.bezierCurveTo(-0.5, 0.52, -0.12, 0.6, 0, 0.32);
    s.bezierCurveTo(0.12, 0.6, 0.5, 0.52, 0.55, 0.22);
    s.bezierCurveTo(0.62, -0.1, 0.15, -0.32, 0, -0.5);
    const eg = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.05, bevelSegments: 3, curveSegments: 14 });
    eg.translate(0, 0, -depth / 2); g = eg; heartCache.set(depth, g);
  }
  return g;
}

// ---------- 天空 ----------
export interface SkyOpts { sun?: { dir: V3; color: C; size?: number; str?: number }; stars?: number; split?: [C, C, C] }
const SKY_V = `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const SKY_F = `uniform vec3 top; uniform vec3 mid; uniform vec3 bot; uniform vec3 top2; uniform vec3 mid2; uniform vec3 bot2; uniform float split;
uniform vec3 sunDir; uniform vec3 sunCol; uniform float sunSize; uniform float sunStr; uniform float stars; uniform float time;
varying vec3 vDir;
float h3(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
vec3 grad(vec3 t, vec3 m, vec3 b, float y){ return y > 0.0 ? mix(m, t, pow(clamp(y, 0.0, 1.0), 0.55)) : mix(m, b, pow(clamp(-y, 0.0, 1.0), 0.45)); }
void main(){
  vec3 d = normalize(vDir);
  vec3 c = grad(top, mid, bot, d.y);
  if (split > 0.5) { vec3 c2 = grad(top2, mid2, bot2, d.y); c = mix(c, c2, smoothstep(-0.035, 0.035, d.x)); }
  float s = max(dot(d, normalize(sunDir)), 0.0);
  c += sunCol * (pow(s, sunSize) * 1.25 + pow(s, 7.0) * 0.16) * sunStr;
  if (stars > 0.0) {
    vec3 q = floor(d * 230.0); float r = h3(q); float tw = 0.55 + 0.45 * sin(time * 2.3 + r * 50.0);
    float side = split > 0.5 ? smoothstep(0.0, 0.08, d.x) : 1.0;
    c += vec3(step(0.9972, r) * tw * stars * smoothstep(-0.05, 0.25, d.y) * side);
  }
  gl_FragColor = vec4(c, 1.0);
  #include <colorspace_fragment>
}`;
export function skyDome(top: C, mid: C, bot: C, o: SkyOpts = {}): THREE.Mesh {
  const col = (c: C) => new THREE.Color(c);
  const sp = o.split ?? [top, mid, bot];
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      top: { value: col(top) }, mid: { value: col(mid) }, bot: { value: col(bot) },
      top2: { value: col(sp[0]) }, mid2: { value: col(sp[1]) }, bot2: { value: col(sp[2]) }, split: { value: o.split ? 1 : 0 },
      sunDir: { value: new THREE.Vector3(...(o.sun?.dir ?? [0, 1, 0])).normalize() }, sunCol: { value: col(o.sun?.color ?? 0x000000) },
      sunSize: { value: o.sun?.size ?? 80 }, sunStr: { value: o.sun?.str ?? (o.sun ? 1 : 0) }, stars: { value: o.stars ?? 0 }, time: { value: 0 },
    },
    vertexShader: SKY_V, fragmentShader: SKY_F,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(500, 32, 18), mat);
  m.renderOrder = -10; m.frustumCulled = false;
  return m;
}
export function skyU(m: THREE.Mesh) { return (m.material as THREE.ShaderMaterial).uniforms; }
/** 天空三色在两组之间插值（镜头里「天亮了」「云散了」用） */
export function lerpSky(m: THREE.Mesh, a: [C, C, C], b: [C, C, C], t: number) {
  const u = skyU(m); const k = clamp(t);
  (['top', 'mid', 'bot'] as const).forEach((n, i) => (u[n].value as THREE.Color).set(a[i]).lerp(new THREE.Color(b[i]), k));
}

// ---------- 贴图 ----------
export function canvasTex(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  draw(cv.getContext('2d')!);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
let _glow: THREE.Texture | null = null, _shadow: THREE.Texture | null = null, _ray: THREE.Texture | null = null;
export function glowTexture() {
  if (!_glow) _glow = canvasTex(128, 128, (c) => {
    const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.22, 'rgba(255,255,255,0.6)'); g.addColorStop(0.55, 'rgba(255,255,255,0.14)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, 128, 128);
  });
  return _glow;
}
export function shadowTexture() {
  if (!_shadow) _shadow = canvasTex(64, 64, (c) => {
    const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.6, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, 64, 64);
  });
  return _shadow;
}
export function rayTexture() {
  if (!_ray) _ray = canvasTex(64, 256, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, 64, 256);
    const h = c.createLinearGradient(0, 0, 64, 0); h.addColorStop(0, 'rgba(0,0,0,1)'); h.addColorStop(0.5, 'rgba(0,0,0,0)'); h.addColorStop(1, 'rgba(0,0,0,1)');
    c.globalCompositeOperation = 'destination-out'; c.fillStyle = h; c.fillRect(0, 0, 64, 256);
  });
  return _ray;
}
export function glowSprite(color: C, size: number, opacity = 1): THREE.Sprite {
  const m = new THREE.SpriteMaterial({ map: glowTexture(), color: new THREE.Color(color), transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
  const s = new THREE.Sprite(m); s.scale.setScalar(size);
  return s;
}
