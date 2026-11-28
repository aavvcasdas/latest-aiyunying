/**
 * 卡点总表：画面事件与背景音效共用同一组时间（秒）。
 * 开场念白的时间来自英文逐词识别 + 起音检测；副歌结尾「我对此感——到厌烦」按频谱里 98.42–99.01 秒的整段静音重排。
 * 镜头代码从这里取时间画动作，音效轨也从这里取时间合成——改一处，声画一起动。
 */
import { BEAT, bt } from './engine';
import type { Cue } from './sfx';

export const K = {
  // 序章一：翻开童话书，小红帽迷路
  bookOpen: 0.5, bookSwing: 1.15, bookGlow: 1.5, whaleJump: 1.9, inTheOld: 2.2, whaleLand: 3.3, tales: 3.78,
  little: 5.40, getsLost: 6.50, lost: 6.78, signSpin: 6.95, whaleSees: 7.4,
  // 序章二：遇见大灰狼……被吃掉
  meets: 8.24, big: 8.79, bad: 9.11, wolf: 9.30, and: 10.10, is: 10.32, eaten: 10.64, chomp: 10.97, eatenText: 11.1,
  // 序章三：故事的最后——猎人剖开狼肚子 / 公主被吻醒 / 盛大的婚礼
  pageA: 12.05, andEnd: 12.18, inThe: 12.36, end: 12.78, popOut: 12.98,
  pageB: 13.80, princess: 13.82, prince: 15.02, always: 15.24, kiss: 15.68, married: 16.0,
  pageC: 17.25, live: 17.34, happily: 17.94, ever: 18.54, after: 19.22, theEnd: 19.6,
  // Stop! / I don't like that story / We CAN CHANGE IT
  stop: 20.42, kick: 20.85,
  I: 21.60, dont: 21.80, like: 21.95, that: 22.14, story: 22.36,
  we: 23.32, can: 23.48, change: 23.68, it: 23.90,
  // 副歌收尾：我 对 此！感——（静音）——到 厌 烦！
  wo: 97.05, dui: 97.51, ci: 97.70, gan: 97.98, hush: 98.42, dao: 99.01, yan: 99.38, fan: 99.92,
};

/** 序章里的「翻页」转场（画面上一页纸扫过，同时配翻书声） */
export const PAGE_TURNS = [K.pageA, K.pageB, K.pageC];

/** 与 sets3d.Fireworks 完全相同的爆点公式：第 j 簇在 T = m·period − j·(period/n)·1.37 时炸开 */
export function fireworkTimes(n: number, period: number, t0: number, t1: number) {
  const out: number[] = [];
  for (let j = 0; j < n; j++) {
    const off = j * (period / n) * 1.37;
    for (let m = Math.ceil((t0 + off) / period); m * period - off < t1; m++) out.push(+(m * period - off).toFixed(3));
  }
  return out.sort((a, b) => a - b);
}
export const FW_OUT = { n: 3, period: 1.8, from: 101.0 };

const c = (t: number, s: Cue['s'], v = 1, r = 1, p = 0): Cue => ({ t, s, v, r, p });

export const CUES: Cue[] = [
  // ── P1 0–8.15 立体书翻开 → 跃入书中森林 → 小红帽登场迷路
  c(K.bookOpen, 'creak', 0.5), c(K.bookSwing, 'whoosh', 0.6), c(K.bookGlow, 'magic', 0.45), c(K.whaleJump, 'whooshUp', 0.5),
  c(K.inTheOld, 'pageFlip', 0.8), c(2.45, 'pop', 0.55, 0.9, -0.4), c(2.8, 'pop', 0.55, 1.05, 0.3), c(3.15, 'pop', 0.55, 1.2, -0.1),
  c(K.whaleLand, 'drip', 0.5), c(K.tales, 'sparkle', 0.5),
  c(K.little, 'step', 0.45, 1, -0.5), c(5.78, 'step', 0.45, 1, -0.4), c(6.14, 'step', 0.45, 1, -0.3), c(K.getsLost, 'step', 0.4, 1, -0.2),
  c(K.lost, 'boing', 0.3, 1.35), c(K.signSpin, 'creak', 0.35, 1.2, 0.3), c(K.whaleSees, 'ding', 0.45, 1, -0.3),
  // ── P2 8.15–12.05 Big / Bad / Wolf 三步逼近，is 扑上来，eaten 咬合（落在原曲 10.97 秒的鼓击上）
  c(K.meets, 'whoosh', 0.3, 1.3), c(K.big, 'growl', 0.8, 1, 0.4), c(K.bad, 'thud', 0.45, 1.1, 0.4), c(K.wolf, 'howl', 0.55, 1, 0.4),
  c(9.5, 'step', 0.35, 1.2, -0.6), c(9.75, 'step', 0.35, 1.2, -0.5), c(K.is, 'whoosh', 0.7, 0.8, 0.2), c(K.chomp, 'chomp', 1.0), c(K.eatenText, 'stamp', 0.35, 0.8),
  // ── P3a 猎人剖开狼肚子，小红帽被救出来
  c(K.pageA, 'pageFlip', 0.6), c(K.andEnd, 'whoosh', 0.4, 1.2, 0.5), c(K.inThe, 'clink', 0.4, 0.8, 0.4), c(K.end, 'slash', 0.9), c(12.86, 'rip', 0.5),
  c(K.popOut, 'pop', 0.7, 0.8), c(13.0, 'sparkle', 0.6),
  // ── P3b 睡美人被纸板王子吻醒
  c(K.pageB, 'pageFlip', 0.6), c(K.princess, 'musicbox', 0.45), c(14.04, 'pop', 0.3, 1.4, -0.3), c(14.46, 'pop', 0.3, 1.6, 0.3),
  c(K.prince, 'whoosh', 0.4, 1.1, 0.6), c(K.kiss, 'kiss', 0.85), c(K.married, 'ding', 0.6), c(16.05, 'sparkle', 0.5), c(16.4, 'boing', 0.22, 0.9),
  // ── P3c 盛大的婚礼：钟声、彩带、烟花；THE END 落下
  c(K.pageC, 'pageFlip', 0.5), c(K.live, 'bells', 0.9), c(K.happily, 'confetti', 0.7), c(K.happily, 'stamp', 0.35), c(18.0, 'cheer', 0.6),
  c(K.ever, 'firework', 0.7, 1, -0.3), c(K.after, 'firework', 0.6, 1.1, 0.4), c(K.theEnd, 'thud', 0.6), c(19.75, 'creak', 0.35, 0.8),
  // ── S0 Stop!：打板 + 磁带急停（整个故事定格），小克一脚踢飞纸板王子
  c(K.stop, 'clapper', 1.0), c(K.stop, 'tapeStop', 0.45), c(K.kick, 'boing', 0.5), c(K.kick + 0.02, 'whoosh', 0.5, 1.2),
  // ── S1 I don't like that story.
  c(K.I, 'stamp', 0.3, 1.2), c(K.dont, 'stamp', 0.3, 1.1), c(K.like, 'stamp', 0.3, 1.2), c(K.that, 'stamp', 0.3, 1.1), c(K.story, 'stamp', 0.55),
  c(K.story + 0.04, 'slash', 0.45, 1.1), c(K.story + 0.16, 'slash', 0.45, 0.9), c(22.75, 'whoosh', 0.5),
  // ── S2 We CAN CHANGE IT!
  c(K.we, 'stamp', 0.35, 1.2), c(K.can, 'stamp', 0.35, 1.3), c(K.change, 'rip', 0.9), c(K.change, 'pageFlip', 0.7), c(K.it, 'stamp', 0.7), c(K.it + 0.05, 'sparkle', 0.5),
  c(bt(47), 'swell', 0.6),
  // ── IN 片头：四座拱门逐拍点亮，片名逐字落下，第 54 拍烟花
  c(bt(47), 'thud', 0.5, 0.8, -0.6), c(bt(48), 'thud', 0.5, 0.85, -0.2), c(bt(49), 'thud', 0.5, 0.9, 0.2), c(bt(50), 'thud', 0.5, 0.95, 0.6),
  ...[0, 1, 2, 3, 4].map(i => c(bt(51) + i * BEAT * 0.5, 'stamp', 0.3, 1 + i * 0.06, -0.5 + i * 0.25)),
  c(bt(54), 'firework', 0.7), c(bt(54), 'sparkle', 0.5),

  // ── V1a 小红帽 迷失在 森林 提着 糕点篮
  c(28.7, 'step', 0.35, 1, -0.3), c(29.0, 'step', 0.35, 1, -0.2), c(29.3, 'creak', 0.35, 1.2, 0.3), c(29.38, 'boing', 0.28, 1.3),
  c(30.0, 'whoosh', 0.75, 0.7), c(30.0, 'thud', 0.45), c(30.6, 'step', 0.3), c(30.95, 'step', 0.3),
  c(31.08, 'pop', 0.55, 1.0), c(31.34, 'pop', 0.55, 1.15), c(31.6, 'pop', 0.55, 1.3), c(32.0, 'step', 0.3),
  // ── V1b 外婆的 叮咛 是 你要 乖巧 与 和善
  c(33.14, 'pop', 0.5), c(34.14, 'stamp', 0.55), c(34.18, 'jingle', 0.3, 1, -0.3), c(35.0, 'stamp', 0.55), c(35.04, 'jingle', 0.3, 1, 0.2), c(35.6, 'twang', 0.4),
  // ── V1c 狼的 肚腹里 / V1c2 哦 一片 黑暗
  c(36.54, 'growl', 0.8), c(36.54, 'thud', 0.5), c(37.42, 'whoosh', 0.6, 0.8), c(37.9, 'gulp', 0.6),
  c(38.62, 'heartbeat', 0.9), c(38.9, 'drip', 0.5, 1, -0.4), c(39.36, 'heartbeat', 1.0), c(39.36, 'boom', 0.4), c(39.7, 'drip', 0.45, 0.8, 0.4),
  // ── V1x 多么 夸张（字像气球一样吹胀，最后「啵」地炸开）
  c(40.1, 'boing', 0.45), c(40.6, 'inflate', 0.5), c(40.85, 'pop', 0.8, 0.7),
  // ── V1d 剧本说：要等待 猎人来 剖开 这 磨难
  c(41.0, 'thud', 0.5), c(41.0, 'pageFlip', 0.4), c(41.8, 'whoosh', 0.4, 1.2), c(41.85, 'tick', 0.5), c(42.1, 'tick', 0.45, 0.8), c(42.36, 'tick', 0.5),
  c(42.36, 'whoosh', 0.4, 0.9, 0.4), c(42.8, 'slash', 0.9), c(42.85, 'rip', 0.6), c(43.58, 'stamp', 0.6),
  // ── V2a 小美人鱼（海底上浮）/ V2a2 浮上 海面 歌声 多 璀璨
  c(44.8, 'bubbles', 0.5), c(45.2, 'bubbles', 0.45, 1.2), c(45.6, 'bubbles', 0.4),
  c(46.0, 'splash', 0.9), c(46.92, 'musicbox', 0.45, 1.5), c(47.68, 'sparkle', 0.8), c(47.7, 'chime', 0.5),
  // ── V2b 女巫的 交易 是 割让 歌喉的 谈判
  c(48.92, 'bubbles', 0.5, 0.6), c(49.48, 'pop', 0.5), c(49.5, 'magic', 0.4), c(50.02, 'slash', 0.7, 1.2), c(50.1, 'gulp', 0.7), c(51.3, 'clink', 0.5), c(51.4, 'stamp', 0.8), c(52.04, 'stamp', 0.5),
  // ── V2c 刀尖上 跳舞（每一拍落在刀尖上「叮」一声）/ V2c2 等待 王子的 青睐
  c(52.96, 'clink', 0.7), ...[103, 104, 105, 106].map((k, i) => c(bt(k), 'clink', 0.45, [1.1, 0.95, 1.2, 1.0][i], i % 2 ? 0.3 : -0.3)),
  c(54.86, 'chime', 0.4), ...[107, 108, 109].map((k, i) => c(bt(k), 'clink', 0.32, [1.0, 1.1, 0.9][i])), c(55.86, 'ding', 0.3, 1.2),
  // ── V2x 多么 荒诞（字倒栽葱翻过来）
  c(56.4, 'boing', 0.45, 0.9), c(56.96, 'whoosh', 0.6), c(56.96, 'boing', 0.4, 0.7),
  // ── V2d 剧本说：泡沫的 升华 是 真爱的 模样
  c(57.42, 'thud', 0.45), c(57.45, 'pageFlip', 0.4), c(58.14, 'bubbles', 0.6), c(58.64, 'bubbles', 0.6, 1.3), c(59.16, 'magic', 0.5), c(59.9, 'chime', 0.5), c(60.45, 'pop', 0.8, 0.6), c(60.47, 'sparkle', 0.6),

  // ── PC1a 高塔 / PC1a2 是 棺椁 / PC1b 纺锤 是 预设的 网
  c(60.98, 'boom', 0.9), c(61.2, 'flap', 0.4, 1, 0.4), c(61.5, 'flap', 0.35, 1, 0.6), c(61.8, 'flap', 0.3, 1, 0.8),
  c(62.2, 'thud', 1.0), c(62.3, 'sparkle', 0.3),
  c(63.08, 'whirr', 0.6, 1, -0.4), c(63.5, 'whoosh', 0.4, 1.5), c(63.72, 'twang', 0.5), c(64.54, 'twang', 0.8, 0.8), c(64.54, 'stamp', 0.5),
  // ── PC2a 恶龙 是 借口 / PC2b 印证 王子 多 勇敢
  c(64.92, 'roar', 0.9), c(65.40, 'flap', 0.6), c(66.32, 'stamp', 0.6), c(66.32, 'thud', 0.4), c(66.4, 'boing', 0.4, 0.8),
  c(67.08, 'stamp', 0.7), c(67.3, 'creak', 0.4, 0.9, -0.5), c(67.38, 'ding', 0.4, 1.0), c(67.62, 'ding', 0.4, 1.12), c(67.84, 'ding', 0.4, 1.25),
  c(68.14, 'whoosh', 0.5), c(68.14, 'cheer', 0.7), c(68.16, 'confetti', 0.6),
  // ── PC3 童话 造的 梦 何时 才能 想 明白
  c(69.2, 'pageFlip', 0.6), c(69.25, 'pop', 0.4), c(69.35, 'pop', 0.4, 1.1), c(69.45, 'pop', 0.4, 1.2), c(69.55, 'pop', 0.4, 1.3),
  c(70.06, 'musicbox', 0.55), c(70.62, 'chime', 0.45, 0.8), c(72.18, 'ding', 0.8), c(72.2, 'whoosh', 0.5, 0.7),
  // ── PC4 吻 如果是 钥匙 为何 我 打 不 开
  c(72.64, 'kiss', 1.0), c(73.12, 'pop', 0.4, 0.8), c(73.86, 'jingle', 0.7), c(74.2, 'whoosh', 0.4),
  c(75.02, 'clank', 0.8), c(75.28, 'clank', 0.8, 1.1), c(75.52, 'clank', 0.9, 0.9), c(75.62, 'shatter', 0.9),

  // ── C1a 去他的 / C1b 乖巧 只会 饲养 恶狼 / C1c 我要 驯服 龙的 翅膀
  c(76.76, 'stamp', 0.8), c(76.8, 'whoosh', 0.5), c(77.24, 'stamp', 0.7), c(77.42, 'stamp', 0.8),
  c(77.52, 'stamp', 0.5), c(77.55, 'whoosh', 0.5), c(77.78, 'slash', 0.4, 1.3), c(78.12, 'growl', 0.5, 1.1),
  c(78.58, 'pop', 0.4, 0.8), c(78.68, 'pop', 0.4, 0.9), c(78.78, 'pop', 0.4, 1.0), c(78.88, 'pop', 0.4, 1.1), c(79.14, 'chomp', 0.8), c(79.14, 'growl', 0.6, 0.8),
  c(79.52, 'whoosh', 0.5), c(79.76, 'flap', 0.8), c(80.08, 'flap', 0.5), c(80.46, 'flap', 0.9), c(80.48, 'sparkle', 0.6),
  // ── C2a 去他的 / C2b 沉默 只能 交换 假象 / C2c 这次 不用 王子 登场
  c(80.84, 'stamp', 0.8), c(81.32, 'stamp', 0.7), c(81.45, 'crash', 0.7), c(81.48, 'stamp', 0.8),
  c(81.62, 'stamp', 0.45), c(82.12, 'slash', 0.4, 1.3), c(82.64, 'shatter', 0.8), c(82.7, 'magic', 0.5), c(83.16, 'shatter', 1.0),
  c(83.5, 'whoosh', 0.4, 1.1, 0.5), c(83.55, 'pop', 0.4), c(83.82, 'stamp', 0.7), c(83.89, 'stamp', 0.6), c(84.56, 'boing', 0.6), c(84.58, 'whoosh', 0.6, 1.2),
  // ── C3 如果 被 爱 才是 终章——我要 自己 写 答案
  c(84.96, 'chime', 0.4), c(85.52, 'heartbeat', 0.8), c(85.98, 'heartbeat', 1.0), c(86.46, 'stamp', 0.8), c(86.94, 'whoosh', 0.35, 1.4),
  c(87.58, 'quill', 0.6), c(87.74, 'quill', 0.5, 1.1), c(88.1, 'pageFlip', 0.9), c(88.1, 'whoosh', 0.5), c(88.52, 'splat', 0.8), c(88.80, 'splat', 0.7),
  // ── C4 我宁愿… 自己 拿起 / C4b 猎枪！
  c(89.25, 'step', 0.5, 1, -0.5), c(89.6, 'step', 0.5, 1, -0.4), c(89.95, 'step', 0.5, 1, -0.2), c(90.3, 'whoosh', 0.4), c(90.8, 'gunCock', 0.9),
  c(91.08, 'stamp', 0.9), c(91.08, 'whoosh', 0.5), c(91.74, 'stamp', 0.9), c(92.0, 'whoosh', 0.6, 0.8, 0.5),
  // ── C5 毙掉（两枪）这 循环的 回响！（锣声回声正好一拍一回）
  c(93.13, 'gunshot', 1.0), c(93.6, 'gunshot', 0.95), c(93.88, 'whirr', 0.4, 1.5), c(95.28, 'echo', 1.0), c(95.28, 'confetti', 0.4), c(95.82, 'echo', 0.7, 1.12),
  // ── C6 我 对 此！感——（全场静音，只剩心跳和倒吸一口气）——到 厌 烦！
  c(K.wo, 'thud', 0.8), c(K.dui, 'thud', 0.8, 1.1), c(K.ci, 'thud', 0.9, 1.2), c(K.gan, 'whoosh', 0.5, 0.6),
  c(98.55, 'heartbeat', 0.9), c(K.dao, 'swell', 0.8), c(K.dao, 'boom', 0.9), c(K.dao, 'crash', 0.5),
  c(K.yan, 'stamp', 0.9), c(K.fan, 'stamp', 1.0), c(K.fan, 'crash', 1.0), c(100.0, 'firework', 0.6),
  // ── OUT 尾声：童话镇的清晨，烟花与钟声
  c(101.6, 'bells', 0.45, 1.2), c(101.3, 'sparkle', 0.3), c(103.3, 'sparkle', 0.3), c(105.3, 'sparkle', 0.35), c(107.8, 'chime', 0.4),
  ...fireworkTimes(FW_OUT.n, FW_OUT.period, FW_OUT.from, 110.6).map((t, i) => c(t, 'firework', 0.32, 0.9 + (i % 3) * 0.1, ((i * 37) % 9) / 6 - 0.66)),
];
