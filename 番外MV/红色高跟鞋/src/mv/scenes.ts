// 五个剪纸场景：夜街 / 卧室 / 天桥 / 鞋盒 / 栈桥。
// 人物是分支图集里的像素小人，场景全部用纸片叠出纵深（远景城市走慢速视差）。
import { CREAM, FONT, H, W, beatPulse, box, clamp, cut, glow, hash, heart, heels, lerp, poly, rr, seg, type Ctx } from './core';
import { actor, frameKey, sprite, type Act, type Atlas } from './sprites';

export interface Cam {
  x: number;
  y: number;
  z: number;
}

export const GROUND = 780;
const mod = (a: number, n: number) => ((a % n) + n) % n;

function camOn(ctx: Ctx, c: Cam, par = 1) {
  ctx.translate(W / 2, H / 2);
  ctx.scale(c.z, c.z);
  ctx.translate(-c.x * par, -c.y);
}

function sky(ctx: Ctx, stops: [number, string][]) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  for (const [p, c] of stops) g.addColorStop(p, c);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function stars(ctx: Ctx, t: number, n: number, seed: number) {
  ctx.fillStyle = CREAM;
  for (let i = 0; i < n; i++) {
    const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * 1.4 + i * 2.1));
    ctx.globalAlpha = 0.55 * tw;
    ctx.fillRect(hash(seed + i) * W, hash(seed + i * 2.3) * H * 0.62, 3.5, 3.5);
  }
  ctx.globalAlpha = 1;
}

const PAL = ['#d97a8e', '#e7b85a', '#6f9bc6', '#e7b85a', '#c9a0d6'];

function skyline(ctx: Ctx, seed: number, x0: number, x1: number, base: number, color: string, minH: number, maxH: number) {
  let x = x0, i = 0;
  while (x < x1) {
    const w = 110 + hash(seed + i) * 120;
    const h = lerp(minH, maxH, hash(seed + i * 1.7 + 3));
    ctx.fillStyle = color;
    ctx.fillRect(x, base - h, w, h + 500);
    const cols = Math.floor((w - 12) / 34), rows = Math.floor(h / 40);
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        const v = hash(seed + i * 31 + r * 7 + c * 13);
        if (v < 0.4) {
          ctx.fillStyle = PAL[Math.floor(v * 100) % PAL.length];
          ctx.fillRect(x + 12 + c * 34, base - h + 14 + r * 40, 18, 18);
        }
      }
    x += w + 6;
    i++;
  }
}

interface B {
  x: number;
  w: number;
  top: number;
  color: string;
  roof?: string;
  cols: number;
  rows: number;
  seed: number;
  lit?: number;
  awn?: [string, string];
}

function building(ctx: Ctx, b: B) {
  const g = GROUND;
  if (b.roof) cut(ctx, b.roof, () => poly(ctx, [b.x - 14, b.top, b.x + b.w / 2, b.top - 90, b.x + b.w + 14, b.top]), 4);
  box(ctx, b.x, b.top, b.w, g - b.top, b.color, 4);
  const mx = 28, gap = 18;
  const ww = (b.w - mx * 2 - (b.cols - 1) * gap) / b.cols;
  const floorH = b.awn ? g - b.top - 160 : g - b.top - 50;
  const rowH = floorH / b.rows;
  const wh = Math.min(58, rowH - 22);
  for (let r = 0; r < b.rows; r++)
    for (let c = 0; c < b.cols; c++) {
      const lit = hash(b.seed + r * 5.1 + c * 9.7) < (b.lit ?? 0.65);
      const x = b.x + mx + c * (ww + gap), y = b.top + 26 + r * rowH;
      ctx.fillStyle = lit ? '#f3cd72' : '#2a3160';
      ctx.fillRect(x, y, ww, wh);
      ctx.fillStyle = 'rgba(30,25,60,.4)';
      ctx.fillRect(x + ww / 2 - 1.5, y, 3, wh);
      ctx.fillStyle = CREAM;
      ctx.fillRect(x - 3, y + wh, ww + 6, 4);
    }
  if (b.awn) {
    const ay = g - 140;
    box(ctx, b.x + 18, ay + 46, b.w - 36, 94, '#f2e3b3', 3);
    const n = Math.max(4, Math.round((b.w + 16) / 30));
    const sw = (b.w + 16) / n;
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = i % 2 ? b.awn[0] : b.awn[1];
      ctx.fillRect(b.x - 8 + i * sw, ay, sw + 0.5, 36);
    }
    ctx.lineWidth = 3;
    ctx.strokeStyle = CREAM;
    ctx.strokeRect(b.x - 8, ay, b.w + 16, 36);
  }
}

function lamp(ctx: Ctx, x: number, t: number, ground = GROUND, h = 430) {
  const top = ground - h;
  const g = ctx.createLinearGradient(0, top, 0, ground + 40);
  g.addColorStop(0, 'rgba(255,236,170,.36)');
  g.addColorStop(1, 'rgba(255,236,170,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  poly(ctx, [x - 16, top + 18, x + 16, top + 18, x + 135, ground + 40, x - 135, ground + 40]);
  ctx.fill();
  box(ctx, x - 5, top + 18, 10, h - 18, '#1b1e40', 2.5);
  cut(ctx, '#1b1e40', () => poly(ctx, [x - 26, top + 18, x + 26, top + 18, x + 16, top - 8, x - 16, top - 8]), 2.5);
  ctx.fillStyle = '#ffe9a8';
  ctx.fillRect(x - 14, top + 18, 28, 8);
  glow(ctx, x, top + 22, 95, 'rgba(255,233,160,.9)', 0.48 + 0.16 * beatPulse(t));
}

// ───────── 天气 ─────────

export function snow(ctx: Ctx, t: number, k: number, windK = 0) {
  if (k <= 0) return;
  ctx.fillStyle = CREAM;
  for (let i = 0; i < 90; i++) {
    const sp = 40 + hash(i) * 70;
    const x = mod(hash(i * 3.1) * W + t * (18 + windK * 900) + Math.sin(t + i) * 20, W);
    const y = mod(hash(i * 7.7) * H + t * sp, H);
    ctx.globalAlpha = 0.75 * k;
    ctx.beginPath();
    ctx.arc(x, y, 2 + hash(i * 1.3) * 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function rain(ctx: Ctx, t: number, k: number) {
  if (k <= 0) return;
  ctx.strokeStyle = `rgba(200,214,255,${0.5 * k})`;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (let i = 0; i < 140; i++) {
    const x = mod(hash(i * 2.3) * 2300 - t * 260, 2300) - 200;
    const y = mod(hash(i * 5.9) * H + t * (900 + hash(i) * 500), H + 80) - 40;
    ctx.moveTo(x, y);
    ctx.lineTo(x - 10, y + 38);
  }
  ctx.stroke();
}

export function windWash(ctx: Ctx, t: number, k: number) {
  if (k <= 0) return;
  ctx.fillStyle = `rgba(236,232,242,${0.42 * k})`;
  ctx.fillRect(0, 0, W, H);
  ctx.lineCap = 'round';
  for (let i = 0; i < 9; i++) {
    const y = 130 + i * 105 + Math.sin(t * 3 + i) * 30;
    const x = mod(t * 2600 + i * 700, 3300) - 800;
    ctx.strokeStyle = `rgba(255,255,255,${0.6 * k})`;
    ctx.lineWidth = 8 + hash(i) * 14;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + 200, y - 55, x + 420, y + 55, x + 660, y - 10);
    ctx.stroke();
  }
}

const PETAL = ['#f58aa8', '#e8405a', '#fbd0dc', '#fff3ea', '#e8405a'];
export function petals(ctx: Ctx, t: number, t0: number, n = 80) {
  const a = t - t0;
  if (a < 0 || a > 1.6) return;
  const fade = 1 - seg(a, 1.0, 1.6);
  for (let i = 0; i < n; i++) {
    const ang = hash(i * 1.9) * Math.PI * 2;
    const v = 500 + hash(i * 4.1) * 1500;
    const x = W / 2 + Math.cos(ang) * v * a;
    const y = H * 0.62 + Math.sin(ang) * v * a * 0.7 - 320 * a + 520 * a * a;
    const sz = 14 + hash(i * 2.7) * 22;
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.translate(x, y);
    ctx.rotate(a * 7 * (hash(i) - 0.5) + i);
    ctx.fillStyle = PETAL[i % PETAL.length];
    ctx.beginPath();
    ctx.ellipse(0, 0, sz, sz * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export interface Floaty {
  x: number;
  y: number;
  t0: number;
}
function floatHearts(ctx: Ctx, t: number, list: Floaty[] | undefined) {
  if (!list) return;
  for (let i = 0; i < list.length; i++) {
    const a = t - list[i].t0;
    if (a < 0 || a > 1.3) continue;
    const pop = clamp(a * 8);
    heart(ctx, list[i].x + Math.sin(a * 5 + i) * 12, list[i].y - a * 95, 2.3 * pop, i % 2 ? '#f58aa8' : '#e8405a', 1 - seg(a, 0.8, 1.3));
  }
}

// ───────── 夜街 ─────────

const SHOP = { x: 1380, w: 800, top: 300 };

function shop(ctx: Ctx, A: Atlas, t: number, inside: Act | null | undefined, pulse: number) {
  const { x, w, top } = SHOP;
  box(ctx, x, top, w, GROUND - top, '#45213b', 5);
  for (let i = 0; i < 3; i++) {
    box(ctx, x + 70 + i * 240, top + 30, 180, 96, '#f0c868', 3);
    ctx.fillStyle = 'rgba(69,33,59,.55)';
    ctx.fillRect(x + 70 + i * 240 + 88, top + 30, 4, 96);
  }
  box(ctx, x + 245, top + 146, 310, 54, '#1d2145', 3);
  ctx.font = `36px ${FONT}, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = CREAM;
  'SHOES'.split('').forEach((c, i) => ctx.fillText(c, x + 400 + (i - 2) * 50, top + 175));
  // 雨棚
  const ay = top + 215, n = 16, sw = (w + 48) / n;
  cut(ctx, '#d62a3c', () => {
    ctx.moveTo(x - 24, ay);
    ctx.lineTo(x + w + 24, ay);
    ctx.lineTo(x + w + 24, ay + 40);
    for (let i = n - 1; i >= 0; i--) ctx.arc(x - 24 + sw * (i + 0.5), ay + 40, sw / 2, 0, Math.PI, false);
    ctx.closePath();
  }, 4);
  box(ctx, x - 30, ay - 10, w + 60, 12, '#fbf7ee', 0, 6);
  // 橱窗
  const dx = x + 70, dy = top + 290, dw = 470, dh = 172;
  box(ctx, dx, dy, dw, dh, '#f3e4b4', 5);
  ctx.save();
  ctx.beginPath();
  ctx.rect(dx, dy, dw, dh);
  ctx.clip();
  ctx.fillStyle = '#d9c08a';
  ctx.fillRect(dx + 215, dy + 52, 255, 6);
  const sc = ['#7fa6c9', '#e2b04a', '#a48ac4', '#7fb59a'];
  for (let i = 0; i < 4; i++) {
    ctx.fillStyle = sc[i];
    ctx.beginPath();
    rr(ctx, dx + 228 + i * 60, dy + 30, 42, 22, 9);
    ctx.fill();
  }
  if (inside) actor(ctx, A, inside);
  ctx.fillStyle = '#a0603f';
  ctx.fillRect(dx + 215, dy + 126, 260, 60);
  ctx.fillStyle = '#c58a62';
  ctx.fillRect(dx + 215, dy + 126, 260, 8);
  ctx.fillStyle = '#7a2d44';
  ctx.fillRect(dx + 36, dy + 138, 160, 40);
  glow(ctx, dx + 116, dy + 112, 95 + 70 * pulse, 'rgba(255,224,150,.95)', 0.32 + 0.55 * pulse);
  heels(ctx, dx + 116, dy + 138, 0.95 * (1 + 0.3 * pulse));
  ctx.restore();
  ctx.fillStyle = CREAM;
  ctx.fillRect(dx + 203, dy, 5, dh);
  if (pulse > 0.06)
    for (let i = 0; i < 4; i++) {
      const ang = i * 1.57 + t * 2;
      sprite(ctx, A, `fx_sparkle_${i % 3}`, dx + 116 + Math.cos(ang) * 105, dy + 112 + Math.sin(ang) * 62, 3.4, false, 0, pulse);
    }
  // 门
  box(ctx, x + 590, top + 275, 150, GROUND - top - 275, '#f0dfae', 5);
  box(ctx, x + 612, top + 300, 106, 120, '#fbf1cf', 0);
  ctx.fillStyle = '#b98b5e';
  ctx.beginPath();
  ctx.arc(x + 716, top + 470, 7, 0, Math.PI * 2);
  ctx.fill();
}

function house(ctx: Ctx) {
  const x = 180, w = 600, top = 220;
  box(ctx, x, top, w, GROUND - top, '#b5654e', 5);
  ctx.fillStyle = 'rgba(120,56,44,.35)';
  for (let r = 0; r < 12; r++) ctx.fillRect(x, top + 30 + r * 46, w, 3);
  box(ctx, x - 16, top - 14, w + 32, 22, '#f8f3e6', 0, 6);
  const win = (wx: number, wy: number, lit: boolean) => {
    box(ctx, wx, wy, 110, 120, lit ? '#f3cd72' : '#2a3160', 4);
    ctx.fillStyle = CREAM;
    ctx.fillRect(wx + 52, wy, 6, 120);
    ctx.fillRect(wx, wy + 57, 110, 6);
  };
  win(x + 40, top + 50, false);
  win(x + 450, top + 50, false);
  win(x + 40, top + 250, false);
  win(x + 450, top + 250, true);
  // 主角的窗：粉窗帘、暖灯、窗台花
  const fx = 400, fy = 400, fw = 200, fh = 160;
  box(ctx, fx - 14, fy - 14, fw + 28, fh + 28, '#fbf7ee', 0, 4);
  ctx.fillStyle = '#f6d37a';
  ctx.fillRect(fx, fy, fw, fh);
  ctx.fillStyle = '#ef9db6';
  ctx.fillRect(fx, fy, 78, fh);
  ctx.fillRect(fx + fw - 78, fy, 78, fh);
  ctx.fillStyle = '#fbf7ee';
  ctx.fillRect(fx + fw / 2 - 4, fy, 8, fh);
  ctx.fillRect(fx, fy + fh / 2 - 4, fw, 8);
  box(ctx, fx - 26, fy + fh + 14, fw + 52, 22, '#fbf7ee', 0, 5);
  const dots = ['#e8789a', '#fbf7ee', '#e7b85a', '#e8789a', '#fbf7ee', '#e7b85a'];
  dots.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(fx - 6 + i * 42, fy + fh + 12, 13, 0, Math.PI * 2);
    ctx.fill();
  });
  // 门
  box(ctx, 440, 640, 110, GROUND - 640, '#6b4334', 4);
  ctx.fillStyle = '#f3cd72';
  ctx.fillRect(566, 660, 22, 30);
}

function trafficLight(ctx: Ctx, x: number, dir: 1 | -1, arrow: boolean, green: boolean, t: number) {
  box(ctx, x - 5, 470, 10, GROUND - 470, '#1b1e40', 2.5);
  box(ctx, x - 26, 360, 52, 118, '#14163a', 3, 10);
  const blink = 0.75 + 0.25 * Math.sin(t * 18);
  ctx.fillStyle = green ? '#5a2030' : '#ff4a55';
  ctx.beginPath();
  ctx.arc(x, 390, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = green ? '#52e08a' : '#1f4a36';
  ctx.beginPath();
  ctx.arc(x, 446, 17, 0, Math.PI * 2);
  ctx.fill();
  glow(ctx, x, green ? 446 : 390, 60, green ? 'rgba(90,240,150,.9)' : 'rgba(255,90,100,.9)', 0.5 * blink);
  // 箭头牌
  ctx.save();
  ctx.translate(x + dir * 70, 420);
  ctx.scale(dir, 1);
  ctx.globalAlpha = arrow ? 1 : 0.35;
  cut(ctx, arrow ? '#fff7e2' : '#8f8cb0', () => poly(ctx, [-30, -11, 6, -11, 6, -26, 34, 0, 6, 26, 6, 11, -30, 11]), 0);
  ctx.restore();
  if (arrow) glow(ctx, x + dir * 70, 420, 55, 'rgba(255,244,200,.9)', 0.35 * blink);
}

function bus(ctx: Ctx, bx: number) {
  const w = 680, h = 300, x = bx - w / 2, y = 690;
  ctx.fillStyle = 'rgba(8,6,24,.35)';
  ctx.beginPath();
  ctx.ellipse(bx, y + h + 34, w * 0.52, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  box(ctx, x, y, w, h, '#f2c14e', 5, 30);
  ctx.fillStyle = '#d9a236';
  ctx.fillRect(x + 4, y + 190, w - 8, 60);
  for (let i = 0; i < 5; i++) box(ctx, x + 40 + i * 104, y + 40, 84, 110, '#fdf3cf', 0, 10);
  box(ctx, x + w - 112, y + 40, 80, 220, '#2a3160', 0, 10);
  box(ctx, x + 36, y + 6, 190, 28, '#1d2145', 0, 6);
  ctx.font = `24px ${FONT}, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = CREAM;
  ctx.fillText('夜班 22', x + 131, y + 21);
  for (const wx of [x + 130, x + w - 150]) {
    cut(ctx, '#1b1e40', () => ctx.arc(wx, y + h + 6, 42, 0, Math.PI * 2), 4);
    ctx.fillStyle = '#c9c4d6';
    ctx.beginPath();
    ctx.arc(wx, y + h + 6, 15, 0, Math.PI * 2);
    ctx.fill();
  }
  glow(ctx, x + w + 10, y + 220, 120, 'rgba(255,240,190,.9)', 0.55);
}

export interface StreetO {
  actors: Act[];
  inShop?: Act | null;
  wind?: number;
  rain?: number;
  dark?: number;
  snow?: number;
  pulse?: number;
  sig?: [boolean, boolean, boolean, boolean]; // 左箭头 / 左灯绿 / 右箭头 / 右灯绿
  busX?: number | null;
  ribbon?: { p: number; x: number; y: number } | null;
  hearts?: Floaty[];
}

export function street(ctx: Ctx, A: Atlas, t: number, cam: Cam, o: StreetO) {
  sky(ctx, [[0, '#1e2046'], [1, '#2c2f60']]);
  stars(ctx, t, 40, 5);
  ctx.save();
  camOn(ctx, cam, 0.35);
  skyline(ctx, 11, -1100, 3200, 700, '#2a2e5c', 160, 430);
  ctx.restore();

  ctx.save();
  camOn(ctx, cam);
  building(ctx, { x: -420, w: 520, top: 330, color: '#3b4270', cols: 5, rows: 3, seed: 3, awn: ['#d9768a', '#f8f3e6'] });
  house(ctx);
  building(ctx, { x: 830, w: 200, top: 430, color: '#4d5a86', roof: '#5a3340', cols: 3, rows: 2, seed: 9, lit: 0.8, awn: ['#6fae8a', '#f8f3e6'] });
  shop(ctx, A, t, o.inShop, o.pulse || 0);
  building(ctx, { x: 2500, w: 330, top: 300, color: '#3b4270', cols: 4, rows: 4, seed: 21, awn: ['#6f9bc6', '#f8f3e6'] });
  building(ctx, { x: 2850, w: 340, top: 250, color: '#4a4f80', roof: '#5a3340', cols: 4, rows: 4, seed: 33, lit: 0.8, awn: ['#d9768a', '#f8f3e6'] });
  building(ctx, { x: 3210, w: 350, top: 330, color: '#3f4a7c', cols: 4, rows: 3, seed: 41, awn: ['#6fae8a', '#f8f3e6'] });
  building(ctx, { x: 3600, w: 300, top: 280, color: '#34406e', cols: 3, rows: 4, seed: 55 });
  building(ctx, { x: 3930, w: 420, top: 350, color: '#3b4270', roof: '#5a3340', cols: 5, rows: 3, seed: 61, awn: ['#e7b85a', '#f8f3e6'] });
  // 树、邮筒、长椅
  box(ctx, 2282, 640, 16, 140, '#5c4638', 3);
  cut(ctx, '#3f7a5c', () => ctx.arc(2290, 590, 78, 0, Math.PI * 2), 4);
  ctx.fillStyle = '#fbf7ee';
  for (let i = 0; i < 9; i++) ctx.fillRect(2240 + hash(i) * 100, 540 + hash(i * 3) * 90, 6, 6);
  box(ctx, 2372, 690, 44, 90, '#d62a3c', 4, 8);
  ctx.fillStyle = '#1d2145';
  ctx.fillRect(2380, 712, 28, 6);
  box(ctx, 1180, 738, 150, 12, '#8a6a55', 3);
  box(ctx, 1192, 750, 8, 30, '#5c4638', 0);
  box(ctx, 1310, 750, 8, 30, '#5c4638', 0);
  box(ctx, 1176, 730, 158, 8, '#fbf7ee', 0, 4);
  // 地面
  ctx.fillStyle = '#b4b0c4';
  ctx.fillRect(-3000, GROUND - 4, 10000, 14);
  ctx.fillStyle = '#8985a2';
  ctx.fillRect(-3000, GROUND + 10, 10000, 44);
  ctx.fillStyle = '#34375a';
  ctx.fillRect(-3000, GROUND + 54, 10000, 900);
  ctx.fillStyle = '#77779a';
  for (let x = -3000; x < 7000; x += 150) ctx.fillRect(x, GROUND + 196, 84, 8);
  ctx.fillStyle = '#e9e4d6';
  for (let i = 0; i < 7; i++) ctx.fillRect(2630 + i * 44, GROUND + 58, 26, 600);
  for (const lx of [1110, 2470, 3300, 4050]) lamp(ctx, lx, t);
  const sig = o.sig || [false, false, false, false];
  trafficLight(ctx, 2590, 1, sig[0], sig[1], t);
  trafficLight(ctx, 2960, -1, sig[2], sig[3], t);

  // 香水丝带
  if (o.ribbon && o.ribbon.p > 0) {
    const { p, x: x0, y: y0 } = o.ribbon;
    const X1 = 1566, Y1 = 690, N = 44;
    const pt = (u: number): [number, number] => [lerp(x0, X1, u), lerp(y0, Y1, u) + Math.sin(u * Math.PI * 3 - t * 2.4) * 46 * Math.sin(u * Math.PI)];
    const path = () => {
      ctx.beginPath();
      for (let i = 0; i <= N; i++) {
        const [px, py] = pt((i / N) * p);
        if (i) ctx.lineTo(px, py);
        else ctx.moveTo(px, py);
      }
    };
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const [lw, col] of [[24, CREAM], [16, '#f3a0bb'], [5, '#ffd9e4']] as [number, string][]) {
      path();
      ctx.lineWidth = lw;
      ctx.strokeStyle = col;
      ctx.stroke();
    }
    for (let i = 1; i < 7; i++) {
      const u = i / 7;
      if (u > p) break;
      const [px, py] = pt(u);
      heart(ctx, px, py - 34 - Math.sin(t * 4 + i) * 6, 1.6, i % 2 ? '#e8405a' : '#f58aa8');
    }
  }

  const list = [...o.actors].sort((a, b) => a.y - b.y);
  for (const a of list) actor(ctx, A, a);
  floatHearts(ctx, t, o.hearts);
  if (o.busX != null) bus(ctx, o.busX);
  ctx.restore();

  snow(ctx, t, o.snow ?? 1, o.wind || 0);
  if (o.dark) {
    ctx.fillStyle = `rgba(14,12,40,${o.dark})`;
    ctx.fillRect(0, 0, W, H);
  }
  rain(ctx, t, o.rain || 0);
  windWash(ctx, t, o.wind || 0);
}

// ───────── 卧室 ─────────

export function room(ctx: Ctx, A: Atlas, t: number, o: { act: string; at: number; outX: number; zoom: number; hearts?: Floaty[] }) {
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.scale(o.zoom, o.zoom);
  ctx.translate(-W / 2, -H / 2);
  ctx.fillStyle = '#ebe0cc';
  ctx.fillRect(-200, -200, W + 400, H + 400);
  ctx.fillStyle = '#e3d6bf';
  for (let x = -200; x < W + 200; x += 64) ctx.fillRect(x, -200, 30, H + 400);

  const wx = 1060, wy = 150, ww = 760, wh = 540;
  ctx.fillStyle = 'rgba(60,40,30,.18)';
  ctx.fillRect(wx - 12, wy - 8, ww + 40, wh + 44);
  ctx.fillStyle = '#fbf7ee';
  ctx.fillRect(wx - 22, wy - 22, ww + 44, wh + 44);
  ctx.save();
  ctx.beginPath();
  ctx.rect(wx, wy, ww, wh);
  ctx.clip();
  ctx.fillStyle = '#262a55';
  ctx.fillRect(wx, wy, ww, wh);
  for (let i = 0; i < 26; i++) {
    ctx.fillStyle = PAL[i % PAL.length];
    ctx.globalAlpha = 0.5;
    ctx.fillRect(wx + hash(i * 1.3) * ww, wy + 20 + hash(i * 4.1) * 120, 14, 14);
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#8985a2';
  ctx.fillRect(wx, wy + 430, ww, 22);
  ctx.fillStyle = '#34375a';
  ctx.fillRect(wx, wy + 452, ww, 100);
  // 街对面的鞋店
  const sx = wx + 150, sy = wy + 150;
  box(ctx, sx, sy, 430, 280, '#45213b', 3);
  for (let i = 0; i < 3; i++) box(ctx, sx + 36 + i * 130, sy + 18, 96, 50, '#f0c868', 2);
  box(ctx, sx - 14, sy + 92, 458, 34, '#d62a3c', 3);
  box(ctx, sx + 36, sy + 150, 250, 104, '#f3e4b4', 3);
  glow(ctx, sx + 110, sy + 228, 60, 'rgba(255,224,150,.95)', 0.5 + 0.2 * beatPulse(t));
  heels(ctx, sx + 110, sy + 250, 0.5);
  box(ctx, sx + 320, sy + 146, 80, 134, '#f0dfae', 3);
  ctx.fillStyle = '#14163a';
  ctx.fillRect(wx + 70, wy + 190, 7, 240);
  glow(ctx, wx + 73, wy + 190, 80, 'rgba(255,233,160,.9)', 0.6);
  actor(ctx, A, { who: 'claude', act: 'walk', at: t, x: wx + o.outX, y: wy + 446, s: 1.2 });
  ctx.fillStyle = CREAM;
  for (let i = 0; i < 46; i++) {
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(wx + mod(hash(i * 3.3) * ww + Math.sin(t + i) * 14, ww), wy + mod(hash(i * 6.1) * wh + t * (36 + hash(i) * 40), wh), 2 + hash(i) * 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
  ctx.fillStyle = '#fbf7ee';
  ctx.fillRect(wx + ww / 2 - 7, wy, 14, wh);
  ctx.fillRect(wx, wy + wh / 2 - 7, ww, 14);
  box(ctx, wx - 44, wy + wh + 20, ww + 88, 26, '#fbf7ee', 0, 6);
  // 窗帘
  ctx.fillStyle = '#8a6a55';
  ctx.fillRect(wx - 170, wy - 60, ww + 340, 10);
  const curtain = (cx0: number, cx1: number) => {
    cut(ctx, '#ef9db6', () => poly(ctx, [cx0, wy - 52, cx1, wy - 52, cx1 - 14, wy + wh + 70, cx0 + 12, wy + wh + 70]), 4);
    ctx.fillStyle = 'rgba(200,90,130,.3)';
    for (let i = 1; i < 4; i++) ctx.fillRect(cx0 + ((cx1 - cx0) * i) / 4, wy - 50, 5, wh + 116);
  };
  curtain(wx - 150, wx + 26);
  curtain(wx + ww - 26, wx + ww + 150);

  // 本鲸窝在被子里
  const px = 600, py = 940;
  sprite(ctx, A, frameKey('whale', o.act, o.at), px, py, 5.4, false, 1.2);
  const br = Math.sin(t * 2) * 4 + 36;
  cut(ctx, '#f6b3c6', () => {
    ctx.moveTo(px - 262, 1100);
    ctx.lineTo(px - 228, 770 + br);
    ctx.quadraticCurveTo(px - 210, 706 + br, px - 96, 716 + br);
    ctx.quadraticCurveTo(px, 790 + br, px + 96, 716 + br);
    ctx.quadraticCurveTo(px + 210, 706 + br, px + 228, 770 + br);
    ctx.lineTo(px + 262, 1100);
    ctx.closePath();
  }, 6);
  ctx.setLineDash([14, 10]);
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#fff4ea';
  for (const yy of [800, 868]) {
    ctx.beginPath();
    ctx.moveTo(px - 222, yy + br);
    ctx.quadraticCurveTo(px, yy + 36 + br, px + 222, yy + br);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  for (let i = 0; i < 6; i++) heart(ctx, px - 170 + i * 68, 838 + (i % 2) * 22 + br, 1.25, '#e8789a');
  // 书桌
  box(ctx, 240, 900, 1900, 56, '#d2a878', 5);
  ctx.fillStyle = '#b98b5e';
  ctx.fillRect(262, 956, 1900, 300);
  sprite(ctx, A, 'prop_teacup', 960, 902, 5.5, false, 0.9);
  sprite(ctx, A, 'prop_bowl', 330, 902, 5.5, false, 0.9);
  floatHearts(ctx, t, o.hearts);
  ctx.restore();
}

// ───────── 天桥 ─────────

function umbrella(ctx: Ctx, x: number, y: number) {
  ctx.fillStyle = '#e9e4d6';
  ctx.fillRect(x - 4, y + 20, 8, 300);
  cut(ctx, '#5f93c9', () => {
    ctx.moveTo(-190 + x, y + 96);
    ctx.quadraticCurveTo(x - 170, y - 14, x, y - 20);
    ctx.quadraticCurveTo(x + 170, y - 14, x + 190, y + 96);
    for (let i = 3; i >= 0; i--) ctx.arc(x - 190 + 95 * (i + 0.5), y + 96, 47.5, 0, Math.PI, true);
    ctx.closePath();
  }, 4);
  ctx.strokeStyle = 'rgba(40,70,120,.45)';
  ctx.lineWidth = 3;
  for (const dx of [-95, 0, 95]) {
    ctx.beginPath();
    ctx.moveTo(x, y - 20);
    ctx.quadraticCurveTo(x + dx * 0.8, y + 20, x + dx, y + 72);
    ctx.stroke();
  }
}

export interface BridgeO {
  actors: Act[];
  rain: number;
  umb?: { x: number; y: number } | null;
  hearts?: Floaty[];
}

export function bridge(ctx: Ctx, A: Atlas, t: number, cam: Cam, o: BridgeO) {
  sky(ctx, [[0, '#1a1c40'], [1, '#272a58']]);
  stars(ctx, t, 26, 17);
  ctx.save();
  camOn(ctx, cam, 0.6);
  ctx.translate(-960 * 0.4, 0);
  skyline(ctx, 23, -700, 3400, 700, '#2c3466', 190, 440);
  ctx.restore();

  ctx.save();
  camOn(ctx, cam);
  building(ctx, { x: -260, w: 300, top: 360, color: '#3b477a', cols: 3, rows: 3, seed: 2 });
  building(ctx, { x: 70, w: 300, top: 330, color: '#3b477a', cols: 4, rows: 4, seed: 5 });
  building(ctx, { x: 420, w: 270, top: 290, color: '#32406e', roof: '#4a3350', cols: 3, rows: 4, seed: 12, lit: 0.8 });
  building(ctx, { x: 740, w: 380, top: 370, color: '#3f4c80', cols: 5, rows: 3, seed: 19 });
  building(ctx, { x: 1170, w: 290, top: 300, color: '#32406e', cols: 3, rows: 4, seed: 27, lit: 0.8 });
  building(ctx, { x: 1510, w: 340, top: 350, color: '#3b477a', roof: '#4a3350', cols: 4, rows: 3, seed: 31 });
  building(ctx, { x: 1900, w: 330, top: 320, color: '#32406e', cols: 4, rows: 4, seed: 37 });
  // 广告牌：那双红鞋
  box(ctx, 1764, 250, 10, 120, '#1b1e40', 2);
  box(ctx, 1640, 196, 260, 130, '#e2b04a', 4, 8);
  box(ctx, 1654, 210, 232, 102, '#fbf1cf', 0, 4);
  heels(ctx, 1770, 298, 1.15);
  for (const lx of [170, 1490]) lamp(ctx, lx, t, GROUND, 400);
  // 桥下的小摊雨棚
  const aw: [string, string][] = [['#d9768a', '#f8f3e6'], ['#6fae8a', '#f8f3e6'], ['#6f9bc6', '#f8f3e6'], ['#e7b85a', '#f8f3e6']];
  for (let i = 0; i < 10; i++) {
    const x = -330 + i * 270, c = aw[i % 4];
    for (let j = 0; j < 8; j++) {
      ctx.fillStyle = j % 2 ? c[0] : c[1];
      ctx.fillRect(x + j * 28, 676, 28, 34);
    }
    ctx.fillStyle = '#f3cd72';
    ctx.fillRect(x + 20, 718, 184, 50);
  }
  // 栏杆
  ctx.strokeStyle = 'rgba(200,198,224,.55)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = -500; x < 2600; x += 110) {
    ctx.moveTo(x, 634);
    ctx.lineTo(x + 110, GROUND);
    ctx.moveTo(x + 110, 634);
    ctx.lineTo(x, GROUND);
  }
  ctx.stroke();
  ctx.fillStyle = '#9d9abc';
  ctx.fillRect(-500, 626, 3200, 9);
  ctx.fillRect(-500, 704, 3200, 5);
  for (let x = -500; x < 2600; x += 110) ctx.fillRect(x - 3, 626, 7, 156);
  // 桥面
  ctx.fillStyle = '#aaa7c2';
  ctx.fillRect(-500, GROUND - 2, 3200, 16);
  ctx.fillStyle = '#6c6990';
  ctx.fillRect(-500, GROUND + 14, 3200, 46);
  ctx.fillStyle = '#20224a';
  ctx.fillRect(-500, GROUND + 60, 3200, 700);
  ctx.fillStyle = '#f3cd72';
  for (let x = -460; x < 2600; x += 150) {
    ctx.globalAlpha = 0.5 + 0.4 * hash(x);
    ctx.fillRect(x, GROUND + 120, 76, 26);
  }
  ctx.globalAlpha = 1;
  for (const a of o.actors) actor(ctx, A, a, 2.6);
  if (o.umb) umbrella(ctx, o.umb.x, o.umb.y);
  floatHearts(ctx, t, o.hearts);
  ctx.restore();
  rain(ctx, t, o.rain);
}

// ───────── 鞋盒 ─────────

export function shoebox(ctx: Ctx, A: Atlas, t: number, k: number) {
  ctx.fillStyle = '#1d2046';
  ctx.fillRect(0, 0, W, H);
  glow(ctx, 960, 640, 760, 'rgba(255,240,200,.55)', 0.4);
  ctx.fillStyle = 'rgba(8,6,24,.45)';
  ctx.beginPath();
  ctx.ellipse(960, 852, 480, 36, 0, 0, Math.PI * 2);
  ctx.fill();
  box(ctx, 560, 540, 800, 300, '#f3ead6', 6, 12);
  box(ctx, 592, 568, 736, 244, '#e3d6ba', 0, 8);
  cut(ctx, '#fbf7ee', () => poly(ctx, [592, 812, 640, 690, 760, 740, 900, 670, 1060, 736, 1200, 680, 1328, 760, 1328, 812]), 0);
  glow(ctx, 960, 730, 300, 'rgba(255,214,140,.95)', 0.25 + 0.4 * k);
  heels(ctx, 960, 800, 3.3);
  if (k > 0.5)
    for (let i = 0; i < 5; i++) {
      const ang = i * 1.26 + t * 1.6;
      sprite(ctx, A, `fx_sparkle_${i % 3}`, 960 + Math.cos(ang) * 330, 700 + Math.sin(ang) * 130, 5, false, 0, (k - 0.5) * 2);
    }
  // 盒盖掀开
  ctx.save();
  ctx.translate(960, 540 - 460 * k);
  ctx.rotate(-0.22 * k);
  ctx.globalAlpha = 1 - seg(k, 0.7, 1);
  box(ctx, -420, -70, 840, 104, '#fbf5e6', 6, 12);
  ctx.fillStyle = '#d62a3c';
  ctx.fillRect(-32, -70, 64, 104);
  cut(ctx, '#d62a3c', () => poly(ctx, [0, -70, -90, -120, -80, -50]), 3);
  cut(ctx, '#d62a3c', () => poly(ctx, [0, -70, 90, -120, 80, -50]), 3);
  ctx.restore();
}

// ───────── 栈桥 ─────────

export function pier(ctx: Ctx, A: Atlas, t: number, cam: Cam, o: { actors: Act[]; extras: Act[]; hearts?: Floaty[] }) {
  sky(ctx, [[0, '#33295f'], [0.55, '#6a4f92'], [1, '#8a6aa8']]);
  stars(ctx, t, 50, 31);
  ctx.save();
  camOn(ctx, cam);
  glow(ctx, 1540, 250, 330, 'rgba(255,240,200,.85)', 0.5);
  cut(ctx, '#fbf1d2', () => ctx.arc(1540, 250, 105, 0, Math.PI * 2), 0);
  ctx.fillStyle = 'rgba(226,200,150,.5)';
  for (const [mx, my, mr] of [[1500, 220, 20], [1575, 285, 26], [1560, 205, 11]]) {
    ctx.beginPath();
    ctx.arc(mx, my, mr, 0, Math.PI * 2);
    ctx.fill();
  }
  // 云：只描一圈线
  ctx.strokeStyle = 'rgba(244,237,220,.7)';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  for (const [cx, cy] of [[250, 300], [1180, 150], [760, 430]]) {
    ctx.beginPath();
    ctx.arc(cx, cy, 34, Math.PI, 0);
    ctx.arc(cx + 56, cy - 14, 44, Math.PI * 1.1, 0);
    ctx.arc(cx + 118, cy, 30, Math.PI, Math.PI * 0.2);
    ctx.lineTo(cx - 34, cy + 2);
    ctx.stroke();
  }
  // 海平线上的远城
  for (let i = 0; i < 40; i++) {
    const x = -1500 + i * 130, h = 34 + hash(i * 2.1) * 60, w = 96;
    ctx.fillStyle = '#2a2c63';
    ctx.fillRect(x, 762 - h, w, h);
    ctx.fillStyle = '#f3cd72';
    for (let c = 0; c < 3; c++) if (hash(i * 7 + c) < 0.6) ctx.fillRect(x + 12 + c * 28, 762 - h + 12, 14, 10);
  }
  // 海
  const sg = ctx.createLinearGradient(0, 760, 0, 1400);
  sg.addColorStop(0, '#2c3478');
  sg.addColorStop(1, '#151943');
  ctx.fillStyle = sg;
  ctx.fillRect(-2000, 760, 6000, 1200);
  ctx.fillStyle = '#fbf1d2';
  for (let i = 0; i < 14; i++) {
    const w = 230 - i * 9 + Math.sin(t * 2 + i) * 34;
    ctx.globalAlpha = 0.34 - i * 0.015;
    ctx.fillRect(1540 - w / 2, 846 + i * 24, w, 6);
  }
  ctx.globalAlpha = 1;
  // 栈桥
  for (let x = -1500; x < 3600; x += 170) box(ctx, x, 824, 22, 420, '#5c4638', 0);
  box(ctx, -2000, 796, 6000, 34, '#9a7860', 4);
  ctx.fillStyle = 'rgba(70,48,36,.5)';
  for (let x = -2000; x < 4000; x += 86) ctx.fillRect(x, 796, 3, 34);
  for (const lx of [400, 1560]) lamp(ctx, lx, t, 798, 360);
  for (const a of o.extras) actor(ctx, A, a, 2);
  for (const a of o.actors) actor(ctx, A, a, 2.6);
  floatHearts(ctx, t, o.hearts);
  ctx.restore();
}
