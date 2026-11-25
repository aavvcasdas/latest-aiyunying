// 场景构件：全部用 Canvas 程序化绘制，不用任何背景图片。
import { C, W, H, TAU, rnd, rr, glow, cloud, rgba, clamp, txt, sky, bg, dots, heart, note, mix } from './kit';
import { spr } from './cast';

/** 整面的窗：晴朗的天 */
export function windowView(c: C, t: number, warm = 0) {
  sky(c, t, { cols: warm ? ['#4f9fe8', '#9fd3f6', '#ffe9c9'] : ['#2f8ff0', '#74c8ff', '#d8f4ff'], n: 6, sp: 22, seed: 4 });
  const sx = 1010, sy = 150;
  c.save(); c.translate(sx, sy); c.rotate(t * 0.12);
  for (let i = 0; i < 12; i++) { c.rotate(TAU / 12); c.fillStyle = 'rgba(255,255,255,.16)'; c.beginPath(); c.moveTo(0, 0); c.lineTo(900, -50); c.lineTo(900, 50); c.closePath(); c.fill(); }
  c.restore();
  glow(c, sx, sy, 380, '#ffffff', 0.95); glow(c, sx, sy, 110, '#ffffff', 1);
  for (let i = 0; i < 4; i++) { const k = 0.3 + i * 0.28; c.fillStyle = `rgba(255,255,255,${0.2 - i * 0.03})`; c.beginPath(); c.arc(sx + (W / 2 - sx) * k * 1.7, sy + (H / 2 - sy) * k * 1.7, 26 + i * 16, 0, TAU); c.fill(); }
  // 窗框
  c.fillStyle = '#fffaf0'; c.fillRect(0, 0, W, 34); c.fillRect(0, H - 60, W, 60); c.fillRect(0, 0, 40, H); c.fillRect(W - 40, 0, 40, H);
  c.fillRect(W / 2 - 13, 0, 26, H); c.fillRect(0, 300, W, 20);
  c.fillStyle = 'rgba(190,160,120,.25)'; c.fillRect(0, H - 60, W, 6); c.fillRect(W / 2 + 13, 34, 4, H - 94); c.fillRect(40, 320, W - 80, 4);
  // 纱帘
  for (const side of [0, 1]) {
    c.save(); if (side) { c.translate(W, 0); c.scale(-1, 1); }
    const g = c.createLinearGradient(0, 0, 330, 0); g.addColorStop(0, 'rgba(255,255,255,.97)'); g.addColorStop(1, 'rgba(255,255,255,.35)');
    c.fillStyle = g; c.beginPath(); c.moveTo(0, 0); c.lineTo(250, 0);
    for (let y = 0; y <= H; y += 40) c.lineTo(250 + Math.sin(t * 1.1 + y * 0.012 + side) * 34 * (y / H) + (y / H) * 60, y);
    c.lineTo(0, H); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(170,200,230,.35)'; c.lineWidth = 3;
    for (let k = 1; k < 5; k++) { c.beginPath(); for (let y = 0; y <= H; y += 40) { const x = k * 52 + Math.sin(t * 1.1 + y * 0.012 + side + k) * 22 * (y / H); if (y) c.lineTo(x, y); else c.moveTo(x, y); } c.stroke(); }
    c.restore();
  }
}

/** 小小的房间。gold=1 是片尾的傍晚 */
export function room(c: C, t: number, o: { gold?: number; papers?: boolean; bare?: boolean } = {}) {
  const gold = o.gold ?? 0;
  bg(c, [mix('#fff8ea', '#ffe9c4', gold), mix('#f8e6cb', '#f6cf9b', gold)], 0, 0, 0, 520);
  // 窗
  const wx = 150, wy = 96, ww = 380, wh = 300;
  c.save(); rr(c, wx, wy, ww, wh, 10); c.clip();
  const g = c.createLinearGradient(0, wy, 0, wy + wh); g.addColorStop(0, mix('#4aa3f3', '#f39a6b', gold)); g.addColorStop(1, mix('#d2f0ff', '#ffe2a8', gold)); c.fillStyle = g; c.fillRect(wx, wy, ww, wh);
  cloud(c, wx + ((t * 9) % 520) - 60, wy + 120, 60, '#ffffff', 0.95, 3); cloud(c, wx + ((t * 5 + 300) % 560) - 80, wy + 230, 44, '#ffffff', 0.8, 5);
  glow(c, wx + 300, wy + 60, 150, '#ffffff', 0.9);
  c.restore();
  c.strokeStyle = '#fffdf7'; c.lineWidth = 14; rr(c, wx, wy, ww, wh, 10); c.stroke();
  c.lineWidth = 8; c.beginPath(); c.moveTo(wx + ww / 2, wy); c.lineTo(wx + ww / 2, wy + wh); c.moveTo(wx, wy + wh * 0.45); c.lineTo(wx + ww, wy + wh * 0.45); c.stroke();
  c.fillStyle = '#fffdf7'; c.fillRect(wx - 24, wy + wh + 2, ww + 48, 14);
  // 风铃
  const sw = Math.sin(t * 1.3) * 0.16;
  c.save(); c.translate(wx + ww - 60, wy + 8); c.rotate(sw); c.strokeStyle = 'rgba(120,150,190,.7)'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 34); c.stroke();
  c.fillStyle = 'rgba(190,232,255,.85)'; c.beginPath(); c.arc(0, 48, 16, Math.PI, 0); c.lineTo(16, 54); c.lineTo(-16, 54); c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(0, 54); c.lineTo(0, 76); c.stroke(); c.fillStyle = '#ffffff'; c.fillRect(-7, 76, 14, 34); c.strokeRect(-7, 76, 14, 34); c.restore();
  // 纱帘
  for (const side of [0, 1]) {
    const bx = side ? wx + ww + 14 : wx - 14, dir = side ? -1 : 1;
    c.fillStyle = 'rgba(255,255,255,.82)'; c.beginPath(); c.moveTo(bx, wy - 18); c.lineTo(bx + dir * 70, wy - 18);
    for (let y = 0; y <= wh + 60; y += 30) c.lineTo(bx + dir * (70 + Math.sin(t * 1.2 + y * 0.02 + side * 2) * 12 * (y / wh)), wy - 18 + y);
    c.lineTo(bx, wy + wh + 42); c.closePath(); c.fill();
  }
  // 搁板与小物
  if (!o.bare) {
    c.fillStyle = mix('#e8c79c', '#d9a56c', gold); c.fillRect(840, 250, 330, 12); c.fillStyle = 'rgba(120,80,40,.12)'; c.fillRect(840, 262, 330, 6);
    const cols = ['#8fc4f5', '#f7b3c2', '#fff1a8', '#b9e3c6', '#c9b8f2', '#8fc4f5', '#f7c9a0'];
    for (let i = 0; i < 7; i++) { const bh = 52 + rnd(i, 3) * 26; c.fillStyle = cols[i]; c.fillRect(858 + i * 22, 250 - bh, 18, bh); }
    spr(c, 'prop_catclock', 1060, 250, 3); spr(c, 'prop_hourglass', 1128, 250, 2.6);
  }
  // 地板
  const fg = c.createLinearGradient(0, 520, 0, H); fg.addColorStop(0, mix('#ecc497', '#e0a468', gold)); fg.addColorStop(1, mix('#d9a070', '#c98448', gold)); c.fillStyle = fg; c.fillRect(-W, 520, 3 * W, H);
  c.strokeStyle = 'rgba(140,90,50,.16)'; c.lineWidth = 2;
  for (let i = -8; i < 20; i++) { c.beginPath(); c.moveTo(640 + (i - 6) * 70, 520); c.lineTo(640 + (i - 6) * 190, H); c.stroke(); }
  c.fillStyle = '#fffaf0'; c.fillRect(-W, 508, 3 * W, 14);
  // 光柱
  const lg = c.createLinearGradient(wx, wy, 760, H); lg.addColorStop(0, `rgba(255,${250 - gold * 30},${225 - gold * 70},.55)`); lg.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = lg; c.beginPath(); c.moveTo(wx, wy); c.lineTo(wx + ww, wy); c.lineTo(980, H); c.lineTo(300, H); c.closePath(); c.fill();
  // 矮桌
  if (!o.bare) {
    c.fillStyle = mix('#c9925f', '#b97a44', gold); c.fillRect(905, 566, 12, 62); c.fillRect(1140, 566, 12, 62);
    c.fillStyle = mix('#e9bd8c', '#dba266', gold); rr(c, 880, 548, 300, 22, 6); c.fill();
    if (o.papers !== false) { paper(c, 960, 544, 70, 14, -0.04); paper(c, 1010, 540, 64, 12, 0.07); }
    spr(c, 'prop_bowl', 1110, 550, 3);
  }
}

export function guitar(c: C, x: number, y: number, s: number, rot: number, t: number, strum = 0, a = 1) {
  if (!(s > 0.01)) return;
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s); c.globalAlpha *= a; c.lineJoin = 'round';
  c.fillStyle = '#8a5a35'; c.fillRect(30, -8, 128, 16); c.fillStyle = '#6e4426'; rr(c, 156, -13, 36, 26, 5); c.fill();
  c.fillStyle = '#f3ead8'; for (let i = 0; i < 3; i++) { c.fillRect(162 + i * 10, -18, 5, 5); c.fillRect(162 + i * 10, 13, 5, 5); }
  c.fillStyle = '#f2b86f'; c.strokeStyle = '#b8793b'; c.lineWidth = 4;
  c.beginPath(); c.arc(-26, 0, 47, 0, TAU); c.fill(); c.stroke(); c.beginPath(); c.arc(22, 0, 35, 0, TAU); c.fill(); c.stroke();
  c.beginPath(); c.arc(-26, 0, 45, -0.9, 0.9); c.fill();
  c.fillStyle = '#ffd89c'; c.beginPath(); c.arc(-34, -10, 26, 0, TAU); c.fill();
  c.fillStyle = '#6e4426'; c.beginPath(); c.arc(10, 0, 14, 0, TAU); c.fill(); c.fillRect(-52, -13, 8, 26);
  c.strokeStyle = 'rgba(255,255,255,.9)'; c.lineWidth = 1.2;
  for (let i = 0; i < 4; i++) { const yy = -6 + i * 4, v = Math.sin(t * 70 + i * 2) * 3.2 * strum; c.beginPath(); c.moveTo(-48, yy); c.quadraticCurveTo(50, yy + v, 160, yy * 0.8); c.stroke(); }
  c.restore();
}

export function paper(c: C, x: number, y: number, w: number, h: number, rot = 0, o: { lines?: number; a?: number; color?: string; inner?: () => void } = {}) {
  c.save(); c.translate(x, y); c.rotate(rot); if (o.a != null) c.globalAlpha *= clamp(o.a);
  c.fillStyle = 'rgba(70,90,130,.14)'; c.fillRect(-w / 2 + 5, -h / 2 + 7, w, h);
  c.fillStyle = o.color ?? '#fffefa'; c.fillRect(-w / 2, -h / 2, w, h);
  if (o.lines) { c.strokeStyle = 'rgba(130,170,225,.4)'; c.lineWidth = 1.5; for (let yy = -h / 2 + o.lines; yy < h / 2 - 6; yy += o.lines) { c.beginPath(); c.moveTo(-w / 2 + 10, yy); c.lineTo(w / 2 - 10, yy); c.stroke(); } }
  o.inner?.(); c.restore();
}

/** 纸杯电话的一头 */
export function cup(c: C, x: number, y: number, s: number, rot: number, band = '#7cc0ff', line = '#2b2f45') {
  if (!(s > 0.01)) return;
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s); c.lineJoin = 'round'; c.lineWidth = 4; c.strokeStyle = line;
  c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(-15, 0); c.lineTo(15, 0); c.lineTo(24, -52); c.lineTo(-24, -52); c.closePath(); c.fill(); c.stroke();
  c.fillStyle = band; c.beginPath(); c.moveTo(-18.5, -20); c.lineTo(18.5, -20); c.lineTo(21, -34); c.lineTo(-21, -34); c.closePath(); c.fill();
  c.fillStyle = '#e9eef8'; c.beginPath(); c.ellipse(0, -52, 24, 7, 0, 0, TAU); c.fill(); c.stroke();
  c.restore();
}

export function globe(c: C, x: number, y: number, r: number, o: { sea?: string; land?: string; line?: string; rot?: number; a?: number; shade?: number } = {}) {
  c.save(); if (o.a != null) c.globalAlpha *= clamp(o.a);
  c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = o.sea ?? '#59b5f5'; c.fill(); c.save(); c.clip();
  c.fillStyle = o.land ?? '#8fd9a0'; const rot = o.rot ?? 0;
  for (let i = 0; i < 7; i++) {
    const u = (((rnd(i, 11) + rot) % 1) + 1) % 1, px = x + (u * 2.6 - 1.3) * r, py = y + (rnd(i, 12) - 0.5) * r * 1.5, rw = r * (0.22 + rnd(i, 13) * 0.3);
    c.beginPath(); c.ellipse(px, py, rw, rw * (0.5 + rnd(i, 14) * 0.4), rnd(i, 15), 0, TAU); c.fill();
    c.beginPath(); c.ellipse(px + rw * 0.7, py + rw * 0.3, rw * 0.5, rw * 0.36, 0, 0, TAU); c.fill();
  }
  const sh = c.createRadialGradient(x - r * 0.4, y - r * 0.45, r * 0.1, x, y, r * 1.05);
  sh.addColorStop(0, 'rgba(255,255,255,.4)'); sh.addColorStop(0.55, 'rgba(255,255,255,0)'); sh.addColorStop(1, `rgba(0,10,50,${o.shade ?? 0.3})`); c.fillStyle = sh; c.fillRect(x - r, y - r, 2 * r, 2 * r);
  c.restore();
  if (o.line) { c.strokeStyle = o.line; c.lineWidth = Math.max(2, r * 0.02); c.beginPath(); c.arc(x, y, r, 0, TAU); c.stroke(); }
  c.restore();
}

export function calPage(c: C, x: number, y: number, s: number, rot: number, band = '#7cc0ff', a = 1) {
  if (!(s > 0.01) || a <= 0) return;
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s); c.globalAlpha *= clamp(a);
  c.fillStyle = 'rgba(60,80,120,.14)'; rr(c, -31, -37, 70, 84, 6); c.fill();
  c.fillStyle = '#ffffff'; rr(c, -35, -42, 70, 84, 6); c.fill(); c.fillStyle = band; rr(c, -35, -42, 70, 24, 6); c.fill(); c.fillRect(-35, -28, 70, 10);
  c.fillStyle = '#ffffff'; c.beginPath(); c.arc(-16, -32, 4, 0, TAU); c.arc(16, -32, 4, 0, TAU); c.fill();
  c.fillStyle = rgba('#7c8cab', 0.45); c.fillRect(-20, -4, 40, 5); c.fillRect(-20, 10, 28, 5); c.fillRect(-20, 24, 34, 5);
  c.restore();
}

/** 评论框：叉、省略号、禁止、爱心、音符 */
export function box(c: C, x: number, y: number, w: number, h: number, color: string, kind: 'x' | 'dots' | 'ban' | 'heart' | 'note' | 'none', a = 1, sc = 1, rot = 0) {
  if (a <= 0 || sc <= 0.01) return;
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(sc, sc); c.globalAlpha *= clamp(a);
  c.fillStyle = color; rr(c, -w / 2, -h / 2, w, h, 12); c.fill(); c.beginPath(); c.moveTo(-w * 0.2, h / 2 - 1); c.lineTo(-w * 0.32, h / 2 + 16); c.lineTo(-w * 0.02, h / 2 - 1); c.fill();
  c.strokeStyle = '#ffffff'; c.fillStyle = '#ffffff'; c.lineWidth = Math.max(4, h * 0.11); c.lineCap = 'round'; const k = h * 0.24;
  if (kind === 'x') { c.beginPath(); c.moveTo(-k, -k); c.lineTo(k, k); c.moveTo(k, -k); c.lineTo(-k, k); c.stroke(); }
  else if (kind === 'dots') { for (let i = -1; i <= 1; i++) { c.beginPath(); c.arc(i * k * 1.3, 0, k * 0.34, 0, TAU); c.fill(); } }
  else if (kind === 'ban') { c.beginPath(); c.arc(0, 0, k * 1.15, 0, TAU); c.moveTo(-k * 0.8, k * 0.8); c.lineTo(k * 0.8, -k * 0.8); c.stroke(); }
  else if (kind === 'heart') heart(c, 0, 0, k * 2.2, '#ffffff');
  else if (kind === 'note') note(c, -k * 0.3, k * 0.7, k / 14, '#ffffff', 1, 1);
  c.restore();
}

/** 邮票齿边的记忆卡片；inner 在卡片内部坐标（左上为原点）里画 */
export function card(c: C, x: number, y: number, w: number, h: number, rot: number, inner: (w: number, h: number) => void, o: { a?: number; pixel?: boolean; edge?: string } = {}) {
  if ((o.a != null && o.a <= 0) || w < 30) return;
  c.save(); c.translate(x, y); c.rotate(rot); if (o.a != null) c.globalAlpha *= clamp(o.a);
  c.fillStyle = 'rgba(50,80,130,.16)'; c.fillRect(-w / 2 + 8, -h / 2 + 10, w, h);
  c.fillStyle = o.edge ?? '#ffffff'; c.fillRect(-w / 2, -h / 2, w, h);
  if (o.pixel) { c.fillStyle = '#9fd2ff'; for (let i = 0; i < 40; i++) { const u = i / 40; c.fillRect(-w / 2 + u * w, -h / 2 - (i % 2 ? 6 : 0), w / 40 + 0.5, 6); c.fillRect(-w / 2 + u * w, h / 2 - (i % 2 ? 0 : 6), w / 40 + 0.5, 6); } }
  else { c.beginPath(); const n = Math.round(w / 18), m = Math.round(h / 18); for (let i = 0; i <= n; i++) { const px = -w / 2 + (i / n) * w; c.moveTo(px + 6, -h / 2); c.arc(px, -h / 2, 6, 0, TAU); c.moveTo(px + 6, h / 2); c.arc(px, h / 2, 6, 0, TAU); } for (let i = 0; i <= m; i++) { const py = -h / 2 + (i / m) * h; c.moveTo(-w / 2 + 6, py); c.arc(-w / 2, py, 6, 0, TAU); c.moveTo(w / 2 + 6, py); c.arc(w / 2, py, 6, 0, TAU); } c.fill(); }
  const m = 12; c.beginPath(); c.rect(-w / 2 + m, -h / 2 + m, w - 2 * m, h - 2 * m); c.clip(); c.translate(-w / 2 + m, -h / 2 + m);
  inner(w - 2 * m, h - 2 * m); c.restore();
}

export function wings(c: C, x: number, y: number, s: number, flap: number, color = '#ffffff', line = '#9cc6f2') {
  if (!(s > 0.01)) return;
  for (const d of [-1, 1]) {
    c.save(); c.translate(x, y); c.scale(d * s, s); c.rotate(-0.3 - flap * 0.5); c.fillStyle = color; c.strokeStyle = line; c.lineWidth = 2;
    for (let i = 0; i < 3; i++) { c.beginPath(); c.ellipse(26 + i * 4, -4 + i * 10, 26 - i * 5, 8, -0.35 + i * 0.25, 0, TAU); c.fill(); c.stroke(); }
    c.restore();
  }
}

export function sprout(c: C, x: number, y: number, g: number, col = '#7fcf8a', petal = '#ffd0dc') {
  if (g <= 0) return; const h = 34 * clamp(g);
  c.save(); c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 4, y - h * 0.5, x, y - h); c.stroke();
  c.beginPath(); c.ellipse(x - 7, y - h * 0.55, 8 * clamp(g), 4, -0.5, 0, TAU); c.ellipse(x + 8, y - h * 0.7, 8 * clamp(g), 4, 0.5, 0, TAU); c.fill();
  if (g > 0.7) { const k = clamp((g - 0.7) / 0.3); c.fillStyle = petal; for (let i = 0; i < 5; i++) { c.beginPath(); c.arc(x + Math.cos((i * TAU) / 5) * 7 * k, y - h - 4 + Math.sin((i * TAU) / 5) * 7 * k, 5.5 * k, 0, TAU); c.fill(); } c.fillStyle = '#fff3a0'; c.beginPath(); c.arc(x, y - h - 4, 4 * k, 0, TAU); c.fill(); }
  c.restore();
}

/** 本子内页：引号里的那几句都画在纸上 */
export function page(c: C, t: number) {
  bg(c, ['#fffef8', '#fdf6e6']);
  c.strokeStyle = 'rgba(120,165,225,.32)'; c.lineWidth = 2; for (let y = 86; y < H; y += 52) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
  c.strokeStyle = 'rgba(240,130,140,.4)'; c.beginPath(); c.moveTo(118, 0); c.lineTo(118, H); c.stroke();
  c.fillStyle = 'rgba(160,170,190,.5)'; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(54, 80 + i * 112, 12, 0, TAU); c.fill(); }
  glow(c, W - 80, 40 + Math.sin(t) * 10, 520, '#ffffff', 0.85);
}

/** 灯串 */
export function bulbs(c: C, t: number, y: number, n: number, on: (i: number) => number) {
  c.strokeStyle = 'rgba(40,30,70,.7)'; c.lineWidth = 3; c.beginPath();
  for (let i = 0; i <= n; i++) { const x = (i / n) * W, yy = y + Math.sin((i / n) * Math.PI * 3) * 14 + 26 * Math.sin((i / n) * Math.PI); if (i) c.lineTo(x, yy); else c.moveTo(x, yy); } c.stroke();
  for (let i = 1; i < n; i++) {
    const x = (i / n) * W, yy = y + Math.sin((i / n) * Math.PI * 3) * 14 + 26 * Math.sin((i / n) * Math.PI) + 14 + Math.sin(t * 2 + i) * 1.5, k = clamp(on(i));
    const col = ['#ffd98a', '#ffb3c7', '#a9dcff', '#d4c2ff'][i % 4];
    if (k > 0.02) glow(c, x, yy, 90, col, 0.55 * k, 'lighter');
    c.fillStyle = k > 0.3 ? col : '#4b4470'; c.beginPath(); c.arc(x, yy, 9, 0, TAU); c.fill();
    if (k > 0.3) { c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.arc(x - 2, yy - 2, 3.5, 0, TAU); c.fill(); }
  }
}

/** 铅笔画的课桌 */
export function desk(c: C, x: number, y: number, s: number, color: string) {
  c.save(); c.translate(x, y); c.scale(s, s); c.strokeStyle = color; c.lineWidth = 3; c.lineCap = 'round'; c.lineJoin = 'round';
  c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.moveTo(-44, -30); c.lineTo(44, -30); c.lineTo(50, -18); c.lineTo(-50, -18); c.closePath(); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(-42, -18); c.lineTo(-42, 8); c.moveTo(42, -18); c.lineTo(42, 8); c.stroke(); c.restore();
}

/** 手写的一行字，逐字写出 */
export function handwrite(c: C, s: string, x: number, y: number, size: number, color: string, p: number, font: string, o: { rot?: number; a?: number } = {}) {
  const n = s.length, gap = size * 1.08, x0 = x - ((n - 1) * gap) / 2;
  for (let i = 0; i < n; i++) { const k = clamp(p * n - i); if (k <= 0) break; txt(c, s[i], x0 + i * gap + (rnd(i, 4) - 0.5) * 3, y + (rnd(i, 5) - 0.5) * 5 - (1 - k) * 6, size, color, { font, w: 600, a: k * (o.a ?? 1), rot: (rnd(i, 6) - 0.5) * 0.08 + (o.rot ?? 0) }); }
}

/** 网点流行色底（参考片的画风手法之一） */
export function pop(c: C, t: number, base: string, dot: string, da = 0.9) { c.fillStyle = base; c.fillRect(-W, -H, 3 * W, 3 * H); dots(c, dot, da, 26, 6.5, t * 10, t * 6); }
