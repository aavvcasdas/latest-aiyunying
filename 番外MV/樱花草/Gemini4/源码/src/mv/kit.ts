// 软3D绘本材质、灯光预设与《樱花草》原创三维布景道具库
import * as THREE from 'three';

export const PI = Math.PI;
export const TAU = Math.PI * 2;

export const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const clamp01 = (v: number) => clamp(v, 0, 1);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const seg = (u: number, a: number, b: number) => clamp01((u - a) / Math.max(1e-5, b - a));
export const ease = (t: number) => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
export const easeIn = (t: number) => Math.pow(clamp01(t), 2.6);
export const backOut = (t: number, s = 1.85) => {
  const x = clamp01(t) - 1;
  return 1 + x * x * ((s + 1) * x + s);
};
export const elasticPop = (t: number) => {
  const x = clamp01(t);
  if (x <= 0 || x >= 1) return x;
  return Math.pow(2, -9 * x) * Math.sin((x * 8 - 0.75) * ((2 * PI) / 3)) + 1;
};
export const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
};
export const many = <T,>(n: number, fn: (i: number) => T): T[] =>
  Array.from({ length: n }, (_, i) => fn(i));

export function put<T extends THREE.Object3D>(
  parent: THREE.Object3D,
  child: T,
  x = 0,
  y = 0,
  z = 0
): T {
  child.position.set(x, y, z);
  parent.add(child);
  return child;
}

// ── 十四套场景情绪灯光与三段渐变天幕 ─────────────────────────────────────
export type LookName =
  | 'desk'
  | 'bamboo'
  | 'firefly'
  | 'galaxy'
  | 'veranda'
  | 'stream'
  | 'spring'
  | 'blush'
  | 'musicbox'
  | 'lullaby'
  | 'beach'
  | 'dream'
  | 'sunset'
  | 'finale';

export interface LookSpec {
  skyTop: number;
  skyMid: number;
  skyBot: number;
  fog: number;
  fogNear: number;
  fogFar: number;
  hemiSky: number;
  hemiGround: number;
  hemiInt: number;
  keyCol: number;
  keyInt: number;
  keyPos: [number, number, number];
  rimCol: number;
  rimInt: number;
  rimPos: [number, number, number];
  stars: number; // 0..1 星空可见度
}

export const LOOKS: Record<LookName, LookSpec> = {
  desk: {
    skyTop: 0x10132b, skyMid: 0x1d2248, skyBot: 0x362a4c,
    fog: 0x221f3d, fogNear: 16, fogFar: 62,
    hemiSky: 0x9ab4ff, hemiGround: 0x6b4330, hemiInt: 0.95,
    keyCol: 0xffd79a, keyInt: 1.45, keyPos: [-7, 11, 8],
    rimCol: 0x8ec5ff, rimInt: 0.72, rimPos: [9, 8, -9],
    stars: 0.55,
  },
  bamboo: {
    skyTop: 0x0b1830, skyMid: 0x153252, skyBot: 0x2c5c68,
    fog: 0x1f4959, fogNear: 14, fogFar: 68,
    hemiSky: 0xaad8ff, hemiGround: 0x27493d, hemiInt: 1.0,
    keyCol: 0xe6f2ff, keyInt: 1.35, keyPos: [8, 14, -6],
    rimCol: 0x8ef0c8, rimInt: 0.65, rimPos: [-8, 7, 10],
    stars: 0.75,
  },
  firefly: {
    skyTop: 0x0b162c, skyMid: 0x162d49, skyBot: 0x294b4a,
    fog: 0x1e3c44, fogNear: 15, fogFar: 72,
    hemiSky: 0x9ec4ff, hemiGround: 0x3b4d2b, hemiInt: 1.0,
    keyCol: 0xffe89c, keyInt: 1.25, keyPos: [6, 12, 8],
    rimCol: 0xb7ff7a, rimInt: 0.65, rimPos: [-9, 6, -7],
    stars: 0.85,
  },
  galaxy: {
    skyTop: 0x070c24, skyMid: 0x161f52, skyBot: 0x393472,
    fog: 0x252459, fogNear: 20, fogFar: 95,
    hemiSky: 0xb6ccff, hemiGround: 0x342a58, hemiInt: 1.05,
    keyCol: 0xdbe9ff, keyInt: 1.3, keyPos: [5, 15, 9],
    rimCol: 0xffa8df, rimInt: 0.68, rimPos: [-10, 9, -8],
    stars: 1.0,
  },
  veranda: {
    skyTop: 0x111a3b, skyMid: 0x243466, skyBot: 0x524672,
    fog: 0x353660, fogNear: 15, fogFar: 70,
    hemiSky: 0xb8ccff, hemiGround: 0x6b4738, hemiInt: 1.05,
    keyCol: 0xffd194, keyInt: 1.4, keyPos: [-6, 10, 9],
    rimCol: 0x8ce4ff, rimInt: 0.65, rimPos: [9, 9, -8],
    stars: 0.72,
  },
  stream: {
    skyTop: 0x5ea9e6, skyMid: 0x9bd4f5, skyBot: 0xebfff6,
    fog: 0xd9f5f0, fogNear: 18, fogFar: 82,
    hemiSky: 0xffffff, hemiGround: 0x7cb88c, hemiInt: 1.18,
    keyCol: 0xfff5dc, keyInt: 1.32, keyPos: [9, 15, 10],
    rimCol: 0xffc2d9, rimInt: 0.5, rimPos: [-9, 8, -8],
    stars: 0.0,
  },
  spring: {
    skyTop: 0x74b8f2, skyMid: 0xbadcf8, skyBot: 0xffe6ef,
    fog: 0xf9e5ee, fogNear: 18, fogFar: 84,
    hemiSky: 0xfffafd, hemiGround: 0x8bc48a, hemiInt: 1.22,
    keyCol: 0xfff4de, keyInt: 1.35, keyPos: [8, 15, 11],
    rimCol: 0xffadc8, rimInt: 0.58, rimPos: [-10, 8, -7],
    stars: 0.0,
  },
  blush: {
    skyTop: 0x9ca9e8, skyMid: 0xe6bedb, skyBot: 0xffe4d9,
    fog: 0xf5d6e2, fogNear: 16, fogFar: 76,
    hemiSky: 0xfff5fa, hemiGround: 0x9e7688, hemiInt: 1.2,
    keyCol: 0xffead1, keyInt: 1.35, keyPos: [7, 13, 10],
    rimCol: 0xff9ec2, rimInt: 0.68, rimPos: [-8, 8, -8],
    stars: 0.15,
  },
  musicbox: {
    skyTop: 0x7eb4f0, skyMid: 0xc9cbf7, skyBot: 0xffeadc,
    fog: 0xeee0f2, fogNear: 17, fogFar: 78,
    hemiSky: 0xffffff, hemiGround: 0x95b89c, hemiInt: 1.22,
    keyCol: 0xfff2d6, keyInt: 1.32, keyPos: [8, 14, 10],
    rimCol: 0xb6f2e2, rimInt: 0.55, rimPos: [-9, 8, -8],
    stars: 0.18,
  },
  lullaby: {
    skyTop: 0x0d1533, skyMid: 0x1e2f5e, skyBot: 0x3b4d78,
    fog: 0x283861, fogNear: 15, fogFar: 74,
    hemiSky: 0xb4cbff, hemiGround: 0x2c454a, hemiInt: 1.05,
    keyCol: 0xffe9b5, keyInt: 1.28, keyPos: [7, 13, 8],
    rimCol: 0x8fe6d9, rimInt: 0.62, rimPos: [-9, 7, -8],
    stars: 0.85,
  },
  beach: {
    skyTop: 0x0b1838, skyMid: 0x1a3868, skyBot: 0x3b6d8c,
    fog: 0x2a5375, fogNear: 18, fogFar: 86,
    hemiSky: 0xbae0ff, hemiGround: 0x6b6a7a, hemiInt: 1.12,
    keyCol: 0xffe7a8, keyInt: 1.38, keyPos: [6, 12, -8],
    rimCol: 0x8ceeff, rimInt: 0.65, rimPos: [-8, 8, 10],
    stars: 0.9,
  },
  dream: {
    skyTop: 0x2c2559, skyMid: 0x674c94, skyBot: 0xd99bc4,
    fog: 0x7c5ca0, fogNear: 16, fogFar: 78,
    hemiSky: 0xffe6f7, hemiGround: 0x5c4480, hemiInt: 1.18,
    keyCol: 0xfff0cc, keyInt: 1.32, keyPos: [7, 13, 9],
    rimCol: 0xffa8dc, rimInt: 0.72, rimPos: [-9, 7, -7],
    stars: 0.78,
  },
  sunset: {
    skyTop: 0x433b7a, skyMid: 0xb8668e, skyBot: 0xffc699,
    fog: 0xd98ca0, fogNear: 18, fogFar: 84,
    hemiSky: 0xffe9dc, hemiGround: 0x755268, hemiInt: 1.16,
    keyCol: 0xffd299, keyInt: 1.42, keyPos: [9, 11, -6],
    rimCol: 0xff9ec7, rimInt: 0.68, rimPos: [-8, 9, 10],
    stars: 0.38,
  },
  finale: {
    skyTop: 0x6eb5f5, skyMid: 0xf0c2dc, skyBot: 0xfff0d9,
    fog: 0xf8dfea, fogNear: 20, fogFar: 92,
    hemiSky: 0xfffdf8, hemiGround: 0x9ec494, hemiInt: 1.25,
    keyCol: 0xfff4d8, keyInt: 1.4, keyPos: [8, 15, 10],
    rimCol: 0xffa6c9, rimInt: 0.68, rimPos: [-10, 9, -8],
    stars: 0.12,
  },
};

// ── 柔光奶油软3D渐变贴图 & 材质缓存 ──────────────────────────────────────
let softRamp: THREE.DataTexture | null = null;
function getSoftRamp(): THREE.DataTexture {
  if (softRamp) return softRamp;
  const n = 64;
  const data = new Uint8Array(n * 4);
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    // 柔和奶油过渡：暗部不死黑（0.52 起步），中调饱满，高光圆润
    const v =
      0.52 +
      0.24 * ease(seg(u, 0.08, 0.45)) +
      0.17 * ease(seg(u, 0.42, 0.78)) +
      0.07 * ease(seg(u, 0.76, 0.98));
    const byte = Math.round(clamp01(v) * 255);
    data[i * 4] = byte;
    data[i * 4 + 1] = byte;
    data[i * 4 + 2] = byte;
    data[i * 4 + 3] = 255;
  }
  softRamp = new THREE.DataTexture(data, n, 1, THREE.RGBAFormat);
  softRamp.minFilter = THREE.LinearFilter;
  softRamp.magFilter = THREE.LinearFilter;
  softRamp.needsUpdate = true;
  return softRamp;
}

const matCache = new Map<string, THREE.Material>();

/** 奶油软3D漫反射材质（柔和色阶 + 可选自发光） */
export function clay(color: number, emissive = 0x000000, emInt = 0): THREE.MeshToonMaterial {
  const key = `c:${color}:${emissive}:${emInt.toFixed(2)}`;
  const hit = matCache.get(key) as THREE.MeshToonMaterial | undefined;
  if (hit) return hit;
  const m = new THREE.MeshToonMaterial({
    color,
    gradientMap: getSoftRamp(),
    emissive,
    emissiveIntensity: emInt,
  });
  matCache.set(key, m);
  return m;
}

/** 独立可调透明度的柔光材质（不共享实例，方便逐帧改 opacity） */
export function glass(color: number, opacity = 0.65, additive = false): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    depthWrite: !additive && opacity > 0.85,
    side: THREE.DoubleSide,
  });
}

/** 自发光柔亮材质 */
export function glow(color: number, opacity = 1, additive = false): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: opacity < 1 || additive,
    opacity,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    depthWrite: !additive && opacity >= 0.95,
  });
}

// ── 精灵程序贴图（光晕、星芒、花瓣、爱心、圆泡、竹叶）────────────────────
export type SpriteKind = 'glow' | 'star' | 'petal' | 'heart' | 'bubble' | 'leaf' | 'coin';
const spriteTexCache = new Map<SpriteKind, THREE.CanvasTexture>();

export function spriteTex(kind: SpriteKind): THREE.CanvasTexture {
  const cached = spriteTexCache.get(kind);
  if (cached) return cached;
  const S = 128;
  const cv = document.createElement('canvas');
  cv.width = S;
  cv.height = S;
  const g = cv.getContext('2d')!;
  const C = S / 2;

  if (kind === 'glow') {
    const gr = g.createRadialGradient(C, C, 2, C, C, C);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.28, 'rgba(255,255,255,0.68)');
    gr.addColorStop(0.65, 'rgba(255,255,255,0.16)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, S, S);
  } else if (kind === 'star') {
    const gr = g.createRadialGradient(C, C, 1, C, C, C * 0.92);
    gr.addColorStop(0, 'rgba(255,255,255,1)');
    gr.addColorStop(0.3, 'rgba(255,255,255,0.45)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, S, S);
    g.fillStyle = '#ffffff';
    g.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = (i * PI) / 4;
      const r = i % 2 === 0 ? C * 0.88 : C * 0.2;
      const x = C + Math.cos(a) * r;
      const y = C + Math.sin(a) * r;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.closePath();
    g.fill();
  } else if (kind === 'petal') {
    // 樱花草标志性心形缺口花瓣
    g.translate(C, C);
    const gr = g.createLinearGradient(0, -44, 0, 46);
    gr.addColorStop(0, 'rgba(255,255,255,0.98)');
    gr.addColorStop(0.75, 'rgba(255,235,244,0.95)');
    gr.addColorStop(1, 'rgba(255,255,255,0.85)');
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(0, 44);
    g.bezierCurveTo(-36, 16, -42, -26, -16, -38);
    g.bezierCurveTo(-6, -42, -2, -28, 0, -24);
    g.bezierCurveTo(2, -28, 6, -42, 16, -38);
    g.bezierCurveTo(42, -26, 36, 16, 0, 44);
    g.closePath();
    g.fill();
  } else if (kind === 'heart') {
    g.translate(C, C + 6);
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.moveTo(0, 36);
    g.bezierCurveTo(-48, 6, -48, -36, -20, -40);
    g.bezierCurveTo(-6, -42, 0, -28, 0, -22);
    g.bezierCurveTo(0, -28, 6, -42, 20, -40);
    g.bezierCurveTo(48, -36, 48, 6, 0, 36);
    g.closePath();
    g.fill();
  } else if (kind === 'bubble') {
    const gr = g.createRadialGradient(C - 12, C - 14, 4, C, C, C * 0.86);
    gr.addColorStop(0, 'rgba(255,255,255,0.55)');
    gr.addColorStop(0.65, 'rgba(255,255,255,0.14)');
    gr.addColorStop(0.88, 'rgba(255,255,255,0.68)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.beginPath();
    g.arc(C, C, C * 0.86, 0, TAU);
    g.fill();
    g.fillStyle = 'rgba(255,255,255,0.9)';
    g.beginPath();
    g.ellipse(C - 18, C - 20, 11, 6, -0.6, 0, TAU);
    g.fill();
  } else if (kind === 'leaf') {
    g.translate(C, C);
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.moveTo(0, -48);
    g.quadraticCurveTo(22, 0, 0, 48);
    g.quadraticCurveTo(-22, 0, 0, -48);
    g.closePath();
    g.fill();
  } else if (kind === 'coin') {
    // 「满山飞舞的钱币」——柔光外圆内方古币萤光贴片
    const gr = g.createRadialGradient(C, C, 4, C, C, C);
    gr.addColorStop(0, 'rgba(255,255,230,0.95)');
    gr.addColorStop(0.45, 'rgba(255,235,150,0.55)');
    gr.addColorStop(1, 'rgba(255,220,100,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, S, S);
    g.strokeStyle = 'rgba(255,252,220,0.95)';
    g.lineWidth = 8;
    g.beginPath();
    g.arc(C, C, 34, 0, TAU);
    g.stroke();
    g.lineWidth = 5;
    g.strokeRect(C - 11, C - 11, 22, 22);
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.needsUpdate = true;
  spriteTexCache.set(kind, tex);
  return tex;
}

export function makeSprite(
  kind: SpriteKind,
  scale = 0.5,
  color = 0xffffff,
  additive = false,
  opacity = 1
): THREE.Sprite {
  const mat = new THREE.SpriteMaterial({
    map: spriteTex(kind),
    color,
    transparent: true,
    opacity,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    depthWrite: false,
  });
  const s = new THREE.Sprite(mat);
  s.scale.setScalar(scale);
  return s;
}

export function setSpriteOp(s: THREE.Sprite, op: number): void {
  s.material.opacity = clamp01(op);
}

// ── 天幕球与星空层 ───────────────────────────────────────────────────────
export function createSkyDome(): {
  mesh: THREE.Mesh;
  top: THREE.Color;
  mid: THREE.Color;
  bot: THREE.Color;
} {
  const top = new THREE.Color(0x0b1830);
  const mid = new THREE.Color(0x153252);
  const bot = new THREE.Color(0x2c5c68);
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      cTop: { value: top },
      cMid: { value: mid },
      cBot: { value: bot },
    },
    vertexShader: `
      varying float vH;
      void main() {
        vH = normalize(position).y;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 cTop;
      uniform vec3 cMid;
      uniform vec3 cBot;
      varying float vH;
      void main() {
        float h = clamp(vH, -0.2, 1.0);
        vec3 col = h < 0.22
          ? mix(cBot, cMid, smoothstep(-0.08, 0.22, h))
          : mix(cMid, cTop, smoothstep(0.22, 0.85, h));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(210, 28, 20), mat);
  return { mesh, top, mid, bot };
}

export function createStarField(count = 460): {
  points: THREE.Points;
  mat: THREE.PointsMaterial;
} {
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const palette = [
    new THREE.Color(0xffffff),
    new THREE.Color(0xfff1c4),
    new THREE.Color(0xc7e4ff),
    new THREE.Color(0xffd4ec),
  ];
  for (let i = 0; i < count; i++) {
    const th = hash(i * 3.1 + 1) * TAU;
    const y = 0.07 + hash(i * 5.7 + 2) * 0.88;
    const r = 165 * Math.sqrt(Math.max(0, 1 - y * y));
    pos[i * 3] = Math.cos(th) * r;
    pos[i * 3 + 1] = 165 * y;
    pos[i * 3 + 2] = Math.sin(th) * r;
    const c = palette[i % palette.length];
    col[i * 3] = c.r;
    col[i * 3 + 1] = c.g;
    col[i * 3 + 2] = c.b;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({
    size: 1.55,
    map: spriteTex('glow'),
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
  });
  return { points: new THREE.Points(geo, mat), mat };
}

// ── 基础软3D几何积木 ─────────────────────────────────────────────────────
export function ground(radius = 120, color = 0x7bc988): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CircleGeometry(radius, 48), clay(color));
  m.rotation.x = -PI / 2;
  m.receiveShadow = true;
  return m;
}

export function softHill(rx: number, h: number, rz: number, color: number): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 14, 0, TAU, 0, PI * 0.55), clay(color));
  m.scale.set(rx, h, rz);
  return m;
}

export function pebble(r = 0.5, color = 0xdad5cc, yScale = 0.42): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), clay(color));
  m.scale.y = yScale;
  return m;
}

export function roundCyl(
  rt: number,
  rb: number,
  h: number,
  color: number,
  segN = 16,
  emissive = 0x000000,
  emInt = 0
): THREE.Mesh {
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(rt, rb, h, segN),
    clay(color, emissive, emInt)
  );
  m.position.y = h / 2;
  return m;
}

export function softBox(w: number, h: number, d: number, color: number, r = 0.06): THREE.Mesh {
  if (r <= 0.001) {
    return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), clay(color));
  }
  const rr = Math.min(r, w * 0.4, h * 0.4, d * 0.4);
  const hw = w / 2 - rr;
  const hh = h / 2 - rr;
  const sh = new THREE.Shape();
  sh.moveTo(-hw, -hh - rr);
  sh.lineTo(hw, -hh - rr);
  sh.quadraticCurveTo(hw + rr, -hh - rr, hw + rr, -hh);
  sh.lineTo(hw + rr, hh);
  sh.quadraticCurveTo(hw + rr, hh + rr, hw, hh + rr);
  sh.lineTo(-hw, hh + rr);
  sh.quadraticCurveTo(-hw - rr, hh + rr, -hw - rr, hh);
  sh.lineTo(-hw - rr, -hh);
  sh.quadraticCurveTo(-hw - rr, -hh - rr, -hw, -hh - rr);
  const geo = new THREE.ExtrudeGeometry(sh, {
    depth: Math.max(0.01, d - rr * 2),
    bevelEnabled: true,
    bevelThickness: rr,
    bevelSize: rr * 0.85,
    bevelSegments: 3,
  });
  geo.center();
  return new THREE.Mesh(geo, clay(color));
}

export function backdropHills(parent: THREE.Object3D, c1: number, c2: number, dist = 78): void {
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU + 0.18;
    const r = 18 + hash(i * 3 + 1) * 14;
    const h = 6.5 + hash(i * 5 + 2) * 9.5;
    const hill = softHill(r, h, r * 0.85, i % 2 === 0 ? c1 : c2);
    put(parent, hill, Math.cos(a) * dist, -0.6, Math.sin(a) * dist);
  }
}

export function softCloud(seed: number, scale = 1, color = 0xfff8fb): THREE.Group {
  const g = new THREE.Group();
  const puffs: Array<[number, number, number, number]> = [
    [0, 0.25, 0, 0.95],
    [-0.85, 0.05, 0.08, 0.72],
    [0.88, 0.08, -0.05, 0.76],
    [-0.38, 0.48, -0.1, 0.65],
    [0.42, 0.44, 0.1, 0.62],
  ];
  puffs.forEach(([x, y, z, r], i) => {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(r * (0.92 + hash(seed + i) * 0.16), 16, 12),
      clay(color, color, 0.12)
    );
    m.scale.y = 0.78;
    put(g, m, x, y, z);
  });
  g.scale.setScalar(scale);
  return g;
}

// ── 标志性道具一：五瓣心形软3D樱花草（Primula sieboldii）─────────────────
let petalGeoCache: THREE.ExtrudeGeometry | null = null;
let leafGeoCache: THREE.ExtrudeGeometry | null = null;

function getPrimrosePetalGeo(): THREE.ExtrudeGeometry {
  if (petalGeoCache) return petalGeoCache;
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(-0.22, 0.14, -0.28, 0.42, -0.11, 0.52);
  s.bezierCurveTo(-0.04, 0.55, -0.01, 0.43, 0, 0.41); // 心形凹口
  s.bezierCurveTo(0.01, 0.43, 0.04, 0.55, 0.11, 0.52);
  s.bezierCurveTo(0.28, 0.42, 0.22, 0.14, 0, 0);
  petalGeoCache = new THREE.ExtrudeGeometry(s, {
    depth: 0.035,
    bevelEnabled: true,
    bevelThickness: 0.028,
    bevelSize: 0.022,
    bevelSegments: 3,
  });
  return petalGeoCache;
}

function getPrimroseLeafGeo(): THREE.ExtrudeGeometry {
  if (leafGeoCache) return leafGeoCache;
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(-0.24, 0.08, -0.26, 0.36, 0, 0.52);
  s.bezierCurveTo(0.26, 0.36, 0.24, 0.08, 0, 0);
  leafGeoCache = new THREE.ExtrudeGeometry(s, {
    depth: 0.025,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.016,
    bevelSegments: 2,
  });
  return leafGeoCache;
}

/** 只有五瓣花冠的软3D樱花草花头（可用于特写、字幕挂饰、水面漂花、星座） */
export function primroseBlossom(
  scale = 1,
  petalColor = 0xff8ab5,
  glowAmt = 0.22
): THREE.Group {
  const g = new THREE.Group();
  const pGeo = getPrimrosePetalGeo();
  const pMat = clay(petalColor, petalColor, glowAmt);
  for (let i = 0; i < 5; i++) {
    const holder = new THREE.Group();
    holder.rotation.y = (i / 5) * TAU;
    const petal = new THREE.Mesh(pGeo, pMat);
    petal.rotation.x = -PI / 2 + 0.34; // 微向上捧起的温柔碗状
    holder.add(petal);
    g.add(holder);
  }
  // 奶白色花喉 + 鹅黄圆润花蕊
  const throat = new THREE.Mesh(
    new THREE.SphereGeometry(0.125, 14, 10),
    clay(0xfff8fc, 0xffffff, 0.25)
  );
  throat.scale.y = 0.52;
  put(g, throat, 0, 0.04, 0);
  const center = new THREE.Mesh(
    new THREE.SphereGeometry(0.082, 12, 10),
    clay(0xffd85e, 0xffc83d, 0.38)
  );
  center.scale.y = 0.72;
  put(g, center, 0, 0.08, 0);
  g.scale.setScalar(scale);
  return g;
}

/** 带花茎与柔绿叶片的完整一株樱花草 */
export function primrosePlant(
  scale = 1,
  petalColor = 0xff8ab5,
  glowAmt = 0.22
): THREE.Group {
  const g = new THREE.Group();
  const stemH = 0.56;
  put(g, roundCyl(0.026, 0.034, stemH, 0x5db870, 8), 0, 0, 0);
  const head = primroseBlossom(0.76, petalColor, glowAmt);
  head.rotation.x = 0.62; // 温柔朝向镜头舒展五片心形缺口花瓣
  put(g, head, 0, stemH, 0.04);

  const lGeo = getPrimroseLeafGeo();
  const lMat = clay(0x63c276, 0x3b8f52, 0.06);
  for (let i = 0; i < 3; i++) {
    const lh = new THREE.Group();
    lh.rotation.y = (i / 3) * TAU + 0.4;
    const lf = new THREE.Mesh(lGeo, lMat);
    lf.rotation.x = -PI / 2 + 0.38;
    lf.scale.setScalar(0.72);
    lh.add(lf);
    put(g, lh, 0, 0.05, 0);
  }
  g.scale.setScalar(scale);
  return g;
}

/** 圆润陶土盆栽樱花草（恋人手中/怀中与窗台的核心信物） */
export function primrosePot(scale = 1, glowSprite = true): THREE.Group {
  const g = new THREE.Group();
  put(g, roundCyl(0.32, 0.22, 0.36, 0xd97d60, 18), 0, 0, 0);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.048, 10, 22), clay(0xe58e72));
  rim.rotation.x = PI / 2;
  put(g, rim, 0, 0.36, 0);
  const soil = new THREE.Mesh(new THREE.SphereGeometry(0.29, 14, 8), clay(0x5c3d2e));
  soil.scale.y = 0.25;
  put(g, soil, 0, 0.35, 0);

  const p1 = primrosePlant(0.96, 0xff7eb0, 0.32);
  const p2 = primrosePlant(0.8, 0xffa8cc, 0.3);
  const p3 = primrosePlant(0.78, 0xff94be, 0.3);
  p2.rotation.z = 0.34;
  p3.rotation.z = -0.34;
  put(g, p1, 0, 0.36, -0.02);
  put(g, p2, -0.14, 0.35, 0.03);
  put(g, p3, 0.14, 0.35, 0.03);

  if (glowSprite) {
    put(g, makeSprite('glow', 1.35, 0xffa8cc, true, 0.5), 0, 0.78, 0.05);
  }
  g.scale.setScalar(scale);
  return g;
}

// ── 标志性道具二：樱花草花语立体绘本（开篇与终章首尾呼应）───────────────
export function herbariumBook(): {
  root: THREE.Group;
  cover: THREE.Group;
  pageGlow: THREE.Mesh;
  pressedFlower: THREE.Group;
} {
  const root = new THREE.Group();
  const W = 3.8;
  const D = 5.0;
  // 封底（鼠尾草春绿 + 烫金书脊）
  put(root, softBox(W, 0.16, D, 0x3b6e5c, 0.05), W / 2, 0.08, 0);
  put(root, softBox(W, 0.16, D, 0x3b6e5c, 0.05), -W / 2, 0.08, 0);
  const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, D + 0.08, 16), clay(0xd9a85b));
  spine.rotation.x = PI / 2;
  put(root, spine, 0, 0.12, 0);

  // 奶油白内页（左右微拱）
  put(root, softBox(W - 0.32, 0.28, D - 0.36, 0xfff7ea, 0.06), W / 2 - 0.08, 0.26, 0);
  put(root, softBox(W - 0.32, 0.28, D - 0.36, 0xfff4e4, 0.06), -(W / 2 - 0.08), 0.26, 0);

  // 粉红丝带书签
  put(root, softBox(0.18, 0.03, D + 0.7, 0xff88b2, 0.01), 0.15, 0.42, 0.3);

  // 书页发光层
  const pageGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(W * 1.75, D * 0.85),
    glow(0xffe6b8, 0.0, true)
  );
  pageGlow.rotation.x = -PI / 2;
  put(root, pageGlow, 0, 0.43, 0);

  // 夹在右页上的发光樱花草标本
  const pressedFlower = primroseBlossom(1.15, 0xff85b3, 0.42);
  put(root, pressedFlower, 1.35, 0.44, 0.2);

  // 可翻开的上封面（初始盖在右半本上，rotation.z 从 0 翻到 PI 展开到左半本）
  const cover = new THREE.Group();
  put(root, cover, 0, 0.42, 0);
  put(cover, softBox(W, 0.15, D, 0x467c68, 0.05), W / 2, 0.06, 0);
  // 封面粉金樱花草徽章
  const emblem = primroseBlossom(0.95, 0xffa6c9, 0.32);
  put(cover, emblem, W / 2, 0.16, 0);
  const goldFrame = new THREE.Mesh(
    new THREE.RingGeometry(0.68, 0.76, 32),
    clay(0xf5cf7a, 0xf5cf7a, 0.22)
  );
  goldFrame.rotation.x = -PI / 2;
  put(cover, goldFrame, W / 2, 0.15, 0);

  return { root, cover, pageGlow, pressedFlower };
}

// ── 标志性道具三：翠竹与竹叶丛（晚风吹动着竹林）─────────────────────────
export function bambooStalk(h = 6.5, color = 0x3b8c6e, seed = 0): THREE.Group {
  const g = new THREE.Group();
  const segs = 6;
  const sh = h / segs;
  const r = 0.095 + hash(seed) * 0.035;
  for (let i = 0; i < segs; i++) {
    const t = i / segs;
    const ri = r * (1 - t * 0.28);
    put(g, roundCyl(ri * 0.96, ri, sh * 0.96, color, 10), 0, i * sh, 0);
    // 竹节环
    const node = new THREE.Mesh(
      new THREE.TorusGeometry(ri * 1.12, ri * 0.22, 6, 12),
      clay(0x63b88f, 0x2a6e54, 0.08)
    );
    node.rotation.x = PI / 2;
    put(g, node, 0, (i + 1) * sh, 0);
    // 上半段生出柔绿竹叶
    if (i >= 2) {
      for (let j = 0; j < 3; j++) {
        const a = seed * 2.1 + i * 1.7 + j * 2.05;
        const leaf = new THREE.Mesh(
          new THREE.ConeGeometry(0.11, 0.78, 5),
          clay(j % 2 === 0 ? 0x58ba89 : 0x76d49f, 0x265947, 0.1)
        );
        leaf.scale.z = 0.28;
        leaf.rotation.set(0.4, a, 1.08);
        put(g, leaf, Math.cos(a) * 0.35, (i + 0.9) * sh, Math.sin(a) * 0.35);
      }
    }
  }
  return g;
}

// ── 标志性道具四：琉璃风铃（地上风铃来歌唱）─────────────────────────────
export function windChime(bellCol = 0x9be8ff, tagCol = 0xffb3cc): {
  root: THREE.Group;
  pendulum: THREE.Group;
  tag: THREE.Mesh;
} {
  const root = new THREE.Group();
  // 挂线
  put(root, roundCyl(0.012, 0.012, 0.55, 0xfff2dc, 6), 0, -0.55, 0);
  // 半透明圆润琉璃罩
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 18, 14, 0, TAU, 0, PI * 0.68),
    glass(bellCol, 0.72)
  );
  put(root, dome, 0, -0.72, 0);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.022, 8, 20), glow(0xffffff, 0.75));
  rim.rotation.x = PI / 2;
  put(root, rim, 0, -0.84, 0);
  // 铃内发光珠与随风飘动的短册纸签
  const pendulum = new THREE.Group();
  put(root, pendulum, 0, -0.62, 0);
  const clapper = new THREE.Mesh(
    new THREE.SphereGeometry(0.065, 12, 10),
    clay(0xffd479, 0xffc857, 0.45)
  );
  put(pendulum, clapper, 0, -0.22, 0);
  put(pendulum, roundCyl(0.009, 0.009, 0.42, 0xfff2dc, 5), 0, -0.64, 0);
  const tag = softBox(0.22, 0.68, 0.022, tagCol, 0.02);
  put(pendulum, tag, 0, -0.96, 0);
  // 纸签上的小樱花草点缀
  const dot = new THREE.Mesh(new THREE.CircleGeometry(0.055, 10), glow(0xfff8fc, 0.9));
  put(tag, dot, 0, 0.12, 0.016);
  return { root, pendulum, tag };
}

// ── 标志性道具五：四季圆润树与拱桥茶亭（流水走过，就像四季的变换）───────
export function seasonTree(
  season: 'spring' | 'summer' | 'autumn' | 'winter',
  scale = 1,
  seed = 0
): THREE.Group {
  const g = new THREE.Group();
  const palette: Record<typeof season, [number, number, number]> = {
    spring: [0xffa3c4, 0xffc4da, 0x7c5344],
    summer: [0x4cc47c, 0x76de98, 0x6e4a38],
    autumn: [0xf5a245, 0xffcf66, 0x6b4534],
    winter: [0xdcf0ff, 0xf7fcff, 0x5c5366],
  };
  const [c1, c2, trunkC] = palette[season];
  put(g, roundCyl(0.16, 0.25, 1.65, trunkC, 12), 0, 0, 0);
  const blobs: Array<[number, number, number, number]> = [
    [0, 2.25, 0, 1.05],
    [-0.68, 1.9, 0.25, 0.78],
    [0.72, 1.95, -0.18, 0.8],
    [0.12, 2.78, -0.12, 0.72],
    [-0.25, 1.85, -0.58, 0.7],
  ];
  blobs.forEach(([x, y, z, r], i) => {
    const col = i % 2 === 0 ? c1 : c2;
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(r * (0.92 + hash(seed + i) * 0.15), 18, 14),
      clay(col, col, season === 'spring' || season === 'winter' ? 0.14 : 0.08)
    );
    put(g, m, x, y, z);
  });
  g.scale.setScalar(scale);
  return g;
}

/** 溪上微拱木桥（高度公式 bridgeY(x) 可让角色精确踩在桥面上） */
export function bridgeHeight(x: number, halfSpan = 3.4, archH = 0.68): number {
  const u = clamp(x / halfSpan, -1, 1);
  return Math.max(0, (1 - u * u) * archH);
}

export function archedBridge(halfSpan = 3.4, archH = 0.68, deckW = 2.0): THREE.Group {
  const g = new THREE.Group();
  const planks = 17;
  for (let i = 0; i < planks; i++) {
    const u = (i / (planks - 1)) * 2 - 1;
    const x = u * halfSpan;
    const y = (1 - u * u) * archH;
    const slope = (-2 * u * archH) / halfSpan;
    const plank = softBox((halfSpan * 2) / planks * 0.92, 0.11, deckW, 0xb87b52, 0.03);
    plank.rotation.z = Math.atan(slope);
    put(g, plank, x, y, 0);
  }
  for (const side of [-1, 1]) {
    const z = side * (deckW * 0.46);
    for (let i = 0; i < 5; i++) {
      const u = (i / 4) * 2 - 1;
      const x = u * halfSpan * 0.92;
      const y = (1 - u * u * 0.85) * archH;
      put(g, roundCyl(0.065, 0.075, 0.72, 0x9c623e, 10), x, y, z);
      const cap = new THREE.Mesh(
        new THREE.SphereGeometry(0.095, 10, 8),
        clay(i === 2 ? 0xffd579 : 0xe89ab8, 0xffc86b, i === 2 ? 0.4 : 0.15)
      );
      put(g, cap, x, y + 0.75, z);
    }
    // 弧形扶手
    const pts = many(13, (j) => {
      const u = (j / 12) * 2 - 1;
      return new THREE.Vector3(u * halfSpan * 0.94, (1 - u * u * 0.88) * archH + 0.62, z);
    });
    const curve = new THREE.CatmullRomCurve3(pts);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 0.045, 8, false), clay(0xc98b60)));
  }
  return g;
}

/** 雅致四角茶亭（千问挂风铃与四季品茶） */
export function teaPavilion(scale = 1): THREE.Group {
  const g = new THREE.Group();
  put(g, roundCyl(2.45, 2.6, 0.26, 0xe8dfd3, 24), 0, 0, 0);
  const postPos: Array<[number, number]> = [
    [-1.55, -1.55],
    [1.55, -1.55],
    [-1.55, 1.55],
    [1.55, 1.55],
  ];
  for (const [px, pz] of postPos) {
    put(g, roundCyl(0.11, 0.13, 2.75, 0x8f553c, 12), px, 0.24, pz);
  }
  // 柔和攒尖亭顶
  const roof = new THREE.Mesh(new THREE.ConeGeometry(3.05, 1.25, 4), clay(0x4b6e78));
  roof.rotation.y = PI / 4;
  put(g, roof, 0, 3.55, 0);
  const finial = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 12, 10),
    clay(0xffd479, 0xffc857, 0.35)
  );
  put(g, finial, 0, 4.22, 0);
  // 亭中小圆木茶桌
  put(g, roundCyl(0.12, 0.22, 0.58, 0x8a563b, 12), 0, 0.26, -0.2);
  put(g, roundCyl(0.62, 0.58, 0.08, 0xb87e58, 18), 0, 0.82, -0.2);
  g.scale.setScalar(scale);
  return g;
}

// ── 标志性道具六：软3D饱满爱心（听见胸膛心在跳）─────────────────────────
let heartGeoCache: THREE.ExtrudeGeometry | null = null;
export function plumpHeart(scale = 1, color = 0xff7da8, op = 0.88): THREE.Mesh {
  if (!heartGeoCache) {
    const s = new THREE.Shape();
    s.moveTo(0, -0.38);
    s.bezierCurveTo(-0.52, -0.05, -0.52, 0.38, -0.22, 0.42);
    s.bezierCurveTo(-0.07, 0.44, 0, 0.3, 0, 0.22);
    s.bezierCurveTo(0, 0.3, 0.07, 0.44, 0.22, 0.42);
    s.bezierCurveTo(0.52, 0.38, 0.52, -0.05, 0, -0.38);
    heartGeoCache = new THREE.ExtrudeGeometry(s, {
      depth: 0.14,
      bevelEnabled: true,
      bevelThickness: 0.09,
      bevelSize: 0.07,
      bevelSegments: 4,
    });
    heartGeoCache.center();
  }
  const mat =
    op >= 0.99
      ? clay(color, color, 0.35)
      : new THREE.MeshToonMaterial({
          color,
          gradientMap: getSoftRamp(),
          emissive: color,
          emissiveIntensity: 0.38,
          transparent: true,
          opacity: op,
        });
  const m = new THREE.Mesh(heartGeoCache, mat);
  m.scale.setScalar(scale);
  return m;
}

// ── 标志性道具七：月夜钟楼（远方钟声再响起）─────────────────────────────
export function bellTower(): { root: THREE.Group; bell: THREE.Group } {
  const root = new THREE.Group();
  // 奶油石砌塔身
  put(root, softBox(2.2, 0.4, 2.2, 0xd8d3e3, 0.08), 0, 0.2, 0);
  put(root, softBox(1.75, 2.8, 1.75, 0xeae5f2, 0.1), 0, 1.75, 0);
  // 钟室四柱
  for (const [x, z] of [[-0.65, -0.65], [0.65, -0.65], [-0.65, 0.65], [0.65, 0.65]]) {
    put(root, roundCyl(0.11, 0.12, 1.45, 0xdfd8eb, 10), x, 3.12, z);
  }
  // 蓝紫尖顶
  const spire = new THREE.Mesh(new THREE.ConeGeometry(1.45, 1.65, 4), clay(0x526499));
  spire.rotation.y = PI / 4;
  put(root, spire, 0, 5.35, 0);
  put(root, makeSprite('glow', 2.4, 0xffe49c, true, 0.55), 0, 3.85, 0.1);

  // 可摆动的金色铜钟
  const bell = new THREE.Group();
  put(root, bell, 0, 4.42, 0);
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.44, 0.62, 18),
    clay(0xf5c45e, 0xffb833, 0.32)
  );
  put(bell, body, 0, -0.35, 0);
  const lip = new THREE.Mesh(
    new THREE.TorusGeometry(0.44, 0.055, 8, 20),
    clay(0xffd97d, 0xffc84d, 0.35)
  );
  lip.rotation.x = PI / 2;
  put(bell, lip, 0, -0.66, 0);
  const clapper = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 10, 8),
    clay(0xfff0b5, 0xffe082, 0.5)
  );
  put(bell, clapper, 0, -0.72, 0);
  return { root, bell };
}

// ── 标志性道具八：荷叶与鼓腮唱摇篮曲的软3D小青蛙 ─────────────────────────
export function lotusPad(radius = 0.85, hasFlower = false): THREE.Group {
  const g = new THREE.Group();
  const pad = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius * 0.96, 0.06, 24, 1, false, 0.22, TAU - 0.44),
    clay(0x3f9c6e, 0x1e5c42, 0.08)
  );
  put(g, pad, 0, 0.03, 0);
  if (hasFlower) {
    const fl = primroseBlossom(radius * 0.42, 0xffa8cc, 0.38);
    fl.rotation.x = 0.22;
    put(g, fl, -radius * 0.62, 0.09, 0.18);
    put(g, makeSprite('glow', radius * 0.85, 0xffc8e2, true, 0.4), -radius * 0.62, 0.2, 0.18);
  }
  return g;
}

export function softFrog(scale = 1): { root: THREE.Group; sac: THREE.Mesh } {
  const root = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), clay(0x6bd472));
  body.scale.set(1.08, 0.86, 1.0);
  put(root, body, 0, 0.22, 0);
  // 奶白肚皮
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.22, 14, 10), clay(0xf4fae1));
  put(root, belly, 0, 0.19, 0.1);
  // 随拍鼓起的暖金鸣囊！
  const sac = new THREE.Mesh(
    new THREE.SphereGeometry(0.14, 14, 12),
    clay(0xfff0b8, 0xffdf7a, 0.45)
  );
  put(root, sac, 0, 0.24, 0.26);
  // 圆滚滚大眼睛 + 粉红腮红
  for (const s of [-1, 1]) {
    put(root, new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), clay(0x6bd472)), s * 0.15, 0.44, 0.08);
    put(root, new THREE.Mesh(new THREE.SphereGeometry(0.072, 10, 8), clay(0xffffff)), s * 0.15, 0.45, 0.13);
    put(root, new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), clay(0x1e2438)), s * 0.15, 0.46, 0.18);
    put(root, new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), clay(0xff9eb8)), s * 0.22, 0.3, 0.2);
  }
  root.scale.setScalar(scale);
  return { root, sac };
}

// ── 标志性道具九：软3D弯弯月牙（白沙滩，月弯弯 & 梦境月牙船）────────────
export function crescentMoon(scale = 1, color = 0xffe48f): THREE.Group {
  const g = new THREE.Group();
  const sh = new THREE.Shape();
  // 两圆精确交点围成圆润尖角的软3D金色弯月：外圆(0,0,R1)，挖圆(-d,0,R2)
  const R1 = 1.0;
  const R2 = 0.86;
  const d = 0.48;
  // 交点 x = (R2^2 - R1^2 - d^2) / (2*d)
  const ix = (R2 * R2 - R1 * R1 - d * d) / (2 * d);
  const iy = Math.sqrt(Math.max(0.001, R1 * R1 - ix * ix));
  const a1 = Math.atan2(iy, ix);          // 外圆上交点角（约 120°）
  const a2 = Math.atan2(iy, ix + d);      // 内圆上交点角（约 94°）
  const N = 36;
  for (let i = 0; i <= N; i++) {
    const a = lerp(-a1, a1, i / N);
    const x = Math.cos(a) * R1;
    const y = Math.sin(a) * R1;
    if (i === 0) sh.moveTo(x, y);
    else sh.lineTo(x, y);
  }
  for (let i = N; i >= 0; i--) {
    const a = lerp(-a2, a2, i / N);
    const x = -d + Math.cos(a) * R2;
    const y = Math.sin(a) * R2;
    sh.lineTo(x, y);
  }
  sh.closePath();
  const geo = new THREE.ExtrudeGeometry(sh, {
    depth: 0.2,
    bevelEnabled: true,
    bevelThickness: 0.11,
    bevelSize: 0.075,
    bevelSegments: 4,
  });
  geo.center();
  const m = new THREE.Mesh(geo, clay(color, 0xffd466, 0.52));
  g.add(m);
  put(g, makeSprite('glow', 3.5, color, true, 0.5), 0.1, 0, 0);
  g.scale.setScalar(scale);
  return g;
}

// ── 标志性道具十：天灯 / 河灯 / 八音盒 / 风车 / 许愿瓶 / 折船 / 波纹环 ────
export function skyLantern(color = 0xffc778, scale = 1): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.18, 0.52, 14),
    clay(color, color, 0.62)
  );
  put(g, body, 0, 0.26, 0);
  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 14, 8, 0, TAU, 0, PI / 2),
    clay(color, color, 0.55)
  );
  put(g, cap, 0, 0.52, 0);
  put(g, makeSprite('glow', 1.25, 0xffe49e, true, 0.72), 0, 0.26, 0);
  g.scale.setScalar(scale);
  return g;
}

export function riverLantern(petalCol = 0xff9ec4, scale = 1): THREE.Group {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.06, 12), clay(0x52a86e));
  put(g, base, 0, 0.03, 0);
  put(g, primroseBlossom(0.62, petalCol, 0.45), 0, 0.06, 0);
  put(g, makeSprite('glow', 0.95, 0xffe29c, true, 0.7), 0, 0.18, 0);
  g.scale.setScalar(scale);
  return g;
}

export function musicBox(): { root: THREE.Group; stage: THREE.Group } {
  const root = new THREE.Group();
  put(root, roundCyl(2.2, 2.35, 0.42, 0xf7e6d4, 28), 0, 0, 0);
  const band = new THREE.Mesh(
    new THREE.TorusGeometry(2.22, 0.075, 10, 32),
    clay(0xf2c464, 0xffc857, 0.25)
  );
  band.rotation.x = PI / 2;
  put(root, band, 0, 0.42, 0);

  const stage = new THREE.Group();
  put(root, stage, 0, 0.42, 0);
  put(stage, roundCyl(1.95, 2.02, 0.16, 0xffcddf, 28), 0, 0, 0);
  // 中央发条金柱与盛放樱花草冠
  put(stage, roundCyl(0.16, 0.22, 1.35, 0xf5cb6e, 16, 0xffc857, 0.2), 0, 0.16, 0);
  const topFlower = primroseBlossom(1.35, 0xff85b3, 0.38);
  put(stage, topFlower, 0, 1.56, 0);
  put(stage, makeSprite('glow', 2.2, 0xffb8d4, true, 0.55), 0, 1.65, 0);
  // 四周六朵小樱花草点缀
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    const fl = primroseBlossom(0.45, i % 2 === 0 ? 0xff94be : 0xffe082, 0.3);
    put(stage, fl, Math.cos(a) * 1.65, 0.19, Math.sin(a) * 1.65);
  }
  return { root, stage };
}

export function pinwheel(c1 = 0xff8eb5, c2 = 0xffe07d, scale = 1): {
  root: THREE.Group;
  wheel: THREE.Group;
} {
  const root = new THREE.Group();
  put(root, roundCyl(0.032, 0.038, 1.45, 0xfff5e6, 8), 0, 0, 0);
  const wheel = new THREE.Group();
  put(root, wheel, 0, 1.42, 0.05);
  for (let i = 0; i < 4; i++) {
    const blade = new THREE.Mesh(
      new THREE.ConeGeometry(0.18, 0.46, 6),
      clay(i % 2 === 0 ? c1 : c2, i % 2 === 0 ? c1 : c2, 0.16)
    );
    blade.scale.z = 0.3;
    const a = (i / 4) * TAU;
    blade.rotation.z = a + PI / 2;
    put(wheel, blade, Math.cos(a) * 0.22, Math.sin(a) * 0.22, 0);
  }
  put(wheel, new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), clay(0xffffff)), 0, 0, 0.04);
  root.scale.setScalar(scale);
  return { root, wheel };
}

export function wishingBottle(scale = 1): THREE.Group {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.24, 0.56, 16),
    glass(0xdbf4ff, 0.48)
  );
  put(g, body, 0, 0.28, 0);
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.11, 0.14, 0.14, 14),
    glass(0xeaf8ff, 0.55)
  );
  put(g, neck, 0, 0.62, 0);
  put(g, roundCyl(0.1, 0.09, 0.11, 0xc79564, 12), 0, 0.66, 0);
  // 瓶中珍藏的发光樱花草
  put(g, primroseBlossom(0.32, 0xff8ab5, 0.5), 0, 0.24, 0);
  put(g, makeSprite('glow', 0.68, 0xffb3d1, true, 0.65), 0, 0.28, 0);
  g.scale.setScalar(scale);
  return g;
}

export function leafBoat(color = 0xfff5e8, scale = 1): THREE.Group {
  const g = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.9, 4), clay(color));
  hull.rotation.z = PI / 2;
  hull.scale.set(0.45, 1, 0.55);
  put(g, hull, 0, 0.1, 0);
  const sail = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.42, 3), clay(0xffb5cf, 0xff9ec2, 0.2));
  sail.scale.z = 0.25;
  put(g, sail, 0, 0.3, 0);
  g.scale.setScalar(scale);
  return g;
}

export function rippleRing(color = 0xfff0b8, flat = true): {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
} {
  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(new THREE.RingGeometry(0.86, 1.0, 36), mat);
  if (flat) mesh.rotation.x = -PI / 2;
  return { mesh, mat };
}

/** 璀璨银河星带与织女星连线（天上银河在发光 / 织女星在远方） */
export function milkyWaySky(withVega = true): {
  root: THREE.Group;
  vegaGlow: THREE.Sprite;
  constellationLines: THREE.LineSegments | null;
} {
  const root = new THREE.Group();
  // 柔和发光银河拱带（多层星云光斑）
  const cloudCols = [0x88b8ff, 0xc7a8ff, 0xffb8e6, 0x9ef0ff, 0xfff0c7];
  for (let i = 0; i < 42; i++) {
    const u = i / 41;
    const x = lerp(-34, 34, u) + (hash(i * 3) - 0.5) * 3.5;
    const y = 7 + Math.sin(u * PI) * 14 + (hash(i * 5) - 0.5) * 2.4;
    const z = -34 - Math.sin(u * PI) * 4 + (hash(i * 7) - 0.5) * 2.5;
    const sp = makeSprite(
      i % 3 === 0 ? 'star' : 'glow',
      i % 3 === 0 ? 1.1 + hash(i) * 1.1 : 6.5 + hash(i + 2) * 5.5,
      cloudCols[i % cloudCols.length],
      true,
      i % 3 === 0 ? 0.85 : 0.16
    );
    put(root, sp, x, y, z);
  }

  const vegaPos = new THREE.Vector3(5.2, 13.8, -30);
  const vegaGlow = makeSprite('star', 4.2, 0xdcf2ff, true, 0.95);
  vegaGlow.visible = withVega;
  put(root, vegaGlow, vegaPos.x, vegaPos.y, vegaPos.z);
  if (withVega) {
    put(root, makeSprite('glow', 7.5, 0x8cc8ff, true, 0.45), vegaPos.x, vegaPos.y, vegaPos.z);
  }

  let constellationLines: THREE.LineSegments | null = null;
  if (withVega) {
    // 天琴座（织女星）菱形星图连线
    const pts: Array<[number, number, number]> = [
      [5.2, 13.8, -30],   // 织女一 Vega
      [3.4, 12.6, -30],
      [1.8, 10.6, -30],
      [3.9, 9.8, -30],
      [5.5, 11.7, -30],
      [7.1, 13.1, -30],
    ];
    for (let i = 1; i < pts.length; i++) {
      put(root, makeSprite('star', 1.35, 0xfff4d4, true, 0.9), pts[i][0], pts[i][1], pts[i][2]);
    }
    const edges = [
      [0, 1], [0, 5], [1, 2], [2, 3], [3, 4], [4, 1],
    ];
    const buf: number[] = [];
    for (const [a, b] of edges) {
      buf.push(...pts[a], ...pts[b]);
    }
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.Float32BufferAttribute(buf, 3));
    constellationLines = new THREE.LineSegments(
      lg,
      new THREE.LineBasicMaterial({
        color: 0xbfe2ff,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        fog: false,
      })
    );
    root.add(constellationLines);
  }

  return { root, vegaGlow, constellationLines };
}
