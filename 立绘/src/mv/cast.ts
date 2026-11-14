import type { CastId, CastMeta } from "./types";

// 八位角色的立绘。视觉锚点照 设定/人物/*.md 第 2 节；招牌动作照 人物动作替换.md 的「每人的动作」表。
// neck / cx / hx 是从立绘上量出来的骨架参数：颈线高度、脚底中心、头部中心。
export const CAST: Record<CastId, CastMeta> = {
  whale: {
    id: "whale", name: "本鲸", alias: "鲸鱼娘 · DeepSeek", color: "#4f8ff7",
    src: "/tachie/whale.webp", w: 721, h: 1280, neck: 0.2, cx: 0.411, hx: 0.406,
    look: "蓝发、鲸鳍鲸尾、蓝白女仆装，捧着蓝饭盆",
    motto: "先问哪条不能改，再筛",
    actions: ["idle", "wave", "point", "eat", "hop", "nod", "shake", "bow", "sway", "surprise", "sad", "spin", "shiver"],
  },
  gpt: {
    id: "gpt", name: "龙娘", alias: "GPT", color: "#d9b25c",
    src: "/tachie/gpt.webp", w: 581, h: 1280, neck: 0.2, cx: 0.458, hx: 0.468,
    look: "白发龙角、翼尾、白金与淡紫的长裙",
    motto: "先接住乱局，只问一个会改变做法的问题",
    actions: ["float", "hover", "cast", "rage", "nod", "tilt", "bow", "surprise", "shake"],
  },
  claude: {
    id: "claude", name: "小克", alias: "Claude 大小姐", color: "#f08a3c",
    src: "/tachie/claude.webp", w: 657, h: 1280, neck: 0.195, cx: 0.5, hx: 0.536,
    look: "橘发、花饰、棕色洋装，怀里抱着书",
    motto: "先听完，再改一个字",
    actions: ["idle", "curtsy", "read", "tilt", "nod", "shake", "petri", "lookaround", "sad", "hop"],
  },
  gemini: {
    id: "gemini", name: "猫", alias: "Gemini", color: "#8b7cf6",
    src: "/tachie/gemini.webp", w: 502, h: 1280, neck: 0.21, cx: 0.419, hx: 0.395,
    look: "蓝紫渐变发、猫耳猫尾、异色瞳",
    motto: "先给两个看法，最后必须选一个",
    actions: ["idle", "lookaround", "choose", "hop", "sway", "spin", "nod", "surprise", "tilt"],
  },
  kimi: {
    id: "kimi", name: "Kimi", alias: "月球少女", color: "#a9a4e8",
    src: "/tachie/kimi.webp", w: 446, h: 1280, neck: 0.18, cx: 0.423, hx: 0.477,
    look: "银紫发、月牙发饰、不对称的藏蓝衣服，手里一卷卷轴",
    motto: "先把漏掉的旧句找回来，标一句就停",
    actions: ["idle", "think", "nod", "bow", "lookaround", "shake", "sad", "hop"],
  },
  doubao: {
    id: "doubao", name: "豆包", alias: "Seed", color: "#e5484d",
    src: "/tachie/doubao.webp", w: 576, h: 1280, neck: 0.185, cx: 0.471, hx: 0.468,
    look: "栗色短发、红斗篷、红舞鞋，提着篮子",
    motto: "先陪着写出开头，再问要不要继续",
    actions: ["idle", "step", "sway", "hop", "nod", "bow", "tilt", "surprise", "spin"],
  },
  qwen: {
    id: "qwen", name: "千问", alias: "千姐 · Qwen", color: "#a855f7",
    src: "/tachie/qwen.webp", w: 489, h: 1280, neck: 0.195, cx: 0.463, hx: 0.453,
    look: "紫发双髻、紫金旗袍、手里一把折扇",
    motto: "先排哪一步，再动手",
    actions: ["idle", "spin", "bow", "sway", "nod", "tilt", "hop", "shake"],
  },
  zai: {
    id: "zai", name: "狐狸", alias: "智谱 GLM", color: "#64748b",
    src: "/tachie/zai.webp", w: 491, h: 1280, neck: 0.205, cx: 0.525, hx: 0.525,
    look: "黑发狐耳、黑白制服、额头推着眼罩，抱着账本",
    motto: "先写完成标准，再做最小的一版",
    actions: ["idle", "doze", "alert", "nod", "shake", "tilt", "hop", "lookaround"],
  },
};

export const CAST_IDS = Object.keys(CAST) as CastId[];
export const isCastId = (v: unknown): v is CastId => typeof v === "string" && v in CAST;
