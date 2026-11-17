// 第四章：主歌二 L21–L28（全新场景与角色搭配，情绪从深夜抚慰递进至破晓释然）
import * as THREE from 'three';
import { beatSq } from '../cues';
import { type ShotDef, cam, glide } from '../engine';
import {
  PI,
  backOut,
  ball,
  box,
  clamp01,
  cyl,
  disc,
  easeOut,
  hash,
  lerp,
  many,
  ribbon,
  setOp,
  sprite,
} from '../kit';
import {
  backpack3D,
  balloon3D,
  bambooChair,
  bambooCluster,
  bambooTable,
  banyanTree,
  bloomFlower,
  cloudPuff,
  crescentMoon3D,
  dandelion3D,
  flipSign,
  gaiwanTea,
  imperfectPuzzle,
  kintsugiBowl,
  miniBus,
  mountainBackdrop,
  mountainHouse,
  pinwheel,
  redLantern,
  reedStalk,
  starCloudBed,
  wineJar,
  woodenFloor,
} from '../world';

export const VERSE2_SHOTS: ShotDef[] = [
  // L21: 「卸下一身的疲惫」—— 暖灯书阁，龙娘与小克双双放下沙漏（兑现人物设定），本鲸端上热茶饭
  {
    id: 'L21',
    look: 'cozy',
    title: '书阁放下双沙漏',
    cast: ['gpt', 'claude', 'whale'],
    wordOpts: { pos: [0, 4.55, -1.5], scale: 1.0 },
    build: (k) => {
      k.add(woodenFloor(28, 22));
      k.add(box(18, 7.0, 0.35, 0xf0dcc0, 0.05), 0, 0, -4.5);
      // 暖木书架两座
      for (const sx of [-4.8, 4.8]) {
        k.add(box(2.4, 3.6, 0.7, 0x7c4c2c, 0.04), sx, 0, -3.9);
        many(5, (i) =>
          k.add(
            box(0.32, 0.58, 0.45, [0xe86f5c, 0x6ba8d9, 0xf2c45a, 0x7ac792, 0xb88cd9][i], 0.02),
            sx - 0.72 + i * 0.36,
            1.65,
            -3.75
          )
        );
      }
      k.add(redLantern(0.85), -2.2, 3.6, -2.5);
      k.add(redLantern(0.85), 2.2, 3.6, -2.5);

      k.add(bambooTable(1.3), 0, 0, 0.3);
      k.add(bambooChair(1.05), -2.8, 0, 0.4, 0.5);
      k.add(bambooChair(1.05), 2.8, 0, 0.4, -0.5);
      k.add(gaiwanTea(1.15), -0.45, 1.15, 0.3);
      k.add(gaiwanTea(1.15), 0.45, 1.15, 0.3);

      const packL = k.add(backpack3D(0x8b7ec9, 1.05), -3.5, 1.1, 1.2, 0.3);
      const packR = k.add(backpack3D(0xe08b5c, 1.05), 3.5, 1.1, 1.2, -0.3);
      const steams = many(6, () => k.add(sprite('smoke', 0.48, 0xfff8eb, false, 0)));

      const gpt = k.actor('gpt', 1.16);
      const claude = k.actor('claude', 1.14);
      const whale = k.actor('whale', 1.12);
      const hg1 = k.thing('prop_hourglass', 0.92);
      const hg2 = k.thing('prop_hourglass', 0.92);
      const bowl = k.thing('prop_bowl', 0.92);

      const A = cam([1.0, 3.6, 14.6], [0, 2.9, -1.0], 42);
      const B = cam([-0.8, 3.35, 13.6], [0, 2.8, -1.0], 41);

      return ({ u, T, bt, wa }) => {
        const aDrop = wa(0);   // 「卸下」
        const aExhale = wa(2); // 「疲惫」
        const dp = aDrop < 0 ? 0 : easeOut(clamp01(aDrop / 0.5));

        packL.position.y = lerp(1.05, 0, dp);
        packR.position.y = lerp(1.05, 0, dp);
        // 两只沙漏平放歇息——今晚不再算时间！
        hg1.at(-3.9, 0, 0.45).tilt(dp * 0.45);
        hg2.at(3.9, 0, 0.45).tilt(-dp * 0.45);

        gpt
          .act(aExhale >= 0 ? 'nod' : 'float', T)
          .at(-2.05, 0, 0.95)
          .sq(beatSq(bt, 0.05))
          .emote(aExhale >= 0 ? 'fx_steam' : null, T);
        whale
          .act(aDrop >= 0 ? 'point' : 'idle', T)
          .at(0, 0, -0.85)
          .sq(beatSq(bt, 0.06))
          .emote(aExhale >= 0 ? 'fx_heart' : null, T);
        bowl.at(0, 1.15, 0.5);
        claude
          .act(aExhale >= 0 ? 'nod' : 'idle', T)
          .at(2.05, 0, 0.95)
          .flip(true)
          .sq(beatSq(bt, 0.05));

        steams.forEach((s, i) => {
          const ph = (T * 0.45 + i * 0.18) % 1;
          s.position.set((i % 2 ? 0.45 : -0.45), 1.45 + ph * 1.1, 0.3);
          setOp(s, Math.sin(ph * PI) * 0.42);
        });

        return glide(A, B, u);
      };
    },
  },

  // L22: 「今夜枕着星光再入睡」—— 银河云筏船队：三朵软云载着伙伴在星河中安睡
  {
    id: 'L22',
    look: 'starbed',
    title: '星河云筏入梦',
    cast: ['zai', 'doubao', 'kimi', 'whale'],
    wordOpts: { pos: [0, 4.55, -1.4], scale: 0.92 },
    build: (k) => {
      k.add(disc(240, 0x191d54));
      // 发光星河水道
      const milky = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-18, 0, -6),
        new THREE.Vector3(0, 0, 0.5),
        new THREE.Vector3(18, 0, -4),
      ]);
      k.add(ribbon(milky, 8.5, 50, new THREE.MeshBasicMaterial({ color: 0x3b358c }), 0.03));

      const bed = k.add(starCloudBed(), 0, 0.12, 0.2);
      const raftL = k.add(cloudPuff(21, 1.55, 0xefe8ff), -4.6, 0.25, 0.6);
      const raftR = k.add(cloudPuff(31, 1.55, 0xefe8ff), 4.6, 0.25, 0.6);
      const moon = k.add(crescentMoon3D(1.85), -4.8, 3.8, -5.5);

      const starRain = many(20, (i) =>
        k.add(sprite('star', 0.52, i % 2 ? 0xffe87d : 0xd8f0ff, true, 0.7))
      );
      const zzzs = many(5, () => k.add(sprite('zzz', 0.44, 0xd8eeff, false, 0)));

      const zai = k.actor('zai', 1.12);
      const doubao = k.actor('doubao', 1.05);
      const whale = k.actor('whale', 1.08);
      const kimi = k.actor('kimi', 1.08);
      const mask = k.thing('prop_eyemask', 0.92);

      const A = cam([2.2, 3.6, 11.8], [0, 2.4, -0.4], 41);
      const B = cam([-1.6, 3.1, 10.6], [0, 2.3, -0.4], 40);

      return ({ u, T, wa }) => {
        const aStar = wa(2) >= 0;
        const aSleep = wa(3) >= 0;
        const bob0 = Math.sin(T * 1.4) * 0.12;
        const bobL = Math.sin(T * 1.4 + 1.2) * 0.14;
        const bobR = Math.sin(T * 1.4 + 2.4) * 0.14;

        bed.position.y = 0.12 + bob0;
        raftL.position.y = 0.25 + bobL;
        raftR.position.y = 0.25 + bobR;
        moon.rotation.z = 0.2 + Math.sin(T * 1.2) * 0.08;

        zai.act('doze', T).at(-0.6, 1.54 + bob0, 0.3).tilt(0.16).noShadow();
        mask.at(0.45, 1.58 + bob0, 0.62);
        whale.act('idle', T).at(1.0, 1.54 + bob0, 0.42).flip(true).tilt(aSleep ? 0.1 : 0).noShadow();
        doubao.act('idle', T).at(-4.5, 1.42 + bobL, 0.55).tilt(aSleep ? 0.12 : 0).noShadow();
        kimi
          .act('idle', T)
          .at(4.5, 1.42 + bobR, 0.55)
          .flip(true)
          .noShadow()
          .emote(aStar ? 'fx_sparkle' : null, T);

        starRain.forEach((st, i) => {
          const ph = (T * 0.25 + hash(i * 3)) % 1;
          st.position.set((hash(i) - 0.5) * 14, 5.5 - ph * 3.6, -2.5 + (hash(i + 4) - 0.5) * 4);
          setOp(st, (aStar ? 1 : 0.55) * Math.sin(ph * PI));
        });

        zzzs.forEach((z, i) => {
          const ph = (T * 0.38 + i * 0.2) % 1;
          z.position.set(-0.4 + ph * 0.85, 2.55 + ph * 1.4, 0.15);
          setOp(z, (aSleep ? 0.9 : 0.35) * Math.sin(ph * PI));
        });

        return glide(A, B, u);
      };
    },
  },

  // L23: 「风啊轻轻吹」—— 竹影廊桥纸风车阵与翠叶清风
  {
    id: 'L23',
    look: 'bamboo',
    title: '竹廊清风转风车',
    cast: ['qwen', 'kimi', 'doubao'],
    wordOpts: { pos: [0, 4.55, -1.4], scale: 1.08 },
    build: (k) => {
      k.add(disc(240, 0x2c6659));
      mountainBackdrop(k.add(new THREE.Group()), 0x29545c, 0x386675, true);

      // 翠竹夹道与芦苇岸
      many(8, (i) => k.add(bambooCluster(5.4, i + 20), -7 + i * 2.0, 0, -4.2 - (i % 2) * 1.2));
      const reeds = many(24, (i) =>
        k.add(reedStalk(1.4 + (i % 3) * 0.22), -6.5 + i * 0.56, 0, 2.4 + (i % 2) * 0.5)
      );
      const pws = many(7, (i) => {
        const p = pinwheel(1.0);
        k.add(p.g, -5.4 + i * 1.8, 0, -1.4 + (i % 2) * 0.4);
        return p;
      });
      const leaves = many(24, (i) =>
        k.add(sprite(i % 3 ? 'leaf' : 'petal', 0.36, i % 3 ? 0x9ef5b0 : 0xffe49e))
      );

      const qwen = k.actor('qwen', 1.14);
      const kimi = k.actor('kimi', 1.12);
      const doubao = k.actor('doubao', 1.08);
      const fan = k.thing('prop_fan', 0.95);

      const A = cam([-2.2, 2.75, 10.8], [0, 2.35, -0.6], 40);
      const B = cam([2.2, 2.7, 10.4], [0, 2.3, -0.5], 40);

      return ({ u, T, bt, wa }) => {
        const gust = wa(2) >= 0 ? 2.2 : wa(0) >= 0 ? 1.5 : 0.85;
        reeds.forEach((r, i) => {
          r.rotation.z = -0.12 * gust - Math.sin(T * 3.0 - i * 0.35) * 0.14 * gust;
        });
        pws.forEach((p, i) => {
          p.wheel.rotation.z = -T * (3.5 + gust * 2.8) - i * 0.5;
        });
        leaves.forEach((lf, i) => {
          const ph = (T * 0.28 * gust + hash(i * 5)) % 1;
          lf.position.set(lerp(-9.5, 9.5, ph), 1.0 + hash(i + 2) * 3.5 + Math.sin(ph * 6 + i) * 0.4, (hash(i + 6) - 0.5) * 5);
          setOp(lf, Math.sin(ph * PI) * 0.9);
        });

        qwen.act('sway', T).at(-2.1, 0, 0.65).sq(beatSq(bt, 0.065));
        fan.at(-1.45, 0.95, 0.8).tilt(-0.2 + Math.sin(T * 3.5) * 0.25);
        kimi.act('idle', T).at(0.1, 0, 0.9).tilt(-0.04 * gust).sq(beatSq(bt, 0.055));
        doubao.act(wa(2) >= 0 ? 'spin' : 'sway', T).at(2.2, 0, 0.65).flip(true).sq(beatSq(bt, 0.07));

        return glide(A, B, u);
      };
    },
  },

  // L24: 「这一刻就忘了你是谁」—— 漫天流萤古树草坪，蒲公英与萤火一起升空
  {
    id: 'L24',
    look: 'night',
    title: '流萤草坪忘却烦忧',
    cast: ['whale', 'gemini', 'zai'],
    wordOpts: { pos: [0, 4.55, -1.4], scale: 0.92 },
    build: (k) => {
      k.add(disc(240, 0x243f5c));
      mountainBackdrop(k.add(new THREE.Group()), 0x1e2f59, 0x2c356e, false);
      k.add(banyanTree(6.4, 0x3b8c6e, 14), -6.2, 0, -4.2);
      k.add(banyanTree(5.8, 0x357d68, 18), 6.4, 0, -4.4);
      many(6, (i) => k.add(dandelion3D(0.95), -4.5 + i * 1.8, 0, -1.6 + (i % 2) * 0.6));

      // 34 只暖金萤火虫 + 飘飞蒲公英
      const fireflies = many(34, (i) =>
        k.add(sprite(i % 3 === 0 ? 'dandelion' : 'drop', 0.42, 0xffe885, i % 3 !== 0, 0))
      );

      const whale = k.actor('whale', 1.14);
      const gemini = k.actor('gemini', 1.12);
      const zai = k.actor('zai', 1.12);

      return ({ u, T, bt, wa }) => {
        const free = wa(1) >= 0; // 「就忘了」
        const liftAmt = free ? 1 : 0.45;

        fireflies.forEach((ff, i) => {
          const ph = (T * 0.26 + hash(i * 3.3)) % 1;
          const x = (hash(i) - 0.5) * 12 + Math.sin(T * 1.7 + i) * 0.55;
          const y = 0.5 + ph * 5.2 * liftAmt;
          const z = (hash(i + 4) - 0.5) * 6;
          ff.position.set(x, y, z);
          const blink = 0.55 + 0.45 * Math.sin(T * 5.2 + i * 2.1);
          setOp(ff, Math.sin(ph * PI) * blink);
        });

        gemini.act(free ? 'spin' : 'sway', T).at(-2.3, 0, 0.35).sq(beatSq(bt, 0.065));
        whale
          .act(free ? 'sway' : 'idle', T)
          .at(0, 0, 0.55)
          .sq(beatSq(bt, 0.065))
          .emote(wa(2) >= 0 ? 'fx_sparkle' : null, T);
        zai.act(free ? 'hop' : 'lookaround', T).at(2.3, 0, 0.35).flip(true).sq(beatSq(bt, 0.06));

        return glide(cam([1.2, 2.65, 11.6], [0, 2.2, -0.8], 41), cam([-1.0, 3.0, 11.0], [0, 2.4, -1.0], 40), u);
      };
    },
  },

  // L25: 「有时清醒有时醉」—— 山城月夜露台，清茶对桂花酿，万家灯火在脚下闪烁
  {
    id: 'L25',
    look: 'moonrise',
    title: '月夜露台清茶微醺',
    cast: ['qwen', 'whale', 'gpt'],
    wordOpts: { pos: [0, 4.55, -1.4], scale: 1.02 },
    build: (k) => {
      // 高处木露台 + 远处山谷万家暖窗
      k.add(box(10.5, 0.4, 5.4, 0x9e6c45, 0.045), 0, 0, 0.5);
      k.add(box(10.2, 0.12, 0.14, 0x734b2c, 0.025), 0, 1.15, -2.0);
      many(6, (i) => k.add(mountainHouse(i + 1, true), -10 + i * 4, -2.2, -9.5 - (i % 2) * 3));
      k.add(crescentMoon3D(1.85), 4.8, 6.2, -11.5);
      k.add(redLantern(0.82), -4.4, 3.1, -1.6);
      k.add(redLantern(0.82), 4.4, 3.1, -1.6);

      k.add(bambooTable(1.3), 0, 0.4, 0.6);
      k.add(gaiwanTea(1.2), -0.68, 1.62, 0.6);
      const jar = k.add(wineJar('桂'), 0.68, 1.6, 0.6);
      const bubbles = many(14, () => k.add(sprite('bubble', 0.42, 0xffcce0, false, 0)));

      const gpt = k.actor('gpt', 1.15);
      const whale = k.actor('whale', 1.14);
      const qwen = k.actor('qwen', 1.14);
      const teacup = k.thing('prop_teacup', 0.92);

      const A = cam([-1.5, 3.0, 10.8], [0, 2.5, -0.5], 40);
      const B = cam([1.5, 2.9, 10.4], [0, 2.45, -0.5], 39);

      return ({ u, T, bt, wa }) => {
        const aSober = wa(1) >= 0; // 「清醒」
        const aTipsy = wa(3) >= 0; // 「醉」
        const sway = aTipsy ? Math.sin(T * 4.4) * 0.13 : 0;

        gpt
          .act(aSober && !aTipsy ? 'nod' : 'float', T)
          .at(-2.35, 0.4, 0.95)
          .sq(beatSq(bt, 0.05))
          .emote(aSober && !aTipsy ? 'fx_bulb' : null, T);
        teacup.at(-1.1, 1.62, 0.72);

        whale
          .act(aTipsy ? 'sway' : 'eat', T)
          .at(0, 0.4, 1.55)
          .tilt(sway * 0.8)
          .sq(beatSq(bt, 0.07));
        qwen
          .act(aTipsy ? 'spin' : 'sway', T)
          .at(2.35, 0.4, 0.95)
          .flip(true)
          .tilt(-sway)
          .sq(beatSq(bt, 0.07))
          .emote(aTipsy ? 'fx_heart' : null, T);
        jar.rotation.z = sway;

        bubbles.forEach((b, i) => {
          const ph = (T * 0.52 + i * 0.1) % 1;
          b.position.set(0.4 + (hash(i) - 0.4) * 3.2, 1.9 + ph * 2.5, 0.7);
          setOp(b, (aTipsy ? 0.9 : 0) * Math.sin(ph * PI));
        });

        return glide(A, B, u);
      };
    },
  },

  // L26: 「别把所有压力自己背」—— 木跷跷板失衡重石，被伙伴们合力变成缤纷气球与软云！
  {
    id: 'L26',
    look: 'dusk',
    lookTo: 'teahouse',
    title: '跷跷板化重石为轻云',
    cast: ['claude', 'zai', 'whale', 'doubao', 'gemini'],
    wordOpts: { pos: [0, 4.55, -1.2], scale: 0.9 },
    build: (k) => {
      k.add(disc(240, 0x76bf72));
      mountainBackdrop(k.add(new THREE.Group()), 0x6ea88c, 0x829ec9, true);

      // 中央大木跷跷板
      k.add(cyl(0.28, 0.65, 0.85, 0x8c5530, 6, 0.04), 0, 0, 0.2);
      const plank = k.add(box(6.4, 0.18, 1.1, 0xe0a85c, 0.04), 0, 0.85, 0.2);

      // 跷跷板左端沉重灰石 -> 变成软棉花云 + 10 只彩气球
      const heavy = k.add(ball(0.95, 0x6b7085, true, 0.045), -2.3, 0.75, 0.2);
      const softCloud = k.add(cloudPuff(12, 0.9, 0xffffff), -2.3, 1.2, 0.2);
      const cols = [0xff7b9c, 0xffd166, 0x78e0a8, 0x78ccff, 0xc89eff];
      const balloons = many(10, (i) => k.add(balloon3D(cols[i % cols.length], 0.9)));

      const claude = k.actor('claude', 1.1);
      const zai = k.actor('zai', 1.08);
      const whale = k.actor('whale', 1.12);
      const doubao = k.actor('doubao', 1.08);
      const gemini = k.actor('gemini', 1.08);

      const A = cam([0, 3.2, 12.2], [0, 2.45, -0.3], 41);
      const B = cam([0, 2.9, 10.8], [0, 2.4, -0.2], 40);

      return ({ u, T, bt, wa }) => {
        const aShare = wa(3); // 「自己背」
        const p = aShare < 0 ? 0 : easeOut(clamp01(aShare / 0.75));
        k.lookMix(p);

        // 跷跷板从被压偏恢复轻快平衡摇摆
        plank.rotation.z = lerp(0.2, Math.sin(T * 2.5) * 0.06, p);
        heavy.visible = p < 0.85;
        heavy.scale.setScalar(Math.max(0.01, 1 - p));
        softCloud.visible = p > 0.1;
        softCloud.scale.setScalar(backOut(p) * 0.95);
        softCloud.position.y = 1.4 + p * 1.6;

        balloons.forEach((bl, i) => {
          bl.visible = p > 0.05;
          bl.position.set(
            -2.0 + (i - 4.5) * 0.75 * p + Math.sin(T * 2 + i) * 0.15,
            1.2 + p * (2.5 + (i % 3) * 0.7),
            -0.5 - (i % 2) * 0.6
          );
        });

        claude.act(p > 0.2 ? 'hop' : 'sad', T).at(-3.9, 0, 0.95).sq(beatSq(bt, 0.06));
        zai.act(p > 0.2 ? 'hop' : 'alert', T).at(-1.2, 0, 1.55).sq(beatSq(bt, 0.06));
        whale
          .act(p > 0.2 ? 'wave' : 'point', T)
          .at(0.9, 0, 1.55)
          .flip(true)
          .sq(beatSq(bt, 0.07))
          .emote(p > 0.3 ? 'fx_heart' : null, T);
        doubao.act('hop', T).at(2.5, 0, 1.25).flip(true).sq(beatSq(bt, 0.075));
        gemini.act('sway', T).at(4.0, 0, 0.9).flip(true).sq(beatSq(bt, 0.065));

        return glide(A, B, u);
      };
    },
  },

  // L27: 「人生路还远」—— 破晓云海山脊公路，小巴士载着晨光驶向辽阔天地
  {
    id: 'L27',
    look: 'dawn',
    title: '破晓山脊远行路',
    cast: ['whale', 'gemini', 'qwen', 'kimi'],
    wordOpts: { pos: [0, 4.55, -1.4], scale: 1.05 },
    build: (k) => {
      k.add(disc(300, 0x7fd172));
      mountainBackdrop(k.add(new THREE.Group()), 0x6fc294, 0x82a8de, true);

      const road = new THREE.CatmullRomCurve3([
        new THREE.Vector3(-12, 0, 2.5),
        new THREE.Vector3(-3, 0, 1.2),
        new THREE.Vector3(5, 0, -2.5),
        new THREE.Vector3(14, 0, -14),
      ]);
      k.add(ribbon(road, 3.4, 65, new THREE.MeshToonMaterial({ color: 0xede0c7 }), 0.06));

      k.add(flipSign('远方', 0xfff3d4), -4.5, 0, -1.2, 0.25);
      many(7, (i) => k.add(banyanTree(4.2, 0x58c26c, i + 30), -10 + i * 3.6, 0, -4.5 - i * 0.9));
      many(5, (i) => k.add(cloudPuff(i * 8, 1.6, 0xfff5eb), -9 + i * 4.8, 5.6 + (i % 2), -14));

      const bus = k.add(miniBus(), 0, 0.06, 0);
      const whale = k.actor('whale', 1.08);
      const gemini = k.actor('gemini', 1.06);
      const qwen = k.actor('qwen', 1.06);
      const kimi = k.actor('kimi', 1.06);

      return ({ u, T, bt }) => {
        const bu = lerp(0.32, 0.68, u);
        const bp = road.getPointAt(bu);
        const tg = road.getTangentAt(bu);
        bus.position.set(bp.x, 0.06 + Math.abs(Math.sin(T * 9)) * 0.03, bp.z);
        bus.rotation.y = Math.atan2(-tg.z, tg.x);

        // 四位伙伴在路畔花坡向远方挥手前行
        whale.walkX(-3.4, -1.8, u, 0.06, 1.35).sq(beatSq(bt, 0.06));
        gemini.walkX(-1.9, -0.3, u, 0.06, 1.55).sq(beatSq(bt, 0.06));
        qwen.walkX(-0.4, 1.2, u, 0.06, 1.45).sq(beatSq(bt, 0.06));
        kimi.walkX(1.1, 2.6, u, 0.06, 1.25).sq(beatSq(bt, 0.06));

        return glide(cam([-2.8, 3.1, 12.6], [0.8, 2.25, -2.5], 42), cam([1.2, 3.4, 12.2], [1.8, 2.4, -3.5], 41), u);
      };
    },
  },

  // L28: 「你不必事事都完美」—— 阳光花院金缮花台与缺角开花拼图，拥抱每一道可爱的小缺口
  {
    id: 'L28',
    look: 'meadow',
    title: '金缮花院拥抱不完美',
    cast: ['claude', 'whale', 'doubao', 'zai', 'gpt'],
    wordOpts: { pos: [0, 4.55, -1.2], scale: 0.94 },
    fx: { whiteOut: true },
    build: (k) => {
      k.add(disc(250, 0x86db6e));
      mountainBackdrop(k.add(new THREE.Group()), 0x6cc984, 0x6ab4db, true);
      k.add(cyl(8.8, 9.2, 0.2, 0xf5ecd9, 32, 0.04), 0, 0, -0.5);

      const puzzle = imperfectPuzzle();
      k.add(puzzle.g, 0, 0.2, -2.8);

      // 左右两只金缮修补花钵，盛放灿烂花朵
      k.add(kintsugiBowl(1.15), -3.8, 0.2, -1.2);
      k.add(kintsugiBowl(1.15), 3.8, 0.2, -1.2);
      const flL = bloomFlower(0xff80ab, 0.9, 1.3);
      const flR = bloomFlower(0xffd156, 0.9, 1.3);
      k.add(flL.g, -3.8, 0.85, -1.2);
      k.add(flR.g, 3.8, 0.85, -1.2);

      const petals = many(22, (i) =>
        k.add(sprite(i % 2 ? 'petal' : 'star', 0.42, i % 2 ? 0xffb3cf : 0xffe47d, i % 2 === 0, 0))
      );

      const gpt = k.actor('gpt', 1.12);
      const claude = k.actor('claude', 1.14);
      const whale = k.actor('whale', 1.14);
      const doubao = k.actor('doubao', 1.1);
      const zai = k.actor('zai', 1.1);

      const A = cam([0, 3.1, 11.8], [0, 2.5, -1.0], 41);
      const B = cam([0, 2.85, 10.2], [0, 2.45, -1.0], 39);

      return ({ u, T, bt, wa }) => {
        const aBloom = wa(3); // 「完美」
        const bp = aBloom < 0 ? 0.25 : backOut(clamp01(aBloom / 0.48));
        puzzle.cornerFlower.setBloom(clamp01(bp));
        puzzle.cornerFlower.g.scale.setScalar(0.55 + bp);
        flL.setBloom(clamp01(bp));
        flR.setBloom(clamp01(bp));

        gpt.act('nod', T).at(-3.4, 0.2, 0.85).sq(beatSq(bt, 0.055));
        claude
          .act(aBloom >= 0 ? 'hop' : 'curtsy', T)
          .at(-1.65, 0.2, 1.25)
          .sq(beatSq(bt, 0.07))
          .emote(aBloom >= 0 ? 'fx_heart' : null, T);
        whale
          .act(aBloom >= 0 ? 'spin' : 'wave', T)
          .at(0.05, 0.2, 1.45)
          .sq(beatSq(bt, 0.075))
          .emote(aBloom >= 0 ? 'fx_sparkle' : null, T);
        doubao.act('hop', T).at(1.75, 0.2, 1.25).flip(true).sq(beatSq(bt, 0.08));
        zai.act('hop', T).at(3.4, 0.2, 0.85).flip(true).sq(beatSq(bt, 0.065));

        petals.forEach((pt, i) => {
          const ph = (T * 0.45 + hash(i * 4)) % 1;
          pt.position.set((hash(i) - 0.5) * 11, 1.2 + ph * 4.2, -1 + (hash(i + 2) - 0.5) * 4);
          setOp(pt, (aBloom >= 0 ? 0.95 : 0.25) * Math.sin(ph * PI));
        });

        return glide(A, B, u);
      };
    },
  },
];
