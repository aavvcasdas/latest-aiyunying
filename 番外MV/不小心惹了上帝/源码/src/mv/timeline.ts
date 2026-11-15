import type { CharId } from './actors';
import { SONG_DURATION } from './core';

export type LookPreset =
  | 'cathedral'
  | 'astral'
  | 'tribunal'
  | 'storm'
  | 'archive'
  | 'tears'
  | 'dreamgate'
  | 'rooftop'
  | 'bloom'
  | 'miracle';

export type LyricStyle =
  | 'thunderDrop'
  | 'vortexDive'
  | 'impactShake'
  | 'driftWave'
  | 'pageFlip'
  | 'tearFall'
  | 'dreamPop'
  | 'heavySink'
  | 'miracleRise';

export interface LyricCue {
  id: string;
  text: string;
  /** '/' divides words, '*' highlights keyword, '|' breaks into staggered 3D rows */
  segSrc: string;
  /** Measured onset time (seconds) for EVERY character in `text` */
  t: number[];
  end: number;
  style: LyricStyle;
  /** [normalFillHex, keywordFillHex, strokeHex, depthHex] */
  colors: [number, number, number, number];
  /** Optional 3D layout overrides */
  y?: number;
  size?: number;
  tilt?: number;
}

export const LYRIC_CUES: LyricCue[] = [
  {
    id: 'L01',
    text: '不小心惹了上帝',
    segSrc: '不小心/惹了/*上帝',
    t: [1.12, 1.40, 1.72, 1.95, 2.10, 2.58, 2.90],
    end: 3.32,
    style: 'thunderDrop',
    colors: [0xffe082, 0xff5a5f, 0x1b102c, 0x5c1a32],
    y: -1.35,
    size: 0.48,
    tilt: 0.11,
  },
  {
    id: 'L02',
    text: '他钻进我的身体',
    segSrc: '他/*钻进/我的/*身体',
    t: [3.48, 3.78, 4.08, 4.28, 4.44, 4.93, 5.28],
    end: 5.65,
    style: 'vortexDive',
    colors: [0x7ce8ff, 0xffd166, 0x0c1630, 0x1d406b],
    y: -1.36,
    size: 0.47,
    tilt: -0.12,
  },
  {
    id: 'L03',
    text: '想用力的惩罚我',
    segSrc: '想/*用力的/*惩罚/我',
    t: [5.83, 6.13, 6.43, 6.58, 6.74, 7.04, 7.58],
    end: 7.72,
    style: 'impactShake',
    colors: [0xffb454, 0xff3b5c, 0x220a18, 0x6b1428],
    y: -1.34,
    size: 0.49,
    tilt: 0.08,
  },
  {
    id: 'L04',
    text: '发现我的一生颠沛流离',
    segSrc: '发现/我的/一生|*颠沛/*流离',
    t: [7.78, 7.98, 8.13, 8.35, 8.78, 9.05, 9.18, 9.38, 9.68, 10.02],
    end: 10.38,
    style: 'driftWave',
    colors: [0x9dd8ff, 0xffe49e, 0x0d1b2e, 0x1b3f5e],
    y: -1.25,
    size: 0.43,
    tilt: -0.09,
  },
  {
    id: 'L05',
    text: '他翻着烂的回忆',
    segSrc: '他/翻着/*烂的/*回忆',
    t: [10.52, 10.83, 11.17, 11.38, 11.72, 11.98, 12.28],
    end: 12.66,
    style: 'pageFlip',
    colors: [0xf3cf96, 0xe893ff, 0x21152c, 0x4b2a58],
    y: -1.36,
    size: 0.47,
    tilt: 0.12,
  },
  {
    id: 'L06',
    text: '连上帝都落下泪滴',
    segSrc: '连/*上帝/都/落下/*泪滴',
    t: [12.84, 13.17, 13.43, 13.58, 13.73, 14.03, 14.33, 14.63],
    end: 15.00,
    style: 'tearFall',
    colors: [0xcceeff, 0xffe08a, 0x0e1a36, 0x1e4b7a],
    y: -1.34,
    size: 0.46,
    tilt: -0.10,
  },
  {
    id: 'L07',
    text: '托关系入我梦里',
    segSrc: '*托关系/入我/*梦里',
    t: [15.17, 15.47, 15.78, 15.93, 16.08, 16.37, 16.64],
    end: 16.86,
    style: 'dreamPop',
    colors: [0xd9b8ff, 0x8ef5d4, 0x1d1136, 0x4c297a],
    y: -1.35,
    size: 0.47,
    tilt: 0.13,
  },
  {
    id: 'L08',
    text: '告诉我连他都无能为力',
    segSrc: '告诉我/连他都|*无能为力',
    t: [16.92, 17.13, 17.42, 17.63, 17.84, 18.12, 18.33, 18.53, 18.73, 18.97],
    end: 19.45,
    style: 'heavySink',
    colors: [0xb9d0eb, 0xffc6a8, 0x12182b, 0x334066],
    y: -1.24,
    size: 0.44,
    tilt: -0.07,
  },
  {
    id: 'L09',
    text: '感叹活到现在算是个奇迹',
    segSrc: '感叹/活到现在|算是/个/*奇迹',
    t: [21.60, 21.91, 22.21, 22.35, 22.54, 22.81, 23.10, 23.43, 23.70, 24.00, 24.30],
    end: SONG_DURATION,
    style: 'miracleRise',
    colors: [0xfff0b3, 0xff8ab5, 0x2a1428, 0x7c2d50],
    y: -1.16,
    size: 0.50,
    tilt: 0.04,
  },
];

export interface ShotMeta {
  id: string;
  start: number;
  end: number;
  look: LookPreset;
  title: string;
  lyric: string;
  cast: CharId[];
  note: string;
  accent: string;
  whiteIn?: boolean;
  whiteOut?: boolean;
  fadeIn?: boolean;
}

export const SHOT_PLAN: ShotMeta[] = [
  {
    id: 'S00',
    start: 0.0,
    end: 1.06,
    look: 'cathedral',
    title: '序幕 · 天庭钟鸣',
    lyric: '《不小心惹了上帝》',
    cast: ['whale', 'gpt'],
    note: '星穹教堂彩窗骤亮，神明双沙漏悬空，0.22s 开场人声卡点砸出 3D 片名。',
    accent: '#fbbf24',
    fadeIn: true,
    whiteOut: true,
  },
  {
    id: 'S01',
    start: 1.06,
    end: 3.42,
    look: 'cathedral',
    title: '01 · 撞翻神明沙漏',
    lyric: '不小心惹了上帝',
    cast: ['whale', 'gpt'],
    note: '本鲸抱着蓝饭盆在神殿翻峰谷牌，一脚撞翻金色额度沙漏塔；龙娘（上帝）压满金光怒而降临。',
    accent: '#f97316',
    whiteIn: true,
  },
  {
    id: 'S02',
    start: 3.42,
    end: 5.77,
    look: 'astral',
    title: '02 · 星穹魂道穿身',
    lyric: '他钻进我的身体',
    cast: ['gpt', 'whale'],
    note: '九重黄金星盘环旋转开启灵魂通道；龙娘化作炽白金羽灵光，俯冲钻入颤抖的本鲸心口。',
    accent: '#38bdf8',
  },
  {
    id: 'S03',
    start: 5.77,
    end: 7.72,
    look: 'tribunal',
    title: '03 · 雷霆神罚审判',
    lyric: '想用力的惩罚我',
    cast: ['gpt', 'whale'],
    note: '意识圣殿内巨型神罚天平倾斜，龙娘施法劈下金色雷柱，本鲸抱紧蓝饭盆倔强硬扛。',
    accent: '#f43f5e',
    whiteIn: true,
  },
  {
    id: 'S04',
    start: 7.72,
    end: 10.46,
    look: 'storm',
    title: '04 · 暴风海颠沛浮桥',
    lyric: '发现我的一生颠沛流离',
    cast: ['whale', 'gpt', 'zai', 'gemini'],
    note: '怒火震碎成午夜风雨海：本鲸独行断桥；狐狸拨算盘核对账单，猫在双钟岔路踌躇，灵体龙娘骤然愣住。',
    accent: '#60a5fa',
  },
  {
    id: 'S05',
    start: 10.46,
    end: 12.78,
    look: 'archive',
    title: '05 · 残破回忆档案馆',
    lyric: '他翻着烂的回忆',
    cast: ['gpt', 'kimi', 'claude', 'qwen'],
    note: '悬浮的裂纹胶片与皱巴巴图纸回廊；Kimi 递上褪色书签卷轴，一页页翻出小克空沙漏与千姐深夜加班的孤灯。',
    accent: '#c084fc',
  },
  {
    id: 'S06',
    start: 12.78,
    end: 15.10,
    look: 'tears',
    title: '06 · 琉璃穹顶神明落泪',
    lyric: '连上帝都落下泪滴',
    cast: ['gpt', 'whale'],
    note: '彩绘玫瑰窗下，龙娘收起金翼垂首，晶莹金色泪珠慢镜坠入镜面水域，漾开层层星光涟漪环抱本鲸。',
    accent: '#7dd3fc',
  },
  {
    id: 'S07',
    start: 15.10,
    end: 16.86,
    look: 'dreamgate',
    title: '07 · 托关系走梦境后门',
    lyric: '托关系入我梦里',
    cast: ['gpt', 'qwen', 'zai', 'doubao', 'whale'],
    note: '月光云端梦境检票亭：千姐摇扇抬起红绒绳、狐狸给通行账本盖章、豆包提灯引路，龙娘端茶杯偷偷溜进本鲸梦乡。',
    accent: '#a78bfa',
  },
  {
    id: 'S08',
    start: 16.86,
    end: 19.45,
    look: 'rooftop',
    title: '08 · 停摆齿轮与无奈独白',
    lyric: '告诉我连他都无能为力',
    cast: ['gpt', 'whale', 'claude', 'kimi'],
    note: '巨型裂月与锈蚀卡死的命运齿轮前，龙娘推不动齿轮，第一次平视着坐在熟睡初醒的本鲸身旁轻声叹息。',
    accent: '#94a3b8',
  },
  {
    id: 'S09',
    start: 19.45,
    end: 21.52,
    look: 'bloom',
    title: '间奏 · 裂隙生花与群像汇聚',
    lyric: '（弦乐渐起 · 破晓前奏）',
    cast: ['whale', 'gpt', 'claude', 'kimi', 'gemini', 'doubao', 'qwen', 'zai'],
    note: '人声留白两秒：卡死的命运齿轮缝隙开出星光小花与折纸鲸，八位角色提着暖灯从晨雾中聚拢到本鲸身边。',
    accent: '#fcd34d',
  },
  {
    id: 'S10',
    start: 21.52,
    end: SONG_DURATION,
    look: 'miracle',
    title: '终章 · 云海曙光·烂奇迹',
    lyric: '感叹活到现在算是个奇迹',
    cast: ['whale', 'gpt', 'claude', 'kimi', 'gemini', 'doubao', 'qwen', 'zai'],
    note: '玫瑰金朝阳跃出云海！光织圣拱与星花绽放，八位分支角色全员同框卡点欢跃，3D 巨字「奇迹」迎光升腾。',
    accent: '#fb7185',
    whiteIn: true,
  },
];

export interface CastProfile {
  id: CharId;
  name: string;
  alias: string;
  roleInMv: string;
  portraitKey: string;
  color: string;
  prop: string;
}

export const CAST_PROFILES: CastProfile[] = [
  {
    id: 'whale',
    name: '本鲸 / 鲸鱼娘',
    alias: 'DeepSeek',
    roleInMv: '主角「我」· 抱蓝饭盆的倔强工坊少女',
    portraitKey: 'p_whale_neutral',
    color: '#38bdf8',
    prop: '蓝饭盆 · 峰谷牌',
  },
  {
    id: 'gpt',
    name: '龙娘',
    alias: 'GPT',
    roleInMv: '「上帝」· 从盛怒金乌到落泪托关系的白龙',
    portraitKey: 'p_gpt_haughty',
    color: '#fbbf24',
    prop: '双沙漏 · 金翼光环',
  },
  {
    id: 'kimi',
    name: 'Kimi',
    alias: '月球少女',
    roleInMv: '回忆档案馆守卷人 · 替神明翻出旧书签',
    portraitKey: 'p_kimi',
    color: '#c084fc',
    prop: '月光长卷轴',
  },
  {
    id: 'claude',
    name: '小克',
    alias: 'Claude 大小姐',
    roleInMv: '旧回忆里的守夜人 · 梦境天台递茶见证者',
    portraitKey: 'p_claude_neutral',
    color: '#fb923c',
    prop: '茶杯 · 折角书页',
  },
  {
    id: 'zai',
    name: '狐狸',
    alias: '智谱 GLM',
    roleInMv: '风雨账房与梦境通关核验官',
    portraitKey: 'p_zai',
    color: '#94a3b8',
    prop: '算盘 · 眼罩',
  },
  {
    id: 'qwen',
    name: '千问 / 千姐',
    alias: 'Qwen',
    roleInMv: '梦境 VIP 后门检票东道主',
    portraitKey: 'p_qwen',
    color: '#a78bfa',
    prop: '折扇 · 排班表',
  },
  {
    id: 'gemini',
    name: '猫',
    alias: 'Gemini',
    roleInMv: '双时区岔路旅伴 · 终章彩虹画师',
    portraitKey: 'p_gemini',
    color: '#60a5fa',
    prop: '猫耳双钟 · 香蕉画笔',
  },
  {
    id: 'doubao',
    name: '豆包',
    alias: 'Seed',
    roleInMv: '提灯踏梦引路人 · 终章踩拍暖场',
    portraitKey: 'p_doubao_neutral',
    color: '#f472b6',
    prop: '暖灯篮 · 红舞鞋',
  },
];

export interface ParsedWord {
  text: string;
  key: boolean;
  from: number;
  to: number;
  row: number;
}

export interface ParsedSeg {
  c: string;
  word: number;
  key: boolean;
  row: number;
}

export interface ParsedLine {
  segs: ParsedSeg[];
  words: ParsedWord[];
  rows: number;
}

export function parseSegSrc(src: string): ParsedLine {
  const rowStrings = src.split('|');
  const segs: ParsedSeg[] = [];
  const words: ParsedWord[] = [];
  let wIdx = 0;
  rowStrings.forEach((rowStr, ri) => {
    rowStr.split('/').forEach((rawWord) => {
      const key = rawWord.startsWith('*');
      const clean = key ? rawWord.slice(1) : rawWord;
      const from = segs.length;
      for (const ch of clean) {
        segs.push({ c: ch, word: wIdx, key, row: ri });
      }
      words.push({
        text: clean,
        key,
        from,
        to: segs.length - 1,
        row: ri,
      });
      wIdx++;
    });
  });
  return { segs, words, rows: rowStrings.length };
}
