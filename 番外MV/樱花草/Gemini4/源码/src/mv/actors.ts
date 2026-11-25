// 角色、派生动作、像素道具与头顶表情贴系统（原版 cast_atlas 2048×3126 · 682 格）
import * as THREE from 'three';
import atlasUrl from '../assets/cast_atlas.png';
import atlasMetaRaw from '../assets/cast_atlas.json';
import actionsRaw from '../assets/cast_actions.json';
import { clamp01 } from './kit';

export type CharId =
  | 'whale'
  | 'claude'
  | 'kimi'
  | 'qwen'
  | 'gemini'
  | 'doubao'
  | 'zai'
  | 'gpt';

export type PropKey =
  | 'prop_bowl'
  | 'prop_hourglass'
  | 'prop_teacup'
  | 'prop_book'
  | 'prop_scroll'
  | 'prop_fan'
  | 'prop_abacus'
  | 'prop_eyemask'
  | 'prop_basket'
  | 'prop_redshoes'
  | 'prop_catclock'
  | 'prop_brush';

export type FxKey =
  | 'fx_heart'
  | 'fx_sweat'
  | 'fx_exclaim'
  | 'fx_question'
  | 'fx_zzz'
  | 'fx_sparkle'
  | 'fx_bulb'
  | 'fx_steam'
  | 'fx_shine';

interface AtlasMeta {
  w: number;
  h: number;
  s: Record<string, [number, number, number, number]>;
}

interface ActionEntry {
  label: string;
  fps: number;
  loop: boolean;
  frames: string[];
  size: [number, number];
}

interface ActionsMeta {
  actions: Record<CharId, Record<string, ActionEntry>>;
  props: string[];
  fx: Record<string, string[]>;
}

export const ATLAS_META = atlasMetaRaw as unknown as AtlasMeta;
export const ACTIONS_META = actionsRaw as unknown as ActionsMeta;
export const ATLAS_URL = atlasUrl;

export interface CastProfile {
  id: CharId;
  name: string;
  alias: string;
  color: string;
  portrait: string;
  mvRole: string;
  habit: string;
  sceneAction: string;
  appearShot: string;
}

export const CAST_PROFILES: CastProfile[] = [
  {
    id: 'whale',
    name: '本鲸',
    alias: '鲸鱼娘 · DeepSeek',
    color: '#5eb8ff',
    portrait: 'p_whale_neutral',
    mvRole: '种花与递花的「我」',
    habit: '好东西先推出去，认真把每一朵花种好、把心意摊开递出去',
    sceneAction: '跃入花语绘本、月下竹林并肩、把樱花草花盆推给小克、春田种花与终章挥手',
    appearShot: 'I02',
  },
  {
    id: 'claude',
    name: '小克',
    alias: 'Claude 大小姐',
    color: '#f59563',
    portrait: 'p_claude_neutral',
    mvRole: '收花与听心跳的「你」',
    habit: '先安静听完再落笔；不轻许假承诺，收下的花会珍藏进书页',
    sceneAction: '提裙收下樱花草、春彩花径漫步歪头、静听胸膛心跳涟漪、压花作记号',
    appearShot: 'I04',
  },
  {
    id: 'kimi',
    name: 'Kimi',
    alias: '月球少女',
    color: '#b8a4ff',
    portrait: 'p_kimi',
    mvRole: '织女星与星河守望者',
    habit: '记性好的月亮，不动时就是在记所有人，替大家收好古老神话与心愿',
    sceneAction: '银河观星台静思仰望织女星、展开星图卷轴、放飞许愿天灯',
    appearShot: 'L05',
  },
  {
    id: 'qwen',
    name: '千问',
    alias: '千姐 · Qwen',
    color: '#6ad9be',
    portrait: 'p_qwen',
    mvRole: '风铃廊与四季茶亭东道主',
    habit: '先排哪一步再动手，雅致从容，茶与风铃都排得井井有条',
    sceneAction: '竹檐下按音阶挂起琉璃风铃执扇轻摇、溪畔茶亭送迎春夏秋冬',
    appearShot: 'L06',
  },
  {
    id: 'gemini',
    name: '猫',
    alias: 'Gemini 双瞳猫娘',
    color: '#63d8ff',
    portrait: 'p_gemini',
    mvRole: '满山追萤币的少女',
    habit: '先左右看看两个方向，最后认真选定最亮那一颗',
    sceneAction: '萤火虫山坡左右张望、在漫天萤光钱币里选定一枚开心跃起、花阶转圈',
    appearShot: 'L03',
  },
  {
    id: 'doubao',
    name: '豆包',
    alias: 'Seed 暖场伙伴',
    color: '#ff8fb1',
    portrait: 'p_doubao_neutral',
    mvRole: '花阶领舞与钟楼听夜人',
    habit: '先陪着把开头暖起来，间奏第一个踩拍，温柔慢陪不催促',
    sceneAction: '陪本鲸在花田种下一朵朵、La la la 间奏领舞踩亮音符花阶、月夜钟楼聆听钟声',
    appearShot: 'L11',
  },
  {
    id: 'zai',
    name: '狐狸',
    alias: '智谱 GLM',
    color: '#ffd166',
    portrait: 'p_zai',
    mvRole: '荷塘入梦睡狐与数萤小账房',
    habit: '日常困倦爱打盹，算账分毫不差，听见动静耳朵立刻竖起',
    sceneAction: '萤火坡边拨算盘细数飞舞钱币、荷叶软垫伴蛙鸣摇篮曲香甜打盹',
    appearShot: 'L04',
  },
  {
    id: 'gpt',
    name: '龙娘',
    alias: 'GPT 星辉白龙',
    color: '#e5d4ff',
    portrait: 'p_gpt_neutral',
    mvRole: '掠过银河与破晓的流光龙影',
    habit: '从高空掠过洒满星辉，守望全场而不抢地面中心位',
    sceneAction: '前奏掠过竹海满月、展翼横越璀璨银河与海面星穹、终章破晓洒下花雨',
    appearShot: 'I03',
  },
];

const WALK_PREFIX: Record<CharId, string> = {
  whale: 'walk_whale_',
  claude: 'walk_claude_',
  kimi: 'walk_kimi_',
  qwen: 'walk_qwen_',
  gemini: 'walk_gemini_',
  doubao: 'walk_doubao_big_',
  zai: 'walk_zai_',
  gpt: 'gpt_fly_',
};

const WALK_COUNT: Record<CharId, number> = {
  whale: 8,
  claude: 8,
  kimi: 8,
  qwen: 8,
  gemini: 8,
  doubao: 8,
  zai: 8,
  gpt: 2,
};

const PX = 0.0195;
const spriteScaleFor = (key: string) => {
  if (key.startsWith('whale_big')) return 0.6;
  if (
    key.startsWith('gpt_boss') ||
    (key.startsWith('act_gpt_') && !key.startsWith('act_gpt_hover_'))
  ) {
    return 0.58;
  }
  return 1.0;
};

let atlasTexture: THREE.Texture | null = null;
let shadowTexture: THREE.CanvasTexture | null = null;

export async function loadCastAtlas(): Promise<THREE.Texture> {
  if (atlasTexture) return atlasTexture;
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.decoding = 'async';
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('无法加载角色图集 cast_atlas.png'));
    el.src = atlasUrl;
  });
  const tex = new THREE.Texture(img);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  tex.flipY = true;
  tex.colorSpace = THREE.NoColorSpace;
  tex.needsUpdate = true;
  atlasTexture = tex;
  return tex;
}

function getShadowTex(): THREE.CanvasTexture {
  if (shadowTexture) return shadowTexture;
  const cv = document.createElement('canvas');
  cv.width = 64;
  cv.height = 64;
  const g = cv.getContext('2d')!;
  const gr = g.createRadialGradient(32, 32, 3, 32, 32, 30);
  gr.addColorStop(0, 'rgba(18,16,38,0.46)');
  gr.addColorStop(0.6, 'rgba(18,16,38,0.2)');
  gr.addColorStop(1, 'rgba(18,16,38,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 64, 64);
  shadowTexture = new THREE.CanvasTexture(cv);
  shadowTexture.needsUpdate = true;
  return shadowTexture;
}

const CARD_GEO = (() => {
  const g = new THREE.PlaneGeometry(1, 1);
  g.translate(0, 0.5, 0); // 原点位于脚底中心
  return g;
})();

const CENTER_GEO = new THREE.PlaneGeometry(1, 1);

function createPixelMaterial(tex: THREE.Texture): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: true,
    side: THREE.DoubleSide,
    uniforms: {
      map: { value: tex },
      texSize: { value: new THREE.Vector2(ATLAS_META.w, ATLAS_META.h) },
      rect: { value: new THREE.Vector4(0, 0, 64, 64) },
      flipX: { value: 0 },
      tint: { value: new THREE.Color(0xffffff) },
      opacity: { value: 1 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D map;
      uniform vec2 texSize;
      uniform vec4 rect;
      uniform float flipX;
      uniform vec3 tint;
      uniform float opacity;
      varying vec2 vUv;
      void main() {
        vec2 uv = vUv;
        if (flipX > 0.5) uv.x = 1.0 - uv.x;
        // 图集坐标 y 从左上往下数，flipY=true 后采样 v = 1.0 - pix.y / texSize.y
        vec2 pix = rect.xy + vec2(uv.x, 1.0 - uv.y) * rect.zw;
        vec2 seam = floor(pix + 0.5);
        vec2 d = max(fwidth(pix), vec2(0.0001));
        pix = seam + clamp((pix - seam) / d, -0.5, 0.5);
        pix = clamp(pix, rect.xy + 0.5, rect.xy + rect.zw - 0.5);
        vec2 sampleUv = vec2(pix.x / texSize.x, 1.0 - pix.y / texSize.y);
        vec4 c = texture2D(map, sampleUv);
        if (c.a < 0.45) discard;
        vec3 col = (c.rgb / max(c.a, 0.001)) * tint;
        gl_FragColor = vec4(col, c.a * opacity);
      }
    `,
  });
}

function makeCrownTexture(kind: 'crown' | 'tiara' | 'bow'): THREE.CanvasTexture {
  const cv = document.createElement('canvas');
  cv.width = 32;
  cv.height = 24;
  const c = cv.getContext('2d')!;
  const R = (col: string, x: number, y: number, w: number, h: number) => {
    c.fillStyle = col;
    c.fillRect(x, y, w, h);
  };
  if (kind === 'crown') {
    R('#7a4a12', 9, 8, 15, 10);
    R('#ffd166', 10, 13, 13, 4);
    R('#ffd166', 10, 10, 3, 3);
    R('#fff3b0', 15, 9, 3, 4);
    R('#ffd166', 20, 10, 3, 3);
    R('#ff6b8b', 15, 14, 3, 2);
  } else if (kind === 'tiara') {
    R('#5a6988', 10, 13, 13, 4);
    R('#eef6ff', 11, 14, 11, 2);
    R('#7be8ff', 15, 10, 3, 5);
    R('#ffffff', 16, 11, 1, 2);
  } else {
    R('#0a5f8f', 8, 9, 6, 8);
    R('#0a5f8f', 18, 9, 6, 8);
    R('#5ee8ff', 9, 10, 5, 6);
    R('#5ee8ff', 18, 10, 5, 6);
    R('#0099db', 14, 11, 4, 5);
  }
  const t = new THREE.CanvasTexture(cv);
  t.minFilter = THREE.NearestFilter;
  t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
}

const crownTexCache = new Map<string, THREE.CanvasTexture>();

export class Actor {
  readonly id: CharId;
  readonly holder = new THREE.Group();
  private readonly bodyGroup = new THREE.Group();
  private readonly mesh: THREE.Mesh;
  private readonly mat: THREE.ShaderMaterial;
  private readonly shadow: THREE.Mesh;
  private readonly shadowMat: THREE.MeshBasicMaterial;
  private readonly longShad: THREE.Mesh;
  private readonly longShadMat: THREE.MeshBasicMaterial;
  private readonly emoteMesh: THREE.Mesh;
  private readonly emoteMat: THREE.ShaderMaterial;
  private hatMesh: THREE.Mesh | null = null;
  private baseScale: number;
  private curW = 1.4;
  private curH = 1.7;

  constructor(id: CharId, baseScale = 1) {
    this.id = id;
    this.baseScale = baseScale;
    const tex = atlasTexture!;
    this.mat = createPixelMaterial(tex);
    this.mesh = new THREE.Mesh(CARD_GEO, this.mat);
    this.bodyGroup.add(this.mesh);
    this.holder.add(this.bodyGroup);

    // 脚底柔影
    this.shadowMat = new THREE.MeshBasicMaterial({
      map: getShadowTex(),
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
    });
    this.shadow = new THREE.Mesh(CENTER_GEO, this.shadowMat);
    this.shadow.rotation.x = -Math.PI / 2;
    this.shadow.position.y = 0.015;
    this.holder.add(this.shadow);

    // 「月光拉长了身影」专用修长月影（从脚底向前方石径清晰拉长）
    const lgGeo = new THREE.PlaneGeometry(1, 1);
    lgGeo.translate(0, -0.5, 0);
    this.longShadMat = new THREE.MeshBasicMaterial({
      map: getShadowTex(),
      color: 0x09172e,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
    });
    this.longShad = new THREE.Mesh(lgGeo, this.longShadMat);
    this.longShad.rotation.x = -Math.PI / 2;
    this.longShad.position.y = 0.032;
    this.longShad.visible = false;
    this.holder.add(this.longShad);

    // 头顶像素表情贴（fx_heart / fx_zzz / fx_sparkle 等）
    this.emoteMat = createPixelMaterial(tex);
    this.emoteMesh = new THREE.Mesh(CENTER_GEO, this.emoteMat);
    this.emoteMesh.visible = false;
    this.bodyGroup.add(this.emoteMesh);

    this.holder.visible = false;
  }

  /** 每帧开始时复位所有临时状态，确保任意跳帧完全确定 */
  begin(): void {
    this.holder.visible = false;
    this.holder.position.set(0, 0, 0);
    this.bodyGroup.position.set(0, 0, 0);
    this.bodyGroup.rotation.set(0, 0, 0);
    this.bodyGroup.scale.set(1, 1, 1);
    this.mat.uniforms.flipX.value = 0;
    this.mat.uniforms.tint.value.setHex(0xffffff);
    this.mat.uniforms.opacity.value = 1;
    this.shadow.visible = true;
    this.shadowMat.opacity = 0.72;
    this.longShad.visible = false;
    this.emoteMesh.visible = false;
  }

  /** 佩戴角色专属像素小冠饰（小克 crown / Kimi tiara / 猫 bow） */
  wear(kind: 'crown' | 'tiara' | 'bow'): this {
    let t = crownTexCache.get(kind);
    if (!t) {
      t = makeCrownTexture(kind);
      crownTexCache.set(kind, t);
    }
    if (!this.hatMesh) {
      this.hatMesh = new THREE.Mesh(
        CENTER_GEO,
        new THREE.MeshBasicMaterial({
          map: t,
          transparent: true,
          alphaTest: 0.4,
          side: THREE.DoubleSide,
        })
      );
      this.bodyGroup.add(this.hatMesh);
    } else {
      (this.hatMesh.material as THREE.MeshBasicMaterial).map = t;
    }
    this.hatMesh.scale.set(0.56 * this.baseScale, 0.42 * this.baseScale, 1);
    return this;
  }

  setFrame(key: string): this {
    const r = ATLAS_META.s[key];
    if (!r) return this;
    const [x, y, w, h] = r;
    this.mat.uniforms.rect.value.set(x, y, w, h);
    const k = PX * spriteScaleFor(key) * this.baseScale;
    this.curW = w * k;
    this.curH = h * k;
    this.mesh.scale.set(this.curW, this.curH, 1);
    this.shadow.scale.set(Math.max(0.85, this.curW * 0.72), 0.52 * this.baseScale, 1);
    if (this.hatMesh) {
      this.hatMesh.position.set(0, this.curH * 0.885, 0.025);
    }
    this.holder.visible = true;
    return this;
  }

  /** 呼吸待机动画（使用本分支最新 8 格呼吸 + 眨眼） */
  idle(T: number): this {
    return this.act(this.id === 'gpt' ? 'float' : 'idle', T);
  }

  /** 播放角色派生动作（支持循环动作与单次定格动作） */
  act(name: string, T: number, startT = 0): this {
    const table = ACTIONS_META.actions[this.id];
    const entry = table?.[name] ?? table?.[this.id === 'gpt' ? 'float' : 'idle'];
    if (!entry) return this;
    const elapsed = Math.max(0, T - startT);
    const n = entry.frames.length;
    const rawIdx = Math.floor(elapsed * entry.fps);
    const idx = entry.loop ? ((rawIdx % n) + n) % n : Math.min(n - 1, rawIdx);
    return this.setFrame(entry.frames[idx]);
  }

  /** 按真实世界位移迈步（彻底杜绝原地滑步） */
  walkBy(distance: number, stepStride = 0.24): this {
    const n = WALK_COUNT[this.id];
    const idx = ((Math.floor(Math.abs(distance) / stepStride) % n) + n) % n;
    return this.setFrame(`${WALK_PREFIX[this.id]}${idx}`);
  }

  at(x: number, y: number, z: number): this {
    this.holder.position.set(x, y, z);
    this.holder.visible = true;
    return this;
  }

  lift(dy: number): this {
    this.bodyGroup.position.y = dy;
    const fade = clamp01(1 - dy * 0.22);
    this.shadowMat.opacity = 0.72 * fade;
    return this;
  }

  faceLeft(flag = true): this {
    this.mat.uniforms.flipX.value = flag ? 1 : 0;
    return this;
  }

  /** 踩拍软弹形变（squash & stretch） */
  sq(amount: number): this {
    this.bodyGroup.scale.set(1 + amount * 0.85, 1 - amount, 1);
    return this;
  }

  scale(s: number): this {
    this.bodyGroup.scale.multiplyScalar(s);
    return this;
  }

  tilt(rad: number): this {
    this.bodyGroup.rotation.z = rad;
    return this;
  }

  tint(hex: number): this {
    this.mat.uniforms.tint.value.setHex(hex);
    return this;
  }

  alpha(op: number): this {
    const a = clamp01(op);
    this.mat.uniforms.opacity.value = a;
    this.shadowMat.opacity = 0.72 * a;
    return this;
  }

  noShadow(): this {
    this.shadow.visible = false;
    return this;
  }

  /** 月光拉长地面身影（用于 L02「月光拉长了身影」等月夜镜头） */
  moonShadow(yawRad: number, length = 3.6, opacity = 0.75): this {
    this.longShad.visible = true;
    this.longShad.rotation.set(-Math.PI / 2, 0, yawRad);
    this.longShad.scale.set(1.28 * this.baseScale, length * this.baseScale, 1);
    this.longShadMat.opacity = opacity;
    return this;
  }

  /** 显示头顶像素表情贴（fx_heart / fx_zzz / fx_sparkle / fx_shine 等） */
  emote(fx: FxKey, T: number, dx = 0.34, dy = 0.14): this {
    const list = ACTIONS_META.fx[fx];
    if (!list || list.length === 0) return this;
    const fKey = list[Math.floor(T * 5) % list.length];
    const r = ATLAS_META.s[fKey];
    if (!r) return this;
    this.emoteMat.uniforms.rect.value.set(r[0], r[1], r[2], r[3]);
    const k = PX * 1.18 * this.baseScale;
    this.emoteMesh.scale.set(r[2] * k, r[3] * k, 1);
    const bob = Math.sin(T * 4.2) * 0.055;
    this.emoteMesh.position.set(dx * this.baseScale, this.curH + dy + bob, 0.04);
    this.emoteMesh.visible = true;
    return this;
  }

  /** 每帧自动水平朝向摄像机（保持竖直立绘纸片感） */
  faceCamera(camPos: THREE.Vector3): void {
    if (!this.holder.visible) return;
    const dx = camPos.x - this.holder.position.x;
    const dz = camPos.z - this.holder.position.z;
    this.bodyGroup.rotation.y = Math.atan2(dx, dz);
  }
}

/** 图集内置像素道具卡（茶杯、书、卷轴、折扇、算盘、眼罩、花篮、饭盆、沙漏等） */
export class PixelProp {
  readonly holder = new THREE.Group();
  private readonly mesh: THREE.Mesh;
  private readonly mat: THREE.ShaderMaterial;

  constructor(key: PropKey, scale = 1) {
    this.mat = createPixelMaterial(atlasTexture!);
    const r = ATLAS_META.s[key];
    if (r) {
      this.mat.uniforms.rect.value.set(r[0], r[1], r[2], r[3]);
      this.mesh = new THREE.Mesh(CARD_GEO, this.mat);
      const k = PX * 1.12 * scale;
      this.mesh.scale.set(r[2] * k, r[3] * k, 1);
    } else {
      this.mesh = new THREE.Mesh(CARD_GEO, this.mat);
    }
    this.holder.add(this.mesh);
  }

  at(x: number, y: number, z: number): this {
    this.holder.position.set(x, y, z);
    this.holder.visible = true;
    return this;
  }

  hide(): this {
    this.holder.visible = false;
    return this;
  }

  faceCamera(camPos: THREE.Vector3): void {
    if (!this.holder.visible) return;
    const dx = camPos.x - this.holder.position.x;
    const dz = camPos.z - this.holder.position.z;
    this.mesh.rotation.y = Math.atan2(dx, dz);
  }
}
