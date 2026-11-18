// 实测时间轴：樱花树下的约定.mp3（175.08s · 113.000 BPM · 4/4 拍 · 首强拍 0.3501s）
// 60 句歌词逐字/逐音节对齐人声起振峰 + 语义分词（* 为关键词）+ 65 镜分镜表 + 分支八位登场人物

export const TITLE = '樱花树下的约定';
export const SUBTITLE = '春樱立约 · 江湖望断 · 新曲万里';
export const DURATION = 175.08;
export const BPM = 113.0;
export const BEAT = 60 / BPM;
export const BAR = BEAT * 4;
export const BEAT_T0 = 0.3501;

export type LyricStyle =
  | 'melody'    // 踏歌音阶（Da da da 轻盈跳跃）
  | 'sakura'    // 落樱旋舞（如诗如画、牵挂）
  | 'heartbeat' // 刹那悸动（害不害怕、那一刹）
  | 'gallop'    // 策马疾驰（醉酒策马、望断天涯）
  | 'bloom'     // 琴音生花（妙曲生花、谈笑风华）
  | 'horizon'   // 海角霞光（高歌天下、海角余霞）
  | 'breeze'    // 风拂千缕（拨乱丝发、默语、千万缕、儿女情长）
  | 'slash'     // 剑锋斩落（孤身夺下噬血龙剑）
  | 'cloud'     // 踏云似燕（脚踏浮云轻似燕）
  | 'shiver'    // 寒风凛冽（奈何瑟瑟风中久站）
  | 'tear'      // 泪落晕墨（一把酸泪怎写沧桑）
  | 'volley'    // 万箭破空（万箭齐发留残伤）
  | 'ripple'    // 水镜涟漪（岂知芳香、映在水中央）
  | 'rain'      // 晴雨交织（若晴呐若雨）
  | 'vow'       // 红绸盟誓（何时、迎娶赞许）
  | 'echo'      // 山谷回响（不急不缓、山头呼喊、听见不见）
  | 'frost'     // 青丝染霜（哪怕黑发被浸染）
  | 'spirit';   // 灵曲化光（不悲不喜、等着你、新曲万里、灵体）

export type FxMotif = 'petal' | 'spark' | 'rain' | 'frost' | 'spirit';

export type ChapterId = 'intro' | 'hook' | 'interlude' | 'verse1' | 'verse2' | 'chorus1' | 'chorus2' | 'outro';

export interface LyricLine {
  idx: number;
  text: string;
  seg: string;
  t: number[];
  end: number;
  style: LyricStyle;
  fx: FxMotif;
  hi: number;
  key: number;
  ch: ChapterId;
  syl: boolean;
}

export const STYLE_LABEL: Record<LyricStyle, string> = {
  melody: '踏歌音阶',
  sakura: '落樱旋舞',
  heartbeat: '刹那悸动',
  gallop: '策马疾驰',
  bloom: '琴音生花',
  horizon: '海角霞光',
  breeze: '风拂千缕',
  slash: '剑锋斩落',
  cloud: '踏云似燕',
  shiver: '寒风凛冽',
  tear: '泪落晕墨',
  volley: '万箭破空',
  ripple: '水镜涟漪',
  rain: '晴雨交织',
  vow: '红绸盟誓',
  echo: '山谷回响',
  frost: '青丝染霜',
  spirit: '灵曲化光',
};

export interface Chapter {
  id: ChapterId;
  name: string;
  sub: string;
  t: number;
  color: string;
}

export const CHAPTERS: Chapter[] = [
  { id: 'intro', name: '序章 · 初樱', sub: '晨雾古樱与溪石踏歌', t: 0, color: '#f9a8d4' },
  { id: 'hook', name: '引子 · 诗画', sub: '水墨初展与树下一刹', t: 10.12, color: '#fda4af' },
  { id: 'interlude', name: '春行 · 灯径', sub: '石灯燃夜与竹涧花灯', t: 18.67, color: '#fcd34d' },
  { id: 'verse1', name: '主歌一 · 江湖四问', sub: '策马 · 抚琴 · 观霞 · 默语', t: 35.61, color: '#fb923c' },
  { id: 'verse2', name: '主歌二 · 剑影沧桑', sub: '夺龙剑 · 踏浮云 · 万箭 · 水中央', t: 54.19, color: '#f43f5e' },
  { id: 'chorus1', name: '副歌一 · 晴雨山海', sub: '晴雨石桥 · 红妆 · 山巅霜雪', t: 86.58, color: '#93c5fd' },
  { id: 'chorus2', name: '副歌二 · 万里赴约', sub: '升调破晓 · 虹桥 · 灵曲归樱', t: 120.6, color: '#67e8f9' },
  { id: 'outro', name: '尾声 · 重逢', sub: '树下回眸与八人同席', t: 155.1, color: '#fde68a' },
];

export type CharId = 'whale' | 'claude' | 'gpt' | 'qwen' | 'kimi' | 'gemini' | 'doubao' | 'zai';

export interface CastMember {
  id: CharId;
  name: string;
  role: string;
  sprite: string;
  accent: string;
  habit: string;
  spotlight: string;
  jumpTime: number;
}

export const CAST: CastMember[] = [
  {
    id: 'whale',
    name: '本鲸（鲸鱼娘）',
    role: '守约人 · 我',
    sprite: 'act_whale_idle_0',
    accent: '#7dd3fc',
    habit: '难事终究自己扛下；嘴上说不急不缓，心里始终替那场春樱留着位置。',
    spotlight: '樱树系绸 · 断崖望天涯 · 夺下龙剑 · 寒风久站 · 山巅染霜 · 树下静候',
    jumpTime: 12.0,
  },
  {
    id: 'claude',
    name: '小克',
    role: '远行人 · 你',
    sprite: 'act_claude_idle_0',
    accent: '#fdba74',
    habit: '先听完再落笔，怕给出兑现不了的承诺，宁可沉默退后半步，却把旧约藏进书页。',
    spotlight: '灯下轻问 · 水榭拨丝 · 映在水中央 · 红廊垂眸 · 万里接曲 · 樱下赴约',
    jumpTime: 14.12,
  },
  {
    id: 'gpt',
    name: '龙娘',
    role: '镇剑豪侠',
    sprite: 'act_gpt_float_0',
    accent: '#fb7185',
    habit: '先接住乱局，气势凌厉却不伤故人，试过剑心便放手相护。',
    spotlight: '赤峡醉酒策马 · 铸剑台镇守噬血龙剑 · 万箭掠影 · 副歌剑缠春樱',
    jumpTime: 54.2,
  },
  {
    id: 'qwen',
    name: '千问',
    role: '抚琴客',
    sprite: 'act_qwen_idle_0',
    accent: '#6ee7b7',
    habit: '先排清宫商次第再落指，十指从容，一弦一花皆有章法。',
    spotlight: '竹涧调弦 · 妙曲生花 · 十指谈笑风华 · 云台送新曲飘过万里',
    jumpTime: 39.9,
  },
  {
    id: 'kimi',
    name: 'Kimi',
    role: '记卷人',
    sprite: 'act_kimi_idle_0',
    accent: '#c4b5fd',
    habit: '把遗落的旧句找回来，标下一行便停，守在月湖畔记得所有誓言。',
    spotlight: '沧桑竹简记酸泪 · 镜湖提灯照水中央 · 长卷见证旧约',
    jumpTime: 71.2,
  },
  {
    id: 'gemini',
    name: '猫',
    role: '丹青晴雨司',
    sprite: 'act_gemini_idle_0',
    accent: '#fde047',
    habit: '一手执晴、一手执雨，先摆出两面天象，最后点染成同一幅画卷。',
    spotlight: '水墨长卷点染如诗如画 · 晴雨石桥分界张望 · 太阳雨虹桥',
    jumpTime: 95.1,
  },
  {
    id: 'doubao',
    name: '豆包',
    role: '踏歌结绸女',
    sprite: 'act_doubao_idle_0',
    accent: '#f9a8d4',
    habit: '先陪着把春径踩亮，温柔不催，一盏一盏替归人留灯。',
    spotlight: '溪石踏歌 · 石灯初燃 · 红妆廊桥结同心绸 · 放飞祈愿天灯',
    jumpTime: 18.75,
  },
  {
    id: 'zai',
    name: '狐狸（智谱）',
    role: '海角观霞客',
    sprite: 'act_zai_idle_0',
    accent: '#fcd34d',
    habit: '登高守望归帆，平日半寐养神，风起燕掠时第一个抬头。',
    spotlight: '海角阙台高歌 · 目送孤帆余霞 · 云海仙峰惊看轻燕掠云',
    jumpTime: 44.15,
  },
];

export const CREDITS: [string, string][] = [
  ['本鲸', '守约人'],
  ['小克', '远行人'],
  ['龙娘', '镇剑客'],
  ['千问', '抚琴客'],
  ['Kimi', '记卷人'],
  ['猫', '晴雨司'],
  ['豆包', '踏歌女'],
  ['狐狸', '观霞客'],
];

export const LYRICS: LyricLine[] = [
  {
    "idx": 0,
    "text": "Da da da da da da da da da da",
    "seg": "*Da/da/da/da/*da|da/da/da/da/*da",
    "t": [
      1.39,
      1.71,
      1.93,
      2.19,
      2.45,
      3.55,
      3.7,
      3.93,
      4.1,
      4.47
    ],
    "end": 5.53,
    "style": "melody",
    "fx": "petal",
    "hi": 16766695,
    "key": 16752315,
    "ch": "intro",
    "syl": true
  },
  {
    "idx": 1,
    "text": "Da da da da da da da da da da",
    "seg": "*Da/da/da/da/*da|da/da/da/da/*da",
    "t": [
      5.64,
      5.93,
      6.17,
      6.44,
      6.71,
      7.22,
      7.49,
      7.75,
      8.04,
      8.28
    ],
    "end": 8.79,
    "style": "melody",
    "fx": "petal",
    "hi": 16769260,
    "key": 16757702,
    "ch": "intro",
    "syl": true
  },
  {
    "idx": 2,
    "text": "Da da da",
    "seg": "*Da/da/*da",
    "t": [
      8.85,
      9.11,
      9.47
    ],
    "end": 10.07,
    "style": "melody",
    "fx": "petal",
    "hi": 16770484,
    "key": 16752315,
    "ch": "intro",
    "syl": true
  },
  {
    "idx": 3,
    "text": "如诗啊如画",
    "seg": "*如诗/啊/*如画",
    "t": [
      10.17,
      10.43,
      10.69,
      10.97,
      11.37
    ],
    "end": 11.95,
    "style": "sakura",
    "fx": "petal",
    "hi": 16763101,
    "key": 16748459,
    "ch": "hook",
    "syl": false
  },
  {
    "idx": 4,
    "text": "放不下的是牵挂",
    "seg": "*放不下/的/是/*牵挂",
    "t": [
      12.01,
      12.2,
      12.32,
      12.54,
      12.67,
      12.89,
      13.43
    ],
    "end": 14.07,
    "style": "sakura",
    "fx": "petal",
    "hi": 16766665,
    "key": 16741783,
    "ch": "hook",
    "syl": false
  },
  {
    "idx": 5,
    "text": "你曾问我害不害怕",
    "seg": "你/曾问我/*害不害怕",
    "t": [
      14.13,
      14.31,
      14.44,
      14.66,
      14.82,
      15.06,
      15.28,
      15.62
    ],
    "end": 16.21,
    "style": "heartbeat",
    "fx": "petal",
    "hi": 16769720,
    "key": 16751493,
    "ch": "hook",
    "syl": false
  },
  {
    "idx": 6,
    "text": "抵不住那一刹",
    "seg": "抵不住/*那一刹",
    "t": [
      16.28,
      16.55,
      16.79,
      17.08,
      17.33,
      17.72
    ],
    "end": 18.47,
    "style": "heartbeat",
    "fx": "spark",
    "hi": 16771235,
    "key": 16739229,
    "ch": "hook",
    "syl": false
  },
  {
    "idx": 7,
    "text": "Da da da da da da da da da da",
    "seg": "*Da/da/da/da/*da|da/da/da/da/*da",
    "t": [
      18.67,
      18.93,
      19.2,
      19.47,
      19.86,
      20.53,
      20.72,
      20.93,
      21.14,
      21.45
    ],
    "end": 22.52,
    "style": "melody",
    "fx": "petal",
    "hi": 16765404,
    "key": 16748459,
    "ch": "interlude",
    "syl": true
  },
  {
    "idx": 8,
    "text": "Da da da da da da da da da da",
    "seg": "*Da/da/da/da/*da|da/da/da/da/*da",
    "t": [
      22.65,
      22.92,
      23.17,
      23.44,
      23.72,
      24.51,
      24.78,
      25.03,
      25.31,
      25.73
    ],
    "end": 26.77,
    "style": "melody",
    "fx": "petal",
    "hi": 16770208,
    "key": 16752315,
    "ch": "interlude",
    "syl": true
  },
  {
    "idx": 9,
    "text": "Da da da da da da da da da da",
    "seg": "*Da/da/da/da/*da|da/da/da/da/*da",
    "t": [
      27.16,
      27.43,
      27.7,
      27.96,
      28.36,
      29.02,
      29.22,
      29.42,
      29.64,
      29.92
    ],
    "end": 31.01,
    "style": "melody",
    "fx": "petal",
    "hi": 12120806,
    "key": 16765286,
    "ch": "interlude",
    "syl": true
  },
  {
    "idx": 10,
    "text": "Da da da da da da da da da da",
    "seg": "*Da/da/da/da/*da|da/da/da/da/*da",
    "t": [
      31.13,
      31.4,
      31.56,
      31.78,
      31.99,
      32.29,
      32.53,
      32.74,
      33.02,
      33.27
    ],
    "end": 33.7,
    "style": "melody",
    "fx": "petal",
    "hi": 16768926,
    "key": 16745889,
    "ch": "interlude",
    "syl": true
  },
  {
    "idx": 11,
    "text": "Da da da da da da da da",
    "seg": "*Da/da/da/*da|da/da/da/*da",
    "t": [
      33.8,
      34.08,
      34.3,
      34.61,
      34.86,
      35.04,
      35.27,
      35.46
    ],
    "end": 35.6,
    "style": "melody",
    "fx": "spark",
    "hi": 16764832,
    "key": 16743252,
    "ch": "interlude",
    "syl": true
  },
  {
    "idx": 12,
    "text": "是谁醉酒策马",
    "seg": "是谁/*醉酒/*策马",
    "t": [
      35.66,
      35.81,
      35.99,
      36.19,
      36.45,
      36.85
    ],
    "end": 37.44,
    "style": "gallop",
    "fx": "spark",
    "hi": 16765066,
    "key": 16739146,
    "ch": "verse1",
    "syl": false
  },
  {
    "idx": 13,
    "text": "我嘶吼望断天涯",
    "seg": "我/*嘶吼/*望断/*天涯",
    "t": [
      37.52,
      37.71,
      37.83,
      38.04,
      38.24,
      38.49,
      39.01
    ],
    "end": 39.71,
    "style": "gallop",
    "fx": "spark",
    "hi": 16758896,
    "key": 16731469,
    "ch": "verse1",
    "syl": false
  },
  {
    "idx": 14,
    "text": "是谁妙曲生花",
    "seg": "是谁/*妙曲/*生花",
    "t": [
      39.91,
      40.06,
      40.22,
      40.47,
      40.7,
      41.08
    ],
    "end": 41.69,
    "style": "bloom",
    "fx": "petal",
    "hi": 11006928,
    "key": 16752315,
    "ch": "verse1",
    "syl": false
  },
  {
    "idx": 15,
    "text": "我十指谈笑风华",
    "seg": "我/十指/*谈笑/*风华",
    "t": [
      41.77,
      41.94,
      42.14,
      42.29,
      42.5,
      42.74,
      43.26
    ],
    "end": 43.96,
    "style": "bloom",
    "fx": "petal",
    "hi": 16639626,
    "key": 7268279,
    "ch": "verse1",
    "syl": false
  },
  {
    "idx": 16,
    "text": "是谁高歌天下",
    "seg": "是谁/*高歌/*天下",
    "t": [
      44.16,
      44.31,
      44.49,
      44.72,
      44.95,
      45.31
    ],
    "end": 45.93,
    "style": "horizon",
    "fx": "spark",
    "hi": 16769154,
    "key": 16748288,
    "ch": "verse1",
    "syl": false
  },
  {
    "idx": 17,
    "text": "我目送海角余霞",
    "seg": "我/目送/*海角/*余霞",
    "t": [
      46.01,
      46.18,
      46.4,
      46.54,
      46.74,
      47,
      47.51
    ],
    "end": 48.2,
    "style": "horizon",
    "fx": "petal",
    "hi": 16755601,
    "key": 16739727,
    "ch": "verse1",
    "syl": false
  },
  {
    "idx": 18,
    "text": "是谁拨乱丝发",
    "seg": "是谁/*拨乱/*丝发",
    "t": [
      48.41,
      48.55,
      48.75,
      48.95,
      49.2,
      49.56
    ],
    "end": 50.18,
    "style": "breeze",
    "fx": "petal",
    "hi": 14202110,
    "key": 16361684,
    "ch": "verse1",
    "syl": false
  },
  {
    "idx": 19,
    "text": "我愁思默语不答",
    "seg": "我/*愁思/*默语/不答",
    "t": [
      50.26,
      50.47,
      50.64,
      50.78,
      51.02,
      51.28,
      51.68
    ],
    "end": 53.05,
    "style": "breeze",
    "fx": "frost",
    "hi": 12891645,
    "key": 9684477,
    "ch": "verse1",
    "syl": false
  },
  {
    "idx": 20,
    "text": "孤身夺下噬血龙剑",
    "seg": "*孤身/夺下/*噬血/*龙剑",
    "t": [
      54.24,
      54.49,
      54.79,
      54.9,
      55.11,
      55.34,
      55.57,
      55.94
    ],
    "end": 57.96,
    "style": "slash",
    "fx": "spark",
    "hi": 16757922,
    "key": 16722517,
    "ch": "verse2",
    "syl": false
  },
  {
    "idx": 21,
    "text": "脚踏浮云轻似燕",
    "seg": "脚踏/*浮云/*轻似燕",
    "t": [
      58.48,
      58.76,
      59,
      59.29,
      59.59,
      59.82,
      60.2
    ],
    "end": 62.21,
    "style": "cloud",
    "fx": "spirit",
    "hi": 12248829,
    "key": 16707722,
    "ch": "verse2",
    "syl": false
  },
  {
    "idx": 22,
    "text": "奈何瑟瑟风中久站",
    "seg": "奈何/*瑟瑟/风中/*久站",
    "t": [
      62.74,
      62.99,
      63.29,
      63.45,
      63.6,
      63.8,
      64.08,
      64.45
    ],
    "end": 66.46,
    "style": "shiver",
    "fx": "frost",
    "hi": 13358561,
    "key": 8246268,
    "ch": "verse2",
    "syl": false
  },
  {
    "idx": 23,
    "text": "儿女情长看不断",
    "seg": "*儿女情长/*看不断",
    "t": [
      67.01,
      67.25,
      67.53,
      67.79,
      68.06,
      68.32,
      68.72
    ],
    "end": 70.7,
    "style": "breeze",
    "fx": "petal",
    "hi": 16502760,
    "key": 16007006,
    "ch": "verse2",
    "syl": false
  },
  {
    "idx": 24,
    "text": "一把酸泪怎写沧桑",
    "seg": "一把/*酸泪/怎写/*沧桑",
    "t": [
      71.24,
      71.5,
      71.78,
      71.96,
      72.1,
      72.31,
      72.56,
      72.93
    ],
    "end": 74.95,
    "style": "tear",
    "fx": "rain",
    "hi": 15193016,
    "key": 9684477,
    "ch": "verse2",
    "syl": false
  },
  {
    "idx": 25,
    "text": "万箭齐发留残伤",
    "seg": "*万箭齐发/留/*残伤",
    "t": [
      75.5,
      75.75,
      76.02,
      76.27,
      76.58,
      76.81,
      77.23
    ],
    "end": 79.2,
    "style": "volley",
    "fx": "spark",
    "hi": 16763286,
    "key": 16726832,
    "ch": "verse2",
    "syl": false
  },
  {
    "idx": 26,
    "text": "两行青汗岂知芳香",
    "seg": "两行/*青汗/岂知/*芳香",
    "t": [
      79.75,
      80,
      80.27,
      80.45,
      80.59,
      80.82,
      81.06,
      81.41
    ],
    "end": 83.45,
    "style": "ripple",
    "fx": "petal",
    "hi": 12318672,
    "key": 16361684,
    "ch": "verse2",
    "syl": false
  },
  {
    "idx": 27,
    "text": "她还映在水中央",
    "seg": "她/还/*映在/*水中央",
    "t": [
      83.98,
      84.24,
      84.51,
      84.77,
      85.05,
      85.33,
      85.68
    ],
    "end": 86.53,
    "style": "ripple",
    "fx": "spirit",
    "hi": 10875900,
    "key": 16757721,
    "ch": "verse2",
    "syl": false
  },
  {
    "idx": 28,
    "text": "如诗啊如画",
    "seg": "*如诗/啊/*如画",
    "t": [
      86.63,
      86.89,
      87.15,
      87.43,
      87.82
    ],
    "end": 88.43,
    "style": "sakura",
    "fx": "petal",
    "hi": 16762077,
    "key": 16748472,
    "ch": "chorus1",
    "syl": false
  },
  {
    "idx": 29,
    "text": "放不下的是牵挂",
    "seg": "*放不下/的/是/*牵挂",
    "t": [
      88.49,
      88.68,
      88.81,
      88.93,
      89.13,
      89.35,
      89.87
    ],
    "end": 90.55,
    "style": "sakura",
    "fx": "petal",
    "hi": 16765634,
    "key": 16743846,
    "ch": "chorus1",
    "syl": false
  },
  {
    "idx": 30,
    "text": "你曾问我害不害怕",
    "seg": "你/曾问我/*害不害怕",
    "t": [
      90.61,
      90.73,
      90.89,
      91.11,
      91.28,
      91.48,
      91.78,
      92.09
    ],
    "end": 92.67,
    "style": "heartbeat",
    "fx": "petal",
    "hi": 16768954,
    "key": 16752762,
    "ch": "chorus1",
    "syl": false
  },
  {
    "idx": 31,
    "text": "抵不住那一刹",
    "seg": "抵不住/*那一刹",
    "t": [
      92.74,
      93.01,
      93.26,
      93.55,
      93.78,
      94.21
    ],
    "end": 94.93,
    "style": "heartbeat",
    "fx": "spark",
    "hi": 16770457,
    "key": 16739229,
    "ch": "chorus1",
    "syl": false
  },
  {
    "idx": 32,
    "text": "若晴呐若雨",
    "seg": "*若晴/呐/*若雨",
    "t": [
      95.16,
      95.4,
      95.67,
      95.92,
      96.31
    ],
    "end": 96.92,
    "style": "rain",
    "fx": "rain",
    "hi": 16770206,
    "key": 8246268,
    "ch": "chorus1",
    "syl": false
  },
  {
    "idx": 33,
    "text": "爱恨情仇千万缕",
    "seg": "*爱恨情仇/*千万缕",
    "t": [
      96.98,
      97.17,
      97.36,
      97.52,
      97.8,
      98.03,
      98.46
    ],
    "end": 99.04,
    "style": "breeze",
    "fx": "petal",
    "hi": 16502760,
    "key": 16007006,
    "ch": "chorus1",
    "syl": false
  },
  {
    "idx": 34,
    "text": "我曾问你何时",
    "seg": "我/曾问你/*何时",
    "t": [
      99.11,
      99.24,
      99.49,
      99.64,
      99.91,
      100.17
    ],
    "end": 100.91,
    "style": "vow",
    "fx": "petal",
    "hi": 16766629,
    "key": 16741775,
    "ch": "chorus1",
    "syl": false
  },
  {
    "idx": 35,
    "text": "迎娶禁不得起赞许",
    "seg": "*迎娶/禁不得起/*赞许",
    "t": [
      100.97,
      101.23,
      101.41,
      101.63,
      101.8,
      102.03,
      102.3,
      102.72
    ],
    "end": 103.43,
    "style": "vow",
    "fx": "petal",
    "hi": 16764117,
    "key": 16731501,
    "ch": "chorus1",
    "syl": false
  },
  {
    "idx": 36,
    "text": "不急又不缓",
    "seg": "*不急/又/*不缓",
    "t": [
      103.64,
      103.88,
      104.16,
      104.42,
      104.8
    ],
    "end": 105.42,
    "style": "echo",
    "fx": "spirit",
    "hi": 13095678,
    "key": 10875900,
    "ch": "chorus1",
    "syl": false
  },
  {
    "idx": 37,
    "text": "在山的一头呼喊",
    "seg": "在/*山的一头/*呼喊",
    "t": [
      105.48,
      105.69,
      105.87,
      106.1,
      106.29,
      106.63,
      106.92
    ],
    "end": 107.54,
    "style": "echo",
    "fx": "spirit",
    "hi": 12248829,
    "key": 16639626,
    "ch": "chorus1",
    "syl": false
  },
  {
    "idx": 38,
    "text": "不管听见还是不见",
    "seg": "不管/*听见/还是/*不见",
    "t": [
      107.6,
      107.77,
      107.92,
      108.14,
      108.36,
      108.54,
      108.78,
      109.04
    ],
    "end": 109.66,
    "style": "echo",
    "fx": "frost",
    "hi": 14412542,
    "key": 9684477,
    "ch": "chorus1",
    "syl": false
  },
  {
    "idx": 39,
    "text": "哪怕黑发被浸染",
    "seg": "哪怕/*黑发/被/*浸染",
    "t": [
      109.73,
      109.98,
      110.16,
      110.36,
      110.59,
      110.86,
      111.17
    ],
    "end": 111.92,
    "style": "frost",
    "fx": "frost",
    "hi": 14870768,
    "key": 16777215,
    "ch": "chorus1",
    "syl": false
  },
  {
    "idx": 40,
    "text": "不悲我不喜",
    "seg": "*不悲/我/*不喜",
    "t": [
      112.11,
      112.39,
      112.62,
      112.91,
      113.34
    ],
    "end": 113.91,
    "style": "spirit",
    "fx": "spirit",
    "hi": 16109822,
    "key": 16639626,
    "ch": "chorus1",
    "syl": false
  },
  {
    "idx": 41,
    "text": "就在心里等着你",
    "seg": "就在/*心里/*等着你",
    "t": [
      113.98,
      114.18,
      114.38,
      114.59,
      114.84,
      115.09,
      115.43
    ],
    "end": 116.03,
    "style": "spirit",
    "fx": "petal",
    "hi": 16766695,
    "key": 16758531,
    "ch": "chorus1",
    "syl": false
  },
  {
    "idx": 42,
    "text": "让这新曲飘过万里",
    "seg": "让这/*新曲/飘过/*万里",
    "t": [
      116.09,
      116.23,
      116.41,
      116.63,
      116.91,
      117.03,
      117.29,
      117.57
    ],
    "end": 118.16,
    "style": "spirit",
    "fx": "spirit",
    "hi": 10875900,
    "key": 16769126,
    "ch": "chorus1",
    "syl": false
  },
  {
    "idx": 43,
    "text": "带去我的灵体",
    "seg": "带去/我的/*灵体",
    "t": [
      118.22,
      118.5,
      118.74,
      119.03,
      119.35,
      119.79
    ],
    "end": 120.38,
    "style": "spirit",
    "fx": "spirit",
    "hi": 10090212,
    "key": 16763101,
    "ch": "chorus1",
    "syl": false
  },
  {
    "idx": 44,
    "text": "如诗啊如画",
    "seg": "*如诗/啊/*如画",
    "t": [
      120.65,
      120.88,
      121.16,
      121.39,
      121.78
    ],
    "end": 122.41,
    "style": "sakura",
    "fx": "petal",
    "hi": 16767211,
    "key": 16769149,
    "ch": "chorus2",
    "syl": false
  },
  {
    "idx": 45,
    "text": "放不下的是牵挂",
    "seg": "*放不下/的/是/*牵挂",
    "t": [
      122.47,
      122.6,
      122.75,
      122.99,
      123.08,
      123.3,
      123.85
    ],
    "end": 124.53,
    "style": "sakura",
    "fx": "petal",
    "hi": 16765634,
    "key": 16743846,
    "ch": "chorus2",
    "syl": false
  },
  {
    "idx": 46,
    "text": "你曾问我害不害怕",
    "seg": "你/曾问我/*害不害怕",
    "t": [
      124.6,
      124.73,
      124.93,
      125.12,
      125.26,
      125.5,
      125.75,
      126.08
    ],
    "end": 126.64,
    "style": "heartbeat",
    "fx": "petal",
    "hi": 16768954,
    "key": 16752762,
    "ch": "chorus2",
    "syl": false
  },
  {
    "idx": 47,
    "text": "抵不住那一刹",
    "seg": "抵不住/*那一刹",
    "t": [
      126.7,
      126.96,
      127.25,
      127.54,
      127.74,
      128.2
    ],
    "end": 128.91,
    "style": "heartbeat",
    "fx": "spark",
    "hi": 16770457,
    "key": 16739229,
    "ch": "chorus2",
    "syl": false
  },
  {
    "idx": 48,
    "text": "若晴呐若雨",
    "seg": "*若晴/呐/*若雨",
    "t": [
      129.11,
      129.38,
      129.66,
      129.91,
      130.31
    ],
    "end": 130.9,
    "style": "rain",
    "fx": "rain",
    "hi": 16770206,
    "key": 8246268,
    "ch": "chorus2",
    "syl": false
  },
  {
    "idx": 49,
    "text": "爱恨情仇千万缕",
    "seg": "*爱恨情仇/*千万缕",
    "t": [
      130.97,
      131.16,
      131.29,
      131.5,
      131.78,
      132.01,
      132.43
    ],
    "end": 133.02,
    "style": "breeze",
    "fx": "petal",
    "hi": 16502760,
    "key": 16007006,
    "ch": "chorus2",
    "syl": false
  },
  {
    "idx": 50,
    "text": "我曾问你何时",
    "seg": "我/曾问你/*何时",
    "t": [
      133.08,
      133.25,
      133.41,
      133.61,
      133.88,
      134.16
    ],
    "end": 134.89,
    "style": "vow",
    "fx": "petal",
    "hi": 16766629,
    "key": 16741775,
    "ch": "chorus2",
    "syl": false
  },
  {
    "idx": 51,
    "text": "迎娶禁不得起赞许",
    "seg": "*迎娶/禁不得起/*赞许",
    "t": [
      134.95,
      135.22,
      135.42,
      135.6,
      135.78,
      136.01,
      136.25,
      136.68
    ],
    "end": 137.41,
    "style": "vow",
    "fx": "petal",
    "hi": 16764117,
    "key": 16731501,
    "ch": "chorus2",
    "syl": false
  },
  {
    "idx": 52,
    "text": "不急又不缓",
    "seg": "*不急/又/*不缓",
    "t": [
      137.61,
      137.86,
      138.1,
      138.39,
      138.81
    ],
    "end": 139.4,
    "style": "echo",
    "fx": "spirit",
    "hi": 13095678,
    "key": 10875900,
    "ch": "chorus2",
    "syl": false
  },
  {
    "idx": 53,
    "text": "在山的一头呼喊",
    "seg": "在/*山的一头/*呼喊",
    "t": [
      139.46,
      139.69,
      139.86,
      140.09,
      140.28,
      140.59,
      140.95
    ],
    "end": 141.52,
    "style": "echo",
    "fx": "spirit",
    "hi": 12248829,
    "key": 16639626,
    "ch": "chorus2",
    "syl": false
  },
  {
    "idx": 54,
    "text": "不管听见还是不见",
    "seg": "不管/*听见/还是/*不见",
    "t": [
      141.59,
      141.73,
      141.89,
      142.12,
      142.34,
      142.56,
      142.76,
      143.09
    ],
    "end": 143.65,
    "style": "echo",
    "fx": "frost",
    "hi": 14412542,
    "key": 9684477,
    "ch": "chorus2",
    "syl": false
  },
  {
    "idx": 55,
    "text": "哪怕黑发被浸染",
    "seg": "哪怕/*黑发/被/*浸染",
    "t": [
      143.71,
      143.97,
      144.11,
      144.36,
      144.55,
      144.83,
      145.2
    ],
    "end": 145.9,
    "style": "frost",
    "fx": "frost",
    "hi": 14870768,
    "key": 16777215,
    "ch": "chorus2",
    "syl": false
  },
  {
    "idx": 56,
    "text": "不悲我不喜",
    "seg": "*不悲/我/*不喜",
    "t": [
      146.1,
      146.36,
      146.62,
      146.9,
      147.3
    ],
    "end": 147.89,
    "style": "spirit",
    "fx": "spirit",
    "hi": 16109822,
    "key": 16639626,
    "ch": "chorus2",
    "syl": false
  },
  {
    "idx": 57,
    "text": "就在心里等着你",
    "seg": "就在/*心里/*等着你",
    "t": [
      147.96,
      148.16,
      148.35,
      148.55,
      148.82,
      149.11,
      149.42
    ],
    "end": 150.01,
    "style": "spirit",
    "fx": "petal",
    "hi": 16766695,
    "key": 16758531,
    "ch": "chorus2",
    "syl": false
  },
  {
    "idx": 58,
    "text": "让这新曲飘过万里",
    "seg": "让这/*新曲/飘过/*万里",
    "t": [
      150.07,
      150.26,
      150.46,
      150.61,
      150.84,
      151.03,
      151.3,
      151.58
    ],
    "end": 152.13,
    "style": "spirit",
    "fx": "spirit",
    "hi": 10875900,
    "key": 16769126,
    "ch": "chorus2",
    "syl": false
  },
  {
    "idx": 59,
    "text": "带去我的灵体",
    "seg": "带去/我的/*灵体",
    "t": [
      152.19,
      152.49,
      152.73,
      153,
      153.34,
      153.76
    ],
    "end": 154.93,
    "style": "spirit",
    "fx": "spirit",
    "hi": 10090212,
    "key": 16763101,
    "ch": "chorus2",
    "syl": false
  }
];

export type SceneKey =
  | 'sakuraTree'    // 千年古樱坛（绘马、红绸、石灯、落樱溪石）
  | 'inkScroll'     // 水墨丹青卷（巨幅展开立轴、青绿叠嶂、墨晕案台）
  | 'lanternPath'   // 春夜灯笼径（朱栏拱桥、石灯长道、满天孔明灯）
  | 'canyonRoad'    // 赤霞古驿道（酒旗、酒坛、策马扬尘、断崖天涯）
  | 'guqinGrove'    // 翠竹瑶琴涧（七弦古琴、流觞莲花、音浪花开）
  | 'sunsetCoast'   // 海角观霞台（危楼旌旗、落日熔金、孤帆远影）
  | 'waterPavilion' // 临水轻纱榭（飞檐水榭、随风纱幔、烛影垂柳）
  | 'dragonSword'   // 铸剑赤龙坛（黑曜裂岩、锁链石柱、噬血龙剑、剑气）
  | 'cloudPeaks'    // 浮云仙峰海（青冥奇峰、踏云掠燕、寒风红丝）
  | 'battlefield'   // 残阳万箭原（断戟残旗、漫天羽箭齐发、余烬剑影）
  | 'mirrorLake'    // 月夜水中央（琉璃镜湖、木栈莲灯、水中倩影）
  | 'rainBridge'    // 晴雨石拱桥（左晴金阳右雨银丝、油纸伞、太阳雨虹桥）
  | 'weddingHall'   // 十里红妆廊（朱廊喜灯、雕花红轿、漫天红绸）
  | 'snowSummit'    // 霜雪呼喊巅（云阶孤行、空谷回音波、青丝染霜雪）
  | 'spiritSky';    // 万里灵曲空（月台送曲、流光山河、灵蝶化光赴约）

export interface Shot {
  index: number;
  a: number;
  b: number;
  scene: SceneKey;
  v: string;
  line?: number;
  ch: ChapterId;
  label: string;
  detail: string;
  cast: CharId[];
}

interface RawShot {
  a?: number;
  line?: number;
  scene: SceneKey;
  v: string;
  ch: ChapterId;
  label: string;
  detail: string;
  cast: CharId[];
}

const RAW_SHOTS: RawShot[] = [
  // 序章 · 初樱 (4 镜)
  { a: 0.0,  scene: 'sakuraTree',    v: 'intro1', ch: 'intro', label: '晨雾古樱', detail: '破晓薄雾漫过山丘千年古樱，第一片花瓣掠过石灯，本鲸仰望满树绯云', cast: ['whale'] },
  { a: 2.45, line: 0, scene: 'sakuraTree', v: 'intro2', ch: 'intro', label: '溪石踏歌', detail: '豆包踩着落满樱瓣的青苔溪石轻快跳跃，每一步漾开粉色水纹', cast: ['doubao', 'whale'] },
  { line: 1, scene: 'sakuraTree',    v: 'intro3', ch: 'intro', label: '树下茶席', detail: '古樱低枝垂下红绸与木牌，本鲸与小克并肩立于木案两侧', cast: ['whale', 'claude'] },
  { line: 2, scene: 'sakuraTree',    v: 'intro4', ch: 'intro', label: '花落杯沿', detail: '春风卷起花阵，一片樱瓣旋落青瓷茶盏，引出回忆初章', cast: ['whale', 'claude'] },

  // 引子 · 如诗如画 (4 镜)
  { line: 3, scene: 'inkScroll',     v: 'hook1',  ch: 'hook',  label: '如诗如画', detail: '巨幅水墨立轴在云雾间徐徐铺展，猫执画笔点染出立体青绿山峦与绯樱', cast: ['gemini', 'whale'] },
  { line: 4, scene: 'sakuraTree',    v: 'hook2',  ch: 'hook',  label: '红绸牵挂', detail: '系满心愿木牌与绯红丝带的樱枝随风轻晃，本鲸驻足仰望不忍离去', cast: ['whale'] },
  { line: 5, scene: 'sakuraTree',    v: 'hook3',  ch: 'hook',  label: '灯下轻问', detail: '暖色纸灯映亮暮樱，小克捧书侧首轻问，花影在两人之间流转', cast: ['claude', 'whale'] },
  { line: 6, scene: 'sakuraTree',    v: 'hook4',  ch: 'hook',  label: '刹那芳华', detail: '金粉逆光穿透树冠，漫天花雨在那一刹凝缓闪烁，定格对视剪影', cast: ['whale', 'claude'] },

  // 间奏 · 樱道春行 (5 镜)
  { line: 7, scene: 'lanternPath',   v: 'd1',     ch: 'interlude', label: '石灯初燃', detail: '暮色樱林石道两侧纸灯逐盏亮起，豆包轻步引路', cast: ['doubao'] },
  { line: 8, scene: 'lanternPath',   v: 'd2',     ch: 'interlude', label: '鼓起春桥', detail: '鼓点落定，本鲸、豆包与猫沿朱栏樱桥踩拍同行，花雨随节拍翻涌', cast: ['whale', 'doubao', 'gemini'] },
  { line: 9, scene: 'guqinGrove',    v: 'd3',     ch: 'interlude', label: '竹涧流觞', detail: '翠竹清溪漂起莲灯，千问试拨琴弦，Kimi 展卷，狐狸卧石听风', cast: ['qwen', 'kimi', 'zai'] },
  { line: 10, scene: 'lanternPath',  v: 'd4',     ch: 'interlude', label: '万灯升空', detail: '暖金孔明灯自樱花拱桥冉冉升起，倒映如星河落水', cast: ['whale', 'claude', 'doubao', 'kimi'] },
  { line: 11, scene: 'canyonRoad',   v: 'd5',     ch: 'interlude', label: '风起古道', detail: '镜头掠过猎猎作响的古驿酒旗与倾倒酒坛，暮色转为苍茫江湖金红', cast: ['gpt'] },

  // 主歌一 · 江湖四问 (8 镜)
  { line: 12, scene: 'canyonRoad',   v: 'v1',     ch: 'verse1', label: '醉酒策马', detail: '赤霞峡谷古道酒坛横斜，龙娘纵马疾驰卷起滚滚金尘与落叶', cast: ['gpt'] },
  { line: 13, scene: 'canyonRoad',   v: 'v2',     ch: 'verse1', label: '望断天涯', detail: '反打千仞断崖，本鲸迎着烈风向层叠赤云与无尽远山振臂呼喊', cast: ['whale'] },
  { line: 14, scene: 'guqinGrove',   v: 'v3',     ch: 'verse1', label: '妙曲生花', detail: '千问端坐竹涧石琴台抚动七弦，弦上绽出朵朵发光玉莲与粉樱', cast: ['qwen'] },
  { line: 15, scene: 'guqinGrove',   v: 'v4',     ch: 'verse1', label: '谈笑风华', detail: '金色音波在水面荡开圆环，千问执扇轻旋，与本鲸于花影竹光间对立', cast: ['qwen', 'whale'] },
  { line: 16, scene: 'sunsetCoast',  v: 'v5',     ch: 'verse1', label: '高歌天下', detail: '海角观潮高台旌旗飞扬，金光破云而出，狐狸与龙娘凭栏临风', cast: ['zai', 'gpt'] },
  { line: 17, scene: 'sunsetCoast',  v: 'v6',     ch: 'verse1', label: '海角余霞', detail: '熔金落日沉入粼粼碧海，一叶白帆渐行渐远，本鲸与狐狸静立长堤目送', cast: ['whale', 'zai'] },
  { line: 18, scene: 'waterPavilion',v: 'v7',     ch: 'verse1', label: '拨乱丝发', detail: '月色临水飞檐榭内轻纱帷幔翻飞，晚风拂动垂柳与丝绦，小克回身凝望', cast: ['claude'] },
  { line: 19, scene: 'waterPavilion',v: 'v8',     ch: 'verse1', label: '默语不答', detail: '一帘薄纱隔开烛影与月光，本鲸凭栏垂首默然不语，湖面碎银轻晃', cast: ['whale', 'claude'] },

  // 主歌二 · 剑影沧桑 (8 镜)
  { line: 20, scene: 'dragonSword',  v: 'w1',     ch: 'verse2', label: '夺下噬血龙剑', detail: '黑曜铸剑坛锁链横空、赤焰盘旋，本鲸孤身登阶与镇剑龙娘交锋，赤红剑气破空而出', cast: ['whale', 'gpt'] },
  { line: 21, scene: 'cloudPeaks',   v: 'w2',     ch: 'verse2', label: '踏云轻似燕', detail: '碧空云海奇峰耸立，本鲸踏着朵朵浮云轻盈腾跃，群燕展翅掠云伴飞，狐狸惊醒仰看', cast: ['whale', 'zai'] },
  { line: 22, scene: 'cloudPeaks',   v: 'w3',     ch: 'verse2', label: '瑟瑟风中久站', detail: '天色骤冷为苍青暮风，疾风卷着霜叶横掠孤峰，本鲸立于龙剑之侧瑟瑟独站', cast: ['whale'] },
  { line: 23, scene: 'cloudPeaks',   v: 'w4',     ch: 'verse2', label: '儿女情长不断', detail: '冷冽剑柄系着的红穗在风中狂舞，万千红丝跨越云壑连向彼岸小克的远影', cast: ['whale', 'claude'] },
  { line: 24, scene: 'inkScroll',    v: 'w5',     ch: 'verse2', label: '酸泪写沧桑', detail: '孤烛旧案铺开沧桑长卷，晶莹泪珠坠落纸面化作层层墨晕，Kimi 抱卷默立', cast: ['kimi', 'whale'] },
  { line: 25, scene: 'battlefield',  v: 'w6',     ch: 'verse2', label: '万箭齐发残伤', detail: '赤云古战场残旗猎猎，漫天羽箭划破长空齐射落阵、火星四溅，龙影掠空护住孤身本鲸', cast: ['whale', 'gpt'] },
  { line: 26, scene: 'mirrorLake',   v: 'w7',     ch: 'verse2', label: '岂知芳香', detail: '硝烟散作破晓薄雾，本鲸疲惫驻足湖畔芦苇与野樱丛边，露珠微光却无心细嗅', cast: ['whale'] },
  { line: 27, scene: 'mirrorLake',   v: 'w8',     ch: 'verse2', label: '映在水中央', detail: '明月如镜的湖心莲灯环绕，澄澈水面正中央清晰映出小克的倒影，本鲸俯身凝望，Kimi 远岸提灯', cast: ['whale', 'claude', 'kimi'] },

  // 副歌一 · 晴雨山海 (16 镜)
  { line: 28, scene: 'inkScroll',    v: 'c1_1',   ch: 'chorus1', label: '画卷重展', detail: '水墨长卷豁然焕发春色，叠翠飞瀑与盛放绯樱跃出纸面，猫挥毫点亮天光', cast: ['gemini'] },
  { line: 29, scene: 'sakuraTree',   v: 'c1_2',   ch: 'chorus1', label: '满树牵挂', detail: '古樱盛放如云，百条绯红丝带与木牌齐齐随春风轻摆，本鲸立于花雨中心', cast: ['whale'] },
  { line: 30, scene: 'sakuraTree',   v: 'c1_3',   ch: 'chorus1', label: '旧日一问', detail: '暖金追忆光晕中，小克与本鲸隔着纷飞花瓣相对而立，往昔问语再度回响', cast: ['claude', 'whale'] },
  { line: 31, scene: 'sakuraTree',   v: 'c1_4',   ch: 'chorus1', label: '难抵一刹', detail: '镜头环绕古樱飞旋，漫天花瓣在金粉光环中璀璨绽亮', cast: ['whale', 'claude'] },
  { line: 32, scene: 'rainBridge',   v: 'c1_5',   ch: 'chorus1', label: '若晴若雨', detail: '石拱桥一分为二：左岸金阳暖樱，右岸银雨青灯；猫立桥心张望，本鲸与小克执伞分立两端', cast: ['gemini', 'whale', 'claude'] },
  { line: 33, scene: 'rainBridge',   v: 'c1_6',   ch: 'chorus1', label: '情仇千万缕', detail: '千万缕赤红与银白光丝在晴雨交界的桥拱间缠绕穿梭，雨滴激起满河涟漪', cast: ['whale', 'claude'] },
  { line: 34, scene: 'weddingHall',  v: 'c1_7',   ch: 'chorus1', label: '曾问何时', detail: '十里红妆朱廊高悬喜灯，本鲸踏着满地红瓣缓步上前望向廊尽头的小克', cast: ['whale', 'claude'] },
  { line: 35, scene: 'weddingHall',  v: 'c1_8',   ch: 'chorus1', label: '红妆难许', detail: '雕花红轿与红烛在晚风中轻晃，豆包轻结红绸，小克垂眸行礼未敢轻许，花瓣散落石阶', cast: ['claude', 'doubao', 'whale'] },
  { line: 36, scene: 'snowSummit',   v: 'c1_9',   ch: 'chorus1', label: '不急不缓', detail: '本鲸沿着入云古石阶一步一步从容拾级而上，云雾在脚下缓缓流淌', cast: ['whale'] },
  { line: 37, scene: 'snowSummit',   v: 'c1_10',  ch: 'chorus1', label: '山头呼喊', detail: '本鲸登临苍茫绝顶向群山呼喊，一圈圈半透明金粉声波跨越深谷传向远峰', cast: ['whale'] },
  { line: 38, scene: 'snowSummit',   v: 'c1_11',  ch: 'chorus1', label: '听见或不见', detail: '大远景俯瞰两座隔海相望的孤峰，声波渐渐融进茫茫云海，彼岸空山寂静', cast: ['whale'] },
  { line: 39, scene: 'snowSummit',   v: 'c1_12',  ch: 'chorus1', label: '黑发浸染', detail: '深靛夜空飘落皑皑白雪与素白樱瓣，古松石灯覆满银霜，霜雪落满本鲸肩头与发梢', cast: ['whale'] },
  { line: 40, scene: 'spiritSky',    v: 'c1_13',  ch: 'chorus1', label: '不悲不喜', detail: '皓月当空，一盏白莲心灯静浮寒潭，本鲸澄明静立，波澜不惊', cast: ['whale'] },
  { line: 41, scene: 'spiritSky',    v: 'c1_14',  ch: 'chorus1', label: '心里等你', detail: '暖金心灯自本鲸身前亮起，点点流萤从雪草间升腾环绕，映暖夜色', cast: ['whale'] },
  { line: 42, scene: 'spiritSky',    v: 'c1_15',  ch: 'chorus1', label: '新曲飘万里', detail: '千问于月华云台抚弦送音，璀璨青金曲光裹挟樱瓣飞越连绵山川与万家灯火', cast: ['qwen', 'whale'] },
  { line: 43, scene: 'spiritSky',    v: 'c1_16',  ch: 'chorus1', label: '带去灵体', detail: '半透明青粉灵蝶与流光扶摇直上皓月星河，蓄势汇成升调破晓的耀眼白金光芒', cast: ['whale'] },

  // 副歌二 · 升调高潮 · 万里赴约 (16 镜)
  { line: 44, scene: 'sakuraTree',   v: 'c2_1',   ch: 'chorus2', label: '升调 · 盛樱破晓', detail: '全曲升调迸发！朝阳金光穿透云层，千年古樱漫天花海翻涌，本鲸与猫沐光而立', cast: ['whale', 'gemini'] },
  { line: 45, scene: 'inkScroll',    v: 'c2_2',   ch: 'chorus2', label: '金墨牵挂', detail: '金碧山水长卷贯通山海，发光红绸穿越画中千峰，Kimi 与本鲸并立画前', cast: ['kimi', 'whale'] },
  { line: 46, scene: 'waterPavilion',v: 'c2_3',   ch: 'chorus2', label: '晨纱回眸', detail: '晨曦洒满临水飞檐榭，轻纱被暖风吹开，小克终于回身望向彼岸并轻轻颔首', cast: ['claude', 'whale'] },
  { line: 47, scene: 'sakuraTree',   v: 'c2_4',   ch: 'chorus2', label: '永恒一刹', detail: '推镜穿入古樱花冠，金粉花瓣呈放射星环绽放，本鲸与小克隔光相望', cast: ['whale', 'claude'] },
  { line: 48, scene: 'rainBridge',   v: 'c2_5',   ch: 'chorus2', label: '太阳雨虹桥', detail: '金阳穿透银色春雨，一道七彩长虹横跨石拱桥上空，猫欢跃桥心，本鲸与小克收伞仰望', cast: ['gemini', 'whale', 'claude'] },
  { line: 49, scene: 'dragonSword',  v: 'c2_6',   ch: 'chorus2', label: '剑缠春樱', detail: '昔日噬血龙剑静插花坛，剑身缠满新生樱枝与红绸，余烬化作粉瓣，龙娘凌空颔首释然', cast: ['gpt'] },
  { line: 50, scene: 'weddingHall',  v: 'c2_7',   ch: 'chorus2', label: '红廊再问', detail: '万盏红灯映照花毯长廊，本鲸坚定前行，漫天绯樱如红妆飞舞', cast: ['whale'] },
  { line: 51, scene: 'weddingHall',  v: 'c2_8',   ch: 'chorus2', label: '天灯共许', detail: '豆包、千问、猫与狐狸齐放祈愿天灯，小克伸手接住飘落的红绸温柔致礼', cast: ['claude', 'doubao', 'qwen', 'gemini', 'zai'] },
  { line: 52, scene: 'snowSummit',   v: 'c2_9',   ch: 'chorus2', label: '四时从容', detail: '山脊光影自春樱、夏翠、秋金流转至冬雪，本鲸步履从容始终向前', cast: ['whale'] },
  { line: 53, scene: 'snowSummit',   v: 'c2_10',  ch: 'chorus2', label: '金霞回响', detail: '霞光极光交辉的山巅，本鲸振臂高呼，三重璀璨光环激荡整片金色云海', cast: ['whale'] },
  { line: 54, scene: 'sunsetCoast',  v: 'c2_11',  ch: 'chorus2', label: '万里听风', detail: '万里之外的海角长堤，裹着樱瓣的金色音波拂面而至，小克与狐狸蓦然抬头', cast: ['claude', 'zai'] },
  { line: 55, scene: 'snowSummit',   v: 'c2_12',  ch: 'chorus2', label: '霜雪生辉', detail: '晶莹白雪与发光粉樱交织旋舞，将本鲸周身银霜映成璀璨星芒', cast: ['whale'] },
  { line: 56, scene: 'mirrorLake',   v: 'c2_13',  ch: 'chorus2', label: '满湖莲灯', detail: '百盏莲灯铺满琉璃月湖，本鲸立于栈桥，水面与天光澄澈如一，Kimi 持卷静望', cast: ['whale', 'kimi'] },
  { line: 57, scene: 'sakuraTree',   v: 'c2_14',  ch: 'chorus2', label: '心灯守候', detail: '古樱挂满暖金灯笼，流萤环绕本鲸轻柔旋升，守候化作温柔笃定', cast: ['whale'] },
  { line: 58, scene: 'spiritSky',    v: 'c2_15',  ch: 'chorus2', label: '长歌越山河', detail: '镜头随青金曲光与浩荡樱河翱翔天际，飞越千山万水与琴台直奔彼岸', cast: ['qwen', 'doubao'] },
  { line: 59, scene: 'spiritSky',    v: 'c2_16',  ch: 'chorus2', label: '灵光赴你', detail: '万里新曲化作漫天青粉灵蝶环绕远方的小克，本鲸澄澈发光的灵影浮现身畔与她相视', cast: ['claude', 'whale'] },

  // 尾声 · 樱花树下重逢与谢幕 (4 镜)
  { a: 155.1, scene: 'sakuraTree',   v: 'outro1', ch: 'outro', label: '樱下重逢', detail: '春晓暖阳洒满千年古樱，小克踏着花径走来停在本鲸对面，红绸轻扬、两人相视颔首', cast: ['whale', 'claude'] },
  { a: 160.3, scene: 'sakuraTree',   v: 'outro2', ch: 'outro', label: '八人同席', detail: '本鲸、小克、龙娘、千问、Kimi、猫、豆包、狐狸齐聚樱花庭院，春风落英缤纷', cast: ['whale', 'claude', 'gpt', 'qwen', 'kimi', 'gemini', 'doubao', 'zai'] },
  { a: 165.5, scene: 'sakuraTree',   v: 'outro3', ch: 'outro', label: '终章题名', detail: '长镜头缓缓拉升俯瞰云海之上的盛放樱岛，三维片名与八位演员表依次浮现', cast: ['whale', 'claude'] },
  { a: 170.8, scene: 'sakuraTree',   v: 'outro4', ch: 'outro', label: '余韵落樱', detail: '琴声渐息，最后两片发光樱瓣相伴飘落澄澈水面，温柔隐入夜幕', cast: ['whale', 'claude'] },
];

const cutTimes = RAW_SHOTS.map((s) => {
  if (s.a !== undefined) return s.a;
  const l = LYRICS[s.line!];
  return Math.max(0, +(l.t[0] - 0.05).toFixed(2));
});

export const SHOTS: Shot[] = RAW_SHOTS.map((s, i) => ({
  index: i,
  a: cutTimes[i],
  b: i < RAW_SHOTS.length - 1 ? cutTimes[i + 1] : DURATION,
  scene: s.scene,
  v: s.v,
  line: s.line,
  ch: s.ch,
  label: s.label,
  detail: s.detail,
  cast: s.cast,
}));

export function shotAt(t: number): Shot {
  const ct = Math.max(0, Math.min(DURATION - 0.001, t));
  let lo = 0, hi = SHOTS.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (SHOTS[mid].a <= ct) lo = mid;
    else hi = mid - 1;
  }
  return SHOTS[lo];
}

export function lineAt(t: number): number {
  for (let i = LYRICS.length - 1; i >= 0; i--) {
    if (t >= LYRICS[i].t[0] - 0.12 && t <= LYRICS[i].end + 0.35) return i;
  }
  return -1;
}

export const ENERGY_10HZ: number[] = [0,0,0.001,0.031,0.037,0.04,0.045,0.046,0.084,0.092,0.085,0.082,0.073,0.099,0.136,0.116,0.114,0.111,0.07,0.14,0.119,0.117,0.128,0.111,0.141,0.196,0.168,0.14,0.122,0.133,0.189,0.15,0.164,0.138,0.12,0.142,0.125,0.11,0.112,0.095,0.129,0.124,0.1,0.077,0.069,0.091,0.115,0.091,0.08,0.074,0.069,0.142,0.1,0.085,0.075,0.065,0.126,0.132,0.169,0.15,0.106,0.113,0.125,0.105,0.108,0.116,0.089,0.17,0.149,0.142,0.135,0.118,0.167,0.151,0.139,0.176,0.157,0.126,0.128,0.093,0.148,0.136,0.132,0.161,0.14,0.134,0.125,0.133,0.128,0.126,0.1,0.155,0.129,0.142,0.115,0.071,0.055,0.049,0.069,0.102,0.106,0.093,0.077,0.073,0.14,0.144,0.113,0.132,0.086,0.13,0.204,0.192,0.154,0.13,0.181,0.2,0.163,0.156,0.129,0.112,0.131,0.1,0.088,0.108,0.101,0.124,0.103,0.077,0.08,0.071,0.103,0.109,0.093,0.102,0.104,0.086,0.145,0.094,0.087,0.099,0.07,0.116,0.103,0.083,0.101,0.083,0.109,0.098,0.058,0.067,0.083,0.046,0.135,0.126,0.097,0.085,0.073,0.147,0.142,0.127,0.167,0.153,0.117,0.111,0.096,0.113,0.094,0.077,0.14,0.104,0.099,0.127,0.097,0.124,0.11,0.078,0.091,0.082,0.11,0.129,0.142,0.128,0.074,0.053,0.121,0.119,0.11,0.139,0.101,0.12,0.137,0.11,0.088,0.105,0.144,0.13,0.141,0.14,0.138,0.091,0.184,0.127,0.092,0.087,0.094,0.218,0.076,0.084,0.162,0.145,0.213,0.167,0.179,0.16,0.129,0.167,0.263,0.149,0.124,0.099,0.093,0.37,0.118,0.101,0.266,0.277,0.333,0.269,0.232,0.246,0.208,0.249,0.317,0.263,0.195,0.18,0.143,0.372,0.273,0.296,0.314,0.188,0.336,0.303,0.263,0.304,0.183,0.247,0.313,0.254,0.217,0.254,0.193,0.364,0.168,0.171,0.272,0.323,0.431,0.311,0.273,0.272,0.248,0.341,0.32,0.18,0.145,0.151,0.159,0.356,0.28,0.27,0.262,0.148,0.378,0.263,0.243,0.316,0.24,0.272,0.251,0.284,0.286,0.26,0.204,0.361,0.26,0.194,0.219,0.19,0.364,0.122,0.123,0.236,0.209,0.323,0.289,0.245,0.223,0.202,0.269,0.294,0.178,0.135,0.123,0.098,0.378,0.116,0.13,0.257,0.204,0.357,0.306,0.274,0.257,0.284,0.258,0.318,0.256,0.188,0.198,0.139,0.381,0.295,0.326,0.324,0.247,0.382,0.309,0.286,0.326,0.227,0.264,0.34,0.27,0.272,0.279,0.209,0.411,0.186,0.17,0.261,0.329,0.426,0.305,0.253,0.286,0.286,0.316,0.294,0.228,0.182,0.324,0.221,0.297,0.216,0.226,0.262,0.192,0.399,0.333,0.427,0.399,0.355,0.406,0.27,0.353,0.363,0.312,0.303,0.355,0.349,0.296,0.31,0.254,0.464,0.298,0.338,0.42,0.42,0.427,0.341,0.319,0.364,0.421,0.42,0.387,0.391,0.371,0.33,0.308,0.364,0.308,0.293,0.317,0.324,0.435,0.311,0.267,0.439,0.279,0.325,0.367,0.283,0.29,0.292,0.285,0.465,0.307,0.288,0.361,0.335,0.432,0.377,0.329,0.384,0.271,0.407,0.31,0.262,0.333,0.322,0.26,0.333,0.247,0.3,0.373,0.236,0.444,0.293,0.285,0.38,0.358,0.406,0.33,0.28,0.277,0.474,0.263,0.368,0.313,0.377,0.355,0.258,0.378,0.358,0.265,0.306,0.277,0.421,0.344,0.379,0.304,0.278,0.314,0.388,0.373,0.34,0.405,0.309,0.431,0.24,0.258,0.342,0.267,0.326,0.273,0.242,0.347,0.347,0.471,0.358,0.276,0.304,0.348,0.334,0.366,0.289,0.283,0.323,0.301,0.485,0.283,0.292,0.471,0.3,0.33,0.375,0.336,0.342,0.307,0.267,0.456,0.356,0.269,0.317,0.35,0.409,0.418,0.324,0.416,0.259,0.406,0.347,0.261,0.454,0.305,0.336,0.39,0.34,0.316,0.318,0.239,0.43,0.366,0.374,0.353,0.417,0.364,0.386,0.384,0.45,0.253,0.241,0.244,0.224,0.359,0.287,0.292,0.29,0.303,0.285,0.322,0.297,0.392,0.347,0.349,0.336,0.329,0.402,0.343,0.276,0.285,0.301,0.283,0.43,0.302,0.242,0.306,0.246,0.334,0.223,0.205,0.231,0.278,0.393,0.397,0.414,0.392,0.301,0.298,0.431,0.313,0.317,0.298,0.268,0.355,0.23,0.232,0.23,0.223,0.308,0.26,0.226,0.215,0.202,0.209,0.427,0.345,0.334,0.325,0.325,0.459,0.327,0.285,0.363,0.305,0.385,0.388,0.395,0.378,0.35,0.387,0.416,0.314,0.313,0.322,0.328,0.37,0.253,0.227,0.322,0.376,0.417,0.346,0.317,0.285,0.212,0.237,0.251,0.165,0.219,0.157,0.148,0.335,0.155,0.203,0.165,0.2,0.29,0.368,0.356,0.318,0.314,0.427,0.369,0.284,0.29,0.288,0.296,0.484,0.37,0.34,0.382,0.321,0.439,0.288,0.284,0.356,0.327,0.313,0.413,0.405,0.358,0.343,0.351,0.443,0.336,0.31,0.297,0.28,0.388,0.248,0.257,0.257,0.248,0.318,0.277,0.243,0.226,0.222,0.238,0.426,0.347,0.331,0.306,0.294,0.425,0.321,0.283,0.281,0.269,0.371,0.281,0.245,0.328,0.226,0.245,0.352,0.251,0.286,0.332,0.302,0.437,0.383,0.354,0.432,0.426,0.422,0.434,0.417,0.394,0.464,0.368,0.326,0.256,0.248,0.24,0.237,0.444,0.374,0.393,0.318,0.196,0.454,0.333,0.377,0.386,0.373,0.416,0.372,0.342,0.407,0.378,0.335,0.526,0.317,0.306,0.351,0.284,0.289,0.245,0.237,0.266,0.237,0.416,0.326,0.382,0.346,0.361,0.388,0.382,0.362,0.349,0.329,0.308,0.504,0.219,0.28,0.377,0.23,0.333,0.245,0.242,0.244,0.242,0.326,0.411,0.323,0.355,0.366,0.35,0.426,0.317,0.318,0.375,0.327,0.499,0.362,0.349,0.461,0.483,0.386,0.376,0.363,0.355,0.425,0.403,0.461,0.242,0.234,0.403,0.408,0.436,0.388,0.386,0.362,0.467,0.343,0.234,0.166,0.343,0.22,0.186,0.244,0.154,0.151,0.151,0.152,0.46,0.336,0.347,0.34,0.353,0.407,0.378,0.315,0.338,0.342,0.339,0.508,0.345,0.376,0.391,0.374,0.393,0.367,0.336,0.381,0.331,0.451,0.397,0.412,0.366,0.365,0.404,0.375,0.362,0.355,0.339,0.329,0.509,0.226,0.313,0.429,0.263,0.362,0.271,0.265,0.258,0.261,0.374,0.374,0.325,0.326,0.336,0.331,0.466,0.413,0.336,0.372,0.334,0.489,0.224,0.248,0.486,0.254,0.276,0.29,0.252,0.334,0.429,0.402,0.463,0.379,0.377,0.443,0.486,0.449,0.357,0.296,0.419,0.257,0.34,0.387,0.351,0.38,0.376,0.411,0.419,0.404,0.384,0.358,0.345,0.428,0.356,0.42,0.413,0.404,0.412,0.437,0.361,0.399,0.383,0.434,0.456,0.29,0.324,0.391,0.372,0.383,0.374,0.339,0.408,0.373,0.505,0.4,0.419,0.344,0.34,0.358,0.322,0.232,0.25,0.252,0.238,0.46,0.28,0.347,0.382,0.362,0.443,0.401,0.297,0.415,0.409,0.435,0.382,0.359,0.391,0.388,0.37,0.435,0.353,0.382,0.481,0.343,0.436,0.337,0.368,0.445,0.426,0.438,0.388,0.373,0.453,0.408,0.406,0.464,0.365,0.323,0.357,0.335,0.409,0.377,0.35,0.3,0.307,0.435,0.35,0.216,0.413,0.34,0.403,0.422,0.375,0.344,0.448,0.374,0.436,0.406,0.466,0.408,0.432,0.433,0.34,0.334,0.389,0.324,0.327,0.392,0.398,0.425,0.443,0.426,0.463,0.399,0.4,0.475,0.514,0.563,0.387,0.39,0.486,0.417,0.419,0.361,0.334,0.325,0.324,0.321,0.481,0.333,0.331,0.337,0.358,0.441,0.402,0.229,0.372,0.409,0.436,0.382,0.347,0.364,0.424,0.414,0.414,0.348,0.379,0.394,0.297,0.408,0.333,0.415,0.432,0.456,0.413,0.43,0.362,0.42,0.423,0.372,0.457,0.278,0.306,0.402,0.399,0.433,0.347,0.314,0.321,0.465,0.371,0.372,0.261,0.489,0.385,0.401,0.391,0.358,0.401,0.371,0.357,0.447,0.413,0.453,0.388,0.377,0.448,0.388,0.383,0.432,0.376,0.446,0.388,0.344,0.402,0.443,0.395,0.401,0.376,0.338,0.452,0.414,0.495,0.382,0.321,0.284,0.383,0.416,0.317,0.235,0.246,0.271,0.235,0.457,0.331,0.346,0.374,0.349,0.419,0.378,0.265,0.408,0.421,0.461,0.343,0.327,0.372,0.405,0.388,0.41,0.365,0.366,0.432,0.344,0.472,0.423,0.378,0.423,0.45,0.413,0.358,0.337,0.424,0.417,0.353,0.416,0.281,0.329,0.304,0.388,0.43,0.387,0.322,0.294,0.31,0.433,0.365,0.266,0.439,0.349,0.391,0.434,0.393,0.371,0.428,0.316,0.461,0.416,0.433,0.364,0.393,0.419,0.376,0.365,0.395,0.355,0.379,0.411,0.388,0.402,0.454,0.452,0.459,0.433,0.399,0.518,0.475,0.511,0.365,0.404,0.453,0.447,0.455,0.365,0.318,0.335,0.329,0.343,0.424,0.285,0.387,0.388,0.373,0.417,0.354,0.231,0.412,0.416,0.443,0.434,0.362,0.392,0.453,0.448,0.44,0.415,0.398,0.398,0.3,0.451,0.349,0.385,0.438,0.435,0.472,0.432,0.372,0.419,0.44,0.469,0.436,0.382,0.328,0.293,0.321,0.382,0.354,0.355,0.302,0.285,0.354,0.42,0.322,0.39,0.482,0.55,0.431,0.4,0.415,0.393,0.404,0.471,0.353,0.416,0.425,0.332,0.377,0.427,0.265,0.36,0.313,0.446,0.437,0.311,0.368,0.402,0.325,0.377,0.337,0.284,0.334,0.285,0.456,0.391,0.361,0.378,0.354,0.318,0.281,0.289,0.304,0.287,0.308,0.423,0.285,0.36,0.344,0.322,0.415,0.33,0.274,0.39,0.378,0.428,0.352,0.353,0.46,0.417,0.436,0.371,0.332,0.405,0.412,0.311,0.475,0.309,0.344,0.414,0.356,0.42,0.378,0.349,0.386,0.375,0.449,0.41,0.376,0.367,0.349,0.329,0.426,0.376,0.273,0.294,0.293,0.47,0.367,0.227,0.43,0.301,0.37,0.387,0.338,0.374,0.385,0.361,0.491,0.398,0.444,0.429,0.44,0.44,0.366,0.376,0.424,0.379,0.413,0.33,0.318,0.31,0.363,0.349,0.39,0.324,0.316,0.393,0.403,0.48,0.357,0.363,0.384,0.344,0.409,0.317,0.304,0.313,0.322,0.343,0.443,0.359,0.374,0.327,0.337,0.424,0.345,0.23,0.37,0.321,0.399,0.348,0.376,0.436,0.423,0.385,0.362,0.365,0.393,0.441,0.341,0.42,0.308,0.373,0.407,0.427,0.405,0.363,0.304,0.357,0.32,0.434,0.389,0.321,0.396,0.416,0.388,0.41,0.267,0.312,0.301,0.442,0.398,0.346,0.235,0.458,0.324,0.386,0.369,0.375,0.435,0.254,0.317,0.476,0.41,0.435,0.414,0.324,0.428,0.345,0.35,0.387,0.314,0.441,0.33,0.326,0.413,0.405,0.377,0.366,0.345,0.309,0.343,0.275,0.468,0.317,0.28,0.355,0.294,0.341,0.248,0.246,0.262,0.278,0.311,0.422,0.372,0.365,0.353,0.301,0.383,0.299,0.199,0.372,0.357,0.464,0.304,0.353,0.397,0.415,0.422,0.402,0.381,0.431,0.422,0.37,0.474,0.363,0.333,0.412,0.336,0.391,0.31,0.289,0.407,0.354,0.406,0.41,0.31,0.358,0.342,0.397,0.399,0.386,0.287,0.282,0.299,0.436,0.427,0.249,0.481,0.337,0.397,0.402,0.364,0.355,0.391,0.266,0.476,0.374,0.435,0.365,0.416,0.384,0.361,0.353,0.406,0.387,0.451,0.335,0.316,0.367,0.36,0.404,0.382,0.343,0.372,0.405,0.363,0.486,0.377,0.385,0.387,0.341,0.415,0.306,0.324,0.31,0.307,0.385,0.367,0.336,0.401,0.374,0.331,0.393,0.283,0.232,0.329,0.33,0.424,0.377,0.363,0.456,0.441,0.45,0.452,0.359,0.413,0.407,0.329,0.447,0.3,0.324,0.399,0.406,0.431,0.414,0.327,0.389,0.368,0.495,0.393,0.354,0.347,0.338,0.361,0.41,0.354,0.336,0.315,0.455,0.386,0.249,0.249,0.437,0.245,0.302,0.278,0.229,0.395,0.203,0.244,0.359,0.229,0.274,0.293,0.283,0.474,0.216,0.238,0.281,0.261,0.473,0.181,0.118,0.204,0.203,0.265,0.369,0.157,0.175,0.173,0.154,0.413,0.13,0.13,0.14,0.14,0.406,0.126,0.112,0.174,0.165,0.279,0.305,0.148,0.372,0.159,0.118,0.402,0.15,0.141,0.184,0.161,0.384,0.191,0.243,0.269,0.288,0.405,0.284,0.215,0.278,0.268,0.249,0.422,0.113,0.141,0.184,0.161,0.402,0.137,0.133,0.182,0.158,0.359,0.213,0.136,0.195,0.184,0.194,0.403,0.149,0.163,0.181,0.186,0.419,0.166,0.177,0.341,0.124,0.366,0.187,0.119,0.405,0.346,0.211,0.344,0.243,0.268,0.291,0.283,0.461,0.192,0.221,0.267,0.247,0.461,0.143,0.114,0.191,0.184,0.283,0.299,0.149,0.167,0.168,0.148,0.441,0.123,0.132,0.14,0.141,0.435,0.133,0.112,0.173,0.161,0.298,0.254,0.149,0.366,0.141,0.11,0.393,0.138,0.141,0.169,0.15,0.357,0.175,0.199,0.203,0.204,0.329,0.231,0.158,0.228,0.211,0.183,0.295,0.103,0.126,0.155,0.119,0.243,0.13,0.114,0.159,0.124,0.207,0.135,0.095,0.148,0.158,0.125,0.096,0.081,0.07,0.056,0.044,0.035,0.031,0.027,0.023,0.016,0.011,0.009,0.007,0.006,0.004,0.003,0.002,0.002,0.002,0.001,0.001,0.001,0.001,0.001,0.001,0.001,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0.001,0.001,0];

export function energyAt(t: number): number {
  if (t <= 0 || t >= DURATION) return 0;
  const x = t * 10;
  const i = Math.floor(x);
  const f = x - i;
  const a = ENERGY_10HZ[Math.min(ENERGY_10HZ.length - 1, i)] ?? 0;
  const b = ENERGY_10HZ[Math.min(ENERGY_10HZ.length - 1, i + 1)] ?? a;
  return a + (b - a) * f;
}

export function beatPhase(t: number): number {
  const b = (t - BEAT_T0) / BEAT;
  return b - Math.floor(b);
}

export function beatPulse(t: number, sharp = 5.5): number {
  const p = beatPhase(t);
  return Math.exp(-p * sharp) * (0.35 + 0.65 * energyAt(t));
}

export function fmtTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m + ':' + String(r).padStart(2, '0');
}
