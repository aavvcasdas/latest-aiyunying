import * as THREE from 'three';
import { Actor, C, FONT, TAU, at, backdrop, bt, disc, ei, eio, eo, grungeTex, hit, lerp, paper, pop, quad, radialTex, ringM, rnd, seg, shot, slam, sprite, txt } from './engine';
import { bar, crown, dragonShadow, gothicArch, heart, keyMesh, lips, openBook, padlock, prince, rose, shards, spindle, spot, star4, tag, towerSil } from './props';
import { confetti, popUp } from './shots1';

const BR = { rough: true, stroke: 'rgba(20,0,2,.55)', sw: 0.025 };

export function reg3() {
  /* ───── 高塔 ───── */
  shot('PC1a', 60.92, 62.2, s => {
    s.add(backdrop(grungeTex(), 70, 40, -9));
    at(towerSil(C.ink, 9), [0, -1.4, 0], s);
    at(gothicArch(1.1, 1.6, 0xffe9ee), [0, 5.5, 0.02], s);
    const cl = new Actor('claude', 1.25); cl.put(0, 5.5, 0.04).sil(1); s.add(cl);
    at(crown(0.26), [0.02, 6.68, 0.06], s);
    for (let i = 0; i < 26; i++) { const p = paper([[0, 0.8 + rnd(i) * 1.6], [0.5, 0], [-0.5, 0]], 0x0a0304); at(p, [-9 + i * 0.72, -1.5, 0.3], s); p.rotation.z = (rnd(i * 3) - 0.5) * 0.9; }
    const big = txt('高塔', 2.4, BR); at(big, [-4.3, 6.2, 0.6], s); big.rotation.z = 0.06;
    const birds = Array.from({ length: 7 }, () => { const b = paper([[-0.4, 0.14], [0, 0], [0.4, 0.14], [0, -0.07]], 0x0a0304); s.add(b); return b; });
    return { cl, big, birds };
  }, (o, f) => {
    const t = f.t, y = lerp(0.8, 5.6, eo(seg(t, 60.92, 62.0)));
    o.cl.act('sad', t, 6);
    slam(o.big, t, 60.98, 1, 0.16, 2.4);
    o.birds.forEach((b, i) => { b.position.set(3 + i * 0.7 + (t - 61) * 1.6, 6.5 + rnd(i) * 2 + Math.sin(t * 9 + i) * 0.1, -1); b.scale.y = Math.sin(t * 14 + i); });
    f.hud.flash = hit(t, bt(119), 0.2) * 0.5; f.hud.flashCol = '#ff2a4a'; f.hud.shake = hit(t, bt(119), 0.3) * 0.35;
    f.look(-0.8, y, 12.5 - seg(t, 60.92, 62.2) * 1.5, -0.6, y + 0.9, 0, 36);
  });
  /* ───── 是 棺椁 ───── */
  shot('PC1a2', 62.2, 63.02, s => {
    s.add(backdrop(grungeTex(0x7a060e, 0x140102, 4), 70, 40, -9));
    const tw = towerSil(C.ink, 6.2); tw.rotation.z = -Math.PI / 2; at(tw, [-4.4, 2.3, 0], s);
    at(quad(9.5, 0.5, 0x0a0304), [-0.4, 0.95, 0.01], s); at(quad(1.2, 2.2, 0x0a0304), [-3.4, -0.2, 0], s); at(quad(1.2, 2.2, 0x0a0304), [2.4, -0.2, 0], s);
    const cl = new Actor('claude', 2.5); cl.rotation.z = Math.PI / 2; cl.put(1.2, 1.35, 0.05).sil(0.2); cl.act('sad', 0.4, 1, false); s.add(cl);
    const cr = crown(0.5); cr.rotation.z = Math.PI / 2; at(cr, [-1.2, 2.5, 0.08], s);
    [[-4.4, 3.35, 1.85, 3.35], [-4.4, 1.25, 1.85, 1.25], [-4.4, 1.25, -4.4, 3.35], [1.85, 1.25, 1.85, 3.35]].forEach(p => at(bar(p[0], p[1], p[2], p[3], 0.035, 0xffffff), [0, 0, 0.1], s));
    const roses = Array.from({ length: 9 }, (_, i) => { const r = rose(0.3 + rnd(i) * 0.18, i % 3 ? C.blood : 0xffffff, i % 3 ? 0x6a0010 : 0xd9c8c8); at(r, [-4.6 + i * 0.85, 0.95 + rnd(i * 3) * 0.3, 0.2], s); return r; });
    const big = txt('棺椁', 2.1, BR); at(big, [3.4, 4.35, 0.6], s); big.rotation.z = -0.07;
    return { big, roses };
  }, (o, f) => {
    const t = f.t;
    slam(o.big, t, 62.2, 1, 0.16, 2.6);
    o.roses.forEach((r, i) => r.scale.setScalar(pop(t, 62.25 + i * 0.03)));
    f.hud.flash = hit(t, 62.2, 0.16) * 0.8; f.hud.shake = hit(t, 62.2, 0.3) * 0.4;
    f.look(0, 2.7, 11.6 - seg(t, 62.2, 63.02) * 0.5, 0, 2.7, 0, 35, 0.02);
  });

  /* ───── 纺锤 是 预设的 网 ───── */
  shot('PC1b', 63.02, 64.88, s => {
    s.add(backdrop(grungeTex(), 70, 40, -9));
    const sp = spindle(C.ink); sp.scale.setScalar(1.35); at(sp, [-6.0, -0.8, 0], s);
    const web = new THREE.Group(); at(web, [2.0, 2.9, -0.2], s);
    const N = 14;
    for (let i = 0; i < N; i++) { const a = (i / N) * TAU; web.add(bar(0, 0, Math.cos(a) * 6.5, Math.sin(a) * 6.5, 0.03, 0xffffff)); }
    for (let r = 1; r <= 6; r++) for (let i = 0; i < N; i++) {
      const a0 = (i / N) * TAU, a1 = ((i + 1) / N) * TAU, R = r * 0.95 + (r % 2) * 0.1;
      web.add(bar(Math.cos(a0) * R, Math.sin(a0) * R, Math.cos(a1) * R, Math.sin(a1) * R, 0.025, 0xffffff));
    }
    const thr = bar(-2.14, 3.1, 2.0, 2.9, 0.03, 0xffffff); s.add(thr);
    const cl = new Actor('claude', 2.5); cl.put(2.0, 1.6, 0).sil(1); s.add(cl);
    const cr = crown(0.5); at(cr, [2.05, 3.95, 0.05], s);
    const t1 = txt('纺锤', 1.8, BR); at(t1, [-3.4, 4.55, 0.5], s);
    const t2 = txt('网', 3.2, BR); at(t2, [4.3, 1.7, 0.8], s); t2.rotation.z = -0.1;
    return { sp, web, thr, cl, cr, t1, t2 };
  }, (o, f) => {
    const t = f.t, k = eo(seg(t, 63.72, 64.4));
    o.sp.userData.wheel.rotation.z = -t * 7;
    o.web.scale.setScalar(Math.max(0.001, k)); o.web.rotation.z = (1 - k) * 1.2 + Math.sin(t * 2) * 0.01;
    o.thr.visible = t > 63.5; o.thr.scale.x = eo(seg(t, 63.5, 63.8));
    o.cl.act('shake', t, 10); o.cl.visible = o.cr.visible = t > 64.3; o.cl.position.x = 2.0 + Math.sin(t * 40) * 0.03;
    slam(o.t1, t, 63.08, 1, 0.15, 2.4); slam(o.t2, t, 64.54, 1, 0.14, 2.8);
    f.hud.flash = hit(t, 64.54, 0.14) * 0.7; f.hud.shake = hit(t, 64.54, 0.3) * 0.4 + hit(t, 63.08, 0.2) * 0.2;
    f.look(0, 2.7, 12 - seg(t, 63.02, 64.88) * 0.8, 0, 2.7, 0, 35);
  });

  /* ───── 恶龙 是 借口 ───── */
  shot('PC2a', 64.88, 67.02, s => {
    s.add(backdrop(radialTex(0xff5a1e, 0x2a0104, 0.5, 0.5, 0.55), 70, 40, -9));
    const dr = dragonShadow(C.ink); at(dr, [0, -1.6, -2], s);
    const fl = Array.from({ length: 22 }, (_, i) => { const p = paper([[0, 1.4 + rnd(i) * 1.6], [0.6, 0], [-0.6, 0]], i % 3 ? 0xff8a1e : 0xffd23a); at(p, [-10 + i * 0.95, -1.7, -1 + (i % 2) * 0.4], s); return p; });
    at(quad(40, 2, 0x0a0304), [0, -1.9, 0.6], s);
    const big = txt('恶龙', 3.0, BR); at(big, [-5.0, 5.0, 0.5], s); big.rotation.z = 0.06;
    const g = new Actor('gpt', 2.6); g.put(0, -0.9, 1.2); s.add(g);
    const sp = spot(0.3, 3.6, 9, 0xffffff, 0.2); at(sp, [0, -0.9, 1.0], s);
    const tg = tag('借口'); at(tg, [0, 3.1, -1.8], s);
    const lamp = disc(0.5, 0xfff2c0); at(lamp, [0, -0.6, 0.9], s);
    return { dr, fl, big, g, sp, tg, lamp };
  }, (o, f) => {
    const t = f.t, B = t >= 66.32;
    const fp = Math.sin(t * 5.5) * 0.28;
    o.dr.userData.wl.rotation.z = -fp; o.dr.userData.wr.rotation.z = fp;
    o.dr.scale.setScalar((B ? 1.5 : 1.85) + f.bp * 0.05); o.dr.rotation.z = B ? 0 : Math.sin(t * 2) * 0.03;
    o.fl.forEach((p, i) => (p.scale.y = 0.7 + Math.abs(Math.sin(t * 8 + i * 1.7)) * 0.6));
    slam(o.big, t, 64.92, 1, 0.16, 2.6); o.big.visible = !B;
    o.g.visible = o.sp.visible = o.lamp.visible = B; o.g.act('tilt', t - 66.32, 7);
    slam(o.tg, t, 66.32, 1.5, 0.14, 3); o.tg.rotation.z = -0.15;
    f.hud.shake = hit(t, 64.92, 0.3) * 0.4 + hit(t, bt(127), 0.3) * 0.3 + hit(t, 66.32, 0.25) * 0.3; f.hud.flash = hit(t, 66.32, 0.14) * 0.7;
    if (!B) f.look(0, 0.6, 11.5 - seg(t, 64.88, 66.32) * 1.0, 0, 3.4, 0, 42);
    else f.look(0.3, 1.6, 9.2 - seg(t, 66.32, 67.02) * 0.5, 0, 2.0, 0, 36);
  });

  /* ───── 印证 王子 多 勇敢 ───── */
  shot('PC2b', 67.02, 69.15, s => {
    s.add(backdrop(grungeTex(), 70, 40, -9));
    [[3.4, 0.6, -0.6], [2.6, 0.6, 0], [1.8, 0.6, 0.6]].forEach(p => at(quad(p[0], p[1], 0xffffff), [1.6, p[2], 0], s));
    const pr = prince(); at(pr, [1.6, 0.9, 0.1], s);
    const sp1 = spot(0.3, 3.4, 10, 0xffffff, 0.16), sp2 = spot(0.3, 3.4, 10, 0xffffff, 0.16); at(sp1, [1.6, -0.9, 0.3], s); at(sp2, [1.6, -0.9, 0.3], s);
    const seal = new THREE.Group(); seal.add(ringM(0.95, 1.1, 0xffffff), at(txt('印证', 0.8, { font: FONT.serif, weight: '900' }), [0, 0, 0.01])); at(seal, [-4.9, 4.2, 0.5], s); seal.rotation.z = 0.2;
    const medals = [[1.2, 2.3], [1.6, 2.05], [2.0, 2.3]].map(p => { const m = star4(0.24, C.goldL); at(m, [p[0], p[1], 0.3], s); return m; });
    const ban = new THREE.Group(); ban.add(quad(5.4, 1.5, 0xffffff), at(txt('勇 敢', 1.25, { color: '#b30a14' }), [0, 0, 0.02])); at(ban, [1.6, 0.6, 0.8], s); ban.rotation.z = -0.04;
    const conf = confetti(34, [0xffffff, C.goldL], s, 12, 8, 1);
    const board = new THREE.Group(); const dr = dragonShadow(C.ink); dr.scale.setScalar(0.5); board.add(at(quad(4.6, 3.6, 0x3a0206), [0, 1.7, -0.02]), dr, at(disc(0.28, 0x0a0304), [-1.4, -0.25, 0.05]), at(disc(0.28, 0x0a0304), [1.4, -0.25, 0.05])); s.add(board);
    const g = new Actor('gpt', 2.3); s.add(g);
    return { pr, sp1, sp2, seal, medals, ban, conf, board, g };
  }, (o, f) => {
    const t = f.t;
    o.pr.rotation.z = Math.sin(t * 6.15) * 0.04; o.pr.position.y = 0.9 + f.bp * 0.08;
    o.sp1.rotation.z = 0.3 + Math.sin(t * 3) * 0.08; o.sp2.rotation.z = -0.3 - Math.sin(t * 3) * 0.08;
    slam(o.seal, t, 67.08, 1, 0.13, 3.2);
    [67.38, 67.62, 67.84].forEach((tt, i) => { o.medals[i].scale.setScalar(pop(t, tt) * (1 + f.bp * 0.2)); o.medals[i].visible = t > tt; o.medals[i].rotation.z = t; });
    o.ban.visible = t > 68.14; o.ban.scale.set(eo(seg(t, 68.14, 68.4)), 1 + hit(t, 68.14, 0.2) * 0.2, 1);
    o.conf(t, t > 68.14);
    const bx = lerp(-3.4, -7.5, eio(seg(t, 67.3, 69.1))); o.board.position.set(bx, -0.5, -0.5); o.board.rotation.z = 0.06;
    o.g.act('shake', t, 9).put(bx + 2.6, -0.9, 0.3);
    f.hud.shake = hit(t, 67.08, 0.2) * 0.3 + hit(t, 68.14, 0.3) * 0.35; f.hud.flash = hit(t, 68.14, 0.14) * 0.5;
    f.look(0, 2.5, 12 - seg(t, 67.02, 69.15) * 0.8, 0, 2.5, 0, 35, -0.015);
  });

  /* ───── 童话 造的 梦 何时 才能 想 明白 ───── */
  shot('PC3', 69.15, 72.6, s => {
    s.add(backdrop(radialTex(0x9a1040, 0x10020c, 0.5, 0.5, 0.6), 80, 46, -12));
    s.add(new THREE.HemisphereLight(0xffc0d8, 0x30101c, 2.4));
    const bk = openBook(4.6, 3.4, 0x5c0308); at(bk, [0, 0, 0], s);
    const pops = [[-3.2, 3.4], [-1.9, 2.3], [2.0, 2.6], [3.3, 3.8]].map((p, i) => { const g = new THREE.Group(); g.add(at(quad(0.9, p[1], 0x16050c), [0, p[1] / 2, 0]), paper([[-0.65, p[1]], [0, p[1] + 1.0], [0.65, p[1]]], 0x16050c)); at(g, [p[0], 0.1, -1.1 - (i % 2) * 0.3], s); return g; });
    const mob = new THREE.Group(); at(mob, [0, 6.6, 0], s);
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(3.3, 0.04, 5, 40), new THREE.MeshBasicMaterial({ color: 0xffffff })); hoop.rotation.x = Math.PI / 2; mob.add(hoop);
    const icons = [crown(0.7), heart(0xffffff, 0.6), (() => { const k = keyMesh(); k.scale.setScalar(0.3); k.position.y = 0.4; const g = new THREE.Group(); g.add(k); return g; })(), star4(0.5), (() => { const l = lips(0xffffff, 0.34); return l; })(), crown(0.7), heart(0xffffff, 0.6), star4(0.5)].map((ic, i) => {
      const g = new THREE.Group(), a = (i / 8) * TAU, L = 1.3 + (i % 3) * 0.5;
      g.add(at(quad(0.025, L, 0xffffff), [0, -L / 2, 0])); const h = new THREE.Group(); h.add(ic); h.position.y = -L - 0.4; g.add(h);
      g.position.set(Math.cos(a) * 3.3, 0, Math.sin(a) * 3.3); mob.add(g); return g;
    });
    const who = ['doubao', 'whale', 'claude'] as const;
    const acts = who.map((w, i) => { const a = new Actor(w, 2.2); a.put(-2.5 + i * 2.5, 0.1, 0.6).sil(1); s.add(a); return a; });
    const zs = acts.map(a => { const z = sprite('fx_zzz', 0.6); z.position.set(a.position.x + 0.7, 2.6, 0.7); s.add(z); return z; });
    const big = txt('梦', 4.6, { color: 'rgba(255,255,255,.42)' }); at(big, [0, 3.7, -2.6], s);
    const bulb = sprite('fx_exclaim', 0.9); at(bulb, [0.75, 2.75, 0.8], s);
    return { pops, mob, icons, acts, zs, big, bulb };
  }, (o, f) => {
    const t = f.t, wake = seg(t, 71.92, 72.2), fall = ei(seg(t, 72.18, 72.7));
    o.pops.forEach((g, i) => popUp(g, t, 69.2 + i * 0.1, 0.45));
    o.mob.position.y = lerp(10.5, 6.6, eo(seg(t, 70.06, 70.6))); o.mob.rotation.y = t * 0.9;
    o.icons.forEach((g, i) => { g.rotation.y = -t * 0.9; g.rotation.z = Math.sin(t * 2 + i) * 0.12; g.position.y = -fall * (5 + i); });
    o.acts.forEach((a, i) => { a.act(i === 1 && wake > 0 ? 'surprise' : i === 2 ? 'sad' : 'idle', i === 1 ? t - 71.92 : 0.3, 9, false); if (i === 1) a.sil(1 - wake); a.position.y = 0.1 + Math.sin(t * 1.6 + i) * 0.03; });
    o.zs.forEach((z, i) => { z.raw('fx_zzz', t + i * 0.3, 4); z.position.y = 2.6 + Math.sin(t * 2 + i) * 0.08; z.visible = !(i === 1 && wake > 0); });
    slam(o.big, t, 70.62, 1, 0.3, 1.5);
    o.bulb.scale.setScalar(pop(t, 72.18)); o.bulb.visible = t > 72.18;
    f.hud.flash = hit(t, 72.18, 0.2) * 0.75; f.hud.shake = hit(t, 72.18, 0.25) * 0.3;
    const push = eio(seg(t, 71.1, 72.2)), a = lerp(-0.32, 0.12, f.p), R = lerp(12.5, 6.8, push);
    f.look(Math.sin(a) * R, lerp(3.3, 1.9, push), Math.cos(a) * R, 0, lerp(2.6, 1.5, push), 0, 36);
  });

  /* ───── 吻 如果是 钥匙 为何 我 打 不 开 ───── */
  shot('PC4', 72.6, 76.7, s => {
    s.add(backdrop(grungeTex(0x6a050c, 0x120102, 5), 80, 46, -9));
    const lp = lips(0xff2d55, 1); at(lp, [-0.4, 3.0, 0], s);
    const key = keyMesh(0xffffff); s.add(key);
    const door = new THREE.Group(); at(door, [4.4, -0.9, 0], s);
    door.add(gothicArch(5.0, 7.2, 0x070203), at(gothicArch(4.3, 6.6, 0x3a0408), [0, 0.2, 0.01]));
    (['doubao', 'whale', 'claude'] as const).forEach((w, i) => { const a = new Actor(w, 2.5); a.put(-1.3 + i * 1.3, 0.5, 0.02 + i * 0.002).sil(1); door.add(a); });
    for (let i = -3; i <= 3; i++) door.add(at(quad(0.12, 6.6, 0x070203), [i * 0.62, 3.4, 0.05]));
    const lock = padlock(); lock.scale.setScalar(0.8); at(lock, [0, 3.2, 0.2], door);
    const kiss = txt('吻', 3.6, BR); at(kiss, [-5.0, 4.6, 0.5], s); kiss.rotation.z = 0.08;
    const cs = [...'打不开'].map((c, i) => { const m = txt(c, 2.1, BR); at(m, [-2.7 + i * 2.0, 4.4 - i * 0.3, 0.6], s); m.rotation.z = (rnd(i + 20) - 0.5) * 0.25; return m; });
    const sh = shards(14, [0xffffff, 0xffe9ee], 0.35); sh.forEach(m => s.add(m));
    return { lp, key, door, lock, kiss, cs, sh };
  }, (o, f) => {
    const t = f.t;
    const lk = t < 73.86 ? pop(t, 72.64, 0.3) * (1 + f.bp * 0.08 + hit(t, 73.12, 0.25) * 0.15) : 1 - eo(seg(t, 73.86, 74.0));
    o.lp.scale.set(2.3 * lk, 2.3 * lk * (1 - seg(t, 73.5, 73.86) * 0.35), 1); o.lp.visible = lk > 0.01 && t >= 72.64;
    slam(o.kiss, t, 72.64, 1, 0.16, 2.6); o.kiss.visible = t >= 72.64 && t < 74.2;
    const mv = eio(seg(t, 74.2, 74.8)), jab = hit(t, 75.02, 0.18) + hit(t, 75.28, 0.18) + hit(t, 75.52, 0.14), gone = Math.max(0, t - 75.62);
    o.key.visible = t > 73.86;
    o.key.scale.setScalar(pop(t, 73.86) * lerp(1.25, 0.82, mv));
    o.key.rotation.z = lerp((1 - eo(seg(t, 73.86, 74.2))) * 3, Math.PI / 2, mv) + gone * 16;
    o.key.position.set(lerp(-0.4, 1.55, mv) + jab * 0.5 - gone * 9, lerp(4.4, 2.15, mv) + gone * 5 - gone * gone * 6, 0.5);
    o.lock.rotation.z = Math.sin(t * 70) * 0.06 * Math.min(1, jab);
    o.cs.forEach((m, i) => slam(m, t, [75.02, 75.28, 75.52][i], 1, 0.13, 2.8));
    o.sh.forEach((m, i) => { const k = seg(t, 75.62, 76.3), a = rnd(i * 3) * TAU; m.visible = k > 0 && k < 1; m.position.set(3.3 + Math.cos(a) * k * 5, 2.2 + Math.sin(a) * k * 4 - k * k * 2, 0.6); m.rotation.z = k * 9 + i; });
    f.hud.shake = hit(t, 72.64, 0.3) * 0.3 + jab * 0.3 + hit(t, 75.62, 0.3) * 0.4;
    f.hud.flash = hit(t, 73.86, 0.14) * 0.6 + hit(t, 75.62, 0.12) * 0.6; f.hud.fade = seg(t, 76.1, 76.5);
    const pan = eio(seg(t, 74.2, 74.9));
    f.look(lerp(-0.6, 1.5, pan), 2.9, 11.6 - seg(t, 72.6, 76.7) * 0.9, lerp(-0.6, 1.5, pan), 2.9, 0, 35, Math.sin(t * 0.8) * 0.012);
  });
}
export const _u3 = [prince, rose];
