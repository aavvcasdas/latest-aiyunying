// 共用布景：天地远山、小世界、萤火、花瓣、风带、流星
import { View, sky, ground, hill, cloud, tree, house, lantern, flower, glow, ball, ribbon, groundPath, disc, cube, hash, lerp, clamp01, backOut, bounceOut, easeOut, darken, lighten, mix, type V3 } from './engine';
import type { BeatInfo, LyricLine } from './timing';

export interface Frame {
  v: View;
  t: number;
  u: number;
  dt: number;
  dur: number;
  beat: BeatInfo;
  W: number;
  H: number;
  line: LyricLine | null;
}

/** 某个字唱出来之后过去了多少（0..1，dur 秒内走完） */
export function wordK(f: Frame, idx: number, dur = 0.45): number {
  if (!f.line) return 0;
  const c = f.line.chars[Math.min(idx, f.line.chars.length - 1)];
  return clamp01((f.t - c.t) / dur);
}
export function wordT(f: Frame, idx: number): number {
  if (!f.line) return Infinity;
  return f.line.chars[Math.min(idx, f.line.chars.length - 1)].t;
}

export const PASTEL = ['#ffb3c7', '#f3c4ff', '#ffe3a3', '#c9e4ff', '#ffd1b0', '#c8f2d8'];
export const BOOKS = ['#f4a7b9', '#9fc3ff', '#ffe08a', '#b8e2c8', '#d9c2ff', '#ffc9a6', '#a8dcf0'];

export function backdrop(f: Frame, o: { hills?: boolean; clouds?: number; cloudY?: number; stars?: number; sun?: V3 | null; sunR?: number; sunColor?: string; moon?: V3 | null; moonR?: number; cloudGlow?: string; groundNear?: string } = {}) {
  const { v, t } = f;
  const L = v.look;
  sky(v, t, { stars: o.stars ?? 1 });
  ground(v, { near: o.groundNear });
  if (o.sun) ball(v, o.sun, o.sunR ?? 3, o.sunColor ?? '#ffd98a', { glow: 2.4, glowA: 0.55, noFog: true, flat: 0.75, light: [0, 0], zBias: 500 });
  if (o.moon) ball(v, o.moon, o.moonR ?? 2.2, '#fff4cf', { glow: 1.8, glowA: 0.35, noFog: true, flat: 0.88, light: [-0.3, -0.3], zBias: 499 });
  if (o.hills !== false) {
    const hc = darken(L.ground[1], 0.12);
    hill(v, [-14, 0, -78], 48, 12, mix(hc, L.sky[1], 0.25));
    hill(v, [26, 0, -82], 40, 9.5, mix(hc, L.sky[1], 0.3));
    hill(v, [-34, 0, -52], 30, 6.5, hc);
    hill(v, [16, 0, -46], 28, 5.5, mix(hc, L.ground[0], 0.3));
    hill(v, [-6, 0, -36], 22, 4, mix(L.ground[1], L.ground[0], 0.5));
  }
  const n = o.clouds ?? 5;
  for (let i = 0; i < n; i++) {
    const spd = 0.12 + hash(i, 11) * 0.1;
    const x = ((hash(i, 12) * 70 + t * spd) % 70) - 35;
    const y = (o.cloudY ?? 7) + hash(i, 13) * 4;
    const z = -26 - hash(i, 14) * 24;
    const col = mix(lighten(L.sky[2], 0.5), L.sky[1], 0.25);
    cloud(v, [x, y, z], 1.3 + hash(i, 15) * 1.2, col, { glowColor: o.cloudGlow });
  }
}

/** 草丛：几根弯曲的叶片 */
export function grass(f: Frame, p: V3, size: number, bend: number, color?: string) {
  const { v } = f;
  const c = color ?? mix(v.look.ground[0], '#9ad08a', 0.4);
  for (let k = -1; k <= 1; k++) {
    const tip: V3 = [p[0] + k * 0.18 * size + bend * 0.5 * size, p[1] + (0.75 - Math.abs(k) * 0.15) * size, p[2]];
    const mid: V3 = [p[0] + k * 0.12 * size + bend * 0.2 * size, p[1] + 0.4 * size, p[2]];
    ribbon(v, [p, mid, tip], c, 0.07 * size, { taper: true });
  }
}

export function fireflies(f: Frame, n: number, box: { x: [number, number]; y: [number, number]; z: [number, number] }, color = '#d9ff9a', a = 0.7) {
  const { v, t, beat } = f;
  for (let i = 0; i < n; i++) {
    const p1 = 0.3 + hash(i, 21) * 0.5,
      p2 = 0.2 + hash(i, 22) * 0.5;
    const x = lerp(box.x[0], box.x[1], hash(i, 23)) + Math.sin(t * p1 + i) * 0.8;
    const y = lerp(box.y[0], box.y[1], hash(i, 24)) + Math.sin(t * p2 + i * 2.1) * 0.4;
    const z = lerp(box.z[0], box.z[1], hash(i, 25)) + Math.cos(t * p1 * 0.7 + i) * 0.5;
    const blink = 0.5 + 0.5 * Math.sin(t * (2 + hash(i, 26) * 3) + i * 3);
    glow(v, [x, y, z], 0.22 + 0.08 * beat.pulse, color, a * blink, { core: 0.18 });
  }
}

export function petals(f: Frame, n: number, o: { wind?: number; color?: string[]; box?: { x: [number, number]; y: [number, number]; z: [number, number] }; size?: number }) {
  const { v, t } = f;
  const wind = o.wind ?? 1.2;
  const box = o.box ?? { x: [-10, 10], y: [0.3, 4.5], z: [-8, 3] };
  const cols = o.color ?? PASTEL;
  for (let i = 0; i < n; i++) {
    const w = box.x[1] - box.x[0];
    const x = box.x[0] + ((hash(i, 31) * w + t * wind * (0.6 + hash(i, 32) * 0.8)) % w);
    const y = lerp(box.y[0], box.y[1], hash(i, 33)) + Math.sin(t * 1.3 + i * 1.7) * 0.35;
    const z = lerp(box.z[0], box.z[1], hash(i, 34));
    const pr = v.project([x, y, z]);
    if (!pr) continue;
    const r = (o.size ?? 0.09) * pr.s;
    const c = v.fogged(cols[i % cols.length], pr.z);
    const rot = t * 2 + i;
    v.add(pr.z, () => {
      const { ctx } = v;
      ctx.save();
      ctx.translate(pr.x, pr.y);
      ctx.rotate(rot);
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }
}

/** 一道风：从左到右掠过的曲线，k 为 0..1 的生命进度 */
export function windStreak(f: Frame, k: number, y: number, z: number, o: { amp?: number; len?: number; color?: string; width?: number } = {}) {
  if (k <= 0 || k >= 1) return;
  const { v } = f;
  const head = lerp(-14, 14, k);
  const L = o.len ?? 6;
  const pts: V3[] = [];
  for (let i = 0; i <= 14; i++) {
    const x = head - (i / 14) * L;
    pts.push([x, y + Math.sin(x * 0.9 + k * 4) * (o.amp ?? 0.35), z]);
  }
  const a = Math.sin(k * Math.PI) * 0.6;
  ribbon(v, pts, o.color ?? '#ffffff', o.width ?? 0.09, { alpha: a, taper: true, noFog: true });
}

export function shootingStar(f: Frame, k: number, from: V3, to: V3, color = '#fff6d0') {
  if (k <= 0 || k >= 1) return;
  const { v } = f;
  const e = easeOut(k);
  const head: V3 = [lerp(from[0], to[0], e), lerp(from[1], to[1], e), lerp(from[2], to[2], e)];
  const pts: V3[] = [];
  for (let i = 0; i <= 8; i++) {
    const kk = clamp01(e - i * 0.03);
    pts.push([lerp(from[0], to[0], kk), lerp(from[1], to[1], kk), lerp(from[2], to[2], kk)]);
  }
  const a = (1 - k) * 0.9;
  ribbon(v, pts, color, 0.12, { alpha: a, taper: true, noFog: true, zBias: 400 });
  glow(v, head, 0.9, color, a, { core: 0.2, zBias: 399 });
}

export function birds(f: Frame, n: number, o: { y?: number; z?: number; speed?: number; color?: string } = {}) {
  const { v, t } = f;
  for (let i = 0; i < n; i++) {
    const x = ((hash(i, 41) * 40 + t * (o.speed ?? 1.4)) % 40) - 20;
    const y = (o.y ?? 7) + hash(i, 42) * 2 + Math.sin(t * 2 + i) * 0.2;
    const z = (o.z ?? -24) - hash(i, 43) * 10;
    const flap = Math.sin(t * 9 + i * 2) * 0.25;
    const c = o.color ?? '#5c6b8f';
    ribbon(v, [[x - 0.35, y + flap, z], [x, y, z], [x + 0.35, y + flap, z]], c, 0.06, { alpha: 0.8 });
  }
}

/** 小世界：山坡上的小屋、大树、湖、小路、花田。k 控制每一块的出场（1 = 全部就位） */
export interface WorldK {
  house: number;
  tree: number;
  lake: number;
  hills: number;
  lanterns: number;
  flowers: number;
  clouds: number;
}
export const WORLD_ALL: WorldK = { house: 1, tree: 1, lake: 1, hills: 1, lanterns: 1, flowers: 1, clouds: 1 };

export const WORLD = {
  house: [-7, 0, -9] as V3,
  tree: [6, 0, -5] as V3,
  lake: [11, 0, -17] as V3,
  dock: [10.2, 0, -9.5] as V3,
};

export function littleWorld(f: Frame, k: WorldK, o: { windowGlow?: number; doorOpen?: number; lanternPulse?: boolean; bloom?: boolean; flowerGlow?: boolean } = {}) {
  const { v, t, beat } = f;
  const L = v.look;
  sky(v, t);
  ground(v);
  // 远山
  if (k.hills > 0) {
    const s = backOut(k.hills);
    const hc = darken(L.ground[1], 0.12);
    hill(v, [-10, 0, -70], 46 * s, 11 * s, mix(hc, L.sky[1], 0.25));
    hill(v, [28, 0, -76], 40 * s, 9 * s, mix(hc, L.sky[1], 0.3));
    hill(v, [-28, 0, -44], 28 * s, 6 * s, hc);
    hill(v, [18, 0, -40], 26 * s, 5 * s, mix(hc, L.ground[0], 0.3));
    hill(v, [-6, 0, -26], 22 * s, 4.5 * s, mix(L.ground[1], L.ground[0], 0.55));
  }
  if (k.clouds > 0) {
    for (let i = 0; i < 6; i++) {
      const x = ((hash(i, 12) * 70 + t * 0.15) % 70) - 35;
      const y = 7.5 + hash(i, 13) * 4;
      const z = -28 - hash(i, 14) * 22;
      cloud(v, [x, y, z], 1.4 + hash(i, 15) * 1.1, mix(lighten(L.sky[2], 0.5), L.sky[1], 0.25), { scale: backOut(clamp01(k.clouds - i * 0.08)) });
    }
  }
  // 湖
  if (k.lake > 0) {
    const s = easeOut(k.lake);
    disc(v, [WORLD.lake[0], 0.005, WORLD.lake[2]], 7.5 * s, mix(L.sky[1], '#7fb3d9', 0.5), { alpha: 0.9 });
    disc(v, [WORLD.lake[0], 0.006, WORLD.lake[2]], 5.5 * s, mix(L.sky[2], '#a9d4ef', 0.5), { alpha: 0.5, soft: true });
    // 码头
    cube(v, [WORLD.dock[0], 0, WORLD.dock[2]], 1.8 * s, 0.18, 3.2 * s, '#a88a6c');
  }
  // 小路
  const road: V3[] = [
    [0.5, 0.012, 7],
    [-0.8, 0.012, 2],
    [-3.2, 0.012, -2.5],
    [-5.6, 0.012, -5.2],
    [-6.6, 0.012, -7.2],
  ];
  groundPath(v, road, 1.3, mix('#e9d9b8', L.ground[0], 0.3), { alpha: 0.92 });
  // 小屋
  if (k.house > 0) {
    const s = bounceOut(k.house);
    const hp: V3 = [WORLD.house[0], WORLD.house[1] + (1 - s) * 6, WORLD.house[2]];
    house(v, hp, 1.35, { windowGlow: o.windowGlow ?? (L.stars > 0.3 ? 0.9 : 0.25), door: o.doorOpen ?? 0 });
  }
  // 大树
  if (k.tree > 0) {
    const s = backOut(k.tree);
    tree(v, WORLD.tree, 3.0 * s, { leaf: mix('#7bb86e', L.ground[0], 0.3), sway: Math.sin(t * 0.8) * 0.3 });
    tree(v, [-12, 0, -13], 2.1 * s, { leaf: mix('#6fae73', L.ground[1], 0.3), sway: Math.sin(t * 0.7 + 1) * 0.3 });
    tree(v, [14, 0, -9], 1.8 * s, { leaf: mix('#85c08a', L.ground[1], 0.3), sway: Math.sin(t * 0.9 + 2) * 0.3 });
  }
  // 路灯
  if (k.lanterns > 0) {
    const posts: V3[] = [
      [1.6, 0, 3.5],
      [-2.2, 0, -1.2],
      [-4.2, 0, -5.4],
      [3.2, 0, -1.5],
    ];
    posts.forEach((p, i) => {
      const s = backOut(clamp01(k.lanterns * 1.3 - i * 0.1));
      if (s <= 0) return;
      const pulse = o.lanternPulse ? (beat.idx % posts.length === i ? beat.pulse : 0) : 0;
      lantern(v, p, 2.0 * s, '#ffcf7a', L.stars > 0.3 ? 1 : 0.35, { pulse });
    });
  }
  // 花田
  if (k.flowers > 0) {
    for (let i = 0; i < 46; i++) {
      const x = hash(i, 51) * 20 - 10;
      const z = hash(i, 52) * 8 - 4;
      if (Math.abs(x + 0.8 + (z - 2) * -0.35) < 1.0 && z > -3) continue; // 让开小路
      const b = clamp01(k.flowers * 1.4 - hash(i, 53) * 0.4);
      flower(v, [x, 0, z], 0.5 + hash(i, 54) * 0.35, PASTEL[i % PASTEL.length], b, { glow: o.flowerGlow, sway: Math.sin(t * 1.5 + i) * 0.25 });
    }
  }
}
