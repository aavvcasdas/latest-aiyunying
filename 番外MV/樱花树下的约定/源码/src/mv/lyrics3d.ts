// 双层级「按字 + 按词」三维立体歌词引擎（理解每句词意 · 14 种专属三维调度 · 确定性关键词粒子）
import * as THREE from 'three';
import fontUrl from '../assets/zcool.ttf';
import {
  CREDITS,
  LYRICS,
  TITLE,
  type FxMotif,
  type LyricLine,
  type LyricStyle,
} from './timeline';
import {
  clamp,
  dropTex,
  eBack,
  eIn,
  eOut,
  frostTex,
  glowTex,
  hash,
  lerp,
  petalTex,
  range,
  smooth,
  sparkTex,
} from './core';

export const LYRIC_FONT = 'ZCOOLKuaiLeMV';
export const LYRIC_FONT_STACK = `'${LYRIC_FONT}', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif`;

export async function loadLyricFont(): Promise<void> {
  try {
    const ff = new FontFace(LYRIC_FONT, `url(${fontUrl})`);
    await ff.load();
    document.fonts.add(ff);
    await document.fonts.ready;
  } catch (err) {
    console.warn('歌词字体回退系统字体:', err);
  }
}

// ---------- 分词解析（支持汉字按字+按词，Da/da 按音节+按乐句） ----------
export interface ParsedUnit {
  token: string;
  wordIdx: number;
  inWordIdx: number;
  key: boolean;
  row: number;
}
export interface ParsedWord {
  text: string;
  key: boolean;
  row: number;
  from: number;
  to: number;
}
export interface ParsedLine {
  units: ParsedUnit[];
  words: ParsedWord[];
  rows: number;
}

export function parseSeg(seg: string, isSyllable = false): ParsedLine {
  const rowStrs = seg.split('|');
  const units: ParsedUnit[] = [];
  const words: ParsedWord[] = [];
  let wIdx = 0;

  rowStrs.forEach((rStr, row) => {
    const rawWords = rStr.split('/').filter(Boolean);
    if (isSyllable) {
      // Da da da 段：每 4~5 个音节合成一个乐逗词组，带 * 的音节为重拍词眼
      rawWords.forEach((tok) => {
        const key = tok.startsWith('*');
        const clean = key ? tok.slice(1) : tok;
        const from = units.length;
        units.push({ token: clean, wordIdx: wIdx, inWordIdx: 0, key, row });
        words.push({ text: clean, key, row, from, to: from });
        wIdx++;
      });
    } else {
      rawWords.forEach((wd) => {
        const key = wd.startsWith('*');
        const clean = key ? wd.slice(1) : wd;
        const chars = [...clean];
        const from = units.length;
        chars.forEach((c, ci) => {
          units.push({ token: c, wordIdx: wIdx, inWordIdx: ci, key, row });
        });
        words.push({ text: clean, key, row, from, to: units.length - 1 });
        wIdx++;
      });
    }
  });
  return { units, words, rows: rowStrs.length };
}

/** 供页面歌词栏展示分词与关键词高亮 */
export function getLineWords(line: LyricLine): { text: string; key: boolean; t0: number; t1: number }[] {
  const p = parseSeg(line.seg, line.syl);
  return p.words.map((w, wi) => {
    const t0 = line.t[w.from] ?? line.t[0];
    const nextW = p.words[wi + 1];
    const t1 = nextW ? (line.t[nextW.from] ?? line.end) : line.end;
    return { text: w.text, key: w.key, t0, t1 };
  });
}

// ---------- 高清多通道字形图集（R=字面，G=描边，B=左上立体高光） ----------
const CELL = 136;
const COLS = 16;
let GLYPH_TEX: THREE.CanvasTexture | null = null;
let GLYPH_ROWS = 1;
const GLYPH_INDEX = new Map<string, number>();

export function buildGlyphAtlas() {
  const tokens = new Set<string>(['Da', 'da']);
  for (const l of LYRICS) {
    const p = parseSeg(l.seg, l.syl);
    for (const u of p.units) tokens.add(u.token);
  }
  const extra = TITLE + CREDITS.map((c) => c.join('·')).join('') + '《》·春樱立约谢谢观赏';
  for (const c of extra) if (c.trim()) tokens.add(c);

  const list = [...tokens];
  GLYPH_ROWS = Math.max(1, Math.ceil(list.length / COLS));
  const cv = document.createElement('canvas');
  cv.width = COLS * CELL;
  cv.height = GLYPH_ROWS * CELL;
  const g = cv.getContext('2d')!;
  g.fillStyle = '#000000';
  g.fillRect(0, 0, cv.width, cv.height);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineJoin = 'round';
  g.lineCap = 'round';

  const off = document.createElement('canvas');
  off.width = CELL; off.height = CELL;
  const og = off.getContext('2d')!;
  og.textAlign = 'center';
  og.textBaseline = 'middle';
  og.lineJoin = 'round';
  og.lineCap = 'round';

  list.forEach((tok, idx) => {
    const cx = CELL / 2, cy = CELL / 2 + 4;
    const isMulti = tok.length > 1;
    const fSize = isMulti ? 76 : 98;
    const font = `${fSize}px ${LYRIC_FONT_STACK}`;

    // G 通道：圆润厚描边
    og.globalCompositeOperation = 'source-over';
    og.fillStyle = '#000'; og.fillRect(0, 0, CELL, CELL);
    og.font = font;
    og.strokeStyle = '#00ff00';
    og.lineWidth = isMulti ? 15 : 18;
    og.strokeText(tok, cx, cy);
    og.fillStyle = '#00ff00';
    og.fillText(tok, cx, cy);

    // R 通道：纯净字芯（叠加到 G 上形成 RG）
    og.globalCompositeOperation = 'lighter';
    og.fillStyle = '#ff0000';
    og.fillText(tok, cx, cy);

    // B 通道：微偏左上的浮雕高光边
    og.fillStyle = '#0000c8';
    og.fillText(tok, cx - 2.2, cy - 2.5);

    const gx = (idx % COLS) * CELL;
    const gy = Math.floor(idx / COLS) * CELL;
    g.drawImage(off, gx, gy);
    GLYPH_INDEX.set(tok, idx);
  });

  GLYPH_TEX = new THREE.CanvasTexture(cv);
  GLYPH_TEX.minFilter = THREE.LinearFilter;
  GLYPH_TEX.magFilter = THREE.LinearFilter;
  GLYPH_TEX.generateMipmaps = false;
  GLYPH_TEX.needsUpdate = true;
}

function glyphRect(tok: string): THREE.Vector4 {
  const idx = GLYPH_INDEX.get(tok) ?? 0;
  const pad = 1.5;
  const u0 = ((idx % COLS) * CELL + pad) / (COLS * CELL);
  const du = (CELL - pad * 2) / (COLS * CELL);
  const row = Math.floor(idx / COLS);
  const v0 = 1 - ((row + 1) * CELL - pad) / (GLYPH_ROWS * CELL);
  const dv = (CELL - pad * 2) / (GLYPH_ROWS * CELL);
  return new THREE.Vector4(u0, v0, du, dv);
}

// ---------- 三维立体字着色器 ----------
const GLYPH_VS = `varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const GLYPH_FS = `uniform sampler2D uTex;
uniform vec4 uRect;
uniform vec3 uBase;
uniform vec3 uFillCol;
uniform vec3 uEdgeCol;
uniform float uFill;
uniform float uVertMode; // 0=从左至右卡拉OK，1=自上而下浸染/落泪
uniform float uOpacity;
uniform float uGlow;
uniform float uIsDepth;
varying vec2 vUv;
void main() {
  vec2 uv = vec2(uRect.x + vUv.x * uRect.z, uRect.y + vUv.y * uRect.w);
  vec3 s = texture2D(uTex, uv).rgb;
  float alpha = max(s.r, s.g);
  if (alpha < 0.06 || uOpacity < 0.01) discard;

  if (uIsDepth > 0.5) {
    // 三维厚度侧面：带柔和上下明暗过渡，立体感分明
    vec3 side = uEdgeCol * (0.72 + 0.45 * vUv.y) + vec3(0.18) * uGlow;
    gl_FragColor = vec4(side, alpha * uOpacity);
    return;
  }

  // 卡拉 OK 着色扫描（水平或自上而下浸染）
  float axis = uVertMode > 0.5 ? (1.0 - vUv.y) : vUv.x;
  float sweep = 1.0 - smoothstep(uFill - 0.14, uFill + 0.06, axis);
  // 字面上下微渐变 + 浮雕高光
  vec3 filled = mix(uFillCol * 0.92, min(vec3(1.0), uFillCol * 1.12 + vec3(0.1)), vUv.y);
  vec3 face = mix(uBase, filled, sweep);
  float bevel = clamp(s.b - s.r * 0.55, 0.0, 1.0);
  face += vec3(0.32, 0.28, 0.3) * bevel * (0.45 + 0.55 * sweep);
  face += vec3(0.28, 0.24, 0.26) * uGlow;

  vec3 col = mix(uEdgeCol, face, smoothstep(0.18, 0.72, s.r));
  gl_FragColor = vec4(col, alpha * uOpacity);
}`;

const CHAR_PLANE = new THREE.PlaneGeometry(1, 1);

function makeGlyphMat(rect: THREE.Vector4, base: number, fill: number, edge: number, isDepth: boolean, vertMode = 0) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTex: { value: GLYPH_TEX },
      uRect: { value: rect },
      uBase: { value: new THREE.Color(base) },
      uFillCol: { value: new THREE.Color(fill) },
      uEdgeCol: { value: new THREE.Color(edge) },
      uFill: { value: 0 },
      uVertMode: { value: vertMode },
      uOpacity: { value: 0 },
      uGlow: { value: 0 },
      uIsDepth: { value: isDepth ? 1 : 0 },
    },
    vertexShader: GLYPH_VS,
    fragmentShader: GLYPH_FS,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
}

function motifTex(fx: FxMotif): THREE.Texture {
  switch (fx) {
    case 'petal': return petalTex();
    case 'spark': return sparkTex();
    case 'rain': return dropTex();
    case 'frost': return frostTex();
    case 'spirit': return glowTex();
  }
}

interface CharNode {
  i: number;
  inWord: number;
  key: boolean;
  localX: number;
  t0: number;
  t1: number;
  seed: number;
  grp: THREE.Group;
  frontMat: THREE.ShaderMaterial;
  depthMat: THREE.ShaderMaterial;
  extraMesh: THREE.Mesh | null; // 水中倒影字（ripple）或空谷回声重影（echo）
  extraMat: THREE.ShaderMaterial | null;
}

interface BurstParticle {
  sp: THREE.Sprite;
  mat: THREE.SpriteMaterial;
  vx: number;
  vy: number;
  rot0: number;
  vrot: number;
  sz: number;
}

interface WordNode {
  key: boolean;
  row: number;
  cx: number;
  cy: number;
  width: number;
  wt0: number;
  wt1: number;
  grp: THREE.Group;
  chars: CharNode[];
  halo: THREE.Sprite | null;
  haloMat: THREE.SpriteMaterial | null;
  bar: THREE.Mesh | null;
  barMat: THREE.MeshBasicMaterial | null;
  bursts: BurstParticle[];
}

export interface CardOptions {
  style?: LyricStyle;
  fx?: FxMotif;
  size?: number;
  x?: number;
  y?: number;
  hi?: number;
  key?: number;
  tilt?: number;
}

export class Line3D {
  root = new THREE.Group();
  words: WordNode[] = [];
  style: LyricStyle;
  start: number;
  end: number;
  baseSize: number;
  tilt: number;

  constructor(line: LyricLine, opts: CardOptions = {}) {
    this.style = opts.style ?? line.style;
    const fx = opts.fx ?? line.fx;
    const isMel = line.syl;
    const S = opts.size ?? (isMel ? 0.34 : 0.43);
    this.baseSize = S;
    this.start = line.t[0] ?? 0;
    this.end = line.end;
    this.tilt = opts.tilt ?? (line.idx % 2 === 0 ? 0.11 : -0.11);

    const hiCol = opts.hi ?? line.hi;
    const keyCol = opts.key ?? line.key;
    // 哪怕黑发被浸染：未唱时为乌墨发色，唱到时自上而下浸染为皑皑银雪白！
    const isFrost = this.style === 'frost';
    const isVert = isFrost || this.style === 'tear' || this.style === 'rain' ? 1 : 0;
    const baseFace = isFrost ? 0x384152 : 0xf7f2ec;
    const edgeBase = this.style === 'slash' || this.style === 'volley' ? 0x2b0b14 : 0x1a1228;
    const depthNormal = this.style === 'slash' || this.style === 'volley' ? 0x5c1424 : 0x35234d;
    const depthKey =
      this.style === 'slash' || this.style === 'volley' ? 0x991b2e
      : this.style === 'frost' || this.style === 'shiver' ? 0x3b6998
      : this.style === 'spirit' || this.style === 'echo' ? 0x1f6f78
      : 0x7c2952;

    const parsed = parseSeg(line.seg, line.syl);
    const charAdv = S * (isMel ? 0.96 : 1.04);
    const wordGap = S * (isMel ? 0.18 : 0.24); // 词与词之间留出清晰语义呼吸间距

    // 计算每个字在行内的 X 坐标
    const unitX: number[] = [];
    const rowMin = new Array(parsed.rows).fill(Infinity);
    const rowMax = new Array(parsed.rows).fill(-Infinity);
    let prevRow = -1, prevWord = -1, curX = 0;

    parsed.units.forEach((u) => {
      if (u.row !== prevRow) {
        curX = 0; prevRow = u.row; prevWord = u.wordIdx;
      } else {
        curX += charAdv;
        if (u.wordIdx !== prevWord) { curX += wordGap; prevWord = u.wordIdx; }
      }
      unitX.push(curX);
      if (curX < rowMin[u.row]) rowMin[u.row] = curX;
      if (curX > rowMax[u.row]) rowMax[u.row] = curX;
    });

    // 安全下三分之一构图，绝不遮挡画面中央人物的面部
    const baseY = opts.y ?? (isMel ? -1.62 : -1.52);
    const baseX = opts.x ?? 0;
    const hasReflection = this.style === 'ripple';
    const hasEcho = this.style === 'echo';
    const DEPTH_LAYERS = isMel ? 3 : 5;

    parsed.words.forEach((wd, wi) => {
      const rw = (rowMax[wd.row] - rowMin[wd.row]) || 0;
      const rowOffset = -rw * 0.5 + baseX + (parsed.rows === 2 ? (wd.row === 0 ? -S * 0.22 : S * 0.22) : 0);
      const rowY = baseY + (parsed.rows === 2 ? (wd.row === 0 ? S * 0.54 : -S * 0.54) : 0);

      const xFirst = unitX[wd.from] + rowOffset;
      const xLast = unitX[wd.to] + rowOffset;
      const wCenterX = (xFirst + xLast) * 0.5;
      const wSpan = Math.max(S * 0.85, xLast - xFirst + S * 0.92);

      const wGrp = new THREE.Group();
      wGrp.position.set(wCenterX, rowY, 0);
      this.root.add(wGrp);

      const wt0 = line.t[wd.from] ?? this.start;
      const wt1 = line.t[wd.to] ?? wt0;

      // 关键词词组背光光晕 + 词底流光金丝线 + 确定性语义粒子簇
      let halo: THREE.Sprite | null = null;
      let haloMat: THREE.SpriteMaterial | null = null;
      let bar: THREE.Mesh | null = null;
      let barMat: THREE.MeshBasicMaterial | null = null;
      const bursts: BurstParticle[] = [];

      if (wd.key) {
        haloMat = new THREE.SpriteMaterial({
          map: glowTex(),
          color: keyCol,
          transparent: true,
          opacity: 0,
          blending: THREE.AdditiveBlending,
          depthTest: false,
          depthWrite: false,
        });
        halo = new THREE.Sprite(haloMat);
        halo.scale.set(wSpan * 1.65, S * 2.15, 1);
        halo.position.set(0, 0, -0.18);
        halo.renderOrder = 995;
        wGrp.add(halo);

        if (!isMel) {
          barMat = new THREE.MeshBasicMaterial({
            color: keyCol,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            depthWrite: false,
          });
          bar = new THREE.Mesh(new THREE.PlaneGeometry(wSpan * 0.88, S * 0.065), barMat);
          bar.position.set(0, -S * 0.54, 0.02);
          bar.renderOrder = 1012;
          wGrp.add(bar);

          // 每个关键词配备 4 枚语义粒子（樱瓣 / 剑芒 / 雨泪 / 霜晶 / 灵萤）
          const pTex = motifTex(fx);
          for (let pi = 0; pi < 4; pi++) {
            const sd = line.idx * 97 + wi * 23 + pi * 7 + 5;
            const pm = new THREE.SpriteMaterial({
              map: pTex,
              color: fx === 'petal' ? 0xffc8dd : keyCol,
              transparent: true,
              opacity: 0,
              blending: fx === 'petal' ? THREE.NormalBlending : THREE.AdditiveBlending,
              depthTest: false,
              depthWrite: false,
            });
            const sp = new THREE.Sprite(pm);
            sp.renderOrder = 1015;
            wGrp.add(sp);
            const ang = (pi / 4) * Math.PI * 2 + hash(sd) * 0.9;
            bursts.push({
              sp,
              mat: pm,
              vx: Math.cos(ang) * (wSpan * 0.48 + S * 0.35),
              vy: fx === 'rain' ? -S * (0.7 + hash(sd + 1) * 0.6) : Math.sin(ang) * S * 0.65 + S * 0.42,
              rot0: hash(sd + 2) * 6.28,
              vrot: (hash(sd + 3) - 0.5) * 4.5,
              sz: S * (fx === 'petal' ? 0.32 : 0.28) * (0.8 + hash(sd + 4) * 0.45),
            });
          }
        }
      }

      const chars: CharNode[] = [];
      for (let i = wd.from; i <= wd.to; i++) {
        const u = parsed.units[i];
        const lx = unitX[i] + rowOffset - wCenterX;
        const t0 = line.t[i] ?? wt0;
        const nextT = i < parsed.units.length - 1 ? line.t[i + 1] : Math.min(this.end, t0 + 0.95);
        const t1 = Math.max(t0 + 0.08, nextT);
        const rect = glyphRect(u.token);

        // 「若晴呐若雨」：前词暖晴金，后词烟雨蓝
        let charFill = wd.key ? keyCol : hiCol;
        if (this.style === 'rain') {
          charFill = i < 2 ? 0xffdf7e : i === 2 ? 0xf5e6cc : 0x7dd3fc;
        }

        const fMat = makeGlyphMat(rect, baseFace, charFill, edgeBase, false, isVert);
        const dMat = makeGlyphMat(rect, 0, 0, wd.key ? depthKey : depthNormal, true, 0);

        const cGrp = new THREE.Group();
        for (let k = DEPTH_LAYERS; k >= 1; k--) {
          const dm = new THREE.Mesh(CHAR_PLANE, dMat);
          dm.position.set(0.011 * k, -0.012 * k, -0.036 * k);
          dm.renderOrder = 1000 + (DEPTH_LAYERS - k);
          cGrp.add(dm);
        }
        const fm = new THREE.Mesh(CHAR_PLANE, fMat);
        fm.renderOrder = 1010;
        cGrp.add(fm);

        // 关键词微放大 6%，强化「按词」主次层级
        cGrp.scale.setScalar(S * (wd.key && !isMel ? 1.06 : 1));
        wGrp.add(cGrp);

        let extraMesh: THREE.Mesh | null = null;
        let extraMat: THREE.ShaderMaterial | null = null;
        if (hasReflection || hasEcho) {
          extraMat = makeGlyphMat(rect, charFill, charFill, edgeBase, false, 0);
          extraMat.uniforms.uFill.value = 1;
          extraMesh = new THREE.Mesh(CHAR_PLANE, extraMat);
          extraMesh.renderOrder = 996;
          if (hasReflection) {
            // 「映在水中央」：每个字正下方浮现柔光水中倒影
            extraMesh.scale.set(S, -S * 0.62, 1);
            extraMesh.position.set(lx, -S * 0.72, -0.05);
          } else {
            // 「在山的一头呼喊」：向深谷扩散的三维回声字影
            extraMesh.scale.setScalar(S);
            extraMesh.position.set(lx, 0, -0.15);
          }
          wGrp.add(extraMesh);
        }

        chars.push({
          i,
          inWord: u.inWordIdx,
          key: wd.key,
          localX: lx,
          t0,
          t1,
          seed: hash(line.idx * 53 + i * 13 + 7),
          grp: cGrp,
          frontMat: fMat,
          depthMat: dMat,
          extraMesh,
          extraMat,
        });
      }

      this.words.push({
        key: wd.key,
        row: wd.row,
        cx: wCenterX,
        cy: rowY,
        width: wSpan,
        wt0,
        wt1,
        grp: wGrp,
        chars,
        halo,
        haloMat,
        bar,
        barMat,
        bursts,
      });
    });
  }

  /** 更新本句每个词与每个字的三维姿态，返回关键词落地推力 0..1 */
  update(t: number): number {
    const visible = t >= this.start - 0.42 && t <= this.end + 0.62;
    this.root.visible = visible;
    if (!visible) return 0;

    // 整句轻微立体呼吸偏转，凸显 5 层厚度切面
    this.root.rotation.set(
      Math.sin(t * 0.55) * 0.03,
      this.tilt * Math.cos(t * 0.45),
      0,
    );

    const st = this.style;
    const S = this.baseSize;
    let kick = 0;

    for (let wi = 0; wi < this.words.length; wi++) {
      const wd = this.words[wi];
      // ---- 第一层：按词（Word-Level）三维整体调度 ----
      const wActive = range(t, wd.wt0 - 0.08, wd.wt0 + 0.14);
      const wLandDt = t - wd.wt1;
      const wPop = wd.key && wLandDt >= 0 ? Math.exp(-wLandDt * 4.2) : 0;
      const wExit = range(t, this.end + wi * 0.035, this.end + wi * 0.035 + 0.42);

      if (wd.key && wLandDt >= 0 && wLandDt < 0.24) {
        kick = Math.max(kick, (1 - wLandDt / 0.24) * (st === 'slash' || st === 'volley' ? 1.0 : 0.65));
      }

      let wx = wd.cx;
      let wy = wd.cy + (wd.key ? wPop * S * 0.16 : 0);
      let wz = wActive * 0.12 + wPop * 0.28;
      let wrx = 0, wry = 0, wrz = 0;
      let wScale = 1 + wPop * 0.11;

      if (st === 'vow' && wd.key) {
        wry = (1 - eBack(range(t, wd.wt0 - 0.18, wd.wt0 + 0.12), 1.3)) * 0.55;
      } else if (st === 'slash' && wd.key && wLandDt >= 0 && wLandDt < 0.18) {
        wx += Math.sin(wLandDt * 95) * 0.035 * (1 - wLandDt / 0.18);
      } else if (st === 'volley' && wd.key && wLandDt >= 0 && wLandDt < 0.22) {
        const shk = (1 - wLandDt / 0.22) * 0.045;
        wx += Math.sin(t * 72 + wi) * shk;
        wy += Math.cos(t * 64 + wi) * shk;
      } else if (st === 'spirit') {
        wy += Math.sin(t * 1.5 + wi * 0.9) * 0.035;
      }

      if (wExit > 0) {
        const eo = eIn(wExit);
        if (st === 'spirit' || st === 'sakura' || st === 'bloom' || st === 'cloud') {
          wy += eo * 0.65;
          wz += eo * 0.55;
        } else if (st === 'tear' || st === 'rain' || st === 'frost') {
          wy -= eo * 0.52;
        } else {
          wz += eo * 0.85;
          wrx += eo * 0.45;
        }
      }

      wd.grp.position.set(wx, wy, wz);
      wd.grp.rotation.set(wrx, wry, wrz);
      wd.grp.scale.setScalar(wScale);

      // 关键词词组光晕、词底金线与确定性粒子绽放
      const fadeOut = 1 - wExit;
      if (wd.haloMat) {
        wd.haloMat.opacity = fadeOut * (t >= wd.wt0 ? 0.08 + wPop * 0.24 : 0.02 * wActive);
      }
      if (wd.barMat && wd.bar) {
        const barP = eOut(range(t, wd.wt0, Math.max(wd.wt0 + 0.18, wd.wt1 + 0.08)));
        wd.bar.scale.x = Math.max(0.001, barP);
        wd.barMat.opacity = fadeOut * barP * (0.48 + wPop * 0.5);
      }
      if (wd.bursts.length) {
        const bp = wLandDt >= 0 ? range(wLandDt, 0, 1.05) : 0;
        for (const b of wd.bursts) {
          if (wLandDt <= 0 || bp >= 1) {
            b.mat.opacity = 0;
          } else {
            const ep = eOut(bp);
            b.sp.position.set(b.vx * ep, b.vy * ep - 0.12 * bp * bp, 0.08 + ep * 0.18);
            b.sp.scale.setScalar(b.sz * (1 - bp * 0.45));
            b.mat.rotation = b.rot0 + wLandDt * b.vrot;
            b.mat.opacity = fadeOut * Math.sin(bp * Math.PI) * 0.88;
          }
        }
      }

      // ---- 第二层：按字（Character-Level）三维逐字落拍与语义形态 ----
      for (const ch of wd.chars) {
        const lead =
          st === 'slash' || st === 'volley' ? 0.16
          : st === 'melody' ? 0.18
          : st === 'spirit' || st === 'cloud' || st === 'frost' ? 0.34
          : 0.25;
        const a = range(t, ch.t0 - lead, ch.t0);
        const ia = 1 - eOut(a);
        const landDt = t - ch.t0;
        const cPop = landDt >= 0 ? Math.exp(-landDt * 7.5) : 0;

        let cx = ch.localX;
        let cy = 0;
        let cz = 0;
        let rx = 0, ry = 0, rz = 0;
        let sc = 1 + cPop * (ch.key ? 0.16 : 0.1);
        let op = smooth(a * 1.55) * fadeOut;

        switch (st) {
          case 'melody': {
            // Da da da：轻盈踏石跳跃弧线
            cy += ia * 0.55 + (landDt >= 0 ? Math.sin(clamp(landDt / 0.26) * Math.PI) * 0.14 : 0);
            ry = ia * 0.9;
            rz = Math.sin(t * 3.2 + ch.i * 0.7) * 0.06;
            break;
          }
          case 'sakura': {
            // 落樱旋舞：如花瓣自右上轻旋飘落
            cx += ia * 0.45;
            cy += ia * 1.15;
            cz -= ia * 0.9;
            ry = ia * Math.PI * 0.85;
            rz = ia * (ch.seed - 0.5) * 1.1 + Math.sin(t * 1.8 + ch.i * 0.6) * 0.03;
            break;
          }
          case 'heartbeat': {
            // 刹那悸动：立体翻转 + 心跳微搏
            cz -= ia * 1.8;
            ry = (1 - eBack(a, 1.35)) * Math.PI * 0.75;
            if (ch.key && landDt >= 0) {
              sc += Math.exp(-landDt * 3.5) * Math.abs(Math.sin(landDt * 12)) * 0.08;
            }
            break;
          }
          case 'gallop': {
            // 策马疾驰：自左侧前倾疾掠入画
            cx -= ia * 1.65;
            cy += Math.abs(Math.sin(a * Math.PI)) * 0.22;
            cz -= ia * 1.1;
            rz = -ia * 0.35;
            ry = -ia * 0.7;
            break;
          }
          case 'bloom': {
            // 琴音生花：自下向上舒展绽放
            cy -= ia * 0.72;
            rx = -ia * 1.35;
            sc *= lerp(0.45, 1, eBack(a, 1.3));
            cy += Math.sin(t * 2.2 - ch.i * 0.5) * 0.035;
            break;
          }
          case 'horizon': {
            // 海角霞光：恢弘立体翻起
            cy -= ia * 0.55;
            cz -= ia * 1.5;
            ry = (1 - eOut(a)) * Math.PI * 0.8;
            break;
          }
          case 'breeze': {
            // 风拂千缕：丝绸般柔波起伏
            cx += ia * 0.55;
            cy += Math.sin(t * 2.5 - ch.i * 0.55) * 0.055;
            rz = Math.sin(t * 2.2 - ch.i * 0.5) * 0.055;
            rx = -ia * 0.9;
            break;
          }
          case 'slash': {
            // 噬血龙剑：凌厉斜斩劈落，切面锋芒毕露
            cx += ia * 1.1;
            cy += ia * 1.65;
            cz += ia * 1.2;
            rz = -ia * 0.85;
            rx = ia * 0.7;
            break;
          }
          case 'cloud': {
            // 脚踏浮云轻似燕：自云端轻盈滑翔落定
            cx -= ia * 0.75;
            cy += ia * 0.95 + Math.sin(t * 2.0 + ch.i * 0.65) * 0.06;
            cz -= ia * 1.4;
            rz = ia * 0.28;
            break;
          }
          case 'shiver': {
            // 奈何瑟瑟风中久站：寒风微颤
            cx += ia * 0.6;
            rx = -ia * 1.0;
            if (landDt >= 0) {
              const tr = (ch.key ? 0.016 : 0.008) * Math.exp(-landDt * 0.5);
              cx += Math.sin(t * 38 + ch.i * 5) * tr;
              rz += Math.cos(t * 31 + ch.i * 3) * tr * 1.5;
            }
            break;
          }
          case 'tear': {
            // 一把酸泪怎写沧桑：晶莹垂落 + 轻沉
            cy += ia * 1.45;
            if (landDt > 0) cy -= Math.sin(clamp(landDt / 0.35) * Math.PI) * 0.06;
            rx = ia * 0.65;
            break;
          }
          case 'volley': {
            // 万箭齐发留残伤：自景深远处破空激射入位
            cz -= ia * 5.2;
            cy += ia * 0.85;
            rx = ia * 0.55;
            break;
          }
          case 'ripple': {
            // 她还映在水中央：湖面涟漪轻漾 + 水中倒影字同步晃动
            cy -= ia * 0.48;
            const rip = Math.sin(t * 2.6 - ch.i * 0.65) * 0.04;
            cy += rip;
            ry = Math.cos(t * 1.8 - ch.i * 0.5) * 0.14;
            if (ch.extraMesh && ch.extraMat) {
              ch.extraMesh.position.x = cx + Math.sin(t * 3.8 + ch.i) * 0.025;
              ch.extraMesh.position.y = -S * 0.74 - rip * 0.6;
              ch.extraMat.uniforms.uOpacity.value = op * 0.34;
            }
            break;
          }
          case 'rain': {
            // 若晴呐若雨：左晴轻升，右雨垂滴
            if (ch.i < 2) { cy -= ia * 0.65; ry = ia * 0.8; }
            else { cy += ia * 1.3; }
            break;
          }
          case 'vow': {
            // 红绸盟誓：端庄立体翻转
            ry = (1 - eBack(a, 1.25)) * Math.PI * 0.9;
            cz -= ia * 1.2;
            break;
          }
          case 'echo': {
            // 在山的一头呼喊：字落时向山谷深处荡开三维回声字影
            cz -= ia * 2.2;
            if (ch.extraMesh && ch.extraMat) {
              const ep = landDt >= 0 ? range(landDt, 0, 0.95) : 0;
              ch.extraMesh.position.set(cx, ep * 0.18, -0.12 - ep * 1.45);
              ch.extraMesh.scale.setScalar(S * (1 + ep * 0.55));
              ch.extraMat.uniforms.uOpacity.value = landDt > 0 ? (1 - ep) * 0.32 * fadeOut : 0;
            }
            break;
          }
          case 'frost': {
            // 哪怕黑发被浸染：霜雪覆顶缓慢凝结
            cy += ia * 0.82;
            cz -= ia * 1.1;
            ry = ia * 0.55;
            break;
          }
          case 'spirit': {
            // 让这新曲飘过万里 / 带去我的灵体：澄澈流光扶摇浮现
            cy -= ia * 0.65;
            cz -= ia * 1.9;
            ry = Math.sin(t * 1.2 + ch.i * 0.55) * 0.18;
            break;
          }
        }

        const unitScale = S * (ch.key && st !== 'melody' ? 1.06 : 1) * sc;
        ch.grp.position.set(cx, cy, cz);
        ch.grp.rotation.set(rx, ry, rz);
        ch.grp.scale.setScalar(unitScale);

        const fillVal = range(t, ch.t0, ch.t1);
        ch.frontMat.uniforms.uFill.value = fillVal;
        ch.frontMat.uniforms.uOpacity.value = op;
        ch.frontMat.uniforms.uGlow.value = clamp(cPop * 0.55 + wPop * 0.85);
        ch.depthMat.uniforms.uOpacity.value = op * 0.94;
        ch.depthMat.uniforms.uGlow.value = wPop * 0.65;
      }
    }

    return kick;
  }
}

/** 全片三维歌词与片头/片尾三维字卡总控 */
export class Lyrics3DRig {
  root = new THREE.Group();
  lines: Line3D[] = [];
  cards: Line3D[] = [];
  kick = 0;
  hidden = false;

  constructor() {
    this.root.position.set(0, 0, -6.0);
    LYRICS.forEach((line) => {
      const l3 = new Line3D(line);
      this.lines.push(l3);
      this.root.add(l3.root);
    });

    // 片头三维题名（序章 0.35s–2.35s 优雅浮现于上空晨雾，不挡人物与首句歌词）
    this.addCard('*樱花树下/的/*约定', 0.32, 0.14, 2.25, {
      style: 'sakura',
      fx: 'petal',
      size: 0.64,
      y: 1.15,
      hi: 0xffe8f0,
      key: 0xff9ebb,
      tilt: 0.06,
    });

    // 尾声终章题名与分支八位角色谢幕卡（165.8s–174.2s）
    this.addCard('*樱花树下/的/*约定', 165.7, 0.18, 170.3, {
      style: 'sakura',
      fx: 'petal',
      size: 0.68,
      y: 1.02,
      hi: 0xfff0d9,
      key: 0xff9ebb,
      tilt: 0.05,
    });

    CREDITS.forEach(([name, role], i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      this.addCard(`*${name}/·/${role}`, 166.6 + i * 0.22, 0.05, 170.5, {
        style: 'spirit',
        fx: 'spirit',
        size: 0.25,
        x: col === 0 ? -1.65 : 1.65,
        y: 0.12 - row * 0.44,
        hi: 0xfef3c7,
        key: 0xffc8dd,
        tilt: 0,
      });
    });

    this.addCard('*谢谢观赏', 171.1, 0.18, 174.1, {
      style: 'spirit',
      fx: 'petal',
      size: 0.46,
      y: 0.05,
      hi: 0xffe8d6,
      key: 0xffb3c6,
      tilt: 0,
    });
  }

  addCard(seg: string, t0: number, dt: number, end: number, opts: CardOptions) {
    const parsed = parseSeg(seg, false);
    const plain = parsed.units.map((u) => u.token).join('');
    const fakeLine: LyricLine = {
      idx: 100 + this.cards.length,
      text: plain,
      seg,
      t: parsed.units.map((_, i) => t0 + i * dt),
      end,
      style: opts.style ?? 'sakura',
      fx: opts.fx ?? 'petal',
      hi: opts.hi ?? 0xffe4ec,
      key: opts.key ?? 0xff9ebb,
      ch: 'outro',
      syl: false,
    };
    const card = new Line3D(fakeLine, opts);
    this.cards.push(card);
    this.root.add(card.root);
    return card;
  }

  update(t: number, fov: number) {
    // 随相机 FOV 自适应缩放，任何焦段下字号与边距恒定美观
    const scale = Math.tan((fov * Math.PI) / 360) / Math.tan((40 * Math.PI) / 360);
    this.root.scale.setScalar(scale);
    this.root.visible = !this.hidden;

    let maxKick = 0;
    for (let i = 0; i < this.lines.length; i++) {
      const cur = this.lines[i];
      const next = this.lines[i + 1];
      // 严防两句重叠：下一句首字前 0.14s 干净收起上一句
      if (next && t >= next.start - 0.14) {
        cur.root.visible = false;
        continue;
      }
      const k = cur.update(t);
      if (cur.root.visible && k > maxKick) maxKick = k;
    }
    for (const c of this.cards) c.update(t);
    this.kick = maxKick;
  }
}
