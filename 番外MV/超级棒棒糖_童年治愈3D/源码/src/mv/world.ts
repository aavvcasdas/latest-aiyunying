// 程序化 3D 世界：五个区域 + 天空 + 星空 + 特效池 + 调色板。没有任何背景图片。
import * as THREE from 'three';
import type { PalName, Zone } from './data';
import { CANDY, CYL, SPHERE, Shared, TAU, additive, blob, clamp, clay, glossy, glowy, hash, mesh, rbox } from './kit';

// ───────── 调色板 ─────────
interface PalDef {
  top: string; mid: string; bot: string; fog: string; fogD: number; hemiSky: string; hemiGround: string; hemiI: number;
  sun: string; sunI: number; sunDir: [number, number, number]; amb: number; sprite: string; bloom: number; exposure: number;
  stars: number; lanterns: number; sat: number; vig: number; sunDisc: number; motes: string; motesO: number; lamp: number; windowCol: string;
}
const base: PalDef = {
  top: '#86c9ff', mid: '#cfeeff', bot: '#fff1df', fog: '#e3f2ff', fogD: 0.009, hemiSky: '#e3f3ff', hemiGround: '#d6c5a2', hemiI: 0.85,
  sun: '#fff1d8', sunI: 1.7, sunDir: [0.45, 0.85, 0.35], amb: 0.35, sprite: '#ffffff', bloom: 0.22, exposure: 1, stars: 0, lanterns: 0,
  sat: 1, vig: 0.32, sunDisc: 0.6, motes: '#ffffff', motesO: 0.35, lamp: 0, windowCol: '#bfe6ff',
};
export const PALS: Record<PalName, PalDef> = {
  night: { ...base, top: '#1d2152', mid: '#3b3f80', bot: '#5a4c8c', fog: '#262a5c', fogD: 0.02, hemiSky: '#8e9cff', hemiGround: '#40305a', hemiI: 0.5, sun: '#9fb0ff', sunI: 0.3, sunDir: [0.3, 0.8, 0.5], amb: 0.22, sprite: '#dfe2ff', bloom: 0.55, stars: 1, vig: 0.5, sunDisc: 0, motes: '#ffe7b0', motesO: 0.5, lamp: 7, windowCol: '#2a3274' },
  dawnRoom: { ...base, top: '#ffcf9e', mid: '#ffe2c2', bot: '#ffd3b0', fog: '#ffe6cc', fogD: 0.012, hemiSky: '#fff0dc', hemiGround: '#d8b89a', hemiI: 0.95, sun: '#ffd9a6', sunI: 1.7, sunDir: [0.6, 0.5, -0.6], amb: 0.42, sprite: '#fff4e8', bloom: 0.3, exposure: 0.96, vig: 0.38, sunDisc: 0, motes: '#fff2c8', motesO: 0.75, lamp: 2.5, windowCol: '#ffe0b0' },
  morning: { ...base },
  noon: { ...base, top: '#7cc3ff', mid: '#d6f0ff', bot: '#fff4d6', sun: '#fff4e0', sunI: 1.9, sunDir: [0.2, 1, 0.3], bloom: 0.2 },
  overcast: { ...base, top: '#8e98ad', mid: '#b7bdca', bot: '#d2d4dc', fog: '#c3c8d3', fogD: 0.02, hemiSky: '#d6dbe6', hemiGround: '#8c8a90', hemiI: 0.75, sun: '#d6dae6', sunI: 0.45, sunDir: [0.2, 1, 0.3], amb: 0.35, sprite: '#cfd2dc', bloom: 0.12, exposure: 0.95, sat: 0.35, vig: 0.55, sunDisc: 0, motes: '#e6e9f0', motesO: 0.2 },
  sunset: { ...base, top: '#5a5aa8', mid: '#f59b9b', bot: '#ffd29a', fog: '#f3b2a6', fogD: 0.012, hemiSky: '#ffc9b0', hemiGround: '#6b4a68', hemiI: 0.7, sun: '#ffb27a', sunI: 1.5, sunDir: [-0.35, 0.12, -1], amb: 0.3, sprite: '#ffe0cc', bloom: 0.45, stars: 0.15, sat: 1.05, vig: 0.5, sunDisc: 1.3, motes: '#ffd7a8', motesO: 0.6 },
  starry: { ...base, top: '#0a0f36', mid: '#222a6e', bot: '#45397f', fog: '#1c2158', fogD: 0.004, hemiSky: '#7f8fff', hemiGround: '#2c2448', hemiI: 0.55, sun: '#b4c0ff', sunI: 0.5, sunDir: [0.2, 0.6, -1], amb: 0.3, sprite: '#eceeff', bloom: 0.62, exposure: 1.05, stars: 1, vig: 0.55, sunDisc: 0, motes: '#c9d4ff', motesO: 0.6 },
  festival: { ...base, top: '#121844', mid: '#2c2e72', bot: '#56407e', fog: '#24255e', fogD: 0.016, hemiSky: '#8b95ff', hemiGround: '#3a2c55', hemiI: 0.55, sun: '#b8c2ff', sunI: 0.45, sunDir: [0.3, 0.7, 0.4], amb: 0.32, sprite: '#f2eeff', bloom: 0.55, exposure: 1.05, stars: 0.8, lanterns: 1, sat: 1.05, vig: 0.5, sunDisc: 0, motes: '#ffe7b0', motesO: 0.6 },
  dawn: { ...base, top: '#7d8fd8', mid: '#ffb9c9', bot: '#ffe1a6', fog: '#f7c9c4', fogD: 0.012, hemiSky: '#ffd8c8', hemiGround: '#8a6a7a', hemiI: 0.75, sun: '#ffd09a', sunI: 1.3, sunDir: [0.1, 0.12, -1], amb: 0.35, sprite: '#fff0e6', bloom: 0.5, exposure: 1.02, stars: 0.12, lanterns: 0.45, sat: 1.05, vig: 0.42, sunDisc: 1.4, motes: '#ffe9c8', motesO: 0.55 },
};

export interface Pal {
  top: THREE.Color; mid: THREE.Color; bot: THREE.Color; fog: THREE.Color; hemiSky: THREE.Color; hemiGround: THREE.Color; sun: THREE.Color;
  sprite: THREE.Color; motes: THREE.Color; windowCol: THREE.Color; sunDir: THREE.Vector3;
  fogD: number; hemiI: number; sunI: number; amb: number; bloom: number; exposure: number; stars: number; lanterns: number; sat: number; vig: number; sunDisc: number; motesO: number; lamp: number;
}
const COLS = ['top', 'mid', 'bot', 'fog', 'hemiSky', 'hemiGround', 'sun', 'sprite', 'motes', 'windowCol'] as const;
const NUMS = ['fogD', 'hemiI', 'sunI', 'amb', 'bloom', 'exposure', 'stars', 'lanterns', 'sat', 'vig', 'sunDisc', 'motesO', 'lamp'] as const;
export function resolvePal(a: PalName, b: PalName = a, k = 0): Pal {
  const A = PALS[a], B = PALS[b]; const out = {} as Pal;
  for (const c of COLS) out[c] = new THREE.Color(A[c]).lerp(new THREE.Color(B[c]), k);
  for (const n of NUMS) out[n] = A[n] + (B[n] - A[n]) * k;
  out.sunDir = new THREE.Vector3(...A.sunDir).lerp(new THREE.Vector3(...B.sunDir), k).normalize();
  return out;
}

export const ZONE_ORIGIN: Record<Zone, THREE.Vector3> = {
  room: new THREE.Vector3(-300, 0, 0),
  park: new THREE.Vector3(0, 0, 0),
  fest: new THREE.Vector3(0, 0, 0),
  hill: new THREE.Vector3(0, 0, -80),
  sky: new THREE.Vector3(0, 70, -200),
};

// ───────── 地形函数（演员落脚用，区域内坐标） ─────────
export const creekZ = (x: number) => 6 + 1.2 * Math.sin((x - 2) * 0.15);
export const creekW = (x: number) => 3 + 3.4 * Math.exp(-(((x - 2) / 7) ** 2));
export const hillY = (x: number, z: number) => -2 + 7.04 * Math.sqrt(Math.max(0, 1 - (x * x + z * z) / 484));
export const STONES: [number, number][] = [[-7, 0], [-5.4, 0], [-3.8, 0], [-2, 0]].map(([x]) => [x, creekZ(x)]);
export const ROCK = { x: 2, z: 6, top: 0.36 };
export const BLOCK_Z = [2.95, 3.85, 4.75, 7.25, 8.15, 9.05];
export const STEPS: [number, number, number][] = [[3.6, 0.6, -1.0], [4.5, 1.3, -1.9], [5.0, 2.05, -3.1], [5.9, 2.8, -3.6]];
export const TOWER = { x: 8, z: -3, top: 3.55 };
export const PLAZA = { x: -6, z: -6 };
export const MOUND = { x: 3, z: -14.5, top: 0.75 };

function cottonTree(parent: THREE.Object3D, x: number, z: number, s: number, c: string, y = 0) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(s); parent.add(g);
  const tr = mesh(CYL, clay('#f1cfa2'), g, 0, 0.8, 0); tr.scale.set(0.16, 1.6, 0.16);
  const m = clay(c, 0.9);
  blob(g, m, 0, 2.15, 0, 1.05, 0.95, 1.05); blob(g, m, 0.75, 1.85, 0.2, 0.7, 0.62, 0.7); blob(g, m, -0.7, 1.9, -0.15, 0.72, 0.66, 0.72); blob(g, m, 0.1, 2.75, -0.1, 0.62, 0.55, 0.62);
  return g;
}
function cloud(parent: THREE.Object3D, x: number, y: number, z: number, s: number) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(s); parent.add(g);
  const m = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, emissive: '#b9b2ff', emissiveIntensity: 0.18 });
  [[0, 0, 0, 1.4], [1.3, -0.2, 0.2, 1.0], [-1.3, -0.15, -0.1, 1.05], [0.5, 0.6, -0.2, 0.9], [-0.6, 0.5, 0.3, 0.8], [2.2, -0.4, -0.2, 0.7], [-2.2, -0.35, 0.1, 0.65]]
    .forEach(([a, b, c, r]) => blob(g, m, a, b, c, r * 1.15, r * 0.72, r));
  return g;
}

export interface RoomRefs { door: THREE.Group; doorLight: THREE.Mesh; shaft: THREE.Mesh; lamp: THREE.PointLight; lampBulb: THREE.Mesh; windowGlass: THREE.MeshStandardMaterial }
export interface ParkRefs { creek: THREE.Mesh; steps: THREE.Mesh[]; blocks: THREE.Mesh[]; queue: THREE.Mesh[]; fest: THREE.Group; lanternMat: THREE.MeshStandardMaterial; halos: THREE.Mesh[]; bulbs: THREE.InstancedMesh; bulbMat: THREE.MeshBasicMaterial }

export class World {
  root = new THREE.Group();
  zones: Record<'room' | 'park' | 'hill' | 'sky', THREE.Group>;
  room!: RoomRefs; park!: ParkRefs;
  dome: THREE.Mesh; domeMat: THREE.ShaderMaterial; stars: THREE.Points; starMat: THREE.PointsMaterial;
  private S: Shared;
  constructor(S: Shared, scene: THREE.Scene) {
    this.S = S; scene.add(this.root);
    this.zones = { room: new THREE.Group(), park: new THREE.Group(), hill: new THREE.Group(), sky: new THREE.Group() };
    (Object.keys(this.zones) as (keyof World['zones'])[]).forEach((k) => {
      const o = ZONE_ORIGIN[k]; this.zones[k].position.copy(o); this.root.add(this.zones[k]);
    });
    // 天空球：三段渐变 + 太阳
    this.domeMat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: new THREE.Color() }, mid: { value: new THREE.Color() }, bot: { value: new THREE.Color() }, sunCol: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3(0, 1, 0) }, sunI: { value: 0 } },
      vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform vec3 top; uniform vec3 mid; uniform vec3 bot; uniform vec3 sunCol; uniform vec3 sunDir; uniform float sunI; varying vec3 vDir;
        void main(){ vec3 d = normalize(vDir); float y = d.y;
          vec3 c = y > 0.0 ? mix(mid, top, smoothstep(0.0, 0.6, y)) : mix(mid, bot, smoothstep(0.0, -0.3, y));
          float s = max(dot(d, normalize(sunDir)), 0.0);
          c += sunCol * sunI * (smoothstep(0.9965, 0.998, s) * 1.6 + pow(s, 14.0) * 0.35 + pow(s, 3.0) * 0.08);
          gl_FragColor = vec4(c, 1.0); }`,
    });
    this.dome = new THREE.Mesh(new THREE.SphereGeometry(900, 40, 20), this.domeMat); this.dome.renderOrder = -10; this.dome.frustumCulled = false; scene.add(this.dome);
    const sp = new Float32Array(1400 * 3);
    for (let i = 0; i < 1400; i++) {
      const u = hash(i * 3.1), v = hash(i * 7.7 + 1); const th = u * TAU, ph = Math.acos(1 - v * 1.05);
      sp.set([Math.sin(ph) * Math.cos(th) * 800, Math.cos(ph) * 800 - 30, Math.sin(ph) * Math.sin(th) * 800], i * 3);
    }
    const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
    this.starMat = new THREE.PointsMaterial({ map: S.star, size: 7, sizeAttenuation: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, color: '#fff6e0' });
    this.stars = new THREE.Points(sg, this.starMat); this.stars.renderOrder = -9; this.stars.frustumCulled = false; scene.add(this.stars);
    this.buildRoom(); this.buildPark(); this.buildHill(); this.buildSky();
  }

  // ───────── 夜里的小卧室 ─────────
  private buildRoom() {
    const g = this.zones.room;
    mesh(rbox(12, 0.4, 10, 0.12), clay('#f2cfa6'), g, 0, -0.2, 0);
    const wallM = clay('#b9c3f2'), wall2 = clay('#cbbaf2');
    mesh(rbox(9.35, 7, 0.3, 0.1), wallM, g, -1.33, 3.5, -5.15); mesh(rbox(1.35, 7, 0.3, 0.1), wallM, g, 5.33, 3.5, -5.15); mesh(rbox(1.3, 4.6, 0.3, 0.06), wallM, g, 4.0, 4.7, -5.15);
    mesh(rbox(0.3, 7, 10, 0.1), wall2, g, -6.15, 3.5, 0);
    const rug = mesh(CYL, clay('#ffc1d6', 0.95), g, 0.6, 0.02, -0.4, false); rug.scale.set(2.4, 0.04, 2.4);
    // 圆窗 + 窗外夜色
    const ring = mesh(new THREE.TorusGeometry(1.0, 0.13, 14, 48), clay('#fff3e2'), g, -1.6, 4.0, -4.96);
    ring.castShadow = false;
    const glass = new THREE.MeshStandardMaterial({ color: '#2a3274', emissive: '#2a3274', emissiveIntensity: 0.9, roughness: 0.4 });
    mesh(new THREE.CircleGeometry(1.0, 40), glass, g, -1.6, 4.0, -4.99, false);
    mesh(new THREE.CircleGeometry(0.26, 24), glowy('#fff2c0', 1.4), g, -1.25, 4.35, -4.97, false);
    for (let i = 0; i < 7; i++) {
      const st = mesh(new THREE.CircleGeometry(0.05 + hash(i) * 0.04, 5), glowy('#ffffff', 1.5), g, -1.6 + (hash(i + 2) - 0.5) * 1.5, 4 + (hash(i + 5) - 0.5) * 1.4, -4.975, false);
      st.visible = Math.hypot(st.position.x + 1.6, st.position.y - 4) < 0.9;
    }
    // 墙上的星星贴纸
    const starShape = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU + Math.PI / 2, r = i % 2 ? 0.11 : 0.26; starShape.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    const starGeo = new THREE.ShapeGeometry(starShape);
    [[1.4, 5.2], [2.3, 4.4], [-3.6, 5.4], [-4.6, 4.3], [0.6, 6.0]].forEach(([x, y], i) => mesh(starGeo, glowy(CANDY[i % 6], 0.55), g, x, y, -4.98, false));
    // 床
    const bx = -3.6, bz = -2.6;
    mesh(rbox(3.0, 0.55, 1.8, 0.18), clay('#f3c999'), g, bx, 0.28, bz);
    mesh(rbox(2.9, 0.35, 1.7, 0.16), clay('#fffaf3'), g, bx, 0.72, bz);
    mesh(rbox(1.9, 0.22, 1.76, 0.1), clay('#93b9f2'), g, bx + 0.5, 0.92, bz);
    const pillow = mesh(new THREE.CapsuleGeometry(0.26, 0.8, 6, 16), clay('#fff1dc'), g, bx - 1.05, 1.0, bz); pillow.rotation.x = Math.PI / 2;
    mesh(rbox(0.22, 1.5, 1.8, 0.1), clay('#f0b98a'), g, bx - 1.55, 0.75, bz);
    // 床头柜 + 夜灯
    mesh(rbox(0.9, 0.9, 0.8, 0.14), clay('#ffd7a8'), g, -1.4, 0.45, -3.6);
    mesh(CYL, clay('#ffffff'), g, -1.78, 0.98, -3.75).scale.set(0.14, 0.16, 0.14);
    const bulb = mesh(SPHERE, glowy('#ffd27a', 1.3), g, -1.78, 1.25, -3.75, false); bulb.scale.setScalar(0.22);
    const lamp = new THREE.PointLight('#ffc87a', 6, 9, 1.6); lamp.position.set(-1.78, 1.5, -3.4); g.add(lamp);
    // 小熊玩偶（全部是球）
    const bear = new THREE.Group(); bear.position.set(2.2, 0, -3.7); g.add(bear); const bm = clay('#d9a273'), bl = clay('#f3d4b0');
    blob(bear, bm, 0, 0.45, 0, 0.45, 0.48, 0.4); blob(bear, bm, 0, 1.08, 0.05, 0.36, 0.34, 0.33); blob(bear, bm, -0.27, 1.36, 0, 0.12, 0.12, 0.08); blob(bear, bm, 0.27, 1.36, 0, 0.12, 0.12, 0.08);
    blob(bear, bl, 0, 1.0, 0.32, 0.14, 0.11, 0.08); blob(bear, bl, 0, 0.45, 0.33, 0.25, 0.27, 0.1);
    // 积木堆 + 小皮球
    [[3.2, 0.25, -2.4, 0], [3.95, 0.25, -2.55, 1], [3.55, 0.75, -2.45, 2], [4.5, 0.25, -1.6, 3]].forEach(([x, y, z, c]) => mesh(rbox(0.5, 0.5, 0.5, 0.1), clay(CANDY[c]), g, x, y, z));
    mesh(SPHERE, glossy('#ff9fbf'), g, 1.1, 0.3, -0.7).scale.setScalar(0.3);
    // 门（铰链在左侧，可开）
    const frame = clay('#fff1e2');
    mesh(rbox(0.16, 2.6, 0.36, 0.05), frame, g, 3.27, 1.3, -5.05); mesh(rbox(0.16, 2.6, 0.36, 0.05), frame, g, 4.73, 1.3, -5.05); mesh(rbox(1.62, 0.16, 0.36, 0.05), frame, g, 4.0, 2.48, -5.05);
    const doorLight = mesh(new THREE.PlaneGeometry(1.32, 2.42), new THREE.MeshBasicMaterial({ color: '#fff3d6' }), g, 4.0, 1.21, -5.3, false);
    const door = new THREE.Group(); door.position.set(3.35, 0, -5.02); g.add(door);
    mesh(rbox(1.3, 2.4, 0.12, 0.06), clay('#f6a5b5'), door, 0.65, 1.2, 0); mesh(SPHERE, glossy('#ffe08a'), door, 1.1, 1.15, 0.1).scale.setScalar(0.07);
    const shaft = mesh(new THREE.PlaneGeometry(1, 1), additive(this.S.glow, '#ffe2a8', 0), g, 3.4, 0.03, -3.2, false); shaft.rotation.x = -Math.PI / 2; shaft.scale.set(2.6, 4.4, 1);
    this.room = { door, doorLight, shaft, lamp, lampBulb: bulb, windowGlass: glass };
  }

  // ───────── 棉花糖游乐场（兼糖果灯会） ─────────
  private buildPark() {
    const g = this.zones.park;
    const ground = mesh(CYL, clay('#bfe8b4', 0.95), g, 0, -0.5, 0); ground.scale.set(75, 1, 75); ground.castShadow = false;
    [[-38, -32, 15, '#a9dda0'], [30, -40, 18, '#c7ecb2'], [-52, 8, 16, '#f6d3e4'], [46, 14, 14, '#d9cbff'], [12, -52, 16, '#fbe3b8'], [-20, -58, 20, '#b8e6c0'], [55, -18, 12, '#ffd1dc']]
      .forEach(([x, z, r, c]) => { const m = blob(g, clay(c as string, 0.95), x as number, -1, z as number, r as number, (r as number) * 0.42, r as number); m.castShadow = false; });
    // 小溪：沿中心线生成的带子，水纹贴图随时间滚动
    const N = 160, pos: number[] = [], uv: number[] = [], idx: number[] = [];
    for (let i = 0; i <= N; i++) {
      const x = -42 + (84 * i) / N, zc = creekZ(x), w = creekW(x) / 2;
      pos.push(x, 0.03, zc - w, x, 0.03, zc + w); uv.push(x / 7, 0, x / 7, 1);
      if (i < N) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); cg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); cg.setIndex(idx); cg.computeVertexNormals();
    const creek = new THREE.Mesh(cg, new THREE.MeshStandardMaterial({ map: this.S.ripple, color: '#d6f1ff', roughness: 0.25, emissive: '#5fb8e8', emissiveIntensity: 0.18 })); creek.receiveShadow = true; g.add(creek);
    const peb = clay('#e6dccf');
    for (let i = 0; i < 70; i++) { const x = -40 + i * 1.17 + hash(i) * 0.6, side = i % 2 ? 1 : -1, z = creekZ(x) + side * (creekW(x) / 2 + 0.1); blob(g, peb, x, 0.02, z, 0.22 + hash(i + 4) * 0.2, 0.12, 0.2 + hash(i + 8) * 0.15); }
    // 溪中的踏脚石与中间的大石头
    const stoneM = clay('#dccfc2');
    STONES.forEach(([x, z]) => mesh(CYL, stoneM, g, x, 0.11, z).scale.set(0.55, 0.22, 0.55));
    mesh(CYL, clay('#eadfd2'), g, ROCK.x, 0.18, ROCK.z).scale.set(1.05, 0.36, 1.05);
    // 积木桥（第十一镜逐块落位）+ 岸边排队的积木
    const blocks = BLOCK_Z.map((z, i) => mesh(rbox(0.95, 0.5, 0.85, 0.12), glossy(CANDY[i % 6]), g, ROCK.x, 0.2, z));
    const queue = [0, 1, 2, 3, 4, 5].map((i) => mesh(rbox(0.5, 0.5, 0.5, 0.1), glossy(CANDY[i % 6]), g, 2.4 + i * 0.62, 0.25, 11.9));
    // 攀爬塔 + 滑梯 + 魔法糖果踏板
    const post = clay('#ffffff');
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => mesh(CYL, post, g, TOWER.x + a, 1.7, TOWER.z + b).scale.set(0.12, 3.4, 0.12));
    mesh(rbox(2.6, 0.3, 2.6, 0.12), clay('#ffd36e'), g, TOWER.x, 3.4, TOWER.z);
    mesh(new THREE.ConeGeometry(1.8, 1.4, 28), clay('#ff9fbf'), g, TOWER.x, 6.65, TOWER.z); mesh(SPHERE, glossy('#fff0a0'), g, TOWER.x, 7.45, TOWER.z).scale.setScalar(0.2);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => mesh(CYL, post, g, TOWER.x + a, 4.75, TOWER.z + b).scale.set(0.07, 2.4, 0.07));
    const slide = mesh(rbox(5.3, 0.16, 1.1, 0.07), glossy('#8fd3ff'), g, 11.45, 1.8, TOWER.z); slide.rotation.z = -0.62;
    const steps = STEPS.map(([x, y, z], i) => { const m = mesh(CYL, glossy(CANDY[(i + 2) % 6]), g, x, y, z); m.scale.set(0.5, 0.18, 0.5); return m; });
    // 秋千、跷跷板、土坡
    const sw = new THREE.Group(); sw.position.set(-13, 0, -9.5); g.add(sw); const swm = clay('#ffb3c7');
    [[-1.6, 1], [1.6, 1]].forEach(([x]) => { const l1 = mesh(CYL, swm, sw, x, 1.4, -0.5); l1.scale.set(0.1, 2.9, 0.1); l1.rotation.x = 0.33; const l2 = mesh(CYL, swm, sw, x, 1.4, 0.5); l2.scale.set(0.1, 2.9, 0.1); l2.rotation.x = -0.33; });
    const bar = mesh(CYL, swm, sw, 0, 2.75, 0); bar.scale.set(0.1, 3.4, 0.1); bar.rotation.z = Math.PI / 2;
    [-0.6, 0.6].forEach((x) => { mesh(rbox(0.55, 0.08, 0.35, 0.03), clay('#8fd3ff'), sw, x, 0.75, 0); [-0.22, 0.22].forEach((d) => mesh(CYL, clay('#ffffff'), sw, x + d, 1.75, 0).scale.set(0.015, 2, 0.015)); });
    const ss = mesh(rbox(3.6, 0.12, 0.4, 0.05), clay('#b59cff'), g, -14, 0.45, 2.5); ss.rotation.z = 0.12; mesh(new THREE.ConeGeometry(0.3, 0.45, 16), clay('#ffe066'), g, -14, 0.2, 2.5);
    blob(g, clay('#c8edb8', 0.95), MOUND.x, 0, MOUND.z, 2.6, MOUND.top, 2.6);
    [[-10.5, -4.2, 1.2, '#ffc6dc'], [-1.2, -2.6, 1.0, '#bff0d6'], [5.6, -20.5, 1.1, '#fff0b8'], [12.5, -8.5, 1.3, '#ffc6dc'], [14.5, 3.4, 1.0, '#dccbff'], [6.6, 12.8, 1.1, '#bff0d6'],
      [-9, 12.4, 1.2, '#fff0b8'], [-17.5, 6.5, 1.3, '#ffc6dc'], [17.5, -2.4, 1.2, '#bff0d6'], [-3.0, -21.0, 1.1, '#dccbff'], [-19, -14, 1.3, '#bff0d6'], [9, -17.5, 1.2, '#ffc6dc'], [20, 9, 1.4, '#fff0b8'], [-24, -4, 1.4, '#dccbff']]
      .forEach(([x, z, s, c]) => cottonTree(g, x as number, z as number, s as number, c as string));
    // 糖果灯会（终段才显示）：棒棒糖灯 + 灯串
    const fest = new THREE.Group(); g.add(fest);
    const lanternMat = new THREE.MeshStandardMaterial({ map: this.S.spiral, emissive: 0xffffff, emissiveMap: this.S.spiral, emissiveIntensity: 1, roughness: 0.3 });
    const discGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.14, 40); discGeo.rotateX(Math.PI / 2);
    const lp: THREE.Vector3[] = [];
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; lp.push(new THREE.Vector3(PLAZA.x + Math.cos(a) * 6.6, 0, PLAZA.z + Math.sin(a) * 6.6)); }
    for (let i = 0; i < 6; i++) lp.push(new THREE.Vector3(-14 + i * 3.6, 0, -16.4));
    const halos: THREE.Mesh[] = [];
    lp.forEach((p, i) => {
      mesh(CYL, clay('#fffaf2', 0.5), fest, p.x, 1.1, p.z).scale.set(0.05, 2.2, 0.05);
      const d = mesh(discGeo, lanternMat, fest, p.x, 2.55, p.z); d.lookAt(i < 12 ? new THREE.Vector3(p.x * 2 - PLAZA.x, 2.55, p.z * 2 - PLAZA.z) : new THREE.Vector3(p.x, 2.55, 10));
      const h = mesh(new THREE.PlaneGeometry(1, 1), additive(this.S.glow, CANDY[i % 6], 0.6), fest, p.x, 2.55, p.z, false); h.scale.setScalar(2.4); halos.push(h);
    });
    const spans: [THREE.Vector3, THREE.Vector3][] = [];
    for (let i = 0; i < 12; i++) spans.push([lp[i], lp[(i + 1) % 12]]);
    for (let i = 12; i < 17; i++) spans.push([lp[i], lp[i + 1]]);
    const per = 9, bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.075, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffffff' }), spans.length * per);
    const m4 = new THREE.Matrix4(), col = new THREE.Color(); let k = 0;
    spans.forEach(([a, b]) => { for (let j = 0; j < per; j++) { const t = (j + 0.5) / per; const p = a.clone().lerp(b, t); p.y = 2.95 - Math.sin(t * Math.PI) * 0.55; m4.makeTranslation(p.x, p.y, p.z); bulbs.setMatrixAt(k, m4); bulbs.setColorAt(k, col.set(CANDY[k % 6])); k++; } });
    fest.add(bulbs);
    this.park = { creek, steps, blocks, queue, fest, lanternMat, halos, bulbs, bulbMat: bulbs.material as THREE.MeshBasicMaterial };
  }

  // ───────── 黄昏山坡与大树 ─────────
  private buildHill() {
    const g = this.zones.hill;
    const h = blob(g, clay('#a8dca0', 0.95), 0, -2, 0, 22, 7.04, 22); h.castShadow = false;
    blob(g, clay('#bfe5b0', 0.95), -20, -3, -14, 16, 6, 16).castShadow = false; blob(g, clay('#f3cde0', 0.95), 22, -3, -10, 14, 5.5, 14).castShadow = false;
    const tr = mesh(CYL, clay('#d9b38c'), g, 0, 6.4, -0.6); tr.scale.set(0.38, 3.2, 0.38);
    const leaf = clay('#9fdcaa', 0.9), pink = clay('#ffc6dc', 0.9);
    [[0, 8.3, -0.6, 2.7], [1.9, 7.7, 0.1, 1.8], [-2.0, 7.8, -0.2, 1.9], [0.4, 9.7, -0.9, 1.7], [-0.6, 8.0, 1.3, 1.4]].forEach(([x, y, z, r]) => blob(g, leaf, x, y, z, r, r * 0.85, r));
    for (let i = 0; i < 14; i++) { const a = hash(i) * TAU, r = 2.2 + hash(i + 3) * 0.8; blob(g, pink, Math.cos(a) * r, 7.4 + hash(i + 7) * 2.4, -0.6 + Math.sin(a) * r, 0.28, 0.24, 0.28); }
    const fl = new THREE.InstancedMesh(new THREE.SphereGeometry(0.09, 8, 6), clay('#ffffff'), 160); const m4 = new THREE.Matrix4(), c = new THREE.Color();
    for (let i = 0; i < 160; i++) { const a = hash(i + 20) * TAU, r = 2 + hash(i + 40) * 15; const x = Math.cos(a) * r, z = Math.sin(a) * r; m4.makeTranslation(x, hillY(x, z) + 0.05, z); fl.setMatrixAt(i, m4); fl.setColorAt(i, c.set(CANDY[i % 6])); }
    g.add(fl);
  }

  // ───────── 星空、云朵小岛、大月亮 ─────────
  private buildSky() {
    const g = this.zones.sky;
    const moon = mesh(SPHERE, new THREE.MeshStandardMaterial({ color: '#fff4cf', emissive: '#ffe9a8', emissiveIntensity: 0.85, roughness: 1 }), g, 2, 9, -34, false); moon.scale.setScalar(10);
    const cr = clay('#f2e2b0');
    [[-3, 3, 0.9], [3.5, -2, 1.4], [-1, -4.5, 0.8], [4.5, 4, 0.7], [-5, -1, 1.1]].forEach(([x, y, r]) => { const p = new THREE.Vector3(x, y, 0); p.z = Math.sqrt(Math.max(0, 100 - x * x - y * y)) - 0.25; blob(g, cr, 2 + p.x, 9 + p.y, -34 + p.z, r, r, r * 0.3); });
    const halo = mesh(new THREE.PlaneGeometry(1, 1), additive(this.S.glow, '#fff0c0', 0.55), g, 2, 9, -36, false); halo.scale.setScalar(46);
    [[-3.5, 0, -7, 1.0], [3.6, -1.6, -4, 0.8], [-9, 2, -14, 1.3], [9.5, 3, -16, 1.4], [0.5, -4.5, 2, 1.1], [-7, -3, 5, 0.9], [7, -5, 6, 1.0], [-13, 6, -22, 1.6], [14, 8, -24, 1.8]]
      .forEach(([x, y, z, s]) => cloud(g, x, y, z, s));
  }

  setZone(z: Zone) {
    const fest = z === 'fest';
    this.zones.room.visible = z === 'room';
    this.zones.park.visible = z !== 'room';
    this.zones.hill.visible = z !== 'room';
    this.zones.sky.visible = z === 'sky' || z === 'hill' || fest;
    this.park.fest.visible = fest;
  }

  /** 每帧：天空、星空、水纹、灯会的灯（只读时间） */
  update(T: number, pal: Pal, cam: THREE.Camera, pulse: number) {
    this.dome.position.copy(cam.position); this.stars.position.copy(cam.position);
    const u = this.domeMat.uniforms; u.top.value.copy(pal.top); u.mid.value.copy(pal.mid); u.bot.value.copy(pal.bot); u.sunCol.value.copy(pal.sun); u.sunDir.value.copy(pal.sunDir); u.sunI.value = pal.sunDisc;
    this.starMat.opacity = pal.stars * (0.85 + 0.15 * Math.sin(T * 2.3)); this.stars.visible = pal.stars > 0.01;
    this.S.ripple.offset.set(T * 0.06, Math.sin(T * 0.7) * 0.02);
    const L = pal.lanterns; this.park.lanternMat.emissiveIntensity = (0.35 + 0.9 * L) * (1 + 0.35 * pulse);
    this.park.bulbMat.color.setScalar(0.35 + L * (0.9 + 0.5 * pulse));
    this.park.halos.forEach((h, i) => { const p = h.getWorldPosition(new THREE.Vector3()); h.rotation.set(0, Math.atan2(cam.position.x - p.x, cam.position.z - p.z), 0); (h.material as THREE.MeshBasicMaterial).opacity = L * (0.45 + 0.3 * pulse) * (0.8 + 0.2 * Math.sin(T * 3 + i)); });
    const r = this.room; r.lamp.intensity = pal.lamp; (r.lampBulb.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.4 + pal.lamp * 0.15;
    r.windowGlass.color.copy(pal.windowCol); r.windowGlass.emissive.copy(pal.windowCol);
  }
}

// ───────── 特效池：星光、光环、彩纸、光晕、浮尘 ─────────
export class FX {
  sparks: THREE.Points; private sPos: THREE.BufferAttribute; private sCol: THREE.BufferAttribute; private sUsed = 0;
  rings: THREE.Mesh[] = []; glows: THREE.Mesh[] = []; confetti: THREE.InstancedMesh; motes: THREE.Points; moteMat: THREE.PointsMaterial;
  private S: Shared; private m4 = new THREE.Matrix4(); private q = new THREE.Quaternion(); private e = new THREE.Euler(); private v = new THREE.Vector3(); private one = new THREE.Vector3(1, 1, 1);
  static SPARKS = 300;
  constructor(S: Shared, scene: THREE.Scene) {
    this.S = S;
    const n = FX.SPARKS, g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3)); g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    this.sPos = g.getAttribute('position') as THREE.BufferAttribute; this.sCol = g.getAttribute('color') as THREE.BufferAttribute;
    this.sparks = new THREE.Points(g, new THREE.PointsMaterial({ map: S.star, size: 0.32, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    this.sparks.frustumCulled = false; this.sparks.renderOrder = 6; scene.add(this.sparks);
    for (let i = 0; i < 8; i++) { const r = new THREE.Mesh(new THREE.TorusGeometry(1, 0.035, 8, 72), new THREE.MeshBasicMaterial({ color: CANDY[i % 6], transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); r.visible = false; scene.add(r); this.rings.push(r); }
    for (let i = 0; i < 24; i++) { const gl = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), additive(S.glow, '#ffffff', 1)); gl.visible = false; gl.renderOrder = 4; scene.add(gl); this.glows.push(gl); }
    this.confetti = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.13, 0.08), new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, fog: false }), 260);
    const c = new THREE.Color(); for (let i = 0; i < 260; i++) this.confetti.setColorAt(i, c.set(CANDY[i % 6]));
    this.confetti.frustumCulled = false; this.confetti.visible = false; scene.add(this.confetti);
    const mg = new THREE.BufferGeometry(); mg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(160 * 3), 3));
    this.moteMat = new THREE.PointsMaterial({ map: S.glow, size: 0.16, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
    this.motes = new THREE.Points(mg, this.moteMat); this.motes.frustumCulled = false; scene.add(this.motes);
  }
  reset() {
    this.sUsed = 0; this.rings.forEach((r) => (r.visible = false)); this.glows.forEach((g) => (g.visible = false)); this.confetti.visible = false;
  }
  /** 一团星光：区域内坐标，amount 0–1，mode: 'orbit' 绕圈 / 'rise' 上飘 / 'swirl' 收拢 */
  sparkle(x: number, y: number, z: number, radius: number, amount: number, T: number, seed = 0, mode: 'orbit' | 'rise' | 'swirl' = 'orbit', swirlK = 0) {
    const o = this.S.origin, cnt = Math.min(Math.floor(90 * clamp(amount, 0, 1.5)), FX.SPARKS - this.sUsed); const c = new THREE.Color();
    for (let i = 0; i < cnt; i++) {
      const h1 = hash(i + seed * 97), h2 = hash(i * 1.7 + seed * 13 + 5), h3 = hash(i * 2.3 + seed * 31 + 9);
      let px: number, py: number, pz: number;
      if (mode === 'rise') { const life = (T * (0.3 + h2 * 0.4) + h1) % 1; const a = h3 * TAU; px = Math.cos(a) * radius * h2; pz = Math.sin(a) * radius * h2; py = life * radius * 2.2 - radius * 0.3; }
      else if (mode === 'swirl') { const a = h1 * TAU + T * (1.5 + h2) ; const r = radius * (0.15 + h2) * (1 - swirlK) + 0.05; px = Math.cos(a) * r; pz = Math.sin(a) * r; py = (h3 - 0.5) * radius * (1 - swirlK) * 1.4; }
      else { const a = h1 * TAU + T * (0.4 + h2 * 0.8); const r = radius * (0.3 + 0.7 * h2); px = Math.cos(a) * r; pz = Math.sin(a) * r; py = (h3 - 0.5) * radius + Math.sin(T * 2 + i) * 0.1; }
      const tw = 0.5 + 0.5 * Math.sin(T * (4 + h2 * 5) + i);
      this.sPos.setXYZ(this.sUsed, x + o.x + px, y + o.y + py, z + o.z + pz);
      c.set(CANDY[i % 6]).lerp(new THREE.Color(1, 1, 1), 0.35).multiplyScalar(tw * Math.min(1, amount)); this.sCol.setXYZ(this.sUsed, c.r, c.g, c.b); this.sUsed++;
    }
  }
  ring(i: number, x: number, y: number, z: number, r: number, opacity: number, rotX = Math.PI / 2) {
    const m = this.rings[i]; const o = this.S.origin; m.position.set(x + o.x, y + o.y, z + o.z); m.scale.setScalar(Math.max(0.01, r)); m.rotation.set(rotX, 0, 0);
    (m.material as THREE.MeshBasicMaterial).opacity = clamp(opacity); m.visible = opacity > 0.01;
  }
  glow(i: number, x: number, y: number, z: number, size: number, color: THREE.ColorRepresentation, opacity: number) {
    const g = this.glows[i]; const o = this.S.origin; g.position.set(x + o.x, y + o.y, z + o.z); g.scale.setScalar(size);
    const m = g.material as THREE.MeshBasicMaterial; m.color.set(color); m.opacity = clamp(opacity, 0, 1.5); g.visible = opacity > 0.01;
  }
  glowWorld(i: number, p: THREE.Vector3, size: number, color: THREE.ColorRepresentation, opacity: number) {
    const o = this.S.origin; this.glow(i, p.x - o.x, p.y - o.y, p.z - o.z, size, color, opacity);
  }
  /** 彩纸：从高处飘落，t 为开始后的秒数 */
  rain(cx: number, cz: number, radius: number, t: number, amount = 1) {
    const o = this.S.origin; const n = Math.floor(260 * clamp(amount));
    for (let i = 0; i < 260; i++) {
      const h1 = hash(i * 3.3), h2 = hash(i * 5.1 + 2), h3 = hash(i * 7.9 + 4);
      const y = 9 + h3 * 4 - ((t * (1.1 + h2 * 0.9) + h1 * 13) % 13);
      this.v.set(cx + o.x + (h1 - 0.5) * radius * 2 + Math.sin(t * 1.3 + i) * 0.3, o.y + y, cz + o.z + (h2 - 0.5) * radius * 2);
      this.e.set(t * (2 + h3 * 3) + i, t * (1.5 + h1 * 2), i * 0.7); this.q.setFromEuler(this.e);
      this.m4.compose(this.v, this.q, i < n ? this.one : new THREE.Vector3(0, 0, 0)); this.confetti.setMatrixAt(i, this.m4);
    }
    this.confetti.instanceMatrix.needsUpdate = true; this.confetti.visible = true;
  }
  /** 收尾：把没用到的星光藏起来；浮尘跟着视线目标飘；光晕转向镜头 */
  finish(T: number, cam: THREE.Camera, target: THREE.Vector3, pal: Pal) {
    for (let i = this.sUsed; i < FX.SPARKS; i++) this.sPos.setXYZ(i, 0, -9999, 0);
    this.sPos.needsUpdate = true; this.sCol.needsUpdate = true;
    const mp = this.motes.geometry.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < 160; i++) {
      const h1 = hash(i * 1.3 + 7), h2 = hash(i * 2.9 + 1), h3 = hash(i * 4.1 + 3);
      const wrap = (v: number, s: number) => ((v % s) + s) % s - s / 2;
      mp.setXYZ(i, target.x + wrap(h1 * 16 + Math.sin(T * 0.3 + i) * 0.6, 16), target.y + wrap(h2 * 8 + T * (0.12 + h3 * 0.2), 8) + 1.5, target.z + wrap(h3 * 16 + Math.cos(T * 0.25 + i) * 0.6, 16));
    }
    mp.needsUpdate = true; this.moteMat.color.copy(pal.motes); this.moteMat.opacity = pal.motesO;
    this.glows.forEach((g) => { if (g.visible) g.rotation.set(0, Math.atan2(cam.position.x - g.position.x, cam.position.z - g.position.z), 0); });
    this.rings.forEach((r) => { if (r.visible) r.rotation.z = T * 0.5; });
  }
}
