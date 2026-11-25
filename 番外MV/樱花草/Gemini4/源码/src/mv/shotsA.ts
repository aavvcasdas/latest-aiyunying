// 分镜表（上）：序章 I01–I04 · 主歌一 L01–L08 · 导歌一 L09–L12 · 副歌一 L13–L20
import * as THREE from 'three';
import {
  archedBridge,
  backdropHills,
  backOut,
  bambooStalk,
  bridgeHeight,
  ease,
  easeOut,
  glass,
  glow,
  ground,
  hash,
  herbariumBook,
  leafBoat,
  lerp,
  makeSprite,
  many,
  milkyWaySky,
  pebble,
  PI,
  pinwheel,
  plumpHeart,
  primroseBlossom,
  primrosePlant,
  primrosePot,
  put,
  rippleRing,
  roundCyl,
  seasonTree,
  seg,
  setSpriteOp,
  softBox,
  softCloud,
  softHill,
  TAU,
  teaPavilion,
  windChime,
} from './kit';
import { beatBounce, cam, glide, type ShotDef } from './types';

function addMoon(parent: THREE.Object3D, x: number, y: number, z: number, r = 3.2, col = 0xfff3c9) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 18), glow(col, 0.98));
  put(parent, m, x, y, z);
  put(parent, makeSprite('glow', r * 4.8, col, true, 0.48), x, y, z);
  return m;
}

export const SHOTS_A: ShotDef[] = [
  // ── 序章 I01：月下书桌与樱花草花语绘本 ──────────────────────────────────
  {
    id: 'I01',
    title: '月下翻开花语册',
    lyric: '前奏 · 樱花草花语绘本缓缓开启',
    cast: [],
    look: 'desk',
    fx: { fadeIn: true },
    note: '月光洒在暖木书桌上，热茶轻冒白气，封面嵌着五瓣樱花草的立体绘本缓缓翻开，金粉花尘袅袅升起。',
    build: (k) => {
      k.add(ground(55, 0x5c3d2e));
      const book = herbariumBook();
      k.add(book.root, 0, 0, -0.4);
      // 暖黄小台灯蜡烛与热茶杯
      k.add(roundCyl(0.26, 0.32, 1.15, 0xfff3de, 14), -5.0, 0, -2.5);
      const flame = k.add(makeSprite('glow', 2.2, 0xffbe63, true, 0.85), -5.0, 1.48, -2.5);
      k.add(primrosePot(0.95), 5.1, 0, -2.2);
      const cup = k.prop('prop_teacup', 1.15);
      // 窗外满月柔辉
      addMoon(k.root, 9, 13, -34, 3.6);
      const motes = many(28, (i) =>
        k.add(
          makeSprite(i % 3 === 0 ? 'petal' : 'star', 0.35, i % 2 ? 0xffb3d1 : 0xffe89e, true, 0)
        )
      );
      const A = cam([0.4, 6.2, 12.2], [0.4, 1.3, -0.4], 38);
      const B = cam([0.0, 5.2, 9.4], [0.0, 1.2, -0.3], 36);
      return ({ u, T }) => {
        cup.at(-3.9, 0.02, -1.6);
        const open = ease(seg(u, 0.02, 0.32));
        book.cover.rotation.z = open * (PI * 0.98);
        (book.pageGlow.material as THREE.MeshBasicMaterial).opacity = open * 0.52;
        book.pressedFlower.rotation.y = T * 0.45;
        book.pressedFlower.scale.setScalar(1.0 + open * 0.25);
        flame.scale.setScalar(2.1 + Math.sin(T * 7.5) * 0.18);
        motes.forEach((s, i) => {
          const ph = (T * 0.28 + hash(i * 3)) % 1;
          s.position.set(
            (hash(i * 5) - 0.5) * 6.4,
            0.55 + ph * 4.4,
            -0.4 + (hash(i * 7) - 0.5) * 4.2
          );
          s.scale.setScalar((0.22 + 0.32 * Math.sin(ph * PI)) * (i % 3 === 0 ? 1.1 : 0.9));
          setSpriteOp(s, open * Math.sin(ph * PI) * 0.85);
        });
        return glide(A, B, u);
      };
    },
  },

  // ── 序章 I02：本鲸跃入发光花语书页 ──────────────────────────────────────
  {
    id: 'I02',
    title: '本鲸跃入花语书',
    lyric: '前奏 · 轻步奔向发光的春夜书页',
    cast: ['whale'],
    look: 'desk',
    fx: { whiteOut: true },
    note: '本鲸小跑着来到翻开的花语册前，惊喜驻足一瞬，再高高跃入绽放樱花草光芒的书页深处。',
    build: (k) => {
      k.add(ground(55, 0x5c3d2e));
      const book = herbariumBook();
      book.cover.rotation.z = PI * 0.96;
      k.add(book.root, 0, 0, -0.5);
      // 书页中央缓缓升起三株迷你立体竹与樱花草纸雕
      const miniBamboo = many(5, (i) =>
        k.add(bambooStalk(2.1 + hash(i) * 0.9, 0x45a37e, i), -1.8 + i * 0.9, 0.4, -1.5)
      );
      const centerFl = k.add(primrosePlant(1.35, 0xff8ab5, 0.45), 0.1, 0.4, -0.3);
      k.add(primrosePot(0.9), 5.2, 0, -2.0);
      const whale = k.actor('whale');
      const sparks = many(32, (i) =>
        k.add(makeSprite(i % 2 ? 'petal' : 'star', 0.42, i % 2 ? 0xffa8cc : 0xfff0a8, true, 0))
      );
      const A = cam([-2.8, 4.4, 11.4], [-0.8, 1.0, 0.4], 39);
      const B = cam([0.0, 4.8, 5.6], [0.0, 1.0, -0.4], 35);
      return ({ u, T }) => {
        const runU = seg(u, 0, 0.46);
        const pauseU = seg(u, 0.46, 0.62);
        const jumpU = seg(u, 0.62, 0.94);
        const pop = backOut(seg(u, 0.05, 0.5));
        miniBamboo.forEach((b, i) => {
          b.scale.setScalar(Math.max(0.01, pop));
          b.rotation.z = Math.sin(T * 2 + i) * 0.05;
        });
        centerFl.scale.setScalar(Math.max(0.01, 1.35 * pop));
        (book.pageGlow.material as THREE.MeshBasicMaterial).opacity = 0.5 + jumpU * 0.48;

        if (u < 0.46) {
          const x = lerp(-6.6, -2.4, runU);
          whale.walkBy(x + 6.6).at(x, 0, 2.8);
        } else if (u < 0.62) {
          whale
            .act('surprise', T, T - pauseU * 0.9)
            .at(-2.4, 0, 2.8)
            .emote('fx_sparkle', T);
        } else {
          const j = ease(jumpU);
          whale
            .act('wave', T)
            .at(lerp(-2.4, 0.0, j), 0.45 * j, lerp(2.8, -0.3, j))
            .lift(Math.sin(j * PI) * 2.4)
            .scale(lerp(1, 0.48, j))
            .alpha(jumpU > 0.95 ? 0 : 1);
        }

        sparks.forEach((s, i) => {
          const ph = (T * 0.45 + hash(i * 4)) % 1;
          const a = i * 1.1 + T * 0.7;
          const r = 0.6 + ph * 3.1;
          s.position.set(Math.cos(a) * r, 0.55 + ph * 3.8, -0.4 + Math.sin(a) * r * 0.75);
          setSpriteOp(s, Math.sin(ph * PI) * (0.55 + jumpU * 0.45));
        });
        return glide(A, B, u);
      };
    },
  },

  // ── 序章 I03：翠竹月谷全景与掠过满月的龙影 ──────────────────────────────
  {
    id: 'I03',
    title: '月谷竹海与星辉龙影',
    lyric: '前奏 · 吉他声起，白龙掠过竹海明月',
    cast: ['gpt', 'whale'],
    look: 'bamboo',
    fx: { whiteIn: true },
    note: '镜头越过波光粼粼的春溪与木拱桥，翠竹山谷在满月下舒展；龙娘从明月高空展翼掠过，洒下第一缕星辉。',
    build: (k) => {
      k.add(ground(120, 0x26544a));
      backdropHills(k.root, 0x1d4745, 0x255956, 72);
      // 银蓝溪带与微拱木桥
      const river = k.add(new THREE.Mesh(new THREE.PlaneGeometry(7.2, 95), glass(0x58b8d9, 0.62)), 0, 0.03, -8);
      river.rotation.x = -PI / 2;
      k.add(archedBridge(3.8, 0.72, 2.0), 0, 0.02, 1.5);
      addMoon(k.root, 6.5, 13.5, -42, 4.4, 0xfff5cc);

      const bamboos = many(28, (i) => {
        const side = i % 2 === 0 ? -1 : 1;
        const x = side * (4.6 + hash(i * 3) * 11);
        const z = -22 + hash(i * 5) * 32;
        return k.add(bambooStalk(5.5 + hash(i) * 3.4, i % 3 ? 0x368569 : 0x469e7c, i), x, 0, z);
      });
      const whale = k.actor('whale');
      const gpt = k.actor('gpt', 2.4);
      const trail = many(16, () => k.add(makeSprite('star', 0.6, 0xfff1b8, true, 0)));
      const A = cam([-5.5, 3.2, 13.8], [1.5, 3.8, -12], 42);
      const B = cam([-1.5, 5.4, 11.2], [3.5, 6.2, -18], 40);
      return ({ u, T, bt }) => {
        bamboos.forEach((b, i) => {
          b.rotation.z = Math.sin(T * 1.6 + i * 0.7) * 0.055;
        });
        const wx = lerp(-2.4, 0.2, ease(u));
        whale.walkBy(wx + 2.4).at(wx, bridgeHeight(wx, 3.8, 0.72) + 0.06, 1.5).sq(beatBounce(bt, 0.03));

        // 龙娘按设定只从天际高空掠过，洒下流光
        const gx = lerp(-12, 18, u);
        const gy = 12.2 + Math.sin(u * PI) * 2.4;
        const gz = -30;
        gpt.act('hover', T).at(gx, gy, gz).noShadow();
        trail.forEach((s, i) => {
          const lag = i * 0.035;
          const lu = Math.max(0, u - lag);
          s.position.set(
            lerp(-12, 18, lu),
            12.2 + Math.sin(lu * PI) * 2.4 + Math.sin(T * 3 + i) * 0.25,
            gz + 0.5
          );
          setSpriteOp(s, (1 - i / 16) * 0.72 * seg(u, 0.05, 0.2));
        });
        return glide(A, B, u);
      };
    },
  },

  // ── 序章 I04：竹径灯火下与小克初遇 ──────────────────────────────────────
  {
    id: 'I04',
    title: '竹径初遇与花芽微光',
    lyric: '前奏 · 石径苔痕间第一株樱花草轻晃',
    cast: ['whale', 'claude'],
    look: 'bamboo',
    note: '青石板路旁一株含苞的樱花草泛起柔粉微光，本鲸与戴小金冠的小克在竹灯下相逢，相视歪头微笑。',
    build: (k) => {
      k.add(ground(90, 0x28574c));
      backdropHills(k.root, 0x1b4242, 0x245452, 68);
      many(10, (i) => k.add(pebble(0.75, 0xc7d4cf, 0.16), -4.5 + i * 1.05, 0.02, 0.3 + Math.sin(i) * 0.2));
      const bamboos = many(22, (i) =>
        k.add(
          bambooStalk(5.8 + hash(i) * 2.8, i % 2 ? 0x3b8c6e : 0x4ca882, i),
          -11 + i * 1.1,
          0,
          -3.4 - hash(i * 4) * 5.5
        )
      );
      // 路心一株初绽的粉嫩樱花草
      const sprout = k.add(primrosePlant(1.15, 0xff94be, 0.45), 0, 0, 0.55);
      const spGlow = k.add(makeSprite('glow', 1.5, 0xffa8cc, true, 0.55), 0, 0.55, 0.55);
      // 暖光竹灯笼
      for (const lx of [-3.6, 3.6]) {
        k.add(roundCyl(0.06, 0.08, 1.9, 0x6e4e3a, 8), lx, 0, -1.6);
        k.add(softBox(0.38, 0.48, 0.38, 0xffe4a3, 0.06), lx, 2.05, -1.6);
        k.add(makeSprite('glow', 1.8, 0xffd27d, true, 0.55), lx, 2.05, -1.6);
      }
      const whale = k.actor('whale');
      const claude = k.actor('claude').wear('crown');
      const book = k.prop('prop_book', 0.85);
      const A = cam([0, 1.95, 7.6], [0, 1.0, 0], 37);
      const B = cam([0, 1.65, 6.2], [0, 0.95, 0.2], 35);
      return ({ u, T, bt }) => {
        bamboos.forEach((b, i) => {
          b.rotation.z = Math.sin(T * 1.7 + i * 0.6) * 0.05;
        });
        sprout.rotation.z = Math.sin(T * 2.4) * 0.08;
        spGlow.scale.setScalar(1.4 + bt.pulse * 0.28);

        const walkU = seg(u, 0, 0.62);
        const wx = lerp(-3.1, -1.15, ease(walkU));
        const cx = lerp(3.1, 1.15, ease(walkU));
        if (u < 0.62) {
          whale.walkBy(wx + 3.1).at(wx, 0, 0.25);
          claude.walkBy(3.1 - cx).faceLeft(true).at(cx, 0, 0.25);
        } else {
          whale.act('wave', T).at(wx, 0, 0.25).sq(beatBounce(bt, 0.04));
          claude
            .act('tilt', T, T - (u - 0.62) * 2.2)
            .faceLeft(true)
            .at(cx, 0, 0.25)
            .emote('fx_sparkle', T, -0.32, 0.14);
        }
        book.at(cx + 0.48, 0.52, 0.35);
        return glide(A, B, u);
      };
    },
  },

  // ── L01：晚风吹动着竹林 ──────────────────────────────────────────────────
  {
    id: 'L01',
    title: '晚风吹动着竹林',
    lyric: '晚风吹动着竹林',
    cast: ['whale'],
    look: 'bamboo',
    note: '晚风化作可见的柔青流光拂过层叠翠竹，漫天竹叶随拍轻旋，本鲸沿青石竹径缓步前行。',
    build: (k) => {
      k.add(ground(95, 0x26594c));
      backdropHills(k.root, 0x1b4544, 0x28615b, 70);
      addMoon(k.root, 7.5, 11.5, -36, 3.5);
      many(14, (i) => k.add(pebble(0.72, 0xcad9d2, 0.15), -6 + i * 0.95, 0.02, 0.2));
      // 前后两层错落竹林
      const stalks = many(32, (i) => {
        const fg = i < 4;
        const x = fg ? (i < 2 ? -4.8 - i * 0.7 : 4.8 + (i - 2) * 0.7) : -13 + (i - 4) * 0.96;
        const z = fg ? 2.6 + (i % 2) * 0.5 : -2.6 - hash(i * 7) * 7.5;
        return k.add(bambooStalk(6.2 + hash(i) * 3.2, i % 2 ? 0x3b9171 : 0x52b38b, i), x, 0, z);
      });
      const leaves = many(30, (i) =>
        k.add(makeSprite('leaf', 0.32, i % 2 ? 0x9bf5c8 : 0x6adba5, true, 0.8))
      );
      const whale = k.actor('whale');
      const A = cam([-2.4, 1.75, 7.4], [-1.2, 1.35, -0.5], 38);
      const B = cam([1.4, 1.85, 6.9], [0.8, 1.45, -0.5], 37);
      return ({ u, T, bt }) => {
        stalks.forEach((s, i) => {
          // 晚风从左向右依次吹弯竹竿
          const wave = Math.sin(T * 2.5 - s.position.x * 0.28 + i * 0.2);
          s.rotation.z = -0.06 - wave * 0.085;
          s.rotation.x = Math.cos(T * 1.9 + i) * 0.03;
        });
        leaves.forEach((lf, i) => {
          const ph = (T * 0.34 + hash(i * 3)) % 1;
          lf.position.set(
            lerp(-7.5, 8.5, ph),
            4.2 - ph * 2.8 + Math.sin(T * 3.5 + i) * 0.45,
            -1.5 + (hash(i * 5) - 0.5) * 4.8
          );
          lf.material.rotation = T * 2.4 + i;
          setSpriteOp(lf, Math.sin(ph * PI) * 0.82);
        });
        const x = lerp(-2.2, 1.5, u);
        whale.walkBy(x + 2.2).at(x, 0, 0.25).sq(beatBounce(bt, 0.04));
        return glide(A, B, u);
      };
    },
  },

  // ── L02：月光拉长了身影 ──────────────────────────────────────────────────
  {
    id: 'L02',
    title: '月光拉长了身影',
    lyric: '月光拉长了身影',
    cast: ['whale', 'claude'],
    look: 'bamboo',
    note: '一轮硕大银月低悬竹林缺口，清辉铺满白石庭径，把并肩而行的本鲸与小克两道身影长长投在前方地面。',
    build: (k) => {
      k.add(ground(95, 0x2a5459));
      // 月光洒亮的浅白石径，让拉长的身影清晰可见
      const path = k.add(softBox(11.5, 0.08, 5.4, 0xc9d9e6, 0.03), 0, 0.02, 1.2);
      void path;
      addMoon(k.root, 0, 6.2, -28, 4.8, 0xfff5d4);
      // 月光柔光地毯
      const moonBeam = k.add(
        new THREE.Mesh(new THREE.PlaneGeometry(5.6, 14), glow(0xdff0ff, 0.22, true)),
        0,
        0.07,
        0.5
      );
      moonBeam.rotation.x = -PI / 2;
      const bamboos = many(20, (i) => {
        const side = i < 10 ? -1 : 1;
        const idx = i % 10;
        return k.add(
          bambooStalk(6.5 + hash(i) * 2.5, 0x357d68, i),
          side * (4.2 + idx * 0.78),
          0,
          -3.5 - hash(i * 3) * 5
        );
      });
      const whale = k.actor('whale');
      const claude = k.actor('claude').wear('crown');
      const dust = many(18, () => k.add(makeSprite('glow', 0.26, 0xfff6d6, true, 0.5)));
      const A = cam([-0.8, 3.2, 8.8], [0, 1.1, 0.2], 39);
      const B = cam([0.8, 2.85, 8.1], [0, 1.0, 0.5], 37);
      return ({ u, T, bt }) => {
        bamboos.forEach((b, i) => {
          b.rotation.z = Math.sin(T * 1.8 + i) * 0.05;
        });
        const x = lerp(-1.1, 0.9, u);
        const shadowLen = lerp(2.6, 4.1, ease(u));
        whale
          .walkBy(x + 1.1)
          .at(x - 0.85, 0.06, -0.45)
          .moonShadow(-0.18, shadowLen, 0.82)
          .sq(beatBounce(bt, 0.035));
        claude
          .walkBy(x + 1.1)
          .at(x + 0.85, 0.06, -0.45)
          .moonShadow(0.18, shadowLen, 0.82)
          .sq(beatBounce(bt, 0.035));
        dust.forEach((d, i) => {
          d.position.set(
            (hash(i * 3) - 0.5) * 7,
            0.6 + hash(i * 5) * 3.5 + Math.sin(T * 1.8 + i) * 0.25,
            -2 + hash(i * 7) * 5
          );
          setSpriteOp(d, 0.3 + 0.35 * Math.sin(T * 3 + i));
        });
        return glide(A, B, u);
      };
    },
  },

  // ── L03：萤火虫一闪闪 ────────────────────────────────────────────────────
  {
    id: 'L03',
    title: '萤火虫一闪闪',
    lyric: '萤火虫一闪闪',
    cast: ['gemini'],
    look: 'firefly',
    note: '夏夜草坡上点点金绿萤火随八分音符一明一灭，猫娘戴蝴蝶结在左右两簇萤光间好奇张望。',
    build: (k) => {
      k.add(ground(95, 0x264d3b));
      k.add(softHill(8.5, 1.2, 6.2, 0x316347), -4.5, -0.2, -5.5);
      k.add(softHill(9.2, 1.5, 6.8, 0x2b5940), 5.2, -0.2, -6.2);
      many(14, (i) =>
        k.add(
          primrosePlant(0.65, i % 2 ? 0xff9ec4 : 0xffe599, 0.25),
          -5.5 + i * 0.85,
          0,
          -1.2 - hash(i * 3) * 2.5
        )
      );
      const gemini = k.actor('gemini').wear('bow');
      const flies = many(36, (i) => ({
        core: k.add(makeSprite('star', 0.28, 0xeeff88, true, 0.9)),
        halo: k.add(makeSprite('glow', 0.95, i % 3 ? 0xc8ff6e : 0xffe27a, true, 0.5)),
      }));
      const A = cam([-1.2, 1.65, 6.6], [0, 1.15, 0], 37);
      const B = cam([0.9, 1.55, 5.9], [0, 1.18, 0], 35);
      return ({ u, T, bt }) => {
        // 猫娘先左右张望，唱到「一闪闪」时惊喜抬头
        if (u < 0.52) {
          gemini.act('lookaround', T).at(0, 0, 0.2).sq(beatBounce(bt, 0.04));
        } else {
          gemini
            .act('choose', T, T - (u - 0.52) * 2.8)
            .at(0, 0, 0.2)
            .emote('fx_sparkle', T, 0.35, 0.16);
        }
        flies.forEach((fl, i) => {
          const blink = 0.25 + 0.75 * Math.pow(0.5 + 0.5 * Math.sin(T * 7.7 + i * 1.4), 2.2);
          const x = (hash(i * 3) - 0.5) * 9.5 + Math.sin(T * 1.4 + i) * 0.45;
          const y = 0.45 + hash(i * 5) * 3.4 + Math.cos(T * 1.8 + i * 0.7) * 0.32;
          const z = -3.8 + hash(i * 7) * 6.2;
          fl.core.position.set(x, y, z);
          fl.halo.position.set(x, y, z);
          fl.core.scale.setScalar(0.18 + 0.22 * blink + bt.e8Pulse * 0.08);
          fl.halo.scale.setScalar(0.55 + 0.65 * blink);
          setSpriteOp(fl.core, blink);
          setSpriteOp(fl.halo, blink * 0.55);
        });
        return glide(A, B, u);
      };
    },
  },

  // ── L04：满山飞舞的钱币 ──────────────────────────────────────────────────
  {
    id: 'L04',
    title: '满山飞舞的钱币',
    lyric: '满山飞舞的钱币',
    cast: ['gemini', 'zai'],
    look: 'firefly',
    note: '远近层叠的山坡升起漫天金色古币萤光；猫娘选定最亮那枚开心跃起，狐狸在石畔拨算盘认真清点。',
    build: (k) => {
      k.add(ground(110, 0x28523d));
      k.add(softHill(12, 2.6, 8, 0x336648), -6, -0.4, -9);
      k.add(softHill(14, 3.4, 9, 0x2e5e43), 6.5, -0.4, -10.5);
      k.add(softHill(18, 4.5, 10, 0x254f3d), 0, -0.5, -16);
      k.add(roundCyl(0.42, 0.48, 0.36, 0x6a5344, 14), 2.55, 0, 0.35);
      many(16, (i) =>
        k.add(primrosePlant(0.68, i % 2 ? 0xffe485 : 0xff9ec4, 0.3), -6 + i * 0.8, 0, -1.8 - (i % 3) * 1.1)
      );
      const gemini = k.actor('gemini').wear('bow');
      const zai = k.actor('zai');
      const abacus = k.prop('prop_abacus', 1.1);
      // 漫山旋升的柔光萤火铜钱
      const coins = many(46, (i) =>
        k.add(
          makeSprite(
            i % 2 === 0 ? 'coin' : 'glow',
            i % 2 === 0 ? 0.52 : 0.72,
            i % 3 === 0 ? 0xffe478 : 0xd8ff78,
            true,
            0.85
          )
        )
      );
      const A = cam([0, 2.2, 8.8], [0, 1.6, -1.5], 40);
      const B = cam([0.4, 2.75, 9.8], [0, 2.1, -2.5], 42);
      return ({ u, T }) => {
        gemini.act('hop', T).at(-1.35, 0, 0.35).emote('fx_shine', T);
        zai.act('nod', T, Math.floor(T * 1.2) / 1.2).faceLeft(true).at(1.45, 0, 0.25);
        abacus.at(2.55, 0.38, 0.42);
        coins.forEach((c, i) => {
          const ph = (T * 0.26 + hash(i * 3)) % 1;
          const x = (hash(i * 5) - 0.5) * 16 + Math.sin(T * 1.6 + i) * 0.75;
          const y = 0.5 + ph * 6.8;
          const z = -11 + hash(i * 7) * 13.5;
          c.position.set(x, y, z);
          const pulse = 0.65 + 0.35 * Math.sin(T * 6.5 + i);
          c.scale.setScalar((i % 2 === 0 ? 0.48 : 0.68) * pulse);
          setSpriteOp(c, Math.sin(ph * PI) * 0.88);
        });
        return glide(A, B, u);
      };
    },
  },

  // ── L05：天上银河在发光 ──────────────────────────────────────────────────
  {
    id: 'L05',
    title: '天上银河在发光',
    lyric: '天上银河在发光',
    cast: ['kimi', 'gpt'],
    look: 'galaxy',
    note: '山巅镜池倒映着横贯夜空的璀璨银河，Kimi 戴星冠伫立池畔仰望，龙娘从银河高处轻盈振翅掠过。',
    build: (k) => {
      k.add(ground(120, 0x1a1e45));
      backdropHills(k.root, 0x1c2250, 0x262961, 76);
      // 倒映银河的镜面星池
      const pond = k.add(new THREE.Mesh(new THREE.CircleGeometry(9.5, 40), glass(0x5b7ee6, 0.48)), 0, 0.03, -4);
      pond.rotation.x = -PI / 2;
      k.add(roundCyl(1.4, 1.55, 0.22, 0xd8dff5, 22), -1.8, 0, 0.8);
      const mw = milkyWaySky(false);
      k.add(mw.root);
      // 池面星光倒影
      const refl = many(22, (i) =>
        k.add(makeSprite('star', 0.45, i % 2 ? 0xbfe2ff : 0xffc7ef, true, 0.65))
      );
      const kimi = k.actor('kimi').wear('tiara');
      const gpt = k.actor('gpt', 2.2);
      const A = cam([-0.8, 1.65, 7.8], [0.4, 3.6, -12], 42);
      const B = cam([0.4, 1.45, 7.4], [1.2, 5.4, -15], 44);
      return ({ u, T, bt }) => {
        kimi.act('idle', T).at(-1.8, 0.22, 0.8).sq(beatBounce(bt, 0.03));
        const gx = lerp(-14, 15, u);
        gpt.act('hover', T).at(gx, 12.5 + Math.sin(u * PI) * 2.2, -26).noShadow();
        refl.forEach((r, i) => {
          r.position.set((hash(i * 3) - 0.5) * 12, 0.08, -8.5 + hash(i * 5) * 8);
          setSpriteOp(r, 0.35 + 0.45 * Math.sin(T * 4.5 + i));
        });
        return glide(A, B, u);
      };
    },
  },

  // ── L06：地上风铃来歌唱 ──────────────────────────────────────────────────
  {
    id: 'L06',
    title: '地上风铃来歌唱',
    lyric: '地上风铃来歌唱',
    cast: ['qwen'],
    look: 'veranda',
    note: '暖木竹檐下按音阶排开七只彩透琉璃风铃，千问执折扇随拍轻摇，晚风敲出一圈圈金色与晴蓝音波。',
    build: (k) => {
      k.add(ground(90, 0x2c3252));
      // 暖木游廊地板与檐梁
      k.add(softBox(10.5, 0.28, 3.8, 0x9c6644, 0.05), 0, 0.14, 0);
      many(14, (bi) =>
        k.add(bambooStalk(6.5, 0x2d6b66, bi), -7 + bi * 1.08, 0, -3.8 - (bi % 3) * 1.2)
      );
      k.add(roundCyl(0.13, 0.15, 3.7, 0x7c4c32, 12), -4.5, 0.26, 0.8);
      k.add(roundCyl(0.13, 0.15, 3.7, 0x7c4c32, 12), 4.5, 0.26, 0.8);
      k.add(softBox(10.6, 0.22, 0.35, 0x7c4c32, 0.04), 0, 3.88, 0.8);
      // 廊边暖灯
      k.add(makeSprite('glow', 2.6, 0xffcf82, true, 0.55), -4.1, 3.0, 0.9);
      k.add(makeSprite('glow', 2.6, 0xffcf82, true, 0.55), 4.1, 3.0, 0.9);

      const bellCols = [0x9be8ff, 0xffb3d1, 0xa8f5cf, 0xffe494, 0xcab8ff, 0xffb8a8, 0x9be8ff];
      const tagCols = [0xffa6c9, 0xffe08a, 0x9be8ff, 0xffb3d1, 0xa8f5cf, 0xffe08a, 0xffa6c9];
      const chimes = many(7, (i) => {
        const ch = windChime(bellCols[i], tagCols[i]);
        k.add(ch.root, -3.3 + i * 1.1, 3.82, 0.8);
        return ch;
      });
      const rings = many(7, (ri) => {
        const rr = rippleRing(bellCols[ri], false);
        k.add(rr.mesh, -3.3 + ri * 1.1, 2.98, 0.85);
        return rr;
      });
      const qwen = k.actor('qwen');
      const fan = k.prop('prop_fan', 0.95);
      const A = cam([-1.0, 2.0, 6.8], [0, 1.85, 0.3], 38);
      const B = cam([1.0, 2.1, 6.4], [0, 1.95, 0.3], 37);
      return ({ u, T, bt }) => {
        qwen.act('sway', T).at(-0.2, 0.28, -0.15).sq(beatBounce(bt, 0.04));
        fan.at(0.45, 0.95 + Math.sin(T * 3.5) * 0.05, 0.1);
        chimes.forEach((ch, i) => {
          const sw = Math.sin(T * 3.8 + i * 0.72) * 0.26;
          ch.pendulum.rotation.z = sw;
          ch.tag.rotation.y = Math.cos(T * 3.1 + i) * 0.45;
          // 每只风铃依次荡开可见的歌声光环
          const ph = (T * 0.85 + i / 7) % 1;
          rings[i].mesh.scale.setScalar(0.22 + ph * 0.85);
          rings[i].mat.opacity = (1 - ph) * 0.55;
        });
        return glide(A, B, u);
      };
    },
  },

  // ── L07：织女星在远方 ────────────────────────────────────────────────────
  {
    id: 'L07',
    title: '织女星在远方',
    lyric: '织女星在远方',
    cast: ['kimi'],
    look: 'galaxy',
    note: '星崖观星石台延伸向深蓝夜穹，远方织女星与天琴座星图熠熠生辉，Kimi 静立凝思、卷轴轻浮身侧。',
    build: (k) => {
      k.add(ground(110, 0x161b42));
      k.add(softHill(6.5, 1.5, 5.5, 0x262c63), -1.4, -0.3, -0.2);
      k.add(roundCyl(1.65, 1.8, 0.25, 0xe3e8fa, 24), -1.4, 1.05, -0.2);
      const mw = milkyWaySky(true);
      k.add(mw.root);
      // 流星划过远方
      const meteor = k.add(makeSprite('star', 0.9, 0xffffff, true, 0));
      const kimi = k.actor('kimi').wear('tiara');
      const scroll = k.prop('prop_scroll', 0.95);
      const A = cam([-2.2, 2.2, 6.8], [1.4, 4.6, -12], 40);
      const B = cam([-1.4, 2.0, 6.2], [2.4, 5.8, -14], 39);
      return ({ u, T }) => {
        kimi.act('think', T).at(-1.4, 1.3, -0.2).emote('fx_sparkle', T, 0.35, 0.16);
        scroll.at(-0.62, 1.85 + Math.sin(T * 2.6) * 0.08, 0.05);
        mw.vegaGlow.scale.setScalar(4.2 + Math.sin(T * 5.2) * 0.85);
        if (mw.constellationLines) {
          (mw.constellationLines.material as THREE.LineBasicMaterial).opacity =
            0.25 + 0.65 * easeOut(seg(u, 0.15, 0.8));
        }
        const mu = seg(u, 0.35, 0.78);
        meteor.position.set(lerp(-8, 4, mu), lerp(14, 9.5, mu), -26);
        setSpriteOp(meteor, Math.sin(mu * PI) * 0.95);
        return glide(A, B, u);
      };
    },
  },

  // ── L08：古老浪漫的神话 ──────────────────────────────────────────────────
  {
    id: 'L08',
    title: '古老浪漫的神话',
    lyric: '古老浪漫的神话',
    cast: ['kimi', 'whale', 'claude'],
    look: 'galaxy',
    note: '星河化作一座晶莹发光的星桥横跨夜湖，花灯沿桥浮起；Kimi 轻轻颔首，本鲸与小克在湖岸并肩仰望。',
    build: (k) => {
      k.add(ground(120, 0x191f48));
      const lake = k.add(new THREE.Mesh(new THREE.PlaneGeometry(42, 32), glass(0x4b6ad9, 0.5)), 0, 0.03, -8);
      lake.rotation.x = -PI / 2;
      k.add(milkyWaySky(true).root);
      // 发光星河鹊桥
      const starBridge = archedBridge(6.2, 2.2, 1.8);
      k.add(starBridge, 0, 0.3, -6.5);
      const bridgeStars = many(24, (i) => {
        const su = (i / 23) * 2 - 1;
        return k.add(
          makeSprite('star', 0.55, i % 2 ? 0xffe69e : 0xffb8e6, true, 0.85),
          su * 6.2,
          0.5 + (1 - su * su) * 2.2 + 0.45,
          -6.5 + (i % 2 ? 0.85 : -0.85)
        );
      });
      const kimi = k.actor('kimi').wear('tiara');
      const whale = k.actor('whale');
      const claude = k.actor('claude').wear('crown');
      const A = cam([0, 2.3, 8.2], [0, 2.2, -5.5], 40);
      const B = cam([0.6, 2.7, 9.2], [0, 2.6, -6.5], 41);
      return ({ u, T, bt }) => {
        kimi.act('bow', T, T - u * 1.4).at(0, 2.52, -6.5);
        whale.idle(T).at(-1.45, 0.04, 1.1).sq(beatBounce(bt, 0.035));
        claude.idle(T).faceLeft(true).at(1.45, 0.04, 1.1).sq(beatBounce(bt, 0.035));
        bridgeStars.forEach((s, i) => {
          s.scale.setScalar(0.42 + 0.25 * Math.sin(T * 4.5 + i));
          setSpriteOp(s, easeOut(seg(u, i * 0.02, i * 0.02 + 0.35)) * 0.9);
        });
        return glide(A, B, u);
      };
    },
  },

  // ── L09：流水走过 ────────────────────────────────────────────────────────
  {
    id: 'L09',
    title: '流水走过',
    lyric: '流水走过',
    cast: ['whale'],
    look: 'stream',
    note: '晨光清透的溪水绕过圆润鹅卵石潺潺东流，三只载着粉瓣的小纸船顺流漂过，本鲸沿溪岸轻快跟行。',
    build: (k) => {
      k.add(ground(110, 0x7fd492));
      backdropHills(k.root, 0x78c796, 0x75bed4, 74);
      // 清澈春溪
      const stream = k.add(new THREE.Mesh(new THREE.PlaneGeometry(38, 2.8), glass(0x6bd4f5, 0.78)), 0, 0.04, 0.4);
      stream.rotation.x = -PI / 2;
      many(18, (i) =>
        k.add(
          pebble(0.32 + hash(i) * 0.22, i % 2 ? 0xe8e2d8 : 0xc9d6db, 0.42),
          -8 + i * 0.95,
          0.03,
          (i % 2 ? 1.85 : -1.05) + (hash(i * 3) - 0.5) * 0.25
        )
      );
      many(10, (i) => k.add(primrosePlant(0.7, 0xff94be, 0.2), -7 + i * 1.5, 0, -2.0 - hash(i) * 1.2));
      const boats = many(3, (i) => k.add(leafBoat(i === 0 ? 0xfff8ef : 0xffe6f0, 0.95)));
      const ripples = many(6, () => {
        const r = rippleRing(0xffffff, true);
        k.add(r.mesh);
        return r;
      });
      const whale = k.actor('whale');
      return ({ u, T, bt }) => {
        const x = lerp(-2.8, 2.6, u);
        whale.walkBy(x + 2.8).at(x, 0, -1.45).sq(beatBounce(bt, 0.04));
        boats.forEach((b, i) => {
          const bx = x + 0.6 - i * 1.65;
          const bz = 0.45 + Math.sin(T * 2.2 + i * 1.7) * 0.28;
          b.position.set(bx, 0.06 + Math.sin(T * 3.4 + i) * 0.03, bz);
          b.rotation.z = Math.sin(T * 2.8 + i) * 0.06;
        });
        ripples.forEach((r, i) => {
          const ph = (T * 0.7 + i / 6) % 1;
          r.mesh.position.set(x - 2.2 + i * 0.95, 0.06, 0.45 + (i % 2 ? 0.25 : -0.25));
          r.mesh.scale.setScalar(0.15 + ph * 0.55);
          r.mat.opacity = (1 - ph) * 0.48;
        });
        return cam([x + 0.2, 2.05, 6.6], [x + 0.1, 0.85, -0.3], 38);
      };
    },
  },

  // ── L10：就像四季的变换 ──────────────────────────────────────────────────
  {
    id: 'L10',
    title: '就像四季的变换',
    lyric: '就像四季的变换',
    cast: ['qwen', 'whale'],
    look: 'stream',
    note: '镜头沿溪横移掠过春樱粉、夏翠绿、秋枫金、冬初雪四座立体小岛，千问在溪心茶亭从容执礼送迎四时。',
    build: (k) => {
      k.add(ground(120, 0x8ad69c));
      const stream = k.add(new THREE.Mesh(new THREE.PlaneGeometry(46, 2.4), glass(0x72d8f7, 0.75)), 0, 0.04, 1.3);
      stream.rotation.x = -PI / 2;
      const seasons: Array<['spring' | 'summer' | 'autumn' | 'winter', number, number]> = [
        ['spring', -6.3, 0xffd6e6],
        ['summer', -2.1, 0x76de98],
        ['autumn', 2.1, 0xffd280],
        ['winter', 6.3, 0xe6f4ff],
      ];
      const trees = seasons.map(([s, x, groundCol], idx) => {
        k.add(softHill(2.3, 0.45, 2.1, groundCol), x, -0.05, -1.6);
        return k.add(seasonTree(s, 1.05, idx * 7), x, 0.25, -1.8);
      });
      k.add(softHill(3.2, 0.7, 2.4, 0xa2e0a8), 0, -0.1, -4.4);
      k.add(teaPavilion(0.78), 0, 0.55, -4.4);
      const qwen = k.actor('qwen');
      const whale = k.actor('whale');
      const particles = many(28, (i) => {
        const cols = [0xff9ec4, 0x8ef5a8, 0xffbe55, 0xffffff];
        return k.add(makeSprite(i % 4 === 3 ? 'star' : 'petal', 0.32, cols[i % 4], false, 0.85));
      });
      const A = cam([-4.2, 2.5, 8.6], [-3.2, 1.4, -1.2], 40);
      const B = cam([4.2, 2.5, 8.6], [3.2, 1.4, -1.2], 40);
      return ({ u, T }) => {
        trees.forEach((tr, i) => {
          const active = 1 - Math.min(1, Math.abs(u * 3 - i));
          tr.scale.setScalar(0.95 + active * 0.2);
          tr.rotation.y = Math.sin(T * 1.2 + i) * 0.08;
        });
        qwen.act('bow', T, T - u * 1.2).at(0, 0.78, -3.9);
        const wx = lerp(-4.8, 4.5, u);
        whale.walkBy(wx + 4.8).at(wx, 0.02, 0.35);
        particles.forEach((p, i) => {
          const zone = i % 4;
          const zx = seasons[zone][1];
          const ph = (T * 0.4 + hash(i * 3)) % 1;
          p.position.set(
            zx + (hash(i * 5) - 0.5) * 3.2 + Math.sin(T * 2 + i) * 0.3,
            3.6 - ph * 3.1,
            -1.4 + (hash(i * 7) - 0.5) * 2.4
          );
          setSpriteOp(p, Math.sin(ph * PI) * 0.85);
        });
        return glide(A, B, u, false);
      };
    },
  },

  // ── L11：幸福在蔓延 ──────────────────────────────────────────────────────
  {
    id: 'L11',
    title: '幸福在蔓延',
    lyric: '幸福在蔓延',
    cast: ['whale', 'doubao'],
    look: 'spring',
    note: '暖粉春光如水波向四面草地荡开，所到之处一圈圈樱花草次第弹起盛放，本鲸与豆包在花波中心开心轻晃。',
    build: (k) => {
      k.add(ground(110, 0x89d98c));
      backdropHills(k.root, 0x86d194, 0xa8d9e8, 74);
      many(6, (i) => k.add(softCloud(i * 5, 1.6), -18 + i * 7.5, 11 + (i % 2) * 2, -28));
      const waveRing = rippleRing(0xffa8cc, true);
      k.add(waveRing.mesh, 0, 0.05, 0);
      // 三圈共 24 株随波纹向外蔓延绽放的樱花草
      const flowers = many(24, (i) => {
        const ring = Math.floor(i / 8);
        const a = ((i % 8) / 8) * TAU + ring * 0.35;
        const r = 1.9 + ring * 1.45;
        const fl = k.add(
          primrosePlant(0.88, i % 2 ? 0xff85b3 : 0xffb0d0, 0.28),
          Math.cos(a) * r,
          0,
          Math.sin(a) * r * 0.8
        );
        return { fl, r };
      });
      const whale = k.actor('whale');
      const doubao = k.actor('doubao');
      const A = cam([0, 3.1, 8.2], [0, 0.9, 0], 39);
      const B = cam([0.4, 2.5, 7.2], [0, 0.95, 0], 37);
      return ({ u, T, bt }) => {
        const radius = u * 6.4;
        waveRing.mesh.scale.setScalar(Math.max(0.1, radius));
        waveRing.mat.opacity = (1 - u * 0.75) * 0.65;
        flowers.forEach(({ fl, r }, i) => {
          const p = backOut(seg(radius, r - 0.5, r + 0.6), 2.2);
          fl.scale.setScalar(Math.max(0.001, 0.88 * p));
          fl.rotation.z = Math.sin(T * 2.5 + i) * 0.07;
        });
        whale.act('sway', T).at(-0.78, 0, 0.1).sq(beatBounce(bt)).emote('fx_heart', T);
        doubao.act('sway', T).faceLeft(true).at(0.78, 0, 0.1).sq(beatBounce(bt));
        return glide(A, B, u);
      };
    },
  },

  // ── L12：爱你永恒不孤单 ──────────────────────────────────────────────────
  {
    id: 'L12',
    title: '爱你永恒不孤单',
    lyric: '爱你永恒不孤单',
    cast: ['whale', 'claude'],
    look: 'spring',
    fx: { whiteOut: true },
    note: '本鲸与小克从春溪木拱桥两端走向彼此，在桥心相会驻足，一颗柔粉软3D爱心在两人之间盈盈升起。',
    build: (k) => {
      k.add(ground(110, 0x88d98e));
      backdropHills(k.root, 0x8cd699, 0xffd1e2, 74);
      const stream = k.add(new THREE.Mesh(new THREE.PlaneGeometry(8.5, 65), glass(0x78dcf7, 0.72)), 0, 0.03, -4);
      stream.rotation.x = -PI / 2;
      k.add(archedBridge(3.6, 0.72, 1.9), 0, 0.02, 0.2);
      k.add(seasonTree('spring', 1.25, 1), -5.4, 0, -2.5);
      k.add(seasonTree('spring', 1.25, 4), 5.4, 0, -2.5);
      const heart = k.add(plumpHeart(0.55, 0xff7da8, 0.92), 0, 2.2, 0.25);
      const whale = k.actor('whale');
      const claude = k.actor('claude').wear('crown');
      const A = cam([0, 2.2, 8.6], [0, 1.25, 0.2], 38);
      const B = cam([0, 1.9, 6.5], [0, 1.35, 0.2], 36);
      return ({ u, T, bt }) => {
        const meet = ease(seg(u, 0, 0.65));
        const wx = lerp(-2.8, -0.82, meet);
        const cx = lerp(2.8, 0.82, meet);
        const wy = bridgeHeight(wx, 3.6, 0.72) + 0.08;
        const cy = bridgeHeight(cx, 3.6, 0.72) + 0.08;
        if (u < 0.65) {
          whale.walkBy(wx + 2.8).at(wx, wy, 0.2);
          claude.walkBy(2.8 - cx).faceLeft(true).at(cx, cy, 0.2);
        } else {
          whale.idle(T).at(wx, wy, 0.2).sq(beatBounce(bt, 0.045));
          claude.idle(T).faceLeft(true).at(cx, cy, 0.2).sq(beatBounce(bt, 0.045));
        }
        const hp = backOut(seg(u, 0.55, 0.9), 2.3);
        heart.scale.setScalar(Math.max(0.001, 0.55 * hp * (1 + bt.pulse * 0.14)));
        heart.position.y = 2.15 + Math.sin(T * 3.2) * 0.08;
        heart.rotation.y = Math.sin(T * 1.8) * 0.35;
        return glide(A, B, u);
      };
    },
  },

  // ── L13：恋人手中樱花草（副歌一开场！）──────────────────────────────────
  {
    id: 'L13',
    title: '恋人手中樱花草',
    lyric: '恋人手中樱花草',
    cast: ['whale', 'claude'],
    look: 'spring',
    fx: { whiteIn: true },
    note: '副歌阳光洒满樱花草花圃！本鲸把圆木台上盛放的五瓣心形樱花草花盆轻轻推向小克，兑现她「好东西先推出去」的习性。',
    build: (k) => {
      k.add(ground(110, 0x8be08f));
      backdropHills(k.root, 0x95de96, 0xffcadf, 72);
      many(6, (i) => k.add(softCloud(i * 3, 1.8), -20 + i * 8, 12 + (i % 2) * 2, -30));
      // 中央暖木小圆墩与主角信物——五瓣樱花草花盆
      k.add(roundCyl(0.55, 0.62, 0.52, 0xc98e63, 18), 0, 0, 0.45);
      const pot = k.add(primrosePot(1.18), -0.25, 0.52, 0.45);
      many(22, (i) =>
        k.add(
          primrosePlant(0.75 + hash(i) * 0.25, i % 2 ? 0xff8ab5 : 0xffb3d1, 0.25),
          -7.5 + i * 0.72,
          0,
          -1.8 - hash(i * 5) * 4.5
        )
      );
      const petals = many(26, (i) =>
        k.add(makeSprite('petal', 0.3, i % 2 ? 0xff9ec4 : 0xffd1e4, false, 0.9))
      );
      const whale = k.actor('whale');
      const claude = k.actor('claude').wear('crown');
      const A = cam([0, 1.75, 6.2], [0, 1.05, 0.3], 36);
      const B = cam([0.1, 1.58, 5.1], [0, 1.02, 0.35], 34);
      return ({ u, T, bt }) => {
        const pushU = ease(seg(u, 0.18, 0.68));
        // 花盆由本鲸一侧轻轻推向小克一侧（不画假手，干净利落）
        pot.position.x = lerp(-0.22, 0.16, pushU);
        pot.rotation.y = Math.sin(T * 1.2) * 0.22;
        pot.scale.setScalar(1.18 * (1 + bt.pulse * 0.06));

        whale.act('point', T, T - u * 1.4).at(-1.28, 0, 0.3).sq(beatBounce(bt, 0.04));
        if (u < 0.5) {
          claude.idle(T).faceLeft(true).at(1.28, 0, 0.3);
        } else {
          claude
            .act('curtsy', T, T - (u - 0.5) * 1.6)
            .faceLeft(true)
            .at(1.28, 0, 0.3)
            .emote('fx_heart', T, -0.32, 0.15);
        }
        petals.forEach((p, i) => {
          const ph = (T * 0.36 + hash(i * 3)) % 1;
          p.position.set(
            (hash(i * 5) - 0.5) * 9 + Math.sin(T * 2 + i) * 0.4,
            4.2 - ph * 3.8,
            -2.5 + hash(i * 7) * 5.2
          );
          p.material.rotation = T * 1.9 + i;
          setSpriteOp(p, Math.sin(ph * PI) * 0.88);
        });
        return glide(A, B, u);
      };
    },
  },

  // ── L14：春彩漫步的微笑 ──────────────────────────────────────────────────
  {
    id: 'L14',
    title: '春彩漫步的微笑',
    lyric: '春彩漫步的微笑',
    cast: ['whale', 'claude'],
    look: 'spring',
    note: '粉樱、鹅黄、晴蓝、薄荷四色春花夹道盛放，本鲸与小克沿暖白卵石花径并肩轻步，花瓣随笑意起舞。',
    build: (k) => {
      k.add(ground(110, 0x8ee08e));
      backdropHills(k.root, 0x90db95, 0xffd1e3, 74);
      k.add(softBox(24, 0.06, 2.2, 0xfff3de, 0.02), 0, 0.02, 0.2);
      many(7, (i) => k.add(seasonTree('spring', 1.1 + (i % 2) * 0.2, i), -9 + i * 3.1, 0, -3.4));
      const springCols = [0xff85b3, 0xffd966, 0xa8e6ff, 0xffb3cc, 0xc9b3ff];
      const border = many(32, (i) =>
        k.add(
          primrosePlant(0.78, springCols[i % springCols.length], 0.25),
          -8 + (i >> 1) * 1.08,
          0,
          i % 2 ? 1.55 : -1.15
        )
      );
      const petals = many(24, () => k.add(makeSprite('petal', 0.28, 0xffa8cc, false, 0.85)));
      const whale = k.actor('whale');
      const claude = k.actor('claude').wear('crown');
      return ({ u, T, bt }) => {
        const x = lerp(-2.6, 2.6, u);
        whale.walkBy(x + 2.6).at(x - 0.65, 0.04, 0.35).sq(beatBounce(bt, 0.045));
        claude
          .walkBy(x + 2.6)
          .at(x + 0.65, 0.04, 0.1)
          .sq(beatBounce(bt, 0.045))
          .emote('fx_sparkle', T, 0.3, 0.14);
        border.forEach((fl, i) => {
          fl.rotation.z = Math.sin(T * 2.8 + i * 0.5) * 0.08;
        });
        petals.forEach((p, i) => {
          const ph = (T * 0.4 + hash(i * 4)) % 1;
          p.position.set(x - 4.5 + hash(i * 3) * 9, 3.8 - ph * 3.4, -2 + hash(i * 7) * 4.5);
          p.material.rotation = T * 2.2 + i;
        });
        return cam([x + 0.3, 1.78, 6.7], [x, 1.02, 0], 37);
      };
    },
  },

  // ── L15：种下了一朵朵 ────────────────────────────────────────────────────
  {
    id: 'L15',
    title: '种下了一朵朵',
    lyric: '种下了一朵朵',
    cast: ['whale', 'doubao'],
    look: 'spring',
    note: '松软的春泥花畦里，随着每一个八分拍，六株圆润五瓣樱花草依次破土Q弹绽放，本鲸与豆包提花篮欢欣雀跃。',
    build: (k) => {
      k.add(ground(105, 0x8be08f));
      backdropHills(k.root, 0x8cd992, 0xbae4f5, 72);
      // 软3D圆角木围花畦
      k.add(softBox(7.2, 0.26, 1.5, 0x8c5c42, 0.08), 0, 0.13, 0.55);
      k.add(softBox(6.8, 0.12, 1.15, 0x634130, 0.04), 0, 0.26, 0.55);
      const planted = many(6, (i) => ({
        plant: k.add(
          primrosePlant(1.08, i % 2 ? 0xff7eb0 : 0xffa3c7, 0.32),
          -2.5 + i * 1.0,
          0.28,
          0.55
        ),
        spark: k.add(makeSprite('star', 0.65, 0xffe885, true, 0), -2.5 + i * 1.0, 0.85, 0.6),
      }));
      const whale = k.actor('whale');
      const doubao = k.actor('doubao');
      const basket = k.prop('prop_basket', 0.95);
      const A = cam([-0.8, 2.05, 6.6], [0, 0.95, 0.3], 37);
      const B = cam([0.8, 1.9, 6.2], [0, 0.95, 0.3], 36);
      return ({ u, T }) => {
        planted.forEach(({ plant, spark }, i) => {
          const trigger = 0.08 + i * 0.13;
          const p = backOut(seg(u, trigger, trigger + 0.16), 2.5);
          plant.scale.setScalar(Math.max(0.001, 1.08 * p));
          plant.rotation.z = Math.sin(T * 3 + i) * 0.06;
          const sp = seg(u, trigger, trigger + 0.28);
          setSpriteOp(spark, Math.sin(sp * PI) * 0.95);
        });
        whale.act('hop', T).at(-1.55, 0, -0.55).emote('fx_sparkle', T);
        doubao.act('step', T).faceLeft(true).at(1.55, 0, -0.55);
        basket.at(2.3, 0.02, -0.35);
        return glide(A, B, u);
      };
    },
  },

  // ── L16：青春璀璨的年少 ──────────────────────────────────────────────────
  {
    id: 'L16',
    title: '青春璀璨的年少',
    lyric: '青春璀璨的年少',
    cast: ['whale', 'claude', 'gemini', 'doubao', 'qwen'],
    look: 'spring',
    note: '晴空彩虹风车在花丘上迎风飞转，阳光折出璀璨金粉光斑，五位伙伴在山坡上齐齐踩拍欢跳。',
    build: (k) => {
      k.add(ground(115, 0x88de8d));
      k.add(softHill(9.5, 1.15, 5.5, 0x97e695), 0, -0.25, -0.5);
      backdropHills(k.root, 0x8cd99a, 0xffcce0, 75);
      many(6, (i) => k.add(softCloud(i * 9, 1.9), -20 + i * 8, 12 + (i % 2) * 2.5, -30));
      const pCols: Array<[number, number]> = [
        [0xff85b3, 0xffe07d],
        [0x8cd8ff, 0xffb3d1],
        [0x8cf0be, 0xffe07d],
        [0xcab8ff, 0xff9ec4],
        [0xffa885, 0xfff099],
        [0xff85b3, 0x9be8ff],
      ];
      const wheels = many(6, (i) => {
        const pw = pinwheel(pCols[i][0], pCols[i][1], 1.1);
        k.add(pw.root, -5.0 + i * 2.0, 0.55, -1.6);
        return pw.wheel;
      });
      const flares = many(22, (i) =>
        k.add(makeSprite('star', 0.45, i % 2 ? 0xfff099 : 0xffb3d4, true, 0.8))
      );
      const doubao = k.actor('doubao');
      const gemini = k.actor('gemini').wear('bow');
      const whale = k.actor('whale');
      const claude = k.actor('claude').wear('crown');
      const qwen = k.actor('qwen');
      const A = cam([0, 2.35, 8.8], [0, 1.45, -0.3], 39);
      const B = cam([0, 2.05, 7.6], [0, 1.45, -0.3], 37);
      return ({ u, T, bt }) => {
        wheels.forEach((w, i) => {
          w.rotation.z = -T * 5.2 - i * 0.8;
        });
        doubao.act('hop', T).at(-3.1, 0.62, -0.2);
        gemini.act('spin', T).at(-1.55, 0.78, -0.1);
        whale.act('wave', T).at(0, 0.86, 0).sq(beatBounce(bt, 0.06)).emote('fx_shine', T);
        claude.act('sway', T).faceLeft(true).at(1.55, 0.78, -0.1).sq(beatBounce(bt, 0.05));
        qwen.act('sway', T).faceLeft(true).at(3.1, 0.62, -0.2).sq(beatBounce(bt, 0.05));
        flares.forEach((f, i) => {
          f.position.set(
            (hash(i * 3) - 0.5) * 11,
            1.2 + hash(i * 5) * 3.8 + Math.sin(T * 2.5 + i) * 0.25,
            -2.5 + hash(i * 7) * 4.5
          );
          setSpriteOp(f, 0.45 + 0.5 * Math.sin(T * 5.5 + i));
        });
        return glide(A, B, u);
      };
    },
  },

  // ── L17：恋人怀中樱花草 ──────────────────────────────────────────────────
  {
    id: 'L17',
    title: '恋人怀中樱花草',
    lyric: '恋人怀中樱花草',
    cast: ['whale', 'claude'],
    look: 'blush',
    note: '粉霞逆光的樱花树荫下，盛放的樱花草簇拥在两人身前，漫天心形花瓣如怀抱般围绕旋转。',
    build: (k) => {
      k.add(ground(100, 0x99d498));
      k.add(seasonTree('spring', 1.55, 11), -3.2, 0, -2.6);
      k.add(seasonTree('spring', 1.55, 17), 3.2, 0, -2.6);
      k.add(makeSprite('glow', 8.5, 0xffd9b8, true, 0.42), 0, 3.6, -6);
      // 簇拥在两人怀前的丰盛樱花草花束坛
      const bouquet = new THREE.Group();
      k.add(bouquet, 0, 0, 0.65);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * TAU;
        put(
          bouquet,
          primrosePlant(0.95, i % 2 ? 0xff7eb0 : 0xffa8cc, 0.35),
          Math.cos(a) * 0.32,
          0,
          Math.sin(a) * 0.22
        );
      }
      const orbitPetals = many(24, (i) =>
        k.add(makeSprite('petal', 0.3, i % 2 ? 0xff94be : 0xffe0ec, false, 0.9))
      );
      const whale = k.actor('whale');
      const claude = k.actor('claude').wear('crown');
      const A = cam([-0.5, 1.65, 5.8], [0, 1.05, 0.2], 35);
      const B = cam([0.5, 1.55, 5.2], [0, 1.02, 0.25], 34);
      return ({ u, T, bt }) => {
        whale.act('sway', T).at(-0.98, 0, 0.2).sq(beatBounce(bt, 0.04));
        claude.act('idle', T).faceLeft(true).at(0.98, 0, 0.2).sq(beatBounce(bt, 0.04)).emote('fx_heart', T, -0.3, 0.14);
        bouquet.rotation.y = Math.sin(T * 1.2) * 0.15;
        orbitPetals.forEach((p, i) => {
          const a = T * 0.95 + (i / 24) * TAU;
          const r = 1.9 + (i % 3) * 0.55;
          p.position.set(Math.cos(a) * r, 0.5 + ((i / 24 + T * 0.2) % 1) * 2.6, 0.2 + Math.sin(a) * r * 0.65);
          p.material.rotation = a;
        });
        return glide(A, B, u);
      };
    },
  },

  // ── L18：听见胸膛心在跳 ──────────────────────────────────────────────────
  {
    id: 'L18',
    title: '听见胸膛心在跳',
    lyric: '听见胸膛心在跳',
    cast: ['whale', 'claude'],
    look: 'blush',
    note: '紧扣 74 BPM 真实双搏律动，软3D粉红心形与同心声波环在两人之间怦然搏动，像听见彼此胸膛里的心跳。',
    build: (k) => {
      k.add(ground(100, 0xa8c9b5));
      backdropHills(k.root, 0xd9a8c4, 0xc4b3e6, 72);
      const centerHeart = k.add(plumpHeart(0.72, 0xff6b9e, 0.94), 0, 1.38, 0.1);
      const heartGlow = k.add(makeSprite('glow', 2.8, 0xff8fb8, true, 0.55), 0, 1.38, 0.0);
      const pulseRings = many(4, (i) => {
        const r = rippleRing(i % 2 ? 0xff94be : 0xffe0a8, false);
        k.add(r.mesh, 0, 1.35, -0.05);
        return r;
      });
      const miniHearts = many(14, (i) =>
        k.add(makeSprite('heart', 0.28, i % 2 ? 0xff8ab5 : 0xffbfd6, true, 0.75))
      );
      const whale = k.actor('whale');
      const claude = k.actor('claude').wear('crown');
      const A = cam([0, 1.62, 6.0], [0, 1.12, 0], 35);
      const B = cam([0, 1.52, 5.2], [0, 1.15, 0], 34);
      return ({ u, T, bt }) => {
        const hb = bt.lubDub;
        centerHeart.scale.setScalar(0.68 + hb * 0.26);
        centerHeart.rotation.y = Math.sin(T * 1.6) * 0.22;
        heartGlow.scale.setScalar(2.4 + hb * 1.1);
        pulseRings.forEach((r, i) => {
          const ph = (T * (74 / 60) * 0.5 + i / 4) % 1;
          r.mesh.scale.setScalar(0.35 + ph * 2.6);
          r.mat.opacity = (1 - ph) * 0.62;
        });
        miniHearts.forEach((h, i) => {
          const ph = (T * 0.35 + hash(i * 3)) % 1;
          h.position.set((hash(i * 5) - 0.5) * 6.2, 0.4 + ph * 3.4, -1.5 + hash(i * 7) * 3);
          setSpriteOp(h, Math.sin(ph * PI) * 0.72);
        });
        whale.idle(T).at(-1.28, 0, 0.2).sq(hb * 0.05).emote('fx_heart', T);
        claude.idle(T).faceLeft(true).at(1.28, 0, 0.2).sq(hb * 0.05).emote('fx_heart', T, -0.32, 0.14);
        return glide(A, B, u);
      };
    },
  },

  // ── L19：偷偷的在思念 ────────────────────────────────────────────────────
  {
    id: 'L19',
    title: '偷偷的在思念',
    lyric: '偷偷的在思念',
    cast: ['whale', 'claude'],
    look: 'blush',
    note: '木质花格窗廊将画面温柔一分为二：左侧本鲸守着樱花草盆栽悄悄思念，右侧小克捧书驻足，心事隔窗相通。',
    build: (k) => {
      k.add(ground(90, 0x9ec9a2));
      // 柔和花架隔断（两侧心意遥相呼应）
      k.add(softBox(8.6, 0.24, 3.2, 0xf2e2d5, 0.05), 0, 0.12, 0);
      k.add(roundCyl(0.09, 0.1, 3.2, 0xc79575, 10), 0, 0.24, 0.3);
      for (let i = 0; i < 4; i++) {
        k.add(primroseBlossom(0.42, 0xff94be, 0.3), 0, 0.75 + i * 0.65, 0.42);
      }
      // 左侧本鲸的小木几与樱花草盆；右侧小克的书与茶杯
      k.add(roundCyl(0.45, 0.48, 0.55, 0xd49d79, 16), -1.0, 0.24, 0.45);
      k.add(primrosePot(0.75), -1.0, 0.79, 0.45);
      k.add(roundCyl(0.45, 0.48, 0.55, 0xd49d79, 16), 1.0, 0.24, 0.45);
      const cup = k.prop('prop_teacup', 0.85);
      const book = k.prop('prop_book', 0.9);
      const whale = k.actor('whale');
      const claude = k.actor('claude').wear('crown');
      // 飘过花格的思念小星光
      const thoughts = many(10, () => k.add(makeSprite('heart', 0.24, 0xff94be, true, 0.8)));
      const A = cam([0, 1.85, 6.8], [0, 1.15, 0.1], 37);
      const B = cam([0, 1.72, 6.1], [0, 1.15, 0.1], 36);
      return ({ u, T }) => {
        whale.act('nod', T, T - u * 1.1).at(-2.15, 0.24, 0.1).emote('fx_heart', T);
        claude.act('read', T).faceLeft(true).at(2.15, 0.24, 0.1).emote('fx_sparkle', T, -0.32, 0.14);
        cup.at(1.0, 0.8, 0.48);
        book.at(1.58, 0.72, 0.32);
        thoughts.forEach((th, i) => {
          const ph = (T * 0.38 + i / 10) % 1;
          th.position.set(lerp(-1.6, 1.6, ph), 1.45 + Math.sin(ph * PI) * 0.85, 0.5);
          setSpriteOp(th, Math.sin(ph * PI) * 0.8);
        });
        return glide(A, B, u);
      };
    },
  },

  // ── L20：那是我们相爱的记号 ──────────────────────────────────────────────
  {
    id: 'L20',
    title: '那是我们相爱的记号',
    lyric: '那是我们相爱的记号',
    cast: ['whale', 'claude'],
    look: 'blush',
    note: '花园圆桌上的花语绘本敞开，两朵五瓣樱花草化作发光的金粉印记落在书页正中，漫天花雨见证相爱的记号。',
    build: (k) => {
      k.add(ground(110, 0x92db98));
      backdropHills(k.root, 0xa8d9a8, 0xffc7de, 74);
      const book = herbariumBook();
      book.cover.rotation.z = PI * 0.96;
      book.root.scale.setScalar(0.58);
      k.add(book.root, 0, 0.45, 0.4);
      k.add(roundCyl(1.5, 1.65, 0.45, 0xf2e4d8, 24), 0, 0, 0.4);
      // 发光记号光环与双生樱花草
      const sealRing = k.add(
        new THREE.Mesh(new THREE.RingGeometry(0.85, 0.96, 36), glow(0xffdf85, 0.85, true)),
        0,
        0.74,
        0.4
      );
      sealRing.rotation.x = -PI / 2;
      const twinA = k.add(primroseBlossom(0.75, 0xff7eb0, 0.5), -0.32, 0.76, 0.4);
      const twinB = k.add(primroseBlossom(0.75, 0xffa8cc, 0.5), 0.32, 0.76, 0.4);
      const petals = many(34, (i) =>
        k.add(makeSprite(i % 3 ? 'petal' : 'star', 0.32, i % 2 ? 0xff94be : 0xffe494, true, 0.85))
      );
      const whale = k.actor('whale');
      const claude = k.actor('claude').wear('crown');
      const A = cam([0, 2.25, 6.8], [0, 1.05, 0.2], 37);
      const B = cam([0, 2.95, 7.6], [0, 1.15, 0.2], 38);
      return ({ u, T, bt }) => {
        (book.pageGlow.material as THREE.MeshBasicMaterial).opacity = 0.45 + 0.35 * ease(u);
        const sp = backOut(seg(u, 0.15, 0.65), 2.2);
        sealRing.scale.setScalar(Math.max(0.01, sp * (1 + bt.pulse * 0.08)));
        twinA.rotation.y = T * 0.7;
        twinB.rotation.y = -T * 0.7;
        whale.act('wave', T).at(-1.85, 0, 0.15).sq(beatBounce(bt, 0.045)).emote('fx_heart', T);
        claude.act('curtsy', T, T - u * 1.2).faceLeft(true).at(1.85, 0, 0.15).emote('fx_heart', T, -0.3, 0.14);
        petals.forEach((p, i) => {
          const ph = (T * 0.35 + hash(i * 3)) % 1;
          const a = i * 0.8 + T * 0.65;
          const r = 0.8 + ph * 3.8;
          p.position.set(Math.cos(a) * r, 0.7 + ph * 3.8, 0.3 + Math.sin(a) * r * 0.7);
          setSpriteOp(p, Math.sin(ph * PI) * 0.88);
        });
        return glide(A, B, u);
      };
    },
  },
];
