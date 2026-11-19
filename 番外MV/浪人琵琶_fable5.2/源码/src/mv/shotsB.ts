// 分镜下半：副歌二「梦回」→ 间奏题跋「一帘美梦」→ 浪人段二（雪）→ 副歌三「归」
import {
  C, G, H, SIL, TAU, W, act, cam, camLerp, disc, dots, eo, fireflies, flower, frame, fx, glow, gourd, horse, layer, lerp, moon, petals, pipa,
  prop, rain, ripples, seal, seg, snow, ss, thread, toned, umbrellaOpen, vtext, wind,
} from "./core";
import { DURATION } from "./lyrics";
import { WIN, house, river, road, room, signpost, street } from "./sets";
import { LM, LT, Shot, centered, flutter, hosts, kimiPipa, mk, poly, rock, tea, walk, winOne, winTwo } from "./shotsA";
import { RECTS } from "./atlasData";

export const SHOTS_B: Shot[] = [];
const S = mk(SHOTS_B);
const WARM = { tint: "#ffb060", ta: 0.12 };

function sepia(g: G, a: number) {
  if (a <= 0) return;
  g.fillStyle = `rgba(96,70,40,${0.42 * a})`;
  g.fillRect(0, 0, W, H);
  g.fillStyle = `rgba(14,22,48,${0.28 * a})`;
  g.fillRect(0, 0, W, H);
}

// ====== 副歌二 · 梦回（雨夜在外，暖色在窗里）======
S("s19", "小生的花伞 还落在你家", 79.46, LT(20), "rain", "线的那一头：雨夜的门边，伞还靠着，檐下的灯笼是亮的，窗里有人在灯下看书。", (g, t, lt) => {
  const c = camLerp(cam(310, 474, 1.9), cam(560, 402, 1.08), ss(seg(lt, 0.25, 3.3)));
  house(g, c, { t, tone: "rain", umb: true, lantern: 1, glow: 0.62, win: winOne });
  rain(g, t, 210, 0.5);
});

S("s20", "你美眷如花 我浪迹天涯", LT(20), LT(21), "rain", "斜切对幅：左上灯下的小克守着沙漏看书，右下本鲸在雨里赶路。同一场雨，两个地方。", (g, t, lt, u) => {
  poly(g, [[0, 0], [W * 0.6, 0], [W * 0.4, H], [0, H]], () => {
    g.translate(-300, 0);
    const c = cam(900, 440, 1.5 + 0.06 * u);
    room(g, c, { t, tone: "night", lamp: 1 });
    layer(g, c, 1, () => {
      act(g, "claude", "read", lt, 922, 628, 3.2, WARM);
      tea(g, t, { cup: true, pot: true, glass: true, dark: true });
    });
  });
  poly(g, [[W * 0.6, 0], [W, 0], [W, H], [W * 0.4, H]], () => {
    g.translate(300, 0);
    const cx = 3000 + lt * 70, c = cam(cx, 432, 1.25);
    road(g, c, { t, tone: "rain" });
    layer(g, c, 1, () => walk(g, "whale", t, cx - 20, 638, 3, true, toned("rain")));
    g.translate(-300, 0);
    rain(g, t, 200, 0.5);
  });
  g.strokeStyle = C.gold;
  g.lineWidth = 4;
  g.beginPath();
  g.moveTo(W * 0.6, 0);
  g.lineTo(W * 0.4, H);
  g.stroke();
});

S("s21", "为我泡杯花茶 和你有些不搭", LT(21), LT(22), "rain", "她照旧泡了两杯。「不搭」切并排两格：左格细瓷杯冒着热气，右格蓝饭盆在路边接雨。", (g, t, lt) => {
  if (t < LM(21) - 0.05) {
    const c = cam(720, 452, 1.7 + 0.05 * lt);
    room(g, c, { t, tone: "night", lamp: 1 });
    layer(g, c, 1, () => {
      act(g, "claude", "idle", lt, 922, 628, 3.2, WARM);
      tea(g, t, { cup: true, cup2: true, pot: true, dark: true });
    });
    return;
  }
  const l = t - LM(21);
  poly(g, [[0, 0], [W / 2, 0], [W / 2, H], [0, H]], () => {
    g.translate(-320, 0);
    const c = cam(694, 520, 3.4 + 0.12 * l);
    room(g, c, { t, tone: "night", lamp: 1 });
    layer(g, c, 1, () => tea(g, t, { cup: true, pot: true, dark: true }));
  });
  poly(g, [[W / 2, 0], [W, 0], [W, H], [W / 2, H]], () => {
    g.translate(320, 0);
    const c = cam(700, 600, 3.0 + 0.12 * l);
    road(g, c, { t, tone: "rain" });
    layer(g, c, 1, () => {
      rock(g, 700, 642, 60, "#232c48");
      prop(g, "bowl", 700, 636, 3.8, toned("rain", { ta: 0.15 }));
      ripples(g, t, 5, 676, 724, 600, 606, "220,232,250", 4);
    });
    g.translate(-320, 0);
    rain(g, t, 200, 0.55);
  });
  g.fillStyle = C.gold;
  g.fillRect(W / 2 - 2, 0, 4, H);
});

S("s22", "气氛开始 有一点尴尬", LT(22), LT(23), "rain", "隔着雨看那天：同一个定机位、同一场尴尬，褪成旧色。", (g, t, lt, u) => {
  const c = cam(660, 410, 1.16 + 0.02 * u);
  room(g, c, { t, tone: "day", umb: true });
  layer(g, c, 1, () => {
    act(g, "whale", "shiver", lt, 408, 628, 3.2);
    act(g, "claude", "lookaround", lt, 922, 628, 3.2);
    fx(g, "sweat", 486, 372 + Math.sin(lt * 6) * 4, 3.2);
    tea(g, t, { bowl: true, cup: true, pot: true, glass: true });
    dots(g, 660, 318, seg(lt, 0.3, 1.9), C.ink2, 8, 36);
  });
  sepia(g, 1);
  rain(g, t, 150, 0.42);
});

S("s23", "你腼腆一笑 竟如此融洽", LT(23), LT(24), "dusk", "她一笑，旧色回暖，雨丝一根根变成花瓣。", (g, t, lt) => {
  const cut = t >= LM(23) - 0.05, l2 = t - LM(23), k = ss(seg(lt, 0, 1.5));
  const c = cut ? cam(665, 425, 1.3 + 0.03 * l2) : cam(922, 440, 2.05 + 0.06 * lt);
  room(g, c, { t, tone: "day", umb: true });
  layer(g, c, 1, () => {
    act(g, "whale", cut ? "hop" : "idle", cut ? l2 : lt, 408, 628, 3.2);
    frame(g, "claude_front_1", 922, 628, 3.2);
    tea(g, t, { bowl: true, cup: true, pot: true, glass: true });
  });
  sepia(g, 1 - k);
  rain(g, t, 150, 0.42 * (1 - k));
  petals(g, t, 30, 0, W, 0, H, C.pink, 44, 9, k);
  glow(g, W / 2, H / 2, 760, "255,206,140", 0.3 * k);
});

S("s24", "我情不自禁 会为你牵挂", LT(24), LT(25), "night", "朱线横过整片夜色：从路上的本鲸出发，镜头追着线一路摇回亮着灯的那扇窗。", (g, t, lt, u) => {
  const pr = seg(u, 0.03, 0.9);
  const c = cam(Math.max(470, lerp(2260, 380, ss(pr))), 410, 1.12);
  house(g, c, { t, tone: "night", umb: true, lantern: 1, glow: 0.85, win: winOne });
  layer(g, c, 0.06, () => moon(g, 760, 130, 34));
  layer(g, c, 1, () => {
    fireflies(g, t, 18, 700, 2200, 380, 590, 6);
    act(g, "whale", "idle", lt, 2300, 642, 2.6, toned("night"));
    thread(g, 2300, 552, WIN.x, WIN.y, 120, t, ss(pr), 4, 2.6);
  });
});

S("s25", "什么时代 早已经不想回家", LT(25), 104.7, "night", "岔路口的木牌，一边「归」一边「天涯」。她朝天涯走了几步，摇头，掉头。", (g, t, lt) => {
  const l2 = t - LM(25), c = cam(700, 430, 1.3 + 0.03 * lt);
  road(g, c, { t, tone: "night" });
  layer(g, c, 1, () => {
    signpost(g, 640, 600, "归", "天涯", true);
    const turned = l2 > 0.9;
    horse(g, 990, 638, 1.2, turned, turned ? t * 5 : 0.6);
    if (l2 < 0) walk(g, "whale", t, lerp(700, 800, seg(lt, 0, LM(25) - LT(25))), 638, 3, true, toned("night"));
    else if (!turned) act(g, "whale", "shake", l2, 800, 638, 3, toned("night"));
    else walk(g, "whale", t, 800 - (l2 - 0.9) * 95, 638, 3, false, toned("night"));
  });
});

// ====== 间奏 · 题跋「一帘美梦」（这四句这版翻唱没有唱，写成画上的题跋）======
S("i0", "间奏 · 起风", 104.7, 106.65, "night", "往回走的人越走越快，化进风里。", (g, t, lt) => {
  const cx = 3000 - lt * 280, c = cam(cx - 110, 430, 1.3);
  road(g, c, { t, tone: "night" });
  const a = 1 - ss(seg(lt, 0.5, 1.75));
  layer(g, c, 1, () => walk(g, "whale", t, cx, 638, 3, false, toned("night", { a })));
  wind(g, t, 18, C.gold2, 0.85 * ss(seg(lt, 0.2, 1.2)), -1, 7);
  petals(g, t, 30, 0, W, 0, H, C.pink, -340, 3, 1 - a);
});

S("i1", "题跋 · 我化成风 不舍一帘美梦", 106.65, 110.05, "night", "风的视角扑向那扇窗；一挂竹帘向两边分开，帘后是暖的——两个人的影子还在窗里。", (g, t, _lt, u) => {
  const c = camLerp(cam(900, 400, 1.0), cam(WIN.x, WIN.y + 6, 3.5), Math.pow(ss(u), 1.5));
  house(g, c, { t, tone: "night", umb: true, lantern: 1, glow: 0.92, win: winTwo });
  wind(g, t, 12, C.gold2, 0.6, -1, 9);
  petals(g, t, 20, 0, W, 0, H, C.pink, -220, 8);
  const open = eo(seg(u, 0.22, 0.9)), n = 28, bw = (W / n) * (1 - 0.74 * open);
  for (let i = 0; i < n; i++) {
    const x = i < n / 2 ? i * bw : W - (n - i) * bw;
    g.fillStyle = i % 2 ? "rgba(176,148,88,0.94)" : "rgba(150,124,70,0.94)";
    g.fillRect(x, Math.sin(t * 2 + i * 0.4) * 4 - 8, bw - 2, H + 16);
    g.fillStyle = "rgba(60,40,20,0.35)";
    for (let y = 60; y < H; y += 150) g.fillRect(x, y + Math.sin(t * 2 + i * 0.4) * 4, bw - 2, 3);
  }
});

S("i2", "题跋 · 醉醒穿梭 终究是一场空", 110.05, 113.5, "night", "茶舍与河岸来回闪切（醉 / 醒）；然后小克自己起身、走到门边，屋子静下来，夜色漫进来。", (g, t, lt) => {
  const fl = lt < 1.72, ph = Math.floor(lt / 0.43);
  if (fl && ph % 2 === 1) {
    const c = cam(610, 480, 1.7);
    river(g, c, { t, tone: "night" });
    layer(g, c, 1, () => {
      gourd(g, 624, 638, 0.95, 0.1);
      act(g, "whale", "eat", lt, 500, 636, 3, toned("night", { ta: 0.22 }));
    });
    return;
  }
  const k = fl ? 0 : ss(seg(lt, 1.72, 3.2));
  const c = cam(660, 420, 1.2 - 0.05 * k);
  room(g, c, { t, tone: "day", umb: true });
  layer(g, c, 1, () => {
    act(g, "whale", "idle", lt, 408, 628, 3.2, { a: 1 - k });
    if (lt < 1.9) act(g, "claude", "idle", lt, 922, 628, 3.2);
    else walk(g, "claude", t, lerp(922, 330, ss(seg(lt, 1.9, 3.35))), 628, 3.2, false, { a: 1 - ss(seg(lt, 3.0, 3.4)) });
    tea(g, t, { bowl: true, cup: true, pot: true, a: 1 - k });
    prop(g, "hourglass", 652, 553, 3);
  });
  g.fillStyle = `rgba(14,22,48,${0.62 * k})`;
  g.fillRect(0, 0, W, H);
});

S("i3", "题跋 · 若非是你 今生又怎会懂", 113.5, 116.95, "dawn", "天快亮了。本鲸在河岸醒来，空饭盆里落着一朵花；远处 Kimi 收了琴，欠身。", (g, t, lt, u) => {
  const c = camLerp(cam(610, 520, 2.0), cam(720, 468, 1.42), ss(u));
  river(g, c, { t, tone: "dawn", moonA: 0.3 });
  layer(g, c, 1, () => {
    gourd(g, 372, 630, 0.95, 1.4);
    act(g, "whale", lt < 1.3 ? "idle" : "nod", lt < 1.3 ? lt : lt - 1.3, 500, 636, 3, toned("dawn"));
    prop(g, "bowl", 656, 638, 3.8);
    flower(g, 660, 638 - RECTS["prop_bowl"][3] * 3.8 + 8, 10, "#f2b3ab");
    glow(g, 660, 600, 90, "255,220,200", 0.35 * ss(seg(lt, 0.3, 1.5)));
    g.fillStyle = "#8a8496";
    g.beginPath();
    g.ellipse(1200, 640, 76, 12, 0, 0, TAU);
    g.fill();
    act(g, "kimi", "bow", lt - 1.2, 1100, 634, 2.7, toned("dawn"));
    pipa(g, 1206, 638, 1.15, 0.3, 1, t, 0);
  });
  petals(g, t, 10, 0, W, 0, H, C.pink, 30, 4);
});

S("i4", "题跋 · 浪人回头 心动则心痛", 116.95, 120.34, "dawn", "又上路。走了几步站住，转过身来；心口那根朱线绷紧了在颤，花瓣从来路吹过来。", (g, t, lt) => {
  const st = 1.15, tu = 1.5, wx = 6000 + Math.min(lt, st) * 90;
  const c = cam(6000 + st * 90 - 60, 442, lerp(1.25, 2.0, ss(seg(lt, 0.9, 2.3))));
  road(g, c, { t, tone: "dawn" });
  layer(g, c, 1, () => {
    if (lt >= tu) {
      thread(g, wx - 8, 498, wx - 1700, 470, 24, t, seg(lt, tu, tu + 0.45), 10, 2.6);
      glow(g, wx, 500, 70, "181,53,43", 0.3 + 0.25 * Math.sin(lt * 14));
    }
    if (lt < st) walk(g, "whale", t, wx, 638, 3, true, toned("dawn"));
    else if (lt < tu) frame(g, "walk_whale_0", wx, 638, 3, toned("dawn"));
    else act(g, "whale", lt < tu + 0.5 ? "surprise" : "sad", lt < tu + 0.5 ? lt - tu : lt - tu - 0.5, wx, 638, 3, toned("dawn"));
  });
  petals(g, t, 24, 0, W, 0, H, C.pink, 190, 4, ss(seg(lt, tu, tu + 0.8)));
});

// ====== 浪人段二 · 又一程（下雪了，这回是往回走）======
S("s26", "东奔西走 微醺不宜骑马", 120.34, LT(27), "snow", "同一条路，下雪了。这一回画面朝左——她牵着马往回走。", (g, t, lt) => {
  const cx = 8000 - lt * 120, c = cam(cx - 50, 427, 1.25);
  road(g, c, { t, tone: "snow" });
  layer(g, c, 1, () => {
    horse(g, cx + 200, 638, 1.25, true, t * 6);
    walk(g, "whale", t, cx, 638, 3, false, toned("snow"));
  });
  snow(g, t, 120);
});

S("s27", "听着浪人 弹着断了弦的琵琶", LT(27), LT(28), "snow", "还是那座桥。琵琶只剩一根弦，Kimi 还在弹；本鲸把酒葫芦推到她手边，她点头。", (g, t, lt) => {
  const l2 = t - LM(27), k = ss(seg(l2, -0.2, 1));
  const c = cam(lerp(700, 830, k), 426, 1.22 + 0.12 * k);
  river(g, c, { t, tone: "snow", moonA: 0.8 });
  layer(g, c, 1, () => {
    horse(g, 250, 638, 1.2, false, 0.6, 0.4);
    act(g, "whale", l2 >= 0 ? "point" : "idle", l2 >= 0 ? l2 : lt, 520, 636, 3, toned("snow"));
    kimiPipa(g, t, l2 >= 1.1 ? l2 - 1.1 : lt, 3, "snow", l2 >= 1.1 ? "nod" : "idle");
    if (l2 >= 0.3) {
      const p = eo(seg(l2, 0.3, 0.9));
      gourd(g, 830, 640, 0.95 * p);
      fx(g, "sparkle_" + (Math.floor(t * 6) % 3), 830, 560, 3, 1 - seg(l2, 0.9, 1.6));
    }
  });
  snow(g, t, 120);
});

S("s28", "路过青楼酒馆 官人进来坐坐 好吗", LT(28), 132.6, "snow", "雪里的忘归楼，三人照旧相请。这回本鲸站住了——鞠一躬，摇摇头，牵马走开。", (g, t, lt, u) => {
  const tm = LM(28), tq = 130.46, o = toned("snow", { ta: 0.4 });
  const c = cam(1350 - 30 * u, 416, 1.14);
  street(g, c, { t, tone: "snow" });
  layer(g, c, 1, () => {
    hosts(g, t, lt, tm, tq, "snow");
    const go = t >= tq + 0.9;
    const wx = t < tm ? lerp(1760, 1500, ss(seg(t, LT(28), tm))) : go ? 1500 - (t - tq - 0.9) * 120 : 1500;
    horse(g, wx + 210, 680, 1.3, true, t < tm || go ? t * 6 : 0.6);
    if (t < tm) walk(g, "whale", t, wx, 680, 3.3, false, o);
    else if (t < tq) act(g, "whale", "bow", t - tm, wx, 680, 3.3, o);
    else if (!go) act(g, "whale", "shake", t - tq, wx, 680, 3.3, o);
    else walk(g, "whale", t, wx, 680, 3.3, false, o);
  });
  snow(g, t, 120);
});

S("s29", "我的思念 似六月里的小雨哗哗", 132.6, LT(30), "snow", "外面在下雪，路边一洼水里却落着六月的雨——水洼映出来的是那扇亮着的窗。镜头慢慢推进水洼。", (g, t, lt) => {
  const k = ss(seg(t, LM(29) - 0.6, LM(29) + 2.6));
  const c = camLerp(cam(690, 472, 1.42), cam(830, 596, 2.25), k);
  road(g, c, { t, tone: "snow" });
  layer(g, c, 1, () => {
    horse(g, 230, 638, 1.2, false, 0.6, 0.5);
    act(g, "whale", "idle", lt, 470, 634, 3, toned("snow"));
    const px = 830, py = 650, rx = 250, ry = 46;
    g.save();
    g.beginPath();
    g.ellipse(px, py, rx, ry, 0, 0, TAU);
    g.clip();
    g.fillStyle = "#0c142e";
    g.fillRect(px - rx, py - ry, rx * 2, ry * 2);
    g.save();
    g.translate(px, py);
    g.scale(1, 0.52);
    glow(g, 0, 0, 230, "255,190,110", 0.55);
    disc(g, 0, 0, 66, "rgba(255,200,116,0.95)");
    frame(g, "act_whale_idle_0", -27, 58, 0.62, SIL);
    frame(g, "act_claude_idle_0", 27, 58, 0.62, SIL);
    g.strokeStyle = C.wood;
    g.lineWidth = 8;
    g.beginPath();
    g.arc(0, 0, 66, 0, TAU);
    g.stroke();
    g.restore();
    ripples(g, t, 8 + 18 * k, px - rx, px + rx, py - ry * 0.7, py + ry * 0.7, "220,232,250", 3);
    g.restore();
    g.strokeStyle = "rgba(235,240,250,0.7)";
    g.lineWidth = 3;
    g.beginPath();
    g.ellipse(px, py, rx, ry, 0, 0, TAU);
    g.stroke();
  });
  snow(g, t, 110);
}, 0.5);

S("s30", "对你情有所钟 为你两袖清风", LT(30), 145.6, "snow", "回到酒摊。她做了个递出去的动作——马留给了狐狸，狐狸醒了、拨算盘点头。她空着手往回走，风穿过袖子。", (g, t, lt) => {
  const l2 = t - LM(30), o = toned("snow");
  const c = cam(lerp(640, 500, ss(seg(l2, 0, 2.2))), 427, 1.22);
  street(g, c, { t, tone: "snow" });
  layer(g, c, 1, () => {
    prop(g, "abacus", 300, 487, 3);
    act(g, "zai", lt < 0.7 ? "doze" : lt < 1.3 ? "alert" : "nod", lt < 0.7 ? lt : lt < 1.3 ? lt - 0.7 : lt - 1.3, 548, 632, 2.9, toned("snow", { ta: 0.14 }));
    horse(g, 790, 638, 1.25, true, 0.6, ss(seg(l2, 0.3, 1.3)) * 0.7);
    if (l2 < 0) act(g, "whale", "point", lt - 0.5, 980, 640, 3, o);
    else walk(g, "whale", t, 980 - l2 * 150, 642, 3, false, o);
  });
  wind(g, t, 9, C.gold2, 0.65 * ss(seg(l2, 0, 0.6)), -1, 11);
  snow(g, t, 90 - 40 * ss(seg(l2, 0, 2)));
});

// ====== 副歌三 · 归（晨光，暖纸本回来了）======
S("s31", "小生的花伞 还落在你家", 145.6, LT(32), "dawn", "雪停了，天亮了。伞还靠在门边。本鲸从路的那头走进画面，在伞前站住。", (g, t, lt) => {
  const c = camLerp(cam(660, 415, 1.1), cam(470, 432, 1.36), ss(seg(lt, 0.5, 3.9)));
  house(g, c, { t, tone: "dawn", umb: true, lantern: 1 - ss(seg(lt, 1, 3)), glow: 0.3 });
  const wx = lerp(1260, 560, ss(seg(lt, 0.2, 3.4)));
  layer(g, c, 1, () => {
    if (lt < 3.4) walk(g, "whale", t, wx, 630, 3, false, toned("dawn"));
    else act(g, "whale", "idle", lt, wx, 630, 3, toned("dawn"));
  });
  petals(g, t, 20, 0, W, 0, H, C.pink, 40, 2);
}, 0.6);

S("s32", "你美眷如花 我浪迹天涯", LT(32), LT(33), "dawn", "门开了。小克站在门里，行礼；伞在两人中间。切本鲸：一身风尘，抬手打招呼。", (g, t, lt) => {
  const cut = t >= LM(32) - 0.05, l2 = t - LM(32);
  const c = cut ? cam(560, 452, 2.1 + 0.06 * l2) : cam(380, 440, 1.5 + 0.04 * lt);
  house(g, c, { t, tone: "dawn", umb: true, door: ss(seg(lt, 0, 0.7)), glow: 0.5 });
  layer(g, c, 1, () => {
    const a = ss(seg(lt, 0.3, 0.8));
    if (lt < 1.0) act(g, "claude", "idle", lt, 182, 604, 2.9, { a });
    else act(g, "claude", "curtsy", lt - 1.0, 182, 604, 2.9);
    act(g, "whale", cut ? "wave" : "surprise", cut ? l2 : lt - 0.5, 560, 630, 3, toned("dawn"));
  });
  petals(g, t, 20, 0, W, 0, H, C.pink, 40, 2);
});

S("s33", "为我泡杯花茶 和你有些不搭", LT(33), LT(34), "dawn", "桌面特写：这回花茶泡在了蓝饭盆里，水面漂着一朵花，就摆在细瓷杯旁边。「不搭」拉开成双人景。", (g, t, lt) => {
  const cut = t >= LM(33) - 0.05, l2 = t - LM(33);
  const c = cut ? cam(662, 426, 1.25 + 0.03 * l2) : cam(640, 518, 3.1 + 0.08 * lt);
  room(g, c, { t, tone: "dawn", umb: true });
  layer(g, c, 1, () => {
    act(g, "whale", "idle", lt, 408, 628, 3.2);
    act(g, "claude", "idle", lt, 922, 628, 3.2);
    tea(g, t, { bowl: true, cup: true, pot: true, bowlTea: true });
  });
});

S("s34", "气氛开始 有一点尴尬", LT(34), LT(35), "dawn", "还是那个机位、那三个墨点。然后本鲸端起饭盆一口干了，墨点没了。", (g, t, lt, u) => {
  const tg = 158.25, gulp = t >= tg;
  const c = cam(660, 410, 1.16 + 0.02 * u);
  room(g, c, { t, tone: "dawn", umb: true });
  layer(g, c, 1, () => {
    act(g, "whale", gulp ? "eat" : "shiver", gulp ? t - tg : lt, 408, 628, 3.2);
    act(g, "claude", gulp ? "tilt" : "lookaround", gulp ? t - tg : lt, 922, 628, 3.2);
    tea(g, t, { bowl: !gulp, cup: true, pot: true, bowlTea: true, glass: true });
    dots(g, 660, 318, gulp ? 1 - seg(t, tg, tg + 0.2) : seg(lt, 0.3, 1.4), C.ink2, 8, 36);
  });
});

S("s35", "你腼腆一笑 竟如此融洽", LT(35), LT(36), "dawn", "她笑了；「融洽」两个人一起跳起来，蝴蝶从窗外飞进屋。", (g, t, lt) => {
  const cut = t >= LM(35) - 0.05, l2 = t - LM(35);
  const c = cut ? cam(665, 425, 1.26 + 0.04 * l2) : cam(922, 440, 2.05 + 0.06 * lt);
  room(g, c, { t, tone: "dawn", umb: true });
  layer(g, c, 1, () => {
    act(g, "whale", cut ? "hop" : "idle", cut ? l2 : lt, 408, 628, 3.2);
    if (cut) act(g, "claude", "hop", l2, 922, 628, 3.2);
    else frame(g, "claude_front_1", 922, 628, 3.2);
    tea(g, t, { bowl: true, cup: true, pot: true, glass: true, bowlTea: true });
    if (cut) flutter(g, t, 665, 330, 6, 300, 0, 0, 5);
  });
  glow(g, W / 2, H / 2, 760, "255,206,140", 0.3 * ss(seg(lt, 0, 1.2)));
  petals(g, t, 16, 0, W, 0, H, C.pink, 44, 5);
});

S("s36", "我情不自禁 会为你牵挂", LT(36), LT(37), "dawn", "朱线这回很短，松松垂在两人之间。推近桌面：小克的沙漏翻了个面——刷新的是沙漏，不是认识的那一天。", (g, t, lt, u) => {
  const c = camLerp(cam(660, 470, 1.5), cam(655, 508, 2.3), ss(seg(u, 0.1, 0.75)));
  room(g, c, { t, tone: "dawn", umb: true });
  const hh = RECTS["prop_hourglass"][3];
  layer(g, c, 1, () => {
    act(g, "whale", "idle", lt, 408, 628, 3.2);
    act(g, "claude", "nod", lt - 0.6, 922, 628, 3.2);
    tea(g, t, { bowl: true, cup: true, pot: true, bowlTea: true });
    thread(g, 438, 500, 896, 500, 44, t, 1, 2, 2.4);
    centered(g, "prop_hourglass", 652, 553 - (hh * 3) / 2 - Math.sin(ss(seg(lt, 0.9, 1.9)) * Math.PI) * 14, 3, Math.PI * ss(seg(lt, 0.9, 1.9)));
  });
});

S("s37", "什么时代 早已经不想回家", LT(37), DURATION, "day", "清晨外景：门开着，花伞撑开晾在院里，窗里两个影子。镜头升起拉远，路空着；落款。", (g, t, lt) => {
  const c = camLerp(cam(420, 452, 1.5), cam(730, 372, 0.87), ss(seg(lt, 0.2, 5.4)));
  house(g, c, { t, tone: "day", door: 1, win: winTwo });
  layer(g, c, 1, () => {
    umbrellaOpen(g, 520, 520, 1.0, 2.45);
    flutter(g, t, 620, 430, 5, 220, 0, 0, 8);
  });
  petals(g, t, 30, 0, W, 0, H, C.pink, 46, 3);
  const a = ss(seg(t, 169.5, 170.6));
  vtext(g, "浪人琵琶", 968, 84, 66, C.ink, seg(t, 169.5, 170.8), "#f3e9d2", a);
  seal(g, 968, 84 + 66 * 4.4, 20, "番外", ss(seg(t, 170.6, 171.1)));
});
