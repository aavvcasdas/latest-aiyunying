// 三维逐字歌词卡：每个字是一张有厚度的字卡（正面 + 四层深度），在实测的那一拍落地；
// 字里有「卡拉 OK」从左到右的填色，词（关键词）落完最后一个字时整词再弹一下、发光、给镜头一个轻推。
import * as THREE from 'three';
import fontUrl from '../assets/zcool.woff2';
import { LYRICS, type LyricLine } from './generated';
import { clamp, eBack, eIn, eOut, glowTex, hash, lerp, range, smooth } from './core';

export const FONT = 'ZCOOLKL';
export const FONT_STACK = `'${FONT}', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif`;
export async function loadFont() {
  try { const ff = new FontFace(FONT, `url(${fontUrl})`); await ff.load(); document.fonts.add(ff); }
  catch (e) { console.warn('字体载入失败，退回系统字体', e); }
}

// 分词：「/」分词，「*」关键词，「|」换行（两行错位排版）
const SEG_SRC = [
  '时光/是/*琥珀|泪/一滴滴/被/*反锁', '*情书/再/*不朽|也/磨成/*沙漏', '*青春/的/上游|白云/飞走/*苍狗/与/*海鸥', '闪过/的/*念头|*潺潺/的/溜走',
  '*命运/好/幽默|让/爱的人/都/*沉默', '一整个/*宇宙|换/一颗/*红豆', '*回忆/如/*困兽|寂寞/太久/而/渐渐/*温柔', '放开了/*拳头|反而/更/*自由',
  '*慢动作/缱绻/*胶卷', '重播/*默片|*定格/一瞬间', '我们/在/*告别/的/*演唱会', '说好/*不再见', '你/写给我|我的/*第一首歌', '你和我/*十指紧扣|默写/*前奏',
  '可是/那/*然后呢', '还好/我有我|这一首/*情歌', '轻轻的/轻轻|哼着/*哭着/*笑着', '我的/*天长地久', '*长镜头/越拉越远', '越来越远|事隔/*好几年',
  '我们/在/*怀念/的/*演唱会', '礼貌地/*吻别', '陪我/唱歌|*清唱/你的/*情歌', '舍不得/短短/*副歌|心/还/*热着', '也该/*告一段落',
  '还好/我有我|*下一首/*情歌', '生命/宛如/静静的|*相拥的/*河', '永远/*天长地久',
];
interface Seg { c: string; word: number; key: boolean; row: number }
interface Parsed { segs: Seg[]; words: { key: boolean; from: number; to: number }[]; rows: number }
const SEG = new Map<string, Parsed>();
function parse(src: string): Parsed {
  const rows = src.split('|'); const segs: Seg[] = []; const words: Parsed['words'] = []; let w = 0;
  rows.forEach((r, ri) => r.split('/').forEach((wd) => {
    const key = wd.startsWith('*'); const s = key ? wd.slice(1) : wd; const from = segs.length;
    for (const c of s) segs.push({ c, word: w, key, row: ri });
    words.push({ key, from, to: segs.length - 1 }); w++;
  }));
  return { segs, words, rows: rows.length };
}
for (const s of SEG_SRC) { const p = parse(s); SEG.set(p.segs.map((x) => x.c).join(''), p); }
function segsOf(text: string): Parsed {
  const p = SEG.get(text); if (p) return p;
  const chars = [...text];
  return parse(chars.join('/'));
}
/** 给界面用：一行歌词的分词（关键词带 *） */
export function wordsOf(text: string) { const p = segsOf(text); return p.words.map((w) => ({ text: p.segs.slice(w.from, w.to + 1).map((s) => s.c).join(''), key: w.key })); }

// 每句一个入场方式（按歌词意思挑）
export const STYLE = ['drop', 'crumble', 'wave', 'wave', 'flip', 'scatter', 'shake', 'burst', 'slow', 'type', 'flip', 'zoom', 'rise', 'rise', 'zoom', 'flip', 'wave', 'big',
  'flip', 'scatter', 'shake', 'burst', 'zoom', 'zoom', 'slow', 'rise', 'rise', 'slow', 'zoom', 'flip', 'wave', 'big', 'rise', 'slow', 'type', 'flip', 'wave', 'big'];
const ACC: [number, number][] = [
  [0xffc35a, 0xff8a3d], [0xffd6a0, 0xff9f6b], [0x8be9ff, 0xfff27a], [0x8be9ff, 0xfff27a], [0xf0abfc, 0xffd166], [0xffb3c1, 0xff3b5c], [0xc4b5fd, 0xff6b8b], [0xc4b5fd, 0xfff1a8],
  [0xf5deb3, 0xffb86b], [0xffffff, 0xd4d4d4], [0xff9bd5, 0xffd166], [0xff9bd5, 0x7dd3fc], [0x9cc9ff, 0xffd166], [0x9cc9ff, 0xff8fb1], [0xb8c6db, 0xe2e8f0], [0xffc9a8, 0xff8a65],
  [0xffc9a8, 0x8be9ff], [0xffe08a, 0xff9e5e], [0xe9d5ff, 0x86efac], [0xffb3c1, 0xff3b5c], [0xc4b5fd, 0xfbcfe8], [0xffd59e, 0xfff1a8], [0xc7d2fe, 0xa5f3fc], [0xc7d2fe, 0xfde68a],
  [0xf5d6a8, 0xffb86b], [0xf5d6a8, 0xff9bb3], [0xff9bd5, 0xffd166], [0xf5deb3, 0xffb86b], [0xffc35a, 0xd6d3d1], [0xff9bd5, 0xfde047], [0xff9bd5, 0x7dd3fc], [0xffe08a, 0xff7eb6],
  [0xffb86b, 0xfde68a], [0xffb86b, 0xff5f6d], [0xe7d7c1, 0xffffff], [0xfde68a, 0x86efac], [0xffd1b3, 0x9be7ff], [0xffe08a, 0xffb347],
];

// ---------- 字形图集（R = 字身，G = 描边） ----------
const CELL = 128, COLS = 16;
let GTEX: THREE.CanvasTexture | null = null; let GROWS = 1;
const GMAP = new Map<string, number>();
export function buildGlyphs(extra: string) {
  const set = new Set<string>();
  for (const l of LYRICS) for (const c of l.text) set.add(c);
  for (const c of extra) if (c.trim()) set.add(c);
  const chars = [...set]; GROWS = Math.ceil(chars.length / COLS);
  const cv = document.createElement('canvas'); cv.width = COLS * CELL; cv.height = GROWS * CELL;
  const g = cv.getContext('2d')!;
  g.fillStyle = '#000'; g.fillRect(0, 0, cv.width, cv.height);
  g.font = `98px ${FONT_STACK}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  chars.forEach((c, i) => {
    const x = (i % COLS) * CELL + CELL / 2, y = Math.floor(i / COLS) * CELL + CELL / 2 + 5;
    g.strokeStyle = '#00ff00'; g.lineWidth = 17; g.strokeText(c, x, y);
    g.fillStyle = '#ff0000'; g.fillText(c, x, y);
    GMAP.set(c, i);
  });
  GTEX = new THREE.CanvasTexture(cv); GTEX.colorSpace = THREE.NoColorSpace; GTEX.anisotropy = 8;
  GTEX.minFilter = THREE.LinearMipmapLinearFilter; GTEX.generateMipmaps = true;
}
function rectOf(c: string) {
  const i = GMAP.get(c) ?? 0; const col = i % COLS, row = Math.floor(i / COLS);
  return new THREE.Vector4(col / COLS, 1 - (row + 1) / GROWS, (col + 1) / COLS, 1 - row / GROWS);
}
const GV = `uniform vec4 uRect; varying vec2 vUv; varying vec2 vLoc;
void main(){ vLoc = uv; vUv = vec2(mix(uRect.x, uRect.z, uv.x), mix(uRect.y, uRect.w, uv.y)); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const GF = `uniform sampler2D map; uniform vec3 cBase; uniform vec3 cHi; uniform vec3 cStroke; uniform float uFill; uniform float uOp; uniform float uDepth; uniform float uGlow;
varying vec2 vUv; varying vec2 vLoc;
void main(){ vec4 t = texture2D(map, vUv); float f = t.r; float s = t.g; float a = clamp(f + s, 0.0, 1.0);
  if (uDepth > 0.5) { if (a < 0.5) discard; gl_FragColor = vec4(cStroke, uOp); return; }
  if (a < 0.03) discard;
  float w = smoothstep(uFill - 0.07, uFill + 0.07, vLoc.x);
  vec3 fc = mix(cHi, cBase, w) * (1.0 + uGlow * 0.35);
  vec3 col = (fc * f + cStroke * s) / max(a, 0.001);
  gl_FragColor = vec4(col, a * uOp); }`;
const PLANE = new THREE.PlaneGeometry(1, 1);
function gmat(rect: THREE.Vector4, base: number, hi: number, stroke: number, depth: boolean) {
  return new THREE.ShaderMaterial({
    uniforms: {
      map: { value: GTEX }, uRect: { value: rect }, cBase: { value: new THREE.Color(base) }, cHi: { value: new THREE.Color(hi) }, cStroke: { value: new THREE.Color(stroke) },
      uFill: { value: 0 }, uOp: { value: 0 }, uDepth: { value: depth ? 1 : 0 }, uGlow: { value: 0 },
    },
    vertexShader: GV, fragmentShader: GF, transparent: true, depthTest: false, depthWrite: false,
  });
}

interface Gl {
  c: string; i: number; key: boolean; x: number; y: number; t0: number; t1: number; wt1: number; r: number;
  g: THREE.Group; m: THREE.ShaderMaterial; dm: THREE.ShaderMaterial; gm: THREE.ShaderMaterial; ghost: THREE.Mesh; glow: THREE.Sprite | null;
}
export interface LineOpts { style?: string; size?: number; x?: number; y?: number; hi?: number; key?: number; tilt?: number; ghost?: boolean }

export class Line3D {
  grp = new THREE.Group(); gl: Gl[] = []; style: string; start: number; end: number; tilt: number; ghost: boolean;
  constructor(line: LyricLine, idx: number, o: LineOpts = {}) {
    this.style = o.style ?? STYLE[idx] ?? 'rise';
    const big = this.style === 'big';
    const S = o.size ?? (big ? 0.78 : 0.44);
    const [hi, key] = o.hi !== undefined ? [o.hi, o.key ?? o.hi] : ACC[idx] ?? [0xffd166, 0xff8fb1];
    this.start = line.t[0]; this.end = line.end; this.tilt = o.tilt ?? (idx % 2 ? -0.13 : 0.13); this.ghost = o.ghost ?? true;
    const p = segsOf(line.text);
    const adv = S * 1.06, gap = S * 0.32;
    const rowsX: number[][] = Array.from({ length: p.rows }, () => []);
    const xs: number[] = []; let lastRow = -1, lastWord = -1, x = 0;
    p.segs.forEach((s) => {
      if (s.row !== lastRow) { x = 0; lastRow = s.row; lastWord = s.word; }
      else { x += adv; if (s.word !== lastWord) { x += gap; lastWord = s.word; } }
      xs.push(x); rowsX[s.row].push(x);
    });
    const baseY = o.y ?? (big ? -0.95 : -1.42);
    const n = p.segs.length;
    p.segs.forEach((s, i) => {
      const rx = rowsX[s.row]; const w = rx[rx.length - 1] - rx[0];
      let gx = xs[i] - w / 2 + (o.x ?? 0), gy = baseY;
      if (p.rows === 2) { gx += s.row === 0 ? -S * 0.85 : S * 0.85; gy += s.row === 0 ? S * 0.66 : -S * 0.66; }
      const t0 = line.t[i] ?? line.t[line.t.length - 1];
      const t1 = Math.max(t0 + 0.08, i < n - 1 ? line.t[i + 1] : Math.min(line.end, t0 + 1.4));
      const wd = p.words[s.word]; const wt1 = line.t[wd.to] ?? t0;
      const rect = rectOf(s.c);
      const m = gmat(rect, 0xf4f1ea, s.key ? key : hi, 0x1b1230, false);
      const dm = gmat(rect, 0, 0, s.key ? 0x5b2148 : 0x2a1f4a, true);
      const gm = gmat(rect, 0xf4f1ea, 0xf4f1ea, 0x1b1230, false);
      const g = new THREE.Group();
      for (let k = 4; k >= 1; k--) { const d = new THREE.Mesh(PLANE, dm); d.position.set(0.012 * k, -0.012 * k, -0.045 * k); d.renderOrder = 1000 + (5 - k); g.add(d); }
      const f = new THREE.Mesh(PLANE, m); f.renderOrder = 1010; g.add(f);
      g.scale.setScalar(S);
      let glow: THREE.Sprite | null = null;
      if (s.key) {
        glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: key, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false }));
        glow.scale.setScalar(2.3); glow.renderOrder = 998; g.add(glow);
      }
      const ghost = new THREE.Mesh(PLANE, gm); ghost.renderOrder = 997; ghost.scale.setScalar(S * 0.9); ghost.position.set(gx, gy, -0.05);
      this.grp.add(g); this.grp.add(ghost);
      this.gl.push({ c: s.c, i, key: s.key, x: gx, y: gy, t0, t1, wt1, r: hash(idx * 31 + i * 7 + 3), g, m, dm, gm, ghost, glow });
    });
  }
  /** 返回关键词落点的「推力」0..1，给镜头用 */
  update(t: number): number {
    const vis = t > this.start - 0.8 && t < this.end + 1.3;
    this.grp.visible = vis; if (!vis) return 0;
    this.grp.rotation.set(0, this.tilt * Math.cos(t * 0.4), 0);
    let kick = 0; const lineP = range(t, this.start, this.end); const st = this.style;
    const ghostIn = this.ghost ? 0.2 * range(t, this.start - 0.7, this.start - 0.25) : 0;
    for (const g of this.gl) {
      const lead = st === 'slow' ? 0.5 : st === 'type' ? 0.04 : st === 'scatter' ? 0.32 : 0.22;
      const a = range(t, g.t0 - lead, g.t0);
      const ex = this.end + 0.1 + g.i * 0.03; const e = range(t, ex, ex + 0.55);
      const land = t >= g.t0 ? Math.exp(-(t - g.t0) * 7) : 0;
      const wl = g.key && t >= g.wt1 ? Math.exp(-(t - g.wt1) * 4) : 0;
      if (g.key && t >= g.wt1 && t < g.wt1 + 0.22) kick = Math.max(kick, 1 - (t - g.wt1) / 0.22);
      let x = g.x, y = g.y, z = 0, rx = 0, ry = 0, rz = 0, s = 1, op = smooth(a * 1.7);
      const ia = 1 - eOut(a);
      switch (st) {
        case 'drop': y += ia * 2.4; if (t >= g.t0) y += Math.sin(clamp((t - g.t0) / 0.3) * Math.PI) * 0.09; rz = ia * (g.r - 0.5) * 1.4; break;
        case 'flip': case 'burst': case 'big': ry = (1 - eBack(a, 1.4)) * Math.PI * 1.1; z -= ia * 1.6; break;
        case 'rise': case 'crumble': case 'wave': case 'shake': y -= ia * 0.9; rx = -ia * 1.5; break;
        case 'scatter': x = lerp(g.x + (g.r - 0.5) * 10, g.x, eOut(a)); y = lerp(g.y + (hash(g.r * 91) - 0.3) * 6, g.y, eOut(a)); z = -ia * 7; rz = ia * 6 * (g.r - 0.5); break;
        case 'slow': z = -ia * 2.5; ry = Math.sin(t * 0.9 + g.i * 0.5) * 0.22; y += Math.sin(t * 0.7 + g.i * 0.6) * 0.04; break;
        case 'type': s *= 1 + (1 - range(t, g.t0 - 0.04, g.t0 + 0.12)) * 0.5; op = t >= g.t0 - 0.04 ? 0.84 + 0.16 * Math.sin(t * 47 + g.i * 3) : 0; break;
        case 'zoom': z = -ia * 7; break;
      }
      if (st === 'wave') { const w = Math.sin(t * 2.4 - g.i * 0.55); y += w * 0.07; rz += w * 0.07; }
      if (st === 'shake') { const amp = (1 - lineP) * 0.07 + 0.004; x += Math.sin(t * 43 + g.i * 7) * amp; y += Math.cos(t * 39 + g.i * 5) * amp; }
      if (st === 'big') { y += Math.sin(t * 1.6 + g.i * 0.8) * 0.05; }
      if (e > 0) {
        if (st === 'crumble') { y -= eIn(e) * 2.6; rz += e * (g.r - 0.5) * 2; s *= 1 - e * 0.5; }
        else if (st === 'burst') { y += eIn(e) * 3.2; x += (g.r - 0.5) * e * 3; rz += e * (g.r - 0.5) * 5; }
        else if (st === 'zoom' || st === 'slow' || st === 'big') { z += eIn(e) * 3; }
        else if (st === 'drop') { y -= eIn(e) * 2; }
        else { y += eOut(e) * 0.5; z += e * 1.2; rx += e * 0.8; }
        op *= 1 - e;
      }
      s *= 1 + land * (g.key ? 0.32 : 0.18) + wl * 0.24;
      g.g.position.set(x, y, z); g.g.rotation.set(rx, ry, rz); g.g.scale.setScalar(s * (g.g.userData.S ?? 1) * this.sizeOf());
      g.m.uniforms.uFill.value = range(t, g.t0, g.t1);
      g.m.uniforms.uOp.value = op; g.dm.uniforms.uOp.value = op * 0.95; g.m.uniforms.uGlow.value = wl;
      g.gm.uniforms.uOp.value = a > 0 ? ghostIn * (1 - smooth(a * 2)) : ghostIn * (1 - e);
      if (g.glow) (g.glow.material as THREE.SpriteMaterial).opacity = op * (0.18 + 0.6 * wl) * (t >= g.t0 ? 1 : 0.2);
    }
    return kick;
  }
  private _S = 0;
  private sizeOf() {
    if (!this._S) this._S = this.gl.length ? this.gl[0].ghost.scale.x / 0.9 : 0.44;
    return this._S;
  }
}

/** 整套歌词：挂在相机上，跟着 FOV 缩放，保证字在画面里的大小不变 */
export class Lyrics {
  root = new THREE.Group(); lines: Line3D[] = []; cards: Line3D[] = []; kick = 0; hidden = false;
  constructor() {
    this.root.position.set(0, 0, -6);
    LYRICS.forEach((l, i) => { const L = new Line3D(l, i); this.lines.push(L); this.root.add(L.grp); });
  }
  card(text: string, t0: number, dt: number, end: number, o: LineOpts) {
    const chars = [...text].filter((c) => c !== ' ');
    const L = new Line3D({ text: chars.join(''), t: chars.map((_, i) => t0 + i * dt), end }, -1, { ghost: false, tilt: 0, ...o });
    this.cards.push(L); this.root.add(L.grp); return L;
  }
  update(t: number, fov: number) {
    const k = Math.tan((fov * Math.PI) / 360) / Math.tan((40 * Math.PI) / 360);
    this.root.scale.setScalar(k); this.root.visible = !this.hidden;
    this.root.rotation.set(-0.04, Math.sin(t * 0.33) * 0.05, 0);
    let kick = 0;
    for (const l of this.lines) kick = Math.max(kick, l.update(t));
    for (const c of this.cards) c.update(t);
    this.kick = kick;
  }
}
