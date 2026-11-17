// 《慌啥子嘛》原创 3D 布景与歌词语义道具库
// 风格传承《童话镇》墨线卡通立体绘本，但元素完全根据歌词意境全新打造（川渝坝坝茶·落日升月·云花好运·星枕晚风·各自节拍）
import * as THREE from 'three';
import {
  PI,
  TAU,
  ball,
  box,
  canvasTex,
  centerBox,
  clamp01,
  cone,
  cssHex,
  cyl,
  disc,
  faceted,
  glowMat,
  hash,
  lerp,
  many,
  mesh,
  put,
  ringDisc,
  roof,
  setOp,
  sprite,
  toon,
  toonMap,
  toonUnique,
  torus,
} from './kit';
import { FONT } from './fonts';

// ---------- 1. 远山、丘陵与蓬松云朵 ----------
export function hill(r: number, h: number, color: number): THREE.Mesh {
  const g = new THREE.SphereGeometry(1, 20, 12, 0, TAU, 0, PI * 0.52);
  g.scale(r, h, r * 0.85);
  return mesh(g, toon(color), 0);
}

export function mountainBackdrop(
  parent: THREE.Object3D,
  c1 = 0x6fb38a,
  c2 = 0x5c96b8,
  withClouds = true,
  radius = 165
) {
  many(14, (i) => {
    const a = (i / 14) * TAU + 0.18;
    const r = 34 + hash(i * 3.1) * 32;
    const h = 15 + hash(i * 5.7 + 2) * 24;
    put(
      parent,
      hill(r, h, i % 2 === 0 ? c1 : c2),
      Math.cos(a) * radius,
      -1,
      Math.sin(a) * radius
    );
  });
  if (withClouds) {
    many(8, (i) => {
      put(
        parent,
        cloudPuff(i * 7 + 1, 1.8 + hash(i + 4) * 1.6),
        -105 + i * 30,
        26 + hash(i + 9) * 16,
        -95 - hash(i + 2) * 35
      );
    });
  }
}

export function cloudPuff(seed = 1, s = 1, color = 0xffffff): THREE.Group {
  const g = new THREE.Group();
  const puffs: [number, number, number, number][] = [
    [0, 0.25, 0, 1.05],
    [-0.95, 0.05, 0.08, 0.78],
    [0.98, 0.08, -0.05, 0.82],
    [-0.45, 0.52, -0.1, 0.72],
    [0.48, 0.48, 0.1, 0.74],
  ];
  puffs.forEach(([x, y, z, r], i) => {
    const jitter = (hash(seed + i * 2.3) - 0.5) * 0.14;
    put(g, ball(r + jitter, color, false, 0.045), x, y, z);
  });
  g.scale.setScalar(s);
  return g;
}

// ---------- 2. 序章/尾声：山城茶话立体绘本 ----------
export function teaStorybook() {
  const g = new THREE.Group();
  // 底封（温润竹青布面 + 金边）
  put(g, box(8.6, 0.26, 6.2, 0x2d5e52, 0.05), 0, 0, 0);
  // 内页书芯
  put(g, box(8.1, 0.52, 5.7, 0xfff7e6, 0.045), 0, 0.24, 0);
  // 书脊
  put(g, box(0.45, 0.82, 6.24, 0x8a4b2a, 0.045), -4.15, 0, 0);
  // 中缝折痕
  put(g, box(0.08, 0.55, 5.66, 0xd8c8a8, 0), 0, 0.25, 0);

  // 书页发光光幕
  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(7.4, 5.0).rotateX(-PI / 2),
    glowMat(0xffdf8e, 0, true)
  );
  glow.position.set(0.1, 0.82, 0);
  g.add(glow);

  // 书心弹起的迷你立体山城茶亭纸雕
  const popup = new THREE.Group();
  popup.position.set(0.2, 0.76, -0.2);
  put(popup, hill(1.5, 1.3, 0x73bf86), -1.4, 0, -0.9);
  put(popup, hill(1.3, 1.0, 0x5ea3b8), 1.5, 0, -0.8);
  put(popup, box(1.5, 0.9, 1.1, 0xfff2dc, 0.03), 0, 0, 0.1);
  put(popup, roof(1.9, 1.45, 0.65, 0x3b4d5e), 0, 0.88, 0.1);
  put(popup, ball(0.36, 0xffb347, false, 0.025), 1.4, 1.55, -0.6);
  g.add(popup);

  // 可翻开的上封面（绕左侧书脊旋转）
  const cover = new THREE.Group();
  cover.position.set(-4.1, 0.78, 0);
  const coverBoard = box(8.4, 0.22, 6.2, 0x2d5e52, 0.05);
  coverBoard.position.set(4.2, 0, 0);
  cover.add(coverBoard);

  // 封面烫金题签「慢慢来」
  const labelTex = canvasTex(256, 128, (c) => {
    c.fillStyle = '#fff5dc';
    c.fillRect(0, 0, 256, 128);
    c.strokeStyle = '#d4943a';
    c.lineWidth = 10;
    c.strokeRect(10, 10, 236, 108);
    c.font = `900 56px ${FONT}`;
    c.fillStyle = '#3b2418';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('慢慢来', 128, 66);
  });
  const plaque = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 1.6).rotateX(-PI / 2),
    new THREE.MeshBasicMaterial({ map: labelTex })
  );
  plaque.position.set(4.3, 0.235, 0.1);
  cover.add(plaque);
  g.add(cover);

  return { g, cover, glow, popup };
}

// ---------- 3. 川渝青瓦坝坝茶馆、竹桌竹椅、盖碗茶、茶旗、红灯笼 ----------
function chineseSignTex(text: string, bg: number, fg: number, border: number): THREE.CanvasTexture {
  const vertical = text.length <= 3;
  const w = vertical ? 128 : 256;
  const h = vertical ? 220 : 112;
  return canvasTex(w, h, (c) => {
    c.fillStyle = cssHex(bg);
    c.fillRect(0, 0, w, h);
    c.strokeStyle = cssHex(border);
    c.lineWidth = 8;
    c.strokeRect(8, 8, w - 16, h - 16);
    c.fillStyle = cssHex(fg);
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    if (vertical && text.length > 1) {
      c.font = `900 54px ${FONT}`;
      [...text].forEach((ch, i) => {
        c.fillText(ch, w / 2, 54 + i * 58);
      });
    } else if (vertical) {
      c.font = `900 88px ${FONT}`;
      c.fillText(text, w / 2, h / 2 + 4);
    } else {
      c.font = `900 54px ${FONT}`;
      c.fillText(text, w / 2, h / 2 + 3);
    }
  });
}

export function redLantern(s = 1, glow = true): THREE.Group {
  const g = new THREE.Group();
  put(g, cyl(0.03, 0.03, 0.35, 0x3a2418, 6, 0), 0, 0.32, 0);
  put(g, cyl(0.18, 0.2, 0.09, 0xd99b26, 10, 0.02), 0, 0.24, 0);
  const body = ball(0.34, 0xe8453c, false, 0.035);
  body.scale.set(1, 0.86, 1);
  put(g, body, 0, 0, 0);
  put(g, cyl(0.2, 0.16, 0.09, 0xd99b26, 10, 0.02), 0, -0.3, 0);
  // 金穗子
  put(g, cyl(0.035, 0.06, 0.26, 0xffc845, 6, 0.015), 0, -0.54, 0);
  if (glow) {
    put(g, sprite('glow', 1.65, 0xffaa44, true, 0.65), 0, 0, 0);
  }
  g.scale.setScalar(s);
  return g;
}

export function teahouse(signText = '茶'): THREE.Group {
  const g = new THREE.Group();
  // 青石台基
  put(g, box(9.4, 0.36, 6.0, 0x9aa3ad, 0.045), 0, 0, 0);
  // 白粉墙 + 木构梁柱
  put(g, box(7.8, 3.4, 4.4, 0xfaf0dc, 0.05), 0, 0.36, -0.35);
  // 深木门洞与暖光格窗
  put(g, box(1.8, 2.5, 0.18, 0x6e3f24, 0.035), 0, 0.36, 1.86);
  put(g, box(1.42, 2.2, 0.2, 0xffd98a, 0), 0, 0.46, 1.88);
  for (const sx of [-1, 1]) {
    put(g, box(1.5, 1.35, 0.16, 0x6e3f24, 0.035), sx * 2.45, 1.35, 1.86);
    put(g, box(1.24, 1.1, 0.18, 0xffe4a3, 0), sx * 2.45, 1.48, 1.88);
    // 窗棂十字
    put(g, box(0.08, 1.15, 0.22, 0x5c331c, 0), sx * 2.45, 1.46, 1.89);
    put(g, box(1.28, 0.08, 0.22, 0x5c331c, 0), sx * 2.45, 2.0, 1.89);
  }
  // 前廊四根木柱
  for (const x of [-3.8, -1.4, 1.4, 3.8]) {
    put(g, cyl(0.14, 0.16, 3.2, 0x754326, 10, 0.035), x, 0.36, 2.35);
  }
  // 双层青瓦大屋顶 + 前廊挑檐
  put(g, roof(9.8, 6.4, 2.1, 0x384959), 0, 3.65, -0.2);
  put(g, box(5.4, 0.24, 0.28, 0x263340, 0.03), 0, 5.55, -0.2);
  const porchEave = box(9.2, 0.18, 1.7, 0x435769, 0.04);
  porchEave.rotation.x = 0.22;
  put(g, porchEave, 0, 3.35, 2.15);

  // 檐下两盏暖红灯笼
  put(g, redLantern(0.85), -2.6, 2.75, 2.55);
  put(g, redLantern(0.85), 2.6, 2.75, 2.55);

  // 木匾额与竹竿招幌「茶」
  const banner = new THREE.Mesh(
    new THREE.PlaneGeometry(1.05, 1.75),
    new THREE.MeshBasicMaterial({
      map: chineseSignTex(signText, 0xfff4d6, 0x592918, 0xc77d2c),
      side: THREE.DoubleSide,
    })
  );
  put(g, cyl(0.06, 0.07, 4.2, 0x8fb058, 8, 0.03), 4.65, 0, 2.3);
  put(g, box(1.4, 0.08, 0.08, 0x8fb058, 0.025), 5.2, 3.95, 2.3);
  put(g, banner, 5.25, 3.0, 2.3);

  return g;
}

export function mountainHouse(seed = 0, warmWindow = true): THREE.Group {
  const g = new THREE.Group();
  const walls = [0xfaf0dc, 0xf7e6cf, 0xedf2f0, 0xffe9d4];
  const roofs = [0x3b4d5e, 0x4c5866, 0x5e4942, 0x355259];
  const w = 2.6 + hash(seed) * 1.1;
  const h = 2.1 + hash(seed + 2) * 1.2;
  const d = 2.3 + hash(seed + 4) * 0.8;
  put(g, box(w, h, d, walls[seed % walls.length], 0.045), 0, 0, 0);
  put(g, roof(w + 0.65, d + 0.65, 1.15, roofs[seed % roofs.length]), 0, h - 0.05, 0);
  const winCol = warmWindow ? 0xffdf85 : 0x9ec5e6;
  for (const sx of [-0.26, 0.26]) {
    put(g, box(0.52, 0.56, 0.1, winCol, 0.025), sx * w, h * 0.52, d / 2 + 0.02);
  }
  put(g, redLantern(0.45, warmWindow), w * 0.38, h - 0.25, d / 2 + 0.3);
  return g;
}

export function bambooTable(s = 1): THREE.Group {
  const g = new THREE.Group();
  // 温润竹编方圆桌
  put(g, box(2.1, 0.14, 1.5, 0xd9a75c, 0.038), 0, 0.88, 0);
  put(g, box(1.9, 0.05, 1.3, 0xeac27a, 0), 0, 1.01, 0);
  for (const [x, z] of [
    [-0.86, -0.58],
    [0.86, -0.58],
    [-0.86, 0.58],
    [0.86, 0.58],
  ]) {
    put(g, cyl(0.07, 0.065, 0.9, 0xb8843e, 8, 0.028), x, 0, z);
  }
  // 竹横枨
  put(g, box(1.75, 0.06, 0.06, 0xb8843e, 0.02), 0, 0.32, 0.58);
  put(g, box(1.75, 0.06, 0.06, 0xb8843e, 0.02), 0, 0.32, -0.58);
  g.scale.setScalar(s);
  return g;
}

export function bambooChair(s = 1): THREE.Group {
  const g = new THREE.Group();
  put(g, box(0.95, 0.1, 0.88, 0xd9a85b, 0.03), 0, 0.48, 0);
  const back = box(0.92, 0.78, 0.09, 0xc99449, 0.03);
  back.rotation.x = -0.24;
  put(g, back, 0, 0.54, -0.42);
  for (const sx of [-0.44, 0.44]) {
    put(g, cyl(0.05, 0.05, 0.5, 0xa87632, 7, 0.022), sx, 0, 0.36);
    put(g, cyl(0.05, 0.05, 0.5, 0xa87632, 7, 0.022), sx, 0, -0.36);
    put(g, box(0.08, 0.07, 0.85, 0xb8843e, 0.02), sx, 0.74, -0.02);
  }
  g.scale.setScalar(s);
  return g;
}

export function gaiwanTea(s = 1): THREE.Group {
  const g = new THREE.Group();
  // 船形茶托
  put(g, cyl(0.26, 0.16, 0.06, 0x9e382b, 12, 0.02), 0, 0, 0);
  // 青花白瓷碗
  put(g, cyl(0.22, 0.13, 0.2, 0xf4f8fc, 12, 0.022), 0, 0.05, 0);
  // 碧绿茶汤
  put(g, disc(0.19, 0x9fd977, 0.24), 0, 0, 0);
  // 微斜碗盖
  const lid = cyl(0.08, 0.2, 0.07, 0xe8f2fa, 12, 0.02);
  lid.rotation.z = 0.22;
  put(g, lid, 0.05, 0.25, 0);
  g.scale.setScalar(s);
  return g;
}

export function flipSign(text: string, bg = 0xfff3d4): THREE.Group {
  const g = new THREE.Group();
  put(g, cyl(0.05, 0.06, 1.35, 0x734427, 8, 0.025), 0, 0, 0);
  const board = box(1.25, 0.68, 0.12, 0x8f5732, 0.03);
  put(g, board, 0, 1.15, 0);
  const face = new THREE.Mesh(
    new THREE.PlaneGeometry(1.12, 0.56),
    new THREE.MeshBasicMaterial({ map: chineseSignTex(text, bg, 0x452215, 0xd48e35) })
  );
  put(g, face, 0, 1.49, 0.07);
  return g;
}

// ---------- 4. 慢慢来小蜗牛 ----------
export function snail3D(s = 1, shellColor = 0xe89454): THREE.Group {
  const g = new THREE.Group();
  // 软糯身体
  const body = ball(0.32, 0xffe4ad, false, 0.032);
  body.scale.set(1.85, 0.58, 0.68);
  put(g, body, 0.08, 0.18, 0);
  // 抬起的小脑袋
  put(g, ball(0.22, 0xffe8ba, false, 0.03), 0.58, 0.34, 0);
  // 一对小触角
  for (const sz of [-0.09, 0.09]) {
    const ant = cyl(0.022, 0.028, 0.26, 0xf2c985, 6, 0.015);
    ant.rotation.z = -0.35;
    put(g, ant, 0.68, 0.48, sz);
    put(g, ball(0.048, 0x3b261c, false, 0), 0.77, 0.72, sz);
  }
  // 螺旋大背壳
  const shell = ball(0.42, shellColor, false, 0.038);
  shell.scale.set(1.05, 1.05, 0.72);
  put(g, shell, -0.08, 0.52, 0);
  const swirl = torus(0.22, 0.055, 0xffd28a, 16, 0.02);
  put(g, swirl, -0.08, 0.52, 0.26);
  const swirl2 = torus(0.22, 0.055, 0xffd28a, 16, 0.02);
  put(g, swirl2, -0.08, 0.52, -0.26);
  g.scale.setScalar(s);
  return g;
}

// ---------- 5. 太阳与立体弯月（太阳下山有月亮爬上来） ----------
export function sun3D(r = 2.2): { g: THREE.Group; rays: THREE.Group } {
  const g = new THREE.Group();
  put(g, sprite('glow', r * 5.2, 0xff9f45, true, 0.72));
  const core = mesh(
    new THREE.SphereGeometry(r, 24, 18),
    toonUnique(0xffb838, 0xff7b24, 0.55),
    0.07
  );
  g.add(core);
  const rays = new THREE.Group();
  many(12, (i) => {
    const a = (i / 12) * TAU;
    const ray = mesh(
      faceted(new THREE.ConeGeometry(r * 0.22, r * 0.68, 4)),
      toonUnique(0xffdf6b, 0xff9e2c, 0.45),
      0.045
    );
    ray.position.set(Math.cos(a) * r * 1.32, Math.sin(a) * r * 1.32, 0);
    ray.rotation.z = a - PI / 2;
    rays.add(ray);
  });
  g.add(rays);
  return { g, rays };
}

export function crescentMoon3D(r = 2.1): THREE.Group {
  const g = new THREE.Group();
  put(g, sprite('glow', r * 4.8, 0xffe896, true, 0.72));
  // 真实挤压 3D 弯月轮廓
  const shape = new THREE.Shape();
  const N = 36;
  for (let i = 0; i <= N; i++) {
    const a = -PI * 0.68 + (i / N) * PI * 1.36;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  for (let i = N; i >= 0; i--) {
    const a = -PI * 0.56 + (i / N) * PI * 1.12;
    const x = r * 0.46 + Math.cos(a) * r * 0.78;
    const y = Math.sin(a) * r * 0.82;
    shape.lineTo(x, y);
  }
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: r * 0.28,
    bevelEnabled: true,
    bevelThickness: r * 0.08,
    bevelSize: r * 0.06,
    bevelSegments: 3,
  });
  geo.center();
  const moonMesh = mesh(geo, toonUnique(0xffe97d, 0xffc845, 0.5), 0.055);
  moonMesh.rotation.z = 0.25;
  g.add(moonMesh);
  // 弯月尖悬挂小金星
  put(g, sprite('star', r * 0.55, 0xfff6bd, true, 0.95), -r * 0.32, r * 0.45, 0.2);
  return g;
}

// ---------- 6. 逐瓣盛开的 3D 花朵、老黄桷树、翠竹、芦苇 ----------
export function bloomFlower(
  petalColor = 0xff82ad,
  height = 0.95,
  s = 1
): { g: THREE.Group; setBloom: (p: number) => void } {
  const g = new THREE.Group();
  put(g, cyl(0.04, 0.05, height, 0x3ea854, 7, 0.02), 0, 0, 0);
  // 两片小绿叶
  for (const sx of [-1, 1]) {
    const lf = ball(0.14, 0x52c468, false, 0.02);
    lf.scale.set(1.5, 0.35, 0.7);
    lf.rotation.z = sx * 0.35;
    put(g, lf, sx * 0.16, height * 0.45, 0);
  }
  const head = new THREE.Group();
  head.position.set(0, height, 0);
  put(head, ball(0.17, 0xffd94a, false, 0.025), 0, 0.04, 0);

  const petals: THREE.Group[] = [];
  many(6, (i) => {
    const piv = new THREE.Group();
    piv.rotation.y = (i / 6) * TAU;
    const p = ball(0.18, petalColor, false, 0.024);
    p.scale.set(0.85, 0.42, 1.38);
    p.position.set(0, 0.04, 0.22);
    piv.add(p);
    head.add(piv);
    petals.push(piv);
  });
  g.add(head);
  g.scale.setScalar(s);

  const setBloom = (raw: number) => {
    const p = clamp01(raw);
    head.scale.setScalar(0.32 + 0.78 * p);
    for (let i = 0; i < petals.length; i++) {
      // p=0 合拢成花苞，p=1 完全舒展盛开
      petals[i].children[0].rotation.x = lerp(-1.15, 0.18, p);
    }
  };
  setBloom(1);
  return { g, setBloom };
}

export function banyanTree(h = 4.6, leafCol = 0x55ba66, seed = 1): THREE.Group {
  const g = new THREE.Group();
  put(g, cyl(h * 0.08, h * 0.13, h * 0.56, 0x7a4e32, 9, 0.045), 0, 0, 0);
  const crowns: [number, number, number, number][] = [
    [0, h * 0.74, 0, h * 0.36],
    [-h * 0.25, h * 0.62, 0.2, h * 0.28],
    [h * 0.26, h * 0.64, -0.15, h * 0.29],
    [0.1, h * 0.88, -0.2, h * 0.25],
  ];
  crowns.forEach(([x, y, z, r], i) => {
    const c = i % 2 === 0 ? leafCol : leafCol + 0x0d1208;
    put(g, ball(r + hash(seed + i) * 0.15, c, true, 0.048), x, y, z);
  });
  return g;
}

export function bambooCluster(h = 5.2, seed = 0): THREE.Group {
  const g = new THREE.Group();
  many(3, (i) => {
    const stalk = new THREE.Group();
    const sh = h * (0.78 + hash(seed + i) * 0.35);
    put(stalk, cyl(0.075, 0.09, sh, 0x4ca866, 8, 0.028), 0, 0, 0);
    // 竹节
    for (let y = 0.9; y < sh - 0.3; y += 0.95) {
      put(stalk, torus(0.088, 0.02, 0x2f7544, 10, 0), 0, y, 0).rotation.x = PI / 2;
    }
    // 竹叶
    for (let k = 0; k < 4; k++) {
      const lf = sprite('leaf', 0.65, 0x78e089);
      lf.position.set((k % 2 ? 1 : -1) * 0.35, sh * (0.55 + k * 0.1), 0.1);
      stalk.add(lf);
    }
    stalk.rotation.z = (i - 1) * 0.06;
    put(g, stalk, (i - 1) * 0.36, 0, (hash(seed + i * 3) - 0.5) * 0.3);
  });
  return g;
}

export function reedStalk(h = 1.65): THREE.Group {
  const g = new THREE.Group();
  put(g, cyl(0.022, 0.032, h, 0xc7a85c, 6, 0.015), 0, 0, 0);
  const plume = ball(0.14, 0xfff0cc, false, 0.02);
  plume.scale.set(0.55, 2.2, 0.55);
  plume.rotation.z = -0.22;
  put(g, plume, 0.06, h + 0.12, 0);
  return g;
}

// ---------- 7. 好运灯亭、四叶草与锦鲤 ----------
export function luckyPavilion(): THREE.Group {
  const g = new THREE.Group();
  put(g, cyl(3.4, 3.6, 0.38, 0xb8ad9e, 6, 0.045), 0, 0, 0);
  many(6, (i) => {
    const a = (i / 6) * TAU + PI / 6;
    put(g, cyl(0.13, 0.15, 3.1, 0x9e382b, 9, 0.035), Math.cos(a) * 2.75, 0.38, Math.sin(a) * 2.75);
    if (i % 2 === 0) {
      put(g, redLantern(0.72), Math.cos(a) * 2.4, 2.85, Math.sin(a) * 2.4);
    }
  });
  const top = cone(3.95, 1.85, 0x3b4d5e, 6, 0.05);
  put(g, top, 0, 3.4, 0);
  put(g, ball(0.28, 0xffcf54, false, 0.03), 0, 5.3, 0);
  return g;
}

export function fourLeafClover3D(s = 1): THREE.Group {
  const g = new THREE.Group();
  put(g, cyl(0.04, 0.05, 0.85, 0x2f9e52, 7, 0.02), 0, 0, 0);
  const head = new THREE.Group();
  head.position.set(0, 0.88, 0);
  head.rotation.x = 0.35;
  many(4, (i) => {
    const a = (i / 4) * TAU + PI / 4;
    const leaf = new THREE.Group();
    leaf.rotation.y = a;
    const l1 = ball(0.2, 0x52de78, false, 0.025);
    const l2 = ball(0.2, 0x52de78, false, 0.025);
    l1.scale.set(0.85, 0.38, 1.2);
    l2.scale.set(0.85, 0.38, 1.2);
    put(leaf, l1, -0.09, 0, 0.24);
    put(leaf, l2, 0.09, 0, 0.24);
    head.add(leaf);
  });
  put(head, ball(0.11, 0xffe875, false, 0.02), 0, 0.06, 0);
  g.add(head);
  g.scale.setScalar(s);
  return g;
}

export function koiFish(color = 0xff7043, s = 1): THREE.Group {
  const g = new THREE.Group();
  const body = ball(0.24, color, false, 0.022);
  body.scale.set(1.9, 0.55, 0.72);
  g.add(body);
  const tail = cone(0.18, 0.32, 0xfff8ee, 5, 0.018);
  tail.rotation.z = -PI / 2;
  put(g, tail, -0.52, 0, 0);
  g.scale.setScalar(s);
  return g;
}

// ---------- 8. 卸下疲惫 & 枕着星光入睡 ----------
export function backpack3D(color = 0xd97b4a, s = 1): THREE.Group {
  const g = new THREE.Group();
  put(g, box(0.86, 1.02, 0.52, color, 0.036), 0, 0, 0);
  // 翻盖与前口袋
  put(g, box(0.88, 0.3, 0.56, 0xb85e32, 0.03), 0, 0.74, 0.02);
  put(g, box(0.64, 0.42, 0.18, 0xf2b26b, 0.028), 0, 0.14, 0.28);
  // 两根皮扣带
  for (const sx of [-0.22, 0.22]) {
    put(g, box(0.09, 0.52, 0.06, 0xfff0cc, 0.015), sx, 0.45, 0.3);
  }
  g.scale.setScalar(s);
  return g;
}

export function footbathTub(s = 1): THREE.Group {
  const g = new THREE.Group();
  put(g, cyl(0.62, 0.5, 0.56, 0xc7894c, 14, 0.035), 0, 0, 0);
  put(g, torus(0.56, 0.035, 0x5c3a21, 16, 0), 0, 0.28, 0).rotation.x = PI / 2;
  put(g, disc(0.56, 0x96e2f5, 0.5), 0, 0, 0);
  // 水面飘两瓣小花
  put(g, sprite('petal', 0.24, 0xffa6c4), 0.18, 0.53, 0.12);
  put(g, sprite('petal', 0.2, 0xffe082), -0.16, 0.53, -0.1);
  g.scale.setScalar(s);
  return g;
}

export function coatRack(): THREE.Group {
  const g = new THREE.Group();
  put(g, disc(0.62, 0x734427, 0.04, 0.03), 0, 0, 0);
  put(g, cyl(0.065, 0.085, 2.75, 0x875230, 9, 0.032), 0, 0, 0);
  many(4, (i) => {
    const a = (i / 4) * TAU + 0.4;
    const arm = cyl(0.035, 0.04, 0.48, 0x875230, 7, 0.02);
    arm.rotation.z = -0.8;
    const piv = new THREE.Group();
    piv.rotation.y = a;
    piv.position.y = 2.35;
    piv.add(arm);
    g.add(piv);
  });
  // 挂着一顶草帽
  const hat = new THREE.Group();
  put(hat, disc(0.48, 0xf5d47a, 0, 0.025));
  put(hat, cyl(0.24, 0.28, 0.22, 0xf5d47a, 12, 0.025), 0, 0, 0);
  hat.rotation.z = -0.55;
  put(g, hat, 0.36, 2.55, 0.12);
  return g;
}

export function starCloudBed(): THREE.Group {
  const g = new THREE.Group();
  // 巨大蓬松云朵床垫
  put(g, cloudPuff(11, 2.4, 0xf5f2ff), 0, 0.2, 0);
  put(g, box(4.6, 0.65, 3.2, 0xfffaf2, 0.045), 0, 0.35, 0);
  // 星光大软枕
  const pillow = ball(1.05, 0xffe89e, false, 0.042);
  pillow.scale.set(1.55, 0.48, 0.88);
  put(g, pillow, 0, 1.18, -0.88);
  // 枕角小绒球
  for (const sx of [-1.45, 1.45]) {
    put(g, ball(0.16, 0xffb8d1, false, 0.025), sx, 1.18, -0.88);
  }
  // 薰衣草星纹软被
  const quilt = box(4.2, 0.34, 2.0, 0x9b8fe8, 0.04);
  put(g, quilt, 0, 0.95, 0.55);
  many(6, (i) => {
    put(
      g,
      sprite('star', 0.38, 0xfff0a3, false, 0.95),
      -1.4 + (i % 3) * 1.4,
      1.34,
      0.1 + Math.floor(i / 3) * 0.9
    );
  });
  return g;
}

// ---------- 9. 纸风车 & 蒲公英 & 桂花酒坛 ----------
export function pinwheel(s = 1): { g: THREE.Group; wheel: THREE.Group } {
  const g = new THREE.Group();
  put(g, cyl(0.035, 0.04, 1.55, 0xd9a86c, 7, 0.02), 0, 0, 0);
  const wheel = new THREE.Group();
  wheel.position.set(0, 1.52, 0.08);
  const cols = [0xff7b89, 0xffd166, 0x72db9e, 0x7cc8ff];
  many(4, (i) => {
    const blade = cone(0.24, 0.56, cols[i], 4, 0.022);
    blade.rotation.z = (i * PI) / 2 + 0.35;
    blade.position.set(Math.cos((i * PI) / 2) * 0.24, Math.sin((i * PI) / 2) * 0.24, 0);
    wheel.add(blade);
  });
  put(wheel, ball(0.1, 0xfff5d6, false, 0.02), 0, 0, 0.06);
  g.add(wheel);
  g.scale.setScalar(s);
  return { g, wheel };
}

export function dandelion3D(s = 1): THREE.Group {
  const g = new THREE.Group();
  put(g, cyl(0.035, 0.045, 1.35, 0x55b867, 7, 0.02), 0, 0, 0);
  const puff = new THREE.Mesh(
    new THREE.SphereGeometry(0.46, 16, 12),
    glowMat(0xfffaf0, 0.52, false)
  );
  put(g, puff, 0, 1.42, 0);
  put(g, ball(0.13, 0xffe082, false, 0.02), 0, 1.42, 0);
  put(g, sprite('glow', 1.35, 0xfff3c4, true, 0.55), 0, 1.42, 0);
  g.scale.setScalar(s);
  return g;
}

export function wineJar(label = '桂'): THREE.Group {
  const g = new THREE.Group();
  const body = ball(0.42, 0x9e5b38, false, 0.035);
  body.scale.set(1, 1.15, 1);
  put(g, body, 0, 0.42, 0);
  // 红布封泥
  put(g, cone(0.3, 0.22, 0xd93b3b, 10, 0.028), 0, 0.82, 0);
  // 菱形斗方酒贴
  const sticker = new THREE.Mesh(
    new THREE.PlaneGeometry(0.36, 0.36),
    new THREE.MeshBasicMaterial({ map: chineseSignTex(label, 0xe8483c, 0xfff3cc, 0xffd166) })
  );
  sticker.rotation.z = PI / 4;
  put(g, sticker, 0, 0.44, 0.43);
  return g;
}

// ---------- 10. 石拱桥、压力气球、小巴士、远方路牌 ----------
export function archBridge(): THREE.Group {
  const g = new THREE.Group();
  const N = 13;
  for (let i = 0; i < N; i++) {
    const u = i / (N - 1) - 0.5;
    const x = u * 11.5;
    const y = Math.cos(u * PI) * 1.45;
    const slab = box(1.05, 0.34, 3.4, 0xd8cfc2, 0.038);
    slab.rotation.z = -Math.sin(u * PI) * 0.34;
    put(g, slab, x, y, 0);
    for (const sz of [-1.52, 1.52]) {
      put(g, box(0.18, 0.72, 0.18, 0xc7bdb0, 0.028), x, y + 0.3, sz);
      put(g, box(1.0, 0.12, 0.16, 0xe6ded3, 0.022), x, y + 0.96, sz).rotation.z = slab.rotation.z;
    }
  }
  return g;
}

export function balloon3D(color = 0xff7b9c, s = 1): THREE.Group {
  const g = new THREE.Group();
  put(g, cyl(0.012, 0.012, 1.45, 0xfff5e6, 5, 0), 0, 0, 0);
  const b = ball(0.45, color, false, 0.032);
  b.scale.set(0.95, 1.15, 0.95);
  put(g, b, 0, 1.85, 0);
  put(g, cone(0.08, 0.1, color, 6, 0.015), 0, 1.32, 0);
  g.scale.setScalar(s);
  return g;
}

export function miniBus(): THREE.Group {
  const g = new THREE.Group();
  // 暖杏黄+奶油白复古小巴士
  put(g, box(3.4, 1.05, 1.75, 0xffbe4f, 0.045), 0, 0.38, 0);
  put(g, box(3.25, 0.88, 1.68, 0xfff7e6, 0.042), 0, 1.38, 0);
  put(g, box(2.4, 0.18, 1.3, 0xd99b43, 0.03), -0.1, 2.26, 0); // 车顶行李架
  // 车窗
  for (const x of [-1.05, -0.25, 0.55]) {
    for (const sz of [-0.85, 0.85]) {
      put(g, box(0.62, 0.52, 0.06, 0x9ed9ff, 0.02), x, 1.56, sz);
    }
  }
  // 前挡风玻璃与暖圆车灯
  put(g, box(0.08, 0.58, 1.38, 0x9ed9ff, 0.02), 1.63, 1.55, 0);
  for (const sz of [-0.56, 0.56]) {
    put(g, ball(0.16, 0xfff0a3, false, 0.02), 1.72, 0.78, sz);
  }
  // 四个轮子
  for (const [x, z] of [
    [-1.05, -0.88],
    [-1.05, 0.88],
    [1.05, -0.88],
    [1.05, 0.88],
  ]) {
    const wh = cyl(0.38, 0.38, 0.24, 0x2c2933, 14, 0.03);
    wh.rotation.x = PI / 2;
    put(g, wh, x, 0.38, z);
  }
  return g;
}

// ---------- 11. 不必事事都完美：缺角开花 3D 拼图 & 锔金茶盏 ----------
export function imperfectPuzzle(): { g: THREE.Group; cornerFlower: { g: THREE.Group; setBloom: (p: number) => void }; loosePiece: THREE.Group } {
  const g = new THREE.Group();
  // 画架木框
  put(g, box(3.4, 3.4, 0.22, 0x8f5b38, 0.045), 0, 0.6, 0);
  put(g, box(2.95, 2.95, 0.14, 0xfff6e6, 0.03), 0, 0.82, 0.12);

  // 2x2 四格立体拼图，右上角故意留空并开出一朵金粉小花！
  const pieces: [number, number, number][] = [
    [-0.68, 1.62, 0xff9eb5],
    [-0.68, 2.96, 0x8fd4ff],
    [0.68, 1.62, 0xffd670],
  ];
  pieces.forEach(([x, y, col]) => {
    put(g, centerBox(1.24, 1.24, 0.26, col, 0.035), x, y, 0.26);
  });

  // 缺角处长出盛放小花
  const cornerFlower = bloomFlower(0xff80ab, 0.72, 1.35);
  cornerFlower.g.rotation.x = 0.55;
  put(g, cornerFlower.g, 0.68, 2.75, 0.25);

  // 落在旁边桌面上轻松歇着的第四块拼图
  const loosePiece = new THREE.Group();
  put(loosePiece, box(1.15, 0.26, 1.15, 0x8ee0a8, 0.035), 0, 0, 0);
  put(g, loosePiece, 2.35, 0, 0.95);

  return { g, cornerFlower, loosePiece };
}

export function kintsugiBowl(s = 1): THREE.Group {
  const g = new THREE.Group();
  put(g, cyl(0.75, 0.42, 0.68, 0xdfeef5, 16, 0.04), 0, 0, 0);
  // 温柔发光的金缮修补纹
  const seam1 = box(0.07, 0.66, 0.08, 0xffd147, 0.015);
  seam1.rotation.z = 0.28;
  put(g, seam1, 0.12, 0.04, 0.62);
  const seam2 = box(0.06, 0.42, 0.08, 0xffd147, 0.015);
  seam2.rotation.z = -0.5;
  put(g, seam2, 0.32, 0.28, 0.56);
  put(g, sprite('star', 0.48, 0xffe87d, true, 0.9), 0.2, 0.52, 0.72);
  g.scale.setScalar(s);
  return g;
}

// ---------- 12. 每个人都有自己的节拍：木制节拍器、大鼓、发光音阶踏板 ----------
export function metronome3D(s = 1): { g: THREE.Group; arm: THREE.Group } {
  const g = new THREE.Group();
  // 胡桃木金字塔机身（纯指针摆锤，不写任何数字）
  put(g, box(1.5, 0.32, 1.3, 0x6e3f24, 0.04), 0, 0, 0);
  put(g, cone(0.95, 2.6, 0x8c5330, 4, 0.045), 0, 0.3, 0);
  // 浅木刻度面板
  const panel = box(0.72, 1.85, 0.08, 0xfff3d9, 0.025);
  panel.rotation.x = -0.22;
  put(g, panel, 0, 0.52, 0.48);

  const arm = new THREE.Group();
  arm.position.set(0, 0.58, 0.62);
  put(arm, box(0.07, 1.95, 0.05, 0xd9d2c5, 0.02), 0, 0, 0);
  put(arm, centerBox(0.28, 0.24, 0.14, 0xffc845, 0.025), 0, 1.18, 0.03);
  g.add(arm);
  g.scale.setScalar(s);
  return { g, arm };
}

export function rhythmPad(color: number, r = 0.95): { g: THREE.Group; top: THREE.Mesh; ring: THREE.Mesh } {
  const g = new THREE.Group();
  put(g, cyl(r, r * 1.06, 0.18, 0x2e2647, 18, 0.035), 0, 0, 0);
  const top = mesh(
    new THREE.CylinderGeometry(r * 0.86, r * 0.86, 0.12, 18),
    toonUnique(color, color, 0.35),
    0.028
  );
  top.position.y = 0.2;
  const ring = ringDisc(r * 0.95, r * 1.18, color, 0.03);
  g.add(top, ring);
  return { g, top, ring };
}

// ---------- 13. 得不到就放开：孔明灯、折纸飞机、折纸船 ----------
export function skyLantern(s = 1): THREE.Group {
  const g = new THREE.Group();
  const mat = toonUnique(0xffb84d, 0xff7b24, 0.62);
  const body = mesh(new THREE.CylinderGeometry(0.46, 0.34, 0.92, 8), mat, 0.03);
  body.position.y = 0.46;
  g.add(body);
  put(g, sprite('glow', 2.2, 0xffcf6b, true, 0.8), 0, 0.42, 0);
  put(g, sprite('drop', 0.28, 0xfff5b8, true, 0.95), 0, 0.08, 0);
  g.scale.setScalar(s);
  return g;
}

export function paperPlane(s = 1, color = 0xfffaf2): THREE.Group {
  const g = new THREE.Group();
  const pos = new Float32Array([
    // 左翼
    0, 0.05, 0.9, -0.62, 0.14, -0.55, 0, 0.04, -0.45,
    // 右翼
    0, 0.05, 0.9, 0, 0.04, -0.45, 0.62, 0.14, -0.55,
    // 龙骨
    0, 0.05, 0.9, 0, -0.22, -0.42, 0, 0.04, -0.45,
  ]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshToonMaterial({ color, side: THREE.DoubleSide }));
  g.add(m);
  g.scale.setScalar(s);
  return g;
}

export function paperBoat(s = 1, color = 0xfff8eb): THREE.Group {
  const g = new THREE.Group();
  const hull = cone(0.75, 0.42, color, 4, 0.032);
  hull.rotation.x = PI;
  hull.scale.set(0.62, 1, 1.55);
  put(g, hull, 0, 0.42, 0);
  put(g, cone(0.36, 0.56, 0xffecc7, 4, 0.028), 0, 0.32, 0);
  put(g, sprite('glow', 1.2, 0xffd97d, true, 0.55), 0, 0.45, 0);
  g.scale.setScalar(s);
  return g;
}

// ---------- 14. 一切都是最好的安排：四时同心圆广场 & 暖金烟花 ----------
export function sundialPlaza(): { g: THREE.Group; ring: THREE.Group } {
  const g = new THREE.Group();
  // 同心石砖圆台
  put(g, cyl(9.2, 9.6, 0.28, 0xf2e4cc, 36, 0.05), 0, 0, 0);
  put(g, ringDisc(6.8, 7.35, 0xffcf6b, 0.3), 0, 0, 0);
  put(g, ringDisc(3.8, 4.15, 0xf29f6d, 0.3), 0, 0, 0);

  // 可缓慢转动的四时星月灯环
  const ring = new THREE.Group();
  many(8, (i) => {
    const a = (i / 8) * TAU;
    const x = Math.cos(a) * 8.1;
    const z = Math.sin(a) * 8.1;
    put(ring, cyl(0.09, 0.11, 2.8, 0x7a4829, 8, 0.03), x, 0.28, z);
    put(ring, redLantern(0.76), x, 2.95, z);
  });
  g.add(ring);
  return { g, ring };
}

export class WarmFireworks {
  readonly g = new THREE.Group();
  private readonly bursts: { cx: number; cy: number; cz: number; t0: number; sparks: THREE.Sprite[] }[] = [];

  constructor(count = 5) {
    const palette = [0xffd86b, 0xff94b2, 0x8fe6c8, 0x9ed4ff, 0xffb36b];
    for (let b = 0; b < count; b++) {
      const col = palette[b % palette.length];
      const sparks = many(18, () => {
        const sp = sprite('star', 0.72, col, true, 0);
        this.g.add(sp);
        return sp;
      });
      this.bursts.push({
        cx: (b - (count - 1) / 2) * 5.2,
        cy: 9.5 + (b % 2) * 2.8,
        cz: -16 - (b % 3) * 3,
        t0: b * 0.55,
        sparks,
      });
    }
  }

  update(localT: number) {
    this.bursts.forEach((b, bi) => {
      const cycle = 2.6;
      const raw = localT - b.t0;
      if (raw < 0) {
        b.sparks.forEach((s) => setOp(s, 0));
        return;
      }
      const p = (raw % cycle) / cycle;
      const r = Math.pow(p, 0.58) * 4.8;
      const fade = clamp01(1 - p * 1.15);
      b.sparks.forEach((sp, i) => {
        const a = (i / b.sparks.length) * TAU + bi * 0.4;
        const el = ((i % 3) - 1) * 0.42;
        sp.position.set(
          b.cx + Math.cos(a) * Math.cos(el) * r,
          b.cy + Math.sin(a) * r * 0.85 - p * p * 1.6,
          b.cz + Math.sin(el) * r
        );
        sp.scale.setScalar(0.35 + fade * 0.65);
        setOp(sp, fade * 0.95);
      });
    });
  }
}

// 温暖木纹地板贴图（归家玄关 / 画室用）
let woodFloorTex: THREE.CanvasTexture | null = null;
export function woodenFloor(w = 24, d = 18): THREE.Mesh {
  if (!woodFloorTex) {
    woodFloorTex = canvasTex(128, 128, (c) => {
      c.fillStyle = '#c9935b';
      c.fillRect(0, 0, 128, 128);
      for (let i = 0; i < 8; i++) {
        c.fillStyle = i % 2 ? 'rgba(90,48,20,0.1)' : 'rgba(255,235,200,0.08)';
        c.fillRect(0, i * 16, 128, 15);
        c.fillStyle = 'rgba(65,32,12,0.28)';
        c.fillRect(0, i * 16 + 15, 128, 1);
      }
    });
    woodFloorTex.wrapS = woodFloorTex.wrapT = THREE.RepeatWrapping;
    woodFloorTex.repeat.set(6, 5);
  }
  const g = new THREE.PlaneGeometry(w, d);
  g.rotateX(-PI / 2);
  return new THREE.Mesh(g, toonMap(woodFloorTex));
}
