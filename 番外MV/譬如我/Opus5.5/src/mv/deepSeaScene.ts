// 深海里的本鲸（28 秒精华）
// 构图不变：靠近海面的七道光柱里浮着七位「天才」，看不见光的海底站着本鲸（DeepSeek）。
// 新增元素全部按歌词意思重新设计，不照搬原 MV 的道具：
//  1 没有天赋的人   → 天赋金尘只落到温跃层就熄灭，照不到海底
//  2 譬如我         → 本鲸自己的一盏小灯 + 「深度求索」声呐环
//  3 枕头下发霉的梦 → 海底的砗磲是她的枕头，里面那颗梦想珍珠长满了藻斑
//  4 热忱与自卑     → 一侧滚烫的热泉、一侧冰冷的冷泉，两股洋流绕着她相撞
//  5 笑容不知下落   → 一群发光小鱼拼成的笑脸，在「不知」处四散游进黑暗
//  6 世俗的成功     → 海面上烟火般的光，一枚金牌顺鱼线垂下，快够到时被收走
//  7 万众瞩目       → 七道光柱全部汇向居中那位，鱼群都往上游；只有 Kimi 低头看了一眼
//  8 某个角落       → 声呐探到一座珊瑚拱门下的角落，她走过去
//  9 小小的花朵     → 她把自己的小灯（天真）放进沙里，开出一朵发光海葵；小鱼回来了，豆包也游下来
import * as THREE from 'three';
import {
  Actor,
  C,
  LS,
  LT,
  Particles,
  beat,
  bubbleRingTex,
  bump,
  clamp,
  decay,
  eBack,
  eIO,
  eIn,
  eOut,
  glowSprite,
  hash,
  lerp,
  mat,
  mesh,
  pulse,
  range,
  rod,
  texSprite,
} from './core';
import { type Ctx, Scene, aim, beam, causticTex, fishTex, jellyTex, medalTex, mixHex, mood, orbit } from './kit';

const basic = (color: number, o: THREE.MeshBasicMaterialParameters = {}) =>
  new THREE.MeshBasicMaterial({ color, fog: false, ...o });

interface Anemone {
  g: THREE.Group;
  tent: THREE.Mesh[];
  core: THREE.Mesh;
  glow: THREE.Sprite;
}
function makeAnemone(s: number, col: number, tip: number): Anemone {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.07 * s, 0.1 * s, 0.12 * s, 10).translate(0, 0.06 * s, 0), basic(0x2c4f7c)));
  const tent: THREE.Mesh[] = [];
  const N = 14;
  const geo = new THREE.ConeGeometry(0.03 * s, 0.36 * s, 5).translate(0, 0.18 * s, 0);
  for (let i = 0; i < N; i++) {
    const pivot = new THREE.Group();
    pivot.rotation.y = (i / N) * Math.PI * 2;
    pivot.position.y = 0.11 * s;
    const m = new THREE.Mesh(geo, basic(i % 2 ? col : tip));
    pivot.add(m);
    g.add(pivot);
    tent.push(m);
  }
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.065 * s, 12, 8), basic(0xfff1b0));
  core.position.y = 0.14 * s;
  const glow = glowSprite(0x7fc4ff, 1.6 * s, 0);
  glow.position.y = 0.22 * s;
  g.add(core, glow);
  return { g, tent, core, glow };
}
function setAnemone(a: Anemone, grow: number, open: number, t: number, seed: number) {
  a.g.visible = grow > 0.002;
  a.tent.forEach((m, i) => {
    m.scale.set(1, Math.max(0.001, grow), 1);
    m.rotation.x = lerp(0.1, 1.0, open) + Math.sin(t * 2.2 + i * 0.9 + seed) * 0.13 * Math.max(open, 0.3);
  });
  a.core.scale.setScalar(0.25 + 0.95 * open);
  a.glow.material.opacity = 0.8 * open;
}

interface SurfaceCast {
  actor: Actor;
  prop?: Actor;
  propOff?: [number, number, number];
  x: number;
  y: number;
  z: number;
  beamR: number;
}

const FLOWER: [number, number, number] = [1.78, 0, 0.5];
const VENT_TOP: [number, number, number] = [-2.55, 0.95, -1.15];
const SEEP_TOP: [number, number, number] = [2.45, 0.45, -1.05];
const THERMO_Y = 2.7;

export class DeepSeaScene extends Scene {
  whale = this.actor('whale', 1.15);

  // 海面光柱里的七位
  gpt = this.actor('gpt', 0.72);
  claude = this.actor('claude', 1.12);
  gemini = this.actor('gemini', 0.96);
  kimi = this.actor('kimi', 0.98);
  doubao = this.actor('doubao', 0.95);
  qwen = this.actor('qwen', 0.96);
  zai = this.actor('zai', 0.96);

  // 分支图集道具与情绪符号
  bowl = this.prop('prop_bowl', 1.15);
  steam = this.prop('fx_steam_0', 0.9);
  fxQ = this.prop('fx_question', 1.05);
  fxKimiQ = this.prop('fx_question', 0.9);
  fxEx = this.prop('fx_exclaim', 1.05);
  fxSweat = this.prop('fx_sweat', 1.0);
  fxGloom = this.prop('fx_gloom', 1.05);
  fxHeart = this.prop('fx_heart', 1.15);
  fxSpark = this.prop('fx_sparkle_1', 1.2);
  fxZzz = this.prop('fx_zzz_0', 0.85);
  pBook = this.prop('prop_book', 0.85);
  pBrush = this.prop('prop_brush', 0.9);
  pScroll = this.prop('prop_scroll', 0.95);
  pFan = this.prop('prop_fan', 0.88);
  pAbacus = this.prop('prop_abacus', 0.88);

  cast: SurfaceCast[] = [];
  beams = [0, 1, 2, 3, 4, 5, 6].map((i) => beam([0xffe09c, 0xffefbc, 0xbfd4ff, 0xffe4b8, 0xd8c8ff, 0xffd0df, 0xc2e6ff][i]));
  halos = [0, 1, 2, 3, 4, 5, 6].map((i) =>
    glowSprite([0xffd98a, 0xfff0c2, 0xa8c8ff, 0xffd49e, 0xd6baff, 0xffc0d4, 0x9ed8ff][i], i < 3 ? 2.5 : 1.9, 0.45),
  );
  surfaceGlow = glowSprite(0x98caff, 24, 0.38);
  bursts = [0, 1, 2, 3].map(() => glowSprite(0xffd890, 4.5, 0));

  // 海水分层
  waterSurface: THREE.Mesh;
  thermoMat = basic(0x5fa0ff, { transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  thermocline: THREE.Mesh;
  causticFloor: THREE.Mesh;

  // 生态
  kelp: { m: THREE.Mesh; base: number; sp: number; ph: number }[] = [];
  jellies: { s: THREE.Sprite; base: [number, number, number]; sp: number; ph: number }[] = [];

  // 2 · 本鲸的小灯与声呐
  lanternCore = mesh(new THREE.SphereGeometry(0.055, 12, 8), basic(0xdff0ff));
  lanternGlow = glowSprite(0x4d8dff, 1.3, 0.3);
  whaleGlow = glowSprite(0x3f78ff, 2.6, 0.3);
  whaleBeam = beam(0x6398ff);
  sonar: { m: THREE.Mesh; mat: THREE.MeshBasicMaterial; t0: number; at: [number, number, number] }[] = [];

  // 3 · 砗磲与长霉的珍珠
  clamLid = new THREE.Group();
  pearlMat = new THREE.MeshStandardMaterial({ color: 0x7f9466, roughness: 0.9, emissive: 0x1d2a14, emissiveIntensity: 0.4 });
  pearl = mesh(new THREE.SphereGeometry(0.1, 16, 12), this.pearlMat);
  pearlGlow = glowSprite(0x9fd08a, 0.9, 0);
  moldSpots: THREE.Mesh[] = [];

  // 4 · 热泉与冷泉
  ventGlow = glowSprite(0xff8a3c, 1.6, 0.3);
  seepGlow = glowSprite(0x6aa8ff, 1.6, 0.3);
  flows = new Particles(240, { size: 0.09 });
  clash = new Particles(80, { size: 0.1 });

  // 5/7/9 · 发光小鱼群
  fish: THREE.Sprite[] = [];

  // 6 · 鱼线上的金牌
  medal = texSprite(medalTex(), 0.36, 0.48);
  medalGlow = glowSprite(0xffd36a, 1.2, 0);
  lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
  fishingLine = new THREE.Line(this.lineGeo, new THREE.LineBasicMaterial({ color: 0xe8e2c8, transparent: true, opacity: 0.6 }));

  // 8/9 · 角落与海葵
  coralM = mat(0x355f9c, { roughness: 0.6, emissive: 0x10264d, emissiveIntensity: 0.7 });
  main = makeAnemone(1.25, 0xff9fc4, 0xa9d4ff);
  minis: Anemone[] = [];
  miniPos = [
    [1.35, 0.85],
    [2.25, 0.82],
    [2.05, 0.15],
    [1.3, 0.2],
    [1.72, 1.1],
  ];
  flowerLight = new THREE.PointLight(0x7cb6ff, 0, 10, 1.2);

  // 粒子
  snow = new Particles(380, { size: 0.08 });
  bubbles = new Particles(160, { size: 0.14, tex: bubbleRingTex() });
  talent = new Particles(170, { size: 0.09 });
  spores = new Particles(40, { size: 0.06, additive: false });
  motes = new Particles(60, { size: 0.09 });

  constructor() {
    super();
    const G = this.group;

    // 起伏海床
    const fg = new THREE.PlaneGeometry(140, 140, 56, 56);
    fg.rotateX(-Math.PI / 2);
    const pos = fg.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const d = Math.hypot(x, z);
      pos.setY(i, d < 3.6 ? 0 : (Math.sin(x * 0.34) * Math.cos(z * 0.31) * 0.28 + Math.sin(x * 0.12 - z * 0.16) * 0.35) * clamp((d - 3.6) / 5));
    }
    fg.computeVertexNormals();
    G.add(new THREE.Mesh(fg, mat(0x0c1733, { roughness: 0.9, metalness: 0.1 })));

    const ct = causticTex();
    ct.wrapS = ct.wrapT = THREE.RepeatWrapping;
    ct.repeat.set(6, 6);
    this.causticFloor = mesh(
      new THREE.PlaneGeometry(46, 46),
      basic(0x63a6ff, { map: ct, transparent: true, opacity: 0.2, blending: THREE.AdditiveBlending, depthWrite: false }),
      [0, 0.02, -2],
    );
    this.causticFloor.rotation.x = -Math.PI / 2;

    this.waterSurface = mesh(
      new THREE.PlaneGeometry(90, 60),
      basic(0x3a82d8, { transparent: true, opacity: 0.18, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }),
      [0, 8.6, -8],
    );
    this.waterSurface.rotation.x = Math.PI / 2;
    this.thermocline = mesh(new THREE.PlaneGeometry(40, 26), this.thermoMat, [0, THERMO_Y, -4]);
    this.thermocline.rotation.x = -Math.PI / 2;
    this.surfaceGlow.position.set(0, 7.6, -8);
    G.add(this.causticFloor, this.waterSurface, this.thermocline, this.surfaceGlow, ...this.bursts);

    // 礁石与海草
    const rockM = mat(0x162244, { roughness: 0.95 });
    const rocks: [number, number, number][] = [
      [-4.8, 0.35, -3.2], [-5.6, 0.55, -1.0], [-4.2, 0.25, 2.0], [4.6, 0.4, -2.8], [5.4, 0.6, 0.6], [-2.8, 0.2, -4.4], [3.4, 0.28, -4.1], [-0.6, 0.12, 2.8],
    ];
    rocks.forEach(([x, r, z], i) => {
      const k = mesh(new THREE.DodecahedronGeometry(r * 1.4, 0), rockM, [x, r * 0.45, z]);
      k.rotation.set(i * 0.7, i * 1.1, i * 0.4);
      k.scale.set(1.3, 0.75, 1.1);
      G.add(k);
    });
    const kA = basic(0x1e5c6b, { side: THREE.DoubleSide, transparent: true, opacity: 0.75 });
    const kB = basic(0x297885, { side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
    for (let i = 0; i < 24; i++) {
      const side = i % 2 ? 1 : -1;
      const h = 0.8 + hash(i * 3 + 1) * 1.5;
      const geo = new THREE.PlaneGeometry(0.14, h, 1, 4).translate(0, h / 2, 0);
      const m = new THREE.Mesh(geo, i % 3 ? kA : kB);
      m.position.set(side * (3.0 + hash(i * 5) * 4.5), 0, -4.2 + hash(i * 7 + 2) * 7);
      m.rotation.y = hash(i * 11) * Math.PI;
      G.add(m);
      this.kelp.push({ m, base: m.rotation.y, sp: 1.1 + hash(i + 9) * 0.9, ph: hash(i + 15) * 6.28 });
    }
    const hues = ['rgba(125,180,255,0.75)', 'rgba(170,150,255,0.72)', 'rgba(110,230,220,0.7)'];
    for (let i = 0; i < 8; i++) {
      const s = texSprite(jellyTex(hues[i % 3]), 0.6, 0.76, 0xffffff, true);
      const base: [number, number, number] = [(hash(i * 13) - 0.5) * 10, 1.4 + hash(i * 17 + 1) * 1.2, -4.5 + hash(i * 19 + 2) * 3.5];
      G.add(s);
      this.jellies.push({ s, base, sp: 0.7 + hash(i + 3) * 0.6, ph: hash(i + 21) * 6.28 });
    }

    // 海面七位（角色道具取自 Agent-Reach 研究里的同人印象：书 / 画笔 / 扇子 / 算盘 / 卷轴）
    this.cast = [
      { actor: this.claude, prop: this.pBook, propOff: [-0.52, -0.05, 0.1], x: 0, y: 5.35, z: -5.8, beamR: 1.05 },
      { actor: this.gpt, x: -1.65, y: 5.05, z: -5.5, beamR: 0.95 },
      { actor: this.gemini, prop: this.pBrush, propOff: [0.5, -0.02, 0.1], x: 1.65, y: 4.92, z: -5.4, beamR: 0.92 },
      { actor: this.qwen, prop: this.pFan, propOff: [-0.46, -0.04, 0.1], x: -3.05, y: 4.72, z: -5.1, beamR: 0.85 },
      { actor: this.zai, prop: this.pAbacus, propOff: [-0.44, -0.06, 0.1], x: -4.4, y: 4.5, z: -4.8, beamR: 0.82 },
      { actor: this.kimi, prop: this.pScroll, propOff: [0.46, -0.02, 0.1], x: 3.05, y: 4.72, z: -5.1, beamR: 0.85 },
      { actor: this.doubao, x: 4.35, y: 4.5, z: -4.8, beamR: 0.82 },
    ];
    G.add(...this.beams, ...this.halos, this.whaleBeam, this.whaleGlow, this.lanternCore, this.lanternGlow);

    // 声呐环
    for (let i = 0; i < 3; i++) {
      const m2 = basic(0x8fc4ff, { transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
      const r = mesh(new THREE.RingGeometry(0.92, 1, 64), m2);
      r.rotation.x = -Math.PI / 2;
      G.add(r);
      this.sonar.push({ m: r, mat: m2, t0: 0, at: [0, 0, 0] });
    }
    this.sonar[0].t0 = LT(2, 2);
    this.sonar[0].at = [-0.42, 0.03, 0.15];
    this.sonar[1].t0 = LT(8, 7);
    this.sonar[1].at = [1.18, 0.03, 0.42];
    this.sonar[2].t0 = LT(9, 9);
    this.sonar[2].at = [FLOWER[0], 0.03, FLOWER[2]];

    // 砗磲：下壳 + 可掀开的上壳 + 珍珠 + 藻斑
    const shellM = mat(0x8a9cc4, { roughness: 0.7, side: THREE.DoubleSide });
    const half = new THREE.SphereGeometry(0.42, 22, 10, 0, Math.PI * 2, 0, Math.PI / 2);
    const lower = mesh(half, shellM, [-1.55, 0.12, -0.75]);
    lower.scale.set(1, 0.32, 0.85);
    lower.rotation.x = Math.PI;
    const upper = mesh(half, shellM, [0, 0, 0.36]);
    upper.scale.set(1, 0.32, 0.85);
    this.clamLid.add(upper);
    this.clamLid.position.set(-1.55, 0.12, -0.75 - 0.36);
    this.pearl.position.set(-1.55, 0.17, -0.75);
    this.pearlGlow.position.set(-1.55, 0.2, -0.72);
    G.add(lower, this.clamLid, this.pearl, this.pearlGlow);
    const spotM = basic(0x3e5a2c);
    for (let i = 0; i < 9; i++) {
      const s = mesh(new THREE.CircleGeometry(0.018 + hash(i) * 0.014, 6), spotM);
      const th = hash(i + 4) * Math.PI * 2;
      const ph = 0.3 + hash(i + 8) * 1.2;
      s.position.set(-1.55 + Math.sin(ph) * Math.cos(th) * 0.101, 0.17 + Math.cos(ph) * 0.101, -0.75 + Math.sin(ph) * Math.sin(th) * 0.101);
      s.lookAt(-1.55 + Math.sin(ph) * Math.cos(th), 0.17 + Math.cos(ph), -0.75 + Math.sin(ph) * Math.sin(th));
      this.moldSpots.push(s);
      G.add(s);
    }

    // 热泉烟囱与冷泉晶簇
    const vent = mesh(new THREE.ConeGeometry(0.28, 0.95, 7, 1, true), mat(0x3a2a2a, { roughness: 1 }), [VENT_TOP[0], 0.47, VENT_TOP[2]]);
    const ventRim = mesh(new THREE.TorusGeometry(0.1, 0.035, 6, 12), basic(0xff7a2e), [VENT_TOP[0], 0.94, VENT_TOP[2]]);
    ventRim.rotation.x = Math.PI / 2;
    this.ventGlow.position.set(VENT_TOP[0], 1.0, VENT_TOP[2]);
    G.add(vent, ventRim, this.ventGlow);
    const iceM = mat(0x9ec8ff, { roughness: 0.2, metalness: 0.3, emissive: 0x1b3c7a, emissiveIntensity: 0.8 });
    for (let i = 0; i < 6; i++) {
      const c = mesh(new THREE.OctahedronGeometry(0.1 + hash(i) * 0.1, 0), iceM, [SEEP_TOP[0] + (hash(i + 1) - 0.5) * 0.5, 0.12, SEEP_TOP[2] + (hash(i + 2) - 0.5) * 0.4]);
      c.scale.y = 1.8 + hash(i + 3);
      G.add(c);
    }
    this.seepGlow.position.set(SEEP_TOP[0], 0.45, SEEP_TOP[2]);
    G.add(this.seepGlow);
    for (let i = 0; i < 240; i++) this.flows.color(i, C(i < 120 ? (i % 3 ? 0xff9a4a : 0xffd070) : i % 3 ? 0x6aa8ff : 0xcfe6ff));

    // 小鱼群
    for (let i = 0; i < 34; i++) {
      const s = texSprite(fishTex(), 0.2, 0.1, i % 4 ? 0x9fd4ff : 0xffe7a8, true);
      this.fish.push(s);
      G.add(s);
    }

    // 金牌与鱼线
    G.add(this.medal, this.medalGlow, this.fishingLine);

    // 角落：珊瑚拱门 + 枝状珊瑚
    const arch = mesh(new THREE.TorusGeometry(0.8, 0.09, 8, 24, Math.PI), this.coralM, [FLOWER[0] + 0.15, 0, FLOWER[2] - 0.35]);
    arch.rotation.y = -0.5;
    G.add(arch);
    const br: [number[], number[], number][] = [
      [[2.6, 0, 0.0], [2.75, 0.75, -0.1], 0.05],
      [[2.68, 0.4, -0.05], [2.45, 0.7, 0.1], 0.035],
      [[1.05, 0, -0.1], [0.95, 0.55, -0.2], 0.04],
      [[1.0, 0.3, -0.15], [1.2, 0.6, -0.05], 0.03],
    ];
    br.forEach(([a, b, r]) => G.add(rod(a, b, r, this.coralM)));
    this.main.g.position.set(FLOWER[0], 0, FLOWER[2]);
    this.flowerLight.position.set(FLOWER[0], 0.6, FLOWER[2] + 0.2);
    G.add(this.main.g, this.flowerLight);
    this.miniPos.forEach(([x, z], i) => {
      const a = makeAnemone(0.55, [0xffd2e2, 0xbfe0ff, 0xfff0b8][i % 3], 0x8fc4ff);
      a.g.position.set(x, 0, z);
      this.minis.push(a);
      G.add(a.g);
    });

    for (let i = 0; i < 380; i++) this.snow.color(i, C(i % 4 === 0 ? 0xffffff : 0x99d6ff));
    for (let i = 0; i < 160; i++) this.bubbles.color(i, C(i % 2 ? 0xc2e6ff : 0x89c4ff));
    for (let i = 0; i < 170; i++) this.talent.color(i, C([0xffde7a, 0xfff2c4, 0xffc85a][i % 3]));
    for (let i = 0; i < 40; i++) this.spores.color(i, C(i % 2 ? 0x8fb876 : 0xb2c98e));
    for (let i = 0; i < 60; i++) this.motes.color(i, C(i % 2 ? 0xffe8a3 : 0x9fd0ff));
    G.add(this.flows.points, this.clash.points, this.snow.points, this.bubbles.points, this.talent.points, this.spores.points, this.motes.points);
  }

  frame(c: Ctx) {
    this.hideAll();
    const { t, e } = c;
    const bt = beat(t);
    const rms = pulse(t);
    const L = (n: number) => t >= LS(n) && (n === 9 || t < LS(n + 1));

    mood(e, [0x0c2e60, 0x051434, 0x020714, 0.12], [0x061430, 8, 56], [0x93bcff, 0x0b1634, 0.78], [0xcbe4ff, 0.9], 0.22, [0, 14, -4]);

    // ---------------- 本鲸的位置、动作与镜头 ----------------
    const W = this.whale;
    let wx = -0.4, wz = 0.12;
    let lanternK = 0.8, whaleBeamOp = 0.26, lidOpen = 0.08, pearlK = 0, duel = 0, ventK = 0.25;
    let goldK = 0.55, conv = 0, medalY = 99, flowerGrow = 0, flowerOpen = 0, miniOpen = 0, motesK = 0;
    let lanternPos: [number, number, number] | null = null;
    let shake = 0;

    if (L(1)) {
      // 01 可那些没有天赋的人呢：光在上面，她在下面
      const p = range(t, 0, LS(2));
      W.show().at(wx, 0, wz).tint(0xa8bdf2).play('idle');
      lanternK = 0.2; whaleBeamOp = 0.18; goldK = 1.15;
      orbit(e.cam, [-0.1, 1.6, -1.6], lerp(12, 10.6, eOut(p)), lerp(-0.18, -0.05, p), lerp(0.06, 0.05, p), 38, -0.15, -0.08);
    } else if (L(2)) {
      // 02 譬如我：自己的小灯亮起，声呐一圈扩散
      const p = range(t, LS(2), LS(3));
      const tm = LT(2, 2);
      const hit = eOut(range(t, tm - 0.06, tm + 0.25));
      wx = -0.42; wz = 0.15;
      W.show().at(wx, 0, wz).tint(mixHex(0x88a4e6, 0xffffff, hit)).play(t >= tm ? 'point' : 'idle', tm);
      lanternK = 0.2 + 0.9 * hit; whaleBeamOp = 0.22 + 0.3 * hit;
      if (t >= tm) this.fxSpark.show().at(wx + 0.55, 1.15 + Math.sin(t * 6) * 0.04, wz + 0.1);
      orbit(e.cam, [-0.15, 1.5, -1.5], lerp(10.6, 9.8, eOut(p)), lerp(-0.05, 0.04, p), 0.04, 38, -0.22, -0.06);
    } else if (L(3)) {
      // 03 枕头下发霉的梦：砗磲枕头打开，梦想珍珠长满藻斑
      const p = range(t, LS(3), LS(4));
      wx = -0.95; wz = -0.25;
      lidOpen = eOut(range(t, LT(3, 1), LT(3, 4))) * (1 - eIn(range(p, 0.9, 1)) * 0.6);
      pearlK = eOut(range(t, LT(3, 3), LT(3, 6) + 0.2));
      W.show().at(wx, 0, wz).tint(0xd0dcff).play(t > LT(3, 6) ? 'sad' : 'idle', LT(3, 6));
      if (t > LT(3, 7)) this.fxQ.show().at(wx + 0.38, 1.22 + Math.sin(t * 4) * 0.04, wz + 0.1);
      lanternK = 0.55;
      orbit(e.cam, [-1.3, 0.55, -0.6], lerp(4.6, 3.9, eIO(p)), lerp(-0.3, -0.06, p), 0.2, 36, -0.15, -0.1);
    } else if (L(4)) {
      // 04 热忱与自卑对抗着：热泉与冷泉两股洋流绕着她相撞
      const p = range(t, LS(4), LS(5));
      const tc = LT(4, 5);
      duel = eOut(range(p, 0, 0.18)) * (1 - range(p, 0.9, 1));
      ventK = 0.25 + duel;
      const lean = Math.sin(t * 5.5) * 0.12 * duel;
      W.show().at(wx + lean, 0, wz).tint(mixHex(0xffc49a, 0x7a9cff, 0.5 + Math.sin(t * 5.5) * 0.5)).play('sway');
      this.fxSweat.show().at(wx + 0.38, 1.15, wz + 0.1);
      shake = bump(t, tc - 0.1, 0.36) * 0.07;
      e.grade.ca = 0.0015 + shake * 0.12;
      lanternK = 0.6;
      orbit(e.cam, [-0.2, 1.0, -0.6], lerp(7.6, 6.6, p), Math.sin(p * 1.4 - 0.7) * 0.2, 0.1, 36, 0, -0.1);
    } else if (L(5)) {
      // 05 笑容却已不知下落：小鱼拼成的笑脸散开，游进黑暗
      const p = range(t, LS(5), LS(6));
      wx = 0.1; wz = 0.25;
      W.show().at(wx, 0, wz).tint(0xbac8f0).play(t > LT(5, 4) ? 'sad' : 'idle', LT(5, 4));
      if (t > LT(5, 6)) this.fxGloom.show().at(wx + 0.36, 1.18, wz + 0.1);
      lanternK = lerp(0.7, 0.35, range(t, LT(5, 4), LT(5, 7)));
      orbit(e.cam, [0.05, 1.15, 0.0], lerp(5.8, 5.0, p), lerp(-0.12, 0.1, p), 0.1, 36, -0.12, -0.1);
    } else if (L(6)) {
      // 06 世俗的成功：海面烟火，一枚金牌垂到眼前，快够到时被收走
      const p = range(t, LS(6), LS(7));
      wx = -0.3; wz = 0.15;
      const down = eOut(range(t, LS(6), LT(6, 6)));
      const up = eIn(range(t, LT(6, 11), LT(6, 12) + 0.55));
      medalY = lerp(lerp(8.5, 1.65, down), 9.5, up);
      const reach = t >= LT(6, 8) && t < LT(6, 11) + 0.2;
      W.show().at(wx, 0, wz).tint(0xc4d2f8).play(t >= LT(6, 11) + 0.2 ? 'sad' : reach ? 'hop' : 'idle', reach ? LT(6, 8) : LT(6, 11));
      if (t >= LT(6, 11) && t < LT(6, 12) + 0.6) this.fxEx.show().at(wx + 0.38, 1.25, wz + 0.1);
      goldK = 1.45; lanternK = 0.6;
      orbit(e.cam, [0, 1.85, -1.6], lerp(10.2, 9.0, eOut(p)), lerp(0.15, -0.06, p), lerp(0.02, 0.08, p), 38, 0.16, -0.06);
    } else if (L(7)) {
      // 07 成不了万众瞩目那一个：所有光汇向一处，鱼群往上游
      const p = range(t, LS(7), LS(8));
      conv = eOut(range(t, LT(7, 3) - 0.1, LT(7, 6))) * (1 - range(t, LS(8) - 0.3, LS(8)));
      W.show().at(wx, 0, wz).tint(0x8496c8).play('idle');
      lanternK = 0.4; whaleBeamOp = 0.1; goldK = 0.85;
      orbit(e.cam, [0, 2.2, -2.2], lerp(10.2, 9.0, eIO(p)), lerp(-0.06, 0.12, p), lerp(0.0, -0.06, p), 38, 0, 0.12);
    } else if (L(8)) {
      // 08 我能不能在某个角落：声呐探到珊瑚拱门下的角落，她走过去
      const p = range(t, LS(8), LS(9));
      const k = eOut(range(p, 0, 0.92));
      wx = lerp(-0.3, 1.18, k); wz = lerp(0.12, 0.42, k);
      W.show().at(wx, 0, wz).tint(mixHex(0xb8c8f2, 0xffffff, k)).play(k < 0.94 ? 'walk' : 'idle');
      W.flip = true;
      lanternK = 0.85;
      orbit(e.cam, [lerp(0.4, 1.5, k), 0.75, 0.35], lerp(7.4, 5.2, eIO(p)), lerp(0.2, 0.4, p), lerp(0.12, 0.18, p), 36, 0.2, -0.08);
    } else {
      // 09 耗尽天真 开出小小的花朵：把小灯放进沙里，开出发光海葵
      const p = range(t, LS(9), 28.003);
      wx = 1.12; wz = 0.4;
      const tRel = LT(9, 0), tSand = LT(9, 3), tOpen = LT(9, 4), tFlower = LT(9, 9);
      W.show().at(wx, 0, wz).tint(0xffffff).cue(t, [[tRel, 'bow'], [tFlower, 'hop']]);
      W.flip = true;
      const sink = eIO(range(t, tRel, tSand + 0.1));
      const base: [number, number, number] = [wx + 0.42, 1.0, wz + 0.12];
      lanternPos = [lerp(base[0], FLOWER[0], sink), lerp(base[1], 0.14, sink), lerp(base[2], FLOWER[2], sink)];
      lanternK = 1 - eIn(range(t, tSand, tOpen + 0.15));
      motesK = range(t, tRel, tRel + 0.3) * (1 - range(t, tOpen, tOpen + 0.6));
      flowerGrow = eOut(range(t, tOpen, LT(9, 6) + 0.3));
      flowerOpen = eBack(range(t, tFlower - 0.12, tFlower + 0.45));
      miniOpen = eOut(range(t, LT(9, 10), 27.4));
      if (t >= tFlower) {
        this.fxHeart.show().at(wx + 0.25, 1.25 + Math.sin(t * 4.5) * 0.04, wz + 0.05);
        this.fxSpark.show().at(FLOWER[0] + 0.3, 0.8 + Math.sin(t * 5) * 0.04, FLOWER[2] + 0.1);
      }
      e.grade.flash = decay(t, tFlower, 5.5) * 0.14;
      e.grade.flashCol = 0xbfd8ff;
      orbit(e.cam, [lerp(1.5, 1.3, eIO(p)), lerp(0.6, 0.9, eIO(p)), 0.4], lerp(4.8, 6.8, eIO(p)), lerp(0.38, 0.14, p), lerp(0.16, 0.3, p), 36, 0.16, -0.08);
    }

    // ---------------- 海面七位 ----------------
    const doubaoDown = eIO(range(t, LT(9, 6), 27.6));
    const kimiLook = t >= LT(7, 4) && t < LS(9) + 0.8;
    this.cast.forEach((s, i) => {
      let x = s.x, y = s.y + Math.sin(t * 1.2 + i * 0.9) * 0.08, z = s.z;
      let act = 'idle';
      if (s.actor === this.claude) act = conv > 0.3 ? 'curtsy' : 'read';
      else if (s.actor === this.gpt) act = L(6) || conv > 0.3 ? 'cast' : 'float';
      else if (s.actor === this.gemini) act = L(6) ? 'spin' : 'sway';
      else if (s.actor === this.qwen) act = L(6) ? 'spin' : 'sway';
      else if (s.actor === this.zai) act = conv > 0.3 ? 'alert' : 'doze';
      else if (s.actor === this.kimi) act = kimiLook ? 'lookaround' : 'think';
      else if (s.actor === this.doubao) {
        x = lerp(s.x, 2.55, doubaoDown);
        y = lerp(y, 0.05 + Math.abs(Math.sin(t * 3)) * 0.06 * doubaoDown, doubaoDown);
        z = lerp(s.z, 0.05, doubaoDown);
        act = doubaoDown > 0.95 ? 'hop' : 'step';
      }
      s.actor.show().at(x, y, z).play(act);
      if (s.actor === this.doubao) s.actor.flip = doubaoDown > 0.02;
      if (s.prop && s.propOff) s.prop.show().at(x + s.propOff[0], y + s.propOff[1] + Math.sin(t * 1.7 + i) * 0.04, z + s.propOff[2]).tint(0xe8f2ff, 0.92);
      const toClaude = i === 0 ? 0 : conv;
      const tx = lerp(x, this.cast[0].x, toClaude), ty = lerp(y - 1.35, this.cast[0].y - 0.2, toClaude), tz = lerp(z, this.cast[0].z, toClaude);
      const boost = i === 0 ? 1 + conv * 0.8 : 1 - conv * 0.25;
      const fade = s.actor === this.doubao ? 1 - doubaoDown : 1;
      aim(this.beams[i], [s.x * 0.9, 12.2, s.z - 0.3], [tx, ty, tz], s.beamR * (1 - toClaude * 0.4), (0.13 + 0.05 * bt) * boost * fade);
      this.halos[i].position.set(x, y + 0.32, z - 0.15);
      this.halos[i].material.opacity = (0.34 + 0.08 * bt) * boost * fade;
    });
    this.fxZzz.show(conv < 0.3).at(-4.1, 5.15 + Math.sin(t * 2) * 0.05, -4.75);
    if (kimiLook) this.fxKimiQ.show().at(3.35, 5.55 + Math.sin(t * 4) * 0.04, -5.0);

    // 海面烟火（世俗的成功）
    const bt6 = [LT(6, 7), LT(6, 8), LT(6, 10), LT(6, 11)];
    this.bursts.forEach((b, i) => {
      b.position.set([-3, -1, 1.4, 3.4][i], 7.4, -6.5);
      const k = L(6) ? decay(t, bt6[i], 2.4) : 0;
      b.material.opacity = k * 0.9;
      b.scale.setScalar(3 + k * 3);
    });

    // ---------------- 本鲸的小灯 + 追光 ----------------
    const lp = lanternPos ?? [wx + 0.42, 1.0 + Math.sin(t * 2.1) * 0.05, wz + 0.12];
    this.lanternCore.position.set(lp[0], lp[1], lp[2]);
    this.lanternCore.visible = lanternK > 0.03;
    this.lanternCore.scale.setScalar(0.6 + 0.6 * lanternK);
    this.lanternGlow.position.set(lp[0], lp[1], lp[2]);
    this.lanternGlow.material.opacity = lanternK * (0.75 + 0.15 * bt);
    this.lanternGlow.scale.setScalar(0.9 + lanternK * 0.8);
    aim(this.whaleBeam, [wx + 0.3, 10.8, wz - 0.3], [wx, 0, wz], 1.1, whaleBeamOp);
    this.whaleGlow.position.set(wx, 0.6, wz - 0.08);
    this.whaleGlow.material.opacity = 0.25 + 0.2 * lanternK;

    // 声呐环
    this.sonar.forEach((s) => {
      const age = t - s.t0;
      s.m.visible = age > 0 && age < 1.6;
      if (!s.m.visible) return;
      s.m.position.set(s.at[0], s.at[1], s.at[2]);
      s.m.scale.setScalar(0.2 + 5.5 * eOut(age / 1.6));
      s.mat.opacity = 0.85 * (1 - age / 1.6);
    });

    // 米饭盆（DeepSeek「吃白饭」的梗，放在她最初站的地方）
    this.bowl.show().at(-0.95, 0, 0.35);
    this.steam.show().at(-0.95, 0.3 + Math.sin(t * 2.4) * 0.03, 0.36).tint(0xffffff, 0.45 + 0.25 * Math.sin(t * 3));

    // ---------------- 砗磲与珍珠 ----------------
    this.clamLid.rotation.x = -lidOpen * 1.05;
    this.pearlMat.emissiveIntensity = 0.3 + pearlK * 0.6;
    this.pearlGlow.material.opacity = pearlK * 0.55;
    for (let i = 0; i < 40; i++) {
      if (pearlK < 0.05) { this.spores.set(i, 0, -50, 0, 0); continue; }
      const s = (t * 0.35 + hash(i)) % 1;
      this.spores.set(i, -1.55 + (hash(i + 1) - 0.5) * 0.5 + Math.sin(t * 2 + i) * 0.06, 0.2 + s * 0.85, -0.75 + (hash(i + 2) - 0.5) * 0.4, pearlK * Math.sin(s * Math.PI) * (0.6 + hash(i + 3)));
    }
    this.spores.commit();

    // ---------------- 热泉 / 冷泉 ----------------
    this.ventGlow.material.opacity = 0.25 + ventK * 0.5 + rms * 0.2 * duel;
    this.seepGlow.material.opacity = 0.25 + ventK * 0.5;
    const center: [number, number, number] = [wx, 0.85, wz];
    for (let i = 0; i < 240; i++) {
      const warm = i < 120;
      const src = warm ? VENT_TOP : SEEP_TOP;
      const s = (t * (warm ? 0.55 : 0.42) + hash(i)) % 1;
      // 平时：竖直上升的热流 / 冷雾
      const ax = src[0] + (hash(i + 3) - 0.5) * 0.25 + Math.sin(t + i) * 0.05;
      const ay = src[1] + s * (warm ? 2.4 : 1.0);
      const az = src[2] + (hash(i + 5) - 0.5) * 0.25;
      // 对抗：两股流螺旋着冲向她
      const sp = Math.sin(s * Math.PI) * 0.35;
      const ang = s * 9 + (warm ? 0 : Math.PI);
      const bx = lerp(src[0], center[0], s) + Math.cos(ang) * sp;
      const by = lerp(src[1], center[1], s) + Math.sin(s * Math.PI) * 0.7;
      const bz = lerp(src[2], center[2], s) + Math.sin(ang) * sp;
      this.flows.set(i, lerp(ax, bx, duel), lerp(ay, by, duel), lerp(az, bz, duel), (0.45 + hash(i + 7) * 0.6) * (0.6 + duel * 0.9) * (1 - s * 0.5));
    }
    this.flows.commit();
    const clashT = [LT(4, 5), LT(4, 7)];
    for (let i = 0; i < 80; i++) {
      const age = t - clashT[i % 2];
      if (duel < 0.05 || age < 0 || age > 0.9) { this.clash.set(i, 0, -50, 0, 0); continue; }
      const th = hash(i) * Math.PI * 2, v = 1.2 + hash(i + 1) * 2.6;
      this.clash.set(i, center[0] + Math.cos(th) * v * age * 0.6, center[1] + Math.sin(th) * v * age * 0.6 - age * age, center[2] + (hash(i + 2) - 0.5) * age, (1 - age / 0.9) * 1.1);
      this.clash.color(i, C(i % 2 ? 0xffa65c : 0x73a4ff));
    }
    this.clash.commit();
    if (shake > 0.001) { e.cam.position.x += Math.sin(t * 58) * shake; e.cam.position.y += Math.cos(t * 51) * shake; }

    // ---------------- 小鱼群 ----------------
    const N = this.fish.length;
    const smileIn = L(5) ? eOut(range(t, LS(5) - 0.05, LT(5, 2))) : 0;
    const scatter = L(5) ? eIn(range(t, LT(5, 4), LE5())) : 0;
    const rise = L(7) ? eIO(range(t, LS(7), LT(7, 8))) : 0;
    const back = L(9) ? eOut(range(t, LT(9, 9) - 0.2, LT(9, 9) + 1.0)) : 0;
    this.fish.forEach((f, i) => {
      const h1 = hash(i * 3.7), h2 = hash(i * 5.1 + 1), h3 = hash(i * 7.3 + 2);
      // 闲游
      const sp = 0.25 + h1 * 0.3;
      let x = -3.2 + ((h1 * 6.4 + t * sp) % 6.4);
      let y = 0.7 + h2 * 1.5 + Math.sin(t * 1.3 + i) * 0.08;
      let z = -2.4 + h3 * 3.2;
      let op = 0.55;
      let dir = 1;
      if (L(5)) {
        // 笑脸：嘴是一道弧，两只眼睛各几条鱼
        let sx: number, sy: number;
        if (i < 24) { const a = Math.PI * (1.12 + (i / 23) * 0.76); sx = Math.cos(a) * 0.55; sy = Math.sin(a) * 0.55 + 0.1; }
        else { const eye = i < 29 ? -1 : 1; const k = i % 5; sx = eye * 0.24 + Math.cos(k * 1.3) * 0.05; sy = 0.28 + Math.sin(k * 1.3) * 0.05; }
        const cx = wx + 0.05 + sx, cy = 1.75 + sy, cz = wz + 0.35;
        x = lerp(x, cx, smileIn); y = lerp(y, cy, smileIn); z = lerp(z, cz, smileIn);
        const th = h1 * Math.PI * 2;
        x += Math.cos(th) * scatter * 5.5; y += (h2 - 0.3) * scatter * 2.5; z -= scatter * (2 + h3 * 3);
        op = 0.9 * (1 - scatter);
        dir = scatter > 0.05 ? (Math.cos(th) >= 0 ? 1 : -1) : 1;
      } else if (L(6) || L(8)) {
        op = 0;
      } else if (L(7)) {
        // 都往有光的地方游
        const sx = (h1 - 0.5) * 9, sy = 0.6 + h2 * 0.8, sz = -0.5 - h3 * 2;
        const ex = this.cast[0].x + (h1 - 0.5) * 1.4, ey = this.cast[0].y - 0.9 + h2 * 0.6, ez = this.cast[0].z + 0.6;
        const k = clamp(rise * 1.3 - h3 * 0.3);
        x = lerp(sx, ex, k); y = lerp(sy, ey, k); z = lerp(sz, ez, k);
        op = 0.75; dir = ex > sx ? 1 : -1;
      } else if (L(9)) {
        // 回来了，绕着花游
        const a = t * (0.9 + (i % 3) * 0.2) + (i / N) * Math.PI * 2;
        const r = 0.45 + (i % 3) * 0.2;
        const ox = FLOWER[0] + Math.cos(a) * r, oy = 0.35 + (i % 4) * 0.12 + Math.sin(t * 2 + i) * 0.04, oz = FLOWER[2] + Math.sin(a) * r;
        x = lerp(FLOWER[0] + Math.cos(h1 * 6.28) * 5, ox, back); y = lerp(1.5, oy, back); z = lerp(FLOWER[2] - 3, oz, back);
        op = 0.9 * back; dir = Math.sin(a) > 0 ? -1 : 1;
      }
      f.visible = op > 0.02;
      f.position.set(x, y, z);
      f.material.opacity = op;
      f.scale.set(0.2 * dir, 0.1, 1);
    });

    // ---------------- 金牌 ----------------
    const showMedal = L(6) && medalY < 9;
    this.medal.visible = this.fishingLine.visible = showMedal;
    this.medalGlow.material.opacity = showMedal ? 0.6 : 0;
    if (showMedal) {
      const mx = wx + 0.35 + Math.sin(t * 1.6) * 0.08;
      this.medal.position.set(mx, medalY, wz + 0.1);
      this.medal.material.rotation = Math.sin(t * 2.3) * 0.18;
      this.medalGlow.position.set(mx, medalY, wz + 0.05);
      const pa = this.lineGeo.attributes.position as THREE.BufferAttribute;
      pa.setXYZ(0, mx, 9.5, wz + 0.1);
      pa.setXYZ(1, mx, medalY + 0.24, wz + 0.1);
      pa.needsUpdate = true;
    }

    // ---------------- 天赋金尘：落到温跃层就熄灭 ----------------
    for (let i = 0; i < 170; i++) {
      const s = this.cast[i % 7];
      const fall = (t * (0.35 + hash(i + 4) * 0.35) + hash(i + 5)) % 1;
      const y = lerp(s.y - 0.3, THERMO_Y, fall);
      this.talent.set(i, s.x + (hash(i) - 0.5) * 1.0 + Math.sin(t + i) * 0.05, y, s.z + 0.3 + (hash(i + 2) - 0.5) * 0.8, (0.5 + hash(i + 3) * 0.6) * (1 - fall) * goldK);
    }
    this.talent.commit();
    this.thermoMat.opacity = 0.05 + (L(1) ? 0.06 : 0) + 0.02 * Math.sin(t * 1.4);

    // ---------------- 角落海葵 ----------------
    setAnemone(this.main, flowerGrow, flowerOpen, t, 0);
    this.minis.forEach((a, i) => {
      const k = clamp(miniOpen * 1.6 - i * 0.18);
      setAnemone(a, eOut(k), eBack(clamp(k * 1.5 - 0.3)), t, i * 1.7);
    });
    this.flowerLight.intensity = flowerOpen * 4.5 + miniOpen * 2 + (L(8) ? 1.2 : 0);
    for (let i = 0; i < 60; i++) {
      const s = (t * 0.85 + hash(i)) % 1;
      this.motes.set(i, lerp(wx + (hash(i + 1) - 0.5) * 0.4, FLOWER[0], s), lerp(0.6 + hash(i + 2) * 0.4, 0.06, s * s) + Math.sin(s * Math.PI) * 0.15, lerp(wz, FLOWER[2], s), motesK * Math.sin(s * Math.PI) * (0.65 + hash(i + 3) * 0.7));
    }
    this.motes.commit();

    // ---------------- 生态与环境 ----------------
    this.kelp.forEach((k) => { k.m.rotation.z = Math.sin(t * k.sp + k.ph) * 0.16; k.m.rotation.y = k.base + Math.cos(t * 0.6 + k.ph) * 0.12; });
    this.jellies.forEach((j) => {
      j.s.position.set(j.base[0] + Math.sin(t * 0.45 + j.ph) * 0.25, j.base[1] + Math.sin(t * j.sp + j.ph) * 0.22, j.base[2]);
      j.s.material.opacity = 0.4 + 0.18 * Math.sin(t * 1.8 + j.ph);
    });
    const tex = (this.causticFloor.material as THREE.MeshBasicMaterial).map;
    if (tex) { tex.offset.x = (t * 0.015) % 1; tex.offset.y = (t * 0.01) % 1; }
    this.waterSurface.position.y = 8.6 + Math.sin(t * 1.1) * 0.12;
    for (let i = 0; i < 380; i++) {
      const y = ((hash(i + 1) * 14 + t * 0.28 * (0.5 + hash(i + 2))) % 14) - 1;
      this.snow.set(i, (hash(i) - 0.5) * 22 + Math.sin(t * 0.45 + i) * 0.25, 13 - y, (hash(i + 3) - 0.5) * 18 - 2, 0.55 + hash(i + 4) * 0.85);
    }
    this.snow.commit();
    for (let i = 0; i < 160; i++) {
      const y = (t * (0.45 + hash(i + 5) * 0.65) + hash(i + 6) * 9) % 9;
      const near = i < 30;
      this.bubbles.set(i, (near ? wx : 0) + (hash(i) - 0.5) * (near ? 1.2 : 13) + Math.sin(t * 2 + i) * 0.08, y, (near ? wz : -1) + (hash(i + 3) - 0.5) * (near ? 0.8 : 10), 0.5 + hash(i + 7) * 0.9);
    }
    this.bubbles.commit();

    e.grade.bloom = 0.75 + 0.35 * flowerOpen;
  }
}

/** 第 5 句最后一个字唱完后再多散开一点 */
function LE5() {
  return LT(5, 7) + 0.35;
}
