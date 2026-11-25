import * as THREE from 'three';
import { ACTIONS, ATLAS_H, ATLAS_W, RECTS, THINGS } from './atlasData';

// ───────── Deterministic Math ─────────
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const ease = (t: number) => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
export const easeIn = (t: number) => Math.pow(clamp(t), 3);
export const seg = (u: number, a: number, b: number) => clamp((u - a) / Math.max(1e-5, b - a));
export const arc = (t: number) => 4 * clamp(t) * (1 - clamp(t));
export const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export const TAU = Math.PI * 2;

export type Who = 'whale' | 'gpt' | 'claude' | 'doubao' | 'gemini' | 'kimi' | 'qwen' | 'zai';
export const WHO: Who[] = ['whale', 'gpt', 'claude', 'doubao', 'gemini', 'kimi', 'qwen', 'zai'];

// ───────── Procedural Canvas Textures (zero external background images) ─────────
function makeCanvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');
  if (!g) throw new Error('Canvas2D unavailable');
  return { c, g };
}

export function glowTexture() {
  const { c, g } = makeCanvas(128, 128);
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  r.addColorStop(0, 'rgba(255,255,255,1)');
  r.addColorStop(0.26, 'rgba(255,255,255,0.52)');
  r.addColorStop(0.62, 'rgba(255,255,255,0.12)');
  r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Crisp pixel-art '+' twinkle star matching the reference MV night sky */
export function pixelStarTexture() {
  const { c, g } = makeCanvas(32, 32);
  g.clearRect(0, 0, 32, 32);
  g.fillStyle = 'rgba(255,255,255,0.35)';
  g.fillRect(10, 10, 12, 12);
  g.fillStyle = '#ffffff';
  g.fillRect(14, 2, 4, 28);
  g.fillRect(2, 14, 28, 4);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  return t;
}

export class SharedResources {
  atlas!: THREE.Texture;
  benyuTex!: THREE.Texture;
  glow = glowTexture();
  pixelStar = pixelStarTexture();
  origin = new THREE.Vector3();
  tint = new THREE.Color(1, 1, 1);

  async load(atlasUrl: string, benyuUrl: string) {
    const loader = new THREE.TextureLoader();
    const [atlas, benyu] = await Promise.all([loader.loadAsync(atlasUrl), loader.loadAsync(benyuUrl)]);
    atlas.colorSpace = THREE.SRGBColorSpace;
    atlas.magFilter = THREE.NearestFilter;
    atlas.minFilter = THREE.LinearFilter;
    atlas.generateMipmaps = false;
    atlas.needsUpdate = true;

    benyu.colorSpace = THREE.SRGBColorSpace;
    benyu.magFilter = THREE.NearestFilter;
    benyu.minFilter = THREE.LinearFilter;
    benyu.generateMipmaps = false;
    benyu.needsUpdate = true;

    this.atlas = atlas;
    this.benyuTex = benyu;
  }
}

// ───────── Pixel Standees (Branch Cast from 人物/atlas.png) ─────────
export const PX = 1 / 44;

const _right = new THREE.Vector3();
const _fwd = new THREE.Vector3();
export function camRight(cam: THREE.Camera) {
  cam.getWorldDirection(_fwd);
  _right.crossVectors(_fwd, cam.up).normalize();
  return _right;
}

function uvRect(uv: THREE.BufferAttribute, key: string) {
  const r = RECTS[key];
  if (!r) throw new Error(`Atlas missing frame: ${key}`);
  const [x, y, w, h] = r;
  const e = 0.4;
  const u0 = (x + e) / ATLAS_W;
  const u1 = (x + w - e) / ATLAS_W;
  const v0 = 1 - (y + h - e) / ATLAS_H;
  const v1 = 1 - (y + e) / ATLAS_H;
  uv.setXY(0, u0, v1);
  uv.setXY(1, u1, v1);
  uv.setXY(2, u0, v0);
  uv.setXY(3, u1, v0);
  uv.needsUpdate = true;
  return r;
}

function spritePlane() {
  const g = new THREE.PlaneGeometry(1, 1);
  g.translate(0, 0.5, 0);
  return g;
}

export class Thing {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  frames: string[];
  k = 1;
  fps = 6;
  roll = 0;
  private uv: THREE.BufferAttribute;
  private S: SharedResources;

  constructor(S: SharedResources, name: string, parent: THREE.Object3D) {
    this.S = S;
    const f = THINGS[name];
    if (!f) throw new Error(`Unknown prop: ${name}`);
    this.frames = f;
    const g = spritePlane();
    this.uv = g.getAttribute('uv') as THREE.BufferAttribute;
    this.mat = new THREE.MeshBasicMaterial({
      map: S.atlas,
      transparent: true,
      alphaTest: 0.25,
      side: THREE.DoubleSide,
    });
    this.mesh = new THREE.Mesh(g, this.mat);
    this.mesh.rotation.order = 'YXZ';
    this.mesh.renderOrder = 4;
    this.mesh.visible = false;
    parent.add(this.mesh);
  }

  set(name: string) {
    const f = THINGS[name];
    if (!f) throw new Error(`Unknown prop: ${name}`);
    this.frames = f;
    return this;
  }

  put(x: number, y: number, z: number, k = 1) {
    const o = this.S.origin;
    this.mesh.position.set(x + o.x, y + o.y, z + o.z);
    this.k = k;
    this.mesh.visible = true;
    return this;
  }

  putWorld(p: THREE.Vector3, k = 1) {
    this.mesh.position.copy(p);
    this.k = k;
    this.mesh.visible = true;
    return this;
  }

  hide() {
    this.mesh.visible = false;
    this.roll = 0;
    return this;
  }

  update(T: number, cam: THREE.Camera) {
    if (!this.mesh.visible) return;
    const [, , w, h] = uvRect(this.uv, this.frames[Math.floor(Math.max(0, T) * this.fps) % this.frames.length]);
    const s = PX * this.k;
    this.mesh.scale.set(w * s, h * s, 1);
    const p = this.mesh.position;
    this.mesh.rotation.set(0, Math.atan2(cam.position.x - p.x, cam.position.z - p.z), this.roll);
    this.mat.color.copy(this.S.tint);
  }
}

export class Actor {
  who: Who;
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  shadow: THREE.Mesh;
  reflMesh: THREE.Mesh;
  reflMat: THREE.MeshBasicMaterial;
  fx: Thing;
  held: Thing | null = null;

  action = 'idle';
  t0 = 0;
  speed = 1;
  flip = 1;
  roll = 0;
  k = 1;
  lift = 0;
  alpha = 1;
  heading: [number, number] | null = null;
  emoteName = '';
  heldDx = 0.52;
  heldDy = 0.78;
  shadowOn = true;
  reflectOn = false;
  reflectY = 0.04;
  tintOverride: THREE.Color | null = null;

  ground = new THREE.Vector3();
  top = new THREE.Vector3();
  hand = new THREE.Vector3();
  private uv: THREE.BufferAttribute;
  private reflUv: THREE.BufferAttribute;
  private S: SharedResources;

  constructor(S: SharedResources, who: Who, parent: THREE.Object3D) {
    this.S = S;
    this.who = who;
    const g = spritePlane();
    this.uv = g.getAttribute('uv') as THREE.BufferAttribute;
    this.mat = new THREE.MeshBasicMaterial({
      map: S.atlas,
      transparent: true,
      alphaTest: 0.25,
      side: THREE.DoubleSide,
    });
    this.mesh = new THREE.Mesh(g, this.mat);
    this.mesh.rotation.order = 'YXZ';
    this.mesh.renderOrder = 3;

    // Mirror reflection sprite for water reflection shots ("留在你眼中")
    const rg = spritePlane();
    this.reflUv = rg.getAttribute('uv') as THREE.BufferAttribute;
    this.reflMat = new THREE.MeshBasicMaterial({
      map: S.atlas,
      transparent: true,
      alphaTest: 0.2,
      side: THREE.DoubleSide,
      depthWrite: false,
      opacity: 0.42,
    });
    this.reflMesh = new THREE.Mesh(rg, this.reflMat);
    this.reflMesh.rotation.order = 'YXZ';
    this.reflMesh.renderOrder = 2;
    this.reflMesh.visible = false;

    this.shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        map: S.glow,
        transparent: true,
        depthWrite: false,
        color: 0x162033,
        opacity: 0.42,
      })
    );
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.renderOrder = 1;

    parent.add(this.mesh, this.reflMesh, this.shadow);
    this.fx = new Thing(S, 'fx_sparkle', parent);
    this.reset();
  }

  reset() {
    this.mesh.visible = false;
    this.reflMesh.visible = false;
    this.shadow.visible = false;
    this.fx.hide();
    if (this.held) this.held.hide();
    this.held = null;
    this.action = 'idle';
    this.t0 = 0;
    this.speed = 1;
    this.flip = 1;
    this.roll = 0;
    this.k = 1;
    this.lift = 0;
    this.alpha = 1;
    this.heading = null;
    this.emoteName = '';
    this.shadowOn = true;
    this.reflectOn = false;
    this.reflectY = 0.04;
    this.tintOverride = null;
  }

  put(x: number, y: number, z: number) {
    const o = this.S.origin;
    this.ground.set(x + o.x, y + o.y, z + o.z);
    this.mesh.visible = true;
    return this;
  }

  do(action: string, t0 = 0, speed = 1) {
    const a = ACTIONS[this.who]?.[action];
    if (!a) throw new Error(`Missing action ${this.who}.${action}`);
    this.action = action;
    this.t0 = t0;
    this.speed = speed;
    return this;
  }

  face(d: number) {
    this.flip = d >= 0 ? 1 : -1;
    this.heading = null;
    return this;
  }

  go(dx: number, dz: number) {
    this.heading = [dx, dz];
    return this;
  }

  up(h: number) {
    this.lift = h;
    return this;
  }

  tilt(r: number) {
    this.roll = r;
    return this;
  }

  size(k: number) {
    this.k = k;
    return this;
  }

  fade(a: number) {
    this.alpha = a;
    return this;
  }

  noShadow() {
    this.shadowOn = false;
    return this;
  }

  reflect(yLevel = 0.04) {
    this.reflectOn = true;
    this.reflectY = yLevel;
    return this;
  }

  tint(c: THREE.ColorRepresentation) {
    this.tintOverride = new THREE.Color(c);
    return this;
  }

  emote(name: string) {
    this.emoteName = name;
    return this;
  }

  hold(t: Thing | null, dx = 0.52, dy = 0.78) {
    if (this.held && this.held !== t) this.held.hide();
    this.held = t;
    this.heldDx = dx;
    this.heldDy = dy;
    return this;
  }

  update(T: number, cam: THREE.Camera) {
    if (!this.mesh.visible) {
      this.shadow.visible = false;
      this.reflMesh.visible = false;
      this.fx.hide();
      if (this.held) this.held.hide();
      return;
    }
    const a = ACTIONS[this.who][this.action];
    const n = a.frames.length;
    const f = Math.floor(Math.max(0, T - this.t0) * a.fps * this.speed);
    const idx = a.loop ? ((f % n) + n) % n : Math.min(n - 1, f);
    const frameKey = a.frames[idx];
    const [, , w, h] = uvRect(this.uv, frameKey);
    const s = PX * this.k;
    const worldH = h * s;
    const right = camRight(cam);
    if (this.heading) {
      const d = this.heading[0] * right.x + this.heading[1] * right.z;
      if (Math.abs(d) > 1e-4) this.flip = d > 0 ? 1 : -1;
    }
    this.mesh.scale.set(w * s * this.flip, worldH, 1);
    const p = this.mesh.position;
    p.set(this.ground.x, this.ground.y + this.lift, this.ground.z);
    const yaw = Math.atan2(cam.position.x - p.x, cam.position.z - p.z);
    this.mesh.rotation.set(0, yaw, this.roll);

    this.mat.color.copy(this.tintOverride ?? this.S.tint);
    this.mat.opacity = this.alpha;
    this.mat.alphaTest = this.alpha < 0.85 ? 0.08 : 0.25;

    this.shadow.position.set(p.x, this.ground.y + 0.025, p.z);
    const sh = w * s * 0.82 * (1 - clamp(this.lift * 0.16, 0, 0.72));
    this.shadow.scale.set(sh, sh * 0.5, 1);
    this.shadow.visible = this.alpha > 0.35 && this.shadowOn;

    if (this.reflectOn) {
      uvRect(this.reflUv, frameKey);
      this.reflMesh.visible = true;
      const mirrorY = this.S.origin.y + this.reflectY;
      // Render reflection flat along the glassy mirror pool surface extending toward camera
      this.reflMesh.position.set(p.x, mirrorY + 0.02, p.z + 0.05);
      this.reflMesh.scale.set(w * s * this.flip, worldH * 0.88, 1);
      this.reflMesh.rotation.set(Math.PI / 2, 0, 0);
      this.reflMesh.renderOrder = 4;
      this.reflMat.color.set('#c7e2f7');
      this.reflMat.opacity = this.alpha * 0.48;
    } else {
      this.reflMesh.visible = false;
    }

    this.top.set(p.x - Math.sin(this.roll) * worldH, p.y + Math.cos(this.roll) * worldH, p.z);
    this.hand
      .copy(p)
      .addScaledVector(right, this.heldDx * this.flip * this.k)
      .add(new THREE.Vector3(0, this.heldDy * this.k, 0));
    this.hand.x += Math.sin(yaw) * 0.08;
    this.hand.z += Math.cos(yaw) * 0.08;

    if (this.emoteName) {
      this.fx.set(this.emoteName);
      this.fx.putWorld(
        new THREE.Vector3(this.top.x, this.top.y + 0.16 + Math.sin(T * 5) * 0.05, this.top.z),
        1.45
      );
      this.fx.update(T, cam);
    } else {
      this.fx.hide();
    }

    if (this.held) {
      this.held.putWorld(this.hand, this.held.k || 1);
      this.held.update(T, cam);
    }
  }
}

/**
 * 笨鱼 (Benyu — 鲸落 dream memory standee inside a shimmering dream bubble, no ground shadow!)
 */
export class BenyuSprite {
  group = new THREE.Group();
  sprite: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  bubble: THREE.Mesh;
  bubbleMat: THREE.MeshStandardMaterial;
  halo: THREE.Mesh;
  private S: SharedResources;

  constructor(S: SharedResources, parent: THREE.Object3D) {
    this.S = S;
    this.mat = new THREE.MeshBasicMaterial({
      map: S.benyuTex,
      transparent: true,
      alphaTest: 0.1,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.sprite = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), this.mat);
    this.sprite.renderOrder = 4;

    this.bubbleMat = new THREE.MeshStandardMaterial({
      color: '#b8d8ff',
      emissive: '#78b4ff',
      emissiveIntensity: 0.45,
      transparent: true,
      opacity: 0.24,
      roughness: 0.12,
      metalness: 0.1,
      depthWrite: false,
    });
    this.bubble = new THREE.Mesh(new THREE.IcosahedronGeometry(1.08, 2), this.bubbleMat);
    this.bubble.renderOrder = 5;

    this.halo = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 3.2),
      new THREE.MeshBasicMaterial({
        map: S.glow,
        color: '#8ec8ff',
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    this.halo.renderOrder = 3;

    this.group.add(this.halo, this.sprite, this.bubble);
    this.group.visible = false;
    parent.add(this.group);
  }

  hide() {
    this.group.visible = false;
  }

  show(x: number, y: number, z: number, alpha: number, scale: number, T: number, cam: THREE.Camera) {
    const o = this.S.origin;
    this.group.visible = alpha > 0.01;
    this.group.position.set(x + o.x, y + o.y + Math.sin(T * 2.4) * 0.14, z + o.z);
    this.group.scale.setScalar(scale);
    const yaw = Math.atan2(cam.position.x - this.group.position.x, cam.position.z - this.group.position.z);
    this.sprite.rotation.set(0, yaw, Math.sin(T * 1.8) * 0.08);
    this.halo.rotation.set(0, yaw, 0);
    this.bubble.rotation.set(T * 0.3, T * 0.45, 0);
    this.mat.opacity = alpha;
    this.bubbleMat.opacity = alpha * 0.24;
    (this.halo.material as THREE.MeshBasicMaterial).opacity = alpha * 0.42;
  }
}

// ───────── Signature 3D Voxel Kinetic Chinese Typography ─────────
interface VoxelCell {
  x: number;
  y: number;
  order: number;
  accent: 'main' | 'whale' | 'claude';
}

const MAX_VOXELS = 900;

export class VoxelKeyword3D {
  group = new THREE.Group();
  mesh: THREE.InstancedMesh;
  mat: THREE.MeshStandardMaterial;
  private cache = new Map<string, VoxelCell[]>();
  private dummy = new THREE.Object3D();
  private colMain = new THREE.Color();
  private colWhale = new THREE.Color('#5b9dff');
  private colClaude = new THREE.Color('#ff9447');
  private activeKey = '';

  constructor(parent: THREE.Object3D) {
    const geo = new THREE.BoxGeometry(0.92, 0.92, 0.72);
    this.mat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.42,
      metalness: 0.06,
      emissive: '#ffffff',
      emissiveIntensity: 0.32,
    });
    this.mesh = new THREE.InstancedMesh(geo, this.mat, MAX_VOXELS);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.group.add(this.mesh);
    this.group.visible = false;
    parent.add(this.group);
  }

  private rasterize(text: string): VoxelCell[] {
    const hit = this.cache.get(text);
    if (hit) return hit;

    const chars = Array.from(text);
    const cellH = 18;
    const cellW = Math.max(20, chars.length * 19 + 4);
    const { g } = makeCanvas(cellW, cellH);
    g.clearRect(0, 0, cellW, cellH);
    g.fillStyle = '#ffffff';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.font = `15px "MV Local", sans-serif`;
    chars.forEach((ch, idx) => {
      const cx = (idx + 0.5) * (cellW / chars.length);
      g.fillText(ch, cx, cellH * 0.52);
    });

    const data = g.getImageData(0, 0, cellW, cellH).data;
    const raw: VoxelCell[] = [];
    for (let y = 0; y < cellH; y++) {
      for (let x = 0; x < cellW; x++) {
        const alpha = data[(y * cellW + x) * 4 + 3];
        if (alpha > 105) {
          const h = hash(x * 31.7 + y * 17.3 + chars.length * 13);
          let accent: 'main' | 'whale' | 'claude' = 'main';
          // Embed a sparse poetic signature of Whale-blue & Claude-orange pixel tiles
          if (h > 0.965) accent = 'whale';
          else if (h < 0.032) accent = 'claude';
          raw.push({
            x: x - cellW / 2,
            y: cellH / 2 - y,
            order: x / cellW * 0.75 + (1 - y / cellH) * 0.25,
            accent,
          });
        }
      }
    }

    // Safety cap if text has very dense glyphs
    let cells = raw;
    if (cells.length > MAX_VOXELS) {
      const step = cells.length / MAX_VOXELS;
      cells = Array.from({ length: MAX_VOXELS }, (_, i) => raw[Math.floor(i * step)]);
    }
    this.cache.set(text, cells);
    return cells;
  }

  hide() {
    this.group.visible = false;
  }

  show(
    text: string,
    worldPos: THREE.Vector3,
    cam: THREE.Camera,
    progress: number, // 0..1 assembly, >1 stays assembled
    fadeOut: number, // 0..1 dissolve
    voxelSize: number,
    colorHex: string,
    T: number
  ) {
    if (progress <= 0.01 || fadeOut >= 0.99) {
      this.group.visible = false;
      return;
    }
    const cells = this.rasterize(text);
    this.group.visible = true;
    this.group.position.copy(worldPos);
    // Gently face camera horizontally while keeping authentic 3D depth parallax
    this.group.rotation.set(0, Math.atan2(cam.position.x - worldPos.x, cam.position.z - worldPos.z), 0);

    this.colMain.set(colorHex);
    this.mat.emissive.copy(this.colMain);
    this.mat.emissiveIntensity = 0.36 * (1 - fadeOut * 0.8);

    const needsColorUpdate = this.activeKey !== `${text}|${colorHex}`;
    this.activeKey = `${text}|${colorHex}`;

    const count = Math.min(cells.length, MAX_VOXELS);
    this.mesh.count = count;

    for (let i = 0; i < count; i++) {
      const cell = cells[i];
      const appear = easeOut(clamp((progress - cell.order * 0.45) / 0.45));
      const disappear = easeIn(clamp((fadeOut - (1 - cell.order) * 0.3) / 0.7));
      const sc = appear * (1 - disappear);

      const waveZ = Math.sin(T * 2.2 + cell.x * 0.32 + cell.y * 0.24) * 0.08;
      const dropY = (1 - appear) * 0.8 + disappear * 1.2;

      this.dummy.position.set(cell.x * voxelSize, cell.y * voxelSize + dropY, waveZ);
      this.dummy.scale.setScalar(Math.max(0.0001, sc * voxelSize));
      this.dummy.rotation.set(0, (1 - appear) * 1.1, 0);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);

      if (needsColorUpdate) {
        const col =
          cell.accent === 'whale'
            ? this.colWhale
            : cell.accent === 'claude'
              ? this.colClaude
              : this.colMain;
        this.mesh.setColorAt(i, col);
      }
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    if (needsColorUpdate && this.mesh.instanceColor) {
      this.mesh.instanceColor.needsUpdate = true;
    }
  }
}

// ───────── Deterministic 3D Pixel Firework System (Shot 16: "渐灭的花火") ─────────
interface FireworkBurst {
  launchT: number;
  burstT: number;
  x: number;
  y: number;
  z: number;
  radius: number;
  colorA: string;
  colorB: string;
  sparks: number;
}

const FIREWORK_BURSTS: FireworkBurst[] = [
  { launchT: 51.9, burstT: 52.35, x: -3.6, y: 5.8, z: -4.2, radius: 3.1, colorA: '#ffdf8e', colorB: '#ff945e', sparks: 68 },
  { launchT: 52.45, burstT: 52.95, x: 2.4, y: 6.6, z: -5.4, radius: 3.5, colorA: '#95e0ff', colorB: '#c9b3ff', sparks: 76 },
  { launchT: 53.05, burstT: 53.55, x: -0.4, y: 7.4, z: -6.0, radius: 3.8, colorA: '#ff9cb5', colorB: '#ffe99f', sparks: 82 },
  { launchT: 53.65, burstT: 54.15, x: 5.2, y: 5.6, z: -4.8, radius: 2.9, colorA: '#a3f2ca', colorB: '#95d6ff', sparks: 64 },
  { launchT: 54.2, burstT: 54.7, x: -5.2, y: 6.4, z: -5.2, radius: 3.0, colorA: '#ffd085', colorB: '#ff8da8', sparks: 64 },
];

export class FireworkSystem3D {
  mesh: THREE.InstancedMesh;
  private dummy = new THREE.Object3D();
  private col = new THREE.Color();
  private totalCapacity = 420;

  constructor(parent: THREE.Object3D) {
    const geo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
    const mat = new THREE.MeshBasicMaterial({
      color: '#ffffff',
      transparent: true,
      opacity: 0.95,
    });
    this.mesh = new THREE.InstancedMesh(geo, mat, this.totalCapacity);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.visible = false;
    parent.add(this.mesh);
  }

  hide() {
    this.mesh.visible = false;
  }

  update(T: number, origin: THREE.Vector3) {
    if (T < 51.8 || T > 56.4) {
      this.mesh.visible = false;
      return;
    }
    this.mesh.visible = true;
    let idx = 0;

    for (let b = 0; b < FIREWORK_BURSTS.length; b++) {
      const fw = FIREWORK_BURSTS[b];
      if (T < fw.launchT) continue;

      const cA = new THREE.Color(fw.colorA);
      const cB = new THREE.Color(fw.colorB);

      if (T < fw.burstT) {
        // Ascending glowing firework shell + tail
        const u = clamp((T - fw.launchT) / (fw.burstT - fw.launchT));
        for (let t = 0; t < 6 && idx < this.totalCapacity; t++) {
          const tu = clamp(u - t * 0.045);
          const py = mix(0.2, fw.y, easeOut(tu));
          this.dummy.position.set(origin.x + fw.x, origin.y + py, origin.z + fw.z);
          this.dummy.scale.setScalar(Math.max(0.01, (1 - t * 0.14) * 1.15));
          this.dummy.rotation.set(0, 0, 0);
          this.dummy.updateMatrix();
          this.mesh.setMatrixAt(idx, this.dummy.matrix);
          this.mesh.setColorAt(idx, cA);
          idx++;
        }
      } else {
        // Spherical pixel firework bloom + gravity droop + graceful ember fade ("渐灭的花火")
        const age = T - fw.burstT;
        if (age > 2.8) continue;
        const expand = easeOut(clamp(age / 0.78));
        const lifeFade = 1 - easeIn(clamp((age - 0.55) / 2.0));
        if (lifeFade <= 0.01) continue;

        for (let s = 0; s < fw.sparks && idx < this.totalCapacity; s++) {
          // Golden-angle Fibonacci sphere distribution for crisp spherical fireworks
          const phi = Math.acos(1 - (2 * (s + 0.5)) / fw.sparks);
          const theta = Math.PI * (1 + Math.sqrt(5)) * s + b * 2.1;
          const ringLayer = s % 3 === 0 ? 0.58 : 1.0;
          const r = fw.radius * expand * ringLayer * (0.88 + hash(b * 99 + s) * 0.24);

          const dx = Math.sin(phi) * Math.cos(theta) * r;
          const dy = Math.cos(phi) * r - age * age * 0.62; // gravity droop
          const dz = Math.sin(phi) * Math.sin(theta) * r * 0.65;

          const twinkle = 0.65 + 0.35 * Math.sin(T * 18 + s * 3.1);
          const sc = lifeFade * twinkle * (ringLayer < 0.8 ? 0.85 : 1.15);

          this.dummy.position.set(origin.x + fw.x + dx, origin.y + fw.y + dy, origin.z + fw.z + dz);
          this.dummy.scale.setScalar(Math.max(0.001, sc));
          this.dummy.rotation.set(age * 2 + s, age * 1.5, 0);
          this.dummy.updateMatrix();
          this.mesh.setMatrixAt(idx, this.dummy.matrix);

          this.col.copy(ringLayer < 0.8 ? cA : cB).multiplyScalar(0.55 + lifeFade * 0.8);
          this.mesh.setColorAt(idx, this.col);
          idx++;
        }
      }
    }

    this.mesh.count = idx;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }
}
