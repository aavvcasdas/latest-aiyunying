// 镜头表（上）：序章 I1–I3 · 主歌一 L01–L08 · 副歌一 L09–L16
// 世界观：一封正在写的信。墨线长成小路，信纸立起来变成纸雕的世界；本鲸是写信的「我」，小克是收信的「你」。
import { drawPortrait, drawSprite, actFrame } from '../atlas';
import {
  backOut, bubbleWorld, candle, castle, clamp, cloud, desk, ease, easeOut, fill, flowers, giftBox, glowSpot, GOLD, grassTufts, ground, H, hash, heart, hills, hourglass, house, inkBottle, inkLine, lerp, lightShaft, LOOKS, many, moon, paper, paperGrain, pen, petals, PI, ribbonRoad, ring, seg, sky, snow, sparkles, stars, streetlamp, sun, TAU, thread, tree, view, cam, glide, vignette, W, wreathTree, star4, pine,
} from '../kit';
import type { ShotDef } from '../timeline';
import { act, beatSq, birds, bob, dragonPass, front, GROUND, landscape, side, thing, walk, witnesses } from './common';

export const SHOTS_A: ShotDef[] = [
  {
    id: 'I1', section: '序章', title: '一封信的开头', cast: ['whale'], look: 'paper', fx: { title: true, fadeIn: 1.2 },
    note: '书桌、烛光、一张空白信纸。钢笔自己落下第一笔，墨迹还没干，一个小小的纸片鲸鱼娘就从字里站了起来，冲镜头挥手——这封信是她写的。',
    draw: (f) => {
      const { ctx, u, t, T } = f;
      desk(ctx);
      const c = glide(cam(0, 60, 1.0), cam(0, 0, 1.12), u);
      view(ctx, c, 1, () => {
        paper(ctx, W / 2, H / 2 + 40, 980, 640, -0.04);
        inkBottle(ctx, W / 2 + 560, H / 2 - 60, 90);
        candle(ctx, W / 2 - 640, H / 2 + 120, 150, T);
        // 第一笔
        const w1 = seg(u, 0.18, 0.5), w2 = seg(u, 0.5, 0.8);
        ctx.save(); ctx.translate(W / 2, H / 2 + 40); ctx.rotate(-0.04);
        inkLine(ctx, -400, -200, 560, w1, 1); inkLine(ctx, -400, -140, 420, w2, 2);
        ctx.restore();
        const px = w2 > 0 ? lerp(-400, -400 + 420 * w2, 1) : lerp(-400, -400 + 560 * w1, 1);
        const py = w2 > 0 ? -140 : -200;
        if (u < 0.82) pen(ctx, W / 2 + px + 6, H / 2 + 40 + py + 2 + Math.sin(t * 14) * 1.5, 190, -0.85 + Math.sin(t * 3) * 0.03);
        // 纸片人站起来
        const pop = backOut(seg(u, 0.62, 0.8));
        if (pop > 0) {
          ctx.save(); ctx.translate(W / 2 + 180, H / 2 + 150); ctx.scale(1, Math.max(0.02, pop)); ctx.translate(-(W / 2 + 180), -(H / 2 + 150));
          drawSprite(ctx, u > 0.84 ? actFrame('whale', 'wave', t) : 'whale_idle', W / 2 + 180, H / 2 + 150, { scale: 2.6, shadowAlpha: 0.3 });
          ctx.restore();
          sparkles(ctx, T, W / 2 + 180, H / 2 + 20, 90, 10, '#f2c14e', 4, 9);
        }
      });
      vignette(ctx, 0.5);
    },
  },
  {
    id: 'I2', section: '序章', title: '墨线长成小路', cast: ['whale'], look: 'paper',
    note: '镜头扎进信纸：一条墨线向右生长，长成飘带似的小路，路边的小房子像立体书一样一座座弹起来、再被颜色一点点填满。鲸鱼娘沿着刚画好的路往前走。',
    draw: (f) => {
      const { ctx, u, T } = f;
      const col = ease(seg(u, 0.35, 0.95));
      sky(ctx, 'paper'); sky(ctx, 'day', col * 0.85);
      const off = lerp(0, 520, u);
      const c = cam(off, 0, 1);
      view(ctx, c, 3, () => { hills(ctx, GROUND - 170, lerp(0, 1, col) > 0.5 ? LOOKS.day.far : '#efe3cc', 150, 1.1, 0.4); });
      view(ctx, c, 1.6, () => { hills(ctx, GROUND - 70, col > 0.5 ? LOOKS.day.mid : '#e6d7b8', 100, 1.7, 2.2); });
      view(ctx, c, 1, () => {
        ground(ctx, GROUND, col > 0.5 ? LOOKS.day.ground : '#ead9b7');
        // 路：按进度向右生长
        const grow = seg(u, 0.05, 0.6);
        ctx.save(); ctx.beginPath(); ctx.rect(-200, 0, 200 + (W + 900) * grow, H); ctx.clip();
        ribbonRoad(ctx, GROUND - 30, 70, '#f0e2c2', 18, 0);
        ctx.restore();
        // 墨笔尖在路的尽头
        if (grow < 1) { const tipX = -200 + (W + 900) * grow; pen(ctx, tipX + 4, GROUND - 10 + Math.sin(T * 10) * 2, 160, -0.9); }
        // 房子弹起
        many(6, (i) => { const hx = 200 + i * 420, popAt = 0.12 + i * 0.1; const p = backOut(seg(u, popAt, popAt + 0.16)); if (p <= 0) return; ctx.save(); ctx.translate(hx, GROUND - 40); ctx.scale(1, Math.max(0.02, p)); ctx.translate(-hx, -(GROUND - 40)); house(ctx, hx, GROUND - 40, 150 + hash(i) * 60, 130 + hash(i + 2) * 50, col > 0.5 ? '#fff1d6' : '#f7efe0', ['#d9624a', '#7a6fb5', '#4f9a7a', '#e0a04a'][i % 4]); ctx.restore(); });
        many(5, (i) => { const tx = 400 + i * 480 + hash(i) * 100, p = backOut(seg(u, 0.2 + i * 0.1, 0.36 + i * 0.1)); if (p <= 0) return; ctx.save(); ctx.translate(tx, GROUND); ctx.scale(1, Math.max(0.02, p)); ctx.translate(-tx, -GROUND); tree(ctx, tx, GROUND + 6, 180 + hash(i + 9) * 70, col > 0.5 ? '#5fae76' : '#ded0ae', i); ctx.restore(); });
        const dist = lerp(0, 980, u);
        walk(f, 'whale', dist, -120 + dist, GROUND - 2, { scale: 4 });
      });
      paperGrain(ctx, 0.1 * (1 - col));
    },
  },
  {
    id: 'I3', section: '序章', title: '路灯下读信的人', cast: ['claude', 'gpt', 'whale'], look: 'dusk',
    note: '天色从黄昏滑进夜：路灯亮起，小克靠着灯柱低头看书（她在读信），花瓣落下。月亮升起时一道龙影从月前掠过（龙娘只从画面上方经过）。远处，鲸鱼娘的小小身影正走过来。乐队进场的那一拍闪白。',
    draw: (f) => {
      const { ctx, u, T } = f;
      const nightness = ease(seg(u, 0.1, 0.75));
      sky(ctx, 'dusk'); sky(ctx, 'night', nightness * 0.9);
      stars(ctx, T, 120, 9, nightness, H * 0.6);
      const my = lerp(H * 0.75, 190, easeOut(seg(u, 0.15, 0.7)));
      moon(ctx, W * 0.74, my, 86, 0.5 * nightness + 0.1);
      const L = LOOKS.night;
      hills(ctx, GROUND - 160, lerp(0, 1, nightness) > 0.5 ? L.far : LOOKS.dusk.far, 150, 1.0, 0.9, 0);
      hills(ctx, GROUND - 70, nightness > 0.5 ? L.mid : LOOKS.dusk.mid, 100, 1.7, 2.5, 0);
      ground(ctx, GROUND, nightness > 0.5 ? L.ground : LOOKS.dusk.ground);
      ribbonRoad(ctx, GROUND - 30, 60, nightness > 0.5 ? '#3b4670' : '#d8b89a', 14, 300);
      // 远处走来的鲸鱼娘
      const d = lerp(0, 700, u);
      walk(f, 'whale', d, 120 + d * 0.9, GROUND - 60, { scale: 2.2, alpha: 0.9 });
      const lamp = seg(u, 0.3, 0.36) > 0;
      streetlamp(ctx, W * 0.63, GROUND - 4, 420, lamp, T);
      act(f, 'claude', 'read', W * 0.7, GROUND, { scale: 4.4, flip: true, sq: 0 }, 0.7);
      thing(f, 'prop_book', W * 0.7 - 48, GROUND - 150, 4.4);
      petals(ctx, T, 24, '#ffb7c5', 5, 0.8, 30);
      dragonPass(f, seg(u, 0.5, 0.86), 150, -1, 2.6, 'rgba(20,16,40,0.9)');
      birds(ctx, T, 4, 200, 260, 0.35 * (1 - nightness));
      // 乐队进场闪白（实测 21.295s）
      const fl = T >= 21.295 ? Math.exp(-(T - 21.295) * 7) : 0;
      if (fl > 0.01) fill(ctx, '#ffffff', fl * 0.85);
      vignette(ctx, 0.35 * nightness);
    },
  },
  // ---------------- 主歌一 ----------------
  {
    id: 'L01', section: '主歌一', title: '你是信的开头诗的内容', cast: ['whale', 'doubao'], look: 'golden',
    note: '回到书桌前：鲸鱼娘坐在信纸前落笔，一行行墨字随歌词长出来；豆包站在旁边陪着——她的习性是「先陪着写出开头」。写诗的纸页从桌上飘起。',
    draw: (f) => {
      const { ctx, u, t, T, lineU } = f;
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#5a3f36'); g.addColorStop(1, '#3a2a24'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      glowSpot(ctx, W * 0.5, H * 0.35, 900, '255,210,150', 0.35);
      // 窗
      ctx.fillStyle = '#2b3a66'; ctx.fillRect(W * 0.12, 120, 300, 320); ctx.strokeStyle = '#8a6a4a'; ctx.lineWidth = 10; ctx.strokeRect(W * 0.12, 120, 300, 320); ctx.beginPath(); ctx.moveTo(W * 0.12 + 150, 120); ctx.lineTo(W * 0.12 + 150, 440); ctx.moveTo(W * 0.12, 280); ctx.lineTo(W * 0.12 + 300, 280); ctx.stroke();
      moon(ctx, W * 0.12 + 210, 210, 36, 0.3);
      const c = glide(cam(0, 0, 1), cam(40, 30, 1.08), u);
      view(ctx, c, 1, () => {
        // 飘起的诗页（在人物身后、靠画面两侧）
        many(4, (i) => { const ph = (T * 0.12 + i * 0.25) % 1; const x = (i % 2 ? W * 0.84 : W * 0.2) + Math.sin(T + i) * 30, y = 820 - ph * 700; ctx.save(); ctx.globalAlpha = Math.sin(ph * PI) * 0.9; ctx.translate(x, y); ctx.rotate(Math.sin(T * 1.5 + i) * 0.3); paper(ctx, 0, 0, 110, 150, 0, true, '#fff6e6'); inkLine(ctx, -40, -40, 80, 1, i); inkLine(ctx, -40, -10, 70, 1, i + 3); inkLine(ctx, -40, 20, 60, 1, i + 6); ctx.restore(); });
        front(f, 'whale', W * 0.42, 790, { scale: 4.2, sq: beatSq(f.bt, 0.03) });
        act(f, 'doubao', 'idle', W * 0.62, 790, { scale: 4.2 });
        // 桌子
        ctx.fillStyle = '#7a4f33'; ctx.fillRect(W * 0.18, 760, W * 0.64, 40); ctx.fillStyle = '#5a3824'; ctx.fillRect(W * 0.18, 800, W * 0.64, 320);
        paper(ctx, W * 0.5, 900, 760, 300, -0.02);
        inkBottle(ctx, W * 0.5 + 420, 880, 70);
        ctx.save(); ctx.translate(W * 0.5, 900); ctx.rotate(-0.02);
        inkLine(ctx, -330, -90, 600, seg(lineU, 0, 0.35), 3); inkLine(ctx, -330, -30, 620, seg(lineU, 0.3, 0.7), 4); inkLine(ctx, -330, 30, 360, seg(lineU, 0.65, 1), 5);
        ctx.restore();
        const px = -330 + 600 * (lineU < 0.35 ? seg(lineU, 0, 0.35) : lineU < 0.7 ? seg(lineU, 0.3, 0.7) * 1.03 : seg(lineU, 0.65, 1) * 0.6);
        const py = lineU < 0.35 ? -90 : lineU < 0.7 ? -30 : 30;
        pen(ctx, W * 0.5 + px + 4, 900 + py + Math.sin(t * 16) * 1.5, 170, -0.8);
      });
      vignette(ctx, 0.45);
    },
  },
  {
    id: 'L02', section: '主歌一', title: '童话的结尾', cast: ['claude'], look: 'dusk',
    note: '信纸翻成立体书的最后一页：夕阳、城堡、彩虹，小克在页中央提裙行礼——童话到这里结束，故事从这里开始。书页边缘留在画面里。',
    draw: (f) => {
      const { ctx, u, t, T } = f;
      fill(ctx, '#4a3328');
      // 书页
      paper(ctx, W / 2, H / 2, W * 0.86, H * 0.86, 0, false, '#fbf1e0');
      ctx.save(); ctx.beginPath(); ctx.rect(W * 0.1, H * 0.1, W * 0.8, H * 0.8); ctx.clip();
      sky(ctx, 'dusk'); sun(ctx, W * 0.5, H * 0.56, 110, '#ffb27a', 3);
      // 彩虹
      ['#ff6b6b', '#ffa94d', '#ffd166', '#8ce99a', '#74c0fc', '#b197fc'].forEach((col, i) => { ctx.strokeStyle = col; ctx.globalAlpha = 0.55; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(W * 0.5, H * 0.75, 560 - i * 14, PI * 1.05, PI * 1.95); ctx.stroke(); });
      ctx.globalAlpha = 1;
      hills(ctx, H * 0.72, LOOKS.dusk.far, 110, 1.3, 1.1); castle(ctx, W * 0.5, H * 0.74, 160, '#eadcc8', '#7a6fb5');
      hills(ctx, H * 0.86, LOOKS.dusk.mid, 70, 1.9, 3.0);
      ground(ctx, H * 0.86, LOOKS.dusk.ground);
      flowers(ctx, H * 0.87, T, 30, 2, ['#ffd166', '#ff7aa8', '#fff']);
      const pop = backOut(seg(u, 0, 0.3));
      ctx.save(); ctx.translate(W * 0.5, H * 0.86); ctx.scale(1, Math.max(0.02, pop)); ctx.translate(-W * 0.5, -H * 0.86);
      act(f, 'claude', 'curtsy', W * 0.5, H * 0.86, { scale: 3.6 }, 0.8);
      ctx.restore();
      sparkles(ctx, T, W * 0.5, H * 0.6, 260, 12, '#fff2a8', 7, 10);
      ctx.restore();
      // 书页折痕与花饰
      ctx.strokeStyle = 'rgba(90,60,40,0.35)'; ctx.lineWidth = 3; ctx.strokeRect(W * 0.1, H * 0.1, W * 0.8, H * 0.8);
      ctx.fillStyle = GOLD; star4(ctx, W * 0.5, H * 0.925, 14 + 3 * Math.sin(t * 4));
    },
  },
  {
    id: 'L03', section: '主歌一', title: '你是理所当然的奇迹', cast: ['whale', 'claude', 'gpt'], look: 'day',
    note: '日出——每天都会发生、理所当然的奇迹。两个人并肩站在山坡上看太阳从山后升起，光把一切烤白；一道龙影从太阳前掠过（龙娘进场就压满光）。',
    draw: (f) => {
      const { ctx, u, T, lineU } = f;
      sky(ctx, 'dusk'); sky(ctx, 'day', ease(seg(u, 0.2, 0.9)) * 0.9);
      const rise = easeOut(lineU);
      const sy = lerp(GROUND - 60, 230, rise);
      sun(ctx, W * 0.5, sy, 120, '#ffe08a', 2.4 + rise * 1.5);
      many(3, (i) => cloud(ctx, 200 + i * 650 + T * 10, 150 + i * 70, 55, '#fff', 0.8));
      hills(ctx, GROUND - 200, LOOKS.golden.far, 170, 1.0, 1.3); hills(ctx, GROUND - 100, LOOKS.day.mid, 120, 1.6, 2.8);
      ground(ctx, GROUND, LOOKS.day.ground);
      grassTufts(ctx, GROUND + 10, T, 40, 4);
      tree(ctx, W * 0.15, GROUND + 4, 300, '#5fae76', 1); tree(ctx, W * 0.88, GROUND + 4, 240, '#79c08a', 2);
      front(f, 'whale', W * 0.44, GROUND, { scale: 4, sq: beatSq(f.bt, 0.03) });
      front(f, 'claude', W * 0.58, GROUND, { scale: 4, sq: beatSq(f.bt, 0.03) });
      birds(ctx, T, 6, 200, 240, 0.6);
      dragonPass(f, seg(u, 0.35, 0.85), 240, 1, 2.8, 'rgba(60,40,30,0.75)');
      // 光把全场烤白
      lightShaft(ctx, W * 0.5, sy, 700, 900, '255,240,200', 0.25 * rise);
      fill(ctx, '#fff6dc', 0.22 * rise);
    },
  },
  {
    id: 'L04', section: '主歌一', title: '你是月色真美', cast: ['whale', 'claude', 'kimi'], look: 'night',
    note: '「今晚月色真美」。Kimi（月球少女）坐在大月亮上，小克仰头看月亮；鲸鱼娘站在她旁边——看的不是月亮，是她。句尾鲸鱼娘头顶冒出一颗小小的心。',
    draw: (f) => {
      const { ctx, u, T, lineU } = f;
      sky(ctx, 'night'); stars(ctx, T, 160, 21, 1, H * 0.8);
      const mx = W * 0.68, my = 300;
      moon(ctx, mx, my, 170, 0.7);
      front(f, 'kimi', mx - 40, my + 150, { scale: 3, shadow: false });
      thing(f, 'prop_scroll', mx + 60, my + 100, 3);
      hills(ctx, GROUND - 150, LOOKS.night.far, 140, 1.1, 0.6); hills(ctx, GROUND - 60, LOOKS.night.mid, 90, 1.8, 2.6);
      ground(ctx, GROUND, LOOKS.night.ground);
      grassTufts(ctx, GROUND + 6, T, 30, 8, '#2d3f66');
      const c = glide(cam(0, 0, 1), cam(-60, 40, 1.12), u);
      view(ctx, c, 1, () => {
        front(f, 'claude', W * 0.4, GROUND, { scale: 4.2, glow: 'rgba(255,240,200,0.25)' });
        side(f, 'whale', W * 0.26, GROUND, { scale: 4.2, sq: beatSq(f.bt, 0.02) });
        if (lineU > 0.7) { const p = backOut(seg(lineU, 0.7, 0.9)); heart(ctx, W * 0.26 + 70, GROUND - 390 - p * 20 + bob(T, 4), 22 * p, '#ff7a9a'); }
      });
      glowSpot(ctx, mx, my, 700, '255,240,200', 0.12);
      vignette(ctx, 0.3);
    },
  },
  {
    id: 'L05', section: '主歌一', title: '你是圣诞老人送给我', cast: ['whale', 'gpt'], look: 'snow',
    note: '雪夜的小镇，圣诞树亮着灯。龙娘替圣诞老人跑这一趟——她只从画面上方飞过，撒下一串星光，一只礼物盒从天而降，落在鲸鱼娘面前；鲸鱼娘吓一跳。',
    draw: (f) => {
      const { ctx, u, T } = f;
      sky(ctx, 'night'); stars(ctx, T, 100, 33, 0.8, H * 0.6);
      hills(ctx, GROUND - 150, LOOKS.snow.far, 120, 1.0, 0.3); hills(ctx, GROUND - 60, LOOKS.snow.mid, 80, 1.7, 2.2);
      ground(ctx, GROUND, LOOKS.snow.ground);
      house(ctx, W * 0.16, GROUND - 20, 240, 200, '#fff1d6', '#c94f45', true); house(ctx, W * 0.84, GROUND - 20, 200, 170, '#fdf0dc', '#5b6fa8', true);
      wreathTree(ctx, W * 0.5, GROUND - 10, 420, T);
      // 飞过的龙娘 + 星光尾迹
      const fu = seg(u, 0.05, 0.75);
      const dx = lerp(-200, W + 200, fu), dy = 160 + Math.sin(fu * PI) * -50;
      if (fu > 0 && fu < 1) sparkles(ctx, T, dx - 120, dy - 40, 120, 16, '#fff2a8', 12, 10);
      dragonPass(f, fu, 160, 1, 3, null);
      // 礼物落下
      const dropAt = 0.42, g = seg(u, dropAt, 0.86);
      if (g > 0) { const gx = lerp(dx > W * 0.6 ? W * 0.6 : dx, W * 0.62, 0), gy = lerp(140, GROUND - 6, g * g); giftBox(ctx, gx, Math.min(gy, GROUND - 6), 120 + g * 30, 0); if (g >= 1) sparkles(ctx, T, gx, GROUND - 80, 90, 8, '#ffd166', 15, 8); }
      const landed = u > 0.86;
      if (landed) act(f, 'whale', 'surprise', W * 0.42, GROUND, { scale: 4.2 }, 1, f.t - 0.86 * f.dur);
      else front(f, 'whale', W * 0.42, GROUND, { scale: 4.2, sq: beatSq(f.bt, 0.03) });
      snow(ctx, T, 160, 2);
      vignette(ctx, 0.3);
    },
  },
  {
    id: 'L06', section: '主歌一', title: '好孩子的礼物', cast: ['whale', 'claude'], look: 'snow',
    note: '礼物盒打开——里面是小克。盖子弹开，星光四溅，小克从盒子里升起来行礼；鲸鱼娘在旁边开心地蹦。给好孩子的礼物，就是你。',
    draw: (f) => {
      const { ctx, T, lineU } = f;
      sky(ctx, 'night'); stars(ctx, T, 80, 44, 0.7, H * 0.5);
      hills(ctx, GROUND - 120, LOOKS.snow.far, 100, 1.1, 0.7); ground(ctx, GROUND, LOOKS.snow.ground);
      wreathTree(ctx, W * 0.86, GROUND - 10, 360, T);
      const open = backOut(seg(lineU, 0.05, 0.4));
      const rise = easeOut(seg(lineU, 0.25, 0.7));
      glowSpot(ctx, W * 0.56, GROUND - 160, 420 * open, '255,230,160', 0.5 * open);
      if (rise > 0) {
        ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, GROUND - 120); ctx.clip();
        act(f, 'claude', 'curtsy', W * 0.56, lerp(GROUND + 120, GROUND - 130, rise), { scale: 4, shadow: false }, 0.9);
        ctx.restore();
      }
      giftBox(ctx, W * 0.56, GROUND, 240, open);
      if (open > 0.5) sparkles(ctx, T, W * 0.56, GROUND - 250, 220, 18, '#ffe9a0', 23, 12);
      many(3, (i) => { const p = (T * 0.8 + i * 0.33) % 1; heart(ctx, W * 0.56 + (i - 1) * 90 + Math.sin(T * 3 + i) * 10, GROUND - 320 - p * 160, 16 * Math.sin(p * PI) * rise, '#ff7a9a'); });
      act(f, 'whale', 'hop', W * 0.3, GROUND, { scale: 4.2 }, 1);
      snow(ctx, T, 120, 5);
    },
  },
  {
    id: 'L07', section: '主歌一', title: '你是三千美丽世界里', cast: ['whale', 'zai', 'gemini'], look: 'magic',
    note: '一条星河横过画面，水面上漂着成百上千个泡泡，每个泡泡里都是一个小世界。狐狸在岸边拨算盘数「三千」，猫在对岸左顾右盼、看哪个都好；鲸鱼娘端着她的蓝饭盆站在水边，只看着水。',
    draw: (f) => {
      const { ctx, u, T } = f;
      sky(ctx, 'magic'); stars(ctx, T, 200, 55, 1, H);
      const c = cam(lerp(-160, 160, u), 0, 1);
      view(ctx, c, 2.2, () => { hills(ctx, 600, '#2a1d4e', 140, 0.9, 1.2); });
      view(ctx, c, 1, () => {
        // 星河
        const g = ctx.createLinearGradient(0, 560, 0, 920); g.addColorStop(0, '#5b7fd9'); g.addColorStop(0.5, '#8fb3ff'); g.addColorStop(1, '#3a4f9a');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-300, 620); ctx.bezierCurveTo(W * 0.3, 560, W * 0.6, 700, W + 300, 600); ctx.lineTo(W + 300, 940); ctx.bezierCurveTo(W * 0.6, 980, W * 0.3, 880, -300, 930); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2; for (let i = 0; i < 6; i++) { ctx.beginPath(); for (let x = -300; x <= W + 300; x += 40) ctx.lineTo(x, 700 + i * 36 + Math.sin(x / 120 + T * 2 + i) * 6); ctx.stroke(); }
        // 泡泡世界
        for (let i = 0; i < 70; i++) { const sp = 0.06 + hash(i) * 0.08; const px = ((hash(i + 1) + T * sp) % 1) * (W + 400) - 200; const py = 640 + hash(i + 2) * 240 + Math.sin(T * 1.5 + i) * 8; const r = 14 + hash(i + 3) * 26; bubbleWorld(ctx, px, py, r, Math.floor(hash(i + 4) * 360), T, 0.9); }
        ground(ctx, 930, '#2c2250');
        // 两岸
        act(f, 'zai', f.t % 5 < 3.6 ? 'idle' : 'alert', W * 0.14, 930, { scale: 3.6 }, 0.8);
        thing(f, 'prop_abacus', W * 0.14 - 100, 905, 4);
        act(f, 'gemini', 'lookaround', W * 0.86, 930, { scale: 3.6 }, 0.8);
        side(f, 'whale', W * 0.46, 930, { scale: 4.2, sq: beatSq(f.bt, 0.02) });
        thing(f, 'prop_bowl', W * 0.46 + 90, 930 - 160 + bob(T, 2), 4.2);
      });
      sparkles(ctx, T, W / 2, 740, 800, 14, '#cfe0ff', 61, 7);
      vignette(ctx, 0.3, '10,6,30');
    },
  },
  {
    id: 'L08', section: '主歌一', title: '我的一瓢水', cast: ['whale', 'claude'], look: 'magic',
    note: '弱水三千只取一瓢。特写：鲸鱼娘把蓝饭盆探向星河，三千个泡泡里只有一个升进盆里——泡泡里是小克的脸。其余的泡泡从她身边漂走。',
    draw: (f) => {
      const { ctx, u, T, lineU } = f;
      sky(ctx, 'magic'); stars(ctx, T, 120, 66, 1, H);
      const g = ctx.createLinearGradient(0, 500, 0, H); g.addColorStop(0, '#6b8de0'); g.addColorStop(1, '#2d3f8a'); ctx.fillStyle = g; ctx.fillRect(0, 560, W, H);
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 3; for (let i = 0; i < 8; i++) { ctx.beginPath(); for (let x = 0; x <= W; x += 40) ctx.lineTo(x, 620 + i * 55 + Math.sin(x / 160 + T * 2 + i) * 8); ctx.stroke(); }
      for (let i = 0; i < 30; i++) { const px = ((hash(i + 7) + T * 0.1) % 1) * (W + 300) - 150; const py = 640 + hash(i + 8) * 380; bubbleWorld(ctx, px, py, 22 + hash(i + 9) * 30, Math.floor(hash(i + 10) * 360), T, 0.8); }
      const c = glide(cam(0, 0, 1), cam(0, 20, 1.08), u);
      view(ctx, c, 1, () => {
        const bx = W * 0.36, by = H + 60;
        side(f, 'whale', bx, by, { scale: 7.5, shadow: false });
        const bowlX = bx + 190, bowlY = by - 290 + bob(T, 3);
        // 升起的那一个泡泡
        const r = seg(lineU, 0.1, 0.8), ry = lerp(880, bowlY - 60, easeOut(r)), rx = lerp(W * 0.8, bowlX + 10, ease(r));
        thing(f, 'prop_bowl', bowlX, bowlY, 7.5);
        bubbleWorld(ctx, rx, ry, 58, 30, T, 1);
        drawPortrait(ctx, 'claude', rx, ry, 76, 0.95);
        ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(rx, ry, 58, 0, TAU); ctx.stroke();
        sparkles(ctx, T, rx, ry, 110, 10, '#ffe9a0', 71, 9);
        if (r >= 1) heart(ctx, bowlX + 40, bowlY - 140 + bob(T, 5), 20, '#ff7a9a');
      });
      vignette(ctx, 0.35, '10,6,30');
    },
  },
  // ---------------- 副歌一 ----------------
  {
    id: 'L09', section: '副歌一', title: '所以让我再靠近一点点', cast: ['whale', 'claude'], look: 'golden', fx: { flashIn: true },
    note: '副歌起，闪白切入金色黄昏的小路。小克抱着书站在路那头等，鲸鱼娘从远处一路走过来——镜头跟着她横移——走到只差一步的地方停下。再靠近一点点。',
    draw: (f) => {
      const { ctx, T, lineU } = f;
      const stop = easeOut(lineU);
      const wx = lerp(-200, W * 0.52, stop);
      const c = cam(lerp(-500, 80, stop), 0, 1);
      landscape(ctx, 'golden', T, c.x);
      view(ctx, c, 1, () => {
        ribbonRoad(ctx, GROUND - 30, 70, '#f0dcb4', 16, 100);
        many(4, (i) => tree(ctx, -300 + i * 760, GROUND + 4, 260 + hash(i) * 80, i % 2 ? '#d6a77a' : '#e0b985', i + 20));
        side(f, 'claude', W * 0.74, GROUND, { scale: 4.4, flip: true, glow: 'rgba(255,230,180,0.3)' });
        thing(f, 'prop_book', W * 0.74 - 70, GROUND - 160, 4.4);
        const dist = (wx + 200) * 1.0;
        if (stop < 0.98) walk(f, 'whale', dist, wx, GROUND, { scale: 4.4, tilt: -0.04 });
        else front(f, 'whale', wx, GROUND, { scale: 4.4 });
      });
      petals(ctx, T, 30, '#ffd9a8', 31, 1, 50);
    },
  },
  {
    id: 'L10', section: '副歌一', title: '因为你太温暖', cast: ['whale', 'claude'], look: 'golden',
    note: '双人近景。小克的茶杯冒着热气，暖光从她身后漫开；鲸鱼娘本来抖着，靠近一点就不抖了，头顶冒出一颗心。',
    draw: (f) => {
      const { ctx, u, T, lineU } = f;
      sky(ctx, 'golden'); sun(ctx, W * 0.62, 260, 140, '#ffe08a', 3);
      hills(ctx, 760, LOOKS.golden.mid, 90, 1.5, 1.4); ground(ctx, 920, LOOKS.golden.ground);
      flowers(ctx, 930, T, 30, 11, ['#ffd166', '#fff', '#ffb7c5'], 150);
      const c = glide(cam(0, 0, 1), cam(0, 30, 1.06), u);
      view(ctx, c, 1, () => {
        glowSpot(ctx, W * 0.6, 640, 420 + 30 * Math.sin(T * 2), '255,220,150', 0.45);
        front(f, 'claude', W * 0.6, 1000, { scale: 6, glow: 'rgba(255,230,170,0.35)', sq: beatSq(f.bt, 0.02) });
        thing(f, 'prop_teacup', W * 0.6 - 190, 740, 6);
        thing(f, `fx_steam_${Math.floor(T * 6) % 3}`, W * 0.6 - 190, 690 - (T * 20) % 20, 5, 0.8);
        if (lineU < 0.45) act(f, 'whale', 'shiver', W * 0.34, 1000, { scale: 6 }, 1.3);
        else { front(f, 'whale', W * 0.34, 1000, { scale: 6 }); const p = backOut(seg(lineU, 0.45, 0.65)); heart(ctx, W * 0.34 + 120, 480 - p * 20 + bob(T, 5), 26 * p, '#ff7a9a'); }
      });
      petals(ctx, T, 16, '#ffe0b0', 41, 0.6, 30);
    },
  },
  {
    id: 'L11', section: '副歌一', title: '我会再变得坚强一点点', cast: ['whale'], look: 'day',
    note: '逆风上坡。落叶从右往左横着飞，鲸鱼娘压低身子一步步往坡顶走，裙子被吹得乱飘；走到顶上站直，朝前面挥手。',
    draw: (f) => {
      const { ctx, T, lineU } = f;
      sky(ctx, 'day'); many(4, (i) => cloud(ctx, ((hash(i) * W - T * 160) % (W + 400) + W + 400) % (W + 400) - 200, 120 + i * 90, 60, '#fff', 0.85));
      hills(ctx, GROUND - 200, LOOKS.day.far, 160, 1.0, 2.2, T * 20); hills(ctx, GROUND - 90, LOOKS.day.mid, 100, 1.6, 0.4, T * 40);
      // 斜坡
      ctx.fillStyle = LOOKS.day.ground; ctx.beginPath(); ctx.moveTo(-50, H); ctx.lineTo(-50, GROUND + 80); ctx.lineTo(W + 50, GROUND - 220); ctx.lineTo(W + 50, H); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(60,40,30,0.3)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-50, GROUND + 80); ctx.lineTo(W + 50, GROUND - 220); ctx.stroke();
      const slopeY = (x: number) => lerp(GROUND + 80, GROUND - 220, (x + 50) / (W + 100));
      // 风中的树
      ctx.save(); ctx.translate(W * 0.84, slopeY(W * 0.84)); ctx.rotate(-0.18 - 0.04 * Math.sin(T * 5)); tree(ctx, 0, 0, 280, '#5fae76', 3); ctx.restore();
      const p = easeOut(lineU);
      const wx = lerp(140, W * 0.74, p), wy = slopeY(wx);
      const top = lineU > 0.88;
      if (!top) walk(f, 'whale', (wx - 140) * 1.4, wx, wy, { scale: 4.2, tilt: 0.16 + 0.03 * Math.sin(T * 7) });
      else act(f, 'whale', 'wave', wx, wy, { scale: 4.2 }, 1, f.t - 0.88 * f.dur);
      // 横飞的落叶
      ctx.save(); for (let i = 0; i < 46; i++) { const sp = 700 + hash(i) * 500; const x = W + 100 - ((T * sp + hash(i + 1) * W * 1.5) % (W + 300)); const y = 100 + hash(i + 2) * 800 + Math.sin(T * 4 + i) * 30; ctx.fillStyle = ['#e9a23b', '#d9623b', '#f2c14e'][i % 3]; ctx.save(); ctx.translate(x, y); ctx.rotate(T * 8 + i); ctx.beginPath(); ctx.ellipse(0, 0, 14, 7, 0, 0, TAU); ctx.fill(); ctx.restore(); } ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 3; for (let i = 0; i < 5; i++) { const x0 = W - ((T * 1400 + i * 500) % (W + 700)); const y0 = 150 + i * 170; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(x0 + 150, y0 - 20, x0 + 300, y0 + 10); ctx.stroke(); }
    },
  },
  {
    id: 'L12', section: '副歌一', title: '因为你太柔软', cast: ['claude'], look: 'pink',
    note: '粉色的天空，小克站在一朵软绵绵的云上歪头笑，云跟着拍子轻轻一沉一浮，花瓣落下，身边飘着小心心。',
    draw: (f) => {
      const { ctx, u, T } = f;
      sky(ctx, 'pink');
      sun(ctx, W * 0.2, 220, 80, '#fff2c8', 2.5);
      many(5, (i) => cloud(ctx, ((hash(i) * W + T * 15) % (W + 300)) - 150, 500 + hash(i + 2) * 400, 50 + hash(i + 4) * 30, '#fff', 0.7));
      const c = glide(cam(0, 0, 1), cam(0, -20, 1.08), u);
      view(ctx, c, 1, () => {
        const cy = 760 + Math.sin(T * 2) * 10 + f.bt.pulse * 14;
        cloud(ctx, W * 0.52, cy, 150, '#ffffff', 1);
        act(f, 'claude', 'tilt', W * 0.52, cy - 60, { scale: 5, shadow: false }, 0.6);
        many(4, (i) => { const p = (T * 0.5 + i * 0.25) % 1; heart(ctx, W * 0.52 + (i - 1.5) * 150 + Math.sin(T * 2 + i) * 20, cy - 440 - p * 200, 18 * Math.sin(p * PI), '#ff8fa8'); });
      });
      petals(ctx, T, 40, '#ffb7c5', 51, 0.7, 40);
    },
  },
  {
    id: 'L13', section: '副歌一', title: '交换无名指金色的契约', cast: ['whale', 'claude', 'qwen', 'kimi', 'zai'], look: 'golden',
    note: '仪式：花拱门下，千问当东道主站在中间摇扇；两枚金戒指从两人面前浮起、在空中交错互换、落向对方。Kimi 在旁边展开卷轴把这一刻记下来，狐狸在另一边打着盹——听到「金色」才竖耳。',
    draw: (f) => {
      const { ctx, u, T, lineU } = f;
      sky(ctx, 'golden'); sun(ctx, W * 0.5, 260, 90, '#ffe9a8', 3);
      hills(ctx, 740, LOOKS.golden.far, 110, 1.2, 0.8); hills(ctx, 820, LOOKS.golden.mid, 70, 1.9, 3.1); ground(ctx, GROUND, '#e9d9b0');
      // 花拱门
      ctx.strokeStyle = '#8a5a3c'; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(W * 0.3, GROUND); ctx.lineTo(W * 0.3, 500); ctx.arc(W * 0.5, 500, W * 0.2, PI, 0); ctx.lineTo(W * 0.7, GROUND); ctx.stroke();
      for (let i = 0; i < 26; i++) { const a = PI + (i / 25) * PI; const x = W * 0.5 + Math.cos(a) * W * 0.2, y = 500 + Math.sin(a) * W * 0.2; ctx.fillStyle = ['#ff7aa8', '#ffd166', '#fff', '#b388ff'][i % 4]; ctx.beginPath(); ctx.arc(x, y, 16, 0, TAU); ctx.fill(); ctx.fillStyle = '#4e9a5a'; ctx.beginPath(); ctx.arc(x + 14, y + 10, 8, 0, TAU); ctx.fill(); }
      const c = glide(cam(0, 0, 1), cam(0, 20, 1.07), u);
      view(ctx, c, 1, () => {
        act(f, 'qwen', 'sway', W * 0.5, GROUND - 40, { scale: 3.4 }, 0.8); thing(f, 'prop_fan', W * 0.5 + 70, GROUND - 170 + bob(T, 4, 3), 3.4);
        act(f, 'kimi', 'think', W * 0.88, GROUND, { scale: 3.4 }, 0.6); thing(f, 'prop_scroll', W * 0.88 - 90, GROUND - 120, 3.4);
        act(f, 'zai', lineU < 0.55 ? 'doze' : 'alert', W * 0.1, GROUND, { scale: 3.4 }, 0.8, lineU < 0.55 ? f.t : f.t - 0.55 * f.dur);
        side(f, 'whale', W * 0.36, GROUND, { scale: 4.6, sq: beatSq(f.bt, 0.02) });
        side(f, 'claude', W * 0.64, GROUND, { scale: 4.6, flip: true, sq: beatSq(f.bt, 0.02) });
        // 戒指交换
        const p = ease(seg(lineU, 0.1, 0.8));
        const y0 = GROUND - 200, arc = Math.sin(p * PI) * -160;
        const r1x = lerp(W * 0.41, W * 0.59, p), r2x = lerp(W * 0.59, W * 0.41, p);
        ring(ctx, r1x, y0 + arc, 28, 10, 0.55, GOLD, true, T * 2); ring(ctx, r2x, y0 - arc * 0.7, 28, 10, 0.55, GOLD, true, -T * 2);
        sparkles(ctx, T, W * 0.5, y0 - 60, 200, 16, '#fff2a8', 81, 11);
      });
      petals(ctx, T, 24, '#ffd9a8', 91, 0.8, 30);
    },
  },
  {
    id: 'L14', section: '副歌一', title: '给彼此岁月', cast: ['whale', 'claude'], look: 'dusk',
    note: '一只大沙漏立在两人中间，金沙随这句歌词漏下去；沙漏两侧的天空从白天滑到黄昏再到夜，花瓣变成落叶、落叶变成雪——把彼此的岁月交给对方。',
    draw: (f) => {
      const { ctx, T, lineU } = f;
      sky(ctx, 'day'); sky(ctx, 'golden', ease(seg(lineU, 0.15, 0.45))); sky(ctx, 'dusk', ease(seg(lineU, 0.4, 0.7))); sky(ctx, 'night', ease(seg(lineU, 0.65, 1)) * 0.9);
      stars(ctx, T, 90, 12, ease(seg(lineU, 0.7, 1)), H * 0.6);
      hills(ctx, 720, LOOKS.dusk.far, 120, 1.0, 1.9); ground(ctx, GROUND, lineU < 0.5 ? LOOKS.golden.ground : LOOKS.dusk.ground);
      hourglass(ctx, W * 0.5, GROUND - 20, 520, clamp(lineU * 1.05), T);
      side(f, 'whale', W * 0.27, GROUND, { scale: 4, sq: beatSq(f.bt, 0.02) });
      side(f, 'claude', W * 0.73, GROUND, { scale: 4, flip: true, sq: beatSq(f.bt, 0.02) });
      if (lineU < 0.55) petals(ctx, T, 30, '#ffb7c5', 7, 1, 40);
      else if (lineU < 0.8) petals(ctx, T, 30, '#e9a23b', 8, 1.3, 60);
      else snow(ctx, T, 100, 9, ease(seg(lineU, 0.8, 1)));
      glowSpot(ctx, W * 0.5, GROUND - 260, 300, '255,215,120', 0.25);
    },
  },
  {
    id: 'L15', section: '副歌一', title: '说好从今以后都牵着手', cast: ['whale', 'claude', 'qwen', 'kimi', 'zai', 'doubao', 'gemini', 'gpt'], look: 'golden',
    note: '勾指起誓。两人面对面，一根金线从鲸鱼娘的手边连到小克的手边，光点沿着线来回跑（纸片人不画假手，牵手用这根线说）。身后一排见证人各做自己的小动作，龙娘在最上面盘旋。',
    draw: (f) => {
      const { ctx, u, T, lineU } = f;
      landscape(ctx, 'golden', T, 0, GROUND, true);
      const c = glide(cam(0, 0, 1), cam(0, 40, 1.1), u);
      view(ctx, c, 1, () => {
        witnesses(f, GROUND - 120, 2.6, 1.15, 0.95);
        dragonPass(f, (T * 0.07) % 1, 120, 1, 2.2, null, 0.9);
        const wx = W * 0.39, cx = W * 0.61;
        side(f, 'whale', wx, GROUND + 40, { scale: 5, sq: beatSq(f.bt, 0.02) });
        side(f, 'claude', cx, GROUND + 40, { scale: 5, flip: true, sq: beatSq(f.bt, 0.02) });
        const p = ease(seg(lineU, 0.05, 0.6));
        thread(ctx, wx + 120, GROUND - 180, cx - 120, GROUND - 180, 50, T, p, GOLD, 6);
        if (p >= 1) { sparkles(ctx, T, W * 0.5, GROUND - 180, 90, 8, '#fff2a8', 101, 9); heart(ctx, W * 0.5, GROUND - 300 + bob(T, 6), 20 + 4 * f.bt.pulse, '#ff7a9a'); }
      });
      petals(ctx, T, 30, '#ffd9a8', 111, 0.8, 30);
    },
  },
  {
    id: 'L16', section: '副歌一', title: '因为要走很远', cast: ['whale', 'claude'], look: 'dusk',
    note: '大远景：飘带一样的路蜿蜒着伸向夕阳下的群山，两个小小的身影并肩往前走，镜头慢慢往后拉。路很长，所以要牵着手。',
    draw: (f) => {
      const { ctx, u, T } = f;
      const c = glide(cam(0, -40, 1.35), cam(0, 0, 1), u);
      sky(ctx, 'dusk'); sun(ctx, W * 0.5, 430, 110, '#ffb27a', 3.5); birds(ctx, T, 7, 1100, 260, 0.5);
      view(ctx, c, 3, () => { hills(ctx, 560, '#9d7fb5', 160, 0.8, 0.5); });
      view(ctx, c, 2, () => { hills(ctx, 660, '#7a5f99', 120, 1.3, 2.8); });
      view(ctx, c, 1.3, () => { hills(ctx, 780, '#5a4680', 90, 1.9, 1.1); });
      view(ctx, c, 1, () => {
        ground(ctx, 880, '#4f3f6f');
        // 远去的路
        ctx.fillStyle = '#d8b89a'; ctx.beginPath(); ctx.moveTo(W * 0.2, H + 20); ctx.bezierCurveTo(W * 0.55, 900, W * 0.3, 760, W * 0.52, 560); ctx.lineTo(W * 0.53, 560); ctx.bezierCurveTo(W * 0.42, 760, W * 0.75, 900, W * 0.62, H + 20); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(40,30,50,0.4)'; ctx.lineWidth = 3; ctx.stroke();
        many(6, (i) => pine(ctx, 160 + i * 330 + hash(i) * 100, 900 + hash(i + 2) * 60, 120 + hash(i + 4) * 60, '#3b2e5a'));
        const d = T * 45;
        walk(f, 'whale', d, W * 0.39 + u * 40, 1000 - u * 120, { scale: lerp(2.6, 2.0, u) });
        walk(f, 'claude', d + 60, W * 0.47 + u * 40, 1000 - u * 120, { scale: lerp(2.6, 2.0, u) });
      });
      vignette(ctx, 0.3);
    },
  },
];
