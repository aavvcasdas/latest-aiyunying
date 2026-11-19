// 《勾指起誓》时间轴 —— 原样取自仓库 番外MV/勾指起誓_opus5.5/源码/src/mv/timeline.ts
// 全曲 85 BPM（拍长 0.70588 秒，首拍 0.102 秒）。歌词起点吸附到最近的八分音符。
export const PERIOD = 60 / 85;
export const FIRST = 0.102;
export const DURATION = 183.7;
export const bt = (b: number) => FIRST + b * PERIOD;
export const toBeat = (t: number) => (t - FIRST) / PERIOD;

export interface Line {
  text: string;
  b0: number;
  b1: number;
  sweep: number;
}

const RAW: [number, string][] = [
  [30.5, "你是信的开头诗的内容"], [35.5, "童话的结尾"], [38.5, "你是理所当然的奇迹"], [43.5, "你是月色真美"],
  [46.5, "你是圣诞老人送给我"], [51.5, "好孩子的礼物"], [54.5, "你是三千美丽世界里"], [59.5, "我的一瓢水"],
  [62.5, "所以让我再靠近一点点"], [67, "因为你太温暖"], [70.5, "我会再变得坚强一点点"], [75.5, "因为你太柔软"],
  [78.5, "交换无名指金色的契约"], [83.5, "给彼此岁月"], [86.5, "说好从今以后都牵着手"], [91.5, "因为要走很远"],
  [126.5, "你是我万水千山的冒险"], [131.5, "要找的标记点"], [134.5, "你是我分割人生的线"], [139.5, "又将它们相连"],
  [142.5, "你是前世千次的回眸"], [147.5, "虔诚牵的手"], [150.5, "你是其余所有的一切"], [155.5, "你是我的世界"],
  [158.5, "所以请你再闪亮一点点"], [163, "尽管我太平凡"], [166.5, "我会再变得柔软一点点"], [171.5, "因为你太敏感"],
  [174.5, "交换无名指金色的契约"], [179.5, "给彼此岁月"], [182.5, "说好从今以后都牵着手"], [187.5, "不管要走多远"],
  [222, "所以"], [223, "让我再靠近一点点"], [227, "因为你太温暖"], [230.5, "我会再变得坚强一点点"],
  [235.5, "因为你太柔软"], [238.5, "交换无名指金色的契约"], [243.5, "给彼此岁月"], [246.5, "说好从今以后都牵着手"],
  [251.5, "因为要走很远"],
];

export const LINES: Line[] = RAW.map(([b0, text], i) => {
  const nxt = RAW[i + 1]?.[0] ?? 260;
  const n = text.length;
  const b1 = Math.min(nxt, b0 + n * 0.5 + 1.2);
  const sweep = Math.max(0.8, Math.min(n * 0.5, b1 - b0 - 0.7));
  return { text, b0, b1, sweep };
});

export const END_BEAT = toBeat(DURATION);

export function lineAt(b: number): number {
  for (let i = LINES.length - 1; i >= 0; i--) {
    if (b >= LINES[i].b0 - 0.2) return b < LINES[i].b1 ? i : -1;
  }
  return -1;
}

export function fmtTime(t: number): string {
  const s = Math.max(0, Math.floor(t));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
