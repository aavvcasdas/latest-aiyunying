// 《雨爱》镜头表（下）：副歌一 L12a–L13b · 副歌二 L14–L18b · 副歌三（反复）L19–L22b · 尾声 OUT
import * as THREE from 'three';
import type { CharId } from '../engine/actors';
import { cam, glide, track, type ShotDef } from '../engine/core';
import { backOut, box, clamp01, ease, glowMat, hash, lantern, lerp, paperBoat, seg, setOp, sprite } from '../engine/kit';
import { notebook } from '../engine/props';
import {
  EIGHTH, INSIDE_Y, PI, POS, RWIN, S, SILL,
  clearUmbrella, heartMark, lane, lightBeam, many, photoAt, rainbow, rainbowPhoto, ringOne, roomSet, steamFx, tripodCam, umbrella, vessel, windowStage,
} from './sets';
import { UMB_Y } from './shotsA';

const mat = (m: THREE.Mesh) => m.material as THREE.MeshBasicMaterial;

/** 片尾合影的站位（L22a 走到位，L22b 原地不动——两镜共用，切镜不跳位） */
const GROUP: { id: CharId; x: number; from: number }[] = [
  { id: 'zai', x: -5.2, from: -9.7 }, { id: 'kimi', x: -3.9, from: -8.4 }, { id: 'gemini', x: -2.6, from: -7.1 },
  { id: 'whale', x: -1.1, from: -1.1 }, { id: 'claude', x: 0.5, from: 0.5 },
  { id: 'doubao', x: 1.9, from: 6.6 }, { id: 'qwen', x: 3.0, from: 7.6 }, { id: 'grok', x: 5.2, from: 9.8 },
];
const GROUP_Z = 0.8, TRIPOD: [number, number, number] = [4.25, 0, 1.3];
const happy = (id: CharId): string | null => (id === 'whale' ? 'whale_wave' : id === 'claude' ? 'claude_front_1' : id === 'doubao' ? 'doubao_cage_1' : id === 'grok' ? 'grok_side_0' : null);

export const SHOTS_B: ShotDef[] = [
  {
    id: 'L12a', look: 'rain', title: '让想念继续', cast: ['whale'],
    note: '一排点着小灯的纸船顺着河水往前漂，一只接一只；本鲸沿着河沿跟着走。镜头横移，跟着船。',
    build: (k) => {
      const L = lane(k);
      const whale = k.actor('whale');
      const boats = many(5, () => ({ b: k.add(paperBoat(), 0, 0, 0, 0, 0.17), l: k.add(sprite('glow', 0.75, 0xffd88a, true, 0.8)) }));
      const A = cam([-2.6, 1.7, 10.4], [-1.6, 0.9, 2.4], 36), B = cam([0.6, 1.7, 10.4], [1.4, 0.9, 2.4], 36);
      return ({ u, T }) => {
        L.tick(T, 0.9);
        whale.walkX(-3.6, -0.6, u, 0, 1.9);
        boats.forEach(({ b, l }, i) => {
          const x = -4.4 + i * 1.5 + u * 3.4, y = 0.1 + Math.sin(T * 2.3 + i) * 0.03;
          b.position.set(x, y, 3.5); b.rotation.y = 0.15; b.rotation.z = Math.sin(T * 1.7 + i * 1.3) * 0.05;
          l.position.set(x, y + 0.32, 3.5);
        });
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'L12b', look: 'rain', title: '让爱变透明', cast: ['gemini'],
    note: 'Gemini 的习性：先看两个，最后必须选一个。红伞、透明伞，她左看右看，选了透明的那把——一颗心穿过伞面升上去，越来越淡。',
    build: (k) => {
      const L = lane(k);
      const gem = k.actor('gemini');
      const red = k.add(umbrella(1.1, 0xe85d75, 1.5)), clr = k.add(clearUmbrella(1.2, 1.5));
      const heart = k.add(sprite('heart', 0.5, 0xff8fb0));
      const A = cam([0, 1.8, 8.2], [0, 1.4, 0.8], 36), B = cam([0.2, 1.7, 6.8], [0.1, 1.45, 0.8], 35);
      return ({ u, T }) => {
        L.tick(T, 0.9);
        const pick = ease(seg(u, 0.5, 0.74));
        const look = Math.floor(seg(u, 0, 0.5) * 3.999);
        if (u < 0.5) gem.set('gemini_side_0').flip(look % 2 === 0); else gem.front(T);
        gem.at(0, 0, 0.8).lift(Math.abs(Math.sin(seg(u, 0.74, 1) * PI * 2)) * 0.14);
        red.position.set(-2.0, 0, 0.7); red.rotation.z = 0.12;
        clr.position.set(lerp(2.0, 0.12, pick), lerp(0, UMB_Y, pick), lerp(0.7, 0.78, pick)); clr.rotation.z = lerp(-0.12, 0.04, pick);
        const hp = seg(u, 0.62, 1);
        heart.position.set(0.1, 1.6 + hp * 1.9, 0.9); heart.scale.setScalar(0.4 + hp * 0.3); setOp(heart, hp > 0 ? lerp(0.95, 0.16, hp) : 0);
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'L13a', look: 'rain', title: '给我勇气的', cast: ['whale', 'doubao'],
    note: '豆包的习性：先陪着，不催人。她撑着黄伞慢慢走过来，站定，什么也不说，把伞往本鲸那边挪——雨不再落在她身上。',
    build: (k) => {
      const L = lane(k);
      const whale = k.actor('whale'), dou = k.actor('doubao');
      const umb = k.add(umbrella(1.3, 0xffd166, 1.5));
      const A = cam([1.6, 1.9, 9.2], [1.0, 1.35, 0.8], 36), B = cam([0.2, 1.8, 6.9], [0.1, 1.4, 0.8], 35);
      return ({ u, T }) => {
        L.tick(T, 1);
        const come = seg(u, 0, 0.7), share = ease(seg(u, 0.7, 0.93));
        if (come < 1) dou.walkX(4.4, 0.75, come, 0, 0.8); else dou.set(T % 2.4 < 0.14 ? 'doubao_cage_1' : 'doubao_cage_0').at(0.75, 0, 0.8);
        umb.position.set(lerp(4.4, 0.75, come) - lerp(0.25, 0.7, share), UMB_Y, 0.75); umb.rotation.z = lerp(0.06, 0.1, share);
        whale.front(T).at(-0.65, 0, 0.8).lift(Math.sin(share * PI) * 0.12);
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'L13b', look: 'rain', title: 'Rainie love', cast: ['whale', 'doubao'],
    note: '伞下两个人踩着拍子轻轻一颠；一圈心从伞顶升起来。雨还在下，但她笑了。',
    build: (k) => {
      const L = lane(k);
      const whale = k.actor('whale'), dou = k.actor('doubao');
      const umb = k.add(umbrella(1.3, 0xffd166, 1.5));
      const hearts = many(12, (i) => k.add(sprite('heart', 0.3 + hash(i) * 0.2, i % 3 ? 0xff9db8 : 0xffffff)));
      const glow = k.add(sprite('glow', 6, 0xffe2a8, true, 0), 0.05, 1.6, 0.2);
      const A = cam([0, 2.0, 7.4], [0.05, 1.5, 0.8], 36), B = cam([0, 3.0, 10.2], [0.05, 2.0, 0.8], 36);
      return ({ u, T, bt }) => {
        L.tick(T, 0.8);
        const hop = bt.pulse * 0.12;
        whale.set('whale_wave').at(-0.65, 0, 0.8).lift(hop);
        dou.set('doubao_cage_1').at(0.75, 0, 0.8).lift(hop * 0.8);
        umb.position.set(0.05, UMB_Y + hop * 0.6, 0.75); umb.rotation.z = 0.1;
        hearts.forEach((s, i) => { const ph = (u * 1.1 + hash(i + 3)) % 1, a = (i / 12) * PI * 2; s.position.set(0.05 + Math.cos(a) * (1.0 + ph * 1.6), 2.4 + ph * 2.6 + Math.sin(a) * 0.5, 0.6 + Math.sin(a) * 0.4); setOp(s, Math.sin(ph * PI) * 0.95); });
        setOp(glow, 0.25 + 0.2 * bt.pulse);
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'L14', look: 'rain', title: '一滴滴累积', cast: ['whale', 'doubao'],
    note: '窗台上排开三只器皿：蓝饭盆、杯子、罐子。雨滴按八分音符轮流落进去，水面一格一格往上涨。两个人在窗里看着。',
    build: (k) => {
      const W = windowStage(k);
      const whale = k.actor('whale'), dou = k.actor('doubao');
      const vs = [vessel(0.24, 0.2, 0x3d7fd9), vessel(0.13, 0.26, 0xffffff, 0.8), vessel(0.17, 0.34, 0xffd9a0, 0.85)];
      const xs = [-0.75, 0.05, 0.8];
      vs.forEach((v, i) => k.add(v.g, xs[i], SILL, 0.38));
      const drops = many(3, () => k.add(sprite('drop', 0.18, 0xe4f2ff)));
      const rings = many(3, () => { const r = ringOne(); k.add(r.m); return r; });
      const A = cam([0.3, 2.05, 5.0], [0, 1.75, 0], 26), B = cam([-0.1, 1.95, 4.5], [0, 1.7, 0], 26);
      return ({ u, T }) => {
        W.tick(T, 0.9);
        whale.front(T).at(-1.0, INSIDE_Y, -1.0);
        dou.set(T % 2.4 < 0.14 ? 'doubao_cage_1' : 'doubao_cage_0').at(1.0, INSIDE_Y, -1.0);
        const e = (T - S[13]) / EIGHTH; // 开口后过了几个八分音符
        vs.forEach((v, i) => {
          const x = (e - i) / 3, fl = Math.floor(x), ph = x - fl, landed = Math.max(0, fl + 1);
          const lv = clamp01(0.14 + 0.24 * (landed > 0 ? landed - 1 + ease(seg(ph, 0, 0.35)) : 0));
          v.set(lv);
          const surf = SILL + 0.03 + lv * (v.h - 0.05), fall = seg(ph, 0.5, 1);
          drops[i].position.set(xs[i], lerp(SILL + 2.2, surf, fall * fall), 0.38); setOp(drops[i], fall > 0 ? 1 : 0);
          rings[i].m.position.set(xs[i], surf + 0.012, 0.38); rings[i].set(landed > 0 ? ph * 2.4 : 1, v.r * 0.7);
        });
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'L15', look: 'cozy', title: '储存爱你的记忆', cast: ['whale', 'doubao', 'kimi', 'qwen', 'zai'],
    note: '从千问茶桌上的热气起，镜头拉开到整间屋：湿气往上飘，玻璃起雾，雾上显出一颗手画的心；Kimi 站在记忆绳下，一动不动地记着所有人。',
    build: (k) => {
      const R = roomSet(k);
      const whale = k.actor('whale'), dou = k.actor('doubao'), kimi = k.actor('kimi'), qwen = k.actor('qwen'), zai = k.actor('zai');
      const zz = many(3, () => k.add(sprite('zzz', 0.34, 0xffffff)));
      const hw = k.add(heartMark(1.5, '#6f8fbf', true), RWIN.x - 0.95, RWIN.y + RWIN.h * 0.56, RWIN.z + 0.01);
      const damp = steamFx(8, 3.2, 0.9); k.add(damp.g, POS.table[0] - 0.4, 0.95, POS.table[2] + 0.2);
      const A = cam([3.4, 1.7, 0.9], [4.3, 1.25, -2.3], 34), B = cam([0, 2.6, 8.2], [0, 2.5, -4], 36), C = cam([0, 2.6, 7.4], [0.2, 2.5, -4], 36);
      return ({ u, T }) => {
        R.tick(T, 0.9); damp.set(T, 0.8);
        R.fog.visible = true; mat(R.fog).opacity = 0.35 + 0.2 * u;
        mat(hw).opacity = ease(seg(u, 0.4, 0.75)) * 0.95; hw.visible = u > 0.4;
        if (u > 0.4 && u < 0.78) whale.set('whale_point'); else whale.front(T);
        whale.at(-1.0, 0, -3.4);
        dou.set(T % 2.4 < 0.14 ? 'doubao_cage_1' : 'doubao_cage_0').at(2.9, 0, -3.5);
        kimi.front(T).at(POS.kimi[0], POS.kimi[1], POS.kimi[2]);
        qwen.front(T).at(POS.qwen[0], POS.qwen[1], POS.qwen[2]);
        zai.set('zai_front_1').at(POS.zai[0], POS.zai[1], POS.zai[2]).tilt(0.08).sq(0.03 * Math.sin(T * 1.6));
        zz.forEach((s, i) => { const ph = (T * 0.35 + i / 3) % 1; s.position.set(POS.zai[0] + 0.6 + ph * 0.5, POS.zai[1] + 1.5 + ph * 0.9, POS.zai[2]); s.scale.setScalar(0.2 + ph * 0.26); setOp(s, Math.sin(ph * PI)); });
        return track([[0, A], [0.58, B], [1, C]], u);
      };
    },
  },
  {
    id: 'L16', look: 'rain', title: '雨能下不停（有人陪）', cast: ['whale', 'doubao', 'gemini'],
    note: '同一句词，第一次是她一个人淋着；这一次从低处仰拍：黄伞下两个人，透明伞下一个人，错开拍子一颠一颠。',
    build: (k) => {
      const L = lane(k, { rainN: 300 });
      const whale = k.actor('whale'), dou = k.actor('doubao'), gem = k.actor('gemini');
      const umb = k.add(umbrella(1.3, 0xffd166, 1.5)), clr = k.add(clearUmbrella(1.2, 1.5));
      const A = cam([-0.4, 0.8, 6.6], [0.6, 2.0, 0.6], 44), B = cam([1.6, 1.1, 7.6], [1.0, 2.3, 0.4], 44);
      return ({ u, T, bt }) => {
        L.tick(T, 1);
        const h0 = bt.idx % 2 === 0 ? bt.pulse : 0, h1 = bt.idx % 2 === 1 ? bt.pulse : 0;
        whale.set('whale_wave').at(-0.65, 0, 0.8).lift(h0 * 0.22);
        dou.set('doubao_cage_1').at(0.75, 0, 0.8).lift(h1 * 0.18);
        gem.front(T).at(3.0, 0, 0.5).lift(h0 * 0.2);
        umb.position.set(0.05, UMB_Y, 0.75); umb.rotation.z = 0.1 + 0.03 * Math.sin(T * 2);
        clr.position.set(3.1, UMB_Y, 0.48); clr.rotation.z = 0.04 + 0.03 * Math.sin(T * 2 + 1);
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'L17a', look: 'cozy', title: '雨爱的秘密', cast: ['whale', 'kimi'],
    note: '还是窗台上那本本子。这回本鲸把一颗心放进去，合上；Kimi 的习性是「把漏掉的找回来」——她给这一页夹上一枚书签。',
    build: (k) => {
      const R = roomSet(k);
      const whale = k.actor('whale'), kimi = k.actor('kimi');
      const nb = notebook(0.56, 0.4, 0x7a4a6c); k.add(nb.g, 0.5, RWIN.y, RWIN.z + 0.34, 0.2, 1.6);
      const heart = k.add(sprite('heart', 0.34, 0xff8fb0));
      const mark = k.add(box(0.07, 0.014, 0.34, 0xffd166, 0.01), 1.02, RWIN.y + 0.1, RWIN.z + 0.62);
      const star = k.add(sprite('star', 0.5, 0xfff2a8, true), 1.02, RWIN.y + 0.3, RWIN.z + 0.8);
      const A = cam([0.95, 2.0, -0.5], [0.3, 1.25, -4.3], 42), B = cam([0.88, 1.97, -0.62], [0.3, 1.25, -4.3], 42);
      return ({ u, T }) => {
        R.tick(T, 0.9);
        const drop = ease(seg(u, 0.05, 0.4)), close = ease(seg(u, 0.38, 0.64)), pop = seg(u, 0.68, 0.84);
        nb.cover.rotation.z = lerp(1.9, 0, close);
        heart.position.set(0.92, RWIN.y + lerp(0.95, 0.16, drop), RWIN.z + 0.4); setOp(heart, u < 0.52 ? 1 : 0);
        mark.scale.setScalar(Math.max(0.001, backOut(pop))); mark.visible = pop > 0;
        setOp(star, Math.sin(pop * PI) * 0.95);
        if (u < 0.45) whale.set('whale_point'); else whale.front(T);
        whale.at(-0.55, 0, -3.6);
        kimi.set(u < 0.84 ? 'kimi_side_0' : 'kimi_front_0').flip(u < 0.84).at(1.75, 0, -3.6);
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'L17b', look: 'blue', title: '能一直延续', cast: ['whale', 'doubao'],
    note: '顺着河往远处看：那只纸船还在往前漂，河面上的小灯一盏接一盏亮到尽头；两个人撑着伞，沿着河沿跟着走。',
    build: (k) => {
      const L = lane(k);
      const whale = k.actor('whale'), dou = k.actor('doubao');
      const umb = k.add(umbrella(1.3, 0xffd166, 1.5));
      const boat = k.add(paperBoat(), 0, 0, 0, 0, 0.2);
      const bl = k.add(sprite('glow', 0.9, 0xffd88a, true, 0.85));
      const lights = many(8, (i) => { const l = lantern(0xffd88a, 0.08); k.add(l, 2.5 + i * 2.6, 0.2, 3.5); return l.children[1] as THREE.Sprite; });
      const A = cam([-7.5, 1.5, 4.6], [8, 0.6, 2.6], 40), B = cam([-6.0, 1.7, 4.8], [9, 0.6, 2.4], 40);
      return ({ u, T }) => {
        L.tick(T, 0.8);
        const bx = lerp(-3.6, 1.2, u);
        boat.position.set(bx, 0.1 + Math.sin(T * 2.3) * 0.03, 3.5); boat.rotation.y = 0.1; boat.rotation.z = Math.sin(T * 1.7) * 0.05;
        bl.position.set(bx, 0.45, 3.5);
        lights.forEach((s, i) => { const on = ease(seg(u, i * 0.1, i * 0.1 + 0.22)); s.scale.setScalar(0.3 + on * 1.3); setOp(s, 0.12 + on * 0.8); });
        L.lamps.forEach((l, i) => setOp(l.glow, 0.3 + 0.6 * ease(seg(u, i * 0.16, i * 0.16 + 0.3))));
        whale.walkX(-2.2, 0.2, u, 0, 1.5);
        dou.walkX(-0.9, 1.5, u, 0, 1.5);
        umb.position.set(lerp(-1.55, 0.85, u), UMB_Y, 1.45); umb.rotation.z = 0.05;
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'L18a', look: 'rain', title: '我相信我将会看到', cast: ['whale', 'doubao', 'gpt'],
    note: '龙娘只从画面上沿掠过（她的影子扫过地面），雨跟着变小，一束光落在两个人身上。豆包把伞往旁边一歪——不用撑了。',
    build: (k) => {
      const L = lane(k);
      const whale = k.actor('whale'), dou = k.actor('doubao'), gpt = k.actor('gpt', 0.8);
      const umb = k.add(umbrella(1.3, 0xffd166, 1.5));
      const beam = k.add(lightBeam(0.9, 3.0, 14), 0, 0, 0.7);
      const shade = new THREE.Mesh(new THREE.CircleGeometry(1, 28).rotateX(-PI / 2), glowMat(0x1c2440, 0.34)); shade.scale.set(3.2, 1, 1.5); k.add(shade);
      const A = cam([0.3, 1.7, 8.2], [0.2, 1.7, -5], 46), B = cam([0, 1.75, 8.8], [0, 1.8, -5], 46);
      return ({ u, T }) => {
        const stop = ease(seg(u, 0.15, 0.85));
        L.tick(T, 1 - 0.85 * stop);
        const fly = seg(u, 0.05, 0.6), flying = fly > 0 && fly < 1;
        gpt.set(Math.floor(T * 5) % 2 ? 'gpt_fly_1' : 'gpt_fly_0').at(lerp(-9, 9, fly), 5.4 + Math.sin(fly * PI) * 0.5, -2.5).noShadow().alpha(flying ? 1 : 0);
        shade.position.set(lerp(-8, 8, fly), 0.07, 0.9); mat(shade).opacity = flying ? 0.34 : 0; shade.visible = flying;
        mat(beam).opacity = 0.17 * ease(seg(u, 0.42, 0.95));
        const aside = ease(seg(u, 0.5, 0.9));
        whale.set(u > 0.55 ? 'whale_wave' : 'whale_idle').at(-0.65, 0, 0.8);
        dou.set(u > 0.7 ? 'doubao_cage_1' : 'doubao_cage_0').at(0.75, 0, 0.8);
        umb.position.set(lerp(0.05, 1.0, aside), UMB_Y, 0.75); umb.rotation.z = lerp(0.1, -0.62, aside);
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'L18b', look: 'clear', title: '彩虹的美丽', cast: ['whale', 'doubao', 'gemini'], fx: { whiteIn: true },
    note: '闪白之后雨停了。彩虹从左到右一笔画过整片天；三个人站在路上仰头看，两把伞立在一边。',
    build: (k) => {
      const L = lane(k, { clear: true });
      const rb = rainbow(21, 0.7); k.add(rb.g, 0, -1.5, -42);
      const whale = k.actor('whale'), dou = k.actor('doubao'), gem = k.actor('gemini');
      const umb = k.add(umbrella(1.3, 0xffd166, 1.5)), clr = k.add(clearUmbrella(1.2, 1.5));
      const sparks = many(18, (i) => k.add(sprite('star', 0.3, i % 2 ? 0xffffff : 0xfff2a8, true)));
      const A = cam([0, 2.2, 10.5], [0, 2.2, -12], 46), B = cam([0, 3.0, 15], [0, 3.0, -12], 46);
      return ({ u, T, bt }) => {
        L.tick(T, 0);
        rb.set(ease(seg(u, 0.04, 0.6)), 1);
        whale.set('whale_wave').at(-1.2, 0, 0.8).lift(bt.pulse * 0.14);
        dou.set(u > 0.5 ? 'doubao_cage_1' : 'doubao_cage_0').at(0.4, 0, 0.8);
        gem.front(T).at(2.2, 0, 0.6);
        umb.position.set(-3.2, 0, -0.3); umb.rotation.z = 0.1;
        clr.position.set(3.9, 0, -0.3); clr.rotation.z = -0.1;
        sparks.forEach((s, i) => { const ph = (T * 0.4 + hash(i)) % 1; s.position.set((hash(i + 5) - 0.5) * 16, 0.6 + hash(i + 9) * 6, (hash(i + 13) - 0.5) * 5); s.scale.setScalar(0.12 + 0.3 * Math.sin(ph * PI)); setOp(s, Math.sin(ph * PI) * 0.9); });
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'L19', look: 'sunroom', title: '储存爱你的记忆（放晴）', cast: ['kimi', 'zai', 'qwen'],
    note: '同一句词唱第二遍：屋里的雾散了。镜头顺着记忆绳走——Kimi 夹上最新的一张（彩虹），狐狸醒了——最后停在窗口：小克那只茶杯还冒着热气，窗外是彩虹。',
    build: (k) => {
      const R = roomSet(k, { clear: true });
      const rb = rainbow(7, 0.28); k.add(rb.g, 1.3, -1.0, -30);
      const kimi = k.actor('kimi'), zai = k.actor('zai'), qwen = k.actor('qwen');
      const [px, py, pz] = photoAt(5);
      const newP = k.add(rainbowPhoto(), px, py, pz);
      const clip = k.add(box(0.05, 0.1, 0.03, 0xd9773b, 0), px, py + 0.33, pz + 0.02);
      const star = k.add(sprite('star', 0.6, 0xfff2a8, true), px, py, pz + 0.1);
      // Kimi 够不着绳子：脚下垫一只小凳（这样她的脸也在歌词条上方）
      const STOOL = 0.55;
      k.add(box(0.95, STOOL, 0.6, 0xb9824f, 0.03), POS.kimi[0], 0, POS.kimi[2]);
      const shaft = new THREE.Mesh(new THREE.PlaneGeometry(RWIN.w, 5), glowMat(0xfff0c0, 0.16, true)); shaft.rotation.x = -0.6435; k.add(shaft, RWIN.x, 2.0, -2.9);
      const A = cam([-3.6, 2.4, 2.4], [-3.6, 2.45, -4.4], 38), B = cam([0.0, 2.7, 3.2], [0.2, 2.2, -4.5], 36);
      return ({ u, T }) => {
        R.tick(T, 0); rb.set(1, 0.95);
        const pop = seg(u, 0.22, 0.36);
        newP.scale.setScalar(Math.max(0.001, backOut(pop))); newP.visible = pop > 0; clip.visible = pop > 0.5;
        setOp(star, Math.sin(pop * PI) * 0.95);
        kimi.set(u < 0.4 ? 'kimi_side_0' : 'kimi_front_0').at(POS.kimi[0], STOOL, POS.kimi[2]);
        qwen.front(T).at(POS.qwen[0], POS.qwen[1], POS.qwen[2]);
        zai.front(T).at(POS.zai[0], POS.zai[1], POS.zai[2]).lift(Math.abs(Math.sin(seg(u, 0.3, 0.6) * PI * 2)) * 0.2);
        mat(shaft).opacity = 0.1 + 0.1 * u;
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'L20', look: 'shower', title: '雨能下不停（太阳雨）', cast: ['zai', 'whale', 'doubao', 'gemini', 'kimi'],
    note: '第三次唱这一句：太阳雨。五个人都跑出来踩水，相邻两人错开一拍起跳，落地就溅起一圈水花；身后挂着彩虹。',
    build: (k) => {
      const L = lane(k, { clear: true, rainN: 150, rainColor: 0xfff0c0 });
      const rb = rainbow(21, 0.7); k.add(rb.g, 0, -1.5, -42);
      const ids: [CharId, number][] = [['zai', -3.7], ['whale', -1.75], ['doubao', -0.05], ['gemini', 1.6], ['kimi', 3.25]];
      const as = ids.map(([id]) => k.actor(id));
      const splash = many(5, () => many(5, () => k.add(sprite('drop', 0.15, 0xffffff))));
      const A = cam([-0.6, 1.5, 9.6], [-0.2, 1.6, 0.5], 38), B = cam([0.6, 1.9, 10.4], [0.2, 1.8, 0.5], 38);
      return ({ u, T, bt }) => {
        L.tick(T, 0.5); rb.set(1, 0.9);
        as.forEach((a, i) => {
          const [id, x] = ids[i];
          const mine = (bt.idx + i) % 2 === 0, air = Math.sin(Math.min(1, bt.phase * 1.25) * PI);
          const pose = happy(id);
          if (pose) a.set(pose); else a.front(T);
          a.at(x, 0, 0.8).lift(mine ? air * 0.5 : 0).sq(mine ? -0.05 * air : 0);
          splash[i].forEach((s, j) => { const ang = (j / 4) * PI, ph = bt.phase; s.position.set(x + Math.cos(ang) * (0.25 + ph * 0.6), 0.08 + Math.sin(ph * PI) * 0.35, 0.95); setOp(s, mine ? 0 : (1 - ph) * 0.9); });
        });
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'L21', look: 'clear', title: '秘密一直延续', cast: ['whale', 'claude', 'doubao'],
    note: '小克自己走回来了，手里是当初那把红伞。本鲸愣了一下，迎上去；这一次是小克把伞往她这边挪——和导歌那一镜正好反过来。',
    build: (k) => {
      const L = lane(k, { clear: true });
      const rb = rainbow(21, 0.7); k.add(rb.g, 0, -1.5, -42);
      const whale = k.actor('whale'), claude = k.actor('claude'), dou = k.actor('doubao');
      const umb = k.add(umbrella(1.25, 0xe85d75, 1.5));
      const hearts = many(5, () => k.add(sprite('heart', 0.3, 0xff8fb0)));
      const A = cam([1.4, 1.8, 9.4], [1.0, 1.35, 0.8], 36), B = cam([0.6, 1.7, 7.4], [0.65, 1.4, 0.8], 34);
      return ({ u, T }) => {
        L.tick(T, 0); rb.set(1, 0.9);
        const come = seg(u, 0, 0.6), meet = seg(u, 0.24, 0.6), share = ease(seg(u, 0.62, 0.82));
        if (come < 1) claude.walkX(7.4, 1.5, come, 0, 0.8); else claude.set('claude_front_1').at(1.5, 0, 0.8);
        umb.position.set(lerp(7.4, 1.5, come) - share * 0.85, UMB_Y, 0.75); umb.rotation.z = lerp(0.05, 0.1, share);
        if (meet <= 0) whale.front(T).at(-2.6, 0, 0.8).lift(Math.sin(seg(u, 0.12, 0.24) * PI) * 0.2);
        else if (meet < 1) whale.walkX(-2.6, -0.2, meet, 0, 0.8);
        else whale.set('whale_wave').at(-0.2, 0, 0.8);
        dou.set(u > 0.62 ? 'doubao_cage_1' : 'doubao_cage_0').at(-2.9, 0, -0.9);
        hearts.forEach((s, i) => { const ph = seg(u, 0.66 + i * 0.05, 0.96 + i * 0.008); s.position.set(0.65 + (i - 2) * 0.42, 2.3 + ph * 1.5, 0.9); setOp(s, Math.sin(ph * PI)); });
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'L22a', look: 'clear', title: '合影前', cast: ['zai', 'kimi', 'gemini', 'whale', 'claude', 'doubao', 'qwen', 'grok', 'gpt'],
    note: '所有人从两边走到位。Grok 的习性是「先查证」——她架起相机对着大家和彩虹；龙娘又一次只从画面上沿飞过，光压满整个画面。',
    build: (k) => {
      const L = lane(k, { clear: true });
      const rb = rainbow(21, 0.7); k.add(rb.g, 0, -1.5, -42);
      const as = GROUP.map((g) => k.actor(g.id));
      const gpt = k.actor('gpt', 0.8);
      k.add(tripodCam(), TRIPOD[0], TRIPOD[1], TRIPOD[2]);
      const sun = k.add(sprite('glow', 16, 0xfff0b0, true, 0), 0, 7.5, -3);
      const A = cam([-0.2, 1.85, 9.6], [-0.2, 1.85, -12], 46), B = cam([-0.2, 1.85, 9.2], [-0.2, 1.85, -12], 46);
      return ({ u, T }) => {
        L.tick(T, 0); rb.set(1, 0.9);
        as.forEach((a, i) => {
          const g = GROUP[i], p = seg(u, i * 0.03, 0.56 + i * 0.03);
          if (g.from !== g.x && p < 1) a.walkX(g.from, g.x, p, 0, GROUP_Z);
          else { if (g.id === 'grok') a.set('grok_side_0').flip(); else a.front(T); a.at(g.x, 0, GROUP_Z); }
        });
        const fly = seg(u, 0.2, 0.9), flying = fly > 0 && fly < 1;
        gpt.set(Math.floor(T * 5) % 2 ? 'gpt_fly_1' : 'gpt_fly_0').flip().at(lerp(10, -10, fly), 5.2 + Math.sin(fly * PI) * 0.4, -2.5).noShadow().alpha(flying ? 1 : 0);
        setOp(sun, 0.5 * Math.sin(clamp01(fly) * PI));
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'L22b', look: 'clear', title: '彩虹的美丽（合影）', cast: ['zai', 'kimi', 'gemini', 'whale', 'claude', 'doubao', 'qwen', 'grok'], fx: { flash: [0] },
    note: '「彩虹」两个字一出口就是快门的闪白。八个人原地挨个起跳，像一道人浪；镜头往后退，把整道彩虹让出来。',
    build: (k) => {
      const L = lane(k, { clear: true });
      const rb = rainbow(21, 0.7); k.add(rb.g, 0, -1.5, -42);
      const as = GROUP.map((g) => k.actor(g.id));
      k.add(tripodCam(), TRIPOD[0], TRIPOD[1], TRIPOD[2]);
      const sparks = many(20, (i) => k.add(sprite('star', 0.3, i % 2 ? 0xffffff : 0xfff2a8, true)));
      const A = cam([-0.2, 1.85, 9.2], [-0.2, 1.85, -12], 46), B = cam([-0.2, 2.3, 11.5], [-0.2, 2.6, -12], 46);
      return ({ u, T }) => {
        L.tick(T, 0); rb.set(1, 1);
        as.forEach((a, i) => {
          const g = GROUP[i];
          const pose = happy(g.id);
          if (pose) a.set(pose); else a.front(T);
          if (g.id === 'grok') a.flip();
          const w = Math.max(0, Math.sin((T - S[21]) * (PI / EIGHTH / 2) - i * 0.7)); // 人浪：每人晚一点起跳
          a.at(g.x, 0, GROUP_Z).lift(g.id === 'grok' ? 0 : w * 0.34);
        });
        sparks.forEach((s, i) => { const ph = (T * 0.45 + hash(i)) % 1; s.position.set((hash(i + 5) - 0.5) * 18, 0.6 + hash(i + 9) * 7, (hash(i + 13) - 0.5) * 5); s.scale.setScalar(0.12 + 0.34 * Math.sin(ph * PI)); setOp(s, Math.sin(ph * PI) * 0.9); });
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'OUT', look: 'shower', title: '雨停了', cast: ['whale', 'claude'], fx: { blackOut: true },
    note: '尾声：窗台上的蓝饭盆接满了雨，里面漂着那只小纸船；红伞靠在门边晾着。窗里两个人对着喝茶。镜头退开，彩虹还在屋顶上。',
    build: (k) => {
      const W = windowStage(k, { clear: true });
      const rb = rainbow(30, 0.7); k.add(rb.g, 0.4, -1.5, -42);
      const whale = k.actor('whale'), claude = k.actor('claude');
      const bowl = vessel(0.24, 0.2); k.add(bowl.g, 0.95, SILL, 0.38);
      const boat = k.add(paperBoat(), 0.95, SILL + 0.17, 0.38, 0, 0.045);
      const umb = k.add(umbrella(1.1, 0xe85d75, 1.5), 2.6, 0, 0.9); umb.rotation.z = -0.3;
      const steam = steamFx(5, 1.0, 0.18); k.add(steam.g, 0.05, SILL + 0.2, -0.5);
      const A = cam([1.9, 1.9, 3.7], [0.55, 1.5, 0.2], 26), A2 = cam([1.8, 1.92, 3.9], [0.52, 1.5, 0.2], 26), B = cam([0.4, 3.2, 19], [0.4, 9.6, -6], 44), B2 = cam([0.4, 3.3, 20.5], [0.4, 9.9, -6], 44);
      return ({ u, T }) => {
        W.tick(T, 0); rb.set(1, 0.9); steam.set(T, 0.9);
        bowl.set(0.92);
        boat.rotation.y = T * 0.4; boat.position.y = SILL + 0.165 + Math.sin(T * 2) * 0.006;
        whale.front(T).at(-1.0, INSIDE_Y, -1.0);
        claude.set(T % 3.1 < 1.2 ? 'claude_front_1' : 'claude_front_0').at(1.0, INSIDE_Y, -1.0);
        return track([[0, A], [0.14, A2], [0.5, B], [1, B2]], u);
      };
    },
  },
];
