import * as THREE from 'three';
import * as opentype from 'opentype.js';
import fontUrl from '../assets/kuaile.woff?url';

let font: opentype.Font | null = null;

export async function loadFont() {
  const buf = await (await fetch(fontUrl)).arrayBuffer();
  font = opentype.parse(buf);
  // 同时注册给 DOM / Canvas 用
  try {
    const ff = new FontFace('KuaiLe', buf);
    await ff.load();
    (document.fonts as unknown as { add: (f: FontFace) => void }).add(ff);
  } catch {
    /* ignore */
  }
}

type Contour = { pts: THREE.Vector2[]; path: THREE.Path; area: number };

function area(p: THREE.Vector2[]) {
  let a = 0;
  for (let i = 0, j = p.length - 1; i < p.length; j = i++) a += (p[j].x - p[i].x) * (p[j].y + p[i].y);
  return a / 2;
}
function inside(pt: THREE.Vector2, poly: THREE.Vector2[]) {
  let c = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i], b = poly[j];
    if (a.y > pt.y !== b.y > pt.y && pt.x < ((b.x - a.x) * (pt.y - a.y)) / (b.y - a.y) + a.x) c = !c;
  }
  return c;
}

/** 字形轮廓 → Shape[]（按包含深度判定外框与孔，和绕向无关） */
function glyphShapes(ch: string): THREE.Shape[] {
  if (!font) throw new Error('字体未加载');
  const path = font.getPath(ch, 0, 0, 1);
  const contours: Contour[] = [];
  let cur: THREE.Path | null = null;
  for (const c of path.commands) {
    // opentype 输出 y 向下，这里翻回 y 向上
    if (c.type === 'M') {
      if (cur) {
        const pts0 = cur.getPoints(4);
        if (pts0.length > 2) contours.push({ pts: pts0, path: cur, area: Math.abs(area(pts0)) });
      }
      cur = new THREE.Path();
      cur.moveTo(c.x, -c.y);
    } else if (c.type === 'L') cur!.lineTo(c.x, -c.y);
    else if (c.type === 'Q') cur!.quadraticCurveTo(c.x1, -c.y1, c.x, -c.y);
    else if (c.type === 'C') cur!.bezierCurveTo(c.x1, -c.y1, c.x2, -c.y2, c.x, -c.y);
    else if (c.type === 'Z' && cur) {
      const pts = cur.getPoints(4);
      if (pts.length > 2) contours.push({ pts, path: cur, area: Math.abs(area(pts)) });
      cur = null;
    }
  }
  if (cur) {
    const pts = cur.getPoints(4);
    if (pts.length > 2) contours.push({ pts, path: cur, area: Math.abs(area(pts)) });
  }
  // 按绕向区分外框与孔：和面积最大的轮廓同向的是外框（笔画互相重叠也不会误判）
  if (!contours.length) return [];
  const signed = contours.map((c) => area(c.pts));
  let big = 0;
  contours.forEach((c, i) => {
    if (c.area > contours[big].area) big = i;
  });
  const outerSign = Math.sign(signed[big]);
  const depth = signed.map((s, i) => {
    if (Math.sign(s) === outerSign) return 0;
    // 反向且被某个同向轮廓包住才算孔
    const c = contours[i];
    return contours.some((o, j) => j !== i && Math.sign(signed[j]) === outerSign && o.area > c.area && c.pts.every((p) => inside(p, o.pts))) ? 1 : 0;
  });
  const shapes: { s: THREE.Shape; c: Contour }[] = [];
  contours.forEach((c, i) => {
    if (depth[i] % 2 === 0) {
      const s = new THREE.Shape(c.pts);
      shapes.push({ s, c });
    }
  });
  contours.forEach((c, i) => {
    if (depth[i] % 2 === 1) {
      // 找面积最小且包含它的外框
      let best: { s: THREE.Shape; c: Contour } | null = null;
      for (const sh of shapes) {
        if (sh.c.area > c.area && inside(c.pts[0], sh.c.pts) && (!best || sh.c.area < best.c.area)) best = sh;
      }
      if (best) best.s.holes.push(new THREE.Path(c.pts));
    }
  });
  return shapes.map((x) => x.s);
}

const cache = new Map<string, THREE.BufferGeometry>();

/** 单字的立体几何，字身高约 1，居中，正面朝 +z */
export function glyphGeo(ch: string, depth = 0.22): THREE.BufferGeometry {
  const key = ch + '|' + depth;
  const hit = cache.get(key);
  if (hit) return hit;
  const shapes = glyphShapes(ch);
  const g = new THREE.ExtrudeGeometry(shapes, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.012,
    bevelSegments: 1,
    curveSegments: 3,
  });
  g.computeBoundingBox();
  const bb = g.boundingBox!;
  // 按 em 框居中（不按字墨居中，这样一排字基线一致）
  g.translate(-0.5, -0.38, -depth / 2);
  void bb;
  g.computeVertexNormals();
  cache.set(key, g);
  return g;
}

/** 一个词的立体模型：每个字一个 Mesh，正面 + 侧面两种材质 */
export function makeWord(
  text: string,
  opt: { size?: number; gap?: number; face?: number; side?: number; depth?: number; emissive?: number } = {},
) {
  const size = opt.size ?? 1;
  const gap = opt.gap ?? 1.05;
  const face = new THREE.MeshStandardMaterial({
    color: opt.face ?? 0xffffff,
    roughness: 0.45,
    metalness: 0.05,
    emissive: opt.emissive ?? 0x000000,
  });
  const side = new THREE.MeshStandardMaterial({ color: opt.side ?? 0x8a5a44, roughness: 0.6 });
  const group = new THREE.Group();
  const chars = [...text];
  const meshes: THREE.Mesh[] = [];
  chars.forEach((ch, i) => {
    const m = new THREE.Mesh(glyphGeo(ch, opt.depth ?? 0.22), [face, side]);
    const holder = new THREE.Group();
    holder.add(m);
    holder.position.x = (i - (chars.length - 1) / 2) * gap * size;
    holder.scale.setScalar(size);
    group.add(holder);
    meshes.push(m);
  });
  return { group, holders: group.children as THREE.Group[], face, side, meshes };
}
