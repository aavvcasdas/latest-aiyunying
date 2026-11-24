import anchorsJson from "../../../../通用模板/engine/assets/tachie_anchors.json";
import type { CastId, CastMeta } from "./types";

// 八位角色的立绘。视觉锚点照 设定/人物/*.md 第 2 节；招牌动作照 人物动作替换.md 的「每人的动作」表。
// neck / cx / hx 与 dimensions 只读 assets/tachie_anchors.json —— 网页播放台、模板引擎和 QA 用同一份参数。
// public/tachie 放的是 art/tachie 原图的逐字节副本，不重新抠图、不新增生图。
type AnchorJson = {
  anchors: Record<CastId, { name: string; w: number; h: number; neck: number; cx: number; hx: number }>;
};
const A = (anchorsJson as AnchorJson).anchors;

const src = (id: CastId) => `/tachie/${id}.png`;

export const CAST: Record<CastId, CastMeta> = {
  whale: {
    id: "whale", name: "本鲸", alias: "鲸鱼娘 · DeepSeek", color: "#4f8ff7",
    src: src("whale"), w: A.whale.w, h: A.whale.h, neck: A.whale.neck, cx: A.whale.cx, hx: A.whale.hx,
    look: "蓝发、鲸鳍鲸尾、蓝白女仆装，捧着蓝饭盆",
    motto: "先问哪条不能改，再筛",
    actions: ["idle", "wave", "point", "eat", "hop", "nod", "shake", "bow", "sway", "surprise", "sad", "spin", "shiver"],
  },
  gpt: {
    id: "gpt", name: "龙娘", alias: "GPT", color: "#d9b25c",
    src: src("gpt"), w: A.gpt.w, h: A.gpt.h, neck: A.gpt.neck, cx: A.gpt.cx, hx: A.gpt.hx,
    look: "白发龙角、翼尾、白金与淡紫的长裙",
    motto: "先接住乱局，只问一个会改变做法的问题",
    actions: ["float", "hover", "cast", "rage", "nod", "tilt", "bow", "surprise", "shake"],
  },
  claude: {
    id: "claude", name: "小克", alias: "Claude 大小姐", color: "#f08a3c",
    src: src("claude"), w: A.claude.w, h: A.claude.h, neck: A.claude.neck, cx: A.claude.cx, hx: A.claude.hx,
    look: "橘发、花饰、棕色洋装，怀里抱着书",
    motto: "先听完，再改一个字",
    actions: ["idle", "curtsy", "read", "tilt", "nod", "shake", "petri", "lookaround", "sad", "hop"],
  },
  gemini: {
    id: "gemini", name: "猫", alias: "Gemini", color: "#8b7cf6",
    src: src("gemini"), w: A.gemini.w, h: A.gemini.h, neck: A.gemini.neck, cx: A.gemini.cx, hx: A.gemini.hx,
    look: "蓝紫渐变发、猫耳猫尾、异色瞳",
    motto: "先给两个看法，最后必须选一个",
    actions: ["idle", "lookaround", "choose", "hop", "sway", "spin", "nod", "surprise", "tilt"],
  },
  kimi: {
    id: "kimi", name: "Kimi", alias: "月球少女", color: "#a9a4e8",
    src: src("kimi"), w: A.kimi.w, h: A.kimi.h, neck: A.kimi.neck, cx: A.kimi.cx, hx: A.kimi.hx,
    look: "银紫发、月牙发饰、不对称的藏蓝衣服，手里一卷卷轴",
    motto: "先把漏掉的旧句找回来，标一句就停",
    actions: ["idle", "think", "nod", "bow", "lookaround", "shake", "sad", "hop"],
  },
  doubao: {
    id: "doubao", name: "豆包", alias: "Seed", color: "#e5484d",
    src: src("doubao"), w: A.doubao.w, h: A.doubao.h, neck: A.doubao.neck, cx: A.doubao.cx, hx: A.doubao.hx,
    look: "栗色短发、红斗篷、红舞鞋，提着篮子",
    motto: "先陪着写出开头，再问要不要继续",
    actions: ["idle", "step", "sway", "hop", "nod", "bow", "tilt", "surprise", "spin"],
  },
  qwen: {
    id: "qwen", name: "千问", alias: "千姐 · Qwen", color: "#a855f7",
    src: src("qwen"), w: A.qwen.w, h: A.qwen.h, neck: A.qwen.neck, cx: A.qwen.cx, hx: A.qwen.hx,
    look: "紫发双髻、紫金旗袍、手里一把折扇",
    motto: "先排哪一步，再动手",
    actions: ["idle", "spin", "bow", "sway", "nod", "tilt", "hop", "shake"],
  },
  zai: {
    id: "zai", name: "狐狸", alias: "智谱 GLM", color: "#64748b",
    src: src("zai"), w: A.zai.w, h: A.zai.h, neck: A.zai.neck, cx: A.zai.cx, hx: A.zai.hx,
    look: "黑发狐耳、黑白制服、额头推着眼罩，抱着账本",
    motto: "先写完成标准，再做最小的一版",
    actions: ["idle", "doze", "alert", "nod", "shake", "tilt", "hop", "lookaround"],
  },
};

export const CAST_IDS = Object.keys(CAST) as CastId[];
export const isCastId = (v: unknown): v is CastId => typeof v === "string" && v in CAST;
