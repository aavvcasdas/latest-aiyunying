import * as THREE from 'three';
import { pieceGeo, std, rnd } from './kit';

export const PASTEL = ['#f7b7c4', '#ffd59e', '#bfe3b4', '#a9d6f5', '#cdb8f2', '#ffe8a3', '#f9c6a5', '#b9ece0'].map(
  (c) => new THREE.Color(c),
);
export const pastel = (i: number) => PASTEL[Math.floor(rnd(i, 7) * PASTEL.length)];

/** 平铺在地上的拼图地面 + 每块上一个小人（原片里那片灰色人群） */
export function crowdField(n: number, size: number, opts: { pawns?: boolean; exclude?: (i: number, j: number) => boolean } = {}) {
  const geo = pieceGeo(1, 1, -1, -1, 0.16, 1);
  const field = new THREE.InstancedMesh(geo, std(0xffffff, { roughness: 0.75 }), n * n);
  const c = (n - 1) / 2;
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
  const pos: THREE.Vector3[] = [];
  const ij: [number, number][] = [];
  let k = 0;
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      const p = new THREE.Vector3((i - c) * size, 0, (j - c) * size);
      m.compose(p, q, new THREE.Vector3(size, size, size));
      field.setMatrixAt(k, m);
      field.setColorAt(k, new THREE.Color(0x9a9ea6));
      pos.push(p);
      ij.push([i - c, j - c]);
      k++;
    }
  const top = 0.12 * size;
  const g = new THREE.Group();
  g.add(field);
  let bodies: THREE.InstancedMesh | null = null;
  let heads: THREE.InstancedMesh | null = null;
  const pawnIdx: number[] = [];
  if (opts.pawns) {
    pos.forEach((_, idx) => {
      const [a, b] = ij[idx];
      if (opts.exclude?.(a, b)) return;
      pawnIdx.push(idx);
    });
    bodies = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.1, 0.2, 0.42, 10), std(0xffffff), pawnIdx.length);
    heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.14, 12, 10), std(0xffffff), pawnIdx.length);
    pawnIdx.forEach((idx, n2) => {
      const p = pos[idx];
      m.makeTranslation(p.x, top + 0.21, p.z);
      bodies!.setMatrixAt(n2, m);
      m.makeTranslation(p.x, top + 0.56, p.z);
      heads!.setMatrixAt(n2, m);
      bodies!.setColorAt(n2, new THREE.Color(0x80848c));
      heads!.setColorAt(n2, new THREE.Color(0x8c9098));
    });
    g.add(bodies, heads);
  }
  const setTile = (idx: number, p: THREE.Vector3, s = size, rot = q) => {
    m.compose(p, rot, new THREE.Vector3(s, s, s));
    field.setMatrixAt(idx, m);
  };
  return { group: g, field, bodies, heads, pos, ij, pawnIdx, top, setTile, q };
}

export function ground(color: THREE.ColorRepresentation, size = 200) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), std(color, { roughness: 1 }));
  m.rotation.x = -Math.PI / 2;
  return m;
}

/** 一块单独的立体拼图块（平放），可上色 */
export function tile(color: THREE.ColorRepresentation, size = 1.2, edges: [number, number, number, number] = [1, 1, -1, -1]) {
  const mesh = new THREE.Mesh(pieceGeo(...edges, 0.16, 1), std(color, { roughness: 0.6 }));
  mesh.rotation.x = -Math.PI / 2;
  mesh.scale.setScalar(size);
  return mesh;
}

/** 夜空星星 */
export function stars(n: number, r = 150) {
  const g = new THREE.BufferGeometry();
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const th = rnd(i, 1) * Math.PI * 2;
    const ph = rnd(i, 2) * 0.45 * Math.PI;
    a[i * 3] = Math.cos(th) * Math.cos(ph) * r;
    a[i * 3 + 1] = Math.sin(ph) * r + 5;
    a[i * 3 + 2] = Math.sin(th) * Math.cos(ph) * r;
  }
  g.setAttribute('position', new THREE.BufferAttribute(a, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ color: 0xfff4d6, size: 0.9, sizeAttenuation: true, fog: false }));
}

/** 窗户亮灯的城市贴图 */
export function windowTex(seed: number) {
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 128;
  const g = c.getContext('2d')!;
  g.fillStyle = '#2a2f5c';
  g.fillRect(0, 0, 64, 128);
  for (let y = 8; y < 124; y += 14)
    for (let x = 6; x < 60; x += 14) {
      const on = rnd(x * 13 + y, seed) > 0.45;
      g.fillStyle = on ? '#ffd98a' : '#3a4074';
      g.fillRect(x, y, 8, 9);
    }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
