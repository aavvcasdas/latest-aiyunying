// 时间轴：整首歌实测 130.000 BPM（长程自相关 32/48 小节精确吻合）
// 人声/全乐队进入点实测：第一段 15.44s，第二段 104.28s（能量阶跃 + 起音峰）
// 每句歌词 = 2 小节 = 8 拍 = 3.692s，逐字挂在八分音符格上。

export const BPM = 130;
export const BEAT = 60 / BPM; // 0.4615
export const EIGHTH = BEAT / 2; // 0.2308
export const BAR = BEAT * 4; // 1.846
export const LINE_DUR = BAR * 2; // 3.692

export const BLOCK1 = 15.44; // 第一段人声起点（下拍）
export const BLOCK2 = 104.28; // 第二段人声起点（下拍）
export const INTERLUDE = BLOCK1 + 20 * LINE_DUR; // 89.28 间奏开始
export const VOCAL_END = BLOCK2 + 16 * LINE_DUR; // 163.36 最后一句结束
export const SONG_END = 178.9;
export const LEAD = 0.36; // 字幕提前多久飞入

interface LineDef {
  text: string;
  slots: number[]; // 每个字落在第几个八分音符（0..15）
}

// 副歌与主歌各自的节奏型（同结构的句子共用）
const HOOK_A = [0, 1, 2, 3, 6, 7, 8]; // 慌啥子嘛 慢慢来
const HOOK_B = [0, 1, 2, 3, 4, 5, 6, 8, 9, 10]; // 十字句
const HOOK_C = [0, 1, 2, 6, 7, 8]; // 云会在 花会开
const HOOK_D = [0, 1, 2, 3, 4, 5, 6, 8, 10]; // 九字句
const VERSE_7 = [0, 1, 2, 3, 4, 6, 8];
const VERSE_9 = [0, 1, 2, 3, 4, 5, 6, 7, 8];
const VERSE_5 = [0, 2, 4, 5, 8];
const VERSE_8 = [0, 1, 2, 3, 4, 5, 6, 8];

const CHORUS_1: LineDef[] = [
  { text: '慌啥子嘛 慢慢来', slots: HOOK_A },
  { text: '太阳下山有月亮爬上来', slots: HOOK_B },
  { text: '云会在 花会开', slots: HOOK_C },
  { text: '好运总会为你而等待', slots: HOOK_D },
];
const CHORUS_2: LineDef[] = [
  { text: '慌啥子嘛 慢慢来', slots: HOOK_A },
  { text: '每个人都有自己的节拍', slots: HOOK_B },
  { text: '得不到 就放开', slots: HOOK_C },
  { text: '一切都是最好的安排', slots: HOOK_D },
];
const VERSE_1: LineDef[] = [
  { text: '卸下一身的疲惫', slots: VERSE_7 },
  { text: '今夜枕着星光再入睡', slots: VERSE_9 },
  { text: '风啊轻轻吹', slots: VERSE_5 },
  { text: '这一刻就忘了你是谁', slots: VERSE_9 },
];
const VERSE_2: LineDef[] = [
  { text: '有时清醒有时醉', slots: VERSE_7 },
  { text: '别把所有压力自己背', slots: VERSE_9 },
  { text: '人生路还远', slots: VERSE_5 },
  { text: '你不必事事都完美', slots: VERSE_8 },
];

const ORDER: LineDef[] = [
  ...CHORUS_1, // 0-3   (15.44)
  ...VERSE_1, // 4-7
  ...VERSE_2, // 8-11
  ...CHORUS_1, // 12-15
  ...CHORUS_2, // 16-19  (ends 89.28)
  ...VERSE_1, // 20-23  (104.28)
  ...VERSE_2, // 24-27
  ...CHORUS_1, // 28-31
  ...CHORUS_2, // 32-35  (ends 163.36)
];

export interface LyricChar {
  ch: string;
  t: number; // 开口时间
  end: number; // 这个字唱到什么时候
  word: number; // 属于第几个词（按空格分）
  idx: number; // 在整句里的序号（不含空格）
}
export interface LyricLine {
  i: number;
  text: string;
  start: number;
  end: number;
  chars: LyricChar[];
  words: string[];
}

function buildLine(i: number, def: LineDef): LyricLine {
  const start = i < 20 ? BLOCK1 + i * LINE_DUR : BLOCK2 + (i - 20) * LINE_DUR;
  const end = start + LINE_DUR;
  const words = def.text.split(' ');
  const chars: LyricChar[] = [];
  let k = 0;
  words.forEach((w, wi) => {
    for (const ch of w) {
      const slot = def.slots[k] ?? def.slots[def.slots.length - 1] + k;
      chars.push({ ch, t: start + slot * EIGHTH, end: 0, word: wi, idx: k });
      k++;
    }
  });
  chars.forEach((c, j) => {
    const next = chars[j + 1];
    const lastSlot = def.slots[def.slots.length - 1];
    c.end = next ? next.t : Math.min(end - 0.25, start + (lastSlot + 4) * EIGHTH);
  });
  return { i, text: def.text, start, end, chars, words };
}

export const LINES: LyricLine[] = ORDER.map((d, i) => buildLine(i, d));

export interface BeatInfo {
  b: number; // 连续拍号（可为负）
  idx: number;
  phase: number; // 0..1 拍内相位
  pulse: number; // 拍点脉冲，拍上为 1 随后衰减
  bar: number;
  barPhase: number;
  downPulse: number; // 小节下拍脉冲
  eighthPulse: number;
}

export function beatInfo(t: number): BeatInfo {
  const anchor = t < INTERLUDE ? BLOCK1 : BLOCK2;
  const b = (t - anchor) / BEAT;
  const idx = Math.floor(b);
  const phase = b - idx;
  const bar = Math.floor(b / 4);
  const barPhase = b / 4 - bar;
  const e = b * 2;
  const ephase = e - Math.floor(e);
  return {
    b,
    idx,
    phase,
    pulse: Math.exp(-phase * 4.5),
    bar,
    barPhase,
    downPulse: Math.exp(-barPhase * 4 * 2.6),
    eighthPulse: Math.exp(-ephase * 5),
  };
}

/** 当前该显示哪一句（含提前飞入与收尾淡出） */
export function lineAt(t: number): { line: LyricLine; next: LyricLine | null } | null {
  for (let i = 0; i < LINES.length; i++) {
    const L = LINES[i];
    if (t >= L.start - LEAD && t < L.end) return { line: L, next: LINES[i + 1] ?? null };
  }
  return null;
}

export function lineIndexAt(t: number): number {
  for (let i = 0; i < LINES.length; i++) if (t >= LINES[i].start && t < LINES[i].end) return i;
  return -1;
}

/** 某个字此刻的进度：<0 未唱到，0..1 正在唱，>1 已唱过 */
export function charProgress(c: LyricChar, t: number): number {
  if (t < c.t) return (t - c.t) / 0.3; // 负数
  return (t - c.t) / Math.max(0.08, c.end - c.t);
}

export function fmtTime(s: number): string {
  s = Math.max(0, s);
  const m = Math.floor(s / 60);
  const r = Math.floor(s - m * 60);
  return `${m}:${r < 10 ? '0' : ''}${r}`;
}
