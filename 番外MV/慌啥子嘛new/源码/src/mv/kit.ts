// 3D 卡通墨线工具包：继承《童话镇》立体书二值卡通渲染与墨线外壳，扩展《慌啥子嘛》山城烟火与日落星夜光影
import * as THREE from 'three';

export const PI = Math.PI;
export const TAU = Math.PI * 2;
export const INK = 0x120d16;
export const timeU = { value: 0 };

export const clamp = (x: number, a: number, b: number) => (x < a ? a : x > b ? b : x);
export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const seg = (x: number, a: number, b: number) => (b <= a ? (x >= b ? 1 : 0) : clamp01((x - a) / (b - a)));
export const ease = (x: number) => {
  const t = clamp01(x);
  return t * t * t * (t * (t * 6 - 15) + 10);
};
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
export const easeIn = (x: number) => {
  const t = clamp01(x);
  return t * t * t;
};
export const backOut = (x: number, s = 1.7) => {
  const t = clamp01(x) - 1;
  return 1 + (s + 1) * t * t * t + s * t * t;
};
export const springPop = (x: number) => {
  const t = clamp01(x);
  if (t <= 0) return 0;
  if (t >= 1) return 1;
  return 1 - Math.exp(-6.5 * t) * Math.cos(t * 9.5);
};
export const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
export const many = <T,>(n: number, f: (i: number) => T): T[] => Array.from({ length: n }, (_, i) => f(i));
export const rgb = (hex: number) =>
  new THREE.Vector3(((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255);
export const cssHex = (hex: number) => `#${hex.toString(16).padStart(6, '0')}`;

// ---------- 阶梯卡通材质 ----------
let grad: THREE.DataTexture | null = null;
export function gradMap(): THREE.DataTexture {
  if (!grad) {
    grad = new THREE.DataTexture(new Uint8Array([96, 108, 188, 255]), 4, 1, THREE.RedFormat);
    grad.minFilter = grad.magFilter = THREE.NearestFilter;
    grad.needsUpdate = true;
  }
  return grad;
}

const toonCache = new Map<number, THREE.MeshToonMaterial>();
export function toon(color: number): THREE.MeshToonMaterial {
  let m = toonCache.get(color);
  if (!m) {
    m = new THREE.MeshToonMaterial({ color, gradientMap: gradMap() });
    toonCache.set(color, m);
  }
  return m;
}

export function toonUnique(color: number, emissive = 0x000000, emissiveIntensity = 0): THREE.MeshToonMaterial {
  return new THREE.MeshToonMaterial({
    color,
    emissive,
    emissiveIntensity,
    gradientMap: gradMap(),
  });
}

export const toonMap = (map: THREE.Texture) => new THREE.MeshToonMaterial({ map, gradientMap: gradMap() });

const basicCache = new Map<number, THREE.MeshBasicMaterial>();
export function basic(color: number): THREE.MeshBasicMaterial {
  let m = basicCache.get(color);
  if (!m) {
    m = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
    basicCache.set(color, m);
  }
  return m;
}

export const glowMat = (color: number, opacity = 1, additive = false) =>
  new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: !additive,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });

export function faceted<T extends THREE.BufferGeometry>(g: T): THREE.BufferGeometry {
  const n = g.index ? g.toNonIndexed() : g;
  n.computeVertexNormals();
  return n;
}

// ---------- 世界近似等宽墨线外壳 ----------
const inkMat = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });
export function mesh(geo: THREE.BufferGeometry, mat: THREE.Material, ink = 0.042): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat);
  if (ink > 0) {
    geo.computeBoundingBox();
    const bb = geo.boundingBox!;
    const size = new THREE.Vector3();
    const c = new THREE.Vector3();
    bb.getSize(size);
    bb.getCenter(c);
    const hull = new THREE.Mesh(geo, inkMat);
    const sx = size.x > 1e-3 ? 1 + (2 * ink) / size.x : 1;
    const sy = size.y > 1e-3 ? 1 + (2 * ink) / size.y : 1;
    const sz = size.z > 1e-3 ? 1 + (2 * ink) / size.z : 1;
    hull.scale.set(sx, sy, sz);
    hull.position.set(c.x * (1 - sx), c.y * (1 - sy), c.z * (1 - sz));
    hull.userData.isInk = true;
    m.add(hull);
  }
  return m;
}

// ---------- 基础体块（原点在底面中心） ----------
export const box = (w: number, h: number, d: number, color: number, ink = 0.042) => {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(0, h / 2, 0);
  return mesh(g, toon(color), ink);
};

export const centerBox = (w: number, h: number, d: number, color: number, ink = 0.04) => {
  const g = new THREE.BoxGeometry(w, h, d);
  return mesh(g, toon(color), ink);
};

export const cyl = (rt: number, rb: number, h: number, color: number, segs = 14, ink = 0.042) => {
  const g = new THREE.CylinderGeometry(rt, rb, h, segs);
  g.translate(0, h / 2, 0);
  return mesh(segs < 8 ? faceted(g) : g, toon(color), ink);
};

export const cone = (r: number, h: number, color: number, segs = 12, ink = 0.042) => {
  const g = new THREE.ConeGeometry(r, h, segs);
  if (segs === 4) g.rotateY(PI / 4);
  g.translate(0, h / 2, 0);
  return mesh(segs < 8 ? faceted(g) : g, toon(color), ink);
};

export const ball = (r: number, color: number, flat = false, ink = 0.042) =>
  mesh(flat ? faceted(new THREE.IcosahedronGeometry(r, 1)) : new THREE.SphereGeometry(r, 18, 12), toon(color), ink);

export const torus = (r: number, tube: number, color: number, segs = 22, ink = 0.036) =>
  mesh(new THREE.TorusGeometry(r, tube, 10, segs), toon(color), ink);

export const roof = (w: number, d: number, h: number, color: number) => {
  const g = new THREE.ConeGeometry(1, h, 4);
  g.rotateY(PI / 4);
  g.scale(w * 0.82, 1, d * 0.82);
  g.translate(0, h / 2, 0);
  return mesh(faceted(g), toon(color), 0.048);
};

export const disc = (r: number, color: number, y = 0, ink = 0) => {
  const g = new THREE.CircleGeometry(r, 48);
  g.rotateX(-PI / 2);
  g.translate(0, y, 0);
  return ink > 0 ? mesh(g, toon(color), ink) : new THREE.Mesh(g, toon(color));
};

export const ringDisc = (rIn: number, rOut: number, color: number, y = 0.02) => {
  const g = new THREE.RingGeometry(rIn, rOut, 40);
  g.rotateX(-PI / 2);
  g.translate(0, y, 0);
  return new THREE.Mesh(g, basic(color));
};

export function put<T extends THREE.Object3D>(
  parent: THREE.Object3D,
  o: T,
  x = 0,
  y = 0,
  z = 0,
  ry = 0,
  s = 1
): T {
  o.position.set(x, y, z);
  o.rotation.y = ry;
  if (s !== 1) o.scale.multiplyScalar(s);
  parent.add(o);
  return o;
}

// ---------- Canvas 贴图 ----------
export function canvasTex(
  w: number,
  h: number,
  draw: (c: CanvasRenderingContext2D) => void,
  srgb = true
): THREE.CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext('2d')!;
  draw(ctx);
  const t = new THREE.CanvasTexture(cv);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}

// ---------- 轮廓手绘特效贴片（零系统字体依赖） ----------
export type FxName =
  | 'star'
  | 'glow'
  | 'heart'
  | 'note'
  | 'bubble'
  | 'butterfly'
  | 'zzz'
  | 'petal'
  | 'smoke'
  | 'ring'
  | 'drop'
  | 'leaf'
  | 'dandelion'
  | 'clover';

const fxCache = new Map<FxName, THREE.Texture>();
export function fxTex(name: FxName): THREE.Texture {
  const hit = fxCache.get(name);
  if (hit) return hit;
  const S = 64;
  const t = canvasTex(S, S, (c) => {
    const radial = (stops: [number, string][], r = S / 2) => {
      const g = c.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, r);
      stops.forEach(([o, col]) => g.addColorStop(o, col));
      c.fillStyle = g;
      c.fillRect(0, 0, S, S);
    };
    if (name === 'glow') {
      radial([
        [0, 'rgba(255,255,255,1)'],
        [0.35, 'rgba(255,255,255,0.52)'],
        [1, 'rgba(255,255,255,0)'],
      ]);
    } else if (name === 'smoke') {
      radial([
        [0, 'rgba(255,255,255,0.82)'],
        [0.55, 'rgba(255,255,255,0.34)'],
        [1, 'rgba(255,255,255,0)'],
      ]);
    } else if (name === 'star') {
      radial([
        [0, 'rgba(255,255,255,1)'],
        [0.3, 'rgba(255,244,190,0.52)'],
        [1, 'rgba(255,220,120,0)'],
      ]);
      c.translate(32, 32);
      c.fillStyle = '#fff';
      c.beginPath();
      c.moveTo(0, -29);
      c.quadraticCurveTo(3.2, -3.2, 29, 0);
      c.quadraticCurveTo(3.2, 3.2, 0, 29);
      c.quadraticCurveTo(-3.2, 3.2, -29, 0);
      c.quadraticCurveTo(-3.2, -3.2, 0, -29);
      c.fill();
    } else if (name === 'heart') {
      c.translate(32, 34);
      c.beginPath();
      c.moveTo(0, 20);
      c.bezierCurveTo(-35, -4, -18, -31, 0, -10);
      c.bezierCurveTo(18, -31, 35, -4, 0, 20);
      c.fillStyle = '#ff6b93';
      c.fill();
      c.lineWidth = 4;
      c.strokeStyle = '#331224';
      c.stroke();
      c.fillStyle = 'rgba(255,255,255,0.8)';
      c.beginPath();
      c.ellipse(-9, -10, 5, 3, -0.6, 0, TAU);
      c.fill();
    } else if (name === 'note') {
      c.strokeStyle = '#18142b';
      c.fillStyle = '#ffd86b';
      c.lineWidth = 4;
      c.lineJoin = 'round';
      c.beginPath();
      c.moveTo(33, 44);
      c.lineTo(33, 10);
      c.lineTo(52, 18);
      c.lineTo(52, 30);
      c.lineTo(33, 22);
      c.closePath();
      c.fill();
      c.stroke();
      c.beginPath();
      c.ellipse(23, 46, 11, 8, -0.4, 0, TAU);
      c.fill();
      c.stroke();
    } else if (name === 'bubble') {
      c.beginPath();
      c.arc(32, 32, 25, 0, TAU);
      c.fillStyle = 'rgba(215,242,255,0.22)';
      c.fill();
      c.lineWidth = 3.5;
      c.strokeStyle = 'rgba(245,252,255,0.95)';
      c.stroke();
      c.beginPath();
      c.arc(32, 32, 17, 3.5, 4.6);
      c.lineWidth = 4.5;
      c.strokeStyle = '#fff';
      c.stroke();
    } else if (name === 'ring') {
      c.beginPath();
      c.arc(32, 32, 26, 0, TAU);
      c.lineWidth = 4.5;
      c.strokeStyle = '#fff';
      c.stroke();
    } else if (name === 'butterfly') {
      c.translate(32, 32);
      c.lineWidth = 3;
      c.strokeStyle = '#3a1f10';
      for (const s of [-1, 1]) {
        c.fillStyle = '#ffd166';
        c.beginPath();
        c.ellipse(s * 14, -7, 13, 10, s * 0.5, 0, TAU);
        c.fill();
        c.stroke();
        c.fillStyle = '#ff96b8';
        c.beginPath();
        c.ellipse(s * 10, 11, 9, 7, -s * 0.5, 0, TAU);
        c.fill();
        c.stroke();
      }
      c.fillStyle = '#3a1f10';
      c.fillRect(-2, -13, 4, 28);
    } else if (name === 'zzz') {
      c.lineWidth = 8;
      c.lineJoin = 'round';
      c.strokeStyle = '#14213d';
      c.fillStyle = '#cfeaff';
      c.beginPath();
      (
        [
          [16, 13],
          [49, 13],
          [49, 19],
          [28, 44.5],
          [49.5, 44.5],
          [49.5, 52],
          [15.5, 52],
          [15.5, 46],
          [36.5, 20.5],
          [16, 20.5],
        ] as const
      ).forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
      c.closePath();
      c.stroke();
      c.fill();
    } else if (name === 'petal') {
      c.translate(32, 32);
      c.rotate(0.55);
      c.fillStyle = '#ffbfd6';
      c.beginPath();
      c.ellipse(0, 0, 22, 12, 0, 0, TAU);
      c.fill();
      c.strokeStyle = '#5a223a';
      c.lineWidth = 2.5;
      c.stroke();
      c.fillStyle = '#ff85b2';
      c.beginPath();
      c.ellipse(7, 0, 9, 5, 0, 0, TAU);
      c.fill();
    } else if (name === 'leaf') {
      c.translate(32, 32);
      c.rotate(-0.5);
      c.fillStyle = '#73d977';
      c.beginPath();
      c.ellipse(0, 0, 23, 10.5, 0, 0, TAU);
      c.fill();
      c.strokeStyle = '#1e5b34';
      c.lineWidth = 3;
      c.stroke();
      c.beginPath();
      c.moveTo(-21, 0);
      c.lineTo(21, 0);
      c.stroke();
    } else if (name === 'drop') {
      radial(
        [
          [0, 'rgba(255,255,255,1)'],
          [0.55, 'rgba(255,228,150,0.95)'],
          [0.82, 'rgba(255,180,90,0.55)'],
          [1, 'rgba(255,160,70,0)'],
        ],
        28
      );
    } else if (name === 'dandelion') {
      // 蒲公英绒伞
      c.translate(32, 32);
      c.strokeStyle = '#fffdf5';
      c.lineWidth = 2.8;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(0, 22);
      c.lineTo(0, -4);
      c.stroke();
      for (let i = 0; i < 9; i++) {
        const a = -PI * 0.85 + (i / 8) * PI * 0.7 - PI * 0.5 + PI * 0.5;
        const ang = -PI * 0.5 + ((i - 4) / 4) * 1.15;
        c.beginPath();
        c.moveTo(0, -4);
        c.lineTo(Math.cos(ang) * 20, -4 + Math.sin(ang) * 20);
        c.stroke();
        void a;
      }
      c.fillStyle = '#ffe29a';
      c.beginPath();
      c.ellipse(0, 23, 3.2, 5, 0, 0, TAU);
      c.fill();
    } else if (name === 'clover') {
      c.translate(32, 32);
      c.fillStyle = '#5ee27a';
      c.strokeStyle = '#184a28';
      c.lineWidth = 3;
      for (let i = 0; i < 4; i++) {
        c.save();
        c.rotate((i * PI) / 2 + PI / 4);
        c.beginPath();
        c.arc(-5, -13, 8, 0, TAU);
        c.arc(5, -13, 8, 0, TAU);
        c.fill();
        c.restore();
      }
      c.fillStyle = '#fff3a1';
      c.beginPath();
      c.arc(0, 0, 5, 0, TAU);
      c.fill();
    }
  });
  fxCache.set(name, t);
  return t;
}

export function sprite(
  name: FxName,
  size = 1,
  color = 0xffffff,
  additive = false,
  opacity = 1
): THREE.Sprite {
  const m = new THREE.SpriteMaterial({
    map: fxTex(name),
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    fog: !additive,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
  const s = new THREE.Sprite(m);
  s.scale.set(size, size, 1);
  return s;
}

export const setOp = (s: THREE.Sprite | THREE.Mesh, o: number) => {
  const op = clamp01(o);
  const mat = s.material as THREE.Material & { opacity?: number; transparent?: boolean };
  mat.transparent = true;
  mat.opacity = op;
  s.visible = op > 0.01;
};

// ---------- 波光溪水着色器 ----------
export function waterMat(base = 0x43b5e8, deep = 0x2268b8, shimmer = 0xffe8a6): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    fog: true,
    uniforms: {
      uTime: timeU,
      uBase: { value: rgb(base) },
      uDeep: { value: rgb(deep) },
      uShim: { value: rgb(shimmer) },
      fogColor: { value: new THREE.Color() },
      fogNear: { value: 1 },
      fogFar: { value: 1000 },
    },
    vertexShader: `varying vec2 vUv;
#include <fog_pars_vertex>
void main(){
  vUv = uv;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: `uniform float uTime;
uniform vec3 uBase;
uniform vec3 uDeep;
uniform vec3 uShim;
varying vec2 vUv;
#include <fog_pars_fragment>
void main(){
  float d = abs(vUv.x - 0.5) * 2.0;
  vec3 col = mix(uDeep, uBase, smoothstep(0.0, 0.85, d));
  float wave = sin(vUv.y * 1.4 - uTime * 1.8 + sin(vUv.x * 9.0) * 0.7);
  float sp = step(0.86, fract(vUv.y * 0.25 - uTime * 0.42 + floor(vUv.x * 7.0) * 0.37));
  col = mix(col, uShim, sp * 0.55 + max(0.0, wave) * 0.08);
  float edge = step(0.93, d);
  col = mix(col, vec3(0.98, 0.99, 1.0), edge * 0.75);
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`,
  });
}

export function ribbon(
  curve: THREE.Curve<THREE.Vector3>,
  width: number,
  segs: number,
  mat: THREE.Material,
  y = 0.05
): THREE.Mesh {
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  let dist = 0;
  let prev: THREE.Vector3 | null = null;
  for (let i = 0; i <= segs; i++) {
    const u = i / segs;
    const p = curve.getPointAt(u);
    const tan = curve.getTangentAt(u);
    const n = new THREE.Vector3(-tan.z, 0, tan.x).normalize().multiplyScalar(width / 2);
    if (prev) dist += p.distanceTo(prev);
    prev = p;
    pos.push(p.x + n.x, p.y + y, p.z + n.z, p.x - n.x, p.y + y, p.z - n.z);
    uv.push(0, dist, 1, dist);
    if (i < segs) {
      const a = i * 2;
      idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return new THREE.Mesh(g, mat);
}

// ---------- 天空穹顶与漫天繁星 ----------
export function makeSky(): THREE.Mesh {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
    fog: false,
    uniforms: {
      top: { value: new THREE.Vector3() },
      mid: { value: new THREE.Vector3() },
      hor: { value: new THREE.Vector3() },
      low: { value: new THREE.Vector3() },
    },
    vertexShader: `varying vec3 vDir;
void main(){
  vDir = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`,
    fragmentShader: `uniform vec3 top;
uniform vec3 mid;
uniform vec3 hor;
uniform vec3 low;
varying vec3 vDir;
void main(){
  float y = normalize(vDir).y;
  vec3 c;
  if (y > 0.0) {
    float t1 = smoothstep(0.0, 0.32, y);
    float t2 = smoothstep(0.24, 0.92, y);
    c = mix(hor, mid, t1);
    c = mix(c, top, t2);
  } else {
    c = mix(hor, low, pow(min(-y * 5.0, 1.0), 0.7));
  }
  gl_FragColor = vec4(c, 1.0);
}`,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(600, 24, 16), mat);
  m.renderOrder = -10;
  m.frustumCulled = false;
  return m;
}

export function makeStars(): THREE.Points {
  const pos: number[] = [];
  const col: number[] = [];
  for (let i = 0; i < 620; i++) {
    const a = hash(i * 1.73) * TAU;
    const e = Math.asin(0.05 + hash(i * 3.11 + 5) * 0.93);
    const r = 555;
    pos.push(Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, Math.sin(a) * Math.cos(e) * r);
    const warm = i % 4 === 0;
    col.push(warm ? 1.0 : 0.9, warm ? 0.94 : 0.95, warm ? 0.76 : 1.0);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  const p = new THREE.Points(
    g,
    new THREE.PointsMaterial({
      color: 0xffffff,
      vertexColors: true,
      size: 2.8,
      sizeAttenuation: false,
      transparent: true,
      opacity: 1,
      depthTest: false,
      depthWrite: false,
      fog: false,
    })
  );
  p.renderOrder = -9;
  p.frustumCulled = false;
  return p;
}

// ---------- 光照预设（专为《慌啥子嘛》午后茶院→日落→升月→星夜→晨曦情绪弧线打造） ----------
export interface Look {
  top: number;
  mid: number;
  hor: number;
  fog: [number, number];
  sun: number;
  sunI: number;
  dir: [number, number, number];
  amb: number;
  ambI: number;
  card: number;
  stars: number;
}

export const LOOKS = {
  // 序章/尾声：温暖胡桃木书桌台灯光
  stage: {
    top: 0x1a1024,
    mid: 0x331c33,
    hor: 0x5c2e38,
    fog: [20, 115] as [number, number],
    sun: 0xffe4b5,
    sunI: 2.55,
    dir: [0.25, 0.85, 0.75] as [number, number, number],
    amb: 0x9b7282,
    ambI: 1.45,
    card: 0xfff3e2,
    stars: 0.15,
  },
  // 坝坝茶院：暖金午后阳光
  teahouse: {
    top: 0x5ea6e8,
    mid: 0xaad4f0,
    hor: 0xffe6ba,
    fog: [42, 290] as [number, number],
    sun: 0xfff0cc,
    sunI: 2.55,
    dir: [0.55, 0.72, 0.5] as [number, number, number],
    amb: 0xd8c8ff,
    ambI: 1.55,
    card: 0xfff8ee,
    stars: 0,
  },
  // 云在花开：通透晴朗山坡
  meadow: {
    top: 0x3b8ae3,
    mid: 0x7fc4f5,
    hor: 0xd8f1ff,
    fog: [48, 330] as [number, number],
    sun: 0xfff6dd,
    sunI: 2.5,
    dir: [0.48, 0.82, 0.48] as [number, number, number],
    amb: 0xc2d8ff,
    ambI: 1.62,
    card: 0xffffff,
    stars: 0,
  },
  // 琥珀暖金：好运灯亭与傍晚暖巷
  golden: {
    top: 0xe07b58,
    mid: 0xf7ab6c,
    hor: 0xffe0a8,
    fog: [38, 270] as [number, number],
    sun: 0xffc47d,
    sunI: 2.65,
    dir: [-0.62, 0.44, 0.48] as [number, number, number],
    amb: 0xb095dc,
    ambI: 1.5,
    card: 0xfff0dc,
    stars: 0.08,
  },
  // 太阳下山：绯橙霞光
  sunset: {
    top: 0x5f347d,
    mid: 0xd96b6c,
    hor: 0xffba75,
    fog: [42, 290] as [number, number],
    sun: 0xffad73,
    sunI: 2.5,
    dir: [-0.7, 0.36, 0.45] as [number, number, number],
    amb: 0xa27ee0,
    ambI: 1.52,
    card: 0xffeadc,
    stars: 0.28,
  },
  // 暮色微醺：紫粉晚风
  dusk: {
    top: 0x342469,
    mid: 0x7b4899,
    hor: 0xf0957d,
    fog: [38, 270] as [number, number],
    sun: 0xffbe9e,
    sunI: 2.25,
    dir: [0.5, 0.5, 0.55] as [number, number, number],
    amb: 0x907cd8,
    ambI: 1.55,
    card: 0xffe8e4,
    stars: 0.55,
  },
  // 月亮爬上来：靛蓝月华
  moonrise: {
    top: 0x12194a,
    mid: 0x2c3b82,
    hor: 0x7570b8,
    fog: [36, 260] as [number, number],
    sun: 0xffe8b8,
    sunI: 2.2,
    dir: [0.55, 0.65, 0.52] as [number, number, number],
    amb: 0x7685d6,
    ambI: 1.65,
    card: 0xe8ecff,
    stars: 0.9,
  },
  // 静谧夜空：清风与蒲公英
  night: {
    top: 0x0b1238,
    mid: 0x1d2b6b,
    hor: 0x45519c,
    fog: [34, 245] as [number, number],
    sun: 0xc8daff,
    sunI: 2.15,
    dir: [-0.38, 0.76, 0.52] as [number, number, number],
    amb: 0x6f7bd4,
    ambI: 1.72,
    card: 0xe2e8ff,
    stars: 1,
  },
  // 枕着星光：梦幻星河绒蓝
  starbed: {
    top: 0x13103d,
    mid: 0x2e2573,
    hor: 0x6c58b5,
    fog: [32, 235] as [number, number],
    sun: 0xffe9bd,
    sunI: 2.25,
    dir: [0.3, 0.8, 0.55] as [number, number, number],
    amb: 0x897ae0,
    ambI: 1.68,
    card: 0xf0eaff,
    stars: 1,
  },
  // 月下竹亭：清翠微醺
  bamboo: {
    top: 0x0f263b,
    mid: 0x215263,
    hor: 0x5c968e,
    fog: [26, 185] as [number, number],
    sun: 0xfff0c4,
    sunI: 2.2,
    dir: [0.4, 0.78, 0.5] as [number, number, number],
    amb: 0x78b2a8,
    ambI: 1.6,
    card: 0xe8f7f2,
    stars: 0.72,
  },
  // 归家暖屋：橘灯木屋
  cozy: {
    top: 0x2b1b2e,
    mid: 0x593440,
    hor: 0xa86452,
    fog: [24, 140] as [number, number],
    sun: 0xffdca6,
    sunI: 2.5,
    dir: [0.35, 0.75, 0.65] as [number, number, number],
    amb: 0xc29382,
    ambI: 1.55,
    card: 0xfff2e2,
    stars: 0,
  },
  // 人生路远：杏粉晨曦
  dawn: {
    top: 0x4b7cd4,
    mid: 0xb29ad9,
    hor: 0xffd7b0,
    fog: [44, 310] as [number, number],
    sun: 0xffe8c2,
    sunI: 2.55,
    dir: [0.55, 0.52, 0.5] as [number, number, number],
    amb: 0xc8bce8,
    ambI: 1.6,
    card: 0xfff5ec,
    stars: 0.18,
  },
  // 终章灯会：暖金暮夜团圆
  festival: {
    top: 0x1c1752,
    mid: 0x59357d,
    hor: 0xf29f6d,
    fog: [38, 275] as [number, number],
    sun: 0xffe0a8,
    sunI: 2.55,
    dir: [0.35, 0.7, 0.6] as [number, number, number],
    amb: 0xa685db,
    ambI: 1.62,
    card: 0xfff2e4,
    stars: 0.85,
  },
} as const satisfies Record<string, Look>;

export type LookName = keyof typeof LOOKS;

export function mixColorHex(a: number, b: number, t: number): THREE.Color {
  return new THREE.Color(a).lerp(new THREE.Color(b), clamp01(t));
}
