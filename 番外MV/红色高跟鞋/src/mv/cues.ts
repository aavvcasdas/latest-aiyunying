// 逐字卡点。全部是实测值，不是手估：
//  · 纸条小字：对原片 30fps 字幕区逐帧比对，取每个字「开始贴上去」的那一帧。
//  · 立体大字：t = 大字开始砸下来的那一帧，land = 落定的那一帧（原片逐帧目视核对，15fps 密集条带）。
//    用人声频段的起音包络复核过：结尾「红色高跟鞋」五个字的起砸时刻
//    (43.38 / 43.70 / 44.03 / 44.30 / 44.63) 与人声起音峰 (43.43 / 43.73 / 44.05 / 44.35 / 44.68) 逐一对上。
//  · 第一遍「红色高跟鞋」(20.50–21.76)：原片这里没有出字（画面用橱窗里的鞋代替），
//    这五个时刻取自音轨的人声起音峰，src 标为 'audio'。

export type Style =
  | 'tag' // 米白纸条小字
  | 'quilt' // 被子：粉色绗缝
  | 'cozy' // 舒服：灰蓝软垫
  | 'wind' // 风：青白斜体
  | 'mist' // 捉摸不住：淡紫，飘
  | 'perfume' // 香水味：粉
  | 'love' // 爱不释手：正红绗缝
  | 'heel' // 第一遍红色高跟鞋：红面金边
  | 'sign' // 左灯右行 / 最后唯一：深蓝吊牌
  | 'gold' // 冲突 / 疯狂 / 退路 / 追逐：米白面金色厚边
  | 'stamp' // 停止：红印章
  | 'title'; // 结尾片名

export interface Ch {
  c: string;
  s: Style;
  t: number; // 开始出现
  land: number; // 落定
  k?: number; // 放大倍数
  drop?: number; // 这个时刻掉下去（「路」）
  tilt?: number; // 这个时刻歪一下（「退」）
  src?: 'audio';
}

export interface Line {
  id: string;
  text: string;
  chars: Ch[];
  out: number; // 开始退场
  exit: 'fade' | 'tumble';
  center?: boolean;
  y?: number;
}

type Spec = [string, Style, number, number?, Partial<Ch>?];

const ENTER: Record<Style, number> = {
  tag: 0.13, quilt: 0.33, cozy: 0.12, wind: 0.1, mist: 0.1, perfume: 0.12, love: 0.1, heel: 0.12, sign: 0.14, gold: 0.14, stamp: 0.1, title: 0.14,
};

function line(id: string, out: number, exit: Line['exit'], spec: Spec[], extra: Partial<Line> = {}): Line {
  const chars = spec.map(([c, s, t, land, more]) => ({ c, s, t, land: land ?? t + ENTER[s], ...(more || {}) }));
  return { id, text: chars.map((c) => c.c).join(''), chars, out, exit, ...extra };
}

export const LINES: Line[] = [
  line('L1', 8.42, 'fade', [
    ['你', 'tag', 4.25], ['像', 'tag', 4.53], ['窝', 'tag', 4.73], ['在', 'tag', 5.19],
    ['被', 'quilt', 5.37, 5.68], ['子', 'quilt', 6.1, 6.47],
    ['里', 'tag', 6.73], ['的', 'tag', 7.33],
    ['舒', 'cozy', 7.57, 7.69], ['服', 'cozy', 7.87, 7.97],
  ]),
  line('L2', 13.3, 'tumble', [
    ['却', 'tag', 9.08], ['又', 'tag', 9.49], ['像', 'tag', 9.78],
    ['风', 'wind', 10.03, 10.13],
    ['捉', 'mist', 10.5, 10.6], ['摸', 'mist', 11.23, 11.33], ['不', 'mist', 11.7, 11.8], ['住', 'mist', 12.45, 12.55],
  ]),
  line('L3', 18.62, 'tumble', [
    ['像', 'tag', 13.79], ['手', 'tag', 14.09], ['腕', 'tag', 14.41], ['上', 'tag', 14.71],
    ['散', 'tag', 15.03], ['发', 'tag', 15.78], ['的', 'tag', 16.23],
    ['香', 'perfume', 16.8, 16.92], ['水', 'perfume', 17.4, 17.52], ['味', 'perfume', 17.88, 17.98],
  ]),
  line('L4', 22.85, 'fade', [
    ['像', 'tag', 18.85],
    ['爱', 'love', 19.12], ['不', 'love', 19.45], ['释', 'love', 19.6], ['手', 'love', 19.93],
    ['的', 'tag', 20.22],
    ['红', 'heel', 20.5, undefined, { src: 'audio' }], ['色', 'heel', 20.81, undefined, { src: 'audio' }],
    ['高', 'heel', 21.12, undefined, { src: 'audio' }], ['跟', 'heel', 21.42, undefined, { src: 'audio' }],
    ['鞋', 'heel', 21.76, undefined, { src: 'audio' }],
  ]),
  line('L5', 28.42, 'fade', [
    ['我', 'tag', 23.59], ['爱', 'tag', 23.73], ['你', 'tag', 24.06], ['有', 'tag', 24.36], ['种', 'tag', 24.68],
    ['左', 'sign', 24.85, 25.0], ['灯', 'sign', 25.17, 25.27], ['右', 'sign', 26.25, 26.4], ['行', 'sign', 26.57, 26.67],
    ['的', 'tag', 27.12],
    ['冲', 'gold', 27.3, 27.46], ['突', 'gold', 27.92, 28.06],
  ]),
  line('L6', 33.05, 'fade', [
    ['疯', 'gold', 28.7, 28.82, { k: 1.22 }], ['狂', 'gold', 29.17, 29.28, { k: 1.22 }],
    ['却', 'tag', 29.56], ['怕', 'tag', 30.03], ['没', 'tag', 30.33], ['有', 'tag', 30.79],
    ['退', 'gold', 31.47, 31.6, { tilt: 32.45 }], ['路', 'gold', 32.1, 32.2, { drop: 32.45 }],
  ], { y: 132 }),
  line('L7', 38.5, 'fade', [
    ['你', 'tag', 33.69], ['能', 'tag', 34.03], ['否', 'tag', 34.16], ['让', 'tag', 34.46], ['我', 'tag', 34.79],
    ['停', 'stamp', 35.47, 35.57], ['止', 'stamp', 36.07, 36.17],
    ['这', 'tag', 36.63], ['种', 'tag', 37.1],
    ['追', 'gold', 37.25, 37.4], ['逐', 'gold', 37.57, 37.72],
  ]),
  line('L8', 43.22, 'tumble', [
    ['就', 'tag', 39.39], ['当', 'tag', 39.69], ['那', 'tag', 39.83], ['双', 'tag', 39.99],
    ['最', 'sign', 40.03, 40.17], ['后', 'sign', 40.33, 40.47], ['唯', 'sign', 40.67, 40.77], ['一', 'sign', 40.95, 41.08],
    ['的', 'tag', 41.2],
  ]),
  line('L9', 46.8, 'fade', [
    ['红', 'title', 43.38, 43.52], ['色', 'title', 43.7, 43.85], ['高', 'title', 44.03, 44.13],
    ['跟', 'title', 44.3, 44.45], ['鞋', 'title', 44.63, 44.75],
  ], { center: true, y: 300 }),
];

/** 第一遍「红色高跟鞋」五个音节的时刻（橱窗里的鞋跟着闪） */
export const HEEL_HITS = LINES[3].chars.filter((c) => c.s === 'heel').map((c) => c.land);

/** 当前该亮的那一句（给播放器下面的逐字条用） */
export function lineAt(t: number): Line | null {
  let cur: Line | null = null;
  for (const l of LINES) if (t >= l.chars[0].t - 0.4) cur = l;
  if (cur && t > cur.out + 0.5) return null;
  return cur;
}
