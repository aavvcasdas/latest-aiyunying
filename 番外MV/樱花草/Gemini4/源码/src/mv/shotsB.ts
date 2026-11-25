// 分镜表（中）：间奏一 N01–L23 · 主歌二 L24–L31 · 导歌二 L32–L35 · 副歌二 L36–L43
import * as THREE from 'three';
import {
  archedBridge,
  backdropHills,
  backOut,
  bellTower,
  bridgeHeight,
  crescentMoon,
  ease,
  glass,
  glow,
  ground,
  hash,
  lerp,
  lotusPad,
  makeSprite,
  many,
  milkyWaySky,
  musicBox,
  pebble,
  PI,
  plumpHeart,
  primroseBlossom,
  primrosePlant,
  primrosePot,
  put,
  rippleRing,
  riverLantern,
  roundCyl,
  seasonTree,
  seg,
  setSpriteOp,
  skyLantern,
  softBox,
  softCloud,
  softFrog,
  softHill,
  TAU,
  teaPavilion,
  windChime,
  wishingBottle,
} from './kit';
import { beatBounce, cam, glide, type ShotDef } from './types';

export const SHOTS_B: ShotDef[] = [
  // ── N01：间奏一 · 樱花草八音盒旋起 ──────────────────────────────────────
  {
    id: 'N01',
    title: '樱花草八音盒旋起',
    lyric: '间奏 · 发条轻转，花语八音盒叮咚作响',
    cast: ['doubao', 'kimi'],
    look: 'musicbox',
    note: '林间草坪中央，一座奶油粉金樱花草八音盒随拍缓缓旋转，豆包率先踩起轻快舞步，Kimi 在一旁静静聆听。',
    build: (k) => {
      k.add(ground(105, 0x8fd99b));
      backdropHills(k.root, 0xa2d9b8, 0xd4c4f5, 74);
      const mb = musicBox();
      k.add(mb.root, 0, 0, -0.3);
      const bubbles = many(20, (i) =>
        k.add(makeSprite('bubble', 0.36 + hash(i) * 0.22, i % 2 ? 0xffe6f2 : 0xdcf5ff, false, 0.8))
      );
      const doubao = k.actor('doubao');
      const kimi = k.actor('kimi').wear('tiara');
      const A = cam([-1.6, 2.5, 7.8], [0, 1.35, -0.2], 38);
      const B = cam([1.6, 2.2, 7.1], [0, 1.35, -0.2], 37);
      return ({ u, T, bt }) => {
        mb.stage.rotation.y = T * 0.85;
        doubao.act('step', T).at(-2.85, 0, 0.4).sq(beatBounce(bt, 0.055)).emote('fx_sparkle', T);
        kimi.idle(T).faceLeft(true).at(2.85, 0, 0.4).sq(beatBounce(bt, 0.035));
        bubbles.forEach((b, i) => {
          const ph = (T * 0.28 + hash(i * 3)) % 1;
          const a = i * 1.3 + T * 0.5;
          const r = 1.2 + ph * 2.8;
          b.position.set(Math.cos(a) * r, 0.6 + ph * 3.8, -0.3 + Math.sin(a) * r * 0.7);
          setSpriteOp(b, Math.sin(ph * PI) * 0.78);
        });
        return glide(A, B, u);
      };
    },
  },

  // ── N02：间奏一 · 溪亭午茶与花瓣轻舟 ────────────────────────────────────
  {
    id: 'N02',
    title: '溪亭茶歇与春风轻舟',
    lyric: '间奏 · 茶香随春溪流向音符花阶',
    cast: ['qwen', 'zai', 'gemini'],
    look: 'musicbox',
    note: '千问在溪畔茶亭摆好暖茶，狐狸在软垫边惬意点头，猫娘追着漂过溪面的樱花草花瓣轻快奔跑。',
    build: (k) => {
      k.add(ground(105, 0x8cd998));
      backdropHills(k.root, 0x99d9ad, 0xffd4e5, 74);
      const stream = k.add(new THREE.Mesh(new THREE.PlaneGeometry(34, 2.2), glass(0x7adcf7, 0.72)), 0, 0.04, 1.5);
      stream.rotation.x = -PI / 2;
      k.add(teaPavilion(0.85), -1.8, 0, -1.6);
      const cup = k.prop('prop_teacup', 0.9);
      const fan = k.prop('prop_fan', 0.85);
      const floatFl = many(8, (i) => k.add(primroseBlossom(0.45, i % 2 ? 0xff8ab5 : 0xffdf85, 0.35)));
      const qwen = k.actor('qwen');
      const zai = k.actor('zai');
      const gemini = k.actor('gemini').wear('bow');
      const A = cam([-2.2, 2.25, 7.6], [-0.5, 1.15, -0.4], 39);
      const B = cam([1.4, 2.15, 7.2], [0.4, 1.1, -0.2], 38);
      return ({ u, T, bt }) => {
        qwen.act('sway', T).at(-1.8, 0.24, -1.2).sq(beatBounce(bt, 0.04));
        cup.at(-1.8, 0.78, -1.75);
        fan.at(-1.25, 0.92, -1.0);
        zai.idle(T).at(1.2, 0, -0.6).emote('fx_steam', T);
        const gx = lerp(-2.5, 2.8, u);
        gemini.walkBy(gx + 2.5).at(gx, 0, 0.15).sq(beatBounce(bt, 0.04));
        floatFl.forEach((f, i) => {
          const fx = ((T * 1.1 + i * 2.1) % 16) - 8;
          f.position.set(fx, 0.08, 1.5 + Math.sin(T * 2 + i) * 0.35);
          f.rotation.y = T * 0.9 + i;
        });
        return glide(A, B, u);
      };
    },
  },

  // ── L21：La la la la la la la（七阶音符花石！）──────────────────────────
  {
    id: 'L21',
    title: '七阶音符花石领舞',
    lyric: 'La la la la la la la',
    cast: ['doubao', 'whale'],
    look: 'musicbox',
    note: '草地上排开七块马卡龙软3D琴键花石，每唱一声 La 就点亮一块并弹开一朵樱花草，豆包与本鲸踩拍起舞！',
    build: (k) => {
      k.add(ground(105, 0x8ee09a));
      backdropHills(k.root, 0x99deab, 0xd8c7fa, 74);
      const cols = [0xff94be, 0xffd972, 0x85ebbd, 0x94dcff, 0xffa6cc, 0xffe082, 0x99f0c9];
      const stones = many(7, (i) => {
        const x = -3.6 + i * 1.2;
        const block = k.add(softBox(0.95, 0.24, 1.25, cols[i], 0.07), x, 0.12, 0.55);
        const bloom = k.add(primrosePlant(0.75, cols[i], 0.4), x, 0.24, -0.35);
        const halo = k.add(makeSprite('glow', 1.2, cols[i], true, 0), x, 0.32, 0.55);
        return { block, bloom, halo };
      });
      const doubao = k.actor('doubao');
      const whale = k.actor('whale');
      const A = cam([-1.0, 2.2, 7.6], [0, 1.0, 0.1], 38);
      const B = cam([1.0, 2.2, 7.4], [0, 1.0, 0.1], 38);
      return ({ u, T, bt }) => {
        stones.forEach((st, i) => {
          const hit = seg(u, i * 0.11, i * 0.11 + 0.14);
          const bounce = hit > 0 && hit < 1 ? Math.sin(hit * PI) * 0.18 : 0;
          st.block.position.y = 0.12 + bounce;
          st.bloom.scale.setScalar(Math.max(0.001, 0.78 * backOut(hit, 2.4)));
          setSpriteOp(st.halo, hit > 0 ? 0.35 + bounce * 2.2 : 0);
        });
        const dx = lerp(-2.6, 1.2, u);
        doubao.act('step', T).at(dx, 0.25, 0.55).sq(beatBounce(bt, 0.06)).emote('fx_sparkle', T);
        whale.act('sway', T).at(dx - 1.5, 0, -1.1).sq(beatBounce(bt, 0.055));
        return glide(A, B, u);
      };
    },
  },

  // ── L22：La la la la la ──────────────────────────────────────────────────
  {
    id: 'L22',
    title: '花泉圆舞轻旋',
    lyric: 'La la la la la',
    cast: ['gemini', 'qwen', 'doubao'],
    look: 'musicbox',
    note: '猫娘、千问与豆包围着盛放樱花草的花环小圆台轻盈转圈，彩透泡泡随歌声飘满晴空。',
    build: (k) => {
      k.add(ground(105, 0x8fe09d));
      backdropHills(k.root, 0xa6e0b8, 0xffcce2, 74);
      k.add(roundCyl(2.4, 2.6, 0.22, 0xfff3e6, 28), 0, 0, 0);
      const center = k.add(primrosePot(1.25), 0, 0.22, 0);
      const bubbles = many(24, (i) =>
        k.add(makeSprite('bubble', 0.38, i % 2 ? 0xffd9eb : 0xd6f4ff, false, 0.82))
      );
      const gemini = k.actor('gemini').wear('bow');
      const qwen = k.actor('qwen');
      const doubao = k.actor('doubao');
      const A = cam([0, 2.35, 7.6], [0, 1.1, 0], 38);
      const B = cam([0.8, 2.15, 6.8], [0, 1.1, 0], 37);
      return ({ u, T }) => {
        center.rotation.y = T * 0.9;
        const baseA = T * 0.75;
        const actors = [gemini, qwen, doubao];
        actors.forEach((ac, i) => {
          const a = baseA + (i / 3) * TAU;
          ac.act('spin', T).at(Math.cos(a) * 1.75, 0.22, Math.sin(a) * 1.45);
        });
        bubbles.forEach((b, i) => {
          const ph = (T * 0.36 + hash(i * 3)) % 1;
          b.position.set((hash(i * 5) - 0.5) * 8.5, 0.4 + ph * 4.0, (hash(i * 7) - 0.5) * 5);
          setSpriteOp(b, Math.sin(ph * PI) * 0.8);
        });
        return glide(A, B, u);
      };
    },
  },

  // ── L23：La la la la la la la la（暮色温柔降临，衔接主歌二夜色）─────────
  {
    id: 'L23',
    title: '暮霞入夜的花丘合唱',
    lyric: 'La la la la la la la la',
    cast: ['whale', 'claude', 'doubao', 'gemini', 'kimi'],
    look: 'sunset',
    note: '晚霞把花海染成温柔橘粉与暮紫，五位伙伴在山坡上随最后一句 La la la 轻晃挥手，第一批晚星悄然亮起。',
    build: (k) => {
      k.add(ground(110, 0x6e8c7d));
      k.add(softHill(9.5, 1.1, 5.5, 0x7d9e8a), 0, -0.25, -0.4);
      backdropHills(k.root, 0x75597d, 0x9c6b8c, 74);
      many(18, (i) =>
        k.add(
          primrosePlant(0.75, i % 2 ? 0xff9ec4 : 0xffdf85, 0.35),
          -6.5 + i * 0.76,
          0.15,
          1.2 + (i % 2) * 0.45
        )
      );
      const glowDots = many(22, (i) =>
        k.add(makeSprite('glow', 0.45, i % 2 ? 0xffe494 : 0xffb3d9, true, 0.7))
      );
      const doubao = k.actor('doubao');
      const whale = k.actor('whale');
      const claude = k.actor('claude').wear('crown');
      const gemini = k.actor('gemini').wear('bow');
      const kimi = k.actor('kimi').wear('tiara');
      const A = cam([0, 2.1, 8.2], [0, 1.35, -0.2], 38);
      const B = cam([0, 2.55, 9.2], [0, 1.55, -0.5], 40);
      return ({ u, T, bt }) => {
        const sq = beatBounce(bt, 0.05);
        doubao.act('sway', T).at(-3.1, 0.58, -0.2).sq(sq);
        whale.act('wave', T).at(-1.45, 0.76, -0.1).sq(sq);
        claude.act('sway', T).faceLeft(true).at(0.15, 0.82, 0).sq(sq);
        gemini.act('sway', T).faceLeft(true).at(1.65, 0.74, -0.1).sq(sq);
        kimi.idle(T).faceLeft(true).at(3.15, 0.56, -0.2).sq(sq);
        glowDots.forEach((d, i) => {
          const ph = (T * 0.25 + hash(i * 3)) % 1;
          d.position.set((hash(i * 5) - 0.5) * 11, 0.8 + ph * 4.2, -3 + hash(i * 7) * 5);
          setSpriteOp(d, Math.sin(ph * PI) * (0.4 + 0.5 * u));
        });
        return glide(A, B, u);
      };
    },
  },

  // ── L24：远方钟声再响起（主歌二开场！）──────────────────────────────────
  {
    id: 'L24',
    title: '远方钟声再响起',
    lyric: '远方钟声再响起',
    cast: ['doubao', 'whale'],
    look: 'lullaby',
    note: '月色薄雾笼罩的远山石砌钟楼里，金色铜钟随拍轻摆，一圈圈银金钟声光环荡过夜谷，豆包与本鲸驻足倾听。',
    build: (k) => {
      k.add(ground(115, 0x263859));
      backdropHills(k.root, 0x223254, 0x2f416b, 76);
      // 远坡钟楼
      k.add(softHill(6.8, 1.8, 5.8, 0x32476e), 2.4, -0.3, -7.2);
      const btow = bellTower();
      k.add(btow.root, 2.4, 1.35, -7.2);
      // 扩散的钟声同心光环
      const chimeRings = many(4, (i) => {
        const r = rippleRing(i % 2 ? 0xffe89e : 0xb8dcff, false);
        k.add(r.mesh, 2.4, 5.2, -6.9);
        return r;
      });
      const doubao = k.actor('doubao');
      const whale = k.actor('whale');
      const A = cam([-1.6, 2.1, 7.6], [1.0, 2.6, -4.5], 40);
      const B = cam([-0.8, 2.3, 6.9], [1.4, 3.0, -5.2], 39);
      return ({ u, T, bt }) => {
        btow.bell.rotation.z = Math.sin(T * (PI / 0.8108)) * 0.34;
        chimeRings.forEach((r, i) => {
          const ph = (T * 0.55 + i / 4) % 1;
          r.mesh.scale.setScalar(0.5 + ph * 5.8);
          r.mat.opacity = (1 - ph) * 0.6;
        });
        doubao.act('tilt', T, T - u * 1.3).at(-2.1, 0, 0.8).emote('fx_sparkle', T);
        whale.idle(T).at(-0.7, 0, 1.0).sq(beatBounce(bt, 0.035));
        return glide(A, B, u);
      };
    },
  },

  // ── L25：蛙鸣唱起了摇篮曲 ────────────────────────────────────────────────
  {
    id: 'L25',
    title: '蛙鸣唱起了摇篮曲',
    lyric: '蛙鸣唱起了摇篮曲',
    cast: ['zai'],
    look: 'lullaby',
    note: '静谧荷塘里四只圆滚滚软3D小青蛙蹲在荷叶上，暖金鸣囊随拍一鼓一收唱起摇篮曲；狐狸枕着大荷叶伴眼罩香甜打盹。',
    build: (k) => {
      k.add(ground(100, 0x18344a));
      const pond = k.add(new THREE.Mesh(new THREE.CircleGeometry(28, 40), glass(0x286485, 0.72)), 0, 0.04, -2);
      pond.rotation.x = -PI / 2;
      // 狐狸打盹的大荷叶软垫
      k.add(lotusPad(1.55, true), 0.2, 0.05, 0.1);
      const mask = k.prop('prop_eyemask', 0.9);
      // 四只鼓腮歌唱的小青蛙 + 水面波纹
      const frogPos: Array<[number, number]> = [
        [-2.2, 0.85],
        [2.35, 0.75],
        [-1.85, -1.55],
        [2.1, -1.45],
      ];
      const frogs = frogPos.map(([fx, fz], i) => {
        k.add(lotusPad(0.72, i % 2 === 0), fx, 0.05, fz);
        const fr = softFrog(1.05);
        fr.root.rotation.y = fx < 0 ? 0.45 : -0.45;
        k.add(fr.root, fx, 0.11, fz);
        const rip = rippleRing(0x9ef0e6, true);
        k.add(rip.mesh, fx, 0.07, fz);
        return { fr, rip };
      });
      const zai = k.actor('zai');
      const notes = many(12, (i) =>
        k.add(makeSprite('bubble', 0.28, i % 2 ? 0xffeaa3 : 0xa8f5e8, true, 0.75))
      );
      const A = cam([0, 2.35, 6.6], [0, 0.85, 0], 37);
      const B = cam([0.3, 2.05, 5.8], [0.1, 0.82, 0.1], 36);
      return ({ u, T, bt }) => {
        zai.act('doze', T).at(0.15, 0.12, 0.1).emote('fx_zzz', T, 0.34, 0.12);
        mask.at(0.88, 0.12, 0.35);
        frogs.forEach(({ fr, rip }, i) => {
          const puff = 0.5 + 0.5 * Math.sin(T * 7.6 + i * 1.4);
          fr.sac.scale.setScalar(0.75 + puff * 0.85 + bt.e8Pulse * 0.25);
          fr.root.position.y = 0.11 + Math.sin(T * 2.2 + i) * 0.02;
          const ph = (T * 0.6 + i / 4) % 1;
          rip.mesh.scale.setScalar(0.55 + ph * 1.15);
          rip.mat.opacity = (1 - ph) * 0.48;
        });
        notes.forEach((n, i) => {
          const ph = (T * 0.32 + i / 12) % 1;
          const [fx, fz] = frogPos[i % 4];
          n.position.set(fx + Math.sin(T * 2.5 + i) * 0.25, 0.55 + ph * 2.4, fz);
          setSpriteOp(n, Math.sin(ph * PI) * 0.72);
        });
        return glide(A, B, u);
      };
    },
  },

  // ── L26：白沙滩，月弯弯 ──────────────────────────────────────────────────
  {
    id: 'L26',
    title: '白沙滩，月弯弯',
    lyric: '白沙滩，月弯弯',
    cast: ['whale', 'claude'],
    look: 'beach',
    note: '莹润珍珠白沙滩上星贝微亮，碧蓝海浪镶着银白泡沫一进一退；一轮软3D金黄弯月悬在海天之间，倒映粼粼金波。',
    build: (k) => {
      // 珍珠白沙滩 + 蔚蓝夜海
      k.add(ground(120, 0xf2ede4));
      const sea = k.add(new THREE.Mesh(new THREE.PlaneGeometry(140, 65), glass(0x1f6996, 0.85)), 0, 0.05, -32);
      sea.rotation.x = -PI / 2;
      const foam = k.add(new THREE.Mesh(new THREE.PlaneGeometry(45, 1.15), glow(0xe6fbff, 0.68, true)), 0, 0.065, -1.2);
      foam.rotation.x = -PI / 2;
      // 软3D弯弯月牙 + 海面碎金月路
      const moon = k.add(crescentMoon(2.35, 0xffe48a), 2.2, 6.2, -20);
      const shimmer = many(16, (i) =>
        k.add(
          new THREE.Mesh(new THREE.PlaneGeometry(1.6 - i * 0.05, 0.14), glow(0xffe799, 0.65, true)),
          2.2,
          0.08,
          -2.8 - i * 1.1
        )
      );
      shimmer.forEach((s) => {
        s.rotation.x = -PI / 2;
      });
      // 白沙滩上的粉贝壳与海星点缀
      many(10, (i) =>
        k.add(pebble(0.18, i % 2 ? 0xffbfd6 : 0xffe6a3, 0.45), -4.5 + i * 1.0, 0.03, 1.4 + (i % 2) * 0.4)
      );
      const whale = k.actor('whale');
      const claude = k.actor('claude').wear('crown');
      const A = cam([-1.4, 1.85, 7.6], [0.5, 2.2, -6], 40);
      const B = cam([0.4, 1.75, 7.0], [0.8, 2.4, -6], 39);
      return ({ u, T, bt }) => {
        const tide = Math.sin(T * 1.65) * 0.55;
        foam.position.z = -1.1 + tide;
        (foam.material as THREE.MeshBasicMaterial).opacity = 0.48 + 0.25 * Math.cos(T * 1.65);
        moon.rotation.z = -0.35 + Math.sin(T * 1.1) * 0.05;
        shimmer.forEach((s, i) => {
          s.position.x = 2.0 + Math.sin(T * 2.4 + i * 0.7) * 0.35;
          s.scale.x = 0.75 + 0.35 * Math.sin(T * 3.1 + i);
        });
        whale.act('sway', T).at(-1.25, 0.02, 0.55).sq(beatBounce(bt, 0.04));
        claude.idle(T).faceLeft(true).at(0.15, 0.02, 0.55).sq(beatBounce(bt, 0.04));
        return glide(A, B, u);
      };
    },
  },

  // ── L27：爱你香甜的梦里 ──────────────────────────────────────────────────
  {
    id: 'L27',
    title: '爱你香甜的梦里',
    lyric: '爱你香甜的梦里',
    cast: ['whale', 'claude', 'zai'],
    look: 'dream',
    note: '棉花糖般的薰衣草粉云海里，金色弯月化作轻摇的梦境小船载着本鲸与小克，狐狸躺在旁边的软云朵上甜睡。',
    build: (k) => {
      // 层叠棉花糖梦境云海
      const clouds = many(16, (i) =>
        k.add(
          softCloud(i * 4, 1.5 + hash(i) * 1.1, i % 2 ? 0xffe3f2 : 0xeadbff),
          -12 + i * 1.65,
          -0.6 + (i % 3) * 0.45,
          -5 + hash(i * 5) * 7.5
        )
      );
      // 摇篮状平躺的金色弯月船
      const cradle = new THREE.Group();
      k.add(cradle, -0.3, 1.35, 0);
      const cMoon = crescentMoon(1.95, 0xffe494);
      cMoon.rotation.z = -PI * 0.5; // 弯月凹口朝上，如温暖摇篮船托住两人
      cradle.add(cMoon);
      // 右侧狐狸的专属软云床
      const zaiCloud = k.add(softCloud(77, 1.15, 0xfff0f8), 2.85, 0.55, -0.6);
      const dreamPetals = many(24, (i) =>
        k.add(
          makeSprite(
            i % 3 === 0 ? 'bubble' : i % 3 === 1 ? 'petal' : 'star',
            0.35,
            i % 2 ? 0xffb8dc : 0xfff0ad,
            true,
            0.8
          )
        )
      );
      const whale = k.actor('whale');
      const claude = k.actor('claude').wear('crown');
      const zai = k.actor('zai');
      const A = cam([0, 2.05, 7.2], [0.2, 1.25, 0], 38);
      const B = cam([0.2, 1.85, 6.3], [0.1, 1.25, 0], 36);
      return ({ u, T }) => {
        const rock = Math.sin(T * 1.7) * 0.08;
        const bob = Math.sin(T * 1.4) * 0.12;
        cradle.rotation.z = rock;
        cradle.position.y = 1.35 + bob;
        whale.idle(T).at(-0.92, 0.72 + bob, 0.18).emote('fx_heart', T).noShadow();
        claude.idle(T).faceLeft(true).at(0.32, 0.72 + bob, 0.18).noShadow();
        zaiCloud.position.y = 0.55 - bob * 0.7;
        zai.act('doze', T).faceLeft(true).at(2.85, 1.12 - bob * 0.7, -0.5).emote('fx_zzz', T).noShadow();
        clouds.forEach((c, i) => {
          c.position.x += 0;
          c.position.y = -0.6 + (i % 3) * 0.45 + Math.sin(T * 1.1 + i) * 0.08;
        });
        dreamPetals.forEach((p, i) => {
          const ph = (T * 0.25 + hash(i * 3)) % 1;
          p.position.set((hash(i * 5) - 0.5) * 9, 0.2 + ph * 4.2, -2.5 + hash(i * 7) * 4.8);
          setSpriteOp(p, Math.sin(ph * PI) * 0.82);
        });
        return glide(A, B, u);
      };
    },
  },

  // ── L28：天上银河在发光（二段 · 海天一色星镜）───────────────────────────
  {
    id: 'L28',
    title: '海天一色银河光',
    lyric: '天上银河在发光',
    cast: ['whale', 'claude', 'gpt'],
    look: 'galaxy',
    note: '白沙木栈桥伸入无边星海，天上银河与海面星河上下相映，龙娘展翼掠过天际洒下璀璨星雨。',
    build: (k) => {
      const mirror = k.add(new THREE.Mesh(new THREE.PlaneGeometry(150, 120), glass(0x283c8c, 0.75)), 0, 0.02, -20);
      mirror.rotation.x = -PI / 2;
      // 伸向星海的暖木栈桥
      for (let i = 0; i < 14; i++) {
        k.add(softBox(2.2, 0.1, 0.42, 0x9c6b4e, 0.02), 0, 0.22, 4.2 - i * 0.55);
      }
      k.add(makeSprite('glow', 1.6, 0xffe299, true, 0.7), -1.05, 0.85, -1.8);
      k.add(makeSprite('glow', 1.6, 0xffe299, true, 0.7), 1.05, 0.85, -1.8);
      k.add(milkyWaySky(false).root);
      const seaStars = many(36, (i) =>
        k.add(makeSprite('star', 0.42, i % 2 ? 0xbfe4ff : 0xffc7f0, true, 0.75))
      );
      const whale = k.actor('whale');
      const claude = k.actor('claude').wear('crown');
      const gpt = k.actor('gpt', 2.3);
      const A = cam([0, 1.85, 6.8], [0, 3.4, -14], 42);
      const B = cam([0, 1.55, 5.9], [0, 4.8, -16], 44);
      return ({ u, T, bt }) => {
        whale.idle(T).at(-0.58, 0.28, -0.6).sq(beatBounce(bt, 0.035));
        claude.idle(T).faceLeft(true).at(0.58, 0.28, -0.6).sq(beatBounce(bt, 0.035));
        gpt.act('hover', T).at(lerp(15, -14, u), 13 + Math.sin(u * PI) * 2, -27).faceLeft(true).noShadow();
        seaStars.forEach((s, i) => {
          s.position.set((hash(i * 3) - 0.5) * 22, 0.08, -3 - hash(i * 5) * 18);
          setSpriteOp(s, 0.35 + 0.55 * Math.sin(T * 4.8 + i));
        });
        return glide(A, B, u);
      };
    },
  },

  // ── L29：地上风铃来歌唱（二段 · 海风贝壳琉璃风铃拱门）───────────────────
  {
    id: 'L29',
    title: '海风风铃拱廊和鸣',
    lyric: '地上风铃来歌唱',
    cast: ['qwen', 'gemini'],
    look: 'veranda',
    note: '白沙岸边的花木风铃架挂满彩透琉璃铃，海风吹起层层音波光圈，千问与猫娘随铃声左右摇摆。',
    build: (k) => {
      k.add(ground(100, 0x3b4269));
      k.add(roundCyl(0.12, 0.14, 3.5, 0xa87654, 10), -3.8, 0, 0.2);
      k.add(roundCyl(0.12, 0.14, 3.5, 0xa87654, 10), 3.8, 0, 0.2);
      k.add(softBox(8.4, 0.2, 0.3, 0xa87654, 0.04), 0, 3.5, 0.2);
      const cols = [0xffa8cc, 0x9be8ff, 0xffe28a, 0x9bf5cf, 0xd4b8ff, 0xffb39e];
      const chimes = many(6, (i) => {
        const ch = windChime(cols[i], cols[(i + 2) % 6]);
        k.add(ch.root, -2.75 + i * 1.1, 3.45, 0.2);
        const r = rippleRing(cols[i], false);
        k.add(r.mesh, -2.75 + i * 1.1, 2.6, 0.25);
        return { ch, r };
      });
      const qwen = k.actor('qwen');
      const gemini = k.actor('gemini').wear('bow');
      const fan = k.prop('prop_fan', 0.9);
      const A = cam([0.8, 1.95, 6.8], [0, 1.8, 0], 38);
      const B = cam([-0.8, 1.95, 6.4], [0, 1.85, 0], 37);
      return ({ u, T, bt }) => {
        qwen.act('sway', T).at(-1.25, 0, -0.2).sq(beatBounce(bt, 0.045));
        fan.at(-0.62, 0.68, 0.0);
        gemini.act('sway', T).faceLeft(true).at(1.25, 0, -0.2).sq(beatBounce(bt, 0.05)).emote('fx_sparkle', T);
        chimes.forEach(({ ch, r }, i) => {
          ch.pendulum.rotation.z = Math.sin(T * 4.1 + i * 0.8) * 0.28;
          ch.tag.rotation.y = Math.sin(T * 3.3 + i) * 0.5;
          const ph = (T * 0.9 + i / 6) % 1;
          r.mesh.scale.setScalar(0.2 + ph * 0.9);
          r.mat.opacity = (1 - ph) * 0.58;
        });
        return glide(A, B, u);
      };
    },
  },

  // ── L30：织女星在远方（二段 · 金色浑天星环）─────────────────────────────
  {
    id: 'L30',
    title: '星环指向织女星',
    lyric: '织女星在远方',
    cast: ['kimi'],
    look: 'galaxy',
    note: '观星石台上的双层金色星轨圆环缓缓自转，正对远方璀璨闪烁的织女星，Kimi 点头记下今夜的星愿。',
    build: (k) => {
      k.add(ground(110, 0x171c45));
      k.add(roundCyl(2.2, 2.4, 0.28, 0xe3e7f7, 28), 0, 0, 0);
      const ringA = k.add(
        new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.045, 10, 40), glow(0xffe08a, 0.85)),
        1.2,
        1.75,
        -1.2
      );
      const ringB = k.add(
        new THREE.Mesh(new THREE.TorusGeometry(1.02, 0.038, 10, 36), glow(0x9be2ff, 0.85)),
        1.2,
        1.75,
        -1.2
      );
      const mw = milkyWaySky(true);
      k.add(mw.root);
      const kimi = k.actor('kimi').wear('tiara');
      const scroll = k.prop('prop_scroll', 0.95);
      const A = cam([-1.2, 1.85, 6.5], [0.8, 3.2, -6], 39);
      const B = cam([-0.6, 1.72, 5.8], [1.2, 3.8, -8], 38);
      return ({ u, T }) => {
        ringA.rotation.set(0.45, T * 0.65, 0.2);
        ringB.rotation.set(-0.35, -T * 0.85, 0.5);
        mw.vegaGlow.scale.setScalar(4.5 + Math.sin(T * 5.5) * 0.9);
        kimi.act('nod', T, T - u * 1.4).at(-1.05, 0.28, 0.2).emote('fx_shine', T);
        scroll.at(-0.35, 0.88 + Math.sin(T * 2.5) * 0.06, 0.3);
        return glide(A, B, u);
      };
    },
  },

  // ── L31：许下爱恋的愿望 ──────────────────────────────────────────────────
  {
    id: 'L31',
    title: '许下爱恋的愿望',
    lyric: '许下爱恋的愿望',
    cast: ['whale', 'claude', 'kimi'],
    look: 'galaxy',
    note: '数十盏暖金与樱粉许愿天灯从本鲸、小克与 Kimi 身边冉冉升起，带着爱恋的心愿飞向远方织女星。',
    build: (k) => {
      k.add(ground(115, 0x1b204a));
      backdropHills(k.root, 0x212759, 0x2e2e6b, 76);
      k.add(milkyWaySky(true).root);
      const lanterns = many(22, (i) =>
        k.add(skyLantern(i % 3 === 0 ? 0xffa8cc : 0xffcf78, 0.72 + hash(i) * 0.38))
      );
      const whale = k.actor('whale');
      const claude = k.actor('claude').wear('crown');
      const kimi = k.actor('kimi').wear('tiara');
      const A = cam([0, 1.75, 7.2], [0, 1.9, -2], 40);
      const B = cam([0, 1.55, 7.6], [0, 3.6, -4], 41);
      return ({ u, T, bt }) => {
        whale.act('wave', T).at(-1.35, 0, 0.6).sq(beatBounce(bt, 0.04)).emote('fx_heart', T);
        claude.idle(T).faceLeft(true).at(0.15, 0, 0.6).sq(beatBounce(bt, 0.04));
        kimi.idle(T).faceLeft(true).at(1.85, 0, 0.2).sq(beatBounce(bt, 0.03));
        lanterns.forEach((ln, i) => {
          const baseY = i < 2 ? 1.15 : 0.8 + hash(i * 5) * 4.5;
          const rise = u * (2.6 + hash(i) * 1.4);
          const x =
            i === 0
              ? -0.65 + Math.sin(T + i) * 0.15
              : i === 1
                ? 0.55 + Math.cos(T + i) * 0.15
                : (hash(i * 3) - 0.5) * 14 + Math.sin(T * 1.1 + i) * 0.3;
          const z = i < 2 ? 0.5 : -10 + hash(i * 7) * 10;
          ln.position.set(x, baseY + rise, z);
          ln.rotation.y = T * 0.4 + i;
        });
        return glide(A, B, u);
      };
    },
  },

  // ── L32：流水走过（二段 · 满溪樱花草河灯）───────────────────────────────
  {
    id: 'L32',
    title: '满溪河灯顺水漂',
    lyric: '流水走过',
    cast: ['whale', 'claude'],
    look: 'lullaby',
    note: '夜溪上漂满一盏盏五瓣樱花草河灯，汇成地上第二条银河；本鲸与小克倚在拱桥上目送灯影流过。',
    build: (k) => {
      k.add(ground(110, 0x223b52));
      const river = k.add(new THREE.Mesh(new THREE.PlaneGeometry(6.2, 65), glass(0x2d6b99, 0.78)), 0, 0.04, -5);
      river.rotation.x = -PI / 2;
      k.add(archedBridge(3.5, 0.72, 1.9), 0, 0.02, -1.2);
      const rLans = many(18, (i) =>
        k.add(riverLantern(i % 2 ? 0xff94be : 0xffdf85, 0.9 + hash(i) * 0.25))
      );
      const whale = k.actor('whale');
      const claude = k.actor('claude').wear('crown');
      const A = cam([-1.5, 2.35, 6.8], [0, 1.0, -1.2], 39);
      const B = cam([1.2, 2.15, 6.2], [0, 1.05, -1.2], 38);
      return ({ u, T, bt }) => {
        whale.idle(T).at(-0.68, bridgeHeight(-0.68, 3.5, 0.72) + 0.08, -1.2).sq(beatBounce(bt, 0.035));
        claude.idle(T).faceLeft(true).at(0.68, bridgeHeight(0.68, 3.5, 0.72) + 0.08, -1.2).sq(beatBounce(bt, 0.035));
        rLans.forEach((rl, i) => {
          const z = ((T * 1.45 + i * 1.4) % 24) - 14;
          const x = (hash(i * 3) - 0.5) * 4.2 + Math.sin(T * 1.5 + i) * 0.25;
          rl.position.set(x, 0.06, z);
          rl.rotation.y = T * 0.6 + i;
        });
        return glide(A, B, u);
      };
    },
  },

  // ── L33：就像四季的变换（二段 · 四季花环日晷圆台）───────────────────────
  {
    id: 'L33',
    title: '四季花环圆盘流转',
    lyric: '就像四季的变换',
    cast: ['whale', 'claude', 'kimi'],
    look: 'stream',
    note: '巨大的软3D四色四季花环圆盘绕着两人缓缓转动，春夏秋冬树影轮番掠过，唯有圆心相伴的人始终不变。',
    build: (k) => {
      k.add(ground(110, 0x86d996));
      backdropHills(k.root, 0x8cd6a2, 0xa8dcf5, 74);
      k.add(roundCyl(1.85, 2.0, 0.26, 0xfff5e8, 28), 0, 0, 0);
      const wheel = new THREE.Group();
      k.add(wheel, 0, 0.05, 0);
      const kinds: Array<'spring' | 'summer' | 'autumn' | 'winter'> = ['spring', 'summer', 'autumn', 'winter'];
      const padCols = [0xffcce0, 0x8ce8a8, 0xffd685, 0xdcf2ff];
      kinds.forEach((s, i) => {
        const a = (i / 4) * TAU;
        const x = Math.cos(a) * 3.8;
        const z = Math.sin(a) * 3.8;
        put(wheel, roundCyl(1.15, 1.25, 0.16, padCols[i], 20), x, 0, z);
        put(wheel, seasonTree(s, 0.82, i * 9), x, 0.16, z);
      });
      const whale = k.actor('whale');
      const claude = k.actor('claude').wear('crown');
      const kimi = k.actor('kimi').wear('tiara');
      const A = cam([0, 3.6, 8.8], [0, 1.1, 0], 40);
      const B = cam([0, 3.1, 7.8], [0, 1.15, 0], 38);
      return ({ u, T, bt }) => {
        wheel.rotation.y = u * PI * 0.95;
        whale.act('sway', T).at(-0.68, 0.26, 0.15).sq(beatBounce(bt, 0.04));
        claude.act('sway', T).faceLeft(true).at(0.68, 0.26, 0.15).sq(beatBounce(bt, 0.04));
        kimi.idle(T).at(0, 0.26, -0.85);
        return glide(A, B, u);
      };
    },
  },

  // ── L34：幸福在蔓延（二段 · 晨曦花浪点亮山坡）───────────────────────────
  {
    id: 'L34',
    title: '晨曦花浪漫过山丘',
    lyric: '幸福在蔓延',
    cast: ['doubao', 'gemini', 'qwen'],
    look: 'spring',
    note: '暖金朝阳从远山升起，晨光扫过之处成排樱花草如多米诺花浪般连绵盛开，豆包、猫娘与千问迎着朝阳挥手欢跳。',
    build: (k) => {
      k.add(ground(115, 0x8ce090));
      backdropHills(k.root, 0x99e09e, 0xffd1e0, 74);
      const sun = k.add(makeSprite('glow', 9.5, 0xffe69e, true, 0.65), 0, 5.5, -32);
      const field = many(36, (i) => {
        const row = Math.floor(i / 9);
        const col = i % 9;
        const fl = k.add(
          primrosePlant(0.85, (row + col) % 2 ? 0xff82b2 : 0xffb3d1, 0.3),
          -5.6 + col * 1.4,
          0,
          -4.2 + row * 1.45
        );
        return { fl, row };
      });
      const doubao = k.actor('doubao');
      const gemini = k.actor('gemini').wear('bow');
      const qwen = k.actor('qwen');
      const A = cam([0, 2.55, 7.8], [0, 1.15, -1.2], 39);
      const B = cam([0, 2.25, 7.0], [0, 1.25, -1.0], 38);
      return ({ u, T }) => {
        sun.position.y = lerp(4.5, 7.8, ease(u));
        field.forEach(({ fl, row }, i) => {
          const p = backOut(seg(u, row * 0.16, row * 0.16 + 0.28), 2.3);
          fl.scale.setScalar(Math.max(0.001, 0.85 * p));
          fl.rotation.z = Math.sin(T * 2.8 + i) * 0.06;
        });
        doubao.act('hop', T).at(-2.1, 0, 0.65);
        gemini.act('hop', T).at(0, 0, 0.85).emote('fx_shine', T);
        qwen.act('sway', T).faceLeft(true).at(2.1, 0, 0.65);
        return glide(A, B, u);
      };
    },
  },

  // ── L35：爱你永恒不孤单（二段 · 樱花草花拱门）───────────────────────────
  {
    id: 'L35',
    title: '花拱门下永恒相伴',
    lyric: '爱你永恒不孤单',
    cast: ['whale', 'claude'],
    look: 'spring',
    fx: { whiteOut: true },
    note: '十一朵五瓣樱花草围成温暖的心意花拱门，金色星丝牵起两盆樱花草，本鲸与小克并肩站在拱门中央。',
    build: (k) => {
      k.add(ground(110, 0x8be090));
      backdropHills(k.root, 0x95de9c, 0xffcadf, 74);
      const arch = k.add(
        new THREE.Mesh(new THREE.TorusGeometry(2.45, 0.08, 12, 36, PI), glow(0x7ac788, 1)),
        0,
        0.1,
        -0.2
      );
      void arch;
      const archFlowers = many(11, (i) => {
        const a = lerp(0.12, PI - 0.12, i / 10);
        const fl = k.add(
          primroseBlossom(0.62, i % 2 ? 0xff82b2 : 0xffdf85, 0.35),
          Math.cos(a) * 2.45,
          0.1 + Math.sin(a) * 2.45,
          -0.12
        );
        fl.rotation.x = PI * 0.45;
        return fl;
      });
      k.add(primrosePot(0.78), -1.85, 0, 0.4);
      k.add(primrosePot(0.78), 1.85, 0, 0.4);
      const whale = k.actor('whale');
      const claude = k.actor('claude').wear('crown');
      const A = cam([0, 1.95, 7.2], [0, 1.25, 0], 38);
      const B = cam([0, 1.72, 5.8], [0, 1.2, 0], 36);
      return ({ u, T, bt }) => {
        archFlowers.forEach((fl, i) => {
          fl.rotation.z = T * 0.5 + i;
          fl.scale.setScalar(0.62 * (1 + bt.pulse * 0.08));
        });
        whale.act('sway', T).at(-0.78, 0, 0.1).sq(beatBounce(bt, 0.045)).emote('fx_heart', T);
        claude.act('sway', T).faceLeft(true).at(0.78, 0, 0.1).sq(beatBounce(bt, 0.045)).emote('fx_heart', T, -0.3, 0.14);
        return glide(A, B, u);
      };
    },
  },

  // ── L36：恋人手中樱花草（副歌二）────────────────────────────────────────
  {
    id: 'L36',
    title: '晨露双生樱花草',
    lyric: '恋人手中樱花草',
    cast: ['whale', 'claude'],
    look: 'spring',
    fx: { whiteIn: true },
    note: '晶莹晨露在两盆并排盛放的樱花草花瓣上闪光，本鲸与小克隔着花台温柔颔首。',
    build: (k) => {
      k.add(ground(110, 0x8de392));
      backdropHills(k.root, 0x96e09d, 0xffcce0, 72);
      k.add(softBox(1.85, 0.5, 0.9, 0xf5e8dc, 0.07), 0, 0.25, 0.45);
      const potL = k.add(primrosePot(0.98), -0.45, 0.5, 0.45);
      const potR = k.add(primrosePot(0.98), 0.45, 0.5, 0.45);
      const dews = many(20, (i) =>
        k.add(makeSprite('bubble', 0.22, i % 2 ? 0xffffff : 0xffe3f0, true, 0.85))
      );
      const whale = k.actor('whale');
      const claude = k.actor('claude').wear('crown');
      const A = cam([-0.6, 1.72, 5.9], [0, 1.05, 0.3], 36);
      const B = cam([0.6, 1.62, 5.2], [0, 1.05, 0.35], 34);
      return ({ u, T, bt }) => {
        potL.rotation.y = T * 0.6;
        potR.rotation.y = -T * 0.6;
        whale.act('wave', T).at(-1.55, 0, 0.25).sq(beatBounce(bt, 0.045));
        claude.act('tilt', T, T - u * 1.4).faceLeft(true).at(1.55, 0, 0.25).emote('fx_sparkle', T, -0.3, 0.14);
        dews.forEach((d, i) => {
          const ph = (T * 0.38 + hash(i * 3)) % 1;
          d.position.set((hash(i * 5) - 0.5) * 5.2, 0.55 + ph * 2.8, -0.8 + hash(i * 7) * 2.8);
          setSpriteOp(d, Math.sin(ph * PI) * 0.85);
        });
        return glide(A, B, u);
      };
    },
  },

  // ── L37：春彩漫步的微笑（二段）──────────────────────────────────────────
  {
    id: 'L37',
    title: '樱花大道并肩春游',
    lyric: '春彩漫步的微笑',
    cast: ['whale', 'claude'],
    look: 'spring',
    note: '俯仰环绕镜头掠过铺满粉瓣的春彩大道，两侧樱树与樱花草织成春天的走廊，两人轻步微笑向前。',
    build: (k) => {
      k.add(ground(115, 0x8ee091));
      backdropHills(k.root, 0x98de9c, 0xffd1e3, 74);
      k.add(softBox(5.2, 0.06, 28, 0xfff1e6, 0.02), 0, 0.02, -4);
      for (let i = 0; i < 6; i++) {
        k.add(seasonTree('spring', 1.25, i * 3), -3.8, 0, 3 - i * 3.6);
        k.add(seasonTree('spring', 1.25, i * 3 + 1), 3.8, 0, 3 - i * 3.6);
      }
      many(28, (i) =>
        k.add(
          primrosePlant(0.78, i % 3 === 0 ? 0xffdf7d : 0xff8ab5, 0.25),
          i % 2 ? 2.85 : -2.85,
          0,
          4 - (i >> 1) * 1.4
        )
      );
      const petals = many(32, () => k.add(makeSprite('petal', 0.3, 0xff9ec4, false, 0.9)));
      const whale = k.actor('whale');
      const claude = k.actor('claude').wear('crown');
      return ({ u, T, bt }) => {
        const z = lerp(-2.2, 1.4, u);
        whale.walkBy((z + 2.2) * 1.2).at(-0.72, 0.05, z).sq(beatBounce(bt, 0.045));
        claude.walkBy((z + 2.2) * 1.2).faceLeft(true).at(0.72, 0.05, z).sq(beatBounce(bt, 0.045));
        petals.forEach((p, i) => {
          const ph = (T * 0.42 + hash(i * 3)) % 1;
          p.position.set((hash(i * 5) - 0.5) * 8, 4.2 - ph * 3.9, z - 4 + hash(i * 7) * 7);
          p.material.rotation = T * 2.1 + i;
        });
        return cam([Math.sin(u * 1.2) * 1.4, 2.05, z + 6.2], [0, 1.05, z], 38);
      };
    },
  },

  // ── L38：种下了一朵朵（二段 · 七位伙伴同种花圃）─────────────────────────
  {
    id: 'L38',
    title: '全员同种樱花草圃',
    lyric: '种下了一朵朵',
    cast: ['doubao', 'gemini', 'whale', 'claude', 'qwen', 'kimi', 'zai'],
    look: 'spring',
    note: '七位伙伴一人守着一株樱花草苗，随节拍从左到右依次绽放成七彩春圃，热闹而井然有序。',
    build: (k) => {
      k.add(ground(115, 0x8ce090));
      backdropHills(k.root, 0x94de9a, 0xbae4f7, 74);
      const cols = [0xff8ab5, 0x94dcff, 0xff7eb0, 0xffb38a, 0x85ebbd, 0xcab8ff, 0xffe07d];
      const plants = many(7, (i) => {
        const x = -4.2 + i * 1.4;
        k.add(roundCyl(0.38, 0.42, 0.16, 0x7c523c, 14), x, 0, 0.72);
        return k.add(primrosePlant(1.02, cols[i], 0.34), x, 0.16, 0.72);
      });
      const cast = [
        k.actor('doubao'),
        k.actor('gemini').wear('bow'),
        k.actor('whale'),
        k.actor('claude').wear('crown'),
        k.actor('qwen'),
        k.actor('kimi').wear('tiara'),
        k.actor('zai'),
      ];
      const A = cam([0, 2.45, 9.2], [0, 1.05, 0], 40);
      const B = cam([0, 2.25, 8.4], [0, 1.05, 0.2], 39);
      return ({ u, T, bt }) => {
        const sq = beatBounce(bt, 0.05);
        plants.forEach((pl, i) => {
          const p = backOut(seg(u, i * 0.1, i * 0.1 + 0.22), 2.4);
          pl.scale.setScalar(Math.max(0.001, 1.02 * p));
          pl.rotation.z = Math.sin(T * 3 + i) * 0.06;
        });
        cast.forEach((ac, i) => {
          const x = -4.2 + i * 1.4;
          const actName = i === 2 ? 'wave' : i % 2 === 0 ? 'hop' : 'sway';
          ac.act(actName, T).faceLeft(i > 3).at(x, 0, -0.35);
          if (actName !== 'hop') ac.sq(sq);
        });
        return glide(A, B, u);
      };
    },
  },

  // ── L39：青春璀璨的年少（二段 · 花藤秋千与晴空光雨）─────────────────────
  {
    id: 'L39',
    title: '花藤木架与璀璨年少',
    lyric: '青春璀璨的年少',
    cast: ['whale', 'claude', 'gemini', 'doubao'],
    look: 'spring',
    note: '山巅花藤木秋千随风轻荡，金色阳光星屑洒满草地，本鲸、小克、猫娘与豆包在花雨中尽情欢笑。',
    build: (k) => {
      k.add(ground(115, 0x8be08f));
      backdropHills(k.root, 0x95de9e, 0xffcce2, 74);
      // 软3D花藤秋千架
      k.add(roundCyl(0.11, 0.13, 3.6, 0x9e6a48, 10), -1.8, 0, -0.5);
      k.add(roundCyl(0.11, 0.13, 3.6, 0x9e6a48, 10), 1.8, 0, -0.5);
      k.add(softBox(4.1, 0.18, 0.24, 0x9e6a48, 0.04), 0, 3.55, -0.5);
      for (let i = 0; i < 6; i++) {
        k.add(primroseBlossom(0.45, 0xff8ab5, 0.35), -1.5 + i * 0.6, 3.68, -0.38);
      }
      const swing = new THREE.Group();
      k.add(swing, 0, 3.5, -0.5);
      put(swing, roundCyl(0.02, 0.02, 2.5, 0xfff0d4, 6), -0.65, -2.5, 0);
      put(swing, roundCyl(0.02, 0.02, 2.5, 0xfff0d4, 6), 0.65, -2.5, 0);
      put(swing, softBox(1.55, 0.1, 0.5, 0xd49568, 0.03), 0, -2.5, 0);
      put(swing, primrosePot(0.72), 0, -2.45, 0);

      const sparks = many(28, (i) =>
        k.add(makeSprite('star', 0.45, i % 2 ? 0xffe885 : 0xffa8cc, true, 0.85))
      );
      const whale = k.actor('whale');
      const claude = k.actor('claude').wear('crown');
      const gemini = k.actor('gemini').wear('bow');
      const doubao = k.actor('doubao');
      const A = cam([-0.8, 2.05, 7.6], [0, 1.35, -0.2], 38);
      const B = cam([0.8, 1.95, 7.0], [0, 1.35, -0.2], 37);
      return ({ u, T, bt }) => {
        swing.rotation.x = Math.sin(T * 2.1) * 0.2;
        whale.act('hop', T).at(-1.35, 0, 0.7).emote('fx_shine', T);
        claude.act('sway', T).faceLeft(true).at(1.35, 0, 0.7).sq(beatBounce(bt, 0.05));
        doubao.act('spin', T).at(-2.95, 0, 0.2);
        gemini.act('hop', T).faceLeft(true).at(2.95, 0, 0.2);
        sparks.forEach((s, i) => {
          const ph = (T * 0.42 + hash(i * 3)) % 1;
          s.position.set((hash(i * 5) - 0.5) * 10, 0.8 + ph * 3.8, -2 + hash(i * 7) * 4.5);
          setSpriteOp(s, Math.sin(ph * PI) * 0.9);
        });
        return glide(A, B, u);
      };
    },
  },

  // ── L40：恋人怀中樱花草（二段 · 粉白花亭特写）───────────────────────────
  {
    id: 'L40',
    title: '花亭柔光怀抱樱花草',
    lyric: '恋人怀中樱花草',
    cast: ['whale', 'claude'],
    look: 'blush',
    note: '粉霞笼罩的花亭里，樱花草盆栽在两人怀前散发温润柔光，漫天花瓣缓缓旋落。',
    build: (k) => {
      k.add(ground(100, 0x99d19e));
      k.add(teaPavilion(1.05), 0, 0, -0.2);
      const pot = k.add(primrosePot(1.05), 0, 0.88, -0.35);
      const petals = many(26, (i) =>
        k.add(makeSprite('petal', 0.28, i % 2 ? 0xff94be : 0xffe6f0, false, 0.9))
      );
      const whale = k.actor('whale');
      const claude = k.actor('claude').wear('crown');
      const A = cam([0, 1.85, 6.2], [0, 1.25, -0.1], 36);
      const B = cam([0, 1.72, 5.3], [0, 1.22, -0.1], 34);
      return ({ u, T, bt }) => {
        pot.rotation.y = T * 0.65;
        whale.idle(T).at(-1.05, 0.26, 0.15).sq(beatBounce(bt, 0.04)).emote('fx_heart', T);
        claude.idle(T).faceLeft(true).at(1.05, 0.26, 0.15).sq(beatBounce(bt, 0.04));
        petals.forEach((p, i) => {
          const ph = (T * 0.36 + hash(i * 3)) % 1;
          p.position.set((hash(i * 5) - 0.5) * 6.5, 4.0 - ph * 3.6, -1.8 + hash(i * 7) * 3.8);
          p.material.rotation = T * 1.8 + i;
        });
        return glide(A, B, u);
      };
    },
  },

  // ── L41：听见胸膛心在跳（二段 · 双心共振涟漪）───────────────────────────
  {
    id: 'L41',
    title: '镜池双心同频跳动',
    lyric: '听见胸膛心在跳',
    cast: ['whale', 'claude'],
    look: 'blush',
    note: '粉霞镜池上，一蓝一粉两圈心跳涟漪交叠扩散，两颗软3D爱心按 74 BPM 双搏同频起伏。',
    build: (k) => {
      const pond = k.add(new THREE.Mesh(new THREE.PlaneGeometry(80, 60), glass(0xf2b8d4, 0.65)), 0, 0.02, -5);
      pond.rotation.x = -PI / 2;
      k.add(roundCyl(0.95, 1.05, 0.16, 0xfff5f9, 24), -1.35, 0, 0.2);
      k.add(roundCyl(0.95, 1.05, 0.16, 0xfff5f9, 24), 1.35, 0, 0.2);
      const hL = k.add(plumpHeart(0.46, 0x7acbff, 0.92), -0.35, 1.55, 0.2);
      const hR = k.add(plumpHeart(0.46, 0xff7da8, 0.92), 0.35, 1.55, 0.2);
      const ringsL = many(3, () => {
        const r = rippleRing(0x9be2ff, true);
        k.add(r.mesh, -1.35, 0.06, 0.2);
        return r;
      });
      const ringsR = many(3, () => {
        const r = rippleRing(0xff94be, true);
        k.add(r.mesh, 1.35, 0.06, 0.2);
        return r;
      });
      const whale = k.actor('whale');
      const claude = k.actor('claude').wear('crown');
      const A = cam([0, 2.25, 6.8], [0, 1.1, 0.1], 37);
      const B = cam([0, 1.95, 5.9], [0, 1.15, 0.1], 35);
      return ({ u, T, bt }) => {
        const hb = bt.lubDub;
        hL.scale.setScalar(0.44 + hb * 0.18);
        hR.scale.setScalar(0.44 + hb * 0.18);
        hL.rotation.z = 0.18;
        hR.rotation.z = -0.18;
        ringsL.forEach((r, i) => {
          const ph = (T * 0.62 + i / 3) % 1;
          r.mesh.scale.setScalar(0.9 + ph * 2.8);
          r.mat.opacity = (1 - ph) * 0.65;
        });
        ringsR.forEach((r, i) => {
          const ph = (T * 0.62 + i / 3) % 1;
          r.mesh.scale.setScalar(0.9 + ph * 2.8);
          r.mat.opacity = (1 - ph) * 0.65;
        });
        whale.idle(T).at(-1.35, 0.16, 0.2).sq(hb * 0.05).emote('fx_heart', T);
        claude.idle(T).faceLeft(true).at(1.35, 0.16, 0.2).sq(hb * 0.05).emote('fx_heart', T, -0.3, 0.14);
        return glide(A, B, u);
      };
    },
  },

  // ── L42：偷偷的在思念（二段 · 玻璃花语许愿瓶）───────────────────────────
  {
    id: 'L42',
    title: '木栏上的花语许愿瓶',
    lyric: '偷偷的在思念',
    cast: ['claude', 'whale'],
    look: 'blush',
    note: '暖阳木栏上整整齐齐排着五只封存樱花草花瓣的透明玻璃瓶，小克静静翻阅花语笔记，本鲸在不远处悄悄望来。',
    build: (k) => {
      k.add(ground(100, 0x99d49d));
      backdropHills(k.root, 0xc7b8e6, 0xffcadf, 74);
      k.add(softBox(6.8, 0.16, 0.55, 0xc9936c, 0.04), 0, 0.72, 0.65);
      k.add(roundCyl(0.08, 0.09, 0.72, 0xa87552, 8), -2.8, 0, 0.65);
      k.add(roundCyl(0.08, 0.09, 0.72, 0xa87552, 8), 2.8, 0, 0.65);
      const bottles = many(5, (i) => k.add(wishingBottle(0.95), -2.0 + i * 1.0, 0.8, 0.65));
      const claude = k.actor('claude').wear('crown');
      const whale = k.actor('whale');
      const book = k.prop('prop_book', 0.9);
      const A = cam([-0.6, 1.75, 6.2], [0, 1.05, 0.2], 36);
      const B = cam([0.5, 1.65, 5.6], [0.1, 1.05, 0.3], 35);
      return ({ u, T }) => {
        bottles.forEach((b, i) => {
          b.rotation.y = T * 0.5 + i;
        });
        claude.act('read', T).faceLeft(true).at(1.45, 0, -0.25).emote('fx_heart', T, -0.3, 0.14);
        book.at(0.88, 0.56, 0.0);
        whale.act('wave', T).at(-1.65, 0, -0.35).emote('fx_sparkle', T);
        return glide(A, B, u);
      };
    },
  },

  // ── L43：那是我们相爱的味道 ──────────────────────────────────────────────
  {
    id: 'L43',
    title: '那是我们相爱的味道',
    lyric: '那是我们相爱的味道',
    cast: ['whale', 'claude'],
    look: 'finale',
    note: '春风裹着暖茶清香与漫天粉金樱花草花雨拂过草坡，化作柔光香气丝带萦绕在本鲸与小克身旁。',
    build: (k) => {
      k.add(ground(115, 0x92e096));
      backdropHills(k.root, 0xa6e0a8, 0xffcce0, 74);
      // 花园小圆茶几：樱花草花盆 + 暖香茶杯
      k.add(roundCyl(0.68, 0.75, 0.55, 0xfff3e6, 20), 0, 0, 0.35);
      const pot = k.add(primrosePot(1.05), -0.15, 0.55, 0.35);
      const cup = k.prop('prop_teacup', 0.9);
      // 螺旋上升的春风花香粒子带
      const aroma = many(40, (i) =>
        k.add(
          makeSprite(
            i % 3 === 0 ? 'glow' : 'petal',
            i % 3 === 0 ? 0.55 : 0.32,
            i % 2 ? 0xff9ec4 : 0xffe69e,
            i % 3 === 0,
            0.85
          )
        )
      );
      const whale = k.actor('whale');
      const claude = k.actor('claude').wear('crown');
      const A = cam([0, 1.85, 6.4], [0, 1.15, 0.2], 36);
      const B = cam([0, 2.45, 7.6], [0, 1.45, 0.1], 38);
      return ({ u, T, bt }) => {
        pot.rotation.y = T * 0.55;
        cup.at(0.38, 0.56, 0.48);
        whale.act('sway', T).at(-1.42, 0, 0.2).sq(beatBounce(bt, 0.045)).emote('fx_heart', T);
        claude.act('sway', T).faceLeft(true).at(1.42, 0, 0.2).sq(beatBounce(bt, 0.045)).emote('fx_steam', T, -0.32, 0.14);
        aroma.forEach((a, i) => {
          const ph = (i / 40 + T * 0.22) % 1;
          const ang = ph * TAU * 2.2 + (i % 2) * PI;
          const r = 0.55 + ph * 3.2;
          a.position.set(Math.cos(ang) * r, 0.65 + ph * 3.8, 0.2 + Math.sin(ang) * r * 0.65);
          a.material.rotation = ang;
          setSpriteOp(a, Math.sin(ph * PI) * 0.85);
        });
        return glide(A, B, u);
      };
    },
  },
];
