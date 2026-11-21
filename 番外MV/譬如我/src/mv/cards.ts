import * as THREE from "three";
import { Font } from "three/examples/jsm/loaders/FontLoader.js";
import glyphs from "../assets/glyphs.json";
import { LINES, type LineT } from "./lyricsData";
import { beatPulse, clamp, easeOut, faceTex, type FaceStyle } from "./tex";

// ───────── 三维字卡版式：每句拆成「词组」，词组里每个字挂在实测起音上 ─────────
// k: m 主色 / a 强调（蓝） / p 蓝底字牌；d: v 竖排；g: 字距倍数；r: 旋转
interface Spec { t: string; x: number; y: number; s: number; k?: "m" | "a" | "p"; d?: "v"; g?: number; r?: number }
const V: Spec[][] = [
  [{ t: "可", x: -4.6, y: 0.2, s: 1.8 }, { t: "那", x: 0, y: 0.2, s: 1.8 }, { t: "些", x: 4.6, y: 0.2, s: 1.8 }],
  [{ t: "没有天赋", x: -2.4, y: 0.95, s: 1.5 }, { t: "的人呢", x: -3.2, y: -0.75, s: 1.5 }],
  [{ t: "譬如我", x: 0, y: -2.7, s: 1.45, k: "a" }],
  [{ t: "枕头下", x: -3.8, y: 1.7, s: 1.25 }, { t: "发霉的梦", x: 1.7, y: -1.6, s: 1.55, k: "a" }],
  [{ t: "怎么做", x: 0, y: 0, s: 3.0, r: -0.1, k: "a" }],
  [{ t: "热忱", x: -4.4, y: 1.3, s: 1.7, k: "a" }, { t: "与", x: 0, y: 0.2, s: 0.9 }, { t: "自卑", x: 4.4, y: -1.3, s: 1.7 }],
  [{ t: "对抗着", x: 0, y: 0.2, s: 2.5, r: 0.05 }],
  [{ t: "笑容", x: -3.3, y: 0.2, s: 3.2, k: "a" }, { t: "却已", x: 3.0, y: 1.9, s: 1.1 }, { t: "不知", x: 3.0, y: 0.1, s: 1.1 }, { t: "下落", x: 3.0, y: -1.9, s: 1.4 }],
  [{ t: "可如果", x: 0, y: 0, s: 2.6 }],
  [{ t: "等不到一场", x: 0, y: 2.9, s: 1.15 }, { t: "世俗的", x: -3.4, y: 0.6, s: 1.6, k: "a" }, { t: "成功", x: -3.2, y: -1.6, s: 2.0, k: "a" }],
  [{ t: "成不了", x: 0, y: 0.8, s: 0.8, k: "p" }, { t: "万", x: -6.4, y: 2.7, s: 1.7 }, { t: "众", x: 6.4, y: 2.7, s: 1.7 }, { t: "瞩", x: -6.4, y: -2.7, s: 1.7 }, { t: "目", x: 6.4, y: -2.7, s: 1.7 }, { t: "那一个", x: 0, y: -0.8, s: 0.8, k: "p" }],
  [{ t: "我能不能在", x: 0, y: 1.1, s: 1.35 }, { t: "某个角落", x: 0, y: -1.5, s: 1.1, k: "p" }],
  [{ t: "耗尽天真", x: 0, y: 0.2, s: 2.4, k: "a" }],
  [{ t: "开", x: -5.2, y: 0.4, s: 3.6, k: "a" }, { t: "出", x: 5.2, y: 0.4, s: 3.6, k: "a" }, { t: "小小的花朵", x: 0, y: -2.7, s: 0.95, k: "p" }],
];
const BL: Spec[][] = [
  [{ t: "一张张涂破的稿纸", x: 0, y: 3.0, s: 1.2 }],
  [{ t: "和一个", x: 0, y: 0.4, s: 2.7, k: "a" }],
  [{ t: "落入俗套的名字", x: 0, y: -3.1, s: 1.1 }],
  [{ t: "倾注所有的", x: 0, y: 3.1, s: 1.0, g: 1.6 }],
  [{ t: "那件事", x: 0, y: 0.2, s: 2.8, k: "a" }],
  [{ t: "哭了", x: -3.8, y: 1.5, s: 1.9 }, { t: "很多次", x: -3.2, y: -0.9, s: 1.5 }],
  [{ t: "还是想坚持", x: 0, y: 0.6, s: 1.9, k: "a" }],
  [{ t: "不愿担待", x: 0, y: 0.4, s: 1.9 }],
  [{ t: "平庸", x: -1.5, y: 0.2, s: 3.4, k: "a" }, { t: "二字", x: 5.0, y: -1.9, s: 0.9, k: "p" }],
  [{ t: "该怎么", x: -6.2, y: 0.8, s: 1.1, d: "v" }, { t: "惊艳这", x: 6.2, y: 0.8, s: 1.1, d: "v" }, { t: "茫茫人世", x: 0, y: 0, s: 2.0, k: "a" }],
  [{ t: "就算渺小如我", x: 0, y: -0.2, s: 1.0 }],
  [{ t: "真企图过", x: 0, y: 1.6, s: 2.2 }],
  [{ t: "改写命运的诗", x: 0, y: -1.9, s: 1.4, k: "a" }],
  [{ t: "也", x: -6.0, y: 0, s: 1.2 }, { t: "想", x: 0, y: 0, s: 1.2 }, { t: "要", x: 6.0, y: 0, s: 1.2 }],
  [{ t: "名垂青史", x: 0, y: 0, s: 1.6, g: 1.9 }],
  [{ t: "偏人们却只", x: 0, y: 0.3, s: 2.0, k: "a" }],
  [{ t: "传颂", x: 0, y: 0.2, s: 5.0, k: "a" }],
  [{ t: "有关天才的故事", x: 0, y: 0.2, s: 0.78, k: "p" }],
];
const HOLD: Record<string, string> = { B17: "B18", D4: "D5" };
const MAIN: Record<string, FaceStyle> = { A: "bone", B: "bone", C: "ink", D: "bone", E: "bone" };

function specsFor(l: LineT): Spec[] {
  const n = parseInt(l.id.slice(1), 10);
  if (l.sec === "B") return BL[n - 1];
  if (l.sec === "D") return BL[n + 12];
  return V[n - 1];
}

type Mat = THREE.MeshStandardMaterial;
interface CM { mesh: THREE.Mesh; face: Mat; side: Mat; t: number; i: number; bx: number; by: number; s: number; rz: number; jit: number; plate: boolean }
interface CG { line: LineT; chars: CM[]; plate?: THREE.Mesh; plateMat?: THREE.MeshBasicMaterial; t0: number; exit: number; cx: number; cy: number; pw: number; ph: number; on: boolean }

export class Cards {
  root = new THREE.Group(); groups: CG[] = []; geo = new Map<string, THREE.BufferGeometry>(); font: Font;
  constructor(scene: THREE.Scene) {
    this.font = new Font(glyphs as any); scene.add(this.root);
    for (const l of LINES) this.build(l);
  }
  private geometry(ch: string) {
    let g = this.geo.get(ch); if (g) return g;
    const shapes = this.font.generateShapes(ch, 1);
    g = new THREE.ExtrudeGeometry(shapes, { depth: 0.2, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.022, bevelSegments: 2, curveSegments: 5 });
    g.translate(-0.5, -0.36, -0.1); this.geo.set(ch, g); return g;
  }
  private build(l: LineT) {
    const specs = specsFor(l); const chars = [...l.text]; let off = 0;
    const exitBase = HOLD[l.id] ? (LINES.find((x) => x.id === HOLD[l.id])!.e + 0.25) : l.e + 0.2;
    for (const sp of specs) {
      const arr = [...sp.t]; const n = arr.length; const sk = sp.k || "m";
      const style: FaceStyle = sk === "p" ? "plate" : sk === "a" ? "blue" : MAIN[l.sec];
      const gap = sp.g ?? 1.02; const rot = sp.r || 0;
      const cms: CM[] = [];
      arr.forEach((ch, i) => {
        if (chars[off + i] !== ch) throw new Error(`字不对 ${l.id}: ${chars[off + i]} vs ${ch}`);
        const o = (i - (n - 1) / 2) * sp.s * gap; const dx = sp.d === "v" ? 0 : o, dy = sp.d === "v" ? -o : 0;
        const bx = sp.x + dx * Math.cos(rot) - dy * Math.sin(rot), by = sp.y + dx * Math.sin(rot) + dy * Math.cos(rot);
        const face = new THREE.MeshStandardMaterial({ map: faceTex(style), alphaTest: 0.01, transparent: true, roughness: 0.5, metalness: 0.15, emissive: 0xffffff, emissiveIntensity: 0 });
        const side = new THREE.MeshStandardMaterial({ color: style === "ink" ? 0x0b0c18 : style === "plate" ? 0x9fb4ff : style === "blue" ? 0x27329c : MAIN[l.sec] === "ink" ? 0x111120 : 0x85816f, roughness: 0.65, transparent: true });
        const mesh = new THREE.Mesh(this.geometry(ch), [face, side]); mesh.visible = false; mesh.rotation.order = "YXZ"; this.root.add(mesh);
        cms.push({ mesh, face, side, t: l.t[off + i], i, bx, by, s: sp.s, rz: rot, jit: (((off + i) * 7919) % 13) / 13 - 0.5, plate: style === "plate" });
      });
      const g: CG = { line: l, chars: cms, t0: cms[0].t, exit: exitBase, cx: sp.x, cy: sp.y, pw: n * sp.s * gap + sp.s * 0.7, ph: sp.s * 1.55, on: false };
      if (sk === "p") {
        g.plateMat = new THREE.MeshBasicMaterial({ color: 0x2c4fd6, transparent: true, opacity: 0.9 });
        g.plate = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), g.plateMat); g.plate.visible = false; g.plate.position.set(sp.x, sp.y, -0.25); g.plate.rotation.z = rot; this.root.add(g.plate);
      }
      this.groups.push(g); off += n;
    }
  }
  update(T: number, cam: THREE.PerspectiveCamera, hit: number, roll: number) {
    cam.position.set(Math.sin(T * 0.6) * 0.35 + Math.sin(T * 61) * hit * 0.05, Math.cos(T * 0.45) * 0.2 + Math.cos(T * 53) * hit * 0.05, 14 - hit * 0.35);
    cam.up.set(0, 1, 0); cam.lookAt(0, 0, 0); cam.rotateZ(roll * 0.6);
    this.root.rotation.y = Math.sin(T * 0.7) * 0.06; this.root.rotation.x = Math.cos(T * 0.5) * 0.025;
    const bp = beatPulse(T, 5);
    for (const g of this.groups) {
      const vis = T >= g.t0 - 0.4 && T < g.exit + 0.5;
      if (!vis) { if (g.on) { g.on = false; g.chars.forEach((c) => (c.mesh.visible = false)); if (g.plate) g.plate.visible = false; } continue; }
      g.on = true;
      if (g.plate && g.plateMat) {
        const a = clamp((T - g.t0 + 0.05) / 0.14), xo = clamp((T - g.exit) / 0.3);
        g.plate.visible = a > 0 && xo < 1; g.plate.scale.set(g.pw * easeOut(a), g.ph * (1 - xo * 0.5), 1); g.plateMat.opacity = 0.9 * (1 - xo);
      }
      for (const c of g.chars) {
        const u = T - c.t; const xo = clamp((T - g.exit) / 0.35);
        if (u < 0 && c.plate) { c.mesh.visible = false; continue; }
        c.mesh.visible = xo < 1;
        let op: number, sc = c.s, z = 0, rx = 0, rz = c.rz, fl = 0, by = c.by, ry = 0;
        if (u < 0) { op = 0.1; }
        else {
          const p = clamp(u / 0.26), e = easeOut(p);
          op = clamp(u / 0.05); sc = c.s * (1 + (1 - e) * 1.35) * (1 + 0.02 * bp);
          z = (1 - e) * 5.5; rx = (1 - e) * 0.9 * (c.jit > 0 ? 1 : -1); rz = c.rz + (1 - e) * c.jit * 0.7; fl = Math.pow(1 - p, 2) * 0.5;
          by += Math.sin(T * 1.4 + c.i * 0.9) * 0.03 * c.s; ry = Math.sin(T * 0.9 + c.i * 0.7) * 0.08;
          if (p < 1) ry += (1 - e) * c.jit * 0.9;
        }
        if (xo > 0) { op *= 1 - xo; sc *= 1 + xo * 0.25; z += xo * 3; by += xo * 0.25 * c.s; }
        c.mesh.position.set(c.bx, by, z); c.mesh.scale.set(sc, sc, sc * (u < 0 ? 0.6 : 1));
        c.mesh.rotation.set(rx, ry, rz);
        c.face.opacity = op; c.side.opacity = op; c.face.emissiveIntensity = fl; c.face.depthWrite = op > 0.98; c.side.depthWrite = op > 0.98;
      }
    }
  }
}
