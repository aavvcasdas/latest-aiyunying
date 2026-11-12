// 《雨爱》共用布景件：雨巷、屋内、彩虹、接雨的蓝饭盆、涟漪、相框……
// 全部是几何体 + Canvas 贴图；会动的东西都是 set(进度)，不存状态（同一帧永远画出同一个样子）。
import * as THREE from 'three';
import type { Kit } from '@tpl/core';
import { ball, basic, box, canvasTex, clamp01, cloud, cyl, glowMat, hash, house, lantern, lerp, mesh, put, sprite, toon, tree } from '@tpl/kit';
import { plant, rain, table, umbrella, type Rain } from '@tpl/props';
import { hill, straightRiver } from '@tpl/sets';
import type { Beat } from '@tpl/timeline';

export const PI = Math.PI;
export const many = <T,>(n: number, f: (i: number) => T): T[] => Array.from({ length: n }, (_, i) => f(i));
export const frac = (x: number) => x - Math.floor(x);
export const beatSq = (bt: Beat, amt = 0.05) => bt.pulse * amt * (bt.down ? 1 : 0.6);

/** 实测拍点（cues.json 的 beat）：四分音符 0.74066s，first 是一个小节的第一拍 */
export const BEAT = { period: 0.74066, first: 12.8178 };
/** 全片从 first 起数过了多少拍（带小数）。循环的雨滴 / 涟漪都挂在它上面，所以落点在拍子上 */
export const beats = (T: number) => (T - BEAT.first) / BEAT.period;
/** 第 n 拍（四分音符，可带 .5）落在全片第几秒 */
export const tb = (n: number) => BEAT.first + n * BEAT.period;
/** 水洼的位置（lane() 里那五个），涟漪落在它们上面 */
export const PUD: [number, number][] = [[-3.2, 0.9], [2.6, 0.5], [5.6, -1.2], [-6.5, -0.8], [0.2, -1.6]];

/** 每个人的伞色（一人一把，全片不换） */
export const BROLLY = { whale: 0x6db8f2, claude: 0xf6a23c, doubao: 0xe85d75, gemini: 0xb197fc, kimi: 0xd0c2ff, qwen: 0x7fd1ae, zai: 0x59607a } as const;

/** 伞立在人身边（没有握伞的手）：x/z 是人的站位，伞柄在她右手边一点，伞面罩过头顶 */
export function holdBrolly(u: THREE.Object3D, x: number, y: number, z: number, lean = 0.1, dx = 0.38) {
  u.position.set(x + dx, y + 0.72, z - 0.06);
  u.rotation.set(0, 0, -lean);
}
export const brolly = (k: Kit, color: number, r = 1.2) => k.add(umbrella(r, color, 1.6));

// ---------- 雨 ----------
export function makeRain(k: Kit, n = 160, w = 18, d = 8, x = 0, z = -1, top = 8, color = 0xdcecff): Rain {
  const r = rain(n, w, d, top, color);
  k.add(r.g, x, 0, z);
  return r;
}
/** 雨量 0–1：只改透明度（雨丝共用一个材质） */
export function rainOp(r: Rain, o: number) {
  const m = (r.g.children[0] as THREE.Mesh).material as THREE.MeshBasicMaterial;
  m.opacity = clamp01(o) * 0.6;
  r.g.visible = o > 0.02;
}

// ---------- 涟漪（平贴地面的圆环） ----------
export function ripple(color = 0xeaf6ff): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.RingGeometry(0.82, 1, 36).rotateX(-PI / 2), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8, depthWrite: false, fog: false }));
  m.renderOrder = 2;
  return m;
}
/** age 0–1：从小到大、从实到虚 */
export function setRipple(m: THREE.Mesh, x: number, z: number, age: number, size = 0.7, y = 0.035) {
  const a = clamp01(age);
  m.position.set(x, y, z);
  m.scale.setScalar(0.06 + a * size);
  (m.material as THREE.MeshBasicMaterial).opacity = (1 - a) * 0.85;
  m.visible = a > 0 && a < 1;
}
/** 水洼：一块发亮的扁圆 */
export function puddle(rx: number, rz: number, color = 0xb9d8f2, op = 0.6): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CircleGeometry(1, 28).rotateX(-PI / 2), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op, depthWrite: false }));
  m.scale.set(rx, 1, rz);
  return m;
}

// ---------- 雨巷 ----------
const WALLS = [0xf6d9c8, 0xd8e6f2, 0xf3e6b8, 0xcfe3d0, 0xe9d4ee, 0xf6cfc0, 0xd4e0f6];
const ROOFS = [0x7a8fb8, 0xb86f6f, 0x6f9a8a, 0x8f7ab0, 0xb8906a, 0x6f88b0, 0xa86f8a];
export function lampPost(on = 1): THREE.Group {
  const g = new THREE.Group();
  put(g, cyl(0.06, 0.09, 3.1, 0x3a4258, 8, 0.03));
  put(g, box(0.5, 0.06, 0.06, 0x3a4258, 0.02), 0.22, 3.05, 0);
  const l = lantern(0xffd58a, 0.17); put(g, l, 0.44, 2.86, 0);
  (l.children[1] as THREE.Sprite).scale.setScalar(1.2 + on * 2.6);
  return g;
}
export interface LaneOpts { ground?: number; canal?: boolean; lamp?: number; clouds?: number | null; puddles?: boolean; hills?: [number, number] }
/**
 * 雨巷：湿地面 + 后排一溜小屋（z≈−8）+ 路灯（z=−2.7）+ 近处一条小水渠（z=3，可漂纸船）+ 远山 + 压在头顶的云。
 * 人物站在 z≈0 一线；相机在 z≥6。
 */
export const CANAL_Z = 3.1;
export function lane(k: Kit, o: LaneOpts = {}) {
  const ground = o.ground ?? 0x5f7896;
  const g = new THREE.Mesh(new THREE.CircleGeometry(160, 48).rotateX(-PI / 2), toon(ground)); k.add(g, 0, 0, 0);
  many(9, (i) => {
    const w = 3.6 + hash(i * 3 + 1) * 1.4, h = 2.9 + hash(i * 3 + 2) * 1.5;
    k.add(house(w, h, 3.4, WALLS[i % 7], ROOFS[(i * 3) % 7], i % 2 === 0), -21 + i * 5.2, 0, -8.2 - hash(i + 20) * 0.8);
  });
  many(6, (i) => k.add(tree(2.6 + hash(i) * 1.2, i % 2 ? 0x5f9a7a : 0x6fae86, i + 3), -17 + i * 6.8 + 1.4, 0, -5.4));
  many(5, (i) => k.add(lampPost(o.lamp ?? 0.3), -12 + i * 6, 0, -2.7));
  const [c1, c2] = o.hills ?? [0x7f9ab8, 0x8faac4];
  many(12, (i) => { const a = (i / 12) * PI * 2 + 0.2; k.add(hill(36 + hash(i) * 30, 12 + hash(i + 3) * 16, i % 2 ? c1 : c2), Math.cos(a) * 150, 0, Math.sin(a) * 150); });
  if (o.clouds !== null) { const m = basic(o.clouds ?? 0xaebccd); many(10, (i) => k.add(cloud(i * 7 + 2, 3 + hash(i) * 2.5, m), -70 + i * 15, 24 + hash(i + 1) * 9, -45 - hash(i + 2) * 40)); }
  if (o.canal !== false) {
    k.add(straightRiver(90, 1.7, 0, CANAL_Z, 0.05, 0x6fb4e8, 0x4f8fd0).mesh);
    k.add(box(90, 0.12, 0.22, 0x9aa5b8, 0.02), 0, 0, CANAL_Z - 0.98);
    k.add(box(90, 0.12, 0.22, 0x9aa5b8, 0.02), 0, 0, CANAL_Z + 0.98);
  }
  if (o.puddles !== false) {
    const P: [number, number, number, number][] = [[-3.2, 0.9, 1.1, 0.5], [2.6, 0.5, 0.9, 0.42], [5.6, -1.2, 1.2, 0.5], [-6.5, -0.8, 1.0, 0.45], [0.2, -1.6, 0.8, 0.36]];
    for (const [x, z, rx, rz] of P) k.add(puddle(rx, rz), x, 0.02, z);
  }
}

// ---------- 屋内（本鲸的小工坊：门常开，后墙上真的开了一扇大窗，窗外是雨巷） ----------
export const WIN = { x: 0.6, y: 1.05, w: 4.6, h: 2.8, z: -4.5 };
export const TABLE = { x: 4.3, z: -1.3 };
/** 左墙面上五个相框的中心（x, y），贴在后墙 z = WIN.z 上 */
export const FRAMES: [number, number][] = [[-5.15, 3.0], [-3.9, 3.2], [-2.65, 3.0], [-4.55, 1.75], [-3.25, 1.75]];
export interface Parlor { setGlass: (T: number, wet: number) => void; setFog: (o: number) => void; rain: Rain }
export function parlor(k: Kit, o: { rug?: number; outside?: number; lamp?: number } = {}): Parlor {
  const W = 13.6, D = 9, H = 5.6, wall = 0xf4e4ca, trim = 0x8a5a3c;
  const { x, y, w, h, z } = WIN;
  // 地板 + 两侧墙
  k.add(box(W, 0.2, D + 0.6, 0xc99c6c, 0), 0, -0.2, 0);
  many(7, (i) => k.add(box(W - 0.6, 0.012, 0.03, trim, 0), 0, 0, -D / 2 + ((i + 0.5) * D) / 7));
  k.add(box(0.3, H, D + 0.6, wall, 0), -W / 2 + 0.15, 0, 0);
  k.add(box(0.3, H, D + 0.6, wall, 0), W / 2 - 0.15, 0, 0);
  // 后墙：围着窗洞的四块
  const L = x - w / 2 + W / 2, R = W / 2 - (x + w / 2);
  k.add(box(L, H, 0.3, wall, 0), -W / 2 + L / 2, 0, z - 0.15);
  k.add(box(R, H, 0.3, wall, 0), W / 2 - R / 2, 0, z - 0.15);
  k.add(box(w, y, 0.3, wall, 0), x, 0, z - 0.15);
  k.add(box(w, H - y - h, 0.3, wall, 0), x, y + h, z - 0.15);
  k.add(box(W - 0.6, 0.26, 0.08, trim, 0), 0, 0, z + 0.04);
  const rug = new THREE.Mesh(new THREE.CircleGeometry(1, 40).rotateX(-PI / 2), toon(o.rug ?? 0xa9c6e4));
  rug.scale.set(3.4, 1, 2.2); k.add(rug, 0, 0.012, 0.6);
  // 窗框、窗棂、窗台
  k.add(box(w + 0.36, 0.18, 0.16, trim, 0.03), x, y + h, z + 0.05);
  k.add(box(0.18, h, 0.16, trim, 0.03), x - w / 2 - 0.09, y, z + 0.05);
  k.add(box(0.18, h, 0.16, trim, 0.03), x + w / 2 + 0.09, y, z + 0.05);
  k.add(box(0.08, h, 0.06, trim, 0), x, y, z + 0.02);
  k.add(box(w, 0.08, 0.06, trim, 0), x, y + h * 0.56, z + 0.02);
  k.add(box(w + 0.7, 0.14, 0.9, 0x6f4630, 0.03), x, y - 0.14, z - 0.05); // 窗台（里外各探出一截）
  // 窗外：地面、对面的小屋、树、一盏路灯
  const out = new THREE.Mesh(new THREE.CircleGeometry(120, 40).rotateX(-PI / 2), toon(o.outside ?? 0x5f7896)); k.add(out, 0, -0.22, -60);
  many(5, (i) => k.add(house(3.6 + hash(i) * 1.2, 2.8 + hash(i + 5) * 1.3, 3.2, WALLS[(i + 2) % 7], ROOFS[(i * 2 + 1) % 7], i % 2 === 0), -9.5 + i * 5.2, -0.2, -17 - hash(i + 9)));
  many(3, (i) => k.add(tree(2.8 + hash(i + 2), i % 2 ? 0x5f9a7a : 0x6fae86, i + 11), -4.2 + i * 4.9, -0.2, -12.5));
  k.add(lampPost(o.lamp ?? 0.6), 2.6, -0.2, -9);
  const r = rain(90, 9, 5, 7, 0xdcecff); k.add(r.g, x, 0, -8.5);
  // 玻璃上的雾气（可以被擦开）与往下滑的水珠
  const fog = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: 0xeef3f8, transparent: true, opacity: 0, depthWrite: false }));
  fog.renderOrder = 3; k.add(fog, x, y + h / 2, z - 0.02);
  const setFog = (op: number) => { (fog.material as THREE.MeshBasicMaterial).opacity = clamp01(op); fog.visible = op > 0.01; };
  setFog(0);
  const drops = many(16, (i) => { const d = k.add(sprite('drop', 0.13 + hash(i + 40) * 0.08, 0xeaf6ff, false, 0.85)); d.renderOrder = 4; return d; });
  const setGlass = (T: number, wet: number) => {
    drops.forEach((d, i) => {
      const ph = frac(T * (0.16 + hash(i + 7) * 0.2) + hash(i));
      d.position.set(x + (hash(i * 3 + 1) - 0.5) * (w - 0.5), y + h - 0.15 - ph * (h - 0.3), z);
      (d.material as THREE.SpriteMaterial).opacity = wet * 0.85 * Math.sin(ph * PI);
      d.visible = wet > 0.02;
    });
  };
  // 茶桌（千问的位置）
  k.add(table(2.4, 1.2, 0.8, 0xb9824f), TABLE.x, 0, TABLE.z);
  const pot = new THREE.Group();
  put(pot, ball(0.2, 0xf4f6ff, false, 0.02), 0, 0.2, 0); put(pot, cyl(0.07, 0.09, 0.07, 0x7fd1ae, 10, 0.02), 0, 0.38, 0);
  const sp = cyl(0.03, 0.045, 0.24, 0xf4f6ff, 8, 0.02); sp.rotation.z = -0.9; put(pot, sp, 0.2, 0.2, 0);
  k.add(pot, TABLE.x - 0.35, 0.8, TABLE.z);
  many(3, (i) => k.add(cyl(0.075, 0.06, 0.1, i === 1 ? 0xf6a23c : 0x6db8f2, 10, 0.02), TABLE.x + 0.2 + i * 0.3, 0.8, TABLE.z + 0.18));
  k.add(plant(1.25), 5.9, 0, -3.7);
  k.add(cyl(0.75, 0.8, 0.16, 0x8fa8d8, 18, 0.03), -4.9, 0, 1.0); // 狐狸打盹的垫子
  return { setGlass, setFog, rain: r };
}
/** 茶壶口冒的热气：n 团烟往上飘。amount 0–1 */
export function steam(k: Kit, n = 7) {
  const puffs = many(n, () => k.add(sprite('smoke', 0.5, 0xffffff, false, 0.5)));
  return (T: number, amount: number, x = TABLE.x - 0.12, y = 1.28, z = TABLE.z) => {
    puffs.forEach((s, i) => {
      const ph = frac(T * 0.28 + i / n);
      s.position.set(x + Math.sin(ph * 5 + i) * 0.16 * (0.4 + ph), y + ph * 1.5, z + 0.02);
      s.scale.setScalar(0.22 + ph * 0.55);
      (s.material as THREE.SpriteMaterial).opacity = amount * 0.5 * Math.sin(ph * PI);
      s.visible = amount > 0.02;
    });
  };
}

// ---------- 相框（墙上的「表情」与「记忆」） ----------
export type Weather = 'sun' | 'cloud' | 'rain' | 'warm' | 'bow';
function paint(c: CanvasRenderingContext2D, W: number, H: number, kind: Weather) {
  const sky = { sun: ['#8fd0ff', '#fff3c4'], cloud: ['#aebccd', '#dde5ee'], rain: ['#5f7896', '#9fb3c8'], warm: ['#ffd9a0', '#fff1d6'], bow: ['#8fd0ff', '#eaf8ff'] }[kind];
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, sky[0]); g.addColorStop(1, sky[1]);
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  if (kind === 'sun') { c.fillStyle = '#ffd84a'; c.beginPath(); c.arc(W * 0.78, H * 0.24, H * 0.14, 0, PI * 2); c.fill(); }
  if (kind === 'cloud' || kind === 'rain') {
    c.fillStyle = kind === 'cloud' ? '#f4f7fb' : '#7f93ab';
    for (const [x, y, r] of [[0.22, 0.2, 0.13], [0.36, 0.16, 0.16], [0.52, 0.21, 0.13], [0.74, 0.17, 0.14], [0.86, 0.22, 0.1]]) { c.beginPath(); c.arc(W * x, H * y, H * r, 0, PI * 2); c.fill(); }
  }
  if (kind === 'rain') { c.strokeStyle = 'rgba(234,246,255,.85)'; c.lineWidth = 5; for (let i = 0; i < 16; i++) { const x = W * (0.06 + hash(i) * 0.9), y = H * (0.34 + hash(i + 9) * 0.5); c.beginPath(); c.moveTo(x, y); c.lineTo(x - 8, y + 30); c.stroke(); } }
  if (kind === 'bow') { const cols = ['#ff6b6b', '#ffa94d', '#ffe066', '#8ce99a', '#66d9e8', '#74a8ff', '#b197fc']; c.lineWidth = 9; cols.forEach((col, i) => { c.strokeStyle = col; c.beginPath(); c.arc(W * 0.5, H * 0.98, H * 0.86 - i * 9, PI, PI * 2); c.stroke(); }); }
}
/** 把五个相框挂到左墙面上（位置见 FRAMES），返回这五个相框 */
export function wallFrames(k: Kit, kinds: Weather[], size = 1.05): THREE.Group[] {
  return FRAMES.map(([fx, fy], i) => k.add(pictureFrame(size, size, kinds[i] ?? 'warm'), fx, fy, WIN.z + 0.04));
}
export function pictureFrame(w: number, h: number, kind: Weather, wood = 0x8a5a3c): THREE.Group {
  const g = new THREE.Group();
  put(g, box(w + 0.16, h + 0.16, 0.06, wood, 0.03), 0, -h / 2 - 0.08, 0); // 原点在相框中心
  const tex = canvasTex(256, Math.round((256 * h) / w), (c) => paint(c, 256, Math.round((256 * h) / w), kind));
  put(g, new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex })), 0, 0, 0.04);
  return g;
}

// ---------- 彩虹 ----------
const BOW = [0xff6b6b, 0xffa94d, 0xffe066, 0x8ce99a, 0x66d9e8, 0x74a8ff, 0xb197fc];
export interface Rainbow { g: THREE.Group; set: (p: number, op?: number) => void }
/** 彩虹：七道半圆环，set(p) 从左往右画出来（p 0–1），op 是整体透明度。原点在圆心（放在地平线上） */
export function rainbow(R = 40, band = 1.1): Rainbow {
  const g = new THREE.Group(), SEG = 72;
  const bands = BOW.map((c, i) => {
    const geo = new THREE.RingGeometry(R - (i + 1) * band, R - i * band, SEG, 1, 0, PI);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false, fog: false }));
    m.scale.x = -1; m.renderOrder = -2; g.add(m);
    return m;
  });
  const set = (p: number, op = 0.8) => {
    const n = Math.floor(SEG * clamp01(p)) * 6;
    for (const b of bands) { b.geometry.setDrawRange(0, n); (b.material as THREE.MeshBasicMaterial).opacity = op; b.visible = n > 0 && op > 0.01; }
  };
  set(1);
  return { g, set };
}

// ---------- 接雨的蓝饭盆（本鲸的招牌道具，这支片里它不装饭，装雨） ----------
export interface RainBowl { g: THREE.Group; set: (level: number) => void }
export function rainBowl(r = 0.34): RainBowl {
  const g = new THREE.Group();
  put(g, cyl(r * 0.5, r * 0.42, r * 0.16, 0xf4f6ff, 16, 0.02));
  put(g, mesh(new THREE.CylinderGeometry(r, r * 0.5, r * 0.72, 22, 1, true).translate(0, r * 0.36, 0), new THREE.MeshToonMaterial({ color: 0x3d7fd9, side: THREE.DoubleSide, gradientMap: (toon(0x3d7fd9) as THREE.MeshToonMaterial).gradientMap }), 0.025), 0, r * 0.14, 0);
  put(g, cyl(r * 1.03, r * 1.0, r * 0.07, 0xf4f6ff, 22, 0), 0, r * 0.83, 0);
  const water = new THREE.Mesh(new THREE.CircleGeometry(1, 24).rotateX(-PI / 2), basic(0xa6dcff));
  g.add(water);
  const set = (level: number) => {
    const l = clamp01(level);
    water.position.y = r * (0.22 + 0.6 * l);
    water.scale.setScalar(r * lerp(0.58, 0.97, l));
  };
  set(0.3);
  return { g, set };
}

/** 一束从云缝里落下来的光（加色的梯形面片） */
export function sunShaft(w = 6, h = 26, color = 0xfff1c4): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(1, 1); geo.translate(0, -0.5, 0);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) if (pos.getY(i) < -0.5) pos.setX(i, pos.getX(i) * 2.2);
  const m = new THREE.Mesh(geo, glowMat(color, 0.35, true));
  m.scale.set(w, h, 1);
  return m;
}

/** 掠过地面的龙影（龙娘只从上方掠过，落在地上的是影子） */
export function dragonShadow(): THREE.Mesh {
  const tex = canvasTex(256, 128, (c) => {
    c.clearRect(0, 0, 256, 128); c.fillStyle = '#16203a';
    c.beginPath(); c.ellipse(128, 64, 70, 13, 0, 0, PI * 2); c.fill();
    c.beginPath(); c.moveTo(120, 60); c.lineTo(70, 6); c.lineTo(150, 50); c.fill();
    c.beginPath(); c.moveTo(120, 68); c.lineTo(70, 122); c.lineTo(150, 78); c.fill();
    c.beginPath(); c.moveTo(60, 64); c.lineTo(8, 52); c.lineTo(8, 76); c.fill();
    c.beginPath(); c.arc(204, 64, 16, 0, PI * 2); c.fill();
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(9, 4.5).rotateX(-PI / 2), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.4, depthWrite: false }));
  m.renderOrder = 1;
  return m;
}
