import * as THREE from 'three';
import {
  FONT, PI, TAU, basic, box, bt, cam, cone, cyl, disc, eio, eo, ei, hit, lerp, many, mesh,
  pop, put, rnd, seg, shot, slam, sprite3D, txt,
} from './engine';
import {
  PAL, archPortal3D, bar3D, confetti3D, crown3D, dragon3D, dragonProp3D, heart3D, key3D, lips3D, padlock3D, prince3D, rose3D,
  shards3D, spindle3D, spotCone, tag3D, tower3D,
} from './props';
import { book, castle, rock } from './sets3d';
import { popUp } from './shots1';

const BR = { rough: true, stroke: 'rgba(20,0,2,.6)', sw: 0.03 };

export function reg3() {
  /* ───── PC1a：高塔（3D 黑暗哥特高塔仰拍 + 小克窗前，Kimi 仰望） ───── */
  shot('PC1a', 60.92, 62.2, 'crimson', k => {
    k.add(disc(140, 0x160308));
    many(16, i => k.add(rock(1.0 + rnd(i) * 1.4, 0x1a0810, i), -10 + i * 1.35, 0.2, -3.5 - (i % 3) * 1.2));
    k.add(tower3D(9.0, 0x261a36, 0x140b20), 0, -0.5, 0);
    const cl = k.actor('claude', 0.8).wear('crown');
    const km = k.actor('kimi', 0.95).wear('tiara');
    const big = txt('高塔', 1.85, BR); k.add(big, -3.3, 5.2, 0.6); big.rotation.z = 0.06;
    const birds = many(7, () => k.add(cone(0.18, 0.55, 0x0b0a0c, 4, 0)));

    return ({ t, T, hud }) => {
      const y = lerp(1.0, 5.4, eo(seg(t, 60.92, 62.0)));
      cl.act('sad', T).at(0, 5.85, 1.35).noShadow().sil(0.7, 0x0b0a0c);
      km.act('lookaround', T).at(-2.3, 0, 1.4).emote('fx_gloom', T);
      slam(big, t, 60.98, 1, 0.16, 2.3);
      birds.forEach((b, i) => {
        b.position.set(2.4 + i * 0.65 + (t - 61) * 1.5, 6.2 + rnd(i) * 1.8 + Math.sin(T * 8 + i) * 0.12, -1);
        b.rotation.z = PI / 2 + Math.sin(T * 14 + i) * 0.5;
      });
      hud.flash = hit(t, bt(119), 0.2) * 0.45; hud.flashCol = '#ff2a4a'; hud.shake = hit(t, bt(119), 0.3) * 0.3;
      return cam([-0.6, y, 10.6 - seg(t, 60.92, 62.2) * 1.2], [-0.4, y + 0.8, 0], 36);
    };
  });

  /* ───── PC1a2：是 棺椁（《童话镇》L20 睡美人石台 + 玫瑰绽放 + 豆包/本鲸守望） ───── */
  shot('PC1a2', 62.2, 63.02, 'crimson', k => {
    k.add(disc(140, 0x1c0308));
    // 3D 石座 + 横卧的高塔（变成棺椁）
    k.add(box(1.1, 0.9, 1.4, 0x1a0c18), -2.4, 0, 0);
    k.add(box(1.1, 0.9, 1.4, 0x1a0c18), 2.4, 0, 0);
    const tw = tower3D(6.6, 0x261a36, 0x140b20); tw.rotation.z = -PI / 2; k.add(tw, -3.5, 1.65, 0);
    const cl = k.actor('claude', 1.15).wear('crown');
    const db = k.actor('doubao', 1.0).wear('hood');
    const wh = k.actor('whale', 1.0);
    const roses = many(12, i => k.add(rose3D(0.26 + rnd(i) * 0.14, i % 3 ? 0xe63946 : 0xffffff), -3.2 + i * 0.62, 1.15 + rnd(i * 3) * 0.25, 1.3));
    const big = txt('棺椁', 1.45, BR); k.add(big, 2.4, 3.3, 0.7); big.rotation.z = -0.06;

    return ({ t, T, bt, hud }) => {
      cl.set('claude_front_1').at(0.7, 2.55, 0.55).tilt(PI / 2).noShadow();
      db.act('surprise', T, 62.2).at(-3.8, 0, 1.3).emote('fx_exclaim', T);
      wh.act('sad', T, 62.2).at(3.7, 0, 1.3).flip();
      slam(big, t, 62.2, 1, 0.15, 2.5);
      roses.forEach((r, i) => r.scale.setScalar(Math.max(0.01, pop(t, 62.24 + i * 0.025) * (1 + bt.pulse * 0.1))));
      hud.flash = hit(t, 62.2, 0.15) * 0.75; hud.shake = hit(t, 62.2, 0.3) * 0.35;
      return cam([0, 2.3, 9.6 - seg(t, 62.2, 63.02) * 0.5], [0, 2.1, 0], 35, 0.02);
    };
  });

  /* ───── PC1b：纺锤 是 预设的 网（3D 纺车吐出立体蛛网，千问拉线、小克与猫被网困住） ───── */
  shot('PC1b', 63.02, 64.88, 'crimson', k => {
    k.add(disc(140, 0x1a0308));
    const sp = spindle3D(); sp.scale.setScalar(1.0); k.add(sp, -4.6, 0, -0.3);
    const web = k.add(new THREE.Group(), 1.6, 2.4, -0.2);
    const N = 14;
    for (let i = 0; i < N; i++) { const a = (i / N) * TAU; web.add(bar3D(0, 0, Math.cos(a) * 5.2, Math.sin(a) * 5.2, 0.04, 0xffffff, true)); }
    for (let r = 1; r <= 5; r++) {
      web.add(new THREE.Mesh(new THREE.TorusGeometry(r * 0.88, 0.025, 5, 22), basic(0xffffff)));
    }
    const thr = bar3D(-2.2, 2.8, 1.6, 2.4, 0.04, 0xffffff, true); k.add(thr, 0, 0, 0.1);
    const qw = k.actor('qwen', 1.05).wear('tophat');
    const cl = k.actor('claude', 1.15).wear('crown');
    const gem = k.actor('gemini', 1.05).wear('bow');
    const t1 = txt('纺锤', 1.25, BR); k.add(t1, -2.6, 3.35, 0.5);
    const t2 = txt('网', 2.0, BR); k.add(t2, 3.35, 1.45, 0.8); t2.rotation.z = -0.09;

    return ({ t, T, hud }) => {
      const kk = eo(seg(t, 63.72, 64.4));
      sp.userData.wheel.rotation.z = -T * 7;
      qw.act('sway', T).at(-3.1, 0, 0.5);
      web.scale.setScalar(Math.max(0.001, kk)); web.rotation.z = (1 - kk) * 1.2 + Math.sin(T * 2) * 0.01;
      thr.visible = t > 63.5; thr.scale.x = eo(seg(t, 63.5, 63.8));
      cl.act('shake', T).at(1.6 + Math.sin(T * 40) * 0.025, 1.45, 0.1).noShadow().sil(0.85, 0x0b0a0c).alpha(t > 64.25 ? 1 : 0);
      gem.act('surprise', T, 64.3).at(2.6, 0.9, 0.2).noShadow().sil(0.85, 0x0b0a0c).alpha(t > 64.35 ? 1 : 0);
      slam(t1, t, 63.08, 1, 0.15, 2.3); slam(t2, t, 64.54, 1, 0.14, 2.7);
      hud.flash = hit(t, 64.54, 0.14) * 0.7; hud.shake = hit(t, 64.54, 0.3) * 0.35 + hit(t, 63.08, 0.2) * 0.18;
      return cam([0, 2.2, 10.2 - seg(t, 63.02, 64.88) * 0.7], [0, 2.2, 0], 36);
    };
  });

  /* ───── PC2a：恶龙 是 借口（3D 巨龙展翼 -> 镜头切落，龙娘挂“借口”牌、本鲸戳穿） ───── */
  shot('PC2a', 64.88, 67.02, 'savanna', k => {
    k.add(disc(160, 0x260808));
    many(18, i => k.add(cone(0.6 + rnd(i) * 0.4, 1.6 + rnd(i * 3) * 1.8, i % 2 ? 0xff7a1e : 0xffb830, 5), -11 + i * 1.3, 0, -2.5 - (i % 2) * 1.2));
    const dr = dragon3D(0x160a1c, 0x2e1438); dr.scale.setScalar(1.35); k.add(dr, 0, -0.5, -2.5);
    const big = txt('恶龙', 2.2, BR); k.add(big, -3.7, 4.1, 0.5); big.rotation.z = 0.06;
    const gp = k.actor('gpt', 1.25);
    const wh = k.actor('whale', 1.1);
    const sp = k.add(spotCone(0.25, 2.6, 8, 0xfff0d0, 0.2), 0, 0, 1.0);
    const tg = tag3D('借口'); k.add(tg, 0, 3.0, -1.2);

    return ({ t, T, bt: btInfo, hud }) => {
      const B = t >= 66.32;
      const fp = Math.sin(T * 5.5) * 0.28;
      dr.userData.wl.rotation.z = -fp; dr.userData.wr.rotation.z = fp;
      dr.scale.setScalar((B ? 1.15 : 1.4) + btInfo.pulse * 0.04);
      slam(big, t, 64.92, 1, 0.16, 2.5); big.visible = !B;
      sp.visible = B;
      if (B) {
        gp.act('tilt', T, 66.32).at(0.55, 0.0, 1.2).emote('fx_question', T);
        wh.act('point', T).at(-1.25, 0.0, 1.3);
      } else { gp.hide(); wh.hide(); }
      slam(tg, t, 66.32, 1.35, 0.14, 2.8); tg.rotation.z = -0.12;
      hud.shake = hit(t, 64.92, 0.3) * 0.35 + hit(t, bt(127), 0.3) * 0.25 + hit(t, 66.32, 0.25) * 0.25;
      hud.flash = hit(t, 66.32, 0.14) * 0.65;
      if (!B) return cam([0, 1.1, 10.5 - seg(t, 64.88, 66.32) * 0.8], [0, 3.2, -1], 40);
      return cam([0.2, 1.4, 7.6 - seg(t, 66.32, 67.02) * 0.5], [0, 1.65, 0.8], 35);
    };
  });

  /* ───── PC2b：印证 王子 多 勇敢（龙娘把带轮子的假恶龙推走，智谱与千问冷眼看王子领奖） ───── */
  shot('PC2b', 67.02, 69.15, 'crimson', k => {
    k.add(disc(140, 0x220408));
    k.add(castle(), 2, 0, -28, -0.2);
    // 3D 白色台阶领奖台
    k.add(box(3.2, 0.5, 1.8, 0xffffff), 1.5, 0, 0);
    k.add(box(2.4, 0.5, 1.4, 0xfff0f6), 1.5, 0.5, 0);
    k.add(box(1.6, 0.5, 1.0, 0xffffff), 1.5, 1.0, 0);
    const pr = prince3D(); k.add(pr, 1.5, 1.5, 0);
    const sp1 = k.add(spotCone(0.2, 2.4, 9, 0xffffff, 0.16), 1.5, 0, 0.2);
    const sp2 = k.add(spotCone(0.2, 2.4, 9, 0xffffff, 0.16), 1.5, 0, 0.2);

    const seal = k.add(new THREE.Group(), -3.9, 3.5, 0.5);
    put(seal, mesh(new THREE.TorusGeometry(0.85, 0.08, 6, 24), basic(0xffffff), 0), 0, 0, 0);
    seal.add(txt('印证', 0.68, { font: FONT.serif, weight: '900', depth: false })); seal.rotation.z = 0.2;
    const medals = [[-0.45, 2.6], [0, 2.35], [0.45, 2.6]].map(p => k.add(sprite3D('star', 0.55, 0xffe484, true), 1.5 + p[0], p[1], 0.4));
    const ban = k.add(new THREE.Group(), 1.5, 0.95, 0.95);
    put(ban, box(4.6, 1.15, 0.12, 0xffffff), 0, -0.57, -0.05);
    const banTxt = txt('勇 敢', 0.88, { color: '#b30a14', depth: false }); banTxt.position.z = 0.08; ban.add(banTxt);
    ban.rotation.z = -0.04;
    const conf = confetti3D(34, [0xffffff, PAL.goldL], k.root, 12, 8, 0.8);

    // 龙娘推走带轮木板恶龙 + 智谱千问在旁鼓掌记账
    const propDr = dragonProp3D(); propDr.scale.setScalar(0.8); k.add(propDr);
    const gp = k.actor('gpt', 1.15);
    const zai = k.actor('zai', 0.95);
    const qw = k.actor('qwen', 0.95).wear('tophat');

    return ({ t, T, bt, hud }) => {
      pr.rotation.z = Math.sin(T * 6) * 0.04; pr.position.y = 1.5 + bt.pulse * 0.07;
      sp1.rotation.z = 0.3 + Math.sin(T * 3) * 0.08; sp2.rotation.z = -0.3 - Math.sin(T * 3) * 0.08;
      slam(seal, t, 67.08, 1, 0.13, 3.0);
      [67.38, 67.62, 67.84].forEach((tt, i) => {
        medals[i].scale.setScalar(Math.max(0.01, pop(t, tt) * (0.55 + bt.pulse * 0.18)));
        medals[i].visible = t > tt;
      });
      ban.visible = t > 68.14;
      ban.scale.set(eo(seg(t, 68.14, 68.4)), 1 + hit(t, 68.14, 0.2) * 0.2, 1);
      conf(T, t > 68.14);

      const bx = lerp(-2.6, -6.8, eio(seg(t, 67.3, 69.1)));
      propDr.position.set(bx, 0, -0.4);
      gp.act('shake', T).at(bx + 2.2, 0, 0.3);
      zai.act('nod', T).at(3.9, 0, 0.7).flip();
      qw.act('bow', T).at(4.8, 0, 0.5).flip();

      hud.shake = hit(t, 67.08, 0.2) * 0.28 + hit(t, 68.14, 0.3) * 0.3; hud.flash = hit(t, 68.14, 0.14) * 0.5;
      return cam([0, 2.0, 10.6 - seg(t, 67.02, 69.15) * 0.7], [0.2, 2.0, 0], 36, -0.015);
    };
  });

  /* ───── PC3：童话造的梦 何时才能想明白（《童话镇》立体书 + 旋转童话风铃 + 本鲸唤醒众人） ───── */
  shot('PC3', 69.15, 72.6, 'magic', k => {
    k.add(disc(140, 0x220c38));
    const bk = book(); bk.g.scale.setScalar(1.3); k.add(bk.g, 0, 0, 0);
    bk.cover.rotation.z = 3.0; (bk.glow.material as THREE.MeshBasicMaterial).opacity = 0.75;
    const pops = [[-2.7, 2.8], [-1.5, 1.9], [1.7, 2.2], [2.8, 3.1]].map((p, i) => {
      const g = new THREE.Group(); k.add(g, p[0], 1.05, -1.2 - (i % 2) * 0.4);
      put(g, box(0.8, p[1], 0.8, 0x1e0e2c), 0, 0, 0);
      put(g, cone(0.75, 1.1, 0x3a184a, 4), 0, p[1], 0);
      return g;
    });

    // 悬吊旋转的童话符号风铃（王冠 / 爱心 / 钥匙 / 红唇 / 星辰）
    const mob = k.add(new THREE.Group(), 0, 5.4, 0);
    const hoop = mesh(new THREE.TorusGeometry(2.8, 0.05, 6, 36).rotateX(PI / 2), basic(0xffffff), 0); mob.add(hoop);
    const icons = [crown3D(0.55), heart3D(0xffffff, 0.5), (() => { const kk = key3D(0xffffff); kk.scale.setScalar(0.28); kk.position.y = 0.35; const g = new THREE.Group(); g.add(kk); return g; })(),
      lips3D(0xff5c8a, 0.32), crown3D(0.55), heart3D(0xffffff, 0.5), sprite3D('star', 0.9, 0xfff2a8, true), sprite3D('star', 0.9, 0xffffff, true)].map((ic, i) => {
      const g = new THREE.Group(), a = (i / 8) * TAU, L = 1.1 + (i % 3) * 0.35;
      put(g, cyl(0.015, 0.015, L, 0xffffff, 4, 0), 0, -L, 0);
      const h = new THREE.Group(); h.add(ic); h.position.y = -L - 0.35; g.add(h);
      g.position.set(Math.cos(a) * 2.8, 0, Math.sin(a) * 2.8); mob.add(g); return g;
    });

    const db = k.actor('doubao', 0.95).wear('hood');
    const wh = k.actor('whale', 1.0);
    const cl = k.actor('claude', 0.95).wear('crown');
    const km = k.actor('kimi', 0.9).wear('tiara');
    const big = txt('梦', 2.7, { color: 'rgba(255,255,255,.45)', depth: false }); k.add(big, 0, 2.7, -2.5);

    return ({ t, T, hud }) => {
      const wake = seg(t, 71.92, 72.2), fall = ei(seg(t, 72.18, 72.7));
      pops.forEach((g, i) => popUp(g, t, 69.2 + i * 0.1, 0.45));
      mob.position.y = lerp(9.2, 5.4, eo(seg(t, 70.06, 70.6))); mob.rotation.y = T * 0.9;
      icons.forEach((g, i) => { g.rotation.y = -T * 0.9; g.rotation.z = Math.sin(T * 2 + i) * 0.1; g.position.y = -fall * (4.5 + i); });

      db.act(wake > 0.6 ? 'surprise' : 'idle', T, 72.0).at(-1.8, 1.05, 0.6).sil(0.8 * (1 - wake)).emote(wake < 0.6 ? 'fx_zzz' : 'fx_exclaim', T);
      wh.act(wake > 0 ? 'surprise' : 'idle', T, 71.92).at(0, 1.05, 0.7).sil(0.8 * (1 - wake)).emote(wake > 0 ? 'fx_bulb' : 'fx_zzz', T);
      cl.act(wake > 0.7 ? 'hop' : 'sad', T, 72.05).at(1.8, 1.05, 0.6).sil(0.8 * (1 - wake)).emote(wake < 0.7 ? 'fx_zzz' : null, T);
      km.act('think', T).at(-3.4, 0, 1.8);

      slam(big, t, 70.62, 1, 0.3, 1.5);
      hud.flash = hit(t, 72.18, 0.2) * 0.7; hud.shake = hit(t, 72.18, 0.25) * 0.28;
      const push = eio(seg(t, 71.1, 72.2)), a = lerp(-0.3, 0.12, seg(t, 69.15, 72.6)), R = lerp(10.8, 6.2, push);
      return cam([Math.sin(a) * R, lerp(3.2, 2.0, push), Math.cos(a) * R], [0, lerp(2.2, 1.7, push), 0], 36);
    };
  });

  /* ───── PC4：吻 如果是 钥匙 为何 我 打 不 开（3D 城堡铁栅栏门 + 立体金锁 + 钥匙碎裂） ───── */
  shot('PC4', 72.6, 76.7, 'crimson', k => {
    k.add(disc(140, 0x1c0308));
    const lp = k.add(lips3D(0xff2d55, 1.0), -0.6, 2.2, 0);
    const key = k.add(key3D(0xffffff), 0, 2.2, 0.5);

    const door = k.add(new THREE.Group(), 3.6, 0, 0);
    door.add(archPortal3D(4.6, 6.4, 0x1a0810, 0x3a060e));
    for (let i = -3; i <= 3; i++) put(door, cyl(0.08, 0.08, 6.0, 0x18141e, 8), i * 0.56, 0.2, 0.1);
    const lock = padlock3D(PAL.gold, PAL.goldD); lock.scale.setScalar(0.72); door.add(lock); lock.position.set(-0.4, 2.8, 0.35);

    const db = k.actor('doubao', 1.05).wear('hood');
    const cl = k.actor('claude', 1.05).wear('crown');
    const wh = k.actor('whale', 1.1);

    const kiss = txt('吻', 2.6, BR); k.add(kiss, -4.0, 3.6, 0.5); kiss.rotation.z = 0.08;
    const cs = [...'打不开'].map((c, i) => {
      const m = txt(c, 1.85, BR); k.add(m, -2.5 + i * 1.8, 3.7 - i * 0.25, 0.7); m.rotation.z = (rnd(i + 20) - 0.5) * 0.22; return m;
    });
    const sh = shards3D(14, [0xffffff, 0xffe9ee], 0.28); sh.forEach(m => k.add(m));

    return ({ t, T, bt, hud }) => {
      const lk = t < 73.86 ? pop(t, 72.64, 0.28) * (1 + bt.pulse * 0.08 + hit(t, 73.12, 0.25) * 0.14) : 1 - eo(seg(t, 73.86, 74.0));
      lp.scale.set(1.7 * lk, 1.7 * lk * (1 - seg(t, 73.5, 73.86) * 0.32), 1.4 * lk); lp.visible = lk > 0.01 && t >= 72.64;
      slam(kiss, t, 72.64, 1, 0.16, 2.5); kiss.visible = t >= 72.64 && t < 74.2;

      const mv = eio(seg(t, 74.2, 74.8));
      const jab = hit(t, 75.02, 0.18) + hit(t, 75.28, 0.18) + hit(t, 75.52, 0.14);
      const gone = Math.max(0, t - 75.62);
      key.visible = t > 73.86;
      key.scale.setScalar(Math.max(0.01, pop(t, 73.86) * lerp(1.0, 0.72, mv)));
      key.rotation.z = lerp((1 - eo(seg(t, 73.86, 74.2))) * 3, PI / 2, mv) + gone * 15;
      key.position.set(lerp(-0.5, 0.9, mv) + jab * 0.45 - gone * 8, lerp(3.4, 2.05, mv) + gone * 4.5 - gone * gone * 5.5, 0.6);

      lock.rotation.z = Math.sin(T * 70) * 0.07 * Math.min(1, jab);
      db.act('sway', T).at(2.8, 0.3, -0.35).sil(0.65);
      cl.act('shake', T + 0.2).at(4.1, 0.3, -0.35).sil(0.65);
      wh.act('point', T).at(-0.6, 0.0, 0.8).alpha(seg(t, 74.1, 74.4));

      cs.forEach((m, i) => slam(m, t, [75.02, 75.28, 75.52][i], 1, 0.13, 2.6));
      sh.forEach((m, i) => {
        const kk = seg(t, 75.62, 76.3), a = rnd(i * 3) * TAU;
        m.visible = kk > 0 && kk < 1;
        m.position.set(2.8 + Math.cos(a) * kk * 4.5, 2.0 + Math.sin(a) * kk * 3.5 - kk * kk * 2, 0.8);
        m.rotation.set(kk * 8 + i, kk * 6, i);
      });
      hud.shake = hit(t, 72.64, 0.25) * 0.25 + jab * 0.25 + hit(t, 75.62, 0.3) * 0.35;
      hud.flash = hit(t, 73.86, 0.14) * 0.55 + hit(t, 75.62, 0.12) * 0.55; hud.fade = seg(t, 76.1, 76.5);
      const pan = eio(seg(t, 74.2, 74.9));
      return cam([lerp(-0.5, 1.3, pan), 2.1, 9.8 - seg(t, 72.6, 76.7) * 0.7], [lerp(-0.5, 1.3, pan), 2.1, 0], 36, Math.sin(T * 0.8) * 0.01);
    };
  });
}
export const _u3 = [bt];
