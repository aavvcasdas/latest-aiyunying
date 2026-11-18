import * as THREE from "three";
import { Font } from "three/examples/jsm/loaders/FontLoader.js";
import glyphs from "../assets/glyphs.json";
import { clamp, glowTex, rng } from "./tex";

export const std = (color: number, o: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0.05, ...o });
export const bas = (color: number, o: THREE.MeshBasicMaterialParameters = {}) => new THREE.MeshBasicMaterial({ color, ...o });
export function mesh(g: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0) { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); return o; }
export const boxG = (w: number, h: number, d: number) => new THREE.BoxGeometry(w, h, d);
export function floorMesh(mat: THREE.Material, size = 90) { const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat); m.rotation.x = -Math.PI / 2; return m; }

// 光柱：顶点在原点，向下张开
export function shaft(color: number, h: number, r: number, op = 0.14): THREE.Mesh<THREE.ConeGeometry, THREE.MeshBasicMaterial> {
  const g = new THREE.ConeGeometry(r, h, 28, 1, true); g.translate(0, -h / 2, 0);
  return new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
}
let _glow: THREE.Texture | null = null;
export const glowT = () => (_glow ||= glowTex("255,255,255", 1));
export function glowSprite(color: number, scale: number, op = 1) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowT(), color, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  s.scale.set(scale, scale, 1); return s;
}
export function glowPool(color: number, w: number, d: number, op = 0.5): THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: glowT(), color, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  m.rotation.x = -Math.PI / 2; m.position.y = 0.03; return m;
}

// 粉尘 / 孢子 / 彩纸：位置只由时间决定
export class Dust {
  pts: THREE.Points; n: number; bx: Float32Array; by: Float32Array; bz: Float32Array; ph: Float32Array; pos: Float32Array;
  constructor(n: number, public box: [number, number, number], color: number, size = 0.07, seed = 1, public center: [number, number, number] = [0, 0, 0], opacity = 0.8, additive = true) {
    const r = rng(seed); this.n = n; this.bx = new Float32Array(n); this.by = new Float32Array(n); this.bz = new Float32Array(n); this.ph = new Float32Array(n); this.pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { this.bx[i] = r(); this.by[i] = r(); this.bz[i] = r(); this.ph[i] = r() * 6.28; }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(this.pos, 3));
    this.pts = new THREE.Points(g, new THREE.PointsMaterial({ color, size, map: glowT(), transparent: true, opacity, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, sizeAttenuation: true, fog: false }));
    this.pts.frustumCulled = false;
  }
  update(T: number, vy = 0.15, sway = 0.3) {
    const [w, h, d] = this.box, [cx, cy, cz] = this.center;
    for (let i = 0; i < this.n; i++) {
      const fy = (((this.by[i] + T * vy / h) % 1) + 1) % 1;
      this.pos[i * 3] = cx + (this.bx[i] - 0.5) * w + Math.sin(T * 0.4 + this.ph[i]) * sway;
      this.pos[i * 3 + 1] = cy + fy * h; this.pos[i * 3 + 2] = cz + (this.bz[i] - 0.5) * d + Math.cos(T * 0.33 + this.ph[i]) * sway;
    }
    (this.pts.geometry.getAttribute("position") as THREE.BufferAttribute).needsUpdate = true;
  }
}

// 三维字形（用于场景里的“？”等）
const font = new Font(glyphs as any); const gcache = new Map<string, THREE.BufferGeometry>();
export function glyphGeo(ch: string) {
  let g = gcache.get(ch); if (g) return g;
  g = new THREE.ExtrudeGeometry(font.generateShapes(ch, 1), { depth: 0.22, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.02, bevelSegments: 2, curveSegments: 5 });
  g.translate(-0.5, -0.36, -0.11); gcache.set(ch, g); return g;
}

// 小花：stem 随 grow 长高，花瓣随 open 张开
export function makeFlower() {
  const group = new THREE.Group(); const H = 2.1;
  const sg = new THREE.CylinderGeometry(0.05, 0.07, 1, 8); sg.translate(0, 0.5, 0);
  const stem = mesh(sg, std(0x78b86e, { emissive: 0x1d3b1d })); group.add(stem);
  const head = new THREE.Group(); group.add(head);
  const petalMat = std(0xc9ceff, { emissive: 0x4d6bfe, emissiveIntensity: 0.55, roughness: 0.5 });
  const pg = new THREE.SphereGeometry(1, 12, 8);
  const petals: THREE.Mesh[] = [];
  for (let i = 0; i < 8; i++) { const p = mesh(pg, petalMat); head.add(p); petals.push(p); }
  head.add(mesh(new THREE.SphereGeometry(0.16, 12, 10), std(0xffffff, { emissive: 0xfff2b0, emissiveIntensity: 0.9 })));
  const lg = new THREE.SphereGeometry(1, 10, 8); const leafMat = std(0x7ac26f, { emissive: 0x214421 });
  const l1 = mesh(lg, leafMat), l2 = mesh(lg, leafMat); group.add(l1, l2);
  const glow = glowSprite(0x7f94ff, 3.2, 0); head.add(glow);
  return {
    group,
    set(grow: number, open: number, T: number) {
      grow = clamp(grow); open = clamp(open);
      stem.scale.set(1, Math.max(0.001, grow * H), 1);
      head.position.set(Math.sin(T * 1.3) * 0.04 * grow, grow * H, 0); head.visible = grow > 0.92; head.scale.setScalar(0.3 + open * 0.7);
      petals.forEach((p, i) => { const a = (i / 8) * Math.PI * 2 + T * 0.05; const r = 0.06 + open * 0.3; p.position.set(Math.cos(a) * r, Math.sin(a) * r, 0); p.rotation.z = a; p.scale.set(0.13 + open * 0.24, 0.09 + open * 0.07, 0.08); });
      l1.position.set(0.18 * grow, grow * H * 0.32, 0); l1.rotation.z = -0.6; l1.scale.set(0.3 * grow, 0.09 * grow, 0.1 * grow);
      l2.position.set(-0.18 * grow, grow * H * 0.5, 0); l2.rotation.z = 0.6; l2.scale.set(0.27 * grow, 0.08 * grow, 0.1 * grow);
      (glow.material as THREE.SpriteMaterial).opacity = open * 0.8;
    },
  };
}

// 旋转：绕 y 轴绕圈的相机
export function orbit(cx: number, cz: number, r: number, a: number): [number, number] { return [cx + Math.sin(a) * r, cz + Math.cos(a) * r]; }
