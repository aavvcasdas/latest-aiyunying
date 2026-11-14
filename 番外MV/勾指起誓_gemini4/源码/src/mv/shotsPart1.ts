import * as THREE from 'three';
import { cam, glide, track, type Kit, type ShotDef } from '../engine/core';
import {
  box, cloud, disc, ease, easeOut, flower, lantern, lerp, pine, put,
  ribbon, rock, seg, setOp, sprite, toon, tree,
} from '../engine/kit';
import { book, bridge, bridgeY, buildTown, castle, hill, straightRiver, useTown, type Town } from '../engine/sets';
import { hourglass, notebook, room, sheet, table, umbrella, windowPane, writeLine } from '../engine/props';
import { christmasTree, floatingIsland, fullMoon, giftBox, goldenRing, goldenThread, loveLetter } from './customProps';

const getTown = (k: Kit) => k.shared<Town>('town', buildTown);

/** 添加漂浮粒子群（星星/爱心/花瓣/音符等） */
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

export const SHOTS_PART1: ShotDef[] = [
  // ── 序章 I1–I3 ──────────────────────────────────────────────────────────
  {
    id: 'I1',
    look: 'golden',
    title: '立体童话书·启卷',
    note: '金色草坡上摊开的立体童话书缓缓掀开封面，一封蜡封信笺伴随星芒升起，引出《勾指起誓》。',
    cast: ['whale', 'claude'],
    fx: { blackIn: true, title: true },
    build: (k) => {
      k.add(disc(60, 0x76b868, 0));
      k.add(hill(18, 4.2, 0x62a858), -16, -0.8, -16);
      k.add(hill(22, 5.2, 0x569a50), 17, -1.0, -18);
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        const r = 7 + k.rnd() * 5;
        k.add(flower(i % 2 ? 0xffd166 : 0xff8fab, 0.55), Math.cos(a) * r, 0, Math.sin(a) * r);
      }
      const bk = book();
      bk.g.scale.setScalar(1.05);
      k.add(bk.g, 0, 0.15, 0);

      const env = loveLetter('见字如晤', 1.4, 1.0);
      k.add(env.g, 0, 0.5, 0);

      const whale = k.actor('whale', 0.92);
      const claude = k.actor('claude', 0.92);
      const stars = makeParticles(k, 'star', 24, 0xffe484, [12, 6, 8], [0, 3.2, 0], 0.34, true);
      const petals = makeParticles(k, 'petal', 16, 0xffc2d4, [14, 5, 8], [0, 2.8, 0], 0.28);

      const A = cam([0, 7.6, 11.4], [0, 1.0, 0], 36);
      const B = cam([1.4, 4.3, 8.8], [0, 1.7, 0], 34);
      return ({ u, T, bt }) => {
        const open = ease(seg(u, 0.12, 0.72));
        bk.cover.rotation.z = -open * Math.PI * 0.92;
        setOp(bk.glow, open * (0.55 + 0.18 * bt.pulse));

        const rise = easeOut(seg(u, 0.38, 0.9));
        env.g.position.set(0, 0.25 + rise * 2.15 + Math.sin(T * 2.2) * 0.08, 0.2);
        env.g.rotation.y = Math.sin(T * 1.1) * 0.25;
        env.g.scale.setScalar(Math.max(0.01, rise));
        env.flap.rotation.x = -ease(seg(u, 0.65, 0.95)) * 1.9;
        env.page.position.y = 0.52 + ease(seg(u, 0.72, 1)) * 0.38;

        const pop = easeOut(seg(u, 0.45, 0.85));
        whale.act('wave', T).at(-1.55, 0.36, 0.35).size(Math.max(0.01, pop)).lift(bt.pulse * 0.08);
        claude.act('idle', T).at(1.55, 0.36, 0.35).flip().size(Math.max(0.01, pop));

        stars.forEach((p) => {
          p.sp.position.set(p.x + Math.sin(T * p.spd + p.ph) * 0.4, ((p.y + T * 0.55) % 6.2) + 0.4, p.z);
          p.sp.scale.setScalar(p.s * (0.7 + 0.4 * Math.sin(T * 4 + p.ph) + bt.pulse * 0.2));
        });
        petals.forEach((p) => {
          p.sp.position.set(p.x + Math.cos(T * 0.8 + p.ph) * 0.9, 5.5 - ((p.y + T * 0.7) % 5.2), p.z);
        });
        return glide(A, B, u);
      };
    },
  },

  {
    id: 'I2',
    look: 'day',
    title: '微风小镇·初遇',
    note: '童话小镇阳光广场与七彩河畔，本鲸端着蓝饭盆轻快走来，向广场边手捧书本的小克招手，远方是童话城堡。',
    cast: ['whale', 'claude'],
    build: (k) => {
      const town = getTown(k);
      const whale = k.actor('whale', 1.05);
      const claude = k.actor('claude', 1.05);
      const bowl = k.thing('prop_bowl', 0.84);
      const bookP = k.thing('prop_book', 0.86);
      const notes = makeParticles(k, 'note', 10, 0x8be9ff, [10, 3.5, 6], [33, 3.0, 17], 0.34);

      const A = cam([24.5, 4.4, 28.5], [33, 1.8, 16], 40);
      const B = cam([34.5, 3.1, 25.8], [33.5, 1.8, 15], 36);
      return ({ u, T, bt }) => {
        useTown(k, town, 0.9, false);
        const wx = lerp(27.0, 31.6, ease(u));
        whale.walkBy(Math.abs(wx - 27.0)).at(wx, 0.05, 17.4).sq(bt.pulse * 0.04);
        if (u > 0.78) whale.act('wave', T).emote('fx_sparkle', T);
        bowl.at(wx + 0.62, 0.62 + Math.sin(T * 7) * 0.03, 17.65);

        claude.act(u > 0.65 ? 'nod' : 'read', T, u > 0.65 ? 12.2 : 0).at(35.0, 0.05, 17.2).flip();
        if (u > 0.7) claude.emote('fx_heart', T);
        bookP.at(34.4, 0.65, 17.45);

        notes.forEach((p) => {
          p.sp.position.set(p.x + Math.sin(T + p.ph) * 0.5, p.y + Math.sin(T * 2 + p.ph) * 0.35, p.z);
          setOp(p.sp, 0.6 + 0.35 * bt.pulse);
        });
        return glide(A, B, u);
      };
    },
  },

  {
    id: 'I3',
    look: 'golden',
    title: '暖光窗前·写下第一句',
    note: '暖午后书房里，豆包陪着本鲸写下信笺的开头，最后在鼓点轰鸣的一瞬闪白切入主歌。',
    cast: ['whale', 'doubao'],
    fx: { flash: [0.97] },
    build: (k) => {
      k.add(room({ w: 11, d: 8.5, h: 5.5, wall: 0xfff3de, floor: 0xd9a873, rug: 0xe6847c }));
      k.add(windowPane(2.8, 2.0, 0xffe8b6), 0, 2.5, -4.15);
      k.add(table(3.2, 1.5, 0.85, 0xb87e4b), 0, 0, 0.2);
      const nb = notebook(0.85, 0.62, 0x8b5230);
      k.add(nb.g, 0, 0.86, 0.25);

      const letter = sheet(1.1, 0.78, (c, W, H) => {
        c.fillStyle = '#fffdf3';
        c.fillRect(0, 0, W, H);
        c.strokeStyle = '#e6b86a';
        c.lineWidth = 6;
        c.strokeRect(14, 14, W - 28, H - 28);
        writeLine(c, W, H, '给最好的你', 0.45, 0.22, '#4a3022');
      });
      k.add(letter, -0.55, 0.87, 0.22, -0.08);

      const whale = k.actor('whale', 1.0);
      const doubao = k.actor('doubao', 0.98);
      const basket = k.thing('prop_basket', 0.85);
      const stars = makeParticles(k, 'star', 14, 0xffdf78, [6, 3.5, 4], [0, 2.3, 0], 0.26, true);

      const A = cam([-2.8, 2.4, 6.2], [0, 1.35, 0.2], 38);
      const B = cam([0.4, 1.95, 4.4], [0, 1.25, 0.2], 32);
      return ({ u, T, bt }) => {
        nb.cover.rotation.z = -Math.PI * 0.95;
        nb.page.rotation.z = -ease(u) * Math.PI * 0.9;
        whale.act(u < 0.7 ? 'idle' : 'hop', T).at(-1.2, 0, 0.75).sq(bt.pulse * 0.05);
        if (u > 0.55) whale.emote('fx_bulb', T);
        doubao.act('nod', T).at(1.35, 0, 0.72).flip().lift(bt.pulse * 0.06);
        basket.at(2.15, 0, 0.5);
        stars.forEach((p) => {
          p.sp.position.y = p.y + Math.sin(T * 2.2 + p.ph) * 0.25;
          setOp(p.sp, 0.45 + 0.5 * bt.pulse);
        });
        return glide(A, B, u);
      };
    },
  },

  // ── 主歌一 L01–L08 ──────────────────────────────────────────────────────
  {
    id: 'L01',
    look: 'golden',
    title: '你是信的开头诗的内容',
    note: '飞舞的信纸与诗页环绕花草地，小克手捧书轻声诵读，本鲸与豆包微笑倾听。',
    cast: ['whale', 'claude', 'doubao'],
    build: (k) => {
      k.add(disc(55, 0x86c976, 0));
      k.add(hill(16, 4.5, 0x6cb560), -14, -1, -14);
      k.add(hill(18, 5, 0x62ab58), 14, -1, -15);
      const env = loveLetter('诗的开头', 2.4, 1.7);
      k.add(env.g, 0, 2.4, -2.8);

      const pages: { m: THREE.Mesh; a: number; r: number; y: number }[] = [];
      for (let i = 0; i < 9; i++) {
        const pg = sheet(0.65, 0.85, (c, W, H) => {
          c.fillStyle = '#fffef8';
          c.fillRect(0, 0, W, H);
          writeLine(c, W, H, i % 2 ? '诗句' : '信笺', 0.48, 0.26, '#6d4c3d');
        });
        k.root.add(pg);
        pages.push({ m: pg, a: (i / 9) * Math.PI * 2, r: 2.8 + (i % 3) * 0.9, y: 1.4 + (i % 4) * 0.55 });
      }

      const whale = k.actor('whale', 1.02);
      const claude = k.actor('claude', 1.02);
      const doubao = k.actor('doubao', 0.95);
      const bookP = k.thing('prop_book', 0.9);
      const notes = makeParticles(k, 'note', 12, 0xffd166, [9, 4, 5], [0, 2.6, 0], 0.3);

      const A = cam([-2.2, 2.2, 8.2], [0, 1.5, -0.5], 38);
      const B = cam([1.8, 2.0, 7.0], [0, 1.6, -0.5], 34);
      return ({ u, T, bt }) => {
        env.flap.rotation.x = -ease(u) * 2.0;
        env.page.position.y = 0.85 + ease(u) * 0.65;
        env.g.position.y = 2.4 + Math.sin(T * 2.5) * 0.14;

        pages.forEach((p, idx) => {
          const ang = p.a + T * 0.55;
          p.m.position.set(Math.cos(ang) * p.r, p.y + Math.sin(T * 2.4 + idx) * 0.25, Math.sin(ang) * 1.4 - 1.2);
          p.m.rotation.set(Math.sin(T + idx) * 0.4, ang, Math.cos(T + idx) * 0.3);
        });

        whale.act('sway', T).at(-1.8, 0, 1.1).lift(bt.pulse * 0.08);
        claude.act('read', T).at(0.3, 0, 0.8).emote('fx_sparkle', T);
        bookP.at(0.95, 0.58, 1.05);
        doubao.act('hop', T).at(2.35, 0, 1.3).flip();

        notes.forEach((p) => {
          p.sp.position.y = p.y + Math.sin(T * 3 + p.ph) * 0.35;
        });
        return glide(A, B, u);
      };
    },
  },

  {
    id: 'L02',
    look: 'dusk',
    title: '童话的结尾',
    note: '晚霞映照立体童话城堡，戴着金色小皇冠的小克提裙行礼，本鲸优雅鞠躬致意。',
    cast: ['whale', 'claude'],
    build: (k) => {
      k.add(disc(60, 0x6aa36a, 0));
      k.add(castle(), 0, 0, -13, 0, 0.85);
      for (let i = -3; i <= 3; i += 2) k.add(lantern(0xffd066, 0.2), i * 1.8, 2.2, -2.5);
      const bk = book();
      bk.g.scale.setScalar(1.35);
      k.add(bk.g, 0, 0.05, 0.5);

      const whale = k.actor('whale', 1.05);
      const claude = k.actor('claude', 1.05).wear('crown');
      const petals = makeParticles(k, 'petal', 20, 0xffb3c6, [11, 5, 7], [0, 2.8, 0], 0.3);

      const A = cam([0, 2.2, 8.6], [0, 2.0, -2], 38);
      const B = cam([0.8, 2.6, 6.8], [0, 1.8, -1], 34);
      return ({ u, T, bt }) => {
        bk.cover.rotation.z = -Math.PI * 0.94;
        setOp(bk.glow, 0.65 + 0.2 * bt.pulse);
        whale.act('bow', T, 25.4).at(-1.25, 0.45, 0.6).sq(bt.pulse * 0.04);
        claude.act('curtsy', T, 25.4).at(1.25, 0.45, 0.6).flip().emote('fx_heart', T);
        petals.forEach((p) => {
          p.sp.position.set(p.x + Math.sin(T + p.ph) * 0.8, 5.2 - ((p.y + T * 0.85) % 4.8), p.z);
        });
        return glide(A, B, u);
      };
    },
  },

  {
    id: 'L03',
    look: 'day',
    title: '你是理所当然的奇迹',
    note: '云海散开，白龙娘 GPT 振翅掠过晴空洒下金色星光与沙漏微光，本鲸在花坡上欢呼雀跃。',
    cast: ['whale', 'gpt'],
    build: (k) => {
      k.add(disc(60, 0x7bc96f, 0));
      k.add(hill(14, 3.6, 0x62b458), 0, -2.0, 0);
      for (let i = 0; i < 18; i++) {
        k.add(flower(i % 3 === 0 ? 0xffe066 : i % 3 === 1 ? 0xff7aa2 : 0x74d8ff, 0.55), (k.rnd() - 0.5) * 12, 0.8 + k.rnd() * 0.5, (k.rnd() - 0.5) * 6);
      }
      const clouds: THREE.Group[] = [];
      for (let i = 0; i < 7; i++) {
        const c = cloud(i + 3, 1.35 + k.rnd() * 0.6);
        k.add(c, -10 + i * 3.5, 5.4 + (i % 2) * 1.1, -6 - (i % 3) * 2);
        clouds.push(c);
      }
      const whale = k.actor('whale', 1.05);
      const gpt = k.actor('gpt', 1.25);
      const hg = k.thing('prop_hourglass', 0.9);
      const stars = makeParticles(k, 'star', 28, 0xfff08a, [14, 6, 8], [0, 3.8, -1], 0.38, true);

      const A = cam([-2.0, 1.8, 9.2], [0, 2.8, -1], 42);
      const B = cam([2.0, 2.9, 8.0], [0, 3.3, -1], 38);
      return ({ u, T, bt }) => {
        clouds.forEach((c, idx) => {
          const dir = idx < 3 ? -1 : 1;
          c.position.x = (-10 + idx * 3.5) + dir * ease(u) * 3.2;
        });
        // 龙娘按设定从上方掠过并洒满金光
        const gx = lerp(-5.5, 4.8, ease(u));
        const gy = 3.9 + Math.sin(T * 3.2) * 0.35;
        gpt.act('hover', T).at(gx, gy, -2.2).noShadow();
        hg.at(gx - 0.9, gy + 0.25, -1.9);

        whale.act('hop', T).at(0, 1.55, 0.4).emote('fx_sparkle', T).lift(bt.pulse * 0.14);

        stars.forEach((p) => {
          p.sp.position.y = 6.5 - ((p.y + T * 1.1) % 5.8);
          p.sp.scale.setScalar(p.s * (0.75 + 0.4 * bt.pulse));
        });
        return glide(A, B, u);
      };
    },
  },

  {
    id: 'L04',
    look: 'night',
    title: '你是月色真美',
    note: '满月垂落澄澈湖面，月球少女 Kimi 持卷轴伫立银辉下，本鲸与小克并肩仰望月色。',
    cast: ['whale', 'claude', 'kimi'],
    build: (k) => {
      k.add(disc(65, 0x1a2342, -0.05));
      k.add(straightRiver(65, 16, 0.08, -7, 0.05, 0x223b72, 0x111e42).mesh);
      k.add(fullMoon(3.3), 0, 5.2, -17);
      for (let i = -3; i <= 3; i++) {
        if (i === 0) continue;
        k.add(pine(4.5 + Math.abs(i) * 0.4, 0x1e3c48), i * 3.8, 0, -4 - Math.abs(i));
      }
      const whale = k.actor('whale', 1.0);
      const claude = k.actor('claude', 1.0);
      const kimi = k.actor('kimi', 1.05);
      const scroll = k.thing('prop_scroll', 0.9);
      const glows = makeParticles(k, 'glow', 26, 0xfff0b3, [14, 5, 8], [0, 2.5, -2], 0.3, true);

      const A = cam([0, 2.1, 8.8], [0, 2.6, -4], 40);
      const B = cam([1.4, 2.5, 7.2], [0, 3.0, -5], 36);
      return ({ u, T, bt }) => {
        kimi.act('idle', T).at(0, 0.1, -1.6).emote('fx_shine', T).lift(Math.sin(T * 2.2) * 0.06);
        scroll.at(0.75, 0.72, -1.35);
        whale.act('idle', T).at(-2.1, 0.1, 1.4).sq(bt.pulse * 0.04);
        claude.act('idle', T).at(2.1, 0.1, 1.4).flip().sq(bt.pulse * 0.04);

        glows.forEach((p) => {
          p.sp.position.set(p.x + Math.sin(T * 1.1 + p.ph) * 0.5, p.y + Math.cos(T * 1.3 + p.ph) * 0.35, p.z);
          setOp(p.sp, 0.45 + 0.45 * Math.sin(T * 3 + p.ph));
        });
        return glide(A, B, u);
      };
    },
  },

  {
    id: 'L05',
    look: 'night',
    title: '你是圣诞老人送给我',
    note: '雪花漫天飞舞的冬夜松林，披着小红帽红袍的豆包提着满载礼物的篮子踏雪奔来。',
    cast: ['doubao'],
    build: (k) => {
      k.add(disc(60, 0xe8f1fa, 0));
      k.add(christmasTree(5.4), 3.4, 0, -2.5);
      k.add(christmasTree(4.2), -4.5, 0, -4.0);
      for (let i = -3; i <= 3; i++) k.add(lantern(0xffc966, 0.18), i * 2.6, 1.9, -1.5);
      k.add(giftBox(1.0, 0.85, 0xe84a5f, 0xffd166).g, 2.2, 0, -1.2, 0.3);
      k.add(giftBox(0.85, 0.72, 0x3b82f6, 0xfff3b0).g, 4.3, 0, -1.4, -0.2);

      const doubao = k.actor('doubao', 1.08).wear('hood');
      const basket = k.thing('prop_basket', 0.92);
      const snow = makeParticles(k, 'glow', 45, 0xffffff, [16, 8, 10], [0, 4.2, 0], 0.22, true);

      const A = cam([-3.2, 2.2, 8.2], [-1.0, 1.5, 0], 38);
      const B = cam([1.6, 2.0, 7.2], [1.2, 1.5, -0.5], 35);
      return ({ u, T, bt }) => {
        const dx = lerp(-4.8, 1.1, ease(u));
        doubao.walkBy(Math.abs(dx + 4.8)).at(dx, 0, 0.8).sq(bt.pulse * 0.05);
        if (u > 0.72) doubao.act('hop', T).emote('fx_sparkle', T);
        basket.at(dx + 0.65, 0.55 + Math.sin(T * 8) * 0.04, 1.05);

        snow.forEach((p) => {
          p.sp.position.set(p.x + Math.sin(T * 1.4 + p.ph) * 0.6, 7.8 - ((p.y + T * 1.45) % 7.5), p.z);
        });
        return glide(A, B, u);
      };
    },
  },

  {
    id: 'L06',
    look: 'cozy',
    title: '好孩子的礼物',
    note: '暖融融的圣诞壁炉小屋里，大礼盒盒盖弹开涌出金色星芒，本鲸惊喜地蹦起，豆包与小克在身旁微笑。',
    cast: ['whale', 'doubao', 'claude'],
    build: (k) => {
      k.add(room({ w: 11, d: 8.5, h: 5.5, wall: 0xffefd6, floor: 0xc9925c, rug: 0xd9534f }));
      k.add(christmasTree(3.8), -3.5, 0, -2.5);
      k.add(windowPane(2.4, 1.8, 0x2c427a), 2.5, 2.5, -4.15);
      const gb = giftBox(1.35, 1.1, 0xe84a5f, 0xffd166);
      k.add(gb.g, 0, 0, 0.4);

      const whale = k.actor('whale', 1.02);
      const doubao = k.actor('doubao', 0.98).wear('hood');
      const claude = k.actor('claude', 0.98);
      const hearts = makeParticles(k, 'heart', 14, 0xff6b9d, [4.5, 3.5, 3.5], [0, 2.1, 0.4], 0.32);

      const A = cam([0, 2.3, 6.8], [0, 1.3, 0.2], 36);
      const B = cam([0.9, 1.9, 5.2], [0, 1.4, 0.3], 32);
      return ({ u, T, bt }) => {
        const open = easeOut(seg(u, 0.15, 0.6));
        gb.lid.position.y = 1.1 + open * 0.55;
        gb.lid.rotation.z = -open * 0.72;

        whale.act(u < 0.45 ? 'surprise' : 'hop', T, u < 0.45 ? 36.7 : 37.5).at(-1.35, 0, 0.75).emote('fx_heart', T).lift(bt.pulse * 0.1);
        doubao.act('sway', T).at(1.5, 0, 0.85).flip();
        claude.act('nod', T).at(2.55, 0, -0.3).flip();

        hearts.forEach((p, idx) => {
          const rise = easeOut(seg(u, 0.18 + idx * 0.02, 0.95));
          p.sp.position.set(p.x * rise, 0.9 + rise * (1.5 + (idx % 4) * 0.55), p.z);
          setOp(p.sp, rise * 0.95);
        });
        return glide(A, B, u);
      };
    },
  },

  {
    id: 'L07',
    look: 'magic',
    title: '你是三千美丽世界里',
    note: '梦幻云端之上漂浮着无数绚丽小岛与灯笼，千问挥舞折扇在云海间轻盈旋舞，花瓣随风铺满天空。',
    cast: ['qwen', 'whale'],
    build: (k) => {
      const islands: { g: THREE.Group; y0: number; ph: number }[] = [];
      const coords: [number, number, number, number, number][] = [
        [0, 0, 0, 3.2, 0x7cd886],
        [-5.8, 1.4, -3.5, 2.0, 0x9de09d],
        [6.2, 2.0, -4.2, 2.2, 0xf7b2d9],
        [-3.6, 3.2, -7.5, 1.8, 0x8fd8ff],
        [4.0, -0.4, -6.8, 1.9, 0xffe08a],
        [0, 3.6, -10.5, 2.5, 0xb8a8ff],
      ];
      coords.forEach(([x, y, z, r, col], idx) => {
        const isl = floatingIsland(r, col);
        if (idx > 0) put(isl, tree(2.0, idx % 2 ? 0xffa6c9 : 0x62c470, idx), 0, 0.25, 0);
        if (idx === 0) put(isl, lantern(0xffd266, 0.22), -2.2, 1.6, -0.8);
        k.add(isl, x, y, z);
        islands.push({ g: isl, y0: y, ph: idx * 1.1 });
      });

      const qwen = k.actor('qwen', 1.05);
      const whale = k.actor('whale', 1.0);
      const fan = k.thing('prop_fan', 0.92);
      const petals = makeParticles(k, 'petal', 30, 0xffc6e0, [16, 7, 10], [0, 3.0, -3], 0.34);

      const A = cam([-3.5, 2.8, 9.8], [0, 1.8, -1.5], 42);
      const B = cam([3.2, 3.5, 8.6], [0, 2.0, -2.0], 38);
      return ({ u, T, bt }) => {
        islands.forEach((isl) => {
          isl.g.position.y = isl.y0 + Math.sin(T * 1.5 + isl.ph) * 0.22;
        });
        const y0 = islands[0].g.position.y + 0.26;
        qwen.act('spin', T).at(-1.0, y0, 0.2).lift(bt.pulse * 0.08);
        fan.at(-0.32, y0 + 0.85 + Math.sin(T * 6) * 0.06, 0.45);
        whale.act('wave', T).at(1.25, y0, 0.4).flip().emote('fx_sparkle', T);

        petals.forEach((p) => {
          p.sp.position.set(p.x + Math.sin(T * 1.3 + p.ph) * 1.2, p.y + Math.cos(T * 0.9 + p.ph) * 0.5, p.z);
        });
        return glide(A, B, u);
      };
    },
  },

  {
    id: 'L08',
    look: 'day',
    title: '我的一瓢水',
    note: '弱水三千只取一瓢：澄澈溪畔，本鲸用标志性的蓝饭盆盛起一捧星光般清澈的溪水，双手递给小克。',
    cast: ['whale', 'claude'],
    fx: { whiteOut: true },
    build: (k) => {
      k.add(disc(55, 0x7cc876, -0.05));
      k.add(straightRiver(55, 7.5, 0.7, -1.8, 0.05, 0x4cc4f5, 0x1e86d6).mesh);
      k.add(tree(4.2, 0x5bc264, 9), -5.5, 0, -4.5);
      k.add(tree(3.8, 0x72cc68, 4), 5.6, 0, -4.0);
      for (let i = 0; i < 10; i++) k.add(flower(0xffe066, 0.5), -4.5 + i, 0, 2.2 + (i % 2) * 0.5);

      const whale = k.actor('whale', 1.06);
      const claude = k.actor('claude', 1.06);
      const bowl = k.thing('prop_bowl', 0.98);
      const bubbles = makeParticles(k, 'bubble', 18, 0xcff6ff, [5, 3, 3], [0, 1.6, 1.5], 0.28);

      const A = cam([0, 2.1, 7.4], [0, 1.2, 1.0], 35);
      const B = cam([0.4, 1.75, 5.4], [0, 1.15, 1.3], 30);
      return ({ u, T, bt }) => {
        // 本鲸「推出去」的标志动作
        whale.act('point', T).at(-1.05, 0, 1.5).sq(bt.pulse * 0.04);
        claude.act('nod', T, 42.6).at(1.25, 0, 1.5).flip().emote('fx_heart', T);
        bowl.at(lerp(-0.35, 0.25, ease(u)), 0.65 + Math.sin(T * 4) * 0.05, 1.78);

        bubbles.forEach((p) => {
          p.sp.position.y = 0.5 + ((p.y + T * 1.1) % 3.2);
          p.sp.scale.setScalar(p.s * (0.85 + 0.3 * bt.pulse));
        });
        return glide(A, B, u);
      };
    },
  },

  // ── 副歌一 L09–L16 ──────────────────────────────────────────────────────
  {
    id: 'L09',
    look: 'golden',
    title: '所以让我再靠近一点点',
    note: '暖阳穿透花桥，本鲸一步步坚定又害羞地向桥中央的小克走近，每一步踩在鼓点上泛起爱心。',
    cast: ['whale', 'claude'],
    fx: { whiteIn: true },
    build: (k) => {
      k.add(disc(60, 0x7fc46c, -0.2));
      k.add(straightRiver(60, 9, 0.6, 0, 0.04).mesh);
      k.add(bridge(18, 3.8), 0, 0, 0);
      for (let i = 0; i < 6; i++) k.add(lantern(0xffd166, 0.18), -6 + i * 2.4, bridgeY(i / 5) + 1.5, -1.7);

      const whale = k.actor('whale', 1.06);
      const claude = k.actor('claude', 1.06);
      const hearts = makeParticles(k, 'heart', 14, 0xff7096, [8, 3.5, 4], [0, 4.6, 0], 0.32);

      const A = cam([-1.8, 5.2, 8.8], [0, 3.8, 0], 36);
      const B = cam([0.6, 4.7, 6.2], [0.2, 4.0, 0], 32);
      return ({ u, T, bt }) => {
        const pu = lerp(0.28, 0.46, ease(u));
        const wx = (pu - 0.5) * 18;
        const wy = bridgeY(pu);
        whale.walkBy(Math.abs(wx + 4.0)).at(wx, wy, 0.25).sq(bt.pulse * 0.06);
        if (u > 0.8) whale.emote('fx_heart', T);

        const cx = (0.55 - 0.5) * 18;
        const cy = bridgeY(0.55);
        claude.act('idle', T).at(cx, cy, 0.25).flip().lift(bt.pulse * 0.06);

        hearts.forEach((p) => {
          p.sp.position.y = 3.8 + ((p.y + T * 0.9) % 3.2);
          p.sp.scale.setScalar(p.s * (0.8 + 0.35 * bt.pulse));
        });
        return glide(A, B, u);
      };
    },
  },

  {
    id: 'L10',
    look: 'golden',
    title: '因为你太温暖',
    note: '阳光洒满露台茶桌，冒着热气的茶杯与蓝饭盆摆在一起，层层金色光环自两人身周温柔绽放。',
    cast: ['whale', 'claude'],
    build: (k) => {
      k.add(disc(55, 0x80c26b, 0));
      k.add(table(2.4, 1.3, 0.8, 0xc48b52), 0, 0, 0);
      k.add(tree(4.4, 0x6ac460, 2), -4.5, 0, -3.5);
      k.add(tree(4.0, 0x7fd16b, 7), 4.8, 0, -3.2);
      const rings: THREE.Sprite[] = [];
      for (let i = 0; i < 4; i++) {
        const sp = sprite('ring', 2.5 + i * 1.4, 0xffe484, true, 0.45);
        sp.position.set(0, 1.6, -0.8);
        k.root.add(sp);
        rings.push(sp);
      }

      const whale = k.actor('whale', 1.08);
      const claude = k.actor('claude', 1.08);
      const teacup = k.thing('prop_teacup', 0.86);
      const bowl = k.thing('prop_bowl', 0.86);

      const A = cam([0, 2.2, 6.8], [0, 1.4, 0], 36);
      const B = cam([0, 1.9, 5.2], [0, 1.45, 0], 32);
      return ({ u, T, bt }) => {
        whale.act('sway', T).at(-1.35, 0, 0.5).emote('fx_heart', T).lift(bt.pulse * 0.06);
        claude.act('idle', T).at(1.35, 0, 0.5).flip().emote('fx_steam', T);
        bowl.at(-0.48, 0.84, 0.25);
        teacup.at(0.48, 0.84, 0.25);

        rings.forEach((sp, i) => {
          const ph = (T * 0.6 + i * 0.25) % 1;
          sp.scale.setScalar(1.5 + ph * 6.5);
          setOp(sp, (1 - ph) * (0.55 + 0.25 * bt.pulse));
        });
        return glide(A, B, u);
      };
    },
  },

  {
    id: 'L11',
    look: 'dusk',
    title: '我会再变得坚强一点点',
    note: '海风吹拂暮色礁石悬崖，本鲸昂首向前伸手立誓，龙娘 GPT 在晚霞天际振翅护航。',
    cast: ['whale', 'gpt'],
    build: (k) => {
      k.add(disc(70, 0x2b5080, -0.2));
      k.add(straightRiver(70, 35, 0.25, -14, 0.05, 0x3b6ca8, 0x1e3866).mesh);
      k.add(rock(2.6, 0x7d768d, 1), 0, 0.2, 0.2);
      k.add(rock(1.8, 0x6f6880, 2), -2.4, -0.2, 0.8);
      k.add(rock(1.6, 0x6f6880, 3), 2.3, -0.3, 0.6);

      const whale = k.actor('whale', 1.12);
      const gpt = k.actor('gpt', 1.2);
      const stars = makeParticles(k, 'star', 18, 0xffd166, [12, 5, 6], [0, 4.0, -2], 0.34, true);

      const A = cam([-2.8, 2.4, 8.6], [0, 2.5, 0], 40);
      const B = cam([0.4, 2.9, 5.9], [0, 2.7, 0], 33);
      return ({ u, T, bt }) => {
        whale.act(u < 0.5 ? 'point' : 'nod', T, u < 0.5 ? 50.1 : 51.8).at(0, 1.55, 0.3).sq(bt.pulse * 0.06);
        if (u > 0.5) whale.emote('fx_shine', T);

        gpt.act('hover', T).at(lerp(-3.5, 2.4, ease(u)), 4.6 + Math.sin(T * 2.8) * 0.25, -3.5).noShadow();
        stars.forEach((p) => {
          p.sp.position.x = p.x + Math.sin(T + p.ph) * 0.6;
          setOp(p.sp, 0.5 + 0.45 * bt.pulse);
        });
        return glide(A, B, u);
      };
    },
  },

  {
    id: 'L12',
    look: 'cozy',
    title: '因为你太柔软',
    note: '温柔花房里落英缤纷，小克轻抱书本有些脆弱低头，本鲸撑起一把暖粉色雨伞为她挡下微风。',
    cast: ['whale', 'claude'],
    build: (k) => {
      k.add(disc(45, 0x8dc782, 0));
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        k.add(flower(i % 2 ? 0xff9ebb : 0xffe494, 0.62), Math.cos(a) * 3.8, 0, Math.sin(a) * 3.2 - 0.5);
      }
      const umb = umbrella(1.55, 0xf27d9b, 2.15);
      k.add(umb, 0.2, 0.4, 0.15);

      const whale = k.actor('whale', 1.05);
      const claude = k.actor('claude', 1.05);
      const bookP = k.thing('prop_book', 0.85);
      const petals = makeParticles(k, 'petal', 26, 0xffb8cf, [10, 5, 6], [0, 2.8, 0], 0.32);

      const A = cam([1.8, 2.1, 6.8], [0.1, 1.4, 0.2], 35);
      const B = cam([-0.5, 1.85, 5.2], [0.1, 1.4, 0.2], 31);
      return ({ u, T, bt }) => {
        umb.rotation.z = Math.sin(T * 2) * 0.05 - 0.08;
        whale.act('idle', T).at(-0.85, 0, 0.45).sq(bt.pulse * 0.04);
        claude.act(u < 0.55 ? 'sad' : 'idle', T).at(0.92, 0, 0.45).flip();
        if (u >= 0.55) claude.emote('fx_heart', T);
        bookP.at(0.38, 0.55, 0.72);

        petals.forEach((p) => {
          p.sp.position.set(p.x + Math.sin(T * 1.4 + p.ph) * 0.9, 5.0 - ((p.y + T * 0.85) % 4.6), p.z);
        });
        return glide(A, B, u);
      };
    },
  },

  {
    id: 'L13',
    look: 'stage',
    title: '交换无名指金色的契约',
    note: '全片视觉高光：两枚巨大的金色指环在星光舞台上空交扣旋转，本鲸与小克相向而立立下金色誓约。',
    cast: ['whale', 'claude'],
    fx: { flash: [0.02] },
    build: (k) => {
      k.add(disc(50, 0x1d1738, 0));
      // 星光圆台
      k.add(box(6.6, 0.35, 4.4, 0x382860, 0.04), 0, 0, 0);
      k.add(box(5.8, 0.22, 3.6, 0xffd166, 0.03), 0, 0.35, 0);

      const ringL = goldenRing(1.45, 0.14, 0xffd24c);
      const ringR = goldenRing(1.45, 0.14, 0xffe484);
      k.add(ringL, -1.1, 3.3, -1.5);
      k.add(ringR, 1.1, 3.3, -1.5);

      const whale = k.actor('whale', 1.08);
      const claude = k.actor('claude', 1.08);
      const thread = goldenThread(9);
      k.root.add(thread.g);
      const stars = makeParticles(k, 'star', 32, 0xffe67a, [12, 6, 6], [0, 3.2, -1], 0.36, true);

      const A = cam([0, 2.5, 9.0], [0, 2.2, -0.5], 40);
      const B = cam([0, 2.2, 6.8], [0, 2.4, -0.6], 34);
      return ({ u, T, bt }) => {
        const join = ease(seg(u, 0.05, 0.72));
        ringL.position.set(lerp(-1.95, -0.62, join), 3.35 + Math.sin(T * 2.2) * 0.12, -1.4);
        ringR.position.set(lerp(1.95, 0.62, join), 3.35 - Math.sin(T * 2.2) * 0.12, -1.4);
        ringL.rotation.set(0.32, T * 0.9, 0.28);
        ringR.rotation.set(-0.32, -T * 0.9, -0.28);
        const sc = 1 + bt.pulse * 0.06;
        ringL.scale.setScalar(sc);
        ringR.scale.setScalar(sc);

        whale.act('hop', T).at(-1.15, 0.57, 0.3).emote('fx_heart', T);
        claude.act('curtsy', T, 55.8).at(1.15, 0.57, 0.3).flip().emote('fx_heart', T);
        thread.set(-0.7, 1.35, 0.35, 0.7, 1.35, 0.35, T, join);

        stars.forEach((p) => {
          p.sp.scale.setScalar(p.s * (0.7 + 0.5 * bt.pulse));
        });
        return glide(A, B, u);
      };
    },
  },

  {
    id: 'L14',
    look: 'golden',
    title: '给彼此岁月',
    note: '两只晶莹的金色沙漏并排流沙，搭配猫耳时钟与岁月卷轴，本鲸与小克相视行礼许下漫长光阴。',
    cast: ['whale', 'claude'],
    build: (k) => {
      k.add(disc(55, 0x88c273, 0));
      k.add(table(3.8, 1.4, 0.75, 0xb8814a), 0, 0, -0.5);
      const hg1 = hourglass(1.15, 0xffd166, 0x8a5a3c);
      const hg2 = hourglass(1.15, 0xff9ebb, 0x8a5a3c);
      k.add(hg1.g, -0.78, 0.76, -0.45);
      k.add(hg2.g, 0.78, 0.76, -0.45);

      const whale = k.actor('whale', 1.05);
      const claude = k.actor('claude', 1.05);
      const clockP = k.thing('prop_catclock', 0.88);
      const scrollP = k.thing('prop_scroll', 0.88);
      const stars = makeParticles(k, 'star', 16, 0xffe484, [8, 4, 4], [0, 2.4, -0.4], 0.28, true);

      const A = cam([-1.4, 2.3, 6.8], [0, 1.4, -0.3], 36);
      const B = cam([1.4, 2.0, 5.8], [0, 1.4, -0.3], 33);
      return ({ u, T, bt }) => {
        hg1.set(0.15 + u * 0.75, T, true);
        hg2.set(0.85 - u * 0.7, T, true);
        clockP.at(-1.6, 0.9, -0.4);
        scrollP.at(1.6, 0.9, -0.4);

        whale.act('bow', T, 59.3).at(-2.25, 0, 0.6).sq(bt.pulse * 0.04);
        claude.act('curtsy', T, 59.3).at(2.25, 0, 0.6).flip().sq(bt.pulse * 0.04);
        stars.forEach((p) => {
          p.sp.position.y = p.y + Math.sin(T * 2 + p.ph) * 0.2;
        });
        return glide(A, B, u);
      };
    },
  },

  {
    id: 'L15',
    look: 'dusk',
    title: '说好从今以后都牵着手',
    note: '暮色小镇七彩河石拱桥上灯笼渐亮，本鲸与小克并肩跨过拱桥，两人之间跃动着金色牵手星带。',
    cast: ['whale', 'claude'],
    build: (k) => {
      const town = getTown(k);
      const zb = town.zAt(8);
      const whale = k.actor('whale', 1.02);
      const claude = k.actor('claude', 1.02);
      const thread = goldenThread(7);
      k.root.add(thread.g);

      const A = cam([19.5, 5.8, zb + 6.5], [8, 3.4, zb], 38);
      const B = cam([18.5, 5.2, zb - 6.0], [8, 3.4, zb], 36);
      return ({ u, T, bt }) => {
        useTown(k, town, 0.95, true, 0xffd2b8);
        const bu = lerp(0.24, 0.76, ease(u));
        const bz = zb + (0.5 - bu) * 19;
        const by = bridgeY(bu);
        whale.walkBy(bu * 16).at(7.35, by, bz).sq(bt.pulse * 0.05);
        claude.walkBy(bu * 16).at(8.65, by, bz).sq(bt.pulse * 0.05);
        thread.set(7.65, by + 0.85, bz + 0.1, 8.35, by + 0.85, bz + 0.1, T, 1);
        return glide(A, B, u);
      };
    },
  },

  {
    id: 'L16',
    look: 'dusk',
    title: '因为要走很远',
    note: '镜头从山坡后方缓缓拉高，本鲸与小克站在山脊远眺绵延向金色地平线的弯弯小路。',
    cast: ['whale', 'claude'],
    build: (k) => {
      k.add(disc(80, 0x5c9660, 0));
      k.add(hill(14, 3.2, 0x4f8956), 0, -1.6, 2);
      k.add(hill(22, 7.5, 0x4b5c82), -18, -1, -24);
      k.add(hill(26, 9.0, 0x3e4d73), 18, -1, -28);
      // 通往远方的金色小路
      const roadCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 1.5, 1),
        new THREE.Vector3(-2.5, 0.6, -7),
        new THREE.Vector3(2.8, 0.3, -16),
        new THREE.Vector3(-1.5, 0.2, -28),
      ]);
      k.add(ribbon(roadCurve, 2.2, 32, toon(0xf2c97d), 0.12));

      const whale = k.actor('whale', 1.0);
      const claude = k.actor('claude', 1.0);
      const thread = goldenThread(7);
      k.root.add(thread.g);
      const stars = makeParticles(k, 'star', 22, 0xffe494, [18, 6, 12], [0, 5.5, -10], 0.36, true);

      const A = cam([0, 3.3, 7.2], [0, 2.3, -4], 40);
      const B = cam([0, 6.2, 10.6], [0, 2.4, -12], 44);
      return ({ u, T, bt }) => {
        whale.act('wave', T).at(-0.78, 1.55, 1.4).sq(bt.pulse * 0.04);
        claude.act('idle', T).at(0.78, 1.55, 1.4).flip().emote('fx_heart', T);
        thread.set(-0.42, 2.25, 1.55, 0.42, 2.25, 1.55, T, 1);
        stars.forEach((p) => {
          setOp(p.sp, 0.45 + 0.5 * Math.sin(T * 2.5 + p.ph));
        });
        return track([[0, A], [1, B]], u);
      };
    },
  },
];
