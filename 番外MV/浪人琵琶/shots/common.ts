// 《浪人琵琶》公共布景与道具 —— 全部用引擎积木搭，不接任何外部图片。
// 两处主景：千问家的小院（花茶、花伞）与夜里的古镇街（酒馆、醉花楼、桥、马）。
import * as THREE from 'three';
import type { Kit } from '@tpl/core';
import type { Beat } from '@tpl/timeline';
import { FONT } from '@tpl/fonts';
import { ball, basic, box, cone, cyl, disc, flower, hash, roof, sprite, toon, tree, house, cloud, setOp } from '@tpl/kit';
import { bridge, hill, straightRiver } from '@tpl/sets';
import { door, sheet, standing, umbrella, windowPane, type Door } from '@tpl/props';

export const PI = Math.PI;
export const many = <T,>(n: number, f: (i: number) => T): T[] => Array.from({ length: n }, (_, i) => f(i));
export const beatSq = (bt: Beat, amt = 0.06) => bt.pulse * amt * (bt.down ? 1 : 0.6);
/** 微醺：按时间左右摇晃的倾角 */
export const tipsy = (T: number, amt = 0.14) => Math.sin(T * 2.1) * amt + Math.sin(T * 3.7) * amt * 0.4;
const at = <T extends THREE.Object3D>(o: T, x: number, y: number, z: number): T => { o.position.set(x, y, z); return o; };

/**
 * 灯笼：和 kit.lantern 一样的样子，但球体材质是**独享**的（kit 的 basic()/toon() 按颜色全局缓存，
 * 直接改它的颜色会把别的镜头里同色的东西一起改掉——角色预检会报「顺着走、倒着走不一样」）。
 */
export function lamp(color = 0xffc85a, r = 0.16): THREE.Group {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide })));
  g.add(sprite('glow', r * 9, color, true, 0.7));
  g.userData.color = color;
  return g;
}

// ---------- 远景 ----------
export function farHills(k: Kit, c1 = 0x6f8f7a, c2 = 0x5d7a8c, clouds = true) {
  many(10, (i) => { const a = (i / 10) * PI * 2 + 0.4; k.add(hill(34 + hash(i) * 28, 12 + hash(i + 3) * 16, i % 2 ? c1 : c2), Math.cos(a) * 165, 0, Math.sin(a) * 165); });
  if (clouds) many(7, (i) => k.add(cloud(i * 5 + 1, 1.6 + hash(i) * 1.6), -100 + i * 32, 26 + hash(i + 1) * 14, -120 - hash(i + 2) * 30));
}
/** 一轮月亮（夜景用） */
export function moon(k: Kit, x = 12, y = 20, z = -70, r = 3.2) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.SphereGeometry(r, 18, 12), basic(0xfff3c8)));
  g.add(sprite('glow', r * 7, 0xffe9a8, true, 0.55));
  k.add(g, x, y, z);
  return g;
}

// ---------- 千问家的小院 ----------
export interface Courtyard { lampGlow: THREE.Sprite; umbrellaSpot: [number, number, number]; tableTop: number; wallTop: number; petals: THREE.Sprite[] }
/**
 * 小院：背墙 + 院门（右侧）+ 千问的屋子（左后）+ 一棵开花的树 + 石桌两只石凳。
 * 石桌在原点略前（z = 1），桌面高 0.78；院门柱在 x ≈ 3.5、z = -6；花伞靠在门柱边 umbrellaSpot。
 */
export function courtyard(k: Kit, blossom = 0xf4a7c0): Courtyard {
  k.add(disc(70, 0x9db57c));
  farHills(k, 0x7fa883, 0x6f93a8);
  // 背墙两段（中间留门洞）与墙头瓦
  k.add(box(9.6, 2.2, 0.4, 0xf1e7d4), -2.2, 0, -6);
  k.add(box(2.6, 2.2, 0.4, 0xf1e7d4), 5.7, 0, -6);
  k.add(box(10.0, 0.25, 0.7, 0x6b6f7a), -2.2, 2.2, -6);
  k.add(box(3.0, 0.25, 0.7, 0x6b6f7a), 5.7, 2.2, -6);
  // 院门：两根柱 + 小檐
  k.add(cyl(0.16, 0.19, 2.8, 0x7a4a2c, 8), 2.7, 0, -6);
  k.add(cyl(0.16, 0.19, 2.8, 0x7a4a2c, 8), 4.3, 0, -6);
  k.add(roof(2.4, 1.3, 0.7, 0x6b6f7a), 3.5, 2.75, -6);
  k.add(box(2.0, 0.12, 0.3, 0x7a4a2c), 3.5, 2.62, -6);
  // 屋子（左后）与亮着的窗
  k.add(house(5.2, 3.1, 4.2, 0xf7efe0, 0x5c6b8a, false), -4.2, 0, -4);
  k.add(windowPane(1.5, 1.2, 0xffe8a8), -4.2, 0.9, -1.88);
  const gateLamp = lamp(0xffc85a, 0.17); k.add(gateLamp, 2.7, 2.35, -5.6);
  const lampGlow = gateLamp.children[1] as THREE.Sprite;
  // 开花的树与落花
  k.add(tree(4.4, blossom, 3), 0.6, 0, -3.2);
  const petals = many(16, (i) => k.add(sprite('petal', 0.22, i % 3 ? blossom : 0xffffff, false, 0.9)));
  // 花坛
  many(12, (i) => k.add(flower([0xff7aa8, 0xffd166, 0xffffff, 0xb388ff][i % 4], 0.3 + hash(i) * 0.2), -6.5 + i * 0.95, 0, -5.4 + hash(i + 2) * 0.3));
  many(5, (i) => k.add(flower([0xffd166, 0xff7aa8][i % 2], 0.28), 5.2 + i * 0.35, 0, -5.4));
  // 石桌与石凳
  k.add(cyl(0.3, 0.36, 0.7, 0xc9c9cf, 10), 0, 0, 1);
  k.add(cyl(0.95, 0.95, 0.08, 0xdedee3, 24), 0, 0.7, 1);
  k.add(cyl(0.3, 0.3, 0.42, 0xc9c9cf, 10), -1.7, 0, 1);
  k.add(cyl(0.3, 0.3, 0.42, 0xc9c9cf, 10), 1.7, 0, 1);
  // 通向院门的石板路
  many(7, (i) => k.add(box(0.9, 0.04, 0.6, 0xbdb7b0, 0.02), 1.0 + i * 0.4, 0, -0.2 - i * 0.8));
  return { lampGlow, umbrellaSpot: [2.45, 0, -5.55], tableTop: 0.78, wallTop: 2.45, petals };
}
/** 落花：每帧按 T 摆位（无状态） */
export function dropPetals(petals: THREE.Sprite[], T: number, cx = 0.6, cz = -3, spread = 3.2, alive = 1) {
  petals.forEach((s, i) => {
    const ph = (T * (0.16 + hash(i) * 0.1) + hash(i + 7)) % 1;
    s.position.set(cx + (hash(i + 1) - 0.5) * spread + Math.sin(T * 1.3 + i) * 0.4, 3.4 - ph * 3.3, cz + (hash(i + 2) - 0.5) * spread + 1.2);
    s.material.rotation = T * 2 + i;
    setOp(s, alive * (ph < 0.08 ? ph / 0.08 : ph > 0.9 ? (1 - ph) / 0.1 : 1) * 0.9);
  });
}

// ---------- 小道具 ----------
/** 花伞：可开合。set(open) 0 = 收拢（伞面缩成一条）、1 = 撑开 */
export function flowerUmbrella(color = 0xf07a9a) {
  const g = umbrella(1.15, color, 1.55);
  const top = g.children[1] as THREE.Mesh;
  const flowers = many(6, (i) => {
    const a = (i / 6) * PI * 2;
    const f = new THREE.Mesh(new THREE.CircleGeometry(0.12, 8), basic(0xfff1f6));
    f.position.set(Math.cos(a) * 0.7, 1.55 - 1.15 * 0.14 + 0.22, Math.sin(a) * 0.7); f.lookAt(0, 3.6, 0); g.add(f);
    return f;
  });
  const set = (open: number) => {
    const o = Math.max(0.08, Math.min(1, open));
    top.scale.set(o, 1, o);
    flowers.forEach((f, i) => { const a = (i / 6) * PI * 2; f.position.x = Math.cos(a) * 0.7 * o; f.position.z = Math.sin(a) * 0.7 * o; f.visible = o > 0.5; });
  };
  set(1);
  return { g, set };
}
/** 把一组物体做成可调透明度（回忆 / 幻影用） */
export function ghost(g: THREE.Object3D) {
  const mats: THREE.Material[] = [];
  // 先把材质整棵 clone 成独享的，再调透明：kit 的 toon()/basic() 是全局缓存，直接改会污染别的镜头
  g.traverse((o) => {
    const mesh_ = o as THREE.Mesh; const m = mesh_.material as THREE.Material | THREE.Material[] | undefined; if (!m) return;
    const own = Array.isArray(m) ? m.map((x) => x.clone()) : m.clone();
    mesh_.material = own;
    (Array.isArray(own) ? own : [own]).forEach((mm) => { mm.transparent = true; mm.depthWrite = false; mats.push(mm); });
  });
  return (a: number) => { g.visible = a > 0.01; mats.forEach((m) => { m.opacity = a; }); };
}
/** 琵琶：梨形琴身 + 琴颈 + 四根弦，其中一根断了垂着。原点在琴身底部中心，琴面朝 +z。set(mend) 把断弦接回去 */
export function pipa(): { g: THREE.Group; broken: THREE.Mesh; set: (mend: number) => void } {
  const g = new THREE.Group();
  const body = ball(0.42, 0xb0763a, false, 0.03); body.scale.set(1, 1.3, 0.3); body.position.y = 0.55; g.add(body);
  const faceDisc = new THREE.Mesh(new THREE.CircleGeometry(0.3, 18), toon(0xd9a25f)); faceDisc.position.set(0, 0.58, 0.13); faceDisc.scale.y = 1.3; g.add(faceDisc);
  g.add(at(box(0.1, 0.78, 0.08, 0x7a4a24, 0.03), 0, 1.0, 0));
  g.add(at(box(0.18, 0.16, 0.1, 0x3a2a20, 0.03), 0, 1.78, 0));
  many(3, (i) => g.add(at(box(0.012, 1.5, 0.012, 0xfff2c8, 0), -0.055 + i * 0.045, 0.3, 0.145)));
  const broken = box(0.012, 0.62, 0.012, 0xfff2c8, 0); broken.position.set(0.09, 1.18, 0.15); broken.rotation.z = -0.5; g.add(broken);
  const set = (mend: number) => { const m = Math.max(0, Math.min(1, mend)); broken.rotation.z = -0.5 * (1 - m); broken.position.y = 1.18 - 0.88 * m; broken.scale.y = 1 + m * 1.4; };
  return { g, broken, set };
}
/** 酒壶。原点在壶底中心 */
export function winePot(): THREE.Group {
  const g = new THREE.Group();
  g.add(cyl(0.17, 0.21, 0.36, 0xeae2d2, 12, 0.03));
  g.add(at(cyl(0.07, 0.1, 0.12, 0xeae2d2, 8, 0.03), 0, 0.36, 0));
  const sp = cyl(0.025, 0.04, 0.3, 0xeae2d2, 6, 0.02); sp.rotation.z = -0.95; sp.position.set(0.2, 0.22, 0); g.add(sp);
  const h = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.022, 6, 12, PI), toon(0x8a5a3c)); h.position.set(-0.17, 0.3, 0); g.add(h);
  return g;
}
export const wineCup = () => cyl(0.085, 0.06, 0.1, 0xeae2d2, 10, 0.02);
/** 一块点心 */
export const cake = (color = 0xf6d7a0) => cyl(0.13, 0.15, 0.1, color, 12, 0.02);
/** 马：拴在街边的那匹。原点在四蹄之间的地面，头朝 +x */
export function horse(color = 0x5a3b2a): { g: THREE.Group; head: THREE.Group } {
  const g = new THREE.Group();
  g.add(at(box(1.6, 0.7, 0.62, color), 0, 1.05, 0));
  const head = new THREE.Group(); head.position.set(0.85, 1.45, 0); g.add(head);
  head.add(at(box(0.46, 0.55, 0.4, color), 0.05, 0, 0));
  head.add(at(box(0.56, 0.34, 0.36, color), 0.38, 0.5, 0));
  head.add(at(box(0.1, 0.36, 0.34, 0x2a1a12), 0.0, 0.5, 0));
  head.add(at(box(0.08, 0.16, 0.08, 0x2a1a12), 0.3, 0.84, 0.12));
  head.add(at(box(0.08, 0.16, 0.08, 0x2a1a12), 0.3, 0.84, -0.12));
  for (const [x, z] of [[-0.55, -0.2], [-0.55, 0.2], [0.5, -0.2], [0.5, 0.2]]) g.add(at(box(0.18, 1.06, 0.18, 0x3f2a1e), x, 0, z));
  g.add(at(box(0.55, 0.12, 0.72, 0xc0392b), -0.05, 1.75, 0));
  const tail = cone(0.09, 0.7, 0x2a1a12, 6); tail.rotation.z = PI / 2 + 0.5; tail.position.set(-0.8, 1.35, 0); g.add(tail);
  return { g, head };
}
/** 拴马桩 */
export const hitchPost = () => cyl(0.07, 0.09, 1.2, 0x5a3a26, 6);

/** 桥面高度：bridge(14, 3.2) 的桥板顶面在 x 处的 y（桥心最高 3.72） */
export const bridgeTop = (x: number) => Math.sin((x / 14 + 0.5) * PI) * 3.3 + 0.42;

// ---------- 夜里的古镇街 ----------
export interface Street {
  tavernDoor: Door; redDoor: Door; horse: { g: THREE.Group; head: THREE.Group };
  redLanterns: THREE.Group[]; tavernLanterns: THREE.Group[]; bridgeLanterns: THREE.Group[];
  moon: THREE.Group;
  /** 酒馆门口（街面）/ 醉花楼门口 / 桥心 / 马 的世界坐标 */
  P: { tavern: [number, number, number]; red: [number, number, number]; bridge: [number, number, number]; horse: [number, number, number] };
}
/** 牌匾：立在门楣上的一块木牌，写两三个字（只用模板字体） */
export function plaque(text: string, w = 1.9, h = 0.55, wood = '#3b2a22', ink = '#f3dca0'): THREE.Group {
  const m = sheet(w, h, (c, W, H) => {
    c.fillStyle = wood; c.fillRect(0, 0, W, H);
    c.strokeStyle = ink; c.lineWidth = Math.max(2, H * 0.05); c.strokeRect(H * 0.08, H * 0.08, W - H * 0.16, H - H * 0.16);
    c.fillStyle = ink; c.font = `900 ${Math.floor(H * 0.62)}px ${FONT}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, W / 2, H / 2 + H * 0.04);
  }, wood);
  return standing(m, h, 0.02);
}
/**
 * 古镇夜街：路沿 x 轴（z = 0 是街心）。酒馆在左（x ≈ -7），醉花楼在右（x ≈ 7），
 * 桥与河在后面（z ≈ -16），马拴在酒馆门前（x ≈ -3.6）。
 */
export function street(k: Kit): Street {
  k.add(disc(90, 0x707284));
  farHills(k, 0x3f5560, 0x35475a, false);
  const mn = moon(k, 14, 22, -80, 3.4);
  k.add(box(70, 0.05, 5.2, 0x5f5c68, 0), 0, 0, 0);
  many(18, (i) => k.add(box(1.2, 0.03, 0.5, 0x7a7684, 0), -18 + i * 2.1, 0.04, -1.2 + (i % 3) * 1.1));
  // 酒馆
  k.add(house(6.4, 3.4, 5, 0xe9d8b8, 0x7a3b2a, false), -7, 0, -4.2);
  k.add(plaque('酒馆', 1.6, 0.5), -7, 2.5, -1.62);
  const tavernDoor = door(1.5, 2.5, 0x6b4a32); k.add(tavernDoor.g, -7, 0, -1.7);
  const tavernLanterns = [k.add(lamp(0xffc85a, 0.18), -8.3, 2.0, -1.4), k.add(lamp(0xffc85a, 0.18), -5.7, 2.0, -1.4)];
  k.add(windowPane(1.3, 1.0, 0xffe2a0), -9.1, 0.9, -1.68);
  // 马与拴马桩
  const hs = horse(); k.add(hs.g, -3.6, 0, -2.6, 0.15); k.add(hitchPost(), -2.2, 0, -2.2);
  // 醉花楼：两层、挂满红灯
  k.add(box(6.6, 3.2, 5, 0xb8433c), 7, 0, -4.6);
  k.add(box(6.2, 2.5, 4.6, 0xc9524a), 7, 3.2, -4.6);
  k.add(box(7.0, 0.16, 1.4, 0x5c2424), 7, 3.2, -1.7);
  many(7, (i) => k.add(box(0.08, 0.9, 0.08, 0x5c2424), 3.7 + i * 1.1, 3.36, -1.1));
  k.add(roof(7.6, 6.0, 1.7, 0x3b2f3a), 7, 5.7, -4.6);
  k.add(plaque('醉花楼', 2.1, 0.6, '#5c2424', '#ffd98a'), 7, 2.4, -2.05);
  const redDoor = door(1.6, 2.6, 0x7a2a2a); k.add(redDoor.g, 7, 0, -2.1);
  const redLanterns = many(8, (i) => k.add(lamp(0xff6b5a, 0.17), 4.0 + i * 0.86, i % 2 ? 2.4 : 5.2, i % 2 ? -1.6 : -1.3));
  many(3, (i) => k.add(windowPane(1.1, 0.9, 0xffb4a0), 4.9 + i * 2.1, 3.9, -2.28));
  // 河与桥
  const river = straightRiver(80, 6.5, 0.15, -16, 0.07, 0x1f3b5a, 0x122a44);
  k.add(river.mesh);
  k.add(bridge(14, 3.2), 0, 0, -16);
  const bridgeLanterns = [k.add(lamp(0xffd98a, 0.16), -3.2, 2.9, -17.6), k.add(lamp(0xffd98a, 0.16), 3.2, 2.9, -17.6)];
  k.add(cyl(0.08, 0.1, 1.1, 0x8a5a3c, 6), -3.2, 1.85, -17.6); k.add(cyl(0.08, 0.1, 1.1, 0x8a5a3c, 6), 3.2, 1.85, -17.6);
  // 对岸的屋影
  many(6, (i) => k.add(house(3 + hash(i) * 2, 2.4 + hash(i + 1), 3, 0x3f4458, 0x2a2d3c, false), -14 + i * 5.5, 0, -24 - hash(i + 2) * 4));
  many(4, (i) => k.add(tree(3.6 + hash(i), 0x2f4f45, i), -16 + i * 10.5, 0, -21));
  return {
    tavernDoor, redDoor, horse: hs, redLanterns, tavernLanterns, bridgeLanterns, moon: mn,
    P: { tavern: [-7, 0, 0], red: [7, 0, -0.2], bridge: [0, bridgeTop(0), -16], horse: [-3.6, 0, -2.6] },
  };
}
/** 酒馆内景：柜台、酒坛、两张桌、窗外的月 */
export function tavernRoom(k: Kit) {
  k.add(disc(40, 0x3b3140));
  k.add(box(13, 0.2, 10, 0x9a7352, 0), 0, -0.2, 0);
  k.add(box(13, 4.6, 0.3, 0xe6d3b2, 0), 0, 0, -5);
  k.add(box(0.3, 4.6, 10, 0xe6d3b2, 0), -6.5, 0, 0);
  k.add(box(0.3, 4.6, 10, 0xe6d3b2, 0), 6.5, 0, 0);
  many(5, (i) => k.add(box(0.22, 4.6, 0.22, 0x6b4a32), -5.2 + i * 2.6, 0, -4.8));
  k.add(windowPane(1.9, 1.5, 0x27386b), 3.2, 1.3, -4.84);
  k.add(cyl(0.9, 0.9, 0.12, 0xfff3c8, 20), 3.2, 1.75, -4.98);
  // 柜台与酒坛
  k.add(box(4.2, 1.05, 1.0, 0x7a4a2c), -3.6, 0, -3.4);
  many(4, (i) => k.add(cyl(0.22, 0.3, 0.5, 0x5a4a44, 10), -5.2 + i * 1.05, 1.05, -3.5));
  many(3, (i) => k.add(cyl(0.3, 0.36, 0.7, 0x5a4a44, 10), -5.6 + i * 0.85, 0, -4.4));
  // 桌：主桌（本鲸）在右前，小桌（小克）在左后
  k.add(box(1.9, 0.08, 1.1, 0xb9824f), 1.6, 0.72, 0.2); k.add(box(0.14, 0.72, 0.14, 0x8a5a3c), 1.0, 0, 0.0); k.add(box(0.14, 0.72, 0.14, 0x8a5a3c), 2.2, 0, 0.4);
  k.add(cyl(0.26, 0.26, 0.42, 0x8a5a3c, 8), 1.6, 0, 1.4);
  k.add(box(1.4, 0.08, 1.0, 0xb9824f), -2.6, 0.72, -1.4); k.add(box(0.14, 0.72, 0.14, 0x8a5a3c), -2.6, 0, -1.4);
  const lamps = [k.add(lamp(0xffc85a, 0.17), -1.0, 3.3, -1.0), k.add(lamp(0xffc85a, 0.17), 2.6, 3.3, -1.0), k.add(lamp(0xffc85a, 0.17), -4.2, 3.3, -2.6)];
  return { lamps, tableTop: 0.8, tableX: 1.6, tableZ: 0.2 };
}
/** 灯笼亮度：同时压球体颜色与光晕 */
export function lampLevel(l: THREE.Group, a: number) {
  const b = l.children[0] as THREE.Mesh, gl = l.children[1] as THREE.Sprite;
  (b.material as THREE.MeshBasicMaterial).color.setHex(a > 0.5 ? (l.userData.color as number) : 0x5a4a44);
  setOp(gl, 0.7 * a);
}
/** 水洼：几片发亮的扁圆 */
export function puddles(k: Kit, n = 6, cx = 0, cz = 1.2) {
  return many(n, (i) => { const m = new THREE.Mesh(new THREE.CircleGeometry(0.5 + hash(i) * 0.5, 16).rotateX(-PI / 2), basic(0x8fa6c8)); m.scale.z = 0.45; k.add(m, cx + (hash(i + 3) - 0.5) * 9, 0.03, cz + (hash(i + 5) - 0.5) * 2.4); return m; });
}
/** 飞起来的音符：每 4 个里有一个「断音」会抖着掉下去 */
export function notes(k: Kit, n = 7, color = 0xfff1c0) {
  return many(n, (i) => k.add(sprite(i % 4 === 3 ? 'drop' : 'note', 0.42, i % 4 === 3 ? 0x9fb6ff : color, false, 0.95)));
}
export function playNotes(ns: THREE.Sprite[], T: number, x: number, y: number, z: number, on = 1, mended = 0) {
  ns.forEach((s, i) => {
    const ph = (T * 0.42 + i / ns.length) % 1;
    const brokenOne = i % 4 === 3 && mended < 0.5;
    if (!brokenOne) s.position.set(x + Math.sin(ph * 6 + i) * 0.5 + ph * 1.2, y + ph * 3.0, z + Math.cos(i) * 0.3);
    else s.position.set(x + 0.6 + Math.sin(T * 18) * 0.12 * ph, y + Math.sin(ph * PI) * 1.4 - ph * 0.8, z + 0.2);
    s.material.rotation = brokenOne ? Math.sin(T * 14) * 0.5 : Math.sin(T * 2 + i) * 0.2;
    setOp(s, on * Math.sin(ph * PI));
  });
}
/** 茶盘 + 小茶壶 */
export function teaTray(): THREE.Group {
  const g = new THREE.Group();
  g.add(cyl(0.42, 0.42, 0.04, 0x8a5a3c, 18, 0.02));
  g.add(at(cyl(0.14, 0.17, 0.2, 0xdfe8f0, 12, 0.02), -0.12, 0.04, 0));
  g.add(at(cyl(0.06, 0.1, 0.06, 0xdfe8f0, 10, 0.02), -0.12, 0.24, 0));
  const sp = cyl(0.02, 0.03, 0.18, 0xdfe8f0, 6, 0.02); sp.rotation.z = -0.9; sp.position.set(0.05, 0.14, 0); g.add(sp);
  return g;
}
/** 一缕蒸汽（几个小圈往上飘） */
export function steam(k: Kit, n = 3, color = 0xffffff) { return many(n, () => k.add(sprite('smoke', 0.22, color, false, 0.5))); }
export function puffSteam(ss: THREE.Sprite[], T: number, x: number, y: number, z: number, on = 1, h = 0.7) {
  ss.forEach((s, i) => { const ph = (T * 0.5 + i / ss.length) % 1; s.position.set(x + Math.sin(T * 2 + i) * 0.06, y + ph * h, z); s.scale.setScalar(0.14 + ph * 0.22); setOp(s, on * (1 - ph) * 0.5); });
}
