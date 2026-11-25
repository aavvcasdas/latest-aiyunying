// 第三幕 2:40–3:46 拼贴 / 离开这个次元 / 更好的自己 / 万分之一的光 / 烟花 / 回到房间
import { F, Shot, C, W, H, TAU, BEAT, BEAT0, bg, wash, glow, cam, rnd, seg, ss, eOut, eIn, eBack, lerp, clamp, rgba, mix, kick, motes, leak, rays, dots, cloud, stars, note, heart, tear, star4, rr, txt, HAND, scribble, staff, vignette, firework, mk } from './kit';
import { spr, who, you, fr, shadow, whaleBig, rainInside, tachie, Who, HUE } from './cast';
import { windowView, room, guitar, paper, cup, globe, calPage, card, handwrite } from './props';

const sh = (s: number, e: number, draw: (f: F) => void, o: Partial<Shot> = {}): Shot => ({ s, e, draw, ...o });
const PASTEL = ['#ff9cb8', '#8fc8ff', '#b7a4ff', '#ffd27a', '#9be0b8'];

function collage(c: C, t: number) {
  bg(c, ['#ffffff', '#f1f8ff']); dots(c, '#c3d2e8', 0.75, 30, 3.2, 0, 0);
  for (let j = 0; j < 2; j++) { c.strokeStyle = j ? 'rgba(255,190,214,.45)' : 'rgba(150,215,255,.55)'; c.lineWidth = 70 - j * 30; c.lineCap = 'round'; c.beginPath(); for (let x = -60; x <= W + 60; x += 40) { const y = 200 + j * 330 + Math.sin(x * 0.005 + t * 0.4 + j * 2.4) * 130; if (x === -60) c.moveTo(x, y); else c.lineTo(x, y); } c.stroke(); }
  for (let i = 0; i < 7; i++) { c.save(); c.translate(rnd(i, 1) * W, rnd(i, 2) * H); c.rotate(t * 0.2 + i); c.fillStyle = rgba(PASTEL[i % 5], 0.5); c.beginPath(); c.moveTo(0, -16); c.lineTo(14, 10); c.lineTo(-14, 10); c.closePath(); c.fill(); c.restore(); }
}
/** 记忆卡片里的小场景 */
function memCard(c: C, t: number, i: number, x: number, y: number, w: number, rot: number, a = 1) {
  card(c, x, y, w, w * 0.72, rot, (cw, ch) => {
    const s = ch / 125;
    if (i === 0) { c.fillStyle = '#fdeed6'; c.fillRect(0, 0, cw, ch); c.fillStyle = '#8fcbff'; c.fillRect(cw * 0.08, ch * 0.12, cw * 0.3, ch * 0.42); c.fillStyle = '#e2b07c'; c.fillRect(0, ch * 0.8, cw, ch * 0.2); you(c, 'idle', t, cw * 0.58, ch * 0.94, s); guitar(c, cw * 0.6, ch * 0.7, s * 0.3, -0.42, t, 0.5); }
    else if (i === 1) { c.fillStyle = '#ffd0de'; c.fillRect(0, 0, cw, ch); who(c, 'whale', 'hop', t, cw * 0.66, ch * 0.96, s, {}, 10); you(c, 'hop', t + 0.2, cw * 0.34, ch * 0.96, s, {}, 10); note(c, cw * 0.5, ch * 0.3, s, '#ffffff', 1, 1); }
    else if (i === 2) { c.fillStyle = '#7cc8ff'; c.fillRect(0, 0, cw, ch); cloud(c, cw * 0.3, ch * 0.4, 30 * s, '#ffffff', 0.9, 1); who(c, 'whale', 'idle', t, cw * 0.62, ch * 0.96, s); you(c, 'idle', t, cw * 0.38, ch * 0.96, s); }
    else if (i === 3) { c.fillStyle = '#fff27a'; c.fillRect(0, 0, cw, ch); cup(c, cw * 0.3, ch * 0.75, s * 0.8, -0.3); cup(c, cw * 0.72, ch * 0.75, s * 0.8, 0.3, '#ffd27a'); c.strokeStyle = '#2b2f45'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(cw * 0.3, ch * 0.75); c.quadraticCurveTo(cw * 0.5, ch * 1.0, cw * 0.72, ch * 0.75); c.stroke(); heart(c, cw * 0.5, ch * 0.3, 22 * s, '#ff7fa0'); }
    else { c.fillStyle = '#bfe4ff'; c.fillRect(0, 0, cw, ch); c.fillStyle = 'rgba(255,255,255,.4)'; for (let gx = 0; gx < cw; gx += 14) for (let gy = (Math.round(gx / 14) % 2) * 7; gy < ch; gy += 14) c.fillRect(gx, gy, 6, 6); who(c, 'whale', 'wave', t, cw / 2, ch * 0.98, s * 1.1); }
  }, { a, pixel: i === 4 });
}
function night(c: C, t: number, n = 140) { bg(c, ['#050a26', '#0f2060', '#2a55a8']); stars(c, t, n, 1); }
function fw(c: C, t: number, from: number) {
  const n0 = Math.ceil((from - BEAT0) / BEAT), n1 = Math.floor((t - BEAT0) / BEAT);
  for (let n = Math.max(n0, n1 - 5); n <= n1; n++) { const tk = BEAT0 + n * BEAT; firework(c, 130 + rnd(n, 1) * 1020, 100 + rnd(n, 2) * 250, t - tk, n, PASTEL[n % 5], 140 + rnd(n, 3) * 120); if (n % 2 === 0) firework(c, 130 + rnd(n, 4) * 1020, 120 + rnd(n, 5) * 220, t - tk - BEAT * 0.5, n + 99, PASTEL[(n + 2) % 5], 110 + rnd(n, 6) * 80, 34); }
}
let gridCv: HTMLCanvasElement | null = null;
/** 一万个光点：一百乘一百 */
function grid() {
  if (!gridCv) {
    gridCv = mk(1000, 1000); const g = gridCv.getContext('2d')!;
    for (let i = 0; i < 100; i++) for (let j = 0; j < 100; j++) { const d = Math.hypot(i - 49.5, j - 49.5) / 50, a = clamp((1.04 - d) * 1.6) * (0.5 + 0.5 * rnd(i * 100 + j, 3)); if (a <= 0.02) continue; g.fillStyle = `rgba(255,${Math.round(246 - d * 40)},${Math.round(214 - d * 20)},${a})`; g.beginPath(); g.arc(i * 10 + 5, j * 10 + 5, 2.7, 0, TAU); g.fill(); }
  }
  return gridCv;
}
const TX = 140 + 72 * 10 + 5, TY = -140 + 61 * 10 + 5;
const NEIGH: [Who, number, number][] = [['claude', -3, -1], ['gemini', 2, -2], ['kimi', 3, 1], ['qwen', -2, 2], ['zai', 1, 2], ['doubao', -1, -2], ['gpt', 4, -1]];
const LINE: [Who, number, string][] = [['claude', 140, 'hop'], ['doubao', 290, 'step'], ['gemini', 430, 'sway'], ['kimi', 850, 'hop'], ['qwen', 980, 'spin'], ['zai', 1120, 'hop']];

export const shotsC: Shot[] = [
  // 如果说有一天你突然发现
  sh(159.67, 161.75, ({ c, t, lt }) => {
    collage(c, t);
    [[0, 760, 210, 300, -0.08], [1, 1080, 330, 280, 0.07], [3, 830, 520, 260, 0.05], [2, 1180, 600, 250, -0.1]].forEach(([i, x, y, w, r], k) => memCard(c, t, i, x - lt * 50 + (1 - eOut(seg(lt, k * 0.1, 0.5 + k * 0.1))) * 700, y, w, r));
    calPage(c, 520, 150 + Math.sin(t * 2) * 10, 1.4, Math.sin(t * 1.4) * 0.3, '#7cc0ff');
    glow(c, 330, 520, 300, '#ffffff', 0.8);
    if (lt < 0.9) you(c, 'walk', t, 330, 700, 3.7, {}, 10); else { you(c, 'surprise', lt - 0.9, 330, 700, 3.7, {}, 9, false); spr(c, 'fx_exclaim', 430, 350, 6, { mid: true }); }
  }, { fi: 0.5 }),

  // 早已离开这个次元越来越远 —— 像素里的她退到很远的地方
  sh(161.75, 164.33, ({ c, t, p }) => {
    collage(c, t); const vx = 930, vy = 290;
    c.strokeStyle = 'rgba(120,190,255,.3)'; c.lineWidth = 2; for (let i = 0; i < 18; i++) { const a = (i / 18) * TAU; c.beginPath(); c.moveTo(vx, vy); c.lineTo(vx + Math.cos(a) * 1600, vy + Math.sin(a) * 1600); c.stroke(); }
    for (let k = 0; k < 6; k++) { const u = (k / 6 + t * 0.15) % 1, s = u * u; c.strokeStyle = `rgba(120,190,255,${0.35 * (1 - u)})`; c.strokeRect(vx - 900 * s, vy - 520 * s, 1800 * s, 1040 * s); }
    const k = lerp(1, 0.14, ss(p));
    for (let e = 3; e >= 1; e--) { const ke = Math.min(1, k + e * 0.12 * (1 - p)); memCard(c, t, 4, lerp(790, vx, 1 - ke), lerp(380, vy, 1 - ke), 460 * ke, 0, 0.12); }
    memCard(c, t, 4, lerp(790, vx, 1 - k), lerp(380, vy, 1 - k), 460 * k, Math.sin(t) * 0.03);
    for (let i = 0; i < 16; i++) { const y = i * 46, w = 20 + rnd(i, Math.floor(t * 8)) * 60; c.fillStyle = rgba(i % 2 ? '#9fd2ff' : '#ffffff', 0.8); c.fillRect(520 - w / 2 + Math.sin(i + t * 3) * 10, y, w, 46); }
    const br = seg(p, 0.7, 0.85);
    c.save(); c.strokeStyle = rgba('#7fb4ee', 0.9 * (1 - br)); c.lineWidth = 3; c.setLineDash([8, 10 + p * 40]); c.beginPath(); c.moveTo(380, 430); c.lineTo(lerp(790, vx, 1 - k) - 200 * k, lerp(380, vy, 1 - k)); c.stroke(); c.restore();
    glow(c, 290, 500, 320, '#ffffff', 0.8); you(c, 'idle', t, 290, 710, 4.1);
  }),

  // 也许一切都不知不觉 —— 沙漏在漏，她没有回头
  sh(164.33, 166.25, ({ c, t, lt, p }) => {
    collage(c, t); memCard(c, t, 4, 1130, 130, 110, 0.05, 0.6);
    for (let i = 0; i < 5; i++) calPage(c, 180 + i * 240 + Math.sin(t + i) * 30, ((lt * 90 + i * 170) % 860) - 70, 1.1, Math.sin(t * 1.3 + i) * 0.5, PASTEL[i % 5], 0.8);
    glow(c, 640, 330, 300, '#ffffff', 0.9); spr(c, 'prop_hourglass', 640, 500, 12);
    for (let i = 0; i < 12; i++) { const u = (t * 1.4 + i / 12) % 1; c.fillStyle = rgba('#f2c35a', 1 - u); c.fillRect(636 + (rnd(i, 1) - 0.5) * 8, 350 + u * 110, 4, 4); }
    spr(c, 'prop_catclock', 960, 330, 6, { rot: Math.sin(t * 4) * 0.12, mid: true });
    you(c, 'walk', t, lerp(170, 470, p), 704, 2.7, {}, 10);
  }),

  // 也许来不及一句道别 —— 话没说完，门就合上了
  sh(166.25, 167.83, ({ c, t, lt, p }) => {
    collage(c, t); memCard(c, t, 4, 720, 350, 480, 0);
    const k = eBack(seg(lt, 0.1, 0.35)) * (1 - seg(lt, 0.95, 1.1));
    if (k > 0.02) { c.save(); c.translate(1000, 150); c.scale(k, k); c.fillStyle = '#ffffff'; c.shadowColor = 'rgba(80,120,180,.3)'; c.shadowBlur = 16; rr(c, -90, -50, 180, 100, 30); c.fill(); c.restore(); txt(c, '再……', 1000, 150, 40 * k, '#5a80c0', { w: 800 }); }
    const sw = eOut(seg(lt, 0.45, 1.15)) * 246;
    for (const d of [-1, 1]) { c.fillStyle = '#ffffff'; c.shadowColor = 'rgba(60,100,160,.25)'; c.shadowBlur = 20; c.fillRect(d < 0 ? 720 - 246 : 720 + 246 - sw, 170, sw, 360); c.shadowBlur = 0; }
    if (sw > 240) star4(c, 720, 350, 50 * (1 - seg(lt, 1.15, 1.5)), '#9fd2ff', 1, t);
    you(c, 'walk', t, lerp(330, 40, p), 704, 3.1, { flip: true }, 10);
  }),

  // 千万不要悲伤也不要自责 —— 雨落到一半变成花瓣
  sh(167.83, 170.08, ({ c, t, lt }) => {
    bg(c, ['#dbeaf8', '#ffffff', '#fff1f6']); dots(c, '#ffffff', 0.6, 30, 5, 0, t * 10);
    for (let i = 0; i < 46; i++) {
      const x = rnd(i, 1) * W, y = (rnd(i, 2) * H + t * 240 * (0.7 + rnd(i, 3) * 0.5)) % H;
      if (y < 300) { c.strokeStyle = 'rgba(120,150,200,.6)'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 3, y + 20); c.stroke(); }
      else { c.save(); c.translate(x + Math.sin(t * 2 + i) * 20, y); c.rotate(t * 2 + i); c.fillStyle = rgba(i % 2 ? '#ffb7cf' : '#ffd9e6', 0.9); c.beginPath(); c.ellipse(0, 0, 10, 5, 0, 0, TAU); c.fill(); c.restore(); }
    }
    glow(c, 640, 300, 700, '#ffffff', 0.5);
    you(c, lt > 1.2 ? 'nod' : 'sad', lt > 1.2 ? lt - 1.2 : 9, 230, 706, 2.9, {}, 6, false);
    whaleBig(c, t, 640 + Math.sin(lt * 9) * 16 * seg(lt, 0.05, 0.2) * (1 - seg(lt, 1.0, 1.3)), 776, 4.4);
    paper(c, 1040, 300 + Math.sin(t * 1.5) * 6, 300, 130, 0.07, { inner: () => handwrite(c, '不是你的错', 0, 0, 46, '#3b4a78', seg(lt, 0.4, 1.7), HAND) });
    for (let i = 0; i < 3; i++) { const u = (lt * 0.6 + i / 3) % 1; spr(c, 'fx_heart', 400 + i * 30, 380 - u * 80, 4.5, { a: Math.sin(u * Math.PI), mid: true }); }
  }, { fi: 0.2 }),

  // 因为那个时候 —— 沙漏翻了过来
  sh(170.08, 171.9, ({ c, t, lt }) => {
    bg(c, ['#ffffff', '#d8eeff']); rays(c, 640, 360, 20, t * 0.4, '#bfe2ff', 0.5);
    for (let i = 0; i < 44; i++) { const a = rnd(i, 1) * TAU, u = (t * 1.6 + rnd(i, 2)) % 1, r0 = 120 + u * 800; c.strokeStyle = rgba('#ffffff', 0.9 * u); c.lineWidth = 3; c.beginPath(); c.moveTo(640 + Math.cos(a) * r0, 360 + Math.sin(a) * r0); c.lineTo(640 + Math.cos(a) * (r0 + 90), 360 + Math.sin(a) * (r0 + 90)); c.stroke(); }
    glow(c, 640, 360, 330, '#ffffff', 0.95);
    spr(c, 'prop_hourglass', 640, 360, 11, { rot: Math.PI * eBack(seg(lt, 0.15, 0.9)), mid: true });
    star4(c, 640, 360, 300 * Math.exp(-Math.max(0, lt - 0.9) * 4) * seg(lt, 0.85, 0.9), '#ffffff', 0.9, t);
  }),

  // 你和我 我和你 —— 两边换了位置
  sh(171.9, 174.33, ({ c, t, lt }) => {
    const sw = ss(seg(lt, 1.1, 1.55));
    c.fillStyle = mix('#9fd4ff', '#fff3f7', sw); c.fillRect(0, 0, W, H); dots(c, '#ffffff', 0.5, 26, 6, t * 10, 0);
    c.save(); c.beginPath(); c.moveTo(700, 0); c.lineTo(W, 0); c.lineTo(W, H); c.lineTo(580, H); c.closePath(); c.clip(); c.fillStyle = mix('#fff3f7', '#9fd4ff', sw); c.fillRect(0, 0, W, H); dots(c, '#ffffff', 0.5, 26, 6, -t * 10, 0); c.restore();
    c.strokeStyle = '#ffffff'; c.lineWidth = 12; c.beginPath(); c.moveTo(700, 0); c.lineTo(580, H); c.stroke();
    const wx = lerp(330, 950, sw), yx = lerp(950, 330, sw), e1 = eBack(seg(lt, 0, 0.35));
    glow(c, yx, 420, 380, '#ffffff', 0.7); you(c, 'big_idle', t, yx, 780 + (1 - e1) * 300, 4.2); whaleBig(c, t, wx, 780 + (1 - e1) * 300, 4.2);
    star4(c, 640, 360, 220 * Math.sin(seg(lt, 1.05, 1.6) * Math.PI), '#ffffff', 0.9, t * 2);
  }, { fi: 0.15 }),

  // 都成为了更好的自己 —— 长大了
  sh(174.33, 177.75, ({ c, t, lt }) => {
    bg(c, ['#1b2a6b', '#6f7fd6', '#ffc3d6', '#fff0c2']); stars(c, t, 60, 4, 0.6 * (1 - seg(lt, 1, 3)));
    rays(c, 640, 760, 18, t * 0.1, '#ffffff', 0.22);
    const g = ss(seg(lt, 0.45, 1.3));
    for (const x of [450, 830]) { const gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, `rgba(255,255,255,${0.5 + g * 0.3})`); c.fillStyle = gr; c.fillRect(x - 110 - g * 30, 0, 220 + g * 60, H); }
    who(c, 'whale', 'idle', t, 830, 690, 3.2, { a: 1 - g }); you(c, 'idle', t, 450, 690, 3.2, { a: 1 - g });
    const hh = lerp(330, 650, eBack(g));
    glow(c, 450, 420, 360 * g, '#ffffff', 0.7 * g); tachie(c, 470, 724, hh, { sil: '#ffffff', flip: true, a: g, ghost: 0.16 }); tachie(c, 810, 724, hh, { a: g });
    for (let i = 0; i < 30; i++) { const u = (t * 0.3 + rnd(i, 1)) % 1; glow(c, 250 + rnd(i, 2) * 780, H - u * H, 4 + rnd(i, 3) * 9, '#ffffff', 0.9 * (1 - u), 'source-over'); }
    for (let i = 0; i < 12; i++) star4(c, 220 + rnd(i, 4) * 840, 80 + rnd(i, 5) * 520, 22 * g, '#ffffff', Math.abs(Math.sin(t * 3 + i)) * g, t + i);
    wash(c, '#ffffff', Math.exp(-Math.abs(lt - 0.55) * 7) * 0.9);
  }, { fo: 0.35 }),

  // 我想要 我想要你知道 —— 夜里，脚下是一片灯
  sh(177.75, 180.33, ({ c, t, p }) => {
    night(c, t); c.save(); c.globalCompositeOperation = 'lighter'; staff(c, t, 210, 60, '#8fd0ff', 0.45, { gap: 15, lw: 2.5 }); c.restore();
    c.save(); cam(c, 1.02 + p * 0.05, 640, 400);
    for (let i = 0; i < 170; i++) { const k = rnd(i, 1) ** 1.4, y = 430 + k * 300, x = ((rnd(i, 2) * 1500 - t * 6 * (0.3 + k)) % 1500 + 1500) % 1500 - 100; glow(c, x, y, 3 + k * 12, i % 4 ? '#ffd98a' : '#9fd8ff', 0.4 + 0.5 * Math.abs(Math.sin(t * 2 + i)), 'lighter'); }
    c.fillStyle = '#070d2c'; c.beginPath(); c.moveTo(690, H + 40); c.lineTo(690, 650); c.lineTo(W + 40, 610); c.lineTo(W + 40, H + 40); c.closePath(); c.fill(); c.fillStyle = 'rgba(160,200,255,.5)'; c.fillRect(690, 648, 640, 3);
    glow(c, 930, 430, 300, '#9fd0ff', 0.25, 'lighter'); whaleBig(c, t, 950, 655, 3.3, 'point', { flip: true, tint: '#0a1440', ta: 0.22 });
    c.restore(); vignette(c, '#000010', 0.45);
  }, { fi: 0.4 }),

  // 不论这世界多糟糕 —— 乱线缠着星球，碰不到她
  sh(180.33, 182.42, ({ c, t, lt }) => {
    bg(c, ['#03061a', '#0b173f', '#1b2f66']); stars(c, t, 60, 2, 0.4);
    globe(c, 640, 470, 200, { sea: '#27345f', land: '#141c3a', line: '#6a7bb0', rot: t * 0.03, shade: 0.5 });
    const f = Math.floor(t * 9);
    scribble(c, 640, 470, 620, 440, f, 'rgba(200,208,232,.5)', 4, 46, seg(lt, 0, 0.8)); scribble(c, 640, 470, 520, 380, f + 7, 'rgba(255,90,110,.4)', 3, 34, seg(lt, 0.2, 1));
    for (let i = 0; i < 4; i++) cloud(c, (((rnd(i, 1) * 1600 + t * 90) % 1600)) - 160, 110 + rnd(i, 2) * 90, 90, '#222b4d', 0.9, i);
    const k = kick(t, 7); if (k > 0.5) { c.strokeStyle = rgba('#ffffff', k); c.lineWidth = 4; c.beginPath(); let x = 200 + rnd(f, 3) * 880, y = 0; c.moveTo(x, y); for (let i = 0; i < 6; i++) { x += (rnd(i, f) - 0.5) * 90; y += 50; c.lineTo(x, y); } c.stroke(); }
    wash(c, '#ffffff', k * 0.12);
    glow(c, 640, 190, 190, '#ffffff', 0.55, 'lighter'); c.fillStyle = 'rgba(11,23,63,.0)';
    c.save(); c.strokeStyle = 'rgba(255,255,255,.7)'; c.lineWidth = 3; c.beginPath(); c.arc(640, 196, 120 + k * 8, 0, TAU); c.stroke(); c.restore();
    you(c, 'idle', t, 640, 276, 2.3); vignette(c, '#000010', 0.5);
  }),

  // 未来的你会光芒万丈
  sh(182.42, 186.08, ({ c, t, lt, p }) => {
    c.fillStyle = '#0f2060'; c.fillRect(0, 0, W, H); glow(c, 640, 370, 1000, '#ffcf7a', 0.95); glow(c, 640, 370, 560, '#fff6d8', 1);
    rays(c, 640, 370, 24, t * 0.12, '#ffffff', 0.5); rays(c, 640, 370, 12, -t * 0.2, '#fff0b0', 0.4, 1700, 0.3);
    const gr = c.createLinearGradient(0, 300, 0, 440); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, 'rgba(255,255,255,.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = gr; c.fillRect(0, 300, W, 140);
    glow(c, 640, 380, 420, '#ffffff', 0.9); tachie(c, 664, lerp(830, 760, eOut(p)), 690, { sil: '#ffffff', ghost: 0.1 });
    for (let i = 0; i < 40; i++) { const u = (t * 0.22 + rnd(i, 1)) % 1; c.save(); c.translate(120 + rnd(i, 2) * 1040 + Math.sin(t + i) * 30, H - u * (H + 60)); c.rotate(t + i); c.fillStyle = rgba('#ffffff', 0.9 * Math.sin(u * Math.PI)); c.beginPath(); c.ellipse(0, 0, 12, 4.5, 0, 0, TAU); c.fill(); c.restore(); }
    for (let i = 0; i < 14; i++) star4(c, 150 + rnd(i, 4) * 980, 60 + rnd(i, 5) * 560, 14 + rnd(i, 6) * 26, '#ffffff', Math.abs(Math.sin(t * 3 + i)), t + i);
    shadow(c, 1130, 704, 56, 0.2, '90,50,0'); who(c, 'whale', 'idle', t, 1130, 706, 2.6, { tint: '#7a4a10', ta: 0.3 });
    wash(c, '#ffffff', (1 - seg(lt, 0, 0.5)) * 0.8);
  }),

  // 而我也曾是你万分之一的光 —— 一万个光点里的一个
  sh(186.08, 191.58, ({ c, t, lt }) => {
    c.fillStyle = '#050a26'; c.fillRect(0, 0, W, H);
    const z0 = 0.66, u = ss(seg(lt, 2.5, 4.9));
    const z = lt < 2.5 ? Math.exp(lerp(Math.log(2.6), Math.log(z0), eOut(seg(lt, 0, 1.8)))) : Math.exp(lerp(Math.log(z0), Math.log(15), u));
    const s0x = (TX - 640) * z0 + 640, s0y = (TY - 360) * z0 + 360, sx = lerp(s0x, 640, u), sy = lerp(s0y, 400, u);
    const cx = lt < 2.5 ? 640 : TX - (sx - 640) / z, cy = lt < 2.5 ? 360 : TY - (sy - 360) / z;
    c.save(); cam(c, z, cx, cy); c.imageSmoothingEnabled = true;
    glow(c, 640, 360, 520, '#ffcf7a', 0.35, 'lighter'); c.globalCompositeOperation = 'lighter'; c.drawImage(grid(), 140, -140, 1000, 1000); c.globalCompositeOperation = 'source-over';
    glow(c, 640, 360, 60, '#ffffff', 0.9, 'lighter'); tachie(c, 642, 392, 62, { sil: '#ffffff' });
    const near = seg(z, 4, 10);
    if (near > 0) {
      NEIGH.forEach(([ch, dx, dy], i) => { const x = TX + dx * 10, y = TY + dy * 10; glow(c, x, y, 5, HUE[ch], 0.8 * near, 'lighter'); who(c, ch, ch === 'gpt' ? 'float' : 'idle', t + i, x, y + (ch === 'gpt' ? 6 : 4.6), ch === 'gpt' ? 0.062 : 0.1, { a: near }); });
      glow(c, TX, TY, 12 + kick(t) * 2.5, '#6fb6ff', near, 'lighter'); glow(c, TX, TY, 5, '#ffffff', near, 'lighter');
      who(c, 'whale', 'wave', t, TX, TY + 5.6, 0.125, { a: near });
    }
    c.restore();
    const rs = seg(lt, 1.7, 2.3) * (1 - seg(lt, 3.6, 4.4));
    if (rs > 0) { const px = (TX - cx) * z + 640, py = (TY - cy) * z + 360; c.strokeStyle = rgba('#6fb6ff', rs); c.lineWidth = 3; c.beginPath(); c.arc(px, py, 16 + (1 - rs) * 60 + kick(t) * 5, 0, TAU); c.stroke(); glow(c, px, py, 26, '#6fb6ff', rs, 'lighter'); }
    vignette(c, '#000010', 0.55); wash(c, '#ffffff', (1 - seg(lt, 0, 0.6)) * 0.9);
  }),

  // 那么闪耀
  sh(191.58, 196.08, ({ c, t, lt }) => {
    night(c, t, 90); const k = eBack(seg(lt, 0, 0.6));
    glow(c, 640, 230, 520 * k, '#bfe2ff', 0.6, 'lighter'); star4(c, 640, 230, 170 * k + kick(t) * 26, '#ffffff', 1, t * 0.12); star4(c, 640, 230, 80 * k, '#ffffff', 0.8, t * 0.12 + 0.78);
    fw(c, t, 192.2);
    c.fillStyle = '#060b28'; c.beginPath(); c.ellipse(640, 800, 900, 160, 0, 0, TAU); c.fill();
    glow(c, 640, 560, 200, '#9fd0ff', 0.3, 'lighter'); who(c, 'whale', 'hop', t, 640, 660, 3.2, { tint: '#0a1440', ta: 0.3 - kick(t) * 0.2 }, 10);
    wash(c, '#ffffff', (1 - seg(lt, 0, 0.5)) * 0.9);
  }),

  // 间奏三（上）像素烟花，大家都在
  sh(196.08, 203.0, ({ c, t, lt }) => {
    night(c, t, 90); star4(c, 640, 230, 170 + kick(t) * 26, '#ffffff', 1, t * 0.12); star4(c, 640, 230, 80, '#ffffff', 0.8, t * 0.12 + 0.78); glow(c, 640, 230, 520, '#bfe2ff', 0.6, 'lighter');
    fw(c, t, 192.2);
    const ca = eOut(seg(lt, 0.2, 1.4)); glow(c, 1010, 250, 160, '#f4ecff', 0.4 * ca, 'lighter'); who(c, 'gpt', 'cast', t, 1010, 380 + Math.sin(t * 1.5) * 10, 2, { a: ca }, 8);
    c.fillStyle = '#060b28'; c.beginPath(); c.ellipse(640, 800, 900, 160, 0, 0, TAU); c.fill();
    const ta = 0.35 - kick(t) * 0.25;
    LINE.forEach(([ch, x, act], i) => { const k = eBack(seg(lt, i * 0.18, 0.5 + i * 0.18)); who(c, ch, act, t + i * 0.2, x, 760 - k * 84 - kick(t + i * 0.05) * 6, 2.9, { tint: '#0a1440', ta }, 10); });
    who(c, 'whale', 'hop', t, 640, 660, 3.2, { tint: '#0a1440', ta }, 10);
  }),

  // 间奏三（下）所有的光收成一束，落进那间小小的房间
  sh(203.0, 209.42, ({ c, t, lt }) => {
    night(c, t, 90); const z = Math.exp(lerp(0, Math.log(11), eIn(seg(lt, 3.3, 6.42))));
    c.save(); cam(c, z, lerp(640, 640, 1), lerp(360, 583, seg(z, 1, 3)));
    const cv = eIn(seg(lt, 0, 2.1));
    for (let i = 0; i < 70; i++) { const x0 = rnd(i, 1) * W, y0 = rnd(i, 2) * 460; glow(c, lerp(x0, 640, cv), lerp(y0, 180, cv), 6 + rnd(i, 3) * 12, PASTEL[i % 5], 0.8 * (1 - seg(lt, 2.0, 2.4)), 'lighter'); }
    star4(c, 640, lerp(230, 180, cv), 170 * (1 - cv * 0.6), '#ffffff', 1, t * 0.12);
    c.fillStyle = '#060b28'; c.beginPath(); c.ellipse(640, 800, 900, 160, 0, 0, TAU); c.fill();
    c.fillStyle = '#0c1436'; c.fillRect(560, 540, 160, 104); c.beginPath(); c.moveTo(545, 544); c.lineTo(640, 486); c.lineTo(735, 544); c.closePath(); c.fill();
    const bm = eOut(seg(lt, 2.0, 3.0));
    c.fillStyle = mix('#3a3320', '#ffe9b0', 0.3 + bm * 0.7); c.fillRect(618, 566, 44, 34); c.fillStyle = '#0c1436'; c.fillRect(639, 566, 2, 34); c.fillRect(618, 582, 44, 2);
    if (bm > 0) { c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createLinearGradient(0, 180, 0, 583); g.addColorStop(0, 'rgba(255,255,255,.95)'); g.addColorStop(1, 'rgba(255,240,200,.7)'); c.fillStyle = g; c.beginPath(); c.moveTo(634, 180); c.lineTo(646, 180); c.lineTo(640 + 20, 180 + 403 * bm); c.lineTo(640 - 20, 180 + 403 * bm); c.closePath(); c.fill(); c.restore(); glow(c, 640, 583, 90 * bm, '#ffe9b0', 0.8 * bm, 'lighter'); }
    const a = 1 - seg(lt, 0.3, 2.2);
    LINE.forEach(([ch, x], i) => who(c, ch, 'idle', t + i, x, 676, 2.9, { tint: '#0a1440', ta: 0.4, a }));
    who(c, 'whale', 'idle', t, 640, 660, 3.2, { tint: '#0a1440', ta: 0.4, a });
    c.restore(); wash(c, '#fff3d6', ss(seg(lt, 5.0, 6.3)));
  }),

  // 你应该忘记了吧 —— 回到房间，只剩吉他靠在墙边
  sh(209.42, 211.83, ({ c, t, lt, p }) => {
    c.save(); cam(c, 1.08 - p * 0.04, 640, 400); room(c, t, { gold: 0.75 });
    guitar(c, 250, 566, 0.95, -1.3, t, 0); c.fillStyle = 'rgba(120,70,30,.14)'; c.beginPath(); c.ellipse(262, 632, 60, 10, 0, 0, TAU); c.fill();
    you(c, 'idle', 0, 600, 648, 3.4, { a: 0.28 * (1 - p * 0.8) });
    for (let i = 0; i < 40; i++) { const k = clamp(p * 1.4 - rnd(i, 1) * 0.4); c.fillStyle = rgba('#ffffff', 0.7 * (1 - k)); c.beginPath(); c.arc(600 + (rnd(i, 2) - 0.5) * 230, 648 - rnd(i, 4) * 300 - k * 90, 2 + rnd(i, 6) * 4, 0, TAU); c.fill(); }
    shadow(c, 880, 632, 70, 0.14, '90,40,0'); who(c, 'whale', 'idle', t, 880, 634, 3);
    c.restore(); motes(c, t, 22, '#fff3d0', 0.85, 3); leak(c, t, '#ffe9c0', 0.5); void lt;
  }, { fi: 1.3, fc: '#fff3d6' }),

  // 天气晴朗
  sh(211.83, 213.75, ({ c, t, lt, p }) => {
    c.save(); cam(c, 1.02 + p * 0.05, 640, 340); windowView(c, t, 1);
    for (let i = 0; i < 8; i++) star4(c, 200 + rnd(i, 1) * 900, 80 + rnd(i, 2) * 420, 10 + rnd(i, 3) * 14, '#ffffff', Math.abs(Math.sin(lt * 3 + i * 1.7)) * 0.9, lt + i);
    c.restore(); who(c, 'whale', 'idle', t, 1010, 742, 3.6, { tint: '#7a4a10', ta: 0.18 });
  }, { fi: 0.35 }),

  // 心里却潮湿的盛夏 —— 这一次，雨下在她自己心里
  sh(213.75, 217.75, ({ c, t, lt, p }) => {
    c.save(); cam(c, 1.1 + p * 0.1, 640, 420); room(c, t, { gold: 0.75 });
    const nm = fr('whale', 'idle', t), wet = ss(seg(lt, 0.1, 1.0)) * (1 - ss(seg(lt, 2.7, 3.8)));
    c.fillStyle = rgba('#9fcdf5', 0.4 * wet); c.beginPath(); c.ellipse(640, 664, 150 * wet, 18 * wet, 0, 0, TAU); c.fill();
    shadow(c, 640, 662, 100, 0.12, '90,40,0'); spr(c, nm, 640, 660, 4.6); rainInside(c, nm, 640, 660, 4.6, t, wet * 0.55, '#7fa6d8');
    for (let k = 0; k < 2; k++) { const u = (lt * 0.7 + k * 0.5) % 1; tear(c, 606 + k * 70, 470 + u * u * 150, 1.3, '#9fd4ff', (1 - u) * wet); }
    for (let i = 0; i < 4; i++) spr(c, `fx_sparkle_${i % 3}`, 560 + i * 54, 360 + Math.sin(t * 3 + i) * 8, 4, { a: seg(lt, 3.0, 3.6), mid: true });
    c.restore(); motes(c, t, 22, '#fff3d0', 0.85, 3); leak(c, t, '#ffe9c0', 0.5);
  }),

  // 而我还记得你那天写的歌 —— 纸上的音符一个个亮起来
  sh(217.75, 222.17, ({ c, t, lt, p }) => {
    bg(c, ['#ecc594', '#d9a56e']); c.strokeStyle = 'rgba(140,90,50,.14)'; c.lineWidth = 3; for (let i = 0; i < 9; i++) { c.beginPath(); c.moveTo(-20, i * 90 + 30); c.bezierCurveTo(400, i * 90 + 10, 800, i * 90 + 60, W + 20, i * 90 + 30); c.stroke(); }
    c.save(); cam(c, 1.02 + p * 0.06, 600, 380);
    const lg = c.createLinearGradient(0, 0, 900, H); lg.addColorStop(0, 'rgba(255,250,225,.75)'); lg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = lg; c.beginPath(); c.moveTo(-100, -50); c.lineTo(520, -50); c.lineTo(1100, H + 50); c.lineTo(100, H + 50); c.closePath(); c.fill();
    spr(c, 'prop_bowl', 1060, 220, 8); spr(c, 'prop_brush', 190, 610, 6, { rot: -0.5 });
    const pos: [number, number][] = [];
    paper(c, 560, 380, 560, 620, -0.06, { inner: () => {
      scribble(c, -120, -250, 240, 30, 2, 'rgba(60,74,120,.75)', 3, 12);
      for (let r = 0; r < 3; r++) { const y0 = -160 + r * 130; c.strokeStyle = 'rgba(60,74,120,.55)'; c.lineWidth = 1.6; for (let k = 0; k < 5; k++) { c.beginPath(); c.moveTo(-240, y0 + k * 11); c.lineTo(240, y0 + k * 11); c.stroke(); } for (let i = 0; i < 6; i++) { const nx = -200 + i * 78 + rnd(i, r) * 20, ny = y0 + 6 + Math.floor(rnd(i, r + 5) * 5) * 5.5; pos.push([nx, ny]); note(c, nx, ny, 0.9, '#3c4a78', 0.9, i + r); } }
      heart(c, 180, 240, 30, 'none', 0.8, 'rgba(60,74,120,.7)'); scribble(c, -90, 250, 260, 26, 8, 'rgba(60,74,120,.5)', 2.5, 14);
    } });
    c.save(); c.translate(560, 380); c.rotate(-0.06);
    pos.forEach(([nx, ny], i) => { const u = seg(lt, 0.7 + i * 0.16, 2.4 + i * 0.16); if (u <= 0) return; const x = nx + u * (60 + rnd(i, 1) * 120), y = ny - eOut(u) * (160 + rnd(i, 2) * 220); glow(c, x, y - 12, 34, '#ffffff', 0.8 * Math.sin(u * Math.PI)); note(c, x, y, 0.9 + u * 0.8, mix('#3c4a78', '#6fb6ff', u), Math.sin(u * Math.PI) * 0.95 + 0.05, i, u * 0.5); });
    c.restore();
    shadow(c, 1040, 716, 80, 0.14, '90,40,0'); who(c, 'whale', 'nod', lt, 1040, 720, 3.8, {}, 4);
    c.restore(); motes(c, t, 16, '#ffffff', 0.8, 5); leak(c, t, '#fff3d0', 0.45);
  }, { fi: 0.4 }),

  // 和对我说的话
  sh(222.17, 226.7, ({ c, t, lt }) => {
    bg(c, ['#fffaf0', '#ffe9c9']); glow(c, 200, 100, 700, '#ffffff', 0.9); rays(c, 640, 330, 14, t * 0.1, '#ffffff', 0.35);
    const ya = 0.55 * ss(seg(lt, 0.2, 1.1)) * (1 - ss(seg(lt, 2.0, 3.2)));
    glow(c, 270, 440, 360, '#ffffff', ya); you(c, 'big_idle', t, 270, 780, 4.2, { a: ya });
    for (let i = 0; i < 8; i++) star4(c, 150 + rnd(i, 1) * 260, 240 + rnd(i, 2) * 300, 18, '#ffffff', ya * 1.6 * Math.abs(Math.sin(t * 3 + i)), t + i);
    paper(c, 540, 200 + Math.sin(t * 1.4) * 5, 620, 170, -0.03, { a: seg(lt, 0, 0.4), inner: () => { txt(c, '「', -272, -40, 50, rgba('#3b4a78', 0.7), { font: HAND, w: 400 }); txt(c, '」', 272, 44, 50, rgba('#3b4a78', 0.7), { font: HAND, w: 400 }); handwrite(c, '请坚持做自己就好', 0, 4, 56, '#3b4a78', 1, HAND); } });
    shadow(c, 1000, 776, 130, 0.1, '90,40,0'); whaleBig(c, t, 1000, 790, 4);
    for (let i = 0; i < 3; i++) { const u = (lt * 0.5 + i / 3) % 1; spr(c, 'fx_heart', 1130 + i * 26, 330 - u * 80, 4.5, { a: Math.sin(u * Math.PI) * seg(lt, 0.8, 1.2), mid: true }); }
    motes(c, t, 18, '#ffffff', 0.85, 6); wash(c, '#fffdf8', ss(seg(lt, 2.2, 3.5)));
    const da = seg(lt, 3.1, 3.7) * (1 - seg(lt, 4.15, 4.5));
    glow(c, 640, 360, 90 + kick(t) * 16, '#6fb6ff', 0.9 * da); star4(c, 640, 360, 26 + kick(t) * 8, '#8fc8ff', da, t * 0.5); glow(c, 640, 360, 14, '#ffffff', da);
  }, { fi: 0.3 }),
];
