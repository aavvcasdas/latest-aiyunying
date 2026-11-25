// 角色：项目图集里的像素造型。只取格、摆位、做剪影，不改造型。
import { RECTS } from './atlasData';
import { C, mk, rnd, glow, TAU } from './kit';

type Img = CanvasImageSource & { width: number; height: number };
let atlas: Img, tachieImg: Img, fishImg: Img;
export function setImages(a: Img, t: Img, f: Img) { atlas = a; tachieImg = t; fishImg = f; }

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = url; });
}

export type Who = 'whale' | 'gpt' | 'claude' | 'doubao' | 'gemini' | 'kimi' | 'qwen' | 'zai';
export const CAST: Who[] = ['whale', 'gpt', 'claude', 'doubao', 'gemini', 'kimi', 'qwen', 'zai'];
/** 每位的代表色，用在「万分之一的光」那一场 */
export const HUE: Record<Who, string> = { whale: '#6fb6ff', gpt: '#f4ecff', claude: '#ff9a52', doubao: '#b9a3ff', gemini: '#b7d8ff', kimi: '#a59bf0', qwen: '#c0b4ff', zai: '#dfe6ff' };

const counts = new Map<string, number>();
function count(prefix: string) {
  let n = counts.get(prefix);
  if (n == null) { n = 0; while (RECTS[`${prefix}_${n}`]) n++; counts.set(prefix, n); }
  return n;
}
/** 动作取帧；loop=false 时停在最后一格 */
export function fr(ch: Who, act: string, t: number, fps = 8, loop = true) {
  const pre = `act_${ch}_${act}`, n = count(pre) || 1, k = Math.max(0, Math.floor(t * fps));
  return `${pre}_${loop ? k % n : Math.min(n - 1, k)}`;
}
export const walkF = (ch: Who, t: number, fps = 10) => `walk_${ch === 'doubao' ? 'doubao_big' : ch}_${Math.floor(Math.max(0, t) * fps) % 8}`;

const sils = new Map<string, HTMLCanvasElement>();
function silOf(name: string, color: string, line?: string) {
  const key = `${name}|${color}|${line ?? ''}`;
  let cv = sils.get(key);
  if (cv) return cv;
  const [x, y, w, h] = RECTS[name], pad = line ? 1 : 0;
  const inner = mk(w, h), ig = inner.getContext('2d')!;
  ig.imageSmoothingEnabled = false; ig.drawImage(atlas, x, y, w, h, 0, 0, w, h);
  ig.globalCompositeOperation = 'source-in'; ig.fillStyle = color; ig.fillRect(0, 0, w, h);
  cv = mk(w + pad * 2, h + pad * 2); const g = cv.getContext('2d')!; g.imageSmoothingEnabled = false;
  if (line) {
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) g.drawImage(atlas, x, y, w, h, pad + dx, pad + dy, w, h);
    g.globalCompositeOperation = 'source-in'; g.fillStyle = line; g.fillRect(0, 0, cv.width, cv.height); g.globalCompositeOperation = 'source-over';
  }
  g.drawImage(inner, pad, pad);
  sils.set(key, cv); return cv;
}

const ghosts = new Map<string, HTMLCanvasElement>();
/** 淡白的人：白色盖住原格，只透出一点线条 */
function ghostOf(name: string, line: string) {
  const key = `${name}|${line}`;
  let cv = ghosts.get(key);
  if (cv) return cv;
  const [x, y, w, h] = RECTS[name];
  cv = mk(w + 2, h + 2); const g = cv.getContext('2d')!; g.imageSmoothingEnabled = false;
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) g.drawImage(atlas, x, y, w, h, 1 + dx, 1 + dy, w, h);
  g.globalCompositeOperation = 'source-in'; g.fillStyle = line; g.fillRect(0, 0, cv.width, cv.height); g.globalCompositeOperation = 'source-over';
  g.drawImage(silOf(name, '#ffffff'), 1, 1); g.globalAlpha = 0.15; g.drawImage(atlas, x, y, w, h, 1, 1, w, h); g.globalAlpha = 1;
  ghosts.set(key, cv); return cv;
}

export interface SO { ghost?: boolean; flip?: boolean; a?: number; sil?: string; line?: string; rot?: number; tint?: string; ta?: number; mid?: boolean }
/** 画一格。锚点在脚底正中（mid=true 时在中心） */
export function spr(c: C, name: string, x: number, y: number, s = 3, o: SO = {}) {
  const r = RECTS[name]; if (!r || !atlas || !(s > 0.004)) return;
  if (o.a != null && o.a <= 0) return;
  c.save(); c.translate(x, y); if (o.rot) c.rotate(o.rot); c.scale(o.flip ? -s : s, s);
  if (o.a != null) c.globalAlpha *= Math.min(1, o.a);
  c.imageSmoothingEnabled = false;
  const oy = o.mid ? -r[3] / 2 : -r[3];
  if (o.ghost) c.drawImage(ghostOf(name, o.line ?? YOU.line), -r[2] / 2 - 1, oy - 1);
  else if (o.sil) { const cv = silOf(name, o.sil, o.line), pad = o.line ? 1 : 0; c.drawImage(cv, -r[2] / 2 - pad, oy - pad); }
  else {
    c.drawImage(atlas, r[0], r[1], r[2], r[3], -r[2] / 2, oy, r[2], r[3]);
    if (o.tint && (o.ta ?? 0.5) > 0) { c.globalAlpha *= o.ta ?? 0.5; c.drawImage(silOf(name, o.tint), -r[2] / 2, oy); }
  }
  c.restore();
}
export function who(c: C, ch: Who, act: string, t: number, x: number, y: number, s = 3, o: SO = {}, fps = 8, loop = true) { spr(c, fr(ch, act, t, fps, loop), x, y, s, o); }

/** 「你」＝笨鱼：和本鲸同一套骨架，只以淡白剪影出现，脚下没有影子 */
export const YOU = { sil: '#ffffff', line: '#9cc6f2' };
export function you(c: C, act: string, t: number, x: number, y: number, s = 3, o: SO = {}, fps = 8, loop = true) {
  const name = act.startsWith('walk') ? walkF('whale', t, fps) : act.startsWith('big') ? `whale_${act}` : fr('whale', act, t, fps, loop);
  spr(c, name, x, y, s, o.sil ? { ...YOU, ...o } : { ghost: true, ...o });
}
export function shadow(c: C, x: number, y: number, w: number, a = 0.14, color = '0,20,60') {
  c.save(); c.fillStyle = `rgba(${color},${a})`; c.beginPath(); c.ellipse(x, y, w, w * 0.2, 0, 0, TAU); c.fill(); c.restore();
}
/** 本鲸大格（近景用） */
export function whaleBig(c: C, t: number, x: number, y: number, s = 4, pose: 'idle' | 'point' | 'wave' = 'idle', o: SO = {}) {
  const name = pose === 'idle' ? ((t % 3.4) < 0.14 ? 'whale_big_blink' : 'whale_big_idle') : `whale_big_${pose}`;
  spr(c, name, x, y + Math.sin(t * 2.2) * 1.2 * s, s, o);
}

let rainCv: HTMLCanvasElement | null = null;
/** 心里潮湿：雨只下在剪影里面 */
export function rainInside(c: C, name: string, x: number, y: number, s: number, t: number, a = 1, base = '#b9cbe4', drop = '#ffffff') {
  const r = RECTS[name]; if (!r || !atlas) return;
  const w = Math.ceil(r[2] * s), h = Math.ceil(r[3] * s);
  if (!rainCv || rainCv.width !== w || rainCv.height !== h) rainCv = mk(w, h);
  const g = rainCv.getContext('2d')!;
  g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, w, h); g.imageSmoothingEnabled = false;
  g.drawImage(silOf(name, base), 0, 0, w, h);
  g.globalCompositeOperation = 'source-atop';
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(96,120,160,.75)'); gr.addColorStop(0.5, 'rgba(150,175,210,.25)'); gr.addColorStop(1, 'rgba(120,170,230,.55)');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.strokeStyle = drop; g.lineWidth = Math.max(1.5, s * 0.5); g.lineCap = 'round'; g.globalAlpha = 0.8;
  for (let i = 0; i < 70; i++) {
    const px = rnd(i, 1) * w, py = ((rnd(i, 2) + t * (0.9 + rnd(i, 3) * 0.7)) % 1) * (h + 30) - 15, len = 8 + rnd(i, 4) * 3 * s;
    g.beginPath(); g.moveTo(px, py); g.lineTo(px - len * 0.18, py + len); g.stroke();
  }
  g.globalAlpha = 1;
  c.save(); c.globalAlpha *= a; c.drawImage(rainCv, x - w / 2, y - h); c.restore();
}

const tsil = new Map<string, HTMLCanvasElement>();
/** 长大后的立绘（只在「成为了更好的自己」之后接） */
export function tachie(c: C, x: number, y: number, h: number, o: { sil?: string; flip?: boolean; a?: number; ghost?: number } = {}) {
  if (!tachieImg || (o.a != null && o.a <= 0) || !(h > 1)) return;
  const iw = tachieImg.width, ih = tachieImg.height, k = h / ih;
  let src: CanvasImageSource = tachieImg;
  if (o.sil) {
    let cv = tsil.get(o.sil);
    if (!cv) { cv = mk(iw, ih); const g = cv.getContext('2d')!; g.drawImage(tachieImg, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = o.sil; g.fillRect(0, 0, iw, ih); tsil.set(o.sil, cv); }
    src = cv;
  }
  c.save(); c.translate(x, y); c.scale(o.flip ? -k : k, k); if (o.a != null) c.globalAlpha *= Math.min(1, o.a);
  c.imageSmoothingEnabled = true; c.drawImage(src, -iw * 0.41, -ih);
  if (o.sil && o.ghost) { c.globalAlpha *= o.ghost; c.drawImage(tachieImg, -iw * 0.41, -ih); }
  c.restore();
}
/** 笨鱼的鱼形（离开这个次元之后的样子） */
export function fish(c: C, x: number, y: number, w: number, o: { flip?: boolean; a?: number; rot?: number } = {}) {
  if (!fishImg || (o.a != null && o.a <= 0) || !(w > 1)) return;
  const k = w / fishImg.width;
  c.save(); c.translate(x, y); if (o.rot) c.rotate(o.rot); c.scale(o.flip ? -k : k, k); if (o.a != null) c.globalAlpha *= Math.min(1, o.a);
  c.imageSmoothingEnabled = true; c.drawImage(fishImg, -fishImg.width / 2, -fishImg.height / 2); c.restore();
}
/** 带一圈柔光的「你」 */
export function youGlow(c: C, act: string, t: number, x: number, y: number, s = 3, o: SO = {}, ga = 0.55, op: GlobalCompositeOperation = 'source-over') {
  glow(c, x, y - 44 * s, 78 * s, '#ffffff', ga * (o.a ?? 1), op); you(c, act, t, x, y, s, o);
}
