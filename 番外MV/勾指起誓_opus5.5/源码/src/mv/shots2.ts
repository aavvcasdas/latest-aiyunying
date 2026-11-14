// 第二段主歌/副歌 + 第二段间奏 + 终章
import {
  W, H, Frame, actor, sticker, sprite, world, camApply, particles, fgBush, hash, clamp, lerp, ease, easeOut, glow, rays, ring, thread, hourglass, flag,
  cloud, waves, text, paper, sparkle, heart, lantern, poly, shade, starsLayer, sky, moonDisc, PAL, roundTree, type CharId,
} from './gfx';

type Fn = (f: Frame) => void;
export const S2: Record<string, Fn> = {};
const seg = (u: number, a: number, b: number) => clamp((u - a) / (b - a));
const bounce = (f: Frame, a = 7) => -f.pulse * a;
const walkers = (f: Frame, s = 2.6, y = 660, x = 420, gap = 170) => {
  actor(f, 'whale', 'walk', x, y, s, { bob: bounce(f, 3) }); actor(f, 'claude', 'walk', x + gap, y, s, { bob: bounce(f, 3) });
};
function burst(c: CanvasRenderingContext2D, x: number, y: number, age: number, col: string, R = 130, n = 16) {
  if (age < 0 || age > 1) return; const r = R * easeOut(age); c.save(); c.globalAlpha = 1 - age; c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 3; c.lineCap = 'round';
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; c.beginPath(); c.moveTo(x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.7); c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); c.stroke(); c.beginPath(); c.arc(x + Math.cos(a) * r * 1.08, y + Math.sin(a) * r * 1.08 + age * 18, 3, 0, 7); c.fill(); }
  c.restore();
}
const fireworks = (f: Frame, n = 3) => {
  const cols = ['#ffd166', '#ff6b8a', '#9be7ff', '#b8f2a0'];
  for (let k = 0; k < n; k++) { const bi = Math.floor(f.b) - k; const age = (f.b - bi) / 3; burst(f.c, 160 + hash(bi * 1.3) * 960, 110 + hash(bi * 2.1) * 200, age, cols[((bi % 4) + 4) % 4], 90 + hash(bi) * 60); }
};
function torii(c: CanvasRenderingContext2D, x: number, y: number, s: number) {
  c.fillStyle = '#d6342b'; c.fillRect(x - 150 * s, y - 230 * s, 26 * s, 230 * s); c.fillRect(x + 124 * s, y - 230 * s, 26 * s, 230 * s);
  c.beginPath(); c.moveTo(x - 200 * s, y - 240 * s); c.lineTo(x + 200 * s, y - 240 * s); c.lineTo(x + 170 * s, y - 215 * s); c.lineTo(x - 170 * s, y - 215 * s); c.closePath(); c.fill();
  c.fillRect(x - 160 * s, y - 180 * s, 320 * s, 18 * s); c.fillStyle = '#2b2542'; c.fillRect(x - 212 * s, y - 252 * s, 424 * s, 14 * s);
}
function pedestal(c: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number) {
  c.fillStyle = 'rgba(255,255,255,0.25)'; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fill(); c.strokeStyle = 'rgba(255,230,150,0.8)'; c.lineWidth = 4; c.stroke();
}

// ---------- 第二段主歌 ----------
S2.M01 = (f) => {
  const c = f.c; camApply(f, f.st * 30, -f.u * 80, 1.0 + 0.04 * f.u);
  world(f, 'mount', { peaks: true, density: 0.15 });
  c.fillStyle = '#5db6f0'; c.beginPath(); c.moveTo(560, GYs); c.bezierCurveTo(500, 560, 800, 600, 520, 720); c.lineTo(900, 720); c.bezierCurveTo(1000, 600, 700, 560, 700, GYs); c.fill();
  const dx = lerp(-300, 1500, f.u);
  actor(f, 'gpt', 'float', dx, 230, 2.6, { sil: 'rgba(30,30,70,0.7)', shadow: false, noFx: true });
  actor(f, 'whale', 'idle', 300, 640, 2.0); actor(f, 'claude', 'idle', 420, 640, 2.0);
  cloud(c, 900, 160, 1.3); cloud(c, 200, 120, 1.0); particles(f, 'gold', 14, 4);
};
const GYs = 520;

function drawMap(f: Frame, cx: number, cy: number, sc: number, p: number) {
  const c = f.c; paper(c, cx, cy, 700 * sc, 440 * sc, -0.02, '#f6e2b0'); c.save(); c.translate(cx, cy); c.rotate(-0.02); c.scale(sc, sc);
  c.fillStyle = '#9ed0f0'; c.beginPath(); c.moveTo(-340, -200); c.lineTo(-120, -210); c.lineTo(-200, -60); c.lineTo(-340, -40); c.fill();
  c.fillStyle = '#b9d68a'; c.beginPath(); c.moveTo(60, 80); c.lineTo(300, 40); c.lineTo(330, 200); c.lineTo(100, 210); c.fill();
  c.fillStyle = '#8fb06a'; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(-100 + i * 50, -120); c.lineTo(-80 + i * 50, -160); c.lineTo(-60 + i * 50, -120); c.fill(); }
  c.strokeStyle = '#a5451f'; c.lineWidth = 4; c.setLineDash([12, 10]); c.beginPath(); c.moveTo(-260, 140);
  const pts: [number, number][] = [[-160, 60], [-60, 120], [40, 20], [140, -60], [230, 60]];
  pts.forEach(([x, y], i) => { if (p * pts.length > i) { const k = clamp(p * pts.length - i); const [px, py] = i ? pts[i - 1] : [-260, 140]; c.lineTo(lerp(px, x, k), lerp(py, y, k)); } });
  c.stroke(); c.setLineDash([]);
  if (p > 0.9) { const r = 20 + 6 * f.pulse; glow(c, 230, 60, 90, '255,80,80', 0.5); c.strokeStyle = '#e63946'; c.lineWidth = 12; c.beginPath(); c.moveTo(230 - r, 60 - r); c.lineTo(230 + r, 60 + r); c.moveTo(230 + r, 60 - r); c.lineTo(230 - r, 60 + r); c.stroke(); }
  c.restore();
}
S2.M02 = (f) => {
  const c = f.c; camApply(f, 0, 0, 1); sky(f, '#1a2050', '#3a3f8f', H); starsLayer(f); c.fillStyle = '#232a66'; c.fillRect(-50, 620, W + 100, 200);
  const z = 1 + 0.55 * ease(f.u); c.save(); c.translate(640, 330); c.scale(z, z); c.translate(-640 - 230 * (z - 1) * 0.6, -330 - 60 * (z - 1) * 0.6); drawMap(f, 640, 330, 1.2, 1); c.restore();
  actor(f, 'whale', 'point', 260, 700, 2.4); actor(f, 'claude', 'tilt', 1020, 700, 2.4, { flip: true });
  particles(f, 'gold', 20, 6);
};
S2.M03 = (f) => {
  const c = f.c; camApply(f, 0, 0, 1.0 + 0.03 * f.u); sky(f, '#fff2d6', '#ffd9b0', H); c.fillStyle = '#f7c9a0'; c.fillRect(-50, 380, W + 100, 400);
  const split = easeOut(seg(f.u, 0.4, 0.85)) * 24; const reveal = seg(f.u, 0, 0.35); const n = 8;
  for (let i = 0; i < n; i++) {
    const x0 = i * (W / n), x1 = x0 + W / n - 6; if (x0 > W * reveal * 1.1) break; const off = (i % 2 ? 1 : -1) * split;
    c.fillStyle = '#d4a017'; c.fillRect(x0, 376 + off, x1 - x0, 8); c.fillStyle = '#ffe58a'; c.fillRect(x0, 376 + off, x1 - x0, 3);
    c.fillStyle = '#d4a017'; c.beginPath(); c.arc(x0 + 3, 380 + off, 10 + (i === Math.floor(f.b) % n ? 4 * f.pulse : 0), 0, 7); c.fill();
  }
  const wx = lerp(180, 900, f.u); actor(f, 'whale', 'walk', wx, 376 + (Math.floor(wx / (W / n)) % 2 ? 1 : -1) * split, 2.2);
  actor(f, 'zai', f.u < 0.6 ? 'alert' : 'nod', 1130, 640, 2.8, { t0: f.u < 0.6 ? 0 : f.dur * 0.6 }); sticker(f, 'prop_abacus', 1040, 580, 4.2);
  particles(f, 'gold', 16, 3);
};
S2.M04 = (f) => {
  const c = f.c; camApply(f, 0, 0, 1.0 + 0.04 * f.u); sky(f, '#fff2d6', '#ffd9b0', H); c.fillStyle = '#f7c9a0'; c.fillRect(-50, 420, W + 100, 400);
  const join = easeOut(seg(f.u, 0.05, 0.6)) ; const n = 8;
  for (let i = 0; i < n; i++) { const off = (i % 2 ? 1 : -1) * 24 * (1 - join), x0 = i * (W / n); c.fillStyle = '#d4a017'; c.fillRect(x0, 416 + off, W / n - 6 * (1 - join), 8); c.fillStyle = '#ffe58a'; c.fillRect(x0, 416 + off, W / n - 6 * (1 - join), 3); if (join > 0.95) { c.fillStyle = '#fff6b0'; sparkle(c, x0, 420, 8 + 6 * f.pulse); } }
  const m = ease(seg(f.u, 0.2, 0.85)); const wx = lerp(220, 560, m), cx = lerp(1060, 720, m);
  actor(f, 'whale', m < 0.98 ? 'walk' : 'idle', wx, 420, 2.4); actor(f, 'claude', m < 0.98 ? 'walk' : 'idle', cx, 420, 2.4, { flip: true });
  if (m > 0.95) { thread(c, wx + 30, 340, cx - 30, 340, 20, '#ffc933', 5); c.fillStyle = '#ff6b8a'; heart(c, (wx + cx) / 2, 290 - f.pulse * 8, 14); }
  particles(f, 'gold', 30, 7);
};
S2.M05 = (f) => {
  camApply(f, f.st * 20, 0, 1.0 + 0.03 * f.u); world(f, 'sunset', { road: true, trees: 'round', density: 0.3 });
  for (let i = 6; i >= 0; i--) actor(f, 'claude', 'lookaround', 800 + i * 70, 650 - i * 17, 3.0 * Math.pow(0.86, i), { alpha: 0.95 * Math.pow(0.8, i), t0: i * 0.12 });
  actor(f, 'whale', 'sway', 360, 680, 3.2);
  particles(f, 'petal', 70, 5);
};
S2.M06 = (f) => {
  const c = f.c; camApply(f, 0, 0, 1.0 + 0.04 * f.u); world(f, 'dusk', { trees: 'pine', density: 0.2 });
  torii(c, 640, 560, 2.0); for (const x of [380, 900]) { c.strokeStyle = '#2b2542'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, 190); c.lineTo(x, 250); c.stroke(); lantern(c, x, 275, 1.4); }
  for (let i = 0; i < 5; i++) { c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 3; c.beginPath(); for (let y = 0; y < 160; y += 6) c.lineTo(1100 + Math.sin(y * 0.07 + f.t * 2 + i) * 14 * (y / 160), 600 - y); c.stroke(); }
  actor(f, 'whale', 'idle', 580, 650, 2.8); actor(f, 'claude', 'idle', 730, 650, 2.8, { flip: true });
  thread(c, 615, 600, 700, 600, 14, '#e63946', 5);
  actor(f, 'qwen', 'bow', 1010, 650, 2.6, { flip: true }); sticker(f, 'prop_fan', 970, 590, 3.4);
  particles(f, 'lantern', 10, 4);
};
S2.M07 = (f) => {
  const c = f.c; camApply(f, 0, 0, 1.0 + 0.04 * f.u); sky(f, '#ffe3a1', '#ff9ab0', H); rays(c, 640, 360, 1200, 18, f.t * 0.15, 'rgba(255,255,255,0.22)');
  c.fillStyle = '#ffd9b0'; c.fillRect(-50, 560, W + 100, 200); glow(c, 640, 600, 640, '255,255,255', 0.35);
  pedestal(c, 640, 610, 430, 90); pedestal(c, 640, 610, 80, 22);
  const ids: [CharId, string][] = [['whale', 'idle'], ['gpt', 'float'], ['kimi', 'idle'], ['gemini', 'idle'], ['qwen', 'idle'], ['zai', 'idle'], ['doubao', 'idle']];
  const list = ids.map(([id, a], i) => { const ang = f.t * 0.45 + (i / ids.length) * Math.PI * 2; return { id, a, x: 640 + Math.cos(ang) * 400, y: 610 + Math.sin(ang) * 80, d: Math.sin(ang) }; }).sort((p, q) => p.d - q.d);
  for (const o of list) actor(f, o.id, o.a, o.x, o.y, 1.9 + 0.5 * o.d, { bob: bounce(f, 3) });
  glow(c, 640, 470, 200, '255,230,150', 0.5); actor(f, 'claude', 'curtsy', 640, 600, 3.0);
  particles(f, 'gold', 30, 3);
};
S2.M08 = (f) => {
  const c = f.c; const z = lerp(1.35, 1.0, ease(f.u)); camApply(f, 0, 0, z); sky(f, '#0f1240', '#3a3f8f', H); starsLayer(f);
  c.fillStyle = '#6b4a2f'; c.beginPath(); c.roundRect(430, 590, 420, 90, 14); c.fill(); c.fillStyle = '#8a5a3a'; c.fillRect(450, 590, 380, 18);
  c.save(); c.beginPath(); c.arc(640, 380, 250, 0, 7); c.clip();
  sky(f, '#7ec8ff', '#ffe9f2', 560); c.fillStyle = '#78c987'; c.beginPath(); c.ellipse(640, 640, 340, 140, 0, 0, 7); c.fill();
  c.fillStyle = '#62bd6c'; c.beginPath(); c.ellipse(640, 660, 300, 100, 0, 0, 7); c.fill();
  pineAt(c, 470, 540, 1.1, '#3d9a55'); pineAt(c, 820, 545, 1.0, '#3d9a55');
  actor(f, 'whale', 'idle', 590, 580, 1.7, { shadow: false }); actor(f, 'claude', 'idle', 690, 580, 1.7, { shadow: false });
  thread(c, 615, 530, 668, 530, 10, '#ffc933', 3); particles(f, 'snow', 40, 5);
  c.restore();
  const g = c.createRadialGradient(560, 280, 20, 640, 380, 260); g.addColorStop(0, 'rgba(255,255,255,0.35)'); g.addColorStop(0.8, 'rgba(255,255,255,0.04)'); g.addColorStop(1, 'rgba(255,255,255,0.3)'); c.fillStyle = g; c.beginPath(); c.arc(640, 380, 250, 0, 7); c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 5; c.beginPath(); c.arc(640, 380, 250, 0, 7); c.stroke(); c.fillStyle = 'rgba(255,255,255,0.7)'; c.beginPath(); c.ellipse(540, 240, 36, 16, -0.7, 0, 7); c.fill();
  particles(f, 'gold', 24, 8);
};
function pineAt(c: CanvasRenderingContext2D, x: number, y: number, s: number, col: string) {
  c.fillStyle = '#6a4a30'; c.fillRect(x - 4 * s, y - 10 * s, 8 * s, 14 * s);
  for (let k = 0; k < 3; k++) { c.fillStyle = k % 2 ? shade(col, 14) : col; c.beginPath(); c.moveTo(x, y - (70 - k * 4) * s); c.lineTo(x + (28 - k * 3) * s, y - (16 + k * 18) * s); c.lineTo(x - (28 - k * 3) * s, y - (16 + k * 18) * s); c.fill(); }
}

// ---------- 第二段副歌 ----------
S2.M09 = (f) => {
  const c = f.c; camApply(f, 0, 20, 1.0 + 0.05 * f.u); world(f, 'night', { density: 0.3 });
  glow(c, 760, 400, 420 + f.pulse * 60, '255,236,150', 0.5); rays(c, 760, 400, 800, 12, f.t * 0.6, 'rgba(255,240,170,0.2)');
  actor(f, 'claude', 'hop', 760, 650, 3.3); sticker(f, 'fx_shine', 880, 380, 6, { alpha: 0.6 + 0.4 * f.pulse });
  actor(f, 'whale', 'sway', 420, 660, 3.0); lantern(c, 500, 430, 2.4);
  particles(f, 'star', 40, 3); particles(f, 'gold', 20, 8);
};
S2.M10 = (f) => {
  const c = f.c; camApply(f, f.st * 25, 0, 1.0 + 0.03 * f.u); world(f, 'gray', { houses: true, trees: 'none', density: 0 });
  for (let i = 0; i < 4; i++) { const ids: CharId[] = ['gemini', 'qwen', 'zai', 'kimi']; actor(f, ids[i], 'walk', ((f.t * 60 + i * 380) % 1700) - 200, 560 + (i % 2) * 40, 2.0, { sil: '#6a6e7c', alpha: 0.8, flip: i % 2 === 1 }); }
  const sp = ease(seg(f.u, 0.5, 0.85)); c.fillStyle = `rgba(255,236,160,${0.28 * sp})`; c.beginPath(); c.moveTo(600, 0); c.lineTo(680, 0); c.lineTo(860, 700); c.lineTo(420, 700); c.fill();
  actor(f, 'whale', f.u < 0.55 ? 'sad' : 'nod', 640, 680, 3.2, { t0: f.u < 0.55 ? 0 : f.dur * 0.55 });
  c.fillStyle = `rgba(255,236,160,${0.5 * sp})`; c.fillRect(0, 0, 0, 0); particles(f, 'gold', Math.floor(30 * sp), 2);
};
S2.M11 = (f) => {
  const c = f.c; camApply(f, 0, 0, 1.0 + 0.06 * f.u); sky(f, '#ffd1e8', '#c9b6f2', H); starsLayer(f, 30, 0.7); moonDisc(c, 1020, 160, 60);
  for (let i = 0; i < 6; i++) cloud(c, i * 260 + Math.sin(f.t * 0.5 + i) * 20, 600 + (i % 2) * 20, 1.8, 'rgba(255,255,255,0.95)');
  actor(f, 'whale', 'sway', 575, 640, 3.7); actor(f, 'claude', 'idle', 715, 640, 3.7, { flip: true });
  particles(f, 'petal', 60, 4); particles(f, 'heart', 10, 6);
};
function mimosa(c: CanvasRenderingContext2D, x: number, y: number, s: number, open: number) {
  c.strokeStyle = '#4f8f4a'; c.lineWidth = 6 * s; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x - 20 * s, y - 100 * s, x + 6 * s, y - 190 * s); c.stroke();
  for (let i = 0; i < 8; i++) {
    const t = i / 7, px = x + Math.sin(t * 2.4) * 10 * s - 6 * s * t, py = y - (30 + t * 160) * s, len = (46 - t * 14) * s;
    for (const sd of [-1, 1]) { const ang = sd * (0.12 + open * 1.25) - Math.PI / 2 * 0 ; c.save(); c.translate(px, py); c.rotate(ang - sd * 0.0); c.fillStyle = shade('#5fb35a', -t * 20); c.beginPath(); c.ellipse(sd * len * 0.5 * (0.35 + open * 0.65), -len * 0.18 * (1 - open) - 2, len * 0.5, 6 * s, sd * -0.1, 0, 7); c.fill(); c.restore(); }
  }
  c.fillStyle = '#ff9ac8'; for (const [dx, dy] of [[6, -192], [-8, -176], [18, -172]]) poly(c, x + dx * s, y + dy * s, 12 * s, 8);
}
S2.M12 = (f) => {
  const c = f.c; camApply(f, 0, 0, 1.0 + 0.05 * f.u); world(f, 'spring', { trees: 'round', density: 0.3, noOrb: true });
  const op = f.u < 0.45 ? 1 - ease(f.u / 0.45) * 0.95 : 0.05 + 0.95 * ease(seg(f.u, 0.55, 0.95));
  mimosa(c, 640, 640, 2.3, op); if (f.u > 0.6) { c.fillStyle = '#fff6b0'; sparkle(c, 660, 210, 12 + 8 * f.pulse); sparkle(c, 600, 260, 8); }
  actor(f, 'whale', 'point', 330, 660, 3.0); actor(f, 'claude', f.u < 0.55 ? 'petri' : 'nod', 960, 660, 3.0, { flip: true, t0: f.u < 0.55 ? 0 : f.dur * 0.55 });
  particles(f, 'petal', 20, 6);
};
S2.M13 = (f) => {
  const c = f.c; camApply(f, 0, 0, 1.0 + 0.05 * f.u); sky(f, '#12083a', '#5a2a8a', H); starsLayer(f, 60); c.fillStyle = '#2a1458'; c.fillRect(-50, 620, W + 100, 200);
  const k = ease(seg(f.u, 0, 0.85)); const R = lerp(260, 0, k);
  glow(c, 640, 340, 380, '255,215,110', 0.35 + 0.25 * k);
  for (let i = 0; i < 2; i++) { const a = f.t * 2.2 + i * Math.PI; ring(c, 640 + Math.cos(a) * R, 340 + Math.sin(a) * R * 0.5, 44 + k * 22, a * 0.5, 1); }
  if (k > 0.9) { c.fillStyle = '#fff6b0'; sparkle(c, 640, 340, 70 + 30 * f.pulse); }
  fireworks(f, 3);
  actor(f, 'whale', 'hop', 360, 690, 3.0); actor(f, 'claude', 'hop', 920, 690, 3.0, { flip: true, t0: 0.15 });
  particles(f, 'gold', 40, 4);
};
S2.M14 = (f) => {
  const c = f.c; camApply(f, 0, 0, 1.0 + 0.04 * f.u); world(f, 'sunset', { trees: 'round', density: 0.35 });
  actor(f, 'whale', 'idle', 570, 640, 2.9); actor(f, 'claude', 'idle', 740, 640, 2.9, { flip: true });
  c.fillStyle = '#7a4b2a'; c.fillRect(440, 600, 460, 18); c.fillRect(440, 540, 460, 12); c.fillRect(460, 618, 14, 70); c.fillRect(866, 618, 14, 70);
  particles(f, 'leaf', 24, 3); for (let i = 0; i < 3; i++) { const x = ((f.t * 40 + i * 300) % 1500) - 100; c.fillStyle = '#4a2a3f'; c.fillRect(x, 160 + i * 40 + Math.sin(f.t * 6 + i) * 6, 14, 3); c.fillRect(x + 14, 156 + i * 40 + Math.sin(f.t * 6 + i) * 6, 14, 3); }
};
S2.M15 = (f) => {
  const c = f.c; camApply(f, f.st * 200, 0, 1.0 + 0.03 * f.u); world(f, 'night', { road: true, density: 0.4 }); fireworks(f, 4);
  const wx = 520, cx2 = 800, hy = 650 - 120; walkers(f, 3.2, 660, wx, cx2 - wx);
  thread(c, wx + 38, hy + 12, cx2 - 38, hy + 12, 24 + Math.sin(f.t * 4) * 4, '#ffc933', 5);
  particles(f, 'gold', 24, 6);
};
S2.M16 = (f) => {
  const c = f.c; camApply(f, 0, 0, 1.0); world(f, 'night', { road: true, trees: 'none', density: 0 });
  for (let i = 0; i < 8; i++) { const p = ((i + (f.t * 0.8) % 1) / 8); const y = 520 + (H - 520) * p * p, o = 40 + 560 * p * p; lantern(c, 640 - o, y - 60 * p * p * 3, 0.4 + 2.1 * p * p); lantern(c, 640 + o, y - 60 * p * p * 3, 0.4 + 2.1 * p * p); }
  const p = ease(f.u); const y = lerp(670, 548, p), s = lerp(3.0, 1.1, p);
  actor(f, 'whale', 'walk', lerp(560, 620, p), y, s); actor(f, 'claude', 'walk', lerp(720, 668, p), y, s);
  particles(f, 'star', 30, 5);
};

// ---------- 第二段间奏 ----------
S2.K1 = (f) => {
  const c = f.c; camApply(f, f.st * 150, 0, 1.0 + 0.05 * f.u); world(f, 'night', { trees: 'pine', density: 0.5 }); walkers(f);
  const ph = (f.st * 0.7) % 1.2, x = 1100 - ph * 700, y = 60 + ph * 300; const g = c.createLinearGradient(x, y, x + 140, y - 100); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.strokeStyle = g; c.lineWidth = 5; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 140, y - 100); c.stroke();
  particles(f, 'firefly', 14, 8);
};
S2.K2 = (f) => {
  const c = f.c; camApply(f, 0, 0, 1.0 + 0.04 * f.u); world(f, 'sea', { trees: 'none', density: 0 }); waves(f, 470, '#2f86c8', 8, 2);
  c.fillStyle = '#f5dca0'; c.fillRect(-50, 560, W + 100, 200); c.fillStyle = '#ecc986'; for (let i = 0; i < 6; i++) c.fillRect(-50, 580 + i * 26, W + 100, 4);
  const x = lerp(260, 900, f.u); for (let i = 0; x - i * 46 > 120; i++) { c.fillStyle = 'rgba(180,130,70,0.5)'; c.fillRect(x - 60 - i * 46, 666 + (i & 1) * 10, 12, 6); c.fillRect(x + 100 - i * 46, 672 + (i & 1) * 10, 12, 6); }
  walkers(f, 2.7, 660, x, 170); particles(f, 'gold', 12, 3);
};
S2.K3 = (f) => {
  const c = f.c; camApply(f, f.st * 140, 0, 1.0); world(f, 'day', { trees: 'round', density: 0.4 });
  const a = ease(seg(f.u, 0.25, 0.8)); const cols = ['#ff595e', '#ff924c', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93'];
  c.save(); c.globalAlpha = a; cols.forEach((col, i) => { c.strokeStyle = col; c.lineWidth = 24; c.beginPath(); c.arc(640, 560, 480 - i * 24, Math.PI, Math.PI * 2); c.stroke(); }); c.restore();
  walkers(f); if (f.u < 0.55) { particles(f, 'rain', Math.floor(80 * (1 - f.u / 0.55)), 4); c.fillStyle = 'rgba(60,70,100,0.25)'; c.fillRect(0, 0, W, H); } else particles(f, 'gold', 20, 5);
};
S2.K4 = (f) => { camApply(f, f.st * 140, 0, 1.0 + 0.04 * f.u); world(f, 'autumn', { trees: 'round', density: 0.6 }); actor(f, 'whale', 'hop', 420, 660, 2.6); actor(f, 'claude', 'walk', 590, 660, 2.6, { bob: bounce(f, 3) }); particles(f, 'leaf', 90, 4); fgBush(f, '#8a3d1a'); };
S2.K5 = (f) => {
  const c = f.c; camApply(f, f.st * 20, 0, 1.0 + 0.04 * f.u); world(f, 'snow', { houses: true, trees: 'pine', density: 0.2 });
  actor(f, 'doubao', 'walk', lerp(1380, 700, f.u), 570, 1.9, { hat: 'santa', flip: true }); sticker(f, 'prop_basket', lerp(1380, 700, f.u) - 46, 540, 3);
  c.fillStyle = '#8a5a3a'; c.fillRect(120, 610, 640, 18);
  actor(f, 'whale', 'wave', 320, 640, 3.0); actor(f, 'claude', 'curtsy', 520, 640, 3.0, { t0: 0.2 }); particles(f, 'snow', 80, 6);
};
S2.K6 = (f) => {
  const c = f.c; camApply(f, 0, 0, 1.0 + 0.04 * f.u); world(f, 'spring', { trees: 'round', density: 0.4 });
  c.fillStyle = '#ff8fa3'; c.beginPath(); c.moveTo(250, 720); c.lineTo(420, 590); c.lineTo(1010, 590); c.lineTo(1160, 720); c.fill(); c.fillStyle = '#fff'; for (let i = 0; i < 10; i++) for (let j = 0; j < 3; j++) if ((i + j) % 2) c.fillRect(280 + i * 86 + j * 4, 600 + j * 40, 40, 40);
  actor(f, 'whale', 'eat', 560, 680, 2.5); actor(f, 'claude', 'idle', 720, 680, 2.5, { flip: true }); actor(f, 'qwen', 'sway', 900, 660, 2.3, { flip: true }); sticker(f, 'prop_teacup', 850, 600, 3.4);
  actor(f, 'zai', 'doze', 400, 660, 2.3); actor(f, 'gemini', 'hop', 1080, 640, 2.3, { flip: true }); particles(f, 'petal', 40, 3);
};
S2.K7 = (f) => {
  const c = f.c; camApply(f, 0, 0, 1.0 + 0.05 * f.u); world(f, 'night', { trees: 'none', density: 0 });
  roundTree(c, 640, 700, 6, '#233a6a', '#10163a'); for (let i = 0; i < 12; i++) lantern(c, 400 + hash(i) * 480, 160 + hash(i + 3) * 260, 0.7);
  actor(f, 'whale', 'idle', 560, 680, 2.6); actor(f, 'claude', 'idle', 720, 680, 2.6, { flip: true }); particles(f, 'firefly', 60, 3); particles(f, 'heart', 6, 2);
};
S2.K8 = (f) => {
  const c = f.c; camApply(f, 0, 0, 1.0 + 0.1 * f.u); sky(f, '#3a1c5e', '#d67a8a', H);
  for (let i = 0; i < 18; i++) { const x = hash(i) * W, y = hash(i + 5) * H, r = 30 + hash(i + 9) * 70; glow(c, x + Math.sin(f.t + i) * 20, y, r, ['255,210,120', '255,140,170', '170,220,255'][i % 3], 0.35); }
  const p = ease(seg(f.u, 0, 0.5)); const lx = lerp(160, 380, p), rx = lerp(1120, 900, p);
  sprite(f, 'p_whale_neutral', lx, 560, 7, { shadow: false }); sprite(f, 'p_claude_neutral', rx, 560, 7, { shadow: false, flip: true });
  thread(c, lx + 120, 400, rx - 120, 400, 36, '#ffc933', 7); ring(c, (lx + rx) / 2, 440, 34 + 6 * f.pulse, f.t, 1);
  if (f.u > 0.9) { c.fillStyle = `rgba(255,255,255,${(f.u - 0.9) * 8})`; c.fillRect(0, 0, W, H); }
  particles(f, 'heart', 14, 4); particles(f, 'gold', 26, 9);
};

// ---------- 终章 ----------
S2.F01 = (f) => {
  const c = f.c; camApply(f, 0, 0, 1 + 0.2 * f.u); sky(f, '#0d0830', '#3a1c5e', H); starsLayer(f, 70);
  const k = easeOut(f.u); glow(c, 640, 330, 420 * k + 60, '255,215,110', 0.6); ring(c, 640, 330, 40 + 90 * k, f.t, 1);
  actor(f, 'whale', 'nod', 380, 690, 3.0); actor(f, 'claude', 'nod', 900, 690, 3.0, { flip: true });
};
S2.F02 = (f) => {
  const c = f.c; camApply(f, 0, 0, 1.0 + 0.12 * f.u); world(f, 'sunset', { trees: 'round', density: 0.3 });
  const g = c.createRadialGradient(640, 420, 40, 640, 420, 700); g.addColorStop(0, 'rgba(255,200,170,0.4)'); g.addColorStop(1, 'rgba(255,150,170,0.05)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
  const k = ease(seg(f.u, 0, 0.5)); actor(f, 'whale', 'sway', lerp(480, 585, k), 660, 3.9); actor(f, 'claude', 'idle', lerp(800, 700, k), 660, 3.9, { flip: true });
  particles(f, 'heart', 30, 3); particles(f, 'petal', 30, 5);
};
S2.F03 = (f) => {
  const c = f.c; camApply(f, 0, f.u * -30, 1.0 + 0.03 * f.u); world(f, 'dawn', { trees: 'round', density: 0.3, noOrb: true });
  const sy = lerp(520, 300, ease(f.u)); glow(c, 640, sy, 600, '255,230,150', 0.6); rays(c, 640, sy, 1200, 20, f.t * 0.12, 'rgba(255,240,170,0.2)'); c.fillStyle = '#fff1b5'; poly(c, 640, sy, 90, 14);
  actor(f, 'whale', 'idle', 560, 660, 3.1); actor(f, 'claude', 'idle', 740, 660, 3.1, { flip: true }); particles(f, 'gold', 30, 3);
};
S2.F04 = (f) => {
  const c = f.c; camApply(f, 0, -f.u * 50, 1.0 + 0.05 * f.u); world(f, 'mount', { peaks: true, density: 0.1 });
  c.fillStyle = '#7a809c'; c.beginPath(); c.moveTo(220, 720); c.lineTo(520, 560); c.lineTo(780, 560); c.lineTo(1060, 720); c.fill();
  flag(c, 650, 560, 2.2, f.t); actor(f, 'whale', 'hop', 520, 570, 2.6); actor(f, 'claude', 'hop', 790, 570, 2.6, { flip: true, t0: 0.1 });
  rays(c, 650, 400, 1000, 12, f.t * 0.25, 'rgba(255,240,170,0.2)'); particles(f, 'gold', 30, 4);
};
S2.F05 = (f) => {
  const c = f.c; camApply(f, 0, 0, 1.0 + 0.04 * f.u); world(f, 'spring', { trees: 'round', density: 0.3 });
  actor(f, 'whale', 'sway', 520, 650, 3.2); actor(f, 'claude', 'idle', 780, 650, 3.2, { flip: true });
  for (let r = 0; r < 3; r++) for (let i = 0; i < 40; i++) { const x = hash(i + r * 50) * W, y = 600 + r * 50 + hash(i + 9) * 40; const sw = Math.sin(f.t * 2 + i) * 4; c.fillStyle = ['#ff8fa3', '#ffd166', '#fff', '#b8a1ff'][i % 4]; poly(c, x + sw, y - 20 - r * 6, 9 + r * 3, 6); c.fillStyle = '#3d9a55'; c.fillRect(x + sw - 1, y - 14 - r * 6, 3, 28); }
  particles(f, 'petal', 80, 9);
};
S2.F06 = (f) => {
  const c = f.c; camApply(f, 0, 0, 1.0); sky(f, '#2b1458', '#8a3fa0', H); glow(c, 640, 360, 560, '255,210,110', 0.3);
  paper(c, 640, 350, 640, 450, 0, '#fff3cf'); c.strokeStyle = '#d4a017'; c.lineWidth = 6; c.strokeRect(340, 140, 600, 420);
  scribble2(c, 400, 200, 480, 5); ring(c, 520, 470, 28, 0.2, 0.6); ring(c, 590, 470, 28, -0.2, 0.6);
  const k = seg(f.u, 0.35, 0.55); const sc = lerp(3, 1, easeOut(k)); const shake = k >= 1 ? Math.sin(f.u * 90) * 4 * Math.max(0, 1 - (f.u - 0.55) * 8) : 0;
  c.save(); c.translate(780 + shake, 450); c.scale(sc, sc); c.globalAlpha = clamp(k * 3); c.rotate(-0.12); c.fillStyle = '#d6342b'; c.beginPath(); c.roundRect(-60, -60, 120, 120, 14); c.fill(); text(c, '誓', 0, 4, 90, '#fff3cf'); c.restore();
  if (k >= 1) { burst(c, 780, 450, (f.u - 0.55) * 3, '#ffd166', 160, 20); glow(c, 780, 450, 260, '255,215,110', 0.4 * (1 - (f.u - 0.55) * 2)); }
  actor(f, 'whale', 'bow', 200, 700, 2.8); actor(f, 'claude', 'nod', 1080, 700, 2.8, { flip: true }); particles(f, 'gold', 36, 5);
};
function scribble2(c: CanvasRenderingContext2D, x: number, y: number, w: number, n: number) {
  c.strokeStyle = '#b9893a'; c.lineWidth = 3; c.lineCap = 'round';
  for (let i = 0; i < n; i++) { c.beginPath(); c.moveTo(x, y + i * 40); for (let j = 0; j <= 20; j++) c.lineTo(x + (j / 20) * w * (i === n - 1 ? 0.5 : 1), y + i * 40 + Math.sin(j * 1.5 + i * 2) * 5); c.stroke(); }
}
S2.F07 = (f) => {
  const c = f.c; const ks = ['dawn', 'day', 'sunset', 'night']; const k = ks[Math.min(3, Math.floor(f.u * 4))]; camApply(f, 0, 0, 1.0 + 0.04 * f.u);
  world(f, k, { trees: 'round', density: 0.35 });
  c.fillStyle = '#7a4b2a'; c.fillRect(440, 600, 460, 18); c.fillRect(440, 540, 460, 12); c.fillRect(460, 618, 14, 70); c.fillRect(866, 618, 14, 70);
  actor(f, 'whale', 'idle', 570, 640, 2.9); actor(f, 'claude', 'idle', 740, 640, 2.9, { flip: true });
  hourglass(c, 1080, 420, 1.2, f.u); particles(f, k === 'night' ? 'firefly' : 'gold', 20, 4);
};
S2.F08 = (f) => {
  const c = f.c; camApply(f, f.st * 170, 0, 1.0 + 0.03 * f.u); world(f, 'sunset', { road: true, trees: 'pine', density: 0.4 });
  const crew: [CharId, number][] = [['doubao', 70], ['zai', 200], ['qwen', 330], ['gemini', 460], ['kimi', 590]];
  crew.forEach(([id, x], i) => actor(f, id, 'walk', x, 640 + (i % 2) * 14, 2.3, { bob: bounce(f, 3) }));
  actor(f, 'gpt', 'float', 330, 230, 2.4);
  const wx = 780, cx2 = 1030, hy = 650 - 112; walkers(f, 3.0, 660, wx, cx2 - wx); thread(c, wx + 36, hy + 12, cx2 - 36, hy + 12, 24, '#ffc933', 5);
  particles(f, 'gold', 24, 7);
};
S2.F09 = (f) => {
  const c = f.c; camApply(f, 0, 0, 1.0); world(f, 'sunset', { road: true, trees: 'pine', density: 0.5 }); glow(c, 760, 410, 420, '255,220,150', 0.55);
  const p = ease(f.u); const y = lerp(660, 540, p), s = lerp(2.8, 1.0, p);
  const crew: [CharId, number, number][] = [['doubao', -230, 0], ['zai', -170, 1], ['qwen', -110, 0], ['gemini', 120, 1], ['kimi', 190, 0]];
  crew.forEach(([id, dx, o]) => actor(f, id, 'walk', lerp(640 + dx * 2.2, 640 + dx * 0.5, p), y + o * 8 * (1 - p), s * 0.85, { alpha: 1 }));
  actor(f, 'whale', 'walk', lerp(560, 624, p), y, s); actor(f, 'claude', 'walk', lerp(730, 658, p), y, s);
  particles(f, 'petal', 40, 3); particles(f, 'lantern', 10, 2);
  if (f.u > 0.8) { c.fillStyle = `rgba(255,248,225,${(f.u - 0.8) * 1.5})`; c.fillRect(0, 0, W, H); }
};
S2.OUT = (f) => {
  const c = f.c; camApply(f, 0, 0, 1.0 + 0.02 * f.u); sky(f, '#6b1d2e', '#3a0f22', H); c.fillStyle = '#7a3b24'; c.fillRect(-50, 470, W + 100, 300); glow(c, 640, 330, 520, '255,210,140', 0.3);
  const th = (1 - ease(seg(f.u, 0.05, 0.5))) * Math.PI * 0.94; const bw = 560, bh = 360, cx = 640, cy = 330;
  paper(c, cx, cy + 14, bw + 14, bh + 10, 0, '#e8d3a8'); c.fillStyle = '#fff8e7'; c.fillRect(cx - bw / 2, cy - bh / 2, bw, bh);
  if (th > 0.05) { glow(c, cx + 20, cy, 360, '255,236,160', 0.5); scribble2(c, cx + 40, cy - 100, 200, 5); }
  c.save(); c.translate(cx - bw / 2, cy); c.scale(Math.cos(th), 1); const front = th < Math.PI / 2;
  c.fillStyle = front ? '#2b3a8f' : '#fff3cf'; c.shadowColor = 'rgba(0,0,0,0.45)'; c.shadowBlur = 18; c.fillRect(0, -bh / 2, bw, bh); c.shadowColor = 'transparent';
  if (front) { c.strokeStyle = '#ffd35a'; c.lineWidth = 6; c.strokeRect(18, -bh / 2 + 18, bw - 36, bh - 36); text(c, '勾指起誓', bw / 2, -20, 92, '#ffe08a', 'center', '#7a4a10'); text(c, '愿你我，岁月同行', bw / 2, 60, 28, '#fff3cf'); }
  c.restore();
  actor(f, 'whale', 'idle', 190, 690, 2.9); actor(f, 'claude', 'idle', 1090, 690, 2.9, { flip: true }); particles(f, 'gold', 24, 3);
  c.fillStyle = `rgba(10,5,20,${ease(seg(f.u, 0.7, 1))})`; c.fillRect(0, 0, W, H);
};
void PAL; void sky; void waves; void thread; void ring; void moonDisc;
