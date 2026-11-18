// 原创三维场景库（上卷）：千年古樱坛 · 水墨丹青卷 · 春夜灯笼径 · 赤霞古驿道 · 翠竹瑶琴涧 · 海角观霞台 · 临水轻纱榭
import * as THREE from 'three';
import type { CharId, Shot } from './timeline';
import {
  Actor,
  ParticleField,
  type Sky,
  TAU,
  clamp,
  dropTex,
  eInOut,
  eOut,
  glowTex,
  hash,
  lerp,
  petalTex,
  range,
  scrollPaperTex,
  smooth,
  sparkTex,
  stoneTex,
} from './core';
import {
  type SakuraTreeRig,
  type SteedRig,
  addGlow,
  animateSteed,
  bridgeY,
  buildArchBridge,
  buildDragonSword,
  buildGuqinTable,
  buildLotusLamp,
  buildMountainRing,
  buildPavilion,
  buildSakuraTree,
  buildSilkLantern,
  buildSkiff,
  buildSteed,
  buildStoneLantern,
  buildWineJar,
  stdMat,
  swayRibbons,
} from './kit';

export interface GradeState {
  vig: number;
  grain: number;
  warm: number;
  cool: number;
  sat: number;
  flash: number;
  flashCol: number;
  black: number;
  ca: number;
  bloom: number;
}

export interface Env {
  scene: THREE.Scene;
  cam: THREE.PerspectiveCamera;
  sky: Sky;
  stars: THREE.Points;
  hemi: THREE.HemisphereLight;
  sun: THREE.DirectionalLight;
  rim: THREE.PointLight;
  fog: THREE.Fog;
  grade: GradeState;
}

export interface ShotCtx {
  t: number;     // 全曲秒数
  u: number;     // 当前镜头归一化进度 0..1
  dt: number;    // 距当前镜头起点秒数
  shot: Shot;
  pulse: number; // 实测 113 BPM 踩拍脉冲 0..1
  energy: number;// 实测音频能量 0..1
  kick: number;  // 三维关键词落拍镜头轻推 0..1
  env: Env;
}

export abstract class BaseScene {
  root = new THREE.Group();
  built = false;
  actors = new Map<CharId, Actor>();
  abstract build(): void;
  abstract update(c: ShotCtx): void;

  ensureBuilt(parent: THREE.Scene) {
    if (!this.built) {
      this.built = true;
      this.build();
      this.root.visible = false;
      parent.add(this.root);
    }
  }

  protected addActor(id: CharId, scale = 1): Actor {
    const a = new Actor(id, scale);
    a.hide();
    this.root.add(a.root);
    this.actors.set(id, a);
    return a;
  }

  protected hideAllActors() {
    this.actors.forEach((a) => a.hide());
  }

  protected actor(id: CharId, cam: THREE.Camera): Actor {
    let a = this.actors.get(id);
    if (!a) a = this.addActor(id, 1);
    return a.reset().faceCamera(cam);
  }
}

export function setCamera(
  c: ShotCtx,
  px: number, py: number, pz: number,
  lx: number, ly: number, lz: number,
  fov = 40,
  roll = 0,
) {
  const { cam } = c.env;
  // 关键词落定时沿视线方向微推 0.14m，克制自然且富有呼吸感
  const dx = lx - px, dy = ly - py, dz = lz - pz;
  const len = Math.max(0.001, Math.hypot(dx, dy, dz));
  const push = c.kick * 0.14;
  cam.position.set(px + (dx / len) * push, py + (dy / len) * push, pz + (dz / len) * push);
  cam.fov = fov;
  cam.up.set(Math.sin(roll), Math.cos(roll), 0);
  cam.lookAt(lx, ly, lz);
  cam.updateProjectionMatrix();
}

export function setAtmo(
  env: Env,
  opts: {
    top: number; mid: number; bot: number;
    sunCol?: number; sunDir?: [number, number, number]; sunGlow?: number; sunSize?: number;
    fogCol?: number; fogNear?: number; fogFar?: number;
    hemiSky?: number; hemiGround?: number; hemiInt?: number;
    sunInt?: number; stars?: number; aurora?: number; t?: number;
    rimCol?: number; rimInt?: number; rimPos?: [number, number, number];
  },
) {
  const sd = opts.sunDir ?? [0.2, 0.3, -1];
  env.sky.set(
    opts.top, opts.mid, opts.bot,
    opts.sunCol ?? 0xffe4be, sd,
    opts.sunGlow ?? 0.72, opts.sunSize ?? 0.005,
    opts.aurora ?? 0, opts.t ?? 0,
  );
  env.fog.color.setHex(opts.fogCol ?? opts.bot);
  env.fog.near = opts.fogNear ?? 14;
  env.fog.far = opts.fogFar ?? 68;
  env.hemi.color.setHex(opts.hemiSky ?? 0xfff0f5);
  env.hemi.groundColor.setHex(opts.hemiGround ?? 0x3b2d42);
  env.hemi.intensity = opts.hemiInt ?? 0.92;
  env.sun.color.setHex(opts.sunCol ?? 0xffe6c8);
  env.sun.intensity = opts.sunInt ?? 1.25;
  env.sun.position.set(sd[0] * 30, Math.max(4, sd[1] * 30), sd[2] * 30);
  const sm = env.stars.material as THREE.ShaderMaterial;
  sm.uniforms.uOpacity.value = opts.stars ?? 0.2;
  env.rim.color.setHex(opts.rimCol ?? 0xffb3c6);
  env.rim.intensity = opts.rimInt ?? 1.2;
  const rp = opts.rimPos ?? [0, 2.8, 2.5];
  env.rim.position.set(rp[0], rp[1], rp[2]);
}

// ============================================================================
// 1. 千年古樱坛（序章 · 引子 · 副歌盛放 · 尾声八人同席）
// ============================================================================
export class SakuraTreeScene extends BaseScene {
  tree!: SakuraTreeRig;
  sideTrees: SakuraTreeRig[] = [];
  petals!: ParticleField;
  fireflies!: ParticleField;
  ripples: THREE.Mesh[] = [];
  festLanterns = new THREE.Group();
  paperLamp!: THREE.Group;
  cupPetal!: THREE.Mesh;

  build() {
    // 绿茵缓坡圆丘与落樱花毯
    const hill = new THREE.Mesh(
      new THREE.CylinderGeometry(7.2, 9.5, 1.4, 32),
      stdMat(0x3a5a4e, 0.92, 0.02),
    );
    hill.position.y = -0.7;
    const petalCarpet = new THREE.Mesh(
      new THREE.CircleGeometry(4.6, 28),
      stdMat(0xf5b8cc, 0.85, 0, undefined, 0x5c1d34, 0.16),
    );
    petalCarpet.rotation.x = -Math.PI / 2;
    petalCarpet.position.set(0, 0.01, -0.4);

    // 环岛澄澈春溪
    const water = new THREE.Mesh(
      new THREE.RingGeometry(6.8, 46, 48),
      new THREE.MeshStandardMaterial({
        color: 0x3b5878,
        roughness: 0.18,
        metalness: 0.55,
        emissive: 0x1d2b45,
        emissiveIntensity: 0.35,
      }),
    );
    water.rotation.x = -Math.PI / 2;
    water.position.y = -0.18;
    this.root.add(hill, petalCarpet, water);

    // 前景清溪与青苔踏石（序章「溪石踏歌」）
    const brook = new THREE.Mesh(
      new THREE.PlaneGeometry(11.5, 1.65),
      stdMat(0x467498, 0.42, 0.22, undefined, 0x223a54, 0.28),
    );
    brook.rotation.x = -Math.PI / 2;
    brook.position.set(0, 0.015, 2.55);
    this.root.add(brook);

    const stoneMat = stdMat(0x7c8288, 0.88, 0.04, stoneTex());
    const ringGeo = new THREE.RingGeometry(0.32, 0.42, 20);
    for (let i = 0; i < 6; i++) {
      const sx = -2.5 + i * 1.0;
      const sz = 2.55 + (i % 2 ? 0.16 : -0.14);
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 0.14, 10), stoneMat);
      st.position.set(sx, 0.04, sz);
      this.root.add(st);
      const rip = new THREE.Mesh(
        ringGeo,
        new THREE.MeshBasicMaterial({ color: 0xffc8dd, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }),
      );
      rip.rotation.x = -Math.PI / 2;
      rip.position.set(sx, 0.028, sz);
      this.root.add(rip);
      this.ripples.push(rip);
    }

    // 中央千年古樱 + 两侧陪衬樱树
    this.tree = buildSakuraTree(3, 1.18, true);
    this.tree.group.position.set(0, 0, -1.25);
    this.root.add(this.tree.group);

    for (const [x, z, sc, sd] of [[-5.2, -3.2, 0.78, 11], [5.4, -2.9, 0.82, 19], [-4.4, 1.2, 0.62, 27]] as const) {
      const st = buildSakuraTree(sd, sc, false);
      st.group.position.set(x, -0.05, z);
      this.root.add(st.group);
      this.sideTrees.push(st);
    }

    // 古石灯笼两座（置于庭院两侧外缘，不遮挡八人同席角色）
    const slL = buildStoneLantern(0.88, 0xffd18c);
    slL.position.set(-3.85, 0, 0.25);
    const slR = buildStoneLantern(0.85, 0xffd18c);
    slR.position.set(3.85, 0, 0.15);
    this.root.add(slL, slR);

    const teaTable = new THREE.Group();
    teaTable.position.set(0, 0, 0.62);
    const tbl = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.08, 0.56), stdMat(0x5e3b2c, 0.65));
    tbl.position.y = 0.34;
    const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.32, 0.48), stdMat(0x472b1f, 0.75));
    leg1.position.set(-0.44, 0.16, 0);
    const leg2 = leg1.clone(); leg2.position.x = 0.44;
    const cupMat = stdMat(0xcde8dc, 0.25, 0.1, undefined, 0x3b6e5c, 0.15);
    const cup1 = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.055, 0.09, 12), cupMat);
    cup1.position.set(-0.24, 0.42, 0);
    const cup2 = cup1.clone(); cup2.position.x = 0.24;
    teaTable.add(tbl, leg1, leg2, cup1, cup2);
    this.root.add(teaTable);

    // 旋落茶盏的单枚特写樱瓣
    this.cupPetal = new THREE.Mesh(
      new THREE.PlaneGeometry(0.18, 0.18),
      new THREE.MeshBasicMaterial({ map: petalTex(), transparent: true, side: THREE.DoubleSide }),
    );
    this.root.add(this.cupPetal);

    // 灯下轻问的暖纸灯 + 副歌二满树暖金灯笼
    this.paperLamp = buildSilkLantern(0xffe0b2, 0xffb35c, 0.72);
    this.paperLamp.position.set(0.65, 2.15, 0.35);
    this.root.add(this.paperLamp);

    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU;
      const r = 2.1 + (i % 2) * 0.9;
      const fl = buildSilkLantern(0xffcf96, 0xffb74d, 0.55);
      fl.position.set(Math.cos(a) * r, 2.35 + (i % 3) * 0.35, -1.25 + Math.sin(a) * r);
      this.festLanterns.add(fl);
    }
    this.root.add(this.festLanterns);

    // 远景青紫黛山
    this.root.add(buildMountainRing(20, 36, 7, 15, 0x3d3558, 12));

    // 260 片三维旋转飘樱 + 90 点暖金流萤
    this.petals = new ParticleField(260, { map: petalTex(), scale: 1.0, opacity: 0.94 });
    for (let i = 0; i < 260; i++) {
      this.petals.setColor(i, i % 4 === 0 ? 0xfff0f5 : i % 2 === 0 ? 0xffb7ce : 0xff8fab);
    }
    this.petals.commit(true);
    this.root.add(this.petals.points);

    this.fireflies = new ParticleField(90, { map: glowTex(), scale: 0.65, opacity: 0, additive: true });
    for (let i = 0; i < 90; i++) {
      this.fireflies.setColor(i, i % 3 === 0 ? 0xffc8dd : 0xffe28a);
    }
    this.fireflies.commit(true);
    this.root.add(this.fireflies.points);
  }

  update(c: ShotCtx) {
    const { t, u, env, pulse } = c;
    const v = c.shot.v;
    this.hideAllActors();
    this.festLanterns.visible = v === 'c2_14' || v === 'outro2' || v === 'outro3' || v === 'outro4';
    this.paperLamp.visible = v === 'hook3' || v === 'c1_3' || v === 'c2_14';
    this.cupPetal.visible = v === 'intro4';
    for (const r of this.ripples) (r.material as THREE.MeshBasicMaterial).opacity = 0;

    // 刹那凝缓：hook4 / c1_4 / c2_4 在句尾放慢花瓣流速，营造「抵不住那一刹」定格感
    const slowMoment = v === 'hook4' || v === 'c1_4' || v === 'c2_4';
    const pTime = slowMoment ? t * 0.42 : t;
    swayRibbons(this.tree.ribbons, pTime, v === 'hook2' || v === 'c1_2' ? 1.55 : 1.0);

    // 更新 260 片落樱（含前景视差大花瓣）
    for (let i = 0; i < this.petals.count; i++) {
      const s1 = hash(i * 3.7), s2 = hash(i * 7.1), s3 = hash(i * 11.3);
      const speed = 0.45 + s1 * 0.55;
      const y = 6.2 - ((pTime * speed + s2 * 6.8) % 6.6);
      const swirl = pTime * (0.7 + s3 * 0.6) + i;
      const rad = 0.8 + s1 * 7.2;
      const x = Math.cos(s2 * TAU + pTime * 0.16) * rad + Math.sin(swirl) * 0.45;
      const z = -1.0 + Math.sin(s3 * TAU + pTime * 0.14) * rad * 0.82;
      this.petals.set(i, x, y, z, 0.22 + s3 * 0.26, swirl * 1.4);
    }
    this.petals.commit();

    // 流萤更新
    const showFlies = v === 'hook3' || v === 'c2_14' || v === 'outro2' || v === 'outro3' || v === 'outro4';
    this.fireflies.mat.uniforms.uOpacity.value = showFlies ? 0.82 : 0;
    if (showFlies) {
      for (let i = 0; i < this.fireflies.count; i++) {
        const a = hash(i * 5.1) * TAU + t * 0.22;
        const r = 1.2 + hash(i * 8.3) * 4.6;
        const y = 0.35 + ((t * 0.35 + hash(i * 2.9) * 3.8) % 3.8);
        const tw = 0.5 + 0.5 * Math.sin(t * 4.2 + i * 1.7);
        const fz = Math.min(2.2, -1.2 + Math.sin(a) * r * 0.72);
        this.fireflies.set(i, Math.cos(a) * r, y, fz, 0.14 + tw * 0.16, 0);
      }
      this.fireflies.commit();
    }

    const cam = env.cam;
    switch (v) {
      case 'intro1': {
        // 晨雾古樱苏醒，本鲸仰望满树绯云，上空浮现三维题名
        setAtmo(env, { top: 0x2d325a, mid: 0x8f6188, bot: 0xf7c6d0, sunCol: 0xffe4c4, sunDir: [0.28, 0.22, -1], sunGlow: 0.82, stars: 0.25 });
        env.grade.warm = 0.25; env.grade.bloom = 1.05;
        env.grade.black = 1 - eOut(range(u, 0, 0.32));
        this.actor('whale', cam).at(-0.85, 0, 0.75).act('idle', t).glow(0xffc8dd, 0.22);
        setCamera(c, lerp(0.4, 0.1, eInOut(u)), lerp(2.15, 1.9, eInOut(u)), lerp(8.4, 6.8, eInOut(u)), 0, 2.05, -0.8, 42);
        break;
      }
      case 'intro2': {
        // 豆包踩着青苔溪石轻快踏歌，每块石头漾开粉色水纹
        setAtmo(env, { top: 0x3b4876, mid: 0xa87598, bot: 0xffd4dc, sunCol: 0xffe8c8, sunDir: [0.35, 0.3, -1], sunGlow: 0.78, stars: 0.1 });
        env.grade.warm = 0.3;
        const idx = Math.min(5, Math.floor(u * 6));
        const sub = (u * 6) - idx;
        const sx0 = -2.5 + idx * 1.0, sx1 = -2.5 + Math.min(5, idx + 1) * 1.0;
        const sz0 = 2.55 + (idx % 2 ? 0.16 : -0.14), sz1 = 2.55 + (Math.min(5, idx + 1) % 2 ? 0.16 : -0.14);
        const hopY = Math.sin(sub * Math.PI) * 0.34;
        this.actor('doubao', cam)
          .at(lerp(sx0, sx1, eInOut(sub)), 0.11, lerp(sz0, sz1, eInOut(sub)))
          .act('step', t, 1.15).lift(hopY).glow(0xffb7ce, 0.22);
        this.actor('whale', cam).at(-1.25, 0, 0.55).act('sway', t, 0.85);
        for (let i = 0; i <= idx; i++) {
          const age = clamp((u * 6 - i) * 0.75);
          this.ripples[i].scale.setScalar(1 + age * 1.6);
          (this.ripples[i].material as THREE.MeshBasicMaterial).opacity = (1 - age) * 0.68;
        }
        setCamera(c, lerp(-1.6, 1.2, u), 1.62, 6.25, lerp(-1.1, 0.8, u), 1.0, 1.8, 40);
        break;
      }
      case 'intro3': {
        // 树下茶席：本鲸与小克并肩立于木案两侧
        setAtmo(env, { top: 0x45588a, mid: 0xc288a8, bot: 0xffdce2, sunCol: 0xffeac8, sunDir: [0.18, 0.32, -1], sunGlow: 0.85, stars: 0.05 });
        env.grade.warm = 0.35;
        this.actor('whale', cam).at(-1.12, 0, 0.62).act('sway', t, 0.9).bounce(pulse, 0.04);
        this.actor('claude', cam).at(1.12, 0, 0.62).flip(true).act('idle', t, 0.9).prop('prop_teacup', -0.45, 0.72, 0.36);
        setCamera(c, Math.sin(u * 1.2 - 0.6) * 1.2, 1.58, lerp(5.6, 4.85, eInOut(u)), 0, 1.22, 0.2, 39);
        break;
      }
      case 'intro4': {
        // 特写花落青瓷杯沿
        setAtmo(env, { top: 0x4c5f94, mid: 0xcc8fae, bot: 0xffe0e6, sunCol: 0xffecd0, sunDir: [0.1, 0.34, -1], sunGlow: 0.9, stars: 0 });
        env.grade.warm = 0.38; env.grade.bloom = 1.12;
        const p = eOut(u);
        this.cupPetal.position.set(lerp(-0.45, 0.24, p) + Math.sin(u * 7) * 0.12 * (1 - p), lerp(1.55, 0.49, p), 0.62);
        this.cupPetal.rotation.set(lerp(0.5, 1.35, p), u * 3.2, 0.4);
        this.actor('whale', cam).at(-1.05, 0, 0.58).act('nod', t, 0.85);
        this.actor('claude', cam).at(1.05, 0, 0.58).flip(true).act('tilt', t, 0.85);
        setCamera(c, 0.15, lerp(1.42, 1.05, p), lerp(3.85, 2.75, p), 0.08, lerp(0.95, 0.68, p), 0.55, 38);
        break;
      }
      case 'hook2':
      case 'c1_2': {
        // 放不下的是牵挂：仰拍满枝绯红丝带与祈愿木牌，本鲸驻足仰望
        const rich = v === 'c1_2';
        setAtmo(env, {
          top: rich ? 0x3b4d82 : 0x4a4576,
          mid: rich ? 0xd982a4 : 0xc47b9c,
          bot: 0xffd2dc,
          sunCol: 0xffdfb0, sunDir: [-0.25, 0.28, -1], sunGlow: 0.92, stars: 0.08,
        });
        env.grade.warm = 0.36; env.grade.bloom = rich ? 1.15 : 1.02;
        this.actor('whale', cam).at(-0.55, 0, 0.52).act(rich ? 'point' : 'idle', t, 0.9).glow(0xffa6c4, 0.28);
        setCamera(c, lerp(-1.45, -0.85, eInOut(u)), lerp(1.22, 1.55, eInOut(u)), lerp(4.35, 3.85, eInOut(u)), 0.15, 1.72, -0.55, 40);
        break;
      }
      case 'hook3':
      case 'c1_3': {
        // 你曾问我害不害怕：暖纸灯下小克捧书侧首轻问，本鲸勇敢摇头
        setAtmo(env, { top: 0x26244a, mid: 0x7b4c78, bot: 0xe89eb4, sunCol: 0xffc88a, sunDir: [0.32, 0.2, -1], sunGlow: 0.78, stars: 0.28 });
        env.grade.warm = 0.45; env.grade.bloom = 1.08;
        this.actor('claude', cam).at(0.88, 0, 0.68).flip(true).act('tilt', t, 0.95).prop('prop_book', -0.48, 0.68, 0.38).glow(0xffcf8c, 0.32);
        this.actor('whale', cam).at(-0.92, 0, 0.72).act(v === 'c1_3' ? 'shake' : 'nod', t, 0.9).glow(0xffb7ce, 0.22);
        setCamera(c, lerp(-0.55, 0.28, eInOut(u)), 1.38, 4.15, 0.12, 1.12, 0.55, 37);
        break;
      }
      case 'hook4':
      case 'c1_4':
      case 'c2_4': {
        // 抵不住那一刹：金粉逆光穿透古樱花冠，环绕推镜 + 句尾柔粉闪光定格！
        const climax = v === 'c2_4';
        setAtmo(env, {
          top: climax ? 0x3b2d68 : 0x2e2352,
          mid: climax ? 0xe87ea8 : 0xc96b96,
          bot: climax ? 0xffe4b8 : 0xffcfa8,
          sunCol: 0xffe5a8, sunDir: [0, 0.22, -1], sunGlow: climax ? 1.25 : 1.08, sunSize: 0.009, stars: 0.15,
        });
        const burst = Math.exp(-Math.pow((u - 0.74) * 6.5, 2));
        env.grade.warm = 0.5;
        env.grade.bloom = 1.15 + burst * 0.45;
        env.grade.flash = burst * (climax ? 0.36 : 0.24);
        env.grade.flashCol = 0xffe6f0;
        this.actor('whale', cam).at(-0.78, 0, 0.55).act('surprise', t, 0.75).glow(0xffd6a5, 0.42);
        this.actor('claude', cam).at(0.78, 0, 0.55).flip(true).act('nod', t, 0.75).glow(0xffc8dd, 0.42);
        const ang = (u - 0.5) * (climax ? 0.95 : 0.65);
        const dist = lerp(5.2, climax ? 3.55 : 3.95, eOut(u));
        setCamera(c, Math.sin(ang) * dist, lerp(1.48, 1.25, u), Math.cos(ang) * dist + 0.4, 0, 1.22, 0.2, 39);
        break;
      }
      case 'c2_1': {
        // 全曲升调 +2 半音破晓迸发！金粉晨光炸裂，本鲸与猫沐光盛放
        setAtmo(env, {
          top: 0x2d4a8a, mid: 0xe888b2, bot: 0xffeab8,
          sunCol: 0xfff0b8, sunDir: [0.05, 0.26, -1], sunGlow: 1.3, sunSize: 0.01, aurora: 0.35, t,
        });
        const openFlash = Math.exp(-u * 6.5);
        env.grade.flash = openFlash * 0.45;
        env.grade.flashCol = 0xfff5e4;
        env.grade.warm = 0.48; env.grade.sat = 1.15; env.grade.bloom = 1.28;
        this.actor('whale', cam).at(-0.85, 0, 0.68).act('wave', t, 1.15).bounce(pulse, 0.08).glow(0xffe599, 0.45);
        this.actor('gemini', cam).at(0.95, 0, 0.68).flip(true).act('spin', t, 1.1).prop('prop_brush', 0.48, 0.78, 0.4).glow(0xffb7ce, 0.4);
        setCamera(c, Math.sin(u * 0.6 - 0.3) * 1.4, lerp(1.25, 1.65, eOut(u)), lerp(6.1, 4.65, eOut(u)), 0, 1.45, -0.2, 41);
        break;
      }
      case 'c2_14': {
        // 就在心里等着你：满树暖金灯笼与流萤环绕，本鲸温柔静候
        setAtmo(env, { top: 0x151836, mid: 0x423062, bot: 0x9c5a7e, sunCol: 0xffe4b5, sunDir: [-0.2, 0.36, -1], sunGlow: 0.72, stars: 0.65, aurora: 0.25, t });
        env.grade.warm = 0.45; env.grade.bloom = 1.22;
        this.actor('whale', cam).at(0, 0, 0.72).act('sway', t, 0.85).glow(0xffcf7d, 0.48);
        setCamera(c, Math.sin(u * 0.5) * 0.6, 1.35, lerp(4.4, 3.65, eInOut(u)), 0, 1.15, 0.35, 37);
        break;
      }
      case 'outro1': {
        // 尾声重逢：春晓暖阳洒满古樱，小克踏着花径走来停在本鲸对面，相视颔首
        setAtmo(env, { top: 0x3b5894, mid: 0xd88eb0, bot: 0xffe6cc, sunCol: 0xfff0c8, sunDir: [0.15, 0.28, -1], sunGlow: 1.05, stars: 0.08 });
        env.grade.warm = 0.42; env.grade.bloom = 1.15;
        const wp = eOut(range(u, 0, 0.68));
        this.actor('whale', cam).at(-0.95, 0, 0.68).act(u > 0.68 ? 'nod' : 'idle', t, 0.9).glow(0xffd6e7, 0.35);
        const cl = this.actor('claude', cam);
        if (u < 0.68) cl.walkPath(3.2, 1.15, 0.95, 0.68, wp, t).glow(0xffe4b8, 0.35);
        else cl.at(0.95, 0, 0.68).flip(true).act('nod', t, 0.85).glow(0xffe4b8, 0.38);
        setCamera(c, lerp(0.8, 0, eInOut(u)), 1.52, lerp(6.0, 4.85, eInOut(u)), 0.1, 1.18, 0.4, 39);
        break;
      }
      case 'outro2': {
        // 八人同席：分支全部八位角色齐聚樱花庭院，各自展现招牌动作
        setAtmo(env, { top: 0x35497e, mid: 0xc97fa4, bot: 0xffe0c8, sunCol: 0xffebc2, sunDir: [0, 0.3, -1], sunGlow: 1.0, stars: 0.22, aurora: 0.22, t });
        env.grade.warm = 0.44; env.grade.bloom = 1.18;
        this.actor('whale', cam).at(-0.68, 0, 1.05).act('wave', t, 0.95).glow(0xffc8dd, 0.32);
        this.actor('claude', cam).at(0.68, 0, 1.05).flip(true).act('curtsy', t, 0.85).glow(0xffe0b2, 0.32);
        this.actor('doubao', cam).at(-2.05, 0, 1.18).act('sway', t, 1.0);
        this.actor('gemini', cam).at(2.05, 0, 1.18).flip(true).act('choose', t, 0.95).prop('prop_brush', 0.45, 0.72, 0.36);
        this.actor('qwen', cam).at(-3.15, 0, 0.65).act('sway', t, 0.9).prop('prop_fan', 0.45, 0.72, 0.36);
        this.actor('kimi', cam).at(3.15, 0, 0.65).flip(true).act('nod', t, 0.9).prop('prop_scroll', -0.45, 0.72, 0.36);
        this.actor('zai', cam).at(-1.55, 0, 0.15).act('lookaround', t, 0.85);
        this.actor('gpt', cam).at(1.65, 0.35, -0.05).flip(true).act('float', t, 0.85).glow(0xffb3c6, 0.28);
        setCamera(c, Math.sin((u - 0.5) * 0.45) * 1.4, lerp(1.85, 2.15, eInOut(u)), lerp(7.4, 8.2, eInOut(u)), 0, 1.28, 0.45, 42);
        break;
      }
      case 'outro3': {
        // 终章题名与八位演员表：长镜头缓缓拉升俯瞰盛放樱岛
        setAtmo(env, { top: 0x1c2044, mid: 0x6f4674, bot: 0xe69cb4, sunCol: 0xffd8a8, sunDir: [0, 0.2, -1], sunGlow: 0.88, stars: 0.55, aurora: 0.28, t });
        env.grade.warm = 0.38; env.grade.bloom = 1.15;
        this.actor('whale', cam).at(-0.7, 0, 0.75).act('idle', t, 0.8);
        this.actor('claude', cam).at(0.7, 0, 0.75).flip(true).act('idle', t, 0.8);
        setCamera(c, 0, lerp(2.3, 4.1, eInOut(u)), lerp(8.6, 13.5, eInOut(u)), 0, 1.85, -0.8, 42);
        break;
      }
      default: {
        // outro4：余韵落樱，渐隐入夜幕
        setAtmo(env, { top: 0x10132b, mid: 0x3b2854, bot: 0x8f5578, sunCol: 0xffcfa0, sunDir: [0, 0.15, -1], sunGlow: 0.55, stars: 0.78 });
        env.grade.warm = 0.3; env.grade.bloom = 1.05;
        env.grade.black = eInOut(range(u, 0.52, 0.98));
        this.actor('whale', cam).at(-0.7, 0, 0.75).act('idle', t, 0.7);
        this.actor('claude', cam).at(0.7, 0, 0.75).flip(true).act('idle', t, 0.7);
        setCamera(c, 0, lerp(4.1, 4.8, u), lerp(13.5, 15.2, u), 0, 2.0, -0.8, 42);
        break;
      }
    }
  }
}

// ============================================================================
// 2. 水墨丹青卷（如诗啊如画 · 一把酸泪怎写沧桑 · 金墨牵挂）
// ============================================================================
export class InkScrollScene extends BaseScene {
  scrollGrp = new THREE.Group();
  scrollPaper!: THREE.Mesh;
  rollerL!: THREE.Mesh;
  rollerR!: THREE.Mesh;
  popPeaks = new THREE.Group();
  redRibbon!: THREE.Mesh;
  deskGrp = new THREE.Group();
  tearDrops: THREE.Mesh[] = [];
  inkRings: THREE.Mesh[] = [];
  petals!: ParticleField;

  build() {
    // 镜面水墨池地面
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(42, 40),
      stdMat(0x283845, 0.22, 0.5, undefined, 0x121e28, 0.3),
    );
    floor.rotation.x = -Math.PI / 2;
    this.root.add(floor);

    // 浮水白玉圆台
    const stage = new THREE.Mesh(
      new THREE.CylinderGeometry(4.6, 4.9, 0.18, 28),
      stdMat(0xdcd6c8, 0.65, 0.08, stoneTex()),
    );
    stage.position.y = 0.08;
    this.root.add(stage);

    // 巨幅展开三维水墨画卷（横立后景）
    this.scrollGrp.position.set(0, 2.35, -2.35);
    this.scrollPaper = new THREE.Mesh(
      new THREE.PlaneGeometry(8.8, 3.8),
      new THREE.MeshStandardMaterial({
        map: scrollPaperTex(),
        roughness: 0.68,
        emissive: 0x6b5842,
        emissiveIntensity: 0.25,
        side: THREE.DoubleSide,
      }),
    );
    const rGeo = new THREE.CylinderGeometry(0.14, 0.14, 4.25, 12);
    const rMat = stdMat(0x4a251c, 0.42, 0.22);
    this.rollerL = new THREE.Mesh(rGeo, rMat);
    this.rollerR = new THREE.Mesh(rGeo, rMat);
    this.scrollGrp.add(this.scrollPaper, this.rollerL, this.rollerR);

    // 从画卷中立体跃出的青绿群峰与小樱树
    const jadeCols = [0x3d7a74, 0x52968c, 0x2f5e62, 0x68ab9a];
    for (let i = 0; i < 7; i++) {
      const px = -3.0 + i * 1.0;
      const ph = 1.2 + hash(i * 5 + 2) * 1.45;
      const pk = new THREE.Mesh(
        new THREE.ConeGeometry(0.68 + hash(i) * 0.35, ph, 6),
        stdMat(jadeCols[i % 4], 0.72, 0.05, undefined, 0x1a3d3a, 0.22),
      );
      pk.position.set(px, ph * 0.5 + 0.16, -1.55 + (i % 2) * 0.35);
      this.popPeaks.add(pk);
    }
    const miniSakura = buildSakuraTree(8, 0.52, false);
    miniSakura.group.position.set(2.35, 0.16, -1.1);
    this.popPeaks.add(miniSakura.group);

    // 贯穿画卷的发光红绸（c2_2 金墨牵挂）
    const rc = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-4.2, 1.3, -0.8),
      new THREE.Vector3(-1.4, 2.55, -0.5),
      new THREE.Vector3(1.5, 1.55, -0.4),
      new THREE.Vector3(4.2, 2.75, -0.8),
    ]);
    this.redRibbon = new THREE.Mesh(
      new THREE.TubeGeometry(rc, 36, 0.055, 8, false),
      new THREE.MeshBasicMaterial({ color: 0xff4d79 }),
    );
    this.root.add(this.scrollGrp, this.popPeaks, this.redRibbon);

    // 孤烛沧桑书案（w5：一把酸泪怎写沧桑）
    this.deskGrp.position.set(0, 0.17, 0.45);
    const deskTop = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.1, 1.15), stdMat(0x4a3124, 0.78));
    deskTop.position.y = 0.72;
    for (const sx of [-1.1, 1.1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.72, 0.95), stdMat(0x382318, 0.82));
      leg.position.set(sx, 0.36, 0);
      this.deskGrp.add(leg);
    }
    const flatScroll = new THREE.Mesh(
      new THREE.PlaneGeometry(1.85, 0.78),
      stdMat(0xe8d8bc, 0.75, 0, scrollPaperTex(), 0x4a3b26, 0.2),
    );
    flatScroll.rotation.x = -Math.PI / 2;
    flatScroll.position.set(-0.1, 0.78, 0);
    // 红烛摇曳
    const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.34, 10), stdMat(0xc93838, 0.5));
    candle.position.set(1.02, 0.94, -0.25);
    addGlow(candle, 0xffb85c, 1.2, 0.78, 0.24);
    this.deskGrp.add(deskTop, flatScroll, candle);

    // 三滴坠落酸泪与纸面晕开的墨环
    for (let i = 0; i < 3; i++) {
      const ox = -0.52 + i * 0.46;
      const oz = (i - 1) * 0.12;
      const drop = new THREE.Mesh(
        new THREE.PlaneGeometry(0.16, 0.24),
        new THREE.MeshBasicMaterial({ map: dropTex(), color: 0xbde4ff, transparent: true, side: THREE.DoubleSide }),
      );
      drop.position.set(ox, 1.6, oz);
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.02, 0.22, 20),
        new THREE.MeshBasicMaterial({ color: 0x263244, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(ox, 0.788, oz);
      this.deskGrp.add(drop, ring);
      this.tearDrops.push(drop);
      this.inkRings.push(ring);
    }
    this.root.add(this.deskGrp);

    this.petals = new ParticleField(140, { map: petalTex(), scale: 0.9, opacity: 0.88 });
    for (let i = 0; i < 140; i++) this.petals.setColor(i, i % 3 === 0 ? 0xffe8a3 : 0xffb7ce);
    this.petals.commit(true);
    this.root.add(this.petals.points);
  }

  update(c: ShotCtx) {
    const { t, u, env, pulse } = c;
    const v = c.shot.v;
    this.hideAllActors();
    const isTear = v === 'w5';
    this.scrollGrp.visible = !isTear;
    this.popPeaks.visible = !isTear;
    this.redRibbon.visible = v === 'c2_2';
    this.deskGrp.visible = isTear;

    for (let i = 0; i < this.petals.count; i++) {
      const s1 = hash(i * 4.3), s2 = hash(i * 9.7);
      const x = (s1 - 0.5) * 12 + Math.sin(t * 0.8 + i) * 0.4;
      const y = 5.4 - ((t * 0.45 + s2 * 5.6) % 5.4);
      const z = -2.2 + (hash(i * 2.1) - 0.5) * 6;
      this.petals.set(i, x, y, z, isTear ? 0.16 : 0.24, t + i);
    }
    this.petals.commit();

    const cam = env.cam;
    if (isTear) {
      // w5：一把酸泪怎写沧桑 — 孤烛书案、泪滴坠纸化作墨晕，Kimi 抱卷默立
      setAtmo(env, { top: 0x141829, mid: 0x2c3048, bot: 0x52485c, sunCol: 0xffc478, sunDir: [0.4, 0.25, -0.8], sunGlow: 0.42, stars: 0.45 });
      env.grade.warm = 0.22; env.grade.cool = 0.25; env.grade.vig = 0.52;
      for (let i = 0; i < 3; i++) {
        const cyc = ((u * 2.2 + i * 0.34) % 1);
        const fall = range(cyc, 0, 0.45);
        const spread = range(cyc, 0.45, 1);
        this.tearDrops[i].visible = cyc < 0.45;
        this.tearDrops[i].position.y = lerp(2.15, 0.82, fall * fall);
        this.inkRings[i].scale.setScalar(0.25 + eOut(spread) * 1.45);
        (this.inkRings[i].material as THREE.MeshBasicMaterial).opacity = cyc >= 0.45 ? (1 - spread) * 0.72 : 0;
      }
      this.actor('kimi', cam).at(-1.68, 0.17, 0.35).act('think', t, 0.85).prop('prop_scroll', 0.46, 0.68, 0.4).glow(0xc4b5fd, 0.24);
      this.actor('whale', cam).at(1.68, 0.17, 0.42).flip(true).act('sad', t, 0.8);
      setCamera(c, lerp(-0.4, 0.35, eInOut(u)), lerp(2.05, 1.72, eInOut(u)), lerp(4.5, 3.65, eInOut(u)), 0, 1.02, 0.35, 38);
      return;
    }

    // 长卷徐徐铺展动画
    const open = v === 'c2_2' ? 1 : lerp(0.32, 1, eOut(clamp(u * 1.35)));
    this.scrollPaper.scale.x = open;
    this.rollerL.position.x = -4.4 * open;
    this.rollerR.position.x = 4.4 * open;
    this.popPeaks.scale.y = lerp(0.15, 1, eOut(clamp(u * 1.4)));

    if (v === 'c2_2') {
      // 金碧长卷红绸贯山海
      setAtmo(env, { top: 0x2b4578, mid: 0xb87ca2, bot: 0xffe4b8, sunCol: 0xffeaad, sunDir: [0, 0.35, -1], sunGlow: 1.05 });
      env.grade.warm = 0.45; env.grade.bloom = 1.2;
      this.actor('kimi', cam).at(-1.25, 0.17, 0.65).act('nod', t, 0.95).prop('prop_scroll', 0.46, 0.72, 0.38).glow(0xffe599, 0.3);
      this.actor('whale', cam).at(1.25, 0.17, 0.65).flip(true).act('point', t, 0.95).glow(0xffb7ce, 0.32);
      setCamera(c, lerp(-0.9, 0.9, eInOut(u)), 1.75, 5.85, 0, 1.55, -0.8, 41);
    } else {
      // hook1 / c1_1：如诗啊如画 — 猫执画笔点染水墨江山与春樱
      const bright = v === 'c1_1';
      setAtmo(env, {
        top: bright ? 0x3a6488 : 0x45607c,
        mid: bright ? 0x9ac8c4 : 0xa5b8c2,
        bot: 0xf7e4d8,
        sunCol: 0xfff0d4, sunDir: [0.22, 0.38, -1], sunGlow: 0.9,
      });
      env.grade.warm = 0.32; env.grade.bloom = bright ? 1.15 : 1.02;
      this.actor('gemini', cam)
        .at(bright ? 0 : 0.85, 0.17, 0.72)
        .act('choose', t, 1.05).bounce(pulse, 0.05)
        .prop('prop_brush', 0.5, 0.82, 0.44, Math.sin(t * 4) * 0.25)
        .glow(0xffe89e, 0.32);
      if (!bright) this.actor('whale', cam).at(-1.15, 0.17, 0.78).act('sway', t, 0.9);
      setCamera(c, Math.sin((u - 0.5) * 0.5) * 1.1, 1.72, lerp(6.3, 5.35, eOut(u)), 0, 1.58, -0.9, 41);
    }
  }
}

// ============================================================================
// 3. 春夜灯笼径（间奏 Da da da：石灯初燃 · 鼓起春桥 · 万灯升空）
// ============================================================================
export class LanternPathScene extends BaseScene {
  lanterns: THREE.Group[] = [];
  skyLanterns!: ParticleField;
  petals!: ParticleField;

  build() {
    // 暮夜镜河
    const river = new THREE.Mesh(
      new THREE.PlaneGeometry(90, 90),
      stdMat(0x1b2440, 0.14, 0.65, undefined, 0x101830, 0.35),
    );
    river.rotation.x = -Math.PI / 2;
    this.root.add(river);

    // 河心石拱桥与两岸樱花树
    const bridge = buildArchBridge(10.4, 1.55, 2.5);
    this.root.add(bridge);

    for (const [x, z, sc] of [[-5.6, -2.4, 0.92], [5.6, -2.2, 0.95], [-3.2, -3.5, 0.78], [3.4, -3.4, 0.8]] as const) {
      const tr = buildSakuraTree(Math.abs(x * 7), sc, false);
      tr.group.position.set(x, 0, z);
      this.root.add(tr.group);
    }

    // 桥畔八盏逐次点亮的石灯笼
    for (let i = 0; i < 8; i++) {
      const lx = -4.2 + i * 1.2;
      const ly = bridgeY(lx, 10.4, 1.55);
      const sl = buildStoneLantern(0.68, 0xffbe6b);
      sl.position.set(lx, ly - 0.05, i % 2 === 0 ? -1.18 : 1.18);
      this.root.add(sl);
      this.lanterns.push(sl);
    }

    // 满天冉冉升起的孔明灯（含水中镜像）
    this.skyLanterns = new ParticleField(130, { map: glowTex(), scale: 1.25, opacity: 0, additive: true });
    for (let i = 0; i < 130; i++) {
      this.skyLanterns.setColor(i, i % 3 === 0 ? 0xff9e68 : 0xffd97d);
    }
    this.skyLanterns.commit(true);
    this.root.add(this.skyLanterns.points);

    this.petals = new ParticleField(180, { map: petalTex(), scale: 0.95, opacity: 0.9 });
    for (let i = 0; i < 180; i++) this.petals.setColor(i, i % 2 ? 0xffb7ce : 0xffe4ec);
    this.petals.commit(true);
    this.root.add(this.petals.points);

    this.root.add(buildMountainRing(16, 38, 6, 13, 0x1e2242, 21));
  }

  update(c: ShotCtx) {
    const { t, u, env, pulse } = c;
    const v = c.shot.v;
    this.hideAllActors();

    for (let i = 0; i < this.petals.count; i++) {
      const x = (hash(i * 3.1) - 0.5) * 14 + Math.sin(t + i) * 0.5;
      const y = 6.2 - ((t * 0.65 + hash(i * 6.7) * 6) % 6.0);
      const z = (hash(i * 9.3) - 0.5) * 8;
      this.petals.set(i, x, y, z, 0.22 + hash(i) * 0.18, t * 1.5 + i);
    }
    this.petals.commit();

    // 石灯逐盏点亮
    this.lanterns.forEach((sl, i) => {
      const glow = sl.userData.glow as THREE.Sprite;
      const lit = v === 'd1' ? smooth((u * 9) - i) : 1;
      (glow.material as THREE.SpriteMaterial).opacity = lit * (0.55 + pulse * 0.35);
    });

    const showSky = v === 'd4';
    this.skyLanterns.mat.uniforms.uOpacity.value = showSky ? 0.92 : 0.22;
    for (let i = 0; i < 65; i++) {
      const x = (hash(i * 5.3) - 0.5) * 22 + Math.sin(t * 0.35 + i) * 0.6;
      const y = 0.8 + ((t * 0.52 + hash(i * 8.1) * 11) % 11.5);
      const z = -2.5 - hash(i * 11.7) * 16;
      const sz = 0.55 + hash(i * 2.3) * 0.55;
      this.skyLanterns.set(i, x, y, z, sz, 0);
      // 河面倒影孔明灯
      this.skyLanterns.set(65 + i, x, -y * 0.12 + 0.05, z, sz * 0.72, 0);
    }
    this.skyLanterns.commit();

    const cam = env.cam;
    if (v === 'd1') {
      setAtmo(env, { top: 0x1d2248, mid: 0x5c3d6e, bot: 0xc97b98, sunCol: 0xffc882, sunDir: [-0.3, 0.2, -1], sunGlow: 0.68, stars: 0.42 });
      env.grade.warm = 0.35; env.grade.bloom = 1.12;
      const x = lerp(-2.8, 1.4, u);
      this.actor('doubao', cam).at(x, bridgeY(x, 10.4, 1.55), 0).walk(t, 1.05).bounce(pulse, 0.06).glow(0xffc97d, 0.3);
      setCamera(c, lerp(-3.6, 0.6, u), 2.85, 5.8, x + 0.4, bridgeY(x, 10.4, 1.55) + 0.85, 0, 40);
    } else if (v === 'd2') {
      // 113 BPM 鼓点进入！三人桥上欢快踩拍同行
      setAtmo(env, { top: 0x1b2046, mid: 0x6b3f74, bot: 0xd9829c, sunCol: 0xffcf88, sunDir: [0.2, 0.25, -1], sunGlow: 0.75, stars: 0.5 });
      env.grade.warm = 0.42; env.grade.bloom = 1.18;
      const cx = lerp(-2.2, 2.0, u);
      const ids: [CharId, number][] = [['doubao', 0.95], ['whale', 0], ['gemini', -0.95]];
      for (const [id, off] of ids) {
        const ax = cx + off;
        this.actor(id, cam).at(ax, bridgeY(ax, 10.4, 1.55), 0).walk(t, 1.15).bounce(pulse, 0.09).glow(0xffcf8c, 0.26);
      }
      setCamera(c, cx + 0.5, 2.95, 5.95, cx, 2.35, 0, 41);
    } else {
      // d4：万灯升空，桥头仰望星灯河
      setAtmo(env, { top: 0x0e132c, mid: 0x2c2454, bot: 0x6e436e, sunCol: 0xffd28a, sunDir: [0, 0.4, -1], sunGlow: 0.55, stars: 0.85 });
      env.grade.warm = 0.48; env.grade.bloom = 1.28;
      const roster: [CharId, number, string][] = [
        ['doubao', -1.85, 'hop'], ['whale', -0.62, 'wave'], ['claude', 0.62, 'lookaround'], ['kimi', 1.85, 'nod'],
      ];
      for (const [id, ax, act] of roster) {
        this.actor(id, cam).at(ax, bridgeY(ax, 10.4, 1.55), 0).flip(ax > 0).act(act, t, 0.95).glow(0xffcf7d, 0.32);
      }
      setCamera(c, Math.sin((u - 0.5) * 0.5) * 1.8, lerp(2.55, 3.35, eInOut(u)), lerp(6.2, 7.6, eInOut(u)), 0, 3.05, -1.2, 43);
    }
  }
}

// ============================================================================
// 4. 赤霞古驿道（风起古道 · 是谁醉酒策马 · 我嘶吼望断天涯）
// ============================================================================
export class CanyonRoadScene extends BaseScene {
  steed!: SteedRig;
  banner!: THREE.Mesh;
  cliffGrp = new THREE.Group();
  roadGrp = new THREE.Group();
  dust!: ParticleField;

  build() {
    // 驿道沙砾地面与赤砂岩山峦
    const ground = new THREE.Mesh(new THREE.CircleGeometry(52, 32), stdMat(0x6e4736, 0.95, 0.02));
    ground.rotation.x = -Math.PI / 2;
    this.root.add(ground, this.roadGrp, this.cliffGrp);

    // 古驿酒旗与倾倒酒坛
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 4.2, 8), stdMat(0x4a2e1f, 0.8));
    pole.position.set(-2.6, 2.1, -1.4);
    this.banner = new THREE.Mesh(
      new THREE.PlaneGeometry(1.65, 0.92, 5, 2),
      stdMat(0xc92a38, 0.55, 0, undefined, 0x5c0f18, 0.32),
    );
    this.banner.geometry.translate(0.82, 0, 0);
    this.banner.position.set(-2.55, 3.65, -1.4);
    this.roadGrp.add(pole, this.banner);

    const jar1 = buildWineJar(0.95);
    jar1.position.set(-2.1, 0, -1.0);
    const jar2 = buildWineJar(0.88);
    jar2.position.set(-1.45, 0.24, 0.95);
    jar2.rotation.z = 1.32; // 倾倒醉酒坛！
    this.roadGrp.add(jar1, jar2);

    this.steed = buildSteed(1.05);
    this.roadGrp.add(this.steed.group);

    // 千仞断崖（v2：我嘶吼望断天涯）
    const cliffRock = new THREE.Mesh(
      new THREE.ConeGeometry(3.4, 5.2, 7),
      stdMat(0x4d3430, 0.92, 0.04, stoneTex()),
    );
    cliffRock.rotation.x = Math.PI;
    cliffRock.position.set(-1.2, -2.55, 0.4);
    const cliffTop = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3.1, 0.35, 8), stdMat(0x5c3e38, 0.9, 0.03, stoneTex()));
    cliffTop.position.set(-1.2, 0.05, 0.4);
    // 崖边飘动的赤红披帛
    const scarf = new THREE.Mesh(new THREE.PlaneGeometry(1.35, 0.14), new THREE.MeshBasicMaterial({ color: 0xff4d5e, side: THREE.DoubleSide }));
    scarf.position.set(-0.35, 1.15, 0.45);
    this.cliffGrp.add(cliffRock, cliffTop, scarf);
    this.cliffGrp.userData.scarf = scarf;

    this.root.add(buildMountainRing(22, 34, 8, 18, 0x4a242c, 33));

    this.dust = new ParticleField(160, { map: sparkTex(), scale: 0.95, opacity: 0.85, additive: true });
    for (let i = 0; i < 160; i++) this.dust.setColor(i, i % 3 === 0 ? 0xff7b54 : 0xffd28a);
    this.dust.commit(true);
    this.root.add(this.dust.points);
  }

  update(c: ShotCtx) {
    const { t, u, env } = c;
    const v = c.shot.v;
    this.hideAllActors();
    const isCliff = v === 'v2';
    this.roadGrp.visible = !isCliff;
    this.cliffGrp.visible = isCliff;
    groundVis(this.root, !isCliff);

    setAtmo(env, {
      top: 0x2b1428, mid: 0x9e3838, bot: 0xff9e5e,
      sunCol: 0xffb85c, sunDir: [isCliff ? 0.35 : -0.25, 0.16, -1], sunGlow: 1.12, sunSize: 0.011, stars: 0.12,
    });
    env.grade.warm = 0.58; env.grade.bloom = 1.15; env.grade.vig = 0.45;

    for (let i = 0; i < this.dust.count; i++) {
      const x = ((t * 4.2 + hash(i * 3.3) * 18) % 18) - 9;
      const y = 0.15 + hash(i * 7.7) * 3.8 + Math.sin(t * 2 + i) * 0.2;
      const z = (hash(i * 5.1) - 0.5) * 9;
      this.dust.set(i, x, y, z, 0.22 + hash(i) * 0.25, t * 2 + i);
    }
    this.dust.commit();

    const cam = env.cam;
    if (v === 'd5') {
      // 风起古道：推过猎猎酒旗与倾倒酒坛
      this.banner.rotation.y = Math.sin(t * 6.5) * 0.28;
      this.steed.group.visible = false;
      this.actor('gpt', cam).at(1.8, 0.2, -1.6).act('hover', t, 1.1).sil(0.55, 0x260d14).glow(0xff8c5a, 0.35);
      setCamera(c, lerp(-3.2, -1.2, eOut(u)), 1.75, lerp(4.8, 2.8, eOut(u)), -0.6, 1.65, -1.2, 41);
    } else if (v === 'v1') {
      // 是谁醉酒策马：龙娘纵马疾驰卷起漫天金尘！
      this.banner.rotation.y = Math.sin(t * 8) * 0.35;
      this.steed.group.visible = true;
      const hx = lerp(-3.6, 2.8, u);
      this.steed.group.position.set(hx, 0, 0.2);
      animateSteed(this.steed, t);
      this.actor('gpt', cam)
        .at(hx - 0.1, 1.25 + this.steed.group.position.y, 0.22)
        .act('cast', t, 1.25).tilt(-0.1).noShadow().glow(0xff9e5e, 0.42);
      setCamera(c, hx * 0.65 + 0.6, 1.82, 5.35, hx + 0.2, 1.55, 0.1, 41, -0.025);
    } else {
      // v2：我嘶吼望断天涯 — 反打千仞断崖，本鲸迎烈风望向无尽赤霞远山
      const scarf = this.cliffGrp.userData.scarf as THREE.Mesh;
      scarf.rotation.z = Math.sin(t * 9) * 0.22 + 0.18;
      scarf.rotation.y = Math.cos(t * 7) * 0.25;
      this.actor('whale', cam).at(-1.05, 0.22, 0.45).act('point', t, 1.15).glow(0xff9e5e, 0.42);
      setCamera(c, lerp(-2.4, -0.2, eInOut(u)), lerp(1.35, 1.95, eInOut(u)), lerp(4.2, 5.8, eInOut(u)), 0.35, 1.38, -2.5, 43);
    }
  }
}

function groundVis(root: THREE.Group, vis: boolean) {
  if (root.children[0]) root.children[0].visible = vis;
}

// ============================================================================
// 5. 翠竹瑶琴涧（竹涧流觞 · 是谁妙曲生花 · 我十指谈笑风华）
// ============================================================================
export class GuqinGroveScene extends BaseScene {
  guqin!: THREE.Group;
  bamboos: THREE.Mesh[] = [];
  bloomFlowers: THREE.Group[] = [];
  waveRings: THREE.Mesh[] = [];
  petals!: ParticleField;

  build() {
    // 碧玉清溪水面
    const stream = new THREE.Mesh(
      new THREE.CircleGeometry(42, 36),
      stdMat(0x183d3d, 0.16, 0.55, undefined, 0x0d2626, 0.35),
    );
    stream.rotation.x = -Math.PI / 2;
    this.root.add(stream);

    // 青苔琴台石洲
    const isle = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 4.1, 0.28, 20), stdMat(0x4a665a, 0.88, 0.03, stoneTex()));
    isle.position.y = 0.1;
    this.root.add(isle);

    // 七弦瑶琴案
    this.guqin = buildGuqinTable();
    this.guqin.position.set(0, 0.24, 0.35);
    this.root.add(this.guqin);

    // 26 竿修竹环抱
    const bamMat = stdMat(0x2d7a58, 0.58, 0.05, undefined, 0x0f3826, 0.2);
    const bamGeo = new THREE.CylinderGeometry(0.065, 0.085, 7.5, 7);
    bamGeo.translate(0, 3.75, 0);
    for (let i = 0; i < 26; i++) {
      const a = -Math.PI * 0.92 + (i / 25) * Math.PI * 0.88 * 1.15 - 0.1;
      const r = 4.6 + hash(i * 3.7) * 3.8;
      const x = Math.sin(a) * r * 1.3;
      const z = -Math.abs(Math.cos(a)) * r - 1.2;
      const bm = new THREE.Mesh(bamGeo, bamMat);
      bm.position.set(x, -0.1, z);
      bm.userData.phase = i * 0.7;
      this.root.add(bm);
      this.bamboos.push(bm);
    }

    // 八朵随琴音升腾绽放的发光无叶玉莲（妙曲生花！）
    for (let i = 0; i < 8; i++) {
      const fl = buildLotusLamp(i % 2 ? 0xffb3d1 : 0xa7f3d0, 0xffe899, 0.58, false);
      this.root.add(fl);
      this.bloomFlowers.push(fl);
    }

    // 三圈金色琴韵音波环
    for (let i = 0; i < 3; i++) {
      const rg = new THREE.Mesh(
        new THREE.RingGeometry(0.95, 1.04, 36),
        new THREE.MeshBasicMaterial({ color: 0xffe49e, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }),
      );
      rg.rotation.x = -Math.PI / 2;
      rg.position.set(0, 0.04, 0.35);
      this.root.add(rg);
      this.waveRings.push(rg);
    }

    this.petals = new ParticleField(140, { map: petalTex(), scale: 0.85, opacity: 0.88 });
    for (let i = 0; i < 140; i++) this.petals.setColor(i, i % 3 === 0 ? 0xa7f3d0 : 0xffc8dd);
    this.petals.commit(true);
    this.root.add(this.petals.points);
  }

  update(c: ShotCtx) {
    const { t, u, env, pulse } = c;
    const v = c.shot.v;
    this.hideAllActors();

    setAtmo(env, {
      top: 0x123038, mid: 0x2b6b68, bot: 0x8fd4c4,
      sunCol: 0xfff0be, sunDir: [0.25, 0.42, -1], sunGlow: 0.78, stars: 0.25,
    });
    env.grade.warm = 0.22; env.grade.bloom = 1.18;

    this.bamboos.forEach((b) => {
      b.rotation.z = Math.sin(t * 1.4 + b.userData.phase) * 0.045;
    });

    // 七弦轻颤
    const strings = this.guqin.userData.strings as THREE.Mesh[];
    strings.forEach((s, i) => {
      s.position.y = 0.806 + Math.sin(t * 28 + i * 1.9) * 0.008 * (0.3 + pulse);
    });

    // 妙曲生花：琴弦上方螺旋绽放玉莲与粉樱（d3 时漂浮于水面）
    this.bloomFlowers.forEach((fl, i) => {
      if (v === 'd3') {
        const a = (i / 8) * TAU + t * 0.14;
        fl.position.set(Math.cos(a) * 4.5, 0.03, Math.sin(a) * 3.8);
        fl.scale.setScalar(0.75);
      } else {
        const p = ((u * 0.85 + i / 8) % 1);
        const ang = i * 1.3 + t * 0.9;
        const rad = 0.55 + p * 2.1;
        fl.position.set(Math.cos(ang) * rad, 1.05 + p * 1.95, 0.35 + Math.sin(ang) * rad * 0.7);
        fl.scale.setScalar(Math.sin(p * Math.PI) * 0.72);
      }
    });

    // 水面金色音波涟漪
    this.waveRings.forEach((rg, i) => {
      const wp = ((t * 0.55 + i / 3) % 1);
      rg.scale.setScalar(1.2 + wp * 5.8);
      (rg.material as THREE.MeshBasicMaterial).opacity = (1 - wp) * (v === 'v4' ? 0.55 : 0.32);
    });

    for (let i = 0; i < this.petals.count; i++) {
      const a = hash(i * 4.1) * TAU + t * 0.45;
      const r = 0.8 + hash(i * 7.3) * 6.5;
      const y = 0.3 + ((t * 0.5 + hash(i * 2.9) * 5) % 5.0);
      this.petals.set(i, Math.cos(a) * r, y, Math.sin(a) * r, 0.22, t * 1.4 + i);
    }
    this.petals.commit();

    const cam = env.cam;
    if (v === 'd3') {
      this.actor('qwen', cam).at(0, 0.24, -0.35).act('idle', t, 0.95).glow(0xa7f3d0, 0.3);
      this.actor('kimi', cam).at(-1.85, 0.24, 0.25).act('think', t, 0.85).prop('prop_scroll', 0.45, 0.7, 0.38);
      this.actor('zai', cam).at(1.95, 0.24, 0.35).flip(true).act('doze', t, 0.8);
      setCamera(c, lerp(-1.4, 1.2, eInOut(u)), 1.95, 5.9, 0, 1.15, 0, 40);
    } else if (v === 'v3') {
      // 是谁妙曲生花：推近千问抚琴，弦上玉莲纷飞绽开
      this.actor('qwen', cam).at(0, 0.24, -0.25).act('sway', t, 1.15).bounce(pulse, 0.05).glow(0xffe899, 0.42);
      setCamera(c, lerp(1.35, 0.45, eOut(u)), lerp(1.78, 1.52, eOut(u)), lerp(4.55, 3.55, eOut(u)), 0, 1.25, 0.1, 38);
    } else {
      // v4：我十指谈笑风华 — 环绕琴台，千问执扇轻旋，本鲸对立听曲
      this.actor('qwen', cam).at(-0.85, 0.24, -0.15).act('spin', t, 1.0).prop('prop_fan', 0.48, 0.76, 0.4).glow(0xa7f3d0, 0.38);
      this.actor('whale', cam).at(1.28, 0.24, 0.35).flip(true).act('nod', t, 0.95).glow(0xffe899, 0.28);
      const ang = lerp(-0.45, 0.48, eInOut(u));
      setCamera(c, Math.sin(ang) * 5.2, 1.85, Math.cos(ang) * 5.2, 0.1, 1.22, 0.1, 40);
    }
  }
}

// ============================================================================
// 6. 海角观霞台（是谁高歌天下 · 我目送海角余霞 · 万里听风）
// ============================================================================
export class SunsetCoastScene extends BaseScene {
  skiff!: THREE.Group;
  shimmer!: ParticleField;
  soundWave!: THREE.Mesh;
  banners: THREE.Mesh[] = [];

  build() {
    // 无垠碧海暮波
    const sea = new THREE.Mesh(
      new THREE.PlaneGeometry(140, 140),
      stdMat(0x28345a, 0.15, 0.72, undefined, 0x3b1d36, 0.32),
    );
    sea.rotation.x = -Math.PI / 2;
    this.root.add(sea);

    // 临海石砌观潮长堤与朱栏
    const pier = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.65, 4.2), stdMat(0x6c6874, 0.86, 0.05, stoneTex()));
    pier.position.set(0, 0.25, 1.4);
    this.root.add(pier);
    for (let i = 0; i < 6; i++) {
      const px = -3.2 + i * 1.28;
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.72, 0.18), stdMat(0x8c8694, 0.8, 0.05, stoneTex()));
      post.position.set(px, 0.92, -0.58);
      this.root.add(post);
    }
    const rail = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.1, 0.12), stdMat(0x8c8694, 0.8));
    rail.position.set(0, 1.15, -0.58);
    this.root.add(rail);

    // 高台双旌旗
    for (const sx of [-3.3, 3.3]) {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 4.4, 8), stdMat(0x4a2a24, 0.7));
      pole.position.set(sx, 2.5, -0.55);
      const flag = new THREE.Mesh(
        new THREE.PlaneGeometry(1.4, 0.72),
        stdMat(0xd94848, 0.5, 0, undefined, 0x6e1818, 0.35),
      );
      flag.geometry.translate(0.7, 0, 0);
      flag.position.set(sx, 4.25, -0.55);
      this.root.add(pole, flag);
      this.banners.push(flag);
    }

    // 远海孤帆扁舟
    this.skiff = buildSkiff(1.15);
    this.root.add(this.skiff);

    // 万里传来的金色音波环（c2_11）
    this.soundWave = new THREE.Mesh(
      new THREE.RingGeometry(1.4, 1.58, 40),
      new THREE.MeshBasicMaterial({ color: 0xffe899, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    this.root.add(this.soundWave);

    // 海面落日熔金碎光
    this.shimmer = new ParticleField(150, { map: glowTex(), scale: 1.1, opacity: 0.85, additive: true });
    for (let i = 0; i < 150; i++) this.shimmer.setColor(i, i % 3 === 0 ? 0xff7eb3 : 0xffc86b);
    this.shimmer.commit(true);
    this.root.add(this.shimmer.points);
  }

  update(c: ShotCtx) {
    const { t, u, env } = c;
    const v = c.shot.v;
    this.hideAllActors();
    this.banners.forEach((b, i) => { b.rotation.y = Math.sin(t * 5.5 + i) * 0.3; });

    // 海面碎金波光
    for (let i = 0; i < this.shimmer.count; i++) {
      const z = -1.5 - hash(i * 3.7) * 32;
      const spread = 1.2 + (-z) * 0.14;
      const x = (hash(i * 7.1) - 0.5) * spread * 2 + Math.sin(t * 2.2 + i) * 0.35;
      const y = v === 'c2_11' && i > 95 ? 0.8 + hash(i * 2.3) * 3.2 : 0.05;
      this.shimmer.set(i, x, y, z, 0.35 + 0.25 * Math.sin(t * 4 + i), 0);
    }
    this.shimmer.commit();

    const cam = env.cam;
    this.soundWave.visible = v === 'c2_11';

    if (v === 'v5') {
      // 是谁高歌天下：金光破云高台，狐狸与龙娘凭栏豪迈临风
      setAtmo(env, { top: 0x243062, mid: 0xb8585e, bot: 0xffc478, sunCol: 0xffe299, sunDir: [0, 0.24, -1], sunGlow: 1.22, sunSize: 0.014 });
      env.grade.warm = 0.52; env.grade.bloom = 1.2;
      this.skiff.visible = false;
      this.actor('zai', cam).at(-0.95, 0.58, 0.45).act('alert', t, 1.05).glow(0xffd27d, 0.38);
      this.actor('gpt', cam).at(1.05, 0.72, 0.35).flip(true).act('float', t, 1.05).glow(0xffb86b, 0.4);
      setCamera(c, lerp(-1.2, 0.8, eInOut(u)), lerp(1.45, 1.85, eInOut(u)), 5.4, 0, 1.72, -0.5, 42);
    } else if (v === 'v6') {
      // 我目送海角余霞：熔金夕阳沉海，白帆远去，本鲸与狐狸长堤静立目送
      setAtmo(env, { top: 0x1f1d48, mid: 0x9e4268, bot: 0xff8a5b, sunCol: 0xff9e5e, sunDir: [0.05, 0.09, -1], sunGlow: 1.32, sunSize: 0.018, stars: 0.28 });
      env.grade.warm = 0.55; env.grade.bloom = 1.22;
      this.skiff.visible = true;
      this.skiff.position.set(lerp(0.6, 1.6, u), Math.sin(t * 2) * 0.04, lerp(-8.5, -12.5, u));
      this.skiff.rotation.y = 0.35;
      this.actor('whale', cam).at(-1.15, 0.58, 0.55).act('idle', t, 0.85).glow(0xff9e7a, 0.35);
      this.actor('zai', cam).at(1.45, 0.58, 0.65).flip(true).act('lookaround', t, 0.8);
      setCamera(c, 0, 1.88, lerp(5.2, 6.1, eInOut(u)), 0.1, 1.42, -5.0, 42);
    } else {
      // c2_11：不管听见还是不见 — 万里海角长堤，金色音波拂来，小克蓦然抬头
      setAtmo(env, { top: 0x263c72, mid: 0x8e6fa8, bot: 0xffd2b8, sunCol: 0xffe8b5, sunDir: [-0.15, 0.22, -1], sunGlow: 1.05, aurora: 0.3, t });
      env.grade.warm = 0.38; env.grade.bloom = 1.2;
      this.skiff.visible = true;
      this.skiff.position.set(-2.4, 0, -9.5);
      this.soundWave.position.set(0, 2.1, lerp(-10, 0.2, eOut(u)));
      this.soundWave.scale.setScalar(1 + u * 2.2);
      (this.soundWave.material as THREE.MeshBasicMaterial).opacity = Math.sin(u * Math.PI) * 0.65;
      this.actor('claude', cam).at(-0.55, 0.58, 0.65).act('lookaround', t, 1.0).glow(0xffe8a3, 0.42);
      this.actor('zai', cam).at(1.25, 0.58, 0.55).flip(true).act('alert', t, 1.0);
      setCamera(c, lerp(1.1, -0.3, eInOut(u)), 1.68, 4.75, 0.1, 1.48, 0, 39);
    }
  }
}

// ============================================================================
// 7. 临水轻纱榭（是谁拨乱丝发 · 我愁思默语不答 · 晨纱回眸）
// ============================================================================
export class WaterPavilionScene extends BaseScene {
  pav!: THREE.Group;
  frontVeil!: THREE.Mesh;
  petals!: ParticleField;

  build() {
    const lake = new THREE.Mesh(
      new THREE.PlaneGeometry(90, 90),
      stdMat(0x161d36, 0.14, 0.65, undefined, 0x11172e, 0.35),
    );
    lake.rotation.x = -Math.PI / 2;
    this.root.add(lake);

    this.pav = buildPavilion();
    this.root.add(this.pav);

    // 隔在两人之间的半透明轻纱（v8 默语不答 / c2_3 晨纱吹开）
    this.frontVeil = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 2.55, 4, 6),
      new THREE.MeshStandardMaterial({
        color: 0xfbeff8,
        transparent: true,
        opacity: 0.26,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    this.frontVeil.geometry.translate(0, -1.25, 0);
    this.frontVeil.position.set(0, 2.9, 0.55);
    this.root.add(this.frontVeil);

    // 湖面莲灯点缀
    for (const [x, z] of [[-3.8, 1.2], [4.1, 0.8], [-2.6, 3.2], [3.2, 2.9]] as const) {
      const ll = buildLotusLamp(0xf9a8d4, 0xffe4a0, 0.72);
      ll.position.set(x, 0.02, z);
      this.root.add(ll);
    }

    this.petals = new ParticleField(130, { map: petalTex(), scale: 0.85, opacity: 0.88 });
    for (let i = 0; i < 130; i++) this.petals.setColor(i, i % 2 ? 0xf9a8d4 : 0xe9d5ff);
    this.petals.commit(true);
    this.root.add(this.petals.points);

    this.root.add(buildMountainRing(16, 36, 5, 12, 0x1c203e, 41));
  }

  update(c: ShotCtx) {
    const { t, u, env } = c;
    const v = c.shot.v;
    this.hideAllActors();

    const curtains = this.pav.userData.curtains as THREE.Mesh[];
    const wind = v === 'c2_3' ? 1.65 : v === 'v7' ? 1.45 : 0.75;
    curtains.forEach((veil) => {
      veil.rotation.x = 0.14 * wind + Math.sin(t * 2.4 + veil.userData.phase) * 0.18 * wind;
      veil.rotation.z = Math.cos(t * 1.9 + veil.userData.phase) * 0.12 * wind;
    });
    this.frontVeil.rotation.z = v === 'c2_3' ? lerp(0.08, 0.68, eOut(u)) : Math.sin(t * 2.2) * 0.18;
    this.frontVeil.rotation.x = Math.cos(t * 1.8) * 0.12;

    for (let i = 0; i < this.petals.count; i++) {
      const x = ((t * 1.1 * wind + hash(i * 4.3) * 12) % 12) - 6;
      const y = 4.6 - ((t * 0.4 + hash(i * 6.1) * 4.5) % 4.4);
      const z = (hash(i * 8.9) - 0.5) * 7;
      this.petals.set(i, x, y, z, 0.21, t * 1.6 + i);
    }
    this.petals.commit();

    const cam = env.cam;
    if (v === 'v7') {
      // 是谁拨乱丝发：晚风吹起轻纱与花瓣，小克于榭中回身
      setAtmo(env, { top: 0x141738, mid: 0x3b3268, bot: 0x86689e, sunCol: 0xdbeafe, sunDir: [0.3, 0.38, -1], sunGlow: 0.72, stars: 0.65 });
      env.grade.cool = 0.22; env.grade.bloom = 1.12;
      this.actor('claude', cam).at(0.25, 0.32, 0.25).act('lookaround', t, 1.0).glow(0xf9a8d4, 0.34);
      setCamera(c, lerp(-1.3, 0.4, eInOut(u)), 1.68, 4.45, 0.15, 1.32, 0.1, 38);
    } else if (v === 'v8') {
      // 我愁思默语不答：一帘薄纱隔开两人，本鲸垂首静默
      setAtmo(env, { top: 0x0f122c, mid: 0x282452, bot: 0x5c4b7c, sunCol: 0xc7d2fe, sunDir: [-0.25, 0.36, -1], sunGlow: 0.62, stars: 0.78 });
      env.grade.cool = 0.32; env.grade.vig = 0.5;
      this.actor('whale', cam).at(-1.05, 0.32, 0.85).act('sad', t, 0.8).glow(0x93c5fd, 0.25);
      this.actor('claude', cam).at(1.05, 0.32, -0.25).flip(true).act('idle', t, 0.75).alpha(0.85);
      setCamera(c, lerp(-0.35, -0.75, eInOut(u)), 1.58, 4.95, -0.15, 1.25, 0.25, 39);
    } else {
      // c2_3：副歌二晨纱吹开，小克回身温柔颔首
      setAtmo(env, { top: 0x2e4a82, mid: 0xc47ea6, bot: 0xffe2be, sunCol: 0xffecc2, sunDir: [0.2, 0.28, -1], sunGlow: 1.08 });
      env.grade.warm = 0.44; env.grade.bloom = 1.2;
      this.actor('claude', cam).at(0.72, 0.32, 0.45).flip(true).act('nod', t, 0.95).glow(0xffe4b5, 0.4);
      this.actor('whale', cam).at(-0.92, 0.32, 0.65).act('sway', t, 0.95).glow(0xffc8dd, 0.35);
      setCamera(c, lerp(0.9, -0.2, eInOut(u)), 1.58, lerp(4.8, 4.1, eOut(u)), 0, 1.28, 0.35, 38);
    }
  }
}

// 预留导出防止未使用告警
export { buildDragonSword };
