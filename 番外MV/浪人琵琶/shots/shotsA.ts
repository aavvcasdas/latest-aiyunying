// 镜头表（上）：副歌一 C01–C07（回忆：花茶与花伞）· 主歌 C08–C13（独酌）· 预副歌一 C14–C20（夜游）
// 句序号从 0 数：L0–L6 副歌一 · L7–L12 主歌 · L13–L19 预副歌一
import * as THREE from 'three';
import { cam, glide, track, type ShotDef } from '@tpl/core';
import { ball, box, cyl, disc, ease, easeOut, hash, lerp, seg, setOp, sprite } from '@tpl/kit';
import { hourglass, rain } from '@tpl/props';
import {
  PI, beatSq, cake, courtyard, dropPetals, flowerUmbrella, ghost, lampLevel, many, moon, notes, pipa, playNotes, puddles, puffSteam,
  steam, street, tavernRoom, teaTray, tipsy, wineCup, winePot, bridgeTop,
} from './common';

// 小院里固定的站位：千问在石桌左，本鲸在石桌右（两人隔着桌子）
const QX = -1.75, WX = 1.75, TZ = 1.0, SEAT_Z = 1.7;

export const SHOTS_A: ShotDef[] = [
  {
    id: 'C01', look: 'golden', title: '小生的花伞还落在你家', cast: ['whale', 'qwen'], fx: { title: true },
    note: '片名叠在这一镜上。暖黄午后，千问家院门口：本鲸背对院门往外走、回头挥手，千问在门内欠身相送。镜头从靠在门柱上的那把花伞拉开——伞没带走，故事就从这把伞开始。',
    build: (k) => {
      const c = courtyard(k);
      const um = flowerUmbrella(); k.add(um.g, c.umbrellaSpot[0], 0.05, c.umbrellaSpot[2]); um.g.rotation.z = 0.3; um.set(0.1);
      const whale = k.actor('whale'), qwen = k.actor('qwen');
      const A = cam([3.6, 1.3, -2.6], [2.5, 0.9, -5.5], 30), B = cam([2.0, 1.9, 3.6], [3.3, 1.0, -4.4], 40);
      return ({ u, T, t, bt }) => {
        dropPetals(c.petals, T);
        const go = seg(u, 0.3, 1);
        whale.walkBy(3.6 * go).at(lerp(3.1, 4.9, go), 0, lerp(-3.6, -2.4, go)).sq(beatSq(bt));
        if (u > 0.62 && u < 0.86) whale.set('whale_wave');
        qwen.act('bow', T, T - t + 1.0).at(2.0, 0, -4.6).flip();
        setOp(c.lampGlow, 0.2);
        return track([[0, A], [0.28, A], [1, B]], u);
      };
    },
  },
  {
    id: 'C02', look: 'golden', title: '你美眷如花 我浪迹天涯', cast: ['qwen', 'whale'],
    note: '一个画面放两种人生：左边花树下千问摇扇，花瓣围着她落；右边本鲸背着包袱走上出城的土路，越走越小。镜头从花树慢慢横移到路尽头的远山。',
    build: (k) => {
      const c = courtyard(k);
      many(9, (i) => k.add(box(1.2, 0.04, 0.8, 0xc9b79a, 0.02), 6.5 + i * 1.6, 0, -6.5 - i * 1.3));
      const qwen = k.actor('qwen'), whale = k.actor('whale');
      const fan = k.thing('prop_fan'), bundle = k.add(ball(0.26, 0x6b4a8a, true, 0.03));
      const A = cam([-0.5, 1.6, 4.5], [0.3, 1.2, -3.0], 38), B = cam([6.5, 2.6, 2.0], [11, 1.5, -11], 40);
      return ({ u, T, bt }) => {
        dropPetals(c.petals, T, 0.6, -3, 3.4);
        qwen.act('sway', T).at(0.9, 0, -1.6).sq(beatSq(bt));
        fan.at(1.45, 1.15 + Math.sin(T * 3) * 0.05, -1.3);
        const w = seg(u, 0.15, 1);
        const wx = lerp(7.0, 18.5, w), wz = lerp(-6.8, -16.5, w);
        whale.walkBy(14 * w).at(wx, 0, wz).size(1).flip(false);
        bundle.position.set(wx - 0.42, 1.2, wz + 0.02);
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'C03', look: 'golden', title: '为我泡杯花茶 和你有些不搭', cast: ['qwen', 'whale', 'gemini'],
    note: '石桌两边：千问把一小盏花茶推过来，茶气袅袅；本鲸把自己的大饭盆也放上了桌——精致茶盏对着蓝饭盆，「不搭」一眼就看见。墙头趴着邻家猫娘 Gemini 看热闹。',
    build: (k) => {
      const c = courtyard(k);
      k.add(teaTray(), -0.35, c.tableTop, TZ - 0.1);
      const qwen = k.actor('qwen'), whale = k.actor('whale'), gem = k.actor('gemini', 0.8);
      const cup = k.thing('prop_teacup'), bowl = k.thing('prop_bowl');
      const st = steam(k, 3);
      const A = cam([0.4, 1.5, 7.6], [0, 1.0, 0.8], 36), B = cam([0.2, 1.35, 6.4], [0.1, 0.95, 0.9], 34);
      return ({ u, T, t, bt }) => {
        dropPetals(c.petals, T);
        qwen.act('nod', T, T - t + 0.4).at(QX, 0, SEAT_Z).sq(beatSq(bt));
        whale.idle(T).flip().at(WX, 0, SEAT_Z).sq(beatSq(bt, 0.04));
        const push = ease(seg(u, 0.15, 0.55));
        cup.at(lerp(-0.6, 0.55, push), c.tableTop, TZ + 0.25);
        puffSteam(st, T, lerp(-0.6, 0.55, push), c.tableTop + 0.25, TZ + 0.25, 1, 0.6);
        bowl.at(1.05, c.tableTop, TZ + 0.3).size(1.35);
        gem.act('lookaround', T).at(-1.4, c.wallTop, -5.9).size(0.8);
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'C04', look: 'golden', title: '气氛开始有一点尴尬', cast: ['qwen', 'whale', 'gemini'],
    note: '谁也不说话。本鲸头顶冒汗、脚底随着拍子一点一点地抖；千问歪头收扇、顶着一个问号；一片叶子慢悠悠落在桌心。镜头几乎不动，只往前挪了一点点——把尴尬放大。',
    build: (k) => {
      const c = courtyard(k);
      k.add(teaTray(), -0.35, c.tableTop, TZ - 0.1);
      const qwen = k.actor('qwen'), whale = k.actor('whale'), gem = k.actor('gemini', 0.8);
      const cup = k.thing('prop_teacup'), bowl = k.thing('prop_bowl'), fan = k.thing('prop_fan');
      const leaf = k.add(sprite('leaf', 0.3, 0xd98a4a));
      const A = cam([0, 1.5, 6.9], [0, 1.0, 0.9], 35), B = cam([0, 1.45, 6.3], [0, 1.0, 0.9], 34);
      return ({ u, T, t, bt }) => {
        dropPetals(c.petals, T);
        qwen.act('tilt', T, T - t + 0.6).at(QX, 0, SEAT_Z).emote('fx_question', T);
        whale.idle(T).flip().at(WX, 0, SEAT_Z).sq(beatSq(bt, 0.09)).emote('fx_sweat', T);
        cup.at(0.55, c.tableTop, TZ + 0.25); bowl.at(1.05, c.tableTop, TZ + 0.3).size(1.35); fan.at(QX + 0.55, 1.1, SEAT_Z + 0.1);
        const fall = seg(u, 0.1, 0.8);
        leaf.position.set(0.1 + Math.sin(fall * 7) * 0.35, lerp(3.0, c.tableTop + 0.05, easeOut(fall)), TZ + 0.1);
        leaf.material.rotation = fall * 5;
        gem.act('tilt', T, T - t + 1.2).at(-1.4, c.wallTop, -5.9).size(0.8);
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'C05', look: 'golden', title: '你腼腆一笑 竟如此融洽', cast: ['qwen', 'whale', 'gemini'],
    note: '千问抬袖掩嘴、微微一躬，头顶冒星星；花瓣与蝴蝶一起飞起来。本鲸从缩着的一团坐直了，蹦了一下。镜头从本鲸肩后看千问，慢慢转到两人中间。',
    build: (k) => {
      const c = courtyard(k);
      k.add(teaTray(), -0.35, c.tableTop, TZ - 0.1);
      const qwen = k.actor('qwen'), whale = k.actor('whale'), gem = k.actor('gemini', 0.8);
      const cup = k.thing('prop_teacup'), bowl = k.thing('prop_bowl'), fan = k.thing('prop_fan');
      const bf = many(5, () => k.add(sprite('butterfly', 0.36, 0xfff0a0)));
      const A = cam([2.6, 1.5, 3.4], [QX, 1.15, SEAT_Z], 34), B = cam([0.3, 1.6, 6.0], [0, 1.05, 1.0], 36);
      return ({ u, T, t, bt }) => {
        dropPetals(c.petals, T, 0.6, -3, 3.2, 1);
        const smile = seg(u, 0.1, 0.4);
        qwen.act('bow', T, T - t + 0.3).at(QX, 0, SEAT_Z).emote(smile > 0.5 ? 'fx_sparkle' : null, T);
        fan.at(QX + 0.3, lerp(1.05, 1.35, ease(smile)), SEAT_Z + 0.2);
        const perk = ease(seg(u, 0.35, 0.6));
        whale.act(perk > 0.99 ? 'hop' : 'idle', T, T - t + 1.9).flip().at(WX, 0, SEAT_Z).sq(beatSq(bt, 0.05) - perk * 0.04);
        cup.at(0.55, c.tableTop, TZ + 0.25); bowl.at(1.05, c.tableTop, TZ + 0.3).size(1.35);
        bf.forEach((s, i) => { const ph = seg(u, 0.3 + i * 0.05, 1); s.position.set(QX + 0.2 + Math.sin(T * 2 + i * 1.3) * (0.6 + ph), 1.3 + ph * 1.6 + Math.sin(T * 3 + i) * 0.2, SEAT_Z + 0.3 + Math.cos(T * 1.5 + i) * 0.5); s.scale.x = 0.36 * (0.3 + 0.7 * Math.abs(Math.sin(T * 13 + i))); setOp(s, ph); });
        gem.act('hop', T, T - t + 1.6).at(-1.4, c.wallTop, -5.9).size(0.8);
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'C06', look: 'golden', title: '我情不自禁会为你牵挂', cast: ['whale', 'qwen'],
    note: '本鲸的近景：她低头看杯里的花茶，茶气往上飘着飘着变成了一颗小心；她抬头，千问在背景里给她续茶。牵挂不是喊出来的，是茶气里长出来的。',
    build: (k) => {
      const c = courtyard(k);
      k.add(teaTray(), -0.35, c.tableTop, TZ - 0.1);
      const whale = k.actor('whale'), qwen = k.actor('qwen');
      const cup = k.thing('prop_teacup'), bowl = k.thing('prop_bowl');
      const st = steam(k, 3), heart = k.add(sprite('heart', 0.42, 0xff8fb0));
      const A = cam([2.2, 1.3, 4.6], [1.4, 1.05, 1.4], 32), B = cam([1.2, 1.4, 5.2], [0.6, 1.05, 1.3], 34);
      return ({ u, T, t, bt }) => {
        dropPetals(c.petals, T);
        whale.act(u > 0.6 ? 'nod' : 'idle', T, T - t + 2.2).flip().at(WX, 0, SEAT_Z).sq(beatSq(bt, 0.04));
        cup.at(0.95, c.tableTop, TZ + 0.3); bowl.at(1.5, c.tableTop, TZ + 0.1).size(1.35);
        const rise = (T * 0.45) % 1;
        puffSteam(st, T, 0.95, c.tableTop + 0.25, TZ + 0.3, 1, 0.5);
        heart.position.set(0.95 + Math.sin(rise * 6) * 0.08, c.tableTop + 0.6 + rise * 1.0, TZ + 0.35); heart.scale.setScalar(0.25 + rise * 0.3); setOp(heart, Math.sin(rise * PI) * seg(u, 0.1, 0.4));
        qwen.act('bow', T, T - t + 2.0).at(QX, 0, SEAT_Z);
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'C07', look: 'dusk', title: '什么时代 早已经不想回家', cast: ['whale', 'qwen'],
    note: '天色转暮。本鲸已经在院门外的路上，背着包袱回头看那扇亮起来的窗；她迈出一步又停住。门柱边的花伞还在。镜头摇升，露出通向远方的路——她本来就没有家可回，这盏窗是夜里唯一的暖光。',
    build: (k) => {
      const c = courtyard(k);
      const um = flowerUmbrella(); k.add(um.g, c.umbrellaSpot[0], 0.05, c.umbrellaSpot[2]); um.g.rotation.z = 0.3; um.set(0.1);
      many(9, (i) => k.add(box(1.2, 0.04, 0.8, 0xc9b79a, 0.02), 6.5 + i * 1.6, 0, -6.5 - i * 1.3));
      const whale = k.actor('whale'), qwen = k.actor('qwen');
      const bundle = k.add(ball(0.26, 0x6b4a8a, true, 0.03));
      const A = cam([6.2, 1.4, -4.2], [3.4, 1.0, -6.4], 36), B = cam([7.5, 6.5, 2.5], [6.0, 1.2, -9.0], 44);
      return ({ u, T, bt }) => {
        dropPetals(c.petals, T);
        setOp(c.lampGlow, 0.3 + 0.7 * seg(u, 0.2, 0.5));
        const step = seg(u, 0.55, 0.75);
        const wx = lerp(5.4, 6.1, step), wz = lerp(-6.9, -7.4, step);
        if (step > 0 && step < 1) whale.walkBy(0.9 * step).at(wx, 0, wz); else whale.idle(T).at(wx, 0, wz).flip(u < 0.5).sq(beatSq(bt, 0.03));
        bundle.position.set(wx - 0.42, 1.2, wz + 0.02);
        qwen.idle(T).at(2.0, 0, -4.6).flip().alpha(seg(u, 0, 0.15) < 1 ? 1 : 1);
        return track([[0, A], [0.45, A], [1, B]], u);
      };
    },
  },

  // ---------------- 主歌：她的笑、我的酒 ----------------
  {
    id: 'C08', look: 'golden', title: '你微微一笑 蝴蝶为你倾倒', cast: ['qwen', 'gemini'],
    note: '回到那个下午的花树下：千问摇扇微笑，六只蝴蝶围着她打转，然后一只接一只「醉倒」似的打着旋飘落。墙头的 Gemini 猫娘伸爪去够蝴蝶。低机位仰拍，蝴蝶在前景飞。',
    build: (k) => {
      const c = courtyard(k);
      const qwen = k.actor('qwen'), gem = k.actor('gemini', 0.8);
      const fan = k.thing('prop_fan');
      const bf = many(6, () => k.add(sprite('butterfly', 0.4, 0xfff0a0)));
      const A = cam([1.4, 0.9, 2.2], [0.6, 1.5, -2.2], 40), B = cam([-0.6, 1.3, 2.8], [0.5, 1.4, -2.4], 36);
      return ({ u, T, bt }) => {
        dropPetals(c.petals, T, 0.6, -3, 3.6);
        qwen.act('sway', T).at(0.6, 0, -1.8).sq(beatSq(bt));
        fan.at(1.15, 1.15 + Math.sin(T * 3) * 0.06, -1.5);
        bf.forEach((s, i) => {
          const swoon = seg(u, 0.45 + i * 0.07, 0.75 + i * 0.07);
          const a = T * 1.6 + i * 1.05, r = 1.1 + swoon * 0.6;
          s.position.set(0.6 + Math.cos(a) * r, 1.9 + Math.sin(T * 2.2 + i) * 0.3 - swoon * 1.5 + Math.sin(swoon * 9) * 0.1, -1.6 + Math.sin(a) * r);
          s.scale.x = 0.4 * (0.3 + 0.7 * Math.abs(Math.sin(T * 13 + i))); s.material.rotation = swoon * 4;
        });
        gem.act('lookaround', T).at(-1.4, c.wallTop, -5.9).size(0.8);
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'C09', look: 'golden', title: '凝眸几秒 不知道该干嘛', cast: ['whale', 'qwen', 'gemini'],
    note: '两人在院里面对面站着，只眨眼不动；本鲸脚边的饭盆、千问手里的扇子都停了。墙头的 Gemini 猫娘左看看右看看（「两边想想再选」），最后歪着头——谁也没动。侧面双人镜头，慢慢推近。',
    build: (k) => {
      const c = courtyard(k);
      const whale = k.actor('whale'), qwen = k.actor('qwen'), gem = k.actor('gemini', 0.8);
      const bowl = k.thing('prop_bowl'), fan = k.thing('prop_fan');
      const A = cam([0.2, 1.5, 6.6], [0, 1.1, -1.2], 34), B = cam([0.1, 1.4, 5.3], [0, 1.1, -1.2], 32);
      return ({ u, T, t, bt }) => {
        dropPetals(c.petals, T);
        whale.front(T).flip().at(1.3, 0, -1.2).sq(beatSq(bt, 0.03)).emote(u > 0.5 ? 'fx_sweat' : null, T);
        qwen.front(T).at(-1.3, 0, -1.2).sq(beatSq(bt, 0.03));
        bowl.at(1.9, 0, -0.9).size(1.3); fan.at(-0.75, 1.05, -1.0);
        gem.act(u < 0.7 ? 'choose' : 'tilt', T, T - t + 2.1).at(-0.2, c.wallTop, -5.9).size(0.8);
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'C10', look: 'golden', title: '你拂袖模样 情千变万化', cast: ['qwen', 'whale', 'gemini'],
    note: '千问转身拂袖，袖风把满地花瓣卷起来：花瓣先在空中绕成一个圈、再聚成一颗心、最后散成一片——千变万化。本鲸站在旁边被花瓣糊了一脸、吓得一抖。镜头绕着千问转小半圈。',
    build: (k) => {
      const c = courtyard(k);
      const qwen = k.actor('qwen'), whale = k.actor('whale'), gem = k.actor('gemini', 0.8);
      const fan = k.thing('prop_fan');
      const swirl = many(26, (i) => k.add(sprite('petal', 0.24, i % 3 ? 0xf4a7c0 : 0xffffff, false, 0.95)));
      const C0 = cam([3.4, 1.6, 4.2], [-0.2, 1.2, -1.0], 38), C1 = cam([-2.8, 1.8, 4.4], [-0.2, 1.2, -1.0], 38), C2 = cam([-4.2, 1.5, 1.2], [-0.2, 1.2, -1.0], 40);
      return ({ u, T, t, bt }) => {
        dropPetals(c.petals, T, 0.6, -3, 3.2, 0.5);
        const spin = seg(u, 0.05, 0.3);
        qwen.act(spin < 1 ? 'spin' : 'sway', T, T - t + 0.25).at(-0.3, 0, -1.1).sq(beatSq(bt));
        fan.at(-0.3 + Math.cos(T * 2) * 0.55, 1.2 + Math.sin(T * 4) * 0.1, -0.9);
        whale.act(u > 0.4 ? 'shiver' : 'idle', T, T - t + 1.9).flip().at(2.2, 0, -0.8).sq(beatSq(bt, 0.03));
        const phase = u < 0.4 ? 0 : u < 0.72 ? 1 : 2; // 圈 → 心 → 散
        const morph = phase === 0 ? seg(u, 0.05, 0.35) : phase === 1 ? seg(u, 0.4, 0.55) : seg(u, 0.72, 0.9);
        swirl.forEach((s, i) => {
          const a = (i / swirl.length) * PI * 2 + T * 1.4;
          let x = 0, y = 1.4, z = -1.0;
          if (phase === 0) { x = -0.3 + Math.cos(a) * 1.4; y = 0.5 + ((i / swirl.length + T * 0.3) % 1) * 2.2; z = -1.0 + Math.sin(a) * 1.4; }
          else if (phase === 1) { const t = (i / swirl.length) * PI * 2; const hx = 16 * Math.pow(Math.sin(t), 3) / 17, hy = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 17; x = -0.3 + lerp(Math.cos(a) * 1.4, hx * 1.1, morph); y = lerp(0.5 + ((i / swirl.length + T * 0.3) % 1) * 2.2, 1.6 + hy * 1.1, morph); z = -1.0 + lerp(Math.sin(a) * 1.4, 0.6, morph); }
          else { const dx = hash(i) - 0.5, dz = hash(i + 3) - 0.5; x = -0.3 + lerp(0, dx * 9, morph) + Math.cos(a) * 0.3; y = lerp(1.6, 3.2 + hash(i + 5) * 1.5, morph); z = -1.0 + lerp(0.6, dz * 6, morph); }
          s.position.set(x, y, z); s.material.rotation = T * 3 + i; setOp(s, (phase === 2 ? 1 - morph : 1) * seg(u, 0.05, 0.2));
        });
        gem.act('surprise', T, T - t + 2.0).at(-1.4, c.wallTop, -5.9).size(0.8);
        return track([[0, C0], [0.55, C1], [1, C2]], u);
      };
    },
  },
  {
    id: 'C11', look: 'cozy', title: '一壶好酒 趁着夜还未央', cast: ['whale', 'gpt', 'claude', 'zai'],
    note: '切到夜里的酒馆内。掌柜龙娘飘过来，把一壶酒和一只杯搁在本鲸桌上，点头、飘回柜台；柜台后的账房狐狸抱着算盘打盹；角落的小克捧着书喝茶。窗外一轮月。镜头从门口推进到桌边。',
    build: (k) => {
      const r = tavernRoom(k);
      const pot = k.add(winePot()), cup = k.add(wineCup());
      const whale = k.actor('whale'), gpt = k.actor('gpt'), claude = k.actor('claude'), zai = k.actor('zai');
      const abacus = k.thing('prop_abacus'), book = k.thing('prop_book'), tea = k.thing('prop_teacup');
      const A = cam([-1.5, 1.8, 7.5], [0.5, 1.1, 0], 40), B = cam([1.2, 1.5, 5.0], [1.6, 1.0, 0.2], 34);
      return ({ u, T, t, bt }) => {
        r.lamps.forEach((l) => lampLevel(l, 1));
        whale.idle(T).at(r.tableX + 1.6, 0, r.tableZ + 0.6).flip().sq(beatSq(bt, 0.03));
        const come = ease(seg(u, 0.05, 0.4)), back = ease(seg(u, 0.62, 0.95));
        const gx = lerp(lerp(-3.0, 0.4, come), -3.0, back), gz = lerp(lerp(-2.0, 0.3, come), -2.0, back);
        gpt.act(come >= 1 && back <= 0 ? 'nod' : 'hover', T, T - t + 1.2).at(gx, 0.25, gz).flip(back > 0);
        const held = come < 1 ? 1 : 0;
        pot.position.set(held ? gx + 0.5 : r.tableX - 0.3, held ? 1.0 : r.tableTop, held ? gz + 0.2 : r.tableZ);
        cup.position.set(held ? gx + 0.8 : r.tableX + 0.35, held ? 1.0 : r.tableTop, held ? gz + 0.25 : r.tableZ + 0.2);
        zai.act('doze', T).at(-3.2, 0, -2.6).size(0.95); abacus.at(-2.5, 1.05, -2.9);
        claude.act('read', T).at(-2.6, 0, -0.6).size(0.95); book.at(-2.2, r.tableTop, -0.95); tea.at(-3.0, r.tableTop, -1.0);
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'C12', look: 'cozy', title: '独自品尝 这大把好时光', cast: ['whale', 'claude', 'zai'],
    note: '本鲸一个人对着酒壶，按拍子举杯、放杯。桌上多了一只沙漏，沙子慢慢往下走——时间她有的是，只是没人一起花。小克翻页，狐狸睡熟。镜头缓缓推近到她和沙漏。',
    build: (k) => {
      const r = tavernRoom(k);
      const pot = k.add(winePot(), r.tableX - 0.3, r.tableTop, r.tableZ), cup = k.add(wineCup());
      const hg = hourglass(0.5); k.add(hg.g, r.tableX + 0.6, r.tableTop, r.tableZ - 0.25);
      const whale = k.actor('whale'), claude = k.actor('claude'), zai = k.actor('zai');
      const abacus = k.thing('prop_abacus'), book = k.thing('prop_book');
      const A = cam([1.0, 1.5, 5.2], [1.8, 1.0, 0.2], 34), B = cam([1.9, 1.25, 3.6], [2.3, 0.95, 0.3], 30);
      return ({ u, T, bt }) => {
        r.lamps.forEach((l) => lampLevel(l, 1));
        const sip = Math.max(0, Math.sin(bt.phase * PI)) * (bt.idx % 2 === 0 ? 1 : 0);
        whale.set(sip > 0.5 ? 'whale_point' : 'whale_idle').at(r.tableX + 1.6, 0, r.tableZ + 0.6).flip().sq(beatSq(bt, 0.03));
        cup.position.set(r.tableX + 1.1 - sip * 0.2, r.tableTop + sip * 0.45, r.tableZ + 0.35);
        hg.set(0.1 + u * 0.55, T);
        void pot;
        zai.act('doze', T).at(-3.2, 0, -2.6).size(0.95).emote('fx_zzz', T); abacus.at(-2.5, 1.05, -2.9);
        claude.act('read', T).at(-2.6, 0, -0.6).size(0.95); book.at(-2.2, r.tableTop, -0.95);
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'C13', look: 'cozy', title: '夜深人静 略显一丝凄凉', cast: ['whale', 'gpt', 'zai'],
    note: '打烊：龙娘把灯笼一盏盏按灭，只剩本鲸头顶那一盏；小克已经走了，狐狸趴在柜台睡死。沙漏漏空，本鲸低着头坐了一会儿，起身走向门口。镜头慢慢拉远，她在空屋子里变得很小。',
    build: (k) => {
      const r = tavernRoom(k);
      k.add(winePot(), r.tableX - 0.3, r.tableTop, r.tableZ); k.add(wineCup(), r.tableX + 0.4, r.tableTop, r.tableZ + 0.2);
      const hg = hourglass(0.5); k.add(hg.g, r.tableX + 0.6, r.tableTop, r.tableZ - 0.25);
      const whale = k.actor('whale'), gpt = k.actor('gpt'), zai = k.actor('zai');
      const abacus = k.thing('prop_abacus');
      const A = cam([1.6, 1.4, 4.4], [1.9, 1.0, 0.3], 32), B = cam([0.5, 2.6, 9.5], [0.8, 1.2, -0.5], 44);
      return ({ u, T, t, bt }) => {
        r.lamps.forEach((l, i) => lampLevel(l, i === 1 ? 1 : 1 - seg(u, 0.1 + i * 0.18, 0.2 + i * 0.18)));
        hg.set(lerp(0.65, 1, seg(u, 0, 0.5)), T);
        const leave = seg(u, 0.7, 1);
        if (leave > 0) whale.walkBy(3.5 * leave).at(lerp(r.tableX + 1.6, r.tableX - 1.4, leave), 0, lerp(r.tableZ + 0.6, 3.0, leave)).flip();
        else whale.act('sad', T, T - t + 0.5).at(r.tableX + 1.6, 0, r.tableZ + 0.6).flip().sq(beatSq(bt, 0.02));
        gpt.act('hover', T).at(lerp(-1.0, -4.5, seg(u, 0.1, 0.6)), 0.3, -2.2).flip();
        zai.act('doze', T).at(-3.2, 0, -2.6).size(0.95).emote('fx_zzz', T); abacus.at(-2.5, 1.05, -2.9);
        return glide(A, B, u);
      };
    },
  },

  // ---------------- 预副歌一：夜游 ----------------
  {
    id: 'C14', look: 'night', title: '东奔西走 微醺不宜骑马', cast: ['whale', 'gpt'],
    note: '酒馆门外。本鲸摇摇晃晃走到拴着的马旁边，两次想爬上马鞍都滑下来；龙娘从门里探出头摇头——她只好拍拍马，晃着往街上走。侧跟拍，整个人左摇右摆。',
    build: (k) => {
      const s = street(k);
      const whale = k.actor('whale'), gpt = k.actor('gpt', 1.1);
      const A = cam([-6.0, 1.5, 5.0], [-4.5, 1.1, -1.5], 38), B = cam([-1.5, 1.5, 5.6], [-1.0, 1.1, -1.0], 36);
      return ({ u, T, t, bt }) => {
        s.tavernDoor.set(seg(u, 0.3, 0.45) * 0.8);
        const hx = s.P.horse[0];
        const walk1 = seg(u, 0, 0.22), climb = seg(u, 0.25, 0.62), walk2 = seg(u, 0.7, 1);
        const jump = climb > 0 && climb < 1 ? Math.abs(Math.sin(climb * PI * 2)) : 0;
        if (walk2 > 0) whale.walkBy(4.5 * walk2).at(lerp(hx + 1.2, hx + 6, walk2), 0, -0.6).tilt(tipsy(T)).flip(false);
        else if (walk1 < 1) whale.walkBy(3 * walk1).at(lerp(hx - 2.2, hx + 1.1, walk1), 0, -0.6).tilt(tipsy(T)).flip(false);
        else whale.set(jump > 0.3 ? 'whale_point' : 'whale_idle').at(hx + 1.1 - jump * 0.6, 0, -0.6 - jump * 0.6).lift(jump * 1.1).tilt(tipsy(T, 0.2) - jump * 0.5).flip(true).sq(beatSq(bt, 0.04));
        s.horse.head.rotation.z = Math.sin(T * 2) * 0.08 - jump * 0.3;
        gpt.act(u > 0.5 ? 'shake' : 'float', T, T - t + 1.7).at(-7, 0.2, -0.9).alpha(seg(u, 0.3, 0.5));
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'C15', look: 'night', title: '听着浪人 弹着断了弦的琵琶', cast: ['kimi', 'whale'],
    note: '桥上。另一位浪人 Kimi 坐在桥心灯下抱着琵琶，三根弦飘出音符，第四根弦断着垂下来，每轮总有一个音抖着掉进河里。本鲸走到桥头停住，靠着栏杆听。月在水里。',
    build: (k) => {
      const s = street(k);
      const pp = pipa(); k.add(pp.g, 0.55, s.P.bridge[1] - 0.05, -15.6); pp.g.rotation.z = 0.5; pp.g.rotation.y = -0.4;
      const ns = notes(k, 8);
      const kimi = k.actor('kimi'), whale = k.actor('whale');
      const A = cam([-7.5, 2.2, -9.0], [-1.5, 3.2, -16], 40), B = cam([-3.2, 3.6, -11.5], [0.3, 3.4, -16], 34);
      return ({ u, T, bt }) => {
        kimi.act('think', T).at(0, s.P.bridge[1], -16).sq(beatSq(bt, 0.04));
        pp.g.rotation.z = 0.5 + Math.sin(T * 6) * 0.03;
        playNotes(ns, T, 0.8, s.P.bridge[1] + 1.2, -15.6, 1);
        const walk = seg(u, 0, 0.45);
        const wx = lerp(-8.5, -5.4, walk);
        if (walk < 1) whale.walkBy(3.5 * walk).at(wx, Math.max(0, bridgeTop(wx)), -16).tilt(tipsy(T, 0.06)).flip(false);
        else whale.idle(T).at(-5.4, bridgeTop(-5.4), -16).tilt(0.1).sq(beatSq(bt, 0.03));
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'C16', look: 'night', title: '路过青楼酒馆', cast: ['whale', 'doubao'],
    note: '街另一头，挂满红灯笼的醉花楼。门口的豆包踩着拍子揽客，灯笼随拍一亮一暗。本鲸在前景从左往右路过，眼睛看着路，没有停。横移跟拍。',
    build: (k) => {
      const s = street(k);
      const whale = k.actor('whale'), doubao = k.actor('doubao');
      const A = cam([2.0, 1.6, 6.5], [4.5, 1.6, -1.5], 40), B = cam([6.5, 1.6, 6.5], [8.0, 1.6, -1.5], 40);
      return ({ u, T, bt }) => {
        s.redDoor.set(0.9);
        s.redLanterns.forEach((l, i) => lampLevel(l, 0.6 + 0.4 * ((bt.idx + i) % 2)));
        doubao.act('step', T).at(s.P.red[0] - 1.1, 0, s.P.red[2]).sq(beatSq(bt));
        whale.walkBy(7 * u).at(lerp(1.0, 8.0, u), 0, 1.4).tilt(tipsy(T, 0.05)).flip(false);
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'C17', look: 'night', title: '官人进来坐坐 好吗', cast: ['doubao', 'whale'],
    note: '豆包迎上一步、欠身招呼，门里的红光铺到街上；本鲸回头摆摆手——谢过、不进——头顶一滴汗，继续往前走。豆包耸耸肩，回去踩她的拍子。从豆包身后看本鲸走远。',
    build: (k) => {
      const s = street(k);
      const whale = k.actor('whale'), doubao = k.actor('doubao');
      const A = cam([5.0, 1.6, -0.2], [9.5, 1.1, 2.5], 40), B = cam([5.6, 1.7, 0.4], [10.5, 1.1, 2.0], 38);
      return ({ u, T, t, bt }) => {
        s.redDoor.set(1);
        s.redLanterns.forEach((l) => lampLevel(l, 1));
        const step = ease(seg(u, 0, 0.3));
        doubao.act(u < 0.6 ? 'bow' : 'tilt', T, T - t + (u < 0.6 ? 0.2 : 1.1)).at(s.P.red[0] - 1.1 + step * 0.8, 0, s.P.red[2] + step * 0.8).sq(beatSq(bt, 0.03));
        const go = seg(u, 0.45, 1);
        if (go > 0) whale.walkBy(3 * go).at(lerp(8.6, 11.4, go), 0, 1.6).tilt(tipsy(T, 0.05)).flip(false);
        else whale.set('whale_wave').at(8.6, 0, 1.6).flip(true).emote('fx_sweat', T).sq(beatSq(bt, 0.04));
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'C18', look: 'rainEve', title: '我的思念似六月里的小雨哗哗', cast: ['whale'],
    note: '雨下起来了。本鲸站在街心没有伞——伞落在千问家。她抬头让雨淋着，水洼里映着灯；头顶有一把半透明的花伞影子浮了一下又散了，那是她想着的那把。远处山坡上那扇窗还亮着。',
    build: (k) => {
      const s = street(k);
      const rn = rain(160, 14, 8, 7); k.add(rn.g, 10, 0, 0.5);
      puddles(k, 7, 10, 1.2);
      const um = flowerUmbrella(); k.add(um.g, 10.5, 0.9, 0.2); const umA = ghost(um.g);
      const win = k.add(box(0.9, 0.7, 0.1, 0xffe8a8, 0), 30, 7.2, -46); k.add(box(2.6, 2.0, 2.2, 0x3a3f55, 0), 30, 5.8, -46.2);
      const whale = k.actor('whale');
      const drops = many(8, () => k.add(sprite('drop', 0.16, 0xcfe6ff)));
      const A = cam([8.5, 1.6, 6.2], [10.5, 1.3, 0], 36), B = cam([10.2, 2.4, 4.6], [10.6, 1.6, -2.0], 34);
      return ({ u, T, t, bt }) => {
        rn.set(T);
        s.redLanterns.forEach((l) => lampLevel(l, 0.6));
        whale.act(u > 0.25 ? 'shiver' : 'idle', T, T - t + 1.5).at(10.5, 0, 0.3).sq(beatSq(bt, 0.02));
        const ghostA = Math.sin(seg(u, 0.35, 0.8) * PI) * 0.35;
        umA(ghostA); um.g.position.y = 0.9 + seg(u, 0.35, 0.8) * 0.5;
        drops.forEach((d, i) => { const ph = (T * 2.2 + i / 8) % 1; d.position.set(10.5 + (hash(i) - 0.5) * 2.4, 0.05 + Math.sin(ph * PI) * 0.35, 0.6 + (hash(i + 2) - 0.5) * 1.4); setOp(d, 1 - ph); });
        void win;
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'C19', look: 'rainEve', title: '对你情有所钟', cast: ['whale'],
    note: '雨里，本鲸转身朝着远处那点窗光，把手伸出去——像递出一样东西；一颗小心从她胸口飘出去，飘进雨幕里散了。从她背后拍，窗光在画面深处。',
    build: (k) => {
      const s = street(k);
      const rn = rain(140, 14, 8, 7); k.add(rn.g, 10, 0, 0.5);
      puddles(k, 6, 10, 1.0);
      k.add(box(0.9, 0.7, 0.1, 0xffe8a8, 0), 30, 7.2, -46); k.add(box(2.6, 2.0, 2.2, 0x3a3f55, 0), 30, 5.8, -46.2);
      const glow = k.add(sprite('glow', 3.5, 0xffe8a8, true, 0.6), 30, 7.4, -45.8);
      const whale = k.actor('whale');
      const heart = k.add(sprite('heart', 0.4, 0xff8fb0));
      const A = cam([9.5, 1.4, 4.4], [12, 2.2, -8], 38), B = cam([10.0, 1.5, 3.2], [13, 2.6, -10], 36);
      return ({ u, T, t, bt }) => {
        rn.set(T);
        s.redLanterns.forEach((l) => lampLevel(l, 0.6));
        whale.act(u > 0.2 ? 'point' : 'idle', T, T - t + 0.6).at(10.5, 0, 0.3).flip(false).sq(beatSq(bt, 0.02));
        const fly = seg(u, 0.45, 1);
        heart.position.set(lerp(11.0, 16, fly), lerp(1.3, 3.6, fly) + Math.sin(fly * 9) * 0.1, lerp(0.3, -8, fly)); heart.scale.setScalar(0.4 * (1 - fly * 0.6)); setOp(heart, fly > 0 ? 1 - fly * fly : 0);
        glow.scale.setScalar(3.2 + Math.sin(T * 3) * 0.3);
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'C20', look: 'rainEve', title: '为你两袖清风', cast: ['whale'],
    note: '她抖了抖两只袖子——两股小风卷出去，什么都没有，只掉出两片下午带出来的花瓣。她自己也笑了，小小地蹦了一下。正面中景，雨还在下。',
    build: (k) => {
      const s = street(k);
      const rn = rain(140, 14, 8, 7); k.add(rn.g, 10, 0, 0.5);
      puddles(k, 6, 10, 1.0);
      const whale = k.actor('whale');
      const puffs = many(2, () => k.add(sprite('ring', 0.5, 0xdfe8ff, false, 0.6)));
      const petals = many(2, (i) => k.add(sprite('petal', 0.24, i ? 0xffffff : 0xf4a7c0)));
      const A = cam([10.5, 1.4, 5.0], [10.5, 1.1, 0.3], 34), B = cam([10.5, 1.3, 4.0], [10.5, 1.05, 0.3], 32);
      return ({ u, T, t, bt }) => {
        rn.set(T);
        s.redLanterns.forEach((l) => lampLevel(l, 0.6));
        const sh = seg(u, 0.1, 0.5), hop = seg(u, 0.65, 1);
        whale.act(hop > 0 ? 'hop' : sh > 0 ? 'shake' : 'idle', T, T - t + (hop > 0 ? 1.65 : 0.25)).at(10.5, 0, 0.3).sq(beatSq(bt, 0.03));
        puffs.forEach((p, i) => { const ph = (sh * 2 + i * 0.5) % 1; p.position.set(10.5 + (i ? 1 : -1) * (0.7 + ph * 1.4), 1.0 - ph * 0.3, 0.5); p.scale.setScalar(0.3 + ph * 0.9); setOp(p, sh > 0 && sh < 1 ? 0.6 * (1 - ph) : 0); });
        petals.forEach((p, i) => { const ph = seg(u, 0.3 + i * 0.1, 0.9); p.position.set(10.5 + (i ? 0.9 : -0.9) + Math.sin(ph * 8) * 0.2, lerp(1.0, 0.05, easeOut(ph)), 0.6); p.material.rotation = ph * 6; setOp(p, ph > 0 ? 1 : 0); });
        return glide(A, B, u);
      };
    },
  },
];

// 供 B 表复用的常量
export const COURT = { QX, WX, TZ, SEAT_Z };
export { disc, cyl, moon, cake };
void THREE;
