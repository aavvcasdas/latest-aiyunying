// 第三章：副歌一 L13–L20 · 间奏 N1–N4
import * as THREE from 'three';
import { beatSq } from '../cues';
import { type ShotDef, cam, glide, track } from '../engine';
import {
  PI,
  TAU,
  backOut,
  box,
  clamp01,
  cyl,
  disc,
  ease,
  easeOut,
  hash,
  lerp,
  many,
  ribbon,
  setOp,
  sprite,
  waterMat,
} from '../kit';
import {
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
  paperBoat,
  paperPlane,
  redLantern,
  rhythmPad,
  skyLantern,
  snail3D,
  sun3D,
  sundialPlaza,
  teahouse,
} from '../world';

export const CHORUS1_SHOTS: ShotDef[] = [
  // L13: 「慌啥子嘛 慢慢来」—— 谷时茶院四人围坐（呼应本鲸「谷时篮/分享热饭」设定）
  {
    id: 'L13',
    look: 'teahouse',
    title: '谷时坝坝茶聚',
    cast: ['whale', 'qwen', 'claude', 'zai'],
    wordOpts: { pos: [0, 4.55, -1.5], scale: 1.02 },
    fx: { flash: [0.02] },
    build: (k) => {
      k.add(disc(250, 0x86d172));
      mountainBackdrop(k.add(new THREE.Group()), 0x6fbd8c, 0x6caac9, true);
      k.add(cyl(10, 10.4, 0.16, 0xefe5d4, 34, 0.04), 0, 0, 0);
      k.add(teahouse('慢'), 0, 0.16, -7.2);
      k.add(banyanTree(6.2, 0x54bd66, 9), -6.8, 0, -2.8);
      k.add(bambooCluster(5.4, 8), 6.8, 0, -2.8);

      // 檐前红灯串
      many(5, (i) => k.add(redLantern(0.72), -4.8 + i * 2.4, 3.35, -2.8));

      k.add(bambooTable(1.3), 0, 0.16, 0.6);
      k.add(gaiwanTea(1.1), -0.45, 1.44, 0.55);
      k.add(gaiwanTea(1.1), 0.5, 1.44, 0.65);

      // 本鲸招牌「谷时」木牌 + 前景双蜗牛散步
      const sign = k.add(flipSign('谷时', 0xfff3d4), -4.2, 0.16, -0.4, 0.32);
      const s1 = k.add(snail3D(0.82, 0xe88f54), -2.5, 0.16, 2.85);
      const s2 = k.add(snail3D(0.66, 0x7ac79c), 1.8, 0.16, 3.05, PI);

      const whale = k.actor('whale', 1.15);
      const qwen = k.actor('qwen', 1.12);
      const claude = k.actor('claude', 1.12);
      const zai = k.actor('zai', 1.1);
      const bowl = k.thing('prop_bowl', 0.95);
      const basket = k.thing('prop_basket', 0.95);
      const fan = k.thing('prop_fan', 0.9);

      const A = cam([0, 3.25, 12.0], [0, 2.4, -0.5], 41);
      const B = cam([1.4, 2.85, 10.6], [0, 2.35, -0.4], 39);

      return ({ u, T, bt, wa }) => {
        const aSlow = wa(2); // 「慢慢」
        whale
          .act(aSlow >= 0 ? 'eat' : 'wave', T)
          .at(-1.55, 0.16, 1.25)
          .sq(beatSq(bt, 0.075))
          .emote(aSlow >= 0 ? 'fx_heart' : null, T);
        bowl.at(0.02, 1.44, 0.72);
        basket.at(-2.5, 0.16, 1.55);

        claude.act('nod', T).at(-3.15, 0.16, 0.85).sq(beatSq(bt, 0.055));
        qwen.act('sway', T).at(1.6, 0.16, 1.25).flip(true).sq(beatSq(bt, 0.07));
        fan.at(1.05, 1.12, 1.4).tilt(Math.sin(T * 3.8) * 0.25);
        zai.act(aSlow >= 0 ? 'nod' : 'idle', T).at(3.15, 0.16, 0.85).flip(true).sq(beatSq(bt, 0.055));

        const flipP = aSlow < 0 ? 0.6 : backOut(clamp01(aSlow / 0.45));
        sign.scale.setScalar(flipP);
        s1.position.x = -2.5 + u * 1.15;
        s2.position.x = 1.8 - u * 0.85;

        return glide(A, B, u);
      };
    },
  },

  // L14: 「太阳下山有月亮爬上来」—— 镜湖木栈道日月交辉全景
  {
    id: 'L14',
    look: 'sunset',
    lookTo: 'moonrise',
    title: '镜湖落日与升月',
    cast: ['kimi', 'whale', 'gemini', 'gpt'],
    wordOpts: { pos: [0, 4.55, -1.2], scale: 0.88 },
    build: (k) => {
      // 广阔暮色湖面
      k.add(disc(280, 0x3b588f));
      k.add(hill(16, 5.5, 0x6e5478), -11, -0.8, -16);
      k.add(hill(16, 5.2, 0x454f85), 11, -0.8, -16);
      k.add(hill(12, 3.0, 0x544d7d), 0, -1.2, -18);

      // 湖畔木栈桥与灯柱
      k.add(box(9.6, 0.26, 3.6, 0x9e6c43, 0.04), 0, 0.25, 1.4);
      for (const x of [-4.2, -1.4, 1.4, 4.2]) {
        k.add(cyl(0.12, 0.12, 0.9, 0x6e4728, 8, 0.025), x, 0, 2.9);
      }
      k.add(cyl(0.08, 0.09, 2.8, 0x6e4728, 8, 0.025), -4.3, 0.5, 0.1);
      k.add(redLantern(0.72), -4.3, 3.1, 0.1);
      k.add(cyl(0.08, 0.09, 2.8, 0x6e4728, 8, 0.025), 4.3, 0.5, 0.1);
      k.add(redLantern(0.72), 4.3, 3.1, 0.1);

      const sun = sun3D(2.25);
      k.add(sun.g, -6.4, 5.6, -15.5);
      const sunRefl = k.add(sprite('glow', 5.2, 0xff9d47, true, 0.7), -5.8, 0.2, -9.5);

      const moon = k.add(crescentMoon3D(2.15), 6.2, 0.2, -14.8);
      const moonRefl = k.add(sprite('glow', 4.8, 0xffe885, true, 0), 5.8, 0.2, -9.5);
      const cloudStairs = many(4, (i) =>
        k.add(cloudPuff(i * 4 + 1, 0.92, 0xebefff), 3.6 + i * 0.95, 1.4 + i * 1.15, -12.2)
      );

      const whale = k.actor('whale', 1.1);
      const kimi = k.actor('kimi', 1.12);
      const gemini = k.actor('gemini', 1.08);
      const gpt = k.actor('gpt', 1.18);

      const A = cam([-2.2, 3.0, 12.6], [0, 3.0, -4.5], 42);
      const B = cam([2.2, 3.2, 12.2], [0.5, 3.3, -4.5], 41);

      return ({ u, T, bt, wa, ca }) => {
        const sinkP = wa(1) < 0 ? 0 : ease(clamp01(wa(1) / 1.4));
        sun.g.position.set(-6.4 - sinkP * 1.1, lerp(5.6, 0.2, sinkP), -15.5);
        sun.rays.rotation.z = T * 0.6;
        setOp(sunRefl, (1 - sinkP) * 0.72);

        const skyP = ease(clamp01((u - 0.2) / 0.65));
        k.lookMix(skyP);

        const m0 = wa(3) < 0 ? 0 : easeOut(clamp01(wa(3) / 0.5));
        const c7 = ca(7) < 0 ? 0 : backOut(clamp01(ca(7) / 0.32));
        const c8 = ca(8) < 0 ? 0 : backOut(clamp01(ca(8) / 0.32));
        const c9 = ca(9) < 0 ? 0 : backOut(clamp01(ca(9) / 0.48));
        const my = 0.2 + m0 * 2.1 + c7 * 1.15 + c8 * 1.15 + c9 * 1.45;
        moon.position.set(4.5 + (c7 + c8 + c9) * 0.55, my, -14.8);
        moon.rotation.z = Math.sin(T * 1.7) * 0.08;
        setOp(moonRefl, skyP * 0.72);

        cloudStairs.forEach((cs, i) => {
          const p = [m0, c7, c8, c9][i];
          cs.scale.setScalar(0.01 + 0.92 * p);
        });

        gpt.act('float', T).at(-3.1, 0.51, 1.2).sq(beatSq(bt, 0.05));
        whale.act('sway', T).at(-1.0, 0.51, 1.5).sq(beatSq(bt, 0.065));
        gemini.act('lookaround', T).at(1.0, 0.51, 1.5).flip(true).sq(beatSq(bt, 0.06));
        kimi
          .act(c7 > 0 ? 'hop' : 'idle', T)
          .at(3.1, 0.51, 1.2)
          .flip(true)
          .sq(beatSq(bt, 0.065))
          .emote(c9 > 0.2 ? 'fx_sparkle' : null, T);

        return glide(A, B, u);
      };
    },
  },

  // L15: 「云会在 花会开」—— 三层山城梯田花海层层盛放
  {
    id: 'L15',
    look: 'meadow',
    title: '梯田云影与花海',
    cast: ['doubao', 'claude', 'qwen', 'whale'],
    wordOpts: { pos: [0, 4.55, -1.2], scale: 1.04 },
    build: (k) => {
      k.add(disc(260, 0x82d96c));
      mountainBackdrop(k.add(new THREE.Group()), 0x68c482, 0x62b0d8, false);

      // 三级圆润绿色梯田
      k.add(cyl(11.5, 12.2, 0.55, 0x86db6e, 32, 0.04), 0, 0, -1.5);
      k.add(cyl(8.6, 9.2, 0.65, 0x76cf64, 32, 0.04), 0, 0.55, -2.5);
      k.add(cyl(5.6, 6.2, 0.7, 0x69c45a, 32, 0.04), 0, 1.2, -3.5);

      // 四朵大棉云
      const cloudBaseX = [-6.5, -1.8, 2.6, 6.8];
      const clouds = [
        k.add(cloudPuff(3, 1.45), cloudBaseX[0], 6.2, -9.5),
        k.add(cloudPuff(7, 1.65), cloudBaseX[1], 6.8, -10.8),
        k.add(cloudPuff(11, 1.6), cloudBaseX[2], 6.7, -10.5),
        k.add(cloudPuff(15, 1.4), cloudBaseX[3], 6.1, -9.5),
      ];

      // 三级梯田 30 朵繁花
      const cols = [0xff7eb3, 0xffd15c, 0xff8c6b, 0xb894ff, 0x78d8ff];
      const flowers = many(30, (i) => {
        const tier = i % 3;
        const fl = bloomFlower(cols[i % cols.length], 0.75, 1.15);
        const x = ((Math.floor(i / 3) - 4.5) / 4.5) * (8.5 - tier * 1.6);
        const y = tier === 0 ? 0.55 : tier === 1 ? 1.2 : 1.9;
        const z = tier === 0 ? 1.8 + (i % 2) * 0.8 : tier === 1 ? -0.2 : -2.2;
        k.add(fl.g, x, y, z);
        return { fl, tier };
      });

      const petals = many(20, (i) => k.add(sprite('petal', 0.36, i % 2 ? 0xffb3cf : 0xffe494, false, 0)));

      const doubao = k.actor('doubao', 1.12);
      const whale = k.actor('whale', 1.12);
      const claude = k.actor('claude', 1.1);
      const qwen = k.actor('qwen', 1.1);

      const A = cam([-1.6, 3.8, 12.6], [0, 2.7, -1.2], 41);
      const B = cam([1.6, 3.4, 11.4], [0, 2.6, -1.2], 40);

      return ({ u, T, bt, ca }) => {
        clouds.forEach((cl, i) => {
          const age = ca(Math.min(2, i));
          const s = age < 0 ? 0.25 : backOut(clamp01(age / 0.45)) * 1.48;
          cl.scale.setScalar(s);
          cl.position.x = cloudBaseX[i] + Math.sin(T * 0.9 + i) * 0.24;
          cl.position.y = (i === 1 || i === 2 ? 6.8 : 6.1) + Math.sin(T * 1.6 + i) * 0.2;
        });

        flowers.forEach(({ fl, tier }, i) => {
          const age = ca(3 + tier); // 花(3) -> 第一层，会(4) -> 第二层，开(5) -> 第三层！
          const p = age < 0 ? 0.1 : easeOut(clamp01(age / 0.42));
          fl.setBloom(p);
          fl.g.scale.setScalar(0.5 + 0.68 * p);
          fl.g.rotation.z = Math.sin(T * 2.5 + i) * 0.07;
        });

        const open = ca(5) >= 0;
        petals.forEach((pt, i) => {
          const ph = (T * 0.35 + hash(i * 4)) % 1;
          pt.position.set((hash(i) - 0.5) * 14, 1.5 + ph * 4.2, (hash(i + 2) - 0.5) * 6);
          setOp(pt, open ? Math.sin(ph * PI) * 0.9 : 0);
        });

        doubao.act(open ? 'spin' : 'step', T).at(-2.8, 0.55, 1.1).sq(beatSq(bt, 0.08));
        whale.act(open ? 'hop' : 'sway', T).at(-0.85, 0.55, 1.35).sq(beatSq(bt, 0.075));
        claude.act(open ? 'hop' : 'curtsy', T).at(1.1, 0.55, 1.3).flip(true).sq(beatSq(bt, 0.065));
        qwen.act(open ? 'spin' : 'sway', T).at(2.95, 0.55, 1.05).flip(true).sq(beatSq(bt, 0.07));

        return glide(A, B, u);
      };
    },
  },

  // L16: 「好运总会为你而等待」—— 山城暖金红灯古街与「福」字牌坊
  {
    id: 'L16',
    look: 'golden',
    title: '红灯古街迎好运',
    cast: ['whale', 'gpt', 'kimi', 'zai'],
    wordOpts: { pos: [0, 4.55, -1.2], scale: 0.9 },
    build: (k) => {
      k.add(disc(240, 0xd9cbb8));
      mountainBackdrop(k.add(new THREE.Group()), 0x8ca678, 0x9c8ab8, true);

      // 古街两侧青瓦暖窗民居
      many(4, (i) => {
        k.add(mountainHouse(i, true), -6.4, 0, 2 - i * 4.8, PI / 2);
        k.add(mountainHouse(i + 2, true), 6.4, 0, 2 - i * 4.8, -PI / 2);
      });

      // 中央喜庆木牌坊 + 「福」牌 + 满街红灯笼
      k.add(cyl(0.18, 0.2, 4.6, 0x9e3428, 10, 0.04), -3.5, 0, -3.5);
      k.add(cyl(0.18, 0.2, 4.6, 0x9e3428, 10, 0.04), 3.5, 0, -3.5);
      k.add(box(8.4, 0.36, 0.55, 0x3b4d5e, 0.045), 0, 4.5, -3.5);
      k.add(flipSign('福', 0xe8483c), 0, 3.25, -3.35);

      const lanterns = many(8, (i) =>
        k.add(
          redLantern(0.82),
          (i % 2 ? 1 : -1) * 3.8,
          3.4,
          2.2 - Math.floor(i / 2) * 3.2
        )
      );
      const clovers = many(6, (i) =>
        k.add(fourLeafClover3D(1.1), (i % 2 ? 1 : -1) * 4.3, 0, 2.5 - Math.floor(i / 2) * 2.2)
      );
      const sparks = many(18, () => k.add(sprite('star', 0.48, 0xffe885, true, 0)));

      const whale = k.actor('whale', 1.14);
      const gpt = k.actor('gpt', 1.15);
      const kimi = k.actor('kimi', 1.12);
      const zai = k.actor('zai', 1.1);

      const A = cam([0, 2.95, 11.8], [0, 2.5, -2.5], 41);
      const B = cam([0, 2.75, 9.5], [0, 2.45, -2.5], 40);

      return ({ u, T, bt, wa }) => {
        const aWait = wa(4); // 「等待」
        lanterns.forEach((ln, i) => {
          ln.rotation.z = Math.sin(T * 2.4 + i) * 0.1;
          ln.scale.setScalar(0.82 + bt.pulse * 0.06);
        });
        clovers.forEach((c, i) => (c.rotation.y = T * 0.9 + i));

        gpt.act('nod', T).at(-2.6, 0, -0.1).sq(beatSq(bt, 0.055));
        whale
          .act(aWait >= 0 ? 'wave' : 'hop', T)
          .at(-0.85, 0, 0.25)
          .sq(beatSq(bt, 0.075))
          .emote('fx_sparkle', T);
        kimi.act('bow', T, aWait >= 0 ? T - aWait : 0).at(0.95, 0, 0.25).flip(true).sq(beatSq(bt, 0.06));
        zai.act('hop', T).at(2.65, 0, -0.1).flip(true).sq(beatSq(bt, 0.065));

        sparks.forEach((sp, i) => {
          const ph = (T * 0.48 + hash(i * 6)) % 1;
          sp.position.set((hash(i) - 0.5) * 7.5, 0.8 + ph * 3.8, 1.5 - hash(i + 3) * 6);
          setOp(sp, Math.sin(ph * PI) * 0.85);
        });

        return glide(A, B, u);
      };
    },
  },

  // L17: 「慌啥子嘛 慢慢来」—— 山腰观云竹廊，猫的两只时区猫耳钟（呼应 Gemini 设定：不必跟着全场一起慌）
  {
    id: 'L17',
    look: 'teahouse',
    title: '观云竹廊双猫钟',
    cast: ['gemini', 'whale', 'zai'],
    wordOpts: { pos: [0, 4.55, -1.4], scale: 1.02 },
    build: (k) => {
      k.add(disc(240, 0x7ec972));
      mountainBackdrop(k.add(new THREE.Group()), 0x6cb58e, 0x72a8cf, true);

      // 观景木露台与竹栏杆
      k.add(box(11, 0.3, 5.2, 0xc79258, 0.045), 0, 0, 0);
      k.add(box(10.8, 0.12, 0.14, 0x9e6c38, 0.025), 0, 1.05, -2.45);
      many(7, (i) => k.add(cyl(0.05, 0.05, 0.8, 0x9e6c38, 7, 0.02), -5.1 + i * 1.7, 0.3, -2.45));
      many(4, (i) => k.add(cloudPuff(i * 6 + 2, 1.3), -7.5 + i * 5, 2.2 + (i % 2) * 0.8, -8.5));

      k.add(bambooTable(1.25), 0, 0.3, 0.25);
      k.add(bambooChair(1.05), 3.4, 0.3, 0.35, -0.5);
      const snail = k.add(snail3D(0.85, 0xf09559), -3.8, 1.12, -2.45);

      const gemini = k.actor('gemini', 1.15);
      const whale = k.actor('whale', 1.15);
      const zai = k.actor('zai', 1.12);
      // 猫的标志道具：两只不同时区的猫耳钟！
      const clock1 = k.thing('prop_catclock', 0.98);
      const clock2 = k.thing('prop_catclock', 0.98);
      const bowl = k.thing('prop_bowl', 0.92);

      const A = cam([-1.5, 2.9, 10.8], [0, 2.4, -0.4], 40);
      const B = cam([1.4, 2.8, 10.4], [0, 2.35, -0.4], 39);

      return ({ u, T, bt, wa }) => {
        const aSlow = wa(2); // 「慢慢」
        // 猫左右看看两只钟，摆手示意「我的午夜在另一只钟上，慌啥子嘛！」
        gemini
          .act(aSlow >= 0 ? 'sway' : 'choose', T)
          .at(-1.85, 0.3, 0.95)
          .sq(beatSq(bt, 0.07))
          .emote(aSlow >= 0 ? 'fx_bulb' : null, T);
        clock1.at(-0.52, 1.56, 0.3).tilt(Math.sin(T * 2.8) * 0.08);
        clock2.at(0.52, 1.56, 0.3).flip(true).tilt(-Math.sin(T * 2.1) * 0.08);

        whale
          .act(aSlow >= 0 ? 'sway' : 'wave', T)
          .at(1.65, 0.3, 0.95)
          .flip(true)
          .sq(beatSq(bt, 0.075));
        bowl.at(0, 1.56, 0.55);

        zai.act('doze', T).at(3.35, 0.3, 0.85).flip(true).emote('fx_zzz', T);
        snail.position.x = -3.8 + u * 1.4;

        return glide(A, B, u);
      };
    },
  },

  // L18: 「每个人都有自己的节拍」—— 节拍器音阶圆广场，六位角色各踩各的发光节拍踏板
  {
    id: 'L18',
    look: 'golden',
    title: '每个人都有自己的节拍',
    cast: ['doubao', 'gemini', 'whale', 'qwen', 'claude', 'zai'],
    wordOpts: { pos: [0, 4.55, -1.2], scale: 0.88 },
    build: (k) => {
      k.add(disc(240, 0x7ac478));
      mountainBackdrop(k.add(new THREE.Group()), 0x869ec4, 0xa88cc2, true);
      k.add(cyl(9.2, 9.6, 0.22, 0xf4ead8, 36, 0.045), 0, 0, 0);

      // 中央大号木制节拍器（纯摆锤无数字）
      const metro = metronome3D(1.3);
      k.add(metro.g, 0, 0.22, -2.6);

      // 6 块不同颜色的发光音阶踏板，弧形排开
      const padCols = [0xff7b9c, 0xa89bff, 0x6ec8ff, 0xffd166, 0xffad75, 0x7fe0b8];
      const castIds = ['doubao', 'gemini', 'whale', 'qwen', 'claude', 'zai'] as const;
      const pads = padCols.map((c, i) => {
        const x = (i - 2.5) * 2.05;
        const z = 1.4 - Math.abs(i - 2.5) * 0.38;
        const p = rhythmPad(c, 0.86);
        k.add(p.g, x, 0.22, z);
        return { p, x, z };
      });
      const actors = castIds.map((id) => k.actor(id, 1.05));
      const shoes = k.thing('prop_redshoes', 0.88);
      const notes = many(16, (i) =>
        k.add(sprite('note', 0.46, padCols[i % padCols.length], false, 0))
      );

      const A = cam([0, 3.6, 12.8], [0, 2.55, -0.6], 42);
      const B = cam([0, 3.1, 11.5], [0, 2.5, -0.5], 40);

      return ({ u, T, bt, wa }) => {
        // 节拍器精确踩在实测 130 BPM 拍点上左右摆动！
        const swing = Math.sin(bt.pos * PI) * 0.46;
        metro.arm.rotation.z = swing;

        const aBeat = wa(3) >= 0; // 「节拍」
        const danceActs = ['step', 'sway', 'hop', 'spin', 'hop', 'nod'] as const;
        // 每个人有自己独一无二的节拍速率与相位！
        const rates = [1.0, 0.75, 1.0, 0.5, 0.85, 0.5];
        actors.forEach((ac, i) => {
          const { p, x, z } = pads[i];
          const myPhase = (bt.pos * rates[i] + i * 0.37) % 1;
          const myPulse = Math.pow(Math.max(0, 1 - myPhase), 2.2);
          p.top.position.y = 0.2 - myPulse * 0.06;
          p.ring.scale.setScalar(1 + myPulse * 0.16);

          ac.act(aBeat ? danceActs[i] : 'idle', T)
            .at(x, 0.46, z)
            .lift(myPulse * 0.22)
            .sq(myPulse * 0.075)
            .flip(i >= 3);
        });
        shoes.at(pads[0].x - 0.72, 0.24, pads[0].z + 0.55);

        notes.forEach((nt, i) => {
          const ph = (T * 0.55 + i * 0.13) % 1;
          const base = pads[i % 6];
          nt.position.set(base.x + Math.sin(T * 3 + i) * 0.25, 1.8 + ph * 2.5, base.z);
          setOp(nt, Math.sin(ph * PI) * 0.92);
        });

        return glide(A, B, u);
      };
    },
  },

  // L19: 「得不到 就放开」—— 暮色山崖观景台，松手放飞折纸飞机与漫天孔明灯
  {
    id: 'L19',
    look: 'dusk',
    lookTo: 'festival',
    title: '得不到 就放开',
    cast: ['whale', 'gemini', 'claude'],
    wordOpts: { pos: [0, 4.55, -1.4], scale: 1.04 },
    build: (k) => {
      // 山巅观景草台 + 远方壮阔云海
      k.add(cyl(9.5, 11, 1.2, 0x629978, 28, 0.045), 0, -0.9, 1.5);
      many(10, (i) =>
        k.add(cloudPuff(i * 5, 2.2 + (i % 3) * 0.6, 0xf2d9e6), -18 + i * 4, -0.6, -9 - (i % 3) * 4)
      );
      // 木护栏
      k.add(box(9.6, 0.12, 0.14, 0x8c5c38, 0.025), 0, 1.1, -1.8);
      many(6, (i) => k.add(cyl(0.06, 0.06, 0.85, 0x8c5c38, 7, 0.02), -4.5 + i * 1.8, 0.3, -1.8));

      // 8 架白色折纸飞机 + 12 盏暖金孔明灯
      const planes = many(8, (i) => k.add(paperPlane(0.85, i % 2 ? 0xfffaf0 : 0xffe8b8)));
      const lanterns = many(12, (i) => k.add(skyLantern(0.75 + (i % 3) * 0.14)));

      const whale = k.actor('whale', 1.14);
      const gemini = k.actor('gemini', 1.12);
      const claude = k.actor('claude', 1.12);

      const A = cam([-1.2, 2.75, 10.8], [0, 2.5, -2.5], 41);
      const B = cam([0.8, 3.45, 11.4], [0, 3.2, -4.0], 40);

      return ({ u, T, bt, wa }) => {
        const aLetGo = wa(2); // 「放开」
        const rel = aLetGo < 0 ? 0 : easeOut(clamp01(aLetGo / 1.55));
        k.lookMix(rel);

        // 「放开」起唱瞬间，折纸飞机乘风滑翔远去
        planes.forEach((pl, i) => {
          const startX = (i - 3.5) * 0.9;
          const p = clamp01(rel * 1.2 - i * 0.05);
          pl.visible = p > 0.01;
          pl.position.set(
            startX + p * (i - 3.5) * 1.1 + Math.sin(T * 2 + i) * 0.3,
            1.6 + p * (2.6 + (i % 3) * 0.9),
            0.2 - p * 9.5
          );
          pl.rotation.set(-0.28, PI + (i - 3.5) * 0.08, Math.sin(T * 3 + i) * 0.15);
        });

        // 孔明灯缓缓升满暮夜长空
        lanterns.forEach((ln, i) => {
          const baseH = 0.8 + hash(i + 2) * 2.5;
          ln.position.set(
            (hash(i) - 0.5) * 15 + Math.sin(T * 0.8 + i) * 0.35,
            baseH + u * 1.4 + rel * 3.2,
            -3.5 - hash(i + 5) * 9
          );
        });

        // 三人从犹豫到释然挥手放开
        gemini.act(aLetGo >= 0 ? 'hop' : 'choose', T).at(-2.2, 0.3, 0.4).sq(beatSq(bt, 0.065));
        whale
          .act(aLetGo >= 0 ? 'wave' : 'point', T)
          .at(0, 0.3, 0.7)
          .sq(beatSq(bt, 0.07))
          .emote(aLetGo >= 0 ? 'fx_shine' : null, T);
        claude.act(aLetGo >= 0 ? 'curtsy' : 'idle', T).at(2.2, 0.3, 0.4).flip(true).sq(beatSq(bt, 0.06));

        return glide(A, B, u);
      };
    },
  },

  // L20: 「一切都是最好的安排」—— 四时灯环同心圆广场，八位伙伴首度大团圆
  {
    id: 'L20',
    look: 'festival',
    title: '一切都是最好的安排',
    cast: ['whale', 'gpt', 'claude', 'doubao', 'gemini', 'kimi', 'qwen', 'zai'],
    wordOpts: { pos: [0, 4.55, -1.2], scale: 0.92 },
    build: (k) => {
      k.add(disc(260, 0x3b4d6e));
      mountainBackdrop(k.add(new THREE.Group()), 0x453b73, 0x5c477e, false);
      const plaza = sundialPlaza();
      k.add(plaza.g, 0, 0, -0.5);

      // 天际同时悬着温柔弯月与漫天孔明灯
      k.add(crescentMoon3D(1.85), 5.6, 6.8, -13);
      const skyLans = many(14, () => k.add(skyLantern(0.72)));

      const order = ['zai', 'kimi', 'claude', 'whale', 'qwen', 'doubao', 'gemini', 'gpt'] as const;
      const cast = order.map((id) => k.actor(id, 1.04));

      const A = cam([0, 4.2, 14.2], [0, 2.55, -0.6], 42);
      const B = cam([0, 3.3, 12.2], [0, 2.45, -0.5], 40);

      return ({ u, T, bt, wa }) => {
        plaza.ring.rotation.y = T * 0.16;
        const aBest = wa(2) >= 0; // 「最好的」
        const aDest = wa(3) >= 0; // 「安排」

        cast.forEach((ac, i) => {
          const ang = lerp(-1.12, 1.12, i / 7);
          const x = Math.sin(ang) * 5.6;
          const z = Math.cos(ang) * 2.2 - 0.2;
          const actName =
            ac.id === 'gpt'
              ? 'hover'
              : aDest
                ? i % 2 === 0
                  ? 'hop'
                  : 'wave' in { wave: 1 } && ac.id === 'whale'
                    ? 'wave'
                    : 'nod'
                : 'idle';
          ac.act(actName, T)
            .at(x, 0.28, z)
            .flip(i >= 4)
            .sq(beatSq(bt, 0.07))
            .emote(aBest && (i === 3 || i === 5) ? 'fx_heart' : null, T);
        });

        skyLans.forEach((ln, i) => {
          ln.position.set(
            (hash(i) - 0.5) * 18,
            3.5 + hash(i + 3) * 5 + u * 2.2,
            -6 - hash(i + 7) * 9
          );
        });

        return glide(A, B, u);
      };
    },
  },

  // ==================== 间奏四镜 N1–N4 (90.42s – 104.27s) ====================

  // N1: 豆包红舞鞋踩拍暖场（兑现人物设定「间奏时她自己先踩拍，把场子热起来」）
  {
    id: 'N1',
    look: 'festival',
    title: '间奏·豆包踩拍暖场',
    cast: ['doubao', 'whale', 'qwen'],
    build: (k) => {
      k.add(disc(200, 0x384b6e));
      k.add(cyl(7.5, 7.8, 0.22, 0xf2e5cf, 32, 0.04), 0, 0, 0);
      k.add(teahouse('茶'), 0, 0.22, -6.5);
      const pad = rhythmPad(0xff85a8, 1.85);
      k.add(pad.g, 0, 0.22, 0.8);

      const doubao = k.actor('doubao', 1.2);
      const whale = k.actor('whale', 1.08);
      const qwen = k.actor('qwen', 1.08);
      const shoes = k.thing('prop_redshoes', 0.95);
      const notes = many(10, () => k.add(sprite('note', 0.45, 0xffdf7d, false, 0)));

      return ({ u, T, bt }) => {
        pad.ring.scale.setScalar(1 + bt.pulse * 0.18);
        doubao
          .act(bt.idx % 4 < 2 ? 'step' : 'spin', T)
          .at(Math.sin(u * TAU) * 0.65, 0.48, 0.8)
          .lift(bt.pulse * 0.22)
          .sq(beatSq(bt, 0.085))
          .emote('fx_sparkle', T);
        shoes.at(-1.55, 0.24, 1.8);

        whale.act('sway', T).at(-3.1, 0.22, 0.3).sq(beatSq(bt, 0.065));
        qwen.act('sway', T).at(3.1, 0.22, 0.3).flip(true).sq(beatSq(bt, 0.065));

        notes.forEach((n, i) => {
          const ph = (T * 0.65 + i * 0.1) % 1;
          const a = i * 1.2 + T;
          n.position.set(Math.cos(a) * 1.4, 1.5 + ph * 2.4, 0.8 + Math.sin(a) * 0.8);
          setOp(n, Math.sin(ph * PI) * 0.9);
        });

        return glide(cam([-2.6, 2.8, 9.2], [0, 1.6, 0.2], 40), cam([2.6, 2.6, 8.8], [0, 1.6, 0.2], 39), u);
      };
    },
  },

  // N2: 星溪纸船与河灯漂流
  {
    id: 'N2',
    look: 'night',
    title: '间奏·星溪放纸船',
    cast: ['whale', 'claude'],
    build: (k) => {
      k.add(disc(220, 0x264a5e));
      mountainBackdrop(k.add(new THREE.Group()), 0x23385e, 0x2f3b70, false);
      const creek = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-14, 0, -8),
        new THREE.Vector3(-3, 0, -1),
        new THREE.Vector3(4, 0, 2),
        new THREE.Vector3(14, 0, 5),
      ]);
      k.add(ribbon(creek, 4.4, 60, waterMat(0x3a8cd6, 0x1e4d96, 0xffe494), 0.06));

      const boats = many(6, (i) => k.add(paperBoat(0.88 + (i % 2) * 0.15)));
      many(6, (i) => {
        const fl = bloomFlower(0xffa6c9, 0.65, 1);
        k.add(fl.g, -4 + i * 1.6, 0, 3.2 + (i % 2) * 0.5);
      });

      const whale = k.actor('whale', 1.12);
      const claude = k.actor('claude', 1.12);
      const teacup = k.thing('prop_teacup', 0.9);

      return ({ u, T, bt }) => {
        boats.forEach((b, i) => {
          const bu = clamp01(0.14 + i * 0.11 + u * 0.22);
          const p = creek.getPointAt(bu);
          const tg = creek.getTangentAt(bu);
          b.position.set(p.x, 0.08 + Math.sin(T * 2.4 + i) * 0.05, p.z + (i % 2 ? 0.55 : -0.55));
          b.rotation.y = Math.atan2(tg.x, tg.z);
        });
        whale.act('wave', T).at(-2.2, 0, -3.5).sq(beatSq(bt, 0.055));
        claude.act('idle', T).at(0.2, 0, -2.9).sq(beatSq(bt, 0.05));
        teacup.at(1.0, 0, -2.7);

        return glide(cam([-3.2, 2.8, 8.8], [0, 1.0, -0.5], 40), cam([2.4, 2.5, 8.6], [1.2, 1.0, 0.2], 40), u);
      };
    },
  },

  // N3: 猫与 Kimi 在星丘画满星座与星卷
  {
    id: 'N3',
    look: 'starbed',
    title: '间奏·星丘绘银河',
    cast: ['gemini', 'kimi'],
    build: (k) => {
      k.add(disc(220, 0x26285e));
      k.add(hill(9.5, 2.1, 0x3b4882), 0, -0.6, 0);
      k.add(crescentMoon3D(1.9), -4.5, 5.2, -9.5);

      const constStars = many(16, (i) => k.add(sprite('star', 0.68, i % 2 ? 0xffe87d : 0xa8e6ff, true, 0)));
      const gemini = k.actor('gemini', 1.15);
      const kimi = k.actor('kimi', 1.15);
      const brush = k.thing('prop_brush', 1.0);
      const scroll = k.thing('prop_scroll', 1.0);

      return ({ u, T, bt }) => {
        gemini.act('hop', T).at(-1.45, 1.35, 0.4).sq(beatSq(bt, 0.07)).emote('fx_sparkle', T);
        brush.at(-0.65, 2.25, 0.55).tilt(Math.sin(T * 5) * 0.35);
        kimi.act('think', T).at(1.45, 1.35, 0.4).flip(true).sq(beatSq(bt, 0.055));
        scroll.at(2.25, 1.85, 0.55);

        constStars.forEach((s, i) => {
          const appear = clamp01((u * 1.3 - i * 0.06) / 0.2);
          const ang = -1.1 + (i / 15) * 2.2;
          s.position.set(Math.sin(ang) * 6.2, 3.2 + Math.cos(ang) * 2.4 + (i % 2) * 0.5, -4.5);
          s.scale.setScalar((0.45 + 0.35 * appear) * (1 + bt.pulse * 0.15));
          setOp(s, appear * 0.95);
        });

        return glide(cam([0, 3.0, 10.6], [0, 2.8, -1.5], 41), cam([0.8, 3.5, 9.8], [0, 3.1, -2.0], 40), u);
      };
    },
  },

  // N4: 白龙掠过睡梦中的灯火山城，洒下金色晚安星尘
  {
    id: 'N4',
    look: 'moonrise',
    title: '间奏·白龙拂夜山城',
    cast: ['gpt', 'zai'],
    build: (k) => {
      k.add(disc(260, 0x263b5e));
      mountainBackdrop(k.add(new THREE.Group()), 0x232d5c, 0x323975, true);

      // 错落有致的暖窗山城小村
      many(7, (i) => {
        const x = -9 + i * 3.0;
        const z = -4 - (i % 3) * 2.6;
        k.add(mountainHouse(i, true), x, 0, z, (hash(i) - 0.5) * 0.4);
      });
      k.add(crescentMoon3D(2.1), 5.2, 6.6, -12.5);

      const gpt = k.actor('gpt', 1.45);
      const zai = k.actor('zai', 1.0);
      const dust = many(24, () => k.add(sprite('star', 0.42, 0xffe88c, true, 0)));

      return ({ u, T }) => {
        const gx = lerp(-6.5, 5.5, ease(u));
        const gy = 4.6 + Math.sin(u * PI) * 1.1;
        gpt.act('hover', T).at(gx, gy, -2.2).noShadow();
        zai.act('doze', T).at(0.5, 0, 1.8).emote('fx_zzz', T);

        dust.forEach((d, i) => {
          const dropT = u - i / 28;
          if (dropT < 0) {
            setOp(d, 0);
          } else {
            const p = clamp01(dropT / 0.45);
            d.position.set(lerp(-6.5, 5.5, i / 24), 4.5 - p * 3.2, -2 + (hash(i) - 0.5) * 2);
            setOp(d, Math.sin(p * PI) * 0.9);
          }
        });

        return track(
          [
            [0, cam([0, 4.8, 13.8], [0, 2.8, -3], 42)],
            [1, cam([1.2, 3.6, 11.4], [0.5, 2.4, -2.5], 40)],
          ],
          u
        );
      };
    },
  },
];
