// 原创三维古风道具与建筑组件库（按《樱花树下的约定》歌词意象逐一雕琢）
import * as THREE from 'three';
import { TAU, barkTex, glowTex, hash, stoneTex } from './core';

export function stdMat(color: number, rough = 0.78, metal = 0.05, map?: THREE.Texture, emissive = 0, emInt = 0) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: rough,
    metalness: metal,
    map: map ?? null,
    emissive,
    emissiveIntensity: emInt,
  });
}

export function addGlow(parent: THREE.Object3D, color: number, size: number, opacity = 0.45, y = 0) {
  const sp = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: glowTex(),
      color,
      transparent: true,
      opacity: opacity * 0.48,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  sp.position.y = y;
  sp.scale.setScalar(size * 0.85);
  parent.add(sp);
  return sp;
}

/** 千年古樱树（曲干虬枝 + 三层粉白花云 + 随风轻摆的红绸与祈愿木牌） */
export interface SakuraTreeRig {
  group: THREE.Group;
  ribbons: THREE.Group[];
  crown: THREE.Group;
}

export function buildSakuraTree(seed = 1, scale = 1, withRibbons = true): SakuraTreeRig {
  const group = new THREE.Group();
  const trunkMat = stdMat(0x4b322d, 0.9, 0.02, barkTex());

  // 虬曲主干（底部盘根，向上优雅微倾）
  const mainCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -0.05, 0),
    new THREE.Vector3(0.14, 1.0, 0.06),
    new THREE.Vector3(-0.08, 2.15, -0.05),
    new THREE.Vector3(0.12, 3.25, 0.04),
    new THREE.Vector3(0.05, 4.05, 0),
  ]);
  const trunk = new THREE.Mesh(new THREE.TubeGeometry(mainCurve, 18, 0.34, 10, false), trunkMat);
  group.add(trunk);

  // 盘根
  for (let r = 0; r < 5; r++) {
    const a = (r / 5) * TAU + hash(seed + r) * 0.4;
    const rc = new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.cos(a) * 0.18, 0.55, Math.sin(a) * 0.18),
      new THREE.Vector3(Math.cos(a) * 0.55, 0.16, Math.sin(a) * 0.55),
      new THREE.Vector3(Math.cos(a) * 0.95, -0.04, Math.sin(a) * 0.95),
    ]);
    group.add(new THREE.Mesh(new THREE.TubeGeometry(rc, 8, 0.13, 7, false), trunkMat));
  }

  const crown = new THREE.Group();
  group.add(crown);

  const pinkDeep = stdMat(0xf08cae, 0.68, 0, undefined, 0x6b1d3a, 0.2);
  const pinkMid = stdMat(0xffb7ce, 0.62, 0, undefined, 0x8a2c4f, 0.24);
  const pinkLight = stdMat(0xffe4ee, 0.55, 0, undefined, 0xb85678, 0.28);
  const puffGeo = new THREE.IcosahedronGeometry(1, 1);

  const ribbons: THREE.Group[] = [];
  const ribbonMat = new THREE.MeshStandardMaterial({
    color: 0xd92648,
    roughness: 0.45,
    emissive: 0x6e0d22,
    emissiveIntensity: 0.35,
    side: THREE.DoubleSide,
  });
  const plaqueMat = stdMat(0xd4a373, 0.72, 0.04, undefined, 0x3b2312, 0.15);

  // 六条向四周舒展的大枝
  const branchCount = 6;
  for (let b = 0; b < branchCount; b++) {
    const ang = (b / branchCount) * TAU + seed * 0.7;
    const len = 2.3 + hash(seed * 13 + b) * 1.1;
    const startY = 2.25 + (b % 3) * 0.42;
    const endX = Math.cos(ang) * len;
    const endZ = Math.sin(ang) * len;
    const endY = startY + 0.85 + hash(seed * 7 + b) * 0.55;
    const bc = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, startY, 0),
      new THREE.Vector3(endX * 0.48, startY + 0.62, endZ * 0.48),
      new THREE.Vector3(endX, endY, endZ),
    ]);
    group.add(new THREE.Mesh(new THREE.TubeGeometry(bc, 12, 0.14, 7, false), trunkMat));

    // 每枝簇拥多层花团
    for (let k = 0; k < 7; k++) {
      const f = 0.45 + (k / 7) * 0.68;
      const ox = (hash(seed * 31 + b * 11 + k) - 0.5) * 1.25;
      const oy = (hash(seed * 41 + b * 13 + k) - 0.35) * 0.75;
      const oz = (hash(seed * 53 + b * 17 + k) - 0.5) * 1.25;
      const m = new THREE.Mesh(puffGeo, k % 3 === 0 ? pinkLight : k % 3 === 1 ? pinkMid : pinkDeep);
      const sx = 0.72 + hash(b * 19 + k) * 0.52;
      m.position.set(endX * f + ox, startY + 0.55 + (endY - startY) * f * 0.55 + oy, endZ * f + oz);
      m.scale.set(sx * 1.22, sx * 0.72, sx * 1.18);
      m.rotation.set(hash(k) * 0.5, ang + k, 0);
      crown.add(m);
    }

    // 低枝垂挂红绸与木牌（对应「放不下的是牵挂」「樱花树下的约定」）
    if (withRibbons) {
      for (let ri = 0; ri < 2; ri++) {
        const rf = 0.52 + ri * 0.32;
        const piv = new THREE.Group();
        piv.position.set(endX * rf, startY + 0.38, endZ * rf);
        const stripLen = 0.85 + hash(b * 9 + ri) * 0.55;
        const strip = new THREE.Mesh(new THREE.PlaneGeometry(0.085, stripLen, 1, 4), ribbonMat);
        strip.position.y = -stripLen * 0.5;
        piv.add(strip);
        if (ri === 0) {
          const plaque = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.16, 0.025), plaqueMat);
          plaque.position.y = -0.24;
          piv.add(plaque);
        }
        piv.userData.phase = b * 1.3 + ri * 2.1;
        group.add(piv);
        ribbons.push(piv);
      }
    }
  }

  // 顶部主花冠
  for (let k = 0; k < 10; k++) {
    const a = (k / 10) * TAU;
    const rad = k < 3 ? 0.45 : 1.25;
    const m = new THREE.Mesh(puffGeo, k % 2 === 0 ? pinkLight : pinkMid);
    const s = 0.95 + hash(seed + k * 5) * 0.45;
    m.position.set(Math.cos(a) * rad, 4.15 + (k < 3 ? 0.55 : 0.12) + hash(k * 3) * 0.3, Math.sin(a) * rad);
    m.scale.set(s * 1.28, s * 0.78, s * 1.25);
    crown.add(m);
  }

  group.scale.setScalar(scale);
  return { group, ribbons, crown };
}

export function swayRibbons(ribbons: THREE.Group[], t: number, wind = 1) {
  for (const r of ribbons) {
    const ph = r.userData.phase ?? 0;
    r.rotation.z = (0.12 + Math.sin(t * 2.1 + ph) * 0.16) * wind;
    r.rotation.x = Math.cos(t * 1.6 + ph * 0.7) * 0.08 * wind;
  }
}

/** 古朴石灯笼（带暖色透光灯室与辉光） */
export function buildStoneLantern(scale = 1, lightCol = 0xffc978) {
  const g = new THREE.Group();
  const sm = stdMat(0x767a82, 0.92, 0.02, stoneTex());
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 0.18, 6), sm);
  base.position.y = 0.09;
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.78, 6), sm);
  post.position.y = 0.56;
  const tray = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.2, 0.1, 6), sm);
  tray.position.y = 0.98;
  const fire = new THREE.Mesh(
    new THREE.CylinderGeometry(0.16, 0.16, 0.28, 6),
    new THREE.MeshBasicMaterial({ color: lightCol }),
  );
  fire.position.y = 1.16;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(0.44, 0.26, 6), sm);
  roof.position.y = 1.42;
  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 8), sm);
  finial.position.y = 1.58;
  g.add(base, post, tray, fire, roof, finial);
  const glow = addGlow(g, lightCol, 1.45, 0.62, 1.16);
  g.userData.glow = glow;
  g.scale.setScalar(scale);
  return g;
}

/** 宫灯 / 红绸喜灯 / 孔明灯 */
export function buildSilkLantern(color = 0xff5a5f, glowCol = 0xffb86b, scale = 1) {
  const g = new THREE.Group();
  const capMat = stdMat(0x3a2318, 0.6, 0.25);
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 14, 10),
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.4,
      emissive: glowCol,
      emissiveIntensity: 0.85,
    }),
  );
  body.scale.set(1, 1.18, 1);
  const top = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.06, 10), capMat);
  top.position.y = 0.28;
  const bot = top.clone();
  bot.position.y = -0.28;
  const tassel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.04, 0.28, 6),
    stdMat(0xd92638, 0.5, 0, undefined, 0x6e1018, 0.3),
  );
  tassel.position.y = -0.44;
  g.add(body, top, bot, tassel);
  addGlow(g, glowCol, 1.25, 0.55, 0);
  g.scale.setScalar(scale);
  return g;
}

/** 水面河灯 / 绽放玉莲（用于竹涧流觞、妙曲生花、水中央、不悲不喜） */
export function buildLotusLamp(petalCol = 0xffb3d1, coreCol = 0xffe599, scale = 1, withLeaf = true) {
  const g = new THREE.Group();
  if (withLeaf) {
    const leaf = new THREE.Mesh(
      new THREE.CylinderGeometry(0.34, 0.34, 0.02, 14),
      stdMat(0x2f6b55, 0.75, 0.04),
    );
    g.add(leaf);
  }
  const pMat = new THREE.MeshStandardMaterial({
    color: petalCol,
    roughness: 0.35,
    emissive: petalCol,
    emissiveIntensity: 0.42,
    side: THREE.DoubleSide,
  });
  const pGeo = new THREE.ConeGeometry(0.09, 0.26, 5);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * TAU;
    const p = new THREE.Mesh(pGeo, pMat);
    p.position.set(Math.cos(a) * 0.14, 0.09, Math.sin(a) * 0.14);
    p.rotation.z = -Math.cos(a) * 0.65;
    p.rotation.x = Math.sin(a) * 0.65;
    g.add(p);
  }
  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.09, 10, 8),
    new THREE.MeshBasicMaterial({ color: coreCol }),
  );
  core.position.y = 0.1;
  g.add(core);
  addGlow(g, coreCol, 0.95, 0.58, 0.14);
  g.scale.setScalar(scale);
  return g;
}

/** 七弦瑶琴与青石琴案（对应「是谁妙曲生花 / 我十指谈笑风华 / 让这新曲飘过万里」） */
export function buildGuqinTable() {
  const g = new THREE.Group();
  const stone = stdMat(0x5c6668, 0.88, 0.04, stoneTex());
  const legL = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.62, 0.68), stone);
  legL.position.set(-0.78, 0.31, 0);
  const legR = legL.clone();
  legR.position.x = 0.78;
  const top = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.12, 0.82), stone);
  top.position.y = 0.66;
  g.add(legL, legR, top);

  // 紫檀漆身瑶琴
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(1.58, 0.075, 0.34),
    stdMat(0x2c1618, 0.28, 0.18, undefined, 0x1a080a, 0.2),
  );
  body.position.set(-0.08, 0.76, 0);
  g.add(body);

  // 七根金丝琴弦
  const strMat = new THREE.MeshBasicMaterial({ color: 0xffe49e });
  const strings: THREE.Mesh[] = [];
  for (let i = 0; i < 7; i++) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.008, 0.008), strMat);
    s.position.set(-0.08, 0.806, -0.11 + i * 0.036);
    g.add(s);
    strings.push(s);
  }

  // 小博山香炉
  const censer = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.06, 0.12, 10),
    stdMat(0xc99a5b, 0.35, 0.65),
  );
  censer.position.set(0.84, 0.78, -0.12);
  g.add(censer);
  addGlow(g, 0xffe8b0, 0.7, 0.35, 0.85);
  g.userData.strings = strings;
  return g;
}

/** 噬血龙剑（赤玉宽刃 + 血槽流光 + 双角金龙吞口护手 + 飘动红穗） */
export function buildDragonSword(scale = 1) {
  const g = new THREE.Group();
  // 剑身（剑尖朝下插于祭坛时，y=0 为入石处，向上延伸）
  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0xd92b4b,
    roughness: 0.2,
    metalness: 0.78,
    emissive: 0x9e0b28,
    emissiveIntensity: 0.72,
  });
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.22, 2.05, 0.045), bladeMat);
  blade.position.y = 1.02;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.155, 0.38, 4), bladeMat);
  tip.rotation.x = Math.PI;
  tip.rotation.y = Math.PI / 4;
  tip.scale.z = 0.28;
  tip.position.y = -0.14;
  // 中脊赤金血槽光条
  const core = new THREE.Mesh(
    new THREE.BoxGeometry(0.045, 1.88, 0.055),
    new THREE.MeshBasicMaterial({ color: 0xff8fa3 }),
  );
  core.position.y = 1.05;

  // 金龙双翼护手
  const goldMat = stdMat(0xf4b942, 0.25, 0.82, undefined, 0x7a4408, 0.35);
  const guard = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.14, 0.14), goldMat);
  guard.position.y = 2.08;
  for (const dir of [-1, 1]) {
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.42, 6), goldMat);
    horn.position.set(dir * 0.42, 2.22, 0);
    horn.rotation.z = -dir * 0.85;
    g.add(horn);
  }
  const ruby = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), new THREE.MeshBasicMaterial({ color: 0xff2a55 }));
  ruby.position.set(0, 2.08, 0.06);

  // 剑柄与剑首
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.06, 0.56, 8), stdMat(0x3a0f18, 0.6, 0.2));
  grip.position.y = 2.42;
  const pommel = new THREE.Mesh(new THREE.OctahedronGeometry(0.1, 0), goldMat);
  pommel.position.y = 2.74;

  // 剑柄红穗（对应「儿女情长看不断」）
  const tassel = new THREE.Group();
  tassel.position.set(0.05, 2.72, 0);
  const ribbon = new THREE.Mesh(
    new THREE.PlaneGeometry(0.08, 0.92),
    new THREE.MeshBasicMaterial({ color: 0xff335c, side: THREE.DoubleSide }),
  );
  ribbon.position.set(0.18, -0.42, 0);
  ribbon.rotation.z = 0.35;
  tassel.add(ribbon);

  g.add(blade, tip, core, guard, ruby, grip, pommel, tassel);
  const glow = addGlow(g, 0xff2e5b, 2.6, 0.55, 1.35);
  g.userData.tassel = tassel;
  g.userData.glow = glow;
  g.scale.setScalar(scale);
  return g;
}

/** 临水飞檐轻纱榭（对应「是谁拨乱丝发 / 我愁思默语不答」） */
export function buildPavilion() {
  const g = new THREE.Group();
  const wood = stdMat(0x6e2c2b, 0.65, 0.08);
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.35, 0.32, 6), stdMat(0x52392e, 0.8));
  deck.position.y = 0.16;
  g.add(deck);

  const curtains: THREE.Mesh[] = [];
  const silkMat = new THREE.MeshStandardMaterial({
    color: 0xf8eef6,
    transparent: true,
    opacity: 0.34,
    roughness: 0.3,
    emissive: 0x8a7aa8,
    emissiveIntensity: 0.25,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + Math.PI / 6;
    const x = Math.cos(a) * 2.65, z = Math.sin(a) * 2.65;
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 2.85, 10), wood);
    col.position.set(x, 1.72, z);
    g.add(col);

    // 随风轻纱帷幔（留出正面观景口）
    if (i !== 1 && i !== 2) {
      const na = ((i + 1) / 6) * TAU + Math.PI / 6;
      const mx = (x + Math.cos(na) * 2.65) * 0.5;
      const mz = (z + Math.sin(na) * 2.65) * 0.5;
      const veil = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 2.55, 4, 6), silkMat);
      veil.position.set(mx, 2.95, mz);
      veil.geometry.translate(0, -1.25, 0);
      veil.lookAt(0, 2.95, 0);
      veil.userData.phase = i * 1.4;
      g.add(veil);
      curtains.push(veil);
    }
  }

  // 双层飞檐黛瓦顶
  const tileMat = stdMat(0x283040, 0.55, 0.18);
  const roof1 = new THREE.Mesh(new THREE.ConeGeometry(3.85, 1.15, 6), tileMat);
  roof1.position.y = 3.65;
  roof1.rotation.y = Math.PI / 6;
  const roof2 = new THREE.Mesh(new THREE.ConeGeometry(2.35, 0.95, 6), tileMat);
  roof2.position.y = 4.45;
  roof2.rotation.y = Math.PI / 6;
  const topOrn = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), stdMat(0xe6b85c, 0.3, 0.7));
  topOrn.position.y = 5.02;
  g.add(roof1, roof2, topOrn);

  const lantern = buildSilkLantern(0xffd7a8, 0xffb35c, 0.88);
  lantern.position.set(0, 2.72, 0.4);
  g.add(lantern);

  g.userData.curtains = curtains;
  return g;
}

/** 江南石拱月桥（对应「若晴呐若雨 / 爱恨情仇千万缕 / 万灯升空」） */
export function buildArchBridge(span = 9.2, archH = 1.65, width = 2.2) {
  const g = new THREE.Group();
  const sm = stdMat(0x888d96, 0.85, 0.05, stoneTex());
  const railMat = stdMat(0xa5aab3, 0.78, 0.05, stoneTex());
  const segs = 18;
  for (let i = 0; i < segs; i++) {
    const u0 = i / segs - 0.5, u1 = (i + 1) / segs - 0.5;
    const um = (u0 + u1) * 0.5;
    const x = um * span;
    const y = Math.cos(um * Math.PI) * archH;
    const dy = Math.cos(u1 * Math.PI) * archH - Math.cos(u0 * Math.PI) * archH;
    const dx = span / segs;
    const len = Math.hypot(dx, dy) * 1.06;
    const ang = Math.atan2(dy, dx);
    const slab = new THREE.Mesh(new THREE.BoxGeometry(len, 0.28, width), sm);
    slab.position.set(x, y, 0);
    slab.rotation.z = ang;
    g.add(slab);

    if (i % 2 === 0 || i === segs - 1) {
      for (const side of [-1, 1]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.68, 0.14), railMat);
        post.position.set(x, y + 0.42, side * (width * 0.46));
        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), railMat);
        cap.position.set(x, y + 0.8, side * (width * 0.46));
        g.add(post, cap);
      }
    }
    for (const side of [-1, 1]) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(len, 0.08, 0.08), railMat);
      bar.position.set(x, y + 0.58, side * (width * 0.46));
      bar.rotation.z = ang;
      g.add(bar);
    }
  }
  return g;
}

export function bridgeY(x: number, span = 9.2, archH = 1.65) {
  const u = Math.max(-0.5, Math.min(0.5, x / span));
  return Math.cos(u * Math.PI) * archH + 0.15;
}

/** 古风油纸伞 */
export function buildOilUmbrella(color = 0x7ec8e3, scale = 1) {
  const g = new THREE.Group();
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1.38, 6), stdMat(0x6f4e37, 0.7));
  handle.position.y = 0.69;
  const canopy = new THREE.Mesh(
    new THREE.ConeGeometry(0.86, 0.32, 16, 1, true),
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.45,
      emissive: color,
      emissiveIntensity: 0.18,
      side: THREE.DoubleSide,
    }),
  );
  canopy.position.y = 1.34;
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.12, 8), stdMat(0x5c3d28, 0.6));
  tip.position.y = 1.54;
  g.add(handle, canopy, tip);
  g.scale.setScalar(scale);
  return g;
}

/** 十里红妆雕花轿（对应「我曾问你何时 / 迎娶禁不得起赞许」） */
export function buildPalanquin(scale = 1) {
  const g = new THREE.Group();
  const redMat = stdMat(0xb81d38, 0.42, 0.12, undefined, 0x4f0816, 0.3);
  const goldMat = stdMat(0xf2be54, 0.28, 0.75, undefined, 0x6b4308, 0.25);
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.18, 1.45), goldMat);
  base.position.y = 0.36;
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.38, 1.55, 1.32), redMat);
  cabin.position.y = 1.22;
  const curtain = new THREE.Mesh(
    new THREE.PlaneGeometry(1.05, 1.32),
    stdMat(0xe63956, 0.38, 0.08, undefined, 0x6e0f22, 0.35),
  );
  curtain.position.set(0, 1.22, 0.67);
  // 轿顶金檐
  const roof = new THREE.Mesh(new THREE.ConeGeometry(1.38, 0.78, 4), redMat);
  roof.position.y = 2.36;
  roof.rotation.y = Math.PI / 4;
  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), goldMat);
  finial.position.y = 2.82;
  // 轿杠与四角喜灯
  for (const side of [-1, 1]) {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 3.6, 8), goldMat);
    pole.rotation.z = Math.PI / 2;
    pole.position.set(0, 0.48, side * 0.76);
    g.add(pole);
  }
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const l = buildSilkLantern(0xff3b5c, 0xffc86b, 0.42);
      l.position.set(sx * 0.88, 1.88, sz * 0.88);
      g.add(l);
    }
  }
  g.add(base, cabin, curtain, roof, finial);
  g.scale.setScalar(scale);
  return g;
}

/** 江湖骏马（可驱动四蹄奔腾，对应「是谁醉酒策马」） */
export interface SteedRig {
  group: THREE.Group;
  legs: THREE.Group[];
  tail: THREE.Mesh;
}
export function buildSteed(scale = 1): SteedRig {
  const group = new THREE.Group();
  const coat = stdMat(0x2d1d1a, 0.58, 0.12);
  const mane = stdMat(0x140c0c, 0.75, 0.05);
  const saddle = stdMat(0xb8293d, 0.48, 0.15, undefined, 0x450b14, 0.25);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(1.65, 0.62, 0.56), coat);
  torso.position.set(0, 1.12, 0);
  const sad = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.14, 0.62), saddle);
  sad.position.set(-0.05, 1.44, 0);
  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.78, 0.36), coat);
  neck.position.set(0.76, 1.56, 0);
  neck.rotation.z = -0.36;
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.3, 0.3), coat);
  head.position.set(1.06, 1.88, 0);
  head.rotation.z = -0.22;
  const maneMesh = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.76, 0.12), mane);
  maneMesh.position.set(0.56, 1.62, 0);
  maneMesh.rotation.z = -0.32;
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.16, 0.16), mane);
  tail.position.set(-1.12, 1.18, 0);
  tail.rotation.z = 0.32;
  group.add(torso, sad, neck, head, maneMesh, tail);

  const legs: THREE.Group[] = [];
  const lPos: [number, number][] = [[0.62, 0.2], [0.62, -0.2], [-0.62, 0.2], [-0.62, -0.2]];
  for (const [lx, lz] of lPos) {
    const piv = new THREE.Group();
    piv.position.set(lx, 0.92, lz);
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.92, 0.15), coat);
    leg.position.y = -0.44;
    piv.add(leg);
    group.add(piv);
    legs.push(piv);
  }
  group.scale.setScalar(scale);
  return { group, legs, tail };
}

export function animateSteed(s: SteedRig, t: number) {
  const w = t * 13.5;
  s.legs[0].rotation.z = Math.sin(w) * 0.68;
  s.legs[1].rotation.z = Math.sin(w + 0.55) * 0.68;
  s.legs[2].rotation.z = Math.sin(w + Math.PI) * 0.68;
  s.legs[3].rotation.z = Math.sin(w + Math.PI + 0.55) * 0.68;
  s.tail.rotation.z = 0.25 + Math.sin(w * 1.2) * 0.22;
  s.group.position.y = Math.abs(Math.sin(w)) * 0.14;
}

/** 陶土酒坛（红布封口） */
export function buildWineJar(scale = 1) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), stdMat(0x6e4736, 0.72, 0.05));
  body.scale.set(1, 1.15, 1);
  body.position.y = 0.3;
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.12, 10), stdMat(0x593728, 0.75));
  neck.position.y = 0.6;
  const cloth = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.14, 8), stdMat(0xc92a3e, 0.55));
  cloth.position.y = 0.68;
  g.add(body, neck, cloth);
  g.scale.setScalar(scale);
  return g;
}

/** 轻燕（双翼拍动 + 剪刀尾，对应「脚踏浮云轻似燕」） */
export interface SwallowRig { group: THREE.Group; wingL: THREE.Mesh; wingR: THREE.Mesh }
export function buildSwallow(scale = 1): SwallowRig {
  const group = new THREE.Group();
  const dark = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, emissive: 0x1e3a5f, emissiveIntensity: 0.35, side: THREE.DoubleSide });
  const body = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.46, 6), dark);
  body.rotation.x = Math.PI / 2;
  const wGeo = new THREE.PlaneGeometry(0.52, 0.18);
  wGeo.translate(0.26, 0, 0);
  const wingR = new THREE.Mesh(wGeo, dark);
  const wGeoL = new THREE.PlaneGeometry(0.52, 0.18);
  wGeoL.translate(-0.26, 0, 0);
  const wingL = new THREE.Mesh(wGeoL, dark);
  for (const s of [-1, 1]) {
    const tf = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.32), dark);
    tf.rotation.x = Math.PI / 2;
    tf.rotation.z = s * 0.28;
    tf.position.set(s * 0.06, 0, -0.32);
    group.add(tf);
  }
  group.add(body, wingL, wingR);
  group.scale.setScalar(scale);
  return { group, wingL, wingR };
}

/** 立体祥云朵（对应「脚踏浮云轻似燕」） */
export function buildCloudPuff(scale = 1, col = 0xf8fafc, emCol = 0x93c5fd) {
  const g = new THREE.Group();
  const m = stdMat(col, 0.65, 0, undefined, emCol, 0.22);
  const geo = new THREE.IcosahedronGeometry(0.65, 1);
  const parts: [number, number, number, number, number][] = [
    [0, 0.1, 0, 1.35, 0.65],
    [-0.68, -0.02, 0.08, 0.95, 0.52],
    [0.72, 0.0, -0.06, 1.0, 0.55],
    [-0.25, 0.25, -0.2, 0.85, 0.52],
    [0.32, 0.22, 0.22, 0.82, 0.48],
  ];
  for (const [x, y, z, sx, sy] of parts) {
    const p = new THREE.Mesh(geo, m);
    p.position.set(x, y, z);
    p.scale.set(sx, sy, sx * 0.85);
    g.add(p);
  }
  g.scale.setScalar(scale);
  return g;
}

/** 破空羽箭（对应「万箭齐发留残伤」） */
export function buildArrow(scale = 1) {
  const g = new THREE.Group();
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 1.45, 5), stdMat(0x8d6e53, 0.7));
  shaft.position.y = 0.72;
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.18, 4), stdMat(0xd4dce6, 0.25, 0.85));
  head.rotation.x = Math.PI;
  head.position.y = 0.02;
  const fletchMat = new THREE.MeshBasicMaterial({ color: 0xf4ece1, side: THREE.DoubleSide });
  for (let i = 0; i < 3; i++) {
    const fl = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.26), fletchMat);
    fl.position.y = 1.32;
    fl.rotation.y = (i * TAU) / 3;
    g.add(fl);
  }
  g.add(shaft, head);
  g.scale.setScalar(scale);
  return g;
}

/** 海角白帆扁舟（对应「我目送海角余霞」） */
export function buildSkiff(scale = 1) {
  const g = new THREE.Group();
  const hull = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.28, 0.68), stdMat(0x4a2f22, 0.78));
  hull.position.y = 0.12;
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 1.95, 6), stdMat(0x5c3a28, 0.7));
  mast.position.set(0.15, 1.1, 0);
  const sail = new THREE.Mesh(
    new THREE.PlaneGeometry(0.95, 1.52, 3, 4),
    new THREE.MeshStandardMaterial({
      color: 0xfff1dc,
      roughness: 0.55,
      emissive: 0xff9e68,
      emissiveIntensity: 0.32,
      side: THREE.DoubleSide,
    }),
  );
  sail.position.set(0.05, 1.22, 0.08);
  sail.rotation.y = 0.25;
  g.add(hull, mast, sail);
  g.scale.setScalar(scale);
  return g;
}

/** 远景层叠青黛群峰环绕（营造立体水墨纵深） */
export function buildMountainRing(count = 18, radius = 38, minH = 6, maxH = 16, color = 0x2c3852, seed = 7) {
  const g = new THREE.Group();
  const mat = stdMat(color, 0.94, 0.02);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * TAU + (hash(seed + i) - 0.5) * 0.22;
    const h = minH + hash(seed * 5 + i * 3) * (maxH - minH);
    const w = 5.5 + hash(seed * 9 + i) * 6.5;
    const d = radius + (hash(seed * 13 + i) - 0.5) * 8;
    const peak = new THREE.Mesh(new THREE.ConeGeometry(w, h, 7), mat);
    peak.position.set(Math.cos(a) * d, h * 0.42 - 1.2, Math.sin(a) * d);
    peak.scale.set(1.3, 1, 0.75);
    peak.rotation.y = a + Math.PI / 2;
    g.add(peak);
  }
  return g;
}
