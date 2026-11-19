// 《勾指起誓》立绘版默认分镜：62 个镜头，起拍与镜头说明沿用原时间轴，画面改成立绘演出。
// 演员写法： 角色:动作@站位[>移动到][<][!表情][*缩放]   其中 < 表示朝左
import type { ActorCue, CastId, Framing, Shot, ShotPatch } from "./types";
import { CAST_IDS, isCastId } from "./cast";
import { ACTIONS } from "./actions";
import { BGS, CAMS, FXS, FRAMINGS } from "./scene";
import { EMOTES } from "./rig";
import { LINES, END_BEAT } from "./timeline";

function parseActors(spec: string): ActorCue[] {
  if (!spec.trim()) return [];
  return spec.split(",").map((raw) => {
    const m = raw.trim().match(/^(\w+):(\w+)@(-?[\d.]+)(?:>(-?[\d.]+))?(<)?(?:!(\w+))?(?:\*([\d.]+))?$/);
    if (!m) throw new Error(`分镜写错了：${raw}`);
    const cue: ActorCue = { who: m[1] as CastId, action: m[2], x: +m[3] };
    if (m[4] !== undefined) cue.x2 = +m[4];
    if (m[5]) cue.flip = true;
    if (m[6]) cue.emote = m[6];
    if (m[7]) cue.scale = +m[7];
    return cue;
  });
}

const everyone = (action: string, scale: number) =>
  CAST_IDS.map((id, i) => `${id}:${action}@${(-0.77 + i * 0.22).toFixed(2)}${i >= 4 ? "<" : ""}*${scale}`).join(",");
const marching = CAST_IDS.map((id, i) => `${id}:walk@${(-0.95 + i * 0.2).toFixed(2)}>${(-0.6 + i * 0.2).toFixed(2)}*0.78`).join(",");

type Row = [number, string, string, string, string, string, Framing, string, string?];
// [起拍, 编号, 分镜说明, 背景, 特效, 运镜, 景别, 演员, 字卡]
const S: Row[] = [
  [0, "I1", "封面：星夜下的《勾指起誓》", "night", "stars", "pushIn", "full", "", "勾指起誓|鲸鱼娘 MV · 立绘版"],
  [8, "I2", "黄昏小路：本鲸捧着饭盆走向邮筒", "dusk", "leaves", "panR", "full", "whale:walk@-0.6>0.1"],
  [16, "I3", "窗边夜色：小克读那封信", "night", "stars", "pushIn", "knee", "claude:read@0.05"],
  [23, "I4", "信纸飞起：诗句变成星光", "night", "sparkles", "pullOut", "full", "claude:surprise@0!sparkle"],
  [30.5, "L01", "信的开头：小克读信，本鲸在旁边探头", "nightwarm", "fireflies", "still", "knee", "whale:lookaround@-0.42*0.92,claude:read@0.22"],
  [35.5, "L02", "童话的结尾：小克歪头笑了", "dream", "sparkles", "pushIn", "bust", "claude:tilt@0!heart"],
  [38.5, "L03", "理所当然的奇迹：星雨落下，两人同时抬头", "night", "meteor", "pullOut", "full", "whale:surprise@-0.2,claude:surprise@0.2<"],
  [43.5, "L04", "月色真美：Kimi 守着月亮，两人并肩", "night", "stars", "panL", "full", "kimi:think@0.52<,whale:sway@-0.32,claude:sway@-0.06"],
  [46.5, "L05", "圣诞老人：豆包提着篮子穿过雪夜", "night", "snow", "panL", "full", "doubao:walk@0.6>-0.1"],
  [51.5, "L06", "好孩子的礼物：小克开心得跳起来", "night", "snow", "pushIn", "knee", "claude:hop@0!sparkle"],
  [54.5, "L07", "三千美丽世界：一路上遇见的人", "day", "petals", "pushIn", "full", "gemini:lookaround@-0.58*0.9,qwen:sway@0.58<*0.9,whale:walk@-0.12>0.06"],
  [59.5, "L08", "一瓢水：本鲸把饭盆递出去", "day", "sparkles", "still", "knee", "claude:nod@0.34<,whale:point@-0.16!heart"],
  [62.5, "L09", "再靠近一点点：本鲸向前挪一步", "dusk", "petals", "pushIn", "knee", "claude:shy@0.26<,whale:lean@-0.34>-0.14"],
  [67, "L10", "你太温暖：灯笼暖光里一起摇", "nightwarm", "fireflies", "still", "knee", "whale:sway@-0.2,claude:sway@0.2<!heart"],
  [70.5, "L11", "坚强一点点：山顶迎风站稳", "dawn", "leaves", "pullOut", "full", "whale:alert@0!shine"],
  [75.5, "L12", "你太柔软：花瓣落在她肩上", "day", "petals", "drift", "bust", "claude:tilt@0!heart"],
  [78.5, "L13", "无名指的契约：两人相对行礼", "gold", "sparkles", "pushIn", "knee", "whale:bow@-0.22,claude:curtsy@0.22<"],
  [83.5, "L14", "给彼此岁月：龙娘在高处看着四季", "dusk", "leaves", "panR", "full", "gpt:float@0.55<,whale:idle@-0.32,claude:read@-0.04"],
  [86.5, "L15", "从今以后牵着手：一起点头", "gold", "hearts", "still", "knee", "whale:nod@-0.17,claude:nod@0.17<!heart"],
  [91.5, "L16", "要走很远：长路通向地平线", "dusk", "none", "pullOut", "full", "whale:walk@-0.3>-0.04*0.86,claude:walk@-0.04>0.22*0.86"],
  [94.5, "N1", "间奏·清晨出发", "dawn", "petals", "panR", "full", "whale:walk@-0.62>-0.1,claude:walk@-0.36>0.16"],
  [98.5, "N2", "间奏·穿过森林：狐狸在树下打盹", "day", "leaves", "panR", "full", "zai:doze@0.48<,whale:walk@-0.55>0"],
  [102.5, "N3", "间奏·纸船渡河", "day", "sparkles", "drift", "full", "whale:sway@-0.15,claude:sway@0.15<"],
  [106.5, "N4", "间奏·岔路口：猫两边想想，选定一条", "day", "none", "still", "knee", "gemini:choose@0"],
  [110.5, "N5", "间奏·雪山脚下", "snow", "snow", "pullOut", "full", "whale:shiver@-0.15,claude:shiver@0.15<"],
  [114.5, "N6", "间奏·夜宿荒原：干饭、看书、打盹", "nightwarm", "fireflies", "still", "full", "zai:doze@0.45<,claude:read@0.06,whale:eat@-0.3"],
  [118.5, "N7", "间奏·登顶", "dawn", "sparkles", "pushIn", "full", "whale:cheer@-0.15!shine,claude:hop@0.18<"],
  [122.5, "N8", "间奏·展开地图：Kimi 找到了路", "day", "none", "still", "knee", "kimi:think@-0.22,whale:lookaround@0.26"],
  [126.5, "M01", "万水千山的冒险：龙娘掠过山海", "day", "leaves", "panL", "full", "gpt:hover@0.5>-0.1,whale:alert@-0.45"],
  [131.5, "M02", "标记点：Kimi 点头，就是这里", "day", "sparkles", "pushIn", "bust", "kimi:nod@0!shine"],
  [134.5, "M03", "分割人生的线：两人站在画面两端", "dusk", "none", "panR", "full", "whale:idle@-0.55,claude:idle@0.55<"],
  [139.5, "M04", "又将它们相连：朝彼此跑过去", "dusk", "sparkles", "pushIn", "full", "whale:run@-0.55>-0.14,claude:run@0.55>0.14"],
  [142.5, "M05", "前世千次的回眸：小克一次次回头", "dream", "petals", "drift", "knee", "claude:lookaround@0.08"],
  [147.5, "M06", "虔诚牵的手：千问在一旁鞠躬", "gold", "petals", "still", "full", "qwen:bow@0.52<,whale:idle@-0.26,claude:idle@-0.02<"],
  [150.5, "M07", "其余所有的一切：八个人站成一排踩拍", "day", "sparkles", "pullOut", "full", everyone("step", 0.8)],
  [155.5, "M08", "我的世界：梦里只有两个人", "dream", "stars", "pushIn", "knee", "whale:sway@-0.18!heart,claude:sway@0.18<"],
  [158.5, "M09", "再闪亮一点点：小克发光，本鲸欢呼", "night", "sparkles", "pushIn", "knee", "whale:cheer@-0.3,claude:cast@0.2<"],
  [163, "M10", "我太平凡：灰色街角里的本鲸", "grey", "rain", "still", "full", "whale:sad@0"],
  [166.5, "M11", "再柔软一点点：额头轻靠，花瓣落下", "dusk", "petals", "pushIn", "knee", "claude:tilt@0.15<,whale:lean@-0.22>-0.13"],
  [171.5, "M12", "你太敏感：小克脸红了", "day", "none", "drift", "bust", "claude:shy@0!sweat"],
  [174.5, "M13", "契约·夜：星光下再行一次礼", "night", "sparkles", "pushIn", "knee", "whale:curtsy@-0.2,claude:curtsy@0.2<"],
  [179.5, "M14", "给彼此岁月：黄昏里靠在一起", "dusk", "leaves", "still", "full", "whale:sway@-0.14,claude:read@0.14<"],
  [182.5, "M15", "牵着手：烟花下并肩走", "night", "fireworks", "panR", "full", "whale:walk@-0.36>-0.06,claude:walk@-0.1>0.2"],
  [187.5, "M16", "不管多远：灯笼铺成的路", "nightwarm", "fireflies", "pullOut", "full", "whale:walk@-0.22>0,claude:walk@0.04>0.26"],
  [190.5, "K1", "间奏·星夜赶路", "night", "meteor", "panR", "full", "whale:run@-0.62>0,claude:run@-0.32>0.3"],
  [194.5, "K2", "间奏·海边：猫在跳，豆包踩拍", "day", "sparkles", "panL", "full", "gemini:hop@-0.3,doubao:step@0.3<"],
  [198.5, "K3", "间奏·雨后彩虹", "dawn", "sparkles", "pullOut", "full", "kimi:nod@-0.42,qwen:sway@0.42<,whale:cheer@0"],
  [202.5, "K4", "间奏·秋天落叶：狐狸惊醒", "dusk", "leaves", "drift", "knee", "claude:read@-0.22,zai:alert@0.26<"],
  [206.5, "K5", "间奏·雪村送礼", "snow", "snow", "panL", "full", "doubao:walk@0.58>0.06,whale:hop@-0.35!heart"],
  [210.5, "K6", "间奏·春日野餐", "day", "petals", "still", "full", "gemini:lookaround@0.34*0.92,doubao:step@0.64<*0.92,claude:read@0.02,whale:eat@-0.32!heart"],
  [214.5, "K7", "间奏·萤火树下", "night", "fireflies", "drift", "knee", "whale:sway@-0.18,claude:sway@0.18<"],
  [218.5, "K8", "间奏·靠在一起的特写", "gold", "hearts", "pushIn", "bust", "whale:tilt@-0.25!none,claude:tilt@0.25<!none"],
  [222, "F01", "所以……", "night", "stars", "still", "bust", "whale:idle@0"],
  [223, "F02", "让我再靠近一点点：两人相向靠近", "dusk", "petals", "pushIn", "knee", "whale:lean@-0.28>-0.13,claude:lean@0.28>0.13<"],
  [227, "F03", "你太温暖：晨光", "dawn", "sparkles", "pullOut", "knee", "whale:sway@-0.18!heart,claude:sway@0.18<"],
  [230.5, "F04", "坚强一点点：并肩欢呼", "dawn", "leaves", "pushIn", "full", "whale:cheer@-0.14,claude:cheer@0.14<"],
  [235.5, "F05", "你太柔软：花海", "day", "petals", "drift", "bust", "claude:tilt@0!heart"],
  [238.5, "F06", "契约成立：盖章", "gold", "sparkles", "shake", "knee", "whale:nod@-0.18!shine,claude:nod@0.18<"],
  [243.5, "F07", "给彼此岁月：昼夜流转", "dream", "stars", "panR", "full", "gpt:float@-0.58,kimi:think@0.58<,whale:sway@-0.13,claude:sway@0.13<"],
  [246.5, "F08", "牵着手：全员同行", "dusk", "petals", "panR", "full", marching],
  [251.5, "F09", "要走很远：地平线上的两个人", "dusk", "none", "pullOut", "full", "whale:walk@-0.12>0*0.72,claude:walk@0.08>0.2*0.72"],
  [255.5, "OUT", "落幕", "night", "stars", "still", "full", "", "说好从今以后都牵着手|— 完 —"],
];

export const DEFAULT_SHOTS: Shot[] = S.map(([b0, id, title, bg, fx, cam, framing, actors, caption], i) => {
  const b1 = S[i + 1]?.[0] ?? END_BEAT;
  const line = LINES.findIndex((l) => l.b0 >= b0 - 0.01 && l.b0 < b1 - 0.01);
  return { id, b0, b1, title, line, bg, fx, cam, framing, actors: parseActors(actors), caption };
});

export const SHOT_IDS = new Set(DEFAULT_SHOTS.map((s) => s.id));

const num = (v: unknown, lo: number, hi: number): number | undefined =>
  typeof v === "number" && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : undefined;

/** 校验一份编排（来自编辑器或数据库），不合规返回 null */
export function sanitizePatch(raw: unknown): ShotPatch | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.bg !== "string" || !(r.bg in BGS)) return null;
  if (typeof r.fx !== "string" || !(r.fx in FXS)) return null;
  if (typeof r.cam !== "string" || !(r.cam in CAMS)) return null;
  if (typeof r.framing !== "string" || !(r.framing in FRAMINGS)) return null;
  if (!Array.isArray(r.actors) || r.actors.length > 8) return null;
  const actors: ActorCue[] = [];
  for (const a of r.actors as Record<string, unknown>[]) {
    if (!a || typeof a !== "object" || !isCastId(a.who)) return null;
    if (typeof a.action !== "string" || !(a.action in ACTIONS)) return null;
    const x = num(a.x, -1.2, 1.2);
    if (x === undefined) return null;
    const cue: ActorCue = { who: a.who, action: a.action, x };
    const x2 = num(a.x2, -1.2, 1.2);
    if (x2 !== undefined) cue.x2 = x2;
    if (a.flip === true) cue.flip = true;
    if (typeof a.emote === "string" && a.emote in EMOTES) cue.emote = a.emote;
    const scale = num(a.scale, 0.4, 1.6);
    if (scale !== undefined) cue.scale = scale;
    const delay = num(a.delay, 0, 5);
    if (delay !== undefined) cue.delay = delay;
    actors.push(cue);
  }
  return { bg: r.bg, fx: r.fx, cam: r.cam, framing: r.framing as Framing, actors };
}

export function applyPatches(patches: Record<string, ShotPatch>): Shot[] {
  return DEFAULT_SHOTS.map((s) => (patches[s.id] ? { ...s, ...patches[s.id], edited: true } : s));
}
