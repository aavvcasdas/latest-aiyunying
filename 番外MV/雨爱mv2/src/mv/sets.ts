// 《雨爱》自己的布景与小道具。引擎（src/engine）不认识它们；人物只用图集里现成的像素造型，这里不新画任何人。
//
// 三块场地，全片共用同一套尺寸（同一个场景连着几个镜头，摆位写成常量，切镜不跳位）：
//   lane()      雨巷：石板路 + 小河 + 小屋正面 + 路灯 + 远处的房子。相机在 +z，看向 −z
//   roomSet()   暖屋：后墙开一扇田字大窗，窗外是同一片阴天；茶桌、记忆绳、狐狸的垫子
//   windowStage() 窗台特写：小屋正面摆在原点，窗居中，雨只下在窗和相机之间那一小段
import * as THREE from 'three';
import type { AtlasData } from '../engine/actors';
import type { Kit } from '../engine/core';
import {
  ball, basic, box, canvasTex, clamp01, cloud, cone, cyl, disc, flower, glowMat, hash, house, lantern, lerp, mesh, pine, put, roof, setOp, sprite, toon, tree,
} from '../engine/kit';
import { cameraProp, plant, rain as rainProp, table, umbrella as umbrellaProp } from '../engine/props';
import { hill, straightRiver } from '../engine/sets';
import cues from './cues.json';

export const PI = Math.PI;
export const many = <T,>(n: number, f: (i: number) => T): T[] => Array.from({ length: n }, (_, i) => f(i));
/** 每句歌词的起点（秒），与 cues.json 同一份 */
export const S: number[] = cues.lines.map((l) => l.start);
/** 实测拍点：四分音符 0.74066 秒（81 BPM），八分音符 0.37033 秒 */
export const BEAT: number = cues.beat.period;
export const EIGHTH: number = cues.beat.eighth;

// ---------- 天：远山 + 云 ----------
export function skyline(k: Kit, o: { c1?: number; c2?: number; cloud?: number; n?: number; low?: number } = {}) {
  const c1 = o.c1 ?? 0x7fa593, c2 = o.c2 ?? 0x7d9bb5;
  many(12, (i) => { const a = (i / 12) * PI * 2 + 0.2; k.add(hill(36 + hash(i) * 30, 12 + hash(i + 3) * 16, i % 2 ? c1 : c2), Math.cos(a) * 170, 0, Math.sin(a) * 170); });
  const mat = basic(o.cloud ?? 0xd5dde8);
  const n = o.n ?? 11, low = o.low ?? 22;
  const cl = many(n, (i) => ({ m: k.add(cloud(i * 7 + 3, 2.2 + hash(i) * 2.2, mat)), x: -110 + i * (220 / n), y: low + hash(i + 1) * 16, z: -60 - hash(i + 2) * 60, v: 0.5 + hash(i + 5) * 0.5 }));
  return (T: number) => { for (const c of cl) c.m.position.set(((c.x + T * c.v + 130) % 260) - 130, c.y, c.z); };
}

// ---------- 雨、涟漪、玻璃上的雨痕 ----------
export interface RainFx { g: THREE.Group; set: (T: number, amount?: number) => void }
/** 雨：amount 0–1 控制雨丝的浓淡（同一场雨从「刚下」到「停」） */
export function rainFx(n = 220, w = 22, d = 7, top = 9, color = 0xdcebff): RainFx {
  const r = rainProp(n, w, d, top, color);
  const mat = (r.g.children[0] as THREE.Mesh).material as THREE.MeshBasicMaterial;
  return { g: r.g, set: (T, amount = 1) => { r.set(T); mat.opacity = 0.6 * clamp01(amount); r.g.visible = amount > 0.02; } };
}
export interface Ripples { g: THREE.Group; set: (T: number, amount?: number) => void }
/** 地上的涟漪：平躺的圆环，一圈圈放大变淡 */
export function ripples(n: number, w: number, d: number, color = 0xeaf4ff): Ripples {
  const g = new THREE.Group();
  const geo = new THREE.RingGeometry(0.8, 1, 28).rotateX(-PI / 2);
  const rs = many(n, (i) => { const m = new THREE.Mesh(geo, glowMat(color, 0.6)); m.position.set((hash(i * 3 + 1) - 0.5) * w, 0, (hash(i * 3 + 2) - 0.5) * d); g.add(m); return { m, ph: hash(i * 3 + 3), sp: 0.7 + hash(i + 40) * 0.6 }; });
  const set = (T: number, amount = 1) => { for (const r of rs) { const p = (T * r.sp + r.ph) % 1; r.m.scale.setScalar(0.08 + p * 0.42); (r.m.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.7 * clamp01(amount); r.m.visible = amount > 0.02; } };
  set(0);
  return { g, set };
}
/** 单个涟漪圈（落点卡拍用）：p 0→1 放大变淡 */
export function ringOne(color = 0xffffff) {
  const m = new THREE.Mesh(new THREE.RingGeometry(0.78, 1, 30).rotateX(-PI / 2), glowMat(color, 0.8));
  const set = (p: number, size = 0.5, op = 0.85) => { const q = clamp01(p); m.scale.setScalar(0.06 + q * size); (m.material as THREE.MeshBasicMaterial).opacity = (1 - q) * op; m.visible = q < 0.99; };
  set(1);
  return { m, set };
}
export interface GlassDrops { g: THREE.Group; set: (T: number, amount?: number) => void }
/** 顺着玻璃往下滑的雨珠。原点在玻璃中心 */
export function glassDrops(n: number, w: number, h: number): GlassDrops {
  const g = new THREE.Group();
  const ds = many(n, (i) => { const s = sprite('drop', 0.1 + hash(i + 7) * 0.08, 0xe4f2ff, false, 0.85); g.add(s); return { s, x: (hash(i * 2 + 1) - 0.5) * (w - 0.3), ph: hash(i * 2 + 2), sp: 0.12 + hash(i + 30) * 0.2 }; });
  const set = (T: number, amount = 1) => ds.forEach((d, i) => {
    const p = (T * d.sp + d.ph) % 1;
    d.s.position.set(d.x + Math.sin(p * 9 + i) * 0.03, h / 2 - 0.08 - p * p * (h - 0.16), 0);
    setOp(d.s, (i / n < amount ? 0.85 : 0) * Math.min(1, (1 - p) * 5, p * 12));
  });
  set(0);
  return { g, set };
}

// ---------- 小屋正面 ----------
// 窗宽 4：田字窗每格宽 2，屋里的人（连头发宽约 1.7）正好站进一格里，窗棂不压脸
export const SILL = 1.1, WIN_W = 4.0, WIN_H = 2.0, INSIDE_Y = 0.75;
export interface Cottage { g: THREE.Group; winX: number; doorX: number; glass: THREE.Mesh; fog: THREE.Mesh; inside: THREE.Group; lampGlow: THREE.Sprite }
/** 小屋正面（朝 +z）：墙上开一扇田字窗，窗后是亮着灯的屋里（地板垫高 INSIDE_Y，站在里面的人从窗外能看到半身）。原点在墙脚，窗中心在 x = winX */
export function cottage(winX = 0, wall = 0xf2e6d0, roofC = 0xc96a5b): Cottage {
  const g = new THREE.Group();
  const H = 4.3, xa = winX - 3.5, xb = winX + 5.5, x0 = winX - WIN_W / 2, x1 = winX + WIN_W / 2, mid = (xa + xb) / 2, W = xb - xa;
  const wood = 0x8a5a3c;
  put(g, box(x0 - xa, H, 0.3, wall, 0.04), (xa + x0) / 2, 0, 0);
  put(g, box(xb - x1, H, 0.3, wall, 0.04), (x1 + xb) / 2, 0, 0);
  put(g, box(WIN_W, SILL, 0.3, wall, 0), winX, 0, 0);
  put(g, box(WIN_W, H - SILL - WIN_H, 0.3, wall, 0), winX, SILL + WIN_H, 0);
  put(g, box(W + 0.1, 0.5, 0.38, 0xb9a78f, 0), mid, 0, 0);
  put(g, roof(W * 0.95, 4.6, 2.3, roofC), mid, H, -2.2);
  put(g, box(0.6, 1.5, 0.6, 0xb9a78f, 0.04), mid + 2.4, H + 0.5, -1.8);
  // 窗框、窗棂、往外伸的窗台
  put(g, box(WIN_W + 0.3, 0.14, 0.42, wood, 0.03), winX, SILL + WIN_H, 0.02);
  put(g, box(0.14, WIN_H, 0.42, wood, 0.03), x0 - 0.07, SILL, 0.02);
  put(g, box(0.14, WIN_H, 0.42, wood, 0.03), x1 + 0.07, SILL, 0.02);
  put(g, box(0.07, WIN_H, 0.08, wood, 0), winX, SILL, 0.12);
  put(g, box(WIN_W, 0.07, 0.08, wood, 0), winX, SILL + WIN_H * 0.72, 0.12);
  put(g, box(WIN_W + 0.7, 0.12, 0.72, 0x6f4630, 0.03), winX, SILL - 0.12, 0.3);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(WIN_W, WIN_H), glowMat(0xcfe8ff, 0.12)); put(g, glass, winX, SILL + WIN_H / 2, 0.1);
  const fog = new THREE.Mesh(new THREE.PlaneGeometry(WIN_W, WIN_H), glowMat(0xeef4fb, 0)); put(g, fog, winX, SILL + WIN_H / 2, 0.105); fog.visible = false;
  // 屋里：暖色后墙 + 垫高的地板 + 一盏灯
  const inside = new THREE.Group(); g.add(inside);
  put(inside, new THREE.Mesh(new THREE.PlaneGeometry(W - 0.4, H), basic(0xf7d9a6)), mid, H / 2, -2.6);
  put(inside, new THREE.Mesh(new THREE.PlaneGeometry(2.6, H), basic(0xeecb98)), xa + 0.2, H / 2, -1.3, PI / 2);
  put(inside, new THREE.Mesh(new THREE.PlaneGeometry(2.6, H), basic(0xeecb98)), xb - 0.2, H / 2, -1.3, -PI / 2);
  put(inside, box(W - 0.4, 0.2, 2.6, 0xc79a6b, 0), mid, INSIDE_Y - 0.2, -1.3);
  put(inside, box(1.5, 0.07, 0.26, wood, 0.02), winX - 0.55, SILL + 1.45, -2.45);
  put(inside, ball(0.11, 0xff9fb5, true, 0.02), winX - 0.9, SILL + 1.63, -2.45);
  put(inside, box(0.16, 0.26, 0.12, 0x6f8fd0, 0.02), winX - 0.4, SILL + 1.52, -2.45);
  const lamp = lantern(0xffc85a, 0.14); put(inside, lamp, winX + 0.95, SILL + WIN_H - 0.3, -1.5);
  // 门、台阶、门灯
  const doorX = winX + 3.9;
  put(g, box(1.56, 2.66, 0.1, 0x5f3d26, 0.03), doorX, 0, 0.14);
  put(g, box(1.3, 2.5, 0.1, 0x7a5236, 0.03), doorX, 0, 0.2);
  put(g, ball(0.07, 0xffd166, false, 0.02), doorX + 0.45, 1.2, 0.3);
  put(g, box(1.9, 0.12, 0.6, 0xa9a3b3, 0.03), doorX, 0, 0.5);
  put(g, box(1.9, 0.1, 0.7, roofC, 0.03), doorX, 2.85, 0.4);
  const dl = lantern(0xffd27a, 0.12); put(g, dl, doorX - 1.05, 2.5, 0.42);
  return { g, winX, doorX, glass, fog, inside, lampGlow: dl.children[1] as THREE.Sprite };
}

export function streetLamp() {
  const g = new THREE.Group();
  put(g, cyl(0.06, 0.09, 3.3, 0x3a3f52, 8, 0.02));
  put(g, box(0.7, 0.06, 0.06, 0x3a3f52, 0), 0.3, 3.25, 0);
  const l = lantern(0xffd88a, 0.16); put(g, l, 0.62, 3.05, 0);
  return { g, glow: l.children[1] as THREE.Sprite };
}

// ---------- 雨巷 ----------
export const COT_X = -6.5, COT_Z = -3.2;
/** 雨巷里小屋那扇窗的世界坐标（窗中心 x） */
export const LANE_WIN_X = COT_X - 1.0;
export interface Lane { cot: Cottage; rain: RainFx; rain2: RainFx; rip: Ripples; lamps: ReturnType<typeof streetLamp>[]; tick: (T: number, amount?: number) => void }
export function lane(k: Kit, o: { clear?: boolean; rainN?: number; rainColor?: number } = {}): Lane {
  const clear = !!o.clear;
  k.add(disc(95, clear ? 0x8fcf8a : 0x7fa48c));
  k.add(box(72, 0.04, 3.4, clear ? 0xbdb9c9 : 0x8d93a8, 0), 0, 0, 0.7);
  many(18, (i) => k.add(box(0.05, 0.045, 3.4, clear ? 0x9d98ad : 0x70768f, 0), -34 + i * 4 + (i % 2) * 0.6, 0, 0.7));
  const river = straightRiver(72, 1.5, clear ? 0.5 : 0, 3.5, 0.06, clear ? 0x5fb4ee : 0x6a97c8, clear ? 0x3f8fd8 : 0x44689f);
  k.add(river.mesh);
  k.add(box(72, 0.12, 0.16, 0xa9a3b3, 0), 0, 0, 2.6);
  const cot = cottage(-1.0); k.add(cot.g, COT_X, 0, COT_Z);
  const lamps = [-13, -1.5, 5.5, 12.5, 19.5].map((x) => { const l = streetLamp(); k.add(l.g, x, 0, -1.5); return l; });
  ([[-12.5, -5.5, 3.4], [2.2, -6.5, 3.8], [6.0, -5.2, 3.0], [10.5, -7, 4.2], [16, -5.5, 3.2], [-17, -7, 4]] as const).forEach(([x, z, h], i) => k.add(i % 2 ? pine(h + 1, clear ? 0x3f9a66 : 0x3b7f66) : tree(h, clear ? 0x5fc46a : 0x5aa57a, i), x, 0, z));
  ([[4.5, -12, 0xf3d9c4, 0x8a6fb0], [11, -13, 0xdfe8f2, 0xc96a5b], [-16, -12.5, 0xf2e2b8, 0x5f8fbf], [19, -11, 0xf6d0d0, 0x6a8f6a]] as const).forEach(([x, z, w, r]) => k.add(house(3.2, 2.6, 3, w, r), x, 0, z));
  many(14, (i) => k.add(flower([0xff9fb5, 0xffe08a, 0xbfa8ff, 0xffffff][i % 4], 0.28 + hash(i) * 0.14), -1.2 + i * 1.5 + hash(i + 9) * 0.6, 0, -1.25 - hash(i + 4) * 0.5));
  ([[-2.2, 0.9, 0.9], [1.6, 1.7, 0.7], [4.2, 0.2, 1.0], [-4.6, 1.7, 0.6], [7.5, 1.2, 0.8]] as const).forEach(([x, z, r]) => { const p = new THREE.Mesh(new THREE.CircleGeometry(1, 24).rotateX(-PI / 2), glowMat(clear ? 0xc4e6ff : 0x5f7fa8, 0.55)); p.scale.set(r, 1, r * 0.6); k.add(p, x, 0.045, z); });
  const rip = ripples(26, 16, 3.0); k.add(rip.g, 1, 0.05, 0.7);
  const rain = rainFx(o.rainN ?? 230, 24, 7, 9, o.rainColor ?? 0xdcebff); k.add(rain.g, 0, 0, -0.5);
  const rain2 = rainFx(110, 34, 8, 11, o.rainColor ?? 0xc4d6ee); k.add(rain2.g, 0, 0, -9);
  const clouds = skyline(k, clear ? { c1: 0x86c98f, c2: 0x7fb7d6, cloud: 0xffffff, n: 8, low: 30 } : {});
  return { cot, rain, rain2, rip, lamps, tick: (T, amount = 1) => { rain.set(T, amount); rain2.set(T, amount); rip.set(T, amount); clouds(T); } };
}

// ---------- 窗台特写 ----------
export interface WindowStage { cot: Cottage; rain: RainFx; drops: GlassDrops; tick: (T: number, amount?: number) => void }
/** 小屋正面摆在原点、窗居中；雨只下在 z 0.7–2.3（窗和相机之间），不会贴到镜头上 */
export function windowStage(k: Kit, o: { clear?: boolean } = {}): WindowStage {
  const clear = !!o.clear;
  k.add(disc(95, clear ? 0x8fcf8a : 0x7fa48c));
  k.add(box(40, 0.04, 3.4, clear ? 0xbdb9c9 : 0x8d93a8, 0), 0, 0, 3.6);
  const cot = cottage(0); k.add(cot.g);
  many(7, (i) => k.add(flower([0xff9fb5, 0xffe08a, 0xbfa8ff, 0xffffff][i % 4], 0.3 + hash(i) * 0.16), -1.6 + i * 0.55, 0, 0.75 + hash(i + 2) * 0.3));
  k.add(tree(3.6, clear ? 0x5fc46a : 0x5aa57a, 2), -6.2, 0, -2.5); k.add(pine(4.4, clear ? 0x3f9a66 : 0x3b7f66), 8.0, 0, -3.5);
  const rain = rainFx(120, 9, 1.6, 6.5); k.add(rain.g, 0, 0, 1.5);
  const drops = glassDrops(18, WIN_W, WIN_H); k.add(drops.g, 0, SILL + WIN_H / 2, 0.16);
  const clouds = skyline(k, clear ? { c1: 0x86c98f, c2: 0x7fb7d6, cloud: 0xffffff, n: 8, low: 30 } : { low: 12, n: 14 });
  return { cot, rain, drops, tick: (T, amount = 1) => { rain.set(T, amount); drops.set(T, amount); clouds(T); } };
}

// ---------- 暖屋 ----------
export const RWIN = { x: 0.8, y: 1.0, w: 4.4, h: 3.0, z: -4.5 } as const;
/** 屋里每个人的固定站位（I2 / L15 / L19 共用） */
export const POS = { zai: [-3.2, 0.2, -0.4], kimi: [-2.9, 0, -3.2], qwen: [5.0, 0, -3.3], table: [4.6, 0, -2.3] } as const;
/** 记忆绳上第 i 张照片的位置 */
export const photoAt = (i: number): [number, number, number] => [-6.1 + i * 0.92, 3.72 - Math.sin((i / 5) * PI) * 0.16, -4.28];
export interface Room { fog: THREE.Mesh; drops: GlassDrops; rain: RainFx; steam: Steam; steam2: Steam; photos: THREE.Mesh[]; tick: (T: number, amount?: number) => void }
export function roomSet(k: Kit, o: { clear?: boolean } = {}): Room {
  const clear = !!o.clear;
  const W = 15, D = 9, H = 5.4, wall = 0xf4e3c8, wood = 0x8a5a3c;
  const { x, y, w, h, z } = RWIN, xa = -W / 2 - 0.3, xb = W / 2 + 0.3;
  k.add(box(W + 0.6, 0.2, D + 0.6, 0xc99b6c, 0), 0, -0.2, 0);
  many(7, (i) => k.add(box(W, 0.012, 0.03, wood, 0), 0, 0, -D / 2 + ((i + 0.5) * D) / 7));
  k.add(box(x - w / 2 - xa, H, 0.3, wall, 0), (xa + x - w / 2) / 2, 0, z - 0.15);
  k.add(box(xb - (x + w / 2), H, 0.3, wall, 0), (xb + x + w / 2) / 2, 0, z - 0.15);
  k.add(box(w, y, 0.3, wall, 0), x, 0, z - 0.15);
  k.add(box(w, H - y - h, 0.3, wall, 0), x, y + h, z - 0.15);
  k.add(box(0.3, H, D + 0.6, wall, 0), -W / 2 - 0.15, 0, 0); k.add(box(0.3, H, D + 0.6, wall, 0), W / 2 + 0.15, 0, 0);
  k.add(box(W, 0.28, 0.08, wood, 0), 0, 0, z + 0.04);
  k.add(box(w + 0.4, 0.16, 0.2, wood, 0.03), x, y + h, z + 0.06);
  k.add(box(0.16, h, 0.2, wood, 0.03), x - w / 2 - 0.08, y, z + 0.06); k.add(box(0.16, h, 0.2, wood, 0.03), x + w / 2 + 0.08, y, z + 0.06);
  k.add(box(0.09, h, 0.1, wood, 0), x, y, z + 0.04); k.add(box(w, 0.09, 0.1, wood, 0), x, y + h / 2 - 0.045, z + 0.04);
  k.add(box(w + 0.8, 0.12, 0.55, 0x6f4630, 0.03), x, y - 0.12, z + 0.3);
  for (const sx of [-1, 1]) k.add(box(0.55, h + 0.5, 0.1, 0xe9a6a0, 0.03), x + sx * (w / 2 + 0.5), y - 0.2, z + 0.16);
  k.add(box(w + 1.9, 0.1, 0.12, wood, 0.02), x, y + h + 0.32, z + 0.16);
  const fog = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glowMat(0xeaf2fa, 0)); k.add(fog, x, y + h / 2, z - 0.02); fog.visible = false;
  const drops = glassDrops(16, w, h); k.add(drops.g, x, y + h / 2, z - 0.06);
  const rug = new THREE.Mesh(new THREE.CircleGeometry(1, 40).rotateX(-PI / 2), toon(0xe9b8a6)); rug.scale.set(3.4, 1, 2.0); k.add(rug, 0.2, 0.012, 0.2);
  // 千问的茶桌：壶 + 三只杯子 + 热气
  const [tx, , tz] = POS.table;
  k.add(table(2.0, 1.0, 0.75, 0xb9824f), tx, 0, tz);
  k.add(kettle(), tx + 0.55, 0.75, tz);
  many(3, (i) => k.add(teacup(i === 1 ? 0xffd9a0 : 0xffffff), tx - 0.7 + i * 0.42, 0.75, tz + 0.15));
  const steam = steamFx(8, 1.7, 0.3); k.add(steam.g, tx - 0.28, 0.9, tz + 0.15);
  // 小克留在窗台上的那只茶杯，还冒着热气
  k.add(teacup(0xffb48a), x + 1.5, y, z + 0.32);
  const steam2 = steamFx(5, 1.2, 0.2); k.add(steam2.g, x + 1.5, y + 0.14, z + 0.32);
  // 狐狸的垫子、盆栽、三盏吊灯
  k.add(cyl(1.0, 1.05, 0.2, 0x9fb4e8, 20, 0.03), POS.zai[0], 0, POS.zai[2] - 0.1);
  k.add(plant(1.2), -6.7, 0, -3.7); k.add(plant(0.9), 6.8, 0, -3.8);
  many(3, (i) => { k.add(cyl(0.012, 0.012, 0.9, 0x3a3340, 5, 0), -3.5 + i * 3.7, H - 0.9, -1.6); k.add(lantern(0xffc870, 0.17), -3.5 + i * 3.7, H - 1.0, -1.6); });
  // Kimi 的记忆绳：一根绳 + 五张照片（照片里的人直接取自图集，不新画）
  const rope = box(5.2, 0.02, 0.02, 0x6f4630, 0); k.add(rope, -4.2, 4.02, -4.3);
  const shots: [string[], string][] = [[['whale_wave'], '#bfe3ff'], [['claude_front_1'], '#ffe2b8'], [['whale_idle', 'claude_front_0'], '#d8f0c8'], [['doubao_cage_0'], '#ffe9a8'], [['gemini_front_1'], '#e6dcff']];
  const photos = shots.map(([cells, bg], i) => { const p = polaroid(k.atlas, cells, bg); const [px, py, pz] = photoAt(i); k.add(p, px, py, pz); k.add(box(0.05, 0.1, 0.03, 0xd9773b, 0), px, py + 0.33, pz + 0.02); return p; });
  // 窗外：和雨巷同一片天
  const g0 = disc(130, clear ? 0x8fcf8a : 0x7fa48c, -0.3); k.add(g0, 0, 0, -70);
  k.add(tree(4.2, clear ? 0x5fc46a : 0x5aa57a, 4), x - 3.4, -0.3, -10); k.add(pine(5, clear ? 0x3f9a66 : 0x3b7f66), x + 3.6, -0.3, -12.5);
  k.add(house(3.2, 2.6, 3, 0xf3d9c4, 0x8a6fb0), x + 0.6, -0.3, -19);
  const rain = rainFx(150, 12, 5, 8.5); k.add(rain.g, x, 0, -8);
  const clouds = skyline(k, clear ? { c1: 0x86c98f, c2: 0x7fb7d6, cloud: 0xffffff, n: 8, low: 30 } : { low: 9, n: 14 });
  return { fog, drops, rain, steam, steam2, photos, tick: (T, amount = 1) => { rain.set(T, amount); drops.set(T, amount); steam.set(T); steam2.set(T); clouds(T); } };
}

// ---------- 小道具 ----------
/** 一张拍立得：人像直接从角色图集里取现成的格子画上去（不新画人物） */
export function polaroid(atlas: AtlasData, cells: string[], bg: string, s = 1): THREE.Mesh {
  const tex = canvasTex(192, 224, (c) => {
    c.fillStyle = '#fffdf6'; c.fillRect(0, 0, 192, 224);
    c.fillStyle = bg; c.fillRect(12, 12, 168, 164);
    c.imageSmoothingEnabled = false;
    const img = atlas.tex.image as CanvasImageSource;
    cells.forEach((cell, i) => {
      const r = atlas.rects[cell];
      if (!r) throw new Error(`[雨爱] 图集里没有「${cell}」`);
      const hgt = cells.length > 1 ? 120 : 146, wd = (r[2] / r[3]) * hgt;
      const cx = 96 + (i - (cells.length - 1) / 2) * 74;
      c.drawImage(img, r[0], r[1], r[2], r[3], cx - wd / 2, 176 - hgt, wd, hgt);
    });
  });
  tex.magFilter = THREE.NearestFilter;
  return new THREE.Mesh(new THREE.PlaneGeometry(0.6 * s, 0.7 * s), new THREE.MeshBasicMaterial({ map: tex }));
}
/** 一张画着彩虹的拍立得（纯色弧线，不含人物） */
export function rainbowPhoto(s = 1): THREE.Mesh {
  const tex = canvasTex(192, 224, (c) => {
    c.fillStyle = '#fffdf6'; c.fillRect(0, 0, 192, 224);
    c.fillStyle = '#cfeaff'; c.fillRect(12, 12, 168, 164);
    ['#ff6b6b', '#ffa94d', '#ffe066', '#8ce99a', '#74c0fc', '#b197fc'].forEach((col, i) => { c.strokeStyle = col; c.lineWidth = 9; c.beginPath(); c.arc(96, 172, 76 - i * 9, PI, 0); c.stroke(); });
    c.fillStyle = '#8fcf8a'; c.fillRect(12, 160, 168, 16);
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(0.6 * s, 0.7 * s), new THREE.MeshBasicMaterial({ map: tex }));
}
export function teacup(color = 0xffffff): THREE.Group {
  const g = new THREE.Group();
  put(g, cyl(0.13, 0.13, 0.014, 0xf4f6ff, 16, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.09, 0.06, 0.11, 14).translate(0, 0.068, 0), toon(color), 0.018));
  const tea = new THREE.Mesh(new THREE.CircleGeometry(0.078, 14).rotateX(-PI / 2), basic(0xc98a4a)); tea.position.y = 0.118; g.add(tea);
  const hd = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.012, 6, 10), toon(color)); hd.position.set(0.1, 0.07, 0); g.add(hd);
  return g;
}
export function kettle(): THREE.Group {
  const g = new THREE.Group();
  const b = ball(0.2, 0x6f8fd0, false, 0.025); b.scale.set(1, 0.85, 1); put(g, b, 0, 0.17, 0);
  const sp = cone(0.05, 0.24, 0x6f8fd0, 8, 0.02); sp.rotation.z = 0.9; put(g, sp, -0.15, 0.16, 0);
  put(g, ball(0.035, 0xffd166, false, 0.01), 0, 0.36, 0);
  const hd = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.016, 6, 12, PI), toon(0x3a3340)); hd.position.y = 0.3; g.add(hd);
  return g;
}
export interface Steam { g: THREE.Group; set: (T: number, amount?: number) => void }
/** 热气：几团白烟往上飘、变大、变淡 */
export function steamFx(n = 6, rise = 1.3, spread = 0.25): Steam {
  const g = new THREE.Group();
  const ps = many(n, () => { const s = sprite('smoke', 0.3, 0xffffff, false, 0.5); g.add(s); return s; });
  const set = (T: number, amount = 1) => ps.forEach((s, i) => {
    const p = (T * 0.3 + i / n + hash(i) * 0.1) % 1;
    s.position.set(Math.sin(p * 5 + i * 2.1) * spread * p, p * rise, 0);
    s.scale.setScalar(0.16 + p * 0.44);
    setOp(s, Math.sin(p * PI) * 0.55 * amount);
  });
  set(0);
  return { g, set };
}
export interface Vessel { g: THREE.Group; set: (level: number) => void; h: number; r: number }
/** 接雨的器皿（本鲸的蓝饭盆 / 杯子 / 罐子）：敞口，里面的水面随 level（0–1）升高。原点在底面中心 */
export function vessel(r = 0.22, h = 0.2, color = 0x3d7fd9, rb = 0.5): Vessel {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(r, r * rb, h, 22, 1, true).translate(0, h / 2, 0), new THREE.MeshToonMaterial({ color, side: THREE.DoubleSide, gradientMap: toon(color).gradientMap }), 0.02));
  put(g, cyl(r * rb, r * rb, 0.02, color, 18, 0));
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r, 0.012, 6, 24).rotateX(PI / 2), toon(0xf4f6ff)); rim.position.y = h; g.add(rim);
  const water = new THREE.Mesh(new THREE.CircleGeometry(1, 22).rotateX(-PI / 2), glowMat(0xa8dcff, 0.92)); g.add(water);
  const set = (level: number) => { const yy = 0.03 + clamp01(level) * (h - 0.05); const rr = lerp(r * rb, r, yy / h) * 0.96; water.position.y = yy; water.scale.set(rr, 1, rr); };
  set(0.2);
  return { g, set, h, r };
}
/** 心形（填色或描线）的一块平面贴片，朝 +z；要铺在地上就把 rotation.x 设成 −PI/2 */
export function heartMark(size = 2.4, color = '#ff9db8', line = false): THREE.Mesh {
  const tex = canvasTex(256, 256, (c) => {
    c.translate(128, 120); c.beginPath();
    for (let i = 0; i <= 60; i++) {
      const t = (i / 60) * PI * 2, s = 7;
      const hx = 16 * Math.sin(t) ** 3 * s, hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * s;
      if (i) c.lineTo(hx, hy); else c.moveTo(hx, hy);
    }
    c.closePath();
    if (line) { c.strokeStyle = color; c.lineWidth = 10; c.lineJoin = 'round'; c.stroke(); } else { c.fillStyle = color; c.fill(); }
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.9, side: THREE.DoubleSide }));
}
/** 透明伞（让爱变透明）：伞面换成半透明材质，去掉墨线外壳 */
export function clearUmbrella(r = 1.15, pole = 1.55): THREE.Group {
  const g = umbrellaProp(r, 0xcfeaff, pole);
  g.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh && (m.material as THREE.MeshToonMaterial).isMeshToonMaterial && (m.material as THREE.Material).side === THREE.DoubleSide) {
      m.material = new THREE.MeshBasicMaterial({ color: 0xe6f6ff, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false });
      for (const c of [...m.children]) m.remove(c);
    }
  });
  return g;
}
/** 伞：引擎的伞去掉伞面的墨线外壳——从伞下仰拍时，外壳的背面会把整个伞面盖成黑色 */
export function umbrella(r = 1.15, color = 0xe85d75, pole = 1.55): THREE.Group {
  const g = umbrellaProp(r, color, pole);
  g.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.isMesh && (m.material as THREE.MeshToonMaterial).isMeshToonMaterial && (m.material as THREE.Material).side === THREE.DoubleSide) for (const c of [...m.children]) m.remove(c);
  });
  return g;
}
/** 彩虹：七道弧，set(p) 从左到右画出来 */
export interface Rainbow { g: THREE.Group; set: (p: number, alpha?: number) => void }
export function rainbow(R = 22, band = 0.6): Rainbow {
  const g = new THREE.Group();
  const SEG = 72;
  const arcs = [0xff6b6b, 0xffa94d, 0xffe066, 0x8ce99a, 0x74c0fc, 0x748ffc, 0xb197fc].map((c, i) => {
    const m = new THREE.Mesh(new THREE.RingGeometry(R - (i + 1) * band, R - i * band, SEG, 1, 0, PI), new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.8, depthWrite: false, fog: false, side: THREE.DoubleSide }));
    g.add(m); return m;
  });
  g.scale.x = -1;
  const set = (p: number, alpha = 1) => { const n = Math.round(clamp01(p) * SEG) * 6; for (const m of arcs) { m.geometry.setDrawRange(0, n); (m.material as THREE.MeshBasicMaterial).opacity = 0.78 * clamp01(alpha); m.visible = n > 0 && alpha > 0.01; } };
  set(1);
  return { g, set };
}
/** 一束从云缝里落下来的光 */
export function lightBeam(rTop = 0.7, rBot = 2.8, h = 13, color = 0xfff3c4): THREE.Mesh {
  return new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, 24, 1, true).translate(0, h / 2, 0), glowMat(color, 0.3, true));
}
/** 架在三脚架上的相机（Grok 用来查证彩虹）。原点在地面 */
export function tripodCam(): THREE.Group {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) { const leg = cyl(0.025, 0.03, 1.25, 0x3a3340, 5, 0); leg.rotation.z = 0.22; const h = new THREE.Group(); h.add(leg); h.rotation.y = (i / 3) * PI * 2; put(g, h, 0, 0, 0); }
  put(g, cameraProp(), 0, 1.2, 0, -PI / 2);
  return g;
}
/** 野餐布 */
export function picnicCloth(w = 2.6, d = 1.5): THREE.Mesh {
  const tex = canvasTex(128, 128, (c) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { c.fillStyle = (i + j) % 2 ? '#ffffff' : '#ff9fb5'; c.fillRect(i * 16, j * 16, 16, 16); } });
  tex.magFilter = THREE.NearestFilter;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, d).rotateX(-PI / 2), new THREE.MeshBasicMaterial({ map: tex }));
}
