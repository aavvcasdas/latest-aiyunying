// 画面工具箱：图集像素角色（纸片人）+ 低多边形纸艺布景 + 粒子。全部是「给定时间 → 画出这一帧」的纯函数，没有累积状态。
import atlasUrl from '../assets/atlas.png';
import atlasJson from '../assets/atlas.json';
import actionsJson from '../assets/actions.json';

export const W = 1280;
export const H = 720;
export type CharId = 'whale' | 'gpt' | 'claude' | 'doubao' | 'gemini' | 'kimi' | 'qwen' | 'zai';

export interface Frame {
  c: CanvasRenderingContext2D;
  t: number; // 歌曲秒
  b: number; // 拍号（浮点）
  u: number; // 镜头进度 0..1
  st: number; // 镜头内秒数
  bp: number; // 拍内相位 0..1
  pulse: number; // 每拍冲击 1→0
  dur: number; // 镜头总秒数
  cam: { x: number; y: number; z: number };
}

type Rect = [number, number, number, number];
const RECTS = (atlasJson as unknown as { s: Record<string, Rect> }).s;
interface ActionMeta { fps: number; loop: boolean; frames: string[]; fx: string | null }
const ACT = actionsJson as unknown as { actions: Record<string, Record<string, ActionMeta>>; fx: Record<string, string[]> };
export const ACTIONS = ACT.actions;
const FXS = ACT.fx;
const WALK: Record<CharId, [string, number]> = {
  whale: ['walk_whale_', 8], claude: ['walk_claude_', 8], kimi: ['walk_kimi_', 8], gemini: ['walk_gemini_', 8],
  qwen: ['walk_qwen_', 8], zai: ['walk_zai_', 8], doubao: ['walk_doubao_big_', 8], gpt: ['gpt_fly_', 2],
};
const FRONT: Record<CharId, string> = {
  whale: 'whale_idle', claude: 'claude_front_0', kimi: 'kimi_front_0', gemini: 'gemini_front_0',
  qwen: 'qwen_front_0', zai: 'zai_front_0', doubao: 'doubao_cage_0', gpt: 'gpt_boss_idle',
};

let atlas: HTMLImageElement | null = null;
const anchors: Record<string, { cx: number; top: number; hw: number }> = {};
export function loadAtlas(): Promise<void> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      atlas = img;
      const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
      const g = cv.getContext('2d', { willReadFrequently: true })!; g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, img.width, img.height).data;
      for (const [k, [x0, y0, w, h]] of Object.entries(RECTS)) {
        let top = -1, mn = w, mx = 0;
        for (let y = 0; y < h && (top < 0 || y < top + h * 0.3); y++) for (let x = 0; x < w; x++) {
          if (d[((y0 + y) * img.width + x0 + x) * 4 + 3] > 128) { if (top < 0) top = y; if (x < mn) mn = x; if (x > mx) mx = x; }
        }
        anchors[k] = { cx: (mn + mx) / 2, top: Math.max(0, top), hw: Math.max(8, mx - mn) };
      }
      res();
    };
    img.onerror = () => rej(new Error('角色图集加载失败'));
    img.src = atlasUrl;
  });
}

export const hash = (n: number) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const ease = (t: number) => { t = clamp(t); return t * t * (3 - 2 * t); };
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
const mod = (a: number, n: number) => ((a % n) + n) % n;

// ---------------- 角色 ----------------
export interface ActorOpts { flip?: boolean; alpha?: number; t0?: number; hat?: 'santa'; bob?: number; shadow?: boolean; sil?: string; noFx?: boolean }
const unit = (n: string) => (n.startsWith('act_gpt_') && !n.startsWith('act_gpt_hover') ? 0.58 : n.startsWith('gpt_boss') ? 0.58 : 1);

/** 画一格图集精灵：x 是脚底中心，y 是脚底。返回头顶坐标，方便挂道具 */
export function sprite(f: Frame, name: string, x: number, y: number, s: number, o: ActorOpts = {}) {
  const r = RECTS[name];
  if (!r || !atlas) throw new Error('图集里没有 ' + name);
  const c = f.c; const sc = s * unit(name);
  const w = r[2] * sc, h = r[3] * sc;
  c.save();
  if (o.alpha !== undefined) c.globalAlpha *= o.alpha;
  if (o.shadow !== false) {
    c.fillStyle = 'rgba(20,10,40,0.28)'; c.beginPath(); c.ellipse(x, y - 2, w * 0.36, Math.max(4, h * 0.05), 0, 0, 7); c.fill();
  }
  c.imageSmoothingEnabled = false;
  c.translate(x, y + (o.bob ?? 0));
  if (o.flip) c.scale(-1, 1);
  if (o.sil) {
    const t = document.createElement('canvas'); t.width = r[2]; t.height = r[3];
    const g = t.getContext('2d')!; g.drawImage(atlas, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]);
    g.globalCompositeOperation = 'source-in'; g.fillStyle = o.sil; g.fillRect(0, 0, r[2], r[3]);
    c.drawImage(t, -w / 2, -h, w, h);
  } else c.drawImage(atlas, r[0], r[1], r[2], r[3], -w / 2, -h, w, h);
  c.restore();
  const a = anchors[name];
  const fl = o.flip ? -1 : 1;
  const head = { x: x + fl * ((a?.cx ?? r[2] / 2) - r[2] / 2) * sc, y: y + (o.bob ?? 0) - h + (a?.top ?? 0) * sc, hw: (a?.hw ?? 30) * sc };
  if (o.hat === 'santa') santaHat(c, head.x, head.y, head.hw);
  return head;
}

function santaHat(c: CanvasRenderingContext2D, x: number, y: number, hw: number) {
  const w = hw * 0.8;
  c.save();
  c.fillStyle = '#e63946'; c.beginPath(); c.moveTo(x - w * 0.55, y + 6); c.lineTo(x + w * 0.1, y - w * 0.9); c.lineTo(x + w * 0.62, y + 6); c.closePath(); c.fill();
  c.fillStyle = '#fff'; c.fillRect(x - w * 0.62, y + 1, w * 1.3, w * 0.2);
  c.beginPath(); c.arc(x + w * 0.1, y - w * 0.9, w * 0.14, 0, 7); c.fill();
  c.restore();
}

/** 动作格：action 是 cast_actions 里的动作名；'walk' 走路；'front' 正面站 */
export function actor(f: Frame, id: CharId, action: string, x: number, y: number, s = 2.6, o: ActorOpts = {}) {
  // 循环动作按歌曲时间走；不循环的动作（点头、鞠躬、挑选…）从镜头起点（加 t0）开始播一遍然后定格
  const loopT = Math.max(0, f.t - (o.t0 ?? 0)); const onceT = Math.max(0, f.st - (o.t0 ?? 0));
  let t = loopT;
  let name: string; let fx: string | null = null;
  if (action === 'walk') {
    const [p, n] = WALK[id]; name = p + (Math.floor(t * (id === 'gpt' ? 6 : 9)) % n);
  } else if (action === 'front') name = FRONT[id];
  else {
    const m = ACTIONS[id]?.[action];
    if (!m) throw new Error(`${id} 没有动作 ${action}`);
    if (!m.loop) t = onceT;
    const i = Math.floor(t * m.fps + 1e-6);
    name = m.frames[m.loop ? i % m.frames.length : Math.min(m.frames.length - 1, i)]; fx = m.fx;
  }
  const head = sprite(f, name, x, y, s, o);
  if (fx && !o.noFx && FXS[fx]) {
    const fr = FXS[fx]; const k = fr[Math.floor(t * 6) % fr.length];
    sprite(f, k, head.x + head.hw * 0.55, head.y + 4 + Math.sin(t * 5) * 3, s * 1.5, { shadow: false, alpha: o.alpha });
  }
  return head;
}

/** 表情贴 / 道具格（图集里的小图） */
export function sticker(f: Frame, name: string, x: number, y: number, s = 3, o: ActorOpts = {}) {
  return sprite(f, name, x, y, s, { shadow: false, ...o });
}
export const fxFrame = (name: string, t: number) => { const fr = FXS[name]; return fr[Math.floor(t * 6) % fr.length]; };

// ---------------- 布景 ----------------
interface Pal { sky: [string, string]; far: string; mid: string; ground: string; g2: string; tree: string; trunk: string; orb?: { k: 'sun' | 'moon'; x: number; y: number; r: number; c: string }; stars?: boolean }
export const PAL: Record<string, Pal> = {
  day: { sky: ['#6ec1ff', '#e3f6ff'], far: '#a9dcb4', mid: '#78c987', ground: '#62bd6c', g2: '#58b263', tree: '#3d9a55', trunk: '#7a5232', orb: { k: 'sun', x: 980, y: 120, r: 56, c: '#fff3b0' } },
  dawn: { sky: ['#8fb5ff', '#ffd9b0'], far: '#b8c9d8', mid: '#8fbf9a', ground: '#6fb27d', g2: '#66a874', tree: '#478f60', trunk: '#6d4a35', orb: { k: 'sun', x: 640, y: 440, r: 70, c: '#ffe08a' } },
  dusk: { sky: ['#4a3f9a', '#f7a98b'], far: '#7d6fb0', mid: '#5b6fb0', ground: '#4f6fa8', g2: '#47649c', tree: '#33507f', trunk: '#3b3156', orb: { k: 'sun', x: 300, y: 400, r: 66, c: '#ffd29a' } },
  sunset: { sky: ['#ff8a6b', '#ffe3a1'], far: '#d98fa3', mid: '#c06a8e', ground: '#a85c86', g2: '#9d5280', tree: '#7b3d6e', trunk: '#4b2a3f', orb: { k: 'sun', x: 760, y: 410, r: 90, c: '#fff1b5' } },
  night: { sky: ['#0f1240', '#3a3f8f'], far: '#2b3070', mid: '#232a66', ground: '#1f2a5e', g2: '#1a2452', tree: '#17204a', trunk: '#10163a', stars: true, orb: { k: 'moon', x: 1000, y: 130, r: 52, c: '#fff6d0' } },
  snow: { sky: ['#a9c7ee', '#f2f7ff'], far: '#dbe7f7', mid: '#cfdff2', ground: '#f5f9ff', g2: '#e4eefb', tree: '#3f7a66', trunk: '#5d4a3a' },
  spring: { sky: ['#8ed1ff', '#ffe9f2'], far: '#c8e8c0', mid: '#a6dba0', ground: '#8ed38a', g2: '#84c880', tree: '#f4a3c4', trunk: '#7a5a46', orb: { k: 'sun', x: 220, y: 110, r: 50, c: '#fff6c8' } },
  autumn: { sky: ['#ffbf8a', '#fff0cf'], far: '#e6b27c', mid: '#d98f4e', ground: '#c9803f', g2: '#bd7538', tree: '#e8742e', trunk: '#5b3a22', orb: { k: 'sun', x: 900, y: 130, r: 52, c: '#fff1c4' } },
  sea: { sky: ['#66c3f5', '#fff2d6'], far: '#7ab8e8', mid: '#3d9ad6', ground: '#2f86c8', g2: '#3a93d2', tree: '#2a7a5a', trunk: '#6a4a30', orb: { k: 'sun', x: 880, y: 250, r: 64, c: '#fff3b0' } },
  gray: { sky: ['#9aa0ad', '#d9dce3'], far: '#b5b9c4', mid: '#a2a6b2', ground: '#8f93a1', g2: '#868a98', tree: '#6f7484', trunk: '#555a69' },
  mount: { sky: ['#5fa8ee', '#dff2ff'], far: '#c5d6ee', mid: '#8fa9d0', ground: '#6e8cb8', g2: '#6684b0', tree: '#3a6a68', trunk: '#4a4a5a', orb: { k: 'sun', x: 200, y: 140, r: 48, c: '#fff6c8' } },
  desert: { sky: ['#ffb36b', '#ffe9b8'], far: '#f0c58a', mid: '#e5a95f', ground: '#dca155', g2: '#d19649', tree: '#7a9a4a', trunk: '#6a4a2a', orb: { k: 'sun', x: 1000, y: 150, r: 60, c: '#fffbd0' } },
};

export const GY = 520;

function ridge(f: Frame, color: string, base: number, amp: number, d: number, seed: number, step: number, peak = false) {
  const c = f.c; const off = f.cam.x * d;
  c.fillStyle = color; c.beginPath(); c.moveTo(-300, 900);
  const i0 = Math.floor((off - 300) / step);
  for (let i = i0; i * step - off < W + 300; i++) {
    const hh = peak ? Math.pow(hash(i * 3.1 + seed), 1.3) : 0.25 + 0.75 * hash(i * 3.1 + seed);
    c.lineTo(i * step - off, base - amp * hh - f.cam.y * d * 0.4);
  }
  c.lineTo(W + 300, 900); c.closePath(); c.fill();
}

export function shade(hex: string, d: number) {
  const n = parseInt(hex.slice(1), 16); const cl = (v: number) => Math.max(0, Math.min(255, v));
  const r = cl((n >> 16) + d), g = cl(((n >> 8) & 255) + d), b = cl((n & 255) + d);
  return `rgb(${r},${g},${b})`;
}
export function poly(c: CanvasRenderingContext2D, x: number, y: number, r: number, n: number, rot = 0) {
  c.beginPath(); for (let i = 0; i < n; i++) { const a = rot + (i / n) * Math.PI * 2; i ? c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r) : c.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } c.closePath(); c.fill();
}
export function pine(c: CanvasRenderingContext2D, x: number, y: number, s: number, col: string, trunk: string) {
  c.fillStyle = trunk; c.fillRect(x - 5 * s, y - 14 * s, 10 * s, 16 * s);
  for (let k = 0; k < 3; k++) {
    c.fillStyle = k % 2 ? shade(col, 14) : col;
    c.beginPath(); c.moveTo(x, y - (86 - k * 6) * s); c.lineTo(x + (34 - k * 4) * s, y - (20 + k * 22) * s); c.lineTo(x - (34 - k * 4) * s, y - (20 + k * 22) * s); c.closePath(); c.fill();
  }
}
export function roundTree(c: CanvasRenderingContext2D, x: number, y: number, s: number, col: string, trunk: string) {
  c.fillStyle = trunk; c.fillRect(x - 6 * s, y - 40 * s, 12 * s, 42 * s);
  c.fillStyle = col; poly(c, x, y - 70 * s, 38 * s, 6, 0.3);
  c.fillStyle = shade(col, 18); poly(c, x - 12 * s, y - 78 * s, 20 * s, 6, 1);
}
export function house(c: CanvasRenderingContext2D, x: number, y: number, s: number, col: string) {
  c.fillStyle = col; c.fillRect(x - 28 * s, y - 40 * s, 56 * s, 40 * s);
  c.fillStyle = shade(col, -40); c.beginPath(); c.moveTo(x - 36 * s, y - 40 * s); c.lineTo(x, y - 76 * s); c.lineTo(x + 36 * s, y - 40 * s); c.closePath(); c.fill();
  c.fillStyle = '#fff6c9'; c.fillRect(x - 16 * s, y - 28 * s, 12 * s, 12 * s); c.fillStyle = '#7a4b2a'; c.fillRect(x + 6 * s, y - 24 * s, 12 * s, 24 * s);
}

export function sky(f: Frame, a: string, b: string, h = GY) {
  const c = f.c; const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, a); g.addColorStop(1, b);
  c.fillStyle = g; c.fillRect(-500, -400, W + 1000, h + 400);
}
export function starsLayer(f: Frame, n = 90, alpha = 1) {
  const c = f.c;
  for (let i = 0; i < n; i++) {
    const x = hash(i) * W, y = hash(i + 50) * 420, tw = 0.5 + 0.5 * Math.sin(f.t * (1 + hash(i + 9) * 3) + i);
    c.globalAlpha = alpha * (0.35 + 0.65 * tw); c.fillStyle = '#fff'; const r = 1 + hash(i + 3) * 1.8; c.fillRect(x - f.cam.x * 0.03, y, r, r);
  }
  c.globalAlpha = 1;
}
export function orb(f: Frame, P: Pal) {
  if (!P.orb) return; const c = f.c; const { k, x, y, r, c: col } = P.orb;
  const g = c.createRadialGradient(x, y, r * 0.5, x, y, r * 3.2); g.addColorStop(0, k === 'sun' ? 'rgba(255,240,170,0.55)' : 'rgba(255,246,208,0.4)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = g; c.fillRect(x - r * 3.2, y - r * 3.2, r * 6.4, r * 6.4);
  c.fillStyle = col; poly(c, x, y, r, k === 'sun' ? 12 : 24, 0);
}

export interface WorldOpts { gy?: number; trees?: 'pine' | 'round' | 'none'; houses?: boolean; road?: boolean; peaks?: boolean; noOrb?: boolean; density?: number }
/** 画一整套低多边形纸艺景：天空、远山、中景树、地面、道路。cam.x 带视差 */
export function world(f: Frame, k: string, o: WorldOpts = {}) {
  const P = PAL[k]; const c = f.c; const gy = o.gy ?? GY;
  sky(f, P.sky[0], P.sky[1], gy);
  if (P.stars) starsLayer(f);
  if (!o.noOrb) orb(f, P);
  c.save();
  ridge(f, P.far, gy - 30, 190, 0.1, 7, 120, o.peaks);
  ridge(f, P.mid, gy + 6, 100, 0.28, 21, 90);
  c.restore();
  const d = 0.5, step = 120, off = f.cam.x * d;
  for (let i = Math.floor((off - 200) / step); i * step - off < W + 200; i++) {
    const x = i * step + hash(i) * 70 - off; const r = hash(i + 77);
    if (o.houses && r < 0.5) house(c, x, gy + 18, 0.8 + hash(i + 5) * 0.4, ['#ff8a80', '#ffd166', '#8ecae6', '#cdb4db'][i & 3]);
    else if (o.trees !== 'none' && r < 0.5 + (o.density ?? 0.35)) (o.trees === 'round' ? roundTree : pine)(c, x, gy + 24, 0.8 + hash(i + 9) * 0.5, P.tree, P.trunk);
  }
  const g = c.createLinearGradient(0, gy, 0, H); g.addColorStop(0, P.ground); g.addColorStop(1, shade(P.g2, -20));
  c.fillStyle = g; c.fillRect(-500, gy, W + 1000, H - gy + 300);
  for (let j = 0; j < 9; j += 2) {
    const y0 = gy + (H - gy) * Math.pow(j / 9, 1.7), y1 = gy + (H - gy) * Math.pow((j + 1) / 9, 1.7);
    c.fillStyle = 'rgba(255,255,255,0.06)'; c.fillRect(-500, y0, W + 1000, y1 - y0);
  }
  if (o.road) {
    c.fillStyle = 'rgba(255,236,190,0.9)'; c.beginPath(); c.moveTo(W / 2 - 40, gy); c.lineTo(W / 2 + 40, gy); c.lineTo(W + 260, H); c.lineTo(-260, H); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.7)';
    for (let j = 0; j < 8; j++) { const p = (j + mod(f.t * 0.9, 1)) / 8; const yy = gy + (H - gy) * p * p, w = 4 + 26 * p * p; c.fillRect(W / 2 - w / 2, yy, w, 6 + 22 * p * p); }
  }
  for (let i = Math.floor((f.cam.x - 200) / 70); i * 70 - f.cam.x < W + 200; i++) {
    if (hash(i + 300) > 0.5) continue; const x = i * 70 + hash(i + 1) * 50 - f.cam.x; const y = gy + 30 + hash(i + 2) * (H - gy - 40);
    c.fillStyle = ['#fff', '#ffd6e0', '#fff3b0'][mod(i, 3)]; c.globalAlpha = 0.7; c.fillRect(x, y, 5, 5); c.globalAlpha = 1;
  }
}

/** 近景暗角灌木：给纸艺层次感 */
export function fgBush(f: Frame, col = '#1f5f45') {
  const c = f.c; c.save();
  for (const sx of [0, 1]) {
    const bx = sx ? W + 20 : -20;
    for (let k = 0; k < 4; k++) { c.fillStyle = shade(col, k * 8); poly(c, bx + (sx ? -1 : 1) * k * 46, H + 20 - k * 8, 90 - k * 10, 6, k); }
  }
  c.restore();
}

// ---------------- 粒子（无状态） ----------------
export type PKind = 'snow' | 'petal' | 'leaf' | 'firefly' | 'lantern' | 'star' | 'rain' | 'gold' | 'heart';
export function particles(f: Frame, kind: PKind, n = 40, seed = 1) {
  const c = f.c; const t = f.t;
  for (let i = 0; i < n; i++) {
    const r1 = hash(i * 1.7 + seed), r2 = hash(i * 2.3 + seed + 11), r3 = hash(i * 3.1 + seed + 5);
    if (kind === 'snow' || kind === 'petal' || kind === 'leaf') {
      const sp = 30 + r3 * 50; const x = mod(r1 * W + Math.sin(t * (0.6 + r2) + i) * 40 + t * (kind === 'snow' ? 8 : 30), W + 40) - 20; const y = mod(r2 * H + t * sp, H + 40) - 20;
      c.fillStyle = kind === 'snow' ? '#fff' : kind === 'petal' ? ['#ffc2d9', '#ffe0ec', '#ffa8c8'][i % 3] : ['#e8742e', '#f2b134', '#c2551f'][i % 3];
      const sz = 3 + r3 * 5; c.save(); c.translate(x, y); c.rotate(t * (1 + r1) + i);
      if (kind === 'snow') c.fillRect(-sz / 2, -sz / 2, sz, sz); else { c.beginPath(); c.ellipse(0, 0, sz * 1.4, sz * 0.7, 0, 0, 7); c.fill(); } c.restore();
    } else if (kind === 'rain') {
      const x = mod(r1 * W * 1.2 + t * 120, W + 100) - 50, y = mod(r2 * H + t * 900, H + 60) - 30; c.strokeStyle = 'rgba(200,225,255,0.55)'; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 8, y + 22); c.stroke();
    } else if (kind === 'firefly') {
      const x = r1 * W + Math.sin(t * 0.7 + i) * 50, y = 260 + r2 * 360 + Math.cos(t * 0.9 + i * 2) * 30, a = 0.5 + 0.5 * Math.sin(t * 2 + i * 3);
      const g = c.createRadialGradient(x, y, 0, x, y, 14); g.addColorStop(0, `rgba(255,248,160,${a})`); g.addColorStop(1, 'rgba(255,248,160,0)'); c.fillStyle = g; c.fillRect(x - 14, y - 14, 28, 28);
    } else if (kind === 'lantern') {
      const y = H + 40 - mod(t * (20 + r3 * 20) + r2 * (H + 200), H + 200); const x = r1 * W + Math.sin(t * 0.5 + i) * 20;
      lantern(c, x, y, 0.5 + r3 * 0.7);
    } else if (kind === 'star' || kind === 'gold') {
      const x = r1 * W, y = r2 * H, a = 0.5 + 0.5 * Math.sin(t * 3 + i * 5); c.fillStyle = kind === 'gold' ? `rgba(255,215,90,${a})` : `rgba(255,255,255,${a})`; sparkle(c, x, y, 3 + r3 * 7);
    } else if (kind === 'heart') {
      const y = H - mod(t * (40 + r3 * 40) + r2 * H, H + 60) + 30; const x = r1 * W + Math.sin(t + i) * 30; c.fillStyle = `rgba(255,120,160,${0.4 + r3 * 0.5})`; heart(c, x, y, 6 + r3 * 10);
    }
  }
}
export function sparkle(c: CanvasRenderingContext2D, x: number, y: number, r: number) {
  c.beginPath(); c.moveTo(x, y - r); c.quadraticCurveTo(x, y, x + r, y); c.quadraticCurveTo(x, y, x, y + r); c.quadraticCurveTo(x, y, x - r, y); c.quadraticCurveTo(x, y, x, y - r); c.fill();
}
export function heart(c: CanvasRenderingContext2D, x: number, y: number, r: number) {
  c.beginPath(); c.moveTo(x, y + r * 0.9); c.bezierCurveTo(x - r * 1.6, y - r * 0.2, x - r * 0.7, y - r * 1.3, x, y - r * 0.4); c.bezierCurveTo(x + r * 0.7, y - r * 1.3, x + r * 1.6, y - r * 0.2, x, y + r * 0.9); c.fill();
}
export function lantern(c: CanvasRenderingContext2D, x: number, y: number, s: number) {
  const g = c.createRadialGradient(x, y, 0, x, y, 40 * s); g.addColorStop(0, 'rgba(255,190,90,0.55)'); g.addColorStop(1, 'rgba(255,190,90,0)'); c.fillStyle = g; c.fillRect(x - 40 * s, y - 40 * s, 80 * s, 80 * s);
  c.fillStyle = '#ff8c42'; c.beginPath(); c.roundRect(x - 11 * s, y - 14 * s, 22 * s, 26 * s, 6 * s); c.fill();
  c.fillStyle = '#ffd36b'; c.fillRect(x - 7 * s, y - 10 * s, 14 * s, 18 * s); c.fillStyle = '#7a3a1a'; c.fillRect(x - 8 * s, y - 16 * s, 16 * s, 3 * s); c.fillRect(x - 8 * s, y + 11 * s, 16 * s, 3 * s);
}

// ---------------- 道具 ----------------
export function ring(c: CanvasRenderingContext2D, x: number, y: number, r: number, rot = 0, gl = 1) {
  c.save(); c.translate(x, y); c.rotate(rot);
  const g = c.createRadialGradient(0, 0, r * 0.6, 0, 0, r * 2.4); g.addColorStop(0, `rgba(255,215,90,${0.5 * gl})`); g.addColorStop(1, 'rgba(255,215,90,0)'); c.fillStyle = g; c.fillRect(-r * 2.4, -r * 2.4, r * 4.8, r * 4.8);
  c.lineWidth = r * 0.28; c.strokeStyle = '#d4a017'; c.beginPath(); c.ellipse(0, 0, r, r * 0.8, 0, 0, 7); c.stroke();
  c.lineWidth = r * 0.12; c.strokeStyle = '#ffe58a'; c.beginPath(); c.ellipse(0, -r * 0.03, r, r * 0.8, 0, 3.6, 5.6); c.stroke();
  c.fillStyle = '#9be7ff'; c.beginPath(); c.moveTo(0, -r * 1.25); c.lineTo(r * 0.28, -r * 0.95); c.lineTo(0, -r * 0.7); c.lineTo(-r * 0.28, -r * 0.95); c.closePath(); c.fill();
  c.restore();
}
/** 勾指线：两点之间下垂的金线 / 红线 */
export function thread(c: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, sag = 30, col = '#ffc933', w = 4, gl = true) {
  c.save(); c.lineCap = 'round';
  const mx = (x1 + x2) / 2, my = Math.max(y1, y2) + sag;
  if (gl) { c.strokeStyle = col; c.globalAlpha = 0.28; c.lineWidth = w * 3.4; c.beginPath(); c.moveTo(x1, y1); c.quadraticCurveTo(mx, my, x2, y2); c.stroke(); c.globalAlpha = 1; }
  c.strokeStyle = col; c.lineWidth = w; c.beginPath(); c.moveTo(x1, y1); c.quadraticCurveTo(mx, my, x2, y2); c.stroke();
  c.restore();
}
export function giftBox(c: CanvasRenderingContext2D, x: number, y: number, s: number, open = 0, col = '#e63946') {
  c.fillStyle = col; c.fillRect(x - 40 * s, y - 50 * s, 80 * s, 50 * s);
  c.fillStyle = '#ffd166'; c.fillRect(x - 6 * s, y - 50 * s, 12 * s, 50 * s);
  c.save(); c.translate(x, y - 50 * s - open * 70 * s); c.rotate(open * -0.5);
  c.fillStyle = shade(col, 20); c.fillRect(-46 * s, -16 * s, 92 * s, 18 * s); c.fillStyle = '#ffd166'; c.fillRect(-6 * s, -16 * s, 12 * s, 18 * s);
  c.beginPath(); c.ellipse(-14 * s, -22 * s, 14 * s, 9 * s, -0.5, 0, 7); c.ellipse(14 * s, -22 * s, 14 * s, 9 * s, 0.5, 0, 7); c.fill();
  c.restore();
}
export function moonDisc(c: CanvasRenderingContext2D, x: number, y: number, r: number) {
  const g = c.createRadialGradient(x, y, r * 0.8, x, y, r * 2.6); g.addColorStop(0, 'rgba(255,246,200,0.55)'); g.addColorStop(1, 'rgba(255,246,200,0)'); c.fillStyle = g; c.fillRect(x - r * 2.6, y - r * 2.6, r * 5.2, r * 5.2);
  c.fillStyle = '#fff3c4'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
  c.fillStyle = 'rgba(230,205,140,0.55)'; for (const [dx, dy, rr] of [[-0.3, -0.2, 0.2], [0.25, 0.1, 0.28], [-0.1, 0.4, 0.14], [0.35, -0.4, 0.1]]) { c.beginPath(); c.arc(x + dx * r, y + dy * r, rr * r, 0, 7); c.fill(); }
}
export function crescent(c: CanvasRenderingContext2D, x: number, y: number, r: number, col = '#fff3c4') {
  c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0.35 * Math.PI, 1.65 * Math.PI, false); c.arc(x + r * 0.45, y - r * 0.05, r * 0.82, 1.65 * Math.PI, 0.35 * Math.PI, true); c.closePath(); c.fill();
}
export function hourglass(c: CanvasRenderingContext2D, x: number, y: number, s: number, p: number, rot = 0) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
  c.fillStyle = '#7a4b2a'; c.fillRect(-34, -64, 68, 9); c.fillRect(-34, 55, 68, 9);
  c.fillStyle = 'rgba(190,230,255,0.45)'; c.beginPath(); c.moveTo(-28, -55); c.lineTo(28, -55); c.lineTo(4, 0); c.lineTo(28, 55); c.lineTo(-28, 55); c.lineTo(-4, 0); c.closePath(); c.fill();
  c.strokeStyle = '#fff'; c.lineWidth = 3; c.stroke();
  c.fillStyle = '#ffcf5a';
  const top = 1 - p; if (top > 0.02) { c.beginPath(); c.moveTo(-24 * top - 2, -52 + 48 * p); c.lineTo(24 * top + 2, -52 + 48 * p); c.lineTo(3, -4); c.lineTo(-3, -4); c.closePath(); c.fill(); }
  if (p > 0.02 && p < 0.99) c.fillRect(-1.5, -4, 3, 56);
  c.beginPath(); c.moveTo(-26 * p, 52); c.lineTo(26 * p, 52); c.lineTo(0, 52 - 38 * p); c.closePath(); c.fill();
  c.restore();
}
export function flag(c: CanvasRenderingContext2D, x: number, y: number, s: number, t: number, col = '#ff4d6d') {
  c.fillStyle = '#6b4a2f'; c.fillRect(x - 2 * s, y - 90 * s, 4 * s, 90 * s);
  c.fillStyle = col; c.beginPath(); c.moveTo(x + 2 * s, y - 88 * s);
  for (let i = 0; i <= 10; i++) c.lineTo(x + 2 * s + i * 5 * s, y - (88 - Math.sin(t * 6 + i * 0.7) * 3) * s);
  for (let i = 10; i >= 0; i--) c.lineTo(x + 2 * s + i * 5 * s, y - (62 - Math.sin(t * 6 + i * 0.7) * 3) * s);
  c.closePath(); c.fill();
}
export function cloud(c: CanvasRenderingContext2D, x: number, y: number, s: number, col = 'rgba(255,255,255,0.92)') {
  c.fillStyle = col; for (const [dx, dy, r] of [[0, 0, 30], [32, 8, 24], [-34, 10, 22], [14, -14, 24]]) { c.beginPath(); c.arc(x + dx * s, y + dy * s, r * s, 0, 7); c.fill(); }
  c.fillRect(x - 40 * s, y + 8 * s, 80 * s, 24 * s);
}
export function paperBoat(c: CanvasRenderingContext2D, x: number, y: number, s: number, rock = 0) {
  c.save(); c.translate(x, y); c.rotate(rock); c.scale(s, s);
  c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-70, -16); c.lineTo(70, -16); c.lineTo(46, 14); c.lineTo(-46, 14); c.closePath(); c.fill();
  c.fillStyle = '#e8eef9'; c.beginPath(); c.moveTo(0, -70); c.lineTo(36, -16); c.lineTo(0, -16); c.closePath(); c.fill();
  c.fillStyle = '#cfdaf0'; c.beginPath(); c.moveTo(0, -70); c.lineTo(-30, -16); c.lineTo(0, -16); c.closePath(); c.fill();
  c.restore();
}
export function waves(f: Frame, y: number, col: string, amp = 10, n = 3) {
  const c = f.c;
  for (let k = 0; k < n; k++) {
    c.fillStyle = shade(col, k * 14 - 10); c.beginPath(); c.moveTo(-50, H + 50);
    for (let x = -50; x <= W + 50; x += 40) c.lineTo(x, y + k * 40 + Math.sin(f.t * 1.6 + x * 0.012 + k * 2) * amp);
    c.lineTo(W + 50, H + 50); c.closePath(); c.fill();
  }
}
export function glow(c: CanvasRenderingContext2D, x: number, y: number, r: number, col = '255,220,120', a = 0.6) {
  const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
}
export function rays(c: CanvasRenderingContext2D, x: number, y: number, len: number, n: number, rot: number, col = 'rgba(255,240,170,0.28)') {
  c.fillStyle = col; for (let i = 0; i < n; i++) { const a = rot + (i / n) * Math.PI * 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a - 0.07) * len, y + Math.sin(a - 0.07) * len); c.lineTo(x + Math.cos(a + 0.07) * len, y + Math.sin(a + 0.07) * len); c.fill(); }
}
export const FONT = '"ZCOOL KuaiLe", "PingFang SC", "Microsoft YaHei", sans-serif';
export function text(c: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, col = '#fff', align: CanvasTextAlign = 'center', stroke?: string) {
  c.save(); c.font = `${size}px ${FONT}`; c.textAlign = align; c.textBaseline = 'middle';
  if (stroke) { c.lineWidth = size * 0.16; c.strokeStyle = stroke; c.lineJoin = 'round'; c.strokeText(s, x, y); }
  c.fillStyle = col; c.fillText(s, x, y); c.restore();
}
/** 纸页：带阴影的纸片 */
export function paper(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, rot = 0, col = '#fff8e7') {
  c.save(); c.translate(x, y); c.rotate(rot); c.shadowColor = 'rgba(30,10,40,0.35)'; c.shadowBlur = 18; c.shadowOffsetY = 8;
  c.fillStyle = col; c.fillRect(-w / 2, -h / 2, w, h); c.restore();
}
export function camApply(f: Frame, x = 0, y = 0, z = 1) {
  f.cam = { x, y, z }; const c = f.c; c.translate(W / 2, H / 2); c.scale(z, z); c.translate(-W / 2, -H / 2);
}
