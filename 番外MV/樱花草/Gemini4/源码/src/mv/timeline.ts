// 《樱花草》实测时间轴：74.000 BPM（拍长 0.810811s，八分音符 0.405405s，小节 3.243243s）
// 全曲 277.547 秒（4:37.55），逐句逐字经 10ms STFT 齿擦音与元音共振峰实测核对。

export const FPS = 30;
export const BPM = 74.0;
export const BEAT_S = 60 / BPM;          // 0.8108108s
export const E8 = BEAT_S / 2;            // 0.4054054s
export const BAR = BEAT_S * 4;           // 3.2432432s
export const BEAT_PHI = 0.492;           // 第一实测拍点（秒）
export const DURATION = 277.547;         // 音轨实测总长（秒）

// 主歌一首句「晚风吹动着竹林」起拍 = BEAT_PHI + 31 * BEAT_S = 25.6271s
const T_V1 = BEAT_PHI + 31 * BEAT_S;     // 25.6271s
// 主歌二首句「远方钟声再响起」起拍 = T_V1 + 28 * BAR = 116.4379s
const T_V2 = T_V1 + 28 * BAR;            // 116.4379s
// 终章副歌一「恋人手中樱花草」起拍 = BEAT_PHI + 257 * BEAT_S = 208.8704s
const T_C3A = BEAT_PHI + 257 * BEAT_S;   // 208.8704s
// 终章副歌二「恋人手中樱花草」起拍 = BEAT_PHI + 289 * BEAT_S = 234.8163s
const T_C3B = BEAT_PHI + 289 * BEAT_S;   // 234.8163s

export type LyricStyle =
  | 'breeze'
  | 'firefly'
  | 'star'
  | 'chime'
  | 'ripple'
  | 'bloom'
  | 'heartbeat'
  | 'lala'
  | 'lullaby';

/**
 * 词级语义配色标签：
 * - 'base'  奶油象牙白 → 柔粉暖金扫光
 * - 'sakura'（*）樱花草粉（恋人、樱花草、春彩、微笑、思念、记号、味道、相爱）
 * - 'gold'  （^）月辉萤金（月光、一闪闪、钱币、发光、璀璨、年少、月弯弯、愿望）
 * - 'mint'  （~）竹风春翠（晚风、竹林、萤火虫、风铃、歌唱、流水、四季、一朵朵、蛙鸣、摇篮曲）
 * - 'star'  （@）星河晴蓝（身影、银河、织女星、神话、永恒、钟声、白沙滩、梦里、心在跳）
 */
export type WordTone = 'base' | 'sakura' | 'gold' | 'mint' | 'star';

export interface CharToken {
  ch: string;
  index: number;      // 在可唱音节序列中的下标
  wordIndex: number;  // 所属词下标
  inWord: number;     // 词内第几字
  wordLen: number;    // 词长度
  tone: WordTone;
  isKey: boolean;
  t0: number;         // 该字起唱时刻（秒）
  t1: number;         // 该字唱完时刻（秒）
}

export interface WordSpan {
  index: number;
  label: string;
  tone: WordTone;
  isKey: boolean;
  from: number;       // 首字 token 下标
  to: number;         // 末字 token 下标
  t0: number;         // 词起唱时刻
  t1: number;         // 词落定时刻（末字起唱）
  tEnd: number;       // 词完全唱完时刻
  charm?: 'primrose' | 'star' | 'heart' | 'note';
}

export interface LyricCue {
  id: number;
  section: string;
  display: string;    // 展示用整句文本
  seg: string;        // 词切分描述：用 / 分词，前缀 * ^ ~ @ 标语义关键词
  style: LyricStyle;
  start: number;
  end: number;
  chars: CharToken[];
  words: WordSpan[];
}

const r3 = (v: number) => Math.round(v * 1000) / 1000;
const at8 = (base: number, eighths: number[]) => eighths.map((e) => r3(base + e * E8));

// 常用旋律节奏型（以八分音符 E8 为单位，实测对齐辅音/元音起始点）
const R_7STD = [0, 1, 2, 3, 4, 5, 6];               // 晚-风-吹-动-着-竹-林
const R_6GAP = [0, 1, 2, 4, 5, 6];                  // 萤-火-虫 — 一-闪-闪 / 种-下-了 — 一-朵-朵
const R_4FLOW = [0, 2, 5, 6];                       // 流— 水—— 走-过
const R_5HAPP = [0, 2, 4, 5, 6];                    // 幸— 福— 在-蔓-延
const R_8FROG = [0, 1, 2, 3, 3.55, 4, 5, 6];        // 蛙-鸣-唱-起-了-摇-篮-曲
const R_9MARK = [0, 1, 2, 3, 4, 5, 6, 8.2, 9.2];    // 那-是-我-们-相-爱-的 — 记-号（拉长收束）
const R_9FAST = [0, 1, 2, 3, 4, 5, 6, 6.65, 7.25];  // 终章副歌一衔接二段的紧凑收句
const R_LA7 = [0, 1, 2, 3, 4, 5, 6];                // La la la la la la la
const R_LA5 = [0, 1, 2, 4, 5.8];                    // La la la la la
const R_LA8 = [0, 1, 2, 3, 4, 5, 6, 7.2];           // La la la la la la la la

interface RawCue {
  section: string;
  seg: string;
  style: LyricStyle;
  t: number[];
  end: number;
}

function makeChorus(base: number, section: string, ending: 'mark' | 'taste' | 'bridge'): RawCue[] {
  const lastSeg =
    ending === 'taste'
      ? '那是/我们/*相爱/的/*味道'
      : '那是/我们/*相爱/的/*记号';
  const lastR = ending === 'bridge' ? R_9FAST : R_9MARK;
  const lastEnd =
    ending === 'bridge'
      ? r3(base + 7 * BAR + 7.92 * E8)
      : ending === 'taste'
        ? r3(base + 7 * BAR + 12.2 * E8)
        : r3(base + 7 * BAR + 11.8 * E8);

  return [
    { section, seg: '*恋人/手中/*樱花草', style: 'bloom', t: at8(base + 0 * BAR, R_7STD), end: r3(base + 0 * BAR + 7.75 * E8) },
    { section, seg: '^春彩/~漫步/的/*微笑', style: 'bloom', t: at8(base + 1 * BAR, R_7STD), end: r3(base + 1 * BAR + 7.75 * E8) },
    { section, seg: '~种下了/~一朵朵', style: 'bloom', t: at8(base + 2 * BAR, R_6GAP), end: r3(base + 2 * BAR + 7.75 * E8) },
    { section, seg: '~青春/^璀璨/的/^年少', style: 'bloom', t: at8(base + 3 * BAR, R_7STD), end: r3(base + 3 * BAR + 7.75 * E8) },
    { section, seg: '*恋人/怀中/*樱花草', style: 'bloom', t: at8(base + 4 * BAR, R_7STD), end: r3(base + 4 * BAR + 7.75 * E8) },
    { section, seg: '听见/胸膛/*心在跳', style: 'heartbeat', t: at8(base + 5 * BAR, R_7STD), end: r3(base + 5 * BAR + 7.75 * E8) },
    { section, seg: '@偷偷的/在/*思念', style: 'heartbeat', t: at8(base + 6 * BAR, R_6GAP), end: r3(base + 6 * BAR + 7.75 * E8) },
    { section, seg: lastSeg, style: 'bloom', t: at8(base + 7 * BAR, lastR), end: lastEnd },
  ];
}

const RAW_CUES: RawCue[] = [
  // ── 主歌一（25.63s – 51.51s）────────────────────────────────────────────
  { section: '主歌一', seg: '~晚风/吹动着/~竹林', style: 'breeze', t: at8(T_V1 + 0 * BAR, R_7STD), end: r3(T_V1 + 0 * BAR + 7.75 * E8) },
  { section: '主歌一', seg: '^月光/拉长了/@身影', style: 'breeze', t: at8(T_V1 + 1 * BAR, R_7STD), end: r3(T_V1 + 1 * BAR + 7.75 * E8) },
  { section: '主歌一', seg: '~萤火虫/^一闪闪', style: 'firefly', t: at8(T_V1 + 2 * BAR, R_6GAP), end: r3(T_V1 + 2 * BAR + 7.75 * E8) },
  { section: '主歌一', seg: '满山/~飞舞/的/^钱币', style: 'firefly', t: at8(T_V1 + 3 * BAR, R_7STD), end: r3(T_V1 + 3 * BAR + 7.75 * E8) },
  { section: '主歌一', seg: '天上/@银河/在/^发光', style: 'star', t: at8(T_V1 + 4 * BAR, R_7STD), end: r3(T_V1 + 4 * BAR + 7.75 * E8) },
  { section: '主歌一', seg: '地上/~风铃/来/^歌唱', style: 'chime', t: at8(T_V1 + 5 * BAR, R_7STD), end: r3(T_V1 + 5 * BAR + 7.75 * E8) },
  { section: '主歌一', seg: '@织女星/在/^远方', style: 'star', t: at8(T_V1 + 6 * BAR, R_6GAP), end: r3(T_V1 + 6 * BAR + 7.75 * E8) },
  { section: '主歌一', seg: '古老/*浪漫/的/@神话', style: 'star', t: at8(T_V1 + 7 * BAR, R_7STD), end: r3(T_V1 + 7 * BAR + 7.75 * E8) },

  // ── 导歌一（51.57s – 64.48s）────────────────────────────────────────────
  { section: '导歌一', seg: '~流水/^走过', style: 'ripple', t: at8(T_V1 + 8 * BAR, R_4FLOW), end: r3(T_V1 + 8 * BAR + 7.75 * E8) },
  { section: '导歌一', seg: '就像/~四季/的/^变换', style: 'ripple', t: at8(T_V1 + 9 * BAR, R_7STD), end: r3(T_V1 + 9 * BAR + 7.75 * E8) },
  { section: '导歌一', seg: '*幸福/在/^蔓延', style: 'ripple', t: at8(T_V1 + 10 * BAR, R_5HAPP), end: r3(T_V1 + 10 * BAR + 7.75 * E8) },
  { section: '导歌一', seg: '*爱你/@永恒/~不孤单', style: 'bloom', t: at8(T_V1 + 11 * BAR, R_7STD), end: r3(T_V1 + 11 * BAR + 7.75 * E8) },

  // ── 副歌一（64.55s – 92.30s）────────────────────────────────────────────
  ...makeChorus(T_V1 + 12 * BAR, '副歌一', 'mark'),

  // ── 间奏一 · La la la（104.28s – 114.90s）───────────────────────────────
  { section: '间奏一', seg: '*La/^la/~la/@la/*la/^la/~la', style: 'lala', t: at8(T_V1 + 24 * BAR + 2 * E8, R_LA7), end: r3(T_V1 + 25 * BAR + 1.75 * E8) },
  { section: '间奏一', seg: '^La/*la/~la/@la/*la', style: 'lala', t: at8(T_V1 + 25 * BAR + 2 * E8, R_LA5), end: r3(T_V1 + 26 * BAR + 1.75 * E8) },
  { section: '间奏一', seg: '*La/~la/^la/@la/*la/~la/^la/*la', style: 'lala', t: at8(T_V1 + 26 * BAR + 2 * E8, R_LA8), end: r3(T_V1 + 27 * BAR + 3.9 * E8) },

  // ── 主歌二（116.44s – 142.32s）──────────────────────────────────────────
  { section: '主歌二', seg: '远方/@钟声/再/^响起', style: 'chime', t: at8(T_V2 + 0 * BAR, R_7STD), end: r3(T_V2 + 0 * BAR + 7.75 * E8) },
  { section: '主歌二', seg: '~蛙鸣/唱起了/*摇篮曲', style: 'lullaby', t: at8(T_V2 + 1 * BAR, R_8FROG), end: r3(T_V2 + 1 * BAR + 7.75 * E8) },
  { section: '主歌二', seg: '@白沙滩/^月弯弯', style: 'lullaby', t: at8(T_V2 + 2 * BAR, R_6GAP), end: r3(T_V2 + 2 * BAR + 7.75 * E8) },
  { section: '主歌二', seg: '*爱你/^香甜/的/@梦里', style: 'lullaby', t: at8(T_V2 + 3 * BAR, R_7STD), end: r3(T_V2 + 3 * BAR + 7.75 * E8) },
  { section: '主歌二', seg: '天上/@银河/在/^发光', style: 'star', t: at8(T_V2 + 4 * BAR, R_7STD), end: r3(T_V2 + 4 * BAR + 7.75 * E8) },
  { section: '主歌二', seg: '地上/~风铃/来/^歌唱', style: 'chime', t: at8(T_V2 + 5 * BAR, R_7STD), end: r3(T_V2 + 5 * BAR + 7.75 * E8) },
  { section: '主歌二', seg: '@织女星/在/^远方', style: 'star', t: at8(T_V2 + 6 * BAR, R_6GAP), end: r3(T_V2 + 6 * BAR + 7.75 * E8) },
  { section: '主歌二', seg: '许下/*爱恋/的/^愿望', style: 'star', t: at8(T_V2 + 7 * BAR, R_7STD), end: r3(T_V2 + 7 * BAR + 7.75 * E8) },

  // ── 导歌二（142.38s – 155.29s）──────────────────────────────────────────
  { section: '导歌二', seg: '~流水/^走过', style: 'ripple', t: at8(T_V2 + 8 * BAR, R_4FLOW), end: r3(T_V2 + 8 * BAR + 7.75 * E8) },
  { section: '导歌二', seg: '就像/~四季/的/^变换', style: 'ripple', t: at8(T_V2 + 9 * BAR, R_7STD), end: r3(T_V2 + 9 * BAR + 7.75 * E8) },
  { section: '导歌二', seg: '*幸福/在/^蔓延', style: 'ripple', t: at8(T_V2 + 10 * BAR, R_5HAPP), end: r3(T_V2 + 10 * BAR + 7.75 * E8) },
  { section: '导歌二', seg: '*爱你/@永恒/~不孤单', style: 'bloom', t: at8(T_V2 + 11 * BAR, R_7STD), end: r3(T_V2 + 11 * BAR + 7.75 * E8) },

  // ── 副歌二（155.36s – 183.30s）──────────────────────────────────────────
  ...makeChorus(T_V2 + 12 * BAR, '副歌二', 'taste'),

  // ── 间奏二 · La la la（185.36s – 207.40s，原曲实唱两轮）────────────────
  { section: '间奏二', seg: '*La/^la/~la/@la/*la/^la/~la', style: 'lala', t: at8(BEAT_PHI + 228 * BEAT_S, R_LA7), end: r3(BEAT_PHI + 232 * BEAT_S - 0.1) },
  { section: '间奏二', seg: '^La/*la/~la/@la/*la', style: 'lala', t: at8(BEAT_PHI + 232 * BEAT_S, R_LA5), end: r3(BEAT_PHI + 236 * BEAT_S - 0.1) },
  { section: '间奏二', seg: '*La/~la/^la/@la/*la/~la/^la/*la', style: 'lala', t: at8(BEAT_PHI + 236 * BEAT_S, R_LA8), end: r3(BEAT_PHI + 240.8 * BEAT_S) },
  { section: '间奏二', seg: '*La/^la/~la/@la/*la/^la/~la', style: 'lala', t: at8(BEAT_PHI + 242 * BEAT_S, R_LA7), end: r3(BEAT_PHI + 246 * BEAT_S - 0.1) },
  { section: '间奏二', seg: '^La/*la/~la/@la/*la', style: 'lala', t: at8(BEAT_PHI + 246 * BEAT_S, R_LA5), end: r3(BEAT_PHI + 250 * BEAT_S - 0.1) },
  { section: '间奏二', seg: '*La/~la/^la/@la/*la/~la/^la/*la', style: 'lala', t: at8(BEAT_PHI + 250 * BEAT_S, R_LA8), end: r3(BEAT_PHI + 255.2 * BEAT_S) },

  // ── 终章双副歌（208.87s – 262.80s，原曲实唱高潮重现）──────────────────
  ...makeChorus(T_C3A, '终章一', 'bridge'),
  ...makeChorus(T_C3B, '终章二', 'taste'),
];

const TONE_PREFIX: Record<string, WordTone> = {
  '*': 'sakura',
  '^': 'gold',
  '~': 'mint',
  '@': 'star',
};

function charmFor(word: string, style: LyricStyle): WordSpan['charm'] {
  if (word === '樱花草' || word === '记号' || word === '味道' || word === '一朵朵') return 'primrose';
  if (word === '心在跳' || word === '相爱' || word === '思念' || word === '幸福') return 'heart';
  if (word === '银河' || word === '织女星' || word === '萤火虫' || word === '月弯弯' || word === '愿望') return 'star';
  if (word === '风铃' || word === '歌唱' || word === '摇篮曲' || (style === 'lala' && word === 'La')) return 'note';
  return undefined;
}

function buildCue(raw: RawCue, id: number): LyricCue {
  const rawWords = raw.seg.split('/').filter(Boolean);
  const chars: CharToken[] = [];
  const words: WordSpan[] = [];
  const isLatin = raw.style === 'lala';

  rawWords.forEach((rw, wi) => {
    const first = rw[0];
    const tone: WordTone = TONE_PREFIX[first] ?? 'base';
    const clean = tone === 'base' ? rw : rw.slice(1);
    const isKey = tone !== 'base';
    const from = chars.length;

    if (isLatin) {
      // 每个 "La" / "la" 作为一个完整音节字卡（同时也是独立弹跳词块）
      const idx = chars.length;
      chars.push({
        ch: clean,
        index: idx,
        wordIndex: wi,
        inWord: 0,
        wordLen: 1,
        tone,
        isKey,
        t0: raw.t[idx] ?? raw.t[raw.t.length - 1],
        t1: 0,
      });
    } else {
      const glyphs = Array.from(clean);
      glyphs.forEach((g, gi) => {
        const idx = chars.length;
        chars.push({
          ch: g,
          index: idx,
          wordIndex: wi,
          inWord: gi,
          wordLen: glyphs.length,
          tone,
          isKey,
          t0: raw.t[idx] ?? raw.t[raw.t.length - 1],
          t1: 0,
        });
      });
    }

    const to = chars.length - 1;
    words.push({
      index: wi,
      label: clean,
      tone,
      isKey,
      from,
      to,
      t0: chars[from].t0,
      t1: chars[to].t0,
      tEnd: 0,
      charm: charmFor(clean, raw.style),
    });
  });

  // 计算每字唱完时刻 t1 与每词唱完时刻 tEnd
  for (let i = 0; i < chars.length; i++) {
    const nextT = i + 1 < chars.length ? chars[i + 1].t0 : raw.end;
    chars[i].t1 = r3(Math.max(chars[i].t0 + 0.14, Math.min(nextT, chars[i].t0 + 1.35)));
  }
  for (const w of words) {
    w.tEnd = chars[w.to].t1;
  }

  const display = isLatin
    ? words.map((w) => w.label).join(' ')
    : words.map((w) => w.label).join('');

  return {
    id,
    section: raw.section,
    display,
    seg: raw.seg,
    style: raw.style,
    start: chars[0].t0,
    end: raw.end,
    chars,
    words,
  };
}

export const LYRIC_CUES: LyricCue[] = RAW_CUES.map((rc, i) => buildCue(rc, i));

// 镜头切点：比歌词起拍提前 2 帧（0.067s），与《童话镇》卡点规则完全一致
const LEAD = 2 / FPS;
const cutOf = (cueIdx: number) => r3(LYRIC_CUES[cueIdx].start - LEAD);

export interface ShotSlot {
  id: string;
  section: string;
  a: number;
  b: number;
}

const SHOT_CUTS: Array<[string, string, number]> = [
  // 序章（0.00 – 25.56s，按前奏 8 小节每 2 小节一镜）
  ['I01', '序章', 0.0],
  ['I02', '序章', r3(BEAT_PHI + 8 * BEAT_S)],     // 6.978s
  ['I03', '序章', r3(BEAT_PHI + 16 * BEAT_S)],    // 13.465s（前奏吉他与鼓点进入）
  ['I04', '序章', r3(BEAT_PHI + 24 * BEAT_S)],    // 19.951s

  // 主歌一 L01–L08（cue 0..7）
  ['L01', '主歌一', cutOf(0)],
  ['L02', '主歌一', cutOf(1)],
  ['L03', '主歌一', cutOf(2)],
  ['L04', '主歌一', cutOf(3)],
  ['L05', '主歌一', cutOf(4)],
  ['L06', '主歌一', cutOf(5)],
  ['L07', '主歌一', cutOf(6)],
  ['L08', '主歌一', cutOf(7)],

  // 导歌一 L09–L12（cue 8..11）
  ['L09', '导歌一', cutOf(8)],
  ['L10', '导歌一', cutOf(9)],
  ['L11', '导歌一', cutOf(10)],
  ['L12', '导歌一', cutOf(11)],

  // 副歌一 L13–L20（cue 12..19）
  ['L13', '副歌一', cutOf(12)],
  ['L14', '副歌一', cutOf(13)],
  ['L15', '副歌一', cutOf(14)],
  ['L16', '副歌一', cutOf(15)],
  ['L17', '副歌一', cutOf(16)],
  ['L18', '副歌一', cutOf(17)],
  ['L19', '副歌一', cutOf(18)],
  ['L20', '副歌一', cutOf(19)],

  // 间奏一 N01–N02 + La la la L21–L23（cue 20..22）
  ['N01', '间奏一', r3(T_V1 + 21 * BAR - LEAD)],  // 93.668s
  ['N02', '间奏一', r3(T_V1 + 22.5 * BAR - LEAD)], // 98.533s
  ['L21', '间奏一', cutOf(20)],
  ['L22', '间奏一', cutOf(21)],
  ['L23', '间奏一', cutOf(22)],

  // 主歌二 L24–L31（cue 23..30）
  ['L24', '主歌二', cutOf(23)],
  ['L25', '主歌二', cutOf(24)],
  ['L26', '主歌二', cutOf(25)],
  ['L27', '主歌二', cutOf(26)],
  ['L28', '主歌二', cutOf(27)],
  ['L29', '主歌二', cutOf(28)],
  ['L30', '主歌二', cutOf(29)],
  ['L31', '主歌二', cutOf(30)],

  // 导歌二 L32–L35（cue 31..34）
  ['L32', '导歌二', cutOf(31)],
  ['L33', '导歌二', cutOf(32)],
  ['L34', '导歌二', cutOf(33)],
  ['L35', '导歌二', cutOf(34)],

  // 副歌二 L36–L43（cue 35..42）
  ['L36', '副歌二', cutOf(35)],
  ['L37', '副歌二', cutOf(36)],
  ['L38', '副歌二', cutOf(37)],
  ['L39', '副歌二', cutOf(38)],
  ['L40', '副歌二', cutOf(39)],
  ['L41', '副歌二', cutOf(40)],
  ['L42', '副歌二', cutOf(41)],
  ['L43', '副歌二', cutOf(42)],

  // 间奏二 B01–B04（cue 43..48）
  ['B01', '间奏二', cutOf(43)],
  ['B02', '间奏二', cutOf(45)],
  ['B03', '间奏二', cutOf(46)],
  ['B04', '间奏二', cutOf(48)],

  // 终章双副歌 F01–F08（cue 49..64，每两句一幅盛景长镜）
  ['F01', '终章一', cutOf(49)],
  ['F02', '终章一', cutOf(51)],
  ['F03', '终章一', cutOf(53)],
  ['F04', '终章一', cutOf(55)],
  ['F05', '终章二', cutOf(57)],
  ['F06', '终章二', cutOf(59)],
  ['F07', '终章二', cutOf(61)],
  ['F08', '终章二', cutOf(63)],

  // 尾奏 OUT1–OUT2（263.20 – 277.547s）
  ['OUT1', '尾声', r3(BEAT_PHI + 324 * BEAT_S)],  // 263.195s
  ['OUT2', '尾声', r3(BEAT_PHI + 333 * BEAT_S)],  // 270.492s
];

export const SHOT_SLOTS: ShotSlot[] = SHOT_CUTS.map(([id, section, a], i) => ({
  id,
  section,
  a,
  b: i + 1 < SHOT_CUTS.length ? SHOT_CUTS[i + 1][2] : DURATION,
}));

export interface ChapterInfo {
  name: string;
  start: number;
  shotId: string;
}

export const CHAPTERS: ChapterInfo[] = (() => {
  const seen = new Set<string>();
  const out: ChapterInfo[] = [];
  for (const s of SHOT_SLOTS) {
    if (!seen.has(s.section)) {
      seen.add(s.section);
      out.push({ name: s.section, start: s.a, shotId: s.id });
    }
  }
  return out;
})();

export interface BeatState {
  idx: number;       // 四分拍序号
  e8Idx: number;     // 八分拍序号
  phase: number;     // 0..1 四分拍内相位
  e8Phase: number;   // 0..1 八分拍内相位
  pulse: number;     // 四分拍冲击衰减 1→0
  e8Pulse: number;   // 八分拍轻弹 1→0
  down: boolean;     // 小节强拍（每 4 拍第 1 拍）
  lubDub: number;    // 74 BPM 双搏心跳包络（用于「听见胸膛心在跳」）
}

export function beatAt(t: number): BeatState {
  const raw = (t - T_V1) / BEAT_S;
  const idx = Math.floor(raw);
  const phase = raw - idx;
  const raw8 = (t - T_V1) / E8;
  const e8Idx = Math.floor(raw8);
  const e8Phase = raw8 - e8Idx;
  const pulse = Math.exp(-phase * 5.2);
  const e8Pulse = Math.exp(-e8Phase * 5.8);
  const down = ((idx % 4) + 4) % 4 === 0;
  // 心跳双搏：拍头第一搏 + 0.30 拍处第二搏
  const b1 = Math.exp(-Math.pow((phase - 0.05) / 0.09, 2));
  const b2 = 0.72 * Math.exp(-Math.pow((phase - 0.33) / 0.08, 2));
  const lubDub = Math.min(1, b1 + b2);
  return { idx, e8Idx, phase, e8Phase, pulse, e8Pulse, down, lubDub };
}

export function shotSlotAt(t: number): { index: number; slot: ShotSlot } {
  const tc = Math.max(0, Math.min(DURATION - 0.001, t));
  let lo = 0;
  let hi = SHOT_SLOTS.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (SHOT_SLOTS[mid].a <= tc) lo = mid;
    else hi = mid - 1;
  }
  return { index: lo, slot: SHOT_SLOTS[lo] };
}

export function activeCueAt(t: number): LyricCue | null {
  for (let i = 0; i < LYRIC_CUES.length; i++) {
    const c = LYRIC_CUES[i];
    if (t >= c.start - 0.16 && t <= c.end + 0.25) return c;
  }
  return null;
}
