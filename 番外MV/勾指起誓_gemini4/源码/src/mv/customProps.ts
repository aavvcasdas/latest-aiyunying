import * as THREE from 'three';
import { ball, basic, box, cone, cyl, glowMat, mesh, put, sprite, toon } from '../engine/kit';
import { sheet, writeLine } from '../engine/props';

/** 立体金色指环（用于「交换无名指金色的契约」） */
export function goldenRing(r = 1.35, tube = 0.14, color = 0xffd24c): THREE.Group {
  const g = new THREE.Group();
  const torus = mesh(new THREE.TorusGeometry(r, tube, 16, 48), toon(color), 0.035);
  g.add(torus);
  const inner = new THREE.Mesh(
    new THREE.TorusGeometry(r, tube * 1.45, 12, 36),
    glowMat(0xffe98a, 0.35, true),
  );
  g.add(inner);
  // 戒指顶部的星芒宝石
  const gem = mesh(new THREE.OctahedronGeometry(tube * 1.85, 0), toon(0xfff7cf), 0.025);
  gem.position.set(0, r + tube * 0.9, 0);
  g.add(gem);
  const star = sprite('star', tube * 6.5, 0xfff3b0, true, 0.95);
  star.position.set(0, r + tube * 0.9, 0.15);
  g.add(star);
  return g;
}

/** 蜡封信笺与诗页（用于「你是信的开头诗的内容」） */
export function loveLetter(title = '见字如晤', w = 1.6, h = 1.15): { g: THREE.Group; flap: THREE.Group; page: THREE.Mesh } {
  const g = new THREE.Group();
  const body = box(w, h, 0.08, 0xfff6e3, 0.03);
  body.position.y = 0;
  g.add(body);
  // 信封内页（可向上抽出）
  const page = sheet(w * 0.86, h * 0.84, (c, W, H) => {
    c.fillStyle = '#fffdf5';
    c.fillRect(0, 0, W, H);
    c.strokeStyle = '#e8c47a';
    c.lineWidth = 8;
    c.strokeRect(18, 18, W - 36, H - 36);
    writeLine(c, W, H, title, 0.36, 0.22, '#5c3d2e');
    c.strokeStyle = 'rgba(180,140,95,0.45)';
    c.lineWidth = 4;
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.moveTo(W * 0.18, H * (0.58 + i * 0.12));
      c.lineTo(W * 0.82, H * (0.58 + i * 0.12));
      c.stroke();
    }
  });
  page.rotation.x = Math.PI / 2;
  page.position.set(0, h * 0.52, 0.05);
  g.add(page);

  // 信封三角折盖
  const flap = new THREE.Group();
  flap.position.set(0, h, 0.045);
  const tri = cone(w * 0.56, h * 0.48, 0xf7e4c1, 3, 0.025);
  tri.rotation.z = Math.PI;
  tri.scale.set(1.05, 1, 0.12);
  flap.add(tri);
  // 红色爱心火漆印
  const seal = cyl(0.14, 0.14, 0.05, 0xe64865, 16, 0.02);
  seal.rotation.x = Math.PI / 2;
  seal.position.set(0, -h * 0.36, 0.03);
  flap.add(seal);
  g.add(flap);
  return { g, flap, page };
}

/** 圣诞礼盒（用于「你是圣诞老人送给我 / 好孩子的礼物」） */
export function giftBox(w = 1.0, h = 0.9, boxCol = 0xe84a5f, ribCol = 0xffd166): { g: THREE.Group; lid: THREE.Group } {
  const g = new THREE.Group();
  put(g, box(w, h, w, boxCol, 0.04));
  put(g, box(w * 0.18, h + 0.02, w + 0.04, ribCol, 0.02), 0, 0, 0);
  put(g, box(w + 0.04, h + 0.02, w * 0.18, ribCol, 0.02), 0, 0, 0);
  const lid = new THREE.Group();
  lid.position.set(0, h, 0);
  put(lid, box(w * 1.08, h * 0.22, w * 1.08, boxCol, 0.035), 0, 0, 0);
  put(lid, box(w * 0.2, h * 0.24, w * 1.12, ribCol, 0.02), 0, 0, 0);
  put(lid, box(w * 1.12, h * 0.24, w * 0.2, ribCol, 0.02), 0, 0, 0);
  // 蝴蝶结
  const bowL = ball(w * 0.18, ribCol, false, 0.025);
  bowL.scale.set(1.4, 0.7, 0.8);
  put(lid, bowL, -w * 0.18, h * 0.28, 0);
  const bowR = ball(w * 0.18, ribCol, false, 0.025);
  bowR.scale.set(1.4, 0.7, 0.8);
  put(lid, bowR, w * 0.18, h * 0.28, 0);
  g.add(lid);
  return { g, lid };
}

/** 圣诞松树（带雪顶、星星与彩色灯球） */
export function christmasTree(h = 5.2): THREE.Group {
  const g = new THREE.Group();
  put(g, cyl(0.28, 0.42, h * 0.24, 0x6e442c, 8));
  const tiers = [
    [h * 0.34, h * 0.42, h * 0.18],
    [h * 0.26, h * 0.36, h * 0.46],
    [h * 0.18, h * 0.30, h * 0.70],
  ];
  const cols = [0xff5c8a, 0xffd166, 0x6ce5ff, 0xfff3b0];
  tiers.forEach(([r, ch, y], ti) => {
    put(g, cone(r, ch, 0x266b4e, 8), 0, y, 0);
    // 雪边点缀与彩球
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + ti * 0.5;
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), basic(cols[(i + ti) % cols.length]));
      b.position.set(Math.cos(a) * r * 0.78, y + ch * 0.18, Math.sin(a) * r * 0.78);
      g.add(b);
    }
  });
  const topStar = sprite('star', 1.2, 0xffe67a, true, 1);
  topStar.position.set(0, h * 1.03, 0);
  g.add(topStar);
  return g;
}

/** 发光大圆月 + 月色光晕（用于「你是月色真美」「前世千次的回眸」） */
export function fullMoon(r = 3.2): THREE.Group {
  const g = new THREE.Group();
  const moon = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 18), basic(0xfff5d6));
  g.add(moon);
  const halo1 = sprite('glow', r * 4.2, 0xffe8a8, true, 0.55);
  const halo2 = sprite('glow', r * 6.8, 0x9ec5ff, true, 0.28);
  g.add(halo1, halo2);
  return g;
}

/** 海岸星光灯塔 + 坐标光柱（用于「要找的标记点」） */
export function lighthouse(h = 8.0): { g: THREE.Group; beam: THREE.Mesh } {
  const g = new THREE.Group();
  put(g, cyl(0.95, 1.35, h * 0.33, 0xfaf3e8, 12), 0, 0, 0);
  put(g, cyl(0.82, 0.96, h * 0.25, 0xe85d6b, 12), 0, h * 0.33, 0);
  put(g, cyl(0.7, 0.83, h * 0.27, 0xfaf3e8, 12), 0, h * 0.58, 0);
  put(g, cyl(0.92, 0.92, 0.22, 0x2b3654, 12), 0, h * 0.85, 0);
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.55, 14, 10), basic(0xfff1a8));
  lamp.position.y = h * 0.92;
  g.add(lamp);
  put(g, cone(0.88, 1.05, 0xd63b4b, 12), 0, h * 0.98, 0);
  const glow = sprite('glow', 4.6, 0xffe27a, true, 0.85);
  glow.position.y = h * 0.92;
  g.add(glow);
  const beam = new THREE.Mesh(
    new THREE.ConeGeometry(2.6, 15, 14, 1, true),
    glowMat(0xffe896, 0.24, true),
  );
  beam.rotation.z = -Math.PI / 2;
  beam.position.set(7.5, h * 0.92, 0);
  g.add(beam);
  return { g, beam };
}

/** 浮空小岛（用于「你是三千美丽世界里」「你是其余所有的一切」） */
export function floatingIsland(r = 2.2, grassColor = 0x7bd36f): THREE.Group {
  const g = new THREE.Group();
  const base = cone(r, r * 1.15, 0x9b7e6b, 7, 0.04);
  base.rotation.x = Math.PI;
  base.position.y = 0;
  g.add(base);
  const top = cyl(r * 1.04, r * 0.96, 0.32, grassColor, 10, 0.035);
  top.position.y = -0.05;
  g.add(top);
  return g;
}

/** 温暖篝火（用于间奏二星空八人围坐） */
export function campfire(): { g: THREE.Group; flames: THREE.Mesh[] } {
  const g = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    put(g, ball(0.24, 0x7d7a8c, true, 0.03), Math.cos(a) * 0.72, 0.14, Math.sin(a) * 0.72);
  }
  for (let i = 0; i < 4; i++) {
    const log = cyl(0.09, 0.1, 1.05, 0x6b4228, 7, 0.025);
    log.rotation.z = Math.PI / 2 - 0.3;
    log.rotation.y = (i / 4) * Math.PI * 2;
    log.position.y = 0.12;
    g.add(log);
  }
  const f1 = new THREE.Mesh(new THREE.ConeGeometry(0.36, 1.0, 7), basic(0xff7b2e));
  const f2 = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.72, 7), basic(0xffe066));
  f1.position.y = 0.5;
  f2.position.y = 0.42;
  g.add(f1, f2);
  const halo = sprite('glow', 3.4, 0xff9b3d, true, 0.65);
  halo.position.y = 0.65;
  g.add(halo);
  return { g, flames: [f1, f2] };
}

/** 两位角色之间的金色牵手光带（不用假手，符合分支红线！） */
export function goldenThread(nDots = 9): { g: THREE.Group; set: (ax: number, ay: number, az: number, bx: number, by: number, bz: number, T: number, alpha?: number) => void } {
  const g = new THREE.Group();
  const dots: THREE.Sprite[] = [];
  for (let i = 0; i < nDots; i++) {
    const sp = sprite(i === Math.floor(nDots / 2) ? 'heart' : 'star', i === Math.floor(nDots / 2) ? 0.36 : 0.24, 0xffe27a, true, 0.9);
    g.add(sp);
    dots.push(sp);
  }
  const set = (ax: number, ay: number, az: number, bx: number, by: number, bz: number, T: number, alpha = 1) => {
    g.visible = alpha > 0.02;
    for (let i = 0; i < nDots; i++) {
      const u = (i + 0.5) / nDots;
      const arch = Math.sin(u * Math.PI) * 0.22 + Math.sin(T * 5 + i * 0.9) * 0.05;
      dots[i].position.set(
        ax + (bx - ax) * u,
        ay + (by - ay) * u + arch,
        az + (bz - az) * u + 0.12,
      );
      const pulse = 0.85 + 0.28 * Math.sin(T * 6 - i * 0.7);
      const base = i === Math.floor(nDots / 2) ? 0.42 : 0.25;
      dots[i].scale.setScalar(base * pulse);
      (dots[i].material as THREE.SpriteMaterial).opacity = alpha * (0.65 + 0.35 * Math.sin(T * 5 + i));
    }
  };
  return { g, set };
}
