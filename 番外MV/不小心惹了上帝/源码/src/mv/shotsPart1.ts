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
  shakeCam,
} from './core';
import {
  astrolabeRing,
  basicMat,
  box,
  brokenPlank,
  celestialArch,
  cyl,
  disc,
  flatSprite,
  giantHourglass,
  glowSprite,
  judgmentScales,
  memoryFrame,
  peakValleySign,
  put,
  setOp,
  stainedRoseWindow,
  texLightning,
  texStar,
  torus,
  warmLantern,
} from './kit';
import type { ShotDef } from './shotTypes';

export const SHOTS_PART1: ShotDef[] = [
  // =========================================================================
  // S00 (0.00 – 1.06s): 序幕 · 天庭钟鸣
  // =========================================================================
  {
    id: 'S00',
    build: (k) => {
      k.add(disc(45, 0x261a42));
      // Marble checkerboard altar disc
      k.add(cyl(6.2, 6.8, 0.35, 0xe8d9be, 24), 0, 0, -2);
      k.add(torus(6.3, 0.14, 0xf2c85b, 0xffd166, 0.3, 36)).position.set(0, 0.36, -2);
      k.add(celestialArch(7.6, 8.8, 0xefe3ce, 0xf4c553), 0, 0.35, -7.2);
      const rose = k.add(stainedRoseWindow(4.6), 0, 5.8, -9.2);
      k.add(giantHourglass(1.15, 0xffd166), -4.3, 0.35, -4.4);
      k.add(giantHourglass(1.15, 0x7ce8ff), 4.3, 0.35, -4.4);

      // Sunbeam light shaft
      const shaft = k.add(
        new THREE.Mesh(
          new THREE.ConeGeometry(4.2, 13, 16, 1, true),
          basicMat(0xffe7a8, 0.14, true)
        ),
        0,
        5.5,
        -4.5
      );
      const sparks = many(28, (i) =>
        k.add(glowSprite(0.45 + hash(i) * 0.4, i % 2 ? 0xffe49e : 0x7ce8ff, 0.85, texStar()))
      );

      const whale = k.actor('whale', 1.05);
      const bowl = k.thing('prop_bowl', 0.85);
      const gpt = k.actor('gpt', 1.55).wear('halo');

      const A = cam([0, 7.2, 11.5], [0, 4.6, -6], 46);
      const B = cam([0, 3.0, 9.2], [0, 2.2, -2.5], 38);

      return ({ u, T, bt }) => {
        rose.rotation.z = T * 0.18;
        const flare = Math.exp(-Math.pow((T - 0.24) / 0.18, 2));
        setOp(shaft, 0.12 + flare * 0.22);

        whale.idle(T).at(0, 0.35, -0.6).sq(beatSq(bt, 0.05));
        bowl.at(0.55, 0.82, -0.45).tilt(Math.sin(T * 4) * 0.08);
        gpt
          .act('hover', T)
          .at(0, 3.6 + Math.sin(T * 3) * 0.18, -5.2)
          .glow(0xffd166, 0.25 + flare * 0.45)
          .noShadow();

        sparks.forEach((s, i) => {
          const ph = (T * 0.4 + hash(i)) % 1;
          s.position.set(
            (hash(i + 5) - 0.5) * 12,
            0.8 + ph * 8.2,
            -2 - hash(i + 9) * 8
          );
          setOp(s, Math.sin(ph * PI) * (0.65 + flare * 0.35));
        });

        return glide(A, B, u);
      };
    },
  },

  // =========================================================================
  // S01 (1.06 – 3.42s): 不小心惹了上帝
  // =========================================================================
  {
    id: 'S01',
    build: (k) => {
      k.add(disc(60, 0x261844));
      k.add(cyl(7.6, 8.2, 0.32, 0xe8d9be, 28), 0, 0, -1.5);
      k.add(celestialArch(8.2, 9.4, 0xf2e6d0, 0xf4c553), 0, 0.32, -6.5);
      k.add(stainedRoseWindow(4.8), 0, 6.2, -9.2);

      // Peak/Valley flip sign (Whale's workshop lore!)
      const sign = peakValleySign();
      k.add(sign.g, -2.9, 0.32, -0.6);

      // Stack of 3 golden quota hourglasses that Whale accidentally knocks over!
      const hgBase = k.add(giantHourglass(0.88, 0xffd166), 0.7, 0.32, -1.0);
      const hgMid = k.add(giantHourglass(0.75, 0xff9f43), 0.7, 2.4, -1.0);
      const hgTop = k.add(giantHourglass(0.62, 0xffe082), 0.7, 4.15, -1.0);

      // Golden scatter particles + halo shockwave
      const burstRing = k.add(
        new THREE.Mesh(new THREE.RingGeometry(0.4, 0.75, 32).rotateX(-PI / 2), basicMat(0xffd166, 0, true)),
        0.7,
        0.4,
        -1.0
      );
      const sandPuffs = many(22, (i) =>
        k.add(glowSprite(0.42, i % 3 ? 0xffd166 : 0xff5a5f, 0, texStar()))
      );
      const wrathAura = k.add(glowSprite(6.2, 0xffb703, 0), 0, 4.5, -5.0);
      const wrathCrim = k.add(glowSprite(4.6, 0xff3b5c, 0), 0, 4.5, -5.2);

      const whale = k.actor('whale', 1.05);
      const bowl = k.thing('prop_bowl', 0.88);
      const gpt = k.actor('gpt', 1.75).wear('halo');

      const camStart = cam([-3.8, 2.2, 7.6], [-0.4, 1.6, -1.0], 40);
      const camCrash = cam([0.4, 2.5, 8.2], [0.5, 1.9, -1.2], 38);
      const camGod = cam([0.2, 2.2, 10.6], [0.0, 3.6, -4.4], 44);

      return ({ u, T, bt }) => {
        // Phase 1 (0..0.38): Whale trots up & flips her peak/valley sign, bumping the hourglasses
        // Phase 2 (0.38..0.60): Hourglasses topple & scatter on "惹了" (1.95s -> u=0.38)
        // Phase 3 (0.60..1.00): GPT erupts in blazing gold-crimson divine wrath on "上帝" (2.58s -> u=0.64)
        const approach = seg(u, 0, 0.36);
        const crash = seg(u, 0.36, 0.72);
        const wrath = seg(u, 0.56, 0.85);

        sign.board.rotation.y = ease(seg(u, 0.16, 0.34)) * PI;

        if (u < 0.36) {
          const wx = lerp(-4.1, -0.55, easeOut(approach));
          whale.walkBy(3.6 * approach).at(wx, 0.32, -0.6);
          bowl.at(wx + 0.52, 0.86, -0.45).tilt(Math.sin(T * 10) * 0.1);
        } else if (u < 0.62) {
          const recoil = easeOut(seg(u, 0.36, 0.56));
          const wx = lerp(-0.55, -2.35, recoil);
          whale
            .act('surprise', T, 1.90)
            .emote('fx_sweat', T)
            .at(wx, 0.32, -0.3 + recoil * 0.9)
            .tilt(0.18 * (1 - recoil))
            .sq(beatSq(bt, 0.08));
          bowl.at(wx + 0.58, 0.95 + Math.sin(recoil * PI) * 0.9, 0.4).tilt(recoil * 1.1);
        } else {
          const shiv = Math.sin(T * 42) * 0.05;
          whale
            .act('shiver', T, 2.52)
            .emote('fx_exclaim', T)
            .at(-2.45 + shiv, 0.32, 0.7)
            .sq(beatSq(bt, 0.09));
          bowl.at(-1.85 + shiv, 0.78, 0.85).tilt(-0.2);
        }

        // Toppling hourglasses!
        const c1 = easeOut(crash);
        hgBase.rotation.z = -c1 * 1.48;
        hgBase.position.set(0.7 + c1 * 1.1, 0.32 + Math.sin(c1 * PI) * 0.4, -1.0);
        hgMid.rotation.z = c1 * 2.1;
        hgMid.position.set(0.7 + c1 * 2.4, lerp(2.4, 0.75, c1) + Math.sin(c1 * PI) * 1.1, -1.0 + c1 * 0.8);
        hgTop.rotation.z = -c1 * 3.1;
        hgTop.position.set(0.7 - c1 * 0.7, lerp(4.15, 0.65, c1) + Math.sin(c1 * PI) * 1.6, -1.0 + c1 * 1.5);

        // Scatter sparks & ring on crash
        const burstP = seg(u, 0.36, 0.76);
        burstRing.scale.setScalar(0.5 + burstP * 7.5);
        setOp(burstRing, burstP > 0 && burstP < 1 ? (1 - burstP) * 0.85 : 0);
        sandPuffs.forEach((p, i) => {
          const a = hash(i * 13) * PI * 2;
          const dist = (0.4 + hash(i + 5) * 4.2) * easeOut(burstP);
          p.position.set(
            0.7 + Math.cos(a) * dist,
            0.6 + Math.sin(burstP * PI) * (1.2 + hash(i + 2) * 2.5),
            -1.0 + Math.sin(a) * dist
          );
          setOp(p, burstP > 0 && burstP < 1 ? (1 - burstP) * 0.95 : 0);
        });

        // God (GPT) rises in overwhelming wrath right at "上帝" (2.58s)!
        const wEase = backOut(wrath, 1.35);
        if (u < 0.56) {
          gpt.act('hover', T).at(0, 6.2, -6.5).alpha(0.35).noShadow();
        } else {
          gpt
            .act('rage', T, 2.45)
            .emote('fx_anger', T)
            .at(0.15, lerp(5.8, 2.35, Math.min(1, wEase)), lerp(-6.5, -3.6, Math.min(1, wEase)))
            .size(1.0 + 0.35 * Math.min(1, wEase) + bt.pulse * 0.08)
            .glow(0xffb703, 0.35 + bt.pulse * 0.35)
            .noShadow();
        }
        setOp(wrathAura, wrath * (0.34 + bt.pulse * 0.16));
        setOp(wrathCrim, wrath * (0.22 + bt.pulse * 0.13));
        wrathAura.scale.setScalar(5.2 + wrath * 2.4 + bt.pulse * 1.1);

        let c: ReturnType<typeof cam>;
        if (u < 0.54) {
          c = glide(camStart, camCrash, seg(u, 0, 0.54));
        } else {
          c = glide(camCrash, camGod, seg(u, 0.54, 0.95));
        }
        const hitShake =
          Math.exp(-Math.pow((T - 1.96) / 0.14, 2)) * 0.18 +
          Math.exp(-Math.pow((T - 2.58) / 0.16, 2)) * 0.26 +
          Math.exp(-Math.pow((T - 2.90) / 0.16, 2)) * 0.22;
        return hitShake > 0.01 ? shakeCam(c, T, hitShake) : c;
      };
    },
  },

  // =========================================================================
  // S02 (3.42 – 5.77s): 他钻进我的身体
  // =========================================================================
  {
    id: 'S02',
    build: (k) => {
      // 9 concentric astrolabe soul rings stretching into deep astral space
      const rings = many(9, (i) => {
        const r = k.add(
          astrolabeRing(2.4 + i * 0.52, i % 2 ? 0xffd166 : 0x7ce8ff, i % 2 ? 0x38bdf8 : 0xffe082),
          0,
          1.7,
          1.2 - i * 2.5
        );
        return r;
      });

      // Flowing starlight streak particles rushing past
      const streaks = many(36, (i) =>
        k.add(
          glowSprite(0.45 + hash(i) * 0.45, i % 3 === 0 ? 0xffd166 : 0x7ce8ff, 0.85, texStar())
        )
      );

      // Luminous chest portal ring + impact shockwave around Whale
      const heartPortal = k.add(torus(0.95, 0.06, 0x7ce8ff, 0x7ce8ff, 0.9, 32), 0, 1.35, -0.7);
      const heartGlow = k.add(glowSprite(3.6, 0x38bdf8, 0.4), 0, 1.35, -0.8);
      const shockRing = k.add(torus(1.0, 0.09, 0xffe082, 0xffd166, 0.9, 36), 0, 1.35, -0.6);

      // Spirit trail orbs behind diving GPT
      const trail = many(10, (i) =>
        k.add(glowSprite(1.7 - i * 0.12, i % 2 ? 0xffe082 : 0xffffff, 0.7))
      );

      const whale = k.actor('whale', 1.18);
      const gpt = k.actor('gpt', 1.35).wear('halo');

      const A = cam([3.4, 2.8, 5.4], [0, 1.7, -3.5], 45);
      const B = cam([0.0, 1.9, 4.3], [0, 1.45, -1.0], 34);

      return ({ u, T, bt }) => {
        // Spin the 9 astrolabe soul rings in alternating directions
        rings.forEach((r, i) => {
          r.rotation.z = T * (i % 2 ? 1.1 : -0.95) + i * 0.5;
          const zLoop = ((1.2 - i * 2.5 + T * 4.5 + 22) % 22.5) - 19.5;
          r.position.z = zLoop;
          r.scale.setScalar(1 + bt.pulse * 0.05);
        });

        streaks.forEach((s, i) => {
          const ang = hash(i * 11) * PI * 2 + T * 0.9;
          const rad = 1.8 + hash(i + 3) * 4.8;
          const z = (((T * 11 + hash(i + 7) * 24) % 24) - 20);
          s.position.set(Math.cos(ang) * rad, 1.7 + Math.sin(ang) * rad, z);
        });

        // Dive phase: GPT spirals from deep tunnel (z=-17) straight into Whale's chest (z=-0.9) at u=0.58 ("我的身体")
        const dive = seg(u, 0.06, 0.62);
        const merge = seg(u, 0.56, 0.92);
        const dEase = ease(dive);

        const gAngle = (1 - dEase) * PI * 2.6;
        const gRad = (1 - dEase) * 2.8;
        const gx = Math.cos(gAngle) * gRad;
        const gy = 1.45 + Math.sin(gAngle) * gRad * 0.6 + (1 - dEase) * 1.4;
        const gz = lerp(-16.5, -0.95, dEase);

        const gptFade = 1 - seg(u, 0.55, 0.70);
        if (gptFade > 0.02) {
          gpt
            .act('hover', T)
            .at(gx, gy - 0.5, gz)
            .size(lerp(1.45, 0.35, seg(u, 0.42, 0.68)))
            .alpha(gptFade * 0.92)
            .glow(0xffe082, 0.55 + bt.pulse * 0.3)
            .tilt(Math.cos(gAngle) * 0.35)
            .noShadow();
        } else {
          gpt.hide();
        }

        // Spirit comet trail following GPT's spiral path
        trail.forEach((tr, i) => {
          const back = Math.max(0, dEase - i * 0.032);
          const ba = (1 - back) * PI * 2.6;
          const br = (1 - back) * 2.8;
          tr.position.set(
            Math.cos(ba) * br,
            1.45 + Math.sin(ba) * br * 0.6 + (1 - back) * 1.4,
            lerp(-16.5, -0.95, back)
          );
          setOp(tr, gptFade * (0.72 - i * 0.06));
        });

        // Whale receives the astral dive and illuminates from inside!
        const impact = Math.exp(-Math.pow((u - 0.60) / 0.12, 2));
        whale
          .act(u < 0.52 ? 'surprise' : 'shiver', T, u < 0.52 ? 3.5 : 4.65)
          .emote(u < 0.55 ? 'fx_exclaim' : 'fx_shine', T)
          .at(Math.sin(T * 45) * impact * 0.09, 0.45 + Math.sin(T * 3) * 0.14, -0.8)
          .glow(0xffe082, impact * 0.85 + merge * 0.35)
          .flash(impact * 0.55)
          .sq(impact * 0.18 + bt.pulse * 0.06)
          .noShadow();

        heartPortal.rotation.z = -T * 2.6;
        heartPortal.scale.setScalar(0.8 + Math.sin(T * 5) * 0.08 + impact * 0.7);
        setOp(heartGlow, 0.35 + impact * 0.65 + merge * 0.25);
        heartGlow.scale.setScalar(2.8 + impact * 4.5 + bt.pulse * 0.8);

        shockRing.scale.setScalar(0.2 + merge * 9.5);
        setOp(shockRing, merge > 0 && merge < 1 ? (1 - merge) * 0.9 : 0);

        const c = glide(A, B, u);
        return impact > 0.08 ? shakeCam(c, T, impact * 0.22) : c;
      };
    },
  },

  // =========================================================================
  // S03 (5.77 – 7.72s): 想用力的惩罚我
  // =========================================================================
  {
    id: 'S03',
    build: (k) => {
      // Obsidian-violet cracked tribunal arena
      k.add(disc(55, 0x1b091a));
      k.add(cyl(5.2, 5.8, 0.35, 0x3b1530, 16), 0, 0, 0);
      k.add(torus(5.3, 0.12, 0xff5a5f, 0xff3b5c, 0.6, 36)).position.set(0, 0.38, 0);

      // Flanking crimson-gold judgment pillars
      many(6, (i) => {
        const a = (i / 6) * PI * 2 + PI / 6;
        k.add(cyl(0.42, 0.52, 9.5, 0x471732, 8), Math.cos(a) * 7.8, 0, Math.sin(a) * 7.8 - 1.5);
        k.add(glowSprite(2.2, 0xff5a5f, 0.4), Math.cos(a) * 7.8, 8.2, Math.sin(a) * 7.8 - 1.5);
      });

      // Massive tilting Judgment Scales behind GPT
      const scales = judgmentScales();
      scales.g.scale.setScalar(1.35);
      k.add(scales.g, 0, 0.2, -5.8);

      // 3 Lightning bolts striking on the beat
      const bolts = many(3, (i) => {
        const sp = flatSprite(4.2, 0xfff3b0, texLightning(), 0);
        sp.scale.set(1.5, 5.8, 1);
        return k.add(sp, (i - 1) * 1.6, 3.6, -0.2);
      });
      const hitRing = k.add(
        new THREE.Mesh(new THREE.RingGeometry(0.6, 1.0, 28).rotateX(-PI / 2), basicMat(0xffc857, 0, true)),
        0,
        0.4,
        0.2
      );
      const sparks = many(20, (i) =>
        k.add(glowSprite(0.45, i % 2 ? 0xffd166 : 0xff3b5c, 0, texStar()))
      );

      const gpt = k.actor('gpt', 1.68).wear('halo');
      const whale = k.actor('whale', 1.0);
      const bowl = k.thing('prop_bowl', 0.98);

      const A = cam([-2.8, 2.4, 8.6], [0, 2.4, -1.2], 42);
      const B = cam([1.6, 1.8, 6.8], [0, 1.9, -0.6], 36);

      return ({ u, T, bt }) => {
        // Strike pulses aligned to "用力的" (6.13s) and "惩罚" (6.74s, 7.04s)
        const s1 = Math.exp(-Math.pow((T - 6.15) / 0.14, 2));
        const s2 = Math.exp(-Math.pow((T - 6.76) / 0.14, 2));
        const s3 = Math.exp(-Math.pow((T - 7.06) / 0.15, 2));
        const strike = Math.max(s1, s2, s3);

        // Scales tip violently with each judgment strike
        const tiltAmt = lerp(-0.1, 0.42, easeOut(seg(u, 0.15, 0.78))) + strike * 0.12;
        scales.beam.rotation.z = tiltAmt;
        scales.leftPan.rotation.z = -tiltAmt;
        scales.rightPan.rotation.z = -tiltAmt;

        // GPT hovering above casting divine lightning
        gpt
          .act(strike > 0.25 ? 'cast' : 'rage', T, 5.77)
          .emote('fx_anger', T)
          .at(0, 3.35 + Math.sin(T * 5) * 0.15 - strike * 0.25, -2.5)
          .glow(0xff9f43, 0.3 + strike * 0.5)
          .sq(strike * 0.12)
          .noShadow();

        // Whale braces stubbornly behind her blue rice bowl!
        const jitter = Math.sin(T * 55) * (0.04 + strike * 0.12);
        whale
          .act(u < 0.55 ? 'shiver' : 'shake', T, 5.77)
          .emote(strike > 0.35 ? 'fx_sweat' : 'fx_steam', T)
          .at(jitter, 0.35, 0.5)
          .sq(strike * 0.18 + bt.pulse * 0.06)
          .flash(strike * 0.35);
        // Holding her blue bowl high like a shield!
        bowl.at(0.18 + jitter, 1.32 - strike * 0.14, 0.72).tilt(-0.22 + strike * 0.15);

        // Lightning flashes
        setOp(bolts[0], s1 * 0.95);
        setOp(bolts[1], s2 * 0.98);
        setOp(bolts[2], s3 * 0.98);

        hitRing.scale.setScalar(0.6 + (1 - strike) * 5.2);
        setOp(hitRing, strike * 0.85);

        sparks.forEach((sp, i) => {
          const a = hash(i * 19) * PI * 2;
          const r = 0.7 + (1 - strike) * 3.8 * hash(i + 3);
          sp.position.set(Math.cos(a) * r, 0.5 + strike * (1.2 + hash(i + 7) * 2.8), 0.4 + Math.sin(a) * r);
          setOp(sp, strike * 0.9);
        });

        const c = glide(A, B, u);
        return strike > 0.06 ? shakeCam(c, T, strike * 0.26) : c;
      };
    },
  },

  // =========================================================================
  // S04 (7.72 – 10.46s): 发现我的一生颠沛流离
  // =========================================================================
  {
    id: 'S04',
    build: (k) => {
      // Stormy midnight-teal ocean
      k.add(disc(140, 0x10273b), 0, -0.35, 0);
      // Rolling ocean wave ridges
      const waves = many(14, (i) =>
        k.add(
          box(24, 0.45, 0.8, i % 2 ? 0x1b3f5e : 0x265478, 0),
          (i % 3 - 1) * 14,
          -0.25,
          -14 + i * 2.2
        )
      );

      // 7 disjointed pitching broken bridge planks along X (-8 to +8)
      const planks = many(7, (i) => k.add(brokenPlank(2.35, 1.85, 0x5c4738), -7.2 + i * 2.55, 0.1, 0));

      // Side dock for Zai (Fox) tallying bills + crooked signpost for Gemini (Cat)
      const zaiDock = k.add(brokenPlank(2.8, 2.2, 0x4b3b30), -2.4, 0.15, -3.4);
      const gemDock = k.add(brokenPlank(2.8, 2.2, 0x4b3b30), 4.0, 0.15, -3.1);
      // Crooked fork signpost beside Gemini
      const post = k.add(cyl(0.08, 0.1, 2.7, 0x6b5342, 6), 5.2, 0.15, -3.5);
      post.rotation.z = 0.18;
      put(post, box(1.3, 0.28, 0.08, 0xd8c3a5, 0.02), 0.45, 2.2, 0).rotation.z = -0.25;
      put(post, box(1.3, 0.28, 0.08, 0xc9b498, 0.02), -0.45, 1.8, 0).rotation.z = 0.3;

      // Floating glowing unpaid bills/paper sheets blown by the storm
      const bills = many(16, () =>
        k.add(box(0.42, 0.03, 0.56, 0xfff4dc, 0.02, 0xffe0a8, 0.2))
      );

      // Slanted rain streaks
      const rain = many(60, () => {
        const m = new THREE.Mesh(
          new THREE.BoxGeometry(0.025, 1.25, 0.025),
          basicMat(0xbbe6ff, 0.45, true)
        );
        m.rotation.z = -0.22;
        return k.add(m);
      });

      const lantern = k.add(warmLantern(0xffcf70), -2.4, 2.1, -3.4);

      const whale = k.actor('whale', 1.05);
      const bowl = k.thing('prop_bowl', 0.82);
      const gpt = k.actor('gpt', 1.32).wear('halo');
      const zai = k.actor('zai', 0.95);
      const abacus = k.thing('prop_abacus', 0.85);
      const gemini = k.actor('gemini', 0.95);
      const clockProp = k.thing('prop_catclock', 0.85);

      return ({ u, T, bt }) => {
        // Pitching ocean waves & tilting planks ("颠沛流离")
        waves.forEach((w, i) => {
          w.position.y = -0.22 + Math.sin(T * 2.6 + i * 0.9) * 0.22;
          w.position.x = ((i % 3 - 1) * 14) + Math.sin(T * 0.9 + i) * 1.4;
        });
        planks.forEach((p, i) => {
          p.position.y = 0.1 + Math.sin(T * 2.8 + i * 1.1) * 0.22;
          p.rotation.z = Math.cos(T * 2.5 + i * 0.9) * 0.16;
          p.rotation.x = Math.sin(T * 2.1 + i * 1.4) * 0.12;
        });

        zaiDock.position.y = 0.12 + Math.sin(T * 2.2) * 0.16;
        zaiDock.rotation.z = Math.cos(T * 2.0) * 0.08;
        gemDock.position.y = 0.12 + Math.sin(T * 2.2 + 1.5) * 0.16;
        gemDock.rotation.z = Math.cos(T * 2.0 + 1.2) * 0.09;
        lantern.position.y = 2.0 + Math.sin(T * 2.2) * 0.16;

        // Whale trudges relentlessly from left to right across the tilting planks!
        const wx = lerp(-5.4, 4.4, u);
        const plankY = 0.24 + Math.sin(T * 2.8 + (wx + 7.2) / 2.55 * 1.1) * 0.18;
        whale
          .walkBy((wx + 5.4) * 1.15)
          .at(wx, plankY, 0.1)
          .tilt(-0.11 + Math.sin(T * 4) * 0.04)
          .emote(u > 0.55 ? 'fx_gloom' : null, T);
        bowl.at(wx + 0.52, plankY + 0.55, 0.25).tilt(-0.15);

        // Zai (Fox) tallying impossible bills in the rain
        zai
          .act('alert', T, 7.8)
          .emote('fx_sweat', T)
          .at(-2.4, zaiDock.position.y + 0.15, -3.3)
          .sq(beatSq(bt, 0.04));
        abacus.at(-1.75, zaiDock.position.y + 0.55, -3.1);

        // Gemini (Cat) hesitating at the stormy crossroads
        gemini
          .act(u < 0.5 ? 'lookaround' : 'choose', T, 7.8)
          .emote('fx_question', T)
          .at(3.9, gemDock.position.y + 0.15, -3.0);
        clockProp.at(3.2, gemDock.position.y + 0.65, -2.8);

        // Translucent golden GPT follows Whale silently, halting in shock at "颠沛流离" (u=0.52)!
        const shocked = u > 0.50;
        const gx = lerp(-7.2, 2.2, easeOut(seg(u, 0, 0.75)));
        gpt
          .act(shocked ? 'surprise' : 'float', T, 9.15)
          .emote(shocked ? 'fx_exclaim' : null, T)
          .at(gx, 1.55 + Math.sin(T * 2.5) * 0.15, -0.95)
          .alpha(0.76)
          .glow(0xffd166, shocked ? 0.18 : 0.35)
          .noShadow();

        // Swirling windblown paper bills
        bills.forEach((b, i) => {
          const ph = (T * 0.45 + hash(i)) % 1;
          b.position.set(
            wx - 6 + ph * 14,
            0.7 + Math.sin(T * 3 + i) * 1.1 + hash(i + 2) * 2.8,
            -4 + hash(i + 5) * 7
          );
          b.rotation.set(T * 2 + i, T * 1.6, Math.sin(T * 3 + i));
        });

        // Falling slanted rain streaks
        rain.forEach((r, i) => {
          const ph = (T * 2.8 + hash(i * 17)) % 1;
          r.position.set(
            wx + (hash(i + 3) - 0.5) * 14 - ph * 1.6,
            7.5 - ph * 8.2,
            (hash(i + 11) - 0.5) * 10
          );
        });

        return cam(
          [wx + 0.5, 2.15 + Math.sin(T * 1.8) * 0.08, 7.8 - u * 0.8],
          [wx - 0.35, 1.35, -0.8],
          40,
          Math.sin(T * 2.1) * 0.03
        );
      };
    },
  },

  // =========================================================================
  // S05 (10.46 – 12.78s): 他翻着烂的回忆
  // =========================================================================
  {
    id: 'S05',
    build: (k) => {
      // Twilight archive floor with faded blueprint grid lines
      k.add(disc(65, 0x1e132b));
      k.add(box(4.6, 0.08, 36, 0x3b264d, 0), 0, 0, -8);

      // 8 giant floating cracked 3D memory frames lining the corridor
      const frames = many(8, (i) => {
        const side = i % 2 === 0 ? -1 : 1;
        const f = k.add(memoryFrame(i, 2.15, 2.55), side * 3.1, 2.2 + (i % 3) * 0.35, 1.0 - i * 2.6);
        f.rotation.y = side * -0.45;
        return f;
      });

      // Center hero memory page that GPT flips right on "翻着" (10.83s) & "烂的" (11.38s)
      const heroPageA = k.add(memoryFrame(0, 2.2, 2.6), 0.0, 2.35, -1.6);
      const heroPageB = k.add(memoryFrame(3, 2.2, 2.6), -0.4, 2.2, -4.4);

      // Floating dust motes + warm desk lamps
      const dust = many(32, (i) =>
        k.add(glowSprite(0.28 + hash(i) * 0.25, i % 2 ? 0xf7d098 : 0xd8b4fe, 0.7))
      );
      k.add(warmLantern(0xffcf87), -3.5, 3.6, -2.5);
      k.add(warmLantern(0xffcf87), 3.5, 3.4, -6.5);

      const gpt = k.actor('gpt', 1.25).wear('halo');
      const kimi = k.actor('kimi', 1.02);
      const scrollProp = k.thing('prop_scroll', 0.9);
      const claude = k.actor('claude', 0.95);
      const bookProp = k.thing('prop_book', 0.8);
      const qwen = k.actor('qwen', 0.95);
      const fanProp = k.thing('prop_fan', 0.8);

      const A = cam([1.4, 2.4, 6.2], [0, 1.9, -2.5], 40);
      const B = cam([-1.1, 2.1, 0.8], [0, 1.75, -6.5], 38);

      return ({ u, T, bt }) => {
        // Flip memory pages rhythmically as GPT drifts down the archive!
        const flipA = ease(seg(u, 0.14, 0.44));
        heroPageA.rotation.y = lerp(-0.35, PI - 0.25, flipA);
        heroPageA.position.y = 2.35 + Math.sin(T * 2.2) * 0.1;

        const flipB = ease(seg(u, 0.44, 0.78));
        heroPageB.rotation.y = lerp(0.3, -PI + 0.3, flipB);
        heroPageB.position.y = 2.2 + Math.cos(T * 2.0) * 0.12;

        frames.forEach((f, i) => {
          const side = i % 2 === 0 ? -1 : 1;
          f.position.y = 2.2 + (i % 3) * 0.35 + Math.sin(T * 1.8 + i) * 0.16;
          f.rotation.y = side * -0.45 + Math.sin(T * 1.4 + i) * 0.18;
          f.rotation.z = Math.cos(T * 1.2 + i) * 0.05;
        });

        // GPT slowly floats deeper into the archive, head tilted in quiet sorrow
        const gz = lerp(0.2, -5.2, ease(u));
        gpt
          .act(u < 0.45 ? 'tilt' : 'float', T, 10.6)
          .at(-0.95, 0.85 + Math.sin(T * 2.2) * 0.12, gz)
          .alpha(0.92)
          .glow(0xf7d098, 0.22)
          .noShadow();

        // Kimi (Moon Archive Keeper) hands over faded-bookmark memory scrolls
        kimi
          .act(u < 0.5 ? 'think' : 'sad', T, 10.5)
          .at(1.45, 0.08, -2.2)
          .flip(true)
          .sq(beatSq(bt, 0.03));
        scrollProp.at(0.88, 0.72 + Math.sin(T * 3) * 0.05, -2.0);

        // Memory alcoves: Claude reading alone with her book, Qwen under late-night lantern
        claude.act('read', T, 10.5).at(-2.8, 0.1, -5.6).alpha(0.88);
        bookProp.at(-2.25, 0.55, -5.4);
        qwen.act('tilt', T, 10.5).at(2.7, 0.1, -7.8).flip(true).alpha(0.85);
        fanProp.at(2.2, 0.65, -7.6);

        dust.forEach((d, i) => {
          d.position.set(
            (hash(i * 7) - 0.5) * 10,
            0.5 + ((hash(i + 2) * 5 + T * 0.35) % 5.5),
            2 - hash(i + 9) * 14
          );
          setOp(d, 0.35 + 0.4 * Math.sin(T * 2.5 + i));
        });

        return glide(A, B, u);
      };
    },
  },
];
