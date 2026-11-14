// 分镜 S12–S22（第 8–16 句 + 片名句）。
import * as THREE from 'three';
import type { ShotSpec } from './engine';
import { burst, cam, island, meadow, memoryBoard, nightCity, path, popWord } from './common';
import { backOut, ease, easeIn, easeOut, gradientMap, hash, heartGeo, inv, lerp, pieceGeo, toon, toonU, type V3 } from './kit';

const PASTEL = [0xffd6a5, 0xfdffb6, 0xcaffbf, 0x9bf6ff, 0xa0c4ff, 0xffc6ff, 0xffadad];

export const SHOTS_B: ShotSpec[] = [
  {
    id: 'S12', from: [7, 0], name: '收集快乐', lyric: '将快乐全都收集',
    note: '晴天的草地拼图上，五颜六色发着光的小拼图（快乐）从天上旋转着落下，一块块掉进鲸鱼娘捧着的蓝饭盆——她的招牌道具；小克在旁边跳。「快乐」两个字跟着鼓点蹦。',
    cast: ['whale', 'claude'],
    build: (k) => {
      meadow(k);
      const whale = k.actor('whale', 1), claude = k.actor('claude', 1);
      const bowl = k.thing('prop_bowl', 1.9);
      const pal = [0xffd166, 0xff8fab, 0x7bdff2, 0xb8f2a0, 0xcdb4ff, 0xffb37b];
      const N = 22;
      const joys = Array.from({ length: N }, (_, i) => ({ m: k.piece([1, -1, 1, -1], toon(pal[i % 6], pal[i % 6], 0.35), { size: 0.36, depth: 0.12, flat: false }), a: hash(i * 1.3) * Math.PI * 2, r: 2.5 + hash(i * 2.9) * 2.5, h: 2.5 + hash(i * 4.1) * 3 }));
      const w = k.word('快乐', { size: 0.75, face: 0xffd166, side: 0xff7aa2 }); w.group.position.set(0.5, 2.45, -1.2);
      return (f) => {
        const t0 = f.T - f.t, t1 = t0 + f.dur, a = f.at(7, 1), b = f.at(7, 6) + 0.25;
        const bx = -0.2, by = 0.62, bz = 0.38;
        whale.play('idle', f.T, 6).at(-0.2, 0, 0);
        bowl.at(bx, by - 0.12, bz);
        claude.play('hop', f.T, 8).at(1.5, 0, -0.2);
        joys.forEach((j, i) => {
          const land = lerp(a, b, i / (N - 1)); const s = inv(land - 0.9, land, f.T);
          j.m.visible = s > 0 && s < 1;
          const ang = j.a + s * 2.5, r = j.r * (1 - easeIn(s));
          j.m.position.set(bx + Math.cos(ang) * r, lerp(by + j.h, by + 0.12, easeIn(s)), bz + Math.sin(ang) * r * 0.6);
          j.m.rotation.set(f.T * 2 + i, f.T * 1.5 + i * 0.7, 0);
        });
        popWord(w, f.T, [f.at(7, 1), f.at(7, 2)], { rise: -1, hit: f.hit, bob: 0.12 });
        return path(f.T, [[t0, cam([1.6, 1.8, 5.4], [0.2, 1.1, 0], 40)], [t1, cam([0.4, 1.6, 4.6], [0.1, 1.2, 0], 38)]]);
      };
    },
  },
  {
    id: 'S13', from: [7, 7], name: '淘汰不开心', lyric: '将不开心全都淘汰',
    note: '同一片草地的边缘。几块暗紫色、冒着青筋怒气贴纸的「不开心」拼图，踩着字被一块块踢飞，翻滚着掉出拼图大地的边；最后「淘汰」两个字也滑下去。',
    cast: ['whale', 'claude'],
    build: (k) => {
      meadow(k, 6, 5);
      const whale = k.actor('whale', 1), claude = k.actor('claude', 1);
      const sad = Array.from({ length: 6 }, (_, i) => ({ m: k.piece([1, 1, -1, -1], 0x5b4b7a, { size: 0.72, depth: 0.25 }), x: 0.6 + (i % 3) * 0.95, z: -0.6 + Math.floor(i / 3) * 1.1, ang: k.thing('fx_anger', 1.4) }));
      const w = k.word('淘汰', { size: 0.8, face: 0x8a76b8, side: 0x2e2244 });
      return (f) => {
        const t0 = f.T - f.t, t1 = t0 + f.dur;
        const kicks = [8, 9, 10, 11, 12, 13].map((c) => f.at(7, c));
        sad.forEach((p, i) => {
          const s = inv(kicks[i], kicks[i] + 1.1, f.T);
          const x = p.x + easeOut(s) * 6.5, y = Math.sin(Math.min(s * 1.6, 1) * Math.PI) * 1.4 - easeIn(inv(0.45, 1, s)) * 7, z = p.z + s * 0.8;
          p.m.position.set(x, s > 0 ? y : 0, z); p.m.rotation.set(s * 4, s * 3, s * 5); p.m.visible = s < 1;
          if (s < 0.2) p.ang.at(x, 0.55 + Math.sin(f.T * 6 + i) * 0.05, z).look({ s: 1 + 0.15 * Math.sin(f.T * 9 + i) });
        });
        whale.play('point', f.T, 8).at(-0.6, 0, 0.2);
        claude.play('tilt', f.T, 7).at(-1.9, 0, -0.4);
        popWord(w, f.T, [f.at(7, 13), f.at(7, 14)], { rise: 1 });
        const fall = inv(f.at(7, 14) + 0.25, t1 + 0.2, f.T);
        w.group.position.set(2.2 + fall * 3, 2.4 - easeIn(fall) * 4, -0.8); w.group.rotation.z = -fall * 1.2;
        return path(f.T, [[t0, cam([0.8, 2.2, 7.0], [1.4, 0.6, 0], 42)], [t1, cam([2.2, 2.6, 7.6], [2.4, 0.4, 0], 44)]]);
      };
    },
  },
  {
    id: 'S14', from: [8, 0], name: '情话', lyric: '你对我说的情话',
    note: '夜里的屋顶，远处是拼图积木搭的城市，窗口亮着灯，月亮很大。小克对鲸鱼娘说话，每唱一个字就冒出一颗小心；唱到「情话」，两个发粉光的立体字从小克身边浮起，慢慢飘到鲸鱼娘面前。',
    cast: ['whale', 'claude'],
    build: (k) => {
      nightCity(k);
      const whale = k.actor('whale', 1), claude = k.actor('claude', 1);
      const hearts = Array.from({ length: 5 }, () => k.thing('fx_heart', 1.6));
      const w = k.word('情话', { size: 0.55, face: 0xffb3c8, side: 0xc2185b, emissive: 0xff6f9a, ei: 0.45 });
      const g = k.glow(0xff8fb0, 2.6, 0);
      return (f) => {
        const t0 = f.T - f.t, t1 = t0 + f.dur;
        claude.play('idle', f.T, 6).at(-0.8, 0, 0);
        whale.play(f.T > f.at(8, 6) ? 'sway' : 'idle', f.T, 6).at(0.8, 0, 0);
        hearts.forEach((h, i) => { const s = f.T - f.at(8, i); if (s < 0 || s > 2) return; h.at(-0.6 + s * 0.5, 1.6 + s * 0.8, 0.1).look({ alpha: 1 - s / 2, s: 0.8 + 0.2 * Math.sin(s * 8) }); });
        popWord(w, f.T, [f.at(8, 5), f.at(8, 6)], { rise: -0.4, spin: 3 });
        const q = ease(inv(f.at(8, 6), t1, f.T));
        w.group.position.set(lerp(-0.5, 0.6, q), lerp(1.9, 2.4, q) + Math.sin(f.T * 2) * 0.06, 0.3);
        g.position.copy(w.group.position); g.material.opacity = 0.6 * inv(f.at(8, 5), f.at(8, 5) + 0.3, f.T);
        return path(f.T, [[t0, cam([0, 1.5, 5.8], [0, 1.2, 0], 40)], [t1, cam([0.3, 1.4, 4.4], [0, 1.4, 0], 38)]]);
      };
    },
  },
  {
    id: 'S15', from: [9, 0], name: '转瞬即逝的烟花', lyric: '像转瞬即逝的烟花',
    note: '仰拍城市夜空。烟花是一颗颗拼图块炸开的：踩着「转」「即」「的」各炸一朵，散得快、灭得也快；唱到「烟花」，两朵最大的同时开在天上，「烟」「花」两个字就嵌在花心里亮一下、又暗下去。两人小小地站在屋顶边。',
    cast: ['whale', 'claude'],
    build: (k) => {
      nightCity(k);
      const whale = k.actor('whale', 0.9), claude = k.actor('claude', 0.9);
      const B = [burst(k, 42, 1, [0xff8fab, 0xffd166]), burst(k, 42, 1, [0x7bdff2, 0xcdb4ff]), burst(k, 42, 1, [0xb8f2a0, 0xffd166]), burst(k, 72, 1.5, [0xffd166, 0xff8fab, 0x7bdff2]), burst(k, 72, 1.5, [0xcdb4ff, 0xffffff, 0xff8fab])];
      const centers: V3[] = [[-9, 12, -26], [8, 14, -30], [-3, 16, -34], [-6, 15, -22], [6, 17, -24]];
      const w = k.word('烟花', { size: 2.0, face: 0xfff1b8, side: 0xff8fab, emissive: 0xffd166, ei: 0.6 });
      return (f) => {
        const t0 = f.T - f.t, t1 = t0 + f.dur;
        const times = [1, 3, 5, 6, 7].map((c) => f.at(9, c));
        B.forEach((b, i) => b(f.T, times[i], centers[i], { life: i < 3 ? 1.3 : 2.2 }));
        whale.play('idle', f.T, 6).at(0.5, 0, 1.5); claude.play('idle', f.T + 0.4, 6).at(-0.5, 0, 1.5);
        popWord(w, f.T, [f.at(9, 6), f.at(9, 7)], { rise: -2, spin: 4 });
        w.chars.forEach((m, i) => {
          const c = centers[3 + i]; const fade = inv(f.at(9, 6 + i) + 1.1, f.at(9, 6 + i) + 2.1, f.T);
          m.position.set(c[0], c[1] + m.position.y, c[2] + 1); m.scale.multiplyScalar(Math.max(0.01, 1 - fade)); m.visible = m.visible && fade < 1;
        });
        return path(f.T, [[t0, cam([0, 1.2, 7.5], [0, 7.5, -22], 56)], [t1, cam([0.6, 1.0, 8.5], [0, 9, -24], 58)]]);
      };
    },
  },
  {
    id: 'S16', from: [10, 0], name: '绽放的一刹那', lyric: '只停在绽放一刹那',
    note: '一颗最大的拼图烟花升空，唱到「绽放」开成一整颗球，然后时间几乎停住：几百块拼图悬在半空，镜头绕着这一刹那转。唱到「一」，像按下快门一样闪白、取景框角亮起；唱完「那」，拼图才重新开始坠落、熄灭。',
    cast: ['whale', 'claude'],
    build: (k) => {
      nightCity(k);
      const whale = k.actor('whale', 0.9), claude = k.actor('claude', 0.9);
      const C0: V3 = [0, 12, -18];
      const big = burst(k, 160, 2.2, [0xff8fab, 0xffd166, 0x7bdff2, 0xb8f2a0, 0xcdb4ff, 0xffffff]);
      const w = k.word('绽放', { size: 1.4, face: 0xffffff, side: 0xff8fab, emissive: 0xffc4d6, ei: 0.7 }); w.group.position.set(...C0);
      return (f) => {
        const t0 = f.T - f.t, t1 = t0 + f.dur, tb = f.at(10, 3), tf = f.at(10, 5), tr = f.at(10, 7) + 0.35;
        const R = tr - tb;
        const slow = (s: number) => (s < 0.3 ? s : s < R ? 0.3 + (s - 0.3) * 0.04 : 0.3 + (R - 0.3) * 0.04 + (s - R) * 0.9);
        big(f.T, tb, C0, { slow, launch: Math.max(0.4, tb - f.at(10, 2)), fade: 1 - inv(tr + 0.3, t1 + 0.3, f.T) });
        popWord(w, f.T, [tb, f.at(10, 4)], { rise: 0, spin: 3, hit: f.hit });
        whale.play('idle', f.T, 6).at(0.5, 0, 1.0); claude.play('idle', f.T + 0.4, 6).at(-0.5, 0, 1.0);
        const flash = f.T >= tf ? Math.exp(-(f.T - tf) * 6) : 0;
        const ang = lerp(-0.25, 0.9, ease(inv(tb, t1, f.T)));
        const orb = cam([C0[0] + Math.sin(ang) * 15, C0[1] - 3, C0[2] + Math.cos(ang) * 15], C0, 50);
        const c = path(f.T, [[t0, cam([0, 1.2, 7.5], [0, 8, -18], 56)], [tb, cam([0, 2.5, 4], [0, 10, -18], 54)], [tb + 0.6, orb]]);
        return { ...c, white: flash * 0.9, frame: f.T >= tf && f.T < tr ? 1 : 0 };
      };
    },
  },
  {
    id: 'S17', from: [11, 0], name: '无法自拔', lyric: '我却已无法自拔',
    note: '粉色的梦里，几百块粉红拼图越堆越高，鲸鱼娘一点点陷进去；身后沿着心形曲线，一块块竖立的红拼图逐个亮起拼成一颗大心。她伸手往上够，唱到「自拔」时只剩上半身露在外面。',
    cast: ['whale'],
    build: (k) => {
      k.setFog(0xffc1d9, 12, 50);
      k.sky(0xff8fbf, 0xffd6e7, 0xd46a9c, {});
      k.lights({ hemi: [0xfff0f6, 0xb0507a, 1.7], dir: [0xffe4ee, 1.4, 2, 8, 6] });
      const whale = k.actor('whale', 1);
      const N = 260;
      const im = new THREE.InstancedMesh(pieceGeo([1, -1, 1, -1], 0.14, true), new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: gradientMap() }), N);
      im.frustumCulled = false; k.root.add(im);
      const pal = [0xff5c8a, 0xff8fab, 0xffb3c6, 0xff3d6e, 0xffc2d4];
      const seeds = Array.from({ length: N }, (_, i) => { im.setColorAt(i, new THREE.Color(pal[i % 5])); return { r: Math.sqrt(hash(i * 1.7)) * 3.2, a: hash(i * 2.3) * Math.PI * 2, h: hash(i * 3.9), sp: hash(i * 5.1) }; });
      const dummy = new THREE.Object3D();
      const HN = 34;
      const heart = Array.from({ length: HN }, (_, i) => {
        const t = (i / HN) * Math.PI * 2; const x = 16 * Math.sin(t) ** 3, y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        const m = k.piece([1, -1, 1, -1], toon(0xff4d6d, 0xff4d6d, 0.25), { size: 0.5, depth: 0.15, flat: false }); m.position.set(x * 0.13, 2.7 + y * 0.13, -5); return m;
      });
      const bokeh = Array.from({ length: 14 }, (_, i) => ({ g: k.glow(i % 2 ? 0xffffff : 0xffb3d1, 1.5 + hash(i) * 2.5, 0.3), x: (hash(i * 3.1) - 0.5) * 14, y: hash(i * 4.2) * 7, z: -5 - hash(i * 6.3) * 6 }));
      const w = k.word('自拔', { size: 0.75, face: 0xffe0ea, side: 0xd81b60 });
      return (f) => {
        const t0 = f.T - f.t, t1 = t0 + f.dur;
        const rise = ease(inv(t0, f.at(11, 6) + 0.4, f.T));
        for (let i = 0; i < N; i++) {
          const s = seeds[i]; const y = Math.max(0, 1.05 - s.r * 0.3) * rise * (0.4 + 0.6 * s.h) + Math.sin(f.T * 2 + i) * 0.03 - 0.2;
          dummy.position.set(Math.cos(s.a) * s.r, y, Math.sin(s.a) * s.r * 0.8 + 0.3); dummy.rotation.set(s.sp * 3 + f.T * 0.2 * s.sp, s.a, s.h * 2);
          dummy.scale.set(0.55, 1, 0.55); dummy.updateMatrix(); im.setMatrixAt(i, dummy.matrix);
        }
        im.instanceMatrix.needsUpdate = true;
        const sink = ease(inv(f.at(11, 1), f.at(11, 6), f.T)) * 0.5;
        whale.play(f.T > f.at(11, 3) ? 'point' : 'idle', f.T, 6).at(0, -sink, 0.15, -sink);
        const span = f.at(11, 4) - t0;
        heart.forEach((m, i) => { const st = t0 + (i / HN) * span; const s = inv(st, st + 0.3, f.T); m.visible = s > 0; const b = Math.max(0.01, backOut(s)) * 0.5; m.scale.set(b, b, 1); m.rotation.z = Math.sin(f.T + i) * 0.1; });
        bokeh.forEach((b, i) => b.g.position.set(b.x + Math.sin(f.T * 0.4 + i) * 0.6, b.y + Math.sin(f.T * 0.3 + i * 2) * 0.4, b.z));
        popWord(w, f.T, [f.at(11, 5), f.at(11, 6)], { rise: 1 });
        w.group.position.set(1.9, 2.5 - sink * 0.4, 0);
        return path(f.T, [[t0, cam([0, 2.6, 7.4], [0, 1.6, 0], 44)], [t1, cam([0.3, 1.8, 5.6], [0, 1.2, 0], 42)]]);
      };
    },
  },
  {
    id: 'S18', from: [12, 0], name: '时差', lyric: '我们的爱总有时差',
    note: '世界从中间劈成两半：左边白天、太阳、绿草，小克在那边；右边黑夜、月亮、星星，鲸鱼娘在这边。猫（Gemini）站在昼夜的缝上，左右手各举一只猫耳钟（她的「北京 / 太平洋」两只钟），先左右张望，最后不得不选。唱到「爱」，中间一颗心分成两颗各自漂开；「时」落在白天，「差」落在黑夜。',
    cast: ['whale', 'claude', 'gemini'],
    build: (k) => {
      k.setFog(0x8aa0d0, 20, 70);
      k.sky(0x5fb8ff, 0xdff4ff, 0xbfe3ff, { split: [0x070c2e, 0x26336e, 0x0a0f2a], stars: 1 });
      k.lights({ hemi: [0xffffff, 0x445588, 1.6], dir: [0xffffff, 1.4, 0, 8, 6] });
      k.board(5, 6, 1.6, (ix, iz) => [0x9ee6a0, 0x8fdc93, 0xaef0ad][(ix + iz) % 3], { depth: 0.25, cx: -4.0 });
      k.board(5, 6, 1.6, (ix, iz) => [0x2c3a78, 0x34448a, 0x26336a][(ix + iz) % 3], { depth: 0.25, cx: 4.0 });
      k.add(new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 9.6), new THREE.MeshBasicMaterial({ color: 0xfff4c8 })), 0, 0.03, 0);
      const sun = k.glow(0xfff1b0, 9, 0.9); sun.position.set(-9, 8, -18);
      k.add(new THREE.Mesh(new THREE.SphereGeometry(0.9, 20, 14), new THREE.MeshBasicMaterial({ color: 0xfff3d1, fog: false })), 9, 8, -18);
      const mg = k.glow(0xd6e4ff, 7, 0.6); mg.position.set(9, 8, -18);
      const claude = k.actor('claude', 1), whale = k.actor('whale', 1), gem = k.actor('gemini', 1);
      const clkL = k.thing('prop_catclock', 2.2), clkR = k.thing('prop_catclock', 2.2);
      const hL = k.thing('fx_heart', 2), hR = k.thing('fx_heart', 2);
      const wS = k.word('时', { size: 1.0, face: 0xffd166, side: 0xd08a1a }), wC = k.word('差', { size: 1.0, face: 0x9fdcff, side: 0x24408a });
      wS.group.position.set(-3.2, 3.0, 0); wC.group.position.set(3.2, 3.0, 0);
      return (f) => {
        const t0 = f.T - f.t, t1 = t0 + f.dur;
        claude.play('idle', f.T, 6).at(-3.2, 0, 0).look({ tint: 0xfff2dc });
        whale.play('idle', f.T + 0.4, 5).at(3.2, 0, 0).look({ tint: 0xaab8ff });
        gem.play(f.T > f.at(12, 5) ? 'choose' : 'lookaround', f.T, 7).at(0, 0, 0.9);
        const bob = Math.sin(f.T * 3) * 0.05;
        clkL.at(-0.75, 0.75 + bob, 1.0); clkR.at(0.75, 0.75 - bob, 1.0).look({ flip: true, tint: 0xc8d2ff });
        const th = f.at(12, 3); const hs = inv(th, th + 1.6, f.T);
        if (f.T > th) {
          const a = 1 - inv(0.7, 1, hs) * 0.6;
          hL.at(-easeOut(hs) * 2.4, 2.4 + Math.sin(f.T * 2) * 0.05, 0.4).look({ alpha: a });
          hR.at(easeOut(hs) * 2.4, 2.4 - Math.sin(f.T * 2) * 0.05, 0.4).look({ alpha: a, tint: 0xaab8ff });
        }
        popWord(wS, f.T, [f.at(12, 6)], { rise: -1 }); popWord(wC, f.T, [f.at(12, 7)], { rise: -1 });
        return path(f.T, [[t0, cam([0, 2.8, 10.5], [0, 1.3, 0], 46)], [t1, cam([0, 2.3, 8.6], [0, 1.5, 0], 44)]]);
      };
    },
  },
  {
    id: 'S19', from: [13, 0], name: '骗自己放下', lyric: '也为你骗自己放下',
    note: '黄昏。鲸鱼娘捧着一颗红色的心形拼图，远处小克那块橘色拼图正越漂越远。唱到「骗自己」她晃着身子装作没事、额角冒汗；唱到「放下」，弯腰把心放在地上，转身走开——好东西又一次先推了出去。',
    cast: ['whale', 'claude'],
    build: (k) => {
      k.setFog(0xc89ab0, 16, 60);
      k.sky(0x3d2c6b, 0xff9f80, 0x2a2350, { sun: { dir: [-0.6, 0.05, -1], color: 0xffb080, size: 20, str: 0.8 } });
      k.lights({ hemi: [0xffd0c0, 0x40305a, 1.5], dir: [0xffb890, 1.5, -6, 5, -2] });
      k.board(9, 7, 1.6, (ix, iz) => [0xb8a2c8, 0xa892ba, 0xc4b0d2][(ix + 2 * iz) % 3], { depth: 0.25 });
      const whale = k.actor('whale', 1);
      const heart = new THREE.Mesh(heartGeo(0.25), toon(0xff4d6d, 0xff4d6d, 0.25)); k.root.add(heart);
      const sweat = k.thing('fx_sweat', 1.6);
      const far = k.piece([1, -1, 1, -1], 0xffa65c, { size: 1.6, depth: 0.3 }); const claude = k.actor('claude', 0.8);
      const w = k.word('放下', { size: 0.6, face: 0xffc2d1, side: 0x8a3a5a });
      return (f) => {
        const t0 = f.T - f.t, t1 = t0 + f.dur, tp = f.at(13, 6), td = f.at(13, 7) + 0.3, tw = td + 0.35;
        const fq = inv(t0, t1, f.T); const fx = lerp(-2, -5, fq), fz = lerp(-10, -18, fq);
        far.position.set(fx, 0.2 + Math.sin(f.T * 1.5) * 0.1, fz); claude.play('idle', f.T, 5).at(fx, 0.2 + Math.sin(f.T * 1.5) * 0.1, fz);
        let wx = 0.4, st = 'idle', at = f.T, loop = true, flip = false;
        if (f.T > f.at(13, 3) && f.T < tp) st = 'sway';
        if (f.T >= tp && f.T < tw) { st = 'bow'; at = f.T - tp; loop = false; }
        if (f.T >= tw) { st = 'walk'; flip = true; wx = 0.4 + (f.T - tw) * 0.9; }
        whale.play(st, at, st === 'walk' ? 10 : 7, loop).at(wx, 0, 0).look({ flip });
        if (f.T > f.at(13, 4) && f.T < f.at(13, 4) + 1.2) sweat.at(wx + 0.45, 1.6, 0.05);
        const hq = ease(inv(tp, td, f.T));
        heart.position.set(lerp(0.4, 0.1, hq), lerp(0.8, 0.14, hq), lerp(0.3, 0.75, hq)); heart.rotation.set(lerp(0, -Math.PI / 2, hq), 0, 0); heart.scale.setScalar(0.5);
        popWord(w, f.T, [f.at(13, 6), f.at(13, 7)], { rise: 1.4 });
        const wl = ease(inv(td, td + 0.8, f.T)); w.group.position.set(-0.7, lerp(1.9, 0.25, wl), 1.0); w.group.rotation.x = -wl * Math.PI / 2;
        return path(f.T, [[t0, cam([-1.2, 1.4, 5.0], [0.2, 0.9, 0], 40)], [t1, cam([-0.4, 1.8, 6.4], [0.8, 0.7, -1], 42)]]);
      };
    },
  },
  {
    id: 'S20', from: [14, 0], name: '炙热的你', lyric: '爱炙热的你',
    note: '整个世界烧成橘红色，火星往上飘。小克站在三层叠起来的拼图台上，背着光；鲸鱼娘把那颗心高高举向她，唱到「炙热」心发烫、发光，跟着鼓点一跳一跳。',
    cast: ['whale', 'claude'],
    build: (k) => {
      k.setFog(0x5a1a24, 14, 50);
      k.sky(0x5a0f22, 0xff6a3d, 0x2a0a12, { sun: { dir: [-0.3, 0.2, -1], color: 0xffb070, size: 10, str: 0.9 } });
      k.lights({ hemi: [0xffc49a, 0x3a0f18, 1.5], dir: [0xffa060, 2.0, -3, 5, -4] });
      k.board(8, 6, 1.6, (ix, iz) => [0x6a2a30, 0x7a3036, 0x5e2429][(ix + iz) % 3], { depth: 0.25 });
      [0, 1, 2].forEach((i) => { const m = k.piece([1, -1, 1, -1], [0xffa65c, 0xffb877, 0xffc890][i], { size: 1.5 - i * 0.15, depth: 0.4 }); m.position.set(-1.9, 0.45 + i * 0.45, -0.8); });
      const claude = k.actor('claude', 1), whale = k.actor('whale', 1);
      const hm = toonU(0xff3b3b, 0xff5a1f, 0.6);
      const heart = new THREE.Mesh(heartGeo(0.3), hm); k.root.add(heart);
      const hg = k.glow(0xff7a3a, 3, 0.8);
      const embers = Array.from({ length: 70 }, (_, i) => ({ g: k.glow(i % 3 ? 0xff9a4a : 0xffd27a, 0.25 + hash(i) * 0.3, 0.9), x: (hash(i * 2.7) - 0.5) * 12, z: (hash(i * 3.9) - 0.5) * 6 - 1, sp: 0.6 + hash(i * 5.3) * 1.2, o: hash(i * 7.1) * 10 }));
      const w = k.word('炙热', { size: 0.95, face: 0xffd27a, side: 0xc0392b, emissive: 0xff7a1f, ei: 0.5 }); w.group.position.set(-0.2, 3.7, -1.2);
      return (f) => {
        const t0 = f.T - f.t, t1 = t0 + f.dur, tz = f.at(14, 1);
        claude.play('idle', f.T, 6).at(-1.9, 1.35, -0.8, 1.35);
        const up = ease(inv(t0, tz, f.T));
        whale.play(f.T > tz ? 'point' : 'idle', f.T, 6).at(1.1, 0, 0.2);
        const pulse = 1 + 0.08 * Math.sin(f.T * 9) + 0.15 * f.hit;
        heart.position.set(lerp(1.0, 0.6, up), lerp(0.85, 2.2, up), 0.5); heart.rotation.set(0, Math.sin(f.T * 1.5) * 0.4, 0); heart.scale.setScalar(0.55 * pulse);
        hm.emissiveIntensity = 0.5 + 0.6 * up + 0.4 * f.hit;
        hg.position.copy(heart.position); hg.material.opacity = 0.5 + 0.4 * up; hg.scale.setScalar(2.5 + 2.5 * up * pulse);
        embers.forEach((e) => { const y = (f.T * e.sp + e.o) % 6; e.g.position.set(e.x + Math.sin(f.T + e.o) * 0.3, y, e.z); e.g.material.opacity = 0.9 * (1 - y / 6); });
        popWord(w, f.T, [f.at(14, 1), f.at(14, 2)], { rise: -1, hit: f.hit });
        return path(f.T, [[t0, cam([2.6, 0.7, 5.6], [-0.2, 1.8, 0], 44)], [t1, cam([0.9, 0.9, 4.9], [-0.4, 2.0, 0], 42)]]);
      };
    },
  },
  {
    id: 'S21', from: [15, 0], name: '忘了爱自己', lyric: '却忘了爱自己',
    note: '火灭了，又回到开头那座小浮岛。心已经飘向远处那团暖光；鲸鱼娘一个人站着，颜色慢慢褪掉，身边缺着的那一块还空着——那块就是她自己。「自己」两个淡蓝色的字落进空位里。镜头往后拉，她又变得很小。',
    cast: ['whale'],
    build: (k) => {
      k.setFog(0x161c36, 14, 50);
      k.sky(0x0c1124, 0x3a4470, 0x0a0e1e, { stars: 0.7 });
      k.lights({ hemi: [0x9fb0e0, 0x10142a, 1.3], dir: [0xb8c8ff, 1.2, 3, 8, 6] });
      const isl = island(k, 0x6fa2ff);
      const whale = k.actor('whale', 1);
      const heart = new THREE.Mesh(heartGeo(0.25), toon(0xff4d6d, 0xff4d6d, 0.35)); k.root.add(heart);
      const warm = k.glow(0xffb36b, 7, 0.6); warm.position.set(10, 4.8, -18);
      const w = k.word('自己', { size: 0.6, face: 0xcfe0ff, side: 0x40507a });
      const om = isl.outline.material as THREE.LineBasicMaterial;
      return (f) => {
        const t0 = f.T - f.t, t1 = t0 + f.dur, dim = inv(t0, t1, f.T);
        whale.play('sad', f.t, 5, false).at(-0.4, 0, -0.1).look({ sil: 0.4 * dim, silColor: 0x5a6488 });
        const hq = ease(dim); heart.position.set(lerp(2.5, 9, hq), lerp(2.2, 4.5, hq), lerp(-2, -16, hq)); heart.rotation.y = f.T; heart.scale.setScalar(0.45);
        om.opacity = 0.35 + 0.35 * Math.sin(f.T * 3) ** 2;
        popWord(w, f.T, [f.at(15, 4), f.at(15, 5)], { rise: 0.6 });
        const fall = ease(inv(f.at(15, 5) + 0.3, t1, f.T));
        w.group.position.set(0.8, lerp(2.0, 0.2, fall), 0.8); w.group.rotation.x = -fall * Math.PI / 2;
        w.chars.forEach((m) => m.scale.multiplyScalar(1 - 0.5 * fall));
        return path(f.T, [[t0, cam([1.2, 1.7, 4.4], [0, 0.9, 0], 38)], [t1, cam([3.0, 6.5, 13], [0, 0.5, 0], 44)]]);
      };
    },
  },
  {
    id: 'S22', from: [16, 0], name: '把回忆拼好给你', lyric: '把回忆拼好给你',
    note: '片名句。天亮了，彩色拼图大地上，六块回忆拼图踩着片名一个字一块飞回相框；唱到「给你」，鲸鱼娘把拼好的回忆推到小克面前（她的「推出去」），小克提裙接住。龙娘、猫、Kimi、豆包、千问、狐狸都围在后面——开头那些灰色的小影子，现在都有了颜色。片名立体字卡在画面上方，最后渐白。',
    cast: ['whale', 'claude', 'gpt', 'gemini', 'kimi', 'doubao', 'qwen', 'zai'],
    build: (k) => {
      k.setFog(0xffe3c8, 22, 80);
      k.sky(0x8fc8ff, 0xfff0d6, 0xffc49a, { sun: { dir: [0.3, 0.25, -1], color: 0xffe0a8, size: 26, str: 1.0 } });
      k.lights({ hemi: [0xffffff, 0xb08a70, 1.8], dir: [0xfff0d8, 1.8, 3, 9, 7] });
      k.board(12, 9, 1.6, (ix, iz) => PASTEL[(ix * 3 + iz * 5) % 7], { depth: 0.3, open: true });
      const mb = memoryBoard(k, 0.82);
      const whale = k.actor('whale', 1), claude = k.actor('claude', 1);
      const crew = ([['gpt', -4.2, -2.2], ['gemini', -2.8, -2.8], ['kimi', -1.2, -3.3], ['doubao', 1.2, -3.3], ['qwen', 2.8, -2.8], ['zai', 4.2, -2.2]] as [string, number, number][]).map(([id, x, z]) => ({ a: k.actor(id, 0.95), id, x, z }));
      const confetti = Array.from({ length: 40 }, (_, i) => ({ m: k.piece([1, -1, 1, -1], PASTEL[i % 7], { size: 0.18, depth: 0.08, flat: false }), x: (hash(i * 1.1) - 0.5) * 10, z: (hash(i * 2.2) - 0.5) * 4 - 0.5, sp: 0.8 + hash(i * 3.3), o: hash(i * 4.4) * 8 }));
      return (f) => {
        const t0 = f.T - f.t;
        const tt = [0, 1, 2, 3, 4, 5, 6].map((i) => f.at(16, i));
        mb.update(f.T, [tt[0], tt[1], tt[2], tt[3], tt[4], tt[6]].map((x) => x + 0.1), 0.45);
        const give = ease(inv(tt[5], tt[6] + 0.5, f.T));
        mb.group.position.set(lerp(-0.6, 0.7, give), 1.95 + Math.sin(f.T * 1.6) * 0.05, 0.5);
        mb.glow(f.T > tt[6] ? 0.25 + 0.15 * Math.sin(f.T * 4) : 0);
        whale.play(f.T > tt[5] ? 'point' : 'idle', f.T, 6).at(-1.7, 0, 0.7);
        claude.play(f.T > tt[6] ? 'curtsy' : 'idle', f.T > tt[6] ? f.T - tt[6] : f.T, 7, f.T <= tt[6]).at(1.8, 0, 0.7);
        crew.forEach((c, i) => { if (c.id === 'gpt') c.a.play('hover', f.T, 6).at(c.x, 0.9 + Math.sin(f.T * 2) * 0.12, c.z, 0); else c.a.play('idle', f.T + i * 0.3, 6).at(c.x, 0, c.z); });
        confetti.forEach((c, i) => { const y = 7 - ((f.T * c.sp + c.o) % 8); c.m.position.set(c.x + Math.sin(f.T + i) * 0.4, y, c.z); c.m.rotation.set(f.T * 3 + i, f.T * 2, i); c.m.visible = f.T > tt[6]; });
        const end = inv(59.2, 60, f.T);
        return { ...path(f.T, [[t0, cam([0, 2.1, 6.2], [0, 1.6, 0], 40)], [60, cam([0, 3.4, 11.5], [0, 1.5, -0.8], 44)]]), white: end };
      };
    },
  },
];
