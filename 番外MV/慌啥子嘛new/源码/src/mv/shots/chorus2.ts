// 第五章：副歌二终章 L29–L36 · 诗意尾声 O1–O3
import * as THREE from 'three';
import { beatSq } from '../cues';
import { type ShotDef, cam, glide, track } from '../engine';
import {
  PI,
  TAU,
  backOut,
  clamp01,
  cyl,
  disc,
  ease,
  easeOut,
  hash,
  lerp,
  many,
  ribbon,
  seg,
  setOp,
  sprite,
  torus,
  waterMat,
} from '../kit';
import {
  WarmFireworks,
  archBridge,
  bambooChair,
  bambooCluster,
  bambooTable,
  banyanTree,
  bloomFlower,
  cloudPuff,
  crescentMoon3D,
  flipSign,
  fourLeafClover3D,
  gaiwanTea,
  hill,
  metronome3D,
  mountainBackdrop,
  mountainHouse,
  paperPlane,
  redLantern,
  rhythmPad,
  skyLantern,
  snail3D,
  sun3D,
  sundialPlaza,
  teaStorybook,
  teahouse,
} from '../world';

const ALL_EIGHT = ['zai', 'kimi', 'claude', 'whale', 'qwen', 'doubao', 'gemini', 'gpt'] as const;

export const CHORUS2_SHOTS: ShotDef[] = [
  // L29: 「慌啥子嘛 慢慢来」—— 全镇坝坝茶长桌盛宴，三只小蜗牛列队慢行
  {
    id: 'L29',
    look: 'teahouse',
    title: '满院茶香慢慢来',
    cast: ['whale', 'qwen', 'doubao', 'gemini', 'claude'],
    wordOpts: { pos: [0, 4.55, -1.4], scale: 1.02 },
    fx: { whiteIn: true },
    build: (k) => {
      k.add(disc(260, 0x86d470));
      mountainBackdrop(k.add(new THREE.Group()), 0x6ec28a, 0x68b0d4, true);
      k.add(cyl(11, 11.4, 0.18, 0xf2e8d6, 36, 0.045), 0, 0, -0.5);
      k.add(teahouse('茶'), 0, 0.18, -7.2);
      k.add(banyanTree(6.4, 0x54bf66, 40), -7.2, 0, -3.0);
      k.add(banyanTree(6.0, 0x5cc76e, 41), 7.2, 0, -3.0);
      many(6, (i) => k.add(redLantern(0.78), -6 + i * 2.4, 3.55, -2.6));

      // 三张相连竹茶桌与热气盖碗茶
      for (const tx of [-2.6, 0, 2.6]) {
        k.add(bambooTable(1.1), tx, 0.18, 0.45);
        k.add(gaiwanTea(1.05), tx, 1.32, 0.45);
      }
      k.add(flipSign('不急', 0xfff3d4), 5.2, 0.18, 0.2, -0.3);

      const snails = [0xe88f54, 0x7ac79c, 0xf2b857].map((c, i) =>
        k.add(snail3D(0.72, c), -3.2 + i * 1.45, 0.18, 2.95)
      );

      const cast = (['claude', 'doubao', 'whale', 'qwen', 'gemini'] as const).map((id) =>
        k.actor(id, 1.1)
      );
      const bowl = k.thing('prop_bowl', 0.95);
      const fan = k.thing('prop_fan', 0.92);

      const A = cam([-1.6, 3.3, 12.2], [0, 2.45, -0.5], 41);
      const B = cam([1.6, 2.95, 11.0], [0, 2.4, -0.4], 40);

      return ({ u, T, bt, wa }) => {
        const aSlow = wa(2) >= 0;
        const xs = [-3.4, -1.7, 0, 1.7, 3.4];
        const acts = ['nod', 'step', aSlow ? 'wave' : 'hop', 'sway', 'sway'] as const;
        cast.forEach((ac, i) => {
          ac.act(acts[i], T)
            .at(xs[i], 0.18, 1.35)
            .flip(i >= 3)
            .sq(beatSq(bt, 0.075))
            .emote(aSlow && i === 2 ? 'fx_heart' : null, T);
        });
        bowl.at(-0.55, 1.32, 0.65);
        fan.at(1.18, 1.12, 1.45).tilt(Math.sin(T * 4) * 0.25);

        snails.forEach((sn, i) => {
          sn.position.x = -3.2 + i * 1.45 + u * 1.1;
        });

        return glide(A, B, u);
      };
    },
  },

  // L30: 「太阳下山有月亮爬上来」—— 巨型金色浑天星轨拱环，日月同辉轮转
  {
    id: 'L30',
    look: 'sunset',
    lookTo: 'moonrise',
    title: '金轨星拱日月轮转',
    cast: ['gpt', 'claude', 'whale', 'zai', 'kimi'],
    wordOpts: { pos: [0, 4.55, -1.0], scale: 0.88 },
    build: (k) => {
      k.add(disc(280, 0x3f5785));
      mountainBackdrop(k.add(new THREE.Group()), 0x5c4c7d, 0x3b4880, false);
      k.add(cyl(8.6, 9.2, 0.28, 0xf2e4cc, 34, 0.045), 0, 0, 1.0);

      // 宏大金色日晷天穹圆环
      const arch = k.add(torus(9.2, 0.14, 0xffd166, 48, 0.03), 0, 0.5, -11.5);
      const sun = sun3D(2.15);
      k.add(sun.g, -7.2, 5.4, -11.5);
      const moon = k.add(crescentMoon3D(2.15), 7.2, 0.2, -11.5);
      const clouds = many(6, (i) =>
        k.add(cloudPuff(i * 7, 1.25, 0xefe8ff), -10 + i * 4, 0.8 + (i % 2) * 0.6, -9.8)
      );

      const ids = ['gpt', 'claude', 'whale', 'zai', 'kimi'] as const;
      const cast = ids.map((id) => k.actor(id, 1.1));
      const stars = many(26, () => k.add(sprite('star', 0.48, 0xfff0a3, true, 0)));

      const A = cam([0, 3.4, 13.0], [0, 3.1, -3.5], 42);
      const B = cam([0, 3.1, 11.8], [0, 3.2, -3.5], 41);

      return ({ u, T, bt, wa, ca }) => {
        void arch;
        const sinkP = wa(1) < 0 ? 0 : ease(clamp01(wa(1) / 1.4));
        // 太阳沿左侧金轨优雅落下
        const sunAng = lerp(PI * 0.72, PI * 0.98, sinkP);
        sun.g.position.set(Math.cos(sunAng) * 9.2, 0.5 + Math.sin(sunAng) * 8.2, -11.5);
        sun.rays.rotation.z = T * 0.65;

        const skyP = ease(clamp01((u - 0.18) / 0.64));
        k.lookMix(skyP);

        // 月亮沿右侧金轨在「月·亮·爬·上·来」逐字攀升至穹顶！
        const mBase = wa(3) < 0 ? 0 : easeOut(clamp01(wa(3) / 0.5)) * 0.35;
        const stepSum =
          (ca(7) < 0 ? 0 : easeOut(clamp01(ca(7) / 0.3)) * 0.2) +
          (ca(8) < 0 ? 0 : easeOut(clamp01(ca(8) / 0.3)) * 0.2) +
          (ca(9) < 0 ? 0 : easeOut(clamp01(ca(9) / 0.45)) * 0.25);
        const moonAng = lerp(PI * 0.02, PI * 0.33, clamp01(mBase + stepSum));
        moon.position.set(Math.cos(moonAng) * 9.2, 0.5 + Math.sin(moonAng) * 8.4, -11.5);
        moon.rotation.z = Math.sin(T * 1.6) * 0.08;

        clouds.forEach((c, i) => {
          c.position.y = 0.8 + (i % 2) * 0.6 + Math.sin(T * 1.5 + i) * 0.16;
        });

        cast.forEach((ac, i) => {
          const x = (i - 2) * 2.15;
          const act = ac.id === 'gpt' ? 'float' : ca(7) >= 0 ? 'hop' : 'idle';
          ac.act(act, T)
            .at(x, 0.28, 1.35 - Math.abs(i - 2) * 0.25)
            .flip(i >= 3)
            .sq(beatSq(bt, 0.065))
            .emote(ca(9) >= 0 && (i === 2 || i === 4) ? 'fx_sparkle' : null, T);
        });

        stars.forEach((st, i) => {
          st.position.set((hash(i) - 0.5) * 22, 3.8 + hash(i + 3) * 6.5, -10.5);
          setOp(st, skyP * (0.55 + 0.45 * Math.sin(T * 4.2 + i)));
        });

        return glide(A, B, u);
      };
    },
  },

  // L31: 「云会在 花会开」—— 云端花岛圆舞曲，漫天花雨纷飞
  {
    id: 'L31',
    look: 'meadow',
    title: '云端花岛盛放',
    cast: ['doubao', 'whale', 'kimi', 'qwen', 'gemini'],
    wordOpts: { pos: [0, 4.55, -1.3], scale: 1.04 },
    build: (k) => {
      k.add(disc(260, 0x84db6e));
      mountainBackdrop(k.add(new THREE.Group()), 0x68c784, 0x64b5de, false);
      k.add(hill(12, 1.6, 0x7fd668), 0, -0.7, 0);

      // 环抱花岛的 6 朵软白大棉云
      const clouds = many(6, (i) =>
        k.add(cloudPuff(i * 9 + 4, 1.5, 0xffffff), -8.5 + i * 3.4, 5.6 + (i % 2) * 0.85, -8.8)
      );

      const cols = [0xff78b0, 0xffd252, 0xff8c68, 0xc294ff, 0x74d8ff, 0x7ae6a2];
      const flowers = many(32, (i) => {
        const fl = bloomFlower(cols[i % cols.length], 0.78 + (i % 3) * 0.16, 1.2);
        const a = (i / 32) * TAU;
        const r = 3.6 + (i % 3) * 1.45;
        k.add(fl.g, Math.cos(a) * r * 1.35, 0.35, Math.sin(a) * r * 0.72 + 0.6);
        return fl;
      });

      const shower = many(28, (i) =>
        k.add(sprite(i % 4 === 0 ? 'butterfly' : 'petal', 0.4, i % 2 ? 0xffb3cf : 0xffe48c, false, 0))
      );

      const cast = (['kimi', 'doubao', 'whale', 'qwen', 'gemini'] as const).map((id) =>
        k.actor(id, 1.1)
      );

      const A = cam([0, 3.5, 12.2], [0, 2.5, -0.4], 41);
      const B = cam([0, 2.95, 10.6], [0, 2.4, -0.3], 40);

      return ({ u, T, bt, ca }) => {
        clouds.forEach((c, i) => {
          const age = ca(i % 3);
          const s = age < 0 ? 0.3 : backOut(clamp01(age / 0.42)) * 1.48;
          c.scale.setScalar(s);
          c.position.y = 5.6 + (i % 2) * 0.85 + Math.sin(T * 1.8 + i) * 0.22;
        });

        const c3 = ca(3);
        const c5 = ca(5);
        flowers.forEach((fl, i) => {
          const age = ca(3 + (i % 3));
          const b = age < 0 ? 0.12 : backOut(clamp01(age / 0.42));
          fl.setBloom(clamp01(b));
          fl.g.scale.setScalar(0.5 + 0.72 * clamp01(b));
          fl.g.rotation.z = Math.sin(T * 2.6 + i) * 0.08;
        });

        shower.forEach((s, i) => {
          const ph = (T * 0.36 + hash(i * 5)) % 1;
          s.position.set(
            (hash(i) - 0.5) * 14 + Math.sin(T * 2 + i) * 0.4,
            5.2 - ph * 4.4,
            (hash(i + 3) - 0.5) * 6
          );
          setOp(s, c3 >= 0 ? Math.sin(ph * PI) * 0.92 : 0);
        });

        cast.forEach((ac, i) => {
          const x = (i - 2) * 1.95;
          const act = c5 >= 0 ? (ac.id === 'kimi' ? 'hop' : 'spin') : 'hop';
          ac.act(act, T)
            .at(x, 0.8, 0.85 - Math.abs(i - 2) * 0.2)
            .flip(i >= 3)
            .sq(beatSq(bt, 0.08))
            .emote(c5 >= 0 && i === 2 ? 'fx_sparkle' : null, T);
        });

        return glide(A, B, u);
      };
    },
  },

  // L32: 「好运总会为你而等待」—— 百年祈福红灯古树，金光四叶草环绕
  {
    id: 'L32',
    look: 'golden',
    title: '祈福灯树候归人',
    cast: ['gpt', 'claude', 'whale', 'doubao', 'zai', 'kimi'],
    wordOpts: { pos: [0, 4.55, -1.0], scale: 0.9 },
    build: (k) => {
      k.add(disc(250, 0x7cc470));
      mountainBackdrop(k.add(new THREE.Group()), 0x8ca876, 0xa28cb8, true);
      k.add(cyl(9.2, 9.6, 0.22, 0xf2e5cf, 34, 0.045), 0, 0, -0.5);

      // 中央高大暖金祈福古树 + 满树红灯笼
      k.add(banyanTree(7.8, 0x5cc268, 55), 0, 0.22, -3.6);
      const treeLans = many(10, (i) => {
        const x = -3.6 + i * 0.8;
        const y = 3.2 + (i % 3) * 0.65;
        const z = -2.2 + (i % 2) * 0.6;
        return k.add(redLantern(0.72), x, y, z);
      });
      const clovers = many(8, (i) => {
        const a = lerp(-0.9, 0.9, i / 7);
        return k.add(fourLeafClover3D(1.12), Math.sin(a) * 6.4, 0.22, Math.cos(a) * 3.2);
      });
      const goldRain = many(24, () => k.add(sprite('star', 0.48, 0xffe87d, true, 0)));

      const ids = ['gpt', 'claude', 'whale', 'doubao', 'zai', 'kimi'] as const;
      const cast = ids.map((id) => k.actor(id, 1.08));

      const A = cam([0, 3.4, 12.6], [0, 2.65, -1.2], 42);
      const B = cam([0, 3.0, 11.0], [0, 2.6, -1.2], 40);

      return ({ u, T, bt, wa }) => {
        const aWait = wa(4) >= 0;
        treeLans.forEach((ln, i) => {
          ln.rotation.z = Math.sin(T * 2.5 + i) * 0.1;
          ln.scale.setScalar(0.72 + bt.pulse * 0.07);
        });
        clovers.forEach((c, i) => (c.rotation.y = T + i));

        cast.forEach((ac, i) => {
          const x = (i - 2.5) * 1.85;
          const act = ac.id === 'gpt' ? 'hover' : ac.id === 'whale' ? 'wave' : 'hop';
          ac.act(act, T)
            .at(x, 0.22, 1.25 - Math.abs(i - 2.5) * 0.2)
            .flip(i >= 3)
            .sq(beatSq(bt, 0.075))
            .emote(aWait && (i === 1 || i === 2 || i === 3) ? 'fx_heart' : null, T);
        });

        goldRain.forEach((s, i) => {
          const ph = (T * 0.44 + hash(i * 4)) % 1;
          s.position.set((hash(i) - 0.5) * 10, 4.8 - ph * 3.8, -1.8 + (hash(i + 2) - 0.5) * 3.5);
          setOp(s, Math.sin(ph * PI) * 0.9);
        });

        return glide(A, B, u);
      };
    },
  },

  // L33: 「慌啥子嘛 慢慢来」—— 伙伴与本命道具温暖横摇特写
  {
    id: 'L33',
    look: 'teahouse',
    title: '茶桌笑语共从容',
    cast: ['claude', 'whale', 'qwen', 'gemini', 'kimi', 'zai'],
    wordOpts: { pos: [0, 4.55, -1.2], scale: 1.0 },
    build: (k) => {
      k.add(disc(240, 0x84d170));
      mountainBackdrop(k.add(new THREE.Group()), 0x70bd8c, 0x6caac9, true);
      k.add(cyl(11, 11.4, 0.18, 0xf2e6d2, 34, 0.04), 0, 0, 0);
      k.add(teahouse('慢'), 0, 0.18, -6.8);
      k.add(bambooCluster(5.4, 51), -7.2, 0, -2.5);
      k.add(bambooCluster(5.4, 52), 7.2, 0, -2.5);

      for (const tx of [-3.2, 0, 3.2]) {
        k.add(bambooTable(1.15), tx, 0.18, 0.6);
      }

      const ids = ['claude', 'whale', 'qwen', 'gemini', 'kimi', 'zai'] as const;
      const cast = ids.map((id) => k.actor(id, 1.1));
      const props = [
        k.thing('prop_teacup', 0.92),
        k.thing('prop_bowl', 0.92),
        k.thing('prop_fan', 0.92),
        k.thing('prop_catclock', 0.92),
        k.thing('prop_scroll', 0.92),
        k.thing('prop_abacus', 0.92),
      ];
      const snail = k.add(snail3D(0.85, 0xe88b4f), 0, 1.38, 0.65);

      const A = cam([-2.4, 2.85, 11.2], [-0.4, 2.35, -0.3], 40);
      const B = cam([2.4, 2.85, 11.2], [0.4, 2.35, -0.3], 40);

      return ({ u, T, bt, wa }) => {
        const aSlow = wa(2) >= 0;
        cast.forEach((ac, i) => {
          const x = (i - 2.5) * 1.85;
          const canSway = ac.id === 'whale' || ac.id === 'qwen' || ac.id === 'gemini';
          ac.act(canSway ? 'sway' : 'nod', T)
            .at(x, 0.18, 1.45)
            .flip(i >= 3)
            .tilt(Math.sin(T * 2.7 + i * 0.5) * 0.06)
            .sq(beatSq(bt, 0.07))
            .emote(aSlow && i === 1 ? 'fx_sparkle' : null, T);
          props[i].at(x * 0.92, 1.38, 0.55);
        });
        snail.position.x = lerp(-0.55, 0.55, u);

        return glide(A, B, u);
      };
    },
  },

  // L34: 「每个人都有自己的节拍」—— 八位全员彩虹音阶圆剧场，各跳各的招牌舞步！
  {
    id: 'L34',
    look: 'festival',
    title: '八人八拍星光舞台',
    cast: ['whale', 'gpt', 'claude', 'doubao', 'gemini', 'kimi', 'qwen', 'zai'],
    wordOpts: { pos: [0, 4.55, -1.0], scale: 0.88 },
    build: (k) => {
      k.add(disc(260, 0x343e6e));
      mountainBackdrop(k.add(new THREE.Group()), 0x453b78, 0x5c4782, false);
      k.add(cyl(11.2, 11.8, 0.26, 0xf5ebd8, 40, 0.05), 0, 0, -0.4);

      // 左右双节拍器呼应
      const mL = metronome3D(1.15);
      const mR = metronome3D(1.15);
      k.add(mL.g, -4.8, 0.26, -3.2, 0.3);
      k.add(mR.g, 4.8, 0.26, -3.2, -0.3);
      many(7, (i) => k.add(redLantern(0.75), -6.6 + i * 2.2, 3.6, -3.8));

      const pCols = [0x7fe0b8, 0xc8b8ff, 0xffad75, 0x6ec8ff, 0xffd166, 0xff7b9c, 0xa89bff, 0xf0dcff];
      const pads = ALL_EIGHT.map((_, i) => {
        const x = (i - 3.5) * 1.72;
        const z = 1.55 - Math.abs(i - 3.5) * 0.34;
        const p = rhythmPad(pCols[i], 0.76);
        k.add(p.g, x, 0.26, z);
        return { p, x, z };
      });
      const cast = ALL_EIGHT.map((id) => k.actor(id, 1.02));
      const notes = many(24, (i) => k.add(sprite('note', 0.48, pCols[i % 8], false, 0)));

      const A = cam([-1.5, 3.8, 13.8], [0, 2.65, -0.6], 42);
      const B = cam([1.5, 3.4, 12.6], [0, 2.6, -0.5], 41);

      return ({ u, T, bt }) => {
        mL.arm.rotation.z = Math.sin(bt.pos * PI) * 0.45;
        mR.arm.rotation.z = -Math.sin(bt.pos * PI * 0.75) * 0.45;

        const sigActs = ['hop', 'hop', 'curtsy', 'spin', 'spin', 'step', 'sway', 'hover'] as const;
        const rates = [0.5, 0.75, 0.85, 1.0, 0.65, 1.25, 0.9, 0.6];
        cast.forEach((ac, i) => {
          const { p, x, z } = pads[i];
          const ph = (bt.pos * rates[i] + i * 0.29) % 1;
          const pulse = Math.pow(Math.max(0, 1 - ph), 2.2);
          p.top.position.y = 0.2 - pulse * 0.06;
          p.ring.scale.setScalar(1 + pulse * 0.18);

          ac.act(sigActs[i], T)
            .at(x, 0.5, z)
            .lift(pulse * 0.25)
            .sq(pulse * 0.08)
            .flip(i >= 4);
        });

        notes.forEach((n, i) => {
          const ph = (T * 0.58 + i * 0.09) % 1;
          const pd = pads[i % 8];
          n.position.set(pd.x + Math.sin(T * 3 + i) * 0.22, 1.8 + ph * 2.8, pd.z);
          setOp(n, Math.sin(ph * PI) * 0.92);
        });

        return glide(A, B, u);
      };
    },
  },

  // L35: 「得不到 就放开」—— 拱桥千灯升空，满河星火与漫天孔明灯同飞
  {
    id: 'L35',
    look: 'festival',
    lookTo: 'starbed',
    title: '石桥千灯释然升空',
    cast: ['gpt', 'claude', 'whale', 'doubao', 'kimi'],
    wordOpts: { pos: [0, 4.55, -1.0], scale: 1.02 },
    build: (k) => {
      k.add(disc(260, 0x263263));
      const river = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, -30),
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, 24),
      ]);
      k.add(ribbon(river, 7.5, 40, waterMat(0x3b6bc4, 0x1d3578, 0xffdf85), 0.04));
      k.add(archBridge(), 0, 0, 0.2);

      // 26 盏漫天升腾的暖金孔明灯 + 6 架折纸飞机
      const lanterns = many(26, (i) => k.add(skyLantern(0.68 + (i % 3) * 0.14)));
      const planes = many(6, () => k.add(paperPlane(0.85, 0xfff6e0)));

      const ids = ['gpt', 'claude', 'whale', 'doubao', 'kimi'] as const;
      const cast = ids.map((id) => k.actor(id, 1.08));
      const bridgeY = (x: number) => Math.cos((x / 11.5) * PI) * 1.45 + 0.34;

      const A = cam([0, 3.3, 12.6], [0, 2.8, -1.5], 42);
      const B = cam([0, 4.1, 13.2], [0, 3.8, -3.0], 41);

      return ({ u, T, bt, wa }) => {
        const aLetGo = wa(2); // 「放开」
        const rel = aLetGo < 0 ? 0 : easeOut(clamp01(aLetGo / 1.6));
        k.lookMix(rel * 0.55);

        lanterns.forEach((ln, i) => {
          const base = 1.2 + hash(i * 2.1) * 4.5;
          ln.position.set(
            (hash(i) - 0.5) * 18 + Math.sin(T * 0.9 + i) * 0.35,
            base + u * 1.8 + rel * 3.8,
            -2.2 - hash(i + 5) * 11
          );
        });

        planes.forEach((pl, i) => {
          const p = clamp01(rel * 1.15 - i * 0.06);
          pl.visible = p > 0.02;
          pl.position.set((i - 2.5) * (0.9 + p * 1.3), 2.3 + p * 3.4, 0.2 - p * 9.5);
          pl.rotation.set(-0.3, PI + (i - 2.5) * 0.08, Math.sin(T * 3 + i) * 0.14);
        });

        cast.forEach((ac, i) => {
          const x = (i - 2) * 1.65;
          const act = ac.id === 'gpt' ? 'hover' : aLetGo >= 0 ? 'wave' in { wave: 1 } && ac.id === 'whale' ? 'wave' : 'hop' : 'idle';
          ac.act(act, T)
            .at(x, bridgeY(x), 0.45)
            .flip(i >= 3)
            .sq(beatSq(bt, 0.07))
            .emote(aLetGo >= 0 && i === 2 ? 'fx_shine' : null, T);
        });

        return glide(A, B, u);
      };
    },
  },

  // L36: 「一切都是最好的安排」—— 全片最高潮：八位全员山城茶院烟花大团圆！
  {
    id: 'L36',
    look: 'festival',
    title: '山城烟花最好的安排',
    cast: ['whale', 'gpt', 'claude', 'doubao', 'gemini', 'kimi', 'qwen', 'zai'],
    wordOpts: { pos: [0, 4.55, -1.0], scale: 0.92 },
    fx: { flash: [0.02] },
    build: (k) => {
      k.add(disc(280, 0x3b4d6e));
      mountainBackdrop(k.add(new THREE.Group()), 0x453b73, 0x5c477e, false);

      const plaza = sundialPlaza();
      k.add(plaza.g, 0, 0, -0.4);
      k.add(teahouse('安'), 0, 0.28, -7.8);
      k.add(crescentMoon3D(2.1), 6.2, 7.5, -14.5);
      k.add(cloudPuff(61, 1.5, 0xf2e4ff), -6.8, 6.8, -13.5);

      // 广场四周鲜花与四叶草簇拥
      many(16, (i) => {
        const a = (i / 16) * TAU;
        const fl = bloomFlower(i % 2 ? 0xff8cb8 : 0xffd666, 0.72, 1.15);
        k.add(fl.g, Math.cos(a) * 6.4, 0.28, Math.sin(a) * 4.4);
      });
      k.add(snail3D(0.85, 0xf09559), 0, 0.28, 3.6);

      // 暖金庆典烟花 + 冉冉孔明灯
      const fw = new WarmFireworks(6);
      k.add(fw.g);
      const skyLans = many(14, () => k.add(skyLantern(0.7)));

      const cast = ALL_EIGHT.map((id) => k.actor(id, 1.06));

      const A = cam([0, 3.4, 12.6], [0, 2.65, -0.8], 41);
      const B = cam([0, 4.3, 14.8], [0, 2.95, -1.2], 42);

      return ({ u, T, localT, bt, wa }) => {
        plaza.ring.rotation.y = T * 0.2;
        fw.update(localT);

        const aBest = wa(2) >= 0;
        const finaleActs = ['hop', 'hop', 'hop', 'wave', 'spin', 'spin', 'hop', 'hover'] as const;
        cast.forEach((ac, i) => {
          const ang = lerp(-1.15, 1.15, i / 7);
          const x = Math.sin(ang) * 5.8;
          const z = Math.cos(ang) * 2.2 + 0.35;
          ac.act(finaleActs[i], T)
            .at(x, 0.28, z)
            .flip(i >= 4)
            .sq(beatSq(bt, 0.08))
            .emote(aBest && i % 2 === 1 ? 'fx_heart' : 'fx_sparkle', T);
        });

        skyLans.forEach((ln, i) => {
          ln.position.set(
            (hash(i) - 0.5) * 20,
            4.2 + hash(i + 2) * 5 + u * 2.5,
            -7 - hash(i + 6) * 9
          );
        });

        return glide(A, B, u);
      };
    },
  },

  // ==================== 尾声三镜 O1–O3 (164.27s – 181.21s) ====================

  // O1: 镜头缓缓拉升，俯瞰弯月白云下的万家灯火与八位挥手的伙伴
  {
    id: 'O1',
    look: 'moonrise',
    title: '尾声·月华满山城',
    cast: ['whale', 'gpt', 'claude', 'doubao', 'gemini', 'kimi', 'qwen', 'zai'],
    build: (k) => {
      k.add(disc(280, 0x2c4268));
      mountainBackdrop(k.add(new THREE.Group()), 0x283566, 0x38427a, true);
      const plaza = sundialPlaza();
      k.add(plaza.g, 0, 0, 0);
      k.add(teahouse('慢'), 0, 0.28, -7.4);
      many(6, (i) =>
        k.add(mountainHouse(i, true), (i < 3 ? -1 : 1) * (10 + (i % 3) * 3.5), 0, -4 - (i % 3) * 4)
      );
      k.add(crescentMoon3D(2.3), 5.8, 8.2, -15);

      const cast = ALL_EIGHT.map((id) => k.actor(id, 1.0));
      const skyLans = many(16, () => k.add(skyLantern(0.68)));

      return ({ u, T, bt }) => {
        plaza.ring.rotation.y = T * 0.14;
        cast.forEach((ac, i) => {
          const ang = lerp(-1.1, 1.1, i / 7);
          ac.act(ac.id === 'whale' ? 'wave' : ac.id === 'gpt' ? 'float' : 'idle', T)
            .at(Math.sin(ang) * 5.2, 0.28, Math.cos(ang) * 2.0 + 0.5)
            .flip(i >= 4)
            .sq(beatSq(bt, 0.045));
        });
        skyLans.forEach((ln, i) => {
          ln.position.set((hash(i) - 0.5) * 22, 4.5 + hash(i + 4) * 6 + u * 2.0, -6 - hash(i + 8) * 10);
        });
        return glide(cam([0, 4.6, 15.2], [0, 2.4, -1.5], 42), cam([0, 8.2, 21.5], [0, 2.8, -2.5], 42), u);
      };
    },
  },

  // O2: 月下茶桌余温静物——热茶袅袅、蓝饭盆、盛放小花、打盹小狐狸与歇息小蜗牛
  {
    id: 'O2',
    look: 'starbed',
    title: '尾声·茶暖夜未央',
    cast: ['whale', 'zai'],
    build: (k) => {
      k.add(disc(180, 0x242c5c));
      k.add(cyl(7.5, 7.8, 0.2, 0xe8decb, 30, 0.04), 0, 0, 0);
      k.add(bambooCluster(5.2, 70), -4.5, 0, -3.2);
      k.add(bambooCluster(5.0, 71), 4.6, 0, -3.2);
      k.add(redLantern(0.9), -2.8, 2.95, -1.2);
      k.add(redLantern(0.9), 2.8, 2.95, -1.2);

      k.add(bambooTable(1.35), 0, 0.2, 0.4);
      k.add(bambooChair(1.1), 2.4, 0.2, 0.5, -0.5);
      k.add(gaiwanTea(1.3), -0.45, 1.56, 0.45);
      const fl = bloomFlower(0xff8cb8, 0.62, 1.05);
      k.add(fl.g, 0.55, 1.56, 0.35);
      k.add(snail3D(0.72, 0xe88f54), 0.1, 1.56, 0.85, -0.2);

      const whale = k.actor('whale', 1.12);
      const zai = k.actor('zai', 1.1);
      const bowl = k.thing('prop_bowl', 0.95);
      const steams = many(5, () => k.add(sprite('smoke', 0.45, 0xfff8ee, false, 0)));
      const stars = many(14, () => k.add(sprite('star', 0.4, 0xffe885, true, 0)));

      return ({ u, T }) => {
        whale.act('wave', T).at(-1.95, 0.2, 0.95).emote('fx_heart', T);
        zai.act('doze', T).at(2.15, 0.2, 0.95).flip(true).emote('fx_zzz', T);
        bowl.at(-0.95, 1.56, 0.65);

        steams.forEach((s, i) => {
          const ph = (T * 0.38 + i * 0.2) % 1;
          s.position.set(-0.45 + Math.sin(T * 1.6 + i) * 0.1, 1.85 + ph * 1.2, 0.45);
          setOp(s, Math.sin(ph * PI) * 0.45);
        });
        stars.forEach((st, i) => {
          st.position.set((hash(i) - 0.5) * 9, 2.5 + hash(i + 2) * 3.2, -2.5);
          setOp(st, 0.5 + 0.5 * Math.sin(T * 3 + i));
        });

        return glide(cam([-0.8, 2.45, 7.6], [0, 1.55, 0.2], 38), cam([0.8, 2.65, 8.6], [0, 1.55, 0.2], 39), u);
      };
    },
  },

  // O3: 173.50–181.21s 回到胡桃木书桌，星光落回书页，《慢慢来》立体绘本轻轻合上、随尾音渐暗
  {
    id: 'O3',
    look: 'stage',
    title: '尾声·轻轻合上绘本',
    cast: ['whale'],
    fx: { fadeOut: true },
    build: (k) => {
      k.add(disc(65, 0x5e3b26));
      const book = teaStorybook();
      k.add(book.g, 0, 0, 0);

      k.add(gaiwanTea(1.65), -5.6, 0, -2.4);
      k.add(cyl(0.24, 0.3, 1.25, 0xfff3dc, 12), 5.5, 0, -2.8);
      const flame = k.add(sprite('glow', 2.1, 0xffb347, true, 0.9), 5.5, 1.62, -2.8);
      k.add(sprite('drop', 0.42, 0xffeaa0, true, 0.95), 5.5, 1.52, -2.8);
      k.add(snail3D(0.78), -4.2, 0, 3.2, 0.25);

      const whale = k.actor('whale', 0.95);
      const sparks = many(22, (i) =>
        k.add(sprite('star', 0.44, i % 2 ? 0xffe894 : 0xffffff, true, 0))
      );

      return ({ u, T }) => {
        // 封面在最后一个吉他和弦（~177.25s, u≈0.48）处温柔合拢
        const closeP = ease(seg(u, 0.14, 0.56));
        const openAmt = 1 - closeP;
        book.cover.rotation.z = openAmt * 2.82;
        book.popup.scale.set(1, Math.max(0.001, openAmt), 1);
        book.popup.visible = openAmt > 0.05;
        (book.glow.material as THREE.MeshBasicMaterial).opacity = openAmt * 0.88;

        // 鲸鱼娘站在绘本旁轻轻鞠躬道晚安
        whale.act(u > 0.35 ? 'bow' : 'wave', T, u > 0.35 ? 176.2 : 0).at(5.0, 0, 2.2).flip(true);

        flame.scale.setScalar((1.9 + Math.sin(T * 7) * 0.14) * lerp(1, 0.65, u));
        sparks.forEach((sp, i) => {
          const ph = (T * 0.35 + hash(i * 3)) % 1;
          sp.position.set((hash(i) - 0.5) * 5.2, 0.9 + (1 - ph) * 3.5, (hash(i + 4) - 0.5) * 3.8);
          setOp(sp, openAmt * Math.sin(ph * PI) * 0.9);
        });

        return track(
          [
            [0, cam([0.2, 5.6, 7.6], [0, 0.9, 0], 38)],
            [1, cam([-1.4, 6.8, 13.8], [0.2, 0.6, 0.4], 40)],
          ],
          u
        );
      };
    },
  },
];
