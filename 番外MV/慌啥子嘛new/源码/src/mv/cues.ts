// 《慌啥子嘛.MP3》采样级实测时间轴与逐字/逐词卡点表
// 音源实测：44100 Hz 立体声，时长 181.2114s，恒定 130.000 BPM（拍长 0.461538s，首拍相位 0.0240s，第 34 拍 15.716s 人声起唱）

export const AUDIO_URL = './audio/huangshazima.mp3';
export const AUDIO_FALLBACK_URL =
  'https://raw.githubusercontent.com/aavvcasdas/latest-aiyunying/arena/bb6a02da-latest-aiyunying/%E6%85%8C%E5%95%A5%E5%AD%90%E5%98%9B.MP3';
export const DURATION = 181.21;
export const FPS = 30;
export const BPM = 130.0;
export const BEAT_SEC = 60.0 / BPM; // 0.46153846s
export const BEAT_T0 = 0.024;       // 实测拍点相位（第 2 拍 0.947s 乐器首音，第 34 拍 15.716s 人声首字「慌」）
export const LEAD = 2 / FPS;        // 参考《童话镇》：镜头在唱词/乐句前 2 帧切入

export const beatTime = (b: number) => BEAT_T0 + b * BEAT_SEC;

export type LyricMode =
  | 'calm'        // 慌啥子嘛 慢慢来
  | 'sunmoon'     // 太阳下山有月亮爬上来
  | 'cloudflower' // 云会在 花会开
  | 'luck'        // 好运总会为你而等待
  | 'unpack'      // 卸下一身的疲惫
  | 'starbed'     // 今夜枕着星光再入睡
  | 'breeze'      // 风啊轻轻吹
  | 'forget'      // 这一刻就忘了你是谁
  | 'tipsy'       // 有时清醒有时醉
  | 'burden'      // 别把所有压力自己背
  | 'road'        // 人生路还远
  | 'imperfect'   // 你不必事事都完美
  | 'rhythm'      // 每个人都有自己的节拍
  | 'release'     // 得不到 就放开
  | 'arrange';    // 一切都是最好的安排

export interface CharCue {
  ch: string;
  t0: number;
  t1: number;
  wordIdx: number;
  charInWord: number;
  gapBefore: boolean; // 词组停顿空格（如「慌啥子嘛 慢慢来」）
  accent: number;     // 词组配色（十六进制）
}

export interface WordCue {
  text: string;
  t0: number;
  t1: number;
  accent: number;
  tag: string;        // 语义动作标签，驱动 3D 字块与画面联动
  charIndices: number[];
}

export interface LyricCue {
  idx: number;
  text: string;
  section: SectionName;
  mode: LyricMode;
  b0: number;
  start: number;
  end: number;
  chars: CharCue[];
  words: WordCue[];
}

export type SectionName =
  | '序章'
  | '引歌'
  | '主歌一'
  | '副歌一'
  | '间奏'
  | '主歌二'
  | '副歌二'
  | '尾声';

interface PatternWord {
  w: string;
  tag: string;
  color: number;
  gap?: boolean;
  /** 每个字相对乐句首拍 b0 的起音拍位与结束拍位 [startBeat, endBeat]（由 16 分音符中置人声包络实测） */
  beats: [number, number][];
}

interface PatternDef {
  text: string;
  mode: LyricMode;
  cutOffset?: number; // 相对 b0 的切镜偏移（拍）
  words: PatternWord[];
}

// 15 组实测逐字逐词节奏模板（与 44.1kHz 中置人声 10ms 包络逐拍核对）
const PATTERNS: Record<LyricMode, PatternDef> = {
  calm: {
    text: '慌啥子嘛 慢慢来',
    mode: 'calm',
    words: [
      { w: '慌', tag: 'fluster', color: 0xff8a7a, beats: [[0.0, 0.92]] },
      { w: '啥子嘛', tag: 'tease', color: 0xffd166, beats: [[1.0, 1.92], [2.0, 2.92], [3.0, 3.88]] },
      { w: '慢慢', tag: 'slow', color: 0x8be0a4, gap: true, beats: [[4.0, 4.95], [5.0, 5.95]] },
      { w: '来', tag: 'arrive', color: 0x7fd4ff, beats: [[6.0, 7.35]] },
    ],
  },
  sunmoon: {
    text: '太阳下山有月亮爬上来',
    mode: 'sunmoon',
    words: [
      { w: '太阳', tag: 'sun', color: 0xff9e57, beats: [[0.0, 0.95], [1.0, 1.48]] },
      { w: '下山', tag: 'sink', color: 0xf27d72, beats: [[1.5, 1.98], [2.0, 2.92]] },
      { w: '有', tag: 'link', color: 0xe6b8ff, beats: [[3.0, 3.48]] },
      { w: '月亮', tag: 'moon', color: 0xffe680, beats: [[3.5, 3.98], [4.0, 4.9]] },
      { w: '爬上来', tag: 'climb', color: 0x9ec5ff, beats: [[5.0, 5.48], [5.5, 5.98], [6.0, 7.55]] },
    ],
  },
  cloudflower: {
    text: '云会在 花会开',
    mode: 'cloudflower',
    words: [
      { w: '云', tag: 'cloud', color: 0x9edbff, beats: [[0.0, 0.95]] },
      { w: '会在', tag: 'stay', color: 0xc9ecff, beats: [[1.0, 1.95], [2.0, 3.78]] },
      { w: '花', tag: 'flower', color: 0xff8fb8, gap: true, beats: [[4.0, 4.95]] },
      { w: '会开', tag: 'bloom', color: 0xffcf70, beats: [[5.0, 5.95], [6.0, 7.65]] },
    ],
  },
  luck: {
    text: '好运总会为你而等待',
    mode: 'luck',
    words: [
      { w: '好运', tag: 'lucky', color: 0xff7b6b, beats: [[0.0, 0.95], [1.0, 1.48]] },
      { w: '总会', tag: 'always', color: 0xffd166, beats: [[1.5, 1.98], [2.0, 2.95]] },
      { w: '为你', tag: 'foryou', color: 0xffa8c8, beats: [[3.0, 3.95], [4.0, 4.95]] },
      { w: '而', tag: 'link', color: 0xcbe8a0, beats: [[5.0, 5.48]] },
      { w: '等待', tag: 'wait', color: 0xffe082, beats: [[5.5, 6.15], [6.15, 7.85]] },
    ],
  },
  unpack: {
    text: '卸下一身的疲惫',
    mode: 'unpack',
    words: [
      { w: '卸下', tag: 'drop', color: 0xffb878, beats: [[1.75, 2.45], [2.45, 2.98]] },
      { w: '一身的', tag: 'body', color: 0xf7d794, beats: [[3.0, 3.48], [3.5, 3.98], [4.0, 4.88]] },
      { w: '疲惫', tag: 'exhale', color: 0xa6d8d4, beats: [[5.0, 5.95], [6.0, 7.05]] },
    ],
  },
  starbed: {
    text: '今夜枕着星光再入睡',
    mode: 'starbed',
    words: [
      { w: '今夜', tag: 'tonight', color: 0xa8b8ff, beats: [[0.0, 0.95], [1.0, 1.85]] },
      { w: '枕着', tag: 'pillow', color: 0xd8b8ff, beats: [[2.0, 2.95], [3.0, 3.48]] },
      { w: '星光', tag: 'star', color: 0xffe47a, beats: [[3.5, 3.98], [4.0, 5.1]] },
      { w: '再入睡', tag: 'sleep', color: 0x9be2ff, beats: [[5.25, 5.75], [5.75, 6.25], [6.25, 7.3]] },
    ],
  },
  breeze: {
    text: '风啊轻轻吹',
    mode: 'breeze',
    words: [
      { w: '风啊', tag: 'wind', color: 0x99ebdd, beats: [[2.0, 2.95], [3.0, 3.9]] },
      { w: '轻轻', tag: 'gentle', color: 0xc7f5c4, beats: [[4.0, 4.92], [5.0, 5.92]] },
      { w: '吹', tag: 'blow', color: 0xffe399, beats: [[6.0, 7.3]] },
    ],
  },
  forget: {
    text: '这一刻就忘了你是谁',
    mode: 'forget',
    words: [
      { w: '这一刻', tag: 'moment', color: 0xffd584, beats: [[0.0, 0.95], [1.0, 1.48], [1.5, 1.98]] },
      { w: '就忘了', tag: 'forget', color: 0xc9b8ff, beats: [[2.0, 2.95], [3.0, 3.48], [3.5, 4.0]] },
      { w: '你是谁', tag: 'who', color: 0x9ee0ff, beats: [[4.0, 4.9], [5.0, 5.92], [6.0, 7.75]] },
    ],
  },
  tipsy: {
    text: '有时清醒有时醉',
    mode: 'tipsy',
    words: [
      { w: '有时', tag: 'some1', color: 0xbce6df, beats: [[1.75, 2.35], [2.35, 2.95]] },
      { w: '清醒', tag: 'sober', color: 0x82e6d8, beats: [[3.0, 3.48], [3.5, 3.98]] },
      { w: '有时', tag: 'some2', color: 0xf5cd90, beats: [[4.0, 4.92], [5.0, 5.92]] },
      { w: '醉', tag: 'tipsy', color: 0xff99ad, beats: [[6.0, 7.15]] },
    ],
  },
  burden: {
    text: '别把所有压力自己背',
    mode: 'burden',
    words: [
      { w: '别把', tag: 'dont', color: 0xffcf75, beats: [[0.0, 0.95], [1.0, 1.88]] },
      { w: '所有', tag: 'all', color: 0xf7b28b, beats: [[2.0, 2.48], [2.5, 2.98]] },
      { w: '压力', tag: 'heavy', color: 0xb0b8d6, beats: [[3.0, 3.48], [3.5, 3.98]] },
      { w: '自己背', tag: 'share', color: 0x8fe3b8, beats: [[4.0, 4.95], [5.0, 5.95], [6.0, 7.45]] },
    ],
  },
  road: {
    text: '人生路还远',
    mode: 'road',
    words: [
      { w: '人生', tag: 'life', color: 0xffd27d, beats: [[1.75, 2.45], [2.45, 3.35]] },
      { w: '路', tag: 'path', color: 0x98e3a8, beats: [[3.5, 4.8]] },
      { w: '还远', tag: 'far', color: 0x8fd4ff, beats: [[5.0, 5.95], [6.0, 7.2]] },
    ],
  },
  imperfect: {
    text: '你不必事事都完美',
    mode: 'imperfect',
    cutOffset: -0.5, // 第 -0.5 拍起音「你」
    words: [
      { w: '你不必', tag: 'noneed', color: 0xa6dcff, beats: [[-0.5, 0.0], [0.0, 0.95], [1.0, 1.9]] },
      { w: '事事', tag: 'every', color: 0xf7c98b, beats: [[2.0, 3.35], [3.5, 4.42]] },
      { w: '都', tag: 'all', color: 0xd9b8ff, beats: [[4.5, 4.98]] },
      { w: '完美', tag: 'bloom', color: 0xff9ec2, beats: [[5.0, 5.95], [6.0, 7.65]] },
    ],
  },
  rhythm: {
    text: '每个人都有自己的节拍',
    mode: 'rhythm',
    words: [
      { w: '每个人', tag: 'everyone', color: 0xffb878, beats: [[0.0, 0.48], [0.5, 0.98], [1.0, 1.48]] },
      { w: '都有', tag: 'have', color: 0xffe07d, beats: [[1.5, 1.98], [2.0, 2.88]] },
      { w: '自己的', tag: 'own', color: 0x98e6be, beats: [[3.0, 3.48], [3.5, 3.98], [4.0, 4.88]] },
      { w: '节拍', tag: 'beat', color: 0x94ccff, beats: [[5.0, 5.92], [6.0, 7.5]] },
    ],
  },
  release: {
    text: '得不到 就放开',
    mode: 'release',
    words: [
      { w: '得不到', tag: 'miss', color: 0xc2b8e8, beats: [[0.0, 0.95], [1.0, 1.95], [2.0, 3.8]] },
      { w: '就', tag: 'then', color: 0xffe08a, gap: true, beats: [[4.0, 4.92]] },
      { w: '放开', tag: 'letgo', color: 0x8fe6d4, beats: [[5.0, 5.92], [6.0, 8.1]] },
    ],
  },
  arrange: {
    text: '一切都是最好的安排',
    mode: 'arrange',
    cutOffset: 0.55, // 紧接「放开」尾音之后、第 +0.85 拍「一」起音前切入
    words: [
      { w: '一切', tag: 'all', color: 0xffd880, beats: [[0.85, 1.48], [1.5, 1.98]] },
      { w: '都是', tag: 'are', color: 0xffb38a, beats: [[2.0, 2.48], [2.5, 2.98]] },
      { w: '最好的', tag: 'best', color: 0xff94b8, beats: [[3.0, 3.48], [3.5, 3.98], [4.0, 4.88]] },
      { w: '安排', tag: 'destiny', color: 0xffe875, beats: [[5.0, 5.95], [6.0, 9.7]] },
    ],
  },
};

// 全曲 36 句歌词顺序（与用户提供歌词及 MP3 原曲逐句 100% 对应）
const LINE_MODES: LyricMode[] = [
  // 引歌 L01–L04（第 34..65 拍）
  'calm', 'sunmoon', 'cloudflower', 'luck',
  // 主歌一 L05–L12（第 66..129 拍）
  'unpack', 'starbed', 'breeze', 'forget',
  'tipsy', 'burden', 'road', 'imperfect',
  // 副歌一 L13–L20（第 130..195 拍，随后 30 拍间奏）
  'calm', 'sunmoon', 'cloudflower', 'luck',
  'calm', 'rhythm', 'release', 'arrange',
  // 主歌二 L21–L28（第 226..289 拍）
  'unpack', 'starbed', 'breeze', 'forget',
  'tipsy', 'burden', 'road', 'imperfect',
  // 副歌二 L29–L36（第 290..355 拍，随后尾奏至 181.21s）
  'calm', 'sunmoon', 'cloudflower', 'luck',
  'calm', 'rhythm', 'release', 'arrange',
];

function sectionForIdx(idx: number): SectionName {
  if (idx < 4) return '引歌';
  if (idx < 12) return '主歌一';
  if (idx < 20) return '副歌一';
  if (idx < 28) return '主歌二';
  return '副歌二';
}

export const CUES: LyricCue[] = LINE_MODES.map((mode, idx) => {
  const pat = PATTERNS[mode];
  const b0 = 34 + idx * 8 + (idx >= 20 ? 32 : 0);
  const chars: CharCue[] = [];
  const words: WordCue[] = [];

  pat.words.forEach((pw, wIdx) => {
    const syms = [...pw.w];
    const cIndices: number[] = [];
    syms.forEach((ch, ci) => {
      const [bs, be] = pw.beats[ci];
      const t0 = beatTime(b0 + bs);
      const t1 = beatTime(b0 + be);
      cIndices.push(chars.length);
      chars.push({
        ch,
        t0,
        t1,
        wordIdx: wIdx,
        charInWord: ci,
        gapBefore: ci === 0 && Boolean(pw.gap),
        accent: pw.color,
      });
    });
    words.push({
      text: pw.w,
      t0: chars[cIndices[0]].t0,
      t1: chars[cIndices[cIndices.length - 1]].t1,
      accent: pw.color,
      tag: pw.tag,
      charIndices: cIndices,
    });
  });

  return {
    idx,
    text: pat.text,
    section: sectionForIdx(idx),
    mode,
    b0,
    start: chars[0].t0,
    end: chars[chars.length - 1].t1,
    chars,
    words,
  };
});

// ---------- 47 个镜头时间轴（序章 4 镜 + 36 句歌词各 1 镜 + 间奏 4 镜 + 尾声 3 镜） ----------
export interface ShotSlot {
  id: string;
  start: number;
  end: number;
  cueIdx: number; // -1 表示纯器乐镜头
  section: SectionName;
}

const pad2 = (n: number) => String(n).padStart(2, '0');

export const SHOT_SLOTS: ShotSlot[] = (() => {
  const raw: { id: string; start: number; cueIdx: number; section: SectionName }[] = [];

  // 序章 4 镜：对齐前奏 4 个八拍（0s / b10=4.64s / b18=8.33s / b26=12.02s）
  raw.push({ id: 'I1', start: 0, cueIdx: -1, section: '序章' });
  raw.push({ id: 'I2', start: beatTime(10) - LEAD, cueIdx: -1, section: '序章' });
  raw.push({ id: 'I3', start: beatTime(18) - LEAD, cueIdx: -1, section: '序章' });
  raw.push({ id: 'I4', start: beatTime(26) - LEAD, cueIdx: -1, section: '序章' });

  // L01–L20
  for (let i = 0; i < 20; i++) {
    const c = CUES[i];
    const off = PATTERNS[c.mode].cutOffset ?? 0;
    raw.push({
      id: `L${pad2(i + 1)}`,
      start: beatTime(c.b0 + off) - LEAD,
      cueIdx: i,
      section: c.section,
    });
  }

  // 间奏 4 镜：b196=90.49s（「安排」尾音落定处）、b203、b210、b218 -> b226=104.33s
  raw.push({ id: 'N1', start: beatTime(196) - LEAD, cueIdx: -1, section: '间奏' });
  raw.push({ id: 'N2', start: beatTime(203) - LEAD, cueIdx: -1, section: '间奏' });
  raw.push({ id: 'N3', start: beatTime(210) - LEAD, cueIdx: -1, section: '间奏' });
  raw.push({ id: 'N4', start: beatTime(218) - LEAD, cueIdx: -1, section: '间奏' });

  // L21–L36
  for (let i = 20; i < 36; i++) {
    const c = CUES[i];
    const off = PATTERNS[c.mode].cutOffset ?? 0;
    raw.push({
      id: `L${pad2(i + 1)}`,
      start: beatTime(c.b0 + off) - LEAD,
      cueIdx: i,
      section: c.section,
    });
  }

  // 尾声 3 镜：b356=164.33s（「安排」尾音落定）、b366=168.95s、b376=173.56s → 181.21s 合上绘本渐暗
  raw.push({ id: 'O1', start: beatTime(356) - LEAD, cueIdx: -1, section: '尾声' });
  raw.push({ id: 'O2', start: beatTime(366) - LEAD, cueIdx: -1, section: '尾声' });
  raw.push({ id: 'O3', start: beatTime(376) - LEAD, cueIdx: -1, section: '尾声' });

  return raw.map((r, idx) => ({
    ...r,
    end: idx + 1 < raw.length ? raw[idx + 1].start : DURATION,
  }));
})();

// ---------- 实时节拍与逐字/逐词查询辅助 ----------
export interface BeatState {
  /** 连续拍号（第 34 拍 = 0 对齐乐句强拍） */
  pos: number;
  /** 整数拍号 */
  idx: number;
  /** 当前拍内相位 0..1 */
  phase: number;
  /** 踩拍弹性脉冲 1 → 0（实拍瞬间 = 1） */
  pulse: number;
  /** 小节首拍（每 4 拍） */
  down: boolean;
  /** 乐句首拍（每 8 拍） */
  bar8: boolean;
}

export function beatAt(T: number): BeatState {
  const raw = (T - BEAT_T0) / BEAT_SEC - 2; // 第 2 拍起为 0，使 34-2=32 为整 8 拍强拍
  const idx = Math.floor(raw);
  const phase = raw - idx;
  const pulse = Math.pow(Math.max(0, 1 - phase), 2.6);
  const mod4 = ((idx % 4) + 4) % 4;
  const mod8 = ((idx % 8) + 8) % 8;
  return {
    pos: raw,
    idx,
    phase,
    pulse,
    down: mod4 === 0,
    bar8: mod8 === 0,
  };
}

export const beatSq = (bt: BeatState, amt = 0.068) => bt.pulse * amt * (bt.down ? 1 : 0.62);

export function shotSlotAt(T: number): { slot: ShotSlot; index: number; u: number } {
  const t = Math.max(0, Math.min(DURATION, T));
  let lo = 0;
  let hi = SHOT_SLOTS.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (SHOT_SLOTS[mid].start <= t) lo = mid;
    else hi = mid - 1;
  }
  const slot = SHOT_SLOTS[lo];
  const len = Math.max(0.001, slot.end - slot.start);
  return { slot, index: lo, u: Math.max(0, Math.min(1, (t - slot.start) / len)) };
}

export function activeCueAt(T: number): LyricCue | null {
  for (let i = 0; i < CUES.length; i++) {
    const c = CUES[i];
    if (T >= c.start - 0.05 && T <= c.end + 0.14) {
      // 若下一句已起音，优先显示下一句
      if (i + 1 < CUES.length && T >= CUES[i + 1].start - 0.03) continue;
      return c;
    }
  }
  return null;
}

/** 查询当前句第 wIdx 个「词」的演唱进度 0..1（供镜头内的 3D 意象精确卡词触发） */
export function wordProg(cue: LyricCue | null, wIdx: number, T: number): number {
  if (!cue || !cue.words[wIdx]) return 0;
  const w = cue.words[wIdx];
  if (T <= w.t0) return 0;
  if (T >= w.t1) return 1;
  return (T - w.t0) / Math.max(0.05, w.t1 - w.t0);
}

/** 查询当前句第 wIdx 个「词」起唱后的秒数（未唱到返回 -1），用于弹簧弹出动画 */
export function wordAge(cue: LyricCue | null, wIdx: number, T: number): number {
  if (!cue || !cue.words[wIdx]) return -1;
  return T - cue.words[wIdx].t0;
}

/** 查询当前句第 cIdx 个「字」起唱后的秒数（未唱到返回 -1） */
export function charAge(cue: LyricCue | null, cIdx: number, T: number): number {
  if (!cue || !cue.chars[cIdx]) return -1;
  return T - cue.chars[cIdx].t0;
}
