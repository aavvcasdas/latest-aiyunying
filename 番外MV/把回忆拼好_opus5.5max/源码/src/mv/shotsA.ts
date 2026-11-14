// 分镜 S01–S11（第 1–7 句）。每个镜头先写「这句歌在说什么」，再决定画面。
import * as THREE from 'three';
import type { ShotSpec } from './engine';
import { bigWhale, cam, grayWorld, island, memoryBoard, orbit, path, popWord } from './common';
import { backOut, ease, easeIn, easeOut, gradientMap, hash, inv, lerp, lerpSky, pieceGeo, rayTexture, skyU, type C } from './kit';

const NIGHT: [C, C, C] = [0x070a1f, 0x24204a, 0x0a0c22];

export const SHOTS_A: ShotSpec[] = [
  {
    id: 'S01', from: null, name: '渺小的我们', lyric: '我们都是渺小真实存在',
    note: '俯瞰一望无际的灰色拼图原野，每块拼图上站着一个小小的灰影（八位 AI 娘都在里面）。镜头从高空俯冲到正中那块蓝色拼图；「渺小」两个小小的立体字浮起，唱到「真实存在」鲸鱼娘才有了颜色。',
    cast: ['whale', 'gpt', 'claude', 'gemini', 'kimi', 'doubao', 'qwen', 'zai'],
    build: (k) => {
      k.setFog(0xa9b0d0, 26, 82);
      k.sky(0x55649f, 0xd4cdea, 0x9aa1c4, { sun: { dir: [0.4, 0.22, -1], color: 0xffe0c0, size: 40, str: 0.7 } });
      k.lights({ hemi: [0xe6ecff, 0x6d7392, 1.7], dir: [0xffffff, 1.5, 6, 12, 8] });
      const N = 13, mid = 6;
      const greys = [0xb4bad0, 0xa6acc4, 0xc1c6d8, 0xadb3ca];
      const cells = k.board(N, N, 1.7, (ix, iz) => (ix === mid && iz === mid ? 0x6fa2ff : greys[(ix * 7 + iz * 3) % 4]), { open: true });
      const ids = ['gpt', 'claude', 'gemini', 'kimi', 'doubao', 'qwen', 'zai'];
      const crowd = cells.filter((c) => !(c.ix === mid && c.iz === mid) && hash(c.ix * 31 + c.iz * 17) < 0.6).map((c, i) => {
        const id = ids[Math.floor(hash(i * 7.3) * ids.length)];
        return { a: k.actor(id, 0.85), id, x: c.x + (hash(i * 2.1) - 0.5) * 0.5, z: c.z + (hash(i * 4.7) - 0.5) * 0.5, ph: hash(i * 9.9) * 5 };
      });
      const whale = k.actor('whale', 0.9);
      const ring = k.glow(0xbfe0ff, 3.4, 0); ring.position.set(0, 0.3, 0);
      const tiny = k.word('渺小', { size: 0.26, face: 0xffd166, side: 0xb5651d }); tiny.group.position.set(0, 2.2, 0);
      return (f) => {
        for (const c of crowd) c.a.play(c.id === 'gpt' ? 'hover' : 'idle', f.T + c.ph, 6).at(c.x, c.id === 'gpt' ? 0.3 : 0, c.z, 0).look({ sil: 0.86, silColor: 0x7a809c });
        const tr = f.at(0, 6); const real = inv(tr, tr + 0.5, f.T);
        whale.play(real > 0.5 ? 'wave' : 'idle', f.T, 8).at(0, 0, 0).look({ sil: 0.86 * (1 - real), silColor: 0x7a809c, glow: f.T > tr ? 0.3 * Math.exp(-(f.T - tr) * 3) : 0 });
        ring.material.opacity = 0.75 * real;
        popWord(tiny, f.T, [f.at(0, 4), f.at(0, 5)], { rise: 0.4, spin: 1.5 });
        return path(f.T, [
          [0, cam([3, 27, 19], [0, 0, 0], 46)],
          [f.at(0, 4), cam([2, 12, 9], [0, 0.4, 0], 42)],
          [f.at(0, 7), cam([1.1, 2.1, 4.6], [0, 0.95, 0], 38)],
          [f.dur, cam([0.5, 1.8, 3.7], [0, 1.0, 0], 36)],
        ]);
      };
    },
  },
  {
    id: 'S02', from: [1, 0], name: '祈愿的小世界', lyric: '祈愿小世界里',
    note: '星空虚空里只有一座 2×2 的小浮岛，是她的「小世界」，右前角缺着一块（亮线描出空位）。鲸鱼娘低头许愿，头顶闪着小星光；远处漂着许多没人要的灰拼图。镜头绕岛慢慢转。',
    cast: ['whale'],
    build: (k) => {
      k.setFog(0x0c1230, 18, 60);
      k.sky(0x050818, 0x1a2452, 0x080c20, { stars: 1 });
      k.lights({ hemi: [0x9fb4ff, 0x1a1f3a, 1.3], dir: [0xd6e4ff, 1.6, -4, 8, 6] });
      island(k, 0x6fa2ff);
      const whale = k.actor('whale', 1);
      const lamp = k.glow(0xffe9b0, 1.6, 0.8);
      const spark = k.thing('fx_sparkle_0', 2.2);
      const drift = Array.from({ length: 26 }, (_, i) => ({ m: k.piece([1, -1, 1, -1], 0x39406a, { size: 0.9 + hash(i) * 0.8, depth: 0.2 }), x: (hash(i * 3.3) - 0.5) * 30, y: (hash(i * 5.5) - 0.5) * 12 - 2, z: -6 - hash(i * 7.7) * 25, r: hash(i * 9.1) * 6 }));
      return (f) => {
        whale.play('bow', f.t, 6, false).at(-0.4, 0, -0.2);
        spark.set(`fx_sparkle_${Math.floor(f.T * 6) % 3}`).at(-0.3, 1.95 + Math.sin(f.T * 2) * 0.08, -0.1);
        lamp.position.set(0.5, 1.2, 0.1); lamp.material.opacity = 0.55 + 0.25 * Math.sin(f.T * 3);
        drift.forEach((d, i) => { d.m.position.set(d.x + Math.sin(f.T * 0.3 + i) * 0.5, d.y + Math.sin(f.T * 0.5 + d.r) * 0.4, d.z); d.m.rotation.set(0.4 + f.T * 0.1 + d.r, f.T * 0.15 + d.r, 0.3); });
        return orbit([0, 0, 0], 5.4, lerp(-0.75, 0.25, ease(f.u)), 2.0, [-0.1, 0.8, 0], 40);
      };
    },
  },
  {
    id: 'S03', from: [1, 6], name: '塞不进去的那块', lyric: '不只有挫败',
    note: '她推来一块四边全是凸榫的灰拼图想补上空位——唱到「挫败」时撞在缺口边被弹飞，掉进虚空。鲸鱼娘垂下头，头顶飘起小乌云；「挫败」两个字摇摇晃晃裂开坠落。',
    cast: ['whale'],
    build: (k) => {
      k.setFog(0x0a0f28, 16, 56);
      k.sky(0x04060f, 0x151c40, 0x06091a, { stars: 0.8 });
      k.lights({ hemi: [0x8fa0e0, 0x141830, 1.2], dir: [0xc6d4ff, 1.4, 4, 7, 5] });
      island(k, 0x6fa2ff);
      const whale = k.actor('whale', 1);
      const wrong = k.piece([1, 1, 1, 1], 0x8a8fa8, { size: 1.6, depth: 0.35 });
      const gloom = k.thing('fx_gloom', 2.2);
      const w = k.word('挫败', { size: 0.6, face: 0xb3a8c8, side: 0x4a4060 });
      return (f) => {
        const t1 = f.T - f.t + f.dur, tPush = f.at(1, 7), tHit = f.at(1, 9);
        const hx = 0.8, hz = 0.8;
        let px: number, py = 0, pz: number, ry: number, rz = 0;
        if (f.T < tHit) { const q = ease(inv(tPush - 0.7, tHit, f.T)); px = lerp(hx + 4, hx + 0.4, q); pz = lerp(hz + 1.3, hz + 0.12, q); ry = lerp(0.8, 0.12, q); }
        else { const q = inv(tHit, tHit + 0.9, f.T); px = hx + 0.4 + easeOut(q) * 2.4; py = Math.sin(Math.min(1, q) * Math.PI) * 0.9 - easeIn(inv(tHit + 0.45, t1, f.T)) * 6; pz = hz + 0.12 + q * 0.6; rz = -q * 1.8; ry = 0.12 + q * 2; }
        wrong.position.set(px, py, pz); wrong.rotation.set(0, ry, rz);
        const sad = f.T >= tHit;
        whale.play(sad ? 'sad' : 'point', sad ? f.T - tHit : f.t, 7, !sad).at(-0.4, 0, -0.1);
        if (sad) gloom.at(-0.4, 2.0 + Math.sin(f.T * 4) * 0.05, -0.1).look({ alpha: inv(tHit, tHit + 0.3, f.T) });
        popWord(w, f.T, [f.at(1, 9), f.at(1, 10)], { rise: 1.0, spin: -2 });
        const fall = inv(f.at(1, 10) + 0.45, t1, f.T);
        w.group.position.set(0.3, 2.9 - easeIn(fall) * 1.6, -0.6); w.group.rotation.z = -0.15 * fall;
        w.chars.forEach((m, i) => { m.rotation.z += (i ? 1 : -1) * fall * 0.7; m.position.x += (i ? 1 : -1) * fall * 0.35; });
        const shake = f.T > tHit ? Math.exp(-(f.T - tHit) * 7) * Math.sin(f.T * 70) * 0.035 : 0;
        return { ...path(f.T, [[f.T - f.t, cam([2.6, 1.6, 4.6], [0.2, 0.7, 0.2], 40)], [tHit, cam([1.9, 1.3, 3.9], [0.4, 0.6, 0.3], 38)], [t1, cam([1.6, 1.1, 3.4], [0, 0.9, 0], 36)]]), roll: shake };
      };
    },
  },
  {
    id: 'S04', from: [2, 0], name: '遇见你', lyric: '直到遇见你',
    note: '黑暗里漂来一块发着暖光的橘色拼图，上面站着小克——它的凸榫和凹槽，正好是鲸鱼娘小世界缺的那一块的形状。唱到「你」，小克提裙行礼；鲸鱼娘吃惊地抬头。',
    cast: ['whale', 'claude'],
    build: (k) => {
      k.setFog(0x101634, 18, 60);
      k.sky(...NIGHT, { stars: 1, sun: { dir: [1, 0.1, -0.4], color: 0xffa060, size: 18, str: 0.5 } });
      k.lights({ hemi: [0xa8b8ff, 0x1a1f3a, 1.3], dir: [0xffd2a0, 1.6, 6, 6, 4] });
      const isl = island(k, 0x6fa2ff);
      const whale = k.actor('whale', 1), claude = k.actor('claude', 1);
      const cp = k.piece(isl.hole.tabs, 0xffa65c, { size: 1.6, depth: 0.35 });
      const warm = k.glow(0xffb36b, 5, 0.6);
      return (f) => {
        const t0 = f.T - f.t, t1 = t0 + f.dur, ty = f.at(2, 4);
        const q = easeOut(inv(t0, ty + 0.2, f.T));
        const x = lerp(9, 1.9, q), z = lerp(3.5, 0.8, q), y = Math.sin(f.T * 2) * 0.06 * (1 - q);
        cp.position.set(x, y, z); cp.rotation.y = (1 - q) * 0.8;
        warm.position.set(x, 1.2, z); warm.material.opacity = 0.55 + 0.15 * Math.sin(f.T * 3);
        claude.play(f.T > ty ? 'curtsy' : 'idle', f.T > ty ? f.T - ty : f.T, 8, f.T <= ty).at(x, y, z);
        const seen = f.T > f.at(2, 3);
        whale.play(seen ? 'surprise' : 'idle', seen ? f.T - f.at(2, 3) : f.T, 8, !seen).at(-0.4, 0, -0.1);
        return path(f.T, [[t0, cam([0.6, 1.8, 6.4], [0.9, 0.9, 0], 40)], [t1, cam([1.2, 1.6, 5.4], [0.9, 0.9, 0.2], 38)]]);
      };
    },
  },
  {
    id: 'S05', from: [2, 5], name: '光明起来', lyric: '我以为就光明起来',
    note: '「咔」一声两块拼图咬合。唱到「光明」闪白：周围一圈圈彩色拼图从下面升起来接成大地，夜空褪成黎明，太阳升起；金色的「光明」两个立体字在头顶亮起。镜头拉高拉远。',
    cast: ['whale', 'claude'],
    build: (k) => {
      const dawn: [C, C, C] = [0x6aa8ff, 0xffe2b8, 0xffc7a0];
      k.setFog(0x101634, 22, 95);
      const sky = k.sky(...NIGHT, { stars: 1, sun: { dir: [0.2, 0.15, -1], color: 0xffd9a0, size: 30, str: 0 } });
      const L = k.lights({ hemi: [0xa8b8ff, 0x1a1f3a, 1.2], dir: [0xffe2b8, 1.5, 4, 9, 6] });
      const isl = island(k, 0x6fa2ff); isl.outline.visible = false;
      const cp = k.piece(isl.hole.tabs, 0xffa65c, { size: 1.6, depth: 0.35 });
      const whale = k.actor('whale', 1), claude = k.actor('claude', 1);
      const pastel = [0xffd6a5, 0xfdffb6, 0xcaffbf, 0x9bf6ff, 0xa0c4ff, 0xffc6ff, 0xffadad];
      const cells = k.board(12, 10, 1.6, (ix, iz) => pastel[(ix * 3 + iz * 5) % 7], { open: true, depth: 0.3 });
      const ring = cells.filter((c) => { const inner = Math.abs(c.x) < 1.6 && Math.abs(c.z) < 1.6; if (inner) c.m.visible = false; return !inner; });
      const sun = k.glow(0xffe0a0, 26, 0);
      const word = k.word('光明', { size: 0.9, face: 0xffe28a, side: 0xd08a1a, emissive: 0xffc94a, ei: 0.35 }); word.group.position.set(0, 3.3, -0.5);
      const halo = k.glow(0xfff1b0, 6, 0); halo.position.set(0, 3.3, -0.7);
      const fogA = new THREE.Color(0x101634), fogB = new THREE.Color(0xffe2c4);
      return (f) => {
        const t0 = f.T - f.t, t1 = t0 + f.dur, tClick = f.at(2, 7), tLight = f.at(2, 9);
        const q = ease(inv(t0, tClick, f.T));
        const x = lerp(1.9, 0.8, q), y = (1 - q) * 0.12;
        cp.position.set(x, y, 0.8);
        const lit = inv(tLight, tLight + 1.6, f.T);
        lerpSky(sky, NIGHT, dawn, ease(lit)); skyU(sky).sunStr.value = ease(lit) * 1.1; skyU(sky).stars.value = 1 - lit;
        k.fog!.color.copy(fogA).lerp(fogB, ease(lit));
        L.hemi!.intensity = 1.2 + 0.8 * lit;
        for (const c of ring) { const d = Math.hypot(c.x, c.z); const s = inv(tLight + d * 0.05, tLight + d * 0.05 + 0.5, f.T); c.m.position.y = -4 + 4 * backOut(s, 1.4); c.m.visible = s > 0; }
        claude.play(f.T > tLight ? 'hop' : 'idle', f.T, 8).at(x, y, 0.8);
        const ws = f.T > tLight ? 'hop' : f.T > tClick ? 'surprise' : 'idle';
        whale.play(ws, ws === 'surprise' ? f.T - tClick : f.T, 8, ws !== 'surprise').at(-0.4, 0, -0.1);
        popWord(word, f.T, [f.at(2, 9), f.at(2, 10)], { rise: -1.2, hit: f.hit });
        halo.material.opacity = 0.7 * inv(tLight, tLight + 0.4, f.T);
        sun.position.set(8, lerp(-8, 10, ease(lit)), -70); sun.material.opacity = 0.9 * lit;
        const flash = f.T >= tLight ? Math.exp(-(f.T - tLight) * 5) : 0;
        const c = path(f.T, [[t0, cam([0.9, 1.5, 4.6], [0.4, 0.9, 0.3], 38)], [tLight, cam([1.2, 1.8, 5.2], [0.3, 1.0, 0.2], 40)], [t1, cam([3.5, 7.5, 13], [0, 0.8, 0], 46)]]);
        return { ...c, white: flash * 0.85 };
      };
    },
  },
  {
    id: 'S06', from: [3, 0], name: '眼睛里', lyric: '眼睛里看到的都是',
    note: '大特写：大号鲸鱼娘（全身立绘那一格）站在深海蓝的光里眨眼，四周浮起一颗颗气泡光斑，眼前闪着小星星——镜头往她眼睛里推，推到底闪白，切进她看到的那片海。',
    cast: ['whale'],
    build: (k) => {
      k.setFog(0x0d3a66, 10, 40);
      k.sky(0x061c3a, 0x1f6fb0, 0x041528, {});
      k.lights({ hemi: [0xcfe8ff, 0x0b2440, 1.6], dir: [0xffffff, 1.4, 2, 4, 6] });
      const big = k.thing('whale_big_idle', 1.6, false);
      const bokeh = Array.from({ length: 24 }, (_, i) => ({ g: k.glow(i % 3 ? 0x7fd3ff : 0xffffff, 0.5 + hash(i) * 1.6, 0.35), x: (hash(i * 2.2) - 0.5) * 10, y: hash(i * 3.3) * 6, z: -1.5 - hash(i * 4.4) * 6, s: 0.2 + hash(i * 5.5) * 0.5 }));
      const sp = [k.thing('fx_sparkle_0', 1.1), k.thing('fx_sparkle_1', 0.9), k.thing('fx_sparkle_2', 0.8)];
      const H = 148 * (1.7 / 90) * 1.6;
      return (f) => {
        const t1 = f.T - f.t + f.dur;
        const blink = (f.T > f.at(3, 3) && f.T < f.at(3, 3) + 0.14) || (f.T > f.at(3, 6) && f.T < f.at(3, 6) + 0.12);
        big.set(blink ? 'whale_big_blink' : 'whale_big_idle').at(0, 0, 0);
        bokeh.forEach((b, i) => { b.g.position.set(b.x + Math.sin(f.T * 0.5 + i) * 0.3, ((b.y + f.T * b.s) % 6.5) + 0.3, b.z); });
        const pos: [number, number][] = [[-1.5, H * 0.78], [1.45, H * 0.7], [1.2, H * 0.92]];
        sp.forEach((s, i) => s.set(`fx_sparkle_${(Math.floor(f.T * 7) + i) % 3}`).at(pos[i][0], pos[i][1], 0.3));
        const ey = H * 0.62;
        const white = inv(t1 - 0.28, t1, f.T);
        return { ...path(f.T, [[f.T - f.t, cam([0, ey + 0.2, 4.6], [0, ey - 0.25, 0], 36)], [t1, cam([-0.1, ey + 0.05, 2.3], [-0.12, ey, 0], 30)]]), white };
      };
    },
  },
  {
    id: 'S07', from: [3, 8], name: '广袤无垠的大海', lyric: '广袤无垠的大海',
    note: '整片海是两千多块蓝色拼图在起伏，夕阳把远处染成橘色。两人坐在一块木色拼图筏子上漂。唱到「大海」，远处一头大鲸鱼跃出拼图海面（鲸鱼娘的鲸尾元素），「大海」两个巨大的立体字从海里升起来。',
    cast: ['whale', 'claude'],
    build: (k) => {
      k.setFog(0xffc49a, 30, 150);
      k.sky(0x3d4f9a, 0xffb48a, 0x2c4688, { sun: { dir: [0, 0.06, -1], color: 0xffd6a0, size: 30, str: 1.3 } });
      k.lights({ hemi: [0xffe8d4, 0x2a5aa0, 1.9], dir: [0xffd8b0, 2.0, 3, 9, 12] });
      const NX = 46, NZ = 46, S = 1.3;
      const sea = new THREE.InstancedMesh(pieceGeo([1, 1, -1, -1], 0.18, true), new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: gradientMap() }), NX * NZ);
      sea.frustumCulled = false; k.root.add(sea);
      const col = new THREE.Color(), warm = new THREE.Color(0xffc48a); const blues = [0x2f7fd6, 0x3b8fe6, 0x2a6fc4, 0x4aa0f0, 0x5bb0f5];
      for (let i = 0; i < NX * NZ; i++) {
        const ix = i % NX, iz = Math.floor(i / NX); const x = (ix - NX / 2) * S;
        col.set(blues[Math.floor(hash(i * 1.7) * 5)]).lerp(warm, Math.exp(-Math.abs(x) * 0.1) * (iz / NZ) * 0.7);
        sea.setColorAt(i, col);
      }
      const dummy = new THREE.Object3D();
      const wave = (x: number, z: number, T: number) => 0.32 * Math.sin(x * 0.35 + T * 1.3) + 0.24 * Math.sin(z * 0.42 + T * 0.9 + x * 0.12) + 0.1 * Math.sin((x + z) * 0.9 + T * 2.1);
      const raft = k.piece([1, -1, 1, -1], 0xd9a066, { size: 2.2, depth: 0.3 });
      const whale = k.actor('whale', 1), claude = k.actor('claude', 1);
      const big = bigWhale(k);
      const sp1 = k.glow(0xffffff, 9, 0), sp2 = k.glow(0xffffff, 9, 0);
      const sunG = k.glow(0xffd9a0, 46, 0.9); sunG.position.set(0, 6, -140);
      const word = k.word('大海', { size: 2.4, face: 0xd7f3ff, side: 0x2a6fb5 });
      return (f) => {
        for (let i = 0; i < NX * NZ; i++) {
          const ix = i % NX, iz = Math.floor(i / NX); const x = (ix - NX / 2) * S, z = 8 - iz * S;
          dummy.position.set(x, wave(x, z, f.T) - 0.6, z);
          const dx = wave(x + 0.5, z, f.T) - wave(x - 0.5, z, f.T), dz = wave(x, z + 0.5, f.T) - wave(x, z - 0.5, f.T);
          dummy.rotation.set(dz * 0.8, 0, -dx * 0.8); dummy.scale.set(S, 1, S); dummy.updateMatrix(); sea.setMatrixAt(i, dummy.matrix);
        }
        sea.instanceMatrix.needsUpdate = true;
        const RZ = -2.5, ry = wave(0, RZ, f.T) - 0.45;
        raft.position.set(0, ry, RZ); raft.rotation.set((wave(0, RZ + 0.5, f.T) - wave(0, RZ - 0.5, f.T)) * 0.6, 0.2, -(wave(0.5, RZ, f.T) - wave(-0.5, RZ, f.T)) * 0.6);
        whale.play('idle', f.T, 6).at(-0.45, ry, RZ + 0.1); claude.play('idle', f.T + 0.5, 6).at(0.5, ry, RZ);
        const tb = f.at(3, 13) - 0.35; const s = inv(tb, tb + 2.0, f.T);
        big.visible = s > 0 && s < 1;
        big.position.set(lerp(26, 8, s), -5 + 11 * Math.sin(s * Math.PI), -42); big.rotation.set(0, -0.3, lerp(0.9, -1.0, s));
        sp1.position.set(25, 0.5, -42); sp1.material.opacity = 0.9 * Math.exp(-(((f.T - tb - 0.15) * 5) ** 2));
        sp2.position.set(9, 0.5, -42); sp2.material.opacity = 0.9 * Math.exp(-(((f.T - tb - 1.85) * 5) ** 2));
        const wq = inv(f.at(3, 13), f.at(3, 13) + 1.0, f.T);
        word.group.visible = wq > 0; word.group.position.set(0, lerp(-3.5, 3.6, easeOut(wq)) + Math.sin(f.T * 1.4) * 0.15, -20);
        word.chars.forEach((m, i) => m.rotation.set(0, Math.sin(f.T * 0.8 + i) * 0.15, 0));
        const t0 = f.T - f.t, t1 = t0 + f.dur;
        return path(f.T, [[t0, cam([-3.0, 2.3, 7.5], [0, -0.9, -20], 46)], [t1, cam([2.6, 2.9, 9.0], [0, -0.6, -20], 48)]]);
      };
    },
  },
  {
    id: 'S08', from: [4, 0], name: '不可能被取代', lyric: '有你在的日子不可能被取代',
    note: '暖色木地板上立着一个空相框。一块块「回忆拼图」踩着字飞进来：一起分饭、一起读书、两杯茶、看海、沙漏与猫耳钟——唱到「被」，一块灰色的替代品想挤进最后的空位，被弹开摔在地上；唱到「取代」，画着两颗心的那块严丝合缝地落位，整幅画亮起来。',
    cast: ['whale', 'claude'],
    build: (k) => {
      k.setFog(0xffe6c4, 18, 60);
      k.sky(0xffc98f, 0xfff1d8, 0xf0c49a, { sun: { dir: [-0.5, 0.5, 0.6], color: 0xfff0c0, size: 12, str: 0.4 } });
      k.lights({ hemi: [0xfff4e0, 0x9a6a4a, 1.6], dir: [0xffe7c4, 1.7, -4, 8, 7] });
      k.board(10, 6, 1.6, (ix, iz) => [0xd8a878, 0xc89868, 0xe0b488][(ix + iz * 2) % 3], { depth: 0.25, cz: -0.5 });
      const mb = memoryBoard(k, 1.45); mb.group.position.set(0, 2.25, -1.2);
      const whale = k.actor('whale', 1), claude = k.actor('claude', 1);
      const imp = k.piece([1, 1, 1, 1], 0x9a9aa8, { size: 1.45, depth: 0.2, flat: false });
      const g = k.glow(0xfff2c0, 4, 0);
      return (f) => {
        const t0 = f.T - f.t, t1 = t0 + f.dur;
        const lands = [0, 2, 4, 6, 8, 10].map((c) => f.at(4, c) + 0.12);
        mb.update(f.T, lands, 0.5);
        const home = mb.home(5); const ti = f.at(4, 9);
        const qi = inv(ti - 0.55, ti, f.T), bo = inv(ti, ti + 0.85, f.T);
        imp.visible = f.T > ti - 0.55 && bo < 1;
        if (f.T < ti) imp.position.set(lerp(home.x + 5, home.x + 0.3, ease(qi)), lerp(home.y + 2, home.y, ease(qi)), home.z + 0.35);
        else imp.position.set(home.x + 0.3 + bo * 3.5, home.y + Math.sin(bo * Math.PI) * 1.2 - easeIn(bo) * 3.2, home.z + 0.35 + bo);
        imp.rotation.set(0, 0, f.T < ti ? 0.3 * (1 - qi) : -bo * 3);
        const done = f.T > lands[5];
        whale.play(done ? 'hop' : 'point', f.T, 7).at(-3.3, 0, 0.6);
        claude.play(done ? 'hop' : 'idle', f.T + 0.3, 7).at(3.3, 0, 0.6);
        const gl = done ? Math.exp(-(f.T - lands[5]) * 2.5) : 0;
        g.position.set(home.x, home.y, home.z + 0.4); g.material.opacity = gl; g.scale.setScalar(3 + gl * 4);
        mb.glow(f.T > f.at(4, 11) ? 0.35 * Math.exp(-(f.T - f.at(4, 11)) * 1.5) + 0.1 : 0);
        return path(f.T, [[t0, cam([0, 2.6, 10.5], [0, 2.0, -1.2], 40)], [lands[5], cam([0.4, 2.4, 8.0], [0, 2.1, -1.2], 38)], [t1, cam([0.2, 2.3, 7.4], [0, 2.1, -1.2], 37)]]);
      };
    },
  },
  {
    id: 'S09', from: [5, 0], name: '最灰暗的日子', lyric: '在最灰暗的日子',
    note: '世界褪成灰色，拼图大地上下着雨。鲸鱼娘一个人垂着头站在雨里，颜色被抽掉一半，头顶飘着小乌云；灰色的「灰暗」两个字沉甸甸地往下坠。',
    cast: ['whale'],
    build: (k) => {
      const G = grayWorld(k);
      const whale = k.actor('whale', 1);
      const gloom = k.thing('fx_gloom', 2.0);
      const w = k.word('灰暗', { size: 0.85, face: 0x8d919c, side: 0x4a4e58 });
      return (f) => {
        G.update(f.T);
        const t0 = f.T - f.t, t1 = t0 + f.dur;
        whale.play('sad', f.t, 5, false).at(0, 0, 0).look({ sil: 0.35, silColor: 0x7d818c });
        gloom.at(0.05, 1.95 + Math.sin(f.T * 3) * 0.05, 0);
        popWord(w, f.T, [f.at(5, 2), f.at(5, 3)], { rise: 1.2, spin: 1.2 });
        const sink = inv(f.at(5, 3) + 0.4, t1, f.T);
        w.group.position.set(1.45, 2.25 - sink * 0.6, -1.0); w.group.rotation.z = -0.12 - sink * 0.15;
        return path(f.T, [[t0, cam([2.4, 3.0, 7.2], [0.3, 1.0, 0], 40)], [t1, cam([1.1, 2.1, 4.6], [0.3, 1.0, 0], 38)]]);
      };
    },
  },
  {
    id: 'S10', from: [5, 7], name: '你陪着我发呆', lyric: '你陪着我发呆',
    note: '小克从雨里走过来，在她身边站定；唱到「着」，脚边放下两只冒热气的茶杯（小克的道具）。两个人什么也不说，一起望着雨发呆——只有她们身边亮着一小圈暖光，鲸鱼娘的颜色一点点回来。',
    cast: ['whale', 'claude'],
    build: (k) => {
      const G = grayWorld(k);
      const whale = k.actor('whale', 1), claude = k.actor('claude', 1);
      const cupA = k.thing('prop_teacup', 1.5), cupB = k.thing('prop_teacup', 1.5);
      const stA = k.thing('fx_steam_0', 1.4), stB = k.thing('fx_steam_0', 1.4);
      const warm = k.glow(0xffc98a, 5.5, 0);
      const pl = new THREE.PointLight(0xffb070, 0, 9); k.add(pl, -0.3, 1.6, 1.0);
      return (f) => {
        G.update(f.T);
        const t0 = f.T - f.t, t1 = t0 + f.dur, tArr = f.at(5, 8) + 0.35;
        const q = inv(t0, tArr, f.T);
        if (q < 1) claude.play('walk', f.T, 10).at(lerp(-5.5, -1.0, q), 0, 0.2); else claude.play('idle', f.T, 4).at(-1.0, 0, 0.2);
        const tog = inv(tArr - 0.2, tArr + 0.8, f.T);
        whale.play(tog > 0.5 ? 'idle' : 'sad', f.T, tog > 0.5 ? 4 : 5).at(0.4, 0, 0).look({ sil: 0.35 * (1 - tog * 0.65), silColor: 0x7d818c });
        const tc = f.at(5, 9);
        if (f.T > tc) {
          const cq = Math.max(0.01, backOut(inv(tc, tc + 0.3, f.T), 2));
          cupA.at(-0.55, 0, 0.8).look({ s: cq }); cupB.at(0.1, 0, 0.8).look({ s: cq, flip: true });
          const sf = Math.floor(f.T * 5) % 3;
          stA.set(`fx_steam_${sf}`).at(-0.55, 0.32, 0.8); stB.set(`fx_steam_${(sf + 1) % 3}`).at(0.1, 0.32, 0.8);
        }
        warm.position.set(-0.3, 1.0, 0.4); warm.material.opacity = 0.45 * tog; pl.intensity = 7 * tog;
        return path(f.T, [[t0, cam([-2.8, 1.6, 5.6], [-0.6, 0.9, 0], 40)], [t1, cam([1.4, 1.5, 5.0], [-0.3, 0.9, 0], 38)]]);
      };
    },
  },
  {
    id: 'S11', from: [6, 0], name: '拨开阴霾', lyric: '你让我学会如何拨开阴霾',
    note: '低角度仰拍：天上压着一整片灰色拼图做的云。小克翻开她的书；唱到「拨开」，云层从她头顶开始一块块掀起、翻滚着飞走，露出蓝天和太阳光柱；「阴霾」两个灰字被吹散。鲸鱼娘抬头，惊讶，然后挥手。',
    cast: ['whale', 'claude'],
    build: (k) => {
      const grey: [C, C, C] = [0x5d616c, 0x9a9ea8, 0x50545e], blue: [C, C, C] = [0x3f9bff, 0xcdeeff, 0xeaf6ff];
      k.setFog(0x9a9ea8, 14, 60);
      const sky = k.sky(...grey, { sun: { dir: [0.25, 0.85, -0.45], color: 0xfff2c4, size: 25, str: 0 } });
      const L = k.lights({ hemi: [0xc9ccd6, 0x3a3e48, 1.3], dir: [0xfff0d0, 0.7, 3, 10, 2] });
      k.board(10, 8, 1.6, (ix, iz) => [0x8fb38a, 0x9cc196, 0x86ab82][(ix + iz) % 3], { depth: 0.22 });
      const ceiling = k.board(9, 7, 2.2, (ix, iz) => [0x7c808b, 0x868a95, 0x737782][(ix * 2 + iz) % 3], { depth: 0.4, y: 7.5, open: true });
      const claude = k.actor('claude', 1), whale = k.actor('whale', 1);
      const rays = Array.from({ length: 5 }, (_, i) => {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 14), new THREE.MeshBasicMaterial({ map: rayTexture(), color: 0xfff2c4, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, side: THREE.DoubleSide }));
        m.position.set(-3 + i * 1.6, 6, -3 - i * 0.6); m.rotation.z = 0.35; k.root.add(m); return m;
      });
      const w = k.word('阴霾', { size: 0.95, face: 0x8a8e98, side: 0x4d515b }); w.group.position.set(0, 4.4, -1);
      const fogA = new THREE.Color(0x9a9ea8), fogB = new THREE.Color(0xd8efff);
      return (f) => {
        const t0 = f.T - f.t, t1 = t0 + f.dur, tOpen = f.at(6, 7), tClear = f.at(6, 9);
        for (const c of ceiling) {
          const d = Math.hypot(c.x + 0.8, c.z); const s = inv(tOpen + d * 0.045, tOpen + d * 0.045 + 0.9, f.T);
          c.m.visible = s < 1; const e = easeIn(s);
          c.m.position.set(c.x + Math.sign(c.x || 1) * e * 6, 7.5 + e * 9, c.z - e * 3); c.m.rotation.set(s * 2.2, s * 1.3, s * (c.x > 0 ? -1.5 : 1.5));
        }
        const open = inv(tOpen, tClear + 0.8, f.T);
        lerpSky(sky, grey, blue, ease(open)); skyU(sky).sunStr.value = 1.2 * ease(open);
        k.fog!.color.copy(fogA).lerp(fogB, ease(open));
        L.dir!.intensity = 0.7 + 1.8 * open; L.hemi!.intensity = 1.3 + 0.6 * open;
        rays.forEach((r, i) => ((r.material as THREE.MeshBasicMaterial).opacity = 0.22 * ease(inv(tClear - 0.2, tClear + 0.8, f.T)) * (0.7 + 0.3 * Math.sin(f.T * 2 + i))));
        claude.play('read', f.T, 6).at(-0.8, 0, 0);
        const ws = f.T < tClear ? 'sad' : f.T < tClear + 0.75 ? 'surprise' : 'wave';
        whale.play(ws, ws === 'sad' ? f.T : ws === 'surprise' ? f.T - tClear : f.T - tClear - 0.75, 8, ws !== 'surprise').at(0.9, 0, 0.1).look({ sil: 0.3 * (1 - open), silColor: 0x7d818c });
        popWord(w, f.T, [f.at(6, 9), f.at(6, 10)], { rise: 0.8 });
        const bq = inv(f.at(6, 10) + 0.25, f.at(6, 10) + 1.0, f.T);
        if (bq > 0) w.chars.forEach((m, i) => { const dir = i ? 1 : -1; m.position.x += dir * easeOut(bq) * 3; m.position.y += easeOut(bq) * 1.5; m.rotation.z += dir * bq * 2; m.scale.multiplyScalar(Math.max(0.01, 1 - bq)); m.visible = m.visible && bq < 1; });
        return path(f.T, [[t0, cam([0.4, 0.6, 6.4], [0, 2.4, -1], 50)], [tOpen, cam([0.3, 0.7, 6.0], [0, 2.8, -1], 50)], [t1, cam([0.2, 1.0, 6.6], [0, 3.6, -2], 54)]]);
      };
    },
  },
];
