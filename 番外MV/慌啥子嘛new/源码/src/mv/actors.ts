// 目标分支八位像素角色 + 派生动作 + 像素道具 + 表情贴（严格使用 cast_atlas.png / .json / cast_actions.json）
import * as THREE from 'three';
import { canvasTex, clamp01, rgb } from './kit';

export type CharId = 'whale' | 'gpt' | 'claude' | 'doubao' | 'gemini' | 'kimi' | 'qwen' | 'zai';
export type Rect = [number, number, number, number];

export interface ActionMeta {
  label: string;
  fps: number;
  loop: boolean;
  frames: string[];
  fx: string | null;
  size: [number, number];
}

interface AtlasJson {
  w: number;
  h: number;
  s: Record<string, Rect>;
}

interface ActionsJson {
  actions: Record<CharId, Record<string, ActionMeta>>;
  props: string[];
  propsOf: Record<string, string[]>;
  fx: Record<string, string[]>;
}

export interface AtlasData {
  tex: THREE.Texture;
  img: HTMLImageElement;
  w: number;
  h: number;
  rects: Record<string, Rect>;
  actions: Record<CharId, Record<string, ActionMeta>>;
  props: string[];
  fx: Record<string, string[]>;
}

export const CAST_INFO: Record<CharId, { name: string; role: string; portrait: string; color: string }> = {
  whale: { name: '鲸鱼娘', role: '本鲸 · 茶院引路人', portrait: 'p_whale_neutral', color: '#6ec6ff' },
  gpt: { name: '龙娘', role: '白龙 · 暮云守望者', portrait: 'p_gpt_neutral', color: '#e6d8ff' },
  claude: { name: '小克', role: '大小姐 · 书阁茶友', portrait: 'p_claude_neutral', color: '#ffb480' },
  doubao: { name: '豆包', role: '花坡踩拍暖场人', portrait: 'p_doubao_neutral', color: '#ff8da6' },
  gemini: { name: '猫', role: '双钟画师 · 追风客', portrait: 'p_gemini', color: '#a89bff' },
  kimi: { name: 'Kimi', role: '月球少女 · 掌灯人', portrait: 'p_kimi', color: '#c8b8ff' },
  qwen: { name: '千问', role: '折扇坝坝茶东道主', portrait: 'p_qwen', color: '#ffd166' },
  zai: { name: '智谱', role: '小狐狸 · 星枕睡神', portrait: 'p_zai', color: '#9ee6c8' },
};

export const CAST_SETS: Record<CharId, { walk: string; front: [string, string] }> = {
  whale: { walk: 'walk_whale_', front: ['whale_idle', 'whale_blink'] },
  claude: { walk: 'walk_claude_', front: ['claude_front_0', 'claude_front_1'] },
  kimi: { walk: 'walk_kimi_', front: ['kimi_front_0', 'kimi_front_1'] },
  gemini: { walk: 'walk_gemini_', front: ['gemini_front_0', 'gemini_front_1'] },
  qwen: { walk: 'walk_qwen_', front: ['qwen_front_0', 'qwen_front_1'] },
  zai: { walk: 'walk_zai_', front: ['zai_front_0', 'zai_front_1'] },
  doubao: { walk: 'walk_doubao_big_', front: ['doubao_cage_0', 'doubao_cage_1'] },
  gpt: { walk: 'gpt_fly_', front: ['gpt_boss_idle', 'gpt_boss_blink'] },
};

const PX = 0.0195;
const FPS = 30;

const scaleFor = (key: string) =>
  key.startsWith('whale_big')
    ? 0.6
    : key.startsWith('gpt_boss') || (key.startsWith('act_gpt_') && !key.startsWith('act_gpt_hover_'))
      ? 0.58
      : 1;

function cycleIndex(i: number, n: number): number {
  if (!Number.isFinite(i) || n < 1) return 0;
  return ((Math.floor(i) % n) + n) % n;
}

function actionFrame(meta: ActionMeta, t: number): number {
  const n = meta.frames.length;
  if (!Number.isFinite(t) || n < 1) return 0;
  const idx = Math.floor(Math.max(0, t) * meta.fps + 1e-6);
  return meta.loop ? cycleIndex(idx, n) : Math.min(n - 1, idx);
}

function framesIn(prefix: string, rects: Record<string, Rect>): number {
  let n = 0;
  while (rects[`${prefix}${n}`]) n++;
  return n;
}

import atlasRaw from './data/cast_atlas.json';
import actionsRaw from './data/cast_actions.json';

const ATLAS_IMG_URLS = [
  './assets/cast_atlas.png',
  'https://raw.githubusercontent.com/aavvcasdas/latest-aiyunying/arena/bb6a02da-latest-aiyunying/%E9%80%9A%E7%94%A8%E6%A8%A1%E6%9D%BF/engine/assets/cast_atlas.png',
];

function loadImageWithFallback(urls: string[]): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    let idx = 0;
    const tryNext = () => {
      if (idx >= urls.length) {
        reject(new Error('角色图集图片加载失败'));
        return;
      }
      const el = new Image();
      el.crossOrigin = 'anonymous';
      el.onload = () => resolve(el);
      el.onerror = () => {
        idx++;
        tryNext();
      };
      el.src = urls[idx];
    };
    tryNext();
  });
}

let atlasPromise: Promise<AtlasData> | null = null;
export function loadAtlas(): Promise<AtlasData> {
  if (!atlasPromise) {
    atlasPromise = (async () => {
      const metaRes = atlasRaw as unknown as AtlasJson;
      const actRes = actionsRaw as unknown as ActionsJson;
      const img = await loadImageWithFallback(ATLAS_IMG_URLS);
      const tex = new THREE.Texture(img);
      tex.flipY = false;
      tex.generateMipmaps = false;
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.NearestFilter;
      tex.needsUpdate = true;
      return {
        tex,
        img,
        w: metaRes.w,
        h: metaRes.h,
        rects: metaRes.s,
        actions: actRes.actions,
        props: actRes.props,
        fx: actRes.fx,
      };
    })();
  }
  return atlasPromise;
}

// 抗锯齿锐利像素着色器（任意缩放下像素边缘清晰锐利，受场景光染色与雾效影响）
export function pixelMat(tex: THREE.Texture, tw: number, th: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    fog: true,
    side: THREE.DoubleSide,
    // 纸片人与手持道具永远画在布景之前，绝不被桌子/云朵/屋体遮没
    depthTest: false,
    depthWrite: false,
    uniforms: {
      map: { value: tex },
      texSize: { value: new THREE.Vector2(tw, th) },
      rect: { value: new THREE.Vector4(0, 0, tw, th) },
      flip: { value: 0 },
      tint: { value: new THREE.Vector3(1, 1, 1) },
      flash: { value: 0 },
      alpha: { value: 1 },
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
uniform float flash;
uniform float alpha;
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
  vec3 col = (c.rgb / max(c.a, 0.001)) * tint;
  col = mix(col, vec3(1.0, 0.96, 0.85), flash);
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`,
  });
}

// 卡片几何：原点在脚底中心
const cardGeo = (() => {
  const g = new THREE.PlaneGeometry(1, 1);
  g.translate(0, 0.5, 0);
  return g;
})();

let shadowTex: THREE.Texture | null = null;
let shadowGeo: THREE.BufferGeometry | null = null;
function makeShadowMesh(): THREE.Mesh {
  if (!shadowTex) {
    shadowTex = canvasTex(
      64,
      64,
      (c) => {
        const gr = c.createRadialGradient(32, 32, 0, 32, 32, 30);
        gr.addColorStop(0, 'rgba(14,10,28,0.46)');
        gr.addColorStop(0.55, 'rgba(14,10,28,0.22)');
        gr.addColorStop(1, 'rgba(14,10,28,0)');
        c.fillStyle = gr;
        c.fillRect(0, 0, 64, 64);
      },
      false
    );
  }
  if (!shadowGeo) {
    shadowGeo = new THREE.PlaneGeometry(1, 1);
    shadowGeo.rotateX(-Math.PI / 2);
  }
  const m = new THREE.Mesh(
    shadowGeo,
    new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    })
  );
  m.position.y = 0.025;
  return m;
}

export class Actor {
  readonly id: CharId;
  readonly holder = new THREE.Group();
  private readonly bill = new THREE.Group();
  private readonly inner = new THREE.Group();
  private readonly card: THREE.Mesh;
  private readonly mat: THREE.ShaderMaterial;
  private readonly shadow: THREE.Mesh;
  private emoteCard: THREE.Mesh | null = null;
  private emoteMat: THREE.ShaderMaterial | null = null;
  private readonly atlas: AtlasData;
  private readonly baseSize: number;
  private readonly walkCount: number;
  private readonly seed: number;
  private key = '';
  private k = 1;
  height = 1.6;

  private _size = 1;
  private _sq = 0;
  private _tilt = 0;
  private _lift = 0;
  private _alpha = 1;
  private _flash = 0;
  private _flip = false;
  private _tint: THREE.Vector3 | null = null;
  private _shadow = true;
  private _emote = '';
  private _order = 20;

  constructor(atlas: AtlasData, id: CharId, baseSize = 1) {
    this.atlas = atlas;
    this.id = id;
    this.baseSize = baseSize * 1.1;
    this.walkCount = framesIn(CAST_SETS[id].walk, atlas.rects);
    this.seed = id.charCodeAt(0) * 0.37 + id.length;
    this.mat = pixelMat(atlas.tex, atlas.w, atlas.h);
    this.card = new THREE.Mesh(cardGeo, this.mat);
    this.shadow = makeShadowMesh();
    this.inner.add(this.card);
    this.bill.add(this.inner);
    this.holder.add(this.bill, this.shadow);
    this.set(CAST_SETS[id].front[0]);
  }

  begin() {
    this._size = 1;
    this._sq = 0;
    this._tilt = 0;
    this._lift = 0;
    this._alpha = 1;
    this._flash = 0;
    this._flip = false;
    this._tint = null;
    this._shadow = true;
    this._emote = '';
  }

  set(key: string): this {
    // 防御原图集 gpt_boss_cast1 小腿缺陷，一律走 gpt_boss_cast0
    const safeKey = key === 'gpt_boss_cast1' ? 'gpt_boss_cast0' : key;
    if (safeKey === this.key) return this;
    const r = this.atlas.rects[safeKey];
    if (!r) throw new Error(`[cast] 缺少精灵「${safeKey}」`);
    this.key = safeKey;
    this.k = scaleFor(safeKey);
    (this.mat.uniforms.rect.value as THREE.Vector4).set(r[0], r[1], r[2], r[3]);
    this.card.scale.set(r[2] * PX * this.k, r[3] * PX * this.k, 1);
    this.height = r[3] * PX * this.k * this.baseSize;
    return this;
  }

  act(name: string, T: number, t0 = 0): this {
    const m = this.atlas.actions[this.id]?.[name];
    if (!m) {
      return this.idle(T);
    }
    return this.set(m.frames[actionFrame(m, T - t0)]);
  }

  idle(T: number): this {
    const acts = this.atlas.actions[this.id];
    const name = acts?.idle ? 'idle' : 'float';
    return this.act(name, T + this.seed * 1.3);
  }

  front(T: number): this {
    const s = CAST_SETS[this.id];
    const ph = (((T + this.seed * 1.3) % 2.6) + 2.6) % 2.6;
    return this.set(ph < 0.13 ? s.front[1] : s.front[0]);
  }

  walk(T: number, rate = 1): this {
    const s = CAST_SETS[this.id];
    const step = this.walkCount === 2 ? 6 : 3;
    const f = cycleIndex((Math.round(T * FPS) * rate) / step, this.walkCount);
    return this.set(`${s.walk}${f}`);
  }

  walkBy(dist: number, cycle = 1.15): this {
    const s = CAST_SETS[this.id];
    const sz = this.baseSize * this._size;
    const L = Math.max(0.2, cycle * sz);
    const ph = (((dist % L) + L) % L) / L;
    const f = cycleIndex(ph * this.walkCount, this.walkCount);
    this._lift += Math.abs(Math.sin(ph * Math.PI * 2)) * 0.04 * sz;
    return this.set(`${s.walk}${f}`);
  }

  walkX(a: number, b: number, p: number, y: number, z: number): this {
    const x = a + (b - a) * p;
    this.walkBy(Math.abs(x - a));
    this.at(x, y, z);
    if (b < a) this.flip(true);
    return this;
  }

  emote(fx: string | null, T = 0): this {
    if (!fx) {
      this._emote = '';
      return this;
    }
    const seq = this.atlas.fx[fx] ?? (this.atlas.rects[fx] ? [fx] : null);
    if (!seq) return this;
    this._emote = seq[cycleIndex(Math.floor(T * 6), seq.length)];
    return this;
  }

  /** 纸片叠放次序（引擎按相机距离排序，后面的角色先画、前面的后画） */
  layer(order: number): this {
    this._order = order;
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
    this._alpha = clamp01(a);
    return this;
  }
  flash(v: number): this {
    this._flash = clamp01(v);
    return this;
  }
  tint(hex: number | null): this {
    this._tint = hex == null ? null : rgb(hex);
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

  commit(camPos: THREE.Vector3, sceneTint: THREE.Vector3) {
    const vis = this._alpha > 0.02;
    this.holder.visible = vis;
    if (!vis) return;

    // 绕 Y 轴始终朝向相机（纸片人立体书规范）
    const p = this.holder.position;
    this.bill.rotation.y = Math.atan2(camPos.x - p.x, camPos.z - p.z);

    const sz = this.baseSize * this._size;
    const sx = sz * (1 + this._sq);
    const sy = sz * Math.max(0.35, 1 - this._sq * 0.85);
    this.inner.scale.set(sx, sy, 1);
    this.inner.position.y = this._lift;
    this.inner.rotation.z = this._tilt;

    this.card.renderOrder = this._order;
    if (this.emoteCard) this.emoteCard.renderOrder = this._order + 0.5;
    this.mat.uniforms.flip.value = this._flip ? 1 : 0;
    this.mat.uniforms.alpha.value = this._alpha;
    this.mat.uniforms.flash.value = this._flash;
    const tv = this.mat.uniforms.tint.value as THREE.Vector3;
    if (this._tint) {
      tv.set(sceneTint.x * this._tint.x, sceneTint.y * this._tint.y, sceneTint.z * this._tint.z);
    } else {
      tv.copy(sceneTint);
    }

    // 接触阴影随离地高度缩小变淡
    this.shadow.visible = this._shadow;
    if (this._shadow) {
      const kLift = clamp01(1 - this._lift * 0.28);
      const sw = 1.25 * sz * (0.55 + 0.45 * kLift);
      this.shadow.scale.set(sw, sw * 0.65, 1);
      (this.shadow.material as THREE.MeshBasicMaterial).opacity = 0.85 * kLift * this._alpha;
    }

    // 头顶像素表情贴
    if (!this._emote) {
      if (this.emoteCard) this.emoteCard.visible = false;
    } else {
      const er = this.atlas.rects[this._emote];
      if (er) {
        if (!this.emoteCard || !this.emoteMat) {
          this.emoteMat = pixelMat(this.atlas.tex, this.atlas.w, this.atlas.h);
          this.emoteCard = new THREE.Mesh(cardGeo, this.emoteMat);
          this.bill.add(this.emoteCard);
        }
        this.emoteCard.visible = true;
        (this.emoteMat.uniforms.rect.value as THREE.Vector4).set(er[0], er[1], er[2], er[3]);
        (this.emoteMat.uniforms.tint.value as THREE.Vector3).set(1, 1, 1);
        this.emoteMat.uniforms.alpha.value = this._alpha;
        const ew = er[2] * PX * 0.9 * sz;
        const eh = er[3] * PX * 0.9 * sz;
        this.emoteCard.scale.set(ew, eh, 1);
        const hNow = this.card.scale.y * sy;
        this.emoteCard.position.set(0.42 * sz, this._lift + hNow * 0.88, 0.04);
      }
    }
  }
}

// 像素道具贴片（prop_bowl / prop_teacup / prop_book / prop_hourglass / prop_scroll / prop_fan / prop_abacus / prop_eyemask / prop_basket / prop_redshoes / prop_catclock / prop_brush）
export class Thing {
  readonly holder = new THREE.Group();
  private readonly card: THREE.Mesh;
  private readonly mat: THREE.ShaderMaterial;
  private readonly baseSize: number;
  private _size = 1;
  private _tilt = 0;
  private _alpha = 1;
  private _flip = false;

  constructor(atlas: AtlasData, key: string, baseSize = 1) {
    const r = atlas.rects[key];
    if (!r) throw new Error(`[cast] 缺少道具精灵「${key}」`);
    this.baseSize = baseSize;
    this.mat = pixelMat(atlas.tex, atlas.w, atlas.h);
    (this.mat.uniforms.rect.value as THREE.Vector4).set(r[0], r[1], r[2], r[3]);
    this.card = new THREE.Mesh(cardGeo, this.mat);
    // 道具像素稍大一点以便远近景清晰可读
    this.card.scale.set(r[2] * PX * 1.15, r[3] * PX * 1.15, 1);
    this.holder.add(this.card);
  }

  begin() {
    this._size = 1;
    this._tilt = 0;
    this._alpha = 1;
    this._flip = false;
  }

  at(x: number, y: number, z: number): this {
    this.holder.position.set(x, y, z);
    return this;
  }
  size(s: number): this {
    this._size = s;
    return this;
  }
  tilt(r: number): this {
    this._tilt = r;
    return this;
  }
  flip(b = true): this {
    this._flip = b;
    return this;
  }
  alpha(a: number): this {
    this._alpha = clamp01(a);
    return this;
  }
  hide(): this {
    this._alpha = 0;
    return this;
  }

  commit(camPos: THREE.Vector3, sceneTint: THREE.Vector3) {
    const vis = this._alpha > 0.02;
    this.holder.visible = vis;
    if (!vis) return;
    const p = this.holder.position;
    this.holder.rotation.y = Math.atan2(camPos.x - p.x, camPos.z - p.z);
    const sz = this.baseSize * this._size;
    this.holder.scale.set(sz, sz, 1);
    this.card.rotation.z = this._tilt;
    this.card.renderOrder = 18;
    this.mat.uniforms.flip.value = this._flip ? 1 : 0;
    this.mat.uniforms.alpha.value = this._alpha;
    (this.mat.uniforms.tint.value as THREE.Vector3).copy(sceneTint);
  }
}
