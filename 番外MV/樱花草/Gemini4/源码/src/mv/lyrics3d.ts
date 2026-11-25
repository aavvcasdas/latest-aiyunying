// 软3D逐字 + 逐词对齐字幕卡点系统（相机空间真实三维挤出 + 奶油倒角高光 + 词组底座共振）
import * as THREE from 'three';
import fontUrl from '../assets/zcool.woff2';
import {
  backOut,
  clamp01,
  ease,
  easeIn,
  easeOut,
  hash,
  makeSprite,
  PI,
  plumpHeart,
  primroseBlossom,
  seg,
  TAU,
} from './kit';
import { LYRIC_CUES, type LyricCue, type WordTone } from './timeline';

export const LYRIC_FONT = 'ZCOOLKuaiLeMV';
export const LYRIC_FONT_STACK = `'${LYRIC_FONT}', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif`;

let fontReady = false;
export async function loadLyricFont(): Promise<void> {
  if (fontReady) return;
  try {
    const face = new FontFace(LYRIC_FONT, `url(${fontUrl})`, {
      style: 'normal',
      weight: '400',
    });
    const loaded = await face.load();
    document.fonts.add(loaded);
    await document.fonts.ready;
    fontReady = true;
  } catch {
    fontReady = true;
  }
}

// ── 奶油软3D字形图集（R=字面填充，G=圆润厚描边，B=左上奶油软陶高光）────────
const CELL = 160;
const COLS = 14;
let glyphTexture: THREE.CanvasTexture | null = null;
let atlasRows = 1;
const glyphIndex = new Map<string, number>();

export function buildSoftGlyphAtlas(): void {
  const tokens = new Set<string>();
  for (const cue of LYRIC_CUES) {
    for (const c of cue.chars) tokens.add(c.ch);
  }
  for (const ch of ['樱', '花', '草', 'Sweety']) tokens.add(ch);

  const list = Array.from(tokens);
  atlasRows = Math.max(1, Math.ceil(list.length / COLS));

  const cv = document.createElement('canvas');
  cv.width = COLS * CELL;
  cv.height = atlasRows * CELL;
  const g = cv.getContext('2d')!;
  g.clearRect(0, 0, cv.width, cv.height);

  // 离屏单格用于合成 R(本体) / G(圆润外廓) / B(奶油顶光倒角)
  const sub = document.createElement('canvas');
  sub.width = CELL;
  sub.height = CELL;
  const sg = sub.getContext('2d')!;

  const hiCv = document.createElement('canvas');
  hiCv.width = CELL;
  hiCv.height = CELL;
  const hg = hiCv.getContext('2d')!;

  glyphIndex.clear();
  list.forEach((tok, idx) => {
    glyphIndex.set(tok, idx);
    const col = idx % COLS;
    const row = Math.floor(idx / COLS);
    const ox = col * CELL;
    const oy = row * CELL;
    const cx = CELL / 2;
    const cy = CELL / 2 + 4;

    const fontSize = tok.length >= 4 ? 44 : tok.length >= 2 ? 84 : 104;
    const fontStr = `${fontSize}px ${LYRIC_FONT_STACK}`;

    // 1) 在 sub 画圆润厚描边(G) 与 字芯填充(R)
    sg.clearRect(0, 0, CELL, CELL);
    sg.font = fontStr;
    sg.textAlign = 'center';
    sg.textBaseline = 'middle';
    sg.lineJoin = 'round';
    sg.lineCap = 'round';

    sg.strokeStyle = 'rgb(0, 255, 0)';
    sg.lineWidth = tok.length >= 4 ? 14 : 24;
    sg.strokeText(tok, cx, cy);

    sg.fillStyle = 'rgb(255, 0, 0)';
    sg.fillText(tok, cx, cy);

    // 2) 在 hiCv 生成左上奶油软3D立体高光边缘（字芯减去向右下微移的字芯）
    hg.globalCompositeOperation = 'source-over';
    hg.clearRect(0, 0, CELL, CELL);
    hg.font = fontStr;
    hg.textAlign = 'center';
    hg.textBaseline = 'middle';
    hg.fillStyle = 'rgb(0, 0, 255)';
    hg.fillText(tok, cx, cy);
    hg.globalCompositeOperation = 'destination-out';
    hg.fillStyle = 'rgba(0, 0, 0, 0.88)';
    hg.fillText(tok, cx + 4.5, cy + 5.5);

    // 叠加蓝通道高光到 sub
    sg.save();
    sg.globalCompositeOperation = 'lighter';
    sg.drawImage(hiCv, 0, 0);
    sg.restore();

    g.drawImage(sub, ox, oy);
  });

  if (glyphTexture) glyphTexture.dispose();
  glyphTexture = new THREE.CanvasTexture(cv);
  glyphTexture.colorSpace = THREE.NoColorSpace;
  glyphTexture.minFilter = THREE.LinearMipmapLinearFilter;
  glyphTexture.magFilter = THREE.LinearFilter;
  glyphTexture.generateMipmaps = true;
  glyphTexture.needsUpdate = true;
}

function uvRectOf(tok: string): THREE.Vector4 {
  const idx = glyphIndex.get(tok) ?? 0;
  const col = idx % COLS;
  const row = Math.floor(idx / COLS);
  return new THREE.Vector4(
    col / COLS,
    1 - (row + 1) / atlasRows,
    (col + 1) / COLS,
    1 - row / atlasRows
  );
}

// ── 语义词组软3D糖果色板 ──────────────────────────────────────────────────
interface ToneColors {
  base: number;     // 未扫过时的奶油象牙底色
  hi: number;       // 卡拉OK扫过后的软3D糖果主色
  stroke: number;   // 圆润描边色
  side: number;     // 3D立体挤出侧面色
  pill: number;     // 词组对齐软垫色
  glow: number;     // 关键词光晕色
}

const TONE_PALETTE: Record<WordTone, ToneColors> = {
  base: {
    base: 0xfffcf7,
    hi: 0xffd9b8,
    stroke: 0x3f2b54,
    side: 0x9e7ab8,
    pill: 0x221938,
    glow: 0xffe6c7,
  },
  sakura: {
    base: 0xfff8fb,
    hi: 0xff82b2,
    stroke: 0x592042,
    side: 0xd9578c,
    pill: 0x3f1833,
    glow: 0xffa6ca,
  },
  gold: {
    base: 0xfffdf4,
    hi: 0xffd966,
    stroke: 0x543218,
    side: 0xd48835,
    pill: 0x3d2814,
    glow: 0xffe685,
  },
  mint: {
    base: 0xf6fffb,
    hi: 0x72ebb5,
    stroke: 0x1b423c,
    side: 0x3ea88b,
    pill: 0x163633,
    glow: 0x99f5cc,
  },
  star: {
    base: 0xf6fbff,
    hi: 0x8ad6ff,
    stroke: 0x202d59,
    side: 0x577ad4,
    pill: 0x1a244a,
    glow: 0xa8e3ff,
  },
};

const GLYPH_GEO = new THREE.PlaneGeometry(1, 1);

const GLYPH_VERT = `
  uniform vec4 uRect;
  varying vec2 vUv;
  varying vec2 vLocal;
  void main() {
    vLocal = uv;
    vUv = vec2(mix(uRect.x, uRect.z, uv.x), mix(uRect.y, uRect.w, uv.y));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const GLYPH_FRAG = `
  uniform sampler2D uMap;
  uniform vec3 cBase;
  uniform vec3 cHi;
  uniform vec3 cStroke;
  uniform vec3 cSide;
  uniform float uFill;
  uniform float uOp;
  uniform float uGlow;
  uniform float uLayer; // 0 = 正面，>0 = 立体挤出厚度层(0..1)
  varying vec2 vUv;
  varying vec2 vLocal;

  void main() {
    vec4 t = texture2D(uMap, vUv);
    float f = t.r;
    float s = t.g;
    float bev = t.b;
    float cov = clamp(f + s, 0.0, 1.0);

    if (uLayer > 0.01) {
      if (cov < 0.34) discard;
      // 软3D奶油糖果圆润挤出侧壁：层次分明、饱满柔亮，底层自然收暗作立体投影
      vec3 sideCol = mix(cSide * 1.12, cStroke * 0.72, pow(uLayer, 1.35));
      gl_FragColor = vec4(sideCol, uOp * 0.95);
      return;
    }

    if (cov < 0.04) discard;
    // 带微斜角的逐字卡拉OK扫光填充
    float axis = clamp(vLocal.x * 0.88 + (1.0 - vLocal.y) * 0.12, 0.0, 1.0);
    float sung = 1.0 - smoothstep(uFill - 0.10, uFill + 0.10, axis);
    // 软3D字芯上下微渐变（顶部奶油柔亮、底部糖果饱满）
    vec3 faceCol = mix(cBase, cHi, sung);
    faceCol = mix(faceCol * 0.93, mix(faceCol, vec3(1.0), 0.24), vLocal.y);
    // 扫光锋线闪亮光带
    float edgeBand = exp(-pow((axis - uFill) / 0.075, 2.0)) * step(0.02, uFill) * step(uFill, 0.98);
    faceCol += vec3(0.32, 0.28, 0.30) * edgeBand;
    // 叠加奶油软3D左上圆润高光(B通道)
    faceCol = mix(faceCol, vec3(1.0, 0.99, 1.0), clamp(bev * (0.48 + 0.22 * sung), 0.0, 0.68));
    faceCol *= (1.0 + uGlow * 0.28);

    // 合成圆润描边与软3D字面
    float fillMask = smoothstep(0.18, 0.62, f);
    vec3 col = mix(cStroke, faceCol, fillMask);
    gl_FragColor = vec4(col, smoothstep(0.04, 0.32, cov) * uOp);
  }
`;

function createGlyphMat(rect: THREE.Vector4, pal: ToneColors, layer: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    fog: false,
    uniforms: {
      uMap: { value: glyphTexture },
      uRect: { value: rect },
      cBase: { value: new THREE.Color(pal.base) },
      cHi: { value: new THREE.Color(pal.hi) },
      cStroke: { value: new THREE.Color(pal.stroke) },
      cSide: { value: new THREE.Color(pal.side) },
      uFill: { value: 0 },
      uOp: { value: 0 },
      uGlow: { value: 0 },
      uLayer: { value: layer },
    },
    vertexShader: GLYPH_VERT,
    fragmentShader: GLYPH_FRAG,
  });
}

// 词组圆角软垫底座几何缓存
function makePillGeo(w: number, h: number): THREE.ShapeGeometry {
  const r = Math.min(h * 0.48, w * 0.45);
  const hw = Math.max(0.01, w / 2 - r);
  const hh = Math.max(0.01, h / 2 - r);
  const s = new THREE.Shape();
  s.moveTo(-hw, -hh - r);
  s.lineTo(hw, -hh - r);
  s.absarc(hw, -hh, r, -PI / 2, 0, false);
  s.lineTo(hw + r, hh);
  s.absarc(hw, hh, r, 0, PI / 2, false);
  s.lineTo(-hw, hh + r);
  s.absarc(-hw, hh, r, PI / 2, PI, false);
  s.lineTo(-hw - r, -hh);
  s.absarc(-hw, -hh, r, PI, PI * 1.5, false);
  return new THREE.ShapeGeometry(s, 8);
}

interface CharRig {
  group: THREE.Group;
  frontMat: THREE.ShaderMaterial;
  sideMats: THREE.ShaderMaterial[];
  localX: number;
  t0: number;
  t1: number;
  idx: number;
  seed: number;
}

interface WordRig {
  group: THREE.Group;
  centerX: number;
  baseY: number;
  pillMat: THREE.MeshBasicMaterial;
  barMesh: THREE.Mesh;
  barMat: THREE.MeshBasicMaterial;
  barFullW: number;
  halo: THREE.Sprite;
  charmObj: THREE.Object3D | null;
  chars: CharRig[];
  t0: number;
  t1: number;
  tEnd: number;
  isKey: boolean;
  index: number;
}

class SoftCueLine3D {
  readonly cue: LyricCue;
  readonly root = new THREE.Group();
  private readonly words: WordRig[] = [];
  private readonly size: number;

  constructor(cue: LyricCue) {
    this.cue = cue;
    const isLa = cue.style === 'lala';
    const nChars = cue.chars.length;
    // 自动缩放字号确保长短句都居中对齐且绝不溢出 16:9 安全框
    const rawS = isLa ? 0.34 : nChars >= 9 ? 0.335 : nChars <= 5 ? 0.41 : 0.375;
    this.size = rawS;

    const charAdv = rawS * (isLa ? 0.88 : 0.94);
    const wordGap = rawS * (isLa ? 0.22 : 0.26);

    // 第一遍：按词+按字精确排版坐标
    const charGlobalX: number[] = [];
    let cursor = 0;
    cue.chars.forEach((ct, i) => {
      if (i > 0) {
        cursor += charAdv;
        if (ct.inWord === 0) cursor += wordGap;
      }
      charGlobalX.push(cursor);
    });
    const totalW = charGlobalX.length > 1 ? charGlobalX[charGlobalX.length - 1] : 0;
    for (let i = 0; i < charGlobalX.length; i++) {
      charGlobalX[i] -= totalW / 2;
    }

    const baseLineY = -1.08;

    // 第二遍：为每个「词」建立独立软3D词组容器、圆角对齐底座、进度光条、关键词挂饰与逐字挤出体
    for (const w of cue.words) {
      const pal = TONE_PALETTE[w.tone];
      const xFirst = charGlobalX[w.from];
      const xLast = charGlobalX[w.to];
      const cx = (xFirst + xLast) * 0.5;
      // La la la 词块排成灵动波浪五线谱弧线
      const wy = isLa ? baseLineY + Math.sin(w.index * 0.92) * 0.065 : baseLineY;

      const wGroup = new THREE.Group();
      wGroup.position.set(cx, wy, 0);
      this.root.add(wGroup);

      const pillW = xLast - xFirst + rawS * 0.96;
      const pillH = rawS * 0.96;

      // 词组软3D磨砂圆角衬底（清晰呈现分词结构，同时保证在亮/暗场景下100%高对比清晰可读）
      const pillMat = new THREE.MeshBasicMaterial({
        color: pal.pill,
        transparent: true,
        opacity: 0,
        depthTest: false,
        depthWrite: false,
      });
      const pillMesh = new THREE.Mesh(makePillGeo(pillW, pillH), pillMat);
      pillMesh.position.set(0, -rawS * 0.02, -0.14);
      pillMesh.renderOrder = 900;
      wGroup.add(pillMesh);

      // 词底部卡点对齐光条（随该词演唱进度从左向右精准推满！）
      const barFullW = Math.max(0.12, pillW - rawS * 0.28);
      const barMat = new THREE.MeshBasicMaterial({
        color: pal.hi,
        transparent: true,
        opacity: 0,
        depthTest: false,
        depthWrite: false,
      });
      const barGeo = new THREE.PlaneGeometry(1, rawS * 0.085);
      barGeo.translate(0.5, 0, 0);
      const barMesh = new THREE.Mesh(barGeo, barMat);
      barMesh.position.set(-barFullW / 2, -pillH * 0.44, -0.05);
      barMesh.scale.x = 0.001;
      barMesh.renderOrder = 905;
      wGroup.add(barMesh);

      // 词落点柔光光晕
      const halo = makeSprite('glow', pillW * 1.45, pal.glow, true, 0);
      halo.position.set(0, 0, -0.12);
      halo.renderOrder = 902;
      wGroup.add(halo);

      // 关键词专属软3D立体小挂饰（樱花草五瓣花 / 软心 / 星芒）
      let charmObj: THREE.Object3D | null = null;
      if (w.charm === 'primrose') {
        const fl = primroseBlossom(rawS * 0.44, 0xff8ab5, 0.55);
        fl.rotation.x = PI * 0.46;
        fl.traverse((o) => {
          o.renderOrder = 960;
          const mesh = o as THREE.Mesh;
          if (mesh.isMesh && mesh.material) {
            const cloned = (mesh.material as THREE.Material).clone();
            cloned.depthTest = false;
            cloned.depthWrite = false;
            mesh.material = cloned;
          }
        });
        charmObj = fl;
      } else if (w.charm === 'heart') {
        const ht = plumpHeart(rawS * 0.36, 0xff7da8, 1);
        ht.renderOrder = 960;
        const cloned = (ht.material as THREE.Material).clone();
        cloned.depthTest = false;
        cloned.depthWrite = false;
        ht.material = cloned;
        charmObj = ht;
      } else if (w.charm === 'star' || w.charm === 'note') {
        const sp = makeSprite('star', rawS * 0.52, w.charm === 'star' ? 0xffe57f : 0x9bf5d0, true, 0.95);
        sp.renderOrder = 960;
        charmObj = sp;
      }
      if (charmObj) {
        charmObj.position.set(pillW * 0.44, pillH * 0.42, 0.08);
        charmObj.scale.setScalar(0.001);
        charmObj.visible = false;
        wGroup.add(charmObj);
      }

      // 构建词内每一个「字」的 5 层软3D立体挤出模型
      const charRigs: CharRig[] = [];
      const LAYERS = 4;
      for (let ci = w.from; ci <= w.to; ci++) {
        const ct = cue.chars[ci];
        const rect = uvRectOf(ct.ch);
        const cGroup = new THREE.Group();
        const lx = charGlobalX[ci] - cx;
        cGroup.position.set(lx, 0, 0);

        const sideMats: THREE.ShaderMaterial[] = [];
        for (let k = LAYERS; k >= 1; k--) {
          const uL = k / LAYERS;
          const sm = createGlyphMat(rect, pal, uL);
          const slice = new THREE.Mesh(GLYPH_GEO, sm);
          // 向右下后方圆润挤出，展现清晰的奶油软3D立体厚度
          slice.position.set(0.014 * k, -0.018 * k, -0.022 * k);
          slice.renderOrder = 910 + (LAYERS - k) + ci * 0.01;
          cGroup.add(slice);
          sideMats.push(sm);
        }

        const frontMat = createGlyphMat(rect, pal, 0);
        const frontMesh = new THREE.Mesh(GLYPH_GEO, frontMat);
        frontMesh.renderOrder = 930 + ci * 0.01;
        cGroup.add(frontMesh);

        wGroup.add(cGroup);
        charRigs.push({
          group: cGroup,
          frontMat,
          sideMats,
          localX: lx,
          t0: ct.t0,
          t1: ct.t1,
          idx: ci,
          seed: hash(cue.id * 37 + ci * 13 + 5),
        });
      }

      this.words.push({
        group: wGroup,
        centerX: cx,
        baseY: wy,
        pillMat,
        barMesh,
        barMat,
        barFullW,
        halo,
        charmObj,
        chars: charRigs,
        t0: w.t0,
        t1: w.t1,
        tEnd: w.tEnd,
        isKey: w.isKey,
        index: w.index,
      });
    }
  }

  /** 更新本句在时刻 t 的软3D逐字+逐词卡点状态，返回关键词落点冲击力 0..1 */
  update(t: number): number {
    const preLead = 0.24;
    const postTail = 0.42;
    if (t < this.cue.start - preLead || t > this.cue.end + postTail) {
      this.root.visible = false;
      return 0;
    }
    this.root.visible = true;

    const S = this.size;
    const st = this.cue.style;
    const lineFadeIn = easeOut(seg(t, this.cue.start - preLead, this.cue.start + 0.04));
    // 整句轻微软3D呼吸透视摆动
    this.root.rotation.set(
      -0.06 + Math.sin(t * 1.4) * 0.015,
      Math.sin(t * 0.9 + this.cue.id) * 0.035,
      0
    );

    let wordKick = 0;

    for (const w of this.words) {
      const wOut = seg(t, this.cue.end + w.index * 0.045, this.cue.end + w.index * 0.045 + 0.28);
      if (wOut >= 1) {
        w.group.visible = false;
        continue;
      }
      w.group.visible = true;
      const outKeep = 1 - easeIn(wOut);

      // ── 1. 按词卡点（Word-Level Alignment & Jelly Bounce）───────────────
      const wStarted = t >= w.t0;
      const wProgress = clamp01((t - w.t0) / Math.max(0.12, w.tEnd - w.t0));
      const sinceStart = Math.max(0, t - w.t0);
      const sinceDone = t - w.t1;

      // 词起唱轻抬 + 词收尾整词Q弹共振
      const startLift = wStarted ? Math.exp(-sinceStart * 6.5) * 0.038 : 0;
      const donePop =
        sinceDone >= 0 && sinceDone < 0.75
          ? Math.exp(-sinceDone * 5.2) * Math.sin(sinceDone * 16) * (w.isKey ? 0.095 : 0.045)
          : 0;
      const doneGlow =
        sinceDone >= 0 && sinceDone < 0.9
          ? Math.exp(-sinceDone * 3.8) * (w.isKey ? 1.0 : 0.45)
          : 0;
      if (w.isKey && doneGlow > wordKick) wordKick = doneGlow;

      const activeHold = wStarted && t <= w.tEnd + 0.12 ? 0.024 : 0;
      const wy = w.baseY + startLift + activeHold + Math.max(0, donePop) * 0.65 + easeIn(wOut) * 0.16;
      const wz = (wStarted ? 0.045 : 0) + doneGlow * 0.075;
      const wScaleX = (1 + donePop * 0.95) * (0.94 + 0.06 * outKeep);
      const wScaleY = (1 - donePop * 0.55 + Math.max(0, donePop) * 0.85) * outKeep;
      const wRotZ =
        sinceDone >= 0 && sinceDone < 0.55 && w.isKey
          ? Math.exp(-sinceDone * 7) * Math.sin(sinceDone * 18) * (w.index % 2 === 0 ? 0.045 : -0.045)
          : 0;

      w.group.position.set(w.centerX, wy, wz);
      w.group.scale.set(Math.max(0.001, wScaleX), Math.max(0.001, wScaleY), 1);
      w.group.rotation.set(easeIn(wOut) * -0.55, doneGlow * 0.08 * (w.index % 2 ? -1 : 1), wRotZ);

      // 词组对齐软垫底座 & 底部词级进度光条
      const pillTarget = wStarted ? (w.isKey ? 0.56 : 0.44) : 0.24;
      w.pillMat.opacity = pillTarget * lineFadeIn * outKeep;

      if (wStarted) {
        w.barMesh.visible = true;
        w.barMesh.scale.x = Math.max(0.002, w.barFullW * easeOut(wProgress));
        w.barMat.opacity = (0.58 + 0.42 * doneGlow) * outKeep;
      } else {
        w.barMesh.visible = false;
      }

      w.halo.material.opacity = doneGlow * 0.42 * outKeep;

      // 关键词软3D小挂饰（词落定时弹性绽放！）
      if (w.charmObj) {
        if (sinceDone >= -0.04) {
          w.charmObj.visible = true;
          const cp = backOut(clamp01((sinceDone + 0.04) / 0.28), 2.4);
          const baseSc = w.charmObj instanceof THREE.Sprite ? S * 0.52 : S * 0.4;
          w.charmObj.scale.setScalar(Math.max(0.001, baseSc * cp * outKeep));
          w.charmObj.rotation.z = sinceDone * 1.15;
        } else {
          w.charmObj.visible = false;
        }
      }

      // ── 2. 按字卡点（Character-Level Soft-3D Pop & Karaoke Sweep）───────
      for (const ch of w.chars) {
        const dt = t - ch.t0;
        if (dt < 0) {
          // 未唱到：安静停在精确对齐的预备格上（柔雾半透明3D预告态）
          const preOp = 0.44 * lineFadeIn * outKeep;
          ch.group.position.set(ch.localX, -0.012, -0.025);
          ch.group.rotation.set(0, 0, 0);
          ch.group.scale.setScalar(S * 0.9);
          ch.frontMat.uniforms.uFill.value = 0;
          ch.frontMat.uniforms.uOp.value = preOp;
          ch.frontMat.uniforms.uGlow.value = 0;
          for (const sm of ch.sideMats) sm.uniforms.uOp.value = preOp * 0.55;
          continue;
        }

        // 唱到该字的精确瞬间：软3D弹性落地 + 逐字左→右扫光填色
        const popU = clamp01(dt / 0.24);
        const popB = backOut(popU, 2.25);
        const popE = easeOut(popU);
        const fill = clamp01((t - ch.t0) / Math.max(0.1, ch.t1 - ch.t0));
        const hitDecay = Math.exp(-dt * 6.2);

        let dx = 0;
        let dy = hitDecay * 0.075;
        let dz = (1 - popE) * 0.22 + hitDecay * 0.05;
        let rx = 0;
        let ry = 0;
        let rz = 0;
        let sc = S * (0.78 + 0.22 * popB + hitDecay * 0.11);

        // 九种贴合词意的软3D字卡动态
        if (st === 'breeze') {
          dx = -(1 - popE) * 0.08;
          rz = (1 - popB) * 0.22 + Math.sin(t * 2.8 + ch.idx * 0.6) * 0.025;
          dy += Math.sin(t * 2.6 + ch.idx * 0.55) * 0.012;
        } else if (st === 'firefly') {
          dy += (1 - popE) * -0.14 + Math.sin(t * 4.2 + ch.seed * TAU) * 0.018;
          sc *= 1 + Math.max(0, Math.sin(t * 7 + ch.idx * 1.3)) * 0.03;
        } else if (st === 'star') {
          dy += (1 - popE) * 0.16;
          ry = (1 - popE) * -0.85;
        } else if (st === 'chime') {
          rz = Math.exp(-dt * 4.2) * Math.sin(dt * 15) * 0.18;
          dy += Math.sin(t * 3.4 + ch.idx * 0.8) * 0.012;
        } else if (st === 'ripple') {
          dy += Math.exp(-dt * 3.5) * Math.sin(dt * 12 - ch.idx * 0.5) * 0.065;
          rx = (1 - popE) * 0.45;
        } else if (st === 'bloom') {
          rz = (1 - popB) * (ch.idx % 2 === 0 ? 0.28 : -0.28);
          ry = (1 - popE) * -0.55;
          dy += Math.sin(t * 3.1 + ch.idx * 0.65) * 0.013;
        } else if (st === 'heartbeat') {
          // 紧扣双搏心跳的软弹膨胀
          const hb = Math.exp(-dt * 7.5) * 0.14 + (fill < 1 ? Math.sin(fill * PI) * 0.05 : 0);
          sc *= 1 + hb;
          rx = (1 - popE) * -0.35;
        } else if (st === 'lala') {
          dy += Math.abs(Math.sin(clamp01(dt / 0.34) * PI)) * 0.11;
          rz = Math.sin(t * 5.2 + ch.idx) * 0.07;
        } else if (st === 'lullaby') {
          rz = Math.sin(t * 2.2 + ch.idx * 0.5) * 0.04;
          dy += (1 - popE) * 0.09 + Math.cos(t * 2.0 + ch.idx * 0.6) * 0.014;
        }

        const op = clamp01((0.65 + 0.35 * popE) * outKeep);
        ch.group.position.set(ch.localX + dx, dy, dz);
        ch.group.rotation.set(rx, ry, rz);
        ch.group.scale.setScalar(Math.max(0.001, sc));

        ch.frontMat.uniforms.uFill.value = ease(fill);
        ch.frontMat.uniforms.uOp.value = op;
        ch.frontMat.uniforms.uGlow.value = hitDecay * 0.75 + doneGlow * 0.65;
        for (const sm of ch.sideMats) {
          sm.uniforms.uOp.value = op;
        }
      }
    }

    return wordKick;
  }
}

/** 软3D两行纯净片头卡（仅「樱花草」+「Sweety」，零水印零角标） */
class SoftTitleCard3D {
  readonly root = new THREE.Group();
  private readonly chars: Array<{
    group: THREE.Group;
    front: THREE.ShaderMaterial;
    sides: THREE.ShaderMaterial[];
  }> = [];
  private readonly subFront: THREE.ShaderMaterial;
  private readonly subSides: THREE.ShaderMaterial[];
  private readonly subGroup = new THREE.Group();
  private readonly leftFlower: THREE.Group;
  private readonly rightFlower: THREE.Group;
  private readonly bgHalo: THREE.Sprite;

  constructor() {
    this.root.position.set(0, 0.32, 0);

    this.bgHalo = makeSprite('glow', 3.4, 0xffa8cc, true, 0);
    this.bgHalo.scale.set(4.2, 1.5, 1);
    this.bgHalo.position.set(0, 0.05, -0.2);
    this.bgHalo.renderOrder = 895;
    this.root.add(this.bgHalo);

    const titleChars = ['樱', '花', '草'];
    const pal = TONE_PALETTE.sakura;
    titleChars.forEach((ch, i) => {
      const rect = uvRectOf(ch);
      const g = new THREE.Group();
      const sides: THREE.ShaderMaterial[] = [];
      for (let k = 5; k >= 1; k--) {
        const sm = createGlyphMat(rect, pal, k / 5);
        const m = new THREE.Mesh(GLYPH_GEO, sm);
        m.position.set(0.013 * k, -0.015 * k, -0.025 * k);
        m.renderOrder = 910 + (5 - k);
        g.add(m);
        sides.push(sm);
      }
      const front = createGlyphMat(rect, pal, 0);
      const fm = new THREE.Mesh(GLYPH_GEO, front);
      fm.renderOrder = 930;
      g.add(fm);
      this.root.add(g);
      this.chars.push({ group: g, front, sides });
      void i;
    });

    // 第二行歌手名 Sweety
    const subRect = uvRectOf('Sweety');
    const subPal = TONE_PALETTE.gold;
    this.subSides = [];
    for (let k = 3; k >= 1; k--) {
      const sm = createGlyphMat(subRect, subPal, k / 3);
      const m = new THREE.Mesh(GLYPH_GEO, sm);
      m.position.set(0.01 * k, -0.012 * k, -0.02 * k);
      m.renderOrder = 912;
      this.subGroup.add(m);
      this.subSides.push(sm);
    }
    this.subFront = createGlyphMat(subRect, subPal, 0);
    const sfm = new THREE.Mesh(GLYPH_GEO, this.subFront);
    sfm.renderOrder = 932;
    this.subGroup.add(sfm);
    this.root.add(this.subGroup);

    // 两侧对称旋转的软3D五瓣樱花草
    this.leftFlower = primroseBlossom(0.28, 0xff94be, 0.55);
    this.rightFlower = primroseBlossom(0.28, 0xff94be, 0.55);
    for (const fl of [this.leftFlower, this.rightFlower]) {
      fl.rotation.x = PI * 0.48;
      fl.traverse((o) => {
        o.renderOrder = 950;
        const mesh = o as THREE.Mesh;
        if (mesh.isMesh && mesh.material) {
          const cloned = (mesh.material as THREE.Material).clone();
          cloned.depthTest = false;
          cloned.depthWrite = false;
          mesh.material = cloned;
        }
      });
      this.root.add(fl);
    }
  }

  update(t: number): void {
    if (t < 0.85 || t > 6.55) {
      this.root.visible = false;
      return;
    }
    this.root.visible = true;
    const out = 1 - easeIn(seg(t, 5.55, 6.5));
    this.bgHalo.material.opacity = 0.22 * easeOut(seg(t, 0.9, 1.8)) * out;

    const S = 0.72;
    this.chars.forEach((c, i) => {
      const t0 = 1.0 + i * 0.22;
      const p = clamp01((t - t0) / 0.42);
      const b = backOut(p, 2.1);
      const x = (i - 1) * 0.74;
      const y = 0.14 + (1 - easeOut(p)) * 0.22 + Math.sin(t * 2.1 + i * 0.9) * 0.022;
      c.group.position.set(x, y, (1 - easeOut(p)) * 0.35);
      c.group.rotation.set(0, Math.sin(t * 1.2 + i) * 0.08, (1 - b) * (i % 2 ? -0.25 : 0.25));
      c.group.scale.setScalar(Math.max(0.001, S * b * (0.9 + 0.1 * out)));
      const op = easeOut(p) * out;
      c.front.uniforms.uFill.value = ease(clamp01((t - t0 - 0.1) / 0.85));
      c.front.uniforms.uOp.value = op;
      c.front.uniforms.uGlow.value = 0.35;
      for (const sm of c.sides) sm.uniforms.uOp.value = op;
    });

    const sp = clamp01((t - 1.75) / 0.45);
    const sop = easeOut(sp) * out;
    this.subGroup.position.set(0, -0.42 - (1 - easeOut(sp)) * 0.08, 0);
    this.subGroup.scale.setScalar(Math.max(0.001, 0.56 * (0.85 + 0.15 * easeOut(sp))));
    this.subFront.uniforms.uFill.value = ease(clamp01((t - 1.9) / 0.9));
    this.subFront.uniforms.uOp.value = sop * 0.92;
    this.subFront.uniforms.uGlow.value = 0.2;
    for (const sm of this.subSides) sm.uniforms.uOp.value = sop * 0.85;

    const fp = backOut(clamp01((t - 1.45) / 0.42), 2.2) * out;
    this.leftFlower.position.set(-1.32, 0.14 + Math.sin(t * 2.3) * 0.025, 0.05);
    this.rightFlower.position.set(1.32, 0.14 + Math.cos(t * 2.3) * 0.025, 0.05);
    this.leftFlower.scale.setScalar(Math.max(0.001, 0.28 * fp));
    this.rightFlower.scale.setScalar(Math.max(0.001, 0.28 * fp));
    this.leftFlower.rotation.z = t * 0.65;
    this.rightFlower.rotation.z = -t * 0.65;
  }
}

/** 挂载在主相机前方的软3D字幕与片头总控台 */
export class SoftLyricsHUD {
  readonly root = new THREE.Group();
  private readonly lineCache = new Map<number, SoftCueLine3D>();
  private readonly activeSet = new Set<SoftCueLine3D>();
  private titleCard: SoftTitleCard3D | null = null;

  constructor() {
    // 固定在相机前方 z = -4.35 处，自动适配相机 FOV 保持黄金对齐比例
    this.root.position.set(0, 0, -4.35);
  }

  update(t: number, fovDeg: number, showLyrics: boolean): number {
    // 根据当前镜头 FOV 自适应缩放，确保任何焦距镜头下软3D字幕大小与位置都严丝合缝
    const fovScale = Math.tan((fovDeg * PI) / 360) / Math.tan((38 * PI) / 360);
    this.root.scale.setScalar(fovScale);

    // 先隐藏上一帧活跃的歌词行
    for (const ln of this.activeSet) {
      ln.root.visible = false;
    }
    this.activeSet.clear();

    if (!showLyrics) {
      if (this.titleCard) this.titleCard.root.visible = false;
      return 0;
    }

    // 片头卡（仅序章 I01 出现）
    if (t >= 0.8 && t <= 6.6) {
      if (!this.titleCard) {
        this.titleCard = new SoftTitleCard3D();
        this.root.add(this.titleCard.root);
      }
      this.titleCard.update(t);
    } else if (this.titleCard) {
      this.titleCard.root.visible = false;
    }

    let kick = 0;
    for (let i = 0; i < LYRIC_CUES.length; i++) {
      const cue = LYRIC_CUES[i];
      if (t < cue.start - 0.26 || t > cue.end + 0.45) continue;
      let rig = this.lineCache.get(i);
      if (!rig) {
        rig = new SoftCueLine3D(cue);
        this.lineCache.set(i, rig);
        this.root.add(rig.root);
      }
      const k = rig.update(t);
      if (k > kick) kick = k;
      this.activeSet.add(rig);
    }
    return kick;
  }
}
