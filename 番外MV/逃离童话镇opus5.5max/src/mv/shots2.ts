import * as THREE from 'three';
import {
  FONT, Kit, PI, TAU, back, ball, basic, box, cam, cone, cyl, disc, eio, eo, ei, glide, glowMat, hit, lerp, many, mesh,
  pop, put, rnd, seg, setOp, shot, slam, sprite3D, toon, txt,
} from './engine';
import {
  PAL, bar3D, blade3D, bottle3D, bubble3D, cauldron3D, heart3D, hunter3D, musicStage3D, prince3D, scriptSlab3D, shards3D, spotCone, tag3D, wolf3D,
} from './props';
import {
  backdropHills, flower, hourglass, house, mushroom, paperBoat, pine, riceBowl, rock, straightRiver, tree,
} from './sets3d';
import { beatSq } from './shots1';

function cake3D(c = 0xff9ad0) {
  const g = new THREE.Group();
  put(g, cyl(0.11, 0.08, 0.12, 0xe8b46a, 8), 0, 0, 0);
  put(g, ball(0.12, c, true, 0.02), 0, 0.14, 0);
  put(g, ball(0.045, 0xe63946, true, 0.015), 0, 0.27, 0);
  return g;
}

function ribs3D(k: { add: <T extends THREE.Object3D>(o: T, x?: number, y?: number, z?: number) => T }, n = 6, col = 0x5c1822) {
  return many(n, i => {
    const m = mesh(new THREE.TorusGeometry(2.9 + i * 0.12, 0.14, 6, 20, PI), toon(col), 0.04);
    return k.add(m, 0, 0.2, 1.2 - i * 1.45);
  });
}

function seaHorizon(k: { add: <T extends THREE.Object3D>(o: T, x?: number, y?: number, z?: number) => T }, sun = true) {
  k.add(disc(500, 0x2b6fe0, -0.05));
  const rv = straightRiver(120, 48, 0, -20, 0.02, 0x35a7e8, 0x1a4ea8); k.add(rv.mesh);
  if (sun) {
    k.add(new THREE.Mesh(new THREE.SphereGeometry(5.5, 22, 14), basic(0xffe08a)), 0, 5.2, -52);
    k.add(sprite3D('glow', 24, 0xffd07a, true, 0.55), 0, 5.2, -51);
  }
  // 远处的金殿堂（致敬童话镇 L21）
  const pal = new THREE.Group(); k.add(pal, 14, 0, -56);
  put(pal, cyl(5.5, 6.2, 2.8, 0xffc233, 14), 0, 0, 0);
  put(pal, ball(3.8, 0xffd166), 0, 4.4, 0);
  put(pal, cone(0.6, 3.8, 0xfff3b0, 8), 0, 7.6, 0);
  for (const x of [-5.2, 5.2]) {
    put(pal, cyl(0.9, 1.1, 6.2, 0xffc233, 10), x, 0, 0);
    put(pal, ball(1.2, 0xffd166), x, 6.6, 0);
  }
  k.add(sprite3D('glow', 32, 0xffd98a, true, 0.45), 14, 5, -54);
  return rv;
}

/** 吐槽镜头：八音盒小舞台上的「字」在演——夸张 = 像气球一样吹胀再啵地炸开；荒诞 = 整个倒栽过来、舞台跟着打转 */
function quip3D(id: string, a: number, b: number, tBig: number, small: string, big: string, mode: 'inflate' | 'flip', whaleFrame: string) {
  shot(id, a, b, 'stage', k => {
    k.add(disc(90, 0x2a1426));
    const stg = k.add(musicStage3D(), 0, 0, 0);
    for (const s of [-1, 1]) k.add(box(3.6, 9, 0.6, 0x9c2a3a), s * 6.3, 0, -2.6);
    k.add(box(18, 9, 0.4, 0x3a0e24), 0, 0, -4.4);
    k.add(spotCone(0.3, 3.0, 9, 0xfff0d0, 0.15), 0, 0.8, 0);
    const wh = k.actor('whale', 1.15);
    const co = mode === 'inflate' ? k.actor('doubao', 1.0).wear('hood') : k.actor('claude', 1.0).wear('crown');
    const prop = k.thing(mode === 'inflate' ? 'prop_basket' : 'prop_teacup', 1.4);
    const sm = txt(small, 0.48, { font: FONT.hei, color: '#fff', sp: 0.25 }); k.add(sm, -1.9, 3.35, 1.2);
    const bg = [...big].map((ch, i) => { const m = txt(ch, 1.4, { font: FONT.hei, color: mode === 'inflate' ? '#ffd166' : '#ff7cc4', stroke: '#0b0a0c', sw: 0.05, px: 200 }); k.add(m, -0.85 + i * 1.7, 2.65, 1.4); return m; });
    const bits = shards3D(14, [0xffd166, 0xffffff, 0xff7cc4], 0.16); bits.forEach(m => k.add(m));
    const popT = tBig + 0.25;
    return ({ t, T, hud }) => {
      stg.userData.top.rotation.y = T * (mode === 'flip' ? 0.6 + seg(t, tBig, tBig + 0.3) * 3 : 0.8);
      wh.set(whaleFrame).at(-1.35, 0.8, 0.3).emote('fx_sweat', T);
      co.act(mode === 'inflate' ? 'tilt' : 'tilt', T, a).at(1.35, 0.8, 0.3).flip();
      prop.at(mode === 'inflate' ? 1.75 : 1.0, mode === 'inflate' ? 1.05 : 1.75 + Math.sin(T * 6) * 0.08, 0.45);
      slam(sm, t, a + 0.05, 1, 0.12, 1.8);
      bg.forEach((m, i) => {
        const t0 = tBig + i * 0.06;
        if (mode === 'inflate') {
          m.visible = t >= t0;
          const inf = seg(t, t0, popT), after = t >= popT;
          const sc = after ? 1 + hit(t, popT, 0.35) * 0.35 * Math.sin((t - popT) * 60) : 0.2 + inf * 1.55 + Math.sin(T * 40) * 0.04 * inf;
          m.scale.set(sc * (after ? 1 : 1 + inf * 0.12), sc, 1);
          (m.material as THREE.Material).opacity = 1;
        } else {
          slam(m, t, t0, 1, 0.13, 2.4);
          m.rotation.z = (i ? 0.07 : -0.05) + eo(seg(t, t0, t0 + 0.3)) * PI;
          m.position.y = 2.65 + Math.sin((t - t0) * 9 + i) * 0.08 * seg(t, t0, t0 + 0.3);
        }
      });
      bits.forEach((m, i) => {
        const kk = seg(t, popT, popT + 0.6), ang = rnd(i * 3) * TAU;
        m.visible = mode === 'inflate' && kk > 0 && kk < 1;
        m.position.set(Math.cos(ang) * kk * 3.2, 2.7 + Math.sin(ang) * kk * 2.2 - kk * kk, 1.5); m.rotation.set(kk * 9, kk * 7, i);
      });
      hud.bars = 1.3; hud.shake = hit(t, tBig, 0.2) * 0.25 + (mode === 'inflate' ? hit(t, popT, 0.25) * 0.4 : 0);
      hud.flash = mode === 'inflate' ? hit(t, popT, 0.1) * 0.4 : 0;
      return cam([0, 2.3, 8.2], [0, 2.0, 0], 36, mode === 'flip' ? lerp(-0.02, 0.22, eo(seg(t, tBig, tBig + 0.35))) : -0.02);
    };
  });
}

export function reg2() {
  /* ───── V1a：小红帽迷失在森林 提着糕点篮 ───── */
  shot('V1a', 28.58, 32.5, 'forest', k => {
    k.add(disc(220, 0x2f6b4f));
    k.add(box(70, 0.05, 1.9, 0xf6e2b3, 0), 0, 0.01, 0);
    const rv = straightRiver(80, 3.8, 1, -4.4, 0.05); k.add(rv.mesh);
    const trees: THREE.Object3D[] = [];
    for (let i = 0; i < 42; i++) {
      const tr = i % 3 ? pine(2.8 + rnd(i) * 2.8, i % 2 ? 0x1f6b55 : 0x17805f) : tree(2.3 + rnd(i) * 1.3, 0x3aa86a, i);
      k.add(tr, -22 + i * 1.05 + rnd(i * 3) * 0.6, 0, (i % 4 === 0 ? -7.4 : -1.5) - rnd(i * 7) * 8);
      trees.push(tr);
    }
    for (let i = 0; i < 8; i++) { const tr = pine(1.7 + rnd(i) * 0.7, 0x124739); k.add(tr, -9 + i * 2.8, 0, 2.4 + rnd(i) * 0.4); tr.userData.front = 1; trees.push(tr); }
    many(7, i => k.add(mushroom(0.45 + rnd(i) * 0.3, 0xe63946), -6 + i * 2.1, 0, -1.2 - rnd(i) * 0.6));

    // 路牌 + Gemini 指两条相反的路
    const sign = new THREE.Group(); k.add(sign, 0.9, 0, -1.1);
    put(sign, cyl(0.06, 0.08, 1.85, 0x6b4630, 6), 0, 0, 0);
    const a1 = put(sign, box(1.2, 0.24, 0.08, 0xf6e2b3, 0.025), 0, 1.65, 0);
    const a2 = put(sign, box(1.2, 0.24, 0.08, 0xffd166, 0.025), 0, 1.28, 0);

    const boat = k.add(paperBoat(), 0, 0.1, -4.4, 0, 0.75);
    const wh = k.actor('whale');
    const db = k.actor('doubao').wear('hood');
    const gem = k.actor('gemini').wear('bow');
    const basket = k.thing('prop_basket');
    const cakes = [0xff9ad0, 0xffffff, 0xffd166].map(c => k.add(cake3D(c)));
    const big = txt('森林', 2.8, { rough: true, stroke: '#10281e', sw: 0.04 });
    k.add(big, 0, 4.4, -0.5); big.rotation.x = -0.55;

    return ({ t, T, bt, hud }) => {
      const A = t < 30.0, B = t >= 30.0 && t < 30.54;
      let x: number;
      if (A) {
        x = lerp(-2.8, -0.5, seg(t, 28.58, 29.3));
        if (t < 29.3) db.walkBy(x + 2.8).at(x, 0, 0.15);
        else db.act('tilt', T, 29.3).at(x, 0, 0.15).flip(t > 29.62 && t < 29.85).emote('fx_question', T);
        gem.act(t > 29.3 ? 'choose' : 'lookaround', T, 29.3).at(1.7, 0, -0.6).flip();
      } else {
        x = -0.5 + Math.max(0, t - 30.54) * 0.65;
        db.walkBy(x + 0.5).at(x, 0, 0.15);
        gem.act('idle', T).at(1.7, 0, -0.6).flip();
      }
      const bx = x + 0.42, by = 0.35 + Math.abs(Math.sin(T * 6)) * 0.06;
      basket.at(bx, by, 0.25);

      // 本鲸在七彩小溪的纸船上跟着观察
      const wx = lerp(-4.5, 2.5, seg(t, 28.58, 32.5));
      boat.position.set(wx, 0.1 + Math.sin(T * 2.4) * 0.04, -4.4);
      wh.act('wave', T).at(wx, 0.4, -4.4).noShadow().sq(beatSq(bt, 0.04));

      a1.rotation.y = t > 29.3 ? (t - 29.3) * 11 : 0.2;
      a2.rotation.y = t > 29.3 ? -(t - 29.3) * 14 : -0.3;
      sign.visible = !B;
      trees.forEach(tr => { tr.scale.y = B ? 1 + eo(seg(t, 30.0, 30.5)) * 0.45 : 1; tr.visible = !(tr.userData.front && !B); });
      slam(big, t, 30.0, 1, 0.14, 2.2); big.visible = B;

      [31.08, 31.34, 31.6].forEach((tt, i) => {
        const c = cakes[i]; c.visible = t > tt;
        const kk = back(seg(t, tt, tt + 0.22));
        c.position.set(bx - 0.1 + i * 0.14, by + 0.28 + kk * 0.22 + hit(t, tt, 0.3) * 0.12, 0.28 + i * 0.02);
        c.rotation.z = (i - 1) * 0.25;
      });

      if (A) return cam([x + 0.7, 1.45, 5.8], [x + 0.35, 1.15, 0], 35, t > 29.3 ? Math.sin((t - 29.3) * 9) * 0.06 : 0);
      if (B) { hud.shake = hit(t, 30.0, 0.25) * 0.25; return cam([0, 11.2 - seg(t, 30, 30.54) * 1.4, 10.2], [0, 1.4, -2.2], 42); }
      hud.shake = (hit(t, 31.08, 0.15) + hit(t, 31.6, 0.15)) * 0.06;
      return cam([x + 1.1, 1.25, 4.35 - seg(t, 30.54, 32.5) * 0.35], [bx - 0.1, 1.0, 0.2], 35);
    };
  });

  /* ───── V1b：外婆的叮咛是你要乖巧与和善 ───── */
  shot('V1b', 32.5, 36.45, 'day', k => {
    k.add(disc(240, 0x7fcf66)); backdropHills(k, 0x79b98a, 0x6aa9c9);
    k.add(house(3.2, 2.3, 2.6, 0xf6e6c4, 0xb5473c, true), 3.2, 0, -1.8, -0.35);
    many(14, i => k.add(i % 2 ? tree(3.0 + rnd(i), 0x4fb85a, i) : pine(3.5 + rnd(i) * 2, 0x2f7a55), -14 + i * 2.1, 0, -4.5 - rnd(i * 3) * 6));
    many(12, i => k.add(flower([0xff7aa8, 0xffd166, 0xffffff][i % 3], 0.4), -6 + i * 1.1, 0, 1.5 + rnd(i) * 1.2));
    k.add(riceBowl(0.18, 0x3d7fd9), 1.9, 0.65, -0.9);
    k.add(box(0.8, 0.65, 0.6, 0xb9824f), 1.9, 0, -0.9);

    const km = k.actor('kimi').wear('tiara');
    const scr = k.thing('prop_scroll');
    const db = k.actor('doubao').wear('hood');
    const wh = k.actor('whale');
    const bub = bubble3D('出门在外，要听话', 0.28); k.add(bub);
    const t1 = k.add(tag3D('乖巧')), t2 = k.add(tag3D('和善'));
    const s1 = k.add(cyl(0.02, 0.02, 6, 0xffffff, 5, 0)), s2 = k.add(cyl(0.02, 0.02, 6, 0xffffff, 5, 0));

    return ({ t, T, bt, hud }) => {
      const tug = eo(seg(t, 35.6, 35.9));
      km.act(t < 33.14 ? 'idle' : t < 34.14 ? 'think' : 'nod', T, 34.14).at(1.3, 0, 0).flip().sq(beatSq(bt, 0.03));
      scr.at(0.95, 0.55, 0.15);
      db.act(t < 34.14 ? 'idle' : t < 35.0 ? 'surprise' : 'bow', T, t < 35 ? 34.14 : 35.0).at(-1.25, 0, 0.1).lift(tug * 0.18);
      // 本鲸在灌木丛后摇头叹气
      wh.act('shake', T).at(-3.3, 0, -1.4).emote('fx_gloom', T);

      bub.position.set(0.85, 2.4, 0.3);
      bub.visible = t > 33.14 && t < 34.14;
      bub.scale.setScalar(Math.max(0.01, pop(t, 33.14) * (1 - seg(t, 34.05, 34.14))));

      const P = [[-2.15, 1.15, 34.14, -0.15], [-0.35, 0.9, 35.0, 0.14]];
      [t1, t2].forEach((tg, i) => {
        const p = P[i]; slam(tg, t, p[2], 0.65, 0.14, 2.8);
        tg.position.set(p[0], p[1] + tug * 0.18 + Math.sin(T * 3 + i) * 0.02, 0.25);
        tg.rotation.z = p[3] + Math.sin(T * 2.5 + i) * 0.04;
        const st = i ? s2 : s1; st.visible = t > p[2]; st.position.set(p[0], p[1] + 0.4 + tug * 0.18, 0.23);
      });

      hud.shake = (hit(t, 34.14, 0.25) + hit(t, 35.0, 0.25)) * 0.25;
      const z = eio(seg(t, 33.5, 34.14));
      return cam([lerp(0.2, -1.1, z), lerp(1.5, 1.25, z), lerp(7.4, 4.9, z) - seg(t, 34.14, 36.4) * 0.35],
        [lerp(0.1, -1.2, z), lerp(1.15, 1.05, z), 0], 35);
    };
  });

  /* ───── V1c：狼的肚腹里… ───── */
  shot('V1c', 36.45, 38.35, 'cave', k => {
    k.add(disc(140, 0x160308));
    many(12, i => k.add(rock(1.2 + rnd(i) * 1.4, 0x1c0810, i), -10 + i * 2.0, 0.2, -3.5 - (i % 2) * 1.5));
    const wf = wolf3D(0x100816, 0xff2d4a); wf.scale.setScalar(2.1); k.add(wf, 0.7, 0, -0.5);
    const gp = k.actor('gpt', 1.8).wear('ears');
    const db = k.actor('doubao').wear('hood');
    const wh = k.actor('whale');
    const big = txt('狼', 2.4, { rough: true, stroke: '#100204', sw: 0.04 }); k.add(big, -3.5, 3.4, -0.5);

    return ({ t, T, bt, hud }) => {
      const kk = ei(seg(t, 37.42, 38.3));
      wf.position.set(0.8, hit(t, 36.54, 0.3) * 0.25, -0.4);
      wf.userData.jaw.rotation.z = -0.35 - Math.sin(T * 4) * 0.1 - bt.pulse * 0.15;
      gp.set('gpt_boss_rage').at(3.1, 0, -3.2).sil(1, 0x0a040c).noShadow();
      db.act('surprise', T, 36.5).at(-2.8 + Math.sin(T * 45) * 0.015 + kk * 1.9, 0, 0.2).size(1 - kk * 0.35).emote('fx_exclaim', T);
      wh.act('point', T).at(-4.1, 0, 0.4).emote('fx_anger', T);
      slam(big, t, 36.54, 1, 0.15, 2.4); (big.material as THREE.Material).opacity *= 1 - kk;
      hud.shake = hit(t, 36.54, 0.3) * 0.25 + kk * 0.15; hud.fade = seg(t, 38.15, 38.33);
      return cam([lerp(-0.5, 0.2, kk), lerp(2.1, 1.9, kk), lerp(9.2, 2.6, kk)], [lerp(-0.5, 0.2, kk), lerp(1.7, 1.8, kk), -0.4], 36);
    };
  });

  /* ───── V1c2：哦 一片 黑暗（3D 肋骨洞穴） ───── */
  shot('V1c2', 38.35, 40.05, 'cave', k => {
    k.add(disc(100, 0x090204));
    const rb = ribs3D(k, 6, 0x420a12);
    const sp = k.add(spotCone(0.2, 2.4, 8, 0xff5566, 0.14), 0, 0, 0);
    const db = k.actor('doubao').wear('hood');
    const wh = k.actor('whale');
    const ln = k.add(sprite3D('glow', 1.4, 0xffb05a, true, 0.65), -2.2, 1.4, -1.8);
    const big = txt('黑暗', 2.6, { color: '#5c0c18', rough: true, stroke: '#1a0206', sw: 0.03 }); k.add(big, 0, 2.6, -2.5);
    void ln;

    return ({ t, T, hud }) => {
      const dark = eio(seg(t, 39.36, 40.0));
      rb.forEach((m, i) => { m.visible = t > 38.62 + i * 0.05; m.scale.setScalar(1 + Math.sin(T * 2.4 + i) * 0.025); });
      db.act('bow', T, 38.4).at(0, 0, 0).sil(dark * 0.9, 0x090204).emote(dark < 0.5 ? 'fx_gloom' : null, T);
      wh.act('idle', T).at(-2.3, 0, -2.1).sil(0.75).alpha(1 - dark * 0.9);
      ln.visible = dark < 0.8; setOp(ln, (1 - dark) * 0.6);
      sp.scale.set(1 - dark * 0.85, 1, 1 - dark * 0.85);
      (sp.material as THREE.Material).opacity = 0.14 * (1 - dark);
      slam(big, t, 39.36, 1, 0.3, 1.3);
      hud.fade = Math.max(1 - seg(t, 38.35, 38.6), dark * 0.75);
      return cam([0, 1.4, lerp(6.8, 8.6, seg(t, 38.35, 40.05))], [0, 1.2, 0], 35);
    };
  });

  quip3D('V1x', 40.05, 40.95, 40.6, '多么', '夸张', 'inflate', 'whale_big_point');

  /* ───── V1d：剧本说：要等待 猎人来 剖开 这 磨难（通用模板 3D 沙漏登场） ───── */
  shot('V1d', 40.95, 44.75, 'cave', k => {
    k.add(disc(120, 0x100408));
    // 裂缝外明亮的童话镇天光面板
    k.add(new THREE.Mesh(new THREE.PlaneGeometry(8, 11), basic(0xffe8f4)), 2.8, 2.8, -4.4);
    const hu = hunter3D(0x16090a); hu.scale.setScalar(1.0); k.add(hu, 3.0, 0.0, -3.5);
    const dL = k.add(box(7, 10, 0.4, 0x0b0305), -0.8, 0, -3.0);
    const dR = k.add(box(7, 10, 0.4, 0x0b0305), 6.4, 0, -3.0);
    const rb = ribs3D(k, 5, 0x420a12); rb.forEach(m => (m.position.x = 1.6));

    const hg = hourglass(1.05, 0xf2c14e, 0x8a5a3c); k.add(hg.g, -0.1, 0.02, 0.3);
    const db = k.actor('doubao').wear('hood');
    const wh = k.actor('whale');
    const zai = k.actor('zai');
    const slab = scriptSlab3D('剧 本', ['第一幕 · 森林', '小红帽：迷路。', '大灰狼：吞下她。', '小红帽：等待。', '猎人：剖开，救出。'], 3);
    k.add(slab);
    const wait = txt('等 待', 0.62, { font: FONT.hei, color: '#ffffff' }); k.add(wait, 1.25, 2.5, 0.4);
    const big = txt('磨难', 1.05, { color: '#e01b24', rough: true, stroke: '#100204', sw: 0.04 }); k.add(big, 2.35, 2.6, 0.5);

    return ({ t, T, hud }) => {
      const open = eo(seg(t, 42.8, 43.25));
      dL.position.x = 2.8 - 3.6 - open * 1.4; dR.position.x = 2.8 + 3.6 + open * 1.4;
      hu.position.y = lerp(-3.5, 0.0, back(seg(t, 42.36, 42.8))); hu.visible = open > 0;
      zai.act('alert', T, 42.8).at(2.1, 0, -3.3).alpha(open);
      rb.forEach((m, i) => { m.position.x = 1.6; m.scale.x = 1 + open * 0.18 * i; });

      slab.position.set(-2.9, 2.3 + Math.sin(T * 2) * 0.05, 0.8); slab.rotation.set(0, 0.25, 0.06);
      slam(slab, t, 41.0, 0.92, 0.18, 2.1);

      db.act(t < 42.8 ? 'idle' : t < 43.58 ? 'surprise' : 'tilt', T, 42.8).at(1.25, 0, 0.1).sil(0.35 * (1 - open));
      wh.act('point', T).at(-1.25, 0, 0.2).emote('fx_anger', T);
      // 3D 沙漏实体沙子流动，在 41.8s 时翻转！
      hg.g.visible = t > 41.2;
      if (t < 41.8) hg.set(seg(t, 41.0, 41.8) * 0.8, T, true);
      else if (t < 42.3) hg.flip(seg(t, 41.8, 42.3), 0.8, T);
      else hg.set(0.2 + seg(t, 42.3, 44.75) * 0.65, T, true);

      slam(wait, t, 41.8, 1, 0.14, 2); wait.visible = t > 41.8 && t < 42.8;
      slam(big, t, 43.58, 1, 0.16, 2.5); big.rotation.z = -0.08;
      hud.flash = hit(t, 42.8, 0.2) * 0.7; hud.shake = hit(t, 42.8, 0.3) * 0.35 + hit(t, 43.58, 0.25) * 0.28;
      return cam([0, 1.9, 9.6 - seg(t, 41, 44.75) * 0.7], [0, 1.85, 0], 35);
    };
  });

  /* ───── V2a：小美人鱼（《童话镇》L28 海底珍珠拱门上浮） ───── */
  shot('V2a', 44.75, 45.88, 'sea', k => {
    k.add(disc(120, 0x1e6088, -3));
    const surf = straightRiver(140, 14, 1, 0, 6.2); k.add(surf.mesh);
    many(6, i => {
      const s = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 13), glowMat(0xbff4ff, 0.14, true));
      s.rotation.z = 0.28; k.add(s, -5 + i * 2.1, 2.5, -2 - (i % 3));
    });
    const weeds = many(14, i => k.add(cone(0.14, 1.4 + rnd(i) * 1.5, i % 2 ? 0x2f9f6a : 0x3fbf7a, 5), -7 + i * 1.05, -2.5, -2.4 - rnd(i + 2) * 2.5));
    many(5, i => k.add(rock(0.6 + rnd(i) * 0.5, 0x4a7f9a, i), -6 + i * 3.0, -2.3, -1.8));
    // 珍珠拱门与贝壳智者 Kimi
    k.add(mesh(new THREE.TorusGeometry(2.3, 0.22, 8, 26, PI), toon(0xffe6f2), 0.04), 0.2, -1.8, -1.4);
    many(9, i => { const a = (i / 8) * PI; k.add(ball(0.2, 0xffffff, false, 0.02), 0.2 + Math.cos(a) * 2.3, -1.8 + Math.sin(a) * 2.3, -1.15); });
    const sh = k.add(ball(0.85, 0xffb3cf), 3.3, -2.2, -0.9); sh.scale.set(1.2, 0.45, 1);

    const wh = k.actor('whale', 1.25).wear('tail');
    const km = k.actor('kimi', 0.95).wear('tiara');
    const bub = many(24, () => k.add(sprite3D('bubble', 0.28)));

    const A = cam([0, 0.1, 7.6], [0, 0.6, 0], 38), B = cam([0, 2.4, 6.8], [0, 2.8, 0], 38);
    return ({ t, u, T, bt }) => {
      wh.set('whale_big_idle').at(Math.sin(T * 3) * 0.22, lerp(-1.8, 2.3, eio(seg(t, 44.75, 45.88))), 0)
        .tilt(Math.sin(T * 4) * 0.12).noShadow().sq(beatSq(bt, 0.04));
      km.act('nod', T).at(3.3, -1.85, -0.8).flip();
      weeds.forEach((w, i) => { w.rotation.z = Math.sin(T * 1.5 + i) * 0.14; });
      bub.forEach((b, i) => {
        const ph = (T * (0.28 + rnd(i) * 0.2) + rnd(i + 1)) % 1;
        b.position.set(-5 + rnd(i + 2) * 10 + Math.sin(ph * 8 + i) * 0.2, -2.5 + ph * 8, -2 + rnd(i + 3) * 3.5);
        setOp(b, Math.sin(ph * PI));
      });
      return glide(A, B, u);
    };
  });

  /* ───── V2a2：浮上海面 歌声多璀璨（《童话镇》L21 金殿堂海面 + 纸船伙伴） ───── */
  shot('V2a2', 45.88, 48.85, 'dusk', k => {
    seaHorizon(k, true);
    many(4, i => k.add(rock(0.8 + rnd(i) * 0.6, 0x5a6082, i), -4.5 + i * 3.2, 0.05, -3.5 - rnd(i) * 2));
    const wh = k.actor('whale', 1.35).wear('tail');
    const boat = k.add(paperBoat(), 3.4, 0.08, 0.4, 0.2, 0.72);
    const cl = k.actor('claude', 0.9).wear('crown');
    const db = k.actor('doubao', 0.9).wear('hood');

    const spl = k.add(mesh(new THREE.RingGeometry(0.8, 1.0, 32).rotateX(-PI / 2), glowMat(0xffffff, 0.8)), -0.8, 0.12, 0);
    const drops = many(14, () => k.add(ball(0.08, 0xdff6ff, false, 0.015)));
    const notes = many(10, () => k.add(sprite3D('note', 0.48)));
    const stars = many(28, () => k.add(sprite3D('star', 0.45, 0xfff2a8, true)));
    const big = txt('璀璨', 1.35, { color: '#fff6c8', stroke: '#6a2060', sw: 0.03 }); k.add(big, 3.0, 2.75, -1.2); big.rotation.z = -0.06;

    return ({ t, u, T, bt, hud }) => {
      const up = back(seg(t, 45.88, 46.4));
      wh.set(t < 46.92 ? 'whale_big_idle' : 'whale_big_wave').at(-0.9, lerp(-2.2, -0.3, up) + Math.sin(T * 2.4) * 0.05, 0.2)
        .noShadow().sq(beatSq(bt, 0.04));

      const bx = lerp(4.2, 2.4, u);
      boat.position.set(bx, 0.08 + Math.sin(T * 2.2) * 0.04, 0.3); boat.rotation.z = Math.sin(T * 1.8) * 0.04;
      cl.act('hop', T).at(bx - 0.35, 0.35 + Math.sin(T * 2.2) * 0.04, 0.3).noShadow().flip();
      db.act('hop', T + 0.2).at(bx + 0.35, 0.35 + Math.sin(T * 2.2) * 0.04, 0.35).noShadow().flip();

      spl.scale.setScalar(0.5 + eo(seg(t, 46.0, 47.2)) * 3.8);
      (spl.material as THREE.Material).opacity = 1 - seg(t, 46.0, 47.2);
      drops.forEach((d, i) => {
        const kk = seg(t, 46.0, 46.9), a = i * 0.45;
        d.position.set(-0.9 + Math.cos(a) * kk * 2.2, 0.2 + Math.sin(kk * PI) * (1.5 + rnd(i)), Math.sin(a) * kk * 1.2);
        d.visible = kk > 0 && kk < 1;
      });
      notes.forEach((n, i) => {
        const ph = ((T - 46.92) * 0.6 + i / 10) % 1;
        n.visible = t > 46.92;
        n.position.set(-0.9 + Math.sin(ph * 6 + i) * 1.4, 1.4 + ph * 2.6, 0.2 + Math.cos(i) * 0.6);
        setOp(n, t > 46.92 ? Math.sin(ph * PI) : 0);
      });
      stars.forEach((st, i) => {
        const a = rnd(i * 3) * TAU, kk = eo(seg(t, 47.68 + rnd(i) * 0.15, 48.5)), R = 1 + rnd(i * 5) * 4.5;
        st.visible = t > 47.68;
        st.position.set(-0.6 + Math.cos(a) * R * kk, 1.7 + Math.sin(a) * R * kk * 0.62, -0.4 + rnd(i) * 0.6);
        setOp(st, t > 47.68 ? 0.5 + 0.5 * Math.sin(T * 9 + i * 2) : 0);
      });
      slam(big, t, 47.68, 1, 0.16, 2.4);
      hud.flash = hit(t, 47.68, 0.25) * 0.55; hud.shake = hit(t, 46.0, 0.25) * 0.18;
      return cam([lerp(1.4, 0.5, u), 1.65, lerp(7.8, 9.2, eo(u))], [0.4, 1.55, 0], 36);
    };
  });

  /* ───── V2b：女巫的交易是割让歌喉的谈判（《童话镇》L14 紫夜魔法+浮空茶杯+魔药锅） ───── */
  shot('V2b', 48.85, 52.9, 'magic', k => {
    k.add(disc(140, 0x3b2a70));
    many(7, i => k.add(mushroom(1.0 + rnd(i) * 1.8, [0x4fd0ff, 0xff7ad9, 0x8dffb0][i % 3], true), -7.5 + i * 2.5, 0, -5.5 - rnd(i) * 2.5));
    many(12, i => k.add(pine(5 + rnd(i) * 4, 0x2e2162), -14 + i * 2.5, 0, -8 - rnd(i) * 5));
    const cups = many(4, i => k.add(cyl(0.28, 0.18, 0.28, 0xffffff, 10), -3 + i * 2.2, 3.0 + rnd(i) * 1.2, -2.5));
    const caul = k.add(cauldron3D(), 0.2, 0, -0.3);
    const bot = k.add(bottle3D(), 1.9, 0.45, 0.4);
    const qw = k.actor('qwen', 1.1).wear('tophat');
    const wh = k.actor('whale', 1.1);
    const km = k.actor('kimi', 0.95).wear('tiara');
    const scr = k.thing('prop_scroll', 1.6);

    const orb = k.add(new THREE.Group());
    put(orb, ball(0.22, 0xfff6c0, false, 0), 0, 0, 0);
    put(orb, sprite3D('star', 1.2, 0xffe27a, true), 0, 0, 0);
    const slash = bar3D(-7, -1.8, 7, 2.0, 0.08, 0xffffff, true); k.add(slash, 0, 1.8, 1.2);
    const seal = k.add(new THREE.Group());
    put(seal, mesh(new THREE.TorusGeometry(0.65, 0.07, 6, 24), basic(0xe01b24), 0), 0, 0, 0);
    seal.add(txt('成交', 0.5, { font: FONT.serif, color: '#e01b24', weight: '900', depth: false }));
    const big = txt('割让', 1.35, { rough: true, stroke: '#1c0424', sw: 0.04 }); k.add(big, -2.4, 2.95, 0.6);

    return ({ t, T, bt, hud }) => {
      const kk = eio(seg(t, 50.1, 51.3));
      cups.forEach((c, i) => { c.rotation.z = PI + Math.sin(T * 1.4 + i) * 0.2; c.position.y = 3.0 + rnd(i) * 1.0 + Math.sin(T * 1.6 + i) * 0.2; });
      caul.scale.setScalar(1 + bt.pulse * 0.04);
      qw.act(t < 49.48 ? 'idle' : t < 51.4 ? 'sway' : 'bow', T, 51.4).at(2.9, 0, 0.2).flip();
      wh.act(t < 50.02 ? 'idle' : t < 50.6 ? 'surprise' : 'sad', T, 50.02).at(-2.7, 0, 0.2).sil(kk * 0.35, 0x20104a);
      km.act('think', T).at(-0.6, 0, -2.1);

      scr.at(0.15, 2.3 + Math.sin(T * 3) * 0.05, 0.4).size(pop(t, 49.48));
      if (t <= 49.48) scr.hide();

      const ox = lerp(-2.4, 1.9, kk), oy = lerp(1.15, 1.05, kk) + Math.sin(kk * PI) * 1.9;
      orb.position.set(ox, oy, 0.6);
      orb.scale.setScalar((0.75 + bt.pulse * 0.25) * (t < 50.02 ? seg(t, 49.0, 49.4) : 1));
      orb.children[1].rotation.z = T * 3;
      bot.rotation.z = Math.sin(T * 12) * 0.06 * hit(t, 51.2, 0.4);

      slam(slash, t, 50.02, 1, 0.1, 1.4); slash.visible = t > 50.02 && t < 50.32;
      slam(big, t, 50.02, 1, 0.14, 2.4); big.visible = t > 50.02 && t < 51.4;
      slam(seal, t, 51.4, 1.1 + hit(t, 52.04, 0.2) * 0.18, 0.12, 3.8);
      seal.position.set(0.3, 2.35, 0.8); seal.rotation.z = -0.22;

      hud.flash = hit(t, 50.02, 0.16) * 0.8; hud.flashCol = '#ff2a4a';
      hud.shake = hit(t, 50.02, 0.3) * 0.35 + hit(t, 51.4, 0.25) * 0.35 + hit(t, 52.04, 0.2) * 0.22;
      return cam([Math.sin(T * 0.6) * 0.3, 1.75, 8.8 - seg(t, 48.85, 52.9) * 0.8], [0, 1.7, 0], 36);
    };
  });

  /* ───── V2c & V2c2：刀尖上跳舞，等待王子的青睐 ───── */
  const bladeStage = (k: Kit) => {
    k.add(disc(140, 0x1e0408));
    for (let r = 0; r < 3; r++) for (let i = 0; i < 19; i++) {
      k.add(blade3D(1.1 + rnd(i + r * 30) * 0.4, r === 0 ? 0xe6ecf8 : 0x9aa3ba), -8.5 + i * 0.95 + r * 0.45, -0.2, -r * 0.65);
    }
    const wh = k.actor('whale', 1.15);
    const sparks = many(8, i => k.add(sprite3D('star', 0.45, i % 2 ? 0xffffff : 0xff5c8a, true)));
    const dance = (T: number, bt: { pulse: number }, cx: number) => {
      const wx = cx + Math.sin(T * 1.6) * 1.1;
      wh.act('spin', T).at(wx, 0.95 + bt.pulse * 0.4, -0.15).emote('fx_sweat', T);
      sparks.forEach((st, i) => {
        const a = (i / 8) * TAU;
        st.position.set(wx + Math.cos(a) * (1 - bt.pulse) * 1.1, 1.0 + Math.sin(a) * (1 - bt.pulse) * 0.4, 0.2);
        st.scale.setScalar(bt.pulse * 0.65);
      });
    };
    return { wh, dance };
  };

  shot('V2c', 52.9, 54.84, 'crimson', k => {
    const { wh: _wh, dance } = bladeStage(k); void _wh;
    const qw = k.actor('qwen', 0.95).wear('tophat');
    const big = txt('刀尖', 1.85, { rough: true, stroke: '#100204', sw: 0.04 }); k.add(big, -1.6, 3.2, -1.2); big.rotation.z = 0.07;
    return ({ t, T, bt, hud }) => {
      dance(T, bt, 0.7);
      qw.act('idle', T).at(-3.0, 0, -2.2).sil(0.75, 0x16040a);
      slam(big, t, 52.96, 1, 0.15, 2.3);
      hud.shake = bt.pulse * 0.07 + hit(t, 52.96, 0.25) * 0.28;
      return cam([1.4, 0.95, 6.2 - seg(t, 52.9, 54.84) * 0.55], [0.5, 1.8, 0], 38, 0.04);
    };
  });

  shot('V2c2', 54.84, 56.35, 'crimson', k => {
    const { wh, dance } = bladeStage(k);
    const boxG = k.add(new THREE.Group(), 3.6, 1.8, -1.4);
    put(boxG, box(3.2, 0.85, 0.8, PAL.gold), 0, 0, 0);
    put(boxG, box(3.5, 0.18, 0.95, PAL.goldL), 0, 0.85, 0);
    put(boxG, box(3.0, 2.8, 0.2, 0x2a040a), 0, 1.0, -0.35);
    const pr = prince3D(); pr.scale.setScalar(0.68); pr.position.set(0.5, 1.03, 0); boxG.add(pr);
    const cl = k.actor('claude', 0.95).wear('crown');
    k.add(spotCone(0.2, 2.8, 7, 0xfff0c0, 0.18), 3.6, 2.2, -1.0);
    const wait = txt('等待', 1.0, { font: FONT.hei, color: '#fff', sp: 0.45 }); k.add(wait, -3.5, 3.6, 0.3);

    return ({ t, T, bt }) => {
      dance(T, bt, -1.7);
      if (t > 55.86) wh.act('bow', T, 55.86);
      pr.rotation.z = Math.sin(T * 1.5) * 0.05 - 0.08;
      cl.act('shake', T).at(2.85, 2.82, -1.2).emote('fx_exclaim', T);
      slam(wait, t, 54.86, 1, 0.14, 2);
      return cam([0.4, 2.4, 9.6 - seg(t, 54.84, 56.35) * 0.6], [0.4, 2.2, -0.3], 36);
    };
  });

  quip3D('V2x', 56.35, 57.38, 56.96, '多么', '荒诞', 'flip', 'whale_big_blink');

  /* ───── V2d：剧本说：泡沫的升华是真爱的模样（《童话镇》L31 泡沫升空 + 纸船伙伴） ───── */
  shot('V2d', 57.38, 60.92, 'dusk', k => {
    seaHorizon(k, false);
    const wh = k.actor('whale', 1.25).wear('tail');
    const boat = k.add(paperBoat(), -0.5, 0.08, 0.9, -0.2, 0.72);
    const cl = k.actor('claude', 0.9).wear('crown');
    const db = k.actor('doubao', 0.9).wear('hood');
    const slab = scriptSlab3D('剧 本', ['第二幕 · 深海', '人鱼：交出声音。', '人鱼：刀尖起舞。', '王子：另娶他人。', '人鱼：化作泡沫。'], 4);
    k.add(slab);
    const bub = many(44, i => {
      const b = k.add(ball(0.11 + rnd(i) * 0.12, i % 4 ? 0xdff6ff : 0xffffff, false, 0.015));
      const m = b.material as THREE.MeshToonMaterial; m.transparent = true; m.opacity = 0.85; return b;
    });
    const hl = k.add(heart3D(0xffffff, 0.9), 1.4, 3.2, -0.6);

    return ({ t, T, bt, hud }) => {
      const dis = seg(t, 58.14, 58.95), gather = eio(seg(t, 59.0, 59.9)), popK = seg(t, 60.45, 60.75);
      wh.act('sad', T, 57.5).at(1.4, -0.35, 0.2).alpha(1 - dis).noShadow();
      boat.position.set(-0.9, 0.08 + Math.sin(T * 2) * 0.04, 0.8);
      cl.act('petri', T, 58.3).at(-1.2, 0.35 + Math.sin(T * 2) * 0.04, 0.8).noShadow();
      db.act('hop', T).at(-0.55, 0.35 + Math.sin(T * 2) * 0.04, 0.85).noShadow();

      slab.position.set(-2.9, 2.0 + Math.sin(T * 2) * 0.05, 0.8); slab.rotation.set(0, 0.25, 0.05);
      slam(slab, t, 57.42, 0.9, 0.18, 2.1);

      bub.forEach((b, i) => {
        const st = 58.14 + rnd(i * 3) * 0.7, kk = seg(t, st, st + 1.4);
        const x0 = 1.4 + (rnd(i * 5) - 0.5) * 1.4, y0 = 0.2 + rnd(i * 7) * 1.4 + kk * (1.2 + rnd(i) * 2.0);
        const a = (i / 44) * TAU;
        const hx = 1.4 + 0.075 * 16 * Math.pow(Math.sin(a), 3);
        const hy = 3.2 + 0.075 * (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a));
        b.visible = t > st && popK < 1;
        b.position.set(lerp(x0 + Math.sin(T * 3 + i) * 0.15, hx, gather) + popK * Math.cos(a) * 5, lerp(y0, hy, gather) + popK * Math.sin(a) * 4, 0.2);
        b.scale.setScalar((0.6 + 0.4 * Math.sin(T * 5 + i) ** 2) * (1 - popK));
      });
      hl.visible = t > 59.7 && popK < 1;
      setOp(hl, seg(t, 59.7, 60.0) * 0.4 * (1 - popK));
      hl.scale.setScalar(1.1 + bt.pulse * 0.1);
      hud.flash = hit(t, 60.45, 0.25) * 0.5;
      return cam([0.1, lerp(1.6, 2.3, eio(seg(t, 58.5, 60))), 9.4], [0.1, lerp(1.6, 2.3, eio(seg(t, 58.5, 60))), 0], 36);
    };
  });
}
