// 画面积木：纸雕信纸世界的绘制原语。全部是纯函数（只读参数里的时间），任意跳帧得到同一帧。
export const W = 1920, H = 1080;
export const PI = Math.PI, TAU = Math.PI * 2;
export const FONT = '"ZCOOL KuaiLe", "ZCOOLKuaiLe", "Noto Sans SC", sans-serif';

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const seg = (u: number, a: number, b: number) => clamp((u - a) / (b - a));
export const ease = (t: number) => { t = clamp(t); return t * t * (3 - 2 * t); };
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
export const easeIn = (t: number) => Math.pow(clamp(t), 3);
export const backOut = (t: number) => { t = clamp(t) - 1; return Math.max(0, 1 + t * t * ((1.7 + 1) * t + 1.7)); };
export const pulseOf = (phase: number, k = 5) => Math.exp(-phase * k); // 拍点上 1，随后衰减
export function hash(i: number): number { let x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
export function hash2(i: number, j: number): number { return hash(i * 57.31 + j * 13.7 + 0.37); }
export const many = <T,>(n: number, f: (i: number) => T): T[] => Array.from({ length: n }, (_, i) => f(i));

export type Ctx = CanvasRenderingContext2D;

// ---------- 色板（纸雕 + 墨线） ----------
export const INK = '#3a2d2b';
export const PAPER = '#f6ecd9';
export const GOLD = '#f2c14e';
export const GOLD_DEEP = '#d99a2b';
export const LOOKS = {
  day: { top: '#8fd0f0', bottom: '#eaf6ff', ground: '#9ed38a', far: '#bfe0d6', mid: '#86c593', near: '#5fae76' },
  golden: { top: '#f7c58f', bottom: '#ffeedb', ground: '#d8c38b', far: '#f0c8a8', mid: '#d6a77a', near: '#b7845a' },
  dusk: { top: '#5b4a9a', bottom: '#ff9f80', ground: '#6e5a86', far: '#9d7fb5', mid: '#7a5f99', near: '#4f3f6f' },
  night: { top: '#121a3f', bottom: '#2c3a78', ground: '#1f2a4f', far: '#2b386b', mid: '#22305c', near: '#17223f' },
  snow: { top: '#b9d4ea', bottom: '#f3f8ff', ground: '#f4f8fc', far: '#d7e6f3', mid: '#c4d8ea', near: '#aec8df' },
  magic: { top: '#2f1d5c', bottom: '#8f5bbf', ground: '#4a2f7a', far: '#6a4a9c', mid: '#573a88', near: '#3b2766' },
  storm: { top: '#3a4555', bottom: '#8b98a6', ground: '#5c6b6e', far: '#7d8b93', mid: '#5f6f78', near: '#44535c' },
  paper: { top: '#f3e7cf', bottom: '#fbf5e8', ground: '#e8d8b8', far: '#e2d2b0', mid: '#d4c098', near: '#c2a97e' },
  pink: { top: '#f9c8d8', bottom: '#fff1f4', ground: '#f3d7df', far: '#f6d9e4', mid: '#efbfd0', near: '#e4a6bb' },
} as const;
export type Look = keyof typeof LOOKS;

// ---------- 画布基础 ----------
export function sky(ctx: Ctx, look: Look, alpha = 1): void {
  const L = LOOKS[look];
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, L.top); g.addColorStop(1, L.bottom);
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
}
export function fill(ctx: Ctx, color: string, alpha = 1): void { ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.fillRect(0, 0, W, H); ctx.restore(); }
export function vignette(ctx: Ctx, strength = 0.35, color = '20,12,8'): void {
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
  g.addColorStop(0, `rgba(${color},0)`); g.addColorStop(1, `rgba(${color},${strength})`);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
let grainCanvas: HTMLCanvasElement | null = null;
export function paperGrain(ctx: Ctx, alpha = 0.08): void {
  if (!grainCanvas) {
    grainCanvas = document.createElement('canvas'); grainCanvas.width = 480; grainCanvas.height = 270;
    const g = grainCanvas.getContext('2d')!;
    for (let i = 0; i < 9000; i++) { const x = hash(i) * 480, y = hash(i + 9001) * 270; g.fillStyle = hash(i + 77) > 0.5 ? 'rgba(90,60,30,0.5)' : 'rgba(255,255,255,0.6)'; g.fillRect(x, y, 1 + hash(i + 3) * 1.5, 1); }
  }
  ctx.save(); ctx.globalAlpha = alpha; ctx.imageSmoothingEnabled = true; ctx.drawImage(grainCanvas, 0, 0, W, H); ctx.restore();
}

/** 2D 机位：以画面中心为枢轴缩放，depth>1 的层随机位移动得更慢（视差） */
export interface Cam { x: number; y: number; z: number }
export function view(ctx: Ctx, cam: Cam, depth: number, fn: () => void): void {
  ctx.save();
  ctx.translate(W / 2, H / 2);
  const z = 1 + (cam.z - 1) / Math.max(1, depth * 0.6);
  ctx.scale(z, z);
  ctx.translate(-W / 2 - cam.x / depth, -H / 2 - cam.y / depth);
  fn();
  ctx.restore();
}
export const cam = (x = 0, y = 0, z = 1): Cam => ({ x, y, z });
export const glide = (a: Cam, b: Cam, u: number): Cam => ({ x: lerp(a.x, b.x, ease(u)), y: lerp(a.y, b.y, ease(u)), z: lerp(a.z, b.z, ease(u)) });

// ---------- 天体与天气 ----------
export function sun(ctx: Ctx, x: number, y: number, r: number, color = '#ffe08a', glow = 3): void {
  r = Math.max(1, r);
  const g = ctx.createRadialGradient(x, y, r * 0.2, x, y, r * glow);
  g.addColorStop(0, color); g.addColorStop(0.35, color + 'aa'); g.addColorStop(1, color + '00');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * glow, 0, TAU); ctx.fill();
  ctx.fillStyle = '#fff6cf'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
}
export function moon(ctx: Ctx, x: number, y: number, r: number, glowAlpha = 0.6): void {
  const g = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * 3.2);
  g.addColorStop(0, `rgba(255,243,200,${glowAlpha})`); g.addColorStop(1, 'rgba(255,243,200,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 3.2, 0, TAU); ctx.fill();
  ctx.fillStyle = '#fff4cc'; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(214,196,150,0.55)';
  [[-0.35, -0.2, 0.18], [0.25, 0.1, 0.13], [0.05, 0.45, 0.1], [-0.1, -0.55, 0.08]].forEach(([dx, dy, rr]) => { ctx.beginPath(); ctx.arc(x + dx * r, y + dy * r, rr * r, 0, TAU); ctx.fill(); });
  ctx.strokeStyle = 'rgba(120,100,70,0.35)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
}
export function stars(ctx: Ctx, T: number, n = 120, seed = 0, alpha = 1, yMax = H * 0.7): void {
  ctx.save(); ctx.fillStyle = '#fff8e1';
  for (let i = 0; i < n; i++) {
    const x = hash(i + seed) * W, y = hash(i + seed + 500) * yMax;
    const tw = 0.5 + 0.5 * Math.sin(T * (1.5 + hash(i + 31) * 2) + hash(i + 7) * TAU);
    const s = 1 + hash(i + 99) * 2.2;
    ctx.globalAlpha = alpha * (0.35 + 0.65 * tw);
    ctx.fillRect(x - s / 2, y - s / 2, s, s);
    if (s > 2.6) { ctx.fillRect(x - s * 1.6, y - 0.5, s * 3.2, 1); ctx.fillRect(x - 0.5, y - s * 1.6, 1, s * 3.2); }
  }
  ctx.restore();
}
export function cloud(ctx: Ctx, x: number, y: number, s: number, color = '#ffffff', alpha = 0.95, outline = true): void {
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.strokeStyle = 'rgba(80,60,50,0.25)'; ctx.lineWidth = 3;
  const puffs = [[0, 0, 1], [-0.9, 0.15, 0.75], [0.95, 0.12, 0.8], [-0.4, -0.45, 0.7], [0.45, -0.5, 0.65], [1.7, 0.3, 0.5], [-1.6, 0.35, 0.5]];
  ctx.beginPath();
  for (const [dx, dy, r] of puffs) { ctx.moveTo(x + dx * s + r * s, y + dy * s); ctx.arc(x + dx * s, y + dy * s, r * s, 0, TAU); }
  ctx.fill(); if (outline) ctx.stroke();
  ctx.restore();
}
export function petals(ctx: Ctx, T: number, n = 40, color = '#ffb7c5', seed = 0, speed = 1, wind = 60): void {
  ctx.save(); ctx.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const life = 9 + hash(i + seed) * 6;
    const ph = ((T * speed) / life + hash(i + seed + 11)) % 1;
    const x = ((hash(i + seed + 3) * W * 1.4 - W * 0.2 + ph * wind * 6 + Math.sin(T * 1.3 + i) * 40) % (W * 1.4) + W * 1.4) % (W * 1.4) - W * 0.2;
    const y = -40 + ph * (H + 80);
    ctx.globalAlpha = 0.85 * Math.sin(ph * PI) + 0.1;
    ctx.save(); ctx.translate(x, y); ctx.rotate(T * 2 + i); ctx.scale(1, 0.55 + 0.45 * Math.sin(T * 4 + i));
    ctx.beginPath(); ctx.ellipse(0, 0, 7 + hash(i + 5) * 6, 5 + hash(i + 6) * 3, 0, 0, TAU); ctx.fill(); ctx.restore();
  }
  ctx.restore();
}
export function snow(ctx: Ctx, T: number, n = 160, seed = 0, alpha = 0.9): void {
  ctx.save(); ctx.fillStyle = '#ffffff';
  for (let i = 0; i < n; i++) {
    const sp = 40 + hash(i + seed) * 60, r = 1.5 + hash(i + seed + 1) * 3.5;
    const y = ((hash(i + seed + 2) * H + T * sp) % (H + 40)) - 20;
    const x = (hash(i + seed + 3) * W + Math.sin(T * 0.8 + i) * 30 + T * 12) % W;
    ctx.globalAlpha = alpha * (0.4 + 0.6 * hash(i + 4));
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
  ctx.restore();
}
export function rain(ctx: Ctx, T: number, n = 220, seed = 0, alpha = 0.5, slant = 0.25): void {
  ctx.save(); ctx.strokeStyle = `rgba(210,225,240,${alpha})`; ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const sp = 900 + hash(i + seed) * 500, len = 18 + hash(i + seed + 1) * 22;
    const y = ((hash(i + seed + 2) * H + T * sp) % (H + 60)) - 30;
    const x = (hash(i + seed + 3) * (W + 300) - 150 - y * slant * 0.3 + W) % (W + 300) - 150;
    ctx.moveTo(x, y); ctx.lineTo(x - len * slant, y + len);
  }
  ctx.stroke(); ctx.restore();
}
export function sparkles(ctx: Ctx, T: number, cx: number, cy: number, rad: number, n = 14, color = '#fff2a8', seed = 0, size = 10): void {
  ctx.save(); ctx.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const ph = (T * (0.5 + hash(i + seed) * 0.6) + hash(i + seed + 2)) % 1;
    const a = hash(i + seed + 1) * TAU, r = rad * (0.3 + 0.7 * hash(i + seed + 3));
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r - ph * 40;
    const s = size * Math.sin(ph * PI) * (0.5 + hash(i + 9) * 0.5);
    ctx.globalAlpha = Math.sin(ph * PI);
    star4(ctx, x, y, s);
  }
  ctx.restore();
}
export function star4(ctx: Ctx, x: number, y: number, s: number): void {
  ctx.beginPath(); ctx.moveTo(x, y - s); ctx.quadraticCurveTo(x, y, x + s, y); ctx.quadraticCurveTo(x, y, x, y + s); ctx.quadraticCurveTo(x, y, x - s, y); ctx.quadraticCurveTo(x, y, x, y - s); ctx.fill();
}
export function lightShaft(ctx: Ctx, x: number, topY: number, w: number, h: number, color = '255,240,200', alpha = 0.35): void {
  const g = ctx.createLinearGradient(0, topY, 0, topY + h);
  g.addColorStop(0, `rgba(${color},${alpha})`); g.addColorStop(1, `rgba(${color},0)`);
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - w * 0.25, topY); ctx.lineTo(x + w * 0.25, topY); ctx.lineTo(x + w, topY + h); ctx.lineTo(x - w, topY + h); ctx.closePath(); ctx.fill();
}
export function glowSpot(ctx: Ctx, x: number, y: number, r: number, color = '255,230,170', alpha = 0.5): void {
  r = Math.max(1, r);
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${color},${alpha})`); g.addColorStop(1, `rgba(${color},0)`);
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
}

// ---------- 地形 ----------
/** 一排纸雕山丘：baseY 为谷底，amp 为起伏，offset 做视差平移 */
export function hills(ctx: Ctx, baseY: number, color: string, amp = 120, freq = 1.2, phase = 0, offset = 0, outline = true): void {
  ctx.save(); ctx.fillStyle = color; ctx.strokeStyle = 'rgba(60,40,30,0.28)'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-50, H + 10);
  for (let x = -50; x <= W + 50; x += 16) {
    const xx = (x + offset) / W;
    const y = baseY - amp * (0.55 + 0.45 * Math.sin(xx * freq * TAU + phase)) - amp * 0.35 * Math.sin(xx * freq * 3.1 * TAU + phase * 2.3) - amp * 0.15 * Math.sin(xx * freq * 7.3 * TAU + phase * 0.7);
    ctx.lineTo(x, y);
  }
  ctx.lineTo(W + 50, H + 10); ctx.closePath(); ctx.fill(); if (outline) ctx.stroke();
  ctx.restore();
}
export function ground(ctx: Ctx, y: number, color: string, outline = true): void {
  ctx.fillStyle = color; ctx.fillRect(-100, y, W + 200, H - y + 100);
  if (outline) { ctx.strokeStyle = 'rgba(60,40,30,0.3)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-100, y); ctx.lineTo(W + 100, y); ctx.stroke(); }
}
/** 透视小路：从底边向消失点收拢，center dashes 随 T 向前流动 */
export function road(ctx: Ctx, horizonY: number, vx: number, nearW: number, T: number, color = '#e9d6b0', edge = 'rgba(80,60,40,0.45)', bottomY = H + 20): void {
  ctx.save();
  ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(W / 2 - nearW / 2, bottomY); ctx.lineTo(vx - 8, horizonY); ctx.lineTo(vx + 8, horizonY); ctx.lineTo(W / 2 + nearW / 2, bottomY); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = edge; ctx.lineWidth = 4; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 3;
  const n = 14;
  for (let i = 0; i < n; i++) {
    const p0 = ((i + T * 0.35) % n) / n, p1 = p0 + 0.03;
    const ya = lerp(bottomY, horizonY, Math.pow(p0, 0.6)), yb = lerp(bottomY, horizonY, Math.pow(Math.min(1, p1), 0.6));
    const xa = lerp(W / 2, vx, Math.pow(p0, 0.6)), xb = lerp(W / 2, vx, Math.pow(Math.min(1, p1), 0.6));
    ctx.beginPath(); ctx.moveTo(xa, ya); ctx.lineTo(xb, yb); ctx.stroke();
  }
  ctx.restore();
}
/** 侧视的飘带小路（跨画面的弯曲缎带） */
export function ribbonRoad(ctx: Ctx, y: number, thick: number, color = '#e9d6b0', wave = 40, offset = 0): void {
  ctx.save(); ctx.fillStyle = color; ctx.strokeStyle = 'rgba(80,60,40,0.4)'; ctx.lineWidth = 3;
  ctx.beginPath();
  for (let x = -60; x <= W + 60; x += 20) ctx.lineTo(x, y + Math.sin((x + offset) / 300) * wave);
  for (let x = W + 60; x >= -60; x -= 20) ctx.lineTo(x, y + thick + Math.sin((x + offset) / 300) * wave * 0.9);
  ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}
export function tree(ctx: Ctx, x: number, y: number, h: number, color = '#5fae76', seed = 0, trunk = '#8a5a3c'): void {
  ctx.save(); ctx.strokeStyle = 'rgba(60,40,30,0.35)'; ctx.lineWidth = 3;
  ctx.fillStyle = trunk; ctx.fillRect(x - h * 0.05, y - h * 0.45, h * 0.1, h * 0.45);
  ctx.fillStyle = color;
  const r = h * 0.32;
  ctx.beginPath();
  [[0, -0.75, 1], [-0.55, -0.5, 0.8], [0.55, -0.52, 0.78], [0, -0.42, 0.85], [-0.3, -0.95, 0.6], [0.3, -0.98, 0.58]].forEach(([dx, dy, rr], i) => { const j = (hash(seed + i) - 0.5) * 0.08; ctx.moveTo(x + dx * r + rr * r, y + dy * h); ctx.arc(x + (dx + j) * r, y + dy * h, rr * r, 0, TAU); });
  ctx.fill(); ctx.stroke(); ctx.restore();
}
export function pine(ctx: Ctx, x: number, y: number, h: number, color = '#2f7a55'): void {
  ctx.save(); ctx.fillStyle = '#6b4a30'; ctx.fillRect(x - h * 0.04, y - h * 0.2, h * 0.08, h * 0.2);
  ctx.fillStyle = color; ctx.strokeStyle = 'rgba(40,30,20,0.35)'; ctx.lineWidth = 3;
  for (let i = 0; i < 3; i++) { const yy = y - h * (0.2 + i * 0.26), w = h * (0.42 - i * 0.1); ctx.beginPath(); ctx.moveTo(x, yy - h * 0.3); ctx.lineTo(x + w, yy); ctx.lineTo(x - w, yy); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  ctx.restore();
}
export function bareTree(ctx: Ctx, x: number, y: number, h: number, color = '#5a4030'): void {
  ctx.save(); ctx.strokeStyle = color; ctx.lineCap = 'round';
  const br = (x0: number, y0: number, a: number, len: number, d: number) => { if (d === 0 || len < 6) return; const x1 = x0 + Math.cos(a) * len, y1 = y0 + Math.sin(a) * len; ctx.lineWidth = d * 2.2; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); br(x1, y1, a - 0.5 + hash(d + x0) * 0.2, len * 0.68, d - 1); br(x1, y1, a + 0.45 + hash(d + y0) * 0.2, len * 0.66, d - 1); };
  br(x, y, -PI / 2, h * 0.36, 5); ctx.restore();
}
export function flowers(ctx: Ctx, y: number, T: number, n = 60, seed = 0, colors = ['#ff7aa8', '#ffd166', '#ffffff', '#b388ff'], spread = 120): void {
  ctx.save();
  for (let i = 0; i < n; i++) {
    const x = hash(i + seed) * (W + 200) - 100, yy = y + hash(i + seed + 1) * spread;
    const sway = Math.sin(T * 2 + i) * 3;
    ctx.strokeStyle = '#4e9a5a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + sway, yy - 26); ctx.stroke();
    ctx.fillStyle = colors[i % colors.length];
    for (let p = 0; p < 5; p++) { const a = (p / 5) * TAU; ctx.beginPath(); ctx.arc(x + sway + Math.cos(a) * 7, yy - 26 + Math.sin(a) * 7, 5, 0, TAU); ctx.fill(); }
    ctx.fillStyle = '#fff2a8'; ctx.beginPath(); ctx.arc(x + sway, yy - 26, 4, 0, TAU); ctx.fill();
  }
  ctx.restore();
}
export function grassTufts(ctx: Ctx, y: number, T: number, n = 50, seed = 0, color = '#4e9a5a'): void {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) { const x = hash(i + seed) * (W + 100) - 50, yy = y + hash(i + seed + 2) * 60, s = Math.sin(T * 2.2 + i) * 4; for (let k = -1; k <= 1; k++) { ctx.beginPath(); ctx.moveTo(x, yy); ctx.quadraticCurveTo(x + k * 6 + s, yy - 14, x + k * 12 + s, yy - 22); ctx.stroke(); } }
  ctx.restore();
}

// ---------- 建筑 / 道具 ----------
export function house(ctx: Ctx, x: number, y: number, w: number, h: number, wall = '#fff1d6', roof = '#d9624a', lit = false): void {
  ctx.save(); ctx.strokeStyle = 'rgba(60,40,30,0.5)'; ctx.lineWidth = 3;
  ctx.fillStyle = wall; ctx.fillRect(x - w / 2, y - h, w, h); ctx.strokeRect(x - w / 2, y - h, w, h);
  ctx.fillStyle = roof; ctx.beginPath(); ctx.moveTo(x - w * 0.62, y - h); ctx.lineTo(x, y - h - w * 0.55); ctx.lineTo(x + w * 0.62, y - h); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = lit ? '#ffe08a' : '#6d8fb3'; ctx.fillRect(x - w * 0.15, y - h * 0.75, w * 0.3, h * 0.3); ctx.strokeRect(x - w * 0.15, y - h * 0.75, w * 0.3, h * 0.3);
  ctx.fillStyle = '#8a5a3c'; ctx.fillRect(x - w * 0.12, y - h * 0.38, w * 0.24, h * 0.38);
  ctx.restore();
}
export function castle(ctx: Ctx, x: number, y: number, s: number, color = '#e9d9c6', roof = '#7a6fb5', alpha = 1): void {
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = 'rgba(60,40,60,0.45)'; ctx.lineWidth = 3;
  const tower = (tx: number, tw: number, th: number) => { ctx.fillStyle = color; ctx.fillRect(tx - tw / 2, y - th, tw, th); ctx.strokeRect(tx - tw / 2, y - th, tw, th); ctx.fillStyle = roof; ctx.beginPath(); ctx.moveTo(tx - tw * 0.6, y - th); ctx.lineTo(tx, y - th - tw * 1.3); ctx.lineTo(tx + tw * 0.6, y - th); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#ffe08a'; ctx.fillRect(tx - tw * 0.12, y - th * 0.6, tw * 0.24, tw * 0.3); };
  ctx.fillStyle = color; ctx.fillRect(x - s * 0.9, y - s * 0.7, s * 1.8, s * 0.7); ctx.strokeRect(x - s * 0.9, y - s * 0.7, s * 1.8, s * 0.7);
  tower(x - s * 0.75, s * 0.4, s * 1.1); tower(x + s * 0.75, s * 0.4, s * 1.1); tower(x, s * 0.5, s * 1.6);
  ctx.fillStyle = '#6b4a30'; ctx.beginPath(); ctx.arc(x, y - s * 0.2, s * 0.2, PI, 0); ctx.lineTo(x + s * 0.2, y); ctx.lineTo(x - s * 0.2, y); ctx.closePath(); ctx.fill();
  ctx.restore();
}
export function streetlamp(ctx: Ctx, x: number, y: number, h: number, on = true, T = 0): void {
  ctx.save();
  if (on) glowSpot(ctx, x, y - h + 10, h * 0.9, '255,220,150', 0.35 + 0.03 * Math.sin(T * 7));
  ctx.fillStyle = '#3b3a44'; ctx.fillRect(x - 5, y - h, 10, h); ctx.fillRect(x - 22, y - 2, 44, 10);
  ctx.fillStyle = on ? '#ffe9a8' : '#8c8c99'; ctx.beginPath(); ctx.moveTo(x - 22, y - h + 10); ctx.lineTo(x + 22, y - h + 10); ctx.lineTo(x + 14, y - h - 24); ctx.lineTo(x - 14, y - h - 24); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#3b3a44'; ctx.lineWidth = 3; ctx.stroke();
  ctx.restore();
}
export function lantern(ctx: Ctx, x: number, y: number, s: number, alpha = 1, T = 0): void {
  ctx.save(); ctx.globalAlpha = alpha;
  glowSpot(ctx, x, y, s * 2.4, '255,200,120', 0.4);
  ctx.fillStyle = '#ffcf7a'; ctx.strokeStyle = 'rgba(120,70,30,0.5)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x - s * 0.5, y - s); ctx.lineTo(x + s * 0.5, y - s); ctx.lineTo(x + s * 0.65, y + s * 0.4); ctx.lineTo(x - s * 0.65, y + s * 0.4); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = `rgba(255,240,180,${0.6 + 0.3 * Math.sin(T * 8 + x)})`; ctx.fillRect(x - s * 0.3, y - s * 0.6, s * 0.6, s * 0.8);
  ctx.fillStyle = '#ff9a5a'; ctx.beginPath(); ctx.arc(x, y + s * 0.5, s * 0.14, 0, TAU); ctx.fill();
  ctx.restore();
}
export function ring(ctx: Ctx, x: number, y: number, r: number, thick: number, tiltY = 1, color = GOLD, glow = true, rot = 0): void {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(1, tiltY);
  if (glow) { ctx.shadowColor = 'rgba(255,215,120,0.9)'; ctx.shadowBlur = 28; }
  ctx.lineWidth = thick; ctx.strokeStyle = GOLD_DEEP; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
  ctx.shadowBlur = 0; ctx.lineWidth = thick * 0.55; ctx.strokeStyle = color; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
  ctx.lineWidth = thick * 0.2; ctx.strokeStyle = '#fff8dc'; ctx.beginPath(); ctx.arc(-r * 0.05, -r * 0.05, r, -2.4, -1.1); ctx.stroke();
  ctx.restore();
}
/** 两人之间的金线（勾指起誓）：progress 0–1 画到哪里，T 让光点沿线流动 */
export function thread(ctx: Ctx, x1: number, y1: number, x2: number, y2: number, sag: number, T: number, progress = 1, color = GOLD, width = 4): void {
  if (progress <= 0) return;
  const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2 + sag;
  const pt = (t: number) => ({ x: (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cx + t * t * x2, y: (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cy + t * t * y2 });
  ctx.save(); ctx.lineCap = 'round'; ctx.shadowColor = color; ctx.shadowBlur = 16; ctx.strokeStyle = color; ctx.lineWidth = width;
  ctx.beginPath(); const n = 40; for (let i = 0; i <= n * progress; i++) { const p = pt(i / n); if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); } ctx.stroke();
  ctx.fillStyle = '#fffbe6';
  for (let k = 0; k < 3; k++) { const tt = ((T * 0.35 + k / 3) % 1); if (tt < progress) { const p = pt(tt); ctx.beginPath(); ctx.arc(p.x, p.y, width * 1.3, 0, TAU); ctx.fill(); } }
  ctx.restore();
}
export function giftBox(ctx: Ctx, x: number, y: number, s: number, open = 0, body = '#e4584e', ribbon = '#ffd166'): void {
  ctx.save(); ctx.strokeStyle = 'rgba(60,30,30,0.45)'; ctx.lineWidth = 3;
  ctx.fillStyle = body; ctx.fillRect(x - s / 2, y - s * 0.8, s, s * 0.8); ctx.strokeRect(x - s / 2, y - s * 0.8, s, s * 0.8);
  ctx.fillStyle = ribbon; ctx.fillRect(x - s * 0.1, y - s * 0.8, s * 0.2, s * 0.8);
  ctx.save(); ctx.translate(x - s * 0.55, y - s * 0.8); ctx.rotate(-open * 1.9);
  ctx.fillStyle = body; ctx.fillRect(0, -s * 0.22, s * 1.1, s * 0.22); ctx.strokeRect(0, -s * 0.22, s * 1.1, s * 0.22);
  ctx.fillStyle = ribbon; ctx.fillRect(s * 0.45, -s * 0.22, s * 0.2, s * 0.22);
  ctx.beginPath(); ctx.ellipse(s * 0.42, -s * 0.3, s * 0.14, s * 0.09, -0.5, 0, TAU); ctx.ellipse(s * 0.68, -s * 0.3, s * 0.14, s * 0.09, 0.5, 0, TAU); ctx.fill();
  ctx.restore(); ctx.restore();
}
export function hourglass(ctx: Ctx, x: number, y: number, h: number, frac: number, T = 0): void {
  // y 为底边；frac 为漏下去的比例（沙量守恒）
  const w = h * 0.5, neck = y - h / 2;
  ctx.save(); ctx.strokeStyle = '#6b4a30'; ctx.lineWidth = 6; ctx.lineJoin = 'round';
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.beginPath(); ctx.moveTo(x - w / 2, y - h); ctx.lineTo(x + w / 2, y - h); ctx.lineTo(x + w * 0.06, neck); ctx.lineTo(x + w / 2, y); ctx.lineTo(x - w / 2, y); ctx.lineTo(x - w * 0.06, neck); ctx.closePath(); ctx.fill();
  ctx.fillStyle = GOLD;
  const topH = (h / 2) * (1 - frac) * 0.8, botH = (h / 2) * frac * 0.8;
  if (topH > 1) { const yy = neck - topH, ww = (w / 2) * (topH / (h / 2)) * 0.94 + w * 0.06; ctx.beginPath(); ctx.moveTo(x - ww, yy); ctx.lineTo(x + ww, yy); ctx.lineTo(x + w * 0.06, neck); ctx.lineTo(x - w * 0.06, neck); ctx.closePath(); ctx.fill(); }
  if (botH > 1) { const yy = y - botH, ww = (w / 2) * (botH / (h / 2)) * 0.94 + w * 0.06; ctx.beginPath(); ctx.moveTo(x - ww, y); ctx.lineTo(x + ww, y); ctx.lineTo(x, yy - botH * 0.35); ctx.closePath(); ctx.fill(); }
  if (frac > 0.01 && frac < 0.99) { ctx.fillStyle = `rgba(242,193,78,${0.7 + 0.3 * Math.sin(T * 30)})`; ctx.fillRect(x - 2, neck, 4, y - botH - neck); }
  ctx.stroke();
  ctx.fillStyle = '#8a5a3c'; ctx.fillRect(x - w * 0.6, y - h - 10, w * 1.2, 12); ctx.fillRect(x - w * 0.6, y - 2, w * 1.2, 12);
  ctx.restore();
}
export function candle(ctx: Ctx, x: number, y: number, h: number, T: number, color = '#fff2dc'): void {
  const fl = 1 + 0.15 * Math.sin(T * 11) + 0.08 * Math.sin(T * 23);
  glowSpot(ctx, x, y - h - 14, h * 1.4, '255,200,120', 0.32 * fl);
  ctx.fillStyle = color; ctx.fillRect(x - h * 0.16, y - h, h * 0.32, h);
  ctx.strokeStyle = 'rgba(60,40,30,0.4)'; ctx.lineWidth = 2; ctx.strokeRect(x - h * 0.16, y - h, h * 0.32, h);
  ctx.fillStyle = '#ffb347'; ctx.beginPath(); ctx.ellipse(x, y - h - 12 * fl, 6, 13 * fl, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = '#fff6c8'; ctx.beginPath(); ctx.ellipse(x, y - h - 9 * fl, 3, 7 * fl, 0, 0, TAU); ctx.fill();
}
export function heart(ctx: Ctx, x: number, y: number, s: number, color = '#ff6b8a', alpha = 1): void {
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.translate(x, y); ctx.scale(s / 20, s / 20);
  ctx.beginPath(); ctx.moveTo(0, 6); ctx.bezierCurveTo(-14, -6, -8, -18, 0, -10); ctx.bezierCurveTo(8, -18, 14, -6, 0, 6); ctx.fill(); ctx.restore();
}
export function bubbleWorld(ctx: Ctx, x: number, y: number, r: number, hue: number, T: number, alpha = 1): void {
  ctx.save(); ctx.globalAlpha = alpha;
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  g.addColorStop(0, 'rgba(255,255,255,0.55)'); g.addColorStop(0.7, `hsla(${hue},70%,70%,0.35)`); g.addColorStop(1, `hsla(${hue},60%,60%,0.6)`);
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  ctx.fillStyle = `hsl(${hue},55%,55%)`; ctx.beginPath(); ctx.arc(x, y, r * 0.45, 0, TAU); ctx.fill();
  ctx.fillStyle = `hsl(${(hue + 120) % 360},45%,50%)`; ctx.beginPath(); ctx.ellipse(x + r * 0.1, y - r * 0.05, r * 0.2, r * 0.12, T * 0.5 + x, 0, TAU); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, r * 0.98, -2.2, -1.4); ctx.stroke();
  ctx.restore();
}
export function paperBoat(ctx: Ctx, x: number, y: number, s: number, rot = 0): void {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.strokeStyle = 'rgba(60,40,30,0.5)'; ctx.lineWidth = 3;
  ctx.fillStyle = '#fff6e6'; ctx.beginPath(); ctx.moveTo(-s, -s * 0.2); ctx.lineTo(s, -s * 0.2); ctx.lineTo(s * 0.65, s * 0.25); ctx.lineTo(-s * 0.65, s * 0.25); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffe9c9'; ctx.beginPath(); ctx.moveTo(-s * 0.5, -s * 0.2); ctx.lineTo(0, -s * 0.95); ctx.lineTo(s * 0.5, -s * 0.2); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}
export function umbrella(ctx: Ctx, x: number, y: number, r: number, color = '#4f7fe0', rot = 0): void {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.strokeStyle = 'rgba(40,30,30,0.6)'; ctx.lineWidth = 3;
  ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, 0, r, PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r, PI + (i / 4) * PI, PI + ((i + 0.5) / 4) * PI); ctx.closePath(); ctx.fill(); }
  ctx.strokeStyle = '#5a4030'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, r * 1.5); ctx.arc(8, r * 1.5, 8, PI, 0, true); ctx.stroke();
  ctx.restore();
}
export function wreathTree(ctx: Ctx, x: number, y: number, h: number, T: number): void {
  pine(ctx, x, y, h, '#2f7a55');
  const lights = ['#ff6b6b', '#ffd166', '#4fd1c5', '#b388ff'];
  for (let i = 0; i < 14; i++) { const yy = y - h * (0.25 + 0.6 * hash(i)), ww = h * (0.38 - 0.3 * hash(i)) * 0.9; const xx = x + (hash(i + 5) - 0.5) * 2 * ww; ctx.fillStyle = lights[i % 4]; ctx.globalAlpha = 0.6 + 0.4 * Math.sin(T * 4 + i); ctx.beginPath(); ctx.arc(xx, yy, 6, 0, TAU); ctx.fill(); }
  ctx.globalAlpha = 1; ctx.fillStyle = GOLD; star4(ctx, x, y - h * 1.02, 22);
}

// ---------- 信纸与书桌 ----------
export function desk(ctx: Ctx): void {
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#5a3c28'); g.addColorStop(1, '#3d2718');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 2;
  for (let i = 0; i < 18; i++) { const y = i * 64 + 20; ctx.beginPath(); ctx.moveTo(0, y); ctx.bezierCurveTo(W * 0.3, y + 12, W * 0.6, y - 10, W, y + 6); ctx.stroke(); }
}
export function paper(ctx: Ctx, x: number, y: number, w: number, h: number, rot = 0, lines = true, color = PAPER): void {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12;
  ctx.fillStyle = color; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  if (lines) { ctx.strokeStyle = 'rgba(120,90,60,0.18)'; ctx.lineWidth = 2; for (let i = 1; i < h / 58; i++) { ctx.beginPath(); ctx.moveTo(-w / 2 + 40, -h / 2 + i * 58); ctx.lineTo(w / 2 - 40, -h / 2 + i * 58); ctx.stroke(); } }
  ctx.restore();
}
/** 手写墨线：一行弯弯曲曲的字迹，progress 写到哪里 */
export function inkLine(ctx: Ctx, x: number, y: number, len: number, progress: number, seed = 0, color = INK, width = 3): void {
  if (progress <= 0) return;
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  const n = Math.floor(len / 6);
  for (let i = 0; i <= n * clamp(progress); i++) { const xx = x + i * 6; const yy = y + Math.sin(i * 0.9 + seed) * 5 + (hash(i + seed * 13) - 0.5) * 6 * (i % 7 === 0 ? 0 : 1); if (i % 9 === 8) { ctx.moveTo(xx + 4, yy); } else if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy); }
  ctx.stroke(); ctx.restore();
}
export function pen(ctx: Ctx, x: number, y: number, len = 180, rot = -0.9): void {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.fillStyle = '#2b2b3a'; ctx.fillRect(-7, -len, 14, len); ctx.fillStyle = GOLD; ctx.fillRect(-7, -len * 0.45, 14, 14);
  ctx.fillStyle = '#d9b36a'; ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(7, 0); ctx.lineTo(0, 24); ctx.closePath(); ctx.fill();
  ctx.restore();
}
export function inkBottle(ctx: Ctx, x: number, y: number, s: number): void {
  ctx.save(); ctx.fillStyle = '#1f2a55'; ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 3;
  ctx.beginPath(); if (typeof ctx.roundRect === 'function') ctx.roundRect(x - s / 2, y - s * 0.8, s, s * 0.8, 10); else ctx.rect(x - s / 2, y - s * 0.8, s, s * 0.8); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#3b3a44'; ctx.fillRect(x - s * 0.22, y - s * 1.05, s * 0.44, s * 0.27);
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(x - s * 0.36, y - s * 0.7, s * 0.14, s * 0.5);
  ctx.restore();
}

// ---------- 文字 ----------
export function inkText(ctx: Ctx, text: string, x: number, y: number, size: number, color = INK, align: CanvasTextAlign = 'center', alpha = 1, stroke?: string): void {
  ctx.save(); ctx.globalAlpha = alpha; ctx.font = `${size}px ${FONT}`; ctx.textAlign = align; ctx.textBaseline = 'middle';
  if (stroke) { ctx.lineWidth = size * 0.16; ctx.lineJoin = 'round'; ctx.strokeStyle = stroke; ctx.strokeText(text, x, y); }
  ctx.fillStyle = color; ctx.fillText(text, x, y); ctx.restore();
}

/** 切成两半的画面分割线（L19 用） */
export function splitLine(ctx: Ctx, x: number, color = GOLD, width = 6, glow = true): void {
  ctx.save(); if (glow) { ctx.shadowColor = color; ctx.shadowBlur = 24; } ctx.strokeStyle = color; ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(x, -10); ctx.lineTo(x, H + 10); ctx.stroke(); ctx.restore();
}
export function fireworks(ctx: Ctx, T: number, n = 5, seed = 0): void {
  ctx.save(); ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const period = 2.2 + hash(i + seed) * 1.2, ph = ((T + hash(i + seed + 1) * period) % period) / period;
    const x = W * (0.15 + 0.7 * hash(i + seed + 2)), y = H * (0.12 + 0.3 * hash(i + seed + 3));
    const hue = Math.floor(hash(i + seed + 4) * 360);
    if (ph < 0.3) { const p = ph / 0.3; ctx.strokeStyle = `hsla(${hue},80%,75%,${1 - p})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, H); ctx.lineTo(x, lerp(H, y, easeOut(p))); ctx.stroke(); }
    else { const p = (ph - 0.3) / 0.7, r = easeOut(p) * 170; ctx.globalAlpha = 1 - p; for (let k = 0; k < 18; k++) { const a = (k / 18) * TAU; ctx.strokeStyle = `hsl(${hue + k * 4},85%,${70 - p * 20}%)`; ctx.lineWidth = 4 - p * 3; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55 + p * p * 60); ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r + p * p * 90); ctx.stroke(); } ctx.globalAlpha = 1; }
  }
  ctx.restore();
}
export function confetti(ctx: Ctx, T: number, n = 80, seed = 0): void {
  const cols = ['#ff6b6b', '#ffd166', '#4fd1c5', '#b388ff', '#ff9ecd', '#ffffff'];
  ctx.save();
  for (let i = 0; i < n; i++) { const sp = 120 + hash(i + seed) * 120; const y = ((hash(i + seed + 2) * H + T * sp) % (H + 40)) - 20; const x = (hash(i + seed + 3) * W + Math.sin(T * 2 + i) * 40) % W; ctx.fillStyle = cols[i % 6]; ctx.save(); ctx.translate(x, y); ctx.rotate(T * 3 + i); ctx.fillRect(-7, -4, 14, 8); ctx.restore(); }
  ctx.restore();
}
