// 分镜上半：前奏「气球」→ 主歌一 / 副歌一「鲸这边」→ 间奏「一起走」（〇到一百零九秒）
// 第一遍是鲸的视角：她笨手笨脚地追，所有事都差一点搞砸。第二遍（shotsB）把同样的词换到小克那边重看一遍。
import { Cam, G, H, SpOpt, TAU, W, Who, act, cam, camLerp, clamp, disc, eo, frame, glow, layer, lerp, rnd, seg, ss } from "./core";
import { L } from "./lyrics";
import {
  CREAM, GOLD, PINK, PTONES, PTone, RED, TABLE_TOP, avenue, balloon, bistroTable, bouquet, cafeStreet, card, chairBistro, chalkGlobe, coffee, easel,
  hearts, leaf, lampPost, priceTag, seine,
} from "./paris";

export interface Shot {
  id: string;
  name: string;
  a: number;
  b: number;
  tone: PTone;
  note: string;
  fade?: number;
  draw: (g: G, t: number, lt: number, u: number) => void;
}
export const LT = (n: number) => L(n).t - 0.08;
export const LM = (n: number) => L(n).m;
export const mk = (list: Shot[]) => (id: string, name: string, a: number, b: number, tone: PTone, note: string, draw: Shot["draw"], fade?: number) =>
  list.push({ id, name, a, b, tone, note, draw, fade });
export const tn = (tone: PTone, extra: SpOpt = {}): SpOpt => ({ tint: PTONES[tone].tint, ta: PTONES[tone].ta, ...extra });
export const K = 2.8; // 近景角色的倍数
/** 行走帧是朝右画的 */
export function walk(g: G, who: Who, t: number, x: number, y: number, k: number, right: boolean, o: SpOpt = {}) {
  act(g, who, "walk", t, x, y, k, { ...o, flip: !right });
}
/** 咖啡桌一组：桌、两把椅子、桌上的东西（世界坐标，桌脚在 (x,y)） */
export interface TableOpt {
  cupL?: boolean; // 鲸那杯
  cupR?: boolean; // 小克那杯
  lip?: number;
  cake?: number; // 蛋糕被推到哪（零在小克面前、一在鲸面前）
  bouquet?: boolean;
  balloon?: number; // 气球系在桌上的程度（零不画）
}
export function table(g: G, t: number, x: number, y: number, s: number, o: TableOpt) {
  chairBistro(g, x - 90 * s, y, s, 1);
  chairBistro(g, x + 90 * s, y, s, -1);
  bistroTable(g, x, y, s);
  const top = y + TABLE_TOP * s;
  if (o.cupL) coffee(g, x - 26 * s, top, s * 0.9, t, 0, 0.5);
  if (o.cupR) coffee(g, x + 26 * s, top, s * 0.9, t + 1, o.lip ?? 0, 0.5);
  if (o.cake !== undefined) cake(g, lerp(x + 20 * s, x - 20 * s, ss(o.cake)), top, s * 0.8);
  if (o.bouquet) bouquet(g, x + 4 * s, top, s * 0.7);
}
export function cake(g: G, x: number, y: number, s: number) {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  g.fillStyle = "#f3e8dc";
  g.beginPath();
  g.ellipse(0, 0, 24, 5, 0, 0, TAU);
  g.fill();
  g.fillStyle = "#ffe0e8";
  g.beginPath();
  g.moveTo(-16, -2);
  g.lineTo(16, -2);
  g.lineTo(16, -20);
  g.lineTo(-16, -26);
  g.closePath();
  g.fill();
  g.fillStyle = "#fffaf4";
  g.fillRect(-16, -14, 32, 4);
  disc(g, 0, -30, 6, RED);
  g.restore();
}
/** 龙影：只从画面上方掠过，不落地（翅膀扇出的风把气球吹走） */
export function dragonPass(g: G, t: number, t0: number, dur: number, y = 120, dir = 1, k = 1.6) {
  const u = seg(t, t0, t0 + dur);
  if (u <= 0 || u >= 1) return;
  const x = dir > 0 ? lerp(-160, W + 160, u) : lerp(W + 160, -160, u);
  act(g, "gpt", "hover", t - t0, x, y + Math.sin(t * 3) * 10, k, { tint: "#3a3050", ta: 0.85, shadow: false, flip: dir < 0 });
}
export function windLines(g: G, t: number, n: number, a: number, dir = 1, seed = 0) {
  g.save();
  g.strokeStyle = "rgba(255,255,255,0.9)";
  g.lineCap = "round";
  for (let i = 0; i < n; i++) {
    const s = seed + i * 4.3;
    let x = (rnd(s) * (W + 500) + t * (600 + rnd(s + 1) * 400)) % (W + 500);
    if (dir < 0) x = W + 500 - x;
    x -= 250;
    const y = 80 + rnd(s + 2) * 480, l = 80 + rnd(s + 3) * 160;
    g.globalAlpha = a * (0.4 + rnd(s + 4) * 0.6);
    g.lineWidth = 2 + rnd(s + 5) * 2;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + (l / 2) * dir, y - 12, x + l * dir, y);
    g.stroke();
  }
  g.restore();
}
/** 大头像特写（图集头像格放大），中心 (x,y) */
export function portrait(g: G, name: string, x: number, y: number, k: number, ring = PINK) {
  disc(g, x, y, 32 * k, ring);
  disc(g, x, y, 29 * k, CREAM);
  frame(g, name, x, y + 30 * k, k, { shadow: false });
}

export const SHOTS_A: Shot[] = [];
const S = mk(SHOTS_A);
const SEAT_L = 262, SEAT_R = 628, TX = 445, TY = 640, TS = 1.25;

// ====== 前奏：气球（二十四秒）======
S("i1", "前奏 · 塞纳河的早上", 0, 5.6, "morning", "清晨的塞纳河，镜头沿河岸横摇；片名用气球吊着从下面升上来。", (g, t, lt) => {
  const c = cam(lerp(600, 900, ss(lt / 5.6)), 400, 1.0);
  seine(g, c, { t, tone: "morning", leaves: 0.4 });
  const up = eo(seg(lt, 0.6, 3.2));
  const ty = lerp(H + 80, 250, up);
  ["告", "白", "气", "球"].forEach((ch, i) => {
    const bx = 400 + i * 160, by = ty - 110 - (i % 2) * 24;
    balloon(g, bx, by, 40, [RED, PINK, "#ffb36e", "#9fd8c4"][i], t + i, bx, ty - 30, 0, i % 2 === 0);
    g.save();
    g.font = "92px MVKuaiLe, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillStyle = "#fffaf4";
    g.strokeStyle = "#7a5560";
    g.lineWidth = 8;
    g.lineJoin = "round";
    g.strokeText(ch, bx, ty + 20 + Math.sin(t * 1.6 + i) * 4);
    g.fillText(ch, bx, ty + 20 + Math.sin(t * 1.6 + i) * 4);
    g.restore();
  });
});
S("i2", "前奏 · 买一只气球", 5.6, 11.6, "morning", "街角，豆包抱着一大把气球踩拍子；鲸跑过来，挑走那只红色的心形气球，在上面画了个笑脸。", (g, t, lt) => {
  const c = camLerp(cam(1000, 420, 1.15), cam(900, 440, 1.35), ss(lt / 6));
  cafeStreet(g, c, { t, tone: "morning" });
  layer(g, c, 1, () => {
    const bx = 1040;
    const cols = [PINK, "#ffb36e", "#9fd8c4", "#c9a0e8", "#ffd36e"];
    cols.forEach((col, i) => balloon(g, bx - 80 + i * 40, 330 - (i % 2) * 40, 28, col, t + i, bx + 30, 560, 0, false));
    const taken = lt > 3.4;
    if (!taken) balloon(g, bx + 10, 300, 32, RED, t, bx + 30, 560);
    act(g, "doubao", lt < 3.4 ? "step" : "hop", lt, bx + 30, 640, K);
    const wx = lerp(1360, 900, ss(seg(lt, 0, 2.4)));
    if (lt < 2.4) walk(g, "whale", t, wx, 646, K, false);
    else act(g, "whale", lt < 3.4 ? "point" : "hop", lt - 2.4, wx, 646, K);
    if (taken) {
      const sm = ss(seg(lt, 4.0, 5.2));
      balloon(g, wx + 10, 330 + Math.sin(t * 2) * 6, 38, RED, t, wx + 18, 560, sm);
    }
  });
});
S("i3", "前奏 · 河对岸的她", 11.6, 17.6, "morning", "鲸牵着气球走上河岸，往对面看：左岸咖啡馆门口，小克一个人坐着看书。", (g, t, lt) => {
  const c = camLerp(cam(500, 420, 1.2), cam(1150, 400, 1.05), ss(seg(lt, 1.2, 5.6)));
  seine(g, c, { t, tone: "morning", leaves: 0.6 });
  layer(g, c, 0.55, () => {
    bistroTable(g, 1300, 470, 0.55);
    act(g, "claude", "read", lt, 1240, 470, 1.15);
    coffee(g, 1310, 470 + TABLE_TOP * 0.55, 0.5, t, 0, 0.4);
  });
  layer(g, c, 1, () => {
    const wx = lerp(320, 640, ss(seg(lt, 0, 2.6)));
    if (lt < 2.6) walk(g, "whale", t, wx, 640, K, true);
    else act(g, "whale", lt < 4.4 ? "idle" : "surprise", lt < 4.4 ? lt : lt - 4.4, wx, 640, K);
    balloon(g, wx + 14, 330 + Math.sin(t * 2) * 6, 38, RED, t, wx + 20, 560, 1);
  });
});
S("i4", "前奏 · 深呼吸", 17.6, LT(1), "morning", "特写：鲸把气球藏到身后，冒汗、发抖、深呼吸——心跳一下比一下大。", (g, t, lt) => {
  const c = cam(640, 470, 1.9 + 0.04 * lt);
  cafeStreet(g, c, { t, tone: "morning", shop: false });
  layer(g, c, 1, () => {
    balloon(g, 600, 330 + Math.sin(t * 2) * 6, 38, RED, t, 616, 560, 1);
    act(g, "whale", lt < 3.6 ? "shiver" : "nod", lt < 3.6 ? lt : lt - 3.6, 650, 646, K);
    if (lt < 3.6) frame(g, "fx_sweat", 700, 400 + Math.sin(lt * 7) * 4, 3, { shadow: false });
  });
  const beat = Math.pow(Math.abs(Math.sin(lt * Math.PI * 1.25)), 6) * (0.4 + lt / 10);
  glow(g, W / 2, H / 2, 600, "242,138,160", 0.25 * beat);
});

// ====== 主歌一：鲸这边 ======
S("s01", "塞纳河畔 左岸的咖啡", LT(1), LT(2), "morning", "左岸咖啡馆街口的全景，镜头推向门口那张小圆桌；鲸牵着气球从右边走进来。", (g, t, lt) => {
  const c = camLerp(cam(820, 400, 1.0), cam(560, 430, 1.25), ss(seg(lt, 0, 2.4)));
  cafeStreet(g, c, { t, tone: "morning" });
  layer(g, c, 1, () => {
    table(g, t, TX, TY, TS, { cupR: true });
    act(g, "claude", "read", lt, SEAT_R, TY, K);
    const wx = lerp(1100, 760, ss(seg(lt, 0.2, 2.5)));
    walk(g, "whale", t, wx, TY + 4, K, false);
    balloon(g, wx - 10, 330 + Math.sin(t * 2) * 6, 38, RED, t, wx - 4, 560, 1);
  });
});
S("s02", "我手一杯 品尝你的美", LT(2), LT(3), "morning", "鲸在对面坐下，两手捧着一杯咖啡；小克在看书，鲸的眼睛一直从杯沿上面偷看她。", (g, t, lt) => {
  const c = cam(TX, 470, 1.75 + 0.03 * lt);
  cafeStreet(g, c, { t, tone: "morning" });
  layer(g, c, 1, () => {
    table(g, t, TX, TY, TS, { cupL: true, cupR: true });
    act(g, "whale", "idle", lt, SEAT_L, TY, K);
    act(g, "claude", "read", lt, SEAT_R, TY, K);
    if (t > LM(2)) frame(g, "fx_heart", SEAT_L + 40, 380 - (t - LM(2)) * 20, 3, { shadow: false, a: 1 - seg(t, LM(2) + 1, LM(2) + 1.6) });
  });
});
S("s03", "留下 唇印的嘴", LT(3), LT(4), "morning", "推到桌面特写：小克放下杯子，杯沿上慢慢显出一个淡红的唇印；鲸看见了，愣住。", (g, t) => {
  const k = ss(seg(t, LM(3) - 0.2, LM(3) + 0.8));
  const c = camLerp(cam(TX + 30, 560, 3.2), cam(TX + 20, 540, 3.6), ss(seg(t, LT(3), LT(4))));
  cafeStreet(g, c, { t, tone: "morning", shop: false });
  layer(g, c, 1, () => {
    table(g, t, TX, TY, TS, { cupL: true, cupR: true, lip: k });
    act(g, "whale", t > LM(3) + 0.8 ? "surprise" : "idle", t - LM(3) - 0.8, SEAT_L, TY, K);
  });
  if (k > 0.6) glow(g, W / 2 + 80, H / 2, 160, "232,74,95", 0.18 * k);
});
S("s04", "花店玫瑰 名字写错谁", LT(4), LT(5), "morning", "鲸跑到对街花店，托千问写卡片；千问摇着扇子写得飞快——「致小可」。鲸没看，抱起花就跑。", (g, t, lt) => {
  const c = cam(1780, 430, 1.45);
  cafeStreet(g, c, { t, tone: "morning" });
  layer(g, c, 1, () => {
    act(g, "qwen", t < LM(4) ? "bow" : "nod", t < LM(4) ? lt : t - LM(4), 1700, 640, K);
    frame(g, "prop_fan", 1640, 560, 3, { shadow: false, rot: Math.sin(t * 6) * 0.3 });
    const run = seg(t, LM(4) + 0.9, LT(5));
    act(g, "whale", run > 0 ? "hop" : "idle", lt, lerp(1880, 1600, run), 646, K, { flip: run > 0 });
    if (run <= 0) bouquet(g, 1800, 610, 1.1);
    else bouquet(g, lerp(1880, 1600, run) - 30, 600, 1.1);
  });
  const cp2 = seg(t, LM(4) - 0.1, LM(4) + 0.9);
  if (cp2 > 0) card(g, 1000, 220, 1.3, -0.06, "小可", "小克", 0, 0);
});
S("s05", "告白气球 风吹到对街", LT(5), LT(6), "morning", "一阵风——龙影从屋顶上方掠过，翅膀扇起的风把鲸手里的气球吹脱了手，一路飘过马路到对街。", (g, t, lt) => {
  const c = cam(lerp(1300, 900, ss(lt / 2.4)), 420, 1.05);
  cafeStreet(g, c, { t, tone: "morning" });
  const off = t > LM(5);
  layer(g, c, 1, () => {
    const bx = off ? lerp(1300, 620, ss(seg(t, LM(5), LM(5) + 1.6))) : 1300;
    const by = off ? lerp(330, 200, seg(t, LM(5), LM(5) + 1.6)) + Math.sin(t * 4) * 12 : 330;
    balloon(g, bx, by, 38, RED, t, off ? bx + 10 : 1310, off ? by + 90 : 560, 1);
    act(g, "whale", off ? "surprise" : "idle", off ? t - LM(5) : lt, 1320, 646, K);
    bouquet(g, 1290, 600, 1.0);
  });
  dragonPass(g, t, LM(5) - 0.5, 1.8, 90, -1, 1.5);
  windLines(g, t, 10, ss(seg(t, LM(5) - 0.3, LM(5) + 0.3)) * (1 - seg(t, LM(5) + 1.2, LT(6))), -1, 2);
});
S("s06", "微笑 在天上飞", LT(6), LT(7), "noon", "画着笑脸的气球飞过巴黎的屋顶和铁塔；镜头往下摇，小克抬起头，看着它笑了。", (g, t, lt, u) => {
  const c = camLerp(cam(900, 250, 1.1), cam(640, 420, 1.15), ss(seg(u, 0.35, 1)));
  cafeStreet(g, c, { t, tone: "noon", shop: false });
  layer(g, c, 0.4, () => balloon(g, lerp(700, 1200, u), lerp(260, 120, u) + Math.sin(t * 2) * 10, 44, RED, t, lerp(712, 1212, u), lerp(360, 220, u), 1));
  layer(g, c, 1, () => {
    table(g, t, TX, TY, TS, { cupR: true, lip: 1 });
    if (u < 0.6) act(g, "claude", "tilt", lt, SEAT_R, TY, K);
    else frame(g, "claude_front_1", SEAT_R, TY, K);
  });
});

// ====== 副歌一 ======
S("s07", "你说你有点难追 想让我知难而退", LT(7), LT(8), "noon", "小克合上书起身就走，书挡着脸；鲸在后面追。唱到「知难而退」，小克回头摇了摇头——鲸缩了一步，又跟了上去。", (g, t, lt) => {
  const c = cam(lerp(900, 600, ss(lt / 5)), 430, 1.2);
  seine(g, c, { t, tone: "noon", leaves: 0.5 });
  layer(g, c, 1, () => {
    const back = t > LM(7) + 0.3;
    const cx = lerp(900, 520, ss(seg(lt, 0, 2.2)));
    if (!back && lt < 2.2) walk(g, "claude", t, cx, 640, K, false);
    else act(g, "claude", back ? "shake" : "read", back ? t - LM(7) - 0.3 : lt, cx, 640, K, { flip: back });
    const wx = back ? lerp(cx + 220, cx + 300, ss(seg(t, LM(7) + 0.4, LM(7) + 1))) + ss(seg(t, LM(7) + 1.6, LT(8))) * -100 : lerp(1180, cx + 220, ss(seg(lt, 0, 2.4)));
    if (back && t < LM(7) + 1.6) act(g, "whale", "sad", t - LM(7) - 0.3, wx, 646, K);
    else walk(g, "whale", t, wx, 646, K, false);
  });
});
S("s08", "礼物不需挑最贵 只要香榭的落叶", LT(8), LT(9), "noon", "香榭大道。狐狸举着「最贵」的标价牌推销礼盒，鲸摇头；她从地上捡起一片金黄的梧桐叶，递给小克。", (g, t, lt) => {
  const half = t > LM(8);
  const c = cam(half ? 700 : 520, 440, 1.25);
  avenue(g, c, { t, tone: "noon" });
  layer(g, c, 1, () => {
    if (!half) {
      act(g, "zai", "alert", lt, 360, 640, K);
      priceTag(g, 360, 380, 1.3, "最贵", Math.sin(t * 3) * 0.08);
      g.fillStyle = PINK;
      g.fillRect(230, 560, 70, 70);
      g.fillStyle = GOLD;
      g.fillRect(260, 560, 10, 70);
      act(g, "whale", lt > 1 ? "shake" : "idle", lt - 1, 620, 646, K);
    } else {
      const l2 = t - LM(8);
      act(g, "claude", "idle", l2, 900, 640, K);
      act(g, "whale", l2 < 0.7 ? "bow" : "point", l2 < 0.7 ? l2 : l2 - 0.7, 620, 646, K);
      const p = ss(seg(l2, 0.9, 2.2));
      leaf(g, lerp(640, 840, p), lerp(560, 470, p) - Math.sin(p * Math.PI) * 60, 2.4, Math.sin(t * 3) * 0.3);
      if (p >= 1) frame(g, "fx_heart", 900, 380 - (l2 - 2.2) * 20, 3, { shadow: false });
    }
  });
});
S("s09", "喔营造浪漫的约会 不害怕搞砸一切", LT(9), LT(10), "dusk", "河边布置约会：豆包挂灯串、猫支画架、鲸摆桌子。唱到「搞砸」，桌子一歪，咖啡洒了一地——小克没生气，笑着跳了一下。", (g, t, lt) => {
  const mess = t > LM(9) + 0.4;
  const c = cam(640, 440, 1.2 + (mess ? 0.12 : 0));
  seine(g, c, { t, tone: "dusk", leaves: 0.4 });
  layer(g, c, 1, () => {
    g.strokeStyle = "#5a4048";
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(140, 300);
    g.quadraticCurveTo(640, 380, 1140, 300);
    g.stroke();
    const lit = ss(seg(lt, 0.5, 2));
    for (let i = 0; i < 14; i++) {
      const u = i / 13, x = lerp(140, 1140, u), y = 300 + Math.sin(u * Math.PI) * 60;
      disc(g, x, y + 8, 6, i % 2 ? `rgba(255,214,120,${0.4 + 0.6 * lit})` : `rgba(242,138,160,${0.4 + 0.6 * lit})`);
    }
    act(g, "doubao", "hop", lt, 180, 640, K * 0.9, tn("dusk"));
    act(g, "gemini", "idle", lt, 1100, 640, K * 0.9, tn("dusk"));
    easel(g, 1000, 640, 0.9);
    const tilt = mess ? ss(seg(t, LM(9) + 0.4, LM(9) + 0.8)) * 0.35 : 0;
    g.save();
    g.translate(600, 640);
    g.rotate(tilt);
    g.translate(-600, -640);
    table(g, t, 600, 640, TS, { cupL: !mess, cupR: !mess, bouquet: true });
    g.restore();
    if (mess) {
      g.fillStyle = "rgba(122,74,48,0.7)";
      g.beginPath();
      g.ellipse(700, 662, 60 * ss(seg(t, LM(9) + 0.6, LM(9) + 1.2)), 10, 0, 0, TAU);
      g.fill();
    }
    act(g, "whale", mess ? "surprise" : "point", mess ? t - LM(9) - 0.4 : lt, 440, 646, K, tn("dusk"));
    act(g, "claude", mess ? "hop" : "idle", mess ? t - LM(9) - 0.9 : lt, 800, 640, K, tn("dusk"));
  });
});
S("s10", "拥有你 就拥有全世界", LT(10), 65.28, "dusk", "猫蹲下来在地上用粉笔画了个地球；鲸和小克站进去。镜头拉高：她们站在「全世界」的正中间。", (g, t, lt, u) => {
  const c = camLerp(cam(640, 470, 1.5), cam(640, 380, 0.95), ss(seg(u, 0.2, 1)));
  seine(g, c, { t, tone: "dusk", leaves: 0.3 });
  layer(g, c, 1, () => {
    chalkGlobe(g, 640, 650, 280, 54, seg(lt, 0.1, 1.8), "#fffaf4");
    act(g, "gemini", lt < 1.8 ? "choose" : "hop", lt, 300, 640, K * 0.8, tn("dusk"));
    act(g, "whale", "hop", lt - 1.2, 580, 652, K, tn("dusk"));
    act(g, "claude", "idle", lt, 700, 652, K, tn("dusk"));
    hearts(g, t, 8, 640, 520, 260, ss(seg(lt, 1.2, 2)));
  });
});
S("s11", "亲爱的 爱上你 从那天起", 65.28, LT(12), "dusk", "夕阳下的石桥上，两个人并排站着。唱到「从那天起」，桥上的路灯一盏一盏亮起来。", (g, t, lt) => {
  const c = cam(lerp(620, 760, lt / 6), 440, 1.3);
  seine(g, c, { t, tone: "dusk", leaves: 0.5 });
  layer(g, c, 1, () => {
    for (let i = 0; i < 4; i++) lampPost(g, 300 + i * 300, 640, 0.9, ss(seg(t, LM(11) + i * 0.35, LM(11) + i * 0.35 + 0.3)), "#4a3a44");
    act(g, "whale", "sway", lt, 600, 646, K, tn("dusk"));
    act(g, "claude", "idle", lt, 760, 640, K, tn("dusk"));
    hearts(g, t, 6, 680, 480, 160, 0.8);
  });
});
S("s12", "甜蜜的 很轻易", LT(12), LT(13), "dusk", "回到咖啡馆。小克把自己那块蛋糕推到鲸面前——表面严格，私下给肥鱼留饭。鲸埋头就吃。", (g, t, lt) => {
  const c = cam(TX, 500, 2.0);
  cafeStreet(g, c, { t, tone: "dusk", shop: false });
  layer(g, c, 1, () => {
    table(g, t, TX, TY, TS, { cupL: true, cupR: true, lip: 1, cake: seg(lt, 0.3, 1.2) });
    act(g, "whale", lt > 1.4 ? "eat" : "idle", lt - 1.4, SEAT_L, TY, K, tn("dusk"));
    act(g, "claude", lt < 1.3 ? "idle" : "nod", lt - 1.3, SEAT_R, TY, K, tn("dusk"));
  });
});
S("s13", "亲爱的 别任性 你的眼睛", LT(13), LT(14), "night", "夜里，小克别过脸去不看她；鲸在旁边鞠躬讨饶。唱到「你的眼睛」，切小克的头像特写——眼睛亮着。", (g, t, lt) => {
  if (t < LM(13) - 0.05) {
    const c = cam(640, 450, 1.45);
    seine(g, c, { t, tone: "night", leaves: 0.2 });
    layer(g, c, 1, () => {
      act(g, "claude", "lookaround", lt, 760, 640, K, tn("night"));
      act(g, "whale", "bow", lt % 2, 540, 646, K, tn("night"));
    });
    return;
  }
  const l2 = t - LM(13);
  seine(g, cam(640, 300, 1.0), { t, tone: "night", leaves: 0 });
  g.fillStyle = "rgba(20,22,50,0.45)";
  g.fillRect(0, 0, W, H);
  portrait(g, "p_claude_neutral", 640, 360, 6 + l2 * 0.4);
  for (let i = 0; i < 2; i++) frame(g, "fx_sparkle_" + (Math.floor(t * 6 + i) % 3), 560 + i * 170, 320, 4, { shadow: false });
});
S("s14", "在说 我愿意", LT(14), 85.52, "night", "被风吹走的那只气球回来了，挂在桥栏上。小克点头，伸手接过绳子；心形泡泡一下子冒满画面。", (g, t, lt) => {
  const yes = t > LM(14);
  const c = cam(660, 440, 1.5);
  seine(g, c, { t, tone: "night", leaves: 0 });
  layer(g, c, 1, () => {
    const by = lerp(150, 330, ss(seg(lt, 0, 1.2)));
    balloon(g, 720, by + Math.sin(t * 2) * 6, 40, RED, t, yes ? 760 : 740, yes ? 560 : by + 160, 1);
    act(g, "whale", yes ? "hop" : "idle", yes ? t - LM(14) - 0.4 : lt, 560, 646, K, tn("night"));
    act(g, "claude", yes ? "nod" : "idle", yes ? t - LM(14) : lt, 780, 640, K, tn("night"));
  });
  hearts(g, t, 22, 660, 560, 900, ss(seg(t, LM(14), LM(14) + 0.6)));
});

// ====== 间奏：一起走（二十四秒）======
S("x1", "间奏 · 河边散步", 85.52, 91.5, "dusk", "傍晚的河岸，两个人一前一后走；梧桐叶一直在落。", (g, t, lt) => {
  const cx = 1000 + lt * 80, c = cam(cx, 430, 1.2);
  seine(g, c, { t, tone: "dusk", leaves: 1.2 });
  layer(g, c, 1, () => {
    walk(g, "claude", t, cx + 80, 640, K, true, tn("dusk"));
    walk(g, "whale", t + 0.3, cx - 90, 646, K, true, tn("dusk"));
    balloon(g, cx - 80, 330 + Math.sin(t * 2) * 6, 38, RED, t, cx - 74, 560, 1);
  });
}, 0.6);
S("x2", "间奏 · 猫的画", 91.5, 97.5, "dusk", "猫在河边支着画架，把她们俩和那只气球画了下来。", (g, t, lt) => {
  const c = camLerp(cam(640, 440, 1.2), cam(820, 420, 1.7), ss(lt / 6));
  seine(g, c, { t, tone: "dusk", leaves: 0.6 });
  layer(g, c, 1, () => {
    act(g, "gemini", lt < 3 ? "choose" : "nod", lt, 660, 640, K, tn("dusk"));
    easel(g, 860, 640, 1.3, (gg) => {
      gg.fillStyle = "#f7d8b8";
      gg.fillRect(-70, -190, 140, 130);
      const p = clamp(lt / 4);
      gg.fillStyle = "#9fd0e8";
      gg.fillRect(-70, -110, 140 * p, 20);
      if (p > 0.3) disc(gg, -20, -100, 10, "#3a5a9a");
      if (p > 0.5) disc(gg, 20, -100, 10, "#f08040");
      if (p > 0.7) balloon(gg, -10, -160, 14, RED, t, -14, -112, 1);
    });
  });
});
S("x3", "间奏 · 桥上的晚上", 97.5, 103.5, "night", "入夜，铁塔亮灯。豆包在桥上转圈，千问摇扇子，狐狸靠着路灯打盹，Kimi 在小本子上记着什么。", (g, t, lt) => {
  const c = cam(lerp(560, 760, lt / 6), 430, 1.1);
  seine(g, c, { t, tone: "night", leaves: 0.3 });
  layer(g, c, 1, () => {
    act(g, "doubao", "spin", lt, 300, 640, K * 0.85, tn("night"));
    act(g, "qwen", "sway", lt, 520, 640, K * 0.85, tn("night"));
    frame(g, "prop_fan", 470, 560, 2.6, { shadow: false, rot: Math.sin(t * 5) * 0.3 });
    lampPost(g, 760, 640, 0.9, 1, "#14152c");
    act(g, "zai", "doze", lt, 820, 640, K * 0.85, tn("night"));
    act(g, "kimi", "think", lt, 1040, 640, K * 0.85, tn("night"));
  });
});
S("x4", "间奏 · 翻过一页", 103.5, LT(15), "night", "Kimi 的本子翻过去一页，夜色化开——同样的歌再唱一遍，这回换到小克那一边看。", (g, t, _lt, u) => {
  seine(g, cam(700, 380, 1.0), { t, tone: "night", leaves: 0 });
  const k = ss(seg(u, 0.1, 0.5));
  g.save();
  g.translate(640, 380);
  g.fillStyle = "#fffaf0";
  g.fillRect(-300 * k, -180, 600 * k, 360);
  g.strokeStyle = "#c9b9a0";
  g.lineWidth = 2;
  for (let y = -140; y < 180; y += 36) {
    g.beginPath();
    g.moveTo(-280 * k, y);
    g.lineTo(280 * k, y);
    g.stroke();
  }
  if (k > 0.9) {
    g.font = "56px MVKuaiLe, sans-serif";
    g.textAlign = "center";
    g.fillStyle = "#6a2f4a";
    g.globalAlpha = ss(seg(u, 0.45, 0.65));
    g.fillText("换她来讲", 0, -40);
    g.font = "34px MVKuaiLe, sans-serif";
    g.fillText("同一首歌 · 小克那一边", 0, 40);
    g.globalAlpha = 1;
  }
  g.restore();
  const flip = ss(seg(u, 0.78, 1));
  if (flip > 0) {
    g.fillStyle = `rgba(253,238,224,${flip})`;
    g.fillRect(0, 0, W, H);
  }
});
export { cam, camLerp, layer, glow, eo, lerp, seg, ss, clamp, disc, rnd, frame, act, TAU, W, H };
export type { Cam };
