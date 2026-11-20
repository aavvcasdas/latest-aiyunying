// 《告白气球》布景与道具：全部代码绘制，不用任何背景图片。
// 世界坐标：地平线 y≈560，角色脚底 y≈600–650。左岸咖啡馆在 x 80–700，对街花店在 x 1500–2000，中间是马路。
import { C, Cam, G, H, TAU, W, clamp, disc, eo, glow, layer, lerp, rnd, rr, span, ss } from "./core";

export type PTone = "morning" | "noon" | "dusk" | "night" | "dawn";
export interface PT {
  sky0: string;
  sky1: string;
  far: string; // 远处屋顶剪影
  ground: string;
  ground2: string;
  wall: string;
  text: string; // 歌词字色
  ribbon: string; // 歌词底条
  tint: string | null; // 角色罩色
  ta: number;
  dark: boolean;
  lamp: number; // 路灯亮度
}
export const PTONES: Record<PTone, PT> = {
  morning: { sky0: "#fbe9e4", sky1: "#f7f1e3", far: "160,150,170", ground: "#ead9c4", ground2: "#dcc6ab", wall: "#fbf4ea", text: "#5a3a4a", ribbon: "rgba(255,250,244,0.86)", tint: null, ta: 0, dark: false, lamp: 0 },
  noon: { sky0: "#dcefff", sky1: "#f6f4ea", far: "130,150,175", ground: "#e8dccb", ground2: "#d8c8b0", wall: "#fffaf2", text: "#3e3a5a", ribbon: "rgba(255,255,252,0.86)", tint: null, ta: 0, dark: false, lamp: 0 },
  dusk: { sky0: "#f3b49a", sky1: "#f7dcc0", far: "150,96,110", ground: "#dcb999", ground2: "#c9a07e", wall: "#f8e2cc", text: "#5a2a3a", ribbon: "rgba(255,244,232,0.86)", tint: "#c0603c", ta: 0.12, dark: false, lamp: 0.5 },
  night: { sky0: "#1b2147", sky1: "#3c3f72", far: "120,120,180", ground: "#2a2a4c", ground2: "#1c1d38", wall: "#3a3d68", text: "#ffe7b0", ribbon: "rgba(26,28,60,0.78)", tint: "#1e2558", ta: 0.3, dark: true, lamp: 1 },
  dawn: { sky0: "#f6cfd8", sky1: "#fdeee0", far: "170,130,160", ground: "#efd6c8", ground2: "#e0bfae", wall: "#fdf0ea", text: "#6a2f4a", ribbon: "rgba(255,248,244,0.86)", tint: "#f08aa0", ta: 0.06, dark: false, lamp: 0.2 },
};
export const PINK = "#f28aa0";
export const RED = "#e84a5f";
export const MINT = "#9fd8c4";
export const CREAM = "#fff6ea";
export const GOLD = "#e8b04a";
export const LEAF = "#e0a03c";
export const INK = "#4a3040";

// ---------- 天空与远景 ----------
export function sky(g: G, c: Cam, tone: PTone, t: number) {
  const T = PTONES[tone];
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, T.sky0);
  gr.addColorStop(1, T.sky1);
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
  // 水彩纸纹
  for (let i = 0; i < 160; i++) {
    g.fillStyle = T.dark ? `rgba(255,255,255,${0.02 + rnd(i) * 0.03})` : `rgba(160,110,90,${0.02 + rnd(i) * 0.03})`;
    g.beginPath();
    g.ellipse(rnd(i * 1.7) * W, rnd(i * 2.3) * H, 20 + rnd(i * 3.1) * 70, 8 + rnd(i * 4.7) * 30, rnd(i) * 3, 0, TAU);
    g.fill();
  }
  if (T.dark) {
    for (let i = 0; i < 90; i++) {
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * (0.8 + rnd(i) * 2) + i));
      disc(g, rnd(i * 5.1) * W, rnd(i * 6.3) * H * 0.6, 0.8 + rnd(i * 7.7) * 1.4, `rgba(255,240,210,${0.6 * tw})`);
    }
  }
  // 云（白天）
  if (!T.dark)
    layer(g, c, 0.06, () => {
      for (let i = 0; i < 6; i++) {
        const x = ((i * 380 + t * 8) % 2400) - 300, y = 70 + rnd(i * 3.3) * 140;
        g.fillStyle = "rgba(255,255,255,0.7)";
        for (let j = 0; j < 4; j++) disc(g, x + j * 34, y + Math.sin(j * 2) * 8, 26 + rnd(i + j) * 14, "rgba(255,255,255,0.7)");
      }
    });
  // 远处屋顶 + 铁塔
  layer(g, c, 0.18, () => {
    const [a, b] = span(c, 0.18);
    g.fillStyle = `rgba(${T.far},0.42)`;
    for (let i = Math.floor(a / 90) - 1; i <= Math.ceil(b / 90); i++) {
      const x = i * 90, h = 70 + rnd(i * 2.1) * 70;
      g.beginPath();
      g.moveTo(x, 560);
      g.lineTo(x, 560 - h);
      g.lineTo(x + 20, 560 - h - 22);
      g.lineTo(x + 70, 560 - h - 22);
      g.lineTo(x + 90, 560 - h);
      g.lineTo(x + 90, 560);
      g.fill();
      if (rnd(i * 5.5) > 0.5) g.fillRect(x + 54, 560 - h - 40, 10, 22);
    }
    eiffel(g, 1180, 560, 1.15, `rgba(${T.far},0.6)`, T.lamp > 0.6 ? t : -1);
  });
}
/** 铁塔剪影：脚底中心 (x,y)；sparkle>=0 时整点闪灯 */
export function eiffel(g: G, x: number, y: number, s: number, col: string, sparkle = -1) {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  g.fillStyle = col;
  g.beginPath();
  g.moveTo(-70, 0);
  g.quadraticCurveTo(-30, -80, -14, -200);
  g.lineTo(-6, -330);
  g.lineTo(0, -360);
  g.lineTo(6, -330);
  g.lineTo(14, -200);
  g.quadraticCurveTo(30, -80, 70, 0);
  g.lineTo(44, 0);
  g.quadraticCurveTo(0, -70, -44, 0);
  g.closePath();
  g.fill();
  g.fillRect(-46, -92, 92, 8);
  g.fillRect(-24, -200, 48, 7);
  if (sparkle >= 0) {
    for (let i = 0; i < 26; i++) {
      const u = rnd(i * 1.3), yy = -u * 340, w = 70 * (1 - u) * 0.9;
      const on = Math.sin(sparkle * 9 + i * 2.7) > 0.3;
      if (on) disc(g, (rnd(i * 2.9) - 0.5) * w * 2, yy, 2.2, "rgba(255,240,190,0.95)");
    }
    glow(g, 0, -360, 40, "255,240,190", 0.5);
  }
  g.restore();
}

// ---------- 地面 ----------
function cobbles(g: G, c: Cam, T: PT, y: number) {
  const [a, b] = span(c, 1);
  const gr = g.createLinearGradient(0, y, 0, y + 200);
  gr.addColorStop(0, T.ground);
  gr.addColorStop(1, T.ground2);
  g.fillStyle = gr;
  g.fillRect(a - 300, y, b - a + 600, 500);
  g.strokeStyle = T.dark ? "rgba(255,255,255,0.06)" : "rgba(120,80,60,0.12)";
  g.lineWidth = 1.2;
  for (let r = 0; r < 7; r++) {
    const yy = y + 14 + r * r * 5 + r * 10;
    g.beginPath();
    g.moveTo(a - 300, yy);
    g.lineTo(b + 300, yy);
    g.stroke();
    const step = 34 + r * 10;
    for (let x = Math.floor((a - 300) / step) * step + (r % 2) * step * 0.5; x < b + 300; x += step) {
      g.beginPath();
      g.moveTo(x, yy);
      g.lineTo(x, yy + 8 + r * 4);
      g.stroke();
    }
  }
}
export function lampPost(g: G, x: number, y: number, s: number, lit: number, col: string) {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  g.fillStyle = col;
  g.fillRect(-4, -220, 8, 220);
  g.fillRect(-12, -10, 24, 10);
  g.beginPath();
  g.moveTo(-16, -222);
  g.lineTo(16, -222);
  g.lineTo(10, -256);
  g.lineTo(-10, -256);
  g.closePath();
  g.fill();
  if (lit > 0) {
    disc(g, 0, -238, 9, `rgba(255,230,160,${0.9 * lit})`);
    glow(g, 0, -238, 120, "255,220,150", 0.45 * lit);
  }
  g.restore();
}
function awning(g: G, x0: number, x1: number, y: number, a: string, b: string, t: number) {
  const n = Math.round((x1 - x0) / 36);
  const w = (x1 - x0) / n;
  for (let i = 0; i < n; i++) {
    g.fillStyle = i % 2 ? a : b;
    g.beginPath();
    g.moveTo(x0 + i * w, y);
    g.lineTo(x0 + (i + 1) * w, y);
    g.lineTo(x0 + (i + 1) * w + 6, y + 50);
    g.quadraticCurveTo(x0 + (i + 0.5) * w + 3, y + 64 + Math.sin(t * 2 + i) * 2, x0 + i * w + 6, y + 50);
    g.closePath();
    g.fill();
  }
}
export function sign(g: G, x: number, y: number, txt: string, bgc: string, fg: string, size = 30) {
  g.save();
  g.font = `${size}px MVKuaiLe, sans-serif`;
  const w = g.measureText(txt).width + size;
  g.fillStyle = bgc;
  rr(g, x - w / 2, y - size * 0.75, w, size * 1.5, 8);
  g.fill();
  g.fillStyle = fg;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(txt, x, y + 2);
  g.restore();
}
export function bistroTable(g: G, x: number, y: number, s: number, col = "#5a4048") {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  g.fillStyle = "rgba(0,0,0,0.15)";
  g.beginPath();
  g.ellipse(0, 0, 60, 8, 0, 0, TAU);
  g.fill();
  g.fillStyle = col;
  g.fillRect(-3, -70, 6, 70);
  g.fillRect(-26, -4, 52, 4);
  g.fillStyle = "#fffaf4";
  g.beginPath();
  g.ellipse(0, -72, 56, 11, 0, 0, TAU);
  g.fill();
  g.strokeStyle = col;
  g.lineWidth = 2;
  g.stroke();
  g.restore();
}
export const TABLE_TOP = -80; // 相对桌脚 y，杯子放在这里
export function chairBistro(g: G, x: number, y: number, s: number, flip: number, col = "#5a4048") {
  g.save();
  g.translate(x, y);
  g.scale(s * flip, s);
  g.strokeStyle = col;
  g.lineWidth = 4;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(-14, 0);
  g.lineTo(-10, -42);
  g.lineTo(18, -42);
  g.lineTo(20, 0);
  g.moveTo(16, -42);
  g.quadraticCurveTo(22, -70, 14, -96);
  g.moveTo(-10, -42);
  g.lineTo(-6, -46);
  g.stroke();
  g.restore();
}

// ---------- 一：左岸咖啡馆街口（含对街花店）----------
export interface StreetOpt {
  t: number;
  tone: PTone;
  shop?: boolean; // 画对街花店
}
export function cafeStreet(g: G, c: Cam, o: StreetOpt) {
  const T = PTONES[o.tone], t = o.t;
  sky(g, c, o.tone, t);
  layer(g, c, 1, () => {
    cobbles(g, c, T, 560);
    // 咖啡馆
    g.fillStyle = T.wall;
    g.fillRect(60, 210, 660, 350);
    g.fillStyle = T.dark ? "#2a2c52" : "#7a5560";
    g.fillRect(60, 196, 660, 20);
    for (let i = 0; i < 4; i++) {
      const wx = 100 + i * 160;
      g.fillStyle = T.dark ? `rgba(255,214,140,${0.75})` : "rgba(190,220,235,0.85)";
      rr(g, wx, 250, 100, 120, 50);
      g.fill();
      g.strokeStyle = T.dark ? "#1c1d38" : "#7a5560";
      g.lineWidth = 4;
      g.stroke();
    }
    awning(g, 60, 720, 390, PINK, CREAM, t);
    sign(g, 390, 228, "左岸咖啡", T.dark ? "#ffe7b0" : "#7a5560", T.dark ? "#2a2c52" : CREAM, 30);
    g.fillStyle = T.dark ? "rgba(255,214,140,0.85)" : "rgba(210,230,240,0.85)";
    g.fillRect(140, 460, 520, 100);
    g.strokeStyle = T.dark ? "#1c1d38" : "#7a5560";
    g.lineWidth = 4;
    g.strokeRect(140, 460, 520, 100);
    if (T.dark) glow(g, 400, 520, 360, "255,200,130", 0.25);
    // 花箱
    for (let i = 0; i < 3; i++) {
      const fx0 = 150 + i * 220;
      g.fillStyle = "#6a8f5a";
      g.fillRect(fx0, 440, 90, 20);
      for (let j = 0; j < 7; j++) disc(g, fx0 + 8 + j * 12, 436 - (j % 2) * 6, 7, j % 2 ? PINK : RED);
    }
    lampPost(g, 820, 610, 1.05, T.lamp, T.dark ? "#14152c" : "#4a3a44");
    // 马路中线
    g.fillStyle = T.dark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.6)";
    for (let x = 860; x < 1440; x += 80) g.fillRect(x, 676, 44, 6);
    if (o.shop !== false) flowerShop(g, 1480, T, t);
  });
}
function flowerShop(g: G, x0: number, T: PT, t: number) {
  g.fillStyle = T.dark ? "#33365e" : "#eaf6f0";
  g.fillRect(x0, 250, 520, 310);
  awning(g, x0, x0 + 520, 300, MINT, CREAM, t + 1);
  sign(g, x0 + 260, 272, "花店", T.dark ? "#ffe7b0" : "#3f7a66", T.dark ? "#33365e" : CREAM, 30);
  g.fillStyle = T.dark ? "rgba(255,214,140,0.8)" : "rgba(220,240,240,0.9)";
  g.fillRect(x0 + 40, 380, 200, 180);
  g.fillRect(x0 + 300, 380, 180, 120);
  // 花桶
  for (let i = 0; i < 6; i++) {
    const bx = x0 + 30 + i * 80;
    g.fillStyle = "#7a8fa0";
    g.fillRect(bx, 520, 50, 40);
    for (let j = 0; j < 6; j++) disc(g, bx + 6 + (j % 3) * 18, 512 - Math.floor(j / 3) * 14, 9, [RED, PINK, "#ffd36e", "#c9a0e8"][(i + j) % 4]);
  }
}

// ---------- 二：塞纳河岸 ----------
export interface RiverOpt {
  t: number;
  tone: PTone;
  leaves?: number;
}
export function seine(g: G, c: Cam, o: RiverOpt) {
  const T = PTONES[o.tone], t = o.t;
  sky(g, c, o.tone, t);
  // 河
  layer(g, c, 0.55, () => {
    const [a, b] = span(c, 0.55);
    const wg = g.createLinearGradient(0, 470, 0, 620);
    wg.addColorStop(0, T.dark ? "#2a3570" : "#a8cfe0");
    wg.addColorStop(1, T.dark ? "#151b40" : "#7fb0c8");
    g.fillStyle = wg;
    g.fillRect(a - 100, 480, b - a + 200, 200);
    for (let i = 0; i < 40; i++) {
      const x = a + rnd(i * 1.9) * (b - a), y = 490 + rnd(i * 2.7) * 110;
      g.fillStyle = T.dark ? `rgba(255,220,150,${0.15 + rnd(i) * 0.3})` : "rgba(255,255,255,0.45)";
      g.fillRect(x + Math.sin(t + i) * 8, y, 20 + rnd(i * 3) * 40, 2);
    }
    // 石桥
    g.fillStyle = T.dark ? "#3c3f6c" : "#d8cbb8";
    g.fillRect(600, 430, 900, 40);
    for (let k = 0; k < 3; k++) {
      g.beginPath();
      g.moveTo(600 + k * 300, 470);
      g.lineTo(600 + k * 300, 520);
      g.lineTo(640 + k * 300, 520);
      g.quadraticCurveTo(750 + k * 300, 450, 860 + k * 300, 520);
      g.lineTo(900 + k * 300, 520);
      g.lineTo(900 + k * 300, 470);
      g.fill();
    }
    for (let x = 610; x < 1500; x += 22) g.fillRect(x, 414, 6, 18);
    g.fillRect(600, 410, 900, 5);
    if (T.lamp > 0) for (let k = 0; k < 4; k++) lampPost(g, 620 + k * 290, 430, 0.5, T.lamp, T.dark ? "#14152c" : "#4a3a44");
  });
  layer(g, c, 1, () => {
    const [a, b] = span(c, 1);
    // 河堤
    g.fillStyle = T.dark ? "#2e2f56" : "#e3d4bf";
    g.fillRect(a - 300, 580, b - a + 600, 400);
    g.fillStyle = T.dark ? "#3a3c66" : "#cdbba3";
    g.fillRect(a - 300, 572, b - a + 600, 14);
    // 梧桐树
    for (let i = Math.floor(a / 520) - 1; i <= Math.ceil(b / 520); i++) {
      const x = i * 520 + 120;
      g.fillStyle = T.dark ? "#1d1e3a" : "#7a6050";
      g.fillRect(x - 9, 360, 18, 230);
      for (let j = 0; j < 9; j++) {
        disc(g, x + (rnd(i * 3 + j) - 0.5) * 220, 300 + (rnd(i * 5 + j) - 0.5) * 120, 50 + rnd(i + j * 2) * 30, T.dark ? "rgba(60,70,90,0.9)" : j % 3 ? "#e8b860" : "#d9903c");
      }
      // 旧书摊绿箱
      g.fillStyle = T.dark ? "#2d4a48" : "#4f8a6e";
      g.fillRect(x + 140, 548, 120, 30);
      g.fillRect(x + 136, 538, 128, 12);
    }
  });
  if ((o.leaves ?? 1) > 0) leaves(g, t, Math.round(26 * (o.leaves ?? 1)), 0, W, 0, H);
}
/** 飘落的梧桐叶 */
export function leaves(g: G, t: number, n: number, x0: number, x1: number, y0: number, y1: number, seed = 0) {
  for (let i = 0; i < n; i++) {
    const s = seed + i * 2.3;
    const w = x1 - x0, h = y1 - y0;
    let x = (rnd(s) * w + t * (30 + rnd(s + 1) * 40) + Math.sin(t * 1.2 + i) * 30) % w;
    if (x < 0) x += w;
    const y = (rnd(s + 2) * h + t * (40 + rnd(s + 3) * 40)) % h;
    leaf(g, x0 + x, y0 + y, 0.8 + rnd(s + 4) * 0.6, t * (1 + rnd(s + 5)) + i, i % 3 ? LEAF : "#d27a34");
  }
}
export function leaf(g: G, x: number, y: number, s: number, rot: number, col = LEAF) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.scale(s, s);
  g.fillStyle = col;
  g.beginPath();
  g.moveTo(0, -14);
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + ((i + 0.5) / 5) * Math.PI * 2;
    g.quadraticCurveTo(Math.cos(a - 0.6) * 6, Math.sin(a - 0.6) * 6, Math.cos(a) * 14, Math.sin(a) * 14);
  }
  g.closePath();
  g.fill();
  g.strokeStyle = "rgba(120,60,20,0.6)";
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(0, 16);
  g.lineTo(0, -10);
  g.stroke();
  g.restore();
}

// ---------- 三：香榭大道 ----------
export function avenue(g: G, c: Cam, o: RiverOpt) {
  const T = PTONES[o.tone], t = o.t;
  sky(g, c, o.tone, t);
  layer(g, c, 0.25, () => {
    // 远处凯旋门
    g.fillStyle = `rgba(${T.far},0.55)`;
    g.fillRect(560, 330, 160, 230);
    g.fillStyle = PTONES[o.tone].sky1;
    g.beginPath();
    g.moveTo(605, 560);
    g.lineTo(605, 430);
    g.quadraticCurveTo(640, 390, 675, 430);
    g.lineTo(675, 560);
    g.fill();
  });
  layer(g, c, 1, () => {
    cobbles(g, c, T, 560);
    const [a, b] = span(c, 1);
    // 两排树往远处收
    for (let side = -1; side <= 1; side += 2)
      for (let k = 0; k < 6; k++) {
        const d = 1 - k * 0.14, x = 640 + side * (120 + 520 * d), y = 560 + 120 * d;
        g.fillStyle = T.dark ? "#1d1e3a" : "#7a6050";
        g.fillRect(x - 6 * d, y - 210 * d, 12 * d, 210 * d);
        for (let j = 0; j < 6; j++) disc(g, x + (rnd(k * 7 + j + side) - 0.5) * 160 * d, y - 230 * d + (rnd(k + j * 3) - 0.5) * 90 * d, 44 * d, T.dark ? "rgba(60,70,90,0.9)" : j % 2 ? "#e8b860" : "#d9903c");
      }
    // 落叶铺地
    for (let i = 0; i < 70; i++) leaf(g, a + rnd(i * 1.7) * (b - a), 600 + rnd(i * 2.9) * 110, 0.9, rnd(i) * 6, i % 3 ? LEAF : "#d27a34");
  });
  if ((o.leaves ?? 1) > 0) leaves(g, t, Math.round(30 * (o.leaves ?? 1)), 0, W, 0, H, 7);
}

// ---------- 道具 ----------
/** 气球：(x,y) 是气球中心；绳子垂到 (sx,sy) */
export function balloon(g: G, x: number, y: number, r: number, col: string, t: number, sx?: number, sy?: number, smile = 0, heart = true) {
  if (sx !== undefined && sy !== undefined) {
    g.strokeStyle = "rgba(90,60,70,0.8)";
    g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(x, y + r * 1.05);
    g.bezierCurveTo(x + Math.sin(t * 2) * 14, y + r * 1.05 + (sy - y) * 0.4, sx - Math.sin(t * 2.4) * 12, sy - (sy - y) * 0.3, sx, sy);
    g.stroke();
  }
  g.save();
  g.translate(x, y);
  g.rotate(Math.sin(t * 1.6) * 0.06);
  g.fillStyle = col;
  g.beginPath();
  if (heart) {
    g.moveTo(0, r * 0.95);
    g.bezierCurveTo(-r * 1.25, r * 0.1, -r * 0.95, -r * 1.05, 0, -r * 0.45);
    g.bezierCurveTo(r * 0.95, -r * 1.05, r * 1.25, r * 0.1, 0, r * 0.95);
  } else g.ellipse(0, 0, r * 0.85, r, 0, 0, TAU);
  g.fill();
  g.fillStyle = "rgba(255,255,255,0.45)";
  g.beginPath();
  g.ellipse(-r * 0.42, -r * 0.35, r * 0.16, r * 0.26, -0.5, 0, TAU);
  g.fill();
  g.fillStyle = col;
  g.beginPath();
  g.moveTo(-4, r * 0.95);
  g.lineTo(4, r * 0.95);
  g.lineTo(0, r * 1.07);
  g.fill();
  if (smile > 0) {
    g.strokeStyle = `rgba(255,255,255,${smile})`;
    g.lineWidth = r * 0.09;
    g.lineCap = "round";
    disc(g, -r * 0.3, -r * 0.08, r * 0.08, `rgba(255,255,255,${smile})`);
    disc(g, r * 0.3, -r * 0.08, r * 0.08, `rgba(255,255,255,${smile})`);
    g.beginPath();
    g.arc(0, r * 0.08, r * 0.32, 0.2, Math.PI - 0.2);
    g.stroke();
  }
  g.restore();
}
/** 咖啡杯：杯底中心 (x,y)；lip 唇印（零到一）；swirl 搅拌圈数 */
export function coffee(g: G, x: number, y: number, s: number, t: number, lip = 0, steamA = 0.6) {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  g.fillStyle = "#f3e8dc";
  g.beginPath();
  g.ellipse(0, 0, 26, 6, 0, 0, TAU);
  g.fill();
  g.fillStyle = "#fffaf4";
  g.beginPath();
  g.moveTo(-17, -30);
  g.lineTo(17, -30);
  g.quadraticCurveTo(16, -2, 0, -2);
  g.quadraticCurveTo(-16, -2, -17, -30);
  g.fill();
  g.strokeStyle = "#fffaf4";
  g.lineWidth = 4;
  g.beginPath();
  g.arc(19, -20, 7, -1.3, 1.3);
  g.stroke();
  g.fillStyle = "#7a4a30";
  g.beginPath();
  g.ellipse(0, -30, 17, 4, 0, 0, TAU);
  g.fill();
  if (lip > 0) {
    g.fillStyle = `rgba(232,74,95,${lip})`;
    g.beginPath();
    g.ellipse(-8, -27, 4, 2.4, 0.2, 0, TAU);
    g.ellipse(-3, -27, 4, 2.4, -0.2, 0, TAU);
    g.fill();
  }
  if (steamA > 0)
    for (let j = 0; j < 2; j++) {
      g.strokeStyle = `rgba(255,255,255,${steamA})`;
      g.lineWidth = 2.4;
      g.beginPath();
      for (let i = 0; i <= 10; i++) {
        const u = i / 10, px = (j ? 6 : -6) + Math.sin(u * 5 + t * 2.4 + j * 2) * 5, py = -36 - u * 44;
        if (i === 0) g.moveTo(px, py);
        else g.lineTo(px, py);
      }
      g.stroke();
    }
  g.restore();
}
export function rose(g: G, x: number, y: number, s: number, col = RED) {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  g.strokeStyle = "#5a8a4a";
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(0, 40);
  g.stroke();
  disc(g, 0, 0, 10, col);
  g.strokeStyle = "rgba(90,10,20,0.45)";
  g.lineWidth = 1.5;
  g.beginPath();
  g.arc(0, 0, 6, 0.5, 4.5);
  g.stroke();
  g.restore();
}
/** 一束玫瑰：花束底在 (x,y) */
export function bouquet(g: G, x: number, y: number, s: number) {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  for (let i = 0; i < 7; i++) rose(g, (i - 3) * 9 + Math.sin(i) * 3, -60 - Math.abs(i - 3) * -4 - (i % 2) * 10, 1, i % 3 ? RED : PINK);
  g.fillStyle = "#f6e6f0";
  g.beginPath();
  g.moveTo(-38, -56);
  g.lineTo(38, -56);
  g.lineTo(8, 0);
  g.lineTo(-8, 0);
  g.closePath();
  g.fill();
  g.fillStyle = RED;
  g.fillRect(-10, -24, 20, 8);
  g.restore();
}
/** 小卡片：中心 (x,y)；写错的名字被划掉，再写上对的 */
export function card(g: G, x: number, y: number, s: number, rot: number, wrong: string, right: string, cross: number, fix: number) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.scale(s, s);
  g.fillStyle = "rgba(0,0,0,0.15)";
  rr(g, -86, -50, 180, 110, 8);
  g.fill();
  g.fillStyle = "#fffaf4";
  rr(g, -90, -56, 180, 110, 8);
  g.fill();
  g.strokeStyle = PINK;
  g.lineWidth = 3;
  g.stroke();
  g.fillStyle = INK;
  g.font = "26px MVKuaiLe, sans-serif";
  g.textAlign = "left";
  g.textBaseline = "middle";
  g.fillText("致", -72, -22);
  g.fillText(wrong, -30, -22);
  const ww = g.measureText(wrong).width;
  if (cross > 0) {
    g.strokeStyle = RED;
    g.lineWidth = 3.5;
    g.beginPath();
    g.moveTo(-34, -22);
    g.lineTo(-34 + (ww + 8) * clamp(cross), -24);
    g.stroke();
  }
  if (fix > 0) {
    g.globalAlpha = clamp(fix);
    g.fillStyle = RED;
    g.font = "30px MVKuaiLe, sans-serif";
    g.fillText(right, -24, 18);
    g.globalAlpha = 1;
  }
  disc(g, 70, 30, 8, RED);
  g.restore();
}
/** 香水瓶：瓶底中心 (x,y)；inner 往瓶身里画东西（已裁切） */
export function perfume(g: G, x: number, y: number, s: number, t: number, inner?: (g: G) => void) {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  const body = () => {
    g.beginPath();
    g.moveTo(-60, 0);
    g.quadraticCurveTo(-74, -80, -40, -130);
    g.lineTo(40, -130);
    g.quadraticCurveTo(74, -80, 60, 0);
    g.closePath();
  };
  body();
  g.fillStyle = "rgba(255,210,226,0.55)";
  g.fill();
  g.save();
  body();
  g.clip();
  if (inner) inner(g);
  g.restore();
  body();
  g.strokeStyle = "rgba(255,255,255,0.9)";
  g.lineWidth = 3;
  g.stroke();
  g.fillStyle = "rgba(255,255,255,0.5)";
  g.beginPath();
  g.ellipse(-36, -70, 6, 30, 0.1, 0, TAU);
  g.fill();
  g.fillStyle = GOLD;
  g.fillRect(-16, -150, 32, 20);
  g.fillStyle = PINK;
  g.beginPath();
  g.ellipse(0, -164, 20, 16, 0, 0, TAU);
  g.fill();
  void t;
  g.restore();
}
/** 画架：底中心 (x,y)；paint 往画布里画（画布坐标 -70..70, -190..-60） */
export function easel(g: G, x: number, y: number, s: number, paint?: (g: G) => void) {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  g.strokeStyle = "#8a6040";
  g.lineWidth = 6;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(-50, 0);
  g.lineTo(0, -210);
  g.lineTo(50, 0);
  g.moveTo(0, -210);
  g.lineTo(0, 0);
  g.stroke();
  g.fillStyle = "#fffaf0";
  g.fillRect(-74, -194, 148, 138);
  g.save();
  g.beginPath();
  g.rect(-70, -190, 140, 130);
  g.clip();
  if (paint) paint(g);
  g.restore();
  g.strokeStyle = "#8a6040";
  g.lineWidth = 4;
  g.strokeRect(-74, -194, 148, 138);
  g.fillRect(-80, -58, 160, 8);
  g.restore();
}
/** 粉笔画的地球：中心 (x,y)，p 画到几成 */
export function chalkGlobe(g: G, x: number, y: number, rx: number, ry: number, p: number, col: string) {
  g.save();
  g.strokeStyle = col;
  g.lineWidth = 4;
  g.lineCap = "round";
  g.setLineDash([10, 6]);
  g.beginPath();
  g.ellipse(x, y, rx, ry, 0, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(p));
  g.stroke();
  g.setLineDash([]);
  if (p > 0.5) {
    const k = ss((p - 0.5) * 2);
    g.globalAlpha = k;
    g.beginPath();
    g.ellipse(x, y, rx * 0.5, ry, 0, 0, TAU);
    g.moveTo(x - rx, y);
    g.lineTo(x + rx, y);
    g.stroke();
    g.fillStyle = col;
    g.globalAlpha = k * 0.25;
    g.beginPath();
    g.ellipse(x - rx * 0.35, y - ry * 0.2, rx * 0.22, ry * 0.3, 0.4, 0, TAU);
    g.ellipse(x + rx * 0.3, y + ry * 0.25, rx * 0.25, ry * 0.25, -0.3, 0, TAU);
    g.fill();
  }
  g.restore();
}
/** 心形泡泡 */
export function hearts(g: G, t: number, n: number, x: number, y: number, spread: number, a = 1, seed = 0) {
  for (let i = 0; i < n; i++) {
    const s = seed + i * 3.7, ph = (t * (0.4 + rnd(s) * 0.3) + rnd(s + 1)) % 1;
    const hx = x + (rnd(s + 2) - 0.5) * spread + Math.sin(ph * 6 + i) * 12, hy = y - ph * 200;
    const r = 6 + rnd(s + 3) * 8;
    g.save();
    g.globalAlpha = a * (1 - ph) * 0.9;
    g.fillStyle = i % 2 ? PINK : RED;
    g.translate(hx, hy);
    g.beginPath();
    g.moveTo(0, r * 0.9);
    g.bezierCurveTo(-r * 1.2, 0, -r * 0.8, -r, 0, -r * 0.4);
    g.bezierCurveTo(r * 0.8, -r, r * 1.2, 0, 0, r * 0.9);
    g.fill();
    g.restore();
  }
}
/** 便当框式的标价牌（狐狸举的） */
export function priceTag(g: G, x: number, y: number, s: number, txt: string, rot = 0) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.scale(s, s);
  g.fillStyle = "#fff3c8";
  g.beginPath();
  g.moveTo(-50, -26);
  g.lineTo(40, -26);
  g.lineTo(62, 0);
  g.lineTo(40, 26);
  g.lineTo(-50, 26);
  g.closePath();
  g.fill();
  g.strokeStyle = "#b08a3a";
  g.lineWidth = 3;
  g.stroke();
  disc(g, 44, 0, 5, "#b08a3a");
  g.fillStyle = INK;
  g.font = "28px MVKuaiLe, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText(txt, -6, 2);
  g.restore();
}
export { lerp, eo, ss, clamp, C };
