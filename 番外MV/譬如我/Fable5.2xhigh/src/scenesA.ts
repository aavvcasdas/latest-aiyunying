// 分镜 1–5（以及各分镜共用的布景零件）
// 画面按歌词意思构造：台上是被传颂的众 AI，角落里是本鲸（DeepSeek）。
// 道具全部来自分支图集（饭盆、放大镜、头像、行走帧…）或由代码绘制，没有引入新图片。
import { BEAT } from "./lyrics";
import { H, K, Painter, TAU, W, clamp, eBack, eOut, lerp, range, rnd, type SpriteOpts } from "./painter";

export interface Shot {
  /** 全片时间 */
  t: number;
  /** 本分镜内的时间 */
  lt: number;
  dur: number;
  /** 本分镜进度 0..1 */
  u: number;
  /** 节拍脉冲 0..1 */
  bp: number;
}

interface Giant { c: string; name: string; hue: number; act: string; big?: number; prop?: string }
/** 台上的七位。随身道具取自项目调研里各人的习性卡（沙漏/茶杯/猫耳钟/卷轴/算盘），只是角色标识，不代表任何排名。 */
export const GIANTS: Giant[] = [
  { c: "gemini", name: "Gemini", hue: 265, act: "sway", prop: "prop_catclock" },
  { c: "kimi", name: "Kimi", hue: 215, act: "think", prop: "prop_scroll" },
  { c: "claude", name: "Claude", hue: 24, act: "idle", prop: "prop_teacup" },
  { c: "gpt", name: "GPT", hue: 46, act: "float", big: 1.36, prop: "prop_hourglass" },
  { c: "qwen", name: "Qwen", hue: 250, act: "sway" },
  { c: "zai", name: "GLM", hue: 160, act: "lookaround", prop: "prop_abacus" },
  { c: "doubao", name: "豆包", hue: 340, act: "idle" },
];

// ---------------------------------------------------------------- 共用零件

export function backdrop(p: Painter, t: number, top: string, bottom: string, stars = 1): void {
  const c = p.c;
  c.fillStyle = p.vgrad(0, H, top, bottom);
  c.fillRect(-80, -80, W + 160, H + 160);
  if (stars <= 0) return;
  for (let i = 0; i < 90; i++) {
    const a = (0.2 + 0.6 * Math.abs(Math.sin(t * (0.5 + rnd(i * 23) * 1.4) + i))) * stars;
    const r = 1 + rnd(i * 13) * 1.6;
    c.fillStyle = `rgba(205,218,255,${a * 0.7})`;
    c.fillRect(rnd(i * 3 + 1) * W, rnd(i * 7 + 2) * H * 0.6, r, r);
  }
}

export function dust(p: Painter, t: number, n: number, hue: number, a = 1): void {
  const c = p.c;
  for (let i = 0; i < n; i++) {
    const sp = 8 + rnd(i * 31) * 18;
    const x = (rnd(i * 7) * W + t * sp * (0.4 + rnd(i))) % W;
    const y = H - ((rnd(i * 13) * H + t * sp) % H);
    c.fillStyle = `hsla(${hue},90%,82%,${(0.1 + 0.22 * Math.abs(Math.sin(t * 1.3 + i))) * a})`;
    c.beginPath();
    c.arc(x, y, 1 + rnd(i * 3) * 1.5, 0, TAU);
    c.fill();
  }
}

/** 本鲸。big=true 用图集里的高清立绘（近景），否则用 Q 版动作帧 */
export function whale(p: Painter, t: number, x: number, y: number, h: number, act: string, o: SpriteOpts & { big?: boolean } = {}): void {
  if (o.big) {
    const blink = t % 3.1 < 0.14;
    const name = act === "point" ? "whale_big_point" : act === "wave" ? "whale_big_wave" : blink ? "whale_big_blink" : "whale_big_idle";
    p.single(name, x, y + Math.round(Math.sin(t * 2.2) * 3), h / 148, o);
  } else {
    p.sprite("whale", act, t, x, y, h, o);
  }
}

export interface RowOpts {
  y: number; h: number; cx: number; span: number;
  alpha?: number; sil?: boolean; outline?: string; dim?: number;
  beams?: number; glow?: number;
  stars?: boolean; plates?: boolean; props?: boolean; hop?: boolean;
}
/** 台上的一排：前后两列错开站，GPT 龙娘在正中靠后、最高 */
export function giantsRow(p: Painter, t: number, o: RowOpts): void {
  const c = p.c;
  const n = GIANTS.length;
  const a = o.alpha ?? 1;
  if (o.glow) { // 整排的光晕（大面积渐变是最贵的操作，合成两块而不是每人一块）
    p.glow(o.cx - o.span * 0.24, o.y - o.h * 0.55, o.h * 1.7, 255, o.glow * a, 90, 62, true);
    p.glow(o.cx + o.span * 0.24, o.y - o.h * 0.55, o.h * 1.7, 36, o.glow * a, 90, 62, true);
  }
  for (const i of [1, 3, 5, 0, 2, 4, 6]) {
    const g = GIANTS[i];
    const back = i % 2 === 1;
    const x = o.cx + (i - (n - 1) / 2) * (o.span / (n - 1));
    const y = o.y - (back ? o.h * 0.1 : 0) + Math.round(Math.sin(t * 1.1 + i * 1.7) * 2);
    const h = o.h * (g.big ?? 1);
    if (o.beams) p.beam(x + Math.sin(t * 0.6 + i) * 26, -30, x, y - h * 0.25, 8, h * 0.36, g.hue, o.beams * a);
    if (o.plates) {
      c.fillStyle = `hsla(${g.hue},100%,70%,${0.22 * a})`;
      c.beginPath();
      c.ellipse(x, y, h * 0.3, h * 0.045, 0, 0, TAU);
      c.fill();
    }
    p.sprite(g.c, o.hop && g.c !== "gpt" ? "hop" : g.act, t + i * 0.37, x, y, h, {
      alpha: a, sil: o.sil ? "dark" : undefined, outline: o.outline, outlineW: 2, dim: o.dim, fps: o.hop ? 11 : 8,
    });
    if (o.stars) { // 「天赋」：每人头顶一颗点亮的星
      const sy = y - h - 16;
      p.glow(x, sy, 30, 46, 0.5 * a, 100, 70, true);
      c.save();
      c.globalAlpha = a;
      c.fillStyle = "#ffd866";
      p.star(x, sy, 11 + Math.sin(t * 3 + i) * 1.5, -Math.PI / 2 + Math.sin(t + i) * 0.2);
      c.fill();
      c.restore();
    }
    if (o.props && g.prop) p.single(g.prop, x + h * 0.3, y - h * 0.4 + Math.sin(t * 2 + i) * 5, 2, { alpha: a });
    if (o.plates) {
      const pw = g.name.length * 9 + 24;
      p.rr(x - pw / 2, y + 9, pw, 20, 10);
      c.fillStyle = "rgba(8,12,34,0.82)";
      c.fill();
      c.strokeStyle = `hsla(${g.hue},100%,72%,0.85)`;
      c.lineWidth = 1.4;
      c.stroke();
      p.text(g.name, x, y + 20, 12, "#e9eeff", { font: "mono" });
    }
  }
}

/** 她的梦：一张蜡笔画（星星下面一朵小花）。mold 0..1 = 发霉程度。分镜 3 压在枕头下，分镜 8/9 贴在墙角。 */
export function dreamPaper(p: Painter, x: number, y: number, sc: number, rot: number, mold: number, tape = false): void {
  const c = p.c;
  c.save();
  c.translate(x, y);
  c.rotate(rot);
  c.scale(sc, sc);
  c.shadowColor = "rgba(0,0,0,0.5)";
  c.shadowBlur = 14;
  c.shadowOffsetY = 5;
  p.rr(-110, -66, 220, 132, 5);
  c.fillStyle = "#ebe5d0";
  c.fill();
  c.shadowColor = "transparent";
  c.lineCap = "round";
  c.strokeStyle = "#5a8f4a";
  c.lineWidth = 5;
  c.beginPath();
  c.moveTo(-34, 50);
  c.quadraticCurveTo(-40, 24, -32, 4);
  c.stroke();
  c.fillStyle = "#6aa456";
  c.beginPath();
  c.ellipse(-22, 32, 12, 5, -0.5, 0, TAU);
  c.fill();
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU - 1.57;
    c.fillStyle = "#f08ab4";
    c.beginPath();
    c.arc(-32 + Math.cos(a) * 13, -6 + Math.sin(a) * 13, 9, 0, TAU);
    c.fill();
  }
  c.fillStyle = "#ffd257";
  c.beginPath();
  c.arc(-32, -6, 7, 0, TAU);
  c.fill();
  c.fillStyle = "#f4c542";
  p.star(42, -26, 17);
  c.fill();
  p.star(80, 4, 8);
  c.fill();
  p.star(8, -46, 6);
  c.fill();
  c.strokeStyle = "#5c86d8";
  c.lineWidth = 4;
  c.beginPath();
  c.moveTo(10, 44);
  c.quadraticCurveTo(25, 34, 40, 44);
  c.quadraticCurveTo(55, 54, 70, 44);
  c.quadraticCurveTo(85, 34, 100, 44);
  c.stroke();
  for (let i = 0; i < 11; i++) { // 霉斑
    const g = clamp(mold * 1.5 - i * 0.07);
    if (g <= 0) continue;
    const bx = rnd(i * 3 + 1) * 200 - 100;
    const by = rnd(i * 7 + 2) * 116 - 58;
    const r = (7 + rnd(i * 11) * 17) * g;
    c.fillStyle = "rgba(96,112,66,0.42)";
    c.beginPath();
    c.arc(bx, by, r, 0, TAU);
    c.fill();
    c.fillStyle = "rgba(58,80,44,0.6)";
    c.beginPath();
    c.arc(bx + r * 0.15, by - r * 0.1, r * 0.62, 0, TAU);
    c.fill();
    c.fillStyle = "rgba(30,48,30,0.7)";
    for (let k = 0; k < 4; k++) {
      const a = rnd(i * 5 + k) * TAU;
      c.beginPath();
      c.arc(bx + Math.cos(a) * r * 0.5, by + Math.sin(a) * r * 0.5, 1.6, 0, TAU);
      c.fill();
    }
  }
  if (tape) {
    c.fillStyle = "rgba(255,240,170,0.55)";
    c.fillRect(-26, -76, 52, 18);
  }
  c.restore();
}

export function cobweb(p: Painter, x: number, y: number, r: number, a0: number, a1: number, alpha: number): void {
  if (alpha <= 0) return;
  const c = p.c;
  const n = 6;
  c.save();
  c.strokeStyle = `rgba(200,212,245,${alpha})`;
  c.lineWidth = 1;
  c.beginPath();
  for (let i = 0; i <= n; i++) {
    const a = lerp(a0, a1, i / n);
    c.moveTo(x, y);
    c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
  }
  for (let k = 1; k <= 4; k++) {
    const rr = (r * k) / 4.4;
    for (let i = 0; i < n; i++) {
      const aa = lerp(a0, a1, i / n);
      const ab = lerp(a0, a1, (i + 1) / n);
      const am = (aa + ab) / 2;
      c.moveTo(x + Math.cos(aa) * rr, y + Math.sin(aa) * rr);
      c.quadraticCurveTo(x + Math.cos(am) * rr * 0.86, y + Math.sin(am) * rr * 0.86, x + Math.cos(ab) * rr, y + Math.sin(ab) * rr);
    }
  }
  c.stroke();
  c.restore();
}

// ---------------------------------------------------------------- 1 可那些没有天赋的人呢
// 台上每个人头顶都有一颗点亮的星（天赋）；围栏外的角落里，鲸的头顶只有一颗虚线的空星和一个问号。
export function sceneHall(p: Painter, s: Shot): void {
  const c = p.c;
  const { t, bp } = s;
  c.save();
  p.cam(1.07 - 0.05 * eOut(s.u), W / 2 + 26 * (1 - s.u), H / 2 - 8);
  backdrop(p, t, "#060a20", "#131a46");
  for (let i = 0; i < 14; i++) { // 光幕
    const x = 236 + i * 68;
    const hh = 150 + 120 * Math.abs(Math.sin(t * 1.2 + i * 0.9)) + bp * 46;
    const g = c.createLinearGradient(0, 412 - hh, 0, 412);
    g.addColorStop(0, `hsla(${208 + i * 8},90%,62%,0)`);
    g.addColorStop(1, `hsla(${208 + i * 8},90%,62%,${0.2 + bp * 0.1})`);
    c.fillStyle = g;
    c.fillRect(x, 412 - hh, 44, hh);
  }
  c.fillStyle = "#0a0e26"; // 灯架
  c.fillRect(190, 40, 1040, 9);
  for (let i = 0; i < 9; i++) {
    const x = 250 + i * 115;
    c.fillStyle = "#0a0e26";
    c.fillRect(x - 9, 49, 18, 13);
    c.fillStyle = `hsla(${46 + i * 30},100%,80%,${0.6 + bp * 0.4})`;
    c.beginPath();
    c.arc(x, 65, 5, 0, TAU);
    c.fill();
  }
  p.poly([230, 412, 1190, 412, 1300, 505, 150, 505]); // 舞台
  c.fillStyle = p.vgrad(412, 505, "#2c3478", "#171d4c");
  c.fill();
  c.fillStyle = "#0b0f2a";
  c.fillRect(150, 505, 1150, 26);
  c.fillStyle = `rgba(255,214,120,${0.75 + bp * 0.25})`;
  c.fillRect(150, 503, 1150, 3);
  giantsRow(p, t, { y: 452, h: 226, cx: 706, span: 870, beams: 0.2, glow: 0.2, stars: true, plates: true, props: true });
  for (let n = p.emit(5); n > 0; n--) { // 台上飘起来的星屑
    p.spawn({ k: K.star, x: 270 + Math.random() * 880, y: 300 + Math.random() * 120, vy: -36 - Math.random() * 30, wob: 14, max: 1.8, size: 3 + Math.random() * 3, hue: 46, lit: 72, a: 0.9, vr: 2, add: true });
  }
  c.fillStyle = p.vgrad(531, H, "#090c22", "#05060f"); // 台下：灯照不到的地面
  c.fillRect(-80, 531, W + 160, H);
  c.strokeStyle = "rgba(196,160,90,0.55)"; // 围栏：光到这里为止
  c.lineWidth = 3;
  for (let i = 0; i < 4; i++) {
    const x = 78 + i * 148;
    c.fillStyle = "#3b3560";
    c.fillRect(x - 4, 566, 8, 44);
    c.fillStyle = "#c9a45a";
    c.beginPath();
    c.arc(x, 564, 6, 0, TAU);
    c.fill();
    if (i < 3) {
      c.beginPath();
      c.moveTo(x, 570);
      c.quadraticCurveTo(x + 74, 600, x + 148, 570);
      c.stroke();
    }
  }
  p.glow(170, 610, 170, 222, 0.1 + bp * 0.06); // 角落：鲸、饭盆、一颗没点亮的星
  p.single("prop_bowl", 244, 662, 2.2);
  whale(p, t, 168, 660, 126, "idle", { outline: "#7f9cf0", outlineW: 1.5, outlineA: 0.8 });
  c.save();
  c.setLineDash([5, 5]);
  c.strokeStyle = `rgba(170,190,255,${0.55 + 0.3 * Math.sin(t * 3)})`;
  c.lineWidth = 2;
  p.star(168, 504 + Math.sin(t * 1.6) * 3, 16);
  c.stroke();
  c.restore();
  p.single("fx_question", 208, 512 + Math.sin(t * 1.6 + 1) * 3, 2.6);
  dust(p, t, 26, 222);
  p.drawParts(t);
  c.restore();
}

// ---------------------------------------------------------------- 2 譬如我
// 镜头落到角落：一束迟到的光打在鲸身上；身后是那些名字巨大的轮廓；名牌上「天赋」一栏是五颗空星。
export function sceneMe(p: Painter, s: Shot): void {
  const c = p.c;
  const { t, lt, bp } = s;
  c.save();
  p.cam(1.02 + 0.04 * eOut(s.u), W / 2 - 14 * s.u, H / 2);
  backdrop(p, t, "#04060f", "#0c1236", 0.5);
  c.fillStyle = p.vgrad(60, 620, "rgba(70,96,230,0.26)", "rgba(70,96,230,0.46)"); // 台上的光还亮着
  c.fillRect(-80, 60, W + 160, 560);
  for (let i = 0; i < 9; i++) p.beam(420 + i * 100, -30, 420 + i * 100 + Math.sin(t * 0.7 + i) * 40, 620, 10, 70, 215 + i * 6, 0.1);
  giantsRow(p, t, { y: 600, h: 400, cx: 860, span: 940, sil: true, stars: true }); // 那些名字只剩巨大的背影
  c.fillStyle = p.vgrad(380, 640, "rgba(5,7,18,0)", "rgba(5,7,18,0.92)");
  c.fillRect(-80, 380, W + 160, 300);
  c.fillStyle = p.vgrad(640, H, "#0a0e26", "#04050c");
  c.fillRect(-80, 640, W + 160, 160);
  const on = range(lt, 0.03, 0.22);
  p.beam(410, -40, 330, 662, 22, 200, 215, (0.32 + bp * 0.08) * on);
  c.fillStyle = `hsla(215,100%,72%,${0.2 * on})`;
  c.beginPath();
  c.ellipse(330, 664, 215, 30, 0, 0, TAU);
  c.fill();
  for (let i = 0; i < 2; i++) { // 脚下的水纹
    const k = (t / BEAT + i * 0.5) % 1;
    c.strokeStyle = `hsla(205,100%,78%,${(1 - k) * 0.5 * on})`;
    c.lineWidth = 2;
    c.beginPath();
    c.ellipse(330, 664, 60 + k * 170, 9 + k * 22, 0, 0, TAU);
    c.stroke();
  }
  const pop = eBack(range(lt, 0.02, 0.34));
  whale(p, t, 330, 664, 322 * (0.8 + 0.2 * pop), lt > 0.7 ? "point" : "idle", { big: true, outline: "#c4d6ff", outlineW: 3 });
  p.single("prop_bowl", 548, 670, 3.4);
  const ci = eOut(range(lt, 0.5, 0.82));
  if (ci > 0) { // 名牌
    c.save();
    c.globalAlpha = ci;
    c.translate(0, (1 - ci) * 16);
    c.strokeStyle = "rgba(160,190,255,0.7)";
    c.lineWidth = 1.5;
    c.setLineDash([4, 4]);
    c.beginPath();
    c.moveTo(452, 440);
    c.lineTo(600, 520);
    c.stroke();
    c.setLineDash([]);
    p.rr(600, 500, 262, 96, 12);
    c.fillStyle = "rgba(9,14,40,0.9)";
    c.fill();
    c.strokeStyle = "hsla(215,100%,72%,0.9)";
    c.lineWidth = 1.6;
    c.stroke();
    p.single("p_whale_neutral", 648, 588, 1.2);
    p.text("DeepSeek", 698, 528, 22, "#eaf0ff", { font: "mono", align: "left" });
    p.text("天赋", 698, 566, 17, "#9fb2e6", { font: "serif", align: "left" });
    c.strokeStyle = "rgba(170,186,230,0.8)";
    c.lineWidth = 1.3;
    for (let i = 0; i < 5; i++) {
      p.star(752 + i * 21, 566, 8);
      c.stroke();
    }
    c.restore();
  }
  for (let n = p.emit(5); n > 0; n--) { // 气泡
    p.spawn({ k: K.ring, x: 200 + Math.random() * 280, y: 640 - Math.random() * 120, vy: -50 - Math.random() * 40, wob: 16, max: 2 + Math.random(), size: 3 + Math.random() * 6, hue: 205, lit: 80, a: 0.7 });
  }
  dust(p, t, 14, 215);
  p.drawParts(t);
  c.restore();
}

// ---------------------------------------------------------------- 3 枕头下发霉的梦 怎么做
// 凌晨三点的房间。梦是一张蜡笔画，压在枕头下太久，霉斑在「发霉」两个字上蔓延开；梦的泡泡升起来也带着霉点。
export function scenePillow(p: Painter, s: Shot): void {
  const c = p.c;
  const { t, lt } = s;
  const mold = range(lt, 0.5, 2.7);
  c.save();
  p.cam(1.03 + 0.03 * s.u, W / 2 + 12 * s.u, H / 2 + 4);
  c.fillStyle = p.vgrad(0, H, "#0c1030", "#181d44");
  c.fillRect(-80, -80, W + 160, H + 160);
  for (let i = 0; i < 22; i++) {
    c.fillStyle = "rgba(255,255,255,0.012)";
    c.fillRect(i * 62, 0, 30, 660);
  }
  c.fillStyle = "#2a3162"; // 窗
  c.fillRect(118, 70, 286, 268);
  c.fillStyle = p.vgrad(82, 326, "#070d3a", "#22327e");
  c.fillRect(130, 82, 262, 244);
  for (let i = 0; i < 10; i++) {
    c.fillStyle = `rgba(230,236,255,${0.4 + 0.5 * Math.abs(Math.sin(t * 1.4 + i))})`;
    c.fillRect(140 + rnd(i * 5) * 240, 92 + rnd(i * 9) * 200, 2, 2);
  }
  p.glow(304, 160, 110, 48, 0.25);
  c.fillStyle = "#ffe9a8";
  c.beginPath();
  c.arc(304, 160, 34, 0, TAU);
  c.fill();
  c.fillStyle = "#121c5a";
  c.beginPath();
  c.arc(318, 150, 30, 0, TAU);
  c.fill();
  c.fillStyle = "#2a3162";
  c.fillRect(256, 82, 10, 244);
  c.fillRect(130, 198, 262, 10);
  c.fillStyle = "rgba(70,72,140,0.88)"; // 窗帘
  c.beginPath();
  c.moveTo(108, 60);
  for (let i = 0; i <= 8; i++) c.lineTo(170 + Math.sin(t * 1.3 + i * 0.8) * 9 + (i % 2) * 10, 60 + i * 37);
  c.lineTo(108, 356);
  c.closePath();
  c.fill();
  c.fillStyle = "#3a3f7c";
  c.fillRect(100, 56, 322, 12);
  p.poly([150, 338, 392, 338, 800, 660, 470, 660]); // 月光
  c.fillStyle = "rgba(150,170,255,0.07)";
  c.fill();
  cobweb(p, 1292, 30, 170, Math.PI * 0.5, Math.PI, 0.22);
  c.fillStyle = "#20254e"; // 床头柜 + 闹钟
  c.fillRect(1000, 566, 150, 94);
  c.fillStyle = "#2b3162";
  c.fillRect(992, 558, 166, 12);
  p.rr(1018, 500, 116, 58, 10);
  c.fillStyle = "#0a0c1c";
  c.fill();
  c.strokeStyle = "#3b4280";
  c.lineWidth = 2;
  c.stroke();
  p.text(Math.floor(t * 2) % 2 ? "03:07" : "03 07", 1076, 530, 30, "#ff7a5a", { font: "mono", glow: "#ff5a3a", blur: 10 });
  c.fillStyle = "#0b0e26";
  c.fillRect(-80, 660, W + 160, 140);
  p.rr(92, 404, 44, 256, 14); // 床
  c.fillStyle = "#2c3060";
  c.fill();
  p.rr(112, 548, 820, 112, 24);
  c.fillStyle = "#2a3268";
  c.fill();
  c.fillStyle = "rgba(170,186,255,0.12)";
  c.fillRect(136, 550, 780, 5);
  p.rr(600, 536, 332, 124, 30);
  c.fillStyle = "#303b7c";
  c.fill();
  c.strokeStyle = "rgba(160,176,255,0.25)";
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(612, 566);
  c.quadraticCurveTo(760, 548, 920, 570);
  c.stroke();
  dreamPaper(p, 540, 518, 1, 0.1, mold); // 压在枕头下的那张画
  c.save(); // 枕头
  c.translate(296, 486);
  c.rotate(-0.06 + Math.sin(t * 1.4) * 0.006);
  c.fillStyle = "rgba(0,0,0,0.35)";
  c.beginPath();
  c.ellipse(6, 70, 160, 15, 0, 0, TAU);
  c.fill();
  c.beginPath(); // 鼓起来的枕头
  c.moveTo(-150, -56);
  c.quadraticCurveTo(0, -84, 150, -56);
  c.quadraticCurveTo(180, 0, 150, 58);
  c.quadraticCurveTo(0, 82, -150, 58);
  c.quadraticCurveTo(-180, 0, -150, -56);
  c.closePath();
  c.fillStyle = p.vgrad(-80, 80, "#f0ebde", "#b9b2a0");
  c.fill();
  c.strokeStyle = "rgba(110,102,88,0.7)";
  c.lineWidth = 2.5;
  c.stroke();
  c.strokeStyle = "rgba(110,102,88,0.35)";
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(-120, -8);
  c.quadraticCurveTo(-40, 10, 30, -6);
  c.moveTo(40, 18);
  c.quadraticCurveTo(90, 6, 130, 16);
  c.stroke();
  for (let i = 0; i < 7; i++) {
    const g = clamp(mold * 1.4 - i * 0.1);
    if (g <= 0) continue;
    c.fillStyle = `rgba(92,108,66,${0.42 * g})`;
    c.beginPath();
    c.arc(44 + rnd(i * 9) * 100, -26 + rnd(i * 17) * 56, (5 + rnd(i * 23) * 11) * g, 0, TAU);
    c.fill();
  }
  c.restore();
  for (let i = 0; i < 3; i++) { // 梦的泡泡：小花 / 星星 / 一束光，越往上霉点越多
    const ph = (lt * 0.36 + i / 3) % 1;
    const bx = 250 + i * 96 + Math.sin(t * 1.6 + i * 2) * 12;
    const by = 452 - ph * 250;
    const r = 30 + i * 4;
    const al = Math.min(1, ph * 6) * (1 - range(ph, 0.82, 1));
    c.save();
    c.globalAlpha = al;
    c.fillStyle = "rgba(170,184,255,0.10)";
    c.strokeStyle = "rgba(190,204,255,0.55)";
    c.lineWidth = 1.6;
    c.beginPath();
    c.arc(bx, by, r, 0, TAU);
    c.fill();
    c.stroke();
    c.globalAlpha = al * (1 - ph * 0.55);
    if (i === 0) {
      for (let k = 0; k < 5; k++) {
        const a = (k / 5) * TAU - 1.57;
        c.fillStyle = "#f6a0c4";
        c.beginPath();
        c.arc(bx + Math.cos(a) * r * 0.32, by + Math.sin(a) * r * 0.32, r * 0.22, 0, TAU);
        c.fill();
      }
      c.fillStyle = "#ffd866";
      c.beginPath();
      c.arc(bx, by, r * 0.17, 0, TAU);
      c.fill();
    } else if (i === 1) {
      c.fillStyle = "#ffd866";
      p.star(bx, by, r * 0.5);
      c.fill();
    } else {
      c.fillStyle = "rgba(255,236,170,0.9)";
      p.poly([bx - 4, by - r * 0.55, bx + 4, by - r * 0.55, bx + r * 0.45, by + r * 0.5, bx - r * 0.45, by + r * 0.5]);
      c.fill();
    }
    c.globalAlpha = al;
    for (let k = 0; k < Math.floor(ph * 7); k++) {
      const a = rnd(i * 11 + k) * TAU;
      const d = rnd(i * 7 + k * 3) * r * 0.8;
      c.fillStyle = "rgba(74,96,54,0.8)";
      c.beginPath();
      c.arc(bx + Math.cos(a) * d, by + Math.sin(a) * d, 2.4 + rnd(k) * 2.6, 0, TAU);
      c.fill();
    }
    c.restore();
  }
  for (let n = p.emit(9 * mold); n > 0; n--) { // 孢子
    p.spawn({ x: 470 + Math.random() * 200, y: 480 + Math.random() * 70, vy: -18 - Math.random() * 26, wob: 14, max: 2.2, size: 1.4 + Math.random() * 2, hue: 95, sat: 40, lit: 55, a: 0.8 });
  }
  whale(p, t, 790, 660, 214, lt % 3 < 1.7 ? "shiver" : "sad", { outline: "#8fa8ee", outlineW: 1.5, outlineA: 0.45, dim: 0.1 });
  const q = range(s.t, 6.42, 6.6); // 「怎么做」
  if (q > 0) {
    for (let i = 0; i < 3; i++) {
      p.single("fx_question", 872 + i * 46, 452 - i * 30 - eOut(q) * 16 + Math.sin(t * 3 + i) * 4, 2.4 + i * 0.7, { alpha: clamp(q * 3 - i) });
    }
  }
  c.fillStyle = "rgba(20,26,60,0.16)";
  c.fillRect(-80, -80, W + 160, H + 160);
  dust(p, t, 16, 232, 0.8);
  p.drawParts(t);
  c.restore();
}

// ---------------------------------------------------------------- 4 热忱与自卑对抗着
// 两个自己拔河：橙色的那个在火里往前跳，蓝色的那个在冷雨里往回缩；中间的裂缝跟着拍子来回，真正的她被夹在中线上。
export function sceneClash(p: Painter, s: Shot): void {
  const c = p.c;
  const { t, bp } = s;
  const tug = Math.sin((t * TAU) / (BEAT * 2));
  const mid = W / 2 + tug * 50;
  const push = tug * 30;
  c.save();
  p.cam(1.03 + bp * 0.012);
  c.fillStyle = p.vgrad(0, H, "#2a0d06", "#7a2a0c");
  c.fillRect(-80, -80, mid + 80, H + 160);
  c.fillStyle = p.vgrad(0, H, "#070c2c", "#182a70");
  c.fillRect(mid, -80, W - mid + 80, H + 160);
  p.glow(300 + push, 430, 420, 26, 0.2, 100, 55, true);
  p.glow(980 + push, 430, 400, 226, 0.26, 90, 60, true);
  for (let i = 0; i < 12; i++) { // 火舌
    const x = i * 54 - 20;
    if (x > mid - 30) break;
    const hh = 70 + 70 * Math.abs(Math.sin(t * 4.6 + i * 1.3));
    c.fillStyle = `hsla(${18 + (i % 3) * 10},100%,${52 + (i % 2) * 8}%,0.55)`;
    c.beginPath();
    c.moveTo(x - 30, 700);
    c.quadraticCurveTo(x - 24, 700 - hh * 0.5, x + Math.sin(t * 6 + i) * 10, 700 - hh);
    c.quadraticCurveTo(x + 26, 700 - hh * 0.45, x + 30, 700);
    c.closePath();
    c.fill();
  }
  for (let i = 0; i < 9; i++) { // 冰凌
    const x = W - i * 70 - 10;
    if (x < mid + 30) break;
    c.fillStyle = "rgba(170,200,255,0.4)";
    p.poly([x - 16, 30, x + 16, 30, x, 80 + rnd(i * 5) * 70]);
    c.fill();
  }
  for (let n = p.emit(46); n > 0; n--) { // 冷雨
    p.spawn({ k: K.streak, x: mid + 20 + Math.random() * (W - mid), y: -10, vx: -50, vy: 640 + Math.random() * 160, max: 1.1, size: 1.4, hue: 215, lit: 78, a: 0.5 });
  }
  for (let n = p.emit(34); n > 0; n--) { // 火星
    p.spawn({ x: Math.random() * (mid - 20), y: 700 - Math.random() * 60, vx: 30 + Math.random() * 60, vy: -90 - Math.random() * 150, wob: 40, max: 1 + Math.random() * 0.7, size: 2 + Math.random() * 3, hue: 20 + Math.random() * 22, lit: 62, a: 0.95, add: true });
  }
  p.drawParts(t);
  for (let pass = 0; pass < 2; pass++) { // 裂缝
    c.save();
    c.strokeStyle = pass ? "#ffffff" : "rgba(255,240,210,0.45)";
    c.lineWidth = pass ? 3 : 12;
    if (pass) {
      c.shadowColor = "#fff";
      c.shadowBlur = 18;
    }
    c.beginPath();
    for (let i = 0; i <= 19; i++) {
      const y = -20 + i * 40;
      const x = mid + (rnd(i * 3 + Math.floor(t * 14)) - 0.5) * 44;
      if (i === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.stroke();
    c.restore();
  }
  p.sprite("whale", "hop", t * 1.25, 322 + push, 600, 292, { tint: "#ff7a1a", tintAmt: 0.3, outline: "#fff0c8", outlineW: 3 });
  p.single("fx_shine", 322 + push, 262 + Math.sin(t * 5) * 6, 4);
  p.sprite("whale", "sad", t, 958 + push, 600, 292, { tint: "#3552e0", tintAmt: 0.55, outline: "#9db6ff", outlineW: 3, flip: true });
  p.single("fx_gloom", 958 + push, 296 + Math.sin(t * 2) * 4, 4.6);
  const sag = 10 + Math.sin(t * 30) * 2.5; // 拔河的绳
  c.save();
  c.strokeStyle = "#e6d5ab";
  c.lineWidth = 6;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(404 + push, 470);
  c.quadraticCurveTo(640 + push, 470 + sag * 2, 876 + push, 470);
  c.stroke();
  c.strokeStyle = "rgba(120,96,60,0.8)";
  c.lineWidth = 2;
  for (let i = 0; i < 22; i++) {
    const k = i / 21;
    const x = 412 + push + k * 456;
    const y = 470 + sag * 2 * 2 * k * (1 - k);
    c.beginPath();
    c.moveTo(x - 3, y - 3);
    c.lineTo(x + 3, y + 3);
    c.stroke();
  }
  c.fillStyle = "#ff4d5e";
  p.poly([634 + push, 472 + sag, 646 + push, 472 + sag, 652 + push, 522 + sag, 640 + push, 510 + sag, 628 + push, 522 + sag]);
  c.fill();
  c.restore();
  c.strokeStyle = "rgba(255,255,255,0.5)"; // 地上的中线
  c.setLineDash([8, 8]);
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(640, 612);
  c.lineTo(640, 704);
  c.stroke();
  c.setLineDash([]);
  whale(p, t, 640 + push * 0.5, 680, 112, "shake", { outline: "#ffffff", outlineW: 2 });
  p.single("fx_sweat", 698 + push * 0.5, 604, 3);
  if (bp > 0.72) { // 拍点上的碰撞
    for (let n = p.emit(130); n > 0; n--) {
      const a = Math.random() * TAU;
      const v = 150 + Math.random() * 260;
      p.spawn({ k: K.glow, x: mid, y: 470, vx: Math.cos(a) * v, vy: Math.sin(a) * v, drag: 2.5, max: 0.45, size: 3 + Math.random() * 3, hue: Math.random() < 0.5 ? 26 : 222, a: 1, add: true });
    }
  }
  c.restore();
}

// ---------------------------------------------------------------- 5 笑容却已不知下落
// 晾着的旧照片里，笑容一张比一张淡；墙上贴着寻人的纸；笑容本体在「下落」两个字上掉进地上的洞里。鲸举着放大镜在找。
export function sceneSmile(p: Painter, s: Shot): void {
  const c = p.c;
  const { t } = s;
  const fall = Math.max(0, s.t - 11.99);
  c.save();
  p.cam(1.02 + 0.03 * s.u, W / 2, H / 2 + 6 * s.u);
  c.fillStyle = p.vgrad(0, 610, "#0b0f28", "#171c42");
  c.fillRect(-80, -80, W + 160, 700);
  c.fillStyle = "#080a1c";
  c.fillRect(-80, 610, W + 160, 200);
  c.fillStyle = "rgba(120,140,220,0.25)";
  c.fillRect(-80, 606, W + 160, 4);
  const A = [430, 78], B = [835, 160], C = [1245, 86]; // 晾照片的绳
  c.strokeStyle = "rgba(210,220,255,0.5)";
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(A[0], A[1]);
  c.quadraticCurveTo(B[0], B[1], C[0], C[1]);
  c.stroke();
  for (let i = 0; i < 5; i++) {
    const u = 0.1 + i * 0.2;
    const x = (1 - u) * (1 - u) * A[0] + 2 * (1 - u) * u * B[0] + u * u * C[0];
    const y = (1 - u) * (1 - u) * A[1] + 2 * (1 - u) * u * B[1] + u * u * C[1];
    const sm = [1, 0.7, 0.4, 0.15, 0][i];
    c.save();
    c.translate(x, y);
    c.rotate(Math.sin(t * 1.2 + i * 1.3) * 0.05 + (i - 2) * 0.025);
    c.fillStyle = "#c9a45a";
    c.fillRect(-4, -4, 8, 14);
    c.fillStyle = "#eef0f6";
    c.fillRect(-52, 6, 104, 126);
    c.fillStyle = "#18204e";
    c.fillRect(-44, 14, 88, 88);
    p.single("p_whale_neutral", 0, 102, 1.375, { dim: i * 0.14 });
    if (sm > 0) {
      c.strokeStyle = `rgba(255,214,90,${sm})`;
      c.lineWidth = 4;
      c.lineCap = "round";
      c.beginPath();
      c.arc(0, 74, 13, 0.2 * Math.PI, 0.8 * Math.PI);
      c.stroke();
    } else {
      p.text("?", 0, 118, 15, "#8a90b0", { font: "mono" });
    }
    c.restore();
  }
  c.save(); // 墙上的纸（只用歌词里的字）
  c.translate(1082, 392);
  c.rotate(0.04 + Math.sin(t * 0.9) * 0.008);
  c.shadowColor = "rgba(0,0,0,0.5)";
  c.shadowBlur = 16;
  c.shadowOffsetY = 6;
  p.rr(-94, -124, 188, 248, 5);
  c.fillStyle = "#e7dfc8";
  c.fill();
  c.shadowColor = "transparent";
  c.fillStyle = "rgba(255,240,170,0.6)";
  c.fillRect(-28, -134, 56, 18);
  c.setLineDash([6, 6]);
  c.strokeStyle = "#6a5f8a";
  c.lineWidth = 3;
  c.beginPath();
  c.arc(0, -52, 46, 0, TAU);
  c.stroke();
  c.beginPath();
  c.arc(0, -50, 24, 0.2 * Math.PI, 0.8 * Math.PI);
  c.stroke();
  c.setLineDash([]);
  c.fillStyle = "#6a5f8a";
  c.beginPath();
  c.arc(-16, -64, 3.5, 0, TAU);
  c.fill();
  c.beginPath();
  c.arc(16, -64, 3.5, 0, TAU);
  c.fill();
  p.text("笑容", 0, 26, 36, "#3a3350", { font: "serif" });
  p.text("不知下落", 0, 66, 21, "#6a5f8a", { font: "serif" });
  for (let i = 0; i < 7; i++) {
    c.fillStyle = "#d8cfb4";
    c.fillRect(-90 + i * 26, 92, 22, 32);
    c.strokeStyle = "rgba(90,80,110,0.5)";
    c.lineWidth = 1;
    c.strokeRect(-90 + i * 26, 92, 22, 32);
  }
  c.restore();
  c.fillStyle = "#020309"; // 地上的洞
  c.beginPath();
  c.ellipse(650, 634, 78, 15, 0, 0, TAU);
  c.fill();
  c.strokeStyle = "rgba(120,140,220,0.35)";
  c.lineWidth = 2;
  c.stroke();
  for (let i = 0; i < 4; i++) { // 找过的地方留下的问号
    p.single("fx_question", 250 + i * 86, 690 - (i % 2) * 16, 2, { alpha: 0.28 + 0.2 * Math.sin(t * 2 + i) });
  }
  const mx = 706 + Math.sin(t * 1.6) * 80; // 鲸 + 放大镜
  p.beam(800, 560, mx - 40, 650, 6, 86, 50, 0.16);
  whale(p, t, 846, 660, 205, "sad", { outline: "#8fa8ee", outlineW: 1.5, outlineA: 0.5 });
  p.single("prop_magnifier", mx, 612 + Math.cos(t * 1.6) * 12, 4.2, { rot: Math.sin(t * 1.6) * 0.25 });
  const sx = 618 + Math.sin(t * 1.3) * 16 + fall * 50; // 笑容本体
  const sy = 336 + Math.sin(t * 1.9) * 9 + 520 * fall * fall;
  if (sy < 640) {
    const flick = fall > 0 ? 1 : 0.75 + 0.25 * Math.sin(t * 9) * Math.sin(t * 2.3);
    c.save();
    c.translate(sx, sy);
    c.rotate(Math.sin(t * 1.1) * 0.1 + fall * 4.5);
    c.globalAlpha = flick * (1 - range(sy, 570, 640));
    c.shadowColor = "rgba(255,210,90,0.95)";
    c.shadowBlur = 26;
    c.strokeStyle = "#ffe08a";
    c.fillStyle = "#ffe08a";
    c.lineWidth = 11;
    c.lineCap = "round";
    c.beginPath();
    c.arc(0, -8, 62, 0.22 * Math.PI, 0.78 * Math.PI);
    c.stroke();
    c.beginPath();
    c.arc(-38, -30, 9, 0, TAU);
    c.fill();
    c.beginPath();
    c.arc(38, -30, 9, 0, TAU);
    c.fill();
    c.restore();
    if (fall > 0) {
      for (let n = p.emit(60); n > 0; n--) {
        p.spawn({ k: K.glow, x: sx + (Math.random() - 0.5) * 90, y: sy, vy: -40, max: 0.7, size: 3, hue: 46, a: 0.9, add: true });
      }
    }
  }
  dust(p, t, 16, 48, 0.8);
  p.drawParts(t);
  c.restore();
}
