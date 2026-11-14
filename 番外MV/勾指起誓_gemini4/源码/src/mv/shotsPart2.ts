import * as THREE from 'three';
import { cam, glide, track, type Kit, type ShotDef } from '../engine/core';
import {
  box, cloud, disc, ease, flower, house, lantern, lerp, paperBoat, pine,
  ribbon, seg, setOp, sprite, toon, tree,
} from '../engine/kit';
import { buildTown, hill, straightRiver, useTown, type Town } from '../engine/sets';
import { hourglass, paperStack, rain, room, sheet, table, umbrella, windowPane, writeLine } from '../engine/props';
import { floatingIsland, fullMoon, goldenRing, goldenThread, lighthouse } from './customProps';

const getTown = (k: Kit) => k.shared<Town>('town', buildTown);

function makeParticles(
  k: Kit,
  kind: 'star' | 'heart' | 'petal' | 'note' | 'glow' | 'bubble' | 'leaf',
  n: number,
  color: number,
  spread: [number, number, number],
  center: [number, number, number] = [0, 2, 0],
  size = 0.35,
  additive = false,
) {
  const arr: { sp: THREE.Sprite; x: number; y: number; z: number; ph: number; spd: number; s: number }[] = [];
  for (let i = 0; i < n; i++) {
    const s = size * (0.65 + k.rnd() * 0.75);
    const sp = sprite(kind, s, color, additive, 0.9);
    const x = center[0] + (k.rnd() - 0.5) * spread[0];
    const y = center[1] + (k.rnd() - 0.5) * spread[1];
    const z = center[2] + (k.rnd() - 0.5) * spread[2];
    sp.position.set(x, y, z);
    k.root.add(sp);
    arr.push({ sp, x, y, z, ph: k.rnd() * 6.28, spd: 0.4 + k.rnd() * 0.7, s });
  }
  return arr;
}

export const SHOTS_PART2: ShotDef[] = [
  // ── 间奏一 N1–N4 ────────────────────────────────────────────────────────
  {
    id: 'N1',
    look: 'day',
    title: '间奏·豆包踩拍暖场',
    note: '遵照人物设定，间奏由豆包先踩拍把场子热起来！红舞鞋与音符随 85 BPM 鼓点跳动。',
    cast: ['doubao', 'whale'],
    build: (k) => {
      k.add(disc(55, 0x80ca72, 0));
      k.add(house(3.8, 3.0, 3.2, 0xfff0d9, 0xe86b6b), -5.2, 0, -4.5, 0.25);
      k.add(house(3.5, 2.8, 3.0, 0xffe4e6, 0x5d8ce6), 5.4, 0, -4.2, -0.25);
      for (let i = 0; i < 12; i++) k.add(flower(i % 2 ? 0xffd166 : 0xff7aa2, 0.52), -5.5 + i, 0, -1.8);

      const doubao = k.actor('doubao', 1.12);
      const whale = k.actor('whale', 0.98);
      const shoes = k.thing('prop_redshoes', 0.92);
      const notes = makeParticles(k, 'note', 18, 0x74d8ff, [10, 4.5, 5], [0, 2.6, 0], 0.36);

      const A = cam([-2.4, 2.2, 8.0], [0, 1.3, 0], 38);
      const B = cam([2.4, 2.0, 7.0], [0, 1.35, 0], 35);
      return ({ u, T, bt }) => {
        const dx = Math.sin(T * 2.6) * 1.1;
        doubao.act(bt.idx % 4 < 2 ? 'step' : 'sway', T).at(dx, 0, 0.7).lift(bt.pulse * 0.16).sq(bt.pulse * 0.08).emote('fx_sparkle', T);
        shoes.at(dx + 0.92, 0.1 + bt.pulse * 0.14, 1.0);
        whale.act('hop', T).at(-2.7, 0, 0.4).lift(bt.pulse * 0.1);

        notes.forEach((p) => {
          p.sp.position.set(p.x + Math.sin(T * 2.4 + p.ph) * 0.45, 0.8 + ((p.y + T * 1.1) % 4.0), p.z);
          p.sp.scale.setScalar(p.s * (0.85 + 0.35 * bt.pulse));
        });
        return glide(A, B, u);
      };
    },
  },

  {
    id: 'N2',
    look: 'golden',
    title: '间奏·茶会与小闹剧',
    note: '千问挥扇主持茶会，猫猫 Gemini 用香蕉画笔挥洒彩星，角落打盹的狐狸智谱突然竖耳惊醒对账！',
    cast: ['qwen', 'gemini', 'zai'],
    build: (k) => {
      k.add(disc(55, 0x8bc674, 0));
      k.add(table(3.6, 1.4, 0.8, 0xb87e4b), 0, 0, -0.2);
      k.add(tree(4.4, 0x5ebd60, 3), -5.2, 0, -3.5);
      k.add(tree(4.2, 0x72cc66, 5), 5.5, 0, -3.5);
      for (let i = -2; i <= 2; i++) k.add(lantern(0xffd266, 0.18), i * 2.1, 3.0, -1.6);

      const qwen = k.actor('qwen', 1.04);
      const gemini = k.actor('gemini', 1.04);
      const zai = k.actor('zai', 1.02);
      const fan = k.thing('prop_fan', 0.86);
      const teacup = k.thing('prop_teacup', 0.8);
      const brush = k.thing('prop_brush', 0.88);
      const abacus = k.thing('prop_abacus', 0.85);
      const stars = makeParticles(k, 'star', 16, 0xffd166, [9, 4, 4], [0, 2.4, 0], 0.3, true);

      const A = cam([-2.0, 2.3, 8.2], [0, 1.35, 0], 38);
      const B = cam([2.0, 2.1, 7.2], [0.2, 1.35, 0], 35);
      return ({ u, T, bt }) => {
        qwen.act('spin', T).at(-2.2, 0, 0.6).lift(bt.pulse * 0.08);
        fan.at(-1.55, 0.9, 0.85);
        teacup.at(-0.6, 0.84, -0.1);

        gemini.act('sway', T).at(0.15, 0, 0.85).lift(bt.pulse * 0.1).emote('fx_sparkle', T);
        brush.at(0.82, 0.78 + Math.sin(T * 6) * 0.08, 1.1);

        const awake = u > 0.52;
        zai.act(awake ? 'alert' : 'doze', T, awake ? 75.6 : 0).at(2.55, 0, 0.55).flip().emote(awake ? 'fx_exclaim' : 'fx_zzz', T);
        abacus.at(1.75, 0.84, -0.1);

        stars.forEach((p) => {
          p.sp.scale.setScalar(p.s * (0.7 + 0.45 * bt.pulse));
        });
        return glide(A, B, u);
      };
    },
  },

  {
    id: 'N3',
    look: 'day',
    title: '间奏·八人河畔巡游',
    note: '分支全部八位像素角色齐聚童话镇阳光广场与七彩河畔，载歌载舞跟随节拍巡游，纸船顺流漂过。',
    cast: ['whale', 'claude', 'doubao', 'gemini', 'kimi', 'qwen', 'zai', 'gpt'],
    build: (k) => {
      const town = getTown(k);
      const boats = [paperBoat(), paperBoat(), paperBoat()];
      boats.forEach((b, i) => k.add(b, 26 + i * 5.5, 0.12, town.zAt(26 + i * 5.5), 0.2, 1.0));

      const whale = k.actor('whale', 0.98);
      const claude = k.actor('claude', 0.98);
      const doubao = k.actor('doubao', 0.98);
      const gemini = k.actor('gemini', 0.98);
      const kimi = k.actor('kimi', 0.98);
      const qwen = k.actor('qwen', 0.98);
      const zai = k.actor('zai', 0.98);
      const gpt = k.actor('gpt', 1.16);

      const A = cam([26.5, 3.8, 28.5], [33, 1.6, 15.5], 42);
      const B = cam([39.5, 3.4, 27.2], [33, 1.6, 15.5], 38);
      return ({ u, T, bt }) => {
        useTown(k, town, 1.0, false);
        const shift = lerp(-3.0, 3.0, ease(u));
        const row: [typeof whale, number][] = [
          [whale, -4.2], [claude, -2.8], [doubao, -1.4], [gemini, 0], [kimi, 1.4], [qwen, 2.8], [zai, 4.2],
        ];
        row.forEach(([a, bx], i) => {
          const x = 33 + bx + shift * 0.7;
          a.walkBy(Math.abs(shift * 0.7) + i * 0.25).at(x, 0.05, 16.5 + (i % 2) * 0.65).lift(bt.pulse * 0.12);
        });
        gpt.act('hover', T).at(33 + lerp(-5.5, 5.5, u), 4.8 + Math.sin(T * 3) * 0.25, 13.0).noShadow();
        boats.forEach((b, i) => {
          const bx = 22 + ((i * 7.5 + T * 1.4) % 24);
          b.position.set(bx, 0.12, town.zAt(bx));
          b.rotation.z = Math.sin(T * 2.5 + i) * 0.08;
        });
        return glide(A, B, u);
      };
    },
  },

  {
    id: 'N4',
    look: 'dusk',
    title: '间奏·整装待发',
    note: '暮色小港前，本鲸提上行囊谷时篮，小克递上地图，猫猫挥笔指向远方万水千山，闪白切入第二段。',
    cast: ['whale', 'claude', 'gemini'],
    fx: { flash: [0.97] },
    build: (k) => {
      k.add(disc(65, 0x62a062, 0));
      k.add(hill(20, 6.5, 0x52698c), -16, -1, -22);
      k.add(hill(24, 8.2, 0x455a7d), 15, -1, -24);
      k.add(pine(4.2, 0x2f6c52), -5.5, 0, -3.5);
      k.add(pine(3.8, 0x2f6c52), 5.8, 0, -3.8);

      const whale = k.actor('whale', 1.05);
      const claude = k.actor('claude', 1.02);
      const gemini = k.actor('gemini', 1.02);
      const basket = k.thing('prop_basket', 0.9);
      const brush = k.thing('prop_brush', 0.88);
      const bookP = k.thing('prop_book', 0.86);

      const A = cam([0, 2.4, 8.4], [0, 1.5, -1], 38);
      const B = cam([0.4, 2.0, 5.8], [0, 1.5, -1], 33);
      return ({ u, T, bt }) => {
        whale.act(u < 0.6 ? 'nod' : 'hop', T, u < 0.6 ? 84.2 : 87.2).at(0, 0, 0.7).emote('fx_sparkle', T).lift(bt.pulse * 0.08);
        basket.at(-0.78, 0.45, 0.92);
        claude.act('idle', T).at(-2.0, 0, 0.3);
        bookP.at(-1.35, 0.6, 0.55);
        gemini.act('choose', T).at(2.1, 0, 0.35).flip();
        brush.at(1.48, 0.72, 0.6);
        return glide(A, B, u);
      };
    },
  },

  // ── 主歌二 L17–L24 ──────────────────────────────────────────────────────
  {
    id: 'L17',
    look: 'savanna',
    title: '你是我万水千山的冒险',
    note: '层峦叠嶂与溪谷铺展眼前，本鲸与猫猫 Gemini 翻山越岭向前奔行，白龙娘在山巅高空同行。',
    cast: ['whale', 'gemini', 'gpt'],
    build: (k) => {
      k.add(disc(80, 0x86ba68, -0.1));
      k.add(straightRiver(70, 6.2, 0.25, -4.5, 0.06, 0x3ba8e0, 0x1e69b5).mesh);
      k.add(hill(14, 6.2, 0x67a354), -12, -1, -12);
      k.add(hill(18, 8.8, 0x558a4f), 2, -1, -18);
      k.add(hill(16, 7.2, 0x619953), 15, -1, -13);
      for (let i = 0; i < 8; i++) k.add(pine(3.0 + (i % 3) * 0.7, 0x3b7a4b), -9 + i * 2.6, 0, -8.5 - (i % 2) * 2);
      k.add(cloud(12, 1.5), -6, 7.5, -14);
      k.add(cloud(19, 1.7), 8, 8.2, -16);

      const whale = k.actor('whale', 1.04);
      const gemini = k.actor('gemini', 1.0);
      const gpt = k.actor('gpt', 1.15);
      const brush = k.thing('prop_brush', 0.85);

      const A = cam([-5.2, 2.8, 9.2], [-1.5, 1.8, -1], 40);
      const B = cam([3.6, 3.2, 8.4], [1.6, 1.9, -1], 38);
      return ({ u, T, bt }) => {
        const wx = lerp(-4.5, 1.8, ease(u));
        whale.walkBy(Math.abs(wx + 4.5)).at(wx, 0, 0.8).sq(bt.pulse * 0.06);
        const gx = wx + 1.9;
        gemini.walkBy(Math.abs(wx + 4.5) + 0.4).at(gx, 0, 0.35).lift(bt.pulse * 0.08);
        brush.at(gx + 0.65, 0.68, 0.6);
        gpt.act('hover', T).at(lerp(-4, 5, u), 5.2 + Math.sin(T * 3) * 0.3, -6.5).noShadow();
        return glide(A, B, u);
      };
    },
  },

  {
    id: 'L18',
    look: 'dusk',
    title: '要找的标记点',
    note: '远岸灯塔亮起金色坐标光柱，纠结两难的猫猫 Gemini 终于果断选定方向，灯塔下正是守候的小克！',
    cast: ['gemini', 'claude', 'whale'],
    build: (k) => {
      k.add(disc(70, 0x3b5878, -0.1));
      k.add(straightRiver(70, 26, 0.12, -9, 0.05, 0x2b5a8a, 0x173154).mesh);
      const lh = lighthouse(7.2);
      k.add(lh.g, 2.6, 0, -3.5);
      const markerRing = sprite('ring', 3.4, 0xffe478, true, 0.85);
      markerRing.position.set(2.6, 7.2, -3.5);
      k.root.add(markerRing);

      const whale = k.actor('whale', 1.0);
      const gemini = k.actor('gemini', 1.02);
      const claude = k.actor('claude', 1.02);

      const A = cam([-3.5, 2.4, 8.6], [0.6, 2.2, -1], 40);
      const B = cam([0.4, 2.6, 7.0], [1.4, 2.3, -2], 35);
      return ({ u, T, bt }) => {
        lh.beam.rotation.y = Math.sin(T * 1.4) * 0.55;
        markerRing.scale.setScalar(2.4 + ((T * 1.2) % 1) * 3.0);
        setOp(markerRing, 1 - ((T * 1.2) % 1));

        gemini.act('choose', T).at(-2.2, 0, 1.4).emote('fx_bulb', T);
        whale.act('point', T).at(-0.6, 0, 1.6).lift(bt.pulse * 0.08);
        claude.act('idle', T).at(2.6, 0, -1.5).flip().emote('fx_shine', T);
        return glide(A, B, u);
      };
    },
  },

  {
    id: 'L19',
    look: 'magic',
    title: '你是我分割人生的线',
    note: '画面被一条发光金线劈成冷蓝旧夜与暖金新晨，狐狸智谱睁眼醒来扶起算盘站在分界线上，本鲸望向另一端。',
    cast: ['whale', 'zai', 'claude'],
    build: (k) => {
      // 左侧冷蓝地面，右侧暖金地面
      k.add(box(24, 0.1, 24, 0x263563, 0), -12, -0.05, 0);
      k.add(box(24, 0.1, 24, 0xf2c57c, 0), 12, -0.05, 0);
      // 中央金色分界线
      const seam = box(0.24, 0.16, 28, 0xffe47a, 0.01);
      k.add(seam, 0, 0.02, 0);
      for (let i = -5; i <= 5; i++) k.add(sprite('glow', 1.2, 0xffe88c, true, 0.7), 0, 0.3, i * 1.6);

      const whale = k.actor('whale', 1.04);
      const zai = k.actor('zai', 1.04);
      const claude = k.actor('claude', 1.04);
      const abacus = k.thing('prop_abacus', 0.88);
      const eyemask = k.thing('prop_eyemask', 0.82);

      const A = cam([0, 4.8, 9.6], [0, 1.2, -1], 40);
      const B = cam([0, 2.3, 7.6], [0, 1.4, 0], 35);
      return ({ u, T, bt }) => {
        whale.act('idle', T).at(-2.8, 0.05, 0.7).sq(bt.pulse * 0.04);
        zai.act('alert', T, 95.4).at(0, 0.1, -0.6).emote('fx_exclaim', T);
        abacus.at(-0.72, 0.65, -0.35);
        eyemask.at(0.72, 0.65, -0.35);
        claude.act('idle', T).at(2.8, 0.05, 0.7).flip().emote('fx_shine', T);
        return glide(A, B, u);
      };
    },
  },

  {
    id: 'L20',
    look: 'golden',
    title: '又将它们相连',
    note: '中央那条分界金线腾空弯成绚烂光桥，将过去与未来缝合相连，本鲸跨步踏入暖金一侧与小克相逢！',
    cast: ['whale', 'claude'],
    build: (k) => {
      k.add(box(24, 0.1, 24, 0x4b6399, 0), -12, -0.05, 0);
      k.add(box(24, 0.1, 24, 0xfae09b, 0), 12, -0.05, 0);
      const archCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-4.2, 0.1, 0.5),
        new THREE.Vector3(-1.8, 1.6, 0.5),
        new THREE.Vector3(0, 2.2, 0.5),
        new THREE.Vector3(1.8, 1.6, 0.5),
        new THREE.Vector3(4.2, 0.1, 0.5),
      ]);
      const goldBridge = ribbon(archCurve, 1.8, 28, toon(0xffd25a), 0.02);
      k.add(goldBridge);

      const whale = k.actor('whale', 1.06);
      const claude = k.actor('claude', 1.06);
      const thread = goldenThread(9);
      k.root.add(thread.g);
      const stars = makeParticles(k, 'star', 20, 0xffe885, [10, 4, 4], [0, 2.4, 0], 0.34, true);

      const A = cam([-1.5, 2.6, 8.2], [0, 1.6, 0.4], 38);
      const B = cam([0.6, 2.2, 6.4], [0.2, 1.8, 0.4], 34);
      return ({ u, T, bt }) => {
        const wx = lerp(-2.8, -0.85, ease(u));
        const wy = Math.sin(seg(wx, -4.2, 4.2) * Math.PI) * 1.95;
        whale.walkBy(Math.abs(wx + 2.8)).at(wx, wy, 0.6).sq(bt.pulse * 0.05);

        const cx = 1.1;
        const cy = Math.sin(seg(cx, -4.2, 4.2) * Math.PI) * 1.95;
        claude.act('nod', T, 99.0).at(cx, cy, 0.6).flip().emote('fx_sparkle', T);
        thread.set(wx + 0.35, wy + 0.85, 0.72, cx - 0.35, cy + 0.85, 0.72, T, ease(u));

        stars.forEach((p) => {
          p.sp.scale.setScalar(p.s * (0.75 + 0.45 * bt.pulse));
        });
        return glide(A, B, u);
      };
    },
  },

  {
    id: 'L21',
    look: 'night',
    title: '你是前世千次的回眸',
    note: 'Kimi 的月光书库回廊中，无数漂浮的旧句画卷缓缓旋转，本鲸在银色月轮下回首望见小克。',
    cast: ['whale', 'claude', 'kimi'],
    build: (k) => {
      k.add(disc(60, 0x1b2040, 0));
      k.add(fullMoon(3.0), 0, 4.8, -14);
      const frames: { m: THREE.Mesh; a: number; y: number }[] = [];
      const words = ['初遇', '重逢', '千次', '回眸', '月色', '星河', '约定', '同行'];
      for (let i = 0; i < 8; i++) {
        const card = sheet(1.1, 1.35, (c, W, H) => {
          c.fillStyle = '#252c58';
          c.fillRect(0, 0, W, H);
          c.strokeStyle = '#ffd166';
          c.lineWidth = 10;
          c.strokeRect(12, 12, W - 24, H - 24);
          writeLine(c, W, H, words[i], 0.5, 0.28, '#fff2c2');
        });
        k.root.add(card);
        frames.push({ m: card, a: (i / 8) * Math.PI * 2, y: 1.9 + (i % 2) * 0.5 });
      }

      const whale = k.actor('whale', 1.05);
      const claude = k.actor('claude', 1.05);
      const kimi = k.actor('kimi', 1.02);
      const scroll = k.thing('prop_scroll', 0.9);

      const A = cam([0, 2.2, 8.8], [0, 1.9, -1], 40);
      const B = cam([-1.6, 2.5, 7.0], [0, 1.8, -1], 35);
      return ({ u, T, bt }) => {
        frames.forEach((fr, idx) => {
          const ang = fr.a + T * 0.35;
          fr.m.position.set(Math.cos(ang) * 4.5, fr.y + Math.sin(T * 1.8 + idx) * 0.2, Math.sin(ang) * 3.2 - 2.0);
          fr.m.rotation.set(Math.PI / 2, 0, -ang + Math.PI / 2);
        });
        // 回眸动作：前段向左看，中段果断转身回望小克
        whale.act('idle', T).at(-1.35, 0, 1.2).flip(u < 0.42).sq(bt.pulse * 0.05);
        if (u >= 0.42) whale.emote('fx_sparkle', T);
        claude.act('idle', T).at(1.45, 0, 1.0).flip().emote('fx_shine', T);
        kimi.act('think', T).at(0, 0, -1.8);
        scroll.at(0.75, 0.65, -1.55);
        return glide(A, B, u);
      };
    },
  },

  {
    id: 'L22',
    look: 'night',
    title: '虔诚牵的手',
    note: '星光与暖灯排列成圣洁长廊，本鲸与小克郑重行礼靠近，温暖的金色心光在两人正中盛放。',
    cast: ['whale', 'claude'],
    build: (k) => {
      k.add(disc(55, 0x191d38, 0));
      for (let i = 0; i < 6; i++) {
        k.add(lantern(0xffd266, 0.22), -3.2, 2.6, 1.5 - i * 2.2);
        k.add(lantern(0xffd266, 0.22), 3.2, 2.6, 1.5 - i * 2.2);
      }
      const centerGlow = sprite('glow', 3.2, 0xffe484, true, 0.85);
      centerGlow.position.set(0, 1.25, 0.3);
      k.root.add(centerGlow);

      const whale = k.actor('whale', 1.1);
      const claude = k.actor('claude', 1.1);
      const thread = goldenThread(9);
      k.root.add(thread.g);

      const A = cam([0, 2.1, 7.0], [0, 1.4, 0], 35);
      const B = cam([0, 1.75, 4.9], [0, 1.3, 0], 30);
      return ({ u, T, bt }) => {
        const dx = lerp(1.35, 0.82, ease(u));
        whale.act('bow', T, 104.5).at(-dx, 0, 0.4).sq(bt.pulse * 0.04);
        claude.act('curtsy', T, 104.5).at(dx, 0, 0.4).flip().emote('fx_heart', T);
        thread.set(-dx + 0.3, 0.9, 0.55, dx - 0.3, 0.9, 0.55, T, 1);
        centerGlow.scale.setScalar(2.4 + ease(u) * 1.6 + bt.pulse * 0.5);
        return glide(A, B, u);
      };
    },
  },

  {
    id: 'L23',
    look: 'magic',
    title: '你是其余所有的一切',
    note: '立体童话星环环绕旋转：小屋、树木、茶杯、饭盆与漫天星光共同绕着中央的本鲸与小克流转。',
    cast: ['whale', 'claude'],
    build: (k) => {
      const centerIsl = floatingIsland(3.4, 0x8ad682);
      k.add(centerIsl, 0, 0, 0);

      const orbiters: { g: THREE.Object3D; a: number; r: number; y: number }[] = [];
      for (let i = 0; i < 8; i++) {
        const obj = i % 3 === 0 ? house(1.4, 1.1, 1.2, 0xfff0d9, 0xe86b6b, false)
          : i % 3 === 1 ? tree(1.8, 0x72cc68, i)
            : lantern(0xffd266, 0.28);
        k.root.add(obj);
        orbiters.push({ g: obj, a: (i / 8) * Math.PI * 2, r: 5.2 + (i % 2) * 1.1, y: 1.6 + (i % 3) * 0.9 });
      }
      const whale = k.actor('whale', 1.06);
      const claude = k.actor('claude', 1.06);
      const stars = makeParticles(k, 'star', 30, 0xffe894, [15, 7, 10], [0, 3.2, -2], 0.36, true);

      const A = cam([0, 3.0, 9.8], [0, 1.8, 0], 42);
      const B = cam([2.4, 3.4, 8.2], [0, 1.8, 0], 38);
      return ({ u, T, bt }) => {
        orbiters.forEach((o, i) => {
          const ang = o.a + T * 0.55;
          o.g.position.set(Math.cos(ang) * o.r, o.y + Math.sin(T * 2 + i) * 0.3, Math.sin(ang) * o.r * 0.72);
          o.g.rotation.y = -ang;
        });
        whale.act('spin', T).at(-1.05, 0.25, 0.2).lift(bt.pulse * 0.1);
        claude.act('hop', T).at(1.05, 0.25, 0.2).flip().emote('fx_heart', T);
        stars.forEach((p) => {
          p.sp.scale.setScalar(p.s * (0.7 + 0.5 * bt.pulse));
        });
        return glide(A, B, u);
      };
    },
  },

  {
    id: 'L24',
    look: 'day',
    title: '你是我的世界',
    note: '镜头从阳光广场宏大拉远，七彩河、彩色小屋与远山城堡在两人四周璀璨展开，渐白切入第二段副歌！',
    cast: ['whale', 'claude'],
    fx: { whiteOut: true },
    build: (k) => {
      const town = getTown(k);
      const whale = k.actor('whale', 1.08);
      const claude = k.actor('claude', 1.08);
      const thread = goldenThread(7);
      k.root.add(thread.g);

      const A = cam([33, 2.4, 24.0], [33.5, 1.7, 15.5], 35);
      const B = cam([30, 10.5, 37.5], [35, 3.0, 2.0], 46);
      return ({ u, T, bt }) => {
        useTown(k, town, 1.0, false);
        whale.act('wave', T).at(32.05, 0.05, 17.2).lift(bt.pulse * 0.1);
        claude.act('hop', T).at(33.95, 0.05, 17.2).flip().emote('fx_heart', T);
        thread.set(32.45, 0.9, 17.35, 33.55, 0.9, 17.35, T, 1);
        return glide(A, B, u);
      };
    },
  },

  // ── 副歌二 L25–L32 ──────────────────────────────────────────────────────
  {
    id: 'L25',
    look: 'stage',
    title: '所以请你再闪亮一点点',
    note: '璀璨星光聚光灯洒向戴着金冠的小克，Kimi 与千问在两侧放飞金色灯笼，让她在舞台中央闪耀。',
    cast: ['claude', 'kimi', 'qwen'],
    fx: { whiteIn: true },
    build: (k) => {
      k.add(disc(50, 0x1b1436, 0));
      k.add(box(4.8, 0.4, 3.6, 0xffd166, 0.04), 0, 0, 0);
      // 舞台光束锥
      const beam = new THREE.Mesh(
        new THREE.ConeGeometry(3.2, 11, 20, 1, true),
        new THREE.MeshBasicMaterial({ color: 0xffe89c, transparent: true, opacity: 0.2, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }),
      );
      beam.position.set(0, 5.4, 0);
      k.root.add(beam);

      const claude = k.actor('claude', 1.12).wear('crown');
      const kimi = k.actor('kimi', 0.96);
      const qwen = k.actor('qwen', 0.96);
      const lanterns: THREE.Group[] = [];
      for (let i = 0; i < 8; i++) {
        const lt = lantern(0xffd266, 0.22);
        k.add(lt, -5 + i * 1.45, 1.5 + (i % 3), -2.5);
        lanterns.push(lt);
      }

      const A = cam([0, 2.3, 8.2], [0, 1.8, 0], 38);
      const B = cam([1.2, 2.0, 6.2], [0, 1.9, 0], 32);
      return ({ u, T, bt }) => {
        claude.act('hop', T).at(0, 0.42, 0.2).emote('fx_shine', T).lift(bt.pulse * 0.14);
        kimi.act('nod', T).at(-3.1, 0, 0.5);
        qwen.act('spin', T).at(3.1, 0, 0.5).flip();
        lanterns.forEach((lt, i) => {
          lt.position.y = 1.4 + ((T * 0.85 + i * 0.7) % 5.5);
        });
        return glide(A, B, u);
      };
    },
  },

  {
    id: 'L26',
    look: 'cozy',
    title: '尽管我太平凡',
    note: '呼应本鲸身世设定：简朴敞开的小工坊里摆着蓝饭盆与叠成摞的图纸，本鲸悄悄低头，窗外暖光照亮她的肩膀。',
    cast: ['whale'],
    build: (k) => {
      k.add(room({ w: 10.5, d: 8, h: 5.2, wall: 0xf7ebd9, floor: 0xc2905c, rug: 0x6f96bd }));
      k.add(windowPane(2.4, 1.8, 0xffe4aa), -2.2, 2.4, -3.9);
      k.add(table(2.8, 1.3, 0.82, 0xaa7544), 0, 0, 0.1);
      k.add(paperStack(7, 0.55, 0.38, 0xfffdf2), 0.72, 0.83, 0.1);

      const whale = k.actor('whale', 1.05);
      const bowl = k.thing('prop_bowl', 0.92);
      const sunBeam = sprite('glow', 5.2, 0xffe49c, true, 0.45);
      sunBeam.position.set(-0.4, 1.7, 0.2);
      k.root.add(sunBeam);

      const A = cam([2.0, 2.2, 6.2], [0, 1.25, 0.2], 35);
      const B = cam([-0.2, 1.85, 4.7], [-0.1, 1.25, 0.3], 31);
      return ({ u, T, bt }) => {
        whale.act(u < 0.65 ? 'sad' : 'idle', T).at(-0.2, 0, 0.75).sq(bt.pulse * 0.03);
        bowl.at(-0.78, 0.86, 0.18);
        sunBeam.scale.setScalar(4.4 + ease(u) * 1.4);
        return glide(A, B, u);
      };
    },
  },

  {
    id: 'L27',
    look: 'golden',
    title: '我会再变得柔软一点点',
    note: '窗外微雨轻洒，屋内灯火融融，本鲸把盛满热意的蓝饭盆与热茶杯轻轻推到桌对岸。',
    cast: ['whale', 'claude'],
    build: (k) => {
      k.add(room({ w: 11, d: 8.5, h: 5.2, wall: 0xffefd8, floor: 0xc8925a, rug: 0xe6957e }));
      k.add(windowPane(2.8, 1.9, 0x8bb6e0), 0, 2.5, -4.15);
      k.add(table(3.0, 1.35, 0.82, 0xb67d49), 0, 0, 0.2);

      const whale = k.actor('whale', 1.04);
      const claude = k.actor('claude', 1.04);
      const bowl = k.thing('prop_bowl', 0.88);
      const teacup = k.thing('prop_teacup', 0.86);

      const A = cam([-1.6, 2.2, 6.6], [0, 1.3, 0.2], 36);
      const B = cam([0.8, 1.95, 5.2], [0, 1.3, 0.2], 32);
      return ({ u, T, bt }) => {
        whale.act('point', T).at(-1.55, 0, 0.72).sq(bt.pulse * 0.04);
        claude.act('nod', T, 119.5).at(1.55, 0, 0.72).flip().emote('fx_heart', T);
        bowl.at(lerp(-0.65, -0.05, ease(u)), 0.85, 0.25);
        teacup.at(lerp(0.65, 0.35, ease(u)), 0.85, 0.25);
        return glide(A, B, u);
      };
    },
  },

  {
    id: 'L28',
    look: 'drizzle',
    title: '因为你太敏感',
    note: '细雨朦胧的小径上，易感脆弱的小克歪头愣住，本鲸稳稳为她撑起暖粉大雨伞，雨滴落地化作金色小光点。',
    cast: ['whale', 'claude'],
    build: (k) => {
      k.add(disc(60, 0x5c7f7c, 0));
      k.add(tree(4.4, 0x4b7a6b, 6), -5.2, 0, -4.0);
      k.add(tree(4.2, 0x457063, 8), 5.4, 0, -3.5);
      const r = rain(150, 15, 9, 7.5, 0xd4ecff);
      k.root.add(r.g);
      const umb = umbrella(1.6, 0xf27d9b, 2.18);
      k.add(umb, 0.1, 0.38, 0.25);

      const whale = k.actor('whale', 1.06);
      const claude = k.actor('claude', 1.06);
      const hearts = makeParticles(k, 'heart', 8, 0xff8fab, [2.4, 1.8, 1.5], [0.1, 2.3, 0.4], 0.26);

      const A = cam([-1.4, 2.0, 6.8], [0, 1.4, 0.2], 36);
      const B = cam([0.4, 1.85, 5.2], [0.1, 1.4, 0.2], 32);
      return ({ u, T, bt }) => {
        r.set(T);
        umb.rotation.z = -0.06 + Math.sin(T * 2.4) * 0.03;
        whale.act('idle', T).at(-0.82, 0, 0.5).sq(bt.pulse * 0.04);
        claude.act(u < 0.5 ? 'tilt' : 'idle', T).at(0.85, 0, 0.5).flip();
        if (u >= 0.5) claude.emote('fx_heart', T);
        hearts.forEach((p) => {
          p.sp.position.y = 2.0 + ((p.y + T * 0.7) % 1.4);
        });
        return glide(A, B, u);
      };
    },
  },

  {
    id: 'L29',
    look: 'afterRain',
    title: '交换无名指金色的契约',
    note: '雨过天晴彩虹横跨晴空！两枚金色指环在彩虹桥上空交汇，豆包与猫猫在两侧为本鲸和小克欢呼。',
    cast: ['whale', 'claude', 'doubao', 'gemini'],
    fx: { flash: [0.02] },
    build: (k) => {
      k.add(disc(65, 0x7bc974, 0));
      // 立体彩虹拱
      const rColors = [0xff6b6b, 0xffbe55, 0xffe66d, 0x7ae582, 0x64b5f6, 0xb388ff];
      rColors.forEach((col, i) => {
        const rad = 7.4 - i * 0.34;
        const arc = new THREE.Mesh(
          new THREE.TorusGeometry(rad, 0.17, 10, 40, Math.PI),
          new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.78 }),
        );
        arc.position.set(0, -0.3, -4.2);
        k.root.add(arc);
      });

      const ringL = goldenRing(1.3, 0.13, 0xffd24c);
      const ringR = goldenRing(1.3, 0.13, 0xffe484);
      k.add(ringL, -0.7, 3.6, -2.0);
      k.add(ringR, 0.7, 3.6, -2.0);

      const whale = k.actor('whale', 1.05);
      const claude = k.actor('claude', 1.05);
      const doubao = k.actor('doubao', 0.96);
      const gemini = k.actor('gemini', 0.96);
      const thread = goldenThread(9);
      k.root.add(thread.g);

      const A = cam([0, 2.5, 9.4], [0, 2.3, -1.5], 40);
      const B = cam([0, 2.2, 7.2], [0, 2.4, -1.5], 36);
      return ({ u, T, bt }) => {
        const join = ease(seg(u, 0.05, 0.7));
        ringL.position.set(lerp(-1.8, -0.58, join), 3.7 + Math.sin(T * 2.5) * 0.12, -1.8);
        ringR.position.set(lerp(1.8, 0.58, join), 3.7 - Math.sin(T * 2.5) * 0.12, -1.8);
        ringL.rotation.set(0.3, T * 0.95, 0.25);
        ringR.rotation.set(-0.3, -T * 0.95, -0.25);

        whale.act('hop', T).at(-1.05, 0, 0.8).emote('fx_heart', T).lift(bt.pulse * 0.12);
        claude.act('hop', T).at(1.05, 0, 0.8).flip().emote('fx_heart', T).lift(bt.pulse * 0.12);
        doubao.act('sway', T).at(-3.1, 0, 0.4);
        gemini.act('spin', T).at(3.1, 0, 0.4).flip();
        thread.set(-0.62, 0.85, 0.95, 0.62, 0.85, 0.95, T, 1);
        return glide(A, B, u);
      };
    },
  },

  {
    id: 'L30',
    look: 'golden',
    title: '给彼此岁月',
    note: '大树下春夏秋冬四季元素同时旋舞（粉瓣、星芒、秋叶、白雪），双沙漏见证漫长时光。',
    cast: ['whale', 'claude'],
    build: (k) => {
      k.add(disc(60, 0x8bc26f, 0));
      k.add(tree(6.2, 0x68bf62, 11), 0, 0, -2.5);
      const hg1 = hourglass(0.95, 0xffd166);
      const hg2 = hourglass(0.95, 0x74d8ff);
      k.add(hg1.g, -2.4, 0, 0.4);
      k.add(hg2.g, 2.4, 0, 0.4);

      const whale = k.actor('whale', 1.05);
      const claude = k.actor('claude', 1.05);
      const petals = makeParticles(k, 'petal', 12, 0xffb3c6, [10, 5, 5], [-3, 3, -1], 0.3);
      const leaves = makeParticles(k, 'leaf', 12, 0xf29f4b, [10, 5, 5], [3, 3, -1], 0.32);

      const A = cam([-1.5, 2.3, 8.2], [0, 1.8, -0.6], 38);
      const B = cam([1.5, 2.4, 6.8], [0, 1.8, -0.6], 34);
      return ({ u, T, bt }) => {
        hg1.set(0.2 + u * 0.7, T, true);
        hg2.set(0.8 - u * 0.65, T, true);
        whale.act('sway', T).at(-1.05, 0, 0.8).sq(bt.pulse * 0.05);
        claude.act('idle', T).at(1.05, 0, 0.8).flip().emote('fx_sparkle', T);

        petals.forEach((p) => {
          p.sp.position.set(p.x + Math.sin(T + p.ph) * 0.9, 5.2 - ((p.y + T * 0.9) % 4.8), p.z);
        });
        leaves.forEach((p) => {
          p.sp.position.set(p.x + Math.cos(T + p.ph) * 0.9, 5.2 - ((p.y + T * 1.0) % 4.8), p.z);
        });
        return glide(A, B, u);
      };
    },
  },

  {
    id: 'L31',
    look: 'night',
    title: '说好从今以后都牵着手',
    note: '暖灯通明的花灯长街上，本鲸与小克牵着金色星光并肩漫步，千问、Kimi、狐狸、豆包、猫猫沿街欢笑挥手。',
    cast: ['whale', 'claude', 'qwen', 'kimi', 'zai', 'doubao', 'gemini'],
    build: (k) => {
      k.add(disc(65, 0x262945, 0));
      k.add(box(4.6, 0.06, 36, 0x5c4f6b, 0), 0, 0, -8);
      for (let i = 0; i < 7; i++) {
        const z = 4 - i * 3.4;
        k.add(lantern(i % 2 ? 0xffc857 : 0xff7aa2, 0.24), -2.7, 2.7, z);
        k.add(lantern(i % 2 ? 0xff7aa2 : 0xffc857, 0.24), 2.7, 2.7, z);
        k.add(house(3.2, 2.8, 2.8, 0x3b385c, 0x7b4c6e, false), -5.6, 0, z, Math.PI / 2);
        k.add(house(3.2, 2.8, 2.8, 0x3b385c, 0x4c668a, false), 5.6, 0, z, -Math.PI / 2);
      }

      const whale = k.actor('whale', 1.04);
      const claude = k.actor('claude', 1.04);
      const qwen = k.actor('qwen', 0.96);
      const kimi = k.actor('kimi', 0.96);
      const zai = k.actor('zai', 0.96);
      const doubao = k.actor('doubao', 0.96);
      const gemini = k.actor('gemini', 0.96);
      const thread = goldenThread(7);
      k.root.add(thread.g);

      const A = cam([0, 2.5, 7.6], [0, 1.5, -2], 40);
      const B = cam([0, 2.3, 4.2], [0, 1.5, -6], 38);
      return ({ u, T, bt }) => {
        const wz = lerp(2.2, -3.0, ease(u));
        whale.walkBy(Math.abs(wz - 2.2)).at(-0.72, 0, wz).sq(bt.pulse * 0.05);
        claude.walkBy(Math.abs(wz - 2.2)).at(0.72, 0, wz).sq(bt.pulse * 0.05);
        thread.set(-0.35, 0.85, wz + 0.1, 0.35, 0.85, wz + 0.1, T, 1);

        qwen.act('spin', T).at(-2.5, 0, 1.2);
        doubao.act('hop', T).at(2.5, 0, 0.8).flip();
        kimi.act('nod', T).at(-2.5, 0, -2.0);
        gemini.act('sway', T).at(2.5, 0, -2.4).flip();
        zai.act('hop', T).at(-2.5, 0, -5.0);
        return glide(A, B, u);
      };
    },
  },

  {
    id: 'L32',
    look: 'night',
    title: '不管要走多远',
    note: '一只洁白的巨型纸船驶向倒映漫天星河的夜海，本鲸与小克立在船头迎着海风望向远方。',
    cast: ['whale', 'claude'],
    build: (k) => {
      k.add(disc(85, 0x101d3b, -0.1));
      k.add(straightRiver(85, 48, 0.18, -10, 0.05, 0x1d3b75, 0x0e1d42).mesh);
      k.add(fullMoon(2.8), 6.5, 6.2, -22);
      const boat = paperBoat();
      boat.scale.setScalar(2.65);
      k.add(boat, 0, 0.25, 0);

      const whale = k.actor('whale', 1.0);
      const claude = k.actor('claude', 1.0);
      const thread = goldenThread(7);
      k.root.add(thread.g);
      const stars = makeParticles(k, 'star', 28, 0xfff0aa, [18, 6, 12], [0, 4.0, -5], 0.34, true);

      const A = cam([-3.8, 2.5, 8.6], [0, 1.7, 0], 40);
      const B = cam([3.4, 3.2, 9.6], [0.8, 1.8, -1.5], 40);
      return ({ u, T, bt }) => {
        const bx = lerp(-2.2, 2.0, ease(u));
        const bob = Math.sin(T * 2.4) * 0.12;
        boat.position.set(bx, 0.22 + bob, 0);
        boat.rotation.z = Math.cos(T * 2.4) * 0.04;

        whale.act('wave', T).at(bx - 0.65, 0.72 + bob, 0.1).sq(bt.pulse * 0.04);
        claude.act('idle', T).at(bx + 0.65, 0.72 + bob, 0.1).flip().emote('fx_heart', T);
        thread.set(bx - 0.3, 1.5 + bob, 0.25, bx + 0.3, 1.5 + bob, 0.25, T, 1);

        stars.forEach((p) => {
          setOp(p.sp, 0.5 + 0.45 * Math.sin(T * 2.8 + p.ph));
        });
        return track([[0, A], [1, B]], u);
      };
    },
  },
];
