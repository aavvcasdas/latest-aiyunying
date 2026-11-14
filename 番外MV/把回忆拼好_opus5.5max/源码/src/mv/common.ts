// 镜头共用的布景与工具：运镜、立体字弹出、回忆拼图（画着像素小画）、雨、夜城、拼图烟花、大鲸鱼、小小世界。
import * as THREE from 'three';
import type { Kit, Out } from './engine';
import { ATLAS_RECTS } from './data';
import { backOut, canvasTex, clamp, ease, easeOut, gradientMap, hash, inv, lerp, mixV, pieceGeo, pieceShape, toon, type C, type Tabs, type V3 } from './kit';

export const cam = (p: V3, l: V3, fov = 40, roll = 0): Out => ({ p, l, fov, roll });
/** 按绝对时刻排的多关键帧运镜（关键帧挂在「第几句第几个字」上，卡点变了运镜跟着走） */
export function path(T: number, keys: [number, Out][]): Out {
  if (T <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    if (T <= keys[i][0]) {
      const [ta, A] = keys[i - 1], [tb, B] = keys[i];
      const u = clamp((T - ta) / (tb - ta || 1e-6)); const e = lerp(u, ease(u), 0.7);
      return { p: mixV(A.p, B.p, e), l: mixV(A.l, B.l, e), fov: lerp(A.fov ?? 40, B.fov ?? 40, e), roll: lerp(A.roll ?? 0, B.roll ?? 0, e) };
    }
  }
  return keys[keys.length - 1][1];
}
export const orbit = (c: V3, r: number, ang: number, h: number, look: V3, fov = 40): Out => cam([c[0] + Math.sin(ang) * r, c[1] + h, c[2] + Math.cos(ang) * r], look, fov);

/** 立体字逐字弹出：第 i 个字在 times[i]（实测起唱时刻）旋转落位 */
export function popWord(w: { chars: THREE.Mesh[] }, T: number, times: number[], o: { rise?: number; spin?: number; bob?: number; hit?: number } = {}) {
  w.chars.forEach((m, i) => {
    const s = T - times[Math.min(i, times.length - 1)];
    if (s < 0) { m.visible = false; return; }
    m.visible = true;
    const p = clamp(s / 0.32); const b = backOut(p, 2.4);
    const x0 = m.userData.x0 as number, s0 = m.userData.s0 as number;
    m.position.set(x0, (1 - ease(p)) * (o.rise ?? -0.8) + Math.sin(T * 2.2 + i * 1.3) * (o.bob ?? 0.05), 0);
    m.rotation.set(0, (1 - ease(p)) * (o.spin ?? 2.6), 0);
    m.scale.setScalar(s0 * Math.max(0.01, 0.2 + 0.8 * b) * (1 + (o.hit ?? 0) * 0.08));
  });
}

// ---------- 回忆拼图 ----------
export function drawSprite(c: CanvasRenderingContext2D, img: HTMLImageElement, key: string, cx: number, by: number, sc: number, flip = false) {
  const r = ATLAS_RECTS[key];
  if (!r) throw new Error(`[cast] 图集里没有「${key}」`);
  c.save(); c.imageSmoothingEnabled = false; c.translate(cx, by); if (flip) c.scale(-1, 1);
  c.drawImage(img, r[0], r[1], r[2], r[3], (-r[2] * sc) / 2, -r[3] * sc, r[2] * sc, r[3] * sc);
  c.restore();
}
export type MemKind = 'rice' | 'book' | 'tea' | 'sea' | 'clock' | 'heart';
const MEM_BG: Record<MemKind, [string, string]> = { rice: ['#fff0c4', '#ffc77a'], book: ['#e1f1ff', '#9cc8ff'], tea: ['#ffe6ee', '#ffadc4'], sea: ['#ffd6a8', '#ffb38a'], clock: ['#efe6ff', '#b9a0ff'], heart: ['#ffe0e8', '#ff7f9f'] };
const memCache = new Map<MemKind, THREE.CanvasTexture>();
/** 一块回忆：分饭、读书、喝茶、看海、沙漏、心——都是这支片子里真的发生过的镜头 */
export function memoryTex(k: Kit, kind: MemKind): THREE.CanvasTexture {
  const hit = memCache.get(kind); if (hit) return hit;
  const img = k.atlas.img;
  const t = canvasTex(256, 256, (c) => {
    const [a, b] = MEM_BG[kind];
    const g = c.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, a); g.addColorStop(1, b);
    c.fillStyle = g; c.fillRect(0, 0, 256, 256);
    c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(0, 204, 256, 52);
    if (kind === 'rice') { drawSprite(c, img, 'act_whale_eat_2', 86, 236, 1.6); drawSprite(c, img, 'act_claude_idle_0', 174, 236, 1.5); drawSprite(c, img, 'prop_bowl', 130, 200, 2.4); }
    if (kind === 'book') { drawSprite(c, img, 'act_claude_read_2', 96, 236, 1.6); drawSprite(c, img, 'act_whale_idle_0', 180, 236, 1.4); drawSprite(c, img, 'prop_book', 140, 110, 2.4); }
    if (kind === 'tea') { drawSprite(c, img, 'prop_teacup', 90, 196, 4.2); drawSprite(c, img, 'prop_teacup', 168, 196, 4.2, true); drawSprite(c, img, 'fx_steam_0', 90, 136, 3.4); drawSprite(c, img, 'fx_steam_1', 168, 136, 3.4); }
    if (kind === 'sea') {
      c.fillStyle = '#fff1b8'; c.beginPath(); c.arc(128, 128, 34, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#3d86d6'; c.fillRect(0, 150, 256, 106); c.fillStyle = '#7fc0ff';
      for (let i = 0; i < 6; i++) c.fillRect(i * 46 + 6, 172 + (i % 2) * 22, 30, 6);
      c.fillStyle = '#c98a4b'; c.fillRect(84, 198, 92, 14);
      drawSprite(c, img, 'act_whale_idle_0', 112, 202, 0.9); drawSprite(c, img, 'act_claude_idle_0', 148, 202, 0.85);
    }
    if (kind === 'clock') { drawSprite(c, img, 'prop_hourglass', 86, 214, 5.0); drawSprite(c, img, 'prop_catclock', 172, 204, 4.6); drawSprite(c, img, 'fx_sparkle_0', 128, 96, 3.0); }
    if (kind === 'heart') { drawSprite(c, img, 'fx_heart', 128, 140, 7.0); drawSprite(c, img, 'act_whale_wave_3', 72, 238, 1.25); drawSprite(c, img, 'act_claude_hop_3', 186, 238, 1.2); }
    c.strokeStyle = '#fff8ea'; c.lineWidth = 16; c.strokeRect(0, 0, 256, 256);
  });
  t.offset.set(0.5, 0.5);
  memCache.set(kind, t);
  return t;
}
/** 3 列 × 2 行、互相咬合的竖立回忆拼图 + 木框；update 让每块在指定时刻飞进自己的位置 */
export function memoryBoard(k: Kit, size: number) {
  const group = new THREE.Group(); k.root.add(group);
  const H = [[1, -1], [-1, 1]], V = [[1], [-1], [1]];
  const order: [number, number, MemKind][] = [[0, 1, 'rice'], [1, 1, 'book'], [2, 1, 'tea'], [0, 0, 'sea'], [1, 0, 'clock'], [2, 0, 'heart']];
  const side = toon(0xfff3dc);
  const caps: THREE.MeshToonMaterial[] = [];
  const pieces = order.map(([cx, cy, kind], i) => {
    const tabs: Tabs = [cy > 0 ? -V[cx][cy - 1] : 0, cx < 2 ? H[cx][cy] : 0, cy < 1 ? V[cx][cy] : 0, cx > 0 ? -H[cx - 1][cy] : 0];
    const tex = memoryTex(k, kind);
    const cap = new THREE.MeshToonMaterial({ map: tex, gradientMap: gradientMap(), emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0 });
    caps.push(cap);
    const m = new THREE.Mesh(pieceGeo(tabs, 0.2, false), [cap, side]);
    m.scale.set(size, size, 1); group.add(m);
    const from = new THREE.Vector3((hash(i * 3.1) - 0.5) * 12, 4 + hash(i * 1.9) * 3, 5 + hash(i * 7.7) * 3);
    return { m, hx: (cx - 1) * size, hy: (cy - 0.5) * size, from, spin: (hash(i * 5.3) - 0.5) * 6 };
  });
  const fm = toon(0xa86b3c); const W = 3 * size + 0.5 * size, Hh = 2 * size + 0.5 * size, th = 0.18 * size;
  ([[0, Hh / 2, W + th, th], [0, -Hh / 2, W + th, th], [-W / 2, 0, th, Hh], [W / 2, 0, th, Hh]] as number[][]).forEach(([x, y, w, h]) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.32 * size), fm); b.position.set(x, y, -0.04); group.add(b);
  });
  const back = new THREE.Mesh(new THREE.BoxGeometry(W, Hh, 0.06), toon(0x6e4426)); back.position.z = -0.18 * size; group.add(back);
  return {
    group,
    update(T: number, lands: number[], travel = 0.5) {
      pieces.forEach((p, i) => {
        const s = inv(lands[i] - travel, lands[i], T);
        p.m.visible = s > 0;
        const e = easeOut(s);
        p.m.position.set(lerp(p.from.x, p.hx, e), lerp(p.from.y, p.hy, e), lerp(p.from.z, 0.05, e));
        p.m.rotation.set((1 - e) * 1.2, (1 - e) * p.spin, (1 - e) * p.spin * 0.5);
        const land = T - lands[i]; const bump = land > 0 ? Math.exp(-land * 8) * 0.1 : 0;
        p.m.scale.set(size * (1 + bump), size * (1 + bump), 1);
      });
    },
    home(i: number) { const p = pieces[i]; return new THREE.Vector3(p.hx, p.hy, 0).add(group.position); },
    glow(v: number) { caps.forEach((c) => (c.emissiveIntensity = v)); },
  };
}

// ---------- 小小世界：2×2 块的浮岛，右前角缺一块 ----------
export function island(k: Kit, color: C) {
  const cells = k.board(2, 2, 1.6, () => color, { depth: 0.35 });
  const hole = cells.find((c) => c.ix === 1 && c.iz === 1)!;
  hole.m.visible = false;
  const pts = pieceShape(hole.tabs).getPoints(10).map((p) => new THREE.Vector3(hole.x + p.x * 1.6, 0.03, hole.z - p.y * 1.6));
  const outline = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0xcfe3ff, transparent: true, opacity: 0.6 }));
  k.root.add(outline);
  const under = k.glow(0x6fa2ff, 7, 0.22); under.position.set(0, -1.4, 0);
  return { cells, hole, outline };
}

// ---------- 灰暗的雨天 ----------
export function rain(k: Kit, n = 600, area = 16, color: C = 0xc9cdd8) {
  const pos = new Float32Array(n * 6);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.5 }));
  lines.frustumCulled = false; k.root.add(lines);
  const seeds = Array.from({ length: n }, (_, i) => [hash(i * 3.1) * area - area / 2, hash(i * 7.7) * area - area / 2 - 2, hash(i * 1.3)]);
  return (T: number) => {
    for (let i = 0; i < n; i++) {
      const [x, z, o] = seeds[i]; const y = 9 - ((T * 9 + o * 10) % 10);
      pos[i * 6] = x + 0.07; pos[i * 6 + 1] = y + 0.55; pos[i * 6 + 2] = z; pos[i * 6 + 3] = x; pos[i * 6 + 4] = y; pos[i * 6 + 5] = z;
    }
    geo.attributes.position.needsUpdate = true;
  };
}
export function grayWorld(k: Kit) {
  k.setFog(0x8a8e98, 10, 42);
  k.sky(0x5d616c, 0x9a9ea8, 0x50545e, {});
  const L = k.lights({ hemi: [0xc9ccd6, 0x3a3e48, 1.5], dir: [0xdfe2ea, 0.9, -3, 8, 5] });
  const greys = [0x6e727c, 0x787c86, 0x656973];
  k.board(10, 8, 1.6, (ix, iz) => greys[(ix + iz) % 3], { depth: 0.22 });
  return { L, update: rain(k, 620, 16) };
}

// ---------- 晴天草地 ----------
export function meadow(k: Kit, nx = 10, nz = 8) {
  k.setFog(0xcfeeff, 20, 70);
  k.sky(0x4fb0ff, 0xd8f2ff, 0xffffff, { sun: { dir: [0.4, 0.6, -0.7], color: 0xfff4c8, size: 30, str: 0.9 } });
  k.lights({ hemi: [0xffffff, 0x6aa86a, 1.7], dir: [0xfff4dc, 2.0, 4, 10, 6] });
  const greens = [0x9ee6a0, 0x8fdc93, 0xaef0ad, 0x84d48b];
  k.board(nx, nz, 1.6, (ix, iz) => greens[(ix * 3 + iz) % 4], { depth: 0.3 });
  const fg = new THREE.SphereGeometry(0.08, 6, 4);
  for (let i = 0; i < 34; i++) {
    const m = new THREE.Mesh(fg, toon([0xffffff, 0xffe066, 0xff9ecb][i % 3]));
    m.position.set((hash(i * 3.3) - 0.5) * (nx * 1.5), 0.06, (hash(i * 7.1) - 0.5) * (nz * 1.5)); k.root.add(m);
  }
}

// ---------- 夜城屋顶 ----------
export function nightCity(k: Kit) {
  k.setFog(0x141a3c, 30, 130);
  k.sky(0x060a22, 0x26306a, 0x0a0d24, { stars: 1 });
  k.lights({ hemi: [0x8fa0ff, 0x141a3c, 1.3], dir: [0xd6dcff, 1.2, -4, 8, 6] });
  const tex = canvasTex(64, 128, (c) => {
    c.fillStyle = '#1d2350'; c.fillRect(0, 0, 64, 128);
    for (let y = 8; y < 124; y += 12) for (let x = 6; x < 60; x += 12) { const h = hash(x * 13 + y * 7); c.fillStyle = h > 0.45 ? (h > 0.85 ? '#ffe9b0' : '#ffc96b') : '#2b3270'; c.fillRect(x, y, 7, 7); }
  });
  const mat = new THREE.MeshToonMaterial({ color: 0x8890c8, map: tex, emissive: 0xffd28a, emissiveMap: tex, emissiveIntensity: 0.7, gradientMap: gradientMap() });
  const geo = new THREE.BoxGeometry(1, 1, 1);
  for (let i = 0; i < 72; i++) {
    const row = i % 3; const x = (hash(i * 3.7) - 0.5) * 96; const z = -14 - row * 12 - hash(i * 5.1) * 8;
    const w = 2.5 + hash(i * 9.3) * 3.5; const h = 7 + hash(i * 2.9) * 16;
    const b = new THREE.Mesh(geo, mat); b.scale.set(w, h, w * 0.9); b.position.set(x, -12 + h / 2, z); k.root.add(b);
  }
  const moon = new THREE.Mesh(new THREE.SphereGeometry(2.4, 24, 16), new THREE.MeshBasicMaterial({ color: 0xfff3d1, fog: false }));
  moon.position.set(-22, 18, -70); k.root.add(moon);
  const mg = k.glow(0xfff0c8, 24, 0.5); mg.position.copy(moon.position);
  k.board(6, 4, 1.6, (ix, iz) => ((ix + iz) % 2 ? 0x3a4170 : 0x454d82), { depth: 0.3 });
  for (let i = 0; i < 6; i++) { const l = k.glow(0xffd08a, 0.9, 0.85); l.position.set(-4.4 + i * 1.76, 0.5, -3.1); }
}

// ---------- 拼图烟花 ----------
export interface BurstOpt { slow?: (s: number) => number; life?: number; launch?: number; fade?: number }
export function burst(k: Kit, n: number, scale: number, palette: number[]) {
  const im = new THREE.InstancedMesh(pieceGeo([1, -1, 1, -1], 0.12, false), new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false }), n);
  im.frustumCulled = false; im.visible = false; k.root.add(im);
  const dirs: V3[] = [], sp: number[] = [], spin: number[] = [];
  for (let i = 0; i < n; i++) {
    const y = 1 - (2 * (i + 0.5)) / n; const r = Math.sqrt(1 - y * y); const th = i * 2.399963;
    dirs.push([Math.cos(th) * r, y, Math.sin(th) * r]); sp.push((5 + hash(i * 3.3 + n) * 3) * scale); spin.push((hash(i * 7.1) - 0.5) * 10);
    im.setColorAt(i, new THREE.Color(palette[i % palette.length]));
  }
  const flash = k.glow(palette[0], 8, 0), trail = k.glow(0xfff2d0, 1.4, 0);
  const d = new THREE.Object3D();
  return (T: number, tb: number, c: V3, o: BurstOpt = {}) => {
    const s = T - tb; const launch = o.launch ?? 0.55;
    if (s < 0 && s > -launch) { const q = 1 + s / launch; trail.position.set(c[0], lerp(c[1] - 14, c[1], easeOut(q)), c[2]); trail.material.opacity = 0.9; } else trail.material.opacity = 0;
    if (s < 0) { im.visible = false; flash.material.opacity = 0; return; }
    const tau = o.slow ? o.slow(s) : s; const life = o.life ?? 1.8;
    const fade = o.fade ?? 1 - inv(life * 0.5, life, s);
    im.visible = fade > 0.01;
    for (let i = 0; i < n; i++) {
      const dd = dirs[i]; const r = (sp[i] * (1 - Math.exp(-2.4 * tau))) / 2.4;
      d.position.set(c[0] + dd[0] * r, c[1] + dd[1] * r - 0.8 * tau * tau, c[2] + dd[2] * r);
      d.rotation.set(spin[i] * tau, spin[i] * tau * 0.7, 0); d.scale.setScalar(0.42 * scale * Math.max(0.001, fade));
      d.updateMatrix(); im.setMatrixAt(i, d.matrix);
    }
    im.instanceMatrix.needsUpdate = true;
    flash.position.set(c[0], c[1], c[2]); flash.material.opacity = Math.exp(-s * 3.5) * 0.95; flash.scale.setScalar((6 + 14 * easeOut(s * 2)) * scale);
  };
}

// ---------- 大海里的大鲸鱼（鲸鱼娘的鲸鳍鲸尾） ----------
export function bigWhale(k: Kit) {
  const g = new THREE.Group(); const blue = toon(0x2d5ea6), belly = toon(0xd6ebff);
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 12), blue); body.scale.set(4.4, 1.6, 1.8);
  const bel = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 12), belly); bel.scale.set(3.8, 1.05, 1.4); bel.position.set(0.3, -0.62, 0);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.75, 2.8, 6), blue); tail.rotation.z = Math.PI / 2; tail.position.set(-5.2, 0.2, 0);
  const fluke = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.18, 3.4), blue); fluke.position.set(-6.5, 0.35, 0); fluke.rotation.z = 0.2;
  const fin = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.12, 0.6), blue); fin.position.set(1.4, -0.6, 1.6); fin.rotation.set(0.5, 0.3, -0.3);
  const fin2 = fin.clone(); fin2.position.z = -1.6; fin2.rotation.set(-0.5, -0.3, -0.3);
  const eyeM = new THREE.MeshBasicMaterial({ color: 0x0a1020 });
  const e1 = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), eyeM); e1.position.set(3.1, 0.15, 1.25);
  const e2 = e1.clone(); e2.position.z = -1.25;
  g.add(body, bel, tail, fluke, fin, fin2, e1, e2); k.root.add(g);
  return g;
}
