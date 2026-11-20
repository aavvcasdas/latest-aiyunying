// 塞纳河左岸：一条街拍到底。咖啡馆 / 花店 / 礼物店在北侧，马路（对街）居中，河边步道与梧桐在南侧，再往南是河、对岸、桥和远处的铁塔。
// 坐标：x 沿街，z 朝镜头为正；地面 y = 0。所有画面元素都由代码搭出来，没有背景图片。
import * as THREE from "three";
import { Actor, type Ctx, type Env, type MvSet, type Pal, type Thing, type Who } from "./engine";
import { Dust, bas, boxG, glowPool, glowSprite, mesh, std } from "./kit";
import { awningTex, bump, cardTex, clamp, easeIn, easeInOut, easeOut, facadeTex, latteTex, leafTex, lerp, lipTex, rng, seg, signTex, smileTex, smooth, stoneTex, tagTex, beatPos } from "./tex";

const WALK_FACES = 1; // 步态格朝右；往左走就翻转
const SEAT = -0.42; // 坐在桌后：整个人放低，桌面挡住腿
const C1 = new THREE.Color(), C2 = new THREE.Color();
const mixC = (a: number, b: number, t: number) => C1.set(a).lerp(C2.set(b), clamp(t)).getHex();

// 关键位置
export const POS = {
  T1: new THREE.Vector3(-3.4, 0, -4.15), T2: new THREE.Vector3(-0.4, 0, -4.15),
  counter: new THREE.Vector3(5.2, 0, -5.55), stall: new THREE.Vector3(3.6, 0, 3.4), stand: new THREE.Vector3(-9.7, 0, -5.55), bench: new THREE.Vector3(-8.4, 0, -4.75),
  tree: new THREE.Vector3(-6.0, 0, -3.3), date: new THREE.Vector3(6.0, 0, 4.75), kimiBench: new THREE.Vector3(-6.5, 0, 4.95),
};

function meshA(g: THREE.BufferGeometry, ms: THREE.Material[], x: number, y: number, z: number) { const o = new THREE.Mesh(g, ms); o.position.set(x, y, z); return o; }
function lathe(pts: [number, number][], m: THREE.Material, seg = 24) { return new THREE.Mesh(new THREE.LatheGeometry(pts.map(([a, b]) => new THREE.Vector2(a, b)), seg), m); }
function makeCup() {
  const g = new THREE.Group(); const white = std(0xfdfaf4, { roughness: 0.3 });
  g.add(lathe([[0.001, 0], [0.17, 0], [0.18, 0.012], [0.05, 0.022], [0.001, 0.022]], white));
  g.add(lathe([[0.001, 0.02], [0.07, 0.02], [0.105, 0.07], [0.115, 0.17], [0.105, 0.17], [0.095, 0.075], [0.001, 0.07]], white));
  const h = mesh(new THREE.TorusGeometry(0.045, 0.012, 6, 14, Math.PI * 1.3), white, 0.12, 0.115, 0); h.rotation.z = -Math.PI * 0.65; g.add(h);
  const coffee = new THREE.Mesh(new THREE.CircleGeometry(0.1, 24), bas(0xffffff, { map: latteTex(0) })); coffee.position.set(0, 0.15, 0); coffee.rotation.x = -Math.PI / 2; g.add(coffee);
  const lip = new THREE.Mesh(new THREE.PlaneGeometry(0.085, 0.042), bas(0xffffff, { map: lipTex(), transparent: true, opacity: 0, depthWrite: false })); lip.position.set(0, 0.15, 0.112); g.add(lip);
  return { g, coffee, lip };
}
function makeTable(top = 0x2f2a26) {
  const g = new THREE.Group(); const m = std(top, { roughness: 0.4, metalness: 0.5 });
  g.add(mesh(new THREE.CylinderGeometry(0.48, 0.48, 0.04, 28), m, 0, 0.95, 0)); g.add(mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.93, 8), m, 0, 0.47, 0)); g.add(mesh(new THREE.CylinderGeometry(0.22, 0.25, 0.03, 18), m, 0, 0.015, 0));
  return g;
}
function makeChair(c = 0x8a3a3a) {
  const g = new THREE.Group(); const m = std(c, { roughness: 0.6 }); const leg = std(0x2b2b2b, { metalness: 0.5, roughness: 0.4 });
  g.add(mesh(boxG(0.42, 0.05, 0.42), m, 0, 0.5, 0)); g.add(mesh(boxG(0.42, 0.45, 0.05), m, 0, 0.75, -0.2));
  [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].forEach(([a, b]) => g.add(mesh(boxG(0.03, 0.5, 0.03), leg, a, 0.25, b)));
  return g;
}
function makeTree(x: number, z: number, seed: number) {
  const g = new THREE.Group(); g.position.set(x, 0, z); const r = rng(seed);
  g.add(mesh(new THREE.CylinderGeometry(0.13, 0.2, 3.4, 9), std(0x9a8c74, { roughness: 1 }), 0, 1.7, 0));
  const cols = [0xe8a640, 0xd98a30, 0xc8742a, 0xf0c050, 0xb86a28];
  for (let i = 0; i < 6; i++) { const s = 0.9 + r() * 0.6; const m = mesh(new THREE.IcosahedronGeometry(s, 1), std(cols[Math.floor(r() * cols.length)], { roughness: 0.9, flatShading: true }), (r() - 0.5) * 1.8, 3.6 + r() * 1.3, (r() - 0.5) * 1.4); g.add(m); }
  return g;
}
function makeLamp(x: number, z: number) {
  const g = new THREE.Group(); g.position.set(x, 0, z); const m = std(0x1f2a26, { metalness: 0.6, roughness: 0.4 });
  g.add(mesh(new THREE.CylinderGeometry(0.06, 0.1, 3.6, 8), m, 0, 1.8, 0)); g.add(mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.25, 8), m, 0, 0.12, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.16, 0.08, 0.34, 6), std(0xfff2cc, { emissive: 0xffc870, emissiveIntensity: 0.2 }), 0, 3.75, 0));
  const glow = glowSprite(0xffc870, 2.2, 0); glow.position.y = 3.75; g.add(glow);
  return { g, glow, head: g.children[2] as THREE.Mesh<THREE.CylinderGeometry, THREE.MeshStandardMaterial> };
}
// 线框铁塔：四条腿 + 平台 + 交叉撑
function makeTower() {
  const pts: number[] = []; const H = 42; const R = (y: number) => 7 * Math.pow(Math.max(0, 1 - y / H), 1.7) + 0.35;
  const corner = (y: number, k: number) => { const r = R(y); const a = (k * Math.PI) / 2 + Math.PI / 4; return [Math.cos(a) * r, y, Math.sin(a) * r]; };
  const N = 40;
  for (let k = 0; k < 4; k++) for (let i = 0; i < N; i++) { const y0 = (i / N) * H, y1 = ((i + 1) / N) * H; pts.push(...corner(y0, k), ...corner(y1, k)); }
  for (let i = 1; i < N - 2; i += 2) { const y = (i / N) * H, y2 = ((i + 2) / N) * H; for (let k = 0; k < 4; k++) { pts.push(...corner(y, k), ...corner(y2, (k + 1) % 4)); pts.push(...corner(y2, k), ...corner(y, (k + 1) % 4)); } }
  for (const y of [6, 16, 28, 41]) for (let k = 0; k < 4; k++) pts.push(...corner(y, k), ...corner(y, (k + 1) % 4));
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  const lines = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: 0x6a5a50, fog: true }));
  const sp = new Dust(260, [9, H, 9], 0xfff0b0, 0.5, 91, [0, 0, 0], 1); sp.pts.visible = false;
  const beacon = glowSprite(0xfff2c8, 5, 0); beacon.position.y = H + 1;
  const grp = new THREE.Group(); grp.add(lines, sp.pts, beacon); return { grp, lines, sp, beacon, H };
}

type Bal = { g: THREE.Group; ball: THREE.Mesh; mat: THREE.MeshStandardMaterial; str: THREE.Line; sp: Float32Array };
function makeBalloon(color: number, face: boolean, r = 0.42): Bal {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: face ? 0xffffff : color, map: face ? smileTex("#ff8fb4") : null, roughness: 0.25, metalness: 0.05, emissive: color, emissiveIntensity: 0.12 });
  const ball = mesh(new THREE.SphereGeometry(r, 24, 16), mat); ball.scale.set(1, 1.15, 1); ball.rotation.y = -Math.PI / 2; g.add(ball);
  const knot = mesh(new THREE.ConeGeometry(0.05, 0.08, 8), mat, 0, -r * 1.15, 0); knot.rotation.x = Math.PI; g.add(knot);
  const sp = new Float32Array(10 * 3); const sg = new THREE.BufferGeometry(); sg.setAttribute("position", new THREE.BufferAttribute(sp, 3));
  const str = new THREE.Line(sg, new THREE.LineBasicMaterial({ color: 0xf6f0ea })); str.frustumCulled = false;
  return { g, ball, mat, str, sp };
}

export function streetSet(env: Env): MvSet {
  const group = new THREE.Group(); const R = rng(5);
  // ── 地面 ──
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(220, 60), std(0x9a9488, { roughness: 1 })); ground.position.set(0, -0.01, -10); ground.rotation.x = -Math.PI / 2; group.add(ground);
  const walkM = std(0xd8cfbf, { map: stoneTex("#d8cfbf", 30, 3), roughness: 0.95 }); const promM = std(0xcfc4b2, { map: stoneTex("#cfc4b2", 30, 9), roughness: 0.95 });
  const sw = mesh(new THREE.PlaneGeometry(80, 4.4), walkM, 0, 0.005, -4.9); sw.rotation.x = -Math.PI / 2; group.add(sw);
  const road = mesh(new THREE.PlaneGeometry(80, 4.6), std(0x4a4a52, { roughness: 0.9 }), 0, 0.004, -0.5); road.rotation.x = -Math.PI / 2; group.add(road);
  for (let x = -38; x < 38; x += 3) { const d = mesh(new THREE.PlaneGeometry(1.4, 0.1), bas(0xf2efe6), x, 0.012, -0.5); d.rotation.x = -Math.PI / 2; group.add(d); }
  const prom = mesh(new THREE.PlaneGeometry(80, 3.8), promM, 0, 0.005, 3.7); prom.rotation.x = -Math.PI / 2; group.add(prom);
  const curbM = std(0xbdb6a8); group.add(mesh(boxG(80, 0.14, 0.2), curbM, 0, 0.07, -2.8), mesh(boxG(80, 0.14, 0.2), curbM, 0, 0.07, 1.8));
  const parM = std(0xd9cfbd, { map: stoneTex("#d9cfbd", 8, 4), roughness: 1 }); group.add(mesh(boxG(80, 0.9, 0.5), parM, 0, 0.45, 5.85));
  // ── 河、对岸、桥、铁塔 ──
  const waterM = std(0x6f9cc0, { roughness: 0.25, metalness: 0.35 }); const water = mesh(new THREE.PlaneGeometry(320, 220), waterM, 0, -1.6, 116); water.rotation.x = -Math.PI / 2; group.add(water);
  const quay = mesh(boxG(80, 1.6, 0.4), std(0xb8ae9c), 0, -0.8, 6.2); group.add(quay);
  const farMs: THREE.MeshStandardMaterial[] = [];
  for (let x = -90; x < 90; x += 7.5) { const h = 8 + R() * 6; const f = facadeTex(Math.floor(R() * 40), 4, 4); const m = std(0xffffff, { map: f.map, emissiveMap: f.emissive, emissive: 0xffffff, emissiveIntensity: 0 }); farMs.push(m); group.add(meshA(boxG(7.3, h, 5), [std(0xd8c8aa), std(0xd8c8aa), std(0x5d6b80), std(0x5d6b80), m, m], x, h / 2 - 1.6, 64)); }
  const bridgeM = std(0xd2c6b0, { roughness: 1 }); const bridge = new THREE.Group(); bridge.position.set(26, 0, 0); group.add(bridge);
  bridge.add(mesh(boxG(3.2, 0.7, 58), bridgeM, 0, 0.35, 34));
  for (const z of [12, 24, 36, 48]) { const a = mesh(new THREE.TorusGeometry(4.6, 0.45, 8, 20, Math.PI), bridgeM, 0, -1.6, z + 6); a.rotation.y = Math.PI / 2; bridge.add(a); }
  const bLamps = [10, 22, 34, 46, 58].map((z) => { const s = glowSprite(0xffd08a, 1.6, 0); s.position.set(0, 1.6, z); bridge.add(s); return s; });
  const tower = makeTower(); tower.grp.position.set(-36, -1.6, 104); group.add(tower.grp);
  const sun = glowSprite(0xfff1c8, 26, 0.9); group.add(sun); const moon = glowSprite(0xf2f4ff, 9, 0); group.add(moon);
  const stars = new Dust(300, [260, 60, 40], 0xffffff, 0.35, 61, [0, 30, 150], 0.9); group.add(stars.pts);
  // 水面倒影：灯在河里拉长的光
  const refl = [-36, -20, -6, 8, 26, 40].map((x, i) => { const m = glowPool(i === 0 ? 0xfff0b0 : 0xffc98a, 1.4, 22, 0); m.position.set(x, -1.58, i === 0 ? 92 : 50); group.add(m); return m; });
  // ── 北侧立面 ──
  const facadeMs: THREE.MeshStandardMaterial[] = [];
  const blocks: [number, number, number][] = [[-30, 6.4, 10], [-23.6, 6.4, 11], [-17.2, 6.4, 9.5], [-12, 4, 10.5], [-8.75, 2.5, 10.5], [-2, 7, 11.5], [5.2, 6.5, 10], [11.8, 6.6, 11], [18.4, 6.6, 9.5], [25, 6.6, 10.5], [31.6, 6.6, 10]];
  blocks.forEach(([x, w, h], i) => { const f = facadeTex(i * 7 + 3); const m = std(0xffffff, { map: f.map, emissiveMap: f.emissive, emissive: 0xffffff, emissiveIntensity: 0 }); facadeMs.push(m); const side = std(0xe2d2b6); group.add(meshA(boxG(w, h, 5), [side, side, std(0x5d6b80), side, m, side], x, h / 2, -9.5)); });
  // 店面：玻璃窗（夜里亮）+ 雨棚 + 招牌
  const winMs: THREE.MeshStandardMaterial[] = [];
  const shop = (x0: number, x1: number, a: string, b: string, sign: string, sbg: string, sfg: string) => {
    const w = x1 - x0, cx = (x0 + x1) / 2; const wm = std(0x3a4252, { emissive: 0xffc27a, emissiveIntensity: 0.1, roughness: 0.2, metalness: 0.4 }); winMs.push(wm);
    group.add(mesh(new THREE.PlaneGeometry(w - 0.4, 2.4), wm, cx, 1.35, -6.98));
    group.add(mesh(boxG(w, 0.35, 0.12), std(0x2a3a34), cx, 2.7, -6.94));
    const aw = mesh(new THREE.PlaneGeometry(w, 1.5), std(0xffffff, { map: awningTex(a, b), side: THREE.DoubleSide, roughness: 0.8 }), cx, 2.95, -6.35); aw.rotation.x = -1.0; group.add(aw);
    const sg = mesh(new THREE.PlaneGeometry(Math.min(3.4, w * 0.6), 0.8), bas(0xffffff, { map: signTex(sign, sbg, sfg) }), cx, 4.0, -6.93); group.add(sg);
  };
  shop(-5.4, 1.4, "#c8303a", "#fbf4ea", "左岸咖啡", "#1f3a32", "#f6e7c8");
  shop(2.4, 8.0, "#3f8a5a", "#f4f1e6", "花店", "#f4f1e6", "#2f6a46");
  shop(-11.6, -6.2, "#2a3a6a", "#e8e2d4", "礼物", "#2a3a6a", "#f4e3b0");
  const cafeLight = new THREE.PointLight(0xffc27a, 0, 9, 1.6); cafeLight.position.set(-2, 2.2, -5.6); group.add(cafeLight);
  // 咖啡馆桌椅
  const t1 = makeTable(); t1.position.copy(POS.T1); group.add(t1); const t2 = makeTable(); t2.position.copy(POS.T2); group.add(t2);
  [[-4.05, -4.65], [-2.75, -4.65], [-0.4, -4.65]].forEach(([x, z]) => { const c = makeChair(); c.position.set(x, 0, z); group.add(c); });
  const cupC = makeCup(), cupW = makeCup(); group.add(cupC.g, cupW.g);
  const latteTexs = Array.from({ length: 13 }, (_, i) => latteTex(i / 12));
  // 花店柜台与玫瑰
  group.add(mesh(boxG(2.2, 1.0, 0.7), std(0x6a4a34, { roughness: 0.7 }), POS.counter.x, 0.5, POS.counter.z));
  const roses = new THREE.InstancedMesh(new THREE.SphereGeometry(0.1, 8, 6), std(0xffffff, { roughness: 0.6 }), 64); group.add(roses);
  { const o = new THREE.Object3D(); const rr = rng(12); const cols = [0xd8283c, 0xff6f9c, 0xf2f0ea, 0xc81f4a]; let i = 0;
    for (const [bx, bz] of [[3.2, -5.6], [3.9, -5.75], [6.6, -5.7], [7.3, -5.55]]) { group.add(mesh(new THREE.CylinderGeometry(0.26, 0.22, 0.55, 12), std(0x7a8a96, { metalness: 0.6, roughness: 0.4 }), bx, 0.28, bz));
      for (let k = 0; k < 16; k++) { o.position.set(bx + (rr() - 0.5) * 0.4, 0.62 + rr() * 0.32, bz + (rr() - 0.5) * 0.4); o.updateMatrix(); roses.setMatrixAt(i, o.matrix); roses.setColorAt(i, new THREE.Color(cols[Math.floor(rr() * 4)])); i++; } } }
  const cardM = bas(0xd8d0c8, { map: cardTex({ n: 0, circle: 0, fix: false }), side: THREE.DoubleSide }); const card = mesh(new THREE.PlaneGeometry(0.42, 0.26), cardM); card.rotation.x = -Math.PI / 2 + 0.3; group.add(card);
  const cardCache = new Map<string, THREE.Texture>(); const cardState = (n: number, circle: number, fix: boolean) => { const k = `${n}|${circle.toFixed(2)}|${fix}`; let t = cardCache.get(k); if (!t) { t = cardTex({ n, circle, fix }); cardCache.set(k, t); } return t; };
  // 礼物摊：展台 + 礼盒 + 价签（正面写「最贵」，背面是一片叶子）
  group.add(mesh(boxG(1.1, 0.85, 0.7), std(0x3a4a6a), POS.stand.x, 0.42, POS.stand.z));
  const gift = new THREE.Group(); gift.position.set(POS.stand.x, 0.85, POS.stand.z); group.add(gift);
  gift.add(mesh(boxG(0.7, 0.55, 0.55), std(0xe85a8a, { roughness: 0.4 }), 0, 0.28, 0)); gift.add(mesh(boxG(0.72, 0.57, 0.1), std(0xffd36b, { metalness: 0.5, roughness: 0.3 }), 0, 0.28, 0)); gift.add(mesh(boxG(0.1, 0.57, 0.57), std(0xffd36b, { metalness: 0.5, roughness: 0.3 }), 0, 0.28, 0));
  [-1, 1].forEach((s) => { const b = mesh(new THREE.TorusGeometry(0.11, 0.03, 6, 14), std(0xffd36b, { metalness: 0.5 }), s * 0.1, 0.6, 0); b.rotation.y = Math.PI / 2; b.rotation.x = s * 0.5; gift.add(b); });
  const tag = new THREE.Group(); tag.position.set(POS.stand.x + 0.42, 1.05, POS.stand.z + 0.4); group.add(tag);
  const tagF = mesh(new THREE.PlaneGeometry(0.4, 0.24), bas(0xffffff, { map: tagTex(true) }), 0, -0.14, 0); const tagB = mesh(new THREE.PlaneGeometry(0.4, 0.24), bas(0xffffff, { map: tagTex(false) }), 0, -0.14, -0.002); tagB.rotation.y = Math.PI; tag.add(tagF, tagB);
  const benchM = std(0x2f4a3a, { roughness: 0.6 }); const bench = new THREE.Group(); bench.position.copy(POS.bench); group.add(bench);
  bench.add(mesh(boxG(1.8, 0.08, 0.5), benchM, 0, 0.45, 0.15), mesh(boxG(1.8, 0.5, 0.06), benchM, 0, 0.75, -0.08), mesh(boxG(0.06, 0.45, 0.45), benchM, -0.8, 0.22, 0.15), mesh(boxG(0.06, 0.45, 0.45), benchM, 0.8, 0.22, 0.15));
  const kBench = bench.clone(); kBench.position.copy(POS.kimiBench); group.add(kBench);
  // ── 梧桐、路灯、串灯 ──
  [[-12, 4.3], [-4, 4.3], [4, 4.3], [12, 4.3], [-20, 4.3], [20, 4.3]].forEach(([x, z], i) => group.add(makeTree(x, z, i * 13 + 2)));
  group.add(makeTree(POS.tree.x, POS.tree.z, 77)); group.add(makeTree(9.6, -3.3, 78));
  const lamps = [-16, -8, 0, 8, 16].map((x) => { const l = makeLamp(x, 2.25); group.add(l.g); return l; });
  const lampLights = [-8, 0, 8].map((x) => { const p = new THREE.PointLight(0xffc27a, 0, 8, 1.5); p.position.set(x, 3.6, 2.3); group.add(p); return p; });
  const bulbs: { s: THREE.Sprite; k: number }[] = []; const wireM = new THREE.LineBasicMaterial({ color: 0x2a2a2a });
  const cat = (a: THREE.Vector3, b: THREE.Vector3, sag: number, n: number) => { const pts: THREE.Vector3[] = []; for (let i = 0; i <= 20; i++) { const t = i / 20; const p = a.clone().lerp(b, t); p.y -= Math.sin(Math.PI * t) * sag; pts.push(p); } group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), wireM));
    for (let i = 1; i < n; i++) { const t = i / n; const p = a.clone().lerp(b, t); p.y -= Math.sin(Math.PI * t) * sag + 0.08; const s = glowSprite(0xffd38a, 0.42, 0); s.position.copy(p); group.add(s); bulbs.push({ s, k: 0 }); } };
  for (let i = 0; i < 4; i++) cat(new THREE.Vector3(-16 + i * 8, 3.5, 2.25), new THREE.Vector3(-8 + i * 8, 3.5, 2.25), 0.55, 10);
  [-8, 0, 8].forEach((x) => cat(new THREE.Vector3(x, 3.5, 2.25), new THREE.Vector3(x - 1.5, 4.3, -6.9), 0.7, 12));
  bulbs.forEach((b) => (b.k = (b.s.position.x + 16) / 32 + (b.s.position.z < 0 ? 0.03 : 0)));
  // ── 落叶（时间决定位置）、落叶堆、主角的那一片 ──
  const NL = 170; const leafG = new THREE.PlaneGeometry(0.17, 0.17); const leafM = new THREE.MeshStandardMaterial({ map: leafTex(), alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.8 });
  const leaves = new THREE.InstancedMesh(leafG, leafM, NL); leaves.frustumCulled = false; group.add(leaves);
  const LP = Array.from({ length: NL }, () => ({ x: (R() - 0.5) * 34, z: -6 + R() * 12, ph: R(), v: 0.35 + R() * 0.45, sp: R() * 6 })); const lcol = [0xe8a640, 0xd98a30, 0xc8742a, 0xf0c050, 0xb86a28];
  LP.forEach((_, i) => leaves.setColorAt(i, new THREE.Color(lcol[i % 5])));
  const NP = 110; const pile = new THREE.InstancedMesh(leafG, leafM, NP); pile.frustumCulled = false; group.add(pile);
  { const o = new THREE.Object3D(); const rr = rng(31); for (let i = 0; i < NP; i++) { const a = rr() * 6.28, r = Math.sqrt(rr()) * 0.75, hy = rr(); o.position.set(POS.bench.x - 0.5 + Math.cos(a) * r, 0.45 + hy * 0.75 * (1 - r), POS.bench.z + 0.05 + Math.sin(a) * r * 0.5); o.rotation.set(rr() * 3, rr() * 3, rr() * 3); o.scale.setScalar(1.4); o.updateMatrix(); pile.setMatrixAt(i, o.matrix); pile.setColorAt(i, new THREE.Color(lcol[i % 5])); } }
  const hero = mesh(new THREE.PlaneGeometry(0.34, 0.34), new THREE.MeshStandardMaterial({ map: leafTex(), color: 0xffc040, emissive: 0xc87a10, emissiveIntensity: 0.5, alphaTest: 0.4, side: THREE.DoubleSide })); group.add(hero);
  const petals = new Dust(80, [2.2, 1.6, 1.6], 0xff8fb4, 0.12, 44, [5, 0, 4.4], 0.95, false); group.add(petals.pts);
  // ── 气球：摊位上的一束 + 主角那只（笑脸）+ 放飞的一群 ──
  const cart = new THREE.Group(); cart.position.copy(POS.stall); group.add(cart); cart.add(mesh(boxG(0.9, 0.8, 0.6), std(0xffffff, { map: awningTex("#7fb0e8", "#fbf4ea") }), 0, 0.5, 0));
  [-0.32, 0.32].forEach((x) => cart.add(mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.06, 12), std(0x333333), x, 0.1, 0.3)));
  const stallCols = [0x7fb0e8, 0xffd36b, 0x9fe0b0, 0xc8a0ff];
  const stallB = stallCols.map((c, i) => { const b = makeBalloon(c, false, 0.3); group.add(b.g, b.str); b.g.position.set(POS.stall.x - 0.3 + i * 0.22, 2.3 + (i % 2) * 0.35, POS.stall.z - 0.1 + (i % 2) * 0.12); return b; });
  const hb = makeBalloon(0xff8fb4, true); group.add(hb.g, hb.str);
  const flock = Array.from({ length: 14 }, (_, i) => { const b = makeBalloon([0xff8fb4, 0x7fb0e8, 0xffd36b, 0x9fe0b0, 0xc8a0ff, 0xffffff][i % 6], i % 3 === 0, 0.3); group.add(b.g, b.str); return b; });
  const strTo = (b: Bal, end: THREE.Vector3 | null, T: number) => {
    const top = b.g.position.clone(); top.y -= b.ball.scale.y * 0.42 * (b.g.scale.y) + 0.04;
    const e = end ?? top.clone().add(new THREE.Vector3(Math.sin(T * 2) * 0.15, -1.1, 0));
    for (let i = 0; i < 10; i++) { const t = i / 9; const p = top.clone().lerp(e, t); p.x += Math.sin(T * 3 + t * 4) * 0.04 * Math.sin(Math.PI * t); b.sp.set([p.x, p.y, p.z], i * 3); }
    (b.str.geometry.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true; b.str.visible = b.g.visible;
  };
  // ── 约会小桌（河边） ──
  const dateG = new THREE.Group(); dateG.position.copy(POS.date); group.add(dateG);
  const dTable = makeTable(0xf2ece0); dateG.add(dTable);
  const cloth = mesh(new THREE.CircleGeometry(0.62, 28), std(0xfff6f0, { side: THREE.DoubleSide, roughness: 0.9 }), 0, 0.98, 0); cloth.rotation.x = -Math.PI / 2; dateG.add(cloth);
  const dChairs = [-0.75, 0.75].map((x) => { const c = makeChair(0xd8a0b0); c.position.set(x, 0, -0.1); c.rotation.y = x > 0 ? -Math.PI / 2 : Math.PI / 2; dateG.add(c); return c; });
  const candle = new THREE.Group(); candle.position.set(0, 0.98, 0); dateG.add(candle); candle.add(mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.2, 10), std(0xfff6e0), 0, 0.1, 0)); const flame = glowSprite(0xffb050, 0.5, 1); flame.position.y = 0.26; candle.add(flame);
  const candleL = new THREE.PointLight(0xffb060, 0, 4, 1.8); candleL.position.set(0, 1.3, 0); dateG.add(candleL);
  const dCups = [-0.22, 0.22].map((x) => { const c = makeCup(); c.g.position.set(x, 0.98, 0.12); dateG.add(c.g); return c; });
  const vase = new THREE.Group(); vase.position.set(0.28, 0.98, -0.18); dateG.add(vase); vase.add(mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.22, 10), std(0x9fc8e8, { transparent: true, opacity: 0.7 }), 0, 0.11, 0));
  [0, 1, 2].forEach((i) => vase.add(mesh(new THREE.SphereGeometry(0.06, 8, 6), std(i === 1 ? 0xff6f9c : 0xd8283c), (i - 1) * 0.06, 0.3 + (i % 2) * 0.05, 0)));
  // ── 演员与像素道具 ──
  const mk = (w: Who, k = 1) => { const a = env.actor(w, w === "gpt" ? "float" : "idle", k).add(group); a.show(false); return a; };
  const W = mk("whale"), C = mk("claude"), Q = mk("qwen"), D = mk("doubao"), G = mk("gemini"), P = mk("gpt", 0.62), Z = mk("zai"), K = mk("kimi");
  const ALL = [W, C, Q, D, G, P, Z, K];
  const th = (n: string, k = 1.6) => { const t = env.thing(n, k).add(group); t.hide(); return t; };
  const bowl = th("prop_bowl", 1.5), book = th("prop_book", 1.5), fan = th("prop_fan", 1.5), basket = th("prop_basket", 1.6), scroll = th("prop_scroll", 1.6), teaA = th("prop_teacup", 1.3), teaB = th("prop_teacup", 1.3), pcard = th("prop_card", 1.4);
  const PROPS: Thing[] = [bowl, book, fan, basket, scroll, teaA, teaB, pcard];
  const hearts = Array.from({ length: 9 }, () => th("fx_heart", 1.8));
  const dShadow = glowPool(0x000000, 7, 3.2, 0); group.add(dShadow);

  // ── 走位工具 ──
  const put = (a: Actor, x: number, z: number, act: string, t0 = 0, o: { y?: number; flip?: number; sp?: number; seat?: boolean; k?: number } = {}) => {
    a.show(true); a.at(x, (o.y ?? 0) + (o.seat ? SEAT : 0), z); a.act(act, t0); a.flip = o.flip ?? 1; a.speed = o.sp ?? 1; a.shadowOn = !o.seat; if (o.k) a.k = o.k; return a;
  };
  /** 在 [ta, tb] 内从 a 走到 b；走的时候放步态，停下放 end */
  const walk = (a: Actor, x0: number, z0: number, x1: number, z1: number, T: number, ta: number, tb: number, end: string, endT0 = 0, o: { flipEnd?: number; sp?: number } = {}) => {
    const q = easeInOut(seg(T, ta, tb)); const moving = T > ta && T < tb;
    put(a, lerp(x0, x1, q), lerp(z0, z1, q), moving ? "walk" : end, moving ? 0 : endT0, { flip: moving ? (x1 >= x0 ? WALK_FACES : -WALK_FACES) : o.flipEnd ?? 1, sp: o.sp ?? 1 });
    return moving;
  };
  const putY = (a: Actor, x: number, y: number, z: number, act: string, t0 = 0, o: { flip?: number; sp?: number; k?: number } = {}) => put(a, x, z, act, t0, { ...o, y });
  const LIT = { lights: 0, pile: 0, lamps: -1 };

  type Scn = (x: Ctx, T: number, v: number) => void;
  const S: Record<string, Scn> = {
    open: (x, T) => { LIT.lights = 0; void x; void T; },
    promenade: (_x, T) => {
      put(G, POS.stall.x - 1.0, POS.stall.z - 0.2, T > 9 ? "choose" : "lookaround", 9);
      put(K, POS.kimiBench.x, POS.kimiBench.z - 0.25, "think", 0, { y: 0.05 }); K.hold(scroll, 0.5, 0.7);
      put(Z, POS.bench.x - 0.5, POS.bench.z - 0.25, "doze", 0); Z.emote("fx_zzz");
    },
    arrive: (_x, T) => {
      walk(W, -15, 3.0, -4.5, 3.0, T, 12.2, 18.2, "idle"); W.hold(bowl, 0.5, 0.7);
      put(G, POS.stall.x - 1.0, POS.stall.z - 0.2, "lookaround", 0);
      putY(P, lerp(-45, 45, seg(T, 12.5, 18.5)), 15, -34, "hover", 0, { k: 0.5 }); P.shadowOn = false;
    },
    cafeIntro: (_x, T) => {
      put(C, -4.05, -4.7, "read", 0, { seat: true }); C.hold(book, 0.42, 0.62);
      put(Q, -2.2, -5.75, T > 19.6 && T < 21.2 ? "bow" : "idle", 19.6);
      if (!walk(W, 2.0, 0.6, -0.4, -4.7, T, 19.2, 23.0, "idle")) { if (T >= 23.0) put(W, -0.4, -4.7, "idle", 0, { seat: true }); } W.hold(bowl, 0.5, 0.7);
    },
    coffee: (x, T, v) => {
      const L = x.line(x.p.lineId);
      put(C, -4.05, -4.7, "read", 0, { seat: true }); C.hold(book, 0.42, 0.62);
      if (v === 0) {
        put(W, -0.4, -4.7, "idle", 0, { seat: true });
        walk(Q, -2.2, -5.7, -2.0, -5.15, T, L.t[0], L.t[3], T > L.t[6] ? "bow" : "idle", L.t[6]);
        cupAt(cupC, -3.72, -3.95, T >= L.t[7] - 0.05 ? easeOut((T - L.t[7] + 0.05) / 0.25) : 0); cupAt(cupW, -0.25, -3.95, T >= L.t[8] - 0.05 ? easeOut((T - L.t[8] + 0.05) / 0.25) : 0);
      } else {
        put(W, -2.75, -4.7, "idle", 0, { seat: true });
        put(Q, -1.6, -5.2, T > L.t[1] && T < L.t[4] ? "bow" : "idle", L.t[1]);
        const push = easeInOut(seg(T, L.t[6], L.t[8] + 0.2)); cupAt(cupC, lerp(-3.72, -3.05, push), -3.92, 1); cupC.lip.material.opacity = 0.8;
        if (T > L.t[6]) C.act("nod", L.t[6]);
      }
    },
    sip: (x, T, v) => {
      const L = x.line(x.p.lineId);
      if (v === 0) { put(C, -4.05, -4.7, "read", 0, { seat: true }); C.hold(book, 0.42, 0.62); put(W, -0.4, -4.7, T > L.t[3] ? "sway" : "idle", 0, { seat: true }); cupAt(cupC, -3.72, -3.95, 1); cupAt(cupW, -0.25, -3.95, 1); if (T > L.t[8] - 0.05) W.emote("fx_heart"); }
      else { put(C, -4.05, -4.7, T > L.t[4] ? "tilt" : "read", L.t[4], { seat: true }); C.hold(T > L.t[4] ? null : book, 0.42, 0.62); put(W, -2.75, -4.7, "sway", 0, { seat: true }); cupAt(cupC, -3.05, -3.92, 1); cupC.lip.material.opacity = 0.8; if (T > L.t[8] - 0.05) { W.emote("fx_heart"); C.emote("fx_sparkle"); } }
    },
    lip: (x, T, v) => {
      const L = x.line(x.p.lineId);
      const op = 0.85 * easeOut(seg(T, L.t[2] - 0.05, L.t[3] + 0.25));
      if (v === 0) { put(C, -4.05, -4.7, T > 32.6 ? "nod" : "read", 32.6, { seat: true }); C.hold(T > 32.6 ? null : book, 0.42, 0.62); cupAt(cupC, -3.72, -3.95, 1); cupC.lip.material.opacity = op; }
      else {
        put(C, -4.05, -4.7, T > 117.9 ? "idle" : "nod", 115.2, { seat: true }); put(W, -2.75, -4.7, "idle", 0, { seat: true }); cupAt(cupC, -3.05, -3.92, 1); cupC.lip.material.opacity = 0.85;
        if (T > 117.9) { C.hold(pcard, 0.45, 0.85); C.emote("fx_exclaim"); } W.emote("fx_heart");
      }
    },
    florist: (x, T) => {
      const L = x.line(x.p.lineId);
      put(D, POS.counter.x - 0.1, POS.counter.z - 0.6, T > L.t[1] && T < L.t[3] + 0.6 ? "nod" : "idle", L.t[1]);
      put(W, 6.7, -4.85, T > L.t[4] ? "nod" : "idle", L.t[4], { flip: -1 });
      const sl = easeOut(seg(T, L.t[0], L.t[3])); card.visible = true; card.position.set(lerp(4.7, 5.35, sl), 1.012, POS.counter.z + 0.12); card.rotation.set(-Math.PI / 2, 0, 0.12);
      const n = T >= L.t[6] ? 3 : T >= L.t[5] ? 2 : T >= L.t[4] ? 1 : 0; cardM.map = cardState(n, 0, false);
      if (T > L.t[8]) W.emote("fx_heart");
    },
    card: (x, T) => {
      const L = x.line(x.p.lineId);
      put(C, -4.05, -4.7, "read", 0, { seat: true }); put(W, -2.75, -4.7, "idle", 0, { seat: true }); cupAt(cupC, -3.05, -3.92, 1); cupC.lip.material.opacity = 0.85;
      const circ = seg(T, L.t[4], L.t[7]); const fix = T >= L.t[7] + 0.1; card.visible = true; card.position.set(-3.45, 0.975, -3.82); card.rotation.set(-Math.PI / 2, 0, -0.08);
      cardM.map = cardState(3, Math.round(circ * 16) / 16, fix);
    },
    balloon: (x, T, v) => {
      const L = x.line(x.p.lineId); const tW = L.t[4];
      put(G, POS.stall.x - 1.0, POS.stall.z - 0.2, T < L.t[3] ? "choose" : T < tW ? "nod" : "surprise", T < L.t[3] ? L.t[0] - 0.4 : T < tW ? L.t[3] : tW);
      put(W, 1.0, 3.0, T > tW + 0.15 ? "surprise" : "hop", T > tW + 0.15 ? tW + 0.15 : 0, { flip: 1 });
      if (v === 1) put(C, -4.05, -4.7, "read", 0, { seat: true });
      // 主角那只：先在摊上，被递到本鲸手边，「风」字起飞，往对街去
      const give = easeInOut(seg(T, L.t[2], L.t[3] + 0.1)); const fly = seg(T, tW, L.e + 0.3);
      const hand = new THREE.Vector3(1.0 + 0.45, 0.95, 3.12); const top0 = new THREE.Vector3(POS.stall.x - 0.05, 2.55, POS.stall.z - 0.05); const top1 = new THREE.Vector3(1.4, 2.25, 3.1);
      hb.g.visible = true; const p = top0.clone().lerp(top1, give);
      if (fly > 0) { const f = easeIn(Math.min(1, fly * 1.3)); p.set(lerp(top1.x, -1.6, f), top1.y + f * 3.4 + Math.sin(fly * 9) * 0.1, lerp(top1.z, -1.2, f)); }
      hb.g.position.copy(p); strTo(hb, fly > 0 ? null : give > 0.5 ? hand : new THREE.Vector3(POS.stall.x, 0.95, POS.stall.z), T);
      // 龙娘那阵风：影子从地上扫过，人从高处掠过
      const dg = seg(T, tW - 0.5, tW + 1.1); if (dg > 0 && dg < 1) { putY(P, lerp(-16, 18, dg), 6.5 + Math.sin(dg * 3) * 0.6, 1.2, v === 1 ? "cast" : "hover", 0, { k: 0.62 }); P.shadowOn = false; dShadow.position.set(lerp(-12, 14, dg), 0.03, 2.0); dShadow.material.opacity = 0.35 * Math.sin(Math.PI * dg); }
      x.p._gust = bump(T, tW - 0.2, tW + 1.4);
    },
    sky: (x, T, v) => {
      const L = x.line(x.p.lineId); const t0 = x.p._s ?? L.s;
      put(C, -4.05, -4.7, T > L.t[5] ? "lookaround" : "read", L.t[5], { seat: true }); if (T < L.t[5]) C.hold(book, 0.42, 0.62);
      // 气球：越过马路上空，最后落在小克的椅背上
      const u = seg(T, t0, L.e + 1.2); const a = new THREE.Vector3(-1.6, 5.6, -1.2), b = new THREE.Vector3(-3.0, 7.0, -2.6), c = new THREE.Vector3(-4.4, 1.85, -4.95);
      const p = u < 0.55 ? a.clone().lerp(b, easeOut(u / 0.55)) : b.clone().lerp(c, easeInOut((u - 0.55) / 0.45)); p.x += Math.sin(T * 1.7) * 0.15;
      hb.g.visible = true; hb.g.position.copy(p); strTo(hb, u > 0.98 ? new THREE.Vector3(-4.4, 0.85, -4.85) : null, T);
      // 龙娘想接住：「天上」那两个字扑过去，没接稳
      const grab = L.t[3]; const pg = seg(T, grab - 0.9, grab + 1.3);
      if (pg > 0 && pg < 1) { putY(P, lerp(3.5, -6, pg), lerp(8.5, 6.2, Math.sin(Math.PI * pg)), -1.8, pg > 0.45 ? (v === 1 ? "nod" : "surprise") : "hover", grab, { k: 0.62 }); P.shadowOn = false; }
      if (v === 1) { const fr = seg(T, L.s, L.e + 1); flock.forEach((b2, i) => { b2.g.visible = true; const rr = (i * 0.618) % 1; b2.g.position.set(lerp(-8, 6, rr) + Math.sin(T + i) * 0.3, 0.8 + fr * (5 + rr * 6) + rr * 1.5, lerp(-4, 3, (i * 0.37) % 1)); strTo(b2, null, T); }); }
    },
    chase: (x, T, v) => {
      const L = x.line(x.p.lineId); const tb = L.t[10];
      if (v === 0) {
        walk(C, -3.6, -3.75, -9.0, -3.85, T, L.t[0], L.t[7], tb < T ? "tilt" : "idle", tb, { flipEnd: -1 }); if (T > tb) C.act("tilt", tb);
        const wq = seg(T, L.t[1], L.t[8]); const back_ = easeOut(seg(T, tb, tb + 0.6));
        put(W, lerp(-0.4, -6.0, easeInOut(wq)) + back_ * 1.4, -3.55, wq > 0 && wq < 1 ? "walk" : T > tb ? "shake" : "idle", T > tb ? tb : 0, { flip: wq > 0 && wq < 1 ? -WALK_FACES : -1 });
      } else {
        walk(C, -3.6, -3.75, -7.0, -3.85, T, L.t[0], L.t[8], "tilt", L.t[8], { sp: 0.7, flipEnd: -1 });
        if (T > tb) walk(C, -7.0, -3.85, -5.9, -3.8, T, tb, tb + 0.9, "hop", tb + 0.9);
        const wq = seg(T, L.t[1], L.t[7]); put(W, lerp(-0.4, -4.8, easeInOut(wq)), -3.55, wq > 0 && wq < 1 ? "walk" : T > tb + 0.9 ? "hop" : "idle", tb + 0.9, { flip: wq > 0 && wq < 1 ? -WALK_FACES : -1 });
        if (T > tb + 0.9) { W.emote("fx_heart"); }
      }
    },
    gift: (x, T, v) => {
      const L = x.line(x.p.lineId); const tf = L.t[4];
      put(Z, POS.bench.x - 0.5, POS.bench.z - 0.25, T > tf - 0.1 && T < tf + 0.9 ? (v === 1 ? "alert" : "nod") : "doze", tf - 0.1); if (!(T > tf - 0.1 && T < tf + 0.9)) Z.emote("fx_zzz");
      put(W, POS.stand.x + 2.6, POS.stand.z + 1.25, T > L.t[6] ? "nod" : "idle", L.t[6], { flip: -1 }); if (T < tf) W.emote("fx_sparkle");
      if (v === 1) { put(C, POS.stand.x + 3.6, POS.stand.z + 1.35, "idle", 0, { flip: -1 }); LIT.pile = 1; }
      tag.rotation.y = Math.PI * easeInOut(seg(T, tf, tf + 0.45)); tag.rotation.z = Math.sin(T * 3) * 0.06 * (1 - seg(T, tf, tf + 1));
    },
    leaf: (x, T, v) => {
      const L = x.line(x.p.lineId); const tl = L.t[12]; const land = L.t[13] + 0.2;
      put(W, POS.tree.x + 0.3, POS.tree.z - 0.35, T > land ? "hop" : "idle", land); W.hold(bowl, 0.5, lerp(0.75, 1.15, smooth(seg(T, L.t[8], L.t[10]))));
      hero.visible = true; const q = seg(T, tl - 1.4, land); const bx = POS.tree.x + 0.3 + 0.55, by = 0.0 + lerp(0.75, 1.15, 1) + 0.12, bz = POS.tree.z - 0.35 + 0.12;
      hero.position.set(lerp(POS.tree.x - 0.6, bx, q) + Math.sin(q * 9) * 0.35 * (1 - q), lerp(3.4, by, easeIn(q * 0.6 + q * 0.4)), lerp(POS.tree.z, bz, q)); hero.rotation.set(Math.sin(T * 3) * 0.6 * (1 - q) - q * 1.2, T * 2 * (1 - q), Math.sin(T * 2.3) * 0.5);
      if (T > land && T < land + 1.4) W.emote("fx_sparkle");
      if (v === 1) {
        put(C, POS.tree.x + 1.6, POS.tree.z - 0.2, T > land + 0.4 ? "read" : "idle", 0, { flip: -1 });
        if (T > land + 0.4) { const g = easeInOut(seg(T, land + 0.4, land + 1.4)); hero.position.lerp(new THREE.Vector3(POS.tree.x + 1.25, 0.9, POS.tree.z - 0.05), g); C.hold(book, 0.42, 0.62); C.emote("fx_heart"); }
      }
    },
    date: (x, T, v) => {
      const L = x.line(x.p.lineId); const tt = L.t;
      dateG.visible = true; const pop = (t: number) => back01(seg(T, t - 0.05, t + 0.3));
      dTable.scale.setScalar(Math.max(0.001, pop(tt[1]))); cloth.scale.setScalar(Math.max(0.001, pop(tt[2]))); dChairs.forEach((c, i) => c.scale.setScalar(Math.max(0.001, pop(tt[3 + i])))); candle.scale.setScalar(Math.max(0.001, pop(tt[5]))); dCups.forEach((c, i) => c.g.scale.setScalar(Math.max(0.001, pop(tt[6 + Math.min(i, 1)])))); vase.visible = v === 1; vase.scale.setScalar(Math.max(0.001, pop(tt[7])));
      LIT.lights = v === 1 ? 1 : seg(T, tt[0], L.e);
      put(Q, POS.date.x - 1.5, POS.date.z - 1.0, T > tt[4] ? "bow" : "spin", T > tt[4] ? tt[4] : tt[0]); Q.hold(fan, 0.5, 0.8);
      put(W, POS.date.x + 1.5, POS.date.z - 1.1, "hop", 0, { flip: -1 });
      if (v === 1) { put(D, POS.date.x - 0.4, POS.date.z - 1.6, T > tt[6] ? "bow" : "step", tt[6]); D.hold(basket, 0.5, 0.6); put(G, POS.date.x + 2.6, POS.date.z - 0.6, "spin", 0, { flip: -1 }); put(C, POS.date.x + 0.6, POS.date.z - 1.9, "curtsy", tt[8]); tied(T); }
    },
    mess: (x, T, v) => {
      const L = x.line(x.p.lineId); const tm = L.t[2]; const m = easeOut(seg(T, tm, tm + 0.9));
      dateG.visible = true; dTable.scale.setScalar(1); dTable.rotation.z = Math.sin(seg(T, tm, tm + 1.2) * 14) * 0.06 * (1 - seg(T, tm, tm + 1.2));
      cloth.position.set(m * 1.6, 0.98 + m * 2.2, m * 0.8); cloth.rotation.set(-Math.PI / 2 + m * 2.4, m * 1.4, m * 3); cloth.scale.setScalar(1);
      dChairs.forEach((c, i) => { c.scale.setScalar(1); c.rotation.z = (i ? -1 : 1) * (Math.PI / 2) * easeIn(seg(T, tm + 0.1 + i * 0.12, tm + 0.6 + i * 0.12)); });
      candle.scale.setScalar(1); candle.rotation.z = -1.4 * easeIn(seg(T, tm + 0.05, tm + 0.45)); flame.visible = T < tm + 0.3;
      dCups.forEach((c, i) => { c.g.scale.setScalar(1); c.g.position.x = (i ? 0.22 : -0.22) + (i ? 1 : -1) * 0.18 * m; c.g.rotation.z = (i ? -1 : 1) * 1.4 * m; });
      vase.visible = v === 1; vase.scale.setScalar(1); vase.rotation.x = 1.3 * m;
      LIT.lights = T < L.t[3] ? 1 : (Math.sin(T * 40) > 0.3 ? 0.4 : 0) * (1 - seg(T, L.t[3], L.t[3] + 0.8));
      x.p._gust = bump(T, tm - 0.1, tm + 1.6);
      put(W, POS.date.x + 1.5, POS.date.z - 1.1, T > L.t[5] ? "hop" : T > tm ? "surprise" : "idle", T > L.t[5] ? L.t[5] : tm, { flip: -1 });
      put(Q, POS.date.x - 1.5, POS.date.z - 1.0, T > tm ? "shake" : "idle", tm);
      if (v === 1) { put(C, POS.date.x + 0.6, POS.date.z - 1.9, T > L.t[5] ? "hop" : T > tm ? "petri" : "idle", T > L.t[5] ? L.t[5] : tm); put(D, POS.date.x - 0.4, POS.date.z - 1.6, T > tm ? "surprise" : "idle", tm); petals.pts.visible = T > tm; petals.update(T - tm, -0.6, 0.6); put(G, POS.date.x + 2.6, POS.date.z - 0.6, T > tm ? "spin" : "idle", tm, { flip: -1 }); tied(T, m); }
    },
    world: (x, T, v) => {
      const L = x.line(x.p.lineId); const tw = L.t[6];
      walk(C, 10.5, 4.95, 7.0, 4.95, T, L.s, L.t[4], "idle", 0, { flipEnd: -1 }); put(W, 5.8, 4.95, T > tw ? "hop" : "idle", tw);
      hb.g.visible = true; const hand = C.mesh.position.clone().add(new THREE.Vector3(-0.45, 0.95, 0.1)); hb.g.position.set(hand.x - 0.2, 2.6 + Math.sin(T * 1.6) * 0.08, hand.z); strTo(hb, hand, T);
      if (v === 1) { LIT.lights = 1; put(Q, 3.6, 4.4, "bow", tw); put(D, 4.5, 3.6, "sway", 0); put(G, 9.4, 3.8, "spin", 0); put(K, 2.5, 3.8, "nod", tw); putY(P, 6.4, 4.2, 6.6, "cast", tw, { k: 0.62 }); P.shadowOn = false; }
      x.p._spark = seg(T, tw, tw + 0.5); x.p._gust = 0.4 * bump(T, tw, L.e + 1);
    },
    parapet: (x, T, v) => {
      const L = x.line(x.p.lineId); const night = v === 1;
      put(W, 5.85, 5.2, "sway", 0, {}); put(C, 7.0, 5.2, "idle", 0, { flip: -1 });
      const hs = [L.t[0], L.t[3], L.t[6]]; hs.forEach((t, i) => { if (T > t && T < t + 1.6) (i === 2 ? C : W).emote("fx_heart"); });
      hb.g.visible = true; hb.g.position.set(7.6, 2.4 + Math.sin(T * 1.4) * 0.1, 5.5); strTo(hb, new THREE.Vector3(7.6, 0.95, 5.65), T);
      if (night) { LIT.lights = 1; put(Q, 3.4, 4.2, "idle", 0); put(D, 9.5, 4.3, "sway", 0); put(G, 10.6, 3.6, "lookaround", 0); put(K, 2.3, 3.6, "think", 0); K.hold(scroll, 0.5, 0.7); putY(P, lerp(-6, 16, (T * 0.05) % 1), 8, 9, "fly", 0, { k: 0.95 }); P.shadowOn = false; }
    },
    sweet: (x, T, v) => {
      const L = x.line(x.p.lineId);
      put(W, 5.85, 5.2, "sway", 0); put(C, 7.0, 5.2, T > L.t[3] ? "hop" : "idle", L.t[3], { flip: -1 });
      put(Q, 4.6, 4.3, T > L.t[0] && T < L.t[0] + 1 ? "bow" : v === 1 ? "spin" : "idle", L.t[0]);
      teaA.at(6.2, 0.92, 5.6); teaA.update(T, x.cam); teaB.at(6.75, 0.92, 5.6); teaB.update(T, x.cam);
      hearts.forEach((h, i) => { const t0 = L.t[Math.min(i, L.t.length - 1)] + i * 0.12; const u = T - t0; if (u < 0 || u > 3.2) return; h.at(lerp(5.4, 7.6, (i * 0.37) % 1) + Math.sin(T * 2 + i) * 0.2, 1.6 + u * 1.1, 5.4); h.update(T, x.cam); });
      if (v === 0) { walk(D, 1.0, 3.3, 12.0, 3.3, T, L.s - 0.5, L.e + 0.5, "idle"); D.hold(basket, 0.5, 0.6); }
      else { LIT.lights = 1; put(D, 3.5, 3.8, "sway", 0); put(G, 9.2, 3.8, "sway", 0.3, { flip: -1 }); put(K, 10.4, 4.0, "hop", 0, { flip: -1 }); putY(P, 6.4, 4.4, 6.8, "cast", 0, { k: 0.62 }); P.shadowOn = false; }
    },
    eyes: (x, T, v) => {
      const L = x.line(x.p.lineId); const away = v === 0 && T > L.t[3] && T < L.t[6];
      put(W, 5.85, 5.2, "idle", 0); put(C, 7.0, 5.2, away ? "lookaround" : T > L.t[8] ? "blink" : "idle", away ? L.t[3] : L.t[8], { flip: away ? 1 : -1 });
      if (T > L.t[8]) C.emote("fx_sparkle"); if (v === 1) LIT.lights = 1;
      hb.g.visible = true; hb.g.position.set(7.6, 2.4 + Math.sin(T * 1.4) * 0.1, 5.5); strTo(hb, new THREE.Vector3(7.6, 0.95, 5.65), T);
    },
    yes: (x, T, v) => {
      const L = x.line(x.p.lineId); const ty = L.t[3];
      put(C, 7.0, 5.2, T > ty ? (v === 1 ? "curtsy" : "nod") : "idle", ty, { flip: -1 }); if (T > L.t[1]) C.emote("fx_heart");
      put(W, 5.85, 5.2, T > ty + 0.7 ? "hop" : "idle", ty + 0.7);
      const rise = seg(T, ty + 0.4, L.e + 2); hb.g.visible = true; hb.g.position.set(7.6, 2.4 + rise * 3 + Math.sin(T * 1.4) * 0.1, 5.5 + rise); strTo(hb, rise > 0 ? null : new THREE.Vector3(7.6, 0.95, 5.65), T);
      if (v === 1) { LIT.lights = 1; put(Q, 3.6, 4.3, T > ty ? "bow" : "idle", ty); put(D, 4.5, 3.6, T > ty ? "spin" : "sway", ty); put(G, 9.4, 3.8, T > ty ? "hop" : "lookaround", ty); put(K, 10.5, 4.2, T > ty ? "nod" : "think", ty); putY(P, 6.4, 4.4, 6.8, T > ty ? "cast" : "float", ty, { k: 0.62 }); P.shadowOn = false; x.p._spark = seg(T, ty, ty + 0.4); }
    },
    dusk: (x, T) => {
      LIT.lamps = seg(T, x.p._s, x.p._s + 5.5);
      walk(W, -6, 3.4, 4, 3.4, T, 88, 95.5, "idle", 0, { sp: 0.7 }); walk(C, -5, 3.6, 5, 3.6, T, 88, 95.5, "idle", 0, { sp: 0.7 });
      putY(P, lerp(-50, 40, seg(T, 88, 95)), 20, 70, "fly", 0, { k: 1.4 }); P.shadowOn = false;
    },
    prep: (_x, T) => {
      const q = seg(T, 95, 102.5); LIT.lights = clamp(q * 1.3); LIT.pile = q;
      put(Q, 0, 1.0, Math.floor(beatPos(T) / 2) % 3 === 0 ? "spin" : "bow", 95); Q.hold(fan, 0.5, 0.8);
      walk(D, -7, 0.6, -2.2, 0.2, T, 95.4, 99, "nod", 99); D.hold(basket, 0.5, 0.6);
      walk(G, 7.5, 0.4, 2.4, 0.0, T, 96, 99.6, "spin", 99.6, { flipEnd: -1 });
      putY(P, lerp(-16, 16, q), 4.6, -2.2, "hover", 0, { k: 0.62 }); P.shadowOn = false;
      put(Z, POS.bench.x - 0.5, POS.bench.z - 0.25, "doze", 0); Z.emote("fx_zzz");
      flock.slice(0, 5).forEach((b, i) => { b.g.visible = true; b.g.position.copy(G.mesh.position).add(new THREE.Vector3(-0.2 + i * 0.12, 2.2 + (i % 2) * 0.3, 0)); strTo(b, G.mesh.position.clone().add(new THREE.Vector3(0.4, 0.9, 0)), T); });
    },
    kimi: (_x, T) => {
      put(K, POS.kimiBench.x, POS.kimiBench.z - 0.25, T > 106 && T < 107.2 ? "nod" : "think", 106, { y: 0.05 }); K.hold(scroll, 0.5, 0.7); if (T > 106) K.emote("fx_bulb");
      walk(W, -12, 3.2, -9, 3.2, T, 103.5, 105.5, "idle", 0, { sp: 0.6 }); walk(C, -12.8, 3.35, -9.8, 3.35, T, 103.5, 105.5, "idle", 0, { sp: 0.6 });
    },
    latte: (x, T) => { dateG.visible = true; [dTable, cloth, candle, vase].forEach((o) => o.scale.setScalar(1)); dChairs.forEach((c) => c.scale.setScalar(1)); dCups.forEach((c) => c.g.scale.setScalar(1)); const p = seg(T, x.p._s + 0.2, x.p._s + 2.0); dCups[0].coffee.material.map = latteTexs[Math.round(p * 12)]; LIT.lights = 1; candle.scale.setScalar(0.001); flame.visible = false; },
    final: (x, T) => {
      const L = x.line(x.p.lineId); LIT.lights = 1;
      put(W, 5.85, 5.2, "idle", 0); put(C, 7.0, 5.2, T > L.t[8] ? "blink" : "idle", L.t[8], { flip: -1 }); if (T > L.t[8]) C.emote("fx_sparkle");
      hb.g.visible = true; hb.g.position.set(7.6, 2.4 + Math.sin(T * 1.4) * 0.1, 5.5); strTo(hb, new THREE.Vector3(7.6, 0.95, 5.65), T);
      put(Z, POS.bench.x - 0.5, POS.bench.z - 0.25, "doze", 0); LIT.pile = 1;
    },
    finale: (x, T) => {
      const L = x.line(x.p.lineId); const ty = L.t[3]; LIT.lights = 1; x.p._spark = seg(T, ty, ty + 0.5);
      put(C, 7.0, 5.2, T > ty ? "curtsy" : "idle", ty, { flip: -1 }); C.emote("fx_heart"); put(W, 5.85, 5.2, T > ty + 0.6 ? "hop" : "idle", ty + 0.6); if (T > ty + 0.6) W.emote("fx_heart");
      put(Q, 3.6, 4.3, T > ty ? "bow" : "idle", ty); put(D, 4.6, 3.5, T > ty ? "spin" : "sway", ty); put(G, 9.4, 3.8, T > ty ? "hop" : "choose", ty); put(K, 10.6, 4.3, T > ty ? "nod" : "think", ty);
      put(Z, POS.bench.x - 0.5, POS.bench.z - 0.25, T > ty ? "alert" : "doze", ty); LIT.pile = 1; putY(P, 6.4, 4.5, 6.9, T > ty ? "cast" : "float", ty, { k: 0.62 }); P.shadowOn = false;
      const rise = seg(T, ty + 0.6, ty + 9); hb.g.visible = true; hb.g.position.set(7.6, 2.4 + rise * 9, 5.5 + rise * 6); strTo(hb, rise > 0 ? null : new THREE.Vector3(7.6, 0.95, 5.65), T);
      flock.forEach((b, i) => { const rr = (i * 0.618) % 1; const st = ty + 0.3 + rr * 1.2; const u = seg(T, st, st + 7); b.g.visible = u > 0; b.g.position.set(lerp(2, 11, rr) + Math.sin(T + i) * 0.3, 1.2 + u * (8 + rr * 5), lerp(3.5, 5.5, (i * 0.37) % 1) + u * 5); strTo(b, null, T); });
    },
    rise: (x, T) => {
      LIT.lights = 1; x.p._spark = 1; const u = seg(T, 206.6, 212.9); const r0 = seg(206.6, x.line("E6").t[3] + 0.6, x.line("E6").t[3] + 9);
      hb.g.visible = true; hb.g.position.set(7.6 - u * 2, 2.4 + r0 * 9 + u * 14, 5.5 + r0 * 6 + u * 10); strTo(hb, null, T);
      flock.forEach((b, i) => { const rr = (i * 0.618) % 1; b.g.visible = true; b.g.position.set(lerp(2, 11, rr) + Math.sin(T + i) * 0.3, 5 + u * 13 + rr * 2.5, lerp(3.5, 5.5, (i * 0.37) % 1) + 2.5 + u * 9); strTo(b, null, T); });
    },
  };
  function back01(t: number) { if (t <= 0) return 0; if (t >= 1) return 1; const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }
  function cupAt(c: ReturnType<typeof makeCup>, xx: number, zz: number, s: number) { c.g.visible = s > 0.001; c.g.position.set(xx, 0.97, zz); c.g.scale.setScalar(Math.max(0.001, s)); }
  function tied(T: number, m = 0) { flock.slice(0, 4).forEach((b, i) => { b.g.visible = true; const ch = dChairs[i % 2]; const base = new THREE.Vector3(POS.date.x + (i % 2 ? 0.75 : -0.75), 0.75, POS.date.z - 0.1); b.g.position.set(base.x + (i < 2 ? -0.15 : 0.15) + m * (i - 1.5) * 1.5, 2.0 + (i % 2) * 0.3 + m * 1.2, base.z + m * 0.6); strTo(b, base, T); void ch; }); }

  const o = new THREE.Object3D(); const LIT_DEF = () => { LIT.lights = 0; LIT.pile = 0; LIT.lamps = -1; };
  return {
    group,
    onPal(p: Pal) {
      const n = p.name; ground.material.color.set(n === "night" ? 0x4a4a58 : 0x9a9488); waterM.color.set(n === "morning" ? 0x6f9cc0 : n === "sunset" ? 0xc88a8a : 0x18244e);
      sun.visible = n === "morning" || n === "sunset"; sun.position.set(n === "sunset" ? -30 : 30, n === "sunset" ? 7 : 36, 120); (sun.material as THREE.SpriteMaterial).color.set(n === "sunset" ? 0xffb070 : 0xfff6dc);
      moon.visible = n === "night"; moon.position.set(28, 30, 120); (moon.material as THREE.SpriteMaterial).opacity = 0.9; stars.pts.visible = n === "night";
      tower.lines.material.color.set(n === "night" ? 0x3a2f2a : n === "sunset" ? 0x5a3f3a : 0x7a6a5e);
    },
    update(x: Ctx) {
      const { T } = x; const v = x.p.v ?? 0; const night = x.pal.name === "night";
      // 复位
      for (const a of ALL) { a.show(false); a.hold(null); a.k = a.who === "gpt" ? 0.62 : 1; a.roll = 0; }
      for (const t of PROPS) t.hide(); hearts.forEach((h) => h.hide());
      cupC.g.visible = cupW.g.visible = false; cupC.lip.material.opacity = 0; cupC.coffee.material.map = latteTexs[0]; card.visible = false; hero.visible = false; hb.g.visible = false; flock.forEach((b) => (b.g.visible = false));
      stallB.forEach((b) => (b.g.visible = true)); dateG.visible = false; dateG.children.forEach((c) => { c.rotation.set(c === cloth ? -Math.PI / 2 : 0, c === dChairs[0] ? Math.PI / 2 : c === dChairs[1] ? -Math.PI / 2 : 0, 0); }); cloth.position.set(0, 0.98, 0); candle.rotation.set(0, 0, 0); flame.visible = true; dCups.forEach((c, i) => { c.g.position.set(i ? 0.22 : -0.22, 0.98, 0.12); c.g.rotation.set(0, 0, 0); c.coffee.material.map = latteTexs[0]; }); vase.rotation.set(0, 0, 0); dTable.rotation.set(0, 0, 0);
      tag.rotation.set(0, 0, 0); dShadow.material.opacity = 0; petals.pts.visible = false; x.p._gust = 0; x.p._spark = 0; LIT_DEF();
      // 场景
      const f = S[x.p.scene]; if (!f) throw new Error("没有走位 " + x.p.scene); f(x, T, v);
      // 演员与道具
      for (const a of ALL) if (a.mesh.visible) { a.shade(x.pal.sprite); a.update(T, x.cam); } else { a.fx.hide(); if (a.held) a.held.hide(); }
      if (x.p.scene === "parapet" && x.pal.name === "sunset") [W, C].forEach((a) => a.shade(0xb88a8a));
      // 摊位气球
      stallB.forEach((b, i) => { b.g.position.y = 2.3 + (i % 2) * 0.35 + Math.sin(T * 1.5 + i) * 0.05; strTo(b, new THREE.Vector3(POS.stall.x, 0.95, POS.stall.z), T); });
      if (!hb.g.visible) hb.str.visible = false; flock.forEach((b) => { if (!b.g.visible) b.str.visible = false; });
      [hb, ...flock, ...stallB].forEach((b) => { if (b.g.visible) b.g.rotation.y = Math.atan2(x.cam.position.x - b.g.position.x, x.cam.position.z - b.g.position.z); });
      // 落叶
      const gust = x.p._gust || 0;
      for (let i = 0; i < NL; i++) { const p = LP[i]; const H = 7; const fy = ((p.ph * H - T * p.v + gust * 2) % H + H) % H; o.position.set(p.x + Math.sin(T * 0.8 + p.sp) * 0.6 + gust * 3 * Math.sin(p.sp + T), fy, p.z + Math.cos(T * 0.6 + p.sp) * 0.4); o.rotation.set(T * 1.3 + p.sp, T * 0.9 + p.sp * 2, T * 0.7); o.scale.setScalar(1); o.updateMatrix(); leaves.setMatrixAt(i, o.matrix); }
      leaves.instanceMatrix.needsUpdate = true;
      const pl = LIT.pile as number; pile.count = Math.floor(NP * clamp(pl)); pile.visible = pl > 0.01;
      // 灯
      const lampK = LIT.lamps >= 0 ? LIT.lamps : x.pal.lamps;
      lamps.forEach((l, i) => { const on = clamp(lampK * 5 - i * 0.8 * (lampK < 1 ? 1 : 0)); (l.glow.material as THREE.SpriteMaterial).opacity = on * 0.9; l.head.material.emissiveIntensity = 0.2 + on * 1.6; });
      lampLights.forEach((p) => (p.intensity = lampK * 7)); cafeLight.intensity = x.pal.lamps * 2.2; candleL.intensity = dateG.visible && flame.visible ? 2.5 : 0;
      facadeMs.forEach((m) => (m.emissiveIntensity = x.pal.lamps * 0.8)); farMs.forEach((m) => (m.emissiveIntensity = x.pal.lamps * 1.3)); winMs.forEach((m) => (m.emissiveIntensity = 0.05 + x.pal.lamps * 0.16));
      bLamps.forEach((s) => ((s.material as THREE.SpriteMaterial).opacity = x.pal.lamps)); refl.forEach((m) => (m.material.opacity = x.pal.lamps * 0.5));
      const lit = night && LIT.lights === 0 && x.p.scene !== "open" && x.p.scene !== "dusk" ? 0.6 : LIT.lights;
      bulbs.forEach((b) => { const on = lit >= 1 ? 1 : clamp((lit - b.k) * 12 + 1) * (lit > 0 ? 1 : 0); (b.s.material as THREE.SpriteMaterial).opacity = on * (0.75 + 0.25 * Math.sin(T * 3 + b.k * 40)); });
      // 铁塔：夜里整点闪
      const sp = x.p._spark || 0; tower.sp.pts.visible = night && sp > 0; if (tower.sp.pts.visible) { tower.sp.update(T * 0.0); (tower.sp.pts.material as THREE.PointsMaterial).opacity = (0.5 + 0.5 * Math.sin(T * 30)) * sp; }
      (tower.beacon.material as THREE.SpriteMaterial).opacity = night ? 0.7 + 0.3 * Math.sin(T * 2) : 0;
      if (stars.pts.visible) stars.update(0, 0, 0);
      void mixC;
    },
  };
}
