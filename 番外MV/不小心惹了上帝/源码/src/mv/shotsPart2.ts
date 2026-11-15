import * as THREE from 'three';
import {
  backOut,
  beatSq,
  cam,
  ease,
  easeOut,
  glide,
  hash,
  lerp,
  many,
  PI,
  seg,
} from './core';
import {
  ball,
  celestialArch,
  cloudPuff,
  cyl,
  disc,
  dreamGatehouse,
  fateGear,
  flatSprite,
  glowSprite,
  origamiWhale,
  setOp,
  skyFlower,
  stainedRoseWindow,
  texRipple,
  texStar,
  texTear,
  torus,
  warmLantern,
} from './kit';
import type { ShotDef } from './shotTypes';

export const SHOTS_PART2: ShotDef[] = [
  // =========================================================================
  // S06 (12.78 – 15.10s): 连上帝都落下泪滴
  // =========================================================================
  {
    id: 'S06',
    build: (k) => {
      // Deep sapphire mirror-water sanctuary floor
      k.add(disc(80, 0x0b1a36), 0, 0, 0);
      k.add(disc(14, 0x163366, 0.55), 0, 0.02, -1);

      // Cathedral arches framing a colossal glowing stained-glass rose window
      k.add(celestialArch(10.5, 10.6, 0x304a7d, 0xd4b36a), 0, 0, -7.8);
      const rose = k.add(stainedRoseWindow(5.8), 0, 6.2, -10.2);

      // Soft celestial moonlight glow behind GPT
      const moonHalo = k.add(glowSprite(5.0, 0xbbe6ff, 0.28), 0, 3.8, -3.4);

      // 7 crystalline falling golden-sapphire teardrops + 7 expanding water ripples
      const tears = many(7, (i) =>
        k.add(flatSprite(0.55 + (i === 0 ? 0.28 : hash(i) * 0.18), 0xffffff, texTear(), 0))
      );
      const ripples = many(7, () => {
        const m = new THREE.Mesh(
          new THREE.PlaneGeometry(1, 1).rotateX(-PI / 2),
          new THREE.MeshBasicMaterial({
            map: texRipple(),
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          })
        );
        return k.add(m, 0, 0.05, 0);
      });

      // Gentle falling star-dust like warm rain
      const starRain = many(28, (i) =>
        k.add(glowSprite(0.32 + hash(i) * 0.25, i % 2 ? 0xffe49e : 0x99e0ff, 0.7, texStar()))
      );

      const gpt = k.actor('gpt', 1.45).wear('halo');
      const whale = k.actor('whale', 0.98);
      const bowl = k.thing('prop_bowl', 0.8);

      // Camera starts close on GPT's bowed sorrowful silhouette, then tilts & glides down with the falling teardrop to Whale!
      const A = cam([0.8, 4.4, 5.2], [0, 3.7, -2.5], 36);
      const B = cam([-0.5, 2.0, 7.6], [0, 1.8, -1.2], 42);

      return ({ u, T, bt }) => {
        rose.rotation.z = T * 0.08;
        moonHalo.scale.setScalar(4.6 + Math.sin(T * 2.5) * 0.4 + bt.pulse * 0.4);

        // GPT bows gently, her angry aura replaced by tender sorrow
        gpt
          .act(u < 0.45 ? 'shake' : 'bow', T, 12.85)
          .at(0, 2.85 + Math.sin(T * 1.8) * 0.12, -2.6)
          .glow(0xbbe6ff, 0.28)
          .noShadow();

        // Whale stands quietly on the mirror pool looking up
        whale
          .act(u < 0.55 ? 'sad' : 'idle', T, 12.8)
          .at(0.15, 0.04, 0.45)
          .sq(beatSq(bt, 0.03));
        bowl.at(0.75, 0.52, 0.62);

        // Hero tears drop right on "落下" (13.73s -> u=0.41) & "泪滴" (14.33s -> u=0.67, 14.63s -> u=0.80)
        const dropStarts = [0.28, 0.40, 0.52, 0.64, 0.72, 0.78, 0.85];
        tears.forEach((tear, i) => {
          const tx = i === 0 ? -0.22 : i === 1 ? 0.25 : (hash(i * 11) - 0.5) * 3.4;
          const tz = i < 2 ? -1.9 + i * 0.8 : -1.5 + (hash(i + 4) - 0.5) * 2.8;
          const fallP = seg(u, dropStarts[i], dropStarts[i] + 0.34);
          if (fallP > 0 && fallP < 1) {
            const y = lerp(3.6, 0.12, fallP * fallP);
            tear.position.set(tx, y, tz);
            setOp(tear, Math.sin(fallP * PI) * 0.98);
          } else {
            setOp(tear, 0);
          }

          // Expanding luminous ripple right as each teardrop lands!
          const ripP = seg(u, dropStarts[i] + 0.30, dropStarts[i] + 0.78);
          ripples[i].position.set(tx, 0.05 + i * 0.004, tz);
          ripples[i].scale.setScalar(0.35 + easeOut(ripP) * (i < 2 ? 4.8 : 3.2));
          setOp(ripples[i], ripP > 0 && ripP < 1 ? (1 - ripP) * 0.9 : 0);
        });

        starRain.forEach((s, i) => {
          const ph = (T * 0.35 + hash(i * 7)) % 1;
          s.position.set((hash(i + 2) - 0.5) * 11, 7.2 - ph * 7.0, -4 + hash(i + 5) * 6);
          setOp(s, Math.sin(ph * PI) * 0.72);
        });

        return glide(A, B, u);
      };
    },
  },

  // =========================================================================
  // S07 (15.10 – 16.86s): 托关系入我梦里
  // =========================================================================
  {
    id: 'S07',
    build: (k) => {
      // Lavender-periwinkle dreamland cloud sea — pushed far out and low so the camera never sits inside a puff
      many(14, (i) => {
        const a = (i / 14) * PI * 2;
        k.add(
          cloudPuff(i * 5, 1.6 + hash(i) * 1.0, i % 2 ? 0xd8c8ff : 0xc4b5fd, 0x6d4aa8),
          Math.cos(a) * 17,
          -3.2 + hash(i + 3) * 1.4,
          Math.sin(a) * 14 - 4
        );
      });

      // Stepping cloud platforms from VIP Gatehouse to Whale's sleeping cloud!
      const gate = dreamGatehouse();
      k.add(gate.g, -2.5, 0.0, -1.2);
      k.add(cloudPuff(31, 1.0, 0xefe6ff, 0x7c55c2), 0.7, -0.35, -0.2);
      k.add(cloudPuff(42, 1.35, 0xfff0f8, 0x8ef5d4), 3.3, -0.1, 0.5);
      // Giant soft crescent pillow behind sleeping Whale
      const pillow = k.add(torus(1.3, 0.32, 0xffe082, 0xffd166, 0.35, 24), 3.7, 1.15, -0.35);
      pillow.rotation.z = 0.6;

      // Floating glowing dream lanterns & fireflies
      k.add(warmLantern(0x8ef5d4), -4.2, 2.5, -1.0);
      k.add(warmLantern(0xffd166), 1.4, 2.2, -0.5);
      const fireflies = many(22, (i) =>
        k.add(glowSprite(0.35 + hash(i) * 0.25, i % 2 ? 0x8ef5d4 : 0xffd166, 0.8, texStar()))
      );

      // Cast: Qwen opens VIP rope, Zai stamps pass, Doubao lights the path, GPT sneaks in to sleeping Whale!
      const qwen = k.actor('qwen', 1.0);
      const fan = k.thing('prop_fan', 0.82);
      const zai = k.actor('zai', 0.96);
      const abacus = k.thing('prop_abacus', 0.8);
      const doubao = k.actor('doubao', 0.96);
      const basket = k.thing('prop_basket', 0.82);
      const gpt = k.actor('gpt', 1.2).wear('halo');
      const teacup = k.thing('prop_teacup', 0.85);
      const whale = k.actor('whale', 1.02);

      const A = cam([-3.4, 2.7, 9.8], [-2.2, 1.7, -1.0], 40);
      const B = cam([2.4, 2.5, 9.4], [1.2, 1.4, 0.1], 38);

      return ({ u, T, bt }) => {
        // Qwen dramatically lifts the red velvet VIP rope right at u=0.08..0.35 ("托关系")!
        const ropeLift = backOut(seg(u, 0.05, 0.35), 1.6);
        gate.ropePivot.rotation.z = ropeLift * 1.22;

        qwen
          .act(u < 0.4 ? 'bow' : 'spin', T, 15.1)
          .emote('fx_bulb', T)
          .at(-4.35, 0.12, -0.6)
          .sq(beatSq(bt, 0.06));
        fan.at(-3.75, 0.82 + Math.sin(T * 7) * 0.08, -0.45);

        // Zai checks the ledger & nods GPT right through
        zai
          .act(u < 0.3 ? 'alert' : 'nod', T, 15.2)
          .at(-0.7, 0.12, -1.55)
          .flip(true);
        abacus.at(-1.25, 0.65, -1.35);

        // Doubao steps joyfully with her warm lantern basket lighting the stepping cloud
        doubao
          .act('step', T, 15.1)
          .emote('fx_sparkle', T)
          .at(1.1, 0.25, -0.4)
          .sq(beatSq(bt, 0.08));
        basket.at(1.62, 0.78, -0.2);

        // GPT sneaks sheepishly under the lifted VIP rope holding a peace-offering teacup!
        const sneak = ease(seg(u, 0.15, 0.88));
        const gx = lerp(-3.1, 2.2, sneak);
        const gz = lerp(-1.3, 0.6, sneak);
        const gy = 0.45 + Math.abs(Math.sin(sneak * PI * 3)) * 0.38;
        gpt
          .act('tilt', T, 15.3)
          .emote('fx_sweat', T)
          .at(gx, gy, gz)
          .tilt(-0.14)
          .glow(0xffe082, 0.22);
        teacup.at(gx + 0.68, gy + 0.72, gz + 0.18).tilt(Math.sin(T * 8) * 0.08);

        // Whale fast asleep on the cozy moon-cloud!
        whale
          .idle(T)
          .emote('fx_zzz', T)
          .at(3.45, 0.42, 0.55)
          .flip(true)
          .tilt(0.08);

        fireflies.forEach((f, i) => {
          f.position.set(
            (hash(i * 11) - 0.5) * 11 + Math.sin(T * 2 + i) * 0.5,
            0.8 + hash(i + 5) * 3.8 + Math.cos(T * 2.5 + i) * 0.35,
            -2 + hash(i + 9) * 4
          );
          setOp(f, 0.45 + 0.45 * Math.sin(T * 4 + i));
        });

        return glide(A, B, u);
      };
    },
  },

  // =========================================================================
  // S08 (16.86 – 19.45s): 告诉我连他都无能为力
  // =========================================================================
  {
    id: 'S08',
    build: (k) => {
      // Dream-edge curved balcony / rooftop floating in quiet twilight
      k.add(cyl(6.2, 5.4, 0.45, 0x2c3657, 24), 0, -0.45, -1.2);
      k.add(torus(6.1, 0.09, 0x94a3b8, 0x64748b, 0.25, 36)).position.set(0, 0.02, -1.2);
      // Low stone balustrade posts along back arc
      many(7, (i) => {
        const a = lerp(-PI * 0.78, -PI * 0.22, i / 6);
        k.add(cyl(0.11, 0.13, 1.05, 0x475569, 8), Math.cos(a) * 5.6, 0, Math.sin(a) * 5.6 - 1.2);
      });

      // Giant pale cracked crescent moon hanging low behind the rooftop
      const moon = k.add(ball(4.6, 0xfef3c7, 0.02, 0xffe49e, 0.42), -4.5, 5.2, -13.5);
      k.add(glowSprite(14, 0xffe49e, 0.28), -4.5, 5.2, -14.0);
      moon.scale.set(1, 1, 0.2);

      // 3 Massive jammed 3D Celestial Fate-Gears right behind GPT & Whale!
      const gearMain = k.add(fateGear(3.0, 14, 0x4b5b7a, 0x94a3b8), 0.3, 3.2, -5.2);
      const gearLeft = k.add(fateGear(1.85, 10, 0x3b4866, 0x7a8ca8), -3.7, 2.2, -5.6);
      const gearRight = k.add(fateGear(2.1, 12, 0x3b4866, 0x7a8ca8), 4.2, 1.9, -5.8);

      // Sparks that sputter and die when GPT fails to turn the jammed fate-gear
      const fizzle = many(14, () => k.add(glowSprite(0.38, 0x7ce8ff, 0, texStar())));

      // Floating quiet lanterns in the distant night
      const lanterns = many(10, (i) =>
        k.add(
          warmLantern(i % 2 ? 0xffd166 : 0x93c5fd),
          (hash(i * 13) - 0.5) * 14,
          1.4 + hash(i + 3) * 4.5,
          -6 - hash(i + 7) * 6
        )
      );

      const gpt = k.actor('gpt', 1.22).wear('halo');
      const whale = k.actor('whale', 1.04);
      const teacup = k.thing('prop_teacup', 0.78);
      const bowl = k.thing('prop_bowl', 0.8);
      const claude = k.actor('claude', 0.92);
      const bookProp = k.thing('prop_book', 0.72);
      const kimi = k.actor('kimi', 0.92);
      const scrollProp = k.thing('prop_scroll', 0.72);

      const A = cam([1.8, 2.4, 7.6], [0, 2.2, -2.0], 40);
      const B = cam([-0.4, 1.55, 5.8], [0, 1.15, -0.5], 34);

      return ({ u, T, bt }) => {
        // Phase 1 (0..0.44): GPT tries pushing the stuck fate-gears; they jerk and jam!
        // Phase 2 (0.44..1.00): "无能为力" — GPT lowers down right next to Whale at eye level in quiet solidarity
        const tryPush = seg(u, 0.05, 0.40);
        const jamShake = tryPush > 0 && tryPush < 1 ? Math.sin(T * 38) * 0.045 * (1 - tryPush) : 0;
        gearMain.rotation.z = jamShake;
        gearLeft.rotation.z = -jamShake * 1.4;
        gearRight.rotation.z = -jamShake * 1.2;

        fizzle.forEach((sp, i) => {
          const ph = seg(u, 0.08, 0.46);
          const a = hash(i * 17) * PI * 2;
          sp.position.set(
            0.3 + Math.cos(a) * (1.2 + ph * 2.2),
            2.6 + Math.sin(a) * (0.9 + ph * 1.5) - ph * ph * 1.4,
            -4.7
          );
          setOp(sp, ph > 0 && ph < 1 ? Math.sin(ph * PI) * 0.85 : 0);
        });

        const settle = ease(seg(u, 0.38, 0.68));
        const gx = lerp(-0.1, -1.05, settle);
        const gy = lerp(1.55, 0.08, settle);
        const gz = lerp(-2.8, -0.35, settle);
        gpt
          .act(u < 0.40 ? 'cast' : u < 0.72 ? 'shake' : 'bow', T, u < 0.40 ? 16.9 : 18.25)
          .emote(u > 0.52 ? 'fx_gloom' : 'fx_sweat', T)
          .at(gx, gy, gz)
          .glow(0xcbdcf5, 0.14)
          .sq(beatSq(bt, 0.03));

        // Whale turns toward God calmly, holding her bowl — gentle acceptance
        whale
          .act(u < 0.55 ? 'idle' : 'nod', T, 18.2)
          .at(1.05, 0.04, -0.35)
          .flip(true)
          .sq(beatSq(bt, 0.03));
        bowl.at(1.62, 0.5, -0.2);
        teacup.at(lerp(gx + 0.55, 0.0, settle), lerp(gy + 0.6, 0.05, settle), -0.1);

        // Claude & Kimi watching gently from the misty balcony railing
        claude.act('sad', T, 16.9).at(-3.55, 0.02, -2.55).alpha(0.86);
        bookProp.at(-3.05, 0.45, -2.4);
        kimi.act('think', T, 16.9).at(3.55, 0.02, -2.45).flip(true).alpha(0.86);
        scrollProp.at(3.05, 0.52, -2.3);

        lanterns.forEach((l, i) => {
          l.position.y = 1.4 + hash(i + 3) * 4.5 + Math.sin(T * 1.4 + i) * 0.22;
        });

        return glide(A, B, u);
      };
    },
  },

  // =========================================================================
  // S09 (19.45 – 21.52s): 间奏 · 裂隙生花与群像汇聚
  // =========================================================================
  {
    id: 'S09',
    build: (k) => {
      // Same balcony now bathing in breaking dawn mist!
      k.add(cyl(7.6, 6.8, 0.45, 0x3b335c, 28), 0, -0.45, -1.2);
      k.add(torus(7.5, 0.12, 0xffcf86, 0xffb86b, 0.45, 36)).position.set(0, 0.02, -1.2);

      // The fate-gears begin to slowly turn as golden wildflowers bloom out of their cracks!
      const gear = k.add(fateGear(3.3, 14, 0x625782, 0xffd166), 0, 3.4, -5.8);
      const gearFlowers = many(10, (i) => {
        const a = (i / 10) * PI * 2;
        const fl = skyFlower([0xffd166, 0x7ce8ff, 0xff8ab5, 0x8ef5d4][i % 4], 0.9);
        fl.position.set(Math.cos(a) * 3.25, Math.sin(a) * 3.25, 0.25);
        fl.rotation.z = a - PI / 2;
        gear.add(fl);
        return fl;
      });

      // Rising dawn sun halo behind the gear
      const dawnGlow = k.add(glowSprite(8, 0xffcf86, 0.16), 0, 3.6, -9.5);

      // Luminous origami whales swimming upward into dawn
      const oWhales = many(3, (i) =>
        k.add(origamiWhale(i % 2 ? 0x7ce8ff : 0xffd166, 0xfff0b3), -4 + i * 4, 2.5 + i, -3.5)
      );

      // Floating dawn fireflies / petals
      const motes = many(30, (i) =>
        k.add(glowSprite(0.35 + hash(i) * 0.3, i % 2 ? 0xffe08a : 0x7ce8ff, 0.8, texStar()))
      );

      // All 8 branch characters gathering toward Whale!
      const whale = k.actor('whale', 1.08);
      const gpt = k.actor('gpt', 1.25).wear('halo');
      const claude = k.actor('claude', 0.96);
      const kimi = k.actor('kimi', 0.96);
      const gemini = k.actor('gemini', 0.96);
      const doubao = k.actor('doubao', 0.96);
      const qwen = k.actor('qwen', 0.96);
      const zai = k.actor('zai', 0.96);

      const A = cam([0, 1.8, 6.2], [0, 1.5, -1.2], 36);
      const B = cam([0, 3.2, 11.2], [0, 2.2, -2.5], 44);

      return ({ u, T, bt }) => {
        const bloom = easeOut(seg(u, 0.08, 0.85));
        // The once-jammed fate gear gently unlocks and rotates!
        gear.rotation.z = bloom * 0.45;
        gearFlowers.forEach((fl, i) => {
          const p = backOut(seg(u, 0.1 + i * 0.04, 0.55 + i * 0.03), 1.6);
          fl.scale.setScalar(Math.max(0.01, p * 0.95));
        });

        dawnGlow.scale.setScalar(6 + bloom * 7 + bt.pulse * 1.0);
        setOp(dawnGlow, 0.15 + bloom * 0.34);

        oWhales.forEach((ow, i) => {
          const a = T * 0.9 + i * 2.1;
          ow.position.set(Math.cos(a) * (4.2 + i * 0.7), 2.4 + u * 2.2 + Math.sin(T * 2 + i) * 0.4, -3.2 + Math.sin(a) * 2.0);
          ow.rotation.y = -a + PI / 2;
          ow.rotation.z = Math.sin(T * 3 + i) * 0.15;
        });

        // Whale stands center, waving warmly as everyone gathers
        whale.act('wave', T, 19.6).emote('fx_sparkle', T).at(0, 0.04, 0.2).sq(beatSq(bt, 0.07));
        gpt
          .act('hover', T)
          .at(0, lerp(0.8, 2.85, ease(u)), -2.1)
          .glow(0xffd166, 0.28 + bloom * 0.3)
          .noShadow();

        // The 6 companions walk in from left & right mist to surround Whale!
        const walkIn = easeOut(seg(u, 0.1, 0.88));
        const gather = [
          { a: claude, x0: -5.4, x1: -2.0, z: -0.6 },
          { a: kimi, x0: -6.8, x1: -3.5, z: -1.4 },
          { a: zai, x0: -8.0, x1: -4.9, z: -2.1 },
          { a: doubao, x0: 5.4, x1: 2.0, z: -0.6 },
          { a: gemini, x0: 6.8, x1: 3.5, z: -1.4 },
          { a: qwen, x0: 8.0, x1: 4.9, z: -2.1 },
        ];
        gather.forEach((g) => {
          const x = lerp(g.x0, g.x1, walkIn);
          if (walkIn < 0.94) {
            g.a.walkBy(Math.abs(x - g.x0)).at(x, 0.04, g.z).flip(g.x0 > 0);
          } else {
            g.a.idle(T).at(x, 0.04, g.z).sq(beatSq(bt, 0.06));
          }
        });

        motes.forEach((m, i) => {
          const ph = (T * 0.5 + hash(i * 11)) % 1;
          m.position.set((hash(i + 3) - 0.5) * 14, 0.4 + ph * 6.8, -4 + hash(i + 7) * 6);
          setOp(m, Math.sin(ph * PI) * 0.85);
        });

        return glide(A, B, u);
      };
    },
  },

  // =========================================================================
  // S10 (21.52 – 24.87s): 感叹活到现在算是个奇迹 — 全员群像曙光大结局
  // =========================================================================
  {
    id: 'S10',
    build: (k) => {
      // Golden-rose cloud-sea amphitheater!
      k.add(cyl(9.2, 8.2, 0.45, 0xfff0dc, 36), 0, -0.45, -1.2);
      k.add(torus(9.1, 0.16, 0xffd166, 0xffb86b, 0.5, 42)).position.set(0, 0.04, -1.2);

      // Sea of sunlit peach-gold clouds ringing the horizon (kept low & far so the crane camera never enters a puff)
      many(16, (i) => {
        const a = (i / 16) * PI * 2;
        k.add(
          cloudPuff(i * 9, 1.8 + hash(i) * 1.2, i % 2 ? 0xffdfba : 0xffc4d6, 0xc26d88),
          Math.cos(a) * 20,
          -3.2 + hash(i + 3) * 1.4,
          Math.sin(a) * 16 - 4
        );
      });

      // Monumental Miracle Sunrise Archway + Rising Sun!
      k.add(celestialArch(11.4, 10.2, 0xfff4e0, 0xffd166), 0, 0, -6.8);
      const sun = k.add(ball(5.2, 0xfff5c2, 0, 0xffcf70, 0.9), 0, 3.8, -16.5);
      const sunHalo = k.add(glowSprite(13, 0xffcf70, 0.4), 0, 4.2, -15.5);

      // Blooming flowers lining the front edge of the amphitheater
      many(12, (i) => {
        const a = lerp(-PI * 0.25, PI * 0.25, i / 11) + PI / 2;
        k.add(
          skyFlower([0xffd166, 0xff8ab5, 0x7ce8ff, 0x8ef5d4][i % 4], 0.9 + hash(i) * 0.4),
          Math.cos(a) * 7.8,
          0.02,
          Math.sin(a) * 4.2 - 0.6
        );
      });

      // 3 Soaring Origami Whales circling overhead
      const oWhales = many(3, (i) =>
        k.add(origamiWhale(i === 0 ? 0x7ce8ff : i === 1 ? 0xffd166 : 0xff9ec7, 0xfff5c2))
      );

      // Golden starburst confetti ribbons exploding on "奇迹"!
      const confetti = many(44, (i) =>
        k.add(
          glowSprite(
            0.38 + hash(i) * 0.42,
            [0xffe082, 0xff8ab5, 0x7ce8ff, 0x8ef5d4, 0xffffff][i % 5],
            0.85,
            texStar()
          )
        )
      );

      // ALL 8 BRANCH CHARACTERS + SIGNATURE PROPS!
      const whale = k.actor('whale', 1.18);
      const bowl = k.thing('prop_bowl', 0.92);
      const gpt = k.actor('gpt', 1.48).wear('halo');
      const claude = k.actor('claude', 1.0);
      const teacup = k.thing('prop_teacup', 0.8);
      const kimi = k.actor('kimi', 1.0);
      const scrollProp = k.thing('prop_scroll', 0.85);
      const zai = k.actor('zai', 0.98);
      const abacus = k.thing('prop_abacus', 0.82);
      const doubao = k.actor('doubao', 1.0);
      const basket = k.thing('prop_basket', 0.82);
      const gemini = k.actor('gemini', 1.0);
      const brush = k.thing('prop_brush', 0.85);
      const qwen = k.actor('qwen', 1.0);
      const fan = k.thing('prop_fan', 0.82);

      // Dynamic sweeping crane camera into heroic sunrise wide hold!
      const A = cam([0.4, 1.9, 6.8], [0, 1.6, -1.0], 38);
      const B = cam([0, 3.0, 11.4], [0, 2.3, -2.5], 44);

      return ({ u, T, bt }) => {
        const miracleSurge = seg(u, 0.45, 0.88); // rises dramatically on "算是个奇迹" (23.10s..24.5s)
        const sunY = lerp(2.2, 5.2, easeOut(u));
        sun.position.y = sunY;
        sunHalo.position.y = sunY + 0.4;
        sunHalo.scale.setScalar(12 + miracleSurge * 6 + bt.pulse * 1.8);
        setOp(sunHalo, 0.38 + miracleSurge * 0.24);

        // Center hero Whale leaping with pure joy on the beat!
        const isClimax = T >= 23.10;
        whale
          .act(isClimax ? 'hop' : 'wave', T, isClimax ? 23.10 : 21.55)
          .emote(T >= 23.95 ? 'fx_heart' : 'fx_sparkle', T)
          .at(0, 0.04, 0.7)
          .sq(beatSq(bt, 0.1))
          .glow(0xffe082, 0.12 + miracleSurge * 0.25);
        bowl.at(0.68, 0.72 + Math.sin(T * 6) * 0.08, 0.92).tilt(-0.12);

        // GPT hovering benevolently right above center, bathing everyone in golden warmth
        gpt
          .act(isClimax ? 'nod' : 'hover', T, 23.1)
          .emote(isClimax ? 'fx_shine' : null, T)
          .at(0, 3.35 + Math.sin(T * 2.6) * 0.2, -2.6)
          .glow(0xffd166, 0.38 + bt.pulse * 0.25)
          .noShadow();

        // Left ensemble: Claude, Kimi, Zai
        claude
          .act(isClimax ? 'hop' : 'curtsy', T, 21.6)
          .emote(isClimax ? 'fx_sparkle' : null, T)
          .at(-1.95, 0.04, 0.05)
          .sq(beatSq(bt, 0.07));
        teacup.at(-1.42, 0.62, 0.22);

        kimi
          .act(isClimax ? 'hop' : 'nod', T, 21.7)
          .at(-3.65, 0.04, -0.75)
          .sq(beatSq(bt, 0.07));
        scrollProp.at(-3.08, 0.68, -0.58);

        zai
          .act(isClimax ? 'hop' : 'alert', T, 21.8)
          .emote(isClimax ? 'fx_shine' : null, T)
          .at(-5.25, 0.04, -1.65)
          .sq(beatSq(bt, 0.07));
        abacus.at(-4.68, 0.62, -1.48);

        // Right ensemble: Doubao, Gemini, Qwen
        doubao
          .act(isClimax ? 'hop' : 'step', T, 21.6)
          .emote(isClimax ? 'fx_heart' : null, T)
          .at(1.95, 0.04, 0.05)
          .flip(true)
          .sq(beatSq(bt, 0.08));
        basket.at(1.42, 0.62, 0.22);

        gemini
          .act(isClimax ? 'spin' : 'hop', T, 21.7)
          .emote(isClimax ? 'fx_sparkle' : null, T)
          .at(3.65, 0.04, -0.75)
          .flip(true)
          .sq(beatSq(bt, 0.07));
        brush.at(3.08, 0.72, -0.58).tilt(Math.sin(T * 5) * 0.2);

        qwen
          .act('spin', T, 21.6)
          .at(5.25, 0.04, -1.65)
          .flip(true)
          .sq(beatSq(bt, 0.07));
        fan.at(4.68, 0.68, -1.48);

        // Soaring origami whales circling the sunrise arch
        oWhales.forEach((ow, i) => {
          const a = T * 1.1 + i * ((PI * 2) / 3);
          ow.position.set(
            Math.cos(a) * (5.8 + i * 0.6),
            4.5 + Math.sin(T * 2.2 + i) * 0.7,
            -3.5 + Math.sin(a) * 3.2
          );
          ow.rotation.y = -a + PI / 2;
        });

        // Celebratory star confetti rising & twinkling across the dawn sky
        confetti.forEach((cf, i) => {
          const ph = (T * 0.48 + hash(i * 19)) % 1;
          const spread = 13.5 + miracleSurge * 4;
          cf.position.set(
            (hash(i + 5) - 0.5) * spread + Math.sin(T * 2.4 + i) * 0.6,
            0.3 + ph * 8.5,
            -5.5 + hash(i + 13) * 8.5
          );
          cf.scale.setScalar((0.35 + hash(i) * 0.45) * (1 + miracleSurge * 0.45 + bt.pulse * 0.25));
          setOp(cf, Math.sin(ph * PI) * (0.65 + miracleSurge * 0.35));
        });

        return glide(A, B, easeOut(u));
      };
    },
  },
];
