// 总装：实测歌词时间轴、镜头调度、柔光后期、字幕
import { C, W, H, Shot, clamp, seg, ss, wash, txt, mk } from './kit';
import { shotsA } from './shotsA';
import { shotsB } from './shotsB';
import { shotsC } from './shotsC';

export const DUR = 226.64;

/** 起止秒数按音轨实测对齐 */
export const LYRICS: [number, number, string][] = [
  [0.0, 1.83, '你应该忘记了吧'], [1.83, 3.75, '天气晴朗'], [3.75, 7.67, '心里却潮湿的盛夏'],
  [8.0, 12.08, '小小的房间里你弹着吉他'], [12.08, 15.33, '抹着泪和我说的话'],
  [15.83, 17.67, '原来这个世界没有那么好'], [17.67, 19.92, '遇见的人发生的事都有些糟糕'],
  [19.92, 21.92, '从小不合群胆子也小'], [21.92, 23.83, '学校里真心朋友也少'],
  [24.0, 25.5, '多希望心里话能被人听到'], [25.5, 27.58, '可没有人知道'],
  [27.58, 30.33, '不是这样 还有我'], [30.42, 33.83, '我随时都愿意为了你唱'],
  [33.83, 36.5, '我想要 我想要你知道'], [36.5, 38.58, '就算最荒唐的想法'], [38.58, 41.83, '最肆无忌惮的乐章'],
  [42.17, 44.83, '我也会陪你疯陪你唱'], [45.0, 49.5, '直到有一天你在生命里闪闪发亮'],
  [49.5, 52.33, '我愿成为照亮你的'], [52.5, 54.92, '第一束光'],
  [69.83, 74.0, '丑八怪 假装可爱 声音奇怪'], [74.0, 77.58, '不期待 装腔作态'], [77.58, 79.0, '那一天'],
  [79.5, 85.5, '发现了这世界原来真的没那么好'], [86.0, 88.25, '有的人只是路过探头看看'],
  [88.25, 90.42, '然后觉得无趣笑一笑马上离开'], [90.42, 92.25, '有的人只是凑个热闹'], [92.25, 94.5, '顺便嘲笑跟着踩一脚'],
  [94.5, 96.42, '只有你想要拼了命保护我'], [96.42, 98.08, '就算势单力薄'],
  [98.42, 99.42, '对我说 你对我说'], [99.42, 103.67, '请坚持做自己就好'],
  [104.58, 108.92, '我知道 我知道 这些我都知道'], [108.92, 111.0, '每一个脆弱的瞬间'], [111.0, 114.33, '都有你陪在我身旁'],
  [114.33, 117.17, '这世界 因为有你存在'], [117.17, 122.58, '漆黑的夜中透出了一点点微光'],
  [122.83, 125.25, '早就应该习惯'], [125.25, 129.5, '忽明忽暗酒阑人散'],
  [129.67, 135.5, '可是我 还是想要守护这'], [135.83, 142.5, '短暂的羁绊'],
  [159.67, 161.75, '如果说有一天你突然发现'], [161.75, 164.2, '早已离开这个次元越来越远'],
  [164.33, 166.1, '也许一切都不知不觉'], [166.25, 167.83, '也许来不及一句道别'],
  [167.83, 170.08, '千万不要悲伤也不要自责'], [170.08, 171.85, '因为那个时候'],
  [171.9, 174.33, '你和我 我和你'], [174.33, 177.75, '都成为了更好的自己'],
  [177.75, 180.33, '我想要 我想要你知道'], [180.33, 182.42, '不论这世界多糟糕'],
  [182.42, 186.08, '未来的你会光芒万丈'], [186.08, 191.58, '而我也曾是你万分之一的光'], [191.58, 196.08, '那么闪耀'],
  [209.42, 211.83, '你应该忘记了吧'], [211.83, 213.75, '天气晴朗'], [213.75, 217.58, '心里却潮湿的盛夏'],
  [217.75, 222.17, '而我还记得你那天写的歌'], [222.17, 224.25, '和对我说的话'],
];

export const SHOTS: Shot[] = [...shotsA, ...shotsB, ...shotsC];
SHOTS.forEach((s, i) => { if (i < SHOTS.length - 1) s.e = SHOTS[i + 1].s; });

function findShot(t: number) {
  let lo = 0, hi = SHOTS.length - 1;
  while (lo < hi) { const m = (lo + hi + 1) >> 1; if (SHOTS[m].s <= t) lo = m; else hi = m - 1; }
  return SHOTS[lo];
}

function subtitle(c: C, t: number) {
  for (const L of LYRICS) {
    if (t < L[0]) break; if (t >= L[1]) continue;
    const a = Math.min(seg(t, L[0], L[0] + 0.12), 1 - seg(t, L[1] - 0.12, L[1]));
    txt(c, L[2], W / 2, H - 52, 30, '#ffffff', { w: 700, a, stroke: 'rgba(64,146,230,.9)', sw: 5, glow: 'rgba(60,150,255,.95)', blur: 12 });
    return;
  }
}

let b1: HTMLCanvasElement | null = null, b2: HTMLCanvasElement | null = null;
/** 柔光：把画面缩小再叠回去，复刻参考片那种过曝的空气感 */
function bloom(c: C, amount: number) {
  if (amount <= 0) return;
  if (!b1) { b1 = mk(426, 240); b2 = mk(142, 80); }
  const g1 = b1.getContext('2d')!, g2 = b2!.getContext('2d')!;
  g1.imageSmoothingEnabled = true; g2.imageSmoothingEnabled = true;
  g1.drawImage(c.canvas, 0, 0, 426, 240); g2.drawImage(b1, 0, 0, 142, 80);
  c.save(); c.globalCompositeOperation = 'screen'; c.globalAlpha = amount; c.imageSmoothingEnabled = true;
  (c as unknown as { imageSmoothingQuality: string }).imageSmoothingQuality = 'high';
  c.drawImage(b2!, 0, 0, W, H); c.restore();
}

/** 画一帧。只读 t，同一个 t 永远得到同一帧。 */
export function renderFrame(c: C, t: number, opts: { sub?: boolean; bloom?: boolean } = {}) {
  t = clamp(t, 0, DUR - 0.001);
  const s = findShot(t), lt = t - s.s, d = s.e - s.s;
  c.save(); c.beginPath(); c.rect(0, 0, W, H); c.clip();
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, W, H);
  c.save(); s.draw({ c, t, lt, d, p: clamp(lt / d) }); c.restore();
  if (s.fi && lt < s.fi) wash(c, s.fc ?? '#ffffff', 1 - ss(lt / s.fi));
  if (s.fo && t > s.e - s.fo) wash(c, s.fc ?? '#ffffff', ss((t - (s.e - s.fo)) / s.fo));
  if (opts.bloom !== false) bloom(c, s.bloom ?? 0.3);
  if (opts.sub !== false) subtitle(c, t);
  c.restore();
}
