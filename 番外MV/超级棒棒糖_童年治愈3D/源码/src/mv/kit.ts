// 软糖黏土风格的工具箱：数学 / 程序化贴图 / 材质 / 圆角体块 / 像素纸片人 / 3D 棒棒糖 / 彩虹披风
// 规矩（与通用模板一致）：逐帧函数只读时间；角色每帧重新摆；缺素材直接报错。
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { ACTIONS, ATLAS_H, ATLAS_W, RECTS, THINGS } from './atlasData';

// ───────── 数学 ─────────
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const ease = (t: number) => { const x = clamp(t); return x * x * (3 - 2 * x); };
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
export const easeIn = (t: number) => Math.pow(clamp(t), 3);
export const seg = (u: number, a: number, b: number) => clamp((u - a) / (b - a));
export const hash = (n: number) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
/** 0→1→0 的小抛物线（跳跃） */
export const arc = (t: number) => 4 * clamp(t) * (1 - clamp(t));
export const TAU = Math.PI * 2;

// ───────── 程序化贴图（全部 Canvas 现画，不读任何生成图） ─────────
function canvas(w: number, h: number) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); if (!g) throw new Error('Canvas2D 不可用');
  return { c, g };
}
function tex(c: HTMLCanvasElement, srgb = true) {
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; return t;
}
export const CANDY = ['#ff8fb1', '#ffb36b', '#ffe066', '#8be0a4', '#7cc8ff', '#b59cff'];

export function glowTexture() {
  const { c, g } = canvas(128, 128);
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.25, 'rgba(255,255,255,0.55)');
  r.addColorStop(0.6, 'rgba(255,255,255,0.12)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128); return tex(c);
}
export function starTexture() {
  const { c, g } = canvas(64, 64);
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(0.2, 'rgba(255,255,255,0.5)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  g.fillStyle = 'rgba(255,255,255,0.95)'; g.beginPath();
  for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU - Math.PI / 2; const rr = i % 2 === 0 ? 30 : 5; g.lineTo(32 + Math.cos(a) * rr, 32 + Math.sin(a) * rr); }
  g.closePath(); g.fill(); return tex(c);
}
/** 棒棒糖的彩虹螺旋：六条糖色螺旋臂 + 奶白底 + 高光 */
export function spiralTexture() {
  const S = 256, { c, g } = canvas(S, S), R = S / 2;
  g.fillStyle = '#fff8f0'; g.fillRect(0, 0, S, S);
  const arms = CANDY.length;
  for (let r = 2; r < R; r += 1) {
    for (let k = 0; k < arms; k++) {
      const a0 = r * 0.075 + (k / arms) * TAU;
      g.strokeStyle = CANDY[k]; g.lineWidth = 2.2; g.beginPath(); g.arc(R, R, r, a0, a0 + (TAU / arms) * 0.62); g.stroke();
    }
  }
  const hl = g.createRadialGradient(R * 0.7, R * 0.6, 4, R * 0.7, R * 0.6, R * 0.7);
  hl.addColorStop(0, 'rgba(255,255,255,0.75)'); hl.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = hl; g.fillRect(0, 0, S, S);
  return tex(c);
}
/** 披风：沿宽度方向的彩虹条带 */
export function ribbonTexture() {
  const { c, g } = canvas(8, 128);
  const gr = g.createLinearGradient(0, 0, 0, 128);
  const cols = ['#ff7aa8', '#ffad5c', '#ffe45c', '#7fe0a0', '#6cc4ff', '#a98bff'];
  cols.forEach((cl, i) => gr.addColorStop(i / (cols.length - 1), cl));
  g.fillStyle = gr; g.fillRect(0, 0, 8, 128);
  const e = g.createLinearGradient(0, 0, 0, 128);
  e.addColorStop(0, 'rgba(255,255,255,0.0)'); e.addColorStop(0.5, 'rgba(255,255,255,0.35)'); e.addColorStop(1, 'rgba(255,255,255,0.0)');
  g.fillStyle = e; g.fillRect(0, 0, 8, 128);
  return tex(c);
}
/** 小溪的水纹（贴图偏移随时间滚动） */
export function rippleTexture() {
  const { c, g } = canvas(256, 256);
  g.fillStyle = '#9fdcff'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 26; i++) {
    const y = hash(i) * 256, x = hash(i + 50) * 256, w = 30 + hash(i + 9) * 60;
    g.strokeStyle = `rgba(255,255,255,${0.25 + hash(i + 3) * 0.35})`; g.lineWidth = 3; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + w / 2, y - 6, x + w, y); g.stroke();
  }
  const t = tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

// ───────── 材质与体块 ─────────
export const clay = (c: THREE.ColorRepresentation, r = 0.82) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: 0 });
export const glossy = (c: THREE.ColorRepresentation) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.32, metalness: 0 });
export const glowy = (c: THREE.ColorRepresentation, i = 1) => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: i, roughness: 0.5 });
export const additive = (map: THREE.Texture, c: THREE.ColorRepresentation = 0xffffff, o = 1) =>
  new THREE.MeshBasicMaterial({ map, color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });

const rboxCache = new Map<string, THREE.BufferGeometry>();
export function rbox(w: number, h: number, d: number, r = 0.14) {
  const k = `${w}|${h}|${d}|${r}`; let geo = rboxCache.get(k);
  if (!geo) { geo = new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001)); rboxCache.set(k, geo); }
  return geo;
}
export const SPHERE = new THREE.SphereGeometry(1, 28, 18);
export const CYL = new THREE.CylinderGeometry(1, 1, 1, 28);
export function mesh(geo: THREE.BufferGeometry, mat: THREE.Material | THREE.Material[], parent: THREE.Object3D, x = 0, y = 0, z = 0, shadow = true) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = shadow; m.receiveShadow = true; parent.add(m); return m;
}
export function blob(parent: THREE.Object3D, mat: THREE.Material, x: number, y: number, z: number, sx: number, sy: number, sz: number) {
  const m = mesh(SPHERE, mat, parent, x, y, z); m.scale.set(sx, sy, sz); return m;
}

// ───────── 共享资源 ─────────
export class Shared {
  atlas!: THREE.Texture;
  glow = glowTexture();
  star = starTexture();
  spiral = spiralTexture();
  ribbon = ribbonTexture();
  ripple = rippleTexture();
  /** 当前镜头所在区域的原点：演员、道具、机位都写区域内坐标 */
  origin = new THREE.Vector3();
  tint = new THREE.Color(1, 1, 1);
  async load(atlasUrl: string) {
    this.atlas = await new THREE.TextureLoader().loadAsync(atlasUrl);
    this.atlas.colorSpace = THREE.SRGBColorSpace; this.atlas.magFilter = THREE.NearestFilter; this.atlas.minFilter = THREE.LinearFilter;
    this.atlas.generateMipmaps = false; this.atlas.needsUpdate = true;
  }
}

const _right = new THREE.Vector3(), _fwd = new THREE.Vector3();
export function camRight(cam: THREE.Camera) {
  cam.getWorldDirection(_fwd); _right.crossVectors(_fwd, cam.up).normalize(); return _right;
}

// ───────── 像素纸片人（照 番外MV 的 Vite 工程写法：底边锚点、每帧转向镜头、帧号只由时间决定） ─────────
export const PX = 1 / 46;
function uvRect(uv: THREE.BufferAttribute, key: string) {
  const r = RECTS[key]; if (!r) throw new Error('图集缺格 ' + key);
  const [x, y, w, h] = r; const e = 0.4;
  const u0 = (x + e) / ATLAS_W, u1 = (x + w - e) / ATLAS_W, v0 = 1 - (y + h - e) / ATLAS_H, v1 = 1 - (y + e) / ATLAS_H;
  uv.setXY(0, u0, v1); uv.setXY(1, u1, v1); uv.setXY(2, u0, v0); uv.setXY(3, u1, v0); uv.needsUpdate = true; return r;
}
export type Who = 'whale' | 'gpt' | 'claude' | 'doubao' | 'gemini' | 'kimi' | 'qwen' | 'zai';
export const WHO: Who[] = ['whale', 'gpt', 'claude', 'doubao', 'gemini', 'kimi', 'qwen', 'zai'];

function spritePlane() { const g = new THREE.PlaneGeometry(1, 1); g.translate(0, 0.5, 0); return g; }

export class Thing {
  mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; frames: string[]; k = 1; fps = 6; roll = 0;
  private uv: THREE.BufferAttribute; private S: Shared;
  constructor(S: Shared, name: string, parent: THREE.Object3D) {
    this.S = S; const f = THINGS[name]; if (!f) throw new Error('没有道具 ' + name); this.frames = f;
    const g = spritePlane(); this.uv = g.getAttribute('uv') as THREE.BufferAttribute;
    this.mat = new THREE.MeshBasicMaterial({ map: S.atlas, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(g, this.mat); this.mesh.rotation.order = 'YXZ'; this.mesh.renderOrder = 3; this.mesh.visible = false; parent.add(this.mesh);
  }
  set(name: string) { const f = THINGS[name]; if (!f) throw new Error('没有道具 ' + name); this.frames = f; return this; }
  /** 区域内坐标 */
  put(x: number, y: number, z: number, k = 1) { const o = this.S.origin; this.mesh.position.set(x + o.x, y + o.y, z + o.z); this.k = k; this.mesh.visible = true; return this; }
  /** 世界坐标（跟手用） */
  putWorld(p: THREE.Vector3, k = 1) { this.mesh.position.copy(p); this.k = k; this.mesh.visible = true; return this; }
  hide() { this.mesh.visible = false; this.roll = 0; return this; }
  update(T: number, cam: THREE.Camera) {
    if (!this.mesh.visible) return;
    const [, , w, h] = uvRect(this.uv, this.frames[Math.floor(Math.max(0, T) * this.fps) % this.frames.length]);
    const s = PX * this.k; this.mesh.scale.set(w * s, h * s, 1);
    const p = this.mesh.position; this.mesh.rotation.set(0, Math.atan2(cam.position.x - p.x, cam.position.z - p.z), this.roll);
    this.mat.color.copy(this.S.tint);
  }
}

export class Actor {
  who: Who; mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; shadow: THREE.Mesh; fx: Thing; held: Thing | null = null;
  action = 'idle'; t0 = 0; speed = 1; flip = 1; roll = 0; k = 1; lift = 0; alpha = 1; h = 2; w = 1;
  heading: [number, number] | null = null; emoteName = ''; heldDx = 0.5; heldDy = 0.8; shadowOn = true;
  ground = new THREE.Vector3(); top = new THREE.Vector3(); hand = new THREE.Vector3();
  private uv: THREE.BufferAttribute; private S: Shared;
  constructor(S: Shared, who: Who, parent: THREE.Object3D) {
    this.S = S; this.who = who;
    const g = spritePlane(); this.uv = g.getAttribute('uv') as THREE.BufferAttribute;
    this.mat = new THREE.MeshBasicMaterial({ map: S.atlas, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(g, this.mat); this.mesh.rotation.order = 'YXZ'; this.mesh.renderOrder = 2;
    this.shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: S.glow, transparent: true, depthWrite: false, color: 0x3a2850, opacity: 0.38 }));
    this.shadow.rotation.x = -Math.PI / 2; this.shadow.renderOrder = 1;
    parent.add(this.mesh, this.shadow);
    this.fx = new Thing(S, 'fx_heart', parent);
    this.reset();
  }
  reset() {
    this.mesh.visible = false; this.shadow.visible = false; this.fx.hide(); if (this.held) this.held.hide(); this.held = null;
    this.action = 'idle'; this.t0 = 0; this.speed = 1; this.flip = 1; this.roll = 0; this.k = 1; this.lift = 0; this.alpha = 1;
    this.heading = null; this.emoteName = ''; this.shadowOn = true;
  }
  /** 区域内坐标：脚底落点 */
  put(x: number, y: number, z: number) { const o = this.S.origin; this.ground.set(x + o.x, y + o.y, z + o.z); this.mesh.visible = true; return this; }
  /** 播动作；图集里没有这个动作就报错（缺素材就报错，不悄悄替换） */
  do(action: string, t0 = 0, speed = 1) {
    const a = ACTIONS[this.who]?.[action]; if (!a) throw new Error(`没有动作 ${this.who}.${action}`);
    this.action = action; this.t0 = t0; this.speed = speed; return this;
  }
  face(d: number) { this.flip = d >= 0 ? 1 : -1; this.heading = null; return this; }
  /** 按移动方向自动决定朝向（走路帧默认朝右） */
  go(dx: number, dz: number) { this.heading = [dx, dz]; return this; }
  up(h: number) { this.lift = h; return this; }
  tilt(r: number) { this.roll = r; return this; }
  size(k: number) { this.k = k; return this; }
  fade(a: number) { this.alpha = a; return this; }
  emote(name: string) { this.emoteName = name; return this; }
  hold(t: Thing | null, dx = 0.5, dy = 0.8) { if (this.held && this.held !== t) this.held.hide(); this.held = t; this.heldDx = dx; this.heldDy = dy; return this; }
  update(T: number, cam: THREE.Camera) {
    if (!this.mesh.visible) { this.shadow.visible = false; this.fx.hide(); if (this.held) this.held.hide(); return; }
    const a = ACTIONS[this.who][this.action]; const n = a.frames.length;
    const f = Math.floor(Math.max(0, T - this.t0) * a.fps * this.speed);
    const idx = a.loop ? ((f % n) + n) % n : Math.min(n - 1, f);
    const [, , w, h] = uvRect(this.uv, a.frames[idx]);
    const s = PX * this.k; this.h = h * s; this.w = w * s;
    const right = camRight(cam);
    if (this.heading) { const d = this.heading[0] * right.x + this.heading[1] * right.z; if (Math.abs(d) > 1e-4) this.flip = d > 0 ? 1 : -1; }
    this.mesh.scale.set(w * s * this.flip, h * s, 1);
    const p = this.mesh.position; p.set(this.ground.x, this.ground.y + this.lift, this.ground.z);
    this.mesh.rotation.set(0, Math.atan2(cam.position.x - p.x, cam.position.z - p.z), this.roll);
    this.mat.color.copy(this.S.tint); this.mat.opacity = this.alpha;
    this.shadow.position.set(p.x, this.ground.y + 0.025, p.z);
    const sh = w * s * 0.8 * (1 - clamp(this.lift * 0.18, 0, 0.7)); this.shadow.scale.set(sh, sh * 0.5, 1); this.shadow.visible = this.alpha > 0.3 && this.shadowOn;
    // 头顶与手边：给表情贴、道具、棒棒糖用
    this.top.set(p.x - Math.sin(this.roll) * this.h, p.y + Math.cos(this.roll) * this.h, p.z);
    this.hand.copy(p).addScaledVector(right, this.heldDx * this.flip * this.k).add(new THREE.Vector3(0, this.heldDy * this.k, 0));
    this.hand.x += Math.sin(this.mesh.rotation.y) * 0.08; this.hand.z += Math.cos(this.mesh.rotation.y) * 0.08;
    if (this.emoteName) { this.fx.set(this.emoteName); this.fx.putWorld(new THREE.Vector3(this.top.x, this.top.y + 0.15 + Math.sin(T * 5) * 0.05, this.top.z), 1.5); this.fx.update(T, cam); } else this.fx.hide();
    if (this.held) { this.held.putWorld(this.hand, this.held.k || 1); this.held.update(T, cam); }
  }
}

// ───────── 3D 超级棒棒糖（程序化道具：螺旋糖片 + 糖棍 + 光晕） ─────────
export class Lollipop {
  group = new THREE.Group(); disc: THREE.Mesh; stick: THREE.Mesh; halo: THREE.Mesh; face: THREE.MeshStandardMaterial;
  lit = 1; spin = 0; flat = false; private S: Shared;
  constructor(S: Shared, parent: THREE.Object3D) {
    this.S = S;
    const discGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.16, 48); discGeo.rotateX(Math.PI / 2);
    this.face = new THREE.MeshStandardMaterial({ map: S.spiral, emissive: 0xffffff, emissiveMap: S.spiral, emissiveIntensity: 0.6, roughness: 0.3 });
    const side = glossy('#ffd3e2');
    this.disc = new THREE.Mesh(discGeo, [side, this.face, this.face]); this.disc.castShadow = true;
    this.stick = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.1, 12), clay('#fffaf2', 0.5)); this.stick.position.y = -0.95; this.stick.castShadow = true;
    this.halo = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), additive(S.glow, '#fff1d6', 1)); this.halo.renderOrder = 4;
    this.group.add(this.disc, this.stick); parent.add(this.group); parent.add(this.halo);
    this.hide();
  }
  hide() { this.group.visible = false; this.halo.visible = false; this.flat = false; return this; }
  /** 区域内坐标：糖片中心 */
  put(x: number, y: number, z: number, k = 1) { const o = this.S.origin; this.group.position.set(x + o.x, y + o.y, z + o.z); this.group.scale.setScalar(k); this.group.visible = true; return this; }
  putWorld(p: THREE.Vector3, k = 1) { this.group.position.copy(p); this.group.scale.setScalar(k); this.group.visible = true; return this; }
  /** 拿在某人手边（不画假手：糖棍底端贴在手边、略靠前） */
  holdBy(a: Actor, k = 0.55, raise = 0) { const p = a.hand.clone(); p.y += 0.62 * k + raise; return this.putWorld(p, k); }
  update(T: number, cam: THREE.Camera) {
    if (!this.group.visible) { this.halo.visible = false; return; }
    const p = this.group.position; const yaw = Math.atan2(cam.position.x - p.x, cam.position.z - p.z);
    if (this.flat) this.group.rotation.set(-Math.PI / 2, 0, 0); else this.group.rotation.set(0, yaw, 0);
    this.disc.rotation.z = this.spin;
    const l = clamp(this.lit, 0, 1.5);
    this.face.emissiveIntensity = 0.08 + l * 0.9; this.face.color.setScalar(0.55 + 0.45 * Math.min(1, l + 0.35));
    const k = this.group.scale.x; this.halo.visible = l > 0.01;
    this.halo.position.copy(p).add(new THREE.Vector3(Math.sin(yaw) * -0.05, 0, Math.cos(yaw) * -0.05));
    this.halo.rotation.set(0, yaw, 0); this.halo.scale.setScalar(k * (2.2 + 0.25 * Math.sin(T * 3)) * (0.6 + 0.4 * l));
    (this.halo.material as THREE.MeshBasicMaterial).opacity = 0.75 * Math.min(1, l);
  }
}

// ───────── 彩虹披风：一条始终朝向镜头的光带，形状由路径函数逐帧给出 ─────────
export class Ribbon {
  mesh: THREE.Mesh; private pos: THREE.BufferAttribute; private col: THREE.BufferAttribute; private n: number; private S: Shared;
  constructor(S: Shared, parent: THREE.Object3D, n = 64) {
    this.S = S; this.n = n;
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array((n + 1) * 2 * 3), uv = new Float32Array((n + 1) * 2 * 2), col = new Float32Array((n + 1) * 2 * 4); const idx: number[] = [];
    for (let i = 0; i <= n; i++) { uv.set([i / n, 0, i / n, 1], i * 4); if (i < n) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.BufferAttribute(col, 4)); g.setIndex(idx);
    this.pos = g.getAttribute('position') as THREE.BufferAttribute; this.col = g.getAttribute('color') as THREE.BufferAttribute;
    const m = new THREE.MeshBasicMaterial({ map: S.ribbon, vertexColors: true, transparent: true, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    this.mesh = new THREE.Mesh(g, m); this.mesh.frustumCulled = false; this.mesh.renderOrder = 5; this.mesh.visible = false; parent.add(this.mesh);
  }
  hide() { this.mesh.visible = false; }
  /** path(s) 返回区域内坐标；s=0 为头（糖），s=1 为尾 */
  draw(path: (s: number) => THREE.Vector3, width: number, cam: THREE.Camera, opacity = 1) {
    const o = this.S.origin, n = this.n, pts: THREE.Vector3[] = [];
    for (let i = 0; i <= n; i++) pts.push(path(i / n).add(o));
    const view = new THREE.Vector3(), tan = new THREE.Vector3(), side = new THREE.Vector3();
    for (let i = 0; i <= n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n, i + 1)]; tan.subVectors(b, a).normalize();
      view.subVectors(cam.position, pts[i]).normalize(); side.crossVectors(tan, view).normalize();
      const s = i / n, w = width * (0.35 + 0.65 * Math.sin(Math.min(1, s * 1.4) * Math.PI * 0.5)) * (1 - s * 0.35);
      this.pos.setXYZ(i * 2, pts[i].x + side.x * w, pts[i].y + side.y * w, pts[i].z + side.z * w);
      this.pos.setXYZ(i * 2 + 1, pts[i].x - side.x * w, pts[i].y - side.y * w, pts[i].z - side.z * w);
      const al = opacity * seg(s, 0, 0.06) * Math.pow(1 - s, 1.3);
      this.col.setXYZW(i * 2, 1, 1, 1, al); this.col.setXYZW(i * 2 + 1, 1, 1, 1, al);
    }
    this.pos.needsUpdate = true; this.col.needsUpdate = true; this.mesh.visible = true;
  }
}
