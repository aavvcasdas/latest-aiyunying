// 镜头表（下）：雨后重唱 L19–L23 · 尾声 OUT
// 同一段副歌再唱一遍，但雨已经停了：饭盆接满了、雾被擦开、太阳雨里大家一起踩水、伞让给了对方、最后在彩虹下合一张影。
import * as THREE from 'three';
import { cam, glide, track, type ShotDef } from '@tpl/core';
import type { CharId } from '@tpl/actors';
import { backOut, basic, cyl, ease, hash, lerp, paperBoat, seg, setOp, sprite } from '@tpl/kit';
import { cameraProp } from '@tpl/props';
import {
  BROLLY, CANAL_Z, FRAMES, PI, TABLE, WIN, beatSq, beats, brolly, frac, holdBrolly, lane, makeRain, many, parlor, rainBowl, rainOp, rainbow, ripple,
  setRipple, steam, tb, wallFrames,
} from './common';

const CLEAR = { clouds: null, ground: 0x86aac6, hills: [0x86c49a, 0x7fb8d0] as [number, number], lamp: 0.1 };
const dripPh = (T: number, slot: number) => frac(beats(T) - slot * 0.5);
const fallY = (ph: number, top: number, bottom: number) => lerp(top, bottom, seg(ph, 0.62, 1) ** 2);
/** 彩虹下站成一排的八个人（龙娘不在队里：她在天上） */
const ROW: [CharId, number, number][] = [['doubao', -5.7, -0.2], ['kimi', -4.3, -0.5], ['gemini', -2.8, -0.2], ['whale', -0.9, 0.2], ['claude', 0.8, 0.2], ['qwen', 2.4, -0.3], ['zai', 3.8, -0.5]];

export const SHOTS_C: ShotDef[] = [
  {
    id: 'L19', look: 'afterRain', title: '窗外的雨滴 一滴滴累积（雨后）', cast: ['whale'],
    note: '重唱「窗外的雨滴，一滴滴累积」——还是那只蓝饭盆，已经快接满了。屋檐上最后几滴水落进去，水面亮晶晶的。',
    build: (k) => {
      const p = parlor(k, { outside: 0x86aac6, lamp: 0.1 });
      k.add(new THREE.Mesh(new THREE.PlaneGeometry(15, 7), basic(0xffe6bd)), 0, 2.8, 4.6, PI);
      const bowl = rainBowl(0.36); k.add(bowl.g, 1.6, WIN.y, -4.85);
      const whale = k.actor('whale');
      const drip = many(2, () => k.add(sprite('drop', 0.2, 0xeaf6ff)));
      const glint = many(4, () => k.add(sprite('star', 0.3, 0xffffff, true)));
      const A = cam([2.5, 1.8, -7.2], [1.55, 1.42, -4.7], 28), B = cam([2.0, 1.72, -6.5], [1.6, 1.4, -4.75], 27);
      return ({ u, T }) => {
        p.rain.set(T); rainOp(p.rain, 0); p.setGlass(T, 0.4); p.setFog(0);
        const level = lerp(0.82, 0.92, u), wy = WIN.y + 0.36 * (0.22 + 0.6 * level);
        bowl.set(level + 0.02 * Math.exp(-frac(beats(T) * 2) * 5));
        drip.forEach((d, i) => { const ph = dripPh(T, i); d.position.set(1.6 + (i ? 0.07 : -0.07), fallY(ph, WIN.y + 2.9, wy + 0.08), -4.85); setOp(d, ph > 0.62 ? 1 : 0); });
        glint.forEach((s, i) => { const ph = frac(T * 1.2 + i / 4); s.position.set(1.6 + (hash(i) - 0.5) * 0.5, wy + 0.12 + hash(i + 2) * 0.1, -4.9); s.scale.setScalar(0.12 + 0.25 * Math.sin(ph * PI)); setOp(s, Math.sin(ph * PI)); });
        whale.front(T).at(0.2, 0, -3.7);
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'L20', look: 'golden', title: '屋内的湿气像储存爱你的记忆（雨后）', cast: ['whale', 'claude', 'kimi', 'qwen', 'zai'],
    note: '重唱「屋内的湿气像储存爱你的记忆」——本鲸把玻璃上的雾擦开：窗外是彩虹，小克在外面朝她挥手。镜头摇到相框墙，Kimi 挂上了一张新的：彩虹下的两个人。狐狸醒了。',
    build: (k) => {
      const p = parlor(k, { outside: 0x9ab87a, lamp: 0.1 });
      const fr = wallFrames(k, ['sun', 'cloud', 'rain', 'bow', 'warm']);
      const bow = rainbow(15, 0.62); k.add(bow.g, 0.9, -2.5, -34);
      const st = steam(k);
      const whale = k.actor('whale'), claude = k.actor('claude'), kimi = k.actor('kimi'), qwen = k.actor('qwen'), zai = k.actor('zai');
      const CELLS = ['p_claude_neutral', 'p_claude_dizzy', 'p_claude_petri'];
      const faces = CELLS.map((cell) => ({ cell, a: k.actor('claude', 0.7) }));
      const duo = [{ cell: 'p_whale_neutral', a: k.actor('whale', 0.4), dx: -0.24 }, { cell: 'p_claude_neutral', a: k.actor('claude', 0.4), dx: 0.24 }];
      const heart = k.add(sprite('heart', 0.9, 0xffffff));
      const glow = k.add(sprite('glow', 2.8, 0xfff1c4, true, 0));
      const A = cam([0.0, 2.0, 5.0], [0.5, 2.0, -4.5], 36), A2 = cam([0.4, 1.9, 2.6], [0.7, 2.0, -4.5], 36), B = cam([-3.2, 2.0, 4.6], [-4.0, 2.0, -4.5], 38);
      return ({ u, T, bt }) => {
        p.rain.set(T); rainOp(p.rain, 0); p.setGlass(T, 0.3);
        const wipe = ease(seg(T, tb(120), tb(122)));
        p.setFog(lerp(0.6, 0, wipe));
        bow.set(1, 0.8);
        heart.position.set(WIN.x + 0.9, WIN.y + 1.9, WIN.z + 0.06); setOp(heart, (1 - wipe) * 0.95);
        st(T, 0.7);
        whale.set(wipe > 0.05 && wipe < 1 ? 'whale_wave' : T % 2.6 < 0.13 ? 'whale_blink' : 'whale_idle').at(-0.6 + Math.sin(wipe * PI * 3) * 0.25, 0, -3.3);
        claude.set('claude_front_1').at(1.9, -0.2, -7.6).lift(Math.abs(Math.sin(beats(T) * PI)) * 0.3);
        faces.forEach(({ cell, a }, i) => a.set(cell).at(FRAMES[i][0], FRAMES[i][1] - 0.47, WIN.z + 0.14).noShadow());
        const pop = backOut(seg(T, tb(124.5), tb(124.5) + 0.3)); // Kimi 挂上新相框：落在拍上
        fr[3].scale.setScalar(Math.max(0.001, pop)); fr[3].rotation.z = Math.sin(T * 5) * 0.04 * pop;
        duo.forEach(({ cell, a, dx }) => a.set(cell).at(FRAMES[3][0] + dx, FRAMES[3][1] - 0.42, WIN.z + 0.14).size(Math.max(0.001, pop)).alpha(pop > 0.02 ? 1 : 0).noShadow());
        glow.position.set(FRAMES[3][0], FRAMES[3][1], WIN.z + 0.3); setOp(glow, pop * (0.35 + 0.3 * bt.pulse));
        kimi.front(T).at(-5.8, 0, -3.3).sq(pop > 0 ? beatSq(bt, 0.04) : 0);
        qwen.front(T).at(TABLE.x + 0.5, 0, TABLE.z - 0.95);
        zai.front(T).at(-5.3, 0, -1.4).sq(beatSq(bt, 0.03)); // 醒了，走到相框墙边
        return track([[0, A], [0.46, A2], [1, B]], u);
      };
    },
  },
  {
    id: 'L21', look: 'afterRain', title: '真希望雨能下不停（太阳雨）', cast: ['whale', 'claude', 'doubao', 'gemini', 'zai', 'kimi'],
    note: '重唱「真希望雨能下不停」——太阳雨。大家站成一排踩水洼，一个整拍跳、一个半拍跳，水花此起彼伏。',
    build: (k) => {
      lane(k, CLEAR);
      const bow = rainbow(30, 1.25); k.add(bow.g, 0, -3, -46);
      const r = makeRain(k, 120, 22, 7, 0, -1.5, 9, 0xfff6d8);
      const ids: CharId[] = ['doubao', 'gemini', 'whale', 'claude', 'zai', 'kimi'];
      const gang = ids.map((id, i) => ({ a: k.actor(id), x: -4.6 + i * 1.85, rg: k.add(ripple()) }));
      const A = cam([0.1, 1.6, 9.8], [0.1, 1.5, 0], 40), B = cam([0.1, 2.7, 11.8], [0.1, 2.3, 0], 42);
      return ({ u, T }) => {
        r.set(T); rainOp(r, 0.4);
        bow.set(1, 0.8);
        gang.forEach(({ a, x, rg }, i) => {
          const c = beats(T) + (i % 2) * 0.5, hop = Math.abs(Math.sin(c * PI));
          if (a.id === 'whale') a.set('whale_wave'); else if (a.id === 'claude') a.set('claude_front_1'); else a.front(T);
          a.at(x, 0, 0.3 - (i % 2) * 0.5).lift(hop * 0.5).sq(-0.04 * (1 - hop));
          setRipple(rg, x, 0.35 - (i % 2) * 0.5, frac(c), 0.8);
        });
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'L22', look: 'afterRain', title: '雨爱的秘密能一直延续（雨后）', cast: ['whale', 'claude'],
    note: '重唱「雨爱的秘密能一直延续」——本鲸把蓝伞推到小克那边（她的习惯：好东西先推出去），然后两个人沿着水渠并排往前走，纸船跟在旁边漂。',
    build: (k) => {
      lane(k, CLEAR);
      const whale = k.actor('whale'), claude = k.actor('claude');
      const um = brolly(k, BROLLY.whale, 1.3);
      const boats = many(5, () => { const b = k.add(paperBoat()); b.scale.setScalar(0.27); return b; });
      const hearts = many(4, (i) => k.add(sprite('heart', 0.3, i % 2 ? 0xff8fab : 0xffc2d1)));
      const A = cam([-2.9, 1.8, 8.0], [-2.9, 1.2, 1.2], 34), B = cam([3.8, 2.3, 9.8], [2.8, 1.1, 1.4], 36);
      return ({ u, T, bt }) => {
        const give = ease(seg(T, tb(132.5), tb(134))), go = seg(u, 0.3, 1), d = go * 6.2;
        const cx = -3.7 + d, wx = -2.2 + d;
        if (go > 0) { claude.walkBy(d).at(cx, 0, 1.2); whale.walkBy(d + 0.4).at(wx, 0, 1.2); }
        else { claude.front(T).at(cx, 0, 1.2); whale.set(give > 0.1 ? 'whale_point' : 'whale_idle').flip(give > 0.1).at(wx, 0, 1.2); }
        holdBrolly(um, lerp(wx, cx, give), 0.06 * bt.pulse, 1.2, lerp(0.1, 0.04, give), lerp(0.38, -0.1, give));
        boats.forEach((b, i) => { b.position.set(-6 + i * 2.6 + u * 5.2, 0.1 + Math.sin(T * 2.2 + i) * 0.03, CANAL_Z); b.rotation.set(0, 0, Math.sin(T * 1.7 + i) * 0.05); });
        hearts.forEach((h, i) => { const ph = frac(beats(T) * 0.5 + i / 4); h.position.set((cx + wx) / 2 - 0.3 - i * 0.3, 1.9 + ph * 1.2, 1.25); h.scale.setScalar(0.18 + 0.2 * Math.sin(ph * PI)); setOp(h, give * Math.sin(ph * PI)); });
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'L23a', look: 'afterRain', title: '我相信 我将会看到', cast: ['whale', 'claude', 'doubao', 'kimi', 'gemini', 'qwen', 'zai'],
    note: '重唱「我相信，我将会看到」——大家在彩虹下站成一排，一个接一个踩着八分音符蹦起来。三脚架上的相机对着这一排，替人把这道彩虹拍下来。',
    build: (k) => {
      lane(k, CLEAR);
      const bow = rainbow(30, 1.25); k.add(bow.g, 0, -3, -46);
      const gang = ROW.map(([id, x, z]) => ({ a: k.actor(id), x, z }));
      k.add(cyl(0.03, 0.05, 1.0, 0x3a3340, 6, 0.02), 5.5, 0, 1.75);
      k.add(cameraProp(), 5.5, 1.0, 1.75, PI + 0.85, 1.5);
      const A = cam([-3.4, 1.5, 9.2], [-2.6, 1.45, 0], 38), B = cam([2.9, 1.8, 9.8], [2.4, 1.5, 0], 40);
      return ({ u, T }) => {
        bow.set(1, 0.8);
        gang.forEach(({ a, x, z }, i) => {
          const hop = Math.sin(seg(frac((beats(T) * 2 - i) / 8), 0, 0.22) * PI); // 一小节一轮，按八分音符从左传到右
          if (a.id === 'whale') a.set(hop > 0.1 ? 'whale_wave' : 'whale_idle'); else if (a.id === 'claude') a.set(hop > 0.1 ? 'claude_front_1' : 'claude_front_0'); else a.front(T);
          a.at(x, 0, z).lift(hop * 0.5);
        });
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'L23b', look: 'afterRain', title: '彩虹的美丽（合影）', cast: ['whale', 'claude', 'doubao', 'kimi', 'gemini', 'qwen', 'zai', 'gpt'], fx: { flash: [0.24] },
    note: '重唱「彩虹的美丽」——快门一闪：整道彩虹架在小镇上，一排人在下面一起跳。龙娘从画面最上方掠过，把最后一点云带走。',
    build: (k) => {
      lane(k, CLEAR);
      const bow = rainbow(30, 1.25); k.add(bow.g, 0, -3, -46);
      const gang = ROW.map(([id, x, z]) => ({ a: k.actor(id), x, z }));
      const gpt = k.actor('gpt', 2.2);
      k.add(cyl(0.03, 0.05, 1.0, 0x3a3340, 6, 0.02), 5.5, 0, 1.75);
      k.add(cameraProp(), 5.5, 1.0, 1.75, PI + 0.85, 1.5);
      const stars = many(18, (i) => k.add(sprite('star', 0.5, i % 2 ? 0xfff2a8 : 0xffffff, true)));
      const A = cam([0, 1.8, 12.5], [0, 6, -20], 44), B = cam([0, 3.4, 17.5], [0, 9.5, -20], 46);
      return ({ u, T }) => {
        bow.set(1, 0.9);
        const hop = Math.abs(Math.sin(beats(T) * PI));
        gang.forEach(({ a, x, z }) => {
          if (a.id === 'whale') a.set('whale_wave'); else if (a.id === 'claude') a.set('claude_front_1'); else a.front(T);
          a.at(x, 0, z).lift(hop * 0.55);
        });
        const fly = seg(u, 0.05, 0.95);
        gpt.set(Math.floor(T * 6) % 2 ? 'gpt_fly_1' : 'gpt_fly_0').at(lerp(-22, 22, fly), 21.5, -20).noShadow();
        stars.forEach((s, i) => { const ph = frac(T * 0.5 + hash(i)); s.position.set((hash(i + 9) - 0.5) * 26, 1.5 + hash(i + 3) * 11 + ph, -2 - hash(i + 5) * 8); s.scale.setScalar(0.25 + 0.45 * Math.sin(ph * PI)); setOp(s, Math.sin(ph * PI) * 0.9); });
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'OUT', look: 'golden', title: '尾声 · 雨停了', cast: ['whale', 'claude', 'zai', 'qwen', 'kimi'], fx: { blackOut: true },
    note: '尾声的哼唱里：窗台上接满雨的蓝饭盆，水面漂着一只小纸船。镜头慢慢拉回屋里——本鲸和小克并排站在窗前，窗外的彩虹还在。',
    build: (k) => {
      const p = parlor(k, { outside: 0x9ab87a, lamp: 0.1 });
      wallFrames(k, ['sun', 'cloud', 'rain', 'bow', 'warm']);
      const bow = rainbow(15, 0.62); k.add(bow.g, 0.9, -2.5, -34);
      const bowl = rainBowl(0.36); k.add(bowl.g, 2.1, WIN.y, -4.25);
      const boat = k.add(paperBoat()); boat.scale.setScalar(0.085);
      const st = steam(k);
      const whale = k.actor('whale'), claude = k.actor('claude'), zai = k.actor('zai'), qwen = k.actor('qwen'), kimi = k.actor('kimi');
      const duo = [{ cell: 'p_whale_neutral', a: k.actor('whale', 0.4), dx: -0.24 }, { cell: 'p_claude_neutral', a: k.actor('claude', 0.4), dx: 0.24 }];
      const faces = ['p_claude_neutral', 'p_claude_dizzy', 'p_claude_petri'].map((cell) => ({ cell, a: k.actor('claude', 0.7) }));
      const notes = many(4, (i) => k.add(sprite('note', 0.4, i % 2 ? 0xffe9a0 : 0xffffff)));
      const A = cam([2.5, 1.76, -2.9], [2.1, 1.3, -4.3], 30), A1 = cam([2.45, 1.74, -2.8], [2.1, 1.3, -4.3], 30), M = cam([3.9, 2.2, 2.1], [2.1, 1.3, -4.3], 30), B = cam([0.1, 2.6, 6.4], [0.2, 1.9, -3], 42), B2 = cam([0.1, 2.8, 7.2], [0.2, 1.9, -3], 42);
      return ({ u, T, bt }) => {
        p.rain.set(T); rainOp(p.rain, 0); p.setGlass(T, 0.15); p.setFog(0);
        bow.set(1, lerp(0.85, 0.5, u));
        bowl.set(0.93);
        const wy = WIN.y + 0.36 * (0.22 + 0.6 * 0.93);
        boat.position.set(2.1 + Math.sin(T * 0.7) * 0.07, wy + 0.01 + Math.sin(T * 2) * 0.006, -4.25 + Math.cos(T * 0.7) * 0.05); boat.rotation.set(0, T * 0.3, Math.sin(T * 1.6) * 0.06);
        st(T, 0.6);
        whale.front(T).at(-1.9, 0, -2.7).sq(beatSq(bt, 0.025));
        claude.front(T).at(-0.5, 0, -2.7).sq(beatSq(bt, 0.025));
        zai.front(T).at(-4.9, 0.16, 1.0);
        qwen.front(T).at(TABLE.x + 0.5, 0, TABLE.z - 0.95);
        kimi.front(T).at(-5.8, 0, -3.3);
        faces.forEach(({ cell, a }, i) => a.set(cell).at(FRAMES[i][0], FRAMES[i][1] - 0.47, WIN.z + 0.14).noShadow());
        duo.forEach(({ cell, a, dx }) => a.set(cell).at(FRAMES[3][0] + dx, FRAMES[3][1] - 0.42, WIN.z + 0.14).noShadow());
        notes.forEach((s, i) => { const ph = frac(beats(T) * 0.5 + i / 4); s.position.set(-1.6 + i * 0.3 + Math.sin(ph * 4 + i) * 0.2, 1.9 + ph * 1.4, -2.6); s.scale.setScalar(0.28 + 0.2 * Math.sin(ph * PI)); setOp(s, seg(u, 0.3, 0.45) * (1 - seg(u, 0.8, 0.92)) * Math.sin(ph * PI)); });
        return track([[0, A], [0.08, A1], [0.32, M], [0.62, B], [1, B2]], u);
      };
    },
  },
];
