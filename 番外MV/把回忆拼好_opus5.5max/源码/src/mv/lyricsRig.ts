// 歌词条：把原片「一字一块拼图卡、唱到哪块弹到哪块」按字复刻成 3D——
// 每个字是一块立体拼图卡（相邻卡凸榫咬凹槽），字本身是挤出的立体字；关键词换色。
// 卡点：每块卡的弹出时刻 = 原片里那块字幕卡的实测弹出帧（data.ts）。整句唱完后按顺序翻走。
import * as THREE from 'three';
import { LYRICS } from './data';
import { backOut, clamp, ease, easeIn, pieceGeo, toon, type Tabs } from './kit';
import { glyphGeo } from './glyphs';

export type Kind = 'base' | 'gold' | 'pink' | 'blue' | 'grey';
/** 每句的关键词：[起始字, 字数, 颜色]（照原片高亮的词，再按歌意补） */
export const KEYWORDS: Record<number, [number, number, Kind][]> = {
  0: [[4, 2, 'gold']], 1: [[9, 2, 'pink']], 2: [[9, 2, 'gold']], 3: [[13, 2, 'blue']], 4: [[10, 2, 'gold']],
  5: [[2, 2, 'grey']], 6: [[7, 2, 'gold'], [9, 2, 'grey']], 7: [[1, 2, 'gold'], [13, 2, 'pink']], 8: [[5, 2, 'pink']],
  9: [[6, 2, 'gold']], 10: [[3, 2, 'pink']], 11: [[5, 2, 'pink']], 12: [[6, 2, 'blue']], 13: [[6, 2, 'pink']],
  14: [[1, 2, 'gold']], 15: [[4, 2, 'pink']], 16: [[1, 2, 'gold'], [3, 2, 'pink']],
};
const PAL: Record<Kind, [number, number]> = {
  base: [0xfff3dc, 0x3b3355], gold: [0xffc857, 0xa8321f], pink: [0xff9eb8, 0x7a1f45], blue: [0x9fdcff, 0x1d3d7a], grey: [0xc3c6cf, 0x3f434d],
};

interface Tile { holder: THREE.Group; ghost: THREE.Mesh; x: number; t: number }
interface Line { g: THREE.Group; tiles: Tile[]; end: number; t0: number }

export class LyricRig {
  root = new THREE.Group();
  private lines: Line[] = [];
  constructor() {
    const ghostMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.17, depthWrite: false });
    LYRICS.forEach((ln, li) => {
      const g = new THREE.Group(); g.visible = false; this.root.add(g);
      const title = !!ln.title; const chars = Array.from(ln.text); const n = chars.length;
      const pitch = title ? 0.84 : 0.55; const sc = title ? 0.82 : 0.535;
      const kinds: Kind[] = Array(n).fill('base');
      for (const [s, len, k] of KEYWORDS[li] ?? []) for (let j = s; j < s + len && j < n; j++) kinds[j] = k;
      let prevR = 0; const tiles: Tile[] = [];
      for (let i = 0; i < n; i++) {
        const r = i === n - 1 ? 0 : i % 2 === 0 ? 1 : -1;
        const tabs: Tabs = [0, r, 0, -prevR]; prevR = r;
        const [tc, gc] = PAL[kinds[i]];
        const holder = new THREE.Group();
        const tile = new THREE.Mesh(pieceGeo(tabs, 0.16, false), toon(tc)); tile.scale.set(sc, sc, 1);
        const gs = sc * 0.6;
        const glyph = new THREE.Mesh(glyphGeo(chars[i]), toon(gc)); glyph.scale.setScalar(gs);
        glyph.position.z = 0.08 + 0.05 + 0.15 * gs;
        holder.add(tile, glyph);
        const ghost = new THREE.Mesh(pieceGeo(tabs, 0.02, false), ghostMat); ghost.scale.set(sc, sc, 1);
        const x = (i - (n - 1) / 2) * pitch;
        holder.position.set(x, 0, 0); ghost.position.set(x, 0, -0.06);
        g.add(holder, ghost);
        tiles.push({ holder, ghost, x, t: ln.t[i] });
      }
      g.position.y = title ? 2.0 : -2.22;
      this.lines.push({ g, tiles, end: ln.end, t0: ln.t[0] });
    });
  }
  update(T: number, hit: number) {
    for (const L of this.lines) {
      const vis = T >= L.t0 - 0.02 && T < L.end + 0.6;
      L.g.visible = vis;
      if (!vis) continue;
      let cur = -1;
      L.tiles.forEach((tl, i) => { if (T >= tl.t) cur = i; });
      L.tiles.forEach((tl, i) => {
        const s = T - tl.t; const h = tl.holder;
        const out = T - L.end - i * 0.028;
        if (s < 0) { h.visible = false; tl.ghost.visible = out < 0; return; }
        tl.ghost.visible = false;
        const p = clamp(s / 0.26); const b = backOut(p, 2.2);
        let y = (1 - ease(p)) * 0.75; let sc = 0.22 + 0.78 * b; let rx = 0;
        const x = tl.x - (1 - b) * 0.4, z = (1 - p) * 1.3;
        const rz = (1 - b) * 0.95, ry = (1 - ease(p)) * -1.35;
        if (p >= 1) y += Math.sin(T * 3.1 + i * 0.7) * 0.018;
        if (i === cur && out < 0) { const k = Math.exp(-s * 3); sc *= 1 + 0.13 * k + 0.05 * hit; y += 0.09 * k; }
        if (out > 0) {
          const q = clamp(out / 0.3);
          if (q >= 1) { h.visible = false; return; }
          rx = -easeIn(q) * Math.PI * 0.6; y -= easeIn(q) * 0.55; sc *= 1 - easeIn(q);
        }
        h.visible = true;
        h.position.set(x, y, z); h.rotation.set(rx, ry, rz); h.scale.setScalar(Math.max(0.001, sc));
      });
    }
  }
}
