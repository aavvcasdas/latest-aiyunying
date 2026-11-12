// @ts-nocheck
// 《反乌托邦》童话版布景：配色取自《童话镇》（通用模板/engine/sets.ts）——草地、奶油色小路、彩色房子、蓝顶城堡、彩虹河。
// 每个布景一个函数，第一次用到才搭，搭好缓存（静态面只算一次）。
import { Set3, C, rnd, hash, TAU, lerp, sm, tree, house, lamp, farHills, clouds, bench, drift } from './core';
import { bokeh, ring3, gear3 } from './fx';
import { butterflies, fireflies, moon3, starSwirl } from './fairy';
import { LINES } from './lyrics';

const mixc = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const WALLS = [0xf2d6b3, 0xe9a27a, 0xf6e6c4, 0xd98f6a, 0xcfe0ea, 0xf0c36d, 0xf2b8c6], ROOFS = [0xb5473c, 0x3f6fb5, 0x8a4fa3, 0x2f8f83, 0xc96a2b];
const GRASS = 0x7fcf66, PATH = 0xf3e4b8, CROWNS = [0x4fb85a, 0x62c66a, 0x45a852], NAVY = [44, 54, 116], DK = [58, 66, 112];
export const RAINBOW = [[255, 107, 120], [255, 170, 90], [255, 224, 102], [124, 222, 130], [100, 196, 255], [124, 134, 244], [196, 136, 244]];
const SKY = {
  day: { sky: ['#4aa8f8', '#a8dcff', '#fff6dc'], fog: [222, 240, 252], amb: 0.74, light: [0.35, 0.85, 0.4] },
  dusk: { sky: ['#6a5cc0', '#f7a2b6', '#ffdca4'], fog: [248, 196, 176], amb: 0.74, light: [-0.4, 0.6, 0.6] },
  night: { sky: ['#161c5e', '#2e409e', '#6c74cc'], fog: [60, 72, 156], amb: 0.68, light: [0.2, 0.85, 0.45], tint: 'rgba(90,110,255,0.10)', stars: 150 },
  dawn: { sky: ['#78a6f4', '#ffc2cc', '#fff2ba'], fog: [255, 228, 204], amb: 0.78, light: [0.1, 0.7, 0.6] },
  snow: { sky: ['#9cc2ea', '#d4e4f4', '#f6fafe'], fog: [234, 242, 250], amb: 0.78, light: [0.3, 0.8, 0.5] },
};
const toNight = (S, k = 0.46) => { for (const f of S.faces) if (!f.emit) f.col = mixc(f.col, NAVY, k); };
function pine(S, x, z, s, cols = [0x3fa060, 0x52b46c, 0x6cc87c]) { S.cyl(x, 0, z, 0.16 * s, 0.9 * s, 5, C(0x8a5a3a)); S.cone(x, 0.7 * s, z, 1.15 * s, 1.8 * s, 6, C(cols[0])); S.cone(x, 1.75 * s, z, 0.85 * s, 1.6 * s, 6, C(cols[1])); S.cone(x, 2.7 * s, z, 0.55 * s, 1.3 * s, 6, C(cols[2])); }
function mushroom(S, x, z, s, cap = 0xf0605a) { S.cyl(x, 0, z, 0.13 * s, 0.5 * s, 6, C(0xfff4e0)); S.blob(x, 0.45 * s, z, 0.55 * s, 0.42 * s, 0.55 * s, C(cap), { hemi: true, lat: 3, lon: 8, jit: 0.04, seed: 3 }); S.blob(x, 0.82 * s, z, 0.16 * s, 0.08 * s, 0.16 * s, [255, 255, 255], { hemi: true, lat: 2, lon: 6, jit: 0, emit: true, seed: 2 }); }
function flower(S, x, z, s, col, y = 0) {
  const h = 0.35 * s + 0.15, R = 0.16 * s, a1 = [], a2 = [];
  S.line([x, y, z], [x, y + h, z], 0.025, [80, 160, 70]);
  for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; a1.push([x + Math.cos(a) * R, y + h + Math.sin(a) * R * 0.75, z + Math.sin(a) * R * 0.45]); a2.push([x + Math.cos(a) * R * 0.38, y + h + Math.sin(a) * R * 0.3, z + Math.sin(a) * R * 0.17 + 0.01]); }
  S.poly(a1, col, { two: true, emit: true }); S.poly(a2, [255, 236, 130], { two: true, emit: true, edge: false, bias: -0.02 });
}
const PASTEL = [[255, 150, 190], [255, 214, 110], [150, 200, 255], [200, 160, 255], [255, 255, 255], [255, 130, 110]];
function flowers(S, seed, n, x0, x1, z0, z1, pal = PASTEL, skip = null) { const r = rnd(seed); for (let i = 0; i < n; i++) { const x = lerp(x0, x1, r()), z = lerp(z0, z1, r()), s = 0.7 + r() * 0.6, c = pal[(r() * pal.length) | 0]; if (skip && skip(x, z)) continue; flower(S, x, z, s, c); } }
function castle(S, x, z, s) {
  const wall = C(0xece6f5), roof = C(0x3f72e0);
  S.box(x, 0, z, 7 * s, 4 * s, 4 * s, wall); S.box(x, 0, z + 2 * s + 0.05, 1.5 * s, 2.3 * s, 0.1, C(0x6b3f2a), { bias: -1 });
  for (const [dx, h, r] of [[-3.5, 6.5, 1.1], [3.5, 6.5, 1.1], [0, 9, 1.5]]) { const zz = z - (dx ? 0 : 0.6 * s); S.cyl(x + dx * s, 0, zz, r * s, h * s, 8, wall); S.cone(x + dx * s, h * s, zz, r * 1.4 * s, 2.8 * s, 8, roof); S.line([x + dx * s, (h + 2.8) * s, zz], [x + dx * s, (h + 3.7) * s, zz], 0.08 * s, [90, 60, 50]); S.poly([[x + dx * s, (h + 3.7) * s, zz], [x + dx * s + 0.9 * s, (h + 3.45) * s, zz], [x + dx * s, (h + 3.2) * s, zz]], [230, 57, 70], { two: true, emit: true }); }
}

// ---------- 彩虹河小镇（《童话镇》的主场景）：day / dusk / night / dark（没有颜色的反乌托邦）/ wake（颜色回来）/ snow / dawn ----------
export const riverZ = (x) => -7.0 + Math.sin(x * 0.16) * 1.4;
export const WAKE = LINES[56].s;
export const wakeQ = (t, x) => sm((t - WAKE - 0.05 - (Math.max(-16, Math.min(16, x)) + 14) * 0.042) / 0.5);
function setTown(mode) {
  const dark = mode === 'dark' || mode === 'wake', night = dark || mode === 'night', snow = mode === 'snow';
  const S = new Set3({ ...(snow ? SKY.snow : night ? SKY.night : SKY[mode]), fogNear: 34, fogFar: 200 });
  if (dark) { S.sky = ['#10143c', '#222c64', '#444c86']; S.fog = [50, 58, 108]; S.tint = 'rgba(70,80,150,0.24)'; S.stars = 60; }
  const r = rnd(9), grass = snow ? 0xf4f8fc : mode === 'dusk' ? 0x9ccf74 : GRASS, crowns = snow ? [0xffffff, 0xf0f6fc] : CROWNS;
  S.ground(-220, -220, 220, 60, C(grass), { nx: 10, nz: 8 }); S.ground(-80, -1.7, 80, 1.7, C(snow ? 0xe4ecf6 : PATH), { order: 1, nx: 16 });
  for (let x = -72; x < 72; x += 2) for (let b = 0; b < 7; b++) { const za = riverZ(x) - 2.17 + b * 0.62, zb = riverZ(x + 2) - 2.17 + b * 0.62; S.poly([[x, 0, za], [x + 2, 0, zb], [x + 2, 0, zb + 0.62], [x, 0, za + 0.62]], RAINBOW[b], { n: [0, 1, 0], layer: 0, order: 1, two: true, emit: true, edge: false }); }
  if (!dark) for (let x = -72; x < 72; x += 2) for (const o of [-2.2, 2.2]) S.line([x, 0.03, riverZ(x) + o], [x + 2, 0.03, riverZ(x + 2) + o], 0.14, [255, 252, 240], 0.95);
  for (let x = -66; x <= 66; x += 8.5) house(S, x + r() * 3, -14.4 - r() * 6, 4 + r() * 2, 3 + r() * 1.6, 4, WALLS[(r() * 7) | 0], snow ? 0xf6fafe : ROOFS[(r() * 5) | 0], (r() - 0.5) * 0.5);
  for (let x = -62; x <= 62; x += 12) house(S, x + 5 + r() * 3, -27 - r() * 8, 4.6, 3.4, 4, WALLS[(r() * 7) | 0], snow ? 0xf6fafe : ROOFS[(r() * 5) | 0], (r() - 0.5) * 0.4);
  castle(S, 17, -48, 1.5);
  [[-9, -2.5, 1.2], [9.5, -2.6, 1.3], [-21, -2.5, 1.4], [22, -2.6, 1.2], [-15, -11.6, 1.5], [3, -11.8, 1.3], [13, -11.5, 1.5], [-30, -11.6, 1.5], [31, -11.8, 1.6], [-4, -19, 1.7], [24, -20, 1.7]].forEach(([x, z, s], i) => tree(S, x, z, s, 0x8a5a3c, crowns, 11 + i));
  for (const x of [-13, -4.5, 4.5, 13]) lamp(S, x, -2.3, 3.2, [255, 200, 90]);
  bench(S, 7.2, -2.3, 0xb07a52);
  if (!snow) flowers(S, 77, 60, -24, 24, -3.2, 3.6, PASTEL, (x, z) => Math.abs(z) < 1.9);
  farHills(S, snow ? [0xe4ecf4, 0xcfdcea] : [0x79b98a, 0x6aa9c9], 15);
  if (!night) clouds(S, [255, 255, 255], 20, 8);
  if (mode === 'day' || snow) S.glows.push({ pos: [-40, 60, -170], r: 34, col: [255, 248, 210], a: 0.85 });
  if (mode === 'dusk') S.glows.push({ pos: [20, 9, -170], r: 46, col: [255, 214, 150], a: 0.9 }, { pos: [20, 9, -170], r: 13, col: [255, 250, 225], a: 1 });
  if (mode === 'dawn') S.glows.push({ pos: [0, 7, -170], r: 64, col: [255, 236, 170], a: 0.95 }, { pos: [0, 7, -170], r: 16, col: [255, 252, 232], a: 1 });
  if (mode === 'night') toNight(S);
  if (mode === 'dark') { for (const f of S.faces) f.col = mixc(f.col, DK, f.emit ? 0.86 : 0.7); S.glows = []; }
  if (mode === 'wake') { for (const f of S.faces) { const full = f.emit ? f.col : mixc(f.col, NAVY, 0.3), dk = mixc(f.col, DK, f.emit ? 0.86 : 0.7), x = f.c[0]; f.colFn = (t) => { const q = wakeQ(t, x); return q <= 0 ? dk : q >= 1 ? full : mixc(dk, full, q); }; } S.glows = []; }
  S.dyn = (t, add) => {
    if (mode === 'day' || mode === 'dawn') { drift(add, t, 34, [255, 194, 218], [-14, 28, -4, 6, 9], 0.6, 0.5, 0.05, 3); butterflies(add, t, 6, [-7, 14, -2.6, 4, 0.5, 1.6], 4); }
    if (mode === 'dusk') { drift(add, t, 26, [255, 206, 190], [-14, 28, -4, 6, 9], 0.5, 0.5, 0.05, 3); fireflies(add, t, 14, [-10, 20, -4, 6, 0.4, 2.2], 5); }
    if (mode === 'snow') drift(add, t, 70, [255, 255, 255], [-14, 28, -6, 7, 10], 0.9, 0.3, 0.045, 31);
    if (mode === 'night') { moon3(add, [-18, 24, -90], 6); fireflies(add, t, 26, [-12, 24, -5, 8, 0.3, 2.6], 6); }
    if (mode === 'dark') moon3(add, [-18, 24, -90], 6, 0.5);
    if (mode === 'wake') { moon3(add, [-18, 24, -90], 6, 0.75); for (const x of [-13, -4.5, 4.5, 13]) add.glow([x, 3.4, -2.3], 2.4, [255, 200, 90], 0.5 * wakeQ(t, x)); const q = wakeQ(t, 0); if (q > 0) fireflies(add, t, 24, [-12, 24, -5, 8, 0.3, 2.6], 6, [255, 240, 150]); }
  };
  return S;
}
// ---------- 森林空地 ----------
function setGlade(mode) {
  const night = mode === 'night';
  const S = new Set3(night ? { ...SKY.night, fogNear: 22, fogFar: 110 } : { sky: ['#52b0f6', '#b2e6e2', '#f8fbd6'], fog: [208, 238, 208], amb: 0.76, light: [0.35, 0.85, 0.4], fogNear: 26, fogFar: 120 });
  S.ground(-220, -220, 220, 60, C(0x74c862), { nx: 10, nz: 8 }); S.ground(-7.5, -4.5, 7.5, 4.5, C(0x94dc7c), { order: 1, nx: 7, nz: 4 });
  const r = rnd(31);
  for (let i = 0; i < 30; i++) { const a = -0.3 + (i / 29) * (Math.PI + 0.6), d = 10 + r() * 8; pine(S, Math.cos(a) * d * 1.5, -3.5 - Math.sin(a) * d, 1.3 + r() * 0.9); }
  tree(S, -6.6, -2.6, 1.7, 0x8a5a3c, CROWNS, 3); tree(S, 6.8, -2.8, 1.7, 0x8a5a3c, CROWNS, 4);
  [[-4.6, -3.0, 1.4, 0xf0605a], [5.0, -3.4, 1.9, 0xf0605a], [-6.4, 1.6, 1.0, 0xf2a03c], [6.6, 1.0, 1.1, 0xf0605a], [3.4, -3.9, 0.9, 0xc07ae0]].forEach(([x, z, s, c]) => mushroom(S, x, z, s, c));
  flowers(S, 41, 46, -8, 8, -4, 3.6, PASTEL, (x, z) => Math.abs(x) < 2.6 && Math.abs(z) < 1.6);
  if (night) { S.cyl(0, 0, -0.2, 1.05, 0.45, 10, C(0xa8784e), { top: C(0xe8c898) }); toNight(S, 0.42); }
  else { clouds(S, [255, 255, 255], 33, 6); S.glows.push({ pos: [-30, 50, -120], r: 30, col: [255, 250, 215], a: 0.8 }); }
  S.dyn = (t, add) => {
    if (night) { moon3(add, [10, 20, -70], 5); fireflies(add, t, 34, [-9, 18, -5, 8, 0.3, 3], 8); }
    else { butterflies(add, t, 7, [-6, 12, -3, 5, 0.5, 1.8], 2); drift(add, t, 26, [255, 255, 255], [-9, 18, -4, 5, 8], 0.25, 0.2, 0.03, 13, 0.7); for (let i = 0; i < 3; i++) add.beam([-6 + i * 5, 12, -6], [-4 + i * 4 + Math.sin(t * 0.4 + i) * 0.4, 0.02, -1.5], 1.3, [255, 250, 200], 0.07); }
  };
  return S;
}
// ---------- 树篱迷宫（爱丽丝的花园）：随机生成，保证一横一竖两条走廊是通的 ----------
export const MAZE = { N: 9, cs: 2.2, zc: -6, row: 6, col: 4 };
const mzX = (i) => (i - (MAZE.N - 1) / 2) * MAZE.cs, mzZ = (j) => MAZE.zc + (j - (MAZE.N - 1) / 2) * MAZE.cs;
export const MZ = { rowZ: mzZ(MAZE.row), colX: mzX(MAZE.col), x0: mzX(0) - MAZE.cs / 2, x1: mzX(MAZE.N - 1) + MAZE.cs / 2, z0: mzZ(0) - MAZE.cs / 2, z1: mzZ(MAZE.N - 1) + MAZE.cs / 2 };
function setMaze() {
  const S = new Set3({ ...SKY.day, fogNear: 30, fogFar: 120 });
  S.ground(-200, -200, 200, 60, C(GRASS), { nx: 6, nz: 6 }); S.ground(MZ.x0 - 1.6, MZ.z0 - 1.6, MZ.x1 + 1.6, MZ.z1 + 1.6, C(PATH), { order: 1, nx: 6, nz: 6 });
  const { N, cs, row, col } = MAZE, r = rnd(17), r2 = rnd(5), hW = [...Array(N)].map(() => Array(N).fill(true)), vW = [...Array(N)].map(() => Array(N).fill(true)), seen = [...Array(N)].map(() => Array(N).fill(false)), st = [[0, 0]];
  seen[0][0] = true;
  while (st.length) {
    const [i, j] = st[st.length - 1], nb = [];
    if (i > 0 && !seen[i - 1][j]) nb.push([i - 1, j, 'L']); if (i < N - 1 && !seen[i + 1][j]) nb.push([i + 1, j, 'R']); if (j > 0 && !seen[i][j - 1]) nb.push([i, j - 1, 'U']); if (j < N - 1 && !seen[i][j + 1]) nb.push([i, j + 1, 'D']);
    if (!nb.length) { st.pop(); continue; }
    const [ni, nj, d] = nb[(r() * nb.length) | 0]; if (d === 'L') vW[ni][j] = false; if (d === 'R') vW[i][j] = false; if (d === 'U') hW[i][nj] = false; if (d === 'D') hW[i][j] = false; seen[ni][nj] = true; st.push([ni, nj]);
  }
  for (let i = 0; i < N - 1; i++) vW[i][row] = false; for (let j = 0; j < N - 1; j++) hW[col][j] = false;
  const bud = (x, z) => { if (r2() < 0.7) S.blob(x + (r2() - 0.5) * 1.2, 1.2, z + (r2() - 0.5) * 0.1, 0.17, 0.12, 0.17, PASTEL[(r2() * 4) | 0], { hemi: true, emit: true, lat: 2, lon: 5, jit: 0, seed: 2 }); };
  const wallX = (x, z) => { S.box(x, 0, z, cs + 0.3, 1.2, 0.3, C(0x4fae5a), { top: C(0x8adc7e) }); bud(x, z); };
  const wallZ = (x, z) => { S.box(x, 0, z, 0.3, 1.2, cs + 0.3, C(0x4fae5a), { top: C(0x8adc7e) }); bud(x, z); };
  for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
    if (vW[i][j] && !(i === N - 1 && j === row)) wallZ(mzX(i) + cs / 2, mzZ(j));
    if (hW[i][j] && !(j === N - 1 && i === col)) wallX(mzX(i), mzZ(j) + cs / 2);
  }
  for (let j = 0; j < N; j++) if (j !== row) wallZ(mzX(0) - cs / 2, mzZ(j));
  for (let i = 0; i < N; i++) if (i !== col) wallX(mzX(i), mzZ(0) - cs / 2);
  for (const [x, z, s] of [[-14, -18, 1.6], [14, -19, 1.7], [-15, -2, 1.5], [15, -3, 1.5], [0, -21, 1.8]]) tree(S, x, z, s, 0x8a5a3c, CROWNS, x + 40);
  farHills(S, [0x79b98a, 0x6aa9c9], 15, -70);
  S.dyn = (t, add) => butterflies(add, t, 6, [-8, 16, -12, 12, 1.6, 1.2], 9);
  return S;
}
// ---------- 星空（放小星球） ----------
function setStarSky(v) {
  const S = new Set3({ sky: v ? ['#2a1c68', '#7c4aac', '#f2aaca'] : ['#182268', '#4c46ac', '#ba92de'], fog: [90, 80, 170], fogNear: 60, fogFar: 300, amb: 0.72, light: [-0.5, 0.6, 0.6], noFloor: true, noShadow: true });
  S.bg = (g, t) => starSwirl(g, t, v ? -0.34 : 0.34, v ? 5 : 1);
  return S;
}
// ---------- 夜晚的小山坡：极光、流星、月亮 ----------
function setHill(v) {
  const S = new Set3({ ...SKY.night, sky: v ? ['#1e1a60', '#4e3c9e', '#a674c4'] : ['#141c5a', '#2c4c9e', '#5c9ccc'], fogNear: 26, fogFar: 150, noFloor: true, stars: 200 });
  S.blob(0, -60, 0, 60, 60, 60, C(v ? 0x5e9c8c : 0x58a87e), { hemi: true, lat: 8, lon: 28, jit: 0.02, seed: 4 });
  tree(S, -4.2, -1.8, 1.4, 0x6b4a5a, [0x3f8a70, 0x4a9a7a, 0x357a64], 8);
  flowers(S, 21, 26, -3.4, 3.4, -1.6, 1.8, [[255, 255, 255], [255, 220, 150], [200, 200, 255]], (x, z) => Math.abs(x) < 0.7 && Math.abs(z) < 0.5);
  S.dyn = (t, add, S2) => {
    const cols = v ? [[255, 150, 210], [190, 140, 255], [140, 180, 255]] : [[120, 255, 200], [110, 220, 255], [170, 255, 180]];
    for (let r = 0; r < 4; r++) { const z = -26 - r * 7, col = cols[r % 3]; for (let i = 0; i < 18; i++) { const x0 = -30 + i * 3.4, x1 = x0 + 3.4, w0 = Math.sin(x0 * 0.12 + t * 0.8 + r) * 3, w1 = Math.sin(x1 * 0.12 + t * 0.8 + r) * 3, b0 = 7 + Math.sin(x0 * 0.3 + t + r) * 1.2, b1 = 7 + Math.sin(x1 * 0.3 + t + r) * 1.2; S2.poly([[x0, b0, z + w0], [x1, b1, z + w1], [x1, b1 + 7, z + w1 - 2], [x0, b0 + 7, z + w0 - 2]], col, { two: true, emit: true, alpha: 0.16 + 0.06 * Math.sin(t * 2 + i + r), edge: false }); } }
    moon3(add, [v ? -14 : 14, 20, -80], 5);
    const ph = (t * 0.45) % 1, sx = -20 + ph * 44 + (Math.floor(t * 0.45) % 3) * 5; if (ph < 0.5) add.line([sx, 22 - ph * 12, -60], [sx - 5, 23.4 - ph * 12, -60], 0.22, [255, 250, 220], 0.9 * Math.sin(ph * TAU));
    fireflies(add, t, 14, [-6, 12, -3, 5, 0.3, 1.8], 12);
  };
  return S;
}
// ---------- 童话小车站（终点站）：木牌、红顶小亭、长椅，路边一只南瓜 ----------
export const PUMPKIN = [-4.6, 0.62, 3.0];
function setBusStop(rain) {
  const S = new Set3(rain ? { sky: ['#7682b6', '#a6aed2', '#d6daea'], fog: [194, 200, 224], amb: 0.72, light: [0.2, 0.85, 0.4], fogNear: 20, fogFar: 120, rain: true, mirror: true, tint: 'rgba(120,140,220,0.08)' } : { ...SKY.dusk, fogNear: 24, fogFar: 150 });
  S.ground(-220, -220, 220, 60, C(rain ? 0x86ba92 : 0x9ccf74), { nx: 8, nz: 8 }); S.ground(-80, 1.7, 80, 6.4, C(rain ? 0xc2bed0 : 0xead8b4), { order: 1, nx: 16 }); S.ground(-6, -2.9, 6, 1.7, C(rain ? 0xd4cede : PATH), { order: 1, nx: 6 });
  for (const [x, z] of [[-2.4, -2.1], [2.4, -2.1], [-2.4, -0.1], [2.4, -0.1]]) S.box(x, 0, z, 0.15, 2.5, 0.15, C(0x9a6a44));
  S.gable(0, 2.5, -1.1, 5.8, 1.15, 3.0, C(0xd8504a)); bench(S, 0, -1.55, 0xc08a5a);
  S.cyl(3.7, 0, -0.3, 0.07, 3.0, 5, C(0x9a6a44)); S.box(3.7, 2.3, -0.3, 1.8, 0.72, 0.1, C(0xfff0c8)); S.texts.push({ pos: [3.7, 2.67, -0.2], str: '终点站', size: 0.44, col: '#8a5a2a', plain: true });
  S.box(-1.3, 1.5, -2.05, 1.9, 0.52, 0.06, C(0xfff6e0)); S.texts.push({ pos: [-1.3, 1.77, -1.98], str: '下一班  ……', size: 0.25, col: '#b08050', plain: true });
  S.blob(PUMPKIN[0], PUMPKIN[1], PUMPKIN[2], 0.92, 0.64, 0.82, C(0xf09030), { lat: 4, lon: 10, jit: 0.06, seed: 5 }); S.cyl(PUMPKIN[0], 1.18, PUMPKIN[2], 0.08, 0.3, 5, C(0x5a9a4a));
  lamp(S, -5.2, -2.4, 3.2, [255, 200, 90]);
  [[-9, -5, 1.5], [8.5, -5.5, 1.6], [-16, -8, 1.6], [15, -8.5, 1.7], [0.5, -9, 1.7]].forEach(([x, z, s], i) => tree(S, x, z, s, 0x8a5a3c, CROWNS, 50 + i));
  const r = rnd(29); for (let x = -40; x <= 40; x += 10) house(S, x + r() * 3, -16 - r() * 6, 4.4, 3.2, 4, WALLS[(r() * 7) | 0], ROOFS[(r() * 5) | 0], (r() - 0.5) * 0.5);
  flowers(S, 37, 40, -14, 14, -6, -3.2); farHills(S, [0x79b98a, 0x6aa9c9], 15);
  if (!rain) { clouds(S, [255, 214, 204], 20, 7); S.glows.push({ pos: [-24, 9, -170], r: 44, col: [255, 214, 150], a: 0.9 }); }
  S.dyn = (t, add) => { if (!rain) drift(add, t, 18, [240, 170, 90], [-12, 24, -3, 4, 7], 0.35, 1.2, 0.05, 12, 0.85); };
  return S;
}
// ---------- 旋转木马 / 八音盒：粉白条纹顶棚、金色立柱 ----------
function setCarousel() {
  const S = new Set3({ sky: ['#3c3294', '#a474d0', '#ffc8d4'], fog: [206, 158, 216], fogNear: 24, fogFar: 130, amb: 0.76, light: [0.2, 0.85, 0.45], stars: 110 });
  S.ground(-220, -220, 220, 60, C(0x8e8ad4), { nx: 8, nz: 8 }); S.cyl(0, 0, 0, 3.9, 0.12, 24, C(0xf7a8c0), { top: C(0xfff0d8) });
  for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU + 0.2; S.cyl(Math.cos(a) * 3.4, 0.12, Math.sin(a) * 3.4, 0.06, 3.0, 5, C(0xf2c14e), { noTop: true }); }
  const n = 16, R = 4.1;
  for (let i = 0; i < n; i++) { const a0 = (i / n) * TAU, a1 = ((i + 1) / n) * TAU, p0 = [Math.cos(a0) * R, Math.sin(a0) * R], p1 = [Math.cos(a1) * R, Math.sin(a1) * R]; S.poly([[p0[0], 3.3, p0[1]], [p1[0], 3.3, p1[1]], [0, 4.7, 0]], C(i % 2 ? 0xff8fb0 : 0xfff4e4), { two: true, out: [0, 0, 0] }); S.poly([[p0[0], 3.0, p0[1]], [p1[0], 3.0, p1[1]], [p1[0], 3.3, p1[1]], [p0[0], 3.3, p0[1]]], C(i % 2 ? 0xfff4e4 : 0xf2c14e), { two: true, out: [0, 3.1, 0] }); S.glows.push({ pos: [p0[0], 2.95, p0[1]], r: 0.42, col: i % 2 ? [255, 240, 170] : [255, 170, 200], a: 0.9 }); }
  S.blob(0, 4.85, 0, 0.26, 0.26, 0.26, [255, 220, 120], { emit: true, jit: 0, seed: 2 });
  for (const [x, z, s] of [[-9, -6, 1.5], [9.5, -7, 1.6], [-13, 2, 1.4], [13, 1, 1.5]]) tree(S, x, z, s, 0x7a5a7a, [0x7a86d8, 0x8c98e4, 0x6a76c8], x + 30);
  S.dyn = (t, add) => { moon3(add, [-16, 22, -80], 5); for (let i = 0; i < 5; i++) { const rr = (t * 1.5 + i * 0.75) % 3.7; ring3(add, 0, 0.14, 0, 0.3 + rr, 40, 0.04, [[255, 150, 190], [255, 214, 110], [150, 200, 255]][i % 3], 0.8 * (1 - rr / 3.7)); } };
  return S;
}
// ---------- 小木屋（放立体相册） ----------
function setCottage() {
  const S = new Set3({ sky: ['#f6dcb4', '#f6dcb4', '#f6dcb4'], fog: [250, 226, 190], fogNear: 30, fogFar: 120, light: [0.4, 0.8, 0.45], amb: 0.76 });
  S.ground(-8, -4, 8, 7, C(0xd9a877), { nx: 8, nz: 1, colAt: (i) => C(i % 2 ? 0xd9a877 : 0xe2b384) }); S.ground(-3.2, -1.2, 3.2, 2.6, C(0xf7b8c8), { order: 1 });
  S.poly([[-8, 0, -4], [8, 0, -4], [8, 6.5, -4], [-8, 6.5, -4]], C(0xfff0d6), { n: [0, 0, 1], bias: 4 });
  S.poly([[-8, 0, 7], [-8, 0, -4], [-8, 6.5, -4], [-8, 6.5, 7]], C(0xf8dfbc), { n: [1, 0, 0], bias: 4 }); S.poly([[8, 0, -4], [8, 0, 7], [8, 6.5, 7], [8, 6.5, -4]], C(0xf8dfbc), { n: [-1, 0, 0], bias: 4 });
  const r = rnd(23), bc = [0xf2a0b0, 0x8fc4f0, 0x8ad8b0, 0xf2cf6a, 0xc0a0f0, 0xfff0d0];
  for (const sx of [-5.7, 5.7]) { S.box(sx, 0, -3.6, 3.2, 4.4, 0.7, C(0xb07a52)); for (let row = 0; row < 4; row++) { let x = sx - 1.4; while (x < sx + 1.3) { const w = 0.16 + r() * 0.12, h = 0.5 + r() * 0.3; S.box(x + w / 2, 0.3 + row * 1.03, -3.22, w, h, 0.3, C(bc[(r() * 6) | 0]), { bias: -0.6 }); x += w + 0.03; } } }
  S.poly([[-1.8, 3.3, -3.97], [1.8, 3.3, -3.97], [1.8, 5.8, -3.97], [-1.8, 5.8, -3.97]], [176, 224, 255], { n: [0, 0, 1], emit: true, bias: 2.5 });
  for (const [a, b] of [[[-1.8, 3.3], [1.8, 3.3]], [[-1.8, 5.8], [1.8, 5.8]], [[-1.8, 3.3], [-1.8, 5.8]], [[1.8, 3.3], [1.8, 5.8]], [[0, 3.3], [0, 5.8]], [[-1.8, 4.55], [1.8, 4.55]]]) S.line([a[0], a[1], -3.93], [b[0], b[1], -3.93], 0.12, [255, 250, 240]);
  for (const sx of [-2.3, 2.3]) S.box(sx, 3.1, -3.85, 0.7, 2.9, 0.1, C(0xf7a8c0), { bias: 1 });
  S.glows.push({ pos: [0, 4.6, -3.9], r: 3.8, col: [255, 244, 214], a: 0.5 });
  S.dyn = (t, add) => drift(add, t, 26, [255, 244, 200], [-6, 12, 0.3, 5.5, 4], 0.15, 0.05, 0.02, 9, 0.7);
  return S;
}
// ---------- 花海 ----------
function setMeadow(sunset) {
  const S = new Set3({ ...(sunset ? SKY.dusk : SKY.day), fogNear: 30, fogFar: 170 });
  S.ground(-200, -200, 200, 60, C(sunset ? 0x9ccf74 : GRASS), { nx: 10, nz: 8 });
  flowers(S, sunset ? 77 : 55, 240, -17, 17, -16, 6, sunset ? [[190, 130, 255], [130, 180, 255], [255, 160, 100], [255, 224, 130], [255, 130, 190]] : [[255, 130, 60], [255, 100, 80], [255, 180, 60], [255, 210, 90], [255, 150, 190]], (x, z) => Math.abs(z - 0.5) < 0.55 && Math.abs(x) < 7);
  farHills(S, [0x79b98a, 0x6aa9c9], 8); clouds(S, sunset ? [255, 208, 198] : [255, 255, 255], 12, 8);
  S.glows.push(sunset ? { pos: [10, 8, -170], r: 46, col: [255, 214, 150], a: 0.95 } : { pos: [-30, 60, -170], r: 30, col: [255, 250, 215], a: 0.8 });
  if (!sunset) for (let b = 0; b < 7; b++) { const R = 78 - b * 2; let prev = null; for (let i = 0; i <= 20; i++) { const a = Math.PI * (0.1 + 0.8 * (i / 20)), q = [6 + Math.cos(a) * R, Math.sin(a) * R - 14, -150]; if (prev) S.line(prev, q, 2.1, RAINBOW[b], 0.6); prev = q; } }
  S.dyn = (t, add) => { drift(add, t, 40, sunset ? [255, 200, 230] : [255, 190, 110], [-14, 28, -4, 6, 9], 0.5, 0.6, 0.05, 41); butterflies(add, t, 9, [-7, 14, -3, 5, 0.5, 1.6], 3); };
  return S;
}
// ---------- 太阳太烫：大家躲在一朵大蘑菇底下 ----------
function setSunny() {
  const S = new Set3({ sky: ['#ffb44e', '#ffe08c', '#fff8da'], fog: [255, 234, 176], fogNear: 18, fogFar: 90, amb: 0.8, light: [0.1, 0.95, 0.2] });
  S.ground(-200, -200, 200, 60, C(0xf0da7c), { nx: 6, nz: 6 }); S.ground(-4.2, -4, 4.2, 2.6, C(0xb4cc6e), { order: 1, nx: 4, nz: 3 });
  S.cyl(0, 0, -1.3, 0.6, 2.7, 8, C(0xfff4e0), { r2: 0.42 }); S.blob(0, 2.6, -1.3, 4.0, 1.8, 3.6, C(0xf0605a), { hemi: true, lat: 4, lon: 12, jit: 0.04, seed: 7 });
  for (const [a, v] of [[0.6, 0.5], [2.0, 0.8], [3.4, 0.45], [4.6, 0.9], [5.6, 0.6], [1.2, 1.15], [2.7, 1.2]]) S.blob(Math.sin(v) * Math.cos(a) * 3.9, 2.6 + Math.cos(v) * 1.78, -1.3 + Math.sin(v) * Math.sin(a) * 3.5, 0.42, 0.14, 0.42, [255, 255, 255], { hemi: true, emit: true, lat: 2, lon: 6, jit: 0, seed: 2, bias: -0.5 });
  flowers(S, 61, 30, -12, 12, -8, 4, [[255, 236, 150], [255, 200, 120]], (x, z) => Math.abs(x) < 4.4 && z > -4 && z < 2.8);
  S.glows.push({ pos: [0, 12, -30], r: 16, col: [255, 252, 224], a: 1 }, { pos: [0, 12, -30], r: 40, col: [255, 236, 170], a: 0.7 });
  S.bg = (g, t) => bokeh(g, t, [[255, 240, 190], [255, 214, 130], [255, 255, 230]], 30, 3, 0.4);
  S.dyn = (t, add) => { for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) add.beam([sx * 3, 14, -10], [sx * (6.2 + i * 2.2), 0.02, -1 + i], 1.2, [255, 250, 200], 0.1); for (let i = 0; i < 40; i++) { const sd = i % 2 ? 1 : -1, y = (hash(i + 3) * 3 + t * (0.4 + hash(i) * 0.5)) % 3, x = sd * (4.8 + hash(i + 7) * 6) + Math.sin(t * 2 + i) * 0.15; add.dot([x, y, -3 + hash(i + 11) * 5], 0.04, [255, 170, 80], 0.8 * (1 - y / 3)); } };
  return S;
}
// ---------- 晚霞云海 ----------
function setSunsetSky() {
  const S = new Set3({ sky: ['#4a3ca0', '#f08aa4', '#ffcc8c'], fog: [248, 180, 150], fogNear: 40, fogFar: 200, amb: 0.78, light: [-0.4, 0.5, 0.6], noFloor: true, noShadow: true });
  const r = rnd(91); for (let i = 0; i < 26; i++) S.blob(-40 + r() * 80, -2.5 + r() * 1.2, -6 - r() * 40, 3 + r() * 4, 1.4 + r() * 1.2, 3 + r() * 3, [255, 214 + r() * 30, 206 + r() * 30], { emit: true, seed: i + 3, lat: 3, lon: 6 });
  S.glows.push({ pos: [0, 2, -150], r: 50, col: [255, 220, 160], a: 0.9 }, { pos: [0, 2, -150], r: 14, col: [255, 250, 225], a: 1 });
  return S;
}
// ---------- 雾里：看不见的地方（城堡只有淡淡的影子） ----------
function setMist() {
  const S = new Set3({ sky: ['#b6b2e4', '#e0dcf4', '#fff4f0'], fog: [240, 236, 249], fogNear: 5, fogFar: 46, amb: 0.8, light: [0.3, 0.8, 0.5] });
  S.ground(-200, -200, 200, 60, C(0xdcd8f0), { nx: 6, nz: 6 }); S.ground(-9, -2.6, 9, 5, C(0xa6dc9a), { order: 1, nx: 6, nz: 3 });
  castle(S, 0.5, -30, 1.3);
  const r = rnd(52); for (let i = 0; i < 16; i++) S.blob(-24 + i * 3.2 + r() * 2, 0.1 + r() * 0.4, -4.6 - r() * 7, 2.6 + r() * 1.6, 1.0 + r() * 0.6, 2, [255, 255, 255], { emit: true, hemi: true, seed: i + 9, lat: 3, lon: 7 });
  tree(S, -5.6, -1.2, 1.5, 0x8a5a3c, CROWNS, 6); flowers(S, 14, 24, -8, 8, -2.2, 3.6, PASTEL, (x, z) => Math.abs(x) < 2 && Math.abs(z) < 1);
  S.dyn = (t, add) => { for (let i = 0; i < 6; i++) { const x = ((i * 9 + t * 0.8) % 50) - 25; add.glow([x, 1.2 + (i % 3) * 0.6, -6 - i * 2], 6, [250, 246, 255], 0.3); } add.glow([0.5, 10, -30], 13, [255, 236, 200], 0.28 + 0.1 * Math.sin(t * 2)); };
  return S;
}
// ---------- 三色大钟：醒 / 梦 / 花 ----------
export const CLOCK = { x: 0, y: 3.4, z: -5, r: 2.9 };
function setClock() {
  const S = new Set3({ ...SKY.day, fogNear: 30, fogFar: 170 });
  S.ground(-200, -200, 200, 60, C(GRASS), { nx: 10, nz: 8 });
  const { x, y, z, r } = CLOCK, cols = [[255, 220, 96], [124, 150, 240], [130, 214, 130]];
  S.cyl(x, 0, z - 0.3, 0.16, y - r + 0.2, 6, C(0xfff4e0));
  for (let k = 0; k < 3; k++) { const pts = [[x, y, z]]; for (let i = 0; i <= 10; i++) { const a = ((k * 120 + i * 12) * Math.PI) / 180; pts.push([x + Math.sin(a) * r, y + Math.cos(a) * r, z]); } S.poly(pts, cols[k], { n: [0, 0, 1], emit: true }); }
  for (let i = 0; i < 36; i++) { const a0 = (i / 36) * TAU, a1 = ((i + 1) / 36) * TAU; S.line([x + Math.sin(a0) * r, y + Math.cos(a0) * r, z + 0.02], [x + Math.sin(a1) * r, y + Math.cos(a1) * r, z + 0.02], 0.16, [255, 252, 244]); }
  for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; S.line([x + Math.sin(a) * r * 0.86, y + Math.cos(a) * r * 0.86, z + 0.03], [x + Math.sin(a) * r * 0.97, y + Math.cos(a) * r * 0.97, z + 0.03], 0.06, [120, 90, 70]); }
  ['醒', '梦', '花'].forEach((s, k) => { const a = ((k * 120 + 60) * Math.PI) / 180; S.texts.push({ pos: [x + Math.sin(a) * r * 0.55, y + Math.cos(a) * r * 0.55, z + 0.05], str: s, size: 0.95, col: ['#9a6a00', '#2a3a8a', '#2a6a2a'][k], plain: true }); });
  S.box(4.3, 0, 0.4, 1.8, 0.78, 0.9, C(0xc49a70), { top: C(0xe0b88a) }); S.box(4.1, 0.78, 0.4, 0.7, 0.04, 0.46, C(0x8a8fb0));
  S.poly([[3.76, 0.82, 0.2], [4.44, 0.82, 0.2], [4.44, 1.28, 0.1], [3.76, 1.28, 0.1]], [176, 226, 255], { emit: true, two: true, bias: -0.2 });
  const r2 = rnd(4); for (let i = 0; i < 7; i++) S.blob(-0.9 + i * 0.3, 0.3 + r2() * 0.1, 1.3 + (r2() - 0.5) * 0.3, 0.45, 0.3, 0.4, [255, 255, 255], { emit: true, seed: i + 30, lat: 3, lon: 6 });
  S.cyl(-4.4, 0, 0.9, 0.32, 0.4, 8, C(0xd8744a), { r2: 0.4 });
  flowers(S, 9, 50, -14, 14, -4, 4, PASTEL, (fx, fz) => Math.abs(fx) < 5.6 && fz > -0.6 && fz < 2.2);
  for (const [tx, tz, s] of [[-9, -6, 1.5], [9.5, -6.5, 1.6], [-15, -10, 1.6], [15, -11, 1.7]]) tree(S, tx, tz, s, 0x8a5a3c, CROWNS, tx + 60);
  clouds(S, [255, 255, 255], 44, 7); farHills(S, [0x79b98a, 0x6aa9c9], 21);
  S.dyn = (t, add, S2, p, e, c) => { const sec = c.shot.clock ?? 0, a = ((sec * 120 + 15 + ((c.t * 40) % 90)) * Math.PI) / 180, ca = ((sec * 120 + 60) * Math.PI) / 180; add.line([x, y, z + 0.08], [x + Math.sin(a) * r * 0.85, y + Math.cos(a) * r * 0.85, z + 0.08], 0.1, [120, 90, 70]); add.dot([x, y, z + 0.1], 0.15, [120, 90, 70]); add.glow([x + Math.sin(ca) * r * 0.55, y + Math.cos(ca) * r * 0.55, z + 0.2], 2.6, cols[sec], 0.35 + 0.25 * p); butterflies(add, t, 4, [-5, 10, -1, 3, 0.6, 1.4], 6); };
  return S;
}
// ---------- 一排一模一样的小房子：每天重演 ----------
export const ROWS = [-8.4, -4.2, 0, 4.2, 8.4], ROW_W = TAU / 0.984;
function setRows() {
  const S = new Set3({ ...SKY.day, fogNear: 30, fogFar: 170 });
  S.ground(-200, -200, 200, 60, C(GRASS), { nx: 10, nz: 8 }); S.ground(-80, -1.6, 80, 1.2, C(PATH), { order: 1, nx: 16 });
  for (const x of ROWS) { house(S, x, -3.6, 3.2, 2.6, 3, 0xf6e6c4, 0xb5473c, 0); S.box(x + 1.9, 0, -1.9, 0.1, 0.8, 0.1, C(0x8a5a3c)); S.box(x + 1.9, 0.8, -1.9, 0.5, 0.32, 0.3, C(0x3f6fb5)); }
  farHills(S, [0x79b98a, 0x6aa9c9], 15); clouds(S, [255, 255, 255], 20, 8);
  S.dyn = (t, add) => { const a = t * ROW_W; for (const [ph, col, fill] of [[0, [255, 236, 150], '#fff2a8'], [Math.PI, [230, 236, 255], '#f4f6ff']]) { const y = Math.sin(a + ph) * 22 + 6, x = -Math.cos(a + ph) * 36; if (y > 1) { add.glow([x, y, -70], 13, col, 0.8); add.custom([x, y, -70], (g, X, Y, k) => { g.fillStyle = fill; g.beginPath(); g.arc(X, Y, 3.4 * k, 0, TAU); g.fill(); }, -40); } } };
  return S;
}
// ---------- 路灯小路（夜） ----------
function setAvenue() {
  const S = new Set3({ ...SKY.night, fogNear: 24, fogFar: 150 });
  S.ground(-200, -200, 200, 60, C(GRASS), { nx: 8, nz: 8 }); S.ground(-2.4, -200, 2.4, 20, C(PATH), { order: 1, nz: 20 });
  const r = rnd(64);
  for (let z = 8; z > -90; z -= 6) { lamp(S, -3.2, z, 3.3, [255, 206, 110]); lamp(S, 3.2, z - 3, 3.3, [255, 206, 110]); }
  for (let z = 2; z > -100; z -= 11) { house(S, -9.5, z, 4.4, 3.2, 4, WALLS[(r() * 7) | 0], ROOFS[(r() * 5) | 0], Math.PI / 2); house(S, 9.5, z - 5, 4.4, 3.2, 4, WALLS[(r() * 7) | 0], ROOFS[(r() * 5) | 0], -Math.PI / 2); tree(S, -6.2, z + 5.5, 1.3, 0x8a5a3c, CROWNS, z + 200); tree(S, 6.2, z + 0.5, 1.3, 0x8a5a3c, CROWNS, z + 300); }
  toNight(S);
  S.dyn = (t, add) => { moon3(add, [12, 26, -110], 7); fireflies(add, t, 20, [-5, 10, -14, 16, 0.4, 2.4], 15); for (let z = 8; z > -50; z -= 6) { add.glow([-3.2, 0.1, z], 2.2, [255, 206, 110], 0.22); add.glow([3.2, 0.1, z - 3], 2.2, [255, 206, 110], 0.22); } };
  return S;
}
// ---------- 一盏路灯和地上的旧相片 ----------
function setLampPhotos() {
  const S = new Set3({ ...SKY.night, fogNear: 12, fogFar: 60 });
  S.ground(-200, -200, 200, 60, C(GRASS), { nx: 6, nz: 6 }); S.ground(-5, -5, 5, 3.6, C(PATH), { order: 1, nx: 10, nz: 9, colAt: (i, j) => C((i + j) % 2 ? 0xf3e4b8 : 0xe8d6a6) });
  lamp(S, 1.2, -1.6, 3.8, [255, 206, 110]); bench(S, -2.2, -2.6, 0xb07a52);
  flowers(S, 19, 26, -7, 7, -6, 4.4, PASTEL, (x, z) => Math.abs(x) < 5.2 && z > -5.2 && z < 3.8);
  tree(S, -6, -5.6, 1.5, 0x8a5a3c, CROWNS, 7); tree(S, 6.4, -6, 1.6, 0x8a5a3c, CROWNS, 8);
  toNight(S);
  S.dyn = (t, add) => { add.custom([0.6, 0.01, -0.6], (g, x, y, k) => { const R = 3.4 * k, gr = g.createRadialGradient(x, y, 0, x, y, R); gr.addColorStop(0, 'rgba(255,220,150,0.6)'); gr.addColorStop(1, 'rgba(255,220,150,0)'); g.save(); g.translate(x, y); g.scale(1, 0.4); g.fillStyle = gr; g.fillRect(-R, -R, R * 2, R * 2); g.restore(); }, -200); fireflies(add, t, 14, [-5, 10, -4, 6, 0.4, 2.2], 21); };
  return S;
}
// ---------- 八音盒里的糖果色齿轮 ----------
export const GEARS = [[-3.4, 2.6, -3.0, 2.6, 14, 0.5, 0xf2c14e], [2.4, 1.6, -2.2, 1.7, 10, -0.8, 0xf7a8b8], [5.6, 3.8, -4.2, 2.2, 12, 0.6, 0x9ad8c0], [-6.6, 4.6, -5.0, 2.4, 13, -0.5, 0x9ac8f0], [0.4, 5.2, -6.5, 2.8, 16, 0.35, 0xc8b0f4], [-0.9, 0.9, -1.0, 1.0, 8, -1.1, 0xffd98a]];
function setGears() {
  const S = new Set3({ sky: ['#ffd2a0', '#ffe6c0', '#fff8e6'], fog: [255, 238, 210], fogNear: 24, fogFar: 120, amb: 0.8, light: [0.3, 0.7, 0.6] });
  S.ground(-200, -200, 200, 60, C(0xf4d6a2), { nx: 6, nz: 6 }); S.ground(-12, -3, 12, 4, C(0xfbe6c0), { order: 1, nx: 12, nz: 3, colAt: (i) => C(i % 2 ? 0xfbe6c0 : 0xf6dcae) });
  gear3(S, -10, 7, -15, 6.5, 18, 0.5, 0.3, [252, 226, 180]); gear3(S, 10.5, 8, -17, 7.5, 20, 0.5, 0.1, [250, 212, 196]);
  S.dyn = (t, add, S2, p) => { GEARS.forEach(([x, y, z, rr, n, sp, col]) => gear3(S2, x, y, z, rr, n, 0.4, t * sp, C(col))); for (let i = 0; i < 26; i++) { const sp = 0.3 + hash(i) * 0.5, y = (hash(i + 1) * 9 + t * sp) % 9, x = (hash(i + 2) - 0.5) * 26; add.custom([x, y, -7 - hash(i + 3) * 5], (g, X, Y, k) => { const s = 0.12 * k * (0.7 + 0.3 * p); g.globalAlpha = 0.9 * (1 - y / 9); g.fillStyle = ['#ffffff', '#ffd866', '#ff9ac0'][i % 3]; g.beginPath(); g.moveTo(X, Y - s); g.quadraticCurveTo(X, Y, X + s, Y); g.quadraticCurveTo(X, Y, X, Y + s); g.quadraticCurveTo(X, Y, X - s, Y); g.quadraticCurveTo(X, Y, X, Y - s); g.fill(); g.globalAlpha = 1; }); } };
  return S;
}

const BUILD = {
  townDay: () => setTown('day'), townDusk: () => setTown('dusk'), townNight: () => setTown('night'), townDark: () => setTown('dark'), townWake: () => setTown('wake'), townSnow: () => setTown('snow'), townDawn: () => setTown('dawn'),
  glade: () => setGlade('day'), gladeNight: () => setGlade('night'), maze: setMaze, starsky: () => setStarSky(0), starsky2: () => setStarSky(1), hill: () => setHill(0), hill2: () => setHill(1),
  busstop: () => setBusStop(false), busstopRain: () => setBusStop(true), carousel: setCarousel, cottage: setCottage, meadow: () => setMeadow(false), meadowSunset: () => setMeadow(true),
  sunny: setSunny, sunsetsky: setSunsetSky, mist: setMist, clock: setClock, rows: setRows, avenue: setAvenue, lampphotos: setLampPhotos, gears: setGears,
};
const SETS = {};
/** 缺布景直接报错，不拿别的顶替 */
export const getSet = (n) => { if (!BUILD[n]) throw new Error('缺布景：' + n); return (SETS[n] ??= BUILD[n]()); };
export const SET_NAMES = Object.keys(BUILD);
