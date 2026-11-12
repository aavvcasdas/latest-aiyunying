// @ts-nocheck
// 特效与道具：3D 的挂在世界坐标上（随相机透视），2D 的是整屏背景层。都只读时间，同一个 t 同一帧。
import { W, H, TAU, clamp, sm, lerp, hash, rgb, META, ENV, starPath, heartPath, tag } from './core';

export { tag };

// ---------- 小件（沿用坏女孩 Fable） ----------
export const hearts3 = (c, pos, t0, col = [255, 92, 158], n = 5) => { for (let i = 0; i < n; i++) { const age = c.t - t0 - i * 0.22; if (age < 0 || age > 1.6) continue; c.add.custom([pos[0] + Math.sin(age * 5 + i) * 0.22 + (i - n / 2) * 0.13, pos[1] + age * 0.85, pos[2]], (g, x, y, k) => { g.globalAlpha = 1 - age / 1.6; g.fillStyle = rgb(col); heartPath(g, x, y, 0.11 * k); g.fill(); g.globalAlpha = 1; }); } };
export const sparkle3 = (c, pos, t0, n = 8, col = [255, 247, 176]) => { const u = c.t - t0; if (u < 0 || u > 1.1) return; for (let i = 0; i < n; i++) { const a = (i / n) * TAU; c.add.custom([pos[0] + Math.cos(a) * u * 1.1, pos[1] + Math.sin(a) * u * 1.1, pos[2]], (g, x, y, k) => { const s = 0.1 * k; g.globalAlpha = 1 - u / 1.1; g.fillStyle = rgb(col); g.save(); g.translate(x, y); g.rotate(u * 3); g.fillRect(-s * 0.2, -s, s * 0.4, s * 2); g.fillRect(-s, -s * 0.2, s * 2, s * 0.4); g.restore(); g.globalAlpha = 1; }); } };
export const bubble3 = (c, pos, text) => c.add.custom(pos, (g, x, y, k) => { const fs = 0.36 * k; g.font = `${fs}px BG`; const w = g.measureText(text).width + fs * 1.3; g.fillStyle = 'rgba(255,255,255,0.96)'; g.beginPath(); g.roundRect(x - w / 2, y - fs, w, fs * 1.8, fs * 0.6); g.fill(); g.beginPath(); g.moveTo(x - fs * 0.3, y + fs * 0.75); g.lineTo(x, y + fs * 1.25); g.lineTo(x + fs * 0.35, y + fs * 0.75); g.fill(); g.fillStyle = '#3a2250'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, x, y - fs * 0.1); });
export const ring3 = (add, x, y, z, r, n, w, col, a) => { if (a <= 0.01) return; let prev = [x + r, y, z]; for (let i = 1; i <= n; i++) { const an = (i / n) * TAU, q = [x + Math.cos(an) * r, y, z + Math.sin(an) * r]; add.line(prev, q, w, col, a); prev = q; } };
export const whiteout = (g, a) => { if (a <= 0) return; g.fillStyle = `rgba(255,252,240,${clamp(a)})`; g.fillRect(0, 0, W, H); };

// ---------- 多面体心脏：心形轮廓 + 偏心扇形三角面，明暗交替成宝石感；burst ≥ 0 时碎片四散 ----------
export function heart3(c, pos, size, o = {}) {
  const burst = o.burst ?? -1;
  if (burst < 0.9) c.add.glow([pos[0], pos[1], pos[2] - 0.3], size * 2.7, [255, 36, 66], (0.42 + 0.25 * c.p) * (burst < 0 ? 1 : 1 - burst));
  c.add.custom(pos, (g, x, y, k) => {
    const s = (size * k) / 16, N = 30, P = [], cx = -3, cy = -2;
    for (let i = 0; i < N; i++) { const th = (i / N) * TAU; P.push([16 * Math.pow(Math.sin(th), 3), -(13 * Math.cos(th) - 5 * Math.cos(2 * th) - 2 * Math.cos(3 * th) - Math.cos(4 * th)) - 2.5]); }
    for (let i = 0; i < N; i++) {
      const a = P[i], b = P[(i + 1) % N], mx = (a[0] + b[0]) / 2 - cx, my = (a[1] + b[1]) / 2 - cy, ml = Math.hypot(mx, my) || 1;
      const lit = 0.5 + 0.5 * Math.cos(Math.atan2(my, mx) + 2.4), sh = (i % 2 ? 0.82 : 1) * (0.5 + 0.5 * lit);
      let ox = 0, oy = 0, rot = 0, al = 1;
      if (burst >= 0) { const d = burst * (16 + hash(i) * 26); ox = (mx / ml) * d; oy = (my / ml) * d + burst * burst * 34; rot = burst * (hash(i + 4) - 0.5) * 9; al = clamp(1 - burst / 1.3); }
      if (al <= 0) continue;
      g.save(); g.translate(x + ox * s, y + oy * s); g.rotate(rot); g.globalAlpha = al;
      g.fillStyle = `rgb(${(240 * sh) | 0},${(26 * sh + 12) | 0},${(54 * sh + 14) | 0})`;
      g.beginPath(); g.moveTo(cx * s, cy * s); g.lineTo(a[0] * s, a[1] * s); g.lineTo(b[0] * s, b[1] * s); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(255,150,170,0.32)'; g.lineWidth = Math.max(1, s * 0.22); g.stroke(); g.restore();
    }
    if (burst < 0) { g.fillStyle = 'rgba(255,225,232,0.55)'; g.beginPath(); g.ellipse(x - 7 * s, y - 8 * s, 2.6 * s, 1.4 * s, -0.6, 0, TAU); g.fill(); }
  });
}

/** 网笼：只画地面以上的部分，经纬线越多网眼越密 */
export function cage3(c, ctr, R, n, ang, col = [236, 244, 255], a = 0.9) {
  const seg = 26, thMax = Math.acos(clamp(-ctr[1] / R, -1, 1));
  const P = (th, ph) => [ctr[0] + R * Math.sin(th) * Math.cos(ph + ang), ctr[1] + R * Math.cos(th), ctr[2] + R * Math.sin(th) * Math.sin(ph + ang)];
  for (let i = 0; i < n; i++) { const ph = (i / n) * TAU; let prev = P(0, ph); for (let j = 1; j <= seg; j++) { const q = P((j / seg) * thMax, ph); c.add.line(prev, q, 0.035, col, a); prev = q; } }
  const nl = Math.max(3, Math.round(n * 0.65));
  for (let j = 1; j <= nl; j++) { const th = (j / (nl + 1)) * thMax; let prev = P(th, 0); for (let i = 1; i <= seg; i++) { const q = P(th, (i / seg) * TAU); c.add.line(prev, q, 0.035, col, a); prev = q; } }
  c.add.glow(ctr, R * 1.5, [150, 190, 255], 0.12);
}

/** 小刀：t0 松手落地；shatter = 落地后化成光点 */
export function knife3(c, pos, t0, o = {}) {
  const u = c.t - t0; let p = pos, rot = -0.55 + Math.sin(c.t * 9) * 0.05;
  if (u > 0) { const f = Math.min(u, 0.42); p = [pos[0] + f * 0.3, Math.max(0.04, pos[1] - 4.3 * f * f), pos[2] + 0.1]; rot = -0.55 + f * 6.5; if (o.shatter && u > 0.3) { sparkle3(c, p, t0 + 0.3, 12, [200, 230, 255]); return; } }
  if (u < 0 || (u > 0.42 && u < 0.7)) c.add.glow(p, 0.5, [200, 225, 255], 0.35 * (0.6 + 0.4 * Math.sin(c.t * 14)));
  c.add.custom(p, (g, x, y, k) => {
    g.save(); g.translate(x, y); g.rotate(rot); const L = 0.4 * k, w = 0.05 * k;
    g.fillStyle = '#5a3420'; g.fillRect(-w * 0.55, 0, w * 1.1, L * 0.36);
    g.fillStyle = '#c9a227'; g.fillRect(-w * 0.95, -w * 0.25, w * 1.9, w * 0.5);
    g.fillStyle = '#e9f1fb'; g.beginPath(); g.moveTo(-w * 0.5, 0); g.lineTo(w * 0.5, 0); g.lineTo(w * 0.5, -L * 0.5); g.lineTo(0, -L * 0.66); g.lineTo(-w * 0.5, -L * 0.5); g.closePath(); g.fill();
    g.fillStyle = 'rgba(255,255,255,0.95)'; g.fillRect(-w * 0.1, -L * 0.5, w * 0.2, L * 0.44); g.restore();
  }, 0.3);
}

// ---------- 音符 / 吉他 / 星星 / 睡觉的 Z（都是画出来的形状，不用字形） ----------
export function noteShape(g, x, y, s, col, rot = 0, dbl = false) {
  g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = col; g.strokeStyle = col; g.lineWidth = Math.max(1, s * 0.16); g.lineCap = 'round';
  g.beginPath(); g.ellipse(0, 0, s * 0.42, s * 0.3, -0.4, 0, TAU); g.fill();
  g.beginPath(); g.moveTo(s * 0.36, -s * 0.1); g.lineTo(s * 0.36, -s * 1.3); g.stroke();
  if (dbl) { g.beginPath(); g.ellipse(s * 1.1, -s * 0.2, s * 0.42, s * 0.3, -0.4, 0, TAU); g.fill(); g.beginPath(); g.moveTo(s * 1.46, -s * 0.3); g.lineTo(s * 1.46, -s * 1.5); g.stroke(); g.lineWidth = s * 0.3; g.beginPath(); g.moveTo(s * 0.36, -s * 1.3); g.lineTo(s * 1.46, -s * 1.5); g.stroke(); }
  else { g.beginPath(); g.moveTo(s * 0.36, -s * 1.3); g.quadraticCurveTo(s * 0.95, -s * 1.0, s * 0.8, -s * 0.5); g.stroke(); }
  g.restore();
}
export function notes3(c, origin, t0, col = '#cfe8ff') {
  for (let i = 0; i < 14; i++) { const age = c.t - t0 - i * 0.28; if (age < 0) continue; const a = age % 2.4, sd = i % 2 ? 1 : -1; c.add.custom([origin[0] + sd * (0.2 + a * 0.35) + Math.sin(i * 1.7 + a * 3) * 0.12, origin[1] + a * 0.85, origin[2]], (g, x, y, k) => { g.globalAlpha = Math.sin((a / 2.4) * Math.PI); noteShape(g, x, y, 0.16 * k, col, Math.sin(a * 2 + i) * 0.3, i % 3 === 0); g.globalAlpha = 1; }); }
}
export function guitarShape(g, x, y, s, rot) {
  g.save(); g.translate(x, y); g.rotate(rot); const u = s * 0.01;
  g.fillStyle = '#c8641e'; g.beginPath(); g.ellipse(0, 18 * u, 20 * u, 17 * u, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(0, -6 * u, 15 * u, 13 * u, 0, 0, TAU); g.fill();
  g.strokeStyle = '#7a3a10'; g.lineWidth = Math.max(1, 1.4 * u); g.stroke();
  g.fillStyle = '#1e0e06'; g.beginPath(); g.arc(0, 4 * u, 5.5 * u, 0, TAU); g.fill();
  g.fillStyle = '#5a2e10'; g.fillRect(-3 * u, -62 * u, 6 * u, 54 * u); g.fillStyle = '#2a1408'; g.fillRect(-4.5 * u, -75 * u, 9 * u, 14 * u);
  g.strokeStyle = 'rgba(255,240,200,0.75)'; g.lineWidth = Math.max(0.6, 0.6 * u); for (let i = -1.5; i <= 1.5; i++) { g.beginPath(); g.moveTo(i * 1.4 * u, -62 * u); g.lineTo(i * 1.4 * u, 24 * u); g.stroke(); }
  g.fillStyle = '#3a1a08'; g.fillRect(-8 * u, 22 * u, 16 * u, 3 * u); g.restore();
}
/** 吉他贴在角色身前（不画手）；t0 之后被光托着飘走 */
export function guitar3(c, st, t0) {
  const u = c.t - t0; let p = [st.x + 0.06, st.y + 0.62 + st.bounce, st.z + 0.14], rot = 0.85, al = 1;
  if (u > 0) { p = [p[0] + u * 0.9, p[1] + u * 0.7 + u * u * 1.5, p[2] - u * 1.2]; rot = 0.85 + u * 2.4; al = clamp(1 - (u - 0.85) / 0.55); c.add.glow(p, 1.0, [255, 220, 150], 0.45 * al); }
  if (al <= 0) return; c.add.custom(p, (g, x, y, k) => { g.globalAlpha = al; guitarShape(g, x, y, k, rot); g.globalAlpha = 1; });
}
export function star3(c, pos, s, col = '#ffe066') { c.add.glow(pos, s * 4.5, [255, 230, 120], 0.55 + 0.3 * c.p); c.add.custom(pos, (g, x, y, k) => { g.fillStyle = col; starPath(g, x, y, s * k, Math.sin(c.t * 2) * 0.25); g.fill(); g.strokeStyle = '#fff6c0'; g.lineWidth = Math.max(1, 0.03 * k); g.stroke(); }); }
export function zzz3(c, pos, t0) { if (c.t < t0) return; for (let i = 0; i < 3; i++) { const a = ((c.t - t0) * 0.75 + i / 3) % 1; c.add.custom([pos[0] + a * 0.55, pos[1] + a * 0.95, pos[2]], (g, x, y, k) => { g.globalAlpha = Math.sin(a * Math.PI); g.font = `${(0.24 + a * 0.22) * k}px BG`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 0.04 * k; g.strokeStyle = '#3a4a8a'; g.strokeText('Z', x, y); g.fillStyle = '#ffffff'; g.fillText('Z', x, y); g.globalAlpha = 1; }); } }
export function pen3(c, pos) { c.add.custom(pos, (g, x, y, k) => { const s = k * 0.012; g.save(); g.translate(x, y); g.rotate(0.55); g.fillStyle = '#d8b84a'; g.beginPath(); g.moveTo(-6 * s, -22 * s); g.lineTo(6 * s, -22 * s); g.lineTo(0, 0); g.closePath(); g.fill(); g.fillStyle = '#1e1e2a'; g.fillRect(-7 * s, -128 * s, 14 * s, 106 * s); g.fillStyle = '#c9a227'; g.fillRect(-7 * s, -44 * s, 14 * s, 8 * s); g.fillRect(5 * s, -122 * s, 4 * s, 46 * s); g.restore(); }, 0.6); }
export function flowerGrow3(c, pos, t0, col = [255, 120, 60]) {
  const u = c.t - t0; if (u < 0) return; const h = 0.8 * sm(u / 0.7), bloom = sm((u - 0.55) / 0.5);
  c.add.line(pos, [pos[0], pos[1] + h, pos[2]], 0.035, [70, 160, 70]);
  if (h > 0.4) c.add.custom([pos[0] + 0.08, pos[1] + h * 0.5, pos[2]], (g, x, y, k) => { g.fillStyle = '#4aa84a'; g.beginPath(); g.ellipse(x, y, 0.12 * k, 0.05 * k, -0.5, 0, TAU); g.fill(); });
  if (bloom > 0) c.add.custom([pos[0], pos[1] + h, pos[2]], (g, x, y, k) => { const r = 0.24 * k * bloom; for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + u * 0.4; g.fillStyle = rgb(col); g.beginPath(); g.ellipse(x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8, r * 0.62, r * 0.38, a, 0, TAU); g.fill(); } g.fillStyle = '#ffd84a'; g.beginPath(); g.arc(x, y, r * 0.42, 0, TAU); g.fill(); });
  if (bloom > 0.2) sparkle3(c, [pos[0], pos[1] + h, pos[2]], t0 + 0.75, 8, [255, 230, 150]);
}
/** 人化成光点散掉 */
export function dissolve3(c, pos, t0, col = [210, 180, 255], n = 46) { const u = c.t - t0; if (u < 0) return; for (let i = 0; i < n; i++) { const d = u - hash(i) * 0.7; if (d < 0) continue; c.add.dot([pos[0] + (hash(i + 1) - 0.5) * 0.7 + d * (hash(i + 2) - 0.3) * 0.9, pos[1] + (hash(i + 3) - 0.5) * 1.5 + d * 0.95, pos[2] + (hash(i + 5) - 0.5) * 0.3], 0.025 + hash(i + 7) * 0.03, col, clamp(1 - d / 1.6)); } }
/** "只剩想念"：紫色光点打着旋儿聚起来又飘散 */
export function missDust(c, ctr, t0) { const u = c.t - t0; for (let i = 0; i < 70; i++) { const a = i * 2.4 + u * (0.8 + hash(i) * 0.8), r = 0.3 + hash(i + 1) * 2.4 * (1 - 0.45 * sm(u / 0.8)) + u * 0.2, y = ctr[1] + (hash(i + 2) - 0.5) * 1.8 + Math.sin(u * 2 + i) * 0.15; c.add.dot([ctr[0] + Math.cos(a) * r, y, ctr[2] + Math.sin(a) * r * 0.5], 0.03 + hash(i + 3) * 0.035, i % 3 ? [200, 150, 255] : [255, 170, 230], 0.85); } c.add.glow(ctr, 2.4, [170, 110, 255], 0.3 + 0.2 * c.p); }

// ---------- 地球 / 齿轮 / 相册 / 停摆的钟 ----------
export function earth3(c, ctr, R, ang, o = {}) {
  const nLat = 9, nLon = 16, V = [];
  for (let j = 0; j <= nLat; j++) { const v = (j / nLat) * Math.PI, row = []; for (let i = 0; i < nLon; i++) { const u = (i / nLon) * TAU + ang; row.push([ctr[0] + Math.sin(v) * Math.cos(u) * R, ctr[1] + Math.cos(v) * R, ctr[2] + Math.sin(v) * Math.sin(u) * R]); } V.push(row); }
  for (let j = 0; j < nLat; j++) for (let i = 0; i < nLon; i++) {
    const a = V[j][i], b = V[j][(i + 1) % nLon], cc = V[j + 1][(i + 1) % nLon], d = V[j + 1][i];
    const ice = j === 0 || j === nLat - 1, land = !ice && hash(i * 7.3 + j * 13.1) > 0.56;
    const col = ice ? [236, 246, 255] : land ? (hash(i + j * 3) > 0.5 ? [88, 176, 92] : [168, 160, 84]) : [36, 108, 214];
    c.S2.poly(j === 0 ? [a, cc, d] : j === nLat - 1 ? [a, b, d] : [a, b, cc, d], col, { out: ctr });
  }
  c.add.glow(ctr, R * 1.55, o.atm || [90, 190, 255], 0.34);
}
export function gear3(S2, x, y, z, r, n, th, ang, col) {
  const ri = r * 0.8, w = Math.PI / n, out = [];
  for (let k = 0; k < n; k++) { const a = ang + k * 2 * w; out.push([ri, a - w * 0.62], [r, a - w * 0.34], [r, a + w * 0.34], [ri, a + w * 0.62]); }
  const Fp = out.map(([rr, a]) => [x + Math.cos(a) * rr, y + Math.sin(a) * rr, z]), Bp = out.map(([rr, a]) => [x + Math.cos(a) * rr, y + Math.sin(a) * rr, z - th]);
  S2.poly(Fp, col, { n: [0, 0, 1] });
  const dk = [col[0] * 0.62, col[1] * 0.62, col[2] * 0.62];
  for (let i = 0; i < Fp.length; i++) { const j = (i + 1) % Fp.length; S2.poly([Fp[i], Fp[j], Bp[j], Bp[i]], dk, { out: [x, y, z - th / 2], edge: false }); }
  S2.poly(Array.from({ length: 10 }, (_, i) => [x + Math.cos((i / 10) * TAU + ang) * r * 0.28, y + Math.sin((i / 10) * TAU + ang) * r * 0.28, z + 0.01]), [col[0] * 0.5, col[1] * 0.5, col[2] * 0.5], { n: [0, 0, 1], bias: -0.05 });
  for (let s = 0; s < 4; s++) { const a = ang + (s * Math.PI) / 2; S2.poly([[x + Math.cos(a - 0.12) * r * 0.3, y + Math.sin(a - 0.12) * r * 0.3, z + 0.012], [x + Math.cos(a - 0.05) * ri * 0.9, y + Math.sin(a - 0.05) * ri * 0.9, z + 0.012], [x + Math.cos(a + 0.05) * ri * 0.9, y + Math.sin(a + 0.05) * ri * 0.9, z + 0.012], [x + Math.cos(a + 0.12) * r * 0.3, y + Math.sin(a + 0.12) * r * 0.3, z + 0.012]], [col[0] * 1.1, col[1] * 1.08, col[2]], { n: [0, 0, 1], bias: -0.06, edge: false }); }
}
const PHOTOS = ['p_whale_neutral', 'p_zai', 'p_claude_neutral', 'p_gemini', 'p_kimi', 'p_qwen', 'p_doubao_neutral', 'p_gpt_neutral', 'p_whale_think', 'p_claude_dizzy', 'p_doubao_blink', 'p_whale_shout'];
/** 巨大的立体相册：书脊竖着，书页朝镜头张开；flips 里每个时刻翻过一页 */
export function album3(c, base, flips, start = 0) {
  const [bx, by, bz] = base, Wp = 2.1, Hp = 2.7, y0 = by + 0.3, op = 0.36, paper = [252, 242, 222];
  const edge = (th) => [bx + Math.cos(th) * Wp, bz + Math.sin(th) * Wp];
  const page = (th, idx) => {
    const [ex, ez] = edge(th), S = [bx, y0, bz], E = [ex, y0, ez];
    c.S2.poly([S, E, [ex, y0 + Hp, ez], [bx, y0 + Hp, bz]], paper, { two: true, edge: true, bias: -0.02 });
    for (let k = 0; k < 2; k++) { const key = PHOTOS[(idx * 2 + k + PHOTOS.length * 4) % PHOTOS.length], P = (u, v) => [bx + (ex - bx) * u, y0 + v * Hp, bz + (ez - bz) * u]; c.add.photo(P(0.2, 0.93 - k * 0.47), P(0.8, 0.93 - k * 0.47), P(0.2, 0.55 - k * 0.47), key, 1); }
  };
  let done = 0, cur = -1;
  for (const f of flips) { if (c.t >= f + 0.42) done++; else if (c.t >= f) cur = (c.t - f) / 0.42; }
  const pg = start + done * 2;
  c.S2.box(bx, 0, bz - 0.12, 0.3, y0 + Hp + 0.08, 0.24, [120, 50, 40]);
  page(Math.PI - op, pg - 1); page(op, pg);
  if (cur >= 0) { const th = lerp(op, Math.PI - op, sm(cur)); page(th, th < Math.PI / 2 ? pg : pg + 1); }
}
/** 地上散落的旧相片 */
export function groundPhotos(c, ctr) { for (let i = 0; i < 9; i++) { const a = hash(i * 3.3) * TAU, d = 0.4 + hash(i + 1) * 1.7, x = ctr[0] + Math.cos(a) * d, z = ctr[2] + Math.sin(a) * d * 0.7, rot = (hash(i + 2) - 0.5) * 1.2, cw = 0.34, chh = 0.4, cs = Math.cos(rot), sn = Math.sin(rot), P = (lx, lz) => [x + lx * cs - lz * sn, 0.012 + i * 0.002, z + lx * sn + lz * cs]; c.add.photo(P(-cw, -chh), P(cw, -chh), P(-cw, chh), PHOTOS[i % PHOTOS.length], 0.95); } }
/** 停摆的钟：指针永远停在六点 */
export function stopClock3(c, pos, R) {
  c.add.glow(pos, R * 2, [255, 210, 120], 0.25);
  c.add.custom(pos, (g, x, y, k) => {
    const r = R * k; g.save(); g.fillStyle = '#c9a227'; g.beginPath(); g.arc(x, y, r * 1.08, 0, TAU); g.fill(); g.fillStyle = '#fbf3df'; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    g.strokeStyle = '#3a2a1a'; g.lineCap = 'round';
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; g.lineWidth = r * (i % 3 ? 0.03 : 0.06); g.beginPath(); g.moveTo(x + Math.sin(a) * r * 0.8, y - Math.cos(a) * r * 0.8); g.lineTo(x + Math.sin(a) * r * 0.92, y - Math.cos(a) * r * 0.92); g.stroke(); }
    const tw = Math.sin(c.t * 40) * 0.02; g.lineWidth = r * 0.07; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + r * 0.5); g.stroke(); g.lineWidth = r * 0.045; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.sin(tw) * r * 0.75, y - Math.cos(tw) * r * 0.75); g.stroke();
    g.strokeStyle = 'rgba(60,40,30,0.55)'; g.lineWidth = r * 0.015; g.beginPath(); g.moveTo(x + r * 0.2, y - r * 0.9); g.lineTo(x + r * 0.05, y - r * 0.45); g.lineTo(x + r * 0.32, y - r * 0.2); g.lineTo(x + r * 0.18, y + r * 0.3); g.stroke();
    g.fillStyle = '#3a2a1a'; g.beginPath(); g.arc(x, y, r * 0.06, 0, TAU); g.fill(); g.restore();
  }, -1);
}

// ---------- 2D 背景层 ----------
export function bokeh(g, t, cols, n, seed, a = 0.45, yMax = H * 0.75) {
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) { const r = 8 + hash(seed + i * 3.1) * 36, x = ((hash(seed + i) * (W + 200) + t * (6 + hash(i + seed) * 14)) % (W + 200)) - 100, y = hash(seed + i * 7.7) * yMax + Math.sin(t * 0.7 + i) * 8, col = cols[i % cols.length], al = a * (0.35 + 0.65 * hash(i + seed * 2)) * (0.75 + 0.25 * Math.sin(t * 1.3 + i)); const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, rgb(col, al)); gr.addColorStop(0.7, rgb(col, al * 0.6)); gr.addColorStop(1, rgb(col, 0)); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  g.restore();
}
export function nebula(g, t, cam, cols, seed = 1) {
  const yaw = Math.atan2(cam.f[0], -cam.f[2]), pitch = cam.f[1]; g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 7; i++) { const x = ((hash(seed + i) * 2600 - yaw * 600) % 2600 + 2600) % 2600 - 660, y = 120 + hash(seed + i * 5) * 420 + pitch * 300, r = 220 + hash(i + seed * 3) * 260, col = cols[i % cols.length]; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, rgb(col, 0.3)); gr.addColorStop(0.5, rgb(col, 0.11)); gr.addColorStop(1, rgb(col, 0)); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  g.restore();
}
/** 星系漩涡：旋臂上的光点越转越往中心收 */
export function galaxy(g, t) {
  const cx = W * 0.56, cy = H * 0.42, cols = [[255, 120, 200], [120, 200, 255], [255, 220, 120], [170, 120, 255], [120, 255, 200]];
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 560; i++) { const f = hash(i * 1.7), r = 16 + Math.pow(f, 0.7) * 640, a = (i % 4) * (TAU / 4) + r * 0.012 - t * (1.7 - f * 0.9) + (hash(i + 9) - 0.5) * 0.5, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.55, s = 1 + hash(i + 3) * 2.6; g.fillStyle = rgb(cols[(i * 7) % 5], 0.45 + 0.5 * hash(i + 5)); g.fillRect(x - s / 2, y - s / 2, s, s); }
  const gr = g.createRadialGradient(cx, cy, 0, cx, cy, 170); gr.addColorStop(0, 'rgba(255,245,230,0.95)'); gr.addColorStop(0.3, 'rgba(255,170,230,0.45)'); gr.addColorStop(1, 'rgba(120,80,255,0)'); g.fillStyle = gr; g.fillRect(cx - 170, cy - 170, 340, 340);
  g.restore();
}
/** "统统都带走吧"：吉他、音符、星星、相片被卷进漩涡中心 */
export function vortexItems(g, t, t0) {
  const cx = W * 0.56, cy = H * 0.42;
  for (let i = 0; i < 11; i++) {
    const fr = clamp(((t - t0) * 0.42 + i * 0.09) % 1), r = (1 - fr) * 620, a = i * 0.9 + fr * 7, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.55, s = 1 - fr * 0.85;
    g.save(); g.globalAlpha = clamp((1 - fr) * 3) * clamp(fr * 8); g.translate(x, y); g.rotate(a * 0.6);
    const kind = i % 4;
    if (kind === 0) guitarShape(g, 0, 0, 110 * s, 0);
    else if (kind === 1) noteShape(g, 0, 0, 38 * s, '#ffd84a', 0, true);
    else if (kind === 2) { g.fillStyle = '#ffe066'; starPath(g, 0, 0, 30 * s); g.fill(); }
    else { const cell = META.s[PHOTOS[i % PHOTOS.length]]; const w = 64 * s; g.fillStyle = '#fffaf0'; g.fillRect(-w / 2 - 5 * s, -w / 2 - 5 * s, w + 10 * s, w + 16 * s); g.imageSmoothingEnabled = false; g.drawImage(ENV.atlas, cell[0], cell[1], cell[2], cell[3], -w / 2, -w / 2, w, w); }
    g.restore();
  }
}
let SEIG = null;
/** 青海波（日式波浪纹），缓存成一张图再平移 */
export function seigaiha(g, t) {
  const R = 46;
  if (!SEIG) {
    SEIG = ENV.makeCanvas(W + R * 4, H + R * 2); const q = SEIG.getContext('2d'); q.fillStyle = '#0a1c4a'; q.fillRect(0, 0, SEIG.width, SEIG.height);
    for (let row = -1; row * R * 0.5 < SEIG.height + R; row++) for (let col = -1; col * R * 2 < SEIG.width + R * 2; col++) { const x = col * R * 2 + (row % 2 ? R : 0), y = row * R * 0.5; for (let k = 0; k < 5; k++) { q.fillStyle = k % 2 ? '#e6eeff' : k === 0 ? '#123a8a' : '#1d55b8'; q.beginPath(); q.arc(x, y, R * (1 - k * 0.19), 0, TAU); q.fill(); } }
  }
  const off = (t * 18) % (R * 2); g.drawImage(SEIG, -off - R, -R * 0.5);
  const v = g.createLinearGradient(0, 0, 0, H); v.addColorStop(0, 'rgba(6,14,50,0.35)'); v.addColorStop(1, 'rgba(6,14,50,0.55)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
}
/** 整面滚动的字墙：永远不存在的下一班 */
export function textWall(g, t, str = '永远不存在的下一班') {
  g.save(); g.textBaseline = 'middle';
  for (let r = 0; r < 14; r++) {
    const size = 30 + (r % 3) * 6, y = 26 + r * 46, sp = (r % 2 ? 1 : -1) * (40 + ((r * 13) % 50)), hi = r % 4 === 1;
    g.font = `${size}px BG`; const unit = g.measureText(str + '  ').width, off = (((t * sp) % unit) + unit) % unit;
    if (hi) { g.fillStyle = 'rgba(255,216,74,0.16)'; g.fillRect(0, y - size * 0.62, W, size * 1.24); }
    g.fillStyle = hi ? 'rgba(255,216,74,0.95)' : `rgba(235,235,245,${(0.22 + 0.2 * hash(r)).toFixed(2)})`;
    for (let x = -unit + off; x < W + unit; x += unit) g.fillText(str + '  ', x, y);
  }
  g.restore();
}
