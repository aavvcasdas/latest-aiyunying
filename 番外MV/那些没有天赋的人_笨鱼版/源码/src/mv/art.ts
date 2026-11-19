// 矢量美术：小鲸（DeepSeek 的鲸）、七位 AI 剪影、各种道具
import { Ctx, FONT, clamp, rng, roundRect } from "./fx";

export const BLUE = "#4d6bfe"; // 小鲸的蓝：灰白世界里唯一的饱和色
export const BLUE_D = "#2c3fc4";
export const BLUE_L = "#8ea2ff";
export const BELLY = "#e4e9ff";

// ───────────── 七位 AI ─────────────
export interface AI {
  id: string;
  name: string;
  color: string;
}
export const AIS: AI[] = [
  { id: "gpt", name: "GPT", color: "#22c98a" },
  { id: "claude", name: "Claude", color: "#f08a5d" },
  { id: "gemini", name: "Gemini", color: "#8fb0ff" },
  { id: "kimi", name: "Kimi", color: "#d9e2ff" },
  { id: "doubao", name: "豆包", color: "#ff5f6d" },
  { id: "qwen", name: "千问", color: "#a47bff" },
  { id: "zai", name: "智谱", color: "#ffb347" },
];

export function sigil(c: Ctx, k: number, x: number, y: number, r: number, col: string, a = 1) {
  c.save();
  c.translate(x, y);
  c.globalAlpha *= a;
  c.strokeStyle = col;
  c.fillStyle = col;
  c.lineCap = "round";
  c.lineJoin = "round";
  if (k === 0) {
    c.lineWidth = r * 0.14;
    for (let i = 0; i < 6; i++) {
      c.save();
      c.rotate((i * Math.PI) / 3);
      c.beginPath();
      c.ellipse(0, -r * 0.5, r * 0.24, r * 0.5, 0, 0, Math.PI * 2);
      c.stroke();
      c.restore();
    }
  } else if (k === 1) {
    c.lineWidth = r * 0.13;
    for (let i = 0; i < 12; i++) {
      const an = (i * Math.PI) / 6;
      const r0 = r * 0.28;
      const r1 = r * (i % 2 ? 0.7 : 1);
      c.beginPath();
      c.moveTo(Math.cos(an) * r0, Math.sin(an) * r0);
      c.lineTo(Math.cos(an) * r1, Math.sin(an) * r1);
      c.stroke();
    }
  } else if (k === 2) {
    c.beginPath();
    c.moveTo(0, -r);
    c.quadraticCurveTo(0, 0, r, 0);
    c.quadraticCurveTo(0, 0, 0, r);
    c.quadraticCurveTo(0, 0, -r, 0);
    c.quadraticCurveTo(0, 0, 0, -r);
    c.fill();
  } else if (k === 3) {
    c.lineWidth = r * 0.2;
    c.beginPath();
    c.arc(0, 0, r * 0.8, 0, Math.PI * 2);
    c.stroke();
    c.beginPath();
    c.arc(r * 0.42, -r * 0.42, r * 0.2, 0, Math.PI * 2);
    c.fill();
  } else if (k === 4) {
    c.save();
    c.rotate(-0.5);
    c.beginPath();
    c.ellipse(0, 0, r * 0.95, r * 0.6, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
    c.globalAlpha *= 0.5;
    c.fillStyle = "#000";
    c.beginPath();
    c.arc(-r * 0.2, -r * 0.1, r * 0.1, 0, Math.PI * 2);
    c.arc(r * 0.2, r * 0.1, r * 0.1, 0, Math.PI * 2);
    c.fill();
  } else if (k === 5) {
    c.lineWidth = r * 0.13;
    c.beginPath();
    for (let i = 0; i < 6; i++) {
      const an = (i * Math.PI) / 3 + Math.PI / 6;
      c.lineTo(Math.cos(an) * r, Math.sin(an) * r);
    }
    c.closePath();
    c.stroke();
    c.beginPath();
    for (let i = 0; i < 3; i++) {
      const an = (i * 2 * Math.PI) / 3 - Math.PI / 2;
      c.moveTo(0, 0);
      c.lineTo(Math.cos(an) * r * 0.62, Math.sin(an) * r * 0.62);
    }
    c.stroke();
  } else {
    c.lineWidth = r * 0.17;
    roundRect(c, -r * 0.95, -r * 0.95, r * 1.9, r * 1.9, r * 0.35);
    c.stroke();
    c.beginPath();
    c.moveTo(-r * 0.5, -r * 0.45);
    c.lineTo(r * 0.5, -r * 0.45);
    c.lineTo(-r * 0.5, r * 0.45);
    c.lineTo(r * 0.5, r * 0.45);
    c.stroke();
  }
  c.restore();
}

// 站立的剪影，h = 身高。k = 哪位 AI（带自己的小饰品）；lit = 0..1 轮廓光强度
export function figure(c: Ctx, x: number, y: number, h: number, k: number, lit = 0, fill = "#0b0d14", facing = 0) {
  const col = AIS[k].color;
  const hd = h * 0.13;
  c.save();
  c.translate(x, y);
  c.lineJoin = "round";
  if (lit > 0) {
    c.shadowColor = col;
    c.shadowBlur = 24 * lit;
  }
  c.fillStyle = fill;
  c.strokeStyle = col;
  c.globalAlpha *= 0.35 + 0.65 * lit;
  c.lineWidth = Math.max(1.5, h * 0.012);
  // 身体
  c.beginPath();
  c.moveTo(-h * 0.19, 0);
  c.quadraticCurveTo(-h * 0.2, -h * 0.55, -h * 0.1, -h * 0.72);
  c.quadraticCurveTo(0, -h * 0.78, h * 0.1, -h * 0.72);
  c.quadraticCurveTo(h * 0.2, -h * 0.55, h * 0.19, 0);
  c.closePath();
  c.fill();
  if (lit > 0) c.stroke();
  // 头
  c.beginPath();
  c.arc(facing * hd * 0.15, -h * 0.86, hd, 0, Math.PI * 2);
  c.fill();
  if (lit > 0) c.stroke();
  // 饰品
  c.shadowBlur = 0;
  c.fillStyle = col;
  c.strokeStyle = col;
  const hy = -h * 0.86;
  if (k === 0) {
    // 龙角
    for (const s of [-1, 1]) {
      c.beginPath();
      c.moveTo(s * hd * 0.5, hy - hd * 0.8);
      c.quadraticCurveTo(s * hd * 1.5, hy - hd * 1.6, s * hd * 1.2, hy - hd * 2.3);
      c.quadraticCurveTo(s * hd * 1.1, hy - hd * 1.5, s * hd * 0.2, hy - hd * 0.95);
      c.fill();
    }
  } else if (k === 1) {
    // 金冠
    c.fillStyle = "#ffd36a";
    c.beginPath();
    c.moveTo(-hd * 0.8, hy - hd * 0.85);
    c.lineTo(-hd * 0.9, hy - hd * 1.75);
    c.lineTo(-hd * 0.4, hy - hd * 1.3);
    c.lineTo(0, hy - hd * 1.95);
    c.lineTo(hd * 0.4, hy - hd * 1.3);
    c.lineTo(hd * 0.9, hy - hd * 1.75);
    c.lineTo(hd * 0.8, hy - hd * 0.85);
    c.closePath();
    c.fill();
  } else if (k === 2) {
    // 猫耳
    for (const s of [-1, 1]) {
      c.beginPath();
      c.moveTo(s * hd * 0.95, hy - hd * 0.3);
      c.lineTo(s * hd * 0.8, hy - hd * 1.7);
      c.lineTo(s * hd * 0.1, hy - hd * 0.95);
      c.closePath();
      c.fill();
    }
  } else if (k === 3) {
    // 书签与书
    c.fillStyle = col;
    c.fillRect(-h * 0.07, -h * 0.5, h * 0.14, h * 0.1);
    c.fillStyle = fill;
    c.fillRect(-h * 0.005, -h * 0.5, h * 0.01, h * 0.1);
  } else if (k === 4) {
    // 红兜帽
    c.beginPath();
    c.moveTo(-hd * 1.15, hy + hd * 0.4);
    c.quadraticCurveTo(-hd * 1.2, hy - hd * 1.6, 0, hy - hd * 1.7);
    c.quadraticCurveTo(hd * 1.2, hy - hd * 1.6, hd * 1.15, hy + hd * 0.4);
    c.quadraticCurveTo(0, hy - hd * 0.6, -hd * 1.15, hy + hd * 0.4);
    c.fill();
  } else if (k === 5) {
    // 礼帽
    c.fillRect(-hd * 0.75, hy - hd * 2.2, hd * 1.5, hd * 1.35);
    c.fillRect(-hd * 1.35, hy - hd * 0.95, hd * 2.7, hd * 0.2);
  } else {
    // 狐耳 + 尾
    for (const s of [-1, 1]) {
      c.beginPath();
      c.moveTo(s * hd * 1.0, hy - hd * 0.2);
      c.lineTo(s * hd * 0.75, hy - hd * 1.85);
      c.lineTo(s * hd * 0.05, hy - hd * 0.95);
      c.closePath();
      c.fill();
    }
    c.beginPath();
    c.moveTo(h * 0.12, -h * 0.08);
    c.quadraticCurveTo(h * 0.45, -h * 0.05, h * 0.38, -h * 0.4);
    c.quadraticCurveTo(h * 0.25, -h * 0.2, h * 0.1, -h * 0.2);
    c.fill();
  }
  c.restore();
}

// 无名的观众剪影
export function blob(c: Ctx, x: number, y: number, h: number, fill: string) {
  c.fillStyle = fill;
  c.beginPath();
  c.moveTo(x - h * 0.2, y);
  c.quadraticCurveTo(x - h * 0.22, y - h * 0.55, x - h * 0.09, y - h * 0.7);
  c.quadraticCurveTo(x, y - h * 0.75, x + h * 0.09, y - h * 0.7);
  c.quadraticCurveTo(x + h * 0.22, y - h * 0.55, x + h * 0.2, y);
  c.fill();
  c.beginPath();
  c.arc(x, y - h * 0.86, h * 0.13, 0, Math.PI * 2);
  c.fill();
}

// ───────────── 蓝饭碗 ─────────────
export function bowl(c: Ctx, x: number, y: number, s: number, fill = 0.85, rot = 0, glow = 0) {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.scale(s, s);
  if (glow > 0) {
    c.shadowColor = "#ffe9a8";
    c.shadowBlur = 30 * glow;
  }
  // 饭
  if (fill > 0) {
    c.fillStyle = glow > 0 ? "#fff6d8" : "#f6f7fb";
    c.beginPath();
    c.ellipse(0, -2, 26, 9 + 16 * fill, 0, Math.PI, 0);
    c.fill();
    const r = rng(5);
    c.fillStyle = "#cfd4e6";
    for (let i = 0; i < 12; i++) {
      c.fillRect(-18 + r() * 36, -4 - r() * 18 * fill, 3, 1.5);
    }
  }
  c.shadowBlur = 0;
  // 碗身
  c.fillStyle = BLUE;
  c.beginPath();
  c.moveTo(-30, -4);
  c.quadraticCurveTo(-28, 28, 0, 30);
  c.quadraticCurveTo(28, 28, 30, -4);
  c.closePath();
  c.fill();
  c.fillStyle = "rgba(255,255,255,0.28)";
  c.beginPath();
  c.moveTo(-22, 4);
  c.quadraticCurveTo(-20, 18, -8, 22);
  c.quadraticCurveTo(-18, 14, -22, 4);
  c.fill();
  c.fillStyle = BLUE_D;
  c.beginPath();
  c.ellipse(0, -4, 31, 6, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#a9b6ff";
  c.fillRect(-12, 30, 24, 3);
  c.restore();
}

// ───────────── 小鲸 ─────────────
export type Mood = "neutral" | "sad" | "smile" | "shock" | "grit" | "sleep" | "cry" | "flat";
export interface WhaleOpts {
  x: number;
  y: number;
  s?: number;
  rot?: number;
  flip?: number; // 1 = 朝左（默认），-1 朝右
  mood?: Mood;
  tail?: number;
  bowl?: number; // 0 无，1 抱在前面
  bowlFill?: number;
  bowlRot?: number;
  bowlGlow?: number;
  blink?: number; // 0..1 眨眼
  tint?: string | null; // 整体染色（用于「热忱」「自卑」分身）
  tintBelly?: string | null;
  alpha?: number;
  silhouette?: string | null;
}

function bodyPath(c: Ctx) {
  c.beginPath();
  c.moveTo(-100, 6);
  c.bezierCurveTo(-102, -46, -56, -66, 0, -62);
  c.bezierCurveTo(50, -59, 85, -42, 99, -14);
  c.bezierCurveTo(84, 30, 32, 62, -30, 58);
  c.bezierCurveTo(-76, 54, -99, 36, -100, 6);
  c.closePath();
}

export function whale(c: Ctx, o: WhaleOpts) {
  const s = o.s ?? 1;
  const mood = o.mood ?? "neutral";
  const tail = o.tail ?? 0;
  c.save();
  c.translate(o.x, o.y);
  c.rotate(o.rot ?? 0);
  c.scale(s * (o.flip ?? 1), s);
  c.globalAlpha *= o.alpha ?? 1;
  const sil = o.silhouette;
  const bellyC = sil || o.tintBelly || BELLY;
  c.lineJoin = "round";
  c.lineCap = "round";

  // 尾巴
  c.save();
  c.translate(92, -6);
  c.rotate(Math.sin(tail) * 0.22 - 0.1);
  c.translate(-92, 6);
  c.fillStyle = sil || (o.tint ? o.tint : BLUE_D);
  c.beginPath();
  c.moveTo(84, -24);
  c.bezierCurveTo(112, -28, 120, -50, 112, -74);
  c.bezierCurveTo(96, -72, 88, -88, 90, -102);
  c.bezierCurveTo(104, -94, 112, -88, 119, -86);
  c.bezierCurveTo(124, -94, 136, -102, 148, -100);
  c.bezierCurveTo(142, -82, 136, -64, 130, -48);
  c.bezierCurveTo(126, -20, 106, 2, 86, 12);
  c.closePath();
  c.fill();
  c.restore();

  // 身体
  c.save();
  bodyPath(c);
  if (sil) c.fillStyle = sil;
  else {
    const g = c.createLinearGradient(0, -62, 0, 60);
    g.addColorStop(0, o.tint ? o.tint : BLUE_L);
    g.addColorStop(0.45, o.tint ? o.tint : BLUE);
    g.addColorStop(1, o.tint ? o.tint : BLUE_D);
    c.fillStyle = g;
  }
  c.fill();
  c.clip();
  // 肚皮
  c.fillStyle = bellyC;
  c.beginPath();
  c.ellipse(-12, 66, 118, 40, -0.06, 0, Math.PI * 2);
  c.fill();
  if (!sil) {
    c.strokeStyle = "rgba(60,80,200,0.22)";
    c.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      c.beginPath();
      c.moveTo(-70 + i * 10, 32 + i * 5);
      c.quadraticCurveTo(-20, 38 + i * 6, 40 - i * 14, 40 + i * 4);
      c.stroke();
    }
  }
  c.restore();

  if (!sil) {
    // 脸
    const bl = o.blink ?? 0;
    const ex = -62;
    const ey = -14;
    c.fillStyle = "rgba(255,150,170,0.5)";
    c.beginPath();
    c.ellipse(-48, 6, 9, 5, 0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = "#101a4d";
    c.fillStyle = "#101a4d";
    c.lineWidth = 3.4;
    const closed = mood === "sleep" || mood === "smile" || bl > 0.5;
    if (mood === "smile") {
      c.beginPath();
      c.arc(ex, ey + 4, 8, Math.PI * 1.1, Math.PI * 1.9);
      c.stroke();
    } else if (closed) {
      c.beginPath();
      c.arc(ex, ey - 2, 8, Math.PI * 0.15, Math.PI * 0.85);
      c.stroke();
    } else {
      const big = mood === "shock" ? 1.35 : 1;
      c.beginPath();
      c.ellipse(ex, ey, 7.5 * big, 9.5 * big, 0, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#fff";
      c.beginPath();
      c.arc(ex - 2.5, ey - 3.5, 2.6, 0, Math.PI * 2);
      c.fill();
      if (mood === "cry") {
        c.fillStyle = "rgba(190,220,255,0.9)";
        c.beginPath();
        c.ellipse(ex + 3, ey + 18, 3.4, 6, 0, 0, Math.PI * 2);
        c.fill();
      }
    }
    // 睫毛
    c.strokeStyle = "#101a4d";
    c.lineWidth = 2.6;
    c.beginPath();
    c.moveTo(ex + 7, ey - 6);
    c.lineTo(ex + 14, ey - 11);
    c.stroke();
    // 眉
    c.lineWidth = 3;
    if (mood === "sad" || mood === "cry") {
      c.beginPath();
      c.moveTo(ex - 9, ey - 21);
      c.lineTo(ex + 9, ey - 15);
      c.stroke();
    } else if (mood === "grit") {
      c.beginPath();
      c.moveTo(ex - 8, ey - 14);
      c.lineTo(ex + 8, ey - 21);
      c.stroke();
    } else if (mood === "shock") {
      c.beginPath();
      c.arc(ex, ey - 24, 9, Math.PI * 1.15, Math.PI * 1.85);
      c.stroke();
    }
    // 嘴
    c.lineWidth = 3;
    c.beginPath();
    if (mood === "smile") {
      c.arc(-82, 4, 9, 0.2, Math.PI * 0.85);
    } else if (mood === "sad" || mood === "cry") {
      c.arc(-84, 20, 8, Math.PI * 1.15, Math.PI * 1.85);
    } else if (mood === "shock") {
      c.ellipse(-86, 14, 4, 6, 0, 0, Math.PI * 2);
    } else if (mood === "grit") {
      c.moveTo(-90, 12);
      c.lineTo(-76, 14);
    } else if (mood === "flat") {
      c.moveTo(-90, 13);
      c.lineTo(-77, 13);
    } else {
      c.arc(-83, 8, 6, 0.3, Math.PI * 0.8);
    }
    c.stroke();
  }

  // 饭碗 + 胸鳍
  if ((o.bowl ?? 0) > 0) {
    bowl(c, -58, 44, 0.95, o.bowlFill ?? 0.85, o.bowlRot ?? 0, o.bowlGlow ?? 0);
    c.fillStyle = sil || (o.tint ? o.tint : BLUE_D);
    c.beginPath();
    c.ellipse(-30, 40, 24, 11, -0.35, 0, Math.PI * 2);
    c.fill();
  } else {
    c.fillStyle = sil || (o.tint ? o.tint : BLUE_D);
    c.beginPath();
    c.ellipse(-10, 28, 30, 11, 0.5, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
}

// ───────────── 道具 ─────────────
export function bulb(c: Ctx, x: number, y: number, len: number, glow = 1, swing = 0) {
  c.save();
  c.translate(x, y);
  c.rotate(swing);
  c.strokeStyle = "#222";
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(0, -len);
  c.lineTo(0, 0);
  c.stroke();
  c.fillStyle = "#2a2a2a";
  c.fillRect(-7, 0, 14, 12);
  c.shadowColor = "#ffe7a0";
  c.shadowBlur = 60 * glow;
  c.fillStyle = `rgba(255,238,170,${0.5 + 0.5 * glow})`;
  c.beginPath();
  c.arc(0, 24, 14, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

export function chair(c: Ctx, x: number, y: number, s: number, col = "#6b4f33") {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.fillStyle = col;
  c.fillRect(-26, -62, 6, 62);
  c.fillRect(20, -62, 6, 62);
  c.fillRect(-26, -62, 52, 6);
  c.fillRect(-26, -32, 52, 7);
  c.fillRect(-26, -32, 6, 32);
  c.fillRect(20, -32, 6, 32);
  c.restore();
}

export function bubble(c: Ctx, x: number, y: number, r: number, mold: number, t: number) {
  c.save();
  c.translate(x, y);
  const g = c.createRadialGradient(-r * 0.3, -r * 0.3, r * 0.1, 0, 0, r);
  const m = clamp(mold);
  const mix = (a: number, b: number) => Math.round(a + (b - a) * m);
  g.addColorStop(0, `rgba(${mix(255, 190)},${mix(250, 230)},${mix(255, 120)},0.95)`);
  g.addColorStop(1, `rgba(${mix(190, 70)},${mix(180, 120)},${mix(255, 60)},0.9)`);
  c.fillStyle = g;
  c.beginPath();
  c.ellipse(0, 0, r, r * 0.92, 0, 0, Math.PI * 2);
  c.fill();
  // 小泡尾
  for (let i = 1; i <= 3; i++) {
    c.beginPath();
    c.arc(-r * 0.7 - i * r * 0.22, r * 0.9 + i * r * 0.28, r * (0.2 - i * 0.04), 0, Math.PI * 2);
    c.fill();
  }
  // 星星（梦里原本的东西）
  c.globalAlpha = 1 - m * 0.8;
  sigil(c, 2, -r * 0.1, -r * 0.05, r * 0.42, "#fff", 0.95);
  c.globalAlpha = 1;
  // 霉斑
  const r2 = rng(11);
  for (let i = 0; i < 26 * m; i++) {
    const an = r2() * Math.PI * 2;
    const d = Math.sqrt(r2()) * r * 0.95;
    c.fillStyle = r2() > 0.5 ? "rgba(40,90,40,0.75)" : "rgba(110,150,60,0.7)";
    c.beginPath();
    c.arc(Math.cos(an) * d, Math.sin(an) * d, 3 + r2() * 9 * m, 0, Math.PI * 2);
    c.fill();
  }
  // 孢子
  if (m > 0.2) {
    for (let i = 0; i < 20; i++) {
      const ph = (t * 0.4 + r2()) % 1;
      c.fillStyle = `rgba(150,200,90,${(1 - ph) * 0.7})`;
      c.beginPath();
      c.arc(Math.cos(i * 2.4) * r * (0.6 + ph) + Math.sin(t + i) * 10, -ph * r * 1.8 + Math.sin(i) * r * 0.4, 2 + r2() * 3, 0, Math.PI * 2);
      c.fill();
    }
  }
  c.restore();
}

export function clockFace(c: Ctx, x: number, y: number, r: number, t: number, col = "#f2f2f2", ink = "#111", speed = 1) {
  c.save();
  c.translate(x, y);
  c.fillStyle = col;
  c.beginPath();
  c.arc(0, 0, r, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = ink;
  c.lineWidth = r * 0.07;
  c.stroke();
  c.lineWidth = r * 0.03;
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    c.beginPath();
    c.moveTo(Math.cos(a) * r * 0.82, Math.sin(a) * r * 0.82);
    c.lineTo(Math.cos(a) * r * 0.94, Math.sin(a) * r * 0.94);
    c.stroke();
  }
  c.lineCap = "round";
  c.lineWidth = r * 0.06;
  const a1 = t * speed * 0.6 - Math.PI / 2;
  const a2 = t * speed * 7.2 - Math.PI / 2;
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(Math.cos(a1) * r * 0.5, Math.sin(a1) * r * 0.5);
  c.stroke();
  c.lineWidth = r * 0.035;
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(Math.cos(a2) * r * 0.78, Math.sin(a2) * r * 0.78);
  c.stroke();
  c.restore();
}

export function trophy(c: Ctx, x: number, y: number, s: number, col = "#ffd36a", glow = 0.5) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.shadowColor = col;
  c.shadowBlur = 40 * glow;
  c.fillStyle = col;
  c.beginPath();
  c.moveTo(-34, -90);
  c.lineTo(34, -90);
  c.quadraticCurveTo(34, -40, 6, -30);
  c.lineTo(6, -12);
  c.lineTo(22, -12);
  c.lineTo(22, 0);
  c.lineTo(-22, 0);
  c.lineTo(-22, -12);
  c.lineTo(-6, -12);
  c.lineTo(-6, -30);
  c.quadraticCurveTo(-34, -40, -34, -90);
  c.fill();
  c.shadowBlur = 0;
  c.strokeStyle = col;
  c.lineWidth = 6;
  c.beginPath();
  c.arc(-34, -70, 16, Math.PI * 0.5, Math.PI * 1.5);
  c.stroke();
  c.beginPath();
  c.arc(34, -70, 16, -Math.PI * 0.5, Math.PI * 0.5);
  c.stroke();
  c.fillStyle = "rgba(255,255,255,0.5)";
  c.fillRect(-22, -82, 6, 34);
  c.restore();
}

export function book(c: Ctx, x: number, y: number, w: number, open: number, glow = 0, col = "#f4ecd6") {
  // open: 0 合 → 1 翻开
  c.save();
  c.translate(x, y);
  if (glow > 0) {
    c.shadowColor = "#ffe9a8";
    c.shadowBlur = 50 * glow;
  }
  const h = w * 0.66;
  if (open < 0.05) {
    c.fillStyle = "#3a2a1a";
    c.fillRect(-w / 2, -h * 0.2, w, h * 0.2);
    c.fillStyle = col;
    c.fillRect(-w / 2 + 4, -h * 0.17, w - 8, h * 0.1);
  } else {
    const k = clamp(open);
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(0, 0);
    c.quadraticCurveTo(-w * 0.25, -h * 0.12 * k, -w / 2, -h * 0.05 * k);
    c.lineTo(-w / 2, -h * 0.75 * k - 4);
    c.quadraticCurveTo(-w * 0.25, -h * 0.9 * k, 0, -h * 0.7 * k);
    c.quadraticCurveTo(w * 0.25, -h * 0.9 * k, w / 2, -h * 0.75 * k - 4);
    c.lineTo(w / 2, -h * 0.05 * k);
    c.quadraticCurveTo(w * 0.25, -h * 0.12 * k, 0, 0);
    c.fill();
    c.shadowBlur = 0;
    c.strokeStyle = "rgba(60,40,20,0.35)";
    c.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) {
      const yy = -h * 0.12 * k - i * h * 0.1 * k;
      c.beginPath();
      c.moveTo(-w * 0.44, yy - 4);
      c.lineTo(-w * 0.07, yy - 2);
      c.moveTo(w * 0.07, yy - 2);
      c.lineTo(w * 0.44, yy - 4);
      c.stroke();
    }
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(0, -h * 0.7 * k);
    c.stroke();
  }
  c.restore();
}

export function paper(c: Ctx, x: number, y: number, w: number, rot: number, seed: number, ink = "#222", col = "#f5f1e6") {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.fillStyle = "rgba(0,0,0,0.25)";
  c.fillRect(-w / 2 + 4, -w * 0.7 + 5, w, w * 1.4);
  c.fillStyle = col;
  c.fillRect(-w / 2, -w * 0.7, w, w * 1.4);
  const r = rng(seed);
  c.strokeStyle = "rgba(60,90,160,0.25)";
  c.lineWidth = 1;
  for (let i = 0; i < 9; i++) {
    c.beginPath();
    c.moveTo(-w / 2 + 4, -w * 0.6 + i * w * 0.15);
    c.lineTo(w / 2 - 4, -w * 0.6 + i * w * 0.15);
    c.stroke();
  }
  c.strokeStyle = ink;
  c.lineWidth = 1.6;
  for (let i = 0; i < 3 + Math.floor(r() * 3); i++) {
    c.beginPath();
    let px = -w * 0.4 + r() * w * 0.2;
    let py = -w * 0.5 + r() * w * 0.9;
    c.moveTo(px, py);
    for (let k = 0; k < 12; k++) {
      px += (r() - 0.3) * w * 0.12;
      py += (r() - 0.5) * w * 0.14;
      c.lineTo(px, py);
    }
    c.stroke();
  }
  c.restore();
}

export function popup(c: Ctx, x: number, y: number, s: number, text: string, sub: string) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  c.shadowColor = "rgba(0,0,0,0.5)";
  c.shadowBlur = 30;
  c.fillStyle = "#f7f8ff";
  roundRect(c, -190, -78, 380, 156, 14);
  c.fill();
  c.shadowBlur = 0;
  c.fillStyle = "#e4e8fb";
  roundRect(c, -190, -78, 380, 36, 14);
  c.fill();
  c.fillRect(-190, -60, 380, 18);
  c.fillStyle = "#ff7a85";
  c.beginPath();
  c.arc(-168, -60, 6, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#ffd36a";
  c.beginPath();
  c.arc(-148, -60, 6, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = BLUE;
  c.beginPath();
  c.arc(-128, -60, 6, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#1a2050";
  c.font = `900 34px ${FONT}`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText(text, 0, -6);
  c.fillStyle = "#6a73a8";
  c.font = `900 20px ${FONT}`;
  c.fillText(sub, 0, 40);
  c.restore();
}

export function stamp(c: Ctx, x: number, y: number, s: number, rot: number, text: string, col = "#d63a3a") {
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.scale(s, s);
  c.strokeStyle = col;
  c.fillStyle = col;
  c.lineWidth = 8;
  roundRect(c, -110, -52, 220, 104, 8);
  c.stroke();
  c.lineWidth = 3;
  roundRect(c, -100, -42, 200, 84, 4);
  c.stroke();
  c.font = `900 66px ${FONT}`;
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText(text, 0, 4);
  c.restore();
}

export function flower(c: Ctx, x: number, y: number, h: number, open: number, col = "#ffd36a", petal = "#fff") {
  c.save();
  c.translate(x, y);
  c.strokeStyle = "#5fc27a";
  c.lineWidth = 6;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(0, 0);
  c.quadraticCurveTo(10, -h * 0.5, 0, -h);
  c.stroke();
  // 叶
  c.fillStyle = "#5fc27a";
  for (const s of [-1, 1]) {
    c.beginPath();
    c.moveTo(0, -h * 0.35);
    c.quadraticCurveTo(s * h * 0.35, -h * 0.55, s * h * 0.42, -h * 0.4);
    c.quadraticCurveTo(s * h * 0.2, -h * 0.28, 0, -h * 0.35);
    c.fill();
  }
  c.translate(0, -h);
  const n = 8;
  const k = clamp(open);
  const pr = h * 0.2 * (0.35 + 0.65 * k);
  for (let i = 0; i < n; i++) {
    c.save();
    c.rotate((i * Math.PI * 2) / n + 0.2);
    c.fillStyle = petal;
    c.beginPath();
    c.ellipse(0, -pr * (0.6 + 0.7 * k), pr * (0.5 - 0.1 * (1 - k)), pr * (0.9 + 0.3 * k), 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
  c.fillStyle = col;
  c.shadowColor = col;
  c.shadowBlur = 24 * k;
  c.beginPath();
  c.arc(0, 0, pr * 0.55, 0, Math.PI * 2);
  c.fill();
  c.restore();
}
