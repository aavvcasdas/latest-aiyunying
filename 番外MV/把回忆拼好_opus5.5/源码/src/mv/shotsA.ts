import * as THREE from 'three';
import type { ShotDef, Stage } from './stage';
import { LINES } from './timing';
import { Actor, Thing, clamp, lerp, easeInOut, easeOut, pop, ramp, rnd, smooth, skyDome, glowSprite, pieceGeo, std, puzzleField } from './kit';
import { crowdField, ground, pastel, tile, PASTEL } from './common';
import { makeWord } from './glyphs';

const C = (n: number, k: number) => LINES[n].chars[k];
const v3 = (a: THREE.Vector3, b: THREE.Vector3, u: number) => new THREE.Vector3().lerpVectors(a, b, u);
const GREY = new THREE.Color(0x9a9ea6);

// ───────────── 1 我们都是渺小真实存在 ─────────────
// 人海般的灰色拼图地，本鲸站在唯一一块蓝色的拼图上；「渺小」镜头猛拉高，她缩成一个点；「真实存在」她脚下那块亮起来。
const s1: ShotDef = {
  id: 'S01',
  name: '人海里的一块蓝',
  build(S: Stage) {
    const g = new THREE.Group();
    const F = crowdField(41, 1.2, { pawns: true, exclude: (a, b) => Math.hypot(a, b) < 2.2 || (Math.abs(a) < 2 && b > 0) });
    const mid = (41 * 41 - 1) / 2;
    F.field.setColorAt(mid, new THREE.Color(0x6aa8e8));
    F.field.instanceColor!.needsUpdate = true;
    g.add(F.group, ground(0x8d9199));
    const glow = glowSprite('rgba(140,200,255,1)', 3, 0);
    glow.position.set(0, 0.3, 0);
    g.add(glow);
    const whale = new Actor('whale', 1.25);
    g.add(whale.root);
    return {
      group: g,
      update(t) {
        S.light({ bg: 0xb5b9c0, sky: 0xf0f2f6, ground: 0x7a7e86, hemi: 1.4, sun: 1.2, fog: [0xb5b9c0, 18, 60] });
        whale.act('idle', t).at(0, F.top, 0);
        const up = easeInOut(ramp(t, C(0, 4) - 0.1, C(0, 6)));
        const pos = v3(new THREE.Vector3(0.3, 1.6, 3.4), new THREE.Vector3(0, 30, 13), up);
        const look = v3(new THREE.Vector3(0, 0.75, 0), new THREE.Vector3(0, 0, -1), up);
        S.cam([pos.x + Math.sin(t) * 0.1, pos.y, pos.z], [look.x, look.y, look.z], lerp(38, 34, up));
        whale.face(S.camera);
        const real = ramp(t, C(0, 6), C(0, 7));
        glow.material.opacity = real * (0.8 + 0.2 * Math.sin(t * 8));
        glow.scale.setScalar(2 + real * 2.5);
        const m = new THREE.Matrix4();
        m.compose(new THREE.Vector3(0, real * 0.25, 0), F.q, new THREE.Vector3(1.2, 1.2 + real * 0.6, 1.2));
        F.field.setMatrixAt(mid, m);
        F.field.instanceMatrix.needsUpdate = true;
        whale.root.position.y = F.top + real * 0.25;
      },
    };
  },
};

// ───────────── 2 祈愿小世界里不只有挫败 ─────────────
// 她许愿，一点光升上天；「不只有挫败」时身边的拼图一块块掉进深处，巨大的「挫败」二字砸在她身旁。
const s2: ShotDef = {
  id: 'S02',
  name: '许愿与掉落的拼图',
  build(S) {
    const g = new THREE.Group();
    const F = crowdField(31, 1.2, { pawns: true, exclude: (a, b) => Math.abs(a) <= 2 && Math.abs(b) <= 2 });
    const mid = (31 * 31 - 1) / 2;
    F.field.setColorAt(mid, new THREE.Color(0x6aa8e8));
    // 身边要掉落的拼图
    const drops: { idx: number; k: number; p: THREE.Vector3 }[] = [];
    let n = 0;
    F.ij.forEach(([a, b], idx) => {
      const d = Math.hypot(a, b);
      if (d >= 1 && d < 2.9 && (a !== 0 || b !== 0) && rnd(idx, 3) > 0.25 && n < 14) {
        drops.push({ idx, k: 6 + (n % 5), p: F.pos[idx].clone() });
        n++;
      }
    });
    F.field.instanceColor!.needsUpdate = true;
    g.add(F.group);
    const wish = glowSprite('rgba(255,240,180,1)', 0.8, 1);
    g.add(wish);
    const word = makeWord('挫败', { size: 1.4, face: 0x6c717c, side: 0x3c4048, depth: 0.5 });
    g.add(word.group);
    const whale = new Actor('whale', 1.25);
    g.add(whale.root);
    const gloom = new Thing('fx_gloom', 0.5);
    g.add(gloom.mesh);
    return {
      group: g,
      update(t, lt) {
        S.light({ bg: 0x8f949e, sky: 0xd8dce4, ground: 0x5a5e66, hemi: 1.2, sun: 0.9, fog: [0x8f949e, 10, 45] });
        const ang = -0.5 + lt * 0.12;
        S.cam([Math.sin(ang) * 6.5, 3.4 - lt * 0.2, Math.cos(ang) * 6.5], [0, 1.0, 0], 40);
        const sadT = t - C(1, 6);
        if (sadT > 0) whale.act('sad', sadT);
        else whale.act('idle', lt);
        whale.at(0, F.top, 0).face(S.camera);
        // 许愿的光
        const w = ramp(t, C(1, 0), C(1, 2) + 0.4);
        wish.position.set(Math.sin(t * 3) * 0.2, lerp(1.1, 7, easeOut(w)), lerp(0.2, -3, w));
        wish.material.opacity = 0.6 + 0.4 * Math.sin(t * 12);
        // 掉落
        const m = new THREE.Matrix4();
        drops.forEach((d, i) => {
          const s = t - C(1, d.k) - (i % 3) * 0.06;
          const u = Math.max(0, s);
          const y = -4.5 * u * u * 2;
          const rot = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2 + u * 2 * (rnd(i) - 0.5), u * 2, u * 1.5));
          m.compose(new THREE.Vector3(d.p.x, y, d.p.z), rot, new THREE.Vector3(1.2, 1.2, 1.2).multiplyScalar(u > 1.5 ? 0 : 1));
          F.field.setMatrixAt(d.idx, m);
        });
        F.field.instanceMatrix.needsUpdate = true;
        // 「挫败」砸下来
        const ws = t - C(1, 9) + 0.25;
        const fall = clamp(ws / 0.25);
        const bounce = ws > 0.25 ? Math.abs(Math.sin((ws - 0.25) * 14)) * Math.exp(-(ws - 0.25) * 6) * 0.5 : 0;
        word.group.position.set(2.1, lerp(9, 0.75, fall * fall) + bounce, -0.6);
        word.group.rotation.set(0, -0.4, (1 - fall) * 0.4);
        word.group.visible = ws > 0;
        if (ws > 0.25 && ws < 0.5) S.camera.position.y += Math.sin(ws * 80) * 0.06;
        gloom.mesh.visible = sadT > 0.2;
        gloom.mesh.position.set(0.15, F.top + 1.45, 0.05);
        gloom.mesh.lookAt(S.camera.position);
      },
    };
  },
};

// ───────────── 3 直到遇见你我以为就光明起来 ─────────────
// 小克的橙色拼图块从远处滑来，咔一声补上她身边的缺口；「光明起来」颜色从两人脚下一圈圈漫开，灰色人海全被点亮。
const s3: ShotDef = {
  id: 'S03',
  name: '遇见你，颜色漫开',
  build(S) {
    const g = new THREE.Group();
    const N = 41;
    const F = crowdField(N, 1.2, { pawns: true, exclude: (a, b) => Math.abs(a) <= 1 && b === 0 });
    const mid = (N * N - 1) / 2;
    const hole = mid + 1;
    F.setTile(hole, F.pos[hole], 0.0001);
    const pawnColor = F.pawnIdx.map((_, i) => pastel(i + 99));
    g.add(F.group, ground(0x8d9199));
    const ct = tile(0xffa65c, 1.2);
    g.add(ct);
    const whale = new Actor('whale', 1.25);
    const claude = new Actor('claude', 1.25);
    g.add(whale.root, claude.root);
    const flash = glowSprite('rgba(255,236,180,1)', 4, 0);
    g.add(flash);
    const heart = new Thing('fx_heart', 0.45);
    g.add(heart.mesh);
    const col = new THREE.Color();
    const bg = new THREE.Color();
    return {
      group: g,
      update(t, lt) {
        const meet = C(2, 4);
        const bright = C(2, 9);
        const r = Math.max(0, (t - bright) * 16);
        const amt = clamp((t - bright) / 1.2);
        bg.set(0xb5b9c0).lerp(new THREE.Color(0xfbe7d2), amt);
        S.light({ bg, sky: 0xffffff, ground: 0x9a8e86, hemi: 1.3 + amt * 0.5, sun: 1.2 + amt * 0.8, sunColor: 0xfff0d8, fog: [bg, 14, 60], exposure: 1 + amt * 0.1 });
        // 颜色波
        F.pos.forEach((p, idx) => {
          if (idx === mid) col.set(0x6aa8e8);
          else {
            const d = Math.hypot(p.x, p.z);
            const u = clamp((r - d) / 3);
            col.copy(GREY).lerp(pastel(idx), u);
          }
          F.field.setColorAt(idx, col);
        });
        F.field.instanceColor!.needsUpdate = true;
        F.pawnIdx.forEach((idx, i) => {
          const p = F.pos[idx];
          const u = clamp((r - Math.hypot(p.x, p.z)) / 3);
          col.set(0x80848c).lerp(pawnColor[i], u);
          F.bodies!.setColorAt(i, col);
          F.heads!.setColorAt(i, col.clone().lerp(new THREE.Color(0xfff1e0), 0.5));
        });
        F.bodies!.instanceColor!.needsUpdate = true;
        F.heads!.instanceColor!.needsUpdate = true;
        // 小克滑入
        const u = easeOut(ramp(t, LINES[2].start, meet));
        const cx = lerp(13, 1.2, u);
        ct.position.set(cx, 0, 0);
        claude.flip = false;
        if (t < meet) claude.act('idle', lt);
        else claude.act('curtsy', t - meet);
        claude.at(cx, F.top, 0.05);
        if (t < bright) whale.act('idle', lt);
        else whale.act('hop', t - bright);
        whale.at(0, F.top, 0);
        // 咔哒的光
        const fs = t - meet;
        flash.position.set(0.6, 0.4, 0.1);
        flash.material.opacity = fs > 0 ? Math.exp(-fs * 5) : 0;
        heart.mesh.visible = fs > 0;
        heart.mesh.position.set(0.6, F.top + 1.6 + Math.max(0, fs) * 0.3, 0);
        heart.mesh.scale.setScalar(pop(fs) * 0.45);
        // 镜头
        const up = easeInOut(ramp(t, bright - 0.1, bright + 1.2));
        const pos = v3(new THREE.Vector3(0.6 + lt * 0.05, 1.5, 5.2), new THREE.Vector3(0.6, 11, 12), up);
        S.cam([pos.x, pos.y, pos.z], [0.6, lerp(0.9, 0, up), 0], 40);
        whale.face(S.camera);
        claude.face(S.camera);
        heart.mesh.lookAt(S.camera.position);
      },
    };
  },
};

// ───────────── 4 眼睛里看到的都是广袤无垠的大海 ─────────────
// 拼图变成一望无际的海，块块起伏；两人站在一块小筏子上；「广袤无垠」镜头升起，「大海」二字从远处海面浮出。
const s4: ShotDef = {
  id: 'S04',
  name: '拼图之海',
  build(S) {
    const g = new THREE.Group();
    const N = 56;
    const size = 1.1;
    const geo = pieceGeo(1, 1, -1, -1, 0.16, 1);
    const sea = new THREE.InstancedMesh(geo, std(0xffffff, { roughness: 0.35, metalness: 0.1 }), N * N);
    const base: THREE.Vector3[] = [];
    for (let j = 0; j < N; j++)
      for (let i = 0; i < N; i++) {
        const p = new THREE.Vector3((i - N / 2) * size, 0, (j - N + 6) * size);
        base.push(p);
        const toSun = Math.exp(-Math.pow(p.x / 5, 2)) * clamp(-p.z / 50);
        const c = new THREE.Color().setHSL(0.56 + rnd(i * N + j) * 0.04, 0.6, 0.45 + rnd(j * N + i, 2) * 0.15);
        c.lerp(new THREE.Color(0xffd9a0), toSun * 0.7);
        sea.setColorAt(i + j * N, c);
      }
    sea.instanceColor!.needsUpdate = true;
    g.add(sea);
    g.add(skyDome([[0, '#5d93cc'], [0.38, '#b8cfe6'], [0.47, '#ffd6a6'], [0.5, '#ffc98a'], [0.53, '#4a8cc4'], [1, '#2a5a8c']]));
    const sunG = glowSprite('rgba(255,220,150,1)', 40, 0.55);
    sunG.position.set(0, 4, -120);
    g.add(sunG);
    const sunDisk = new THREE.Mesh(new THREE.CircleGeometry(5, 32), new THREE.MeshBasicMaterial({ color: 0xfff1cf, fog: false }));
    sunDisk.position.set(0, 4, -125);
    g.add(sunDisk);
    const raft = tile(0xf3e3c3, 1.6, [0, 0, 0, 0]);
    g.add(raft);
    const whale = new Actor('whale', 1.15);
    const claude = new Actor('claude', 1.15);
    g.add(whale.root, claude.root);
    const word = makeWord('大海', { size: 5, face: 0xffffff, side: 0x2f78b8, depth: 0.4, emissive: 0x334455 });
    g.add(word.group);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const sc = new THREE.Vector3(size, size, size);
    const wave = (x: number, z: number, t: number) => Math.sin(x * 0.45 + t * 1.6) * 0.18 + Math.cos(z * 0.35 + t * 1.1) * 0.16;
    return {
      group: g,
      update(t, lt) {
        S.light({ bg: 0xf1d2ad, sky: 0xfff2e0, ground: 0x2a5a8c, hemi: 1.3, sun: 1.6, sunColor: 0xffe2b8, sunPos: [0, 6, -20], fog: [0xf3d4b0, 18, 52], exposure: 0.9 });
        base.forEach((p, i) => {
          const y = wave(p.x, p.z, t);
          e.set(-Math.PI / 2 + Math.cos(p.x * 0.45 + t * 1.6) * 0.08, 0, Math.sin(p.z * 0.35 + t) * 0.06);
          q.setFromEuler(e);
          m.compose(new THREE.Vector3(p.x, y - 0.25, p.z), q, sc);
          sea.setMatrixAt(i, m);
        });
        sea.instanceMatrix.needsUpdate = true;
        const ry = wave(0, 0, t) * 0.6;
        raft.position.set(0, ry, 0);
        raft.rotation.z = Math.sin(t * 1.3) * 0.04;
        whale.act('sway', lt).at(-0.35, ry + 0.2, 0.1);
        claude.act('idle', lt).at(0.4, ry + 0.2, 0);
        const up = easeInOut(ramp(t, C(3, 8), C(3, 12)));
        const pos = v3(new THREE.Vector3(0, 1.3, 4.2), new THREE.Vector3(0, 4.2, 8.5), up);
        const look = v3(new THREE.Vector3(0, 1.3, -6), new THREE.Vector3(0, 0.6, -14), up);
        S.cam([pos.x + Math.sin(t * 0.7) * 0.15, pos.y, pos.z], [look.x, look.y, look.z], lerp(42, 48, up));
        whale.face(S.camera);
        claude.face(S.camera);
        // 「大海」浮出
        const ws = t - C(3, 13);
        const wu = easeOut(clamp(ws / 0.8));
        word.group.position.set(0, lerp(-6, 5, wu) + Math.sin(t * 1.5) * 0.2, -36);
        word.group.visible = ws > 0;
        word.holders.forEach((h, i) => {
          h.rotation.y = (1 - pop(ws - i * 0.15, 0.7)) * 1.5;
        });
      },
    };
  },
};

// ───────────── 5 有你在的日子不可能被取代 ─────────────
// 一块回忆拼图板：茶杯、书、饭盆、篮子、闪光，一块块飞来嵌上；「取代」最后一块爱心严丝合缝，整板发光。
const s5: ShotDef = {
  id: 'S05',
  name: '回忆拼图板',
  build(S) {
    const g = new THREE.Group();
    g.add(ground(0xead2b0));
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), std(0xf2dcc0, { roughness: 1 }));
    wall.position.set(0, 10, -4);
    g.add(wall);
    const board = new THREE.Mesh(new THREE.BoxGeometry(6.2, 4.3, 0.2), std(0xfaf3e6));
    board.position.set(0, 2.75, -1.6);
    g.add(board);
    const icons = ['prop_teacup', 'prop_book', 'prop_bowl', 'prop_basket', 'fx_sparkle_0', 'fx_heart'];
    const cols = [PASTEL[3], PASTEL[1], PASTEL[2], PASTEL[4], PASTEL[5], new THREE.Color(0xf48aa6)];
    const order = [0, 4, 2, 1, 3, 5];
    const lockK = [1, 3, 5, 7, 9, 10];
    const pieces: { grp: THREE.Group; dst: THREE.Vector3; src: THREE.Vector3; k: number }[] = [];
    const edge = (i: number, j: number) => ((i + j) % 2 === 0 ? 1 : -1);
    for (let j = 0; j < 2; j++)
      for (let i = 0; i < 3; i++) {
        const id = i + j * 3;
        // 相邻两块共用的边取相反值，保证严丝合缝
        const v = (ii: number) => (ii % 2 === 0 ? 1 : -1);
        const right = i === 2 ? 0 : edge(i, j);
        const left = i === 0 ? 0 : -edge(i - 1, j);
        const top = j === 0 ? 0 : -v(i);
        const bottom = j === 1 ? 0 : v(i);
        const grp = new THREE.Group();
        const mesh = new THREE.Mesh(pieceGeo(top, right, bottom, left, 0.2, 1), std(cols[id], { roughness: 0.5 }));
        mesh.scale.setScalar(1.9);
        grp.add(mesh);
        const ic = new Thing(icons[id], 1.0);
        ic.mesh.position.set(0, -0.5, 0.48);
        grp.add(ic.mesh);
        const dst = new THREE.Vector3((i - 1) * 1.9, 2.75 + (j === 0 ? 0.95 : -0.95), -1.35);
        const src = new THREE.Vector3((rnd(id, 4) - 0.5) * 16, 7 + rnd(id, 5) * 3, 3);
        pieces.push({ grp, dst, src, k: lockK[order.indexOf(id)] });
        g.add(grp);
      }
    const glow = glowSprite('rgba(255,200,150,1)', 9, 0);
    glow.position.set(0, 2.75, -1.2);
    g.add(glow);
    const whale = new Actor('whale', 1.6);
    const claude = new Actor('claude', 1.6);
    g.add(whale.root, claude.root);
    return {
      group: g,
      update(t, lt) {
        S.light({ bg: 0xf2dcc0, sky: 0xfff6ea, ground: 0xc8a882, hemi: 1.4, sun: 1.4, sunColor: 0xfff0dc, sunPos: [-5, 9, 8] });
        pieces.forEach((p) => {
          const s = t - C(4, p.k);
          const u = easeInOut(clamp((s + 0.45) / 0.45));
          const pos = v3(p.src, p.dst, u);
          pos.z += Math.sin(u * Math.PI) * 1.5;
          p.grp.position.copy(pos);
          p.grp.rotation.set((1 - u) * 1.2, (1 - u) * 2, (1 - u) * 0.8);
          p.grp.visible = s > -0.45;
          if (s > 0 && s < 0.2) p.grp.position.z += Math.sin(s * 60) * 0.03;
        });
        const fin = t - C(4, 10);
        glow.material.opacity = fin > 0 ? 0.6 * Math.exp(-fin * 1.2) + 0.25 : 0;
        whale.act(fin > 0 ? 'hop' : 'idle', fin > 0 ? fin : lt).at(-4, 0, 0.5);
        claude.act(t > C(4, 6) ? 'nod' : 'idle', t - C(4, 6)).at(4, 0, 0.5);
        claude.flip = true;
        const z = lerp(10, 8.2, smooth(lt / 3.9));
        S.cam([Math.sin(lt * 0.3) * 0.4, 2.4, z], [0, 2.2, 0], 40);
        whale.face(S.camera);
        claude.face(S.camera);
      },
    };
  },
};

// ───────────── 6 在最灰暗的日子你陪着我发呆 ─────────────
// 灰色的雨，全片唯一的暖色是小克撑开的那把黄伞；本鲸褪成灰白，头顶飘着呆滞的 Z。
const s6: ShotDef = {
  id: 'S06',
  name: '灰雨与黄伞',
  build(S) {
    const g = new THREE.Group();
    const F = crowdField(25, 1.2);
    g.add(F.group, ground(0x6c7078));
    const N = 1600;
    const rain = new THREE.BufferGeometry();
    const arr = new Float32Array(N * 6);
    rain.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const lines = new THREE.LineSegments(rain, new THREE.LineBasicMaterial({ color: 0xc8ccd6, transparent: true, opacity: 0.5 }));
    g.add(lines);
    const umb = new THREE.Group();
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.35, 0.55, 16, 1, true), std(0xf6c445, { side: THREE.DoubleSide, roughness: 0.5 }));
    canopy.position.y = 0.27;
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.6, 6), std(0x7a5a3a));
    stick.position.y = -0.55;
    umb.add(canopy, stick);
    g.add(umb);
    const whale = new Actor('whale', 1.3);
    const claude = new Actor('claude', 1.3);
    g.add(whale.root, claude.root);
    const zzz = new Thing('fx_zzz_0', 0.4);
    const gloom = new Thing('fx_gloom', 0.45);
    g.add(zzz.mesh, gloom.mesh);
    return {
      group: g,
      update(t, lt) {
        S.light({ bg: 0x7b8089, sky: 0xc0c6d0, ground: 0x4a4e56, hemi: 1.0, sun: 0.6, fog: [0x7b8089, 6, 30] });
        for (let i = 0; i < N; i++) {
          const x = (rnd(i, 1) - 0.5) * 16;
          const z = (rnd(i, 2) - 0.5) * 12 - 1;
          const sp = 9 + rnd(i, 3) * 4;
          const y = 8 - ((t * sp + rnd(i, 4) * 10) % 10);
          arr.set([x, y, z, x + 0.05, y - 0.35, z], i * 6);
        }
        rain.attributes.position.needsUpdate = true;
        whale.act('sad', lt).at(-0.45, F.top, 0).grey(1);
        claude.act('idle', lt).at(0.55, F.top, 0.05).grey(0.55);
        const open = easeOut(ramp(t, C(5, 7) - 0.2, C(5, 8)));
        umb.position.set(0.1, F.top + 2.05, 0.05);
        umb.scale.set(lerp(0.15, 1, open), 1, lerp(0.15, 1, open));
        umb.rotation.z = -0.12 + Math.sin(t * 1.2) * 0.02;
        const z = lerp(6, 4.6, smooth(lt / 3.6));
        S.cam([0.2, 1.5, z], [0.05, 1.15, 0], 40);
        whale.face(S.camera);
        claude.face(S.camera);
        gloom.mesh.position.set(-0.45, F.top + 1.55, 0.1);
        gloom.mesh.visible = t < C(5, 11);
        const zs = t - C(5, 11);
        zzz.mesh.visible = zs > 0;
        zzz.setFrame('fx_zzz_' + (Math.floor(Math.max(0, zs) * 4) % 3));
        zzz.mesh.position.set(-0.2 + zs * 0.15, F.top + 1.5 + zs * 0.25, 0.1);
        zzz.mesh.lookAt(S.camera.position);
        gloom.mesh.lookAt(S.camera.position);
      },
    };
  },
};

// ───────────── 7 你让我学会如何拨开阴霾 ─────────────
// 头顶压着一整面乌云拼图；「拨开」时一块块向四周飞散，阳光与光柱落下，本鲸的颜色回来了。
const s7: ShotDef = {
  id: 'S07',
  name: '拨开乌云拼图',
  build(S) {
    const g = new THREE.Group();
    g.add(skyDome([[0, '#4f9be0'], [0.5, '#bfe2ff'], [0.55, '#9fd27e'], [1, '#6aa24e']]));
    g.add(ground(0x8cc56a));
    const cols = 22, rows = 12, size = 1.6;
    const wall = puzzleField(cols, rows, size, (i, j) => new THREE.Color().setHSL(0.62, 0.12, 0.26 + rnd(i * rows + j) * 0.12));
    wall.position.set(0, 9, -7);
    g.add(wall);
    const base: THREE.Vector3[] = [];
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) base.push(new THREE.Vector3((i - (cols - 1) / 2) * size, (j - (rows - 1) / 2) * size, 0));
    const sun = glowSprite('rgba(255,240,180,1)', 16, 0);
    sun.position.set(0, 10, -30);
    const disk = new THREE.Mesh(new THREE.CircleGeometry(2.4, 32), new THREE.MeshBasicMaterial({ color: 0xfff6d8, transparent: true, fog: false }));
    disk.position.set(0, 10, -31);
    g.add(sun, disk);
    const rays = new THREE.Group();
    for (let i = 0; i < 14; i++) {
      const r = new THREE.Mesh(
        new THREE.PlaneGeometry(0.6, 30),
        new THREE.MeshBasicMaterial({ color: 0xfff2c0, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }),
      );
      r.geometry.translate(0, 15, 0);
      r.rotation.z = (i / 14) * Math.PI * 2;
      rays.add(r);
    }
    rays.position.set(0, 10, -29);
    g.add(rays);
    const whale = new Actor('whale', 1.4);
    const claude = new Actor('claude', 1.4);
    g.add(whale.root, claude.root);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    return {
      group: g,
      update(t, lt) {
        const open = clamp((t - C(6, 7)) / 0.9);
        const o = easeOut(open);
        S.light({ bg: 0x9fc6e8, sky: 0xffffff, ground: 0x6a8a50, hemi: lerp(0.7, 1.5, o), sun: lerp(0.4, 2.0, o), sunColor: 0xfff0d0, sunPos: [0, 10, -10], exposure: lerp(0.75, 1.05, o) });
        base.forEach((p, i) => {
          const dir = new THREE.Vector3(p.x, p.y + 2, 0).normalize();
          const dl = Math.max(0, open * 1.4 - rnd(i, 9) * 0.4);
          const d = dl * dl * 34;
          q.setFromEuler(new THREE.Euler(dl * 3 * (rnd(i) - 0.5), dl * 4 * (rnd(i, 2) - 0.5), dl * 2));
          m.compose(new THREE.Vector3(p.x + dir.x * d, p.y + dir.y * d, p.z - dl * 3), q, new THREE.Vector3(size, size, size));
          wall.setMatrixAt(i, m);
        });
        wall.instanceMatrix.needsUpdate = true;
        sun.material.opacity = o;
        (disk.material as THREE.MeshBasicMaterial).opacity = o;
        rays.rotation.z = t * 0.1;
        rays.children.forEach((r) => (((r as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = 0.12 * o));
        whale.grey(1 - o);
        claude.grey(0.4 * (1 - o));
        if (open > 0) whale.act('hop', t - C(6, 7));
        else whale.act('idle', lt);
        whale.at(-0.6, 0, 0);
        claude.act(t > C(6, 0) && open <= 0 ? 'nod' : 'idle', t - C(6, 0)).at(0.6, 0, 0);
        const tilt = easeInOut(ramp(t, C(6, 3), C(6, 7)));
        const back = easeInOut(ramp(t, C(6, 8), C(6, 10) + 0.3));
        S.cam([0, lerp(1.2, 0.8, tilt), lerp(6, 7, tilt) + back], [0, lerp(1.1, 6, tilt) - back * 3, lerp(0, -6, tilt)], 44);
        whale.face(S.camera);
        claude.face(S.camera);
      },
    };
  },
};

// ───────────── 8 将快乐全都收集将不开心全都淘汰 ─────────────
// 左边一只玻璃罐，彩色拼图一块块跳进去攒满；右边一个垃圾桶，灰拼图被丢进去，「淘汰」二字也跟着掉进桶里。
const s8: ShotDef = {
  id: 'S08',
  name: '收集快乐，丢掉不开心',
  build(S) {
    const g = new THREE.Group();
    g.add(ground(0xf6d9d0));
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(60, 30), std(0xfbe5dc, { roughness: 1 }));
    wall.position.set(0, 10, -5);
    g.add(wall);
    const jar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.85, 0.85, 1.9, 28, 1, true),
      new THREE.MeshStandardMaterial({ color: 0xdff4ff, transparent: true, opacity: 0.28, roughness: 0.1, side: THREE.DoubleSide, depthWrite: false }),
    );
    jar.position.set(-2.4, 0.95, 0);
    const jarBase = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.06, 28), std(0xcfe8f4));
    jarBase.position.set(-2.4, 0.03, 0);
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.18, 28), std(0xc89a6a));
    lid.position.set(-2.4, 2.4, 0);
    g.add(jar, jarBase, lid);
    const bin = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.6, 1.4, 20, 1, true), std(0x8a8f98, { side: THREE.DoubleSide, metalness: 0.4 }));
    bin.position.set(2.6, 0.7, 0);
    const binIn = new THREE.Mesh(new THREE.CircleGeometry(0.6, 20), std(0x3a3d44));
    binIn.rotation.x = -Math.PI / 2;
    binIn.position.set(2.6, 0.02, 0);
    g.add(bin, binIn);
    const happy: THREE.Mesh[] = [];
    const sad: THREE.Mesh[] = [];
    for (let i = 0; i < 14; i++) {
      const m = new THREE.Mesh(pieceGeo(1, 1, -1, -1, 0.2, 1), std(PASTEL[i % PASTEL.length], { emissive: PASTEL[i % PASTEL.length], emissiveIntensity: 0.15 }));
      m.scale.setScalar(0.42);
      happy.push(m);
      g.add(m);
    }
    for (let i = 0; i < 12; i++) {
      const m = new THREE.Mesh(pieceGeo(1, 1, -1, -1, 0.2, 1), std(new THREE.Color().setHSL(0.6, 0.06, 0.35 + rnd(i) * 0.15)));
      m.scale.setScalar(0.42);
      sad.push(m);
      g.add(m);
    }
    const wHappy = makeWord('快乐', { size: 0.8, face: 0xffc94a, side: 0xd8462e, depth: 0.3 });
    const wOut = makeWord('淘汰', { size: 0.7, face: 0x9aa0aa, side: 0x4a4e56, depth: 0.3 });
    g.add(wHappy.group, wOut.group);
    const whale = new Actor('whale', 1.45);
    const claude = new Actor('claude', 1.45);
    g.add(whale.root, claude.root);
    const ln = LINES[7];
    return {
      group: g,
      update(t, lt) {
        S.light({ bg: 0xfbe5dc, sky: 0xffffff, ground: 0xd8a89a, hemi: 1.4, sun: 1.5, sunColor: 0xfff2e6, sunPos: [3, 9, 7] });
        const arc = (src: THREE.Vector3, dst: THREE.Vector3, u: number, h: number) => {
          const p = v3(src, dst, u);
          p.y += Math.sin(u * Math.PI) * h;
          return p;
        };
        happy.forEach((m, i) => {
          const t0 = ln.chars[0] + (i / 14) * (ln.chars[6] - ln.chars[0]) + 0.1;
          const u = clamp((t - t0) / 0.5);
          const dst = new THREE.Vector3(-2.4 + (rnd(i, 1) - 0.5) * 0.9, 0.25 + Math.floor(i / 3) * 0.28, (rnd(i, 2) - 0.5) * 0.7);
          const src = new THREE.Vector3(-0.6, 1.0, 0.3);
          m.position.copy(arc(src, dst, easeInOut(u), 1.8));
          m.rotation.set(u * 5 + i, u * 3, u * 2 + i * 0.7);
          m.visible = t > t0;
        });
        sad.forEach((m, i) => {
          const t0 = ln.chars[7] + (i / 12) * (ln.chars[13] - ln.chars[7]);
          const u = clamp((t - t0) / 0.5);
          const dst = new THREE.Vector3(2.6 + (rnd(i, 3) - 0.5) * 0.5, 0.2, (rnd(i, 4) - 0.5) * 0.4);
          const src = new THREE.Vector3(1.0, 1.1, 0.3);
          m.position.copy(arc(src, dst, easeInOut(u), 1.6));
          m.rotation.set(u * 6, u * 4 + i, 0);
          m.visible = t > t0 && u < 1;
        });
        const hs = t - ln.chars[1];
        wHappy.group.position.set(-2.4, 3.2 + Math.sin(t * 3) * 0.08, 0);
        wHappy.group.scale.setScalar(Math.max(0.001, pop(hs)));
        wHappy.group.visible = hs > 0;
        const os = t - ln.chars[13];
        const ou = clamp(os / 0.6);
        wOut.group.position.set(2.6, lerp(3, 0.2, ou * ou), 0);
        wOut.group.scale.setScalar(Math.max(0.001, lerp(1, 0.2, ou)));
        wOut.group.rotation.z = ou * 0.6;
        wOut.group.visible = os > 0 && ou < 1;
        whale.act('hop', lt).at(-0.8, 0, 0.4);
        claude.act(t > ln.chars[7] ? 'nod' : 'idle', t - ln.chars[7]).at(1.0, 0, 0.4);
        claude.flip = true;
        S.cam([Math.sin(lt * 0.4) * 0.5, 2.0, 7.2], [0, 1.3, 0], 42);
        whale.face(S.camera);
        claude.face(S.camera);
      },
    };
  },
};

export const SHOTS_A = [s1, s2, s3, s4, s5, s6, s7, s8];
