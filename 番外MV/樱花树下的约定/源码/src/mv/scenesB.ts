// 原创三维场景库（下卷）：铸剑赤龙坛 · 浮云仙峰海 · 残阳万箭原 · 月夜水中央 · 晴雨石拱桥 · 十里红妆廊 · 霜雪呼喊巅 · 万里灵曲空
import * as THREE from 'three';
import {
  Actor,
  ParticleField,
  TAU,
  clamp,
  dropTex,
  eInOut,
  eOut,
  frostTex,
  glowTex,
  hash,
  lerp,
  petalTex,
  range,
  smooth,
  sparkTex,
  stoneTex,
} from './core';
import {
  type SwallowRig,
  bridgeY,
  buildArchBridge,
  buildArrow,
  buildCloudPuff,
  buildDragonSword,
  buildGuqinTable,
  buildLotusLamp,
  buildMountainRing,
  buildOilUmbrella,
  buildPalanquin,
  buildSakuraTree,
  buildSilkLantern,
  buildStoneLantern,
  buildSwallow,
  stdMat,
} from './kit';
import { BaseScene, type ShotCtx, setAtmo, setCamera } from './scenesA';

// ============================================================================
// 8. 铸剑赤龙坛（孤身夺下噬血龙剑 · 副歌二剑缠春樱）
// ============================================================================
export class DragonSwordScene extends BaseScene {
  sword!: THREE.Group;
  slashArc!: THREE.Mesh;
  runeRing!: THREE.Mesh;
  sakuraWrap = new THREE.Group();
  embers!: ParticleField;

  build() {
    // 黑曜裂岩大地
    const ground = new THREE.Mesh(new THREE.CircleGeometry(48, 32), stdMat(0x1a141c, 0.92, 0.08, stoneTex()));
    ground.rotation.x = -Math.PI / 2;
    this.root.add(ground);

    // 三级八角铸剑石坛
    const obs = stdMat(0x28202c, 0.78, 0.18, stoneTex());
    for (let i = 0; i < 3; i++) {
      const tier = new THREE.Mesh(new THREE.CylinderGeometry(3.2 - i * 0.75, 3.55 - i * 0.75, 0.34, 8), obs);
      tier.position.y = 0.17 + i * 0.32;
      this.root.add(tier);
    }

    // 地面赤金剑阵符环
    this.runeRing = new THREE.Mesh(
      new THREE.RingGeometry(1.55, 1.85, 32),
      new THREE.MeshBasicMaterial({ color: 0xff2a55, transparent: true, opacity: 0.72, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    this.runeRing.rotation.x = -Math.PI / 2;
    this.runeRing.position.y = 1.02;
    this.root.add(this.runeRing);

    // 六根镇剑断柱与铁索
    const chainMat = stdMat(0x3a2832, 0.5, 0.7, undefined, 0x4f0d1c, 0.25);
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * TAU + 0.35;
      if (Math.sin(a) > 0.65) continue; // 留出正面镜头视野
      const px = Math.cos(a) * 4.8, pz = Math.sin(a) * 4.8;
      const h = 2.6 + (i % 2) * 0.9;
      const pil = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, h, 6), obs);
      pil.position.set(px, h * 0.5, pz);
      this.root.add(pil);
      const cc = new THREE.CatmullRomCurve3([
        new THREE.Vector3(px, h * 0.85, pz),
        new THREE.Vector3(px * 0.5, h * 0.42, pz * 0.5),
        new THREE.Vector3(Math.cos(a) * 1.1, 1.15, Math.sin(a) * 1.1),
      ]);
      this.root.add(new THREE.Mesh(new THREE.TubeGeometry(cc, 12, 0.032, 6, false), chainMat));
    }

    // 坛心噬血龙剑
    this.sword = buildDragonSword(1.05);
    this.sword.position.set(0, 1.0, 0);
    this.root.add(this.sword);

    // 夺剑瞬间的赤红新月剑气弧
    this.slashArc = new THREE.Mesh(
      new THREE.TorusGeometry(2.15, 0.085, 8, 40, Math.PI * 1.25),
      new THREE.MeshBasicMaterial({ color: 0xff4d6d, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    this.slashArc.position.set(0, 2.05, 0.2);
    this.root.add(this.slashArc);

    // 副歌二（c2_6）：缠绕龙剑的新生春樱花簇与红绸
    const pMat = stdMat(0xffb7ce, 0.5, 0, undefined, 0xa83860, 0.32);
    for (let i = 0; i < 9; i++) {
      const a = i * 0.95;
      const bl = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 1), pMat);
      bl.position.set(Math.cos(a) * 0.36, 1.15 + i * 0.22, Math.sin(a) * 0.36);
      this.sakuraWrap.add(bl);
    }
    this.root.add(this.sakuraWrap);

    this.root.add(buildMountainRing(20, 34, 9, 20, 0x26121e, 51));

    this.embers = new ParticleField(180, { map: sparkTex(), scale: 1.0, opacity: 0.9, additive: true });
    this.root.add(this.embers.points);
  }

  update(c: ShotCtx) {
    const { t, u, env } = c;
    const v = c.shot.v;
    this.hideAllActors();
    const peaceful = v === 'c2_6';
    this.sakuraWrap.visible = peaceful;
    this.runeRing.rotation.z = t * 0.6;
    const tassel = this.sword.userData.tassel as THREE.Group;
    tassel.rotation.z = Math.sin(t * (peaceful ? 2.5 : 7.5)) * 0.35;

    for (let i = 0; i < this.embers.count; i++) {
      const a = hash(i * 3.1) * TAU + t * (peaceful ? 0.45 : 1.15);
      const r = 0.7 + hash(i * 6.7) * 5.8;
      const y = 0.3 + ((t * (peaceful ? 0.6 : 1.55) + hash(i * 9.3) * 5.5) % 5.6);
      this.embers.set(i, Math.cos(a) * r, y, Math.sin(a) * r, 0.24 + hash(i) * 0.22, t * 2 + i);
      this.embers.setColor(i, peaceful ? (i % 2 ? 0xffb7ce : 0xffe299) : (i % 3 === 0 ? 0xffb703 : 0xff2a55));
    }
    this.embers.commit(true);

    const cam = env.cam;
    if (!peaceful) {
      // w1：孤身夺下噬血龙剑 — 本鲸登坛夺剑，龙娘凌空交锋，赤红剑气横扫！
      setAtmo(env, {
        top: 0x140812, mid: 0x5c1024, bot: 0xc92a3e,
        sunCol: 0xff4d5e, sunDir: [0, 0.25, -1], sunGlow: 1.15, sunSize: 0.008, stars: 0.25,
        rimCol: 0xff2a55, rimInt: 2.2,
      });
      const slashP = range(u, 0.34, 0.72);
      const flash = Math.exp(-Math.pow((u - 0.42) * 9, 2));
      env.grade.warm = 0.35; env.grade.bloom = 1.3 + flash * 0.55; env.grade.vig = 0.52;
      env.grade.flash = flash * 0.38; env.grade.flashCol = 0xff4d6d;
      env.grade.ca = flash * 0.004;

      // 夺剑拔起动画
      const pull = eOut(range(u, 0.36, 0.65));
      this.sword.position.y = lerp(1.0, 1.48, pull);
      this.sword.rotation.z = lerp(0, -0.18, pull);
      this.slashArc.visible = slashP > 0 && slashP < 1;
      this.slashArc.scale.setScalar(0.65 + eOut(slashP) * 1.45);
      this.slashArc.rotation.set(0.65, 0, slashP * 4.2);
      (this.slashArc.material as THREE.MeshBasicMaterial).opacity = Math.sin(slashP * Math.PI) * 0.95;

      // 本鲸孤身跃上剑坛
      const wp = eOut(range(u, 0, 0.42));
      this.actor('whale', cam)
        .at(lerp(-2.2, -0.68, wp), lerp(0.34, 1.0, wp), lerp(1.4, 0.45, wp))
        .act(u > 0.38 ? 'point' : 'hop', t, 1.2)
        .lift(Math.sin(wp * Math.PI) * 0.42)
        .glow(0xff4d6d, 0.48);

      // 龙娘盘旋镇守 → 试剑后退让
      this.actor('gpt', cam)
        .at(lerp(1.15, 1.85, pull), lerp(2.15, 2.45, pull), -0.45)
        .flip(true).act(u < 0.45 ? 'cast' : 'hover', t, 1.2)
        .noShadow().glow(0xff6b6b, 0.52);

      const shk = flash * 0.14;
      setCamera(
        c,
        lerp(-1.6, 0.55, eInOut(u)) + Math.sin(t * 55) * shk,
        lerp(1.85, 2.25, eInOut(u)) + Math.cos(t * 48) * shk,
        lerp(6.4, 4.95, eOut(u)),
        0.1, 2.05, 0, 42, -0.03 * (1 - pull),
      );
    } else {
      // c2_6：剑缠春樱，爱恨化春风，龙娘释然颔首
      setAtmo(env, {
        top: 0x2d3c74, mid: 0xb86894, bot: 0xffd2b8,
        sunCol: 0xffe2a8, sunDir: [0.15, 0.28, -1], sunGlow: 1.05, aurora: 0.25, t,
      });
      env.grade.warm = 0.4; env.grade.bloom = 1.22;
      this.sword.position.y = 1.0;
      this.sword.rotation.z = 0.05;
      this.slashArc.visible = false;
      (this.runeRing.material as THREE.MeshBasicMaterial).color.setHex(0xff9ebb);
      this.actor('gpt', cam).at(1.25, 1.35, 0.25).flip(true).act('nod', t, 0.9).noShadow().glow(0xffc8dd, 0.42);
      setCamera(c, lerp(-1.2, 0.8, eInOut(u)), 2.15, 5.15, 0.3, 1.95, 0, 39);
    }
  }
}

// ============================================================================
// 9. 浮云仙峰海（脚踏浮云轻似燕 · 奈何瑟瑟风中久站 · 儿女情长看不断）
// ============================================================================
export class CloudPeaksScene extends BaseScene {
  clouds: THREE.Group[] = [];
  swallows: SwallowRig[] = [];
  cragGrp = new THREE.Group();
  plantedSword!: THREE.Group;
  fateThreads = new THREE.Group();
  windMotes!: ParticleField;

  build() {
    // 青冥仙峰耸立云海
    const peakMat = stdMat(0x4b7f8f, 0.82, 0.04, stoneTex(), 0x1b3f4f, 0.22);
    for (const [x, z, r, h] of [
      [-5.8, -5.8, 2.2, 9.5], [6.0, -6.4, 2.5, 10.5], [-2.2, -9.8, 2.8, 11.5],
      [2.8, -11.2, 3.0, 11.0], [3.5, -1.4, 1.45, 6.2], [-3.9, -1.8, 1.5, 5.6],
    ] as const) {
      const pk = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.55, r, h, 7), peakMat);
      pk.position.set(x, h * 0.5 - 4.8, z);
      this.root.add(pk);
    }

    // 14 朵立体踏脚祥云
    const stepCoords: [number, number, number, number][] = [
      [-2.8, 0.4, 0.5, 1.0], [-0.9, 0.85, 0.35, 1.05], [1.0, 1.25, 0.2, 1.05], [2.9, 1.55, 0.1, 1.0],
      [-4.2, -0.4, -2.5, 1.6], [-1.2, -0.3, -3.2, 1.8], [2.2, -0.2, -3.0, 1.7], [4.8, -0.4, -2.4, 1.6],
      [-3.0, -0.8, 2.4, 1.3], [0.4, -0.7, 2.6, 1.4], [3.4, -0.7, 2.2, 1.3],
      [-5.5, 0.6, -5.8, 2.1], [0.2, 0.4, -6.2, 2.3], [5.2, 0.5, -5.5, 2.1],
    ];
    for (const [x, y, z, sc] of stepCoords) {
      const cl = buildCloudPuff(sc);
      cl.position.set(x, y, z);
      cl.userData.baseX = x;
      this.root.add(cl);
      this.clouds.push(cl);
    }

    // 7 只振翅掠云飞燕
    for (let i = 0; i < 7; i++) {
      const sw = buildSwallow(0.9 + (i % 3) * 0.15);
      this.root.add(sw.group);
      this.swallows.push(sw);
    }

    // 孤峰剑崖（w3 瑟瑟风中久站 / w4 儿女情长看不断）
    const rock = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.8, 4.5, 8), stdMat(0x465264, 0.9, 0.05, stoneTex()));
    rock.position.set(-1.35, -1.65, 0.5);
    this.plantedSword = buildDragonSword(0.76);
    this.plantedSword.position.set(-0.32, 0.55, 0.65);
    this.plantedSword.rotation.z = -0.1;
    this.cragGrp.add(rock, this.plantedSword);
    this.root.add(this.cragGrp);

    // 跨越云壑的九缕发光红丝（w4 儿女情长看不断）
    const threadMat = new THREE.MeshBasicMaterial({ color: 0xff3b6b, transparent: true, opacity: 0.78 });
    for (let i = 0; i < 9; i++) {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-0.32, 1.45 + (i - 4) * 0.12, 0.65),
        new THREE.Vector3(1.1, 1.85 + Math.sin(i * 1.4) * 0.65, -0.4 + (i - 4) * 0.18),
        new THREE.Vector3(3.55, 1.55 + (i - 4) * 0.08, -1.45),
      ]);
      this.fateThreads.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.016, 5, false), threadMat));
    }
    this.root.add(this.fateThreads);

    this.windMotes = new ParticleField(160, { map: frostTex(), scale: 0.85, opacity: 0.8, additive: true });
    this.root.add(this.windMotes.points);
  }

  update(c: ShotCtx) {
    const { t, u, env } = c;
    const v = c.shot.v;
    this.hideAllActors();

    const isSwallow = v === 'w2';
    const isThread = v === 'w4';
    this.cragGrp.visible = !isSwallow;
    this.fateThreads.visible = isThread;
    this.swallows.forEach((sw) => { sw.group.visible = isSwallow; });
    for (let i = 0; i < 4; i++) this.clouds[i].visible = isSwallow;

    // 浮云轻柔确定性漂移
    this.clouds.forEach((cl, i) => {
      if (i >= 4) cl.position.x = (cl.userData.baseX as number) + Math.sin(t * 0.45 + i) * 0.28;
    });

    const cam = env.cam;
    if (isSwallow) {
      // w2：脚踏浮云轻似燕 — 碧空云海，本鲸踏着四朵浮云腾跃，群燕展翅伴飞！
      setAtmo(env, {
        top: 0x1e6091, mid: 0x68b8d8, bot: 0xf4f8fc,
        sunCol: 0xfff4cc, sunDir: [0.3, 0.48, -1], sunGlow: 0.95, stars: 0,
      });
      env.grade.warm = 0.22; env.grade.bloom = 1.15;

      const stepF = u * 3;
      const si = Math.min(2, Math.floor(stepF));
      const sp = stepF - si;
      const c0 = this.clouds[si].position, c1 = this.clouds[si + 1].position;
      const wx = lerp(c0.x, c1.x, sp);
      const wy = lerp(c0.y, c1.y, sp) + 0.42 + Math.sin(sp * Math.PI) * 0.82;
      const wz = lerp(c0.z, c1.z, sp);
      this.actor('whale', cam).at(wx, wy, wz).act('hop', t, 1.25).tilt(-0.08).noShadow().glow(0xfff4cc, 0.38);
      // 右侧仙峰崖顶狐狸惊醒仰望飞燕
      this.actor('zai', cam).at(3.45, 1.42, -1.35).flip(true).act('alert', t, 1.0);

      // 群燕振翅盘旋掠过
      this.swallows.forEach((sw, i) => {
        const p = ((u * 0.85 + i * 0.14) % 1);
        const sx = lerp(-6.2, 6.5, p);
        const sy = 1.15 + Math.sin(p * TAU + i) * 0.85 + (i % 3) * 0.45;
        const sz = -0.8 + (i - 3) * 0.55;
        sw.group.position.set(sx, sy, sz);
        sw.group.rotation.set(-Math.cos(p * TAU + i) * 0.25, Math.PI / 2, Math.sin(t * 2 + i) * 0.2);
        const flap = Math.sin(t * 16 + i * 1.4) * 0.65;
        sw.wingL.rotation.z = flap;
        sw.wingR.rotation.z = -flap;
      });

      this.windMotes.mat.uniforms.uOpacity.value = 0.55;
      for (let i = 0; i < this.windMotes.count; i++) {
        this.windMotes.set(i, (hash(i * 3) - 0.5) * 14, hash(i * 5) * 5, (hash(i * 7) - 0.5) * 8, 0.2, 0);
        this.windMotes.setColor(i, 0xffffff);
      }
      this.windMotes.commit(true);

      setCamera(c, wx * 0.55, 2.25, 6.2, wx * 0.7, 1.85, -0.2, 42);
    } else if (v === 'w3') {
      // w3：奈何瑟瑟风中久站 — 苍青寒风疾掠，本鲸孤立龙剑之侧瑟瑟发抖
      setAtmo(env, {
        top: 0x121e30, mid: 0x2f4860, bot: 0x7b96ad,
        sunCol: 0xbde0fe, sunDir: [-0.35, 0.25, -1], sunGlow: 0.55, stars: 0.35,
      });
      env.grade.cool = 0.48; env.grade.vig = 0.5; env.grade.bloom = 0.98;
      (this.plantedSword.userData.tassel as THREE.Group).rotation.z = 0.55 + Math.sin(t * 12) * 0.25;

      this.windMotes.mat.uniforms.uOpacity.value = 0.85;
      for (let i = 0; i < this.windMotes.count; i++) {
        const x = ((t * 7.8 + hash(i * 4.1) * 18) % 18) - 9;
        const y = 0.2 + hash(i * 6.3) * 4.5;
        const z = (hash(i * 8.7) - 0.5) * 7;
        this.windMotes.set(i, x, y, z, 0.2, t * 4 + i);
        this.windMotes.setColor(i, 0xcde8ff);
      }
      this.windMotes.commit(true);

      this.actor('whale', cam).at(-1.45, 0.6, 0.55).act('shiver', t, 1.15).glow(0x93c5fd, 0.28);
      setCamera(c, lerp(-1.1, -0.4, eInOut(u)), lerp(1.65, 2.25, eInOut(u)), lerp(4.1, 6.1, eInOut(u)), -1.0, 1.48, 0.4, 40);
    } else {
      // w4：儿女情长看不断 — 红穗狂舞，九缕红丝跨越云壑连向远峰小克
      setAtmo(env, {
        top: 0x1a1836, mid: 0x4f3562, bot: 0xa86b8c,
        sunCol: 0xffb3c6, sunDir: [0.25, 0.22, -1], sunGlow: 0.78, stars: 0.45,
      });
      env.grade.cool = 0.18; env.grade.warm = 0.22; env.grade.bloom = 1.22;
      (this.plantedSword.userData.tassel as THREE.Group).rotation.z = 0.48 + Math.sin(t * 8) * 0.28;
      this.fateThreads.position.y = Math.sin(t * 2.4) * 0.06;

      this.windMotes.mat.uniforms.uOpacity.value = 0.72;
      for (let i = 0; i < this.windMotes.count; i++) {
        const x = ((t * 2.8 + hash(i * 3.7) * 16) % 16) - 8;
        const y = 0.3 + hash(i * 5.9) * 4.4;
        const z = (hash(i * 7.1) - 0.5) * 7;
        this.windMotes.set(i, x, y, z, 0.22, t + i);
        this.windMotes.setColor(i, i % 2 ? 0xff7597 : 0xffd6e7);
      }
      this.windMotes.commit(true);

      this.actor('whale', cam).at(-1.48, 0.6, 0.55).act('idle', t, 0.9).glow(0xff7597, 0.34);
      this.actor('claude', cam).at(3.6, 1.0, -1.5).flip(true).act('idle', t, 0.8).alpha(0.88).glow(0xffc8dd, 0.38);
      setCamera(c, lerp(-0.6, 1.15, eInOut(u)), 2.05, 5.65, lerp(-0.3, 1.2, eInOut(u)), 1.55, -0.3, 41);
    }
  }
}

// ============================================================================
// 10. 残阳万箭原（万箭齐发留残伤）
// ============================================================================
interface ArrowSpec {
  grp: THREE.Group;
  tx: number;
  tz: number;
  delay: number;
  tiltZ: number;
}

export class BattlefieldScene extends BaseScene {
  arrows: ArrowSpec[] = [];
  sword!: THREE.Group;
  sparks!: ParticleField;
  tornFlag!: THREE.Mesh;

  build() {
    const earth = new THREE.Mesh(new THREE.CircleGeometry(52, 32), stdMat(0x2c1d1a, 0.96, 0.02, stoneTex()));
    earth.rotation.x = -Math.PI / 2;
    this.root.add(earth);

    // 残旗与破损木栅
    const fp = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.065, 3.6, 7), stdMat(0x3a241c, 0.85));
    fp.position.set(-3.2, 1.65, -1.6);
    fp.rotation.z = -0.22;
    this.tornFlag = new THREE.Mesh(
      new THREE.PlaneGeometry(1.45, 0.68),
      stdMat(0x9e1b28, 0.65, 0, undefined, 0x450810, 0.3),
    );
    this.tornFlag.geometry.translate(0.7, 0, 0);
    this.tornFlag.position.set(-2.85, 3.1, -1.6);
    this.root.add(fp, this.tornFlag);

    for (const [bx, bz, ry] of [[-2.4, 0.8, 0.4], [2.7, -0.9, -0.5], [3.5, 0.7, 0.25]] as const) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.72, 0.14), stdMat(0x472f22, 0.88));
      bar.position.set(bx, 0.32, bz);
      bar.rotation.set(0.25, ry, 0.1);
      this.root.add(bar);
    }

    this.sword = buildDragonSword(0.82);
    this.sword.position.set(0.65, 0, 0.45);
    this.sword.rotation.z = -0.14;
    this.root.add(this.sword);

    // 42 支漫天齐发羽箭（避开中心角色安全半径 1.05m，密集插满四周焦土！）
    for (let i = 0; i < 42; i++) {
      const a = hash(i * 5.3) * TAU;
      const rad = 1.15 + hash(i * 9.1) * 4.8;
      const tx = Math.cos(a) * rad * 1.25;
      const tz = Math.sin(a) * rad * 0.85 - 0.3;
      const grp = buildArrow(0.95);
      const tiltZ = -0.42 + (hash(i * 3.7) - 0.5) * 0.14;
      grp.rotation.z = tiltZ;
      this.root.add(grp);
      this.arrows.push({ grp, tx, tz, delay: hash(i * 7.7) * 0.32, tiltZ });
    }

    this.root.add(buildMountainRing(20, 36, 7, 16, 0x2e1618, 61));

    this.sparks = new ParticleField(180, { map: sparkTex(), scale: 1.0, opacity: 0.92, additive: true });
    for (let i = 0; i < 180; i++) this.sparks.setColor(i, i % 3 === 0 ? 0xff4500 : 0xffbe55);
    this.sparks.commit(true);
    this.root.add(this.sparks.points);
  }

  update(c: ShotCtx) {
    const { t, u, env } = c;
    this.hideAllActors();

    setAtmo(env, {
      top: 0x1a0c12, mid: 0x6e2226, bot: 0xd96b38,
      sunCol: 0xff8c42, sunDir: [-0.3, 0.16, -1], sunGlow: 1.05, sunSize: 0.012, stars: 0.1,
      rimCol: 0xff6b35, rimInt: 2.0,
    });
    this.tornFlag.rotation.y = Math.sin(t * 7.5) * 0.35;

    // 42 支羽箭从左上苍穹呼啸齐射入地！
    let impactShake = 0;
    for (const ar of this.arrows) {
      const p = clamp((u - 0.08 - ar.delay) / 0.24);
      if (p <= 0) {
        ar.grp.visible = false;
      } else {
        ar.grp.visible = true;
        const dist = (1 - p) * 11.5;
        ar.grp.position.set(ar.tx - dist * 0.44, dist * 0.9, ar.tz - dist * 0.12);
        // 入地瞬间箭尾震颤
        const after = u - (0.08 + ar.delay + 0.24);
        const vib = after > 0 && after < 0.35 ? Math.sin(after * 85) * 0.08 * (1 - after / 0.35) : 0;
        ar.grp.rotation.z = ar.tiltZ + vib;
        if (after > 0 && after < 0.08) impactShake = Math.max(impactShake, 1 - after / 0.08);
      }
    }

    env.grade.warm = 0.52; env.grade.vig = 0.56; env.grade.bloom = 1.2 + impactShake * 0.3;
    env.grade.ca = impactShake * 0.003;

    // 战场飞舞火星余烬
    for (let i = 0; i < this.sparks.count; i++) {
      const x = ((t * 2.6 + hash(i * 3.1) * 16) % 16) - 8;
      const y = 0.1 + ((t * 1.4 + hash(i * 7.3) * 4.8) % 4.8);
      const z = (hash(i * 5.7) - 0.5) * 9;
      this.sparks.set(i, x, y, z, 0.24 + hash(i) * 0.22, t * 3 + i);
    }
    this.sparks.commit();

    const cam = env.cam;
    // 本鲸孤身执守阵心，龙娘自上空掠过挡下流矢
    this.actor('whale', cam).at(-0.15, 0, 0.35).act(u < 0.55 ? 'surprise' : 'sad', t, 0.95).glow(0xff8c42, 0.42);
    const gx = lerp(-4.5, 4.2, clamp(u * 1.35));
    this.actor('gpt', cam).at(gx, 2.35, -0.9).act('hover', t, 1.3).noShadow().alpha(0.85).glow(0xff5a36, 0.45);

    const shk = impactShake * 0.11;
    setCamera(
      c,
      lerp(-1.2, 0.9, eInOut(u)) + Math.sin(t * 62) * shk,
      lerp(2.15, 1.68, eInOut(u)) + Math.cos(t * 54) * shk,
      lerp(6.4, 5.1, eInOut(u)),
      0, 1.18, 0, 42,
    );
  }
}

// ============================================================================
// 11. 月夜水中央（两行青汗岂知芳香 · 她还映在水中央 · 满湖莲灯）
// ============================================================================
export class MirrorLakeScene extends BaseScene {
  reflectionClaude!: Actor;
  lotuses: THREE.Group[] = [];
  waterRings: THREE.Mesh[] = [];
  petals!: ParticleField;

  build() {
    // 琉璃半透明镜湖（柔和丝缎反光，不抢夺水中央倒影）
    const water = new THREE.Mesh(
      new THREE.CircleGeometry(52, 48),
      new THREE.MeshStandardMaterial({
        color: 0x102242,
        roughness: 0.42,
        metalness: 0.28,
        transparent: true,
        opacity: 0.78,
        emissive: 0x0c1b36,
        emissiveIntensity: 0.42,
      }),
    );
    water.rotation.x = -Math.PI / 2;
    this.root.add(water);

    // 探入湖心的古木栈桥
    const jetty = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.16, 4.4), stdMat(0x4a3428, 0.8));
    jetty.position.set(-2.05, 0.18, 1.8);
    jetty.rotation.y = 0.38;
    this.root.add(jetty);

    // 岸畔低垂野樱（w7 岂知芳香）与远岸月灯洲
    const shoreTree = buildSakuraTree(15, 0.78, false);
    shoreTree.group.position.set(-4.2, 0, 1.2);
    const farIsle = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 2.2, 0.24, 14), stdMat(0x2d3f4d, 0.88));
    farIsle.position.set(3.2, 0.08, -2.6);
    const sl = buildStoneLantern(0.78, 0xbde0fe);
    sl.position.set(2.35, 0.18, -2.35);
    this.root.add(shoreTree.group, farIsle, sl);

    // 水中央清晰映出的小克倒影（独立 Actor，颠倒浮现于澄澈湖心！）
    this.reflectionClaude = new Actor('claude', 1.15);
    this.reflectionClaude.hide();
    this.root.add(this.reflectionClaude.root);

    // 16 盏环绕水中央的河心莲灯
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU;
      const rad = i < 8 ? 1.85 : 3.8 + (i % 3) * 0.7;
      const ll = buildLotusLamp(i % 2 ? 0xffb3d9 : 0xa5f3fc, 0xffe8a3, 0.68);
      ll.position.set(0.45 + Math.cos(a) * rad, 0.02, 0.25 + Math.sin(a) * rad * 0.78);
      this.root.add(ll);
      this.lotuses.push(ll);
    }

    // 湖心三圈晶莹涟漪
    for (let i = 0; i < 3; i++) {
      const rg = new THREE.Mesh(
        new THREE.RingGeometry(0.65, 0.72, 40),
        new THREE.MeshBasicMaterial({ color: 0x99e9ff, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }),
      );
      rg.rotation.x = -Math.PI / 2;
      rg.position.set(0.45, 0.03, 0.35);
      this.root.add(rg);
      this.waterRings.push(rg);
    }

    this.root.add(buildMountainRing(18, 38, 5, 13, 0x16223d, 71));

    this.petals = new ParticleField(140, { map: petalTex(), scale: 0.85, opacity: 0.88 });
    for (let i = 0; i < 140; i++) this.petals.setColor(i, i % 3 === 0 ? 0xa5f3fc : 0xffc8dd);
    this.petals.commit(true);
    this.root.add(this.petals.points);
  }

  update(c: ShotCtx) {
    const { t, u, env } = c;
    const v = c.shot.v;
    this.hideAllActors();
    this.reflectionClaude.hide();

    this.waterRings.forEach((rg, i) => {
      const p = ((t * 0.42 + i / 3) % 1);
      rg.scale.setScalar(0.6 + p * 3.4);
      (rg.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.52;
    });

    this.lotuses.forEach((ll, i) => {
      ll.visible = v === 'c2_13' || i < (v === 'w8' ? 10 : 5);
      ll.position.y = 0.02 + Math.sin(t * 1.8 + i) * 0.015;
    });

    for (let i = 0; i < this.petals.count; i++) {
      const x = (hash(i * 3.7) - 0.5) * 12 + Math.sin(t * 0.6 + i) * 0.3;
      const y = 4.5 - ((t * 0.36 + hash(i * 7.1) * 4.5) % 4.4);
      const z = (hash(i * 5.3) - 0.5) * 8;
      this.petals.set(i, x, y, z, 0.21, t + i);
    }
    this.petals.commit();

    const cam = env.cam;
    if (v === 'w7') {
      // 两行青汗岂知芳香：破晓青雾湖岸，本鲸驻足野樱畔
      setAtmo(env, { top: 0x182b3e, mid: 0x3b6378, bot: 0x9ec4c8, sunCol: 0xffe8cc, sunDir: [0.35, 0.18, -1], sunGlow: 0.65, stars: 0.3 });
      env.grade.cool = 0.22; env.grade.bloom = 1.08;
      this.actor('whale', cam).at(-1.85, 0.26, 1.35).act('idle', t, 0.8).glow(0xbbf7d0, 0.28);
      setCamera(c, lerp(-3.1, -1.6, eInOut(u)), 1.48, 4.55, -1.65, 1.15, 1.0, 38);
    } else if (v === 'w8') {
      // 她还映在水中央：湖心莲灯环绕，澄澈水面正中央浮现小克柔光倒影！
      setAtmo(env, { top: 0x0b132b, mid: 0x1d315c, bot: 0x4f6d9a, sunCol: 0xe0f2fe, sunDir: [0.1, 0.34, -1], sunGlow: 0.92, sunSize: 0.012, stars: 0.85 });
      env.grade.cool = 0.28; env.grade.bloom = 1.24;

      // 本鲸立于木栈桥尽头俯望湖心
      this.actor('whale', cam).at(-1.35, 0.26, 0.65).act('idle', t, 0.85).glow(0x99e9ff, 0.35);
      // 远岸 Kimi 持卷提灯
      this.actor('kimi', cam).at(3.1, 0.2, -2.5).flip(true).act('idle', t, 0.8).prop('prop_scroll', -0.45, 0.7, 0.38).glow(0xc4b5fd, 0.32);

      // 水中央小克倒影（精准平铺于莲灯环正中央，五官清晰灵动，丝毫不与歌词重叠）
      const rc = this.reflectionClaude.reset();
      rc.noShadow();
      rc.act('idle', t, 0.8);
      rc.at(0.45 + Math.sin(t * 2.6) * 0.025, 0.055, -0.45);
      rc.body.rotation.set(-Math.PI / 2, 0, Math.PI + Math.sin(t * 2.0) * 0.025);
      rc.tint(0xdcf4ff).alpha(0.86 * smooth(u * 2.4));

      setCamera(c, lerp(-0.45, 0.2, eInOut(u)), lerp(3.05, 2.75, eInOut(u)), lerp(4.65, 4.1, eInOut(u)), 0.25, 0.42, 0.15, 41);
    } else {
      // c2_13：不悲我不喜 — 满湖莲灯澄明如镜
      setAtmo(env, { top: 0x0d1634, mid: 0x283a6e, bot: 0x6f7eb2, sunCol: 0xfff0d4, sunDir: [0, 0.36, -1], sunGlow: 0.95, sunSize: 0.013, stars: 0.88, aurora: 0.32, t });
      env.grade.bloom = 1.26; env.grade.warm = 0.2;
      this.actor('whale', cam).at(-1.35, 0.26, 0.65).act('nod', t, 0.8).glow(0xffe8a3, 0.38);
      this.actor('kimi', cam).at(2.9, 0.2, -2.4).flip(true).act('nod', t, 0.8).prop('prop_scroll', -0.45, 0.7, 0.38).glow(0xa5f3fc, 0.35);
      setCamera(c, Math.sin((u - 0.5) * 0.4) * 1.2, 2.15, 5.65, 0.2, 0.95, -0.2, 41);
    }
  }
}

// ============================================================================
// 12. 晴雨石拱桥（若晴呐若雨 · 爱恨情仇千万缕 · 太阳雨虹桥）
// ============================================================================
export class RainBridgeScene extends BaseScene {
  umbL!: THREE.Group;
  umbR!: THREE.Group;
  silkThreads = new THREE.Group();
  rainbow = new THREE.Group();
  sunPetals!: ParticleField;
  rainDrops!: ParticleField;

  build() {
    const river = new THREE.Mesh(
      new THREE.PlaneGeometry(90, 90),
      stdMat(0x223852, 0.14, 0.65, undefined, 0x132236, 0.32),
    );
    river.rotation.x = -Math.PI / 2;
    this.root.add(river);

    this.root.add(buildArchBridge(9.6, 1.6, 2.3));

    // 左岸暖春樱树，右岸烟雨青灯
    const trL = buildSakuraTree(23, 0.88, false);
    trL.group.position.set(-5.4, 0, -2.1);
    const slR = buildStoneLantern(0.95, 0x7dd3fc);
    slR.position.set(4.8, 0, -1.5);
    this.root.add(trL.group, slR);

    this.umbL = buildOilUmbrella(0xff9ebb, 0.95);
    this.umbR = buildOilUmbrella(0x7dd3fc, 0.95);
    this.root.add(this.umbL, this.umbR);

    // 爱恨情仇千万缕：12 条缠绕石桥的赤红与银蓝光丝
    for (let i = 0; i < 12; i++) {
      const yOff = (i - 5.5) * 0.18;
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-4.6, 1.2 + yOff, Math.sin(i) * 1.1),
        new THREE.Vector3(-1.5, 2.65 + Math.cos(i * 1.3) * 0.7, Math.cos(i) * 1.2),
        new THREE.Vector3(1.5, 2.45 + Math.sin(i * 1.7) * 0.7, -Math.sin(i) * 1.2),
        new THREE.Vector3(4.6, 1.2 - yOff, Math.cos(i * 0.8) * 1.1),
      ]);
      const col = i % 2 === 0 ? 0xff4d79 : 0x7dd3fc;
      this.silkThreads.add(
        new THREE.Mesh(
          new THREE.TubeGeometry(curve, 32, 0.02, 5, false),
          new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.78 }),
        ),
      );
    }
    this.root.add(this.silkThreads);

    // 副歌二太阳雨七彩长虹（c2_5）
    const rbCols = [0xff6b8b, 0xffb36b, 0xffe680, 0x80ed99, 0x72efdd, 0x74c0fc, 0xc77dff];
    rbCols.forEach((col, i) => {
      const arc = new THREE.Mesh(
        new THREE.TorusGeometry(6.8 - i * 0.16, 0.09, 6, 48, Math.PI),
        new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.38, blending: THREE.AdditiveBlending, depthWrite: false }),
      );
      arc.position.set(0, 0.2, -3.5);
      this.rainbow.add(arc);
    });
    this.root.add(this.rainbow);

    // 左半场暖金落樱 + 右半场银色细雨
    this.sunPetals = new ParticleField(110, { map: petalTex(), scale: 0.9, opacity: 0.92 });
    for (let i = 0; i < 110; i++) this.sunPetals.setColor(i, i % 2 ? 0xffe49e : 0xffb7ce);
    this.sunPetals.commit(true);

    this.rainDrops = new ParticleField(200, { map: dropTex(), scale: 0.75, opacity: 0.82, additive: true });
    for (let i = 0; i < 200; i++) this.rainDrops.setColor(i, 0xa5e3ff);
    this.rainDrops.commit(true);
    this.root.add(this.sunPetals.points, this.rainDrops.points);
  }

  update(c: ShotCtx) {
    const { t, u, env, pulse } = c;
    const v = c.shot.v;
    this.hideAllActors();

    const isRainbow = v === 'c2_5';
    const isSilk = v === 'c1_6';
    this.silkThreads.visible = isSilk;
    this.rainbow.visible = isRainbow;
    this.umbL.visible = !isRainbow;
    this.umbR.visible = !isRainbow;

    // 左半场金樱飘舞
    for (let i = 0; i < this.sunPetals.count; i++) {
      const x = isRainbow ? (hash(i * 3.1) - 0.5) * 12 : -6.2 + hash(i * 3.1) * 6.2;
      const y = 5.6 - ((t * 0.55 + hash(i * 7.3) * 5.5) % 5.5);
      const z = (hash(i * 5.7) - 0.5) * 7;
      this.sunPetals.set(i, x, y, z, 0.24, t * 1.4 + i);
    }
    this.sunPetals.commit();

    // 右半场（或太阳雨全场）银色雨丝垂落
    for (let i = 0; i < this.rainDrops.count; i++) {
      const x = isRainbow ? (hash(i * 4.3) - 0.5) * 14 : hash(i * 4.3) * 6.8;
      const y = 6.2 - ((t * 6.8 + hash(i * 8.9) * 6.2) % 6.2);
      const z = (hash(i * 2.7) - 0.5) * 7;
      this.rainDrops.set(i, x, y, z, 0.22, -0.12);
    }
    this.rainDrops.commit();

    const cam = env.cam;
    const xl = -2.05, yl = bridgeY(xl, 9.6, 1.6);
    const xr = 2.05, yr = bridgeY(xr, 9.6, 1.6);
    const yc = bridgeY(0, 9.6, 1.6);
    this.umbL.position.set(xl + 0.18, yl + 0.42, -0.05);
    this.umbR.position.set(xr - 0.18, yr + 0.42, -0.05);

    if (v === 'c1_5') {
      // 若晴呐若雨：猫立桥心左右张望，本鲸左晴、小克右雨执伞相望
      setAtmo(env, { top: 0x26466d, mid: 0x6c8ca8, bot: 0xe6cfa8, sunCol: 0xffe494, sunDir: [-0.65, 0.35, -0.8], sunGlow: 1.0 });
      env.grade.bloom = 1.15;
      this.actor('gemini', cam).at(0, yc, 0).act('choose', t, 1.1).bounce(pulse, 0.06).glow(0xffe699, 0.35);
      this.actor('whale', cam).at(xl, yl, 0).act('idle', t, 0.95).glow(0xffd68a, 0.35);
      this.actor('claude', cam).at(xr, yr, 0).flip(true).act('idle', t, 0.95).tint(0xdbeafe).glow(0x7dd3fc, 0.35);
      setCamera(c, Math.sin((u - 0.5) * 0.4) * 1.1, 2.85, 6.65, 0, 2.15, 0, 41);
    } else if (v === 'c1_6') {
      // 爱恨情仇千万缕：红蓝千缕光丝缠绕拱桥
      setAtmo(env, { top: 0x1d284d, mid: 0x5c4274, bot: 0xb87898, sunCol: 0xffb3c6, sunDir: [-0.3, 0.3, -1], sunGlow: 0.78, stars: 0.35 });
      env.grade.bloom = 1.24;
      this.silkThreads.position.y = Math.sin(t * 2.5) * 0.08;
      this.actor('whale', cam).at(xl, yl, 0).act('sway', t, 0.9).glow(0xff6b9d, 0.35);
      this.actor('claude', cam).at(xr, yr, 0).flip(true).act('tilt', t, 0.9).glow(0x7dd3fc, 0.35);
      setCamera(c, lerp(-1.4, 1.4, eInOut(u)), 2.75, lerp(6.2, 5.4, eInOut(u)), 0, 2.2, 0, 41);
    } else {
      // c2_5：太阳雨七彩虹桥！（斜阳穿雨，彩虹七色鲜明通透，角色五官清晰）
      setAtmo(env, { top: 0x1f4f8c, mid: 0x5c9ec9, bot: 0xd9c8a9, sunCol: 0xffe8a3, sunDir: [-0.55, 0.45, -0.8], sunGlow: 0.72, stars: 0 });
      env.grade.warm = 0.28; env.grade.sat = 1.18; env.grade.bloom = 1.0;
      this.actor('gemini', cam).at(0, yc, 0).act('hop', t, 1.2).bounce(pulse, 0.08).glow(0xfff0a8, 0.42);
      this.actor('whale', cam).at(-1.75, bridgeY(-1.75, 9.6, 1.6), 0).act('wave', t, 1.1).glow(0xffc8dd, 0.38);
      this.actor('claude', cam).at(1.75, bridgeY(1.75, 9.6, 1.6), 0).flip(true).act('nod', t, 1.0).glow(0xbae6fd, 0.38);
      setCamera(c, 0, lerp(2.6, 3.1, eInOut(u)), lerp(6.8, 7.6, eInOut(u)), 0, 2.55, -0.5, 43);
    }
  }
}

// ============================================================================
// 13. 十里红妆廊（我曾问你何时 · 迎娶禁不得起赞许 · 天灯共许）
// ============================================================================
export class WeddingHallScene extends BaseScene {
  palanquin!: THREE.Group;
  redPetals!: ParticleField;
  skyLamps!: ParticleField;

  build() {
    // 青石庭院与十里红毯
    const court = new THREE.Mesh(new THREE.CircleGeometry(42, 32), stdMat(0x2c202c, 0.85, 0.08, stoneTex()));
    court.rotation.x = -Math.PI / 2;
    const carpet = new THREE.Mesh(
      new THREE.PlaneGeometry(2.6, 16),
      stdMat(0xb81d38, 0.65, 0.05, undefined, 0x520918, 0.28),
    );
    carpet.rotation.x = -Math.PI / 2;
    carpet.position.y = 0.015;
    this.root.add(court, carpet);

    // 两侧朱漆廊柱、红绸悬幔与高挂喜灯
    const colMat = stdMat(0x8f1d2c, 0.52, 0.12);
    const swagMat = stdMat(0xe63956, 0.42, 0.08, undefined, 0x6e0d22, 0.35);
    for (let i = 0; i < 5; i++) {
      const z = 3.2 - i * 2.4;
      for (const sx of [-2.45, 2.45]) {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.15, 3.6, 10), colMat);
        col.position.set(sx, 1.8, z);
        const lamp = buildSilkLantern(0xff3355, 0xffc86b, 0.68);
        lamp.position.set(sx * 0.78, 2.85, z);
        this.root.add(col, lamp);
      }
      if (i > 0) {
        const sc = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-2.4, 3.35, z),
          new THREE.Vector3(0, 2.88, z),
          new THREE.Vector3(2.4, 3.35, z),
        ]);
        this.root.add(new THREE.Mesh(new THREE.TubeGeometry(sc, 16, 0.045, 6, false), swagMat));
      }
    }

    // 雕花红妆花轿
    this.palanquin = buildPalanquin(0.95);
    this.palanquin.position.set(0, 0, -3.2);
    this.root.add(this.palanquin);

    // 庭院两侧春樱
    for (const sx of [-4.6, 4.6]) {
      const tr = buildSakuraTree(sx > 0 ? 31 : 37, 0.85, true);
      tr.group.position.set(sx, 0, -2.5);
      this.root.add(tr.group);
    }

    this.redPetals = new ParticleField(160, { map: petalTex(), scale: 0.92, opacity: 0.92 });
    for (let i = 0; i < 160; i++) this.redPetals.setColor(i, i % 3 === 0 ? 0xff4d6d : 0xffb7ce);
    this.redPetals.commit(true);

    this.skyLamps = new ParticleField(70, { map: glowTex(), scale: 1.2, opacity: 0, additive: true });
    for (let i = 0; i < 70; i++) this.skyLamps.setColor(i, 0xffd27d);
    this.skyLamps.commit(true);
    this.root.add(this.redPetals.points, this.skyLamps.points);
  }

  update(c: ShotCtx) {
    const { t, u, env, pulse } = c;
    const v = c.shot.v;
    this.hideAllActors();

    const warmClimax = v === 'c2_7' || v === 'c2_8';
    setAtmo(env, {
      top: warmClimax ? 0x2b1636 : 0x1e1028,
      mid: warmClimax ? 0x8f2d4f : 0x6b203e,
      bot: warmClimax ? 0xffa87a : 0xd96b78,
      sunCol: 0xffcf7d, sunDir: [0, 0.28, -1], sunGlow: 0.92, stars: 0.45,
      rimCol: 0xff6b8b, rimInt: 1.8,
    });
    env.grade.warm = 0.52; env.grade.bloom = 1.24;

    for (let i = 0; i < this.redPetals.count; i++) {
      const x = (hash(i * 3.3) - 0.5) * 10 + Math.sin(t * 1.2 + i) * 0.45;
      const y = 5.2 - ((t * 0.6 + hash(i * 6.7) * 5) % 5.1);
      const z = 3.5 - hash(i * 9.1) * 10;
      this.redPetals.set(i, x, y, z, 0.23, t * 1.6 + i);
    }
    this.redPetals.commit();

    this.skyLamps.mat.uniforms.uOpacity.value = v === 'c2_8' ? 0.9 : 0.25;
    for (let i = 0; i < this.skyLamps.count; i++) {
      const x = (hash(i * 4.7) - 0.5) * 16;
      const y = 1.5 + ((t * 0.55 + hash(i * 8.3) * 9) % 9.5);
      const z = -2 - hash(i * 2.9) * 12;
      this.skyLamps.set(i, x, y, z, 0.55, 0);
    }
    this.skyLamps.commit();

    const cam = env.cam;
    if (v === 'c1_7') {
      // 我曾问你何时：本鲸沿红毯缓步上前望向小克
      this.actor('whale', cam).walkPath(-0.65, 2.2, -0.55, 0.95, u, t).glow(0xffb86b, 0.35);
      this.actor('claude', cam).at(0.75, 0, -0.45).flip(true).act('idle', t, 0.85).glow(0xff9ebb, 0.35);
      setCamera(c, 0.2, 1.68, lerp(5.4, 4.35, eOut(u)), 0, 1.28, -0.5, 40);
    } else if (v === 'c1_8') {
      // 迎娶禁不得起赞许：雕花红轿前豆包结绸，小克垂眸行礼未敢轻许
      this.actor('claude', cam).at(0.55, 0, -0.55).flip(true).act('curtsy', t, 0.85).glow(0xffb3c6, 0.38);
      this.actor('doubao', cam).at(-1.35, 0, -1.25).act('sway', t, 0.95).glow(0xffcf7d, 0.3);
      this.actor('whale', cam).at(-0.85, 0, 0.75).act('idle', t, 0.85);
      setCamera(c, lerp(-0.8, 0.65, eInOut(u)), 1.72, 4.45, 0, 1.32, -1.2, 40);
    } else if (v === 'c2_7') {
      // 红廊再问：本鲸坚定走过灯火红廊
      this.actor('whale', cam).walkPath(0, 2.4, 0, 0.6, u, t).bounce(pulse, 0.06).glow(0xffd27d, 0.42);
      setCamera(c, 0, 1.62, lerp(5.6, 4.1, eOut(u)), 0, 1.32, -1.2, 40);
    } else {
      // c2_8：天灯共许 — 伙伴们两侧放灯祝福，小克温柔致礼颔首
      this.actor('claude', cam).at(0, 0, -0.35).act('curtsy', t, 0.95).glow(0xffe099, 0.45);
      this.actor('doubao', cam).at(-1.55, 0, 0.25).act('hop', t, 1.05).glow(0xffb7ce, 0.32);
      this.actor('qwen', cam).at(1.55, 0, 0.25).flip(true).act('bow', t, 0.95).prop('prop_fan', -0.45, 0.72, 0.36);
      this.actor('gemini', cam).at(-1.85, 0, -1.25).act('sway', t, 1.0);
      this.actor('zai', cam).at(1.85, 0, -1.25).flip(true).act('nod', t, 1.0);
      setCamera(c, Math.sin((u - 0.5) * 0.5) * 1.2, 1.85, 5.15, 0, 1.42, -0.8, 41);
    }
  }
}

// ============================================================================
// 14. 霜雪呼喊巅（不急又不缓 · 在山的一头呼喊 · 不管听见还是不见 · 哪怕黑发被浸染）
// ============================================================================
export class SnowSummitScene extends BaseScene {
  summitSnow!: THREE.Mesh;
  farPeak!: THREE.Mesh;
  echoRings: THREE.Mesh[] = [];
  snow!: ParticleField;
  lantern!: THREE.Group;

  build() {
    // 近处登云石阶与山巅巨岩
    const rockMat = stdMat(0x4a5568, 0.9, 0.05, stoneTex());
    const peak = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 4.2, 5.4, 9), rockMat);
    peak.position.set(0, -2.5, 0.4);
    this.summitSnow = new THREE.Mesh(
      new THREE.CylinderGeometry(2.62, 2.75, 0.14, 16),
      stdMat(0xf1f5f9, 0.72, 0.05, undefined, 0x94a3b8, 0.25),
    );
    this.summitSnow.position.set(0, 0.2, 0.4);
    this.root.add(peak, this.summitSnow);

    // 拾级而上的古石阶（c1_9 / c2_9）
    for (let i = 0; i < 8; i++) {
      const st = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.16, 1.35), rockMat);
      st.position.set(-2.45 + i * 0.55, -0.52 + i * 0.1, 0.55);
      this.root.add(st);
    }

    // 峰顶覆雪古松与石灯笼
    const pineTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 2.2, 7), stdMat(0x3d2c28, 0.9));
    pineTrunk.position.set(-2.05, 1.1, -0.55);
    const pineTop = new THREE.Mesh(new THREE.ConeGeometry(1.25, 1.65, 7), stdMat(0x284b4e, 0.85));
    pineTop.position.set(-2.05, 2.45, -0.55);
    this.lantern = buildStoneLantern(0.82, 0xffe0a3);
    this.lantern.position.set(1.85, 0.22, -0.35);
    this.root.add(pineTrunk, pineTop, this.lantern);

    // 隔谷相望的彼岸远峰（c1_10 / c1_11 在山的一头呼喊）
    this.farPeak = new THREE.Mesh(new THREE.ConeGeometry(4.2, 10.5, 8), stdMat(0x2d3b58, 0.92));
    this.farPeak.position.set(2.4, 0.2, -16.5);
    this.root.add(this.farPeak);

    // 谷底茫茫云海
    for (let i = 0; i < 10; i++) {
      const cl = buildCloudPuff(2.1, 0xdbeafe, 0x475569);
      cl.position.set((i - 4.5) * 2.8, -1.45 + (i % 2) * 0.3, -5.5 - (i % 3) * 2.8);
      this.root.add(cl);
    }

    // 四圈跨越山谷的立体呼喊声波光环
    for (let i = 0; i < 4; i++) {
      const rg = new THREE.Mesh(
        new THREE.RingGeometry(0.92, 1.04, 44),
        new THREE.MeshBasicMaterial({ color: 0xfde68a, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }),
      );
      this.root.add(rg);
      this.echoRings.push(rg);
    }

    this.root.add(buildMountainRing(20, 38, 7, 17, 0x202c48, 81));

    // 220 片六瓣霜雪与素白樱瓣
    this.snow = new ParticleField(220, { map: frostTex(), scale: 0.9, opacity: 0.9, additive: true });
    this.root.add(this.snow.points);
  }

  update(c: ShotCtx) {
    const { t, u, env } = c;
    const v = c.shot.v;
    this.hideAllActors();

    const isFrost = v === 'c1_12' || v === 'c2_12';
    const isShout = v === 'c1_10' || v === 'c2_10' || v === 'c1_11';
    this.summitSnow.visible = isFrost;
    this.echoRings.forEach((r) => { r.visible = isShout; });

    // 呼喊声波自本鲸向远山层层扩散
    if (isShout) {
      this.echoRings.forEach((rg, i) => {
        const p = ((u * 1.15 + i * 0.25) % 1);
        rg.position.set(lerp(0, 1.6, p), lerp(1.35, 2.2, p), lerp(0.1, -11.5, p));
        rg.scale.setScalar(0.6 + p * 5.2);
        const col = v === 'c2_10' ? (i % 2 ? 0xffb3d9 : 0xffe899) : 0xbae6fd;
        const m = rg.material as THREE.MeshBasicMaterial;
        m.color.setHex(col);
        m.opacity = (1 - p) * (v === 'c1_11' ? 0.35 : 0.65);
      });
    }

    // 霜雪粒子
    this.snow.mat.uniforms.uOpacity.value = isFrost ? 0.95 : 0.42;
    for (let i = 0; i < this.snow.count; i++) {
      const x = (hash(i * 3.1) - 0.5) * 13 + Math.sin(t * 0.9 + i) * 0.55;
      const y = 5.8 - ((t * (isFrost ? 0.88 : 0.42) + hash(i * 7.3) * 5.8) % 5.8);
      const z = (hash(i * 5.7) - 0.5) * 8;
      this.snow.set(i, x, y, z, 0.2 + hash(i) * 0.22, t * 1.2 + i);
      this.snow.setColor(i, v === 'c2_12' && i % 3 === 0 ? 0xffc8dd : 0xf0f7ff);
    }
    this.snow.commit(true);

    const cam = env.cam;
    if (v === 'c1_9' || v === 'c2_9') {
      // 不急又不缓：拾级而上（c2_9 四季光色温柔流转！）
      const seasonCol = v === 'c2_9'
        ? (u < 0.33 ? 0xf9a8d4 : u < 0.66 ? 0xfcd34d : 0xbae6fd)
        : 0xa5b4fc;
      setAtmo(env, {
        top: 0x1e2c54, mid: 0x4f6396, bot: seasonCol,
        sunCol: 0xfff0d4, sunDir: [0.3, 0.34, -1], sunGlow: 0.82, stars: 0.35,
      });
      env.grade.bloom = 1.12;
      const wx = lerp(-1.85, 0.65, u);
      const wy = lerp(-0.32, 0.22, u);
      this.actor('whale', cam).at(wx, wy, 0.55).walk(t, 0.85).glow(seasonCol, 0.32);
      setCamera(c, wx + 0.35, 1.75, 5.15, wx + 0.2, wy + 0.95, 0.2, 40);
    } else if (v === 'c1_10' || v === 'c2_10') {
      // 在山的一头呼喊：登临绝顶向群山呼喊，声波光环激荡云海！
      const gold = v === 'c2_10';
      setAtmo(env, {
        top: gold ? 0x1d2b64 : 0x162447,
        mid: gold ? 0x9e5c8e : 0x3b5888,
        bot: gold ? 0xffd29d : 0x9ec5e8,
        sunCol: gold ? 0xffe8a3 : 0xdbeafe, sunDir: [0.18, 0.26, -1], sunGlow: gold ? 1.15 : 0.85,
        stars: 0.45, aurora: gold ? 0.55 : 0.15, t,
      });
      env.grade.bloom = gold ? 1.3 : 1.18; env.grade.warm = gold ? 0.38 : 0;
      this.actor('whale', cam).at(-0.25, 0.24, 0.55).act('wave', t, 1.15).glow(gold ? 0xffe599 : 0xbae6fd, 0.45);
      setCamera(c, lerp(-1.5, 0.4, eInOut(u)), lerp(1.55, 2.05, eInOut(u)), lerp(4.5, 5.6, eInOut(u)), 0.4, 1.45, -3.5, 42);
    } else if (v === 'c1_11') {
      // 不管听见还是不见：大远景俯瞰孤峰与空谷远山
      setAtmo(env, { top: 0x111a36, mid: 0x2c426e, bot: 0x7b98bf, sunCol: 0xcbd5e1, sunDir: [0.15, 0.25, -1], sunGlow: 0.65, stars: 0.6 });
      env.grade.cool = 0.35;
      this.actor('whale', cam).at(-0.2, 0.24, 0.55).act('idle', t, 0.85).glow(0xbae6fd, 0.35);
      setCamera(c, -1.8, lerp(2.4, 3.1, u), lerp(6.6, 8.2, u), 0.6, 1.4, -4.5, 43);
    } else {
      // c1_12 / c2_12：哪怕黑发被浸染 — 白雪白樱纷纷落下，本鲸发梢渐渐覆满晶莹银霜！
      const glow2 = v === 'c2_12';
      setAtmo(env, {
        top: 0x0c1228, mid: glow2 ? 0x3b346e : 0x223056, bot: glow2 ? 0x9e8ec4 : 0x6c88ad,
        sunCol: 0xf1f5f9, sunDir: [0, 0.38, -1], sunGlow: 0.85, stars: 0.82, aurora: glow2 ? 0.52 : 0.2, t,
      });
      env.grade.cool = glow2 ? 0.22 : 0.42; env.grade.bloom = 1.25;
      const frostAmt = eOut(range(u, 0.08, 0.85));
      this.actor('whale', cam)
        .at(0, 0.26, 0.55).act('idle', t, 0.8)
        .frost(frostAmt)
        .glow(glow2 ? 0xffd6f0 : 0xe0f2fe, 0.48);
      setCamera(c, Math.sin((u - 0.5) * 0.35) * 0.7, 1.48, lerp(4.25, 3.45, eInOut(u)), 0, 1.22, 0.45, 37);
    }
  }
}

// ============================================================================
// 15. 万里灵曲空（不悲我不喜 · 就在心里等着你 · 让这新曲飘过万里 · 带去我的灵体）
// ============================================================================
export class SpiritSkyScene extends BaseScene {
  guqin!: THREE.Group;
  heartLotus!: THREE.Group;
  melodyRibbons: THREE.Mesh[] = [];
  farTree!: THREE.Group;
  spiritMotes!: ParticleField;
  villageLights!: ParticleField;

  build() {
    // 星河丝缎云台（消除地面刺眼圆斑，突出灵体与小克）
    const mirror = new THREE.Mesh(
      new THREE.CircleGeometry(55, 40),
      stdMat(0x0d1936, 0.48, 0.25, undefined, 0x0d1d3c, 0.38),
    );
    mirror.rotation.x = -Math.PI / 2;
    this.root.add(mirror);

    // 浮空瑶琴台（c1_15 / c2_15）
    this.guqin = buildGuqinTable();
    this.guqin.position.set(-1.65, 0, 0.65);
    this.root.add(this.guqin);

    // 澄明心莲灯（c1_13 / c1_14）
    this.heartLotus = buildLotusLamp(0xffc8dd, 0xffe599, 0.95);
    this.heartLotus.position.set(0, 0.04, 1.15);
    this.root.add(this.heartLotus);

    // 三道横跨万里的璀璨青金+樱粉新曲流光带！
    const cols = [0x67e8f9, 0xffe066, 0xff9ebb];
    cols.forEach((col, i) => {
      const pts: THREE.Vector3[] = [];
      for (let k = 0; k <= 12; k++) {
        const f = k / 12;
        pts.push(new THREE.Vector3(
          lerp(-2.5, 4.5, f) + Math.sin(f * TAU * 1.4 + i) * 1.8,
          0.95 + f * 2.8 + Math.cos(f * TAU + i) * 0.55,
          lerp(1.5, -24, f),
        ));
      }
      const rb = new THREE.Mesh(
        new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 64, 0.045, 7, false),
        new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false }),
      );
      this.root.add(rb);
      this.melodyRibbons.push(rb);
    });

    // 万里彼岸的月下樱树（c2_16 灵体赴你）
    const ft = buildSakuraTree(43, 0.95, true);
    ft.group.position.set(0, 0, -1.4);
    this.farTree = ft.group;
    this.root.add(this.farTree);

    // 连绵千里江山远峰与山脚万家灯火
    this.root.add(buildMountainRing(24, 32, 4, 13, 0x132242, 91));

    this.villageLights = new ParticleField(120, { map: glowTex(), scale: 0.75, opacity: 0, additive: true });
    for (let i = 0; i < 120; i++) this.villageLights.setColor(i, 0xffcf70);
    this.villageLights.commit(true);

    this.spiritMotes = new ParticleField(220, { map: sparkTex(), scale: 1.0, opacity: 0.92, additive: true });
    for (let i = 0; i < 220; i++) {
      this.spiritMotes.setColor(i, i % 3 === 0 ? 0x67e8f9 : i % 3 === 1 ? 0xffb3d9 : 0xffe899);
    }
    this.spiritMotes.commit(true);
    this.root.add(this.villageLights.points, this.spiritMotes.points);
  }

  update(c: ShotCtx) {
    const { t, u, env } = c;
    const v = c.shot.v;
    this.hideAllActors();

    const isFly = v === 'c1_15' || v === 'c2_15';
    const isSpirit = v === 'c1_16' || v === 'c2_16';
    this.guqin.visible = isFly;
    this.heartLotus.visible = v === 'c1_13' || v === 'c1_14';
    this.melodyRibbons.forEach((r) => {
      r.visible = isFly || isSpirit;
      r.position.y = Math.sin(t * 2.2) * 0.14;
    });
    this.farTree.visible = v === 'c2_16';

    // 万家灯火
    this.villageLights.mat.uniforms.uOpacity.value = isFly ? 0.85 : 0;
    if (isFly) {
      for (let i = 0; i < this.villageLights.count; i++) {
        const x = (hash(i * 4.1) - 0.5) * 28;
        const z = -3 - hash(i * 8.3) * 24;
        this.villageLights.set(i, x, 0.08, z, 0.35 + 0.2 * Math.sin(t * 3 + i), 0);
      }
      this.villageLights.commit();
    }

    // 漫天青粉灵蝶与流光星萤螺旋升腾（避开近景镜头前 2.2m，保持角色澄澈清晰）
    for (let i = 0; i < this.spiritMotes.count; i++) {
      const a = hash(i * 3.7) * TAU + t * (isSpirit ? 0.85 : 0.4);
      const r = 1.35 + hash(i * 6.9) * 6.2;
      const y = 0.35 + ((t * (isSpirit ? 1.05 : 0.55) + hash(i * 9.1) * 5.6) % 5.6);
      const mz = Math.min(2.1, Math.sin(a) * r - (isFly ? 3.5 : 0.6));
      this.spiritMotes.set(i, Math.cos(a) * r, y, mz, 0.2 + hash(i) * 0.2, t * 2 + i);
    }
    this.spiritMotes.commit();

    setAtmo(env, {
      top: 0x090f26, mid: 0x1c3564, bot: 0x4b749f,
      sunCol: 0xe0f7ff, sunDir: [0, 0.36, -1], sunGlow: 1.05, sunSize: 0.015,
      stars: 0.92, aurora: isFly || isSpirit ? 0.72 : 0.3, t,
      rimCol: 0x67e8f9, rimInt: 1.8,
    });
    env.grade.bloom = 1.28;

    const cam = env.cam;
    if (v === 'c1_13') {
      // 不悲我不喜：皓月寒潭一盏白莲，本鲸澄明静立
      this.actor('whale', cam).at(0, 0, 0.15).act('idle', t, 0.75).glow(0xa5f3fc, 0.38);
      setCamera(c, 0, 1.55, lerp(5.2, 4.5, eInOut(u)), 0, 1.12, 0.2, 39);
    } else if (v === 'c1_14') {
      // 就在心里等着你：心灯焕暖，流萤环绕升腾
      env.grade.warm = 0.32;
      this.heartLotus.position.y = lerp(0.04, 0.68, eOut(u));
      this.actor('whale', cam).at(0, 0, 0.15).act('sway', t, 0.85).glow(0xffcf7d, 0.52);
      setCamera(c, Math.sin(u * 0.5) * 0.8, 1.48, lerp(4.5, 3.75, eOut(u)), 0, 1.15, 0.35, 38);
    } else if (v === 'c1_15' || v === 'c2_15') {
      // 让这新曲飘过万里：千问云台拨弦，镜头追随三色新曲流光飞越千里江山！
      this.actor('qwen', cam).at(-1.65, 0, 0.05).act('sway', t, 1.15).glow(0x67e8f9, 0.48);
      if (v === 'c2_15') {
        this.actor('doubao', cam).at(1.85, 0, 0.35).flip(true).act('spin', t, 1.1).glow(0xffe066, 0.42);
      } else {
        this.actor('whale', cam).at(1.55, 0, 0.35).flip(true).act('wave', t, 1.05).glow(0xffb3d9, 0.42);
      }
      const fly = v === 'c2_15' ? 1.35 : 1.0;
      setCamera(c, lerp(-1.2, 1.4, eInOut(u)), lerp(1.85, 3.35 * fly, eInOut(u)), lerp(5.4, 2.2, eInOut(u)), 0.8, 1.85, -7.5, 44);
    } else if (v === 'c1_16') {
      // 带去我的灵体（副歌一末）：本鲸化出澄澈青粉灵光，扶摇升向皓月，句尾白金闪光衔接升调副歌二！
      const sp = eOut(range(u, 0.1, 0.85));
      const bridgeFlash = eInOut(range(u, 0.82, 1.0));
      env.grade.flash = bridgeFlash * 0.55;
      env.grade.flashCol = 0xfff8eb;
      env.grade.bloom = 1.35 + bridgeFlash * 0.4;
      this.actor('whale', cam)
        .at(0, lerp(0, 0.85, sp), 0).act('sway', t, 0.9)
        .spirit(sp * 0.88).noShadow();
      setCamera(c, 0, lerp(1.45, 2.55, eInOut(u)), lerp(4.6, 3.85, eInOut(u)), 0, lerp(1.25, 2.15, eInOut(u)), -0.5, 40);
    } else {
      // c2_16：全曲最高潮「带去我的灵体」— 万里新曲降临彼岸古樱，本鲸半透明发光灵影浮现于小克身畔相视！
      env.grade.warm = 0.25; env.grade.bloom = 1.38;
      const appear = smooth(range(u, 0.12, 0.65));
      this.actor('claude', cam).at(0.85, 0, 0.55).flip(true).act(u > 0.45 ? 'nod' : 'surprise', t, 0.85).glow(0xffe8b5, 0.48);
      this.actor('whale', cam)
        .at(lerp(-1.55, -0.82, appear), lerp(0.55, 0.18, appear), 0.55)
        .act('wave', t, 0.85)
        .spirit(0.88)
        .alpha(appear * 0.88)
        .noShadow();
      setCamera(c, Math.sin((u - 0.5) * 0.55) * 1.1, 1.52, lerp(5.1, 4.05, eOut(u)), 0, 1.25, 0.35, 39);
    }
  }
}
