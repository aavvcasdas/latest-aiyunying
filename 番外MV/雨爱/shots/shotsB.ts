// 镜头表（中）：副歌一 L09–L13 · 副歌二 L14–L18
// 副歌是「喜欢上了雨」：听雨 → 呼吸渗进来 → 希望雨别停 → 想念继续、爱变透明 → Rainie love；
// 第二遍：窗台上的饭盆接雨 → 屋里的雾气存着记忆 → 一街的伞 → 秘密一直延续 → 云开，彩虹。
import * as THREE from 'three';
import { cam, glide, track, type ShotDef } from '@tpl/core';
import { backOut, basic, ball, clamp01, cloud, cyl, ease, easeOut, hash, lerp, paperBoat, seg, setOp, sprite } from '@tpl/kit';
import {
  BROLLY, CANAL_Z, FRAMES, PI, PUD, TABLE, WIN, beatSq, beats, brolly, dragonShadow, frac, holdBrolly, lane, makeRain, many, parlor, puddle, rainBowl, rainOp,
  rainbow, ripple, setRipple, steam, tb, wallFrames,
} from './common';

const NIGHT = { lamp: 1, ground: 0x3f5478, clouds: 0x4a5c86, hills: [0x3b4f7c, 0x45598a] as [number, number] };
const CLEAR = { clouds: null, ground: 0x86aac6, hills: [0x86c49a, 0x7fb8d0] as [number, number], lamp: 0.1 };
/** 一滴一滴落在拍子上：slot 0 落在整拍，slot 1 落在半拍。ph 0–1：前 0.62 是落地后的涟漪，后 0.38 是下一滴正在往下掉 */
const dripPh = (T: number, slot: number) => frac(beats(T) - slot * 0.5);
const fallY = (ph: number, top: number, bottom: number) => lerp(top, bottom, seg(ph, 0.62, 1) ** 2);

export const SHOTS_B: ShotDef[] = [
  {
    id: 'L09', look: 'drizzle', title: '听雨的声音 一滴滴清晰', cast: ['whale'],
    note: '「听雨的声音，一滴滴清晰」——镜头压到水洼边：雨滴一拍一滴落下来，每一滴都荡开一圈涟漪、弹出一个音符。本鲸闭着眼听。',
    build: (k) => {
      lane(k, { puddles: false });
      k.add(puddle(1.9, 0.9), 0.7, 0.02, 1.0);
      const r = makeRain(k, 120, 18, 5, 0, -3.5, 9);
      const whale = k.actor('whale');
      const SP: [number, number][] = [[0.2, 1.1], [1.3, 0.8], [0.8, 1.4]];
      const drip = many(2, () => ({ d: k.add(sprite('drop', 0.26, 0xeaf6ff)), rg: k.add(ripple()), n: k.add(sprite('note', 0.42, 0xfff2a8)) }));
      const A = cam([1.9, 0.9, 6.0], [0.3, 0.75, 1.0], 34), B = cam([1.2, 1.25, 5.4], [-0.1, 0.9, 0.9], 34);
      return ({ u, T }) => {
        r.set(T); rainOp(r, 0.5);
        whale.set('whale_blink').at(-1.7, 0, 0.5).tilt(0.05);
        drip.forEach((s, i) => {
          const ph = dripPh(T, i), land = Math.floor(beats(T) - i * 0.5);
          const [x, z] = SP[(((land + (ph > 0.62 ? 1 : 0)) * (i + 1)) % 3 + 3) % 3], [rx, rz] = SP[((land * (i + 1)) % 3 + 3) % 3];
          s.d.position.set(x, fallY(ph, 2.6, 0.12), z); setOp(s.d, ph > 0.62 ? 1 : 0);
          setRipple(s.rg, rx, rz, ph / 0.9, 0.62);
          s.n.position.set(rx + 0.1, 0.35 + ph * 1.3, rz); s.n.scale.setScalar(0.26 + 0.2 * Math.sin(Math.min(1, ph * 1.4) * PI)); setOp(s.n, Math.sin(Math.min(1, ph * 1.3) * PI));
        });
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'L10', look: 'rainEve', title: '你的呼吸像雨滴渗入我的爱里', cast: ['whale', 'claude'],
    note: '「你的呼吸像雨滴，渗入我的爱里」——同一把橘伞下，小克呵出的白气飘过来，半路变成雨滴，一滴滴落进本鲸胸口那颗心里，心跟着一点点亮起来。',
    build: (k) => {
      lane(k, NIGHT);
      const r = makeRain(k, 200, 20, 8, 0, -2, 9);
      const whale = k.actor('whale'), claude = k.actor('claude');
      const um = brolly(k, BROLLY.claude, 1.5);
      const heart = k.add(sprite('heart', 0.5, 0xff8fab));
      const hglow = k.add(sprite('glow', 2, 0xffb3c6, true, 0.5));
      const puffs = many(3, () => ({ s: k.add(sprite('smoke', 0.4, 0xffffff)), d: k.add(sprite('drop', 0.2, 0xeaf6ff)) }));
      const A = cam([0, 2.0, 7.8], [-0.05, 1.3, 0.3], 34), B = cam([0.35, 1.6, 5.6], [0.15, 1.2, 0.3], 32);
      return ({ u, T, bt }) => {
        r.set(T); rainOp(r, 0.85);
        claude.front(T).at(-0.95, 0, 0.3);
        whale.front(T).at(0.85, 0, 0.3).sq(beatSq(bt, 0.02));
        holdBrolly(um, -0.3, 0.25, 0.3, 0.02, 0.25);
        const fill = ease(seg(u, 0.1, 0.95));
        puffs.forEach((p, i) => {
          const ph = frac(beats(T) * 0.5 + i / 3); // 两拍一口气，三口错开
          const x = lerp(-0.6, 0.85, easeOut(ph)), y = 1.22 + Math.sin(ph * PI) * 0.22 - ph * 0.3;
          p.s.position.set(x, y, 0.5); p.s.scale.setScalar(0.25 + ph * 0.3); setOp(p.s, (1 - seg(ph, 0.3, 0.6)) * seg(ph, 0, 0.1) * 0.8);
          p.d.position.set(x, y, 0.52); setOp(p.d, seg(ph, 0.35, 0.6) * (1 - seg(ph, 0.9, 1)));
        });
        heart.position.set(0.85, 0.82, 0.56); heart.scale.setScalar((0.28 + 0.34 * fill) * (1 + 0.1 * bt.pulse)); setOp(heart, 0.4 + 0.6 * fill);
        hglow.position.set(0.85, 0.95, 0.5); hglow.scale.setScalar(1 + fill * 2.2); setOp(hglow, fill * (0.35 + 0.2 * bt.pulse));
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'L11', look: 'drizzle', title: '真希望雨能下不停', cast: ['whale', 'gemini', 'doubao'],
    note: '「真希望雨能下不停」——本鲸在雨里踩着拍子跳，每一拍脚下一圈水花。后面的猫在两个水洼之间左看右看，最后选定一个跳进去；豆包撑着红伞在一旁陪着。',
    build: (k) => {
      lane(k);
      const r = makeRain(k, 240, 24, 9, 0, -1.5, 9);
      const whale = k.actor('whale'), gemini = k.actor('gemini'), doubao = k.actor('doubao');
      const red = brolly(k, BROLLY.doubao);
      const rip = many(3, () => k.add(ripple()));
      const A = cam([0.4, 1.5, 8.4], [0.3, 1.2, 0], 36), B = cam([1.0, 4.8, 12.8], [0.6, 1.1, -0.5], 38);
      return ({ u, T, bt }) => {
        r.set(T); rainOp(r, 1);
        const hop = Math.abs(Math.sin(beats(T) * PI));
        whale.set('whale_wave').flip(Math.floor(beats(T)) % 2 === 0).at(-0.2, 0, 0.4).lift(hop * 0.42).sq(-0.05 * bt.pulse);
        setRipple(rip[0], -0.2, 0.45, bt.phase, 0.9);
        // 猫：先给两个看法，最后必须选一个
        const pick = seg(u, 0.62, 0.8);
        const gx = lerp(4.1, PUD[2][0], ease(pick)), gz = lerp(-0.4, PUD[2][1], ease(pick));
        gemini.set(pick > 0 ? 'gemini_front_0' : 'gemini_side_0').flip(pick > 0 ? false : Math.floor(beats(T) * 2) % 2 === 0).at(gx, 0, gz).lift(Math.sin(pick * PI) * 0.8 + (pick >= 1 ? hop * 0.25 : 0));
        setRipple(rip[1], PUD[2][0], PUD[2][1], pick >= 1 ? bt.phase : 0, 0.9);
        doubao.front(T).at(-4.6, 0, -0.7).sq(beatSq(bt, 0.04));
        holdBrolly(red, -4.6, 0.04 * bt.pulse, -0.7);
        setRipple(rip[2], PUD[0][0], PUD[0][1], frac(beats(T) * 0.5), 0.7);
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'L12a', look: 'drizzle', title: '让想念继续', cast: ['whale'],
    note: '「让想念继续」——水渠里一只接一只的纸船，每只都载着一颗小小的心，顺着水一直往前漂。',
    build: (k) => {
      lane(k);
      const r = makeRain(k, 160, 20, 6, 0, -2.5, 9);
      const whale = k.actor('whale');
      const boats = many(6, (i) => { const b = k.add(paperBoat()); b.scale.setScalar(0.27); return { b, h: k.add(sprite('heart', 0.3, i % 2 ? 0xff8fab : 0x8fc7ff)) }; });
      const A = cam([-3.6, 1.8, 8.4], [-2.6, 0.8, 2.4], 34), B = cam([2.4, 2.5, 9.6], [3.0, 0.6, 2.8], 36);
      return ({ u, T, bt }) => {
        r.set(T); rainOp(r, 0.6);
        whale.front(T).at(-3.2, 0, 1.5).sq(beatSq(bt, 0.03));
        boats.forEach(({ b, h }, i) => {
          const x = -5.2 + i * 2.5 + u * 3.4, y = 0.1 + Math.sin(T * 2.2 + i) * 0.03;
          b.position.set(x, y, CANAL_Z); b.rotation.set(0, 0, Math.sin(T * 1.7 + i * 2) * 0.05);
          h.position.set(x - 0.05, y + 0.4 + 0.04 * bt.pulse, CANAL_Z);
        });
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'L12b', look: 'drizzle', title: '让爱变透明', cast: ['whale', 'claude'],
    note: '「让爱变透明」——画面中间那颗粉色的心慢慢褪成一片透明的玻璃；透过它，看见远处蓝伞下的小克。',
    build: (k) => {
      lane(k);
      const r = makeRain(k, 180, 20, 6, 0, -3.5, 9);
      const whale = k.actor('whale'), claude = k.actor('claude');
      const blue = brolly(k, BROLLY.whale);
      const heart = k.add(sprite('heart', 2.7, 0xff8fab, false, 0.95));
      const rim = k.add(sprite('bubble', 2.5, 0xeaf6ff, false, 0));
      const pink = new THREE.Color(0xff8fab), glass = new THREE.Color(0xd9efff);
      const A = cam([-0.3, 1.8, 7.8], [0.2, 1.45, 0], 34), B = cam([0.5, 1.75, 6.6], [0.75, 1.5, 0], 32);
      return ({ u, T, bt }) => {
        r.set(T); rainOp(r, 0.7);
        const clear = ease(seg(u, 0.08, 0.8));
        claude.set(u > 0.7 ? 'claude_front_1' : 'claude_front_0').at(1.0, 0, -2.6);
        holdBrolly(blue, 1.0, 0, -2.6);
        whale.front(T).at(-1.9, 0, 1.0);
        heart.position.set(0.95, 1.55, 1.5); heart.scale.setScalar(2.7 * (1 + 0.04 * bt.pulse));
        (heart.material as THREE.SpriteMaterial).color.copy(pink).lerp(glass, clear); setOp(heart, lerp(0.96, 0.16, clear));
        rim.position.set(0.95, 1.55, 1.52); setOp(rim, clear * 0.5);
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'L13a', look: 'drizzle', title: '我爱上给我勇气的', cast: ['whale', 'doubao'],
    note: '「我爱上给我勇气的」——本鲸从豆包的红伞下走出来，自己走进雨里，身后冒出一串心。',
    build: (k) => {
      lane(k);
      const r = makeRain(k, 220, 22, 8, 0, -1.5, 9);
      const whale = k.actor('whale'), doubao = k.actor('doubao');
      const red = brolly(k, BROLLY.doubao, 1.35);
      const hearts = many(5, (i) => k.add(sprite('heart', 0.34, i % 2 ? 0xff8fab : 0xffc2d1)));
      const A = cam([-2.8, 1.8, 7.8], [-2.8, 1.2, 0.3], 34), B = cam([1.1, 1.5, 6.8], [0.7, 1.25, 0.3], 33);
      return ({ u, T }) => {
        r.set(T); rainOp(r, 0.95);
        doubao.front(T).at(-4.2, 0, 0.3);
        holdBrolly(red, -4.2, 0, 0.3, -0.12, 0.6);
        const w = ease(seg(u, 0.04, 0.82)), x = lerp(-3.3, 0.7, w);
        if (u < 0.82) whale.walkBy(4 * w).at(x, 0, 0.4); else whale.set('whale_wave').at(0.7, 0, 0.4).lift(Math.abs(Math.sin(beats(T) * PI)) * 0.2);
        hearts.forEach((h, i) => { const ph = frac(beats(T) * 0.5 + i / 5); h.position.set(x - 0.6 - i * 0.3, 1.75 + ph * 1.3, 0.35); h.scale.setScalar(0.2 + 0.2 * Math.sin(ph * PI)); setOp(h, seg(u, 0.1, 0.3) * Math.sin(ph * PI)); });
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'L13b', look: 'drizzle', title: 'Rainie love', cast: ['whale'], fx: { flash: [0.01] },
    note: '「Rainie love」——落拍闪白，本鲸高高跳起，落进水洼：一大圈水花、四散的水珠和心。她喜欢上雨了。',
    build: (k) => {
      lane(k, { puddles: false });
      k.add(puddle(1.7, 0.8), 0.3, 0.02, 0.5);
      const r = makeRain(k, 240, 22, 8, 0, -1.5, 9);
      const whale = k.actor('whale');
      const rings = many(3, () => k.add(ripple()));
      const spl = many(10, (i) => k.add(sprite(i % 3 === 0 ? 'heart' : 'drop', i % 3 === 0 ? 0.36 : 0.22, i % 3 === 0 ? 0xff8fab : 0xeaf6ff)));
      const A = cam([0.5, 0.8, 6.2], [0.3, 1.5, 0.4], 36), B = cam([0.0, 1.4, 7.6], [0.2, 1.4, 0.4], 36);
      return ({ u, t, T, bt }) => {
        r.set(T); rainOp(r, 1);
        const air = seg(t, 0, 0.95), landed = t >= 0.95;
        const hop = landed ? Math.abs(Math.sin(beats(T) * PI)) * 0.3 : Math.sin(air * PI) * 1.5;
        whale.set('whale_wave').at(0.3, 0, 0.5).lift(hop).sq(landed ? -0.06 * bt.pulse : 0.05);
        const s = clamp01((t - 0.95) / 1.1);
        rings.forEach((m, i) => setRipple(m, 0.3, 0.55, landed ? clamp01(s * 1.2 - i * 0.16) : 0, 1.5 + i * 0.5));
        spl.forEach((p, i) => { const a = (i / 10) * PI * 2, d = easeOut(s) * (1.2 + hash(i) * 0.9); p.position.set(0.3 + Math.cos(a) * d, 0.2 + Math.sin(s * PI) * (1.3 + hash(i + 4)) , 0.6 + Math.sin(a) * d * 0.3); setOp(p, landed ? Math.sin(Math.min(1, s * 1.05) * PI) : 0); });
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'L14', look: 'drizzle', title: '窗外的雨滴 一滴滴累积', cast: ['whale'],
    note: '「窗外的雨滴，一滴滴累积」——从窗外看：窗台上放着本鲸的蓝饭盆，这回它不装饭，装雨。屋檐的水一拍一滴落进去，水面一点点涨；她在窗里探出半个头看着。',
    build: (k) => {
      const p = parlor(k);
      k.add(new THREE.Mesh(new THREE.PlaneGeometry(15, 7), basic(0xffdfae)), 0, 2.8, 4.6, PI); // 从窗外看进去的一屋子暖光
      const r = makeRain(k, 70, 7, 1.4, WIN.x, -5.5, 7);
      const bowl = rainBowl(0.36); k.add(bowl.g, 1.6, WIN.y, -4.85);
      const whale = k.actor('whale');
      const drip = many(2, () => k.add(sprite('drop', 0.2, 0xeaf6ff)));
      const ring = k.add(sprite('ring', 0.5, 0xffffff));
      const A = cam([3.0, 2.6, -8.4], [1.3, 1.45, -4.6], 30), B = cam([2.2, 2.45, -7.0], [1.5, 1.35, -4.7], 28);
      return ({ u, T }) => {
        p.rain.set(T); rainOp(p.rain, 0); r.set(T); rainOp(r, 0.8); p.setGlass(T, 1); p.setFog(0);
        const level = lerp(0.2, 0.6, u), wy = WIN.y + 0.36 * (0.22 + 0.6 * level);
        bowl.set(level + 0.03 * Math.exp(-frac(beats(T) * 2) * 5));
        drip.forEach((d, i) => { const ph = dripPh(T, i); d.position.set(1.6 + (i ? 0.07 : -0.07), fallY(ph, WIN.y + 2.9, wy + 0.08), -4.85); setOp(d, ph > 0.62 ? 1 : 0); });
        const rp = frac(beats(T) * 2); ring.position.set(1.6, wy + 0.1, -4.86); ring.scale.setScalar(0.15 + rp * 0.5); setOp(ring, (1 - rp) * 0.8);
        whale.front(T).at(0.2, 0, -3.7);
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'L15', look: 'cozy', title: '屋内的湿气像储存爱你的记忆', cast: ['whale', 'qwen', 'kimi', 'zai', 'claude'],
    note: '「屋内的湿气像储存爱你的记忆」——千问的茶壶冒着热气，窗玻璃起了一层雾；墙上的相框跟着拍子一格一格亮起来，Kimi 站在旁边一动不动地记着。本鲸在起雾的玻璃上画了一颗心。',
    build: (k) => {
      const p = parlor(k);
      const fr = wallFrames(k, ['sun', 'cloud', 'rain', 'warm', 'warm']);
      const st = steam(k, 9);
      const whale = k.actor('whale'), qwen = k.actor('qwen'), kimi = k.actor('kimi'), zai = k.actor('zai');
      const CELLS = ['p_claude_neutral', 'p_claude_dizzy', 'p_claude_petri', 'p_whale_neutral', 'p_whale_think'];
      const faces = CELLS.map((cell, i) => ({ cell, a: k.actor(i < 3 ? 'claude' : 'whale', 0.7) }));
      const glow = k.add(sprite('glow', 2.8, 0xfff1c4, true, 0.5));
      const heart = k.add(sprite('heart', 0.9, 0xffffff));
      const zz = many(2, () => k.add(sprite('zzz', 0.5, 0xffffff)));
      const A = cam([3.0, 2.1, 3.8], [4.1, 1.55, -1.3], 34), B = cam([-0.6, 3.1, 9.4], [-0.8, 1.9, -2.5], 40), C = cam([-2.4, 2.9, 3.0], [-3.5, 2.7, -4.5], 38);
      return ({ u, T, bt }) => {
        p.rain.set(T); p.setGlass(T, 1); p.setFog(lerp(0.25, 0.55, u));
        st(T, 1);
        const lit = Math.max(0, Math.floor(beats(T) - 89)) % 5; // 第 89 拍起，一拍亮一格
        faces.forEach(({ cell, a }, i) => {
          const [fx, fy] = FRAMES[i], on = T >= tb(89) && lit === i;
          fr[i].scale.setScalar(on ? 1 + 0.08 * bt.pulse : 1);
          a.set(cell).at(fx, fy - 0.47, WIN.z + 0.14).size(on ? 1 + 0.08 * bt.pulse : 1).noShadow();
        });
        glow.position.set(FRAMES[lit][0], FRAMES[lit][1], WIN.z + 0.3); setOp(glow, T >= tb(89) ? 0.3 + 0.3 * bt.pulse : 0);
        const draw = backOut(seg(u, 0.58, 0.74));
        heart.position.set(WIN.x + 0.9, WIN.y + 1.9, WIN.z + 0.06); heart.scale.setScalar(Math.max(0.001, 0.9 * draw)); setOp(heart, draw * 0.95);
        whale.set(u > 0.56 ? 'whale_point' : T % 2.6 < 0.13 ? 'whale_blink' : 'whale_idle').at(-0.6, 0, -3.3);
        qwen.front(T).at(TABLE.x + 0.5, 0, TABLE.z - 0.95);
        kimi.front(T).at(-5.8, 0, -3.3);
        zai.set('zai_front_1').at(-4.9, 0.16, 1.0).sq(Math.sin(T * 1.6) * 0.02);
        zz.forEach((s, i) => { const ph = frac(T * 0.35 + i * 0.5); s.position.set(-4.3 + ph * 0.5, 1.9 + ph * 0.9, 1.05); s.scale.setScalar(0.3 + ph * 0.35); setOp(s, Math.sin(ph * PI) * 0.9 * (1 - seg(u, 0.5, 0.72))); });
        return track([[0, A], [0.36, B], [1, C]], u);
      };
    },
  },
  {
    id: 'L16', look: 'drizzle', title: '真希望雨能下不停', cast: ['whale', 'doubao', 'gemini', 'claude', 'qwen', 'kimi'],
    note: '「真希望雨能下不停」——俯拍雨巷：红、紫、橙、绿、淡紫，一街的伞像花一样往前走，跟着拍子一颠一颠。本鲸不打伞，在伞中间蹦着走。',
    build: (k) => {
      lane(k);
      const r = makeRain(k, 240, 24, 8, 0, -1, 9);
      const WHO = [['doubao', -5.6, -1.3], ['gemini', -3.6, 1.0], ['claude', 1.4, 1.2], ['qwen', 3.4, -1.2], ['kimi', -1.0, -1.9]] as const;
      const walkers = WHO.map(([id, x, z]) => ({ a: k.actor(id), um: brolly(k, BROLLY[id], 1.25), x, z }));
      const whale = k.actor('whale');
      const rip = many(2, () => k.add(ripple()));
      const A = cam([-1.6, 9.6, 9.6], [-0.2, 0.9, 0], 38), B = cam([1.6, 8.2, 8.8], [0.8, 0.9, 0], 38);
      return ({ u, T, bt }) => {
        r.set(T); rainOp(r, 1);
        walkers.forEach(({ a, um, x, z }, i) => {
          const wx = x + u * 3.2;
          a.walkBy(u * 3.2 + i * 0.3).at(wx, 0, z);
          holdBrolly(um, wx, 0.07 * (i % 2 ? bt.pulse : 1 - bt.pulse), z, 0.06, 0.2);
        });
        const hx = 0.2 + u * 3.2;
        whale.set('whale_wave').at(hx, 0, 0.1).lift(Math.abs(Math.sin(beats(T) * PI)) * 0.45);
        setRipple(rip[0], hx, 0.15, bt.phase, 0.8);
        setRipple(rip[1], PUD[1][0], PUD[1][1], frac(beats(T) * 0.5 + 0.3), 0.7);
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'L17', look: 'rainEve', title: '雨爱的秘密能一直延续', cast: ['whale', 'claude'],
    note: '「雨爱的秘密」——两个人站在渠边，蓝伞往前一压，把脸挡住，伞上面冒出一颗心：秘密。「能一直延续」——镜头顺着水渠摇过去，岸边的灯跟着八分音符一盏接一盏亮到远处。',
    build: (k) => {
      lane(k, NIGHT);
      const r = makeRain(k, 160, 18, 5, -2, -3, 9);
      const whale = k.actor('whale'), claude = k.actor('claude');
      const um = brolly(k, BROLLY.whale, 1.3);
      const heart = k.add(sprite('heart', 0.6, 0xff8fab));
      const lamps = many(11, (i) => {
        const x = 0.5 + i * 2.6;
        k.add(cyl(0.04, 0.05, 0.7, 0x3a4258, 6, 0.02), x, 0, CANAL_Z - 1.25);
        const bulb = k.add(ball(0.15, 0xffffff, false, 0.02), x, 0.82, CANAL_Z - 1.25);
        const mat = basic(0x55607a); bulb.material = mat;
        return { mat, glow: k.add(sprite('glow', 1.9, 0xffd58a, true, 0), x, 0.82, CANAL_Z - 1.2) };
      });
      const boats = many(4, () => { const b = k.add(paperBoat()); b.scale.setScalar(0.26); return b; });
      const off = new THREE.Color(0x55607a), on = new THREE.Color(0xffe2a0);
      const A = cam([-2.9, 1.8, 7.4], [-2.6, 1.3, 1.2], 34), A2 = cam([-2.5, 2.0, 8.8], [-2.55, 1.5, 1.2], 34), C = cam([-0.8, 2.5, 5.0], [10, 0.5, 2.3], 40);
      return ({ u, T, bt }) => {
        r.set(T); rainOp(r, 0.6);
        const hide = ease(seg(T, tb(100.5), tb(101.5)));
        claude.front(T).at(-3.25, 0, 1.2);
        whale.front(T).at(-2.0, 0, 1.2);
        um.position.set(-2.55, 0.72 - hide * 0.2, 1.3 + hide * 0.35); um.rotation.set(hide * 1.05, 0, 0);
        const pop = backOut(seg(T, tb(102), tb(102) + 0.3));
        heart.position.set(-2.6, 2.55 + Math.sin(T * 3) * 0.05, 2.0); heart.scale.setScalar(Math.max(0.001, 0.6 * pop * (1 + 0.12 * bt.pulse))); setOp(heart, pop);
        lamps.forEach((l, i) => { const v = seg(T, tb(103 + i * 0.5), tb(103 + i * 0.5) + 0.18); l.mat.color.copy(off).lerp(on, v); l.glow.scale.setScalar(1.9 * (0.4 + 0.6 * backOut(v))); setOp(l.glow, v * 0.85); });
        boats.forEach((b, i) => { b.position.set(1 + i * 5.5 + u * 2.4, 0.1 + Math.sin(T * 2.2 + i) * 0.03, CANAL_Z); b.rotation.set(0, 0, Math.sin(T * 1.7 + i) * 0.05); });
        return track([[0, A], [0.34, A2], [1, C]], u);
      };
    },
  },
  {
    id: 'L18a', look: 'drizzle', title: '我相信我将会看到', cast: ['whale', 'gpt'], fx: { whiteOut: true },
    note: '「我相信我将会看到」——雨小了。龙娘从画面顶上掠过（只留一道影子扫过地面），把云拨开，一束光落下来。本鲸抬头。',
    build: (k) => {
      lane(k, { clouds: null });
      const r = makeRain(k, 200, 22, 8, 0, -1.5, 9);
      const whale = k.actor('whale'), gpt = k.actor('gpt', 1.5);
      const cm = basic(0x93a4bc);
      const cl = k.add(cloud(3, 4.2, cm), 0, 9.5, -7), cr = k.add(cloud(9, 4.2, cm), 0, 9.8, -7.5);
      const shaft = k.add(sprite('glow', 1, 0xfff1c4, true, 0), 0.6, 9, -5); shaft.scale.set(7, 26, 1);
      const shadow = k.add(dragonShadow(), 0, 0.04, 0);
      const sun = k.add(sprite('glow', 9, 0xfff1c4, true, 0), 0.6, 13, -9);
      const A = cam([0.4, 1.6, 8.8], [0.3, 1.9, 0], 38), B = cam([0.2, 1.5, 10.2], [0.3, 2.7, -1], 41);
      return ({ u, T }) => {
        r.set(T); rainOp(r, lerp(0.75, 0.08, seg(u, 0.1, 0.8)));
        const fly = seg(u, 0.18, 0.62), part = ease(seg(u, 0.3, 0.9));
        gpt.set(Math.floor(T * 6) % 2 ? 'gpt_fly_1' : 'gpt_fly_0').at(lerp(-11, 11, fly), 5.3, -3).noShadow().alpha(fly > 0 && fly < 1 ? 1 : 0);
        shadow.position.set(lerp(-13, 13, fly), 0.04, -0.3); setOp(shadow, fly > 0 && fly < 1 ? 0.4 : 0);
        cl.position.x = -3.6 - part * 9; cr.position.x = 3.8 + part * 9;
        setOp(shaft, part * 0.5); setOp(sun, part * 0.8);
        whale.front(T).at(0.3, 0, 0.4);
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'L18b', look: 'afterRain', title: '彩虹的美丽', cast: ['whale', 'claude'], fx: { whiteIn: true },
    note: '「彩虹的美丽」——雨停了。一道彩虹从左往右画过整个小镇的天空，本鲸在下面蹦起来，小克收了伞站在她旁边。',
    build: (k) => {
      lane(k, CLEAR);
      const bow = rainbow(30, 1.25); k.add(bow.g, 0, -3, -46);
      const whale = k.actor('whale'), claude = k.actor('claude');
      const stars = many(14, (i) => k.add(sprite('star', 0.5, i % 2 ? 0xfff2a8 : 0xffffff, true)));
      const A = cam([0, 2.0, 13], [0, 7.5, -20], 44), B = cam([0, 2.8, 15.5], [0, 9, -20], 46);
      return ({ u, T, bt }) => {
        bow.set(seg(u, 0.02, 0.72), 0.85);
        whale.set('whale_wave').at(-0.6, 0, 0.4).lift(Math.abs(Math.sin(beats(T) * PI)) * 0.5);
        claude.front(T).at(1.3, 0, 0.4).sq(beatSq(bt, 0.04));
        stars.forEach((s, i) => { const ph = frac(T * 0.5 + hash(i)); s.position.set((hash(i + 9) - 0.5) * 22, 1.5 + hash(i + 3) * 9 + ph, -2 - hash(i + 5) * 6); s.scale.setScalar(0.25 + 0.4 * Math.sin(ph * PI)); setOp(s, Math.sin(ph * PI) * 0.9); });
        return glide(A, B, u);
      };
    },
  },
];
