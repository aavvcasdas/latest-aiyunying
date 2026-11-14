// 立体字：模板字体 ZCOOL KuaiLe（子集，只含歌词与片名用到的字）→ 逐字挤出成 3D 几何。
import * as THREE from 'three';
import { TTFLoader } from 'three/examples/jsm/loaders/TTFLoader.js';
import { Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import fontUrl from './assets/zcool.ttf';
import { toonU, type C } from './kit';

let font: Font | null = null;
export const FONT_FAMILY = 'ZCOOL KuaiLe MV';

export async function loadFont() {
  const ab = await (await fetch(fontUrl)).arrayBuffer();
  font = new Font(new TTFLoader().parse(ab.slice(0)) as never);
  try {
    const ff = new FontFace(FONT_FAMILY, ab.slice(0));
    await ff.load(); (document.fonts as unknown as { add: (f: FontFace) => void }).add(ff);
  } catch (e) { console.warn('页面字体注册失败（不影响 3D 字）', e); }
}

const gcache = new Map<string, THREE.BufferGeometry>();
/** 一个字的几何（字号 1，居中，厚 0.22）；镜头里用 scale 放大缩小，几何全片共用 */
export function glyphGeo(ch: string): THREE.BufferGeometry {
  let g = gcache.get(ch);
  if (!g) {
    if (!font) throw new Error('[glyph] 字体还没加载');
    const tg = new TextGeometry(ch, { font, size: 1, depth: 0.22, curveSegments: 4, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.022, bevelSegments: 2 });
    tg.computeBoundingBox();
    const bb = tg.boundingBox!;
    tg.translate(-(bb.min.x + bb.max.x) / 2, -(bb.min.y + bb.max.y) / 2, -(bb.min.z + bb.max.z) / 2);
    g = tg; gcache.set(ch, g);
  }
  return g;
}
export function preloadGlyphs(text: string) { for (const ch of new Set(text)) if (ch.trim()) glyphGeo(ch); }

export interface WordOpts { size?: number; face?: C; side?: C; emissive?: C; ei?: number; gap?: number }
export interface Word { group: THREE.Group; chars: THREE.Mesh[]; face: THREE.MeshToonMaterial; side: THREE.MeshToonMaterial }
export function makeWord(text: string, o: WordOpts = {}): Word {
  const size = o.size ?? 1;
  const face = toonU(o.face ?? 0xffffff, o.emissive, o.ei ?? 0);
  const side = toonU(o.side ?? 0x555566, o.emissive, (o.ei ?? 0) * 0.5);
  const group = new THREE.Group(); const chars: THREE.Mesh[] = [];
  const list = Array.from(text); const n = list.length; const pitch = size * (1 + (o.gap ?? 0.1));
  list.forEach((ch, i) => {
    const m = new THREE.Mesh(glyphGeo(ch), [face, side]);
    m.scale.setScalar(size);
    m.position.x = (i - (n - 1) / 2) * pitch;
    m.userData.x0 = m.position.x; m.userData.s0 = size;
    group.add(m); chars.push(m);
  });
  return { group, chars, face, side };
}
