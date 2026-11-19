// 《浪人琵琶》引擎核心：纸本手卷 + 视差镜头 + 像素纸片人 + 代码画的纸艺道具。
// 规矩：逐帧函数只读参数里的时间；角色每帧重新摆；缺帧直接报错（不拿别的造型顶替）。
// 本文件不碰 DOM：画布由外面注入（浏览器 / node 测试都能跑）。
import { RECTS, ACTIONS } from "./atlasData";

export const W = 1280;
export const H = 720;
export const FONT = "MVBrush";
export type G = CanvasRenderingContext2D;
export type Cv = HTMLCanvasElement;
export interface Env {
  make: (w: number, h: number) => Cv;
  atlas: CanvasImageSource;
}

let env: Env;
const cache = new Map<string, Cv>();
let scratchCv: Cv | null = null;
export function setEnv(e: Env) {
  env = e;
  cache.clear();
  scratchCv = null;
}
export function cached(key: string, w: number, h: number, paint: (g: G) => void): Cv {
  let c = cache.get(key);
  if (!c) {
    c = env.make(w, h);
    paint(c.getContext("2d") as G);
    cache.set(key, c);
  }
  return c;
}

// ---------- 数学 ----------
export const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const ss = (u: number) => {
  u = clamp(u);
  return u * u * (3 - 2 * u);
};
export const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const eo = (u: number) => 1 - Math.pow(1 - clamp(u), 3);
export const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export const TAU = Math.PI * 2;

// ---------- 颜色 ----------
export const C = {
  paper: "#efe3c8",
  ink: "#231d18",
  ink2: "#5a4a3c",
  red: "#b5352b",
  red2: "#d85a43",
  pink: "#e9a39c",
  pink2: "#f6d3cb",
  gold: "#d9a441",
  gold2: "#f3d691",
  wood: "#6b4630",
  wood2: "#93643f",
  leaf: "#6f8a55",
  stone: "#a59b87",
};

export type ToneName = "day" | "dawn" | "dusk" | "night" | "rain" | "snow";
export interface Tone {
  sky0: string;
  sky1: string;
  mt: string; // 远山 rgb
  ground: string;
  ground2: string;
  wall: string;
  roof: string;
  text: string;
  halo: string;
  tint: string | null; // 角色罩色
  ta: number;
  dark: boolean;
}
export const TONES: Record<ToneName, Tone> = {
  day: { sky0: "#f3e9d2", sky1: "#e8d9b6", mt: "88,104,108", ground: "#dccba3", ground2: "#cdb98c", wall: "#f8f1e2", roof: "#2e2925", text: C.ink, halo: "#f3e9d2", tint: null, ta: 0, dark: false },
  dawn: { sky0: "#f6d6c6", sky1: "#f0e0bf", mt: "132,104,124", ground: "#e0cba6", ground2: "#d0b78f", wall: "#faefe4", roof: "#3a2f33", text: C.ink, halo: "#f8e6d6", tint: "#e8a27c", ta: 0.1, dark: false },
  dusk: { sky0: "#e9b78a", sky1: "#ecd2a6", mt: "126,78,74", ground: "#cfa97c", ground2: "#b98d63", wall: "#f3dcbb", roof: "#33241f", text: C.ink, halo: "#f0d3aa", tint: "#b4532a", ta: 0.16, dark: false },
  night: { sky0: "#0c1530", sky1: "#1f3260", mt: "96,126,186", ground: "#111b36", ground2: "#0b1228", wall: "#2a3760", roof: "#070b18", text: C.gold2, halo: "#0c1530", tint: "#14224e", ta: 0.36, dark: true },
  rain: { sky0: "#131c36", sky1: "#2c3d60", mt: "110,132,170", ground: "#17213c", ground2: "#0e152b", wall: "#2c3858", roof: "#080c18", text: C.gold2, halo: "#131c36", tint: "#1a2850", ta: 0.42, dark: true },
  snow: { sky0: "#1b2644", sky1: "#46567a", mt: "170,186,216", ground: "#c5cfe0", ground2: "#9fabc4", wall: "#3a4668", roof: "#0c1020", text: C.gold2, halo: "#1b2644", tint: "#22325c", ta: 0.3, dark: true },
};

// ---------- 镜头 / 视差层 ----------
export interface Cam {
  x: number;
  y: number;
  z: number;
}
export const cam = (x = W / 2, y = H / 2, z = 1): Cam => ({ x, y, z });
export const camLerp = (a: Cam, b: Cam, u: number): Cam => ({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z: lerp(a.z, b.z, u) });
/** p=0 贴在天上不动，p=1 是角色站的那层 */
export function layer(g: G, c: Cam, p: number, fn: () => void) {
  const z = 1 + (c.z - 1) * p;
  g.save();
  g.translate(W / 2, H / 2);
  g.scale(z, z);
  g.translate(-(W / 2 + (c.x - W / 2) * p), -(H / 2 + (c.y - H / 2) * p));
  fn();
  g.restore();
}
/** 这一层当前能看见的世界 x 范围 */
export function span(c: Cam, p: number): [number, number] {
  const z = 1 + (c.z - 1) * p;
  const cx = W / 2 + (c.x - W / 2) * p;
  return [cx - W / 2 / z - 40, cx + W / 2 / z + 40];
}

// ---------- 纸 ----------
export function paper(g: G, tone: ToneName) {
  const T = TONES[tone];
  const c = cached("paper_" + tone, W, H, (p) => {
    const gr = p.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, T.sky0);
    gr.addColorStop(1, T.sky1);
    p.fillStyle = gr;
    p.fillRect(0, 0, W, H);
    // 纸纤维
    p.lineWidth = 1;
    for (let i = 0; i < 520; i++) {
      const x = rnd(i * 3.1) * W, y = rnd(i * 5.7) * H, l = 8 + rnd(i * 7.3) * 26, a = rnd(i * 9.9) * TAU;
      p.strokeStyle = T.dark ? `rgba(160,180,230,${0.03 + rnd(i) * 0.05})` : `rgba(120,90,50,${0.04 + rnd(i) * 0.06})`;
      p.beginPath();
      p.moveTo(x, y);
      p.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l * 0.3);
      p.stroke();
    }
    // 泥金 / 墨点
    for (let i = 0; i < 260; i++) {
      p.fillStyle = T.dark ? `rgba(240,210,140,${0.05 + rnd(i * 2.3) * 0.12})` : `rgba(90,60,30,${0.03 + rnd(i * 2.3) * 0.06})`;
      const r = 0.6 + rnd(i * 4.1) * 1.6;
      p.fillRect(rnd(i * 6.7) * W, rnd(i * 8.9) * H, r, r);
    }
  });
  g.drawImage(c, 0, 0);
}
/** 压在最上面：暗角 + 手卷的上下裱边 */
export function mount(g: G) {
  const c = cached("mount", W, H, (p) => {
    const v = p.createRadialGradient(W / 2, H / 2, H * 0.42, W / 2, H / 2, H * 0.95);
    v.addColorStop(0, "rgba(30,18,8,0)");
    v.addColorStop(1, "rgba(30,18,8,0.34)");
    p.fillStyle = v;
    p.fillRect(0, 0, W, H);
    for (const y of [0, H - 30]) {
      p.fillStyle = "#141b33";
      p.fillRect(0, y, W, 30);
      p.fillStyle = "rgba(217,164,65,0.55)";
      for (let x = 10; x < W; x += 28) {
        p.save();
        p.translate(x, y + 15);
        p.rotate(Math.PI / 4);
        p.fillRect(-3.5, -3.5, 7, 7);
        p.restore();
      }
      p.fillStyle = C.gold;
      p.fillRect(0, y === 0 ? 29 : y, W, 1.5);
    }
  });
  g.drawImage(c, 0, 0);
}
export function glow(g: G, x: number, y: number, r: number, rgb: string, a: number) {
  if (a <= 0) return;
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, `rgba(${rgb},${a})`);
  gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr;
  g.fillRect(x - r, y - r, r * 2, r * 2);
}
/** 水墨远山：山脊实、山脚化进纸里 */
export function mountains(g: G, seed: number, x0: number, x1: number, baseY: number, amp: number, rgb: string, a = 0.5) {
  const ridge = (x: number) =>
    baseY - amp * (0.5 + 0.34 * Math.sin(x * 0.0037 + seed) + 0.22 * Math.sin(x * 0.0091 + seed * 2.3) + 0.1 * Math.sin(x * 0.023 + seed * 5.1));
  g.beginPath();
  g.moveTo(x0, baseY + 170);
  for (let x = x0; x <= x1 + 24; x += 24) g.lineTo(x, ridge(x));
  g.lineTo(x1 + 24, baseY + 170);
  g.closePath();
  const gr = g.createLinearGradient(0, baseY - amp, 0, baseY + 150);
  gr.addColorStop(0, `rgba(${rgb},${a})`);
  gr.addColorStop(0.55, `rgba(${rgb},${a * 0.45})`);
  gr.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = gr;
  g.fill();
}
export function disc(g: G, x: number, y: number, r: number, fill: string) {
  g.beginPath();
  g.arc(x, y, r, 0, TAU);
  g.fillStyle = fill;
  g.fill();
}
export function moon(g: G, x: number, y: number, r: number, a = 1) {
  g.save();
  g.globalAlpha *= a;
  glow(g, x, y, r * 3.2, "243,214,145", 0.28);
  disc(g, x, y, r, "#f7e7b8");
  g.globalAlpha *= 0.25;
  disc(g, x - r * 0.3, y - r * 0.2, r * 0.22, "#d9b56a");
  disc(g, x + r * 0.25, y + r * 0.3, r * 0.3, "#d9b56a");
  disc(g, x + r * 0.2, y - r * 0.45, r * 0.12, "#d9b56a");
  g.restore();
}

// ---------- 像素角色 ----------
export interface SpOpt {
  flip?: boolean;
  a?: number;
  tint?: string | null;
  ta?: number;
  rot?: number;
  shadow?: boolean;
  speed?: number;
}
function scratch(): Cv {
  if (!scratchCv) scratchCv = env.make(256, 256);
  return scratchCv;
}
/** 画一格：x 是脚底中心，y 是脚底 */
export function frame(g: G, name: string, x: number, y: number, k: number, o: SpOpt = {}) {
  const r = RECTS[name];
  if (!r) throw new Error("缺帧 " + name);
  const [sx, sy, w, h] = r;
  g.save();
  g.imageSmoothingEnabled = false;
  g.globalAlpha *= o.a ?? 1;
  g.translate(Math.round(x), Math.round(y));
  if (o.rot) g.rotate(o.rot);
  if (o.flip) g.scale(-1, 1);
  if (o.tint && (o.ta ?? 1) > 0) {
    const c = scratch();
    const cg = c.getContext("2d") as G;
    cg.globalCompositeOperation = "source-over";
    cg.globalAlpha = 1;
    cg.clearRect(0, 0, 256, 256);
    cg.drawImage(env.atlas, sx, sy, w, h, 0, 0, w, h);
    cg.globalCompositeOperation = "source-atop";
    cg.globalAlpha = o.ta ?? 1;
    cg.fillStyle = o.tint;
    cg.fillRect(0, 0, w, h);
    g.drawImage(c, 0, 0, w, h, -(w * k) / 2, -h * k, w * k, h * k);
  } else {
    g.drawImage(env.atlas, sx, sy, w, h, -(w * k) / 2, -h * k, w * k, h * k);
  }
  g.restore();
}
export type Who = "whale" | "gpt" | "claude" | "doubao" | "gemini" | "kimi" | "qwen" | "zai";
/** 角色动作：tt 是这个动作已经演了多少秒。action='walk' 走行走循环 */
export function act(g: G, who: Who, action: string, tt: number, x: number, y: number, k: number, o: SpOpt = {}) {
  let names: string[], fps: number, loop: boolean;
  if (action === "walk") {
    const id = who === "doubao" ? "doubao_big" : who;
    names = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => `walk_${id}_${i}`);
    fps = 10;
    loop = true;
  } else {
    const a = ACTIONS[who]?.[action];
    if (!a) throw new Error(`缺动作 ${who}.${action}`);
    names = a.frames;
    fps = a.fps;
    loop = a.loop;
  }
  const n = names.length;
  let i = Math.floor(Math.max(0, tt) * fps * (o.speed ?? 1));
  i = loop ? i % n : Math.min(i, n - 1);
  if (o.shadow !== false) {
    g.save();
    g.globalAlpha *= 0.22 * (o.a ?? 1);
    g.fillStyle = "#1a120c";
    g.beginPath();
    g.ellipse(x, y - 1, 15 * k, 3.2 * k, 0, 0, TAU);
    g.fill();
    g.restore();
  }
  frame(g, names[i], x, y, k, o);
}
/** 夜景里给角色罩一层色 */
export const toned = (tone: ToneName, extra: SpOpt = {}): SpOpt => ({ tint: TONES[tone].tint, ta: TONES[tone].ta, ...extra });
export const SIL: SpOpt = { tint: "#1c1410", ta: 1, shadow: false };

// ---------- 字 ----------
/** 竖排一列，x 是列中心，y 是第一个字的顶；rev 是露出了几成 */
export function vtext(g: G, s: string, x: number, y: number, size: number, color: string, rev = 1, halo: string | null = null, a = 1) {
  const n = s.length;
  g.save();
  g.font = `${size}px ${FONT}, "Kaiti SC", "KaiTi", serif`;
  g.textAlign = "center";
  g.textBaseline = "top";
  g.lineJoin = "round";
  for (let i = 0; i < n; i++) {
    const k = clamp(rev * n - i);
    if (k <= 0) break;
    const yy = y + i * size * 1.06 + (1 - eo(k)) * -8;
    g.globalAlpha = a * k;
    if (halo) {
      g.strokeStyle = halo;
      g.lineWidth = size * 0.2;
      g.strokeText(s[i], x, yy);
    }
    g.fillStyle = color;
    g.fillText(s[i], x, yy);
  }
  g.restore();
}
export function htext(g: G, s: string, x: number, y: number, size: number, color: string, a = 1, align: CanvasTextAlign = "center") {
  g.save();
  g.globalAlpha *= a;
  g.font = `${size}px ${FONT}, "Kaiti SC", "KaiTi", serif`;
  g.textAlign = align;
  g.textBaseline = "middle";
  g.fillStyle = color;
  g.fillText(s, x, y);
  g.restore();
}
/** 朱印 */
export function seal(g: G, x: number, y: number, size: number, s: string, a = 1) {
  g.save();
  g.globalAlpha *= a;
  g.fillStyle = C.red;
  const h = size * s.length + size * 0.36;
  rr(g, x - size * 0.68, y, size * 1.36, h, size * 0.16);
  g.fill();
  g.font = `${size}px ${FONT}, serif`;
  g.textAlign = "center";
  g.textBaseline = "top";
  g.fillStyle = "#f6e9d2";
  for (let i = 0; i < s.length; i++) g.fillText(s[i], x, y + size * 0.2 + i * size);
  g.restore();
}
export function rr(g: G, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

// ---------- 粒子（全是时间的确定函数）----------
export function petals(g: G, t: number, n: number, x0: number, x1: number, y0: number, y1: number, col = C.pink, wind = 40, seed = 0, a = 1) {
  const w = x1 - x0, h = y1 - y0;
  g.save();
  for (let i = 0; i < n; i++) {
    const s = seed + i * 1.37;
    const vx = wind * (0.5 + rnd(s)), vy = 26 + rnd(s + 1) * 34;
    let x = (rnd(s + 2) * w + vx * t + Math.sin(t * 1.3 + i) * 14) % w;
    if (x < 0) x += w;
    const y = (rnd(s + 3) * h + vy * t) % h;
    const r = 3 + rnd(s + 4) * 4;
    g.globalAlpha = a * (0.55 + rnd(s + 5) * 0.45);
    g.fillStyle = i % 3 === 0 ? C.pink2 : col;
    g.beginPath();
    g.ellipse(x0 + x, y0 + y, r, r * 0.55, t * (1 + rnd(s + 6) * 2) + i, 0, TAU);
    g.fill();
  }
  g.restore();
}
export function rain(g: G, t: number, n: number, a = 0.5, seed = 0) {
  g.save();
  g.strokeStyle = `rgba(196,212,240,${a})`;
  g.lineWidth = 1.4;
  g.beginPath();
  for (let i = 0; i < n; i++) {
    const s = seed + i * 2.11;
    const sp = 900 + rnd(s) * 500;
    const y = ((rnd(s + 1) * (H + 200) + sp * t) % (H + 200)) - 100;
    const x = ((rnd(s + 2) * (W + 300) - y * 0.22) % (W + 300)) - 100;
    const l = 22 + rnd(s + 3) * 30;
    g.moveTo(x, y);
    g.lineTo(x - l * 0.22, y + l);
  }
  g.stroke();
  g.restore();
}
export function ripples(g: G, t: number, n: number, x0: number, x1: number, y0: number, y1: number, rgb = "196,212,240", seed = 0) {
  g.save();
  g.lineWidth = 1.3;
  for (let i = 0; i < n; i++) {
    const s = seed + i * 3.3;
    const ph = (t * (0.7 + rnd(s) * 0.6) + rnd(s + 1)) % 1;
    const cyc = Math.floor(t * (0.7 + rnd(s) * 0.6) + rnd(s + 1));
    const x = lerp(x0, x1, rnd(s + 2 + cyc * 0.61)), y = lerp(y0, y1, rnd(s + 3 + cyc * 0.37));
    g.strokeStyle = `rgba(${rgb},${0.5 * (1 - ph)})`;
    g.beginPath();
    g.ellipse(x, y, 4 + ph * 26, 1.2 + ph * 7, 0, 0, TAU);
    g.stroke();
  }
  g.restore();
}
export function snow(g: G, t: number, n: number, a = 0.9, seed = 0) {
  g.save();
  g.fillStyle = "#eef2fb";
  for (let i = 0; i < n; i++) {
    const s = seed + i * 1.91;
    const y = (rnd(s) * H + (30 + rnd(s + 1) * 50) * t) % H;
    let x = (rnd(s + 2) * W - 24 * t + Math.sin(t * 0.9 + i) * 18) % W;
    if (x < 0) x += W;
    g.globalAlpha = a * (0.4 + rnd(s + 3) * 0.6);
    const r = 1.2 + rnd(s + 4) * 2.2;
    g.beginPath();
    g.arc(x, y, r, 0, TAU);
    g.fill();
  }
  g.restore();
}
/** 风：几笔拖长的泥金 / 淡墨线 */
export function wind(g: G, t: number, n: number, col: string, a = 0.5, dir = 1, seed = 0) {
  g.save();
  g.strokeStyle = col;
  g.lineCap = "round";
  for (let i = 0; i < n; i++) {
    const s = seed + i * 4.7;
    const sp = 520 + rnd(s) * 480;
    let x = (rnd(s + 1) * (W + 600) + sp * t) % (W + 600);
    if (dir < 0) x = W + 600 - x;
    x -= 300;
    const y = 80 + rnd(s + 2) * (H - 200) + Math.sin(t * 2 + i) * 10;
    const l = 120 + rnd(s + 3) * 220;
    g.globalAlpha = a * (0.3 + rnd(s + 4) * 0.7);
    g.lineWidth = 1 + rnd(s + 5) * 2;
    g.beginPath();
    g.moveTo(x, y);
    g.bezierCurveTo(x + l * 0.3 * dir, y - 14, x + l * 0.7 * dir, y + 14, x + l * dir, y);
    g.stroke();
  }
  g.restore();
}
export function fireflies(g: G, t: number, n: number, x0: number, x1: number, y0: number, y1: number, seed = 0) {
  for (let i = 0; i < n; i++) {
    const s = seed + i * 2.9;
    const x = lerp(x0, x1, rnd(s)) + Math.sin(t * (0.3 + rnd(s + 1) * 0.5) + i) * 40;
    const y = lerp(y0, y1, rnd(s + 2)) + Math.cos(t * (0.4 + rnd(s + 3) * 0.4) + i * 2) * 24;
    const a = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * (1.5 + rnd(s + 4) * 2) + i));
    glow(g, x, y, 12, "243,214,145", 0.5 * a);
    disc(g, x, y, 1.6, `rgba(255,240,190,${a})`);
  }
}

// ---------- 纸艺道具（都是代码画的；不画手）----------
/** 合着的花伞：伞尖落地在 (x,y)，伞柄朝上 */
export function umbrellaClosed(g: G, x: number, y: number, s = 1, rot = 0) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.scale(s, s);
  g.strokeStyle = C.wood;
  g.lineWidth = 4;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(0, -150);
  g.stroke();
  g.beginPath();
  g.moveTo(-3, -14);
  g.lineTo(-11, -84);
  g.quadraticCurveTo(0, -118, 11, -84);
  g.lineTo(3, -14);
  g.closePath();
  g.fillStyle = C.red;
  g.fill();
  g.strokeStyle = "rgba(60,10,8,0.5)";
  g.lineWidth = 1.2;
  for (const dx of [-5, 0, 5]) {
    g.beginPath();
    g.moveTo(dx * 0.3, -16);
    g.lineTo(dx, -92);
    g.stroke();
  }
  for (const [fx, fy] of [[-4, -40], [4, -58], [-3, -76], [5, -30]]) flower(g, fx, fy, 3.2);
  g.fillStyle = C.gold;
  g.fillRect(-4, -112, 8, 5);
  disc(g, 0, -152, 4.5, C.wood2);
  g.restore();
}
/** 撑开的花伞：柄底在 (x,y) */
export function umbrellaOpen(g: G, x: number, y: number, s = 1, rot = 0) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.scale(s, s);
  g.strokeStyle = C.wood;
  g.lineWidth = 4;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(0, -150);
  g.stroke();
  const n = 8, R = 92, top = -160, rim = -100;
  for (let i = 0; i < n; i++) {
    const xa = -R + (2 * R * i) / n, xb = -R + (2 * R * (i + 1)) / n;
    g.beginPath();
    g.moveTo(0, top);
    g.quadraticCurveTo(xa * 0.7, top + 6, xa, rim - Math.abs(xa) * -0.08);
    g.quadraticCurveTo((xa + xb) / 2, rim + 16, xb, rim - Math.abs(xb) * -0.08);
    g.quadraticCurveTo(xb * 0.7, top + 6, 0, top);
    g.closePath();
    g.fillStyle = i % 2 ? C.red : C.red2;
    g.fill();
    g.strokeStyle = "rgba(60,10,8,0.45)";
    g.lineWidth = 1;
    g.stroke();
  }
  for (const [fx, fy, fr] of [[-52, -112, 6], [-18, -128, 7], [26, -118, 6.5], [58, -108, 5.5], [2, -106, 5]]) flower(g, fx, fy, fr);
  disc(g, 0, top - 2, 5, C.gold);
  g.restore();
}
export function flower(g: G, x: number, y: number, r: number, col = "#fbe6dc") {
  g.fillStyle = col;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU - Math.PI / 2;
    g.beginPath();
    g.arc(x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, r * 0.5, 0, TAU);
    g.fill();
  }
  disc(g, x, y, r * 0.3, C.gold);
}
/** 琵琶：底在 (x,y)，broken = 断了几根弦（零到四） */
export function pipa(g: G, x: number, y: number, s: number, rot: number, broken: number, t: number, pluck = 1) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.scale(s, s);
  g.lineJoin = "round";
  // 琴头
  g.strokeStyle = C.wood;
  g.lineWidth = 7;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(0, -150);
  g.quadraticCurveTo(-2, -172, -16, -182);
  g.stroke();
  g.lineWidth = 3;
  for (let i = 0; i < 4; i++) {
    const yy = -156 - i * 6;
    g.beginPath();
    g.moveTo(i % 2 ? 4 : -4, yy);
    g.lineTo(i % 2 ? 16 : -18, yy - 2);
    g.stroke();
  }
  // 琴身
  g.beginPath();
  g.moveTo(0, 0);
  g.bezierCurveTo(-40, -2, -46, -62, -9, -108);
  g.lineTo(-7, -152);
  g.lineTo(7, -152);
  g.lineTo(9, -108);
  g.bezierCurveTo(46, -62, 40, -2, 0, 0);
  g.closePath();
  g.fillStyle = "#c08a52";
  g.fill();
  g.strokeStyle = C.ink;
  g.lineWidth = 2.4;
  g.stroke();
  g.beginPath();
  g.moveTo(0, -6);
  g.bezierCurveTo(-32, -8, -36, -58, -6, -100);
  g.lineTo(6, -100);
  g.bezierCurveTo(36, -58, 32, -8, 0, -6);
  g.fillStyle = "#e6c391";
  g.fill();
  g.fillStyle = C.wood;
  for (let i = 0; i < 5; i++) g.fillRect(-7, -146 + i * 9, 14, 2.5);
  g.fillRect(-15, -26, 30, 5);
  disc(g, -16, -52, 3, C.wood);
  disc(g, 16, -52, 3, C.wood);
  // 弦
  g.lineWidth = 1.1;
  for (let i = 0; i < 4; i++) {
    const sx = -6 + i * 4;
    if (i >= 4 - broken) {
      // 断弦：一截挂在琴头，一截从缚弦处甩出去
      g.strokeStyle = "rgba(245,235,215,0.95)";
      const sw = Math.sin(t * 3.1 + i * 1.7);
      g.beginPath();
      g.moveTo(sx, -24);
      g.bezierCurveTo(sx + 26 + sw * 8, -52, sx + 44 + sw * 14, -30 + sw * 8, sx + 62 + sw * 10, -58 + sw * 12);
      g.stroke();
      g.beginPath();
      g.moveTo(sx * 0.6, -150);
      g.quadraticCurveTo(sx - 12 - sw * 5, -132, sx - 20 - sw * 8, -120 + sw * 5);
      g.stroke();
    } else {
      g.strokeStyle = "rgba(250,244,230,0.95)";
      const vib = Math.sin(t * 46 + i * 2.1) * 1.6 * pluck;
      g.beginPath();
      g.moveTo(sx, -24);
      g.quadraticCurveTo(sx + vib, -86, sx * 0.6, -150);
      g.stroke();
    }
  }
  g.restore();
}
/** 酒葫芦：底在 (x,y) */
export function gourd(g: G, x: number, y: number, s = 1, rot = 0) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.scale(s, s);
  disc(g, 0, -20, 20, "#c98f4a");
  disc(g, 0, -49, 13, "#c98f4a");
  g.fillStyle = "#c98f4a";
  g.fillRect(-4, -68, 8, 10);
  g.fillStyle = "rgba(255,240,200,0.35)";
  g.beginPath();
  g.ellipse(-7, -26, 5, 9, 0.3, 0, TAU);
  g.fill();
  g.fillStyle = C.red;
  g.fillRect(-5, -73, 10, 6);
  g.strokeStyle = C.red;
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(-11, -38);
  g.lineTo(11, -38);
  g.stroke();
  g.beginPath();
  g.moveTo(8, -38);
  g.quadraticCurveTo(16, -30, 12, -18);
  g.stroke();
  g.restore();
}
/** 马：纸艺剪影，脚底中心在 (x,y)；ph 是步态相位，graze 是低头的程度 */
export function horse(g: G, x: number, y: number, s: number, flip: boolean, ph: number, graze = 0, col = "#3b2c24") {
  g.save();
  g.translate(x, y);
  g.scale(flip ? -s : s, s);
  g.fillStyle = col;
  g.strokeStyle = col;
  g.lineCap = "round";
  g.lineJoin = "round";
  // 尾
  g.lineWidth = 8;
  g.beginPath();
  g.moveTo(-50, -92);
  g.quadraticCurveTo(-78 + Math.sin(ph * 0.5) * 6, -80, -74 + Math.sin(ph * 0.5) * 10, -36);
  g.stroke();
  // 腿
  g.lineWidth = 8;
  const legs: [number, number][] = [[-38, 0], [-28, Math.PI], [32, Math.PI * 0.5], [42, Math.PI * 1.5]];
  for (const [lx, off] of legs) {
    const sw = Math.sin(ph + off);
    g.beginPath();
    g.moveTo(lx, -66);
    g.lineTo(lx + sw * 8, -32);
    g.lineTo(lx + sw * 16, -2 - Math.max(0, Math.cos(ph + off)) * 6);
    g.stroke();
  }
  // 身
  g.beginPath();
  g.ellipse(0, -82, 54, 25, 0, 0, TAU);
  g.fill();
  // 颈、头
  g.save();
  g.translate(38, -92);
  g.rotate(graze * 1.15);
  g.beginPath();
  g.moveTo(-10, 10);
  g.lineTo(18, -46);
  g.lineTo(40, -36);
  g.lineTo(16, 22);
  g.closePath();
  g.fill();
  g.beginPath();
  g.moveTo(16, -50);
  g.lineTo(58, -34);
  g.lineTo(60, -20);
  g.lineTo(30, -18);
  g.closePath();
  g.fill();
  g.beginPath();
  g.moveTo(20, -50);
  g.lineTo(26, -66);
  g.lineTo(32, -48);
  g.closePath();
  g.fill();
  g.strokeStyle = "#1c1410";
  g.lineWidth = 5;
  g.beginPath();
  g.moveTo(-6, 4);
  g.lineTo(18, -46);
  g.stroke();
  g.restore();
  // 鞍毯
  g.fillStyle = C.red;
  rr(g, -22, -110, 40, 32, 5);
  g.fill();
  g.strokeStyle = C.gold;
  g.lineWidth = 2;
  g.stroke();
  g.restore();
}
export function butterfly(g: G, x: number, y: number, s: number, flap: number, col: string, rot = 0) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.scale(s, s);
  const f = 0.25 + 0.75 * Math.abs(Math.cos(flap));
  for (const sd of [-1, 1]) {
    g.save();
    g.scale(sd * f, 1);
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(0, 0);
    g.bezierCurveTo(6, -18, 24, -20, 22, -4);
    g.bezierCurveTo(22, 4, 8, 4, 0, 0);
    g.fill();
    g.beginPath();
    g.moveTo(0, 0);
    g.bezierCurveTo(8, 2, 18, 8, 12, 16);
    g.bezierCurveTo(6, 18, 2, 8, 0, 0);
    g.fill();
    disc(g, 14, -8, 2.6, "rgba(255,250,235,0.9)");
    g.restore();
  }
  g.strokeStyle = C.ink;
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(0, -6);
  g.lineTo(0, 9);
  g.stroke();
  g.restore();
}
/** 灯笼：挂点在 (x,y) */
export function lantern(g: G, x: number, y: number, s: number, t: number, lit = 1, seed = 0) {
  const sw = Math.sin(t * 1.3 + seed) * 0.07;
  g.save();
  g.translate(x, y);
  g.rotate(sw);
  g.scale(s, s);
  if (lit > 0) glow(g, 0, 34, 70, "255,150,80", 0.4 * lit);
  g.strokeStyle = C.ink;
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(0, 16);
  g.stroke();
  g.fillStyle = lit > 0.5 ? "#e2452f" : "#8c2a22";
  g.beginPath();
  g.ellipse(0, 34, 15, 19, 0, 0, TAU);
  g.fill();
  g.strokeStyle = "rgba(90,12,8,0.55)";
  g.lineWidth = 1;
  for (const dx of [-8, 0, 8]) {
    g.beginPath();
    g.ellipse(0, 34, Math.abs(dx) || 0.5, 19, 0, 0, TAU);
    g.stroke();
  }
  g.fillStyle = C.gold;
  g.fillRect(-8, 13, 16, 4);
  g.fillRect(-8, 51, 16, 4);
  g.strokeStyle = C.gold;
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(0, 55);
  g.lineTo(0, 70);
  g.stroke();
  g.restore();
}
export function teapot(g: G, x: number, y: number, s = 1) {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  g.fillStyle = "#7c4a38";
  g.strokeStyle = "#7c4a38";
  g.lineWidth = 5;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(-16, -16);
  g.quadraticCurveTo(-30, -20, -32, -32);
  g.stroke();
  g.beginPath();
  g.arc(20, -18, 10, -1.2, 1.2);
  g.stroke();
  g.beginPath();
  g.ellipse(0, -16, 20, 16, 0, 0, TAU);
  g.fill();
  g.fillRect(-9, -36, 18, 5);
  disc(g, 0, -38, 3.4, "#7c4a38");
  g.fillStyle = "rgba(255,230,200,0.25)";
  g.beginPath();
  g.ellipse(-7, -20, 4, 7, 0.4, 0, TAU);
  g.fill();
  g.restore();
}
export function steam(g: G, x: number, y: number, t: number, h = 60, col = "255,255,255", a = 0.6, lean = 0) {
  g.save();
  g.lineCap = "round";
  g.lineWidth = 3;
  for (let j = 0; j < 2; j++) {
    for (let i = 0; i < 10; i++) {
      const u0 = i / 10, u1 = (i + 1) / 10;
      const px = (u: number) => x + (j ? 7 : -5) + Math.sin(u * 5 + t * 2.2 + j * 2) * (6 + u * 6) + lean * u * u;
      g.strokeStyle = `rgba(${col},${a * (1 - u0) * 0.9})`;
      g.beginPath();
      g.moveTo(px(u0), y - u0 * h);
      g.lineTo(px(u1), y - u1 * h);
      g.stroke();
    }
  }
  g.restore();
}
/** 牵挂：一根朱线，prog 画到几成，tens 越大越绷（会颤） */
export function thread(g: G, x0: number, y0: number, x1: number, y1: number, sag: number, t: number, prog = 1, wob = 3, lw = 2.2) {
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2 + sag + Math.sin(t * 2.4) * wob;
  const n = 48, m = Math.max(1, Math.floor(n * clamp(prog)));
  g.save();
  g.strokeStyle = C.red;
  g.lineWidth = lw;
  g.lineCap = "round";
  g.beginPath();
  for (let i = 0; i <= m; i++) {
    const u = i / n, v = 1 - u;
    const px = v * v * x0 + 2 * v * u * mx + u * u * x1;
    const py = v * v * y0 + 2 * v * u * my + u * u * y1 + Math.sin(u * 30 + t * 30) * (wob > 6 ? 1.5 : 0);
    if (i === 0) g.moveTo(px, py);
    else g.lineTo(px, py);
  }
  g.stroke();
  g.restore();
}
/** 图集里的小道具（碗、茶杯、沙漏、扇、算盘、卷轴）放大着用 */
export function prop(g: G, name: string, x: number, y: number, k: number, o: SpOpt = {}) {
  frame(g, "prop_" + name, x, y, k, { ...o, shadow: false });
}
export function fx(g: G, name: string, x: number, y: number, k: number, a = 1) {
  frame(g, "fx_" + name, x, y, k, { a, shadow: false });
}
/** 三个墨点：尴尬的沉默（不用省略号字形）*/
export function dots(g: G, x: number, y: number, u: number, col: string, r = 7, gap = 30) {
  for (let i = 0; i < 3; i++) {
    const k = eo(clamp(u * 3 - i));
    if (k > 0) disc(g, x + (i - 1) * gap, y, r * k, col);
  }
}
/** 柳条 */
export function willow(g: G, x: number, y: number, t: number, n: number, len: number, col: string, seed = 0) {
  g.save();
  g.strokeStyle = col;
  g.lineWidth = 2;
  g.lineCap = "round";
  for (let i = 0; i < n; i++) {
    const sx = x + (i - n / 2) * 13 + rnd(seed + i) * 8;
    const l = len * (0.6 + rnd(seed + i * 2.1) * 0.5);
    const sw = Math.sin(t * 0.9 + i * 0.6) * 16;
    g.beginPath();
    g.moveTo(sx, y + rnd(seed + i * 3.3) * 20);
    g.quadraticCurveTo(sx + sw * 0.4, y + l * 0.5, sx + sw, y + l);
    g.stroke();
  }
  g.restore();
}
/** 花树：根在 (x,y)，枝往 dir 那边探 */
export function blossomTree(g: G, x: number, y: number, s: number, dir: number, t: number, col = C.pink, trunk = "#3a2a22", seed = 0) {
  g.save();
  g.translate(x, y);
  g.scale(s * dir, s);
  g.strokeStyle = trunk;
  g.lineCap = "round";
  g.lineWidth = 16;
  g.beginPath();
  g.moveTo(0, 0);
  g.bezierCurveTo(-6, -90, 30, -150, 20, -230);
  g.stroke();
  g.lineWidth = 9;
  const br: number[][] = [[14, -150, 90, -200, 150, -250], [18, -200, -40, -250, -110, -270], [20, -230, 60, -290, 40, -340], [10, -110, -50, -150, -90, -150]];
  for (const b of br) {
    g.beginPath();
    g.moveTo(b[0], b[1]);
    g.quadraticCurveTo(b[2], b[3], b[4], b[5]);
    g.stroke();
  }
  for (let i = 0; i < 70; i++) {
    const b = br[i % 4];
    const u = 0.25 + rnd(seed + i * 1.3) * 0.85;
    const px = lerp(b[0], b[4], u) + (rnd(seed + i * 2.7) - 0.5) * 90;
    const py = lerp(b[1], b[5], u) + (rnd(seed + i * 3.9) - 0.5) * 70;
    const r = 13 + rnd(seed + i * 5.1) * 17 + Math.sin(t * 1.1 + i) * 1.2;
    g.globalAlpha = 0.55 + rnd(seed + i * 6.3) * 0.4;
    disc(g, px, py, r, i % 4 === 0 ? C.pink2 : i % 7 === 0 ? "#d9837e" : col);
  }
  g.restore();
}
