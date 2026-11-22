// 画笔库：像素纸片人 + 墨字 + 代码画的道具与场景。
// 规矩：只读传入的时间；缺帧直接报错，不拿别的造型顶替；道具与人物不画假接触。
import { RECTS, ACTIONS } from "./castData";

export const W = 1280;
export const H = 720;
export const FONT = "MVBrush";
export type G = CanvasRenderingContext2D;

let atlas: CanvasImageSource | null = null;
let tintCv: HTMLCanvasElement | null = null;
export function setAtlas(img: CanvasImageSource) {
  atlas = img;
}

// ---------- 数学 ----------
export const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
export const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const ss = (u: number) => {
  u = clamp(u);
  return u * u * (3 - 2 * u);
};
export const eo = (u: number) => 1 - Math.pow(1 - clamp(u), 3);
export const back = (u: number) => {
  u = clamp(u);
  const c = 1.9;
  return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2);
};
export const rnd = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export const TAU = Math.PI * 2;

export const C = {
  paper: "#efe6d2",
  paper2: "#e2d5b8",
  ink: "#1e1a17",
  ink2: "#4a4038",
  inkBlue: "#1d2b3a",
  red: "#b8312a",
  red2: "#e0644f",
  pink: "#f0a6a0",
  gold: "#d8a23e",
  gold2: "#f5d98f",
  jade: "#5f8f7c",
  teal: "#2f5d63",
  wood: "#5b3a26",
  wood2: "#8a5a37",
};

// ---------- 像素纸片人 ----------
/** 底边中点为锚点。fps 默认 8；loop=false 时停在末帧 */
export function actor(
  g: G,
  action: string,
  t: number,
  x: number,
  y: number,
  s: number,
  o: { fps?: number; flip?: boolean; alpha?: number; loop?: boolean; frame?: number; tint?: string; ta?: number } = {},
) {
  const frames = ACTIONS[action];
  if (!frames || !frames.length) throw new Error("缺帧：" + action);
  if (!atlas) throw new Error("图集未加载");
  const n = frames.length;
  let i = o.frame ?? Math.floor(Math.max(0, t) * (o.fps ?? 8));
  i = o.loop === false ? Math.min(i, n - 1) : ((i % n) + n) % n;
  const r = RECTS[frames[i]];
  const [sx, sy, sw, sh] = r;
  const dw = sw * s;
  const dh = sh * s;
  g.save();
  g.imageSmoothingEnabled = false;
  g.globalAlpha *= o.alpha ?? 1;
  g.translate(x, y);
  if (o.flip) g.scale(-1, 1);
  if (o.tint && (o.ta ?? 0) > 0) {
    // 罩色：先在小画布上只罩人物像素，再贴回来
    if (!tintCv) tintCv = document.createElement("canvas");
    tintCv.width = sw;
    tintCv.height = sh;
    const tg = tintCv.getContext("2d")!;
    tg.clearRect(0, 0, sw, sh);
    tg.drawImage(atlas, sx, sy, sw, sh, 0, 0, sw, sh);
    tg.globalCompositeOperation = "source-atop";
    tg.globalAlpha = o.ta ?? 0;
    tg.fillStyle = o.tint;
    tg.fillRect(0, 0, sw, sh);
    g.drawImage(tintCv, -dw / 2, -dh, dw, dh);
  } else {
    g.drawImage(atlas, sx, sy, sw, sh, -dw / 2, -dh, dw, dh);
  }
  g.restore();
  return { w: dw, h: dh };
}
/** 单帧小图（特效、头像、道具），中心为锚点 */
export function icon(g: G, name: string, x: number, y: number, s: number, alpha = 1, frame = 0) {
  const list = ACTIONS[name];
  if (!list) throw new Error("缺帧：" + name);
  const r = RECTS[list[frame % list.length]];
  if (!atlas) throw new Error("图集未加载");
  g.save();
  g.imageSmoothingEnabled = false;
  g.globalAlpha *= alpha;
  g.drawImage(atlas, r[0], r[1], r[2], r[3], x - (r[2] * s) / 2, y - (r[3] * s) / 2, r[2] * s, r[3] * s);
  g.restore();
}
/** 地面投影 */
export function shadow(g: G, x: number, y: number, w: number, a = 0.25) {
  g.save();
  g.fillStyle = `rgba(20,16,12,${a})`;
  g.beginPath();
  g.ellipse(x, y, w, w * 0.18, 0, 0, TAU);
  g.fill();
  g.restore();
}

// ---------- 纸与墨 ----------
export function paper(g: G, top = C.paper, bottom = C.paper2) {
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, top);
  gr.addColorStop(1, bottom);
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
}
/** 宣纸纤维（固定种子，逐帧不闪） */
export function grain(g: G, a = 0.06) {
  g.save();
  g.globalAlpha = a;
  g.strokeStyle = "#6b5a44";
  g.lineWidth = 1;
  for (let i = 0; i < 140; i++) {
    const x = rnd(i) * W;
    const y = rnd(i + 99) * H;
    const l = 6 + rnd(i + 7) * 22;
    const an = rnd(i + 3) * TAU;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + Math.cos(an) * l * 0.5 + 3, y + Math.sin(an) * l * 0.5, x + Math.cos(an) * l, y + Math.sin(an) * l);
    g.stroke();
  }
  g.restore();
}
export function vignette(g: G, a = 0.45) {
  const gr = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
  gr.addColorStop(0, "rgba(0,0,0,0)");
  gr.addColorStop(1, `rgba(20,12,6,${a})`);
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
}
/** 晕开的墨团：半径带噪声 */
export function inkBlob(g: G, x: number, y: number, r: number, seed: number, color = C.ink, a = 1) {
  if (r <= 0) return;
  g.save();
  g.globalAlpha *= a;
  g.fillStyle = color;
  g.beginPath();
  const n = 28;
  for (let i = 0; i <= n; i++) {
    const an = (i / n) * TAU;
    const rr = r * (0.82 + 0.25 * rnd(seed * 31 + (i % n)));
    const px = x + Math.cos(an) * rr;
    const py = y + Math.sin(an) * rr;
    i ? g.lineTo(px, py) : g.moveTo(px, py);
  }
  g.closePath();
  g.fill();
  // 飞白小点
  for (let i = 0; i < 9; i++) {
    const an = rnd(seed + i * 3) * TAU;
    const d = r * (1.05 + rnd(seed + i) * 0.4);
    g.beginPath();
    g.arc(x + Math.cos(an) * d, y + Math.sin(an) * d, r * 0.05 * (0.5 + rnd(seed - i)), 0, TAU);
    g.fill();
  }
  g.restore();
}
/** 远山（水墨层次） */
export function mountains(g: G, base: number, amp: number, seed: number, color: string, off = 0) {
  g.save();
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(0, H);
  for (let x = 0; x <= W; x += 8) {
    const u = (x + off) / 220;
    const y =
      base -
      amp * (0.55 * Math.sin(u + seed) + 0.3 * Math.sin(u * 2.3 + seed * 2) + 0.15 * Math.sin(u * 5.1 + seed * 3) + 0.6);
    g.lineTo(x, y);
  }
  g.lineTo(W, H);
  g.closePath();
  g.fill();
  g.restore();
}

/** 大墨字：笔势自上而下显出，p∈[0,1]；dissolve 时向外散开 */
export function glyph(
  g: G,
  text: string,
  x: number,
  y: number,
  size: number,
  p: number,
  o: { color?: string; alpha?: number; dissolve?: number; vertical?: boolean; stroke?: string } = {},
) {
  if (p <= 0) return;
  const dis = o.dissolve ?? 0;
  g.save();
  g.globalAlpha *= (o.alpha ?? 1) * (1 - dis);
  g.font = `${size}px ${FONT}, "STKaiti", "KaiTi", serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  const chars = [...text];
  const step = size * 0.98;
  chars.forEach((ch, i) => {
    const local = clamp(p * chars.length - i);
    if (local <= 0) return;
    const cx = o.vertical ? x : x + (i - (chars.length - 1) / 2) * step;
    const cy = o.vertical ? y + (i - (chars.length - 1) / 2) * step : y;
    g.save();
    g.beginPath();
    g.rect(cx - size, cy - size * 0.6, size * 2, size * 1.2 * ss(local) + 1);
    g.clip();
    const sc = 1 + dis * 0.25 + (1 - eo(local)) * 0.08;
    g.translate(cx, cy);
    g.scale(sc, sc);
    if (o.stroke) {
      g.strokeStyle = o.stroke;
      g.lineWidth = size * 0.06;
      g.lineJoin = "round";
      g.strokeText(ch, 0, 0);
    }
    g.fillStyle = o.color ?? C.ink;
    g.fillText(ch, 0, 0);
    g.restore();
  });
  g.restore();
}
/** 朱文印章 */
export function seal(g: G, text: string, x: number, y: number, s: number, p: number, rot = -0.06) {
  if (p <= 0) return;
  const k = back(p);
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.scale(k, k);
  g.globalAlpha *= clamp(p * 3);
  g.fillStyle = C.red;
  const chars = [...text];
  const w = s * (chars.length > 2 ? 1.6 : 1);
  g.fillRect(-w / 2, -s / 2, w, s);
  g.fillStyle = "#f6e9d6";
  g.font = `${chars.length > 2 ? s * 0.42 : s * 0.5}px ${FONT}, serif`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  if (chars.length <= 2) {
    chars.forEach((ch, i) => g.fillText(ch, 0, (i - (chars.length - 1) / 2) * s * 0.46));
  } else {
    const half = Math.ceil(chars.length / 2);
    chars.forEach((ch, i) => {
      const col = i < half ? 1 : 0;
      const row = i < half ? i : i - half;
      g.fillText(ch, (col - 0.5) * s * 0.7, (row - (half - 1) / 2) * s * 0.44);
    });
  }
  g.strokeStyle = "#f6e9d6";
  g.lineWidth = s * 0.04;
  g.strokeRect(-w / 2 + s * 0.07, -s / 2 + s * 0.07, w - s * 0.14, s - s * 0.14);
  g.restore();
}
export function text(g: G, s: string, x: number, y: number, size: number, color: string, align: CanvasTextAlign = "center", a = 1) {
  g.save();
  g.globalAlpha *= a;
  g.font = `${size}px ${FONT}, serif`;
  g.textAlign = align;
  g.textBaseline = "middle";
  g.fillStyle = color;
  g.fillText(s, x, y);
  g.restore();
}

// ---------- 天气 ----------
/** 雨：density 0..1，angle 斜度；固定种子按时间下落 */
export function rain(g: G, t: number, density: number, o: { color?: string; slant?: number; speed?: number; len?: number; seed?: number } = {}) {
  if (density <= 0) return;
  const n = Math.floor(260 * density);
  const sl = o.slant ?? 0.18;
  const sp = o.speed ?? 1100;
  const len = o.len ?? 26;
  g.save();
  g.strokeStyle = o.color ?? "rgba(200,220,235,0.55)";
  g.lineWidth = 1.6;
  g.beginPath();
  for (let i = 0; i < n; i++) {
    const s = (o.seed ?? 0) + i;
    const x0 = rnd(s) * (W + 300) - 150;
    const v = sp * (0.75 + rnd(s + 0.3) * 0.5);
    const y = ((rnd(s + 0.7) * (H + 100) + t * v) % (H + 100)) - 50;
    const x = x0 + y * sl;
    const l = len * (0.6 + rnd(s + 0.9) * 0.8);
    g.moveTo(x, y);
    g.lineTo(x - l * sl, y - l);
  }
  g.stroke();
  g.restore();
}
/** 地面涟漪 */
export function ripples(g: G, t: number, y0: number, y1: number, n: number, seed = 5, color = "rgba(210,225,235,0.5)") {
  g.save();
  g.strokeStyle = color;
  g.lineWidth = 1.4;
  for (let i = 0; i < n; i++) {
    const per = 0.7 + rnd(seed + i) * 0.6;
    const ph = ((t + rnd(seed + i * 2) * per) % per) / per;
    const k = Math.floor((t + rnd(seed + i * 2) * per) / per);
    const x = rnd(seed + i * 7 + k * 13) * W;
    const y = lerp(y0, y1, rnd(seed + i * 11 + k * 5));
    g.globalAlpha = 1 - ph;
    g.beginPath();
    g.ellipse(x, y, 4 + ph * 34, (4 + ph * 34) * 0.25, 0, 0, TAU);
    g.stroke();
  }
  g.restore();
}
export function cloud(g: G, x: number, y: number, s: number, color: string, a = 1) {
  g.save();
  g.globalAlpha *= a;
  g.fillStyle = color;
  const parts = [
    [0, 0, 1],
    [-0.9, 0.18, 0.7],
    [0.9, 0.15, 0.75],
    [-0.4, -0.35, 0.7],
    [0.45, -0.3, 0.65],
    [1.6, 0.3, 0.45],
    [-1.6, 0.32, 0.45],
  ];
  g.beginPath();
  for (const [dx, dy, r] of parts) {
    g.moveTo(x + dx * s + r * s, y + dy * s);
    g.arc(x + dx * s, y + dy * s, r * s, 0, TAU);
  }
  g.fill();
  // 祥云卷纹
  g.strokeStyle = "rgba(255,255,255,0.25)";
  g.lineWidth = s * 0.06;
  g.beginPath();
  g.arc(x - s * 0.3, y + s * 0.1, s * 0.3, Math.PI, TAU * 0.95);
  g.stroke();
  g.restore();
}

// ---------- 道具（全部代码画） ----------
/** 油纸花伞：open 0..1，rot 旋转（俯视花纹），tilt 倾斜 */
export function umbrella(g: G, x: number, y: number, r: number, open: number, spin: number, tilt = 0, closed = false) {
  g.save();
  g.translate(x, y);
  g.rotate(tilt);
  // 伞柄
  g.strokeStyle = C.wood;
  g.lineWidth = Math.max(3, r * 0.05);
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(0, -r * 0.1);
  g.lineTo(0, r * 1.25);
  g.stroke();
  g.beginPath();
  g.arc(-r * 0.09, r * 1.25, r * 0.09, 0, Math.PI);
  g.stroke();
  if (closed) {
    g.fillStyle = C.red;
    g.beginPath();
    g.moveTo(0, -r * 0.35);
    g.lineTo(r * 0.12, r * 0.6);
    g.lineTo(-r * 0.12, r * 0.6);
    g.closePath();
    g.fill();
    g.restore();
    return;
  }
  const w = r * lerp(0.15, 1, eo(open));
  const h = r * lerp(0.9, 0.42, eo(open));
  // 伞面（侧视穹顶，分瓣）
  const ribs = 10;
  for (let i = 0; i < ribs; i++) {
    const a0 = i / ribs;
    const a1 = (i + 1) / ribs;
    const x0 = lerp(-w, w, a0);
    const x1 = lerp(-w, w, a1);
    const odd = (i + Math.floor(spin * 3)) % 2 === 0;
    g.fillStyle = odd ? C.red : C.red2;
    g.beginPath();
    g.moveTo(0, -h);
    g.quadraticCurveTo(x0 * 0.7, -h * 0.75, x0, 0);
    g.quadraticCurveTo((x0 + x1) / 2, r * 0.08, x1, 0);
    g.quadraticCurveTo(x1 * 0.7, -h * 0.75, 0, -h);
    g.fill();
  }
  // 伞面花：随旋转横移
  for (let i = 0; i < 7; i++) {
    const u = ((i / 7 + spin * 0.15) % 1) * 2 - 1;
    const fx = u * w * 0.82;
    const fy = -h * 0.35 * (1 - u * u) - 4;
    const fr = r * 0.09 * (1 - Math.abs(u) * 0.5);
    flower(g, fx, fy, fr, i % 2 ? "#ffe2b8" : "#ffd1dc", C.gold, 5);
  }
  // 伞骨尖
  g.fillStyle = C.ink;
  g.beginPath();
  g.arc(0, -h, r * 0.035, 0, TAU);
  g.fill();
  g.restore();
}
export function flower(g: G, x: number, y: number, r: number, petal: string, core: string, n = 5, rot = 0, open = 1) {
  if (r <= 0 || open <= 0) return;
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.fillStyle = petal;
  for (let i = 0; i < n; i++) {
    g.save();
    g.rotate((i / n) * TAU);
    g.beginPath();
    g.ellipse(0, -r * 0.55 * open, r * 0.38, r * 0.6 * open, 0, 0, TAU);
    g.fill();
    g.restore();
  }
  g.fillStyle = core;
  g.beginPath();
  g.arc(0, 0, r * 0.25, 0, TAU);
  g.fill();
  g.restore();
}
/** 牡丹：层层花瓣 */
export function peony(g: G, x: number, y: number, r: number, open: number, hue: "pink" | "red" | "white" = "pink") {
  if (open <= 0) return;
  const cols = hue === "pink" ? ["#e98a9a", "#f2aab5", "#f8cdd3"] : hue === "red" ? ["#a8262c", "#cf4646", "#e9787a"] : ["#e9e2d6", "#f4efe6", "#fffaf2"];
  g.save();
  g.translate(x, y);
  const k = eo(open);
  for (let layer = 0; layer < 3; layer++) {
    const rr = r * (1 - layer * 0.28) * k;
    const n = 9 - layer * 2;
    g.fillStyle = cols[layer];
    for (let i = 0; i < n; i++) {
      const an = (i / n) * TAU + layer * 0.4;
      g.beginPath();
      g.ellipse(Math.cos(an) * rr * 0.45, Math.sin(an) * rr * 0.45, rr * 0.5, rr * 0.38, an, 0, TAU);
      g.fill();
    }
  }
  g.fillStyle = C.gold2;
  g.beginPath();
  g.arc(0, 0, r * 0.12 * k, 0, TAU);
  g.fill();
  // 叶
  g.fillStyle = "#4f7a52";
  for (const s of [-1, 1]) {
    g.beginPath();
    g.ellipse(s * r * 0.95 * k, r * 0.55 * k, r * 0.42 * k, r * 0.16 * k, s * 0.5, 0, TAU);
    g.fill();
  }
  g.restore();
}
/** 铜钟 */
export function bell(g: G, x: number, y: number, s: number, swing: number) {
  g.save();
  g.translate(x, y);
  g.rotate(swing);
  g.strokeStyle = C.wood;
  g.lineWidth = s * 0.06;
  g.beginPath();
  g.moveTo(0, -s * 1.4);
  g.lineTo(0, -s * 0.95);
  g.stroke();
  const gr = g.createLinearGradient(-s, 0, s, 0);
  gr.addColorStop(0, "#6b4b22");
  gr.addColorStop(0.35, "#c9933e");
  gr.addColorStop(0.55, "#f0c56a");
  gr.addColorStop(1, "#5e401c");
  g.fillStyle = gr;
  g.beginPath();
  g.moveTo(-s * 0.35, -s * 0.95);
  g.quadraticCurveTo(-s * 0.55, -s * 0.2, -s * 0.8, s * 0.55);
  g.lineTo(s * 0.8, s * 0.55);
  g.quadraticCurveTo(s * 0.55, -s * 0.2, s * 0.35, -s * 0.95);
  g.closePath();
  g.fill();
  // 钟纹
  g.strokeStyle = "rgba(60,35,10,0.6)";
  g.lineWidth = s * 0.03;
  for (const yy of [-0.55, 0.05, 0.38]) {
    g.beginPath();
    g.moveTo(-s * (0.42 + (yy + 0.95) * 0.27), s * yy);
    g.lineTo(s * (0.42 + (yy + 0.95) * 0.27), s * yy);
    g.stroke();
  }
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 2; j++) {
      g.fillStyle = "rgba(90,60,20,0.7)";
      g.beginPath();
      g.arc(-s * 0.25 + i * s * 0.25, -s * 0.38 + j * s * 0.17, s * 0.04, 0, TAU);
      g.fill();
    }
  g.restore();
}
/** 茶壶（浮空，带光点） */
export function teapot(g: G, x: number, y: number, s: number, tilt: number) {
  g.save();
  g.translate(x, y);
  g.rotate(tilt);
  g.fillStyle = "#e9eef0";
  g.strokeStyle = "#34506a";
  g.lineWidth = s * 0.05;
  // 壶身
  g.beginPath();
  g.ellipse(0, 0, s, s * 0.78, 0, 0, TAU);
  g.fill();
  g.stroke();
  // 壶嘴
  g.beginPath();
  g.moveTo(s * 0.85, s * 0.1);
  g.quadraticCurveTo(s * 1.45, s * 0.05, s * 1.65, -s * 0.55);
  g.lineTo(s * 1.45, -s * 0.6);
  g.quadraticCurveTo(s * 1.25, -s * 0.15, s * 0.82, -s * 0.2);
  g.fill();
  g.stroke();
  // 把手
  g.beginPath();
  g.arc(-s * 1.05, 0, s * 0.38, Math.PI * 0.5, Math.PI * 1.5);
  g.stroke();
  // 盖
  g.beginPath();
  g.ellipse(0, -s * 0.72, s * 0.45, s * 0.12, 0, 0, TAU);
  g.fill();
  g.stroke();
  g.fillStyle = "#34506a";
  g.beginPath();
  g.arc(0, -s * 0.86, s * 0.1, 0, TAU);
  g.fill();
  // 青花
  g.strokeStyle = "#3b6aa0";
  g.lineWidth = s * 0.04;
  g.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = -0.9 + i * 0.45;
    g.moveTo(Math.cos(a + 1.6) * s * 0.5, Math.sin(a + 1.6) * s * 0.3 + s * 0.1);
    g.arc(Math.cos(a + 1.6) * s * 0.5, Math.sin(a + 1.6) * s * 0.3 + s * 0.1, s * 0.1, 0, TAU);
  }
  g.stroke();
  g.restore();
}
/** 玻璃茶杯（侧视）：fill 0..1 水位，bloom 0..1 茉莉开放 */
export function glassCup(g: G, x: number, y: number, s: number, fill: number, bloom: number) {
  g.save();
  g.translate(x, y);
  const top = -s * 1.2;
  // 水
  if (fill > 0) {
    const wy = lerp(s * 0.05, top + s * 0.18, fill);
    const gr = g.createLinearGradient(0, wy, 0, 0);
    gr.addColorStop(0, "rgba(232,206,120,0.75)");
    gr.addColorStop(1, "rgba(196,150,60,0.85)");
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(-s * 0.62 + (wy / top) * -s * 0.1, wy);
    g.lineTo(s * 0.62 + (wy / top) * s * 0.1, wy);
    g.lineTo(s * 0.6, 0);
    g.lineTo(-s * 0.6, 0);
    g.closePath();
    g.fill();
    // 茉莉
    if (bloom > 0) {
      const fy = lerp(-s * 0.25, wy + s * 0.12, eo(bloom));
      flower(g, 0, fy, s * 0.42 * eo(bloom), "#fffdf4", "#f3d26b", 6, bloom * 0.6, bloom);
      flower(g, 0, fy, s * 0.22 * eo(bloom), "#fff7e0", "#e8b94a", 5, -bloom * 0.4, bloom);
    }
  }
  // 杯身
  g.strokeStyle = "rgba(255,255,255,0.9)";
  g.lineWidth = s * 0.05;
  g.beginPath();
  g.moveTo(-s * 0.72, top);
  g.lineTo(-s * 0.6, 0);
  g.quadraticCurveTo(0, s * 0.1, s * 0.6, 0);
  g.lineTo(s * 0.72, top);
  g.stroke();
  g.beginPath();
  g.ellipse(0, top, s * 0.72, s * 0.12, 0, 0, TAU);
  g.stroke();
  g.fillStyle = "rgba(255,255,255,0.18)";
  g.fillRect(-s * 0.55, top + s * 0.15, s * 0.1, s * 0.85);
  g.restore();
}
/** 水流（从 a 点到 b 点的弧） */
export function pour(g: G, ax: number, ay: number, bx: number, by: number, p: number, t: number) {
  if (p <= 0) return;
  g.save();
  g.strokeStyle = "rgba(225,190,100,0.85)";
  g.lineWidth = 7;
  g.lineCap = "round";
  g.setLineDash([16, 6]);
  g.lineDashOffset = -t * 220;
  g.beginPath();
  g.moveTo(ax, ay);
  const ey = lerp(ay, by, p);
  g.quadraticCurveTo(ax + (bx - ax) * 0.9, ay, bx, ey);
  g.stroke();
  g.restore();
}
/** 蒸汽 */
export function steam(g: G, x: number, y: number, t: number, a = 1, s = 1) {
  g.save();
  g.strokeStyle = `rgba(255,255,255,${0.55 * a})`;
  g.lineWidth = 4 * s;
  g.lineCap = "round";
  for (let k = 0; k < 3; k++) {
    g.beginPath();
    for (let i = 0; i <= 20; i++) {
      const u = i / 20;
      const px = x + (k - 1) * 22 * s + Math.sin(u * 6 + t * 4 + k) * 9 * s;
      const py = y - u * 110 * s - ((t * 30) % 10);
      i ? g.lineTo(px, py) : g.moveTo(px, py);
    }
    g.stroke();
  }
  g.restore();
}
/** 大袖（水袖） */
export function sleeve(g: G, x: number, y: number, s: number, dir: number, wave: number, color = "#f3f0ea") {
  g.save();
  g.translate(x, y);
  g.scale(dir, 1);
  // 水袖：从肩头向外甩出，越往外越宽、越飘，绸面半透明
  const L = s * 3.2;
  const N = 40;
  const top = (u: number) => -s * 0.12 - u * s * 0.9 + Math.sin(u * 7 - wave * 7) * s * 0.35 * u;
  const bot = (u: number) => s * 0.12 + u * s * 0.25 + Math.sin(u * 7 - wave * 7 + 0.9) * s * 0.45 * u;
  const gr = g.createLinearGradient(0, 0, L, 0);
  gr.addColorStop(0, color);
  gr.addColorStop(1, "rgba(220,232,245,0.55)");
  g.fillStyle = gr;
  g.beginPath();
  g.moveTo(0, top(0));
  for (let i = 1; i <= N; i++) g.lineTo((i / N) * L, top(i / N));
  for (let i = N; i >= 0; i--) g.lineTo((i / N) * L, bot(i / N));
  g.closePath();
  g.globalAlpha *= 0.92;
  g.fill();
  // 绸纹
  g.strokeStyle = "rgba(90,120,160,0.35)";
  g.lineWidth = 2;
  for (const k of [0.3, 0.55, 0.8]) {
    g.beginPath();
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const y = lerp(top(u), bot(u), k);
      i ? g.lineTo(u * L, y) : g.moveTo(u * L, y);
    }
    g.stroke();
  }
  // 袖口滚边
  g.strokeStyle = "#3d6aa8";
  g.lineWidth = 5;
  g.beginPath();
  g.moveTo(L, top(1));
  g.lineTo(L, bot(1));
  g.stroke();
  g.restore();
}
export function coin(g: G, x: number, y: number, r: number, rot: number) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.fillStyle = "#c58f34";
  g.strokeStyle = "#6e4a17";
  g.lineWidth = r * 0.12;
  g.beginPath();
  g.arc(0, 0, r, 0, TAU);
  g.fill();
  g.stroke();
  g.fillStyle = "rgba(0,0,0,0.0)";
  g.clearRect(0, 0, 0, 0);
  g.fillStyle = "#3a2a14";
  g.fillRect(-r * 0.28, -r * 0.28, r * 0.56, r * 0.56);
  g.restore();
}
export function leaf(g: G, x: number, y: number, s: number, rot: number, color = "#7a9a5a") {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.fillStyle = color;
  g.beginPath();
  g.ellipse(0, 0, s, s * 0.4, 0, 0, TAU);
  g.fill();
  g.strokeStyle = "rgba(0,0,0,0.25)";
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(-s, 0);
  g.lineTo(s, 0);
  g.stroke();
  g.restore();
}
/** 心（矢量） */
export function heart(g: G, x: number, y: number, s: number, color = C.red, a = 1) {
  if (s <= 0) return;
  g.save();
  g.globalAlpha *= a;
  g.translate(x, y);
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(0, s * 0.35);
  g.bezierCurveTo(-s * 1.1, -s * 0.35, -s * 0.5, -s * 1.05, 0, -s * 0.45);
  g.bezierCurveTo(s * 0.5, -s * 1.05, s * 1.1, -s * 0.35, 0, s * 0.35);
  g.fill();
  g.restore();
}
/** 雨滴（矢量） */
export function drop(g: G, x: number, y: number, s: number, color = "#8fb4cf", a = 1) {
  g.save();
  g.globalAlpha *= a;
  g.translate(x, y);
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(0, -s);
  g.bezierCurveTo(s * 0.15, -s * 0.5, s * 0.6, 0, s * 0.6, s * 0.3);
  g.arc(0, s * 0.3, s * 0.6, 0, Math.PI);
  g.bezierCurveTo(-s * 0.6, 0, -s * 0.15, -s * 0.5, 0, -s);
  g.fill();
  g.restore();
}
/** 乌鸦剪影 */
export function crow(g: G, x: number, y: number, s: number, flap: number) {
  g.save();
  g.translate(x, y);
  g.fillStyle = C.ink;
  g.beginPath();
  g.ellipse(0, 0, s, s * 0.35, 0, 0, TAU);
  g.fill();
  g.beginPath();
  g.arc(s * 0.95, -s * 0.15, s * 0.3, 0, TAU);
  g.fill();
  g.beginPath();
  g.moveTo(s * 1.2, -s * 0.15);
  g.lineTo(s * 1.55, -s * 0.05);
  g.lineTo(s * 1.2, 0);
  g.fill();
  const wy = Math.sin(flap) * s * 1.1;
  g.beginPath();
  g.moveTo(-s * 0.3, 0);
  g.quadraticCurveTo(-s * 0.2, wy - s * 0.4, s * 0.5, wy - s * 0.2);
  g.lineTo(s * 0.3, 0);
  g.fill();
  g.beginPath();
  g.moveTo(-s, 0);
  g.lineTo(-s * 1.5, -s * 0.2);
  g.lineTo(-s * 1.4, s * 0.15);
  g.fill();
  g.restore();
}
/** 雁（人字） */
export function goose(g: G, x: number, y: number, s: number, flap: number, color = C.ink) {
  g.save();
  g.strokeStyle = color;
  g.lineWidth = Math.max(1.5, s * 0.18);
  g.lineCap = "round";
  const k = Math.sin(flap) * s * 0.5;
  g.beginPath();
  g.moveTo(x - s, y - k);
  g.quadraticCurveTo(x - s * 0.4, y - s * 0.3, x, y);
  g.quadraticCurveTo(x + s * 0.4, y - s * 0.3, x + s, y - k);
  g.stroke();
  g.restore();
}
/** 拼图块：带凸起（右）或凹槽（左） */
export function puzzle(g: G, x: number, y: number, s: number, side: "tab" | "slot", color: string) {
  g.save();
  g.translate(x, y);
  g.fillStyle = color;
  g.strokeStyle = C.ink;
  g.lineWidth = 5;
  g.beginPath();
  g.moveTo(-s, -s);
  g.lineTo(s, -s);
  if (side === "tab") {
    g.lineTo(s, -s * 0.3);
    g.arc(s + s * 0.28, 0, s * 0.34, Math.PI * 1.3, Math.PI * 0.7, false);
    g.lineTo(s, s * 0.3);
  }
  g.lineTo(s, s);
  g.lineTo(-s, s);
  if (side === "slot") {
    g.lineTo(-s, s * 0.3);
    g.arc(-s + s * 0.28, 0, s * 0.34, Math.PI * 0.7, Math.PI * 1.3, true);
    g.lineTo(-s, -s * 0.3);
  }
  g.closePath();
  g.fill();
  g.stroke();
  g.restore();
}
/** 红线 */
export function redThread(g: G, ax: number, ay: number, bx: number, by: number, p: number, t: number) {
  if (p <= 0) return;
  g.save();
  g.strokeStyle = C.red;
  g.lineWidth = 4;
  g.lineCap = "round";
  g.beginPath();
  const n = 40;
  for (let i = 0; i <= n * p; i++) {
    const u = i / n;
    const x = lerp(ax, bx, u);
    const y = lerp(ay, by, u) + Math.sin(u * Math.PI) * 60 + Math.sin(u * 14 - t * 5) * 6 * (1 - u);
    i ? g.lineTo(x, y) : g.moveTo(x, y);
  }
  g.stroke();
  g.restore();
}
/** 屋檐（瓦片侧视） */
export function eave(g: G, x0: number, x1: number, y: number, color = "#2c2a2e") {
  g.save();
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(x0 - 30, y + 30);
  g.quadraticCurveTo(x0, y + 10, x0 + 40, y);
  g.lineTo(x1 - 40, y);
  g.quadraticCurveTo(x1, y + 10, x1 + 30, y + 30);
  g.lineTo(x1 + 30, y + 44);
  g.lineTo(x0 - 30, y + 44);
  g.closePath();
  g.fill();
  g.fillStyle = "rgba(255,255,255,0.08)";
  for (let x = x0; x < x1; x += 22) g.fillRect(x, y + 6, 10, 34);
  g.restore();
}
/** 灯笼 */
export function lantern(g: G, x: number, y: number, s: number, sway: number, glow = 1) {
  g.save();
  g.translate(x, y);
  g.rotate(sway);
  if (glow > 0) {
    const gr = g.createRadialGradient(0, s * 1.2, 0, 0, s * 1.2, s * 3);
    gr.addColorStop(0, `rgba(255,190,90,${0.45 * glow})`);
    gr.addColorStop(1, "rgba(255,190,90,0)");
    g.fillStyle = gr;
    g.fillRect(-s * 3, -s * 2, s * 6, s * 6);
  }
  g.strokeStyle = C.ink;
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(0, s * 0.5);
  g.stroke();
  g.fillStyle = "#d4432f";
  g.beginPath();
  g.ellipse(0, s * 1.2, s * 0.7, s * 0.75, 0, 0, TAU);
  g.fill();
  g.fillStyle = "#3a2a1a";
  g.fillRect(-s * 0.35, s * 0.4, s * 0.7, s * 0.12);
  g.fillRect(-s * 0.35, s * 1.9, s * 0.7, s * 0.12);
  g.strokeStyle = "rgba(255,220,150,0.5)";
  g.lineWidth = 1.5;
  for (const k of [-0.35, 0, 0.35]) {
    g.beginPath();
    g.ellipse(0, s * 1.2, s * 0.7 * Math.abs(k) + 0.1, s * 0.75, 0, 0, TAU);
    g.stroke();
  }
  g.restore();
}
/** 琵琶（作为画面意象独立出现，不贴在人身上） */
export function pipa(g: G, x: number, y: number, s: number, rot: number, strum = 0) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.fillStyle = "#9a5b2c";
  g.strokeStyle = "#3d2412";
  g.lineWidth = s * 0.04;
  g.beginPath();
  g.moveTo(0, -s * 0.5);
  g.bezierCurveTo(s * 0.75, -s * 0.35, s * 0.62, s * 0.95, 0, s * 0.95);
  g.bezierCurveTo(-s * 0.62, s * 0.95, -s * 0.75, -s * 0.35, 0, -s * 0.5);
  g.fill();
  g.stroke();
  g.fillStyle = "#5a3418";
  g.fillRect(-s * 0.08, -s * 1.35, s * 0.16, s * 0.9);
  g.beginPath();
  g.moveTo(-s * 0.12, -s * 1.35);
  g.quadraticCurveTo(0, -s * 1.6, s * 0.2, -s * 1.55);
  g.lineTo(s * 0.12, -s * 1.35);
  g.fill();
  g.fillStyle = "#e9d7b0";
  g.fillRect(-s * 0.22, s * 0.6, s * 0.44, s * 0.06);
  g.strokeStyle = "rgba(245,235,210,0.9)";
  g.lineWidth = Math.max(1, s * 0.012);
  for (let i = 0; i < 4; i++) {
    const dx = (i - 1.5) * s * 0.06;
    const vib = Math.sin(strum * 40 + i) * s * 0.012 * strum;
    g.beginPath();
    g.moveTo(dx, -s * 1.3);
    g.quadraticCurveTo(dx + vib, -s * 0.3, dx, s * 0.62);
    g.stroke();
  }
  g.restore();
}
