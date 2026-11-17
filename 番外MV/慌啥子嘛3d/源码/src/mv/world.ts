// 软 3D 世界：一块山谷里摆好所有布景，镜头在布景之间走；材质一律低粗糙度的「黏土」感，圆角、鼓包、粉彩。
// 区域：山坡（原点）· 茶馆（x=+40）· 节拍舞台（x=-40）· 长路（往 -z 方向蜿蜒）· 天空（太阳 / 月亮 / 云 / 星 / 孔明灯）
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { Actor, C, Particles, clamp, glowTex, hash, lerp, petalTex, starTex } from './core';

const clay = (c: number, o: Partial<THREE.MeshStandardMaterialParameters> = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.82, metalness: 0, ...o });
const SPH = new THREE.SphereGeometry(1, 28, 20);
const CYL = new THREE.CylinderGeometry(1, 1, 1, 24);
const shadowy = <T extends THREE.Object3D>(o: T, cast = true, recv = true) => { o.traverse((m) => { if ((m as THREE.Mesh).isMesh) { m.castShadow = cast; m.receiveShadow = recv; } }); return o; };

export const TEA_X = 40, STAGE_X = -40;
export const ROAD_PTS = [[16, 0, 8], [16.5, 0, -6], [13, 0, -18], [19, 0, -32], [14, 0, -48], [20, 0, -66], [16, 0, -90], [18, 0, -120]];
/** 中心小山坡的表面高度 */
export const hillY = (x: number, z: number) => { const q = 1 - (x / 9) ** 2 - ((z + 4) / 7) ** 2; return q > 0 ? Math.max(0, -0.6 + 1.6 * Math.sqrt(q)) : 0; };

const SKY_VS = `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const SKY_FS = `uniform vec3 uTop; uniform vec3 uHor; uniform vec3 uBot; uniform vec3 uSun; uniform vec3 uSunCol; varying vec3 vP;
void main(){ float h = vP.y; vec3 c = h > 0.0 ? mix(uHor, uTop, pow(clamp(h, 0.0, 1.0), 0.55)) : mix(uHor, uBot, clamp(-h * 3.0, 0.0, 1.0));
  float s = max(dot(normalize(vP), normalize(uSun)), 0.0); c += uSunCol * (pow(s, 6.0) * 0.35 + pow(s, 60.0) * 0.5);
  gl_FragColor = vec4(c, 1.0); }`;

// 一天的颜色：白天 → 黄昏 → 夜
const TOD = {
  top: [0x7ec8ff, 0xff9eb5, 0x1b1f4b, 0x0b0d26], hor: [0xd8f1ff, 0xffc58a, 0x6c4f8f, 0x26245a], bot: [0xbfe3c0, 0xa86d6b, 0x2a2350, 0x14123a],
  sun: [0xfff1c9, 0xff8a4c, 0xff6a6a, 0x000000], hemiS: [0xeaf6ff, 0xffc7a8, 0x8f86d8, 0x5a5ca8], hemiG: [0x9bc48a, 0x8a5f6a, 0x403866, 0x2a2850],
  fog: [0xd8f1ff, 0xf3b48c, 0x4d3f7a, 0x1c1c48],
};
function todColor(arr: number[], x: number) { const f = clamp(x) * (arr.length - 1); const i = Math.min(arr.length - 2, Math.floor(f)); return C(arr[i]).lerp(C(arr[i + 1]), f - i); }

export interface Flower { g: THREE.Group; p: THREE.Vector3; t: number; col: number }
export class World {
  root = new THREE.Group();
  sky: THREE.Mesh<THREE.SphereGeometry, THREE.ShaderMaterial>; hemi: THREE.HemisphereLight; sun: THREE.DirectionalLight; amb: THREE.AmbientLight;
  sunBall: THREE.Mesh; sunGlow: THREE.Sprite; moon: THREE.Group; moonGlow: THREE.Sprite; stars: Particles; fireflies: Particles; petals: Particles;
  clouds: THREE.Group[] = []; flowers: Flower[] = []; trees: THREE.Group[] = []; boxes: THREE.Mesh[] = []; balloons: THREE.Group[] = []; lanterns: THREE.Group[] = [];
  hangLanterns: THREE.Mesh[] = []; drums: THREE.Mesh[] = []; drumMats: THREE.MeshStandardMaterial[] = [];
  luckStar: THREE.Mesh; clock: THREE.Group; clockHands: THREE.Mesh[] = []; ring: THREE.Mesh; ringGeo: THREE.TubeGeometry; bed: THREE.Group; tags: THREE.Mesh[] = [];
  cast: Record<string, Actor> = {}; props: Actor[] = []; fog: THREE.Fog; tod = 0;
  road: THREE.Mesh; posts: THREE.Group[] = [];
  constructor(scene: THREE.Scene) {
    scene.add(this.root);
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, vertexShader: SKY_VS, fragmentShader: SKY_FS,
      uniforms: { uTop: { value: C(0) }, uHor: { value: C(0) }, uBot: { value: C(0) }, uSun: { value: new THREE.Vector3(0, 1, -1) }, uSunCol: { value: C(0) } } }));
    this.sky.renderOrder = -10; scene.add(this.sky);
    this.fog = new THREE.Fog(0xd8f1ff, 70, 260); scene.fog = this.fog;
    this.hemi = new THREE.HemisphereLight(0xffffff, 0x88aa77, 1.1); this.amb = new THREE.AmbientLight(0xffffff, 0.25);
    this.sun = new THREE.DirectionalLight(0xfff1c9, 1.8); this.sun.castShadow = true; this.sun.shadow.mapSize.set(1024, 1024); this.sun.shadow.radius = 6; this.sun.shadow.bias = -0.0008;
    const sc = this.sun.shadow.camera; sc.left = -18; sc.right = 18; sc.top = 18; sc.bottom = -18; sc.near = 1; sc.far = 120;
    scene.add(this.hemi, this.amb, this.sun, this.sun.target);
    // 太阳 / 月亮
    this.sunBall = new THREE.Mesh(SPH, new THREE.MeshBasicMaterial({ color: 0xfff1c9, fog: false })); this.sunBall.scale.setScalar(9);
    this.sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xffc070, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); this.sunGlow.scale.setScalar(70);
    this.moon = new THREE.Group(); const mb = new THREE.Mesh(SPH, new THREE.MeshStandardMaterial({ color: 0xfff6d8, emissive: 0xfff0c0, emissiveIntensity: 0.75, roughness: 1, fog: false }));
    for (let i = 0; i < 6; i++) { const cr = new THREE.Mesh(SPH, new THREE.MeshStandardMaterial({ color: 0xe8dcb8, emissive: 0xe0d0a0, emissiveIntensity: 0.5, fog: false })); const a = hash(i) * 6.28, r = 0.5 + hash(i + 9) * 0.35; cr.position.set(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8, 0.86); cr.scale.set(0.16 + hash(i + 3) * 0.12, 0.16 + hash(i + 3) * 0.12, 0.06); mb.add(cr); }
    this.moon.add(mb);
    this.moonGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xc9d4ff, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false })); this.moonGlow.scale.setScalar(6);
    this.moon.add(this.moonGlow);
    this.root.add(this.sunBall, this.sunGlow, this.moon);
    // 星星 / 萤火 / 花瓣
    this.stars = new Particles(900, { size: 2.2, tex: starTex() });
    for (let i = 0; i < 900; i++) { const th = hash(i) * Math.PI * 2, ph = Math.acos(1 - hash(i + 1) * 0.95); this.stars.set(i, Math.sin(ph) * Math.cos(th) * 300, Math.cos(ph) * 300 - 20, Math.sin(ph) * Math.sin(th) * 300); this.stars.color(i, C(i % 5 ? 0xffffff : 0xffe2a8), 0.5 + hash(i + 2) * 0.5); }
    this.stars.commit(); scene.add(this.stars.points);
    this.fireflies = new Particles(160, { size: 0.22 }); for (let i = 0; i < 160; i++) this.fireflies.color(i, C(i % 3 ? 0xfff2a0 : 0xbaffc9)); this.fireflies.commit(); this.root.add(this.fireflies.points);
    this.petals = new Particles(220, { size: 0.32, tex: petalTex(), additive: false }); for (let i = 0; i < 220; i++) this.petals.color(i, C([0xffb7d0, 0xffe39e, 0xffffff, 0xc7e8ff][i % 4])); this.petals.commit(); this.root.add(this.petals.points);

    // 地面 + 起伏的软山
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), clay(0x9fd48c)); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; this.root.add(ground);
    const hillCols = [0x8fcf7e, 0xa5dc8c, 0x7fc27a, 0xb5e39a];
    for (let i = 0; i < 26; i++) {
      const a = hash(i * 3) * Math.PI * 2, r = 22 + hash(i * 5) * 80; const h = new THREE.Mesh(SPH, clay(hillCols[i % 4]));
      const s = 10 + hash(i * 7) * 18; const hx = Math.cos(a) * r, hz = Math.sin(a) * r - 20;
      if (Math.hypot(hx - TEA_X, hz) < s + 12 || Math.hypot(hx - STAGE_X, hz) < s + 13 || (Math.abs(hx - 16) < s + 4 && hz > -60)) continue;
      h.scale.set(s, s * (0.35 + hash(i) * 0.3), s); h.position.set(Math.cos(a) * r, -s * 0.12, Math.sin(a) * r - 20); h.receiveShadow = true; this.root.add(h);
    }
    // 中心小山坡（主角常坐的地方）
    const knoll = new THREE.Mesh(SPH, clay(0xa8de8f)); knoll.scale.set(9, 1.6, 7); knoll.position.set(0, -0.6, -4); knoll.receiveShadow = true; this.root.add(knoll);
    // 圆滚滚的树
    for (let i = 0; i < 18; i++) {
      const g = new THREE.Group(); const tr = new THREE.Mesh(CYL, clay(0x9b6b4a)); tr.scale.set(0.22, 1.6, 0.22); tr.position.y = 0.8; g.add(tr);
      const cc = [0x6fbf73, 0x86d17a, 0x5fae6e][i % 3]; for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(SPH, clay(cc)); b.scale.setScalar(0.9 - k * 0.15); b.position.set((k - 1) * 0.45, 2 + k * 0.45, (hash(i + k) - 0.5) * 0.4); g.add(b); }
      const a = hash(i * 11 + 1) * Math.PI * 2, r = 9 + hash(i * 13) * 26; const tx = Math.cos(a) * r, tz = Math.sin(a) * r - 6; if (Math.abs(tx - 16) < 4 || Math.abs(tx - TEA_X) < 9 || (tz > -9 && Math.abs(tx) < 13)) continue; g.position.set(tx, hillY(tx, tz) - 0.1, tz); g.scale.setScalar(0.9 + hash(i) * 0.8);
      this.trees.push(shadowy(g)); this.root.add(g);
    }
    // 云：一团团软球
    for (let i = 0; i < 14; i++) {
      const g = new THREE.Group(); const m = clay(0xffffff, { emissive: 0xffffff, emissiveIntensity: 0.25, roughness: 1 });
      for (let k = 0; k < 6; k++) { const b = new THREE.Mesh(SPH, m); const s = 0.8 + hash(i * 6 + k) * 0.9; b.scale.set(s * 1.2, s, s); b.position.set((k - 2.5) * 0.9, Math.sin(k * 1.3) * 0.35 + (k === 2 || k === 3 ? 0.5 : 0), (hash(k + i) - 0.5) * 0.8); g.add(b); }
      g.position.set((hash(i * 17) - 0.5) * 80, 12 + hash(i * 19) * 10, -30 - hash(i * 23) * 50); g.scale.setScalar(1.2 + hash(i) * 1.4);
      this.clouds.push(g); this.root.add(g);
    }
    // 花：茎 + 五瓣 + 花心，开花时整朵放大
    const fc = [0xff8fb1, 0xffd166, 0xffffff, 0xc4b5fd, 0xff9e7a, 0x8be9ff];
    for (let i = 0; i < 46; i++) {
      const g = new THREE.Group(); const col = fc[i % fc.length];
      const st = new THREE.Mesh(CYL, clay(0x5fae5a)); st.scale.set(0.04, 0.6, 0.04); st.position.y = 0.3; g.add(st);
      const head = new THREE.Group(); head.position.y = 0.62; g.add(head);
      for (let k = 0; k < 5; k++) { const p = new THREE.Mesh(SPH, clay(col)); const a = (k / 5) * Math.PI * 2; p.scale.set(0.13, 0.05, 0.08); p.position.set(Math.cos(a) * 0.13, 0, Math.sin(a) * 0.13); p.rotation.y = -a; head.add(p); }
      const ce = new THREE.Mesh(SPH, clay(0xffc93c, { emissive: 0xffa000, emissiveIntensity: 0.2 })); ce.scale.setScalar(0.08); ce.position.y = 0.02; head.add(ce);
      head.rotation.x = 0.5;
      const a = hash(i * 29) * Math.PI * 2, r = 1.5 + Math.sqrt(hash(i * 31)) * 9; const fx = Math.cos(a) * r, fz = Math.sin(a) * r - 3; const p = new THREE.Vector3(fx, hillY(fx, fz) - 0.03, fz);
      g.position.copy(p); this.flowers.push({ g, p, t: hash(i * 37), col }); this.root.add(shadowy(g, true, false));
    }
    // 长路：一条软软的带子，路边有里程桩
    {
      const curve = new THREE.CatmullRomCurve3(ROAD_PTS.map((p) => new THREE.Vector3(p[0], 0.03, p[2])));
      const N = 220, pos: number[] = [], idx: number[] = [], uv: number[] = [];
      for (let i = 0; i <= N; i++) { const u = i / N; const p = curve.getPointAt(u); const tg = curve.getTangentAt(u); const nx = -tg.z, nz = tg.x; const w = 1.4;
        pos.push(p.x + nx * w, 0.05, p.z + nz * w, p.x - nx * w, 0.05, p.z - nz * w); uv.push(0, u * 30, 1, u * 30); if (i < N) { const b = i * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); } }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
      this.road = new THREE.Mesh(g, clay(0xf3dcae)); this.road.receiveShadow = true; this.root.add(this.road);
      for (let i = 1; i < 12; i++) { const u = i / 12; const p = curve.getPointAt(u); const tg = curve.getTangentAt(u); const post = new THREE.Group(); const b = new THREE.Mesh(new RoundedBoxGeometry(0.35, 0.8, 0.2, 3, 0.08), clay(0xffffff)); b.position.y = 0.4; post.add(b); const cap = new THREE.Mesh(SPH, clay(0xff8a65)); cap.scale.set(0.2, 0.12, 0.12); cap.position.y = 0.82; post.add(cap); post.position.set(p.x - tg.z * 2, 0, p.z + tg.x * 2); this.posts.push(shadowy(post)); this.root.add(post); }
    }
    // 茶馆：木台、红灯笼、竹椅、茶桌
    {
      const g = new THREE.Group(); g.position.set(TEA_X, 0, 0);
      const deck = new THREE.Mesh(new RoundedBoxGeometry(14, 0.5, 9, 4, 0.2), clay(0xc8925f)); deck.position.y = 0.25; g.add(deck);
      for (const [x, z] of [[-6.5, -4], [6.5, -4], [-6.5, 4], [6.5, 4]]) { const p = new THREE.Mesh(CYL, clay(0x8a4b32)); p.scale.set(0.22, 5, 0.22); p.position.set(x, 2.7, z); g.add(p); }
      const roof = new THREE.Mesh(new THREE.ConeGeometry(10.5, 2.6, 4, 1), clay(0x6b3a3a)); roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, 0.68); roof.position.y = 6.4; g.add(roof);
      const eave = new THREE.Mesh(new RoundedBoxGeometry(15, 0.35, 10, 3, 0.15), clay(0x8f4a3a)); eave.position.y = 5.2; g.add(eave);
      for (let i = 0; i < 4; i++) { const tb = new THREE.Group(); const top = new THREE.Mesh(CYL, clay(0xa8663f)); top.scale.set(1.1, 0.12, 1.1); top.position.y = 1.25; tb.add(top); const leg = new THREE.Mesh(CYL, clay(0x8a4b32)); leg.scale.set(0.12, 0.75, 0.12); leg.position.y = 0.85; tb.add(leg);
        for (let k = 0; k < 3; k++) { const cup = new THREE.Mesh(CYL, clay(0xf6f1e4)); cup.scale.set(0.12, 0.14, 0.12); cup.position.set(Math.cos(k * 2.1) * 0.55, 1.39, Math.sin(k * 2.1) * 0.55); tb.add(cup); }
        const pot = new THREE.Mesh(SPH, clay(0x4f7a6a)); pot.scale.set(0.28, 0.22, 0.28); pot.position.y = 1.5; tb.add(pot);
        for (let k = 0; k < 2; k++) { const ch = new THREE.Mesh(new RoundedBoxGeometry(0.8, 0.9, 0.8, 3, 0.2), clay(0xd8c27a)); ch.position.set(k ? 1.6 : -1.6, 0.95, 0); tb.add(ch); }
        tb.position.set((i % 2 ? 1 : -1) * (i < 2 ? 3 : 5.2), 0.3, i < 2 ? -1.8 : 3); g.add(tb); }
      for (let i = 0; i < 6; i++) { const l = new THREE.Mesh(SPH, new THREE.MeshStandardMaterial({ color: 0xff5a4a, emissive: 0xff3a20, emissiveIntensity: 0.6, roughness: 0.6 })); l.scale.set(0.45, 0.55, 0.45); l.position.set(-6 + i * 2.4, 4.4, 4.5); g.add(l); this.hangLanterns.push(l); }
      this.root.add(shadowy(g));
    }
    // 节拍舞台：一圈软鼓，每个鼓有自己的拍子
    {
      const g = new THREE.Group(); g.position.set(STAGE_X, 0, 0);
      const base = new THREE.Mesh(CYL, clay(0xffe1ec)); base.scale.set(9, 0.5, 9); base.position.y = 0.25; g.add(base);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(9, 0.3, 12, 64), clay(0xff9ec0)); ring.rotation.x = Math.PI / 2; ring.position.y = 0.5; g.add(ring);
      const dc = [0xff8fb1, 0xffd166, 0x8be9ff, 0xc4b5fd, 0x86efac, 0xff9e7a, 0x9cc9ff, 0xfde68a];
      for (let i = 0; i < 8; i++) { const m = new THREE.MeshStandardMaterial({ color: dc[i], emissive: dc[i], emissiveIntensity: 0.1, roughness: 0.55 }); const d = new THREE.Mesh(CYL, m); const a = (i / 8) * Math.PI * 2; d.scale.set(0.9, 0.5, 0.9); d.position.set(Math.cos(a) * 5.5, 0.75, Math.sin(a) * 5.5); g.add(d); this.drums.push(d); this.drumMats.push(m); }
      this.root.add(shadowy(g));
    }
    // 任务箱（软圆角）
    const bc = [0xffb4a2, 0xffd6a5, 0xcaffbf, 0x9bf6ff, 0xa0c4ff, 0xbdb2ff, 0xffc6ff, 0xfdffb6];
    for (let i = 0; i < 8; i++) { const b = new THREE.Mesh(new RoundedBoxGeometry(0.7, 0.5, 0.55, 4, 0.12), clay(bc[i])); const tape = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.08, 0.57), clay(0xffffff)); b.add(tape); this.boxes.push(shadowy(b)); this.root.add(b); }
    // 气球
    for (let i = 0; i < 9; i++) { const g = new THREE.Group(); const col = [0xff6b8b, 0xffd166, 0x8be9ff, 0xc4b5fd, 0x86efac, 0xff9e7a, 0xffffff, 0xff8fb1, 0x9cc9ff][i];
      const b = new THREE.Mesh(SPH, clay(col, { roughness: 0.35, emissive: col, emissiveIntensity: 0.12 })); b.scale.set(0.45, 0.55, 0.45); b.position.y = 1.6; g.add(b);
      const s = new THREE.Mesh(CYL, new THREE.MeshBasicMaterial({ color: 0xffffff })); s.scale.set(0.008, 1.1, 0.008); s.position.y = 0.55; g.add(s); this.balloons.push(shadowy(g, true, false)); this.root.add(g); }
    // 孔明灯
    for (let i = 0; i < 36; i++) { const g = new THREE.Group(); const l = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.24, 0.6, 12), new THREE.MeshStandardMaterial({ color: 0xffb36b, emissive: 0xff8a3d, emissiveIntensity: 1.1, roughness: 0.7 })); g.add(l);
      const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex(), color: 0xffa050, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false })); gl.scale.setScalar(1.8); g.add(gl); this.lanterns.push(g); this.root.add(g); }
    // 幸运星（倒角挤出 → 软星星）
    { const sh = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + Math.PI / 2; const r = i % 2 ? 0.45 : 1; i ? sh.lineTo(Math.cos(a) * r, Math.sin(a) * r) : sh.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
      const g = new THREE.ExtrudeGeometry(sh, { depth: 0.25, bevelEnabled: true, bevelThickness: 0.22, bevelSize: 0.18, bevelSegments: 6 }); g.center();
      this.luckStar = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: 0xffd34d, emissive: 0xffa800, emissiveIntensity: 0.45, roughness: 0.4 })); this.luckStar.castShadow = true; this.root.add(this.luckStar); }
    // 大钟（片头的「赶」）
    { this.clock = new THREE.Group(); const face = new THREE.Mesh(CYL, clay(0xfff7ea)); face.scale.set(1.6, 0.3, 1.6); face.rotation.x = Math.PI / 2; this.clock.add(face);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(1.6, 0.18, 12, 48), clay(0xff8a65)); this.clock.add(rim);
      for (let k = 0; k < 12; k++) { const d = new THREE.Mesh(SPH, clay(0x5b4a7a)); const a = (k / 12) * Math.PI * 2; d.scale.setScalar(0.07); d.position.set(Math.cos(a) * 1.3, Math.sin(a) * 1.3, 0.17); this.clock.add(d); }
      for (let k = 0; k < 2; k++) { const h = new THREE.Mesh(new RoundedBoxGeometry(0.12, k ? 1.15 : 0.8, 0.06, 2, 0.03), clay(k ? 0x3b2a5c : 0xff6b8b)); h.geometry.translate(0, (k ? 1.15 : 0.8) / 2 - 0.08, 0); h.position.z = 0.2 + k * 0.03; this.clock.add(h); this.clockHands.push(h); }
      for (const s of [-1, 1]) { const b = new THREE.Mesh(SPH, clay(0xff8a65)); b.scale.setScalar(0.4); b.position.set(s * 1.1, 1.6, 0); this.clock.add(b); }
      this.root.add(shadowy(this.clock)); }
    // 不完美的圈：手画的歪圈，按字一笔一笔画出来
    { const pts: THREE.Vector3[] = []; for (let i = 0; i <= 64; i++) { const a = (i / 64) * Math.PI * 2.08; const r = 1.6 + Math.sin(a * 3) * 0.12 + Math.sin(a * 5 + 1) * 0.06 + (i / 64) * 0.18; pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r * 0.92, Math.sin(a * 2) * 0.1)); }
      this.ringGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 0.16, 12, false);
      this.ring = new THREE.Mesh(this.ringGeo, clay(0xff8fb1, { roughness: 0.4, emissive: 0xff5c8a, emissiveIntensity: 0.15 })); this.ring.castShadow = true; this.root.add(this.ring); }
    // 云床
    { this.bed = new THREE.Group(); const m = clay(0xf4f2ff, { emissive: 0xc9c4ff, emissiveIntensity: 0.25, roughness: 1 });
      for (let k = 0; k < 9; k++) { const b = new THREE.Mesh(SPH, m); const s = 0.9 + hash(k * 3) * 0.6; b.scale.set(s * 1.3, s * 0.7, s); b.position.set((k - 4) * 0.75, Math.sin(k) * 0.15, (hash(k) - 0.5) * 1.2); this.bed.add(b); }
      const pil = new THREE.Mesh(SPH, clay(0xfff1b8, { emissive: 0xffe08a, emissiveIntensity: 0.35 })); pil.scale.set(0.7, 0.32, 0.5); pil.position.set(-2.3, 0.75, 0); this.bed.add(pil);
      this.root.add(shadowy(this.bed)); }
    // 名牌（忘了你是谁）
    const names = ['鲸鱼娘', '小克', '龙娘', '猫', 'Kimi', '豆包', '千问', '狐狸'];
    names.forEach((nm) => { const cv = document.createElement('canvas'); cv.width = 256; cv.height = 128; const g = cv.getContext('2d')!; g.fillStyle = '#fffaf0'; g.beginPath(); g.roundRect(6, 6, 244, 116, 26); g.fill(); g.strokeStyle = '#ff8fb1'; g.lineWidth = 8; g.stroke();
      g.fillStyle = '#3b2a5c'; g.font = `64px 'ZCOOLKL', sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(nm, 128, 68);
      const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.5), new THREE.MeshBasicMaterial({ map: tx, transparent: true, side: THREE.DoubleSide })); this.tags.push(m); this.root.add(m); });
    // 演员（分支图集里的八位）+ 道具贴纸
    for (const ch of ['whale', 'claude', 'gpt', 'gemini', 'kimi', 'doubao', 'qwen', 'zai']) { const a = new Actor(ch, 1); this.cast[ch] = a; this.root.add(a.root); }
    for (let i = 0; i < 10; i++) { const a = new Actor('whale', 0.6); a.shadow.visible = false; this.props.push(a); this.root.add(a.root); }
  }
  /** 每帧开头：把可选布景都收起来，镜头函数按需摆出来 */
  reset() {
    for (const a of Object.values(this.cast)) { a.show(false); a.flip = false; a.flat = false; a.spin = 0; a.lay = 0; a.squash = 0; a.size = 1; a.body.position.set(0, 0, 0); a.tint(0xffffff, 1); a.shadow.visible = true; }
    for (const p of this.props) { p.show(false); p.spin = 0; p.size = 0.6; p.tint(0xffffff, 1); p.flip = false; }
    for (const o of [...this.boxes, ...this.balloons, ...this.lanterns, ...this.tags]) o.visible = false;
    this.luckStar.visible = false; this.clock.visible = false; this.ring.visible = false; this.bed.visible = false;
    this.fireflies.mat.opacity = 0; this.petals.mat.opacity = 0;
    for (const f of this.flowers) f.g.scale.setScalar(1);
    for (const m of this.drumMats) m.emissiveIntensity = 0.1;
    this.drums.forEach((d) => { d.scale.y = 0.5; d.position.y = 0.75; });
    this.ringGeo.setDrawRange(0, Infinity);
  }
  /** 时间：0 白天 · 0.33 黄昏 · 0.66 入夜 · 1 深夜；sunArc 控制太阳的高度（1 高、0 地平线、负值落下） */
  setTOD(x: number, sunArc?: number, moonArc?: number, az = 0) {
    this.tod = x; const u = this.sky.material.uniforms;
    u.uTop.value.copy(todColor(TOD.top, x)); u.uHor.value.copy(todColor(TOD.hor, x)); u.uBot.value.copy(todColor(TOD.bot, x)); u.uSunCol.value.copy(todColor(TOD.sun, x));
    this.hemi.color.copy(todColor(TOD.hemiS, x)); this.hemi.groundColor.copy(todColor(TOD.hemiG, x)); this.fog.color.copy(todColor(TOD.fog, x));
    const sa = sunArc ?? lerp(0.9, -0.3, clamp(x * 1.6)); const ma = moonArc ?? lerp(-0.3, 0.8, clamp((x - 0.3) * 1.7));
    const sp = new THREE.Vector3(Math.sin(az) * 160, Math.sin(sa * 1.2) * 150, -Math.cos(az) * 160 - 60);
    this.sunBall.position.copy(sp); this.sunGlow.position.copy(sp); this.sunBall.visible = this.sunGlow.visible = sa > -0.15;
    (this.sunBall.material as THREE.MeshBasicMaterial).color.copy(todColor(TOD.sun, Math.min(x, 0.4)).lerp(C(0xffffff), 0.3)); (this.sunGlow.material as THREE.SpriteMaterial).color.copy(todColor(TOD.sun, Math.min(x, 0.4)));
    u.uSun.value.copy(sp).normalize();
    const mp = new THREE.Vector3(-Math.sin(az + 0.5) * 120, Math.sin(ma * 1.2) * 110 + 4, -Math.cos(az + 0.5) * 120 - 60); this.moon.position.copy(mp); this.moon.scale.setScalar(7); this.moon.visible = ma > -0.2;
    const day = clamp(1 - x * 1.4); const lightDir = sa > 0.05 ? sp : mp;
    this.sun.position.copy(lightDir).normalize().multiplyScalar(60); this.sun.target.position.set(0, 0, 0);
    this.sun.color.copy(sa > 0.05 ? todColor(TOD.sun, x).lerp(C(0xffffff), 0.35) : C(0xb8c4ff)); this.sun.intensity = sa > 0.05 ? 0.6 + day * 1.4 : 0.55;
    this.hemi.intensity = 0.55 + day * 0.65; this.stars.mat.opacity = clamp((x - 0.4) * 2.2);
    for (const l of this.hangLanterns) (l.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.4 + clamp((x - 0.3) * 2) * 1.4;
  }
  /** 让阴影相机跟着镜头关注的地方 */
  focus(x: number, z: number) { this.sun.target.position.set(x, 0, z); this.sun.position.add(new THREE.Vector3(x, 0, z)); }
}
