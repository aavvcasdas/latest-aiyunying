// 分镜：一句词一个画面。按歌词的意思重新搭景，不照搬任何现成 MV 的元素。
import { View, LOOKS, cam, glide, ease, easeOut, easeIn, easeInOut, backOut, bounceOut, seg, tri, hash, lerp, clamp01, clamp, mix, lighten, darken, actor, sprite, ball, glow, hill, cloud, tree, flower, cube, poly, ribbon, groundPath, house, lantern, disc, lookMix, type V3, type Cam, type Look } from './engine';
import { actFrame, walkFrame, frontFrame, type CharId } from './atlas';
import { LINES, INTERLUDE, VOCAL_END, SONG_END, BEAT, type BeatInfo } from './timing';
import { type Frame, wordK, wordT, backdrop, grass, fireflies, petals, windStreak, shootingStar, birds, littleWorld, WORLD_ALL, WORLD, PASTEL, BOOKS, type WorldK } from './sets';

export type { Frame } from './sets';

export interface Shot {
  id: string;
  start: number;
  end: number;
  look: Look | ((f: Frame) => Look);
  render: (f: Frame) => void;
  line?: number; // 这一镜属于第几句歌词
}

const breathe = (c: Cam, t: number): Cam => ({
  pos: [c.pos[0] + Math.sin(t * 0.37) * 0.06, c.pos[1] + Math.sin(t * 0.29) * 0.04, c.pos[2]],
  look: c.look,
  fov: c.fov,
});
function setCam(f: Frame, A: Cam, B: Cam, k?: number) {
  f.v.setCam(breathe(glide(A, B, k ?? easeInOut(f.u)), f.t));
}
const walkFps = 8 / (2 * BEAT); // 一个步态循环 = 两拍
const strollFps = walkFps / 2; // 慢慢走：一个循环 = 四拍

const fx = (v: View, name: string, p: V3, h = 0.5, o: { alpha?: number; flip?: boolean } = {}) => sprite(v, p, name, h, { noFog: true, tintA: 0, shadow: false, ...o } as never);
const fxSeq = (v: View, prefix: string, n: number, t: number, p: V3, h = 0.5, fps = 6) => fx(v, `${prefix}_${Math.floor(t * fps) % n}`, p, h);

// ---------------------------------------------------------------
// 1. 慌啥子嘛 慢慢来 —— 山坡：本鲸一路小跑，豆包坐在坡上等她慢下来
// ---------------------------------------------------------------
function sceneHill(f: Frame, variant: 'dusk' | 'night' | 'dawn') {
  const { v, t, u, beat } = f;
  const L = v.look;
  if (variant === 'dusk') {
    const t0 = 7.44,
      t1 = LINES[1].start - 0.12;
    const uu = clamp01((t - t0) / (t1 - t0));
    setCam(f, cam([4.2, 2.6, 10.5], [1.8, 1.3, -0.6], 42), cam([0.4, 2.1, 8.2], [-0.6, 1.25, -0.8], 40), easeInOut(uu));
    backdrop(f, { sun: [-26, 5 - uu * 3, -80], sunR: 5.5, sunColor: '#ffc27a', clouds: 5 });
  } else if (variant === 'night') {
    setCam(f, cam([0, 2.4, 10], [0, 1.3, -1], 44), cam([-1, 2.2, 9], [-0.5, 1.3, -1], 42));
    backdrop(f, { moon: [14, 11, -70], moonR: 3.2, clouds: 3, cloudGlow: '#dfe8ff' });
    fireflies(f, 18, { x: [-9, 9], y: [0.4, 3.5], z: [-6, 3] });
  } else {
    setCam(f, cam([0, 2.0, 9.5], [0, 1.5, -2], 44), cam([0, 2.6, 12], [0, 1.7, -3], 46));
    const sunY = lerp(-1.5, 5, easeOut(u));
    backdrop(f, { sun: [6, sunY, -80], sunR: 5.5, sunColor: '#ffd27a', clouds: 4 });
    birds(f, 5, { y: 8, speed: 1.2 });
  }
  // 近坡与树
  hill(v, [-2.6, 0, -2.4], 3.4, 1.05, mix(L.ground[0], '#9ad08a', 0.25));
  tree(v, [-6.8, 0, -4], 2.3, { leaf: mix('#7bb86e', L.ground[0], 0.3), sway: Math.sin(t * 0.8) * 0.3 });
  tree(v, [7.5, 0, -7.5], 1.9, { leaf: mix('#85c08a', L.ground[1], 0.3), sway: Math.sin(t * 0.7 + 1) * 0.3 });
  for (let i = 0; i < 26; i++) {
    const x = hash(i, 61) * 18 - 9,
      z = hash(i, 62) * 5 - 1.5;
    flower(v, [x, 0, z], 0.45 + hash(i, 63) * 0.3, PASTEL[i % PASTEL.length], 1, { sway: Math.sin(t * 1.5 + i) * 0.25, glow: variant === 'night' });
  }
  for (let i = 0; i < 14; i++) grass(f, [hash(i, 64) * 16 - 8, 0, hash(i, 65) * 5 - 1], 0.5, Math.sin(t * 1.4 + i) * 0.4);

  if (variant === 'dusk') {
    // 本鲸：冲进来 → 原地打转 → 「慢慢来」时慢下来 → 停住
    const tSlow = LINES[0].chars[4].t; // 慢
    const tStop = tSlow + 1.15;
    let x: number, frame: string, flip = false;
    let bob = 0;
    if (t < 12.4) {
      const k = clamp01((t - 8.2) / 4.2);
      x = lerp(9.5, 1.4, k);
      frame = walkFrame('whale', t, 15);
      bob = Math.abs(Math.sin(t * 15 * Math.PI / 4)) * 0.12;
    } else if (t < tSlow) {
      const k = (t - 12.4) * 2.4;
      x = 1.4 + Math.sin(k) * 0.55;
      flip = Math.cos(k) > 0;
      frame = walkFrame('whale', t, 15);
      bob = Math.abs(Math.sin(t * 15 * Math.PI / 4)) * 0.12;
    } else if (t < tStop) {
      const k = clamp01((t - tSlow) / (tStop - tSlow));
      const fps = lerp(15, 3, ease(k));
      x = lerp(1.4 + Math.sin((tSlow - 12.4) * 2.4) * 0.55, 1.0, ease(k));
      frame = walkFrame('whale', tSlow + (t - tSlow) * (fps / 15) * 1.6, 15);
      bob = Math.abs(Math.sin(t * fps * Math.PI / 4)) * 0.12 * (1 - k);
    } else {
      x = 1.0;
      frame = actFrame('whale', 'idle', t, 6);
    }
    const p: V3 = [x, 0, 0.2];
    actor(v, 'whale', p, frame, { flip });
    // 背上的三个箱子：跑的时候一颠一颠，停下来就稳稳落着
    const heavy = t < tStop ? 1 : 0;
    for (let i = 0; i < 3; i++) {
      const by = 1.05 + i * 0.58 + bob * (1 + i * 0.4) * heavy;
      cube(v, [x + (flip ? -0.28 : 0.28), by, -0.1], 0.56, 0.52, 0.5, BOOKS[i + 1], { rot: Math.sin(t * 9 + i) * 0.08 * heavy });
    }
    if (t < tSlow && t > 9) fx(v, 'fx_sweat', [x - 0.55, 2.05 + bob, 0.3], 0.42);
    if (t >= tStop) {
      const k = clamp01((t - tStop) / 0.8);
      fx(v, `fx_sparkle_${Math.floor(t * 6) % 3}`, [x + 0.6, 2.1 + k * 0.4, 0.3], 0.42, { alpha: 1 - k });
    }
    // 豆包在坡顶：唱到「慌啥子嘛」点头，「慢慢来」踩着拍子
    let df: string;
    if (t < LINES[0].start) df = frontFrame('doubao', t);
    else if (t < tSlow) df = actFrame('doubao', 'nod', t, 7);
    else df = actFrame('doubao', 'step', t, walkFps / 2);
    actor(v, 'doubao', [-2.6, 1.02, -2.4], df);
    if (t > LINES[0].start && t < tSlow) fx(v, 'fx_exclaim', [-2.1, 2.9, -2.4], 0.4);
  } else if (variant === 'night') {
    // 一行人慢慢走：豆包领路，本鲸不再赶
    const order: CharId[] = ['doubao', 'whale', 'gemini', 'kimi', 'claude', 'qwen', 'zai'];
    order.forEach((id, i) => {
      const x = 5.5 + i * 1.45 - f.dt * 0.5 - 2.5;
      const z = 0.3 + Math.sin(i * 1.3) * 0.5;
      actor(v, id, [x, 0, z], walkFrame(id, t, strollFps, i * 2));
    });
    actor(v, 'gpt', [Math.sin(t * 0.4) * 6, 5.2 + Math.sin(t * 1.1) * 0.3, -9], actFrame('gpt', 'hover', t, 8), { flip: Math.cos(t * 0.4) > 0 });
  } else {
    // 黎明：两个人在坡顶看日出，朋友们慢慢聚拢
    actor(v, 'whale', [-3.0, 1.0, -2.4], actFrame('whale', 'idle', t, 6));
    actor(v, 'doubao', [-2.0, 1.03, -2.4], t > wordT(f, 4) ? actFrame('doubao', 'nod', t, 6) : frontFrame('doubao', t));
    const arrive = (id: CharId, from: V3, to: V3, delay: number, flip: boolean) => {
      const k = ease(clamp01((f.dt - delay) / 2.2));
      const p: V3 = [lerp(from[0], to[0], k), 0, lerp(from[2], to[2], k)];
      actor(v, id, p, k < 1 ? walkFrame(id, t, strollFps) : frontFrame(id, t), { flip: k < 1 ? flip : false });
    };
    arrive('claude', [-9, 0, 1.5], [-4.6, 0, 0.6], 0.2, true);
    arrive('kimi', [-9.5, 0, 2.5], [-6.0, 0, 1.6], 0.8, true);
    arrive('gemini', [9, 0, 1.2], [3.2, 0, 0.2], 0.1, false);
    arrive('qwen', [9.5, 0, 2.4], [5.0, 0, 1.2], 0.9, false);
    arrive('zai', [10, 0, 3.2], [6.6, 0, 2.2], 1.4, false);
    actor(v, 'gpt', [8 - f.dt * 1.2, 6.5 + Math.sin(t) * 0.3, -16], actFrame('gpt', 'hover', t, 8));
  }
  void beat;
}

// ---------------------------------------------------------------
// 2. 太阳下山有月亮爬上来 —— 龙娘送太阳下山，Kimi 坐着月亮升起
// ---------------------------------------------------------------
function sceneSunMoon(f: Frame, variant: 'set' | 'wheel' | 'rise') {
  const { v, t, u, beat } = f;
  setCam(f, cam([0, 1.6, 10], [0, 3.4, -10], 50), cam([0, 1.9, 9.5], [0, 3.9, -10], 48));
  const kSun = ease(seg(u, 0, 0.75));
  const kMoon = ease(Math.max(wordK(f, 4, 2.2), seg(u, 0.35, 0.95)));
  let sun: V3, moon: V3;
  if (variant === 'set') {
    sun = [-11, lerp(6.5, -0.6, kSun), -30];
    moon = [11, lerp(-1.5, 8.5, kMoon), -32];
  } else if (variant === 'rise') {
    moon = [-11, lerp(6.5, -0.6, kSun), -32];
    sun = [11, lerp(-1.5, 8.5, kMoon), -30];
  } else {
    // 天上的大圈：太阳沿左边落下去，月亮沿右边升上来
    const th = lerp(0.3, 0.98, easeInOut(u)) * Math.PI;
    sun = [-Math.cos(th) * 13, -2.5 + Math.sin(th) * 11, -32];
    const ph = (th - 0.3 * Math.PI) * 0.75;
    moon = [Math.cos(ph) * 13, -2.5 + Math.sin(ph) * 11, -32];
  }
  const sunVisible = sun[1] > -2.5;
  backdrop(f, { sun: sunVisible ? sun : null, sunR: 2.9, sunColor: variant === 'set' ? mix('#ffd98a', '#ff9c6b', kSun) : '#ffd98a', moon: moon[1] > -2.5 ? moon : null, moonR: 2.3, clouds: 4, cloudY: 5, stars: variant === 'wheel' ? 1 : variant === 'set' ? u : 1 - u });
  if (variant === 'wheel') {
    // 一轮天上的大圈：太阳月亮轮流上来
    const pts: V3[] = [];
    for (let i = 0; i <= 40; i++) {
      const a = (i / 40) * Math.PI;
      pts.push([-Math.cos(a) * 13, -2.5 + Math.sin(a) * 11, -32]);
    }
    ribbon(v, pts, '#ffffff', 0.08, { alpha: 0.18, noFog: true });
  }
  // Kimi 坐在月亮上：月亮升到位时她开心跳一下
  if (moon[1] > -2.5) {
    const hop = wordK(f, 7, 1.2) > 0 && wordK(f, 7, 1.2) < 1;
    const kf = hop ? actFrame('kimi', 'hop', t, 8) : actFrame('kimi', 'idle', t, 5);
    actor(v, 'kimi', [moon[0] - 0.2, moon[1] + 2.1, moon[2] + 0.3], kf, { shadow: false, noFog: true, tintA: 0.05, zBias: 498 });
  }
  // 龙娘：绕着太阳飞，护送它下山（或抬着它上来）
  if (sunVisible) {
    const side = variant === 'rise' ? -1 : 1;
    const gp: V3 = [sun[0] + side * 3.6 + Math.sin(t * 1.2) * 0.4, sun[1] + 1.6 + Math.sin(t * 1.7) * 0.5, sun[2] + 1];
    actor(v, 'gpt', gp, actFrame('gpt', 'hover', t, 9), { shadow: false, noFog: true, flip: variant === 'rise', tintA: 0.05, zBias: 497 });
    // 光迹
    const trail: V3[] = [];
    for (let i = 0; i < 10; i++) trail.push([gp[0] + side * i * 0.55, gp[1] + 0.6 + Math.sin(t * 3 + i) * 0.15, gp[2]]);
    ribbon(v, trail, '#fff1c4', 0.16, { alpha: 0.45, taper: true, noFog: true, zBias: 497.5 });
  }
  // 地面上看天的人
  hill(v, [0, 0, -4], 7, 1.4, mix(v.look.ground[0], '#8ec98a', 0.2));
  actor(v, 'whale', [-1.1, 1.35, -4], frontFrame('whale', t), { scale: 1 });
  actor(v, 'doubao', [0.4, 1.38, -4], t > wordT(f, 4) ? actFrame('doubao', 'tilt', t, 6) : frontFrame('doubao', t));
  if (variant !== 'set') actor(v, 'zai', [2.0, 1.3, -4], actFrame('zai', 'doze', t, 4));
  // 「上来」那一下给月亮一圈光
  const ring = wordK(f, 9, 1.0);
  if (ring > 0 && ring < 1) glow(v, [moon[0], moon[1], moon[2] + 0.5], 2.3 + ring * 4, '#fff6d8', (1 - ring) * 0.5, { zBias: 498 });
  void beat;
}

// ---------------------------------------------------------------
// 3. 云会在 花会开 —— 云一朵朵冒出来，花从猫的脚边一圈圈开出去
// ---------------------------------------------------------------
function sceneCloudsFlowers(f: Frame, variant: 'dusk' | 'night' | 'morning') {
  const { v, t, beat } = f;
  setCam(f, cam([0, 1.35, 7.2], [0, 1.3, -1], 44), cam([0.5, 1.55, 6.6], [0.3, 1.35, -1], 42));
  const L = v.look;
  backdrop(f, { clouds: 0, moon: variant === 'night' ? [9, 10, -60] : null, moonR: 2.6, sun: variant === 'morning' ? [-10, 9, -80] : variant === 'dusk' ? [-20, 2.5, -80] : null, sunR: 4, sunColor: '#ffd48a' });
  const cloudPos: V3[] = [
    [-6.5, 5.6, -16],
    [1.2, 6.8, -20],
    [7.2, 5.2, -15],
    [-2.5, 8, -26],
    [4.5, 8.6, -30],
  ];
  const cc = mix(lighten(L.sky[2], 0.5), L.sky[1], 0.2);
  cloudPos.forEach((p, i) => {
    const k = backOut(wordK(f, Math.min(i, 2), 0.6) * (i < 3 ? 1 : 1) - (i >= 3 ? 0.0 : 0));
    const kk = i < 3 ? k : backOut(wordK(f, 2, 0.9));
    if (kk <= 0) return;
    cloud(v, [p[0] + Math.sin(t * 0.3 + i) * 0.4, p[1], p[2]], 1.5 + hash(i, 9) * 0.6, cc, { scale: kk, glowColor: variant === 'night' ? '#dfe8ff' : undefined });
  });
  // 花田：从猫的位置一圈圈开
  const gx = 0.7,
    gz = -0.6;
  const tFlower = wordT(f, 3);
  for (let i = 0; i < 90; i++) {
    const x = hash(i, 71) * 17 - 8.5;
    const z = hash(i, 72) * 9 - 6;
    const d = Math.hypot(x - gx, z - gz);
    const b = clamp01((t - tFlower - d * 0.11) / 0.55);
    const col = variant === 'night' ? ['#ffc3e1', '#d9c8ff', '#fff1b8', '#bfe3ff'][i % 4] : PASTEL[i % PASTEL.length];
    flower(v, [x, 0, z], (0.5 + hash(i, 73) * 0.4) * (1 + 0.05 * beat.pulse), col, b, { glow: variant === 'night', sway: Math.sin(t * 1.6 + i) * 0.25 });
  }
  for (let i = 0; i < 12; i++) grass(f, [hash(i, 74) * 14 - 7, 0, hash(i, 75) * 5 - 2.5], 0.45, Math.sin(t * 1.3 + i) * 0.4);
  const bloomed = t > tFlower;
  actor(v, 'gemini', [gx, 0, gz], bloomed ? actFrame('gemini', 'hop', t, 8) : actFrame('gemini', 'lookaround', t, 6));
  actor(v, 'doubao', [-2.4, 0, -1.4], bloomed ? actFrame('doubao', 'step', t, walkFps / 2) : frontFrame('doubao', t));
  if (variant === 'morning') {
    actor(v, 'claude', [3.4, 0, -2.2], actFrame('claude', 'hop', t, 7, 3));
    // 蝴蝶
    for (let i = 0; i < 6; i++) {
      const bx = Math.sin(t * 0.7 + i * 2) * 4,
        by = 1.4 + Math.sin(t * 1.9 + i) * 0.5,
        bz = -1 + Math.cos(t * 0.5 + i) * 2;
      const flap = Math.abs(Math.sin(t * 12 + i)) * 0.14 + 0.03;
      ball(v, [bx - flap, by, bz], 0.09, PASTEL[i], { flat: 0.6 });
      ball(v, [bx + flap, by, bz], 0.09, PASTEL[i], { flat: 0.6 });
    }
  }
  if (bloomed) fxSeq(v, 'fx_sparkle', 3, t, [gx + 0.7, 2.2, gz], 0.4);
  petals(f, variant === 'night' ? 10 : 18, { wind: 0.8, box: { x: [-8, 8], y: [0.5, 4], z: [-6, 2] } });
}

// ---------------------------------------------------------------
// 4. 好运总会为你而等待 —— 小屋门口亮着灯，朋友们在等，流星一颗颗落
// ---------------------------------------------------------------
function sceneWaiting(f: Frame, variant: 'dusk' | 'night' | 'morning') {
  const { v, t, u, beat } = f;
  setCam(f, cam([1.6, 2.2, 9.5], [0, 1.5, -3], 42), cam([0.6, 1.9, 6.8], [0, 1.4, -4], 40));
  const L = v.look;
  backdrop(f, { clouds: 3, moon: variant === 'night' ? [-12, 10, -70] : null, moonR: 3, sun: variant === 'morning' ? [12, 7, -90] : null, sunR: 4.5 });
  if (variant === 'morning') {
    // 彩虹
    const cols = ['#ff9aa2', '#ffc98a', '#fff3a0', '#b8f0c0', '#a9d8ff', '#c9b8ff'];
    cols.forEach((c, i) => {
      const pts: V3[] = [];
      const R = 26 - i * 0.9;
      for (let k = 0; k <= 30; k++) {
        const a = (k / 30) * Math.PI;
        pts.push([-2 + Math.cos(a) * R, -4 + Math.sin(a) * R, -60]);
      }
      ribbon(v, pts, c, 0.9, { alpha: 0.35 * seg(u, 0.05, 0.5), noFog: true });
    });
  }
  const open = seg(u, 0.05, 0.4);
  house(v, [-1.5, 0, -6], 1.4, { windowGlow: 0.6 + 0.4 * beat.pulse, door: open });
  tree(v, [4.6, 0, -7.5], 2.1, { leaf: mix('#7bb86e', L.ground[0], 0.3), sway: Math.sin(t * 0.8) * 0.3 });
  groundPath(v, [[0.6, 0.012, 7], [0.2, 0.012, 1], [-0.3, 0.012, -2.5], [-0.6, 0.012, -4.6]], 1.3, mix('#e9d9b8', L.ground[0], 0.3), { alpha: 0.92 });
  const night = L.stars > 0.3;
  lantern(v, [-3.6, 0, -1.2], 2.0, '#ffcf7a', night ? 1 : 0.35, { pulse: beat.idx % 2 === 0 ? beat.pulse : 0 });
  lantern(v, [3.0, 0, -2.6], 2.0, '#ffcf7a', night ? 1 : 0.35, { pulse: beat.idx % 2 === 1 ? beat.pulse : 0 });
  for (let i = 0; i < 20; i++) flower(v, [hash(i, 81) * 14 - 7, 0, hash(i, 82) * 4 - 1], 0.45, PASTEL[i % 6], 1, { sway: Math.sin(t * 1.4 + i) * 0.25, glow: night });
  // 门口等着的人
  actor(v, 'claude', [-1.4, 0, -4.2], actFrame('claude', 'idle', t, 5));
  cube(v, [-2.6, 0, -3.6], 0.8, 0.7, 0.6, '#e2c39f');
  sprite(v, [-2.6, 0.7, -3.6], 'prop_teacup', 0.28);
  actor(v, 'kimi', [0.9, 0, -4.4], actFrame('kimi', 'think', t, 5));
  actor(v, 'qwen', [-3.4, 0, -4.4], actFrame('qwen', 'sway', t, 6));
  actor(v, 'zai', [2.4, 0, -4.1], actFrame('zai', 'doze', t, 4));
  fxSeq(v, 'fx_zzz', 3, t, [3.0, 2.3, -4.2], 0.5, 3);
  if (variant !== 'dusk') actor(v, 'gemini', [2.0, 0, -2.6], actFrame('gemini', 'idle', t, 5));
  // 本鲸和豆包沿着小路走来
  const k = ease(seg(u, 0, 0.9));
  const wp: V3 = [lerp(2.6, 0.3, k), 0, lerp(3.5, -2.3, k)];
  const dp: V3 = [lerp(3.6, 1.3, k), 0, lerp(4.4, -1.6, k)];
  actor(v, 'whale', wp, k < 1 ? walkFrame('whale', t, strollFps) : actFrame('whale', 'wave', t, 7));
  actor(v, 'doubao', dp, k < 1 ? walkFrame('doubao', t, strollFps, 3) : actFrame('doubao', 'nod', t, 6));
  // 流星：好 / 总 / 为 / 而
  [0, 2, 4, 6].forEach((w, i) => {
    const kk = wordK(f, w, 1.1);
    shootingStar(f, kk, [8 - i * 3, 13 + hash(i, 5) * 2, -50], [-2 - i * 2.5, 6 + hash(i, 6) * 2, -50]);
  });
  if (wordK(f, 7, 1) > 0) {
    const kk = wordK(f, 7, 1.4);
    fxSeq(v, 'fx_sparkle', 3, t, [-0.4 + Math.sin(t * 3) * 0.3, 2.2 + kk * 0.6, -4.3], 0.45);
  }
  if (night) fireflies(f, 14, { x: [-6, 6], y: [0.4, 3], z: [-5, 3] });
}

// ---------------------------------------------------------------
// 5. 卸下一身的疲惫 —— 箱子一个个从背上落地，人松下来
// ---------------------------------------------------------------
function sceneUnload(f: Frame, variant: 'night' | 'predawn') {
  const { v, t, beat } = f;
  setCam(f, cam([0.5, 1.75, 6.2], [0.3, 1.1, 0], 40), cam([0.2, 1.6, 5.5], [0.2, 1.0, 0], 38));
  const L = v.look;
  backdrop(f, { clouds: 2, moon: variant === 'night' ? [10, 9, -60] : null, moonR: 2.4 });
  house(v, [-4.2, 0, -4.5], 1.4, { windowGlow: 0.85 });
  lantern(v, [2.6, 0, -1.6], 2.1, '#ffcf7a', 1, { pulse: beat.pulse * 0.6 });
  tree(v, [6, 0, -6], 2.0, { leaf: mix('#7bb86e', L.ground[0], 0.3), sway: Math.sin(t * 0.8) * 0.3 });
  disc(v, [0, 0.005, 0.2], 2.4, mix(L.ground[0], '#f3dfb0', 0.25), { alpha: 0.9, soft: true });
  const x = 0;
  if (variant === 'night') {
    const landed = [0, 1, 2].map((i) => wordK(f, i, 0.7));
    [0, 1, 2].forEach((i) => {
      const k = landed[i];
      const from: V3 = [x + 0.3, 1.05 + i * 0.58, -0.15];
      const to: V3 = [x + 1.25 + i * 0.72, 0, 0.45 + i * 0.12];
      const b = bounceOut(k);
      const arc = Math.sin(clamp01(k) * Math.PI) * 0.7;
      const p: V3 = [lerp(from[0], to[0], ease(k)), lerp(from[1], to[1], b) + arc * (1 - k), lerp(from[2], to[2], ease(k))];
      cube(v, p, 0.56, 0.52, 0.5, BOOKS[i + 1], { rot: lerp(0, 0.35 * (i % 2 ? -1 : 1), b) });
    });
    const relaxed = t > wordT(f, 4);
    const frame = relaxed ? actFrame('whale', 'idle', t, 6) : actFrame('whale', 'shiver', t, 8);
    actor(v, 'whale', [x, 0, 0.1], frame);
    if (!relaxed) fx(v, 'fx_sweat', [x - 0.5, 2.0, 0.3], 0.4);
    else {
      const k = clamp01((t - wordT(f, 4)) / 1.6);
      fxSeq(v, 'fx_sparkle', 3, t, [x + 0.65, 1.9 + k * 0.5, 0.3], 0.4);
      // 呼出一口气：一团淡淡的雾
      glow(v, [x - 0.4, 1.55 + k * 0.6, 0.6], 0.5 + k * 0.6, '#ffffff', (1 - k) * 0.35);
    }
  } else {
    // 黎明：箱子已经在地上，长出了花；她放下篮子，伸个懒腰
    [0, 1, 2].forEach((i) => {
      cube(v, [x + 1.25 + i * 0.72, 0, 0.45 + i * 0.12], 0.56, 0.52, 0.5, BOOKS[i + 1], { rot: 0.35 * (i % 2 ? -1 : 1) });
      flower(v, [x + 1.25 + i * 0.72, 0.52, 0.45 + i * 0.12], 0.6, PASTEL[i], wordK(f, 2 + i, 0.8), { sway: Math.sin(t * 1.5 + i) * 0.2 });
    });
    const kb = wordK(f, 0, 0.9);
    const by = lerp(1.9, 0, bounceOut(kb));
    sprite(v, [x - 1.1, by, 0.4], 'prop_basket', 0.42);
    const stretch = t > wordT(f, 2) && t < wordT(f, 5);
    const frame = stretch ? actFrame('whale', 'bow', t, 6) : t >= wordT(f, 5) ? actFrame('whale', 'sway', t, 6) : actFrame('whale', 'idle', t, 6);
    actor(v, 'whale', [x, 0, 0.1], frame);
    if (t >= wordT(f, 5)) fxSeq(v, 'fx_sparkle', 3, t, [x + 0.65, 2.1, 0.3], 0.4);
    birds(f, 4, { y: 6.5, z: -30 });
  }
  actor(v, 'doubao', [-2.2, 0, -0.6], t > wordT(f, 4) ? actFrame('doubao', 'nod', t, 6) : frontFrame('doubao', t));
  if (variant === 'night') fireflies(f, 8, { x: [-5, 5], y: [0.5, 3], z: [-4, 2] });
}

// ---------------------------------------------------------------
// 6. 今夜枕着星光再入睡 —— 狐狸在坡顶打盹，星光像雪一样落下来堆成枕头
// ---------------------------------------------------------------
function sceneStarSleep(f: Frame, variant: 'night' | 'predawn') {
  const { v, t, u, beat } = f;
  setCam(f, cam([0.3, 2.3, 7.5], [0, 1.9, -2], 42), cam([0.3, 2.7, 7.5], [0, 3.1, -2], 46));
  const L = v.look;
  backdrop(f, { clouds: 1, moon: [9, 9.5, -60], moonR: 2.8, stars: 1 });
  hill(v, [0, 0, -2], 5.2, 1.3, mix(L.ground[0], '#9ad08a', 0.2));
  const top = 1.28;
  const starK = Math.max(0.25, wordK(f, 4, 1.2));
  // 落下的星光
  for (let i = 0; i < 46; i++) {
    const spd = 0.35 + hash(i, 91) * 0.4;
    const y0 = 7.5;
    const y = y0 - ((t * spd + hash(i, 92) * 7) % 7);
    const x = hash(i, 93) * 10 - 5 + Math.sin(t * 0.8 + i) * 0.3;
    const z = -1 - hash(i, 94) * 4;
    const a = 0.75 * starK * clamp01((y - 0.5) / 1.0);
    glow(v, [x, y, z], 0.2 + 0.1 * beat.pulse, '#fff4c6', a, { core: 0.25 });
  }
  // 枕头：一团光慢慢堆起来
  const pile = 0.3 + 0.7 * ease(u);
  glow(v, [variant === 'night' ? 0.8 : 0.4, top + 0.15, -1.9], 1.2 * pile, '#fff1c4', 0.55 * pile, { zBias: 0.05 });
  disc(v, [0.2, top + 0.01, -2], 1.3, '#f5dce8', { alpha: 0.8 });
  if (variant === 'night') {
    actor(v, 'zai', [0.2, top, -2], actFrame('zai', 'doze', t, 4));
    const zk = 0.45 + 0.25 * wordK(f, 7, 1.0);
    fxSeq(v, 'fx_zzz', 3, t, [1.0, top + 1.8, -2.1], zk, 3);
  } else {
    // 黎明前：狐狸和 Kimi 盖着一床云被
    actor(v, 'zai', [-0.5, top, -2], actFrame('zai', 'doze', t, 4));
    actor(v, 'kimi', [0.9, top, -2], frontFrame('kimi', t, 5));
    cloud(v, [0.2, top - 0.1, -1.3], 1.25, '#fff3f6', { glowColor: '#ffe9f0' });
    fxSeq(v, 'fx_zzz', 3, t, [0.3, top + 1.8, -2.1], 0.5, 3);
    fxSeq(v, 'fx_zzz', 3, t + 0.5, [1.7, top + 1.7, -2.1], 0.4, 3);
  }
  if (variant === 'night') {
    actor(v, 'kimi', [-2.4, 0.95, -2.6], actFrame('kimi', 'think', t, 4), { scale: 0.95 });
    fireflies(f, 10, { x: [-6, 6], y: [0.3, 2.5], z: [-5, 2] });
  }
}

// ---------------------------------------------------------------
// 7. 风啊轻轻吹 —— 一字一道风，草伏下去又起来，千问的扇子跟着摇
// ---------------------------------------------------------------
function sceneWind(f: Frame, variant: 'night' | 'predawn') {
  const { v, t } = f;
  setCam(f, cam([0, 1.8, 8], [0, 1.3, -2], 44), cam([-0.8, 1.8, 8], [-0.6, 1.3, -2], 44));
  const L = v.look;
  backdrop(f, { clouds: 3, moon: variant === 'night' ? [-10, 10, -60] : [12, 4, -70], moonR: 2.6 });
  tree(v, [-7, 0, -6], 2.2, { leaf: mix('#7bb86e', L.ground[0], 0.3), sway: Math.sin(t * 2.2) * 0.5 + 0.4 });
  // 风场
  const gust = (x: number) => {
    let g = 0.15;
    for (let w = 0; w < 5; w++) {
      const k = wordK(f, w, 1.6);
      if (k > 0 && k < 1) {
        const head = lerp(-14, 14, k);
        const d = Math.abs(x - head + 2);
        g += Math.max(0, 1 - d / 4) * 0.9;
      }
    }
    return g;
  };
  for (let i = 0; i < 70; i++) {
    const x = hash(i, 101) * 22 - 11,
      z = hash(i, 102) * 9 - 5;
    grass(f, [x, 0, z], 0.55 + hash(i, 103) * 0.3, Math.sin(t * 1.5 + i) * 0.25 + gust(x));
  }
  for (let w = 0; w < 5; w++) {
    const k = wordK(f, w, 1.6);
    windStreak(f, k, 1.6 + hash(w, 3) * 1.4, -1 - w * 0.6, { amp: 0.35 });
    windStreak(f, k, 2.4 + hash(w, 4) * 1.2, -2 - w * 0.5, { amp: 0.25, len: 4 });
  }
  if (variant === 'night') {
    for (let i = 0; i < 24; i++) flower(v, [hash(i, 104) * 16 - 8, 0, hash(i, 105) * 5 - 3], 0.5, PASTEL[i % 6], 1, { glow: true, sway: gust(hash(i, 104) * 16 - 8) * 0.5 });
    petals(f, 26, { wind: 2.2, box: { x: [-11, 11], y: [0.4, 4], z: [-6, 2] } });
  } else {
    // 蒲公英：吹一下散一片
    for (let i = 0; i < 10; i++) {
      const x = hash(i, 106) * 12 - 6,
        z = hash(i, 107) * 4 - 2;
      ribbon(v, [[x, 0, z], [x + 0.1, 0.9, z]], '#cfe3c0', 0.05);
      let gone = 0;
      for (let w = 0; w < 5; w++) {
        const k = wordK(f, w, 1.6);
        if (k > 0) {
          const head = lerp(-14, 14, k);
          if (head > x - 1) gone = Math.max(gone, clamp01((head - x + 1) / 3));
        }
      }
      ball(v, [x + 0.1, 0.95, z], 0.2 * (1 - gone), '#ffffff', { flat: 0.6 });
      for (let s = 0; s < 6 && gone > 0; s++) {
        const sx = x + 0.1 + gone * (2 + hash(s + i * 7, 2) * 5),
          sy = 0.95 + gone * (0.5 + hash(s + i * 7, 3) * 1.6) + Math.sin(t * 3 + s) * 0.1;
        glow(v, [sx, sy, z], 0.12, '#ffffff', 0.9 * (1 - gone * 0.6), { core: 0.3 });
      }
    }
    petals(f, 12, { wind: 2.2, color: ['#ffffff', '#f6f1ff'], size: 0.06 });
  }
  actor(v, 'qwen', [-2.9, 0, -0.2], actFrame('qwen', 'sway', t, 6));
  sprite(v, [-2.25 + Math.sin(t * 4) * 0.08, 1.05 + Math.sin(t * 4) * 0.06, -0.05], 'prop_fan', 0.32, { rot: Math.sin(t * 4) * 0.4 });
  actor(v, 'kimi', [2.2, 0, -0.8], actFrame('kimi', 'lookaround', t, 5));
  actor(v, 'whale', [-0.4, 0, 0.8], actFrame('whale', 'idle', t, 5));
  actor(v, 'gemini', [4.6, 0, 0.4], actFrame('gemini', 'sway', t, 6));
  if (variant === 'night') fireflies(f, 14, { x: [-8, 8], y: [0.4, 3], z: [-5, 2] });
}

// ---------------------------------------------------------------
// 8. 这一刻就忘了你是谁 —— 月下的码头，每个人都只是一道剪影和一片倒影
// ---------------------------------------------------------------
function sceneMoonLake(f: Frame, variant: 'night' | 'predawn') {
  const { v, t, u, beat } = f;
  const L = v.look;
  if (variant === 'night') {
    setCam(f, cam([0, 1.7, 6.5], [0, 2.0, -8], 44), cam([0.6, 1.6, 6], [0.3, 2.1, -8], 42));
    backdrop(f, { hills: true, clouds: 2, moon: [0, 7.5, -40], moonR: 4.6, stars: 1 });
    // 水面
    poly(v, [[-40, 0.004, -39], [40, 0.004, -39], [40, 0.004, 1], [-40, 0.004, 1]], mix(L.sky[0], '#4f6fae', 0.5), { alpha: 0.95 });
    // 月光水路
    for (let i = 0; i < 26; i++) {
      const z = -36 + i * 1.2;
      const w = 0.6 + Math.sin(t * 1.5 + i * 1.3) * 0.25 + i * 0.05;
      ribbon(v, [[-w, 0.01, z], [w, 0.01, z]], '#fff1c4', 0.1, { alpha: 0.28 + 0.1 * beat.pulse, noFog: true });
    }
    cube(v, [0, 0, -3], 9.6, 0.16, 5.2, '#8d735c');
    const ids: CharId[] = ['qwen', 'kimi', 'claude', 'whale', 'doubao', 'gemini', 'zai'];
    ids.forEach((id, i) => {
      const x = -4.1 + i * 1.37;
      actor(v, id, [x, 0.16, -3.4 + Math.sin(i) * 0.3], frontFrame(id, t, 3 + i), { sil: 0.62, silColor: '#1d2450', reflect: 0.32, reflectT: t + i, shadow: false });
    });
    actor(v, 'gpt', [Math.sin(t * 0.3) * 5, 6.2 + Math.sin(t) * 0.3, -14], actFrame('gpt', 'hover', t, 8), { sil: 0.6, silColor: '#1d2450', shadow: false, flip: Math.cos(t * 0.3) > 0 });
    fireflies(f, 10, { x: [-7, 7], y: [0.5, 2.5], z: [-6, 1] }, '#cfe3ff', 0.5);
  } else {
    // 黎明前：一排人沿着山脊线走过大月亮
    setCam(f, cam([0, 2.4, 10], [0, 3.2, -12], 40), cam([0.4, 2.4, 10], [0.2, 3.3, -12], 40));
    backdrop(f, { hills: true, clouds: 2, moon: [2.5, 5.5, -34], moonR: 6.5, stars: 1 - u * 0.5 });
    hill(v, [0, 0, -12], 20, 3.2, darken(L.ground[1], 0.25));
    const ids: CharId[] = ['doubao', 'whale', 'gemini', 'kimi', 'claude', 'qwen', 'zai'];
    ids.forEach((id, i) => {
      const x = 7.5 + i * 1.5 - f.dt * 0.75;
      const y = 3.2 * Math.sqrt(Math.max(0, 1 - (x / 20) ** 2));
      actor(v, id, [x, y, -12], walkFrame(id, t, strollFps, i * 2), { sil: 0.72, silColor: '#2a2f5a', shadow: false });
    });
    birds(f, 4, { y: 9, z: -40, color: '#3f4a78' });
  }
}

// ---------------------------------------------------------------
// 9. 有时清醒有时醉 —— 茶桌：猫一会儿精神一会儿晕乎，灯一暖一冷
// ---------------------------------------------------------------
function sceneTea(f: Frame, variant: 'night' | 'dawn') {
  const { v, t, beat } = f;
  const drunk = t >= wordT(f, 4);
  const sway = drunk ? Math.sin(t * 2.2) * 0.15 : 0;
  setCam(f, cam([0 + sway, 1.9, 6.5], [0.1, 1.1, -1], 42), cam([0.3 + sway, 1.8, 6], [0.1, 1.1, -1], 40));
  const L = v.look;
  backdrop(f, { clouds: 2, moon: variant === 'night' ? [-9, 9, -60] : null, moonR: 2.5, sun: variant === 'dawn' ? [10, 3, -80] : null, sunR: 4 });
  tree(v, [-5.5, 0, -5], 2.4, { leaf: mix('#7bb86e', L.ground[0], 0.3), sway: Math.sin(t * 0.8) * 0.3 });
  tree(v, [5.5, 0, -6], 2.0, { leaf: mix('#85c08a', L.ground[1], 0.3) });
  disc(v, [0, 0.005, -0.8], 3.2, mix(L.ground[0], '#f3dfb0', 0.3), { alpha: 0.9, soft: true });
  cube(v, [0, 0, -1], 3.4, 0.85, 1.5, '#ead2ae');
  [-1.0, 0.0, 1.0].forEach((x, i) => {
    sprite(v, [x, 0.86, -0.9], 'prop_teacup', 0.28);
    fxSeq(v, 'fx_steam', 3, t + i, [x + 0.05, 1.25, -0.95], 0.3, 4);
  });
  const lampCol = mix('#ffcf7a', '#9fc3ff', drunk ? 0.55 + 0.25 * Math.sin(t * 2.5) : 0.1);
  glow(v, [-2.3, 2.9, -1.6], 1.3 + 0.2 * beat.pulse, lampCol, 0.55);
  ball(v, [-2.3, 2.9, -1.6], 0.22, lighten(lampCol, 0.3), { flat: 0.5, noFog: true });
  ribbon(v, [[-2.3, 2.9, -1.6], [-2.3, 4.4, -1.6]], '#7a6a5a', 0.05);
  glow(v, [2.3, 2.9, -1.6], 1.3 + 0.2 * beat.pulse, lampCol, 0.55);
  ball(v, [2.3, 2.9, -1.6], 0.22, lighten(lampCol, 0.3), { flat: 0.5, noFog: true });
  ribbon(v, [[2.3, 2.9, -1.6], [2.3, 4.4, -1.6]], '#7a6a5a', 0.05);
  // 猫：清醒 / 醉
  const gp: V3 = [-1.9, 0, 0.3];
  if (!drunk) {
    actor(v, 'gemini', gp, actFrame('gemini', 'lookaround', t, 7));
    if (t > wordT(f, 2)) fx(v, 'fx_exclaim', [-1.4, 2.25, 0.4], 0.42);
  } else {
    actor(v, 'gemini', gp, actFrame('gemini', 'sway', t, 5), { rot: Math.sin(t * 2.2) * 0.06 });
    fxSeq(v, 'fx_dizzy', 4, t, [-1.9, 2.15, 0.4], 0.26, 5);
  }
  actor(v, 'qwen', [0.3, 0, -2.1], actFrame('qwen', drunk ? 'tilt' : 'nod', t, 5));
  sprite(v, [0.95, 1.05, -2.0], 'prop_fan', 0.3, { rot: Math.sin(t * 2) * 0.3 });
  if (variant === 'night') {
    actor(v, 'zai', [2.2, 0, 0.1], actFrame('zai', 'doze', t, 4));
    fxSeq(v, 'fx_zzz', 3, t, [2.9, 2.2, 0], 0.45, 3);
  } else {
    const awake = !drunk && t > wordT(f, 2);
    actor(v, 'zai', [2.2, 0, 0.1], awake ? actFrame('zai', 'alert', t, 8) : actFrame('zai', 'doze', t, 4));
    if (!awake) fxSeq(v, 'fx_zzz', 3, t, [2.9, 2.2, 0], 0.45, 3);
  }
  actor(v, 'kimi', [2.7, 0, -2.3], actFrame('kimi', 'think', t, 5));
  if (variant === 'night') fireflies(f, 8, { x: [-6, 6], y: [0.5, 3], z: [-5, 2] });
}

// ---------------------------------------------------------------
// 10. 别把所有压力自己背 —— 本鲸背着一摞箱子，朋友们一人分走一个
// ---------------------------------------------------------------
function sceneShare(f: Frame, variant: 'night' | 'dawn') {
  const { v, t, beat } = f;
  const L = v.look;
  if (variant === 'night') {
    setCam(f, cam([0, 2.1, 9], [0, 1.3, -0.5], 44), cam([0.3, 2.0, 8.2], [0, 1.3, -0.5], 42));
    backdrop(f, { clouds: 2, moon: [9, 10, -60], moonR: 2.8 });
    lantern(v, [-5.2, 0, -2], 2.1, '#ffcf7a', 1, { pulse: beat.pulse * 0.4 });
    lantern(v, [5.4, 0, -2.5], 2.1, '#ffcf7a', 1, { pulse: beat.pulse * 0.4 });
    for (let i = 0; i < 18; i++) flower(v, [hash(i, 111) * 16 - 8, 0, hash(i, 112) * 4 - 3], 0.45, PASTEL[i % 6], 1, { glow: true, sway: Math.sin(t * 1.4 + i) * 0.2 });
    const friends: { id: CharId; p: V3 }[] = [
      { id: 'doubao', p: [-4.3, 0, 0.6] },
      { id: 'claude', p: [-2.7, 0, -0.4] },
      { id: 'kimi', p: [-1.4, 0, -1.4] },
      { id: 'gemini', p: [1.5, 0, -1.4] },
      { id: 'qwen', p: [2.8, 0, -0.4] },
      { id: 'zai', p: [4.4, 0, 0.6] },
    ];
    const wx = 0;
    const lastK = wordK(f, 8, 0.6);
    const relieved = t > wordT(f, 7);
    actor(v, 'whale', [wx, 0, 0], relieved ? actFrame('whale', 'hop', t, 8) : actFrame('whale', 'shiver', t, 8));
    if (!relieved) fx(v, 'fx_sweat', [wx - 0.5, 2.05, 0.2], 0.4);
    else fxSeq(v, 'fx_sparkle', 3, t, [wx + 0.6, 2.3, 0.2], 0.42);
    // 六个箱子：第 j 个在第 1+j 个字时飞向第 j 个朋友
    for (let j = 0; j < 6; j++) {
      const k = wordK(f, 1 + j, 0.7);
      const fr = friends[j];
      const from: V3 = [wx + 0.3, 1.05 + (5 - j) * 0.56, -0.15];
      const to: V3 = [fr.p[0] + (fr.p[0] < 0 ? -0.85 : 0.85), 0, fr.p[2] + 0.4];
      const e = ease(k);
      const arc = Math.sin(e * Math.PI) * 1.4;
      const p: V3 = [lerp(from[0], to[0], e), lerp(from[1], to[1], e) + arc, lerp(from[2], to[2], e)];
      cube(v, p, 0.56, 0.5, 0.5, BOOKS[j], { rot: e * 0.6 });
      const took = k >= 1;
      actor(v, fr.id, fr.p, took ? actFrame(fr.id, 'nod', t, 6) : actFrame(fr.id, 'idle', t, 5));
      if (k > 0 && k < 1) fx(v, 'fx_heart', [fr.p[0] + 0.5, 2.3, fr.p[2]], 0.34, { alpha: 1 - k });
    }
    void lastK;
    fireflies(f, 10, { x: [-7, 7], y: [0.5, 3], z: [-5, 2] });
  } else {
    // 黎明：一起扛一根挂满灯笼的长竿，慢慢走
    setCam(f, cam([0, 2.0, 9.5], [0, 1.5, -1], 44), cam([0.4, 2.0, 9], [0.2, 1.5, -1], 44));
    backdrop(f, { clouds: 3, sun: [-14, 3.5, -80], sunR: 4.5, sunColor: '#ffd48a' });
    tree(v, [7, 0, -6], 2.2, { leaf: mix('#7bb86e', L.ground[0], 0.3) });
    for (let i = 0; i < 22; i++) flower(v, [hash(i, 113) * 18 - 9, 0, hash(i, 114) * 4 - 3], 0.45, PASTEL[i % 6], 1, { sway: Math.sin(t * 1.4 + i) * 0.2 });
    const ids: CharId[] = ['doubao', 'claude', 'kimi', 'whale', 'gemini', 'qwen', 'zai'];
    const shift = -f.dt * 0.45 + 1.4;
    const xs = ids.map((_, i) => -4.3 + i * 1.45 + shift);
    ids.forEach((id, i) => {
      const relieved = id === 'whale' && t > wordT(f, 7);
      actor(v, id, [xs[i], 0, Math.sin(i * 1.7) * 0.25], relieved ? actFrame('whale', 'hop', t, 8) : walkFrame(id, t, strollFps, i * 2));
    });
    const poleY = 2.25;
    ribbon(v, [[xs[0] - 0.8, poleY, 0.2], [xs[6] + 0.8, poleY, 0.2]], '#b08a63', 0.08);
    for (let j = 0; j < 5; j++) {
      const x = lerp(xs[0] - 0.4, xs[6] + 0.4, (j + 0.5) / 5);
      const k = wordK(f, 1 + j, 0.5);
      ribbon(v, [[x, poleY, 0.2], [x, poleY - 0.35, 0.2]], '#b08a63', 0.04);
      glow(v, [x, poleY - 0.55, 0.2], 0.7 + 0.2 * beat.pulse, PASTEL[j], 0.55 * (0.5 + 0.5 * k));
      ball(v, [x, poleY - 0.55, 0.2], 0.2, lighten(PASTEL[j], 0.2), { flat: 0.4 });
    }
    birds(f, 5, { y: 7, z: -30 });
  }
}

// ---------------------------------------------------------------
// 11. 人生路还远 —— 一条弯弯的路伸向远山，灯一盏盏往前亮
// ---------------------------------------------------------------
function sceneRoad(f: Frame, variant: 'night' | 'dawn') {
  const { v, t, beat } = f;
  setCam(f, cam([2.2, 2.5, 9], [-2.5, 1.5, -8], 46), cam([1.2, 2.7, 8.2], [-3.4, 1.6, -10], 46));
  const L = v.look;
  backdrop(f, { clouds: 3, moon: variant === 'night' ? [-8, 9, -70] : null, moonR: 3, sun: variant === 'dawn' ? [-9, 2.5, -90] : null, sunR: 5, sunColor: '#ffd27a' });
  const P = (s: number): V3 => [-s * 9 + 1.6 * Math.sin(s * 4.2) + 1.2, 0.012, 4 - s * 62];
  const W = (s: number) => lerp(1.5, 0.35, s);
  const left: V3[] = [],
    right: V3[] = [];
  for (let i = 0; i <= 40; i++) {
    const s = i / 40;
    const p = P(s);
    const w = W(s);
    left.push([p[0] - w, p[1], p[2]]);
    right.push([p[0] + w, p[1], p[2]]);
  }
  // 分段画路，让雾按深度渐变
  for (let i = 0; i < 40; i++) {
    poly(v, [left[i], right[i], right[i + 1], left[i + 1]], mix('#e9d9b8', L.ground[0], 0.3), { zBias: 0.03 });
  }
  // 路边的灯：光沿着路往前传
  for (let k = 0; k < 9; k++) {
    const s = 0.06 + k * 0.1;
    const p = P(s);
    const side = k % 2 ? 1 : -1;
    const on = ((beat.idx % 9) + 9) % 9 === k ? beat.pulse : 0;
    lantern(v, [p[0] + side * (W(s) + 0.5), 0, p[2]], 2.0 - s * 0.6, '#ffcf7a', L.stars > 0.3 ? 1 : 0.4, { pulse: on });
  }
  for (let i = 0; i < 16; i++) {
    const s = hash(i, 121) * 0.6;
    const p = P(s);
    const side = hash(i, 122) > 0.5 ? 1 : -1;
    tree(v, [p[0] + side * (W(s) + 2.5 + hash(i, 123) * 3), 0, p[2] - 1], 1.6 + hash(i, 124), { leaf: mix('#7bb86e', L.ground[1], 0.35) });
  }
  for (let i = 0; i < 30; i++) {
    const s = hash(i, 125) * 0.4;
    const p = P(s);
    const side = hash(i, 126) > 0.5 ? 1 : -1;
    flower(v, [p[0] + side * (W(s) + 0.6 + hash(i, 127) * 2), 0, p[2]], 0.45, PASTEL[i % 6], 1, { glow: variant === 'night' });
  }
  const ids: CharId[] = ['doubao', 'whale', 'gemini', 'kimi', 'claude', 'qwen', 'zai'];
  ids.forEach((id, i) => {
    const s = 0.055 + i * 0.03 + f.dt * 0.0045;
    const p = P(s);
    actor(v, id, [p[0] + (i % 2 ? 0.35 : -0.35), 0, p[2]], walkFrame(id, t, strollFps, i * 2));
  });
  actor(v, 'gpt', [-6 + Math.sin(t * 0.5) * 3, 5.5 + Math.sin(t * 1.2) * 0.3, -22], actFrame('gpt', 'hover', t, 8));
  if (variant === 'night') fireflies(f, 12, { x: [-8, 6], y: [0.4, 3], z: [-16, 2] });
  else birds(f, 5, { y: 7, z: -30 });
}

// ---------------------------------------------------------------
// 12. 你不必事事都完美 —— 小克的书塔歪了一本，杯子裂了一道金线
// ---------------------------------------------------------------
function sceneImperfect(f: Frame, variant: 'night' | 'dawn') {
  const { v, t, beat } = f;
  setCam(f, cam([0.2, 1.75, 5.6], [0.1, 1.0, -0.5], 40), cam([0.1, 1.65, 5.1], [0.0, 1.0, -0.5], 38));
  const L = v.look;
  backdrop(f, { clouds: 1, moon: variant === 'night' ? [6, 8, -50] : null, moonR: 2.4, sun: variant === 'dawn' ? [8, 4, -70] : null, sunR: 4 });
  if (variant === 'night') ball(v, [6.9, 8.4, -49.5], 2.1, L.sky[0], { flat: 1, noFog: true, zBias: 498.5, light: [0, 0] }); // 缺一角的月
  tree(v, [-5, 0, -4], 2.2, { leaf: mix('#7bb86e', L.ground[0], 0.3) });
  lantern(v, [3.2, 0, -1.8], 2.2, '#ffcf7a', L.stars > 0.3 ? 1 : 0.35, { pulse: beat.pulse * 0.5 });
  disc(v, [0, 0.005, -0.3], 2.6, mix(L.ground[0], '#f3dfb0', 0.3), { alpha: 0.9, soft: true });
  cube(v, [0, 0, -0.6], 3.0, 0.9, 1.4, '#d9bc9a');
  // 书塔：越往上越歪
  const fell = wordK(f, 6, 0.9);
  const n = 7;
  let lean = 0;
  for (let i = 0; i < n; i++) {
    lean += (hash(i, 131) - 0.35) * 0.09;
    const wob = Math.sin(t * 1.3 + i) * (i / n) * 0.05;
    const y = 0.9 + i * 0.19;
    if (i === n - 1 && fell > 0) {
      const b = bounceOut(fell);
      const p: V3 = [lerp(-0.95 + lean, -2.1, ease(fell)), lerp(y, 0, b), lerp(-0.6, 0.6, ease(fell))];
      cube(v, p, 0.95, 0.18, 0.65, BOOKS[i % BOOKS.length], { rot: fell * 0.9 });
      continue;
    }
    cube(v, [-0.95 + lean + wob, y, -0.6], 0.95, 0.18, 0.65, BOOKS[i % BOOKS.length], { rot: (hash(i, 132) - 0.5) * 0.25 });
  }
  // 金缮的杯子
  const cx = 0.35,
    cy = 0.9,
    cz = -0.35;
  cube(v, [cx, cy, cz], 0.46, 0.4, 0.42, '#f7f1e8', { round: 0.12 });
  const crack: V3[] = [
    [cx - 0.12, cy + 0.4, cz + 0.22],
    [cx - 0.02, cy + 0.26, cz + 0.22],
    [cx + 0.06, cy + 0.2, cz + 0.22],
    [cx + 0.02, cy + 0.06, cz + 0.22],
  ];
  const gk = 0.5 + 0.5 * wordK(f, 7, 1.0);
  ribbon(v, crack, '#ffcc66', 0.035, { alpha: 0.95, zBias: -0.02, noFog: true });
  glow(v, [cx, cy + 0.22, cz + 0.25], 0.5 + 0.15 * beat.pulse, '#ffd27a', 0.5 * gk, { zBias: -0.03 });
  if (variant === 'dawn') flower(v, [cx, cy + 0.38, cz], 0.5, '#ffb3c7', wordK(f, 6, 0.8), { sway: Math.sin(t * 1.5) * 0.2 });
  // 小克：先张望、歪头，书掉了之后点头行礼
  const px: V3 = [1.9, 0, 0.3];
  let cf: string;
  if (t < wordT(f, 4)) cf = actFrame('claude', 'lookaround', t, 6);
  else if (t < wordT(f, 6)) cf = actFrame('claude', 'tilt', t, 6);
  else if (t < wordT(f, 6) + 0.9) cf = actFrame('claude', 'nod', t, 6);
  else cf = actFrame('claude', 'curtsy', t, 7);
  actor(v, 'claude', px, cf);
  if (t < wordT(f, 4)) fx(v, 'fx_sweat', [px[0] - 0.55, 2.05, 0.5], 0.4);
  else if (t < wordT(f, 6)) fx(v, 'fx_question', [px[0] + 0.5, 2.25, 0.5], 0.42);
  else fx(v, 'fx_heart', [px[0] + 0.55, 2.25 + Math.sin(t * 3) * 0.1, 0.5], 0.4);
  actor(v, 'whale', [-2.9, 0, 0.8], t > wordT(f, 6) ? actFrame('whale', 'nod', t, 6) : actFrame('whale', 'idle', t, 5));
  if (variant === 'night') fireflies(f, 6, { x: [-5, 5], y: [0.5, 3], z: [-4, 2] });
}

// ---------------------------------------------------------------
// 13. 慌啥子嘛 慢慢来（第三次）—— 树下的秋千，一拍一荡
// ---------------------------------------------------------------
function sceneSwing(f: Frame, variant: 'night' | 'morning') {
  const { v, t, beat } = f;
  setCam(f, cam([-0.5, 2.3, 8.8], [1.0, 2.2, -2.5], 44), cam([0.6, 2.1, 8], [1.2, 2.1, -2.5], 42));
  const L = v.look;
  backdrop(f, { clouds: 3, moon: variant === 'night' ? [-10, 9, -60] : null, moonR: 2.8, sun: variant === 'morning' ? [-12, 9, -90] : null, sunR: 4 });
  tree(v, [1.6, 0, -3.2], 3.3, { leaf: mix('#7bb86e', L.ground[0], 0.3), sway: Math.sin(t * 0.8) * 0.2, bloom: variant === 'morning' ? '#ffd1dc' : undefined });
  for (let i = 0; i < 22; i++) flower(v, [hash(i, 141) * 16 - 8, 0, hash(i, 142) * 5 - 3], 0.45, PASTEL[i % 6], 1, { glow: variant === 'night', sway: Math.sin(t * 1.4 + i) * 0.2 });
  // 秋千：周期一小节
  const th = 0.42 * Math.sin(((f.t - LINES[0].start) / (4 * BEAT)) * Math.PI * 2);
  const pivot: V3 = [1.6, 5.3, -2.2];
  const Lr = 3.9;
  const seat: V3 = [pivot[0] + Math.sin(th) * Lr, pivot[1] - Math.cos(th) * Lr, pivot[2]];
  ribbon(v, [[pivot[0] - 0.55, pivot[1], pivot[2]], [seat[0] - 0.5, seat[1], seat[2]]], '#c9a27a', 0.05);
  ribbon(v, [[pivot[0] + 0.55, pivot[1], pivot[2]], [seat[0] + 0.5, seat[1], seat[2]]], '#c9a27a', 0.05);
  cube(v, [seat[0], seat[1] - 0.1, seat[2]], 1.1, 0.1, 0.45, '#b98a62', { rot: 0 });
  actor(v, 'whale', [seat[0], seat[1], seat[2] + 0.05], actFrame('whale', 'idle', t, 6), { rot: -th * 0.5, shadow: false });
  shadowOnGround(f, [seat[0], 0, seat[2]], 0.7, 0.18);
  // 豆包在后面轻轻推
  const push = clamp01(Math.cos(((f.t - LINES[0].start) / (4 * BEAT)) * Math.PI * 2));
  actor(v, 'doubao', [3.6, 0, -2.6], push > 0.5 ? actFrame('doubao', 'step', t, walkFps / 2) : actFrame('doubao', 'idle', t, 5));
  if (variant === 'morning') {
    actor(v, 'zai', [-1.2, 0, -3.0], actFrame('zai', 'doze', t, 4));
    fxSeq(v, 'fx_zzz', 3, t, [-0.5, 2.1, -3.1], 0.45, 3);
    actor(v, 'qwen', [-3.6, 0, -0.5], actFrame('qwen', 'sway', t, 6));
    actor(v, 'gemini', [-5.2, 0, 0.6], actFrame('gemini', 'hop', t, 7));
    actor(v, 'kimi', [5.0, 0, 0.2], actFrame('kimi', 'nod', t, 5));
    actor(v, 'claude', [6.2, 0, 1.0], actFrame('claude', 'idle', t, 5));
    actor(v, 'gpt', [-4 + Math.sin(t * 0.5) * 2, 6 + Math.sin(t * 1.3) * 0.3, -14], actFrame('gpt', 'hover', t, 8), { flip: true });
    petals(f, 20, { wind: 0.9, color: ['#ffd1dc', '#fff0f3', '#ffc3d4'] });
  } else {
    fireflies(f, 16, { x: [-7, 7], y: [0.4, 4], z: [-6, 2] });
    actor(v, 'kimi', [-3.4, 0, -0.5], actFrame('kimi', 'idle', t, 5));
  }
  void beat;
}

function shadowOnGround(f: Frame, p: V3, r: number, a: number) {
  disc(f.v, p, r, '#1a2040', { alpha: a, soft: true });
}

// ---------------------------------------------------------------
// 14. 每个人都有自己的节拍 —— 七个光盘，各有各的脉搏
// ---------------------------------------------------------------
function sceneOwnBeat(f: Frame, variant: 'night' | 'morning') {
  const { v, t, beat } = f;
  setCam(f, cam([0, 3.4, 12.5], [0, 1.2, -1], 46), cam([0.8, 3.0, 11.5], [0.3, 1.2, -1], 44));
  backdrop(f, { clouds: 3, moon: variant === 'night' ? [0, 11, -70] : null, moonR: 3, sun: variant === 'morning' ? [0, 10, -90] : null, sunR: 4 });
  const sync = variant === 'morning' && t > wordT(f, 8);
  const cast: { id: CharId; per: number; act: string; x: number; z: number; col: string }[] = [
    { id: 'zai', per: 8, act: 'doze', x: -6.3, z: 2.0, col: '#c9b8ff' },
    { id: 'kimi', per: 4, act: 'nod', x: -4.3, z: 0.4, col: '#a9d8ff' },
    { id: 'claude', per: 2, act: 'read', x: -2.2, z: -0.6, col: '#ffc9a6' },
    { id: 'whale', per: 2, act: 'sway', x: 0, z: -1.1, col: '#9fc3ff' },
    { id: 'doubao', per: 1, act: 'step', x: 2.2, z: -0.6, col: '#ffb3c7' },
    { id: 'gemini', per: 1.5, act: 'sway', x: 4.3, z: 0.4, col: '#b8e2c8' },
    { id: 'qwen', per: 3, act: 'spin', x: 6.3, z: 2.0, col: '#ffe08a' },
  ];
  cast.forEach((c, i) => {
    const per = sync ? 1 : c.per;
    const ph = ((beat.b / per) % 1 + 1) % 1;
    const pulse = Math.exp(-ph * 4);
    disc(v, [c.x, 0.004, c.z], 1.15 + 0.1 * pulse, c.col, { alpha: 0.55 + 0.35 * pulse });
    glow(v, [c.x, 0.05, c.z], 1.6 + 0.4 * pulse, c.col, 0.3 + 0.3 * pulse, { zBias: 0.02 });
    // 扩散的环
    for (let r = 0; r < 2; r++) {
      const rp = ((ph + r * 0.5) % 1);
      const pts: V3[] = [];
      const R = 0.6 + rp * 1.9;
      for (let k = 0; k <= 24; k++) {
        const a = (k / 24) * Math.PI * 2;
        pts.push([c.x + Math.cos(a) * R, 0.02, c.z + Math.sin(a) * R]);
      }
      ribbon(v, pts, c.col, 0.06, { alpha: (1 - rp) * 0.6, zBias: 0.01 });
    }
    const fps = sync ? 8 : 8 / (c.per * BEAT) * 0.9;
    const frame = c.act === 'step' || c.act === 'sway' || c.act === 'spin' || c.act === 'nod' || c.act === 'read' || c.act === 'doze' ? actFrame(c.id, c.act, t, clamp(fps, 2.5, 10), i) : actFrame(c.id, 'idle', t, 5);
    actor(v, c.id, [c.x, 0.01, c.z], frame);
    if (c.id === 'zai') fxSeq(v, 'fx_zzz', 3, t, [c.x + 0.7, 2.1, c.z], 0.45, 3);
  });
  // 龙娘在上面按自己的节拍浮着
  const gph = ((beat.b / 6) % 1 + 1) % 1;
  actor(v, 'gpt', [0, 3.6 + Math.sin(gph * Math.PI * 2) * 0.4, -5], actFrame('gpt', 'float', t, 6), { shadow: false });
  glow(v, [0, 3.6, -5.2], 2.2, '#dfe8ff', 0.18);
  if (variant === 'night') fireflies(f, 10, { x: [-8, 8], y: [0.5, 3], z: [-5, 3] });
  else petals(f, 14, { wind: 0.8 });
  if (sync) fxSeq(v, 'fx_sparkle', 3, t, [0, 2.6, -1.2], 0.5);
}

// ---------------------------------------------------------------
// 15. 得不到 就放开 —— 猫够不着那颗星星气球，松手，它就成了天上的星
// ---------------------------------------------------------------
function sceneLetGo(f: Frame, variant: 'night' | 'morning') {
  const { v, t, u, beat } = f;
  const L = v.look;
  if (variant === 'night') {
    const released = t >= wordT(f, 4);
    const kr = clamp01((t - wordT(f, 4)) / 2.6);
    setCam(f, cam([0.2, 1.8, 6.8], [0.2, 1.6, 0], 42), cam([0.2, 2.1, 6.8], [0.2, 3.2, -2], 46), easeInOut(kr));
    backdrop(f, { clouds: 2, moon: [10, 10, -60], moonR: 2.8 });
    tree(v, [-5, 0, -5], 2.2, { leaf: mix('#7bb86e', L.ground[0], 0.3) });
    for (let i = 0; i < 18; i++) flower(v, [hash(i, 151) * 14 - 7, 0, hash(i, 152) * 4 - 3], 0.45, PASTEL[i % 6], 1, { glow: true });
    // 气球高度：每试一次就飘高一点
    const tries = [0, 1, 2].reduce((a, w) => a + wordK(f, w, 0.5), 0);
    let bp: V3 = [0.95 + Math.sin(t * 1.3) * 0.15, 3.0 + tries * 0.28 + Math.sin(t * 2) * 0.08, 0];
    if (released) {
      const e = easeIn(kr);
      bp = [bp[0] + kr * 2.5, bp[1] + e * 14, bp[2] - e * 20];
    }
    const starA = 0.6 + 0.4 * kr;
    glow(v, bp, 0.9 + 0.3 * beat.pulse, '#fff1b8', starA, { core: 0.22 });
    ball(v, bp, 0.42, '#ffe28a', { glow: 1.2, glowA: 0.4, flat: 0.5, noFog: true });
    // 线
    const hand: V3 = [0.45, 1.15, 0.05];
    if (!released) ribbon(v, [hand, [lerp(hand[0], bp[0], 0.5) + Math.sin(t * 3) * 0.08, lerp(hand[1], bp[1], 0.5), 0], bp], '#ffffff', 0.025, { alpha: 0.8 });
    else ribbon(v, [bp, [bp[0] - 0.2, bp[1] - 0.6, bp[2]], [bp[0] - 0.1, bp[1] - 1.1, bp[2]]], '#ffffff', 0.025, { alpha: 0.8 * (1 - kr) });
    const gp: V3 = [0, 0, 0];
    let gf: string;
    if (!released) gf = t > wordT(f, 0) ? actFrame('gemini', 'choose', t, 7) : actFrame('gemini', 'lookaround', t, 6);
    else if (t < wordT(f, 5) + 0.3) gf = actFrame('gemini', 'nod', t, 6);
    else gf = actFrame('gemini', 'hop', t, 8);
    actor(v, 'gemini', gp, gf);
    if (!released && t > wordT(f, 1)) fx(v, 'fx_sweat', [-0.5, 2.0, 0.2], 0.4);
    if (released) fx(v, 'fx_heart', [0.6, 2.2 + Math.sin(t * 3) * 0.1, 0.2], 0.4);
    actor(v, 'doubao', [-2.4, 0, -0.6], released ? actFrame('doubao', 'nod', t, 6) : frontFrame('doubao', t));
    actor(v, 'whale', [2.6, 0, -0.9], released ? actFrame('whale', 'wave', t, 7) : actFrame('whale', 'idle', t, 5));
    fireflies(f, 12, { x: [-6, 6], y: [0.5, 3], z: [-5, 2] });
  } else {
    // 清晨：大家一起放天灯
    const kcam = seg(u, 0.3, 1);
    setCam(f, cam([0, 2.2, 10], [0, 1.8, -1], 44), cam([0, 2.8, 10.5], [0, 3.9, -4], 52), easeInOut(kcam));
    backdrop(f, { clouds: 3, sun: [-10, 9, -90], sunR: 4 });
    tree(v, [7, 0, -6], 2.4, { leaf: mix('#7bb86e', L.ground[0], 0.3) });
    for (let i = 0; i < 24; i++) flower(v, [hash(i, 153) * 18 - 9, 0, hash(i, 154) * 4 - 3], 0.45, PASTEL[i % 6], 1);
    const ids: CharId[] = ['zai', 'kimi', 'claude', 'whale', 'doubao', 'gemini', 'qwen'];
    ids.forEach((id, j) => {
      const x = -5.4 + j * 1.8;
      const z = Math.sin(j * 1.3) * 0.6;
      const tRel = wordT(f, Math.min(j, 5)) + (j > 5 ? 0.25 : 0);
      const k = clamp01((t - tRel) / 3.2);
      const e = easeIn(k);
      const lp: V3 = [x + Math.sin(t * 0.7 + j) * 0.3 * k + k * 1.5, 2.3 + e * 12 + k * 1.2, z - e * 10];
      const col = PASTEL[j % 6];
      glow(v, lp, 0.9 + 0.25 * beat.pulse, '#ffd9a0', 0.5);
      cube(v, [lp[0], lp[1] - 0.45, lp[2]], 0.5, 0.75, 0.5, mix(col, '#ffd9a0', 0.4), { round: 0.15 });
      const released = k > 0;
      actor(v, id, [x, 0, z], released ? (k < 0.3 ? actFrame(id, 'nod', t, 6) : actFrame(id, 'hop', t, 7, j)) : actFrame(id, 'idle', t, 5, j));
      if (!released && t > wordT(f, 0) - 0.5) ribbon(v, [[x, 1.2, z + 0.1], [lp[0], lp[1] - 0.8, lp[2]]], '#ffffff', 0.025, { alpha: 0.6 });
    });
    actor(v, 'gpt', [Math.sin(t * 0.4) * 5, 7 + Math.sin(t) * 0.4, -12], actFrame('gpt', 'hover', t, 8), { flip: Math.cos(t * 0.4) > 0, shadow: false });
    birds(f, 5, { y: 9, z: -40 });
  }
}

// ---------------------------------------------------------------
// 16. 一切都是最好的安排 —— 小世界一块块落到该在的位置
// ---------------------------------------------------------------
function sceneArrange(f: Frame, variant: 'night' | 'morning') {
  const { v, t, u, beat } = f;
  let k: WorldK;
  if (variant === 'night') {
    setCam(f, cam([0, 2.4, 11], [0, 1.6, -4], 44), cam([3, 7.5, 25], [0, 2.2, -8], 48));
    k = { house: wordK(f, 0, 0.9), tree: wordK(f, 1, 0.8), lake: wordK(f, 2, 0.9), hills: wordK(f, 3, 1.0), lanterns: wordK(f, 4, 1.0), flowers: wordK(f, 5, 1.2), clouds: wordK(f, 6, 1.2) };
    // 远山在搭好前先给一层底
  } else {
    setCam(f, cam([2, 5, 20], [0, 2, -8], 46), cam([4, 10, 33], [0, 3, -10], 50));
    k = WORLD_ALL;
  }
  littleWorld(f, k, { windowGlow: 0.9, doorOpen: 1, lanternPulse: true, flowerGlow: variant === 'night' });
  if (variant === 'night') backdropMoon(f, [12, 11, -70], 3.2);
  else {
    ball(v, [-12, 11, -90], 4.5, '#ffd98a', { glow: 2.4, glowA: 0.5, noFog: true, flat: 0.75, light: [0, 0], zBias: 500 });
    birds(f, 6, { y: 9, z: -40 });
  }
  // 大家在小屋前，按「安排」两个字依次跳起来
  const ids: CharId[] = ['zai', 'qwen', 'kimi', 'whale', 'doubao', 'claude', 'gemini'];
  ids.forEach((id, j) => {
    const x = -5.6 + j * 1.3 - 2.5;
    const z = -3.5 + Math.sin(j * 1.9) * 0.6;
    const tj = wordT(f, 7) + j * 0.12;
    const hop = t > tj;
    actor(v, id, [x, 0, z], hop ? actFrame(id, 'hop', t, 8, j) : actFrame(id, 'idle', t, 5, j));
  });
  actor(v, 'gpt', [Math.sin(t * 0.4) * 6, 6.5 + Math.sin(t) * 0.4, -12], actFrame('gpt', 'hover', t, 8), { flip: Math.cos(t * 0.4) > 0, shadow: false });
  if (variant === 'night') fireflies(f, 20, { x: [-10, 10], y: [0.5, 4], z: [-10, 4] });
  else {
    // 之前放飞的天灯还在天上
    for (let j = 0; j < 7; j++) {
      const lp: V3 = [-6 + j * 2.2 + Math.sin(t * 0.5 + j) * 0.5, 10 + j * 0.8 + Math.sin(t * 0.8 + j) * 0.3, -14 - j * 2];
      glow(v, lp, 0.8, '#ffd9a0', 0.45);
      cube(v, [lp[0], lp[1] - 0.4, lp[2]], 0.5, 0.7, 0.5, mix(PASTEL[j % 6], '#ffd9a0', 0.4), { round: 0.15 });
    }
    petals(f, 16, { wind: 0.8, box: { x: [-12, 12], y: [0.5, 6], z: [-10, 6] } });
  }
  void u;
  void beat;
}
function backdropMoon(f: Frame, p: V3, r: number) {
  ball(f.v, p, r, '#fff4cf', { glow: 1.8, glowA: 0.35, noFog: true, flat: 0.88, light: [-0.3, -0.3], zBias: 499 });
}

// ---------------------------------------------------------------
// 片头 / 间奏 / 片尾
// ---------------------------------------------------------------
function sceneIntroWorld(f: Frame) {
  const { v, t, u } = f;
  setCam(f, cam([2, 6.5, 24], [0, 2.2, -6], 46), cam([1, 4.8, 19], [0, 2.0, -6], 44));
  littleWorld(f, WORLD_ALL, { windowGlow: 0.3 });
  ball(v, [-22, 7, -90], 5, '#ffd98a', { glow: 2.4, glowA: 0.5, noFog: true, flat: 0.75, light: [0, 0], zBias: 500 });
  actor(v, 'zai', [WORLD.tree[0] - 2.2, 0, WORLD.tree[2] + 1.2], actFrame('zai', 'doze', t, 4));
  fxSeq(v, 'fx_zzz', 3, t, [WORLD.tree[0] - 1.5, 2.1, WORLD.tree[2] + 1.1], 0.45, 3);
  actor(v, 'claude', [-4.6, 0, -6.2], actFrame('claude', 'read', t, 4));
  actor(v, 'kimi', [-3.2, 0, -6.6], actFrame('kimi', 'think', t, 4));
  actor(v, 'qwen', [3.2, 0, -1.8], actFrame('qwen', 'sway', t, 5));
  actor(v, 'gemini', [1.2, 0, -2.6], actFrame('gemini', 'lookaround', t, 5));
  actor(v, 'gpt', [8 - u * 16, 7 + Math.sin(t) * 0.4, -20], actFrame('gpt', 'hover', t, 8));
  birds(f, 4, { y: 8, z: -36 });
  petals(f, 14, { wind: 0.8, box: { x: [-12, 12], y: [0.5, 5], z: [-8, 6] } });
}

function sceneVillageNight(f: Frame) {
  const { v, t } = f;
  setCam(f, cam([-9, 2.6, 6], [-7, 2.0, -8], 44), cam([6, 2.6, 6], [7, 2.0, -8], 44));
  littleWorld(f, WORLD_ALL, { windowGlow: 0.9, lanternPulse: true, flowerGlow: true });
  backdropMoon(f, [10, 11, -70], 3.2);
  actor(v, 'zai', [WORLD.house[0] + 0.6, 2.3, WORLD.house[2] + 0.2], actFrame('zai', 'doze', t, 4), { shadow: false });
  fxSeq(v, 'fx_zzz', 3, t, [WORLD.house[0] + 1.3, 4.3, WORLD.house[2] + 0.1], 0.45, 3);
  actor(v, 'qwen', [-2.4, 0, -1.6], actFrame('qwen', 'idle', t, 4));
  actor(v, 'kimi', [-3.6, 0, -2.2], actFrame('kimi', 'think', t, 4));
  actor(v, 'claude', [2.2, 0, -2.4], actFrame('claude', 'read', t, 4));
  actor(v, 'gemini', [4.2, 0, -1.4], actFrame('gemini', 'idle', t, 4));
  fireflies(f, 26, { x: [-12, 12], y: [0.4, 4], z: [-10, 5] });
}

function sceneDock(f: Frame) {
  const { v, t, beat } = f;
  setCam(f, cam([10.8, 1.9, -3.2], [10, 1.6, -14], 40), cam([10.2, 1.8, -4.2], [10, 1.7, -14], 40));
  littleWorld(f, WORLD_ALL, { windowGlow: 0.9, flowerGlow: true });
  backdropMoon(f, [9, 8, -60], 4);
  for (let i = 0; i < 16; i++) {
    const z = -24 + i * 0.7;
    const w = 0.5 + Math.sin(t * 1.5 + i * 1.3) * 0.2 + i * 0.04;
    ribbon(v, [[9.5 - w, 0.012, z], [9.5 + w, 0.012, z]], '#fff1c4', 0.08, { alpha: 0.3 + 0.1 * beat.pulse, noFog: true });
  }
  actor(v, 'whale', [9.7, 0.18, -10.6], actFrame('whale', 'idle', t, 5), { reflect: 0.3, reflectT: t });
  actor(v, 'doubao', [10.7, 0.18, -10.6], actFrame('doubao', 'idle', t, 5), { reflect: 0.3, reflectT: t + 1 });
  // 一只纸船带着一点烛光漂远
  const bk = f.u;
  const bp: V3 = [10.6 - bk * 2.5 + Math.sin(t * 0.7) * 0.2, 0.02, -12 - bk * 7];
  cube(v, bp, 0.5, 0.16, 0.9, '#fff5e4', { rot: 0.3 });
  glow(v, [bp[0], bp[1] + 0.3, bp[2]], 0.5, '#ffd27a', 0.7, { core: 0.2 });
  fireflies(f, 12, { x: [4, 16], y: [0.3, 2.5], z: [-14, -6] }, '#cfe3ff', 0.5);
}

function scenePredawnSky(f: Frame) {
  const { v, t, u } = f;
  setCam(f, cam([0, 2.2, 10], [0, 2.2, -10], 46), cam([0, 2.6, 10], [0, 6.5, -10], 50));
  backdrop(f, { clouds: 4, cloudY: 6, moon: [-12, 7, -70], moonR: 3, stars: 1 - u });
  tree(v, [-6, 0, -6], 2.4, { leaf: mix('#6fae73', v.look.ground[1], 0.3) });
  hill(v, [3, 0, -8], 9, 1.6, mix(v.look.ground[0], '#8ec98a', 0.2));
  // 龙娘带着第一缕光飞过去
  const gx = lerp(-12, 12, easeInOut(u));
  const gp: V3 = [gx, 6 + Math.sin(t * 1.3) * 0.4, -16];
  actor(v, 'gpt', gp, actFrame('gpt', 'hover', t, 9), { flip: true, shadow: false, tintA: 0.05 });
  const trail: V3[] = [];
  for (let i = 0; i < 14; i++) trail.push([gp[0] - i * 0.7, gp[1] + 0.5 + Math.sin(t * 3 + i) * 0.2, gp[2]]);
  ribbon(v, trail, '#ffe6b8', 0.2, { alpha: 0.5, taper: true, noFog: true });
  glow(v, gp, 2.5, '#ffe6b8', 0.35);
  birds(f, 6, { y: 7, z: -30, color: '#4a5584' });
  actor(v, 'whale', [-1.0, 0, 0], frontFrame('whale', t));
  actor(v, 'doubao', [0.5, 0, 0], frontFrame('doubao', t));
}

function sceneOutroWorld(f: Frame) {
  const { v, t } = f;
  setCam(f, cam([4, 10, 33], [0, 3, -10], 50), cam([6, 14, 46], [0, 4, -12], 52));
  littleWorld(f, WORLD_ALL, { windowGlow: 0.5 });
  ball(v, [-12, 12, -90], 4.5, '#ffd98a', { glow: 2.4, glowA: 0.5, noFog: true, flat: 0.75, light: [0, 0], zBias: 500 });
  for (let j = 0; j < 7; j++) {
    const lp: V3 = [-6 + j * 2.2 + Math.sin(t * 0.5 + j) * 0.5, 12 + j * 0.9 + f.dt * 0.25, -14 - j * 2];
    glow(v, lp, 0.8, '#ffd9a0', 0.45);
    cube(v, [lp[0], lp[1] - 0.4, lp[2]], 0.5, 0.7, 0.5, mix(PASTEL[j % 6], '#ffd9a0', 0.4), { round: 0.15 });
  }
  const ids: CharId[] = ['zai', 'qwen', 'kimi', 'whale', 'doubao', 'claude', 'gemini'];
  ids.forEach((id, j) => actor(v, id, [-8.1 + j * 1.3, 0, -3.5 + Math.sin(j * 1.9) * 0.6], j === 3 ? actFrame(id, 'wave', t, 6) : actFrame(id, 'idle', t, 5, j)));
  actor(v, 'gpt', [Math.sin(t * 0.3) * 8, 8 + Math.sin(t) * 0.4, -16], actFrame('gpt', 'hover', t, 8), { flip: Math.cos(t * 0.3) > 0, shadow: false });
  birds(f, 6, { y: 10, z: -40 });
}

function sceneEndSky(f: Frame) {
  const { v, t, u } = f;
  v.setCam(cam([0, 3, 10], [0, 4.5, -10], 50));
  backdrop(f, { hills: true, clouds: 6, cloudY: 4, sun: [-6, 9, -90], sunR: 4 });
  for (let j = 0; j < 4; j++) {
    const lp: V3 = [-5 + j * 3.3 + Math.sin(t * 0.5 + j) * 0.4, 3 + j * 1.2 + u * 4, -16 - j * 3];
    glow(v, lp, 0.9, '#ffd9a0', 0.4);
    cube(v, [lp[0], lp[1] - 0.4, lp[2]], 0.5, 0.7, 0.5, mix(PASTEL[j % 6], '#ffd9a0', 0.4), { round: 0.15 });
  }
  birds(f, 5, { y: 8, z: -40 });
}

// ---------------------------------------------------------------
// 排镜
// ---------------------------------------------------------------
const CUT = 0.12; // 开口前多久切镜
const LS = (i: number) => LINES[i].start - CUT;

type Variant = string;
interface LineSpec {
  look: Look | ((f: Frame) => Look);
  scene: (f: Frame, variant: never) => void;
  variant: Variant;
}
const Lk = LOOKS;
const blend = (a: Look, b: Look) => (f: Frame) => lookMix(a, b, ease(f.u));

const SPEC: LineSpec[] = [
  { look: Lk.dusk, scene: sceneHill, variant: 'dusk' },
  { look: blend(Lk.dusk, Lk.blueHour), scene: sceneSunMoon, variant: 'set' },
  { look: Lk.blueHour, scene: sceneCloudsFlowers, variant: 'dusk' },
  { look: Lk.blueHour, scene: sceneWaiting, variant: 'dusk' },
  { look: Lk.night, scene: sceneUnload, variant: 'night' },
  { look: Lk.night, scene: sceneStarSleep, variant: 'night' },
  { look: Lk.night, scene: sceneWind, variant: 'night' },
  { look: Lk.deepNight, scene: sceneMoonLake, variant: 'night' },
  { look: Lk.night, scene: sceneTea, variant: 'night' },
  { look: Lk.night, scene: sceneShare, variant: 'night' },
  { look: Lk.deepNight, scene: sceneRoad, variant: 'night' },
  { look: Lk.night, scene: sceneImperfect, variant: 'night' },
  { look: Lk.night, scene: sceneHill, variant: 'night' },
  { look: Lk.deepNight, scene: sceneSunMoon, variant: 'wheel' },
  { look: Lk.night, scene: sceneCloudsFlowers, variant: 'night' },
  { look: Lk.night, scene: sceneWaiting, variant: 'night' },
  { look: Lk.night, scene: sceneSwing, variant: 'night' },
  { look: Lk.deepNight, scene: sceneOwnBeat, variant: 'night' },
  { look: Lk.night, scene: sceneLetGo, variant: 'night' },
  { look: blend(Lk.night, Lk.deepNight), scene: sceneArrange, variant: 'night' },
  // 第二段
  { look: Lk.predawn, scene: sceneUnload, variant: 'predawn' },
  { look: Lk.predawn, scene: sceneStarSleep, variant: 'predawn' },
  { look: Lk.predawn, scene: sceneWind, variant: 'predawn' },
  { look: Lk.predawn, scene: sceneMoonLake, variant: 'predawn' },
  { look: blend(Lk.predawn, Lk.dawn), scene: sceneTea, variant: 'dawn' },
  { look: Lk.dawn, scene: sceneShare, variant: 'dawn' },
  { look: Lk.dawn, scene: sceneRoad, variant: 'dawn' },
  { look: Lk.dawn, scene: sceneImperfect, variant: 'dawn' },
  { look: blend(Lk.predawn, Lk.dawn), scene: sceneHill, variant: 'dawn' },
  { look: blend(Lk.dawn, Lk.morning), scene: sceneSunMoon, variant: 'rise' },
  { look: Lk.morning, scene: sceneCloudsFlowers, variant: 'morning' },
  { look: Lk.morning, scene: sceneWaiting, variant: 'morning' },
  { look: Lk.morning, scene: sceneSwing, variant: 'morning' },
  { look: Lk.morning, scene: sceneOwnBeat, variant: 'morning' },
  { look: Lk.morning, scene: sceneLetGo, variant: 'morning' },
  { look: Lk.morning, scene: sceneArrange, variant: 'morning' },
];

export const SHOTS: Shot[] = [];
SHOTS.push({ id: 'I1', start: 0, end: 7.44, look: Lk.golden, render: sceneIntroWorld });
SHOTS.push({ id: 'I2', start: 7.44, end: LS(0), look: Lk.dusk, render: (f) => sceneHill(f, 'dusk') });
SPEC.forEach((s, i) => {
  const end = i === 19 ? INTERLUDE + 0.62 : i === 35 ? VOCAL_END + 0.5 : LS(i + 1);
  SHOTS.push({ id: `L${i + 1}`, start: LS(i), end, look: s.look, render: (f) => s.scene(f, s.variant as never), line: i });
});
const x1 = INTERLUDE + 0.62;
SHOTS.splice(
  SHOTS.findIndex((s) => s.id === 'L21'),
  0,
  { id: 'X1', start: x1, end: x1 + 5.0, look: Lk.deepNight, render: sceneVillageNight },
  { id: 'X2', start: x1 + 5.0, end: x1 + 9.7, look: Lk.deepNight, render: sceneDock },
  { id: 'X3', start: x1 + 9.7, end: LS(20), look: blend(Lk.deepNight, Lk.predawn), render: scenePredawnSky },
);
SHOTS.push({ id: 'O1', start: VOCAL_END + 0.5, end: 172, look: Lk.morning, render: sceneOutroWorld });
SHOTS.push({ id: 'O2', start: 172, end: SONG_END + 5, look: Lk.morning, render: sceneEndSky });

export function shotAt(t: number): Shot {
  for (let i = SHOTS.length - 1; i >= 0; i--) if (t >= SHOTS[i].start) return SHOTS[i];
  return SHOTS[0];
}

export function resolveLook(shot: Shot, f: Frame): Look {
  return typeof shot.look === 'function' ? shot.look(f) : shot.look;
}

export { tri, type BeatInfo };
