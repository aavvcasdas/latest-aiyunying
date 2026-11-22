// 《浪人琵琶》字字分镜 · 时间轴
// 音源：仓库根 浪人琵琶.WAV（30.14 秒，与参考片 浪人琵琶.mp4 的音轨逐样本一致）。
// 句子起点：对参考片底部字幕条按每秒四帧逐格实测（精度约 0.25 秒），measured = true。
// 词的起点：句内按字数平分「演唱段」（句长的百分之八十八），再按词归并。

export const DURATION = 30.14;
export const FPS = 30;

export interface Word {
  text: string;
  t0: number;
  t1: number;
  /** 这个词在画面里被翻译成什么 */
  idea: string;
}
export interface Line {
  id: number;
  text: string;
  t0: number;
  t1: number;
  words: Word[];
}

const RAW: { t0: number; words: [string, string][] }[] = [
  { t0: 0.25, words: [["我", "浪人鲸鱼娘从墨点里站起来，指着自己"], ["的", "一缕墨线把「我」牵向心事"], ["思念", "念字拆成「今」与「心」，心跳成一串念想泡泡"]] },
  { t0: 2.75, words: [["似", "「似」是比喻：心形泡泡被捏成一滴雨"], ["六月", "黄历一页页翻到六月，石榴花开"], ["里的", "镜头钻进黄历那一页"], ["小雨", "龙娘在云上施法，细雨落下"], ["哗哗", "拟声字砸下来，雨变成倾盆，鲸鱼娘发抖"]] },
  { t0: 8.25, words: [["对你", "一根红线从雨里牵到屋檐下的小克"], ["情有所钟", "「钟」就是一口钟：铜钟撞响，心跳一圈圈荡开"]] },
  { t0: 10.25, words: [["为你", "鲸鱼娘向你深深一拜"], ["两袖", "两只大袖子甩开，占满画面"], ["清风", "袖里只抖出一阵风、几片叶、一枚滚走的铜钱"]] },
  { t0: 15.0, words: [["小生", "戏台亮相，「小生」行当牌落印"], ["的", "锣点一收"], ["花伞", "一把油纸花伞旋开，伞面开满花"], ["还落在", "伞落下，斜靠在你家门边淋雨"], ["你家", "窗里亮灯，小克探头看见那把伞"]] },
  { t0: 18.5, words: [["你", "小克近景，行礼"], ["美眷", "金光与花框慢慢围拢"], ["如花", "牡丹一朵朵在她身边盛开"]] },
  { t0: 20.0, words: [["我", "画面一冷，鲸鱼娘转身上路"], ["浪迹", "每一个脚印都化成一道浪"], ["天涯", "走到天的尽头：一人、一崖、一行雁"]] },
  { t0: 22.75, words: [["为我", "小克端来茶具（茶壶自己浮起，不画假手）"], ["泡杯", "热水注入杯中，蒸汽升起"], ["花茶", "杯里一朵茉莉缓缓舒展"]] },
  { t0: 24.5, words: [["和你", "画面斜劈两半：一边落雨，一边开花"], ["有些", "两块拼图各画一人，试着对上"], ["不搭", "怎么拼都对不上，弹开，裂一道缝"]] },
  { t0: 26.25, words: [["气氛", "一桌两人，灰雾从地面漫上来"], ["开始", "一只乌鸦慢慢飞过"], ["有一点", "头顶一个点、两个点、三个点"], ["尴尬", "冷汗、问号、捧杯假装喝茶，窗外看热闹的也定住了"]] },
];

export const LINES: Line[] = RAW.map((r, i) => {
  const t1 = i + 1 < RAW.length ? RAW[i + 1].t0 : DURATION;
  const text = r.words.map((w) => w[0]).join("");
  const n = text.length;
  const sing = (t1 - r.t0) * 0.88;
  let k = 0;
  const words: Word[] = r.words.map(([w, idea], j) => {
    const a = r.t0 + (sing * k) / n;
    k += w.length;
    const b = j + 1 < r.words.length ? r.t0 + (sing * k) / n : t1;
    return { text: w, t0: a, t1: b, idea };
  });
  return { id: i + 1, text, t0: r.t0, t1, words };
});

export function lineAt(t: number): Line | null {
  for (const l of LINES) if (t >= l.t0 && t < l.t1) return l;
  return null;
}
export function wordAt(t: number): { line: Line; word: Word; wi: number } | null {
  const line = lineAt(t);
  if (!line) return null;
  for (let i = line.words.length - 1; i >= 0; i--) if (t >= line.words[i].t0) return { line, word: line.words[i], wi: i };
  return { line, word: line.words[0], wi: 0 };
}
/** 第 n 句第 w 个词的起点 */
export const W0 = (n: number, w: number) => LINES[n - 1].words[w].t0;
export const L0 = (n: number) => LINES[n - 1].t0;
export const L1 = (n: number) => LINES[n - 1].t1;
