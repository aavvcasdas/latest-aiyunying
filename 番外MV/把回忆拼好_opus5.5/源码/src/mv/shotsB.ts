import * as THREE from 'three';
import type { ShotDef } from './stage';
import { LINES, TITLE, TITLE_CHARS } from './timing';
import { Actor, Thing, clamp, lerp, easeInOut, easeOut, easeIn, pop, ramp, rnd, smooth, skyDome, glowSprite, pieceGeo, pieceShape, std, puzzleField } from './kit';
import { ground, stars, windowTex, tile, PASTEL, pastel } from './common';
import { makeWord, glyphGeo } from './glyphs';

const C = (n: number, k: number) => LINES[n].chars[k];
const v3 = (a: THREE.Vector3, b: THREE.Vector3, u: number) => new THREE.Vector3().lerpVectors(a, b, u);

/** 夜城：几排亮着窗的楼 */
function city(g: THREE.Group) {
  const texs = [0, 1, 2, 3].map((s) => windowTex(s));
  [-9, -15, -22].forEach((z, row) => {
    for (let i = 0; i < 18; i++) {
      const w = 1.6 + rnd(i, row) * 1.6;
      const h = 3 + rnd(i, row + 5) * (5 + row * 3);
      const tex = texs[(i + row) % 4].clone();
      tex.needsUpdate = true;
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(w / 2, h / 4);
      const shade = 1 - row * 0.22;
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 1.5), [
        std(0x2a2f5c), std(0x2a2f5c), std(0x232850), std(0x232850),
        new THREE.MeshBasicMaterial({ map: tex, color: new THREE.Color(shade, shade, shade) }), std(0x232850),
      ]);
      m.position.set((i - 9) * 2.6 + rnd(i, row + 9) * 1.2 + row * 1.1, h / 2, z);
      g.add(m);
    }
  });
  g.add(ground(0x2c3060));
  g.add(stars(500));
  g.add(skyDome([[0, '#0e1236'], [0.42, '#2a2f6a'], [0.5, '#5a4f8c'], [1, '#1a1d40']]));
}

// ───────────── 9 你对我说的情话 ─────────────
// 夜城的街角，小克开口，粉色的立体字「喜欢你」一个个从她身边升起来，飘到两人头顶。
const s9: ShotDef = {
  id: 'S09',
  name: '夜城里的情话',
  build(S) {
    const g = new THREE.Group();
    city(g);
    const moon = new THREE.Mesh(new THREE.CircleGeometry(1.6, 32), new THREE.MeshBasicMaterial({ color: 0xfff3c4, fog: false }));
    moon.position.set(9, 14, -40);
    const mg = glowSprite('rgba(255,240,200,1)', 10, 0.6);
    mg.position.set(9, 14, -39);
    g.add(moon, mg);
    const word = makeWord('喜欢你', { size: 0.62, face: 0xffb3c9, side: 0xc23a5e, depth: 0.25, emissive: 0x6a1a30 });
    g.add(word.group);
    const whale = new Actor('whale', 1.5);
    const claude = new Actor('claude', 1.5);
    g.add(whale.root, claude.root);
    const hearts = [0, 1, 2].map(() => new Thing('fx_heart', 0.3));
    hearts.forEach((h) => g.add(h.mesh));
    const lamp = new THREE.PointLight(0xffd59a, 6, 8);
    lamp.position.set(0, 3, 1.5);
    g.add(lamp);
    return {
      group: g,
      update(t, lt) {
        S.light({ bg: 0x1a1d40, sky: 0x8a90d0, ground: 0x2a2440, hemi: 0.9, sun: 0.7, sunColor: 0xc8c8ff, sunPos: [6, 10, 6], fog: [0x252a5a, 14, 50] });
        whale.act(t > C(8, 5) ? 'surprise' : 'idle', t - C(8, 5)).at(-0.7, 0, 0);
        claude.flip = true;
        claude.act(t > C(8, 1) ? 'tilt' : 'idle', t - C(8, 1)).at(0.7, 0, 0);
        const z = lerp(5.5, 4.3, smooth(lt / 3.2));
        S.cam([0.2, 1.4, z], [0, 1.4, 0], 42);
        whale.face(S.camera);
        claude.face(S.camera);
        const ks = [1, 3, 5];
        word.holders.forEach((h, i) => {
          const s = t - C(8, ks[i]);
          const u = easeOut(clamp(s / 0.8));
          h.position.y = lerp(0, 0.8, u) + Math.sin(t * 2 + i) * 0.05;
          h.position.x = (i - 1) * 0.68 * u + lerp(0.7, 0, u);
          h.scale.setScalar(0.62 * Math.max(0.001, pop(s)));
          h.rotation.y = Math.sin(t * 2 + i) * 0.2;
          h.visible = s > 0;
        });
        word.group.position.set(0, 1.9, 0.2);
        hearts.forEach((h, i) => {
          const s = t - C(8, 6) - i * 0.2;
          h.mesh.visible = s > 0;
          h.mesh.position.set((i - 1) * 0.5, 1.5 + s * 0.6, 0.3);
          h.mesh.scale.setScalar(pop(s) * 0.3);
          h.mesh.lookAt(S.camera.position);
        });
      },
    };
  },
};

/** 一组拼图烟花：InstancedMesh，粒子是小拼图块 */
function fireworks(nBurst: number, per: number) {
  const mesh = new THREE.InstancedMesh(pieceGeo(1, 1, -1, -1, 0.2, 1), new THREE.MeshBasicMaterial({ color: 0xffffff }), nBurst * per);
  const dirs: THREE.Vector3[] = [];
  for (let b = 0; b < nBurst; b++) {
    const base = PASTEL[b % PASTEL.length].clone().offsetHSL(0, 0.3, 0.05);
    for (let i = 0; i < per; i++) {
      const th = rnd(i, b) * Math.PI * 2;
      const ph = Math.acos(2 * rnd(i, b + 50) - 1);
      dirs.push(new THREE.Vector3(Math.sin(ph) * Math.cos(th), Math.cos(ph), Math.sin(ph) * Math.sin(th)));
      mesh.setColorAt(b * per + i, i % 5 === 0 ? new THREE.Color(0xfff6d0) : base);
    }
  }
  mesh.instanceColor!.needsUpdate = true;
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  /** s = 炸开后的秒数；warp 把时间换成「画面时间」 */
  const set = (b: number, center: THREE.Vector3, s: number, speed = 5, scale = 0.16, warp = (x: number) => x) => {
    for (let i = 0; i < per; i++) {
      const idx = b * per + i;
      const tau = warp(Math.max(0, s));
      if (s <= 0) {
        m.makeScale(0, 0, 0);
        mesh.setMatrixAt(idx, m);
        continue;
      }
      const d = dirs[idx];
      const r = speed * (1 - Math.exp(-tau * 2.2)) * (0.75 + rnd(i, 3) * 0.3);
      const p = new THREE.Vector3(center.x + d.x * r, center.y + d.y * r - 0.9 * tau * tau, center.z + d.z * r);
      e.set(tau * 4 + i, tau * 3, i);
      q.setFromEuler(e);
      const life = clamp(1 - (tau - 1.0) / 1.0);
      m.compose(p, q, new THREE.Vector3(1, 1, 1).multiplyScalar(scale * life));
      mesh.setMatrixAt(idx, m);
    }
    mesh.instanceMatrix.needsUpdate = true;
  };
  return { mesh, set, dirs };
}

// ───────────── 10 像转瞬即逝的烟花 ─────────────
// 每唱一个字，夜空里炸开一朵由小拼图块组成的烟花；「烟花」二字在空中亮一下就散。
const s10: ShotDef = {
  id: 'S10',
  name: '拼图烟花',
  build(S) {
    const g = new THREE.Group();
    city(g);
    const ln = LINES[9];
    const FW = fireworks(ln.chars.length, 70);
    g.add(FW.mesh);
    const centers = ln.chars.map((_, k) => new THREE.Vector3((rnd(k, 11) - 0.5) * 14, 8 + rnd(k, 12) * 4, -8 - rnd(k, 13) * 4));
    const glows = centers.map((c, k) => {
      const s = glowSprite(`hsl(${Math.floor(rnd(k, 14) * 360)},90%,75%)`, 6, 0);
      s.position.copy(c);
      g.add(s);
      return s;
    });
    const word = makeWord('烟花', { size: 2.2, face: 0xfff2a8, side: 0xff5c8a, depth: 0.3, emissive: 0x884422 });
    word.group.position.set(0, 9, -6);
    g.add(word.group);
    const whale = new Actor('whale', 1.3);
    const claude = new Actor('claude', 1.3);
    g.add(whale.root, claude.root);
    return {
      group: g,
      update(t, lt) {
        let fl = 0;
        ln.chars.forEach((c, k) => {
          const s = t - c;
          FW.set(k, centers[k], s, 3.2 + rnd(k) * 1.5);
          glows[k].material.opacity = s > 0 ? Math.exp(-s * 3) : 0;
          if (s > 0) fl = Math.max(fl, Math.exp(-s * 4));
        });
        S.light({ bg: 0x1a1d40, sky: 0x9a90d8, ground: 0x2a2440, hemi: 0.8 + fl * 0.6, sun: 0.6, sunColor: 0xd8c8ff, sunPos: [0, 10, -5], fog: [0x252a5a, 18, 60] });
        whale.act('idle', lt).at(-0.45, 0, 0);
        claude.act('idle', lt + 0.3).at(0.45, 0, 0);
        const up = smooth(lt / 4);
        S.cam([0, lerp(1.3, 1.0, up), lerp(7, 8, up)], [0, lerp(2.4, 3.4, up), -4], 52);
        whale.face(S.camera);
        claude.face(S.camera);
        const ws = t - C(9, 6);
        word.group.visible = ws > 0 && ws < 1.6;
        word.holders.forEach((h, i) => {
          const p = pop(ws - i * 0.15, 0.5);
          const fade = clamp(1 - (ws - 0.9) / 0.6);
          h.scale.setScalar(2.2 * Math.max(0.001, p * fade));
          h.rotation.y = (1 - p) * 2;
        });
      },
    };
  },
};

// ───────────── 11 只停在绽放一刹那 ─────────────
// 一朵最大的烟花在「绽放」时炸开，随即几乎静止——子弹时间，镜头绕着悬停的拼图花转；「刹那」时一下碎落。
const s11: ShotDef = {
  id: 'S11',
  name: '停住的一刹那',
  build(S) {
    const g = new THREE.Group();
    city(g);
    const FW = fireworks(3, 150);
    g.add(FW.mesh);
    const center = new THREE.Vector3(0, 7, -5);
    const core = glowSprite('rgba(255,210,230,1)', 9, 0);
    core.position.copy(center);
    g.add(core);
    const whale = new Actor('whale', 1.3);
    const claude = new Actor('claude', 1.3);
    g.add(whale.root, claude.root);
    return {
      group: g,
      update(t, lt) {
        const bloom = C(10, 3);
        const brk = C(10, 6);
        const s = t - bloom;
        // 时间扭曲：炸开 0.28 秒后几乎冻结，「刹那」后恢复并下坠
        const warp = (x: number) => {
          const real = x + bloom;
          if (real < bloom + 0.28) return x;
          if (real < brk) return 0.28 + (real - bloom - 0.28) * 0.05;
          const frozen = 0.28 + (brk - bloom - 0.28) * 0.05;
          return frozen + (real - brk) * 1.6;
        };
        FW.set(0, center, s, 4.2, 0.2, warp);
        FW.set(1, center, s - 0.04, 2.8, 0.17, warp);
        FW.set(2, center, s - 0.08, 1.5, 0.14, warp);
        core.material.opacity = s > 0 ? (t < brk ? 0.5 + 0.2 * Math.sin(t * 6) : Math.exp(-(t - brk) * 3) * 0.6) : 0;
        S.light({ bg: 0x1a1d40, sky: 0xb0a0e0, ground: 0x2a2440, hemi: 1.0, sun: 0.6, sunPos: [0, 10, -5], fog: [0x252a5a, 18, 60] });
        whale.act('idle', lt).at(-0.45, 0, 0);
        claude.act('idle', lt).at(0.45, 0, 0);
        // 冻结时镜头绕花转
        const orbit = t < bloom ? 0 : t < brk ? (t - bloom) * 0.45 : (brk - bloom) * 0.45 + (t - brk) * 0.1;
        const r = 9.5;
        S.cam([Math.sin(orbit) * r, lerp(1.4, 3.0, smooth(ramp(t, bloom, brk))), -5 + Math.cos(orbit) * r + 5], [0, lerp(2.4, 4.0, smooth(ramp(t, bloom - 0.5, bloom + 0.3))), -4], 54);
        whale.face(S.camera);
        claude.face(S.camera);
      },
    };
  },
};

// ───────────── 12 我却已无法自拔 ─────────────
// 粉色的梦，彩色拼图围成一颗心；脚下的花瓣拼图越堆越高，她一点点陷进去，出不来了。
const s12: ShotDef = {
  id: 'S12',
  name: '陷进拼图堆',
  build(S) {
    const g = new THREE.Group();
    g.add(skyDome([[0, '#5b3d78'], [0.45, '#c86a9a'], [0.55, '#e89ab4'], [1, '#7a4a8a']]));
    const bokeh = Array.from({ length: 26 }, (_, i) => {
      const s = glowSprite(i % 2 ? 'rgba(255,200,220,1)' : 'rgba(255,240,200,1)', 1 + rnd(i, 2) * 2.5, 0.25 + rnd(i, 3) * 0.3);
      g.add(s);
      return s;
    });
    const HN = 44;
    const heart = new THREE.InstancedMesh(pieceGeo(1, 1, -1, -1, 0.2, 1), std(0xffffff, { emissive: 0x442233 }), HN);
    for (let i = 0; i < HN; i++) heart.setColorAt(i, pastel(i * 3));
    heart.instanceColor!.needsUpdate = true;
    g.add(heart);
    const PN = 420;
    const pile = new THREE.InstancedMesh(pieceGeo(1, 1, -1, -1, 0.2, 1), std(0xffffff), PN);
    for (let i = 0; i < PN; i++) pile.setColorAt(i, pastel(i).clone().lerp(new THREE.Color(0xffc0d0), 0.3));
    pile.instanceColor!.needsUpdate = true;
    g.add(pile);
    const whale = new Actor('whale', 1.5);
    g.add(whale.root);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    return {
      group: g,
      update(t, lt) {
        S.light({ bg: 0xc86a9a, sky: 0xffe0ee, ground: 0x8a4a7a, hemi: 1.5, sun: 1.2, sunColor: 0xffd8e8, sunPos: [2, 8, 8], fog: [0xd88aaa, 12, 40] });
        bokeh.forEach((b, i) => b.position.set((rnd(i) - 0.5) * 16, 0.5 + rnd(i, 4) * 6 + Math.sin(t * 0.6 + i) * 0.3, -4 - rnd(i, 5) * 6));
        // 心形
        const hu = clamp((t - C(11, 0)) / (C(11, 3) - C(11, 0)));
        for (let i = 0; i < HN; i++) {
          const a = (i / HN) * Math.PI * 2;
          const x = 16 * Math.pow(Math.sin(a), 3);
          const y = 13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a);
          const on = clamp(hu * HN - i);
          q.setFromEuler(new THREE.Euler(0, 0, t + i));
          m.compose(new THREE.Vector3(x * 0.12, 1.7 + y * 0.12 + (1 - on) * 3, -0.6), q, new THREE.Vector3(1, 1, 1).multiplyScalar(0.3 * on));
          heart.setMatrixAt(i, m);
        }
        heart.instanceMatrix.needsUpdate = true;
        // 拼图堆升高
        const pu = easeInOut(clamp((t - C(11, 3)) / (C(11, 6) + 0.6 - C(11, 3))));
        const H = 1.25 * pu;
        for (let i = 0; i < PN; i++) {
          const rr = Math.sqrt(rnd(i, 1)) * 2.4;
          const th = rnd(i, 2) * Math.PI * 2;
          const hh = Math.max(0, H * (1 - rr / 2.4)) * rnd(i, 3);
          const shown = rnd(i, 4) < 0.15 + pu * 0.85;
          const drop = clamp(pu * 3 - rnd(i, 5) * 2);
          q.setFromEuler(new THREE.Euler(rnd(i, 6) * 6, rnd(i, 7) * 6, 0));
          m.compose(new THREE.Vector3(Math.cos(th) * rr, hh + (1 - drop) * 4, Math.sin(th) * rr * 0.8 + 0.2), q, new THREE.Vector3(1, 1, 1).multiplyScalar(shown ? 0.32 : 0));
          pile.setMatrixAt(i, m);
        }
        pile.instanceMatrix.needsUpdate = true;
        whale.act(pu > 0.3 ? 'surprise' : 'sway', pu > 0.3 ? t - C(11, 4) : lt).at(0, -H * 0.3, 0.9);
        const z = lerp(7, 5, smooth(lt / 4.3));
        S.cam([0, 2.2, z], [0, 1.2, 0], 42);
        whale.face(S.camera);
      },
    };
  },
};

// ───────────── 13 我们的爱总有时差 ─────────────
// 世界被一道拼图缝劈开：左边白天的小克，右边深夜的本鲸；一条消息拼图慢慢飘过去，到「时差」才落到她手边。
const s13: ShotDef = {
  id: 'S13',
  name: '白天与黑夜的时差',
  build(S) {
    const g = new THREE.Group();
    const day = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), new THREE.MeshBasicMaterial({ color: 0x9fd4f5 }));
    day.position.set(-10, 6, -6);
    const dayG = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), std(0x8cc56a, { roughness: 1 }));
    dayG.rotation.x = -Math.PI / 2;
    dayG.position.set(-10, 0, 0);
    // 夜：一整块有凸起的巨大拼图
    const nightShape = pieceShape(0, 0, 0, 1, 12);
    const night = new THREE.Mesh(new THREE.ShapeGeometry(nightShape, 16), new THREE.MeshBasicMaterial({ color: 0x1c2250 }));
    night.position.set(6, 5, -5.9);
    const nightG = new THREE.Mesh(new THREE.ShapeGeometry(pieceShape(0, 0, 0, 1, 12), 16), std(0x2a3a5a, { roughness: 1 }));
    nightG.rotation.x = -Math.PI / 2;
    nightG.position.set(6, 0.01, 0);
    g.add(day, dayG, night, nightG);
    const sun = new THREE.Mesh(new THREE.CircleGeometry(0.8, 32), new THREE.MeshBasicMaterial({ color: 0xffe27a }));
    sun.position.set(-4.5, 6, -5.8);
    const moon = new THREE.Mesh(new THREE.CircleGeometry(0.6, 32), new THREE.MeshBasicMaterial({ color: 0xfff3c4 }));
    moon.position.set(4.5, 6, -5.8);
    const moonCut = new THREE.Mesh(new THREE.CircleGeometry(0.55, 32), new THREE.MeshBasicMaterial({ color: 0x1c2250 }));
    moonCut.position.set(4.75, 6.15, -5.78);
    g.add(sun, moon, moonCut);
    for (let i = 0; i < 30; i++) {
      const st = new THREE.Mesh(new THREE.CircleGeometry(0.04 + rnd(i) * 0.04, 6), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      st.position.set(0.8 + rnd(i, 1) * 9, 2.5 + rnd(i, 2) * 7, -5.85);
      g.add(st);
    }
    const whale = new Actor('whale', 1.5);
    const claude = new Actor('claude', 1.5);
    g.add(whale.root, claude.root);
    const phoneA = new Thing('prop_phone', 0.35);
    const phoneB = new Thing('prop_phone', 0.35);
    g.add(phoneA.mesh, phoneB.mesh);
    const msg = new THREE.Group();
    const msgTile = new THREE.Mesh(pieceGeo(1, 1, -1, -1, 0.2, 1), std(0xffb3c7, { emissive: 0x552233 }));
    msgTile.scale.setScalar(0.42);
    const msgHeart = new Thing('fx_heart', 0.26);
    msgHeart.mesh.position.set(0, -0.13, 0.08);
    msg.add(msgTile, msgHeart.mesh);
    g.add(msg);
    const word = makeWord('时差', { size: 0.9, face: 0xffe27a, side: 0x2d3a6e, depth: 0.3 });
    g.add(word.group);
    return {
      group: g,
      update(t, lt) {
        S.light({ bg: 0x9fd4f5, sky: 0xffffff, ground: 0x556070, hemi: 1.3, sun: 1.2, sunPos: [-4, 8, 6] });
        claude.act('idle', lt).at(-2.8, 0, 0);
        const arrive = C(12, 7);
        const sa = t - arrive;
        whale.flip = true;
        if (sa > 0) whale.act('surprise', sa);
        else whale.act('idle', lt);
        whale.at(2.8, 0, 0);
        phoneA.mesh.position.set(-2.45, 0.75, 0.15);
        phoneB.mesh.position.set(2.45, 0.75, 0.15);
        const u = easeInOut(clamp((t - C(12, 0)) / (arrive - C(12, 0))));
        const a = new THREE.Vector3(-2.4, 1.2, 0.3), b = new THREE.Vector3(2.4, 1.2, 0.3);
        const p = v3(a, b, u);
        p.y += Math.sin(u * Math.PI) * 1.8;
        msg.position.copy(p);
        msg.rotation.z = Math.sin(t * 3) * 0.2;
        msg.visible = t > C(12, 0) && sa < 0.3;
        msg.scale.setScalar(sa > 0 ? 1 - sa / 0.3 : 1);
        const ws = t - C(12, 6);
        word.group.position.set(0, 3.6, 0);
        word.group.visible = ws > 0;
        word.holders.forEach((h, i) => {
          h.scale.setScalar(0.9 * Math.max(0.001, pop(ws - i * 0.12)));
          h.rotation.y = i === 0 ? -0.3 : 0.3;
        });
        S.cam([0, 2.2, lerp(9, 8.2, smooth(lt / 3.4))], [0, 2.2, 0], 44);
        whale.face(S.camera);
        claude.face(S.camera);
      },
    };
  },
};

// ───────────── 14 也为你骗自己放下 ─────────────
// 两块拼图在暮色里慢慢漂开；她背过身去（转身、低头），「放下」时手边那颗心掉进深处。
const s14: ShotDef = {
  id: 'S14',
  name: '漂开的两块拼图',
  build(S) {
    const g = new THREE.Group();
    g.add(skyDome([[0, '#3d3a6e'], [0.45, '#a07aa8'], [0.52, '#f0b49a'], [0.6, '#8a6aa0'], [1, '#2a2850']]));
    const A = tile(0x6aa8e8, 2.6, [0, 1, 0, 0]);
    const B = tile(0xffa65c, 2.6, [0, 0, 0, -1]);
    g.add(A, B);
    const whale = new Actor('whale', 1.4);
    const claude = new Actor('claude', 1.4);
    g.add(whale.root, claude.root);
    const heart = new Thing('fx_heart', 0.4);
    g.add(heart.mesh);
    const motes = Array.from({ length: 16 }, (_, i) => {
      const s = glowSprite('rgba(255,220,200,1)', 0.4 + rnd(i) * 0.6, 0.5);
      g.add(s);
      return s;
    });
    return {
      group: g,
      update(t, lt) {
        S.light({ bg: 0xa07aa8, sky: 0xffe0d8, ground: 0x4a3a6a, hemi: 1.2, sun: 1.0, sunColor: 0xffd0b0, sunPos: [0, 4, -10], fog: [0xb08ab0, 14, 50] });
        const apart = easeInOut(clamp((t - C(13, 0)) / (C(13, 5) - C(13, 0))));
        const ax = lerp(-1.3, -4.2, apart), bx = lerp(1.3, 4.2, apart);
        const bob = (s: number) => Math.sin(t * 1.4 + s) * 0.12;
        A.position.set(ax, bob(0), 0);
        A.rotation.z = Math.sin(t) * 0.03;
        B.position.set(bx, bob(1.5), -apart * 1.5);
        whale.flip = t > C(13, 3);
        whale.act(t > C(13, 3) ? 'sad' : 'idle', t > C(13, 3) ? t - C(13, 3) : lt).at(ax + 0.2, bob(0) + 0.15, 0);
        claude.flip = true;
        claude.act('idle', lt).at(bx - 0.2, bob(1.5) + 0.15, -apart * 1.5);
        const hs = t - C(13, 6);
        const hu = Math.max(0, hs);
        heart.mesh.position.set(ax + 0.65, bob(0) + 0.9 - hu * hu * 3.5, 0.2);
        heart.mesh.rotation.z = hu * 2;
        heart.mesh.visible = hs < 1.2;
        motes.forEach((m, i) => m.position.set((rnd(i, 1) - 0.5) * 14, -1 + ((t * 0.4 + rnd(i, 2) * 6) % 6), -2 - rnd(i, 3) * 4));
        const push = smooth(ramp(t, C(13, 2), C(13, 7)));
        S.cam([lerp(0, -2.4, push), lerp(2.0, 1.4, push), lerp(8.5, 4.5, push)], [lerp(0, -3.6, push), 1.0, 0], 42);
        whale.face(S.camera);
        claude.face(S.camera);
        heart.mesh.lookAt(S.camera.position);
      },
    };
  },
};

// ───────────── 15 爱炙热的你 ─────────────
// 晚霞烧得通红，火星一样的光点往上飘；大号的本鲸占满画面，身后一颗发烫的心，「炙热」二字从下面升起。
const s15: ShotDef = {
  id: 'S15',
  name: '炙热',
  build(S) {
    const g = new THREE.Group();
    g.add(skyDome([[0, '#7a2a4a'], [0.4, '#e8603a'], [0.5, '#ffb35c'], [0.56, '#d84a3a'], [1, '#4a1a2a']]));
    const sunHeart = new Thing('fx_heart', 4.5);
    sunHeart.mesh.position.set(0, -0.5, -6);
    g.add(sunHeart.mesh);
    const halo = glowSprite('rgba(255,170,90,1)', 12, 0.8);
    halo.position.set(0, 1.8, -6.5);
    g.add(halo);
    const EN = 140;
    const embers = new THREE.InstancedMesh(pieceGeo(1, 1, -1, -1, 0.2, 1), new THREE.MeshBasicMaterial({ color: 0xffffff }), EN);
    for (let i = 0; i < EN; i++) embers.setColorAt(i, new THREE.Color().setHSL(0.03 + rnd(i) * 0.08, 1, 0.6 + rnd(i, 2) * 0.2));
    embers.instanceColor!.needsUpdate = true;
    g.add(embers);
    const plat = tile(0x6aa8e8, 3, [0, 0, 0, 0]);
    g.add(plat);
    const whale = new Actor('whale', 1.25);
    g.add(whale.root);
    const word = makeWord('炙热', { size: 1.1, face: 0xfff2a8, side: 0xff5a2a, depth: 0.35, emissive: 0x883311 });
    g.add(word.group);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    return {
      group: g,
      update(t, lt) {
        S.light({ bg: 0xe8603a, sky: 0xffd0a0, ground: 0x7a2a3a, hemi: 1.4, sun: 1.6, sunColor: 0xffb070, sunPos: [0, 3, -8], exposure: 1.05 });
        for (let i = 0; i < EN; i++) {
          const life = (t * (0.3 + rnd(i, 3) * 0.3) + rnd(i, 4)) % 1;
          q.setFromEuler(new THREE.Euler(t * 2 + i, t + i, 0));
          m.compose(
            new THREE.Vector3((rnd(i, 5) - 0.5) * 12 + Math.sin(t + i) * 0.3, -1 + life * 8, -1 - rnd(i, 6) * 6),
            q,
            new THREE.Vector3(1, 1, 1).multiplyScalar(0.12 * Math.sin(life * Math.PI)),
          );
          embers.setMatrixAt(i, m);
        }
        embers.instanceMatrix.needsUpdate = true;
        const beat = Math.exp(-((t - C(14, 1)) % 0.43) * 6);
        sunHeart.mesh.scale.setScalar(1 + 0.04 * beat);
        sunHeart.setFrame('fx_heart');
        sunHeart.mesh.scale.multiplyScalar(1);
        halo.material.opacity = 0.6 + 0.3 * beat;
        whale.set(Math.floor(t * 2.2) % 7 === 0 ? 'whale_big_blink' : t > C(14, 4) ? 'whale_big_wave' : 'whale_big_idle').at(0, 0.15, 0);
        const ws = t - C(14, 1);
        word.group.visible = ws > 0;
        word.group.position.set(0, lerp(-1, 2.35, easeOut(clamp(ws / 0.7))), 0.6);
        word.holders.forEach((h, i) => (h.rotation.y = (1 - pop(ws - i * 0.14, 0.6)) * 2 + Math.sin(t * 2 + i) * 0.1));
        const z = lerp(5.2, 4.2, smooth(lt / 3));
        S.cam([0, 1.5, z], [0, 1.5, 0], 44);
        whale.face(S.camera);
      },
    };
  },
};

/** 心形路径（中心在原点，宽约 1） */
function heartPath(s: number) {
  const p = new THREE.Shape();
  p.moveTo(0, -0.42 * s);
  p.bezierCurveTo(-0.15 * s, -0.25 * s, -0.5 * s, -0.05 * s, -0.5 * s, 0.17 * s);
  p.bezierCurveTo(-0.5 * s, 0.4 * s, -0.2 * s, 0.48 * s, 0, 0.27 * s);
  p.bezierCurveTo(0.2 * s, 0.48 * s, 0.5 * s, 0.4 * s, 0.5 * s, 0.17 * s);
  p.bezierCurveTo(0.5 * s, -0.05 * s, 0.15 * s, -0.25 * s, 0, -0.42 * s);
  return p;
}

// ───────────── 16 却忘了爱自己 ─────────────
// 她脚下的蓝拼图缺了一个心形的口；「爱自己」时那颗心从她胸口浮出来，自己落回缺口，整块亮起来。
const s16: ShotDef = {
  id: 'S16',
  name: '补上自己的那颗心',
  build(S) {
    const g = new THREE.Group();
    g.add(skyDome([[0, '#2a2a5a'], [0.45, '#8a7ab8'], [0.52, '#f2c0a8'], [1, '#3a3060']]));
    const shape = pieceShape(0, 0, 0, 0, 3.2);
    const hole = heartPath(1.1);
    // 洞放在拼图前半
    const holePts = hole.getPoints(12).map((p) => new THREE.Vector2(p.x, p.y - 0.7));
    shape.holes.push(new THREE.Path(holePts));
    const plat = new THREE.Mesh(
      new THREE.ExtrudeGeometry(shape, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.05, bevelSegments: 2, curveSegments: 8 }),
      std(0x6aa8e8, { roughness: 0.55 }),
    );
    plat.geometry.translate(0, 0, -0.3);
    plat.rotation.x = -Math.PI / 2;
    g.add(plat);
    const heart = new THREE.Mesh(
      new THREE.ExtrudeGeometry(heartPath(1.06), { depth: 0.3, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.03, bevelSegments: 2 }),
      std(0xff6f91, { emissive: 0xff3366, emissiveIntensity: 0.4 }),
    );
    heart.geometry.translate(0, 0, -0.15);
    g.add(heart);
    const glow = glowSprite('rgba(255,150,190,1)', 6, 0);
    g.add(glow);
    const whale = new Actor('whale', 1.45);
    const claude = new Actor('claude', 1.3);
    g.add(whale.root, claude.root);
    const sparkle = new Thing('fx_sparkle_0', 0.5);
    g.add(sparkle.mesh);
    return {
      group: g,
      update(t, lt) {
        const k3 = C(15, 3), k5 = C(15, 5);
        const fit = clamp((t - k5) / 0.25);
        const lit = easeOut(clamp((t - k5) / 0.6));
        S.light({ bg: 0x8a7ab8, sky: lerp(0, 1, lit) > 0.5 ? 0xffe8f0 : 0xc8c8e8, ground: 0x3a3060, hemi: lerp(0.9, 1.5, lit), sun: lerp(0.7, 1.6, lit), sunColor: 0xffd8c8, sunPos: [2, 8, 6], fog: [0x8a7ab8, 12, 40] });
        whale.act(fit > 0 ? 'hop' : t > k3 ? 'surprise' : 'sad', fit > 0 ? t - k5 : t > k3 ? t - k3 : lt).at(0, 0.1, -0.8);
        // 心：胸口浮出 → 翻转 → 落进缺口
        const out = easeOut(ramp(t, k3 - 0.1, C(15, 4)));
        const down = easeIn(ramp(t, C(15, 4) + 0.1, k5));
        const chest = new THREE.Vector3(0, 1.0, -0.6);
        const air = new THREE.Vector3(0, 2.3, 0.2);
        const slot = new THREE.Vector3(0, 0.0, 0.7);
        const p = t < C(15, 4) + 0.1 ? v3(chest, air, out) : v3(air, slot, down);
        heart.position.copy(p);
        heart.rotation.set(lerp(0, -Math.PI / 2, down), (1 - down) * t * 2, 0);
        heart.scale.setScalar(Math.max(0.001, out));
        heart.visible = t > k3 - 0.1;
        (plat.material as THREE.MeshStandardMaterial).emissive.setRGB(0.15 * lit, 0.25 * lit, 0.5 * lit);
        glow.position.set(0, 0.6, 0.7);
        glow.material.opacity = fit > 0 ? Math.exp(-(t - k5) * 2) * 0.9 + 0.2 : 0;
        sparkle.mesh.visible = fit > 0;
        sparkle.setFrame('fx_sparkle_' + (Math.floor(t * 8) % 3));
        sparkle.mesh.position.set(0.7, 1.5, -0.6);
        // 小克远远走来，看着
        const walk = clamp((t - LINES[15].start) / 1.6);
        claude.flip = true;
        if (walk < 1) claude.set('walk_claude_' + (Math.floor(t * 10) % 8));
        else claude.act('nod', t - LINES[15].start - 1.6);
        claude.at(lerp(6, 2.6, walk), 0, -1.6);
        const ang = lerp(0, 0.3, smooth(lt / 3));
        const hi = smooth(ramp(t, LINES[15].start, k3));
        S.cam([Math.sin(ang) * 6, lerp(4.8, 2.2, hi), Math.cos(ang) * 6], [0, lerp(0.2, 1.0, hi), 0], 42);
        whale.face(S.camera);
        claude.face(S.camera);
        sparkle.mesh.lookAt(S.camera.position);
      },
    };
  },
};

// ───────────── 17 把回忆拼好给你（片尾） ─────────────
// 前面所有镜头里的拼图从四面八方飞回，拼成一整面暖色的墙；歌名一个字一块拼图落定，两人一起挥手。
const s17: ShotDef = {
  id: 'S17',
  name: '把回忆拼好给你',
  build(S) {
    const g = new THREE.Group();
    g.add(skyDome([[0, '#8ac0e8'], [0.45, '#ffe0c0'], [0.55, '#ffd0a0'], [1, '#a8d880']]));
    g.add(ground(0x9fd27e));
    const cols = 20, rows = 10, size = 1.3;
    const wall = puzzleField(cols, rows, size, (i, j) => pastel(i * 31 + j * 7).clone().lerp(new THREE.Color(0xfff2e0), 0.25));
    wall.position.set(0, 6.2, -6);
    g.add(wall);
    const base: THREE.Vector3[] = [];
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) base.push(new THREE.Vector3((i - (cols - 1) / 2) * size, (j - (rows - 1) / 2) * size, 0));
    const title = new THREE.Group();
    const chars = [...TITLE];
    const tiles = chars.map((ch, i) => {
      const h = new THREE.Group();
      const tl = new THREE.Mesh(pieceGeo(1, 1, -1, -1, 0.2, 1), std(i % 2 ? 0xfff6e6 : 0xffe1a8));
      const gl = new THREE.Mesh(glyphGeo(ch, 0.22), [std(0xc8463a), std(0x7a2a22)]);
      gl.scale.setScalar(0.76);
      gl.position.z = 0.2;
      h.add(tl, gl);
      h.position.x = (i - (chars.length - 1) / 2) * 1.08;
      title.add(h);
      return h;
    });
    title.position.set(0, 4.2, -1);
    title.scale.setScalar(0.9);
    g.add(title);
    const whale = new Actor('whale', 1.5);
    const claude = new Actor('claude', 1.5);
    g.add(whale.root, claude.root);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    return {
      group: g,
      update(t, lt) {
        S.light({ bg: 0xffe0c0, sky: 0xffffff, ground: 0x8ab06a, hemi: 1.5, sun: 1.6, sunColor: 0xfff0d8, sunPos: [-3, 9, 8], exposure: 1.05 });
        base.forEach((p, i) => {
          const u = easeOut(clamp((lt - rnd(i, 1) * 1.0) / 0.7));
          const from = new THREE.Vector3((rnd(i, 2) - 0.5) * 60, (rnd(i, 3) - 0.3) * 40, 20 + rnd(i, 4) * 20);
          const pos = v3(from, p, u);
          q.setFromEuler(new THREE.Euler((1 - u) * 6 * rnd(i, 5), (1 - u) * 6, (1 - u) * 3));
          m.compose(pos, q, new THREE.Vector3(size, size, size));
          wall.setMatrixAt(i, m);
        });
        wall.instanceMatrix.needsUpdate = true;
        tiles.forEach((h, i) => {
          const s = t - TITLE_CHARS[i];
          const p = pop(s, 0.5);
          h.visible = s > 0;
          h.position.y = (1 - p) * 4;
          h.rotation.set((1 - p) * -2, 0, (1 - p) * (rnd(i) - 0.5) * 2);
          h.scale.setScalar(Math.max(0.001, p));
        });
        whale.act('wave', lt).at(-0.55, 0, 0.5);
        claude.act(lt > 1 ? 'hop' : 'curtsy', lt).at(0.55, 0, 0.5);
        const z = lerp(11, 8.5, easeInOut(lt / 2.9));
        S.cam([0, 2.6, z], [0, 2.8, 0], 44);
        whale.face(S.camera);
        claude.face(S.camera);
      },
    };
  },
};

export const SHOTS_B = [s9, s10, s11, s12, s13, s14, s15, s16, s17];
