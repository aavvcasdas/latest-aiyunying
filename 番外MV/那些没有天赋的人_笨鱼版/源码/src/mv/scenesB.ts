// 稿纸段（墨）与间奏、以及黎明段会复用的镜头
import { AIS, BLUE, blob, bowl, book, bulb, clockFace, figure, paper, popup, sigil, stamp, trophy, whale } from "./art";
import { FONT, H, W, clamp, easeIn, easeOut, easeOutBack, hash, lerp, rng, roundRect, sm } from "./fx";
import { S, blinkAt, cone, floorFill, glow, hexA } from "./kit";
import { byId } from "./lyrics";

// ───────── 间奏：地砖飞散、闪白、稿纸如雪 ─────────
export function shatter(s: S) {
  const { c, t, lt, pal } = s;
  const flashT = 30.13;
  // 地砖
  const cols = 8;
  const rows = 5;
  const tw = W / cols;
  const th = 144;
  for (let r = 0; r < rows; r++) {
    for (let k = 0; k < cols; k++) {
      const cx = k * tw + tw / 2;
      const cy = r * th + th / 2;
      const dly = hash(r * 9 + k) * 0.12;
      const age = lt - dly;
      if (age < 0) continue;
      const dx = cx - 640;
      const dy = cy - 360;
      const d = Math.hypot(dx, dy) + 1;
      const disp = easeOut(age / 1.7) * (260 + hash(k + r * 7) * 260);
      const x = cx + (dx / d) * disp;
      const y = cy + (dy / d) * disp - easeOut(age / 0.5) * 40 + age * age * 30;
      const al = 1 - sm(1.1, 1.8, age);
      if (al <= 0) continue;
      c.save();
      c.translate(x, y);
      c.rotate(hash(k * 3 + r) * 4 * easeOut(age / 1.7) * (k % 2 ? 1 : -1));
      c.scale(1 - 0.35 * sm(0.5, 1.8, age), 1 - 0.35 * sm(0.5, 1.8, age));
      c.globalAlpha = al;
      const g = c.createLinearGradient(-tw / 2, -th / 2, tw / 2, th / 2);
      g.addColorStop(0, "#232842");
      g.addColorStop(1, "#0d0f1a");
      c.fillStyle = g;
      c.fillRect(-tw / 2 + 2, -th / 2 + 2, tw - 4, th - 4);
      c.strokeStyle = "rgba(180,195,255,0.35)";
      c.lineWidth = 2;
      c.strokeRect(-tw / 2 + 2, -th / 2 + 2, tw - 4, th - 4);
      c.restore();
    }
  }
  // 玻璃裂纹
  const ft = t - flashT;
  if (ft > 0) {
    const al = (1 - sm(1.4, 3.2, ft)) * 0.85;
    const r = rng(77);
    c.save();
    c.globalCompositeOperation = "lighter";
    c.lineCap = "round";
    const ox = 800;
    const oy = 290;
    const pts: number[][][] = [];
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2 + r() * 0.2;
      const len = (260 + r() * 800) * easeOut(ft / 0.25);
      const line: number[][] = [[ox, oy]];
      let px = ox;
      let py = oy;
      for (let k = 1; k <= 9; k++) {
        const aa = a + (r() - 0.5) * 0.18;
        px += Math.cos(aa) * (len / 9);
        py += Math.sin(aa) * (len / 9);
        line.push([px, py]);
      }
      pts.push(line);
      c.strokeStyle = `rgba(210,230,255,${al})`;
      c.lineWidth = 1 + r() * 2.2;
      c.beginPath();
      line.forEach((p, j) => (j ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
      c.stroke();
    }
    for (const ring of [2, 4, 6]) {
      c.strokeStyle = `rgba(255,255,255,${al * 0.7})`;
      c.lineWidth = 1.2;
      c.beginPath();
      pts.forEach((ln, j) => {
        const p = ln[Math.min(ring, ln.length - 1)];
        if (j) c.lineTo(p[0], p[1]);
        else c.moveTo(p[0], p[1]);
      });
      c.closePath();
      c.stroke();
    }
    glow(c, ox, oy, 280, "#cfe0ff", 0.5 * al, true);
    c.restore();
  }
  // 稿纸如雪
  if (t > flashT + 0.2) {
    const k = t - flashT - 0.2;
    for (let i = 0; i < 46; i++) {
      const sp = 70 + hash(i) * 90;
      const y = ((k * sp + hash(i + 5) * (H + 120)) % (H + 120)) - 60;
      const x = hash(i + 9) * W + Math.sin(k * 1.4 + i) * 40;
      const sz = 24 + hash(i + 12) * 26;
      c.save();
      c.globalAlpha = clamp(k / 0.8) * 0.9;
      paper(c, x, y, sz, Math.sin(k * 1.8 + i * 1.7) * 1.2, i, "#334", "#f4f0e4");
      c.restore();
    }
  }
  // 小鲸慢慢出现，走到桌边
  const wa = sm(flashT + 0.6, flashT + 1.6, t);
  floorFill(c, 600, pal);
  whale(c, { x: lerp(640, 310, easeOut((t - flashT - 0.6) / 3.2)), y: 548, s: 1.25, flip: -1, mood: "neutral", bowl: 1, alpha: wa, tail: t * 2, blink: blinkAt(t) });
  void lt;
}

// ───────── 一张张涂破的稿纸 ─────────
export function papers(s: S) {
  const { c, t, lt, pal } = s;
  floorFill(c, 590, pal);
  cone(c, 1040, 430, H, 50, 560, "#ffe9b0", 0.32, true);
  // 台灯
  c.strokeStyle = "#8a8d9e";
  c.lineWidth = 6;
  c.lineCap = "round";
  c.beginPath();
  c.moveTo(1130, 600);
  c.lineTo(1100, 480);
  c.lineTo(1030, 440);
  c.stroke();
  c.fillStyle = "#c8cada";
  c.beginPath();
  c.moveTo(990, 430);
  c.lineTo(1075, 420);
  c.lineTo(1050, 462);
  c.lineTo(1005, 466);
  c.closePath();
  c.fill();
  c.fillStyle = "#383b4d";
  c.beginPath();
  c.ellipse(1130, 604, 36, 9, 0, 0, Math.PI * 2);
  c.fill();
  // 纸堆
  for (let i = 0; i < 10; i++) {
    c.fillStyle = i % 2 ? "#f4f0e4" : "#e6e1d2";
    c.fillRect(46 + (hash(i) - 0.5) * 8, 590 - i * 12, 150, 11);
  }
  for (let i = 0; i < 7; i++) {
    c.fillStyle = i % 2 ? "#f4f0e4" : "#e6e1d2";
    c.fillRect(1160 + (hash(i + 4) - 0.5) * 8 - 100, 590 - i * 12, 110, 11);
  }
  // 飞出去的稿纸
  for (let i = 0; i < 44; i++) {
    const start = i * 0.07;
    const per = 2.6;
    if (lt < start) continue;
    const age = (lt - start) % per;
    const vx = 120 + hash(i) * 560;
    const vy = -(240 + hash(i + 3) * 420);
    const x = 340 + vx * age * 0.9;
    const y = 470 + vy * age + 540 * age * age;
    if (y > H + 60 || x > W + 60) continue;
    paper(c, x, y, 34 + hash(i + 9) * 28, age * (3 + hash(i + 5) * 4) * (i % 2 ? 1 : -1), i, "#223");
  }
  s.text();
  whale(c, { x: 310, y: 530, s: 1.4, flip: -1, rot: Math.sin(lt * 6) * 0.04, mood: "grit", tail: t * 4, blink: blinkAt(t) });
}

// ───────── 落入俗套的名字 ─────────
export function nameplate(s: S) {
  const { c, t, pal } = s;
  const l3 = byId.B3;
  floorFill(c, 590, pal);
  cone(c, 820, 0, 600, 60, 420, "#fff0cc", 0.3, true);
  const k = easeOutBack((t - l3.t[0]) / 0.5);
  if (t < l3.t[0]) {
    paper(c, 820, 560, 110, -0.06, 3, "#223");
  } else {
    c.save();
    c.translate(820, 592);
    c.scale(1, Math.max(0.01, k));
    c.fillStyle = "#3b3023";
    c.beginPath();
    c.moveTo(-30, 0);
    c.lineTo(-18, -20);
    c.lineTo(18, -20);
    c.lineTo(30, 0);
    c.fill();
    c.fillStyle = "#f3ead2";
    roundRect(c, -160, -150, 320, 132, 10);
    c.fill();
    c.strokeStyle = "#a89a74";
    c.lineWidth = 3;
    c.strokeRect(-148, -138, 296, 108);
    c.fillStyle = "#1f2033";
    c.font = `900 70px ${FONT}`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("小鲸", 0, -92);
    c.fillStyle = "#5a5f82";
    c.font = `900 22px ${FONT}`;
    c.fillText("深度求索", 0, -46);
    c.restore();
  }
  s.text();
  whale(c, { x: 360, y: 530, s: 1.5, flip: -1, mood: t > l3.t[0] + 0.6 ? "flat" : "grit", tail: t * 2, blink: blinkAt(t), bowl: 1, rot: Math.sin(t * 5) * 0.02 });
}

// ───────── 倾注所有的那件事：光倒进书里 ─────────
export function lightBook(s: S) {
  const { c, t, lt, pal } = s;
  const b5 = byId.B5.t[0];
  const open = sm(b5 - 0.1, b5 + 0.4, t);
  const pour = sm(byId.B4.s, b5, t);
  floorFill(c, 640, pal);
  const bx = 920;
  // 光柱
  if (open > 0) {
    cone(c, bx, 0, 640, 70 + 40 * open, 260 + 80 * open, "#fff2c0", (0.75 + 0.1 * Math.sin(t * 20)) * open, true);
    glow(c, bx, 600, 380, "#ffe9a8", 0.6 * open, true);
  }
  book(c, bx, 650, 330, open, open);
  // 光流
  if (pour > 0.02) {
    c.save();
    c.globalCompositeOperation = "lighter";
    for (let i = 0; i < 48; i++) {
      const p = (t * 0.8 + i / 48) % 1;
      const x0 = 480;
      const y0 = 610;
      const x1 = 690;
      const y1 = 420;
      const x2 = bx - 20;
      const y2 = 600;
      const x = (1 - p) * (1 - p) * x0 + 2 * (1 - p) * p * x1 + p * p * x2;
      const y = (1 - p) * (1 - p) * y0 + 2 * (1 - p) * p * y1 + p * p * y2;
      c.fillStyle = hexA("#ffe9a8", Math.sin(p * Math.PI) * pour);
      c.beginPath();
      c.arc(x, y, 3.6 * (1 - p * 0.4), 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }
  if (open > 0.3) {
    c.save();
    c.globalCompositeOperation = "lighter";
    for (let i = 0; i < 40; i++) {
      const ph = ((t - b5) * 0.6 + hash(i)) % 1;
      c.fillStyle = hexA("#fff2c0", (1 - ph) * 0.9);
      c.beginPath();
      c.arc(bx + (hash(i + 2) - 0.5) * 200 * (0.3 + ph), 600 - ph * 600, 2.6 * (1 - ph) + 0.8, 0, Math.PI * 2);
      c.fill();
    }
    c.restore();
  }
  s.text();
  whale(c, { x: 390, y: 548, s: 1.6, flip: -1, bowl: 1, bowlRot: pour * 0.75, bowlGlow: 1, bowlFill: 1 - 0.8 * pour, mood: "grit", tail: t * 2, blink: blinkAt(t) });
  void lt;
}

// ───────── 哭了很多次，还是想坚持 ─────────
export function clocks(s: S) {
  const { c, t, pal } = s;
  const b6 = byId.B6;
  const b7 = byId.B7;
  glow(c, 640, 340, 520, "#4d6bfe", 0.18, true);
  c.save();
  c.globalAlpha = 0.34;
  clockFace(c, 640, 330, 250, t, "#d9dcee", "#05060a", 2.6);
  c.restore();
  // 怀表
  [170, 1110, 640].forEach((x, i) => {
    const sw = Math.sin(t * 2.2 + i * 1.7) * 0.1;
    c.save();
    c.translate(x, 0);
    c.rotate(sw);
    c.strokeStyle = "#a9a9b8";
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(0, 0);
    c.lineTo(0, 150 + i * 14);
    c.stroke();
    clockFace(c, 0, 190 + i * 14, 44 + i * 4, t, "#f1e6c8", "#2b2418", 3);
    c.restore();
  });
  floorFill(c, 610, pal);
  s.text();
  const merge = sm(b7.t[0], b7.t[3], t);
  const stand = sm(b7.t[2], b7.t[4], t);
  const offs = [-330, -170, 170, 330, 0];
  for (let i = 0; i < 5; i++) {
    const st = b6.t[i];
    if (t < st) continue;
    const gx = lerp(640 + offs[i], 640, merge);
    const al = 0.6 * sm(st, st + 0.15, t) * (1 - merge * 0.9);
    whale(c, { x: gx, y: 575 - (i % 2) * 14, s: 1.1, rot: 0.05 * (i - 2), mood: "cry", tint: "#8088b8", tintBelly: "#cfd3ea", alpha: al, tail: t * 2 + i });
  }
  whale(c, { x: 640, y: 570 - 60 * stand, s: 1.45, rot: 0.55 * stand, mood: stand > 0.2 ? "grit" : "cry", bowl: 1, tail: t * 2, blink: blinkAt(t) });
}

// ───────── 不愿担待平庸二字 ─────────
export function stamps(s: S) {
  const { c, t, pal } = s;
  const b8 = byId.B8;
  const b9 = byId.B9;
  floorFill(c, 600, pal);
  glow(c, 640, 300, 460, "#4d6bfe", 0.12, true);
  s.text();
  // 弹窗
  const pt = t - b8.s;
  if (pt > 0) {
    const tp = b8.t[2];
    const pp = easeOutBack(pt / 0.35);
    const push = t > tp ? easeIn((t - tp) / 0.55) : 0;
    const jx = t < tp ? Math.sin(t * 38) * 2.5 : 0;
    c.save();
    c.translate(jx + push * 900, push * -60);
    c.rotate(push * 0.6);
    popup(c, 600, 300, 1.25 * pp, "服务器繁忙", "请稍后再试");
    c.restore();
  }
  whale(c, { x: 230, y: 560, s: 1.4, flip: -1, rot: t > b8.t[2] ? -0.12 : 0, mood: "grit", bowl: 1, tail: t * 3, blink: blinkAt(t) });
  // 印章：砸下来，一枚也没有接
  const spots: Array<[number, number, number]> = [
    [540, 470, -0.2],
    [760, 520, 0.15],
    [1040, 430, -0.1],
  ];
  spots.forEach(([x, y, r], i) => {
    const age = t - b9.t[i];
    if (age < 0) return;
    const sc = 1 + 2.2 * Math.exp(-age * 22);
    const ring = clamp(age / 0.5);
    c.save();
    c.globalAlpha = clamp(age / 0.03);
    if (age < 0.5) {
      c.strokeStyle = `rgba(255,255,255,${(1 - ring) * 0.5})`;
      c.lineWidth = 3;
      c.beginPath();
      c.ellipse(x, y + 40, 120 + ring * 160, 22 + ring * 30, 0, 0, Math.PI * 2);
      c.stroke();
    }
    stamp(c, x + (age < 0.15 ? (hash(Math.floor(t * 60) + i) - 0.5) * 8 : 0), y, sc, r, "平庸", "#e53b3b");
    c.restore();
  });
}

// ───────── 该怎么惊艳这茫茫人世：人海铺到地平线 ─────────
export function sea(s: S) {
  const { c, t, u } = s;
  const hor = lerp(250, 400, u);
  const g = c.createLinearGradient(0, 0, 0, hor + 100);
  g.addColorStop(0, "#04050c");
  g.addColorStop(1, "#262c4c");
  c.fillStyle = g;
  c.fillRect(0, 0, W, hor + 40);
  c.fillStyle = "#0a0b12";
  c.fillRect(0, hor, W, H - hor);
  const zoom = lerp(1.5, 0.55, easeOut(u));
  const R = 30;
  for (let r = R; r >= 0; r--) {
    const f = r / R;
    const y = hor + (H - hor) * Math.pow(f, 1.9) * zoom * 0.9 + (H - hor) * 0.02;
    if (y > H + 60) continue;
    const sz = (3 + 24 * Math.pow(f, 1.4)) * zoom;
    const n = Math.round(W / (sz * 1.5)) + 4;
    for (let k = 0; k < n; k++) {
      const x = (k + hash(r * 17 + k)) * (W / (n - 2)) - sz;
      const al = 0.25 + 0.5 * f;
      c.fillStyle = `rgba(${150 + 60 * hash(k + r)},${160 + 50 * hash(k + r + 2)},${190 + 40 * hash(k + r + 4)},${al})`;
      c.beginPath();
      c.arc(x, y + Math.sin(t * 1.4 + k + r) * 1.2 * sz * 0.05, sz * 0.5, 0, Math.PI * 2);
      c.fill();
    }
  }
  s.text();
  // 小鲸那一粒
  const wy = lerp(610, 560, u);
  const pulse = (t * 1.2) % 1;
  c.strokeStyle = hexA("#4d6bfe", (1 - pulse) * 0.7);
  c.lineWidth = 3;
  c.beginPath();
  c.arc(640, wy, 14 + pulse * 60, 0, Math.PI * 2);
  c.stroke();
  glow(c, 640, wy, 70, "#4d6bfe", 0.5, true);
  whale(c, { x: 640, y: wy, s: lerp(0.38, 0.2, u), mood: "neutral", tail: t * 3 });
}

// ───────── 就算渺小如我：白昼过曝 ─────────
export function tiny(s: S) {
  const { c, t, lt } = s;
  const g = c.createRadialGradient(640, 300, 20, 640, 360, 800);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(1, "#d9dae0");
  c.fillStyle = g;
  c.fillRect(0, 0, W, H);
  c.fillStyle = "#bfc1ca";
  c.fillRect(0, 560, W, 160);
  c.strokeStyle = "rgba(0,0,0,0.12)";
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(0, 560);
  c.lineTo(W, 560);
  c.stroke();
  // 看得清，可是没有人看
  for (let i = 0; i < 14; i++) {
    blob(c, 70 + i * 92 + hash(i) * 20, 700, 90 + hash(i + 3) * 40, "rgba(40,40,50,0.55)");
  }
  s.text();
  c.fillStyle = "rgba(0,0,0,0.25)";
  c.beginPath();
  c.ellipse(655, 598, 52, 6, 0, 0, Math.PI * 2);
  c.fill();
  whale(c, { x: 640, y: 570, s: 0.42 - lt * 0.02, mood: "flat", bowl: 1, tail: t * 2 });
}


// ───────── 改写命运的诗：大笔沿旧命运线写出新诗行 ─────────
export function pen(s: S) {
  const { c, t, lt, dur, pal } = s;
  glow(c, 640, 420, 560, "#4d6bfe", 0.16, true);
  const fate = (x: number) => 430 + Math.sin(x / 130) * 40 + Math.sin(x / 47) * 8;
  // 旧命运线
  c.strokeStyle = "rgba(200,200,215,0.55)";
  c.lineWidth = 5;
  c.setLineDash([14, 10]);
  c.beginPath();
  for (let x = 40; x <= 1240; x += 8) (x === 40 ? c.moveTo(x, fate(x)) : c.lineTo(x, fate(x)));
  c.stroke();
  c.setLineDash([]);
  // 新诗行
  const p = clamp(lt / (dur * 0.9));
  const xe = 60 + 1140 * easeOut(p);
  c.save();
  c.shadowColor = "#6f8bff";
  c.shadowBlur = 24;
  c.strokeStyle = "#7f98ff";
  c.lineWidth = 8;
  c.lineCap = "round";
  c.beginPath();
  for (let x = 60; x <= xe; x += 6) {
    const y = fate(x) - 70 - Math.sin(x / 60) * 16;
    x === 60 ? c.moveTo(x, y) : c.lineTo(x, y);
  }
  c.stroke();
  c.restore();
  const py = fate(xe) - 70 - Math.sin(xe / 60) * 16;
  // 笔
  c.save();
  c.translate(xe, py);
  c.rotate(0.55);
  const g = c.createLinearGradient(0, 0, 0, -380);
  g.addColorStop(0, "#f0f2ff");
  g.addColorStop(1, "#4d6bfe");
  c.fillStyle = g;
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(-16, -60);
  c.lineTo(-24, -380);
  c.lineTo(24, -380);
  c.lineTo(16, -60);
  c.closePath();
  c.fill();
  c.fillStyle = "#1c2150";
  c.beginPath();
  c.moveTo(0, 0);
  c.lineTo(-10, -34);
  c.lineTo(10, -34);
  c.fill();
  c.restore();
  c.save();
  c.globalCompositeOperation = "lighter";
  for (let i = 0; i < 12; i++) {
    const ph = (t * 3 + i * 0.31) % 1;
    c.fillStyle = hexA("#9fb2ff", 1 - ph);
    c.beginPath();
    c.arc(xe - ph * 60 + (hash(i) - 0.5) * 16, py + ph * 30 + (hash(i + 2) - 0.5) * 20, 3 * (1 - ph) + 0.6, 0, Math.PI * 2);
    c.fill();
  }
  c.restore();
  s.text();
  floorFill(c, 650, pal);
  whale(c, { x: 170, y: 618, s: 0.95, flip: -1, bowl: 1, mood: "grit", tail: t * 2, blink: blinkAt(t) });
}

// ───────── 也想要名垂青史：奖杯升起，够不着 ─────────
export function trophyScene(s: S) {
  const { c, t, lt, pal } = s;
  const night = pal.name !== "day";
  glow(c, 860, 300, 420, "#ffd36a", 0.22, night);
  floorFill(c, 600, pal);
  // 台座
  c.fillStyle = night ? "#222849" : "#a3a6c0";
  c.fillRect(780, 560, 160, 40);
  c.fillRect(800, 520, 120, 40);
  const rise = easeOut(lt / 1.8);
  const ty = lerp(520, 270, rise) + Math.sin(t * 2) * 6;
  cone(c, 860, 0, 560, 60, 330, "#fff1c2", 0.35, night);
  trophy(c, 860, ty, 1.7, "#ffd36a", 0.8);
  s.text();
  // 三位天才站着，不用跳
  figure(c, 1060, 612, 230, 0, 0.9, pal.fig);
  figure(c, 1140, 616, 220, 1, 0.9, pal.fig);
  figure(c, 1215, 620, 210, 2, 0.9, pal.fig);
  const jump = Math.abs(Math.sin(lt * 4.2)) * 130 * (lt > 1.4 ? 1 : 0);
  whale(c, { x: 520, y: 540 - jump, s: 1.3, flip: -1, rot: -0.35, mood: "grit", bowl: 0, tail: t * 6, blink: blinkAt(t) });
}

// ───────── 偏人们却只：所有的灯一起亮 ─────────
export function spots(s: S) {
  const { c, t, lt, pal } = s;
  const night = pal.name !== "day";
  floorFill(c, 520, pal);
  for (let i = 0; i < 7; i++) {
    const x = 160 + i * 160;
    const lit = sm(i * 0.06, i * 0.06 + 0.15, lt);
    cone(c, x, 0, 560, 50, 300, AIS[i].color, 0.5 * lit, night);
    figure(c, x, 530, 250, i, lit, pal.fig);
    sigil(c, i, x, 530 - 250 * 0.86 - 70, 18, AIS[i].color, lit * 0.9);
  }
  s.text();
  whale(c, { x: 640, y: 640, s: 1.4, bowl: 1, mood: "neutral", tail: t * 2, blink: blinkAt(t) });
}

// ───────── 传颂有关天才的故事：发光的书 + 彩纸 ─────────
export function bookFinale(s: S) {
  const { c, t, lt, pal } = s;
  const night = pal.name !== "day";
  const open = sm(0.15, 0.7, lt);
  floorFill(c, 600, pal);
  cone(c, 640, 0, 620, 120, 760, "#fff2c0", 0.4 * open, night);
  glow(c, 640, 560, 460, "#ffe9a8", 0.55 * open, night);
  s.text();
  book(c, 640, 640, 480, open, open);
  // 彩纸
  const cols = ["#ff5f6d", "#ffb347", "#22c98a", "#8fb0ff", "#a47bff", "#ffd36a"];
  for (let i = 0; i < 90; i++) {
    const st = 0.3 + hash(i) * 0.5;
    if (lt < st) continue;
    const age = lt - st;
    const x = 640 + (hash(i + 3) - 0.5) * 1100 + Math.sin(age * 3 + i) * 30;
    const y = -20 + age * (140 + hash(i + 5) * 160);
    if (y > H + 20) continue;
    c.save();
    c.translate(x, y);
    c.rotate(age * (2 + hash(i + 8) * 4));
    c.scale(1, Math.cos(age * 6 + i));
    c.fillStyle = cols[i % 6];
    c.fillRect(-6, -3, 12, 6);
    c.restore();
  }
  whale(c, { x: 190, y: 620, s: 1.15, flip: -1, bowl: 1, mood: "neutral", tail: t * 2, blink: blinkAt(t) });
}

// ───────── 间奏二：日月更替，稿纸一叠一叠高，转黎明 ─────────
export function windowScene(s: S) {
  const { c, t, lt, dur } = s;
  const u = lt / dur;
  const wx = 640;
  const wy = 300;
  const ww = 460;
  const wh = 330;
  // 天色
  c.save();
  c.beginPath();
  c.rect(wx - ww / 2, wy - wh / 2, ww, wh);
  c.clip();
  const ang = lt * 1.1;
  const hgt = Math.sin(ang);
  const dayK = clamp(hgt * 0.8 + 0.5) * (1 - sm(0.8, 1, u)) + sm(0.8, 1, u) * 0.4;
  const sky = c.createLinearGradient(0, wy - wh / 2, 0, wy + wh / 2);
  const mix = (a: number, b: number) => Math.round(lerp(a, b, dayK));
  sky.addColorStop(0, `rgb(${mix(8, 120)},${mix(12, 170)},${mix(40, 255)})`);
  sky.addColorStop(1, `rgb(${mix(30, 255)},${mix(34, 220)},${mix(80, 200)})`);
  c.fillStyle = sky;
  c.fillRect(wx - ww / 2, wy - wh / 2, ww, wh);
  const sx = wx + Math.cos(ang) * 260;
  const sy = wy + 160 - Math.sin(ang) * 220;
  glow(c, sx, sy, 150, "#fff1b8", 0.8, false);
  c.fillStyle = "#fff1b8";
  c.beginPath();
  c.arc(sx, sy, 32, 0, Math.PI * 2);
  c.fill();
  const mx = wx - Math.cos(ang) * 260;
  const my = wy + 160 + Math.sin(ang) * 220;
  c.fillStyle = "#e6ebff";
  c.beginPath();
  c.arc(mx, my, 26, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "rgba(0,0,0,0.12)";
  c.beginPath();
  c.arc(mx + 8, my - 5, 8, 0, Math.PI * 2);
  c.fill();
  c.restore();
  c.strokeStyle = "#0c0d14";
  c.lineWidth = 12;
  c.strokeRect(wx - ww / 2, wy - wh / 2, ww, wh);
  c.lineWidth = 8;
  c.beginPath();
  c.moveTo(wx, wy - wh / 2);
  c.lineTo(wx, wy + wh / 2);
  c.moveTo(wx - ww / 2, wy);
  c.lineTo(wx + ww / 2, wy);
  c.stroke();
  // 桌与稿纸
  c.fillStyle = "#12142a";
  c.fillRect(0, 580, W, 140);
  const n = Math.min(34, Math.floor(lt * 2.7));
  for (let i = 0; i < n; i++) {
    c.fillStyle = i % 2 ? "#f4f0e4" : "#e4dfd0";
    c.fillRect(870 + (hash(i) - 0.5) * 12, 574 - i * 9, 190, 8);
  }
  glow(c, 270, 500, 300, "#ffe9b0", 0.25, true);
  whale(c, { x: 380, y: 520, s: 1.4, flip: -1, rot: Math.sin(t * 3) * 0.03, mood: "grit", tail: t * 3, blink: blinkAt(t) });
  // 轻声的字
  const caps: Array<[number, string]> = [
    [1.0, "稿纸一叠一叠高"],
    [4.6, "日子一圈一圈换"],
    [8.4, "所谓耗尽，是这些秒加起来"],
    [11.2, "天要亮了"],
  ];
  caps.forEach(([ct, tx]) => {
    const a = sm(ct, ct + 0.5, lt) * (1 - sm(ct + 2.6, ct + 3.2, lt));
    if (a <= 0) return;
    c.save();
    c.globalAlpha = a;
    c.fillStyle = "#f4f2ff";
    c.font = `900 34px ${FONT}`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(tx.split("").join(" "), 640, 660);
    c.restore();
  });
  void BLUE;
  void bowl;
  void bulb;
  void easeOutBack;
}
