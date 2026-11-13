import * as THREE from "three";
import type { CharCue, Cue } from "@/lib/mv";
import { charCues } from "@/lib/mv";
import { INK, backOut, clamp01, slipTex, toonOwn } from "@/three/kit";

/* ------------------------------------------------------------------ *
 * 立体字幕卡：挂在镜头前的一排小纸牌（一字一牌，按词分组）。
 *   - 整句一起翻出来（错开 40ms），唱到哪个字那张牌就往镜头顶、放大、翻成金面
 *   - 当前的词底下亮一条金线；唱过的牌留在金面上
 *   - 挂在 camera 下面：镜头怎么切，牌都在同一块画面区域里，但有真实的透视与纵深
 * ------------------------------------------------------------------ */

interface Card {
  mesh: THREE.Mesh;
  dim: THREE.MeshBasicMaterial;
  gold: THREE.MeshBasicMaterial;
  cue: CharCue;
  x: number;
  i: number;
}

const SIDE = toonOwn(0xf3e3c6, { fog: false });
const SIDE_GOLD = toonOwn(0xffd166, { fog: false, emissive: 0xffd166, emissiveIntensity: 0.35 });
const INK_MAT = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide, fog: false });
const LINE_MAT = new THREE.MeshBasicMaterial({ color: 0xffd166, transparent: true, opacity: 0, fog: false });

export class WordCards {
  /** 外层跟着镜头走（位置 + 朝向），内层是镜头前的那块固定区域 */
  readonly group = new THREE.Group();
  private inner = new THREE.Group();
  private cards: Card[] = [];
  private line: THREE.Mesh;
  private words: Array<{ from: number; to: number }> = [];
  private cueStart = 0;
  enabled = true;

  constructor() {
    this.inner.position.set(0, 1.42, -7.4);
    this.group.add(this.inner);
    this.line = new THREE.Mesh(new THREE.BoxGeometry(1, 0.05, 0.05), LINE_MAT);
    this.line.visible = false;
    this.inner.add(this.line);
  }

  /** 每帧把外层对到镜头上 */
  follow(cam: THREE.Camera) {
    this.group.position.copy(cam.position);
    this.group.quaternion.copy(cam.quaternion);
  }

  setCue(cue: Cue) {
    this.clear();
    if (!cue.text) return;
    const chars = charCues(cue);
    this.cueStart = cue.start;
    const n = chars.length;
    const size = n > 10 ? 0.52 : n > 8 ? 0.58 : 0.66;
    const gap = size * 1.1;
    // 词间多留一点空
    const xs: number[] = [];
    let x = 0;
    chars.forEach((c, i) => {
      if (i > 0 && c.w !== chars[i - 1].w) x += size * 0.22;
      xs.push(x);
      x += gap;
    });
    const total = x - gap;
    const geo = new THREE.BoxGeometry(size, size, size * 0.12);
    chars.forEach((c, i) => {
      const dim = new THREE.MeshBasicMaterial({ map: slipTex(c.ch, "dim"), transparent: true, fog: false });
      const gold = new THREE.MeshBasicMaterial({ map: slipTex(c.ch, "gold"), transparent: true, fog: false });
      const mesh = new THREE.Mesh(geo, [SIDE, SIDE, SIDE, SIDE, dim, dim]);
      const hull = new THREE.Mesh(geo, INK_MAT);
      hull.scale.setScalar(1.06);
      mesh.add(hull);
      mesh.position.set(xs[i] - total / 2, 0, 0);
      mesh.scale.setScalar(0.001);
      mesh.renderOrder = 20;
      this.inner.add(mesh);
      this.cards.push({ mesh, dim, gold, cue: c, x: xs[i] - total / 2, i });
    });
    // 词分组
    this.words = [];
    chars.forEach((c, i) => {
      const last = this.words[this.words.length - 1];
      if (last && i > 0 && c.w === chars[i - 1].w) last.to = i;
      else this.words.push({ from: i, to: i });
    });
    this.line.position.y = -size * 0.72;
    this.line.visible = true;
    (this.line.material as THREE.MeshBasicMaterial).opacity = 0;
  }

  update(t: number, energy: number) {
    this.group.visible = this.enabled && this.cards.length > 0;
    if (!this.group.visible) return;
    const lt = t - this.cueStart;
    for (const c of this.cards) {
      const m = c.mesh;
      const appear = clamp01((lt - c.i * 0.04) / 0.32);
      const s = backOut(appear);
      const cc = c.cue;
      const span = Math.max(0.08, cc.t1 - cc.t0);
      let z = 0;
      let scale = 1;
      let rotY = 0;
      let rotX = 0;
      if (t >= cc.t1) {
        const settle = clamp01((t - cc.t1) / 0.3);
        z = 0.16 + 0.5 * (1 - settle);
        scale = 1 + 0.12 * (1 - settle);
        this.setFace(c, true);
      } else if (t >= cc.t0) {
        const p = clamp01((t - cc.t0) / span);
        const kick = Math.sin(Math.PI * p);
        z = 0.35 + 1.1 * kick + energy * 0.5;
        scale = 1 + 0.3 * kick + energy * 0.12;
        rotY = (1 - p) * 0.55 * (c.i % 2 ? 1 : -1);
        rotX = (1 - p) * -0.25;
        this.setFace(c, p > 0.12);
      } else {
        const near = clamp01(1 - (cc.t0 - t) / 0.5);
        z = -0.1 + 0.2 * near;
        scale = 0.92 + 0.06 * near;
        this.setFace(c, false);
      }
      m.position.set(c.x, Math.sin(t * 2.2 + c.i * 0.7) * 0.02, z);
      m.scale.setScalar(Math.max(0.001, s * scale));
      m.rotation.set(rotX, rotY + (1 - s) * 1.5, 0);
    }
    // 当前词的金线
    const mat = this.line.material as THREE.MeshBasicMaterial;
    let found = false;
    for (const w of this.words) {
      const a = this.cards[w.from].cue;
      const b = this.cards[w.to].cue;
      if (t >= a.t0 - 0.02 && t <= b.t1 + 0.16) {
        const x0 = this.cards[w.from].x;
        const x1 = this.cards[w.to].x;
        const width = x1 - x0 + 0.5;
        this.line.position.x = (x0 + x1) / 2;
        this.line.scale.x = width;
        this.line.position.z = 0.3;
        mat.opacity = Math.min(1, mat.opacity + 0.2);
        found = true;
        break;
      }
    }
    if (!found) mat.opacity = Math.max(0, mat.opacity - 0.12);
  }

  private setFace(c: Card, gold: boolean) {
    const mats = c.mesh.material as THREE.Material[];
    const want = gold ? c.gold : c.dim;
    if (mats[4] !== want) {
      mats[4] = want;
      mats[5] = want;
      for (let i = 0; i < 4; i++) mats[i] = gold ? SIDE_GOLD : SIDE;
    }
  }

  clear() {
    for (const c of this.cards) {
      this.inner.remove(c.mesh);
      c.dim.dispose();
      c.gold.dispose();
      c.mesh.geometry.dispose();
    }
    this.cards = [];
    this.words = [];
    this.line.visible = false;
  }
}
