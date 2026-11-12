// @ts-nocheck
// 童话版特效与道具：长翅膀的心、露水网、彼得潘的小刀（落地开花）、折纸船、孔明灯、蝴蝶、萤火虫、小王子式小星球……
// 都只读时间，同一个 t 同一帧。
import { W, H, TAU, clamp, sm, lerp, hash, norm, cross, heartPath, starPath } from './core';
import { sparkle3, flowerGrow3, cage3, guitarShape, noteShape } from './fx';

/** 长着小翅膀的心：渴望自由。flap 扑翅幅度；fast 急着扑；patch 贴一块创可贴；dim 没精神 */
export function wingHeart3(c, pos, size, o = {}) {
  const flap = Math.sin(c.t * (o.fast ? 24 : 11)) * (o.flap ?? 0.5), dim = o.dim || 0;
  c.add.glow(pos, size * 2.6, [255, 160, 180], (0.42 + 0.2 * c.p) * (1 - dim * 0.6));
  c.add.custom(pos, (g, x, y, k) => {
    const s = size * k;
    for (const sd of [-1, 1]) {
      g.save(); g.translate(x + sd * s * 0.5, y - s * 0.2); g.scale(sd, 1); g.rotate(-0.45 - flap);
      g.fillStyle = '#ffffff'; g.strokeStyle = '#bcd6ff'; g.lineWidth = Math.max(1, s * 0.03);
      for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(s * (0.5 - i * 0.07), s * (i * 0.17), s * (0.56 - i * 0.11), s * 0.15, 0.2 + i * 0.25, 0, TAU); g.fill(); g.stroke(); }
      g.restore();
    }
    const gr = g.createLinearGradient(x, y - s, x, y + s); gr.addColorStop(0, dim ? '#eaa6b4' : '#ff93a8'); gr.addColorStop(1, dim ? '#c97a8a' : '#ff4f72');
    g.fillStyle = gr; heartPath(g, x, y, s * 0.62); g.fill(); g.strokeStyle = '#ffffff'; g.lineWidth = Math.max(1.5, s * 0.07); g.lineJoin = 'round'; g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.ellipse(x - s * 0.3, y - s * 0.3, s * 0.15, s * 0.08, -0.6, 0, TAU); g.fill();
    if (o.patch) { g.save(); g.translate(x + s * 0.14, y + s * 0.08); g.rotate(-0.5); g.fillStyle = '#ffe2b8'; g.strokeStyle = '#d8a878'; g.lineWidth = Math.max(1, s * 0.02); g.beginPath(); g.roundRect(-s * 0.32, -s * 0.1, s * 0.64, s * 0.2, s * 0.09); g.fill(); g.stroke(); g.fillStyle = '#fff8ea'; g.fillRect(-s * 0.1, -s * 0.08, s * 0.2, s * 0.16); g.restore(); }
  });
}
/** 一张挂着露水的网（白丝线网罩） */
export function dewNet3(c, ctr, R, n, ang) {
  cage3(c, ctr, R, n, ang, [255, 252, 240], 0.95);
  for (let i = 0; i < 20; i++) { const th = 0.2 + hash(i) * 1.25, ph = hash(i + 7) * TAU + ang, p = [ctr[0] + R * Math.sin(th) * Math.cos(ph), ctr[1] + R * Math.cos(th), ctr[2] + R * Math.sin(th) * Math.sin(ph)]; if (p[1] < 0.1) continue; c.add.dot(p, 0.05, [190, 236, 255], 0.55 + 0.45 * Math.sin(c.t * 4 + i)); }
}
/** 彼得潘的小刀：t0 松手落地；bloom = 落地的地方开出一朵花 */
export function dagger3(c, pos, t0, o = {}) {
  const u = c.t - t0; let p = pos, rot = -0.55 + Math.sin(c.t * 9) * 0.04, al = 1;
  if (u > 0) {
    const f = Math.min(u, 0.42); p = [pos[0] + f * 0.3, Math.max(0.05, pos[1] - 4.3 * f * f), pos[2] + 0.1]; rot = -0.55 + f * 6.5; al = clamp(1 - (u - 0.42) / 0.25);
    if (u > 0.42) { sparkle3(c, [p[0], 0.3, p[2]], t0 + 0.42, 10, [255, 214, 236]); if (o.bloom) flowerGrow3(c, [p[0], 0, p[2]], t0 + 0.42, o.col || [255, 140, 180]); }
  }
  if (al <= 0) return;
  c.add.custom(p, (g, x, y, k) => {
    g.save(); g.globalAlpha = al; g.translate(x, y); g.rotate(rot); const L = 0.4 * k, w = 0.05 * k;
    g.fillStyle = '#8a5a3a'; g.fillRect(-w * 0.55, 0, w * 1.1, L * 0.36); g.fillStyle = '#f2c14e'; g.fillRect(-w * 0.95, -w * 0.25, w * 1.9, w * 0.5);
    g.fillStyle = '#eef4fb'; g.strokeStyle = '#9ab0cc'; g.lineWidth = Math.max(1, w * 0.12); g.beginPath(); g.moveTo(-w * 0.5, 0); g.lineTo(w * 0.5, 0); g.lineTo(w * 0.5, -L * 0.5); g.lineTo(0, -L * 0.66); g.lineTo(-w * 0.5, -L * 0.5); g.closePath(); g.fill(); g.stroke(); g.restore();
  }, 0.3);
}
/** 折纸船（《童话镇》里的那只）：前后两片船帮 + 中间一个三角帆 */
export function boat3(S2, x, y, z, s = 1, col = [255, 255, 255]) {
  const P = (lx, ly, lz) => [x + lx * s, y + ly * s, z + lz * s], sh = [col[0] * 0.9, col[1] * 0.93, col[2]];
  S2.poly([P(-0.5, 0.45, -0.05), P(0.5, 0.45, -0.05), P(0, 1.3, -0.05)], sh, { two: true, n: [0, 0, 1], bias: 0.35 });
  S2.poly([P(-0.6, 0, -0.16), P(0.6, 0, -0.16), P(1.35, 0.6, -0.04), P(-1.35, 0.6, -0.04)], sh, { two: true, n: [0, 0.3, -1], bias: 0.3 });
  S2.poly([P(-0.6, 0, 0.16), P(0.6, 0, 0.16), P(1.35, 0.6, 0.04), P(-1.35, 0.6, 0.04)], col, { two: true, n: [0, 0.3, 1], bias: -0.35 });
}
/** 孔明灯 */
export function lantern3(c, pos, s, a = 1) {
  if (a <= 0.02) return; c.add.glow(pos, s * 3.2, [255, 190, 110], 0.42 * a);
  c.add.custom(pos, (g, x, y, k) => { const u = s * k, gr = g.createLinearGradient(x, y - u, x, y + u * 0.6); gr.addColorStop(0, '#ffd884'); gr.addColorStop(1, '#ff9450'); g.globalAlpha = a; g.fillStyle = gr; g.beginPath(); g.moveTo(x - u * 0.42, y + u * 0.55); g.lineTo(x - u * 0.6, y - u * 0.5); g.quadraticCurveTo(x, y - u * 1.1, x + u * 0.6, y - u * 0.5); g.lineTo(x + u * 0.42, y + u * 0.55); g.closePath(); g.fill(); g.fillStyle = 'rgba(255,252,214,0.95)'; g.beginPath(); g.ellipse(x, y + u * 0.5, u * 0.3, u * 0.1, 0, 0, TAU); g.fill(); g.globalAlpha = 1; });
}
/** 一群慢慢升空的孔明灯。box = [x0, 宽, z0, 深, 高] */
export function lanterns(c, n, box, seed, sp = 0.45) {
  for (let i = 0; i < n; i++) { const v = sp * (0.6 + hash(seed + i) * 0.8), y = (hash(seed + i * 3) * box[4] + c.t * v) % box[4], x = box[0] + hash(seed + i * 5) * box[1] + Math.sin(c.t * 0.6 + i) * 0.3, z = box[2] + hash(seed + i * 7) * box[3]; lantern3(c, [x, y + 0.6, z], 0.3 + hash(i + seed) * 0.16, clamp(Math.min(y, box[4] - y) / 0.8)); }
}
/** 蝴蝶。box = [x0, 宽, z0, 深, y0, 高] */
export function butterflies(add, t, n, box, seed = 1) {
  const cols = ['#ff9ac0', '#ffd866', '#9ad8ff', '#c8a8ff', '#ffffff'];
  for (let i = 0; i < n; i++) {
    const sp = 0.3 + hash(seed + i) * 0.4, x = box[0] + (0.5 + 0.5 * Math.sin(t * sp + i * 2.1)) * box[1], z = box[2] + (0.5 + 0.5 * Math.cos(t * sp * 0.8 + i * 1.3)) * box[3], y = box[4] + (0.5 + 0.5 * Math.sin(t * sp * 1.7 + i)) * box[5], fl = Math.abs(Math.sin(t * 13 + i * 1.7));
    add.custom([x, y, z], (g, X, Y, k) => { const s = 0.14 * k; g.fillStyle = cols[i % 5]; for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(X + sd * s * 0.5 * fl, Y - s * 0.15, s * 0.5 * fl + 0.6, s * 0.6, sd * 0.4, 0, TAU); g.fill(); g.beginPath(); g.ellipse(X + sd * s * 0.35 * fl, Y + s * 0.35, s * 0.32 * fl + 0.6, s * 0.36, -sd * 0.4, 0, TAU); g.fill(); } g.fillStyle = '#6a5a6a'; g.fillRect(X - s * 0.05, Y - s * 0.5, s * 0.1, s); });
  }
}
/** 萤火虫。box = [x0, 宽, z0, 深, y0, 高] */
export function fireflies(add, t, n, box, seed = 1, col = [255, 240, 150]) {
  for (let i = 0; i < n; i++) { const sp = 0.2 + hash(seed + i) * 0.3, x = box[0] + hash(seed + i * 3) * box[1] + Math.sin(t * sp * 3 + i) * 0.5, z = box[2] + hash(seed + i * 5) * box[3] + Math.cos(t * sp * 2 + i) * 0.4, y = box[4] + hash(seed + i * 7) * box[5] + Math.sin(t * sp * 4 + i * 2) * 0.25, a = 0.45 + 0.55 * Math.sin(t * 2.6 + i * 1.9); if (a < 0.1) continue; add.dot([x, y, z], 0.04, col, a); add.glow([x, y, z], 0.32, col, 0.3 * a); }
}
/** 萤火虫聚成一颗心：只剩想念 */
export function fireflyHeart(c, ctr, t0, s = 1.15) {
  const q = sm((c.t - t0) / 0.75);
  for (let i = 0; i < 44; i++) {
    const th = (i / 44) * TAU, hx = Math.pow(Math.sin(th), 3), hy = (13 * Math.cos(th) - 5 * Math.cos(2 * th) - 2 * Math.cos(3 * th) - Math.cos(4 * th)) / 16;
    const x = lerp(ctr[0] + (hash(i) - 0.5) * 10, ctr[0] + hx * s, q) + Math.sin(c.t * 2 + i) * 0.05, y = lerp(0.4 + hash(i + 5) * 3.2, ctr[1] + hy * s, q) + Math.cos(c.t * 2.3 + i) * 0.05, z = lerp(ctr[2] + (hash(i + 9) - 0.5) * 4, ctr[2], q);
    c.add.dot([x, y, z], 0.05, [255, 240, 160], 0.95); c.add.glow([x, y, z], 0.34, [255, 220, 120], 0.34);
  }
}
/** 月亮（圆圆的、带一点环形山） */
export function moon3(add, pos, R, dim = 1) {
  add.glow(pos, R * 3.4, [255, 244, 200], 0.4 * dim);
  add.custom(pos, (g, X, Y, k) => { const r = R * k; g.globalAlpha = dim; g.fillStyle = '#fff6cf'; g.beginPath(); g.arc(X, Y, r, 0, TAU); g.fill(); g.fillStyle = 'rgba(240,214,150,0.55)'; for (const [dx, dy, rr] of [[-0.3, -0.2, 0.2], [0.28, 0.12, 0.13], [-0.05, 0.4, 0.1]]) { g.beginPath(); g.arc(X + dx * r, Y + dy * r, rr * r, 0, TAU); g.fill(); } g.globalAlpha = 1; }, -60);
}
/** 整片星空绕着画面中心转：天空转啊转 */
export function starSwirl(g, t, speed = 0.3, seed = 1) {
  const cx = W / 2, cy = H * 0.46, cols = ['#fff6c8', '#ffd6ec', '#d6ecff', '#ffffff']; g.save(); g.lineCap = 'round';
  for (let i = 0; i < 120; i++) {
    const r = 70 + hash(seed + i) * 780, a = hash(seed + i * 3.3) * TAU + t * speed * (0.6 + 0.4 * hash(i + seed * 7)), x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.62;
    if (x < -30 || x > W + 30 || y < -30 || y > H + 30) continue;
    const s = 2.5 + hash(i * 1.9 + seed) * 7, tw = 0.5 + 0.5 * Math.sin(t * 3 + i);
    g.globalAlpha = 0.16; g.strokeStyle = cols[i % 4]; g.lineWidth = 1.5; g.beginPath(); g.ellipse(cx, cy, r, r * 0.62, 0, speed > 0 ? a - 0.22 : a, speed > 0 ? a : a + 0.22); g.stroke();
    g.globalAlpha = 0.5 + 0.5 * tw; g.fillStyle = cols[i % 4]; g.beginPath(); g.moveTo(x, y - s); g.quadraticCurveTo(x, y, x + s, y); g.quadraticCurveTo(x, y, x, y + s); g.quadraticCurveTo(x, y, x - s, y); g.quadraticCurveTo(x, y, x, y - s); g.fill();
  }
  g.restore();
}
// 沿法线立在球面上的小锥 / 小柱（小星球上的树和房子）
function basis(n) { const a = Math.abs(n[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0], e1 = norm(cross(n, a)), e2 = cross(n, e1); return [e1, e2]; }
function spike(S2, base, n, r, h, col, sides = 5) { const [e1, e2] = basis(n), tip = [base[0] + n[0] * h, base[1] + n[1] * h, base[2] + n[2] * h], R = (i) => { const a = (i / sides) * TAU; return [base[0] + (e1[0] * Math.cos(a) + e2[0] * Math.sin(a)) * r, base[1] + (e1[1] * Math.cos(a) + e2[1] * Math.sin(a)) * r, base[2] + (e1[2] * Math.cos(a) + e2[2] * Math.sin(a)) * r]; }; for (let i = 0; i < sides; i++) S2.poly([R(i), R(i + 1), tip], col, { out: base }); }
function prism(S2, base, n, r, h, col, sides = 4) { const [e1, e2] = basis(n), R = (i, hh) => { const a = (i / sides) * TAU + 0.78; return [base[0] + (e1[0] * Math.cos(a) + e2[0] * Math.sin(a)) * r + n[0] * hh, base[1] + (e1[1] * Math.cos(a) + e2[1] * Math.sin(a)) * r + n[1] * hh, base[2] + (e1[2] * Math.cos(a) + e2[2] * Math.sin(a)) * r + n[2] * hh]; }; for (let i = 0; i < sides; i++) S2.poly([R(i, 0), R(i + 1, 0), R(i + 1, h), R(i, h)], col, { out: [base[0] + n[0] * h * 0.5, base[1] + n[1] * h * 0.5, base[2] + n[2] * h * 0.5] }); return [base[0] + n[0] * h, base[1] + n[1] * h, base[2] + n[2] * h]; }
const FEATS = [[0.75, 0.3, 0], [0.9, 1.5, 1], [0.8, 2.9, 0], [1.0, 4.2, 1], [0.7, 5.3, 0], [1.4, 0.9, 0], [1.5, 2.2, 1], [1.45, 3.6, 0], [1.5, 5.0, 1], [1.3, 5.9, 0], [2.0, 0.4, 0], [2.1, 2.9, 0]];
/** 小王子式的小星球：软软的蓝绿色，上面长着小树和小房子，跟着一起转 */
export function planet3(c, ctr, R, ang, o = {}) {
  const nLat = 9, nLon = 16, V = [];
  for (let j = 0; j <= nLat; j++) { const v = (j / nLat) * Math.PI, row = []; for (let i = 0; i < nLon; i++) { const u = (i / nLon) * TAU + ang; row.push([ctr[0] + Math.sin(v) * Math.cos(u) * R, ctr[1] + Math.cos(v) * R, ctr[2] + Math.sin(v) * Math.sin(u) * R]); } V.push(row); }
  for (let j = 0; j < nLat; j++) for (let i = 0; i < nLon; i++) {
    const a = V[j][i], b = V[j][(i + 1) % nLon], cc = V[j + 1][(i + 1) % nLon], d = V[j + 1][i], top = j <= 1, land = top || hash(i * 7.3 + j * 13.1) > 0.5;
    const col = land ? (hash(i + j * 3) > 0.5 ? [150, 222, 130] : [186, 232, 140]) : [112, 196, 255];
    c.S2.poly(j === 0 ? [a, cc, d] : j === nLat - 1 ? [a, b, d] : [a, b, cc, d], col, { out: ctr });
  }
  for (const [v, u0, kind] of FEATS) {
    const u = u0 + ang, n = [Math.sin(v) * Math.cos(u), Math.cos(v), Math.sin(v) * Math.sin(u)], base = [ctr[0] + n[0] * R * 0.985, ctr[1] + n[1] * R * 0.985, ctr[2] + n[2] * R * 0.985];
    if (kind) { const top = prism(c.S2, base, n, 0.26, 0.3, [255, 236, 200]); spike(c.S2, top, n, 0.36, 0.3, [232, 96, 90], 4); }
    else { const top = prism(c.S2, base, n, 0.06, 0.2, [150, 100, 70]); spike(c.S2, top, n, 0.3, 0.6, [79, 184, 90], 6); }
  }
  c.add.glow(ctr, R * 1.6, o.atm || [170, 220, 255], 0.3);
}
/** 金色五线谱丝带载着音符从 from 飘向远处的天上 */
export function staffRibbon(c, from, t0) {
  const sy = (x) => from[1] + (x - from[0]) * 0.28 + Math.sin(x * 0.5 + c.t * 1.2) * 0.35, sz = (x) => from[2] - (x - from[0]) * 0.55;
  for (let k = 0; k < 5; k++) { let prev = null; for (let i = 0; i <= 30; i++) { const x = from[0] + i * 0.55, q = [x, sy(x) + k * 0.14, sz(x)]; if (prev) c.add.line(prev, q, 0.03, [255, 214, 100], 0.9); prev = q; } }
  for (let j = 0; j < 9; j++) { const ph = ((c.t - t0) * 0.3 + j / 9) % 1, x = from[0] + ph * 16; c.add.custom([x, sy(x) + 0.3 + (j % 4) * 0.14, sz(x)], (g, X, Y, k) => { g.globalAlpha = Math.sin(ph * Math.PI); noteShape(g, X, Y, 0.2 * k, ['#ff8fb0', '#ffb84a', '#6ac8ff', '#b08aff'][j % 4], 0, j % 3 === 0); g.globalAlpha = 1; }); }
}
/** 背上的发条钥匙：我想活成一个小零件 */
export function windKey3(c, st) {
  c.add.custom([st.x - 0.5, st.y + 0.8 + st.bounce, st.z - 0.12], (g, x, y, k) => { const w = Math.cos(c.t * 5), u = 0.16 * k; g.strokeStyle = '#e8a82a'; g.fillStyle = '#ffd866'; g.lineWidth = 0.05 * k; g.lineCap = 'round'; g.beginPath(); g.moveTo(x + u * 1.6, y); g.lineTo(x, y); g.stroke(); for (const sd of [-1, 1]) { g.beginPath(); g.ellipse(x - u * 0.2, y + sd * u * 0.75 * w, u * 0.55, Math.max(1, u * 0.7 * Math.abs(w)), 0, 0, TAU); g.fill(); g.stroke(); } }, -0.25);
}
/** 南瓜马车的幻影：轮子和车篷的金线，慢慢消失 */
export function ghostCoach3(c, pos, a) {
  if (a <= 0.01) return;
  c.add.custom(pos, (g, x, y, k) => { g.globalAlpha = a; g.strokeStyle = '#fff2b0'; g.lineWidth = 0.05 * k; g.lineCap = 'round'; for (const sd of [-1, 1]) { const wx = x + sd * 0.8 * k, wy = y + 0.3 * k, r = 0.4 * k; g.beginPath(); g.arc(wx, wy, r, 0, TAU); g.stroke(); for (let i = 0; i < 6; i++) { const an = (i / 6) * TAU + c.t; g.beginPath(); g.moveTo(wx, wy); g.lineTo(wx + Math.cos(an) * r, wy + Math.sin(an) * r); g.stroke(); } } g.beginPath(); g.arc(x, y - 0.2 * k, 1.15 * k, Math.PI * 1.08, Math.PI * 1.92); g.stroke(); g.globalAlpha = 1; }, 0.6);
  for (let i = 0; i < 12; i++) c.add.dot([pos[0] + Math.sin(i * 2.3 + c.t) * 1.3, pos[1] + ((i * 0.37 + c.t * 0.5) % 1.8) - 0.5, pos[2] + Math.cos(i * 1.7) * 0.5], 0.04, [255, 240, 170], a * 0.9);
}
/** 夜风：几道弯弯的白线带着叶子吹过去 */
export function breeze3(c, n = 9) {
  for (let i = 0; i < n; i++) { const x0 = -12 + ((i * 5.3 + c.t * 7) % 24), y = 0.5 + ((i * 1.3) % 2.4), z = -1.2 + (i % 4) * 0.7; let prev = null; for (let j = 0; j <= 6; j++) { const q = [x0 + j * 0.35, y + Math.sin(j * 0.9 + c.t * 3 + i) * 0.12, z]; if (prev) c.add.line(prev, q, 0.022, [255, 255, 255], 0.42 * Math.sin((j / 6) * Math.PI)); prev = q; } c.add.dot([x0 + 2.4, y + 0.1 + Math.sin(c.t * 5 + i) * 0.15, z], 0.05, i % 2 ? [255, 190, 110] : [160, 220, 130], 0.9); }
}
/** 纸船上载着的东西：吉他、星星、音符 */
export function cargo3(c, pos, items = 3) {
  c.add.custom(pos, (g, x, y, k) => { guitarShape(g, x - 0.1 * k, y - 0.25 * k, k * 0.8, 0.5); if (items > 1) { g.fillStyle = '#ffe066'; starPath(g, x + 0.45 * k, y - 0.45 * k, 0.2 * k, 0.2); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = Math.max(1, 0.025 * k); g.stroke(); } if (items > 2) { noteShape(g, x - 0.6 * k, y - 0.3 * k, 0.16 * k, '#ff8fb0', -0.2, true); } }, 0.1);
}
