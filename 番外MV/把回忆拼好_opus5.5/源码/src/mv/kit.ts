import * as THREE from 'three';
import atlasUrl from '../assets/cast_atlas.png';
import atlasJson from '../assets/cast_atlas.json';
import actionsJson from '../assets/cast_actions.json';

// ---------- 数学 ----------
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const smooth = (u: number) => {
  const x = clamp(u);
  return x * x * (3 - 2 * x);
};
export const easeOut = (u: number) => 1 - Math.pow(1 - clamp(u), 3);
export const easeIn = (u: number) => Math.pow(clamp(u), 3);
export const easeInOut = (u: number) => {
  const x = clamp(u);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
/** 带回弹的弹出：0→1，过冲后稳定 */
export const pop = (s: number, dur = 0.45) => {
  if (s <= 0) return 0;
  const u = s / dur;
  if (u >= 1) return 1;
  return 1 - Math.exp(-6 * u) * Math.cos(u * Math.PI * 2.2);
};
export const ramp = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
/** 确定性伪随机 */
export const rnd = (i: number, s = 0) => {
  const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// ---------- 拼图块 ----------
/** 单位方块拼图形状：每条边 1 = 凸、-1 = 凹、0 = 平 */
export function pieceShape(top: number, right: number, bottom: number, left: number, size = 1) {
  const h = size / 2;
  const s = new THREE.Shape();
  const k = size * 0.22; // 凸起半径
  const edge = (ax: number, ay: number, bx: number, by: number, dir: number) => {
    // 从 a 走到 b，dir 决定凸起朝外（外法线方向）
    const dx = bx - ax, dy = by - ay;
    const len = Math.hypot(dx, dy);
    const ux = dx / len, uy = dy / len;
    const nx = uy, ny = -ux; // 顺时针走时的外法线（形状按逆时针画，外法线 = (uy,-ux)）
    if (dir === 0) {
      s.lineTo(bx, by);
      return;
    }
    const p = (t: number, n: number) => [ax + ux * len * t + nx * n * dir, ay + uy * len * t + ny * n * dir] as const;
    const a1 = p(0.36, 0), a2 = p(0.4, k * 0.35), a3 = p(0.3, k * 1.25);
    const m = p(0.5, k * 1.35);
    const b1 = p(0.7, k * 1.25), b2 = p(0.6, k * 0.35), b3 = p(0.64, 0);
    s.lineTo(a1[0], a1[1]);
    s.bezierCurveTo(a2[0], a2[1], a3[0], a3[1], m[0], m[1]);
    s.bezierCurveTo(b1[0], b1[1], b2[0], b2[1], b3[0], b3[1]);
    s.lineTo(bx, by);
  };
  // 逆时针：左下 → 右下 → 右上 → 左上
  s.moveTo(-h, -h);
  edge(-h, -h, h, -h, -bottom);
  edge(h, -h, h, h, -right);
  edge(h, h, -h, h, -top);
  edge(-h, h, -h, -h, -left);
  return s;
}

const pieceCache = new Map<string, THREE.BufferGeometry>();
export function pieceGeo(top = 1, right = 1, bottom = -1, left = -1, depth = 0.16, size = 1) {
  const key = [top, right, bottom, left, depth, size].join(',');
  const hit = pieceCache.get(key);
  if (hit) return hit;
  const g = new THREE.ExtrudeGeometry(pieceShape(top, right, bottom, left, size), {
    depth,
    bevelEnabled: true,
    bevelThickness: depth * 0.25,
    bevelSize: size * 0.025,
    bevelSegments: 2,
    curveSegments: 6,
  });
  g.translate(0, 0, -depth / 2);
  g.computeVertexNormals();
  pieceCache.set(key, g);
  return g;
}

export function std(color: THREE.ColorRepresentation, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.02, ...extra });
}

/** 一片可平铺的拼图墙：InstancedMesh，块与块互相咬合 */
export function puzzleField(cols: number, rows: number, size: number, colorFn: (i: number, j: number) => THREE.Color) {
  const geo = pieceGeo(1, 1, -1, -1, 0.16, 1);
  const mat = std(0xffffff, { roughness: 0.7 });
  const mesh = new THREE.InstancedMesh(geo, mat, cols * rows);
  const m = new THREE.Matrix4();
  let n = 0;
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      m.makeScale(size, size, size);
      m.setPosition((i - (cols - 1) / 2) * size, (j - (rows - 1) / 2) * size, 0);
      mesh.setMatrixAt(n, m);
      mesh.setColorAt(n, colorFn(i, j));
      n++;
    }
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  return mesh;
}

// ---------- 渐变天空 / 贴图 ----------
export function gradientTex(stops: [number, string][], w = 4, h = 256) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d')!;
  const gr = g.createLinearGradient(0, 0, 0, h);
  stops.forEach(([o, col]) => gr.addColorStop(o, col));
  g.fillStyle = gr;
  g.fillRect(0, 0, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
export function radialTex(inner: string, outer: string, size = 128) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gr.addColorStop(0, inner);
  gr.addColorStop(1, outer);
  g.fillStyle = gr;
  g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
/** 大天空球（内表面贴竖向渐变） */
export function skyDome(stops: [number, string][], r = 220) {
  const m = new THREE.Mesh(
    new THREE.SphereGeometry(r, 32, 16),
    new THREE.MeshBasicMaterial({ map: gradientTex(stops), side: THREE.BackSide, depthWrite: false, fog: false }),
  );
  return m;
}
export function glowSprite(color: string, scale: number, opacity = 1) {
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: radialTex(color, 'rgba(0,0,0,0)'),
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    }),
  );
  s.scale.setScalar(scale);
  return s;
}

// ---------- 像素角色 ----------
type Rect = [number, number, number, number];
const ATLAS = atlasJson as unknown as { w: number; h: number; s: Record<string, Rect> };
type Act = { fps: number; loop: boolean; frames: string[]; size: [number, number] };
const ACTIONS = (actionsJson as unknown as { actions: Record<string, Record<string, Act>> }).actions;

let atlasTex: THREE.Texture | null = null;
export async function loadAtlas() {
  const tex = await new THREE.TextureLoader().loadAsync(atlasUrl);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  atlasTex = tex;
}

export function hasFrame(name: string) {
  return !!ATLAS.s[name];
}

/** 2D 纸片人：脚底为锚点，每帧重新摆 */
export class Actor {
  root = new THREE.Group();
  mesh: THREE.Mesh;
  mat: THREE.MeshStandardMaterial;
  shadow: THREE.Mesh;
  uni = { uGrey: { value: 0 } };
  tex: THREE.Texture;
  height: number; // 一个标准格（90px）对应的世界高度
  constructor(public who: string, height = 1.6) {
    if (!atlasTex) throw new Error('图集未加载');
    this.height = height;
    this.tex = atlasTex.clone();
    this.tex.needsUpdate = true;
    this.mat = new THREE.MeshStandardMaterial({
      map: this.tex,
      transparent: true,
      alphaTest: 0.35,
      side: THREE.DoubleSide,
      roughness: 1,
      metalness: 0,
      emissive: 0xffffff,
      emissiveMap: this.tex,
      emissiveIntensity: 0.55,
    });
    const uni = this.uni;
    this.mat.onBeforeCompile = (sh) => {
      sh.uniforms.uGrey = uni.uGrey;
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\nuniform float uGrey;')
        .replace(
          '#include <dithering_fragment>',
          '#include <dithering_fragment>\nfloat lum = dot(gl_FragColor.rgb, vec3(0.299,0.587,0.114));\ngl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(lum)*vec3(0.92,0.95,1.0), uGrey);',
        );
    };
    const g = new THREE.PlaneGeometry(1, 1);
    g.translate(0, 0.5, 0);
    this.mesh = new THREE.Mesh(g, this.mat);
    this.root.add(this.mesh);
    this.shadow = new THREE.Mesh(
      new THREE.CircleGeometry(0.5, 24),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false }),
    );
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = 0.01;
    this.root.add(this.shadow);
  }
  /** 直接摆一格 */
  set(name: string) {
    const r = ATLAS.s[name];
    if (!r) throw new Error('缺造型格：' + name);
    const [x, y, w, h] = r;
    this.tex.repeat.set(w / ATLAS.w, h / ATLAS.h);
    this.tex.offset.set(x / ATLAS.w, 1 - (y + h) / ATLAS.h);
    const k = this.height / 90;
    this.mesh.scale.set(w * k * (this.flip ? -1 : 1), h * k, 1);
    this.shadow.scale.set(w * k * 0.7, w * k * 0.22, 1);
    return this;
  }
  flip = false;
  /** 播放派生动作，s = 动作开始后的秒数 */
  act(name: string, s: number) {
    const a = ACTIONS[this.who]?.[name];
    if (!a) throw new Error(`缺动作：${this.who}.${name}`);
    const n = a.frames.length;
    let i = Math.floor(Math.max(0, s) * a.fps);
    i = a.loop ? i % n : Math.min(n - 1, i);
    return this.set(a.frames[i]);
  }
  at(x: number, y: number, z: number) {
    this.root.position.set(x, y, z);
    return this;
  }
  grey(v: number) {
    this.uni.uGrey.value = v;
    return this;
  }
  face(cam: THREE.Camera) {
    // 只绕 y 轴朝向镜头
    const p = new THREE.Vector3();
    cam.getWorldPosition(p);
    const w = new THREE.Vector3();
    this.root.getWorldPosition(w);
    this.mesh.rotation.y = Math.atan2(p.x - w.x, p.z - w.z) - (this.root.parent ? this.root.parent.rotation.y : 0);
    return this;
  }
  show(v: boolean) {
    this.root.visible = v;
    return this;
  }
}

/** 单独摆一个图集里的道具 / 表情贴 */
export class Thing {
  mesh: THREE.Mesh;
  tex: THREE.Texture;
  constructor(public name: string, public height = 0.5) {
    if (!atlasTex) throw new Error('图集未加载');
    this.tex = atlasTex.clone();
    this.tex.needsUpdate = true;
    const mat = new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide });
    const g = new THREE.PlaneGeometry(1, 1);
    g.translate(0, 0.5, 0);
    this.mesh = new THREE.Mesh(g, mat);
    this.setFrame(name);
  }
  setFrame(name: string) {
    const r = ATLAS.s[name];
    if (!r) throw new Error('缺贴图格：' + name);
    const [x, y, w, h] = r;
    this.tex.repeat.set(w / ATLAS.w, h / ATLAS.h);
    this.tex.offset.set(x / ATLAS.w, 1 - (y + h) / ATLAS.h);
    this.mesh.scale.set((this.height * w) / h, this.height, 1);
    return this;
  }
}
