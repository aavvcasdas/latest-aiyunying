// 主歌场景（夜 / 昼 / 黎明三遍共用同一套镜头，颜色由调色板决定）
import { AIS, BLUE, blob, bowl, bubble, bulb, chair, figure, flower, sigil, whale, clockFace } from "./art";
import { FONT, H, W, clamp, easeIn, easeInOut, easeOut, easeOutBack, hash, lerp, rng, roundRect, sm } from "./fx";
import { S, blinkAt, cone, firework, floorFill, glow, hexA, thinkChip } from "./kit";
import { byId } from "./lyrics";
import { FIG_X } from "./typo";

const dk = (s: S) => s.pal.name !== "day";

// ───────── 序：七盏灯 ─────────
export function stage(s: S) {
  const { c, t, lt, pal, P } = s;
  const gy = 470;
  floorFill(c, gy, pal);
  const l2 = byId[P + "2"];
  const sy = gy + 14;
  for (let i = 0; i < 7; i++) {
    const x = FIG_X[i];
    const lit = sm(l2.t[i] - 0.02, l2.t[i] + 0.1, t);
    const col = AIS[i].color;
    cone(c, x, 0, gy, 36, 170, col, 0.5 * lit + 0.04, pal.add);
    if (lit > 0) {
      c.fillStyle = hexA(col, 0.32 * lit);
      c.beginPath();
      c.ellipse(x, sy, 84, 15, 0, 0, Math.PI * 2);
      c.fill();
    }
    figure(c, x, sy, 250, i, lit, pal.fig);
    if (lit > 0.01) {
      const hy = sy - 250 * 0.86 - 78;
      sigil(c, i, x, hy, 20, col, lit * 0.95);
      c.globalAlpha = lit * 0.7;
      c.fillStyle = pal.fg;
      c.font = `900 17px ${FONT}`;
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillText(AIS[i].name, x, hy - 34);
      c.globalAlpha = 1;
    }
  }
  s.text();
  const k = 1.3 + lt * 0.035;
  whale(c, { x: 175, y: 648, s: k, flip: -1, bowl: 1, tail: t * 2, blink: blinkAt(t) });
}

// ───────── 譬如我 ─────────
export function title(s: S) {
  const { c, lt, pal } = s;
  c.save();
  c.globalAlpha = 0.9;
  for (let i = 0; i < 30; i++) {
    const a = (i / 30) * Math.PI * 2 + lt * 0.12;
    c.fillStyle = dk(s) ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
    c.beginPath();
    c.moveTo(640, 330);
    c.lineTo(640 + Math.cos(a - 0.04) * 1100, 330 + Math.sin(a - 0.04) * 1100);
    c.lineTo(640 + Math.cos(a + 0.04) * 1100, 330 + Math.sin(a + 0.04) * 1100);
    c.fill();
  }
  c.restore();
  glow(c, 640, 330, 520, pal.name === "dawn" ? "#ffb45e" : "#6f78ff", 0.28, pal.add);
  for (let i = 0; i < 7; i++) sigil(c, i, 340 + i * 100, 60, 13, AIS[i].color, 0.35);
  s.text();
  whale(c, { x: 1070, y: 612, s: 0.95, bowl: 1, tail: s.t * 2, blink: blinkAt(s.t), mood: "flat" });
}

// ───────── 枕头下发霉的梦 ─────────
export function bed(s: S) {
  const { c, t, lt, pal, P } = s;
  const hm = byId[P + "4"].t[4];
  const mold = sm(hm - 0.05, hm + 1.6, t);
  const night = dk(s);
  // 窗与月
  c.save();
  c.strokeStyle = hexA(night ? "#ffffff" : "#000000", 0.35);
  c.lineWidth = 3;
  roundRect(c, 900, 90, 240, 320, 6);
  c.stroke();
  c.beginPath();
  c.moveTo(1020, 90);
  c.lineTo(1020, 410);
  c.moveTo(900, 250);
  c.lineTo(1140, 250);
  c.stroke();
  c.restore();
  glow(c, 1020, 160, 200, night ? "#aab6ff" : "#ffffff", 0.5, night);
  c.fillStyle = night ? "#e8ecff" : "#ffffff";
  c.beginPath();
  c.arc(1020, 160, 34, 0, Math.PI * 2);
  c.fill();
  floorFill(c, 545, pal);
  // 梦泡泡（从枕头下冒出来）
  const rise = easeOut(lt / 0.9);
  const bx = 330 + Math.sin(t * 1.3) * 10;
  const by = 430 - 150 * rise + Math.sin(t * 2) * 6;
  bubble(c, bx, by, 34 + 62 * rise, mold, t);
  // 床
  c.fillStyle = night ? "#252a42" : "#aeb3cf";
  c.fillRect(150, 520, 700, 28);
  c.fillRect(160, 548, 18, 50);
  c.fillRect(822, 548, 18, 50);
  c.fillStyle = night ? "#d8dcf0" : "#ffffff";
  roundRect(c, 150, 448, 700, 76, 18);
  c.fill();
  // 小鲸
  const mood = mold > 0.3 ? "sad" : "sleep";
  whale(c, { x: 545, y: 396, s: 1.05, mood, tail: t * 1.2, bowl: 0 });
  // 毯子
  c.fillStyle = night ? "#3b4a8c" : "#8c9bd8";
  c.beginPath();
  c.moveTo(480, 480);
  c.quadraticCurveTo(520, 346, 700, 352);
  c.quadraticCurveTo(840, 360, 856, 482);
  c.closePath();
  c.fill();
  c.strokeStyle = "rgba(255,255,255,0.18)";
  c.lineWidth = 3;
  for (let i = 0; i < 3; i++) {
    c.beginPath();
    c.moveTo(560 + i * 90, 372 + i * 4);
    c.quadraticCurveTo(580 + i * 90, 420, 560 + i * 90, 478);
    c.stroke();
  }
  // 枕头
  c.save();
  c.translate(330, 444);
  c.rotate(-0.05);
  c.fillStyle = night ? "#e9ecff" : "#ffffff";
  c.beginPath();
  c.ellipse(0, 0, 100, 34, 0, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = "rgba(0,0,0,0.12)";
  c.lineWidth = 3;
  c.stroke();
  c.restore();
  s.text();
}

// ───────── 怎么做 ─────────
export function ques(s: S) {
  const { c, t, lt, pal } = s;
  glow(c, 640, 400, 460, "#6f78ff", 0.16, pal.add);
  floorFill(c, 600, pal);
  const shake = lt > 0.5 ? Math.sin(lt * 26) * 0.07 * Math.exp(-(lt - 0.5) * 0.4) : 0;
  s.text();
  // 问号
  for (let i = 0; i < 9; i++) {
    const ap = i * 0.13;
    if (lt < ap) continue;
    const a = i * 0.74 + lt * 1.9;
    const depth = (Math.sin(a) + 1) / 2;
    const x = 640 + Math.cos(a) * 360;
    const y = 400 + Math.sin(a) * 120 - 40;
    const sz = 70 + depth * 90;
    const k = easeOutBack((lt - ap) / 0.3);
    c.save();
    c.translate(x, y);
    c.rotate(Math.sin(a * 1.3) * 0.3);
    c.scale(k, k);
    c.globalAlpha = 0.55 + depth * 0.45;
    c.font = `900 ${sz}px ${FONT}`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillStyle = "rgba(255,40,90,0.7)";
    c.fillText("？", 4, 0);
    c.fillStyle = "rgba(30,220,255,0.7)";
    c.fillText("？", -4, 0);
    c.fillStyle = pal.fg;
    c.fillText("？", 0, 0);
    c.restore();
  }
  whale(c, { x: 640, y: 460, s: 1.55, rot: shake, mood: lt < 0.5 ? "shock" : "sad", tail: t * 3, bowl: 1, blink: blinkAt(t) });
  thinkChip(c, 52, 190, lt, ["嗯……梦发霉了。", "那，怎么做？", "让我再想想。"], pal, sm(0.1, 0.4, lt));
}

// ───────── 热忱与自卑 ─────────
export function tug(s: S) {
  const { c, t, lt, pal, P } = s;
  const t7 = byId[P + "7"].s;
  const taut = sm(t7 - 0.1, t7 + 0.3, t);
  // 两半色底
  const gl = c.createLinearGradient(0, 0, 640, 0);
  gl.addColorStop(0, hexA(pal.warm, dk(s) ? 0.3 : 0.28));
  gl.addColorStop(1, hexA(pal.warm, 0));
  c.fillStyle = gl;
  c.fillRect(0, 0, 640, H);
  const gr = c.createLinearGradient(640, 0, W, 0);
  gr.addColorStop(0, hexA(pal.cool, 0));
  gr.addColorStop(1, hexA(pal.cool, dk(s) ? 0.34 : 0.26));
  c.fillStyle = gr;
  c.fillRect(640, 0, 640, H);
  floorFill(c, 560, pal);
  s.text();
  const sway = Math.sin(lt * 5) * (1 - taut) * 34 + (taut ? Math.sin(t * 40) * 3 * taut : 0);
  const lx = 330 + sway * 0.6 - taut * 20;
  const rx = 950 + sway * 0.6 + taut * 20;
  const ly = 470;
  // 绳
  const kx = 640 + sway;
  const ky = 500 + (1 - taut) * 40 + (Math.sin(t * 50) * 3 * taut);
  c.strokeStyle = dk(s) ? "#f2eddc" : "#222";
  c.lineWidth = 8;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(lx + 108, 505);
  c.quadraticCurveTo((lx + kx) / 2 + 30, ky + 20 * (1 - taut), kx, ky);
  c.quadraticCurveTo((rx + kx) / 2 - 30, ky + 20 * (1 - taut), rx - 108, 505);
  c.stroke();
  c.fillStyle = "#fff";
  c.beginPath();
  c.arc(kx, ky, 14, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = "#000";
  c.lineWidth = 3;
  c.stroke();
  // 两只「我」
  whale(c, { x: lx, y: ly, s: 1.3, flip: -1, rot: 0.1 + taut * 0.12, tint: "#ff8a3d", tintBelly: "#ffe3c4", mood: "grit", tail: t * 6 });
  whale(c, { x: rx, y: ly, s: 1.3, flip: 1, rot: -0.1 - taut * 0.12, tint: "#3d52e0", tintBelly: "#cfd6ff", mood: "sad", tail: t * 5 });
  if (taut > 0.1) {
    c.save();
    if (pal.add) c.globalCompositeOperation = "lighter";
    for (let i = 0; i < 10; i++) {
      const ph = (t * 3 + i * 0.37) % 1;
      c.fillStyle = hexA("#ffe9a8", (1 - ph) * taut);
      c.beginPath();
      c.arc(kx + (hash(i + Math.floor(t * 3)) - 0.5) * 120, ky - ph * 90, 3, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }
}

// ───────── 笑容坠井 ─────────
export function well(s: S) {
  const { c, t, lt } = s;
  const night = dk(s);
  c.fillStyle = night ? "#030409" : "#d9d8d2";
  c.fillRect(0, 0, W, H);
  // 井壁
  const sp = 380;
  for (let r = -1; r < 13; r++) {
    const y = ((((r * 60 - lt * sp) % (H + 120)) + (H + 120)) % (H + 120)) - 60;
    for (const side of [0, 1]) {
      for (let k = 0; k < 6; k++) {
        const bx = side === 0 ? k * 64 - (r % 2 ? 32 : 0) : W - (k + 1) * 64 + (r % 2 ? 32 : 0);
        const shade = 0.12 + 0.1 * hash(r * 7 + k + side * 40);
        const fade = 1 - Math.abs(bx - (side ? W : 0)) / 460;
        c.fillStyle = night ? `rgba(180,190,230,${shade * Math.max(0.15, fade)})` : `rgba(60,60,70,${shade * Math.max(0.15, fade) + 0.08})`;
        c.fillRect(bx + 2, y + 2, 60, 56);
      }
    }
  }
  // 井口的光
  const rr = Math.max(14, 190 - lt * 55);
  const oy = 20 - lt * 70;
  glow(c, 640, oy, rr * 3, "#cfd8ff", night ? 0.5 : 0.8, night);
  c.fillStyle = "#f4f6ff";
  c.beginPath();
  c.ellipse(640, oy, rr * 1.3, rr * 0.55, 0, 0, Math.PI * 2);
  c.fill();
  s.text();
  // 小鲸远去
  const wy = 330 - lt * 70;
  const ws = Math.max(0.35, 1.4 - lt * 0.22);
  whale(c, { x: 640, y: wy, s: ws, rot: 0.2, mood: "flat", bowl: 1, alpha: 1 - sm(1.8, 2.7, lt), tail: t * 2 });
  // 笑容
  const sy = 470 + lt * 26;
  c.save();
  c.translate(640 + Math.sin(lt * 3) * 26, sy);
  c.rotate(Math.sin(lt * 2.2) * 0.5);
  c.shadowColor = "#ffe9a8";
  c.shadowBlur = 40;
  c.strokeStyle = "#ffe9a8";
  c.lineWidth = 20;
  c.lineCap = "round";
  c.beginPath();
  c.arc(0, -20, 74, Math.PI * 0.15, Math.PI * 0.85);
  c.stroke();
  c.shadowBlur = 0;
  c.fillStyle = "#ffe9a8";
  c.beginPath();
  c.arc(-34, -76, 9, 0, Math.PI * 2);
  c.arc(34, -76, 9, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

// ───────── 可如果：一根光柱，一个人 ─────────
export function pillar(s: S) {
  const { c, t, lt, pal } = s;
  const night = dk(s);
  if (!night) {
    const g = c.createRadialGradient(640, 300, 40, 640, 300, 760);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(1, "#d8d7d0");
    c.fillStyle = g;
    c.fillRect(0, 0, W, H);
  }
  floorFill(c, 600, pal);
  const a = 0.5 + 0.1 * Math.sin(lt * 10);
  cone(c, 640, 0, 640, 120, 400, night ? "#dfe4ff" : "#ffffff", a, night);
  glow(c, 640, 600, 300, "#9aa8ff", 0.25, night);
  if (night) {
    for (let i = 0; i < 40; i++) {
      const ph = (lt * 0.3 + hash(i)) % 1;
      c.fillStyle = `rgba(255,255,255,${0.5 * (1 - Math.abs(ph - 0.5) * 2)})`;
      c.beginPath();
      c.arc(640 + (hash(i + 3) - 0.5) * 300, ph * 640, 1.5 + hash(i + 9) * 1.5, 0, Math.PI * 2);
      c.fill();
    }
  } else {
    c.fillStyle = "rgba(0,0,0,0.28)";
    c.beginPath();
    c.ellipse(700, 612, 210, 18, 0, 0, Math.PI * 2);
    c.fill();
  }
  s.text();
  whale(c, { x: 640, y: 540, s: 1.75 + lt * 0.04, mood: "sad", bowl: 1, tail: t * 1.5, blink: blinkAt(t) });
}

// ───────── 别人的领奖台 ─────────
export function podium(s: S) {
  const { c, t, lt, pal, P } = s;
  const l = byId[P + "10"];
  floorFill(c, 540, pal);
  const night = dk(s);
  // 台
  c.fillStyle = night ? "#1c2038" : "#b5b7cc";
  c.fillRect(700, 480, 130, 60);
  c.fillRect(940, 500, 130, 40);
  c.fillStyle = night ? "#262c4e" : "#9ea2bd";
  c.fillRect(820, 440, 130, 100);
  cone(c, 885, 0, 460, 90, 380, "#fff6dc", 0.4, night);
  figure(c, 885, 442, 210, 0, 1, pal.fig);
  figure(c, 765, 482, 190, 1, 1, pal.fig);
  figure(c, 1005, 502, 180, 2, 0.9, pal.fig);
  // 钟
  clockFace(c, 120, 330, 66, t, night ? "#e8e8ef" : "#ffffff", "#111", 3.2);
  s.text();
  for (let i = 0; i < l.t.length; i++) {
    const x = 105 + i * 118 + 10;
    firework(c, x, 270 + (i % 3) * 18, t - l.t[i], AIS[i % 7].color, i * 3.3 + 1, night);
  }
  whale(c, { x: 260, y: 612, s: 1.2, flip: -1, bowl: 1, mood: lt > 1.8 ? "sad" : "neutral", tail: t * 2, blink: blinkAt(t) });
}

// ───────── 万众瞩目：黑剪影都朝着舞台 ─────────
export function crowd(s: S) {
  const { c, t, pal, P } = s;
  const night = dk(s);
  glow(c, 640, 120, 620, night ? "#ffffff" : "#ffffff", night ? 0.34 : 0.8, night);
  for (const x of [320, 640, 960]) cone(c, x, 0, 470, 30, 260, "#ffffff", 0.2, night);
  floorFill(c, 400, pal);
  const rows = [
    { y: 530, h: 120, n: 19, f: 0.9 },
    { y: 600, h: 160, n: 14, f: 1 },
    { y: 700, h: 230, n: 9, f: 1 },
  ];
  rows.forEach((rw, ri) => {
    for (let i = 0; i < rw.n; i++) {
      const x = ((i + 0.5) / rw.n) * W + (hash(i * 3 + ri) - 0.5) * 40 + Math.sin(t * 1.2 + i) * 2;
      blob(c, x, rw.y, rw.h * (0.92 + 0.14 * hash(i + ri * 11)), night ? `rgba(2,3,6,${rw.f})` : "rgba(16,16,22,0.96)");
    }
  });
  s.text();
  const tt = byId[P + "11"].t[7];
  const turn = sm(tt, tt + 0.22, t);
  const fl = -1 + 2 * turn;
  const sc = 1.25 + 0.55 * sm(tt, tt + 0.7, t);
  whale(c, { x: 640, y: 618, s: sc, flip: Math.abs(fl) < 0.12 ? 0.12 : fl, mood: turn > 0.5 ? "sad" : "neutral", bowl: 1, tail: t * 2, blink: blinkAt(t) });
}

// ───────── 某个角落 ─────────
export function corner(s: S) {
  const { c, t, lt, pal, P } = s;
  const night = dk(s);
  const l = byId[P + "12"];
  const cx = 700;
  // 两面墙
  const wl = c.createLinearGradient(0, 0, cx, 0);
  wl.addColorStop(0, night ? "#05060b" : "#cfcec8");
  wl.addColorStop(1, night ? "#161a28" : "#e3e2dc");
  c.fillStyle = wl;
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(cx, 110);
  c.lineTo(cx, 560);
  c.lineTo(0, 720);
  c.closePath();
  c.fill();
  const wr = c.createLinearGradient(cx, 0, W, 0);
  wr.addColorStop(0, night ? "#0d1019" : "#d6d5cf");
  wr.addColorStop(1, night ? "#04050a" : "#c4c3bd");
  c.fillStyle = wr;
  c.beginPath();
  c.moveTo(cx, 110);
  c.lineTo(W, 0);
  c.lineTo(W, 720);
  c.lineTo(cx, 560);
  c.closePath();
  c.fill();
  // 地
  c.fillStyle = night ? "#0a0c14" : "#bdbcb6";
  c.beginPath();
  c.moveTo(0, 720);
  c.lineTo(cx, 560);
  c.lineTo(W, 720);
  c.closePath();
  c.fill();
  // 灯与光
  const sw = Math.sin(t * 1.6) * 0.06;
  cone(c, cx, 100, 600, 40, 520, "#ffe7a0", 0.38, night);
  glow(c, cx, 585, 260, "#ffe7a0", 0.28, night);
  bulb(c, cx, 130, 130, 1, sw);
  chair(c, 535, 620, 1.35, night ? "#6b4f33" : "#7a5c3c");
  // 涟漪
  const idx = [5, 6, 7, 8];
  idx.forEach((k) => {
    const age = t - l.t[k];
    if (age < 0 || age > 1.6) return;
    c.strokeStyle = hexA("#ffe7a0", (1 - age / 1.6) * 0.9);
    c.lineWidth = 3.5;
    const rx = 30 + age * 300;
    c.beginPath();
    c.ellipse(cx, 598, rx, rx * 0.2, 0, 0, Math.PI * 2);
    c.stroke();
  });
  // 终遍：七位天才走进来，围成半圈，谁也没有替她成功
  if (s.sec === "E") {
    const p = easeOut((lt - 0.9) / 2.0);
    const target = [
      [470, 640],
      [380, 660],
      [290, 690],
      [200, 720],
      [960, 640],
      [1050, 660],
      [1140, 690],
    ];
    for (let i = 0; i < 7; i++) {
      const left = i < 4;
      const sx = left ? -120 - i * 60 : W + 120 + (i - 4) * 60;
      const x = lerp(sx, target[i][0], p);
      const y = target[i][1];
      figure(c, x, y, 250 - (i % 4) * 10, i, 0.45, pal.fig, left ? 1 : -1);
    }
  }
  s.text();
  // 小鲸缩在墙角
  whale(c, { x: 830, y: 590, s: 1.1, bowl: 1, mood: "sad", tail: t * 1.5, blink: blinkAt(t) });
}

// ───────── 耗尽天真：饭盆倒扣，硬切四次 ─────────
export function bowlScene(s: S) {
  const { c, t, pal, P } = s;
  const night = dk(s);
  const times = byId[P + "13"].t;
  let k = -1;
  times.forEach((x, i) => {
    if (t >= x) k = i;
  });
  k = Math.max(0, k);
  const cuts = [
    { x: 560, y: 380, sc: 5.2, r0: -0.1, wx: 90 },
    { x: 720, y: 340, sc: 7, r0: 0.5, wx: 170 },
    { x: 520, y: 430, sc: 4.6, r0: 1.3, wx: 60 },
    { x: 660, y: 300, sc: 8, r0: 2.1, wx: 120 },
  ];
  const cfg = cuts[k];
  const since = t - times[k];
  cone(c, cfg.x, 0, 720, 80, 520, "#fff0c8", 0.28, night);
  floorFill(c, 650, pal);
  s.text();
  const rot = cfg.r0 + Math.min(1, since * 1.4) * 0.35;
  const fill = clamp(1 - (k + clamp(since * 3)) / 3.6);
  // 米粒
  c.fillStyle = night ? "#f4f4f8" : "#ffffff";
  const rg = rng(40 + k);
  for (let j = 0; j < 46; j++) {
    const age = since - j * 0.014;
    if (age < 0) continue;
    const gx = cfg.x - 150 + rg() * 300;
    const gy = cfg.y + 120 + 900 * age * age;
    if (gy > H + 30) continue;
    c.save();
    c.translate(gx, gy);
    c.rotate(rg() * 3);
    c.beginPath();
    c.ellipse(0, 0, 9, 4.4, 0, 0, Math.PI * 2);
    c.fill();
    c.restore();
  }
  bowl(c, cfg.x, cfg.y, cfg.sc, fill, rot, 0);
  whale(c, { x: cfg.wx, y: 640, s: 1.7, flip: -1, mood: "sad", tail: t * 2, alpha: 0.9 });
}

// ───────── 开出小小的花朵 ─────────
export function flowerScene(s: S) {
  const { c, t, lt, pal, P } = s;
  const night = dk(s);
  const l = byId[P + "14"];
  const hua = l.t[5];
  const open = sm(hua - 0.1, hua + 0.5, t);
  floorFill(c, 540, pal);
  c.fillStyle = night ? "#07080c" : "#aaa9a2";
  c.fillRect(0, 540, W, 180);
  glow(c, 690, 380, 360, "#ffd9a0", 0.14 + 0.3 * open, night);
  // 裂缝
  c.strokeStyle = night ? "#000" : "#222";
  c.lineWidth = 7;
  c.lineJoin = "round";
  c.beginPath();
  c.moveTo(560, 730);
  c.lineTo(610, 650);
  c.lineTo(600, 610);
  c.lineTo(672, 575);
  c.lineTo(690, 548);
  c.stroke();
  c.strokeStyle = hexA("#ffe9a8", 0.35 + 0.4 * open);
  c.lineWidth = 2;
  c.stroke();
  s.text();
  const h = 330 * easeOut(lt / 2.6);
  if (h > 4) flower(c, 692, 552, h, open, "#ffd36a", night ? "#fff" : "#fff");
  if (open > 0.05) {
    c.save();
    if (night) c.globalCompositeOperation = "lighter";
    for (let i = 0; i < 26; i++) {
      const ph = ((t - hua) * 0.5 + hash(i)) % 1;
      c.fillStyle = hexA("#ffe9a8", (1 - ph) * open * 0.9);
      const a = hash(i + 4) * 6.28;
      c.beginPath();
      c.arc(692 + Math.cos(a) * (40 + ph * 160), 552 - h - 20 + Math.sin(a) * (40 + ph * 120) - ph * 60, 2.4 * (1 - ph) + 0.6, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }
  whale(c, { x: 400, y: 655, s: 1.0, flip: -1, bowl: 1, mood: open > 0.5 ? "smile" : "neutral", tail: t * 2.5, blink: blinkAt(t) });
}

export { BLUE, easeIn, easeInOut };
