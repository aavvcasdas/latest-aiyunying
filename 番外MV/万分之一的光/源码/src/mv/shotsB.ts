// 第二幕 1:10–2:40 恶评 / 围观 / 只有你保护我 / 副歌二 / 酒阑人散 / 间奏二（四季）
import { F, Shot, C, W, H, TAU, bg, wash, glow, cam, rnd, seg, ss, eOut, eIn, eBack, lerp, clamp, rgba, mix, kick, beatPos, BEAT, motes, leak, rays, dots, cloud, stars, note, star4, rr, txt, HAND, vignette, sky, bubble } from './kit';
import { spr, who, you, fr, walkF, shadow, whaleBig, Who } from './cast';
import { guitar, paper, cup, globe, calPage, box, card, sprout, bulbs, handwrite } from './props';

const sh = (s: number, e: number, draw: (f: F) => void, o: Partial<Shot> = {}): Shot => ({ s, e, draw, ...o });
const DARK = '#0a2a36';

function crimson(c: C, t: number) {
  bg(c, ['#2a0006', '#8f0016', '#e3122f'], 0, 0, W * 0.4, H);
  c.save(); c.translate(640, 360); c.rotate(-0.5); c.fillStyle = 'rgba(0,0,0,.15)'; for (let i = -12; i <= 12; i++) c.fillRect(i * 120 + ((t * 40) % 120), -900, 56, 1800); c.restore();
  dots(c, '#000000', 0.16, 22, 5, t * 10, 0);
}
/** 砸下来的大字（参考片的手法：白色大字 + 猩红底） */
function bigWord(c: C, s: string, x: number, y: number, size: number, rot: number, age: number, a = 1) {
  if (age < 0) return; const k = eOut(age / 0.16), sc = lerp(2.4, 1, k), sk = age < 0.4 ? Math.sin(age * 90) * 7 * (1 - age / 0.4) : 0;
  txt(c, s, x + 9 + sk, y + 9, size, 'rgba(40,0,8,.85)', { rot, sc, w: 900, a: a * k }); txt(c, s, x + sk, y, size, '#ffffff', { rot, sc, w: 900, glow: '#ff2a4a', blur: 34, a: a * k });
}
const impact = (lt: number, at: number) => (lt >= at ? Math.exp(-(lt - at) * 9) : 0);
function redBoxes(c: C, t: number, lt: number, n: number, every: number, seed = 0) {
  for (let i = 0; i < n; i++) { const k = eBack(seg(lt, i * every, i * every + 0.25)); if (k <= 0) continue; const x = 90 + rnd(i, seed + 1) * 1100, y = 70 + rnd(i, seed + 2) * 560; if (Math.abs(x - 640) < 190 && y > 380) continue; box(c, x, y + Math.sin(t * 2 + i) * 5, 110 + rnd(i, seed + 3) * 60, 70, i % 4 === 0 ? '#a30a20' : '#d20f2b', (['x', 'ban', 'dots'] as const)[i % 3], 0.95, k, (rnd(i, seed + 4) - 0.5) * 0.3); }
}
function teal(c: C, t: number, dark = 0) {
  bg(c, [mix('#06303f', '#1a0a16', dark), mix('#0f5566', '#3a1020', dark), mix('#1f7f90', '#5a1626', dark)]);
  for (let i = 0; i < 5; i++) { c.fillStyle = 'rgba(200,245,255,.045)'; c.beginPath(); const x = 120 + i * 260 + Math.sin(t * 0.3 + i) * 40; c.moveTo(x, 0); c.lineTo(x + 90, 0); c.lineTo(x - 140, H); c.lineTo(x - 320, H); c.closePath(); c.fill(); }
  for (let i = 0; i < 26; i++) { const y = H - ((t * 40 * (0.5 + rnd(i, 1)) + rnd(i, 2) * H) % (H + 40)); bubble(c, rnd(i, 3) * W + Math.sin(t + i) * 12, y, 3 + rnd(i, 4) * 8, 0.5); }
  c.fillStyle = 'rgba(0,20,30,.35)'; c.fillRect(0, 650, W, 70);
  glow(c, 640, 560, 340, '#bff3ff', 0.2, 'lighter'); c.fillStyle = 'rgba(190,243,255,.16)'; c.beginPath(); c.ellipse(640, 654, 230, 26, 0, 0, TAU); c.fill();
  // 玻璃缸：被围观
  c.strokeStyle = 'rgba(255,255,255,.3)'; c.lineWidth = 5; rr(c, 380, 250, 520, 430, 30); c.stroke(); c.strokeStyle = 'rgba(255,255,255,.22)'; c.lineWidth = 10; c.lineCap = 'round'; c.beginPath(); c.moveTo(410, 300); c.lineTo(410, 400); c.moveTo(432, 290); c.lineTo(432, 330); c.stroke();
}
const dim = { tint: DARK, ta: 0.42 };
export function reflect(c: C, y: number, fn: () => void, a = 0.25) { c.save(); c.translate(0, y); c.scale(1, -1); c.translate(0, -y); c.globalAlpha *= a; fn(); c.restore(); }
function memBubble(c: C, t: number, x: number, y: number, r: number, col: string, act: string, k: number, withYou: number, crack = false) {
  if (k <= 0) return; r *= k; x += Math.sin(t * 0.9 + r) * 10; y += Math.cos(t * 1.1 + r) * 8;
  c.save(); c.beginPath(); c.arc(x, y, r, 0, TAU); c.clip(); c.fillStyle = mix(col, '#cfeeff', withYou * 0.85); c.globalAlpha = 0.85; c.fillRect(x - r, y - r, 2 * r, 2 * r); c.globalAlpha = 1;
  const s = r / 52; who(c, 'whale', act, act === 'shiver' ? t : 9, x + withYou * r * 0.28, y + r * 0.78, s, {}, 12);
  if (withYou > 0) you(c, 'idle', t, x - r * 0.34, y + r * 0.78, s * eBack(withYou)); c.restore();
  bubble(c, x, y, r);
  if (crack && withYou < 0.5) { c.strokeStyle = rgba('#ffffff', 0.9 * (1 - withYou * 2)); c.lineWidth = 2.5; c.beginPath(); c.moveTo(x - r * 0.6, y - r * 0.5); c.lineTo(x - r * 0.3, y - r * 0.2); c.lineTo(x - r * 0.42, y); c.lineTo(x - r * 0.1, y + r * 0.2); c.moveTo(x - r * 0.3, y - r * 0.2); c.lineTo(x, y - r * 0.3); c.stroke(); }
}
const MEM: [number, number, number, string, string][] = [[290, 300, 122, '#c4102a', 'shiver'], [660, 250, 140, '#0f5566', 'sad'], [1010, 320, 116, '#5a6070', 'surprise']];
function partyRoom(c: C, t: number, on: (i: number) => number, steam = 1) {
  bg(c, ['#241d4a', '#463a78', '#75659f']); c.fillStyle = 'rgba(255,255,255,.04)'; for (let i = 0; i < 6; i++) c.fillRect(60 + i * 210, 120, 150, 380);
  c.fillStyle = '#33295c'; c.fillRect(0, 600, W, 120); bulbs(c, t, 60, 12, on);
  return () => {
    c.fillStyle = '#8f6a4a'; c.fillRect(200, 590, 16, 110); c.fillRect(1064, 590, 16, 110); c.fillStyle = '#f4ecdf'; rr(c, 150, 552, 980, 44, 8); c.fill(); c.fillStyle = 'rgba(120,90,160,.18)'; c.fillRect(150, 584, 980, 12);
    for (let i = 0; i < 6; i++) { const x = 250 + i * 156; spr(c, i === 3 ? 'prop_hourglass' : 'prop_teacup', x, 556, i === 3 ? 3.4 : 3.6); if (i !== 3 && steam > 0) spr(c, `fx_steam_${Math.floor(t * 4 + i) % 3}`, x, 500, 3, { a: 0.7 * steam, mid: true }); }
  };
}
const SEASON = [
  { sky: ['#58b4ff', '#d6f3ff'], ground: '#9bdc8f', leaf: '#6fc46a', part: '#ffffff' },
  { sky: ['#ffab66', '#ffe9c7'], ground: '#e2a55a', leaf: '#f08a3c', part: '#f2994a' },
  { sky: ['#8fa9d2', '#e6eef9'], ground: '#f4f7fc', leaf: '#cfdcee', part: '#ffffff' },
  { sky: ['#ffbdd3', '#fff1f6'], ground: '#bfe6b0', leaf: '#ffb7cf', part: '#ffc4d8' },
];

export const shotsB: Shot[] = [
  // 丑八怪 假装可爱 声音奇怪
  sh(69.83, 74.0, ({ c, t, lt }) => {
    const im = impact(lt, 0) + impact(lt, 1.38) + impact(lt, 2.76);
    c.save(); c.translate(Math.sin(t * 70) * 12 * im, Math.cos(t * 60) * 9 * im); crimson(c, t);
    redBoxes(c, t, lt - 0.3, 12, BEAT * 0.66, 1);
    glow(c, 640, 600, 300, '#ffffff', 0.22, 'lighter');
    if (lt < 1.1) who(c, 'whale', 'surprise', lt, 640, 700, 3.4, {}, 9, false); else who(c, 'whale', 'shiver', t, 640 + Math.sin(t * 44) * 1.5, 700, 3.4, {}, 14);
    bigWord(c, '丑八怪', 330, 210, 158, -0.12, lt); bigWord(c, '假装可爱', 880, 300, 132, 0.08, lt - 1.38); bigWord(c, '声音奇怪', 420, 470, 140, -0.05, lt - 2.76);
    c.restore(); vignette(c, '#000000', 0.6); wash(c, '#ffffff', im * 0.25);
  }),

  // 不期待 装腔作态 —— 龙影从上方掠过
  sh(74.0, 77.58, ({ c, t, lt, p }) => {
    const im = impact(lt, 0) + impact(lt, 1.75);
    c.save(); c.translate(Math.sin(t * 70) * 12 * im, Math.cos(t * 60) * 9 * im); crimson(c, t);
    bigWord(c, '丑八怪', 200, 600, 70, -0.1, 9, 0.22); bigWord(c, '假装可爱', 1080, 610, 60, 0.1, 9, 0.22); bigWord(c, '声音奇怪', 1040, 90, 64, 0.04, 9, 0.22);
    spr(c, `gpt_fly_${Math.floor(t * 6) % 2}`, lerp(-420, 1700, p), 520, 11, { sil: '#120006', a: 0.5 });
    redBoxes(c, t, lt + 3, 26, 0.22, 1);
    glow(c, 640, 620, 260, '#ffffff', 0.18, 'lighter');
    who(c, 'whale', 'sad', lt * 0.6, 640, 700, lerp(3.4, 2.9, p), {}, 5, false);
    bigWord(c, '不期待', 370, 220, 160, -0.09, lt); bigWord(c, '装腔作态', 850, 400, 150, 0.07, lt - 1.75);
    c.restore(); vignette(c, '#000000', 0.65); wash(c, '#ffffff', im * 0.25);
  }),

  // 那一天 —— 一页日历被撕开
  sh(77.58, 79.5, ({ c, t, lt }) => {
    c.fillStyle = '#0a0003'; c.fillRect(0, 0, W, H); glow(c, 640, 380, 520, '#c0102a', 0.55, 'lighter');
    const k = eOut(seg(lt, 0.35, 1.3));
    for (const d of [-1, 1]) { c.save(); c.translate(640 + d * k * 90, 330 + k * 30); c.rotate(d * k * 0.22); c.beginPath(); if (d < 0) { c.moveTo(-200, -220); c.lineTo(0, -220); for (let i = 0; i <= 8; i++) c.lineTo((i % 2 ? 9 : -9), -220 + i * 55); c.lineTo(-200, 220); } else { c.moveTo(200, -220); c.lineTo(0, -220); for (let i = 0; i <= 8; i++) c.lineTo((i % 2 ? 9 : -9), -220 + i * 55); c.lineTo(200, 220); } c.closePath(); c.clip(); calPage(c, 0, 0, 3.6, 0, '#e0102e'); c.restore(); }
    who(c, 'whale', 'sad', 9, 640, 706, 2.6, { tint: '#0a0003', ta: 0.72 });
    wash(c, '#ffffff', impact(lt, 0.35) * 0.5); vignette(c, '#000000', 0.7);
    for (let i = 0; i < 10; i++) { const u = seg(lt, 0.35, 1.9); c.fillStyle = `rgba(255,255,255,${(1 - u) * 0.8})`; c.fillRect(640 + (rnd(i, 1) - 0.5) * 60 * (1 + u * 4), 150 + rnd(i, 2) * 380 + u * 80, 5, 9); }
    void t;
  }),

  // 发现了这世界原来真的没那么好 —— 红色的星球，绕着它转的是那些话
  sh(79.5, 86.0, ({ c, t, lt }) => {
    bg(c, ['#160003', '#70000f', '#d81a34']); stars(c, t, 50, 3, 0.4, '#ffb0b8');
    c.save(); const z = lerp(1.55, 1, eOut(seg(lt, 0, 5.2))); cam(c, z, 640, lerp(470, 370, eOut(seg(lt, 0, 5.2))));
    c.strokeStyle = 'rgba(255,150,160,.5)'; c.lineWidth = 4; c.beginPath(); c.arc(250, 170, 44, 0, TAU); c.stroke(); c.beginPath(); for (let i = 0; i < 26; i++) { const px = 250 + (rnd(i, 3) - 0.5) * 150, py = 170 + (rnd(i, 4) - 0.5) * 130; if (i) c.lineTo(px, py); else c.moveTo(px, py); } c.stroke();
    const words = ['丑八怪', '假装可爱', '声音奇怪', '不期待', '装腔作态'];
    const orbit = (front: boolean) => { for (let i = 0; i < 10; i++) { const a = t * 0.45 + (i * TAU) / 10, d = Math.sin(a); if ((d > 0) !== front) continue; txt(c, words[i % 5], 640 + Math.cos(a) * 540, 500 + d * 80, 34 + 14 * d, '#ffffff', { w: 900, a: 0.3 + 0.3 * (d + 1), glow: '#ff2a4a', blur: 14 }); } };
    orbit(false);
    globe(c, 640, 850, 340, { sea: '#8c0c1e', land: '#2a0308', line: '#ff5a70', rot: t * 0.02, shade: 0.55 });
    c.strokeStyle = 'rgba(255,190,196,.85)'; c.lineWidth = 3; c.lineJoin = 'round';
    for (let k = 0; k < 4; k++) { const n = Math.floor(seg(lt, 0.5 + k * 0.6, 4 + k * 0.5) * 9); c.beginPath(); let px = 640 + (k - 1.5) * 110, py = 516 + Math.abs(k - 1.5) * 22; c.moveTo(px, py); for (let i = 0; i < n; i++) { px += (rnd(i, k + 20) - 0.5) * 60; py += 16 + rnd(i, k + 30) * 22; c.lineTo(px, py); } c.stroke(); }
    glow(c, 640, 420, 200, '#ffffff', 0.16, 'lighter');
    if (lt < 2.6) who(c, 'whale', 'sad', 9, 640, 516, 2.6); else who(c, 'whale', 'shake', lt - 2.6, 640, 516, 2.6, {}, 4);
    orbit(true); c.restore(); vignette(c, '#000000', 0.6);
  }, { fi: 0.2, fc: '#ff2a4a' }),

  // 有的人只是路过探头看看 —— 猫停下来张望，Kimi 只是路过
  sh(86.0, 88.25, ({ c, t, lt, p }) => {
    teal(c, t); spr(c, walkF('kimi', t), lerp(1400, 860, p), 610, 2.3, { ...dim, ta: 0.6, flip: true, a: 0.85 });
    who(c, 'whale', 'sad', 9, 640, 652, 3);
    const gx = lerp(-90, 350, eOut(seg(lt, 0, 1.1)));
    if (lt < 1.0) spr(c, walkF('gemini', t), gx, 660, 2.8, dim); else { who(c, 'gemini', 'lookaround', lt - 1.0, gx, 660, 2.8, dim, 8); spr(c, 'fx_question', gx + 70, 390, 5, { mid: true, a: seg(lt, 1.2, 1.4) }); }
  }, { fi: 0.25, fc: '#bff3ff' }),

  // 然后觉得无趣笑一笑马上离开 —— 千问拿扇子挡着笑
  sh(88.25, 90.42, ({ c, t, lt }) => {
    teal(c, t); spr(c, walkF('kimi', t), 860 - lt * 240, 610, 2.3, { ...dim, ta: 0.6, flip: true, a: 0.85 });
    who(c, 'whale', 'sad', 9, 640, 652, 3);
    if (lt < 0.95) { who(c, 'gemini', 'tilt', lt, 350, 660, 2.8, dim, 8, false); box(c, 440, 390, 96, 60, '#e8fbff', 'none', 0.9, eBack(seg(lt, 0.1, 0.35))); txt(c, '……', 440, 388, 30, DARK, { a: seg(lt, 0.2, 0.4) }); }
    else spr(c, walkF('gemini', t, 13), 350 - (lt - 0.95) * 400, 660, 2.8, { ...dim, flip: true });
    const qx = lt < 1.15 ? 930 : 930 + (lt - 1.15) * 380;
    if (lt < 1.15) { who(c, 'qwen', 'sway', t, qx, 660, 3, dim, 8); spr(c, 'prop_fan', qx - 6, 470 + Math.sin(t * 10) * 3, 4.2, { mid: true }); txt(c, '呵', qx + 86, 400 - lt * 20, 38, '#e8fbff', { a: seg(lt, 0.4, 0.6) * (1 - seg(lt, 0.95, 1.15)), w: 800 }); }
    else spr(c, walkF('qwen', t, 13), qx, 660, 3, dim);
  }),

  // 有的人只是凑个热闹 —— 狐狸竖起耳朵，手机举起来
  sh(90.42, 92.25, ({ c, t, lt }) => {
    teal(c, t, 0.25); who(c, 'whale', 'shiver', t, 640, 652, 3, {}, 10);
    const k = (i: number) => eBack(seg(lt, i * 0.12, 0.4 + i * 0.12));
    const zx = lerp(-120, 370, k(0)), cx = lerp(-200, 120, k(1)), dx = lerp(1420, 940, k(2)), kx = lerp(1500, 1110, k(3));
    who(c, 'claude', 'lookaround', t, cx, 664, 2.9, dim, 8); spr(c, 'prop_magnifier', cx + 60, 420, 5, { mid: true, rot: Math.sin(t * 4) * 0.2 });
    who(c, 'zai', 'alert', lt - 0.3, zx, 664, 3, dim, 9, false); spr(c, 'fx_exclaim', zx + 60, 370, 5, { mid: true, a: seg(lt, 0.4, 0.5) }); spr(c, 'prop_phone', zx - 60, 430 + Math.sin(t * 6) * 4, 4.4, { mid: true });
    who(c, 'doubao', 'hop', t, dx, 664, 3, dim, 10); spr(c, 'prop_phone', dx - 56, 440 + Math.sin(t * 7 + 1) * 4, 4.4, { mid: true });
    who(c, 'gemini', 'hop', t + 0.3, kx, 664, 2.9, dim, 10);
    for (let i = 0; i < 3; i++) star4(c, [zx - 60, dx - 56, cx + 60][i], [416, 426, 410][i], 50 * kick(t + i * 0.17, 7), '#ffffff', kick(t + i * 0.17, 7));
  }),

  // 顺便嘲笑跟着踩一脚 —— 红舞鞋一拍一拍落下来
  sh(92.25, 94.5, ({ c, t, lt, p }) => {
    const b = beatPos(t) * 2, u = b - Math.floor(b), hit = Math.exp(-u * 7), n = Math.floor(b);
    c.save(); c.translate(0, hit * 10 * Math.sin(t * 80)); teal(c, t, 0.25 + p * 0.5);
    c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 3; for (let k = 0; k < 7; k++) { const a = -0.2 + k * 0.6, len = (80 + rnd(k, 1) * 170) * p; c.beginPath(); c.moveTo(640, 656); let px = 640, py = 656; for (let i = 0; i < 4; i++) { px += Math.cos(a + (rnd(i, k) - 0.5)) * len * 0.25; py += Math.sin(a + (rnd(i, k) - 0.5)) * len * 0.07; c.lineTo(px, py); } c.stroke(); }
    who(c, 'claude', 'lookaround', t, 120, 664, 2.9, dim, 8); who(c, 'zai', 'hop', t, 370, 664, 3, dim, 10); who(c, 'gemini', 'hop', t + 0.3, 1110, 664, 2.9, dim, 10);
    who(c, 'doubao', 'step', t, lerp(940, 830, p), 664, 3.1, dim, 12);
    who(c, 'whale', 'shiver', t, 640 + Math.sin(t * 50) * 2.5, 652 + hit * 6, 3, {}, 14);
    const sx = 640 + (n % 2 ? 150 : -150) * (0.6 + rnd(n, 2) * 0.5);
    const yy = u < 0.5 ? 640 : lerp(-80, 640, eIn((u - 0.5) * 2));
    spr(c, 'prop_redshoes', u < 0.5 ? sx : 640 + ((n + 1) % 2 ? 150 : -150) * (0.6 + rnd(n + 1, 2) * 0.5), yy, 7);
    if (u < 0.5) { c.strokeStyle = rgba('#ffffff', 1 - u * 2); c.lineWidth = 5; c.beginPath(); c.ellipse(sx, 646, 40 + u * 260, 8 + u * 40, 0, 0, TAU); c.stroke(); }
    for (let i = 0; i < 8; i++) { const a = lt - i * 0.26; if (a < 0 || a > 0.9) continue; txt(c, '哈', 180 + rnd(i, 5) * 920, 150 + rnd(i, 6) * 260 - a * 40, 44 + rnd(i, 7) * 40, '#ffffff', { rot: (rnd(i, 8) - 0.5) * 0.6, sc: eBack(a / 0.2), a: 1 - seg(a, 0.5, 0.9), w: 900, glow: '#ff2a4a', blur: 16 }); }
    c.restore(); vignette(c, '#000000', 0.45);
  }),

  // 只有你想要拼了命保护我 —— 白色的剪影冲到前面
  sh(94.5, 96.42, ({ c, t, lt }) => {
    bg(c, ['#040a24', '#0d1d55']); for (let i = 0; i < 20; i++) { const u = (t * 2.6 + rnd(i, 2)) % 1; c.fillStyle = 'rgba(255,255,255,.3)'; c.fillRect(-300 + u * 1900, rnd(i, 1) * H, 260, 2.5); }
    who(c, 'whale', 'shiver', t, 800, 650, 3.2, {}, 8);
    const arr = eOut(seg(lt, 0, 0.55)), x = lerp(1460, 560, arr);
    if (lt < 0.55) { for (let g = 3; g >= 1; g--) you(c, 'walk', t, x + g * 70, 650, 3.2, { flip: true, a: 0.22 }, 20); you(c, 'walk', t, x, 650, 3.2, { flip: true }, 20); }
    else { glow(c, x, 510, 240, '#ffffff', 0.35, 'lighter'); you(c, 'idle', t, x, 650, 3.2); }
    const hits = [0.62, 0.86, 1.08, 1.3, 1.52, 1.72];
    let flash = 0;
    hits.forEach((h, i) => {
      const y = 380 + rnd(i, 3) * 230, fly = seg(lt, h - 0.5, h);
      if (lt < h) box(c, lerp(-140, 400, fly), y, 100, 64, '#e0102e', (['x', 'ban', 'dots'] as const)[i % 3], 1, 1, lt * 3 + i);
      else { const a = lt - h; flash += Math.exp(-a * 8); for (let j = 0; j < 7; j++) { c.fillStyle = `rgba(255,${80 + j * 20},${100 + j * 10},${clamp(1 - a * 2.4)})`; c.fillRect(400 - a * (120 + rnd(j, i) * 300), y + (rnd(j, i + 5) - 0.5) * 260 * a + a * a * 200, 10, 10); } }
    });
    c.save(); c.strokeStyle = rgba('#ffffff', clamp(0.25 * seg(lt, 0.5, 0.7) + flash * 0.75)); c.lineWidth = 10 + flash * 8; c.shadowColor = '#9fd2ff'; c.shadowBlur = 30; c.lineCap = 'round'; c.beginPath(); c.arc(800, 500, 390, Math.PI * 0.78, Math.PI * 1.22); c.stroke(); c.restore();
    wash(c, '#ffffff', Math.min(0.3, flash * 0.18));
  }, { fi: 0.2 }),

  // 就算势单力薄 —— 小小的两个，和压下来的影子
  sh(96.42, 98.42, ({ c, t, p }) => {
    bg(c, ['#10000a', '#3a0012', '#8a0d22']); c.save(); cam(c, 1.06 - p * 0.06, 640, 380);
    glow(c, 330, 300, 520, '#ff2a4a', 0.4, 'lighter'); spr(c, 'gpt_boss_rage', 330, 830 + Math.sin(t * 1.4) * 8, 4.8, { sil: '#080003', line: '#ff3a55' });
    const cr: [Who, number][] = [['claude', 60], ['zai', 560], ['doubao', 690], ['gemini', 190], ['qwen', 470]];
    cr.forEach(([ch, x], i) => who(c, ch, 'idle', t + i, x, 700 + (i % 2) * 14, 3.6, { sil: '#140006', line: '#a01028' }));
    c.fillStyle = '#140006'; c.fillRect(-200, 690, 1700, 200); c.fillStyle = 'rgba(255,255,255,.5)'; c.fillRect(760, 690, 600, 2);
    glow(c, 930, 640, 150, '#ffffff', 0.5, 'lighter');
    who(c, 'whale', 'shiver', t, 1010, 690, 1.7, {}, 10); you(c, 'shiver', t, 920 + Math.sin(t * 40), 690, 1.7, {}, 12);
    c.restore(); vignette(c, '#000000', 0.55);
  }),

  // 对我说 你对我说
  sh(98.42, 99.42, ({ c, t, lt, p }) => {
    bg(c, ['#0d1d55', '#3b5fb0']); wash(c, '#ffffff', p * 0.25); glow(c, 400, 400, 460, '#ffffff', 0.45, 'lighter');
    you(c, 'big_idle', t, 400, 770, 4.5); whaleBig(c, t, 900, 770, 4.3);
    const k = Math.max(0.01, eBack(seg(lt, 0.05, 0.4))); c.save(); c.translate(650, 210); c.scale(k, k); c.fillStyle = '#ffffff'; rr(c, -120, -60, 240, 120, 40); c.fill(); c.beginPath(); c.moveTo(-70, 54); c.lineTo(-120, 104); c.lineTo(-20, 58); c.fill(); c.restore();
    for (let i = 0; i < 3; i++) { c.fillStyle = rgba('#3b5fb0', seg(lt, 0.3 + i * 0.15, 0.4 + i * 0.15)); c.beginPath(); c.arc(610 + i * 40, 210, 10, 0, TAU); c.fill(); }
    motes(c, t, 14, '#ffffff', 0.7, 3, 20, 'lighter');
  }, { fi: 0.15 }),

  // 请坚持做自己就好 —— 她的话写在纸上，白光把红色擦掉
  sh(99.42, 104.58, ({ c, t, lt }) => {
    bg(c, ['#0d1d55', '#3b5fb0']);
    c.fillStyle = '#ffffff'; for (let i = 0; i < 16; i++) { const r = eOut(seg(lt, 0.2 + rnd(i, 1) * 1.6, 2.2 + rnd(i, 1) * 1.6)) * 420; if (r > 0) { c.beginPath(); c.arc(rnd(i, 2) * W, rnd(i, 3) * H, r, 0, TAU); c.fill(); } }
    const sk = ss(seg(lt, 3.0, 4.6)); if (sk > 0) { c.save(); c.globalAlpha = sk; sky(c, t, { n: 8, sp: 26 }); c.restore(); }
    rays(c, 640, 330, 14, t * 0.2, '#ffffff', 0.4 * seg(lt, 0.6, 1.6));
    const y = lerp(960, 330, eBack(seg(lt, 0, 0.75))) + Math.sin(t * 1.6) * 6;
    glow(c, 640, y, 520, '#ffffff', 0.7);
    paper(c, 640, y, 660, 190, -0.03, { lines: 0, inner: () => { txt(c, '「', -292, -44, 54, rgba('#3b4a78', 0.7), { font: HAND, w: 400 }); txt(c, '」', 292, 48, 54, rgba('#3b4a78', 0.7), { font: HAND, w: 400 }); handwrite(c, '请坚持做自己就好', 0, 4, 60, '#3b4a78', seg(lt, 0.45, 3.2), HAND); } });
    you(c, 'idle', t, 300, 706, 3);
    shadow(c, 990, 704, 64, 0.1); if (lt < 1.5) who(c, 'whale', 'surprise', lt - 0.4, 990, 706, 3, {}, 8, false); else who(c, 'whale', 'nod', lt, 990, 706, 3, {}, 5);
    for (let i = 0; i < 4; i++) { const u = (lt * 0.5 + i * 0.25) % 1; spr(c, `fx_sparkle_${i % 3}`, 940 + i * 36, 420 - u * 60, 4, { a: Math.sin(u * Math.PI) * seg(lt, 1.6, 2.2), mid: true }); }
    motes(c, t, 20, '#ffffff', 0.8, 9, 30); leak(c, t, '#ffffff', 0.5 * sk);
  }),

  // 我知道 我知道 这些我都知道 —— 眼泪变成泡泡往上飘
  sh(104.58, 108.92, ({ c, t, lt, p }) => {
    sky(c, t, { n: 8, sp: 26 }); c.save(); cam(c, 1.02 + p * 0.05, 640, 400);
    for (let j = 0; j < 2; j++) { c.strokeStyle = 'rgba(255,255,255,.55)'; c.lineWidth = 26 - j * 10; c.lineCap = 'round'; c.beginPath(); for (let x = -40; x <= W + 40; x += 30) { const y = 250 + j * 240 + Math.sin(x * 0.006 + t * 0.9 + j * 2) * 70; if (x === -40) c.moveTo(x, y); else c.lineTo(x, y); } c.stroke(); }
    glow(c, 380, 430, 400, '#ffffff', 0.6); you(c, 'big_idle', t, 380, 776, 4.4);
    const nod = [0.3, 1.3, 2.6].reduce((a, s) => a + Math.sin(clamp((lt - s) / 0.5) * Math.PI) * 16, 0);
    whaleBig(c, t, 860, 776 + nod, 4.4);
    for (let i = 0; i < 9; i++) { const u = (lt * 0.3 + i / 9) % 1; bubble(c, 860 + (i % 2 ? 80 : -70) + Math.sin(u * 7 + i) * 30, 440 - u * 420, 6 + u * 18, 1 - u * 0.7); }
    c.restore(); leak(c, t, '#ffffff', 0.6); motes(c, t, 16, '#ffffff', 0.9, 2, 30);
  }, { fi: 0.3 }),

  // 每一个脆弱的瞬间 —— 一只只泡泡里是那些时候的她
  sh(108.92, 111.0, ({ c, t, lt }) => {
    sky(c, t, { n: 6, sp: 20, sea: 620 });
    MEM.forEach(([x, y, r, col, act], i) => memBubble(c, t, x, y, r, col, act, eBack(seg(lt, i * 0.3, 0.5 + i * 0.3)), 0, i === 1));
    for (let i = 0; i < 8; i++) bubble(c, 100 + rnd(i, 1) * 1080, 120 + rnd(i, 2) * 440 + Math.sin(t + i) * 10, 10 + rnd(i, 3) * 22, 0.8);
    who(c, 'whale', 'idle', t, 640, 700, 3); reflect(c, 700, () => who(c, 'whale', 'idle', t, 640, 700, 3));
  }),

  // 都有你陪在我身旁 —— 每只泡泡里都多了一个白色的人
  sh(111.0, 114.33, ({ c, t, lt }) => {
    sky(c, t, { n: 6, sp: 20, sea: 620 });
    MEM.forEach(([x, y, r, col, act], i) => memBubble(c, t, x, y, r, col, act, 1, ss(seg(lt, 0.2 + i * 0.5, 0.8 + i * 0.5)), i === 1));
    for (let i = 0; i < 8; i++) bubble(c, 100 + rnd(i, 1) * 1080, 120 + rnd(i, 2) * 440 + Math.sin(t + i) * 10, 10 + rnd(i, 3) * 22, 0.8);
    const k = eBack(seg(lt, 1.7, 2.2)), wx = lerp(640, 710, ss(seg(lt, 1.5, 2.1)));
    const pair = () => { who(c, 'whale', lt > 2.3 ? 'hop' : 'idle', t, wx, 700, 3, {}, 10); if (k > 0) you(c, lt > 2.3 ? 'hop' : 'idle', t + 0.1, 570, 700, 3 * k, {}, 10); };
    reflect(c, 700, pair); glow(c, 640, 560, 260 * k, '#ffffff', 0.5 * k); pair();
    for (let i = 0; i < 5; i++) { const u = (lt * 0.5 + i * 0.2) % 1; spr(c, 'fx_heart', 560 + i * 40, 400 - u * 70, 4, { a: Math.sin(u * Math.PI) * seg(lt, 2.2, 2.6), mid: true }); }
  }),

  // 这世界 因为有你存在 —— 颜色从她脚下漫开
  sh(114.33, 117.17, ({ c, t, lt }) => {
    sky(c, t, { n: 5, sp: 16, cols: ['#4aa6f5', '#9adcff', '#e6f8ff'] });
    const gx = 640, gy = 520, r = 230, R = eOut(seg(lt, 0.3, 2.3)) * 560;
    globe(c, gx, gy, r, { sea: '#cdd4e0', land: '#a9b2c3', line: '#ffffff', rot: t * 0.03, shade: 0.2 });
    c.save(); c.beginPath(); c.arc(gx - 36, gy - r, R, 0, TAU); c.clip(); globe(c, gx, gy, r, { sea: '#4fb2f7', land: '#8fe0a2', line: '#ffffff', rot: t * 0.03, shade: 0.2 }); c.restore();
    c.strokeStyle = rgba('#ffffff', 1 - seg(lt, 0.3, 2.3)); c.lineWidth = 6; c.beginPath(); c.arc(gx - 36, gy - r, R, 0, TAU); c.stroke();
    for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * 0.27; if (Math.abs(i - 4) < 1) continue; c.save(); c.translate(gx + Math.cos(a) * r, gy + Math.sin(a) * r); c.rotate(a + Math.PI / 2); sprout(c, 0, 0, seg(lt, 0.5 + Math.abs(i - 4) * 0.3, 1.2 + Math.abs(i - 4) * 0.3), '#6fcf80', ['#ffd0dc', '#fff0a8', '#ffffff'][i % 3]); c.restore(); }
    for (let i = 0; i < 3; i++) cloud(c, gx + Math.cos(t * 0.3 + i * 2.1) * (r + 90), gy + Math.sin(t * 0.3 + i * 2.1) * 60 - 20, 44, '#ffffff', 0.9, i);
    glow(c, gx - 36, gy - r - 80, 170, '#ffffff', 0.7); you(c, 'idle', t, gx - 40, gy - r + 6, 2.3);
    who(c, 'whale', lt > 1.2 ? 'hop' : 'idle', t, gx + 50, gy - r + 6, 2.3, {}, 10);
    for (let i = 0; i < 10; i++) star4(c, 200 + rnd(i, 1) * 880, 100 + rnd(i, 2) * 480, 16 * seg(lt, 0.8, 2), '#ffffff', Math.abs(Math.sin(t * 3 + i)), t + i);
  }, { fi: 0.15 }),

  // 漆黑的夜中透出了一点点微光
  sh(117.17, 122.83, ({ c, t, lt }) => {
    sky(c, t, { n: 5, sp: 16 }); wash(c, '#03040f', ss(seg(lt, 0, 0.6)) * 0.98); stars(c, t, 40, 6, 0.25 * seg(lt, 2, 5));
    const li = ss(seg(lt, 0.9, 4.6));
    who(c, 'whale', 'idle', t, 770, 640, 3.2, { tint: '#03040f', ta: 0.9 - li * 0.6 });
    you(c, 'idle', t, 540, 640, 3.2, { a: li * 0.6 });
    glow(c, 560, 470, 10 + li * 210, '#dff3ff', 0.35 + li * 0.5, 'lighter'); star4(c, 560, 470, 6 + li * 30 + kick(t) * 6, '#ffffff', seg(lt, 0.9, 1.2), t * 0.6);
    const n = Math.floor(seg(lt, 1.8, 5.2) * 18);
    for (let i = 0; i < n; i++) { const x = 200 + rnd(i, 1) * 880 + Math.sin(t * 0.7 + i) * 30, y = 160 + rnd(i, 2) * 420 + Math.cos(t * 0.9 + i * 2) * 20; glow(c, x, y, 8 + rnd(i, 3) * 14, '#cfeaff', 0.5 + 0.4 * Math.sin(t * 3 + i), 'lighter'); }
    if (lt > 5.15) { const f = Math.floor(t * 24); for (let i = 0; i < 16; i++) { c.fillStyle = ['rgba(255,60,90,.55)', 'rgba(60,220,255,.55)', 'rgba(255,255,255,.6)'][i % 3]; c.fillRect(rnd(i, f) * W - 200, rnd(i, f + 1) * H, 200 + rnd(i, f + 2) * 600, 2 + rnd(i, f + 3) * 12); } }
  }),

  // 早就应该习惯 —— 茶会还没散
  sh(122.83, 125.25, ({ c, t, lt }) => {
    const table = partyRoom(c, t, (i) => 0.75 + 0.25 * Math.sin(t * 2 + i));
    who(c, 'zai', 'doze', t, 190, 640, 2.9, {}, 5); spr(c, `fx_zzz_${Math.floor(t * 3) % 3}`, 250, 400, 4, { mid: true });
    who(c, 'qwen', 'idle', t, 340, 640, 2.9); who(c, 'claude', 'idle', t, 950, 640, 2.9); who(c, 'kimi', 'think', t, 1100, 640, 2.9, {}, 5);
    glow(c, 640, 460, 240, '#ffe9b0', 0.22, 'lighter'); who(c, 'whale', 'idle', t, 640, 644, 3.3);
    table(); vignette(c, '#0a0820', 0.5); wash(c, '#0a0820', 1 - seg(lt, 0, 0.5));
  }),

  // 忽明忽暗酒阑人散 —— 灯一盏盏灭，人一个个走
  sh(125.25, 129.67, ({ c, t, lt, p }) => {
    const table = partyRoom(c, t, (i) => (i === 6 ? 1 : lt < 0.6 + rnd(i, 3) * 3 ? (rnd(Math.floor(t * 11), i) > 0.3 ? 1 : 0.15) : 0), 1 - p);
    const leave = (ch: Who, x: number, dir: number, bowAct: string, t0: number, sc = 2.9) => {
      const a = 1 - seg(lt, t0 + 1.4, t0 + 2.8) * 0.75;
      if (lt < t0) who(c, ch, 'idle', t, x, 640, sc); else if (lt < t0 + 0.95) who(c, ch, bowAct, lt - t0, x, 640, sc, {}, 9, false);
      else spr(c, walkF(ch, t), x + dir * (lt - t0 - 0.95) * 190, 640, sc, { flip: dir < 0, a, tint: '#0a0820', ta: seg(lt, t0 + 1, t0 + 2.4) * 0.6 });
    };
    leave('zai', 190, -1, 'alert', 0.2); leave('qwen', 340, -1, 'bow', 0.9); leave('claude', 950, 1, 'curtsy', 0.5); leave('kimi', 1100, 1, 'bow', 1.5);
    glow(c, 640, 460, 240, '#ffe9b0', 0.22, 'lighter'); who(c, 'whale', 'idle', t, 640, 644, 3.3);
    table(); wash(c, '#0a0820', ss(seg(lt, 0.8, 4)) * 0.5); glow(c, 640, 420, 300, '#ffe9b0', 0.2 * p, 'lighter'); vignette(c, '#0a0820', 0.5 + p * 0.3);
  }),

  // 可是我 还是想要守护这 —— 把装着「你」的泡泡护在光圈里
  sh(129.67, 135.83, ({ c, t, lt, p }) => {
    sky(c, t, { n: 7, sp: 40, sea: 620 }); c.save(); cam(c, 1.03 + p * 0.07, 660, 400);
    for (let i = 0; i < 16; i++) { const u = (t * 0.9 + rnd(i, 2)) % 1; c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(W + 200 - u * 1800, 60 + rnd(i, 1) * 520, 160 + rnd(i, 3) * 160, 3); }
    const bx = 830 + Math.sin(t * 0.8) * 22, by = 350 + Math.sin(t * 1.1) * 14, r = 128;
    const minis: [number, number, number, (x: number, y: number) => void][] = [[250, 230, 60, (x, y) => guitar(c, x - 8, y, 0.42, -0.6, t, 0)], [400, 110, 46, (x, y) => cup(c, x, y + 24, 0.9, 0)], [1090, 190, 54, (x, y) => paper(c, x, y, 50, 62, 0.15, { lines: 10 })], [1130, 470, 48, (x, y) => spr(c, 'prop_bowl', x, y + 22, 3.4)], [560, 200, 40, (x, y) => note(c, x - 6, y + 14, 1.3, '#7fb4ee', 1, 1)]];
    minis.forEach(([x, y, rr0, fn], i) => { const xx = x + Math.sin(t * 0.7 + i) * 14, yy = y + Math.cos(t * 0.9 + i) * 10; fn(xx, yy); bubble(c, xx, yy, rr0); });
    glow(c, bx, by, 240, '#ffffff', 0.55); you(c, 'idle', t, bx, by + 96, 2.3); bubble(c, bx, by, r);
    const h = ss(seg(lt, 1.8, 3.2));
    if (h > 0) { c.save(); c.translate(bx, by); c.rotate(t * 0.5); c.strokeStyle = rgba('#ffffff', 0.9 * h); c.lineWidth = 6; c.shadowColor = '#fff3b0'; c.shadowBlur = 24; c.setLineDash([46, 18]); c.beginPath(); c.arc(0, 0, r + 30 + kick(t) * 8, 0, TAU * h); c.stroke(); c.restore(); for (let i = 0; i < 6; i++) star4(c, bx + Math.cos(t * 0.5 + i) * (r + 30), by + Math.sin(t * 0.5 + i) * (r + 30), 16 * h, '#ffffff', h, t); }
    const wh = () => { if (lt < 1.6) who(c, 'whale', 'idle', t, 520, 690, 3.4); else who(c, 'whale', 'point', lt - 1.6, 520, 690, 3.4, {}, 8, false); };
    reflect(c, 690, wh); wh(); c.restore(); leak(c, t, '#ffffff', 0.5);
  }, { fi: 0.35 }),

  // 短暂的羁绊 —— 一根打了结的线，泡泡一只只破掉
  sh(135.83, 142.5, ({ c, t, lt }) => {
    sky(c, t, { n: 8, sp: 10, sea: 540, cols: ['#3d9cf2', '#8ad4ff', '#eafaff'] });
    c.save(); cam(c, lerp(1.3, 1, eOut(seg(lt, 0, 5))), 640, 470);
    for (let i = 0; i < 18; i++) {
      const x = 130 + rnd(i, 1) * 1020, y = 110 + rnd(i, 2) * 330 + Math.sin(t * 0.8 + i) * 10, r = 16 + rnd(i, 3) * 34, pt = 1.2 + rnd(i, 4) * 4.8, a = lt - pt;
      if (a < 0) bubble(c, x, y, r); else if (a < 0.5) { c.strokeStyle = rgba('#ffffff', 1 - a * 2); c.lineWidth = 3; c.beginPath(); c.arc(x, y, r + a * 50, 0, TAU); c.stroke(); for (let j = 0; j < 6; j++) { c.fillStyle = rgba('#ffffff', 1 - a * 2); c.fillRect(x + Math.cos(j) * (r + a * 90), y + Math.sin(j) * (r + a * 90), 4, 4); } }
    }
    const A = 520, B = 760, y = 560, pair = () => { who(c, 'whale', 'idle', t, A, y, 2.1); you(c, 'idle', t + 0.4, B, y, 2.1); };
    reflect(c, y, pair, 0.3); glow(c, 640, 480, 260, '#ffffff', 0.5); pair();
    c.save(); c.strokeStyle = '#ffffff'; c.lineWidth = 4 + kick(t) * 2; c.shadowColor = '#ffb3c7'; c.shadowBlur = 16; c.lineCap = 'round';
    c.beginPath(); c.moveTo(A + 40, 500); c.quadraticCurveTo(590, 520 + Math.sin(t * 2) * 6, 640, 492); c.quadraticCurveTo(690, 520 + Math.sin(t * 2 + 1) * 6, B - 40, 500); c.stroke();
    for (const d of [-1, 1]) { c.beginPath(); c.ellipse(640 + d * 22, 478, 22, 12, d * 0.5, 0, TAU); c.stroke(); c.beginPath(); c.moveTo(640, 492); c.lineTo(640 + d * 14, 522); c.stroke(); }
    c.restore(); star4(c, 640, 490, 20 + kick(t) * 14, '#ffffff', 0.9, t);
    c.restore(); leak(c, t, '#ffffff', 0.45); wash(c, '#ffffff', ss(seg(lt, 5.3, 6.67)));
  }),

  // 间奏二：四季。她往前走，像素里的本鲸越来越远
  sh(142.5, 159.67, ({ c, t, lt, d }) => {
    const q = lt / d, si = Math.min(3, Math.floor(q * 4)), sp = q * 4 - si, nx = Math.min(3, si + 1), bl = ss(seg(sp, 0.8, 1));
    const A = SEASON[si], B = SEASON[nx];
    bg(c, [mix(A.sky[0], B.sky[0], bl), mix(A.sky[1], B.sky[1], bl)]); glow(c, 1040, 110, 420, '#ffffff', 0.7);
    for (let i = 0; i < 4; i++) cloud(c, (((rnd(i, 1) * 1700 - t * 12) % 1700) + 1700) % 1700 - 200, 120 + rnd(i, 2) * 160, 70, '#ffffff', 0.8, i);
    for (let i = 0; i < 6; i++) { const x = (((i * 300 - lt * 70) % 1800) + 1800) % 1800 - 250; c.fillStyle = mix(mix(A.ground, B.ground, bl), '#ffffff', 0.35); c.beginPath(); c.ellipse(x, 640, 260, 110 + (i % 3) * 30, 0, Math.PI, 0); c.fill(); }
    for (let i = 0; i < 6; i++) { const x = (((i * 290 - lt * 150) % 1740) + 1740) % 1740 - 220, hh = 170 + (i % 3) * 30; c.fillStyle = '#b08a6a'; c.fillRect(x - 8, 616 - hh, 16, hh); c.fillStyle = mix(A.leaf, B.leaf, bl); c.beginPath(); c.arc(x, 600 - hh, 66, 0, TAU); c.arc(x - 44, 630 - hh, 46, 0, TAU); c.arc(x + 46, 628 - hh, 48, 0, TAU); c.fill(); }
    c.fillStyle = mix(A.ground, B.ground, bl); c.fillRect(0, 614, W, 106); c.fillStyle = 'rgba(255,255,255,.55)'; c.fillRect(0, 614, W, 5);
    for (let i = 0; i < 12; i++) { const x = (((i * 130 - lt * 190) % 1560) + 1560) % 1560 - 140; c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(x, 664, 60, 6); }
    const pc = mix(A.part, B.part, bl);
    for (let i = 0; i < 46; i++) { const x = (((rnd(i, 3) * W - t * (40 + rnd(i, 4) * 60)) % W) + W) % W, y = (rnd(i, 5) * H + t * (50 + rnd(i, 6) * 70)) % H; c.save(); c.translate(x, y); c.rotate(t * 2 * (rnd(i, 7) - 0.5) + i); c.fillStyle = pc; c.globalAlpha = 0.85; if (si === 2 && bl < 0.5 || si === 1 && bl >= 0.5) { c.beginPath(); c.arc(0, 0, 3 + rnd(i, 8) * 3, 0, TAU); c.fill(); } else if (si === 0 && bl < 0.5) { c.globalAlpha = 0.5; c.beginPath(); c.arc(0, 0, 2 + rnd(i, 8) * 3, 0, TAU); c.fill(); } else { c.beginPath(); c.ellipse(0, 0, 8, 4, 0, 0, TAU); c.fill(); } c.restore(); }
    for (let i = 0; i < 4; i++) { const a = lt - (i + 0.85) * (d / 4); if (a > -0.6 && a < 2.2) calPage(c, lerp(1400, -120, (a + 0.6) / 2.8), 300 + Math.sin(a * 3) * 40, 1.5, a * 2, ['#7cc0ff', '#f2994a', '#9fb6d9', '#ff9cb8'][i], 0.95); }
    // 像素世界的小窗
    const k = lerp(1, 0.3, ss(q)), cx = lerp(900, 1160, q), cy = lerp(250, 130, q) + Math.sin(t * 1.2) * 8;
    c.save(); c.strokeStyle = rgba('#ffffff', lerp(0.9, 0.2, q)); c.lineWidth = 3; c.setLineDash([6, 8 + q * 30]); c.beginPath(); c.moveTo(470, 470); c.quadraticCurveTo(640, 250, cx - 150 * k, cy + 60 * k); c.stroke(); c.restore();
    card(c, cx, cy, 380 * k, 260 * k, Math.sin(t * 0.8) * 0.05, (w, h) => {
      c.fillStyle = '#bfe4ff'; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(255,255,255,.35)'; for (let gx = 0; gx < w; gx += 12 * k + 4) for (let gy = (Math.floor(gx) % 2) * 8; gy < h; gy += 16) c.fillRect(gx, gy, 6, 6);
      who(c, 'whale', lt % 5 < 3 ? 'wave' : 'sway', t, w / 2, h - 4, 2.5 * k);
      for (let i = 0; i < 3; i++) { const u = (lt * 0.5 + i / 3) % 1; note(c, w * 0.2 + i * w * 0.3, h * 0.5 - u * h * 0.4, k * 1.1, '#ffffff', Math.sin(u * Math.PI), i); }
    }, { pixel: true });
    you(c, 'walk', t, 430, 618, lerp(3, 3.5, q), {}, 10);
    leak(c, t, '#ffffff', 0.4); wash(c, '#ffffff', ss(seg(lt, d - 0.7, d)) * 0.9);
  }, { fi: 1.2 }),
];
void fr;
