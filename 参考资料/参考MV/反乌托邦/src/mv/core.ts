// @ts-nocheck
// 软 3D 引擎核心 —— 沿用《坏女孩》fable5.2 的 Canvas2D 画家算法（番外MV/坏女孩Fable/api/engine.ts）。
// 同一个 t 永远画出同一帧：网页实时预览与逐帧导出 MP4 走的是同一份 render()。
// 《反乌托邦》在上面加了：童话镇穿戴（金冠 / 红兜帽 / 蝴蝶结 / 小王冠 / 高礼帽）、地面倒影、相片贴面、手绘揭开、镜头滚转。
import META from './data/cast_atlas.json';

export { META };
export const W = 1280, H = 720, NEAR = 0.2, PX = 1.7 / 88, TAU = Math.PI * 2;
export const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const sm = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
export const lerp = (a, b, p) => a + (b - a) * p;
export const mix3 = (a, b, p) => [lerp(a[0], b[0], p), lerp(a[1], b[1], p), lerp(a[2], b[2], p)];
export const rnd = (s) => () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
export const hash = (n) => { const v = Math.sin(n * 127.1 + 3.7) * 43758.5453; return v - Math.floor(v); };
export const C = (h) => [(h >> 16) & 255, (h >> 8) & 255, h & 255];
export const rgb = (c, a = 1) => a >= 1 ? `rgb(${clamp(c[0], 0, 255) | 0},${clamp(c[1], 0, 255) | 0},${clamp(c[2], 0, 255) | 0})` : `rgba(${clamp(c[0], 0, 255) | 0},${clamp(c[1], 0, 255) | 0},${clamp(c[2], 0, 255) | 0},${Math.max(0, a).toFixed(3)})`;
export const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
export const cen = (p) => { let x = 0, y = 0, z = 0; for (const q of p) { x += q[0]; y += q[1]; z += q[2]; } return [x / p.length, y / p.length, z / p.length]; };

/** 运行环境：图集图片 + 造画布的方法（浏览器 / 导出共用） */
export const ENV = { atlas: null, makeCanvas: null };
export function setEnv(e) { ENV.atlas = e.atlas; ENV.makeCanvas = e.makeCanvas; }

// ---------- 3D 布景构件（与坏女孩 Fable 同一套） ----------
export class Set3 {
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
      this.poly([[xa, y, za], [xb, y, za], [xb, y, zb], [xa, y, zb]], o.colAt ? o.colAt(i, j) : col, { n: [0, 1, 0], layer: 0, order: o.order || 0, two: true, emit: o.emit, edge: false, alpha: o.alpha });
    }
  }
  box(x, y, z, w, h, d, col, o = {}) {
    const ry = o.ry || 0, c = Math.cos(ry), s = Math.sin(ry), a = w / 2, b = d / 2;
    const Pt = (lx, ly, lz) => [x + lx * c + lz * s, y + ly, z - lx * s + lz * c];
    const N = (nx, nz) => [nx * c + nz * s, 0, -nx * s + nz * c];
    const q = (p, n, cc) => this.poly(p, cc || col, { n, emit: o.emit, bias: o.bias, edge: o.edge, alpha: o.alpha });
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
      const a0 = (i / n) * TAU, a1 = ((i + 1) / n) * TAU;
      this.poly([[x + Math.cos(a0) * r, y, z + Math.sin(a0) * r], [x + Math.cos(a1) * r, y, z + Math.sin(a1) * r], [x + Math.cos(a1) * r2, y + h, z + Math.sin(a1) * r2], [x + Math.cos(a0) * r2, y + h, z + Math.sin(a0) * r2]], col, { out: [x, y + h / 2, z], emit: o.emit, bias: o.bias });
    }
    if (!o.noTop && r2 > 0.01) this.poly(Array.from({ length: n }, (_, i) => [x + Math.cos((i / n) * TAU) * r2, y + h, z + Math.sin((i / n) * TAU) * r2]), o.top || col, { n: [0, 1, 0], emit: o.emit, bias: o.bias });
  }
  cone(x, y, z, r, h, n, col, o = {}) { this.cyl(x, y, z, r, h, n, col, { ...o, r2: 0, noTop: true }); }
  blob(x, y, z, rx, ry, rz, col, o = {}) {
    const nLat = o.lat || 4, nLon = o.lon || 7, r = rnd((o.seed || 1) * 977 + 13), vmax = o.hemi ? Math.PI / 2 : Math.PI, V = [];
    for (let j = 0; j <= nLat; j++) {
      const v = (j / nLat) * vmax, row = [];
      for (let i = 0; i < nLon; i++) { const u = (i / nLon) * TAU, k = j === 0 || (!o.hemi && j === nLat) ? 1 : 1 + (r() - 0.5) * (o.jit ?? 0.24); row.push([x + Math.sin(v) * Math.cos(u) * rx * k, y + Math.cos(v) * ry * k, z + Math.sin(v) * Math.sin(u) * rz * k]); }
      V.push(row);
    }
    for (let j = 0; j < nLat; j++) for (let i = 0; i < nLon; i++) {
      const a = V[j][i], b = V[j][(i + 1) % nLon], c = V[j + 1][(i + 1) % nLon], d = V[j + 1][i];
      this.poly(j === 0 ? [a, c, d] : !o.hemi && j === nLat - 1 ? [a, b, d] : [a, b, c, d], col, { out: [x, y, z], emit: o.emit, bias: o.bias });
    }
  }
  line(a, b, w, col, alpha = 1) { this.lines.push({ a, b, w, col, alpha }); }
}

export function tree(S, x, z, s, trunk, crowns, seed) {
  S.cyl(x, 0, z, 0.2 * s, 1.7 * s, 6, C(trunk), { r2: 0.14 * s });
  const r = rnd(seed * 31 + 7);
  for (let i = 0; i < 3; i++) S.blob(x + (r() - 0.5) * 1.3 * s, (2.1 + i * 0.45) * s + r() * 0.3, z + (r() - 0.5) * 1.0 * s, (1.15 - r() * 0.25) * s, 0.95 * s, 1.05 * s, C(crowns[i % crowns.length]), { seed: seed * 5 + i });
}
export function house(S, x, z, w, h, d, wall, roof, ry = 0) {
  S.box(x, 0, z, w, h, d, C(wall), { ry }); S.gable(x, h, z, w * 1.14, h * 0.6, d * 1.16, C(roof), ry);
  const c = Math.cos(ry), s = Math.sin(ry), Q = (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c];
  let q = Q(0, d / 2 + 0.04); S.box(q[0], 0, q[1], 0.75, 1.35, 0.06, C(0x7a4a30), { ry, bias: -1.2 });
  for (const lx of [-w * 0.3, w * 0.3]) { q = Q(lx, d / 2 + 0.04); S.box(q[0], h * 0.42, q[1], 0.72, 0.72, 0.06, C(0xffe9a8), { ry, emit: true, bias: -1.2 }); }
}
export function lamp(S, x, z, h = 3.4, col = [255, 220, 140]) { S.cyl(x, 0, z, 0.07, h, 5, C(0x2a2440), { noTop: true }); S.box(x, h, z, 0.36, 0.36, 0.36, col, { emit: true }); S.glows.push({ pos: [x, h + 0.18, z], r: 2.4, col, a: 0.5 }); }
export function building(S, x, z, w, h, d, col, seed, sides, wp = 0.45) {
  S.box(x, 0, z, w, h, d, C(col)); const r = rnd(seed * 13 + 5), wc = [[255, 216, 107], [255, 143, 200], [143, 232, 255]], rows = Math.max(1, Math.floor((h - 1) / 1.7));
  const cols = Math.max(1, Math.floor(w / 1.5)), cols2 = Math.max(1, Math.floor(d / 1.5));
  if (sides.includes('z')) for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) if (r() < wp) { const wx = x - w / 2 + ((i + 0.5) * w) / cols, wy = 1.1 + j * 1.7, zz = z + d / 2 + 0.03; S.poly([[wx - 0.36, wy, zz], [wx + 0.36, wy, zz], [wx + 0.36, wy + 0.85, zz], [wx - 0.36, wy + 0.85, zz]], wc[(r() * 3) | 0], { n: [0, 0, 1], emit: true, edge: false, bias: -2.5 }); }
  for (const sd of [1, -1]) if (sides.includes(sd > 0 ? '+x' : '-x')) for (let i = 0; i < cols2; i++) for (let j = 0; j < rows; j++) if (r() < wp) { const wz = z - d / 2 + ((i + 0.5) * d) / cols2, wy = 1.1 + j * 1.7, xx = x + sd * (w / 2 + 0.03); S.poly([[xx, wy, wz - 0.36], [xx, wy, wz + 0.36], [xx, wy + 0.85, wz + 0.36], [xx, wy + 0.85, wz - 0.36]], wc[(r() * 3) | 0], { n: [sd, 0, 0], emit: true, edge: false, bias: -2.5 }); }
}
export const farHills = (S, cols, seed, z0 = -120) => { const r = rnd(seed); for (let i = 0; i < 9; i++) S.blob(-200 + i * 50 + r() * 10, 0, z0 - r() * 40, 38 + r() * 22, 14 + r() * 16, 30, C(cols[i % cols.length]), { hemi: true, seed: seed + i, lat: 3, lon: 8 }); };
export const clouds = (S, col, seed, n = 7) => { const r = rnd(seed); for (let i = 0; i < n; i++) S.blob(-150 + i * 46 + r() * 16, 30 + r() * 14, -150 + r() * 40, 13 + r() * 8, 3.2, 6, col, { emit: true, seed: seed + i, lat: 3, lon: 6 }); };
export const bench = (S, x, z, col) => { S.box(x, 0.38, z, 1.9, 0.12, 0.6, C(col)); S.box(x, 0.5, z - 0.27, 1.9, 0.55, 0.08, C(col)); S.box(x - 0.8, 0, z, 0.1, 0.38, 0.5, C(0x3a2a40)); S.box(x + 0.8, 0, z, 0.1, 0.38, 0.5, C(0x3a2a40)); };
/** 花瓣 / 落叶 / 尘：位置是时间的纯函数 */
export const drift = (add, t, n, col, box, vy, vx, r, seed, alpha = 0.9) => {
  const rr = rnd(seed);
  for (let i = 0; i < n; i++) { const bx = rr(), by = rr(), bz = rr(), sp = 0.6 + rr() * 0.8, hgt = box[3]; const y = hgt - (((by * hgt + t * vy * sp) % hgt) + hgt) % hgt; add.dot([box[0] + ((((bx * box[1] + t * vx * sp) % box[1]) + box[1]) % box[1]) + Math.sin(t * sp + i) * 0.3, y, box[2] + bz * box[4]], r * (0.7 + sp * 0.4), col, alpha); }
};

// ---------- 相机 / 投影 ----------
export function makeCam(pos, tgt, fov) {
  const f = norm(sub(tgt, pos)), r = norm(cross(f, [0, 1, 0])), u = cross(r, f), F = H / 2 / Math.tan((fov * Math.PI) / 360);
  const toCam = (q) => { const dx = q[0] - pos[0], dy = q[1] - pos[1], dz = q[2] - pos[2]; return [dx * r[0] + dy * r[1] + dz * r[2], dx * u[0] + dy * u[1] + dz * u[2], dx * f[0] + dy * f[1] + dz * f[2]]; };
  const proj = (q) => { const c = toCam(q); return c[2] < NEAR ? null : [W / 2 + (c[0] / c[2]) * F, H / 2 - (c[1] / c[2]) * F, c[2], F / c[2]]; };
  return { pos, f, r, u, F, toCam, proj };
}
export function clipNear(p) {
  const out = [];
  for (let i = 0; i < p.length; i++) { const a = p[i], b = p[(i + 1) % p.length], ia = a[2] >= NEAR, ib = b[2] >= NEAR; if (ia) out.push(a); if (ia !== ib) { const q = (NEAR - a[2]) / (b[2] - a[2]); out.push([a[0] + (b[0] - a[0]) * q, a[1] + (b[1] - a[1]) * q, NEAR]); } }
  return out;
}

// ---------- 2D 小件 ----------
export function heartPath(g, x, y, s) { g.beginPath(); g.moveTo(x, y + s * 0.9); g.bezierCurveTo(x - s * 1.6, y - s * 0.2, x - s * 0.7, y - s * 1.3, x, y - s * 0.4); g.bezierCurveTo(x + s * 0.7, y - s * 1.3, x + s * 1.6, y - s * 0.2, x, y + s * 0.9); }
export function starPath(g, x, y, r, rot = 0) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = rot - Math.PI / 2 + (i * Math.PI) / 5, rr = i % 2 ? r * 0.45 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); }
export function tag(g, text, x, y, size = 30) { g.save(); g.font = `${size}px BG`; const w = g.measureText(text).width + 28; g.fillStyle = 'rgba(12,8,30,0.62)'; g.beginPath(); g.roundRect(x, y - size * 0.8, w, size * 1.6, 12); g.fill(); g.fillStyle = '#fff'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(text, x + 14, y + 1); g.restore(); }

// ---------- 童话镇穿戴：在角色自己的像素坐标里画（原点 = 脚底中点，向上为负），pre = 画在身后 ----------
export function drawWear(g, kind, ch, pre, dark) {
  const top = -ch, F = (c) => (dark ? (typeof dark === 'string' ? dark : 'rgba(8,4,16,0.96)') : c);
  if (kind === 'hood') { // 小红帽：身后披风 + 兜帽，前面一圈帽檐
    const hy = top + 15, R = 15;
    if (pre) { g.fillStyle = F('#a80f26'); g.beginPath(); g.moveTo(-11, top + 27); g.lineTo(11, top + 27); g.lineTo(18, top + ch * 0.88); g.lineTo(-18, top + ch * 0.88); g.closePath(); g.fill(); g.beginPath(); g.arc(0, hy, R + 1.5, 0, TAU); g.fill(); return; }
    g.strokeStyle = F('#d3183a'); g.lineCap = 'round'; g.lineWidth = 6.5; g.beginPath(); g.arc(0, hy + 1, R - 1.5, Math.PI * 1.06, Math.PI * 1.94); g.stroke();
    g.lineWidth = 4; g.beginPath(); g.arc(0, hy + 1, R - 1, Math.PI * 0.78, Math.PI * 1.08); g.stroke(); g.beginPath(); g.arc(0, hy + 1, R - 1, Math.PI * 1.92, Math.PI * 2.22); g.stroke();
    if (!dark) { g.fillStyle = '#ffffff'; g.beginPath(); g.arc(0, top + 31, 1.8, 0, TAU); g.fill(); }
    return;
  }
  if (pre) return;
  g.lineJoin = 'round';
  if (kind === 'crown') { // 公主的金冠（全片唯一一顶）
    const y = top + 5, w = 12; g.fillStyle = F('#ffd23a'); g.strokeStyle = F('#8a5a00'); g.lineWidth = 1.3;
    g.beginPath(); g.moveTo(-w, y); g.lineTo(-w, y - 8); g.lineTo(-w * 0.5, y - 3.5); g.lineTo(0, y - 11); g.lineTo(w * 0.5, y - 3.5); g.lineTo(w, y - 8); g.lineTo(w, y); g.closePath(); g.fill(); g.stroke();
    if (!dark) { g.fillStyle = '#ff3a5a'; g.beginPath(); g.arc(0, y - 2.8, 1.9, 0, TAU); g.fill(); g.fillStyle = '#3ab0ff'; g.beginPath(); g.arc(-w * 0.62, y - 2.2, 1.3, 0, TAU); g.arc(w * 0.62, y - 2.2, 1.3, 0, TAU); g.fill(); g.fillStyle = 'rgba(255,255,255,0.8)'; g.fillRect(-w + 1.5, y - 7, 1.2, 4); }
  } else if (kind === 'tiara') { // 灰姑娘的银色小王冠
    const y = top + 8, w = 11; g.fillStyle = F('#eef3fb'); g.strokeStyle = F('#7a8aa6'); g.lineWidth = 1.1;
    g.beginPath(); g.moveTo(-w, y); g.quadraticCurveTo(-w * 0.6, y - 4, -w * 0.35, y - 3); g.lineTo(0, y - 8); g.lineTo(w * 0.35, y - 3); g.quadraticCurveTo(w * 0.6, y - 4, w, y); g.closePath(); g.fill(); g.stroke();
    if (!dark) { g.fillStyle = '#4ab0ff'; g.beginPath(); g.arc(0, y - 3.4, 1.7, 0, TAU); g.fill(); }
  } else if (kind === 'tophat') { // 疯帽子的高礼帽
    const y = top + 7; g.fillStyle = F('#2a1f3a'); g.strokeStyle = F('#120a1c'); g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(-9, y - 1); g.lineTo(-10.5, y - 22); g.lineTo(10.5, y - 22); g.lineTo(9, y - 1); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.ellipse(0, y, 16, 3.6, 0, 0, TAU); g.fill(); g.stroke();
    if (!dark) { g.fillStyle = '#c05aff'; g.fillRect(-9.4, y - 7, 18.8, 4); g.fillStyle = '#fff3c4'; g.fillRect(4, y - 14, 5, 7); }
  } else if (kind === 'bow') { // 爱丽丝的蝴蝶结
    const y = top + 4; g.fillStyle = F('#2b4bd6'); g.strokeStyle = F('#15257a'); g.lineWidth = 1.1;
    for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(0, y); g.quadraticCurveTo(sd * 8, y - 9, sd * 13, y - 4); g.quadraticCurveTo(sd * 14, y + 2, sd * 12, y + 5); g.quadraticCurveTo(sd * 7, y + 5, 0, y); g.closePath(); g.fill(); g.stroke(); }
    g.beginPath(); g.arc(0, y, 2.6, 0, TAU); g.fill(); g.stroke();
  }
}
