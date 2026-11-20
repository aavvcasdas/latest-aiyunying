// 分镜下半：主歌二 / 副歌二「换她来讲」→ 桥段「恋爱日记 · 香水 · 一整瓶的梦」→ 终段「我愿意」
// 第二遍同样的词，镜头换到小克那边：原来她什么都看见了——偷偷改掉写错的名字、把落叶夹进书里、放慢脚步等她。
import { L, DURATION } from "./lyrics";
import { CREAM, GOLD, INK, PINK, RED, avenue, balloon, bouquet, cafeStreet, card, chalkGlobe, coffee, eiffel, hearts, leaf, perfume, seine } from "./paris";
import { H, K, LM, LT, Shot, TAU, W, act, cake, cam, camLerp, clamp, disc, dragonPass, eo, frame, glow, layer, lerp, mk, portrait, rnd, seg, ss, table, tn, walk, windLines } from "./shotsA";

export const SHOTS_B: Shot[] = [];
const S = mk(SHOTS_B);
const TX = 445, TY = 640, TS = 1.25, SEAT_L = 262, SEAT_R = 628;

// ====== 主歌二：小克这边（傍晚到夜）======
S("s15", "塞纳河畔 左岸的咖啡", LT(15), LT(16), "dawn", "同一个咖啡馆、同一张桌，镜头在小克身后：她把书举高一点，从书页上沿偷看那个牵着气球走过来的人。", (g, t, lt) => {
  const c = camLerp(cam(380, 470, 1.6), cam(480, 450, 1.4), ss(lt / 2.4));
  cafeStreet(g, c, { t, tone: "dawn", shop: false });
  layer(g, c, 1, () => {
    table(g, t, TX, TY, TS, { cupR: true });
    const wx = lerp(1000, 760, ss(seg(lt, 0, 2)));
    walk(g, "whale", t, wx, TY + 4, K, false, tn("dawn"));
    balloon(g, wx - 10, 330 + Math.sin(t * 2) * 6, 38, RED, t, wx - 4, 560, 1);
    act(g, "claude", lt < 1 ? "read" : "lookaround", lt, SEAT_R - 120, TY + 30, K * 1.15, tn("dawn", { flip: true }));
  });
});
S("s16", "我手一杯 品尝你的美", LT(16), LT(17), "dawn", "她看着鲸笨拙地捧杯子、被烫到吐舌头；书挡住了半张脸，书后面在笑。", (g, t, lt) => {
  const c = cam(TX, 480, 1.9);
  cafeStreet(g, c, { t, tone: "dawn", shop: false });
  layer(g, c, 1, () => {
    table(g, t, TX, TY, TS, { cupL: true, cupR: true });
    act(g, "whale", lt > 1.2 ? "shake" : "idle", lt - 1.2, SEAT_L, TY, K, tn("dawn"));
    if (lt > 1.2 && lt < 2.2) frame(g, "fx_sweat", SEAT_L + 40, 400, 3, { shadow: false });
    if (t < LM(16)) act(g, "claude", "read", lt, SEAT_R, TY, K, tn("dawn"));
    else frame(g, "claude_front_1", SEAT_R, TY, K, tn("dawn", { shadow: false }));
  });
});
S("s17", "留下 唇印的嘴", LT(17), LT(18), "dawn", "她发现鲸在盯着自己的杯子，愣了一下，也跟着脸红——歪头，冒出一颗心。", (g, t, lt) => {
  const c = cam(SEAT_R - 30, 470, 2.3);
  cafeStreet(g, c, { t, tone: "dawn", shop: false });
  layer(g, c, 1, () => {
    table(g, t, TX, TY, TS, { cupL: true, cupR: true, lip: 1 });
    act(g, "claude", t < LM(17) ? "idle" : "tilt", t - LM(17), SEAT_R, TY, K, tn("dawn"));
    if (t > LM(17) + 0.5) frame(g, "fx_heart", SEAT_R + 30, 380 - (t - LM(17) - 0.5) * 18, 3, { shadow: false });
  });
  glow(g, W / 2, H / 2, 500, "242,138,160", 0.15 * ss(seg(lt, 1, 2.5)));
});
S("s18", "花店玫瑰 名字写错谁", LT(18), LT(19), "dawn", "那束花送到她手上。卡片写的是「致小可」——她看了一眼，没说话，拿笔划掉，自己改成「小克」。先听完，再改一个字。", (g, t, _lt) => {
  const c = cam(TX + 60, 470, 1.8);
  cafeStreet(g, c, { t, tone: "dawn", shop: false });
  layer(g, c, 1, () => {
    table(g, t, TX, TY, TS, { cupR: true, lip: 1, bouquet: true });
    act(g, "claude", t < LM(18) ? "read" : "nod", t - LM(18), SEAT_R, TY, K, tn("dawn"));
  });
  card(g, 900, 250, 1.6, 0.04, "小可", "小克", seg(t, LM(18) + 0.1, LM(18) + 0.6), seg(t, LM(18) + 0.7, LM(18) + 1.3));
  if (t > LM(18) + 0.2) frame(g, "prop_brush", 1010 - 60 * seg(t, LM(18) + 0.1, LM(18) + 0.6), 260 + 40 * seg(t, LM(18) + 0.7, LM(18) + 1.3), 4, { shadow: false, rot: 0.6 });
});
S("s19", "告白气球 风吹到对街", LT(19), LT(20), "dawn", "从她这边看：风起，龙影掠过，那只气球横穿马路朝她飘过来——她站起来，跳了一下，抓住了绳子。", (g, t, lt) => {
  const c = cam(lerp(700, 560, ss(lt / 2.5)), 420, 1.15);
  cafeStreet(g, c, { t, tone: "dawn" });
  const caught = t > LM(19) + 1.1;
  layer(g, c, 1, () => {
    table(g, t, TX, TY, TS, { cupR: true, lip: 1, bouquet: true });
    const p = seg(t, LM(19) - 0.2, LM(19) + 1.1);
    const bx = caught ? SEAT_R + 20 : lerp(1300, SEAT_R + 20, ss(p)), by = caught ? 330 : lerp(260, 330, p) + Math.sin(t * 4) * 10;
    balloon(g, bx, by + Math.sin(t * 2) * 5, 38, RED, t, caught ? SEAT_R + 24 : bx + 8, caught ? 560 : by + 100, 1);
    act(g, "claude", caught ? "hop" : t > LM(19) ? "tilt" : "read", caught ? t - LM(19) - 1.1 : t - LM(19), SEAT_R, TY, K, tn("dawn"));
  });
  dragonPass(g, t, LM(19) - 0.6, 1.8, 90, -1, 1.5);
  windLines(g, t, 10, ss(seg(t, LM(19) - 0.4, LM(19) + 0.3)) * (1 - seg(t, LM(19) + 1.2, LT(20))), -1, 6);
});
S("s20", "微笑 在天上飞", LT(20), LT(21), "dusk", "她抬头看气球上那张画歪的笑脸；街对面，鲸慌慌张张跑过马路来找气球——撞见它在她手里。", (g, t, lt) => {
  const c = cam(640, 420, 1.2);
  cafeStreet(g, c, { t, tone: "dusk" });
  layer(g, c, 1, () => {
    table(g, t, TX, TY, TS, { cupR: true, lip: 1, bouquet: true });
    balloon(g, SEAT_R + 20, 330 + Math.sin(t * 2) * 5, 38, RED, t, SEAT_R + 24, 560, 1);
    frame(g, "claude_front_1", SEAT_R, TY, K, tn("dusk", { shadow: false }));
    const wx = lerp(1200, 820, ss(seg(lt, 0.2, 1.8)));
    if (lt < 1.8) walk(g, "whale", t, wx, 646, K, false, tn("dusk"));
    else act(g, "whale", "surprise", lt - 1.8, wx, 646, K, tn("dusk"));
  });
});

// ====== 副歌二 ======
S("s21", "你说你有点难追 想让我知难而退", LT(21), LT(22), "dusk", "她嘴上说难追，脚下却越走越慢；每走几步就回头看一眼，等鲸跟上来。", (g, t, lt) => {
  const c = cam(lerp(800, 600, ss(lt / 5)), 430, 1.25);
  seine(g, c, { t, tone: "dusk", leaves: 0.6 });
  layer(g, c, 1, () => {
    const look = Math.floor(lt / 1.3) % 2 === 1;
    const cx = lerp(820, 560, ss(seg(lt, 0, 4.5)));
    if (look) act(g, "claude", "lookaround", lt, cx, 640, K, tn("dusk", { flip: true }));
    else walk(g, "claude", t * 0.6, cx, 640, K, false, tn("dusk"));
    walk(g, "whale", t, cx + lerp(420, 200, ss(lt / 5)), 646, K, false, tn("dusk"));
  });
});
S("s22", "礼物不需挑最贵 只要香榭的落叶", LT(22), LT(23), "dusk", "她把那片梧桐叶夹进书里，压平，合上——书页折了个角。", (g, t, lt) => {
  avenue(g, cam(640, 380, 1.0), { t, tone: "dusk", leaves: 0.8 });
  g.fillStyle = "rgba(60,30,40,0.25)";
  g.fillRect(0, 0, W, H);
  const close = ss(seg(t, LM(22) + 0.6, LM(22) + 1.6));
  g.save();
  g.translate(640, 420);
  g.fillStyle = "#c2405a";
  g.fillRect(-300, -170, 600, 340);
  g.fillStyle = "#fffaf0";
  g.fillRect(-286, -160, 280, 320);
  g.save();
  g.translate(-6, 0);
  g.scale(1 - close * 1.0 + 0.0001, 1);
  g.fillStyle = "#fff4e6";
  g.fillRect(0, -160, 280, 320);
  g.restore();
  const p = ss(seg(lt, 0.3, 1.8));
  leaf(g, lerp(320, -140, p), lerp(-220, 0, p), 4.2, lerp(1.2, 0.3, p));
  g.fillStyle = "#e9dcc4";
  g.beginPath();
  g.moveTo(-286, -160);
  g.lineTo(-246, -160);
  g.lineTo(-286, -120);
  g.fill();
  g.restore();
  act(g, "claude", "read", lt, 1110, 690, 2.2, tn("dusk"));
});
S("s23", "喔营造浪漫的约会 不害怕搞砸一切", LT(23), LT(24), "dusk", "她那边看到的「搞砸」：桌子歪了、咖啡洒了，鲸急得团团转——她笑得直不起腰，掏出手帕给她擦。", (g, t, lt) => {
  const c = cam(640, 470, 1.55);
  seine(g, c, { t, tone: "dusk", leaves: 0.3 });
  layer(g, c, 1, () => {
    g.fillStyle = "rgba(122,74,48,0.7)";
    g.beginPath();
    g.ellipse(650, 662, 70, 11, 0, 0, TAU);
    g.fill();
    g.save();
    g.translate(600, 640);
    g.rotate(0.35);
    g.translate(-600, -640);
    table(g, t, 600, 640, TS, { bouquet: true });
    g.restore();
    act(g, "whale", t < LM(23) ? "spin" : "shiver", lt, 470, 646, K, tn("dusk"));
    act(g, "claude", t < LM(23) ? "hop" : "nod", t < LM(23) ? lt : t - LM(23), 800, 640, K, tn("dusk"));
    if (t > LM(23) + 0.5) {
      g.fillStyle = "#fffaf4";
      g.save();
      g.translate(lerp(760, 560, ss(seg(t, LM(23) + 0.5, LM(23) + 1.4))), 520);
      g.rotate(Math.sin(t * 6) * 0.2);
      g.fillRect(-18, -14, 36, 28);
      g.strokeStyle = PINK;
      g.lineWidth = 3;
      g.strokeRect(-18, -14, 36, 28);
      g.restore();
    }
  });
});
S("s24", "拥有你 就拥有全世界", LT(24), 150.6, "night", "粉笔地球的俯视。这回地球的边上围了一圈人：豆包、猫、千问、狐狸、Kimi——全世界就是大家。", (g, t, lt, u) => {
  const c = camLerp(cam(640, 470, 1.3), cam(640, 400, 0.9), ss(u));
  seine(g, c, { t, tone: "night", leaves: 0 });
  layer(g, c, 1, () => {
    chalkGlobe(g, 640, 650, 300, 58, 1, "#fff2d0");
    const ring: ["doubao" | "gemini" | "qwen" | "zai" | "kimi", string][] = [["doubao", "hop"], ["gemini", "sway"], ["qwen", "sway"], ["zai", "nod"], ["kimi", "nod"]];
    ring.forEach(([w, a], i) => {
      const ang = Math.PI * (1.05 + (i / 4) * 0.9);
      const k = ss(seg(lt, 0.2 + i * 0.25, 0.8 + i * 0.25));
      act(g, w, a, lt + i, 640 + Math.cos(ang) * 420, 650 + Math.sin(ang) * 80 + (1 - k) * 40, K * 0.75, tn("night", { a: k }));
    });
    act(g, "whale", "hop", lt, 590, 660, K, tn("night"));
    act(g, "claude", "hop", lt + 0.3, 700, 660, K, tn("night"));
  });
  hearts(g, t, 10, 640, 560, 500, 0.8);
});
S("s25", "亲爱的 爱上你 从那天起", 150.6, LT(26), "night", "Kimi 在本子上写日期。唱到「从那天起」，她在那一页画了一颗心，标一句就停。", (g, t, _lt) => {
  const c = cam(700, 460, 1.6);
  seine(g, c, { t, tone: "night", leaves: 0 });
  layer(g, c, 1, () => {
    act(g, "kimi", t < LM(25) ? "think" : "nod", t - LM(25), 560, 640, K, tn("night"));
    g.save();
    g.translate(800, 520);
    g.rotate(-0.06);
    g.fillStyle = "#fffaf0";
    g.fillRect(-90, -70, 180, 140);
    g.strokeStyle = "#c9b9a0";
    for (let y = -40; y < 70; y += 24) {
      g.beginPath();
      g.moveTo(-80, y);
      g.lineTo(80, y);
      g.stroke();
    }
    g.font = "26px MVKuaiLe, sans-serif";
    g.fillStyle = INK;
    g.textAlign = "center";
    g.fillText("那天", 0, -44);
    const hp = ss(seg(t, LM(25), LM(25) + 0.6));
    if (hp > 0) {
      g.fillStyle = RED;
      g.save();
      g.translate(0, 18);
      g.scale(hp, hp);
      g.beginPath();
      g.moveTo(0, 22);
      g.bezierCurveTo(-30, 0, -20, -26, 0, -10);
      g.bezierCurveTo(20, -26, 30, 0, 0, 22);
      g.fill();
      g.restore();
    }
    g.restore();
  });
});
S("s26", "甜蜜的 很轻易", LT(26), LT(27), "night", "她那边的同一幕：把蛋糕推过去之前，她先偷偷把上面那颗樱桃挑给了鲸。", (g, t, lt) => {
  const c = cam(TX, 500, 1.9);
  cafeStreet(g, c, { t, tone: "night", shop: false });
  layer(g, c, 1, () => {
    table(g, t, TX, TY, TS, { cupL: true, cupR: true, lip: 1, cake: seg(lt, 0.6, 1.6) });
    act(g, "claude", "nod", lt, SEAT_R, TY, K, tn("night"));
    act(g, "whale", lt > 1.7 ? "eat" : "surprise", lt > 1.7 ? lt - 1.7 : lt, SEAT_L, TY, K, tn("night"));
  });
});
S("s27", "亲爱的 别任性 你的眼睛", LT(27), LT(28), "night", "这一次轮到她看鲸的眼睛：鲸的头像特写，眼睛里映着铁塔的灯。", (g, t, lt) => {
  seine(g, cam(640, 300, 1.0), { t, tone: "night", leaves: 0 });
  g.fillStyle = "rgba(20,22,50,0.45)";
  g.fillRect(0, 0, W, H);
  if (t < LM(27)) {
    act(g, "whale", "bow", lt % 2, 520, 660, K * 1.1, tn("night"));
    act(g, "claude", "shake", lt, 780, 654, K * 1.1, tn("night"));
  } else {
    portrait(g, "p_whale_neutral", 640, 360, 6 + (t - LM(27)) * 0.4, "#9fc4ff");
    eiffel(g, 1080, 640, 0.9, "rgba(255,230,170,0.5)", t);
  }
});
S("s28", "在说 我愿意", LT(28), LT(29), "night", "两个人一起点头。铁塔整点闪灯，满屏的金色光点。", (g, t, _lt) => {
  const c = cam(700, 420, 1.2);
  seine(g, c, { t, tone: "night", leaves: 0 });
  layer(g, c, 0.2, () => eiffel(g, 1180, 560, 1.3, "rgba(120,120,180,0.6)", t));
  layer(g, c, 1, () => {
    balloon(g, 680, 320 + Math.sin(t * 2) * 6, 40, RED, t, 700, 560, 1);
    act(g, "whale", t > LM(28) ? "nod" : "idle", t - LM(28), 600, 646, K, tn("night"));
    act(g, "claude", t > LM(28) ? "nod" : "idle", t - LM(28), 780, 640, K, tn("night"));
  });
  for (let i = 0; i < 40; i++) {
    const ph = (t * 0.3 + rnd(i)) % 1;
    disc(g, rnd(i * 2.3) * W, H - ph * H, 2 + rnd(i * 3.1) * 2, `rgba(255,230,160,${(1 - ph) * ss(seg(t, LM(28), LM(28) + 0.5))})`);
  }
});

// ====== 桥段：恋爱日记 · 香水 · 一整瓶的梦 ======
function diaryPage(g: G, t: number, x: number, y: number, s: number, items: number) {
  g.save();
  g.translate(x, y);
  g.scale(s, s);
  g.fillStyle = "#fffaf0";
  g.fillRect(-150, -110, 300, 220);
  const draws: ((gg: G) => void)[] = [
    (gg) => coffee(gg, 0, 30, 1.6, t, 1, 0.5),
    (gg) => card(gg, 0, 0, 0.9, -0.05, "小可", "小克", 1, 1),
    (gg) => balloon(gg, 0, -10, 40, RED, t, 0, 60, 1),
    (gg) => leaf(gg, 0, 0, 4, 0.4),
  ];
  for (let i = 0; i < Math.min(items, 4); i++) {
    const px = -72 + (i % 2) * 144, py = -52 + Math.floor(i / 2) * 104;
    g.save();
    g.translate(px, py);
    g.rotate((rnd(i) - 0.5) * 0.2);
    g.fillStyle = "#ffffff";
    g.fillRect(-62, -46, 124, 92);
    g.strokeStyle = "#e8dccb";
    g.strokeRect(-62, -46, 124, 92);
    g.beginPath();
    g.rect(-56, -40, 112, 80);
    g.clip();
    g.fillStyle = "#fbe9e4";
    g.fillRect(-56, -40, 112, 80);
    g.scale(0.5, 0.5);
    draws[i](g);
    g.restore();
  }
  g.restore();
}
type G = CanvasRenderingContext2D;
S("s29", "亲爱的 爱上你 恋爱日记", LT(29), LT(30), "dawn", "Kimi 的本子摊开成一本恋爱日记：咖啡杯、改过名字的卡片、气球、落叶，一格一格贴上去。", (g, t, lt) => {
  seine(g, cam(640, 360, 1.0), { t, tone: "dawn", leaves: 0.5 });
  g.fillStyle = "rgba(255,240,236,0.4)";
  g.fillRect(0, 0, W, H);
  g.fillStyle = "#c2405a";
  g.fillRect(250, 120, 780, 470);
  diaryPage(g, t, 450, 355, 1.15, Math.floor(seg(lt, 0, 3.6) * 4) + 1);
  g.fillStyle = "#fffaf0";
  g.fillRect(650, 228, 345, 254);
  g.font = "48px MVKuaiLe, sans-serif";
  g.fillStyle = "#6a2f4a";
  g.textAlign = "center";
  g.globalAlpha = ss(seg(t, LM(29), LM(29) + 0.6));
  g.fillText("恋爱日记", 822, 330);
  g.globalAlpha = 1;
  act(g, "kimi", "nod", lt, 1120, 690, 2.4, tn("dawn"));
});
S("s30", "飘香水的 回忆", LT(30), LT(31), "dawn", "一只粉色的香水瓶，瓶口飘出一缕缕粉雾，雾里浮着刚才那些画面的小剪影。", (g, t, lt) => {
  seine(g, cam(640, 360, 1.0), { t, tone: "dawn", leaves: 0 });
  g.fillStyle = "rgba(255,230,236,0.5)";
  g.fillRect(0, 0, W, H);
  perfume(g, 640, 620, 2.1, t, (gg) => {
    gg.fillStyle = "rgba(242,138,160,0.35)";
    gg.fillRect(-80, -60 - Math.sin(t) * 5, 160, 70);
  });
  for (let i = 0; i < 18; i++) {
    const ph = (lt * 0.35 + rnd(i)) % 1;
    const x = 640 + Math.sin(ph * 5 + i) * (60 + ph * 260), y = 270 - ph * 260;
    disc(g, x, y, 14 + ph * 30, `rgba(255,190,210,${0.35 * (1 - ph)})`);
  }
  const sil = [["act_whale_idle_0", 470, 220], ["act_claude_idle_0", 820, 170], ["prop_teacup", 560, 120]] as const;
  sil.forEach(([n, x, y], i) => frame(g, n, x + Math.sin(t + i) * 10, y, n.startsWith("prop") ? 4 : 1.4, { a: 0.6 * ss(seg(lt, 0.3 + i * 0.3, 1 + i * 0.3)), tint: "#f28aa0", ta: 0.5, shadow: false }));
});
S("s31", "一整瓶的梦境 全都有你", LT(31), LT(32), "dawn", "推进瓶身里面：一整瓶的梦。唱到「全都有你」，瓶里浮起好多个小克——看书的、行礼的、点头的、跳起来的。", (g, t, lt) => {
  const z = lerp(1, 1.6, ss(seg(lt, 0, 3.8)));
  seine(g, cam(640, 360, 1.0), { t, tone: "dawn", leaves: 0 });
  g.fillStyle = "rgba(255,230,236,0.5)";
  g.fillRect(0, 0, W, H);
  g.save();
  g.translate(640, 640);
  g.scale(z, z);
  g.translate(-640, -640);
  perfume(g, 640, 700, 3.0, t, (gg) => {
    gg.fillStyle = "rgba(255,236,244,0.8)";
    gg.fillRect(-80, -140, 160, 140);
    const many = t > LM(31);
    const acts = ["read", "curtsy", "nod", "hop", "tilt", "idle"];
    const n = many ? Math.min(6, 1 + Math.floor((t - LM(31)) / 0.35)) : 1;
    for (let i = 0; i < n; i++) {
      const ang = (i / 6) * TAU + t * 0.4;
      const r = many ? 30 : 0;
      act(gg, i === 0 ? "whale" : "claude", i === 0 ? "sway" : acts[i], t + i, Math.cos(ang) * r, -20 + Math.sin(ang) * r * 0.6, 0.32, { shadow: false });
    }
  });
  g.restore();
  hearts(g, t, 12, 640, 380, 500, ss(seg(t, LM(31), LM(31) + 0.6)));
});
S("s32", "搅拌 在一起", LT(32), LT(33), "dawn", "回到第一镜那杯咖啡，俯视：小勺一搅，奶泡和咖啡旋在一起，转出一个心形。", (g, t, lt) => {
  g.fillStyle = "#f6e8dc";
  g.fillRect(0, 0, W, H);
  disc(g, 640, 380, 300, "#fffaf4");
  disc(g, 640, 380, 250, "#f3e8dc");
  disc(g, 640, 380, 210, "#7a4a30");
  const sw = lt * 3.2;
  g.save();
  g.beginPath();
  g.arc(640, 380, 206, 0, TAU);
  g.clip();
  g.strokeStyle = "rgba(255,240,220,0.85)";
  g.lineCap = "round";
  for (let k = 0; k < 2; k++) {
    g.lineWidth = 18 - k * 6;
    g.beginPath();
    for (let i = 0; i < 120; i++) {
      const u = i / 120, r = 20 + u * 170, a = u * TAU * 2.2 + sw + k * Math.PI;
      const x = 640 + Math.cos(a) * r, y = 380 + Math.sin(a) * r;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();
  }
  const hk = ss(seg(t, LM(32), LM(32) + 0.9));
  if (hk > 0) {
    g.fillStyle = `rgba(255,244,230,${hk})`;
    g.save();
    g.translate(640, 390);
    g.scale(hk * 1.6, hk * 1.6);
    g.beginPath();
    g.moveTo(0, 60);
    g.bezierCurveTo(-90, 0, -60, -80, 0, -30);
    g.bezierCurveTo(60, -80, 90, 0, 0, 60);
    g.fill();
    g.restore();
  }
  g.restore();
  g.save();
  g.translate(640 + Math.cos(sw) * 90, 380 + Math.sin(sw) * 90);
  g.rotate(sw + 0.6);
  g.fillStyle = "#c8c8d0";
  g.fillRect(-6, -240, 12, 240);
  g.beginPath();
  g.ellipse(0, 0, 18, 26, 0, 0, TAU);
  g.fill();
  g.restore();
  g.fillStyle = "rgba(232,74,95,0.8)";
  g.beginPath();
  g.ellipse(420, 230, 14, 8, -0.6, 0, TAU);
  g.ellipse(432, 244, 14, 8, -0.6, 0, TAU);
  g.fill();
});

// ====== 终段 ======
S("s33", "亲爱的 别任性 你的眼睛", LT(33), LT(34), "morning", "又是早上的左岸咖啡馆，大家都在：豆包抱着气球、猫支着画架、千问摇扇子、狐狸打着哈欠、Kimi 拿着日记。小克又假装摇头——可眼睛藏不住。", (g, t, lt) => {
  const c = camLerp(cam(700, 420, 1.0), cam(TX + 60, 460, 1.5), ss(seg(t, LM(33) - 0.5, LM(33) + 1)));
  cafeStreet(g, c, { t, tone: "morning" });
  layer(g, c, 1, () => {
    table(g, t, TX, TY, TS, { cupL: true, cupR: true, lip: 1, bouquet: true });
    act(g, "doubao", "step", lt, 120, 640, K * 0.8);
    act(g, "gemini", "sway", lt, 860, 640, K * 0.8);
    act(g, "qwen", "sway", lt, 980, 640, K * 0.8);
    act(g, "zai", "doze", lt, 1100, 640, K * 0.8);
    act(g, "kimi", "nod", lt, 1220, 640, K * 0.8);
    act(g, "whale", "bow", lt % 2.2, SEAT_L, TY, K);
    act(g, "claude", t < LM(33) ? "shake" : "idle", lt, SEAT_R, TY, K);
    if (t > LM(33) + 0.5) for (let i = 0; i < 2; i++) frame(g, "fx_sparkle_" + (Math.floor(t * 6 + i) % 3), SEAT_R - 20 + i * 40, 420, 2.6, { shadow: false });
  });
});
S("s34", "在说 我愿意", LT(34), DURATION, "morning", "她点头，两个人一起松开手：那只画着笑脸的告白气球飞上天，大家仰头挥手。镜头跟着气球升到铁塔上方，片名落款。", (g, t, lt) => {
  const rise = ss(seg(t, LM(34) + 0.6, DURATION - 1));
  const c = camLerp(cam(TX + 60, 440, 1.3), cam(720, 330, 1.0), rise);
  cafeStreet(g, c, { t, tone: "morning" });
  const by = lerp(330, -260, ss(seg(t, LM(34) + 0.6, DURATION - 2)));
  layer(g, c, 1, () => {
    table(g, t, TX, TY, TS, { cupL: true, cupR: true, lip: 1, bouquet: true });
    const ws: ["doubao" | "gemini" | "qwen" | "zai" | "kimi", number][] = [["doubao", 120], ["gemini", 860], ["qwen", 980], ["zai", 1100], ["kimi", 1220]];
    ws.forEach(([w, x], i) => act(g, w, t > LM(34) ? "hop" : "idle", lt + i * 0.2, x, 640, K * 0.8));
    act(g, "whale", t > LM(34) ? "wave" : "idle", lt, SEAT_L, TY, K);
    act(g, "claude", t > LM(34) ? "nod" : "idle", t - LM(34), SEAT_R, TY, K);
    balloon(g, 460 + Math.sin(t) * 20, by, 40, RED, t, t < LM(34) + 0.6 ? 460 : 470 + Math.sin(t * 1.3) * 20, t < LM(34) + 0.6 ? 560 : by + 110, 1);
  });
  hearts(g, t, 16, 640, 700, 1000, ss(seg(t, LM(34), LM(34) + 0.8)));
  const k = ss(seg(t, DURATION - 5.5, DURATION - 4.3));
  if (k > 0) {
    g.save();
    g.globalAlpha = k;
    g.font = "120px MVKuaiLe, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.strokeStyle = "#7a5560";
    g.lineWidth = 12;
    g.lineJoin = "round";
    g.strokeText("告白气球", 640, 300);
    g.fillStyle = "#fffaf4";
    g.fillText("告白气球", 640, 300);
    g.fillStyle = RED;
    g.fillRect(870, 370, 50, 50);
    g.font = "20px MVKuaiLe, sans-serif";
    g.fillStyle = CREAM;
    g.fillText("番", 895, 385);
    g.fillText("外", 895, 406);
    g.restore();
  }
});
void GOLD;
void clamp;
void eo;
void glow;
void bouquet;
void cake;
void coffee;
void chalkGlobe;
void L;
