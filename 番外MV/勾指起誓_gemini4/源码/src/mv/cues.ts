import type { BeatGrid } from '../engine/timeline';

export interface LyricLine {
  text: string;
  start: number;
  end: number;
  section: SectionName;
}

export type SectionName = '序章' | '主歌一' | '副歌一' | '间奏一' | '主歌二' | '副歌二' | '桥段间奏' | '终章副歌' | '尾声';

/** 实测《勾指起誓》.mp3（44.1kHz, 183.701s）拍点网格：85.00 BPM，4/4 拍 */
export const MEASURED_BEAT: BeatGrid = {
  period: 60 / 85, // 0.7058823529s
  first: 0.152,
  bar: 4,
};

export const SONG_DURATION = 183.7;

/** 全曲 41 句实测歌词时间轴（保留用户提供的精确歌词用字） */
export const LYRIC_LINES: LyricLine[] = [
  // 主歌一（00:21.85 - 00:44.32）
  { text: '你是信的开头诗的内容', start: 21.85, end: 25.25, section: '主歌一' },
  { text: '童话的结尾', start: 25.38, end: 27.38, section: '主歌一' },
  { text: '你是理所当然的奇迹', start: 27.50, end: 30.82, section: '主歌一' },
  { text: '你是月色真美', start: 30.95, end: 33.00, section: '主歌一' },
  { text: '你是圣诞老人送给我', start: 33.15, end: 36.55, section: '主歌一' },
  { text: '好孩子的礼物', start: 36.68, end: 38.68, section: '主歌一' },
  { text: '你是三千美丽世界里', start: 38.80, end: 42.20, section: '主歌一' },
  { text: '我的一瓢水', start: 42.33, end: 44.32, section: '主歌一' },

  // 副歌一（00:44.44 - 01:07.15）
  { text: '所以让我再靠近一点点', start: 44.44, end: 47.84, section: '副歌一' },
  { text: '因为你太温暖', start: 47.97, end: 49.97, section: '副歌一' },
  { text: '我会再变得坚强一点点', start: 50.09, end: 53.49, section: '副歌一' },
  { text: '因为你太柔软', start: 53.62, end: 55.62, section: '副歌一' },
  { text: '交换无名指金色的契约', start: 55.74, end: 59.14, section: '副歌一' },
  { text: '给彼此岁月', start: 59.27, end: 61.27, section: '副歌一' },
  { text: '说好从今以后都牵着手', start: 61.39, end: 64.79, section: '副歌一' },
  { text: '因为要走很远', start: 64.92, end: 67.15, section: '副歌一' },

  // 主歌二（01:29.62 - 01:52.10）
  { text: '你是我万水千山的冒险', start: 89.62, end: 93.02, section: '主歌二' },
  { text: '要找的标记点', start: 93.15, end: 95.15, section: '主歌二' },
  { text: '你是我分割人生的线', start: 95.27, end: 98.67, section: '主歌二' },
  { text: '又将它们相连', start: 98.80, end: 100.80, section: '主歌二' },
  { text: '你是前世千次的回眸', start: 100.92, end: 104.32, section: '主歌二' },
  { text: '虔诚牵的手', start: 104.45, end: 106.45, section: '主歌二' },
  { text: '你是其余所有的一切', start: 106.56, end: 109.96, section: '主歌二' },
  { text: '你是我的世界', start: 110.09, end: 112.10, section: '主歌二' },

  // 副歌二（01:52.21 - 02:14.92）
  { text: '所以请你再闪亮一点点', start: 112.21, end: 115.61, section: '副歌二' },
  { text: '尽管我太平凡', start: 115.74, end: 117.74, section: '副歌二' },
  { text: '我会再变得柔软一点点', start: 117.86, end: 121.26, section: '副歌二' },
  { text: '因为你太敏感', start: 121.39, end: 123.39, section: '副歌二' },
  { text: '交换无名指金色的契约', start: 123.51, end: 126.91, section: '副歌二' },
  { text: '给彼此岁月', start: 127.03, end: 129.03, section: '副歌二' },
  { text: '说好从今以后都牵着手', start: 129.15, end: 132.55, section: '副歌二' },
  { text: '不管要走多远', start: 132.68, end: 134.92, section: '副歌二' },

  // 终章副歌（02:37.38 - 03:00.18）
  { text: '所以', start: 157.38, end: 158.14, section: '终章副歌' },
  { text: '让我再靠近一点点', start: 158.18, end: 160.86, section: '终章副歌' },
  { text: '因为你太温暖', start: 160.91, end: 162.92, section: '终章副歌' },
  { text: '我会再变得坚强一点点', start: 163.03, end: 166.43, section: '终章副歌' },
  { text: '因为你太柔软', start: 166.56, end: 168.56, section: '终章副歌' },
  { text: '交换无名指金色的契约', start: 168.68, end: 172.08, section: '终章副歌' },
  { text: '给彼此岁月', start: 172.21, end: 174.21, section: '终章副歌' },
  { text: '说好从今以后都牵着手', start: 174.32, end: 177.72, section: '终章副歌' },
  { text: '因为要走很远', start: 177.85, end: 180.18, section: '终章副歌' },
];

export const LYRIC_TEXTS = LYRIC_LINES.map((l) => l.text);
export const LYRIC_STARTS = LYRIC_LINES.map((l) => l.start);
export const LYRIC_ENDS = LYRIC_LINES.map((l) => l.end);
