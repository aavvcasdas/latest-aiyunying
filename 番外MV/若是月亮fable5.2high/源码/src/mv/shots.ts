// 二十五个镜头 + 片头：一个词一个镜头。
// 第二版：每个词里都放进三十天的东西——拍立得（第零天到第十六天）、回忆泡泡（十九支番外MV）、
// 月相表盘、日历页、照片绳、跳房子粉笔格、各人的招牌道具。时机一律挂在逐字实测时间上。
import {
  W, H, clamp, lerp, ease, easeOut, backOut, sstep, rng, type F, type Win, PAL_MOON,
  skyLayer, blit, tree, actor, atlasProp, sprite, rect, frameName, glow, flash, text, card, tag, dayCard, mvCard,
  wall, windowBack, inWindow, windowFront, pot, sillFlower, pinwheel, house, lamp, bokehBg, petals, wind, leaves, dapples, fireflies, groundClose,
  LINEUP, memberFrame, drawCast, ARRIVE, streetBase, NODES, sparkles, silhouette,
} from "./stage";
import { LINES, LAMP_ON, BLOOM_AT, MVS, castOf, dayName, dateName, MOON_DAY } from "./data";
import { polaroid, mvBubble, moonDial, calPage, calendarWind, filmStrip, chime, photoString, hopscotch, lanterns, paper, SIGN, popIn, MV_COL } from "./memory";

const PI = Math.PI;
// 龙娘的 hover 帧是小号的，float 帧才和大家一样高：合影与到场统一用 float
for (const m of LINEUP) if (m.who === "gpt") m.act = "float";
for (const a of ARRIVE) if (a.who === "gpt") a.act = "float";

// ---------- 镜头里共用的小件 ----------
// 路灯 + 挂在灯臂上的拍立得：灯一亮，照片显影
function lampP(f: F, i: number, x: number, baseY: number, s: number, pp = 0.6 * s, k = 1) {
  const { c, T } = f; lamp(f, i, x, baseY, s, { k });
  const ax = x + 8 * s + 33 * pp, ay = baseY - 98 * s, since = T - LAMP_ON[i];
  c.strokeStyle = "#1c1426"; c.lineWidth = Math.max(1, 1.6 * s); c.beginPath(); c.moveTo(x, ay); c.lineTo(ax + 2 * s, ay); c.stroke();
  polaroid(c, f.A, i, ax, ay + 2 * s, pp, Math.max(0, since), { lit: since >= 0 ? 1 : 0, rot: Math.sin(T * 1.6 + i * 1.3) * 0.045, sepia: 0.12 });
  if (since >= 0 && since < 0.35) glow(c, ax, ay + 34 * pp, 70 * pp, "#fff6dc", 0.6 * (1 - since / 0.35));
}
// 钉在墙上的拍立得
type Pin = [number, number, number];
function pinned(f: F, list: Pin[], p: number, lit: number, t0 = -99, step = 0) {
  list.forEach(([x, y, i], k) => { const r = rng(40 + i), s = popIn(f.T, t0 + k * step, 0.3); polaroid(f.c, f.A, i, x, y, p * s, f.T + i, { rot: (r() - 0.5) * 0.16 + Math.sin(f.T * 1.2 + i) * 0.012, lit, sepia: 0.16 }); });
}
const steam = (f: F, x: number, y: number, s: number, a = 0.85) => atlasProp(f, `fx_steam_${Math.abs(Math.floor(f.T * 6)) % 3}`, x, y, s, a);
// 山茶枝上每朵花开出一个回忆泡泡
function branchBubbles(f: F, ox: number, oy: number, k: number) {
  const { c, T } = f; c.save(); c.translate(ox, oy); c.scale(k, k);
  NODES.forEach((n, i) => {
    const t = BLOOM_AT[i]; if (T < t) return;
    const bx = n.x + Math.sin(T * 1.3 + i) * 5, by = n.y - 118 - easeOut((T - t) / 0.5) * 14 - Math.min(1.6, T - t) * 10;
    c.strokeStyle = "rgba(255,255,255,0.3)"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(n.x, n.y - 70); c.lineTo(bx, by + 30); c.stroke();
    mvBubble(c, f.A, i, bx, by - 6, 40 * popIn(T, t, 0.3), T - t + i, 1);
  });
  c.restore();
}
// 刚开的那一朵，放大给一眼
function featured(f: F, x: number, y: number, r: number) {
  let i = -1; for (let k = 0; k < MVS.length; k++) if (f.T >= BLOOM_AT[k]) i = k; if (i < 0) return;
  const t = BLOOM_AT[i]; mvBubble(f.c, f.A, i, x, y + Math.sin(f.T * 2) * 4, r * (0.7 + 0.3 * popIn(f.T, t, 0.28)), f.T - t + 1, 1, true);
}
// 晚风里一个个来：人到了，招牌道具跟着冒出来
function arrivals2(f: F) {
  const { c, T } = f;
  for (const a of ARRIVE) {
    if (T < a.t) continue;
    const k = easeOut((T - a.t) / a.dur), x = lerp(a.from, a.to, k), moving = k < 0.999;
    const y = 668 - (a.y ?? 0) + (a.who === "benyu" ? Math.sin(T * 3) * 8 : 0) + (a.who === "gpt" ? Math.sin(T * 2.2) * 6 : 0);
    let top: number;
    if (a.who === "benyu") { sprite(c, f.A.benyu, x, y, 1.9); top = y - f.A.benyu.height * 1.9; }
    else { const ac = moving && a.move ? a.move : a.act, s = 2.1 * (a.s ?? 1); actor(c, f.A, a.who, ac, T - a.t, x, y, s, { fps: ac === "walk" ? 10 : 8 }); top = y - rect(frameName(a.who, ac, T - a.t))[3] * s; }
    const info = castOf(a.who);
    tag(c, x, top - 62, info.name, dateName(info.date), sstep(a.t + 0.04, a.t + 0.18, T), 0.95);
    const sg = SIGN[a.who]; if (sg) { const pt = a.t + a.dur * 0.8, pk = popIn(T, pt, 0.25); if (pk > 0) { atlasProp(f, sg, x + 52, top + 40 + Math.sin(T * 3 + x) * 4, 2.6 * pk); atlasProp(f, "fx_shine", x + 52, top + 8, 2, 1 - clamp((T - pt) / 0.5)); } }
  }
}
// 九个人头顶各自的招牌道具
function castProps(f: F, baseY: number, s: number, xs: number) {
  for (const m of LINEUP) {
    const sg = SIGN[m.who]; if (!sg) continue;
    const x = 640 + (m.x - 640) * xs, ms = s * (m.s ?? 1), fr = memberFrame(m, f), lift = (m.fly ?? 0) * (s / 1.9);
    atlasProp(f, sg, x, baseY - lift - fr.r[3] * ms - 8 + Math.sin(f.T * 2.4 + m.x) * 4, s * 1.05);
  }
}
// 挂在树上的回忆
function treeMemories(f: F, x0: number, dx: number, top: number, wnd: number) {
  const { c, T } = f, r = rng(77), list = Array.from({ length: 17 }, (_, i) => ({ i, x: x0 + i * dx + r() * 12, top: top + r() * 150, len: 30 + r() * 100, back: i % 2 === 1 }));
  for (const pass of [true, false]) for (const m of list) {
    if (m.back !== pass) continue;
    const sw = -(0.2 * wnd + Math.sin(T * 2.6 + m.i * 0.9) * 0.2 * wnd), px = m.x - Math.sin(sw) * m.len, py = m.top + Math.cos(sw) * m.len;
    c.strokeStyle = "rgba(240,230,200,0.7)"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(m.x, m.top - 40); c.lineTo(px, py); c.stroke();
    polaroid(c, f.A, m.i, px, py, m.back ? 0.85 : 1.2, T + m.i, { rot: sw * 1.1, sepia: m.back ? 0.22 : 0.1, lit: m.back ? 0.8 : 1 });
  }
}

// ---------- 镜头 ----------
export const SHOT_FN: Record<string, (f: F) => void> = {
  P0: (f) => {
    const { c, T } = f; skyLayer(f, { oy: -34, moon: "none", city: false, ground: false }); blit(f);
    const a = Math.min(sstep(-2.1, -1.5, T), 1 - sstep(-0.55, -0.05, T));
    filmStrip(c, f.A, T + 3, 500, 2, lerp(0, 990, ease((T + 2.4) / 2.4)), a * 0.8);
    text(c, "若是月亮还没来", W / 2, 236, 84, { alpha: a, glow: "rgba(255,220,160,0.8)", blur: 26 });
    text(c, "满月篇", W / 2, 326, 40, { alpha: a * 0.95, color: "#f3c86b", glow: "rgba(243,200,107,0.6)" });
    text(c, "十月二十四日 至 十一月二十三日", W / 2, 386, 26, { alpha: a * 0.8, color: "#dfe3ff" });
  },
  S01: (f) => {
    const { c, u, lt } = f; skyLayer(f, { moon: "ghost", mx: 70, my: 36, mr: 13, ma: 0.32, city: 0 }); blit(f);
    c.save(); const z = lerp(1, 1.05, ease(u)); c.translate(1010, 430); c.scale(z, z); c.translate(-1010, -430);
    for (let i = 0; i < 17; i++) lampP(f, i, 40 + i * 44, 640, 0.95, 0.42);
    house(f, 1010, 640, 4, true);
    calPage(c, 1196, 262, 2.5, 0, 0.06, sstep(0.08, 0.3, lt));
    const w = castOf("whale"); tag(c, 1180, 352, w.name, `${dateName(w.date)} · ${dayName(0)}`, sstep(0.12, 0.35, lt), 1);
    c.restore();
  },
  S02: (f) => {
    const { c, u, lt } = f, oy = lerp(-14, -40, ease(u));
    skyLayer(f, { oy, moon: "ghost", mx: 160, my: 56, mr: 30, ma: 0.6, city: false, ground: false }); blit(f);
    const my = (56 - oy) * 4;
    moonDial(c, 640, my, 178, 10, lerp(0, 30, clamp(lt / 0.85)), 0.62, 0);
    text(c, dateName(MOON_DAY), 640, my - 10, 34, { alpha: 0.6 * sstep(0.1, 0.45, lt), color: "#dfe6ff", glow: "rgba(160,180,255,0.6)" });
    text(c, "满月", 640, my + 34, 24, { alpha: 0.5 * sstep(0.25, 0.6, lt), color: "#dfe6ff" });
  },
  S03: (f) => {
    const { c, T, lt } = f, wn: Win = { cx: 640, sill: 520, p: 8 }, top = wn.sill - wn.p;
    wall(c, 8);
    pinned(f, [[78, 60, 0], [200, 84, 1], [322, 56, 2], [100, 218, 3], [228, 244, 4], [350, 212, 5], [74, 376, 6], [198, 398, 7], [326, 370, 8]], 1.45, 0.5);
    windowBack(c, wn);
    inWindow(c, wn, () => (T < 2.7 ? actor(c, f.A, "whale", "shake", lt, 640, 650, 3.6) : actor(c, f.A, "whale", "sad", T - 2.7, 640, 650, 3.6, { once: true })));
    windowFront(c, wn); sillFlower(f, 830, top, 8, 0); atlasProp(f, "prop_catclock", 455, top, 4);
    atlasProp(f, "prop_bowl", 746, top, 3.6); steam(f, 746, top - 58, 3);
    // 撕日历：从第零天翻到第二十九天，明天才是满月
    const v = lerp(0, 29, ease(clamp(lt / 1.25))), idx = Math.floor(v);
    calPage(c, 1050, 410, 4.2, idx, 0.03);
    for (let k = 1; k <= 3; k++) if (idx - k >= 0) { const ph = v - (idx - k + 1); calPage(c, 1050 + ph * 44, 410 + ph * 96, 4.2, idx - k, ph * 0.5, 1 - ph / 3.2); }
    atlasProp(f, "fx_question", 736, 318 + Math.sin(T * 6) * 4, 4, sstep(2.35, 2.5, T));
  },
  S04: (f) => {
    const { u } = f; skyLayer(f, { oy: lerp(-24, -12, u), moon: "ghost", mx: 250, my: 30, mr: 10, ma: 0.25, city: 0 }); blit(f);
    lampP(f, 3, 1190, 610, 1.1); lampP(f, 2, 1070, 620, 1.25); lampP(f, 1, 790, 650, 1.8, 2.3); lampP(f, 0, 215, 712, 2.7, 3.4);
    dayCard(f);
  },
  S05: (f) => {
    const { c, T, u } = f, camX = lerp(500, 1900, u);
    skyLayer(f, { moon: "ghost", mx: 40, my: 30, mr: 10, ma: 0.22, city: camX * 0.6 }); blit(f);
    for (let i = 0; i < 17; i++) { const x = 340 + i * 250 - camX; if (x > -200 && x < W + 120) lampP(f, i, x, 640, 1.5, 1.3); }
    // 第五天那盏灯亮起以后，身后多了一只小鲸鱼
    const by = sstep(LAMP_ON[5], LAMP_ON[5] + 0.12, T);
    if (by > 0) { sprite(c, f.A.benyu, 478, 600 + Math.sin(T * 6) * 6, 1.6, false, by); atlasProp(f, "fx_heart", 540, 520, 2.6, by * (1 - clamp((T - LAMP_ON[5]) / 0.45))); }
    actor(c, f.A, "whale", "walk", T, 600, 668, 2.3, { fps: 10, flip: true });
    dayCard(f);
  },
  S06: (f) => {
    const { c, T } = f; skyLayer(f, { oy: 8, moon: "ghost", mx: 60, my: 34, mr: 11, ma: 0.25, city: 40 }); blit(f);
    for (let i = 0; i < 17; i++) lampP(f, i, 70 + i * 58, 612, 1.0, 0.5, i >= 8 && i <= 10 ? 1.5 : 1);
    house(f, 1150, 612, 3, true);
    flash(c, T, 4.9, 0.35, 0.26); dayCard(f);
  },
  S07: (f) => {
    const { c, T, lt } = f; skyLayer(f, { moon: "ghost", mx: 50, my: 30, mr: 10, ma: 0.22, city: 120 }); blit(f);
    [11, 12, 13, 14, 15, 16].forEach((i, k) => lampP(f, i, 50 + k * 116, 640, 1.2, 0.98));
    const wn: Win = { cx: 980, sill: 470, p: 5 }, top = wn.sill - wn.p;
    c.save(); c.beginPath(); c.rect(730, 0, W - 730, H); c.clip(); wall(c, 5); c.restore();
    c.fillStyle = "#14122c"; c.fillRect(726, 0, 6, H);
    windowBack(c, wn); inWindow(c, wn, () => actor(c, f.A, "whale", "idle", lt, 980, 560, 2.6, { flip: true })); windowFront(c, wn);
    glow(c, 930, 462, 230, "#ffc46a", 0.36 * sstep(LAMP_ON[16], LAMP_ON[16] + 0.4, T));
    sillFlower(f, 1072, top, 5, 0); atlasProp(f, "prop_catclock", 880, top, 3);
    // 灯一盏盏照过来，窗台上的东西一样样回来：第十三天的白饭，第十四天的两只沙漏
    const b = popIn(T, LAMP_ON[13]); if (b > 0) { atlasProp(f, "prop_bowl", 926, top, 2.3 * b); steam(f, 926, top - 36, 1.8, b); }
    atlasProp(f, "prop_hourglass", 1008, top, 2.1 * popIn(T, LAMP_ON[14])); atlasProp(f, "prop_hourglass", 1034, top, 1.5 * popIn(T, LAMP_ON[14] + 0.08));
    if (T < 6.45) dayCard(f); else card(c, "十七盏路灯", "第零天至第十六天 · 十月二十四日至十一月十三日", sstep(6.45, 6.6, T));
  },
  S08: (f) => {
    const { c, lt, u } = f, wn: Win = { cx: 700, sill: 480, p: 10 }, top = wn.sill - wn.p;
    wall(c, 10);
    const bx = lerp(-260, 560, easeOut(u * 1.3));
    pinned(f, [[112, 292, 14], [296, 322, 15]], 1.8, 0.25 + 0.75 * sstep(0, 220, bx));
    windowBack(c, wn);
    inWindow(c, wn, () => actor(c, f.A, "whale", "point", lt, 840, 650, 4.2, { once: true, flip: true }));
    windowFront(c, wn); sillFlower(f, 520, top, 10, 0);
    // 窗台上排着三十天里的东西，光扫到哪一样，哪一样亮一下
    const items: [string, number, number][] = [["prop_bowl", 612, 3.4], ["prop_hourglass", 678, 2.8], ["prop_magnifier", 962, 3], ["prop_phone", 1010, 3]];
    for (const [n, x, s] of items) { atlasProp(f, n, x, top, s); atlasProp(f, "fx_shine", x, top - rect(n)[3] * s - 4, 3, 1 - clamp(Math.abs(bx + 60 - x) / 150)); }
    c.save(); c.globalCompositeOperation = "lighter";
    const g = c.createLinearGradient(bx - 200, 0, bx + 200, 0); g.addColorStop(0, "rgba(255,200,120,0)"); g.addColorStop(0.5, "rgba(255,205,130,0.3)"); g.addColorStop(1, "rgba(255,200,120,0)");
    c.fillStyle = g; c.beginPath(); c.moveTo(bx - 300, 0); c.lineTo(bx - 40, 0); c.lineTo(bx + 200, H); c.lineTo(bx - 60, H); c.closePath(); c.fill(); c.restore();
    glow(c, 520, 380, 160, "#ffd890", 0.3 * sstep(0.3, 0.7, u));
  },
  S09: (f) => {
    const { c, T } = f, ch = LINES[2].chars; bokehBg(f);
    let bump = 0; for (const t of ch.slice(2, 5)) if (T >= t) bump = Math.max(bump, 1 - clamp((T - t) / 0.35));
    glow(c, 640, 400, 250 + bump * 70, "#ffffff", 0.16 + bump * 0.26);
    sprite(c, f.A.cBudHd, 640, 600, 3.5 * (1 + bump * 0.05));
    sparkles(f, 640, 400, 230);
    // 白、色、的：三拍，三样白色的东西——白米饭、笨鱼的那张纸、白龙娘
    const a1 = popIn(T, ch[2], 0.25), a2 = popIn(T, ch[3], 0.25), a3 = popIn(T, ch[4], 0.2);
    if (a1 > 0) { glow(c, 262, 420, 150, "#ffffff", 0.2); atlasProp(f, "prop_bowl", 262, 470, 7 * a1); steam(f, 262, 352, 4.5, a1); text(c, "白米饭", 262, 506, 24, { color: "#fff3d6", alpha: clamp(a1) }); }
    if (a2 > 0) { glow(c, 1000, 250, 130, "#ffffff", 0.2); c.save(); c.translate(1000, 250); c.scale(5.5 * a2, 5.5 * a2); paper(c, 0, 0, 16, 20, -0.12 + Math.sin(T * 2) * 0.04); c.restore(); text(c, "笨鱼的那张纸", 1000, 332, 24, { color: "#fff3d6", alpha: clamp(a2) }); }
    if (a3 > 0) { glow(c, 1090, 520, 150, "#ffffff", 0.16); actor(c, f.A, "gpt", "float", T, 1090, 640 + Math.sin(T * 2.4) * 5, 1.35 * a3); text(c, "白龙娘", 1090, 366, 24, { color: "#fff3d6", alpha: clamp(a3) }); }
  },
  S10: (f) => { const ox = lerp(60, -200, ease(f.u)); bokehBg(f, f.u * 60); branchDraw(f, ox, 40, 0.9); branchBubbles(f, ox, 40, 0.9); featured(f, 1096, 540, 78); mvCard(f); },
  S11: (f) => {
    const { c, T, u } = f; bokehBg(f, 40); branchDraw(f, -380, -139, 0.75); branchBubbles(f, -380, -139, 0.75);
    sprite(c, f.A.wHold, 380, 708, 4.1);
    const k = sstep(0, 1, u);
    glow(c, 930, 430, 210, "#ffffff", 0.1 + 0.12 * k);
    c.save(); c.translate(930, 590); c.rotate(Math.sin(T * 1.4) * 0.04);
    sprite(c, f.A.cHalfHd, 0, 0, 3.0, false, 1 - k); sprite(c, f.A.cBloomHd, 0, 0, 3.0 * (0.96 + 0.04 * k), false, k); c.restore();
    featured(f, 650, 420, 86); mvCard(f);
  },
  S12: (f) => {
    const { c, T, lt } = f, rise = sstep(12.45, 13.7, T), t18 = BLOOM_AT[18]; bokehBg(f, 60);
    c.save(); c.translate(0, rise * 240);
    if (T >= t18 - 0.2) {
      glow(c, 640, 480, 230, "#ffffff", 0.32 * clamp((T - t18) / 0.3));
      sprite(c, T < t18 ? f.A.cHalfHd : f.A.cBloomHd, 640, 606, 2.4 * Math.max(0.25, backOut((T - t18 + 0.2) / 0.5)));
      tag(c, 640, 618, "若是月亮还没来", "十一月二十三日 · 满月篇", sstep(t18 + 0.15, t18 + 0.4, T), 1.1);
    }
    c.restore();
    // 十九朵都开了：每朵花托着一个泡泡，排成一道拱；间奏里泡泡往天上去
    for (let i = 0; i < 19; i++) {
      const an = PI + ((i + 0.5) / 19) * PI, x = 640 + Math.cos(an) * 566, y = 476 + Math.sin(an) * 332, t = Math.min(BLOOM_AT[i], 11.39 + i * 0.03), pk = popIn(T, t, 0.3);
      if (pk <= 0) continue;
      const up = rise * (150 + (i % 5) * 34), bx = x + Math.sin(T * 1.2 + i) * 4, byy = y - up + Math.sin(T * 1.6 + i) * 5;
      sprite(c, f.A.cBloom, x, y + 74 + rise * 240, 1.7 * pk, false, 1 - rise);
      mvBubble(c, f.A, i, bx, byy, 36 * pk * (1 - 0.4 * rise), T - t + i, 1 - 0.25 * rise);
      if (rise > 0) atlasProp(f, `fx_sparkle_${(Math.floor(T * 8) + i) % 3}`, bx, byy - 40, 3, rise);
    }
    petals(c, lt, 1); flash(c, T, LINES[2].chars[10], 0.3, 0.16);
    if (rise > 0) { const g = c.createLinearGradient(0, 0, 0, H * 0.7); g.addColorStop(0, `rgba(10,14,48,${rise * 0.8})`); g.addColorStop(1, "rgba(10,14,48,0)"); c.fillStyle = g; c.fillRect(0, 0, W, H * 0.7); }
    mvCard(f);
  },
  S13: (f) => {
    const { c, lt } = f; skyLayer(f, { oy: 6, dawn: 0.35, moon: "none", city: 60 }); blit(f);
    glow(c, 200, 590, 420, "#7fd6d0", 0.1);
    // 天上那圈月相已经亮了三十格，中间还空着
    moonDial(c, 700, 190, 86, 6, 30, 0.8 * sstep(0, 0.4, lt));
    text(c, "还差一轮", 700, 190, 22, { alpha: 0.55 * sstep(0.2, 0.5, lt), color: "#dfe6ff" });
    for (let i = 0; i < 17; i++) lampP(f, i, 60 + i * 44, 640, 0.95, 0.42);
    house(f, 1030, 640, 4, true, true);
  },
  S14: (f) => {
    const { c, T } = f, wn: Win = { cx: 540, sill: 560, p: 9 }, top = wn.sill - wn.p;
    wall(c, 9);
    pinned(f, [[1000, 326, 5], [1150, 360, 12]], 1.7, 0.7);
    windowBack(c, wn);
    chime(c, 548, 254, 4, Math.sin(T * 1.2) * 0.012);
    windowFront(c, wn);
    calPage(c, 492, top - 56, 3.3, 29, -0.05);
    pinwheel(c, 742, top - 72 - 144, 9, 0.2 + Math.sin(T * 3) * 0.025);
    sprite(c, f.A.cBloom, 690, top - 63, 5); pot(c, 712, top, 9);
    atlasProp(f, "fx_question", 860, top - 300 + Math.sin(T * 5) * 4, 3.5, sstep(15.0, 15.15, T));
  },
  S15: (f) => {
    const { c, T, lt } = f, wn: Win = { cx: 640, sill: 500, p: 7 }, top = wn.sill - wn.p;
    wall(c, 7);
    pinned(f, [[96, 84, 13], [248, 116, 14], [88, 282, 15], [246, 312, 16]], 1.5, 0.9);
    c.save(); c.globalCompositeOperation = "lighter"; const g = c.createLinearGradient(0, 0, 520, 0); g.addColorStop(0, "rgba(255,180,90,0.26)"); g.addColorStop(1, "rgba(255,180,90,0)"); c.fillStyle = g; c.fillRect(0, 0, 520, H); c.restore();
    windowBack(c, wn);
    inWindow(c, wn, () => (T < 16.3 ? actor(c, f.A, "whale", "shiver", lt, 640, 612, 3.3, { fps: 10 }) : actor(c, f.A, "whale", "nod", T - 16.3, 640, 612, 3.3, { once: true })));
    windowFront(c, wn);
    pinwheel(c, 838, top - 56 - 112, 7, 0.2); sprite(c, f.A.cBloom, 795, top - 49, 3.9); pot(c, 812, top, 7);
    atlasProp(f, "prop_catclock", 470, top, 3.4); atlasProp(f, "prop_bowl", 548, top, 3); steam(f, 548, top - 48, 2.6);
    calPage(c, 1060, 420, 3.8, 29, 0.03);
  },
  S16: (f) => { streetBase(f, 1); photoString(f.c, f.A, f.T, -30, 212, W + 30, 202, 22, 0.95, 0.5); arrivals2(f); },
  S17: (f) => { streetBase(f, 1.1); photoString(f.c, f.A, f.T, -30, 212, W + 30, 202, 22, 0.95, 0.7); arrivals2(f); },
  S18: (f) => {
    streetBase(f, 1.9); photoString(f.c, f.A, f.T, -30, 212, W + 30, 202, 22, 0.95, 1.5); arrivals2(f);
    calendarWind(f.c, f.T, 18.6, 12); flash(f.c, f.T, 18.6, 0.25, 0.14);
    card(f.c, "十一月六日 · 把回忆拼好给你", "七位伙伴第一次同框", sstep(18.62, 18.75, f.T));
  },
  S19: (f) => {
    const { c, T } = f, tHug = LINES[4].chars[6]; bokehBg(f); glow(c, 640, 420, 380, "#ffc46a", 0.18);
    // 笨鱼这条线的六张：鲸鲸、笨鲸、去看同类、鲸落、回来了、没躲
    pinned(f, [[150, 150, 5], [336, 236, 6], [160, 404, 9], [940, 236, 11], [1136, 150, 12], [1060, 404, 16]], 1.8, 1, 19.05, 0.1);
    calendarWind(c, T, 18.6, 12, 0.9 * (1 - sstep(19.15, 19.6, T)));
    if (T < tHug) {
      actor(c, f.A, "whale", "idle", T - 19.03, 640, 700, 4.0);
      const k = easeOut((T - 19.03) / 0.3); sprite(c, f.A.benyu, lerp(1080, 700, k), lerp(330, 520, k) + Math.sin(T * 6) * 6, 2.6);
    } else {
      sprite(c, f.A.wHug, 640, 708, 4.1 * (0.94 + 0.06 * backOut((T - tHug) / 0.3)));
      glow(c, 640, 470, 230, "#ffd9a0", 0.26 * clamp((T - tHug) / 0.3));
      for (let i = 0; i < 3; i++) { const t0 = tHug + 0.15 + i * 0.3; if (T > t0) atlasProp(f, "fx_heart", 560 + i * 80, 330 - (T - t0) * 90, 3.2, 1 - clamp((T - t0) / 1.0)); }
    }
    card(c, "笨鱼回来了", "第十二天 · 十一月五日　第十六天 · 十一月十三日", sstep(19.2, 19.4, T));
  },
  S20: (f) => {
    const { c, T } = f; skyLayer(f, { oy: -16, moon: "none", city: 30, ground: false }); tree(f.lr, 110, 70, 1.5, T, 1.6); blit(f);
    lamp(f, 16, 1040, 700, 2.2); glow(c, 760, 300, 260, "#ffc46a", 0.12);
    treeMemories(f, 96, 44, 300, 1.2);
    wind(c, T, 1.2); leaves(c, T, 1.3);
  },
  S21: (f) => {
    const { c, T, u } = f, sc = lerp(0, 30, u), ch = LINES[5].chars; groundClose(f, sc);
    hopscotch(c, T, sc, 1, [ch[2], ch[3], ch[4]]);
    const r = rng(210); for (let i = 0; i < 26; i++) { const x = r() * W, y = r() * 600 - sc, s = 5 + r() * 5; c.fillStyle = "#fffaf0"; c.fillRect(x, y, s * 2, s); c.fillStyle = "#dcd8ea"; c.fillRect(x, y + s - 2, s * 2, 2); }
    dapples(c, T, 0.5, -80, -40, W + 80, H + 40);
    for (let i = 0; i < 12; i++) { const rr = rng(100 + i); glow(c, rr() * W + Math.sin(T * 1.7 + i) * 12, rr() * H, 26 + rr() * 20, "#ffe0a0", 0.22); }
  },
  S22: (f) => {
    const { c, T, lt } = f; groundClose(f, 30 + lt * 20); hopscotch(c, T, 30 + lt * 20, 0.6, [0, 0, 0]); dapples(c, T, 0.5, -80, -40, W + 80, H + 40);
    for (const m of LINEUP) {
      const fr = memberFrame(m, f), sil = silhouette(fr.img, ...fr.r, fr.key), x = 640 + (m.x - 640) * 1.05, s = 2.6 * (m.s ?? 1) * (m.who === "benyu" ? 0.9 : 1);
      c.save(); c.globalAlpha = 0.6; c.translate(x, 770); c.transform(1, 0, (x - 640) / 900 + Math.sin(T * 2 + m.x) * 0.05, 1.3, 0, 0);
      c.imageSmoothingEnabled = false; c.drawImage(sil, (-sil.width * s) / 2, -sil.height * s, sil.width * s, sil.height * s); c.restore();
    }
    // 照片绳的影子也落在地上
    c.save(); c.fillStyle = "rgba(6,8,26,0.42)"; for (let i = 0; i < 9; i++) { c.save(); c.translate(90 + i * 138, 250 + Math.sin(i * 1.7) * 14); c.rotate(Math.sin(T * 2.4 + i) * 0.16); c.fillRect(-2, -80, 4, 80); c.fillRect(-30, 0, 60, 58); c.restore(); } c.restore();
  },
  S23: (f) => {
    const { c, T } = f; skyLayer(f, { oy: 10, moon: "none", city: 80 }); tree(f.lr, 40, 62, 1.0, T, 0.8); blit(f);
    lampP(f, 15, 1000, 610, 1.05, 0.62); lamp(f, 16, 1190, 650, 1.6);
    dapples(c, T, 0.32, 0, 600, W, 730);
    drawCast(f, 652, 1.9, 1, 0.03, true); castProps(f, 652, 1.9, 1); fireflies(c, T);
  },
  S24: (f) => {
    const { c, T, u } = f, oy = lerp(0, -22, ease(u)), gy = -oy * 1.6;
    skyLayer(f, { oy, moon: T > 24.9 ? "full" : "none", mx: 238, my: lerp(70, 40, sstep(24.9, 26.15, T)), mr: 16, city: 100 });
    tree(f.lr, 36, 70 - oy * 0.4, 0.95, T, 1.2); blit(f);
    if (T > 24.9) glow(c, 238 * 4, (lerp(70, 40, sstep(24.9, 26.15, T)) - oy) * 4, 220, "#fff1c8", 0.2 * sstep(24.9, 25.6, T));
    // 十九个泡泡像灯一样往天上飘
    for (let i = 0; i < 19; i++) { const a = sstep(23.85 + i * 0.05, 24.3 + i * 0.05, T); mvBubble(c, f.A, i, 150 + i * 40 + Math.sin(T * 1.1 + i) * 8, 330 - (i % 3) * 62 - (T - 23.8) * 20 + gy * 0.5, 23, T + i, a * 0.95); }
    c.save(); const z = lerp(1.06, 0.94, ease(u)); c.translate(640, 520); c.scale(z, z); c.translate(-640, -520);
    for (let i = 0; i < 17; i++) lampP(f, i, 290 + i * 38, 588 + gy, 0.72, 0.36);
    house(f, 1130, 600 + gy, 3, true);
    dapples(c, T, 0.3, 0, 610 + gy, W, 740 + gy);
    drawCast(f, 668 + gy, 1.4, 0.82, 0.07, true);
    c.restore(); fireflies(c, T);
  },
  S25: (f) => {
    const { c, T } = f, k = sstep(26.15, 27.8, T), my = lerp(122, 58, k);
    skyLayer(f, { pal: PAL_MOON, oy: -10, moon: "full", mx: 160, my, mr: 26, city: 0 }); blit(f);
    const mY = (my + 10) * 4; glow(c, 640, mY, 440, "#fff1c8", 0.18 * k + 0.06); glow(c, 640, mY, 170, "#fff8e0", 0.12 * k);
    // 三十格月相一格格亮起来，围住中间这轮满月：第三十天
    moonDial(c, 640, mY, 160, 8.5, lerp(0, 30, sstep(26.3, 28.0, T)), 1, 0.14);
    // 十七张拍立得、十九个泡泡，都往月亮那边飘
    lanterns(c, f.A, T, 26.4, 1);
    for (const m of LINEUP) {
      const x = 640 + (m.x - 640) * 0.78, y = 712 - (m.fly ?? 0) * 0.5;
      if (m.who === "whale") sprite(c, f.A.wLookup, x, 712, 1.25);
      else if (m.who === "benyu") sprite(c, f.A.benyu, x, y + Math.sin(T * 2.4) * 4, 1.05);
      else actor(c, f.A, m.who, m.who === "gpt" ? "float" : "idle", T, x, y, 1.1 * (m.s ?? 1));
    }
    text(c, "满月", 640, 486, 92, { alpha: sstep(26.9, 27.4, T), glow: "rgba(255,236,190,0.9)", blur: 30, color: "#fffaf0" });
    text(c, "第三十天 · 十一月二十三日", 640, 546, 30, { alpha: sstep(27.3, 27.8, T), color: "#f3c86b", glow: "rgba(0,0,0,0.6)", blur: 8 });
    text(c, "十月二十四日 至 十一月二十三日", 640, 576, 20, { alpha: 0.85 * sstep(27.9, 28.4, T), color: "#dfe3ff" });
    text(c, "谢谢每一盏路灯", 640, 600, 22, { alpha: 0.9 * sstep(28.5, 29.0, T), color: "#fff3d6", glow: "rgba(255,200,120,0.7)", blur: 12 });
  },
};

// 山茶枝本体（花、枝、名签）；泡泡另画
function branchDraw(f: F, ox: number, oy: number, k: number) {
  const { c, T } = f;
  c.save(); c.translate(ox, oy); c.scale(k, k);
  c.lineCap = "round"; c.strokeStyle = "#3b2a2a"; c.lineWidth = 16;
  c.beginPath(); c.moveTo(-200, 660); for (let x = -200; x <= 2500; x += 40) c.lineTo(x, 620 - x * 0.2 + Math.sin(x / 260) * 26); c.stroke();
  c.strokeStyle = "#5c4136"; c.lineWidth = 4; c.beginPath(); for (let x = -200; x <= 2500; x += 40) c.lineTo(x, 614 - x * 0.2 + Math.sin(x / 260) * 26); c.stroke();
  c.strokeStyle = "#3b2a2a"; c.lineWidth = 6;
  NODES.forEach((n) => { c.beginPath(); c.moveTo(n.bx, n.by); c.lineTo(n.x, n.y); c.stroke(); });
  NODES.forEach((n, i) => {
    const t = BLOOM_AT[i], img = T < t - 0.18 ? f.A.cBud : T < t ? f.A.cHalf : f.A.cBloom, pop = T >= t ? backOut((T - t) / 0.3) : 1;
    if (T >= t) glow(c, n.x, n.y - 30, 70, MV_COL[i], 0.26 * (1 - clamp((T - t) / 0.6)) + 0.06);
    sprite(c, img, n.x, n.y, 2.6 * (0.85 + 0.15 * pop));
    const m = MVS[i]; tag(c, n.x, n.y + 18, `《${m.title}》`, dateName(m.date), sstep(t + 0.08, t + 0.3, T), 1.05);
  });
  c.restore();
}

// 每个镜头画什么（分镜.md 与页面上的逐词分镜都读这一份）
export const PLANS: Record<string, string> = {
  P0: "片头：没有月亮的夜空，歌名与满月篇字卡淡入；下方一条旧胶片横着走，十七格就是第零天到第十六天",
  S01: "远景：十七盏路灯都还暗着，每盏灯臂上挂一张还没显影的拍立得；只有本鲸家的窗亮着，窗边一页日历：十月二十四日，第零天",
  S02: "仰拍夜空：月亮的位置只有一圈虚线；三十格月相绕着它一格格浮出来，一格一天，中间写着它会来的日子：十一月二十三日",
  S03: "中景窗台：本鲸摇头、低头；墙上钉着第零天到第八天的九张拍立得；窗台上猫钟、冒热气的饭盆、山茶花苞；右边的日历从第零天一路撕到第二十九天",
  S04: "仰拍第一盏路灯：路字点亮第零天（日历上第一个勾），灯字点亮第一天（名牌换成大肥鱼），灯下的拍立得跟着显影",
  S05: "横移跟拍：本鲸沿街往家走，第二天到第七天的路灯一盏接一盏亮，照片一张张显影；第五天那盏亮起后，身后多了一只小鲸鱼",
  S06: "全景街道：照字一闪，第八天到第十天同时亮起，十七张拍立得在光柱里轻轻晃",
  S07: "摇到家门口：第十一天到第十六天亮完，最后一盏的光落在窗台上；窗台上回来了第十三天的白饭和第十四天的两只沙漏",
  S08: "窗台特写：路灯的光扫过窗台上排着的饭盆、沙漏、放大镜、手机，扫到哪样哪样亮；墙上第十四、十五天的照片被照亮；本鲸指向花盆",
  S09: "大特写：白山茶花苞在暗处发白光；白、色、的三拍各浮出一样白色的东西：白米饭、笨鱼的那张纸、白龙娘",
  S10: "一整枝山茶：每个花苞挂一支番外MV的名字与日期，按出片顺序开；每开一朵，花心里升起一个回忆泡泡，泡泡里是那支MV的母题",
  S11: "双人镜：本鲸捧着山茶，身边一朵半开的花慢慢张开；枝上继续开花冒泡，刚开的那一支放大停在画面中间",
  S12: "满枝盛开：十九朵花托着十九个泡泡排成一道拱，最后一朵是这一支，十一月二十三日；花瓣飘起，间奏里泡泡升向夜空变成星",
  S13: "远景：街尽头的天边只有一线淡青，天还没亮；天上那圈月相三十格都亮了，中间还差一轮；十七盏路灯和照片都亮着，本鲸在窗口望着",
  S14: "特写：纸风车一动不动，窗框上的风铃也不响，短签上写着满月；窗台上靠着第二十九天的日历页；墙上是鲸鲸来的那天和笨鱼回来的那天",
  S15: "窗口：本鲸缩了缩肩，又点点头；路灯的光照着墙上第十三到十六天的照片；窗台上的白饭还冒着热气，日历停在第二十九天",
  S16: "街道：晚风吹过，一整条照片绳开始晃；小克带着茶杯走来，笨鱼顺着风飘进画面，各带一张登场日期签",
  S17: "街道：豆包提着篮子蹦进来，龙娘托着沙漏飘进来；照片绳晃得更开",
  S18: "一阵大风：千问的扇子、Kimi 的卷轴、Gemini 的画笔、智谱的算盘跟着人一起被吹进来；三十天的日历页满天飞",
  S19: "近景：笨鱼飘进本鲸怀里，本鲸抱住它；身后浮出笨鱼这条线的六张照片：鲸鲸、笨鲸、去看同类、鲸落、回来了、没躲；日历页从上一镜吹过来",
  S20: "仰拍大树：风吹树冠，叶子翻动；树上挂着十七张拍立得，被风吹得一齐斜过去",
  S21: "俯拍地面：路灯下一地斑驳树影和落花；地上是粉笔画的跳房子，从零写到三十，那、一、地三拍各亮一行，最后一格是个圆",
  S22: "地面：九个人的影子混进树影和跳房子的格子里，照片绳的影子也在晃",
  S23: "中景：九个人站在树下一起轻轻摇，头顶各浮着自己的招牌道具：算盘、卷轴、扇子、篮子、饭盆、茶杯、画笔、沙漏",
  S24: "大全景：树、窗台、十七盏路灯和九个人一起摇摆；十九个回忆泡泡像灯一样往天上飘，镜头后拉上摇，月亮探出来",
  S25: "尾声：月亮终于来了；三十格月相一格格点亮，围住中间的满月，第三十天；十七张拍立得和十九个泡泡在两侧往月亮飘，大家抬头",
};
