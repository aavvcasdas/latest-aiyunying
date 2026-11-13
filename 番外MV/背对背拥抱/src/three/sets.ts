import * as THREE from "three";
import type { Look, PropSpec, SetId } from "@/lib/mv";
import { ball, board, box, clock, cloud, cone, crystal, cyl, disc, fan, flower, house, kelp, lantern, mesh, mound, note, paperBoat, pine, ringArch, rock, scroll, sprite, toonOwn, tree } from "@/three/kit";

/* ------------------------------------------------------------------ *
 * 搭景：四块景各自一个 Group，按镜头显隐。
 *   地面 / 远山的颜色跟着 look 换；云、船、水草、灯笼的呼吸在 tick 里。
 * ------------------------------------------------------------------ */

export interface SetPiece {
  id: SetId;
  g: THREE.Group;
  recolor(look: Look): void;
  tick(t: number, energy: number): void;
}

function groundDisc(color: number): THREE.Mesh {
  const m = disc(90, color, 0);
  m.receiveShadow = true;
  return m;
}

/* ---------------- 黄昏纸岸（主景） ---------------- */
export function buildShore(): SetPiece {
  const g = new THREE.Group();
  const ground = groundDisc(0x6f5f93);
  g.add(ground);

  // 小路：从镜头前一路收到远处
  const path = box(2.4, 0.04, 26, 0xfff1dc, 0.03);
  path.position.set(0, 0, -6);
  path.castShadow = false;
  g.add(path);

  // 河：一条浅蓝纸带，上面飘几条白线
  const river = box(70, 0.03, 5.2, 0x35a7e8, 0.02);
  river.position.set(0, 0.005, -12);
  river.castShadow = false;
  g.add(river);
  const waves: THREE.Mesh[] = [];
  for (let i = 0; i < 14; i++) {
    const w = box(1.6 + (i % 3) * 0.6, 0.02, 0.1, 0xdff6ff, 0);
    w.position.set(-30 + i * 4.6, 0.045, -12 + ((i * 7) % 5) - 2.5);
    w.castShadow = false;
    g.add(w);
    waves.push(w);
  }
  const boat = paperBoat();
  boat.position.set(4, 0.05, -12.4);
  g.add(boat);

  // 房子 / 树 / 松 / 灯笼 / 花 / 石头
  const h1 = house();
  h1.position.set(-7.5, 0, -5.5);
  h1.rotation.y = 0.35;
  g.add(h1);
  const h2 = house(0xffe6cf, 0x6f8fd8, 2.2, 1.9);
  h2.position.set(8.5, 0, -6.5);
  h2.rotation.y = -0.4;
  g.add(h2);
  const h3 = house(0xf3e8ff, 0xc97fbf, 1.9, 1.7);
  h3.position.set(-13, 0, -14);
  g.add(h3);

  for (const [x, z, h, c, s] of [
    [-11, -8, 3.4, 0x5aa86a, 1],
    [12.5, -9, 3.8, 0x4f9a63, 2],
    [-15, -2, 3, 0x6fb07a, 3],
    [15.5, -1.5, 3.2, 0x5aa86a, 4],
    [-5, -17, 3.6, 0x4f9a63, 5],
    [6, -18, 3.3, 0x6fb07a, 6],
  ] as const) {
    const t = tree(h, c, s);
    t.position.set(x, 0, z);
    g.add(t);
  }
  for (let i = 0; i < 9; i++) {
    const p = pine(2.6 + (i % 3) * 0.7);
    p.position.set(-20 + i * 5 + (i % 2) * 1.5, 0, -22 - (i % 3) * 2);
    g.add(p);
  }
  const lanterns: THREE.Group[] = [];
  for (const [x, z, f] of [
    [-3.2, -1.6, 1],
    [3.2, -1.6, -1],
    [-6, 3, 1],
    [6, 3, -1],
  ] as const) {
    const l = lantern();
    l.position.set(x, 0, z);
    l.scale.x = f;
    g.add(l);
    lanterns.push(l);
  }
  const flowerColors = [0xf7a8c4, 0xffd166, 0xffffff, 0xf2907f, 0xc3b6f2];
  for (let i = 0; i < 14; i++) {
    const f = flower(flowerColors[i % flowerColors.length], 0.4 + (i % 4) * 0.08);
    const a = (i / 14) * Math.PI * 2;
    const r = 3.6 + (i % 5) * 0.9;
    f.position.set(Math.cos(a) * r * 1.6, 0, Math.sin(a) * r * 0.9 + 1.5);
    if (Math.abs(f.position.x) < 1.6 && f.position.z > -8) f.position.x += 2.2 * Math.sign(f.position.x || 1);
    g.add(f);
  }
  for (const [x, z, s] of [
    [-4.5, 3.5, 1],
    [5.2, 4.2, 0.8],
    [-9, 1, 1.3],
    [10, 1.5, 1.1],
  ] as const) {
    const r = rock(s);
    r.position.set(x, 0, z);
    g.add(r);
  }

  // 远山：几座纸锥
  const farMat = toonOwn(0x5a3f7a);
  const far: THREE.Mesh[] = [];
  for (const [x, z, r, h] of [
    [-34, -48, 14, 16],
    [-12, -56, 16, 22],
    [14, -54, 13, 18],
    [38, -50, 17, 20],
    [60, -44, 12, 13],
    [-58, -40, 13, 14],
  ] as const) {
    const m = mesh(new THREE.ConeGeometry(r, h, 7), farMat, 0.08);
    m.geometry.translate(0, h / 2, 0);
    m.position.set(x, 0, z);
    m.castShadow = false;
    g.add(m);
    far.push(m);
  }

  // 云
  const clouds: THREE.Group[] = [];
  for (let i = 0; i < 7; i++) {
    const c = cloud(i + 3, 1 + (i % 3) * 0.4);
    c.position.set(-30 + i * 10, 11 + (i % 3) * 2.5, -26 - (i % 4) * 6);
    g.add(c);
    clouds.push(c);
  }

  const groundMat = ground.material as THREE.MeshToonMaterial;
  return {
    id: "shore",
    g,
    recolor(look) {
      groundMat.color.setHex(look.ground);
      farMat.color.setHex(look.far);
    },
    tick(t, energy) {
      waves.forEach((w, i) => {
        w.position.x = ((w.position.x + 0.004 + i * 0.0003 + 35) % 70) - 35;
      });
      boat.position.y = 0.05 + Math.sin(t * 1.3) * 0.04;
      boat.rotation.z = Math.sin(t * 1.1) * 0.05;
      clouds.forEach((c, i) => {
        c.position.x += 0.004 * (1 + (i % 2));
        if (c.position.x > 45) c.position.x = -45;
      });
      lanterns.forEach((l, i) => {
        const glow = l.getObjectByName("glow") as THREE.Sprite | undefined;
        if (glow) {
          const s = 2 + 0.3 * Math.sin(t * 2 + i) + energy * 0.9;
          glow.scale.set(s, s, 1);
        }
      });
    },
  };
}

/* ---------------- 夜·山坡 ---------------- */
export function buildHill(): SetPiece {
  const g = new THREE.Group();
  const ground = groundDisc(0x2e3a6e);
  g.add(ground);
  const moundMat = 0x2b3568;
  const mounds: THREE.Mesh[] = [];
  for (const [x, z, r, h] of [
    [-14, -16, 12, 5],
    [10, -20, 16, 7],
    [26, -10, 10, 4],
    [-30, -8, 12, 4.5],
    [0, -34, 22, 9],
  ] as const) {
    const m = mound(r, h, moundMat);
    m.position.set(x, 0, z);
    g.add(m);
    mounds.push(m);
  }
  for (let i = 0; i < 12; i++) {
    const p = pine(2.2 + (i % 4) * 0.6, 0x1f4a52);
    const a = -0.6 + (i / 12) * 1.2 * Math.PI + Math.PI * 0.9;
    p.position.set(Math.cos(a) * (12 + (i % 3) * 3), 0, Math.sin(a) * (10 + (i % 2) * 3) - 4);
    g.add(p);
  }
  const l1 = lantern(0xffd98a);
  l1.position.set(-2.8, 0, -1.4);
  g.add(l1);
  const l2 = lantern(0xffd98a);
  l2.position.set(2.8, 0, -1.4);
  l2.scale.x = -1;
  g.add(l2);
  const stones = [
    [-1.8, 2.6, 0.7],
    [2.2, 3, 0.6],
    [-5, -0.5, 1],
  ] as const;
  for (const [x, z, s] of stones) {
    const r = rock(s, 0x4a4f7a);
    r.position.set(x, 0, z);
    g.add(r);
  }
  // 远处那条河（大号鲸鱼娘站在那儿）
  const river = box(60, 0.03, 4, 0x2a4f9a, 0.02);
  river.position.set(0, 0.005, -11);
  river.castShadow = false;
  g.add(river);
  const boat = paperBoat();
  boat.position.set(-3, 0.05, -11);
  g.add(boat);
  const fireflies: THREE.Sprite[] = [];
  for (let i = 0; i < 18; i++) {
    const s = sprite("glow", 0.35, 0xfff0a8, true, 0.8);
    s.position.set(-10 + Math.random() * 20, 0.6 + Math.random() * 2.4, -6 + Math.random() * 10);
    g.add(s);
    fireflies.push(s);
  }
  const groundMat = ground.material as THREE.MeshToonMaterial;
  return {
    id: "hill",
    g,
    recolor(look) {
      groundMat.color.setHex(look.ground);
      mounds.forEach((m) => (m.material as THREE.MeshToonMaterial).color.setHex(look.far));
    },
    tick(t) {
      boat.position.y = 0.05 + Math.sin(t * 1.2) * 0.04;
      fireflies.forEach((f, i) => {
        f.position.y += Math.sin(t * 1.4 + i) * 0.003;
        f.position.x += Math.cos(t * 0.9 + i * 1.7) * 0.004;
        (f.material as THREE.SpriteMaterial).opacity = 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(t * 3 + i * 2.1));
      });
    },
  };
}

/* ---------------- 紫色魔法 · 光圈 ---------------- */
export function buildRing(): SetPiece {
  const g = new THREE.Group();
  const ground = groundDisc(0x3d2a6e);
  g.add(ground);
  const arch = ringArch(2.6, 0xe0b3ff);
  g.add(arch);
  const crystals: THREE.Mesh[] = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.3;
    const r = 7 + (i % 3) * 2.5;
    const c = crystal(1.2 + (i % 4) * 0.6, i % 2 ? 0xc78bff : 0x8fd6ff);
    c.position.set(Math.cos(a) * r, 0, Math.sin(a) * r * 0.75 - 2);
    c.rotation.z = (i % 2 ? 1 : -1) * 0.12;
    g.add(c);
    crystals.push(c);
  }
  const pillars: THREE.Mesh[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const p = cyl(0.3, 0.4, 3 + (i % 2), 0x5a3f93, 8);
    p.position.set(Math.cos(a) * 11, 0, Math.sin(a) * 8 - 4);
    g.add(p);
    const top = ball(0.5, 0xf0dcff);
    top.position.set(p.position.x, 3 + (i % 2) + 0.4, p.position.z);
    g.add(top);
    pillars.push(top);
  }
  for (let i = 0; i < 10; i++) {
    const m = mound(6 + (i % 3) * 3, 2 + (i % 2), 0x3a2a70);
    const a = (i / 10) * Math.PI * 2;
    m.position.set(Math.cos(a) * 28, 0, Math.sin(a) * 22 - 6);
    g.add(m);
  }
  const groundMat = ground.material as THREE.MeshToonMaterial;
  return {
    id: "ring",
    g,
    recolor(look) {
      groundMat.color.setHex(look.ground);
    },
    tick(t, energy) {
      arch.rotation.y = t * 0.12;
      arch.scale.setScalar(1 + energy * 0.06);
      pillars.forEach((p, i) => {
        p.position.y += Math.sin(t * 1.6 + i) * 0.002;
      });
      crystals.forEach((c, i) => {
        (c.material as THREE.MeshToonMaterial).emissiveIntensity = 0.3 + 0.3 * (0.5 + 0.5 * Math.sin(t * 2 + i)) + energy * 0.5;
      });
    },
  };
}

/* ---------------- 水下 ---------------- */
export function buildSea(): SetPiece {
  const g = new THREE.Group();
  const ground = groundDisc(0x3a8a92);
  g.add(ground);
  const kelps: THREE.Group[] = [];
  for (let i = 0; i < 16; i++) {
    const k = kelp(2.2 + (i % 4) * 0.8, i % 2 ? 0x3fa37a : 0x5fc48f);
    const a = (i / 16) * Math.PI * 2;
    const r = 5 + (i % 3) * 2.5;
    k.position.set(Math.cos(a) * r * 1.3, 0, Math.sin(a) * r * 0.8 - 2);
    g.add(k);
    kelps.push(k);
  }
  for (let i = 0; i < 8; i++) {
    const c = ball(0.5 + (i % 3) * 0.25, [0xf2907f, 0xffd166, 0xf7a8c4][i % 3], true);
    c.position.set(-9 + i * 2.6, 0.3, 2.5 + (i % 2) * 1.2);
    g.add(c);
  }
  for (const [x, z, s] of [
    [-6, -4, 1.4],
    [7, -5, 1.8],
    [0, -9, 2.2],
  ] as const) {
    const r = rock(s, 0x2f6f82);
    r.position.set(x, 0, z);
    g.add(r);
  }
  const rays: THREE.Mesh[] = [];
  for (let i = 0; i < 6; i++) {
    const ray = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2 + (i % 3) * 0.6, 18),
      new THREE.MeshBasicMaterial({ color: 0xbff7ff, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }),
    );
    ray.position.set(-7 + i * 2.8, 8, -4 - (i % 2) * 2);
    ray.rotation.z = -0.25 + (i % 3) * 0.1;
    g.add(ray);
    rays.push(ray);
  }
  const bigMound = mound(26, 6, 0x0b4a6b);
  bigMound.position.set(0, -1, -30);
  g.add(bigMound);
  const sandCone = cone(3, 1.2, 0x5fa7a8, 7);
  sandCone.position.set(9, 0, 3);
  g.add(sandCone);
  const groundMat = ground.material as THREE.MeshToonMaterial;
  return {
    id: "sea",
    g,
    recolor(look) {
      groundMat.color.setHex(look.ground);
    },
    tick(t) {
      kelps.forEach((k, i) => {
        k.rotation.z = Math.sin(t * 1.2 + i) * 0.12;
        k.rotation.x = Math.cos(t * 0.9 + i * 0.7) * 0.06;
      });
      rays.forEach((r, i) => {
        (r.material as THREE.MeshBasicMaterial).opacity = 0.08 + 0.08 * (0.5 + 0.5 * Math.sin(t * 0.8 + i));
      });
    },
  };
}

export function buildSets(): Record<SetId, SetPiece> {
  return { shore: buildShore(), hill: buildHill(), ring: buildRing(), sea: buildSea() };
}

/* ---------------- 镜头里临时摆的道具 ---------------- */
export function buildProp(spec: PropSpec): THREE.Object3D {
  const s = spec.size ?? 1;
  let o: THREE.Object3D;
  switch (spec.kind) {
    case "clock":
      o = clock();
      break;
    case "scroll":
      o = scroll(4 * s);
      break;
    case "fan":
      o = fan();
      break;
    case "note":
      o = note();
      break;
    case "board":
      o = board();
      break;
    case "arch":
      o = ringArch(2.4 * s, 0xffd166);
      break;
    case "lantern":
      o = lantern();
      break;
    case "flower":
      o = flower();
      break;
    case "rock":
      o = rock(s);
      break;
    case "boat":
      o = paperBoat();
      break;
    case "tree":
      o = tree(3 * s);
      break;
    case "pine":
      o = pine(3 * s);
      break;
    case "house":
    default:
      o = house();
      break;
  }
  if (spec.kind !== "scroll" && spec.kind !== "arch") o.scale.setScalar(s);
  o.position.set(spec.x, 0, spec.z);
  o.rotation.y = THREE.MathUtils.degToRad(spec.ry ?? 0);
  return o;
}

/** 道具的每帧动作：钟的指针走、光圈转 */
export function tickProp(o: THREE.Object3D, t: number, energy: number) {
  const h1 = o.getObjectByName("hand1");
  const h2 = o.getObjectByName("hand2");
  if (h1) h1.rotation.z = -t * 1.4;
  if (h2) h2.rotation.z = -t * 0.12;
  if (o.children.length && (o.children[0] as THREE.Mesh).geometry instanceof THREE.TorusGeometry) {
    o.rotation.y = t * 0.25;
    o.scale.setScalar(1 + energy * 0.08);
  }
}
