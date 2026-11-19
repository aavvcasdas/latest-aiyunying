// 场景共用的类型与小工具
import { Ctx, FONT, hash, easeOut, W, H } from "./fx";
import { Pal } from "./typo";
import { BLUE } from "./art";

export interface S {
  c: Ctx;
  t: number; // 全局时间
  lt: number; // 场景内时间
  dur: number;
  u: number; // 0..1
  pal: Pal;
  sec: string;
  P: string; // 主歌前缀 A/C/E
  text: () => void;
}
export interface Scene {
  a: number;
  b: number;
  fn: (s: S) => void;
  sec: string;
  P: string;
  id: string;
}

export const hexA = (h: string, a: number) => {
  const n = parseInt(h.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

export const blinkAt = (t: number) => ((t % 3.3) < 0.12 ? 1 : 0);

export function cone(c: Ctx, x: number, y0: number, y1: number, w0: number, w1: number, col: string, a: number, add: boolean) {
  if (a <= 0.003) return;
  c.save();
  if (add) c.globalCompositeOperation = "lighter";
  const g = c.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, hexA(col, a));
  g.addColorStop(1, hexA(col, 0));
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(x - w0 / 2, y0);
  c.lineTo(x + w0 / 2, y0);
  c.lineTo(x + w1 / 2, y1);
  c.lineTo(x - w1 / 2, y1);
  c.closePath();
  c.fill();
  c.restore();
}

export function glow(c: Ctx, x: number, y: number, r: number, col: string, a: number, add = true) {
  c.save();
  if (add) c.globalCompositeOperation = "lighter";
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, hexA(col, a));
  g.addColorStop(1, hexA(col, 0));
  c.fillStyle = g;
  c.fillRect(x - r, y - r, r * 2, r * 2);
  c.restore();
}

export function floorFill(c: Ctx, y: number, pal: Pal) {
  const g = c.createLinearGradient(0, y, 0, H);
  g.addColorStop(0, pal.ground);
  g.addColorStop(1, pal.bg);
  c.fillStyle = g;
  c.fillRect(0, y, W, H - y);
  c.strokeStyle = pal.name === "day" ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.14)";
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(0, y);
  c.lineTo(W, y);
  c.stroke();
}

export function firework(c: Ctx, x: number, y: number, age: number, col: string, seed: number, add: boolean) {
  if (age < 0 || age > 1.3) return;
  c.save();
  if (add) c.globalCompositeOperation = "lighter";
  const n = 26;
  const a0 = hash(seed) * 6;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + a0;
    const sp = 90 + hash(seed + i * 1.7) * 90;
    const d = sp * easeOut(age / 1.1);
    const d2 = sp * easeOut(Math.max(0, age - 0.07) / 1.1);
    const g = age * age * 50;
    const al = 1 - age / 1.3;
    c.strokeStyle = col.startsWith("#") ? `${hexA(col, al * 0.8)}` : col;
    c.lineWidth = 2.4 * al + 0.5;
    c.beginPath();
    c.moveTo(x + Math.cos(a) * d2, y + Math.sin(a) * d2 + g);
    c.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d + g);
    c.stroke();
  }
  c.restore();
}

// 「深度思考」小胶囊：小鲸的内心独白，一行一行打出来
export function thinkChip(c: Ctx, x: number, y: number, lt: number, lines: string[], pal: Pal, alpha = 1) {
  c.save();
  c.globalAlpha *= alpha;
  const dark = pal.name !== "day";
  c.fillStyle = dark ? "rgba(77,107,254,0.22)" : "rgba(77,107,254,0.16)";
  c.strokeStyle = BLUE;
  c.lineWidth = 2;
  c.beginPath();
  const w = 232;
  const h = 46;
  c.moveTo(x + h / 2, y);
  c.arc(x + w - h / 2, y + h / 2, h / 2, -Math.PI / 2, Math.PI / 2);
  c.arc(x + h / 2, y + h / 2, h / 2, Math.PI / 2, Math.PI * 1.5);
  c.closePath();
  c.fill();
  c.stroke();
  // 转圈
  c.strokeStyle = BLUE;
  c.lineWidth = 3.4;
  c.lineCap = "round";
  c.beginPath();
  c.arc(x + 26, y + h / 2, 9, lt * 6, lt * 6 + 4.2);
  c.stroke();
  c.fillStyle = pal.fg;
  c.font = `900 21px ${FONT}`;
  c.textAlign = "left";
  c.textBaseline = "middle";
  c.fillText("深度思考中", x + 52, y + h / 2 + 1);
  // 独白
  c.fillStyle = BLUE;
  c.globalAlpha *= 0.8;
  c.fillRect(x + 6, y + 66, 3, lines.length * 30 - 6);
  c.globalAlpha = alpha * 0.72;
  c.fillStyle = pal.fg;
  c.font = `900 19px ${FONT}`;
  let used = 0;
  const per = 7; // 每秒字数
  lines.forEach((ln, i) => {
    const start = i * 1.3 + 0.2;
    const n = Math.max(0, Math.min(ln.length, Math.floor((lt - start) * per)));
    used += n;
    c.fillText(ln.slice(0, n), x + 20, y + 80 + i * 30);
  });
  void used;
  c.restore();
}
