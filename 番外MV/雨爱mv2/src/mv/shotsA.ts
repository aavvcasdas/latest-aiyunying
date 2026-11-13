// 《雨爱》镜头表（上）：序章 I1–I3 · 主歌 L01–L04 · 导歌 L05–L08 · 副歌一 L09–L11
// 写法照《童话镇》：一个镜头 = build（搭景，只跑一次）+ 逐帧纯函数（只读时间，角色和道具每帧都重新写一遍）。
import * as THREE from 'three';
import { cam, glide, lineU, track, type ShotDef } from '../engine/core';
import { basic, clamp01, cloud, disc, ease, flower, glowMat, hash, lerp, paperBoat, seg, setOp, sprite, tree } from '../engine/kit';
import { notebook, riceBowl } from '../engine/props';
import {
  BEAT, COT_Z, INSIDE_Y, LANE_WIN_X, PI, POS, RWIN, S, SILL, WIN_H, WIN_W,
  glassDrops, heartMark, lane, many, picnicCloth, ringOne, roomSet, skyline, umbrella, vessel, windowStage,
} from './sets';

/** 伞举起来以后，伞柄底端离地的高度（伞面正好罩在头顶上方） */
export const UMB_Y = 0.78;
const mat = (m: THREE.Mesh) => m.material as THREE.MeshBasicMaterial;

export const SHOTS_A: ShotDef[] = [
  {
    id: 'I1', look: 'rain', title: '要下雨了', cast: ['whale'], fx: { title: true },
    note: '镜头从压低的云层摇下来，落到亮着灯的小屋；本鲸沿着石板路往家走——开场就有人在动。',
    build: (k) => {
      const L = lane(k);
      const whale = k.actor('whale');
      const A = cam([-1.5, 9.5, 17], [-3.5, 13, -10], 40), B = cam([-3.2, 2.5, 11.5], [-5.0, 2.1, -3], 36);
      return ({ u, T }) => {
        L.tick(T, 0.1 + 0.22 * u);
        whale.walkX(3.6, -2.4, u, 0, 0.9);
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'I2', look: 'cozy', title: '屋里的人', cast: ['whale', 'kimi', 'qwen', 'zai'],
    note: '暖屋全景：千问守着茶桌，Kimi 站在记忆绳下不动，狐狸在垫子上打盹；本鲸进门，走向那扇窗。',
    build: (k) => {
      const R = roomSet(k);
      const whale = k.actor('whale'), kimi = k.actor('kimi'), qwen = k.actor('qwen'), zai = k.actor('zai');
      const zz = many(3, () => k.add(sprite('zzz', 0.34, 0xffffff)));
      const A = cam([1.6, 2.5, 8.8], [0.6, 2.2, -4], 38), B = cam([-0.4, 2.6, 7.4], [0.2, 2.3, -4], 36);
      return ({ u, T }) => {
        R.tick(T, 0.45);
        const p = seg(u, 0, 0.8);
        if (p < 1) whale.walkX(6.4, 0.3, p, 0, -1.3); else whale.front(T).at(0.3, 0, -1.3);
        kimi.front(T).at(POS.kimi[0], POS.kimi[1], POS.kimi[2]);
        qwen.front(T).at(POS.qwen[0], POS.qwen[1], POS.qwen[2]);
        zai.set('zai_front_1').at(POS.zai[0], POS.zai[1], POS.zai[2]).tilt(0.08).sq(0.03 * Math.sin(T * 1.6));
        zz.forEach((s, i) => { const ph = (T * 0.35 + i / 3) % 1; s.position.set(POS.zai[0] + 0.6 + ph * 0.5, POS.zai[1] + 1.5 + ph * 0.9, POS.zai[2]); s.scale.setScalar(0.2 + ph * 0.26); setOp(s, Math.sin(ph * PI)); });
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'I3', look: 'golden', title: '晴天的记忆', cast: ['whale', 'claude'], fx: { whiteIn: true, whiteOut: true },
    note: '闪回：晴天的草坡上，本鲸把自己的蓝饭盆推到小克面前（她的习性：饭先推给别人）。这就是歌里的「你」。',
    build: (k) => {
      k.add(disc(95, 0x9bd68a));
      const clouds = skyline(k, { c1: 0x86c98f, c2: 0x8fc0d8, cloud: 0xffffff, n: 8, low: 28 });
      k.add(tree(4.6, 0x5fc46a, 3), -4.6, 0, -2.6); k.add(tree(3.4, 0x6fd07a, 5), 5.2, 0, -3.4);
      many(16, (i) => k.add(flower([0xff9fb5, 0xffe08a, 0xbfa8ff, 0xffffff][i % 4], 0.3 + hash(i) * 0.2), (hash(i * 3) - 0.5) * 12, 0, -0.6 - hash(i * 3 + 1) * 3));
      k.add(picnicCloth(), 0, 0.02, 1.0);
      const bowl = k.add(riceBowl(0.2));
      const whale = k.actor('whale'), claude = k.actor('claude');
      const petals = many(14, (i) => k.add(sprite('petal', 0.22, i % 2 ? 0xffc2d4 : 0xffffff)));
      const hearts = many(3, () => k.add(sprite('heart', 0.3, 0xff8fb0)));
      const A = cam([0.4, 2.3, 7.6], [0, 1.1, 0.6], 36), B = cam([-0.2, 1.8, 5.9], [0, 1.05, 0.6], 34);
      return ({ u, T }) => {
        clouds(T);
        const push = ease(seg(u, 0.28, 0.6));
        if (u < 0.28) whale.front(T); else whale.set(u < 0.62 ? 'whale_point' : 'whale_wave');
        whale.at(-1.25, 0, 0.5);
        const joy = seg(u, 0.6, 0.92);
        claude.set(u > 0.6 ? 'claude_front_1' : 'claude_front_0').at(1.25, 0, 0.5).lift(Math.abs(Math.sin(joy * PI * 3)) * 0.14 * (1 - joy));
        bowl.position.set(lerp(-0.5, 0.55, push), 0.03, 1.2);
        petals.forEach((s, i) => { const ph = (T * 0.18 + hash(i)) % 1; s.position.set((hash(i + 5) - 0.5) * 9 + Math.sin(T + i) * 0.3, 4.2 - ph * 4.2, (hash(i + 9) - 0.5) * 3 + 0.5); setOp(s, Math.sin(ph * PI)); });
        hearts.forEach((s, i) => { const ph = seg(u, 0.62 + i * 0.07, 0.94 + i * 0.02); s.position.set(0.55 + (i - 1) * 0.4, 0.6 + ph * 1.5, 1.1); setOp(s, Math.sin(ph * PI)); });
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'L01', look: 'rain', title: '窗外的天气', cast: ['whale'],
    note: '先看天：云压着屋顶走。镜头摇下来，落到窗里的本鲸——她隔着玻璃在看窗外的天气。',
    build: (k) => {
      const W = windowStage(k);
      const whale = k.actor('whale');
      const A = cam([0.6, 3.0, 9.5], [0.2, 9.5, -8], 40), B = cam([-0.3, 2.3, 6.6], [-0.4, 2.0, 0], 30), C = cam([-0.5, 2.25, 5.8], [-0.5, 1.95, 0], 30);
      return ({ u, T }) => {
        W.tick(T, 0.15 + 0.3 * u);
        whale.front(T).at(-1.0, INSIDE_Y, -1.0);
        return track([[0, A], [0.5, B], [1, C]], u);
      };
    },
  },
  {
    id: 'L02', look: 'cozy', title: '你多变的表情', cast: ['whale', 'claude'],
    note: '田字窗的四格，每两拍亮一格：晴、多云、起风、下雨——每格里是小克的一个表情。四格亮齐后一拍一换。',
    build: (k) => {
      const R = roomSet(k);
      const whale = k.actor('whale');
      const { x, y, w, h, z } = RWIN;
      const BG = [0xffe9a8, 0xd3dbe6, 0xffcdbd, 0x8fa8cf];
      const POSE = ['claude_front_1', 'claude_front_0', 'claude_side_0', 'claude_side_1'];
      const panes = many(4, (i) => {
        const cx = x + ((i % 2 ? 1 : -1) * w) / 4, cy = y + (i < 2 ? 0.75 : 0.25) * h;
        const bg = new THREE.Mesh(new THREE.PlaneGeometry(w / 2, h / 2), glowMat(BG[i], 1)); k.add(bg, cx, cy, z - 0.9);
        return { cx, cy, bg, a: k.actor('claude', 0.74) };
      });
      const sun = k.add(sprite('glow', 1.3, 0xfff2a8, true, 0.9), panes[0].cx + 0.62, panes[0].cy + 0.36, z - 0.8);
      const cl = k.add(cloud(3, 0.1, basic(0xffffff)), panes[1].cx + 0.5, panes[1].cy + 0.4, z - 0.8);
      const leaves = many(4, () => k.add(sprite('leaf', 0.2, 0xffa94d)));
      const dr = many(6, () => k.add(sprite('drop', 0.14, 0xe4f2ff)));
      const A = cam([1.3, 2.6, 7.0], [1.0, 2.4, z], 34), B = cam([1.2, 2.5, 5.7], [1.0, 2.45, z], 36);
      return ({ u, T }) => {
        R.tick(T, 0.5);
        whale.front(T).at(3.4, 0, -1.0);
        const nb = (T - S[1]) / BEAT; // 开口后过了几拍
        const on = (i: number) => nb / 2 - i >= 0;
        const mix = nb >= 7 ? Math.floor(nb) : 0;
        panes.forEach((p, i) => {
          const age = nb / 2 - i, lit = on(i);
          p.bg.visible = lit;
          p.a.set(POSE[(i + mix) % 4]).at(p.cx, p.cy - h / 4 + 0.08, z - 0.6).noShadow().alpha(lit ? 1 : 0).flash(lit ? 1 - seg(age, 0, 0.18) : 0);
        });
        setOp(sun, on(0) ? 0.82 + 0.1 * Math.sin(T * 3) : 0);
        cl.visible = on(1); cl.position.x = panes[1].cx + 0.5 + Math.sin(T * 0.8) * 0.12;
        leaves.forEach((s, i) => { const ph = (T * 0.5 + i / 4) % 1; s.position.set(panes[2].cx - 0.95 + ph * 1.9, panes[2].cy + 0.45 - ph * 0.5 + Math.sin(ph * 9 + i) * 0.1, z - 0.7); setOp(s, on(2) ? Math.sin(ph * PI) : 0); });
        dr.forEach((s, i) => { const ph = (T * 0.9 + i / 6) % 1; s.position.set(panes[3].cx - 0.9 + (i / 5) * 1.8, panes[3].cy + 0.65 - ph * 1.3, z - 0.7); setOp(s, on(3) ? Math.sin(ph * PI) * 0.9 : 0); });
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'L03', look: 'rain', title: '雨陪我哭泣', cast: ['whale'],
    note: '「下雨了」：整条巷子的雨下起来；镜头推到窗前。「雨陪我哭泣」：她闭上眼，两颗雨珠正好顺着玻璃滑过她的脸——哭的是雨。',
    build: (k) => {
      const L = lane(k);
      const whale = k.actor('whale');
      const gd = glassDrops(14, WIN_W, WIN_H); k.add(gd.g, LANE_WIN_X, SILL + WIN_H / 2, COT_Z + 0.16);
      const tears = many(2, () => k.add(sprite('drop', 0.17, 0xe4f2ff)));
      const A = cam([1.5, 5.2, 15], [-3.5, 2.4, -2], 40), B = cam([-7.6, 2.5, 6.4], [LANE_WIN_X - 0.4, 2.15, COT_Z], 30), C = cam([-7.9, 2.3, 4.9], [LANE_WIN_X - 0.5, 1.92, COT_Z], 22);
      return (f) => {
        const { u, T } = f;
        L.tick(T, 0.25 + 0.75 * ease(seg(u, 0, 0.3)));
        gd.set(T, seg(u, 0.15, 0.6));
        const cry = seg(lineU(f, 2), 0.34, 1);
        if (cry > 0) whale.set('whale_blink'); else whale.front(T);
        whale.at(LANE_WIN_X - 1.0, INSIDE_Y, COT_Z - 1.0);
        tears.forEach((s, i) => { const p = seg(cry, i * 0.18, 0.75 + i * 0.2); s.position.set(LANE_WIN_X - 1.0 + (i ? 0.2 : -0.2), INSIDE_Y + 0.92 - p * p * 0.5, COT_Z + 0.18); setOp(s, p > 0 && p < 1 ? 1 : 0); });
        return track([[0, A], [0.42, B], [1, C]], u);
      };
    },
  },
  {
    id: 'L04', look: 'cozy', title: '看不清', cast: ['whale', 'claude'],
    note: '从屋里看出去：玻璃起了雾，窗外撑伞走远的小克只剩一团红。「我也不想看清」——本鲸转身，自己走出画面。',
    build: (k) => {
      const R = roomSet(k);
      const whale = k.actor('whale'), claude = k.actor('claude', 0.9);
      const umb = k.add(umbrella(1.0, 0xe85d75, 1.4));
      const A = cam([-0.2, 2.5, 7.4], [0.2, 2.35, RWIN.z], 36), B = cam([0.5, 2.5, 5.0], [0.6, 2.4, RWIN.z], 35);
      return (f) => {
        const { u, T } = f;
        R.tick(T, 1);
        R.fog.visible = true; mat(R.fog).opacity = 0.12 + 0.68 * ease(seg(u, 0.05, 0.75));
        const cx = lerp(0.0, 2.3, u), cz = lerp(-8.2, -10.4, u);
        claude.walkBy(u * 2.6).at(cx, -0.3, cz).noShadow();
        umb.position.set(cx - 0.1, 0.4, cz); umb.rotation.z = 0.08;
        const go = seg(lineU(f, 3), 0.42, 1.0);
        if (go <= 0) whale.front(T).at(-1.9, 0, -2.6); else whale.walkX(-1.9, -5.4, go, 0, -2.6);
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'L05', look: 'blue', title: '安静的抽离', cast: ['whale', 'claude'],
    note: '雨里，一把伞下两个人。本鲸把伞推到小克那边（推出去的动作），自己退进雨里，转身走开——不回头，也不吵。',
    build: (k) => {
      const L = lane(k);
      const whale = k.actor('whale'), claude = k.actor('claude');
      const umb = k.add(umbrella(1.25, 0xe85d75, 1.5));
      const A = cam([0.2, 1.9, 7.6], [0, 1.35, 0.8], 36), B = cam([-0.5, 2.1, 9.0], [-0.4, 1.35, 0.8], 36);
      return ({ u, T }) => {
        L.tick(T, 1);
        const give = ease(seg(u, 0.1, 0.4)), leave = seg(u, 0.4, 1);
        umb.position.set(lerp(0.05, 0.95, give), UMB_Y, 0.75); umb.rotation.z = lerp(0, -0.1, give);
        claude.set(u < 0.55 ? 'claude_side_0' : 'claude_front_0').flip(u < 0.55).at(0.8, 0, 0.8);
        if (leave <= 0) whale.front(T).at(-0.75, 0, 0.8); else whale.walkX(-0.75, -3.1, leave, 0, 0.8);
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'L06', look: 'cozy', title: '不忍揭晓', cast: ['whale'],
    note: '窗台上那本没看完的本子：封面掀开一条缝，漏出一点光，又自己合上。她闭上眼——结局不看了。',
    build: (k) => {
      const R = roomSet(k);
      const whale = k.actor('whale');
      const nb = notebook(0.56, 0.4, 0x7a4a6c); k.add(nb.g, 0.5, RWIN.y, RWIN.z + 0.34, 0.2, 1.6);
      const glow = k.add(sprite('glow', 1.4, 0xffc4dc, true, 0), 0.75, RWIN.y + 0.22, RWIN.z + 0.42);
      const A = cam([0.95, 2.0, -0.5], [0.1, 1.25, -4.3], 38), B = cam([0.85, 1.97, -0.62], [0.1, 1.25, -4.3], 38);
      return ({ u, T }) => {
        R.tick(T, 1);
        const open = Math.sin(clamp01(seg(u, 0.08, 0.8)) * PI);
        nb.cover.rotation.z = open * 0.8;
        setOp(glow, open * 0.85);
        whale.set(u > 0.64 ? 'whale_blink' : 'whale_idle').at(-0.55, 0, -3.6);
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'L07', look: 'blue', title: '泪流在心里', cast: ['whale'],
    note: '特写：玻璃外面全是雨，她脸上是干的。胸口描出一颗心，雨滴在心里面往下落——泪流在心里。',
    build: (k) => {
      const W = windowStage(k);
      const whale = k.actor('whale');
      const heart = k.add(heartMark(0.64, '#ff9db8', true), -0.98, INSIDE_Y + 0.6, -0.9);
      const inner = many(3, () => k.add(sprite('drop', 0.13, 0x9fd8ff)));
      const A = cam([-0.5, 2.15, 5.4], [-1.0, 1.75, -1], 26), B = cam([-0.85, 2.05, 4.6], [-1.0, 1.7, -1], 24);
      return ({ u, T }) => {
        W.tick(T, 1);
        whale.set('whale_big_blink').at(-1.0, INSIDE_Y, -1.0);
        mat(heart).opacity = 0.5 + 0.45 * ease(seg(u, 0, 0.3));
        inner.forEach((s, i) => { const ph = (T * 0.55 + i / 3) % 1; s.position.set(-0.98 + (i - 1) * 0.11, INSIDE_Y + 0.78 - ph * 0.32, -0.88); setOp(s, Math.sin(ph * PI) * 0.95); });
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'L08', look: 'rain', title: '学会放弃', cast: ['whale'],
    note: '她在河沿松开一只折纸船（和《童话镇》开头是同一只）。船顺着雨水漂走，她挥了挥手——放手不是丢掉。',
    build: (k) => {
      const L = lane(k);
      const whale = k.actor('whale');
      const boat = k.add(paperBoat(), 0, 0, 0, 0, 0.3);
      const A = cam([0.4, 1.4, 8.7], [0.4, 0.95, 2.2], 32), B = cam([1.6, 1.6, 9.1], [1.3, 0.9, 2.4], 32);
      return ({ u, T }) => {
        L.tick(T, 1);
        if (u < 0.28) whale.front(T); else whale.set('whale_wave');
        whale.at(-1.0, 0, 2.0);
        boat.position.set(-0.3 + 4.4 * Math.pow(u, 1.3), 0.1 + Math.sin(T * 2.3) * 0.03, 3.5);
        boat.rotation.y = 0.15; boat.rotation.z = Math.sin(T * 1.7) * 0.05;
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'L09', look: 'rain', title: '一滴滴清晰', cast: ['whale'],
    note: '副歌起。窗台上的蓝饭盆接雨：每一拍落一滴，落进去就是一圈涟漪、一个音符。她在玻璃后面闭着眼听。',
    build: (k) => {
      const W = windowStage(k);
      const whale = k.actor('whale');
      const bowl = vessel(0.24, 0.2); k.add(bowl.g, 0.85, SILL, 0.38);
      const drop = k.add(sprite('drop', 0.2, 0xe4f2ff));
      const ring = ringOne(); k.add(ring.m);
      const notes = many(2, (i) => k.add(sprite('note', 0.32, i ? 0xffe08a : 0xbfe3ff)));
      const A = cam([1.5, 2.1, 5.0], [-0.05, 1.6, 0], 27), B = cam([1.2, 2.0, 4.5], [0, 1.55, 0], 26);
      return ({ u, T, bt }) => {
        W.tick(T, 0.8);
        bowl.set(0.35);
        whale.set('whale_blink').at(-1.0, INSIDE_Y, -1.0);
        const top = SILL + 2.3, surf = SILL + 0.11;
        drop.position.set(0.85, lerp(top, surf, bt.phase * bt.phase), 0.38); setOp(drop, bt.phase > 0.06 ? 1 : 0);
        ring.m.position.set(0.85, surf + 0.012, 0.38); ring.set(bt.phase * 1.8, 0.17);
        notes.forEach((s, i) => { const act = bt.idx % 2 === i; s.position.set(0.85 + (i ? 0.38 : -0.32), surf + 0.28 + bt.phase * 0.75, 0.45); setOp(s, act ? Math.sin(bt.phase * PI) : 0); });
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'L10', look: 'blue', title: '渗入我的爱里', cast: ['whale', 'claude'],
    note: '地上一汪心形的水。记忆里半透明的小克呼出一口白气，飘到心的上方变成雨滴，落下去，渗进去——心一点点亮起来。',
    build: (k) => {
      const L = lane(k);
      const whale = k.actor('whale'), claude = k.actor('claude');
      const heart = heartMark(2.5, '#ff9db8'); heart.rotation.x = -PI / 2; k.add(heart, 0, 0.06, 1.0);
      const glow = k.add(sprite('glow', 3.4, 0xff9db8, true, 0), 0, 0.35, 1.0);
      const breaths = many(4, () => k.add(sprite('smoke', 0.3, 0xffffff)));
      const drops = many(4, () => k.add(sprite('drop', 0.22, 0xffd0e0)));
      const rings = many(4, () => { const r = ringOne(0xffffff); k.add(r.m); return r; });
      const A = cam([0, 4.8, 8.6], [0, 0.7, 0.8], 36), B = cam([0, 3.6, 7.0], [0, 0.75, 0.8], 34);
      return ({ u, T }) => {
        L.tick(T, 0.8);
        whale.set('whale_blink').at(-2.3, 0, 0.7);
        claude.set('claude_side_0').flip().at(2.3, 0, 0.7).alpha(0.5).tint(0xcfe0ff).noShadow();
        const cyc = T / (BEAT * 2);
        for (let i = 0; i < 4; i++) {
          const p = (cyc + i / 4) % 1; // 一口气：呼出 → 飘到心上方 → 变成雨滴落下 → 渗进去
          const a = seg(p, 0, 0.5), d = seg(p, 0.5, 0.82), r = seg(p, 0.82, 1);
          const tx = (i - 1.5) * 0.45;
          breaths[i].position.set(lerp(1.75, tx, ease(a)), lerp(1.2, 2.3, Math.sin((a * PI) / 2)), 0.9);
          breaths[i].scale.setScalar(0.22 + a * 0.2);
          setOp(breaths[i], p < 0.5 ? 0.25 + Math.sin(a * PI) * 0.5 : 0);
          drops[i].position.set(tx, lerp(2.3, 0.15, d * d), 0.95); setOp(drops[i], p >= 0.5 && p < 0.82 ? 1 : 0);
          rings[i].m.position.set(tx, 0.08, 1.0 + (i % 2 ? 0.2 : -0.15)); rings[i].set(p >= 0.82 ? r : 1, 0.6);
        }
        mat(heart).opacity = 0.5 + 0.45 * u;
        setOp(glow, 0.15 + 0.4 * u + 0.12 * Math.sin(cyc * PI * 8) ** 2);
        return glide(A, B, u);
      };
    },
  },
  {
    id: 'L11', look: 'rain', title: '雨能下不停', cast: ['whale'],
    note: '她自己走进雨里，仰着头张开手，踩着拍子转圈；脚边的水花一拍一迸。镜头从脚边升到半空，雨铺满整条巷子。',
    build: (k) => {
      const L = lane(k, { rainN: 320 });
      const whale = k.actor('whale');
      const sp = many(8, () => k.add(sprite('drop', 0.16, 0xe4f2ff)));
      const A = cam([0.3, 1.25, 5.8], [0, 1.5, 0.8], 38), B = cam([0, 7.0, 13.5], [0, 1.0, 0], 40);
      return ({ u, T, bt }) => {
        L.tick(T, 1);
        whale.set('whale_wave').flip(bt.idx % 4 >= 2).at(0, 0, 0.8).lift(bt.pulse * 0.16).sq(-bt.pulse * 0.04);
        sp.forEach((s, i) => { const a = (i / 8) * PI * 2, ph = bt.phase; s.position.set(Math.cos(a) * (0.3 + ph * 0.8), 0.1 + Math.sin(ph * PI) * 0.5, 0.8 + Math.sin(a) * 0.3 * (0.3 + ph)); setOp(s, (1 - ph) * 0.9); });
        return glide(A, B, u);
      };
    },
  },
];
