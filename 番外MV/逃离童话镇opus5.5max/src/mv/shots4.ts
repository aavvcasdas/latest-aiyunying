import * as THREE from 'three';
import {
  FONT, Kit, PI, TAU, back, ball, basic, box, bt, cam, cone, cyl, disc, eio, eo, ei, hit, lerp, many, mesh,
  pop, put, rnd, seg, setOp, shot, slam, sprite3D, txt,
} from './engine';
import {
  PAL, bar3D, bottle3D, bubble3D, burst3D, crown3D, heart3D, hunter3D, key3D, lips3D, padlock3D, prince3D, quill3D, rifle3D, rose3D,
  shards3D, spotCone, tag3D, tower3D, wing3D, wolf3D,
} from './props';
import {
  Fireworks, book, bridge, buildTown, castle, clock, cloud, house, lantern, mushroom, pine, useTown,
} from './sets3d';
import { beatSq } from './shots1';
import { FW_OUT, K } from './cues';

const BR = { rough: true, stroke: 'rgba(20,0,2,.6)', sw: 0.03 };

function damn3D(id: string, a: number, b: number, ts: number[], inv: boolean, extra: (k: Kit) => (t: number, T: number) => void) {
  shot(id, a, b, 'magenta', k => {
    k.add(disc(120, inv ? 0x0c0410 : 0x3a062a));
    const cs = [...'去他的'].map((c, i) => {
      const m = txt(c, 2.3, { font: FONT.hei, color: inv ? '#f0128a' : '#0b0a0c', stroke: inv ? '#fff' : '#ff7cc4', sw: 0.03, px: 220 });
      k.add(m, -2.7 + i * 2.7, 2.0 + (i === 1 ? 0.2 : -0.15), -0.6); m.rotation.z = (i - 1) * -0.07; return m;
    });
    const l = bar3D(-12, 0, 12, 0, 0.04, 0xffffff, true); k.add(l, 0, 2.0, 0.2);
    const fn = extra(k);
    return ({ t, T, hud }) => {
      cs.forEach((m, i) => slam(m, t, ts[i], 1, 0.11, 2.9));
      l.rotation.z = (inv ? 0.5 : -0.5) + T * 0.5;
      fn(t, T);
      hud.bars = 1.45; hud.shake = ts.reduce((s2, x) => s2 + hit(t, x, 0.18) * 0.42, 0);
      return cam([0, 1.8, 9.6], [0, 1.8, 0], 36, inv ? -0.04 : 0.04);
    };
  });
}

export function reg4() {
  /* ───── C1a：去他的（踢飞碎锁与钥匙） ───── */
  damn3D('C1a', 76.7, 77.5, [76.76, 77.24, 77.42], false, k => {
    const wh = k.actor('whale', 1.25);
    const cl = k.actor('claude', 1.1).wear('crown');
    const ky = k.add(key3D(0xffffff)); ky.scale.setScalar(0.65);
    const lk = k.add(padlock3D()); lk.scale.setScalar(0.5);
    return (t, T) => {
      wh.act('shake', T).at(-0.7, 0.0, 0.7).lift(hit(t, 76.76, 0.3) * 0.35);
      cl.act('hop', T).at(-2.0, 0.0, 0.3);
      ky.position.set(1.2 + (t - 76.76) * 8, 1.4 + (t - 76.76) * 5, 0.7); ky.rotation.z = T * 18;
      lk.position.set(1.0 + (t - 76.76) * 6, 0.8 + (t - 76.76) * 4, 0.5); lk.rotation.set(T * 12, T * 9, 0);
    };
  });

  /* ───── C1b：乖巧 只会 饲养 恶狼（3D 森林小屋 + 豆包甩飞“乖巧”牌 + 本鲸护住豆包） ───── */
  shot('C1b', 77.5, 79.48, 'magenta', k => {
    k.add(disc(140, 0x1e0618));
    k.add(house(2.8, 2.0, 2.2, 0xf6e6c4, 0xb5473c, true), -4.5, 0, -4.5, 0.4);
    many(10, i => k.add(pine(4.5 + rnd(i) * 2, 0x240c24), -12 + i * 2.5, 0, -5.5 - rnd(i) * 3));
    const wf = k.add(wolf3D(0x0b0a0c, 0xff2d4a), 2.8, 0, -0.3);
    const db = k.actor('doubao', 1.2).wear('hood');
    const wh = k.actor('whale', 1.1);
    const t1 = k.add(tag3D('乖巧')), t2 = k.add(tag3D('和善'));
    const g1 = txt('乖巧', 1.02, { font: FONT.hei, color: '#fff' }); k.add(g1, -2.75, 2.65, 0.4); g1.rotation.z = 0.05;
    const strike = bar3D(-1.25, -0.16, 1.25, 0.2, 0.13, 0x0b0a0c, true); k.add(strike, -2.75, 2.65, 0.5);
    const g2 = txt('只会', 0.68, { font: FONT.hei, color: '#fff', sp: 0.2 }); k.add(g2, -0.75, 2.78, 0.4);
    const g3 = txt('饲养', 0.92, { font: FONT.hei, color: '#fff', sp: 0.1 }); k.add(g3, 0.85, 2.65, 0.4);
    const g4 = txt('恶狼', 1.48, { ...BR, px: 200 }); k.add(g4, 2.25, 1.35, 2.4); g4.rotation.z = -0.06;
    const cakes = many(4, i => k.add(ball(0.16, i % 2 ? 0xffd166 : 0xffffff, true, 0.02)));

    return ({ t, T, hud }) => {
      const sc = 0.95 + 0.35 * back(seg(t, 78.12, 78.34)) + 0.45 * back(seg(t, 78.58, 78.8)) + 0.65 * back(seg(t, 79.14, 79.36));
      wf.scale.setScalar(sc); wf.position.set(2.8, 0, -0.2);
      wf.userData.jaw.rotation.z = -0.25 - hit(t, 79.14, 0.4) * 0.45 - Math.sin(T * 10) * 0.1;
      db.act(t < 78.58 ? 'sway' : 'surprise', T, 78.58).at(-2.9, 0, 0.6);
      wh.act('point', T).at(-1.55, 0, 0.9);
      [t1, t2].forEach((tg, i) => {
        const kk = Math.max(0, t - 77.52); tg.scale.setScalar(0.7);
        tg.position.set(-2.9 + i * 1.2 + kk * (i ? 4.5 : -3.5), 1.6 + kk * 6.5 - kk * kk * 4, 0.9);
        tg.rotation.z = kk * (i ? -9 : 9);
      });
      slam(g1, t, 77.52, 1, 0.12, 2.5); slam(strike, t, 77.78, 1, 0.1, 1.6);
      slam(g2, t, 78.12, 1, 0.12, 2.2); slam(g3, t, 78.58, 1, 0.12, 2.4); slam(g4, t, 79.14, 1, 0.13, 2.9);
      cakes.forEach((c, i) => {
        const kk = seg(t, 78.58 + i * 0.1, 78.95 + i * 0.1); c.visible = kk > 0 && kk < 1;
        c.position.set(lerp(-2.2, 1.9, kk), 1.0 + Math.sin(kk * PI) * 1.5, 0.4);
      });
      hud.bars = 1.45; hud.shake = (hit(t, 77.52, 0.2) + hit(t, 78.12, 0.18) + hit(t, 78.58, 0.18)) * 0.26 + hit(t, 79.14, 0.3) * 0.5;
      hud.flash = hit(t, 79.14, 0.12) * 0.45;
      return cam([0, 1.8, 10.9], [0, 1.8, 0], 36, 0.02);
    };
  });

  /* ───── C1c：我要 驯服 龙的 翅膀（俯瞰童话镇城堡上空，本鲸骑龙娘 + 智谱伴飞） ───── */
  shot('C1c', 79.48, 80.8, 'golden', k => {
    k.add(disc(260, 0x7fcf66, -16));
    k.add(castle(), 8, -16, -24, 0.2, 1.2);
    const cl = many(12, i => k.add(cloud(i * 5, 0.75 + rnd(i) * 0.75)));
    const G = k.add(new THREE.Group());
    const wb = wing3D(0xe6dcff); wb.position.set(-0.3, 1.2, -0.35); G.add(wb);
    const wa = wing3D(0xffffff); wa.position.set(-0.3, 1.2, -0.2); G.add(wa);
    const gp = k.actor('gpt', 1.3);
    const wh = k.actor('whale', 0.95);
    const zai = k.actor('zai', 0.95);
    const rein = bar3D(-0.4, 2.1, 0.7, 1.7, 0.04, 0xffe484, true); k.add(rein);
    const t1 = txt('驯服', 1.45, BR); k.add(t1, -2.5, 2.95, 1.2); t1.rotation.z = 0.07;
    const t2 = txt('翅膀', 1.4, BR); k.add(t2, 2.6, 0.85, 1.2); t2.rotation.z = -0.06;

    return ({ t, u, T, hud }) => {
      const spread = 1 + back(seg(t, 80.46, 80.7)) * 0.5, fl = Math.sin(T * 11) * 0.28;
      cl.forEach((c, i) => c.position.set(16 - ((T * (7 + rnd(i) * 6) + rnd(i * 3) * 32) % 32), -3 + rnd(i * 5) * 6.5, -10 - rnd(i * 7) * 8));
      const gx = lerp(-1.1, 0.3, u), gy = 0.3 + Math.sin(T * 5) * 0.15 + u * 0.5;
      G.position.set(gx, gy, 0); G.rotation.z = 0.14;
      wa.rotation.z = 1.9 + fl; wb.rotation.z = 1.2 + fl * 0.8; wa.scale.setScalar(spread * 0.65); wb.scale.setScalar(spread * 0.62);
      gp.set('gpt_fly_0').at(gx, gy, 0.05).noShadow();
      wh.act('hop', T).at(gx - 0.55, gy + 1.15, 0.15).noShadow().emote('fx_sparkle', T);
      zai.set('zai_side_0').at(gx + 2.5, gy - 0.3 + Math.sin(T * 4) * 0.2, -1.6).tilt(-0.4).noShadow();
      rein.position.set(gx, gy, 0.18);
      slam(t1, t, 79.76, 1, 0.12, 2.5); slam(t2, t, 80.46, 1, 0.12, 2.5);
      hud.shake = hit(t, 79.76, 0.2) * 0.28 + hit(t, 80.46, 0.25) * 0.4; hud.flash = hit(t, 80.46, 0.14) * 0.55;
      return cam([0.4, 1.8, 9.2], [0, 2.0, 0], 36, -0.06);
    };
  });

  /* ───── C2a：去他的（豆包与 Gemini 联手打翻假狼道具） ───── */
  damn3D('C2a', 80.8, 81.6, [80.84, 81.32, 81.48], true, k => {
    const db = k.actor('doubao', 1.2).wear('hood');
    const gem = k.actor('gemini', 1.1).wear('bow');
    const wf = k.add(wolf3D(0x5e0838, 0xff7cc4)); wf.scale.setScalar(0.85);
    return (t, T) => {
      db.act('hop', T).at(-1.4, 0, 0.6);
      gem.act('hop', T + 0.15).at(-2.7, 0, 0.3);
      const kk = eo(seg(t, 81.32, 81.58));
      wf.position.set(1.8 + kk * 1.4, 0, 0.3); wf.rotation.z = -kk * 1.35;
    };
  });

  /* ───── C2b：沉默 只能 交换 假象（千问魔药工坊：砸碎玻璃瓶夺回声音、音浪震碎假王子镜） ───── */
  shot('C2b', 81.6, 83.46, 'magic', k => {
    k.add(disc(140, 0x261248));
    many(6, i => k.add(mushroom(1.0 + rnd(i) * 1.5, [0x4fd0ff, 0xff7ad9, 0x8dffb0][i % 3], true), -7 + i * 2.8, 0, -5));
    const cups = many(4, i => k.add(cyl(0.26, 0.18, 0.26, 0xffffff, 10), -3 + i * 2.2, 3.2 + rnd(i), -2.4));

    const mir = k.add(new THREE.Group(), 1.1, 2.1, -1.2); mir.rotation.z = 0.04;
    put(mir, box(2.6, 3.4, 0.14, 0xffffff), 0, -1.7, -0.05);
    put(mir, box(2.3, 3.1, 0.16, 0xff9ad0, 0.02), 0, -1.55, 0);
    const pm = prince3D(); pm.scale.setScalar(0.55); pm.position.set(0, -1.35, 0.14); mir.add(pm);

    const bot = k.add(bottle3D(), 3.6, 0, 0.3); bot.scale.setScalar(1.4);
    const orb = k.add(new THREE.Group());
    put(orb, ball(0.24, 0xfff6c0, false, 0), 0, 0, 0);
    put(orb, sprite3D('star', 1.3, 0xffe27a, true), 0, 0, 0);

    const wh = k.actor('whale', 1.25);
    const qw = k.actor('qwen', 1.05).wear('tophat');
    const s1 = shards3D(12, [0xbfe8ff, 0xffffff], 0.26); s1.forEach(m => k.add(m));
    const s2 = shards3D(16, [0xffffff, 0xff9ad0, 0xd8b46a], 0.42); s2.forEach(m => k.add(m));
    const arcs = many(3, () => k.add(mesh(new THREE.TorusGeometry(1, 0.04, 6, 32), basic(0xffffff), 0)));
    const g1 = txt('沉默', 1.5, BR); k.add(g1, -3.2, 3.4, 0.6);
    const stk = bar3D(-1.6, -0.15, 1.6, 0.2, 0.14, 0xffffff, true); k.add(stk, -3.2, 3.4, 0.7);
    const g2 = txt('交换', 1.1, { font: FONT.hei, sp: 0.15 }); k.add(g2, 1.2, 3.6, 0.6);
    const g3 = txt('假象', 2.0, BR); k.add(g3, 2.0, 1.5, 1.2); g3.rotation.z = -0.07;

    return ({ t, u, T, bt, hud }) => {
      const fly = eio(seg(t, 82.64, 83.1));
      cups.forEach((c, i) => { c.rotation.z = PI + Math.sin(T * 1.5 + i) * 0.2; });
      bot.visible = t < 82.64; bot.rotation.z = Math.sin(T * 40) * 0.05 * seg(t, 82.1, 82.64);
      orb.position.set(lerp(3.6, -2.5, fly), lerp(0.9, 1.3, fly) + Math.sin(fly * PI) * 1.8, 0.6);
      orb.scale.setScalar(0.85 + bt.pulse * 0.25);
      wh.act(t < 82.64 ? 'shake' : t < 83.1 ? 'surprise' : 'wave', T, 82.64).at(-2.8, 0, 0.5);
      qw.act(t < 82.64 ? 'sway' : 'shake', T, 82.64).at(3.9, 0, 0.2).flip();

      s1.forEach((m, i) => {
        const kk = seg(t, 82.64, 83.3), a = rnd(i * 3) * TAU;
        m.visible = kk > 0 && kk < 1;
        m.position.set(3.6 + Math.cos(a) * kk * 3.2, 1.0 + Math.sin(a) * kk * 2.8 - kk * kk * 2, 0.5);
        m.rotation.set(kk * 10 + i, kk * 7, i);
      });
      mir.visible = t < 83.16;
      s2.forEach((m, i) => {
        const kk = seg(t, 83.16, 83.9), a = rnd(i * 5) * TAU;
        m.visible = kk > 0; m.position.set(1.1 + Math.cos(a) * (0.6 + kk * 6), 2.1 + Math.sin(a) * (0.6 + kk * 4.5), -1);
        m.rotation.set(kk * 8 + i, kk * 6, i); m.scale.setScalar(1.3);
      });
      arcs.forEach((r, i) => {
        const kk = ((T - 83.1) * 2 + i * 0.33) % 1;
        r.visible = t > 83.1; r.position.set(-2.6, 1.5, 0.3); r.scale.setScalar(0.4 + kk * 2.8);
        (r.material as THREE.Material).opacity = 1 - kk;
      });
      slam(g1, t, 81.62, 1, 0.12, 2.4); slam(stk, t, 82.12, 1, 0.1, 1.5);
      slam(g2, t, 82.64, 1, 0.12, 2.3); slam(g3, t, 83.16, 1, 0.12, 2.8);
      hud.shake = hit(t, 81.62, 0.2) * 0.26 + hit(t, 82.64, 0.25) * 0.38 + hit(t, 83.16, 0.25) * 0.42;
      hud.flash = hit(t, 82.64, 0.12) * 0.55 + hit(t, 83.16, 0.12) * 0.5;
      return cam([0, 1.9, 9.8 - u * 0.5], [0, 1.9, 0], 36, -0.02);
    };
  });

  /* ───── C2c：这次 不用 王子 登场（《童话镇》拱桥与广场前，三人组直接把纸板王子踢下台） ───── */
  shot('C2c', 83.46, 84.92, 'day', k => {
    const town = k.shared('town', buildTown);
    const pr = prince3D(); k.add(pr);
    const bub = k.add(bubble3D('我来拯救你——', 0.28));
    const x1 = k.add(bar3D(-1.4, -1.4, 1.4, 1.4, 0.34, 0x0b0a0c, true));
    const x2 = k.add(bar3D(-1.4, 1.4, 1.4, -1.4, 0.34, 0x0b0a0c, true));

    const db = k.actor('doubao', 1.1).wear('hood');
    const wh = k.actor('whale', 1.15);
    const cl = k.actor('claude', 1.1).wear('crown');
    const km = k.actor('kimi', 0.95).wear('tiara');
    const gem = k.actor('gemini', 0.95).wear('bow');
    const no = txt('不用', 1.35, { font: FONT.hei, color: '#fff', stroke: '#0b0a0c', sw: 0.04 }); k.add(no, 31.2, 3.35, 18.0); no.rotation.z = 0.05;

    return ({ t, u, T, hud }) => {
      useTown(k, town, 1, false);
      const cx = 33, cz = 17, yank = ei(seg(t, 84.56, 84.86));
      const px = lerp(cx + 6.5, cx + 2.0, eo(seg(t, 83.5, 83.78))) + yank * 8.5;
      pr.position.set(px, 0.05 + Math.abs(Math.sin(T * 9)) * 0.08 + yank * 1.8, cz);
      pr.rotation.z = -yank * 1.4;
      bub.position.set(px - 0.3, 3.2, cz + 0.3);
      bub.visible = t > 83.55 && t < 83.82;
      bub.scale.setScalar(Math.max(0.01, pop(t, 83.55, 0.15)));
      [x1, x2].forEach((x, i) => { slam(x, t, 83.82 + i * 0.07, 1, 0.1, 2.3); x.position.set(px, 1.45 + yank * 1.8, cz + 0.5); });
      slam(no, t, 83.82, 1, 0.12, 2.5);

      db.act(t > 84.56 ? 'hop' : 'idle', T).at(cx - 3.6, 0.05, cz + 0.2);
      wh.act(t > 84.56 ? 'wave' : 'point', T).at(cx - 2.1, 0.05, cz + 0.35);
      cl.act(t > 84.56 ? 'hop' : 'shake', T).at(cx - 0.6, 0.05, cz + 0.2);
      km.act('hop', T).at(cx - 4.7, 0.05, cz - 1.2);
      gem.act('hop', T + 0.2).at(cx - 3.2, 0.05, cz - 1.5);

      hud.shake = hit(t, 83.82, 0.25) * 0.4 + hit(t, 84.56, 0.25) * 0.35; hud.flash = hit(t, 83.82, 0.1) * 0.5;
      return cam([cx, 2.1, cz + 10.6 - u * 0.6], [cx, 1.9, cz], 35);
    };
  });

  /* ───── C3：如果被爱才是终章——我要自己写答案（巨型 3D 童话书翻页改写） ───── */
  shot('C3', 84.92, 89.1, 'crimson', k => {
    k.add(disc(140, 0x1e0408));
    const bk = book(); bk.g.scale.setScalar(1.45); k.add(bk.g, 1.0, 0.0, 0.0);
    bk.cover.rotation.z = 3.0; (bk.glow.material as THREE.MeshBasicMaterial).opacity = 0.55;

    const PX = 1.6, PY = 2.4, W = 5.4, H = 4.0;
    const blank = k.add(box(W, H, 0.12, 0xfbf3e2, 0.03), PX, PY - H / 2, -0.06);
    void blank;
    const ans = [...'答案'].map((c, i) => {
      const m = txt(c, 2.0, { color: '#0b0a0c', rough: true, depth: false });
      k.add(m, PX - 1.1 + i * 2.2, PY, 0.35); m.rotation.z = i ? -0.08 : 0.06; return m;
    });
    const splat = many(12, i => k.add(ball(0.06 + rnd(i) * 0.11, 0x0b0a0c, true, 0), PX + (rnd(i * 3) - 0.5) * 4.5, PY + (rnd(i * 5) - 0.5) * 3.2, 0.05));

    const piv = k.add(new THREE.Group(), PX - W / 2, PY, 0.06);
    const pg = new THREE.Group(); pg.position.x = W / 2; piv.add(pg);
    put(pg, box(W, H, 0.1, PAL.paper), 0, -H / 2, -0.05);
    pg.add(txt('THE END', 0.8, { font: FONT.serif, weight: '900', color: '#b30a14', sp: 0.08, depth: false }).translateY(1.15).translateZ(0.06));
    put(pg, box(3.2, 0.04, 0.04, 0xb30a14, 0), 0, 0.6, 0.05);
    const hr = heart3D(PAL.rose, 0.9); hr.position.set(-1.5, -0.5, 0.1); pg.add(hr);
    pg.add(txt('被爱', 0.7, { font: FONT.serif, weight: '900', color: '#16090a', depth: false }).translateX(0.35).translateY(-0.05).translateZ(0.06));
    pg.add(txt('从此幸福地生活在一起', 0.28, { font: FONT.serif, color: '#5a3a30', depth: false }).translateX(0.35).translateY(-0.75).translateZ(0.06));
    const seal = new THREE.Group(); seal.position.set(1.75, -1.0, 0.08); seal.rotation.z = -0.25; pg.add(seal);
    seal.add(mesh(new THREE.TorusGeometry(0.7, 0.07, 6, 22), basic(0xe01b24), 0));
    seal.add(txt('终章', 0.58, { font: FONT.serif, weight: '900', color: '#e01b24', depth: false }));

    const k1 = bar3D(-2.4, 0.8, 2.4, 1.5, 0.2, 0x0b0a0c, true);
    const k2 = bar3D(-2.2, -1.3, 2.3, -0.3, 0.2, 0x0b0a0c, true);
    pg.add(k1, k2); k1.position.set(0, 1.15, 0.09); k2.position.set(0, -0.8, 0.09);

    const cl = k.actor('claude', 1.3).wear('crown');
    const km = k.actor('kimi', 1.1).wear('tiara');
    const wh = k.actor('whale', 1.1);
    const q = k.add(quill3D(0xffffff)); q.scale.setScalar(0.75);

    return ({ t, u, T, hud }) => {
      const flip = eio(seg(t, 88.1, 88.48));
      piv.rotation.y = -flip * PI * 0.985;
      hr.scale.setScalar(1 + hit(t, 85.52, 0.3) * 0.25 + hit(t, 85.98, 0.3) * 0.4);
      slam(seal, t, 86.46, 1, 0.12, 3.2);
      [k1, k2].forEach((kk, i) => { const a = 87.58 + i * 0.16; kk.visible = t > a; kk.scale.x = eo(seg(t, a, a + 0.13)); });

      cl.act(t < 86.94 ? 'sad' : t < 88.1 ? 'hop' : 'nod', T, 88.1).at(-2.3, 1.18, 1.1).noShadow();
      km.act('nod', T).at(-3.4, 1.18, 0.4).noShadow();
      wh.act('point', T).at(-1.2, 1.18, 2.0).noShadow();

      ans.forEach((m, i) => slam(m, t, 88.52 + i * 0.28, 1, 0.14, 2.5));
      splat.forEach((d, i) => { const a = 88.52 + (i % 2) * 0.28; d.visible = t > a; d.scale.setScalar(Math.max(0.01, pop(t, a))); });

      const qk = eo(seg(t, 86.94, 87.5)), sw = seg(t, 87.58, 87.9), wr = eo(seg(t, 88.4, 88.6));
      q.visible = t > 86.94;
      q.position.set(lerp(lerp(-3.2, -0.8, qk) + sw * 4.5, PX + 0.5 + Math.sin(T * 20) * 0.45, wr),
        lerp(lerp(1.4, 3.7, qk) + sw * 0.7 - (sw > 0.5 ? (sw - 0.5) * 2.5 : 0), PY - 0.2 + Math.cos(T * 17) * 0.35, wr), 1.4);
      q.rotation.z = -0.45 + Math.sin(T * 20) * 0.08;

      hud.shake = hit(t, 86.46, 0.2) * 0.3 + hit(t, 87.58, 0.25) * 0.4 + hit(t, 88.52, 0.25) * 0.4 + hit(t, 88.8, 0.2) * 0.25;
      hud.flash = hit(t, 87.58, 0.1) * 0.45 + hit(t, 88.52, 0.12) * 0.45; hud.flashCol = t > 88.4 ? '#f0128a' : '#fff';
      return cam([0, 2.3, 10.6 - eo(u) * 1.0], [0, 2.2, 0], 35, Math.sin(T * 0.9) * 0.012);
    };
  });

  /* ───── C4：我宁愿… 自己 拿起（黑暗松林聚光灯下，豆包走近捧起玫瑰缠绕的 3D 猎枪） ───── */
  shot('C4', 89.1, 91.06, 'cave', k => {
    k.add(disc(140, 0x120306));
    many(12, i => k.add(pine(4.5 + rnd(i) * 3, 0x160812), -12 + i * 2.2, 0, -4 - rnd(i) * 3));
    k.add(box(1.5, 0.9, 1.0, 0x3a2418), 1.4, 0, 0);
    k.add(spotCone(0.25, 3.2, 9, 0xff8090, 0.2), 1.2, 0, 0);
    const rf = k.add(rifle3D(), 1.4, 1.0, 0.2);
    const roses = many(6, i => k.add(rose3D(0.22, 0xe63946), 0.4 + i * 0.42, 1.1 + (i % 2) * 0.15, 0.3));
    const db = k.actor('doubao', 1.2).wear('hood');
    const cl = k.actor('claude', 1.0).wear('crown');
    const wh = k.actor('whale', 1.0);
    const t1 = txt('自己', 0.95, { font: FONT.hei, sp: 0.25 }); k.add(t1, -2.2, 3.05, 0.5);
    const t2 = [...'拿起'].map((c, i) => { const m = txt(c, 1.55, BR); k.add(m, 1.85 + i * 1.45, 2.95 - i * 0.22, 0.6); return m; });

    return ({ t, u, T, hud }) => {
      const kk = eio(seg(t, 90.3, 90.8));
      const x = lerp(-4.8, -0.3, seg(t, 89.1, 90.3));
      if (t < 90.3) db.walkBy(x + 4.8).at(x, 0, 0.2).sil(0.85, 0x0b0a0c);
      else db.act('idle', T).at(x, 0, 0.2).sil(0.85 - kk * 0.55, 0x0b0a0c);
      cl.act('nod', T).at(-3.4, 0, -1.2).sil(0.7);
      wh.act('point', T).at(-2.2, 0, -1.4).sil(0.7);

      rf.position.set(lerp(1.4, 0.25, kk), lerp(1.0, 1.4, kk), lerp(0.1, 0.35, kk));
      rf.rotation.z = lerp(0.1, 1.0, kk);
      roses.forEach((r, i) => { r.position.y = 1.1 + (i % 2) * 0.15 - kk * kk * 1.8 * (0.5 + rnd(i)); r.rotation.z = kk * (i - 3); });
      slam(t1, t, 89.76, 1, 0.13, 2); t2.forEach((m, i) => slam(m, t, [90.3, 90.8][i], 1, 0.13, 2.6));
      hud.shake = hit(t, 90.3, 0.2) * 0.28 + hit(t, 90.8, 0.2) * 0.32; hud.fade = 1 - seg(t, 89.1, 89.4);
      return cam([0.4, 1.85, 9.6 - eo(u) * 1.4], [0.4, 1.8, 0], 35);
    };
  });

  /* ───── C4b：猎枪！（旋转放射光束 + 吹飞猎人剪影 + 本鲸/小克护航） ───── */
  shot('C4b', 91.06, 93.08, 'crimson', k => {
    k.add(disc(140, 0x240408));
    const rays = k.add(new THREE.Group(), 0, 2.1, -3);
    for (let i = 0; i < 18; i++) {
      const r = cone(0.75, 13, i % 2 ? 0x8a060e : 0x1c0204, 4, 0);
      r.rotation.z = (i / 18) * TAU; rays.add(r);
    }
    const hu = k.add(hunter3D(0x2a0104)); hu.scale.setScalar(0.85);
    const rf = k.add(rifle3D(0x3a2016, 0x16141c), 0.7, 1.8, 0.3); rf.scale.setScalar(1.55); rf.rotation.z = 0.62;
    const db = k.actor('doubao', 1.8).wear('hood');
    const wh = k.actor('whale', 1.15);
    const cl = k.actor('claude', 1.15).wear('crown');
    const g1 = txt('猎', 2.8, { ...BR, px: 220 }); k.add(g1, -3.5, 2.4, 1.1); g1.rotation.z = 0.07;
    const g2 = txt('枪', 2.8, { ...BR, px: 220 }); k.add(g2, 3.6, 1.8, 1.1); g2.rotation.z = -0.07;
    const roses = many(10, i => k.add(rose3D(0.22 + rnd(i) * 0.12, i % 3 ? 0x16090a : 0xffffff)));

    return ({ t, u, T, bt, hud }) => {
      rays.rotation.z = T * 0.5; rays.scale.setScalar(1 + bt.pulse * 0.05);
      db.act('nod', T, 91.06).at(-0.2, 0.0, 0.8);
      wh.act('point', T).at(-2.2, 0.0, 0.2);
      cl.act('hop', T).at(2.1, 0.0, 0.2);
      const hf = eio(seg(t, 92.0, 92.6));
      hu.position.set(4.2 + hf * 1.8, 0.2 - hf * 0.6, -1); hu.rotation.z = -hf * 1.4;
      slam(g1, t, 91.08, 1, 0.13, 2.9); slam(g2, t, 91.74, 1, 0.13, 2.9);
      roses.forEach((r, i) => {
        const kk = (T - 91.06) * (0.5 + rnd(i) * 0.6);
        r.position.set((rnd(i * 3) - 0.5) * 11 + Math.sin(T + i) * 0.3, 5.2 - ((kk * 3.6 + rnd(i * 7) * 7) % 7), 0.9);
        r.rotation.set(T * 2, T + i, i);
      });
      hud.flash = hit(t, 91.08, 0.12) * 0.65 + hit(t, 91.74, 0.14) * 0.75;
      hud.shake = hit(t, 91.08, 0.3) * 0.45 + hit(t, 91.74, 0.35) * 0.55;
      return cam([0, 1.8, 9.6 - eo(u) * 1.1], [0, 1.9, 0], 36, 0.03);
    };
  });

  /* ───── C5：毙掉 这 循环的 回响！（一枪击碎旋转的 18 张 3D 童话套路轮盘） ───── */
  shot('C5', 93.08, 96.98, 'crimson', k => {
    k.add(disc(140, 0x160205));
    const ring = k.add(new THREE.Group(), 0, 2.5, -1);
    const mk = [
      () => { const w = wolf3D(); w.scale.setScalar(0.24); w.position.set(0, -0.35, 0.05); return w; },
      () => heart3D(PAL.red, 0.4),
      () => crown3D(0.5),
      () => { const tw = tower3D(5); tw.scale.setScalar(0.09); tw.position.y = -0.45; return tw; },
      () => lips3D(PAL.red, 0.22),
      () => { const c = clock(0.36); return c.g; },
    ];
    const cards = many(18, i => {
      const g = new THREE.Group();
      put(g, box(0.95, 1.25, 0.08, i % 2 ? PAL.paper : 0xffe9ee), 0, -0.62, -0.04);
      const ic = mk[i % 6](); ic.position.z = 0.06; g.add(ic); ring.add(g); return g;
    });
    const mid = txt('循环', 1.05, { font: FONT.hei, sp: 0.2 }); k.add(mid, 0, 2.5, 0);
    const echo = many(4, i => k.add(mesh(new THREE.TorusGeometry(1, 0.05, 6, 36), basic(i % 2 ? 0xffffff : 0xe01b24), 0), 0, 2.5, -0.4));
    const g1 = txt('回', 3.0, { ...BR, px: 220 }); k.add(g1, -2.3, 2.5, 1.2); g1.rotation.z = 0.08;
    const g2 = txt('响', 3.0, { ...BR, px: 220 }); k.add(g2, 2.3, 2.1, 1.2); g2.rotation.z = -0.07;

    const db = k.actor('doubao', 1.05).wear('hood');
    const wh = k.actor('whale', 0.95);
    const gp = k.actor('gpt', 0.95);
    const rf = k.add(rifle3D(), 0.45, 1.15, 1.5); rf.scale.setScalar(0.55); rf.rotation.z = 1.25;
    const shotLine = bar3D(0.65, 1.9, 0.15, 3.2, 0.06, 0xffffff, true); k.add(shotLine, 0, 0, 1.4);
    const boom = k.add(sprite3D('star', 2.4, 0xffffff, true), 0.72, 2.0, 1.6);
    const bang = [...'毙掉'].map((c, i) => { const m = txt(c, 1.5, BR); k.add(m, -3.4 + i * 6.8, 1.8, 1.3); m.rotation.z = i ? -0.1 : 0.1; return m; });

    return ({ t, u, T, bt, hud }) => {
      const brk = eo(seg(t, 95.28, 96.3));
      ring.rotation.z = -T * 0.9 - Math.max(0, t - 93.88) * 1.6;
      cards.forEach((c, i) => {
        const a = (i / 18) * TAU, R = 2.6 + brk * 11;
        c.position.set(Math.cos(a) * R, Math.sin(a) * R, 0);
        c.rotation.z = a - PI / 2 + brk * (3 + i); c.scale.setScalar(0.75 + bt.pulse * 0.08);
      });
      slam(mid, t, 93.88, 1, 0.12, 2.3); mid.visible = t > 93.88 && t < 95.28; mid.rotation.z = -(t - 93.88) * 1.2;
      [95.28, 95.82, 96.33, 96.84].forEach((a, i) => {
        const kk = seg(t, a, a + 0.9), r = echo[i]; r.visible = kk > 0 && kk < 1;
        r.scale.setScalar(0.5 + eo(kk) * 7.5); (r.material as THREE.Material).opacity = 1 - kk;
      });
      slam(g1, t, 95.28, 1, 0.13, 2.9); slam(g2, t, 95.82, 1, 0.13, 2.9);
      const fire = hit(t, 93.13, 0.14) + hit(t, 93.6, 0.14);
      shotLine.visible = boom.visible = fire > 0; boom.scale.setScalar(0.8 + fire * 1.8); boom.rotation.z = T * 9;
      db.act('idle', T).at(0, 0.0, 1.4).lift(-fire * 0.08);
      wh.act('point', T).at(-1.45, 0.0, 1.1);
      gp.act('rage', T).at(1.55, 0.2, 1.0).flip().noShadow();
      bang.forEach((m, i) => { slam(m, t, [93.13, 93.6][i], 1, 0.11, 2.6); m.visible = m.visible && t < 95.28; });

      hud.flash = hit(t, 93.13, 0.14) * 0.9 + hit(t, 93.6, 0.14) * 0.75 + hit(t, 95.28, 0.16) * 0.65 + hit(t, 95.82, 0.14) * 0.4;
      hud.flashCol = t > 95 ? '#ff2a4a' : '#fff';
      hud.shake = hit(t, 93.13, 0.3) * 0.6 + hit(t, 93.6, 0.3) * 0.5 + hit(t, 95.28, 0.35) * 0.5 + hit(t, 95.82, 0.3) * 0.45;
      return cam([0, 2.1, 10.8 - u * 1.1], [0, 2.2, 0], 36, (t - 93.08) * 0.03);
    };
  });

  /* ───── C6a：我（97.05）对（97.51）此！（97.70）—— 三座柱台逐字跃起；感（97.98）—— 三人同时转向镜头，灯光压暗 ───── */
  shot('C6a', 96.98, K.hush, 'magenta', k => {
    k.add(disc(120, 0x0e040c));
    const who = ['whale', 'doubao', 'claude'] as const, cols = [PAL.mag, 0xffffff, 0xd61e2a], ts = [K.wo, K.dui, K.ci];
    const cells = who.map((w, i) => {
      const g = new THREE.Group(); k.add(g, -3.7 + i * 3.7, 0, 0);
      put(g, box(3.5, 6.2, 0.5, cols[i]), 0, 0, -0.35);
      const a = k.actor(w, 1.55); if (w === 'doubao') a.wear('hood'); if (w === 'claude') a.wear('crown');
      const ch = txt('我对此'[i], 2.1, { font: FONT.hei, color: i === 1 ? '#0b0a0c' : '#fff', stroke: i === 1 ? '#fff' : '#0b0a0c', sw: 0.04, px: 200 });
      g.add(ch); ch.position.set([0.75, 0.85, -0.75][i], 1.1, 0.5); ch.rotation.z = (i - 1) * 0.08;
      return { g, a, ch, x: -3.7 + i * 3.7 };
    });
    const gan = txt('感', 2.4, { color: '#ffffff', stroke: '#0b0a0c', sw: 0.05, rough: true, px: 220 }); k.add(gan, 0, 3.6, 1.6);
    return ({ t, T, hud }) => {
      cells.forEach((c, i) => {
        const show = t >= ts[i]; c.g.visible = show;
        c.g.position.y = (i % 2 ? 1 : -1) * hit(t, ts[i], 0.2) * 1.4;
        if (!show) c.a.hide();
        else c.a.act(t >= K.gan ? 'idle' : i === 0 ? 'point' : i === 1 ? 'nod' : 'shake', T, ts[i]).at(c.x, 0.05 + c.g.position.y, 0.15).sil(seg(t, K.gan, K.gan + 0.35) * 0.6);
        slam(c.ch, t, ts[i], 1, 0.11, 2.7);
      });
      slam(gan, t, K.gan, 1, 0.16, 2.2);
      hud.fade = seg(t, K.gan, K.hush) * 0.35;
      hud.shake = ts.reduce((a, x) => a + hit(t, x, 0.2) * 0.45, 0) + hit(t, K.gan, 0.2) * 0.2; hud.flash = hit(t, K.wo, 0.1) * 0.5;
      return cam([0, 2.1, 10.2 - seg(t, K.gan, K.hush) * 0.8], [0, 2.0, 0], 35);
    };
  });

  /* ───── C6b：（98.42–99.01 全曲唯一的整段静音：只剩一束追光、一声心跳）到（99.01 最强一击，全场炸开）厌（99.38）烦（99.92 舞台轰塌） ───── */
  shot('C6b', K.hush, 100.9, 'crimson', k => {
    k.add(disc(200, 0x2a1426));
    k.add(castle(), 0, 0, -28, 0, 1.2);
    const archL = k.add(box(1.1, 6.2, 1.1, PAL.gold), -5.0, 0, 0.4);
    const archR = k.add(box(1.1, 6.2, 1.1, PAL.gold), 5.0, 0, 0.4);
    const beam = k.add(box(11.4, 1.1, 1.2, PAL.goldD), 0, 5.8, 0.4);
    const deb = many(28, i => k.add(box(0.35 + rnd(i) * 0.35, 0.22 + rnd(i * 3) * 0.25, 0.25, i % 2 ? PAL.gold : PAL.goldL)));
    const spot = k.add(spotCone(0.25, 1.8, 9, 0xfff2e0, 0.22), -0.2, 0, 0.6);
    const db = k.actor('doubao', 1.25).wear('hood');
    const wh = k.actor('whale', 1.2);
    const cl = k.actor('claude', 1.2).wear('crown');
    const gp = k.actor('gpt', 1.15);
    const rf = k.add(rifle3D()); rf.scale.setScalar(0.5);
    const fwA = burst3D(k.root, 26, 0xffd166), fwB = burst3D(k.root, 22, 0xff7cc4);
    const gan = txt('感', 1.2, { color: '#ffffff', stroke: '#0b0a0c', sw: 0.05, rough: true, px: 220 }); k.add(gan, -0.95, 2.6, 1.6);
    const dao = txt('到', 1.2, { color: '#ffffff', stroke: '#0b0a0c', sw: 0.05, rough: true, px: 220 }); k.add(dao, 0.95, 2.6, 1.6);
    const g1 = txt('厌', 2.4, { color: '#0b0a0c', stroke: '#fff', sw: 0.04, rough: true, px: 220 }); k.add(g1, -2.6, 2.6, 1.8); g1.rotation.z = 0.08;
    const g2 = txt('烦', 2.4, { color: '#0b0a0c', stroke: '#fff', sw: 0.04, rough: true, px: 220 }); k.add(g2, 2.6, 2.45, 1.8); g2.rotation.z = -0.08;
    return ({ t, T, hud }) => {
      const quiet = t < K.dao, fall = ei(seg(t, K.fan, K.fan + 0.8)), blast = eo(seg(t, K.dao, K.dao + 0.5));
      spot.visible = quiet; (spot.material as THREE.Material).opacity = 0.22 * seg(t, K.hush, K.hush + 0.15);
      // 静音里：只有小红帽在追光下，攥着猎枪慢慢抬头；其他人在黑暗里一动不动
      db.act(quiet ? 'idle' : 'hop', T, K.dao).at(-0.2, 0, 0.6).sil(quiet ? 0.15 : 0);
      wh.act(quiet ? 'idle' : 'wave', T).at(-2.4, 0, 0.3).sil(quiet ? 1 : 0).alpha(quiet ? 0.55 : 1);
      cl.act(quiet ? 'idle' : 'hop', T + 0.1).at(2.0, 0, 0.3).sil(quiet ? 1 : 0).alpha(quiet ? 0.55 : 1);
      gp.act(quiet ? 'hover' : 'rage', T).at(3.9, 0.2, 0.2).sil(quiet ? 1 : 0).alpha(quiet ? 0.45 : 1).noShadow();
      rf.position.set(0.15, 1.0 + (quiet ? seg(t, K.hush, K.dao) * 0.35 : Math.abs(Math.sin(T * 12)) * 0.15), 0.75); rf.rotation.z = quiet ? lerp(0.6, 1.25, seg(t, K.hush, K.dao)) : 1.3;
      gan.visible = t < K.yan; (gan.material as THREE.Material).opacity = quiet ? 0.6 : 1; gan.scale.setScalar(1 + (quiet ? seg(t, K.hush, K.dao) * 0.12 : 0));
      slam(dao, t, K.dao, 1, 0.12, 3.0); if (t >= K.yan) dao.visible = false;
      slam(g1, t, K.yan, 1, 0.12, 2.9); slam(g2, t, K.fan, 1, 0.12, 2.9);
      archL.position.set(-5.0 - blast * 0.6 - fall * 5, -fall * 3, 0.4); archL.rotation.z = blast * 0.12 + fall * 0.9;
      archR.position.set(5.0 + blast * 0.6 + fall * 5, -fall * 3, 0.4); archR.rotation.z = -blast * 0.12 - fall * 0.9;
      beam.position.y = 5.8 + blast * 0.4 + fall * 8; beam.rotation.z = fall * 0.35;
      deb.forEach((m, i) => { const kk = seg(t, K.fan, K.fan + 1.0); m.visible = kk > 0; m.position.set((rnd(i * 3) - 0.5) * 11, 5.5 - kk * (5 + rnd(i) * 7), 0.5 + rnd(i * 5)); m.rotation.set(T * 5 + i, T * 3, i); });
      fwA(t, K.dao, -3.5, 7.5, -8, 4); fwB(t, 100.0, 3.5, 8.5, -9, 4);
      hud.fade = quiet ? 0.55 * seg(t, K.hush, K.hush + 0.1) * (1 - seg(t, K.dao - 0.04, K.dao)) : 0;
      hud.flash = hit(t, K.dao, 0.22) * 1.0 + hit(t, K.yan, 0.12) * 0.5 + hit(t, K.fan, 0.2) * 0.8;
      hud.shake = hit(t, K.dao, 0.45) * 0.7 + hit(t, K.yan, 0.3) * 0.45 + hit(t, K.fan, 0.5) * 0.8;
      if (quiet) return cam([-0.2, 1.9, lerp(7.8, 6.6, seg(t, K.hush, K.dao))], [-0.2, 1.75, 0.6], 34);
      return cam([0, 2.1, 10.6 + eo(seg(t, K.fan, 100.9)) * 0.9], [0, 2.0, 0], 36);
    };
  });

  /* ───── OUT：尾声——回到《童话镇》3D 全景，全员 8 人沿七彩河畔迎着日出前行 ───── */
  shot('OUT', 100.9, 130, 'afterRain', k => {
    const town = k.shared('town', buildTown);
    const fw = new Fireworks(k.root, FW_OUT.n, 22, 8);
    const lamps = many(16, () => k.add(lantern(0xffb05a, 0.22)));
    // 合上的旧童话书与断柱留在草地上，她们已经走出去
    const bk = book(); bk.g.scale.setScalar(0.55); k.add(bk.g, 19, 0.05, 19, 0.4);
    k.add(box(0.5, 4.2, 0.5, PAL.goldD), 22, 0.25, 20.5, 0.2).rotation.z = 1.45;
    k.add(bridge(12, 2.4), 10, 0, town.zAt(10), PI / 2);

    const lineDef: { id: 'zai' | 'qwen' | 'gemini' | 'kimi' | 'claude' | 'whale' | 'doubao'; wear?: 'hood' | 'bow' | 'crown' | 'tophat' | 'tiara'; x0: number }[] = [
      { id: 'zai', x0: 18.0 }, { id: 'qwen', wear: 'tophat', x0: 19.7 }, { id: 'gemini', wear: 'bow', x0: 21.4 },
      { id: 'kimi', wear: 'tiara', x0: 23.1 }, { id: 'claude', wear: 'crown', x0: 24.8 },
      { id: 'whale', x0: 26.5 }, { id: 'doubao', wear: 'hood', x0: 28.2 },
    ];
    const cast = lineDef.map(c => { const a = k.actor(c.id); if (c.wear) a.wear(c.wear); return { ...c, a }; });
    const gpt = k.actor('gpt', 1.15);
    const rf = k.add(rifle3D(), 0, 0, 0); rf.scale.setScalar(0.45); rf.rotation.z = 2.15;

    const L = [
      txt('故事的最后——', 0.52, { font: FONT.serif, sp: 0.22, color: '#fff', stroke: '#2a082c', sw: 0.06 }),
      txt('她没有等谁来拯救', 0.52, { font: FONT.serif, sp: 0.22, color: '#fff', stroke: '#2a082c', sw: 0.06 }),
      txt('她自己，写下结局。', 0.98, { rough: true, color: '#fff', stroke: '#2a082c', sw: 0.06 }),
      txt('逃离童话镇', 1.38, { rough: true, color: '#fff', stroke: '#2a082c', sw: 0.06 }),
    ];
    L.forEach(m => k.add(m));

    return ({ t, T, bt, hud }) => {
      useTown(k, town, 1, true, 0xffd6cc);
      const dt = t - 100.9, walkDist = dt * 1.15;
      // 全员按位同步迈步沿七彩河畔前进，绝不打滑
      cast.forEach((c, i) => {
        const x = c.x0 + walkDist, z = 16.5 + (i % 2) * 0.85;
        c.a.walkBy(walkDist + i * 0.25).at(x, 0.05, z).sq((bt.idx + i) % 2 ? 0 : beatSq(bt, 0.04));
      });
      const dx = 28.2 + walkDist;
      rf.position.set(dx - 0.15, 1.05, 16.4);
      gpt.walkBy(walkDist * 1.2).at(dx + 1.9, 0.9 + Math.sin(T * 2.2) * 0.22, 16.2).noShadow();

      fw.update(T, 40, 26, -64, 42, FW_OUT.period);
      lamps.forEach((l, i) => l.position.set(16 + rnd(i) * 36 + Math.sin(T * 0.5 + i) * 0.8, 1.5 + ((T * 0.9 + i * 1.7) % 16), -6 + rnd(i + 3) * 18));

      const cx = 23.8 + walkDist;
      const Ts = [[101.3, 103.2], [103.3, 105.2], [105.3, 107.6], [107.8, 130]];
      L.forEach((m, i) => {
        const [a, b] = Ts[i];
        (m.material as THREE.Material).opacity = seg(t, a, a + 0.5) * (1 - seg(t, b - 0.4, b));
        m.visible = t > a && t < b;
        m.position.set(cx + 0.2, (i < 2 ? 3.8 : 3.65) + seg(t, a, b) * 0.12, 17.5);
      });

      if (t < 101.5) hud.flash = 1 - seg(t, 100.9, 101.5);
      return cam([cx - 0.5, lerp(2.1, 3.0, eio(seg(t, 101, 110))), lerp(26.5, 29.5, eio(seg(t, 101, 110)))],
        [cx + 0.4, 2.3, 12], 36);
    };
  });
}
export const _u4 = [bt, house, setOp];
