// 逐字卡点：从原视频字幕条（20fps 抽帧，字块出现的右沿/像素数跃变）实测而来，单位秒。
export const DURATION = 60;
export const TITLE_START = 57.1;

export interface Line {
  text: string;
  start: number;
  end: number;
  chars: number[]; // 每个字的出现时刻
  keys: [number, number][]; // 关键词区间 [起字, 止字)（含义重的词，做高亮与加大弹跳）
}

function even(text: string, a: number, b: number): number[] {
  const n = [...text].length;
  return Array.from({ length: n }, (_, i) => +(a + ((b - a) * i) / Math.max(1, n - 1)).toFixed(3));
}

function L(text: string, start: number, end: number, chars: number[] | null, keys: string[]): Line {
  const arr = [...text];
  const c = chars ?? even(text, start, end - 0.6);
  if (c.length !== arr.length) throw new Error('字数与卡点数不一致：' + text);
  const k: [number, number][] = keys.map((w) => {
    const i = text.indexOf(w);
    if (i < 0) throw new Error('关键词不在句中：' + w);
    const s = [...text.slice(0, i)].length;
    return [s, s + [...w].length];
  });
  return { text, start, end, chars: c, keys: k };
}

export const LINES: Line[] = [
  L('我们都是渺小真实存在', 0.0, 3.05, [0.2, 0.4, 0.62, 0.85, 1.12, 1.38, 1.6, 1.85, 2.1, 2.38], ['渺小', '真实存在']),
  L('祈愿小世界里不只有挫败', 3.05, 7.05, [3.1, 3.4, 3.7, 4.05, 4.2, 4.4, 4.95, 5.15, 5.3, 5.45, 5.6], ['祈愿', '挫败']),
  L('直到遇见你我以为就光明起来', 7.05, 10.9, [7.1, 7.35, 7.5, 7.8, 8.0, 8.3, 8.5, 8.7, 8.95, 9.2, 9.35, 9.5, 9.75], ['遇见你', '光明']),
  L('眼睛里看到的都是广袤无垠的大海', 10.9, 15.05, null, ['广袤无垠', '大海']),
  L('有你在的日子不可能被取代', 15.05, 18.95, [15.05, 15.2, 15.45, 15.7, 15.95, 16.2, 16.5, 16.7, 16.95, 17.2, 17.5, 17.7], ['有你在', '取代']),
  L('在最灰暗的日子你陪着我发呆', 18.95, 22.55, [19.0, 19.8, 20.0, 20.3, 20.55, 20.8, 21.0, 21.3, 21.55, 21.7, 21.85, 22.0, 22.15], ['灰暗', '发呆']),
  L('你让我学会如何拨开阴霾', 22.55, 25.9, [22.6, 22.85, 23.05, 23.3, 23.55, 23.85, 24.0, 24.3, 24.45, 24.8, 25.0], ['拨开', '阴霾']),
  L('将快乐全都收集将不开心全都淘汰', 25.9, 29.05, null, ['快乐', '淘汰']),
  L('你对我说的情话', 29.05, 32.25, [29.1, 29.6, 30.0, 30.45, 30.9, 31.1, 31.3], ['情话']),
  L('像转瞬即逝的烟花', 32.25, 36.35, [32.3, 32.8, 33.2, 33.65, 34.1, 34.3, 34.75, 35.0], ['转瞬即逝', '烟花']),
  L('只停在绽放一刹那', 36.35, 39.55, [36.4, 36.6, 37.05, 37.55, 37.9, 38.1, 38.5, 38.9], ['绽放', '一刹那']),
  L('我却已无法自拔', 39.55, 43.9, [39.6, 40.1, 40.45, 40.8, 41.25, 41.8, 42.1], ['无法自拔']),
  L('我们的爱总有时差', 43.9, 47.35, [43.95, 44.1, 44.3, 45.05, 45.4, 45.65, 45.9, 46.5], ['时差']),
  L('也为你骗自己放下', 47.35, 51.0, [47.4, 47.85, 48.25, 48.7, 49.1, 49.3, 49.7, 50.2], ['骗自己', '放下']),
  L('爱炙热的你', 51.0, 54.05, [51.05, 51.6, 51.9, 52.3, 52.8], ['炙热']),
  L('却忘了爱自己', 54.05, 57.1, [54.1, 54.5, 55.0, 55.3, 56.0, 56.65], ['爱自己']),
];

export const TITLE = '把回忆拼好给你';
export const TITLE_CHARS = [57.3, 57.55, 57.8, 58.05, 58.3, 58.55, 58.8];

export function lineAt(t: number): number {
  for (let i = LINES.length - 1; i >= 0; i--) if (t >= LINES[i].start) return i;
  return 0;
}

/** 第 n 句第 k 个字出现后经过的秒数（未出现为负） */
export function since(n: number, k: number, t: number) {
  const ln = LINES[n];
  return t - ln.chars[Math.min(k, ln.chars.length - 1)];
}

/** 当前句的进度（0 在句首，1 在句末） */
export function lineU(n: number, t: number) {
  const ln = LINES[n];
  return Math.min(1, Math.max(0, (t - ln.start) / (ln.end - ln.start)));
}
