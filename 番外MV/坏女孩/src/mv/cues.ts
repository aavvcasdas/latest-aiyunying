import { snapHalfBeat } from "./core";

/**
 * 歌词卡点。
 * raw = 一听网 LRC 的句首时间（与这份音频逐句比对过，偏差多在 0.4 s 内）；
 * start = raw 吸附到最近的实测半拍（模板 align 的做法：句首吸附到实拍，最多移动 BEAT/4）。
 * 字幕文字用你给的歌词（"熟悉的侧脸 喂" 的 "喂" 按你的版本去掉）。
 */
export interface Cue {
  i: number;
  raw: number;
  start: number;
  end: number;
  text: string;
  singer: "徐良" | "小凌";
  /** 段落：A = 第一遍主歌副歌，B = 第二遍，C = 桥段，D = 尾段副歌 */
  part: "A" | "B" | "C" | "D";
  /** 在 20 句主歌副歌里的序号（桥段为 20..23） */
  k: number;
  /** 对应你给的 18 行歌词的行号 */
  row: number;
}

const VERSE: [string, number, "徐良" | "小凌"][] = [
  ["那时我放开了的手", 1, "徐良"],
  ["转过身只剩了保重", 1, "徐良"],
  ["你话都没说 却哭了很久很久", 2, "徐良"],
  ["我喜欢坏坏的女友", 3, "徐良"],
  ["我喜欢刺激的感受", 3, "徐良"],
  ["你单纯太过 多余了那些温柔", 4, "徐良"],
  ["你消失在无名大街", 5, "徐良"],
  ["从此就没有再见面", 5, "徐良"],
  ["好长的时间 再没有你的来电", 6, "徐良"],
  ["在后来酒吧的房间", 7, "徐良"],
  ["舞池里跳动着音乐", 7, "徐良"],
  ["熟悉的侧脸", 8, "徐良"],
  ["迷人的笑脸 吸引视线", 8, "徐良"],
  ["慵懒的靠在陌生的肩", 9, "徐良"],
  ["黑色的眼线 你的指间", 9, "徐良"],
  ["有一点轻蔑", 10, "徐良"],
  ["在谁的怀中会有感觉", 10, "小凌"],
  ["被爱的深夜我在想念", 11, "小凌"],
  ["明明是为你才会改变", 11, "小凌"],
  ["却回不到从前", 12, "小凌"],
];
const BRIDGE: [string, number][] = [
  ["然后我安静的发现", 13],
  ["两个人已经没有任何语言", 13],
  ["曾经你纯真的永远", 14],
  ["让我不顾一切开始怀念", 14],
];

const RAW_A = [22.51, 23.94, 25.5, 29.35, 31.34, 33.15, 37.01, 39.0, 41.05, 44.28, 46.46, 48.39, 52.37, 54.48, 58.49, 61.85, 66.39, 69.62, 73.17, 76.9];
const RAW_B = [112.99, 114.42, 116.28, 120.14, 122.13, 123.93, 127.79, 129.72, 131.34, 135.32, 136.93, 138.86, 143.4, 145.27, 148.51, 152.61, 156.9, 160.01, 163.68, 167.66];
const RAW_C = [173.37, 175.74, 179.66, 184.01];
const RAW_D = [187.77, 190.76, 194.49, 197.85, 201.89, 205.69, 209.42, 212.65]; // 尾段从「迷人的笑脸」起（第 12 句）

function build(): Cue[] {
  const list: Omit<Cue, "end" | "i">[] = [];
  RAW_A.forEach((raw, k) => list.push({ raw, start: snapHalfBeat(raw), text: VERSE[k][0], row: VERSE[k][1], singer: VERSE[k][2], part: "A", k }));
  RAW_B.forEach((raw, k) => list.push({ raw, start: snapHalfBeat(raw), text: VERSE[k][0], row: VERSE[k][1], singer: VERSE[k][2], part: "B", k }));
  RAW_C.forEach((raw, j) => list.push({ raw, start: snapHalfBeat(raw), text: BRIDGE[j][0], row: BRIDGE[j][1], singer: "徐良", part: "C", k: 20 + j }));
  RAW_D.forEach((raw, j) => {
    const k = 12 + j;
    list.push({ raw, start: snapHalfBeat(raw), text: VERSE[k][0], row: VERSE[k][1] + 3, singer: VERSE[k][2], part: "D", k });
  });
  return list.map((c, i) => {
    const next = list[i + 1];
    const n = c.text.replace(/\s/g, "").length;
    const sing = 0.36 * n + 1.4;
    const end = Math.min(next ? next.start - 0.12 : c.start + sing, c.start + sing);
    return { ...c, i, end };
  });
}

export const CUES: Cue[] = build();

/** 用户给的 18 行歌词（行号 → 文本），用于对位表展示 */
export const ROWS = [
  "那时我放开了的手，转过身只剩了保重",
  "你话都没说，却哭了很久很久",
  "我喜欢坏坏的女友，我喜欢刺激的感受",
  "你单纯太过，多余了那些温柔",
  "你消失在无名大街，从此就没有再见面",
  "好长的时间，再没有你的来电",
  "在后来酒吧的房间，舞池里跳动着音乐",
  "熟悉的侧脸，迷人的笑脸吸引视线",
  "慵懒的靠在陌生的肩，黑色的眼线",
  "你的指间有一点轻蔑，在谁的怀中会有感觉",
  "被爱的深夜我在想念，明明是为你才会改变",
  "却回不到从前",
  "然后我安静的发现，两个人已经没有任何语言",
  "曾经你纯真的永远，让我不顾一切开始怀念",
  "迷人的笑脸吸引视线，慵懒的靠在陌生的肩",
  "黑色的眼线，你的指间有一点轻蔑",
  "在谁的怀中会有感觉，被爱的深夜我在想念",
  "明明是为你才会改变，却回不到从前",
];

export function cueAt(T: number): Cue | null {
  for (let i = CUES.length - 1; i >= 0; i--) {
    const c = CUES[i];
    if (T >= c.start - 0.25) return T <= c.end + 0.35 ? c : null;
  }
  return null;
}
