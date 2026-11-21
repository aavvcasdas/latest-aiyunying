// 场景底座：分镜上下文、氛围、取景、光柱、手绘贴图、小花、鲸形点阵
import * as THREE from 'three';
import { Actor, Particles, Sky, rng } from './core';
import { FONT_STACK } from './type3d';

export interface Grade { sepia: number; bw: number; vig: number; grain: number; flash: number; flashCol: number; black: number; warm: number; flick: number; ca: number; bloom: number; lift: number }
export interface Env { scene: THREE.Scene; cam: THREE.PerspectiveCamera; sky: Sky; stars: Particles; hemi: THREE.HemisphereLight; sun: THREE.DirectionalLight; fog: THREE.Fog; grade: Grade }
/** n = 歌词行号（从 1 起，间奏为 0）；rep = 这句是第几遍唱（0 / 1 / 2） */
export interface Ctx { t: number; lt: number; p: number; dur: number; v: string; e: Env; a: number; b: number; n: number; rep: number }

export abstract class Scene {
  group = new THREE.Group(); actors: Actor[] = [];
  actor(ch: string, size = 1) { const a = new Actor(ch, size); this.actors.push(a); this.group.add(a.mesh); return a; }
  prop(key: string, size = 1) { const a = new Actor('whale', size).still(key); this.actors.push(a); this.group.add(a.mesh); return a; }
  hideAll() { for (const a of this.actors) { a.show(false).tint(0xffffff, 1); a.size = a.baseSize; a.flip = false; a.spin = 0; } }
  abstract frame(c: Ctx): void;
  post(c: Ctx) { for (const a of this.actors) a.update(c.t, c.e.cam); }
}

const _c1 = new THREE.Color(), _c2 = new THREE.Color();
export const mixHex = (a: number, b: number, k: number) => _c1.setHex(a).lerp(_c2.setHex(b), k < 0 ? 0 : k > 1 ? 1 : k).getHex();

/** 一次定好天空 / 雾 / 环境光 / 主光 / 星星 */
export function mood(e: Env, sky: number[], fg: number[], hemi: number[], sun: number[], starOp = 0, sunPos: number[] = [4, 10, 6]) {
  e.sky.set(sky[0], sky[1], sky[2], sky[3] ?? 0); e.sky.sun([0, 1, 0], 0xffffff, 0);
  e.fog.color.setHex(fg[0]); e.fog.near = fg[1]; e.fog.far = fg[2];
  e.hemi.color.setHex(hemi[0]); e.hemi.groundColor.setHex(hemi[1]); e.hemi.intensity = hemi[2];
  e.sun.color.setHex(sun[0]); e.sun.intensity = sun[1]; e.sun.position.set(sunPos[0], sunPos[1], sunPos[2]);
  e.stars.mat.uniforms.uOpacity.value = starOp;
}

const _t = new THREE.Vector3();
/** 绕目标取景：sx / sy 是目标在画面里的位置（-1..1），给歌词大字让出地方 */
export function orbit(cam: THREE.PerspectiveCamera, tg: number[], d: number, yaw: number, pitch: number, fov = 36, sx = 0, sy = 0) {
  const cp = Math.cos(pitch);
  cam.position.set(tg[0] + Math.sin(yaw) * cp * d, tg[1] + Math.sin(pitch) * d, tg[2] + Math.cos(yaw) * cp * d);
  cam.up.set(0, 1, 0); cam.lookAt(tg[0], tg[1], tg[2]);
  const asp = cam.aspect || 16 / 9;
  if (Math.abs(cam.fov - fov) > 1e-3) cam.fov = fov;
  SX = sx;
  // fullWidth / fullHeight 必须保持与相机 aspect 一致，否则 setViewOffset 会把 cam.aspect 改写成 1
  if (sx === 0 && sy === 0) cam.clearViewOffset();
  else cam.setViewOffset(asp, 1, (-sx / 2) * asp, sy / 2, asp, 1);
}
let SX = 0;
/** 镜头前方、画面横向 nx 处的地面点（前景人物用） */
export function inFront(cam: THREE.PerspectiveCamera, nx: number, dist: number): number[] {
  cam.updateMatrixWorld(); const th = Math.tan((cam.fov * Math.PI) / 360);
  _t.set((nx - SX) * th * cam.aspect * dist, 0, -dist).applyMatrix4(cam.matrixWorld); return [_t.x, 0, _t.z];
}

// ---------- 光柱 ----------
export function beam(color: number) {
  const g = new THREE.CylinderGeometry(0.04, 1, 1, 28, 1, true); g.translate(0, -0.5, 0);
  const m = new THREE.ShaderMaterial({
    uniforms: { uCol: { value: new THREE.Color(color) }, uOp: { value: 0.2 } },
    vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv = uv; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform vec3 uCol; uniform float uOp; varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(abs(dot(normalize(vN), normalize(vV))), 1.6); gl_FragColor = vec4(uCol, uOp * f * (0.2 + 0.8 * vUv.y)); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false,
  });
  const o = new THREE.Mesh(g, m); o.renderOrder = 4; o.frustumCulled = false; return o;
}
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), DOWN = new THREE.Vector3(0, -1, 0);
export function aim(o: THREE.Mesh, from: number[], to: number[], r: number, op: number) {
  _a.set(from[0], from[1], from[2]); _b.set(to[0], to[1], to[2]).sub(_a); const len = _b.length();
  o.position.copy(_a); o.quaternion.setFromUnitVectors(DOWN, _b.normalize()); o.scale.set(r, len, r);
  (o.material as THREE.ShaderMaterial).uniforms.uOp.value = op; o.visible = op > 0.003;
}

// ---------- 画出来的贴图 ----------
const TEX: Record<string, THREE.CanvasTexture> = {};
export function ctex(id: string, w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  if (TEX[id]) return TEX[id];
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d')!);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; TEX[id] = t; return t;
}
/** 涂破的稿纸：几行潦草的线、几团反复涂改的乱线、一个戳破的洞（不写字） */
export const paperTex = (i: number) => ctex('paper' + (i % 4), 128, 176, (g) => {
  const r = rng((i % 4) + 3);
  g.fillStyle = '#f1ede2'; g.fillRect(0, 0, 128, 176);
  g.strokeStyle = '#8f95aa'; g.lineWidth = 2;
  for (let y = 20; y < 162; y += 13) { g.beginPath(); let x = 12; g.moveTo(x, y); const end = 64 + r() * 52; while (x < end) { x += 5; g.lineTo(x, y + (r() - 0.5) * 5); } g.stroke(); }
  g.strokeStyle = '#2b3048'; g.lineWidth = 4; g.lineJoin = 'round';
  for (let k = 0; k < 3; k++) { const cx = 24 + r() * 80, cy = 30 + r() * 110; g.beginPath(); g.moveTo(cx, cy); for (let j = 0; j < 26; j++) g.lineTo(cx + (r() - 0.5) * 64, cy + (r() - 0.5) * 22); g.stroke(); }
  g.fillStyle = '#14172a'; g.beginPath(); g.ellipse(30 + r() * 70, 40 + r() * 100, 9, 6, r() * 3, 0, 7); g.fill();
});
/** 同一张夹在枕下的草稿，画着以后会开出的花。 */
export const dreamTex = (worn: boolean) => ctex('dream' + worn, 128, 176, (g) => {
  g.fillStyle = worn ? '#cfc9ae' : '#f3eedf'; g.fillRect(5, 4, 118, 168);
  g.strokeStyle = '#8e8891'; g.lineWidth = 2; g.strokeRect(6, 5, 116, 170);
  g.strokeStyle = '#a2a7a7'; g.lineWidth = 1.6;
  for (let y = 26; y < 154; y += 16) { g.beginPath(); g.moveTo(16, y); g.lineTo(111, y); g.stroke(); }
  g.strokeStyle = '#66776a'; g.lineWidth = 3; g.beginPath(); g.moveTo(64, 131); g.quadraticCurveTo(58, 108, 65, 81); g.stroke();
  g.beginPath(); g.moveTo(63, 117); g.quadraticCurveTo(43, 105, 40, 111); g.quadraticCurveTo(47, 124, 63, 117); g.stroke();
  g.beginPath(); g.moveTo(65, 101); g.quadraticCurveTo(84, 91, 89, 98); g.quadraticCurveTo(79, 108, 65, 101); g.stroke();
  g.strokeStyle = '#b27f78';
  for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; g.beginPath(); g.ellipse(65 + Math.cos(a) * 9, 76 + Math.sin(a) * 9, 6, 9, a, 0, Math.PI * 2); g.stroke(); }
  if (worn) { const r = rng(19); for (let i = 0; i < 35; i++) { g.fillStyle = i % 3 ? 'rgba(103,117,73,.3)' : 'rgba(129,116,83,.35)'; g.beginPath(); g.arc(10 + r() * 108, 9 + r() * 155, 1 + r() * 3, 0, Math.PI * 2); g.fill(); } }
});
/** 用同一套字形给领奖台刻名字，不更换角色造型。 */
export const rankTex = (name: string, rank: string) => ctex('rank' + name, 384, 128, (g) => {
  g.fillStyle = '#c9ae70'; g.fillRect(3, 3, 378, 122);
  g.fillStyle = '#42405a'; g.fillRect(11, 11, 362, 106);
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#f0e4c9';
  g.font = `52px ${FONT_STACK}`; g.fillText(name, 230, 68);
  g.font = `42px ${FONT_STACK}`; g.fillText(rank, 78, 68);
});
/** 纸飞机（头朝右）：故事的载体 */
export const planeTex = () => ctex('plane', 128, 64, (g) => {
  g.lineJoin = 'round'; g.strokeStyle = '#7f8aa5'; g.lineWidth = 3;
  g.fillStyle = '#f4f3ee'; g.beginPath(); g.moveTo(118, 12); g.lineTo(8, 30); g.lineTo(46, 34); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#d5dae6'; g.beginPath(); g.moveTo(118, 12); g.lineTo(46, 34); g.lineTo(60, 54); g.lineTo(30, 40); g.closePath(); g.fill(); g.stroke();
});
export const smileTex = () => ctex('smile', 128, 128, (g) => {
  g.strokeStyle = '#fff'; g.fillStyle = '#fff'; g.lineWidth = 13; g.lineCap = 'round';
  g.beginPath(); g.arc(64, 44, 42, Math.PI * 0.14, Math.PI * 0.86); g.stroke();
  g.beginPath(); g.arc(36, 36, 8, 0, 7); g.arc(92, 36, 8, 0, 7); g.fill();
});
/** 巨碑上的刻字 */
export const charTex = (ch: string) => ctex('ch' + ch, 384, 512, (g) => {
  const gr = g.createLinearGradient(0, 0, 0, 512); gr.addColorStop(0, '#aab3cc'); gr.addColorStop(1, '#59607a'); g.fillStyle = gr; g.fillRect(0, 0, 384, 512);
  const r = rng(ch.charCodeAt(0));
  for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(${r() > 0.5 ? '255,255,255' : '0,0,0'},${0.03 + r() * 0.06})`; g.fillRect(r() * 384, r() * 512, 1 + r() * 5, 1 + r() * 3); }
  g.font = `300px ${FONT_STACK}`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#e3e9fa'; g.fillText(ch, 198, 264); g.fillStyle = '#10121a'; g.fillText(ch, 192, 256);
  g.strokeStyle = 'rgba(0,0,0,0.55)'; g.lineWidth = 3; g.beginPath(); let x = 60 + r() * 260, y = 0; g.moveTo(x, y);
  while (y < 512) { x += (r() - 0.5) * 70; y += 20 + r() * 40; g.lineTo(x, y); } g.stroke();
});
/** 名牌：别人的是两道灰杠，她的写着名字 */
export const tagTex = (named: boolean) => ctex('tag' + named, 256, 96, (g) => {
  g.fillStyle = named ? '#eef1ff' : '#cfcfc8'; g.beginPath(); g.roundRect(2, 2, 252, 92, 10); g.fill();
  g.strokeStyle = named ? '#4d6bfe' : '#8c8c86'; g.lineWidth = 4; g.stroke();
  g.fillStyle = '#1a1c28'; g.beginPath(); g.arc(22, 48, 6, 0, 7); g.fill();
  if (named) { g.font = `54px ${FONT_STACK}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#24306e'; g.fillText('鲸鱼娘', 140, 50); }
  else { g.fillStyle = '#8f8f88'; g.fillRect(48, 28, 170, 14); g.fillRect(48, 56, 120, 12); }
});

// ---------- 小花 ----------
export interface Flower { g: THREE.Group; stem: THREE.Mesh; head: THREE.Group; glow: THREE.Sprite; leaves: THREE.Mesh[] }
export function flower(glowTexture: THREE.Texture, petal = 0xe6ecff): Flower {
  const g = new THREE.Group(); const basic = (c: number) => new THREE.MeshBasicMaterial({ color: c, fog: false, side: THREE.DoubleSide });
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.017, 1, 5).translate(0, 0.5, 0), basic(0x63b383));
  const leaves = [-1, 1].map((s) => { const l = new THREE.Mesh(new THREE.CircleGeometry(0.06, 8).scale(1.5, 0.55, 1).translate(0.08, 0, 0), basic(0x4f9a6c)); l.rotation.set(0, s > 0 ? 0 : Math.PI, 0.5); return l; });
  const head = new THREE.Group(); const pm = basic(petal);
  for (let i = 0; i < 5; i++) { const p = new THREE.Mesh(new THREE.CircleGeometry(0.05, 10).scale(1, 1.5, 1).translate(0, 0.075, 0), pm); p.rotation.z = (i / 5) * Math.PI * 2; head.add(p); }
  const core = new THREE.Mesh(new THREE.CircleGeometry(0.034, 10), basic(0xffd76a)); core.position.z = 0.004; head.add(core);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture, color: 0x7d9bff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  glow.scale.setScalar(1.3); glow.renderOrder = 5;
  g.add(stem, leaves[0], leaves[1], head, glow); return { g, stem, head, glow, leaves };
}
/** grow 0..1 抽茎，open 0..1 开花；花头始终朝镜头 */
export function setFlower(f: Flower, cam: THREE.Camera, grow: number, open: number, h = 0.36, glowOp = 0.5) {
  f.g.visible = grow > 0.001; const y = h * grow;
  f.stem.scale.set(1, Math.max(0.001, y), 1);
  f.leaves.forEach((l, i) => { l.position.y = y * (0.35 + i * 0.2); l.scale.setScalar(Math.min(1, grow * 1.4)); });
  f.head.position.y = y; f.head.quaternion.copy(cam.quaternion); f.head.scale.setScalar(0.25 * Math.min(1, grow * 2) + 0.95 * open);
  f.glow.position.y = y; f.glow.material.opacity = glowOp * open; f.glow.scale.setScalar(0.9 + open * 0.7);
}

/** 鲸的侧影点阵（头朝 +x，眼睛留空在 (6.2, 1.1)） */
export function whalePts(n: number, seed = 7): number[][] {
  const r = rng(seed); const out: number[][] = [];
  const ell = (x: number, y: number, cx: number, cy: number, rx: number, ry: number, rot = 0) => {
    const c = Math.cos(rot), s = Math.sin(rot), dx = x - cx, dy = y - cy; const u = (dx * c + dy * s) / rx, v = (-dx * s + dy * c) / ry; return u * u + v * v < 1;
  };
  let guard = 0;
  while (out.length < n && guard++ < n * 80) {
    const x = -17 + r() * 28, y = -6 + r() * 14;
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
