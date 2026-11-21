// 场景底座：分镜上下文、深海氛围、取景、光柱、手绘贴图（稿纸/梦稿/纸飞机/笑容/名牌/名次牌/水波）、小花、巨鲸点阵
import * as THREE from 'three';
import { Actor, Particles, Sky, rng } from './core';
import { FONT_STACK } from './type3d';

export interface Grade {
  sepia: number;
  bw: number;
  vig: number;
  grain: number;
  flash: number;
  flashCol: number;
  black: number;
  warm: number;
  flick: number;
  ca: number;
  bloom: number;
  lift: number;
}
export interface Env {
  scene: THREE.Scene;
  cam: THREE.PerspectiveCamera;
  sky: Sky;
  stars: Particles;
  hemi: THREE.HemisphereLight;
  sun: THREE.DirectionalLight;
  fog: THREE.Fog;
  grade: Grade;
}
export interface Ctx {
  t: number;
  lt: number;
  p: number;
  dur: number;
  v: string;
  e: Env;
  a: number;
  b: number;
  n: number;
}

export abstract class Scene {
  group = new THREE.Group();
  actors: Actor[] = [];
  actor(ch: string, size = 1) {
    const a = new Actor(ch, size);
    this.actors.push(a);
    this.group.add(a.mesh);
    return a;
  }
  prop(key: string, size = 1) {
    const a = new Actor('whale', size).still(key);
    this.actors.push(a);
    this.group.add(a.mesh);
    return a;
  }
  hideAll() {
    for (const a of this.actors) {
      a.show(false).tint(0xffffff, 1);
      a.size = a.baseSize;
      a.flip = false;
      a.spin = 0;
    }
  }
  abstract frame(c: Ctx): void;
  post(c: Ctx) {
    for (const a of this.actors) a.update(c.t, c.e.cam);
  }
}

const _c1 = new THREE.Color();
const _c2 = new THREE.Color();
export const mixHex = (a: number, b: number, k: number) =>
  _c1.setHex(a).lerp(_c2.setHex(b), k < 0 ? 0 : k > 1 ? 1 : k).getHex();

export function mood(
  e: Env,
  sky: number[],
  fg: number[],
  hemi: number[],
  sun: number[],
  starOp = 0,
  sunPos: number[] = [4, 14, 6],
) {
  e.sky.set(sky[0], sky[1], sky[2], sky[3] ?? 0);
  e.sky.sun([0, 0.9, -0.35], 0xaed8ff, 0.35);
  e.fog.color.setHex(fg[0]);
  e.fog.near = fg[1];
  e.fog.far = fg[2];
  e.hemi.color.setHex(hemi[0]);
  e.hemi.groundColor.setHex(hemi[1]);
  e.hemi.intensity = hemi[2];
  e.sun.color.setHex(sun[0]);
  e.sun.intensity = sun[1];
  e.sun.position.set(sunPos[0], sunPos[1], sunPos[2]);
  e.stars.mat.uniforms.uOpacity.value = starOp;
}

let SX = 0;
export function orbit(
  cam: THREE.PerspectiveCamera,
  tg: number[],
  d: number,
  yaw: number,
  pitch: number,
  fov = 38,
  sx = 0,
  sy = 0,
) {
  const cp = Math.cos(pitch);
  cam.position.set(tg[0] + Math.sin(yaw) * cp * d, tg[1] + Math.sin(pitch) * d, tg[2] + Math.cos(yaw) * cp * d);
  cam.up.set(0, 1, 0);
  cam.lookAt(tg[0], tg[1], tg[2]);
  const asp = cam.aspect || 16 / 9;
  if (Math.abs(cam.fov - fov) > 1e-3) cam.fov = fov;
  SX = sx;
  if (sx === 0 && sy === 0) cam.clearViewOffset();
  else cam.setViewOffset(asp, 1, (-sx / 2) * asp, sy / 2, asp, 1);
}
const _t = new THREE.Vector3();
export function inFront(cam: THREE.PerspectiveCamera, nx: number, dist: number): number[] {
  cam.updateMatrixWorld();
  const th = Math.tan((cam.fov * Math.PI) / 360);
  _t.set((nx - SX) * th * cam.aspect * dist, 0, -dist).applyMatrix4(cam.matrixWorld);
  return [_t.x, 0, _t.z];
}

// 光柱
export function beam(color: number) {
  const g = new THREE.CylinderGeometry(0.06, 1.0, 1, 28, 1, true);
  g.translate(0, -0.5, 0);
  const m = new THREE.ShaderMaterial({
    uniforms: { uCol: { value: new THREE.Color(color) }, uOp: { value: 0.2 } },
    vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uCol; uniform float uOp; varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(abs(dot(normalize(vN), normalize(vV))), 1.55); gl_FragColor = vec4(uCol, uOp * f * (0.12 + 0.88 * vUv.y)); }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    fog: false,
  });
  const o = new THREE.Mesh(g, m);
  o.renderOrder = 4;
  o.frustumCulled = false;
  return o;
}
const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const DOWN = new THREE.Vector3(0, -1, 0);
export function aim(o: THREE.Mesh, from: number[], to: number[], r: number, op: number) {
  _a.set(from[0], from[1], from[2]);
  _b.set(to[0], to[1], to[2]).sub(_a);
  const len = _b.length();
  o.position.copy(_a);
  o.quaternion.setFromUnitVectors(DOWN, _b.normalize());
  o.scale.set(r, len, r);
  (o.material as THREE.ShaderMaterial).uniforms.uOp.value = op;
  o.visible = op > 0.003;
}

// 手绘贴图
const TEX: Record<string, THREE.CanvasTexture> = {};
export function ctex(id: string, w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  if (TEX[id]) return TEX[id];
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  TEX[id] = t;
  return t;
}

/** 涂破的稿纸 */
export const paperTex = (i: number) =>
  ctex('paper' + (i % 4), 128, 176, (g) => {
    const r = rng((i % 4) + 3);
    g.fillStyle = '#e7ecfa';
    g.fillRect(0, 0, 128, 176);
    g.strokeStyle = '#7c89ae';
    g.lineWidth = 2;
    for (let y = 20; y < 162; y += 13) {
      g.beginPath();
      let x = 12;
      g.moveTo(x, y);
      const end = 64 + r() * 52;
      while (x < end) {
        x += 5;
        g.lineTo(x, y + (r() - 0.5) * 5);
      }
      g.stroke();
    }
    g.strokeStyle = '#252c48';
    g.lineWidth = 4;
    g.lineJoin = 'round';
    for (let k = 0; k < 3; k++) {
      const cx = 24 + r() * 80;
      const cy = 30 + r() * 110;
      g.beginPath();
      g.moveTo(cx, cy);
      for (let j = 0; j < 26; j++) g.lineTo(cx + (r() - 0.5) * 64, cy + (r() - 0.5) * 22);
      g.stroke();
    }
    g.fillStyle = '#0c1328';
    g.beginPath();
    g.ellipse(30 + r() * 70, 40 + r() * 100, 9, 6, r() * 3, 0, 7);
    g.fill();
  });

/** 枕下发霉的梦 / 角落的种子纸 */
export const dreamTex = (worn: boolean) =>
  ctex('dream' + worn, 128, 176, (g) => {
    g.fillStyle = worn ? '#c7ccb0' : '#eef2ff';
    g.fillRect(5, 4, 118, 168);
    g.strokeStyle = worn ? '#7b8270' : '#7084b8';
    g.lineWidth = 2;
    g.strokeRect(6, 5, 116, 170);
    g.strokeStyle = '#9aa6b5';
    g.lineWidth = 1.6;
    for (let y = 26; y < 154; y += 16) {
      g.beginPath();
      g.moveTo(16, y);
      g.lineTo(111, y);
      g.stroke();
    }
    g.strokeStyle = '#538a7a';
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(64, 131);
    g.quadraticCurveTo(58, 108, 65, 81);
    g.stroke();
    g.beginPath();
    g.moveTo(63, 117);
    g.quadraticCurveTo(43, 105, 40, 111);
    g.quadraticCurveTo(47, 124, 63, 117);
    g.stroke();
    g.beginPath();
    g.moveTo(65, 101);
    g.quadraticCurveTo(84, 91, 89, 98);
    g.quadraticCurveTo(79, 108, 65, 101);
    g.stroke();
    g.strokeStyle = worn ? '#9b7b72' : '#7ca4ff';
    for (let i = 0; i < 5; i++) {
      const a = (i * Math.PI * 2) / 5;
      g.beginPath();
      g.ellipse(65 + Math.cos(a) * 9, 76 + Math.sin(a) * 9, 6, 9, a, 0, Math.PI * 2);
      g.stroke();
    }
    if (worn) {
      const r = rng(19);
      for (let i = 0; i < 38; i++) {
        g.fillStyle = i % 3 ? 'rgba(92,126,86,0.34)' : 'rgba(122,115,78,0.36)';
        g.beginPath();
        g.arc(10 + r() * 108, 9 + r() * 155, 1 + r() * 3.2, 0, Math.PI * 2);
        g.fill();
      }
    }
  });

/** 海面上的天才席位铭牌 */
export const rankTex = (name: string, rank: string) =>
  ctex('rank' + name, 384, 128, (g) => {
    g.fillStyle = '#c9ae70';
    g.fillRect(3, 3, 378, 122);
    g.fillStyle = '#1b2747';
    g.fillRect(11, 11, 362, 106);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillStyle = '#f5ecd4';
    g.font = `50px ${FONT_STACK}`;
    g.fillText(name, 232, 68);
    g.fillStyle = '#ffd573';
    g.font = `40px ${FONT_STACK}`;
    g.fillText(rank, 78, 68);
  });

/** 纸飞机 */
export const planeTex = () =>
  ctex('plane', 128, 64, (g) => {
    g.lineJoin = 'round';
    g.strokeStyle = '#7ea6f2';
    g.lineWidth = 3;
    g.fillStyle = '#eef4ff';
    g.beginPath();
    g.moveTo(118, 12);
    g.lineTo(8, 30);
    g.lineTo(46, 34);
    g.closePath();
    g.fill();
    g.stroke();
    g.fillStyle = '#bfd2f8';
    g.beginPath();
    g.moveTo(118, 12);
    g.lineTo(46, 34);
    g.lineTo(60, 54);
    g.lineTo(30, 40);
    g.closePath();
    g.fill();
    g.stroke();
  });

/** 漂走的笑容 */
export const smileTex = () =>
  ctex('smile', 128, 128, (g) => {
    g.strokeStyle = '#eaf2ff';
    g.fillStyle = '#eaf2ff';
    g.lineWidth = 12;
    g.lineCap = 'round';
    g.beginPath();
    g.arc(64, 44, 42, Math.PI * 0.14, Math.PI * 0.86);
    g.stroke();
    g.beginPath();
    g.arc(36, 36, 8, 0, 7);
    g.arc(92, 36, 8, 0, 7);
    g.fill();
  });

/** 鲸鱼娘名牌 */
export const tagTex = (named: boolean) =>
  ctex('tag' + named, 256, 96, (g) => {
    g.fillStyle = named ? '#edf3ff' : '#cfcfc8';
    g.beginPath();
    g.roundRect(2, 2, 252, 92, 10);
    g.fill();
    g.strokeStyle = named ? '#4d84ff' : '#8c8c86';
    g.lineWidth = 4;
    g.stroke();
    g.fillStyle = '#0f1832';
    g.beginPath();
    g.arc(22, 48, 6, 0, 7);
    g.fill();
    if (named) {
      g.font = `52px ${FONT_STACK}`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillStyle = '#18326e';
      g.fillText('鲸鱼娘', 140, 50);
    } else {
      g.fillStyle = '#8f8f88';
      g.fillRect(48, 28, 170, 14);
      g.fillRect(48, 56, 120, 12);
    }
  });

/** 深海荧光水母纹理 */
export const jellyTex = (hue: string) =>
  ctex('jelly_' + hue, 128, 160, (g) => {
    const gr = g.createRadialGradient(64, 54, 6, 64, 54, 46);
    gr.addColorStop(0, 'rgba(255,255,255,0.92)');
    gr.addColorStop(0.45, hue);
    gr.addColorStop(1, 'rgba(20,40,90,0)');
    g.fillStyle = gr;
    g.beginPath();
    g.arc(64, 56, 44, Math.PI, 0);
    g.quadraticCurveTo(106, 78, 64, 72);
    g.quadraticCurveTo(22, 78, 20, 56);
    g.fill();
    g.strokeStyle = hue;
    g.lineWidth = 2.5;
    for (let i = -2; i <= 2; i++) {
      g.beginPath();
      const x0 = 64 + i * 11;
      g.moveTo(x0, 70);
      g.bezierCurveTo(x0 - 8, 98, x0 + 8, 122, x0 + i * 2, 150);
      g.stroke();
    }
  });

/** 发光小鱼（头朝右，白色，靠 sprite 颜色上色） */
export const fishTex = () =>
  ctex('fish', 64, 32, (g) => {
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.ellipse(36, 16, 18, 9, 0, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.moveTo(20, 16);
    g.lineTo(4, 5);
    g.lineTo(8, 16);
    g.lineTo(4, 27);
    g.closePath();
    g.fill();
    g.fillStyle = '#0a1430';
    g.beginPath();
    g.arc(46, 13, 2.4, 0, Math.PI * 2);
    g.fill();
  });

/** 世俗的成功：挂在鱼线上的金牌 */
export const medalTex = () =>
  ctex('medal', 96, 128, (g) => {
    g.fillStyle = '#c0392b';
    g.beginPath();
    g.moveTo(30, 0);
    g.lineTo(48, 48);
    g.lineTo(66, 0);
    g.closePath();
    g.fill();
    g.fillStyle = '#1f4fbf';
    g.fillRect(44, 0, 8, 46);
    const gr = g.createRadialGradient(42, 74, 4, 48, 82, 34);
    gr.addColorStop(0, '#fff6c8');
    gr.addColorStop(0.55, '#ffc947');
    gr.addColorStop(1, '#b07414');
    g.fillStyle = gr;
    g.beginPath();
    g.arc(48, 82, 32, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = '#8a5a10';
    g.lineWidth = 3;
    g.beginPath();
    g.arc(48, 82, 24, 0, Math.PI * 2);
    g.stroke();
    g.fillStyle = '#8a5a10';
    g.beginPath();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 7 : 15;
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      g.lineTo(48 + Math.cos(a) * r, 82 + Math.sin(a) * r);
    }
    g.closePath();
    g.fill();
  });

/** 海底水波焦散纹理 */
export const causticTex = () =>
  ctex('caustic', 256, 256, (g) => {
    const r = rng(42);
    g.fillStyle = 'rgba(0,0,0,0)';
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 42; i++) {
      const x = r() * 256;
      const y = r() * 256;
      const rad = 18 + r() * 42;
      const gr = g.createRadialGradient(x, y, rad * 0.45, x, y, rad);
      gr.addColorStop(0, 'rgba(90,155,255,0)');
      gr.addColorStop(0.75, 'rgba(130,195,255,0.14)');
      gr.addColorStop(1, 'rgba(90,155,255,0)');
      g.fillStyle = gr;
      g.beginPath();
      g.arc(x, y, rad, 0, Math.PI * 2);
      g.fill();
    }
  });

// 小花
export interface Flower {
  g: THREE.Group;
  stem: THREE.Mesh;
  head: THREE.Group;
  glow: THREE.Sprite;
  leaves: THREE.Mesh[];
}
export function flower(glowTexture: THREE.Texture, petal = 0xddeaff): Flower {
  const g = new THREE.Group();
  const basic = (c: number) => new THREE.MeshBasicMaterial({ color: c, fog: false, side: THREE.DoubleSide });
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.018, 1, 5).translate(0, 0.5, 0), basic(0x52c494));
  const leaves = [-1, 1].map((s) => {
    const l = new THREE.Mesh(
      new THREE.CircleGeometry(0.06, 8).scale(1.5, 0.55, 1).translate(0.08, 0, 0),
      basic(0x3ea379),
    );
    l.rotation.set(0, s > 0 ? 0 : Math.PI, 0.5);
    return l;
  });
  const head = new THREE.Group();
  const pm = basic(petal);
  for (let i = 0; i < 5; i++) {
    const p = new THREE.Mesh(new THREE.CircleGeometry(0.055, 10).scale(1, 1.52, 1).translate(0, 0.08, 0), pm);
    p.rotation.z = (i / 5) * Math.PI * 2;
    head.add(p);
  }
  const core = new THREE.Mesh(new THREE.CircleGeometry(0.036, 10), basic(0xffe078));
  core.position.z = 0.004;
  head.add(core);
  const glow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTexture,
      color: 0x73b0ff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      fog: false,
    }),
  );
  glow.scale.setScalar(1.5);
  glow.renderOrder = 5;
  g.add(stem, leaves[0], leaves[1], head, glow);
  return { g, stem, head, glow, leaves };
}

export function setFlower(f: Flower, cam: THREE.Camera, grow: number, open: number, h = 0.42, glowOp = 0.65) {
  f.g.visible = grow > 0.001;
  const y = h * grow;
  f.stem.scale.set(1, Math.max(0.001, y), 1);
  f.leaves.forEach((l, i) => {
    l.position.y = y * (0.35 + i * 0.2);
    l.scale.setScalar(Math.min(1, grow * 1.4));
  });
  f.head.position.y = y;
  f.head.quaternion.copy(cam.quaternion);
  f.head.scale.setScalar(0.25 * Math.min(1, grow * 2) + 1.05 * open);
  f.glow.position.y = y;
  f.glow.material.opacity = glowOp * open;
  f.glow.scale.setScalar(1.0 + open * 0.9);
}

/** 巨鲸侧影点阵 */
export function whalePts(n: number, seed = 7): number[][] {
  const r = rng(seed);
  const out: number[][] = [];
  const ell = (x: number, y: number, cx: number, cy: number, rx: number, ry: number, rot = 0) => {
    const c = Math.cos(rot);
    const s = Math.sin(rot);
    const dx = x - cx;
    const dy = y - cy;
    const u = (dx * c + dy * s) / rx;
    const v = (-dx * s + dy * c) / ry;
    return u * u + v * v < 1;
  };
  let guard = 0;
  while (out.length < n && guard++ < n * 80) {
    const x = -17 + r() * 28;
    const y = -6 + r() * 14;
    if (ell(x, y, 6.2, 1.1, 0.55, 0.55)) continue;
    const body = ell(x, y, 1, 0, 9.5, y > 0 ? 3.4 : 4.1);
    const stalk = x < -5 && x > -12.6 && Math.abs(y - 0.4 - (-5 - x) * 0.12) < 2.6 - (-5 - x) * 0.27;
    const fluke = ell(x, y, -13.7, 3.3, 2.7, 1.0, -0.6) || ell(x, y, -13.9, -0.7, 2.5, 0.95, 0.55);
    const fin = ell(x, y, 2.2, -4.7, 2.5, 0.9, 0.5);
    const spout = y > 4.3 && ell(x, y, 5.2, 5.8, 0.3 + (y - 4.3) * 0.55, 1.7);
    if (body || stalk || fluke || fin || spout) out.push([x, y]);
  }
  return out;
}
