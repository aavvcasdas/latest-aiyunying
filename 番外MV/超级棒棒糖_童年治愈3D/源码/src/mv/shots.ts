// 二十七个镜头的逐帧编排。每个函数只读 ctx 里的时间，角色每帧重新摆。
import * as THREE from 'three';
import { BEAT, type PalName } from './data';
import type { Actor, Lollipop, Ribbon, Thing, Who } from './kit';
import { CANDY, TAU, arc, clamp, ease, easeIn, easeOut, hash, mix, seg } from './kit';
import type { FX, World } from './world';
import { BLOCK_Z, MOUND, PLAZA, ROCK, STEPS, STONES, TOWER, creekZ, hillY } from './world';

export interface Post { flash: number; fade: number; fadeWhite: boolean }
export interface Ctx {
  T: number; t: number; u: number; d: number; s: number; e: number;
  /** 拍号（浮点）与鼓点脉冲（0–1，每拍衰减） */
  b: number; pulse: number;
  cam(px: number, py: number, pz: number, lx: number, ly: number, lz: number, fov?: number, roll?: number): void;
  A: Record<Who, Actor>; L: Lollipop; R: Ribbon; card: Thing; basket: Thing;
  W: World; fx: FX; post: Post;
  pal(a: PalName, b?: PalName, k?: number): void;
  /** 角色摆好、算出手的位置之后再执行（跟手的糖、披风都放这里） */
  after(fn: () => void): void;
}
type ShotFn = (c: Ctx) => void;

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const beatT = (k: number) => BEAT.offset + k * BEAT.period;
const HB = BEAT.period / 2;
const CIRCLE: Who[] = ['whale', 'doubao', 'gemini', 'qwen', 'claude', 'zai', 'kimi', 'gpt'];
/** 群像里统一叫「摇摆 / 吃惊 / 歪头」，落到每个人自己图集里真有的那一个动作（不换人、不换造型；图集里没有就会报错） */
const ALT: Partial<Record<Who, Record<string, string>>> = {
  gpt: { idle: 'hover', hop: 'float', sway: 'hover', walk: 'fly' },
  claude: { sway: 'lookaround', surprise: 'tilt' },
  kimi: { sway: 'lookaround', surprise: 'think', tilt: 'think' },
  qwen: { surprise: 'tilt' },
  zai: { sway: 'lookaround', surprise: 'alert' },
  whale: { tilt: 'nod' },
};
const verb = (w: Who, v: string) => ALT[w]?.[v] ?? v;
const ringPos = (i: number, n: number, r: number, rot: number): [number, number] => { const a = rot + (i / n) * TAU; return [PLAZA.x + Math.cos(a) * r, PLAZA.z + Math.sin(a) * r]; };
/** 闪烁：亮灭交替，越到后面灭得越多 */
const flicker = (T: number, k: number) => (hash(Math.floor(T * 16)) > k ? 1 : 0.05);
/** 桥面高度：积木 0.45，中间大石头 0.36，岸上 0 */
const bridgeY = (z: number) => (z > 4.95 && z < 7.05 ? ROCK.top : z > 2.5 && z < 9.5 ? 0.45 : 0);
const lolliTrail = (L: Lollipop, origin: THREE.Vector3, T: number, back: THREE.Vector3, len = 4.5, wav = 0.3) => (s: number) => {
  const o = L.group.position.clone().sub(origin);
  return o.addScaledVector(back, s * len).add(V(0, Math.sin(T * 5 - s * 7) * wav * s + s * 0.3, Math.cos(T * 4 - s * 5) * wav * 0.6 * s));
};

export const SHOT_FNS: Record<string, ShotFn> = {
  // ───── 第一段 · 夜里的护身符 ─────
  S01: (c) => {
    const { A, L, T, u } = c;
    c.post.fade = 1 - ease(seg(T, 0, 0.7)); c.post.fadeWhite = false;
    c.cam(mix(0.9, -0.5, ease(u)), mix(2.6, 1.9, ease(u)), mix(3.8, 0.4, ease(u)), mix(-2.3, -1.6, ease(u)), 1.45, -3.2, 44);
    A.whale.put(-2.55, 1.78, -2.35).do('idle', 0, 0.4).tilt(Math.PI / 2).size(0.85).emote('fx_zzz'); A.whale.shadowOn = false;
    L.put(-1.25, 1.65, -3.5, 0.5); L.lit = 0.25 + 0.9 * ease(seg(T, 0.08, 1.4)) + 0.1 * Math.sin(T * 3); L.spin = T * 0.6;
    c.fx.sparkle(-1.25, 1.65, -3.5, 0.6, 0.5 * seg(T, 0.3, 1.5), T, 1);
    c.fx.glow(0, -1.25, 1.65, -3.42, 2.4, '#ffd9a8', 0.35 * L.lit);
  },
  S02: (c) => {
    const { A, L, T, u } = c;
    const C = V(-0.8, 2.3, -2.0); const phi = 0.55 + u * 0.95;
    c.cam(C.x + Math.cos(phi) * 5.6, 2.3 + u * 0.3, C.z + Math.sin(phi) * 5.6, C.x, 2.0, C.z, 46);
    const rise = ease(seg(u, 0, 0.18)); const th0 = Math.atan2(-1.5, -0.45);
    const th = th0 + seg(u, 0.12, 1) * TAU * 0.92;
    const onCircle = (a: number, s = 0) => V(C.x + Math.cos(a) * 2.1, 2.35 + 0.35 * Math.sin(a * 3 + s), C.z + Math.sin(a) * 2.1);
    const p = V(-1.25, 1.65, -3.5).lerp(onCircle(th), rise);
    L.put(p.x, p.y, p.z, mix(0.5, 0.62, rise)); L.lit = 1.25; L.spin = T * 2.2;
    if (u > 0.1) c.R.draw((s) => onCircle(th - s * 2.8 * seg(u, 0.1, 0.5), s * 2).add(V(0, Math.sin(T * 4 - s * 8) * 0.12, 0)), 0.32, cameraOf(c), seg(u, 0.1, 0.25));
    const sit = ease(seg(u, 0.3, 0.55));
    A.whale.put(mix(-2.55, -2.9, sit), mix(1.78, 0.78, sit), mix(-2.35, -2.25, sit)).tilt((Math.PI / 2) * (1 - sit)).size(mix(0.85, 1, sit));
    A.whale.shadowOn = false;
    if (u > 0.55) A.whale.do('surprise', c.s + 0.55 * c.d).emote('fx_exclaim'); else A.whale.do('idle', 0, 0.4);
    if (u < 0.3) A.whale.emote('fx_zzz');
    c.fx.sparkle(p.x, p.y, p.z, 0.7, 0.8, T, 2);
  },
  S03: (c) => {
    const { A, L, T, u } = c;
    c.cam(-1.0, 1.55, 2.5, 0.8, 1.15, -3.2, 50);
    A.whale.put(-2.0, 0.55, -1.78).do('idle', 0, 0.6).face(1); A.whale.shadowOn = false;
    if (u > 0.62) A.whale.emote('fx_sweat');
    const k = ease(seg(u, 0.1, 0.55));
    c.after(() => {
      const from = V(-1.0, 2.4, -2.3).add(c.W.zones.room.position), to = A.whale.hand.clone().add(V(0, 0.4, 0));
      L.putWorld(from.lerp(to, k), 0.55); L.lit = 1.1 + 0.1 * Math.sin(T * 4); L.spin = T * 1.2;
      c.fx.glowWorld(0, L.group.position.clone().add(V(0.15, -0.1, 0.25)), 2.2, '#ffe2b0', 0.4);
    });
    (c.W.room.doorLight.material as THREE.MeshBasicMaterial).color.set('#151838');
  },
  S04: (c) => {
    const { A, L, T } = c;
    const open = easeOut(seg(T, 8.85, 9.25));
    c.pal('night', 'dawnRoom', ease(seg(T, 8.85, 9.6)));
    const door = c.W.room; door.door.rotation.y = -1.85 * open; (door.doorLight.material as THREE.MeshBasicMaterial).color.set(open > 0 ? '#fff3d6' : '#151838');
    (door.shaft.material as THREE.MeshBasicMaterial).opacity = 0.85 * open;
    c.post.flash = Math.max(0, 0.5 * Math.exp(-(T - 8.85) * 7)) * (T >= 8.85 ? 1 : 0);
    const walk = ease(seg(T, 9.05, 10.18));
    A.whale.put(mix(-1.1, 2.0, walk), 0, mix(-1.3, -3.2, walk));
    if (T < 9.05) A.whale.do('idle', 0, 0.8).face(1); else A.whale.do('walk', 9.05).go(1, -0.6);
    if (T < 8.85) c.cam(0.9, 0.45, 1.7, -0.9, 1.35, -1.5, 48);
    else { const k = ease(seg(T, 8.85, 10.18)); c.cam(mix(0.9, 1.4, k), mix(0.6, 1.3, k), mix(1.7, -0.2, k), mix(-0.3, 3.8, k), mix(1.4, 1.3, k), mix(-1.6, -5, k), 48); }
    c.after(() => {
      L.holdBy(A.whale, 0.6, 0.35 * ease(seg(T, 7.3, 8.2))); L.lit = 1.1 + 0.6 * ease(seg(T, 7.4, 8.85)); L.spin = T * 2;
      const p = L.group.position; c.fx.glowWorld(0, p, 2.6 + 1.2 * L.lit, '#ffe6b0', 0.45);
    });
    c.fx.sparkle(mix(-1.1, 2.0, walk), 1.6, mix(-1.3, -3.2, walk), 0.9, 0.7, T, 3);
  },

  // ───── 第二段 · 白天去闯 ─────
  S05: (c) => {
    const { A, L, T, u } = c;
    const x = mix(-9.5, 1.5, u);
    c.cam(mix(-7.0, 0.2, u), 2.3, 9.8, mix(-6.2, 1.0, u), 1.15, 0.6, 46);
    A.whale.put(x, 0, 0.6).do('walk', c.s, 1.7).go(1, 0);
    c.after(() => {
      L.holdBy(A.whale, 0.6, 0.75); L.lit = 1.2 + 0.25 * c.pulse; L.spin = T * 2.5;
      c.R.draw(lolliTrail(L, c.W.zones.park.position, T, V(-1, 0.05, 0), 4.6, 0.35), 0.28 + 0.06 * c.pulse, cameraOf(c), 1);
    });
    c.fx.sparkle(x - 1, 1.9, 0.6, 1.2, 0.6, T, 4, 'rise');
  },
  S06: (c) => {
    const { A, L, T, u, W } = c;
    const start: [number, number, number] = [2.6, 0, -0.3];
    const lands = [20, 21, 22, 23].map(beatT);
    let pos = V(...start);
    for (let k = 0; k < 4; k++) {
      const a = lands[k] - 0.42, from = k === 0 ? V(...start) : V(...STEPS[k - 1]), to = V(...STEPS[k]);
      if (T >= a) { const q = seg(T, a, lands[k]); pos = from.clone().lerp(to, ease(q)); pos.y = mix(from.y, to.y, q) + arc(q) * 0.75 + 0.09; }
      const sc = easeOut(seg(T, lands[k] - 0.6, lands[k] - 0.35)); W.park.steps[k].scale.set(0.5 * sc, 0.18 * Math.max(0.01, sc), 0.5 * sc); W.park.steps[k].visible = sc > 0.01;
      if (sc > 0 && sc < 1) c.fx.sparkle(STEPS[k][0], STEPS[k][1], STEPS[k][2], 0.6, 1, T, 10 + k);
    }
    A.whale.put(pos.x, pos.y, pos.z).do('hop', c.s).go(1, -0.4);
    c.cam(1.0, 1.4 + 2.4 * ease(u), 6.9, mix(3.5, 5.6, ease(u)), mix(1.4, 3.6, ease(u)), mix(-0.8, -3.0, ease(u)), 46);
    c.after(() => { L.holdBy(A.whale, 0.55, 0.6); L.lit = 1.3; L.spin = T * 3; c.R.draw(lolliTrail(L, c.W.zones.park.position, T, V(-0.75, -0.45, 0.5).normalize(), 3.4, 0.25), 0.24, cameraOf(c), 0.9); });
  },
  S07: (c) => {
    const { A, L, T, u, W } = c;
    STEPS.forEach((_, k) => { const sc = 1 - easeIn(seg(u, 0.3 + k * 0.07, 0.42 + k * 0.07)); W.park.steps[k].scale.set(0.5 * sc, 0.18 * Math.max(0.01, sc), 0.5 * sc); W.park.steps[k].visible = sc > 0.01; });
    const roll = 0.14 * (1 - ease(seg(u, 0.55, 0.85)));
    c.cam(5.0, 4.5, 2.4, 7.6, 4.45, -2.3, 40, roll);
    A.whale.put(TOWER.x - 0.4, TOWER.top, TOWER.z + 0.7).face(-1);
    if (u < 0.14) A.whale.do('idle', 0, 0.8); else if (u < 0.34) A.whale.do('surprise', c.s + 0.14 * c.d).emote('fx_exclaim');
    else if (u < 0.62) A.whale.do('shiver', c.s).emote('fx_sweat'); else A.whale.do('nod', c.s + 0.62 * c.d);
    c.after(() => { L.holdBy(A.whale, 0.55, 0.55); L.lit = u < 0.12 ? 1.2 : u < 0.34 ? flicker(T, 0.25 + u) : 0; L.spin = T * (u < 0.34 ? 3 : 0.2); });
  },
  S08a: (c) => {
    const { A, L, T } = c;
    const path = [V(-8.6, 0, 3.6), ...STONES.map(([x, z]) => V(x, 0.22, z))];
    const lands = [28, 29, 30, 31].map(beatT);
    let pos = path[0].clone();
    if (T < lands[0] - 0.4) pos = V(mix(-9.6, -8.6, seg(T, c.s, lands[0] - 0.4)), 0, 3.6);
    for (let k = 0; k < 4; k++) { const a = lands[k] - 0.4; if (T >= a) { const q = seg(T, a, lands[k]); pos = path[k].clone().lerp(path[k + 1], ease(q)); pos.y += arc(q) * 0.55; } }
    A.whale.put(pos.x, pos.y, pos.z).do(T < lands[0] - 0.4 ? 'walk' : 'hop', c.s, 1.3).go(1, 0);
    if (T > lands[3]) A.whale.do('idle', 0, 1.2).face(1);
    c.cam(pos.x - 0.8, 1.5, 12.4, pos.x + 0.9, 0.7, pos.z, 42);
    c.after(() => { L.holdBy(A.whale, 0.55, 0.5); L.lit = 0; L.spin = 0; });
  },
  S08b: (c) => {
    const { A, L, T, u } = c;
    const p0 = V(STONES[3][0], 0.22, STONES[3][1]), p1 = V(ROCK.x - 0.2, ROCK.top, ROCK.z + 0.1);
    const j0 = beatT(33), j1 = beatT(36);
    const q = seg(T, j0, j1); const k = q < 0.5 ? 0.5 * Math.pow(q * 2, 0.75) : 1 - 0.5 * Math.pow((1 - q) * 2, 0.75);
    const pos = p0.clone().lerp(p1, k); pos.y += arc(q) * 1.9;
    A.whale.put(pos.x, pos.y, pos.z);
    if (T < j0) A.whale.do('idle', 0, 1.4).face(1); else if (T < j1) A.whale.do('hop', j0, 0.6).go(1, 0); else if (T < 23.7) A.whale.do('spin', j1); else A.whale.do('surprise', beatT(38));
    c.cam(mix(0.1, 0.7, ease(u)), mix(2.5, 2.0, ease(u)), mix(14.2, 12.4, ease(u)), 0.4, 0.9, 5.6, 44);
    if (T >= j1) c.fx.sparkle(p1.x, 0.4, p1.z, 0.9, 1 - seg(T, j1, j1 + 0.8), T, 5, 'rise');
    const slip = beatT(38);
    c.after(() => {
      if (T < slip) { L.holdBy(A.whale, 0.55, 0.5); L.spin = 0; }
      else { const f = seg(T, slip, BEAT.stopFrom); const from = A.whale.hand.clone().add(V(0, 0.34, 0)); const to = V(3.0, 0.08, 6.95).add(c.W.zones.park.position); const p = from.lerp(to, f); p.y = mix(from.y, to.y, easeIn(f)) + arc(f) * 0.3; L.putWorld(p, 0.55); L.spin = f * 6; }
      L.lit = 0;
    });
  },

  // ───── 停拍 + 第三段 · 友情和爱 ─────
  S09: (c) => {
    const { A, L, T } = c;
    c.pal('overcast', 'morning', 0.4 * ease(seg(T, BEAT.stopTo, 27.3)));
    c.cam(-1.2, 6.6, 18.4, 0.8, 0, 8.2, 44);
    A.whale.put(ROCK.x - 0.2, ROCK.top, ROCK.z + 0.1).do('sad', 24.45).face(1);
    const x = 3.0 + (T - BEAT.stopFrom) * 0.85;
    L.put(x, 0.08 + 0.03 * Math.sin(T * 3), creekZ(x) + 0.75, 0.8); L.flat = true; L.lit = 0.12; L.spin = T * 0.7;
    if (T >= BEAT.stopTo) {
      const k = ease(seg(T, BEAT.stopTo, 27.0));
      A.doubao.put(mix(-8, -0.8, k), 0, mix(10.9, 10.4, k)).do(k < 1 ? 'walk' : 'idle', BEAT.stopTo, 1.5).go(1, 0).hold(c.basket, 0.45, 0.55);
    }
  },
  S10: (c) => {
    const { A, u, W } = c;
    const k = ease(u);
    c.cam(mix(-4.4, 5.8, k), 1.7, mix(16.4, 16.9, k), mix(-1.4, 4.6, k), 0.9, mix(10.6, 11.4, k), 44);
    A.whale.put(ROCK.x - 0.2, ROCK.top, ROCK.z + 0.1).face(1);
    if (u < 0.15) A.whale.do('sad', c.s - 3); else if (u < 0.5) A.whale.do('surprise', c.s + 0.15 * c.d); else A.whale.do('wave', c.s + 0.5 * c.d);
    A.doubao.put(1.0, 0, 9.95).do('sway', c.s).face(1).hold(c.basket, 0.45, 0.55);
    A.gemini.put(-1.8, 0, 11.0).do(u < 0.62 ? 'choose' : 'nod', u < 0.62 ? c.s + 0.1 : c.s + 0.62 * c.d).face(1);
    if (u > 0.45) A.gemini.emote('fx_bulb');
    A.qwen.put(3.7, 0, 10.9).do(u < 0.5 ? 'idle' : 'nod', c.s + 0.5 * c.d).face(-1);
    W.park.queue.forEach((m, i) => { const sc = easeOut(seg(u, 0.12 + i * 0.07, 0.2 + i * 0.07)); m.scale.setScalar(Math.max(0.001, sc)); m.visible = sc > 0.01; });
    if (u < 0.62) A.zai.put(6.0, 0, 12.1).do('doze', c.s).face(-1).emote('fx_zzz'); else A.zai.put(6.0, 0, 12.1).do('alert', c.s + 0.62 * c.d).face(-1).emote('fx_exclaim');
  },
  S11: (c) => {
    const { A, T, u, W } = c;
    c.cam(-1.6, 2.9, 15.2, 2.3, 0.5, 7.8, 42);
    let last = -1;
    W.park.blocks.forEach((m, i) => {
      const land = c.s + 0.2 + i * 0.36, f = seg(T, land - 0.32, land);
      m.visible = T >= land - 0.32; m.position.y = 0.2 + (1 - easeIn(f)) * 3.0;
      const sq = T >= land ? 1 + 0.18 * Math.exp(-(T - land) * 10) * Math.sin((T - land) * 30) : 1; m.scale.set(1 / Math.sqrt(sq), sq, 1 / Math.sqrt(sq));
      if (T >= land) last = i;
      if (T >= land && T < land + 0.35) c.fx.sparkle(ROCK.x, 0.5, BLOCK_Z[i], 0.5, 1, T, 20 + i);
    });
    W.park.queue.forEach((m, i) => { m.visible = T < c.s + 0.2 + (5 - i) * 0.36 - 0.32; m.scale.setScalar(1); });
    A.qwen.put(3.0, 0, 10.4).do('nod', last >= 0 ? c.s + 0.2 + last * 0.36 : c.s).face(-1);
    A.claude.put(0.3, 0, 10.5).do(u < 0.7 ? 'read' : 'nod', u < 0.7 ? c.s : c.s + 0.7 * c.d).face(1);
    A.zai.put(4.3, 0, 10.9).do('hop', c.s).face(-1);
    A.doubao.put(-0.9, 0, 10.7).do('step', c.s).face(1);
    A.gemini.put(5.5, 0, 11.4).do('sway', c.s).face(-1);
    A.whale.put(mix(1.6, 2.2, ease(seg(u, 0, 0.4))), ROCK.top, ROCK.z + 0.3);
    if (u < 0.42) A.whale.do('walk', c.s, 0.8).face(1); else if (u < 0.62) A.whale.do('shake', c.s + 0.42 * c.d).tilt(0.5 * arc(seg(u, 0.42, 0.62))).emote('fx_sweat'); else A.whale.do('hop', c.s + 0.62 * c.d).face(1);
  },
  S12: (c) => {
    const { A, T, u } = c;
    const k = ease(u);
    c.cam(mix(4.6, 8.0, k), mix(0.55, 6.6, k), mix(9.4, 13.0, k), 2.0, mix(0.9, 0.3, k), mix(6.0, 4.0, k), 46);
    const wz = mix(6.0, 2.4, u); A.whale.put(ROCK.x, bridgeY(wz), wz).do('walk', c.s).go(0, -1);
    (['doubao', 'gemini', 'qwen', 'claude', 'zai'] as Who[]).forEach((w, i) => { const z = 10.4 + i * 1.15 - u * 4.8; A[w].put(ROCK.x + (i % 2 ? 0.15 : -0.15), bridgeY(z), z).do('walk', c.s + i * 0.1).go(0, -1); });
    const glow = ease(seg(u, 0.62, 0.85));
    c.after(() => {
      const p = A.whale.ground.clone().add(V(0, 0.95, 0.12));
      c.fx.glowWorld(0, p, 1.0 + 0.25 * c.pulse, CANDY[Math.floor(T * 5) % 6], 0.9 * glow);
      c.fx.glowWorld(1, p, 2.4, '#fff4d6', 0.35 * glow);
    });
    if (glow > 0) c.fx.sparkle(ROCK.x, 1.0, wz, 0.75, glow, T, 30);
  },
  S13: (c) => {
    const { A, T, u } = c;
    c.cam(6.4, 5.7, 11.8, 0.4, 6.3, 0.4, 40);
    const x = 1.3, z = 1.5; A.whale.put(x, hillY(x, z) - 0.42, z).face(-1).do(u < 0.55 ? 'idle' : 'point', u < 0.55 ? 0 : c.s + 0.55 * c.d, 0.7).hold(c.card, 0.42, 0.62);
    const tw = 0.8 + 0.2 * Math.sin(T * 9);
    c.fx.glow(1, -4.5, 10.2, -6, 1.3 * tw, '#fff6c8', ease(seg(u, 0.25, 0.5)));
    c.fx.sparkle(-4.5, 10.2, -6, 0.5, 0.6 * seg(u, 0.25, 0.5), T, 40);
  },
  S14: (c) => {
    const { A, T, u } = c;
    c.cam(3.3, 6.7, 7.8, 0.1, 5.95, 1.4, 42);
    const wx = 1.1, wz = 1.7; A.whale.put(wx, hillY(wx, wz), wz).face(-1).hold(c.card, 0.42, 0.62);
    if (u < 0.2) A.whale.do('idle', 0, 0.7); else if (u < 0.6) A.whale.do('surprise', c.s + 0.2 * c.d); else A.whale.do('sway', c.s + 0.6 * c.d);
    const gx = -0.9, gz = 1.5, land = ease(seg(u, 0, 0.55));
    A.gpt.put(gx, hillY(gx, gz), gz).up(mix(6.5, 0.15, land)).face(1);
    if (u < 0.58) A.gpt.do('float', c.s); else A.gpt.do('nod', c.s + 0.58 * c.d);
    if (u > 0.62) A.gpt.emote('fx_heart');
    const warm = ease(seg(u, 0.55, 0.85));
    c.fx.glow(2, 0.1, hillY(0, 1.6) + 1.1, 1.75, 4.2 * warm + 0.1, '#ffcfa0', 0.55 * warm);
    c.fx.sparkle(0.1, hillY(0, 1.6) + 1.2, 1.6, 1.4, 0.7 * warm, T, 41, 'rise');
  },
  S15: (c) => {
    const { A, T, u } = c;
    const jump = 0.32, run = seg(u, 0, jump), fly = seg(u, jump, 1);
    const x = mix(0.7, 1.5, run), z = mix(1.9, 6.0, run) + 2.2 * easeOut(fly);
    const y = hillY(x, Math.min(z, 6.0)) + 9.5 * easeOut(fly) * (1 - 0.15 * (1 - fly));
    A.whale.put(x, y, z);
    if (u < jump) A.whale.do('walk', c.s, 1.9).go(0.2, 1); else A.whale.do('spin', c.s + jump * c.d);
    if (u < jump) A.whale.hold(c.card, 0.42, 0.62);
    else { const f = seg(u, jump, 0.95); const cp = V(x + 0.5 + f * 1.5, y + 0.9 + f * 6.5 + arc(f), z - f * 2); c.card.put(cp.x, cp.y, cp.z, 1.6); c.card.roll = f * 9; }
    const gSlow = ease(seg(u, 0.6, 1));
    if (u > 0.22) A.gpt.put(x - 0.7, y - 1.6 - 3.2 * gSlow, z - 0.25).up(0).do('fly', c.s).face(1); else A.gpt.put(-0.9, hillY(-0.9, 1.5), 1.5).do('float', c.s).face(1);
    if (u > jump) c.fx.sparkle(x, y + 0.9, z, 1.2, 0.9, T, 50, 'rise');
    c.cam(x + 5.4, y + 0.6 - 1.2 * fly, z + 9.0, x, y + 0.9, z, 46);
  },
  S16a: (c) => {
    const { A, T, u } = c;
    const phi = 0.5 + u * 0.35;
    c.cam(-1.8 + Math.sin(phi) * 7, 2.6 + u * 0.4, -6.8 + Math.cos(phi) * 7, -1.2, 2.6, -8.5, 48);
    A.kimi.put(-3.3, 0.88, -6.7).face(1).do(u < 0.5 ? 'think' : 'nod', u < 0.5 ? c.s : c.s + 0.5 * c.d);
    const k = ease(seg(u, 0, 0.5));
    A.whale.put(mix(4.8, -1.15, k), mix(-1.8, 1.0, k) + 0.15 * Math.sin(T * 2.4), mix(-3.2, -6.2, k)).up(0).face(-1);
    A.whale.shadowOn = false;
    if (u < 0.36) A.whale.do('spin', c.s); else if (u < 0.82) A.whale.do('idle', 0, 0.8); else A.whale.do('bow', c.s + 0.82 * c.d);
    const give = ease(seg(u, 0.55, 0.8));
    if (give <= 0) A.kimi.hold(c.card, 0.42, 0.55);
    else if (give >= 1) A.whale.hold(c.card, 0.42, 0.62);
    else c.after(() => { const p = A.kimi.hand.clone().lerp(A.whale.hand, give); p.y += arc(give) * 0.5; c.card.putWorld(p, 1.6); c.card.update(T, cameraOf(c)); });
    c.fx.sparkle(-2.2, 1.6, -6.6, 2.0, 0.5, T, 60);
  },
  S16b: (c) => {
    const { A, L, T, u } = c;
    const ang = 0.7 + u * 1.7, rad = mix(6.2, 3.3, ease(u));
    const W0 = V(-1.15, 1.0, -6.2);
    c.cam(W0.x + Math.sin(ang) * rad, 1.9 + u * 0.7, W0.z + Math.cos(ang) * rad, W0.x, 2.0, W0.z, 46);
    A.whale.put(W0.x, W0.y + 0.12 * Math.sin(T * 2.4), W0.z).face(-1); A.whale.shadowOn = false;
    if (u < 0.55) A.whale.do('spin', c.s); else A.whale.do('idle', 0, 0.9);
    A.kimi.put(-3.3, 0.88, -6.7).face(1).do('idle', 0, 0.8);
    if (u < 0.15) A.whale.hold(c.card, 0.42, 0.62);
    const hits = [45.5, 46.0, 46.15, 46.6, 46.75, 47.4, 47.7];
    let fl = 0; hits.forEach((h, i) => { if (T >= h) { fl += 0.22 * Math.exp(-(T - h) * 10); const r = (T - h) * 3.2; c.fx.ring(i, W0.x, 1.9, W0.z, 0.4 + r, 1 - seg(T, h, h + 0.9), Math.PI / 2 + 0.3 * Math.sin(i)); } });
    c.post.flash = Math.max(fl, 0.9 * ease(seg(T, 47.72, 47.95)));
    c.fx.sparkle(W0.x, 2.0, W0.z, 3.2, 1.3, T, 70, 'swirl', ease(seg(u, 0.08, 0.7)));
    const form = ease(seg(u, 0.42, 0.75));
    c.after(() => {
      if (form > 0) { L.holdBy(A.whale, 0.6 * form + 0.001, 0.55 * form); L.lit = 1.5 * form; L.spin = T * (2 + 10 * (1 - form)); }
      if (u > 0.7) c.R.draw((s) => { const a = T * 3 - s * 5; return L.group.position.clone().sub(c.W.zones.sky.position).add(V(Math.cos(a) * 1.2 * s, -s * 0.6 + Math.sin(T * 4 - s * 6) * 0.2, Math.sin(a) * 1.2 * s)); }, 0.26, cameraOf(c), seg(u, 0.7, 0.85));
    });
  },

  // ───── 第四段 · 光是大家的 ─────
  S17: (c) => {
    const { A, L, T, u } = c;
    c.post.flash = 0.85 * Math.exp(-(T - c.s) * 5);
    const k = ease(u);
    const r17 = mix(4.4, 12.5, k); c.cam(PLAZA.x + r17 * 0.259, mix(1.3, 6.4, k), PLAZA.z + r17 * 0.966, PLAZA.x, mix(1.9, 1.0, k), PLAZA.z, 48);
    A.whale.put(PLAZA.x, 0, PLAZA.z).do('idle', 0, 1).up(0.12 * c.pulse).face(1);
    CIRCLE.slice(1).forEach((w, i) => { const [x, z] = ringPos(i, 7, 2.9, 0.35); A[w].put(x, 0, z).do(w === 'gpt' ? 'float' : 'hop', c.s + hash(i) * 0.4).up(w === 'gpt' ? 0.6 : 0).face(x < PLAZA.x ? 1 : -1); });
    c.fx.rain(PLAZA.x, PLAZA.z, 6.5, T - c.s, 1);
    c.after(() => { L.holdBy(A.whale, 0.75, 0.85); L.lit = 1.45 + 0.2 * c.pulse; L.spin = T * 2.5; c.fx.glowWorld(0, L.group.position, 3.4, '#fff0d0', 0.5); });
  },
  S18: (c) => {
    const { A, L, T, u } = c;
    const phi = 0.9 + u * 1.8;
    c.cam(PLAZA.x + Math.cos(phi) * 5.6, 2.5, PLAZA.z + Math.sin(phi) * 5.6, PLAZA.x, 1.35, PLAZA.z, 46);
    const th = 1.2 + u * TAU * 1.15;
    CIRCLE.forEach((w, i) => {
      const a = Math.PI / 2 + (i / 8) * TAU; const x = PLAZA.x + Math.cos(a) * 2.8, z = PLAZA.z + Math.sin(a) * 2.8;
      A[w].put(x, 0, z).do(verb(w, 'sway'), c.s + i * 0.13).up(w === 'gpt' ? 0.5 : 0);
      const dA = Math.atan2(Math.sin(th - a), Math.cos(th - a)); const hit = Math.exp(-dA * dA * 5);
      c.fx.glow(2 + i, x, 2.1, z, 1.3, CANDY[i % 6], 0.7 * hit);
    });
    c.R.draw((s) => V(PLAZA.x + Math.cos(th - s * 3.4) * 2.95, 2.65 + 0.25 * Math.sin(s * 6 + T * 3), PLAZA.z + Math.sin(th - s * 3.4) * 2.95), 0.36, cameraOf(c), 1);
    c.after(() => { L.holdBy(A.whale, 0.6, 0.6); L.lit = 1.3; L.spin = T * 2; });
  },
  S19: (c) => {
    const { A, L, T, u } = c;
    c.pal('festival', 'starry', 0.5);
    c.cam(-5.0, 1.6, 15.4, -8.3, 0.9, 10.9, 44);
    const zx = -7.5, zz = 11.6;
    if (u < 0.6) A.zai.put(zx, 0, zz).do('doze', c.s).face(-1).emote('fx_zzz'); else if (u < 0.76) A.zai.put(zx, 0, zz).do('alert', c.s + 0.6 * c.d).face(-1).emote('fx_exclaim'); else A.zai.put(zx, 0, zz).do('hop', c.s + 0.76 * c.d).face(-1);
    const w = ease(seg(u, 0, 0.5));
    A.whale.put(mix(-12.2, -9.0, w), 0, mix(9.4, 10.9, w));
    if (u < 0.5) A.whale.do('walk', c.s).go(1, 0.4); else A.whale.do('idle', 0, 0.9).face(1);
    const lightK = ease(seg(u, 0.38, 0.65));
    c.fx.glow(3, zx, 0.9, zz + 0.2, 2.6, '#ffe6b8', 0.32 * lightK);
    c.after(() => { L.holdBy(A.whale, 0.6, 0.35 + 0.2 * lightK); L.lit = 1.1; L.spin = T * 1.5; c.fx.glowWorld(0, L.group.position, 2.2, '#fff0d0', 0.2); });
  },
  S20: (c) => {
    const { A, L, T, u } = c;
    const rot = (T - c.s) * 0.5 + 0.5;
    const phi = 0.4 + u * 2.2;
    c.cam(PLAZA.x, 0.95, PLAZA.z, PLAZA.x + Math.cos(phi) * 3, 1.25, PLAZA.z + Math.sin(phi) * 3, 62);
    CIRCLE.forEach((w, i) => { const [x, z] = ringPos(i, 8, 2.65, rot); A[w].put(x, 0, z).do(verb(w, i % 2 ? 'sway' : 'hop'), c.s + i * 0.1).up(w === 'gpt' ? 0.5 : 0.1 * c.pulse).go(-Math.sin(rot + (i / 8) * TAU), Math.cos(rot + (i / 8) * TAU)); });
    c.fx.rain(PLAZA.x, PLAZA.z, 5, T - c.s + 3, 0.8);
    c.after(() => { L.holdBy(A.whale, 0.55, 0.55); L.lit = 1.3 + 0.2 * c.pulse; L.spin = T * 2; });
  },
  S21: (c) => {
    const { A, L, T } = c;
    c.cam(PLAZA.x + 0.5, 5.0, PLAZA.z + 5.4, PLAZA.x, 0.7, PLAZA.z - 0.3, 48);
    const pos = CIRCLE.map((_, i) => ringPos(i, 8, 2.7, Math.PI / 2));
    const q = Math.max(0, (T - c.s - 0.1) / HB); const k = Math.floor(q), fr = q - k;
    const holder = k % 8;
    CIRCLE.forEach((w, i) => { A[w].put(pos[i][0], 0, pos[i][1]).do(i === holder ? 'nod' : w === 'gpt' ? 'hover' : 'idle', i === holder ? c.s + 0.1 + k * HB : 0, 0.9).up(w === 'gpt' ? 0.45 : 0); });
    c.after(() => {
      const a = A[CIRCLE[holder]], b = A[CIRCLE[(holder + 1) % 8]];
      const m = ease(seg(fr, 0.55, 1)); const p = a.hand.clone().lerp(b.hand, m); p.y += 0.36 + arc(m) * 0.5;
      L.putWorld(p, 0.55); L.lit = 1.2 + 0.4 * Math.exp(-fr * 4); L.spin = T * 2;
      c.fx.glowWorld(0, p, 1.6 + Math.exp(-fr * 4), CANDY[holder % 6], 0.6);
    });
  },
  S22: (c) => {
    const { A, L, T } = c;
    c.cam(PLAZA.x + 1.3, 0.42, PLAZA.z + 1.9, PLAZA.x - 0.4, 3.4, PLAZA.z - 1.2, 58);
    A.whale.put(PLAZA.x, 0, PLAZA.z).do('idle', 0, 0.9).face(1);
    CIRCLE.slice(1).forEach((w, i) => { const [x, z] = ringPos(i, 7, 3.0, -0.4); A[w].put(x, 0, z).do(w === 'kimi' ? 'lookaround' : verb(w, 'tilt'), c.s + i * 0.15).up(w === 'gpt' ? 0.5 : 0); });
    c.after(() => {
      L.holdBy(A.whale, 0.7, 0.95); L.lit = 1.2; L.spin = T * 3;
      const p = L.group.position.clone().sub(c.W.zones.park.position);
      for (let j = 0; j < 6; j++) { const bt = beatT(95 + j); if (T >= bt) { const a = T - bt; c.fx.ring(j, p.x, p.y + a * 1.7, p.z, 0.4 + a * 2.3, 1 - a / 2.2); } }
      c.fx.glowWorld(0, L.group.position, 2.6, '#fff1d4', 0.26);
    });
    c.fx.sparkle(PLAZA.x, 3.4, PLAZA.z, 2.2, 0.8, T, 80, 'rise');
  },
  S23: (c) => {
    const { A, L, T, u } = c;
    if (u < 0.5) c.cam(PLAZA.x + 0.5, 1.45, PLAZA.z + 3.1, PLAZA.x, 1.3, PLAZA.z, 38); else c.cam(PLAZA.x + 1.45, 2.8, PLAZA.z + 5.4, PLAZA.x, 1.0, PLAZA.z, 48);
    A.whale.put(PLAZA.x, 0, PLAZA.z).face(1);
    if (u < 0.2) A.whale.do('idle', 0, 0.9); else if (u < 0.5) A.whale.do('surprise', c.s + 0.2 * c.d); else A.whale.do('nod', c.s + 0.5 * c.d);
    CIRCLE.slice(1).forEach((w, i) => {
      const [x, z] = ringPos(i, 7, 2.9, -0.2); A[w].put(x, 0, z).up(w === 'gpt' ? 0.5 : 0);
      if (u < 0.2) A[w].do(w === 'gpt' ? 'hover' : 'idle', 0, 0.9); else if (u < 0.56 + i * 0.03) A[w].do(verb(w, 'surprise'), c.s + 0.2 * c.d); else A[w].do('nod', c.s + (0.56 + i * 0.03) * c.d);
      const on = ease(seg(u, 0.55 + i * 0.04, 0.65 + i * 0.04)); c.fx.glow(2 + i, x + 0.45, 1.1 + (w === 'gpt' ? 0.5 : 0), z + 0.2, 0.9 + 0.1 * Math.sin(T * 5 + i), CANDY[i % 6], 0.85 * on);
    });
    c.after(() => { L.holdBy(A.whale, 0.6, 0.6); L.lit = u < 0.18 ? 1.3 : u < 0.34 ? flicker(T, 0.2 + u) : 0; L.spin = T * (u < 0.34 ? 2 : 0.1); });
  },
  S24a: (c) => {
    const { A, L, T, u } = c;
    const wx = mix(-9.2, -4.6, u);
    c.cam(wx - 1.7, 1.6, -7.6, wx - 1.9, 1.0, -14.5, 44);
    const order: Who[] = ['whale', 'doubao', 'gemini', 'claude', 'qwen', 'zai', 'kimi', 'gpt'];
    order.forEach((w, i) => { A[w].put(wx - i * 1.25, 0, -14.5 + (i % 2 ? -0.3 : 0.15)).do(w === 'gpt' ? 'fly' : 'walk', c.s + i * 0.07).go(1, 0).up(w === 'gpt' ? 0.8 : 0); if (i > 0) c.fx.glow(2 + i, wx - i * 1.25 + 0.4, 1.0 + (w === 'gpt' ? 0.8 : 0), -14.3, 0.8, CANDY[i % 6], 0.6 * (1 - u * 0.6)); });
    c.after(() => { L.holdBy(A.whale, 0.55, 0.5); L.lit = 0; L.spin = 0; });
  },
  S24b: (c) => {
    const { A, L, T, u } = c;
    const k = ease(u);
    c.cam(mix(4.4, 2.6, k), mix(1.5, 3.4, k), mix(-8.8, -0.4, k), mix(2.4, 0.8, k), mix(1.4, 2.2, k), mix(-14.5, -15, k), 44);
    const up = ease(seg(u, 0, 0.12));
    A.whale.put(mix(2.0, MOUND.x, up), mix(0.55, MOUND.top, up), MOUND.z);
    if (u < 0.12) A.whale.do('walk', c.s).face(1); else A.whale.do('idle', 0, 0.9).face(-1);
    const fr: Who[] = ['doubao', 'gemini', 'claude', 'qwen', 'zai', 'kimi', 'gpt'];
    fr.forEach((w, i) => { A[w].put(1.4 - i * 1.15, 0, -14.4 + (i % 2 ? -0.35 : 0.2)).face(1).do(w === 'gpt' ? 'float' : verb(w, ['hop', 'sway', 'idle'][i % 3]), c.s + i * 0.12, 0.9).up(w === 'gpt' ? 0.9 : 0); });
    const lit = ease(seg(u, 0.36, 0.5));
    c.after(() => {
      L.holdBy(A.whale, 0.65, 0.75 * ease(seg(u, 0.22, 0.34))); L.lit = 1.5 * lit; L.spin = T * (1 + 2 * lit);
      if (lit > 0) { const p = L.group.position.clone().sub(c.W.zones.park.position); for (let j = 0; j < 3; j++) { const t0 = 69.7 + j * BEAT.period * 2; if (T >= t0) { const a = T - t0; c.fx.ring(j, p.x, p.y, p.z, 0.3 + a * 2.6, 0.9 - a / 2.4, Math.PI / 2 - 0.35); } } c.fx.glowWorld(0, L.group.position, 3.8 * lit, '#fff2d2', 0.6 * lit); }
    });
    if (lit > 0) c.fx.sparkle(MOUND.x, 2.0, MOUND.z, 1.4, lit, T, 90, 'rise');
    c.post.fade = ease(seg(T, 71.35, 72.3)); c.post.fadeWhite = true;
  },
};

/** 镜头函数里取当前机位（披风朝向镜头要用） */
let _cam: THREE.Camera | null = null;
export function setShotCamera(cam: THREE.Camera) { _cam = cam; }
function cameraOf(_c: Ctx): THREE.Camera { if (!_cam) throw new Error('镜头还没设置机位'); return _cam; }
