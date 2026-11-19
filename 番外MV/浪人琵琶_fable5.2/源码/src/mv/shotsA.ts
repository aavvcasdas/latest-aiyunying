// 分镜上半：副歌一「忆」→ 主歌「凝眸 / 独酌」→ 浪人段一（〇到七十九秒）
// 时机都挂在句子上：LT(n) = 第 n 句起唱前零点零八秒切镜，LM(n) = 后半句起唱。
import { RECTS } from "./atlasData";
import {
  C, G, H, SIL, SpOpt, TAU, ToneName, W, Who, act, butterfly, cam, camLerp, clamp, disc, dots, eo, fireflies, flower, frame, fx, glow, gourd,
  horse, layer, lerp, paper, petals, pipa, prop, rain, ripples, rnd, seal, seg, ss, steam, teapot, thread, toned, vtext, wind,
} from "./core";
import { L } from "./lyrics";
import { WIN, house, river, road, room, street } from "./sets";

export interface Shot {
  id: string;
  name: string;
  a: number;
  b: number;
  tone: ToneName; // 决定歌词用墨色还是泥金
  fade?: number; // 从上一镜叠化进来的秒数
  note: string; // 这一镜在讲什么（写进分镜表）
  draw: (g: G, t: number, lt: number, u: number) => void;
}
export const LT = (n: number) => L(n).t - 0.08;
export const LM = (n: number) => L(n).m;
export const mk = (list: Shot[]) => (id: string, name: string, a: number, b: number, tone: ToneName, note: string, draw: Shot["draw"], fade?: number) =>
  list.push({ id, name, a, b, tone, note, draw, fade });

// ---------- 共用的小零件 ----------
/** 行走帧是侧面朝右画的；往左走就翻过来 */
export const WALK_RIGHT = true;
export function walk(g: G, who: Who, t: number, x: number, y: number, k: number, right: boolean, o: SpOpt = {}) {
  act(g, who, "walk", t, x, y, k, { ...o, flip: right !== WALK_RIGHT });
}
export function centered(g: G, name: string, cx: number, cy: number, k: number, rot: number, o: SpOpt = {}) {
  const h = RECTS[name][3];
  g.save();
  g.translate(cx, cy);
  g.rotate(rot);
  frame(g, name, 0, (h * k) / 2, k, { ...o, shadow: false });
  g.restore();
}
export function panel(g: G, x: number, y: number, w: number, h: number, dx: number, fn: () => void, border = C.ink) {
  g.save();
  g.beginPath();
  g.rect(x, y, w, h);
  g.clip();
  g.translate(dx, 0);
  fn();
  g.restore();
  g.strokeStyle = border;
  g.lineWidth = 3;
  g.strokeRect(x, y, w, h);
}
export function poly(g: G, pts: number[][], fn: () => void) {
  g.save();
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  g.clip();
  fn();
  g.restore();
}
/** 圆窗里的两个剪影：那段回忆 */
export const winTwo = (g: G) => {
  frame(g, "act_whale_idle_0", WIN.x - 27, WIN.y + 60, 0.62, SIL);
  frame(g, "act_claude_idle_0", WIN.x + 27, WIN.y + 60, 0.62, SIL);
};
/** 圆窗里只有她一个人在灯下看书 */
export const winOne = (g: G) => frame(g, "act_claude_read_0", WIN.x, WIN.y + 60, 0.66, SIL);

export interface TeaOpt {
  bowl?: boolean;
  bowlX?: number;
  cup?: boolean;
  cup2?: boolean;
  pot?: boolean;
  glass?: boolean;
  dark?: boolean;
  bowlTea?: boolean;
  a?: number;
}
const BOWL_H = RECTS["prop_bowl"][3];
/** 茶桌上的东西：紫砂壶、她的茶杯、她的沙漏、本鲸的蓝饭盆 */
export function tea(g: G, t: number, o: TeaOpt) {
  const y = 553, sc = o.dark ? "255,236,200" : "110,88,64";
  g.save();
  g.globalAlpha *= o.a ?? 1;
  if (o.pot) teapot(g, 756, y, 1.15);
  if (o.cup) {
    prop(g, "teacup", 700, y, 3);
    steam(g, 700, y - 30, t, 56, sc, 0.55);
  }
  if (o.cup2) {
    prop(g, "teacup", 622, y, 3);
    steam(g, 622, y - 30, t + 1.3, 56, sc, 0.55);
  }
  if (o.glass) prop(g, "hourglass", 652, y, 3);
  if (o.bowl) {
    const bx = o.bowlX ?? 588;
    prop(g, "bowl", bx, y, 3.6);
    if (o.bowlTea) {
      steam(g, bx, y - BOWL_H * 3.6, t + 0.7, 62, sc, 0.55);
      flower(g, bx + 4, y - BOWL_H * 3.6 + 9, 8, "#f6c4bd");
    }
  }
  g.restore();
}
const BF = [C.gold, "#e58a6f", "#7fa7c9", "#f1e2b4", C.pink, "#b9a2d8", "#d85a43"];
/** 一群蝴蝶：绕着 (cx,cy) 飞；fall 从零到一是「倾倒」——一只只晕乎乎落到地上 */
export function flutter(g: G, t: number, cx: number, cy: number, n: number, R: number, fall: number, groundY: number, seed = 0) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + t * (0.9 + rnd(seed + i) * 0.6);
    const r = R * (0.5 + rnd(seed + i * 2.1) * 0.7);
    let x = cx + Math.cos(a) * r, y = cy + Math.sin(a * 2 + i) * r * 0.35 - 24 * Math.sin(t * 2 + i);
    const f = clamp(fall * 1.35 - rnd(seed + i * 3.3) * 0.35);
    const gx = cx + (rnd(seed + i * 4.7) - 0.5) * R * 2.3, gy = groundY - rnd(seed + i * 5.9) * 12;
    x = lerp(x, gx + Math.sin(f * 9 + i) * 26 * (1 - f), ss(f));
    y = lerp(y, gy, f * f);
    butterfly(g, x, y, 1.15 + rnd(seed + i * 6.1) * 0.5, f >= 1 ? 1.1 + Math.sin(t * 2 + i) * 0.3 : t * 14 + i, BF[i % BF.length], f * (0.9 + (i % 3) * 0.5) * (i % 2 ? 1 : -1));
  }
}
/** 月下弹琵琶的 Kimi：人、琴、从弦上升起来的泥金音点（不画手，琴靠在石上） */
export function kimiPipa(g: G, t: number, tt: number, broken: number, tone: ToneName, action = "idle") {
  g.fillStyle = tone === "snow" ? "#8f9bb8" : "#1c2544";
  g.beginPath();
  g.ellipse(1100, 640, 84, 13, 0, 0, TAU);
  g.fill();
  act(g, "kimi", action, tt, 990, 634, 3, toned(tone, { ta: 0.2 }));
  pipa(g, 1104, 638, 1.3, 0.3, broken, t, 1);
  const n = 4 - broken;
  for (let i = 0; i < 3 + n * 2; i++) {
    const ph = (t * 0.45 + i / (3 + n * 2)) % 1;
    const x = 1130 + ph * 170 + Math.sin(ph * 9 + i) * 20, y = 540 - ph * 250;
    disc(g, x, y, 3.4 * (1 - ph) + 1, `rgba(243,214,145,${0.9 * (1 - ph)})`);
  }
}
/** 忘归楼门口招呼人的三位：千问做东，豆包踩拍暖场，猫在两头张望 */
export function hosts(g: G, t: number, lt: number, tm: number, tq: number, tone: ToneName) {
  const o = toned(tone, { ta: 0.1 });
  act(g, "gemini", t < tq ? "lookaround" : "hop", t < tq ? lt : t - tq, 1128, 624, 2.7, o);
  act(g, "qwen", t < tm ? "sway" : t < tq ? "bow" : "tilt", t < tm ? lt : t < tq ? t - tm : t - tq, 1226, 618, 3, o);
  act(g, "doubao", t < tq ? "step" : "tilt", t < tq ? lt : t - tq, 1344, 618, 3, o);
  prop(g, "fan", 1284, 606, 3, { rot: Math.sin(t * 5) * 0.25 });
  if (t >= tq) {
    const a = ss(seg(t, tq, tq + 0.25));
    fx(g, "question", 1226, 330 - a * 10, 3, a);
    fx(g, "question", 1344, 330 - a * 10, 3, a);
  }
}
/** 一块平石 */
export function rock(g: G, x: number, y: number, rx: number, col: string) {
  g.fillStyle = col;
  g.beginPath();
  g.ellipse(x, y, rx, rx * 0.2, 0, 0, TAU);
  g.fill();
}
/** 茶桌两边坐着的两个人 */
function pair(g: G, lt: number, wa: string, wt: number, ca: string, ct: number) {
  act(g, "whale", wa, wt, 408, 628, 3.2);
  if (ca === "smile") {
    act(g, "claude", "idle", lt, 922, 628, 3.2, { a: 0 });
    frame(g, "claude_front_1", 922, 628, 3.2);
  } else act(g, "claude", ca, ct, 922, 628, 3.2);
}

export const SHOTS_A: Shot[] = [];
const S = mk(SHOTS_A);

// ====== 副歌一 · 忆（暖纸本）======
S("s01", "小生的花伞 还落在你家", 0, LT(2), "day", "花伞靠在她门边，镜头从伞面拉开；人不在，伞在。片名落款。", (g, t, lt) => {
  const c = camLerp(cam(300, 478, 2.5), cam(470, 410, 1.22), ss(seg(lt, 0.35, 2.9)));
  house(g, c, { t, tone: "day", umb: true });
  petals(g, t, 26, 0, W, 0, H, C.pink, 50, 1);
  vtext(g, "浪人琵琶", 112, 84, 72, C.ink, seg(lt, 0.2, 1.5), "#f3e9d2", 1 - seg(lt, 2.7, 3.0));
  seal(g, 112, 84 + 72 * 4.4, 21, "番外", ss(seg(lt, 1.3, 1.8)) * (1 - seg(lt, 2.7, 3.0)));
});

S("s02", "你美眷如花 我浪迹天涯", LT(2), LT(3), "day", "对幅：左幅小克立在花树下行礼；唱到「我浪迹天涯」右幅滑进来，本鲸在大山水里只有一点大。", (g, t, lt) => {
  paper(g, "day");
  panel(g, 40, 58, 520, 604, -340, () => {
    const c = cam(700, 430, 1.42 + 0.03 * lt);
    house(g, c, { t, tone: "day" });
    layer(g, c, 1, () => act(g, "claude", lt < 0.9 ? "curtsy" : "idle", lt, 720, 626, 3.1));
    petals(g, t, 20, 340, 900, 0, H, C.pink, 40, 2);
  });
  const k = eo(seg(t, LM(2) - 0.3, LM(2) + 0.35));
  g.save();
  g.translate((1 - k) * 760, 0);
  panel(g, 580, 58, 520, 604, 200, () => {
    const c = cam(900 + lt * 36, 380, 0.82);
    road(g, c, { t, tone: "dusk" });
    layer(g, c, 1, () => walk(g, "whale", t, 760 + lt * 60, 640, 1.7, true, toned("dusk")));
    wind(g, t, 5, "rgba(90,60,40,0.8)", 0.35, 1, 3);
  });
  g.restore();
});

S("s03", "为我泡杯花茶 和你有些不搭", LT(3), LT(4), "day", "茶舍里对坐。唱到「不搭」切特写：她的细瓷茶杯旁边，摆着本鲸的大蓝饭盆。", (g, t, lt) => {
  const cut = t >= LM(3) - 0.05, l2 = t - LM(3);
  const c = cut ? cam(648, 524, 3.2 + 0.12 * l2) : camLerp(cam(660, 400, 1.1), cam(660, 432, 1.42), ss(lt / 2));
  room(g, c, { t, tone: "day", umb: true });
  layer(g, c, 1, () => {
    pair(g, lt, "idle", lt, "idle", lt);
    tea(g, t, { bowl: true, cup: true, pot: true });
  });
});

S("s04", "气氛开始 有一点尴尬", LT(4), LT(5), "day", "定机位双人景：本鲸发抖冒汗，小克左右张望，桌上三个墨点一颗颗冒出来；她的沙漏摆在桌上。", (g, t, lt, u) => {
  const c = cam(660, 410, 1.16 + 0.02 * u);
  room(g, c, { t, tone: "day", umb: true });
  layer(g, c, 1, () => {
    pair(g, lt, "shiver", lt, "lookaround", lt);
    fx(g, "sweat", 486, 372 + Math.sin(lt * 6) * 4, 3.2);
    tea(g, t, { bowl: true, cup: true, pot: true, glass: true });
    dots(g, 660, 318, seg(lt, 0.4, 2.2), C.ink2, 8, 36);
  });
});

S("s05", "你腼腆一笑 竟如此融洽", LT(5), LT(6), "day", "推近小克一笑；「融洽」切回双人，本鲸跳起来，暖光漫开，花瓣飘进屋。", (g, t, lt) => {
  const cut = t >= LM(5) - 0.05, l2 = t - LM(5);
  const c = cut ? cam(665, 425, 1.3 + 0.03 * l2) : cam(922, 440, 2.05 + 0.06 * lt);
  room(g, c, { t, tone: "day", umb: true });
  layer(g, c, 1, () => {
    pair(g, lt, cut ? "hop" : "idle", cut ? l2 : lt, "smile", lt);
    tea(g, t, { bowl: true, cup: true, pot: true, glass: true });
    if (cut) fx(g, "sparkle_" + (Math.floor(t * 6) % 3), 500, 360, 3.2);
  });
  glow(g, W / 2, H / 2, 760, "255,206,140", 0.3 * ss(seg(lt, 0, 1.4)));
  petals(g, t, 14, 0, W, 0, H, C.pink, 44, 5, ss(seg(lt, 0, 1)));
});

S("s06", "我情不自禁 会为你牵挂", LT(6), LT(7), "day", "「牵挂」画成一根朱线：从本鲸心口抽出来，镜头顺着线横摇，落到小克手边。", (g, t, lt, u) => {
  const c = camLerp(cam(470, 440, 1.9), cam(870, 440, 1.9), ss(seg(u, 0.18, 0.88)));
  room(g, c, { t, tone: "day", umb: true });
  layer(g, c, 1, () => {
    pair(g, lt, "idle", lt, "read", lt);
    tea(g, t, { bowl: true, cup: true, pot: true, glass: true });
    fx(g, "heart", 480, 366 - lt * 8, 3.2, 1 - seg(lt, 1.2, 2.2));
    thread(g, 430, 520, 900, 524, 64, t, seg(u, 0.1, 0.82));
  });
});

S("s07", "什么时代 早已经不想回家", LT(7), 26.48, "dusk", "黄昏外景：窗里亮起灯，映着两个人的影子；镜头拉开，那条出门的路空着——没有人要走。", (g, t, lt) => {
  const c = camLerp(cam(430, 420, 1.32), cam(830, 398, 0.96), ss(seg(t, LM(7) - 0.4, 25.8)));
  const k = ss(seg(lt, 0, 2.4));
  house(g, c, { t, tone: "dusk", umb: true, glow: 0.35 + 0.6 * k, lantern: k, win: winTwo });
  petals(g, t, 16, 0, W, 0, H, C.pink, 36, 7);
});

// ====== 主歌 · 凝眸 ======
S("s08", "你微微一笑 蝴蝶为你倾倒", 26.48, LT(9), "day", "花树下，蝴蝶绕着小克飞；「倾倒」那一下，蝴蝶真的一只只晕乎乎落到地上。猫在一旁追着看。", (g, t, lt, u) => {
  const c = cam(800, 432, 1.36 + 0.06 * u);
  house(g, c, { t, tone: "day" });
  const fall = seg(t, LM(8) + 0.3, LM(8) + 1.4);
  layer(g, c, 1, () => {
    act(g, "gemini", fall > 0.7 ? "surprise" : "lookaround", fall > 0.7 ? t - LM(8) - 1.07 : lt, 1060, 634, 2.7);
    if (t < LM(8) - 0.5) act(g, "claude", "idle", lt, 780, 626, 3.2);
    else frame(g, "claude_front_1", 780, 626, 3.2);
    flutter(g, t, 780, 440, 8, 190, fall, 640, 1);
  });
  petals(g, t, 14, 0, W, 0, H, C.pink, 36, 4);
});

S("s09", "凝眸几秒 不知道该干嘛", LT(9), LT(10), "day", "本鲸特写，三个墨点数着「几秒」；回过神来不知道该干嘛——把自己的饭盆往前推了推。", (g, t, lt) => {
  const cut = t >= LM(9) - 0.05, l2 = t - LM(9);
  const c = cut ? cam(540, 472, 1.72 + 0.04 * l2) : cam(410, 440, 2.3 + 0.07 * lt);
  room(g, c, { t, tone: "day", umb: true });
  layer(g, c, 1, () => {
    act(g, "whale", cut ? (l2 < 0.5 ? "surprise" : "point") : "idle", cut ? (l2 < 0.5 ? l2 : l2 - 0.5) : lt, 408, 628, 3.2);
    tea(g, t, { bowl: true, bowlX: cut ? 588 + ss(seg(l2, 0.55, 1.3)) * 62 : 588, cup: true, pot: true, glass: true });
    if (cut) fx(g, "question", 500, 356, 3.2, ss(seg(l2, 0, 0.3)));
  });
  if (!cut) dots(g, 760, 236, seg(lt, 0.15, 1.35), C.ink2, 9, 40);
});

S("s10", "你拂袖模样 情千变万化", LT(10), 39.3, "day", "小克提裙一礼；「千变万化」时四个不同颜色的她从身后扇面一样展开，各做各的动作。", (g, t, lt) => {
  const l2 = t - LM(10), k = eo(seg(l2, 0, 1.3));
  const c = camLerp(cam(922, 440, 1.9), cam(922, 428, 1.1), k);
  room(g, c, { t, tone: "day", table: false });
  layer(g, c, 1, () => {
    for (let j = 0; j < 3; j++) {
      g.strokeStyle = `rgba(233,163,156,${0.5 - j * 0.12})`;
      g.lineWidth = 12 - j * 3;
      g.lineCap = "round";
      g.beginPath();
      g.arc(922, 600, 170 + j * 50, Math.PI * 1.08, Math.PI * (1.08 + 0.84 * ss(seg(lt, 0.2 + j * 0.15, 1.7 + j * 0.15))));
      g.stroke();
    }
    const echo: [number, string, string][] = [[-340, "tilt", C.gold], [-170, "nod", C.pink], [170, "read", "#7fa7c9"], [340, "hop", C.red]];
    if (l2 > 0) echo.forEach(([dx, a, col], i) => act(g, "claude", a, l2 + i * 0.2, 922 + dx * k, 628, 3.2 - (Math.abs(dx) / 340) * 0.5, { tint: col, ta: 0.6, a: 0.8 * k, shadow: false }));
    act(g, "claude", "curtsy", l2 > 0 ? l2 : lt, 922, 628, 3.2);
  });
  petals(g, t, 14, 0, W, 0, H, C.pink, 40, 6);
});

// ====== 主歌 · 独酌（磁青纸泥金）======
S("s11", "一壶好酒 趁着夜还未央", 39.3, LT(12), "night", "暖纸化进夜色。酒摊：狐狸抱着算盘打盹，本鲸走来打一葫芦酒；镜头抬起，月亮刚上屋檐。", (g, t, lt) => {
  const l2 = t - LM(11);
  const c = camLerp(cam(500, 432, 1.3), cam(590, 330, 1.02), ss(seg(l2, -0.3, 1.2)));
  street(g, c, { t, tone: "night" });
  layer(g, c, 1, () => {
    prop(g, "abacus", 300, 487, 3);
    gourd(g, 400, 487, 0.8);
    act(g, "zai", "doze", lt, 548, 632, 2.9, toned("night", { ta: 0.18 }));
    fx(g, "zzz_" + (Math.floor(t * 2) % 3), 628, 420, 3);
    const wx = lerp(1040, 760, ss(seg(t, 39.8, 41.8)));
    if (t < 41.8) walk(g, "whale", t, wx, 636, 3, false, toned("night"));
    else act(g, "whale", "idle", lt, wx, 636, 3, toned("night"));
  });
}, 0.8);

S("s12", "独自品尝 这大把好时光", LT(12), LT(13), "night", "河岸独酌：本鲸拿饭盆当酒碗；对面平石上摆着一只茶杯，没有冒气。镜头拉远，人只剩一点。", (g, t, lt) => {
  const l2 = t - LM(12);
  const c = camLerp(cam(610, 480, 1.75), cam(700, 380, 0.98), ss(seg(l2, -0.3, 1.6)));
  river(g, c, { t, tone: "night" });
  layer(g, c, 1, () => {
    rock(g, 740, 640, 70, "#1c2544");
    prop(g, "teacup", 740, 634, 3, toned("night", { ta: 0.2 }));
    gourd(g, 624, 638, 0.95, 0.1);
    act(g, "whale", "eat", lt, 500, 636, 3, toned("night", { ta: 0.22 }));
    fireflies(g, t, 14, 150, 1350, 300, 570, 3);
  });
});

S("s13", "夜深人静 略显一丝凄凉", LT(13), 52.6, "night", "大月亮底下本鲸低着头。龙影只从画面上方掠过月面、不落地；风里一片花瓣。", (g, t, lt, u) => {
  const c = camLerp(cam(700, 380, 0.98), cam(790, 350, 1.08), u);
  river(g, c, { t, tone: "night" });
  layer(g, c, 0.1, () => act(g, "gpt", "hover", lt, lerp(1560, 160, seg(lt, 0.2, 4.9)), 290 + Math.sin(lt * 1.4) * 18, 1.5, { tint: "#070b18", ta: 1, shadow: false }));
  layer(g, c, 1, () => {
    rock(g, 740, 640, 70, "#1c2544");
    prop(g, "teacup", 740, 634, 3, toned("night", { ta: 0.2 }));
    gourd(g, 624, 638, 0.95, 0.1);
    act(g, "whale", "sad", lt, 500, 636, 3, toned("night", { ta: 0.3 }));
  });
  wind(g, t, 5, "rgba(196,212,240,0.9)", 0.35, -1, 2);
  petals(g, t, 3, 0, W, 0, H, "#a77c98", -70, 5, 0.9);
});

// ====== 浪人段一 ======
S("s14", "东奔西走 微醺不宜骑马", 52.6, LT(15), "night", "往东一段、往西一段连切；「微醺不宜骑马」——她晃着步子牵马走，马在后面低头吃草。", (g, t) => {
  const tb = 54.3, tc = LM(14) - 0.08;
  if (t < tb) {
    const cx = 800 + (t - 52.6) * 150, c = cam(cx, 425, 1.25);
    road(g, c, { t, tone: "night" });
    layer(g, c, 1, () => {
      horse(g, cx - 190, 638, 1.25, false, t * 7);
      walk(g, "whale", t, cx + 80, 638, 3, true, toned("night"));
    });
  } else if (t < tc) {
    const cx = 5200 - (t - tb) * 150, c = cam(cx, 425, 1.25);
    road(g, c, { t, tone: "night" });
    layer(g, c, 1, () => {
      horse(g, cx + 190, 638, 1.25, true, t * 7);
      walk(g, "whale", t, cx - 80, 638, 3, false, toned("night"));
    });
  } else {
    const l = t - tc, c = cam(9000 + l * 14, 440, 1.45 + 0.05 * l);
    road(g, c, { t, tone: "night" });
    layer(g, c, 1, () => {
      horse(g, 8740, 638, 1.25, false, 0.6, ss(seg(l, 0.2, 1)) * 0.8);
      const wx = 9070 + Math.sin(l * 1.7) * 16;
      act(g, "whale", "sway", l, wx, 638, 3, toned("night", { rot: Math.sin(l * 3.3) * 0.08 }));
      fx(g, "dizzy_" + (Math.floor(t * 8) % 4), wx, 352, 3);
    });
  }
}, 0.6);

S("s15", "听着浪人 弹着断了弦的琵琶", LT(15), LT(16), "night", "桥边月下，Kimi 守着一把琵琶，音点是泥金的；切琴身特写——四根弦里断了一根，在风里甩。", (g, t, lt) => {
  const cut = t >= LM(15) - 0.05, l2 = t - LM(15);
  const c = cut ? cam(1100, 508, 2.45 + 0.08 * l2) : cam(720, 422, 1.18 + 0.04 * lt);
  river(g, c, { t, tone: "night" });
  layer(g, c, 1, () => {
    if (!cut) {
      horse(g, 230, 638, 1.2, false, 0.6, 0.5);
      act(g, "whale", "idle", lt, 440, 636, 3, toned("night"));
    }
    kimiPipa(g, t, lt, 1, "night");
  });
});

S("s16", "路过青楼酒馆 官人进来坐坐 好吗", LT(16), 66.0, "night", "横移过「忘归楼」：千问欠身相请、豆包踩拍、猫张望；「好吗」千问和豆包一齐歪头，猫蹦了一下。本鲸从前景走过，没有停。", (g, t, lt, u) => {
  const c = cam(lerp(1100, 1400, ss(u)), 412, 1.16);
  street(g, c, { t, tone: "night" });
  layer(g, c, 1, () => {
    hosts(g, t, lt, LM(16), 63.82, "night");
    walk(g, "whale", t, lerp(860, 1660, u), 676, 3.3, true, toned("night", { ta: 0.5 }));
  });
});

S("s17", "我的思念 似六月里的小雨哗哗", 66.0, LT(18), "rain", "下雨了。她没有伞——伞落在你家。雨越下越密，她站住发抖；切回那把伞：在檐下，是干的。", (g, t, lt) => {
  const heavy = ss(seg(t, LM(17) - 0.3, LM(17) + 0.9));
  if (t < 70.9) {
    const wx = 2000 + (Math.min(t, 68.5) - 66) * 70;
    const c = cam(wx + 110 - 60 * heavy, 432, 1.28 + 0.3 * heavy);
    road(g, c, { t, tone: "rain" });
    layer(g, c, 1, () => {
      if (t < 68.5) walk(g, "whale", t, wx, 638, 3, true, toned("rain"));
      else act(g, "whale", "shiver", lt, wx, 638, 3, toned("rain"));
      ripples(g, t, 10 + heavy * 18, wx - 600, wx + 700, 604, 696);
    });
  } else {
    const c = cam(304, 474, 2.05 - 0.06 * (t - 70.9));
    house(g, c, { t, tone: "rain", umb: true, lantern: 1, glow: 0.55, win: winOne });
  }
  rain(g, t, 90 + heavy * 200, 0.35 + 0.2 * heavy);
}, 0.5);

S("s18", "对你情有所钟 为你两袖清风", LT(18), 79.46, "rain", "朱线从心口牵向来路。「两袖清风」——她把饭盆翻过来，空的，只掉出一片花瓣；风起，镜头顺着线甩回去。", (g, t, lt) => {
  const l2 = t - LM(18), whip = Math.pow(seg(t, 78.7, 79.46), 2);
  const c = cam(4040 - whip * 1700, 442, 1.62);
  road(g, c, { t, tone: "rain" });
  layer(g, c, 1, () => {
    thread(g, 4000, 500, 2300, 470, 70, t, seg(lt, 0.2, 1.9), 4);
    act(g, "whale", l2 >= 0 ? "point" : "idle", l2 >= 0 ? l2 : lt, 4000, 638, 3.2, toned("rain", { ta: 0.3 }));
    rock(g, 4200, 644, 64, "#232c48");
    const k = ss(seg(l2, 0.2, 1.1));
    centered(g, "prop_bowl", 4200, 612 - Math.sin(k * Math.PI) * 46, 3.8, Math.PI * k, toned("rain", { ta: 0.15 }));
    const pf = seg(l2, 0.8, 1.9);
    if (pf > 0 && pf < 1) {
      g.fillStyle = C.pink;
      g.beginPath();
      g.ellipse(4200 - pf * 50 + Math.sin(pf * 9) * 8, 590 + pf * 56, 6, 3.4, pf * 6, 0, TAU);
      g.fill();
    }
  });
  rain(g, t, 170, 0.5 * (1 - ss(seg(l2, -0.6, 1.2))));
  wind(g, t, 11, C.gold2, 0.75 * ss(seg(l2, 0, 0.8)), -1, 4);
});
