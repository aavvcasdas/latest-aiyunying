// 软 3D 逐字逐词歌词卡：
//  字 —— 每个字是一块「软胶糖」：字形高度图 → 法线打光（鼓鼓的、带高光）+ 背后五层加深挤出厚度，在实测那一拍果冻弹出；
//  词 —— 同一个词的字共用一个摆动相位，词的最后一个字落地时整词一起回弹，关键词发光并给镜头一个轻推。
//  每句的入场方式按歌词意思设计（太阳下山→先沉后升；风啊轻轻吹→从左边被吹进来；得不到就放开→后半句飘走……）
import * as THREE from 'three';
import fontUrl from '../assets/font.otf';
import { LYRICS, type LyricLine } from './data';
import { BEAT } from './data';
import { clamp, eBack, eIO, eOut, glowTex, hash, jelly, lerp, range, smooth } from './core';

export const FONT = 'ZCOOLKL';
export const FONT_STACK = `'${FONT}', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif`;
export async function loadFont() {
  try { const ff = new FontFace(FONT, `url(${fontUrl})`); await ff.load(); document.fonts.add(ff); }
  catch (e) { console.warn('字体载入失败，退回系统字体', e); }
}

// 分词：「/」分词，「*」关键词（按意思挑）；style = 入场方式；mean = 这句话的意思（界面展示用）
interface LineDef { seg: string; style: string; mean: string }
export const LINE_DEF: Record<string, LineDef> = {
  '慌啥子嘛 慢慢来': { seg: '*慌啥子嘛/ /*慢慢来', style: 'calm', mean: '四川话「慌什么嘛」。不是不努力，是别被焦虑推着跑——脚步放慢，心才跟得上。' },
  '太阳下山有月亮爬上来': { seg: '*太阳/下山/有/*月亮/爬上来', style: 'sunset', mean: '一天落幕不等于黑到底：太阳下去，月亮就接班。失去一样东西，总有另一样光会升起来。' },
  '云会在 花会开': { seg: '*云/会在/ /*花/会开', style: 'bloom', mean: '云一直都在，花到了季节自然会开。好东西不会消失，只是有自己的时间。' },
  '好运总会为你而等待': { seg: '*好运/总会/为你/而/*等待', style: 'luck', mean: '运气不是追来的，是在路口等你的。你慢一点到，它也还在那里。' },
  '卸下一身的疲惫': { seg: '*卸下/一身的/*疲惫', style: 'unload', mean: '把扛了一整天的东西放下来——任务、期待、别人的眼光，一件一件卸掉。' },
  '今夜枕着星光再入睡': { seg: '今夜/枕着/*星光/再/*入睡', style: 'sleep', mean: '今晚什么都不想，把星光当枕头，安安稳稳睡一觉。' },
  '风啊轻轻吹': { seg: '*风/啊/*轻轻/吹', style: 'wind', mean: '风轻轻吹过来，像有人在旁边说：没事的。' },
  '这一刻就忘了你是谁': { seg: '这一刻/就/*忘了/你/*是谁', style: 'forget', mean: '暂时忘掉身份和标签——不是谁的员工、谁的期待，只是此刻在吹风的自己。' },
  '有时清醒有时醉': { seg: '有时/*清醒/有时/*醉', style: 'tipsy', mean: '人不必时时刻刻紧绷着清醒，偶尔糊涂一下、醉一回，也没关系。' },
  '别把所有压力自己背': { seg: '别把/所有/*压力/*自己背', style: 'stack', mean: '压力不用一个人扛，身边的人愿意帮你分一点。' },
  '人生路还远': { seg: '*人生路/*还远', style: 'road', mean: '路还长得很，不必在一个弯道上较劲，后面还有很多风景。' },
  '你不必事事都完美': { seg: '你/*不必/事事/都/*完美', style: 'imperfect', mean: '歪一点、慢一点、不完美一点，你依然值得被喜欢。' },
  '每个人都有自己的节拍': { seg: '*每个人/都有/自己的/*节拍', style: 'beat', mean: '有人快有人慢，各走各的拍子，不用跟着别人的节奏跑。' },
  '得不到 就放开': { seg: '*得不到/ /*就放开', style: 'release', mean: '抓不住的就松手，手空出来，才接得住新的东西。' },
  '一切都是最好的安排': { seg: '*一切/都是/*最好的/*安排', style: 'arrange', mean: '回头看，那些弯路和错过，都把你带到了现在这里。' },
};

interface Seg { c: string; word: number; key: boolean }
interface Parsed { segs: Seg[]; words: { key: boolean; from: number; to: number; gap: boolean }[] }
function parse(src: string): Parsed {
  const segs: Seg[] = []; const words: Parsed['words'] = []; let w = 0; let gap = false;
  for (const wd of src.split('/')) {
    if (wd === ' ') { gap = true; continue; }
    const key = wd.startsWith('*'); const s = key ? wd.slice(1) : wd; const from = segs.length;
    for (const c of s) segs.push({ c, word: w, key });
    words.push({ key, from, to: segs.length - 1, gap }); gap = false; w++;
  }
  return { segs, words };
}
export function segsOf(text: string): Parsed { const d = LINE_DEF[text]; return parse(d ? d.seg : [...text.replace(/ /g, '')].join('/')); }
export function wordsOf(text: string) { const p = segsOf(text); return p.words.map((w) => ({ text: p.segs.slice(w.from, w.to + 1).map((s) => s.c).join(''), key: w.key, gap: w.gap })); }

// 段落配色：[字身, 关键词, 填色, 描边/厚度]
const PAL: Record<string, [number, number, number, number]> = {
  chorus: [0xfff4e0, 0xffb347, 0xff8a5c, 0x7a3b2e],
  verse: [0xf3f0ff, 0x9fd8ff, 0x8aa8ff, 0x34306b],
  night: [0xeef2ff, 0xc4b5fd, 0xa78bfa, 0x2b2457],
  final: [0xfff7ea, 0xff8fb1, 0xffc35a, 0x6b2b4a],
};
function palOf(idx: number): [number, number, number, number] {
  if (idx < 4) return PAL.chorus; if (idx < 12) return idx === 5 || idx === 7 ? PAL.night : PAL.verse;
  if (idx < 20) return PAL.chorus; if (idx < 28) return idx === 21 || idx === 23 ? PAL.night : PAL.verse; return PAL.final;
}

// ---------- 字形图集：R = 字身，G = 描边（膨胀），B = 高度（模糊后的软鼓包） ----------
const CELL = 128, COLS = 16;
let GTEX: THREE.CanvasTexture | null = null; let GROWS = 1;
const GMAP = new Map<string, number>();
export function buildGlyphs(extra: string) {
  const set = new Set<string>();
  for (const l of LYRICS) for (const c of l.text) if (c.trim()) set.add(c);
  for (const c of extra) if (c.trim()) set.add(c);
  const chars = [...set]; GROWS = Math.ceil(chars.length / COLS);
  const W = COLS * CELL, H = GROWS * CELL;
  const mk = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d')!; g.fillStyle = '#000'; g.fillRect(0, 0, W, H); g.font = `92px ${FONT_STACK}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; return { c, g }; };
  const fill = mk(), stroke = mk(), height = mk();
  chars.forEach((c, i) => {
    const x = (i % COLS) * CELL + CELL / 2, y = Math.floor(i / COLS) * CELL + CELL / 2 + 5;
    fill.g.fillStyle = '#fff'; fill.g.fillText(c, x, y);
    stroke.g.strokeStyle = '#fff'; stroke.g.lineWidth = 20; stroke.g.strokeText(c, x, y); stroke.g.fillStyle = '#fff'; stroke.g.fillText(c, x, y);
    GMAP.set(c, i);
  });
  // 高度图：描边形状模糊两遍 → 中间鼓、边缘软
  height.g.filter = 'blur(5px)'; height.g.drawImage(stroke.c, 0, 0); height.g.filter = 'blur(3px)'; height.g.globalCompositeOperation = 'lighter'; height.g.globalAlpha = 0.6; height.g.drawImage(fill.c, 0, 0);
  const out = document.createElement('canvas'); out.width = W; out.height = H; const og = out.getContext('2d')!;
  const a = fill.g.getImageData(0, 0, W, H).data, b = stroke.g.getImageData(0, 0, W, H).data, h = height.g.getImageData(0, 0, W, H).data;
  const img = og.createImageData(W, H); const d = img.data;
  for (let i = 0; i < d.length; i += 4) { d[i] = a[i]; d[i + 1] = b[i]; d[i + 2] = Math.min(255, h[i]); d[i + 3] = 255; }
  og.putImageData(img, 0, 0);
  GTEX = new THREE.CanvasTexture(out); GTEX.colorSpace = THREE.NoColorSpace; GTEX.anisotropy = 8;
  GTEX.minFilter = THREE.LinearMipmapLinearFilter; GTEX.generateMipmaps = true;
}
function rectOf(c: string) {
  const i = GMAP.get(c) ?? 0; const col = i % COLS, row = Math.floor(i / COLS);
  return new THREE.Vector4(col / COLS, 1 - (row + 1) / GROWS, (col + 1) / COLS, 1 - row / GROWS);
}
const GV = `uniform vec4 uRect; varying vec2 vUv; varying vec2 vLoc;
void main(){ vLoc = uv; vUv = vec2(mix(uRect.x, uRect.z, uv.x), mix(uRect.y, uRect.w, uv.y)); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const GF = `uniform sampler2D map; uniform vec3 cBase; uniform vec3 cHi; uniform vec3 cStroke; uniform float uFill; uniform float uOp; uniform float uDepth; uniform float uGlow; uniform vec2 uTexel; uniform float uLight;
varying vec2 vUv; varying vec2 vLoc;
void main(){ vec4 t = texture2D(map, vUv); float a = max(t.r, t.g);
  if (uDepth > 0.5) { if (t.g < 0.45) discard; gl_FragColor = vec4(cStroke * (0.55 + 0.25 * t.b), uOp); return; }
  if (a < 0.04) discard;
  float hx = texture2D(map, vUv + vec2(uTexel.x * 2.0, 0.0)).b - texture2D(map, vUv - vec2(uTexel.x * 2.0, 0.0)).b;
  float hy = texture2D(map, vUv + vec2(0.0, uTexel.y * 2.0)).b - texture2D(map, vUv - vec2(0.0, uTexel.y * 2.0)).b;
  vec3 n = normalize(vec3(-hx * 3.2, -hy * 3.2, 0.32));
  vec3 L = normalize(vec3(-0.5 + uLight, 0.62, 0.62));
  float dif = clamp(dot(n, L), 0.0, 1.0);
  float spec = pow(clamp(dot(reflect(-L, n), vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 22.0);
  float w = smoothstep(uFill - 0.09, uFill + 0.09, vLoc.x);
  vec3 body = mix(cHi, cBase, w);
  vec3 col = mix(cStroke * 1.25 + 0.08, body, smoothstep(0.3, 0.7, t.r));
  col = col * (0.5 + 0.62 * dif) + spec * 0.6;
  col *= 0.78 + 0.22 * smoothstep(0.05, 0.55, t.b);
  col *= 1.0 + uGlow * 0.45;
  gl_FragColor = vec4(col, a * uOp); }`;
const PLANE = new THREE.PlaneGeometry(1, 1);
function gmat(rect: THREE.Vector4, base: number, hi: number, stroke: number, depth: boolean) {
  return new THREE.ShaderMaterial({
    uniforms: {
      map: { value: GTEX }, uRect: { value: rect }, cBase: { value: new THREE.Color(base) }, cHi: { value: new THREE.Color(hi) }, cStroke: { value: new THREE.Color(stroke) },
      uFill: { value: 0 }, uOp: { value: 0 }, uDepth: { value: depth ? 1 : 0 }, uGlow: { value: 0 }, uTexel: { value: new THREE.Vector2(1 / (COLS * CELL), 1 / (GROWS * CELL)) }, uLight: { value: 0 },
    },
    vertexShader: GV, fragmentShader: GF, transparent: true, depthTest: false, depthWrite: false,
  });
}

interface Gl {
  c: string; i: number; key: boolean; word: number; x: number; y: number; t0: number; t1: number; wt1: number; r: number; size: number;
  g: THREE.Group; m: THREE.ShaderMaterial; dm: THREE.ShaderMaterial; glow: THREE.Sprite | null;
}
export interface LineOpts { style?: string; size?: number; x?: number; y?: number; pal?: [number, number, number, number] }

export interface Ev { x: number; y: number; a: number; col: number }
export class Line3D {
  grp = new THREE.Group(); gl: Gl[] = []; style: string; start: number; end: number; idx: number; nWords: number;
  /** 本帧的「词落定」事件：关键词最后一个字落地时冒火花 */
  ev: Ev[] = []; keyCol = 0xffd166;
  constructor(line: LyricLine, idx: number, o: LineOpts = {}) {
    const def = LINE_DEF[line.text];
    this.style = o.style ?? def?.style ?? 'calm'; this.idx = idx;
    const S = o.size ?? 0.58;
    const [base, keyC, hi, stroke] = o.pal ?? palOf(idx); this.keyCol = keyC;
    this.start = line.t[0]; this.end = line.end;
    const p = segsOf(line.text); this.nWords = p.words.length;
    const xs: number[] = []; let x = 0; let lastWord = -1;
    p.segs.forEach((s, i) => {
      const sz = s.key ? 1.12 : 0.94;
      if (i > 0) { x += S * 0.98 * ((sz + (p.segs[i - 1].key ? 1.12 : 0.94)) / 2); if (s.word !== lastWord) x += S * (p.words[s.word].gap ? 0.55 : 0.2); }
      lastWord = s.word; xs.push(x);
    });
    const width = xs[xs.length - 1]; const baseY = o.y ?? -1.38;
    const n = p.segs.length;
    p.segs.forEach((s, i) => {
      const t0 = line.t[i] ?? line.t[line.t.length - 1];
      const t1 = Math.max(t0 + 0.1, i < n - 1 ? line.t[i + 1] : Math.min(line.end, t0 + 1.2));
      const wd = p.words[s.word]; const wt1 = line.t[wd.to] ?? t0;
      const rect = rectOf(s.c); const size = S * (s.key ? 1.12 : 0.94);
      const m = gmat(rect, base, s.key ? keyC : hi, stroke, false);
      const dm = gmat(rect, 0, 0, stroke, true);
      const g = new THREE.Group();
      for (let k = 5; k >= 1; k--) { const d = new THREE.Mesh(PLANE, dm); d.position.set(0.01 * k, -0.014 * k, -0.03 * k); d.renderOrder = 1000 + (6 - k); g.add(d); }
      const f = new THREE.Mesh(PLANE, m); f.renderOrder = 1010; g.add(f);
      let glow: THREE.Sprite | null = null;
      if (s.key) {
        glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: keyC, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false }));
        glow.scale.setScalar(2.4); glow.renderOrder = 998; g.add(glow);
      }
      this.grp.add(g);
      this.gl.push({ c: s.c, i, key: s.key, word: s.word, x: xs[i] - width / 2 + (o.x ?? 0), y: baseY, t0, t1, wt1, r: hash(idx * 31 + i * 7 + 3), size, g, m, dm, glow });
    });
  }
  /** 返回关键词落点的「推力」0..1 */
  update(t: number): number {
    const vis = t > this.start - 0.7 && t < this.end + 1.0;
    this.grp.visible = vis; if (!vis) return 0;
    let kick = 0; const st = this.style; const n = this.gl.length; this.ev.length = 0;
    const outP = range(t, this.end, this.end + 0.75);
    this.grp.rotation.set(0, Math.sin(t * 0.35 + this.idx) * 0.1, 0);
    for (const G of this.gl) {
      const lt = t - G.t0; const shown = lt > -0.0; const rel = G.i / Math.max(1, n - 1);
      let x = G.x, y = G.y, z = 0, rz = 0, ry = 0, sx = 1, sy = 1, op = shown ? 1 : 0;
      const pop = jelly(lt * 1.05, 7.5);
      // 字：果冻弹入 —— 压扁再拉长
      const sq = shown ? Math.exp(-lt * 6) * Math.sin(lt * 22) * 0.28 : 0;
      sx = 1 + sq; sy = 1 - sq;
      // 词：最后一个字落地时整词回弹
      const wl = t - G.wt1;
      if (wl > 0 && wl < 0.6) { const b = Math.sin((wl / 0.6) * Math.PI) * Math.exp(-wl * 3); y += b * 0.14; sx *= 1 + b * 0.12; sy *= 1 + b * 0.12; }
      if (G.key && wl > 0 && wl < 0.15) kick = Math.max(kick, 1 - wl / 0.15);
      if (G.key && wl > 0 && wl < 0.62) this.ev.push({ x: G.g.position.x, y: G.g.position.y, a: wl, col: this.keyCol });
      const ph = G.word * 1.7;
      const breath = Math.sin(t * 2.2 + ph) * 0.025;
      y += breath;
      switch (st) {
        case 'calm': { y += (1 - eOut(lt / 0.5)) * 0.6; op *= range(lt, 0, 0.2); rz = Math.sin(t * 1.1 + ph) * 0.04; break; }
        case 'sunset': { const sink = G.i < 4; y += sink ? (1 - eOut(lt / 0.55)) * 0.9 : -(1 - eBack(lt / 0.6)) * 0.9; op *= range(lt, 0, 0.18); y += sink ? -range(t, this.gl[4]?.t0 ?? this.end, this.end) * 0.12 : Math.sin(t * 2 + G.i) * 0.03; break; }
        case 'bloom': { const s = G.word < 2 ? eOut(lt / 0.6) : eBack(lt / 0.42, 2.6); sx *= s; sy *= s; rz = G.word < 2 ? Math.sin(t * 0.9 + G.i) * 0.06 : (1 - eOut(lt / 0.5)) * 1.6; y += G.word < 2 ? Math.sin(t * 1.3 + G.i) * 0.05 : 0; op *= range(lt, 0, 0.12); break; }
        case 'luck': { y += (1 - pop) * 1.1; rz = (1 - eOut(lt / 0.5)) * (G.r - 0.5) * 2; const w = G.word === 4 ? Math.sin(t * Math.PI * 2 / BEAT) * 0.05 : 0; sx *= 1 + w; sy *= 1 + w; break; }
        case 'unload': { const f = clamp(lt / 0.28); y += (1 - f * f) * 2.2; if (lt > 0.28) { const b = Math.exp(-(lt - 0.28) * 9) * 0.35; sx *= 1 + b; sy *= 1 - b; } rz = (G.r - 0.5) * 0.12; break; }
        case 'sleep': { op *= range(lt, 0, 0.5); y += (1 - eOut(lt / 0.9)) * 0.4 + Math.sin(t * 1.4 + G.i * 0.6) * 0.06; rz = Math.sin(t * 0.8 + G.i * 0.5) * 0.12; break; }
        case 'wind': { x += -(1 - eOut(lt / 0.7)) * 3.5; y += Math.sin(t * 3 + G.i * 0.9) * 0.08; rz = Math.sin(t * 2.6 + G.i) * 0.14 + (1 - eOut(lt / 0.7)) * 0.8; op *= range(lt, 0, 0.2); break; }
        case 'forget': { y += (1 - pop) * 0.5; const fade = range(t, this.end - 0.8 + rel * 0.4, this.end + 0.2 + rel * 0.4); op *= 1 - fade * 0.85; y += fade * 0.5; sx *= 1 + fade * 0.3; sy *= 1 + fade * 0.3; break; }
        case 'tipsy': { y += (1 - pop) * 0.6; if (G.word >= 2) { rz = Math.sin(t * 2.4 + G.i) * 0.22 * range(lt, 0, 0.4); x += Math.sin(t * 1.7 + G.i) * 0.06; y += Math.sin(t * 2.1 + G.i * 1.3) * 0.07; } break; }
        case 'stack': { y += (1 - pop) * -1.2 + (1 - pop) * 0; const wob = Math.sin(t * 5 + G.i) * 0.05 * (1 - range(t, this.end - 0.6, this.end)); rz = wob; break; }
        case 'road': { z = -(1 - eOut(lt / 0.8)) * 6; y += (1 - eOut(lt / 0.8)) * 0.8; op *= range(lt, 0, 0.25); break; }
        case 'imperfect': { y += (1 - pop) * 0.7 + (G.r - 0.5) * 0.12; rz = (G.r - 0.5) * 0.35 * range(lt, 0, 0.3); sx *= 0.9 + G.r * 0.22; sy *= 0.9 + G.r * 0.22; break; }
        case 'beat': { const sub = [1, 2, 0.5, 1.5, 3, 1, 2, 0.5, 1, 2][G.i % 10]; const hb = Math.abs(Math.sin(((t * sub) / BEAT) * Math.PI)); y += (1 - pop) * 0.8 + hb * 0.13 * range(lt, 0, 0.3); sy *= 1 - hb * 0.03; break; }
        case 'release': { y += (1 - pop) * 0.6; if (G.word === 0) { const sh = Math.sin(t * 40) * 0.015 * range(lt, 0, 0.2); x += sh; } else { const up = range(t, G.t0 + 0.3, this.end + 0.9); y += eIO(up) * 1.6; rz = Math.sin(t * 2 + G.i) * 0.15 * up; x += Math.sin(t * 1.3 + G.i) * 0.2 * up; } break; }
        case 'arrange': { const k = eOut(lt / 0.65); x = lerp(G.x + (G.r - 0.5) * 6, G.x, k); y = lerp(G.y + (hash(G.r * 9) - 0.2) * 3, G.y, k) + breath; rz = (1 - k) * (G.r - 0.5) * 4; op *= range(lt, 0, 0.15); break; }
        default: y += (1 - pop) * 0.6;
      }
      // 出场：软软地化开、往上飘
      if (outP > 0 && st !== 'release') { op *= 1 - smooth(outP); y += outP * 0.35; sx *= 1 - outP * 0.3; sy *= 1 + outP * 0.15; }
      if (st === 'release' && outP > 0) op *= 1 - smooth(outP);
      G.g.position.set(x, y, z); G.g.rotation.set(0, ry, rz);
      G.g.scale.set(G.size * Math.max(0.01, sx), G.size * Math.max(0.01, sy), G.size);
      const fill = range(t, G.t0, G.t1);
      G.m.uniforms.uFill.value = fill * 1.2 - 0.1; G.m.uniforms.uOp.value = clamp(op); G.dm.uniforms.uOp.value = clamp(op);
      G.m.uniforms.uLight.value = Math.sin(t * 0.6) * 0.25;
      const gk = G.key ? Math.exp(-Math.max(0, wl) * 2.5) * (wl > 0 ? 1 : 0) : 0;
      G.m.uniforms.uGlow.value = gk * 0.8;
      if (G.glow) (G.glow.material as THREE.SpriteMaterial).opacity = (0.05 + gk * 0.4) * clamp(op);
    }
    return kick;
  }
}

/** 片名 / 字幕卡（不在歌词表里的字） */
export class Card {
  line: Line3D;
  constructor(text: string, t0: number, step: number, end: number, o: LineOpts = {}) {
    const chars = [...text.replace(/ /g, '')];
    const fake: LyricLine = { text, t: chars.map((_, i) => t0 + i * step), end };
    this.line = new Line3D(fake, 100, { style: o.style ?? 'calm', ...o });
  }
}

export class Lyrics {
  root = new THREE.Group(); lines: Line3D[] = []; extra: Line3D[] = []; kick = 0; hidden = false;
  sparks: THREE.Sprite[] = []; private si = 0;
  constructor() {
    this.root.position.set(0, 0, -6);
    LYRICS.forEach((l, i) => { const L = new Line3D(l, i); this.lines.push(L); this.root.add(L.grp); });
    for (let i = 0; i < 56; i++) { const S = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false }));
      S.renderOrder = 1200; this.sparks.push(S); this.root.add(S); }
  }
  /** 关键词落定 → 从字上炸出一圈小火花（跟着字卡在拍上） */
  private emit(L: Line3D) {
    for (const e of L.ev) { const n = 7;
      for (let j = 0; j < n; j++) { const S = this.sparks[this.si++ % this.sparks.length];
        const a = (j / n) * 6.283 + e.a * 3.1, sp = 0.35 + e.a * 1.9;
        S.position.set(e.x + Math.cos(a) * sp, e.y + Math.sin(a) * sp * 0.75 - e.a * e.a * 1.1, 0.2);
        S.scale.setScalar(Math.max(0.001, 0.34 * Math.exp(-e.a * 3)));
        const m = S.material as THREE.SpriteMaterial; m.color.setHex(e.col); m.opacity = Math.exp(-e.a * 4.2) * 0.95; } }
  }
  card(text: string, t0: number, step: number, end: number, o: LineOpts = {}) { const c = new Card(text, t0, step, end, o); this.extra.push(c.line); this.root.add(c.line.grp); }
  update(t: number, fov: number) {
    const sc = Math.tan((fov * Math.PI) / 360) / Math.tan((40 * Math.PI) / 360);
    this.root.scale.setScalar(sc); this.root.visible = !this.hidden;
    let k = 0; this.si = 0;
    for (const L of this.lines) { k = Math.max(k, L.update(t)); this.emit(L); }
    for (const L of this.extra) { k = Math.max(k, L.update(t)); this.emit(L); }
    for (let i = this.si; i < this.sparks.length; i++) (this.sparks[i].material as THREE.SpriteMaterial).opacity = 0;
    this.kick = k;
  }
}
