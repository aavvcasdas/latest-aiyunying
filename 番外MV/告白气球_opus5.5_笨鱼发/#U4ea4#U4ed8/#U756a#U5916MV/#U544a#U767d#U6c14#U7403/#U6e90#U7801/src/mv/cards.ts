import * as THREE from "three";
import { Font } from "three/examples/jsm/loaders/FontLoader.js";
import glyphs from "../assets/glyphs.json";
import { LINES, type LineT } from "./lyricsData";
import type { CardPos, Shot } from "./engine";
import { back, clamp, easeIn, easeOut, faceTex, type FaceStyle } from "./tex";

// ───────── 三维字卡：词组按歌词里的空格切开，自动排版，避开主角的脸 ─────────
// 字面三种：奶油（默认）/ 玫瑰（这句的「物件」与心意）/ 天空（副歌里的「亲爱的」）
const ROSE = ["咖啡", "唇印", "玫瑰", "写错", "告白气球", "微笑", "难追", "知难而退", "落叶", "浪漫", "搞砸", "全世界", "爱上你", "甜蜜", "眼睛", "我愿意", "恋爱日记", "香水", "梦境", "全都有你", "搅拌"];
const SKY = ["亲爱的"];
// 画框：x ∈ [-7.8, 7.8]，y ∈ [-4.4, 4.4]（tCam 在 z=14、fov 35）
const MAXW = 13.6;

interface CM { mesh: THREE.Mesh; face: THREE.MeshStandardMaterial; side: THREE.MeshStandardMaterial; t: number; i: number; bx: number; by: number; s: number; jit: number }
interface CG { chars: CM[]; t0: number; exit: number }
export interface TitleSpec { text: string; t: number[]; x: number; y: number; s: number; style: FaceStyle; exit: number }

function styleMap(text: string): FaceStyle[] {
  const st: FaceStyle[] = [...text].map(() => "cream");
  const paint = (words: string[], s: FaceStyle) => { for (const w of words) { let i = text.indexOf(w); while (i >= 0) { for (let k = 0; k < w.length; k++) st[i + k] = s; i = text.indexOf(w, i + 1); } } };
  paint(ROSE, "rose"); paint(SKY, "sky"); return st;
}

export class Cards {
  root = new THREE.Group(); groups: CG[] = []; geo = new Map<string, THREE.BufferGeometry>(); font = new Font(glyphs as any);
  constructor(scene: THREE.Scene, shots: Shot[], titles: TitleSpec[] = []) {
    scene.add(this.root);
    const posAt = (t: number): CardPos => { for (const s of shots) if (t >= s.s && t < s.e) return s.cp || "bottom"; return "bottom"; };
    LINES.forEach((l, k) => { const cp = posAt(l.t[0]); if (cp !== "none") this.buildLine(l, cp, LINES[k + 1]); });
    for (const tt of titles) this.buildTitle(tt);
  }
  private geometry(ch: string) {
    let g = this.geo.get(ch); if (g) return g;
    g = new THREE.ExtrudeGeometry(this.font.generateShapes(ch, 1), { depth: 0.22, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 3, curveSegments: 6 });
    g.computeBoundingBox(); const b = g.boundingBox!; g.translate(-(b.min.x + b.max.x) / 2, -0.36, -0.11);
    this.geo.set(ch, g); return g;
  }
  private char(ch: string, style: FaceStyle, t: number, i: number, bx: number, by: number, s: number): CM {
    const face = new THREE.MeshStandardMaterial({ map: faceTex(style), transparent: true, roughness: 0.45, metalness: 0.05, emissive: 0xffffff, emissiveIntensity: 0 });
    const side = new THREE.MeshStandardMaterial({ color: style === "rose" ? 0xc8466f : style === "sky" ? 0x4a78c8 : 0xd98aa6, roughness: 0.6, transparent: true });
    const mesh = new THREE.Mesh(this.geometry(ch), [face, side]); mesh.visible = false; this.root.add(mesh);
    return { mesh, face, side, t, i, bx, by, s, jit: (((i + 3) * 7919) % 13) / 13 - 0.5 };
  }
  private buildLine(l: LineT, cp: CardPos, next?: LineT) {
    const chars = [...l.text]; const st = styleMap(l.text);
    // 词组
    const phrases: { a: number; n: number }[] = []; let off = 0; for (const n of l.ph) { phrases.push({ a: off, n }); off += n; }
    const side = cp === "left" || cp === "right";
    let s = side ? 0.95 : 1.05; const gap = 1.0, pg = 0.55;
    const widthOf = (ps: typeof phrases) => ps.reduce((w, p) => w + p.n * s * gap, 0) + (ps.length - 1) * pg * s;
    // 行：能放一行就一行，否则一词组一行（侧边固定一词组一行）
    let rows: (typeof phrases)[] = side ? phrases.map((p) => [p]) : widthOf(phrases) <= MAXW ? [phrases] : phrases.map((p) => [p]);
    const maxRow = Math.max(...rows.map(widthOf)); const lim = side ? 6.2 : MAXW; if (maxRow > lim) s *= lim / maxRow;
    const lh = s * 1.3; const H = (rows.length - 1) * lh;
    const y0 = cp === "top" ? 3.35 : cp === "bottom" ? -3.45 + H : cp === "center" ? H / 2 : 1.6 + H / 2 * 0;
    const exit = Math.max(l.t[l.t.length - 1] + 0.45, Math.min(l.e + 0.55, next ? next.t[0] - 0.12 : l.e + 0.8));
    const cms: CM[] = [];
    rows.forEach((row, ri) => {
      const w = widthOf(row); let x = cp === "left" ? -7.4 : cp === "right" ? 7.4 - w : -w / 2; const y = y0 - ri * lh;
      for (const p of row) { for (let k = 0; k < p.n; k++) { const i = p.a + k; cms.push(this.char(chars[i], st[i], l.t[i], i, x + (k + 0.5) * s * gap, y, s)); } x += p.n * s * gap + pg * s; }
    });
    this.groups.push({ chars: cms, t0: cms[0].t, exit });
  }
  private buildTitle(tt: TitleSpec) {
    const chars = [...tt.text]; const w = chars.length * tt.s * 1.05;
    const cms = chars.map((ch, i) => this.char(ch, tt.style, tt.t[i], i, tt.x - w / 2 + (i + 0.5) * tt.s * 1.05, tt.y, tt.s));
    this.groups.push({ chars: cms, t0: tt.t[0], exit: tt.exit });
  }
  update(T: number, cam: THREE.PerspectiveCamera, hit: number, roll: number) {
    cam.position.set(Math.sin(T * 0.5) * 0.25, Math.cos(T * 0.4) * 0.15, 14 - hit * 0.12);
    cam.up.set(0, 1, 0); cam.lookAt(0, 0, 0); cam.rotateZ(roll * 0.5);
    for (const g of this.groups) {
      const vis = T >= g.t0 - 0.05 && T < g.exit + 0.7;
      if (!vis) { for (const c of g.chars) c.mesh.visible = false; continue; }
      for (const c of g.chars) {
        const u = T - c.t; if (u < 0) { c.mesh.visible = false; continue; }
        const xo = clamp((T - g.exit - c.i * 0.03) / 0.6); if (xo >= 1) { c.mesh.visible = false; continue; }
        c.mesh.visible = true;
        const p = clamp(u / 0.34); const e = back(p);
        let y = c.by - (1 - easeOut(p)) * 0.8 + Math.sin(T * 2.1 + c.i * 0.8) * 0.045 * c.s;
        let sc = c.s * (0.35 + 0.65 * e); let rz = (1 - p) * c.jit * 0.7 + Math.sin(T * 1.3 + c.i) * 0.025;
        let op = clamp(u / 0.08);
        if (xo > 0) { y += easeIn(xo) * 1.6; op *= 1 - xo; rz += xo * c.jit * 0.8; sc *= 1 - 0.25 * xo; }
        c.mesh.position.set(c.bx, y, (1 - easeOut(p)) * 1.5); c.mesh.scale.setScalar(sc);
        c.mesh.rotation.set(Math.sin(T * 0.9 + c.i) * 0.05, Math.sin(T * 0.7 + c.i * 0.6) * 0.12, rz);
        c.face.opacity = op; c.side.opacity = op; c.face.emissiveIntensity = Math.pow(1 - p, 2) * 0.5;
        const solid = op > 0.98; c.face.depthWrite = solid; c.side.depthWrite = solid;
      }
    }
  }
}
