// 3D 挤压立体字幕：按「词」排版，按「字」在实测声轨卡点落入；关键句放大并产生镜头推力
import * as THREE from 'three';
import fontUrl from '../assets/serif.woff2';
import { LYRICS } from './generated';
import { clamp, eBack, eOut, hash, range } from './core';

export const FONT = 'MVSong';
export const FONT_STACK = `'${FONT}', 'Songti SC', 'Noto Serif CJK SC', 'Source Han Serif SC', 'SimSun', serif`;
export async function loadFont() {
  try {
    const ff = new FontFace(FONT, `url(${fontUrl})`);
    await ff.load();
    document.fonts.add(ff);
  } catch (e) {
    console.warn('字体载入失败，退回系统字体', e);
  }
}

export type Fx = 'slam' | 'drop' | 'rise' | 'flip' | 'zoom' | 'type' | 'shake';
export interface Spec {
  s: string;
  ax: number;
  ay: number;
  S: number;
  rot: number[];
  fx: Fx;
  pal?: string;
  al?: number;
}

// 9 句副歌精华 3D 字幕排版，避开上方七位 AI 娘与下方深海本鲸的构图重心
export const SPECS: Spec[] = [
  { s: '可/那些|*没有/**天赋|的/人呢', ax: 1.68, ay: -0.35, S: 0.38, rot: [0, -0.22, 0.02], fx: 'slam', pal: 'blue' },
  { s: '譬如/**我', ax: 1.48, ay: -0.22, S: 0.62, rot: [0, -0.2, -0.02], fx: 'zoom', pal: 'deep' },
  { s: '枕头下|*发霉/的/**梦|怎么做', ax: 1.55, ay: -0.1, S: 0.38, rot: [0.04, -0.2, 0], fx: 'drop', pal: 'blue', al: 1 },
  { s: '*热忱/与/*自卑|**对抗/着', ax: 0, ay: 0.85, S: 0.35, rot: [0.08, 0, 0], fx: 'shake', pal: 'warm' },
  { s: '**笑容|却已/不知/*下落', ax: 1.62, ay: 0.48, S: 0.38, rot: [0, -0.2, 0.02], fx: 'drop', pal: 'blue' },
  { s: '可如果|*等不到/一场|*世俗/的/**成功', ax: -1.7, ay: -0.15, S: 0.36, rot: [0, 0.22, -0.02], fx: 'rise', pal: 'gold', al: -1 },
  { s: '成不了|**万众瞩目|*那一个', ax: 0, ay: -0.95, S: 0.38, rot: [-0.08, 0, 0], fx: 'slam', pal: 'gold' },
  { s: '我/能不能/在|某个/**角落', ax: -1.65, ay: 0.45, S: 0.38, rot: [0, 0.22, 0.02], fx: 'type', pal: 'deep', al: -1 },
  { s: '*耗尽/天真/**开出|小小的/**花朵', ax: -1.52, ay: 0.52, S: 0.34, rot: [0, 0.18, 0.02], fx: 'rise', pal: 'warm', al: -1 },
];

const plain = (s: string) => s.replace(/[*/|]/g, '');
const SPEC_OF = new Map(SPECS.map((s) => [plain(s.s), s]));
const MULT = [1, 1.5, 2.25, 3.2];
const PAL: Record<string, number[]> = {
  blue: [0xffffff, 0xcfdfff, 0x13214f, 0xffffff, 0x7aa4ff, 0x1f389c],
  deep: [0xf6faff, 0xbdd8ff, 0x0d1b45, 0xeef5ff, 0x568eff, 0x15328f],
  warm: [0xffffff, 0xffe8da, 0x452236, 0xfff8ef, 0xffaa9f, 0x993b5c],
  gold: [0xfffcf2, 0xf2dfc0, 0x3b2a12, 0xfff5d6, 0xffbe4d, 0x7c4812],
};

interface Ch {
  c: string;
  word: number;
  key: number;
  row: number;
}
function parse(src: string) {
  const chars: Ch[] = [];
  const words: { key: number; from: number; to: number }[] = [];
  src.split('|').forEach((r, ri) =>
    r.split('/').forEach((wd) => {
      const s = wd.replace(/^\*+/, '');
      const key = Math.min(3, wd.length - s.length);
      const from = chars.length;
      for (const c of s) chars.push({ c, word: words.length, key, row: ri });
      words.push({ key, from, to: chars.length - 1 });
    }),
  );
  return { chars, words };
}

export function wordsOf(text: string) {
  const sp = SPEC_OF.get(text);
  const p = parse(sp ? sp.s : [...text].join('/'));
  return p.words.map((w) => ({
    text: p.chars
      .slice(w.from, w.to + 1)
      .map((c) => c.c)
      .join(''),
    key: w.key,
    from: w.from,
    to: w.to,
  }));
}

// 字形图集
const CELL = 160;
const FPX = 100;
const COLS = 16;
const QUAD = CELL / FPX;
let GTEX: THREE.CanvasTexture | null = null;
let GROWS = 1;
const GMAP = new Map<string, number>();

export function buildGlyphs(extra: string) {
  const set = new Set<string>();
  for (const l of LYRICS) for (const c of l.text) set.add(c);
  for (const c of extra) if (c.trim()) set.add(c);
  const chars = [...set];
  GROWS = Math.ceil(chars.length / COLS);
  const cv = document.createElement('canvas');
  cv.width = COLS * CELL;
  cv.height = GROWS * CELL;
  const g = cv.getContext('2d')!;
  g.fillStyle = '#000';
  g.fillRect(0, 0, cv.width, cv.height);
  g.font = `${FPX}px ${FONT_STACK}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineJoin = 'round';
  chars.forEach((c, i) => {
    const x = (i % COLS) * CELL + CELL / 2;
    const y = Math.floor(i / COLS) * CELL + CELL / 2 + 4;
    g.strokeStyle = '#00ff00';
    g.lineWidth = 9;
    g.strokeText(c, x, y);
    g.fillStyle = '#ff0000';
    g.fillText(c, x, y);
    GMAP.set(c, i);
  });
  GTEX = new THREE.CanvasTexture(cv);
  GTEX.colorSpace = THREE.NoColorSpace;
  GTEX.minFilter = THREE.LinearFilter;
  GTEX.magFilter = THREE.LinearFilter;
  GTEX.generateMipmaps = false;
}

function rectOf(c: string) {
  const i = GMAP.get(c) ?? 0;
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  return new THREE.Vector4(col / COLS, 1 - (row + 1) / GROWS, (col + 1) / COLS, 1 - row / GROWS);
}

const GV = `varying vec2 vLoc; void main(){ vLoc = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const GF = `uniform sampler2D map; uniform vec4 uRect; uniform vec2 uDir; uniform vec3 cTop; uniform vec3 cBot; uniform vec3 cSide; uniform float uOp; uniform float uFlash; uniform float uSeed; uniform float uGrit;
varying vec2 vLoc;
float hh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(hh(i), hh(i + vec2(1.0, 0.0)), f.x), mix(hh(i + vec2(0.0, 1.0)), hh(i + vec2(1.0, 1.0)), f.x), f.y); }
vec2 gl(vec2 l){ float inside = step(0.0, l.x) * step(l.x, 1.0) * step(0.0, l.y) * step(l.y, 1.0); return texture2D(map, mix(uRect.xy, uRect.zw, clamp(l, 0.0, 1.0))).rg * inside; }
void main(){
  vec2 g0 = gl(vLoc);
  float face = smoothstep(0.38, 0.62, g0.r);
  float side = 0.0; float depth = 1.0;
  for (int i = 0; i < 12; i++) { float k = 1.0 - float(i) / 12.0; float s = smoothstep(0.38, 0.62, gl(vLoc - uDir * k).r); side = max(side, s); depth = mix(depth, k, step(0.5, s)); }
  float n = vn(vLoc * 8.0 + uSeed) * 0.55 + vn(vLoc * 21.0 + uSeed * 2.3) * 0.45;
  float worn = smoothstep(0.66, 0.76, n) * uGrit;
  vec3 fc = mix(cBot, cTop, smoothstep(0.24, 0.78, vLoc.y));
  fc = mix(fc, cSide * 1.5, worn * 0.6);
  fc = mix(fc, vec3(1.0), clamp(uFlash, 0.0, 1.0) * 0.75);
  vec3 sc = cSide * (1.35 - 0.95 * depth);
  float body = max(face, side);
  float outl = smoothstep(0.3, 0.7, g0.g) * 0.85;
  vec3 col = mix(sc, fc, face);
  col = mix(cSide * 0.22, col, body);
  float a = max(body, outl);
  if (a < 0.02) discard;
  gl_FragColor = vec4(col, a * uOp);
}`;
const PLANE = new THREE.PlaneGeometry(1, 1);

interface G {
  m: THREE.Mesh;
  u: Record<string, THREE.IUniform>;
  x: number;
  y: number;
  t0: number;
  wt1: number;
  key: number;
  i: number;
  r: number;
  sz: number;
}

export class Block {
  grp = new THREE.Group();
  gs: G[] = [];
  start: number;
  exit: number;
  fx: Fx;
  rot: number[];

  constructor(spec: Spec, times: number[], exit: number, pal: string) {
    const P = PAL[pal] ?? PAL.blue;
    const { chars, words } = parse(spec.s);
    this.fx = spec.fx;
    this.rot = spec.rot;
    this.start = times[0];
    this.exit = exit;
    const rows: { x: number[]; sz: number[]; w: number; h: number }[] = [];
    let lastWord = -1;
    chars.forEach((ch) => {
      const sz = spec.S * MULT[ch.key];
      let row = rows[ch.row];
      if (!row) {
        row = rows[ch.row] = { x: [], sz: [], w: 0, h: 0 };
        lastWord = ch.word;
      }
      if (ch.word !== lastWord) {
        row.w += spec.S * 0.2;
        lastWord = ch.word;
      }
      row.x.push(row.w + sz * 0.5);
      row.sz.push(sz);
      row.w += sz * 0.98;
      row.h = Math.max(row.h, sz * 1.1);
    });
    const W0 = Math.max(...rows.map((r) => r.w));
    const H0 = rows.reduce((s, r) => s + r.h, 0);
    const k = Math.min(1, 6.8 / W0, 3.5 / H0);
    const W = W0 * k;
    const H = H0 * k;
    const ax = clamp(spec.ax, -3.55 + W / 2, 3.55 - W / 2);
    const ay = clamp(spec.ay, -1.9 + H / 2, 1.9 - H / 2);
    this.grp.position.set(ax, ay, 0);
    const al = spec.al ?? 0;
    const rowI: number[] = [];
    let top = H / 2;
    const rowTop: number[] = [];
    rows.forEach((r) => {
      rowTop.push(top);
      top -= r.h * k;
      rowI.push(0);
    });
    chars.forEach((ch, i) => {
      const row = rows[ch.row];
      const j = rowI[ch.row]++;
      const sz = row.sz[j] * k;
      const off = al < 0 ? -W / 2 : al > 0 ? W / 2 - row.w * k : -(row.w * k) / 2;
      const x = off + row.x[j] * k;
      const y = rowTop[ch.row] - row.h * k + sz * 0.56;
      let dx = -(ax + x);
      let dy = -(ay + y);
      const dl = Math.hypot(dx, dy);
      if (dl < 0.5) {
        dx += 0.3;
        dy -= 0.5;
      }
      const dn = Math.hypot(dx, dy) || 1;
      const L = (ch.key >= 2 ? 0.088 : 0.07) * clamp(dl / 2.2, 0.5, 1);
      const key = ch.key > 0;
      const rect = rectOf(ch.c);
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          map: { value: GTEX },
          uRect: { value: rect },
          uDir: { value: new THREE.Vector2((dx / dn) * L, (dy / dn) * L) },
          cTop: { value: new THREE.Color(P[key ? 3 : 0]) },
          cBot: { value: new THREE.Color(P[key ? 4 : 1]) },
          cSide: { value: new THREE.Color(P[key ? 5 : 2]) },
          uOp: { value: 0 },
          uFlash: { value: 0 },
          uSeed: { value: hash(i * 13 + times[0]) * 40 },
          uGrit: { value: ch.key >= 2 ? 1 : 0.55 },
        },
        vertexShader: GV,
        fragmentShader: GF,
        transparent: true,
        depthTest: false,
        depthWrite: false,
      });
      const m = new THREE.Mesh(PLANE, mat);
      m.renderOrder = 1000 + i;
      m.frustumCulled = false;
      this.grp.add(m);
      const t0 = times[Math.min(i, times.length - 1)];
      const wt1 = times[Math.min(words[ch.word].to, times.length - 1)];
      this.gs.push({ m, u: mat.uniforms, x, y, t0, wt1, key: ch.key, i, r: hash(i * 7 + times[0] * 3.1), sz });
    });
  }

  update(t: number): number {
    const vis = t >= this.start - 0.1 && t < this.exit;
    this.grp.visible = vis;
    if (!vis) return 0;
    this.grp.rotation.set(this.rot[0], this.rot[1] + Math.sin(t * 0.45) * 0.03, this.rot[2]);
    const e = range(t, this.exit - 0.16, this.exit);
    let kick = 0;
    for (const g of this.gs) {
      const a = t - g.t0;
      if (a < -0.03) {
        g.m.visible = false;
        continue;
      }
      g.m.visible = true;
      const u = Math.max(0, a);
      let x = g.x;
      let y = g.y;
      let z = 0;
      let rx = 0;
      let ry = 0;
      let rz = 0;
      let s = 1;
      let op = range(a, -0.03, 0.02);
      switch (this.fx) {
        case 'slam':
          s += 0.8 * Math.exp(-u * 15);
          rz = (g.r - 0.5) * 0.5 * Math.exp(-u * 9);
          break;
        case 'shake': {
          s += 0.9 * Math.exp(-u * 15);
          const am = 0.035 * g.sz;
          x += Math.sin(t * 47 + g.i * 7) * am;
          y += Math.cos(t * 41 + g.i * 5) * am;
          break;
        }
        case 'drop': {
          const k = 1 - eOut(u / 0.24);
          y += k * 2.6 * g.sz;
          rz = (g.r - 0.5) * 1.1 * k + (g.r - 0.5) * 0.08;
          break;
        }
        case 'rise': {
          const k = 1 - eOut(u / 0.26);
          y -= k * 1.3 * g.sz;
          rx = -k * 1.4;
          break;
        }
        case 'flip':
          ry = (1 - eBack(u / 0.3, 1.4)) * 1.7;
          break;
        case 'zoom':
          s *= 0.25 + 0.75 * eBack(u / 0.24, 2.2);
          break;
        case 'type':
          s += 0.3 * Math.exp(-u * 20);
          if (u < 0.16) op *= 0.55 + 0.45 * Math.sin(t * 90 + g.i) ** 2;
          break;
      }
      const wl = t >= g.wt1 ? Math.exp(-(t - g.wt1) * 6) : 0;
      if (g.key) {
        s *= 1 + wl * 0.12;
        if (t >= g.wt1 && t < g.wt1 + 0.2) kick = Math.max(kick, (1 - (t - g.wt1) / 0.2) * (g.key >= 2 ? 1 : 0.5));
        if (g.key >= 2) y += Math.sin(t * 1.3 + g.i) * 0.03 * g.sz;
      }
      if (e > 0) {
        op *= 1 - e;
        s *= 1 + e * 0.3;
        z += e * 0.8;
      }
      g.m.position.set(x, y, z);
      g.m.rotation.set(rx, ry, rz);
      g.m.scale.setScalar(g.sz * QUAD * s);
      g.u.uOp.value = op;
      g.u.uFlash.value = g.key ? Math.max(wl, Math.exp(-u * 12) * 0.5) : Math.exp(-u * 12) * 0.5;
    }
    return kick;
  }
}

export class Lyrics {
  root = new THREE.Group();
  lines: Block[] = [];
  cards: Block[] = [];
  kick = 0;
  hidden = false;
  constructor() {
    this.root.position.set(0, 0, -6);
    LYRICS.forEach((l, i) => {
      const spec = SPEC_OF.get(l.text) ?? {
        s: [...l.text].join('/'),
        ax: 0,
        ay: -1.3,
        S: 0.4,
        rot: [0, 0, 0],
        fx: 'rise' as Fx,
      };
      const next = LYRICS[i + 1];
      const last = l.t[l.t.length - 1];
      const exit = Math.max(last + 0.32, Math.min(l.end + 0.55, next ? next.t[0] - 0.05 : 28.0));
      const b = new Block(spec, l.t, exit, spec.pal ?? 'blue');
      this.lines.push(b);
      this.root.add(b.grp);
    });
  }
  card(spec: Spec, times: number[], exit: number) {
    const b = new Block(spec, times, exit, spec.pal ?? 'blue');
    this.cards.push(b);
    this.root.add(b.grp);
    return b;
  }
  update(t: number, fov: number) {
    const k = Math.tan((fov * Math.PI) / 360) / Math.tan((40 * Math.PI) / 360);
    this.root.scale.setScalar(k);
    this.root.visible = !this.hidden;
    let kick = 0;
    for (const l of this.lines) kick = Math.max(kick, l.update(t));
    for (const c of this.cards) kick = Math.max(kick, c.update(t) * 0.6);
    this.kick = kick;
  }
}
