import * as THREE from 'three';
import { Actor, C, FONT, TAU, at, back, backdrop, ball, box, bt, cone, cyl, disc, ei, eio, eo, flat, grungeTex, hit, lam, lerp, lights, paper, pop, quad, radialTex, ringM, rnd, seg, shot, slam, sprite, txt, vertTex } from './engine';
import { bar, bubble, cottage, ground, heart, knife, pine, prince, rifle, scriptPage, spot, star4, tag, tree, wolf } from './props';

/* ───── 公用小件 ───── */
export function hunter(c = C.ink) {
  const g = new THREE.Group();
  g.add(at(disc(0.32, c), [0, 2.55, 0]), at(quad(1.05, 0.1, c), [0, 2.82, 0]), paper([[-0.3, 2.85], [0.3, 2.85], [0.2, 3.25], [-0.2, 3.25]], c), paper([[-0.55, 2.2], [0.55, 2.2], [0.7, 0], [-0.7, 0]], c));
  const r = rifle(c); r.scale.setScalar(0.55); r.rotation.z = 1.15; r.position.set(0.55, 1.7, 0); g.add(r);
  return g;
}
export function ribs(parent: THREE.Object3D, n = 6, col = 0x4a060c) {
  const arr: THREE.Mesh[] = [];
  for (let i = 0; i < n; i++) { const m = new THREE.Mesh(new THREE.TorusGeometry(3.0 + i * 0.1, 0.13, 5, 18, Math.PI), flat(col)); m.position.set(0, -0.2, 1 - i * 1.5); parent.add(m); arr.push(m); }
  return arr;
}
export function seaSet(s: THREE.Scene, top: number, mid: number, bot: number, sun = true) {
  s.add(backdrop(vertTex(top, bot, mid), 150, 70, -42));
  const g = new THREE.PlaneGeometry(140, 70, 44, 22); g.rotateX(-Math.PI / 2);
  const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, rnd(i * 1.7) * 0.28);
  g.computeVertexNormals();
  const sea = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ color: 0x2b6fe0, flatShading: true })); sea.position.z = -22; s.add(sea);
  if (sun) s.add(at(disc(5.5, C.sun, { fog: false }), [0, 2.2, -41]));
  lights(s, 0.75, 1.1, 0xffe0c8, 0xffd0e8, 0x203a80);
  return sea;
}
export function mermaidTail(h: number) {
  const k = h / 2.6, g = new THREE.Group();
  g.add(paper([[-0.5, 0.86], [0.5, 0.86], [0.32, 0.1], [0.16, -0.5], [0.72, -1.05], [0, -0.8], [-0.72, -1.05], [-0.16, -0.5], [-0.32, 0.1]].map(p => [p[0] * k, p[1] * k]), 0x21c7b0));
  [[-0.15, 0.6], [0.18, 0.5], [0, 0.25], [-0.12, -0.05], [0.12, 0.0]].forEach(p => g.add(at(disc(0.1 * k, 0x8ff5e2, {}, 6), [p[0] * k, p[1] * k, 0.01])));
  g.position.z = 0.03; return g;
}
/** "多么夸张 / 多么荒诞"——品红大字吐槽卡 */
function quip(id: string, a: number, b: number, tBig: number, small: string, big: string, inv: boolean, frame: string) {
  shot(id, a, b, s => {
    s.background = new THREE.Color(inv ? 0x0a0607 : C.mag);
    at(quad(30, 5.7, inv ? C.mag : 0xd40f7a), [0, 2.5, -3], s);
    const wh = new Actor('whale', 5.4); wh.raw(frame); wh.put(inv ? -4.3 : 4.3, -1.1, 0.4); s.add(wh);
    const sm = txt(small, 0.8, { font: FONT.hei, color: '#fff', sp: 0.3 }); at(sm, [inv ? 0.2 : -4.9, 4.4, 0.2], s);
    const bg = [...big].map((c, i) => { const m = txt(c, 3.3, { font: FONT.hei, color: '#0a0607', stroke: '#fff', sw: 0.025, px: 200 }); at(m, [(inv ? 0.6 : -4.4) + i * 3.1, 2.0, 0.3], s); m.rotation.z = (i ? 0.07 : -0.05); return m; });
    const ring = ringM(2.5, 2.53, 0xffffff); at(ring, [inv ? 2.2 : -2.8, 2.2, 0.5], s);
    const l = bar(-14, 0, 14, 0, 0.025, 0xffffff); at(l, [0, 2.5, 0.5], s);
    return { wh, sm, bg, ring, l };
  }, (o, f) => {
    const t = f.t;
    slam(o.sm, t, a + 0.04, 1, 0.12, 1.8);
    o.bg.forEach((m, i) => slam(m, t, tBig + i * 0.16, 1, 0.13, 2.8));
    o.ring.scale.setScalar(0.4 + eo(seg(t, tBig, b)) * 1.2); o.l.rotation.z = (inv ? -0.4 : 0.4) + t * 0.3;
    o.wh.position.y = -1.1 + hit(t, tBig, 0.25) * 0.25; o.wh.rotation.z = Math.sin(t * 9) * 0.02;
    f.hud.bars = 1.5; f.hud.shake = hit(t, tBig, 0.25) * 0.4 + hit(t, tBig + 0.16, 0.2) * 0.3;
    f.look(0, 2.5, 12, 0, 2.5, 0, 35, inv ? 0.03 : -0.03);
  });
}
function cake(c = 0xff9ad0) { const g = new THREE.Group(); g.add(at(cyl(0.09, 0.07, 0.1, 0xe8b46a, 7), [0, 0, 0]), at(ball(0.1, c, false, 0), [0, 0.08, 0]), at(ball(0.035, C.blood, true, 0), [0, 0.19, 0])); return g; }

export function reg2() {
  /* ───── 小红帽 迷失在 森林 提着 糕点篮 ───── */
  shot('V1a', bt(55), 32.5, s => {
    s.add(backdrop(vertTex(0xffd9ec, 0xff86c2), 120, 60, -34)); s.fog = new THREE.Fog(0xff9fd0, 12, 46);
    lights(s, 0.8, 1.1, 0xfff0e0, 0xffe0f0, 0x406050);
    s.add(ground(50, 0x2f7d5b)); at(box(70, 0.02, 1.7, 0xf6e2b3), [0, 0.01, 0], s);
    const trees: THREE.Object3D[] = [];
    for (let i = 0; i < 54; i++) {
      const tr = i % 3 ? pine(2.6 + rnd(i) * 2.6, i % 2 ? 0x1f6b55 : 0x17805f) : tree(2.2 + rnd(i) * 1.4, 0x3aa86a);
      at(tr, [-26 + i * 1.0 + rnd(i * 3) * 0.8, 0, -1.6 - rnd(i * 7) * 9 - (i % 4) * 1.2], s); trees.push(tr);
    }
    for (let i = 0; i < 9; i++) { const tr = pine(1.4 + rnd(i) * 0.6, 0x0f4a3c); at(tr, [-12 + i * 3.1, 0, 2.2 + rnd(i) * 0.5], s); trees.push(tr); tr.userData.front = 1; }
    const sign = new THREE.Group(); sign.add(at(box(0.1, 1.9, 0.1, C.trunk), [0, 0.95, 0]));
    const a1 = paper([[-0.7, -0.16], [0.5, -0.16], [0.75, 0], [0.5, 0.16], [-0.7, 0.16]], 0xf6e2b3), a2 = a1.clone(); a2.scale.x = -1;
    at(a1, [0, 1.75, 0.07], sign); at(a2, [0, 1.35, 0.07], sign); at(sign, [0.9, 0, -0.95], s);
    const d = new Actor('doubao', 2.4); s.add(d);
    const bk = sprite('prop_basket', 0.62); s.add(bk);
    const q = sprite('fx_question', 0.7); s.add(q);
    const big = txt('森林', 3.4, { rough: true }); at(big, [0, 4.6, 0], s); big.rotation.x = -0.66;
    const cakes = [0xff9ad0, 0xffffff, 0xffd166].map(c => { const k = cake(c); k.scale.setScalar(1.5); s.add(k); return k; });
    return { trees, a1, a2, d, bk, q, big, cakes };
  }, (o, f) => {
    const t = f.t, A = t < 30.0, B = t >= 30.0 && t < 30.54;
    let x: number;
    if (A) { x = lerp(-2.6, -0.5, seg(t, 28.5, 29.3)); if (t < 29.3) o.d.walk(t, 11); else o.d.act('tilt', t - 29.3, 8); }
    else { x = -0.5 + Math.max(0, t - 30.54) * 0.55; o.d.walk(t, 9); }
    o.d.put(x, A && t > 29.3 ? 0 : Math.abs(Math.sin(t * 6.15)) * 0.07, 0); o.d.face(A && t > 29.62 && t < 29.85 ? -1 : 1);
    const by = 0.78 + Math.abs(Math.sin(t * 6.15)) * 0.09;
    o.bk.position.set(x + 0.4, by, 0.06); o.bk.rotation.z = Math.sin(t * 6.15) * 0.15;
    o.q.position.set(x + 0.55, 2.75, 0.05); o.q.scale.setScalar(pop(t, 29.38)); o.q.visible = t > 29.38 && A;
    o.a1.rotation.y = t > 29.3 ? (t - 29.3) * 13 : 0; o.a2.rotation.y = t > 29.3 ? -(t - 29.3) * 17 : 0; o.a1.parent!.visible = t < 30.54;
    o.trees.forEach(tr => { tr.scale.y = B ? 1 + eo(seg(t, 30.0, 30.5)) * 0.5 : 1; tr.visible = !(tr.userData.front && !B); });
    slam(o.big, t, 30.0, 1, 0.14, 2.2); o.big.visible = B;
    [31.08, 31.34, 31.6].forEach((tt, i) => { const c = o.cakes[i]; c.visible = t > tt; const k = back(seg(t, tt, tt + 0.22)); c.position.set(x + 0.28 + i * 0.13, by + 0.1 + k * 0.3 + hit(t, tt, 0.3) * 0.15, 0.1 + i * 0.01); c.rotation.z = (i - 1) * 0.3; });
    if (A) f.look(x + 0.7, 1.5, 6.4, x + 0.3, 1.35, 0, 35, t > 29.3 ? Math.sin((t - 29.3) * 9) * 0.07 : 0);
    else if (B) { f.look(0, 12.5 - seg(t, 30, 30.54) * 1.5, 11, 0, 1.5, -3, 42); f.hud.shake = hit(t, 30.0, 0.25) * 0.3; }
    else { f.look(x + 1.3, 1.2, 3.9 - seg(t, 30.54, 32.5) * 0.4, x + 0.42, 1.12, 0, 35); f.hud.shake = (hit(t, 31.08, 0.15) + hit(t, 31.6, 0.15)) * 0.06; }
  });

  /* ───── 外婆的 叮咛 是 你要 乖巧 与 和善 ───── */
  shot('V1b', 32.5, 36.45, s => {
    s.add(backdrop(vertTex(0xffe7c2, 0xff9ccb), 120, 60, -30)); s.fog = new THREE.Fog(0xffb5d6, 14, 46);
    lights(s, 0.85, 1.0, 0xfff0d8, 0xfff0e0, 0x805060);
    s.add(ground(50, 0x4fae62));
    at(cottage(), [3.6, 0, -1.8], s).rotation.y = -0.35;
    for (let i = 0; i < 16; i++) at(i % 2 ? tree(2.6 + rnd(i), 0x3aa86a) : pine(3 + rnd(i) * 2, 0x1f6b55), [-14 + i * 1.9, 0, -4 - rnd(i * 3) * 6], s);
    const k = new Actor('kimi', 2.3); k.put(1.7, 0, 0).face(-1); s.add(k);
    const d = new Actor('doubao', 2.4); s.add(d);
    const bub = bubble('出门在外，要听话', 0.3); s.add(bub);
    const t1 = tag('乖巧'), t2 = tag('和善'); s.add(t1, t2);
    const s1 = quad(0.025, 9, 0xffffff), s2 = quad(0.025, 9, 0xffffff); s.add(s1, s2);
    return { k, d, bub, t1, t2, s1, s2 };
  }, (o, f) => {
    const t = f.t, tug = eo(seg(t, 35.6, 35.9));
    o.k.act(t < 33.14 ? 'idle' : t < 34.14 ? 'think' : 'nod', t, 8);
    o.d.act(t < 34.14 ? 'idle' : t < 35.0 ? 'surprise' : 'bow', t - (t < 35 ? 34.14 : 35.0), 8, t < 34.14).put(-1.5, tug * 0.22, 0);
    o.bub.position.set(1.1, 3.05, 0.4); o.bub.scale.setScalar(pop(t, 33.14) * (1 - seg(t, 34.05, 34.14))); o.bub.visible = t > 33.14 && t < 34.14;
    const P = [[-2.35, 1.5, 34.14, -0.18], [-0.62, 1.15, 35.0, 0.15]];
    [o.t1, o.t2].forEach((tg, i) => {
      const p = P[i]; slam(tg, t, p[2], 0.72, 0.14, 3);
      tg.position.set(p[0], p[1] + tug * 0.22 + Math.sin(t * 3 + i) * 0.02, 0.3); tg.rotation.z = p[3] + Math.sin(t * 2.5 + i) * 0.04;
      const st = i ? o.s2 : o.s1; st.visible = t > p[2]; st.position.set(p[0], p[1] + 4.85 + tug * 0.22, 0.28);
    });
    f.hud.shake = (hit(t, 34.14, 0.25) + hit(t, 35.0, 0.25)) * 0.3;
    const z = eio(seg(t, 33.5, 34.14));
    f.look(lerp(0.4, -1.3, z), lerp(1.9, 1.7, z), lerp(8.6, 5.6, z) - seg(t, 34.14, 36.4) * 0.4, lerp(0.3, -1.4, z), lerp(1.5, 1.5, z), 0, 35);
  });

  /* ───── 狼的 肚腹里 ───── */
  shot('V1c', 36.45, 38.35, s => {
    s.add(backdrop(grungeTex(0x8a0812, 0x1a0103, 3), 70, 40, -10));
    for (let i = 0; i < 9; i++) { const p = paper([[0, 5 + rnd(i) * 3], [1.3, 0], [-1.3, 0]], 0x120205); at(p, [-10 + i * 2.6, -0.5, -4 + (i % 2)], s); }
    at(quad(40, 2, 0x070102), [0, -1, 0.5], s);
    const w = wolf(0x070304); s.add(w);
    const d = new Actor('doubao', 1.7); d.put(-3.6, 0, 0.2); s.add(d);
    const big = txt('狼', 3.0, { rough: true }); at(big, [-4.2, 4.6, -1], s);
    return { w, d, big };
  }, (o, f) => {
    const t = f.t, k = ei(seg(t, 37.42, 38.3));
    o.w.scale.setScalar(2.5); o.w.position.set(0.2, -0.6 + hit(t, 36.54, 0.3) * 0.3, 0); o.w.rotation.z = Math.sin(t * 2) * 0.02;
    o.w.userData.eye.scale.setScalar(1 + f.bp * 0.5);
    o.d.act('surprise', t - 36.5, 10, false); o.d.position.x = -3.6 + Math.sin(t * 50) * 0.02 + k * 2.2; o.d.scale.setScalar(1 - k * 0.5);
    slam(o.big, t, 36.54, 1, 0.15, 2.4); (o.big.material as THREE.Material).opacity *= 1 - k;
    f.hud.shake = hit(t, 36.54, 0.3) * 0.3 + k * 0.15; f.hud.fade = seg(t, 38.15, 38.33);
    f.look(lerp(-0.6, 3.4, k), lerp(3.0, 2.4, k), lerp(12.5, 1.0, k), lerp(-0.6, 3.4, k), lerp(3.0, 2.4, k), 0, 35);
  });
  /* ───── 哦 一片 黑暗 ───── */
  shot('V1c2', 38.35, 40.05, s => {
    s.background = new THREE.Color(0x030102);
    const rb = ribs(s);
    const lightD = disc(2.2, 0x3a0509); lightD.rotation.x = -Math.PI / 2; at(lightD, [0, 0.01, 0], s);
    const sp = spot(0.3, 4.2, 9, 0xff5566, 0.13); s.add(sp);
    const d = new Actor('doubao', 2.0); s.add(d);
    const big = txt('黑暗', 3.2, { color: '#3a0509', rough: true }); at(big, [0, 3.4, -3], s);
    return { rb, lightD, sp, d, big };
  }, (o, f) => {
    const t = f.t, dark = eio(seg(t, 39.36, 40.0));
    o.rb.forEach((m, i) => { m.visible = t > 38.62 + i * 0.05; m.scale.setScalar(1 + Math.sin(t * 2.4 + i) * 0.03); });
    o.d.act('bow', 0.5, 1, false).put(0, 0, 0); o.d.rotation.z = Math.sin(t * 30) * 0.008; o.d.sil(dark * 0.92);
    o.lightD.scale.setScalar(1 - dark * 0.95); (o.sp.material as THREE.Material).opacity = 0.13 * (1 - dark);
    slam(o.big, t, 39.36, 1, 0.3, 1.3);
    f.hud.fade = Math.max(1 - seg(t, 38.35, 38.6), dark * 0.75);
    f.look(0, 1.6, lerp(7.5, 9.5, seg(t, 38.35, 40.05)), 0, 1.5, 0, 35);
  });
  quip('V1x', 40.05, 40.95, 40.6, '多么', '夸张', false, 'whale_big_idle');

  /* ───── 剧本说：要等待 猎人来 剖开 这 磨难 ───── */
  shot('V1d', 40.95, 44.75, s => {
    s.background = new THREE.Color(0x030102);
    const lightBg = quad(8, 12, 0xffe3f0); at(lightBg, [3, 3, -4], s);
    const hu = hunter(0x16090a); hu.scale.setScalar(1.25); at(hu, [3.4, 0.2, -3.6], s);
    const dL = quad(8, 14, 0x030102), dR = quad(8, 14, 0x030102); s.add(dL, dR);
    const rb = ribs(s, 5); rb.forEach(m => (m.position.x = 2.2));
    const d = new Actor('doubao', 2.2); d.put(1.6, 0, 0); s.add(d);
    const hg = sprite('prop_hourglass', 1.0); s.add(hg);
    const pg = scriptPage('剧 本', ['第一幕 · 森林', '小红帽：迷路。', '大灰狼：吞下她。', '小红帽：等待。', '猎人：剖开，救出。'], 3); s.add(pg);
    const big = txt('磨难', 1.45, { color: '#e01b24', rough: true }); at(big, [3.7, 3.75, 0.6], s);
    const wait = txt('等 待', 0.7, { font: FONT.hei, color: '#ffffff' }); at(wait, [1.2, 3.3, 0.2], s);
    return { dL, dR, rb, d, hg, pg, big, wait, hu };
  }, (o, f) => {
    const t = f.t, open = eo(seg(t, 42.8, 43.25));
    o.dL.position.set(3 - 4 - open * 1.5, 3, -3); o.dR.position.set(3 + 4 + open * 1.5, 3, -3);
    o.hu.position.y = lerp(-4.5, 0.2, back(seg(t, 42.36, 42.8))); o.hu.visible = open > 0;
    o.rb.forEach((m, i) => { m.position.x = 2.2; m.scale.x = 1 + open * 0.2 * i; });
    slam(o.pg, t, 41.0, 1.22, 0.18, 2.2); o.pg.position.set(-3.7, 2.7 + Math.sin(t * 2) * 0.05, 1); o.pg.rotation.set(0, 0.25, 0.07);
    o.d.act(t < 42.8 ? 'idle' : t < 43.58 ? 'surprise' : 'tilt', t - 42.8, 9, t < 42.8 || t >= 43.58); o.d.sil(0.35 * (1 - open));
    o.hg.position.set(0.2, 1.0, 0.1); o.hg.rotation.z = t > 41.8 ? eio(seg(t, 41.8, 42.3)) * Math.PI : 0; o.hg.visible = t > 41.4;
    slam(o.wait, t, 41.8, 1, 0.14, 2); o.wait.visible = t > 41.8 && t < 42.8;
    slam(o.big, t, 43.58, 1, 0.16, 2.6); o.big.rotation.z = -0.1;
    f.hud.flash = hit(t, 42.8, 0.2) * 0.7; f.hud.shake = hit(t, 42.8, 0.3) * 0.35 + hit(t, 43.58, 0.25) * 0.3;
    f.look(0, 2.6, 11.5 - seg(t, 41, 44.75) * 0.8, 0, 2.6, 0, 35);
  });

  /* ───── 小美人鱼（水下上浮） ───── */
  shot('V2a', 44.75, 45.88, s => {
    s.add(backdrop(vertTex(0x6fe0ff, 0x06245f, 0x1e7fd6), 60, 40, -10));
    const rays = [0, 1, 2, 3].map(i => { const r = spot(0.6, 3 + i, 14, 0xbff4ff, 0.1); r.rotation.z = -0.35 + i * 0.2; at(r, [-6 + i * 4, -3, -3], s); return r; });
    const w = new Actor('whale', 2.8); w.add(mermaidTail(2.8)); s.add(w);
    const bub = Array.from({ length: 26 }, (_, i) => { const b = ringM(0.07 + rnd(i) * 0.1, 0.1 + rnd(i) * 0.13, 0xffffff, { transparent: true, opacity: 0.8 }, 14); s.add(b); return b; });
    for (let i = 0; i < 7; i++) { const p = paper([[0, 2 + rnd(i) * 3], [0.5, 0], [-0.5, 0]], 0x0a3a6a); at(p, [-8 + i * 2.7, -3.2, -2], s); }
    return { w, bub, rays };
  }, (o, f) => {
    const t = f.t, k = seg(t, 44.75, 45.88);
    o.w.act('sway', t, 9).put(Math.sin(t * 3) * 0.3, lerp(-2.6, 2.4, eio(k)), 0); o.w.rotation.z = Math.sin(t * 4) * 0.12;
    o.bub.forEach((b, i) => b.position.set((rnd(i * 3) - 0.5) * 9 + Math.sin(t * 2 + i) * 0.2, -4 + ((t * (1.5 + rnd(i) * 2) + rnd(i * 7) * 10) % 10), rnd(i) * 2 - 1));
    o.rays.forEach((r, i) => ((r.material as THREE.Material).opacity = 0.08 + Math.sin(t * 2 + i) * 0.03));
    f.look(0, lerp(0.5, 2.6, eio(k)), 9, 0, lerp(0.8, 3.2, eio(k)), 0, 38);
  });
  /* ───── 浮上 海面 歌声 多 璀璨 ───── */
  shot('V2a2', 45.88, 48.85, s => {
    s.fog = new THREE.Fog(0xff9fc6, 20, 60);
    const sea = seaSet(s, 0x3a2a8e, 0xff7fb8, 0xffd27a);
    const w = new Actor('whale', 2.8); s.add(w);
    const spl = ringM(0.8, 1.0, 0xffffff, { transparent: true }); spl.rotation.x = -Math.PI / 2; s.add(spl);
    const drops = Array.from({ length: 14 }, () => { const b = ball(0.07, 0xdff6ff, true, 0); s.add(b); return b; });
    const arcs = [0, 1, 2, 3].map(() => { const r = ringM(1, 1.05, 0xffffff, { transparent: true }); s.add(r); return r; });
    const stars = Array.from({ length: 30 }, (_, i) => { const st = star4(0.16 + rnd(i) * 0.3, i % 3 ? 0xffffff : 0xffe27a); s.add(st); return st; });
    const big = txt('璀璨', 1.5, { color: '#fff6c8', stroke: 'rgba(120,40,90,.6)', sw: 0.03 }); at(big, [3.8, 3.5, -1], s); big.rotation.z = -0.08;
    return { sea, w, spl, drops, arcs, stars, big };
  }, (o, f) => {
    const t = f.t, up = back(seg(t, 45.88, 46.4));
    o.sea.position.x = Math.sin(t * 0.8) * 0.4; o.sea.position.y = Math.sin(t * 1.6) * 0.05;
    o.w.act(t < 46.92 ? 'idle' : 'wave', t, 9).put(-0.8, lerp(-3, -0.75, up) + Math.sin(t * 2.4) * 0.06, 0);
    o.spl.position.set(-0.8, 0.3, 0.2); o.spl.scale.setScalar(0.5 + eo(seg(t, 46.0, 47.2)) * 4); (o.spl.material as THREE.Material).opacity = 1 - seg(t, 46.0, 47.2);
    o.drops.forEach((d, i) => { const k = seg(t, 46.0, 46.9), a = i * 0.45; d.position.set(-0.8 + Math.cos(a) * k * 2.2, 0.4 + Math.sin(k * Math.PI) * (1.6 + rnd(i)), Math.sin(a) * k * 1.2); d.visible = k > 0 && k < 1; });
    o.arcs.forEach((r, i) => { const k = ((t - 46.92) * 1.2 + i * 0.25) % 1; r.visible = t > 46.92; r.position.set(-0.6, 1.7, -0.2); r.scale.setScalar(0.4 + k * 3.4); (r.material as THREE.Material).opacity = (1 - k) * 0.8; });
    o.stars.forEach((st, i) => {
      const a = rnd(i * 3) * TAU, k = eo(seg(t, 47.68 + rnd(i) * 0.15, 48.5)), R = 1 + rnd(i * 5) * 5.5;
      st.visible = t > 47.68; st.position.set(-0.6 + Math.cos(a) * R * k, 2 + Math.sin(a) * R * k * 0.62, -0.5 + rnd(i) * 0.6); st.rotation.z = t * 2 + i; st.scale.setScalar(0.5 + Math.abs(Math.sin(t * 9 + i * 2)));
    });
    slam(o.big, t, 47.68, 1, 0.16, 2.6);
    f.hud.flash = hit(t, 47.68, 0.25) * 0.55; f.hud.shake = hit(t, 46.0, 0.25) * 0.2;
    f.look(lerp(1.5, 0.6, seg(t, 45.88, 48.85)), 1.9, lerp(8.2, 9.6, eo(seg(t, 45.88, 48.85))), 0.3, 1.9, 0, 36);
  });

  /* ───── 女巫的 交易 是 割让 歌喉的 谈判 ───── */
  shot('V2b', 48.85, 52.9, s => {
    s.add(backdrop(radialTex(0x6a2aa8, 0x12052a, 0.5, 0.6, 0.6), 60, 34, -8));
    for (let i = 0; i < 12; i++) { const p = paper([[0, -(1.5 + rnd(i) * 3)], [0.9, 0], [-0.9, 0]], 0x0c031c); at(p, [-10 + i * 1.9, 7.2, -2 + (i % 2)], s); }
    at(quad(40, 3, 0x0c031c), [0, -1.5, 0.3], s);
    lights(s, 0.9, 0.8, 0xd0a0ff);
    const pot = new THREE.Group(); pot.add(at(cyl(1.1, 0.75, 1.1, 0x1a1024, 9), [0, 0.55, 0]), at(disc(1.02, 0x58ff9a), [0, 1.11, 0])); pot.children[1].rotation.x = -Math.PI / 2; at(pot, [0.2, 0, -0.4], s);
    const q = new Actor('qwen', 2.7); q.put(3.1, 0, 0).face(-1); s.add(q);
    const hat = new THREE.Group(); hat.add(paper([[-0.75, 0], [0.75, 0], [0.42, 0.14], [0.12, 1.25], [-0.42, 0.14]], 0x120822), at(quad(0.7, 0.1, C.mag), [0, 0.18, 0.01])); hat.position.set(0, 2.38, 0.03); q.add(hat);
    const w = new Actor('whale', 2.7); w.put(-3.0, 0, 0); s.add(w);
    const scr = sprite('prop_scroll', 1.7); s.add(scr);
    const orb = new THREE.Group(); orb.add(disc(0.2, 0xffffff), at(ringM(0.28, 0.33, 0xffe27a), [0, 0, -0.01]), at(star4(0.6, 0xfff2a8, { transparent: true, opacity: 0.8 }), [0, 0, -0.02])); s.add(orb);
    const bottle = new THREE.Group(); bottle.add(paper([[-0.32, 0], [0.32, 0], [0.32, 0.7], [0.13, 0.95], [0.13, 1.2], [-0.13, 1.2], [-0.13, 0.95], [-0.32, 0.7]], 0xbfe8ff, { transparent: true, opacity: 0.4 }), at(quad(0.3, 0.14, 0x8a5a2a), [0, 1.25, 0.01])); at(bottle, [2.0, 0.55, 0.3], s);
    const slash = bar(-9, -2.2, 9, 2.6, 0.09, 0xffffff); at(slash, [0, 2.2, 1.2], s);
    const seal = new THREE.Group(); seal.add(ringM(0.62, 0.74, C.blood), at(txt('成交', 0.5, { font: FONT.serif, color: '#e01b24', weight: '900' }), [0, 0, 0.01])); s.add(seal);
    const big = txt('割让', 1.9, { rough: true }); at(big, [-2.9, 3.6, 0.8], s);
    return { pot, q, w, scr, orb, bottle, slash, seal, big };
  }, (o, f) => {
    const t = f.t, k = eio(seg(t, 50.1, 51.3));
    o.q.act(t < 49.48 ? 'idle' : t < 51.4 ? 'sway' : 'bow', t, 8); o.q.position.y = Math.sin(t * 2) * 0.05;
    o.w.act(t < 50.02 ? 'idle' : t < 50.6 ? 'surprise' : 'sad', t - 50.02, 9, t < 50.02 || t > 50.6); o.w.sil(k * 0.35, 0x20104a);
    o.scr.position.set(0.2, 3.1 + Math.sin(t * 3) * 0.06, 0.4); o.scr.scale.setScalar(pop(t, 49.48)); o.scr.visible = t > 49.48; o.scr.rotation.z = Math.sin(t * 2) * 0.05;
    const ox = lerp(-2.85, 2.0, k), oy = lerp(1.25, 1.05, k) + Math.sin(k * Math.PI) * 2.2;
    o.orb.position.set(ox, oy, 0.5); o.orb.scale.setScalar((0.8 + f.bp * 0.3) * (t < 50.02 ? seg(t, 49.0, 49.4) : 1)); o.orb.children[2].rotation.z = t * 3;
    slam(o.slash, t, 50.02, 1, 0.1, 1.4); o.slash.visible = t > 50.02 && t < 50.3;
    slam(o.big, t, 50.02, 1, 0.14, 2.6); o.big.visible = t > 50.02 && t < 51.4;
    slam(o.seal, t, 51.4, 1.15 + hit(t, 52.04, 0.2) * 0.2, 0.12, 4); o.seal.position.set(0.5, 2.85, 0.6); o.seal.rotation.z = -0.25;
    f.hud.flash = hit(t, 50.02, 0.16) * 0.8; f.hud.flashCol = '#ff2a4a';
    f.hud.shake = hit(t, 50.02, 0.3) * 0.4 + hit(t, 51.4, 0.25) * 0.4 + hit(t, 52.04, 0.2) * 0.25;
    f.look(Math.sin(t * 0.6) * 0.3, 2.3, 10.2 - seg(t, 48.85, 52.9) * 0.9, 0, 2.3, 0, 35);
  });

  /* ───── 刀尖上 跳舞 ───── */
  const knives = (s: THREE.Scene) => {
    s.add(backdrop(grungeTex(), 70, 40, -9));
    for (let r = 0; r < 3; r++) for (let i = 0; i < 21; i++) { const k = knife(1.2 + rnd(i + r * 30) * 0.5, r === 0 ? 0xe6ecf8 : 0x9aa3ba); at(k, [-10 + i * 1.0 + r * 0.5, -0.3, -r * 0.6], s); }
    at(quad(40, 2, 0x16090a), [0, -1.25, 0.4], s);
    const w = new Actor('whale', 2.7); s.add(w);
    const sparks = Array.from({ length: 8 }, (_, i) => { const st = star4(0.35, i % 2 ? 0xffffff : C.rose); s.add(st); return st; });
    return { w, sparks };
  };
  const dance = (o: { w: Actor; sparks: THREE.Mesh[] }, f: { t: number; bp: number }, cx: number) => {
    const t = f.t; o.w.act('spin', t, 12).put(cx + Math.sin(t * 1.5) * 1.2, 0.95 + f.bp * 0.5, -0.2);
    o.sparks.forEach((st, i) => { const a = (i / 8) * TAU; st.position.set(o.w.position.x + Math.cos(a) * (1 - f.bp) * 1.3, 1.0 + Math.sin(a) * (1 - f.bp) * 0.5, 0.1); st.scale.setScalar(f.bp * 1.3); st.rotation.z = t * 5; });
  };
  shot('V2c', 52.9, 54.84, s => { const o = knives(s); const big = txt('刀尖', 2.1, { rough: true }); at(big, [-2.0, 3.9, -2], s); big.rotation.z = 0.08; return { ...o, big }; }, (o, f) => {
    dance(o, f, 0.8); slam(o.big, f.t, 52.96, 1, 0.15, 2.4);
    f.hud.shake = f.bp * 0.08 + hit(f.t, 52.96, 0.25) * 0.3;
    f.look(1.5, 0.9, 7.2 - seg(f.t, 52.9, 54.84) * 0.6, 0.6, 2.3, 0, 38, 0.04);
  });
  /* ───── 等待 王子的 青睐 ───── */
  shot('V2c2', 54.84, 56.35, s => {
    const o = knives(s);
    const boxG = new THREE.Group(); boxG.add(at(box(3.4, 0.9, 0.5, C.gold, true), [0, 0, 0]), at(box(3.7, 0.16, 0.6, C.goldL, true), [0, 0.5, 0]), at(quad(3.2, 3.2, 0x2a0104), [0, 2.0, -0.3]));
    const pr = prince(); pr.scale.setScalar(0.72); pr.position.set(0, 0.4, -0.1); pr.scale.x = -0.72; boxG.add(pr);
    const z = sprite('fx_zzz', 0.7); z.position.set(-1.0, 3.0, 0.2); boxG.add(z);
    at(boxG, [4.5, 2.2, -1.5], s);
    const sp = spot(0.3, 3.2, 7, 0xfff0c0, 0.2); at(sp, [4.5, 1.9, -1], s);
    const wait = txt('等待', 1.3, { font: FONT.hei, color: '#fff', sp: 0.5 }); at(wait, [-4.6, 5.0, 0.5], s);
    return { ...o, z, wait, pr };
  }, (o, f) => {
    const t = f.t; dance(o, f, -2.2);
    if (t > 55.86) o.w.act('bow', t - 55.86, 9, false);
    o.z.raw('fx_zzz', t, 4); o.z.position.y = 3.0 + Math.sin(t * 3) * 0.1; o.pr.rotation.z = Math.sin(t * 1.5) * 0.05 - 0.1;
    slam(o.wait, t, 54.86, 1, 0.14, 2);
    f.look(0.8, 3.1, 12.6 - seg(t, 54.84, 56.35) * 0.7, 0.8, 3.0, 0, 35);
  });
  quip('V2x', 56.35, 57.38, 56.96, '多么', '荒诞', true, 'whale_big_blink');

  /* ───── 剧本说：泡沫的 升华 是 真爱的 模样 ───── */
  shot('V2d', 57.38, 60.92, s => {
    s.fog = new THREE.Fog(0x9fc6ff, 20, 60);
    const sea = seaSet(s, 0x1a2a7e, 0x7fb0ff, 0xdff0ff, false);
    const w = new Actor('whale', 2.8); s.add(w);
    const pg = scriptPage('剧 本', ['第二幕 · 深海', '人鱼：交出声音。', '人鱼：刀尖起舞。', '王子：另娶他人。', '人鱼：化作泡沫。'], 4); s.add(pg);
    const bub = Array.from({ length: 44 }, (_, i) => { const b = ball(0.1 + rnd(i) * 0.14, i % 4 ? 0xdff6ff : 0xffffff, true, 1); (b.material as THREE.Material).transparent = true; (b.material as THREE.Material).opacity = 0.85; s.add(b); return b; });
    const hl = heart(0xffffff, 1); (hl.material as THREE.Material).transparent = true; at(hl, [1.6, 4.3, -0.6], s);
    return { sea, w, pg, bub, hl };
  }, (o, f) => {
    const t = f.t, dis = seg(t, 58.14, 58.95), gather = eio(seg(t, 59.0, 59.9)), popK = seg(t, 60.45, 60.75);
    o.sea.position.x = Math.sin(t * 0.8) * 0.4;
    o.w.act('sad', t, 7).put(1.6, -0.75, 0).alpha(1 - dis);
    slam(o.pg, t, 57.42, 0.98, 0.18, 2.2); o.pg.position.set(-3.0, 2.3 + Math.sin(t * 2) * 0.05, 1); o.pg.rotation.set(0, 0.25, 0.06);
    o.bub.forEach((b, i) => {
      const st = 58.14 + rnd(i * 3) * 0.7, k = seg(t, st, st + 1.4);
      const x0 = 1.6 + (rnd(i * 5) - 0.5) * 1.4, y0 = 0.3 + rnd(i * 7) * 1.6 + k * (1.5 + rnd(i) * 2.2);
      const a = (i / 44) * TAU, hx = 1.6 + 0.085 * 16 * Math.pow(Math.sin(a), 3), hy = 4.2 + 0.085 * (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a));
      b.visible = t > st && popK < 1;
      b.position.set(lerp(x0 + Math.sin(t * 3 + i) * 0.15, hx, gather) + popK * Math.cos(a) * 5, lerp(y0, hy, gather) + popK * Math.sin(a) * 4, 0.2);
      b.scale.setScalar((0.6 + 0.4 * Math.sin(t * 5 + i) ** 2) * (1 - popK));
    });
    (o.hl.material as THREE.Material).opacity = seg(t, 59.7, 60.0) * 0.28 * (1 - popK); o.hl.scale.setScalar(1.25 + f.bp * 0.1); o.hl.visible = t > 59.7 && popK < 1;
    f.hud.flash = hit(t, 60.45, 0.25) * 0.5;
    f.look(0.2, lerp(2.0, 2.8, eio(seg(t, 58.5, 60))), 10.4, 0.2, lerp(2.0, 2.9, eio(seg(t, 58.5, 60))), 0, 36);
  });
}
export const _u2 = [cone, lam, heart, bubble];
