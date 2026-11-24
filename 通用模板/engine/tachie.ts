// 「长大后的样子」进成片：把立绘（`人物/立绘/art/tachie/*.png`）沿脊柱切成横带，逐条平移 / 旋转 / 缩放，
// 每帧画进一张离屏 Canvas，再当贴图挂在一条面向相机的纸片上——和 Q 版像素角色用同一套机位、光照、景深。
//
// 用法（镜头里）：
//   const grown = k.tachie('whale');                       // 长大后的鲸鱼娘
//   grown.act('sway', f.t).at(0, 0, 0);
//   grown.act('idle', f.t).at(0.8, 0, 0.2).size(0.9).flip();
//
// 规则（`设定/立绘.md`）：主用 Q 版；立绘只放「长大」时刻，1–2 镜，同一镜头可以长大，
// 也可以让小时候和长大的自己同框说话。切换处要给转场（闪白 / 推镜），不要硬切。
//
// 为什么是「每帧重画一张 Canvas」而不是几十个网格：立绘的形变本来就是 2D 画布上的横带积分，
// `人物/立绘/src/mv/rig.ts` 里那份 drawTachie 是唯一出处，这里直接调它，两边长得一模一样，也不用维护第二套公式。
import * as THREE from 'three';
import anchorsJson from './assets/tachie_anchors.json';
import { drawTachie } from '../../人物/立绘/src/mv/rig';
import { poseOf, poseOfBlend, ACTIONS } from '../../人物/立绘/src/mv/actions';
import type { Actor } from './actors';
import type { Frame } from './core';
import { imageOf } from './props';

export type TachieId = 'whale' | 'gpt' | 'claude' | 'gemini' | 'kimi' | 'doubao' | 'qwen' | 'zai';

export interface TachieAnchor {
  name: string;
  /** 原图像素尺寸 */
  w: number;
  h: number;
  /** 骨架三参数：下巴占全高比例、脚底中心、头部中心 */
  neck: number;
  cx: number;
  hx: number;
  /** 单张全身图的路径；独立五官 / 手部图层目前都为空 */
  base: string;
  layers: { eyes: string | null; mouth: string | null; hands: string | null };
}

export interface TachieMeta extends TachieAnchor {
  id: TachieId;
  /** 打包后的图片 URL（webpack / Vite 处理过的 import） */
  url: string;
  layerStatus: 'single-layer' | 'layered';
}

type AnchorJson = { layerStatus: 'single-layer' | 'layered'; anchors: Record<TachieId, TachieAnchor> };
const ANCHORS = (anchorsJson as AnchorJson).anchors;
const LAYER_STATUS = (anchorsJson as AnchorJson).layerStatus;

/** 八位角色的长大版。尺寸与骨架参数只读 assets/tachie_anchors.json，网页立绘与模板共用一份 */
export const TACHIE: Record<TachieId, TachieMeta> = {
  whale: { id: 'whale', url: '', layerStatus: LAYER_STATUS, ...ANCHORS.whale },
  gpt: { id: 'gpt', url: '', layerStatus: LAYER_STATUS, ...ANCHORS.gpt },
  claude: { id: 'claude', url: '', layerStatus: LAYER_STATUS, ...ANCHORS.claude },
  gemini: { id: 'gemini', url: '', layerStatus: LAYER_STATUS, ...ANCHORS.gemini },
  kimi: { id: 'kimi', url: '', layerStatus: LAYER_STATUS, ...ANCHORS.kimi },
  doubao: { id: 'doubao', url: '', layerStatus: LAYER_STATUS, ...ANCHORS.doubao },
  qwen: { id: 'qwen', url: '', layerStatus: LAYER_STATUS, ...ANCHORS.qwen },
  zai: { id: 'zai', url: '', layerStatus: LAYER_STATUS, ...ANCHORS.zai },
};

/**
 * 注册图片地址（浏览器侧由 `tachie-assets.ts` 在 import 时调用）。
 * 不把 PNG 直接 import 进来，是为了让 Node 端的测试能安全地 import 这个文件。
 */
export function setTachieUrls(urls: Partial<Record<TachieId, string>>): void {
  for (const [id, url] of Object.entries(urls)) if (url) TACHIE[id as TachieId].url = url;
}

export const TACHIE_IDS = Object.keys(TACHIE) as TachieId[];
export const isTachieId = (v: unknown): v is TachieId => typeof v === 'string' && v in TACHIE;

/** 世界里的基准身高（米）。Q 版约 1.6，长大版站在同一片地上要略高一点 */
export const TACHIE_H = 1.78;

const shadowGeo = new THREE.CircleGeometry(0.5, 24);
const planeGeo = new THREE.PlaneGeometry(1, 1);

export class Tachie {
  readonly holder = new THREE.Group();
  private bill = new THREE.Group();
  private mesh: THREE.Mesh;
  private mat: THREE.MeshBasicMaterial;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private tex: THREE.CanvasTexture;
  private shadow: THREE.Mesh;
  private img: HTMLImageElement;
  private meta: TachieMeta;
  // 每帧可写状态（begin() 复位）
  private _size = 1; private _alpha = 1; private _flip = false; private _lift = 0; private _shadowOn = true;
  /** 上一次画的动作与时间，避免同一帧重复重画 */
  private painted = '';
  /** 这一帧被要求播的动作与时间（和 painted 分开存：撞上缓存不重画，但状态照样要写全，预检才比对得上） */
  private _action = 'idle'; private _t = 0;

  constructor(meta: TachieMeta) {
    if (!meta.url) throw new Error(`[tachie] 「${meta.id}」的立绘素材没注册：在作品里 import '@tpl/tachie-assets'（或手动 setTachieUrls）`);
    this.meta = meta;
    this.img = imageOf(meta.url);
    this.canvas = document.createElement('canvas');
    this.canvas.width = meta.w;
    this.canvas.height = meta.h;
    const c = this.canvas.getContext('2d');
    if (!c) throw new Error('[tachie] 拿不到 2D 画布');
    this.ctx = c;
    this.tex = new THREE.CanvasTexture(this.canvas);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.tex.minFilter = THREE.LinearFilter;
    this.tex.magFilter = THREE.LinearFilter;
    this.tex.generateMipmaps = false;
    this.mat = new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(planeGeo, this.mat);
    this.shadow = new THREE.Mesh(shadowGeo, new THREE.MeshBasicMaterial({ color: 0x0b0a16, transparent: true, opacity: 0.28, depthWrite: false }));
    this.shadow.rotation.x = -Math.PI / 2;
    this.bill.add(this.mesh);
    this.holder.add(this.bill, this.shadow);
    this.act('idle', 0, 0);
  }

  /**
   * 换成某个动作的第 t 秒（动作名见 人物/立绘/src/mv/actions.ts 的 ACTIONS）。
   * t 是动作局部时间，T 是全片时间只用来叠呼吸，beat 是拍位；三者都不读全局状态。
   */
  act(action: string, t: number, T = 0, beat = t * 2): this {
    if (!ACTIONS[action]) throw new Error(`[tachie] 没有动作「${action}」（可用：${Object.keys(ACTIONS).join('、')}）`);
    this._action = action; this._t = t;   // 状态先写全（哪怕这一帧看不见）
    const key = `${action}|${t.toFixed(3)}|${T.toFixed(3)}|${beat.toFixed(3)}|${this._flip ? 1 : 0}`;
    if (key === this.painted || !(this._alpha > 0.02)) return this;
    this.painted = key;
    const pose = poseOf(action, t, beat, T, this.meta.cx * 9);
    this.ctx.clearRect(0, 0, this.meta.w, this.meta.h);
    drawTachie(this.ctx, { img: this.img, w: this.meta.w, h: this.meta.h }, this.meta as never, pose, this.meta.w / 2, this.meta.h, this.meta.h, this._flip);
    this.tex.needsUpdate = true;
    return this;
  }

  /**
   * 推荐的成片时钟 API：从 Frame 取动作局部时间 f.t、全片时间 f.T 和实测拍位 f.bt，
   * 不再把全片秒数误当成动作秒数。t0 可以让动作从镜头内某个时间点起算。
   */
  actFrame(action: string, f: Frame, t0 = 0): this {
    return this.act(action, f.t - t0, f.T, f.bt.idx + f.bt.phase);
  }

  /** 两个动作交叉淡入：w=0 是 a，w=1 是 b。仍是纯函数，倒放 / 跳帧一致。 */
  blend(a: string, ta: number, b: string, tb: number, w: number, T = 0, beat = Math.max(ta, tb) * 2): this {
    if (!ACTIONS[a] || !ACTIONS[b]) throw new Error(`[tachie] 混合动作不存在：「${a}」或「${b}」`);
    const k = Math.max(0, Math.min(1, w));
    this._action = `${a}+${b}@${k.toFixed(3)}`; this._t = ta + (tb - ta) * k;
    const key = `${a}|${ta.toFixed(3)}|${b}|${tb.toFixed(3)}|${k.toFixed(3)}|${T.toFixed(3)}|${beat.toFixed(3)}|${this._flip ? 1 : 0}`;
    if (key === this.painted || !(this._alpha > 0.02)) return this;
    this.painted = key;
    const pose = poseOfBlend(a, ta, b, tb, k, beat, T, this.meta.cx * 9);
    this.ctx.clearRect(0, 0, this.meta.w, this.meta.h);
    drawTachie(this.ctx, { img: this.img, w: this.meta.w, h: this.meta.h }, this.meta as never, pose, this.meta.w / 2, this.meta.h, this.meta.h, this._flip);
    this.tex.needsUpdate = true;
    return this;
  }

  at(x: number, y: number, z: number): this { this.holder.position.set(x, y, z); return this; }
  size(s: number): this { this._size = s; return this; }
  flip(b = true): this { if (b !== this._flip) { this._flip = b; this.painted = ''; } return this; }
  alpha(a: number): this { this._alpha = a; return this; }
  lift(h: number): this { this._lift = h; return this; }
  noShadow(): this { this._shadowOn = false; return this; }
  hide(): this { this._alpha = 0; return this; }
  get x() { return this.holder.position.x; }

  begin() { this._size = 1; this._alpha = 1; this._flip = false; this._lift = 0; this._shadowOn = true; }

  /** 这一帧的全部状态，写一行——和 Actor.stateLine() 一样给全片预检核对用 */
  stateLine(): string {
    if (!(this._alpha > 0.02)) return '显隐=不显示';
    const p = this.holder.position;
    return `显隐=显示;角色=${this.meta.id}(长大);位置=${p.x},${p.y},${p.z};大小=${this._size};透明度=${this._alpha};跳起=${this._lift};左右翻转=${this._flip};动作=${this._action}@${this._t.toFixed(3)}`;
  }

  /** cam：相机；tint：这一镜的调色（engine 的 cardTint，和 Q 版角色吃的是同一个），立绘是 unlit 材质，靠它跟环境对齐 */
  commit(cam: THREE.Camera, tint?: THREE.Vector3) {
    const vis = this._alpha > 0.02 && Number.isFinite(this._size);
    this.holder.visible = vis;
    if (!vis) return;
    this.bill.quaternion.copy(cam.quaternion);
    this.bill.position.y = this._lift;
    const h = TACHIE_H * this._size;
    this.mesh.scale.set(h * (this.meta.w / this.meta.h), h, 1);
    this.mesh.position.y = h / 2;
    this.mat.opacity = this._alpha;
    if (tint) this.mat.color.setRGB(tint.x, tint.y, tint.z);
    this.shadow.visible = this._shadowOn;
    this.shadow.position.y = 0.02;
    this.shadow.scale.set(h * 0.34 * Math.max(0.4, 1 - this._lift * 3), h * 0.14, 1);
    (this.shadow.material as THREE.MeshBasicMaterial).opacity = 0.26 * this._alpha;
  }
}

/**
 * 动态长大：同一个镜头里从 Q 版渐变到长大版。
 * p = 0 还是小孩，p = 1 完全长大；中间 Q 版缩小、淡出，长大版放大、浮现，站位不动——
 * 配一次闪白（fx.flash）或推镜，观众读到的是「她长大了」，而不是「换了张图」。
 */
export function growInto(q: Actor, g: Tachie, p: number): void {
  const k = Math.max(0, Math.min(1, p));
  // 前半段让 Q 版先退、后半段长大版才进：两个都半透的「重影」只在中间几帧出现，压在闪白里
  const out = Math.min(1, k / 0.55), inn = Math.max(0, (k - 0.45) / 0.55);
  q.alpha(1 - out).size(1 - 0.2 * out);
  g.alpha(inn).size(0.78 + 0.22 * inn);
}
