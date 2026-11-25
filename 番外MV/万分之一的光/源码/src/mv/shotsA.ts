// 第一幕 0:00–1:10 小房间 / 纸上的心里话 / 纸杯电话 / 副歌一 / 间奏一
import { F, Shot, C, W, H, TAU, bg, wash, glow, cam, rnd, seg, ss, eOut, eBack, lerp, clamp, rgba, mix, kick, beatPos, motes, leak, rays, dots, cloud, stars, note, heart, tear, star4, rr, txt, HAND, scribble, staff, vignette } from './kit';
import { spr, who, you, fr, walkF, shadow, whaleBig, rainInside, fish, Who } from './cast';
import { windowView, room, guitar, paper, cup, globe, calPage, box, wings, sprout, page, desk, pop } from './props';

const sh = (s: number, e: number, draw: (f: F) => void, o: Partial<Shot> = {}): Shot => ({ s, e, draw, ...o });
const P = '#6f7ea3'; // 铅笔色
const INK = '#2b2f45';
const PASTEL = ['#ff9cb8', '#8fc8ff', '#b7a4ff', '#ffd27a', '#9be0b8'];

/** 弹吉他的「你」：吉他挡在身前，不画手 */
export function youGuitar(c: C, t: number, x: number, y: number, s: number, strum: number, act = 'idle', fps = 8) {
  you(c, act, t, x, y, s, {}, fps);
  guitar(c, x + 4 * s, y - 30 * s, s * 0.3, -0.42, t, strum);
}
function risingNotes(c: C, lt: number, x: number, y: number, n: number, col: string[], spread = 30, rise = 220) {
  for (let i = 0; i < n; i++) { const u = (lt * 0.45 + i / n) % 1; note(c, x + i * spread * 0.6 + Math.sin(u * 6 + i) * spread, y - u * rise, 1.1 + (i % 3) * 0.15, col[i % col.length], Math.sin(u * Math.PI), i, Math.sin(u * 5 + i) * 0.3); }
}
function confetti(c: C, t: number, n: number, a = 1) {
  for (let i = 0; i < n; i++) {
    const x = (rnd(i, 1) * W + Math.sin(t * 1.5 + i) * 40 + W) % W, y = (rnd(i, 2) * H + t * 150 * (0.5 + rnd(i, 3))) % H;
    c.save(); c.translate(x, y); c.rotate(t * 3 * (rnd(i, 4) - 0.5) + i); c.globalAlpha = a; c.fillStyle = PASTEL[i % 5]; c.fillRect(-6, -3, 12, 6 * Math.abs(Math.cos(t * 4 + i)) + 1); c.restore();
  }
}

export const shotsA: Shot[] = [
  // 你应该忘记了吧 —— 「你」散成光点，纸从上面落下
  sh(0, 1.83, ({ c, t, lt, p }) => {
    bg(c, ['#fffdf8', '#fdeeda']);
    c.save(); cam(c, 1.03 + p * 0.04, 640, 380);
    glow(c, 1040, 110, 640, '#ffffff', 0.95);
    const fade = ss(seg(lt, 0.3, 1.75));
    you(c, 'idle', t, 420, 648, 4.4, { a: 1 - fade * 0.82 });
    for (let i = 0; i < 70; i++) {
      const k = clamp(fade * 1.5 - rnd(i, 1) * 0.5); if (k <= 0) continue;
      c.fillStyle = rgba(i % 3 ? '#a9cdf2' : '#ffffff', (1 - k * 0.5) * 0.85); c.beginPath();
      c.arc(420 + (rnd(i, 2) - 0.5) * 300 + k * (rnd(i, 3) - 0.5) * 160, 648 - rnd(i, 4) * 380 - k * 110 * (0.4 + rnd(i, 5)), (2 + rnd(i, 6) * 6) * (1 - k * 0.3), 0, TAU); c.fill();
    }
    shadow(c, 900, 652, 120, 0.1); whaleBig(c, t, 900, 656, 3.5);
    paper(c, 660 + Math.sin(lt * 2) * 46, 90 + lt * 150, 120, 160, Math.sin(lt * 1.6) * 0.5, { lines: 22, a: 0.96 });
    c.restore(); motes(c, t, 16, '#ffffff', 0.8, 1); leak(c, t, '#ffffff', 0.55);
  }, { fi: 1.1 }),

  // 天气晴朗 —— 一整面窗
  sh(1.83, 3.75, ({ c, t, lt, p }) => {
    c.save(); cam(c, 1.02 + p * 0.06, 640, 340); windowView(c, t);
    for (let i = 0; i < 9; i++) star4(c, 200 + rnd(i, 1) * 900, 80 + rnd(i, 2) * 420, 10 + rnd(i, 3) * 14, '#ffffff', Math.abs(Math.sin(lt * 3 + i * 1.7)) * 0.9, lt + i);
    c.restore();
  }, { fi: 0.35 }),

  // 心里却潮湿的盛夏 —— 雨只下在剪影里
  sh(3.75, 7.67, ({ c, t, lt, p }) => {
    c.save(); cam(c, 1.08 + p * 0.1, 640, 400); room(c, t);
    for (let i = 0; i < 10; i++) { c.fillStyle = 'rgba(120,170,120,.07)'; c.beginPath(); c.arc(640 + rnd(i, 1) * 560 + Math.sin(t * 0.8 + i) * 16, 120 + rnd(i, 2) * 330, 30 + rnd(i, 3) * 40, 0, TAU); c.fill(); }
    const nm = fr('whale', 'idle', t), wet = ss(seg(lt, 0.1, 1.2));
    c.fillStyle = rgba('#9fcdf5', 0.45 * wet); c.beginPath(); c.ellipse(640, 664, 170 * wet, 20 * wet, 0, 0, TAU); c.fill();
    for (let k = 0; k < 3; k++) { const u = (lt * 0.6 + k / 3) % 1; c.strokeStyle = rgba('#ffffff', (1 - u) * 0.8 * wet); c.lineWidth = 2; c.beginPath(); c.ellipse(640 + (k - 1) * 60, 664, 20 + u * 60, 3 + u * 8, 0, 0, TAU); c.stroke(); }
    you(c, 'idle', t, 640, 660, 4.6); rainInside(c, nm, 640, 660, 4.6, t, wet);
    for (let k = 0; k < 4; k++) { const u = (lt * 0.8 + k * 0.27) % 1; tear(c, 600 + k * 28, 600 + u * 62, 0.9, '#9fcdf5', (1 - u) * wet); }
    shadow(c, 1010, 632, 60, 0.12); who(c, 'whale', 'idle', t, 1010, 634, 2.5);
    c.restore(); motes(c, t, 22, '#fffbe6', 0.85, 3); leak(c, t, '#fff7e0', 0.5);
  }),

  // 小小的房间里你弹着吉他 —— 像一只小盒子
  sh(8.0, 12.08, ({ c, t, lt }) => {
    bg(c, ['#eaf3fd', '#fdf1f5']); dots(c, '#ffffff', 0.9, 28, 5, t * 5, 0);
    const z = lerp(0.52, 1, eOut(seg(lt, 0, 3.6)));
    c.save(); cam(c, z, 640, 360);
    c.fillStyle = 'rgba(80,110,160,.2)'; rr(c, 16, 26, W, H, 30); c.fill();
    c.save(); rr(c, 0, 0, W, H, 26); c.clip(); room(c, t);
    shadow(c, 900, 630, 70, 0.12); who(c, 'whale', 'sway', t, 900, 632, 3);
    youGuitar(c, t, 600, 648, 3.4, 0.5 + kick(t) * 0.5);
    risingNotes(c, lt, 600, 500, 6, ['#7fb4ee', '#f59ab5', '#b7a4ff']);
    c.restore(); c.strokeStyle = '#ffffff'; c.lineWidth = 12; rr(c, 0, 0, W, H, 26); c.stroke();
    c.restore(); leak(c, t, '#ffffff', 0.35);
  }, { fi: 0.25 }),

  // 抹着泪和我说的话
  sh(12.08, 15.33, ({ c, t, lt, p }) => {
    bg(c, ['#fffaf0', '#fde6cf']); glow(c, 160, 80, 620, '#ffffff', 0.95);
    c.save(); cam(c, 1.03 + p * 0.06, 620, 400);
    glow(c, 420, 420, 420, '#ffffff', 0.6); you(c, 'sad', lt, 420, 750, 6.4, {}, 5, false);
    for (let i = 0; i < 6; i++) { const u = (lt * 0.75 + i * 0.19) % 1; tear(c, 420 + (i % 2 ? 58 : -50) + Math.sin(i) * 8, 440 + u * u * 260, 1.7, '#8fd0ff', 1 - u); }
    shadow(c, 960, 746, 130, 0.1); whaleBig(c, t, 960, 750 + Math.sin(lt * 4) * 3 * seg(lt, 1.6, 2), 3.7);
    const k = eBack(seg(lt, 0.9, 1.5));
    if (k > 0.01) {
      c.save(); c.translate(690, 250); c.scale(k, k); c.fillStyle = '#ffffff'; c.shadowColor = 'rgba(120,160,220,.35)'; c.shadowBlur = 24; rr(c, -150, -70, 300, 140, 40); c.fill(); c.shadowBlur = 0;
      c.beginPath(); c.moveTo(-90, 62); c.lineTo(-140, 112); c.lineTo(-40, 66); c.fill();
      c.strokeStyle = rgba(P, 0.7); c.lineWidth = 4; c.lineCap = 'round';
      for (let j = 0; j < 3; j++) { const q = seg(lt, 1.4 + j * 0.45, 1.9 + j * 0.45); if (q <= 0) continue; c.beginPath(); for (let x = -100; x <= -100 + (j === 2 ? 130 : 200) * q; x += 8) { const y = -30 + j * 30 + Math.sin(x * 0.12 + j) * 4; if (x === -100) c.moveTo(x, y); else c.lineTo(x, y); } c.stroke(); }
      c.restore();
    }
    c.restore(); motes(c, t, 14, '#ffffff', 0.8, 5);
  }),

  // 「原来这个世界没有那么好」—— 纸上的地球贴着胶布
  sh(15.33, 17.67, ({ c, t, lt }) => {
    page(c, t); const gx = 830, gy = 350, r = 160 + Math.sin(lt * 3) * 2;
    cloud(c, gx - 10, gy - r - 30, 70, '#e6ebf4', 1, 2);
    c.strokeStyle = rgba(P, 0.6); c.lineWidth = 3; c.lineCap = 'round';
    for (let i = 0; i < 7; i++) { const u = (lt * 1.3 + i * 0.17) % 1, x = gx - 80 + i * 26; c.beginPath(); c.moveTo(x, gy - r - 10 + u * 40); c.lineTo(x - 4, gy - r + 6 + u * 40); c.stroke(); }
    globe(c, gx, gy, r, { sea: '#f4f7fc', land: '#dde4f0', line: P, rot: t * 0.03, shade: 0.1 });
    c.strokeStyle = rgba(P, 0.9); c.lineWidth = 4; c.beginPath(); c.arc(gx - 52, gy - 6, 5, 0, TAU); c.moveTo(gx + 57, gy - 6); c.arc(gx + 52, gy - 6, 5, 0, TAU); c.moveTo(gx - 26, gy + 52); c.quadraticCurveTo(gx, gy + 34, gx + 26, gy + 52); c.stroke();
    c.save(); c.translate(gx + 78, gy - 84); c.rotate(0.6); c.fillStyle = '#ffe3c2'; c.strokeStyle = rgba(P, 0.8); c.lineWidth = 2.5; rr(c, -40, -11, 80, 22, 8); c.fill(); c.stroke(); c.rotate(Math.PI / 2); rr(c, -40, -11, 80, 22, 8); c.fill(); c.stroke(); c.restore();
    // 一个被涂掉的太阳：没有那么好
    c.strokeStyle = rgba('#f0b24a', 0.9); c.lineWidth = 4; c.beginPath(); c.arc(330, 220, 44, 0, TAU); c.stroke();
    for (let i = 0; i < 8; i++) { const a = (i * TAU) / 8 + lt * 0.3; c.beginPath(); c.moveTo(330 + Math.cos(a) * 58, 220 + Math.sin(a) * 58); c.lineTo(330 + Math.cos(a) * 76, 220 + Math.sin(a) * 76); c.stroke(); }
    scribble(c, 330, 220, 170, 150, 3, rgba(P, 0.85), 4, 30, seg(lt, 0.9, 2.0));
    you(c, 'idle', t, 330, 650, 3.1);
    txt(c, '「', 190, 120, 84, rgba(P, 0.6), { font: HAND, w: 400 });
  }, { fi: 0.2 }),

  // 「遇见的人发生的事都有些糟糕」—— 路过的人头顶都是乱线
  sh(17.67, 19.92, ({ c, t, lt }) => {
    page(c, t); c.strokeStyle = rgba(P, 0.6); c.lineWidth = 3; c.beginPath(); c.moveTo(130, 622); c.lineTo(W, 622); c.stroke();
    const ps: [Who, number, number][] = [['claude', 1, 0.05], ['gemini', -1, 0.3], ['kimi', 1, 0.55], ['qwen', -1, 0.1], ['zai', 1, 0.8]];
    ps.forEach(([ch, dir, off], i) => {
      const u = (lt * 0.2 + off) % 1, x = dir > 0 ? -120 + u * 1520 : 1400 - u * 1520;
      spr(c, walkF(ch, t + i), x, 622 + (i % 2) * 8, 2.7, { sil: '#e1e5ee', line: '#8d9ab8', flip: dir < 0 });
      scribble(c, x, 340 + (i % 2) * 14, 70, 50, i * 7 + Math.floor(t * 6), rgba(P, 0.85), 2.5, 16);
    });
    for (let i = 0; i < 7; i++) { const y = (lt * 150 + i * 120) % 780 - 30, x = 200 + rnd(i, 3) * 950; c.save(); c.translate(x, y); c.rotate(i + lt); c.strokeStyle = rgba(P, 0.45); c.lineWidth = 4; c.lineCap = 'round'; c.beginPath(); c.moveTo(-10, -10); c.lineTo(10, 10); c.moveTo(10, -10); c.lineTo(-10, 10); c.stroke(); c.restore(); }
    glow(c, 640, 480, 230, '#ffffff', 0.9); you(c, 'sad', lt * 0.7, 640, 626, 3.2, {}, 6, false);
  }),

  // 「从小不合群胆子也小」—— 一圈人，和圈外越缩越小的她
  sh(19.92, 21.92, ({ c, t, lt }) => {
    page(c, t); c.save(); c.strokeStyle = rgba(P, 0.7); c.lineWidth = 3; c.setLineDash([12, 12]); c.lineDashOffset = -t * 20; c.beginPath(); c.ellipse(430, 470, 230, 190, 0, 0, TAU); c.stroke(); c.restore();
    const g: [Who, number, number][] = [['claude', 320, 560], ['gemini', 540, 560], ['qwen', 430, 480], ['doubao', 430, 610]];
    g.forEach(([ch, x, y], i) => who(c, ch, 'hop', t + i * 0.2, x, y, 2.3, { sil: '#e1e5ee', line: '#8d9ab8' }, 10));
    for (let i = 0; i < 4; i++) { const u = (lt * 0.7 + i * 0.25) % 1; heart(c, 330 + i * 70, 330 - u * 60, 20, 'none', Math.sin(u * Math.PI), rgba(P, 0.8)); }
    const s = lerp(2.9, 1.7, ss(seg(lt, 0.7, 1.9))), x = 990, y = 612;
    c.save(); c.strokeStyle = rgba(P, 0.6); c.lineWidth = 2.5; c.setLineDash([6, 8]); c.strokeRect(x - 46 * s, y - 96 * s, 92 * s, 100 * s); c.restore();
    you(c, 'shiver', t, x + Math.sin(t * 40) * 1.5, y, s, {}, 14);
    spr(c, 'fx_sweat', x + 30 * s, y - 80 * s, 3, { mid: true });
    c.strokeStyle = rgba(P, 0.6); c.lineWidth = 3; c.beginPath(); c.moveTo(1150, 612); c.lineTo(1150, 250); for (let i = 0; i < 8; i++) { c.moveTo(1150, 612 - i * 46); c.lineTo(1150 + (i % 2 ? 14 : 24), 612 - i * 46); } c.stroke();
  }),

  // 「学校里真心朋友也少」—— 教室里唯一一颗实心的心
  sh(21.92, 23.83, ({ c, t, lt }) => {
    page(c, t); c.strokeStyle = rgba(P, 0.75); c.lineWidth = 4; rr(c, 300, 60, 560, 130, 6); c.stroke(); scribble(c, 580, 125, 440, 70, 9, rgba(P, 0.3), 3, 16);
    const seats: [number, number, Who | null][] = [[300, 400, 'claude'], [500, 400, 'gemini'], [700, 400, null], [300, 620, null], [500, 620, 'kimi'], [700, 620, 'zai']];
    seats.forEach(([x, y, ch], i) => { if (ch) who(c, ch, i % 2 ? 'nod' : 'idle', t + i, x + (i % 2 ? -22 : 22), y - 14, 2.1, { sil: '#e1e5ee', line: '#8d9ab8', flip: i % 2 === 1 }); desk(c, x, y, 1.5, rgba(P, 0.8)); });
    for (const [x, y] of [[400, 250], [600, 470]]) heart(c, x, y + Math.sin(t * 3 + x) * 5, 26, 'none', 0.9, rgba(P, 0.7));
    glow(c, 1030, 500, 240, '#ffffff', 0.9); you(c, 'idle', t, 1030, 606, 2.4); desk(c, 1030, 620, 1.5, rgba(P, 0.8));
    const k = eBack(seg(lt, 0.7, 1.2)); heart(c, 1118, 420 + Math.sin(t * 2.5) * 5, 30 * k * (1 + kick(t) * 0.15), '#6fb6ff', 1);
  }),

  // 「多希望心里话能被人听到」—— 纸杯电话
  sh(23.83, 25.5, ({ c, t, lt }) => {
    pop(c, t, '#ffee6e', '#fff9c9'); const sy = (x: number) => 452 + Math.sin(x * 0.012 + t * 3) * 44 * seg(x, 470, 760) + Math.sin(x * 0.031 - t * 5) * 14 * seg(x, 470, 700);
    for (const [col, lw] of [[INK, 9], ['#ffffff', 3]] as [string, number][]) { c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.beginPath(); for (let x = 470; x <= 1300; x += 12) { if (x === 470) c.moveTo(x, sy(x)); else c.lineTo(x, sy(x)); } c.stroke(); }
    for (let i = 0; i < 5; i++) { const u = (lt * 0.8 + i * 0.2) % 1, x = 500 + u * 800; heart(c, x, sy(x) - 30, 26 + Math.sin(u * Math.PI) * 8, '#ff7fa0', Math.sin(u * Math.PI), INK); }
    you(c, 'idle', t, 320, 720, 5, { line: INK }); cup(c, 470, sy(470), 1.5, -Math.PI / 2);
  }, { fi: 0.12 }),

  // 「可没有人知道」—— 另一头的杯子倒在地上
  sh(25.5, 27.58, ({ c, t, lt }) => {
    const g = ss(seg(lt, 0.15, 1.5)); c.fillStyle = mix('#ffee6e', '#c5c8d2', g); c.fillRect(0, 0, W, H); dots(c, '#ffffff', 0.45, 26, 6.5, t * 10, t * 6);
    c.fillStyle = 'rgba(40,50,80,.12)'; c.fillRect(0, 610, W, 110);
    for (const [col, lw] of [[INK, 9], ['#ffffff', 3]] as [string, number][]) { c.strokeStyle = col; c.lineWidth = lw; c.lineCap = 'round'; c.beginPath(); c.moveTo(-20, 330); c.bezierCurveTo(260, 380 + g * 120, 420, 640, 700, 606); c.stroke(); }
    cup(c, 700, 606, 1.5, 1.95, mix('#7cc0ff', '#aab0c0', g));
    for (let i = 0; i < 5; i++) { const u = seg(lt, i * 0.22, i * 0.22 + 1.1); heart(c, 800 + i * 44 + u * 30, 600 - Math.sin(u * Math.PI) * 60 + u * 6, 22, mix('#ff7fa0', '#aab0c0', u), 1 - u * 0.75, INK); }
    c.save(); c.translate(1000, 600); c.strokeStyle = rgba(INK, 0.45); c.lineWidth = 4; c.setLineDash([10, 12]); c.lineDashOffset = t * 14; c.beginPath(); c.arc(0, -230, 56, 0, TAU); c.moveTo(-70, 0); c.quadraticCurveTo(-70, -160, 0, -160); c.quadraticCurveTo(70, -160, 70, 0); c.stroke(); c.restore();
    txt(c, '？', 1000, 370 - 0, 60, rgba(INK, 0.4 * g), { w: 800 });
    vignette(c, '#5a6070', 0.35 * g);
  }),

  // 不是这样 还有我 —— 她捡起另一头的杯子
  sh(27.58, 30.42, ({ c, t, lt }) => {
    bg(c, ['#ff4d86', '#c4114f', '#6d0733'], 0, 0, W, H);
    c.save(); c.translate(860, 330); for (let k = 0; k < 5; k++) { c.rotate(t * (0.3 + k * 0.12) * (k % 2 ? 1 : -1)); c.strokeStyle = `rgba(255,255,255,${0.09 + 0.025 * k})`; c.lineWidth = 30; c.setLineDash([130 + k * 40, 70]); c.beginPath(); c.arc(0, 0, 150 + k * 100, 0, TAU); c.stroke(); } c.restore();
    dots(c, '#000000', 0.1, 22, 5, -t * 14, 0);
    const e = eBack(seg(lt, 0, 0.45)), pt = lt > 1.3; let x = lerp(1560, 820, e); if (!pt) x += Math.sin(lt * 24) * 16 * seg(lt, 0.4, 0.6);
    for (let i = 0; i < 14; i++) { const y = rnd(i, 1) * H, u = (t * 2.2 + rnd(i, 2)) % 1; c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(W - u * 1700, y, 220, 3); }
    const cy = lerp(800, 400, eOut(seg(lt, 1.15, 1.6)));
    c.strokeStyle = '#ffffff'; c.lineWidth = 4; c.beginPath(); c.moveTo(x - 300, cy); c.quadraticCurveTo(300, cy + Math.sin(t * 20) * 8 * seg(lt, 1.6, 1.8), -20, 400); c.stroke();
    whaleBig(c, t, x, 760, 4.3, pt ? 'point' : 'idle', { flip: true }); cup(c, x - 300, cy, 1.6, Math.PI / 2, '#ffd27a', '#ffffff');
    if (pt) { wash(c, '#ffffff', (1 - seg(lt, 1.3, 1.7)) * 0.7); for (let i = 0; i < 6; i++) star4(c, x - 240 + rnd(i, 5) * 480, 160 + rnd(i, 6) * 300, 26 * (1 - seg(lt, 1.3, 2.6)) + 6, '#ffffff', 0.9, t + i); }
  }, { fi: 0.15, fc: '#ffffff' }),

  // 我随时都愿意为了你唱 —— 歌顺着线过去，颜色回来了
  sh(30.42, 33.83, ({ c, t, lt }) => {
    bg(c, ['#ff4d86', '#c4114f'], 0, 0, W, H); wash(c, '#ffd0e0', ss(seg(lt, 0.2, 1.8))); wash(c, '#ffffff', ss(seg(lt, 1.6, 3.2)) * 0.82);
    dots(c, '#ffffff', 0.5, 26, 6, t * 10, 0);
    for (let k = 0; k < 4; k++) { const u = (lt * 0.7 + k / 4) % 1; c.strokeStyle = rgba('#ffffff', (1 - u) * 0.9); c.lineWidth = 5; c.beginPath(); c.arc(900, 440, 40 + u * 460, 0, TAU); c.stroke(); }
    const sy = (x: number) => 440 + Math.sin(x * 0.04 - t * 9) * 9 * Math.sin(seg(x, 412, 868) * Math.PI);
    c.strokeStyle = '#ffffff'; c.lineWidth = 7; c.beginPath(); for (let x = 412; x <= 868; x += 8) { if (x === 412) c.moveTo(x, sy(x)); else c.lineTo(x, sy(x)); } c.stroke();
    c.strokeStyle = '#ff7fa0'; c.lineWidth = 2.5; c.stroke();
    for (let i = 0; i < 6; i++) { const u = (lt * 0.5 + i / 6) % 1, x = lerp(850, 430, u); note(c, x, sy(x) - 26 - Math.sin(u * Math.PI) * 46, 1.3, PASTEL[i % 5], Math.sin(u * Math.PI), i); }
    shadow(c, 950, 652, 80, 0.12); who(c, 'whale', 'wave', t, 950, 654, 3.6); cup(c, 868, 440, 1.2, Math.PI / 2, '#ffd27a');
    const nm = fr('whale', 'idle', t); you(c, 'idle', t, 330, 654, 3.6); rainInside(c, nm, 330, 654, 3.6, t, 1 - ss(seg(lt, 0.6, 2.6))); cup(c, 412, 440, 1.2, -Math.PI / 2);
  }, { fo: 0.3 }),

  // 我想要 我想要你知道
  sh(33.83, 36.5, ({ c, t, lt, p }) => {
    bg(c, ['#ffffff', '#eef8ff', '#d6eeff']); rays(c, 860, 320, 18, t * 0.1, '#ffffff', 0.65);
    const fy = staff(c, t, 300, 70, '#9fd2ff', 0.9, { gap: 16, lw: 2.5 });
    for (let i = 0; i < 9; i++) { const x = (((i * 160 - t * 120) % 1440) + 1440) % 1440 - 80; note(c, x, fy(x) + ((i % 5) - 2) * 16, 1.35, PASTEL[i % 5], 0.95, i); }
    c.save(); cam(c, 1.02 + p * 0.05, 640, 420);
    glow(c, 250, 430, 400, '#ffffff', 0.75); you(c, 'idle', t, 250, 770, 6, {});
    if (lt > 1.45) spr(c, 'fx_exclaim', 360, 260 - eBack(seg(lt, 1.45, 1.8)) * 20, 6, { mid: true });
    shadow(c, 880, 752, 140, 0.08); whaleBig(c, t, lerp(980, 860, eOut(seg(lt, 0, 1.3))), 760, 4.5, 'point', { flip: true });
    c.restore(); motes(c, t, 26, '#ffffff', 0.9, 7, 30); leak(c, t, '#ffffff', 0.6, 1);
  }, { fi: 0.45 }),

  // 就算最荒唐的想法 —— 长翅膀的饭盆、倒着走的钟、会飞的鱼
  sh(36.5, 38.58, ({ c, t, lt }) => {
    pop(c, t, '#ece2ff', '#ffffff'); glow(c, 760, 300, 600, '#ffffff', 0.7);
    for (const [x, y, r] of [[330, 470, 16], [390, 420, 24], [460, 370, 34]]) { c.fillStyle = '#ffffff'; c.beginPath(); c.arc(x, y - Math.sin(t * 3 + x) * 4, r * eBack(seg(lt, 0, 0.4)), 0, TAU); c.fill(); }
    cloud(c, 800, 400, 300 * eBack(seg(lt, 0.05, 0.55)), '#ffffff', 0.97, 2);
    const it = (i: number) => eBack(seg(lt, 0.25 + i * 0.22, 0.6 + i * 0.22));
    let k = it(0); if (k > 0) { const x = 610 + Math.sin(t * 2) * 30, y = 270 + Math.cos(t * 3) * 16; wings(c, x, y - 24, 1.5 * k, Math.sin(t * 16)); spr(c, 'prop_bowl', x, y, 6 * k); }
    k = it(1); if (k > 0) spr(c, 'prop_catclock', 930 + Math.cos(t * 2.4) * 50, 250 + Math.sin(t * 2.4) * 40, 4.2 * k, { rot: Math.PI + t * 1.5, mid: true });
    k = it(2); if (k > 0) spr(c, 'prop_redshoes', 640 + lt * 70, 150 + Math.abs(Math.sin(t * 9)) * 8, 3.6 * k, { rot: Math.PI, mid: true });
    k = it(3); if (k > 0) { const fx = 840, fyy = 380 + Math.sin(t * 2.6) * 12; c.strokeStyle = rgba(INK, 0.5); c.lineWidth = 2; c.beginPath(); c.moveTo(fx + 10, fyy - 40); c.lineTo(fx + 40, fyy - 130); c.stroke(); c.fillStyle = '#ff9cb8'; c.beginPath(); c.ellipse(fx + 42, fyy - 166, 30 * k, 38 * k, 0, 0, TAU); c.fill(); fish(c, fx, fyy, 190 * k, { rot: -0.12 }); }
    you(c, 'idle', t, 240, 700, 3.2); spr(c, 'fx_bulb', 240, 380 + Math.sin(t * 5) * 4, 5, { mid: true });
  }, { fi: 0.12 }),

  // 最肆无忌惮的乐章 —— 五线谱自己疯起来
  sh(38.58, 41.83, ({ c, t, lt }) => {
    bg(c, ['#fffbe0', '#ffe6f0']); rays(c, 640, 430, 20, t * 0.25, '#ffffff', 0.7); rays(c, 640, 430, 20, -t * 0.18 + 0.3, '#ffc9dc', 0.22);
    c.save(); cam(c, 1 + kick(t) * 0.025, 640, 400);
    ([['#ff9cb8', 170, 90, 0], ['#8fc8ff', 330, 120, 2], ['#b7a4ff', 540, 80, 4]] as [string, number, number, number][]).forEach(([col, y0, amp, ph], j) => {
      const fy = staff(c, t * 1.6, y0, amp, col, 0.95, { wild: 1, gap: 12, lw: 2.5, ph });
      for (let i = 0; i < 7; i++) { const x = (((i * 200 + t * (220 + j * 60) * (j % 2 ? -1 : 1)) % 1480) + 1480) % 1480 - 100; note(c, x, fy(x) + ((i % 5) - 2) * 12, 1.3 + kick(t) * 0.4, PASTEL[(i + j) % 5], 1, i, Math.sin(t * 6 + i) * 0.4); }
    });
    glow(c, 680, 520, 330, '#ffffff', 0.8);
    shadow(c, 820, 668, 80, 0.1); who(c, 'whale', 'hop', t, 820, 670, 3.6, {}, 10);
    youGuitar(c, t, 560, 670, 3.6, 1, 'hop', 10);
    for (let i = 0; i < 8; i++) star4(c, 300 + rnd(i, 1) * 700, 380 + rnd(i, 2) * 260, 12 + kick(t) * 16, '#ffffff', 0.9, t * 2 + i);
    c.restore(); wash(c, '#ffffff', (1 - seg(lt, 0, 0.25)) * 0.6);
  }),

  // 我也会陪你疯陪你唱 —— 千问转圈，豆包踩拍，猫跟着晃
  sh(41.83, 45.0, ({ c, t, lt }) => {
    pop(c, t, '#ffd0de', '#ffe9f0'); c.fillStyle = '#ffb3ca'; c.fillRect(0, 610, W, 110); c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(0, 610, W, 6);
    for (let i = 0; i < 3; i++) { const x = 240 + i * 400, a = Math.sin(t * 1.4 + i * 2) * 0.25; c.save(); c.translate(x, -40); c.rotate(a); const g = c.createLinearGradient(0, 0, 0, 760); g.addColorStop(0, 'rgba(255,255,255,.6)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(-20, 0); c.lineTo(20, 0); c.lineTo(190, 780); c.lineTo(-190, 780); c.closePath(); c.fill(); c.restore(); }
    const b = kick(t) * 12, inn = (i: number) => eBack(seg(lt, i * 0.08, 0.4 + i * 0.08));
    shadow(c, 180, 652, 50, 0.1); who(c, 'qwen', 'spin', t, 180, 720 - 70 * inn(0) - b, 3.3, {}, 12);
    shadow(c, 390, 652, 46, 0.1); who(c, 'doubao', 'step', t, 390, 720 - 70 * inn(1) - b * 0.5, 3.3, {}, 10);
    youGuitar(c, t, 610, 720 - 66 * inn(2) - b, 3.4, 1, 'hop', 10);
    shadow(c, 840, 652, 70, 0.1); who(c, 'whale', 'spin', t, 840, 720 - 68 * inn(3) - b, 3.4, {}, 12);
    shadow(c, 1070, 652, 70, 0.1); who(c, 'gemini', 'sway', t, 1070, 720 - 70 * inn(4) - b * 0.6, 3.2, {}, 10);
    risingNotes(c, lt + 1, 500, 330, 7, PASTEL, 60, 260); confetti(c, t, 60);
    for (let i = 0; i < 4; i++) { const u = (lt * 0.6 + i * 0.25) % 1; spr(c, 'fx_heart', 200 + i * 290, 330 - u * 90, 4, { a: Math.sin(u * Math.PI), mid: true }); }
  }, { fi: 0.15 }),

  // 直到有一天你在生命里闪闪发亮 —— 日历一页页飞走，路边的芽开了花
  sh(45.0, 49.5, ({ c, t, lt, p }) => {
    bg(c, [mix('#dfeeff', '#fff0c2', p), mix('#f8fbff', '#fffaf0', p)]);
    glow(c, 640, 450, 160 + p * 520, '#fff3bd', 0.35 + p * 0.6);
    if (p > 0.45) rays(c, 640, 450, 16, t * 0.15, '#ffffff', seg(p, 0.45, 1) * 0.6);
    for (let i = 0; i < 8; i++) { const x = W + 120 - ((lt * 300 + i * 240) % 1800), y = 150 + rnd(i, 1) * 190 + Math.sin(t * 2 + i) * 16; calPage(c, x, y, 1.15, Math.sin(t * 2.2 + i) * 0.4, PASTEL[i % 5], 0.95); }
    c.fillStyle = mix('#cfe6c8', '#f3e2a6', p); c.fillRect(0, 618, W, 102); c.fillStyle = 'rgba(255,255,255,.6)'; c.fillRect(0, 618, W, 5);
    for (let i = 0; i < 15; i++) { const x = (((i * 104 - lt * 150) % 1560) + 1560) % 1560 - 140; sprout(c, x, 622, clamp((700 - x) / 330), '#7fcf8a', PASTEL[i % 3]); }
    const q = Math.round(p * 6) / 6;
    you(c, 'walk', t, 640, 624, 3.5, { sil: mix('#ffffff', '#fffbe0', q), line: mix('#9cc6f2', '#f2c35a', q) }, 10);
    for (let i = 0; i < Math.floor(p * 30); i++) { const a = rnd(i, 3) * TAU + t * 0.3, r = 90 + rnd(i, 4) * 230; star4(c, 640 + Math.cos(a) * r, 470 + Math.sin(a) * r * 0.75, 8 + rnd(i, 5) * 20, '#ffffff', Math.abs(Math.sin(t * 3 + i * 1.3)), t + i); }
    spr(c, 'prop_hourglass', 150, 610, 5, { rot: Math.sin(t) * 0.08 });
    wash(c, '#ffffff', seg(lt, 4.1, 4.5) * 0.6);
  }, { fi: 0.15 }),

  // 我愿成为照亮你的
  sh(49.5, 52.33, ({ c, t, lt }) => {
    bg(c, ['#35478f', '#7672c4', '#d7b0e2']); stars(c, t, 60, 2, 0.7);
    c.fillStyle = 'rgba(40,40,110,.45)'; c.fillRect(0, 622, W, 98);
    const lit = ss(seg(lt, 0.5, 2.0)), reach = lerp(900, 180, lit);
    c.save(); c.beginPath(); c.rect(reach, 0, 900 - reach, H); c.clip();
    const g = c.createLinearGradient(900, 0, 200, 0); g.addColorStop(0, 'rgba(255,246,200,.85)'); g.addColorStop(1, 'rgba(255,246,200,.12)');
    c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.beginPath(); c.moveTo(890, 498); c.lineTo(890, 526); c.lineTo(160, 720); c.lineTo(160, 300); c.closePath(); c.fill(); c.restore();
    you(c, 'idle', t, 350, 626, 3.3, { sil: '#aeb5e2', line: '#8088c8' }); you(c, 'idle', t, 350, 626, 3.3, { a: lit });
    glow(c, 350, 480, 260 * lit, '#fff6c8', 0.5 * lit, 'lighter');
    shadow(c, 950, 626, 70, 0.2); who(c, 'whale', 'point', lt, 950, 628, 3.3, { flip: true }, 8, false);
    glow(c, 890, 512, 70 + kick(t) * 26, '#fff6c8', 0.95, 'lighter'); star4(c, 890, 512, 34 + kick(t) * 14, '#ffffff', 1, t);
    motes(c, t, 18, '#fff6c8', 0.7 * lit, 4, 20, 'lighter');
  }, { fi: 0.2 }),

  // 第一束光
  sh(52.33, 54.92, ({ c, t, lt }) => {
    bg(c, ['#070c2a', '#1a2864']); stars(c, t, 80, 5, 0.8);
    const w = lerp(4, 210, eOut(seg(lt, 0.1, 1.5)));
    c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(1, 'rgba(210,235,255,.55)');
    c.fillStyle = g; c.beginPath(); c.moveTo(330 - w * 0.4, -10); c.lineTo(330 + w * 0.4, -10); c.lineTo(640 + w * 1.4, H); c.lineTo(640 - w * 1.4, H); c.closePath(); c.fill(); c.restore();
    glow(c, 640, 640, 60 + w * 2, '#ffffff', 0.5, 'lighter'); glow(c, 330, 0, 200 + w, '#ffffff', 0.7, 'lighter');
    who(c, 'whale', 'idle', t, 1090, 646, 2.5, { tint: '#070c2a', ta: 0.65 - seg(lt, 0.4, 1.6) * 0.45 });
    you(c, 'surprise', lt - 0.3, 640, 640, 3.7, {}, 8, false);
    for (let i = 0; i < 26; i++) { const u = (t * 0.25 + rnd(i, 1)) % 1; glow(c, lerp(330, 640, 1 - u) + (rnd(i, 2) - 0.5) * w * 1.8, H * (1 - u), 5 + rnd(i, 3) * 8, '#ffffff', 0.8 * seg(lt, 0.3, 1), 'lighter'); }
    wash(c, '#ffffff', ss(seg(lt, 1.5, 2.5)));
  }),

  // 间奏一（上）歌传出去了：台下是大家
  sh(54.92, 62.4, ({ c, t, lt }) => {
    bg(c, ['#dcefff', '#fff4fb']); dots(c, '#ffffff', 0.8, 28, 6, t * 8, 0); rays(c, 640, 380, 16, t * 0.08, '#ffffff', 0.45);
    const b = beatPos(t) - beatPos(54.92);
    for (let i = 0; i < 10; i++) {
      const k = eBack(seg(b, i * 1.2 + 1, i * 1.2 + 1.7)), x = i % 2 ? 150 + rnd(i, 1) * 170 : 960 + rnd(i, 1) * 170, y = 110 + (i >> 1) * 92 + Math.sin(t * 1.6 + i) * 8;
      box(c, x, y, 124, 78, PASTEL[i % 5], i % 3 === 0 ? 'note' : 'heart', 1, k, (rnd(i, 2) - 0.5) * 0.2);
    }
    for (let k = 0; k < 3; k++) { const u = (lt * 0.6 + k / 3) % 1; c.strokeStyle = rgba('#8fc8ff', (1 - u) * 0.7); c.lineWidth = 4; c.beginPath(); c.arc(640, 420, 60 + u * 380, 0, TAU); c.stroke(); }
    youGuitar(c, t, 470, 612, 3, 0.8);
    c.fillStyle = '#f3c58f'; rr(c, 530, 566, 220, 80, 8); c.fill(); c.fillStyle = 'rgba(150,100,50,.25)'; c.fillRect(530, 600, 220, 5); c.fillRect(636, 566, 5, 80);
    who(c, 'whale', lt % 4 < 2 ? 'wave' : 'sway', t, 640, 568 - kick(t) * 6, 3.4);
    risingNotes(c, lt, 600, 380, 6, PASTEL, 50, 240);
    const au: [Who, number, string][] = [['claude', 130, 'hop'], ['kimi', 300, 'nod'], ['qwen', 440, 'sway'], ['doubao', 850, 'step'], ['zai', 1000, 'hop'], ['gemini', 1160, 'sway']];
    au.forEach(([ch, x, act], i) => { who(c, ch, act, t + i * 0.3, x, 772 - kick(t + i * 0.1) * 8, 2.8, {}, 10); const u = (lt * 0.5 + i * 0.17) % 1; spr(c, 'fx_heart', x + 30, 520 - u * 80, 3.5, { a: Math.sin(u * Math.PI) * seg(lt, 1, 2), mid: true }); });
    leak(c, t, '#ffffff', 0.4);
  }, { fi: 0.9 }),

  // 间奏一（下）评论一格一格变红，龙影从上方掠过
  sh(62.4, 69.83, ({ c, t, lt }) => {
    const q = ss(seg(lt, 0.4, 6.4));
    bg(c, ['#dcefff', '#fff4fb']); dots(c, '#ffffff', 0.8 * (1 - q), 28, 6, t * 8, 0); wash(c, '#52000f', q * 0.94);
    for (let i = 0; i < 22; i++) {
      const old = i < 10, born = old ? 0 : 2.6 + (i - 10) * 0.33; if (lt < born) continue;
      const x = old ? (i % 2 ? 150 + rnd(i, 1) * 170 : 960 + rnd(i, 1) * 170) : 120 + rnd(i, 7) * 1040, y = old ? 110 + (i >> 1) * 92 : 70 + rnd(i, 8) * 420;
      const red = lt > 0.5 + i * 0.5 || !old, sk = red ? Math.sin(t * 30 + i) * 3 * (1 - seg(lt, born + 0.5 + (old ? i * 0.5 : 0), born + 1.2 + (old ? i * 0.5 : 0))) : 0;
      box(c, x + sk, y + Math.sin(t * 1.6 + i) * 8, 124, 78, red ? '#e0102e' : PASTEL[i % 5], red ? (['x', 'dots', 'ban'] as const)[i % 3] : (i % 3 === 0 ? 'note' : 'heart'), 1, old ? 1 : eBack(seg(lt, born, born + 0.3)), (rnd(i, 2) - 0.5) * 0.2);
    }
    const dx = lerp(1650, -400, seg(lt, 2.6, 6.4));
    c.fillStyle = `rgba(20,0,5,${0.3 * Math.sin(seg(lt, 2.6, 6.4) * Math.PI)})`; c.fillRect(0, 0, W, H);
    spr(c, `gpt_fly_${Math.floor(t * 6) % 2}`, dx, 420, 9, { sil: '#14000a', a: 0.6, flip: true });
    you(c, lt < 2.4 ? 'idle' : 'surprise', lt < 2.4 ? t : lt - 2.4, 470, 612, 3, {}, 8, lt < 2.4);
    c.fillStyle = mix('#f3c58f', '#5a1420', q); rr(c, 530, 566, 220, 80, 8); c.fill();
    if (lt < 2.2) who(c, 'whale', 'wave', t, 640, 568, 3.4); else if (lt < 3.4) who(c, 'whale', 'surprise', lt - 2.2, 640, 568, 3.4, {}, 8, false); else who(c, 'whale', 'shiver', t, 640 + Math.sin(t * 40), 568, 3.4, {}, 14);
    const au: [Who, number][] = [['claude', 130], ['kimi', 300], ['qwen', 440], ['doubao', 850], ['zai', 1000], ['gemini', 1160]];
    au.forEach(([ch, x], i) => { const go = seg(lt, 1.6 + i * 0.6, 4.2 + i * 0.6), dir = x < 640 ? -1 : 1; if (go <= 0) who(c, ch, 'idle', t, x, 772, 2.8); else spr(c, walkF(ch, t), x + dir * go * 520, 772, 2.8, { tint: '#2a0008', ta: clamp(go * 3) * 0.85, flip: dir < 0 }); });
    // 像素块从四边蚕食
    const cs = 40; for (let gx = 0; gx < W / cs; gx++) for (let gy = 0; gy < H / cs; gy++) {
      const edge = Math.min(gx, W / cs - 1 - gx, gy, H / cs - 1 - gy) / 9, th = seg(lt, 2.5, 7.3) * 1.5 - edge - rnd(gx * 31 + gy, 9) * 0.35;
      if (th > 0) { c.fillStyle = rnd(gx * 17 + gy, 4) > 0.3 ? '#3a0008' : '#b00a22'; c.globalAlpha = clamp(th * 4); c.fillRect(gx * cs, gy * cs, cs, cs); }
    }
    c.globalAlpha = 1; vignette(c, '#000000', 0.5 * q);
  }),
];
