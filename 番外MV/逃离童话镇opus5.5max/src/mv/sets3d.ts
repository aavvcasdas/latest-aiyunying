import * as THREE from 'three';
import {
  Kit, PI, TAU, ball, basic, box, canvasTex, clamp, cone, cyl, disc, eo, facadeTex, faceted, glowMat,
  many, mesh, mulberry, put, ribbon, rnd, roof, setOp, sprite3D, toon, waterMat,
} from './engine';

export function hill(r: number, h: number, color: number): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 22, 12), toon(color));
  m.scale.set(r, h, r);
  return m;
}
export function backdropHills(k: Kit, c1 = 0x79b98a, c2 = 0x6aa9c9, clouds = true) {
  many(12, i => {
    const a = (i / 12) * PI * 2 + 0.2;
    k.add(hill(36 + rnd(i) * 30, 14 + rnd(i + 3) * 20, i % 2 ? c1 : c2), Math.cos(a) * 175, 0, Math.sin(a) * 175);
  });
  if (clouds) many(9, i => k.add(cloud(i * 7, 2 + rnd(i) * 2), -120 + i * 30, 30 + rnd(i + 1) * 20, -110 - rnd(i + 2) * 40));
}

export function tree(h: number, color = 0x4fb85a, seed = 1): THREE.Group {
  const g = new THREE.Group();
  g.add(cyl(0.16, 0.26, h * 0.5, 0x7a4a2c, 6));
  const dark = (color & 0xfefefe) >> 1;
  put(g, ball(h * 0.3, color, true), 0, h * 0.62, 0);
  put(g, ball(h * 0.22, dark + 0x203020, true), h * 0.18 * (rnd(seed) - 0.3), h * 0.5, h * 0.14);
  put(g, ball(h * 0.2, color, true), -h * 0.16, h * 0.82 - h * 0.1 * rnd(seed + 2), 0);
  return g;
}
export function pine(h: number, color = 0x2f7a55): THREE.Group {
  const g = new THREE.Group();
  g.add(cyl(0.14, 0.22, h * 0.3, 0x5a3a26, 6));
  for (let i = 0; i < 3; i++) put(g, cone(h * (0.3 - i * 0.065), h * 0.36, i === 1 ? color + 0x0a1408 : color, 7), 0, h * (0.2 + i * 0.22), 0, i * 0.6);
  return g;
}
export function cloud(seed: number, s = 1, mat?: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const m = mat ?? basic(0xffffff);
  for (let i = 0; i < 5; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), m);
    b.position.set((i - 2) * 1.5 * s, rnd(seed + i) * 0.7 * s, (rnd(seed + i * 3) - 0.5) * 1.2 * s);
    b.scale.set((1.5 + rnd(seed + i * 7) * 0.9) * s, (0.9 + rnd(seed + i * 5) * 0.5) * s, 1.3 * s);
    g.add(b);
  }
  return g;
}
export function rock(r: number, color = 0x8f8a9c, seed = 0): THREE.Mesh {
  const m = mesh(faceted(new THREE.DodecahedronGeometry(r, 0)), toon(color), 0.05);
  m.rotation.set(rnd(seed) * 3, rnd(seed + 1) * 3, 0);
  return m;
}
export function house(w: number, h: number, d: number, wall: number, roofC: number, chimney = true): THREE.Group {
  const g = new THREE.Group();
  const bg = new THREE.BoxGeometry(w, h, d); bg.translate(0, h / 2, 0);
  g.add(mesh(bg, new THREE.MeshToonMaterial({ map: facadeTex(wall), gradientMap: toon(wall).gradientMap }), 0.05));
  put(g, roof(w, d, h * 0.5 + 0.7, roofC), 0, h, 0);
  if (chimney) put(g, box(0.5, 1.2, 0.5, 0x8a5a44), w * 0.24, h + 0.25, 0);
  return g;
}
export function lantern(color = 0xffc85a, r = 0.16): THREE.Group {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), basic(color)));
  g.add(sprite3D('glow', r * 9, color, true, 0.7));
  return g;
}
export function flower(color: number, h = 0.5): THREE.Group {
  const g = new THREE.Group();
  g.add(cyl(0.025, 0.03, h, 0x3f8f4a, 5, 0));
  put(g, ball(0.11, color, true, 0.02), 0, h, 0);
  return g;
}
export function paperBoat(): THREE.Group {
  const g = new THREE.Group();
  const hg = new THREE.ConeGeometry(1, 0.6, 4); hg.rotateY(PI / 4); hg.rotateX(PI); hg.scale(1.7, 1, 0.8); hg.translate(0, 0.3, 0);
  g.add(mesh(faceted(hg), toon(0xfffaf0), 0.05));
  const sg = new THREE.ConeGeometry(0.62, 1.1, 4); sg.rotateY(PI / 4); sg.scale(1, 1, 0.12); sg.translate(1.0, 1.0, 0);
  g.add(mesh(faceted(sg), toon(0xfff2dc), 0.04));
  return g;
}
export function mushroom(h: number, cap: number, glow = false): THREE.Group {
  const g = new THREE.Group();
  g.add(cyl(h * 0.14, h * 0.2, h * 0.7, 0xfff4e6, 8));
  const capM = mesh(new THREE.SphereGeometry(h * 0.48, 14, 8, 0, PI * 2, 0, PI / 2), toon(cap), 0.04);
  capM.position.y = h * 0.62; g.add(capM);
  for (let i = 0; i < 5; i++) {
    const a = i * 1.26, r = h * 0.3;
    put(g, ball(h * 0.07, 0xffffff, false, 0), Math.cos(a) * r, h * 0.62 + h * 0.34, Math.sin(a) * r);
  }
  if (glow) put(g, sprite3D('glow', h * 2.4, cap, true, 0.55), 0, h * 0.8, 0);
  return g;
}
export function wheel(r: number, color = 0x8a5a3c, spokes = 8): THREE.Group {
  const g = new THREE.Group();
  g.add(mesh(new THREE.TorusGeometry(r, r * 0.07, 6, 22), toon(color), 0.04));
  for (let i = 0; i < spokes; i++) {
    const s = box(r * 0.07, r, r * 0.07, color, 0.02); s.rotation.z = (i / spokes) * TAU; g.add(s);
    const p = box(r * 0.42, r * 0.08, r * 0.5, color - 0x101010, 0.03);
    p.position.set(Math.cos((i / spokes) * TAU) * r, Math.sin((i / spokes) * TAU) * r, 0);
    p.rotation.z = (i / spokes) * TAU + PI / 2; g.add(p);
  }
  return g;
}
let clockTexCached: THREE.Texture | null = null;
export function clockTex(): THREE.Texture {
  if (!clockTexCached) {
    clockTexCached = canvasTex(128, 128, c => {
      c.fillStyle = '#fff7e2'; c.beginPath(); c.arc(64, 64, 62, 0, 7); c.fill();
      c.lineWidth = 7; c.strokeStyle = '#c98a2b'; c.stroke();
      c.fillStyle = '#3a2418';
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU; c.save(); c.translate(64 + Math.sin(a) * 48, 64 - Math.cos(a) * 48); c.rotate(a);
        c.fillRect(-2.5, -7, 5, i % 3 === 0 ? 15 : 9); c.restore();
      }
    });
  }
  return clockTexCached;
}
export function clock(r: number): { g: THREE.Group; hh: THREE.Mesh; mh: THREE.Mesh } {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.CircleGeometry(r, 28), new THREE.MeshBasicMaterial({ map: clockTex(), side: THREE.DoubleSide })));
  g.add(mesh(new THREE.TorusGeometry(r, r * 0.09, 6, 24), toon(0xc98a2b), 0.03));
  const hand = (len: number, w: number) => { const hg = new THREE.BoxGeometry(w, len, 0.02); hg.translate(0, len / 2, 0); const m = new THREE.Mesh(hg, basic(0x2a1c2e)); m.position.z = 0.03; g.add(m); return m; };
  return { g, hh: hand(r * 0.5, r * 0.09), mh: hand(r * 0.78, r * 0.06) };
}

export function castle(): THREE.Group {
  const g = new THREE.Group();
  const stone = 0xece6f5, rc = 0x3f72e0, dark = 0x33456f;
  put(g, box(10, 6.5, 6, stone));
  put(g, box(4.2, 11.5, 4.2, 0xf6f1ff), 0, 0, -0.6);
  put(g, cone(3.4, 4.8, rc, 4), 0, 11.5, -0.6);
  for (const [x, z, hh] of [[-5.6, 2.6, 8.5], [5.6, 2.6, 8.5], [-5.6, -3, 10], [5.6, -3, 10]]) {
    put(g, cyl(1.5, 1.65, hh, stone, 12), x, 0, z);
    put(g, cone(2.1, 3.8, rc, 12), x, hh, z);
    put(g, box(0.5, 0.9, 0.12, dark, 0), x, hh * 0.62, z + 1.56);
    put(g, cyl(0.04, 0.04, 1.3, 0x3a2418, 5, 0), x, hh + 3.7, z);
    put(g, box(0.8, 0.45, 0.04, 0xe63946, 0.02), x + 0.42, hh + 4.45, z);
  }
  put(g, box(2.8, 3.6, 0.3, 0x6b3f2a), 0, 0, 3.0);
  put(g, box(1.0, 1.5, 0.14, dark, 0), 0, 8, 1.55);
  for (let i = -4; i <= 4; i += 2) put(g, box(0.9, 0.7, 0.9, stone), i, 6.5, 2.6);
  return g;
}

export const BRIDGE_RISE = 3.3;
export const bridgeY = (u: number) => Math.sin(clamp(u) * PI) * BRIDGE_RISE + 0.4;
export function bridge(len = 18, w = 3.6): THREE.Group {
  const g = new THREE.Group();
  const N = 12;
  for (let i = 0; i < N; i++) {
    const u0 = i / N, u1 = (i + 1) / N, um = (u0 + u1) / 2;
    const x = (um - 0.5) * len, y = bridgeY(um) - 0.4, dy = bridgeY(u1) - bridgeY(u0), dx = len / N;
    const s = box(Math.hypot(dx, dy) + 0.06, 0.42, w, 0xd9b48a);
    s.position.set(x, y, 0); s.rotation.z = Math.atan2(dy, dx); g.add(s);
    for (const zz of [-w / 2, w / 2]) put(g, box(0.16, 0.85, 0.16, 0x8a5a3c), x, y + 0.4, zz);
  }
  for (const xx of [-len * 0.5, len * 0.5]) put(g, box(1.4, 1.2, w + 0.5, 0xb8a49a), xx, -0.3, 0);
  return g;
}

export interface Town {
  g: THREE.Group; curve: THREE.CatmullRomCurve3; water: THREE.ShaderMaterial; lamps: THREE.Group; cloudMat: THREE.MeshBasicMaterial;
  zAt: (x: number) => number; at: (s: number) => { p: THREE.Vector3; ang: number; dx: number; dz: number };
}
export function buildTown(): Town {
  const r = mulberry(11);
  const g = new THREE.Group();
  g.add(disc(560, 0x7fcf66));
  const pts = [[-120, -4], [-86, 8], [-56, -8], [-28, 7], [-6, -6], [16, -3], [38, 6], [60, -2], [86, 6], [124, 0]].map(([x, z]) => new THREE.Vector3(x, 0, z));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
  const water = waterMat(1);
  g.add(ribbon(curve, 13.4, 200, toon(0xf3e4b8), 0.03));
  g.add(ribbon(curve, 10.6, 260, water, 0.08));
  const table = Array.from({ length: 241 }, (_, i) => curve.getPointAt(i / 240));
  const zAt = (x: number) => { let best = table[0]; for (const p of table) if (Math.abs(p.x - x) < Math.abs(best.x - x)) best = p; return best.z; };
  const at = (s: number) => {
    const u = clamp(s), p = curve.getPointAt(u), t = curve.getTangentAt(u);
    return { p, ang: Math.atan2(-t.z, t.x), dx: t.x, dz: t.z };
  };
  const lamps = new THREE.Group(); g.add(lamps);
  const walls = [0xf2d6b3, 0xe9a27a, 0xf6e6c4, 0xd98f6a, 0xcfe0ea, 0xf0c36d, 0xf2b8c6];
  const roofs = [0xb5473c, 0x3f6fb5, 0x8a4fa3, 0x2f8f83, 0xc96a2b];
  const pick = (a: number[]) => a[Math.floor(r() * a.length)];
  for (let x = -112; x <= 116; x += 7.2) for (const side of [-1, 1]) for (let row = 0; row < 2; row++) {
    const xx = x + (r() - 0.5) * 3;
    const zz = zAt(xx) + side * (11.5 + row * 9 + r() * 4);
    const kind = r(), w = 3.6 + r() * 1.8, h = 3 + r() * 2.8, d = 3.4 + r() * 1.6, wc = pick(walls), rc = pick(roofs), chim = r() > 0.4, ry = (r() - 0.5) * 0.5;
    if (Math.abs(xx - 8) < 6.5) continue;
    if (side > 0 && xx > 13 && xx < 55) continue;
    if (side < 0 && xx > 22 && xx < 62 && row === 1) continue;
    if (kind < 0.18) { put(g, tree(4 + r() * 2, 0x4fb85a, x), xx, 0, zz); continue; }
    put(g, house(w, h, d, wc, rc, chim), xx, 0, zz, ry);
    put(lamps, lantern(0xffc85a, 0.2), xx, h * 0.5, zz - side * (d / 2 + 0.6));
  }
  put(g, hill(28, 6.5, 0x6cc25e), 42, 0, -46);
  put(g, castle(), 42, 5.2, -46, 0, 1.3);
  put(g, disc(15, 0xeedfbe, 0.045), 33, 0, 17);
  const zb = zAt(8);
  put(g, bridge(19, 3.6), 8, 0, zb, PI / 2);
  for (const s of [-1, 1]) put(lamps, lantern(0xffd27a, 0.22), 8, 2.2, zb + s * 9.6);
  for (let i = 0; i < 100; i++) {
    const x = -135 + r() * 280, side = r() > 0.5 ? 1 : -1, z = zAt(x) + side * (32 + r() * 75), kind = r(), hh = r();
    if (Math.hypot(x - 42, z + 46) < 31 || Math.hypot(x - 33, z - 17) < 17) continue;
    put(g, kind > 0.5 ? tree(4 + hh * 3, 0x4fb85a, i) : pine(5 + hh * 3), x, 0, z);
  }
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU + r() * 0.3, rad = 200 + r() * 90;
    put(g, hill(40 + r() * 40, 16 + r() * 26, i % 2 ? 0x6aa9c9 : 0x79b98a), Math.cos(a) * rad, 0, Math.sin(a) * rad);
  }
  const cloudMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (let i = 0; i < 18; i++) put(g, cloud(i * 9, 2.2 + r() * 2, cloudMat), -170 + r() * 340, 36 + r() * 26, -150 + r() * 210);
  return { g, curve, water, lamps, zAt, at, cloudMat };
}
export function useTown(k: Kit, town: Town, rainbow: number, night: boolean, cloudHex = night ? 0x5f69b0 : 0xffffff) {
  if (town.g.parent !== k.root) k.root.add(town.g);
  town.cloudMat.color.setHex(cloudHex);
  town.water.uniforms.uRainbow.value = rainbow;
  town.lamps.visible = night;
}

export interface Book { g: THREE.Group; cover: THREE.Group; glow: THREE.Mesh }
export function book(): Book {
  const g = new THREE.Group();
  put(g, box(6, 0.25, 8, 0x8e2b3a));
  put(g, box(5.6, 0.55, 7.6, 0xfff6e0), 0, 0.25, 0);
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 7.4).rotateX(-PI / 2), glowMat(0xfff2b0, 0));
  glow.position.y = 0.83; g.add(glow);
  const cover = new THREE.Group(); cover.position.set(-3, 0.8, 0); g.add(cover);
  put(cover, box(6, 0.25, 8, 0x9e2f40), 3, 0, 0);
  put(cover, box(4.8, 0.06, 6.6, 0xffd166, 0), 3, 0.25, 0);
  put(cover, box(4.4, 0.07, 6.2, 0x9e2f40, 0), 3, 0.25, 0);
  put(cover, box(1.7, 0.09, 1.7, 0xffd166, 0), 3, 0.25, 0, PI / 4);
  return { g, cover, glow };
}

export function straightRiver(len: number, width: number, rainbow: number, z = 0, y = 0.07, base = 0x35a7e8, deep = 0x1f6fc4) {
  const curve = new THREE.LineCurve3(new THREE.Vector3(-len / 2, 0, z), new THREE.Vector3(len / 2, 0, z));
  const mat = waterMat(rainbow, base, deep);
  return { mesh: ribbon(curve, width, 8, mat, y), mat };
}

export class Fireworks {
  private bursts: { sp: THREE.Sprite[] }[] = [];
  constructor(parent: THREE.Object3D, n = 4, m = 22, private R = 6) {
    const cols = [0xff6b8a, 0xffd166, 0x7fe3ff, 0xb388ff, 0x8dffb0];
    for (let j = 0; j < n; j++) {
      const sp = Array.from({ length: m }, () => { const s = sprite3D('glow', 1, cols[j % cols.length], true); parent.add(s); return s; });
      this.bursts.push({ sp });
    }
  }
  update(T: number, cx: number, cy: number, cz: number, spread = 26, period = 1.7) {
    this.bursts.forEach((b, j) => {
      const tt = T + j * (period / this.bursts.length) * 1.37;
      const n = Math.floor(tt / period), ph = (tt % period) / period;
      const ox = cx + (rnd(n * 3.1 + j) - 0.5) * spread, oy = cy + (rnd(n * 5.3 + j * 2) - 0.5) * spread * 0.35, oz = cz + (rnd(n * 7.7 + j) - 0.5) * 8;
      const r = eo(ph) * this.R * (0.7 + rnd(n + j) * 0.6);
      b.sp.forEach((s, i) => {
        const a = (i / b.sp.length) * TAU, e = (rnd(i * 1.9 + j) - 0.5) * 1.6;
        s.position.set(ox + Math.cos(a) * Math.cos(e) * r, oy + Math.sin(e) * r + Math.sin(a) * Math.cos(e) * r * 0.9 - ph * ph * 2.2, oz);
        s.scale.setScalar(1.5 * (1 - ph * 0.6));
        setOp(s, (1 - ph * ph) * 0.95);
      });
    });
  }
}

/* ───────────── 通用模板道具：物理沙漏 / 桌 / 饭碗 ───────────── */
export function hourglass(h = 1.0, sand = 0xf2c14e, wood = 0x8a5a3c) {
  const g = new THREE.Group();
  const body = new THREE.Group(); put(g, body, 0, h / 2, 0);
  const r = h * 0.3, plate = h * 0.07, bulb = h / 2 - plate;
  for (const s of [-1, 1]) put(body, cyl(r * 1.15, r * 1.15, plate, wood, 18, 0.025), 0, s > 0 ? h / 2 - plate : -h / 2, 0);
  for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU + 0.5; put(body, cyl(h * 0.024, h * 0.024, h - plate * 2, wood, 6, 0), Math.cos(a) * r * 1.02, -h / 2 + plate, Math.sin(a) * r * 1.02); }
  const glassMat = new THREE.MeshBasicMaterial({ color: 0xdff4ff, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide });
  body.add(new THREE.Mesh(new THREE.ConeGeometry(r * 0.92, bulb, 20, 1, true).rotateX(PI).translate(0, bulb / 2, 0), glassMat));
  body.add(new THREE.Mesh(new THREE.ConeGeometry(r * 0.92, bulb, 20, 1, true).translate(0, -bulb / 2, 0), glassMat));
  const sandMat = toon(sand);
  const top = new THREE.Mesh(new THREE.ConeGeometry(r * 0.84, bulb * 0.92, 18).rotateX(PI).translate(0, (bulb * 0.92) / 2, 0), sandMat);
  const pile = new THREE.Mesh(new THREE.ConeGeometry(r * 0.84, bulb * 0.62, 18).translate(0, (bulb * 0.62) / 2, 0), sandMat);
  pile.position.y = -bulb;
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(h * 0.014, h * 0.014, 1, 6).translate(0, -0.5, 0), sandMat);
  body.add(top, pile, stream);
  const fill = (p0: number, T = 0, flowing = true) => {
    const p = clamp(p0), a = Math.cbrt(1 - p), b = Math.cbrt(p);
    top.visible = p < 0.999; top.scale.setScalar(Math.max(0.001, a));
    pile.visible = p > 0.001; pile.scale.setScalar(Math.max(0.001, b));
    stream.visible = flowing && p > 0.001 && p < 0.999;
    stream.scale.set(1 + 0.25 * Math.sin(T * 31), bulb * (1 - 0.62 * b), 1 + 0.25 * Math.cos(T * 27));
  };
  const set = (p0: number, T = 0, flowing = true) => { body.rotation.z = 0; fill(p0, T, flowing); };
  const flip = (e0: number, pBefore: number, T = 0) => {
    const e = clamp(e0);
    if (e <= 0) { set(pBefore, T); return; }
    if (e >= 1) { set(1 - pBefore, T); return; }
    if (e < 0.5) { body.rotation.z = e * PI; fill(pBefore, T, false); } else { body.rotation.z = (e - 1) * PI; fill(1 - pBefore, T, false); }
  };
  set(0);
  return { g, body, set, flip };
}
export function riceBowl(r = 0.22, color = 0x3d7fd9): THREE.Group {
  const g = new THREE.Group();
  put(g, cyl(r * 0.5, r * 0.42, r * 0.16, 0xf4f6ff, 16, 0.02));
  const bowl = mesh(new THREE.CylinderGeometry(r, r * 0.5, r * 0.72, 20).translate(0, r * 0.36, 0), toon(color), 0.025);
  put(g, bowl, 0, r * 0.14, 0);
  put(g, cyl(r * 1.02, r * 1.0, r * 0.07, 0xf4f6ff, 20, 0), 0, r * 0.83, 0);
  const rice = ball(r * 0.86, 0xffffff, true, 0.02); rice.scale.set(1, 0.55, 1); put(g, rice, 0, r * 0.9, 0);
  return g;
}
