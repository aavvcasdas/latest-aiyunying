// 分镜表（下）：间奏二 B01–B04 · 终章双副歌 F01–F08 · 尾声 OUT1–OUT2
import * as THREE from 'three';
import {
  archedBridge,
  backdropHills,
  bambooStalk,
  bridgeHeight,
  crescentMoon,
  ease,
  glass,
  ground,
  hash,
  herbariumBook,
  lerp,
  makeSprite,
  many,
  milkyWaySky,
  musicBox,
  PI,
  pinwheel,
  plumpHeart,
  primroseBlossom,
  primrosePlant,
  primrosePot,
  rippleRing,
  roundCyl,
  seasonTree,
  seg,
  setSpriteOp,
  skyLantern,
  softBox,
  softCloud,
  softHill,
  TAU,
  teaPavilion,
  windChime,
} from './kit';
import { beatBounce, cam, glide, type ShotDef } from './types';

export const SHOTS_C: ShotDef[] = [
  // ── B01：间奏二 · 晚霞花阶双人舞 ─────────────────────────────────────────
  {
    id: 'B01',
    title: '晚霞花阶轻舞',
    lyric: 'La la la · 暮金花田圆舞曲',
    cast: ['doubao', 'gemini'],
    look: 'sunset',
    note: '晚霞把樱花草山谷染成蜜桃金，豆包与猫娘沿着弧形发光花阶踩拍欢舞。',
    build: (k) => {
      k.add(ground(115, 0x7d9e82));
      backdropHills(k.root, 0x8f6688, 0xb87d8f, 74);
      const cols = [0xff94be, 0xffd972, 0x99f0c9, 0x9be2ff, 0xffa8cc, 0xffe48f, 0xcab8ff];
      const steps = many(7, (i) => {
        const a = lerp(-0.9, 0.9, i / 6);
        const x = Math.sin(a) * 4.2;
        const z = Math.cos(a) * 2.2 - 1.5;
        const m = k.add(roundCyl(0.52, 0.56, 0.2, cols[i], 18, cols[i], 0.25), x, 0, z);
        k.add(primrosePlant(0.72, cols[i], 0.35), x, 0, z - 0.85);
        return m;
      });
      const doubao = k.actor('doubao');
      const gemini = k.actor('gemini').wear('bow');
      const A = cam([-1.2, 2.35, 7.6], [0, 1.05, 0], 39);
      const B = cam([1.2, 2.25, 7.2], [0, 1.05, 0], 38);
      return ({ u, T, bt }) => {
        steps.forEach((st, i) => {
          st.position.y = Math.max(0, Math.sin(T * 5.2 - i * 0.7)) * 0.14;
        });
        doubao.act('step', T).at(-1.25, 0.22, 0.45).sq(beatBounce(bt, 0.06)).emote('fx_sparkle', T);
        gemini.act('spin', T).faceLeft(true).at(1.25, 0.22, 0.45);
        return glide(A, B, u);
      };
    },
  },

  // ── B02：间奏二 · 暮色茶亭风铃与睡醒的小狐狸 ─────────────────────────────
  {
    id: 'B02',
    title: '暮色茶亭风铃和鸣',
    lyric: 'La la la · 晚风摇响檐角清音',
    cast: ['qwen', 'kimi', 'zai'],
    look: 'sunset',
    note: '晚霞茶亭檐下风铃轻响，狐狸揉眼醒来竖起耳朵加入合唱，千问与 Kimi 含笑相伴。',
    build: (k) => {
      k.add(ground(110, 0x728f7e));
      backdropHills(k.root, 0x7c5980, 0xa87088, 74);
      k.add(teaPavilion(1.0), 0, 0, -0.5);
      const chL = windChime(0xffb3d1, 0xffe494);
      const chR = windChime(0x9be8ff, 0xffb3d1);
      k.add(chL.root, -1.45, 2.95, 1.0);
      k.add(chR.root, 1.45, 2.95, 1.0);
      const qwen = k.actor('qwen');
      const kimi = k.actor('kimi').wear('tiara');
      const zai = k.actor('zai');
      const A = cam([0.8, 2.05, 7.0], [0, 1.25, -0.2], 38);
      const B = cam([-0.8, 1.95, 6.4], [0, 1.25, -0.2], 37);
      return ({ u, T, bt }) => {
        chL.pendulum.rotation.z = Math.sin(T * 3.8) * 0.25;
        chR.pendulum.rotation.z = Math.cos(T * 3.8) * 0.25;
        qwen.act('sway', T).at(-1.1, 0.26, -0.2).sq(beatBounce(bt, 0.045));
        kimi.idle(T).at(0.1, 0.26, -0.55).sq(beatBounce(bt, 0.035));
        zai.act('hop', T).faceLeft(true).at(1.25, 0.26, -0.15).emote('fx_shine', T);
        return glide(A, B, u);
      };
    },
  },

  // ── B03：间奏二 · 八音盒星月回忆流转 ─────────────────────────────────────
  {
    id: 'B03',
    title: '星月八音盒回忆回旋',
    lyric: 'La la la · 弯月与萤火围绕八音盒旋转',
    cast: ['whale', 'claude'],
    look: 'dream',
    note: '紫粉暮空下，樱花草八音盒与弯月、萤火一同轻旋，本鲸与小克隔着发光花冠相视微笑。',
    build: (k) => {
      k.add(ground(110, 0x453b6e));
      const mb = musicBox();
      k.add(mb.root, 0, 0, -0.4);
      k.add(crescentMoon(1.75, 0xffe48f), 3.6, 5.6, -16);
      const flies = many(28, (i) =>
        k.add(makeSprite('coin', 0.42, i % 2 ? 0xffe485 : 0xffb3d9, true, 0.8))
      );
      const whale = k.actor('whale');
      const claude = k.actor('claude').wear('crown');
      const A = cam([-1.5, 2.35, 7.6], [0, 1.35, -0.2], 38);
      const B = cam([1.5, 2.15, 7.0], [0, 1.35, -0.2], 37);
      return ({ u, T, bt }) => {
        mb.stage.rotation.y = T * 0.9;
        whale.act('sway', T).at(-2.7, 0, 0.5).sq(beatBounce(bt, 0.045)).emote('fx_heart', T);
        claude.act('sway', T).faceLeft(true).at(2.7, 0, 0.5).sq(beatBounce(bt, 0.045));
        flies.forEach((f, i) => {
          const a = T * 0.55 + (i / 28) * TAU;
          const r = 2.6 + (i % 4) * 0.85;
          f.position.set(Math.cos(a) * r, 0.7 + ((i / 28 + T * 0.18) % 1) * 3.5, -0.3 + Math.sin(a) * r * 0.7);
        });
        return glide(A, B, u);
      };
    },
  },

  // ── B04：间奏二 · 漫山天灯迎向终章 ───────────────────────────────────────
  {
    id: 'B04',
    title: '百盏花灯升向银河',
    lyric: 'La la la · 全员仰望漫天灯海升空',
    cast: ['doubao', 'gemini', 'whale', 'claude', 'qwen', 'kimi', 'zai'],
    look: 'galaxy',
    fx: { whiteOut: true },
    note: '七位伙伴并立山脊，满山暖金樱粉天灯齐齐升向璀璨银河，把情绪推向终章高潮！',
    build: (k) => {
      k.add(ground(120, 0x1c2252));
      k.add(softHill(10.5, 1.1, 5.5, 0x2a326b), 0, -0.25, -0.2);
      k.add(milkyWaySky(true).root);
      const lans = many(30, (i) =>
        k.add(skyLantern(i % 2 ? 0xffcf78 : 0xff9ec4, 0.7 + hash(i) * 0.4))
      );
      const cast = [
        k.actor('doubao'),
        k.actor('gemini').wear('bow'),
        k.actor('whale'),
        k.actor('claude').wear('crown'),
        k.actor('qwen'),
        k.actor('kimi').wear('tiara'),
        k.actor('zai'),
      ];
      const A = cam([0, 2.25, 9.4], [0, 2.0, -2], 41);
      const B = cam([0, 2.85, 10.4], [0, 3.4, -4], 42);
      return ({ u, T, bt }) => {
        const sq = beatBounce(bt, 0.045);
        cast.forEach((ac, i) => {
          const x = -4.2 + i * 1.4;
          const y = 0.82 - Math.abs(i - 3) * 0.09;
          ac.act(i === 2 ? 'wave' : 'sway', T).faceLeft(i > 3).at(x, y, 0).sq(sq);
        });
        lans.forEach((ln, i) => {
          const base = 1.2 + hash(i * 5) * 5.2;
          ln.position.set(
            (hash(i * 3) - 0.5) * 16 + Math.sin(T + i) * 0.3,
            base + u * 3.8,
            -9 + hash(i * 7) * 9.5
          );
        });
        return glide(A, B, u);
      };
    },
  },

  // ── F01：终章副歌一 · 暮光花桥携手微笑 ───────────────────────────────────
  {
    id: 'F01',
    title: '暮光花桥与春彩微笑',
    lyric: '恋人手中樱花草，春彩漫步的微笑',
    cast: ['whale', 'claude'],
    look: 'sunset',
    fx: { whiteIn: true },
    note: '玫瑰金晚霞洒满溪上樱花草花桥，两旁樱树花雨纷飞，本鲸与小克隔着盛放的樱花草花盆在桥心微笑轻舞。',
    build: (k) => {
      k.add(ground(120, 0x7da888));
      backdropHills(k.root, 0x9e6e8f, 0xd48ca3, 76);
      const river = k.add(new THREE.Mesh(new THREE.PlaneGeometry(8.8, 70), glass(0xf2a6b8, 0.65)), 0, 0.04, -5);
      river.rotation.x = -PI / 2;
      k.add(archedBridge(4.0, 0.82, 2.1), 0, 0.02, 0.2);
      const pot = k.add(primrosePot(1.02), 0, 0.88, 0.35);
      k.add(seasonTree('spring', 1.4, 2), -5.8, 0, -2.5);
      k.add(seasonTree('spring', 1.4, 8), 5.8, 0, -2.5);
      const petals = many(36, (i) =>
        k.add(makeSprite('petal', 0.3, i % 2 ? 0xffa8cc : 0xffe49e, false, 0.9))
      );
      const whale = k.actor('whale');
      const claude = k.actor('claude').wear('crown');
      const A = cam([-1.8, 2.25, 7.6], [0, 1.35, 0.2], 38);
      const B = cam([1.8, 2.05, 6.8], [0, 1.35, 0.2], 37);
      return ({ u, T, bt }) => {
        pot.rotation.y = T * 0.7;
        whale
          .act('sway', T)
          .at(-1.12, bridgeHeight(-1.12, 4.0, 0.82) + 0.08, 0.2)
          .sq(beatBounce(bt, 0.05))
          .emote('fx_heart', T);
        claude
          .act('sway', T)
          .faceLeft(true)
          .at(1.12, bridgeHeight(1.12, 4.0, 0.82) + 0.08, 0.2)
          .sq(beatBounce(bt, 0.05));
        petals.forEach((p, i) => {
          const ph = (T * 0.36 + hash(i * 3)) % 1;
          p.position.set((hash(i * 5) - 0.5) * 11, 4.6 - ph * 4.2, -3 + hash(i * 7) * 6);
          p.material.rotation = T * 2 + i;
        });
        return glide(A, B, u);
      };
    },
  },

  // ── F02：终章副歌一 · 漫山盛放与星光礼花 ─────────────────────────────────
  {
    id: 'F02',
    title: '星光花火照亮年少',
    lyric: '种下了一朵朵，青春璀璨的年少',
    cast: ['whale', 'claude', 'doubao', 'gemini'],
    look: 'dream',
    note: '曾经种下的一朵朵樱花草已铺满整座暮紫山丘，夜空绽开柔和的粉金花瓣烟火，照亮璀璨年少！',
    build: (k) => {
      k.add(ground(120, 0x455e68));
      k.add(softHill(10, 1.1, 5.5, 0x56787a), 0, -0.25, -0.2);
      many(32, (i) =>
        k.add(
          primrosePlant(0.85, i % 2 ? 0xff8ab5 : 0xffe085, 0.42),
          -7.5 + (i % 16) * 1.0,
          0.2,
          i < 16 ? 1.35 : -2.1
        )
      );
      // 三簇柔美粉金礼花
      const bursts = [-4.2, 0, 4.2].map((bx, bi) => {
        const col = bi === 0 ? 0xff9ec4 : bi === 1 ? 0xffe485 : 0x9be8ff;
        const pts = many(16, (j) => {
          const a = (j / 16) * TAU;
          return {
            sp: k.add(makeSprite('star', 0.55, col, true, 0)),
            dx: Math.cos(a),
            dy: Math.sin(a),
          };
        });
        return { bx, by: 5.2 + (bi === 1 ? 1.1 : 0), pts, offset: bi * 0.26 };
      });
      const doubao = k.actor('doubao');
      const whale = k.actor('whale');
      const claude = k.actor('claude').wear('crown');
      const gemini = k.actor('gemini').wear('bow');
      const A = cam([0, 2.05, 8.6], [0, 2.35, -2], 41);
      const B = cam([0, 2.35, 9.2], [0, 2.85, -3], 42);
      return ({ u, T }) => {
        doubao.act('hop', T).at(-2.7, 0.62, 0);
        whale.act('wave', T).at(-0.9, 0.82, 0.1).emote('fx_shine', T);
        claude.act('hop', T).faceLeft(true).at(0.9, 0.82, 0.1);
        gemini.act('spin', T).faceLeft(true).at(2.7, 0.62, 0);
        bursts.forEach(({ bx, by, pts, offset }) => {
          const ph = (T * 0.48 + offset) % 1;
          const r = Math.pow(ph, 0.65) * 2.8;
          pts.forEach(({ sp, dx, dy }) => {
            sp.position.set(bx + dx * r, by + dy * r - ph * ph * 0.6, -9);
            setSpriteOp(sp, (1 - ph) * 0.95);
          });
        });
        return glide(A, B, u);
      };
    },
  },

  // ── F03：终章副歌一 · 翠竹萤火与樱花草同框心跳 ───────────────────────────
  {
    id: 'F03',
    title: '竹萤花影同心搏动',
    lyric: '恋人怀中樱花草，听见胸膛心在跳',
    cast: ['whale', 'claude', 'qwen', 'zai'],
    look: 'bamboo',
    note: '开篇的翠竹、萤火与盛放樱花草在同一片月夜花园重逢，粉金心形随心跳温润闪耀。',
    build: (k) => {
      k.add(ground(110, 0x285c4f));
      many(16, (i) =>
        k.add(bambooStalk(6.5, 0x3d9473, i), -8 + i * 1.08, 0, -4.2 - (i % 3) * 1.4)
      );
      many(16, (i) =>
        k.add(primrosePlant(0.85, 0xff94be, 0.42), -5.5 + i * 0.74, 0, 1.35 + (i % 2) * 0.35)
      );
      const heart = k.add(plumpHeart(0.65, 0xff7da8, 0.94), 0, 1.52, 0.15);
      const flies = many(24, () => k.add(makeSprite('glow', 0.55, 0xe2ff85, true, 0.75)));
      const whale = k.actor('whale');
      const claude = k.actor('claude').wear('crown');
      const qwen = k.actor('qwen');
      const zai = k.actor('zai');
      const A = cam([0, 1.95, 7.2], [0, 1.15, 0], 38);
      const B = cam([0, 1.72, 6.0], [0, 1.15, 0], 36);
      return ({ u, T, bt }) => {
        const hb = bt.lubDub;
        heart.scale.setScalar(0.6 + hb * 0.24);
        heart.rotation.y = Math.sin(T * 1.5) * 0.25;
        whale.idle(T).at(-1.18, 0, 0.2).sq(hb * 0.045).emote('fx_heart', T);
        claude.idle(T).faceLeft(true).at(1.18, 0, 0.2).sq(hb * 0.045).emote('fx_heart', T, -0.3, 0.14);
        qwen.act('sway', T).at(-3.1, 0, -0.8);
        zai.idle(T).faceLeft(true).at(3.1, 0, -0.8);
        flies.forEach((f, i) => {
          f.position.set(
            (hash(i * 3) - 0.5) * 9.5,
            0.5 + hash(i * 5) * 3.5 + Math.sin(T * 2 + i) * 0.3,
            -2.5 + hash(i * 7) * 4.5
          );
          setSpriteOp(f, 0.35 + 0.55 * Math.sin(T * 5 + i));
        });
        return glide(A, B, u);
      };
    },
  },

  // ── F04：终章副歌一 · 银河亮起樱花草星座记号 ─────────────────────────────
  {
    id: 'F04',
    title: '夜空点亮樱花草星座',
    lyric: '偷偷的在思念，那是我们相爱的记号',
    cast: ['whale', 'claude', 'kimi'],
    look: 'galaxy',
    fx: { whiteOut: true },
    note: '银河正中五颗粉金亮星连成一朵巨大的五瓣樱花草星图，成为镌刻在夜空里的相爱记号！',
    build: (k) => {
      k.add(ground(120, 0x181e48));
      backdropHills(k.root, 0x22285c, 0x2e2e6e, 76);
      k.add(milkyWaySky(true).root);
      // 夜空五瓣樱花草发光星图
      const skyFlower = k.add(primroseBlossom(4.2, 0xff9ec4, 0.65), 0, 8.2, -22);
      skyFlower.rotation.x = PI * 0.48;
      const starTips = many(5, (i) => {
        const a = (i / 5) * TAU + PI / 2;
        return k.add(
          makeSprite('star', 1.8, 0xfff0ad, true, 0.95),
          Math.cos(a) * 2.4,
          8.2 + Math.sin(a) * 2.4,
          -21.5
        );
      });
      const whale = k.actor('whale');
      const claude = k.actor('claude').wear('crown');
      const kimi = k.actor('kimi').wear('tiara');
      const A = cam([0, 1.85, 7.6], [0, 3.4, -10], 41);
      const B = cam([0, 1.65, 6.8], [0, 4.6, -12], 42);
      return ({ u, T, bt }) => {
        skyFlower.rotation.z = T * 0.25;
        skyFlower.scale.setScalar(4.0 + bt.pulse * 0.45);
        starTips.forEach((s, i) => {
          s.scale.setScalar(1.5 + 0.55 * Math.sin(T * 5 + i));
        });
        whale.idle(T).at(-1.15, 0, 0.5).sq(beatBounce(bt, 0.04));
        claude.idle(T).faceLeft(true).at(0.55, 0, 0.5).sq(beatBounce(bt, 0.04));
        kimi.act('nod', T, T - u * 1.5).faceLeft(true).at(2.25, 0, 0.1).emote('fx_sparkle', T);
        return glide(A, B, u);
      };
    },
  },

  // ── F05：终章副歌二 · 破晓漫山樱花草花海与白龙洒花 ───────────────────────
  {
    id: 'F05',
    title: '破晓花海与龙娘洒花',
    lyric: '恋人手中樱花草，春彩漫步的微笑',
    cast: ['whale', 'claude', 'gpt'],
    look: 'finale',
    fx: { whiteIn: true },
    note: '破晓金粉晨光洒遍一望无际的樱花草花海，龙娘从云端高空展翼掠过洒下漫天花雨，本鲸与小克在花海中央并肩漫步！',
    build: (k) => {
      k.add(ground(130, 0x90e392));
      backdropHills(k.root, 0xffc7de, 0x9ce3a4, 76);
      many(7, (i) => k.add(softCloud(i * 6, 2.0, 0xfff5fa), -22 + i * 7.4, 12 + (i % 2) * 2, -32));
      // 壮观漫山樱花草花海
      const sea = many(48, (i) => {
        const x = (hash(i * 3) - 0.5) * 18;
        const z = -9 + hash(i * 5) * 12.5;
        const safeX = Math.abs(x) < 1.8 && Math.abs(z) < 2.2 ? x + (x < 0 ? -2.2 : 2.2) : x;
        return k.add(
          primrosePlant(0.82 + hash(i) * 0.35, i % 3 === 0 ? 0xffdf82 : i % 2 ? 0xff7eb0 : 0xffa8cc, 0.3),
          safeX,
          0,
          z
        );
      });
      const petals = many(42, (i) =>
        k.add(makeSprite('petal', 0.32, i % 2 ? 0xff8ab5 : 0xffe49e, false, 0.92))
      );
      const whale = k.actor('whale');
      const claude = k.actor('claude').wear('crown');
      const gpt = k.actor('gpt', 2.4);
      const A = cam([-1.5, 2.35, 8.6], [0, 1.8, -2], 40);
      const B = cam([1.5, 2.15, 7.6], [0, 1.6, -1.5], 39);
      return ({ u, T, bt }) => {
        const x = lerp(-1.2, 1.2, u);
        whale.walkBy((x + 1.2) * 1.4).at(x - 0.72, 0, 0.4).sq(beatBounce(bt, 0.045)).emote('fx_heart', T);
        claude.walkBy((x + 1.2) * 1.4).at(x + 0.72, 0, 0.4).sq(beatBounce(bt, 0.045));
        gpt.act('hover', T).at(lerp(-14, 15, u), 10.8 + Math.sin(u * PI) * 2.0, -24).noShadow();
        sea.forEach((fl, i) => {
          fl.rotation.z = Math.sin(T * 2.4 + i * 0.4) * 0.08;
        });
        petals.forEach((p, i) => {
          const ph = (T * 0.42 + hash(i * 3)) % 1;
          p.position.set((hash(i * 5) - 0.5) * 14, 5.2 - ph * 4.8, -4 + hash(i * 7) * 8);
          p.material.rotation = T * 2.2 + i;
        });
        return glide(A, B, u);
      };
    },
  },

  // ── F06：终章副歌二 · 彩虹花丘全员大团圆 ─────────────────────────────────
  {
    id: 'F06',
    title: '彩虹花丘全员盛典',
    lyric: '种下了一朵朵，青春璀璨的年少',
    cast: ['doubao', 'gemini', 'claude', 'whale', 'qwen', 'kimi', 'zai'],
    look: 'finale',
    note: '柔彩五色长虹横跨春空，风车与樱花草铺满花丘，全体角色齐聚山巅挥手、行礼、欢跳，定格最璀璨的年少！',
    build: (k) => {
      k.add(ground(125, 0x8ee392));
      k.add(softHill(11, 1.15, 6, 0x9ce89a), 0, -0.25, -0.3);
      backdropHills(k.root, 0x9ae0a2, 0xffcce0, 76);
      // 柔彩马卡龙五色软3D彩虹拱带
      const rbCols = [0xff9ec4, 0xffd97d, 0x9ef0be, 0x9be0ff, 0xd4b8ff];
      rbCols.forEach((col, i) => {
        const arc = new THREE.Mesh(
          new THREE.TorusGeometry(15.5 - i * 0.55, 0.24, 8, 48, PI),
          glass(col, 0.52)
        );
        k.add(arc, 0, 0.5, -22);
      });
      const wheels = many(6, (i) => {
        const pw = pinwheel(0xff8ab5, 0xffe07d, 1.0);
        k.add(pw.root, -5.5 + i * 2.2, 0.45, -2.0);
        return pw.wheel;
      });
      many(20, (i) =>
        k.add(primrosePlant(0.85, i % 2 ? 0xff82b2 : 0xffb3d1, 0.3), -6.5 + i * 0.68, 0.2, 1.45)
      );
      const doubao = k.actor('doubao');
      const gemini = k.actor('gemini').wear('bow');
      const claude = k.actor('claude').wear('crown');
      const whale = k.actor('whale');
      const qwen = k.actor('qwen');
      const kimi = k.actor('kimi').wear('tiara');
      const zai = k.actor('zai');
      const A = cam([0, 2.65, 10.2], [0, 1.55, -0.3], 40);
      const B = cam([0, 2.25, 8.8], [0, 1.5, -0.2], 38);
      return ({ u, T, bt }) => {
        const sq = beatBounce(bt, 0.055);
        wheels.forEach((w, i) => {
          w.rotation.z = -T * 5.0 - i;
        });
        doubao.act('hop', T).at(-4.1, 0.52, -0.2);
        gemini.act('sway', T).at(-2.75, 0.68, -0.1).sq(sq).emote('fx_sparkle', T);
        claude.act('curtsy', T, Math.floor(T * 0.6) / 0.6).at(-1.15, 0.82, 0.05).emote('fx_heart', T);
        whale.act('wave', T).at(0.25, 0.86, 0.1).sq(sq).emote('fx_shine', T);
        qwen.act('bow', T, Math.floor(T * 0.6) / 0.6).faceLeft(true).at(1.65, 0.8, 0.0);
        kimi.act('sway', T).faceLeft(true).at(2.95, 0.66, -0.1).sq(sq);
        zai.act('hop', T).faceLeft(true).at(4.2, 0.5, -0.2);
        return glide(A, B, u);
      };
    },
  },

  // ── F07：终章副歌二 · 盛大樱花草花环中的心跳 ─────────────────────────────
  {
    id: 'F07',
    title: '花冠环绕的永恒心跳',
    lyric: '恋人怀中樱花草，听见胸膛心在跳',
    cast: ['whale', 'claude'],
    look: 'blush',
    note: '十二朵盛放樱花草围成温暖同心花环，中央花盆与软3D粉心随 74 BPM 双搏律动轻柔起伏。',
    build: (k) => {
      k.add(ground(110, 0x99d99e));
      backdropHills(k.root, 0xffcadf, 0xd4b8f2, 74);
      const wreath = many(12, (i) => {
        const a = (i / 12) * TAU;
        return k.add(
          primrosePlant(0.95, i % 2 ? 0xff7eb0 : 0xffb3d1, 0.35),
          Math.cos(a) * 2.65,
          0,
          Math.sin(a) * 2.1
        );
      });
      k.add(primrosePot(1.05), 0, 0, 0.45);
      const heart = k.add(plumpHeart(0.58, 0xff70a2, 0.92), 0, 1.65, 0.25);
      const ring = rippleRing(0xffa8cc, true);
      k.add(ring.mesh, 0, 0.05, 0);
      const whale = k.actor('whale');
      const claude = k.actor('claude').wear('crown');
      return ({ u, T, bt }) => {
        const hb = bt.lubDub;
        heart.scale.setScalar(0.54 + hb * 0.22);
        heart.rotation.y = Math.sin(T * 1.5) * 0.3;
        const ph = (T * 0.62) % 1;
        ring.mesh.scale.setScalar(0.6 + ph * 3.2);
        ring.mat.opacity = (1 - ph) * 0.65;
        wreath.forEach((w, i) => {
          w.rotation.z = Math.sin(T * 2.5 + i) * 0.07;
        });
        whale.idle(T).at(-1.12, 0, 0.15).sq(hb * 0.045).emote('fx_heart', T);
        claude.idle(T).faceLeft(true).at(1.12, 0, 0.15).sq(hb * 0.045).emote('fx_heart', T, -0.3, 0.14);
        const ang = lerp(-0.35, 0.35, ease(u));
        return cam([Math.sin(ang) * 6.0, 1.95, Math.cos(ang) * 6.0], [0, 1.08, 0.1], 36);
      };
    },
  },

  // ── F08：终章副歌二收束 · 那是我们相爱的味道 ─────────────────────────────
  {
    id: 'F08',
    title: '春风留香 · 相爱的味道',
    lyric: '偷偷的在思念，那是我们相爱的味道',
    cast: ['whale', 'claude'],
    look: 'finale',
    note: '全曲最后一句唱词缓缓拉长，镜头从相视挥手的本鲸与小克身边温柔摇升，漫天樱花草花瓣化作春风里甜甜的味道。',
    build: (k) => {
      k.add(ground(125, 0x92e396));
      backdropHills(k.root, 0xa2e0a8, 0xffc7de, 76);
      k.add(seasonTree('spring', 1.5, 5), -4.2, 0, -2.8);
      k.add(seasonTree('spring', 1.5, 9), 4.2, 0, -2.8);
      k.add(roundCyl(0.62, 0.68, 0.5, 0xfff5ea, 20), 0, 0, 0.4);
      const pot = k.add(primrosePot(1.15), 0, 0.5, 0.4);
      many(26, (i) =>
        k.add(
          primrosePlant(0.82, i % 2 ? 0xff85b3 : 0xffdf85, 0.32),
          -7 + i * 0.56,
          0,
          -1.6 - (i % 3) * 1.1
        )
      );
      const swirl = many(46, (i) =>
        k.add(
          makeSprite(
            i % 4 === 0 ? 'heart' : 'petal',
            0.32,
            i % 2 ? 0xff8eb8 : 0xffe49e,
            i % 4 === 0,
            0.9
          )
        )
      );
      const whale = k.actor('whale');
      const claude = k.actor('claude').wear('crown');
      const A = cam([0, 1.75, 5.8], [0, 1.08, 0.25], 35);
      const B = cam([0, 3.35, 8.8], [0, 1.75, 0.0], 39);
      return ({ u, T, bt }) => {
        pot.rotation.y = T * 0.5;
        whale.act('wave', T).at(-1.28, 0, 0.25).sq(beatBounce(bt, 0.04)).emote('fx_heart', T);
        claude.act('sway', T).faceLeft(true).at(1.28, 0, 0.25).sq(beatBounce(bt, 0.04)).emote('fx_heart', T, -0.3, 0.14);
        swirl.forEach((s, i) => {
          const ph = (i / 46 + T * 0.2) % 1;
          const a = ph * TAU * 2.5 + i * 0.5;
          const r = 0.6 + ph * 4.4;
          s.position.set(Math.cos(a) * r, 0.5 + ph * 4.6, 0.2 + Math.sin(a) * r * 0.7);
          s.material.rotation = a;
          setSpriteOp(s, Math.sin(ph * PI) * 0.9);
        });
        return glide(A, B, u);
      };
    },
  },

  // ── OUT1：尾声一 · 暮檐风铃轻送花海 ──────────────────────────────────────
  {
    id: 'OUT1',
    title: '檐下风铃余韵轻晃',
    lyric: '尾奏 · 吉他泛音里风铃轻晃，远眺花谷',
    cast: ['whale', 'claude'],
    look: 'sunset',
    note: '歌声落定，尾奏吉他轻轻拨响，木廊檐下一只樱粉琉璃风铃随晚风慢晃，远处花谷安静温柔。',
    build: (k) => {
      k.add(ground(115, 0x729682));
      backdropHills(k.root, 0x8a648a, 0xc7829c, 76);
      k.add(softBox(8.5, 0.24, 3.2, 0x9c6644, 0.05), 0, 0.12, 1.2);
      k.add(softBox(8.5, 0.2, 0.28, 0x7c4c32, 0.04), 0, 3.35, 1.8);
      const ch = windChime(0xffb3d1, 0xffe69e);
      k.add(ch.root, 1.55, 3.3, 1.8);
      k.add(primrosePot(0.9), -1.85, 0.24, 1.4);
      const whale = k.actor('whale');
      const claude = k.actor('claude').wear('crown');
      const A = cam([0.4, 2.0, 6.2], [0.2, 1.55, 0], 37);
      const B = cam([0.6, 2.15, 6.8], [0.2, 1.6, -1], 38);
      return ({ u, T }) => {
        ch.pendulum.rotation.z = Math.sin(T * 2.1) * 0.18;
        ch.tag.rotation.y = Math.cos(T * 1.8) * 0.35;
        whale.idle(T).at(-0.62, 0.24, 0.8);
        claude.idle(T).faceLeft(true).at(0.55, 0.24, 0.8);
        return glide(A, B, u);
      };
    },
  },

  // ── OUT2：尾声二 · 樱花草落入书页，绘本轻合（首尾呼应）──────────────────
  {
    id: 'OUT2',
    title: '压花入册 · 合上绘本',
    lyric: '尾奏 · 五瓣樱花草化作书签，花语绘本温柔合上',
    cast: [],
    look: 'desk',
    fx: { fadeOut: true },
    note: '回到开篇的月下暖木书桌，一朵发光的五瓣樱花草轻落在书页上，绘本缓缓合拢，把整季春光珍藏其间。',
    build: (k) => {
      k.add(ground(55, 0x5c3d2e));
      const book = herbariumBook();
      k.add(book.root, 0, 0, -0.4);
      k.add(roundCyl(0.26, 0.32, 1.15, 0xfff3de, 14), -5.0, 0, -2.5);
      const flame = k.add(makeSprite('glow', 2.0, 0xffbe63, true, 0.8), -5.0, 1.48, -2.5);
      k.add(primrosePot(0.95), 5.1, 0, -2.2);
      const cup = k.prop('prop_teacup', 1.15);
      const motes = many(20, () => k.add(makeSprite('petal', 0.28, 0xffa8cc, true, 0)));
      const A = cam([0, 5.0, 9.2], [0, 1.1, -0.3], 36);
      const B = cam([0.4, 6.4, 12.6], [0.3, 1.0, -0.4], 38);
      return ({ u, T }) => {
        cup.at(-3.9, 0.02, -1.6);
        const closeU = ease(seg(u, 0.22, 0.78));
        book.cover.rotation.z = (1 - closeU) * (PI * 0.96);
        (book.pageGlow.material as THREE.MeshBasicMaterial).opacity = (1 - closeU) * 0.55;
        flame.scale.setScalar(1.9 + Math.sin(T * 6) * 0.14);
        motes.forEach((m, i) => {
          const ph = (T * 0.22 + hash(i * 3)) % 1;
          m.position.set((hash(i * 5) - 0.5) * 5.8, 3.8 - ph * 3.2, -0.4 + (hash(i * 7) - 0.5) * 3.8);
          setSpriteOp(m, (1 - closeU) * Math.sin(ph * PI) * 0.72);
        });
        return glide(A, B, u);
      };
    },
  },
];
