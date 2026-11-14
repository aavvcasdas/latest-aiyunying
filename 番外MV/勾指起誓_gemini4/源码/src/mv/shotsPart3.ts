import * as THREE from 'three';
import { cam, glide, track, type Kit, type ShotDef } from '../engine/core';
import {
  box, disc, ease, easeOut, flower, lantern, lerp, pine, seg, setOp, sprite,
} from '../engine/kit';
import { book, buildTown, castle, Fireworks, hill, useTown, type Town } from '../engine/sets';
import { hourglass, sheet, writeLine } from '../engine/props';
import { campfire, fullMoon, goldenRing, goldenThread } from './customProps';

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

export const SHOTS_PART3: ShotDef[] = [
  // ── 桥段间奏 B1–B4 ──────────────────────────────────────────────────────
  {
    id: 'B1',
    look: 'night',
    title: '桥段·星空篝火围坐',
    note: '满天繁星的草坡上，八位像素伙伴围着温暖的篝火轻声摇摆，龙娘在星夜上方静静守望。',
    cast: ['whale', 'claude', 'doubao', 'gemini', 'kimi', 'qwen', 'zai', 'gpt'],
    build: (k) => {
      k.add(disc(65, 0x1d2b3a, 0));
      for (let i = -4; i <= 4; i++) {
        if (Math.abs(i) < 2) continue;
        k.add(pine(4.2 + (Math.abs(i) % 2) * 1.1, 0x1c3a3e), i * 3.1, 0, -5.5 - Math.abs(i));
      }
      const fire = campfire();
      k.add(fire.g, 0, 0, 0.2);

      const whale = k.actor('whale', 0.98);
      const claude = k.actor('claude', 0.98);
      const doubao = k.actor('doubao', 0.95);
      const gemini = k.actor('gemini', 0.95);
      const kimi = k.actor('kimi', 0.95);
      const qwen = k.actor('qwen', 0.95);
      const zai = k.actor('zai', 0.95);
      const gpt = k.actor('gpt', 1.12);
      const sparks = makeParticles(k, 'glow', 20, 0xffae42, [3.2, 4.5, 2.5], [0, 2.2, 0.2], 0.22, true);

      const A = cam([-3.4, 2.8, 9.2], [0, 1.3, 0], 40);
      const B = cam([3.4, 2.5, 8.2], [0, 1.4, 0], 37);
      return ({ u, T, bt }) => {
        fire.flames[0].scale.set(1 + bt.pulse * 0.14, 1 + Math.sin(T * 11) * 0.14, 1);
        fire.flames[1].scale.set(1 + Math.cos(T * 13) * 0.12, 1 + bt.pulse * 0.18, 1);

        whale.act('sway', T).at(-1.45, 0, 1.15).sq(bt.pulse * 0.05);
        claude.act('read', T).at(1.45, 0, 1.15).flip();
        doubao.act('sway', T).at(-3.1, 0, 0.2).lift(bt.pulse * 0.08);
        gemini.act('idle', T).at(3.1, 0, 0.2).flip();
        kimi.act('nod', T).at(-2.3, 0, -1.6);
        qwen.act('idle', T).at(0, 0, -2.0);
        zai.act('doze', T).at(2.3, 0, -1.6).flip().emote('fx_zzz', T);
        gpt.act('float', T).at(0, 4.3 + Math.sin(T * 2.2) * 0.2, -2.6).noShadow();

        sparks.forEach((p) => {
          p.sp.position.y = 0.7 + ((p.y + T * 1.1) % 4.0);
          setOp(p.sp, 0.55 + 0.4 * bt.pulse);
        });
        return glide(A, B, u);
      };
    },
  },

  {
    id: 'B2',
    look: 'night',
    title: '桥段·祈愿天灯升空',
    note: '满屏温暖的金色天灯随节奏缓缓升上夜空，所有角色仰首放飞心愿，情绪层层蓄力！',
    cast: ['whale', 'claude', 'doubao', 'kimi', 'qwen'],
    build: (k) => {
      k.add(disc(65, 0x161b33, 0));
      k.add(fullMoon(2.6), -6.5, 6.4, -18);
      const lanterns: { g: THREE.Group; x: number; y0: number; z: number; spd: number; ph: number }[] = [];
      for (let i = 0; i < 24; i++) {
        const lt = lantern(i % 3 === 0 ? 0xffe27a : 0xffb347, 0.22 + (i % 3) * 0.05);
        const x = (k.rnd() - 0.5) * 16;
        const y0 = 1.0 + k.rnd() * 6.5;
        const z = -1.5 - k.rnd() * 10;
        k.add(lt, x, y0, z);
        lanterns.push({ g: lt, x, y0, z, spd: 0.45 + k.rnd() * 0.55, ph: k.rnd() * 6.28 });
      }
      const whale = k.actor('whale', 1.04);
      const claude = k.actor('claude', 1.04);
      const doubao = k.actor('doubao', 0.96);
      const kimi = k.actor('kimi', 0.96);
      const qwen = k.actor('qwen', 0.96);

      const A = cam([0, 2.0, 8.8], [0, 2.4, -2], 42);
      const B = cam([0, 3.6, 8.0], [0, 4.4, -4], 40);
      return ({ u, T, bt }) => {
        lanterns.forEach((l) => {
          l.g.position.set(l.x + Math.sin(T * 1.2 + l.ph) * 0.45, ((l.y0 + T * l.spd) % 9.5) + 0.6, l.z);
        });
        whale.act('wave', T).at(-1.0, 0, 1.3).emote('fx_sparkle', T);
        claude.act('idle', T).at(1.0, 0, 1.3).flip().emote('fx_heart', T);
        doubao.act('hop', T).at(-3.2, 0, 0.8).lift(bt.pulse * 0.12);
        kimi.act('idle', T).at(3.2, 0, 0.8).flip();
        qwen.act('bow', T, 141.0).at(0, 0, -0.4);
        return glide(A, B, u);
      };
    },
  },

  {
    id: 'B3',
    look: 'night',
    title: '桥段·城堡烟花初绽',
    note: '绚烂的立体烟花在童话城堡夜空接连绽放，八位角色欢呼跳跃迎接全曲最高潮。',
    cast: ['whale', 'claude', 'doubao', 'gemini', 'kimi', 'qwen', 'zai', 'gpt'],
    build: (k) => {
      k.add(disc(70, 0x1b2442, 0));
      k.add(castle(), 0, 0, -14, 0, 0.9);
      const fw = new Fireworks(k.root, 5, 22, 6.2);

      const whale = k.actor('whale', 1.0);
      const claude = k.actor('claude', 1.0);
      const doubao = k.actor('doubao', 0.96);
      const gemini = k.actor('gemini', 0.96);
      const kimi = k.actor('kimi', 0.96);
      const qwen = k.actor('qwen', 0.96);
      const zai = k.actor('zai', 0.96);
      const gpt = k.actor('gpt', 1.15);

      const A = cam([-3.0, 2.2, 10.6], [0, 4.2, -8], 44);
      const B = cam([3.0, 2.8, 9.2], [0, 5.2, -8], 42);
      return ({ u, T, bt }) => {
        fw.update(T, 0, 12.2, -16, 18, 1.5);
        whale.act('hop', T).at(-1.0, 0, 1.5).lift(bt.pulse * 0.14);
        claude.act('hop', T).at(1.0, 0, 1.5).flip().lift(bt.pulse * 0.14);
        doubao.act('hop', T).at(-2.8, 0, 1.2).lift(bt.pulse * 0.16);
        gemini.act('spin', T).at(2.8, 0, 1.2).flip();
        kimi.act('hop', T).at(-4.5, 0, 0.8);
        qwen.act('spin', T).at(4.5, 0, 0.8).flip();
        zai.act('hop', T).at(0, 0, 0.4);
        gpt.act('hover', T).at(Math.sin(T * 1.4) * 3.8, 5.6 + Math.cos(T * 2.2) * 0.3, -4.5).noShadow();
        return glide(A, B, u);
      };
    },
  },

  {
    id: 'B4',
    look: 'magic',
    title: '桥段·屏息聚光时刻',
    note: '飞舞的金色书页卷成光环，镜头向着中央聚光灯里的本鲸与小克急速推进，准备迎接清唱「所以」！',
    cast: ['whale', 'claude'],
    fx: { whiteOut: true },
    build: (k) => {
      k.add(disc(55, 0x1b1433, 0));
      const pages: { m: THREE.Mesh; a: number; r: number }[] = [];
      for (let i = 0; i < 12; i++) {
        const pg = sheet(0.68, 0.88, (c, W, H) => {
          c.fillStyle = '#fff9e6';
          c.fillRect(0, 0, W, H);
          writeLine(c, W, H, '起誓', 0.5, 0.28, '#9a6835');
        });
        k.root.add(pg);
        pages.push({ m: pg, a: (i / 12) * Math.PI * 2, r: 4.5 + (i % 3) * 1.1 });
      }
      const glow = sprite('glow', 5.5, 0xffe494, true, 0.8);
      glow.position.set(0, 1.8, -0.5);
      k.root.add(glow);

      const whale = k.actor('whale', 1.06);
      const claude = k.actor('claude', 1.06);

      const A = cam([0, 3.2, 10.2], [0, 1.7, 0], 42);
      const B = cam([0, 1.85, 4.9], [0, 1.5, 0], 30);
      return ({ u, T, bt }) => {
        pages.forEach((p, idx) => {
          const ang = p.a + T * 1.3;
          const rad = lerp(p.r, 1.8, ease(u));
          p.m.position.set(Math.cos(ang) * rad, 1.2 + (idx % 4) * 0.75 + u * 1.4, Math.sin(ang) * rad * 0.65);
          p.m.rotation.set(T + idx, ang, 0.3);
        });
        glow.scale.setScalar(3.8 + ease(u) * 3.2 + bt.pulse * 0.4);
        whale.act('idle', T).at(lerp(-1.9, -0.95, ease(u)), 0, 0.4);
        claude.act('idle', T).at(lerp(1.9, 0.95, ease(u)), 0, 0.4).flip();
        return glide(A, B, u);
      };
    },
  },

  // ── 终章副歌 L33–L41 ────────────────────────────────────────────────────
  {
    id: 'L33',
    look: 'stage',
    title: '所以',
    note: '全曲最动人的清唱瞬切！聚光灯定格在本鲸伸手迈步的一刹那，金色星尘停在半空闪耀。',
    cast: ['whale'],
    fx: { whiteIn: true, flash: [0.88] },
    build: (k) => {
      k.add(disc(40, 0x1a1333, 0));
      const halo = sprite('glow', 4.6, 0xffe27a, true, 0.85);
      halo.position.set(0, 1.4, -0.5);
      k.root.add(halo);
      const whale = k.actor('whale', 1.22);
      const stars = makeParticles(k, 'star', 18, 0xfff0a0, [5, 3.5, 3], [0, 1.8, 0], 0.32, true);

      const A = cam([0, 1.7, 5.4], [0, 1.35, 0], 34);
      const B = cam([0, 1.65, 4.1], [0, 1.35, 0], 29);
      return ({ u, T }) => {
        whale.act('point', T).at(0, 0, 0.2).emote('fx_exclaim', T);
        halo.scale.setScalar(4.0 + easeOut(u) * 2.2);
        stars.forEach((p) => {
          p.sp.scale.setScalar(p.s * (0.85 + 0.4 * u));
        });
        return glide(A, B, u);
      };
    },
  },

  {
    id: 'L34',
    look: 'golden',
    title: '让我再靠近一点点',
    note: '金色花原上，本鲸与小克从画面两侧奔向彼此，恰好在 02:40.8 鼓点骤停的那一刻于中央相逢！',
    cast: ['whale', 'claude'],
    build: (k) => {
      k.add(disc(65, 0x82c96e, 0));
      for (let i = 0; i < 20; i++) k.add(flower(i % 2 ? 0xffd166 : 0xff8fab, 0.55), (k.rnd() - 0.5) * 14, 0, -2.5 + (k.rnd() - 0.5) * 6);
      const whale = k.actor('whale', 1.08);
      const claude = k.actor('claude', 1.08);
      const thread = goldenThread(9);
      k.root.add(thread.g);

      const A = cam([0, 2.2, 8.6], [0, 1.35, 0], 38);
      const B = cam([0, 1.9, 5.8], [0, 1.35, 0], 32);
      return ({ u, T, bt }) => {
        const meet = ease(seg(u, 0, 0.92));
        const wx = lerp(-4.2, -0.78, meet);
        const cx = lerp(4.2, 0.78, meet);
        if (meet < 0.95) {
          whale.walkBy(Math.abs(wx + 4.2)).at(wx, 0, 0.5).sq(bt.pulse * 0.06);
          claude.walkBy(Math.abs(4.2 - cx)).at(cx, 0, 0.5).flip().sq(bt.pulse * 0.06);
        } else {
          whale.act('hop', T).at(wx, 0, 0.5).emote('fx_heart', T);
          claude.act('hop', T).at(cx, 0, 0.5).flip().emote('fx_heart', T);
        }
        thread.set(wx + 0.3, 0.85, 0.65, cx - 0.3, 0.85, 0.65, T, seg(u, 0.55, 0.95));
        return glide(A, B, u);
      };
    },
  },

  {
    id: 'L35',
    look: 'stage',
    title: '因为你太温暖',
    note: '02:41 鼓点重新炸响的瞬间，漫天金色爱心与烟花在两人身后盛大绽放！',
    cast: ['whale', 'claude'],
    fx: { flash: [0.05] },
    build: (k) => {
      k.add(disc(55, 0x261a44, 0));
      const fw = new Fireworks(k.root, 4, 20, 4.8);

      const whale = k.actor('whale', 1.12);
      const claude = k.actor('claude', 1.12);
      const hearts = makeParticles(k, 'heart', 20, 0xff7096, [8, 4.5, 4], [0, 2.5, 0], 0.36);

      const A = cam([0, 2.0, 7.2], [0, 1.8, -1], 38);
      const B = cam([0, 2.3, 5.8], [0, 2.0, -1], 34);
      return ({ u, T, bt }) => {
        fw.update(T, 0, 6.6, -9, 10, 1.3);
        whale.act('hop', T).at(-0.92, 0, 0.5).emote('fx_heart', T).lift(bt.pulse * 0.14);
        claude.act('hop', T).at(0.92, 0, 0.5).flip().emote('fx_heart', T).lift(bt.pulse * 0.14);
        hearts.forEach((p) => {
          p.sp.position.y = 0.8 + ((p.y + T * 1.4) % 4.5);
          p.sp.scale.setScalar(p.s * (0.85 + 0.35 * bt.pulse));
        });
        return glide(A, B, u);
      };
    },
  },

  {
    id: 'L36',
    look: 'dusk',
    title: '我会再变得坚强一点点',
    note: '暮光山巅，本鲸充满自信地昂首跳跃，龙娘 GPT 在身后张开金翼、狐狸智谱在旁守护。',
    cast: ['whale', 'gpt', 'zai'],
    build: (k) => {
      k.add(disc(65, 0x5d9460, 0));
      k.add(hill(14, 3.2, 0x4f8454), 0, -1.6, 0);
      const aura = sprite('ring', 3.8, 0xffe066, true, 0.8);
      aura.position.set(0, 2.2, 0.1);
      k.root.add(aura);

      const whale = k.actor('whale', 1.12);
      const gpt = k.actor('gpt', 1.24);
      const zai = k.actor('zai', 0.98);

      const A = cam([-2.2, 2.4, 7.8], [0, 2.3, 0], 38);
      const B = cam([1.4, 2.8, 6.4], [0, 2.5, 0], 34);
      return ({ u, T, bt }) => {
        aura.scale.setScalar(2.6 + bt.pulse * 1.2 + ease(u) * 1.2);
        whale.act('hop', T).at(0, 1.55, 0.4).emote('fx_shine', T).lift(bt.pulse * 0.14);
        gpt.act('hover', T).at(0, 4.4 + Math.sin(T * 3) * 0.2, -1.5).noShadow();
        zai.act('nod', T).at(2.4, 1.3, 0.2).flip();
        return glide(A, B, u);
      };
    },
  },

  {
    id: 'L37',
    look: 'golden',
    title: '因为你太柔软',
    note: '温柔慢镜特写：戴着金色小皇冠的小克在纷飞花瓣与金色光柱间提裙浅笑，温柔动人。',
    cast: ['claude'],
    build: (k) => {
      k.add(disc(50, 0x8bc97c, 0));
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        k.add(flower(i % 2 ? 0xff9ebb : 0xffe484, 0.58), Math.cos(a) * 3.2, 0, Math.sin(a) * 3.2);
      }
      const claude = k.actor('claude', 1.2);
      const petals = makeParticles(k, 'petal', 28, 0xffbfd4, [8, 5, 5], [0, 2.6, 0], 0.32);

      const A = cam([-1.0, 1.9, 5.6], [0, 1.35, 0], 34);
      const B = cam([0.8, 1.75, 4.6], [0, 1.38, 0], 30);
      return ({ u, T, bt }) => {
        claude.act('curtsy', T, 166.6).at(0, 0, 0.2).emote('fx_heart', T).sq(bt.pulse * 0.04);
        petals.forEach((p) => {
          p.sp.position.set(p.x + Math.sin(T * 1.4 + p.ph) * 0.8, 4.8 - ((p.y + T * 0.8) % 4.5), p.z);
        });
        return glide(A, B, u);
      };
    },
  },

  {
    id: 'L38',
    look: 'stage',
    title: '交换无名指金色的契约',
    note: '终极高潮！童话城堡上空两枚巨型金环璀璨交汇，烟花漫天齐放，全部八位像素角色弧形排开共同见证誓约！',
    cast: ['whale', 'claude', 'doubao', 'gemini', 'kimi', 'qwen', 'zai', 'gpt'],
    fx: { flash: [0.02] },
    build: (k) => {
      k.add(disc(70, 0x201840, 0));
      k.add(castle(), 0, 0, -15, 0, 0.92);
      k.add(box(7.6, 0.4, 4.8, 0xffd166, 0.04), 0, 0, 0.4);

      const ringL = goldenRing(1.85, 0.17, 0xffd24c);
      const ringR = goldenRing(1.85, 0.17, 0xffe994);
      k.add(ringL, -0.8, 4.4, -3.5);
      k.add(ringR, 0.8, 4.4, -3.5);

      const fw = new Fireworks(k.root, 6, 24, 6.8);

      const whale = k.actor('whale', 1.1);
      const claude = k.actor('claude', 1.1).wear('crown');
      const doubao = k.actor('doubao', 0.96);
      const gemini = k.actor('gemini', 0.96);
      const kimi = k.actor('kimi', 0.96);
      const qwen = k.actor('qwen', 0.96);
      const zai = k.actor('zai', 0.96);
      const gpt = k.actor('gpt', 1.18);
      const thread = goldenThread(9);
      k.root.add(thread.g);

      const A = cam([0, 2.8, 11.4], [0, 3.0, -2.5], 44);
      const B = cam([0, 3.2, 8.8], [0, 3.2, -2.5], 38);
      return ({ u, T, bt }) => {
        fw.update(T, 0, 12.5, -16, 20, 1.4);
        const join = ease(seg(u, 0, 0.65));
        ringL.position.set(lerp(-2.3, -0.78, join), 4.5 + Math.sin(T * 2.5) * 0.15, -3.4);
        ringR.position.set(lerp(2.3, 0.78, join), 4.5 - Math.sin(T * 2.5) * 0.15, -3.4);
        ringL.rotation.set(0.32, T * 0.95, 0.25);
        ringR.rotation.set(-0.32, -T * 0.95, -0.25);

        whale.act('hop', T).at(-1.05, 0.42, 0.8).emote('fx_heart', T).lift(bt.pulse * 0.14);
        claude.act('hop', T).at(1.05, 0.42, 0.8).flip().emote('fx_heart', T).lift(bt.pulse * 0.14);
        thread.set(-0.62, 1.3, 0.95, 0.62, 1.3, 0.95, T, 1);

        doubao.act('sway', T).at(-3.1, 0.42, 0.5).lift(bt.pulse * 0.1);
        gemini.act('spin', T).at(3.1, 0.42, 0.5).flip();
        kimi.act('hop', T).at(-4.9, 0, 0.2);
        qwen.act('spin', T).at(4.9, 0, 0.2).flip();
        zai.act('hop', T).at(0, 0.42, -0.9);
        gpt.act('hover', T).at(Math.sin(T * 1.8) * 3.0, 6.2, -5.5).noShadow();
        return glide(A, B, u);
      };
    },
  },

  {
    id: 'L39',
    look: 'golden',
    title: '给彼此岁月',
    note: 'Kimi 展卷将漫长光阴化作金色画轴，沙漏流转不息，本鲸与小克再次郑重鞠躬回礼。',
    cast: ['whale', 'claude', 'kimi'],
    build: (k) => {
      k.add(disc(60, 0x88c474, 0));
      const hg1 = hourglass(1.05, 0xffd166);
      const hg2 = hourglass(1.05, 0xff9ebb);
      k.add(hg1.g, -2.5, 0, 0.2);
      k.add(hg2.g, 2.5, 0, 0.2);

      const banner = sheet(4.6, 1.25, (c, W, H) => {
        c.fillStyle = '#fff9e6';
        c.fillRect(0, 0, W, H);
        c.strokeStyle = '#e5b858';
        c.lineWidth = 10;
        c.strokeRect(12, 12, W - 24, H - 24);
        writeLine(c, W, H, '岁岁年年 常伴身旁', 0.5, 0.34, '#6b4226');
      });
      banner.rotation.x = Math.PI / 2;
      k.add(banner, 0, 3.0, -1.8);

      const whale = k.actor('whale', 1.06);
      const claude = k.actor('claude', 1.06);
      const kimi = k.actor('kimi', 1.0);
      const scroll = k.thing('prop_scroll', 0.9);

      const A = cam([0, 2.3, 7.8], [0, 1.8, -0.4], 38);
      const B = cam([0.8, 2.2, 6.4], [0, 1.8, -0.4], 34);
      return ({ u, T, bt }) => {
        hg1.set(0.2 + u * 0.75, T, true);
        hg2.set(0.8 - u * 0.7, T, true);
        banner.position.y = 3.0 + Math.sin(T * 2.2) * 0.1;

        whale.act('bow', T, 172.3).at(-1.25, 0, 0.7).sq(bt.pulse * 0.04);
        claude.act('curtsy', T, 172.3).at(1.25, 0, 0.7).flip().emote('fx_heart', T);
        kimi.act('nod', T).at(0, 0, -0.8);
        scroll.at(0.7, 0.65, -0.55);
        return glide(A, B, u);
      };
    },
  },

  {
    id: 'L40',
    look: 'day',
    title: '说好从今以后都牵着手',
    note: '阳光明媚的童话镇广场全员谢幕漫步！本鲸与小克牵着金色星光领队前行，六位伙伴在身旁挥手共舞，远方是城堡尖顶。',
    cast: ['whale', 'claude', 'doubao', 'gemini', 'kimi', 'qwen', 'zai', 'gpt'],
    build: (k) => {
      const town = getTown(k);
      const whale = k.actor('whale', 1.05);
      const claude = k.actor('claude', 1.05);
      const doubao = k.actor('doubao', 0.96);
      const gemini = k.actor('gemini', 0.96);
      const kimi = k.actor('kimi', 0.96);
      const qwen = k.actor('qwen', 0.96);
      const zai = k.actor('zai', 0.96);
      const gpt = k.actor('gpt', 1.16);
      const thread = goldenThread(7);
      k.root.add(thread.g);
      const petals = makeParticles(k, 'petal', 24, 0xffb8cf, [14, 5, 8], [33, 3.0, 17], 0.32);

      const A = cam([33, 3.2, 26.8], [33, 1.8, 16.0], 40);
      const B = cam([33, 4.8, 30.2], [33.5, 2.2, 13.0], 42);
      return ({ u, T, bt }) => {
        useTown(k, town, 1.0, false);
        const z = lerp(15.2, 19.0, ease(u));
        whale.walkBy(Math.abs(z - 15.2)).at(32.25, 0.05, z).sq(bt.pulse * 0.06);
        claude.walkBy(Math.abs(z - 15.2)).at(33.75, 0.05, z).sq(bt.pulse * 0.06);
        thread.set(32.62, 0.9, z + 0.1, 33.38, 0.9, z + 0.1, T, 1);

        doubao.act('hop', T).at(30.5, 0.05, z - 0.6).lift(bt.pulse * 0.12);
        gemini.act('sway', T).at(35.5, 0.05, z - 0.6).flip();
        kimi.act('nod', T).at(28.8, 0.05, z - 1.2);
        qwen.act('spin', T).at(37.2, 0.05, z - 1.2).flip();
        zai.act('hop', T).at(27.2, 0.05, z - 1.8);
        gpt.act('hover', T).at(33 + Math.sin(T * 2.0) * 3.2, 5.0, z - 2.2).noShadow();

        petals.forEach((p) => {
          p.sp.position.y = 5.5 - ((p.y + T * 0.9) % 5.0);
        });
        return glide(A, B, u);
      };
    },
  },

  {
    id: 'L41',
    look: 'golden',
    title: '因为要走很远',
    note: '夕阳山脊上，本鲸与小克并肩挥手面向无尽金色星途，与序章呼应，留驻最绵长的温暖。',
    cast: ['whale', 'claude'],
    build: (k) => {
      k.add(disc(75, 0x76b868, 0));
      k.add(hill(16, 3.6, 0x62a858), 0, -1.8, 1);
      k.add(hill(22, 6.2, 0x568c5c), -18, -1, -20);
      k.add(hill(24, 7.2, 0x4d7e57), 18, -1, -22);
      for (let i = 0; i < 14; i++) k.add(flower(i % 2 ? 0xffd166 : 0xff8fab, 0.52), -6.5 + i, 1.3 + Math.sin(i) * 0.25, 0.5);

      const whale = k.actor('whale', 1.08);
      const claude = k.actor('claude', 1.08);
      const thread = goldenThread(9);
      k.root.add(thread.g);
      const stars = makeParticles(k, 'star', 24, 0xffe484, [14, 6, 8], [0, 3.8, -2], 0.36, true);

      const A = cam([0, 3.1, 6.6], [0, 2.3, 0], 34);
      const B = cam([0, 4.2, 9.8], [0, 2.5, -2], 38);
      return ({ u, T, bt }) => {
        whale.act('wave', T).at(-0.85, 1.72, 1.0).emote('fx_heart', T).sq(bt.pulse * 0.04);
        claude.act('idle', T).at(0.85, 1.72, 1.0).flip().emote('fx_heart', T);
        thread.set(-0.45, 2.55, 1.15, 0.45, 2.55, 1.15, T, 1);

        stars.forEach((p) => {
          p.sp.position.y = 1.6 + ((p.y + T * 0.7) % 5.5);
          p.sp.scale.setScalar(p.s * (0.75 + 0.4 * bt.pulse));
        });
        return track([[0, A], [1, B]], u);
      };
    },
  },

  // ── 尾声 OUT ────────────────────────────────────────────────────────────
  {
    id: 'OUT',
    look: 'golden',
    title: '尾声·立体童话书合卷',
    note: '与开场首尾呼应：草坡上的立体童话书伴随尾音缓缓合上封面，最后一缕金色星光淡入夜色。',
    cast: ['whale', 'claude'],
    fx: { blackOut: true },
    build: (k) => {
      k.add(disc(60, 0x76b868, 0));
      k.add(hill(18, 4.2, 0x62a858), -16, -0.8, -16);
      k.add(hill(22, 5.2, 0x569a50), 17, -1.0, -18);
      const bk = book();
      bk.g.scale.setScalar(1.05);
      k.add(bk.g, 0, 0.15, 0);

      const whale = k.actor('whale', 0.9);
      const claude = k.actor('claude', 0.9);
      const star = sprite('star', 1.1, 0xffe680, true, 0.95);
      k.root.add(star);

      const A = cam([1.2, 4.2, 8.6], [0, 1.5, 0], 34);
      const B = cam([0, 7.4, 11.6], [0, 1.0, 0], 36);
      return ({ u, T }) => {
        const close = ease(seg(u, 0.1, 0.76));
        bk.cover.rotation.z = -(1 - close) * Math.PI * 0.92;
        setOp(bk.glow, (1 - close) * 0.65);

        const shrink = Math.max(0.01, 1 - ease(seg(u, 0.05, 0.55)));
        whale.act('wave', T).at(-1.35, 0.36, 0.3).size(shrink).alpha(shrink);
        claude.act('idle', T).at(1.35, 0.36, 0.3).flip().size(shrink).alpha(shrink);

        star.position.set(0, 1.5 + close * 1.4 + Math.sin(T * 3) * 0.08, 0.2);
        star.scale.setScalar(1.05 * (1 - seg(u, 0.75, 1.0)));
        return glide(A, B, u);
      };
    },
  },
];
