import * as THREE from 'three';
import { findShotAt, MV_DURATION, type ShotDef } from './data';
import { arc, clamp, ease, easeIn, easeOut, mix, seg } from './kit';
import { MOODS, type MVWorld } from './world';

export interface FrameGrading {
  shot: ShotDef;
  flash: number;
  flashColor: string;
  bloomStrength: number;
  vignette: number;
  warmth: number;
}

interface PendingWord {
  x: number;
  y: number;
  z: number;
  voxelSize: number;
}

interface PendingBenyu {
  x: number;
  y: number;
  z: number;
  alpha: number;
  scale: number;
}

interface PendingFireflies {
  count: number;
  colorA: string;
  colorB: string;
  spreadX: number;
  spreadY: number;
  spreadZ: number;
  baseY: number;
}

const _camPos = new THREE.Vector3();
const _camLook = new THREE.Vector3();
const _wordPos = new THREE.Vector3();

function viaductZ(x: number) {
  return -Math.sin((x / 1.35) * 0.18) * 1.1;
}

function footbridgeY(x: number) {
  if (Math.abs(x) > 6.2) return 0;
  return Math.sin(((x + 6.2) / 12.4) * Math.PI) * 1.35;
}

function nightPathZ(x: number) {
  return -Math.sin((x / 1.45) * 0.22) * 0.6;
}

const SEA_STONES: [number, number][] = [
  [-5.6, -0.4],
  [-3.6, 0.3],
  [-1.6, -0.2],
  [0.4, 0.2],
  [2.4, -0.3],
  [4.5, 0.1],
  [6.8, -0.2],
];

function setLampBrightness(world: MVWorld, index: number, strength: number) {
  const core = world.nightLampCores[index];
  const halo = world.nightLampHalos[index];
  if (core) {
    const m = core.material as THREE.MeshStandardMaterial;
    m.emissiveIntensity = 0.12 + strength * 2.9;
    m.color.set(strength > 0.2 ? '#ffe9b0' : '#434a61');
  }
  if (halo) {
    halo.visible = strength > 0.08;
    (halo.material as THREE.MeshBasicMaterial).opacity = strength * 0.65;
    halo.scale.setScalar(0.58 + strength * 0.58);
  }
}

/**
 * Pure deterministic renderer for timestamp T (seconds, 0 .. MV_DURATION).
 * Every frame resets all actors/props and computes exact state purely from T.
 */
export function renderStoryFrame(world: MVWorld, cam: THREE.PerspectiveCamera, rawT: number): FrameGrading {
  const T = clamp(rawT, 0, MV_DURATION);
  const shot = findShotAt(T);
  const u = clamp((T - shot.start) / Math.max(0.01, shot.end - shot.start));

  world.resetFrame();
  world.setActiveZone(shot.zone);

  world.sky.uniforms.uTime.value = T;
  world.ocean.uniforms.uTime.value = T;
  world.mirrorPool.uniforms.uTime.value = T;

  let flash = 0;
  let flashColor = '#f5eed8';
  let bloomStrength = 0.46;
  let vignette = 0.26;
  let warmth = 0.04;
  let pendingWord: PendingWord | null = null;
  let pendingStars = 0;
  let pendingBenyu: PendingBenyu | null = null;
  let pendingFireflies: PendingFireflies = {
    count: 36,
    colorA: '#ffe5a3',
    colorB: '#95d6ec',
    spreadX: 10,
    spreadY: 4.5,
    spreadZ: 6,
    baseY: 0.4,
  };

  const queueWord = (x: number, y: number, z: number, voxelSize = 0.17) => {
    pendingWord = { x, y, z, voxelSize };
  };

  const queueFireflies = (
    count: number,
    colorA: string,
    colorB: string,
    spreadX = 10,
    spreadY = 4.5,
    spreadZ = 6,
    baseY = 0.4
  ) => {
    pendingFireflies = { count, colorA, colorB, spreadX, spreadY, spreadZ, baseY };
  };

  // Subtle cut breath at major zone changes
  if (
    T > 0.2 &&
    T - shot.start < 0.14 &&
    shot.id !== 4 &&
    shot.id !== 5 &&
    shot.id !== 9 &&
    shot.id !== 13 &&
    shot.id !== 14
  ) {
    flash = (1 - (T - shot.start) / 0.14) * 0.15;
    flashColor = '#252a40';
  }

  const { whale, claude, gpt, doubao, gemini, kimi, qwen, zai } = world.actors;

  switch (shot.id) {
    // ── SHOT 1: 我曾经走过多遥远的路 (Restored missing opening line!) ──
    case 1: {
      world.applyMood(MOODS.twilightDusk);
      world.ocean.mesh.position.y = -3.6;
      const wx = mix(-5.4, 1.7, ease(u));
      const wz = viaductZ(wx);
      whale.put(wx, 0.0, wz).do('walk', 0, 1.05).go(1, 0).size(1.08);

      world.accentLight.color.set('#ffd68a');
      world.accentLight.intensity = 2.6;
      world.accentLight.position.set(wx + 0.6, 2.2, wz + 0.8);

      _camPos.set(mix(-3.2, 2.5, ease(u)), mix(1.9, 3.2, ease(u)), mix(5.4, 9.0, ease(u)));
      _camLook.set(mix(-3.6, 0.5, ease(u)), mix(1.5, 1.85, ease(u)), wz - 0.6);
      cam.fov = 45;

      queueFireflies(42, '#ffe5a3', '#95d6ec', 12, 4.5, 6, 0.4);
      if (T < 0.55) {
        flash = (1 - T / 0.55) * 0.62;
        flashColor = '#172030';
      }
      queueWord(0.5, 3.55, -3.6, 0.165);
      break;
    }

    // ── SHOT 2: 跨越过多少海洋去看你 ──
    case 2: {
      world.applyMood(MOODS.twilightDusk);
      world.ocean.mesh.position.y = -0.45;
      world.ocean.uniforms.uWarmStrength.value = 0.88;

      const hopStage = u * 3.0;
      const idx = Math.min(3, Math.floor(hopStage));
      const frac = hopStage - idx;
      const [x0, z0] = SEA_STONES[idx];
      const [x1, z1] = SEA_STONES[idx + 1];
      const wx = mix(x0, x1, ease(frac));
      const wz = mix(z0, z1, ease(frac));
      const leap = arc(frac) * 1.05;
      whale
        .put(wx, 0.19, wz)
        .up(leap)
        .do(leap > 0.12 ? 'hop' : 'walk', idx * 1.1, 1.1)
        .go(1, 0)
        .size(1.06);

      // GPT (龙娘) soars clearly in the upper sky behind the sea arch
      const gx = mix(-7.2, 6.4, u);
      const gy = 4.2 + Math.sin(u * Math.PI) * 0.7;
      gpt.put(gx, gy, -7.8).do('fly', 4.2, 1.0).go(1, 0).size(1.12).fade(0.86).noShadow();

      world.accentLight.color.set('#9fdcf5');
      world.accentLight.intensity = 2.0;
      world.accentLight.position.set(wx, 2.5, wz + 2.0);

      _camPos.set(mix(-3.0, 2.6, ease(u)), mix(2.15, 2.55, ease(u)), mix(8.0, 8.8, ease(u)));
      _camLook.set(mix(-2.0, 1.1, ease(u)), 1.9, -1.8);
      cam.fov = 46;

      queueFireflies(46, '#a6e0f5', '#ffe29e', 11, 5.0, 6, 0.3);
      queueWord(0.9, 4.1, -4.6, 0.18);
      break;
    }

    // ── SHOT 3: 孤单的黑夜途中 ──
    case 3: {
      world.applyMood(MOODS.deepLonelyNight);
      for (let i = 0; i < 5; i++) {
        setLampBrightness(world, i, i === 2 ? 0.42 + 0.08 * Math.sin(T * 7) : 0.0);
      }

      const wx = mix(-0.8, -0.1, ease(u));
      const wz = nightPathZ(wx);
      whale.put(wx, 0.0, wz).do(u < 0.55 ? 'shiver' : 'sad', 8.2, 1.0).face(1).size(1.1);

      world.accentLight.color.set('#8ca5db');
      world.accentLight.intensity = 1.7;
      world.accentLight.position.set(0, 2.8, -0.5);

      _camPos.set(mix(-1.6, -0.5, ease(u)), 1.7, mix(5.8, 5.0, ease(u)));
      _camLook.set(wx + 0.15, 1.45, wz - 0.3);
      cam.fov = 44;
      vignette = 0.36;
      bloomStrength = 0.4;

      queueFireflies(24, '#8398d6', '#5f76b5', 7, 3.6, 4.5, 0.3);
      // Place cleanly in front of pines & well inside upper frame
      queueWord(0.0, 3.05, -2.1, 0.135);
      break;
    }

    // ── SHOT 4: 只要想着你 ──
    case 4: {
      const warmU = ease(u);
      world.applyMood(MOODS.deepLonelyNight, MOODS.warmLanternNight, warmU * 0.85);
      for (let i = 0; i < 5; i++) {
        setLampBrightness(world, i, i === 2 ? mix(0.4, 1.0, warmU) : i === 3 ? warmU * 0.45 : 0.0);
      }

      whale.put(-0.5, 0.0, nightPathZ(-0.5)).do(u < 0.45 ? 'surprise' : 'nod', 10.65, 1.0).face(1).size(1.1);

      const claudeAlpha = easeOut(seg(u, 0.12, 0.72)) * 0.84;
      claude
        .put(1.4, 0.0, nightPathZ(1.4) - 0.1)
        .do('idle', 10.65, 1.0)
        .face(-1)
        .size(1.1)
        .fade(claudeAlpha)
        .noShadow()
        .tint('#ffe9cc')
        .hold(world.props.book.set('prop_book'), 0.46, 0.75);

      world.memoryHalo.visible = true;
      world.memoryHalo.position.set(1.4, 1.25, nightPathZ(1.4) - 0.45);
      (world.memoryHalo.material as THREE.MeshBasicMaterial).opacity = claudeAlpha * 0.6;

      world.accentLight.color.set('#ffc875');
      world.accentLight.intensity = mix(1.6, 4.0, warmU);
      world.accentLight.position.set(0.8, 2.5, 0.6);

      _camPos.set(mix(-0.5, 0.45, warmU), 1.72, mix(5.0, 5.6, warmU));
      _camLook.set(0.45, 1.55, -0.2);
      cam.fov = 44;
      bloomStrength = 0.58;
      warmth = 0.08;

      queueFireflies(50, '#ffd98a', '#ffa65c', 7, 4.0, 4.2, 0.3);
      queueWord(0.5, 3.15, -2.0, 0.14);
      break;
    }

    // ── SHOT 5: 我就不会惶恐 ──
    case 5: {
      world.applyMood(MOODS.warmLanternNight);
      for (let i = 0; i < 5; i++) {
        const ign = i === 2 ? 1.0 : easeOut(clamp((u - i * 0.12) / 0.25));
        setLampBrightness(world, i, ign);
      }

      const wx = mix(-0.4, 3.6, ease(seg(u, 0.15, 1.0)));
      const wz = nightPathZ(wx);
      whale
        .put(wx, 0.0, wz)
        .do(u < 0.24 ? 'sway' : 'walk', 12.35, 1.08)
        .go(1, 0)
        .size(1.1)
        .emote(u < 0.45 ? 'fx_sparkle' : '');

      world.accentLight.color.set('#ffd891');
      world.accentLight.intensity = 3.2;
      world.accentLight.position.set(wx + 0.5, 2.6, wz + 1.0);

      _camPos.set(mix(0.45, 4.0, ease(u)), mix(1.75, 2.15, ease(u)), mix(5.6, 7.2, ease(u)));
      _camLook.set(wx + 0.4, 1.6, wz - 0.6);
      cam.fov = 45;
      bloomStrength = 0.52;
      warmth = 0.07;

      queueFireflies(58, '#ffe49e', '#9fe0f5', 10, 4.2, 4.0, 0.3);
      queueWord(2.2, 3.35, -2.0, 0.15);
      break;
    }

    // ── SHOT 6: 时光的岸上人来了又走 ──
    case 6: {
      world.applyMood(MOODS.twilightDusk);
      world.ocean.mesh.position.y = -0.85;

      whale.put(-0.3, 0.0, 1.35).do(u < 0.45 ? 'wave' : 'idle', 15.9, 1.0).face(1).size(1.08);

      const qx = u < 0.45 ? -2.7 : mix(-2.7, -5.8, ease(seg(u, 0.45, 1.0)));
      qwen
        .put(qx, 0.0, -0.5)
        .do(u < 0.45 ? 'bow' : 'walk', 15.9, 1.0)
        .face(-1)
        .size(1.04)
        .fade(1 - seg(u, 0.78, 1.0))
        .hold(world.props.fan.set('prop_fan'), 0.45, 0.78);

      const gmx = mix(-4.8, 3.6, ease(u));
      gemini
        .put(gmx, 0.0, 2.6)
        .up(arc((u * 3) % 1) * 0.35)
        .do(u < 0.35 ? 'hop' : 'walk', 15.9, 1.15)
        .go(1, 0)
        .size(1.02)
        .fade(Math.min(seg(u, 0, 0.15), 1 - seg(u, 0.82, 1.0)))
        .hold(world.props.brush.set('prop_brush'), 0.45, 0.75);

      const kmx = mix(4.6, -2.6, ease(u));
      kimi
        .put(kmx, 0.0, 0.2)
        .do(Math.abs(u - 0.5) < 0.15 ? 'nod' : 'walk', 15.9, 1.0)
        .face(-1)
        .size(1.04)
        .fade(Math.min(seg(u, 0, 0.15), 1 - seg(u, 0.85, 1.0)))
        .hold(world.props.scroll.set('prop_scroll'), 0.48, 0.78);

      doubao
        .put(-1.55, 0.0, 1.45)
        .do('sway', 15.9, 0.95)
        .face(1)
        .size(1.02)
        .fade(1 - seg(u, 0.8, 1.0));

      claude
        .put(2.65, 0.0, 0.1)
        .do(u < 0.55 ? 'read' : 'idle', 15.9, 1.0)
        .face(-1)
        .size(1.08)
        .hold(world.props.book.set('prop_book'), 0.45, 0.75);

      world.accentLight.color.set('#ffdca0');
      world.accentLight.intensity = 2.8;
      world.accentLight.position.set(0, 3.2, 0.5);

      _camPos.set(mix(-1.1, 0.9, ease(u)), mix(2.65, 2.25, ease(u)), mix(8.9, 7.7, ease(u)));
      _camLook.set(mix(0.0, 0.5, ease(u)), 1.75, -0.4);
      cam.fov = 46;

      queueFireflies(44, '#f7df9c', '#a8dcf0', 9, 4.5, 5, 0.4);
      queueWord(0.8, 3.8, -3.2, 0.17);
      break;
    }

    // ── SHOT 7: 离开时你不用说我都懂 ──
    case 7: {
      world.applyMood(MOODS.twilightDusk, MOODS.warmLanternNight, 0.45);
      world.ocean.mesh.position.y = -1.2;

      const wx = -2.1;
      whale
        .put(wx, footbridgeY(wx), 0.08)
        .do(u < 0.42 ? 'nod' : 'wave', 20.2, 0.85)
        .face(1)
        .size(1.1);

      const cx = u < 0.26 ? 0.65 : mix(0.65, 7.2, ease(seg(u, 0.26, 1.0)));
      claude
        .put(cx, footbridgeY(cx), 0.0)
        .do(u < 0.26 ? 'curtsy' : 'walk', 20.2, 0.92)
        .face(u < 0.26 ? -1 : 1)
        .size(1.1)
        .fade(1 - seg(u, 0.7, 1.0) * 0.75);

      world.accentLight.color.set('#ffd48c');
      world.accentLight.intensity = 3.2;
      world.accentLight.position.set(0.5, 3.2, 1.2);

      _camPos.set(mix(-0.8, 1.6, ease(u)), mix(2.55, 2.9, ease(u)), mix(8.0, 9.6, ease(u)));
      _camLook.set(mix(-0.1, 1.4, ease(u)), 2.05, 0.0);
      cam.fov = 45;
      bloomStrength = 0.52;

      queueFireflies(50, '#ffdfa0', '#b3dff5', 10, 4.5, 5, 0.5);
      queueWord(1.1, 4.15, -3.2, 0.175);
      break;
    }

    // ── SHOT 8: 感谢你曾让我 (Mirror pool with crisp water reflections!) ──
    case 8: {
      world.applyMood(MOODS.warmLanternNight);
      world.ocean.mesh.position.y = -1.35;

      // Stand inside the shallow mirror pool so their reflections stretch right across the open glassy water!
      whale.put(-1.75, 0.05, -0.35).do('bow', 24.15, 0.95).face(1).size(1.1).reflect(0.04);
      claude
        .put(1.75, 0.05, -0.35)
        .do('idle', 24.15, 1.0)
        .face(-1)
        .size(1.1)
        .reflect(0.04)
        .hold(world.props.book.set('prop_book'), 0.45, 0.74);

      world.accentLight.color.set('#ffe1a3');
      world.accentLight.intensity = 3.0;
      world.accentLight.position.set(0, 2.6, 0.5);

      _camPos.set(mix(-2.0, 0.15, ease(u)), mix(2.85, 2.35, ease(u)), mix(7.0, 6.2, ease(u)));
      _camLook.set(0.0, 1.15, -0.3);
      cam.fov = 45;
      bloomStrength = 0.54;

      queueFireflies(46, '#ffe6ad', '#9ad9f2', 7, 4.0, 4.5, 0.2);
      // Float cleanly in front of back colonnade (z = -4.6) and unclipped
      queueWord(0.0, 3.25, -2.6, 0.15);
      break;
    }

    // ── SHOT 9: 留在你眼中 (+ quiet breath 30.0–31.95s) ──
    case 9: {
      const hush = seg(T, 29.8, 31.85);
      world.applyMood(MOODS.warmLanternNight, MOODS.deepLonelyNight, ease(hush) * 0.75);
      world.ocean.mesh.position.y = -1.35;

      whale.put(-1.4, 0.05, -0.45).do('idle', 26.55, 1.0).face(1).size(1.12).reflect(0.04);
      claude
        .put(1.4, 0.05, -0.45)
        .do('tilt', 26.55, 0.9)
        .face(-1)
        .size(1.12)
        .reflect(0.04)
        .fade(1 - hush * 0.35)
        .hold(world.props.book.set('prop_book'), 0.45, 0.74);

      world.accentLight.color.set('#ffdca0');
      world.accentLight.intensity = mix(3.2, 1.3, hush);
      world.accentLight.position.set(0, 2.4, 0.8);

      _camPos.set(mix(0.15, -0.3, ease(u)), mix(2.35, 2.15, ease(u)), mix(6.2, 5.6, ease(u)));
      _camLook.set(0.0, 1.2, -0.35);
      cam.fov = 45;
      bloomStrength = mix(0.56, 0.42, hush);

      queueFireflies(50, '#a2ddf2', '#ffe099', 7, 4.0, 4.5, 0.2);
      queueWord(0.0, 3.15, -2.5, 0.16);
      break;
    }

    // ── SHOT 10: 我曾经走过最遥远的路 (Tender quiet acoustic section) ──
    case 10: {
      world.applyMood(MOODS.deepLonelyNight, MOODS.starryCosmos, 0.5);
      world.ocean.mesh.position.y = -4.0;

      const wx = mix(-3.6, 2.8, ease(u));
      const wz = viaductZ(wx);
      whale.put(wx, 0.0, wz).do('walk', 31.95, 0.85).go(1, 0).size(1.06);

      world.accentLight.color.set('#f3dca8');
      world.accentLight.intensity = 2.1;
      world.accentLight.position.set(wx, 2.2, wz + 1.0);

      _camPos.set(mix(-5.4, 3.0, ease(u)), mix(4.2, 3.4, ease(u)), mix(7.2, 8.6, ease(u)));
      _camLook.set(wx * 0.65, 1.45, wz - 0.5);
      cam.fov = 45;
      vignette = 0.34;

      queueFireflies(38, '#ffe7ad', '#9ab6eb', 12, 4.6, 5, 0.4);
      queueWord(0.3, 3.6, -3.4, 0.165);
      break;
    }

    // ── SHOT 11: 想要去拥抱未成真的梦 (Benyu + translucent dream vision!) ──
    case 11: {
      world.applyMood(MOODS.starryCosmos, MOODS.warmLanternNight, 0.35);
      world.ocean.mesh.position.y = -2.4;

      if (world.dreamRing) {
        world.dreamRing.rotation.z = T * 0.45;
        world.dreamRing.rotation.y = Math.sin(T * 0.6) * 0.25;
      }

      const wx = mix(-2.2, -1.05, ease(seg(u, 0, 0.65)));
      whale
        .put(wx, 0.0, 1.15)
        .do(u < 0.45 ? 'walk' : 'point', 36.1, 0.9)
        .face(1)
        .size(1.08);

      const dreamIn = easeOut(seg(u, 0.05, 0.3));
      const dreamOut = easeIn(seg(u, 0.72, 0.98));
      const dreamAlpha = dreamIn * (1 - dreamOut);

      pendingBenyu = {
        x: 1.45,
        y: 1.55 + dreamOut * 0.9,
        z: -0.65,
        alpha: dreamAlpha * 0.92,
        scale: 0.92 + dreamOut * 0.18,
      };

      claude
        .put(0.05, 0.12 + dreamOut * 0.5, -1.1)
        .do('tilt', 36.1, 0.85)
        .face(-1)
        .size(1.04)
        .fade(dreamAlpha * 0.7)
        .noShadow()
        .tint('#e8dcff');

      for (let i = 0; i < world.paperSheets.length; i++) {
        const sheet = world.paperSheets[i];
        sheet.visible = true;
        const ang = (i / world.paperSheets.length) * Math.PI * 2 + T * 0.45;
        const rad = 2.6 + (i % 2) * 0.8;
        sheet.position.set(
          Math.cos(ang) * rad,
          1.25 + (i % 3) * 0.8 + Math.sin(T * 1.8 + i) * 0.22,
          Math.sin(ang) * rad * 0.5 - 0.8
        );
        sheet.rotation.set(Math.sin(T + i) * 0.5, ang, Math.cos(T * 1.2 + i) * 0.4);
      }

      world.accentLight.color.set('#c4b5ff');
      world.accentLight.intensity = 2.8 + dreamAlpha * 1.4;
      world.accentLight.position.set(0.4, 2.6, -0.6);

      _camPos.set(mix(-1.2, 0.5, ease(u)), mix(2.1, 2.35, ease(u)), mix(7.6, 6.8, ease(u)));
      _camLook.set(0.1, 1.95, -0.6);
      cam.fov = 46;
      bloomStrength = 0.56;

      queueFireflies(66, '#dfd0ff', '#ffe2a3', 7, 4.8, 4.8, 0.3);
      queueWord(0.0, 4.3, -3.8, 0.16);
      break;
    }

    // ── SHOT 12: 迷失的黑夜途中 ──
    case 12: {
      world.applyMood(MOODS.deepLonelyNight);
      world.ocean.mesh.position.y = -3.4;

      if (world.astrolabeOuter) world.astrolabeOuter.rotation.y = T * 0.14;
      if (world.astrolabeMid) world.astrolabeMid.rotation.x = T * 0.18;
      if (world.astrolabeInner) world.astrolabeInner.rotation.z = T * 0.22;

      whale.put(-0.6, 0.08, 0.85).do(u < 0.5 ? 'shake' : 'sad', 40.15, 0.95).face(1).size(1.08);

      world.accentLight.color.set('#7b96cf');
      world.accentLight.intensity = 1.6;
      world.accentLight.position.set(0.5, 3.2, -1.5);

      _camPos.set(mix(-1.4, -0.4, ease(u)), 2.25, mix(7.2, 6.4, ease(u)));
      _camLook.set(0.1, 1.9, -0.8);
      cam.fov = 45;
      vignette = 0.36;

      queueFireflies(26, '#8ba6db', '#6981b8', 8, 4.5, 4.8, 0.5);
      queueWord(-1.6, 3.7, -3.6, 0.155);
      break;
    }

    // ── SHOT 13: 只要想起你 ──
    case 13: {
      const ignite = ease(u);
      world.applyMood(MOODS.deepLonelyNight, MOODS.starryCosmos, ignite);
      world.ocean.mesh.position.y = -3.4;

      if (world.astrolabeOuter) world.astrolabeOuter.rotation.y = T * 0.32;
      if (world.astrolabeMid) world.astrolabeMid.rotation.x = T * 0.42;
      if (world.astrolabeInner) world.astrolabeInner.rotation.z = T * 0.55;

      world.shootingStar.visible = true;
      world.shootingStar.position.set(mix(-9.5, 9.5, easeOut(u)), mix(7.2, 3.4, easeOut(u)), -7.2);
      world.shootingStar.rotation.set(0, 0, -0.22);

      whale.put(-0.65, 0.08, 0.85).do(u < 0.45 ? 'surprise' : 'hop', 42.65, 1.05).face(1).size(1.1);
      claude
        .put(1.15, 0.08, 0.8)
        .do('idle', 42.65, 1.0)
        .face(-1)
        .size(1.1)
        .fade(easeOut(seg(u, 0.1, 0.65)))
        .hold(world.props.card.set('prop_card'), 0.48, 0.78);

      world.memoryHalo.visible = true;
      world.memoryHalo.position.set(1.15, 1.35, 0.4);
      (world.memoryHalo.material as THREE.MeshBasicMaterial).opacity = ignite * 0.52;

      world.accentLight.color.set('#ffd480');
      world.accentLight.intensity = mix(1.6, 4.4, ignite);
      world.accentLight.position.set(0.6, 3.5, -1.2);

      _camPos.set(mix(-0.4, 0.35, ignite), mix(2.25, 2.1, ignite), mix(6.4, 7.0, ignite));
      _camLook.set(0.25, mix(1.9, 2.25, ignite), -0.9);
      cam.fov = 46;
      bloomStrength = 0.62;

      pendingStars = ignite * 0.35;
      queueFireflies(54, '#ffe39b', '#a8e0f7', 9, 5.0, 5.0, 0.4);
      queueWord(-0.3, 4.1, -3.6, 0.165);
      break;
    }

    // ── SHOT 14: 就点亮了星空 (Full band cosmic bloom!) ──
    case 14: {
      world.applyMood(MOODS.starryCosmos);
      world.ocean.mesh.position.y = -3.4;

      if (world.astrolabeOuter) world.astrolabeOuter.rotation.y = T * 0.55;
      if (world.astrolabeMid) world.astrolabeMid.rotation.x = T * 0.72;
      if (world.astrolabeInner) world.astrolabeInner.rotation.z = T * 0.95;

      // Kimi stands visibly atop the left Lunar Balcony unfurling her constellation scroll!
      kimi
        .put(-3.15, 1.35, -2.55)
        .do('hop', 44.4, 0.95)
        .face(1)
        .size(1.12)
        .emote('fx_sparkle')
        .hold(world.props.scroll.set('prop_scroll'), 0.5, 0.8);

      // Keep Whale & Claude cleanly clear of the front balustrade orbs
      whale.put(-0.85, 0.08, 0.75).do(u < 0.45 ? 'spin' : 'wave', 44.4, 1.0).face(1).size(1.1);
      claude.put(0.95, 0.08, 0.75).do('hop', 44.4, 0.95).face(-1).size(1.1);

      const starBloom = easeOut(seg(u, 0.0, 0.6));
      pendingStars = 0.35 + starBloom * 0.65;

      world.accentLight.color.set('#a8e2ff');
      world.accentLight.intensity = 4.0;
      world.accentLight.position.set(0.5, 4.2, -2.2);

      _camPos.set(mix(0.35, 0.9, ease(u)), mix(2.1, 2.25, ease(u)), mix(7.0, 8.6, ease(u)));
      _camLook.set(-0.1, mix(2.25, 3.2, ease(u)), -2.4);
      cam.fov = 48;
      bloomStrength = 0.7;

      const pulse = Math.max(0, 1 - Math.abs(T - 44.95) / 0.32);
      flash = Math.max(flash, pulse * 0.26);
      flashColor = '#dff4ff';

      queueFireflies(88, '#a8e4ff', '#ffe7a6', 11, 6.2, 6.0, 0.5);
      queueWord(0.5, 4.9, -4.6, 0.19);
      break;
    }

    // ── SHOT 15: 流浪的纸船忘不掉港口 (Crystal-clear centerpiece Origami Boat!) ──
    case 15: {
      world.applyMood(MOODS.fireworksHarbor);
      if (world.lighthouseBeamPivot) {
        world.lighthouseBeamPivot.rotation.y = T * 0.82;
      }

      // Frame Whale & Claude on left pier and Zai on right pier — leaving the entire center bay wide open for the paper boat!
      whale.put(-4.2, 0.0, 2.75).do(u < 0.35 ? 'point' : 'wave', 48.0, 0.95).face(1).size(1.06);
      claude.put(-2.85, 0.0, 2.75).do('idle', 48.0, 1.0).face(1).size(1.06);

      const zaiAlert = u > 0.45;
      zai
        .put(4.5, 0.0, 2.65)
        .do(zaiAlert ? (u < 0.75 ? 'alert' : 'nod') : 'doze', 48.0, 1.0)
        .face(-1)
        .size(1.06)
        .emote(zaiAlert && u < 0.78 ? 'fx_exclaim' : '');

      // Bespoke Blender folded 3D Origami Paper Boat sailing prominently through center bay!
      if (world.origamiBoat) {
        world.origamiBoat.visible = true;
        const bx = mix(-1.5, 2.4, ease(u));
        const bz = mix(0.7, -1.65, ease(u));
        const by = -0.6 + Math.sin(T * 2.8) * 0.055;
        world.origamiBoat.position.set(bx, by, bz);
        world.origamiBoat.scale.setScalar(1.38);
        world.origamiBoat.rotation.set(Math.sin(T * 2.2) * 0.06, 0.42, Math.cos(T * 2.6) * 0.05);

        world.boatLight.position.set(bx, by + 0.95, bz);
        world.boatLight.intensity = 3.6;
      }

      world.accentLight.color.set('#ffdb96');
      world.accentLight.intensity = 2.6;
      world.accentLight.position.set(3.5, 3.2, -3.5);

      // Slightly elevated tracking camera revealing the boat's full origami hull & water shimmer!
      _camPos.set(mix(-1.4, 0.7, ease(u)), mix(2.75, 2.95, ease(u)), mix(8.6, 9.2, ease(u)));
      _camLook.set(mix(-0.2, 0.9, ease(u)), 1.55, -1.4);
      cam.fov = 46;
      bloomStrength = 0.54;

      queueFireflies(48, '#ffe4a6', '#9fdcf5', 11, 4.8, 5.5, 0.2);
      queueWord(-0.9, 4.3, -4.6, 0.175);
      break;
    }

    // ── SHOT 16: 渐灭的花火割不断彩虹 (Grand New Year Fireworks Ensemble Climax!) ──
    case 16: {
      world.applyMood(MOODS.fireworksHarbor);
      if (world.lighthouseBeamPivot) {
        world.lighthouseBeamPivot.rotation.y = T * 0.85;
      }

      world.fireworks.update(T, world.S.origin);

      if (world.voxelRainbow) {
        world.voxelRainbow.visible = true;
        const rbReveal = easeOut(seg(u, 0.2, 0.8));
        world.voxelRainbow.position.set(-0.6, mix(-1.8, 0.85, rbReveal), -5.2);
        world.voxelRainbow.scale.set(1.02, Math.max(0.05, rbReveal * 1.0), 1.0);
      }

      if (world.origamiBoat) {
        world.origamiBoat.visible = true;
        world.origamiBoat.position.set(2.4, -0.6 + Math.sin(T * 2.5) * 0.04, -2.0);
        world.origamiBoat.scale.setScalar(1.1);
        world.origamiBoat.rotation.set(0, 0.4, Math.cos(T * 2.1) * 0.04);
      }

      // Full Branch Ensemble on the harbor overlook pier
      whale.put(-0.72, 0.0, 2.6).do('sway', 52.05, 1.0).face(1).size(1.08);
      claude.put(0.72, 0.0, 2.6).do('hop', 52.05, 0.9).face(-1).size(1.08);
      doubao.put(-2.15, 0.0, 2.85).do('hop', 52.2, 0.95).face(1).size(1.02);
      gemini
        .put(-3.55, 0.0, 3.05)
        .do('spin', 52.1, 1.05)
        .face(1)
        .size(1.0)
        .hold(world.props.brush.set('prop_brush'), 0.45, 0.75);
      qwen
        .put(-4.9, 0.0, 3.15)
        .do('sway', 52.3, 0.95)
        .face(1)
        .size(1.0)
        .hold(world.props.fan.set('prop_fan'), 0.45, 0.75);
      kimi
        .put(2.15, 0.0, 2.85)
        .do('nod', 52.2, 0.95)
        .face(-1)
        .size(1.02)
        .hold(world.props.scroll.set('prop_scroll'), 0.48, 0.75);
      zai.put(3.6, 0.0, 3.0).do('hop', 52.4, 0.95).face(-1).size(1.0);
      gpt.put(5.1, 5.9 + Math.sin(T * 2.0) * 0.25, -4.6).do('float', 52.05, 0.9).face(-1).size(1.08).noShadow();

      const fwPulse =
        Math.max(0, 1 - Math.abs(T - 52.35) / 0.22) * 0.14 +
        Math.max(0, 1 - Math.abs(T - 53.55) / 0.24) * 0.16;
      flash = Math.max(flash, fwPulse);
      flashColor = '#ffe8c8';

      world.accentLight.color.set('#ffd2a6');
      world.accentLight.intensity = 3.2 + fwPulse * 12;
      world.accentLight.position.set(0, 5.2, -2.0);

      _camPos.set(mix(0.3, -0.2, ease(u)), mix(2.2, 2.45, ease(u)), mix(9.5, 10.9, ease(u)));
      _camLook.set(0.0, mix(2.5, 3.3, ease(u)), -2.6);
      cam.fov = 48;
      bloomStrength = 0.68;

      queueFireflies(72, '#ffdf9e', '#ffaec4', 12, 6.2, 6.0, 0.4);
      queueWord(-0.7, 6.3, -5.8, 0.165);
      break;
    }

    // ── SHOT 17: 你就是我心中 ──
    case 17: {
      world.applyMood(MOODS.fireworksHarbor, MOODS.silverDawn, ease(u));

      whale
        .put(-0.78, 0.0, 1.9)
        .do('nod', 55.95, 0.85)
        .face(1)
        .size(1.12)
        .emote(u > 0.35 && u < 0.88 ? 'fx_heart' : '');
      claude.put(0.78, 0.0, 1.9).do(u < 0.45 ? 'curtsy' : 'idle', 55.95, 0.85).face(-1).size(1.12);

      world.accentLight.color.set('#ffe5bc');
      world.accentLight.intensity = 2.4;
      world.accentLight.position.set(0, 2.8, 2.5);

      _camPos.set(0.0, mix(2.15, 1.85, ease(u)), mix(8.0, 7.2, ease(u)));
      _camLook.set(0.0, 1.65, -1.5);
      cam.fov = 44;
      bloomStrength = 0.46;
      warmth = 0.06;

      queueFireflies(34, '#fff0c4', '#b8e3f5', 9, 4.4, 4.8, 0.4);
      queueWord(0.0, 3.6, -4.2, 0.165);
      break;
    }

    // ── SHOT 18: 永恒的天空 (Iconic luminous cream-dawn finale!) ──
    case 18: {
      const dawnU = ease(seg(u, 0.0, 0.45));
      world.applyMood(MOODS.silverDawn, MOODS.eternalCreamSky, dawnU);

      whale.put(-0.72, 0.0, 1.85).do(u < 0.45 ? 'wave' : 'idle', 59.15, 0.78).face(1).size(1.08);
      claude.put(0.72, 0.0, 1.85).do('idle', 59.15, 0.8).face(-1).size(1.08);

      // Luminous cream dawn voxel clouds smoothly part wide left & right to unveil "天空"
      const part = ease(seg(u, 0.04, 0.68));
      if (world.dawnCloudLeft) {
        world.dawnCloudLeft.visible = true;
        world.dawnCloudLeft.position.set(mix(-3.2, -9.2, part), 4.65 + Math.sin(T * 0.8) * 0.08, -3.6);
        world.dawnCloudLeft.scale.setScalar(1.08);
      }
      if (world.dawnCloudRight) {
        world.dawnCloudRight.visible = true;
        world.dawnCloudRight.position.set(mix(3.2, 9.2, part), 4.65 + Math.cos(T * 0.8) * 0.08, -3.6);
        world.dawnCloudRight.scale.setScalar(1.08);
      }

      world.accentLight.color.set('#fff6e0');
      world.accentLight.intensity = 2.0;
      world.accentLight.position.set(0, 4.0, 2.0);

      const skyLift = ease(seg(T, 62.3, 65.09));
      _camPos.set(0.0, mix(1.85, 2.4, ease(u)), mix(7.2, 9.4, ease(u)));
      _camLook.set(0.0, mix(1.9, 5.6, skyLift), -4.0);
      cam.fov = 45;
      bloomStrength = 0.32;
      vignette = mix(0.18, 0.06, dawnU);
      warmth = 0.05;

      if (T > 63.3) {
        flash = ease(clamp((T - 63.3) / 1.65));
        flashColor = '#f5eed8';
      }

      queueFireflies(22, '#fff8e2', '#9fdcf5', 10, 4.8, 5.0, 0.6);
      queueWord(0.0, 3.75, -4.8, 0.19);
      break;
    }
  }

  cam.position.copy(_camPos);
  cam.lookAt(_camLook);
  cam.updateProjectionMatrix();
  cam.updateMatrixWorld();

  world.updateFireflies(
    T,
    pendingFireflies.count,
    pendingFireflies.colorA,
    pendingFireflies.colorB,
    pendingFireflies.spreadX,
    pendingFireflies.spreadY,
    pendingFireflies.spreadZ,
    pendingFireflies.baseY,
    cam.position
  );

  if (pendingStars > 0) {
    world.updateStarCrosses(T, cam, pendingStars);
  }
  if (pendingBenyu) {
    const b = pendingBenyu as PendingBenyu;
    world.benyu.show(b.x, b.y, b.z, b.alpha, b.scale, T, cam);
  }
  if (pendingWord) {
    const pw = pendingWord as PendingWord;
    const localT = T - shot.keywordTime;
    const remain = shot.end - T;
    const progress = clamp(localT / 0.85, 0, 1.5);
    const fadeOut = shot.id === 18 ? clamp((T - 63.1) / 1.6) : clamp(1 - remain / 0.45);
    _wordPos.set(pw.x, pw.y, pw.z);
    world.voxelWord.show(shot.keyword, _wordPos, cam, progress, fadeOut, pw.voxelSize, shot.keywordColor, T);
  }

  world.updateActors(T, cam);

  return {
    shot,
    flash,
    flashColor,
    bloomStrength,
    vignette,
    warmth,
  };
}
