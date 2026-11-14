// 镜头表（下）：桥段 B1–B3 · 副歌三 L33–L41 · 尾声 OUT
import { drawSprite } from '../atlas';
import {
  cam, candle, clamp, cloud, confetti, desk, ease, easeOut, fill, fireworks, flowers, glide, glowSpot, GOLD, grassTufts, ground, H, hash, heart, hills, hourglass, inkBottle, inkLine, lantern, lerp, lightShaft, LOOKS, many, paper, pen, petals, PI, rain, ribbonRoad, ring, seg, sky, sparkles, star4, stars, sun, TAU, thread, tree, umbrella, view, vignette, W, pine, backOut,
} from '../kit';
import type { ShotDef } from '../timeline';
import { act, beatSq, birds, bob, dragonPass, front, GROUND, landscape, side, thing, walk, witnesses } from './common';

function flag(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, T: number, color = '#e4584e'): void {
  ctx.fillStyle = '#6b4a30'; ctx.fillRect(x - 5, y - h, 10, h);
  ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x + 5, y - h); for (let i = 0; i <= 10; i++) ctx.lineTo(x + 5 + i * 14, y - h + Math.sin(T * 8 + i * 0.6) * 8 + i * 2); for (let i = 10; i >= 0; i--) ctx.lineTo(x + 5 + i * 14, y - h + 90 + Math.sin(T * 8 + i * 0.6) * 8 - i * 2); ctx.closePath(); ctx.fill();
  ctx.fillStyle = GOLD; star4(ctx, x + 70, y - h + 45, 16);
}

export const SHOTS_C: ShotDef[] = [
  // ---------------- 桥段 ----------------
  {
    id: 'B1', section: '桥段', title: '桥段 · 风雨', cast: ['whale', 'claude'], look: 'storm',
    note: '音乐沉下来。两人在风雨里上坡，鲸鱼娘举着蓝伞走在前面、把伞往后面的小克那边偏；树被吹弯，远处偶尔闪一道电。路再难也一起走。',
    draw: (f) => {
      const { ctx, u, T } = f;
      sky(ctx, 'storm');
      many(5, (i) => cloud(ctx, ((hash(i) * W - T * 120) % (W + 500) + W + 500) % (W + 500) - 250, 100 + i * 70, 90, '#5c6b78', 0.9, false));
      hills(ctx, GROUND - 180, '#7d8b93', 150, 1.0, 0.6, T * 10); hills(ctx, GROUND - 80, '#5f6f78', 100, 1.6, 2.4, T * 25);
      ctx.fillStyle = '#5c6b6e'; ctx.beginPath(); ctx.moveTo(-50, H); ctx.lineTo(-50, GROUND + 60); ctx.lineTo(W + 50, GROUND - 160); ctx.lineTo(W + 50, H); ctx.closePath(); ctx.fill();
      const slopeY = (x: number) => lerp(GROUND + 60, GROUND - 160, (x + 50) / (W + 100));
      ctx.save(); ctx.translate(W * 0.86, slopeY(W * 0.86)); ctx.rotate(-0.22 - 0.05 * Math.sin(T * 5)); tree(ctx, 0, 0, 300, '#44535c', 3, '#3a2e28'); ctx.restore();
      ctx.save(); ctx.translate(W * 0.1, slopeY(W * 0.1)); ctx.rotate(-0.2 - 0.05 * Math.sin(T * 4.5)); tree(ctx, 0, 0, 240, '#4d5c64', 4, '#3a2e28'); ctx.restore();
      const d = T * 60;
      const wx = W * 0.5 + Math.sin(u * PI) * 20, cx = wx - 200;
      walk(f, 'claude', d + 40, cx, slopeY(cx), { scale: 4, tilt: 0.1 });
      walk(f, 'whale', d, wx, slopeY(wx), { scale: 4, tilt: 0.14 });
      umbrella(ctx, wx - 60, slopeY(wx) - 440, 230, '#4f7fe0', 0.35 + 0.03 * Math.sin(T * 6));
      rain(ctx, T, 260, 1, 0.55, 0.45);
      const bolt = ((T * 1.0) % 3.7) < 0.12 && Math.floor(T / 3.7) % 2 === 0;
      if (bolt) { fill(ctx, '#e8f0ff', 0.35); ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(W * 0.72, 0); ctx.lineTo(W * 0.7, 180); ctx.lineTo(W * 0.74, 200); ctx.lineTo(W * 0.69, 380); ctx.stroke(); }
      vignette(ctx, 0.45, '20,24,30');
    },
  },
  {
    id: 'B2', section: '桥段', title: '桥段 · 云开', cast: ['whale', 'claude', 'gpt', 'qwen', 'kimi', 'zai', 'doubao', 'gemini'], look: 'day',
    note: '雨小了。龙影从云层上方掠过，乌云被推开，一束光落到山顶上的两个人身上，彩虹出现；鲸鱼娘把伞收下来。远处山脊上，朋友们已经等在那里。',
    draw: (f) => {
      const { ctx, u, T } = f;
      const open = ease(seg(u, 0.25, 0.8));
      sky(ctx, 'storm'); sky(ctx, 'day', open);
      sun(ctx, W * 0.5, 160, 90 * open, '#fff2b0', 3);
      if (open > 0.3) ['#ff6b6b', '#ffa94d', '#ffd166', '#8ce99a', '#74c0fc', '#b197fc'].forEach((col, i) => { ctx.strokeStyle = col; ctx.globalAlpha = 0.5 * seg(open, 0.3, 1); ctx.lineWidth = 16; ctx.beginPath(); ctx.arc(W * 0.5, GROUND + 100, 900 - i * 16, PI * 1.08, PI * 1.92); ctx.stroke(); }); ctx.globalAlpha = 1;
      hills(ctx, GROUND - 200, open > 0.5 ? LOOKS.day.far : '#7d8b93', 160, 1.0, 1.0); hills(ctx, GROUND - 90, open > 0.5 ? LOOKS.day.mid : '#5f6f78', 110, 1.6, 2.6);
      // 山脊上等着的朋友们
      ctx.save(); ctx.globalAlpha = 0.9; witnesses(f, GROUND - 230, 1.6, 0.6, 0.9); ctx.restore();
      ground(ctx, GROUND, open > 0.5 ? LOOKS.day.ground : '#5c6b6e');
      grassTufts(ctx, GROUND + 10, T, 40, 12, open > 0.5 ? '#4e9a5a' : '#4a5a5a');
      lightShaft(ctx, W * 0.5, 0, 500, GROUND + 60, '255,245,210', 0.4 * open);
      front(f, 'whale', W * 0.44, GROUND, { scale: 4.2, sq: beatSq(f.bt, 0.02) });
      front(f, 'claude', W * 0.58, GROUND, { scale: 4.2, sq: beatSq(f.bt, 0.02) });
      const down = ease(seg(u, 0.55, 0.85));
      umbrella(ctx, W * 0.5 - 60 + down * 160, GROUND - 480 + down * 420, 230 * (1 - down * 0.5), '#4f7fe0', 0.1 + down * 1.3);
      // 乌云分开
      cloud(ctx, W * 0.3 - open * 700, 240, 130, '#6c7a86', 0.95, false); cloud(ctx, W * 0.7 + open * 700, 200, 140, '#6c7a86', 0.95, false);
      dragonPass(f, seg(u, 0.1, 0.5), 110, 1, 2.8, 'rgba(255,255,255,0.95)');
      rain(ctx, T, 160, 3, 0.4 * (1 - open), 0.3);
      birds(ctx, T, 6, 300, 300, 0.6 * open);
    },
  },
  {
    id: 'B3', section: '桥段', title: '桥段 · 信快写完了', cast: ['whale'], look: 'paper', fx: { whiteOut: 0.5 },
    note: '回到书桌。信纸已经写满了大半，钢笔随着越来越密的鼓点飞快地写下最后几行；镜头一直往纸里推，推到纸面填满画面、白成一片——接最后一段副歌。',
    draw: (f) => {
      const { ctx, u, T } = f;
      desk(ctx);
      const c = glide(cam(0, 40, 1.0), cam(60, 120, 2.2), ease(u));
      view(ctx, c, 1, () => {
        paper(ctx, W / 2, H / 2 + 40, 980, 640, -0.04);
        inkBottle(ctx, W / 2 + 560, H / 2 - 60, 90); candle(ctx, W / 2 - 640, H / 2 + 120, 150, T);
        ctx.save(); ctx.translate(W / 2, H / 2 + 40); ctx.rotate(-0.04);
        const lines = 9;
        for (let i = 0; i < lines; i++) { const p = i < 5 ? 1 : seg(u, 0.1 + (i - 5) * 0.2, 0.28 + (i - 5) * 0.2); inkLine(ctx, -400, -230 + i * 56, 300 + hash(i) * 400, p, i + 1); }
        ctx.restore();
        const li = Math.min(lines - 1, 5 + Math.floor(seg(u, 0.1, 0.9) * 4));
        const p = seg(u, 0.1 + (li - 5) * 0.2, 0.28 + (li - 5) * 0.2);
        pen(ctx, W / 2 - 400 + (300 + hash(li) * 400) * p + 6, H / 2 + 40 - 230 + li * 56 + Math.sin(T * 18) * 1.5, 190, -0.85 + Math.sin(T * 4) * 0.03);
        drawSprite(ctx, 'whale_idle', W / 2 + 180, H / 2 + 150, { scale: 2.6, shadowAlpha: 0.3, alpha: 1 - seg(u, 0.5, 0.8) });
      });
      vignette(ctx, 0.5 * (1 - seg(u, 0.6, 1)));
    },
  },
  // ---------------- 副歌三 ----------------
  {
    id: 'L33', section: '副歌三', title: '所以', cast: ['whale'], look: 'day', fx: { whiteIn: 0.5 },
    note: '白光退去：鲸鱼娘一个人站在大晴天的草坡上，花瓣全往上飞；一根金线从天上垂下来，落到她手边。她深吸一口气——所以。',
    draw: (f) => {
      const { ctx, u, T } = f;
      landscape(ctx, 'day', T, 0, GROUND, true);
      flowers(ctx, GROUND + 10, T, 40, 91, undefined, 150);
      front(f, 'whale', W * 0.5, GROUND, { scale: 5, sq: beatSq(f.bt, 0.02), glow: 'rgba(255,255,255,0.25)' });
      const p = easeOut(u);
      thread(ctx, W * 0.5 + 400, -60, W * 0.5 + 130, lerp(-60, GROUND - 230, p), -40, T, 1);
      // 上飞的花瓣
      ctx.save(); ctx.fillStyle = '#ffb7c5'; for (let i = 0; i < 40; i++) { const ph = (T * 0.4 + hash(i)) % 1; const x = hash(i + 1) * W + Math.sin(T * 2 + i) * 30, y = H + 20 - ph * (H + 60); ctx.globalAlpha = Math.sin(ph * PI); ctx.save(); ctx.translate(x, y); ctx.rotate(T * 3 + i); ctx.beginPath(); ctx.ellipse(0, 0, 9, 5, 0, 0, TAU); ctx.fill(); ctx.restore(); } ctx.restore();
      fill(ctx, '#fff6dc', 0.15 * (1 - u));
    },
  },
  {
    id: 'L34', section: '副歌三', title: '让我再靠近一点点', cast: ['whale', 'claude'], look: 'day', fx: { flashIn: true },
    note: '末段副歌。大太阳底下的花田，鲸鱼娘朝小克跑过去——这次是跑，镜头追着她横移；小克在那头原地小跳着等她。',
    draw: (f) => {
      const { ctx, T, lineU } = f;
      const p = easeOut(lineU);
      const wx = lerp(-200, W * 0.52, p);
      const c = cam(lerp(-500, 80, p), 0, 1);
      landscape(ctx, 'day', T, c.x);
      view(ctx, c, 1, () => {
        flowers(ctx, GROUND + 10, T, 90, 101, undefined, 160);
        many(4, (i) => tree(ctx, -300 + i * 760, GROUND + 4, 260 + hash(i) * 80, '#5fae76', i + 30));
        act(f, 'claude', 'hop', W * 0.74, GROUND, { scale: 4.4, flip: true, glow: 'rgba(255,255,255,0.3)' }, 0.9);
        const dist = (wx + 200) * 1.6;
        if (p < 0.98) drawSprite(ctx, `walk_whale_${Math.floor((dist / 180) * 8) % 8}`, wx, GROUND, { scale: 4.4, tilt: -0.1, lift: Math.abs(Math.sin((dist / 180) * TAU)) * 10 });
        else front(f, 'whale', wx, GROUND, { scale: 4.4 });
        ctx.save(); ctx.globalAlpha = 0.5; for (let i = 0; i < 5; i++) { const ph = (T * 2 + i / 5) % 1; cloud(ctx, wx - 60 - ph * 160, GROUND - 10 - ph * 20, 14 + ph * 20, '#fff', 0.6 * (1 - ph), false); } ctx.restore();
      });
      petals(ctx, T, 40, '#ffd9a8', 111, 1.2, 60);
    },
  },
  {
    id: 'L35', section: '副歌三', title: '因为你太温暖', cast: ['whale', 'claude'], look: 'golden',
    note: '大太阳正后方的双人近景：小克的茶杯还冒着热气，鲸鱼娘在旁边开心地蹦，头顶一颗心。',
    draw: (f) => {
      const { ctx, u, T } = f;
      sky(ctx, 'golden'); sun(ctx, W * 0.5, 420, 200, '#ffe08a', 3.2);
      hills(ctx, 760, LOOKS.golden.mid, 90, 1.5, 1.4); ground(ctx, 920, LOOKS.golden.ground);
      flowers(ctx, 930, T, 30, 121, ['#ffd166', '#fff', '#ffb7c5'], 150);
      const c = glide(cam(0, 0, 1), cam(0, 30, 1.06), u);
      view(ctx, c, 1, () => {
        glowSpot(ctx, W * 0.5, 640, 500, '255,220,150', 0.45);
        front(f, 'claude', W * 0.6, 1000, { scale: 6, glow: 'rgba(255,230,170,0.35)', sq: beatSq(f.bt, 0.02) });
        thing(f, 'prop_teacup', W * 0.6 - 190, 740, 6);
        thing(f, `fx_steam_${Math.floor(T * 6) % 3}`, W * 0.6 - 190, 690 - (T * 20) % 20, 5, 0.8);
        act(f, 'whale', 'hop', W * 0.34, 1000, { scale: 6 });
        heart(ctx, W * 0.34 + 120, 470 + bob(T, 8), 26 + 6 * f.bt.pulse, '#ff7a9a');
      });
      petals(ctx, T, 16, '#ffe0b0', 131, 0.6, 30);
    },
  },
  {
    id: 'L36', section: '副歌三', title: '我会再变得坚强一点点', cast: ['whale', 'claude'], look: 'day',
    note: '山顶，云海在脚下。鲸鱼娘把一面旗插在标记点上，朝天挥手；小克从后面走上来。风很大，她站得很稳。',
    draw: (f) => {
      const { ctx, T, lineU } = f;
      sky(ctx, 'day'); sun(ctx, W * 0.82, 160, 80, '#fff2b0', 2.6);
      many(8, (i) => cloud(ctx, ((hash(i) * W * 1.3 - T * 30) % (W + 500) + W + 500) % (W + 500) - 250, 700 + hash(i + 2) * 300, 110 + hash(i + 4) * 60, '#fff', 0.95));
      // 山顶
      ctx.fillStyle = '#86c593'; ctx.strokeStyle = 'rgba(60,40,30,0.35)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-50, H); ctx.lineTo(W * 0.2, GROUND + 40); ctx.lineTo(W * 0.5, GROUND - 40); ctx.lineTo(W * 0.8, GROUND + 50); ctx.lineTo(W + 50, H); ctx.closePath(); ctx.fill(); ctx.stroke();
      grassTufts(ctx, GROUND - 20, T, 30, 14);
      const planted = lineU > 0.3;
      if (planted) flag(ctx, W * 0.62, GROUND - 10, 320 * backOut(seg(lineU, 0.3, 0.5)), T);
      if (lineU < 0.3) front(f, 'whale', W * 0.5, GROUND - 20, { scale: 4.4, sq: beatSq(f.bt, 0.02) });
      else if (lineU < 0.7) act(f, 'whale', 'wave', W * 0.5, GROUND - 20, { scale: 4.4 }, 1, f.t - 0.3 * f.dur);
      else act(f, 'whale', 'hop', W * 0.5, GROUND - 20, { scale: 4.4 }, 1, f.t - 0.7 * f.dur);
      const cd = easeOut(seg(lineU, 0.2, 0.9));
      const cx = lerp(-100, W * 0.33, cd);
      if (cd < 0.98) walk(f, 'claude', (cx + 100) * 1.2, cx, lerp(GROUND + 60, GROUND - 10, cd), { scale: 4.2 }); else front(f, 'claude', cx, GROUND - 10, { scale: 4.2 });
      birds(ctx, T, 5, 200, 200, 0.5);
      ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 3; for (let i = 0; i < 4; i++) { const x0 = W - ((T * 1200 + i * 600) % (W + 700)); const y0 = 200 + i * 150; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(x0 + 150, y0 - 20, x0 + 300, y0 + 10); ctx.stroke(); }
    },
  },
  {
    id: 'L37', section: '副歌三', title: '因为你太柔软', cast: ['whale', 'claude'], look: 'pink',
    note: '两个人一起站在那朵软云上了：小克歪头，鲸鱼娘跟着拍子左右晃，云随着每一拍轻轻一沉；心心和花瓣一起飘。',
    draw: (f) => {
      const { ctx, u, T } = f;
      sky(ctx, 'pink'); sun(ctx, W * 0.2, 220, 80, '#fff2c8', 2.5);
      many(5, (i) => cloud(ctx, ((hash(i) * W + T * 15) % (W + 300)) - 150, 500 + hash(i + 2) * 400, 50 + hash(i + 4) * 30, '#fff', 0.7));
      const c = glide(cam(0, 0, 1), cam(0, -20, 1.08), u);
      view(ctx, c, 1, () => {
        const cy = 760 + Math.sin(T * 2) * 10 + f.bt.pulse * 14;
        cloud(ctx, W * 0.5, cy, 170, '#ffffff', 1);
        act(f, 'claude', 'tilt', W * 0.6, cy - 60, { scale: 4.6, shadow: false, flip: true }, 0.6);
        act(f, 'whale', 'sway', W * 0.4, cy - 60, { scale: 4.6, shadow: false }, 0.9);
        many(5, (i) => { const p = (T * 0.5 + i * 0.2) % 1; heart(ctx, W * 0.5 + (i - 2) * 140 + Math.sin(T * 2 + i) * 20, cy - 440 - p * 200, 18 * Math.sin(p * PI), '#ff8fa8'); });
      });
      petals(ctx, T, 40, '#ffb7c5', 141, 0.7, 40);
    },
  },
  {
    id: 'L38', section: '副歌三', title: '交换无名指金色的契约', cast: ['whale', 'claude', 'qwen', 'kimi', 'zai', 'doubao', 'gemini', 'gpt'], look: 'golden',
    note: '最盛大的一次：花拱门下全员到齐。两枚戒指从两人面前升到半空、套成一个发光的双环，彩纸落下来，第一朵烟花在天边炸开；龙娘在最上面盘旋，狐狸这回是醒着的。',
    draw: (f) => {
      const { ctx, u, T, lineU } = f;
      sky(ctx, 'golden'); sky(ctx, 'dusk', 0.5); sun(ctx, W * 0.5, 300, 90, '#ffe9a8', 3);
      stars(ctx, T, 60, 211, 0.5, H * 0.4);
      hills(ctx, 740, LOOKS.dusk.far, 110, 1.2, 0.8); hills(ctx, 820, LOOKS.golden.mid, 70, 1.9, 3.1); ground(ctx, GROUND, '#e9d9b0');
      ctx.strokeStyle = '#8a5a3c'; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(W * 0.28, GROUND); ctx.lineTo(W * 0.28, 480); ctx.arc(W * 0.5, 480, W * 0.22, PI, 0); ctx.lineTo(W * 0.72, GROUND); ctx.stroke();
      for (let i = 0; i < 28; i++) { const a = PI + (i / 27) * PI; const x = W * 0.5 + Math.cos(a) * W * 0.22, y = 480 + Math.sin(a) * W * 0.22; ctx.fillStyle = ['#ff7aa8', '#ffd166', '#fff', '#b388ff'][i % 4]; ctx.beginPath(); ctx.arc(x, y, 16, 0, TAU); ctx.fill(); }
      if (lineU > 0.5) fireworks(ctx, T, 3, 5);
      const c = glide(cam(0, 0, 1), cam(0, 20, 1.06), u);
      view(ctx, c, 1, () => {
        witnesses(f, GROUND - 100, 2.6, 1.2, 1, ['zai', 'kimi', 'qwen', 'doubao', 'gemini']);
        act(f, 'zai', 'alert', W / 2 - 2 * 300 * 1.2, GROUND - 100, { scale: 2.6 }, 0.8);
        dragonPass(f, (T * 0.08) % 1, 110, 1, 2.4, null, 0.95);
        side(f, 'whale', W * 0.37, GROUND + 30, { scale: 4.8, sq: beatSq(f.bt, 0.03) });
        side(f, 'claude', W * 0.63, GROUND + 30, { scale: 4.8, flip: true, sq: beatSq(f.bt, 0.03) });
        const p = ease(seg(lineU, 0.1, 0.65));
        const ry = lerp(GROUND - 190, 330, p), dx = lerp(220, 70, p), rs = lerp(28, 120, p);
        ring(ctx, W * 0.5 - dx, ry, rs, 10 + 22 * p, 0.6, GOLD, true, T);
        ring(ctx, W * 0.5 + dx, ry, rs, 10 + 22 * p, 0.6, GOLD, true, -T);
        if (p >= 1) { glowSpot(ctx, W * 0.5, 330, 420, '255,230,160', 0.45 + 0.1 * f.bt.pulse); sparkles(ctx, T, W * 0.5, 330, 300, 24, '#fff2a8', 221, 12); }
      });
      confetti(ctx, T, 70 * clamp(lineU * 2), 13);
    },
  },
  {
    id: 'L39', section: '副歌三', title: '给彼此岁月', cast: ['whale', 'claude'], look: 'night',
    note: '烟花满天。那只沙漏被翻了过来重新开始漏——新的岁月从这里起算；两人站在沙漏两边，天上孔明灯和烟花一起亮。',
    draw: (f) => {
      const { ctx, T, lineU } = f;
      sky(ctx, 'night'); stars(ctx, T, 160, 231, 1, H * 0.8);
      fireworks(ctx, T, 5, 21);
      many(8, (i) => lantern(ctx, 150 + i * 230 + Math.sin(T + i) * 20, 160 + hash(i) * 260 - T * 8, 14 + hash(i + 1) * 10, 0.9, T));
      hills(ctx, 720, LOOKS.night.far, 120, 1.0, 1.9); ground(ctx, GROUND, LOOKS.night.ground);
      const flipP = ease(seg(lineU, 0, 0.25));
      ctx.save(); ctx.translate(W * 0.5, GROUND - 280); ctx.rotate(flipP * PI); ctx.translate(-W * 0.5, -(GROUND - 280));
      hourglass(ctx, W * 0.5, GROUND - 20, 520, flipP < 1 ? 1 : 1 - clamp(seg(lineU, 0.25, 1) * 0.9), T);
      ctx.restore();
      side(f, 'whale', W * 0.27, GROUND, { scale: 4, sq: beatSq(f.bt, 0.02) });
      side(f, 'claude', W * 0.73, GROUND, { scale: 4, flip: true, sq: beatSq(f.bt, 0.02) });
      glowSpot(ctx, W * 0.5, GROUND - 260, 320, '255,215,120', 0.3);
      confetti(ctx, T, 40, 17);
    },
  },
  {
    id: 'L40', section: '副歌三', title: '说好从今以后都牵着手', cast: ['whale', 'claude', 'qwen', 'kimi', 'zai', 'doubao', 'gemini'], look: 'golden',
    note: '勾指起誓的近景：两只手之间的金线这回在中间结成一颗心。身后朋友们举着灯笼，花瓣和彩纸一起落。',
    draw: (f) => {
      const { ctx, u, T, lineU } = f;
      sky(ctx, 'golden'); sky(ctx, 'dusk', 0.4); sun(ctx, W * 0.5, 380, 150, '#ffd9a0', 3.5);
      hills(ctx, 760, LOOKS.dusk.far, 100, 1.2, 0.8); ground(ctx, 920, LOOKS.golden.ground);
      const c = glide(cam(0, 0, 1), cam(0, 40, 1.1), u);
      view(ctx, c, 1, () => {
        ctx.save(); ctx.globalAlpha = 0.7; witnesses(f, 820, 2.2, 1.3, 0.8); ctx.restore();
        many(5, (i) => lantern(ctx, W / 2 + (i - 2) * 300 * 1.3 + 60, 560 + Math.sin(T * 1.2 + i) * 10, 28, 0.9, T));
        const wx = W * 0.36, cx = W * 0.64;
        side(f, 'whale', wx, 1060, { scale: 6, sq: beatSq(f.bt, 0.02) });
        side(f, 'claude', cx, 1060, { scale: 6, flip: true, sq: beatSq(f.bt, 0.02) });
        const p = ease(seg(lineU, 0.05, 0.5));
        thread(ctx, wx + 150, 800, cx - 150, 800, 70, T, p, GOLD, 5);
        const hp = backOut(seg(lineU, 0.5, 0.75));
        if (hp > 0) { heart(ctx, W * 0.5, 820 - hp * 30, 44 * hp + 6 * f.bt.pulse, '#ff7a9a'); sparkles(ctx, T, W * 0.5, 800, 120, 12, '#fff2a8', 241, 10); }
      });
      petals(ctx, T, 30, '#ffd9a8', 251, 0.8, 30); confetti(ctx, T, 30, 19);
    },
  },
  {
    id: 'L41', section: '副歌三', title: '因为要走很远', cast: ['whale', 'claude'], look: 'dusk',
    note: '两个人沿着飘带路走向夕阳；镜头一直往后拉，拉到整片风景缩成信纸上的一幅画——原来这一路都写在这封信里。',
    draw: (f) => {
      const { ctx, u, T } = f;
      const shrink = ease(seg(u, 0.3, 1));
      desk(ctx);
      paper(ctx, W / 2, H / 2 + 40, 980 * lerp(2.2, 1, shrink), 640 * lerp(2.2, 1, shrink), -0.04 * shrink);
      const s = lerp(1, 0.46, shrink);
      ctx.save(); ctx.translate(W / 2, H / 2 + 40 * shrink); ctx.rotate(-0.04 * shrink); ctx.scale(s, s); ctx.translate(-W / 2, -H / 2);
      ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
      landscape(ctx, 'dusk', T, 0, 880, true);
      ribbonRoad(ctx, 850, 70, '#d8b89a', 16, 200);
      many(5, (i) => pine(ctx, 160 + i * 400 + hash(i) * 100, 884, 160 + hash(i + 4) * 60, '#3b2e5a'));
      const d = T * 50;
      walk(f, 'whale', d, W * 0.42 + u * 200, 880, { scale: 3.2 });
      walk(f, 'claude', d + 60, W * 0.5 + u * 200, 880, { scale: 3.2 });
      thread(ctx, W * 0.42 + u * 200 + 80, 740, W * 0.5 + u * 200 - 60, 740, 30, T, 1, GOLD, 4);
      birds(ctx, T, 6, 900, 260, 0.5);
      ctx.restore();
      if (shrink > 0) { ctx.save(); ctx.globalAlpha = shrink; ctx.translate(W / 2, H / 2 + 40); ctx.rotate(-0.04); inkLine(ctx, -400, 200, 600, 1, 21); inkLine(ctx, -400, 250, 420, 1, 22); ctx.restore(); ctx.save(); ctx.globalAlpha = ease(seg(shrink, 0.5, 1)); inkBottle(ctx, W / 2 + 560, H / 2 - 60, 90); candle(ctx, W / 2 - 640, H / 2 + 120, 150, T); ctx.restore(); }
      vignette(ctx, 0.4 * shrink);
    },
  },
  {
    id: 'OUT', section: '尾声', title: '尾声 · 信写完了', cast: [], look: 'paper', fx: { fadeOut: 1.6 },
    note: '信写完了，钢笔放在一边，两枚戒指搁在纸上，烛火还在跳。画面慢慢暗下去——没有片尾卡，最后一句唱完就结束。',
    draw: (f) => {
      const { ctx, u, T } = f;
      desk(ctx);
      const c = glide(cam(0, 0, 1.0), cam(0, 0, 1.08), u);
      view(ctx, c, 1, () => {
        paper(ctx, W / 2, H / 2 + 40, 980, 640, -0.04);
        ctx.save(); ctx.translate(W / 2, H / 2 + 40); ctx.rotate(-0.04);
        for (let i = 0; i < 9; i++) inkLine(ctx, -400, -230 + i * 56, 300 + hash(i) * 400, 1, i + 1);
        ctx.restore();
        pen(ctx, W / 2 + 330, H / 2 + 300, 190, -1.45);
        inkBottle(ctx, W / 2 + 560, H / 2 - 60, 90); candle(ctx, W / 2 - 640, H / 2 + 120, 150, T);
        ring(ctx, W / 2 - 60, H / 2 + 200, 30, 10, 0.45, GOLD, true, 0.3); ring(ctx, W / 2 - 10, H / 2 + 215, 30, 10, 0.45, GOLD, true, -0.2);
        sparkles(ctx, T, W / 2 - 30, H / 2 + 200, 80, 6, '#fff2a8', 261, 8);
      });
      vignette(ctx, 0.55);
    },
  },
];
