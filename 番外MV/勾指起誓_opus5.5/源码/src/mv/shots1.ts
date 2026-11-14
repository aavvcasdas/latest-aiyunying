// 序章 + 第一段主歌/副歌 + 第一段间奏
import {
  W, H, Frame, actor, sticker, world, camApply, particles, fgBush, hash, clamp, lerp, ease, easeOut, glow, rays, ring, thread, giftBox,
  moonDisc, hourglass, flag, cloud, paperBoat, waves, text, paper, sparkle, heart, lantern, pine, poly, shade, starsLayer, sky,
} from './gfx';

type Fn = (f: Frame) => void;
export const S1: Record<string, Fn> = {};
const seg = (u: number, a: number, b: number) => clamp((u - a) / (b - a));

// ---------- 共用小景 ----------
function fire(c: CanvasRenderingContext2D, x: number, y: number, s: number, t: number) {
  glow(c, x, y - 30 * s, 190 * s, '255,150,60', 0.5);
  const cols = ['#ff6b35', '#ffb703', '#fff1a8'];
  for (let k = 0; k < 3; k++) {
    const h = (62 - k * 18) * s * (1 + 0.12 * Math.sin(t * 11 + k * 2)), w = (26 - k * 7) * s;
    c.fillStyle = cols[k]; c.beginPath(); c.moveTo(x - w, y); c.quadraticCurveTo(x - w * 0.6, y - h * 0.6, x + Math.sin(t * 8 + k) * 5 * s, y - h); c.quadraticCurveTo(x + w * 0.6, y - h * 0.6, x + w, y); c.closePath(); c.fill();
  }
  c.fillStyle = '#5b3a22'; c.fillRect(x - 40 * s, y - 4 * s, 80 * s, 9 * s);
}
function room(f: Frame, night = true) {
  const c = f.c; sky(f, night ? '#2a2f6e' : '#ffd9a8', night ? '#4a4f9a' : '#fff1d6', H);
  c.fillStyle = night ? '#6b4a5e' : '#e8b88a'; c.fillRect(-50, 0, W + 100, 560);
  c.fillStyle = shade(night ? '#6b4a5e' : '#e8b88a', 12); for (let i = 0; i < 9; i++) c.fillRect(i * 150 - 20, 0, 70, 560);
  c.fillStyle = '#5a3a2a'; c.fillRect(-50, 560, W + 100, 200);
  c.fillStyle = '#6a4632'; for (let i = 0; i < 12; i++) c.fillRect(i * 120, 560, 6, 200);
  // 窗
  c.fillStyle = '#1b2058'; c.fillRect(780, 90, 360, 300); starsLayer(f, 0, 1);
  c.save(); c.beginPath(); c.rect(780, 90, 360, 300); c.clip(); c.fillStyle = '#18204f'; c.fillRect(780, 90, 360, 300);
  for (let i = 0; i < 30; i++) { c.fillStyle = `rgba(255,255,255,${0.4 + 0.6 * Math.abs(Math.sin(f.t * 2 + i))})`; c.fillRect(790 + hash(i) * 340, 100 + hash(i + 8) * 280, 3, 3); }
  moonDisc(c, 1020, 190, 46); c.restore();
  c.strokeStyle = '#f3e3c3'; c.lineWidth = 14; c.strokeRect(780, 90, 360, 300); c.lineWidth = 8; c.beginPath(); c.moveTo(960, 90); c.lineTo(960, 390); c.moveTo(780, 240); c.lineTo(1140, 240); c.stroke();
  // 窗帘
  c.fillStyle = '#e07a8a'; c.beginPath(); c.moveTo(740, 70); c.lineTo(820, 70); c.quadraticCurveTo(790, 240, 830, 420); c.lineTo(740, 420); c.fill();
  c.beginPath(); c.moveTo(1180, 70); c.lineTo(1100, 70); c.quadraticCurveTo(1130, 240, 1090, 420); c.lineTo(1180, 420); c.fill();
}
function desk(c: CanvasRenderingContext2D, x: number, y: number, w: number) {
  c.save(); c.shadowColor = 'rgba(0,0,0,0.35)'; c.shadowBlur = 20; c.shadowOffsetY = 8;
  c.fillStyle = '#8a5a3a'; c.fillRect(x - w / 2, y, w, 22); c.restore();
  c.fillStyle = '#6a4228'; c.fillRect(x - w / 2 + 14, y + 22, w - 28, 160);
  c.fillStyle = '#7a4d30'; c.fillRect(x - w / 2 + 30, y + 40, w - 60, 60);
}
function envelope(c: CanvasRenderingContext2D, x: number, y: number, s: number, rot = 0, open = 0) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s); c.shadowColor = 'rgba(0,0,0,0.3)'; c.shadowBlur = 10; c.shadowOffsetY = 4;
  c.fillStyle = '#fff6df'; c.fillRect(-50, -32, 100, 64); c.shadowColor = 'transparent';
  c.fillStyle = '#f4dfb4'; c.beginPath(); c.moveTo(-50, 32); c.lineTo(0, -4); c.lineTo(50, 32); c.closePath(); c.fill();
  c.fillStyle = '#ffeec2'; c.beginPath(); if (open < 0.5) { c.moveTo(-50, -32); c.lineTo(0, 6 - open * 76); c.lineTo(50, -32); } else { c.moveTo(-50, -32); c.lineTo(0, -70 + (open - 0.5) * 20); c.lineTo(50, -32); } c.closePath(); c.fill();
  c.fillStyle = '#e63946'; if (open < 0.5) { c.beginPath(); c.arc(0, 6, 8, 0, 7); c.fill(); }
  c.restore();
}
function scribble(c: CanvasRenderingContext2D, x: number, y: number, w: number, n: number, p = 1, col = '#b9893a') {
  c.strokeStyle = col; c.lineWidth = 3; c.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const k = clamp(p * n - i); if (k <= 0) break; c.beginPath(); c.moveTo(x, y + i * 22);
    for (let j = 0; j <= 14; j++) { const px = x + (j / 14) * w * k; c.lineTo(px, y + i * 22 + Math.sin(j * 1.6 + i) * 4); } c.stroke();
  }
}
const bounce = (f: Frame, a = 7) => -f.pulse * a;

// ---------- 序章 ----------
S1.I1 = (f) => {
  const c = f.c; camApply(f, 0, 0, 1.0 + 0.04 * f.u);
  sky(f, '#6b1d2e', '#3a0f22', H); c.fillStyle = '#7a3b24'; c.fillRect(-50, 470, W + 100, 300);
  c.fillStyle = 'rgba(255,255,255,0.05)'; for (let i = 0; i < 8; i++) c.fillRect(-50, 490 + i * 34, W + 100, 8);
  glow(c, 640, 330, 520, '255,210,140', 0.35);
  const th = ease(seg(f.u, 0.45, 0.92)) * Math.PI * 0.94; const bw = 560, bh = 360, cx = 640, cy = 330;
  paper(c, cx, cy + 14, bw + 14, bh + 10, 0, '#e8d3a8');
  c.fillStyle = '#fff8e7'; c.fillRect(cx - bw / 2, cy - bh / 2, bw, bh);
  if (th > 0.05) { c.fillStyle = '#ffe9b0'; glow(c, cx + 20, cy, 360, '255,236,160', 0.6 * ease(th / 2)); scribble(c, cx + 50, cy - 90, 160, 6, 1, '#d6a85a'); }
  c.save(); c.translate(cx - bw / 2, cy); c.scale(Math.cos(th), 1);
  const front = th < Math.PI / 2;
  c.fillStyle = front ? '#2b3a8f' : '#fff3cf'; c.shadowColor = 'rgba(0,0,0,0.45)'; c.shadowBlur = 18; c.fillRect(0, -bh / 2, bw, bh); c.shadowColor = 'transparent';
  if (front) {
    c.strokeStyle = '#ffd35a'; c.lineWidth = 6; c.strokeRect(18, -bh / 2 + 18, bw - 36, bh - 36);
    text(c, '勾指起誓', bw / 2, -30, 92, '#ffe08a', 'center', '#7a4a10');
    text(c, '词曲 ilem · 原唱 洛天依', bw / 2, 56, 26, '#fff3cf');
    c.fillStyle = '#ffd35a'; sparkle(c, 90, -bh / 2 + 70, 18 + 6 * Math.sin(f.t * 6)); sparkle(c, bw - 80, bh / 2 - 60, 14 + 5 * Math.sin(f.t * 5));
  }
  c.restore();
  actor(f, 'whale', 'idle', 190, 690, 2.9, { bob: bounce(f, 5) });
  actor(f, 'claude', 'idle', 1090, 690, 2.9, { bob: bounce(f, 5), flip: true });
  particles(f, 'gold', 26, 3);
};

S1.I2 = (f) => {
  const c = f.c; const sx = f.st * 70; camApply(f, sx, 0, 1.05);
  world(f, 'dusk', { road: false, density: 0.4 });
  for (let i = 0; i < 4; i++) { const x = i * 520 + 200 - sx; c.fillStyle = '#2b2542'; c.fillRect(x - 4, 340, 8, 220); c.fillRect(x - 4, 340, 40, 8); glow(c, x + 36, 360, 120, '255,200,120', 0.6); c.fillStyle = '#ffe9a8'; poly(c, x + 36, 362, 9, 8); }
  const mx = 1340 - sx; c.fillStyle = '#4a4f9a'; c.fillRect(mx - 3, 450, 6, 110);
  c.fillStyle = '#e63946'; c.beginPath(); c.roundRect(mx - 34, 400, 68, 56, 14); c.fill(); c.fillStyle = '#111'; c.fillRect(mx - 22, 424, 44, 7); c.fillStyle = '#ffd166'; c.fillRect(mx - 34, 456, 68, 5);
  const p = seg(f.u, 0.78, 1);
  actor(f, 'whale', 'walk', 430, 650, 3.1, { bob: bounce(f, 4) });
  const ex = lerp(528, mx, easeOut(p)), ey = lerp(560, 428 - Math.sin(p * Math.PI) * 60, p);
  envelope(c, ex, ey, 0.72 * (1 - p * 0.5), -0.3 + p * 0.5);
  particles(f, 'firefly', 14, 4); fgBush(f, '#26335f');
};

S1.I3 = (f) => {
  const c = f.c; camApply(f, 0, 0, 1.02 + 0.06 * f.u);
  room(f); glow(c, 400, 420, 380, '255,200,120', 0.35);
  c.fillStyle = '#ffdb8a'; c.fillRect(150, 330, 14, 230); c.fillStyle = '#e07a8a'; c.beginPath(); c.moveTo(110, 340); c.lineTo(204, 340); c.lineTo(180, 260); c.lineTo(134, 260); c.fill();
  actor(f, 'claude', 'read', 520, 590, 3.4);
  desk(c, 520, 560, 560);
  const open = ease(seg(f.u, 0.2, 0.8)); envelope(c, 600, 548, 1.0, -0.06, open);
  actor(f, 'whale', 'sway', 1180, 690, 2.6, { flip: true });
  particles(f, 'gold', 16, 2);
};

S1.I4 = (f) => {
  const c = f.c; camApply(f, f.st * 12, 0, 1.0 + 0.08 * f.u);
  world(f, 'night', { density: 0.2 }); const p = ease(f.u);
  glow(c, 640, 300 - p * 60, 380, '255,230,150', 0.45);
  const px = 640, py = lerp(520, 260, p); paper(c, px, py, 300, 380, Math.sin(f.t * 1.5) * 0.08);
  c.save(); c.translate(px, py); c.rotate(Math.sin(f.t * 1.5) * 0.08); scribble(c, -110, -140, 220, 10, seg(f.u, 0.1, 0.8)); c.restore();
  particles(f, 'gold', 50, 8);
  actor(f, 'claude', 'read', 380, 660, 3.0, { bob: bounce(f, 4) });
  actor(f, 'whale', 'wave', 900, 660, 3.0, { flip: true, bob: bounce(f, 4) });
};

// ---------- 主歌 ----------
S1.L01 = (f) => {
  const c = f.c; camApply(f, 0, 0, 1.03 + 0.04 * f.u);
  room(f); glow(c, 520, 380, 420, '255,205,130', 0.35);
  const p = seg(f.u, 0, 0.9);
  paper(c, 520, 280, 360, 440, -0.03); c.save(); c.translate(520, 280); c.rotate(-0.03); scribble(c, -140, -170, 280, 12, p); c.restore();
  c.fillStyle = '#ff8fa3'; sparkle(c, 640, 120, 16);
  actor(f, 'claude', 'read', 520, 640, 3.3, { bob: bounce(f, 3) });
  actor(f, 'whale', 'wave', 1150, 690, 2.8, { flip: true });
  particles(f, 'heart', 10, 5);
};

S1.L02 = (f) => {
  const c = f.c; camApply(f, 0, 0, 1.0 + 0.05 * f.u);
  sky(f, '#7a3b24', '#a65a34', H); c.fillStyle = 'rgba(0,0,0,0.12)'; for (let i = 0; i < 8; i++) c.fillRect(-50, i * 100, W + 100, 5);
  const cx = 640, cy = 380; paper(c, cx, cy + 8, 1000, 560, 0, '#d9bf8f');
  c.fillStyle = '#fff6df'; c.fillRect(cx - 490, cy - 270, 485, 540); c.fillStyle = '#fffaf0'; c.fillRect(cx + 5, cy - 270, 485, 540);
  // 左页：城堡
  c.fillStyle = '#c9b6f2'; c.fillRect(cx - 400, cy - 80, 300, 200); c.fillStyle = '#9d86e0'; c.fillRect(cx - 360, cy - 140, 60, 260); c.fillRect(cx - 200, cy - 140, 60, 260); c.fillRect(cx - 300, cy - 100, 100, 220);
  c.fillStyle = '#ff6b8a'; for (const x of [cx - 360, cx - 200]) { c.beginPath(); c.moveTo(x - 6, cy - 140); c.lineTo(x + 30, cy - 200); c.lineTo(x + 66, cy - 140); c.fill(); }
  text(c, '完', cx - 250, cy - 210, 84, '#a5451f');
  scribble(c, cx + 50, cy - 160, 340, 8, 1, '#c9a46a');
  // 翻页
  const pf = ease(seg(f.u, 0.35, 0.95)); c.save(); c.translate(cx + 5, cy); c.scale(Math.cos(pf * Math.PI), 1);
  c.shadowColor = 'rgba(0,0,0,0.3)'; c.shadowBlur = 16; c.fillStyle = pf < 0.5 ? '#fffaf0' : '#fff6df'; c.fillRect(0, -270, 485, 540); c.restore();
  actor(f, 'whale', 'idle', cx + 130, cy + 250, 1.9, { bob: bounce(f, 3) });
  actor(f, 'claude', 'idle', cx + 270, cy + 250, 1.9, { bob: bounce(f, 3) });
  particles(f, 'gold', 20, 6);
};

S1.L03 = (f) => {
  const c = f.c; camApply(f, 0, 0, 1.0 + 0.06 * f.u);
  world(f, 'night', { density: 0.25 });
  for (let i = 0; i < 7; i++) {
    const ph = ((f.t * 0.8 + i * 0.37) % 1.4); const x0 = 100 + hash(i) * 1100, y0 = -40 + hash(i + 4) * 200;
    const x = x0 - ph * 520, y = y0 + ph * 360; const g = c.createLinearGradient(x, y, x + 130, y - 90); g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.strokeStyle = g; c.lineWidth = 4; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 130, y - 90); c.stroke();
  }
  const k = ease(seg(f.u, 0.3, 0.9)); glow(c, 640, 250, 300 * k, '255,230,140', 0.5); c.fillStyle = '#fff6b0'; sparkle(c, 640, 250, 60 * k + 4 * Math.sin(f.t * 8));
  actor(f, 'whale', 'surprise', 470, 660, 3.1, { bob: bounce(f, 4) });
  actor(f, 'claude', 'hop', 810, 660, 3.1);
  particles(f, 'gold', 36, 9);
};

S1.L04 = (f) => {
  const c = f.c; camApply(f, 0, f.u * -30, 1.0 + 0.04 * f.u);
  world(f, 'night', { noOrb: true, density: 0.2 });
  moonDisc(c, 560, 270, 190);
  cloud(c, 1010, 330, 1.3, 'rgba(210,225,255,0.95)');
  actor(f, 'kimi', 'think', 1000, 346, 2.6, { shadow: false });
  actor(f, 'whale', 'sway', 480, 670, 3.0, { bob: bounce(f, 3) });
  actor(f, 'claude', 'idle', 760, 670, 3.0, { bob: bounce(f, 3) });
  particles(f, 'firefly', 18, 3); fgBush(f, '#10163a');
};

S1.L05 = (f) => {
  const c = f.c; camApply(f, f.st * 20, 0, 1.0 + 0.04 * f.u);
  world(f, 'snow', { trees: 'pine', density: 0.5 });
  for (let i = 0; i < 5; i++) { const x = ((i * 300 + 80 - f.cam.x * 0.6) % 1500 + 1500) % 1500 - 100; for (let j = 0; j < 8; j++) { c.fillStyle = ['#ff4d6d', '#ffd166', '#4cc9f0', '#80ed99'][(i + j) & 3]; c.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(f.t * 3 + j + i)); c.fillRect(x - 40 + j * 11, 280 + Math.sin(j * 1.1) * 6, 6, 6); } c.globalAlpha = 1; }
  const x = lerp(-60, 560, ease(f.u));
  c.fillStyle = '#8a5a3a'; c.beginPath(); c.ellipse(x - 70, 600, 70, 80, 0, 0, 7); c.fill();
  actor(f, 'doubao', 'walk', x, 650, 3.1, { hat: 'santa' }); sticker(f, 'prop_basket', x + 70, 600, 4.4);
  giftBox(c, 980, 650, 1.2, 0, '#4cc9f0'); giftBox(c, 1090, 655, 1.0, 0, '#80ed99');
  actor(f, 'whale', 'wave', 820, 660, 3.0, { flip: true, bob: bounce(f, 3) });
  particles(f, 'snow', 70, 2);
};

S1.L06 = (f) => {
  const c = f.c; camApply(f, 0, 0, 1.0 + 0.03 * f.u);
  sky(f, '#2a1b4e', '#6b3a7a', H); c.fillStyle = '#3b2a63'; c.fillRect(-50, 560, W + 100, 200);
  const op = easeOut(seg(f.u, 0.1, 0.5)); rays(c, 640, 480, 900, 14, f.t * 0.4, `rgba(255,230,150,${0.25 * op})`); glow(c, 640, 460, 420, '255,220,140', 0.5 * op);
  actor(f, 'claude', 'hop', 640, lerp(680, 470, op), 3.2, { shadow: false });
  giftBox(c, 640, 690, 3.4, op, '#e63946');
  actor(f, 'whale', 'surprise', 260, 680, 3.0, { bob: bounce(f, 4) });
  particles(f, 'heart', 22, 3); particles(f, 'gold', 30, 4);
};

S1.L07 = (f) => {
  const c = f.c; const z = 1 + 0.2 * f.u; camApply(f, f.st * 45, 0, z);
  world(f, 'sunset', { houses: true, density: 0.2 });
  particles(f, 'lantern', 26, 5);
  c.fillStyle = '#8a5a3a'; c.fillRect(300, 560, 700, 18); c.fillStyle = '#6a4228'; for (let i = 0; i < 8; i++) c.fillRect(310 + i * 96, 578, 12, 90);
  actor(f, 'whale', 'walk', 560, 566, 1.8); actor(f, 'claude', 'walk', 660, 566, 1.8);
  fgBush(f, '#7b3d6e');
};

S1.L08 = (f) => {
  const c = f.c; camApply(f, 0, 0, 1.0 + 0.05 * f.u);
  world(f, 'day', { trees: 'round', density: 0.3 });
  waves(f, 560, '#4aa8e8', 8, 3);
  for (let i = 0; i < 24; i++) { const x = (hash(i) * W + f.t * 20) % W, y = 575 + hash(i + 4) * 120; c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(x, y, 14, 2); }
  actor(f, 'whale', 'point', 420, 640, 3.2, { shadow: false }); sticker(f, 'prop_bowl', 548, 560, 5);
  const p = seg(f.u, 0.2, 0.85);
  for (let i = 0; i < 12; i++) { const k = clamp(p * 1.4 - i * 0.05); if (k <= 0 || k >= 1) continue; const x = lerp(560, 840, k), y = lerp(550, 600, k) - Math.sin(k * Math.PI) * 90; c.fillStyle = '#bfe8ff'; c.beginPath(); c.arc(x, y, 6 - k * 2, 0, 7); c.fill(); c.fillStyle = '#fff'; c.fillRect(x - 2, y - 3, 2, 2); }
  actor(f, 'claude', 'nod', 900, 650, 3.2);
  particles(f, 'gold', 14, 7);
};

// ---------- 副歌 ----------
S1.L09 = (f) => {
  const c = f.c; camApply(f, 0, 0, 1.1);
  world(f, 'spring', { trees: 'round', density: 0.3 });
  const mv = ease(seg(f.u, 0.05, 0.85)); const wx = lerp(260, 560, mv);
  c.fillStyle = 'rgba(255,255,255,0.7)'; for (let i = 0; i < 6; i++) { const x = lerp(260, wx, i / 6); if (x < wx - 30) c.fillRect(x, 660 + (i & 1) * 8, 10, 5); }
  actor(f, 'whale', mv > 0.02 && mv < 0.98 ? 'walk' : 'idle', wx, 650, 3.3);
  actor(f, 'claude', 'idle', 860, 650, 3.3, { flip: true });
  const gap = 860 - wx; c.strokeStyle = 'rgba(255,200,220,0.9)'; c.setLineDash([10, 8]); c.lineWidth = 3; c.beginPath(); c.moveTo(wx + 60, 520); c.lineTo(860 - 60, 520); c.stroke(); c.setLineDash([]);
  if (gap < 340) { c.fillStyle = '#ff6b8a'; heart(c, (wx + 860) / 2, 480, 14 + 6 * f.pulse); }
  particles(f, 'petal', 30, 3);
};

S1.L10 = (f) => {
  const c = f.c; camApply(f, 0, 0, 1.0 + 0.1 * f.u);
  world(f, 'dusk', { density: 0.4 });
  fire(c, 640, 640, 2.4, f.t);
  actor(f, 'whale', 'sway', 360, 660, 3.2, { shadow: true });
  actor(f, 'claude', 'idle', 920, 660, 3.2, { flip: true });
  const g = c.createRadialGradient(640, 560, 60, 640, 560, 700); g.addColorStop(0, 'rgba(255,150,60,0.35)'); g.addColorStop(1, 'rgba(255,150,60,0)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.strokeStyle = 'rgba(255,220,160,0.35)'; c.lineWidth = 3; for (let i = 0; i < 4; i++) { c.beginPath(); for (let y = 0; y < 220; y += 8) c.lineTo(520 + i * 80 + Math.sin(y * 0.08 + f.t * 4 + i) * 7, 470 - y); c.stroke(); }
  particles(f, 'gold', 30, 3); particles(f, 'firefly', 10, 9);
};

S1.L11 = (f) => {
  const c = f.c; camApply(f, 0, f.u * -20, 1.0 + 0.05 * f.u);
  world(f, 'mount', { peaks: true, density: 0.1 });
  for (let i = 0; i < 4; i++) cloud(c, ((f.t * 90 + i * 400) % 1700) - 200, 120 + i * 60, 1.4 - i * 0.15, 'rgba(255,255,255,0.8)');
  const sun = ease(seg(f.u, 0.5, 1)); rays(c, 640, 420, 1100, 16, f.t * 0.3, `rgba(255,240,170,${0.3 * sun})`);
  c.fillStyle = '#6a6f8a'; c.beginPath(); c.moveTo(340, 720); c.lineTo(470, 600); c.lineTo(640, 580); c.lineTo(820, 610); c.lineTo(940, 720); c.closePath(); c.fill();
  c.fillStyle = '#8085a3'; c.beginPath(); c.moveTo(470, 600); c.lineTo(640, 580); c.lineTo(600, 660); c.closePath(); c.fill();
  actor(f, 'whale', 'hop', 640, 588, 3.5);
  particles(f, 'leaf', 40, 6); fgBush(f, '#2c4a5a');
};

S1.L12 = (f) => {
  const c = f.c; camApply(f, 0, 0, 1.0 + 0.04 * f.u);
  world(f, 'spring', { trees: 'round', density: 0.4, noOrb: true });
  const g = c.createRadialGradient(640, 360, 80, 640, 360, 800); g.addColorStop(0, 'rgba(255,220,235,0.4)'); g.addColorStop(1, 'rgba(255,180,220,0.1)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  cloud(c, 200, 180, 1.6); cloud(c, 1020, 120, 1.4);
  actor(f, 'whale', 'sway', 430, 660, 3.1, { flip: false });
  actor(f, 'claude', 'idle', 840, 660, 3.3, { flip: true });
  for (let i = 0; i < 6; i++) cloud(c, i * 260 + 40 + Math.sin(f.t + i) * 10, 720, 1.5, 'rgba(255,255,255,0.9)');
  particles(f, 'petal', 70, 8);
};

S1.L13 = (f) => {
  const c = f.c; camApply(f, 0, 0, 1.0 + 0.08 * f.u);
  sky(f, '#2b1458', '#8a3fa0', H); c.fillStyle = '#3a1c66'; c.fillRect(-50, 590, W + 100, 200);
  glow(c, 640, 360, 520, '255,210,110', 0.3); rays(c, 640, 360, 800, 10, f.t * 0.3, 'rgba(255,220,130,0.12)');
  const e = ease(seg(f.u, 0.1, 0.8));
  const ax = lerp(380, 900, e), ay = 340 - Math.sin(e * Math.PI) * 130, bx = lerp(900, 380, e), by = 340 + Math.sin(e * Math.PI) * 130;
  thread(c, 380, 360, 900, 360, 0, 'rgba(255,215,90,0.35)', 2, false);
  ring(c, ax, ay, 46, f.t * 2, 1); ring(c, bx, by, 46, -f.t * 2, 1);
  if (e > 0.95) { c.fillStyle = '#fff6b0'; sparkle(c, 640, 340, 40 + 20 * f.pulse); }
  actor(f, 'whale', 'point', 320, 680, 3.2); actor(f, 'claude', 'curtsy', 960, 680, 3.2, { flip: true });
  particles(f, 'gold', 50, 2);
};

S1.L14 = (f) => {
  const c = f.c; const k = ['spring', 'day', 'autumn', 'snow'][Math.min(3, Math.floor(f.u * 4))]; camApply(f, 0, 0, 1.0 + 0.04 * f.u);
  world(f, k, { trees: 'round', density: 0.45 });
  particles(f, k === 'spring' ? 'petal' : k === 'autumn' ? 'leaf' : k === 'snow' ? 'snow' : 'firefly', 40, 3);
  c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillRect(0, 0, W, H); const sw = 1 - Math.abs(f.u * 4 % 1 - 0.1) * 0; void sw;
  glow(c, 640, 380, 300, '255,240,200', 0.5); hourglass(c, 640, 380, 3.0, f.u);
  actor(f, 'whale', 'idle', 280, 680, 2.8); actor(f, 'claude', 'idle', 1000, 680, 2.8, { flip: true });
};

S1.L15 = (f) => {
  const c = f.c; camApply(f, f.st * 240, 0, 1.0 + 0.03 * f.u);
  world(f, 'sunset', { road: true, trees: 'pine', density: 0.4 });
  const wx = 500, cx2 = 780, hy = 650 - 120 * 1.0;
  actor(f, 'whale', 'walk', wx, 660, 3.2, { bob: bounce(f, 3) }); actor(f, 'claude', 'walk', cx2, 660, 3.2, { bob: bounce(f, 3) });
  const sag = 26 + Math.sin(f.t * 4) * 4; thread(c, wx + 38, hy + 12, cx2 - 38, hy + 12, sag, '#ffc933', 5);
  c.fillStyle = '#ff6b8a'; heart(c, (wx + cx2) / 2, hy - 60 - f.pulse * 8, 14);
  particles(f, 'gold', 24, 6);
};

S1.L16 = (f) => {
  const c = f.c; camApply(f, 0, 0, 1.0); world(f, 'sunset', { road: true, trees: 'pine', density: 0.5 });
  const p = ease(f.u); const y = lerp(670, 548, p), s = lerp(3.0, 1.1, p);
  c.save(); glow(c, 760, 410, 380, '255,220,150', 0.5); c.restore();
  actor(f, 'whale', 'walk', lerp(540, 620, p), y, s); actor(f, 'claude', 'walk', lerp(740, 668, p), y, s);
  particles(f, 'lantern', 12, 8);
};

// ---------- 间奏 ----------
const walkers = (f: Frame, s = 2.6, y = 660, x = 420, gap = 170) => {
  actor(f, 'whale', 'walk', x, y, s, { bob: bounce(f, 3) }); actor(f, 'claude', 'walk', x + gap, y, s, { bob: bounce(f, 3) });
};
S1.N1 = (f) => { camApply(f, f.st * 150, 0, 1.0 + 0.05 * f.u); world(f, 'dawn', { trees: 'pine', density: 0.4 }); rays(f.c, 640, 440, 1000, 14, f.t * 0.2, 'rgba(255,230,160,0.14)'); walkers(f); particles(f, 'gold', 20, 9); };
S1.N2 = (f) => {
  camApply(f, f.st * 150, 0, 1.0); world(f, 'day', { trees: 'pine', density: 0.7 }); walkers(f);
  actor(f, 'zai', f.u < 0.55 ? 'doze' : 'alert', 1010, 640, 2.4, { t0: f.u < 0.55 ? 0 : f.dur * 0.55 }); f.c.fillStyle = '#7a5232'; f.c.fillRect(950, 620, 120, 24);
  particles(f, 'firefly', 12, 3); fgBush(f);
};
S1.N3 = (f) => {
  const c = f.c; camApply(f, f.st * 60, 0, 1.05); world(f, 'sea', { trees: 'none', density: 0 });
  const by = 560 + Math.sin(f.t * 2) * 8, rock = Math.sin(f.t * 2) * 0.05;
  paperBoat(c, 640, by, 2.4, rock);
  actor(f, 'whale', 'idle', 580, by - 6, 1.9, { shadow: false }); actor(f, 'claude', 'idle', 710, by - 6, 1.9, { shadow: false, flip: true });
  c.save(); c.translate(640, by); c.rotate(rock); c.scale(2.4, 2.4); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-70, -16); c.lineTo(70, -16); c.lineTo(46, 14); c.lineTo(-46, 14); c.closePath(); c.restore();
  waves(f, 600, '#2b86c8', 10, 3); particles(f, 'gold', 10, 5);
};
S1.N4 = (f) => {
  const c = f.c; camApply(f, 0, 0, 1.0 + 0.05 * f.u); world(f, 'day', { trees: 'pine', density: 0.5 });
  const pick = ease(seg(f.u, 0.55, 0.9));
  c.fillStyle = '#f0d9a0'; c.beginPath(); c.moveTo(560, 720); c.lineTo(720, 720); c.lineTo(690, 420); c.lineTo(590, 420); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(590, 420); c.lineTo(640, 400); c.lineTo(380, 540); c.lineTo(250, 530); c.closePath(); c.fill();
  c.fillStyle = pick > 0.1 ? `rgba(255,236,150,${0.7 + 0.3 * pick})` : '#f0d9a0'; c.beginPath(); c.moveTo(690, 420); c.lineTo(640, 400); c.lineTo(900, 540); c.lineTo(1030, 530); c.closePath(); c.fill();
  c.fillStyle = '#7a5232'; c.fillRect(634, 330, 12, 120); c.fillStyle = '#c28a52'; c.beginPath(); c.moveTo(560, 340); c.lineTo(640, 340); c.lineTo(660, 360); c.lineTo(640, 380); c.lineTo(560, 380); c.fill(); c.beginPath(); c.moveTo(720, 300); c.lineTo(650, 300); c.lineTo(630, 320); c.lineTo(650, 340); c.lineTo(720, 340); c.fill();
  actor(f, 'gemini', 'choose', lerp(640, 760, pick), 470 + pick * 40, 2.4, { t0: f.dur * 0.3 });
  actor(f, 'whale', 'idle', 330, 680, 2.8); actor(f, 'claude', 'idle', 480, 680, 2.8);
  particles(f, 'gold', 12, 9);
};
S1.N5 = (f) => { camApply(f, f.st * 120, 0, 1.0 + 0.05 * f.u); world(f, 'snow', { peaks: true, trees: 'pine', density: 0.4 }); walkers(f, 2.5); particles(f, 'snow', 90, 4); fgBush(f, '#2a5a58'); };
S1.N6 = (f) => {
  const c = f.c; camApply(f, 0, 0, 1.0 + 0.04 * f.u); world(f, 'night', { density: 0.3 });
  c.fillStyle = '#e07a4a'; c.beginPath(); c.moveTo(250, 600); c.lineTo(400, 400); c.lineTo(550, 600); c.closePath(); c.fill(); c.fillStyle = '#2b1a3a'; c.beginPath(); c.moveTo(370, 600); c.lineTo(400, 480); c.lineTo(430, 600); c.fill();
  fire(c, 780, 650, 2.0, f.t);
  actor(f, 'whale', 'sway', 640, 670, 2.6); actor(f, 'claude', 'idle', 930, 670, 2.6, { flip: true });
  actor(f, 'qwen', 'sway', 1120, 670, 2.5, { flip: true }); sticker(f, 'prop_teacup', 1060, 590, 3.6);
  particles(f, 'firefly', 14, 5);
};
S1.N7 = (f) => {
  const c = f.c; camApply(f, 0, -f.u * 60, 1.0 + 0.05 * f.u); world(f, 'mount', { peaks: true, density: 0.1 });
  c.fillStyle = '#7a809c'; c.beginPath(); c.moveTo(260, 720); c.lineTo(540, 560); c.lineTo(760, 540); c.lineTo(1020, 720); c.closePath(); c.fill();
  flag(c, 740, 560 + (1 - easeOut(f.u * 1.5)) * 20, 1.8, f.t);
  actor(f, 'whale', 'hop', 580, 565, 2.6); actor(f, 'claude', 'hop', 880, 640, 2.6, { t0: 0.2 });
  rays(c, 740, 400, 1000, 12, f.t * 0.25, 'rgba(255,240,170,0.18)'); particles(f, 'gold', 20, 4);
};
S1.N8 = (f) => {
  const c = f.c; camApply(f, 0, 0, 1.0 + 0.05 * f.u); sky(f, '#1a2050', '#3a3f8f', H); starsLayer(f); c.fillStyle = '#232a66'; c.fillRect(-50, 600, W + 100, 200);
  paper(c, 640, 330, 700, 440, -0.02, '#f6e2b0'); c.save(); c.translate(640, 330); c.rotate(-0.02);
  c.fillStyle = '#9ed0f0'; c.beginPath(); c.moveTo(-320, -180); c.lineTo(-120, -200); c.lineTo(-200, -60); c.lineTo(-330, -40); c.fill();
  c.fillStyle = '#b9d68a'; c.beginPath(); c.moveTo(60, 80); c.lineTo(300, 40); c.lineTo(320, 190); c.lineTo(100, 200); c.fill();
  c.strokeStyle = '#a5451f'; c.lineWidth = 4; c.setLineDash([12, 10]); const p = seg(f.u, 0.05, 0.85); c.beginPath(); c.moveTo(-260, 140);
  const pts: [number, number][] = [[-160, 60], [-60, 120], [40, 20], [140, -60], [230, 60]]; const nseg = pts.length; for (let i = 0; i < nseg; i++) if (p * nseg > i) { const k = clamp(p * nseg - i); const [px, py] = i ? pts[i - 1] : [-260, 140]; c.lineTo(lerp(px, pts[i][0], k), lerp(py, pts[i][1], k)); }
  c.stroke(); c.setLineDash([]);
  if (p > 0.95) { const r = 22 + 8 * Math.sin(f.t * 8); c.strokeStyle = '#e63946'; c.lineWidth = 12; c.beginPath(); c.moveTo(230 - r, 60 - r); c.lineTo(230 + r, 60 + r); c.moveTo(230 + r, 60 - r); c.lineTo(230 - r, 60 + r); c.stroke(); }
  c.restore();
  actor(f, 'whale', 'point', 300, 700, 2.4); actor(f, 'claude', 'lookaround', 980, 700, 2.4, { flip: true });
  particles(f, 'firefly', 12, 7);
};
void lantern; void pine; void lerp;
