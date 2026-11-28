import * as THREE from 'three';
import { Actor, C, FONT, TAU, at, back, backdrop, ball, box, bt, disc, ei, eio, eo, grungeTex, hit, lerp, lights, paper, pop, quad, radialTex, ringM, rnd, seg, shot, slam, txt, vertTex, type Who } from './engine';
import { bar, bubble, cloud, crown, ground, heart, keyMesh, lips, openBook, prince, quill, rifle, rose, shards, spot, tag, theatre, towerSil, wing, wolf } from './props';
import { hunter } from './shots2';

const BR = { rough: true, stroke: 'rgba(20,0,2,.6)', sw: 0.03 };
const st4 = (r: number, c: number) => paper([[0, r], [r * 0.22, r * 0.22], [r, 0], [r * 0.22, -r * 0.22], [0, -r], [-r * 0.22, -r * 0.22], [-r, 0], [-r * 0.22, r * 0.22]], c);

/** "去他的"三连砸 */
function damn(id: string, a: number, b: number, ts: number[], inv: boolean, extra: (s: THREE.Scene) => (t: number) => void) {
  shot(id, a, b, s => {
    s.background = new THREE.Color(inv ? 0x0a0607 : C.mag);
    const cs = [...'去他的'].map((c, i) => { const m = txt(c, 3.7, { font: FONT.hei, color: inv ? '#f0128a' : '#0a0607', px: 220 }); at(m, [-4.4 + i * 4.4, 2.55 + (i === 1 ? 0.25 : -0.15), -1], s); m.rotation.z = (i - 1) * -0.08; return m; });
    const l = bar(-14, 0, 14, 0, 0.03, 0xffffff); at(l, [0, 2.5, 0.2], s);
    return { cs, l, ex: extra(s) };
  }, (o, f) => {
    const t = f.t;
    o.cs.forEach((m, i) => slam(m, t, ts[i], 1, 0.11, 3));
    o.l.rotation.z = (inv ? 0.5 : -0.5) + t * 0.5; o.ex(t);
    f.hud.bars = 1.5; f.hud.shake = ts.reduce((s2, x) => s2 + hit(t, x, 0.18) * 0.5, 0);
    f.look(0, 2.5, 12, 0, 2.5, 0, 35, inv ? -0.04 : 0.04);
  });
}

export function reg4() {
  damn('C1a', 76.7, 77.5, [76.76, 77.24, 77.42], false, s => {
    const w = new Actor('whale', 3.4); s.add(w);
    const k = keyMesh(0xffffff); k.scale.setScalar(0.7); s.add(k);
    return t => { w.act('shake', t, 12).put(0, -0.9 + hit(t, 76.76, 0.3) * 0.4, 0.5); k.position.set(1.5 + (t - 76.76) * 9, 2 + (t - 76.76) * 6, 0.6); k.rotation.z = t * 18; };
  });

  /* ───── 乖巧 只会 饲养 恶狼 ───── */
  shot('C1b', 77.5, 79.48, s => {
    s.background = new THREE.Color(C.mag);
    at(quad(30, 2.4, 0x0a0607), [0, -1.3, -0.5], s);
    const w = wolf(0x0a0607); s.add(w);
    const d = new Actor('doubao', 3.5); s.add(d);
    const t1 = tag('乖巧'), t2 = tag('和善'); s.add(t1, t2);
    const g1 = txt('乖巧', 1.5, { font: FONT.hei, color: '#fff' }); at(g1, [-4.4, 4.25, 0.4], s); g1.rotation.z = 0.05;
    const strike = bar(-1.9, -0.25, 1.9, 0.3, 0.2, 0x0a0607); at(strike, [-4.4, 4.25, 0.5], s);
    const g2 = txt('只会', 0.9, { font: FONT.hei, color: '#fff', sp: 0.2 }); at(g2, [-1.5, 4.4, 0.4], s);
    const g3 = txt('饲养', 1.3, { font: FONT.hei, color: '#fff', sp: 0.1 }); at(g3, [0.9, 4.3, 0.4], s);
    const g4 = txt('恶狼', 2.5, { ...BR, px: 200 }); at(g4, [3.2, 1.55, 1.2], s); g4.rotation.z = -0.06;
    const cakes = [0, 1, 2, 3].map(i => { const c = ball(0.16, i % 2 ? 0xffd166 : 0xffffff, true, 0); s.add(c); return c; });
    return { w, d, t1, t2, g1, strike, g2, g3, g4, cakes };
  }, (o, f) => {
    const t = f.t;
    const sc = 1.0 + 0.45 * back(seg(t, 78.12, 78.34)) + 0.6 * back(seg(t, 78.58, 78.8)) + 0.95 * back(seg(t, 79.14, 79.36));
    o.w.scale.setScalar(sc); o.w.position.set(3.4, -1.1, -0.2); o.w.userData.eye.scale.setScalar(1 + hit(t, 79.14, 0.4) * 2.5);
    o.d.act(t < 78.58 ? 'sway' : 'surprise', t - 78.58, 10, t < 78.58).put(-3.2, -0.9, 0.6);
    [o.t1, o.t2].forEach((tg, i) => { const k = Math.max(0, t - 77.52); tg.scale.setScalar(0.8); tg.position.set(-3.6 + i * 1.4 + k * (i ? 5 : -4), 1.6 + k * 7 - k * k * 4, 0.9); tg.rotation.z = k * (i ? -9 : 9); });
    slam(o.g1, t, 77.52, 1, 0.12, 2.6); slam(o.strike, t, 77.78, 1, 0.1, 1.6); slam(o.g2, t, 78.12, 1, 0.12, 2.2); slam(o.g3, t, 78.58, 1, 0.12, 2.4); slam(o.g4, t, 79.14, 1, 0.13, 3);
    o.cakes.forEach((c, i) => { const k = seg(t, 78.58 + i * 0.1, 78.95 + i * 0.1); c.visible = k > 0 && k < 1; c.position.set(lerp(-2.4, 2.6, k), 1.2 + Math.sin(k * Math.PI) * 1.6, 0.4); });
    f.hud.bars = 1.5; f.hud.shake = (hit(t, 77.52, 0.2) + hit(t, 78.12, 0.18) + hit(t, 78.58, 0.18)) * 0.3 + hit(t, 79.14, 0.3) * 0.6; f.hud.flash = hit(t, 79.14, 0.12) * 0.5;
    f.look(0, 2.5, 12, 0, 2.5, 0, 35, 0.02);
  });

  /* ───── 我要 驯服 龙的 翅膀 ───── */
  shot('C1c', 79.48, 80.8, s => {
    s.add(backdrop(vertTex(0xff3d9e, 0xffe08a, 0xff9ab8), 120, 60, -30));
    const cl = Array.from({ length: 14 }, (_, i) => { const c = cloud(i % 3 ? 0xffffff : 0xffd0e6); c.scale.setScalar(1.2 + rnd(i) * 2); s.add(c); return c; });
    const G = new THREE.Group(); s.add(G);
    const wb = wing(0xe6dcff, 0xbfaee8); at(wb, [-0.5, 1.9, -0.2], G); const wa = wing(0xffffff, 0xdcd2f6); at(wa, [-0.5, 1.9, -0.1], G);
    const g = new Actor('gpt', 3.3); g.raw('gpt_fly'); G.add(g);
    const w = new Actor('whale', 1.9); w.put(-0.75, 2.0, 0.15); G.add(w);
    G.add(at(bar(-0.5, 3.0, 0.9, 2.5, 0.03, 0xffffff), [0, 0, 0.12]));
    const t1 = txt('驯服', 2.0, BR); at(t1, [-3.3, 4.0, 1], s); t1.rotation.z = 0.08;
    const t2 = txt('翅膀', 1.8, BR); at(t2, [3.5, 1.1, 1], s); t2.rotation.z = -0.06;
    return { cl, G, wa, wb, g, w, t1, t2 };
  }, (o, f) => {
    const t = f.t, spread = 1 + back(seg(t, 80.46, 80.7)) * 0.55, fl = Math.sin(t * 11) * 0.3;
    o.cl.forEach((c, i) => c.position.set(14 - ((t * (7 + rnd(i) * 6) + rnd(i * 3) * 28) % 28), -1 + rnd(i * 5) * 7, -4 + rnd(i * 7) * 3));
    o.G.position.set(lerp(-1.4, 0.4, f.p), 0.2 + Math.sin(t * 5) * 0.15 + f.p * 0.7, 0); o.G.rotation.z = 0.14;
    o.wa.rotation.z = 2.0 + fl; o.wb.rotation.z = 1.25 + fl * 0.8; o.wa.scale.setScalar(spread); o.wb.scale.setScalar(spread * 0.95);
    o.g.raw('gpt_fly', t, 6); o.w.act('hop', t, 10);
    slam(o.t1, t, 79.76, 1, 0.12, 2.6); slam(o.t2, t, 80.46, 1, 0.12, 2.6);
    f.hud.shake = hit(t, 79.76, 0.2) * 0.3 + hit(t, 80.46, 0.25) * 0.45; f.hud.flash = hit(t, 80.46, 0.14) * 0.6;
    f.look(0.5, 2.0, 11.4, 0, 2.6, 0, 36, -0.07);
  });

  damn('C2a', 80.8, 81.6, [80.84, 81.32, 81.48], true, s => {
    const d = new Actor('doubao', 3.3); s.add(d);
    const w = wolf(0x5e0838); w.scale.setScalar(0.95); s.add(w);
    return t => { d.act('hop', t, 12).put(-1.6, -0.9, 0.5); const k = eo(seg(t, 81.32, 81.58)); w.position.set(2.2 + k * 1.5, -0.9, 0.3); w.rotation.z = -k * 1.35; };
  });

  /* ───── 沉默 只能 交换 假象 ───── */
  shot('C2b', 81.6, 83.46, s => {
    s.add(backdrop(radialTex(0x7a2ab8, 0x12052a, 0.5, 0.5, 0.6), 70, 40, -9));
    const mir = new THREE.Group(); mir.add(quad(3.0, 4.0, 0xffffff), at(quad(2.7, 3.7, 0xff9ad0), [0, 0, 0.01])); const pm = prince(); pm.scale.setScalar(0.6); pm.position.set(0, -1.4, 0.02); mir.add(pm); at(mir, [1.2, 2.6, -1.4], s); mir.rotation.z = 0.05;
    const bot = new THREE.Group(); bot.add(paper([[-0.32, 0], [0.32, 0], [0.32, 0.7], [0.13, 0.95], [0.13, 1.2], [-0.13, 1.2], [-0.13, 0.95], [-0.32, 0.7]], 0xbfe8ff, { transparent: true, opacity: 0.45 }), at(quad(0.3, 0.14, 0x8a5a2a), [0, 1.25, 0.01])); bot.scale.setScalar(2.2); at(bot, [4.3, -0.5, 0.3], s);
    const orb = new THREE.Group(); orb.add(disc(0.26, 0xffffff), at(ringM(0.34, 0.4, 0xffe27a), [0, 0, -0.01]), at(st4(0.8, 0xfff2a8), [0, 0, -0.02])); s.add(orb);
    const w = new Actor('whale', 3.2); w.put(-3.4, -0.9, 0.5); s.add(w);
    const s1 = shards(12, [0xbfe8ff, 0xffffff], 0.3), s2 = shards(18, [0xffffff, 0xff9ad0, 0xd8b46a], 0.5); [...s1, ...s2].forEach(m => s.add(m));
    const arcs = [0, 1, 2].map(() => { const r = ringM(1, 1.05, 0xffffff, { transparent: true }); s.add(r); return r; });
    const g1 = txt('沉默', 1.8, BR); at(g1, [-3.8, 4.2, 0.6], s); const stk = bar(-2, -0.2, 2, 0.25, 0.16, 0xffffff); at(stk, [-3.8, 4.2, 0.7], s);
    const g2 = txt('交换', 1.3, { font: FONT.hei, sp: 0.15 }); at(g2, [1.4, 4.5, 0.6], s);
    const g3 = txt('假象', 2.8, BR); at(g3, [2.4, 1.6, 1.2], s); g3.rotation.z = -0.07;
    return { mir, bot, orb, w, s1, s2, arcs, g1, stk, g2, g3 };
  }, (o, f) => {
    const t = f.t, fly = eio(seg(t, 82.64, 83.1));
    o.bot.visible = t < 82.64; o.bot.rotation.z = Math.sin(t * 40) * 0.05 * seg(t, 82.1, 82.64);
    o.orb.position.set(lerp(4.3, -3.0, fly), lerp(0.6, 1.2, fly) + Math.sin(fly * Math.PI) * 2, 0.6); o.orb.scale.setScalar(0.9 + f.bp * 0.3); o.orb.children[2].rotation.z = t * 4;
    o.w.act(t < 82.64 ? 'shake' : t < 83.1 ? 'surprise' : 'wave', t - 82.64, 10, t < 82.64 || t >= 83.1);
    o.s1.forEach((m, i) => { const k = seg(t, 82.64, 83.3), a = rnd(i * 3) * TAU; m.visible = k > 0 && k < 1; m.position.set(4.3 + Math.cos(a) * k * 3.5, 1 + Math.sin(a) * k * 3 - k * k * 2, 0.5); m.rotation.z = k * 10 + i; });
    o.mir.visible = t < 83.16;
    o.s2.forEach((m, i) => { const k = seg(t, 83.16, 83.9), a = rnd(i * 5) * TAU; m.visible = k > 0; m.position.set(1.2 + Math.cos(a) * (0.6 + k * 7), 2.6 + Math.sin(a) * (0.6 + k * 5), -1); m.rotation.z = k * 8 + i; m.scale.setScalar(1.6); });
    o.arcs.forEach((r, i) => { const k = ((t - 83.1) * 2 + i * 0.33) % 1; r.visible = t > 83.1; r.position.set(-3.0, 1.6, 0.3); r.scale.setScalar(0.4 + k * 3); (r.material as THREE.Material).opacity = 1 - k; });
    slam(o.g1, t, 81.62, 1, 0.12, 2.6); slam(o.stk, t, 82.12, 1, 0.1, 1.5); slam(o.g2, t, 82.64, 1, 0.12, 2.4); slam(o.g3, t, 83.16, 1, 0.12, 3);
    f.hud.shake = hit(t, 81.62, 0.2) * 0.3 + hit(t, 82.64, 0.25) * 0.45 + hit(t, 83.16, 0.25) * 0.5; f.hud.flash = hit(t, 82.64, 0.12) * 0.6 + hit(t, 83.16, 0.12) * 0.5;
    f.look(0, 2.5, 12 - f.p * 0.6, 0, 2.5, 0, 35, -0.02);
  });

  /* ───── 这次 不用 王子 登场 ───── */
  shot('C2c', 83.46, 84.92, s => {
    theatre(s);
    const pr = prince(); s.add(pr);
    const bub = bubble('我来拯救你——', 0.3); s.add(bub);
    const x1 = bar(-1.6, -1.6, 1.6, 1.6, 0.42, 0x0a0607), x2 = bar(-1.6, 1.6, 1.6, -1.6, 0.42, 0x0a0607); s.add(x1, x2);
    const hs = (['doubao', 'whale', 'claude'] as const).map((w, i) => { const a = new Actor(w, 2.9); a.put(-4.3 + i * 1.75, 0, 0.2 + i * 0.01); s.add(a); return a; });
    const cr = crown(0.55); cr.position.set(0.05, 2.72, 0.02); hs[2].add(cr);
    const sp = spot(0.4, 6.5, 9, 0xfff0f6, 0.2); at(sp, [-2.5, 0, 0.5], s);
    const no = txt('不用', 2.0, { font: FONT.hei, color: '#fff', stroke: '#0a0607', sw: 0.04 }); at(no, [-2.2, 4.6, 1.2], s); no.rotation.z = 0.06;
    return { pr, bub, x1, x2, hs, no };
  }, (o, f) => {
    const t = f.t, yank = ei(seg(t, 84.56, 84.86));
    const px = lerp(8, 2.5, eo(seg(t, 83.5, 83.78))) + yank * 8;
    o.pr.position.set(px, Math.abs(Math.sin(t * 9)) * 0.08 + yank * 1.5, 0); o.pr.rotation.z = -yank * 1.3;
    o.bub.position.set(px - 0.4, 3.9, 0.5); o.bub.visible = t > 83.55 && t < 83.82; o.bub.scale.setScalar(pop(t, 83.55, 0.15));
    [o.x1, o.x2].forEach((x, i) => { slam(x, t, 83.82 + i * 0.07, 1, 0.1, 2.4); x.position.set(px, 1.7 + yank * 1.5, 0.6); });
    slam(o.no, t, 83.82, 1, 0.12, 2.6);
    o.hs.forEach((a, i) => a.act(t > 84.56 ? 'hop' : i === 2 ? 'shake' : i === 1 ? 'shake' : 'tilt', t, 11));
    f.hud.shake = hit(t, 83.82, 0.25) * 0.45 + hit(t, 84.56, 0.25) * 0.4; f.hud.flash = hit(t, 83.82, 0.1) * 0.5;
    f.look(0, 2.9, 12.4 - f.p * 0.7, 0, 2.9, 0, 34);
  });

  /* ───── 如果 被 爱 才是 终章——我要 自己 写 答案 ───── */
  shot('C3', 84.92, 89.1, s => {
    s.add(backdrop(grungeTex(0x7a060e, 0x120102, 6), 70, 40, -9));
    const PX = 1.9, PY = 2.7, W = 6.4, H = 4.7;
    at(quad(W + 0.15, H + 0.15, 0x1a0508), [PX + 0.1, PY - 0.1, -0.12], s);
    const blank = quad(W, H, 0xfbf3e2); at(blank, [PX, PY, -0.08], s);
    const ans = [...'答案'].map((c, i) => { const m = txt(c, 2.5, { color: '#0a0607', rough: true }); at(m, [PX - 1.3 + i * 2.6, PY, 0.3], s); m.rotation.z = (i ? -0.08 : 0.06); return m; });
    const splat = Array.from({ length: 12 }, (_, i) => { const d = disc(0.05 + rnd(i) * 0.14, 0x0a0607, {}, 10); at(d, [PX + (rnd(i * 3) - 0.5) * 5.6, PY + (rnd(i * 5) - 0.5) * 4, 0.02], s); return d; });
    const piv = new THREE.Group(); at(piv, [PX - W / 2, PY, 0], s);
    const pg = new THREE.Group(); pg.position.x = W / 2; piv.add(pg);
    pg.add(quad(W, H, C.paper));
    pg.add(at(txt('THE END', 0.95, { font: FONT.serif, weight: '900', color: '#b30a14', sp: 0.08 }), [0, 1.35, 0.02]));
    pg.add(at(quad(3.6, 0.03, 0xb30a14), [0, 0.72, 0.02]));
    const hr = heart(C.rose, 1.1); at(hr, [-1.75, -0.6, 0.02], pg);
    pg.add(at(txt('被爱', 0.8, { font: FONT.serif, weight: '900', color: '#16090a' }), [0.4, -0.05, 0.02]));
    pg.add(at(txt('从此幸福地生活在一起', 0.3, { font: FONT.serif, color: 'rgba(40,20,16,.6)' }), [0.4, -0.85, 0.02]));
    const seal = new THREE.Group(); seal.add(ringM(0.8, 0.93, C.blood), at(txt('终章', 0.7, { font: FONT.serif, weight: '900', color: '#e01b24' }), [0, 0, 0.01])); at(seal, [2.1, -1.2, 0.04], pg); seal.rotation.z = -0.25;
    const k1 = bar(-2.9, 0.9, 2.9, 1.8, 0.22, 0x0a0607), k2 = bar(-2.6, -1.6, 2.8, -0.4, 0.22, 0x0a0607); pg.add(at(k1, [0, 1.35, 0.05]), at(k2, [0, -1.0, 0.05]));
    k1.position.set(0, 1.35, 0.05); k2.position.set(0, -1.0, 0.05);
    const cl = new Actor('claude', 3.2); s.add(cl); const cr = crown(0.6); cr.position.set(0.06, 3.0, 0.02); cl.add(cr);
    const q = quill(0xffffff); q.scale.setScalar(0.8); s.add(q);
    return { piv, hr, seal, k1, k2, cl, q, ans, splat, PX, PY };
  }, (o, f) => {
    const t = f.t, flip = eio(seg(t, 88.1, 88.48));
    o.piv.rotation.y = -flip * Math.PI * 0.985;
    o.hr.scale.setScalar(1 + hit(t, 85.52, 0.3) * 0.25 + hit(t, 85.98, 0.3) * 0.4);
    slam(o.seal, t, 86.46, 1, 0.12, 3.5);
    [o.k1, o.k2].forEach((k, i) => { const a = 87.58 + i * 0.16; k.visible = t > a; k.scale.x = eo(seg(t, a, a + 0.13)); });
    o.cl.act(t < 86.94 ? 'sad' : t < 88.1 ? 'hop' : 'nod', t, 10).put(-4.5, -0.5, 1.2);
    o.ans.forEach((m, i) => slam(m, t, 88.52 + i * 0.28, 1, 0.14, 2.6));
    o.splat.forEach((d, i) => { d.visible = t > 88.52 + (i % 2) * 0.28; d.scale.setScalar(pop(t, 88.52 + (i % 2) * 0.28)); });
    const qk = eo(seg(t, 86.94, 87.5)), sw = seg(t, 87.58, 87.9), wr = eo(seg(t, 88.4, 88.6));
    o.q.visible = t > 86.94;
    o.q.position.set(lerp(lerp(-4.0, -1.2, qk) + sw * 5.5, o.PX + 0.6 + Math.sin(t * 20) * 0.5, wr), lerp(lerp(1.5, 4.3, qk) + sw * 0.8 - (sw > 0.5 ? (sw - 0.5) * 3 : 0), o.PY - 0.3 + Math.cos(t * 17) * 0.4, wr), 1.4);
    o.q.rotation.z = -0.5 + Math.sin(t * 20) * 0.08;
    f.hud.shake = hit(t, 86.46, 0.2) * 0.35 + hit(t, 87.58, 0.25) * 0.45 + hit(t, 88.52, 0.25) * 0.45 + hit(t, 88.8, 0.2) * 0.3;
    f.hud.flash = hit(t, 87.58, 0.1) * 0.5 + hit(t, 88.52, 0.12) * 0.5; f.hud.flashCol = t > 88.4 ? '#f0128a' : '#fff';
    f.look(0, 2.6, 12 - eo(f.p) * 1.2, 0, 2.6, 0, 35, Math.sin(t * 0.9) * 0.012);
  });

  /* ───── 我宁愿… 自己 拿起 ───── */
  shot('C4', 89.1, 91.06, s => {
    s.add(backdrop(grungeTex(0x5a040a, 0x0c0102, 8), 70, 40, -9));
    at(quad(40, 2.4, 0x070203), [0, -1.6, 0.4], s);
    at(quad(1.6, 1.0, 0x070203), [1.6, -0.1, -0.1], s);
    const sp = spot(0.4, 4.6, 10, 0xff8090, 0.2); at(sp, [1.4, -0.5, -0.3], s);
    const rf = rifle(C.ink); s.add(rf);
    const roses = Array.from({ length: 6 }, (_, i) => { const r = rose(0.26, C.blood); at(r, [0.3 + i * 0.5, 0.45 + (i % 2) * 0.25, 0.1], s); return r; });
    const d = new Actor('doubao', 2.8); s.add(d);
    const t1 = txt('自己', 1.3, { font: FONT.hei, sp: 0.3 }); at(t1, [-2.6, 4.1, 0.5], s);
    const t2 = [...'拿起'].map((c, i) => { const m = txt(c, 2.1, BR); at(m, [2.7 + i * 2.0, 3.8 - i * 0.3, 0.6], s); return m; });
    return { rf, roses, d, t1, t2, sp };
  }, (o, f) => {
    const t = f.t, k = eio(seg(t, 90.3, 90.8));
    const x = lerp(-6.5, -0.6, seg(t, 89.1, 90.3));
    if (t < 90.3) o.d.walk(t, 10); else o.d.act('idle', t, 8);
    o.d.put(x, -0.5 + (t < 90.3 ? Math.abs(Math.sin(t * 6.15)) * 0.07 : 0), 0.2).sil(1 - seg(t, 90.8, 91.0) * 0.5);
    o.rf.position.set(lerp(1.5, 0.3, k), lerp(0.75, 1.6, k), lerp(0, 0.3, k)); o.rf.rotation.z = lerp(0.12, 1.05, k); o.rf.scale.setScalar(1.15);
    o.roses.forEach((r, i) => { r.position.y = 0.45 + (i % 2) * 0.25 - k * k * 2 * (0.5 + rnd(i)); r.rotation.z = k * (i - 3); });
    slam(o.t1, t, 89.76, 1, 0.13, 2); o.t2.forEach((m, i) => slam(m, t, [90.3, 90.8][i], 1, 0.13, 2.8));
    f.hud.shake = hit(t, 90.3, 0.2) * 0.3 + hit(t, 90.8, 0.2) * 0.35; f.hud.fade = 1 - seg(t, 89.1, 89.4);
    f.look(0.6, 2.3, 11.6 - eo(f.p) * 1.6, 0.6, 2.3, 0, 35);
  });
  /* ───── 猎枪！ ───── */
  shot('C4b', 91.06, 93.08, s => {
    s.add(backdrop(grungeTex(0xd0101c, 0x3a0206, 7), 70, 40, -9));
    const rays = new THREE.Group(); at(rays, [0, 2.4, -3], s);
    for (let i = 0; i < 18; i++) { const r = paper([[0, 0], [16, -0.9], [16, 0.9]], i % 2 ? 0x8a060e : 0x2a0104); r.rotation.z = (i / 18) * TAU; rays.add(r); }
    const hu = hunter(0x2a0104); hu.scale.setScalar(1.0); s.add(hu);
    const rf = rifle(C.ink); rf.scale.setScalar(2.1); rf.rotation.z = 0.62; at(rf, [0.9, 2.5, 0.2], s);
    const rfo = rifle(0xffffff); rfo.scale.setScalar(2.18); rfo.rotation.z = 0.62; at(rfo, [0.9, 2.5, 0.18], s);
    const d = new Actor('doubao', 5.6); d.put(-0.2, -2.0, 0.5); s.add(d);
    const g1 = txt('猎', 3.4, { ...BR, px: 220 }); at(g1, [-4.0, 3.0, 1.2], s); g1.rotation.z = 0.08;
    const g2 = txt('枪', 3.4, { ...BR, px: 220 }); at(g2, [4.1, 2.1, 1.2], s); g2.rotation.z = -0.08;
    const roses = Array.from({ length: 10 }, (_, i) => { const r = rose(0.22 + rnd(i) * 0.15, i % 3 ? 0x16090a : 0xffffff, i % 3 ? 0x000000 : 0xd9c8c8); s.add(r); return r; });
    return { rays, hu, d, g1, g2, roses };
  }, (o, f) => {
    const t = f.t;
    o.rays.rotation.z = t * 0.5; o.rays.scale.setScalar(1 + f.bp * 0.05);
    o.d.act('nod', t - 91.06, 6, false); o.d.position.y = -2.0 + hit(t, 91.08, 0.25) * 0.3;
    const hf = eio(seg(t, 92.0, 92.6)); o.hu.position.set(5.6 + hf * 1.5, -1.2 - hf * 0.6, -1); o.hu.rotation.z = -hf * 1.4;
    slam(o.g1, t, 91.08, 1, 0.13, 3); slam(o.g2, t, 91.74, 1, 0.13, 3);
    o.roses.forEach((r, i) => { const k = (t - 91.06) * (0.5 + rnd(i) * 0.6); r.position.set((rnd(i * 3) - 0.5) * 14 + Math.sin(t + i) * 0.4, 6.5 - ((k * 4 + rnd(i * 7) * 9) % 9), 0.9); r.rotation.z = t * 2 + i; });
    f.hud.flash = hit(t, 91.08, 0.12) * 0.7 + hit(t, 91.74, 0.14) * 0.8; f.hud.shake = hit(t, 91.08, 0.3) * 0.5 + hit(t, 91.74, 0.35) * 0.6;
    f.look(0, 2.2, 11.5 - eo(f.p) * 1.3, 0, 2.6, 0, 36, 0.03);
  });

  /* ───── 毙掉 这 循环的 回响！ ───── */
  shot('C5', 93.08, 97.15, s => {
    s.add(backdrop(radialTex(0x7a0812, 0x050102, 0.5, 0.5, 0.42), 70, 40, -9));
    const ring = new THREE.Group(); at(ring, [0, 2.9, -1], s);
    const mk = [() => { const w = wolf(C.ink); w.scale.setScalar(0.2); w.position.set(-0.1, -0.42, 0.01); return w; }, () => heart(C.blood, 0.42), () => { const c = crown(0.6, C.goldD); c.position.y = -0.2; return c; }, () => { const tw = towerSil(C.ink, 6); tw.scale.setScalar(0.11); tw.position.y = -0.48; return tw; }, () => lips(C.blood, 0.24), () => { const k = keyMesh(C.ink); k.scale.setScalar(0.24); k.position.y = 0.3; return k; }];
    const cards = Array.from({ length: 18 }, (_, i) => { const g = new THREE.Group(); g.add(quad(1.0, 1.3, i % 2 ? C.paper : 0xffe9ee)); const ic = mk[i % 6](); ic.position.z = 0.02; g.add(ic); ring.add(g); return g; });
    const mid = txt('循环', 1.1, { font: FONT.hei, sp: 0.2 }); at(mid, [0, 2.9, 0], s);
    const echo = [0, 1, 2, 3].map(i => { const r = ringM(1, 1.07, i % 2 ? 0xffffff : C.blood, { transparent: true }); at(r, [0, 2.9, -0.5], s); return r; });
    const g1 = txt('回', 3.8, { ...BR, px: 220 }); at(g1, [-2.6, 3.1, 1.2], s); g1.rotation.z = 0.08;
    const g2 = txt('响', 3.8, { ...BR, px: 220 }); at(g2, [2.7, 2.6, 1.2], s); g2.rotation.z = -0.07;
    const d = new Actor('doubao', 2.5); d.put(0, -1.3, 1.6); s.add(d);
    const rf = rifle(0xffffff); rf.scale.setScalar(0.62); rf.rotation.z = 1.3; at(rf, [0.55, 0.4, 1.7], s);
    const shot1 = bar(0.75, 1.4, 0.2, 2.9, 0.06, 0xffffff); at(shot1, [0, 0, 1.5], s);
    const boom = st4(1.6, 0xffffff); at(boom, [0.85, 1.55, 1.8], s);
    const bang = [...'毙掉'].map((c, i) => { const m = txt(c, 1.9, BR); at(m, [-4.7 + i * 9.4, 1.6, 1.4], s); m.rotation.z = i ? -0.1 : 0.1; return m; });
    return { ring, cards, mid, echo, g1, g2, d, shot1, boom, bang };
  }, (o, f) => {
    const t = f.t, brk = eo(seg(t, 95.28, 96.3));
    o.ring.rotation.z = -t * 0.9 - Math.max(0, t - 93.88) * 1.6;
    o.cards.forEach((c, i) => { const a = (i / 18) * TAU, R = 2.85 + brk * 13; c.position.set(Math.cos(a) * R, Math.sin(a) * R, 0); c.rotation.z = a - Math.PI / 2 + brk * (3 + i); c.scale.setScalar(0.72 + f.bp * 0.06); });
    slam(o.mid, t, 93.88, 1, 0.12, 2.4); o.mid.visible = t > 93.88 && t < 95.28; o.mid.rotation.z = -(t - 93.88) * 1.2;
    [95.28, 95.82, 96.33, 96.84].forEach((a, i) => { const k = seg(t, a, a + 0.9), r = o.echo[i]; r.visible = k > 0 && k < 1; r.scale.setScalar(0.5 + eo(k) * 9); (r.material as THREE.Material).opacity = 1 - k; });
    slam(o.g1, t, 95.28, 1, 0.13, 3); slam(o.g2, t, 95.82, 1, 0.13, 3);
    const fire = hit(t, 93.13, 0.14) + hit(t, 93.6, 0.14);
    o.shot1.visible = o.boom.visible = fire > 0; o.boom.scale.setScalar(0.4 + fire); o.boom.rotation.z = t * 9;
    o.d.act('idle', t, 8); o.d.position.y = -1.3 - fire * 0.12;
    o.bang.forEach((m, i) => { slam(m, t, [93.13, 93.6][i], 1, 0.11, 2.8); m.visible = m.visible && t < 95.28; });
    f.hud.flash = hit(t, 93.13, 0.14) * 0.95 + hit(t, 93.6, 0.14) * 0.8 + hit(t, 95.28, 0.16) * 0.7 + hit(t, 95.82, 0.14) * 0.4; f.hud.flashCol = t > 95 ? '#ff2a4a' : '#fff';
    f.hud.shake = hit(t, 93.13, 0.3) * 0.7 + hit(t, 93.6, 0.3) * 0.6 + hit(t, 95.28, 0.35) * 0.6 + hit(t, 95.82, 0.3) * 0.5;
    f.look(0, 2.6, 13 - f.p * 1.3, 0, 2.7, 0, 36, (t - 93.08) * 0.035);
  });

  /* ───── 我 对 此！ ───── */
  shot('C6a', 97.15, 98.72, s => {
    s.background = new THREE.Color(0x070304);
    const who: Who[] = ['whale', 'doubao', 'claude'], cols = [C.mag, 0xffffff, C.blood], hs = [4.7, 5.0, 4.7];
    const cells = who.map((w, i) => {
      const g = new THREE.Group(); at(g, [-4.45 + i * 4.45, 2.5, 0], s);
      g.add(quad(4.3, 9, cols[i]));
      const a = new Actor(w, hs[i]); a.put(0, -3.9, 0.2); g.add(a);
      if (i === 2) { const cr = crown(0.9); cr.position.set(0.08, 4.4, 0.02); a.add(cr); }
      const c = txt('我对此'[i], 2.6, { font: FONT.hei, color: i === 1 ? '#0a0607' : '#fff', stroke: i === 1 ? '#fff' : '#0a0607', sw: 0.04, px: 200 }); at(c, [[1.0, 1.1, -1.0][i], -1.3, 0.6], g); c.rotation.z = (i - 1) * 0.08;
      return { g, a, c };
    });
    return { cells };
  }, (o, f) => {
    const t = f.t, ts = [97.21, 97.68, 97.82];
    o.cells.forEach((c, i) => {
      c.g.visible = t >= ts[i]; c.g.scale.set(1, 1 + hit(t, ts[i], 0.16) * 0.2, 1); c.g.position.y = 2.5 + (i % 2 ? 1 : -1) * hit(t, ts[i], 0.2) * 1.5;
      c.a.act(i === 0 ? 'point' : i === 1 ? 'nod' : 'shake', t - ts[i], 10); slam(c.c, t, ts[i], 1, 0.11, 2.8);
    });
    f.hud.shake = ts.reduce((a, x) => a + hit(t, x, 0.2) * 0.5, 0); f.hud.flash = hit(t, 97.21, 0.1) * 0.6;
    f.look(0, 2.5, 12 - seg(t, 97.82, 98.72) * 0.6, 0, 2.5, 0, 35);
  });
  /* ───── 感到 厌 烦！ ───── */
  shot('C6b', 98.72, 100.9, s => {
    const th = theatre(s, 0xffe3f0, C.mag);
    const who: Who[] = ['doubao', 'whale', 'claude', 'gpt'];
    const hs = who.map((w, i) => { const a = new Actor(w, w === 'gpt' ? 3.2 : 2.9); a.put(-3.6 + i * 2.4, 0, 0.2 + i * 0.01); s.add(a); return a; });
    const cr = crown(0.55); cr.position.set(0.05, 2.72, 0.02); hs[2].add(cr);
    const rf = rifle(C.ink); rf.scale.setScalar(0.6); rf.rotation.z = 1.0; rf.position.set(0.5, 1.5, -0.02); hs[0].add(rf);
    const t0 = txt('感到', 1.2, { font: FONT.hei, color: '#0a0607', sp: 0.4 }); at(t0, [0, 5.0, 0.6], s);
    const g1 = txt('厌', 3.1, { color: '#0a0607', stroke: '#fff', sw: 0.035, rough: true, px: 220 }); at(g1, [-3.4, 3.75, 2.2], s); g1.rotation.z = 0.1;
    const g2 = txt('烦', 3.1, { color: '#0a0607', stroke: '#fff', sw: 0.035, rough: true, px: 220 }); at(g2, [3.4, 3.6, 2.2], s); g2.rotation.z = -0.1;
    const deb = Array.from({ length: 30 }, (_, i) => { const m = quad(0.3 + rnd(i) * 0.4, 0.2 + rnd(i * 3) * 0.3, i % 2 ? C.gold : C.goldL); s.add(m); return m; });
    return { th, hs, t0, g1, g2, deb };
  }, (o, f) => {
    const t = f.t, fall = ei(seg(t, 99.92, 100.7));
    o.hs.forEach((a, i) => { if (i === 3) a.act(t < 99.92 ? 'hover' : 'rage', t, 8); else a.act(t < 99.92 ? 'idle' : 'hop', t, 10); a.sil(t < 99.38 ? 1 : 0); });
    slam(o.t0, t, 98.75, 1, 0.13, 2.2); o.t0.visible = t > 98.75 && t < 99.92;
    slam(o.g1, t, 99.38, 1, 0.12, 3); slam(o.g2, t, 99.92, 1, 0.12, 3);
    [o.th.curL, o.th.midL].forEach(c => { c.position.y = 3.6 - fall * 11; c.rotation.z = fall * 0.5; });
    [o.th.curR, o.th.midR].forEach(c => { c.position.y = 3.6 - fall * 11; c.rotation.z = -fall * 0.5; });
    o.th.val.position.y = 6.75 + fall * 8; o.th.val.rotation.z = fall * 0.25;
    o.deb.forEach((m, i) => { const k = seg(t, 99.92, 100.9); m.visible = k > 0; m.position.set((rnd(i * 3) - 0.5) * 13, 7 - k * (6 + rnd(i) * 8), 1 + rnd(i * 5)); m.rotation.set(t * 5 + i, t * 3, i); });
    f.hud.flash = hit(t, 99.38, 0.12) * 0.6 + hit(t, 99.92, 0.22) * 1.0; f.hud.shake = hit(t, 98.75, 0.2) * 0.2 + hit(t, 99.38, 0.3) * 0.5 + hit(t, 99.92, 0.5) * 0.9;
    f.look(0, 2.9, 12.4 + eo(seg(t, 99.92, 100.9)) * 1.0, 0, 2.9, 0, 34);
  });

  /* ───── 尾声：走出剧场，天亮了 ───── */
  shot('OUT', 100.9, 130, s => {
    s.add(backdrop(vertTex(0x2a1a6e, 0xffc46a, 0xff5fa8), 180, 46, -50));
    s.fog = new THREE.Fog(0xb0508a, 30, 90);
    lights(s, 0.8, 0.9, 0xffd0c0, 0xffc0e0, 0x402050);
    s.add(ground(70, 0x2a1438)); s.add(at(disc(7, 0xfff2c8, { fog: false }), [6, 1.5, -49]));
    [[-7.5, 0.2, -3, 0.5], [-4.2, 0.12, -4.5, -0.3], [-10, 0.3, -6, 1.2]].forEach(p => { const b = box(4.6, 0.25, 2.6, C.gold); b.rotation.y = p[3]; at(b, [p[0], p[1], p[2]], s); });
    [[-9, 2.2, -5, 0.5], [-5.4, 1.3, -6, -1.1]].forEach(p => { const b = box(0.5, 6, 0.5, C.goldD); b.rotation.z = p[3]; at(b, [p[0], p[1], p[2]], s); });
    const bk = openBook(1.9, 1.5, 0x8a1020); bk.rotation.y = 0.3; at(bk, [-2.2, 0.15, 2.4], s);
    const who: [Who, number, number][] = [['doubao', 1.2, 2.5], ['whale', -0.4, 2.5], ['claude', -2.0, 2.5], ['kimi', -3.9, 2.4], ['gemini', -5.5, 2.4], ['qwen', -7.1, 2.4], ['zai', -8.7, 2.4]];
    const ws = who.map(([w, x, h], i) => { const a = new Actor(w, h); a.put(x, 0, -0.6 + (i % 2) * 0.5); s.add(a); a.userData.x0 = x; return a; });
    const cr = crown(0.5); cr.position.set(0.35, 2.3, 0.02); ws[2].add(cr);
    const rf = rifle(C.ink); rf.scale.setScalar(0.52); rf.rotation.z = 2.2; rf.position.set(-0.15, 1.55, -0.02); ws[0].add(rf);
    const g = new Actor('gpt', 2.8); s.add(g);
    const L = [txt('故事的最后——', 0.62, { font: FONT.serif, sp: 0.25 }), txt('她没有等谁来拯救', 0.62, { font: FONT.serif, sp: 0.25 }), txt('她自己，写下结局。', 1.25, { rough: true, stroke: 'rgba(40,10,60,.5)', sw: 0.03 }), txt('逃离童话镇', 1.6, { rough: true, stroke: 'rgba(40,10,60,.5)', sw: 0.03 })];
    L.forEach(m => s.add(m));
    const stars = Array.from({ length: 30 }, (_, i) => { const st = st4(0.1 + rnd(i) * 0.14, 0xffffff); at(st, [-24 + rnd(i * 3) * 60, 7 + rnd(i * 5) * 9, -30], s); return st; });
    return { ws, g, L, stars };
  }, (o, f) => {
    const t = f.t, dt = t - 100.9, cx = dt * 0.42;
    o.ws.forEach((a, i) => { a.walk(t + i * 0.13, 9); a.position.x = a.userData.x0 + dt * 0.55; a.position.y = Math.abs(Math.sin(t * 5.5 + i)) * 0.06; });
    o.g.act('hover', t, 8).put(3.0 + dt * 0.55, 0.5 + Math.sin(t * 2.2) * 0.2, -0.3);
    const T = [[101.3, 103.2], [103.3, 105.2], [105.3, 107.6], [107.8, 130]];
    o.L.forEach((m, i) => { const [a, b] = T[i]; (m.material as THREE.Material).opacity = seg(t, a, a + 0.5) * (1 - seg(t, b - 0.4, b)); m.visible = t > a && t < b; m.position.set(cx + 0.3, (i < 2 ? 4.0 : 3.9) + seg(t, a, b) * 0.12, 1); });
    o.stars.forEach((s2, i) => s2.scale.setScalar((0.4 + Math.abs(Math.sin(t * 2 + i))) * (1 - seg(t, 101, 110) * 0.7)));
    f.hud.fade = 1 - seg(t, 100.9, 101.5); if (t < 101.5) { f.hud.flash = 1 - seg(t, 100.9, 101.5); f.hud.fade = 0; }
    f.look(cx, lerp(2.3, 3.1, eio(seg(t, 101, 110))), lerp(9.0, 11.2, eio(seg(t, 101, 110))), cx + 0.3, 2.7, 0, 36);
  });
}
export const _u4 = [bt, ball, cloud, tag, spot, rose, openBook];
