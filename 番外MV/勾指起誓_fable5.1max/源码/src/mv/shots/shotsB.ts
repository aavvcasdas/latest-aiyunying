// 镜头表（中）：间奏 N1–N3 · 主歌二 L17–L24 · 副歌二 L25–L32
import { drawSprite, frontFrame } from '../atlas';
import {
  cam, clamp, cloud, ease, easeOut, fill, flowers, giftBox, glide, glowSpot, GOLD, grassTufts, ground, H, hash, heart, hills, lantern, lerp, lightShaft, LOOKS, many, moon, paper, paperBoat, petals, PI, rain, ribbonRoad, ring, seg, sky, snow, sparkles, splitLine, star4, stars, streetlamp, sun, TAU, thread, tree, umbrella, view, vignette, W, inkLine, pine, candle, bareTree,
} from '../kit';
import type { ShotDef } from '../timeline';
import { act, beatSq, bob, dragonPass, front, GROUND, landscape, side, thing, walk, witnesses } from './common';

export const SHOTS_B: ShotDef[] = [
  // ---------------- 间奏 ----------------
  {
    id: 'N1', section: '间奏', title: '间奏 · 纸戏台暖场', cast: ['doubao', 'gemini', 'qwen', 'kimi', 'zai'], look: 'magic',
    note: '间奏。纸戏台拉开红幕，豆包第一个踩拍把场子热起来（她的习性：先陪着，把场子热起来再退到边上），地砖一格格跟着鼓点亮；猫、千问、Kimi 陆续跟着晃，狐狸在角落打盹。',
    draw: (f) => {
      const { ctx, u, T, bt } = f;
      fill(ctx, '#2a1430');
      // 地砖按拍亮
      for (let i = 0; i < 12; i++) for (let j = 0; j < 3; j++) { const lit = ((i + j * 5 + bt.n) % 7) === 0 ? bt.pulse : 0.08; ctx.fillStyle = `hsla(${(i * 37 + j * 90) % 360},70%,${55 + lit * 30}%,${0.35 + lit * 0.6})`; ctx.fillRect(100 + i * 145, GROUND - 10 + j * 70, 138, 64); }
      // 吊灯笼
      many(7, (i) => lantern(ctx, 200 + i * 250, 180 + Math.sin(T * 1.4 + i) * 14, 40, 1, T));
      const n = Math.min(5, 1 + Math.floor(u * 6));
      const xs = [W * 0.5, W * 0.3, W * 0.7, W * 0.15, W * 0.86];
      act(f, 'doubao', 'step', xs[0], GROUND, { scale: 4.4, sq: beatSq(bt, 0.05) });
      if (n > 1) act(f, 'gemini', 'sway', xs[1], GROUND, { scale: 4, sq: beatSq(bt, 0.05) });
      if (n > 2) { act(f, 'qwen', bt.down && bt.phase < 0.5 ? 'spin' : 'sway', xs[2], GROUND, { scale: 4, sq: beatSq(bt, 0.05) }); thing(f, 'prop_fan', xs[2] + 80, GROUND - 200 + bob(T, 6, 4), 4); }
      if (n > 3) act(f, 'kimi', 'nod', xs[3], GROUND, { scale: 4 }, 0.8);
      if (n > 4) { act(f, 'zai', 'doze', xs[4], GROUND, { scale: 4 }, 0.6); thing(f, `fx_zzz_${Math.floor(T * 2) % 3}`, xs[4] + 90, GROUND - 330 - (T * 30) % 30, 4, 0.9); }
      // 追光
      const sx = W * 0.5 + Math.sin(T * 1.2) * 500;
      lightShaft(ctx, sx, 0, 260, GROUND + 60, '255,230,180', 0.28 + bt.pulse * 0.15);
      lightShaft(ctx, W - sx, 0, 260, GROUND + 60, '200,180,255', 0.22);
      // 红幕
      const curtain = (x: number, flip: number) => { ctx.fillStyle = '#9b2335'; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + flip * 260, 0); for (let y = 0; y <= H; y += 40) ctx.lineTo(x + flip * (200 + Math.sin(y / 70 + T) * 18), y); ctx.lineTo(x, H); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#c9a24e'; ctx.fillRect(flip > 0 ? x : x - 260, 0, 260, 26); };
      curtain(0, 1); curtain(W, -1);
      vignette(ctx, 0.4, '20,8,30');
    },
  },
  {
    id: 'N2', section: '间奏', title: '间奏 · 星河上的纸船', cast: ['whale', 'claude', 'kimi'], look: 'night',
    note: '两人坐纸船顺着星河漂，鲸鱼娘站在船头挥手，小克在船尾看书；大月亮挂在头顶，Kimi 还坐在上面。水面上漂着许多小灯，镜头跟着船缓缓滑。',
    draw: (f) => {
      const { ctx, u, T } = f;
      sky(ctx, 'night'); stars(ctx, T, 180, 77, 1, H * 0.7);
      moon(ctx, W * 0.72, 220, 130, 0.6); front(f, 'kimi', W * 0.72 - 30, 335, { scale: 2.6, shadow: false });
      hills(ctx, 640, '#1b254a', 120, 1.0, 1.4, u * 200); hills(ctx, 700, '#172040', 70, 1.6, 2.4, u * 400);
      const g = ctx.createLinearGradient(0, 700, 0, H); g.addColorStop(0, '#2b3f8a'); g.addColorStop(1, '#101a3a'); ctx.fillStyle = g; ctx.fillRect(0, 700, W, H - 700);
      glowSpot(ctx, W * 0.72, 760, 300, '255,240,200', 0.18);
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 2; for (let i = 0; i < 9; i++) { ctx.beginPath(); for (let x = 0; x <= W; x += 40) ctx.lineTo(x, 730 + i * 40 + Math.sin(x / 140 - T * 2 + i) * 6); ctx.stroke(); }
      for (let i = 0; i < 16; i++) { const x = ((hash(i) * W - T * (20 + hash(i + 1) * 30) - u * 300) % (W + 200) + W + 200) % (W + 200) - 100; const y = 760 + hash(i + 2) * 280; lantern(ctx, x, y, 14 + hash(i + 3) * 10, 0.9, T); }
      const bx = W * 0.46 + Math.sin(T * 0.5) * 30, by = 900 + Math.sin(T * 1.8) * 8;
      const rot = Math.sin(T * 1.3) * 0.04;
      ctx.save(); ctx.translate(bx, by); ctx.rotate(rot); ctx.translate(-bx, -by);
      paperBoat(ctx, bx, by, 260, 0);
      act(f, 'whale', 'wave', bx + 110, by - 40, { scale: 3.6, shadow: false });
      act(f, 'claude', 'read', bx - 110, by - 40, { scale: 3.6, flip: true, shadow: false }, 0.7);
      thing(f, 'prop_book', bx - 70, by - 160, 3.6);
      ctx.restore();
      sparkles(ctx, T, bx, by + 40, 240, 10, '#cfe0ff', 88, 7);
      vignette(ctx, 0.3);
    },
  },
  {
    id: 'N3', section: '间奏', title: '间奏 · 走过四季的路', cast: ['whale', 'claude', 'gpt'], look: 'day',
    note: '横移跟拍：两人沿着飘带小路一直走，路边的树从开花、到浓绿、到落叶、到积雪——画面从左到右跨过四季。末尾龙影从头顶掠过，光落下来，接进第二段主歌。',
    draw: (f) => {
      const { ctx, u, T } = f;
      const off = u * 2600;
      const season = u * 4; // 0 春 1 夏 2 秋 3 冬
      sky(ctx, 'day'); sky(ctx, 'golden', clamp(season - 1.5)); sky(ctx, 'snow', clamp(season - 2.5));
      sun(ctx, W * 0.8, 180, 70, '#fff2b0', 2.6);
      const c = cam(off, 0, 1);
      view(ctx, c, 3, () => { for (let i = -1; i < 4; i++) hills(ctx, GROUND - 180, lerp(0, 1, clamp(season - 2.5)) > 0.5 ? LOOKS.snow.far : LOOKS.day.far, 160, 1.0, 0.4 + i, -i * W); });
      view(ctx, c, 1.6, () => { hills(ctx, GROUND - 80, season > 3.2 ? LOOKS.snow.mid : season > 2.2 ? '#c9a76a' : LOOKS.day.mid, 100, 1.7, 2.2); });
      view(ctx, c, 1, () => {
        ground(ctx, GROUND, season > 3.3 ? LOOKS.snow.ground : season > 2.3 ? '#d9b36a' : LOOKS.day.ground);
        ribbonRoad(ctx, GROUND - 30, 70, '#f0e2c2', 18, 0);
        for (let i = 0; i < 14; i++) { const tx = 300 + i * 380; const s = (tx / 3800) * 4; const col = s < 1 ? '#ffb7c5' : s < 2 ? '#5fae76' : s < 3 ? '#e9a23b' : '#eef4fa'; if (s < 3) tree(ctx, tx, GROUND + 4, 220 + hash(i) * 90, col, i); else bareTree(ctx, tx, GROUND + 4, 420 + hash(i) * 60, '#6a5a50'); }
        grassTufts(ctx, GROUND + 10, T, 60, 5, season > 3 ? '#c9d8e6' : '#4e9a5a');
        const d = off;
        walk(f, 'whale', d, off + W * 0.42, GROUND, { scale: 3.6 });
        walk(f, 'claude', d + 70, off + W * 0.54, GROUND, { scale: 3.6 });
      });
      if (season < 1.2) petals(ctx, T, 40, '#ffb7c5', 1, 1, 40);
      else if (season > 2 && season < 3.2) petals(ctx, T, 40, '#e9a23b', 2, 1.4, 70);
      if (season > 3) snow(ctx, T, 160, 3, clamp(season - 3) * 1.6);
      dragonPass(f, seg(u, 0.72, 0.98), 130, 1, 2.6, null);
      if (u > 0.8) lightShaft(ctx, W * 0.5, 0, 600, H, '255,245,210', 0.3 * seg(u, 0.8, 1));
    },
  },
  // ---------------- 主歌二 ----------------
  {
    id: 'L17', section: '主歌二', title: '你是我万水千山的冒险', cast: ['whale', 'gemini'], look: 'paper',
    note: '摊开一张手绘地图：墨线山、蓝线河、一条虚线画出路线。鲸鱼娘变成地图上的小探险家沿着虚线走，路口有只猫在两块路牌之间来回看、最后替她指了一条（猫的习性：先给两个看法，最后必须选一个）。',
    draw: (f) => {
      const { ctx, u, lineU } = f;
      fill(ctx, '#5a3c28');
      const c = cam(lerp(-300, 500, ease(u)), 0, 1.0);
      view(ctx, c, 1, () => {
        paper(ctx, W / 2 + 200, H / 2, W * 1.6, H * 0.92, 0, false, '#f4e6c8');
        // 山
        for (let i = 0; i < 16; i++) { const x = -400 + i * 190 + hash(i) * 80, y = 320 + hash(i + 2) * 120, s = 60 + hash(i + 4) * 60; ctx.fillStyle = '#e8d6b0'; ctx.strokeStyle = '#6b4a30'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - s, y); ctx.lineTo(x, y - s * 1.1); ctx.lineTo(x + s, y); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(x, y - s * 1.1); ctx.lineTo(x + s * 0.2, y - s * 0.7); ctx.lineTo(x - s * 0.1, y - s * 0.6); ctx.stroke(); }
        // 河
        ctx.strokeStyle = '#6aa5d9'; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.beginPath(); for (let x = -600; x <= W * 1.8; x += 30) ctx.lineTo(x, 560 + Math.sin(x / 180) * 50 + Math.sin(x / 70) * 12); ctx.stroke();
        ctx.strokeStyle = '#a9cdeb'; ctx.lineWidth = 5; ctx.stroke();
        // 树与小屋
        for (let i = 0; i < 10; i++) { const x = -300 + i * 330 + hash(i + 9) * 100, y = 720 + hash(i + 11) * 160; pine(ctx, x, y, 70, '#5a8f60'); }
        // 路线虚线
        ctx.setLineDash([18, 16]); ctx.strokeStyle = '#8a3b2b'; ctx.lineWidth = 5; ctx.beginPath(); const route = (x: number) => 820 + Math.sin(x / 240) * 60; for (let x = -500; x <= W * 1.8; x += 20) ctx.lineTo(x, route(x)); ctx.stroke(); ctx.setLineDash([]);
        // 路口与路牌
        const px = 1120; ctx.fillStyle = '#8a5a3c'; ctx.fillRect(px - 8, route(px) - 190, 16, 190);
        ctx.fillStyle = '#d9b36a'; ctx.save(); ctx.translate(px, route(px) - 170); ctx.rotate(-0.15); ctx.fillRect(-90, -18, 90, 36); ctx.restore(); ctx.save(); ctx.translate(px, route(px) - 120); ctx.rotate(0.12); ctx.fillRect(0, -18, 90, 36); ctx.restore();
        act(f, 'gemini', 'choose', px + 90, route(px + 90) + 10, { scale: 2.8 }, 0.9);
        const d = lerp(-200, 980, lineU);
        walk(f, 'whale', d + 200, d, route(d) + 6, { scale: 2.8 });
        // 指南针
        ctx.strokeStyle = '#6b4a30'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(W * 1.15, 220, 60, 0, TAU); ctx.stroke(); ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.moveTo(W * 1.15, 165); ctx.lineTo(W * 1.15 - 14, 220); ctx.lineTo(W * 1.15 + 14, 220); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#6b4a30'; ctx.beginPath(); ctx.moveTo(W * 1.15, 275); ctx.lineTo(W * 1.15 - 14, 220); ctx.lineTo(W * 1.15 + 14, 220); ctx.closePath(); ctx.fill();
        inkLine(ctx, W * 0.95, 320, 180, 1, 7, '#6b4a30', 2); inkLine(ctx, W * 0.95, 350, 140, 1, 8, '#6b4a30', 2);
      });
      vignette(ctx, 0.4);
    },
  },
  {
    id: 'L18', section: '主歌二', title: '要找的标记点', cast: ['whale', 'claude'], look: 'paper',
    note: '镜头推向地图上那个金色的标记：一圈一圈的光晕从标记点荡开，小克就站在标记上。虚线路尽头，鲸鱼娘走到她面前停下。',
    draw: (f) => {
      const { ctx, u, T, lineU } = f;
      fill(ctx, '#5a3c28');
      const c = glide(cam(0, 0, 1), cam(60, 40, 1.25), u);
      view(ctx, c, 1, () => {
        paper(ctx, W / 2, H / 2, W * 1.2, H * 0.92, 0, false, '#f4e6c8');
        ctx.setLineDash([18, 16]); ctx.strokeStyle = '#8a3b2b'; ctx.lineWidth = 5; ctx.beginPath(); for (let x = -200; x <= W * 0.56; x += 20) ctx.lineTo(x, 760 + Math.sin(x / 240) * 50); ctx.stroke(); ctx.setLineDash([]);
        for (let i = 0; i < 5; i++) { const x = 200 + i * 420, y = 330 + hash(i + 2) * 80, s = 80; ctx.fillStyle = '#e8d6b0'; ctx.strokeStyle = '#6b4a30'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x - s, y); ctx.lineTo(x, y - s * 1.1); ctx.lineTo(x + s, y); ctx.closePath(); ctx.fill(); ctx.stroke(); }
        // 标记点
        const mx = W * 0.62, my = 790;
        for (let k = 0; k < 3; k++) { const p = (T * 0.6 + k / 3) % 1; ctx.strokeStyle = `rgba(242,193,78,${1 - p})`; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(mx, my, 40 + p * 260, (40 + p * 260) * 0.35, 0, 0, TAU); ctx.stroke(); }
        ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(mx - 40, my - 40); ctx.lineTo(mx + 40, my + 40); ctx.moveTo(mx + 40, my - 40); ctx.lineTo(mx - 40, my + 40); ctx.stroke();
        ctx.fillStyle = GOLD; star4(ctx, mx, my - 150 + bob(T, 8), 30 + 6 * f.bt.pulse);
        front(f, 'claude', mx, my - 10, { scale: 3.4, glow: 'rgba(255,230,160,0.35)' });
        const d = easeOut(lineU);
        const wx = lerp(W * 0.1, mx - 150, d);
        if (d < 0.98) walk(f, 'whale', (wx - W * 0.1) * 1.2, wx, 760 + Math.sin(wx / 240) * 50 + 10, { scale: 3.4 });
        else front(f, 'whale', wx, 760 + Math.sin(wx / 240) * 50 + 10, { scale: 3.4 });
        sparkles(ctx, T, mx, my - 80, 160, 12, '#fff2a8', 17, 10);
      });
      vignette(ctx, 0.4);
    },
  },
  {
    id: 'L19', section: '主歌二', title: '你是我分割人生的线', cast: ['whale'], look: 'day',
    note: '一条金线从画面顶端垂直落下，把世界切成两半：左边是遇见之前——只有墨线、没有颜色；右边是之后——花开着、太阳亮着。鲸鱼娘站在线的左边，看着右边。',
    draw: (f) => {
      const { ctx, T, lineU } = f;
      const x = W * 0.5;
      const drop = easeOut(seg(lineU, 0, 0.45));
      // 右：有颜色
      landscape(ctx, 'day', T, 0, GROUND, true);
      flowers(ctx, GROUND + 10, T, 50, 19, undefined, 150);
      tree(ctx, W * 0.8, GROUND + 4, 300, '#5fae76', 5);
      // 左：去色（纸 + 墨线）
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, lerp(W, x, drop), H); ctx.clip();
      fill(ctx, '#efe4cc');
      hills(ctx, GROUND - 180, '#e6dac0', 170, 1.0, 0.4); hills(ctx, GROUND - 90, '#dccfb0', 120, 1.6, 2.1); hills(ctx, GROUND - 10, '#cfc1a0', 70, 2.3, 4.0);
      ground(ctx, GROUND, '#e3d6b8');
      tree(ctx, W * 0.16, GROUND + 4, 280, '#d8ccae', 6, '#a89476'); bareTree(ctx, W * 0.3, GROUND + 4, 380, '#7a6a5a');
      for (let i = 0; i < 20; i++) { ctx.strokeStyle = 'rgba(80,60,40,0.3)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(hash(i) * W, 120 + hash(i + 3) * 300); ctx.lineTo(hash(i) * W + 60, 120 + hash(i + 3) * 300 + 10); ctx.stroke(); }
      ctx.restore();
      side(f, 'whale', x - 130, GROUND, { scale: 4.4, sq: beatSq(f.bt, 0.02) });
      thing(f, 'prop_bowl', x - 130 - 110, GROUND - 40, 4.4);
      // 线
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, lerp(0, H + 20, drop)); ctx.clip(); splitLine(ctx, x, GOLD, 7); ctx.restore();
      if (drop >= 1) sparkles(ctx, T, x, H * 0.5, 40, 10, '#fff2a8', 29, 8);
    },
  },
  {
    id: 'L20', section: '主歌二', title: '又将它们相连', cast: ['whale', 'claude'], look: 'day',
    note: '那条线弯下来，变成一根从鲸鱼娘手边连到小克手边的金线；线连上的那一刻，左半边的世界也有了颜色。分开的两段人生被同一根线系在一起。',
    draw: (f) => {
      const { ctx, T, lineU } = f;
      const x = W * 0.5;
      const p = ease(seg(lineU, 0.05, 0.7));
      landscape(ctx, 'day', T, 0, GROUND, true);
      flowers(ctx, GROUND + 10, T, 50, 19, undefined, 150);
      tree(ctx, W * 0.8, GROUND + 4, 300, '#5fae76', 5); tree(ctx, W * 0.16, GROUND + 4, 280, '#5fae76', 6);
      ctx.save(); ctx.globalAlpha = 1 - p; ctx.beginPath(); ctx.rect(0, 0, x, H); ctx.clip();
      fill(ctx, '#efe4cc'); hills(ctx, GROUND - 180, '#e6dac0', 170, 1.0, 0.4); hills(ctx, GROUND - 90, '#dccfb0', 120, 1.6, 2.1); hills(ctx, GROUND - 10, '#cfc1a0', 70, 2.3, 4.0); ground(ctx, GROUND, '#e3d6b8'); tree(ctx, W * 0.16, GROUND + 4, 280, '#d8ccae', 6, '#a89476');
      ctx.restore();
      const wx = x - 130, cx = x + 230;
      side(f, 'whale', wx, GROUND, { scale: 4.4, sq: beatSq(f.bt, 0.02) });
      const ca = seg(lineU, 0, 0.3);
      side(f, 'claude', cx, GROUND, { scale: 4.4, flip: true, alpha: ca, sq: beatSq(f.bt, 0.02) });
      // 线：直线收短，弯成两人之间的线
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, lerp(H + 20, GROUND - 160, p)); ctx.clip(); splitLine(ctx, x, GOLD, 7); ctx.restore();
      thread(ctx, wx + 100, GROUND - 160, cx - 100, GROUND - 160, 60, T, p);
      if (p >= 1) { sparkles(ctx, T, x + 50, GROUND - 200, 120, 10, '#fff2a8', 39, 9); heart(ctx, x + 50, GROUND - 300 + bob(T, 6), 20, '#ff7a9a'); }
      petals(ctx, T, 20 * p, '#ffb7c5', 49, 1, 40);
    },
  },
  {
    id: 'L21', section: '主歌二', title: '你是前世千次的回眸', cast: ['whale', 'claude'], look: 'dusk',
    note: '黄昏的长桥。桥上一个接一个淡淡的小克的影子向远处延伸——每一个都在某一瞬间回过头来，像前世的一千次回眸依次亮起；鲸鱼娘站在桥这头。',
    draw: (f) => {
      const { ctx, u, T } = f;
      sky(ctx, 'dusk'); sun(ctx, W * 0.5, 470, 120, '#ffb27a', 3.2);
      hills(ctx, 600, '#9d7fb5', 100, 0.9, 1.5); hills(ctx, 680, '#7a5f99', 70, 1.5, 3.3);
      const g = ctx.createLinearGradient(0, 700, 0, H); g.addColorStop(0, '#f0a080'); g.addColorStop(1, '#5a4680'); ctx.fillStyle = g; ctx.fillRect(0, 700, W, H - 700);
      // 桥（透视向远处）
      const c = glide(cam(0, 0, 1), cam(0, -20, 1.1), u);
      view(ctx, c, 1, () => {
        ctx.fillStyle = '#c9b7a0'; ctx.beginPath(); ctx.moveTo(0, 1000); ctx.lineTo(W * 0.42, 720); ctx.lineTo(W * 0.58, 720); ctx.lineTo(W, 1000); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(60,40,50,0.45)'; ctx.lineWidth = 3; ctx.stroke();
        for (let i = 0; i < 8; i++) { const p = i / 8; const y = lerp(990, 735, Math.pow(p, 0.8)); const xl = lerp(40, W * 0.43, Math.pow(p, 0.8)), xr = W - xl; ctx.fillStyle = '#8a5a3c'; ctx.fillRect(xl - 6, y - 60 * (1 - p * 0.8), 12, 60 * (1 - p * 0.8)); ctx.fillRect(xr - 6, y - 60 * (1 - p * 0.8), 12, 60 * (1 - p * 0.8)); }
        // 千次回眸：由远到近的影子
        for (let i = 9; i >= 0; i--) {
          const p = i / 9; const y = lerp(760, 1040, Math.pow(1 - p, 1.3)); const s = lerp(1.1, 4.2, Math.pow(1 - p, 1.3));
          const x = W * 0.5 + (i % 2 ? 1 : -1) * lerp(20, 120, 1 - p) * 0.6;
          const glance = (Math.sin(T * 2.2 - i * 0.9) > 0.55);
          const key = glance ? frontFrame('claude', T) : 'claude_side_0';
          drawSprite(ctx, key, x, y, { scale: s, flip: false, alpha: 0.35 + 0.65 * (1 - p), shadowAlpha: 0.12 });
        }
        side(f, 'whale', W * 0.22, 1060, { scale: 4.6, sq: beatSq(f.bt, 0.02) });
      });
      petals(ctx, T, 26, '#ffd9a8', 59, 0.8, 40);
      vignette(ctx, 0.3);
    },
  },
  {
    id: 'L22', section: '主歌二', title: '虔诚牵的手', cast: ['whale', 'claude', 'qwen', 'kimi'], look: 'magic',
    note: '烛光里的小祭坛。两人面对面各行一礼，金线在两人之间亮起；千问在正中主持，Kimi 举着卷轴把这句誓言记下。只有烛火在动。',
    draw: (f) => {
      const { ctx, u, T, lineU } = f;
      fill(ctx, '#1d1430');
      stars(ctx, T, 60, 99, 0.5, H * 0.4);
      glowSpot(ctx, W * 0.5, 600, 800, '255,200,130', 0.35);
      // 台阶
      ctx.fillStyle = '#3a2a4a'; ctx.fillRect(W * 0.2, 820, W * 0.6, 40); ctx.fillStyle = '#2d2040'; ctx.fillRect(W * 0.1, 860, W * 0.8, 40); ground(ctx, 900, '#241a33');
      many(9, (i) => candle(ctx, W * 0.22 + i * (W * 0.56) / 8, 820, 50 + hash(i) * 40, T + i));
      many(6, (i) => lantern(ctx, 260 + i * 280, 160 + Math.sin(T + i) * 10, 34, 0.9, T));
      const c = glide(cam(0, 0, 1), cam(0, 20, 1.08), u);
      view(ctx, c, 1, () => {
        front(f, 'qwen', W * 0.5, 820, { scale: 3.2 }); thing(f, 'prop_fan', W * 0.5 + 60, 700 + bob(T, 3), 3.2);
        act(f, 'kimi', 'nod', W * 0.84, 900, { scale: 3.4 }, 0.6); thing(f, 'prop_scroll', W * 0.84 - 80, 790, 3.4);
        act(f, 'whale', 'bow', W * 0.36, 1000, { scale: 4.6 }, 0.6);
        act(f, 'claude', 'curtsy', W * 0.64, 1000, { scale: 4.6, flip: true }, 0.6);
        thread(ctx, W * 0.36 + 110, 820, W * 0.64 - 110, 820, 50, T, ease(seg(lineU, 0.1, 0.6)));
      });
      vignette(ctx, 0.5, '10,6,20');
    },
  },
  {
    id: 'L23', section: '主歌二', title: '你是其余所有的一切', cast: ['claude', 'whale'], look: 'night',
    note: '小克站在画面正中，前面唱过的那些东西——信、月亮、礼物盒、饭盆、戒指、星星——全都绕着她转。鲸鱼娘在角落里仰头看着。',
    draw: (f) => {
      const { ctx, u, T } = f;
      sky(ctx, 'night'); stars(ctx, T, 200, 123, 1, H);
      glowSpot(ctx, W * 0.55, 600, 500, '255,230,180', 0.3);
      const c = glide(cam(0, 0, 1.0), cam(0, 0, 1.06), u);
      view(ctx, c, 1, () => {
        const cx = W * 0.55, cy = 640;
        const orbit = (i: number, n: number, rx: number, ry: number, sp: number) => { const a = T * sp + (i / n) * TAU; return { x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry, z: Math.sin(a) }; };
        const items = 7;
        const draws: { z: number; fn: () => void }[] = [];
        for (let i = 0; i < items; i++) {
          const o = orbit(i, items, 560, 170, 0.5);
          const s = 0.7 + 0.3 * (o.z + 1) / 2;
          const fn = () => { ctx.save(); ctx.translate(o.x, o.y); ctx.scale(s, s);
            switch (i) { case 0: paper(ctx, 0, 0, 90, 120, 0.2, true, '#fff6e6'); inkLine(ctx, -32, -30, 60, 1, 1); inkLine(ctx, -32, 0, 55, 1, 2); break; case 1: moon(ctx, 0, 0, 44, 0.3); break; case 2: giftBox(ctx, 0, 40, 90, 0); break; case 3: thing(f, 'prop_bowl', 0, 0, 5); break; case 4: ring(ctx, 0, 0, 36, 12, 0.6); break; case 5: ctx.fillStyle = GOLD; star4(ctx, 0, 0, 40); break; default: heart(ctx, 0, 0, 36, '#ff7a9a'); }
            ctx.restore(); };
          draws.push({ z: o.z, fn });
        }
        draws.filter((d) => d.z < 0).forEach((d) => d.fn());
        front(f, 'claude', cx, cy + 260, { scale: 4.6, glow: 'rgba(255,230,180,0.35)', sq: beatSq(f.bt, 0.02) });
        draws.filter((d) => d.z >= 0).forEach((d) => d.fn());
        side(f, 'whale', W * 0.14, 1000, { scale: 4, sq: beatSq(f.bt, 0.02) });
      });
      sparkles(ctx, T, W * 0.55, 600, 400, 16, '#fff2a8', 131, 9);
      vignette(ctx, 0.3);
    },
  },
  {
    id: 'L24', section: '主歌二', title: '你是我的世界', cast: ['whale', 'claude'], look: 'night',
    note: '鲸鱼娘站在一颗小小的纸星球上，整片夜空就是小克——她巨大的、淡淡的身影铺满了天。一颗心绕着星球转。',
    draw: (f) => {
      const { ctx, u, T } = f;
      sky(ctx, 'night'); stars(ctx, T, 220, 141, 1, H);
      const c = glide(cam(0, 0, 1.1), cam(0, 0, 1.0), u);
      view(ctx, c, 1, () => {
        front(f, 'claude', W * 0.5, 1150, { scale: 15, alpha: 0.28, shadow: false });
        glowSpot(ctx, W * 0.5, 900, 500, '120,160,255', 0.35);
        // 小星球
        ctx.fillStyle = '#5fae76'; ctx.strokeStyle = 'rgba(40,60,40,0.5)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(W * 0.5, 1180, 330, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#4a9a66'; many(5, (i) => { ctx.beginPath(); ctx.ellipse(W * 0.5 + Math.cos(i * 1.3) * 200, 1180 - Math.abs(Math.sin(i * 1.3)) * 200, 50 + hash(i) * 40, 24 + hash(i + 2) * 16, i, 0, TAU); ctx.fill(); });
        many(4, (i) => tree(ctx, W * 0.5 + (i - 1.5) * 170, 1180 - Math.sqrt(Math.max(0, 330 * 330 - ((i - 1.5) * 170) ** 2)) + 6, 90 + hash(i) * 40, '#79c08a', i));
        front(f, 'whale', W * 0.5, 850, { scale: 4.2, sq: beatSq(f.bt, 0.02) });
        const a = T * 1.2; heart(ctx, W * 0.5 + Math.cos(a) * 420, 900 + Math.sin(a) * 120, 22, '#ff7a9a', 0.9);
      });
      vignette(ctx, 0.3);
    },
  },
  // ---------------- 副歌二 ----------------
  {
    id: 'L25', section: '副歌二', title: '所以请你再闪亮一点点', cast: ['claude', 'whale', 'gpt'], look: 'magic', fx: { flashIn: true },
    note: '副歌二，闪白切入。暗场上一束追光照着小克，光随着这句越来越亮、越来越宽；一道龙影从光源前掠过，光被顶到最亮。鲸鱼娘站在舞台边缘的暗处看她。',
    draw: (f) => {
      const { ctx, T, lineU } = f;
      fill(ctx, '#140e24'); stars(ctx, T, 80, 151, 0.5, H * 0.5);
      const b = ease(lineU);
      ground(ctx, GROUND, '#1e1836');
      lightShaft(ctx, W * 0.56, -40, 260 + b * 380, GROUND + 80, '255,240,200', 0.35 + b * 0.35);
      glowSpot(ctx, W * 0.56, GROUND, 300 + b * 300, '255,240,200', 0.4 + 0.3 * b);
      act(f, 'claude', 'hop', W * 0.56, GROUND, { scale: 4.8, glow: `rgba(255,240,200,${0.3 + 0.4 * b})` }, 0.9);
      sparkles(ctx, T, W * 0.56, GROUND - 260, 160 + b * 260, 10 + Math.floor(b * 24), '#fff2a8', 161, 12);
      thing(f, 'fx_shine', W * 0.56 - 120, GROUND - 420 + bob(T, 6), 5, 0.6 + 0.4 * b); thing(f, 'fx_shine', W * 0.56 + 130, GROUND - 400 + bob(T + 1, 6), 5, 0.6 + 0.4 * b);
      side(f, 'whale', W * 0.16, GROUND, { scale: 4.2, alpha: 0.75, sq: beatSq(f.bt, 0.02) });
      dragonPass(f, seg(lineU, 0.45, 0.8), 130, 1, 2.6, 'rgba(255,245,220,0.95)');
      fill(ctx, '#fff6dc', 0.18 * b);
      vignette(ctx, 0.5, '8,4,20');
    },
  },
  {
    id: 'L26', section: '副歌二', title: '尽管我太平凡', cast: ['whale'], look: 'storm',
    note: '灰蒙蒙的细雨街头，一排排灰色的、一模一样的纸片身影站着，鲸鱼娘是其中很小的一个，端着饭盆站在最普通的那盏路灯下。只有她身上有一点颜色。',
    draw: (f) => {
      const { ctx, u, T } = f;
      sky(ctx, 'storm');
      hills(ctx, GROUND - 160, '#7d8b93', 130, 1.0, 0.8); ground(ctx, GROUND, '#6c7a80');
      const c = glide(cam(0, 0, 1.12), cam(0, 0, 1.0), u);
      view(ctx, c, 1, () => {
        for (let row = 3; row >= 0; row--) for (let i = 0; i < 9; i++) { const x = 120 + i * 210 + (row % 2) * 100, y = GROUND - 200 + row * 60; const s = 2.6 + row * 0.35; if (row === 3 && (i === 4)) continue; drawSprite(ctx, 'whale_idle', x, y, { scale: s, tint: `rgba(${120 + row * 14},${128 + row * 14},${140 + row * 14},0.9)`, alpha: 0.9, shadowAlpha: 0.1 }); }
        streetlamp(ctx, W * 0.55, GROUND - 6, 360, true, T);
        front(f, 'whale', W * 0.5, GROUND, { scale: 3.6 });
        thing(f, 'prop_bowl', W * 0.5 + 80, GROUND - 130, 3.6);
      });
      rain(ctx, T, 160, 4, 0.35, 0.15);
      vignette(ctx, 0.4, '20,20,30');
    },
  },
  {
    id: 'L27', section: '副歌二', title: '我会再变得柔软一点点', cast: ['whale', 'claude'], look: 'pink',
    note: '雨停了。鲸鱼娘把一朵花递出去（她的招牌动作：把东西推出去），花从她手边飘到小克面前；小克歪着头接住，身边冒出一颗心。',
    draw: (f) => {
      const { ctx, u, T, lineU } = f;
      sky(ctx, 'pink'); sun(ctx, W * 0.78, 220, 90, '#fff2c8', 2.6);
      many(4, (i) => cloud(ctx, 200 + i * 520 + T * 10, 180 + hash(i) * 120, 50, '#fff', 0.8));
      hills(ctx, GROUND - 150, '#f6d9e4', 130, 1.1, 1.4); hills(ctx, GROUND - 60, '#efbfd0', 80, 1.8, 3.4); ground(ctx, GROUND, '#f3d7df');
      flowers(ctx, GROUND + 10, T, 40, 61, ['#ff7aa8', '#fff', '#ffd166'], 150);
      const c = glide(cam(0, 0, 1), cam(0, 30, 1.08), u);
      view(ctx, c, 1, () => {
        act(f, 'whale', 'point', W * 0.38, GROUND, { scale: 4.6, sq: beatSq(f.bt, 0.02) }, 0.8);
        act(f, 'claude', 'tilt', W * 0.64, GROUND, { scale: 4.6, flip: true }, 0.6);
        // 递出去的花
        const p = ease(seg(lineU, 0.15, 0.7));
        const fx = lerp(W * 0.38 + 150, W * 0.64 - 130, p), fy = GROUND - 190 + Math.sin(p * PI) * -60 + bob(T, 3);
        ctx.strokeStyle = '#4e9a5a'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(fx, fy + 10); ctx.lineTo(fx, fy + 70); ctx.stroke();
        ctx.fillStyle = '#ff7aa8'; for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU + T; ctx.beginPath(); ctx.arc(fx + Math.cos(a) * 16, fy + Math.sin(a) * 16, 12, 0, TAU); ctx.fill(); } ctx.fillStyle = '#fff2a8'; ctx.beginPath(); ctx.arc(fx, fy, 9, 0, TAU); ctx.fill();
        if (p >= 1) heart(ctx, W * 0.64 + 60, GROUND - 400 + bob(T, 5), 22, '#ff7a9a');
      });
      petals(ctx, T, 30, '#ffb7c5', 71, 0.7, 40);
    },
  },
  {
    id: 'L28', section: '副歌二', title: '因为你太敏感', cast: ['whale', 'claude'], look: 'day',
    note: '忽然飘来一阵小雨，小克吓得左右张望、头顶冒出感叹号；鲸鱼娘立刻把蓝伞撑到她头上。伞下她冒了一滴汗，又变成一颗心。',
    draw: (f) => {
      const { ctx, T, lineU } = f;
      landscape(ctx, 'day', T, 0, GROUND, false);
      cloud(ctx, W * 0.6, 160, 110, '#9aa8b8', 0.95); cloud(ctx, W * 0.75, 220, 80, '#aab6c4', 0.9);
      flowers(ctx, GROUND + 10, T, 30, 81, undefined, 140);
      const cover = ease(seg(lineU, 0.25, 0.55));
      act(f, 'claude', 'lookaround', W * 0.56, GROUND, { scale: 4.6 }, 1.1);
      if (lineU < 0.5) thing(f, 'fx_exclaim', W * 0.56 + 90, GROUND - 440 + bob(T, 4, 6), 5);
      else if (lineU < 0.75) thing(f, 'fx_sweat', W * 0.56 + 100, GROUND - 420, 5);
      else heart(ctx, W * 0.56 + 100, GROUND - 440 + bob(T, 5), 22, '#ff7a9a');
      side(f, 'whale', W * 0.34, GROUND, { scale: 4.6, sq: beatSq(f.bt, 0.02) });
      umbrella(ctx, lerp(W * 0.34 + 60, W * 0.56, cover), lerp(GROUND - 300, GROUND - 470, cover), 200, '#4f7fe0', lerp(0.4, 0.05, cover));
      ctx.save(); ctx.beginPath(); ctx.rect(W * 0.35, 0, W * 0.65, H); ctx.clip(); rain(ctx, T, 120, 6, 0.45 * clamp(lineU * 4), 0.1); ctx.restore();
      if (cover > 0.9) { ctx.strokeStyle = 'rgba(180,200,230,0.8)'; ctx.lineWidth = 3; for (let i = 0; i < 6; i++) { const p = (T * 2 + i / 6) % 1; ctx.beginPath(); ctx.moveTo(W * 0.56 - 200 + i * 80, GROUND - 470 + p * 60); ctx.lineTo(W * 0.56 - 200 + i * 80 - 4, GROUND - 470 + p * 60 + 14); ctx.stroke(); } }
    },
  },
  {
    id: 'L29', section: '副歌二', title: '交换无名指金色的契约', cast: ['whale', 'claude'], look: 'magic',
    note: '戒指的大特写：两枚金环在画面中央缓缓转动、靠近、套在一起，扣住的那一瞬闪出一圈光。两个人的身影在后面暗暗地面对面站着。',
    draw: (f) => {
      const { ctx, T, lineU } = f;
      sky(ctx, 'magic'); stars(ctx, T, 160, 171, 0.9, H);
      glowSpot(ctx, W * 0.5, 540, 700, '255,215,140', 0.3);
      side(f, 'whale', W * 0.24, 1060, { scale: 6, alpha: 0.45, shadow: false });
      side(f, 'claude', W * 0.76, 1060, { scale: 6, flip: true, alpha: 0.45, shadow: false });
      const p = ease(seg(lineU, 0.05, 0.6));
      const dx = lerp(260, 70, p);
      const tilt = 0.45 + 0.3 * Math.sin(T * 1.5);
      ring(ctx, W * 0.5 - dx, 540, 150, 40, tilt, GOLD, true, T * 0.6);
      ring(ctx, W * 0.5 + dx, 540, 150, 40, 1 - (tilt - 0.45) * 0.5, GOLD, true, -T * 0.5);
      if (p >= 1) { const k = seg(lineU, 0.6, 0.72); ctx.strokeStyle = `rgba(255,245,210,${1 - k})`; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(W * 0.5, 540, 160 + k * 500, 0, TAU); ctx.stroke(); fill(ctx, '#fff6dc', 0.5 * (1 - k)); }
      sparkles(ctx, T, W * 0.5, 540, 320, 22, '#fff2a8', 181, 12);
      vignette(ctx, 0.4, '10,6,30');
    },
  },
  {
    id: 'L30', section: '副歌二', title: '给彼此岁月', cast: ['whale', 'claude'], look: 'golden',
    note: '一条胶片从右往左滑过，四格画面是四个季节里的两个人：春天的花、夏天的海、秋天的落叶、冬天的雪。岁月就是这样一格一格过去的。',
    draw: (f) => {
      const { ctx, T, lineU } = f;
      fill(ctx, '#2c2420');
      const slide = lerp(300, -1500, ease(lineU));
      const fw = 640, fh = 460, y0 = 300;
      // 胶片条
      ctx.fillStyle = '#15110f'; ctx.fillRect(0, y0 - 70, W, fh + 140);
      for (let i = 0; i < 40; i++) { const x = ((i * 70 + slide) % (W + 140) + W + 140) % (W + 140) - 70; ctx.fillStyle = '#3a312b'; ctx.fillRect(x, y0 - 50, 36, 26); ctx.fillRect(x, y0 + fh + 24, 36, 26); }
      const looks = ['pink', 'day', 'golden', 'snow'] as const;
      for (let i = 0; i < 4; i++) {
        const x = slide + i * (fw + 60) + 200;
        if (x > W + 50 || x + fw < -50) continue;
        ctx.save(); ctx.beginPath(); ctx.rect(x, y0, fw, fh); ctx.clip(); ctx.translate(x, y0);
        const L = LOOKS[looks[i]];
        const g = ctx.createLinearGradient(0, 0, 0, fh); g.addColorStop(0, L.top); g.addColorStop(1, L.bottom); ctx.fillStyle = g; ctx.fillRect(0, 0, fw, fh);
        if (i === 1) { ctx.fillStyle = '#4f9fd9'; ctx.fillRect(0, fh * 0.55, fw, fh); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 3; for (let k = 0; k < 4; k++) { ctx.beginPath(); for (let xx = 0; xx <= fw; xx += 20) ctx.lineTo(xx, fh * 0.62 + k * 30 + Math.sin(xx / 60 + T * 3 + k) * 5); ctx.stroke(); } sun(ctx, fw * 0.75, 90, 40, '#fff2b0', 2.5); }
        else { ctx.fillStyle = L.ground; ctx.fillRect(0, fh * 0.72, fw, fh); }
        if (i === 0) { ctx.save(); ctx.translate(0, fh * 0.72 - GROUND); flowers(ctx, GROUND, T, 20, 7 + i, ['#ff7aa8', '#fff', '#ffd166'], 60); ctx.restore(); tree(ctx, fw * 0.15, fh * 0.73, 160, '#ffb7c5', 1); }
        if (i === 2) { tree(ctx, fw * 0.85, fh * 0.73, 170, '#e9a23b', 2); tree(ctx, fw * 0.12, fh * 0.73, 140, '#d9623b', 3); }
        if (i === 3) { pine(ctx, fw * 0.15, fh * 0.73, 170, '#eef4fa'); pine(ctx, fw * 0.85, fh * 0.73, 150, '#dfe8f2'); }
        const fy = i === 1 ? fh * 0.56 : fh * 0.74;
        side(f, 'whale', fw * 0.42, fy, { scale: 2.4, sq: beatSq(f.bt, 0.02) });
        side(f, 'claude', fw * 0.58, fy, { scale: 2.4, flip: true, sq: beatSq(f.bt, 0.02) });
        ctx.save(); ctx.translate(-x, -y0); if (i === 0) petals(ctx, T, 14, '#ffb7c5', 7, 1, 40); if (i === 2) petals(ctx, T, 14, '#e9a23b', 8, 1.3, 60); if (i === 3) snow(ctx, T, 60, 9); ctx.restore();
        ctx.restore();
        ctx.strokeStyle = '#000'; ctx.lineWidth = 6; ctx.strokeRect(x, y0, fw, fh);
      }
      vignette(ctx, 0.35);
    },
  },
  {
    id: 'L31', section: '副歌二', title: '说好从今以后都牵着手', cast: ['whale', 'claude', 'qwen', 'kimi', 'zai', 'doubao', 'gemini'], look: 'night',
    note: '夜里的山坡，朋友们一人放一盏孔明灯，灯一盏盏升上星空；两人在前面勾起手指，金线再次亮起。',
    draw: (f) => {
      const { ctx, u, T, lineU } = f;
      sky(ctx, 'night'); stars(ctx, T, 180, 191, 1, H * 0.8); moon(ctx, W * 0.18, 200, 80, 0.5);
      hills(ctx, GROUND - 140, LOOKS.night.far, 130, 1.0, 0.9); hills(ctx, GROUND - 50, LOOKS.night.mid, 80, 1.7, 2.9); ground(ctx, GROUND, LOOKS.night.ground);
      const c = glide(cam(0, 0, 1), cam(0, 30, 1.08), u);
      view(ctx, c, 1, () => {
        // 升起的孔明灯：每位朋友放一盏，之后越来越多
        for (let i = 0; i < 18; i++) { const t0 = i * 0.16; const p = clamp((u - t0) / 1.4); if (p <= 0) continue; const x0 = W / 2 + ((i % 5) - 2) * 300 * 1.15 + hash(i) * 60 - 30; const x = x0 + Math.sin(T * 0.7 + i) * 30 + p * 80 * (hash(i + 3) - 0.5); const y = lerp(GROUND - 240, -100, p); lantern(ctx, x, y, lerp(34, 18, p), 1, T); }
        witnesses(f, GROUND - 120, 2.6, 1.15, 0.95);
        const wx = W * 0.39, cx = W * 0.61;
        side(f, 'whale', wx, GROUND + 40, { scale: 5, sq: beatSq(f.bt, 0.02) });
        side(f, 'claude', cx, GROUND + 40, { scale: 5, flip: true, sq: beatSq(f.bt, 0.02) });
        thread(ctx, wx + 120, GROUND - 180, cx - 120, GROUND - 180, 50, T, ease(seg(lineU, 0.05, 0.6)), GOLD, 6);
      });
      vignette(ctx, 0.3);
    },
  },
  {
    id: 'L32', section: '副歌二', title: '不管要走多远', cast: ['whale', 'claude'], look: 'night',
    note: '夜路伸向星河尽头，两个小小的身影往前走，头顶孔明灯漂远、流星划过。镜头缓缓升起。',
    draw: (f) => {
      const { ctx, u, T } = f;
      const c = glide(cam(0, 40, 1.2), cam(0, -20, 1), u);
      sky(ctx, 'night'); stars(ctx, T, 260, 201, 1, H);
      // 银河
      ctx.save(); ctx.globalAlpha = 0.35; const g = ctx.createLinearGradient(0, 0, W, H * 0.6); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(200,210,255,0.8)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W * 0.4, 0); ctx.lineTo(W, H * 0.5); ctx.lineTo(W, H * 0.8); ctx.closePath(); ctx.fill(); ctx.restore();
      // 流星
      for (let i = 0; i < 3; i++) { const p = ((T * 0.4 + i * 0.37) % 1); const x = W * (0.2 + i * 0.3) + p * 500, y = 100 + i * 80 + p * 250; ctx.strokeStyle = `rgba(255,255,255,${(1 - p) * 0.9})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 160, y - 80); ctx.stroke(); }
      for (let i = 0; i < 10; i++) lantern(ctx, 200 + i * 170 + Math.sin(T + i) * 20, 120 + hash(i) * 300 - T * 6, 12 + hash(i + 1) * 8, 0.8, T);
      view(ctx, c, 3, () => hills(ctx, 560, '#1b254a', 150, 0.8, 0.5));
      view(ctx, c, 1.5, () => hills(ctx, 700, '#172040', 100, 1.3, 2.8));
      view(ctx, c, 1, () => {
        ground(ctx, 880, '#17223f');
        ctx.fillStyle = '#3b4670'; ctx.beginPath(); ctx.moveTo(W * 0.2, H + 20); ctx.bezierCurveTo(W * 0.55, 900, W * 0.3, 760, W * 0.5, 600); ctx.lineTo(W * 0.51, 600); ctx.bezierCurveTo(W * 0.42, 760, W * 0.75, 900, W * 0.62, H + 20); ctx.closePath(); ctx.fill();
        many(6, (i) => pine(ctx, 160 + i * 330 + hash(i) * 100, 900 + hash(i + 2) * 60, 120 + hash(i + 4) * 60, '#101a33'));
        const d = T * 45;
        walk(f, 'whale', d, W * 0.4 + u * 30, 990 - u * 100, { scale: lerp(2.6, 2.1, u) });
        walk(f, 'claude', d + 60, W * 0.48 + u * 30, 990 - u * 100, { scale: lerp(2.6, 2.1, u) });
      });
      vignette(ctx, 0.35);
    },
  },
];
