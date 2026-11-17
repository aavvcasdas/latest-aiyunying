// 确定性 3D 立体绘本 MV 渲染引擎（纯时间函数 T -> 画面，任意跳帧零残影、零状态漂移）
import * as THREE from 'three';
import { Actor, type AtlasData, type CharId, Thing } from './actors';
import {
  type BeatState,
  CUES,
  type LyricCue,
  SHOT_SLOTS,
  type ShotSlot,
  beatAt,
  charAge,
  shotSlotAt,
  wordAge,
  wordProg,
} from './cues';
import {
  LOOKS,
  type Look,
  type LookName,
  clamp01,
  ease,
  lerp,
  makeSky,
  makeStars,
  rgb,
  timeU,
} from './kit';
import { type WordSculpture, type WordSculptureOpts, createWordSculpture } from './words3d';

export interface CamState {
  pos: [number, number, number];
  look: [number, number, number];
  fov: number;
}

export const cam = (
  pos: [number, number, number],
  look: [number, number, number],
  fov = 40
): CamState => ({ pos, look, fov });

export function mixCam(a: CamState, b: CamState, raw: number, smooth = true): CamState {
  const t = smooth ? ease(raw) : clamp01(raw);
  return {
    pos: [lerp(a.pos[0], b.pos[0], t), lerp(a.pos[1], b.pos[1], t), lerp(a.pos[2], b.pos[2], t)],
    look: [lerp(a.look[0], b.look[0], t), lerp(a.look[1], b.look[1], t), lerp(a.look[2], b.look[2], t)],
    fov: lerp(a.fov, b.fov, t),
  };
}

export const glide = (a: CamState, b: CamState, u: number) => mixCam(a, b, u, true);

export function track(keys: [number, CamState][], u: number): CamState {
  if (keys.length === 1 || u <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [u0, c0] = keys[i];
    const [u1, c1] = keys[i + 1];
    if (u <= u1) return mixCam(c0, c1, (u - u0) / Math.max(0.0001, u1 - u0), true);
  }
  return keys[keys.length - 1][1];
}

export interface FrameCtx {
  u: number;
  T: number;
  localT: number;
  bt: BeatState;
  cue: LyricCue | null;
  /** 第 wIdx 个「词」的演唱进度 0..1 */
  wp: (wIdx: number) => number;
  /** 第 wIdx 个「词」起唱后的秒数（未唱到 < 0） */
  wa: (wIdx: number) => number;
  /** 第 cIdx 个「字」起唱后的秒数（未唱到 < 0） */
  ca: (cIdx: number) => number;
}

export interface Kit {
  add: <T extends THREE.Object3D>(obj: T, x?: number, y?: number, z?: number, ry?: number, s?: number) => T;
  actor: (id: CharId, baseSize?: number) => Actor;
  thing: (propKey: string, baseSize?: number) => Thing;
  /** 动态混合当前镜头 look 与 lookTo（例如「太阳下山有月亮爬上来」从绯橙日落平滑渐变为靛蓝升月） */
  lookMix: (t: number) => void;
}

export interface ShotFx {
  title?: boolean;
  whiteIn?: boolean;
  whiteOut?: boolean;
  fadeIn?: boolean;
  fadeOut?: boolean;
  flash?: number[];
}

export interface ShotDef {
  id: string;
  look: LookName;
  lookTo?: LookName;
  title: string;
  lyricHint?: string;
  cast: CharId[];
  wordOpts?: WordSculptureOpts;
  fx?: ShotFx;
  build: (k: Kit) => (f: FrameCtx) => CamState;
}

interface BuiltShot {
  def: ShotDef;
  slot: ShotSlot;
  group: THREE.Group;
  actors: Actor[];
  things: Thing[];
  wordSculpture: WordSculpture | null;
  step: (f: FrameCtx) => CamState;
  getLookMix: () => number;
  resetLookMix: () => void;
}

export interface OverlayState {
  shot: ShotDef;
  slot: ShotSlot;
  shotIdx: number;
  u: number;
  white: number;
  black: number;
  showTitle: boolean;
  titleProgress: number;
}

const tmpTop = new THREE.Color();
const tmpMid = new THREE.Color();
const tmpHor = new THREE.Color();
const tmpLow = new THREE.Color();
const tmpSun = new THREE.Color();
const tmpAmb = new THREE.Color();
const tmpCard = new THREE.Color();
const tmpB = new THREE.Color();

function lerpColor(out: THREE.Color, hexA: number, hexB: number, t: number): THREE.Color {
  out.setHex(hexA);
  if (t > 0.0001) {
    tmpB.setHex(hexB);
    out.lerp(tmpB, t);
  }
  return out;
}

export class MVEngine {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly atlas: AtlasData;
  private readonly defs = new Map<string, ShotDef>();
  private readonly built = new Map<string, BuiltShot>();
  private readonly sky: THREE.Mesh;
  private readonly stars: THREE.Points;
  private readonly sunLight: THREE.DirectionalLight;
  private readonly fillLight: THREE.DirectionalLight;
  private readonly ambLight: THREE.AmbientLight;
  private readonly fog: THREE.Fog;
  private readonly cardTint = new THREE.Vector3(1, 1, 1);
  private activeGroup: THREE.Group | null = null;
  showWords3D = true;

  constructor(canvas: HTMLCanvasElement, atlas: AtlasData, shots: ShotDef[]) {
    this.atlas = atlas;
    shots.forEach((s) => this.defs.set(s.id, s));

    // 校验 47 个镜头全部就位
    for (const sl of SHOT_SLOTS) {
      if (!this.defs.has(sl.id)) {
        throw new Error(`[MVEngine] 缺少镜头定义：${sl.id}`);
      }
    }

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NoToneMapping;

    this.scene = new THREE.Scene();
    this.fog = new THREE.Fog(0xbfe0f7, 40, 290);
    this.scene.fog = this.fog;

    this.camera = new THREE.PerspectiveCamera(40, 16 / 9, 0.15, 900);

    this.sky = makeSky();
    this.stars = makeStars();
    this.scene.add(this.sky, this.stars);

    this.sunLight = new THREE.DirectionalLight(0xfff2d2, 2.5);
    this.fillLight = new THREE.DirectionalLight(0xdbe8ff, 0.55);
    this.fillLight.position.set(-0.6, 0.4, 0.7);
    this.ambLight = new THREE.AmbientLight(0xbcd0ff, 1.55);
    this.scene.add(this.sunLight, this.fillLight, this.ambLight);
  }

  resize(width: number, height: number, dpr = 1) {
    const w = Math.max(1, Math.round(width));
    const h = Math.max(1, Math.round(height));
    this.renderer.setPixelRatio(Math.min(2, dpr));
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  private ensureBuilt(slot: ShotSlot): BuiltShot {
    const hit = this.built.get(slot.id);
    if (hit) return hit;

    const def = this.defs.get(slot.id)!;
    const group = new THREE.Group();
    group.visible = false;
    const actors: Actor[] = [];
    const things: Thing[] = [];
    let mixVal = 0;

    const kit: Kit = {
      add: (obj, x = 0, y = 0, z = 0, ry = 0, s = 1) => {
        obj.position.set(x, y, z);
        if (ry !== 0) obj.rotation.y = ry;
        if (s !== 1) obj.scale.multiplyScalar(s);
        group.add(obj);
        return obj;
      },
      actor: (id, baseSize = 1) => {
        const a = new Actor(this.atlas, id, baseSize);
        actors.push(a);
        group.add(a.holder);
        return a;
      },
      thing: (propKey, baseSize = 1) => {
        const th = new Thing(this.atlas, propKey, baseSize);
        things.push(th);
        group.add(th.holder);
        return th;
      },
      lookMix: (t: number) => {
        mixVal = clamp01(t);
      },
    };

    const step = def.build(kit);

    // 歌词镜头自动构建 3D 逐字逐词立体活字雕塑
    let wordSculpture: WordSculpture | null = null;
    if (slot.cueIdx >= 0) {
      const cue = CUES[slot.cueIdx];
      wordSculpture = createWordSculpture(cue, {
        ...(def.wordOpts ?? {}),
        revealAt: slot.start + 0.06,
      });
      group.add(wordSculpture.group);
    }

    this.scene.add(group);
    const entry: BuiltShot = {
      def,
      slot,
      group,
      actors,
      things,
      wordSculpture,
      step,
      getLookMix: () => mixVal,
      resetLookMix: () => {
        mixVal = 0;
      },
    };
    this.built.set(slot.id, entry);
    return entry;
  }

  private applyLook(aName: LookName, bName: LookName | undefined, t: number, T: number) {
    const A: Look = LOOKS[aName];
    const B: Look = bName ? LOOKS[bName] : A;
    const m = bName ? clamp01(t) : 0;

    lerpColor(tmpTop, A.top, B.top, m);
    lerpColor(tmpMid, A.mid, B.mid, m);
    lerpColor(tmpHor, A.hor, B.hor, m);
    tmpLow.copy(tmpHor).multiplyScalar(0.76);

    const skyU = (this.sky.material as THREE.ShaderMaterial).uniforms;
    (skyU.top.value as THREE.Vector3).set(tmpTop.r, tmpTop.g, tmpTop.b);
    (skyU.mid.value as THREE.Vector3).set(tmpMid.r, tmpMid.g, tmpMid.b);
    (skyU.hor.value as THREE.Vector3).set(tmpHor.r, tmpHor.g, tmpHor.b);
    (skyU.low.value as THREE.Vector3).set(tmpLow.r, tmpLow.g, tmpLow.b);

    this.fog.color.copy(tmpHor);
    this.fog.near = lerp(A.fog[0], B.fog[0], m);
    this.fog.far = lerp(A.fog[1], B.fog[1], m);

    lerpColor(tmpSun, A.sun, B.sun, m);
    this.sunLight.color.copy(tmpSun);
    this.sunLight.intensity = lerp(A.sunI, B.sunI, m);
    this.sunLight.position.set(
      lerp(A.dir[0], B.dir[0], m) * 40,
      lerp(A.dir[1], B.dir[1], m) * 40,
      lerp(A.dir[2], B.dir[2], m) * 40
    );

    lerpColor(tmpAmb, A.amb, B.amb, m);
    this.ambLight.color.copy(tmpAmb);
    this.ambLight.intensity = lerp(A.ambI, B.ambI, m);

    const starsOp = lerp(A.stars, B.stars, m);
    this.stars.visible = starsOp > 0.02;
    if (this.stars.visible) {
      const mat = this.stars.material as THREE.PointsMaterial;
      mat.opacity = starsOp * (0.88 + 0.12 * Math.sin(T * 2.1));
      this.stars.rotation.y = T * 0.008;
    }

    lerpColor(tmpCard, A.card, B.card, m);
    const rVec = rgb(tmpCard.getHex());
    this.cardTint.copy(rVec);
  }

  render(T: number): OverlayState {
    timeU.value = T;
    const { slot, index, u } = shotSlotAt(T);
    const b = this.ensureBuilt(slot);

    if (this.activeGroup && this.activeGroup !== b.group) {
      this.activeGroup.visible = false;
    }
    b.group.visible = true;
    this.activeGroup = b.group;

    b.resetLookMix();
    for (let i = 0; i < b.actors.length; i++) b.actors[i].begin();
    for (let i = 0; i < b.things.length; i++) b.things[i].begin();

    const bt = beatAt(T);
    const cue = slot.cueIdx >= 0 ? CUES[slot.cueIdx] : null;
    const localT = T - slot.start;

    const cState = b.step({
      u,
      T,
      localT,
      bt,
      cue,
      wp: (wi) => wordProg(cue, wi, T),
      wa: (wi) => wordAge(cue, wi, T),
      ca: (ci) => charAge(cue, ci, T),
    });

    this.applyLook(b.def.look, b.def.lookTo, b.getLookMix(), T);

    // 细腻绘本呼吸微晃（与《童话镇》一致，避免机械死板）
    const bx = Math.sin(T * 1.15 + index) * 0.045;
    const by = Math.cos(T * 0.92 + index * 0.7) * 0.032;
    this.camera.position.set(cState.pos[0] + bx, cState.pos[1] + by, cState.pos[2]);
    this.camera.lookAt(cState.look[0], cState.look[1], cState.look[2]);
    if (Math.abs(this.camera.fov - cState.fov) > 0.001) {
      this.camera.fov = cState.fov;
      this.camera.updateProjectionMatrix();
    }

    // 天空球始终居中于相机
    this.sky.position.copy(this.camera.position);
    this.stars.position.copy(this.camera.position);

    // 按相机距离排定纸片叠放：远景角色先画、近景后画，任何一张都完整可见
    const ordered = b.actors
      .map((a, i) => ({ a, i, d: a.holder.position.distanceToSquared(this.camera.position) }))
      .sort((p, q) => q.d - p.d);
    ordered.forEach(({ a }, rank) => a.layer(22 + rank));
    for (let i = 0; i < b.actors.length; i++) {
      b.actors[i].commit(this.camera.position, this.cardTint);
    }
    for (let i = 0; i < b.things.length; i++) {
      b.things[i].commit(this.camera.position, this.cardTint);
    }

    // 提交 3D 逐字逐词立体雕塑
    if (b.wordSculpture) {
      b.wordSculpture.update(T, bt, this.camera.position, this.showWords3D);
    }

    this.renderer.render(this.scene, this.camera);

    // 计算闪白 / 渐黑 / 片名卡纯函数叠层
    const fx = b.def.fx;
    let white = 0;
    let black = 0;
    if (fx?.whiteOut) white = Math.max(white, Math.pow(clamp01((u - 0.8) / 0.2), 1.8));
    if (fx?.whiteIn) white = Math.max(white, Math.pow(clamp01(1 - u / 0.22), 1.8));
    if (fx?.flash) {
      for (const fu of fx.flash) {
        const d = Math.abs(u - fu);
        if (d < 0.08) white = Math.max(white, (1 - d / 0.08) * 0.65);
      }
    }
    if (fx?.fadeIn) black = Math.max(black, clamp01(1 - localT / 0.9));
    if (fx?.fadeOut) black = Math.max(black, ease(clamp01((u - 0.62) / 0.38)));

    const showTitle = Boolean(fx?.title) && u > 0.08 && u < 0.86;
    const titleProgress = showTitle
      ? Math.min(clamp01((u - 0.08) / 0.16), clamp01((0.86 - u) / 0.16))
      : 0;

    return {
      shot: b.def,
      slot,
      shotIdx: index,
      u,
      white,
      black,
      showTitle,
      titleProgress,
    };
  }

  dispose() {
    this.renderer.dispose();
  }
}
