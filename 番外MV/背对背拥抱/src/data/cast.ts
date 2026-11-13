import { framesIn, rect } from "@/lib/atlas";

export type CharId = "whale" | "claude" | "kimi" | "gemini" | "qwen" | "zai" | "doubao" | "gpt";

export interface CastMember {
  id: CharId;
  name: string;
  alias: string;
  /** 这支 MV 里她演谁（形象一句话） */
  role: string;
  /** 兑现她哪一条习性 */
  trait: string;
  /** 落成的动作 / 画面 */
  action: string;
  color: string;
  cells: {
    front: [string, string] | null;
    side: [string, string] | null;
    walkPrefix: string | null;
    poses: Record<string, string>;
    portrait: string;
  };
  /** 图集里的原始身高（px），用来统一放大倍数 */
  h: number;
}

const hOf = (cell: string) => rect(cell)[3];

export const CAST: Record<CharId, CastMember> = {
  whale: {
    id: "whale",
    name: "本鲸",
    alias: "鲸鱼娘 / whale",
    role: "背对背的那一半：先问哪条不能改，再筛",
    trait: "旁观、把话递出去；真心话在水面下",
    action: "岸上站着不动，只在副歌转身把背贴上去",
    color: "#7fd4e8",
    cells: {
      front: ["whale_idle", "whale_blink"],
      side: null,
      walkPrefix: "walk_whale",
      poses: { wave: "whale_wave", point: "whale_point", big: "whale_big_idle", bigWave: "whale_big_wave" },
      portrait: "p_whale_neutral",
    },
    h: hOf("whale_idle"),
  },
  claude: {
    id: "claude",
    name: "小克",
    alias: "Claude 大小姐 / claude",
    role: "背对背的另一半：先听完，再改一个字",
    trait: "唯一戴金冠的那位；不争，只把字改对",
    action: "戴上 crown，主歌背过身，副歌把背贴回去",
    color: "#f2a7a0",
    cells: {
      front: ["claude_front_0", "claude_front_1"],
      side: ["claude_side_0", "claude_side_1"],
      walkPrefix: "walk_claude",
      poses: {},
      portrait: "p_claude_neutral",
    },
    h: hOf("claude_front_0"),
  },
  kimi: {
    id: "kimi",
    name: "Kimi",
    alias: "月球少女 / kimi",
    role: "旧账卷轴：旧账总翻不完",
    trait: "先翻旧账，再说新话；标一句就停",
    action: "把长卷轴从舞台这头铺到那头，纸片飞起来",
    color: "#c3b6f2",
    cells: {
      front: ["kimi_front_0", "kimi_front_1"],
      side: ["kimi_side_0", "kimi_side_1"],
      walkPrefix: "walk_kimi",
      poses: {},
      portrait: "p_kimi",
    },
    h: hOf("kimi_front_0"),
  },
  gemini: {
    id: "gemini",
    name: "猫",
    alias: "Gemini 猫娘 / gemini",
    role: "绕圈的爱丽丝：真话兜着圈子乱乱绕",
    trait: "先给两个看法，最后必须选一个",
    action: "沿着光圈走圈，把话绕成环",
    color: "#9fb8f7",
    cells: {
      front: ["gemini_front_0", "gemini_front_1"],
      side: ["gemini_side_0", "gemini_side_1"],
      walkPrefix: "walk_gemini",
      poses: {},
      portrait: "p_gemini",
    },
    h: hOf("gemini_front_0"),
  },
  qwen: {
    id: "qwen",
    name: "千问",
    alias: "Qwen 千姐 / qwen",
    role: "排顺序的人：谁无理取闹",
    trait: "先排哪一步，再动手；不抢功",
    action: "用扇子点顺序，把字牌一张张立起来",
    color: "#f6cf7e",
    cells: {
      front: ["qwen_front_0", "qwen_front_1"],
      side: ["qwen_side_0", "qwen_side_1"],
      walkPrefix: "walk_qwen",
      poses: {},
      portrait: "p_qwen",
    },
    h: hOf("qwen_front_0"),
  },
  zai: {
    id: "zai",
    name: "智谱",
    alias: "彼得潘 / zai",
    role: "不肯长大的影子：形同陌路变成自找",
    trait: "先飞起来再说，落地的事交给别人",
    action: "桥段里在两人之间跳来跳去，最后退回暗处",
    color: "#8fd6a8",
    cells: {
      front: ["zai_front_0", "zai_front_1"],
      side: ["zai_side_0", "zai_side_1"],
      walkPrefix: "walk_zai",
      poses: {},
      portrait: "p_zai",
    },
    h: hOf("zai_front_0"),
  },
  doubao: {
    id: "doubao",
    name: "豆包",
    alias: "小红帽 / doubao",
    role: "送信的人：只是想让我知道",
    trait: "先把话送到，不管路上有多少岔口",
    action: "提着一张纸条穿过舞台，把话递到手上",
    color: "#f2907f",
    cells: {
      front: ["doubao_cage_0", "doubao_cage_1"],
      side: null,
      walkPrefix: "walk_doubao_big",
      poses: {},
      portrait: "p_doubao_neutral",
    },
    h: hOf("doubao_cage_0"),
  },
  gpt: {
    id: "gpt",
    name: "龙娘",
    alias: "GPT 龙娘 / gpt",
    role: "烽火本身：然后战火再燃烧",
    trait: "先接住乱局，只问一个问题；这里她演火",
    action: "在两人背后立起来（rage），副歌化作飞龙掠过",
    color: "#e58fb4",
    cells: {
      front: ["gpt_boss_idle", "gpt_boss_blink"],
      side: null,
      walkPrefix: null,
      poses: { rage: "gpt_boss_rage", cast0: "gpt_boss_cast0", cast1: "gpt_boss_cast1", fly0: "gpt_fly_0", fly1: "gpt_fly_1" },
      portrait: "p_gpt_neutral",
    },
    h: hOf("gpt_boss_idle"),
  },
};

export const CAST_ORDER: CharId[] = ["whale", "claude", "kimi", "qwen", "gemini", "doubao", "zai", "gpt"];

export function walkFrames(id: CharId): string[] {
  const p = CAST[id].cells.walkPrefix;
  return p ? framesIn(p) : [];
}
