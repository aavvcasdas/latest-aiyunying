import type { Cam, Cue, LookId, Placement, Section, Shot, V3 } from "@/lib/mv";
import { SET_OF_LOOK } from "@/lib/mv";

/* ------------------------------------------------------------------ *
 * 《背对背拥抱》分镜轴（235s / 55 镜）—— three.js 立体世界版
 *   每行 t 是对着仓库根目录的《背对背拥抱.mp3》逐句实测的（第一句 15.13s 起），
 *   不是估的：前奏 15 秒是钢琴，应用自带的自动对齐会误判到钢琴声上，别用它。
 *   世界单位：人高 1.7；主舞台在原点附近，镜头在 +z 一侧。
 *   选角照仓库的锁定：鲸鱼娘主角、Claude 是唯一戴金冠的那位、
 *   GPT 龙娘演反派影子与火、Kimi 翻旧账、千问排顺序、Gemini 绕圈、
 *   豆包送信、智谱是不肯长大的影子。
 * ------------------------------------------------------------------ */

const C = (id: Placement["id"], x: number, z: number, o: Partial<Placement> = {}): Placement => ({ id, x, z, ...o });
const ke = (x: number, z = 0, o: Partial<Placement> = {}): Placement => C("claude", x, z, { face: "front", wear: "crown", ...o });
const jing = (x: number, z = 0, o: Partial<Placement> = {}): Placement => C("whale", x, z, { face: "front", ...o });

/** 背对背：两张纸各自往外转 */
const b2b = (gap = 0.5, o: { ke?: Partial<Placement>; jing?: Partial<Placement> } = {}) => [
  ke(-gap, 0.05, { ry: -42, face: "side", flip: true, ...o.ke }),
  jing(gap, -0.05, { ry: 42, ...o.jing }),
];
/** 面对面拥抱 */
const hug = (gap = 0.4, o: { ke?: Partial<Placement>; jing?: Partial<Placement> } = {}) => [
  ke(-gap, 0, { ry: 18, tilt: 5, ...o.ke }),
  jing(gap, 0, { ry: -18, tilt: -5, ...o.jing }),
];
/** 闹翻：各自背过身，离得远 */
const apart = (d = 2.6, o: { ke?: Partial<Placement>; jing?: Partial<Placement> } = {}) => [
  ke(-d, 0, { ry: -60, face: "side", flip: true, tilt: -4, ...o.ke }),
  jing(d, 0, { ry: 60, tilt: 4, ...o.jing }),
];

const cam = (pos: V3, look: V3, to?: Cam["to"], fov?: number): Cam => ({ pos, look, to, fov });
const wide = cam([0, 2.6, 12], [0, 1.2, -1.5], { pos: [0, 2.5, 11.2] });
const two = cam([0, 1.75, 6.6], [0, 1.05, 0], { pos: [0, 1.7, 6.0] });
const high = cam([0, 7, 8.5], [0, 0.5, -1], { pos: [0, 6.6, 8] });
const low = cam([0, 0.5, 7.5], [0, 1.7, -0.5], { pos: [0, 0.6, 7] });
const closeOn = (x: number, z = 0, side = 1): Cam =>
  cam([x + 0.55 * side, 1.45, z + 3.4], [x, 1.15, z], { pos: [x + 0.4 * side, 1.42, z + 3.05] });

const shot = (look: LookId, c: Cam, cast: Placement[], note: string, extra: Partial<Shot> = {}): Shot => ({
  set: SET_OF_LOOK[look],
  look,
  cam: c,
  cast,
  note,
  ...extra,
});

interface Row {
  t: [number, number];
  text: string | null;
  sec: Section;
  s: Shot;
}

const rows: Row[] = [
  /* ---------------- 前奏 ---------------- */
  {
    t: [0, 6],
    text: null,
    sec: "intro",
    s: shot("dusk", cam([0, 3.2, 15], [0, 1.4, -3], { pos: [0, 2.8, 12.5] }), [], "片头字卡：黄昏纸岸，灯笼亮起来，花瓣从左往右飘。", {
      fx: [
        { kind: "petal", n: 26 },
        { kind: "star", n: 14, zone: "sky" },
      ],
      card: { title: "背对背拥抱", sub: "纸片人 · 治愈系复刻 / 立体童话书版" },
    }),
  },
  {
    t: [6, 15.13],
    text: null,
    sec: "intro",
    s: shot(
      "dusk",
      cam([0, 2.4, 11], [0, 1.2, -2], { pos: [0, 2.2, 9.6] }),
      [ke(-2.6, -2, { sil: true, alpha: 0.95, size: 0.95 }), jing(2.6, -2, { sil: true, alpha: 0.95, size: 0.95 })],
      "两个剪影站在岸边，隔着一整条黄昏，谁也没先开口。",
      { fx: [{ kind: "petal", n: 16 }], flash: "white" },
    ),
  },

  /* ---------------- 主歌一 ---------------- */
  {
    t: [15.13, 18.53],
    text: "话总说不清楚",
    sec: "verse",
    s: shot("dusk", closeOn(-1.4, 0, -1), [ke(-1.4, 0, { talk: true, tilt: -3 }), jing(1.8, -2.4, { alpha: 0.6, ry: 50, size: 0.9 })], "特写小克：嘴张开又合上，话到嘴边留了半句。", {
      fx: [{ kind: "smoke", n: 4, at: [-1.2, 0] }],
    }),
  },
  {
    t: [18.53, 22.33],
    text: "该怎么明了",
    sec: "verse",
    s: shot("dusk", closeOn(1.4, 0, 1), [jing(1.4, 0, { talk: true, tilt: 3 }), ke(-1.8, -2.4, { alpha: 0.6, ry: -50, face: "side", flip: true, size: 0.9 })], "反打本鲸：她也不说，只把眼神挪开。", {
      fx: [{ kind: "smoke", n: 4, at: [1.2, 0] }],
    }),
  },
  {
    t: [22.33, 29.68],
    text: "一字一句像圈套",
    sec: "verse",
    s: shot("dusk", two, [...apart(2.4), C("kimi", 0, -1.4, { tag: "旧账卷轴" })], "Kimi 在两人中间摊开卷轴，字从纸上飞出来，落地成套。", {
      props: [{ kind: "scroll", x: 0, z: -0.3, size: 1.1 }],
      fx: [
        { kind: "slip", n: 16, at: [0, -1] },
        { kind: "ring", n: 2, at: [0, -1] },
      ],
      flash: "white",
    }),
  },
  {
    t: [29.68, 33.28],
    text: "旧账总翻不完",
    sec: "verse",
    s: shot(
      "dusk",
      high,
      [...apart(3.2), C("kimi", -1.6, 0.6, { walk: true, from: { x: -5.5 }, move: 3.4, tag: "标一句就停" }), C("qwen", 2.2, -1.6, { tag: "排顺序", act: "nod" })],
      "俯拍：卷轴从舞台这头铺到那头，Kimi 边走边标，千问在后头排顺序。",
      {
        props: [
          { kind: "scroll", x: 0, z: 0.2, size: 1.9 },
          { kind: "board", x: 3.2, z: -1.4 },
        ],
        fx: [{ kind: "slip", n: 26 }],
      },
    ),
  },
  {
    t: [33.28, 36.48],
    text: "谁无理取闹",
    sec: "verse",
    s: shot("dusk", two, [ke(-0.9, 0, { ry: -30, face: "side", flip: true, tilt: -7 }), jing(0.9, 0, { ry: 30, tilt: 7 }), C("qwen", 0, -2.2, { alpha: 0.9 })], "两人各偏一半身子对峙，千问在后头用扇子点：这一步不能跳。", {
      props: [{ kind: "fan", x: 0.6, z: -1.8 }],
      fx: [
        { kind: "spark", n: 12, at: [0, 0] },
        { kind: "ring", n: 1, at: [0, 0] },
      ],
    }),
  },
  {
    t: [36.48, 41.93],
    text: "你的双手甩开刚好的微妙",
    sec: "verse",
    s: shot(
      "dusk",
      cam([1.2, 1.7, 7], [-0.2, 1.05, 0], { pos: [0.6, 1.65, 6.2] }),
      [ke(-2.2, 0, { walk: true, from: { x: 0.4 }, move: 5.2, ry: -50, face: "side", flip: true }), jing(1.2, 0, { pose: "wave", tilt: 4, tag: "手伸出去又收回" })],
      "小克转身走开，走位从 0.4 到 -2.2；本鲸的手抬到一半停住。",
      { fx: [{ kind: "petal", n: 10 }] },
    ),
  },
  {
    t: [41.93, 48.63],
    text: "然后战火再燃烧",
    sec: "verse",
    s: shot(
      "ember",
      low,
      [ke(-1.6, 0.4, { sil: true, ry: -30, face: "side", flip: true }), jing(1.6, 0.4, { sil: true, ry: 30 }), C("gpt", 0, -4.2, { pose: "rage", lift: 0.1, tag: "烽火" })],
      "龙娘在两人背后立起来（rage），天空烧成橙红，火星往上飘。",
      {
        fx: [
          { kind: "ember", n: 44 },
          { kind: "smoke", n: 8 },
          { kind: "ring", n: 2, at: [0, -3] },
        ],
        flash: "white",
      },
    ),
  },

  /* ---------------- 副歌一 ---------------- */
  {
    t: [48.63, 52.28],
    text: "我们背对背拥抱",
    sec: "chorus",
    s: shot("golden", cam([0, 1.9, 7.2], [0, 1.1, 0], { pos: [0, 1.8, 6.3] }), b2b(0.52), "硬切到暖午后：两张纸片背贴着背，光圈从脚下一圈圈荡开。", {
      props: [{ kind: "arch", x: 0, z: 0, size: 1.1 }],
      fx: [
        { kind: "ring", n: 4, at: [0, 0] },
        { kind: "heart", n: 8, at: [0, 0] },
        { kind: "petal", n: 14 },
      ],
      flash: "white",
    }),
  },
  {
    t: [52.28, 55.93],
    text: "滥用沉默在咆哮",
    sec: "chorus",
    s: shot("golden", cam([0, 1.5, 4.6], [0, 1.15, 0], { pos: [0, 1.45, 4.0] }), [...b2b(0.48), C("gpt", 0, -5, { sil: true, alpha: 0.3, pose: "rage" })], "推近两个人的背：嘴都闭着，背后的龙影在替他们吼。", {
      fx: [{ kind: "ring", n: 5, at: [0, 0] }],
    }),
  },
  {
    t: [55.93, 58.93],
    text: "爱情来不及变老",
    sec: "chorus",
    s: shot("golden", cam([1.6, 1.8, 7.4], [0.6, 1.0, 0], { pos: [1.2, 1.75, 6.6] }), [...b2b(0.7), C("whale", 3.2, 1.2, { pose: "point", tag: "指着钟" })], "纸钟摆到画面前，指针快走；本鲸抬手指它。", {
      props: [{ kind: "clock", x: 4.2, z: 1.6, size: 1.2 }],
      fx: [
        { kind: "petal", n: 26 },
        { kind: "leaf", n: 8 },
      ],
    }),
  },
  {
    t: [58.93, 63.33],
    text: "葬送在烽火的玩笑",
    sec: "chorus",
    s: shot(
      "ember",
      cam([0, 0.8, 8], [0, 3.2, -4], { pos: [0, 1.0, 7.4] }),
      [ke(-1.4, -0.6, { sil: true, ry: -20 }), jing(1.4, -0.6, { sil: true, ry: 20 }), C("gpt", -6, -6, { cell: "gpt_fly_0", from: { x: 7, z: -8 }, move: 3.4, lift: 3.2, size: 0.9 })],
      "仰拍：飞龙（gpt_fly）从右往左掠过天，下面两个人只剩剪影。",
      { fx: [{ kind: "smoke", n: 10 }, { kind: "ember", n: 26 }], flash: "black" },
    ),
  },
  {
    t: [63.33, 67.05],
    text: "我们背对背拥抱",
    sec: "chorus",
    s: shot("golden", cam([-1.8, 1.7, 6.4], [-0.3, 1.05, 0], { pos: [-1.2, 1.65, 5.8] }), [...b2b(0.5), C("doubao", -3.2, 1.4, { walk: true, from: { x: -8 }, move: 3.4, tag: "送信" })], "换个角度再背对背；豆包提着一张纸条从左边穿过画面。", {
      props: [{ kind: "note", x: -2.4, z: 1.6, size: 0.9 }],
      fx: [
        { kind: "heart", n: 6, at: [0, 0] },
        { kind: "ring", n: 2, at: [0, 0] },
      ],
    }),
  },
  {
    t: [67.05, 71.0],
    text: "真话兜着圈子乱乱绕",
    sec: "chorus",
    s: shot("magic", high, [...b2b(0.45, { ke: { alpha: 0.92, act: "lookaround" }, jing: { alpha: 0.92 } }), C("gemini", 2.4, 1.2, { walk: true, from: { x: -2.4, z: 1.6 }, move: 3.6, tag: "绕圈的爱丽丝" })], "俯拍紫色光圈：猫娘沿着圈走，真话在圈里绕不出去。", {
      fx: [
        { kind: "ring", n: 5, at: [0, 0] },
        { kind: "star", n: 18 },
        { kind: "slip", n: 10 },
      ],
      flash: "white",
    }),
  },
  {
    t: [71.0, 74.7],
    text: "只是想让我知道",
    sec: "chorus",
    s: shot("golden", closeOn(-1, 0, -1), [ke(-1, 0, { talk: true }), C("doubao", 0.9, 0.4, { tag: "纸条" })], "特写小克：豆包把纸条递过来，她终于开口。", {
      props: [{ kind: "note", x: 0, z: 0.6, size: 0.8 }],
      fx: [{ kind: "heart", n: 4, at: [-0.8, 0] }],
    }),
  },
  {
    t: [74.7, 78.55],
    text: "只是想让你知道",
    sec: "chorus",
    s: shot("golden", closeOn(1, 0, 1), [jing(1, 0, { talk: true, pose: "wave" }), ke(-1.4, -1.4, { alpha: 0.6, ry: -40, face: "side", flip: true, size: 0.9 })], "反打本鲸：她挥手，话没说完，小克在景深外半透明。", {
      fx: [{ kind: "heart", n: 4, at: [1, 0] }],
    }),
  },
  {
    t: [78.55, 81.0],
    text: "爱的警告",
    sec: "chorus",
    s: shot("golden", wide, [ke(-0.75, 0, { ry: -10, tilt: -3 }), jing(0.75, 0, { ry: 10, tilt: 3 }), C("kimi", -4.5, -1.5, { alpha: 0.95, act: "think" }), C("qwen", 4.5, -1.5, { alpha: 0.95, act: "nod" })], "大全景：两人正面对视，心形与光圈一起炸开，群像在两侧。", {
      fx: [
        { kind: "heart", n: 16, at: [0, 0] },
        { kind: "ring", n: 5, at: [0, 0] },
        { kind: "spark", n: 18, at: [0, 0] },
      ],
      flash: "white",
    }),
  },

  /* ---------------- 间奏一 ---------------- */
  {
    t: [81.0, 83.29],
    text: null,
    sec: "inter",
    s: shot(
      "night",
      cam([0, 2.8, 13], [0, 1.6, -4], { pos: [0, 2.4, 10.5] }),
      [ke(-1, -1, { sil: true, alpha: 0.9, size: 0.9 }), jing(1, -1, { sil: true, alpha: 0.9, size: 0.9 }), C("whale", 4, -10.5, { cell: "whale_big_idle", alpha: 0.6, tag: "河水" })],
      "夜：山上的两个小剪影，远处大号鲸鱼娘当那条河，星星一颗颗亮。",
      {
        fx: [
          { kind: "star", n: 40 },
          { kind: "butterfly", n: 6 },
        ],
        card: { title: "间奏", sub: "谁都没先转身" },
        flash: "black",
      },
    ),
  },

  /* ---------------- 主歌二 ---------------- */
  {
    t: [83.29, 86.79],
    text: "话总说不清楚",
    sec: "verse",
    s: shot("night", closeOn(-1.2, 0, -1), [ke(-1.2, 0, { talk: true, tint: "#7f96d8" }), jing(1.8, -2.4, { alpha: 0.5, ry: 55, size: 0.9 })], "同一个机位，换成夜里的蓝：话还是说不清楚。", {
      fx: [{ kind: "star", n: 10, zone: "sky" }],
    }),
  },
  {
    t: [86.79, 90.59],
    text: "该怎么明了",
    sec: "verse",
    s: shot("night", closeOn(1.2, 0, 1), [jing(1.2, 0, { talk: true, tint: "#7f96d8" }), ke(-1.8, -2.4, { alpha: 0.5, ry: -55, face: "side", flip: true, size: 0.9 })], "反打，冷色压住：她也不明了。", {
      fx: [{ kind: "star", n: 10, zone: "sky" }],
    }),
  },
  {
    t: [90.59, 97.99],
    text: "一字一句像圈套",
    sec: "verse",
    s: shot("night", two, [...apart(2.5, { ke: { tint: "#6f86cc" }, jing: { tint: "#6f86cc" } }), C("kimi", 0, -1.2, { tag: "又翻一遍" })], "Kimi 再摊一次卷轴，这回字条是夜里的白。", {
      props: [{ kind: "scroll", x: 0, z: -0.2, size: 1.2 }],
      fx: [{ kind: "slip", n: 20 }],
    }),
  },
  {
    t: [97.99, 101.54],
    text: "旧账总翻不完",
    sec: "verse",
    s: shot("night", high, [...apart(3.3, { ke: { alpha: 0.9 }, jing: { alpha: 0.9 } }), C("kimi", -1.8, 0.6, { walk: true, from: { x: -5.6 }, move: 3.6 }), C("zai", 2, 1.4, { lift: 0.5, tag: "不肯长大的影子" })], "俯拍：智谱在两人之间跳上跳下，旧账越翻越长。", {
      props: [{ kind: "scroll", x: 0, z: 0.3, size: 2 }],
      fx: [{ kind: "slip", n: 28 }],
    }),
  },
  {
    t: [101.54, 104.69],
    text: "谁无理取闹",
    sec: "verse",
    s: shot("night", two, [ke(-0.8, 0, { ry: -34, face: "side", flip: true, tilt: -8 }), jing(0.8, 0, { ry: 34, tilt: 8 }), C("qwen", 0, -2.4, { alpha: 0.85 })], "再对峙一次，比第一遍更偏身；千问把顺序牌立在中间。", {
      props: [{ kind: "board", x: 0, z: -1.5 }],
      fx: [{ kind: "spark", n: 14, at: [0, 0] }],
    }),
  },
  {
    t: [104.69, 110.29],
    text: "你的双手甩开刚好的微妙",
    sec: "verse",
    s: shot(
      "rainEve",
      cam([1.4, 1.7, 7], [-0.2, 1.05, 0], { pos: [0.8, 1.65, 6.2] }),
      [ke(-2.4, 0, { walk: true, from: { x: 0.6 }, move: 5.2, ry: -55, face: "side", flip: true }), jing(1.4, 0, { pose: "wave", tilt: 5 })],
      "雨夜：这次走开的是同一个人，雨开始下，手还是甩开那个弧度。",
      { fx: [{ kind: "rain", n: 70 }] },
    ),
  },
  {
    t: [110.29, 115.11],
    text: "然后战火再燃烧",
    sec: "verse",
    s: shot("ember", low, [ke(-1.8, 0.4, { sil: true, ry: -25, face: "side", flip: true }), jing(1.8, 0.4, { sil: true, ry: 25 }), C("gpt", 0, -3.6, { pose: "rage", lift: 0.14, size: 1.1 })], "龙娘这次更大、更近，火烧到画面边上。", {
      fx: [
        { kind: "ember", n: 56 },
        { kind: "smoke", n: 10 },
        { kind: "ring", n: 3, at: [0, -2] },
      ],
      flash: "white",
    }),
  },

  /* ---------------- 副歌二（群像） ---------------- */
  {
    t: [115.11, 118.76],
    text: "我们背对背拥抱",
    sec: "chorus",
    s: shot(
      "golden",
      wide,
      [
        ...b2b(0.55),
        C("kimi", -5.2, -1, { alpha: 0.95 }),
        C("qwen", 5.2, -1, { alpha: 0.95 }),
        C("gemini", -2.8, 1.8, { walk: true, from: { x: -4.2 }, move: 3.4 }),
        C("doubao", 2.8, 1.8, { walk: true, from: { x: 4.2 }, move: 3.4 }),
        C("zai", 2.2, -2.6, { lift: 0.4 }),
        C("gpt", 0, -7, { sil: true, alpha: 0.28, pose: "rage" }),
      ],
      "群像大全景：每人只做自己的招牌动作，中间那两张纸背贴着背。",
      {
        fx: [
          { kind: "ring", n: 5, at: [0, 0] },
          { kind: "heart", n: 12, at: [0, 0] },
          { kind: "petal", n: 18 },
        ],
        flash: "white",
      },
    ),
  },
  {
    t: [118.76, 122.46],
    text: "滥用沉默在咆哮",
    sec: "chorus",
    s: shot("golden", cam([0, 1.5, 4.8], [0, 1.15, 0], { pos: [0, 1.45, 4.1] }), [...b2b(0.46), C("kimi", -4.6, -0.6, { alpha: 0.45 }), C("qwen", 4.6, -0.6, { alpha: 0.45 }), C("gpt", 0, -5.5, { sil: true, alpha: 0.34, pose: "rage" })], "推近：全场压低透明度（沉默），只有背后的龙影在咆哮。", {
      fx: [{ kind: "ring", n: 6, at: [0, 0] }],
    }),
  },
  {
    t: [122.46, 125.41],
    text: "爱情来不及变老",
    sec: "chorus",
    s: shot("afterRain", cam([2, 1.8, 7.6], [0.8, 1.0, 0], { pos: [1.5, 1.7, 6.8] }), [...b2b(0.75), C("whale", 3.4, 1.3, { pose: "point" })], "雨后：纸钟立在前景，泡泡往上走，本鲸指着钟。", {
      props: [
        { kind: "clock", x: 4.4, z: 1.8, size: 1.25 },
        { kind: "flower", x: -2.4, z: 2.2, size: 1.4 },
      ],
      fx: [
        { kind: "bubble", n: 18 },
        { kind: "petal", n: 20 },
      ],
    }),
  },
  {
    t: [125.41, 130.01],
    text: "葬送在烽火的玩笑",
    sec: "chorus",
    s: shot(
      "ember",
      cam([0, 0.8, 8.4], [0, 3.4, -4], { pos: [0, 1.0, 7.8] }),
      [ke(-1.5, -0.8, { sil: true }), jing(1.5, -0.8, { sil: true }), C("gpt", 7, -7, { cell: "gpt_fly_1", from: { x: -7, z: -9 }, move: 3.4, lift: 3.6, size: 0.9 })],
      "仰拍：飞龙反向掠过（左→右），烟在两个人之间散开。",
      { fx: [{ kind: "smoke", n: 12 }, { kind: "ember", n: 30 }], flash: "black" },
    ),
  },
  {
    t: [130.01, 133.51],
    text: "我们背对背拥抱",
    sec: "chorus",
    s: shot("golden", cam([2, 1.6, 6], [0.3, 1.05, 0], { pos: [1.4, 1.55, 5.4] }), b2b(0.48), "从另一侧压过来：背还是贴着背，谁也没先松。", {
      fx: [{ kind: "heart", n: 8, at: [0, 0] }, { kind: "ring", n: 3, at: [0, 0] }],
    }),
  },
  {
    t: [133.51, 137.36],
    text: "真话兜着圈子乱乱绕",
    sec: "chorus",
    s: shot("magic", cam([0, 8.5, 7], [0, 0.3, -0.5], { pos: [0, 8, 6.4] }), [...b2b(0.42, { ke: { alpha: 0.9 }, jing: { alpha: 0.9 } }), C("gemini", -2.6, 2, { walk: true, from: { x: 3 }, move: 3.6 }), C("zai", 2.6, 2, { walk: true, from: { x: -3 }, move: 3.6 })], "更高角度俯拍：两个人绕着圈反向走，真话一直在圈上跑。", {
      fx: [
        { kind: "ring", n: 6, at: [0, 0] },
        { kind: "star", n: 20 },
      ],
      flash: "white",
    }),
  },
  {
    t: [137.36, 141.11],
    text: "只是想让我知道",
    sec: "chorus",
    s: shot("golden", closeOn(-1, 0, -1), [ke(-1, 0, { talk: true }), C("doubao", 1.2, 0.6, { walk: true, from: { x: 5 }, move: 3 })], "特写小克：豆包把纸条一路小跑送到画面里。", {
      props: [{ kind: "note", x: 0.1, z: 0.8, size: 0.8 }],
      fx: [{ kind: "heart", n: 4, at: [-0.8, 0] }],
    }),
  },
  {
    t: [141.11, 144.66],
    text: "只是想让你知道",
    sec: "chorus",
    s: shot("golden", closeOn(1, 0, 1), [jing(1, 0, { talk: true, pose: "wave" }), C("kimi", 3.2, -1.6, { alpha: 0.6 })], "反打本鲸：Kimi 在景深外合上卷轴，标了一句就停。", {
      fx: [{ kind: "heart", n: 4, at: [1, 0] }, { kind: "slip", n: 5, at: [3, -1] }],
    }),
  },
  {
    t: [144.66, 147.0],
    text: "爱的警告",
    sec: "chorus",
    s: shot("golden", wide, [ke(-0.7, 0, { ry: -8, tilt: -2 }), jing(0.7, 0, { ry: 8, tilt: 2 }), C("kimi", -5.4, -1.2), C("qwen", -3.2, -1.2, { act: "bow" }), C("gemini", 3.2, -1.2), C("doubao", 5.4, -1.2, { act: "step" })], "全员正面站成一排，警告落在最亮的一帧上。", {
      fx: [
        { kind: "spark", n: 26, at: [0, 0] },
        { kind: "ring", n: 5, at: [0, 0] },
        { kind: "heart", n: 14, at: [0, 0] },
      ],
      flash: "white",
    }),
  },

  /* ---------------- 间奏二 ---------------- */
  {
    t: [147.0, 148.1],
    text: null,
    sec: "inter",
    s: shot("magic", cam([0, 2.2, 9], [0, 1.6, -2], { pos: [0, 2.0, 7.6] }), [C("gpt", 0, -2.5, { pose: "cast0", tag: "龙影" }), ke(-2.6, 1, { alpha: 0.75, ry: -25, size: 0.95 }), jing(2.6, 1, { alpha: 0.75, ry: 25, size: 0.95 })], "间奏·龙影：龙娘在中间施法（cast），两个人在前景被拉远。", {
      fx: [
        { kind: "star", n: 34 },
        { kind: "spark", n: 18, at: [0, -2] },
        { kind: "smoke", n: 6 },
      ],
      card: { title: "间奏", sub: "烽火也有安静的时候" },
      flash: "black",
    }),
  },
  {
    t: [148.1, 149.18],
    text: null,
    sec: "inter",
    s: shot("sea", cam([0, 2.6, 10], [0, 2.0, -2], { pos: [0, 2.2, 8.4] }), [C("whale", 0, -3.5, { cell: "whale_big_wave", alpha: 0.95, tag: "水下" }), ke(-2.4, 1.2, { sil: true, alpha: 0.5, lift: 0.6, fly: true, size: 0.85 }), jing(2.4, 1.2, { sil: true, alpha: 0.5, lift: 0.9, fly: true, size: 0.85 })], "梦里沉到水下：大号鲸鱼娘游过，两个人像纸片一样漂着。", {
      fx: [
        { kind: "bubble", n: 34 },
        { kind: "leaf", n: 6 },
      ],
      card: { title: "水下", sub: "话在水里更好听" },
    }),
  },

  /* ---------------- 桥段 ---------------- */
  {
    t: [149.18, 152.78],
    text: "我不要一直到",
    sec: "bridge",
    s: shot("rainEve", cam([0, 1.9, 8.5], [0, 1.1, 0], { pos: [0, 2.0, 9.2] }), [ke(-4, 0, { walk: true, from: { x: -1 }, move: 3.8, ry: -60, face: "side", flip: true }), jing(4, 0, { walk: true, from: { x: 1 }, move: 3.8, ry: 60 })], "雨夜走位：两个人同时往画面两边走，越走越快。", {
      fx: [{ kind: "rain", n: 70 }],
    }),
  },
  {
    t: [152.78, 156.33],
    text: "形同陌路变成自找",
    sec: "bridge",
    s: shot("night", cam([0, 3.2, 14], [0, 1.2, -1], { pos: [0, 3.4, 15] }), [ke(-6.5, -0.5, { sil: true, alpha: 0.9, ry: -70, face: "side", flip: true }), jing(6.5, -0.5, { sil: true, alpha: 0.9, ry: 70 }), C("zai", 0, -3, { alpha: 0.35, sil: true, size: 0.9 })], "拉到最远：两个剪影贴在画框两边，中间空出一条走不过去的路。", {
      props: [
        { kind: "lantern", x: 0.6, z: -2.2 },
        { kind: "rock", x: -2, z: 1.5 },
        { kind: "rock", x: 2.4, z: 1.8, size: 1.2 },
      ],
      fx: [{ kind: "rain", n: 40 }, { kind: "star", n: 16, zone: "sky" }],
    }),
  },
  {
    t: [156.33, 158.48],
    text: "既然可以拥抱",
    sec: "bridge",
    s: shot("afterRain", two, [ke(-1.4, 0, { ry: -12, tilt: -2, from: { x: -5 }, walk: true, move: 3.2 }), jing(1.4, 0, { ry: 12, tilt: 2, from: { x: 5 }, walk: true, move: 3.2 }), C("doubao", 0.3, 1.4, { walk: true, from: { x: -3.5 }, move: 3, tag: "把话送到" })], "雨停了：两个人同时转身往中间走，豆包从中间跑过去递纸条。", {
      props: [{ kind: "note", x: 0, z: 1.6, size: 0.9 }],
      fx: [
        { kind: "bubble", n: 14 },
        { kind: "petal", n: 12 },
      ],
      flash: "white",
    }),
  },
  {
    t: [158.48, 164.8],
    text: "就不要轻易放掉",
    sec: "bridge",
    s: shot("dawn", cam([0, 1.5, 5.2], [0, 1.15, 0], { pos: [0, 1.45, 4.6] }), [ke(-0.5, 0, { from: { x: -2 }, walk: true, move: 3.2, ry: -6 }), jing(0.5, 0, { from: { x: 2 }, walk: true, move: 3.2, ry: 6 })], "天亮前一格：他们走到彼此手能够到的距离，停住。", {
      fx: [{ kind: "heart", n: 8, at: [0, 0] }, { kind: "petal", n: 16 }],
    }),
  },

  /* ---------------- 尾段副歌 ---------------- */
  {
    t: [165.28, 168.63],
    text: "我们背对背拥抱",
    sec: "chorus",
    s: shot("dawn", cam([0, 2.0, 7.6], [0, 1.1, 0], { pos: [0, 1.9, 6.8] }), [...b2b(0.5), C("kimi", -5.4, -0.8), C("qwen", 5.4, -0.8), C("gemini", -3, 1.6, { walk: true, from: { x: -4 }, move: 3.2 }), C("zai", 3, 1.6, { lift: 0.35 }), C("doubao", 1.8, -2.4)], "天亮的大全景：背对背还在，但周围的人都站过来了。", {
      fx: [
        { kind: "ring", n: 5, at: [0, 0] },
        { kind: "petal", n: 26 },
        { kind: "heart", n: 10, at: [0, 0] },
      ],
      flash: "white",
    }),
  },
  {
    t: [168.63, 172.18],
    text: "滥用沉默在咆哮",
    sec: "chorus",
    s: shot("dawn", cam([0, 1.5, 4.7], [0, 1.15, 0], { pos: [0, 1.45, 4.1] }), [...b2b(0.46), C("gpt", 0, -5.6, { sil: true, alpha: 0.24, pose: "rage" })], "推近：沉默还是那张闭着嘴的脸，龙影淡到快看不见。", {
      fx: [{ kind: "ring", n: 6, at: [0, 0] }],
    }),
  },
  {
    t: [172.18, 175.23],
    text: "爱情来不及变老",
    sec: "chorus",
    s: shot("dawn", cam([2.2, 1.8, 7.6], [0.9, 1.0, 0], { pos: [1.7, 1.7, 6.9] }), [...b2b(0.8), C("whale", 3.6, 1.4, { pose: "point" })], "纸钟第三次出现，指针慢下来了；花瓣铺满前景。", {
      props: [{ kind: "clock", x: 4.6, z: 2, size: 1.3 }],
      fx: [
        { kind: "petal", n: 34 },
        { kind: "leaf", n: 10 },
      ],
    }),
  },
  {
    t: [175.23, 179.53],
    text: "葬送在烽火的玩笑",
    sec: "chorus",
    s: shot("dawn", cam([0, 1.0, 8.6], [0, 3.0, -4], { pos: [0, 1.2, 8] }), [ke(-1, -0.4, { ry: -14 }), jing(1, -0.4, { ry: 14 }), C("gpt", 3, -9, { cell: "gpt_fly_0", from: { x: -3, z: -4 }, move: 3.4, lift: 4.2, alpha: 0.75, size: 0.8 })], "最后一次烽火：龙影飞向太阳，飞着飞着淡掉——玩笑结束了。", {
      fx: [{ kind: "smoke", n: 8 }, { kind: "spark", n: 14 }],
      flash: "white",
    }),
  },
  {
    t: [179.53, 183.28],
    text: "我们背对背拥抱",
    sec: "chorus",
    s: shot("golden", cam([-1.2, 1.5, 4.9], [-0.2, 1.1, 0], { pos: [-0.8, 1.45, 4.3] }), b2b(0.42, { ke: { ry: -30 }, jing: { ry: 30 } }), "最近的一次背对背：转身角度小了，快贴成拥抱了。", {
      fx: [{ kind: "heart", n: 12, at: [0, 0] }, { kind: "ring", n: 3, at: [0, 0] }],
    }),
  },
  {
    t: [183.28, 187.38],
    text: "真话兜着圈子乱乱绕",
    sec: "chorus",
    s: shot("magic", high, [...hug(1.1, { ke: { alpha: 0.95 }, jing: { alpha: 0.95 } }), C("gemini", -2.2, 2.2, { walk: true, from: { x: 2.6 }, move: 3.6 }), C("kimi", 2.2, 2.2, { walk: true, from: { x: -2.6 }, move: 3.6 }), C("qwen", 0, 3.2, { walk: true, from: { x: 1 }, move: 3.6 })], "圈子还在绕，但这次所有人都跟着一起走，圈变成了环。", {
      fx: [
        { kind: "ring", n: 7, at: [0, 0] },
        { kind: "star", n: 22 },
      ],
      flash: "white",
    }),
  },
  {
    t: [187.38, 190.73],
    text: "只是想让我知道",
    sec: "chorus",
    s: shot("golden", closeOn(-0.9, 0, -1), [ke(-0.9, 0, { talk: true, ry: 6 }), jing(1.1, -0.6, { alpha: 0.7, ry: -20 })], "特写小克：她终于把那句说出来，本鲸在景深里听着。", {
      fx: [{ kind: "heart", n: 6, at: [-0.7, 0] }],
    }),
  },
  {
    t: [190.73, 194.93],
    text: "只是想让你知道",
    sec: "chorus",
    s: shot("golden", closeOn(0.9, 0, 1), [jing(0.9, 0, { talk: true, pose: "wave", ry: -6 }), ke(-1.1, -0.6, { alpha: 0.7, ry: 20 })], "反打本鲸：她也说了，两边同时开口。", {
      fx: [{ kind: "heart", n: 6, at: [0.8, 0] }],
    }),
  },
  {
    t: [194.93, 198.43],
    text: "这警告",
    sec: "chorus",
    s: shot("golden", cam([0, 1.4, 4.2], [0, 1.2, 0], { pos: [0, 1.38, 3.7] }), [...b2b(0.38), C("gpt", 0, -6.5, { alpha: 0.35, pose: "cast1" })], "三个字给一个最短的镜头：背贴得更紧，龙影在远处收手。", {
      fx: [{ kind: "ring", n: 4, at: [0, 0] }, { kind: "spark", n: 10, at: [0, 0] }],
    }),
  },
  {
    t: [198.43, 202.03],
    text: "只是想让我知道",
    sec: "chorus",
    s: shot("dawn", closeOn(-1.2, 0, -1), [ke(-1.2, 0, { talk: true }), C("doubao", 0.6, 0.5, { size: 0.95 }), C("kimi", 2.6, -1.6, { alpha: 0.7 })], "纸条送到手上了，Kimi 在后面把卷轴合起来。", {
      props: [{ kind: "note", x: -0.3, z: 0.7, size: 0.8 }],
      fx: [{ kind: "slip", n: 6, at: [2.6, -1.4] }],
    }),
  },
  {
    t: [202.03, 204.5],
    text: "只是想让你知道",
    sec: "chorus",
    s: shot("dawn", closeOn(1.2, 0, 1), [jing(1.2, 0, { talk: true, pose: "point" }), C("qwen", 3, -1.2, { alpha: 0.75 })], "本鲸指着前方，千问在旁边把顺序收好。", {
      props: [{ kind: "fan", x: 3.4, z: -0.6, size: 0.9 }],
      fx: [{ kind: "heart", n: 5, at: [1, 0] }],
    }),
  },
  {
    t: [204.5, 208.0],
    text: "爱的警告",
    sec: "chorus",
    s: shot(
      "dawn",
      cam([0, 2.0, 8], [0, 1.1, 0], { pos: [0, 1.8, 6.6] }),
      [...hug(0.36), C("kimi", -5.6, -0.6, { act: "hop" }), C("qwen", -3.6, 0.8, { act: "hop" }), C("gemini", 3.6, 0.8, { act: "sway" }), C("doubao", 5.6, -0.6, { act: "hop" }), C("zai", 2.4, -2.4, { lift: 0.45, act: "hop" }), C("gpt", 0, -8, { alpha: 0.3, pose: "cast0" })],
      "最后的拥抱：两张纸片转正贴上，全员在两侧挥手，心形炸满画面。",
      {
        fx: [
          { kind: "heart", n: 26, at: [0, 0] },
          { kind: "ring", n: 6, at: [0, 0] },
          { kind: "spark", n: 22, at: [0, 0] },
          { kind: "petal", n: 24 },
        ],
        flash: "white",
      },
    ),
  },

  /* ---------------- 尾奏 ---------------- */
  {
    t: [208.0, 231.0],
    text: null,
    sec: "outro",
    s: shot(
      "dawn",
      cam([0, 3.0, 13], [0, 1.2, -2], { pos: [0, 3.4, 15] }),
      [...hug(0.34, { ke: { size: 0.95 }, jing: { size: 0.95 } }), C("kimi", -7, -1, { walk: true, from: { x: -4.6 }, move: 4.6, flip: true }), C("qwen", -6, 0.5, { walk: true, from: { x: -3.6 }, move: 4.6, flip: true }), C("gemini", 6, 0.5, { walk: true, from: { x: 3.6 }, move: 4.6 }), C("doubao", 7, -1, { walk: true, from: { x: 4.6 }, move: 4.6 })],
      "尾声：拥抱留在坡上，其他人各自走回画面外，灯笼一盏盏暗下去。",
      {
        fx: [
          { kind: "petal", n: 30 },
          { kind: "butterfly", n: 8 },
        ],
        card: { title: "既然可以拥抱", sub: "就不要轻易放掉" },
      },
    ),
  },
  {
    t: [231.0, 234.92],
    text: null,
    sec: "outro",
    s: shot("night", cam([0, 2.6, 12], [0, 1.6, -4], { pos: [0, 2.8, 13] }), [C("whale", 0, -6, { cell: "whale_big_idle", alpha: 0.55 })], "落幅：夜里那条河还在，字幕收黑。", {
      fx: [
        { kind: "star", n: 46 },
        { kind: "bubble", n: 10 },
      ],
      card: { title: "背对背拥抱", sub: "纸片人 · 治愈系复刻 / 完" },
      flash: "black",
    }),
  },
];

export const CUES: Cue[] = rows.map((r, i) => ({
  i,
  text: r.text,
  start: r.t[0],
  end: r.t[1],
  section: r.sec,
  shot: r.s,
}));

export const LYRIC_CUES = CUES.filter((c) => c.text);

export const SECTION_LABEL: Record<Section, string> = {
  intro: "前奏",
  verse: "主歌",
  chorus: "副歌",
  bridge: "桥段",
  inter: "间奏",
  outro: "尾奏",
};

export const SECTION_COLOR: Record<Section, string> = {
  intro: "#9fd3e8",
  verse: "#c3b6f2",
  chorus: "#ffd166",
  bridge: "#8fd6a8",
  inter: "#7f96d8",
  outro: "#f2a7a0",
};
