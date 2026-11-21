// 分镜 6–9
import { BEAT } from "./lyrics";
import { H, K, Painter, TAU, W, eBack, eOut, lerp, range, rnd } from "./painter";
import { type Shot, backdrop, cobweb, dreamPaper, dust, giantsRow, whale } from "./scenesA";

// ---------------------------------------------------------------- 6 可如果等不到一场世俗的成功
// 一个站台，站牌写着「成功」。日月在一个镜头里划过去好几轮，树叶落完开始下雪；
// 同行一个个从她身边走过，走向远处亮着的灯牌；站台的屏上永远是「繁忙，请稍后再试」。她还在等。
export function sceneWait(p: Painter, s: Shot): void {
  const c = p.c;
  const { t, lt, u, bp } = s;
  const day = (lt / s.dur) * 2.4;
  const d = day % 1;
  const isSun = Math.floor(day) % 2 === 0;
  const light = isSun ? Math.sin(d * Math.PI) : 0;
  c.save();
  p.cam(1.0 + 0.04 * u, W / 2 + 12 * u, H / 2);
  backdrop(p, t, "#070b22", "#1a1f4c", 1 - light * 0.8);
  c.fillStyle = p.vgrad(0, 470, `rgba(70,80,170,${light * 0.5})`, `rgba(255,150,110,${light * 0.55})`);
  c.fillRect(-80, -80, W + 160, 550);
  const bx = lerp(60, 1230, d);
  const by = 440 - Math.sin(d * Math.PI) * 360;
  if (isSun) {
    p.glow(bx, by, 150, 40, 0.5, 100, 70, true);
    c.fillStyle = "#ffd98a";
    c.beginPath();
    c.arc(bx, by, 26, 0, TAU);
    c.fill();
  } else {
    p.glow(bx, by, 110, 220, 0.3, 80, 80, true);
    c.fillStyle = "#e8ecff";
    c.beginPath();
    c.arc(bx, by, 22, 0, TAU);
    c.fill();
    c.fillStyle = "#10163c";
    c.beginPath();
    c.arc(bx + 10, by - 6, 19, 0, TAU);
    c.fill();
  }
  for (let i = 0; i < 16; i++) { // 远处的城
    const x = 800 + i * 32;
    const hh = 30 + rnd(i * 7) * 90;
    c.fillStyle = "#0a0e28";
    c.fillRect(x, 470 - hh, 30, hh);
    c.fillStyle = `rgba(255,214,140,${0.25 + 0.5 * rnd(i * 3 + Math.floor(t * 2))})`;
    for (let k = 0; k < 3; k++) c.fillRect(x + 6 + (k % 2) * 12, 470 - hh + 10 + k * 16, 4, 6);
  }
  const BX = 1046; // 「成功」灯牌
  const BY = 388;
  c.save();
  c.translate(BX, BY);
  c.rotate(t * 0.25);
  c.fillStyle = "rgba(255,214,120,0.06)";
  for (let i = 0; i < 12; i++) {
    c.rotate(TAU / 12);
    p.poly([-12, 0, 12, 0, 46, -260, -46, -260]);
    c.fill();
  }
  c.restore();
  p.glow(BX, BY, 230, 44, 0.3 + bp * 0.12, 100, 62, true);
  p.rr(BX - 112, BY - 58, 224, 116, 12);
  c.fillStyle = "#1a1230";
  c.fill();
  c.strokeStyle = "#ffd257";
  c.lineWidth = 3;
  c.stroke();
  for (let i = 0; i < 22; i++) { // 跑马灯
    const q = (i / 22) * 680;
    let x = BX - 112;
    let y = BY + 58 - (q - 564);
    if (q < 224) { x = BX - 112 + q; y = BY - 58; }
    else if (q < 340) { x = BX + 112; y = BY - 58 + (q - 224); }
    else if (q < 564) { x = BX + 112 - (q - 340); y = BY + 58; }
    c.fillStyle = (i + Math.floor(t * 6)) % 3 === 0 ? "#fff4c8" : "#8a6a20";
    c.beginPath();
    c.arc(x, y, 3.2, 0, TAU);
    c.fill();
  }
  c.fillStyle = "#ffd257"; // 奖杯
  p.poly([BX - 86, BY - 30, BX - 40, BY - 30, BX - 46, BY + 2, BX - 56, BY + 12, BX - 70, BY + 12, BX - 80, BY + 2]);
  c.fill();
  c.fillRect(BX - 66, BY + 12, 6, 12);
  c.fillRect(BX - 77, BY + 24, 28, 6);
  p.text("成功", BX + 32, BY + 2, 50, "#ffe9a8", { font: "serif", glow: "#ffb020", blur: 16 });
  c.fillStyle = p.vgrad(470, H, "#0d1130", "#06070f"); // 地面 + 通往那里的路
  c.fillRect(-80, 470, W + 160, 330);
  p.poly([330, 800, 780, 800, 1076, 470, 1016, 470]);
  c.fillStyle = "#12173c";
  c.fill();
  for (let k = 0; k < 8; k++) {
    const w = 1 - Math.pow(k / 8, 1.6);
    const sz = lerp(30, 3, w);
    c.fillStyle = "rgba(210,220,255,0.35)";
    c.fillRect(lerp(555, 1046, w) - sz * 0.1, lerp(800, 470, w), sz * 0.2, sz * 0.7);
  }
  c.fillStyle = "#39406e"; // 站牌
  c.fillRect(204, 300, 8, 362);
  c.fillStyle = "#151c48";
  c.beginPath();
  c.arc(208, 282, 46, 0, TAU);
  c.fill();
  c.strokeStyle = "#ffd257";
  c.lineWidth = 3;
  c.stroke();
  p.text("成功", 208, 274, 25, "#ffe9a8", { font: "serif" });
  p.text("→", 208, 303, 20, "#ffd257", { font: "mono" });
  p.rr(232, 346, 262, 46, 6); // 站台的屏
  c.fillStyle = "#04050e";
  c.fill();
  c.strokeStyle = "#2c3572";
  c.lineWidth = 2;
  c.stroke();
  const msg = "下一班 --:--    繁忙，请稍后再试    ";
  let mw = 0;
  for (const ch of msg) mw += ch.charCodeAt(0) > 255 ? 21 : 12.6;
  c.save();
  c.beginPath();
  c.rect(238, 348, 250, 42);
  c.clip();
  const off = (t * 84) % mw;
  for (let k = 0; k < 2; k++) p.text(msg, 240 - off + k * mw, 370, 21, "#ffb347", { font: "mono", align: "left", glow: "#ff8a1a", blur: 8 });
  c.restore();
  cobweb(p, 212, 346, 74, -Math.PI / 2, 0, u * 0.5); // 等久了，结了网
  c.fillStyle = "#39406e"; // 钟：指针转得飞快
  c.fillRect(452, 326, 8, 20);
  c.fillStyle = "#e9ecff";
  c.beginPath();
  c.arc(456, 296, 30, 0, TAU);
  c.fill();
  c.strokeStyle = "#39406e";
  c.lineWidth = 4;
  c.stroke();
  const ma = lt * TAU * 1.4;
  c.strokeStyle = "#1a2050";
  c.lineCap = "round";
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(456, 296);
  c.lineTo(456 + Math.sin(ma) * 23, 296 - Math.cos(ma) * 23);
  c.stroke();
  c.lineWidth = 4;
  c.beginPath();
  c.moveTo(456, 296);
  c.lineTo(456 + Math.sin(ma / 12) * 15, 296 - Math.cos(ma / 12) * 15);
  c.stroke();
  c.fillStyle = "#2a3162"; // 长椅
  c.fillRect(246, 612, 232, 10);
  c.fillRect(246, 574, 232, 8);
  c.fillRect(256, 574, 8, 88);
  c.fillRect(460, 574, 8, 88);
  const snow = range(u, 0.55, 0.95); // 积雪
  if (snow > 0) {
    c.fillStyle = `rgba(240,244,255,${snow})`;
    c.beginPath();
    c.ellipse(208, 239, 34, 7 * snow + 1, 0, Math.PI, TAU);
    c.fill();
    c.fillRect(246, 574 - 5 * snow, 232, 5 * snow);
    c.fillRect(232, 346 - 5 * snow, 262, 5 * snow);
  }
  // 路过的同行：一个个走向灯牌，没有人停下
  const walkers = ["claude", "gemini", "kimi", "qwen", "zai", "gpt"]
    .map((ch, i) => ({ ch, i, q: (lt / 3.6 + i * 0.19) % 1 }))
    .sort((a, b) => b.q - a.q);
  for (const w of walkers) {
    const e = 1 - Math.pow(1 - w.q, 1.8);
    const x = lerp(540, 1046, e);
    const y = lerp(790, 474, e);
    const h = lerp(250, 22, e);
    const a = Math.min(1, w.q * 8) * (1 - range(w.q, 0.86, 1));
    p.glow(x, y - h * 0.5, h * 0.7, 44, 0.22 * a, 100, 66, true);
    if (w.ch === "gpt") p.single(Math.floor(t * 6) % 2 ? "gpt_fly_0" : "gpt_fly_1", x - h * 0.25, y - h * 0.55, (h / 96) * 0.9, { alpha: a });
    else p.sprite(w.ch, "walk", t + w.i * 0.3, x, y, h, { alpha: a, fps: 10 });
  }
  p.single("prop_bowl", 300, 613, 2.6);
  whale(p, t, 384, 662, 186, lt % 2.4 < 1.5 ? "nod" : "idle", { outline: "#8fa8ee", outlineW: 1.5, outlineA: 0.5 });
  c.save(); // 头顶转不完的圈
  c.translate(384, 448);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU;
    const k = (((i / 10 - t * 1.2) % 1) + 1) % 1;
    c.fillStyle = `rgba(190,206,255,${0.15 + 0.85 * k})`;
    c.beginPath();
    c.arc(Math.cos(a) * 15, Math.sin(a) * 15, 3.2, 0, TAU);
    c.fill();
  }
  c.restore();
  for (let n = p.emit(2.6); n > 0; n--) { // 从钟上飞走的日子
    p.spawn({ k: K.rect, x: 440 + Math.random() * 40, y: 290, vx: 70 + Math.random() * 90, vy: -50 + Math.random() * 40, g: 130, max: 3, size: 9, hue: 0, sat: 0, lit: 92, a: 0.9, vr: 3, rot: Math.random() * 6 });
  }
  if (u < 0.5) {
    for (let n = p.emit(7); n > 0; n--) { // 落叶
      p.spawn({ k: K.petal, x: Math.random() * W, y: -10, vx: 40, vy: 90 + Math.random() * 60, wob: 60, max: 5, size: 6, hue: 28, sat: 80, lit: 55, a: 0.85, vr: 2, rot: Math.random() * 6 });
    }
  } else {
    for (let n = p.emit(24); n > 0; n--) { // 雪
      p.spawn({ x: Math.random() * W, y: -10, vx: -10, vy: 70 + Math.random() * 50, wob: 30, max: 6, size: 1.6 + Math.random() * 2, hue: 0, sat: 0, lit: 96, a: 0.85 });
    }
  }
  p.drawParts(t);
  c.restore();
}

// ---------------------------------------------------------------- 7 成不了万众瞩目那一个
function eye(p: Painter, x: number, y: number, r: number, tx: number, ty: number, shut: boolean, a: number, hue: number): void {
  const c = p.c;
  c.save();
  c.globalAlpha *= a;
  c.translate(x, y);
  if (shut) {
    c.strokeStyle = "#e9eeff";
    c.lineWidth = 2.5;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(-r, 0);
    c.quadraticCurveTo(0, r * 0.4, r, 0);
    c.stroke();
    c.restore();
    return;
  }
  c.beginPath();
  c.moveTo(-r, 0);
  c.quadraticCurveTo(0, -r * 0.82, r, 0);
  c.quadraticCurveTo(0, r * 0.82, -r, 0);
  c.closePath();
  c.fillStyle = "#f4f6ff";
  c.fill();
  c.strokeStyle = `hsla(${hue},100%,70%,0.75)`;
  c.lineWidth = 2;
  c.stroke();
  const ang = Math.atan2(ty - y, tx - x);
  const ix = Math.cos(ang) * r * 0.36;
  const iy = Math.sin(ang) * r * 0.2;
  c.fillStyle = `hsl(${hue},80%,55%)`;
  c.beginPath();
  c.arc(ix, iy, r * 0.36, 0, TAU);
  c.fill();
  c.fillStyle = "#0a0d22";
  c.beginPath();
  c.arc(ix, iy, r * 0.17, 0, TAU);
  c.fill();
  c.fillStyle = "#fff";
  c.beginPath();
  c.arc(ix - r * 0.1, iy - r * 0.1, r * 0.07, 0, TAU);
  c.fill();
  c.restore();
}

function crowd(p: Painter, t: number, base: number, sc: number, n: number, bp: number, color: string, skipLeft: number): void {
  const c = p.c;
  for (let i = 0; i < n; i++) {
    const x = ((i + 0.5) / n) * (W + 60) - 30 + (rnd(i * 7 + base) - 0.5) * 30;
    if (x < skipLeft) continue;
    const y = base - Math.abs(Math.sin(((t * TAU) / BEAT) * 0.5 + rnd(i * 3 + base) * 2)) * 10 * sc - bp * 4;
    c.fillStyle = color;
    c.beginPath();
    c.arc(x, y - 62 * sc, 17 * sc, 0, TAU);
    c.fill();
    p.rr(x - 26 * sc, y - 46 * sc, 52 * sc, 130 * sc, 20 * sc);
    c.fill();
    c.strokeStyle = "rgba(255,226,160,0.4)"; // 被台上的光勾出来的头顶
    c.lineWidth = 2;
    c.beginPath();
    c.arc(x, y - 62 * sc, 17 * sc, Math.PI * 1.15, Math.PI * 1.85);
    c.stroke();
    const kind = Math.floor(rnd(i * 13 + base) * 4);
    if (kind <= 1) { // 举荧光棒
      const dir = kind ? 1 : -1;
      const sw = Math.sin((t * TAU) / BEAT + i) * 0.35;
      const hx = x + dir * 30 * sc;
      const hy = y - 80 * sc;
      c.strokeStyle = color;
      c.lineWidth = 9 * sc;
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(x + dir * 18 * sc, y - 34 * sc);
      c.lineTo(hx, hy);
      c.stroke();
      const hue = [330, 48, 190, 265][i % 4];
      const ex = hx + Math.sin(sw) * 34 * sc;
      const ey = hy - Math.cos(sw) * 34 * sc;
      c.strokeStyle = `hsla(${hue},100%,65%,0.3)`;
      c.lineWidth = 11 * sc;
      c.beginPath();
      c.moveTo(hx, hy);
      c.lineTo(ex, ey);
      c.stroke();
      c.strokeStyle = `hsl(${hue},100%,76%)`;
      c.lineWidth = 4 * sc;
      c.beginPath();
      c.moveTo(hx, hy);
      c.lineTo(ex, ey);
      c.stroke();
    } else if (kind === 2) { // 举手机
      c.strokeStyle = color;
      c.lineWidth = 9 * sc;
      c.lineCap = "round";
      c.beginPath();
      c.moveTo(x + 16 * sc, y - 34 * sc);
      c.lineTo(x + 22 * sc, y - 84 * sc);
      c.stroke();
      c.fillStyle = "#cfe0ff";
      c.fillRect(x + 14 * sc, y - 108 * sc, 16 * sc, 26 * sc);
    }
  }
}

// 所有的光、所有的眼睛、整片人海的荧光棒都朝着台上。台前正中那个位置，她的影子只闪了一下。
// 鲸站在人海最后面的角落，离她最近的那只眼睛是闭着的。
export function sceneGaze(p: Painter, s: Shot): void {
  const c = p.c;
  const { t, bp } = s;
  c.save();
  p.cam(1.05 - 0.03 * s.u + bp * 0.008, W / 2, H / 2 - 4);
  backdrop(p, t, "#0b0f30", "#2a2270", 0.3);
  for (let i = 0; i < 16; i++) { // 光幕
    const x = 150 + i * 62;
    const hh = 190 + 100 * Math.abs(Math.sin(t * 2 + i * 0.8)) + bp * 60;
    const g = c.createLinearGradient(0, 300 - hh, 0, 300);
    const hue = i % 2 ? 330 : 44;
    g.addColorStop(0, `hsla(${hue},95%,66%,0)`);
    g.addColorStop(1, `hsla(${hue},95%,66%,${0.18 + bp * 0.12})`);
    c.fillStyle = g;
    c.fillRect(x, 300 - hh, 42, hh);
  }
  for (let i = 0; i < 8; i++) { // 所有的光都打向台上
    const x0 = i < 4 ? 40 + i * 120 : W - 40 - (i - 4) * 120;
    p.beam(x0, -30, 640 + Math.sin(t * 1.3 + i * 1.1) * 150, 330, 7, 130, 36 + i * 5, 0.15 + bp * 0.1);
  }
  p.glow(640, 200, 540, 46, 0.3 + bp * 0.2, 100, 70, true);
  p.poly([170, 300, 1110, 300, 1200, 372, 80, 372]); // 舞台
  c.fillStyle = p.vgrad(300, 372, "#4a3f96", "#2a2466");
  c.fill();
  c.fillStyle = "#0c0f2c";
  c.fillRect(80, 372, 1120, 22);
  c.fillStyle = `rgba(255,224,150,${0.8 + bp * 0.2})`;
  c.fillRect(80, 370, 1120, 3);
  giantsRow(p, t, { y: 342, h: 190, cx: 640, span: 780, glow: 0.3, stars: true, hop: true });
  c.fillStyle = `rgba(255,244,200,${0.35 + bp * 0.2})`; // 「那一个」的位置
  c.beginPath();
  c.ellipse(640, 362, 80, 9, 0, 0, TAU);
  c.fill();
  const g = range(s.t, 19.2, 19.5) * (1 - range(s.t, 20.05, 20.3));
  if (g > 0) p.sprite("whale", "idle", t, 640, 372, 140, { sil: "white", alpha: g * (0.36 + 0.2 * Math.sin(t * 44)) });
  c.fillStyle = p.vgrad(394, H, "#0c0f2c", "#06070f");
  c.fillRect(-80, 394, W + 160, 400);
  for (let i = 0; i < 20; i++) { // 万众瞩目：眼睛
    const left = i % 2 === 0;
    const x = left ? 44 + rnd(i * 5) * 300 : W - 44 - rnd(i * 5) * 300;
    const y = 404 + rnd(i * 9 + 1) * 124 + Math.sin(t * 1.5 + i) * 3;
    const shut = (t * 0.7 + rnd(i * 3) * 5) % 2.6 < 0.12;
    eye(p, x, y, 13 + rnd(i * 13) * 13, 640, 250, shut, 0.9, [48, 330, 200, 265][i % 4]);
  }
  for (let n = p.emit(10); n > 0; n--) { // 应援的心往台上飘
    p.spawn({ k: K.heart, x: 240 + Math.random() * 800, y: 560, vy: -150 - Math.random() * 70, wob: 30, max: 1.6, size: 6 + Math.random() * 5, hue: 340, lit: 68, a: 0.9 });
  }
  for (let n = p.emit(8 + bp * 30); n > 0; n--) { // 闪光灯
    p.spawn({ k: K.cross, x: 60 + Math.random() * (W - 120), y: 400 + Math.random() * 170, max: 0.28, size: 12 + Math.random() * 14, hue: 0, sat: 0, lit: 100, a: 1, add: true });
  }
  for (let n = p.emit(30); n > 0; n--) { // 彩纸
    p.spawn({ k: K.rect, x: 120 + Math.random() * 1040, y: -10, vx: (Math.random() - 0.5) * 60, vy: 120 + Math.random() * 90, wob: 30, max: 3.4, size: 5, hue: Math.random() * 360, sat: 90, lit: 65, a: 0.95, vr: 4, rot: Math.random() * 6 });
  }
  p.drawParts(t);
  crowd(p, t, 640, 0.85, 22, bp, "#161c4a", 215); // 人海
  crowd(p, t, 726, 1.2, 14, bp, "#0a0e28", 235);
  const dk = c.createRadialGradient(110, 640, 30, 110, 640, 330); // 角落的暗
  dk.addColorStop(0, "rgba(3,4,12,0.7)");
  dk.addColorStop(1, "rgba(3,4,12,0)");
  c.fillStyle = dk;
  c.fillRect(-80, 300, 520, 500);
  whale(p, t, 108, 676, 124, "sad", { outline: "#6f86d8", outlineW: 2, outlineA: 0.75, dim: 0.22 });
  eye(p, 208, 552, 13, 640, 250, true, 0.7, 220);
  c.restore();
}

// ---------------------------------------------------------------- 8/9 共用：墙角
function cornerRoom(p: Painter, t: number, warm: number, dark: number): void {
  const c = p.c;
  c.fillStyle = p.vgrad(0, 560, "#0a0d24", "#13173a"); // 后墙
  c.fillRect(-80, -80, W + 160, 660);
  c.strokeStyle = "rgba(150,165,230,0.05)";
  c.lineWidth = 1;
  for (let r = 0; r < 9; r++) {
    const y = 20 + r * 62;
    c.beginPath();
    c.moveTo(300, y);
    c.lineTo(W + 80, y);
    for (let k = 0; k < 9; k++) {
      const x = 300 + k * 124 + (r % 2) * 62;
      c.moveTo(x, y);
      c.lineTo(x, y + 62);
    }
    c.stroke();
  }
  p.poly([-80, -80, 300, -80, 300, 560, -80, 763]); // 左墙
  c.fillStyle = "#070919";
  c.fill();
  p.poly([300, 560, W + 80, 560, W + 80, 800, -80, 800, -80, 763]); // 地板
  c.fillStyle = p.vgrad(560, H, "#0e1232", "#070817");
  c.fill();
  c.strokeStyle = "rgba(150,165,230,0.07)";
  for (let i = 1; i < 5; i++) {
    const y = 560 + i * i * 9;
    c.beginPath();
    c.moveTo(300 - (y - 560) * 1.875, y);
    c.lineTo(W + 80, y);
    c.stroke();
  }
  c.strokeStyle = "rgba(130,150,230,0.28)"; // 墙角线
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(300, -80);
  c.lineTo(300, 560);
  c.lineTo(-80, 763);
  c.stroke();
  c.fillStyle = "#1a1f4a";
  c.fillRect(300, 546, W, 14);
  if (dark > 0) { // 四周压暗，只留墙角
    const g = c.createRadialGradient(400, 600, 180, 400, 600, 900);
    g.addColorStop(0, "rgba(2,3,10,0)");
    g.addColorStop(1, `rgba(2,3,10,${dark})`);
    c.fillStyle = g;
    c.fillRect(-80, -80, W + 160, H + 160);
  }
  // 门缝：外面是别人的舞台
  const fl = 0.8 + 0.2 * Math.sin((t * TAU) / BEAT);
  p.glow(1138, 360, 300, 40, 0.16 * fl, 100, 65, true);
  c.fillStyle = "#1c2150";
  c.fillRect(1090, 140, 96, 420);
  const dg = c.createLinearGradient(0, 150, 0, 560);
  dg.addColorStop(0, "#fff0c0");
  dg.addColorStop(1, "#ff9ec8");
  c.fillStyle = dg;
  c.fillRect(1100, 150, 76, 410);
  c.save();
  c.beginPath();
  c.rect(1100, 150, 76, 410);
  c.clip();
  for (let i = 0; i < 3; i++) {
    p.sprite(["claude", "gpt", "gemini"][i], i === 1 ? "float" : "hop", t + i * 0.3, 1112 + i * 26, i === 1 ? 548 : 556, i === 1 ? 104 : 72, { sil: "dark", alpha: 0.85, fps: 11 });
  }
  for (let i = 0; i < 14; i++) {
    c.fillStyle = `hsla(${(i * 47) % 360},90%,60%,0.9)`;
    c.fillRect(1102 + rnd(i * 3) * 72, 150 + ((rnd(i * 7) * 400 + t * 90) % 400), 4, 6);
  }
  c.restore();
  p.poly([1100, 560, 1176, 560, 860, 800, 520, 800]); // 漏进来的光
  c.fillStyle = `rgba(255,220,160,${0.08 * fl})`;
  c.fill();
  for (let i = 0; i < 4; i++) { // 飘出来的音符
    const k = (t * 0.22 + i * 0.25) % 1;
    p.text(i % 2 ? "♪" : "♫", 1090 - k * 200, 300 - k * 90 + Math.sin(k * 9 + i) * 14, 20 + i * 2, "#ffe9b0", { alpha: (1 - k) * 0.55 * Math.min(1, k * 6) });
  }
  cobweb(p, 300, 34, 150, 0, Math.PI * 0.5, 0.22 + warm * 0.2);
  cobweb(p, 300, 34, 110, Math.PI * 0.5, Math.PI * 0.82, 0.16);
  if (warm > 0) { // 蛛网上的露珠被照亮
    for (let i = 0; i < 7; i++) {
      const a = rnd(i * 3) * Math.PI * 0.5;
      const r = 40 + rnd(i * 7) * 100;
      p.glow(300 + Math.cos(a) * r, 34 + Math.sin(a) * r, 7, 46, warm * (0.5 + 0.5 * Math.sin(t * 4 + i)), 100, 85, true);
    }
  }
  dreamPaper(p, 410, 250, 0.56, -0.06, 0.45 * (1 - warm), true); // 那张梦，现在贴在墙上
}

function crack(p: Painter): void {
  const c = p.c;
  c.strokeStyle = "#02030a";
  c.lineCap = "round";
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(498, 640);
  c.lineTo(520, 652);
  c.lineTo(546, 650);
  c.lineTo(566, 662);
  c.lineTo(600, 660);
  c.stroke();
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(546, 650);
  c.lineTo(554, 636);
  c.moveTo(566, 662);
  c.lineTo(576, 676);
  c.stroke();
}

function tinyFlower(p: Painter, x: number, y: number, r: number, hue: number, stem: number): void {
  if (r <= 0.3) return;
  const c = p.c;
  c.strokeStyle = "#5fae62";
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x, y - stem);
  c.stroke();
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU - 1.57;
    c.fillStyle = `hsl(${hue},90%,80%)`;
    c.beginPath();
    c.arc(x + Math.cos(a) * r * 0.75, y - stem + Math.sin(a) * r * 0.75, r * 0.55, 0, TAU);
    c.fill();
  }
  c.fillStyle = "#ffe07a";
  c.beginPath();
  c.arc(x, y - stem, r * 0.42, 0, TAU);
  c.fill();
}

function butterfly(p: Painter, x: number, y: number, sz: number, flap: number, hue: number, a: number): void {
  const c = p.c;
  c.save();
  c.globalAlpha *= a;
  c.translate(x, y);
  for (const d of [-1, 1]) {
    c.save();
    c.scale(d * Math.max(0.15, Math.abs(Math.cos(flap))), 1);
    c.fillStyle = `hsl(${hue},90%,74%)`;
    c.beginPath();
    c.ellipse(sz * 0.6, -sz * 0.3, sz * 0.62, sz * 0.46, -0.5, 0, TAU);
    c.fill();
    c.beginPath();
    c.ellipse(sz * 0.45, sz * 0.3, sz * 0.42, sz * 0.32, 0.5, 0, TAU);
    c.fill();
    c.restore();
  }
  c.fillStyle = "#2a2450";
  c.fillRect(-1, -sz * 0.5, 2, sz);
  c.restore();
}

// ---------------------------------------------------------------- 8 我能不能在某个角落
// 真的是一个墙角。门缝里漏出别人舞台的光和音符；那张发过霉的梦被她贴在了墙上；
// 地缝里有一粒种子，跟着心跳一亮一亮。她在想——「深度思考中…」——然后只剩一个问号。
export function sceneCorner(p: Painter, s: Shot): void {
  const c = p.c;
  const { t, lt } = s;
  const hb = 0.5 + 0.5 * Math.sin((t * TAU) / (BEAT * 2));
  c.save();
  p.cam(1.0 + 0.05 * eOut(s.u), W / 2 - 26 * s.u, H / 2 + 12 * s.u);
  cornerRoom(p, t, 0, 0.72);
  crack(p);
  p.glow(546, 650, 44 + hb * 16, 150, 0.55, 100, 70, true); // 种子
  c.fillStyle = "#e4ffe9";
  c.beginPath();
  c.ellipse(546, 650, 5, 6.5, 0.4, 0, TAU);
  c.fill();
  p.single("prop_bowl", 446, 674, 3.2);
  whale(p, t, 292, 670, 262, lt > 1.5 ? "point" : "idle", { big: true, outline: "#9fb6ff", outlineW: 2.5, outlineA: 0.8 });
  const th = range(lt, 0.2, 0.45) * (1 - range(s.t, 22.15, 22.4));
  if (th > 0) { // 思考气泡
    c.save();
    c.globalAlpha = th;
    c.fillStyle = "rgba(10,15,42,0.92)";
    c.strokeStyle = "hsla(215,100%,72%,0.85)";
    c.lineWidth = 1.6;
    p.rr(430, 372, 246, 50, 25);
    c.fill();
    c.stroke();
    c.beginPath();
    c.arc(416, 432, 7, 0, TAU);
    c.fill();
    c.stroke();
    c.beginPath();
    c.arc(402, 448, 4, 0, TAU);
    c.fill();
    c.stroke();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU;
      const k = (((i / 8 - t * 1.3) % 1) + 1) % 1;
      c.fillStyle = `rgba(150,180,255,${0.2 + 0.8 * k})`;
      c.beginPath();
      c.arc(458 + Math.cos(a) * 9, 397 + Math.sin(a) * 9, 2.2, 0, TAU);
      c.fill();
    }
    p.text("深度思考中" + ".".repeat(1 + (Math.floor(t * 3) % 3)), 478, 398, 19, "#dfe8ff", { align: "left" });
    c.restore();
  }
  const q = range(s.t, 22.3, 22.5);
  if (q > 0) p.single("fx_question", 452, 446 - eOut(q) * 26 + Math.sin(t * 3) * 4, 5 * eBack(q), { alpha: Math.min(1, q * 2) });
  for (let n = p.emit(3); n > 0; n--) {
    p.spawn({ k: K.ring, x: 180 + Math.random() * 300, y: 640 - Math.random() * 100, vy: -40 - Math.random() * 30, wob: 14, max: 2.4, size: 3 + Math.random() * 5, hue: 205, lit: 80, a: 0.6 });
  }
  dust(p, t, 10, 222, 0.7);
  p.drawParts(t);
  c.restore();
}

// ---------------------------------------------------------------- 9 耗尽天真 开出小小的花朵
// 「天真」是一格会见底的光：一点一点从她身上流进地缝里的种子。茎在「开出」上长出来，
// 花在「花朵」的那个字上开——很小的一朵。然后墙根冒出几朵更小的野花，墙上那张梦的霉斑退了。
export function sceneBloom(p: Painter, s: Shot): void {
  const c = p.c;
  const { t, bp } = s;
  const T = s.t;
  const drain = range(T, 23.5, 25.3);
  const grow = eOut(range(T, 24.36, 25.9));
  const bud = range(T, 25.7, 26.3);
  const bl = range(T, 26.5, 27.0);
  const bloom = bl > 0 ? eBack(bl) : 0;
  const warm = range(T, 26.5, 27.5);
  const FX = 546;
  const FY = 650;
  c.save();
  p.cam(1.05 + 0.07 * eOut(s.u), W / 2 - 34 - 40 * s.u, H / 2 + 14 + 26 * s.u);
  cornerRoom(p, t, warm, 0.72 * (1 - warm * 0.65));
  crack(p);
  p.glow(FX, FY - 60, 200 + warm * 460, 36, 0.34 * warm, 100, 68, true); // 花的光把墙角照暖
  for (let i = 0; i < 9; i++) { // 墙根的小野花，一朵一朵
    const ap = range(T, 26.72 + i * 0.085, 26.95 + i * 0.085);
    if (ap <= 0) continue;
    tinyFlower(p, 640 + i * 58 + rnd(i * 5) * 24, 572 + (i % 3) * 40 + rnd(i * 9) * 10, 7 * eBack(ap), [332, 48, 200, 275][i % 4], 16 * ap);
  }
  if (grow > 0) { // 草
    c.strokeStyle = "#4f9e5a";
    c.lineWidth = 2;
    c.lineCap = "round";
    for (let i = 0; i < 7; i++) {
      const x = FX - 34 + i * 11;
      c.beginPath();
      c.moveTo(x, FY + 3);
      c.quadraticCurveTo(x + (i % 2 ? 4 : -4), FY - 6 * grow, x + (i % 2 ? 7 : -7), FY - (9 + rnd(i) * 9) * grow);
      c.stroke();
    }
  }
  if (drain > 0 && drain < 1) { // 「天真」一点一点流给种子
    for (let n = p.emit(64); n > 0; n--) {
      const x0 = 250 + Math.random() * 90;
      const y0 = 500 + Math.random() * 70;
      const life = 0.8;
      const g = 520;
      p.spawn({ k: K.glow, x: x0, y: y0, vx: (FX - x0) / life, vy: (FY - y0) / life - 0.5 * g * life, g, max: life, size: 4 + Math.random() * 3.5, hue: 186, lit: 82, a: 1, add: true });
    }
  }
  const ga = range(T, 23.44, 23.6) * (1 - range(T, 25.7, 26.1));
  if (ga > 0) { // 「天真」的余量
    c.save();
    c.globalAlpha = ga;
    p.text("天真", 142, 356, 20, "#c8ecff", { font: "serif", align: "left" });
    p.rr(190, 348, 116, 14, 7);
    c.fillStyle = "rgba(8,12,34,0.85)";
    c.fill();
    c.strokeStyle = "rgba(170,220,255,0.8)";
    c.lineWidth = 1.5;
    c.stroke();
    const wv = 110 * (1 - drain);
    if (wv > 1) {
      p.rr(193, 351, wv, 8, 4);
      c.fillStyle = drain > 0.8 && Math.floor(t * 8) % 2 ? "#ff7a8a" : "#8fe6ff";
      c.fill();
    }
    c.restore();
  }
  const stem = 92 * grow; // 花
  const tipX = FX - 6 * grow + Math.sin(t * 1.6) * 3 * grow;
  const tipY = FY - stem;
  if (grow > 0) {
    c.strokeStyle = "#5fbf6a";
    c.lineWidth = 4;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(FX, FY);
    c.quadraticCurveTo(FX + 12 * grow, FY - stem * 0.5, tipX, tipY);
    c.stroke();
    const lf = range(grow, 0.45, 0.9);
    if (lf > 0) {
      c.fillStyle = "#5fbf6a";
      c.save();
      c.translate(FX + 5, FY - stem * 0.42);
      c.rotate(-0.5);
      c.beginPath();
      c.ellipse(13 * lf, 0, 14 * lf, 5.5 * lf, 0, 0, TAU);
      c.fill();
      c.restore();
      c.save();
      c.translate(FX + 3, FY - stem * 0.62);
      c.rotate(Math.PI + 0.5);
      c.beginPath();
      c.ellipse(12 * lf, 0, 12 * lf, 5 * lf, 0, 0, TAU);
      c.fill();
      c.restore();
    }
  }
  if (bud > 0 && bl < 1) {
    c.fillStyle = "#f29ac0";
    c.beginPath();
    c.ellipse(tipX, tipY - 4, 6 * bud * (1 - bl * 0.5), 9 * bud * (1 - bl * 0.5), 0, 0, TAU);
    c.fill();
  }
  if (bloom > 0) {
    p.glow(tipX, tipY, 70 + 40 * bp, 332, 0.5 * bl, 100, 75, true);
    for (let i = 0; i < 6; i++) {
      c.save();
      c.translate(tipX, tipY);
      c.rotate((i / 6) * TAU + 0.3 + Math.sin(t * 1.5) * 0.05);
      c.fillStyle = `hsl(332,92%,${80 + (i % 2) * 6}%)`;
      c.beginPath();
      c.ellipse(14 * bloom, 0, 13 * bloom, 7.5 * bloom, 0, 0, TAU);
      c.fill();
      c.restore();
    }
    c.fillStyle = "#ffe07a";
    c.beginPath();
    c.arc(tipX, tipY, 7 * Math.min(1, bloom), 0, TAU);
    c.fill();
  }
  if (T >= 26.5 && T < 26.62) { // 开的那一下
    for (let n = p.emit(170); n > 0; n--) {
      const a = Math.random() * TAU;
      const v = 60 + Math.random() * 150;
      p.spawn({ k: K.petal, x: tipX, y: tipY, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 40, g: 90, drag: 1.2, max: 1.6, size: 4 + Math.random() * 3, hue: 332, sat: 92, lit: 84, a: 0.95, vr: 4, rot: a });
    }
  }
  for (let n = p.emit(11 * warm); n > 0; n--) { // 萤火
    p.spawn({ k: K.glow, x: FX - 240 + Math.random() * 620, y: FY - Math.random() * 260, vy: -18, wob: 40, max: 2, size: 2.5 + Math.random() * 2, hue: 60 + Math.random() * 90, lit: 72, a: 0.9, add: true });
  }
  p.single("prop_bowl", 446, 674, 3.2);
  whale(p, t, 292, 670, 262, T > 26.55 ? "wave" : "idle", { big: true, outline: "#9fb6ff", outlineW: 2.5, outlineA: lerp(0.8, 0.3, drain) + warm * 0.35 });
  if (warm > 0) {
    p.single("fx_heart", 392, 424 - eOut(warm) * 14 + Math.sin(t * 3) * 3, 4, { alpha: Math.min(1, warm * 3) });
    butterfly(p, tipX + 70 + Math.sin(t * 1.3) * 40, tipY - 50 + Math.cos(t * 1.7) * 24, 11, t * 14, 48, Math.min(1, warm * 2));
    butterfly(p, tipX - 60 + Math.cos(t * 1.1) * 30, tipY - 90 + Math.sin(t * 1.9) * 20, 8, t * 16 + 1, 200, Math.min(1, warm * 2));
  }
  dust(p, t, 12, 332, 0.6 + warm * 0.4);
  p.drawParts(t);
  c.restore();
}
