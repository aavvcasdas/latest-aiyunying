// 《譬如我》精华版（28.003s）逐字卡点 + 立体字幕排版
// 逐字起音时间：取自分支 番外MV/譬如我/src/mv/generated.ts 前 9 句（人声识别 + 起音吸附的机器对齐结果，未人工逐字校准）。
// 排版：按「词」分块、分行；关键词放大并给专属色；每个字在自己的起音时间砸进来。
export const DUR = 28.003;
export const BEAT = 0.81;
export const BEAT0 = 0.324;

export type Fx = "slam" | "drop" | "rise" | "zoom" | "shake" | "type";

/** 一个词：s 文本；em 强调级别（2 最大，-1 缩小）；dx/dy 词的位移；fall 唱完后往下掉 */
interface WordSpec { s: string; em?: number; hue?: number; dx?: number; dy?: number; fall?: boolean }
interface LineSpec {
  rows: WordSpec[][];
  t: number[];
  end: number;
  ax: number; ay: number; // 字块中心在舞台上的位置（0..1）
  size: number; // 基础字号（1280 宽舞台上的像素）
  hue: number;
  fx: Fx;
  ry: number; rx: number; // 字块的立体朝向（度）
}

export interface LChar { ch: string; t: number; end: number; gi: number }
export interface LWord { chars: LChar[]; em: number; hue: number; dx: number; dy: number; fall: boolean; hitT: number; key: string }
export interface LLine {
  text: string;
  start: number; end: number;
  /** 这一句离场的时刻（= 下一个分镜开始） */
  out: number;
  rows: LWord[][];
  n: number;
  ax: number; ay: number; size: number; hue: number; fx: Fx; ry: number; rx: number;
}

const SPECS: LineSpec[] = [
  { // 可那些没有天赋的人呢 —— 天赋是金色的，属于台上
    rows: [[{ s: "可那些" }, { s: "没有" }], [{ s: "天赋", em: 2, hue: 44 }, { s: "的人呢" }]],
    t: [0.05, 0.241, 0.641, 1.041, 1.251, 1.471, 1.78, 1.981, 2.26, 2.481], end: 2.871,
    ax: 0.66, ay: 0.8, size: 50, hue: 220, fx: "slam", ry: -15, rx: 6,
  },
  { // 譬如我
    rows: [[{ s: "譬如" }, { s: "我", em: 2, hue: 212 }]],
    t: [2.911, 3.521, 3.86], end: 4.301,
    ax: 0.71, ay: 0.38, size: 82, hue: 212, fx: "zoom", ry: -17, rx: 4,
  },
  { // 枕头下发霉的梦 怎么做
    rows: [[{ s: "枕头下" }, { s: "发霉", em: 1, hue: 96 }, { s: "的" }, { s: "梦", em: 2, hue: 262 }], [{ s: "怎么做" }]],
    t: [4.341, 4.62, 4.791, 5.01, 5.2, 5.511, 5.771, 6.441, 6.662, 6.921], end: 7.5,
    ax: 0.7, ay: 0.25, size: 46, hue: 232, fx: "drop", ry: -14, rx: 6,
  },
  { // 热忱与自卑对抗着 —— 两个词各站一边
    rows: [[{ s: "热忱", em: 2, hue: 22, dx: -150 }, { s: "与" }, { s: "自卑", em: 2, hue: 222, dx: 150 }], [{ s: "对抗着", em: 1, hue: 352 }]],
    t: [7.731, 7.883, 8.061, 8.261, 8.48, 8.731, 8.951, 9.351], end: 9.941,
    ax: 0.5, ay: 0.2, size: 50, hue: 0, fx: "shake", ry: 0, rx: 12,
  },
  { // 笑容却已不知下落 —— 「下落」两个字真的往下掉
    rows: [[{ s: "笑容", em: 2, hue: 46 }], [{ s: "却已" }, { s: "不知" }, { s: "下落", em: 1, hue: 262, fall: true }]],
    t: [9.981, 10.391, 10.811, 11.101, 11.381, 11.791, 11.991, 12.32], end: 12.62,
    ax: 0.245, ay: 0.5, size: 48, hue: 232, fx: "drop", ry: 16, rx: 4,
  },
  { // 可如果等不到一场世俗的成功
    rows: [[{ s: "可如果" }, { s: "等不到", em: 1, hue: 205 }], [{ s: "一场" }, { s: "世俗", em: 1, hue: 40 }, { s: "的" }, { s: "成功", em: 2, hue: 46 }]],
    t: [12.971, 13.251, 13.55, 13.811, 14.351, 14.501, 14.745, 15.031, 15.231, 15.521, 15.841, 16.471, 16.861], end: 17.22,
    ax: 0.71, ay: 0.25, size: 43, hue: 225, fx: "rise", ry: -14, rx: 6,
  },
  { // 成不了万众瞩目那一个
    rows: [[{ s: "成不了" }, { s: "万众瞩目", em: 2, hue: 48 }], [{ s: "那一个", em: 1, hue: 212 }]],
    t: [17.461, 17.571, 17.691, 17.871, 18.231, 18.481, 18.761, 19.291, 19.781, 20.011], end: 20.361,
    ax: 0.5, ay: 0.615, size: 46, hue: 225, fx: "slam", ry: 0, rx: -10,
  },
  { // 我能不能在某个角落
    rows: [[{ s: "我" }, { s: "能不能" }], [{ s: "在" }, { s: "某个" }, { s: "角落", em: 2, hue: 212 }]],
    t: [20.401, 20.841, 21.011, 21.111, 21.321, 21.761, 22.011, 22.331, 22.731], end: 23.14,
    ax: 0.7, ay: 0.36, size: 50, hue: 222, fx: "type", ry: -15, rx: 5,
  },
  { // 耗尽天真 开出小小的花朵 —— 「小小的」真的写小
    rows: [[{ s: "耗尽", em: 1, hue: 200 }, { s: "天真", em: 1, hue: 186 }], [{ s: "开出" }, { s: "小小的", em: -1, hue: 150 }, { s: "花朵", em: 2, hue: 332 }]],
    t: [23.48, 23.711, 23.841, 24.121, 24.361, 24.791, 25.171, 25.801, 26.26, 26.501, 26.851], end: 27.18,
    ax: 0.7, ay: 0.31, size: 50, hue: 200, fx: "rise", ry: -15, rx: 5,
  },
];

/** 分镜开始时刻：每句第一个字前 60ms 切镜 */
export const SCENE_STARTS: number[] = SPECS.map((s, i) => (i === 0 ? 0 : s.t[0] - 0.06));

export const LINES: LLine[] = SPECS.map((sp, li) => {
  let gi = 0;
  const rows: LWord[][] = sp.rows.map((row, ri) =>
    row.map((w, wi) => {
      const chars: LChar[] = [...w.s].map((ch) => {
        const c: LChar = { ch, t: sp.t[gi], end: gi + 1 < sp.t.length ? sp.t[gi + 1] : sp.end, gi };
        gi++;
        return c;
      });
      return {
        chars,
        em: w.em ?? 0,
        hue: w.hue ?? sp.hue,
        dx: w.dx ?? 0,
        dy: w.dy ?? 0,
        fall: w.fall ?? false,
        hitT: chars[chars.length - 1].t, // 词的最后一个字唱出来的那一下 = 这个词的卡点
        key: `${li}-${ri}-${wi}`,
      };
    }),
  );
  if (gi !== sp.t.length) throw new Error(`歌词与时间数量对不上：第 ${li + 1} 句 ${gi} vs ${sp.t.length}`);
  return {
    text: sp.rows.flat().map((w) => w.s).join(""),
    start: sp.t[0],
    end: sp.end,
    out: li + 1 < SPECS.length ? SCENE_STARTS[li + 1] : sp.end + 0.5,
    rows,
    n: gi,
    ax: sp.ax, ay: sp.ay, size: sp.size, hue: sp.hue, fx: sp.fx, ry: sp.ry, rx: sp.rx,
  };
});

/** 进度条上的逐字刻度 */
export const TICKS: { t: number; hue: number }[] = LINES.flatMap((l) =>
  l.rows.flat().flatMap((w) => w.chars.map((c) => ({ t: c.t, hue: w.hue }))),
);

/** 每拍一下、指数回落的脉冲 0..1 */
export function beatPulse(t: number): number {
  let x = ((t - BEAT0) / BEAT) % 1;
  if (x < 0) x += 1;
  return Math.exp(-x * 4);
}

export function beatPhase(t: number): number {
  let x = ((t - BEAT0) / BEAT) % 1;
  if (x < 0) x += 1;
  return x;
}
