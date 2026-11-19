// 《譬如我》大字版工具层：整屏大字、黑白对撞、蓝紫渐变、划痕颗粒、闪白、聚光楔形。
// 画面语言照样片（譬如我.mp4）来：字是主角，人物是站在字上 / 字下 / 字缝里的小小一个。
import { LINES, type LineT } from "./lyricsData";
import { C as C0, G, H, W, TAU, SpOpt, act, cached, clamp, disc, eo, frame, lerp, rnd, rr, seg, ss } from "./core";

export { W, H, TAU, clamp, lerp, seg, ss, eo, rnd, disc, rr, act, frame, cached };
export type { G, SpOpt };

export const HEAVY = "MVHeavy";
export const BRUSH = "MVBrush";
const FB = `"PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif`;
export const fontOf = (f: "heavy" | "brush", size: number) => (f === "heavy" ? `${size}px ${HEAVY},${FB}` : `${size}px ${BRUSH},"Kaiti SC","KaiTi",${FB}`);

// ---------- 色 ----------
export const INK = "#0b0b0f";
export const PAPER = "#ecebe6";
export const WARM = "#f2e8d8";
export const VIO = "#5a5fd8";
export const VIO2 = "#9ea2f5";
export const RED = C0.red;
export const GOLD = "#d9a441";
export const MOLD = "#6f9a4e";

/** 三种底：夜（黑底白字）/ 昼（白底黑字）/ 黎明（暖纸底、蓝紫与金） */
export type Pol = 0 | 1 | 2;
export interface Pal {
  bg: string;
  fg: string;
  dim: string; // 次要字
  wedge: string; // 聚光楔形
  sil: string; // 剪影
  dark: boolean;
  blend: GlobalCompositeOperation; // 颗粒叠加方式
}
export const PALS: Pal[] = [
  { bg: INK, fg: "#f1f0ea", dim: "rgba(241,240,234,0.5)", wedge: "rgba(236,235,230,0.16)", sil: "#000000", dark: true, blend: "screen" },
  { bg: PAPER, fg: INK, dim: "rgba(11,11,15,0.5)", wedge: "rgba(11,11,15,0.08)", sil: "#101014", dark: false, blend: "multiply" },
  { bg: WARM, fg: "#2a2140", dim: "rgba(42,33,64,0.5)", wedge: "rgba(217,164,65,0.18)", sil: "#2a2140", dark: false, blend: "multiply" },
];

// ---------- 歌词 ----------
const MAP = new Map(LINES.map((l) => [l.id, l]));
export const L = (id: string): LineT => {
  const l = MAP.get(id);
  if (!l) throw new Error("没有这句：" + id);
  return l;
};
/** 第 i 个字从起音开始的进度（零到一） */
export const cp = (l: LineT, T: number, i: number, d = 0.16) => clamp((T - l.t[Math.min(i, l.t.length - 1)]) / d);
/** 整句进度 */
export const lp = (l: LineT, T: number) => clamp((T - l.s) / (l.e - l.s));
/** 唱到第几个字了（-1 还没开始） */
export const sung = (l: LineT, T: number) => {
  let k = -1;
  l.t.forEach((t, i) => {
    if (T >= t) k = i;
  });
  return k;
};
/** 以某字起音为零点的秒数 */
export const since = (l: LineT, T: number, i: number) => T - l.t[Math.min(i, l.t.length - 1)];

// ---------- 大字 ----------
export interface Sty {
  font?: "heavy" | "brush";
  fill?: string | CanvasGradient; // 不传 = 调色板前景
  grad?: boolean; // 蓝紫竖向渐变（样片里「传颂」那种）
  stroke?: string;
  lw?: number;
  ca?: number; // 色差位移像素
  a?: number;
  rot?: number;
  erode?: number; // 0–1 字面上被划掉多少
  shadow?: string;
}
let PAL: Pal = PALS[0];
export const setPal = (p: Pol) => (PAL = PALS[p]);
export const pal = () => PAL;

export function vioGrad(g: G, y0: number, y1: number) {
  const gr = g.createLinearGradient(0, y0, 0, y1);
  gr.addColorStop(0, "#c9cbff");
  gr.addColorStop(0.45, VIO2);
  gr.addColorStop(1, VIO);
  return gr;
}
/** 一个字，中心对齐在 (x,y)，高 size */
export function glyph(g: G, ch: string, x: number, y: number, size: number, s: Sty = {}) {
  if ((s.a ?? 1) <= 0 || size < 1) return;
  g.save();
  g.translate(x, y);
  if (s.rot) g.rotate(s.rot);
  g.globalAlpha *= s.a ?? 1;
  g.font = fontOf(s.font ?? "heavy", size);
  g.textAlign = "center";
  g.textBaseline = "middle";
  const yo = s.font === "brush" ? size * 0.04 : size * 0.06; // 字面重心略偏上，往下挪一点
  if (s.ca) {
    g.globalCompositeOperation = PAL.dark ? "screen" : "multiply";
    g.fillStyle = "rgba(120,130,255,0.55)";
    g.fillText(ch, -s.ca, yo);
    g.fillStyle = "rgba(255,90,90,0.4)";
    g.fillText(ch, s.ca, yo);
    g.globalCompositeOperation = "source-over";
  }
  if (s.shadow) {
    g.fillStyle = s.shadow;
    g.fillText(ch, size * 0.03, yo + size * 0.03);
  }
  g.fillStyle = s.grad ? vioGrad(g, -size * 0.5, size * 0.5) : s.fill ?? PAL.fg;
  g.fillText(ch, 0, yo);
  if (s.stroke) {
    g.strokeStyle = s.stroke;
    g.lineWidth = s.lw ?? Math.max(1.5, size * 0.02);
    g.lineJoin = "round";
    g.strokeText(ch, 0, yo);
  }
  if (s.erode) scratchOver(g, -size * 0.55, -size * 0.55 + yo, size * 1.1, size * 1.1, s.erode, PAL.bg);
  g.restore();
}
/** 用底色划几刀，让字像被刮花了 */
function scratchOver(g: G, x: number, y: number, w: number, h: number, k: number, col: string) {
  g.save();
  g.strokeStyle = col;
  g.lineCap = "round";
  const n = Math.floor(3 + k * 14);
  for (let i = 0; i < n; i++) {
    const s = i * 7.3 + w;
    g.lineWidth = 0.8 + rnd(s) * 2.2 * k;
    g.globalAlpha = 0.5 + rnd(s + 1) * 0.5;
    const sx = x + rnd(s + 2) * w, sy = y + rnd(s + 3) * h, a = -0.5 + rnd(s + 4) * 1.0, l = w * (0.3 + rnd(s + 5) * 0.8);
    g.beginPath();
    g.moveTo(sx, sy);
    g.lineTo(sx + Math.cos(a) * l, sy + Math.sin(a) * l);
    g.stroke();
  }
  g.restore();
}
/** 砸进来：先大后小带一点回弹 */
export const slam = (u: number) => (u >= 1 ? 1 : 1 + (1 - eo(u)) * 0.32 - Math.sin(clamp(u) * Math.PI) * 0.06);
/** 弹出：从零长到一，过冲 */
export const pop = (u: number) => {
  u = clamp(u);
  return u >= 1 ? 1 : 1 - Math.pow(1 - u, 3) * Math.cos(u * 9) * 1.0;
};

export interface RowOpt extends Sty {
  gap?: number; // 字距（倍）
  prog?: (i: number) => number; // 每个字的进入进度
  enter?: "slam" | "pop" | "rise" | "drop" | "none";
  jit?: number; // 抖动幅度
  t?: number; // 抖动用的时间
  dir?: "row" | "col";
}
/** 一行（或一列）字，整体中心在 (cx,cy) */
export function text(g: G, s: string, cx: number, cy: number, size: number, o: RowOpt = {}) {
  const n = s.length, gap = size * (1 + (o.gap ?? 0.06)), col = o.dir === "col";
  const span = gap * (n - 1);
  for (let i = 0; i < n; i++) {
    const p = o.prog ? clamp(o.prog(i)) : 1;
    if (p <= 0) continue;
    let k = 1, dx = 0, dy = 0, a = o.a ?? 1;
    const en = o.enter ?? "slam";
    if (en === "slam") {
      k = slam(p);
      a *= Math.min(1, p * 3);
    } else if (en === "pop") k = pop(p);
    else if (en === "rise") {
      dy = (1 - eo(p)) * size * 0.5;
      a *= p;
    } else if (en === "drop") {
      dy = -(1 - eo(p)) * size * 0.8;
      a *= p;
    }
    if (o.jit && o.t !== undefined) {
      dx += (rnd(i + Math.floor(o.t * 24) * 3.1) - 0.5) * o.jit;
      dy += (rnd(i * 7 + Math.floor(o.t * 24) * 1.7) - 0.5) * o.jit;
    }
    const x = col ? cx : cx - span / 2 + i * gap, y = col ? cy - span / 2 + i * gap : cy;
    glyph(g, s[i], x + dx, y + dy, size * k, { ...o, a });
  }
}
/** 一句歌词：按实测的逐字起音进入 */
export function lyricRow(g: G, l: LineT, T: number, cx: number, cy: number, size: number, o: RowOpt = {}, d = 0.16) {
  text(g, l.text, cx, cy, size, { prog: (i) => cp(l, T, i, d), ...o });
}
/** 把一句话的字平铺满整个宽度（样片里「等不到一场」那种），从 x0 到 x1 */
export function spread(g: G, l: LineT, T: number, x0: number, x1: number, cy: number, size: number, o: RowOpt = {}, d = 0.16) {
  const n = l.text.length;
  for (let i = 0; i < n; i++) {
    const p = cp(l, T, i, d);
    if (p <= 0) continue;
    const x = n === 1 ? (x0 + x1) / 2 : lerp(x0, x1, i / (n - 1));
    glyph(g, l.text[i], x, cy, size * (o.enter === "none" ? 1 : slam(p)), { ...o, a: (o.a ?? 1) * Math.min(1, p * 3) });
  }
}

// ---------- 底、光、质感 ----------
export function bg(g: G, p: Pol, t = 0) {
  setPal(p);
  const P = PALS[p];
  g.fillStyle = P.bg;
  g.fillRect(0, 0, W, H);
  // 纸纹 / 暗部呼吸
  const tex = cached("bgtex" + p, W, H, (q) => {
    for (let i = 0; i < 2600; i++) {
      const x = rnd(i * 1.7) * W, y = rnd(i * 2.9) * H, r = 0.5 + rnd(i * 3.3) * 1.4;
      q.fillStyle = P.dark ? `rgba(255,255,255,${0.02 + rnd(i) * 0.05})` : `rgba(0,0,0,${0.02 + rnd(i) * 0.05})`;
      q.fillRect(x, y, r, r);
    }
    for (let i = 0; i < 40; i++) {
      q.strokeStyle = P.dark ? `rgba(255,255,255,${0.02 + rnd(i * 5) * 0.04})` : `rgba(0,0,0,${0.02 + rnd(i * 5) * 0.05})`;
      q.lineWidth = 0.6 + rnd(i * 6) * 1.2;
      const x = rnd(i * 7) * W, y = rnd(i * 8) * H, l = 40 + rnd(i * 9) * 260, a = (rnd(i * 10) - 0.5) * 0.6;
      q.beginPath();
      q.moveTo(x, y);
      q.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
      q.stroke();
    }
  });
  g.drawImage(tex, 0, 0);
  if (P.dark) {
    const v = g.createRadialGradient(W / 2, H / 2, 80, W / 2, H / 2, H * 0.9);
    v.addColorStop(0, "rgba(40,42,70,0.25)");
    v.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = v;
    g.fillRect(0, 0, W, H);
  }
  void t;
}
/** 聚光楔形：从顶上 (x,0) 打到地上，宽 w */
export function wedge(g: G, x: number, w: number, a = 1, col?: string, top = -20, bottom = H + 10) {
  g.save();
  g.globalAlpha *= a;
  g.fillStyle = col ?? PAL.wedge;
  g.beginPath();
  g.moveTo(x - w * 0.08, top);
  g.lineTo(x + w * 0.08, top);
  g.lineTo(x + w / 2, bottom);
  g.lineTo(x - w / 2, bottom);
  g.closePath();
  g.fill();
  g.restore();
}
/** 最后压上去的颗粒、划痕、闪烁、暗角、片门 */
export function grain(g: G, t: number, k = 1) {
  const P = PAL;
  const f = Math.floor(t * 12) % 6;
  const tex = cached("grain" + f, W, H, (q) => {
    q.fillStyle = "#000";
    q.fillRect(0, 0, W, H);
    for (let i = 0; i < 9000; i++) {
      const s = i * 1.3 + f * 977;
      q.fillStyle = `rgba(255,255,255,${0.15 + rnd(s) * 0.5})`;
      q.fillRect(rnd(s + 1) * W, rnd(s + 2) * H, 1 + rnd(s + 3), 1 + rnd(s + 4));
    }
    for (let i = 0; i < 6; i++) {
      const s = i * 4.1 + f * 31;
      q.strokeStyle = `rgba(255,255,255,${0.25 + rnd(s) * 0.5})`;
      q.lineWidth = 0.7 + rnd(s + 1);
      const x = rnd(s + 2) * W;
      q.beginPath();
      q.moveTo(x, 0);
      q.lineTo(x + (rnd(s + 3) - 0.5) * 30, H);
      q.stroke();
    }
    for (let i = 0; i < 14; i++) {
      const s = i * 9.7 + f * 53;
      q.fillStyle = `rgba(255,255,255,${0.3 + rnd(s) * 0.5})`;
      q.beginPath();
      q.arc(rnd(s + 1) * W, rnd(s + 2) * H, 1 + rnd(s + 3) * 3, 0, TAU);
      q.fill();
    }
  });
  g.save();
  g.globalCompositeOperation = P.dark ? "screen" : "difference";
  g.globalAlpha = (P.dark ? 0.16 : 0.1) * k;
  g.drawImage(tex, 0, 0);
  g.restore();
  // 暗角
  const v = g.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 0.98);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, P.dark ? "rgba(0,0,0,0.55)" : "rgba(20,16,30,0.28)");
  g.fillStyle = v;
  g.fillRect(0, 0, W, H);
  // 闪烁
  const fl = 0.02 * Math.sin(t * 37) + 0.015 * Math.sin(t * 91);
  g.fillStyle = P.dark ? `rgba(255,255,255,${Math.max(0, fl)})` : `rgba(0,0,0,${Math.max(0, fl)})`;
  g.fillRect(0, 0, W, H);
}
/** 闪白 / 闪黑：at 时刻起，d 秒内褪掉 */
export function flash(g: G, t: number, at: number, d = 0.35, col = "#ffffff", peak = 1) {
  const k = t < at ? 0 : 1 - seg(t, at, at + d);
  if (k <= 0) return;
  g.fillStyle = col;
  g.globalAlpha *= k * peak;
  g.fillRect(0, 0, W, H);
  g.globalAlpha = 1;
}
/** 整屏抖一下：返回位移 */
export function shake(t: number, at: number, amp = 14, d = 0.3): [number, number] {
  const k = t < at ? 0 : 1 - seg(t, at, at + d);
  if (k <= 0) return [0, 0];
  const f = Math.floor(t * 60);
  return [(rnd(f * 1.3) - 0.5) * amp * k, (rnd(f * 2.7) - 0.5) * amp * k];
}
/** 切片错位（故障感）：把当前画面横向切几条错开 */
export function slice(g: G, src: CanvasImageSource, t: number, k: number, n = 6) {
  if (k <= 0) return;
  const f = Math.floor(t * 30);
  for (let i = 0; i < n; i++) {
    const s = f * 3.1 + i * 7.7;
    const y = rnd(s) * H, h = 6 + rnd(s + 1) * 50, dx = (rnd(s + 2) - 0.5) * 80 * k;
    g.drawImage(src, 0, y, W, h, dx, y, W, h);
  }
}
/** 墨点飞溅 */
export function splat(g: G, x: number, y: number, r: number, col: string, seed: number, n = 14) {
  g.fillStyle = col;
  disc(g, x, y, r, col);
  for (let i = 0; i < n; i++) {
    const a = rnd(seed + i) * TAU, d = r * (1 + rnd(seed + i * 2.2) * 2.4), rr2 = r * (0.08 + rnd(seed + i * 3.3) * 0.3);
    disc(g, x + Math.cos(a) * d, y + Math.sin(a) * d, rr2, col);
  }
}
/** 一群黑剪影（面向舞台的背影） */
export function crowd(g: G, t: number, rows: number, per: number, x0: number, x1: number, yTop: number, yBot: number, k: number, col: string, seed = 0) {
  const whos: ("gpt" | "claude" | "doubao" | "gemini" | "kimi" | "qwen" | "zai")[] = ["gpt", "claude", "doubao", "gemini", "kimi", "qwen", "zai"];
  for (let r = 0; r < rows; r++) {
    const y = lerp(yTop, yBot, rows === 1 ? 1 : r / (rows - 1)), kk = k * lerp(0.6, 1, rows === 1 ? 1 : r / (rows - 1));
    for (let i = 0; i < per; i++) {
      const s = seed + r * 31 + i * 7.1;
      const x = lerp(x0, x1, (i + 0.5 + (r % 2) * 0.5) / per) + (rnd(s) - 0.5) * 40;
      const who = whos[Math.floor(rnd(s + 1) * 7)];
      act(g, who, who === "gpt" ? "float" : "idle", t + rnd(s + 2) * 3, x, y + Math.sin(t * 2 + s) * 1.5, kk * (who === "gpt" ? 0.62 : 1), { tint: col, ta: 1, shadow: false });
    }
  }
}
/** 七位「天才」的站位（从左到右），以及她们在图集里的待机动作 */
export const STARS: { who: "gpt" | "claude" | "gemini" | "kimi" | "qwen" | "zai" | "doubao"; idle: string; name: string }[] = [
  { who: "zai", idle: "idle", name: "狐狸" },
  { who: "qwen", idle: "idle", name: "千问" },
  { who: "claude", idle: "idle", name: "小克" },
  { who: "gpt", idle: "float", name: "龙娘" },
  { who: "kimi", idle: "idle", name: "Kimi" },
  { who: "gemini", idle: "idle", name: "猫" },
  { who: "doubao", idle: "idle", name: "豆包" },
];
/** 鲸的饭盆、图集小道具 */
export function prop(g: G, name: string, x: number, y: number, k: number, o: SpOpt = {}) {
  frame(g, "prop_" + name, x, y, k, { ...o, shadow: false });
}
export function fx(g: G, name: string, x: number, y: number, k: number, a = 1) {
  frame(g, "fx_" + name, x, y, k, { a, shadow: false });
}
/** 简单的椅子（墙角那把） */
export function chair(g: G, x: number, y: number, s: number, col: string) {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  g.fillStyle = col;
  g.fillRect(-26, -40, 52, 6);
  g.fillRect(-26, -110, 6, 76);
  g.fillRect(20, -110, 6, 76);
  g.fillRect(-26, -110, 52, 6);
  g.fillRect(-26, -34, 5, 34);
  g.fillRect(21, -34, 5, 34);
  g.fillRect(-26, -86, 52, 5);
  g.restore();
}
/** 吊灯泡 */
export function bulb(g: G, x: number, y0: number, len: number, t: number, lit: number, col: string) {
  const sw = Math.sin(t * 1.1) * 0.05;
  g.save();
  g.translate(x, y0);
  g.rotate(sw);
  g.strokeStyle = col;
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(0, len);
  g.stroke();
  if (lit > 0) {
    const gr = g.createRadialGradient(0, len + 16, 0, 0, len + 16, 260);
    gr.addColorStop(0, `rgba(255,228,170,${0.55 * lit})`);
    gr.addColorStop(1, "rgba(255,228,170,0)");
    g.fillStyle = gr;
    g.fillRect(-260, len - 240, 520, 520);
  }
  g.fillStyle = col;
  g.fillRect(-6, len, 12, 10);
  disc(g, 0, len + 22, 14, lit > 0 ? "#ffe8b4" : col);
  g.restore();
}
/** 奖杯 */
export function trophy(g: G, x: number, y: number, s: number, col: string) {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  g.fillStyle = col;
  g.fillRect(-30, -8, 60, 8);
  g.fillRect(-6, -40, 12, 32);
  g.beginPath();
  g.moveTo(-34, -120);
  g.lineTo(34, -120);
  g.quadraticCurveTo(34, -44, 0, -40);
  g.quadraticCurveTo(-34, -44, -34, -120);
  g.closePath();
  g.fill();
  g.strokeStyle = col;
  g.lineWidth = 7;
  g.beginPath();
  g.arc(-42, -96, 16, Math.PI * 0.3, Math.PI * 1.7);
  g.stroke();
  g.beginPath();
  g.arc(42, -96, 16, -Math.PI * 0.7, Math.PI * 0.7);
  g.stroke();
  g.restore();
}
/** 稿纸：中心 (x,y)，带涂改线 */
export function sheet(g: G, x: number, y: number, rot: number, s: number, seed: number, paperCol = "#f6f3ea", inkCol = "rgba(40,40,60,0.75)") {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.scale(s, s);
  g.fillStyle = "rgba(0,0,0,0.25)";
  g.fillRect(-36, -46, 72, 92);
  g.fillStyle = paperCol;
  g.fillRect(-40, -50, 72, 92);
  g.strokeStyle = inkCol;
  g.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    const yy = -36 + i * 14, w = 30 + rnd(seed + i) * 26;
    g.beginPath();
    g.moveTo(-30, yy);
    g.lineTo(-30 + w, yy);
    g.stroke();
  }
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(-32, -40);
  g.quadraticCurveTo(10 + rnd(seed) * 20, 0, 24, 36);
  g.moveTo(24, -36);
  g.quadraticCurveTo(-10, 0 + rnd(seed + 1) * 20, -30, 36);
  g.stroke();
  g.restore();
}
/** 小花：茎从 (x,y) 长出，open 零到一 */
export function flower(g: G, x: number, y: number, grow: number, open: number, s = 1) {
  if (grow <= 0) return;
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  const h = 90 * eo(grow);
  g.strokeStyle = MOLD;
  g.lineWidth = 4;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(0, 0);
  g.quadraticCurveTo(8, -h * 0.5, 0, -h);
  g.stroke();
  if (grow > 0.5) {
    g.fillStyle = MOLD;
    g.beginPath();
    g.ellipse(-12, -h * 0.5, 14 * eo((grow - 0.5) * 2), 6, -0.5, 0, TAU);
    g.fill();
  }
  const op = eo(open);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + Math.PI / 6;
    g.fillStyle = i % 2 ? "#cfd2ff" : VIO2;
    g.beginPath();
    g.ellipse(Math.cos(a) * 13 * op, -h + Math.sin(a) * 13 * op, 12 * op, 6 * op, a, 0, TAU);
    g.fill();
  }
  disc(g, 0, -h, 6 * Math.max(0.3, op), GOLD);
  g.restore();
}
