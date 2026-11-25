// @ts-nocheck
// 《樱花草》MV —— 软件 3D 引擎（Canvas2D 画家算法），引擎骨架沿用仓库《坏女孩》Fable 版。
// 同一份 render(ctx, t) 既在网页里实时预览，也能逐帧导出；同一个 t 永远是同一帧。
import CUES from './cues.json';
// 画面语法沿用项目「通用模板」：低多边形卡通 3D 世界 + 项目自带像素角色当纸片人 + 金边字幕条。
import META from './cast_atlas.json';
import BEATS from './beats.json';

export const W = 1280, H = 720, FPS = 30, T0 = 0, DUR = 277.5;
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

const SEASONS = {
  spring: { sky: ['#8ecbff', '#d9efff', '#ffe3ef'], fog: [214, 232, 246], grass: 0x8fd97a, path: 0xead9b8, crowns: [0xffb7d1, 0xff9bbf, 0xffd3e3], tint: null, part: [255, 194, 218], light: [0.4, 0.8, 0.45], hills: [0x79b98a, 0x6aa9c9] },
  summer: { sky: ['#3fb4ff', '#9fe0ff', '#e8fbff'], fog: [200, 236, 250], grass: 0x58c46a, path: 0xf1d9a0, crowns: [0x2fa34f, 0x3fbf62, 0x27883f], tint: null, part: null, light: [0.3, 0.9, 0.3], hills: [0x4fae6a, 0x5f9fd0] },
  autumn: { sky: ['#ff9a5a', '#ffc98a', '#ffe9c4'], fog: [250, 214, 170], grass: 0xc9a04c, path: 0xe7c18a, crowns: [0xf08a24, 0xd9541e, 0xf2b134], tint: 'rgba(255,150,60,0.10)', part: [232, 116, 42], light: [-0.5, 0.6, 0.5], hills: [0xc98a4c, 0xb0705a] },
  winter: { sky: ['#7fa6cc', '#c3d8ea', '#eef6fc'], fog: [226, 236, 246], grass: 0xf2f6fb, path: 0xd5e2ee, crowns: [0xffffff], tint: 'rgba(170,200,255,0.12)', part: [255, 255, 255], light: [0.3, 0.8, 0.5], hills: [0xdfe9f2, 0xc3d3e6] },
};

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

// ======================================================================
// 《樱花草》—— 逐字卡点 / 布景 / 分镜
// 时间一律是原曲时间（秒）。卡点来自 src/mv/cues.json：逐句、逐字实测（whisper 字级时间戳 + 人工校对），
// 每个字有自己的起唱时间 t[j]，每个词（words）有自己的起点，镜头在起唱前 0.1 秒切换。
// ======================================================================
export const CUE = CUES;
const CS = (i) => CUE[i].start;
const CE = (i) => CUE[i].end;
const CUT = (i) => CUE[i].start - 0.1;
const CT = (i, j) => CUE[i].t[Math.max(0, Math.min(j, CUE[i].t.length - 1))];
const WT = (i, w) => CUE[i].t[CUE[i].words[Math.min(w, CUE[i].words.length - 1)][1]];
export const LINES = CUE.map((p) => ({ start: p.start, end: p.end, text: p.text, sec: p.sec }));

// ---------- 小道具 / 特效（世界坐标） ----------
const PINKS = [[255, 140, 190], [255, 186, 214], [214, 150, 245], [255, 255, 255], [255, 120, 160]];
function flowerAt(add, pos, s, col, open = 1, glow = 0) {
  if (open <= 0.01) return;
  const o = Math.min(1, open);
  add.line([pos[0], 0, pos[2]], [pos[0], pos[1] * o, pos[2]], 0.022, [84, 160, 90]);
  add.custom([pos[0], pos[1] * o, pos[2]], (g, x, y, k) => {
    const r = s * k * (open > 1 ? open : o); if (r < 0.7) return;
    if (glow > 0) { g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(x, y, 0, x, y, r * 4); gr.addColorStop(0, rgb(col, 0.55 * glow)); gr.addColorStop(1, rgb(col, 0)); g.fillStyle = gr; g.fillRect(x - r * 4, y - r * 4, r * 8, r * 8); g.globalCompositeOperation = 'source-over'; }
    g.fillStyle = rgb(col); for (let i = 0; i < 5; i++) { const a = i * 1.2566 - 1.5708; g.beginPath(); g.arc(x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, r * 0.5, 0, 7); g.fill(); }
    g.fillStyle = 'rgba(255,255,255,0.35)'; g.beginPath(); g.arc(x - r * 0.25, y - r * 0.55, r * 0.22, 0, 7); g.fill();
    g.fillStyle = '#ffe680'; g.beginPath(); g.arc(x, y, r * 0.3, 0, 7); g.fill();
  });
}
function bouquet(add, pos, s, t) { for (let i = 0; i < 5; i++) { const a = i * 1.2566 + 0.3; flowerAt(add, [pos[0] + Math.cos(a) * 0.09 * s, pos[1] + 0.05 * Math.sin(a * 2) * s, pos[2] + Math.sin(a) * 0.05], 0.06 * s, PINKS[i % 4], 1.0 + 0.04 * Math.sin(t * 4 + i)); } }
const coin3 = (add, pos, s, spin, a = 1) => add.custom(pos, (g, x, y, k) => { const r = s * k; if (r < 0.8) return; const w = Math.abs(Math.cos(spin)) * r + 0.6; g.globalAlpha = a; g.fillStyle = '#ffd84a'; g.beginPath(); g.ellipse(x, y, w, r, 0, 0, 7); g.fill(); g.strokeStyle = '#c4801a'; g.lineWidth = Math.max(1, r * 0.16); g.stroke(); if (w > r * 0.35) { g.fillStyle = '#b06a12'; g.fillRect(x - w * 0.24, y - r * 0.24, w * 0.48, r * 0.48); } g.globalAlpha = 1; });
const moonDisc = (add, pos, R, crescent = false) => add.custom(pos, (g, x, y, k) => {
  const r = R * k; g.save(); const gl = g.createRadialGradient(x, y, r * 0.6, x, y, r * 3.4); gl.addColorStop(0, 'rgba(255,248,215,0.38)'); gl.addColorStop(1, 'rgba(255,248,215,0)'); g.fillStyle = gl; g.fillRect(x - r * 3.4, y - r * 3.4, r * 6.8, r * 6.8);
  g.beginPath(); g.arc(x, y, r, 0, 7); g.clip(); g.fillStyle = '#fff5d6';
  if (crescent) { g.beginPath(); g.arc(x, y, r, 0, 7); g.arc(x + r * 0.52, y - r * 0.22, r * 0.9, 0, 7, true); g.fill(); }
  else { g.fillRect(x - r, y - r, 2 * r, 2 * r); g.fillStyle = 'rgba(214,204,168,0.55)'; for (const [dx, dy, rr] of [[-0.3, -0.2, 0.2], [0.25, 0.3, 0.13], [0.38, -0.35, 0.1], [-0.1, 0.45, 0.08]]) { g.beginPath(); g.arc(x + dx * r, y + dy * r, rr * r, 0, 7); g.fill(); } }
  g.restore();
});
const ring3 = (c, pos, t0, col = [255, 240, 200], dur = 1.3, R = 1.6, flat = 0.3) => { const u = (c.t - t0) / dur; if (u < 0 || u > 1) return; c.add.custom(pos, (g, x, y, k) => { g.strokeStyle = rgb(col, (1 - u) * 0.9); g.lineWidth = Math.max(1, 0.05 * k * (1 - u * 0.5)); g.beginPath(); g.ellipse(x, y, R * u * k, R * u * k * flat, 0, 0, 7); g.stroke(); }); };
const note3 = (c, pos, t0, col = [255, 220, 240], dur = 1.6) => { const u = (c.t - t0) / dur; if (u < 0 || u > 1) return; c.add.custom([pos[0] + Math.sin(u * 6) * 0.2, pos[1] + u * 1.1, pos[2]], (g, x, y, k) => { const s = 0.12 * k; g.globalAlpha = 1 - u; g.fillStyle = rgb(col); g.strokeStyle = rgb(col); g.lineWidth = Math.max(1, s * 0.22); g.beginPath(); g.ellipse(x, y, s * 0.55, s * 0.4, -0.4, 0, 7); g.fill(); g.beginPath(); g.moveTo(x + s * 0.48, y); g.lineTo(x + s * 0.48, y - s * 1.6); g.quadraticCurveTo(x + s * 1.1, y - s * 1.2, x + s * 0.9, y - s * 0.7); g.stroke(); g.globalAlpha = 1; }); };
const frog3 = (add, pos, s, croak, flip = false) => add.custom(pos, (g, x, y, k) => { const r = s * k; if (r < 1) return; g.save(); g.translate(x, y); if (flip) g.scale(-1, 1); g.fillStyle = '#5fbf5a'; g.beginPath(); g.ellipse(0, -r * 0.5, r * 0.9, r * 0.6, 0, 0, 7); g.fill(); g.fillStyle = '#4aa448'; g.beginPath(); g.ellipse(-r * 0.6, -r * 0.15, r * 0.4, r * 0.22, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(r * 0.6, -r * 0.15, r * 0.4, r * 0.22, 0, 0, 7); g.fill(); g.fillStyle = '#5fbf5a'; for (const sx of [-0.38, 0.38]) { g.beginPath(); g.arc(sx * r, -r * 1.05, r * 0.26, 0, 7); g.fill(); } g.fillStyle = '#fff'; for (const sx of [-0.38, 0.38]) { g.beginPath(); g.arc(sx * r, -r * 1.07, r * 0.17, 0, 7); g.fill(); } g.fillStyle = '#1a2a1a'; for (const sx of [-0.38, 0.38]) { g.beginPath(); g.arc(sx * r + r * 0.04, -r * 1.07, r * 0.09, 0, 7); g.fill(); } if (croak > 0.02) { g.fillStyle = 'rgba(255,240,200,0.92)'; g.beginPath(); g.ellipse(0, -r * 0.28, r * 0.42 * (0.4 + croak), r * 0.32 * (0.4 + croak), 0, 0, 7); g.fill(); } g.restore(); });
const lantern3 = (add, pos, s, a = 1) => add.custom(pos, (g, x, y, k) => { const r = s * k; if (r < 0.8) return; g.globalAlpha = a; g.globalCompositeOperation = 'lighter'; const gr = g.createRadialGradient(x, y, 0, x, y, r * 3); gr.addColorStop(0, 'rgba(255,190,110,0.55)'); gr.addColorStop(1, 'rgba(255,150,80,0)'); g.fillStyle = gr; g.fillRect(x - r * 3, y - r * 3, r * 6, r * 6); g.globalCompositeOperation = 'source-over'; g.fillStyle = '#ffb35c'; g.beginPath(); g.roundRect(x - r * 0.55, y - r * 0.75, r * 1.1, r * 1.5, r * 0.35); g.fill(); g.fillStyle = '#fff1c8'; g.beginPath(); g.roundRect(x - r * 0.3, y - r * 0.5, r * 0.6, r * 1.0, r * 0.25); g.fill(); g.globalAlpha = 1; });
const firefly = (add, pos, a, big = 1) => { if (a < 0.03) return; add.glow(pos, 0.42 * big, [190, 255, 120], 0.55 * a); add.dot(pos, 0.035 * big, [240, 255, 190], Math.min(1, a * 1.2)); };
const petalBurst = (c, pos, t0, n = 10, col = [255, 170, 205]) => { const u = c.t - t0; if (u < 0 || u > 1.2) return; for (let i = 0; i < n; i++) { const a = (i / n) * 6.2832 + t0; c.add.custom([pos[0] + Math.cos(a) * u * 0.9, pos[1] + Math.sin(a) * u * 0.7 - u * u * 0.3, pos[2]], (g, x, y, k) => { const s = 0.07 * k; g.globalAlpha = 1 - u / 1.2; g.fillStyle = rgb(PINKS[i % 4]); g.save(); g.translate(x, y); g.rotate(u * 5 + i); g.beginPath(); g.ellipse(0, 0, s, s * 0.55, 0, 0, 7); g.fill(); g.restore(); g.globalAlpha = 1; }); } };
const bigHeart3 = (c, pos, s, col = [255, 92, 158], a = 1) => c.add.custom(pos, (g, x, y, k) => { g.globalAlpha = a; g.fillStyle = rgb(col); g.shadowColor = rgb(col); g.shadowBlur = 0.2 * k; heart(g, x, y, s * k); g.shadowBlur = 0; g.fillStyle = 'rgba(255,255,255,0.45)'; g.beginPath(); g.arc(x - s * k * 0.45, y - s * k * 0.45, s * k * 0.18, 0, 7); g.fill(); g.globalAlpha = 1; });
function scroll3(c, pos, open, t) {
  c.add.custom(pos, (g, x, y, k) => {
    const w = 1.5 * k * open, h = 0.9 * k; if (w < 2) return; g.save();
    g.fillStyle = '#f6e6c2'; g.fillRect(x - w / 2, y - h / 2, w, h); g.strokeStyle = '#c9a46a'; g.lineWidth = Math.max(1, 0.02 * k); g.strokeRect(x - w / 2, y - h / 2, w, h);
    g.fillStyle = '#8a5a3a'; for (const sx of [-1, 1]) g.fillRect(x + sx * w / 2 - 0.04 * k, y - h / 2 - 0.06 * k, 0.08 * k, h + 0.12 * k);
    g.beginPath(); g.rect(x - w / 2, y - h / 2, w, h); g.clip();
    // 画：两颗星，中间一座喜鹊搭起的桥
    g.fillStyle = 'rgba(40,40,110,0.85)'; g.fillRect(x - 0.7 * k, y - 0.38 * k, 1.4 * k, 0.76 * k);
    const star = (sx, sy, r) => { g.fillStyle = '#fff3a8'; g.beginPath(); for (let i = 0; i < 10; i++) { const a = i * 0.6283 - 1.5708, rr = i % 2 ? r * 0.45 : r; g.lineTo(sx + Math.cos(a) * rr, sy + Math.sin(a) * rr); } g.fill(); };
    star(x - 0.5 * k, y - 0.08 * k, 0.1 * k * (1 + 0.1 * Math.sin(t * 5))); star(x + 0.5 * k, y - 0.08 * k, 0.1 * k * (1 + 0.1 * Math.cos(t * 5)));
    g.strokeStyle = '#ffffff'; g.lineWidth = Math.max(1, 0.012 * k);
    for (let i = 0; i < 9; i++) { const u = i / 8, bx = x + (-0.36 + u * 0.72) * k, by = y + (0.05 - Math.sin(u * Math.PI) * 0.22) * k, s = 0.04 * k; g.beginPath(); g.moveTo(bx - s, by - s * 0.4); g.quadraticCurveTo(bx - s * 0.4, by - s, bx, by); g.quadraticCurveTo(bx + s * 0.4, by - s, bx + s, by - s * 0.4); g.stroke(); }
    g.restore();
  });
}

// ---------- 布景 ----------
const BAMBOO = (() => { const r = rnd(77), out = []; for (let i = 0; i < 80; i++) { const side = r() < 0.78 ? -1 : 1, x = -34 + r() * 68, z = side < 0 ? -2.2 - r() * 14 : 2.6 + r() * 6; if (Math.abs(x) < 1.5 && side > 0) continue; out.push({ x, z, h: 6 + r() * 6, ph: r() * 6.28, g: 0.75 + r() * 0.4 }); } return out; })();
function setBamboo() {
  const S = new Set3({ sky: ['#0a1238', '#1b3566', '#3d6d8c'], fog: [22, 44, 72], fogNear: 12, fogFar: 64, light: [-0.3, 0.8, 0.5], amb: 0.58, tint: 'rgba(90,130,255,0.13)', stars: 70 });
  S.ground(-200, -200, 200, 60, C(0x1d3a2b), { nx: 10, nz: 8 });
  S.ground(-60, -1.1, 60, 1.1, C(0x58666c), { order: 1, nx: 12 });
  for (let x = -30; x <= 30; x += 1.6) S.box(x + Math.sin(x) * 0.2, 0, Math.cos(x * 1.7) * 0.35, 0.8, 0.06, 0.55, C(0x8a979b), { bias: -0.3 });
  for (const x of [-9, 6, 21, -24]) { S.box(x, 0, -1.6, 0.45, 0.8, 0.45, C(0x6f7a80)); S.box(x, 0.8, -1.6, 0.6, 0.45, 0.6, [255, 214, 140], { emit: true }); S.gable(x, 1.25, -1.6, 0.8, 0.35, 0.8, C(0x4a5458)); S.glows.push({ pos: [x, 1.05, -1.6], r: 1.6, col: [255, 200, 120], a: 0.55 }); }
  S.box(0, 0, -7, 1.6, 0.55, 1.2, C(0x55606a)); // 月下的石台
  farHills(S, [0x16304a, 0x1d3a55], 12);
  S.dyn = (t, add, S2, p, e, shot) => {
    const wind = shot && shot.wind ? shot.wind(t) : 0.25;
    moonDisc(add, [-26, 30, -110], 6.5);
    for (const b of BAMBOO) {
      const sw = (Math.sin(t * 1.3 + b.ph) * 0.22 + Math.sin(t * 2.7 + b.ph * 2) * 0.06) * (0.6 + wind * 2.2);
      const col = [60 * b.g, 135 * b.g, 88 * b.g]; let px = b.x, py = 0;
      for (let s = 1; s <= 4; s++) { const yy = (b.h * s) / 4, xx = b.x + sw * (s / 4) * (s / 4) * 2.2; add.line([px, py, b.z], [xx, yy, b.z], 0.12 - s * 0.012, col); px = xx; py = yy; }
      for (let l = 0; l < 3; l++) { const ly = b.h * (0.62 + l * 0.14), lx = b.x + sw * (0.62 + l * 0.14) ** 2 * 2.2, d = l % 2 ? 1 : -1; add.line([lx, ly, b.z], [lx + d * (0.9 + wind * 0.4), ly - 0.35 + sw * 0.3, b.z], 0.07, [84 * b.g, 170 * b.g, 104 * b.g]); }
    }
    for (let i = 0; i < 14; i++) { const x = -12 + ((i * 5.7 + t * 0.6) % 24), y = 0.6 + ((i * 1.37) % 2.6) + Math.sin(t * 1.5 + i) * 0.25; firefly(add, [x, y, -1.5 - (i % 5) * 1.6], 0.5 + 0.5 * Math.sin(t * 3 + i * 1.7)); }
  };
  return S;
}
function setHill() {
  const S = new Set3({ sky: ['#080c2a', '#1c2356', '#3a3e7c'], fog: [30, 36, 82], fogNear: 18, fogFar: 110, light: [0.3, 0.8, 0.4], amb: 0.55, tint: 'rgba(70,90,200,0.14)', stars: 110 });
  S.ground(-220, -220, 220, 60, C(0x22412f), { nx: 10, nz: 8 });
  S.ground(-40, -0.9, 40, 0.9, C(0x6b6448), { order: 1, nx: 10 });
  const r = rnd(5);
  for (let i = 0; i < 9; i++) S.blob(-40 + i * 10 + r() * 4, 0, -16 - r() * 20, 7 + r() * 5, 3 + r() * 3.5, 6, C([0x2a5a3a, 0x24503a, 0x2f6442][i % 3]), { hemi: true, seed: 40 + i, lat: 3, lon: 8 });
  for (const [x, z, s, sd] of [[-6, -4.5, 1.4, 1], [7.5, -5, 1.6, 2], [-14, -7, 1.7, 3], [15, -8, 1.5, 4], [2, -10, 1.3, 5]]) tree(S, x, z, s, 0x3b2a35, [0x2c5a40, 0x356a4a, 0x264d38], sd);
  // 山上的小鸟居
  S.cyl(3.4, 0, -3.4, 0.11, 2.3, 6, C(0xd2483c)); S.cyl(5.4, 0, -3.4, 0.11, 2.3, 6, C(0xd2483c)); S.box(4.4, 2.3, -3.4, 2.9, 0.18, 0.28, C(0xd2483c)); S.box(4.4, 1.85, -3.4, 2.3, 0.12, 0.18, C(0xd2483c));
  farHills(S, [0x1c2c55, 0x23356a], 7);
  S.dyn = (t, add, S2, p, e, shot) => {
    moonDisc(add, [30, 34, -120], 5.2);
    const fl = shot && shot.flash3 ? shot.flash3(t) : 0;
    for (let i = 0; i < 70; i++) { const bx = -16 + hash(i) * 32, bz = -1 - hash(i + 9) * 12, x = bx + Math.sin(t * 0.5 + i) * 0.8, y = 0.4 + hash(i + 3) * 2.8 + Math.sin(t * 0.8 + i * 2) * 0.3, z = bz + Math.cos(t * 0.4 + i) * 0.5; const blink = 0.5 + 0.5 * Math.sin(t * (2 + hash(i + 5) * 2) + i * 3); firefly(add, [x, y, z], clamp(blink * 0.8 + fl), 1 + fl * 0.8); }
    if (shot && shot.coins) { const a0 = shot.coins; for (let i = 0; i < 46; i++) { const st = a0 + hash(i + 70) * 1.6, u = t - st; if (u < 0) continue; const x = -12 + hash(i + 40) * 24, z = -0.5 - hash(i + 41) * 10, y = 0.2 + u * (0.7 + hash(i) * 0.5) + Math.sin(u * 2 + i) * 0.15; if (y > 7) continue; coin3(add, [x + Math.sin(u + i) * 0.3, y, z], 0.13, u * 5 + i, clamp(u * 3)); } }
  };
  return S;
}
const MILKY = (() => { const r = rnd(33), pts = []; for (let i = 0; i < 380; i++) { const s = r(), a = -1.5 + 3.0 * s, el = 0.16 + 0.34 * Math.sin(Math.PI * s) + 0.22 * (s - 0.5) + (r() - 0.5) * 0.12 * (1 + Math.sin(i * 0.7)), R = 150; pts.push({ p: [R * Math.cos(el) * Math.sin(a), R * Math.sin(el), -R * Math.cos(el) * Math.cos(a)], r: 0.25 + r() * 0.55, c: r() < 0.5 ? [220, 210, 255] : [255, 220, 240], tw: r() * 6 }); } return pts; })();
const VEGA = [42, 78, -118], ALTAIR = [-48, 62, -120];
function setGalaxy() {
  const S = new Set3({ sky: ['#04071a', '#10184a', '#2a2a6a'], fog: [22, 24, 64], fogNear: 30, fogFar: 160, light: [0.2, 0.8, 0.5], amb: 0.55, tint: 'rgba(80,90,220,0.15)', stars: 160 });
  S.ground(-220, -220, 220, 60, C(0x1d3a3c), { nx: 10, nz: 8 });
  S.ground(-30, -0.8, 30, 0.8, C(0x4f5a56), { order: 1, nx: 8 });
  // 风铃亭
  for (const [dx, dz] of [[-1.1, -0.9], [1.1, -0.9], [-1.1, 0.9], [1.1, 0.9]]) S.box(5 + dx, 0, -3.5 + dz, 0.18, 2.5, 0.18, C(0xb5473c));
  S.box(5, 0, -3.5, 2.8, 0.18, 2.4, C(0x7a5a48)); S.gable(5, 2.5, -3.5, 3.0, 0.9, 2.7, C(0x2f3f6a));
  for (const [x, z, s, sd] of [[-7, -5, 1.5, 1], [-12, -8, 1.7, 2], [12, -7, 1.6, 3]]) tree(S, x, z, s, 0x3b2a35, [0x24504a, 0x2c5a50, 0x1f463f], sd);
  const r = rnd(8); for (let i = 0; i < 40; i++) { const x = -14 + r() * 28, z = -1.2 - r() * 9; S.blob(x, 0, z, 0.12, 0.1, 0.12, [[255, 160, 200], [210, 160, 255], [255, 255, 255]][i % 3], { emit: true, lat: 2, lon: 5, seed: i }); }
  farHills(S, [0x182a50, 0x1f3060], 9);
  S.dyn = (t, add, S2, p, e, shot) => {
    const gl = shot && shot.galaxy ? shot.galaxy(t) : 0.6;
    for (let i = 0; i < MILKY.length; i++) { const m = MILKY[i]; add.dot(m.p, m.r * (0.8 + gl * 0.5), m.c, clamp((0.35 + 0.5 * Math.sin(t * 2 + m.tw)) * (0.4 + gl))); }
    for (let i = 0; i < 19; i++) { const m = MILKY[i * 20]; add.glow(m.p, 20, i % 2 ? [150, 130, 255] : [255, 160, 210], 0.1 + gl * 0.12); }
    const vg = shot && shot.vega ? shot.vega(t) : 0;
    add.glow(VEGA, 6 + vg * 10, [200, 230, 255], 0.75 + 0.2 * Math.sin(t * 4)); add.dot(VEGA, 1.1 + vg * 0.8, [255, 255, 255], 1);
    add.glow(ALTAIR, 5, [255, 220, 200], 0.6); add.dot(ALTAIR, 0.9, [255, 250, 240], 1);
    const ring = shot && shot.chime ? shot.chime(t) : 0;
    for (let i = 0; i < 6; i++) { const ex = 5 - 1.35 + i * 0.54, ez = -3.5 + 1.35, sw = Math.sin(t * 2.4 + i) * (0.12 + ring * 0.5), tx = ex + Math.sin(sw) * 0.7, ty = 2.5 - Math.cos(sw) * 0.7; add.line([ex, 2.5, ez], [tx, ty, ez], 0.015, [230, 230, 240]); add.line([tx, ty, ez], [tx, ty - 0.22, ez], 0.06, [255, 214, 120]); if (ring > 0.2) add.glow([tx, ty - 0.1, ez], 0.5, [255, 230, 160], ring * 0.5); }
  };
  return S;
}
function setCreek(season) {
  const Q = SEASONS[season], S = new Set3({ sky: Q.sky, fog: Q.fog, fogNear: 30, fogFar: 180, light: Q.light, amb: 0.68, tint: Q.tint });
  S.ground(-220, -220, 220, 60, C(Q.grass), { nx: 10, nz: 8 });
  S.ground(-80, -4.4, 80, -2.4, season === 'winter' ? [200, 225, 245] : [92, 170, 220], { order: 1, nx: 16, emit: true });
  S.ground(-80, -0.8, 80, 0.8, C(Q.path), { order: 1, nx: 16 });
  S.box(7, 0.3, -3.4, 2.4, 0.14, 2.8, C(0x9c6f4c)); S.box(5.9, 0.44, -3.4, 0.08, 0.5, 2.8, C(0x7a5236)); S.box(8.1, 0.44, -3.4, 0.08, 0.5, 2.8, C(0x7a5236));
  bench(S, 0, -1.4, 0x9c6f4c);
  [[-4, -6.5, 1.6], [4, -7, 1.7], [-11, -6, 1.5], [12, -6.5, 1.6], [-18, -8, 1.8], [19, -8, 1.6], [-6, 4.5, 1.6], [9, 5, 1.5]].forEach(([x, z, s], i) => season === 'winter' ? pine(S, x, z, s * 1.2, 0x2e6b52) : tree(S, x, z, s, 0x6b4a3a, Q.crowns, 60 + i));
  farHills(S, Q.hills, 15); clouds(S, [255, 255, 255], 31, 6); S.glows.push({ pos: [-30, 60, -170], r: 30, col: [255, 250, 215], a: 0.8 });
  S.dyn = (t, add) => {
    for (let i = 0; i < 30; i++) { const x = -30 + ((i * 7.1 + t * 2.2) % 60), z = -2.6 - ((i * 3.7) % 1.7); add.line([x, 0.02, z], [x + 0.9, 0.02, z], 0.05, [255, 255, 255], season === 'winter' ? 0.3 : 0.7); }
    if (Q.part) drift(add, t, 50, Q.part, [-14, 28, -5, 6, 10], season === 'winter' ? 0.9 : 0.7, season === 'autumn' ? -0.6 : 0.4, season === 'winter' ? 0.045 : 0.055, 31);
    if (season === 'summer') for (let i = 0; i < 10; i++) firefly(add, [-6 + i * 1.3, 0.8 + Math.sin(t * 2 + i) * 0.3, -2.2 - (i % 3)], 0.4 + 0.4 * Math.sin(t * 4 + i));
  };
  return S;
}
const GARDEN = {
  day: { sky: ['#8ccaff', '#ffd6e8', '#fff0f5'], fog: [255, 226, 238], amb: 0.7, tint: null, light: [0.4, 0.8, 0.45], grass: 0x92d27c, stars: 0 },
  dusk: { sky: ['#3d3a8c', '#e8718d', '#ffc38a'], fog: [226, 142, 140], amb: 0.64, tint: 'rgba(255,130,110,0.12)', light: [-0.35, 0.7, 0.6], grass: 0x9a9a6a, stars: 0 },
  night: { sky: ['#0b0f30', '#28205c', '#5a3a7a'], fog: [40, 30, 72], amb: 0.56, tint: 'rgba(110,90,255,0.15)', light: [0.2, 0.85, 0.45], grass: 0x2f4a3a, stars: 90 },
};
function setGarden(mode) {
  const Q = GARDEN[mode], S = new Set3({ sky: Q.sky, fog: Q.fog, fogNear: 30, fogFar: 170, light: Q.light, amb: Q.amb, tint: Q.tint, stars: Q.stars });
  S.ground(-220, -220, 220, 60, C(Q.grass), { nx: 10, nz: 8 });
  S.ground(-80, -1.0, 80, 1.0, C(0xead9b8), { order: 1, nx: 16 });
  S.box(0, 0, -2.85, 5.2, 0.28, 2.0, C(0x8a5a3a)); S.box(0, 0.28, -2.85, 4.9, 0.01, 1.7, C(0x5a3a2a), { noTop: false });
  for (const [x, z, s, sd] of [[-5.5, -4.5, 1.7, 1], [5.8, -4.8, 1.8, 2], [-10, -3.2, 1.6, 3], [10.5, -3.6, 1.7, 4], [-16, -6, 1.8, 5], [16, -6.5, 1.7, 6], [-3, -11, 1.6, 7], [4, -12, 1.9, 8]]) tree(S, x, z, s, 0x5a3a45, [0xffb7d1, 0xff9bbf, 0xffd3e3], sd);
  for (let x = -40; x <= 40; x += 2) if (Math.abs(x) > 3) S.box(x, 0, -6.2, 0.12, 0.7, 0.12, C(0xfaf3e6));
  for (let x = -40; x < 40; x += 4) S.line([x, 0.55, -6.2], [x + 4, 0.55, -6.2], 0.07, C(0xfaf3e6));
  bench(S, 5, -1.6, 0x9c6f4c);
  const r = rnd(21); for (let i = 0; i < 70; i++) { const x = -18 + r() * 36, z = r() < 0.5 ? -4 - r() * 6 : 1.4 + r() * 4; if (Math.abs(x) < 2.8 && z < -1.5 && z > -4) continue; S.blob(x, 0.08, z, 0.13, 0.09, 0.13, PINKS[i % 5], { emit: mode !== 'night', lat: 2, lon: 5, seed: i }); }
  if (mode === 'night') { for (const x of [-7.5, 7.5, -13, 13]) lamp(S, x, -1.6, 2.6, [255, 196, 130]); }
  house(S, -9, -14, 5, 3.4, 4.4, 0xf2e6c8, 0xd8433c, 0.2); house(S, 11, -16, 4.6, 3.0, 4, 0xf2b8c6, 0x3f6fb5, -0.3);
  farHills(S, mode === 'night' ? [0x1c2c55, 0x23356a] : [0x79b98a, 0x9ac9a9], 5); if (mode !== 'night') clouds(S, mode === 'dusk' ? C(0xffd0c8) : [255, 255, 255], 30, 8);
  S.glows.push(mode === 'dusk' ? { pos: [16, 9, -170], r: 40, col: [255, 226, 180], a: 0.9 } : mode === 'day' ? { pos: [-30, 60, -170], r: 30, col: [255, 250, 215], a: 0.8 } : { pos: [0, 0, 0], r: 0, col: [0, 0, 0], a: 0 });
  S.dyn = (t, add) => {
    drift(add, t, mode === 'night' ? 26 : 46, [255, 194, 218], [-12, 24, -4, 5.5, 9], 0.6, 0.45, 0.05, 3);
    if (mode === 'night') { moonDisc(add, [-24, 36, -120], 5.5); for (let i = 0; i < 26; i++) firefly(add, [-10 + hash(i) * 20 + Math.sin(t * 0.6 + i), 0.5 + hash(i + 1) * 2 + Math.sin(t + i) * 0.2, -1.5 - hash(i + 2) * 6], 0.5 + 0.5 * Math.sin(t * 3 + i)); }
  };
  return S;
}
function setMeadow(mode) {
  const night = mode === 'night', S = new Set3({ sky: night ? ['#060a26', '#1c1f55', '#3c2f72'] : ['#2f2a7a', '#c76a9a', '#ffb48a'], fog: night ? [28, 30, 74] : [214, 130, 150], fogNear: 26, fogFar: 160, light: [-0.3, 0.75, 0.55], amb: 0.6, tint: night ? 'rgba(100,90,255,0.15)' : 'rgba(255,140,120,0.1)', stars: night ? 120 : 20 });
  S.ground(-220, -220, 220, 60, C(night ? 0x24433a : 0x8a9a62), { nx: 10, nz: 8 });
  for (let i = 0; i < 24; i++) { const a = (i / 24) * 6.2832; S.blob(Math.cos(a) * 3.6, 0.08, -1.5 + Math.sin(a) * 2.2, 0.16, 0.1, 0.16, PINKS[i % 5], { emit: true, lat: 2, lon: 5, seed: i }); }
  tree(S, 0, -9, 2.6, 0x5a3a45, [0xffb7d1, 0xff9bbf, 0xffd3e3], 9); tree(S, -11, -7, 1.7, 0x5a3a45, [0xffb7d1, 0xff9bbf], 10); tree(S, 11, -8, 1.8, 0x5a3a45, [0xffd3e3, 0xff9bbf], 11);
  farHills(S, night ? [0x182a50, 0x1f3060] : [0x7a6aa8, 0x9a7ab0], 4);
  if (!night) S.glows.push({ pos: [-10, 8, -170], r: 42, col: [255, 214, 170], a: 0.9 });
  S.dyn = (t, add, S2, p, e, shot) => {
    drift(add, t, 30, [255, 194, 218], [-10, 20, -4, 5, 8], 0.5, 0.4, 0.05, 7);
    for (let i = 0; i < (night ? 50 : 18); i++) firefly(add, [-9 + hash(i) * 18 + Math.sin(t * 0.7 + i), 0.4 + hash(i + 4) * 2.6 + Math.sin(t * 1.2 + i) * 0.3, 1 - hash(i + 8) * 9], 0.45 + 0.45 * Math.sin(t * 3.3 + i * 2));
    if (night) moonDisc(add, [20, 40, -130], 5);
    if (shot && shot.lanterns) { const a0 = shot.lanterns; for (let i = 0; i < 26; i++) { const st = a0 + hash(i + 300) * 3.2, u = t - st; if (u < 0) continue; const x = -6 + hash(i + 301) * 12 + Math.sin(u * 0.8 + i) * 0.4, z = -1 - hash(i + 302) * 6, y = 0.9 + u * (0.55 + hash(i + 303) * 0.3); lantern3(add, [x, y, z], 0.17, clamp(u * 2)); } }
  };
  return S;
}
function setPond() {
  const S = new Set3({ sky: ['#2b2d6e', '#c9628a', '#ffb27a'], fog: [214, 128, 128], fogNear: 26, fogFar: 160, light: [-0.4, 0.6, 0.55], amb: 0.62, tint: 'rgba(255,120,120,0.12)', stars: 20 });
  S.ground(-220, -220, 220, 60, C(0x6f8a58), { nx: 10, nz: 8 });
  const pts = Array.from({ length: 18 }, (_, i) => { const a = (i / 18) * 6.2832; return [Math.cos(a) * 6.5, 0.01, -3.6 + Math.sin(a) * 2.6]; });
  S.poly(pts, [86, 120, 170], { n: [0, 1, 0], layer: 0, order: 1, two: true, edge: false, emit: true });
  const r = rnd(4); for (let i = 0; i < 16; i++) { const a = r() * 6.28, rr = Math.sqrt(r()), x = Math.cos(a) * 5.4 * rr, z = -3.6 + Math.sin(a) * 2.0 * rr; const lp = Array.from({ length: 8 }, (_, j) => { const b = (j / 8) * 6.2832; return [x + Math.cos(b) * 0.42, 0.02, z + Math.sin(b) * 0.3]; }); S.poly(lp, C(0x3f9a50), { n: [0, 1, 0], layer: 0, order: 2, two: true, edge: false }); if (i % 3 === 0) S.blob(x, 0.12, z, 0.16, 0.14, 0.16, [255, 160, 200], { emit: true, lat: 2, lon: 6, seed: i }); }
  // 远处的钟楼
  S.box(-13, 0, -26, 3, 7.5, 3, C(0xc9b49a)); S.box(-13, 7.5, -26, 3.4, 2.2, 3.4, C(0x8a4a3a)); S.gable(-13, 9.7, -26, 3.8, 2, 3.8, C(0x2f4f6f)); S.cone(-13, 7.7, -24.2, 0.7, 1.2, 8, [255, 210, 110], { emit: true });
  for (const [x, z, s, sd] of [[8, -10, 1.7, 1], [12, -8, 1.5, 2], [-22, -14, 1.6, 3], [5, -16, 1.8, 4]]) tree(S, x, z, s, 0x4a3a3a, [0x5f8f4a, 0x6aa055, 0x4f7f3f], sd);
  farHills(S, [0x7a6aa8, 0x9a7ab0], 2); clouds(S, C(0xffd0c8), 12, 6);
  S.glows.push({ pos: [20, 6, -170], r: 40, col: [255, 214, 170], a: 0.85 });
  S.dyn = (t) => {};
  return S;
}
function setBeach() {
  const S = new Set3({ sky: ['#050f2c', '#15386a', '#2e6a90'], fog: [26, 54, 94], fogNear: 26, fogFar: 160, light: [0.3, 0.7, -0.5], amb: 0.6, tint: 'rgba(90,140,255,0.13)', stars: 120 });
  S.ground(-220, -220, 220, -3.5, C(0x1c4c78), { nx: 10, nz: 8 });
  S.ground(-220, -3.5, 220, 60, C(0xf2ead6), { nx: 10, nz: 6 });
  S.box(-7, 0, -1.5, 2.6, 2.0, 2.2, C(0xc9a26a)); S.gable(-7, 2.0, -1.5, 3.0, 1.0, 2.6, C(0x8a5a3a)); S.box(-7, 0.8, -0.36, 0.7, 0.6, 0.06, [255, 214, 140], { emit: true, bias: -1 });
  const r = rnd(12); for (let i = 0; i < 22; i++) S.blob(-12 + r() * 24, 0.04, -2.6 + r() * 6, 0.12, 0.06, 0.09, [[255, 220, 230], [255, 255, 245], [250, 200, 180]][i % 3], { lat: 2, lon: 5, seed: i });
  S.dyn = (t, add, S2, p, e, shot) => {
    moonDisc(add, [14, 26, -110], 7, true);
    for (let i = 0; i < 26; i++) { const z = -4 - i * 2.8, w = 0.6 + i * 0.3; add.line([14 * (z / -110) * 1.1 - w + Math.sin(t * 2 + i) * 0.3, 0.02, z], [14 * (z / -110) * 1.1 + w + Math.sin(t * 2 + i) * 0.3, 0.02, z], 0.12 + i * 0.03, [255, 240, 200], 0.5 - i * 0.015); }
    for (let i = 0; i < 3; i++) { const ph = (t * 0.35 + i / 3) % 1, z = -3.5 + Math.sin(ph * Math.PI) * 0.6; add.line([-60, 0.02, z], [60, 0.02, z], 0.08, [240, 250, 255], 0.75 * Math.sin(ph * Math.PI)); }
    for (const [px, pz, h, ph] of [[9, -1.5, 4.6, 0], [11.5, 0.5, 3.8, 1.3], [-12, 0, 4.2, 2.2]]) { const tx = px + 0.9, sw = Math.sin(t * 1.2 + ph) * 0.15; add.line([px, 0, pz], [px + 0.4, h * 0.5, pz], 0.2, [140, 100, 70]); add.line([px + 0.4, h * 0.5, pz], [tx, h, pz], 0.18, [140, 100, 70]); for (let l = 0; l < 6; l++) { const a = (l / 6) * 6.2832 + sw; add.line([tx, h, pz], [tx + Math.cos(a) * 1.5, h - 0.5 + Math.sin(a) * 0.35, pz + Math.sin(a) * 0.6], 0.12, [60, 140, 90]); } }
  };
  return S;
}
const SETS = {};
const BUILD = { bamboo: setBamboo, hill: setHill, galaxy: setGalaxy, creek_spring: () => setCreek('spring'), creek_summer: () => setCreek('summer'), creek_autumn: () => setCreek('autumn'), creek_winter: () => setCreek('winter'), garden_day: () => setGarden('day'), garden_dusk: () => setGarden('dusk'), garden_night: () => setGarden('night'), meadow: () => setMeadow('twilight'), meadow_night: () => setMeadow('night'), pond: setPond, beach: setBeach };
const getSet = (n) => (SETS[n] ??= BUILD[n]());

// ---------- 2D 叠加 ----------
function tag(g, text, x, y, size = 30) { g.save(); g.font = `${size}px BG`; const w = g.measureText(text).width + 28; g.fillStyle = 'rgba(12,8,30,0.6)'; g.beginPath(); g.roundRect(x, y - size * 0.8, w, size * 1.6, 12); g.fill(); g.fillStyle = '#fff'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(text, x + 14, y + 1); g.restore(); }
function dragonHud(g, t, t0, t1, dir = 1, yy = 26, sc = 2.3, alpha = 0.92) {
  const u = (t - t0) / (t1 - t0); if (u < 0 || u > 1) return; const cell = META.s['gpt_fly_' + (Math.floor(t * 6) % 2)]; if (!cell) return;
  const w = cell[2] * sc, h = cell[3] * sc, x = dir > 0 ? lerp(-w, W + w, u) : lerp(W + w, -w, u);
  g.save(); g.globalAlpha = alpha; g.imageSmoothingEnabled = false;
  for (let i = 1; i <= 8; i++) { g.fillStyle = `rgba(255,240,200,${0.5 - i * 0.05})`; g.beginPath(); g.arc(x - dir * i * 26, yy + 30 + Math.sin(t * 6 + i) * 6, 5 - i * 0.4, 0, 7); g.fill(); }
  g.translate(x, yy + Math.sin(t * 3) * 6); if (dir < 0) g.scale(-1, 1); g.drawImage(ENV.atlas, cell[0], cell[1], cell[2], cell[3], -w / 2, -h * 0.62, w, h); g.restore();
}
function petalIcon(g, x, y, r, rot) { g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = '#ffb3cf'; for (let i = 0; i < 5; i++) { const a = i * 1.2566; g.beginPath(); g.ellipse(Math.cos(a) * r * 0.6, Math.sin(a) * r * 0.6, r * 0.55, r * 0.38, a, 0, 7); g.fill(); } g.fillStyle = '#ffe680'; g.beginPath(); g.arc(0, 0, r * 0.3, 0, 7); g.fill(); g.restore(); }
function soft3dText(g, text, x, y, fs, face, side, depth = 6) {
  g.font = `${fs}px BG`; g.textAlign = 'center'; g.textBaseline = 'middle';
  for (let d = depth; d >= 1; d--) { g.fillStyle = side; g.fillText(text, x + d * 0.7, y + d); }
  const gr = g.createLinearGradient(0, y - fs / 2, 0, y + fs / 2); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, face); g.fillStyle = gr; g.fillText(text, x, y);
}
function titleCard(g, t, t0, t1, end = false) {
  const a = Math.min(sm((t - t0) / 0.8), sm((t1 - t) / 0.9)); if (a <= 0) return;
  g.save(); g.globalAlpha = a; const y = end ? H / 2 - 30 : H / 2 - 40, pop = 1 + 0.05 * Math.exp(-(t - t0) * 3) * Math.cos((t - t0) * 9);
  g.translate(W / 2, y); g.scale(pop, pop); g.translate(-W / 2, -y);
  const gl = g.createRadialGradient(W / 2, y, 20, W / 2, y, 360); gl.addColorStop(0, 'rgba(255,190,220,0.35)'); gl.addColorStop(1, 'rgba(255,190,220,0)'); g.fillStyle = gl; g.fillRect(0, y - 360, W, 720);
  soft3dText(g, '樱花草', W / 2, y, 118, '#ffb3d1', 'rgba(150,50,100,0.9)', 8);
  petalIcon(g, W / 2 - 230, y - 30, 22, t); petalIcon(g, W / 2 + 230, y + 26, 18, -t);
  soft3dText(g, 'Sweety', W / 2, y + 96, 40, '#ffe3ef', 'rgba(120,40,90,0.85)', 3);
  g.restore();
}

// ---------- 字幕：软 3D 字卡，逐字染色 + 逐词弹跳（按实测字级时间） ----------
function drawSubtitle(g, t) {
  const ph = CUE.find((p) => t >= p.start - 0.3 && t < p.end + 0.25); if (!ph) return;
  const age = t - (ph.start - 0.3), out = clamp((ph.end + 0.25 - t) / 0.25), ent = sm(age / 0.28);
  const fs = ph.latin ? 40 : 46; g.save(); g.font = `${fs}px BG`; g.textBaseline = 'middle'; g.textAlign = 'left';
  const gap = ph.latin ? fs * 0.3 : 4, n = ph.chars.length, ws = ph.chars.map((c) => g.measureText(c).width);
  const tw = ws.reduce((a, b) => a + b, 0) + gap * (n - 1), x0 = W / 2 - tw / 2, y = H - 70;
  g.globalAlpha = Math.min(ent, out);
  const pop = age < 0.35 ? 1 + 0.07 * Math.exp(-age * 11) * Math.cos(age * 22) : 1;
  g.translate(W / 2, y + (1 - ent) * 18); g.scale(pop, pop); g.translate(-W / 2, -y);
  const bx = x0 - 34, bw = tw + 68, by = y - 40, bh = 80;
  g.fillStyle = 'rgba(60,10,50,0.35)'; g.beginPath(); g.roundRect(bx + 4, by + 8, bw, bh, 18); g.fill();
  const pg = g.createLinearGradient(0, by, 0, by + bh); pg.addColorStop(0, 'rgba(48,26,78,0.9)'); pg.addColorStop(1, 'rgba(18,12,38,0.92)');
  g.fillStyle = pg; g.beginPath(); g.roundRect(bx, by, bw, bh, 18); g.fill(); g.strokeStyle = '#f6b8d2'; g.lineWidth = 2.5; g.stroke();
  g.strokeStyle = 'rgba(255,255,255,0.16)'; g.lineWidth = 1; g.beginPath(); g.roundRect(bx + 6, by + 6, bw - 12, bh - 12, 13); g.stroke();
  petalIcon(g, bx, by + bh / 2, 11, t * 0.8); petalIcon(g, bx + bw, by + bh / 2, 11, -t * 0.8);
  // 句内进度：底部一条细线跟着字走
  const p0 = ph.t[0], p1 = ph.t[n - 1] + 0.3, pr = clamp((t - p0) / (p1 - p0));
  g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(bx + 22, by + bh - 12, bw - 44, 3); g.fillStyle = '#ffd1e4'; g.fillRect(bx + 22, by + bh - 12, (bw - 44) * pr, 3);
  const xs = []; { let x = x0; for (let i = 0; i < n; i++) { xs.push(x); x += ws[i] + gap; } }
  for (const [wtxt, ci, cn] of ph.words) {
    const tw0 = ph.t[ci], a2 = t - tw0, s = a2 >= 0 ? 1 + 0.2 * Math.exp(-a2 * 8) * Math.cos(a2 * 14) : 1;
    const wx0 = xs[ci], wx1 = xs[ci + cn - 1] + ws[ci + cn - 1], wc = (wx0 + wx1) / 2;
    g.save(); g.translate(wc, y + 2); g.scale(s, s); g.translate(-wc, -(y + 2));
    for (let i = ci; i < ci + cn; i++) {
      const ch = ph.chars[i], ti = ph.t[i], tn = i + 1 < n ? ph.t[i + 1] : ph.end - 0.1, dur = clamp(tn - ti, 0.12, 0.7), k = clamp((t - ti) / dur), on = t >= ti;
      const lift = on ? -(1 - clamp((t - ti) / 0.2)) * 7 : 0, x = xs[i], yy = y + 2 + lift;
      g.fillStyle = 'rgba(110,34,84,0.95)'; for (let d = 3; d >= 1; d--) g.fillText(ch, x + d * 0.8, yy + d * 1.1);
      g.fillStyle = '#ffffff'; g.fillText(ch, x, yy);
      if (k > 0) { g.save(); g.beginPath(); g.rect(x - 2, yy - fs, (ws[i] + 4) * k, fs * 2); g.clip(); const cg = g.createLinearGradient(0, yy - fs / 2, 0, yy + fs / 2); cg.addColorStop(0, '#fff2a8'); cg.addColorStop(0.5, '#ffc2da'); cg.addColorStop(1, '#ff79ad'); g.fillStyle = cg; g.fillText(ch, x, yy); g.restore(); }
    }
    g.restore();
  }
  g.restore();
}

// ---------- 分镜 ----------
const A = (c, k, o = {}) => ({ c, k, ...o });
const S = (c, x, z, o = {}) => A(c, [[0, x, z]], o);
const D = (c, x, z, o = {}) => A(c, [[0, x, z]], { dance: true, ...o });
const shots = [];
const add = (a, b, set, o) => shots.push({ a, b, set, ...o });
const mir = (v, p) => (v ? [-p[0], p[1], p[2]] : p);
const alt = (k0, k1, rate = 4) => (t) => (Math.floor(t * rate) % 2 ? k1 : k0);
const FRIENDS = ['kimi', 'gemini', 'qwen', 'zai', 'doubao'];
const charPulse = (i, t, w = 0.35) => { let v = 0; for (const ti of CUE[i].t) { const u = t - ti; if (u >= 0 && u < w * 3) v = Math.max(v, Math.exp(-u / w)); } return v; };

// ===== 序 =====
add(0, 8.4, 'galaxy', { name: '序 · 银河下', cam: [[0, 1.2, 9], [0, 14, -40], [0, 1.6, 8.2], [0, 6, -30], 46], actors: [], galaxy: (t) => 0.5 + t * 0.06,
  hud(g, c) { titleCard(g, c.t, 0.6, 7.7); dragonHud(g, c.t, 2.2, 7.6, 1); } });
add(8.4, 16.6, 'bamboo', { name: '序 · 竹林夜路', cam: [[-6, 1.7, 5.2], [-3, 1.6, -2], [3, 1.9, 5.6], [5, 1.8, -2], 40], wind: () => 0.2, actors: [S('qwen', 4.2, -1.7, { pose: alt('qwen_side_0', 'qwen_side_1', 2) })] });
add(16.6, CUT(0), 'bamboo', { name: '序 · 她从竹林里走来', cam: [[0, 2.2, 9], [0, 1.2, 0], [0, 1.5, 6.4], [0, 1.0, 0], 38], wind: () => 0.2,
  actors: [A('whale', [[16.6, -9, 0.2], [CUT(0), -3.2, 0.1]]), S('qwen', 2.6, -1.8, { pose: () => 'qwen_front_0' })] });

// ===== 主歌一 =====
function sWind(i, v) {
  const gust = (t) => clamp(Math.exp(-Math.max(0, t - WT(i, 1)) * 1.4) * (t >= WT(i, 1) ? 1 : 0)) + 0.25;
  add(CUT(i), CUT(i + 1), 'bamboo', { name: '晚风吹动竹林', cam: [mir(v, [-2.4, 1.6, 5.2]), [0, 1.2, 0], mir(v, [1.2, 1.4, 4.4]), [0.4, 1.3, 0], 40], wind: gust,
    actors: [A('qwen', [[0, -1.7, -1.6]], { pose: alt('qwen_side_0', 'qwen_side_1', 6) }), A('whale', [[CUT(i), -3.4, 0.1], [CUT(i + 1), 1.4, 0.1]])],
    fx(c) { const g0 = gust(c.t) - 0.25; for (let k = 0; k < 6; k++) { const u = ((c.t * 0.9 + k / 6) % 1); c.add.line([-1.2 + u * 6, 1.0 + k * 0.35 + Math.sin(u * 6 + k) * 0.15, -1 + k * 0.1], [-0.4 + u * 6, 1.05 + k * 0.35 + Math.sin(u * 6 + 1 + k) * 0.15, -1 + k * 0.1], 0.03, [230, 245, 255], (0.25 + g0 * 0.7) * Math.sin(u * Math.PI)); } } });
}
function sMoon(i) {
  const grow = (t) => 1 + 2.4 * sm((t - WT(i, 1)) / 1.2);
  add(CUT(i), CUT(i + 1), 'bamboo', { name: '月光拉长身影', cam: [[0.5, 0.55, 6.4], [0, 1.6, -4], [-0.3, 0.7, 5.6], [0, 2.2, -4], 46], wind: () => 0.15,
    actors: [A('whale', [[CUT(i), -3.6, 0.3], [CUT(i + 1), -0.75, 0.3]]), A('claude', [[CUT(i), 3.6, 0.3], [CUT(i + 1), 0.75, 0.3]]), A('kimi', [[0, 0, -7, 0.55]], { pose: () => 'kimi_front_0' })],
    fx(c) { const L = grow(c.t); for (const st of c.st.slice(0, 2)) { const x = st.x; c.S2.poly([[x - 0.24, 0.015, st.z], [x + 0.24, 0.015, st.z], [x + 0.34 + 0.25 * L, 0.015, st.z + 1.3 * L], [x - 0.34 + 0.25 * L, 0.015, st.z + 1.3 * L]], [10, 16, 40], { n: [0, 1, 0], layer: 0, order: 8, two: true, alpha: 0.42, edge: false }); } c.add.glow([0, 1.9, -7.1], 1.6, [200, 220, 255], 0.45); } });
}
function sFirefly(i, v) {
  add(CUT(i), CUT(i + 1), 'hill', { name: '萤火虫一闪闪', cam: [mir(v, [1.8, 1.3, 5.2]), [0, 1.2, 0], mir(v, [-0.6, 1.5, 4.4]), [0, 1.4, 0], 40], flash3: (t) => charPulse(i, t, 0.28) * 0.9,
    actors: [A('gemini', [[CUT(i), -1.6, 0.4], [CS(i) + 1.2, -0.6, 0.3], [CS(i) + 2.0, -0.6, 0.3], [CUT(i + 1), 0.4, 0.2]], { pose: alt('gemini_side_0', 'gemini_side_1', 3) }), S('whale', 1.4, -0.3, { pose: (t) => (t > CT(i, 3) ? 'whale_big_point' : null) })],
    fx(c) { for (let j = 3; j < CUE[i].t.length; j++) sparkle3(c, [-0.6 + (j - 3) * 0.5, 1.8 + (j % 2) * 0.3, 0], CT(i, j), 8, [220, 255, 140]); } });
}
function sCoins(i, v) {
  add(CUT(i), CUT(i + 1), 'hill', { name: '满山飞舞的钱币', coins: CS(i) - 0.2, cam: [mir(v, [0, 3.4, 10]), [0, 2.0, -3], mir(v, [1.6, 2.4, 7.6]), [0.8, 2.4, -3], 44],
    actors: [S('zai', -1.6, 0.2, { pose: (t) => (t > CS(i) ? alt('zai_front_0', 'zai_side_0', 3)(t) : 'zai_front_1') }), S('whale', 1.3, 0.3, { pose: () => 'whale_big_wave' }), S('claude', 2.3, 0.1)],
    fx(c) { const labels = ['一枚', '两枚', '数不清']; for (let w = 0; w < 3; w++) { const t0 = WT(i, w); if (c.t > t0) label3(c, [-1.6, 2.15 + w * 0.42, 0.2], labels[w], 'rgba(120,70,10,0.72)', 0.26, '#ffe9a0'); } } });
}
function sGalaxy(i, v) {
  add(CUT(i), CUT(i + 1), 'galaxy', { name: '天上银河在发光', cam: [mir(v, [0.6, 1.0, 6.5]), [0, 1.2, 0], mir(v, [0, 0.9, 6]), [0, 9, -20], 50], galaxy: (t) => 0.4 + 1.0 * sm((t - WT(i, 2)) / 0.9),
    actors: [S('whale', -0.5, 0, { pose: () => 'whale_big_point' }), S('claude', 0.6, 0.1)],
    hud(g, c) { dragonHud(g, c.t, CS(i) + 0.3, CUT(i + 1) + 0.6, v ? -1 : 1, 22); } });
}
function sChime(i, v) {
  const ring = (t) => charPulse(i, t, 0.45);
  add(CUT(i), CUT(i + 1), 'galaxy', { name: '地上风铃来歌唱', chime: ring, cam: [mir(v, [2.2, 1.7, 3.2]), [5, 2.0, -2.2], mir(v, [3.4, 1.5, 2.5]), [5, 2.2, -2.4], 42],
    actors: [D('doubao', 4.4, -3.2, { ph: 1 }), S(v ? 'qwen' : 'gemini', 5.7, -3.0, { pose: v ? alt('qwen_side_0', 'qwen_side_1', 3) : alt('gemini_side_0', 'gemini_side_1', 2) })],
    fx(c) { CUE[i].t.forEach((ti, j) => note3(c, [3.9 + j * 0.3, 2.0, -2.1], ti, PINKS[j % 4])); } });
}
function sVega(i, v) {
  add(CUT(i), CUT(i + 1), 'galaxy', { name: '织女星在远方', vega: (t) => sm((t - CS(i)) / 1.5) + 0.3 * charPulse(i, t), galaxy: () => 0.9, cam: [[-1.4, 0.6, 3.4], [0.6, 2.6, -6], [-1.0, 0.7, 3.0], [1.6, 4.4, -8], 48],
    actors: v ? [S('whale', -2.1, -1, { pose: () => 'whale_big_point' }), S('claude', 2.3, -1.4), S('kimi', 0.2, -2.6, { pose: alt('kimi_side_0', 'kimi_side_1', 1) })] : [S('whale', 0, 0, { pose: () => 'whale_big_point' })],
    fx(c) { const L = [VEGA, [30, 70, -122], [36, 60, -125], [48, 64, -116], VEGA]; for (let j = 0; j < 4; j++) { const q = clamp((c.t - CT(i, j + 1)) / 0.4); if (q > 0) c.add.line(L[j], [lerp(L[j][0], L[j + 1][0], q), lerp(L[j][1], L[j + 1][1], q), lerp(L[j][2], L[j + 1][2], q)], 0.35, [200, 220, 255], 0.75); } } });
}
function sMyth(i) {
  add(CUT(i), CUT(i + 1), 'galaxy', { name: '古老浪漫的神话', galaxy: () => 1, cam: [[0.4, 1.4, 4.6], [0, 1.4, 0], [0.1, 1.5, 3.7], [0, 1.6, 0], 40],
    actors: [S('kimi', -0.9, 0, { pose: alt('kimi_front_0', 'kimi_side_0', 0.7) }), S('claude', 1.05, -0.3), S('whale', 1.95, -0.5)],
    fx(c) { scroll3(c, [0.15, 1.75, 0.3], sm((c.t - CS(i)) / 1.1), c.t); sparkle3(c, [0.15, 1.75, 0.35], WT(i, 2), 10, [255, 240, 200]); } });
}
function sStream(i, v) {
  const set = v ? 'creek_autumn' : 'creek_spring';
  add(CUT(i), CUT(i + 1), set, { name: '流水走过', cam: [mir(v, [-5, 1.8, 4.6]), [-3, 0.8, -2], mir(v, [2, 1.6, 4.2]), [3, 0.9, -2], 42],
    actors: v ? [A('whale', [[CUT(i), 3.5, 0.2], [CUT(i + 1), -1.5, 0.2]]), A('claude', [[CUT(i), 4.6, 0.35], [CUT(i + 1), -0.4, 0.35]])] : [A('whale', [[CUT(i), -4.5, 0.2], [CUT(i + 1), 1.2, 0.2]]), A('claude', [[CUT(i), -5.6, 0.35], [CUT(i + 1), 0.1, 0.35]])] });
}
function sSeasons(i, v) {
  const order = v ? ['creek_winter', 'creek_autumn', 'creek_summer', 'creek_spring'] : ['creek_spring', 'creek_summer', 'creek_autumn', 'creek_winter'];
  const cuts = [CUT(i), CT(i, 2), CT(i, 4), CT(i, 6), CUT(i + 1)], names = { creek_spring: '春', creek_summer: '夏', creek_autumn: '秋', creek_winter: '冬' };
  for (let k = 0; k < 4; k++) add(cuts[k], cuts[k + 1], order[k], { name: '就像四季的变换 · ' + names[order[k]], hard: true, flash: 1, cam: [mir(v, [1.4, 1.5, 5.2]), [0, 0.9, -1], mir(v, [0.9, 1.4, 4.6]), [0, 0.9, -1], 40],
    actors: [S('whale', -0.45, -1.0), S('claude', 0.45, -1.1)], hud(g, c) { if (c.u < 0.3) { g.fillStyle = `rgba(255,255,255,${0.5 * (1 - c.u / 0.3)})`; g.fillRect(0, 0, W, H); } } });
}
function sSpread(i, v) {
  const t0 = CS(i), R = (j) => 0.8 + hash(j + 500) * 7;
  add(CUT(i), CUT(i + 1), v ? 'garden_dusk' : 'garden_day', { name: '幸福在蔓延', cam: [[0, 2.2, 6.4], [0, 0.8, 0], [0, 4.6, 8.4], [0, 0.3, -1], 42],
    actors: [S('whale', -0.45, 0.2), S('claude', 0.45, 0.2)].concat(v ? [S('kimi', -2.4, -0.6), S('zai', 2.5, -0.5)] : []),
    fx(c) { for (let j = 0; j < 90; j++) { const r = R(j), a = hash(j + 600) * 6.2832, st = t0 + r * 0.4, q = clamp((c.t - st) / 0.35); if (q <= 0) continue; flowerAt(c.add, [Math.cos(a) * r, 0.22, 0.2 + Math.sin(a) * r * 0.7], 0.07, PINKS[j % 5], q + 0.15 * Math.max(0, 1 - (c.t - st) / 0.5)); } } });
}
function sTogether(i, v) {
  const ar = CT(i, 4);
  add(CUT(i), CUT(i + 1), v ? 'garden_day' : 'garden_dusk', { name: '爱你永恒不孤单', cam: [[0, 1.5, 6.6], [0, 1.1, 0], [0, 1.9, 7.8], [0, 1.2, 0], 42],
    actors: [S('whale', -0.42, 0.2, { pose: () => 'whale_big_wave' }), S('claude', 0.42, 0.25), A('kimi', [[CUT(i), -6, -0.3], [ar, -2.0, -0.4]]), A('gemini', [[CUT(i), 6, -0.3], [ar, 2.0, -0.4]]), A('qwen', [[CUT(i), -7, -1.2], [ar + 0.2, -1.2, -1.3]]), A('zai', [[CUT(i), 7, -1.2], [ar + 0.2, 1.2, -1.3]]), A('doubao', [[CUT(i), -8, 0.8], [ar + 0.3, -2.9, 0.6]])],
    fx(c) { hearts3(c, [0, 2.1, 0.3], CS(i) + 0.05); hearts3(c, [0, 2.1, 0.3], CT(i, 4)); if (c.t > CT(i, 5)) sparkle3(c, [0, 1.9, 0.3], CT(i, 5), 12); } });
}

// ===== 副歌 =====
function chorusPass(o, v, end) {
  const set = ['garden_day', 'garden_dusk', 'garden_night', 'garden_day'][v], m = v % 2 === 1;
  // 0 恋人手中樱花草：她把花递过去
  add(CUT(o), CUT(o + 1), set, { name: '恋人手中樱花草', cam: [mir(m, [1.1, 1.3, 4.9]), [0, 1.0, 0], mir(m, [0.5, 1.2, 4.2]), [0, 1.0, 0], 38],
    actors: [S('whale', -0.55, 0, { pose: () => 'whale_big_idle' }), S('claude', 0.6, 0, { flip: true, pose: alt('claude_front_0', 'claude_side_0', 0.5) })],
    fx(c) { const q = sm((c.t - WT(o, 2)) / 0.8); flowerAt(c.add, [lerp(-0.2, 0.15, q), 0.95 + 0.05 * Math.sin(c.t * 3), 0.25], 0.09, [255, 140, 190], 1, 0.6 + 0.4 * charPulse(o, c.t)); if (c.t > WT(o, 2)) hearts3(c, [0.05, 1.9, 0.2], WT(o, 2) + 0.1); } });
  // 1 春彩漫步的微笑：并肩散步
  add(CUT(o + 1), CUT(o + 2), set, { name: '春彩漫步的微笑', cam: [mir(m, [-3.2, 1.5, 4.6]), [-2, 1.0, 0], mir(m, [2.6, 1.5, 4.8]), [2.2, 1.0, 0], 40],
    actors: m ? [A('whale', [[CUT(o + 1), 3.5, 0.2], [CUT(o + 2), -2.0, 0.2]]), A('claude', [[CUT(o + 1), 4.4, 0.45], [CUT(o + 2), -1.1, 0.45]])] : [A('whale', [[CUT(o + 1), -3.5, 0.2], [CUT(o + 2), 2.0, 0.2]]), A('claude', [[CUT(o + 1), -4.4, 0.45], [CUT(o + 2), 1.1, 0.45]])],
    fx(c) { const sx = c.st[0].x; if (c.t > WT(o + 1, 2)) sparkle3(c, [sx, 1.95, 0.3], WT(o + 1, 2), 10, [255, 230, 160]); petalBurst(c, [sx, 1.4, 0.3], WT(o + 1, 1)); } });
  // 2 种下了一朵朵：每个字开一朵
  add(CUT(o + 2), CUT(o + 3), set, { name: '种下了一朵朵', cam: [mir(m, [1.2, 2.2, 3.0]), [0, 0.5, -2.4], mir(m, [0.4, 2.4, 2.4]), [0, 0.4, -2.6], 44],
    actors: [S('whale', -1.4, -1.55, { lean: () => 0.18 }), S('claude', 1.5, -1.45, { flip: true })],
    fx(c) { CUE[o + 2].t.forEach((ti, j) => { const q = clamp((c.t - ti) / 0.28); if (q <= 0) return; const x = -1.6 + j * 0.64; flowerAt(c.add, [x, 0.55, -2.7 + (j % 2) * 0.35], 0.1, PINKS[j % 5], q + 0.25 * Math.max(0, 1 - (c.t - ti) / 0.45), 0.5); if (c.t - ti < 1.1) sparkle3(c, [x, 0.7, -2.6], ti, 6, [255, 240, 180]); }); } });
  // 3 青春璀璨的年少：朋友们在后面跳，光一下子亮起来
  add(CUT(o + 3), CUT(o + 4), set, { name: '青春璀璨的年少', flash: 1, cam: [mir(m, [0, 1.8, 8.2]), [0, 1.3, -1], mir(m, [-1.6, 1.4, 6.6]), [0, 1.3, -1], 44],
    actors: [D('whale', -0.5, 0.4, { ph: 0 }), D('claude', 0.5, 0.4, { ph: 1 }), D('kimi', -2.4, -1.2, { ph: 2 }), D('gemini', 2.4, -1.2, { ph: 3 }), D('qwen', -1.3, -2.0, { ph: 4 }), D('zai', 1.3, -2.0, { ph: 5 }), D('doubao', 0, -2.6, { ph: 6 })],
    fx(c) { const b = WT(o + 3, 1); for (let j = 0; j < 5; j++) { petalBurst(c, [-3 + j * 1.5, 2.6 + (j % 2) * 0.5, -1], b + j * 0.08, 12); sparkle3(c, [-3 + j * 1.5, 2.6, -1], CT(o + 3, 3 + (j % 3)), 8); } c.add.glow([0, 3.5, -2], 4 + 3 * charPulse(o + 3, c.t), [255, 230, 240], 0.25 + 0.3 * charPulse(o + 3, c.t)); } });
  // 4 恋人怀中樱花草：花束抱在怀里
  add(CUT(o + 4), CUT(o + 5), set, { name: '恋人怀中樱花草', cam: [mir(m, [-1.0, 1.25, 4.7]), [0.1, 1.0, 0], mir(m, [-0.5, 1.15, 4.0]), [0.2, 1.0, 0], 38],
    actors: [S('claude', 0.45, 0, { pose: () => 'claude_front_0' }), S('whale', -0.45, 0, { lean: (t) => -0.1 * sm((t - CS(o + 4)) / 0.8) })],
    fx(c) { bouquet(c.add, [0.45, 0.82, 0.18], 1.4, c.t); if (c.t > WT(o + 4, 2)) hearts3(c, [0, 1.85, 0.2], WT(o + 4, 2)); } });
  // 5 听见胸膛心在跳：心跳跟着鼓点
  add(CUT(o + 5), CUT(o + 6), set, { name: '听见胸膛心在跳', cam: [mir(m, [0.4, 1.0, 4.0]), [0, 1.1, 0], mir(m, [0, 1.05, 3.4]), [0, 1.15, 0], 40],
    actors: [S('whale', -0.38, 0, { lean: () => -0.12 }), S('claude', 0.38, 0, { flip: true })],
    fx(c) { const pp = c.p * 0.35 + charPulse(o + 5, c.t, 0.25) * 0.4 * (c.t > WT(o + 5, 2) ? 1 : 0.3); bigHeart3(c, [0.0, 1.62, 0.3], 0.14 * (1 + pp), [255, 92, 158], 0.9); if (c.t > WT(o + 5, 2)) { CUE[o + 5].t.slice(4).forEach((ti) => ring3(c, [0, 1.62, 0.3], ti, [255, 150, 190], 0.9, 1.1, 1)); } } });
  // 6 偷偷的在思念：躲在樱花树后看她
  add(CUT(o + 6), CUT(o + 7), set, { name: '偷偷的在思念', cam: [mir(m, [2.6, 1.3, 4.4]), [0.6, 1.1, 0], mir(m, [2.0, 1.2, 3.6]), [0.8, 1.1, 0], 40],
    actors: [A('whale', [[CUT(o + 6), mir(m, [1.25])[0], 0.1], [CS(o + 6) + 0.9, mir(m, [1.75])[0], 0.1], [CS(o + 6) + 1.6, mir(m, [1.75])[0], 0.1], [CUT(o + 7), mir(m, [1.3])[0], 0.1]]), S('claude', mir(m, [-1.6])[0], -0.6, { pose: alt('claude_side_0', 'claude_side_1', 0.6) })],
    fx(c) { tree(c.S2, mir(m, [1.0])[0], 0.9, 1.15, 0x5a3a45, [0xffb7d1, 0xff9bbf, 0xffd3e3], 77); if (c.t > CT(o + 6, 3)) thought3(c, [mir(m, [1.75])[0] + 0.55, 2.35, 0.1], 'p_claude_neutral'); } });
  // 7 那是我们相爱的记号：花田排成一颗心
  add(CUT(o + 7), end, set, { name: '那是我们相爱的' + (CUE[o + 7].text.endsWith('味道') ? '味道' : '记号'), cam: [[0, 1.6, 6.2], [0, 1.0, 0], [0, 9.5, 7.2], [0, 0, -0.6], 46], sparkleEnd: 1,
    actors: [S('whale', -0.4, 0, { pose: (t) => (t > CT(o + 7, 6) ? 'whale_big_wave' : null) }), S('claude', 0.4, 0)].concat(v >= 1 ? FRIENDS.map((f, j) => S(f, -4.6 + j * 2.3, -3.6 + (j % 2) * 0.4, { pose: (f === 'kimi' || f === 'gemini' || f === 'qwen' || f === 'zai') ? undefined : undefined })) : []),
    fx(c) { const n = 48, t0 = CS(o + 7), t1 = CT(o + 7, 8); for (let j = 0; j < n; j++) { const a = (j / n) * 6.2832, hx = 16 * Math.sin(a) ** 3, hz = 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a); const st = lerp(t0, t1, ((j + n / 2) % n) / n), q = clamp((c.t - st) / 0.25); if (q <= 0) continue; flowerAt(c.add, [hx * 0.2, 0.25, -hz * 0.2 + 0.2], 0.1, PINKS[j % 3], q + 0.3 * Math.max(0, 1 - (c.t - st) / 0.4), 0.9); } if (c.t > t1) { hearts3(c, [0, 2.0, 0], t1 + 0.1, [255, 92, 158], 7); sparkle3(c, [0, 2.0, 0], t1, 14); } } });
}

// ----- 主歌一 + 导歌 + 副歌一 -----
sWind(0, 0); sMoon(1); sFirefly(2, 0); sCoins(3, 0); sGalaxy(4, 0); sChime(5, 0); sVega(6, 0); sMyth(7);
sStream(8, 0); sSeasons(9, 0); sSpread(10, 0); sTogether(11, 0);
chorusPass(12, 0, 92.5);

// ===== 间奏：豆包先踩拍，大家一个个加进来 =====
add(92.5, 97.9, 'meadow', { name: '间奏 · 豆包先跳', cam: [[0, 1.4, 5.4], [0, 1.0, -1.5], [1.6, 1.3, 4.4], [0, 1.0, -1.5], 40], actors: [D('doubao', 0, -1.5, { ph: 0 }), S('whale', -2.6, -1.0), S('claude', 2.6, -1.1)],
  fx(c) { for (let j = 0; j < 10; j++) ring3(c, [0, 0.02, -1.5], 92.6 + j * 0.81, [255, 210, 230], 0.8, 1.4); } });
add(97.9, CUT(20), 'meadow', { name: '间奏 · 大家加进来', cam: [[-3, 1.8, 6.6], [0, 1.0, -1.5], [3, 1.9, 6.4], [0, 1.0, -1.5], 42],
  actors: [D('doubao', 0, -1.5, { ph: 0 }), A('whale', [[97.9, -4.5, -0.6], [99.6, -1.3, -0.8]], { dance: true, ph: 1 }), A('claude', [[97.9, 4.5, -0.6], [99.8, 1.3, -0.9]], { dance: true, ph: 2 }), A('kimi', [[99.5, -7, -2.6], [101.3, -2.6, -2.6]], { dance: true, ph: 3 }), A('gemini', [[99.5, 7, -2.6], [101.3, 2.6, -2.6]], { dance: true, ph: 4 }), A('qwen', [[100.6, -7, -3.4], [102.4, -1.2, -3.4]], { dance: true }), A('zai', [[100.6, 7, -3.4], [102.4, 1.2, -3.4]], { dance: true })] });

// ===== 啦啦啦（一） =====
const ALL_DANCE = (cx = 0) => [D('whale', cx - 0.5, -1.0, { ph: 1 }), D('claude', cx + 0.5, -1.0, { ph: 2 }), D('doubao', cx, -2.0), D('kimi', cx - 2.6, -2.6, { ph: 3 }), D('gemini', cx + 2.6, -2.6, { ph: 4 }), D('qwen', cx - 1.4, -3.4, { ph: 5 }), D('zai', cx + 1.4, -3.4, { ph: 6 })];
function sLa(i, set, camA, camB, name) {
  add(CUT(i), CUT(i + 1), set, { name, cam: [camA[0], camA[1], camB[0], camB[1], 42], actors: ALL_DANCE(),
    fx(c) { CUE[i].t.forEach((ti, j) => { petalBurst(c, [-2.4 + (j % 7) * 0.8, 2.3 + (j % 2) * 0.3, -1.8], ti, 8); note3(c, [-2.4 + (j % 7) * 0.8, 2.0, -1.8], ti, PINKS[j % 4]); }); } });
}
sLa(20, 'meadow', [[-4, 1.7, 5], [0, 1.0, -2]], [[0, 2.2, 6.4], [0, 1.0, -2]], '啦啦啦 · 围成一圈');
sLa(21, 'meadow', [[4, 2.4, 4.4], [0, 1.0, -2]], [[5, 1.4, 1.2], [0, 1.2, -2]], '啦啦啦 · 绕着跳');
sLa(22, 'meadow', [[0, 1.2, 3.4], [0, 1.1, -1]], [[0, 3.2, 7.4], [0, 0.8, -2]], '啦啦啦 · 两个人转圈');

// ===== 主歌二 =====
function sBell(i) {
  add(CUT(i), CUT(i + 1), 'pond', { name: '远方钟声再响起', cam: [[4.2, 1.5, 6.2], [-9, 4.5, -22], [3.4, 1.7, 5.4], [-11, 6, -24], 44],
    actors: [S('whale', 2.6, 1.4), S('claude', 3.4, 1.2), S('kimi', 0.2, -0.6, { pose: () => 'kimi_side_0' })],
    fx(c) { for (const w of [0, 1, 2]) for (let r = 0; r < 3; r++) ring3(c, [-13, 8.3, -23.8], WT(i, w) + r * 0.25, [255, 230, 160], 1.6, 6, 1); c.add.glow([-13, 8.2, -24], 2.4 + 2 * charPulse(i, c.t, 0.4), [255, 220, 140], 0.5); } });
}
function sFrog(i) {
  const frogs = [[-1.5, -1.6], [0.8, -2.6], [2.4, -1.9], [-3.0, -3.0], [3.6, -3.4]];
  add(CUT(i), CUT(i + 1), 'pond', { name: '蛙鸣唱起摇篮曲', cam: [[0.8, 1.7, 4.6], [0, 0.5, -2], [0.2, 1.5, 4.0], [0, 0.6, -2], 44],
    actors: [D('doubao', -0.4, 0.4, { ph: 2 }), S('whale', 0.9, 0.5, { lean: () => 0.08 })],
    fx(c) { frogs.forEach(([x, z], k) => { let cr = 0; CUE[i].t.forEach((ti, j) => { if (j % frogs.length === k) { const u = c.t - ti; if (u >= 0 && u < 0.7) cr = Math.max(cr, Math.sin((u / 0.7) * Math.PI)); } }); frog3(c.add, [x, 0.04, z], 0.2, cr, x > 0); }); CUE[i].t.forEach((ti, j) => { const [x, z] = frogs[j % frogs.length]; ring3(c, [x, 0.03, z], ti, [220, 240, 255], 1.2, 1.4); note3(c, [x, 0.5, z], ti, [220, 255, 220]); }); } });
}
function sBeachWalk(i) {
  add(CUT(i), CUT(i + 1), 'beach', { name: '白沙滩 月弯弯', cam: [[-3, 1.6, 6.4], [0, 1.6, -4], [1.2, 1.9, 6.0], [3, 3.6, -6], 44],
    actors: [A('whale', [[CUT(i), -3.4, 0.4], [CUT(i + 1), 0.6, 0.4]]), A('claude', [[CUT(i), -4.3, 0.7], [CUT(i + 1), -0.3, 0.7]])],
    fx(c) { for (const st of c.st) { for (let j = 0; j < 12; j++) { const fx = st.x - 0.3 - j * 0.34; if (fx < -3.6) break; c.add.dot([fx, 0.01, st.z + (j % 2 ? 0.08 : -0.08)], 0.04, [190, 180, 160], 0.7); } } } });
}
function sDream(i) {
  add(CUT(i), CUT(i + 1), 'beach', { name: '爱你香甜的梦里', cam: [[0.8, 1.4, 5.0], [0, 0.8, 0], [0.3, 1.6, 4.4], [0, 0.9, 0], 42],
    actors: [S('whale', -0.2, 0, { lean: () => 1.45, noBlink: true }), S('doubao', 0.9, -0.3)],
    fx(c) { thought3(c, [-0.9, 1.75, -0.2], 'p_claude_neutral'); CUE[i].t.forEach((ti) => note3(c, [0.9, 1.6, -0.3], ti, [255, 230, 250])); for (let j = 0; j < 3; j++) { const u = ((c.t * 0.6 + j / 3) % 1); c.add.custom([-0.95 + u * 0.4, 0.5 + u * 0.8, 0], (g, x, y, k) => { g.globalAlpha = Math.sin(u * Math.PI); g.fillStyle = '#e0ecff'; g.font = `${0.22 * k * (0.6 + u)}px BG`; g.fillText('呼', x, y); g.globalAlpha = 1; }); } } });
}
function sWish(i) {
  add(CUT(i), CUT(i + 1), 'galaxy', { name: '许下爱恋的愿望', galaxy: () => 1.1, cam: [[0, 0.8, 4.4], [0, 2.2, -4], [0, 0.9, 3.8], [0, 3.6, -6], 46],
    actors: [S('whale', -0.38, 0), S('claude', 0.38, 0)],
    fx(c) { const u = clamp((c.t - WT(i, 1)) / 1.1); if (u > 0 && u < 1) { const p0 = [-30, 40, -60], p1 = [25, 22, -60], q = [lerp(p0[0], p1[0], u), lerp(p0[1], p1[1], u), -60]; c.add.line([q[0] - 5, q[1] + 2.2, -60], q, 0.4, [255, 250, 220], 1 - u * 0.5); c.add.glow(q, 3, [255, 250, 220], 0.9); } if (c.t > WT(i, 2)) { hearts3(c, [0, 1.95, 0], WT(i, 2)); sparkle3(c, [0, 1.95, 0], WT(i, 2) + 0.2, 12); } } });
}
sBell(23); sFrog(24); sBeachWalk(25); sDream(26); sGalaxy(27, 1); sChime(28, 1); sVega(29, 1); sWish(30);
sStream(31, 1); sSeasons(32, 1); sSpread(33, 1); sTogether(34, 1);
chorusPass(35, 1, CUT(43));

// ===== 啦啦啦（二）+ 间奏：放灯、回忆 =====
add(CUT(43), CUT(44), 'meadow_night', { name: '啦啦啦 · 夜里的圆舞', cam: [[-3.6, 1.6, 5.2], [0, 1.0, -2], [3.6, 1.8, 5.4], [0, 1.0, -2], 42], actors: ALL_DANCE(),
  fx(c) { CUE[43].t.forEach((ti, j) => petalBurst(c, [-2.4 + j * 0.8, 2.4, -1.8], ti, 8)); } });
add(CUT(44), CUT(45), 'meadow_night', { name: '放灯', lanterns: CS(44) - 0.2, cam: [[0, 1.0, 5.6], [0, 1.6, -2], [0, 1.2, 6.4], [0, 4.2, -3], 46],
  actors: [S('whale', -0.5, -1.0), S('claude', 0.5, -1.0), S('kimi', -2.2, -1.8, { pose: () => 'kimi_side_0' }), S('gemini', 2.2, -1.8, { pose: () => 'gemini_side_0', flip: true }), S('doubao', -1.2, -2.6), S('qwen', 1.2, -2.6, { pose: () => 'qwen_side_0' }), S('zai', 0, -3.2)],
  hud(g, c) { dragonHud(g, c.t, CS(44) + 2.4, CS(44) + 6.4, -1, 20, 2.0, 0.8); }, fx(c) { CUE[44].t.forEach((ti, j) => note3(c, [-2 + j, 2.1, -1.6], ti)); } });
add(CUT(45), 200.4, 'meadow_night', { name: '啦啦啦 · 灯下转圈', lanterns: 186.5, cam: [[0, 3.0, 7.0], [0, 1.0, -2], [-4, 1.6, 4.4], [0, 1.4, -2], 44], actors: ALL_DANCE(),
  fx(c) { CUE[45].t.forEach((ti, j) => petalBurst(c, [-2.8 + j * 0.8, 2.4, -1.8], ti, 8)); } });
const MEM = [['bamboo', '回忆 · 竹林', [[0, 1.5, 4.6], [0, 1.2, 0], [0.6, 1.5, 4.0], [0, 1.2, 0], 40], [S('whale', -0.4, 0.1), S('claude', 0.4, 0.1)]],
  ['hill', '回忆 · 萤火', [[1, 1.4, 4.6], [0, 1.2, 0], [-0.4, 1.4, 4.2], [0, 1.4, 0], 40], [S('whale', -0.4, 0.1, { pose: () => 'whale_big_point' }), S('gemini', 0.6, 0, { pose: () => 'gemini_side_0' })]],
  ['beach', '回忆 · 月弯弯', [[-1, 1.2, 4.4], [0, 1.6, -4], [0.6, 1.4, 4.2], [0, 2.4, -4], 42], [S('whale', -0.4, 0.3), S('claude', 0.4, 0.3)]],
  ['galaxy', '回忆 · 银河', [[0, 0.8, 5], [0, 3, -6], [0, 0.9, 4.4], [0, 5, -8], 48], [S('kimi', 0, 0, { pose: () => 'kimi_side_0' })]]];
MEM.forEach(([set, name, cam, actors], k) => add(200.4 + k * 2.04, k === 3 ? CUT(46) : 200.4 + (k + 1) * 2.04, set, { name, cam, actors, warm: true, galaxy: () => 1.1 }));

// ===== 副歌三（夜）/ 副歌四（白天，最后一遍） =====
chorusPass(46, 2, CUT(54));
chorusPass(54, 3, 263.3);

// ===== 尾声 =====
add(263.3, 270.3, 'garden_day', { name: '尾声 · 大家挥手', cam: [[0, 1.4, 5.6], [0, 1.1, 0], [0, 6.5, 10.5], [0, 2.4, -2], 44],
  actors: [S('whale', -0.45, 0.2, { pose: () => 'whale_big_wave' }), S('claude', 0.45, 0.2), D('kimi', -2.2, -0.6, { ph: 1 }), D('gemini', 2.2, -0.6, { ph: 2 }), D('qwen', -1.3, -1.4), D('zai', 1.3, -1.4, { ph: 3 }), D('doubao', 0, -2.0)],
  fx(c) { for (let j = 0; j < 48; j++) { const a = (j / 48) * 6.2832, hx = 16 * Math.sin(a) ** 3, hz = 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a); flowerAt(c.add, [hx * 0.2, 0.25, -hz * 0.2 + 0.2], 0.1, PINKS[j % 3], 1, 0.6); } } });
add(270.3, DUR + 1, 'galaxy', { name: '尾声 · 樱花草', galaxy: (t) => 1.2, cam: [[0, 1.0, 6], [0, 8, -30], [0, 1.0, 5.4], [0, 12, -30], 48], actors: [],
  hud(g, c) { dragonHud(g, c.t, 270.6, 274.8, -1, 24); titleCard(g, c.t, 271.2, DUR + 2, true); } });

export const SHOTS = shots.map((s) => ({ start: +s.a.toFixed(2), end: +Math.min(s.b, DUR).toFixed(2), name: s.name, set: s.set }));

// ---------- 渲染 ----------
let ENV = null;
const ST = { face: 0, sprite: 1, glow: 2, text: 3, custom: 4, line: 5, dot: 6, shadow: 7, beam: 8 };


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
    if (set.dyn) set.dyn(t, adder, S2, p, e, shot, cam);
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
    if (shot.hud) shot.hud(g, ctx);
    if (shot.film) { g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(0, 0, W, 54); g.fillRect(0, H - 54, W, 54); tag(g, shot.film, 60, 104, 34); }
    const vg = g.createRadialGradient(W / 2, H / 2, 280, W / 2, H / 2, 840); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(10,0,30,${0.42 - 0.1 * p})`); g.fillStyle = vg; g.fillRect(0, 0, W, H);
    if (shot.flash && p > 0.6) { g.fillStyle = '#fff'; g.globalAlpha = 0.07 * p; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
    if (opts.subtitles !== false) drawSubtitle(g, t);
    const fin = clamp(u / 0.2); if (fin < 1 && t > T0 + 0.5 && !shot.hard) { g.fillStyle = '#000'; g.globalAlpha = (1 - fin) * 0.6; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
    if (t < T0 + 0.5) { g.fillStyle = '#000'; g.globalAlpha = 1 - (t - T0) / 0.5; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
    if (t > DUR - 1.6) { g.fillStyle = "#000"; g.globalAlpha = clamp((t - (DUR - 1.6)) / 1.4); g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
    return { shot: shot.name, ents: ents.length };
  }
  return { render };
}
