import * as THREE from "three";
import type { FxKind, FxSpec, Look } from "@/lib/mv";
import { fxTex, slipTex, sprite } from "@/three/kit";

/* ------------------------------------------------------------------ *
 * 特效贴片：每个粒子只由「绝对时间 + 自己的种子」决定位置，
 * 没有累积状态——拖进度条、倒着看都一致（模板的「顺着走、倒着走结果一致」）。
 * ------------------------------------------------------------------ */

const SLIP_CHARS = "话总说不清楚该怎么明了一字句像圈套旧账翻完谁无理闹双手甩开刚好的微妙战火燃烧我们背对拥抱滥用沉默咆哮爱情来不及老葬送烽火玩笑真兜着圈子乱绕只是想让你知道警告".split("");

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Particle {
  obj: THREE.Sprite | THREE.Mesh;
  kind: FxKind;
  r: number[];
  base: THREE.Vector3;
  period: number;
  phase: number;
  size: number;
}

const COLORS: Record<FxKind, number[]> = {
  petal: [0xffd7e2, 0xfff1f4, 0xffc4d6],
  ember: [0xffb347, 0xff8a3d, 0xffd98a],
  heart: [0xff8fa3, 0xff6b8a, 0xffb3c1],
  ring: [0xffd166],
  note: [0xfff6e6],
  star: [0xfff6d8, 0xffe9a8],
  rain: [0xd2e6ff],
  bubble: [0xdffaff, 0xffffff],
  butterfly: [0xffd7a1, 0xf7c8d8, 0xc3b6f2],
  smoke: [0xffffff],
  leaf: [0x9dc98a, 0xc8e39a],
  spark: [0xfff3c4, 0xffd166],
  slip: [0xffffff],
};

const RING_GEO = new THREE.RingGeometry(0.84, 1, 64);
RING_GEO.rotateX(-Math.PI / 2);

export class FxSystem {
  readonly group = new THREE.Group();
  private parts: Particle[] = [];
  private t0 = 0;

  spawn(specs: FxSpec[], look: Look, seed: number, t0: number) {
    this.clear();
    this.t0 = t0;
    const all = [...specs];
    if (look.ambient !== "none" && !all.some((s) => s.kind === look.ambient)) {
      all.push({ kind: look.ambient, n: look.ambient === "rain" ? 40 : look.ambient === "star" ? 24 : 12 });
    }
    all.forEach((spec, si) => {
      const n = Math.min(spec.n, 80);
      const rand = rng(seed * 7919 + si * 131 + 7);
      for (let i = 0; i < n; i++) {
        const r = Array.from({ length: 8 }, () => rand());
        const cx = spec.at?.[0] ?? 0;
        const cz = spec.at?.[1] ?? -2;
        const spread = spec.at ? 2.2 : 11;
        const spreadZ = spec.at ? 1.6 : 7;
        const x = cx + (r[0] - 0.5) * 2 * spread;
        const z = cz + (r[1] - 0.5) * 2 * spreadZ + (spec.at ? 0 : 1);
        const y = spec.zone === "sky" ? 4 + r[2] * 8 : spec.zone === "ground" ? r[2] * 1.2 : 0.4 + r[2] * 5.5;
        const palette = COLORS[spec.kind];
        const color = palette[Math.floor(r[3] * palette.length) % palette.length];
        const size = this.sizeOf(spec.kind, r[4]);
        let obj: THREE.Sprite | THREE.Mesh;
        if (spec.kind === "ring") {
          obj = new THREE.Mesh(RING_GEO, new THREE.MeshBasicMaterial({ color: look.light, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide, fog: false }));
          obj.position.set(cx + (r[0] - 0.5) * 0.6, 0.03, cz + (r[1] - 0.5) * 0.6 + 2);
        } else if (spec.kind === "slip") {
          const ch = SLIP_CHARS[Math.floor(r[5] * SLIP_CHARS.length) % SLIP_CHARS.length];
          const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: slipTex(ch), transparent: true, depthWrite: false }));
          s.scale.set(size, size, 1);
          obj = s;
        } else {
          const name = spec.kind === "ember" ? "glow" : spec.kind === "spark" ? "spark" : spec.kind === "rain" ? "drop" : spec.kind;
          const additive = spec.kind === "ember" || spec.kind === "spark" || spec.kind === "star";
          obj = sprite(name, size, color, additive, 0.9);
          if (spec.kind === "rain") obj.scale.set(0.03, 0.7 + r[5] * 0.5, 1);
          (obj as THREE.Sprite).material.map = fxTex(name);
        }
        obj.renderOrder = 5;
        this.group.add(obj);
        this.parts.push({
          obj,
          kind: spec.kind,
          r,
          base: new THREE.Vector3(x, y, z),
          period: this.periodOf(spec.kind, r[6]),
          phase: r[7],
          size,
        });
      }
    });
  }

  private sizeOf(kind: FxKind, r: number): number {
    switch (kind) {
      case "petal":
        return 0.14 + r * 0.14;
      case "leaf":
        return 0.18 + r * 0.14;
      case "ember":
        return 0.12 + r * 0.16;
      case "heart":
        return 0.22 + r * 0.22;
      case "note":
        return 0.3 + r * 0.2;
      case "star":
        return 0.14 + r * 0.16;
      case "bubble":
        return 0.14 + r * 0.26;
      case "butterfly":
        return 0.3 + r * 0.2;
      case "smoke":
        return 1.4 + r * 1.6;
      case "spark":
        return 0.12 + r * 0.16;
      case "slip":
        return 0.3 + r * 0.22;
      default:
        return 1;
    }
  }

  private periodOf(kind: FxKind, r: number): number {
    switch (kind) {
      case "rain":
        return 0.9 + r * 0.4;
      case "ring":
        return 2.2 + r * 1.2;
      case "spark":
        return 0.6 + r * 0.6;
      case "star":
        return 1.6 + r * 2.4;
      case "ember":
        return 2.4 + r * 2;
      case "heart":
        return 3 + r * 2;
      case "smoke":
        return 5 + r * 4;
      case "butterfly":
        return 9 + r * 6;
      default:
        return 4 + r * 4;
    }
  }

  update(t: number, energy: number) {
    const lt = t - this.t0;
    for (const p of this.parts) {
      const u = (((lt / p.period + p.phase) % 1) + 1) % 1;
      const env = Math.sin(Math.PI * u); // 0→1→0
      const o = p.obj;
      const r = p.r;
      switch (p.kind) {
        case "petal":
        case "leaf":
        case "slip": {
          o.position.set(p.base.x + Math.sin(u * 6.28 * 1.5 + r[0] * 6) * 0.9, p.base.y + 6 - u * 9, p.base.z + Math.cos(u * 4 + r[1] * 6) * 0.5);
          const m = (o as THREE.Sprite).material;
          m.rotation = u * 6.28 * (r[2] > 0.5 ? 1 : -1) * 1.5;
          m.opacity = Math.min(1, env * 2.2) * 0.95;
          break;
        }
        case "rain": {
          o.position.set(p.base.x - u * 1.2, 9 - u * 11, p.base.z);
          (o as THREE.Sprite).material.opacity = 0.5 * Math.min(1, env * 3);
          break;
        }
        case "ember":
        case "heart":
        case "bubble":
        case "note": {
          const rise = p.kind === "heart" ? 3.2 : p.kind === "bubble" ? 5 : 4.5;
          o.position.set(p.base.x + Math.sin(u * 5 + r[0] * 6) * 0.4, p.base.y * 0.4 + u * rise, p.base.z + Math.cos(u * 3 + r[1] * 6) * 0.2);
          const m = (o as THREE.Sprite).material;
          m.opacity = Math.min(1, env * 2) * 0.95;
          const s = p.size * (0.8 + 0.4 * (1 - u)) * (1 + energy * 0.3);
          o.scale.set(s, s, 1);
          break;
        }
        case "smoke": {
          o.position.set(p.base.x + Math.sin(u * 3 + r[0] * 6) * 0.8, p.base.y * 0.3 + u * 5, p.base.z);
          const m = (o as THREE.Sprite).material;
          m.opacity = env * 0.22;
          const s = p.size * (0.6 + u * 1.4);
          o.scale.set(s, s, 1);
          break;
        }
        case "star":
        case "spark": {
          o.position.copy(p.base);
          const tw = 0.5 + 0.5 * Math.sin((lt / p.period + p.phase) * 6.28);
          const m = (o as THREE.Sprite).material;
          m.opacity = 0.25 + 0.75 * tw;
          const s = p.size * (0.7 + 0.6 * tw + energy * 0.5);
          o.scale.set(s, s, 1);
          m.rotation = p.kind === "spark" ? lt * 1.5 : 0;
          break;
        }
        case "butterfly": {
          o.position.set(p.base.x + Math.sin(u * 6.28 + r[0] * 6) * 3, p.base.y + Math.sin(lt * 5 + r[1] * 6) * 0.15 + Math.sin(u * 6.28 * 2) * 0.8, p.base.z + Math.cos(u * 6.28 + r[2] * 6) * 1.5);
          const m = (o as THREE.Sprite).material;
          m.opacity = Math.min(1, env * 3);
          const flap = 0.6 + 0.4 * Math.abs(Math.sin(lt * 14 + r[3] * 6));
          o.scale.set(p.size * flap, p.size, 1);
          break;
        }
        case "ring": {
          const s = 0.3 + u * 4.2 * (1 + energy * 0.15);
          o.scale.set(s, 1, s);
          (o.material as THREE.MeshBasicMaterial).opacity = (1 - u) * 0.55;
          break;
        }
      }
    }
  }

  clear() {
    for (const p of this.parts) {
      this.group.remove(p.obj);
      const m = p.obj.material as THREE.Material;
      m.dispose();
    }
    this.parts = [];
  }
}
