import * as THREE from 'three';
import { Actor, BEAT, C, FONT, at, back, backdrop, bt, clamp, disc, ei, eio, elastic, eo, grungeTex, grp, hit, lerp, paper, pop, quad, ringM, rnd, seg, shot, show, slam, sprite, txt } from './engine';
import { bar, bubble, crown, gothicArch, heart, paperBush, paperPine, prince, scriptPage, spot, stick, theatre, wolf } from './props';

export const popUp = (o: THREE.Object3D, t: number, a: number, d = 0.5) => {
  const k = back(seg(t, a, a + d)); o.visible = t >= a; o.rotation.x = (1 - k) * -Math.PI / 2;
};
/** 彩纸屑 */
export function confetti(n: number, cols: number[], parent: THREE.Object3D, w = 12, h = 8, z = 0.6) {
  const arr = Array.from({ length: n }, (_, i) => { const m = quad(0.14, 0.22, cols[i % cols.length]); parent.add(m); return m; });
  return (t: number, vis = true) => arr.forEach((m, i) => {
    m.visible = vis;
    const sp = 0.8 + rnd(i) * 1.2;
    m.position.set((rnd(i * 3) - 0.5) * w + Math.sin(t * 2 + i) * 0.3, h - ((t * sp + rnd(i * 7) * h) % h), z + rnd(i * 5) * 0.8 - 1.2);
    m.rotation.set(t * 3 + i, t * 2 + i * 2, i);
  });
}
/** 狼口：两排交错的白牙 */
function jaws(parent: THREE.Object3D, z: number) {
  const mk = (dir: number) => {
    const g = new THREE.Group();
    g.add(at(quad(9, 4, 0x070304), [0, dir * 1.74, 0]));
    for (let i = -9; i <= 9; i++) {
      const x = i * 0.5 + (dir > 0 ? 0 : 0.25);
      g.add(at(paper([[-0.17, 0.02 * dir], [0.17, 0.02 * dir], [0, -dir * 0.5]], 0xfff6ee), [x, 0, 0.01]));
    }
    g.position.z = z; parent.add(g); return g;
  };
  const top = mk(1), bot = mk(-1);
  return (k: number, cy: number) => { top.position.y = cy + 0.24 + (1 - k) * 3.2; bot.position.y = cy - 0.24 - (1 - k) * 3.2; top.visible = bot.visible = k > 0.001; };
}
function forest(s: THREE.Scene) {
  const trees: THREE.Mesh[] = [];
  [[-5.4, 4.2], [-3.9, 3.0], [-2.4, 4.8], [-0.6, 3.4], [1.2, 4.4], [2.9, 3.2], [4.4, 4.9], [5.8, 3.6]].forEach((p, i) => {
    const m = paperPine(p[1], i % 2 ? 0x8a0a55 : 0xa80c63); at(m, [p[0], 0, -2.9 + (i % 3) * 0.25], s); trees.push(m);
  });
  const bushes = [[-4.2, 2.6], [0.3, 2.2], [3.6, 3.0]].map((p, i) => { const m = paperBush(p[1], 0x6a0845); at(m, [p[0], 0, -1.3 - i * 0.1], s); return m; });
  return { trees, bushes };
}

export function reg1() {
  /* ───── 序章一：幕布、片名、小红帽迷路 ───── */
  shot('P1', 0, 8.0, s => {
    const th = theatre(s);
    const title = txt('逃离童话镇', 0.92, { font: FONT.brush, vertical: true, rough: true, color: '#ffffff', stroke: 'rgba(60,20,0,.55)', sw: 0.03 });
    at(title, [0, 3.2, 1.75], s);
    const { trees, bushes } = forest(s);
    const d = new Actor('doubao', 3.1); d.add(stick()); s.add(d);
    const q = sprite('fx_question', 0.8); s.add(q);
    const sp = spot(0.4, 3.4, 8, 0xffe9f4, 0.2); s.add(sp);
    return { th, title, trees, bushes, d, q, sp };
  }, (o, f) => {
    const t = f.t;
    o.th.open(eio(seg(t, 2.2, 3.5)));
    (o.title.material as THREE.Material).opacity = seg(t, 0.4, 1.3) * (1 - seg(t, 2.2, 2.6));
    o.title.scale.setScalar(1 + 0.03 * Math.sin(t * 2));
    o.trees.forEach((m, i) => popUp(m, t, 2.7 + i * 0.11));
    o.bushes.forEach((m, i) => popUp(m, t, 3.1 + i * 0.15));
    const x = lerp(-6.4, -0.8, seg(t, 4.3, 6.3));
    const walking = t > 4.3 && t < 6.3;
    if (walking) o.d.walk(t, 10); else o.d.act(t > 6.5 ? 'tilt' : 'idle', t - 6.5, 6);
    o.d.put(x, walking ? Math.abs(Math.sin(t * 9)) * 0.1 : 0, 0);
    o.d.face(t > 6.9 && t < 7.35 ? -1 : 1);
    o.d.rotation.z = walking ? Math.sin(t * 9) * 0.04 : 0;
    o.q.position.set(x + 0.7, 3.5 + Math.sin(t * 5) * 0.05, 0.1); o.q.scale.setScalar(pop(t, 6.45)); o.q.visible = t > 6.45;
    o.sp.position.set(x, 0, 0.3); o.sp.visible = t > 4.3;
    f.hud.fade = 1 - seg(t, 0, 0.9);
    f.look(x * 0.12 * seg(t, 4.3, 7), 2.9, lerp(15.5, 12.6, eo(seg(t, 0, 7.5))), x * 0.2 * seg(t, 4.3, 7), 2.9, 0, 34);
  });

  /* ───── 序章二：遇见狼——被吃掉 ───── */
  shot('P2', 8.0, 11.8, s => {
    theatre(s); forest(s);
    const d = new Actor('doubao', 3.1); d.add(stick()); d.put(-0.8, 0, 0); s.add(d);
    const w = wolf(0x1a0612); w.scale.setScalar(1.25); s.add(w);
    const ex = sprite('fx_exclaim', 0.9); at(ex, [-0.1, 3.6, 0.1], s);
    const jw = jaws(s, 9.2);
    const word = txt('然后——被吃掉。', 0.15, { font: FONT.brush, color: '#e01b24' }); at(word, [0, 2.47, 9.6], s);
    return { d, w, ex, jw, word };
  }, (o, f) => {
    const t = f.t;
    const lunge = ei(seg(t, 10.3, 10.62));
    o.w.position.set(lerp(3.3, 0.9, lunge), lerp(-5.2, 0, back(seg(t, 8.1, 8.6))), -0.5);
    o.w.rotation.z = lerp(0, 0.2, eio(seg(t, 9.0, 10.2))) + lunge * 0.25;
    o.w.scale.setScalar(1.25 + lunge * 0.9);
    o.w.userData.eye.scale.setScalar(1 + hit(t, 8.1, 0.5) * 1.5 + f.bp * 0.3);
    o.d.act('surprise', t - 8.15, 12, false);
    o.d.position.x = -0.8 + (t > 8.5 ? Math.sin(t * 46) * 0.03 : 0) - seg(t, 9.2, 10.2) * 0.5;
    o.ex.scale.setScalar(pop(t, 8.15)); o.ex.visible = t > 8.15 && t < 10.4;
    const k = eo(seg(t, 10.46, 10.7));
    o.jw(k, 2.9);
    (o.word.material as THREE.Material).opacity = seg(t, 10.95, 11.25);
    f.hud.shake = hit(t, 8.1, 0.4) * 0.3 + hit(t, 10.7, 0.35) * 0.4;
    f.look(0, 2.9, lerp(12.6, 12.0, seg(t, 8, 10.5)), 0, 2.9, 0, 34);
  });

  /* ───── 序章三：故事的最后，公主总要嫁给王子 ───── */
  shot('P3', 11.8, 20.12, s => {
    const th = theatre(s, 0xff3d9e, 0x7a0a4a);
    // 城堡剪影
    const cas = new THREE.Group(); at(cas, [0, 0, -2.9], s);
    [[-3.2, 3.2, 1.1], [-1.6, 4.6, 1.3], [0, 3.6, 2.2], [1.7, 5.0, 1.2], [3.3, 3.0, 1.1]].forEach(p => {
      cas.add(at(quad(p[2], p[1], 0xa80c63), [p[0], p[1] / 2, 0]));
      cas.add(paper([[p[0] - p[2] * 0.7, p[1]], [p[0], p[1] + 1.2], [p[0] + p[2] * 0.7, p[1]]], 0xa80c63));
    });
    const cl = new Actor('claude', 3.1); cl.add(stick()); const cr = crown(0.62); cr.position.set(0.06, 2.92, 0.02); cl.add(cr); s.add(cl);
    const pr = prince(); pr.scale.setScalar(1.05); s.add(pr);
    const sign = new THREE.Group(); sign.add(at(quad(3.4, 1.1, C.paper), [0, -1.4, 0]), bar(-1.2, 0, -1.2, -0.9, 0.03, 0xffffff), bar(1.2, 0, 1.2, -0.9, 0.03, 0xffffff));
    sign.add(at(txt('THE END ?', 0.6, { font: FONT.serif, color: '#b30a14', weight: '900' }), [0, -1.42, 0.02])); s.add(sign);
    const bub = bubble('嫁给我吧！', 0.34); s.add(bub);
    const hearts = Array.from({ length: 9 }, (_, i) => { const h = heart(i % 2 ? 0xffffff : C.rose, 0.5); s.add(h); return h; });
    const ribbon = new THREE.Group(); ribbon.add(quad(9.4, 1.15, 0xffffff), at(quad(9.1, 0.9, C.blood), [0, 0, 0.01]));
    ribbon.add(at(txt('Happily Ever After', 0.62, { font: FONT.serif, color: '#fff', weight: '900', sp: 0.03 }), [0, 0, 0.03])); s.add(ribbon);
    const conf = confetti(46, [0xffffff, C.goldL, C.rose, 0xffb3da], s);
    const jw = jaws(s, 9.2);
    return { th, cl, pr, sign, bub, hearts, ribbon, conf, jw };
  }, (o, f) => {
    const t = f.t;
    o.jw(1 - eo(seg(t, 11.84, 12.3)), 2.9);
    o.sign.position.set(0, lerp(10, 6.7, elastic(seg(t, 11.95, 12.9))) + ei(seg(t, 17.0, 17.4)) * 5, 0.6);
    o.sign.rotation.z = Math.sin(t * 2.6) * 0.05;
    const tog = eo(seg(t, 17.24, 17.8));
    o.cl.act(t < 13.8 ? 'idle' : t < 15.36 ? 'lookaround' : t < 16.3 ? 'tilt' : 'curtsy', t, 7);
    o.cl.put(lerp(-1.4, -0.75, eo(seg(t, 16.2, 16.6))) + tog * 0.1, Math.abs(Math.sin(t * 6.15)) * 0.07 * (t > 16.2 ? 1 : 0), 0);
    o.pr.position.set(lerp(7.5, 1.7, eo(seg(t, 13.82, 14.7))) - tog * 0.55, Math.abs(Math.sin(t * 6.15 + 1)) * 0.08, 0);
    o.pr.rotation.z = Math.sin(t * 6.15) * 0.04 + (t > 15.36 ? 0.22 * eo(seg(t, 15.36, 15.6)) * (1 - tog) : 0);
    o.bub.position.set(2.3, 4.25, 0.5); o.bub.scale.setScalar(pop(t, 15.4) * (1 - seg(t, 17.1, 17.25))); o.bub.visible = t > 15.4 && t < 17.25;
    o.hearts.forEach((h, i) => {
      const a = Math.PI * (0.08 + (i / 8) * 0.84);
      h.position.set(Math.cos(a) * 3.3, 0.6 + Math.sin(a) * 3.9, -0.8);
      h.scale.setScalar(pop(t, 15.7 + i * 0.07) * (1 + f.bp * 0.12)); h.visible = t > 15.7 + i * 0.07;
    });
    o.ribbon.position.set(0, lerp(9, 5.25, elastic(seg(t, 17.3, 18.3))), 0.8); o.ribbon.rotation.z = -0.03 + Math.sin(t * 2) * 0.01;
    o.conf(t, t > 15.5);
    o.th.open(1 - eio(seg(t, 18.5, 20.6)) * 0.62);
    f.hud.shake = hit(t, 11.84, 0.3) * 0.2;
    f.look(0, 2.9, lerp(12.4, 11.2, seg(t, 12, 17.2)) + eio(seg(t, 17.2, 20.1)) * 2.6, 0, 2.9, 0, 34);
  });

  /* ───── STOP！ ───── */
  shot('S0', 20.12, 21.3, s => {
    s.background = new THREE.Color(C.mag);
    const band = quad(30, 3.4, 0x0a0607); band.rotation.z = 0.1; at(band, [0, 2.2, -2], s);
    const band2 = quad(30, 0.12, 0xffffff); band2.rotation.z = 0.1; at(band2, [0, 4.3, -1.9], s);
    const wh = new Actor('whale', 5.6); wh.raw('whale_big_point'); s.add(wh);
    const letters = [...'STOP!'].map((c, i) => {
      const m = txt(c, 2.9, { font: FONT.hei, color: '#fff', stroke: '#0a0607', sw: 0.05, px: 200 });
      at(m, [-0.6 + i * 1.5, 2.5 + i * 0.16, 0.5], s); m.rotation.z = 0.1 + (rnd(i) - 0.5) * 0.16; return m;
    });
    const ring = ringM(2.96, 3.0, 0xffffff); at(ring, [2.4, 2.6, 0.2], s);
    const l1 = bar(-12, 0, 12, 0, 0.025, 0xffffff), l2 = bar(-12, 0, 12, 0, 0.025, 0xffffff); s.add(l1, l2);
    return { wh, letters, ring, l1, l2 };
  }, (o, f) => {
    const t = f.t;
    o.wh.put(lerp(-10, -4.4, eo(seg(t, 20.12, 20.3))), -1.2 + f.bp * 0.08, 0.2);
    o.letters.forEach((m, i) => { slam(m, t, 20.12 + i * 0.045, 1 + hit(t, bt(39), 0.3) * 0.14, 0.16, 3.2); });
    o.ring.scale.setScalar(0.3 + eo(seg(t, 20.2, 21.3)) * 1.4);
    o.l1.position.set(0, 2.6, 0.3); o.l1.rotation.z = 0.5 + t * 0.4; o.l2.position.set(1, 2.6, 0.3); o.l2.rotation.z = -0.9 - t * 0.3;
    f.hud.flash = hit(t, 20.12, 0.14) * 0.9; f.hud.shake = hit(t, 20.12, 0.3) * 0.5 + hit(t, bt(39), 0.3) * 0.3; f.hud.bars = 1.5;
    f.look(0, 2.5, 12 - eo(seg(t, 20.12, 21.3)) * 0.6, 0, 2.5, 0, 35, -0.03);
  });

  /* ───── I don't like that story. ───── */
  shot('S1', 21.3, 23.0, s => {
    s.background = new THREE.Color(C.mag);
    at(quad(30, 5.4, 0xd40f7a), [0, 2.5, -3], s);
    const page = scriptPage('THE END', ['公主嫁给了王子', '从此以后', '幸福地生活在一起', '……全剧终'], 2); s.add(page);
    const x1 = bar(-2.4, -2.4, 2.4, 2.4, 0.5, 0x0a0607), x2 = bar(-2.4, 2.4, 2.4, -2.4, 0.5, 0x0a0607); s.add(x1, x2);
    const wh = new Actor('whale', 4.2); s.add(wh);
    const P: [string, number, number, number, number][] = [['I', 21.36, -1.9, 4.55, 0.8], ["DON'T", 21.6, -0.5, 3.72, 1.0], ['LIKE', 21.9, -0.9, 2.76, 1.0], ['THAT', 22.14, -1.1, 1.9, 0.75], ['STORY.', 22.5, -0.2, 0.92, 1.1]];
    const words = P.map((p, i) => { const m = txt(p[0], p[4], { font: FONT.hei, color: i === 4 ? '#fff' : '#0a0607', sp: 0.06 }); at(m, [p[2], p[3], 0.6], s); m.rotation.z = (rnd(i + 3) - 0.5) * 0.12; return m; });
    return { page, x1, x2, wh, words, P };
  }, (o, f) => {
    const t = f.t;
    const fall = ei(seg(t, 22.72, 23.1));
    o.page.position.set(4.2, 2.6 - fall * 5, 0); o.page.rotation.z = -0.12 - fall * 0.7; o.page.scale.setScalar(1.25);
    [o.x1, o.x2].forEach((x, i) => { slam(x, t, 22.5 + i * 0.12, 1, 0.12, 2); x.position.set(4.2, 2.6 - fall * 5, 0.4); });
    o.wh.act('shake', t - 21.3, 10).put(-4.6, -0.5, 0.3);
    o.words.forEach((m, i) => slam(m, t, o.P[i][1], 1, 0.14, 2.2));
    f.hud.bars = 1.5; f.hud.shake = hit(t, 22.5, 0.25) * 0.35;
    f.look(0, 2.5, 12, 0, 2.5, 0, 35, 0.02);
  });

  /* ───── We CAN CHANGE IT! ───── */
  shot('S2', 23.0, bt(47), s => {
    s.background = new THREE.Color(0x0a0607);
    const blk = quad(13.5, 5.6, C.mag); at(blk, [0, 2.5, -2], s);
    const wh = new Actor('whale', 4.4); s.add(wh);
    const P: [string, number, number, number, number, string][] = [['WE', 23.04, -5.0, 3.85, 1.6, '#0a0607'], ['CAN', 23.3, -1.5, 3.85, 1.6, '#0a0607'], ['CHANGE', 23.6, -3.3, 1.75, 1.5, '#ffffff'], ['IT!', 23.9, 2.2, 1.75, 1.5, '#0a0607']];
    const words = P.map(p => { const m = txt(p[0], p[4], { font: FONT.serif, weight: '900', color: p[5] }); at(m, [p[2], p[3], -1], s); return m; });
    const pages = Array.from({ length: 12 }, (_, i) => { const m = quad(0.7, 0.9, i % 3 ? C.paper : 0xffffff); s.add(m); return m; });
    const ring = ringM(3.4, 3.44, 0xffffff); s.add(ring);
    const l1 = bar(-12, 0, 12, 0, 0.025, 0xffffff); s.add(l1);
    return { wh, words, P, pages, ring, l1, blk };
  }, (o, f) => {
    const t = f.t;
    o.wh.act(t < 23.6 ? 'hop' : 'point', t - 23.0, 10).put(5.2, -0.6 + hit(t, 23.6, 0.3) * 0.5, 0.5); o.wh.face(-1);
    o.words.forEach((m, i) => slam(m, t, o.P[i][1], 1 + (i === 2 ? hit(t, 23.6, 0.3) * 0.1 : 0), 0.13, 2.6));
    o.pages.forEach((m, i) => {
      const k = seg(t, 23.6 + rnd(i) * 0.3, 24.9);
      m.visible = t > 23.6; m.position.set((rnd(i * 3) - 0.5) * 13, -2 + k * (7 + rnd(i * 5) * 5), 1 + rnd(i * 7) * 2); m.rotation.set(t * 3 + i, t * 4 + i, i);
    });
    o.ring.position.set(5.2, 2, 0.2); o.ring.scale.setScalar(0.2 + eo(seg(t, 23.6, 24.5)) * 1.3); o.ring.visible = t > 23.6;
    o.l1.position.set(0, 2.5, 0.3); o.l1.rotation.z = -0.35 + t * 0.25;
    f.hud.bars = 1.5; f.hud.shake = hit(t, 23.6, 0.3) * 0.45 + hit(t, 23.04, 0.15) * 0.2; f.hud.flash = hit(t, 23.6, 0.1) * 0.5;
    f.look(0, 2.5, 12 - seg(t, 23, 24.5) * 0.8, 0, 2.5, 0, 35, -0.02);
  });

  /* ───── 片头：四扇拱窗里的四个女孩 ───── */
  shot('IN', bt(47), bt(55), s => {
    s.add(backdrop(grungeTex(), 60, 34, -8));
    const who = ['doubao', 'whale', 'claude', 'gpt'] as const, hs = [3.0, 3.1, 3.1, 3.5];
    const cells = who.map((w, i) => {
      const g = new THREE.Group(); at(g, [-5.1 + i * 3.4, 0.3, 0], s);
      const dim = gothicArch(2.6, 5.4, 0x2a0104); const lit = gothicArch(2.6, 5.4, 0xffffff); lit.position.z = 0.01;
      const a = new Actor(w, hs[i]); if (w === 'gpt') a.act('hover'); a.put(0, 0.25, 0.05); a.sil(1);
      g.add(dim, lit, a); return { g, lit, a };
    });
    const chars = [...'逃离童话镇'].map((c, i) => {
      const m = txt(c, 1.9, { font: FONT.brush, color: '#ffffff', stroke: '#16090a', sw: 0.05, rough: true, px: 200 });
      at(m, [-4.4 + i * 2.2, 1.25 + (i % 2 ? -0.2 : 0.15), 1.6], s); m.rotation.z = (rnd(i * 9) - 0.5) * 0.2; return m;
    });
    const en = txt('ESCAPE  FROM  FAIRY  TALE  TOWN', 0.3, { font: FONT.hei, color: '#fff', sp: 0.5 }); at(en, [0, 0.0, 1.7], s);
    return { cells, chars, en };
  }, (o, f) => {
    const t = f.t, burst = bt(54);
    o.cells.forEach((c, i) => {
      const a = bt(47 + i);
      c.lit.visible = t >= a; c.a.visible = t >= a;
      c.g.scale.setScalar(1 + hit(t, a, 0.3) * 0.12 + hit(t, burst, 0.3) * 0.08);
      (c.lit.material as THREE.MeshBasicMaterial).color.set(t >= burst ? C.mag : 0xffffff);
      c.a.sil(t >= burst ? 0 : 1);
      if (i === 3) c.a.act('hover', t, 8); else c.a.act(t >= burst ? 'hop' : 'idle', t, 9);
    });
    o.chars.forEach((m, i) => slam(m, t, bt(51) + i * BEAT * 0.5, 1 + hit(t, burst, 0.3) * 0.1, 0.16, 2.8));
    (o.en.material as THREE.Material).opacity = seg(t, bt(53.5), bt(54));
    let fl = hit(t, burst, 0.2) * 0.6; for (let i = 0; i < 4; i++) fl += hit(t, bt(47 + i), 0.12) * 0.25;
    f.hud.flash = fl; f.hud.flashCol = t >= burst ? '#fff' : '#ff2a4a';
    f.hud.shake = hit(t, burst, 0.3) * 0.4 + hit(t, bt(51), 0.2) * 0.15;
    f.look(Math.sin(t * 0.7) * 0.3, 2.9, lerp(15.5, 12.8, seg(t, bt(47), bt(55))), 0, 2.8, 0, 35, Math.sin(t * 0.9) * 0.015);
  });
}
export const _u1 = [clamp, disc, grp, show];
