// @ts-nocheck
// 《坏女孩》复刻 MV —— 软件 3D 引擎（Canvas2D 画家算法）。
// 同一份代码既在网页里实时互动预览，也在 Node 里逐帧导出 MP4，两边画面一致。
// 画面语法沿用项目「通用模板」：低多边形卡通 3D 世界 + 项目自带像素角色当纸片人 + 金边字幕条。
import META from './cast_atlas.json';
import BEATS from './beats.json';

export const W = 1280, H = 720, FPS = 24, T0 = 20, DUR = 195;
const NEAR = 0.2, PX = 1.7 / 88;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const sm = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
const lerp = (a, b, p) => a + (b - a) * p;
const rnd = (s) => () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const hash = (n) => { const v = Math.sin(n * 127.1 + 3.7) * 43758.5453; return v - Math.floor(v); };
const C = (h) => [(h >> 16) & 255, (h >> 8) & 255, h & 255];
const rgb = (c, a = 1) => a >= 1 ? `rgb(${clamp(c[0], 0, 255) | 0},${clamp(c[1], 0, 255) | 0},${clamp(c[2], 0, 255) | 0})` : `rgba(${clamp(c[0], 0, 255) | 0},${clamp(c[1], 0, 255) | 0},${clamp(c[2], 0, 255) | 0},${a})`;
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const cen = (p) => { let x = 0, y = 0, z = 0; for (const q of p) { x += q[0]; y += q[1]; z += q[2]; } return [x / p.length, y / p.length, z / p.length]; };

// ---------- 节拍（由原曲低频能量离线检测，时间为原曲时间） ----------
const beatT = BEATS.beats;
function beatIdx(t) { let lo = 0, hi = beatT.length; while (lo < hi) { const m = (lo + hi) >> 1; if (beatT[m] <= t) lo = m + 1; else hi = m; } return lo; }
const pulse = (t) => { const i = beatIdx(t); return i ? Math.exp(-(t - beatT[i - 1]) / 0.16) : 0; };
const energy = (t) => BEATS.env[Math.max(0, Math.min(BEATS.env.length - 1, Math.floor(t * BEATS.envHz)))] || 0;

// ---------- 歌词：全曲每句 3.75s（6 拍）等距，第 k 句起点 = 21.25 + 3.75k（落在每小节第 3 拍） ----------
const P = (k) => 21.25 + 3.75 * k;
const VERSE = [['那时我放开了的手', '转过身只剩了保重'], ['你话都没说', '却哭了很久很久'], ['我喜欢坏坏的女友', '我喜欢刺激的感受'], ['你单纯太过', '多余了那些温柔'], ['你消失在无名大街', '从此就没有再见面'], ['好长的时间', '再没有你的来电'], ['在后来酒吧的房间', '舞池里跳动着音乐'], ['熟悉的侧脸', '迷人的笑脸吸引视线'], ['慵懒的靠在陌生的肩'], ['黑色的眼线'], ['你的指间有一点轻蔑'], ['在谁的怀中会有感觉'], ['被爱的深夜我在想念'], ['明明是为你才会改变'], ['却回不到从前']];
const TAIL = [['然后我安静的发现'], ['两个人已经没有任何语言'], ['曾经你纯真的永远'], ['让我不顾一切开始怀念'], ['迷人的笑脸吸引视线'], ['慵懒的靠在陌生的肩'], ['黑色的眼线'], ['你的指间有一点轻蔑'], ['在谁的怀中会有感觉'], ['被爱的深夜我在想念'], ['明明是为你才会改变'], ['却回不到从前']];
const PHRASES = [];
const addPh = (k, parts) => {
  const a = P(k), b = P(k + 1), text = parts.join('  '), chars = Array.from(text), n = chars.filter((c) => c !== ' ').length;
  const s0 = a, s1 = a + (Math.min(b, 215.2) - a) * 0.9; let i = 0;
  const ct = chars.map((c) => (c === ' ' ? null : s0 + (s1 - s0) * (i++ / n)));
  PHRASES.push({ a, b, text, chars, ct, parts });
};
VERSE.forEach((p, i) => addPh(i, p)); VERSE.forEach((p, i) => addPh(24 + i, p)); TAIL.forEach((p, i) => addPh(40 + i, p));
PHRASES.sort((x, y) => x.a - y.a);
// ---------- 字幕卡点（原曲时间） ----------
// 和 3D 版 src/mv/cues.ts 是同一张表：句首取一听网 LRC 的原始时间，再吸附到实测半拍（126.99 BPM，首拍 22.365 s）。
// 原来这里按「每句 3.75 s 等距」推时间，唱到中段会差出几秒；现在按真时间走。
const CUE_BAR0 = 22.365, CUE_BEAT = 60 / 126.99;
const cueSnap = (t) => CUE_BAR0 + Math.round((t - CUE_BAR0) / (CUE_BEAT / 2)) * (CUE_BEAT / 2);
const CUE_VERSE = [
  ['那时我放开了的手', '徐良'], ['转过身只剩了保重', '徐良'], ['你话都没说 却哭了很久很久', '徐良'], ['我喜欢坏坏的女友', '徐良'],
  ['我喜欢刺激的感受', '徐良'], ['你单纯太过 多余了那些温柔', '徐良'], ['你消失在无名大街', '徐良'], ['从此就没有再见面', '徐良'],
  ['好长的时间 再没有你的来电', '徐良'], ['在后来酒吧的房间', '徐良'], ['舞池里跳动着音乐', '徐良'], ['熟悉的侧脸', '徐良'],
  ['迷人的笑脸 吸引视线', '徐良'], ['慵懒的靠在陌生的肩', '徐良'], ['黑色的眼线 你的指间', '徐良'], ['有一点轻蔑', '徐良'],
  ['在谁的怀中会有感觉', '小凌'], ['被爱的深夜我在想念', '小凌'], ['明明是为你才会改变', '小凌'], ['却回不到从前', '小凌'],
];
const CUE_BRIDGE = [['然后我安静的发现'], ['两个人已经没有任何语言'], ['曾经你纯真的永远'], ['让我不顾一切开始怀念']];
const CUE_RAW_A = [22.51, 23.94, 25.5, 29.35, 31.34, 33.15, 37.01, 39.0, 41.05, 44.28,
  46.46, 48.39, 52.37, 54.48, 58.49, 61.85, 66.39, 69.62, 73.17, 76.9];
const CUE_RAW_B = [112.99, 114.42, 116.28, 120.14, 122.13, 123.93, 127.79, 129.72, 131.34, 135.32,
  136.93, 138.86, 143.4, 145.27, 148.51, 152.61, 156.9, 160.01, 163.68, 167.66];
const CUE_RAW_C = [173.37, 175.74, 179.66, 184.01];
const CUE_RAW_D = [187.77, 190.76, 194.49, 197.85, 201.89, 205.69, 209.42, 212.65];
const CUES = (() => {
  const list = [];
  CUE_RAW_A.forEach((raw, k) => list.push({ raw, text: CUE_VERSE[k][0], singer: CUE_VERSE[k][1] }));
  CUE_RAW_B.forEach((raw, k) => list.push({ raw, text: CUE_VERSE[k][0], singer: CUE_VERSE[k][1] }));
  CUE_RAW_C.forEach((raw, j) => list.push({ raw, text: CUE_BRIDGE[j][0], singer: '徐良' }));
  CUE_RAW_D.forEach((raw, j) => list.push({ raw, text: CUE_VERSE[12 + j][0], singer: CUE_VERSE[12 + j][1] }));
  list.sort((x, y) => x.raw - y.raw);
  return list.map((c) => { const n = c.text.replace(/\s/g, '').length; return { ...c, start: cueSnap(c.raw), sing: 0.36 * n + 1.4 }; })
    .map((c, i, arr) => { const next = arr[i + 1]; return { start: c.start, end: Math.min(next ? next.start - 0.12 : c.start + c.sing, c.start + c.sing), text: c.text, singer: c.singer }; });
})();

/** 给页面歌词表 / SRT 用：成片时间（已减去前奏 20s），跟字幕同一张卡点表 */
export const LINES = CUES.map((c) => ({ start: +(c.start - T0).toFixed(2), end: +(c.end - T0).toFixed(2), text: c.text }));

// ---------- 3D 布景构件 ----------
class Set3 {
  constructor(o) { Object.assign(this, { faces: [], lines: [], glows: [], texts: [], amb: 0.62, fogNear: 30, fogFar: 150, stars: 0, sky: ['#000', '#000', '#000'], fog: [0, 0, 0] }, o); this.L = norm(o.light || [0.35, 0.8, 0.45]); }
  poly(pts, col, o = {}) {
    let n = o.n;
    if (!n) { n = norm(cross(sub(pts[1], pts[0]), sub(pts[2], pts[0]))); if (o.out && dot(n, sub(cen(pts), o.out)) < 0) n = [-n[0], -n[1], -n[2]]; }
    const sh = o.emit ? 1 : Math.round((this.amb + (1 - this.amb) * Math.max(0, dot(n, this.L))) * 6) / 6;
    const f = { pts, n, c: cen(pts), col: [col[0] * sh, col[1] * sh, col[2] * sh], layer: o.layer ?? 1, order: o.order ?? 0, emit: !!o.emit, alpha: o.alpha ?? 1, two: !!o.two, colFn: o.colFn || null, edge: o.edge ?? true, bias: o.bias || 0 };
    this.faces.push(f); return f;
  }
  ground(x0, z0, x1, z1, col, o = {}) {
    const nx = o.nx || 1, nz = o.nz || 1, y = o.y || 0;
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      const xa = lerp(x0, x1, i / nx), xb = lerp(x0, x1, (i + 1) / nx), za = lerp(z0, z1, j / nz), zb = lerp(z0, z1, (j + 1) / nz);
      this.poly([[xa, y, za], [xb, y, za], [xb, y, zb], [xa, y, zb]], o.colAt ? o.colAt(i, j) : col, { n: [0, 1, 0], layer: 0, order: o.order || 0, two: true, emit: o.emit, edge: false, alpha: o.alpha, colFn: o.colFn ? o.colFn(i, j) : null });
    }
  }
  box(x, y, z, w, h, d, col, o = {}) {
    const ry = o.ry || 0, c = Math.cos(ry), s = Math.sin(ry), a = w / 2, b = d / 2;
    const Pt = (lx, ly, lz) => [x + lx * c + lz * s, y + ly, z - lx * s + lz * c];
    const N = (nx, nz) => [nx * c + nz * s, 0, -nx * s + nz * c];
    const q = (p, n, cc) => this.poly(p, cc || col, { n, emit: o.emit, bias: o.bias, edge: o.edge, alpha: o.alpha, colFn: o.colFn });
    q([Pt(-a, 0, b), Pt(a, 0, b), Pt(a, h, b), Pt(-a, h, b)], N(0, 1));
    q([Pt(a, 0, -b), Pt(-a, 0, -b), Pt(-a, h, -b), Pt(a, h, -b)], N(0, -1));
    q([Pt(a, 0, b), Pt(a, 0, -b), Pt(a, h, -b), Pt(a, h, b)], N(1, 0));
    q([Pt(-a, 0, -b), Pt(-a, 0, b), Pt(-a, h, b), Pt(-a, h, -b)], N(-1, 0));
    if (!o.noTop) q([Pt(-a, h, b), Pt(a, h, b), Pt(a, h, -b), Pt(-a, h, -b)], [0, 1, 0], o.top);
  }
  gable(x, y, z, w, h, d, col, ry = 0) {
    const c = Math.cos(ry), s = Math.sin(ry), Pt = (lx, ly, lz) => [x + lx * c + lz * s, y + ly, z - lx * s + lz * c];
    const A = Pt(-w / 2, 0, d / 2), B = Pt(w / 2, 0, d / 2), Cc = Pt(w / 2, 0, -d / 2), D = Pt(-w / 2, 0, -d / 2), R1 = Pt(-w / 2, h, 0), R2 = Pt(w / 2, h, 0), out = [x, y + h * 0.25, z];
    this.poly([A, B, R2, R1], col, { out }); this.poly([Cc, D, R1, R2], col, { out }); this.poly([A, R1, D], col, { out }); this.poly([B, Cc, R2], col, { out });
  }
  cyl(x, y, z, r, h, n, col, o = {}) {
    const r2 = o.r2 ?? r;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * 6.2832, a1 = ((i + 1) / n) * 6.2832;
      this.poly([[x + Math.cos(a0) * r, y, z + Math.sin(a0) * r], [x + Math.cos(a1) * r, y, z + Math.sin(a1) * r], [x + Math.cos(a1) * r2, y + h, z + Math.sin(a1) * r2], [x + Math.cos(a0) * r2, y + h, z + Math.sin(a0) * r2]], col, { out: [x, y + h / 2, z], emit: o.emit, bias: o.bias });
    }
    if (!o.noTop && r2 > 0.01) this.poly(Array.from({ length: n }, (_, i) => [x + Math.cos((i / n) * 6.2832) * r2, y + h, z + Math.sin((i / n) * 6.2832) * r2]), o.top || col, { n: [0, 1, 0], emit: o.emit, bias: o.bias });
  }
  cone(x, y, z, r, h, n, col, o = {}) { this.cyl(x, y, z, r, h, n, col, { ...o, r2: 0, noTop: true }); }
  blob(x, y, z, rx, ry, rz, col, o = {}) {
    const nLat = o.lat || 4, nLon = o.lon || 7, r = rnd((o.seed || 1) * 977 + 13), vmax = o.hemi ? Math.PI / 2 : Math.PI, V = [];
    for (let j = 0; j <= nLat; j++) {
      const v = (j / nLat) * vmax, row = [];
      for (let i = 0; i < nLon; i++) { const u = (i / nLon) * 6.2832, k = j === 0 || (!o.hemi && j === nLat) ? 1 : 1 + (r() - 0.5) * (o.jit ?? 0.24); row.push([x + Math.sin(v) * Math.cos(u) * rx * k, y + Math.cos(v) * ry * k, z + Math.sin(v) * Math.sin(u) * rz * k]); }
      V.push(row);
    }
    for (let j = 0; j < nLat; j++) for (let i = 0; i < nLon; i++) {
      const a = V[j][i], b = V[j][(i + 1) % nLon], c = V[j + 1][(i + 1) % nLon], d = V[j + 1][i];
      this.poly(j === 0 ? [a, c, d] : !o.hemi && j === nLat - 1 ? [a, b, d] : [a, b, c, d], col, { out: [x, y, z], emit: o.emit, bias: o.bias });
    }
  }
  line(a, b, w, col, alpha = 1) { this.lines.push({ a, b, w, col, alpha }); }
}
function tree(S, x, z, s, trunk, crowns, seed) {
  S.cyl(x, 0, z, 0.2 * s, 1.7 * s, 6, C(trunk), { r2: 0.14 * s });
  const r = rnd(seed * 31 + 7);
  for (let i = 0; i < 3; i++) S.blob(x + (r() - 0.5) * 1.3 * s, (2.1 + i * 0.45) * s + r() * 0.3, z + (r() - 0.5) * 1.0 * s, (1.15 - r() * 0.25) * s, 0.95 * s, 1.05 * s, C(crowns[i % crowns.length]), { seed: seed * 5 + i });
}
function pine(S, x, z, s, col) { S.cyl(x, 0, z, 0.15 * s, 0.9 * s, 5, C(0x6b4a3a)); S.cone(x, 0.75 * s, z, 1.05 * s, 1.7 * s, 6, C(col)); S.cone(x, 1.85 * s, z, 0.78 * s, 1.5 * s, 6, C(0xf4f8fc)); }
function house(S, x, z, w, h, d, wall, roof, ry = 0) {
  S.box(x, 0, z, w, h, d, C(wall), { ry }); S.gable(x, h, z, w * 1.14, h * 0.6, d * 1.16, C(roof), ry);
  const c = Math.cos(ry), s = Math.sin(ry), Q = (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c];
  let q = Q(0, d / 2 + 0.04); S.box(q[0], 0, q[1], 0.75, 1.35, 0.06, C(0x7a4a30), { ry, bias: -1.2 });
  for (const lx of [-w * 0.3, w * 0.3]) { q = Q(lx, d / 2 + 0.04); S.box(q[0], h * 0.42, q[1], 0.72, 0.72, 0.06, C(0xffe9a8), { ry, emit: true, bias: -1.2 }); }
}
function lamp(S, x, z, h = 3.4, col = [255, 220, 140]) { S.cyl(x, 0, z, 0.07, h, 5, C(0x2a2440), { noTop: true }); S.box(x, h, z, 0.36, 0.36, 0.36, col, { emit: true }); S.glows.push({ pos: [x, h + 0.18, z], r: 2.4, col, a: 0.5 }); }
function building(S, x, z, w, h, d, col, seed, sides) {
  S.box(x, 0, z, w, h, d, C(col)); const r = rnd(seed * 13 + 5), wc = [[255, 216, 107], [255, 143, 200], [143, 232, 255]], rows = Math.max(1, Math.floor((h - 1) / 1.7));
  const cols = Math.max(1, Math.floor(w / 1.5)), cols2 = Math.max(1, Math.floor(d / 1.5));
  if (sides.includes('z')) for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) if (r() < 0.45) { const wx = x - w / 2 + ((i + 0.5) * w) / cols, wy = 1.1 + j * 1.7, zz = z + d / 2 + 0.03; S.poly([[wx - 0.36, wy, zz], [wx + 0.36, wy, zz], [wx + 0.36, wy + 0.85, zz], [wx - 0.36, wy + 0.85, zz]], wc[(r() * 3) | 0], { n: [0, 0, 1], emit: true, edge: false, bias: -2.5 }); }
  for (const sd of [1, -1]) if (sides.includes(sd > 0 ? '+x' : '-x')) for (let i = 0; i < cols2; i++) for (let j = 0; j < rows; j++) if (r() < 0.45) { const wz = z - d / 2 + ((i + 0.5) * d) / cols2, wy = 1.1 + j * 1.7, xx = x + sd * (w / 2 + 0.03); S.poly([[xx, wy, wz - 0.36], [xx, wy, wz + 0.36], [xx, wy + 0.85, wz + 0.36], [xx, wy + 0.85, wz - 0.36]], wc[(r() * 3) | 0], { n: [sd, 0, 0], emit: true, edge: false, bias: -2.5 }); }
}
const farHills = (S, cols, seed, z0 = -120) => { const r = rnd(seed); for (let i = 0; i < 9; i++) S.blob(-200 + i * 50 + r() * 10, 0, z0 - r() * 40, 38 + r() * 22, 14 + r() * 16, 30, C(cols[i % cols.length]), { hemi: true, seed: seed + i, lat: 3, lon: 8 }); };
const clouds = (S, col, seed, n = 7) => { const r = rnd(seed); for (let i = 0; i < n; i++) S.blob(-150 + i * 46 + r() * 16, 30 + r() * 14, -150 + r() * 40, 13 + r() * 8, 3.2, 6, col, { emit: true, seed: seed + i, lat: 3, lon: 6 }); };
const bench = (S, x, z, col) => { S.box(x, 0.38, z, 1.9, 0.12, 0.6, C(col)); S.box(x, 0.5, z - 0.27, 1.9, 0.55, 0.08, C(col)); S.box(x - 0.8, 0, z, 0.1, 0.38, 0.5, C(0x3a2a40)); S.box(x + 0.8, 0, z, 0.1, 0.38, 0.5, C(0x3a2a40)); };
const drift = (add, t, n, col, box, vy, vx, r, seed, alpha = 0.9) => { // 花瓣 / 落叶 / 雪：位置是时间的纯函数
  const rr = rnd(seed);
  for (let i = 0; i < n; i++) { const bx = rr(), by = rr(), bz = rr(), sp = 0.6 + rr() * 0.8, hgt = box[3]; const y = hgt - (((by * hgt + t * vy * sp) % hgt) + hgt) % hgt; add.dot([box[0] + ((((bx * box[1] + t * vx * sp) % box[1]) + box[1]) % box[1]) + Math.sin(t * sp + i) * 0.3, y, box[2] + bz * box[4]], r * (0.7 + sp * 0.4), col, alpha); }
};

function setRiver() {
  const S = new Set3({ sky: ['#3d3a8c', '#e8718d', '#ffc38a'], fog: [226, 142, 140], fogNear: 26, fogFar: 170, light: [-0.35, 0.7, 0.6], amb: 0.64, tint: 'rgba(255,130,110,0.10)' });
  S.ground(-220, -220, 220, -26, C(0x8f7fa8), { nx: 8, nz: 5 }); S.ground(-220, -26, 220, -3.4, C(0xf2a48e), { nx: 6, nz: 5, emit: true }); S.ground(-220, -3.4, 220, 40, C(0xb98aa0), { nx: 12, nz: 5 });
  S.ground(-60, -1.3, 60, 1.3, C(0xd6adbb), { order: 1, nx: 12 });
  for (let x = -30; x <= 30; x += 2.5) S.box(x, 0, -3.2, 0.14, 1.15, 0.14, C(0x4a3358));
  for (let x = -30; x < 30; x += 5) { S.line([x, 1.15, -3.2], [x + 5, 1.15, -3.2], 0.09, C(0x4a3358)); S.line([x, 0.7, -3.2], [x + 5, 0.7, -3.2], 0.06, C(0x4a3358)); }
  for (const [x, z, s, sd] of [[-9, -1.9, 1.5, 1], [9.5, -2.0, 1.6, 2], [-24, -1.8, 1.7, 3], [23, -1.9, 1.5, 4], [-17, 6, 1.6, 5], [16, 6.5, 1.5, 6]]) tree(S, x, z, s, 0x4a2f45, [0xffb7d1, 0xff9bbf, 0xffd3e3], sd);
  lamp(S, -4.4, -2.7); lamp(S, 13, -2.7); lamp(S, -19, -2.7); bench(S, 5.2, -2.3, 0x7a5068);
  const r = rnd(9), walls = [0xf2d6b3, 0xe9a27a, 0xf6e6c4, 0xcfe0ea, 0xf2b8c6], roofs = [0xb5473c, 0x3f6fb5, 0x8a4fa3, 0x2f8f83];
  for (let x = -72; x <= 72; x += 9) house(S, x + r() * 3, -33 - r() * 9, 4 + r() * 2, 3 + r() * 2, 4, walls[(r() * 5) | 0], roofs[(r() * 4) | 0], (r() - 0.5) * 0.5);
  farHills(S, [0x7a6aa8, 0x9a7ab0], 3); clouds(S, C(0xffd9d0), 20);
  S.glows.push({ pos: [16, 9, -170], r: 40, col: [255, 226, 180], a: 0.9 }, { pos: [16, 9, -170], r: 13, col: [255, 250, 225], a: 1 });
  S.dyn = (t, add) => { drift(add, t, 40, [255, 194, 218], [-12, 24, -3, 5.5, 8], 0.7, 0.5, 0.05, 3); for (let i = 0; i < 26; i++) { const x = -40 + ((i * 13.7 + t * 1.5) % 80), z = -5 - ((i * 7.3) % 20); add.line([x, 0.02, z], [x + 1.4, 0.02, z], 0.06, [255, 240, 220], 0.55); } };
  return S;
}
function setStreet(mode) {
  const S = new Set3({ sky: ['#060a22', '#221a55', '#6b2f7a'], fog: [40, 26, 78], fogNear: 20, fogFar: 120, light: [0.2, 0.85, 0.45], amb: 0.56, tint: 'rgba(110,90,255,0.15)', stars: 70, rain: mode === 'rain' });
  S.ground(-220, -220, 220, 60, C(0x191533), { nx: 10, nz: 8 }); S.ground(-70, -3.2, 70, 3.2, C(0x2a2346), { order: 1, nx: 14 }); S.ground(3, -90, 9, -3.2, C(0x2a2346), { order: 1, nz: 10 });
  S.ground(-70, -6.5, 3, -3.2, C(0x3a3158), { order: 1, nx: 8 }); S.ground(9, -6.5, 70, -3.2, C(0x3a3158), { order: 1, nx: 7 }); S.ground(-70, 3.2, 70, 6.5, C(0x3a3158), { order: 1, nx: 14 });
  for (let x = -66; x < 66; x += 5) S.ground(x, -0.12, x + 2.6, 0.12, [255, 210, 77], { order: 2, emit: true });
  for (let i = 0; i < 6; i++) S.ground(3.2 + i, -5.8, 3.8 + i, -3.6, [235, 235, 245], { order: 2, emit: true });
  for (let i = 0; i < 5; i++) S.ground(-1.6, -2.7 + i * 1.2, 1.6, -2.0 + i * 1.2, [235, 235, 245], { order: 3, emit: true });
  const r = rnd(41), cols = [0x241c4a, 0x2d2258, 0x1f1a40, 0x35275f];
  for (let x = -46; x <= 48; x += 7) { if (x > -1 && x < 13) continue; building(S, x, -10.5, 6.4, 7 + r() * 9, 7, cols[(r() * 4) | 0], 100 + x, 'z'); }
  for (let z = -18.5; z >= -82; z -= 8) { building(S, -0.6, z, 6.2, 8 + r() * 10, 7.4, cols[(r() * 4) | 0], 200 - z, '+x'); building(S, 12.6, z, 6.2, 8 + r() * 10, 7.4, cols[(r() * 4) | 0], 300 - z, '-x'); }
  lamp(S, -12, -3.9); lamp(S, 10.6, -3.9); lamp(S, 22, -3.9); lamp(S, -26, -3.9); lamp(S, 2.5, -15, 3.4, [143, 232, 255]); lamp(S, 9.5, -28, 3.4, [255, 143, 200]); lamp(S, 2.5, -42);
  if (mode === 'neon') { S.cyl(2.6, 0, -6.8, 0.14, 6.2, 6, C(0x2a2440)); S.cyl(9.4, 0, -6.8, 0.14, 6.2, 6, C(0x2a2440)); S.box(6, 4.6, -6.8, 7.2, 1.7, 0.2, C(0x140c2c)); S.box(6, 4.5, -6.66, 7.0, 0.1, 0.06, [255, 63, 164], { emit: true, bias: -0.4 }); S.texts.push({ pos: [6, 5.5, -6.6], str: 'BAD GIRL', size: 1.25, col: '#ff3fa4' }, { pos: [-18, 5.2, -6.9], str: 'LIVE', size: 1.2, col: '#7ae8ff' }); }
  else { S.cyl(2.2, 0, -3.7, 0.06, 3.0, 5, C(0x2a2440)); S.box(2.2, 2.9, -3.7, 2.3, 0.7, 0.08, C(0x1b3a5c), { bias: -0.3 }); S.texts.push({ pos: [2.2, 3.25, -3.6], str: '无名大街', size: 0.5, col: '#ffd86b' }); }
  if (mode === 'neon') S.dyn = (t, add, S2, p) => { for (let i = 0; i < 14; i++) { const x = -30 + ((i * 17.3 + t * 26) % 60), y = 0.6 + ((i * 2.9) % 6), z = -2 - (i % 5); add.line([x, y, z], [x + 3.5, y, z], 0.04, [255, 255, 255], 0.22); } add.glow([6, 5.4, -6.4], 6 + p * 2, [255, 63, 164], 0.22 + 0.2 * p); };
  return S;
}
const SEASONS = {
  spring: { sky: ['#8ecbff', '#d9efff', '#ffe3ef'], fog: [214, 232, 246], grass: 0x8fd97a, path: 0xead9b8, crowns: [0xffb7d1, 0xff9bbf, 0xffd3e3], tint: null, part: [255, 194, 218], light: [0.4, 0.8, 0.45], hills: [0x79b98a, 0x6aa9c9] },
  summer: { sky: ['#3fb4ff', '#9fe0ff', '#e8fbff'], fog: [200, 236, 250], grass: 0x58c46a, path: 0xf1d9a0, crowns: [0x2fa34f, 0x3fbf62, 0x27883f], tint: null, part: null, light: [0.3, 0.9, 0.3], hills: [0x4fae6a, 0x5f9fd0] },
  autumn: { sky: ['#ff9a5a', '#ffc98a', '#ffe9c4'], fog: [250, 214, 170], grass: 0xc9a04c, path: 0xe7c18a, crowns: [0xf08a24, 0xd9541e, 0xf2b134], tint: 'rgba(255,150,60,0.10)', part: [232, 116, 42], light: [-0.5, 0.6, 0.5], hills: [0xc98a4c, 0xb0705a] },
  winter: { sky: ['#7fa6cc', '#c3d8ea', '#eef6fc'], fog: [226, 236, 246], grass: 0xf2f6fb, path: 0xd5e2ee, crowns: [0xffffff], tint: 'rgba(170,200,255,0.12)', part: [255, 255, 255], light: [0.3, 0.8, 0.5], hills: [0xdfe9f2, 0xc3d3e6] },
};
function setPark(season) {
  const Q = SEASONS[season], S = new Set3({ sky: Q.sky, fog: Q.fog, fogNear: 34, fogFar: 200, light: Q.light, amb: 0.68, tint: Q.tint });
  S.ground(-220, -220, 220, 60, C(Q.grass), { nx: 10, nz: 8 }); S.ground(-80, -1.5, 80, 1.5, C(Q.path), { order: 1, nx: 16 });
  house(S, -7, -8.5, 5.2, 3.4, 4.4, 0xf2e6c8, 0xd8433c, 0.25); house(S, 16, -11, 4.6, 3.0, 4, 0xf2b8c6, 0x3f6fb5, -0.3); house(S, -25, -10, 5, 3.6, 4.2, 0xcfe0ea, 0x8a4fa3, 0.1); house(S, 34, -9, 5, 3.2, 4.2, 0xf6e6c4, 0x2f8f83, 0.2);
  [[3.5, -6, 1.5], [-15, -5.5, 1.3], [10, -8.5, 1.7], [-1, -13, 1.6], [24, -6, 1.4], [-32, -7, 1.6], [42, -7, 1.6], [-20, -16, 1.5], [-42, -6, 1.5], [29, -15, 1.8]].forEach(([x, z, s], i) => season === 'winter' ? pine(S, x, z, s * 1.25, 0x2e6b52) : tree(S, x, z, s, 0x6b4a3a, Q.crowns, 11 + i));
  for (let x = -44; x <= 44; x += 2) S.box(x, 0, -3, 0.12, 0.7, 0.12, C(0xfaf3e6));
  for (let x = -44; x < 44; x += 4) S.line([x, 0.55, -3], [x + 4, 0.55, -3], 0.07, C(0xfaf3e6));
  bench(S, 3, -2.3, 0x9c6f4c); bench(S, -19, -2.3, 0x9c6f4c);
  farHills(S, Q.hills, 5); clouds(S, [255, 255, 255], 30, 8); S.glows.push({ pos: [-30, 60, -170], r: 30, col: [255, 250, 215], a: 0.8 });
  if (Q.part) S.dyn = (t, add) => drift(add, t, 46, Q.part, [-14, 28, -4, 6, 9], season === 'winter' ? 0.9 : 0.7, season === 'autumn' ? -0.6 : 0.4, season === 'winter' ? 0.04 : 0.055, 31);
  return S;
}
function setRoom() {
  const S = new Set3({ sky: ['#0b0a1e', '#0b0a1e', '#0b0a1e'], fog: [16, 12, 34], fogNear: 40, fogFar: 200, light: [0.3, 0.8, 0.5], amb: 0.62, tint: 'rgba(120,100,255,0.14)' });
  S.ground(-7, -4, 7, 5, C(0x4a3a5c), { nx: 7, nz: 1, colAt: (i) => C(i % 2 ? 0x4a3a5c : 0x54436a) }); S.ground(-2.6, -2.2, 1.6, 1.2, C(0x7a4a6a), { order: 1 });
  S.poly([[-7, 0, -4], [7, 0, -4], [7, 6.4, -4], [-7, 6.4, -4]], C(0x2b2348), { n: [0, 0, 1], bias: 4 });
  S.poly([[-7, 0, 5], [-7, 0, -4], [-7, 6.4, -4], [-7, 6.4, 5]], C(0x332a55), { n: [1, 0, 0], bias: 4 }); S.poly([[7, 0, -4], [7, 0, 5], [7, 6.4, 5], [7, 6.4, -4]], C(0x332a55), { n: [-1, 0, 0], bias: 4 });
  S.poly([[1.4, 1.7, -3.97], [6.2, 1.7, -3.97], [6.2, 5.1, -3.97], [1.4, 5.1, -3.97]], C(0x0a1238), { n: [0, 0, 1], emit: true, bias: 2.5 });
  const r = rnd(5); for (let i = 0; i < 28; i++) { const x = 1.6 + r() * 4.4, y = 1.8 + r() * 1.5; S.poly([[x, y, -3.95], [x + 0.14, y, -3.95], [x + 0.14, y + 0.18, -3.95], [x, y + 0.18, -3.95]], [[255, 216, 107], [255, 143, 200], [143, 232, 255]][i % 3], { n: [0, 0, 1], emit: true, edge: false, bias: 2 }); }
  for (const [a, b] of [[[1.4, 1.7], [6.2, 1.7]], [[1.4, 5.1], [6.2, 5.1]], [[1.4, 1.7], [1.4, 5.1]], [[6.2, 1.7], [6.2, 5.1]], [[3.8, 1.7], [3.8, 5.1]]]) S.line([a[0], a[1], -3.93], [b[0], b[1], -3.93], 0.1, C(0x5b4a8c));
  S.glows.push({ pos: [5.2, 4.3, -3.9], r: 0.9, col: [255, 244, 216], a: 0.95 });
  S.box(3.6, 0.82, -2.2, 2.4, 0.1, 1.1, C(0x6a4a7c)); for (const [dx, dz] of [[-1.05, -0.4], [1.05, -0.4], [-1.05, 0.4], [1.05, 0.4]]) S.box(3.6 + dx, 0, -2.2 + dz, 0.1, 0.82, 0.1, C(0x4a3166));
  S.box(-4.6, 0, -3.0, 3.2, 0.55, 1.5, C(0x5a4a8a)); S.box(-4.6, 0.55, -3.6, 3.2, 0.7, 0.3, C(0x6a5a9a)); S.box(-5.6, 0.55, -2.9, 0.9, 0.22, 0.6, C(0xf2e6ff));
  S.dyn = (t, add) => {
    add.custom([-1.6, 4.3, -3.95], (g, x, y, k) => { const R = 0.62 * k; g.fillStyle = '#f4ecff'; g.beginPath(); g.arc(x, y, R, 0, 7); g.fill(); g.strokeStyle = '#2a2145'; g.lineWidth = 0.07 * k; g.stroke(); g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.sin(t * 3) * R * 0.5, y - Math.cos(t * 3) * R * 0.5); g.stroke(); g.lineWidth = 0.04 * k; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.sin(t * 36) * R * 0.8, y - Math.cos(t * 36) * R * 0.8); g.stroke(); }, 0);
    add.glow([3.6, 3.0, -2.2], 3.2, [255, 220, 150], 0.16);
  };
  return S;
}
function setBar() {
  const S = new Set3({ sky: ['#0a0618', '#0a0618', '#0a0618'], fog: [20, 8, 40], fogNear: 30, fogFar: 110, light: [0.1, 0.9, 0.4], amb: 0.62, tint: 'rgba(200,80,255,0.13)' });
  S.ground(-30, -20, 30, 30, C(0x120a22));
  for (let i = 0; i < 12; i++) for (let j = 0; j < 8; j++) S.ground(-9 + i * 1.5, -5.5 + j * 1.5, -7.5 + i * 1.5, -4 + j * 1.5, [40, 20, 70], { order: 1, emit: true, colFn: () => (t, p, bi) => { const on = (i + j + bi) % 2 === 0, h = ((i * 31 + j * 47 + bi * 23) % 360) * 0.01745; return on ? [150 + 105 * Math.sin(h) * (0.6 + 0.4 * p), 110 + 90 * Math.sin(h + 2.1) * (0.6 + 0.4 * p), 190 + 65 * Math.sin(h + 4.2)] : [44, 24, 78]; } });
  S.poly([[-9, 0, -5.5], [9, 0, -5.5], [9, 7.5, -5.5], [-9, 7.5, -5.5]], C(0x2b1240), { n: [0, 0, 1], bias: 5 });
  S.poly([[-9, 0, 6.5], [-9, 0, -5.5], [-9, 7.5, -5.5], [-9, 7.5, 6.5]], C(0x341a52), { n: [1, 0, 0], bias: 5 }); S.poly([[9, 0, -5.5], [9, 0, 6.5], [9, 7.5, 6.5], [9, 7.5, -5.5]], C(0x341a52), { n: [-1, 0, 0], bias: 5 });
  const bc = [[255, 122, 208], [122, 232, 255], [255, 216, 107], [157, 122, 255]];
  for (const y of [2.3, 3.5]) { for (let x = -6; x < 6; x += 3) S.box(x + 1.5, y, -5.2, 3, 0.12, 0.5, C(0x5b2a7c), { bias: 1 }); for (let i = 0; i < 22; i++) S.box(-5.7 + i * 0.54, y + 0.12, -5.2, 0.2, 0.52, 0.2, bc[(i + (y > 3 ? 1 : 0)) % 4], { emit: true, bias: 0.5 }); }
  for (let x = -6; x < 6; x += 2) S.box(x + 1, 0, -3.7, 2, 1.12, 0.9, C(0x4a2068), { top: C(0x7a3a9c) });
  S.box(0, 1.12, -3.27, 12, 0.06, 0.06, [255, 79, 163], { emit: true });
  for (const x of [-4.6, -2.3, 2.6, 4.9]) { S.cyl(x, 0, -2.5, 0.08, 0.7, 5, C(0x2a1a40), { noTop: true }); S.cyl(x, 0.7, -2.5, 0.3, 0.1, 8, C(0xff7ad0)); }
  S.box(6.6, 0, -1.4, 2.2, 1.15, 1.0, C(0x3a1a5c), { top: C(0x241038) }); S.box(6.2, 1.15, -1.4, 0.7, 0.08, 0.7, [122, 232, 255], { emit: true }); S.box(7.1, 1.15, -1.4, 0.7, 0.08, 0.7, [255, 122, 208], { emit: true });
  for (const x of [-8.1, 8.1]) { S.box(x, 0, -4.6, 1.3, 2.6, 1.2, C(0x1c0f30)); S.box(x, 1.5, -3.97, 0.8, 0.8, 0.06, C(0x4a3a6a), { bias: -0.5 }); S.box(x, 0.4, -3.97, 0.9, 0.9, 0.06, C(0x4a3a6a), { bias: -0.5 }); }
  S.blob(0, 6.2, 0, 0.7, 0.7, 0.7, [220, 220, 245], { emit: true, seed: 3, jit: 0.05, lon: 8 }); S.line([0, 6.9, 0], [0, 7.6, 0], 0.05, [200, 200, 220]);
  S.texts.push({ pos: [0, 5.3, -5.4], str: '夜 光', size: 1.25, col: '#7ae8ff' });
  S.dyn = (t, add, S2, p, e) => {
    add.glow([0, 6.2, 0], 2.2 + p, [255, 255, 255], 0.5);
    for (let i = 0; i < 4; i++) { const tx = Math.sin(t * 0.8 + i * 1.7) * 5.5, tz = Math.cos(t * 0.6 + i * 2.3) * 2.6 + 0.5, hc = [[255, 122, 208], [122, 232, 255], [255, 216, 107], [157, 122, 255]][i]; add.beam([(-4.5 + i * 3), 7.3, -2], [tx, 0.02, tz], 1.5, hc, 0.07 + 0.07 * e + 0.09 * p); }
  };
  return S;
}
function setBridge() {
  const S = new Set3({ sky: ['#040820', '#1a1650', '#3b2a7a'], fog: [30, 26, 86], fogNear: 30, fogFar: 150, light: [0.2, 0.85, 0.45], amb: 0.6, tint: 'rgba(120,90,255,0.15)', stars: 110 });
  S.ground(-220, -220, 220, 60, C(0x161c52), { nx: 6, nz: 8, emit: true, y: -2.5 }); S.ground(-40, -1.9, 40, 1.9, C(0x5a4a78), { order: 1, nx: 20, colAt: (i) => C(i % 2 ? 0x5a4a78 : 0x65548a) });
  for (let x = -40; x < 40; x += 8) S.box(x + 4, -0.5, 0, 8, 0.5, 4.2, C(0x3a2d5c), { noTop: true });
  for (let x = -30; x <= 30; x += 2) S.box(x, 0, -1.8, 0.12, 1.05, 0.12, C(0x2a2248));
  for (let x = -30; x < 30; x += 4) { S.line([x, 1.05, -1.8], [x + 4, 1.05, -1.8], 0.09, C(0x3a2d7a)); S.line([x, 0.6, -1.8], [x + 4, 0.6, -1.8], 0.05, C(0x3a2d7a)); }
  lamp(S, -6, -1.6, 3.2); lamp(S, 6, -1.6, 3.2); lamp(S, -18, -1.6, 3.2); lamp(S, 18, -1.6, 3.2);
  const r = rnd(62); for (let x = -90; x <= 90; x += 9) building(S, x + r() * 2, -62 - r() * 10, 7, 8 + r() * 18, 6, [0x120d30, 0x1a1444, 0x0f0a28][(r() * 3) | 0], 400 + x, 'z');
  S.dyn = (t, add) => {
    const cols = [[255, 107, 138], [255, 209, 102], [127, 227, 255], [179, 136, 255], [141, 255, 176]];
    for (let j = 0; j < 5; j++) {
      const tt = t + j * 0.47, per = 1.7, n = Math.floor(tt / per), ph = (tt % per) / per, ox = (hash(n * 3.1 + j) - 0.5) * 46, oy = 8 + hash(n * 5.3 + j * 2) * 7, oz = -46, R = (1 - Math.pow(1 - ph, 3)) * 6.5 * (0.7 + hash(n + j) * 0.6);
      add.glow([ox, oy, oz], 11 * (1 - ph), cols[j], 0.3 * (1 - ph));
      for (let i = 0; i < 20; i++) { const a = (i / 20) * 6.2832, el = (hash(i * 1.9 + j) - 0.5) * 1.6; add.dot([ox + Math.cos(a) * Math.cos(el) * R, oy + Math.sin(el) * R + Math.sin(a) * Math.cos(el) * R * 0.9 - ph * ph * 2.2, oz], 0.3 * (1 - ph * 0.6), cols[j], (1 - ph * ph) * 0.95); }
    }
  };
  return S;
}
function setFerris() {
  const S = new Set3({ sky: ['#0b0a2e', '#2a1a66', '#5a2f8a'], fog: [44, 30, 100], fogNear: 30, fogFar: 140, light: [0.2, 0.85, 0.45], amb: 0.6, tint: 'rgba(130,100,255,0.14)', stars: 110 });
  S.ground(-220, -220, 220, 60, C(0x1e1848), { nx: 10, nz: 8 }); S.ground(-16, -9, 16, 7, C(0x2c2460), { order: 1, nx: 8, nz: 4, colAt: (i, j) => C((i + j) % 2 ? 0x2c2460 : 0x352c70) });
  const cx = 0, cy = 9.6, cz = -14, R = 7.6;
  for (const sx of [-1, 1]) for (const dz of [-0.9, 0.9]) S.line([sx * 4.8, 0, cz + dz], [cx, cy, cz + dz], 0.3, C(0x3a2d7a));
  for (const [x, col, rc] of [[-10, 0xf2b8c6, 0xff5c9e], [10, 0xcfe0ea, 0x3f9fe0]]) { S.box(x, 0, -6.5, 3.4, 2.2, 2.6, C(col)); S.cone(x, 2.2, -6.5, 2.8, 1.5, 4, C(rc)); S.box(x, 0.9, -5.17, 2.4, 0.9, 0.06, [255, 233, 168], { emit: true, bias: -1 }); }
  for (const x of [-13, -4.5, 4.5, 13]) S.cyl(x, 0, -4, 0.07, 4.2, 5, C(0x2a2248), { noTop: true });
  for (let s = 0; s < 3; s++) { const x0 = -13 + s * 8.5 + (s === 1 ? 0 : 0), x1 = x0 + (s === 1 ? 9 : 8.5); for (let i = 0; i < 6; i++) { const u0 = i / 6, u1 = (i + 1) / 6, y = (u) => 4.2 - Math.sin(u * Math.PI) * 0.8; S.line([lerp(x0, x1, u0), y(u0), -4], [lerp(x0, x1, u1), y(u1), -4], 0.04, [255, 216, 107]); if (i % 2 === 0) S.glows.push({ pos: [lerp(x0, x1, u0 + 0.08), y(u0 + 0.08) - 0.1, -4], r: 0.5, col: [[255, 143, 200], [255, 216, 107], [143, 232, 255]][(i / 2 + s) % 3], a: 0.9 }); } }
  bench(S, -6.2, -2.6, 0x5a4a8a); bench(S, 6.2, -2.6, 0x5a4a8a);
  S.dyn = (t, add, S2, p) => {
    const a0 = t * 0.12, pt = (a) => [cx + Math.cos(a) * R, cy + Math.sin(a) * R, cz];
    for (let i = 0; i < 24; i++) add.line(pt(a0 + (i / 24) * 6.2832), pt(a0 + ((i + 1) / 24) * 6.2832), 0.16, [255, 155, 214]);
    for (let i = 0; i < 12; i++) { const a = a0 + (i / 12) * 6.2832, q = pt(a), col = [[255, 122, 208], [122, 232, 255], [255, 216, 107], [157, 122, 255]][i % 4]; add.line([cx, cy, cz], q, 0.07, [200, 150, 230], 0.8); S2.box(q[0], q[1] - 1.0, cz, 1.15, 0.95, 0.95, col, { emit: true }); add.glow([q[0], q[1] - 0.5, cz], 1.5, col, 0.2 + 0.2 * p); }
    add.glow([cx, cy, cz], 2.5, [255, 255, 255], 0.35);
  };
  return S;
}
const SETS = {}; const BUILD = { river: setRiver, neon: () => setStreet('neon'), nameless: () => setStreet('nameless'), rain: () => setStreet('rain'), spring: () => setPark('spring'), summer: () => setPark('summer'), autumn: () => setPark('autumn'), winter: () => setPark('winter'), room: setRoom, bar: setBar, bridge: setBridge, ferris: setFerris };
const getSet = (n) => (SETS[n] ??= BUILD[n]());

// ---------- 角色（项目图集里的像素角色纸片） ----------
const CAST = {
  whale: { walk: 'walk_whale_', front: ['whale_big_idle', 'whale_big_blink'] }, claude: { walk: 'walk_claude_', front: ['claude_front_0', 'claude_front_1'] },
  kimi: { walk: 'walk_kimi_', front: ['kimi_front_0', 'kimi_front_1'], side: 'kimi_side_' }, gemini: { walk: 'walk_gemini_', front: ['gemini_front_0', 'gemini_front_1'], side: 'gemini_side_' },
  qwen: { walk: 'walk_qwen_', front: ['qwen_front_0', 'qwen_front_1'], side: 'qwen_side_' }, zai: { walk: 'walk_zai_', front: ['zai_front_0', 'zai_front_1'], side: 'zai_side_' },
  doubao: { walk: 'walk_doubao_big_', front: ['doubao_cage_0', 'doubao_cage_1'] }, gpt: { walk: 'gpt_fly_', front: ['gpt_boss_idle', 'gpt_boss_blink'] },
};
for (const id in CAST) { let n = 0; while (META.s[CAST[id].walk + n]) n++; CAST[id].n = n; }
const cellScale = (key) => (key.startsWith('whale_big') ? 0.6 : key.startsWith('gpt_boss') ? 0.58 : 1) * PX;
function track(k, t) {
  const n = k.length; let dist = 0;
  if (t <= k[0][0]) return { x: k[0][1], z: k[0][2], y: k[0][3] || 0, vx: 0, vz: 0, dist: 0, moving: false };
  for (let i = 0; i < n - 1; i++) {
    const A = k[i], B = k[i + 1], dx = B[1] - A[1], dz = B[2] - A[2], L = Math.hypot(dx, dz), dt = B[0] - A[0];
    if (t >= B[0]) { dist += L; continue; }
    const q = (t - A[0]) / dt; return { x: A[1] + dx * q, z: A[2] + dz * q, y: lerp(A[3] || 0, B[3] || 0, q), vx: dx / dt, vz: dz / dt, dist: dist + L * q, moving: L / dt > 0.15 };
  }
  const Z = k[n - 1]; return { x: Z[1], z: Z[2], y: Z[3] || 0, vx: 0, vz: 0, dist, moving: false };
}
const STRIDE = 1.35; // 播完一轮 8 帧步态走过的世界距离：帧号由「走过的距离」决定，脚不打滑
function actorAt(a, t, cam) {
  const tr = track(a.k, t), cs = CAST[a.c], bi = beatIdx(t), p = pulse(t);
  let key = null, flip = !!a.flip, bounce = 0, lean = a.lean ? a.lean(t) : 0;
  if (tr.moving) {
    key = cs.walk + (Math.floor((tr.dist / STRIDE) * cs.n) % cs.n);
    const p0 = cam.proj([tr.x, 0, tr.z]), p1 = cam.proj([tr.x + tr.vx * 0.2, 0, tr.z + tr.vz * 0.2]); flip = !!(p0 && p1 && p1[0] < p0[0]);
    bounce = 0.035 * Math.abs(Math.sin((tr.dist / STRIDE) * Math.PI * 2));
  } else {
    key = a.pose ? a.pose(t) : null;
    if (a.dance) { if (!key) key = cs.side && bi % 4 >= 2 ? cs.side + (bi % 2) : cs.front[0]; if (cs.side && bi % 8 >= 4) flip = !flip; bounce = 0.16 * p + 0.04 * Math.abs(Math.sin(t * 5 + (a.ph || 0))); lean += 0.07 * Math.sin(t * 4.2 + (a.ph || 0)); }
    if (!key) key = !a.noBlink && (t * 0.83 + (a.ph || 0) * 0.7 + a.c.length * 0.31) % 3.3 < 0.13 ? cs.front[1] : cs.front[0];
  }
  return { x: tr.x, y: tr.y, z: tr.z, key, flip, bounce, lean, alpha: a.alpha ? a.alpha(t) : 1, tint: a.tint, s: a.s || 1, moving: tr.moving };
}

// ---------- 相机 / 投影 ----------
function makeCam(pos, tgt, fov) {
  const f = norm(sub(tgt, pos)), r = norm(cross(f, [0, 1, 0])), u = cross(r, f), F = H / 2 / Math.tan((fov * Math.PI) / 360);
  const toCam = (q) => { const dx = q[0] - pos[0], dy = q[1] - pos[1], dz = q[2] - pos[2]; return [dx * r[0] + dy * r[1] + dz * r[2], dx * u[0] + dy * u[1] + dz * u[2], dx * f[0] + dy * f[1] + dz * f[2]]; };
  const proj = (q) => { const c = toCam(q); return c[2] < NEAR ? null : [W / 2 + (c[0] / c[2]) * F, H / 2 - (c[1] / c[2]) * F, c[2], F / c[2]]; };
  return { pos, f, r, u, F, toCam, proj };
}
function clipNear(p) {
  const out = [];
  for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length], ia = a[2] >= NEAR, ib = b[2] >= NEAR; if (ia) out.push(a); if (ia !== ib) { const q = (NEAR - a[2]) / (b[2] - a[2]); out.push([a[0] + (b[0] - a[0]) * q, a[1] + (b[1] - a[1]) * q, NEAR]); } }
  return out;
}
function heart(g, x, y, s) { g.beginPath(); g.moveTo(x, y + s * 0.9); g.bezierCurveTo(x - s * 1.6, y - s * 0.2, x - s * 0.7, y - s * 1.3, x, y - s * 0.4); g.bezierCurveTo(x + s * 0.7, y - s * 1.3, x + s * 1.6, y - s * 0.2, x, y + s * 0.9); g.fill(); }

// ---------- 3D 特效（都挂在世界坐标上，随相机透视） ----------
const hearts3 = (c, pos, t0, col = [255, 92, 158], n = 5) => { for (let i = 0; i < n; i++) { const age = c.t - t0 - i * 0.22; if (age < 0 || age > 1.6) continue; c.add.custom([pos[0] + Math.sin(age * 5 + i) * 0.22 + (i - n / 2) * 0.13, pos[1] + age * 0.85, pos[2]], (g, x, y, k) => { g.globalAlpha = 1 - age / 1.6; g.fillStyle = rgb(col); heart(g, x, y, 0.11 * k); g.globalAlpha = 1; }); } };
const tears3 = (c, pos, t0) => { if (c.t < t0) return; for (let i = 0; i < 6; i++) { const a = ((c.t - t0) * 1.5 + i * 0.37) % 1.1; c.add.dot([pos[0] + (i % 2 ? 0.11 : -0.11), pos[1] - a * a * 0.8, pos[2] + 0.06], 0.03, [150, 215, 255], 0.95); } };
const sparkle3 = (c, pos, t0, n = 8, col = [255, 247, 176]) => { const u = c.t - t0; if (u < 0 || u > 1.1) return; for (let i = 0; i < n; i++) { const a = (i / n) * 6.2832; c.add.custom([pos[0] + Math.cos(a) * u * 1.1, pos[1] + Math.sin(a) * u * 1.1, pos[2]], (g, x, y, k) => { const s = 0.1 * k; g.globalAlpha = 1 - u / 1.1; g.fillStyle = rgb(col); g.save(); g.translate(x, y); g.rotate(u * 3); g.fillRect(-s * 0.2, -s, s * 0.4, s * 2); g.fillRect(-s, -s * 0.2, s * 2, s * 0.4); g.restore(); g.globalAlpha = 1; }); } };
const bolt3 = (c, pos, s, col) => c.add.custom(pos, (g, x, y, k) => { const q = s * k * 0.012; g.fillStyle = rgb(col); g.beginPath(); g.moveTo(x, y); g.lineTo(x - 24 * q, y + 60 * q); g.lineTo(x - 2 * q, y + 58 * q); g.lineTo(x - 18 * q, y + 120 * q); g.lineTo(x + 28 * q, y + 46 * q); g.lineTo(x + 4 * q, y + 48 * q); g.closePath(); g.fill(); });
const label3 = (c, pos, text, bg, size = 0.34, fg = '#fff') => c.add.custom(pos, (g, x, y, k) => { const fs = size * k; g.font = `${fs}px BG`; const w = g.measureText(text).width + fs * 0.9; g.fillStyle = bg; g.beginPath(); g.roundRect(x - w / 2, y - fs * 0.8, w, fs * 1.6, fs * 0.4); g.fill(); g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, x, y + fs * 0.04); });
const bubble3 = (c, pos, text) => c.add.custom(pos, (g, x, y, k) => { const fs = 0.36 * k; g.font = `${fs}px BG`; const w = g.measureText(text).width + fs * 1.3; g.fillStyle = 'rgba(255,255,255,0.96)'; g.beginPath(); g.roundRect(x - w / 2, y - fs, w, fs * 1.8, fs * 0.6); g.fill(); g.beginPath(); g.moveTo(x - fs * 0.3, y + fs * 0.75); g.lineTo(x, y + fs * 1.25); g.lineTo(x + fs * 0.35, y + fs * 0.75); g.fill(); g.fillStyle = '#3a2250'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, x, y - fs * 0.1); });
const thought3 = (c, pos, key) => c.add.custom(pos, (g, x, y, k) => { const R = 0.95 * k, cell = META.s[key]; g.save(); g.fillStyle = 'rgba(255,240,215,0.96)'; for (const [dx, dy, r] of [[-0.85, 1.25, 0.09], [-0.6, 0.95, 0.15]]) { g.beginPath(); g.arc(x + dx * k, y + dy * k, r * k, 0, 7); g.fill(); } g.beginPath(); g.arc(x, y, R, 0, 7); g.fill(); g.clip(); g.fillStyle = 'rgba(255,196,150,0.5)'; g.fillRect(x - R, y - R, R * 2, R * 2); const sc = (1.7 * k) / cell[3]; g.imageSmoothingEnabled = false; g.drawImage(ENV.atlas, cell[0], cell[1], cell[2], cell[3], x - (cell[2] * sc) / 2, y - R * 0.86 + Math.sin(c.t * 2) * 0.03 * k, cell[2] * sc, cell[3] * sc); g.restore(); });
const eyeliner3 = (c, pos, t0) => c.add.custom(pos, (g, x, y, k) => { const q = sm((c.t - t0) / 1.0); if (q <= 0) return; g.save(); g.strokeStyle = '#07040e'; g.lineCap = 'round'; const cx = x - 0.025 * k, ly = y - 1.06 * k; for (const sd of [-1, 1]) { const ex = cx + sd * 0.092 * k; g.lineWidth = 0.017 * k; g.beginPath(); g.moveTo(ex - sd * 0.05 * k, ly + 0.012 * k); g.quadraticCurveTo(ex, ly - 0.014 * k, ex + sd * (-0.05 + 0.105 * q) * k, ly + 0.004 * k); g.stroke(); if (q > 0.5) { const w = (q - 0.5) * 2; g.lineWidth = 0.014 * k; g.beginPath(); g.moveTo(ex + sd * 0.052 * k, ly + 0.005 * k); g.lineTo(ex + sd * (0.052 + 0.055 * w) * k, ly - 0.036 * w * k); g.stroke(); } } g.restore(); }, 0.4);

// ---------- 2D HUD ----------
function card(g, x, y, items, t, t0, step) {
  g.save(); g.fillStyle = 'rgba(255,248,235,0.96)'; g.beginPath(); g.roundRect(x, y, 440, 64 + items.length * 54, 18); g.fill(); g.fillStyle = '#ff3fa4'; g.font = '30px BG'; g.textBaseline = 'middle'; g.textAlign = 'left'; g.fillText('为了他 · 改变清单', x + 24, y + 36);
  items.forEach((s, i) => { const yy = y + 92 + i * 54; g.fillStyle = '#3a2250'; g.font = '28px BG'; g.fillText(s, x + 72, yy); g.strokeStyle = '#3a2250'; g.lineWidth = 3; g.strokeRect(x + 26, yy - 14, 28, 28); const k = clamp((t - t0 - i * step) / 0.3); if (k > 0) { g.strokeStyle = '#ff3fa4'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(x + 30, yy); g.lineTo(x + 39, yy + 10 * k); g.lineTo(x + 30 + 30 * k, yy - 18 * k); g.stroke(); } }); g.restore();
}
function ecg(g, x, y, w, t) { g.save(); g.fillStyle = 'rgba(15,10,35,0.8)'; g.beginPath(); g.roundRect(x - 18, y - 62, w + 36, 124, 16); g.fill(); g.strokeStyle = '#7affc2'; g.lineWidth = 3; g.beginPath(); for (let i = 0; i <= w; i += 6) { const v = Math.sin((i + t * 200) * 0.05) * 1.5; if (i) g.lineTo(x + i, y + 22 + v); else g.moveTo(x + i, y + 22 + v); } g.stroke(); g.fillStyle = '#7affc2'; g.font = '26px BG'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('心动检测 · 没有感觉', x, y - 30); g.restore(); }
function tag(g, text, x, y, size = 30) { g.save(); g.font = `${size}px BG`; const w = g.measureText(text).width + 28; g.fillStyle = 'rgba(12,8,30,0.6)'; g.beginPath(); g.roundRect(x, y - size * 0.8, w, size * 1.6, 12); g.fill(); g.fillStyle = '#fff'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(text, x + 14, y + 1); g.restore(); }

// ---------- 分镜（时间为原曲时间；每句歌词一个镜头，镜头在歌词前两帧切换） ----------
const A = (c, k, o = {}) => ({ c, k, ...o });
const S = (c, x, z, o = {}) => A(c, [[0, x, z]], o);
const D = (c, x, z, o = {}) => A(c, [[0, x, z]], { dance: true, ...o });
const DARK = 'rgba(20,20,70,0.5)';
const shots = [];
const add = (a, b, set, o) => shots.push({ a, b, set, ...o });
const mir = (v, p) => (v ? [-p[0], p[1] + 0.25, p[2]] : p);
const CL = ['学化妆', '染粉色挑染', '画上黑眼线', '买一件红皮衣', '学会去酒吧'];

function sBreak(a, b, ps, set, v) {
  const sp = ps + 1.85;
  add(a, b, set, { name: '放开的手', cam: [mir(v, [0.9, 1.6, 6.9]), [0.1, 1.05, 0], mir(v, [1.7, 1.45, 5.4]), [0.4, 1.0, 0], 36], actors: [A('claude', [[a, -0.6, 0], [sp + 0.25, -0.6, 0], [sp + 6, -9, 0.7]]), S('whale', 0.8, 0, { lean: (t) => 0.06 * sm((t - sp - 0.5) / 1) })],
    fx(c) { const t = c.t, red = [255, 77, 109]; if (t < sp) c.add.line([-0.3, 0.72 + Math.sin(t * 7) * 0.02, 0.06], [0.5, 0.72, 0.06], 0.035, red); else { const q = clamp((t - sp) / 1.3); c.add.line([c.st[0].x + 0.3, 0.72, 0.06], [c.st[0].x + 0.42, 0.72 - q * 0.68, 0.06], 0.035, red, 1 - q); c.add.line([0.5, 0.72, 0.06], [0.4, 0.72 - q * 0.68, 0.06], 0.035, red, 1 - q); label3(c, [c.st[0].x, 2.25, 0], '保重', 'rgba(20,10,40,0.55)', 0.3); } } });
}
function sCry(a, b, ps, set) {
  add(a, b, set, { name: '哭了很久', cam: [[2.0, 1.35, 4.6], [0.7, 0.95, 0], [1.3, 1.2, 3.3], [0.8, 0.95, 0], 34], actors: [S('whale', 0.8, 0, { lean: () => 0.06 }), A('claude', [[a, -4.5, 1.0], [b, -8.5, 1.8]])], fx(c) { tears3(c, [0.775, 1.12, 0], ps + 0.3); } });
}
function sNeon(a, b, ps, v) {
  add(a, b, 'neon', { name: '坏坏的女友', flash: 1, cam: [mir(v, [-4, 1.9, 9.6]), [-1.5, 1.4, 0], mir(v, [2.4, 1.6, 7.4]), [3.0, 1.5, -0.8], 38], actors: [A('claude', [[a, -6.5, 0.8], [b, 1.8, 0.8]]), D('zai', 3.7, -0.9, { ph: 1 }), D('gemini', 5.5, 0.2, { ph: 2 }), S('whale', -8.4, -1.9, { tint: 'rgba(40,40,110,0.4)' })],
    fx(c) { hearts3(c, [c.st[0].x + 0.4, 1.9, 0.8], a + 0.5); hearts3(c, [c.st[0].x + 0.4, 1.9, 0.8], a + 2.0); if (c.t > ps + 1.85) { bolt3(c, [1.4, 5.4, -2], 1.3, [255, 225, 77]); bolt3(c, [7, 4.8, -2.5], 0.9, [122, 232, 255]); label3(c, [4.6, 3.1, -0.4], '刺激！', '#ff3fa4', 0.5); } } });
}
function sPure(a, b, ps, season) {
  add(a, b, season, { name: '多余的温柔', cam: [[0.3, 1.7, 7.2], [0, 1.0, 0], [-1.0, 1.45, 5.2], [-0.2, 0.95, 0], 36], actors: [S('whale', -0.9, 0, { pose: () => 'whale_big_wave' }), A('claude', [[a, 0.9, 0], [ps + 1.7, 0.9, 0], [b + 2, 8, 0.6]])],
    fx(c) { for (let i = 0; i < 7; i++) { const age = c.t - (a + 0.3 + i * 0.3); if (age < 0) continue; const yy = Math.max(0.05, 1.15 + age * 1.3 - age * age * 1.15), land = yy <= 0.051, x = -0.45 + i * 0.2 + Math.min(age, 1.6) * 0.3; c.add.custom([x, yy, 0.35], (g, sx, sy, k) => { g.globalAlpha = land ? 0.55 : 1; g.fillStyle = land ? '#a99aa6' : '#ff7fbf'; heart(g, sx, sy, 0.1 * k); g.globalAlpha = 1; }); } if (c.t > ps + 1.7) label3(c, [-0.9, 2.2, 0], '太单纯', 'rgba(60,30,90,0.6)', 0.28); } });
}
function sVanish(a, b, ps, v) {
  if (!v) add(a, b, 'nameless', { name: '无名大街', cam: [[1.0, 2.3, 8.6], [5, 1.3, -6], [2.4, 2.0, 6.8], [6, 1.7, -17], 38], actors: [S('claude', 1.9, 1.3), A('whale', [[a, 4.2, 0.6], [b, 6.3, -25]], { alpha: (t) => 1 - sm((t - (ps + 1.7)) / 1.9) })] });
  else add(a, b, 'nameless', { name: '无名大街', cam: [[-3, 2.0, 8.8], [1, 1.3, -2], [3, 2.1, 7.5], [6, 1.6, -15], 38], actors: [A('claude', [[a, -5.5, 0.8], [b, 4.8, 0.2]]), S('whale', 6, -21, { alpha: (t) => 0.4 * (0.6 + 0.4 * Math.sin(t * 3)) * (1 - sm((t - ps - 1.8) / 1.6)) })] });
}
function sPhone(a, b, ps, v) {
  add(a, b, 'room', { name: '没有来电', cam: [[-0.5, 2.3, 7.4], [2, 1.3, -2], [2.5, 1.7, 3.2], [3.5, 1.0, -2.2], 36], actors: [S('claude', 1.8, -1.3)],
    fx(c) { const ring = c.t > ps + 1.85; c.S2.box(3.6, 0.92, -2.2, 0.26, 0.04, 0.46, ring ? [122, 255, 194] : [30, 30, 40], { emit: true, bias: -0.3 }); if (ring) { c.add.glow([3.6, 1.0, -2.2], 1.0, [122, 255, 194], 0.45); label3(c, [3.6, 1.72, -2.2], '来电 0', 'rgba(10,40,30,0.85)', 0.26, '#7affc2'); } },
    hud(g, c) { tag(g, '第 ' + Math.min(v ? 999 : 365, Math.floor(1 + (c.u / (b - a)) * (v ? 999 : 365))) + ' 天', 60, 70, 34); } });
}
function sBarWide(a, b, ps, v) {
  add(a, b, 'bar', { name: '酒吧舞池', flash: 1, cam: [mir(v, [-7, 3.4, 10.5]), [0, 1.3, -1], mir(v, [-2.5, 2.4, 9]), [0, 1.4, -1.5], 40], actors: [D('gemini', -2.6, 1.2, { ph: 1 }), D('qwen', 3.0, 1.8, { ph: 2 }), D('kimi', -5.0, -0.6, { ph: 3 }), S('doubao', 6.6, -2.3), S('zai', 1.3, -2.4), D('whale', 0.3, -2.4, { ph: 4, tint: 'rgba(20,10,50,0.5)' }), A('claude', [[a, -9.5, 3.6], [b, -5.4, 3.4]])] });
}
function sProfile(a, b, ps) {
  const tw = ps + 1.45;
  add(a, b, 'bar', { name: '熟悉的侧脸', cam: [[-1.6, 1.7, 7.6], [-2.2, 1.1, 0.8], [0.7, 1.5, 4.9], [-0.2, 1.05, 0.8], 36], actors: [D('gemini', -3.6, -1.0, { ph: 1 }), D('qwen', 3.2, -0.6, { ph: 2 }), S('zai', 1.3, -2.4), A('whale', [[a, -4.8, 0.8], [tw, -0.3, 0.8], [b, -0.3, 0.8]], { pose: () => 'whale_big_wave' }), S('claude', -3.9, 3.9, { tint: DARK })],
    fx(c) { const w = c.st[3]; c.add.glow([w.x, 1.0, w.z], 2.2, [255, 255, 255], 0.2); if (c.t > tw) { sparkle3(c, [w.x, 1.1, w.z], tw, 10, [255, 209, 240]); hearts3(c, [w.x + 0.5, 1.7, w.z], tw + 0.2, [255, 120, 190], 4); } } });
}
function sLean(a, b, ps, v) {
  add(a, b, 'bar', { name: '陌生的肩', cam: [mir(v, [-2.6, 1.9, 6.6]), [0.7, 1.05, -2.4], mir(v, [-0.6, 1.55, 2.8]), [0.9, 1.05, -2.4], 36], actors: [S('zai', 1.35, -2.4), S('whale', 0.55, -2.4, { lean: (t) => 0.17 * sm((t - ps) / 1.3) + 0.015 * Math.sin(t * 2.2) }), D('gemini', -3.4, -0.6, { ph: 1 }), D('qwen', 4.4, 0.3, { ph: 2 }), S('claude', v ? 3.6 : -3.6, 1.4, { tint: DARK })],
    fx(c) { hearts3(c, [1.0, 1.9, -2.4], ps + 0.9, [255, 79, 163], 4); label3(c, [1.5, 2.25, -2.4], '陌生人', 'rgba(15,10,35,0.7)', 0.24); } });
}
function sEyeliner(a, b, ps) {
  add(a, b, 'bar', { name: '黑色的眼线', cam: [[0.75, 1.2, 4.9], [0, 0.92, 1], [0.25, 1.08, 3.3], [0, 0.92, 1], 30], actors: [S('whale', 0, 1, { noBlink: true }), D('gemini', -2.9, -1.8, { ph: 1 }), D('qwen', 3.0, -1.6, { ph: 2 })], fx(c) { eyeliner3(c, [0, 0, 1], ps + 0.35); c.add.glow([0, 0.9, 1], 1.8, [255, 255, 255], 0.14); } });
}
function sScorn(a, b, ps) {
  add(a, b, 'bar', { name: '一点轻蔑', cam: [[-0.7, 1.6, 6.4], [0.4, 1.0, 0.8], [0.9, 1.45, 5.2], [0.5, 1.0, 0.8], 36], actors: [S('whale', -0.8, 0.8, { pose: () => 'whale_big_point', flip: true }), A('claude', [[a, 1.4, 0.8], [ps + 1.25, 1.4, 0.8], [ps + 1.45, 1.9, 0.8, 0.3], [ps + 1.65, 2.3, 0.8], [b, 2.3, 0.8]]), S('zai', -2.6, -0.6), D('qwen', 4.2, -1.6, { ph: 2 })],
    fx(c) { const q = (c.t - ps - 0.75) / 0.5; if (q > 0 && q < 1) c.add.custom([lerp(-0.25, 1.3, q), 0.95 + Math.sin(q * 3.14) * 0.2, 0.85], (g, x, y, k) => { g.fillStyle = '#fff'; g.save(); g.translate(x, y); g.rotate(c.t * 9); g.fillRect(-0.03 * k, -0.14 * k, 0.06 * k, 0.28 * k); g.fillRect(-0.14 * k, -0.03 * k, 0.28 * k, 0.06 * k); g.restore(); }); if (c.t > ps + 1.25) { sparkle3(c, [1.5, 1.0, 0.85], ps + 1.25, 8, [255, 255, 255]); label3(c, [-0.8, 2.25, 0.8], '轻蔑', '#ff3fa4', 0.32); } } });
}
function sFeel(a, b, ps, v) {
  add(a, b, 'bar', { name: '谁的怀中', cam: [mir(v, [3.2, 2.0, 7.2]), [0, 1.1, 0.4], mir(v, [-2.2, 1.8, 6.6]), [0, 1.1, 0.4], 38], actors: [D('zai', 0.9, 0.4, { ph: 1 }), D('whale', 0, 0.45, { ph: 2 }), D('gemini', -0.95, 0.5, { ph: 3 }), D('kimi', 3.8, -1.4, { ph: 4 }), S('claude', -5.4, -1.8, { tint: DARK })], hud(g, c) { ecg(g, 70, 100, 360, c.t); } });
}
function sMiss(a, b, ps, v) {
  add(a, b, 'bridge', { name: '深夜想念', cam: [mir(v, [-3.8, 1.9, 7.2]), [-0.4, 1.7, 0], mir(v, [-1.6, 1.6, 5.4]), [-0.4, 1.8, 0], 38], actors: [S('claude', -1.4, 0)], fx(c) { thought3(c, [0.55, 2.75, 0], 'whale_idle'); hearts3(c, [-1.0, 2.0, 0], a + 0.6, [255, 122, 184], 3); hearts3(c, [-1.0, 2.0, 0], a + 2.2, [255, 122, 184], 3); } });
}
function sChange(a, b, ps) {
  add(a, b, 'room', { name: '为你改变', cam: [[-3.8, 1.8, 6.6], [-1.0, 1.05, -0.5], [-2.4, 1.6, 4.6], [-0.8, 1.05, -0.5], 36], actors: [S('whale', -1.2, -0.5)], fx(c) { for (let i = 0; i < 5; i++) sparkle3(c, [-1.2, 0.95, -0.45], ps + 0.4 + i * 0.6, 6, i % 2 ? [122, 232, 255] : [255, 209, 240]); }, hud(g, c) { card(g, 790, 60, CL, c.t, ps + 0.35, 0.6); } });
}
function sGlass(a, b, ps) {
  add(a, b, 'river', { name: '回不到从前', sepia: (u) => sm(u / 3.5), cam: [[3.9, 1.9, 8.4], [0, 1.1, 0], [2.6, 1.6, 6.2], [0, 1.1, 0], 36], actors: [A('whale', [[a, -5.5, 0], [ps + 2.2, -0.9, 0], [b, -0.9, 0]]), A('claude', [[a, 5.5, 0], [ps + 2.2, 0.9, 0], [b, 0.9, 0]])],
    fx(c) { const k = clamp((c.t - (ps + 1.9)) / 0.5); if (k <= 0) return; c.S2.poly([[0, 0, -1.3], [0, 0, 1.3], [0, 2.7, 1.3], [0, 2.7, -1.3]], [190, 232, 255], { two: true, emit: true, alpha: 0.3 * k, edge: false }); const wc = [255, 255, 255]; for (const [p, q] of [[[0, 0, -1.3], [0, 2.7, -1.3]], [[0, 2.7, -1.3], [0, 2.7, 1.3]], [[0, 2.7, 1.3], [0, 0, 1.3]]]) c.add.line(p, q, 0.04, wc, 0.8 * k); if (c.t > ps + 3.3) for (const [p, q] of [[[0, 1.9, -0.6], [0, 1.4, 0]], [[0, 1.4, 0], [0, 1.6, 0.5]], [[0, 1.4, 0], [0, 0.7, 0.2]], [[0, 0.7, 0.2], [0, 0.3, 0.7]], [[0, 1.4, 0], [0, 1.0, -0.6]]]) c.add.line(p, q, 0.025, wc, 0.9); } });
}
function sRewind(a, b) {
  add(a, b, 'nameless', { name: '回不到从前', rewind: true, cam: [[0, 2.0, 9.2], [0, 1.2, 0], [0, 1.8, 7.6], [0, 1.2, 0], 38], actors: [A('whale', [[a, 5, 0.5], [b - 1.6, -5, 0.5], [b, -5, 0.5]]), A('claude', [[a, 6.5, -0.5], [b - 1.6, -3.5, -0.5], [b, -3.5, -0.5]])] });
}
function pass(k0, v) {
  const T = (i) => (k0 + i === 0 ? 20 : P(k0 + i) - 0.08), ps = (i) => P(k0 + i);
  sBreak(T(0), T(1), ps(0), v ? 'rain' : 'river', v); sCry(T(1), T(2), ps(1), v ? 'rain' : 'river'); sNeon(T(2), T(3), ps(2), v); sPure(T(3), T(4), ps(3), v ? 'autumn' : 'spring');
  sVanish(T(4), T(5), ps(4), v); sPhone(T(5), T(6), ps(5), v); sBarWide(T(6), T(7), ps(6), v); sProfile(T(7), T(8), ps(7)); sLean(T(8), T(9), ps(8), v); sEyeliner(T(9), T(10), ps(9));
  sScorn(T(10), T(11), ps(10)); sFeel(T(11), T(12), ps(11), v); sMiss(T(12), T(13), ps(12), v); sChange(T(13), T(14), ps(13));
  if (!v) sGlass(T(14), T(16), ps(14)); else sRewind(T(14), T(16));
}
pass(0, 0);
[['spring', '2011 · 春'], ['summer', '2012 · 夏'], ['autumn', '2013 · 秋'], ['winter', '2014 · 冬']].forEach(([sn, cap], i) => {
  const a = P(16 + i * 2) - 0.08, b = P(18 + i * 2) - 0.08, last = i === 3;
  add(a, b, sn, { name: '间奏 · ' + cap, film: cap, cam: [[-5.5, 1.8, 8.2], [-6, 1.1, 0], [6.5, 1.8, 8.2], [last ? 6.6 : 6, 1.1, 0], 38],
    actors: [A('whale', [[a, -7, 0.4], [b, 7.2, 0.4]]), last ? A('claude', [[a, -8.2, -0.5], [a + 3.6, -1.6, -0.5], [b, -1.6, -0.5]]) : A('claude', [[a, -8.2, -0.5], [b, 6.0, -0.5]])],
    fx(c) { if (!last) hearts3(c, [c.st[0].x - 0.6, 2.0, 0], a + 1.2 + i * 0.4, [255, 150, 200], 3); else if (c.t > a + 4.2) tears3(c, [c.st[1].x, 1.0, -0.5], a + 4.2); } });
});
pass(24, 1);
{
  const T = (i) => P(40 + i) - 0.08, ps = (i) => P(40 + i);
  add(T(0), T(1), 'ferris', { name: '安静的发现', cam: [[0, 2.2, 11.5], [0, 2.8, -3], [0, 1.9, 8.8], [0, 2.3, -3], 40], actors: [S('claude', -3.2, 0.5), S('whale', 3.2, 0.5)] });
  add(T(1), T(2), 'ferris', { name: '没有任何语言', cam: [[-4.2, 1.8, 7.6], [0, 1.5, 0.5], [-1.4, 1.7, 6.6], [0, 1.5, 0.5], 36], actors: [S('claude', -1.9, 0.5), S('whale', 1.9, 0.5)], fx(c) { if (c.t > ps(1) + 0.3) bubble3(c, [-1.9, 2.5, 0.5], '……'); if (c.t > ps(1) + 1.7) bubble3(c, [1.9, 2.5, 0.5], '……'); } });
  add(T(2), T(3), 'spring', { name: '纯真的永远', warm: 1, cam: [[1.6, 1.5, 5.8], [0, 0.95, 0], [0.6, 1.35, 4.2], [0, 0.95, 0], 34], actors: [S('whale', 0, 0, { pose: (t) => ((t * 1.6) % 2 < 1.2 ? 'whale_big_wave' : null) })], fx(c) { hearts3(c, [0.5, 1.6, 0], T(2) + 0.5, [255, 150, 200], 4); hearts3(c, [-0.5, 1.6, 0], T(2) + 2.0, [255, 150, 200], 4); }, hud(g) { tag(g, '回忆', 60, 70, 34); } });
  add(T(3), T(4), 'ferris', { name: '开始怀念', cam: [[-6, 1.8, 8.2], [-4, 1.2, 1], [2.2, 1.7, 7.6], [3.2, 1.2, 1], 38], actors: [A('claude', [[T(3), -8.5, 1], [T(4), 1.4, 1]]), A('whale', [[T(3), 3.6, 1], [T(4), 6.6, 1]])], fx(c) { hearts3(c, [c.st[0].x, 2.0, 1], T(3) + 0.6, [255, 122, 184], 3); hearts3(c, [c.st[0].x, 2.0, 1], T(3) + 2.2, [255, 122, 184], 3); } });
}
{
  const T = (i) => P(44 + i) - 0.08, ps = (i) => P(44 + i);
  add(T(0), T(1), 'bar', { name: '迷人的笑脸', flash: 1, cam: [[0, 2.7, 10.8], [0, 1.3, -0.5], [0, 1.8, 6.6], [0, 1.15, 0.4], 40], actors: [D('gemini', -2.4, 0.2, { ph: 1 }), D('qwen', 2.5, 0.3, { ph: 2 }), D('kimi', -4.4, -1.4, { ph: 3 }), D('zai', 4.3, -1.2, { ph: 4 }), S('gpt', -6.4, -2.6), S('doubao', 6.6, -2.3), D('whale', 0, 1.0, { ph: 5, pose: () => 'whale_big_wave' }), S('claude', -5.6, 3.8, { tint: DARK })],
    fx(c) { for (let i = 0; i < 4; i++) sparkle3(c, [0, 1.1, 1.0], ps(0) + 0.2 + i * 0.9, 10, [255, 209, 240]); c.add.glow([0, 1.0, 1.0], 2.4, [255, 255, 255], 0.2); } });
  sLean(T(1), T(2), ps(1), 1); sEyeliner(T(2), T(3), ps(2)); sScorn(T(3), T(4), ps(3));
  add(T(4), T(5), 'bridge', { name: '谁的怀中', cam: [[-4.2, 1.9, 8.2], [1, 1.4, 0], [-2, 1.7, 7], [1.6, 1.4, 0], 38], actors: [S('claude', -2.3, 0.3), D('whale', 3.6, -0.2, { ph: 1 }), S('zai', 4.5, -0.2)], hud(g, c) { ecg(g, 70, 100, 360, c.t); } });
  sMiss(T(5), T(6), ps(5), 1);
  add(T(6), T(7), 'river', { name: '为你改变', cam: [[0.5, 1.7, 7.6], [-0.6, 1.1, 0], [1.6, 1.6, 6.6], [1, 1.1, 0], 36], actors: [S('claude', -1.3, -0.6), A('whale', [[T(6), -7, 0.5], [T(7), 5.5, 0.5]])], fx(c) { hearts3(c, [-1.0, 1.9, -0.6], T(6) + 0.5, [255, 122, 184], 4); hearts3(c, [-1.0, 1.9, -0.6], T(6) + 2.0, [255, 122, 184], 4); }, hud(g, c) { card(g, 800, 50, CL.slice(0, 4), c.t, ps(6) + 0.3, 0.55); } });
  add(T(7), 215.5, 'river', { name: '回不到从前', sepia: (u) => sm(u / 2.6), cam: [[-3, 1.8, 7.2], [1, 1.2, 0], [-4.2, 2.3, 9.4], [3, 1.4, 0], 38], actors: [S('claude', -1.3, -0.6), A('whale', [[T(7), 1.6, 0.5], [216, 10, 0.5]])] });
}
shots.sort((x, y) => x.a - y.a);
export const SHOTS = shots.map((s) => ({ start: +(s.a - T0).toFixed(2), end: +(Math.min(s.b, 215) - T0).toFixed(2), name: s.name, set: s.set }));

// ---------- 渲染 ----------
let ENV = null;
const ST = { face: 0, sprite: 1, glow: 2, text: 3, custom: 4, line: 5, dot: 6, shadow: 7, beam: 8 };

function drawSubtitle(g, t) {
  // 样式照 3D 版 src/mv/film.ts 的 lyric()：没有药丸底、没有金边，只压一条渐变暗带；
  // 每个字先描深色边再填白，唱到的部分按歌手色（小凌偏粉、徐良偏蓝）逐字渐变填上去。
  let cue = null;
  for (let i = CUES.length - 1; i >= 0; i--) { const c = CUES[i]; if (t >= c.start - 0.25) { if (t <= c.end + 0.35) cue = c; break; } }
  if (!cue) return;
  const a = Math.min(1, (t - (cue.start - 0.25)) / 0.2, (cue.end + 0.35 - t) / 0.25);
  if (a <= 0) return;
  const chars = Array.from(cue.text);
  const n = chars.filter((c) => c !== ' ').length;
  const fillDur = Math.min(cue.end - cue.start, 0.3 * n + 0.5) * 0.92;
  const prog = ((t - cue.start) / fillDur) * n;
  const size = 46;
  g.save();
  g.globalAlpha = a;
  g.font = `${size}px BG`;
  g.textBaseline = 'middle';
  g.textAlign = 'left';
  const widths = chars.map((c) => (c === ' ' ? size * 0.5 : g.measureText(c).width));
  const tw = widths.reduce((p, v) => p + v, 0);
  const y = H - 64;
  const x0 = W / 2 - tw / 2;
  // 底带：从字上方 60px 透明到画面底，比药丸轻，画面不被切一块
  const band = g.createLinearGradient(0, y - 60, 0, H);
  band.addColorStop(0, 'rgba(6,3,14,0)');
  band.addColorStop(1, 'rgba(6,3,14,0.6)');
  g.fillStyle = band;
  g.fillRect(0, y - 60, W, H - y + 60);
  // 字幕里不出现歌手名，音色靠颜色区分
  g.lineJoin = 'round';
  const grad = g.createLinearGradient(0, y - size / 2, 0, y + size / 2);
  grad.addColorStop(0, cue.singer === '小凌' ? '#ffd1ea' : '#d8f6ff');
  grad.addColorStop(1, cue.singer === '小凌' ? '#ff3d9a' : '#22b8ff');
  let x = x0, j = 0;
  chars.forEach((c, i) => {
    const cw = widths[i];
    if (c !== ' ') {
      g.lineWidth = 8;
      g.strokeStyle = 'rgba(8,4,18,0.9)';
      g.strokeText(c, x, y);
      g.fillStyle = '#ffffff';
      g.fillText(c, x, y);
      const amt = clamp(prog - j);
      if (amt > 0) {
        g.save();
        g.beginPath();
        g.rect(x - 2, y - size, cw * amt + 2, size * 2);
        g.clip();
        g.fillStyle = grad;
        g.fillText(c, x, y);
        g.restore();
      }
      j++;
    }
    x += cw;
  });
  g.restore();
}


export function createFilm(env) {
  ENV = env; const tmp = env.makeCanvas(160, 180), tg = tmp.getContext('2d');
  function render(g, tf, opts = {}) {
    const t = clamp(tf, 0, DUR - 0.001) + T0;
    const shot = shots.find((s) => t >= s.a && t < s.b) || shots[shots.length - 1];
    const u = t - shot.a, dur = shot.b - shot.a, p = pulse(t), e = energy(t), bi = beatIdx(t), set = getSet(shot.set);
    // 相机：导演关键帧 + 轻微手持 + 观众拖拽的环绕偏移
    const [p0, t0, p1, t1, fov] = shot.cam, k = sm(u / dur), orb = opts.orbit || { yaw: 0, pitch: 0, zoom: 1 };
    const tgt = [lerp(t0[0], t1[0], k), lerp(t0[1], t1[1], k), lerp(t0[2], t1[2], k)];
    let off = [lerp(p0[0], p1[0], k) - tgt[0] + Math.sin(t * 0.7) * 0.05, lerp(p0[1], p1[1], k) - tgt[1] + Math.sin(t * 0.9) * 0.03, lerp(p0[2], p1[2], k) - tgt[2]];
    if (orb.yaw || orb.pitch || orb.zoom !== 1) { const d = Math.hypot(off[0], off[1], off[2]) * (orb.zoom || 1), yaw = Math.atan2(off[0], off[2]) + orb.yaw, pit = clamp(Math.asin(clamp(off[1] / Math.hypot(off[0], off[1], off[2]), -1, 1)) + orb.pitch, -0.12, 1.35); off = [Math.sin(yaw) * Math.cos(pit) * d, Math.sin(pit) * d, Math.cos(yaw) * Math.cos(pit) * d]; }
    const cam = makeCam([tgt[0] + off[0], Math.max(0.25, tgt[1] + off[1]), tgt[2] + off[2]], tgt, fov - 0.5 * p);
    const F = cam.F;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.lineJoin = 'round'; g.lineCap = 'butt';
    // 天空
    const hy = H / 2 + (cam.f[1] / Math.max(0.05, Math.hypot(cam.f[0], cam.f[2]))) * F, sk = g.createLinearGradient(0, hy - 560, 0, hy);
    sk.addColorStop(0, set.sky[0]); sk.addColorStop(0.62, set.sky[1]); sk.addColorStop(1, set.sky[2]); g.fillStyle = sk; g.fillRect(0, 0, W, H); g.fillStyle = rgb(set.fog); g.fillRect(0, Math.max(0, hy), W, H);
    if (set.stars) { const yaw = Math.atan2(cam.f[0], -cam.f[2]); g.fillStyle = '#fff'; for (let i = 0; i < set.stars; i++) { const sx = (((hash(i) * 2400 - yaw * 700) % 2400) + 2400) % 2400 - 560, sy = hy - 40 - hash(i + 99) * 520; if (sx < 0 || sx > W || sy < 0) continue; g.globalAlpha = 0.35 + 0.6 * hash(i + 7) * (0.7 + 0.3 * Math.sin(t * 2 + i)); g.fillRect(sx, sy, 2, 2); } g.globalAlpha = 1; }
    // 收集可绘制体
    const ents = []; let seq = 0;
    const S2 = new Set3({ light: set.L, amb: set.amb });
    const adder = {
      glow: (pos, r, col, a = 1) => { const q = cam.proj(pos); if (q) ents.push({ k: q[2], t: ST.glow, q, r, col, a }); },
      text: (pos, str, size, col, a = 1) => { const q = cam.proj(pos); if (q) ents.push({ k: q[2] - 0.7, t: ST.text, q, str, size, col, a }); },
      custom: (pos, fn, bias = 0) => { const q = cam.proj(pos); if (q) ents.push({ k: q[2] - 0.05 - bias, t: ST.custom, q, fn }); },
      dot: (pos, r, col, a = 1) => { const q = cam.proj(pos); if (q) ents.push({ k: q[2], t: ST.dot, q, r, col, a }); },
      line: (a, b, w, col, alpha = 1) => { let ca = cam.toCam(a), cb = cam.toCam(b); if (ca[2] < NEAR && cb[2] < NEAR) return; if (ca[2] < NEAR) { const q = (NEAR - ca[2]) / (cb[2] - ca[2]); ca = [ca[0] + (cb[0] - ca[0]) * q, ca[1] + (cb[1] - ca[1]) * q, NEAR]; } else if (cb[2] < NEAR) { const q = (NEAR - cb[2]) / (ca[2] - cb[2]); cb = [cb[0] + (ca[0] - cb[0]) * q, cb[1] + (ca[1] - cb[1]) * q, NEAR]; } const z = (ca[2] + cb[2]) / 2; ents.push({ k: z, t: ST.line, x0: W / 2 + (ca[0] / ca[2]) * F, y0: H / 2 - (ca[1] / ca[2]) * F, x1: W / 2 + (cb[0] / cb[2]) * F, y1: H / 2 - (cb[1] / cb[2]) * F, w: Math.max(1, (w * F) / z), col, alpha, z }); },
      beam: (top, floor, r, col, a) => { const q0 = cam.proj(top), q1 = cam.proj([floor[0] - r, floor[1], floor[2]]), q2 = cam.proj([floor[0] + r, floor[1], floor[2]]); if (q0 && q1 && q2) ents.push({ k: (q0[2] + q1[2]) / 2 - 0.5, t: ST.beam, q0, q1, q2, col, a }); },
    };
    const states = shot.actors.map((a) => actorAt(a, t, cam));
    const ctx = { t, u, p, e, add: adder, st: states, cam, S2, a: shot.a, b: shot.b };
    if (set.dyn) set.dyn(t, adder, S2, p, e);
    for (const gl of set.glows) adder.glow(gl.pos, gl.r, gl.col, gl.a);
    for (const tx of set.texts) adder.text(tx.pos, tx.str, tx.size, tx.col, 0.82 + 0.18 * p - (Math.sin(t * 23 + tx.pos[0]) > 0.94 ? 0.4 : 0));
    for (const ln of set.lines) adder.line(ln.a, ln.b, ln.w, ln.col, ln.alpha);
    if (shot.fx) shot.fx(ctx);
    for (const st of states) {
      if (st.alpha <= 0.01) continue; const q = cam.proj([st.x, st.y, st.z]); if (!q) continue;
      ents.push({ k: q[2], t: ST.sprite, q, st });
      const gq = cam.proj([st.x, 0.01, st.z]); if (gq) ents.push({ k: 1e7 - 9e4 - seq++ * 1e-3, t: ST.shadow, q: gq, a: st.alpha * 0.3 * clamp(1 - st.y) });
    }
    const pushFaces = (faces) => {
      for (let i = 0; i < faces.length; i++) {
        const f = faces[i], cp = cam.pos;
        if (!f.two && f.n[0] * (f.c[0] - cp[0]) + f.n[1] * (f.c[1] - cp[1]) + f.n[2] * (f.c[2] - cp[2]) >= 0) continue;
        let poly = f.pts.map(cam.toCam), cl = false; for (const q of poly) if (q[2] < NEAR) { cl = true; break; }
        if (cl) { poly = clipNear(poly); if (poly.length < 3) continue; }
        const n = poly.length, xy = new Array(n * 2); let zs = 0, minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9;
        for (let j = 0; j < n; j++) { const z = poly[j][2], x = W / 2 + (poly[j][0] / z) * F, y = H / 2 - (poly[j][1] / z) * F; xy[j * 2] = x; xy[j * 2 + 1] = y; zs += z; if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y; }
        if (maxx < 0 || minx > W || maxy < 0 || miny > H) continue;
        ents.push({ k: f.layer === 0 ? 1e7 - f.order * 1e4 - seq++ * 1e-3 : zs / n + f.bias, t: ST.face, f, xy, z: zs / n });
      }
    };
    pushFaces(set.faces); pushFaces(S2.faces);
    ents.sort((a, b) => b.k - a.k);
    const fogK = (z, emit) => clamp((z - set.fogNear) / (set.fogFar - set.fogNear)) * (emit ? 0.55 : 1), fg = set.fog;
    for (const en of ents) {
      switch (en.t) {
        case ST.face: {
          const f = en.f, xy = en.xy, base = f.colFn ? f.colFn(t, p, bi) : f.col, q = fogK(en.z, f.emit), r = base[0] + (fg[0] - base[0]) * q, gg = base[1] + (fg[1] - base[1]) * q, b = base[2] + (fg[2] - base[2]) * q, css = `rgb(${r | 0},${gg | 0},${b | 0})`;
          g.beginPath(); g.moveTo(xy[0], xy[1]); for (let j = 2; j < xy.length; j += 2) g.lineTo(xy[j], xy[j + 1]); g.closePath();
          if (f.alpha < 1) { g.globalAlpha = f.alpha; g.fillStyle = css; g.fill(); g.globalAlpha = 1; break; }
          g.fillStyle = css; g.fill(); g.strokeStyle = f.edge ? `rgb(${(r * 0.66) | 0},${(gg * 0.62) | 0},${(b * 0.7) | 0})` : css; g.lineWidth = f.edge ? 1.4 : 1; g.stroke(); break;
        }
        case ST.shadow: { const kk = en.q[3]; g.fillStyle = `rgba(0,0,0,${en.a})`; g.beginPath(); g.ellipse(en.q[0], en.q[1], 0.42 * kk, 0.42 * kk * clamp(Math.abs(cam.f[1]) + 0.12, 0.12, 0.6), 0, 0, 7); g.fill(); break; }
        case ST.sprite: {
          const st = en.st, cell = META.s[st.key]; if (!cell) break; const kk = en.q[3], sc = cellScale(st.key) * st.s * kk, wpx = cell[2] * sc, hpx = cell[3] * sc, tint = st.tint || set.tint;
          g.save(); g.globalAlpha = st.alpha; g.translate(en.q[0], en.q[1] - st.bounce * kk); g.rotate(st.lean); if (st.flip) g.scale(-1, 1); g.imageSmoothingEnabled = false;
          if (tint) { tg.globalCompositeOperation = 'source-over'; tg.clearRect(0, 0, 160, 180); tg.drawImage(env.atlas, cell[0], cell[1], cell[2], cell[3], 0, 0, cell[2], cell[3]); tg.globalCompositeOperation = 'source-atop'; tg.fillStyle = tint; tg.fillRect(0, 0, cell[2], cell[3]); g.drawImage(tmp, 0, 0, cell[2], cell[3], -wpx / 2, -hpx, wpx, hpx); }
          else g.drawImage(env.atlas, cell[0], cell[1], cell[2], cell[3], -wpx / 2, -hpx, wpx, hpx);
          g.restore(); break;
        }
        case ST.glow: { const R = en.r * en.q[3]; if (R < 1) break; const x = en.q[0], y = en.q[1], gr = g.createRadialGradient(x, y, 0, x, y, R); gr.addColorStop(0, rgb(en.col, en.a)); gr.addColorStop(1, rgb(en.col, 0)); g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(x - R, y - R, R * 2, R * 2); g.globalCompositeOperation = 'source-over'; break; }
        case ST.text: { const fs = en.size * en.q[3]; if (fs < 4) break; g.save(); g.globalAlpha = clamp(en.a); g.font = `${fs}px BG`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.shadowColor = en.col; g.shadowBlur = fs * 0.35; g.fillStyle = en.col; g.fillText(en.str, en.q[0], en.q[1]); g.shadowBlur = fs * 0.1; g.fillStyle = '#fff'; g.fillText(en.str, en.q[0], en.q[1]); g.restore(); break; }
        case ST.custom: g.save(); en.fn(g, en.q[0], en.q[1], en.q[3]); g.restore(); g.globalAlpha = 1; break;
        case ST.line: { const q = fogK(en.z, true), c = en.col; g.globalAlpha = en.alpha; g.strokeStyle = `rgb(${(c[0] + (fg[0] - c[0]) * q) | 0},${(c[1] + (fg[1] - c[1]) * q) | 0},${(c[2] + (fg[2] - c[2]) * q) | 0})`; g.lineWidth = en.w; g.lineCap = 'round'; g.beginPath(); g.moveTo(en.x0, en.y0); g.lineTo(en.x1, en.y1); g.stroke(); g.globalAlpha = 1; break; }
        case ST.dot: { const R = Math.max(0.8, en.r * en.q[3]); g.globalAlpha = en.a; g.fillStyle = rgb(en.col); g.beginPath(); g.arc(en.q[0], en.q[1], R, 0, 7); g.fill(); g.globalAlpha = 1; break; }
        case ST.beam: { g.globalCompositeOperation = 'lighter'; g.fillStyle = rgb(en.col, clamp(en.a)); g.beginPath(); g.moveTo(en.q0[0], en.q0[1]); g.lineTo(en.q1[0], en.q1[1]); g.lineTo(en.q2[0], en.q2[1]); g.closePath(); g.fill(); g.globalCompositeOperation = 'source-over'; break; }
      }
    }
    // 后期：雨、褪色、回忆暖光、倒带、HUD、暗角、字幕、转场
    if (set.rain) { g.strokeStyle = 'rgba(190,210,255,0.5)'; g.lineWidth = 1.5; g.beginPath(); for (let i = 0; i < 110; i++) { const x = (hash(i) * 1500 + t * -120 * (0.7 + hash(i + 3))) % 1400, y = ((hash(i + 50) * 800 + t * 1100 * (0.7 + hash(i + 9) * 0.6)) % 800) - 40; g.moveTo(x, y); g.lineTo(x - 5, y + 22); } g.stroke(); g.fillStyle = 'rgba(40,60,140,0.12)'; g.fillRect(0, 0, W, H); }
    if (shot.sepia) { const a = shot.sepia(u); g.globalCompositeOperation = 'saturation'; g.fillStyle = `rgba(128,128,128,${0.85 * a})`; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over'; g.fillStyle = `rgba(120,90,60,${0.22 * a})`; g.fillRect(0, 0, W, H); }
    if (shot.warm) { const wg = g.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 760); wg.addColorStop(0, 'rgba(255,240,210,0.05)'); wg.addColorStop(1, 'rgba(255,236,200,0.75)'); g.fillStyle = wg; g.fillRect(0, 0, W, H); }
    if (shot.rewind) { g.fillStyle = 'rgba(255,255,255,0.07)'; for (let y = (t * 300) % 14; y < H; y += 14) g.fillRect(0, y, W, 3); tag(g, '◀◀ 倒带', 60, 70, 34); }
    if (shot.hud) shot.hud(g, ctx);
    if (shot.film) { g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(0, 0, W, 54); g.fillRect(0, H - 54, W, 54); tag(g, shot.film, 60, 104, 34); }
    const vg = g.createRadialGradient(W / 2, H / 2, 280, W / 2, H / 2, 840); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(10,0,30,${0.42 - 0.1 * p})`); g.fillStyle = vg; g.fillRect(0, 0, W, H);
    if (shot.flash && p > 0.6) { g.fillStyle = '#fff'; g.globalAlpha = 0.07 * p; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
    if (opts.subtitles !== false) drawSubtitle(g, t);
    const fin = clamp(u / 0.2); if (fin < 1 && t > T0 + 0.5) { g.fillStyle = '#000'; g.globalAlpha = (1 - fin) * 0.6; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
    if (t < T0 + 0.5) { g.fillStyle = '#000'; g.globalAlpha = 1 - (t - T0) / 0.5; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
    if (t > 214.2) { g.fillStyle = '#000'; g.globalAlpha = clamp((t - 214.2) / 0.75); g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
    return { shot: shot.name, ents: ents.length };
  }
  return { render };
}
