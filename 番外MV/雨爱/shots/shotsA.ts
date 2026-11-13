// 镜头表（上）：序章 I1–I2 · 主歌 L01–L08
// 主歌是「雨天里的那件事」：窗外的天气 → 你多变的表情 → 下雨了 → 看不清 → 安静地走开 → 没翻开的那一页 → 泪流在心里 → 放一只纸船走。
import * as THREE from 'three';
import { cam, glide, track, type ShotDef } from '@tpl/core';
import { backOut, clamp01, ease, hash, lerp, paperBoat, seg, setOp, sprite } from '@tpl/kit';
import { notebook, table } from '@tpl/props';
import {
  BROLLY, CANAL_Z, FRAMES, PI, PUD, TABLE, WIN, beatSq, beats, brolly, frac, holdBrolly, lane, makeRain, many, parlor, rainOp, ripple, setRipple, steam, tb,
  wallFrames,
} from './common';

const NIGHT = { lamp: 1, ground: 0x3f5478, clouds: 0x4a5c86, hills: [0x3b4f7c, 0x45598a] as [number, number] };

export const SHOTS_A: ShotDef[] = [
  {
    id: 'I1', look: 'rainEve', title: '雨巷 · 片名', cast: ['whale'], fx: { title: true, blackIn: true },
    note: '傍晚的雨巷，路灯一盏盏亮着。本鲸撑着蓝伞走回小工坊，水洼里的涟漪跟着拍子一圈圈散开。片名在雨里浮出来。',
    build: (k) => {
      lane(k, NIGHT);
      const r = makeRain(k, 220, 24, 9, 0, -1.5, 9);
      const whale = k.actor('whale');
      const um = brolly(k, BROLLY.whale);
      const rip = many(5, () => k.add(ripple()));
      const A = cam([-8, 10, 18], [-2, 2.4, -3], 40), B = cam([1.8, 2.3, 9.6], [0.4, 1.3, 0], 36);
      return ({ u, T }) => {
        r.set(T); rainOp(r, 0.95);
        const x = lerp(-8, 1.0, u);
        whale.walkBy(9 * u).at(x, 0, 0.2);
        holdBrolly(um, x, 0, 0.2, 0.1 + Math.sin(T * 2) * 0.03);
        rip.forEach((m, i) => setRipple(m, PUD[i][0], PUD[i][1], frac(beats(T) * 0.5 + i / 5), 0.7));
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'I2', look: 'cozy', title: '小工坊 · 哼歌', cast: ['whale', 'zai', 'qwen', 'kimi'],
    note: '门常开的小工坊：狐狸在垫子上打盹，千问煮着茶，Kimi 站在相框墙边。本鲸进门走到窗前，对着雨轻轻哼起来（音符在哼唱那两小节才飘）。',
    build: (k) => {
      const p = parlor(k);
      wallFrames(k, ['warm', 'warm', 'warm', 'warm', 'warm']);
      const st = steam(k);
      const whale = k.actor('whale'), zai = k.actor('zai'), qwen = k.actor('qwen'), kimi = k.actor('kimi');
      const zz = many(2, () => k.add(sprite('zzz', 0.5, 0xffffff)));
      const notes = many(5, (i) => k.add(sprite('note', 0.42, i % 2 ? 0xffe9a0 : 0xbfe3ff)));
      const A = cam([-3.6, 3.6, 10.5], [0, 1.7, -2], 40), B = cam([-0.8, 2.2, 4.6], [-0.6, 1.9, -4], 33);
      return ({ u, T, bt }) => {
        p.rain.set(T); p.setGlass(T, 1); p.setFog(0);
        st(T, 0.9);
        const w = seg(u, 0, 0.42);
        if (w < 1) whale.walkX(6.0, -1.0, w, 0, -3.2); else whale.idle(T).at(-1.0, 0, -3.2).sq(beatSq(bt, 0.03));
        zai.act('doze', T).emote('fx_zzz', T).at(-4.9, 0.16, 1.0).sq(Math.sin(T * 1.6) * 0.02);
        zz.forEach((s, i) => { const ph = frac(T * 0.35 + i * 0.5); s.position.set(-4.3 + ph * 0.5, 1.9 + ph * 0.9, 1.05); s.scale.setScalar(0.3 + ph * 0.35); setOp(s, Math.sin(ph * PI) * 0.9); });
        qwen.idle(T).at(TABLE.x + 0.5, 0, TABLE.z - 0.95);
        kimi.idle(T).at(-5.8, 0, -3.3);
        const hum = seg(T, 12.7, 13.2) * (1 - seg(T, 15.6, 16.4));
        notes.forEach((s, i) => { const ph = frac(beats(T) * 0.5 + i / 5); s.position.set(-0.4 + i * 0.22 + Math.sin(ph * 4 + i) * 0.2, 1.8 + ph * 1.5, -3.1); s.scale.setScalar(0.3 + 0.2 * Math.sin(ph * PI)); setOp(s, hum * Math.sin(ph * PI)); });
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'L01', look: 'cozy', title: '窗外的天气', cast: ['whale'],
    note: '「窗外的天气」——机位贴到窗前：玻璃上的水珠往下滑，窗外是雨、路灯和对面的小屋。本鲸站在窗边，只是看着。',
    build: (k) => {
      const p = parlor(k);
      wallFrames(k, ['warm', 'warm', 'warm', 'warm', 'warm']);
      const whale = k.actor('whale');
      const A = cam([-0.7, 1.9, 3.8], [0.2, 1.9, -4.5], 36), B = cam([0.3, 1.7, 1.2], [0.6, 1.75, -4.5], 36);
      return ({ u, T, bt }) => {
        p.rain.set(T); p.setGlass(T, 1); p.setFog(0.06);
        whale.idle(T).at(-1.0, 0, -3.2).sq(beatSq(bt, 0.025));
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'L02', look: 'cozy', title: '你多变的表情', cast: ['whale', 'claude'],
    note: '「就像是你多变的表情」——墙上三个相框跟着拍子一个个弹出来：晴、阴、雨，每一格里是小克不同的表情。本鲸在下面抬手指着看。',
    build: (k) => {
      const p = parlor(k);
      const fr = wallFrames(k, ['sun', 'cloud', 'rain', 'warm', 'warm']);
      const whale = k.actor('whale');
      const faces = ['p_claude_neutral', 'p_claude_dizzy', 'p_claude_petri'].map((cell) => ({ cell, a: k.actor('claude', 0.7) }));
      const glow = k.add(sprite('glow', 2.6, 0xfff1c4, true, 0.5));
      const POP = [tb(11.5) + 0.05, tb(13), tb(15)]; // 三格各自弹出的时刻：落在实拍上
      const A = cam([-2.0, 2.3, 4.6], [-3.7, 2.2, -4.5], 38), B = cam([-3.3, 2.0, 3.4], [-3.7, 2.15, -4.5], 38);
      return ({ u, T, bt }) => {
        p.rain.set(T); p.setGlass(T, 1); p.setFog(0.06);
        let live = 0;
        faces.forEach(({ cell, a }, i) => {
          const pop = backOut(seg(T, POP[i], POP[i] + 0.3));
          if (T >= POP[i]) live = i;
          const shuffle = T > tb(16) ? Math.floor(beats(T) * 2) % 3 === i : false; // 最后半小节三格轮流跳：「多变」
          const [fx, fy] = FRAMES[i];
          fr[i].scale.setScalar(Math.max(0.001, pop));
          fr[i].rotation.z = Math.sin(T * 5 + i * 2) * 0.04 * pop;
          a.set(cell).at(fx, fy - 0.47 + (shuffle ? 0.07 : 0), WIN.z + 0.14).size(Math.max(0.001, pop)).alpha(pop > 0.02 ? 1 : 0).noShadow();
        });
        fr[3].scale.setScalar(1); fr[4].scale.setScalar(1);
        glow.position.set(FRAMES[live][0], FRAMES[live][1], WIN.z + 0.3);
        setOp(glow, T >= POP[0] ? 0.3 + 0.25 * bt.pulse : 0);
        if (T > POP[2]) whale.act('point', T); else whale.idle(T);
        whale.at(-1.9, 0, -2.6).sq(beatSq(bt, 0.03)).emote(T > POP[2] ? 'fx_exclaim' : 'fx_question', T);
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'L03', look: 'drizzle', title: '下雨了 雨陪我哭泣', cast: ['whale', 'doubao'],
    note: '「下雨了」雨一下子密起来；本鲸把伞放在地上，自己站在雨里。「雨陪我哭泣」——眼泪和雨一起落。豆包撑着红伞慢慢走过来，停在她旁边，把伞往她那边偏：先陪着，不催。',
    build: (k) => {
      lane(k);
      const r = makeRain(k, 220, 22, 9, 0, -1.5, 9);
      const whale = k.actor('whale'), doubao = k.actor('doubao');
      const blue = brolly(k, BROLLY.whale), red = brolly(k, BROLLY.doubao);
      const tears = many(2, () => k.add(sprite('drop', 0.2, 0xcfeaff)));
      const rip = many(5, () => k.add(ripple()));
      const A = cam([0.4, 3.8, 12.5], [0.2, 1.5, 0], 38), B = cam([0.5, 1.8, 7.6], [0.2, 1.2, 0], 34);
      return ({ u, T, bt }) => {
        r.set(T); rainOp(r, lerp(0.2, 1, seg(u, 0.02, 0.22)));
        const cry = seg(u, 0.3, 0.42);
        if (cry > 0.5) whale.set('whale_blink'); else whale.idle(T);
        whale.at(-0.9, 0, 0.3).tilt(-0.04 * cry).emote(cry > 0.5 ? 'fx_sweat' : null, T);
        blue.position.set(-2.5, 0.42, 0.9); blue.rotation.set(0.25, 0, 1.75); // 伞倒放在地上
        tears.forEach((s, i) => { const ph = frac(beats(T) + i * 0.5); s.position.set(-0.9 + (i ? 0.2 : -0.2), 1.12 - ph * 0.85, 0.42); setOp(s, cry * Math.sin(ph * PI)); });
        const w = seg(u, 0.36, 0.8), dx = lerp(8.2, 0.75, w);
        if (w < 1) doubao.walkBy(Math.abs(dx - 8.2)).flip().at(dx, 0, 0.3); else doubao.idle(T).at(0.75, 0, 0.3).sq(beatSq(bt, 0.03));
        const share = ease(seg(u, 0.82, 0.96)); // 走到了：伞往本鲸那边偏
        holdBrolly(red, dx, 0, 0.3, lerp(0.08, -0.32, share), lerp(0.36, -0.55, share));
        rip.forEach((m, i) => setRipple(m, PUD[i][0], PUD[i][1], frac(beats(T) + i / 5), 0.75));
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'L04', look: 'drizzle', title: '看不清 我也不想看清', cast: ['whale', 'claude'],
    note: '「看不清」——远处蓝伞下的小克被雨雾一层层盖住，只剩一个影子。「我也不想看清」——本鲸闭上眼，低下头。',
    build: (k) => {
      lane(k);
      const r = makeRain(k, 200, 20, 8, 0, -2, 9);
      const whale = k.actor('whale'), claude = k.actor('claude');
      const blue = brolly(k, BROLLY.whale);
      const mist = many(9, (i) => k.add(sprite('smoke', 3.6 + hash(i) * 2.4, 0xdde7f1, false, 0.5)));
      const A = cam([0.6, 1.9, 8.2], [0.5, 1.35, 0], 36), B = cam([-0.5, 1.7, 6.2], [-0.6, 1.3, 0.6], 33);
      return ({ u, T, said, line, lp }) => {
        r.set(T); rainOp(r, 1);
        const blur = ease(seg(u, 0.05, 0.6));
        claude.idle(T).at(2.7, 0, -3.8).alpha(lerp(1, 0.32, blur)).sil(blur * 0.55);
        holdBrolly(blue, 2.7, 0, -3.8);
        mist.forEach((s, i) => { s.position.set(0.4 + hash(i + 3) * 5 + Math.sin(T * 0.3 + i) * 0.4, 0.6 + hash(i + 8) * 2.6, -1.6 - hash(i + 5) * 1.2); setOp(s, blur * (0.34 + hash(i + 1) * 0.3)); });
        const shut = said >= 3 && line === 3 ? seg(lp, 0.3, 0.42) : said >= 3 ? 1 : 0; // 第 4 句唱到「我也不想看清」
        whale.set(shut > 0.5 ? 'whale_blink' : 'whale_idle').at(-1.6, 0, 1.3).tilt(-0.07 * shut);
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'L05', look: 'drizzle', title: '离开你 我安静的抽离', cast: ['whale', 'claude'],
    note: '「离开你，我安静的抽离」——蓝伞留在小克头顶，本鲸自己走进雨里，一步一步往画面左边去，不回头。小克站在原地转头看了一眼，没有追。',
    build: (k) => {
      lane(k);
      const r = makeRain(k, 220, 24, 8, -1, -1.5, 9);
      const whale = k.actor('whale'), claude = k.actor('claude');
      const blue = brolly(k, BROLLY.whale);
      const A = cam([1.6, 2.0, 9.4], [1.2, 1.25, 0], 36), B = cam([-1.2, 2.8, 12.2], [-0.9, 1.2, 0], 36);
      return ({ u, T }) => {
        r.set(T); rainOp(r, 0.9);
        if (u > 0.62) claude.idle(T).emote('fx_gloom', T); else claude.set('claude_side_0');
        claude.at(3.3, 0, 0.2);
        holdBrolly(blue, 3.3, 0, 0.2, 0.06 + Math.sin(T * 1.5) * 0.02);
        whale.walkX(1.5, -5.4, u, 0, 0.5);
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'L06', look: 'cozy', title: '不忍揭晓的剧情', cast: ['whale'],
    note: '「不忍揭晓的剧情」——桌上的本子掀开一条缝，光漏出来；她没有往下翻，又把封面合上了。',
    build: (k) => {
      const p = parlor(k);
      wallFrames(k, ['sun', 'cloud', 'rain', 'warm', 'warm']);
      k.add(table(1.9, 1.0, 0.8, 0xc08a58), -1.3, 0, 1.2);
      const nb = notebook(0.56, 0.4, 0x4f6fa8); k.add(nb.g, -1.3, 0.8, 1.2, 0, 2.2);
      const glow = k.add(sprite('glow', 1.8, 0xfff1c4, true, 0.6), -1.25, 1.0, 1.25);
      const heart = k.add(sprite('heart', 0.3, 0xff8fab));
      const whale = k.actor('whale');
      const A = cam([-0.2, 2.9, 5.4], [-1.3, 1.0, 1.0], 32), B = cam([-1.0, 2.4, 4.3], [-1.3, 1.05, 1.0], 30);
      return ({ u, T }) => {
        p.rain.set(T); p.setGlass(T, 1); p.setFog(0.06);
        const open = ease(seg(u, 0.1, 0.42)) * (1 - ease(seg(u, 0.56, 0.86)));
        nb.cover.rotation.z = open * 0.5; nb.page.rotation.z = 0;
        setOp(glow, open * 0.75); glow.scale.setScalar(1.2 + open * 1.2);
        heart.position.set(-1.05, 0.98 + open * 0.5, 1.3); setOp(heart, open);
        whale.set(u > 0.8 ? 'whale_blink' : 'whale_idle').at(-1.3, 0, 0.3).tilt(u > 0.8 ? -0.04 : 0);
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'L07', look: 'rainEve', title: '我的泪流在心里', cast: ['whale'],
    note: '「我的泪流在心里」——她脸上没有泪。旁边浮着一颗心，雨滴一颗一颗落在心里面，把粉色慢慢染成了雨的颜色。',
    build: (k) => {
      lane(k, NIGHT);
      const r = makeRain(k, 160, 18, 6, 0, -3, 9);
      const whale = k.actor('whale');
      const heart = k.add(sprite('heart', 1.5, 0xff8fab, false, 0.95));
      const drops = many(5, () => k.add(sprite('drop', 0.17, 0xeaf6ff)));
      const pink = new THREE.Color(0xff8fab), blue = new THREE.Color(0x7fb8f2);
      const A = cam([0.9, 1.6, 6.0], [0.55, 1.25, 0.5], 31), B = cam([0.7, 1.5, 5.0], [0.6, 1.3, 0.5], 30);
      return ({ u, T, bt }) => {
        r.set(T); rainOp(r, 0.55);
        whale.set('whale_blink').at(-0.35, 0, 0.5).sq(beatSq(bt, 0.02));
        heart.position.set(1.35, 1.6, 0.55); heart.scale.setScalar(1.5 * (1 + 0.07 * bt.pulse));
        (heart.material as THREE.SpriteMaterial).color.copy(pink).lerp(blue, ease(seg(u, 0.15, 0.95)));
        drops.forEach((s, i) => { const ph = frac(beats(T) * 0.5 + i / 5); s.position.set(1.35 + (hash(i + 2) - 0.5) * 0.55, 1.98 - ph * 0.62, 0.62); setOp(s, Math.sin(ph * PI)); });
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'L08', look: 'drizzle', title: '学会放弃', cast: ['whale'],
    note: '「学会放弃」——把那颗心放进纸船，推进水渠。船顺着水漂远，她在岸边挥了挥手。',
    build: (k) => {
      lane(k);
      const r = makeRain(k, 180, 20, 7, 0, -2, 9);
      const whale = k.actor('whale');
      const boat = k.add(paperBoat()); boat.scale.setScalar(0.3);
      const heart = k.add(sprite('heart', 0.34, 0x8fc7ff));
      const rip = many(3, () => k.add(ripple()));
      const A = cam([-1.4, 2.0, 8.6], [-1.6, 0.95, 2.2], 34), B = cam([1.4, 2.5, 9.8], [0.9, 0.85, 2.6], 36);
      return ({ u, T }) => {
        r.set(T); rainOp(r, 0.7);
        const go = ease(seg(u, 0.12, 1));
        const bx = lerp(-2.2, 6.2, go), by = 0.1 + Math.sin(T * 2.4) * 0.03;
        boat.position.set(bx, by, CANAL_Z); boat.rotation.set(0, 0, Math.sin(T * 1.8) * 0.05);
        heart.position.set(bx - 0.05, by + 0.42, CANAL_Z); setOp(heart, 1 - seg(u, 0.6, 0.98) * 0.6);
        if (u > 0.36) whale.act('wave', T); else whale.idle(T);
        whale.at(-2.4, 0, 1.5).sq(u > 0.36 ? Math.sin(T * 9) * 0.015 : 0);
        rip.forEach((m, i) => setRipple(m, bx - 0.5 - i * 0.5, CANAL_Z, frac(T * 0.8 + i / 3), 0.5, 0.08));
        return track([[0, A], [1, B]], clamp01(u));
      };
    },
  },
];
