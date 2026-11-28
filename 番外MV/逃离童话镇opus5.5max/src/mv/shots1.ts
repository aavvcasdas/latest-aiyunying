import * as THREE from 'three';
import {
  BEAT, FONT, Kit, PI, TAU, back, basic, box, bt, cam, cone, cyl, disc, ease, elastic, eo, ei, eio, glide, hit, lerp, many, mesh,
  pop, put, rnd, seg, setOp, shot, slam, sprite3D, txt,
} from './engine';
import {
  PAL, archPortal3D, bar3D, bell3D, blade3D, bubble3D, burst3D, clapper3D, confetti3D, dome3D, heart3D, hunter3D, lips3D,
  prince3D, quill3D, rose3D, scriptSlab3D, stick3D, weddingArch3D, wolf3D,
} from './props';
import { backdropHills, book, buildTown, castle, flower, mushroom, paperBoat, pine, straightRiver, tree, useTown } from './sets3d';
import { K } from './cues';

export const beatSq = (b: { pulse: number; down: boolean }, amt = 0.06) => b.pulse * amt * (b.down ? 1 : 0.6);
export const popUp = (o: THREE.Object3D, t: number, a: number, d = 0.5) => {
  const k = back(seg(t, a, a + d)); o.visible = t >= a; o.rotation.x = (1 - k) * (-PI / 2);
};

/** 3D 狼口咬合：open 0 = 咬死，1 = 张开 */
function jaws3D(k: Kit) {
  const mk = (dir: number) => {
    const g = new THREE.Group();
    put(g, box(14, 5, 0.4, 0x0b070e, 0.03), 0, dir > 0 ? -0.05 : -4.95, 0);
    for (let i = -9; i <= 9; i++) {
      const tooth = cone(0.32, 0.68, 0xfff6ee, 4, 0.02);
      tooth.position.set(i * 0.56 + (dir > 0 ? 0 : 0.28), dir > 0 ? -0.36 : 0.36, 0.2);
      if (dir > 0) tooth.rotation.x = PI;
      g.add(tooth);
    }
    return k.add(g);
  };
  const top = mk(1), bot = mk(-1);
  return (open: number, cx: number, cy: number, cz: number) => {
    top.position.set(cx, cy + 0.06 + (1 - open) * 3.8, cz);
    bot.position.set(cx, cy - 0.06 - (1 - open) * 3.8, cz);
    top.visible = bot.visible = open > 0.002;
  };
}

/** 婚礼布景（P3c 用；S0 定格时再搭一份，冻结在同一刻） */
function weddingSet(k: Kit, cx: number, cz: number) {
  const arch = k.add(weddingArch3D(3.4, 3.4), cx, 0.05, cz - 1.1);
  const bells = [-0.75, 0.75].map(dx => k.add(bell3D(), cx + dx, 5.2, cz - 1.0));
  const pr = k.add(prince3D()); pr.scale.setScalar(0.92);
  const claude = k.actor('claude').wear('crown');
  const guests = ([['whale', -3.4, 1.4], ['doubao', -4.6, 2.0], ['kimi', -2.4, 2.3], ['qwen', 3.0, 1.5], ['gemini', 4.2, 2.0], ['zai', 2.2, 2.4]] as const)
    .map(([id, dx, dz]) => { const a = k.actor(id); if (id === 'doubao') a.wear('hood'); if (id === 'qwen') a.wear('tophat'); if (id === 'gemini') a.wear('bow'); if (id === 'kimi') a.wear('tiara'); return { a, dx, dz, id }; });
  const rib = k.add(new THREE.Group());
  put(rib, box(8.2, 1.0, 0.14, PAL.white), 0, -0.5, -0.05);
  put(rib, box(7.9, 0.8, 0.16, 0xe01b24, 0.02), 0, -0.4, 0);
  const ribT = txt('Happily Ever After', 0.52, { font: FONT.serif, color: '#fff', weight: '900', sp: 0.03, depth: false }); ribT.position.set(0, 0, 0.12); rib.add(ribT);
  const sign = k.add(new THREE.Group());
  put(sign, box(3.4, 1.1, 0.14, PAL.paper), 0, -0.55, -0.05);
  const st = txt('THE END', 0.6, { font: FONT.serif, color: '#b30a14', weight: '900', depth: false }); st.position.z = 0.08; sign.add(st);
  for (const s of [-1, 1]) put(sign, cyl(0.02, 0.02, 6, 0xffffff, 4, 0), s * 1.4, 0, 0);
  const conf = confetti3D(46, [0xffffff, PAL.goldL, PAL.rose, 0xffb3da], k.root, 12, 8, cz + 1);
  const fwA = burst3D(k.root, 26, 0xffd166), fwB = burst3D(k.root, 26, 0xff7cc4), fwC = burst3D(k.root, 20, 0x7fe3ff);
  const hearts = many(8, () => k.add(sprite3D('heart', 0.5)));
  /** T = 时间（S0 传入定格时刻）；solo = 新郎新娘被拎到前景（定格里不再画他们） */
  return (T: number, solo = false) => {
    const ring = seg(T, K.live, K.live + 2.4), sw = Math.sin((T - K.live) * 6.5) * 0.55 * (1 - ring) * (T > K.live ? 1 : 0);
    bells.forEach((b, i) => { b.rotation.z = sw * (i ? -1 : 1); });
    pr.visible = !solo; pr.position.set(cx + 0.75, 0.05 + Math.abs(Math.sin(T * 6)) * 0.04, cz - 0.6); pr.rotation.y = -0.15;
    claude.act(T < K.happily ? 'curtsy' : 'idle', T, K.live).at(cx - 0.7, 0.05, cz - 0.55);
    if (T > K.happily) claude.emote('fx_sweat', T);
    if (solo) claude.hide();
    guests.forEach(({ a, dx, dz, id }, i) => {
      const cheer = T > K.live;
      if (id === 'whale') a.act(cheer ? 'shake' : 'idle', T, K.live).emote(T > K.happily ? 'fx_gloom' : null, T);
      else if (id === 'doubao') a.act(cheer ? 'tilt' : 'idle', T, K.live);
      else a.act(cheer ? 'hop' : 'idle', T + i * 0.13);
      a.at(cx + dx, 0.05, cz + dz).flip(dx > 0);
    });
    rib.position.set(cx, lerp(10, 4.9, elastic(seg(T, K.happily, K.happily + 1.0))), cz + 0.4);
    rib.rotation.z = -0.02 + Math.sin(T * 2) * 0.012;
    sign.position.set(cx, lerp(11, 3.0, eo(seg(T, K.theEnd, K.theEnd + 0.32))) + Math.sin(seg(T, K.theEnd + 0.32, K.theEnd + 0.8) * PI) * 0.15, cz + 1.4);
    sign.visible = T > K.theEnd;
    conf(T, T > K.happily);
    fwA(T, K.ever, cx - 3.5, 8.5, cz - 8); fwB(T, K.after, cx + 3.8, 9.5, cz - 9); fwC(T, K.after + 0.25, cx + 0.5, 10.5, cz - 10);
    hearts.forEach((h, i) => {
      const ph = ((T - K.live) * 0.5 + i / 8) % 1;
      h.visible = T > K.live; h.position.set(cx + Math.sin(ph * 6 + i) * 1.6, 1.2 + ph * 3.8, cz - 0.4); setOp(h, Math.sin(ph * PI));
    });
    return { arch };
  };
}

export function reg1() {
  /* ───── P1：翻开立体童话书 → 跃入书里的森林 → Little Red Riding Hood (5.40) gets lost (6.50) ───── */
  shot('P1', 0, 8.15, 'day', k => {
    k.add(disc(240, 0x7fcf66)); backdropHills(k, 0x79b98a, 0x6aa9c9);
    k.add(box(15, 0.5, 11, 0x6b4630), 0, -0.5, 0);
    const bk = book(); k.add(bk.g);
    k.add(cyl(0.22, 0.26, 1.3, 0xfff2dc, 10), -5.2, 0, -2.8);
    const flame = k.add(sprite3D('glow', 1.8, 0xffb347, true, 0.9), -5.2, 1.65, -2.8);
    k.add(cyl(0.45, 0.55, 0.85, 0x2f4f8f, 10), 5.2, 0, -3.0);
    const ql = quill3D(0xfffaf0); ql.scale.setScalar(0.7); ql.rotation.z = -0.35; k.add(ql, 5.2, 0.9, -3.0);
    const title = txt('逃离童话镇', 0.54, { font: FONT.brush, vertical: true, rough: true, color: '#fff6d6', stroke: '#4a1820', sw: 0.045 });
    k.add(title, 0.3, 2.55, 2.2);

    const popGrp = k.add(new THREE.Group(), 0, 0.85, 0);
    popGrp.add(straightRiver(18, 2.6, 1, -2.2, 0.04).mesh);
    put(popGrp, box(14, 0.05, 1.5, 0xf0dfb8, 0), 0, 0.01, 0.6);
    const trees = many(11, i => {
      const p = i % 3 ? pine(2.0 + rnd(i) * 1.4, i % 2 ? 0x235c48 : 0x2f7a55) : tree(1.8 + rnd(i) * 0.9, 0x55c060, i);
      p.position.set(-5.8 + i * 1.15 + (rnd(i * 3) - 0.5) * 0.4, 0, -0.7 - (i % 3) * 0.9 - rnd(i) * 1.2); popGrp.add(p); return p;
    });
    const mush = many(4, i => { const m = mushroom(0.38 + rnd(i) * 0.16, 0xe63946); m.position.set([-4.1, -2.5, 2.8, 4.1][i], 0, 1.55 + (i % 2) * 0.35); popGrp.add(m); return m; });
    const sign = put(popGrp, new THREE.Group(), 1.4, 0, -0.35);
    put(sign, cyl(0.06, 0.08, 1.6, 0x6b4630, 6), 0, 0, 0);
    const a1 = put(sign, box(1.1, 0.22, 0.08, 0xf6e2b3, 0.02), 0, 1.4, 0);
    const a2 = put(sign, box(1.1, 0.22, 0.08, 0xffd166, 0.02), 0, 1.08, 0);

    const boat = paperBoat(); boat.scale.setScalar(0.55); popGrp.add(boat);
    const whale = k.actor('whale', 0.95);
    const doubao = k.actor('doubao', 0.95).wear('hood');
    const gem = k.actor('gemini', 0.9).wear('bow');
    const basket = k.thing('prop_basket', 0.9);
    const sparks = many(20, i => k.add(sprite3D('star', 0.45, i % 3 ? 0xfff2a8 : 0xffffff, true)));

    const A = cam([-2.4, 5.2, 12.8], [0, 1.0, 0.4], 40), B = cam([0.4, 3.0, 7.6], [0.2, 1.55, 0.1], 36), C = cam([0.4, 2.2, 5.4], [-0.3, 1.5, 0.1], 34);
    return ({ t, T, bt: b, hud }) => {
      const open = eio(seg(t, K.bookOpen, 2.1));
      bk.cover.rotation.z = open * 2.85;
      (bk.glow.material as THREE.MeshBasicMaterial).opacity = open * 0.85 * (1 - seg(t, 3.2, 4.4)) + hit(t, K.bookGlow, 0.6) * 0.3;
      (title.material as THREE.Material).opacity = seg(t, 0.3, 1.0) * (1 - seg(t, 1.75, 2.25));
      title.visible = t < 2.25; title.position.y = 2.55 + Math.sin(T * 2) * 0.05;
      flame.scale.setScalar(1.6 + 0.18 * Math.sin(T * 9));
      trees.forEach((m, i) => popUp(m, t, 2.3 + i * 0.08, 0.42));
      mush.forEach((m, i) => popUp(m, t, 2.6 + i * 0.12, 0.4));
      popUp(sign, t, 3.2, 0.45);
      a1.rotation.y = t > K.signSpin ? (t - K.signSpin) * 9 : 0.2; a2.rotation.y = t > K.signSpin ? -(t - K.signSpin) * 12 : -0.3;

      // 本鲸跑向书、起跳（1.9）、落在书里的纸船上（3.3），之后坐船看着小红帽
      const jump = seg(t, K.whaleJump, K.whaleLand);
      if (t < K.whaleJump) { whale.walkBy(t * 2.4).at(lerp(-5.6, -3.3, seg(t, 0, K.whaleJump)), 0, 3.2); boat.visible = false; }
      else if (jump < 1) { whale.act('wave', T).at(lerp(-3.3, -1.6, jump), lerp(0, 0.95, jump), lerp(3.2, -1.9, jump)).lift(Math.sin(jump * PI) * 2.4); boat.visible = true; boat.position.set(-1.6, 0.0, -2.0); }
      else {
        const bx = lerp(-1.6, 1.9, seg(t, 3.4, 8.15));
        boat.visible = true; boat.position.set(bx, 0.07 + Math.sin(T * 2.4) * 0.03, -2.0); boat.rotation.z = Math.sin(T * 1.8) * 0.04;
        whale.act(t > K.whaleSees ? 'point' : 'wave', T, K.whaleSees).at(bx, 1.12 + Math.sin(T * 2.4) * 0.03, -2.0).noShadow().sq(beatSq(b, 0.04));
        if (t > K.whaleSees) whale.emote('fx_exclaim', T);
      }
      // Little Red Riding Hood（5.40）走进来；gets lost（6.50）停下；lost（6.78）冒问号、左右张望
      const walk = seg(t, K.little, K.getsLost), dx = lerp(-4.4, -0.3, walk);
      if (t < K.little) { doubao.hide(); basket.hide(); gem.hide(); }
      else {
        if (walk < 1) doubao.walkBy((dx + 4.4) * 1.3).at(dx, 0.86, 0.65);
        else { doubao.act('tilt', T, K.lost).at(dx, 0.86, 0.65).flip(t > 6.95 && t < 7.4); if (t > K.lost) doubao.emote('fx_question', T); }
        basket.at(dx + 0.34, 0.88 + (walk < 1 ? Math.abs(Math.sin(T * 9)) * 0.05 : 0), 0.72);
        gem.act(t > K.signSpin ? 'choose' : 'lookaround', T, K.signSpin).at(2.1, 0.86, 0.25).flip();
      }
      sparks.forEach((s, i) => { const ph = (T * 0.45 + rnd(i)) % 1; s.position.set((rnd(i + 9) - 0.5) * 6, 1.0 + ph * 3.8, (rnd(i + 5) - 0.5) * 5); setOp(s, open * Math.sin(ph * PI) * 0.8); });
      hud.fade = 1 - seg(t, 0, 0.6);
      if (t < 2.0) return glide(A, B, seg(t, 0, 2.0) * 0.35);
      if (t < 5.2) return glide(cam([-1.6, 4.4, 10.8], [0, 1.2, 0.3], 39), B, seg(t, 2.0, 5.2));
      return glide(B, C, seg(t, 5.2, 7.6));
    };
  });

  /* ───── P2：meets（8.24）the Big（8.79）Bad（9.11）Wolf（9.30）… and is（10.32）eaten（10.64→10.97 咬合） ───── */
  shot('P2', 8.15, K.pageA, 'forest', k => {
    k.add(disc(220, 0x2a5744));
    k.add(box(70, 0.06, 2.6, 0x6a5a48, 0), 0, 0, 0.3);
    many(28, i => k.add(pine(4.8 + rnd(i) * 3.8, i % 2 ? 0x1e523f : 0x2b6e4e), -16 + i * 1.2 + rnd(i + 1), 0, -2.5 - rnd(i + 5) * 9));
    k.add(pine(8, 0x163d30), -5.2, 0, 3.0); k.add(pine(8.5, 0x163d30), 6.2, 0, 3.1);
    many(6, i => k.add(mushroom(0.5 + rnd(i) * 0.3, 0xe63946), -5.5 + i * 2.2, 0, -1.2 - rnd(i) * 0.8));
    const bush = k.add(mesh(new THREE.IcosahedronGeometry(1.5, 1), new THREE.MeshToonMaterial({ color: 0x1f4a3a }), 0.05), 2.6, 0.6, -1.4);
    const eyes = many(2, () => k.add(sprite3D('glow', 0.75, 0xff2d4a, true)));
    const flies = many(14, () => k.add(sprite3D('glow', 0.32, 0xd8ff8a, true)));
    const doubao = k.actor('doubao').wear('hood');
    const basket = k.thing('prop_basket');
    const whale = k.actor('whale');
    const gptShadow = k.actor('gpt', 1.55).wear('ears');
    const wf = k.add(wolf3D(0x161022, 0xff2d4a));
    const jw = jaws3D(k);
    const word = txt('然后——被吃掉。', 0.24, { font: FONT.brush, color: '#ff3b4a', stroke: '#000', sw: 0.03 }); k.add(word);

    const A = cam([-2.2, 1.5, 7.6], [-0.4, 1.15, 0], 36), B = cam([0.6, 1.55, 6.0], [0.4, 1.3, -0.4], 38);
    return ({ t, T, hud }) => {
      const leap = back(seg(t, K.wolf, K.wolf + 0.35)), lunge = ei(seg(t, K.is, K.eaten + 0.1));
      doubao.act('surprise', T, K.big).at(-0.8 + (t > K.big ? Math.sin(T * 42) * 0.015 : 0) - lunge * 0.3, 0, 0.2).flip(t < K.meets);
      if (t > K.big) doubao.emote(t < K.is ? 'fx_exclaim' : 'fx_sweat', T);
      basket.at(-0.42, 0.25, 0.32);
      eyes.forEach((e, i) => { e.position.set(2.45 + (i ? 0.32 : -0.06), 1.35, -0.2); setOp(e, seg(t, K.big, K.big + 0.12) * (1 - leap) * (0.7 + 0.3 * Math.sin(T * 9))); });
      bush.scale.set(1 + hit(t, K.big, 0.3) * 0.08, 1 + hit(t, K.bad, 0.3) * 0.1, 1);
      gptShadow.set('gpt_boss_rage').at(2.6, 0, -3.6).lift(lerp(-2.4, 0, eo(seg(t, K.bad, K.bad + 0.25)))).sil(1, 0x0b0816).noShadow();
      wf.position.set(lerp(3.0, 0.7, lunge), lerp(-2.6, -0.25, leap), -0.4 + lunge * 1.6);
      wf.scale.setScalar(1.0 + lunge * 0.85); wf.visible = t > K.wolf;
      wf.userData.jaw.rotation.z = -0.15 - Math.sin(T * 6) * 0.1 - lunge * 0.5;
      const wx = lerp(-4.6, -2.2, eo(seg(t, 9.4, 10.05)));
      if (t < 9.4) whale.hide(); else if (t < 10.05) whale.walkBy(wx + 4.6).at(wx, 0, 0.5); else whale.act('point', T, 10.05).at(wx, 0, 0.5).emote('fx_anger', T);
      flies.forEach((s, i) => { s.position.set(-6 + rnd(i) * 12 + Math.sin(T * 0.7 + i) * 0.5, 0.6 + rnd(i + 4) * 2.4, -2 + rnd(i + 8) * 3); setOp(s, 0.4 + 0.5 * Math.sin(T * 2.3 + i)); });
      const cs = glide(A, B, ease(seg(t, 8.3, 10.4)) * 0.85 + seg(t, 8.15, 12.05) * 0.15);
      jw(eo(seg(t, K.eaten, K.chomp)), cs.l[0], cs.l[1], cs.p[2] - 2.2);
      word.position.set(cs.l[0], cs.l[1] - 0.05, cs.p[2] - 1.75);
      (word.material as THREE.Material).opacity = seg(t, K.eatenText, K.eatenText + 0.3); word.visible = t > K.eatenText;
      hud.shake = hit(t, K.big, 0.3) * 0.15 + hit(t, K.wolf, 0.35) * 0.25 + hit(t, K.chomp, 0.35) * 0.45;
      hud.flash = hit(t, K.chomp, 0.12) * 0.35; hud.flashCol = '#ff2a4a';
      return cs;
    };
  });

  /* ───── P3a：And in the end? —— 月夜森林里，纸板猎人剖开狼肚子（end? 12.78），小红帽蹦出来 ───── */
  shot('P3a', K.pageA, K.pageB, 'night', k => {
    k.add(disc(220, 0x1f3a40));
    many(22, i => k.add(pine(5.5 + rnd(i) * 4, 0x1c4a3a), -16 + i * 1.5 + rnd(i + 2), 0, -4.5 - rnd(i + 4) * 8));
    k.add(new THREE.Mesh(new THREE.SphereGeometry(2.2, 18, 12), basic(0xfff3c4)), -7, 10, -30); k.add(sprite3D('glow', 12, 0xfff6cf, true, 0.45), -7, 10, -29);
    k.add(box(30, 0.05, 2.4, 0x55483a, 0), 0, 0, 0.6);
    const wf = k.add(wolf3D(0x2a2238, 0xff2d4a), 0.3, 0, -0.6); wf.scale.setScalar(1.15);
    const belly = wf.children[0]; belly.scale.set(1.75, 1.25, 1.1);
    const zz = many(3, () => k.add(sprite3D('zzz', 0.5)));
    const hu = k.add(new THREE.Group());
    const hFig = hunter3D(0x3a2a20); hu.add(hFig); hu.add(stick3D(2.4).translateY(-2.3));
    const bl = blade3D(1.0, 0xf2f6ff); bl.position.set(0.75, 1.9, 0.2); hu.add(bl);
    const slashFx = k.add(bar3D(-1.6, -0.5, 1.6, 0.5, 0.09, 0xffffff, true), 0.9, 1.25, 0.9);
    const db = k.actor('doubao').wear('hood');
    const whale = k.actor('whale');
    const stars = many(14, () => k.add(sprite3D('star', 0.5, 0xfff2a8, true)));
    return ({ t, T, hud }) => {
      const cut = t > K.end, fall = eo(seg(t, K.end, K.end + 0.4)), out = seg(t, K.popOut, K.popOut + 0.55);
      wf.rotation.z = fall * 0.32; wf.position.y = -fall * 0.2;
      belly.scale.set(lerp(1.75, 1.3, fall), lerp(1.25, 0.95, fall), 1.1);
      wf.userData.jaw.rotation.z = cut ? -0.5 : -0.1 + Math.sin(T * 2) * 0.05;
      zz.forEach((z, i) => { const ph = (T * 0.45 + i / 3) % 1; z.position.set(-0.7 + ph * 0.8, 2.5 + ph * 1.2, -0.4); setOp(z, cut ? 0 : Math.sin(ph * PI)); });
      // 猎人：And（12.18）顺着木棍滑进来，in the（12.36）举刀，end?（12.78）一刀剖开
      hu.position.set(lerp(6.5, 2.0, eo(seg(t, K.andEnd, K.andEnd + 0.3))), Math.abs(Math.sin(T * 7)) * 0.05 * (t < K.end ? 1 : 0), 0.4);
      bl.rotation.z = t < K.inThe ? 0.2 : t < K.end ? lerp(0.2, -1.2, eo(seg(t, K.inThe, K.inThe + 0.2))) : lerp(-1.2, 1.4, eo(seg(t, K.end, K.end + 0.1)));
      slashFx.visible = t > K.end && t < K.end + 0.18; slashFx.scale.x = eo(seg(t, K.end, K.end + 0.08));
      // 小红帽从狼肚子里蹦出来（12.98），落地后开心地跳
      if (t < K.popOut) db.hide();
      else db.act(out < 1 ? 'surprise' : 'hop', T, K.popOut).at(lerp(0.9, -0.9, out), 0.05, lerp(0.2, 0.9, out)).lift(Math.sin(out * PI) * 1.6).emote(out >= 1 ? 'fx_heart' : null, T);
      whale.act(t > K.popOut ? 'hop' : 'surprise', T, K.end).at(-3.4, 0, 0.3).emote(t > K.popOut ? 'fx_sparkle' : null, T);
      stars.forEach((s, i) => { const r = eo(seg(t, K.popOut, K.popOut + 0.6)) * 2.4, a = (i / 14) * TAU; s.position.set(0.6 + Math.cos(a) * r, 1.6 + Math.sin(a) * r * 0.8, 0.5); setOp(s, t > K.popOut ? 1 - seg(t, K.popOut + 0.3, K.popOut + 0.8) : 0); });
      hud.flash = hit(t, K.end, 0.12) * 0.7; hud.shake = hit(t, K.end, 0.25) * 0.3;
      return cam([lerp(0.6, 0.2, seg(t, 12.05, 13.8)), 1.7, lerp(8.6, 7.4, seg(t, 12.05, 13.8))], [0.3, 1.35, 0], 36);
    };
  });

  /* ───── P3b：The princess（13.82）and the prince（15.02）always（15.24）get（15.68 吻）married（16.0 被吻醒） ───── */
  shot('P3b', K.pageB, K.pageC, 'golden', k => {
    k.add(disc(320, 0x86d36b)); backdropHills(k, 0x9ac27a, 0xc9a27a);
    k.add(castle(), 0, 0, -18, 0, 0.9);
    many(8, i => { if (i === 3 || i === 4) return; k.add(box(2.2, 1.0, 1.0, 0x3f9f5a), -7.7 + i * 2.2, 0, -3.2); });
    many(20, i => k.add(flower([0xff7aa8, 0xffd166, 0xffffff, 0xb388ff][i % 4], 0.35 + rnd(i) * 0.3), -6 + rnd(i) * 12, 0, 1.2 + rnd(i + 5) * 2.4));
    k.add(box(3.9, 0.6, 1.8, 0xe9d6f5)); const pl = k.add(mesh(new THREE.SphereGeometry(0.45, 14, 10), new THREE.MeshToonMaterial({ color: 0xffffff }), 0.03), -1.3, 0.72, -0.2); pl.scale.set(1.2, 0.5, 0.9);
    const roses = many(14, i => k.add(rose3D(0.22, i % 3 ? 0xe63946 : 0xffffff), -1.9 + (i % 7) * 0.62, 0.62, i < 7 ? -0.75 : 0.75));
    const dome = k.add(dome3D(1.95), 0, 0.6, 0);
    const claude = k.actor('claude').wear('crown');
    const pr = k.add(prince3D()); pr.add(stick3D(2.4).translateY(-2.3)); pr.scale.setScalar(0.95);
    const lp = k.add(lips3D(0xff2d55, 0.22));
    const hearts = many(10, () => k.add(sprite3D('heart', 0.45)));
    const kimi = k.actor('kimi').wear('tiara');
    const scr = k.thing('prop_book', 1.2);
    return ({ t, T, hud }) => {
      roses.forEach((r, i) => r.scale.setScalar(Math.max(0.001, pop(t, K.princess + i * 0.05, 0.3))));
      const lift = eo(seg(t, K.always, K.always + 0.35));
      dome.position.y = 0.6 + lift * 3.6; setOp(dome, 0.2 * (1 - lift));
      const awake = t > K.married;
      if (!awake) claude.set('claude_front_1').at(1.15, 1.2 + Math.sin(T * 1.6) * 0.012, 0.05).tilt(PI / 2).noShadow();
      else claude.act(t < K.married + 0.5 ? 'petri' : 'idle', T, K.married).at(0.2, 0.62, 0.15).emote(t > 16.3 ? 'fx_sweat' : 'fx_exclaim', T);
      const lean = eo(seg(t, K.always, K.kiss)) * (1 - eo(seg(t, K.married, K.married + 0.3)));
      pr.position.set(lerp(6.5, 1.75, back(seg(t, K.prince, K.prince + 0.35))), 0.05, 0.9); pr.rotation.z = lean * 0.45; pr.rotation.y = -0.3;
      lp.visible = t > K.kiss && t < K.married + 0.4; lp.position.set(1.25, 2.75 + seg(t, K.kiss, K.married + 0.4) * 0.5, 1.0);
      lp.scale.setScalar(Math.max(0.01, pop(t, K.kiss, 0.2) * (1 + hit(t, K.kiss, 0.3) * 0.3)));
      hearts.forEach((h, i) => { const r = eo(seg(t, K.married, K.married + 0.7)) * 2.4, a = (i / 10) * TAU; h.position.set(0.5 + Math.cos(a) * r, 1.9 + Math.sin(a) * r * 0.75, 1.0); h.visible = t > K.married; setOp(h, 1 - seg(t, K.married + 0.5, K.married + 1.1)); });
      kimi.act('think', T).at(-4.2, 0, 1.1); scr.at(-3.75, 0.7, 1.25);
      hud.flash = hit(t, K.married, 0.15) * 0.4; hud.flashCol = '#ffe0f0';
      const A = cam([-1.4, 3.6, 9.6], [0, 1.0, 0], 38), B = cam([1.2, 1.9, 5.6], [0.6, 1.25, 0.2], 34);
      return glide(A, B, seg(t, 13.8, 16.2));
    };
  });

  /* ───── P3c：and live（17.34 钟声）happily（17.94 彩带）ever（18.54 烟花）after（19.22 烟花）—— THE END 落下（19.6） ───── */
  shot('P3c', K.pageC, 20.35, 'day', k => {
    const town = k.shared('town', buildTown);
    const cx = 33, cz = 17;
    const set = weddingSet(k, cx, cz);
    return ({ t, hud }) => {
      useTown(k, town, 1, false);
      set(t);
      hud.shake = hit(t, K.theEnd + 0.32, 0.25) * 0.25;
      const A = cam([cx - 0.3, 2.0, cz + 8.4], [cx, 2.2, cz - 2], 38), B = cam([cx + 0.2, 2.8, cz + 11.6], [cx, 3.0, cz - 4], 40);
      return glide(A, B, seg(t, 17.25, 20.35));
    };
  });

  /* ───── S0：Stop!（20.42）—— 整个婚礼定格褪色，场记板「啪」地合上，本鲸一指叫停；小克一脚踢飞纸板王子（20.85） ───── */
  shot('S0', 20.35, 21.5, 'day', k => {
    const town = k.shared('town', buildTown);
    const cx = 33, cz = 17;
    const set = weddingSet(k, cx, cz);
    const veil = k.add(new THREE.Mesh(new THREE.PlaneGeometry(40, 24), new THREE.MeshBasicMaterial({ color: 0x7a0a4a, transparent: true, opacity: 0, depthWrite: false })), cx, 3, cz + 3.2);
    const cl = clapper3D(); k.add(cl.g); cl.g.scale.setScalar(0.85);
    const wh = k.actor('whale', 1.25);
    const kicker = k.actor('claude', 1.0).wear('crown');
    const pr = k.add(prince3D()); pr.scale.setScalar(0.8);
    const letters = [...'STOP!'].map((ch, i) => {
      const m = txt(ch, 1.25, { font: FONT.hei, color: '#fff', stroke: '#0a0607', sw: 0.06, px: 200 });
      k.add(m, cx - 1.45 + i * 0.74, 3.05 + i * 0.07, cz + 5.6); m.rotation.z = 0.08 + (rnd(i) - 0.5) * 0.14; return m;
    });
    return ({ t, T, hud }) => {
      useTown(k, town, 1, false);
      set(K.stop, true); // 定格在「Stop!」那一刻，新娘和纸板王子被拎到前景
      (veil.material as THREE.MeshBasicMaterial).opacity = 0.55 * eo(seg(t, K.stop, K.stop + 0.12));
      const close = t >= K.stop ? 0 : 0.6;
      cl.hinge.rotation.z = close; cl.g.position.set(cx + 2.05, lerp(6, 0.7, eo(seg(t, 20.35, K.stop))) + hit(t, K.stop, 0.2) * -0.08, cz + 4.6); cl.g.rotation.z = -0.12;
      wh.set('whale_big_point').at(lerp(cx - 6.5, cx - 1.75, eo(seg(t, K.stop - 0.05, K.stop + 0.12))), 0.05, cz + 4.4).emote('fx_exclaim', T);
      kicker.act(t < K.kick ? 'idle' : 'hop', T, K.kick).at(cx - 0.5, 0.05, cz + 3.8);
      const kick = eo(seg(t, K.kick, K.kick + 0.55));
      pr.position.set(cx + 0.4 + kick * 7, 0.05 + Math.sin(kick * PI) * 3.2, cz + 3.6); pr.rotation.z = -kick * 3.2; pr.rotation.y = kick * 4;
      letters.forEach((m, i) => slam(m, t, K.stop + i * 0.04, 1, 0.15, 2.8));
      hud.flash = hit(t, K.stop, 0.12) * 0.85; hud.shake = hit(t, K.stop, 0.3) * 0.4 + hit(t, K.kick, 0.2) * 0.2; hud.bars = 1.45;
      return cam([cx, 2.3, cz + 12.4 - eo(seg(t, K.stop, 21.5)) * 0.7], [cx, 2.2, cz + 2], 38, -0.03);
    };
  });

  /* ───── S1：I（21.60）don't（21.80）like（21.95）that（22.14）story（22.36）—— 划掉 THE END ───── */
  shot('S1', 21.5, 23.25, 'magenta', k => {
    k.add(disc(140, 0x260824));
    const bk = book(); bk.g.scale.setScalar(0.75); k.add(bk.g, 3.6, 0.8, -1.5, -0.3);
    const slab = scriptSlab3D('THE END', ['公主嫁给了王子', '从此以后', '幸福地生活在一起', '……全剧终'], 2); k.add(slab);
    const x1 = k.add(bar3D(-1.9, -1.9, 1.9, 1.9, 0.36, 0x0b0a0c, true)), x2 = k.add(bar3D(-1.9, 1.9, 1.9, -1.9, 0.36, 0x0b0a0c, true));
    const wh = k.actor('whale', 1.45);
    const cl = k.actor('claude', 1.15).wear('crown');
    const km = k.actor('kimi', 1.1).wear('tiara');
    const scr = k.thing('prop_scroll', 1.1);
    const P: [string, number, number, number, number][] = [
      ['I', K.I, -1.7, 3.45, 0.7], ["DON'T", K.dont, -0.4, 2.75, 0.88], ['LIKE', K.like, -0.8, 1.98, 0.88], ['THAT', K.that, -1.0, 1.28, 0.66], ['STORY.', K.story, -0.2, 0.52, 0.94],
    ];
    const words = P.map((p, i) => { const m = txt(p[0], p[4], { font: FONT.hei, color: i === 4 ? '#ffd166' : '#ffffff', stroke: '#0b0a0c', sw: 0.045, sp: 0.05 }); k.add(m, p[2], p[3], 0.9); m.rotation.z = (rnd(i + 3) - 0.5) * 0.1; return m; });
    return ({ t, T, hud }) => {
      const fall = ei(seg(t, 22.75, 23.1));
      bk.cover.rotation.z = 2.6; (bk.glow.material as THREE.MeshBasicMaterial).opacity = 0.4;
      slab.position.set(3.4, 2.2 - fall * 4.5, 0); slab.rotation.z = -0.1 - fall * 0.6; slab.scale.setScalar(0.95);
      [x1, x2].forEach((x, i) => { slam(x, t, K.story + 0.04 + i * 0.12, 1, 0.1, 2); x.position.set(3.4, 2.2 - fall * 4.5, 0.3); });
      wh.act('shake', T, K.I).at(-3.9, 0, 0.8);
      cl.act('shake', T, K.like).at(-2.8, 0, -0.6).emote('fx_anger', T);
      km.act('think', T).at(1.2, 0, -1.1); scr.at(1.7, 0.75, -0.95);
      words.forEach((m, i) => slam(m, t, P[i][1], 1, 0.13, 2.2));
      hud.bars = 1.45; hud.shake = hit(t, K.story, 0.25) * 0.35;
      return cam([0, 1.9, 9.6], [0, 1.9, 0], 36, 0.02);
    };
  });

  /* ───── S2：We（23.32）CAN（23.48）CHANGE（23.68 撕书）IT!（23.90） ───── */
  shot('S2', 23.25, bt(47), 'magenta', k => {
    k.add(disc(140, 0x160418));
    k.add(castle(), -5, 0, -26, 0.2);
    const wh = k.actor('whale', 1.45);
    const db = k.actor('doubao', 1.2).wear('hood');
    const cl = k.actor('claude', 1.2).wear('crown');
    const gp = k.actor('gpt', 1.1);
    const P: [string, number, number, number, number, string][] = [
      ['WE', K.we, -3.7, 3.05, 1.25, '#ff7cc4'], ['CAN', K.can, -0.6, 3.05, 1.25, '#ff7cc4'], ['CHANGE', K.change, -2.4, 1.45, 1.25, '#ffffff'], ['IT!', K.it, 2.0, 1.45, 1.25, '#ffd166'],
    ];
    const words = P.map(p => { const m = txt(p[0], p[4], { font: FONT.serif, weight: '900', color: p[5], stroke: '#0b0a0c', sw: 0.04 }); k.add(m, p[2], p[3], 0.5); return m; });
    const pages = many(16, i => k.add(box(0.65, 0.85, 0.02, i % 3 ? PAL.paper : PAL.white, 0.02)));
    const ring = k.add(mesh(new THREE.TorusGeometry(2.6, 0.06, 6, 36), basic(0xffffff), 0), 3.6, 1.8, 0.2);
    return ({ t, T, hud }) => {
      const burst = t >= K.change;
      wh.act(burst ? 'point' : 'hop', T, K.we).at(3.5, 0, 1.1).flip().lift(hit(t, K.change, 0.3) * 0.45);
      db.act('hop', T).at(-4.1, 0, -0.5).lift(burst ? 0.35 : 0);
      cl.act('hop', T).at(-2.7, 0, -0.9).lift(burst ? 0.25 : 0);
      gp.act('cast', T).at(4.4, 0.5, -1.2).flip().noShadow();
      words.forEach((m, i) => slam(m, t, P[i][1], 1 + (i === 2 ? hit(t, K.change, 0.3) * 0.1 : 0), 0.13, 2.5));
      pages.forEach((m, i) => { const kk = seg(t, K.change - 0.05 + rnd(i) * 0.25, 24.5); m.visible = t > K.change - 0.05; m.position.set((rnd(i * 3) - 0.5) * 11, -0.5 + kk * (6 + rnd(i * 5) * 4), (rnd(i * 7) - 0.5) * 4); m.rotation.set(T * 3 + i, T * 4 + i, i); });
      ring.scale.setScalar(0.2 + eo(seg(t, K.change, 24.5)) * 1.4); ring.visible = burst;
      hud.bars = 1.45; hud.shake = hit(t, K.change, 0.3) * 0.4 + hit(t, K.we, 0.15) * 0.18; hud.flash = hit(t, K.change, 0.12) * 0.5;
      return cam([0, 1.8, 9.8 - seg(t, 23.25, 24.5) * 0.8], [0, 1.8, 0], 36, -0.02);
    };
  });

  /* ───── IN：片头——城堡前四座石拱门逐拍点亮四位主角（第 47–50 拍），片名逐字落下，第 54 拍烟花 ───── */
  shot('IN', bt(47), bt(55), 'crimson', k => {
    k.add(disc(260, 0x260812));
    k.add(castle(), 0, 0, -26, 0, 1.3);
    const fwJ = [0, 1, 2, 3].map(j => burst3D(k.root, 18, [0xff6b8a, 0xffd166, 0x7fe3ff, 0xff7cc4][j]));
    const who = ['doubao', 'whale', 'claude', 'gpt'] as const;
    const arches = who.map((w, i) => {
      const g = new THREE.Group(); k.add(g);
      const x = -4.5 + i * 3.0, z = -Math.abs(i - 1.5) * 0.5;
      g.position.set(x, 0, z);
      const portal = archPortal3D(2.3, 4.4, 0x240c18, 0x2a040a); g.add(portal);
      const a = k.actor(w, w === 'gpt' ? 1.1 : 1.25);
      if (w === 'doubao') a.wear('hood'); if (w === 'claude') a.wear('crown');
      return { g, portal, a, x, z, w };
    });
    const chars = [...'逃离童话镇'].map((ch, i) => { const m = txt(ch, 1.55, { font: FONT.brush, color: '#ffffff', stroke: '#16090a', sw: 0.05, rough: true, px: 200 }); k.add(m, -3.7 + i * 1.85, 1.15 + (i % 2 ? -0.15 : 0.15), 2.1); m.rotation.z = (rnd(i * 9) - 0.5) * 0.16; return m; });
    const en = txt('ESCAPE  FROM  FAIRY  TALE  TOWN', 0.25, { font: FONT.hei, color: '#fff', sp: 0.5 }); k.add(en, 0, 0.22, 2.2);
    return ({ t, T, hud }) => {
      const burst = bt(54);
      fwJ.forEach((f, j) => f(t, burst + j * 0.12, -9 + j * 6, 10 + (j % 2) * 2, -22, 4.5));
      arches.forEach((c, i) => {
        const aTime = bt(47 + i), lit = t >= aTime;
        c.portal.userData.backMat.color.setHex(!lit ? 0x22040a : t >= burst ? PAL.mag : 0xffffff);
        c.g.scale.setScalar(1 + hit(t, aTime, 0.28) * 0.1 + hit(t, burst, 0.3) * 0.06);
        if (!lit) c.a.hide();
        else {
          c.a.at(c.x, 0.12, c.z + 0.15).sil(t >= burst ? 0 : 1);
          if (c.w === 'gpt') c.a.act(t >= burst ? 'cast' : 'hover', T); else if (c.w === 'whale') c.a.act(t >= burst ? 'wave' : 'idle', T); else c.a.act(t >= burst ? 'hop' : 'idle', T);
        }
      });
      chars.forEach((m, i) => slam(m, t, bt(51) + i * BEAT * 0.5, 1 + hit(t, burst, 0.3) * 0.1, 0.15, 2.6));
      (en.material as THREE.Material).opacity = seg(t, bt(53.5), bt(54));
      let fl = hit(t, burst, 0.2) * 0.65; for (let i = 0; i < 4; i++) fl += hit(t, bt(47 + i), 0.12) * 0.25;
      hud.flash = fl; hud.flashCol = t >= burst ? '#fff' : '#ff2a4a';
      hud.shake = hit(t, burst, 0.3) * 0.35 + hit(t, bt(51), 0.2) * 0.15;
      return cam([Math.sin(T * 0.7) * 0.4, 2.25, lerp(13.8, 10.6, seg(t, bt(47), bt(55)))], [0, 2.1, -1], 36, Math.sin(T * 0.9) * 0.015);
    };
  });
}
export const _u1 = [bubble3D, heart3D, TAU];
