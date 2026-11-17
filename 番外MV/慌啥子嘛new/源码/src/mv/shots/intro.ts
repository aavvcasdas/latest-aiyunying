// 第一章：序章 I1–I4 · 引歌 L01–L04
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
  seg,
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
  koiFish,
  luckyPavilion,
  mountainBackdrop,
  mountainHouse,
  redLantern,
  snail3D,
  sun3D,
  teaStorybook,
  teahouse,
} from '../world';

export const INTRO_SHOTS: ShotDef[] = [
  // I1: 0.00–4.57s 翻开《慢慢来》山城立体绘本
  {
    id: 'I1',
    look: 'stage',
    title: '翻开山城立体绘本',
    cast: ['whale'],
    fx: { fadeIn: true, title: true, whiteOut: true },
    build: (k) => {
      // 胡桃木大书桌
      k.add(disc(65, 0x5e3b26));
      const book = teaStorybook();
      k.add(book.g, 0, 0, 0);

      // 桌角一盏盖碗热茶与暖黄烛台
      k.add(gaiwanTea(1.65), -5.6, 0, -2.4);
      const steam = many(5, () => k.add(sprite('smoke', 0.65, 0xfff8ee, false, 0)));
      k.add(cyl(0.24, 0.3, 1.25, 0xfff3dc, 12), 5.5, 0, -2.8);
      const flame = k.add(sprite('glow', 2.1, 0xffb347, true, 0.9), 5.5, 1.62, -2.8);
      k.add(sprite('drop', 0.42, 0xffeaa0, true, 0.95), 5.5, 1.52, -2.8);

      // 桌边悠闲小蜗牛
      const snail = k.add(snail3D(0.75), -5.2, 0, 3.2, 0.35);

      const whale = k.actor('whale', 1.05);
      const sparks = many(28, (i) =>
        k.add(sprite('star', 0.48, i % 3 ? 0xffe896 : 0xffffff, true, 0))
      );

      const A = cam([-2.8, 5.8, 13.8], [-0.3, 0.8, 1.0], 40);
      const B = cam([0.2, 5.8, 6.4], [0.1, 1.0, -0.1], 36);

      return ({ u, T, bt }) => {
        const open = ease(seg(u, 0.08, 0.5));
        book.cover.rotation.z = open * 2.82;
        const popS = backOut(seg(u, 0.24, 0.62));
        book.popup.scale.set(1, Math.max(0.01, popS), 1);
        (book.glow.material as THREE.MeshBasicMaterial).opacity = open * 0.92;

        // 鲸鱼娘轻快小跑上桌，跃入发光的立体山城
        const run = seg(u, 0, 0.55);
        const jump = seg(u, 0.56, 0.88);
        if (jump <= 0) {
          whale.walkBy(run * 5.6).at(lerp(-8.8, -3.2, run), 0, 4.4).sq(beatSq(bt, 0.05));
        } else {
          const j = ease(jump);
          whale
            .act('hop', T)
            .at(lerp(-3.2, 0.2, j), 0.85 * j, lerp(4.4, 0.1, j))
            .lift(Math.sin(j * PI) * 2.5)
            .size(lerp(1, 0.42, j))
            .alpha(jump > 0.95 ? 0 : 1);
        }

        snail.position.x = -5.2 + u * 0.65;
        flame.scale.setScalar(1.95 + Math.sin(T * 8.5) * 0.18);

        steam.forEach((s, i) => {
          const ph = (T * 0.45 + i * 0.2) % 1;
          s.position.set(-5.6 + Math.sin(T * 2 + i) * 0.15, 0.55 + ph * 1.6, -2.4);
          s.scale.setScalar(0.35 + ph * 0.55);
          setOp(s, Math.sin(ph * PI) * 0.45);
        });

        sparks.forEach((sp, i) => {
          const ph = (T * 0.52 + hash(i * 2.1)) % 1;
          sp.position.set(
            (hash(i + 9) - 0.5) * 5.8,
            0.9 + ph * 4.4,
            (hash(i + 5) - 0.5) * 4.4
          );
          sp.scale.setScalar(0.24 + 0.52 * Math.sin(ph * PI));
          setOp(sp, open * Math.sin(ph * PI));
        });

        return glide(A, B, u);
      };
    },
  },

  // I2: 4.57–8.27s 步入青石茶巷
  {
    id: 'I2',
    look: 'teahouse',
    title: '青石茶巷初晴',
    cast: ['whale', 'qwen'],
    fx: { whiteIn: true },
    build: (k) => {
      k.add(disc(260, 0x8ad176));
      mountainBackdrop(k.add(new THREE.Group()), 0x73ba8c, 0x6ba6c7, true);

      // 青石板小路
      k.add(box(38, 0.08, 3.6, 0xded6c8, 0.03), 0, 0, 1.2);
      many(11, (i) => k.add(box(1.4, 0.1, 1.4, 0xcfc5b4, 0.02), -14 + i * 2.8, 0.02, 1.2));

      // 主茶馆与两侧山城小楼
      k.add(teahouse('茶'), 2.6, 0, -4.6);
      k.add(mountainHouse(1, true), -6.8, 0, -5.2, 0.2);
      k.add(mountainHouse(3, true), 11.2, 0, -5.4, -0.22);

      // 翠竹与老黄桷树
      k.add(banyanTree(5.6, 0x57bf66, 2), -3.2, 0, -2.5);
      k.add(bambooCluster(5.2, 1), 8.2, 0, -2.2);
      k.add(bambooCluster(4.8, 4), -9.6, 0, -1.8);

      const whale = k.actor('whale', 1.1);
      const qwen = k.actor('qwen', 1.1);
      const fan = k.thing('prop_fan', 0.95);
      const petals = many(14, (i) => k.add(sprite('leaf', 0.34, i % 2 ? 0x9ef09e : 0xffe494)));

      const A = cam([-7.5, 3.2, 11.8], [-0.5, 1.8, -1.8], 42);
      const B = cam([0.4, 2.7, 9.6], [2.2, 1.8, -2.0], 40);

      return ({ u, T, bt }) => {
        // 鲸鱼娘沿青石板小路轻快走向茶馆
        whale.walkX(-5.6, 0.2, ease(u), 0.08, 1.4).sq(beatSq(bt));
        // 千问站在茶馆廊前摇扇迎客
        qwen.act('sway', T).at(3.2, 0.08, 0.2).flip(true).sq(beatSq(bt, 0.05));
        fan.at(2.55, 0.95, 0.35).tilt(Math.sin(T * 4.2) * 0.25);

        petals.forEach((p, i) => {
          const ph = (T * 0.22 + hash(i * 3)) % 1;
          p.position.set(-8 + ph * 18, 4.6 - ph * 3.6 + Math.sin(T * 2 + i) * 0.3, -1 + (hash(i) - 0.5) * 5);
        });

        return glide(A, B, u);
      };
    },
  },

  // I3: 8.27–11.96s 坝坝茶院伙伴就座
  {
    id: 'I3',
    look: 'teahouse',
    title: '坝坝茶院闲坐',
    cast: ['claude', 'gemini', 'zai'],
    build: (k) => {
      k.add(disc(240, 0x88cf74));
      mountainBackdrop(k.add(new THREE.Group()), 0x76bd8d, 0x6eaac9, true);
      // 院坝石砖圆坪
      k.add(cyl(8.5, 8.8, 0.16, 0xe8dfd0, 32, 0.04), 0, 0, 0);
      k.add(teahouse('慢'), 0, 0.16, -6.5);
      k.add(banyanTree(6.2, 0x52b862, 5), -6.2, 0, -2.6);
      k.add(bambooCluster(5.0, 7), 6.5, 0, -2.4);

      // 两张竹茶桌与竹躺椅
      k.add(bambooTable(1.1), -2.0, 0.16, 0.4);
      k.add(bambooChair(1.0), -3.5, 0.16, 0.4, PI / 2);
      k.add(gaiwanTea(1.05), -1.65, 1.22, 0.35);

      k.add(bambooTable(1.1), 2.2, 0.16, 0.5);
      k.add(bambooChair(1.0), 3.7, 0.16, 0.5, -PI / 2);
      k.add(gaiwanTea(1.05), 1.85, 1.22, 0.45);

      const claude = k.actor('claude', 1.08);
      const book = k.thing('prop_book', 0.9);
      const gemini = k.actor('gemini', 1.08);
      const clock = k.thing('prop_catclock', 0.9);
      const zai = k.actor('zai', 1.08);
      const snail = k.add(snail3D(0.72, 0xe88b58), -0.4, 0.16, 2.8);

      const A = cam([5.2, 3.6, 10.2], [0, 1.5, -0.4], 40);
      const B = cam([-3.8, 2.9, 9.6], [0, 1.4, -0.2], 39);

      return ({ u, T, bt }) => {
        claude.act('read', T).at(-2.8, 0.16, 0.95).sq(beatSq(bt, 0.04));
        book.at(-2.25, 1.22, 0.55);

        gemini.act('choose', T).at(0.15, 0.16, -0.5).sq(beatSq(bt, 0.06));
        clock.at(2.45, 1.22, 0.55).tilt(Math.sin(T * 3.2) * 0.08);

        zai.act('doze', T).at(3.15, 0.16, 0.95).flip(true).emote('fx_zzz', T);
        snail.position.x = -0.6 + u * 1.1;

        return glide(A, B, u);
      };
    },
  },

  // I4: 11.96–15.65s 山谷晴川与云端白龙（鼓点推进迎接首句）
  {
    id: 'I4',
    look: 'golden',
    title: '晴川暮云群像',
    cast: ['gpt', 'doubao', 'kimi', 'whale'],
    build: (k) => {
      k.add(disc(280, 0x84c96e));
      mountainBackdrop(k.add(new THREE.Group()), 0x7cb882, 0x859ec9, true);

      // 蜿蜒金波山溪
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-22, 0, -24),
        new THREE.Vector3(-6, 0, -10),
        new THREE.Vector3(2, 0, 0),
        new THREE.Vector3(-3, 0, 14),
      ]);
      k.add(ribbon(curve, 4.2, 60, waterMat(0x5ec4eb, 0x2f82c4, 0xffe49c), 0.06));

      // 溪畔花坡与远处茶村
      k.add(hill(9, 2.2, 0x8cd672), -5.5, -0.4, 0.5);
      k.add(hill(10, 2.5, 0x7ec96c), 7.5, -0.4, -2.5);
      k.add(mountainHouse(0, true), -10, 0, -12, 0.35);
      k.add(mountainHouse(2, true), 9.5, 1.6, -6.5, -0.3);
      many(10, (i) => {
        const fl = bloomFlower(i % 2 ? 0xff8cb3 : 0xffd666, 0.75, 1);
        k.add(fl.g, -7.5 + i * 1.6, 0, 3.2 + (hash(i) - 0.5) * 2.2);
      });

      const whale = k.actor('whale', 1.1);
      const doubao = k.actor('doubao', 1.05);
      const kimi = k.actor('kimi', 1.08);
      const gpt = k.actor('gpt', 1.55);

      const A = cam([-1.5, 2.8, 12.2], [0, 2.2, -3], 42);
      const B = cam([1.5, 5.2, 14.5], [0.5, 3.6, -6], 40);

      return ({ u, T, bt }) => {
        whale.act('wave', T).at(-2.8, 0.1, 2.4).sq(beatSq(bt, 0.07));
        doubao.act('step', T).at(-0.8, 0.1, 2.8).sq(beatSq(bt, 0.085));
        kimi.act('idle', T).at(4.6, 0.1, 1.8).flip(true).sq(beatSq(bt, 0.05));
        // 龙娘从暮金云端舒展掠过
        gpt
          .act('hover', T)
          .at(lerp(-7.4, 7.0, ease(u)), 5.15 + Math.sin(u * PI) * 0.85, -8.6)
          .noShadow();
        return glide(A, B, u);
      };
    },
  },

  // L01: 15.65–19.34s 「慌啥子嘛 慢慢来」—— 坝坝茶院摆手劝茶 + 小蜗牛与「不急」翻牌
  {
    id: 'L01',
    look: 'teahouse',
    title: '慌啥子嘛 慢慢来',
    cast: ['whale', 'qwen'],
    wordOpts: { pos: [0, 4.55, -1.6], scale: 1.02 },
    build: (k) => {
      k.add(disc(240, 0x86cf72));
      mountainBackdrop(k.add(new THREE.Group()), 0x70b889, 0x6ca8c7, true);
      k.add(cyl(9.5, 9.8, 0.16, 0xede3d2, 32, 0.04), 0, 0, 0);
      k.add(teahouse('茶'), 0, 0.16, -6.8);
      k.add(banyanTree(5.8, 0x55bd66, 3), -6.5, 0, -3.2);
      k.add(bambooCluster(5.2, 2), 6.6, 0, -3.0);

      // 中央竹桌与两只盖碗茶
      k.add(bambooTable(1.18), 0, 0.16, 0.8);
      k.add(bambooChair(1.0), -2.2, 0.16, 0.8, 0.5);
      k.add(bambooChair(1.0), 2.2, 0.16, 0.8, -0.5);
      const cup = k.add(gaiwanTea(1.15), 0.35, 1.32, 0.85);
      const sign = k.add(flipSign('不急', 0xfff3d1), 3.6, 0.16, -0.6, -0.28);
      const snail = k.add(snail3D(0.9, 0xe88a4f), -3.6, 0.16, 2.55, 0.1);

      const whale = k.actor('whale', 1.16);
      const qwen = k.actor('qwen', 1.15);
      const bowl = k.thing('prop_bowl', 0.95);
      const fan = k.thing('prop_fan', 0.95);
      const steams = many(5, () => k.add(sprite('smoke', 0.5, 0xfffaf0, false, 0)));

      const A = cam([-1.4, 2.95, 11.4], [0, 2.45, -0.5], 40);
      const B = cam([1.2, 2.8, 10.5], [0, 2.4, -0.4], 39);

      return ({ u, T, bt, wa }) => {
        const aTease = wa(1); // 「啥子嘛」
        const aSlow = wa(2);  // 「慢慢」
        const aCome = wa(3);  // 「来」

        // 「慌」：鲸鱼娘先小慌一下；「啥子嘛」：挥手笑开；「慢慢来」：递出饭盆（本鲸标志动作）并悠然摇摆
        if (aTease < 0) {
          whale.act('shiver', T).at(-1.55, 0.16, 1.35).emote('fx_sweat', T);
        } else if (aSlow < 0) {
          whale.act('wave', T).at(-1.55, 0.16, 1.35).sq(beatSq(bt, 0.07));
        } else if (aCome < 0) {
          whale.act('point', T).at(-1.45, 0.16, 1.35).sq(beatSq(bt, 0.06)).emote('fx_sparkle', T);
        } else {
          whale.act('sway', T).at(-1.45, 0.16, 1.35).sq(beatSq(bt, 0.075)).emote('fx_heart', T);
        }

        // 饭盆随「慢慢」轻轻推向桌心
        const pushP = aSlow < 0 ? 0 : easeOut(clamp01(aSlow / 0.6));
        bowl.at(lerp(-0.72, -0.25, pushP), 1.32, 0.85);
        cup.rotation.y = T * 0.4;

        // 千问从容摇扇，在「啥子嘛」处轻鞠招呼，「慢慢来」随拍轻晃
        qwen
          .act(aSlow >= 0 ? 'sway' : 'nod', T)
          .at(1.6, 0.16, 1.35)
          .flip(true)
          .sq(beatSq(bt, 0.06));
        fan.at(1.05, 1.08, 1.5).tilt(Math.sin(T * 3.6) * 0.24);

        // 「慢慢」起唱时「不急」木牌翻转亮相，小蜗牛慢悠悠向前挪步
        const flipP = aSlow < 0 ? 0 : backOut(clamp01(aSlow / 0.5));
        sign.scale.setScalar(0.01 + 0.99 * flipP);
        sign.rotation.y = -0.28 + (1 - flipP) * PI;

        const snailP = aSlow < 0 ? u * 0.2 : 0.2 + ease(clamp01(aSlow / 1.6)) * 0.8;
        snail.position.x = lerp(-3.2, -1.6, snailP);
        snail.scale.set(0.9 * (1 + Math.sin(T * 5) * 0.04), 0.9 * (1 - Math.sin(T * 5) * 0.03), 0.9);

        steams.forEach((s, i) => {
          const ph = (T * 0.5 + i * 0.2) % 1;
          s.position.set(0.35 + Math.sin(T * 2.2 + i) * 0.1, 1.55 + ph * 1.1, 0.85);
          s.scale.setScalar(0.28 + ph * 0.4);
          setOp(s, Math.sin(ph * PI) * 0.42);
        });

        return glide(A, B, u);
      };
    },
  },

  // L02: 19.34–23.03s 「太阳下山有月亮爬上来」—— 西山落日 × 东山云阶升月 × 天空实时昼夜交替
  {
    id: 'L02',
    look: 'sunset',
    lookTo: 'moonrise',
    title: '太阳下山有月亮爬上来',
    cast: ['gpt', 'kimi', 'whale'],
    wordOpts: { pos: [0, 4.55, -1.5], scale: 0.88 },
    build: (k) => {
      k.add(disc(280, 0x4f7868));
      // 西山与东山层叠山峦
      k.add(hill(14, 5.2, 0x6b5a7e), -9.5, -0.5, -13);
      k.add(hill(14, 4.8, 0x4f5a8c), 9.5, -0.5, -13);
      k.add(hill(11, 2.8, 0x5c8c72), 0, -1.2, -9);

      // 西侧大太阳
      const sun = sun3D(2.05);
      k.add(sun.g, -5.8, 5.2, -16.5);

      // 东侧三阶云梯 + 3D 弯月
      const steps = [
        k.add(cloudPuff(2, 0.95, 0xe8ecff), 4.2, 1.8, -11.5),
        k.add(cloudPuff(5, 1.0, 0xf0f2ff), 5.2, 3.2, -12.0),
        k.add(cloudPuff(8, 1.05, 0xfff8e8), 6.0, 4.6, -12.5),
      ];
      const moon = k.add(crescentMoon3D(1.95), 5.4, 0.2, -14.8);

      // 前景观景小山坡
      k.add(cyl(6.8, 7.4, 0.25, 0x6ea67a, 28, 0.04), 0, 0, 1.5);
      const whale = k.actor('whale', 1.1);
      const kimi = k.actor('kimi', 1.12);
      const gpt = k.actor('gpt', 1.25);
      const scroll = k.thing('prop_scroll', 0.9);
      const stars = many(22, () => k.add(sprite('star', 0.45, 0xfff2a8, true, 0)));

      const A = cam([-1.8, 2.8, 12.6], [-0.4, 3.0, -4], 42);
      const B = cam([1.8, 3.0, 12.2], [0.6, 3.2, -4], 41);

      return ({ u, T, bt, wa, ca }) => {
        // 「下山」词触发太阳缓缓沉入西山
        const sinkAge = wa(1);
        const sinkP = sinkAge < 0 ? 0 : ease(clamp01(sinkAge / 1.35));
        sun.g.position.set(-5.6 - sinkP * 1.2, lerp(5.4, 0.6, sinkP), -16.5);
        sun.rays.rotation.z = T * 0.55;

        // 天空从绯橙日落平滑渐变为靛蓝月升
        const moonAge = wa(3); // 「月亮」
        const skyP = ease(clamp01((u - 0.22) / 0.62));
        k.lookMix(skyP);

        // 「月亮」探头 + 「爬(c7)·上(c8)·来(c9)」逐字一阶阶爬上云梯！
        const peek = moonAge < 0 ? 0 : easeOut(clamp01(moonAge / 0.5));
        const s1 = ca(7) < 0 ? 0 : backOut(clamp01(ca(7) / 0.3));
        const s2 = ca(8) < 0 ? 0 : backOut(clamp01(ca(8) / 0.3));
        const s3 = ca(9) < 0 ? 0 : backOut(clamp01(ca(9) / 0.45));
        const moonY = 0.2 + peek * 2.2 + s1 * 1.15 + s2 * 1.15 + s3 * 1.35;
        moon.position.set(4.4 + (s1 + s2 + s3) * 0.45, moonY, -14.5);
        moon.rotation.z = Math.sin(T * 1.8) * 0.08;

        steps.forEach((st, idx) => {
          const sp = idx === 0 ? s1 : idx === 1 ? s2 : s3;
          st.scale.setScalar(0.01 + 0.95 * Math.max(peek * 0.35, sp));
        });

        // 龙娘送落日，Kimi 迎升月，鲸鱼娘在坡顶左右仰望
        gpt.act('float', T).at(-3.5, 0.25, 0.8).size(1 - sinkP * 0.06).sq(beatSq(bt, 0.05));
        kimi
          .act(moonAge >= 0 ? 'hop' : 'idle', T)
          .at(2.8, 0.25, 1.2)
          .flip(true)
          .sq(beatSq(bt, 0.065))
          .emote(s3 > 0.2 ? 'fx_sparkle' : null, T);
        scroll.at(3.45, 0.85, 1.35);
        whale
          .act(moonAge >= 0 ? 'wave' : 'idle', T)
          .at(-0.3, 0.25, 1.9)
          .flip(moonAge < 0)
          .sq(beatSq(bt, 0.06));

        stars.forEach((st, i) => {
          st.position.set((hash(i) - 0.5) * 22, 4.5 + hash(i + 4) * 5.5, -12 - hash(i + 8) * 4);
          const tw = 0.5 + 0.5 * Math.sin(T * 4 + i * 1.7);
          setOp(st, skyP * tw * 0.95);
        });

        return glide(A, B, u);
      };
    },
  },

  // L03: 23.03–26.73s 「云会在 花会开」—— 三朵棉云逐字浮现 + 满坡鲜花逐字绽放
  {
    id: 'L03',
    look: 'meadow',
    title: '云会在 花会开',
    cast: ['doubao', 'whale', 'gemini'],
    wordOpts: { pos: [0, 4.55, -1.6], scale: 1.05 },
    build: (k) => {
      k.add(disc(260, 0x86db6e));
      mountainBackdrop(k.add(new THREE.Group()), 0x6ec982, 0x68b4d8, false);
      k.add(hill(14, 2.2, 0x7fd668), -6, -0.8, -6);
      k.add(hill(15, 2.6, 0x76cf62), 6.5, -0.8, -7);

      // 对应「云·会·在」三朵大棉花云
      const heroClouds = [
        k.add(cloudPuff(10, 1.35, 0xffffff), -5.8, 5.8, -9.5),
        k.add(cloudPuff(20, 1.55, 0xffffff), 0.2, 6.4, -10.5),
        k.add(cloudPuff(30, 1.4, 0xffffff), 6.0, 5.7, -9.5),
      ];

      // 对应「花·会·开」24 朵逐瓣盛开的 3D 花朵
      const palette = [0xff7eb3, 0xffcf56, 0xff9472, 0xc792ff, 0x7fd8ff, 0xff6b8b];
      const flowers = many(24, (i) => {
        const ring = i < 8 ? 0 : i < 16 ? 1 : 2;
        const f = bloomFlower(palette[i % palette.length], 0.72 + (i % 3) * 0.18, 1.12);
        const ang = (i / 24) * TAU;
        const rad = 2.6 + (i % 4) * 1.35;
        const x = Math.cos(ang) * rad * 1.45;
        const z = Math.sin(ang) * rad * 0.72 + 1.0;
        k.add(f.g, x, 0, z);
        return { f, ring };
      });

      const butterflies = many(8, () => k.add(sprite('butterfly', 0.48, 0xffffff, false, 0)));
      const doubao = k.actor('doubao', 1.12);
      const whale = k.actor('whale', 1.12);
      const gemini = k.actor('gemini', 1.08);
      const basket = k.thing('prop_basket', 0.95);

      const A = cam([0, 3.3, 12.2], [0, 2.4, -0.5], 41);
      const B = cam([0.8, 2.75, 10.6], [0, 2.3, -0.2], 39);

      return ({ u, T, bt, ca }) => {
        // 「云(0)·会(1)·在(2)」三朵白云逐字 Q 弹冒出并温柔悬停
        heroClouds.forEach((cl, i) => {
          const age = ca(i);
          const s = age < 0 ? 0.15 : backOut(clamp01(age / 0.42)) * (1.35 + (i === 1 ? 0.2 : 0));
          cl.scale.setScalar(s);
          cl.position.y = (i === 1 ? 6.5 : 5.8) + Math.sin(T * 1.7 + i * 1.4) * 0.22;
        });

        // 「花(3)·会(4)·开(5)」三圈花朵逐字破土盛放！
        const c3 = ca(3);
        const c4 = ca(4);
        const c5 = ca(5);
        flowers.forEach(({ f, ring }, i) => {
          const trigger = ring === 0 ? c3 : ring === 1 ? c4 : c5;
          const b = trigger < 0 ? 0.08 : easeOut(clamp01((trigger - (i % 3) * 0.04) / 0.45));
          f.setBloom(b);
          f.g.scale.setScalar(0.55 + 0.62 * b);
          f.g.rotation.z = Math.sin(T * 2.4 + i) * 0.08;
        });

        // 蝴蝶在「开」字唱响时漫天飞舞
        const openP = c5 < 0 ? 0 : clamp01(c5 / 0.6);
        butterflies.forEach((bf, i) => {
          const a = T * 1.1 + (i / 8) * TAU;
          bf.position.set(Math.cos(a) * (2.5 + (i % 3)), 1.3 + openP * 1.4 + Math.sin(T * 5 + i) * 0.25, Math.sin(a) * 2.2 + 1);
          setOp(bf, openP * 0.95);
        });

        const blooming = c3 >= 0;
        doubao
          .act(c5 >= 0 ? 'spin' : blooming ? 'hop' : 'step', T)
          .at(-1.85, 0, 1.35)
          .sq(beatSq(bt, 0.08))
          .emote(c5 >= 0 ? 'fx_sparkle' : null, T);
        basket.at(-1.1, 0.02, 1.65);

        whale
          .act(c5 >= 0 ? 'hop' : 'wave', T)
          .at(0.25, 0, 1.6)
          .sq(beatSq(bt, 0.07));

        gemini
          .act(blooming ? 'sway' : 'lookaround', T)
          .at(2.2, 0, 1.25)
          .flip(true)
          .sq(beatSq(bt, 0.065));

        return glide(A, B, u);
      };
    },
  },

  // L04: 26.73–30.42s 「好运总会为你而等待」—— 好运红灯六角亭 + 四叶草 + 跃水锦鲤
  {
    id: 'L04',
    look: 'golden',
    title: '好运总会为你而等待',
    cast: ['claude', 'whale'],
    wordOpts: { pos: [0, 4.55, -1.2], scale: 0.92 },
    build: (k) => {
      k.add(disc(240, 0x7bbf72));
      mountainBackdrop(k.add(new THREE.Group()), 0x8ea876, 0x9c8cb8, true);

      // 碧波锦鲤池 + 六角好运亭
      k.add(disc(9.5, 0x3fa3d6, 0.03));
      k.add(luckyPavilion(), 0, 0.03, -2.2);
      // 汀步石桥通往亭心
      many(5, (i) => k.add(cyl(0.68, 0.72, 0.16, 0xe8dfd0, 12, 0.03), (i % 2 ? 0.25 : -0.25), 0.03, 1.4 + i * 0.95));

      // 四株幸运四叶草
      const clovers = [
        k.add(fourLeafClover3D(1.25), -3.4, 0.05, 1.6),
        k.add(fourLeafClover3D(1.1), -2.4, 0.05, 2.4),
        k.add(fourLeafClover3D(1.25), 3.4, 0.05, 1.6),
        k.add(fourLeafClover3D(1.1), 2.4, 0.05, 2.4),
      ];

      // 池中双锦鲤
      const koi1 = k.add(koiFish(0xff6f3c, 1.05));
      const koi2 = k.add(koiFish(0xffca42, 0.95));

      // 悬挂暖灯笼串
      const lanterns = many(4, (i) =>
        k.add(redLantern(0.82), i < 2 ? -4.8 + i * 1.5 : 3.3 + (i - 2) * 1.5, 2.9, 0.6)
      );
      const glows = many(16, () => k.add(sprite('star', 0.45, 0xffe885, true, 0)));

      const claude = k.actor('claude', 1.12);
      const whale = k.actor('whale', 1.12);
      const teacup = k.thing('prop_teacup', 0.95);
      k.add(bambooTable(0.95), 0, 0.41, -1.6);

      return ({ u, T, bt, wa }) => {
        const aLuck = wa(0);  // 「好运」
        const aFor = wa(2);   // 「为你」
        const aWait = wa(4);  // 「等待」

        // 四叶草随「好运」弹性旋转舒展
        clovers.forEach((cl, i) => {
          const p = aLuck < 0 ? 0.5 : backOut(clamp01((aLuck - i * 0.08) / 0.45));
          cl.scale.setScalar(1.15 * p);
          cl.rotation.y = T * 0.8 + i;
        });

        // 锦鲤游弋，「为你」唱响时欢快跃出水面
        const leap = aFor < 0 ? 0 : Math.sin(clamp01(aFor / 0.85) * PI) * 1.15;
        const a1 = T * 0.9;
        koi1.position.set(-3.2 + Math.cos(a1) * 1.4, 0.14 + leap, 0.2 + Math.sin(a1) * 1.1);
        koi1.rotation.y = -a1 + PI / 2;
        koi2.position.set(3.2 + Math.cos(-a1) * 1.4, 0.14 + leap * 0.8, 0.4 + Math.sin(-a1) * 1.1);
        koi2.rotation.y = a1 - PI / 2;

        lanterns.forEach((ln, i) => {
          ln.rotation.z = Math.sin(T * 2.2 + i) * 0.09;
        });

        // 小克提裙行礼相迎，鲸鱼娘挥手守候
        claude
          .act(aWait >= 0 ? 'curtsy' : 'idle', T, aWait >= 0 ? T - aWait : 0)
          .at(-1.25, 0.41, -1.1)
          .sq(beatSq(bt, 0.055))
          .emote(aWait >= 0 ? 'fx_sparkle' : null, T);
        teacup.at(0, 1.38, -1.55);

        whale
          .act(aFor >= 0 ? 'wave' : 'nod', T)
          .at(1.25, 0.41, -1.1)
          .flip(true)
          .sq(beatSq(bt, 0.065))
          .emote(aWait >= 0 ? 'fx_heart' : null, T);

        glows.forEach((sp, i) => {
          const ph = (T * 0.42 + hash(i * 5)) % 1;
          sp.position.set((hash(i) - 0.5) * 9, 0.8 + ph * 3.8, -2 + (hash(i + 2) - 0.5) * 4);
          setOp(sp, Math.sin(ph * PI) * 0.8);
        });

        return track(
          [
            [0, cam([0, 3.2, 11.8], [0, 2.35, -1.5], 41)],
            [1, cam([0.4, 2.65, 9.2], [0, 2.25, -1.6], 39)],
          ],
          u
        );
      };
    },
  },
];
