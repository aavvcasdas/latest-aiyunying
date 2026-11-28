import * as THREE from 'three';
import { C, FONT, TAU, radialTex, at, ball, box, cone, cyl, disc, flat, grp, lam, paper, quad, ringM, rnd, shapeMesh, txt } from './engine';

/* 细长条（两点之间的"线"） */
export function bar(x1: number, y1: number, x2: number, y2: number, th: number, c: number, o: Partial<THREE.MeshBasicMaterialParameters> = {}) {
  const dx = x2 - x1, dy = y2 - y1, m = quad(Math.hypot(dx, dy), th, c, o);
  m.position.set((x1 + x2) / 2, (y1 + y2) / 2, 0); m.rotation.z = Math.atan2(dy, dx);
  return m;
}
/** 给纸片加一圈白色贴纸边（近似：放大垫底） */
export function sticker(m: THREE.Mesh, k = 1.07, c = 0xffffff) {
  const b = new THREE.Mesh(m.geometry, flat(c));
  m.geometry.computeBoundingBox();
  const bb = m.geometry.boundingBox!, cx = (bb.min.x + bb.max.x) / 2, cy = (bb.min.y + bb.max.y) / 2;
  b.scale.set(k, k, 1); b.position.set(cx * (1 - k), cy * (1 - k), -0.02);
  const g = grp(b, m); return g;
}

/* ───────────── 木偶剧场 ───────────── */
function drape(w: number, h: number, folds: number, c: number) {
  const g = new THREE.PlaneGeometry(w, h, folds * 4, 6);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    p.setZ(i, Math.sin((x / w) * folds * TAU) * 0.22 + Math.sin(y * 1.3 + x) * 0.04);
  }
  g.computeVertexNormals();
  return new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: c, side: THREE.DoubleSide }));
}
export function theatre(s: THREE.Scene, glow = C.mag, dark = C.magDD) {
  const g = new THREE.Group(); s.add(g);
  // 发光幕布背景
  const bg = new THREE.Mesh(new THREE.PlaneGeometry(15, 9), new THREE.MeshBasicMaterial({ map: radialTex(glow, dark, 0.5, 0.45, 0.6), fog: false }));
  at(bg, [0, 3.3, -3.2], g);
  // 舞台地板
  at(box(15, 0.5, 5, C.wood), [0, -0.25, -0.6], g);
  at(box(15.4, 0.22, 0.3, C.goldD), [0, -0.02, 1.95], g);
  // 两侧幕布
  const curL = drape(4.6, 9, 4, C.gold), curR = drape(4.6, 9, 4, C.gold);
  at(curL, [-5.6, 3.6, 1.6], g); at(curR, [5.6, 3.6, 1.6], g);
  // 中幕（可开合）
  const midL = drape(5.2, 9, 5, 0x9c7718), midR = drape(5.2, 9, 5, 0x9c7718);
  at(midL, [-2.5, 3.6, 1.3], g); at(midR, [2.5, 3.6, 1.3], g);
  // 幕檐 + 流苏
  const val = new THREE.Group(); at(val, [0, 6.75, 1.9], g);
  val.add(at(box(16, 1.3, 0.3, C.goldD), [0, 0.5, 0]));
  for (let i = -6; i <= 6; i++) {
    const sc = disc(0.68, i % 2 ? C.gold : 0x9c7718); at(sc, [i * 1.2, -0.1, 0.16 + (i % 2 ? 0.02 : 0)], val);
    at(cone(0.09, 0.42, C.goldL, 5, true), [i * 1.2 + 0.6, -0.42, 0.25], val).rotation.z = Math.PI;
  }
  // 外围压黑
  at(quad(8, 14, 0x050302), [-11.2, 3, 2.2], g); at(quad(8, 14, 0x050302), [11.2, 3, 2.2], g);
  s.add(new THREE.HemisphereLight(0xfff0d0, 0x40200a, 1.6));
  const d = new THREE.DirectionalLight(0xffe2a8, 1.5); d.position.set(0, 4, 9); s.add(d);
  /** k: 0 合拢 → 1 全开 */
  const open = (k: number) => {
    midL.position.x = -2.5 - k * 5.4; midR.position.x = 2.5 + k * 5.4;
    midL.scale.x = 1 - k * 0.45; midR.scale.x = 1 - k * 0.45;
  };
  open(1);
  return { g, bg, curL, curR, midL, midR, val, open };
}
/** 木偶棍 */
export function stick(len = 3, c = 0x8a6a3a) { const m = box(0.07, len, 0.04, c, true); m.position.set(0, -len / 2 + 0.1, -0.05); return m; }

/* ───────────── 自然物 ───────────── */
export function tree(h = 2.4, leaf = C.grass, trunk = C.trunk) {
  const g = new THREE.Group();
  at(cyl(h * 0.07, h * 0.1, h * 0.5, trunk, 6), [0, h * 0.25, 0], g);
  const b = ball(h * 0.36, leaf, false, 0); at(b, [0, h * 0.68, 0], g); b.scale.y = 1.1; b.rotation.y = h * 3;
  return g;
}
export function pine(h = 3, c = C.pine, trunk = C.trunk) {
  const g = new THREE.Group();
  at(cyl(h * 0.05, h * 0.07, h * 0.3, trunk, 5), [0, h * 0.15, 0], g);
  for (let i = 0; i < 3; i++) at(cone(h * (0.3 - i * 0.07), h * 0.36, c, 6), [0, h * (0.38 + i * 0.22), 0], g).rotation.y = i;
  return g;
}
/** 纸片树（立体书弹起用） */
export function paperPine(h = 3, c = C.magD) {
  return paper([[0, h], [0.32 * h, 0.62 * h], [0.16 * h, 0.62 * h], [0.4 * h, 0.3 * h], [0.2 * h, 0.3 * h], [0.46 * h, 0.06 * h], [0.06 * h, 0.06 * h], [0.06 * h, 0],
    [-0.06 * h, 0], [-0.06 * h, 0.06 * h], [-0.46 * h, 0.06 * h], [-0.2 * h, 0.3 * h], [-0.4 * h, 0.3 * h], [-0.16 * h, 0.62 * h], [-0.32 * h, 0.62 * h]], c);
}
export function paperBush(w = 2, c = C.magD) {
  const sh = new THREE.Shape(); sh.moveTo(-w / 2, 0);
  for (let i = 0; i < 4; i++) sh.absarc(-w / 2 + (w / 4) * (i + 0.5), 0.12 * w, w / 6.2, Math.PI, 0, true);
  sh.lineTo(w / 2, 0);
  return shapeMesh(sh, c);
}
export function ground(r: number, c: number, y = 0) { const m = new THREE.Mesh(new THREE.CircleGeometry(r, 40), lam(c)); m.rotation.x = -Math.PI / 2; m.position.y = y; return m; }
export function cloud(c = 0xffffff, basic = true) {
  const g = new THREE.Group();
  [[0, 0, 0.5], [0.55, 0.08, 0.38], [-0.55, 0.02, 0.36], [0.2, 0.3, 0.36]].forEach(p => { const b = ball(p[2], c, basic, 0); at(b, [p[0], p[1], 0], g); b.scale.z = 0.5; });
  return g;
}

/* ───────────── 剪影道具 ───────────── */
/** 大灰狼（面朝 -x） */
export function wolf(c = C.ink, eye = C.blood) {
  const body = paper([[2, 0], [2.3, 1.5], [2.1, 2.5], [1.6, 3.2], [1.5, 4.15], [1.1, 3.45], [0.8, 4.0], [0.5, 3.3], [-0.6, 2.95], [-1.55, 2.6], [-1.45, 2.36],
    [-1.2, 2.1], [-1.05, 2.3], [-0.9, 2.05], [-0.75, 2.3], [-0.6, 2.0], [-0.45, 2.25], [-0.3, 1.95], [0.1, 2.1],
    [-0.3, 1.75], [-0.45, 1.9], [-0.6, 1.65], [-0.75, 1.85], [-0.9, 1.6], [-1.1, 1.75], [-1.2, 1.45], [-0.4, 1.2], [0, 0.9],
    [-0.5, 0.55], [-1.0, 0.65], [-0.9, 0.4], [-1.1, 0.25], [-0.6, 0.12], [-0.2, 0]], c);
  const e = paper([[0, 0], [0.42, 0.16], [0.36, -0.1]], eye); e.position.set(-0.12, 2.72, 0.02);
  const g = grp(body, e); g.userData.eye = e; g.userData.body = body;
  return g;
}
/** 纸板王子：没有脸，只是一块道具 */
export function prince(c = 0xd8b46a) {
  const g = new THREE.Group();
  const cape = paper([[-0.75, 1.75], [0.75, 1.75], [1.0, 0.25], [-1.0, 0.25]], 0x2456c8);
  const body = paper([[-0.5, 1.8], [0.5, 1.8], [0.62, 0.0], [-0.62, 0.0]], c);
  const sash = paper([[-0.5, 1.7], [-0.32, 1.8], [0.6, 0.55], [0.56, 0.3]], C.goldL);
  const head = disc(0.46, c); head.position.set(0, 2.2, 0.01);
  const crown = paper([[-0.42, 2.52], [-0.42, 3.0], [-0.2, 2.76], [0, 3.08], [0.2, 2.76], [0.42, 3.0], [0.42, 2.52]], C.goldL);
  const outline = paper([[-1.1, 0.15], [-0.85, 1.9], [-0.55, 2.05], [-0.62, 2.5], [-0.52, 3.2], [0, 3.25], [0.52, 3.2], [0.62, 2.5], [0.55, 2.05], [0.85, 1.9], [1.1, 0.15], [0.7, -0.1], [-0.7, -0.1]], 0xffffff);
  outline.position.z = -0.03; cape.position.z = -0.01; sash.position.z = 0.02; crown.position.z = 0.02;
  // 脸上只有瓦楞纸的横纹
  for (let i = 0; i < 3; i++) g.add(at(quad(0.5, 0.025, 0xb89045), [0, 2.05 + i * 0.14, 0.03]));
  g.add(outline, cape, body, sash, head, crown, stick(3));
  g.userData.parts = [cape, body, sash, head, crown];
  return g;
}
export function towerSil(c = C.ink, h = 9) {
  const g = new THREE.Group();
  g.add(paper([[-1.0, 0], [-0.85, h], [0.85, h], [1.0, 0]], c));
  g.add(paper([[-1.25, h], [0, h + 2.3], [1.25, h]], c));
  for (let i = -2; i <= 2; i++) g.add(at(quad(0.3, 0.35, c), [i * 0.45, h + 0.05, 0]));
  return g;
}
export function gothicArch(w: number, h: number, c: number, o: Partial<THREE.MeshBasicMaterialParameters> = {}) {
  const sh = new THREE.Shape();
  sh.moveTo(-w / 2, 0); sh.lineTo(-w / 2, h * 0.55);
  sh.quadraticCurveTo(-w / 2, h * 0.86, 0, h); sh.quadraticCurveTo(w / 2, h * 0.86, w / 2, h * 0.55); sh.lineTo(w / 2, 0);
  return shapeMesh(sh, c, o);
}
export function keyMesh(c = 0xffffff) {
  const g = new THREE.Group();
  g.add(ringM(0.32, 0.6, c)); g.add(at(ringM(0.1, 0.2, c), [0, 0, 0.01]));
  for (let i = 0; i < 4; i++) { const p = disc(0.2, c); p.position.set(Math.cos(i * TAU / 4 + 0.78) * 0.62, Math.sin(i * TAU / 4 + 0.78) * 0.62, 0); g.add(p); }
  g.add(at(quad(0.18, 2.4, c), [0, -1.75, 0]));
  g.add(at(quad(0.5, 0.16, c), [0.3, -2.8, 0])); g.add(at(quad(0.36, 0.16, c), [0.24, -2.5, 0])); g.add(at(quad(0.3, 0.1, c), [0, -0.75, 0]));
  return g;
}
export function rifle(c = C.ink) {
  const g = new THREE.Group();
  g.add(paper([[-2, -0.5], [-2.02, 0.08], [-1.15, 0.3], [-0.3, 0.3], [-0.3, 0.38], [2.2, 0.38], [2.2, 0.27], [2.08, 0.27], [2.08, 0.2], [0.9, 0.2], [0.9, 0.1], [-0.15, 0.08], [-0.5, -0.06], [-0.85, -0.3], [-1.3, -0.14]], c));
  g.add(at(ringM(0.1, 0.15, c, {}, 16), [-0.42, -0.08, 0]));
  g.add(at(quad(0.07, 0.14, c), [2.0, 0.45, 0]));
  return g;
}
export function heart(c = C.rose, s = 1) {
  const sh = new THREE.Shape();
  sh.moveTo(0, -0.5 * s); sh.bezierCurveTo(-0.9 * s, 0.05 * s, -0.5 * s, 0.75 * s, 0, 0.3 * s); sh.bezierCurveTo(0.5 * s, 0.75 * s, 0.9 * s, 0.05 * s, 0, -0.5 * s);
  return shapeMesh(sh, c);
}
export function lips(c = C.blood, s = 1) {
  const sh = new THREE.Shape();
  sh.moveTo(-1.5 * s, 0); sh.bezierCurveTo(-0.9 * s, 0.75 * s, -0.35 * s, 0.75 * s, 0, 0.42 * s);
  sh.bezierCurveTo(0.35 * s, 0.75 * s, 0.9 * s, 0.75 * s, 1.5 * s, 0); sh.bezierCurveTo(0.8 * s, -0.95 * s, -0.8 * s, -0.95 * s, -1.5 * s, 0);
  const m = shapeMesh(sh, c);
  const slit = paper([[-1.3 * s, 0], [0, 0.1 * s], [1.3 * s, 0], [0, -0.14 * s]], 0x3a0006); slit.position.z = 0.01;
  return grp(m, slit);
}
export function star4(r = 0.3, c = 0xffffff, o: Partial<THREE.MeshBasicMaterialParameters> = {}) {
  const k = 0.22;
  return paper([[0, r], [r * k, r * k], [r, 0], [r * k, -r * k], [0, -r], [-r * k, -r * k], [-r, 0], [-r * k, r * k]], c, o);
}
export function rose(r = 0.4, c = C.blood, dk = 0x6a0010) {
  const g = new THREE.Group();
  for (let i = 0; i < 5; i++) { const p = disc(r * 0.62, i % 2 ? c : dk, {}, 10); p.position.set(Math.cos(i * TAU / 5) * r * 0.5, Math.sin(i * TAU / 5) * r * 0.5, -0.01 * i); g.add(p); }
  g.add(at(disc(r * 0.5, c, {}, 10), [0, 0, 0.01])); g.add(at(ringM(r * 0.16, r * 0.26, dk, {}, 10), [0, 0, 0.02]));
  return g;
}
export function crown(s = 1, c = C.goldL) {
  const m = paper([[-0.5 * s, 0], [-0.6 * s, 0.6 * s], [-0.28 * s, 0.32 * s], [0, 0.75 * s], [0.28 * s, 0.32 * s], [0.6 * s, 0.6 * s], [0.5 * s, 0]], c);
  const g = grp(m);
  [[-0.6, 0.6], [0, 0.75], [0.6, 0.6]].forEach(p => g.add(at(disc(0.08 * s, 0xfff2a8, {}, 8), [p[0] * s, p[1] * s, 0.01])));
  g.add(at(disc(0.09 * s, C.blood, {}, 8), [0, 0.2 * s, 0.01]));
  return g;
}
/** 对白气泡（黑底白字） */
export function bubble(text: string, h = 0.34, dark = true, font = FONT.hei) {
  const t = txt(text, h, { font, color: dark ? '#fff' : '#111', sp: 0.12 });
  const w = t.userData.w + 0.2, hh = t.userData.h + 0.1;
  const sh = new THREE.Shape(); const r = hh / 2;
  sh.absarc(-w / 2 + r, 0, r, Math.PI / 2, Math.PI * 1.5, false); sh.absarc(w / 2 - r, 0, r, -Math.PI / 2, Math.PI / 2, false);
  const b = shapeMesh(sh, dark ? 0x0a0a0a : 0xffffff); b.position.z = -0.02;
  const tail = paper([[-0.15, -r + 0.03], [0.15, -r + 0.03], [-0.1, -r - 0.32]], dark ? 0x0a0a0a : 0xffffff); tail.position.z = -0.02;
  const g = grp(b, tail, t); g.userData.w = w;
  return g;
}
/** 纸标签（挂牌） */
export function tag(text: string, c = C.paper, ink = '#b30a14') {
  const g = new THREE.Group();
  g.add(paper([[-0.75, -0.5], [0.75, -0.5], [0.75, 0.3], [0.45, 0.6], [-0.45, 0.6], [-0.75, 0.3]], c));
  g.add(at(ringM(0.05, 0.1, 0x7a5a2a, {}, 12), [0, 0.42, 0.01]));
  g.add(at(txt(text, 0.62, { font: FONT.cute, color: ink }), [0, -0.08, 0.02]));
  return g;
}
/** 剧本稿纸 */
export function scriptPage(title: string, lines: string[], hi = -1) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 680; const g = c.getContext('2d')!;
  g.fillStyle = '#f6ecd6'; g.fillRect(0, 0, 512, 680);
  g.fillStyle = 'rgba(120,80,30,0.08)'; for (let i = 0; i < 60; i++) g.fillRect(rnd(i) * 512, rnd(i * 3) * 680, 40 * rnd(i * 7), 2);
  g.strokeStyle = '#b30a14'; g.lineWidth = 3; g.strokeRect(22, 22, 468, 636);
  g.fillStyle = '#b30a14'; g.textAlign = 'center'; g.font = `700 64px ${FONT.serif}`; g.fillText(title, 256, 104);
  g.fillRect(150, 126, 212, 3);
  g.textAlign = 'left';
  lines.forEach((l, i) => {
    const y = 200 + i * 78;
    if (i === hi) { g.fillStyle = 'rgba(240,18,138,0.28)'; g.fillRect(44, y - 44, 424, 60); }
    g.fillStyle = i === hi ? '#16090a' : 'rgba(40,24,16,0.5)'; g.font = `${i === hi ? 700 : 500} ${i === hi ? 40 : 30}px ${FONT.serif}`;
    g.fillText(l, 56, y);
  });
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(3, 4), new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide, fog: false }));
  const sh = quad(3.12, 4.12, 0x1a0508); sh.position.set(0.07, -0.07, -0.02);
  return grp(sh, m);
}
/** 聚光灯光锥 */
export function spot(wTop = 0.5, wBot = 3.2, h = 9, c = 0xffffff, op = 0.16) {
  const m = paper([[-wTop / 2, h], [wTop / 2, h], [wBot / 2, 0], [-wBot / 2, 0]], c, { transparent: true, opacity: op, depthWrite: false, blending: THREE.AdditiveBlending });
  m.renderOrder = 5; return m;
}
/** 龙影：身体 + 可扇动的双翼 */
export function dragonShadow(c = C.ink) {
  const g = new THREE.Group();
  const body = paper([[-0.7, 0], [-0.9, 1.6], [-0.5, 2.8], [-0.75, 3.5], [-0.55, 4.6], [-1.0, 5.5], [-0.35, 5.0], [0, 5.25], [0.35, 5.0], [1.0, 5.5], [0.55, 4.6], [0.75, 3.5], [0.5, 2.8], [0.9, 1.6],
    [1.5, 0.9], [2.6, 0.7], [3.3, 1.3], [2.9, 0.3], [1.6, 0], [0.7, 0]], c);
  const mk = (sx: number) => {
    const w = paper([[0, 0], [1.2, 1.9], [3.4, 2.9], [5.6, 2.3], [5.0, 1.3], [4.3, 1.5], [3.9, 0.5], [3.1, 0.8], [2.6, -0.2], [1.8, 0.2], [1.2, -0.7], [0.4, -0.5]], c);
    const p = new THREE.Group(); p.add(w); p.position.set(0.4 * sx, 3.2, -0.01); p.scale.x = sx; return p;
  };
  const wl = mk(-1), wr = mk(1);
  const e1 = disc(0.09, C.blood, {}, 8), e2 = disc(0.09, C.blood, {}, 8); e1.position.set(-0.22, 4.3, 0.02); e2.position.set(0.22, 4.3, 0.02);
  g.add(body, wl, wr, e1, e2); g.userData = { wl, wr };
  return g;
}
/** 低多边形蝠翼（骑龙用） */
export function wing(c = 0xf4f0ff, c2 = 0xcfc4ee) {
  const g = new THREE.Group();
  const a = paper([[0, 0], [0.9, 1.5], [2.6, 2.2], [4.2, 1.7], [3.7, 0.9], [3.1, 1.1], [2.8, 0.3], [2.2, 0.55], [1.8, -0.2], [1.2, 0.1], [0.8, -0.5]], c);
  const b = paper([[0, 0], [0.9, 1.5], [2.6, 2.2], [1.2, 0.1]], c2); b.position.z = 0.01;
  const b2 = paper([[2.6, 2.2], [4.2, 1.7], [2.8, 0.3], [2.2, 0.55]], c2); b2.position.z = 0.01;
  g.add(a, b, b2); return g;
}
export function padlock(c = C.goldL, dk = C.goldD) {
  const g = new THREE.Group();
  const sh = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.15, 6, 16, Math.PI), flat(0xd9dde8)); sh.position.y = 0.7;
  g.add(sh, at(quad(0.3, 0.5, 0xd9dde8), [-0.62, 0.5, 0]), at(quad(0.3, 0.5, 0xd9dde8), [0.62, 0.5, 0]));
  g.add(at(box(1.9, 1.5, 0.3, c, true), [0, -0.35, 0]));
  g.add(at(disc(0.2, dk, {}, 16), [0, -0.2, 0.16]), at(paper([[-0.09, -0.2], [0.09, -0.2], [0.14, -0.72], [-0.14, -0.72]], dk), [0, 0, 0.16]));
  g.userData.shackle = sh;
  return g;
}
/** 打开的童话书 */
export function openBook(w = 4, d = 3, cover = 0x8a1020) {
  const g = new THREE.Group();
  g.add(at(box(w * 2 + 0.3, 0.16, d + 0.3, cover), [0, -0.1, 0]));
  const L = box(w, 0.14, d, C.paper), R = box(w, 0.14, d, C.paper);
  at(L, [-w / 2, 0.02, 0], g); at(R, [w / 2, 0.02, 0], g); L.rotation.z = 0.03; R.rotation.z = -0.03;
  g.add(at(box(0.06, 0.2, d, C.paperD), [0, 0.03, 0]));
  return g;
}
/** 纺车 */
export function spindle(c = C.ink) {
  const g = new THREE.Group(), wheel = new THREE.Group();
  wheel.add(ringM(1.25, 1.42, c)); wheel.add(disc(0.2, c));
  for (let i = 0; i < 8; i++) { const sp = quad(0.07, 2.6, c); sp.rotation.z = (i * Math.PI) / 8; wheel.add(sp); }
  at(wheel, [0, 2.1, 0], g);
  g.add(paper([[-0.25, 0], [-0.08, 2.1], [0.08, 2.1], [0.25, 0]], c));
  g.add(at(quad(3.6, 0.14, c), [1.2, 0.75, 0]));
  g.add(paper([[2.7, 0], [2.78, 2.0], [2.86, 2.9], [2.94, 2.0], [3.0, 0]], c)); // 纺锤针
  g.add(at(paper([[-0.16, 0], [0, 0.34], [0.16, 0], [0, -0.34]], c), [2.86, 2.0, 0]));
  g.userData.wheel = wheel; g.userData.tip = new THREE.Vector3(2.86, 2.9, 0);
  return g;
}
export function knife(h = 1.6, c = C.silver) {
  const g = new THREE.Group();
  g.add(paper([[-0.14, 0], [0, h], [0.14, 0]], c)); g.add(at(paper([[0, 0], [0, h], [0.14, 0]], 0x8c95ab), [0, 0, 0.01]));
  g.add(at(quad(0.5, 0.1, 0x30201a), [0, 0, 0.02]));
  return g;
}
export function quill(c = 0xffffff) {
  const g = new THREE.Group();
  const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.bezierCurveTo(0.55, 0.6, 0.5, 1.9, 0.05, 2.7); sh.bezierCurveTo(-0.25, 1.9, -0.3, 0.7, 0, 0);
  g.add(shapeMesh(sh, c)); g.add(at(quad(0.04, 3.3, 0x222222), [0.02, 1.1, 0.01])); g.add(paper([[-0.06, -0.5], [0.1, -0.5], [0.02, -0.85]], 0x111111));
  return g;
}
/** 小屋 */
export function cottage(wall = 0xf7e3b5, roof = 0xc0392b) {
  const g = new THREE.Group();
  at(box(3, 2, 2.4, wall), [0, 1, 0], g);
  const r = cone(2.5, 1.6, roof, 4); r.rotation.y = Math.PI / 4; r.scale.z = 0.9; at(r, [0, 2.8, 0], g);
  at(box(0.7, 1.2, 0.1, 0x7a4a26), [-0.7, 0.6, 1.21], g);
  at(box(0.9, 0.8, 0.1, 0x9fdcff), [0.6, 1.2, 1.21], g); at(box(1.0, 0.08, 0.14, 0xffffff), [0.6, 1.2, 1.22], g); at(box(0.08, 0.9, 0.14, 0xffffff), [0.6, 1.2, 1.22], g);
  at(box(0.4, 0.9, 0.4, 0x8a5a44), [0.8, 3.1, 0], g);
  return g;
}
/** 一组小碎片，供爆裂用 */
export function shards(n: number, cols: number[], size = 0.4) {
  const arr: THREE.Mesh[] = [];
  for (let i = 0; i < n; i++) {
    const s = size * (0.5 + rnd(i * 3.3));
    arr.push(paper([[0, s], [s * (0.5 + rnd(i)), -s * 0.4], [-s * (0.4 + rnd(i * 2)), -s * (0.3 + rnd(i * 5) * 0.5)]], cols[i % cols.length]));
  }
  return arr;
}
export const _unused = [cyl];
