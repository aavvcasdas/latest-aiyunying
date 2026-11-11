import * as THREE from "three";
import { hash, hash2, lerp, clamp01 } from "../core";
import * as K from "./kit";

export type LookId = "night" | "dawn" | "bar" | "room" | "roof" | "memory" | "vanity";
export type SetId = "street" | "bar" | "room" | "roof" | "vanity";

/** 每帧由镜头改写、再交给布景的环境量（每帧从默认值重新开始） */
export interface Env {
  look: LookId | null;
  dawn: number;
  rain: number;
  rainX: number;
  rainZ: number;
  wind: number;
  fog: number;
  lamps: number;
  lamp0: number;
  sign: number;
  door: number;
  cars: number;
  tiles: number;
  beams: number;
  sideDoor: number;
  pendant: number;
  day: number;
  who: "claude" | "whale";
  bulbs: number;
}
export const ENV0: Env = {
  look: null,
  dawn: 0,
  rain: 1,
  rainX: 0,
  rainZ: 0,
  wind: 0.6,
  fog: 1,
  lamps: 1,
  lamp0: 1,
  sign: 1,
  door: 0,
  cars: 1,
  tiles: 1,
  beams: 1,
  sideDoor: 0,
  pendant: 0,
  day: 0,
  who: "claude",
  bulbs: 1,
};

export interface SetCtx {
  T: number;
  bar: number;
  beat: number;
  pulse: number;
  bi: number;
  env: Env;
  lights: THREE.PointLight[];
  focusX: number;
}
export interface StageSet {
  id: SetId;
  group: THREE.Group;
  look: LookId;
  defaults: Partial<Env>;
  update: (c: SetCtx) => void;
  props?: Record<string, K.Prop>;
}

function light(L: THREE.PointLight, x: number, y: number, z: number, color: THREE.ColorRepresentation, I: number) {
  L.position.set(x, y, z);
  L.color.set(color);
  L.intensity = Math.max(0, I);
}
const NEON = [0xff3d9a, 0x38e8ff, 0x9b5cff, 0xffb347];

// ================================================================== 街道
export const SW = 0.12; // 人行道高度：街道镜头里人物的 y
export const LAMP_X = [-36, -27, -18, -9, 0, 9, 27, 36];
export const BAR_X = 18;

export function buildStreet(): StageSet {
  const g = new THREE.Group();
  const road = new THREE.Mesh(new THREE.PlaneGeometry(240, 14), new THREE.MeshStandardMaterial({ color: 0x141826, roughness: 0.28, metalness: 0.25 }));
  road.rotation.x = -Math.PI / 2;
  road.position.set(0, 0, 8.6);
  const walk = K.box(240, SW, 4.6, 0x2a3048, false);
  walk.position.set(0, 0, -0.7);
  const curb = K.box(240, SW + 0.03, 0.14, 0x4a5272, false);
  curb.position.set(0, 0, 1.6);
  const walk2 = K.box(240, SW, 4, 0x262b40, false);
  walk2.position.set(0, 0, 17.6);
  g.add(road, walk, curb, walk2);
  const dashM = K.basic(0xd8d0a0);
  for (let x = -110; x < 110; x += 4) {
    const d = K.box(2, 0.012, 0.12, dashM, false);
    d.position.set(x, 0, 8.6);
    g.add(d);
  }
  // 楼：近排（带墨线、底商、霓虹）
  const bodies = [0x161c38, 0x1c1636, 0x12203a, 0x201a30];
  let x = -80;
  let i = 0;
  while (x < 80) {
    const w = 3 + hash(i) * 3.6;
    if (x + w > BAR_X - 3.4 && x < BAR_X + 3.6) {
      x = BAR_X + 3.6;
      continue;
    }
    const h = 6 + hash(i + 0.3) * 12;
    const b = K.building(w, h, 5, i, bodies[i % 4], true, 0.9);
    b.position.set(x + w / 2, SW, -5.5);
    g.add(b);
    if (hash(i + 0.6) > 0.3) {
      const col = [0xb8743a, 0x3a7a9a, 0xa04a80, 0xa08a4a][i % 4];
      const shop = K.plane(w * 0.78, 2.1, K.basic(col, 0.9));
      shop.position.set(x + w / 2, SW + 1.25, -2.98);
      const awn = K.box(w * 0.86, 0.12, 0.7, [0xd94a6a, 0x2f8f9a, 0x6a4ab0, 0xc08a3a][i % 4]);
      awn.position.set(x + w / 2, SW + 2.45, -2.7);
      const spill = K.glow(col, 3.2, 0.18);
      spill.position.set(x + w / 2, SW + 0.9, -2.4);
      g.add(shop, awn, spill);
    }
    if (hash(i + 0.8) > 0.45) {
      const col = NEON[i % 4];
      const n = K.box(0.32, 1.7, 0.1, K.basic(col), false);
      n.position.set(x + 0.45, SW + 3.2, -2.85);
      const ng = K.glow(col, 1.9, 0.5);
      ng.position.set(x + 0.45, SW + 4.05, -2.6);
      g.add(n, ng);
    }
    x += w + 0.12;
    i++;
  }
  // 远排、对面一排
  for (let k = 0, xx = -120; xx < 120; k++) {
    const w = 4 + hash(k + 50) * 6;
    const b = K.building(w, 12 + hash(k + 51) * 26, 6, k + 3, 0x0e1430, false, 0.8);
    b.position.set(xx + w / 2, 0, -17 - hash(k + 52) * 6);
    g.add(b);
    xx += w + 0.6;
  }
  for (let k = 0, xx = -100; xx < 100; k++) {
    const w = 3 + hash(k + 80) * 4;
    const b = K.building(w, 6 + hash(k + 81) * 9, 5, k + 5, 0x181d36, true, 0.8);
    b.position.set(xx + w / 2, SW, 22.2);
    g.add(b);
    xx += w + 0.15;
  }
  // 路灯
  const lamps = LAMP_X.map((lx) => {
    const lg = new THREE.Group();
    lg.position.set(lx, SW, -2.45);
    const pole = K.cyl(0.06, 0.08, 4.2, 0x0b0e1a, 10);
    const arm = K.box(0.08, 0.08, 2.45, 0x0b0e1a);
    arm.position.set(0, 4.08, 1.2);
    const head = K.box(0.4, 0.16, 0.26, 0x0b0e1a);
    head.position.set(0, 3.94, 2.35);
    const bulb = K.plane(0.3, 0.18, K.basic(0xfff1c8));
    bulb.rotation.x = Math.PI / 2;
    bulb.position.set(0, 3.93, 2.35);
    const gl = K.glow(0xffe2a8, 1.6, 0.9);
    gl.position.set(0, 3.86, 2.35);
    const coneG = new THREE.ConeGeometry(1.55, 3.85, 28, 1, true);
    coneG.translate(0, -1.925, 0);
    const cone = new THREE.Mesh(coneG, K.basic(0xffd9a0, 0.07, true));
    cone.position.set(0, 3.9, 2.35);
    const pud = K.disc(1.4, K.basic(0xffd9a0, 0.22, true));
    pud.position.set(0, 0.008, 2.35);
    lg.add(pole, arm, head, bulb, gl, cone, pud);
    g.add(lg);
    return { x: lx, gl, cone, pud, bulb };
  });
  // 酒吧门面
  const bar = K.building(7, 9, 5, 9, 0x1c0f2a, true, 0.5);
  bar.position.set(BAR_X, SW, -5.5);
  const doorP = K.door(1.1, 2.2, 0x4a2a5a);
  doorP.g.position.set(BAR_X, SW, -2.95);
  const sign = K.neonSign("BAR", "#ff3d9a", 2.2, 0.85);
  sign.g.position.set(BAR_X, SW + 2.75, -2.92);
  const winL = K.plane(1.8, 1.4, K.basic(0xff7ac8, 0.7));
  winL.position.set(BAR_X - 2.2, SW + 1.4, -2.98);
  const winR = winL.clone();
  winR.position.x = BAR_X + 2.2;
  const barGlow = K.glow(0xff3d9a, 6, 0.35);
  barGlow.position.set(BAR_X, SW + 2, -2.2);
  g.add(bar, doorP.g, sign.g, winL, winR, barGlow);
  // 路牌「无名街」
  const sp = K.cyl(0.04, 0.04, 2.6, 0x0b0e1a, 8);
  sp.position.set(-15, SW, 1.15);
  const plate = K.box(1.3, 0.42, 0.06, 0x2a5a8a);
  plate.position.set(-15, SW + 2.35, 1.15);
  const label = K.plane(1.16, 0.34, new THREE.MeshBasicMaterial({ map: K.textTex("无名街", { w: 256, h: 76, size: 56, color: "#e8f0ff" }), transparent: true }));
  label.position.set(-15, SW + 2.56, 1.19);
  g.add(sp, plate, label);
  // 车流
  const cars = [0, 1].map((k) => {
    const cg = new THREE.Group();
    const col = k ? 0x3a6ad0 : 0xd04a6a;
    const body = K.box(2.3, 0.5, 1.05, col);
    body.position.y = 0.25;
    const cab = K.box(1.25, 0.42, 0.95, 0x1a1f30);
    cab.position.set(-0.1, 0.75, 0);
    cg.add(body, cab);
    for (const [wx, wz] of [
      [-0.75, 0.5],
      [0.75, 0.5],
      [-0.75, -0.5],
      [0.75, -0.5],
    ]) {
      const wg = new THREE.CylinderGeometry(0.22, 0.22, 0.14, 12);
      wg.rotateX(Math.PI / 2);
      const wh = new THREE.Mesh(wg, K.toon(0x111111));
      wh.position.set(wx, 0.24, wz);
      cg.add(wh);
    }
    const hl = K.glow(0xfff2c8, 1.2, 0.9);
    hl.position.set(1.2, 0.45, 0);
    const tl = K.glow(0xff2a3a, 0.8, 0.8);
    tl.position.set(-1.2, 0.45, 0);
    const beamG = new THREE.ConeGeometry(1.2, 5, 18, 1, true);
    beamG.rotateZ(Math.PI / 2);
    beamG.translate(3.6, 0, 0);
    const beam = new THREE.Mesh(beamG, K.basic(0xfff0c8, 0.06, true));
    beam.position.set(1.15, 0.45, 0);
    cg.add(hl, tl, beam);
    cg.rotation.y = k ? Math.PI : 0;
    g.add(cg);
    return cg;
  });

  return {
    id: "street",
    group: g,
    look: "night",
    defaults: {},
    update: (c) => {
      const e = c.env;
      lamps.forEach((l) => {
        const on = (l.x === 0 ? e.lamp0 : 1) * e.lamps;
        K.setOpacity(l.gl, 0.9 * on);
        K.setOpacity(l.cone, 0.07 * on);
        K.setOpacity(l.pud, 0.22 * on);
        (l.bulb.material as THREE.MeshBasicMaterial).color.setScalar(0.15 + 0.85 * on);
      });
      // 离镜头焦点最近的三盏灯真的发光
      const near = [...lamps].sort((a, b) => Math.abs(a.x - c.focusX) - Math.abs(b.x - c.focusX)).slice(0, 3);
      near.forEach((l, k) => light(c.lights[k], l.x, SW + 3.75, -0.1, 0xffd9a0, 24 * (l.x === 0 ? e.lamp0 : 1) * e.lamps));
      const flick = e.sign < 1 && e.sign > 0 ? (hash(Math.floor(c.T * 14)) > 0.35 ? e.sign : e.sign * 0.2) : e.sign;
      sign.set(flick);
      K.setOpacity(barGlow, 0.35 * flick);
      doorP.set(e.door);
      light(c.lights[3], BAR_X, SW + 2.6, -1.6, 0xff4da6, 12 * flick + 10 * e.door);
      cars.forEach((cg, k) => {
        cg.visible = e.cars > 0;
        const sp = k ? 9 : 12;
        const ph = ((c.T * sp + k * 61) % 150) - 75;
        cg.position.set(k ? -ph : ph, 0, k ? 11.4 : 5.6);
      });
    },
  };
}

// ================================================================== 酒吧内部
export function buildBar(): StageSet {
  const g = new THREE.Group();
  const floor = K.box(18, 0.1, 12, 0x140c1c, false);
  floor.position.set(0, -0.1, -1);
  const wallM = K.toon(0x24102e);
  const back = K.box(18, 5.4, 0.2, wallM, false);
  back.position.set(0, 0, -7.1);
  const left = K.box(0.2, 5.4, 12, wallM, false);
  left.position.set(-9.1, 0, -1);
  const right = left.clone();
  right.position.x = 9.1;
  const ceil = K.box(18, 0.2, 12, 0x0c0612, false);
  ceil.position.set(0, 5.4, -1);
  g.add(floor, back, left, right, ceil);
  for (let k = 0; k < 9; k++) {
    const p = K.box(0.12, 5.4, 0.06, 0x1a0a22, false);
    p.position.set(-8 + k * 2, 0, -6.98);
    g.add(p);
  }
  const tube = (x: number, y: number, w: number, col: number) => {
    const t = K.box(w, 0.07, 0.07, K.basic(col), false);
    t.position.set(x, y, -6.92);
    g.add(t);
    for (let k = 0; k < 3; k++) {
      const gl = K.glow(col, 2.2, 0.35);
      gl.position.set(x - w / 2 + (w * (k + 0.5)) / 3, y, -6.7);
      g.add(gl);
    }
  };
  tube(-4.6, 4.1, 6, 0xff3d9a);
  tube(-4.6, 3.85, 5, 0x9b5cff);
  tube(4.6, 4.3, 6, 0x38e8ff);
  const heart = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.7), new THREE.MeshBasicMaterial({ map: K.FX_TEX.heart, color: 0xff3d9a, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  heart.position.set(0, 3.0, -6.9);
  const heartG = K.glow(0xff3d9a, 4, 0.4);
  heartG.position.set(0, 3.0, -6.6);
  g.add(heart, heartG);
  // 舞池
  const tiles: THREE.MeshBasicMaterial[] = [];
  for (let r = 0; r < 4; r++)
    for (let k = 0; k < 7; k++) {
      const m = new THREE.MeshBasicMaterial({ color: 0x120c1d });
      tiles.push(m);
      const t = K.box(0.94, 0.04, 0.94, m, false);
      t.position.set(-3 + k, 0, -3.5 + r);
      g.add(t);
    }
  // 迪斯科球
  const string = K.cyl(0.01, 0.01, 1, 0x555a70, 4, false);
  string.position.set(0, 4.4, -2);
  const ballM = new THREE.MeshLambertMaterial({ color: 0xd8e0f0, flatShading: true, emissive: 0x30304a });
  const disco = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), ballM);
  disco.position.set(0, 4.3, -2);
  g.add(string, disco);
  const sparks = Array.from({ length: 36 }, (_, k) => {
    const s = K.fx("star", 0xffffff, 0.16, 0.8);
    s.userData.k = k;
    g.add(s);
    return s;
  });
  // 扫光
  const beams = [
    [-3.2, 0xff3d9a],
    [0, 0x38e8ff],
    [3.2, 0x9b5cff],
  ].map(([bx, col]) => {
    const cg = new THREE.ConeGeometry(0.85, 5.2, 20, 1, true);
    cg.translate(0, -2.6, 0);
    const m = new THREE.Mesh(cg, K.basic(col, 0.1, true));
    m.position.set(bx, 5.3, -2.5);
    g.add(m);
    return m;
  });
  // 吧台
  const counter = K.box(4.2, 1.1, 0.8, 0x3b2548);
  counter.position.set(6.5, 0, -4.6);
  const ctop = K.box(4.4, 0.08, 1.0, 0x6a4a7a);
  ctop.position.set(6.5, 1.1, -4.6);
  g.add(counter, ctop);
  for (let s = 0; s < 2; s++) {
    const sh = K.box(4.2, 0.06, 0.3, 0x3a2a48, false);
    sh.position.set(6.5, 1.8 + s * 0.8, -6.85);
    g.add(sh);
    for (let k = 0; k < 11; k++) {
      const col = [0xff5fa0, 0x45e3ff, 0xffd166, 0x9b5cff, 0x7cff7c][(k + s) % 5];
      const b = K.cyl(0.06, 0.07, 0.3 + hash(k + s * 9) * 0.15, K.basic(col), 8, false);
      b.position.set(4.65 + k * 0.37, 1.86 + s * 0.8, -6.85);
      g.add(b);
    }
  }
  for (const sx of [5.2, 6.5, 7.8]) {
    const pole = K.cyl(0.04, 0.04, 0.7, 0x888899, 8, false);
    pole.position.set(sx, 0, -3.8);
    const seat = K.cyl(0.24, 0.24, 0.08, 0xd04a7a, 14);
    seat.position.set(sx, 0.7, -3.8);
    g.add(pole, seat);
  }
  // 音箱
  const cones: THREE.Object3D[] = [];
  for (const sx of [-8.2, 3.4]) {
    const sp = K.box(0.9, 1.9, 0.7, 0x15121c);
    sp.position.set(sx, 0, -6.4);
    g.add(sp);
    for (const [cy, r] of [
      [1.35, 0.3],
      [0.55, 0.2],
    ]) {
      const cg = new THREE.CylinderGeometry(r, r, 0.06, 16);
      cg.rotateX(Math.PI / 2);
      const c = new THREE.Mesh(cg, K.toon(0x2a2436));
      c.position.set(sx, cy, -6.03);
      g.add(c);
      cones.push(c);
    }
  }
  // 沙发区
  const so = K.sofa(3.4, 0x6b2a7b);
  so.position.set(-6, 0, -5.9);
  const lt = K.table(1.6, 0.7, 0.42);
  lt.position.set(-6, 0, -4.55);
  const c1 = K.cocktail(0xff4d8d);
  c1.position.set(-6.35, 0.42, -4.5);
  const c2 = K.cocktail(0x45e3ff);
  c2.position.set(-5.65, 0.42, -4.5);
  g.add(so, lt, c1, c2);
  // 后屋小桌 + 吊灯
  const bt = K.table(1.5, 0.9, 0.78, 0x3a2a2a, 0x241a1a);
  bt.position.set(-5.6, 0, 2.4);
  const cord = K.cyl(0.01, 0.01, 2.0, 0x111111, 4, false);
  cord.position.set(-5.6, 3.4, 2.4);
  const shadeG = new THREE.ConeGeometry(0.32, 0.26, 16, 1, true);
  const shade = new THREE.Mesh(shadeG, new THREE.MeshToonMaterial({ color: 0x3a2a2a, gradientMap: K.GRAD, side: THREE.DoubleSide }));
  shade.position.set(-5.6, 3.32, 2.4);
  const pGlow = K.glow(0xffd29a, 1.4, 0.8);
  pGlow.position.set(-5.6, 3.15, 2.4);
  g.add(bt, cord, shade, pGlow);
  // 左墙侧门
  const sd = K.door(1.1, 2.2, 0x3a1a4a);
  sd.g.position.set(-8.98, 0, 1.2);
  sd.g.rotation.y = Math.PI / 2;
  g.add(sd.g);

  const PAL = [0xff3d9a, 0x38e8ff, 0x9b5cff, 0xffb347];
  const tmp = new THREE.Color();
  return {
    id: "bar",
    group: g,
    look: "bar",
    defaults: { rain: 0, cars: 0 },
    update: (c) => {
      const e = c.env;
      const barI = Math.floor(c.bar);
      tiles.forEach((m, k) => {
        const hv = hash2(k + barI * 7, c.bi);
        if (hv > 0.5) {
          tmp.set(PAL[Math.floor(hv * 97) % 4]);
          m.color.copy(tmp).multiplyScalar(e.tiles * (0.3 + 0.7 * c.pulse) + 0.06);
        } else m.color.set(0x120c1d);
      });
      disco.rotation.y = c.T * 0.8;
      sparks.forEach((s) => {
        const k = s.userData.k as number;
        const a = (k / 36) * Math.PI * 2 + c.T * 0.35;
        const r = 4 + hash(k) * 4;
        s.position.set(Math.cos(a) * r, 0.6 + hash(k + 3) * 4.2, -2 + Math.sin(a) * r * 0.55);
        K.setOpacity(s, e.tiles * (0.3 + 0.6 * hash2(k, Math.floor(c.T * 6))));
      });
      beams.forEach((b, k) => {
        b.rotation.z = Math.sin(c.T * 0.9 + k * 1.7) * 0.55;
        b.rotation.x = Math.cos(c.T * 0.7 + k) * 0.35;
        K.setOpacity(b, e.beams * (0.07 + 0.06 * c.pulse));
      });
      cones.forEach((cn) => cn.scale.setScalar(1 + c.pulse * 0.14 * e.tiles));
      heart.scale.setScalar(1 + c.pulse * 0.1);
      sd.set(e.sideDoor);
      K.setOpacity(pGlow, 0.8 * e.pendant);
      const p = 0.65 + 0.35 * c.pulse;
      light(c.lights[0], -3.5, 4, -1, 0xff3d9a, 14 * p * e.tiles + 3);
      light(c.lights[1], 3.5, 4, -1, 0x38e8ff, 12 * p * e.tiles + 3);
      light(c.lights[2], 6.5, 2.8, -3.2, 0xffb070, 8);
      if (e.pendant > 0) light(c.lights[3], -5.6, 2.9, 2.4, 0xffd29a, 14 * e.pendant);
      else light(c.lights[3], -6, 2.6, -3.6, 0xb070ff, 9);
    },
  };
}

// ================================================================== 卧室
export function daylight(day: number) {
  return 0.5 - 0.5 * Math.cos(day * Math.PI * 2);
}
export function buildRoom(): StageSet {
  const g = new THREE.Group();
  const wallM = K.toon(0x4a3a52);
  const floor = K.box(8, 0.1, 6, 0x2a2030, false);
  floor.position.set(0, -0.1, -0.2);
  const piece = (w: number, h: number, x: number, y: number) => {
    const p = K.box(w, h, 0.2, wallM, false);
    p.position.set(x, y, -3.1);
    g.add(p);
  };
  piece(4.4, 3.6, -1.8, 0);
  piece(0.8, 3.6, 3.6, 0);
  piece(2.8, 1.1, 1.8, 0);
  piece(2.8, 0.6, 1.8, 3.0);
  const lw = K.box(0.2, 3.6, 6, wallM, false);
  lw.position.set(-4, 0, -0.2);
  g.add(floor, lw);
  const frameM = K.toon(0xe8dcc8);
  for (const [w, h, x, y] of [
    [2.9, 0.08, 1.8, 1.06],
    [2.9, 0.08, 1.8, 2.96],
    [0.08, 1.9, 0.4, 1.1],
    [0.08, 1.9, 3.2, 1.1],
    [0.06, 1.9, 1.8, 1.1],
    [2.8, 0.06, 1.8, 2.02],
  ] as [number, number, number, number][]) {
    const f = K.box(w, h, 0.1, frameM, false);
    f.position.set(x, y, -3.0);
    g.add(f);
  }
  const skyM = new THREE.MeshBasicMaterial({ color: 0x0b1230, fog: false });
  const sky = K.plane(30, 14, skyM);
  sky.position.set(1.8, 3, -14);
  g.add(sky);
  const outside = Array.from({ length: 10 }, (_, k) => {
    const b = K.building(1.6 + hash(k + 200) * 1.6, 2 + hash(k + 201) * 6, 1.5, k + 2, 0x0e1430, false, 1);
    b.position.set(-3 + k * 1.3, -1, -8 - hash(k + 202) * 2);
    g.add(b);
    return b;
  });
  const desk = K.table(2.8, 0.8, 0.8, 0x5a4030, 0x3a2a20);
  desk.position.set(1.8, 0, -2.55);
  const lampBase = K.cyl(0.12, 0.14, 0.04, 0x222222, 12);
  lampBase.position.set(3.0, 0.8, -2.75);
  const lampPole = K.cyl(0.015, 0.015, 0.42, 0x222222, 6, false);
  lampPole.position.set(3.0, 0.84, -2.75);
  const shadeG = new THREE.ConeGeometry(0.2, 0.2, 14, 1, true);
  const lampShade = new THREE.Mesh(shadeG, new THREE.MeshToonMaterial({ color: 0xffd98a, gradientMap: K.GRAD, side: THREE.DoubleSide, emissive: 0x6a4a10 }));
  lampShade.position.set(3.0, 1.32, -2.75);
  const lampG = K.glow(0xffd98a, 1.5, 0.7);
  lampG.position.set(3.0, 1.2, -2.75);
  const ph = K.phone();
  ph.g.position.set(2.3, 0.8, -2.45);
  ph.g.rotation.x = -0.25;
  const cal = K.calendar();
  cal.g.position.set(-1.4, 2.2, -2.99);
  const bed = K.box(2.0, 0.45, 2.2, 0x5a4a7a);
  bed.position.set(-2.9, 0, -1.95);
  const pillow = K.box(0.7, 0.16, 0.45, 0xeeeeff);
  pillow.position.set(-2.9, 0.45, -2.75);
  const blanket = K.box(2.02, 0.08, 1.4, 0x8a6ab0);
  blanket.position.set(-2.9, 0.45, -1.45);
  const rug = K.disc(1.3, 0x6a3a5a);
  rug.position.set(0.6, 0.006, 0.2);
  g.add(desk, lampBase, lampPole, lampShade, lampG, ph.g, cal.g, bed, pillow, blanket, rug);

  const night = new THREE.Color(0x0b1230);
  const dusk = new THREE.Color(0xff8a5a);
  const noon = new THREE.Color(0x8ec8ff);
  return {
    id: "room",
    group: g,
    look: "room",
    props: { phone: ph },
    defaults: { rainZ: -8, rainX: 1.8, cars: 0 },
    update: (c) => {
      const e = c.env;
      const dl = daylight(e.day);
      const warmth = clamp01(1 - Math.abs(dl - 0.35) / 0.2);
      skyM.color.copy(night).lerp(noon, dl).lerp(dusk, warmth * 0.55);
      outside.forEach((b) => {
        const mats = b.material as THREE.MeshLambertMaterial[];
        mats[0].emissiveIntensity = 1 - dl * 0.9;
      });
      wallM.color.set(e.who === "claude" ? 0x4a3a52 : 0x2c3a5c);
      cal.set(1 + Math.floor(e.day));
      light(c.lights[0], 3.0, 1.45, -2.4, 0xffcf8a, 7);
      light(c.lights[1], 1.8, 2.2, -2.5, 0xbfd8ff, 3 + 14 * dl);
      light(c.lights[2], 0, 3.3, 0.5, 0xffe8d0, 2.5);
      light(c.lights[3], 0, 0, 0, 0x000000, 0);
    },
  };
}

// ================================================================== 天台
export function buildRoof(): StageSet {
  const g = new THREE.Group();
  const slab = K.box(12, 0.5, 9, 0x2a2e40);
  slab.position.set(-3, -0.5, -1.5);
  const body = K.building(12, 40, 9, 3, 0x10142a, false, 0.6);
  body.position.set(-3, -40.5, -1.5);
  g.add(slab, body);
  const railM = K.toon(0x0c1020);
  const rail = (x0: number, z0: number, x1: number, z1: number, y: number) => {
    const L = Math.hypot(x1 - x0, z1 - z0);
    const n = Math.floor(L / 0.8);
    for (let k = 0; k <= n; k++) {
      const p = K.box(0.05, 0.95, 0.05, railM, false);
      p.position.set(lerp(x0, x1, k / n), y, lerp(z0, z1, k / n));
      g.add(p);
    }
    const top = K.box(x1 === x0 ? 0.06 : L, 0.06, z1 === z0 ? 0.06 : L, railM, false);
    top.position.set((x0 + x1) / 2, y + 0.92, (z0 + z1) / 2);
    g.add(top);
  };
  rail(-9, 2.95, 3, 2.95, 0);
  rail(2.95, -6, 2.95, 2.95, 0);
  const tank = K.cyl(0.9, 0.9, 1.6, 0x5a4a3a, 18);
  tank.position.set(-7, 1.4, -4.5);
  const tankRoof = K.cyl(0, 1.0, 0.5, 0x3a2a22, 18);
  tankRoof.position.set(-7, 3.0, -4.5);
  g.add(tank, tankRoof);
  for (const [lx, lz] of [
    [-7.6, -5.1],
    [-6.4, -5.1],
    [-7.6, -3.9],
    [-6.4, -3.9],
  ]) {
    const l = K.box(0.08, 1.4, 0.08, 0x2a2222, false);
    l.position.set(lx, 0, lz);
    g.add(l);
  }
  for (const [ax, az] of [
    [-4, -5],
    [-2.6, -5.2],
  ]) {
    const ac = K.box(0.9, 0.6, 0.7, 0x6a7088);
    ac.position.set(ax, 0, az);
    g.add(ac);
  }
  const hut = K.box(1.6, 2.4, 1.4, 0x3a3f58);
  hut.position.set(-8, 0, 1);
  const hutL = K.glow(0xffd29a, 1.2, 0.8);
  hutL.position.set(-7.15, 2.1, 1);
  g.add(hut, hutL);
  const slab2 = K.box(6, 0.5, 6, 0x2a2e40);
  slab2.position.set(9, -1.5, -3);
  const body2 = K.building(6, 40, 6, 5, 0x10142a, false, 0.6);
  body2.position.set(9, -41.5, -3);
  g.add(slab2, body2);
  rail(6, -0.05, 12, -0.05, -1.0);
  for (let k = 0; k < 70; k++) {
    const a = -Math.PI * 0.95 + hash(k + 300) * Math.PI * 0.9;
    const d = 16 + hash(k + 301) * 50;
    const top = -8 + hash(k + 302) * 22;
    const w = 3 + hash(k + 303) * 5;
    const b = K.building(w, top + 50, w, k, 0x0c1128, false, 0.85);
    b.position.set(Math.cos(a) * d, -50, Math.sin(a) * d);
    g.add(b);
  }
  return {
    id: "roof",
    group: g,
    look: "roof",
    defaults: { rain: 0, cars: 0 },
    update: (c) => {
      light(c.lights[0], -7.1, 2.4, 1.8, 0xffd29a, 5);
      light(c.lights[1], 0, 3, 3, 0x9fb4ff, 4);
      light(c.lights[2], 9, 1.5, 0.5, 0x9fb4ff, 3);
      light(c.lights[3], 0, 0, 0, 0, 0);
    },
  };
}

// ================================================================== 化妆间（镜子 = 一个真的倒影空间）
export const MIRROR = { x: 0, y: 2.0, z: -2.1, w: 2.6, h: 2.0 };
export function buildVanity(): StageSet {
  const g = new THREE.Group();
  const wallM = K.toon(0x3a2430);
  const floor = K.box(9, 0.1, 9, 0x2a1a22, false);
  floor.position.set(0, -0.1, -1);
  const piece = (w: number, h: number, x: number, y: number) => {
    const p = K.box(w, h, 0.2, wallM, false);
    p.position.set(x, y, -2.2);
    g.add(p);
  };
  piece(3.2, 3.8, -2.9, 0);
  piece(3.2, 3.8, 2.9, 0);
  piece(2.6, 1.0, 0, 0);
  piece(2.6, 0.8, 0, 3.0);
  const alcoveM = K.toon(0x2a1a28);
  const ab = K.box(3.0, 3.8, 0.2, alcoveM, false);
  ab.position.set(0, 0, -5.0);
  const al = K.box(0.2, 3.8, 3, alcoveM, false);
  al.position.set(-1.4, 0, -3.6);
  const ar = al.clone();
  ar.position.x = 1.4;
  g.add(floor, ab, al, ar);
  const frameM = K.toon(0xc8a060);
  for (const [w, h, x, y] of [
    [2.9, 0.14, 0, 0.93],
    [2.9, 0.14, 0, 3.0],
    [0.14, 2.2, -1.37, 0.93],
    [0.14, 2.2, 1.37, 0.93],
  ] as [number, number, number, number][]) {
    const f = K.box(w, h, 0.14, frameM);
    f.position.set(x, y, -2.03);
    g.add(f);
  }
  const glass = K.plane(2.6, 2.0, new THREE.MeshBasicMaterial({ color: 0xbcd0ff, transparent: true, opacity: 0.1, depthWrite: false }));
  glass.position.set(0, 2.0, -2.02);
  g.add(glass);
  const bulbs: THREE.Sprite[] = [];
  const bulbM = K.basic(0xfff0c8);
  const addBulb = (x: number, y: number) => {
    const b = K.ball(0.06, bulbM, 8, false);
    b.position.set(x, y, -1.92);
    const gl = K.glow(0xffe2a8, 0.4, 0.8);
    gl.position.set(x, y, -1.85);
    g.add(b, gl);
    bulbs.push(gl);
  };
  for (let k = 0; k < 7; k++) addBulb(-1.2 + k * 0.4, 3.12);
  for (let k = 0; k < 5; k++) {
    addBulb(-1.5, 1.1 + k * 0.42);
    addBulb(1.5, 1.1 + k * 0.42);
  }
  const t = K.table(3.2, 0.7, 0.8, 0x4a2a38, 0x2a1820);
  t.position.set(0, 0, -1.7);
  const lip = K.cyl(0.03, 0.03, 0.14, 0xd0204a, 8);
  lip.position.set(-0.9, 0.8, -1.6);
  const perf = K.box(0.14, 0.2, 0.1, 0xff9ad5);
  perf.position.set(-0.6, 0.8, -1.75);
  const ck = K.cocktail(0xff4d8d);
  ck.position.set(1.1, 0.8, -1.6);
  g.add(t, lip, perf, ck);
  return {
    id: "vanity",
    group: g,
    look: "vanity",
    defaults: { rain: 0, cars: 0 },
    update: (c) => {
      const e = c.env;
      bulbs.forEach((b, k) => K.setOpacity(b, e.bulbs * (0.6 + 0.3 * Math.sin(c.T * 2 + k))));
      bulbM.color.setScalar(0.2 + 0.8 * e.bulbs);
      light(c.lights[0], 0, 3.3, -1.2, 0xffd9a8, 9 * e.bulbs);
      light(c.lights[1], 2.6, 2.2, 1.6, 0xff6ab8, 6);
      light(c.lights[2], 0, 2.7, -3.5, 0xffd0b0, 5 * e.bulbs + 1);
      light(c.lights[3], -2.4, 2, 1.4, 0x8a9aff, 3);
    },
  };
}
