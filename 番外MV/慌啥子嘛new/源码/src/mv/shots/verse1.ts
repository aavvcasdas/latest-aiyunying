// 第二章：主歌一 L05–L12（卸下疲惫 → 星枕入睡 → 晚风吹拂 → 忘却身份 → 清醒微醉 → 分担压力 → 人生路远 → 不必完美）
import * as THREE from 'three';
import { beatSq } from '../cues';
import { type ShotDef, cam, glide } from '../engine';
import {
  PI,
  TAU,
  backOut,
  ball,
  box,
  clamp01,
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
  archBridge,
  backpack3D,
  balloon3D,
  bambooChair,
  bambooCluster,
  bambooTable,
  banyanTree,
  bloomFlower,
  cloudPuff,
  coatRack,
  crescentMoon3D,
  dandelion3D,
  flipSign,
  footbathTub,
  gaiwanTea,
  hill,
  imperfectPuzzle,
  kintsugiBowl,
  miniBus,
  mountainBackdrop,
  pinwheel,
  redLantern,
  reedStalk,
  starCloudBed,
  wineJar,
  woodenFloor,
} from '../world';

export const VERSE1_SHOTS: ShotDef[] = [
  // L05: 「卸下一身的疲惫」—— 归家暖木玄关，卸下行囊与算盘，泡脚木桶热气袅袅
  {
    id: 'L05',
    look: 'cozy',
    title: '卸下一身的疲惫',
    cast: ['whale', 'zai'],
    wordOpts: { pos: [0, 4.55, -1.6], scale: 1.0 },
    build: (k) => {
      k.add(woodenFloor(28, 22));
      // 暖色木屋后墙与夜色大窗
      k.add(box(18, 6.8, 0.35, 0xf2dfc4, 0.05), 0, 0, -4.4);
      k.add(box(18.2, 0.7, 0.42, 0x7c4c2e, 0.03), 0, 0, -4.35);
      // 窗外靛蓝星夜
      k.add(box(3.8, 2.5, 0.18, 0x6b3e24, 0.04), 0, 1.55, -4.2);
      k.add(box(3.4, 2.15, 0.2, 0x253370, 0), 0, 1.72, -4.18);
      k.add(sprite('star', 0.42, 0xffe885, true, 0.9), -0.8, 3.2, -4.02);
      k.add(sprite('star', 0.32, 0xfff4bd, true, 0.85), 0.9, 2.9, -4.02);

      k.add(coatRack(), -4.2, 0, -2.5);
      k.add(redLantern(0.85), 4.2, 3.6, -2.2);
      k.add(bambooChair(1.15), -2.2, 0, -0.8, 0.45);
      k.add(bambooChair(1.15), 2.5, 0, -0.8, -0.45);
      k.add(bambooTable(0.95), 0, 0, -1.2);
      k.add(gaiwanTea(1.1), 0, 1.05, -1.15);

      // 沉甸甸的行囊 + 热气腾腾香柏木泡脚桶
      const pack = k.add(backpack3D(0xd97543, 1.15), -2.8, 1.35, 0.9, 0.3);
      k.add(footbathTub(1.05), 0.1, 0, 1.35);
      const puffs = many(6, () => k.add(sprite('smoke', 0.55, 0xfff5e6, false, 0)));

      const whale = k.actor('whale', 1.16);
      const zai = k.actor('zai', 1.14);
      const abacus = k.thing('prop_abacus', 0.95);
      const bowl = k.thing('prop_bowl', 0.9);

      const A = cam([-1.0, 3.6, 14.4], [0, 2.85, -1.2], 42);
      const B = cam([0.7, 3.35, 13.4], [0, 2.75, -1.2], 41);

      return ({ u, T, bt, wa }) => {
        const aDrop = wa(0);   // 「卸下」
        const aExhale = wa(2); // 「疲惫」

        // 「卸下」瞬间行囊从肩边落到木地板上，轻弹两下
        const dp = aDrop < 0 ? 0 : easeOut(clamp01(aDrop / 0.48));
        const bounce = aDrop > 0.35 && aDrop < 0.7 ? Math.sin(((aDrop - 0.35) / 0.35) * PI) * 0.16 : 0;
        pack.position.set(-2.95, lerp(1.15, 0, dp) + bounce, 0.95);
        pack.rotation.z = dp * 0.14;

        // 智谱把算盘搁在一边，舒舒服服开始打哈欠；鲸鱼娘卸完活舒展微笑
        whale
          .act(aExhale >= 0 ? 'sway' : aDrop >= 0 ? 'nod' : 'idle', T)
          .at(-1.55, 0, 0.55)
          .sq(beatSq(bt, 0.055))
          .emote(aExhale >= 0 ? 'fx_steam' : null, T);
        bowl.at(-0.45, 1.05, -1.1);

        zai
          .act(aExhale >= 0 ? 'doze' : 'idle', T)
          .at(1.65, 0, 0.55)
          .flip(true)
          .sq(beatSq(bt, 0.045))
          .emote(aExhale >= 0 ? 'fx_zzz' : null, T);
        abacus.at(3.2, 0, 0.95).tilt(-0.25 * dp);

        // 木桶热气袅袅升起
        puffs.forEach((p, i) => {
          const ph = (T * 0.42 + i * 0.17) % 1;
          p.position.set(0.1 + Math.sin(T * 1.8 + i) * 0.22, 0.62 + ph * 1.5, 1.35);
          p.scale.setScalar(0.32 + ph * 0.52);
          setOp(p, Math.sin(ph * PI) * 0.45);
        });

        return glide(A, B, u);
      };
    },
  },

  // L06: 「今夜枕着星光再入睡」—— 漂浮在星海上的蓬松星光云朵大床
  {
    id: 'L06',
    look: 'starbed',
    title: '今夜枕着星光再入睡',
    cast: ['zai', 'kimi', 'whale'],
    wordOpts: { pos: [0, 4.55, -1.4], scale: 0.92 },
    build: (k) => {
      // 镜面星河湖面
      k.add(disc(220, 0x1e215c));
      many(7, (i) =>
        k.add(
          cloudPuff(i * 5 + 3, 1.4 + (i % 3) * 0.4, 0xd8d4ff),
          -12 + i * 4,
          0.1,
          -6.5 - (i % 2) * 2.5
        )
      );

      // 中央巨大星光云朵床 + 月亮摇篮
      const bed = k.add(starCloudBed(), 0, 0.1, 0);
      const moon = k.add(crescentMoon3D(1.65), 4.6, 3.2, -4.8);

      // 垂挂下来的 12 颗发光星辰风铃
      const hangStars = many(12, (i) =>
        k.add(sprite('star', 0.65, i % 2 ? 0xffe87d : 0xfff6d1, true, 0.5))
      );
      const zzzs = many(4, () => k.add(sprite('zzz', 0.48, 0xd8eeff, false, 0)));

      const zai = k.actor('zai', 1.15);
      const whale = k.actor('whale', 1.1);
      const kimi = k.actor('kimi', 1.08);
      const eyemask = k.thing('prop_eyemask', 0.95);

      const A = cam([-2.4, 3.5, 11.4], [0, 2.35, -0.5], 40);
      const B = cam([1.6, 3.1, 10.2], [0, 2.25, -0.4], 39);

      return ({ u, T, bt, wa }) => {
        const aStar = wa(2);  // 「星光」
        const aSleep = wa(3); // 「再入睡」

        // 云床如摇篮般随呼吸轻浮
        const bob = Math.sin(T * 1.5) * 0.12;
        bed.position.y = 0.1 + bob;
        bed.rotation.z = Math.sin(T * 1.1) * 0.025;
        moon.rotation.z = 0.15 + Math.sin(T * 1.3) * 0.08;

        // 智谱戴眼罩枕在金黄星枕上香甜酣睡；鲸鱼娘安静守在床畔；Kimi 掌星灯
        zai
          .act('doze', T)
          .at(-0.55, 1.52 + bob, 0.28)
          .tilt(aSleep >= 0 ? 0.18 : 0.08)
          .noShadow();
        eyemask.at(0.62, 1.56 + bob, 0.66);

        whale
          .act('idle', T)
          .at(-3.15, 0.72, 1.35)
          .sq(beatSq(bt, 0.035));
        kimi
          .act(aStar >= 0 ? 'nod' : 'idle', T)
          .at(3.3, 0.72, 1.2)
          .flip(true)
          .emote(aStar >= 0 ? 'fx_sparkle' : null, T);

        // 「星光」起唱时漫天星光垂落点亮
        const starBoost = aStar < 0 ? 0.42 : 0.42 + 0.58 * easeOut(clamp01(aStar / 0.6));
        hangStars.forEach((st, i) => {
          const x = -5.5 + i * 1.0;
          const y = 2.6 + (i % 3) * 0.85 + Math.sin(T * 2.1 + i) * 0.18;
          const z = -2.2 + (i % 2) * 1.2;
          st.position.set(x, y, z);
          st.scale.setScalar((0.48 + (i % 3) * 0.14) * (0.85 + 0.35 * starBoost));
          setOp(st, starBoost * (0.7 + 0.3 * Math.sin(T * 3.8 + i)));
        });

        // 「再入睡」飘起一串可爱的 Z
        const sp = aSleep < 0 ? 0.25 : 1;
        zzzs.forEach((z, i) => {
          const ph = (T * 0.42 + i * 0.25) % 1;
          z.position.set(-0.2 + ph * 0.9, 2.5 + ph * 1.5, 0.1);
          z.scale.setScalar(0.28 + ph * 0.35);
          setOp(z, Math.sin(ph * PI) * 0.85 * sp);
        });

        return glide(A, B, u);
      };
    },
  },

  // L07: 「风啊轻轻吹」—— 暮色金色芦苇坡与旋转彩色纸风车
  {
    id: 'L07',
    look: 'dusk',
    title: '风啊轻轻吹',
    cast: ['gemini', 'whale'],
    wordOpts: { pos: [0, 4.55, -1.5], scale: 1.08 },
    build: (k) => {
      k.add(disc(260, 0x5c8f78));
      mountainBackdrop(k.add(new THREE.Group()), 0x566b8f, 0x6f5c92, true);
      k.add(hill(12, 1.9, 0x6ba682), 0, -0.9, 0);

      // 32 株随晚风起伏的金色芦苇
      const reeds = many(32, (i) => {
        const x = -7.5 + (i / 31) * 15 + (hash(i) - 0.5) * 0.4;
        const z = (i % 2 === 0 ? -2.2 : 2.3) + (hash(i + 4) - 0.5) * 1.4;
        return { obj: k.add(reedStalk(1.35 + hash(i + 2) * 0.55), x, 0.3, z), x };
      });

      // 5 支彩色纸风车
      const pws = [-4.6, -2.5, 0.1, 2.6, 4.7].map((x, i) => {
        const p = pinwheel(1.05);
        k.add(p.g, x, 0.55, -1.2 + (i % 2) * 0.5);
        return p;
      });

      // 随风掠过的花瓣与绿叶流线
      const breezeBits = many(22, (i) =>
        k.add(sprite(i % 2 ? 'petal' : 'leaf', 0.38, i % 3 ? 0xffd1dc : 0xb2f7c2, false, 0.85))
      );

      const gemini = k.actor('gemini', 1.14);
      const whale = k.actor('whale', 1.14);

      const A = cam([-2.8, 2.8, 11.2], [0.2, 2.35, -0.5], 40);
      const B = cam([2.4, 2.7, 10.6], [0, 2.3, -0.4], 40);

      return ({ u, T, bt, wa }) => {
        const aWind = wa(0); // 「风啊」
        const aBlow = wa(2); // 「吹」
        const gust = aBlow >= 0 ? 2.1 : aWind >= 0 ? 1.45 : 0.8;

        // 芦苇自左向右掀起温柔风浪
        reeds.forEach(({ obj, x }) => {
          obj.rotation.z = -0.14 * gust - Math.sin(T * 3.1 - x * 0.45) * 0.16 * gust;
        });

        // 纸风车迎风欢快旋转
        pws.forEach((p, i) => {
          p.wheel.rotation.z = -T * (3.2 + gust * 2.8) - i * 0.7;
        });

        // 漫天花瓣绿叶随风横掠
        breezeBits.forEach((b, i) => {
          const ph = (T * 0.28 * gust + hash(i * 4.1)) % 1;
          b.position.set(
            lerp(-9.5, 9.5, ph),
            1.2 + hash(i + 2) * 3.2 + Math.sin(ph * TAU + i) * 0.45,
            (hash(i + 7) - 0.5) * 5
          );
          setOp(b, Math.sin(ph * PI) * 0.9);
        });

        gemini
          .act(aWind >= 0 ? 'sway' : 'idle', T)
          .at(-1.45, 0.78, 0.75)
          .tilt(-0.04 * gust)
          .sq(beatSq(bt, 0.065));
        whale
          .act(aBlow >= 0 ? 'spin' : 'sway', T)
          .at(1.45, 0.78, 0.75)
          .flip(true)
          .sq(beatSq(bt, 0.07));

        return glide(A, B, u);
      };
    },
  },

  // L08: 「这一刻就忘了你是谁」—— 星池蒲公英原野，所有标签与烦恼化作发光绒伞飘向银河
  {
    id: 'L08',
    look: 'night',
    title: '这一刻就忘了你是谁',
    cast: ['kimi', 'whale', 'doubao'],
    wordOpts: { pos: [0, 4.55, -1.5], scale: 0.92 },
    build: (k) => {
      k.add(disc(240, 0x263f66));
      mountainBackdrop(k.add(new THREE.Group()), 0x243361, 0x313875, false);

      // 星光倒影圆池 + 草岸
      k.add(disc(6.2, 0x2e589e, 0.04));
      const ripples = many(3, () => k.add(sprite('ring', 2.0, 0xc8e4ff, true, 0)));
      ripples.forEach((r) => (r.material.rotation = 0));

      // 7 株发光巨型蒲公英
      const dands = [-5.2, -3.6, -2.1, 2.2, 3.7, 5.2, 0].map((x, i) =>
        k.add(dandelion3D(i === 6 ? 1.2 : 0.95), x, 0.04, i === 6 ? -2.6 : -1.8 + (i % 2) * 0.8)
      );

      // 30 朵飘向夜空的蒲公英绒伞
      const seeds = many(30, () => k.add(sprite('dandelion', 0.45, 0xfff8e0, false, 0)));

      const kimi = k.actor('kimi', 1.14);
      const whale = k.actor('whale', 1.12);
      const doubao = k.actor('doubao', 1.08);
      const scroll = k.thing('prop_scroll', 0.9);

      return ({ u, T, bt, wa }) => {
        const aForget = wa(1); // 「就忘了」
        const aWho = wa(2);    // 「你是谁」

        dands.forEach((d, i) => {
          d.rotation.z = Math.sin(T * 1.9 + i) * 0.09;
        });

        // 「就忘了你是谁」：蒲公英种子成群轻盈升向夜空
        const release = aForget < 0 ? 0.2 : clamp01(0.2 + aForget / 1.4);
        seeds.forEach((sd, i) => {
          const ph = (T * 0.24 + hash(i * 2.7)) % 1;
          sd.position.set(
            (hash(i) - 0.5) * 11 + ph * 2.2 + Math.sin(T * 1.8 + i) * 0.35,
            1.1 + ph * 5.8 * release,
            -1.5 + (hash(i + 5) - 0.5) * 4.5
          );
          sd.scale.setScalar(0.32 + Math.sin(ph * PI) * 0.22);
          setOp(sd, Math.sin(ph * PI) * (0.35 + 0.65 * release));
        });

        // 放下卷轴，轻松张开怀抱仰望星空
        kimi
          .act(aWho >= 0 ? 'hop' : 'idle', T)
          .at(-2.6, 0.04, 0.55)
          .sq(beatSq(bt, 0.055))
          .emote(aWho >= 0 ? 'fx_shine' : null, T);
        scroll.at(-3.45, 0.04, 0.75);

        whale
          .act(aForget >= 0 ? 'sway' : 'idle', T)
          .at(0, 0.04, 0.85)
          .sq(beatSq(bt, 0.06));
        doubao
          .act(aForget >= 0 ? 'sway' : 'idle', T)
          .at(2.6, 0.04, 0.55)
          .flip(true)
          .sq(beatSq(bt, 0.06));

        return glide(cam([0, 2.6, 11.8], [0, 2.15, -1.0], 41), cam([-0.7, 3.0, 11.2], [0, 2.35, -1.2], 40), u);
      };
    },
  },

  // L09: 「有时清醒有时醉」—— 月下翠竹小筑，左边一盏清茶，右边一坛桂花酿
  {
    id: 'L09',
    look: 'bamboo',
    title: '有时清醒有时醉',
    cast: ['claude', 'qwen'],
    wordOpts: { pos: [0, 4.55, -1.4], scale: 1.02 },
    build: (k) => {
      k.add(disc(200, 0x26544e));
      // 竹林环抱 + 木制亲水茶台
      k.add(box(8.8, 0.28, 5.4, 0xb88652, 0.045), 0, 0, 0);
      many(10, (i) => {
        const x = -7.2 + i * 1.6;
        const z = -3.8 - (i % 2) * 1.1;
        k.add(bambooCluster(5.8, i + 10), x, 0, z);
      });
      k.add(redLantern(0.85), -3.8, 3.1, -1.6);
      k.add(redLantern(0.85), 3.8, 3.1, -1.6);
      k.add(crescentMoon3D(1.4), 4.5, 6.2, -9.5);

      // 竹茶桌：左侧碧绿盖碗清茶（清醒），右侧红封桂花酿（微醉）
      k.add(bambooTable(1.25), 0, 0.28, 0.4);
      const tea = k.add(gaiwanTea(1.25), -0.62, 1.5, 0.45);
      const jar = k.add(wineJar('桂'), 0.62, 1.48, 0.42);

      // 微醺粉金小气泡
      const bubbles = many(12, () => k.add(sprite('bubble', 0.42, 0xffd1e3, false, 0)));

      const claude = k.actor('claude', 1.15);
      const qwen = k.actor('qwen', 1.15);
      const teacup = k.thing('prop_teacup', 0.92);
      const fan = k.thing('prop_fan', 0.95);

      const A = cam([-1.4, 2.85, 10.6], [0, 2.35, -0.4], 40);
      const B = cam([1.5, 2.8, 10.2], [0, 2.3, -0.4], 39);

      return ({ u, T, bt, wa }) => {
        const aSober = wa(1); // 「清醒」
        const aTipsy = wa(3); // 「醉」

        // 「清醒」：小克端庄点头品清茶，头顶清亮小灯泡
        claude
          .act(aSober >= 0 && aTipsy < 0 ? 'nod' : 'idle', T)
          .at(-1.85, 0.28, 0.95)
          .sq(beatSq(bt, 0.05))
          .emote(aSober >= 0 && aTipsy < 0 ? 'fx_bulb' : null, T);
        teacup.at(-1.12, 1.5, 0.58);
        tea.scale.setScalar(aSober >= 0 && aTipsy < 0 ? 1.38 : 1.22);

        // 「醉」：千问执扇微醺转圈轻摇，酒坛轻晃，漫天桂花气泡升起
        const tipsyTilt = aTipsy >= 0 ? Math.sin(T * 4.5) * 0.14 : 0;
        qwen
          .act(aTipsy >= 0 ? 'spin' : 'sway', T)
          .at(1.85, 0.28, 0.95)
          .flip(true)
          .tilt(tipsyTilt)
          .sq(beatSq(bt, 0.07))
          .emote(aTipsy >= 0 ? 'fx_heart' : null, T);
        fan.at(2.5, 1.15, 1.1).tilt(Math.sin(T * 4) * 0.28);
        jar.rotation.z = tipsyTilt * 0.8;

        const bp = aTipsy < 0 ? 0 : clamp01(aTipsy / 0.5);
        bubbles.forEach((b, i) => {
          const ph = (T * 0.55 + i * 0.11) % 1;
          b.position.set(
            0.8 + (hash(i) - 0.3) * 2.4 + Math.sin(T * 3 + i) * 0.2,
            1.8 + ph * 2.6,
            0.6 + (hash(i + 3) - 0.5) * 1.2
          );
          setOp(b, bp * Math.sin(ph * PI) * 0.9);
        });

        return glide(A, B, u);
      };
    },
  },

  // L10: 「别把所有压力自己背」—— 石拱桥上伙伴赶来分担，沉重巨石瞬间化作彩色气球飞向天空
  {
    id: 'L10',
    look: 'dusk',
    lookTo: 'golden',
    title: '别把所有压力自己背',
    cast: ['gpt', 'whale', 'doubao', 'qwen'],
    wordOpts: { pos: [0, 4.55, -1.2], scale: 0.88 },
    build: (k) => {
      k.add(disc(240, 0x679e76));
      mountainBackdrop(k.add(new THREE.Group()), 0x6e7d9e, 0x8c7ca8, true);

      // 桥下潺潺溪水 + 古朴石拱桥
      const stream = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, -28),
        new THREE.Vector3(0.8, 0, 0),
        new THREE.Vector3(-0.6, 0, 22),
      ]);
      k.add(ribbon(stream, 6.2, 40, waterMat(0x56b2e0, 0x2c6fb0, 0xffdf99), 0.04));
      k.add(archBridge(), 0, 0, 0);

      // 沉重灰暗的压力大石块 -> 化作 8 只缤纷轻盈气球！
      const rock = k.add(ball(1.05, 0x6c7085, true, 0.05), 0, 2.35, -0.35);
      const bCols = [0xff7b9c, 0xffd166, 0x72e0a8, 0x7ec8ff, 0xc79bff, 0xff9e6b, 0xffe875, 0xff85b8];
      const balloons = bCols.map((c) => k.add(balloon3D(c, 0.95), 0, 1.8, -0.2));

      const gpt = k.actor('gpt', 1.18);
      const whale = k.actor('whale', 1.1);
      const doubao = k.actor('doubao', 1.06);
      const qwen = k.actor('qwen', 1.08);

      const bridgeY = (x: number) => Math.max(0.1, Math.cos(clamp01((x / 11.5) + 0.5) * PI - PI / 2) * 1.45 + 0.34);

      const A = cam([0, 3.6, 12.6], [0, 2.8, -0.3], 42);
      const B = cam([0.4, 3.3, 11.2], [0, 3.0, -0.3], 40);

      return ({ u, T, bt, wa }) => {
        const aHeavy = wa(2); // 「压力」
        const aShare = wa(3); // 「自己背」（别自己背 -> 伙伴一起托起化作气球！）
        const freeP = aShare < 0 ? 0 : easeOut(clamp01(aShare / 0.7));
        k.lookMix(freeP);

        // 巨石缩小消失，彩色气球腾空而起
        const rockS = Math.max(0.001, (1 - freeP) * (aHeavy >= 0 && aShare < 0 ? 1.12 : 0.95));
        rock.visible = freeP < 0.92;
        rock.scale.set(rockS * 1.2, rockS * 0.9, rockS);

        balloons.forEach((bl, i) => {
          bl.visible = freeP > 0.04;
          const spread = (i - 3.5) * 0.75;
          bl.position.set(
            spread * freeP + Math.sin(T * 2.2 + i) * 0.14,
            1.8 + freeP * (2.2 + (i % 3) * 0.65),
            -0.6 - (i % 2) * 0.5
          );
          bl.scale.setScalar(backOut(freeP) * 0.88);
        });

        // 伙伴从桥两侧跑向中央陪伴龙娘
        const join = ease(clamp01(u / 0.65));
        const wx = lerp(-4.4, -1.85, join);
        const dx = lerp(4.4, 1.85, join);
        const qx = lerp(-5.4, -3.35, join);

        gpt
          .act(freeP > 0.2 ? 'hover' : 'float', T)
          .at(0, bridgeY(0) + freeP * 0.28, 0.25)
          .sq(beatSq(bt, 0.06))
          .emote(freeP > 0.3 ? 'fx_heart' : null, T);

        if (join < 0.95) {
          whale.walkBy(join * 3.2).at(wx, bridgeY(wx), 0.35);
          doubao.walkBy(join * 3.2).at(dx, bridgeY(dx), 0.35).flip(true);
          qwen.walkBy(join * 2.6).at(qx, bridgeY(qx), 0.15);
        } else {
          whale.act('wave', T).at(wx, bridgeY(wx), 0.35).sq(beatSq(bt, 0.07));
          doubao.act('hop', T).at(dx, bridgeY(dx), 0.35).flip(true).sq(beatSq(bt, 0.075));
          qwen.act('nod', T).at(qx, bridgeY(qx), 0.15).sq(beatSq(bt, 0.055));
        }

        return glide(A, B, u);
      };
    },
  },

  // L11: 「人生路还远」—— 晨曦微光里的蜿蜒山间公路、暖黄小巴士与「远方」木路牌
  {
    id: 'L11',
    look: 'dawn',
    title: '人生路还远',
    cast: ['whale', 'doubao'],
    wordOpts: { pos: [0, 4.55, -1.5], scale: 1.05 },
    build: (k) => {
      k.add(disc(300, 0x82cc74));
      mountainBackdrop(k.add(new THREE.Group()), 0x7ab896, 0x8da4d4, true);

      // 伸向晨曦远山的 S 形公路
      const roadCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-4.5, 0, 10),
        new THREE.Vector3(-1.2, 0, 2),
        new THREE.Vector3(3.2, 0, -8),
        new THREE.Vector3(-2.5, 0, -22),
        new THREE.Vector3(4.0, 0, -42),
      ]);
      k.add(ribbon(roadCurve, 3.6, 70, new THREE.MeshToonMaterial({ color: 0xe8d9be }), 0.06));

      // 路旁绿树、花丛与「远方」路牌
      k.add(flipSign('远方', 0xfff4d6), 3.4, 0, 1.4, -0.35);
      many(8, (i) => {
        const side = i % 2 ? 1 : -1;
        k.add(banyanTree(3.8 + hash(i) * 1.4, 0x5cc26e, i), side * (5.5 + hash(i + 2) * 3), 0, 2 - i * 4.5);
      });
      many(10, (i) => {
        const fl = bloomFlower(i % 2 ? 0xffd166 : 0xff94b2, 0.72, 1);
        k.add(fl.g, -5.5 + i * 1.2, 0, 3.4 + (hash(i) - 0.5) * 1.5);
      });

      const bus = k.add(miniBus(), 0, 0.06, -6);
      const whale = k.actor('whale', 1.12);
      const doubao = k.actor('doubao', 1.08);

      return ({ u, T, bt }) => {
        // 暖黄小巴士沿着蜿蜒山路悠然驶向远山晨光
        const bu = lerp(0.28, 0.58, u);
        const bp = roadCurve.getPointAt(bu);
        const btng = roadCurve.getTangentAt(bu);
        bus.position.set(bp.x, 0.06 + Math.abs(Math.sin(T * 8)) * 0.03, bp.z);
        bus.rotation.y = Math.atan2(-btng.z, btng.x);

        // 鲸鱼娘与豆包结伴从容漫步
        whale.walkBy(u * 3.8).at(lerp(-2.6, -1.2, u), 0.06, lerp(1.6, 0.1, u)).sq(beatSq(bt, 0.05));
        doubao.walkBy(u * 3.8).at(lerp(-0.8, 0.5, u), 0.06, lerp(1.8, 0.3, u)).sq(beatSq(bt, 0.06));

        return glide(cam([-2.0, 3.0, 12.2], [0.4, 2.15, -4], 42), cam([0.4, 3.4, 11.6], [0.6, 2.3, -6], 41), u);
      };
    },
  },

  // L12: 「你不必事事都完美」—— 温暖画室里缺了一角的 3D 拼图，缺口处绽放金粉小花 + 金缮茶盏
  {
    id: 'L12',
    look: 'teahouse',
    title: '你不必事事都完美',
    cast: ['claude', 'whale', 'gemini'],
    wordOpts: { pos: [0, 4.55, -1.2], scale: 0.94 },
    build: (k) => {
      k.add(woodenFloor(26, 20));
      k.add(box(18, 7.2, 0.35, 0xfaf0de, 0.05), 0, 0, -4.6);
      // 采光大花窗
      k.add(box(3.4, 2.8, 0.16, 0x8c5835, 0.035), -4.5, 1.6, -4.4);
      k.add(box(3.0, 2.4, 0.18, 0xbfe8ff, 0), -4.5, 1.8, -4.38);
      k.add(box(3.4, 2.8, 0.16, 0x8c5835, 0.035), 4.5, 1.6, -4.4);
      k.add(box(3.0, 2.4, 0.18, 0xbfe8ff, 0), 4.5, 1.8, -4.38);

      // 中央缺角开花大拼图 + 金缮修补茶盏
      const puzzle = imperfectPuzzle();
      k.add(puzzle.g, -0.3, 0, -2.0);
      k.add(bambooTable(0.95), 3.4, 0, -0.8);
      const bowl = k.add(kintsugiBowl(0.95), 3.4, 1.02, -0.8);

      const claude = k.actor('claude', 1.15);
      const whale = k.actor('whale', 1.12);
      const gemini = k.actor('gemini', 1.12);
      const hourglass = k.thing('prop_hourglass', 0.9);
      const brush = k.thing('prop_brush', 0.95);
      const sparks = many(14, () => k.add(sprite('star', 0.44, 0xffe07d, true, 0)));

      const A = cam([-0.7, 3.5, 14.2], [0, 3.05, -1.4], 42);
      const B = cam([0.5, 3.3, 13.2], [0, 2.95, -1.4], 41);

      return ({ u, T, bt, wa }) => {
        const aNoNeed = wa(0); // 「你不必」
        const aBloom = wa(3);  // 「完美」

        // 缺口处的小花在「完美」唱响时灿烂盛开——不完美正是花开的地方
        const bp = aBloom < 0 ? 0.18 : backOut(clamp01(aBloom / 0.5));
        puzzle.cornerFlower.setBloom(clamp01(bp));
        puzzle.cornerFlower.g.scale.setScalar(0.5 + 1.05 * bp);
        bowl.rotation.y = T * 0.5;

        // 小克（总怕犯错的大小姐）放下沙漏，释然开心跳起
        claude
          .act(aBloom >= 0 ? 'hop' : aNoNeed >= 0 ? 'shake' : 'read', T)
          .at(-2.55, 0, 0.85)
          .sq(beatSq(bt, 0.06))
          .emote(aBloom >= 0 ? 'fx_heart' : null, T);
        hourglass.at(-3.55, 0, 1.1);

        // 鲸鱼娘递出鼓励，猫挥着香蕉画笔添彩
        whale
          .act(aBloom >= 0 ? 'wave' : 'point', T)
          .at(-0.35, 0, 0.45)
          .sq(beatSq(bt, 0.065));
        gemini
          .act(aBloom >= 0 ? 'spin' : 'nod', T)
          .at(1.95, 0, 0.35)
          .flip(true)
          .sq(beatSq(bt, 0.065))
          .emote(aBloom >= 0 ? 'fx_sparkle' : null, T);
        brush.at(1.32, 0.9, 0.55).tilt(Math.sin(T * 4.5) * 0.3);

        sparks.forEach((sp, i) => {
          const ph = (T * 0.6 + hash(i * 3)) % 1;
          sp.position.set(0.35 + (hash(i) - 0.5) * 2.8, 2.0 + ph * 2.2, -1.3 + (hash(i + 4) - 0.5) * 1.4);
          setOp(sp, (aBloom >= 0 ? 1 : 0.2) * Math.sin(ph * PI) * 0.9);
        });

        return glide(A, B, u);
      };
    },
  },
];
