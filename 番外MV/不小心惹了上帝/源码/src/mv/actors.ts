import * as THREE from 'three';
import atlasUrl from '../assets/cast_atlas.png';
import atlasJson from '../assets/cast_atlas.json';
import actionsJson from '../assets/cast_actions.json';
import { rgb } from './core';

export type CharId = 'whale' | 'gpt' | 'claude' | 'doubao' | 'gemini' | 'kimi' | 'qwen' | 'zai';
export type Wear = 'crown' | 'hood' | 'tophat' | 'bow' | 'tiara' | 'ears' | 'halo';

type Rect = [number, number, number, number];
interface Anchor {
  cx: number;
  top: number;
  hw: number;
}
export interface AtlasData {
  tex: THREE.Texture;
  img: HTMLImageElement;
  w: number;
  h: number;
  rects: Record<string, Rect>;
  anchors: Record<string, Anchor>;
}

interface AtlasMeta {
  w: number;
  h: number;
  s: Record<string, Rect>;
}
export interface ActionMeta {
  label: string;
  fps: number;
  loop: boolean;
  frames: string[];
  fx: string | null;
  size: [number, number];
}
interface ActionsFile {
  actions: Record<string, Record<string, ActionMeta>>;
  props: string[];
  propsOf: Record<string, string[]>;
  fx: Record<string, string[]>;
}

export const ATLAS_META = atlasJson as unknown as AtlasMeta;
const ACT_FILE = actionsJson as unknown as ActionsFile;
export const ACTIONS = ACT_FILE.actions as Record<CharId, Record<string, ActionMeta>>;
export const PROPS = ACT_FILE.props;
export const FX = ACT_FILE.fx;

const CAST_SETS: Record<CharId, { walk: string; front: [string, string] }> = {
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
  let n = 0;
  while (ATLAS_META.s[`${prefix}${n}`]) n++;
  return n;
}

const WALK_N = Object.fromEntries(
  Object.entries(CAST_SETS).map(([id, s]) => [id, framesIn(s.walk)])
) as Record<CharId, number>;

function cycleIndex(i: number, n: number): number {
  return ((Math.floor(i) % n) + n) % n;
}

function actionFrame(meta: ActionMeta, t: number): number {
  const n = meta.frames.length;
  const i = Math.floor(Math.max(0, t) * meta.fps + 1e-6);
  return meta.loop ? cycleIndex(i, n) : Math.min(n - 1, i);
}

let atlasPromise: Promise<AtlasData> | null = null;
export function loadAtlas(): Promise<AtlasData> {
  if (!atlasPromise) {
    atlasPromise = new Promise<AtlasData>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const cv = document.createElement('canvas');
        cv.width = img.width;
        cv.height = img.height;
        const c = cv.getContext('2d', { willReadFrequently: true })!;
        c.drawImage(img, 0, 0);
        const data = c.getImageData(0, 0, img.width, img.height).data;
        const anchors: Record<string, Anchor> = {};
        for (const [key, r] of Object.entries(ATLAS_META.s)) {
          const [x0, y0, w, h] = r;
          let top = -1;
          let minX = w;
          let maxX = 0;
          for (let y = 0; y < h && (top < 0 || y < top + h * 0.32); y++) {
            for (let x = 0; x < w; x++) {
              if (data[((y0 + y) * img.width + x0 + x) * 4 + 3] > 128) {
                if (top < 0) top = y;
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
              }
            }
          }
          anchors[key] = {
            cx: (minX + maxX) / 2,
            top: Math.max(0, top),
            hw: Math.max(8, maxX - minX),
          };
        }
        const tex = new THREE.Texture(img);
        tex.flipY = false;
        tex.generateMipmaps = false;
        tex.minFilter = THREE.LinearFilter;
        tex.magFilter = THREE.NearestFilter;
        tex.needsUpdate = true;
        resolve({ tex, img, w: img.width, h: img.height, rects: ATLAS_META.s, anchors });
      };
      img.onerror = () => reject(new Error('Failed to load cast_atlas.png'));
      img.src = atlasUrl;
    });
  }
  return atlasPromise;
}

const portraitCache = new Map<string, string>();
export function getPortraitDataUrl(atlas: AtlasData, key: string): string {
  const cached = portraitCache.get(key);
  if (cached) return cached;
  const r = atlas.rects[key];
  if (!r) return '';
  const cv = document.createElement('canvas');
  cv.width = r[2];
  cv.height = r[3];
  const ctx = cv.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(atlas.img, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]);
  const url = cv.toDataURL('image/png');
  portraitCache.set(key, url);
  return url;
}

export function pixelMat(tex: THREE.Texture, tw: number, th: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    fog: true,
    side: THREE.DoubleSide,
    uniforms: {
      map: { value: tex },
      texSize: { value: new THREE.Vector2(tw, th) },
      rect: { value: new THREE.Vector4(0, 0, tw, th) },
      flip: { value: 0 },
      tint: { value: new THREE.Vector3(1, 1, 1) },
      sil: { value: 0 },
      silColor: { value: rgb(0x120e1f) },
      flash: { value: 0 },
      alpha: { value: 1 },
      glowAdd: { value: new THREE.Vector3(0, 0, 0) },
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
    fragmentShader: `uniform sampler2D map;
uniform vec2 texSize;
uniform vec4 rect;
uniform float flip;
uniform vec3 tint;
uniform float sil;
uniform vec3 silColor;
uniform float flash;
uniform float alpha;
uniform vec3 glowAdd;
varying vec2 vUv;
#include <fog_pars_fragment>
void main(){
  vec2 uv = vUv;
  if (flip > 0.5) uv.x = 1.0 - uv.x;
  vec2 pix = rect.xy + vec2(uv.x, 1.0 - uv.y) * rect.zw;
  vec2 seam = floor(pix + 0.5);
  vec2 d = max(fwidth(pix), vec2(0.0001));
  pix = seam + clamp((pix - seam) / d, -0.5, 0.5);
  pix = clamp(pix, rect.xy + 0.5, rect.xy + rect.zw - 0.5);
  vec4 c = texture2D(map, pix / texSize);
  if (c.a < 0.5) discard;
  if (alpha < 0.999) {
    float n = fract(sin(dot(floor(gl_FragCoord.xy), vec2(12.9898, 78.233))) * 43758.5453);
    if (n > alpha) discard;
  }
  vec3 col = c.rgb / max(c.a, 0.001);
  float eye = step(0.62, col.r) * step(col.g, 0.4) * step(col.b, 0.5);
  col = col * tint + glowAdd;
  col = mix(col, mix(silColor, vec3(1.0, 0.24, 0.3), eye), sil);
  col = mix(col, vec3(1.0), flash);
  gl_FragColor = vec4(col, 1.0);
#include <fog_fragment>
}`,
  });
}

const PX = 0.0195;
const M = 48;
const scaleFor = (key: string) =>
  key.startsWith('whale_big')
    ? 0.6
    : key.startsWith('gpt_boss') ||
        (key.startsWith('act_gpt_') && !key.startsWith('act_gpt_hover_'))
      ? 0.58
      : 1;

type Ctx = CanvasRenderingContext2D;
const R = (c: Ctx, col: string, x: number, y: number, w: number, h: number) => {
  c.fillStyle = col;
  c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};

// Pixel-art overlay accessories anchored to each character's head
const WEAR: Record<Wear, { back: boolean; draw: (c: Ctx, a: Anchor) => void }> = {
  halo: {
    back: false,
    draw: (c, a) => {
      const cx = Math.round(a.cx) + M;
      const cy = a.top + M - 11;
      for (let ang = 0; ang < 36; ang++) {
        const th = (ang / 36) * Math.PI * 2;
        const x = cx + Math.cos(th) * 14;
        const y = cy + Math.sin(th) * 4.5;
        R(c, '#b45309', x - 1, y - 1, 4, 4);
      }
      for (let ang = 0; ang < 36; ang++) {
        const th = (ang / 36) * Math.PI * 2;
        const x = cx + Math.cos(th) * 14;
        const y = cy + Math.sin(th) * 4.5;
        R(c, '#fde047', x, y, 2, 2);
      }
      R(c, '#ffffff', cx - 6, cy - 4, 5, 2);
    },
  },
  crown: {
    back: false,
    draw: (c, a) => {
      const x = Math.round(a.cx) + M;
      const y = a.top + M + 3;
      R(c, '#7a4a12', x - 7, y - 9, 15, 10);
      R(c, '#ffd166', x - 6, y - 4, 13, 4);
      R(c, '#ffd166', x - 6, y - 7, 3, 3);
      R(c, '#fff3b0', x - 1, y - 8, 3, 4);
      R(c, '#ffd166', x + 4, y - 7, 3, 3);
      R(c, '#e63946', x - 1, y - 3, 3, 2);
    },
  },
  tiara: {
    back: false,
    draw: (c, a) => {
      const x = Math.round(a.cx) + M;
      const y = a.top + M + 4;
      R(c, '#5a6988', x - 6, y - 3, 13, 4);
      R(c, '#eef6ff', x - 5, y - 2, 11, 2);
      R(c, '#2ce8f5', x - 1, y - 5, 3, 4);
    },
  },
  tophat: {
    back: false,
    draw: (c, a) => {
      const x = Math.round(a.cx) + M;
      const y = a.top + M + 5;
      R(c, '#1c0f2e', x - 12, y - 4, 25, 5);
      R(c, '#1c0f2e', x - 8, y - 18, 17, 15);
      R(c, '#6a35a8', x - 7, y - 17, 15, 13);
      R(c, '#ffd166', x - 7, y - 7, 15, 3);
    },
  },
  bow: {
    back: false,
    draw: (c, a) => {
      const x = Math.round(a.cx) + M;
      const y = a.top + M + 1;
      for (let i = 0; i < 6; i++) {
        R(c, '#2ce8f5', x - 2 - i, y - 3 - i, 1, 2 * i + 1);
        R(c, '#2ce8f5', x + 2 + i, y - 3 - i, 1, 2 * i + 1);
      }
      R(c, '#0099db', x - 2, y - 5, 5, 5);
    },
  },
  ears: {
    back: false,
    draw: (c, a) => {
      const y = a.top + M + 8;
      for (const s of [-1, 1]) {
        const x = Math.round(a.cx + s * a.hw * 0.26) + M;
        for (let i = 0; i < 12; i++) {
          R(c, '#241c36', x - Math.floor((12 - i) / 2), y - i, 12 - i, 1);
        }
      }
    },
  },
  hood: {
    back: true,
    draw: (c, a) => {
      const r = Math.round(a.hw / 2) + 4;
      const cx = Math.round(a.cx) + M;
      const cy = a.top + M + r - 3;
      for (let y = -r; y <= r; y++) {
        for (let x = -r; x <= r; x++) {
          const d = x * x + y * y;
          if (d <= r * r) {
            R(c, d > (r - 1.6) * (r - 1.6) ? '#8f1423' : '#e63946', cx + x, cy + y, 1, 1);
          }
        }
      }
    },
  },
};

const overlayCache = new Map<string, THREE.CanvasTexture>();
function overlayTex(atlas: AtlasData, wear: Wear, key: string): THREE.CanvasTexture {
  const id = `${wear}:${key}`;
  let t = overlayCache.get(id);
  if (!t) {
    const r = atlas.rects[key];
    const cv = document.createElement('canvas');
    cv.width = r[2] + 2 * M;
    cv.height = r[3] + 2 * M;
    WEAR[wear].draw(cv.getContext('2d')!, atlas.anchors[key]);
    t = new THREE.CanvasTexture(cv);
    t.flipY = false;
    t.generateMipmaps = false;
    t.minFilter = THREE.LinearFilter;
    t.magFilter = THREE.NearestFilter;
    overlayCache.set(id, t);
  }
  return t;
}

const cardGeo = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0);
const shadowGeo = new THREE.CircleGeometry(0.5, 20).rotateX(-Math.PI / 2);

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
  private _size = 1;
  private _sq = 0;
  private _tilt = 0;
  private _lift = 0;
  private _alpha = 1;
  private _flash = 0;
  private _sil = 0;
  private _flip = false;
  private _tint: THREE.Vector3 | null = null;
  private _glow = new THREE.Vector3(0, 0, 0);
  private _shadow = true;
  private _emote = '';
  private emoteCard: THREE.Mesh | null = null;
  private emoteMat: THREE.ShaderMaterial | null = null;
  height = 1.6;

  constructor(private atlas: AtlasData, public id: CharId, private baseSize = 1) {
    this.mat = pixelMat(atlas.tex, atlas.w, atlas.h);
    this.card = new THREE.Mesh(cardGeo, this.mat);
    this.shadow = new THREE.Mesh(
      shadowGeo,
      new THREE.MeshBasicMaterial({
        color: 0x0b0a16,
        transparent: true,
        opacity: 0.34,
        depthWrite: false,
      })
    );
    this.shadow.position.y = 0.025;
    this.inner.add(this.card);
    this.bill.add(this.inner);
    this.holder.add(this.bill, this.shadow);
    this.seed = id.charCodeAt(0) * 0.37 + id.length;
    this.set(CAST_SETS[id].front[0]);
  }

  wear(w: Wear): this {
    const tex = overlayTex(this.atlas, w, this.key);
    const mat = pixelMat(tex, tex.image.width, tex.image.height);
    const m = new THREE.Mesh(cardGeo, mat);
    m.position.z = WEAR[w].back ? -0.015 : 0.015;
    this.inner.add(m);
    this.layers.push({ wear: w, mesh: m, mat });
    this.syncLayers();
    return this;
  }

  set(key: string): this {
    if (key === this.key) return this;
    const r = this.atlas.rects[key];
    if (!r) return this;
    this.key = key;
    this.k = scaleFor(key);
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

  walk(T: number, rate = 1): this {
    const s = CAST_SETS[this.id];
    const n = WALK_N[this.id];
    const step = n === 2 ? 6 : 3;
    const f = cycleIndex((Math.round(T * 30) * rate) / step, n);
    return this.set(`${s.walk}${f}`);
  }

  walkBy(dist: number, cycle = 1.15): this {
    const s = CAST_SETS[this.id];
    const n = WALK_N[this.id];
    const sz = this.baseSize * this._size;
    const L = cycle * sz;
    const ph = (((dist % L) + L) % L) / L;
    const f = cycleIndex(ph * n, n);
    this._lift += Math.abs(Math.sin(ph * Math.PI * 2)) * 0.04 * sz;
    return this.set(`${s.walk}${f}`);
  }

  front(T: number): this {
    const s = CAST_SETS[this.id];
    const ph = (T + this.seed * 1.3) % 2.6;
    return this.set(ph < 0.13 ? s.front[1] : s.front[0]);
  }

  act(name: string, T: number, t0 = 0): this {
    const m = ACTIONS[this.id]?.[name];
    if (!m) return this.idle(T);
    return this.set(m.frames[actionFrame(m, T - t0)]);
  }

  idle(T: number): this {
    const name = ACTIONS[this.id]?.idle ? 'idle' : 'float';
    return this.act(name, T + this.seed * 1.3);
  }

  emote(fx: string | null, T = 0): this {
    if (!fx) {
      this._emote = '';
      return this;
    }
    const seq = FX[fx] ?? (this.atlas.rects[fx] ? [fx] : null);
    if (!seq) return this;
    this._emote = seq[cycleIndex(Math.floor(T * 6), seq.length)];
    return this;
  }

  at(x: number, y: number, z: number): this {
    this.holder.position.set(x, y, z);
    return this;
  }
  flip(b = true): this {
    this._flip = b;
    return this;
  }
  size(s: number): this {
    this._size = s;
    return this;
  }
  sq(a: number): this {
    this._sq = a;
    return this;
  }
  tilt(r: number): this {
    this._tilt = r;
    return this;
  }
  lift(h: number): this {
    this._lift = h;
    return this;
  }
  alpha(a: number): this {
    this._alpha = a;
    return this;
  }
  flash(v: number): this {
    this._flash = v;
    return this;
  }
  sil(v: number): this {
    this._sil = v;
    return this;
  }
  tint(hex: number | null): this {
    this._tint = hex == null ? null : rgb(hex);
    return this;
  }
  glow(hex: number, strength = 0.25): this {
    this._glow.copy(rgb(hex)).multiplyScalar(strength);
    return this;
  }
  noShadow(): this {
    this._shadow = false;
    return this;
  }
  hide(): this {
    this._alpha = 0;
    return this;
  }

  begin() {
    this._emote = '';
    this._size = 1;
    this._sq = 0;
    this._tilt = 0;
    this._lift = 0;
    this._alpha = 1;
    this._flash = 0;
    this._sil = 0;
    this._flip = false;
    this._tint = null;
    this._glow.set(0, 0, 0);
    this._shadow = true;
  }

  private commitEmote() {
    if (!this._emote) {
      if (this.emoteCard) this.emoteCard.visible = false;
      return;
    }
    if (!this.emoteCard) {
      this.emoteMat = pixelMat(this.atlas.tex, this.atlas.w, this.atlas.h);
      this.emoteCard = new THREE.Mesh(cardGeo, this.emoteMat);
      this.emoteCard.position.z = 0.025;
      this.bill.add(this.emoteCard);
    }
    const r = this.atlas.rects[this._emote];
    const a = this.atlas.anchors[this.key];
    const body = this.atlas.rects[this.key];
    const s = this.baseSize * this._size * this.k;
    (this.emoteMat!.uniforms.rect.value as THREE.Vector4).set(r[0], r[1], r[2], r[3]);
    this.emoteCard.scale.set(r[2] * PX * Math.max(s, 0.72), r[3] * PX * Math.max(s, 0.72), 1);
    const side = this._flip ? -1 : 1;
    const hx = a ? (a.cx + a.hw * 0.36 - body[2] / 2) * PX * s : 0.3 * s;
    const top = a ? (body[3] - a.top) * PX * s : this.height;
    this.emoteCard.position.set(side * hx, top + 0.04 * s, 0.025);
    this.emoteMat!.uniforms.alpha.value = this._alpha;
    this.emoteCard.visible = true;
  }

  commit(camera: THREE.Camera, cardTint: THREE.Vector3) {
    const vis = this._alpha > 0.02;
    this.holder.visible = vis;
    if (!vis) return;
    this.bill.quaternion.copy(camera.quaternion);
    this.bill.position.y = this._lift;
    this.commitEmote();
    const s = this.baseSize * this._size;
    this.inner.scale.set(s * (1 + this._sq * 0.65), s * (1 - this._sq), 1);
    this.inner.rotation.z = this._tilt;
    const tint = this._tint ?? cardTint;
    for (const m of [this.mat, ...this.layers.map((l) => l.mat)]) {
      const u = m.uniforms;
      u.flip.value = this._flip ? 1 : 0;
      u.alpha.value = this._alpha;
      u.flash.value = this._flash;
      u.sil.value = this._sil;
      (u.tint.value as THREE.Vector3).copy(tint);
      (u.glowAdd.value as THREE.Vector3).copy(this._glow);
    }
    const r = this.atlas.rects[this.key];
    const w = Math.min(1.5, r[2] * PX * this.k * s * 0.62);
    const k = Math.max(0.25, 1 - this._lift * 0.22);
    this.shadow.visible = this._shadow && this._sil < 0.5;
    this.shadow.scale.set(w * k, 1, w * 0.42 * k);
    (this.shadow.material as THREE.MeshBasicMaterial).opacity = 0.32 * k * this._alpha;
  }
}

export class PixelThing {
  holder = new THREE.Group();
  private card: THREE.Mesh;
  private mat: THREE.ShaderMaterial;
  private _size = 1;
  private _alpha = 1;
  private _tilt = 0;

  constructor(private atlas: AtlasData, public key: string, private baseSize = 1) {
    const r = atlas.rects[key];
    this.mat = pixelMat(atlas.tex, atlas.w, atlas.h);
    if (r) {
      (this.mat.uniforms.rect.value as THREE.Vector4).set(r[0], r[1], r[2], r[3]);
    }
    this.card = new THREE.Mesh(cardGeo, this.mat);
    if (r) {
      this.card.scale.set(r[2] * PX * baseSize, r[3] * PX * baseSize, 1);
    }
    this.holder.add(this.card);
  }

  at(x: number, y: number, z: number): this {
    this.holder.position.set(x, y, z);
    this.holder.visible = true;
    return this;
  }
  size(s: number): this {
    this._size = s;
    return this;
  }
  alpha(a: number): this {
    this._alpha = a;
    return this;
  }
  tilt(r: number): this {
    this._tilt = r;
    return this;
  }
  hide(): this {
    this._alpha = 0;
    return this;
  }

  begin() {
    this._size = 1;
    this._alpha = 1;
    this._tilt = 0;
  }

  commit(camera: THREE.Camera, cardTint: THREE.Vector3) {
    const vis = this._alpha > 0.02;
    this.holder.visible = vis;
    if (!vis) return;
    this.holder.quaternion.copy(camera.quaternion);
    this.card.rotation.z = this._tilt;
    const r = this.atlas.rects[this.key];
    if (r) {
      this.card.scale.set(r[2] * PX * this.baseSize * this._size, r[3] * PX * this.baseSize * this._size, 1);
    }
    this.mat.uniforms.alpha.value = this._alpha;
    (this.mat.uniforms.tint.value as THREE.Vector3).copy(cardTint);
  }
}
