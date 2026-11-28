import * as THREE from 'three';
import {
  FONT, PI, TAU, ball, basic, box, canvasTex, cone, cyl, faceted, glowMat, many, mesh, put, rnd, toon, txt,
} from './engine';
import { wheel } from './sets3d';

export const PAL = {
  mag: 0xf0128a, magD: 0xa80c63, pinkL: 0xff7cc4,
  gold: 0xffc233, goldD: 0x9c6a12, goldL: 0xffe484, wood: 0x6b4630, woodD: 0x3a2418,
  red: 0xd61e2a, redD: 0x6a0610, rose: 0xff5c8a, ink: 0x0b0a0c,
  paper: 0xfff6e0, paperD: 0xe6d4ae, white: 0xffffff, silver: 0xd9e2f2,
};

/** 3D 细长连线柱 */
export function bar3D(x1: number, y1: number, x2: number, y2: number, th: number, color: number, basicMat = false) {
  const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy);
  const g = new THREE.BoxGeometry(len, th, th);
  const m = basicMat ? new THREE.Mesh(g, basic(color)) : mesh(g, toon(color), th * 0.15);
  m.position.set((x1 + x2) / 2, (y1 + y2) / 2, 0);
  m.rotation.z = Math.atan2(dy, dx);
  return m;
}

/** 3D 立体纸板王子（舞台道具感：带背面木撑杆和金冠） */
export function prince3D(c = 0xdcb86a) {
  const g = new THREE.Group();
  // 底座与木撑杆
  put(g, box(1.2, 0.14, 0.7, PAL.woodD), 0, 0, 0);
  put(g, box(0.1, 2.2, 0.1, PAL.wood), 0, 0.14, -0.18);
  // 披风与躯干（立起来的厚纸板）
  put(g, box(1.3, 1.55, 0.08, 0x2456c8), 0, 0.25, -0.07);
  put(g, box(0.96, 1.75, 0.12, c), 0, 0.14, 0);
  const sash = box(1.06, 0.22, 0.14, PAL.goldL, 0.02); sash.position.set(0, 1.08, 0.01); sash.rotation.z = -0.68; g.add(sash);
  put(g, ball(0.42, c), 0, 2.18, 0);
  // 瓦楞纸横纹脸（故意没表情）
  for (let i = 0; i < 3; i++) put(g, box(0.45, 0.03, 0.04, 0xb89045, 0), 0, 2.04 + i * 0.13, 0.39);
  put(g, crown3D(0.78), 0, 2.52, 0);
  return g;
}

/** 3D 立体王冠 */
export function crown3D(s = 1, color = PAL.gold) {
  const g = new THREE.Group();
  put(g, cyl(0.55 * s, 0.48 * s, 0.38 * s, color, 8), 0, 0, 0);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU;
    put(g, cone(0.14 * s, 0.34 * s, PAL.goldL, 5), Math.cos(a) * 0.45 * s, 0.34 * s, Math.sin(a) * 0.45 * s);
    put(g, ball(0.065 * s, 0xfff3b0, true, 0.015), Math.cos(a) * 0.45 * s, 0.68 * s, Math.sin(a) * 0.45 * s);
  }
  put(g, ball(0.09 * s, 0xe63946, true, 0.02), 0, 0.18 * s, 0.51 * s);
  return g;
}

/** 3D 低多边形大灰狼（含可开合下颚与红瞳） */
export function wolf3D(bodyCol = 0x1a1426, eyeCol = 0xff2d4a) {
  const g = new THREE.Group();
  const body = put(g, ball(1.05, bodyCol, true), 0.7, 1.15, 0); body.scale.set(1.45, 0.95, 0.85);
  const head = new THREE.Group(); put(g, head, -0.6, 1.85, 0);
  put(head, ball(0.75, bodyCol, true), 0, 0, 0);
  // 双耳
  for (const s of [-1, 1]) {
    const ear = cone(0.24, 0.75, bodyCol, 4); ear.position.set(0.15, 0.6, s * 0.38); ear.rotation.z = -0.15; head.add(ear);
    put(head, ball(0.11, eyeCol, false, 0), -0.42, 0.2, s * 0.36);
    put(head, spriteGlow(0.65, eyeCol), -0.45, 0.2, s * 0.38);
  }
  // 上颚
  const snout = put(head, box(0.95, 0.36, 0.56, bodyCol), -0.78, -0.08, 0);
  for (let i = 0; i < 3; i++) for (const s of [-1, 1]) put(snout, cone(0.06, 0.22, 0xfff6ee, 5, 0.01), -0.35 + i * 0.26, -0.14, s * 0.2).rotation.x = PI;
  // 可动下颚
  const jaw = new THREE.Group(); jaw.position.set(-0.22, -0.24, 0); head.add(jaw);
  put(jaw, box(0.86, 0.24, 0.46, bodyCol), -0.52, -0.1, 0);
  for (let i = 0; i < 3; i++) for (const s of [-1, 1]) put(jaw, cone(0.055, 0.2, 0xfff6ee, 5, 0.01), -0.82 + i * 0.24, 0.14, s * 0.17);
  // 蓬松狼尾与四肢
  const tail = put(g, cone(0.32, 1.4, bodyCol, 5), 2.1, 1.35, 0); tail.rotation.z = -0.9;
  for (const [x, z] of [[-0.1, 0.45], [-0.1, -0.45], [1.4, 0.42], [1.4, -0.42]]) put(g, box(0.28, 1.0, 0.28, bodyCol), x, 0, z);
  g.userData.jaw = jaw; g.userData.head = head;
  return g;
}
function spriteGlow(size: number, color: number) {
  const m = new THREE.SpriteMaterial({ color, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false });
  const cv = document.createElement('canvas'); cv.width = 32; cv.height = 32; const c = cv.getContext('2d')!;
  const gr = c.createRadialGradient(16, 16, 0, 16, 16, 16);
  gr.addColorStop(0, '#fff'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = gr; c.fillRect(0, 0, 32, 32);
  m.map = new THREE.CanvasTexture(cv);
  const sp = new THREE.Sprite(m); sp.scale.set(size, size, 1); return sp;
}

/** 3D 立体玫瑰花朵 */
export function rose3D(r = 0.28, c = 0xe63946) {
  const g = new THREE.Group();
  put(g, ball(r * 0.75, c, true, 0.025), 0, r * 0.7, 0);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU;
    put(g, ball(r * 0.48, i % 2 ? c : 0xff6b8a, true, 0.02), Math.cos(a) * r * 0.5, r * 0.55, Math.sin(a) * r * 0.5);
  }
  put(g, ball(r * 0.36, 0x3f9f5a, true, 0.02), r * 0.55, r * 0.25, 0);
  return g;
}

/** 3D 立体高塔（既可直立作高塔，也可横卧作石棺） */
export function tower3D(h = 9.0, bodyCol = 0x261d38, roofCol = 0x160e24) {
  const g = new THREE.Group();
  put(g, cyl(1.25, 1.5, h, bodyCol, 10), 0, 0, 0);
  put(g, cyl(1.45, 1.35, 0.7, bodyCol, 10), 0, h - 0.3, 0);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    put(g, box(0.45, 0.55, 0.45, bodyCol), Math.cos(a) * 1.28, h + 0.35, Math.sin(a) * 1.28, -a);
  }
  put(g, cone(1.75, 2.8, roofCol, 10), 0, h + 0.6, 0);
  // 发光尖顶拱窗
  put(g, box(0.95, 1.5, 0.2, 0xffe9f2, 0.03), 0, h * 0.7, 1.28);
  put(g, cone(0.56, 0.75, 0xffe9f2, 6, 0.03), 0, h * 0.7 + 1.5, 1.28);
  return g;
}

/** 3D 哥特石拱门 */
export function archPortal3D(w = 2.8, h = 5.4, frameCol = 0x2c1b2e, innerCol = 0xffffff) {
  const g = new THREE.Group();
  for (const s of [-1, 1]) put(g, box(0.42, h * 0.65, 0.5, frameCol), s * (w / 2), 0, 0);
  const top = mesh(new THREE.TorusGeometry(w / 2, 0.26, 8, 22, PI), toon(frameCol), 0.04);
  top.position.set(0, h * 0.65, 0); g.add(top);
  const sh = new THREE.Shape();
  sh.moveTo(-w / 2 + 0.15, 0); sh.lineTo(-w / 2 + 0.15, h * 0.65);
  sh.absarc(0, h * 0.65, w / 2 - 0.15, PI, 0, true);
  sh.lineTo(w / 2 - 0.15, 0);
  const backMat = basic(innerCol);
  const back = new THREE.Mesh(new THREE.ShapeGeometry(sh, 18), backMat);
  back.position.z = -0.15; g.add(back);
  g.userData.backMat = backMat;
  return g;
}

/** 3D 纺车与纺锤 */
export function spindle3D() {
  const g = new THREE.Group();
  const wh = wheel(1.3, 0x4a2a1e, 8); put(g, wh, 0, 2.1, 0);
  put(g, box(0.28, 2.2, 0.28, 0x3a2016), 0, 0, -0.15);
  put(g, box(3.2, 0.24, 0.6, 0x5a3626), 1.1, 0.65, 0);
  put(g, cyl(0.08, 0.12, 2.4, 0xd8c29d, 8), 2.4, 0.75, 0);
  put(g, cone(0.14, 0.9, 0xffe49c, 8), 2.4, 2.95, 0);
  g.userData.wheel = wh;
  return g;
}

/** 3D 巨龙（可扇动双翼 + 犄角 + 长尾） */
export function dragon3D(bodyCol = 0x1e182e, wingCol = 0x35284e) {
  const g = new THREE.Group();
  put(g, cyl(0.65, 0.95, 3.6, bodyCol, 8), 0, 0.8, 0);
  put(g, cyl(0.45, 0.65, 1.8, bodyCol, 8), 0, 4.2, 0.2).rotation.x = 0.25;
  const hd = new THREE.Group(); put(g, hd, 0, 5.7, 0.65);
  put(hd, ball(0.68, bodyCol, true), 0, 0, 0);
  put(hd, box(0.6, 0.4, 0.9, bodyCol), 0, -0.15, 0.6);
  for (const s of [-1, 1]) {
    const h = cone(0.16, 1.1, 0xebe0ff, 6); h.position.set(s * 0.35, 0.55, -0.2); h.rotation.z = -s * 0.35; h.rotation.x = -0.35; hd.add(h);
    put(hd, ball(0.1, 0xff2d4a, false, 0), s * 0.28, 0.15, 0.55);
    put(hd, spriteGlow(0.6, 0xff2d4a), s * 0.28, 0.15, 0.58);
  }
  const mkWing = (sx: number) => {
    const p = new THREE.Group(); p.position.set(sx * 0.55, 3.8, -0.2);
    const arm = box(3.6, 0.22, 0.22, bodyCol); arm.position.set(sx * 1.8, 0.8, 0); arm.rotation.z = sx * 0.35; p.add(arm);
    const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(3.4 * sx, 1.6); sh.lineTo(4.8 * sx, 0.4); sh.lineTo(3.6 * sx, -1.3); sh.lineTo(1.8 * sx, -0.6); sh.lineTo(0.4 * sx, -1.6);
    const web = mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.08, bevelEnabled: false }), toon(wingCol), 0.04);
    p.add(web); return p;
  };
  const wl = mkWing(-1), wr = mkWing(1); g.add(wl, wr);
  const tail = put(g, cone(0.45, 3.8, bodyCol, 6), 1.6, 0.5, -0.4); tail.rotation.z = -1.1;
  g.userData = { wl, wr };
  return g;
}

/** 3D 带轮子的木制恶龙道具（印证王子多勇敢里被龙娘推下台） */
export function dragonProp3D() {
  const g = new THREE.Group();
  put(g, box(4.4, 0.25, 1.2, PAL.wood), 0, 0.45, 0);
  for (const x of [-1.5, 1.5]) for (const z of [-0.65, 0.65]) put(g, wheel(0.45, PAL.woodD, 6), x, 0.45, z);
  const dr = dragon3D(0x3a2024, 0x5c202a); dr.scale.setScalar(0.58); dr.position.set(0, 0.6, 0); g.add(dr);
  return g;
}

/** 3D 骑龙用的立体蝠翼 */
export function wing3D(c = 0xf4f0ff) {
  const sh = new THREE.Shape();
  sh.moveTo(0, 0); sh.lineTo(1.2, 1.8); sh.lineTo(3.2, 2.3); sh.lineTo(4.4, 1.5); sh.lineTo(3.4, 0.5); sh.lineTo(2.4, 0.8); sh.lineTo(1.8, -0.3); sh.lineTo(0.6, -0.4);
  return mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.14, bevelEnabled: false }), toon(c), 0.045);
}

/** 3D 金锁头 */
export function padlock3D(c = PAL.gold, dk = PAL.goldD) {
  const g = new THREE.Group();
  const sh = mesh(new THREE.TorusGeometry(0.62, 0.16, 8, 20, PI), toon(PAL.silver), 0.04); sh.position.y = 0.7; g.add(sh);
  put(g, cyl(0.16, 0.16, 0.5, PAL.silver, 10), -0.62, 0.25, 0);
  put(g, cyl(0.16, 0.16, 0.5, PAL.silver, 10), 0.62, 0.25, 0);
  put(g, box(1.9, 1.5, 0.55, c), 0, -1.1, 0);
  put(g, cyl(0.22, 0.22, 0.12, dk, 14), 0, -0.25, 0.3).rotation.x = PI / 2;
  put(g, box(0.2, 0.52, 0.12, dk), 0, -0.78, 0.26);
  g.userData.shackle = sh;
  return g;
}

/** 3D 钥匙 */
export function key3D(c = 0xffffff) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.TorusGeometry(0.48, 0.14, 8, 22), toon(c), 0.04));
  for (let i = 0; i < 4; i++) put(g, ball(0.16, c, true, 0.025), Math.cos(i * TAU / 4 + 0.78) * 0.6, Math.sin(i * TAU / 4 + 0.78) * 0.6, 0);
  put(g, cyl(0.11, 0.11, 2.35, c, 10), 0, -2.85, 0);
  put(g, box(0.55, 0.18, 0.16, c), 0.28, -2.75, 0);
  put(g, box(0.4, 0.18, 0.16, c), 0.2, -2.4, 0);
  put(g, box(0.36, 0.12, 0.18, c), 0, -0.75, 0);
  return g;
}

/** 3D 猎枪 */
export function rifle3D(wood = 0x5c341e, steel = 0x2a2d38) {
  const g = new THREE.Group();
  const stock = box(1.5, 0.34, 0.22, wood); stock.position.set(-1.3, -0.04, 0); stock.rotation.z = 0.14; g.add(stock);
  put(g, box(1.2, 0.26, 0.2, wood), -0.1, 0.04, 0);
  put(g, cyl(0.065, 0.075, 2.55, steel, 10), 0.95, 0.28, 0).rotation.z = -PI / 2;
  const barrel = cyl(0.065, 0.075, 2.55, steel, 10); barrel.position.set(1.0, 0.28, 0); barrel.rotation.z = -PI / 2;
  const g2 = new THREE.Group();
  g2.add(stock, box(1.2, 0.26, 0.2, wood).translateX(-0.1).translateY(0.04), barrel);
  g2.add(mesh(new THREE.TorusGeometry(0.14, 0.035, 6, 14), toon(steel), 0.02).translateX(-0.45).translateY(-0.08));
  return g2;
}

/** 3D 心形 */
export function heart3D(c = PAL.rose, s = 1) {
  const sh = new THREE.Shape();
  sh.moveTo(0, -0.5 * s); sh.bezierCurveTo(-0.9 * s, 0.05 * s, -0.5 * s, 0.75 * s, 0, 0.3 * s); sh.bezierCurveTo(0.5 * s, 0.75 * s, 0.9 * s, 0.05 * s, 0, -0.5 * s);
  return mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.28 * s, bevelEnabled: true, bevelThickness: 0.06 * s, bevelSize: 0.05 * s, bevelSegments: 2 }), toon(c), 0.035);
}

/** 3D 红唇 */
export function lips3D(c = 0xff2d55, s = 1) {
  const sh = new THREE.Shape();
  sh.moveTo(-1.5 * s, 0); sh.bezierCurveTo(-0.9 * s, 0.75 * s, -0.35 * s, 0.75 * s, 0, 0.42 * s);
  sh.bezierCurveTo(0.35 * s, 0.75 * s, 0.9 * s, 0.75 * s, 1.5 * s, 0); sh.bezierCurveTo(0.8 * s, -0.95 * s, -0.8 * s, -0.95 * s, -1.5 * s, 0);
  const m = mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.26 * s, bevelEnabled: true, bevelThickness: 0.06 * s, bevelSize: 0.05 * s }), toon(c), 0.04);
  m.position.z = -0.13 * s;
  return m;
}

/** 3D 羽毛笔 */
export function quill3D(c = 0xfffaf0) {
  const g = new THREE.Group();
  const sh = new THREE.Shape(); sh.moveTo(0, 0); sh.bezierCurveTo(0.55, 0.6, 0.5, 1.9, 0.05, 2.7); sh.bezierCurveTo(-0.25, 1.9, -0.3, 0.7, 0, 0);
  g.add(mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.06, bevelEnabled: false }), toon(c), 0.03));
  put(g, cyl(0.03, 0.03, 3.2, 0x3a2418, 6, 0.015), 0.02, -0.55, 0.03);
  put(g, cone(0.07, 0.45, 0x1a141c, 6, 0.02), 0.02, -0.85, 0.03).rotation.x = PI;
  return g;
}

/** 3D 匕首 / 刀锋 */
export function blade3D(h = 1.6, c = 0xe6ecf8) {
  const g = new THREE.Group();
  put(g, cone(0.22, h, c, 4), 0, 0.25, 0);
  put(g, box(0.6, 0.1, 0.14, 0x4a3426), 0, 0.18, 0);
  return g;
}

/** 3D 魔药锅与玻璃瓶 */
export function cauldron3D() {
  const g = new THREE.Group();
  put(g, cyl(1.15, 0.78, 1.15, 0x261e34, 12), 0, 0, 0);
  put(g, mesh(new THREE.TorusGeometry(1.15, 0.1, 8, 22).rotateX(PI / 2), toon(0x3a2e4f), 0.03), 0, 1.12, 0);
  const brew = new THREE.Mesh(new THREE.CircleGeometry(1.04, 22).rotateX(-PI / 2), basic(0x58ff9a)); brew.position.y = 1.05; g.add(brew);
  put(g, spriteGlow(3.0, 0x58ff9a), 0, 1.35, 0);
  return g;
}
export function bottle3D() {
  const g = new THREE.Group();
  const glass = new THREE.MeshBasicMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.42, depthWrite: false, side: THREE.DoubleSide });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.5, 0.9, 14).translate(0, 0.45, 0), glass);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.25, 0.45, 12).translate(0, 1.1, 0), glass);
  g.add(body, neck, mesh(new THREE.TorusGeometry(0.46, 0.03, 6, 16).rotateX(PI / 2), toon(0x7fb8e0), 0.02).translateY(0.9));
  put(g, cyl(0.16, 0.14, 0.22, 0xb07a3c, 10), 0, 1.32, 0);
  return g;
}

/** 3D 猎人剪影人偶 */
export function hunter3D(c = 0x1a141c) {
  const g = new THREE.Group();
  put(g, cone(0.75, 2.3, c, 8), 0, 0, 0);
  put(g, ball(0.32, c, true), 0, 2.55, 0);
  put(g, cyl(0.62, 0.62, 0.08, c, 12), 0, 2.82, 0);
  put(g, cone(0.34, 0.55, c, 8), 0, 2.9, 0);
  const r = rifle3D(c, c); r.scale.setScalar(0.55); r.rotation.z = 1.15; r.position.set(0.52, 1.75, 0.12); g.add(r);
  return g;
}

/** 3D 剧本厚木板（有厚度和描边） */
export function scriptSlab3D(title: string, lines: string[], hi = -1) {
  const c = document.createElement('canvas'); c.width = 512; c.height = 680; const g = c.getContext('2d')!;
  g.fillStyle = '#fff8e8'; g.fillRect(0, 0, 512, 680);
  g.strokeStyle = '#b30a14'; g.lineWidth = 6; g.strokeRect(18, 18, 476, 644);
  g.fillStyle = '#b30a14'; g.textAlign = 'center'; g.font = `700 62px ${FONT.serif}`; g.fillText(title, 256, 104);
  g.fillRect(150, 126, 212, 4);
  g.textAlign = 'left';
  lines.forEach((l, i) => {
    const y = 200 + i * 78;
    if (i === hi) { g.fillStyle = 'rgba(240,18,138,0.28)'; g.fillRect(40, y - 44, 432, 60); }
    g.fillStyle = i === hi ? '#16090a' : 'rgba(40,24,16,0.55)';
    g.font = `${i === hi ? 700 : 500} ${i === hi ? 38 : 30}px ${FONT.serif}`;
    g.fillText(l, 52, y);
  });
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const grp = new THREE.Group();
  put(grp, box(3.16, 4.16, 0.14, 0x8e2b3a), 0, -2.08, -0.08);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(3, 4), new THREE.MeshBasicMaterial({ map: tex }));
  face.position.z = 0.01; grp.add(face);
  return grp;
}

/** 3D 吊牌（「乖巧」「和善」「借口」） */
export function tag3D(text: string, bg = 0xfff6e0, ink = '#b30a14') {
  const g = new THREE.Group();
  put(g, box(1.55, 1.15, 0.12, bg), 0, -0.58, -0.06);
  put(g, mesh(new THREE.TorusGeometry(0.11, 0.03, 6, 14), toon(0xb08a3a), 0.02), 0, 0.66, 0);
  const t = txt(text, 0.56, { font: FONT.cute, color: ink, depth: false }); t.position.set(0, -0.02, 0.03); g.add(t);
  return g;
}

/** 3D 对话气泡牌 */
export function bubble3D(text: string, h = 0.34) {
  const t = txt(text, h, { font: FONT.hei, color: '#fff', sp: 0.12, depth: false });
  const w = t.userData.w + 0.36, hh = t.userData.h + 0.2;
  const g = new THREE.Group();
  put(g, box(w, hh, 0.1, 0x16121e), 0, -hh / 2, -0.05);
  put(g, cone(0.18, 0.35, 0x16121e, 4), 0, -hh / 2 - 0.3, 0).rotation.x = PI;
  t.position.z = 0.03; g.add(t);
  return g;
}

/** 3D 聚光灯锥 */
export function spotCone(rTop = 0.2, rBot = 2.6, h = 9, color = 0xfff0c0, opacity = 0.16) {
  const g = new THREE.CylinderGeometry(rTop, rBot, h, 24, 1, true); g.translate(0, h / 2, 0);
  return new THREE.Mesh(g, glowMat(color, opacity, true));
}

/** 3D 彩纸碎片下落 */
export function confetti3D(n: number, cols: number[], parent: THREE.Object3D, w = 14, h = 9, z = 0.5) {
  const arr = many(n, i => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.24, 0.03), toon(cols[i % cols.length]));
    parent.add(m); return m;
  });
  return (t: number, vis = true) => arr.forEach((m, i) => {
    m.visible = vis;
    const sp = 0.9 + rnd(i) * 1.3;
    m.position.set((rnd(i * 3) - 0.5) * w + Math.sin(t * 2 + i) * 0.4, h - ((t * sp + rnd(i * 7) * h) % h), z + (rnd(i * 5) - 0.5) * 4);
    m.rotation.set(t * 3 + i, t * 2 + i * 2, i);
  });
}

/** 3D 碎片爆裂组 */
export function shards3D(n: number, cols: number[], size = 0.36) {
  return many(n, i => {
    const s = size * (0.5 + rnd(i * 3.3));
    return mesh(faceted(new THREE.OctahedronGeometry(s, 0)), toon(cols[i % cols.length]), 0.025);
  });
}

/** 3D 场记板（「Stop!」那一下合上）：hinge.rotation.z 0 = 合上，0.6 = 张开 */
export function clapper3D() {
  const g = new THREE.Group();
  put(g, box(2.4, 1.5, 0.14, 0x16141c), 0, 0, 0);
  put(g, box(2.2, 0.035, 0.03, 0xffffff, 0), 0, 0.5, 0.075); put(g, box(2.2, 0.035, 0.03, 0xffffff, 0), 0, 1.0, 0.075);
  const label = txt('逃离童话镇 · 第一幕', 0.2, { font: FONT.hei, color: '#ffffff', depth: false }); label.position.set(0, 1.25, 0.09); g.add(label);
  const stripes = (parent: THREE.Object3D) => { for (let i = 0; i < 6; i++) { const s = box(0.2, 0.3, 0.15, 0xffffff, 0); s.position.set(-1.0 + i * 0.4, -0.01, 0.004); s.rotation.z = 0.55; parent.add(s); } };
  const bar = put(g, new THREE.Group(), 0, 1.5, 0); put(bar, box(2.4, 0.28, 0.14, 0x16141c), 0, 0, 0); stripes(bar);
  const hinge = put(g, new THREE.Group(), -1.2, 1.8, 0);
  const arm = put(hinge, new THREE.Group(), 1.2, 0, 0); put(arm, box(2.4, 0.28, 0.14, 0x16141c), 0, 0, 0); stripes(arm);
  return { g, hinge };
}

/** 婚礼钟：原点在吊点，钟体向下挂，rotation.z 让它摆起来 */
export function bell3D(color = PAL.gold) {
  const g = new THREE.Group();
  put(g, cyl(0.04, 0.04, 0.3, PAL.woodD, 6, 0.01), 0, -0.3, 0);
  put(g, cyl(0.16, 0.5, 0.75, color, 14), 0, -1.05, 0);
  put(g, mesh(new THREE.TorusGeometry(0.5, 0.06, 6, 18).rotateX(PI / 2), toon(PAL.goldL), 0.02), 0, -1.05, 0);
  put(g, ball(0.13, PAL.goldD, false, 0.02), 0, -1.12, 0);
  return g;
}

/** 睡美人的玻璃罩（半球，半透明） */
export function dome3D(r = 1.6) {
  return new THREE.Mesh(new THREE.SphereGeometry(r, 26, 14, 0, PI * 2, 0, PI / 2), glowMat(0xffc6e0, 0.2));
}

/** 玫瑰婚礼拱门：两根白柱 + 半圆拱 + 一圈玫瑰 */
export function weddingArch3D(w = 3.4, h = 3.6) {
  const g = new THREE.Group();
  for (const s of [-1, 1]) { put(g, cyl(0.16, 0.2, h, 0xfff6f0, 10), s * w / 2, 0, 0); put(g, box(0.6, 0.25, 0.6, 0xf2d6e0), s * w / 2, 0, 0); }
  put(g, mesh(new THREE.TorusGeometry(w / 2, 0.14, 8, 26, PI), toon(0xfff6f0), 0.03), 0, h, 0);
  for (let i = 0; i <= 12; i++) { const a = (i / 12) * PI; put(g, rose3D(0.2, i % 3 ? 0xe63946 : 0xffffff), Math.cos(a) * w / 2, h + Math.sin(a) * w / 2 - 0.2, 0.15); }
  for (let i = 0; i < 6; i++) for (const s of [-1, 1]) put(g, rose3D(0.17, i % 2 ? 0xff6b8a : 0xe63946), s * w / 2 + s * 0.12, 0.4 + i * 0.55, 0.15);
  return g;
}

/** 八音盒小舞台（致敬《童话镇》「红鞋子」那一镜）：红白裙边 + 转台 */
export function musicStage3D() {
  const g = new THREE.Group();
  put(g, cyl(3.2, 3.4, 0.7, 0xf2c6d8, 28));
  for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU; put(g, box(0.5, 0.72, 0.1, i % 2 ? 0xe63946 : 0xffffff, 0), Math.cos(a) * 3.36, 0, Math.sin(a) * 3.36, -a + PI / 2); }
  const top = put(g, cyl(3.0, 3.0, 0.1, 0xfff0f5, 28), 0, 0.7, 0);
  for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; put(top, box(0.22, 0.03, 2.4, 0xffb3cf, 0), Math.cos(a) * 1.5, 0.1, Math.sin(a) * 1.5, -a + PI / 2); }
  g.userData.top = top;
  return g;
}

/** 木偶撑杆（纸板道具底下那根木棍） */
export function stick3D(len = 2.6) { return cyl(0.035, 0.035, len, 0x8a6a3a, 6, 0.01); }

/** 单发烟花：fire(t, t0, x, y, z) 在 t0 时刻炸开（时间由卡点表给出，和音效同一刻） */
export function burst3D(parent: THREE.Object3D, n = 22, color = 0xffd166) {
  const cv = document.createElement('canvas'); cv.width = 32; cv.height = 32; const c = cv.getContext('2d')!;
  const gr = c.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, '#fff'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = gr; c.fillRect(0, 0, 32, 32);
  const tex = new THREE.CanvasTexture(cv);
  const sp = many(n, () => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); parent.add(s); return s; });
  return (t: number, t0: number, x: number, y: number, z: number, R = 3.2) => {
    const ph = (t - t0) / 1.3;
    sp.forEach((s, i) => {
      if (ph < 0 || ph > 1) { s.visible = false; return; }
      const a = (i / n) * TAU, e = (rnd(i * 2.3) - 0.5) * 1.4, r = (1 - Math.pow(1 - ph, 3)) * R;
      s.visible = true; s.position.set(x + Math.cos(a) * Math.cos(e) * r, y + Math.sin(a) * Math.cos(e) * r * 0.9 + Math.sin(e) * r - ph * ph * 1.5, z);
      s.scale.setScalar(0.9 * (1 - ph * 0.5)); s.material.opacity = 1 - ph * ph;
    });
  };
}

export const _unusedProps = [canvasTex];
