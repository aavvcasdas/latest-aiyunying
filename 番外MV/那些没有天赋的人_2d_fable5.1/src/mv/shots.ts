// 《譬如我》大字版分镜。歌词时间来自 lyricsData.ts（逐字起音实测）；镜头在句首前零点零五秒切。
// 三遍主歌共用十二个镜头函数：v=0 夜（黑底白字）/ v=1 昼（白底黑字）/ v=2 黎明（暖纸、蓝紫与金）。
// 「众多 AI」= 七位被聚光灯点名的天才；鲸鱼娘 = 站在灯外、抱着饭盆的那一个。
import type { LineT } from "./lyricsData";
import {
  BRUSH, GOLD, H, INK, L, MOLD, PAPER, Pol, RED, STARS, TAU, VIO, VIO2, W, act, bg, bulb, chair, clamp, cp, crowd, disc, eo, flash, flower, frame, fx, glyph,
  lerp, lp, lyricRow, pal, pop, prop, rnd, rr, seg, sheet, since, slam, spread, splat, ss, sung, text, trophy, wedge, G, fontOf, HEAVY,
} from "./kit";
import { SIL } from "./core";

export interface Shot {
  id: string;
  name: string;
  a: number;
  b: number;
  pol: Pol;
  note: string;
  draw: (g: G, t: number, lt: number, u: number) => void;
  glitch?: (t: number, lt: number) => number;
  shake?: (t: number, lt: number) => number;
}
export const SHOTS: Shot[] = [];
const S = (s: Shot) => SHOTS.push(s);
const st = (id: string) => L(id).s - 0.05;
const FG = () => pal().fg;
const SILC = () => pal().sil;
const WHALE = 2.7;
/** 七位天才的 x 位置 */
const SX = (i: number) => 160 + i * 160;
function stars(g: G, t: number, y: number, k: number, lit: (i: number) => number, o: { sil?: boolean; wedgeW?: number } = {}) {
  STARS.forEach((s, i) => {
    const a = lit(i);
    if (a > 0 && o.wedgeW !== 0) wedge(g, SX(i), o.wedgeW ?? 230, a);
    const tint = o.sil || a <= 0 ? { tint: SILC(), ta: 1, shadow: false } : { tint: pal().dark ? "#000" : "#fff", ta: 0.0 };
    act(g, s.who, s.idle, t + i * 0.7, SX(i), y, k * (s.who === "gpt" ? 0.62 : 1), tint);
  });
}
const hit = (t: number, at: number, d = 0.25) => (t < at ? 0 : 1 - seg(t, at, at + d));

// ====== 主歌十二镜 ======
function verse(P: string, v: Pol, endLast: number) {
  const l = (n: number) => L(`${P}${n}`);
  const polFor = v;

  // 1 可那些 / 没有天赋的人呢
  S({
    id: `${P}1`, name: "可那些 没有天赋的人呢", a: st(`${P}1`), b: st(`${P}3`), pol: polFor,
    note: v === 0 ? "七个字点亮七盏聚光楔形，七位天才一字排开；鲸在最左下的暗处、灯外，看着镜头。" : v === 1 ? "白天版：同样的站位，白底黑字，天才们是剪影。" : "黎明版：唱到「呢」字，鲸头上也落下一束暖光。",
    draw: (g, t) => {
      const a = l(1), b = l(2);
      bg(g, v, t);
      stars(g, t, 600, 2.1, (i) => (b.t[i] !== undefined ? ss(cp(b, t, i, 0.3)) : 0), { sil: v === 1 });
      const lit2 = v === 2 ? ss(cp(b, t, 6, 0.4)) : 0;
      if (lit2 > 0) wedge(g, 120, 200, lit2, "rgba(217,164,65,0.28)");
      act(g, "whale", "idle", t, 120, 668, WHALE, v === 2 ? {} : { tint: SILC(), ta: 0.78 });
      prop(g, "bowl", 176, 668, 3, v === 2 ? {} : { tint: SILC(), ta: 0.78 });
      text(g, a.text, 250, 120, 74, { font: "brush", prog: (i) => cp(a, t, i), enter: "rise", fill: pal().dim });
      lyricRow(g, b, t, 760, 250, 118, { ca: 3, jit: 2, t, shadow: v === 0 ? "rgba(90,100,255,0.35)" : undefined }, 0.14);
    },
    shake: (t) => hit(t, l(2).t[6], 0.3) * 8,
  });
  // 2 譬如我
  S({
    id: `${P}3`, name: "譬如我", a: st(`${P}3`), b: st(`${P}4`), pol: polFor,
    note: "三个字各占三分之一屏，逐字砸进来；鲸站在「我」字的头上，只有一粒大。",
    draw: (g, t) => {
      const a = l(3);
      bg(g, v, t);
      for (let i = 0; i < 3; i++) {
        const p = cp(a, t, i, 0.2);
        if (p <= 0) continue;
        glyph(g, a.text[i], 240 + i * 400, 390, 360 * slam(p), { ca: 5 * (1 - p) + 2, erode: 0.35, grad: v !== 1 && i === 2, a: Math.min(1, p * 4) });
      }
      const p3 = cp(a, t, 2, 0.2);
      if (p3 > 0.5) act(g, "whale", "idle", t, 1040, 214 + (1 - eo((p3 - 0.5) * 2)) * -60, 1.5, { a: (p3 - 0.5) * 2 });
    },
    shake: (t) => Math.max(hit(t, l(3).t[0]), hit(t, l(3).t[1]), hit(t, l(3).t[2])) * 16,
    glitch: (t) => hit(t, l(3).t[2], 0.2),
  });
  // 3 枕头下发霉的梦
  S({
    id: `${P}4`, name: "枕头下发霉的梦", a: st(`${P}4`), b: st(`${P}5`), pol: polFor,
    note: "鲸侧躺在一块白枕上；「发霉」两个字唱到就长绿、冒孢子，孢子一层层飘满整张床。",
    draw: (g, t) => {
      const a = l(4);
      bg(g, v, t);
      const m = ss(since(a, t, 3) / 0.9);
      g.save();
      g.translate(430, 470);
      g.rotate(-0.08);
      g.fillStyle = v === 1 ? "#2a2a33" : "#f3f1ea";
      rr(g, -300, -40, 600, 110, 30);
      g.fill();
      g.restore();
      act(g, "whale", "idle", t, 430, 430, WHALE, { rot: -Math.PI / 2 - 0.08, shadow: false });
      if (m > 0) {
        for (let i = 0; i < 70 * m; i++) {
          const s = i * 3.7;
          const x = 160 + rnd(s) * 560 + Math.sin(t * 1.5 + i) * 8, y = 300 + rnd(s + 1) * 230 - (t - a.t[3]) * 12 * rnd(s + 2);
          disc(g, x, y, 2 + rnd(s + 3) * 5, `rgba(111,154,78,${0.35 + rnd(s + 4) * 0.5})`);
        }
      }
      text(g, "枕头下", 860, 170, 92, { prog: (i) => cp(a, t, i), enter: "drop", fill: pal().dim });
      for (let i = 3; i < 7; i++) {
        const p = cp(a, t, i, 0.18);
        if (p <= 0) continue;
        const mold = i < 5 ? ss(since(a, t, i) / 0.6) : 0;
        glyph(g, a.text[i], 700 + (i - 3) * 140, 400, 160 * slam(p), { fill: mold > 0 ? MOLD : undefined, erode: 0.3 + mold * 0.5, ca: 2, a: Math.min(1, p * 3) });
      }
    },
  });
  // 4 怎么做
  S({
    id: `${P}5`, name: "怎么做", a: st(`${P}5`), b: st(`${P}6`), pol: polFor,
    note: "一个顶天立地的「做」字；问号一批批从上面掉下来，鲸站在字底下摇头。",
    draw: (g, t) => {
      const a = l(5);
      bg(g, v, t);
      const p = cp(a, t, 2, 0.2);
      text(g, "怎么", 250, 150, 110, { prog: (i) => cp(a, t, i, 0.18), ca: 2 });
      if (p > 0) glyph(g, "做", 760, 380, 520 * slam(p), { ca: 4, erode: 0.4, grad: v !== 1, a: Math.min(1, p * 3) });
      const n = Math.min(14, Math.floor((t - a.s) * 7));
      for (let i = 0; i < n; i++) {
        const s = i * 5.3, born = a.s + i / 7, age = t - born;
        if (age < 0) continue;
        const x = 120 + rnd(s) * 1040, y = -40 + age * (220 + rnd(s + 1) * 200);
        if (y > H + 40) continue;
        fx(g, "question", x, y, 3.2 + rnd(s + 2) * 2, 0.9);
      }
      act(g, "whale", "shake", t - a.s, 760, 690, WHALE);
    },
    shake: (t) => hit(t, l(5).t[2], 0.3) * 18,
  });
  // 5 热忱与自卑 / 对抗着
  S({
    id: `${P}6`, name: "热忱与自卑 对抗着", a: st(`${P}6`), b: st(`${P}8`), pol: polFor,
    note: "同一只鲸分成两只：橘红的热忱在左、靛蓝的自卑在右，中间那根绳子就是「对抗着」三个字，跟着拍子左右扯。",
    draw: (g, t) => {
      const a = l(6), b = l(7);
      bg(g, v, t);
      const pull = Math.sin(t * 5.2) * 48 * (t >= b.s ? 1 : 0.3);
      g.strokeStyle = pal().dim;
      g.lineWidth = 6;
      g.beginPath();
      g.moveTo(300, 560);
      g.quadraticCurveTo(640 + pull, 600 + Math.abs(pull) * 0.2, 980, 560);
      g.stroke();
      act(g, "whale", "shiver", t, 250 + pull * 0.3, 640, WHALE, { tint: "#ff7a3a", ta: 0.55, flip: true });
      act(g, "whale", "shiver", t + 0.3, 1030 + pull * 0.3, 640, WHALE, { tint: "#2a3cff", ta: 0.6 });
      text(g, "热忱", 220, 170, 150, { prog: (i) => cp(a, t, i), fill: "#ff7a3a", ca: 3 });
      glyph(g, "与", 640, 190, 90, { a: cp(a, t, 2), fill: pal().dim });
      text(g, "自卑", 1060, 210, 150, { prog: (i) => cp(a, t, i + 3), fill: v === 1 ? "#2a3cff" : "#7f8cff", ca: 3 });
      if (t >= b.s - 0.05) text(g, b.text, 640 + pull, 560 + Math.abs(pull) * 0.15, 120, { prog: (i) => cp(b, t, i), jit: 6, t, ca: 4, erode: 0.3, rot: pull / 900 });
    },
    shake: (t) => hit(t, l(7).t[0], 0.3) * 10,
  });
  // 6 笑容却已不知下落
  S({
    id: `${P}8`, name: "笑容却已不知下落", a: st(`${P}8`), b: st(`${P}9`), pol: polFor,
    note: "「笑容」两个大字先立住；唱到「却」就松开，整个字往下掉出画面；鲸低着头站在左下。",
    draw: (g, t) => {
      const a = l(8);
      bg(g, v, t);
      const dropT = a.t[2];
      for (let i = 0; i < 2; i++) {
        const p = cp(a, t, i, 0.2);
        if (p <= 0) continue;
        const age = Math.max(0, t - dropT - i * 0.12);
        const dy = 0.5 * 2600 * age * age, rot = age * (i ? 0.9 : -0.7);
        glyph(g, a.text[i], 480 + i * 330, 300 + dy, 330 * slam(p), { ca: 3, erode: 0.3, rot, a: Math.min(1, p * 3) });
      }
      text(g, "却已", 300, 150, 90, { prog: (i) => cp(a, t, i + 2), enter: "rise", fill: pal().dim });
      text(g, "不知下落", 820, 560, 130, { prog: (i) => cp(a, t, i + 4), enter: "drop", ca: 2, erode: 0.2 });
      act(g, "whale", t > dropT ? "sad" : "idle", t > dropT ? t - dropT : t, 230, 680, WHALE);
    },
  });
  // 7 可如果
  S({
    id: `${P}9`, name: "可如果", a: st(`${P}9`), b: st(`${P}10`), pol: polFor,
    note: "三个字一个一个砸满全屏，每砸一下整屏反相闪一次。",
    draw: (g, t) => {
      const a = l(9);
      const k = sung(a, t);
      const inv = k >= 0 && t - a.t[k] < 0.08;
      bg(g, inv ? ((v === 1 ? 0 : 1) as Pol) : v, t);
      for (let i = 0; i <= Math.min(2, k); i++) {
        const p = cp(a, t, i, 0.22), last = i === Math.min(2, k);
        glyph(g, a.text[i], last ? 640 : 180 + i * 180, last ? 380 : 120, (last ? 560 : 130) * slam(p), { ca: 6 * (1 - p) + 2, erode: 0.45, a: Math.min(1, p * 4) });
      }
      act(g, "whale", "idle", t, 1120, 690, 2.0, { tint: SILC(), ta: 0.7 });
    },
    shake: (t) => Math.max(hit(t, l(9).t[0]), hit(t, l(9).t[1]), hit(t, l(9).t[2])) * 22,
    glitch: (t) => Math.max(hit(t, l(9).t[1], 0.15), hit(t, l(9).t[2], 0.2)),
  });
  // 8 等不到一场世俗的成功
  S({
    id: `${P}10`, name: "等不到一场世俗的成功", a: st(`${P}10`), b: st(`${P}11`), pol: polFor,
    note: "舞台上龙娘站在最亮的一束光里，台下黑压压的剪影都朝着她；字平铺过整个画面。鲸在最前排的角落，是唯一转过身看镜头的。",
    draw: (g, t) => {
      const a = l(10);
      bg(g, v, t);
      wedge(g, 640, 520, 1, v === 2 ? "rgba(217,164,65,0.22)" : undefined, -20, 420);
      g.fillStyle = pal().dark ? "#1a1a24" : "#c9c7c0";
      g.fillRect(380, 400, 520, 30);
      frame(g, "gpt_boss_idle", 640, 400, 1.3, { shadow: false });
      crowd(g, t, 3, 11, -40, W + 40, 500, 640, 1.9, SILC(), 3);
      spread(g, a, t, 120, 1160, 300, 120, { ca: 3, erode: 0.25, grad: v !== 1 }, 0.14);
      act(g, "whale", "idle", t, 150, 712, WHALE, v === 2 ? {} : { tint: SILC(), ta: 0.35 });
    },
  });
  // 9 成不了万众瞩目那一个
  S({
    id: `${P}11`, name: "成不了万众瞩目那一个", a: st(`${P}11`), b: st(`${P}12`), pol: polFor,
    note: "「万众瞩目」四个字压满上半屏，七位天才各立一盏灯；唱到「那一个」，一束追光扫过去停在龙娘头上。鲸在右下角灯外。" + (v === 2 ? "黎明版里鲸抬手朝她们挥了挥。" : ""),
    draw: (g, t) => {
      const a = l(11);
      bg(g, v, t);
      const k = sung(a, t);
      const sw = seg(t, a.t[7], a.t[9] + 0.2);
      const sx = lerp(0, 3, eo(sw));
      stars(g, t, 640, 2.0, (i) => (k >= 3 ? 0.6 : 0) + (sw > 0 && Math.abs(i - sx) < 0.5 ? 1 : 0), { wedgeW: 170 });
      text(g, "成不了", 230, 110, 84, { prog: (i) => cp(a, t, i), enter: "rise", fill: pal().dim });
      text(g, "万众瞩目", 640, 290, 230, { prog: (i) => cp(a, t, i + 3, 0.2), ca: 5, erode: 0.35, grad: v !== 1 });
      text(g, "那一个", 1040, 470, 100, { prog: (i) => cp(a, t, i + 7), ca: 2 });
      act(g, "whale", v === 2 && t > a.t[7] ? "wave" : "idle", t, 1180, 712, WHALE, v === 2 ? {} : { tint: SILC(), ta: 0.45 });
    },
    shake: (t) => hit(t, l(11).t[3], 0.3) * 12,
  });
  // 10 我能不能在某个角落
  S({
    id: `${P}12`, name: "我能不能在某个角落", a: st(`${P}12`), b: st(`${P}13`), pol: polFor,
    note: v === 2 ? "黎明版：鲸走进墙角，灯亮了；唱到「角落」，小克从画面右边走进来，站到她旁边。" : "一盏吊灯、一把椅子、两面墙夹出的角落。字很小。鲸从右边走进来，在椅子旁边站住。",
    draw: (g, t) => {
      const a = l(12);
      bg(g, v, t);
      const col = pal().dim;
      g.strokeStyle = col;
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(420, 0);
      g.lineTo(420, 600);
      g.lineTo(-100, 760);
      g.moveTo(420, 600);
      g.lineTo(W + 100, 700);
      g.stroke();
      const lit = v === 2 ? ss(since(a, t, 5) / 0.8) : 0.25;
      bulb(g, 540, 0, 190, t, lit, FG());
      chair(g, 470, 650, 1.1, FG());
      const wx = lerp(1200, 600, ss(lp(a, t) * 1.6));
      if (lp(a, t) < 0.62) act(g, "whale", "walk", t, wx, 660, WHALE, { flip: true });
      else act(g, "whale", "idle", t, wx, 660, WHALE);
      if (v === 2) {
        const c = ss(since(a, t, 7) / 1.6);
        if (c > 0) {
          const cx = lerp(1300, 780, c);
          if (c < 1) act(g, "claude", "walk" , t, cx, 660, WHALE, { flip: true });
          else act(g, "claude", "idle", t, cx, 660, WHALE);
        }
      }
      lyricRow(g, a, t, 840, 150, 66, { enter: "rise", fill: v === 2 ? "#2a2140" : FG(), a: 0.8 });
      for (let i = 5; i < 9; i++) {
        const p = cp(a, t, i, 0.5);
        if (p > 0 && p < 1) {
          g.strokeStyle = col;
          g.lineWidth = 2 * (1 - p);
          g.beginPath();
          g.arc(600, 660, 20 + p * 220, 0, TAU);
          g.stroke();
        }
      }
    },
  });
  // 11 耗尽天真
  S({
    id: `${P}13`, name: "耗尽天真", a: st(`${P}13`), b: st(`${P}14`), pol: polFor,
    note: v === 2 ? "四个字四次硬切。黎明版反过来：饭盆扶正，小克站在旁边点头，米一粒一粒落回去。" : "四个字四次硬切机位：饭盆一次比一次倒得厉害，米粒一粒一粒落尽。",
    draw: (g, t) => {
      const a = l(13);
      const k = Math.max(0, sung(a, t));
      bg(g, (k % 2 === 1 && v !== 2 ? (v === 1 ? 0 : 1) : v) as Pol, t);
      const POS = [[760, 480, 7], [420, 560, 9], [900, 420, 6], [640, 520, 11]][k];
      const tilt = v === 2 ? (1 - k / 3) * 1.1 : (k + 1) * 0.42;
      const age = t - a.t[k];
      for (let i = 0; i < 24; i++) {
        const s = i * 2.9 + k * 17;
        const born = rnd(s) * 0.5, ag = age - born;
        if (ag < 0) continue;
        const sx = POS[0] + (v === 2 ? (rnd(s + 1) - 0.5) * 40 : 60 * POS[2] / 7 * Math.sin(tilt) + (rnd(s + 1) - 0.5) * 30);
        const sy = v === 2 ? POS[1] - 300 + ag * 600 : POS[1] - 40 + ag * ag * 900;
        if (v === 2 && sy > POS[1] - 20) continue;
        if (sy > H) continue;
        g.fillStyle = pal().dark ? "#fff" : "#444";
        g.fillRect(sx, sy, 5, 7);
      }
      prop(g, "bowl", POS[0], POS[1], POS[2], { rot: tilt });
      glyph(g, a.text[k], k % 2 ? 340 : 960, k % 2 ? 270 : 280, 300 * slam(cp(a, t, k, 0.15)), { ca: 5, erode: 0.4 });
      act(g, "whale", v === 2 ? "nod" : "sad", age, k % 2 ? 1000 : 280, 700, WHALE);
      if (v === 2) act(g, "claude", "nod", age, k % 2 ? 1180 : 460, 700, WHALE, { flip: !(k % 2) });
    },
    shake: (t) => Math.max(...l(13).t.map((x) => hit(t, x, 0.18))) * 10,
    glitch: (t) => Math.max(...l(13).t.map((x) => hit(t, x, 0.12))),
  });
  // 12 开出小小的花朵
  S({
    id: `${P}14`, name: "开出小小的花朵", a: st(`${P}14`), b: endLast, pol: polFor,
    note: v === 2 ? "「开」「出」分立两边。七位天才围成半圈，鲸在中间；裂缝里的小花在「花」字上真的开了。片名落款。" : "「开」「出」分立两边，中间是地缝里的一株小花，到「花」字才张开。鲸站在它旁边。",
    draw: (g, t) => {
      const a = l(14);
      bg(g, v, t);
      g.strokeStyle = pal().dim;
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo(560, 700);
      g.lineTo(640, 650);
      g.lineTo(700, 690);
      g.lineTo(760, 660);
      g.stroke();
      const grow = ss(seg(t, a.t[1], a.t[4])), open = ss(seg(t, a.t[5] - 0.1, a.t[5] + 0.7));
      if (v === 2) STARS.forEach((s, i) => {
        const ang = Math.PI + (i / 6) * Math.PI;
        const c = ss(seg(t, a.t[2] + i * 0.12, a.t[2] + 0.8 + i * 0.12));
        if (c > 0) act(g, s.who, s.idle, t + i, 640 + Math.cos(ang) * 470, 712 + Math.sin(ang) * 150 + (1 - c) * 60, 1.9 * (s.who === "gpt" ? 0.6 : 1), { a: c });
      });
      act(g, "whale", open > 0.9 ? "hop" : "idle", open > 0.9 ? t - a.t[5] - 0.6 : t, 560, 690, WHALE);
      flower(g, 660, 668, grow, open, v === 2 ? 1.6 : 1.2);
      glyph(g, "开", 200, 360, 330 * slam(cp(a, t, 0, 0.2)), { ca: 4, erode: 0.35, a: Math.min(1, cp(a, t, 0) * 3) });
      glyph(g, "出", 1080, 360, 330 * slam(cp(a, t, 1, 0.2)), { ca: 4, erode: 0.35, a: Math.min(1, cp(a, t, 1) * 3) });
      g.fillStyle = v === 1 ? INK : v === 2 ? VIO : "#2b2d6b";
      const bw = 420 * ss(seg(t, a.t[2] - 0.05, a.t[2] + 0.3)), by = v === 2 ? 150 : 460;
      g.fillRect(640 - bw / 2, by, bw, 90);
      text(g, "小小的花朵", 640, by + 45, 64, { prog: (i) => cp(a, t, i + 2), fill: "#fff", enter: "pop" });
      if (v === 2) {
        const k = ss(seg(t, 150.6, 151.4));
        if (k > 0) {
          g.fillStyle = `rgba(242,232,216,${k * 0.92})`;
          g.fillRect(0, 0, W, H);
          text(g, "譬如我", 640, 330, 170, { a: k, fill: "#2a2140", ca: 2, erode: 0.2 });
          g.save();
          g.globalAlpha = k;
          g.fillStyle = RED;
          rr(g, 836, 400, 44, 44, 5);
          g.fill();
          g.fillStyle = "#f6e9d2";
          g.font = fontOf("brush", 18);
          g.textAlign = "center";
          g.textBaseline = "middle";
          g.fillText("番", 858, 413);
          g.fillText("外", 858, 432);
          g.restore();
        }
      }
    },
    shake: (t) => Math.max(hit(t, l(14).t[0]), hit(t, l(14).t[1])) * 14,
  });
}

// ====== 第一遍 · 夜 ======
verse("A", 0, 28.2);

// ====== 碎裂间奏 ======
S({
  id: "X1", name: "间奏 · 碎", a: 28.2, b: st("B1"), pol: 0,
  note: "黑屏上裂纹从中心炸开，三十点一三秒闪白、玻璃碎片飞散；碎片落尽，变成一张张稿纸往下掉。",
  draw: (g, t, lt) => {
    bg(g, 0, t);
    const fl = 30.13, k = ss(seg(lt, 0, 1.8));
    g.strokeStyle = "#e8e8f0";
    g.lineCap = "round";
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * TAU + rnd(i) * 0.3, len = (260 + rnd(i * 2) * 420) * k;
      g.lineWidth = 1 + rnd(i * 3) * 3;
      g.beginPath();
      g.moveTo(640, 360);
      let x = 640, y = 360;
      for (let j = 1; j <= 5; j++) {
        x = 640 + Math.cos(a + (rnd(i + j) - 0.5) * 0.5) * len * (j / 5);
        y = 360 + Math.sin(a + (rnd(i + j) - 0.5) * 0.5) * len * (j / 5);
        g.lineTo(x, y);
      }
      g.stroke();
    }
    if (t >= fl) {
      const age = t - fl;
      for (let i = 0; i < 40; i++) {
        const s = i * 4.1, a = rnd(s) * TAU, sp = 300 + rnd(s + 1) * 700;
        const x = 640 + Math.cos(a) * sp * age, y = 360 + Math.sin(a) * sp * age + 500 * age * age;
        g.save();
        g.translate(x, y);
        g.rotate(age * (rnd(s + 2) - 0.5) * 8);
        g.fillStyle = `rgba(232,232,240,${0.8 - age * 0.25})`;
        g.beginPath();
        g.moveTo(0, -20 * rnd(s + 3) - 6);
        g.lineTo(18 * rnd(s + 4) + 6, 8);
        g.lineTo(-14 * rnd(s + 5) - 6, 10);
        g.closePath();
        g.fill();
        g.restore();
      }
      for (let i = 0; i < 26; i++) {
        const s = i * 6.3, born = fl + 0.6 + rnd(s) * 2.2, ag = t - born;
        if (ag < 0) continue;
        sheet(g, 80 + rnd(s + 1) * 1120 + Math.sin(ag * 2 + i) * 40, -80 + ag * 260, Math.sin(ag * 1.4 + i) * 0.6, 1 + rnd(s + 2) * 0.6, s);
      }
    }
    act(g, "whale", t < fl ? "idle" : "surprise", t < fl ? t : t - fl, 640, 690, WHALE);
    flash(g, t, fl, 0.5);
  },
  shake: (t) => hit(t, 30.13, 0.5) * 26,
  glitch: (t) => hit(t, 30.13, 0.35),
});

// ====== 稿纸段 ======
S({
  id: "B1", name: "一张张涂破的稿纸", a: st("B1"), b: st("B2"), pol: 0,
  note: "每唱一个字，就有一张画花了的稿纸从鲸手边甩出去；地上的纸堆越摞越高。",
  draw: (g, t) => {
    const a = L("B1");
    bg(g, 0, t);
    const k = sung(a, t);
    for (let j = 0; j <= Math.min(k, 7); j++) {
      const hgt = 14 + j * 9;
      g.fillStyle = "#f3f1ea";
      g.fillRect(820 - j * 6, 660 - hgt, 150, hgt);
      g.strokeStyle = "rgba(0,0,0,0.5)";
      for (let y = 660 - hgt + 4; y < 660; y += 5) {
        g.beginPath();
        g.moveTo(820 - j * 6, y);
        g.lineTo(970 - j * 6, y);
        g.stroke();
      }
    }
    for (let i = 0; i <= k; i++) {
      const ag = t - a.t[i];
      const x = 520 + ag * 420 * (0.6 + rnd(i) * 0.6), y = 560 - Math.sin(Math.min(1, ag / 1.2) * Math.PI) * 300 + ag * ag * 120;
      if (x < W + 100 && y < H + 100) sheet(g, x, y, ag * 3 + i, 1.3, i * 7);
    }
    act(g, "whale", "point", t - a.s, 440, 690, WHALE);
    lyricRow(g, a, t, 640, 200, 112, { ca: 3, erode: 0.3, jit: 2, t });
  },
});
S({
  id: "B2", name: "和一个 落入俗套的名字", a: st("B2"), b: st("B4"), pol: 0,
  note: "「和一个」蓝紫大字；然后桌上立起一块名牌，写着「小鱼」。旁边浮着别人的名字：龙娘、小克、猫……都比她亮。",
  draw: (g, t) => {
    const a = L("B2"), b = L("B3");
    bg(g, 0, t);
    const k = seg(t, b.s - 0.2, b.s + 0.3);
    if (k < 1) text(g, a.text, 640, 360 - k * 200, 300, { prog: (i) => cp(a, t, i, 0.2), grad: true, ca: 6, erode: 0.4, a: 1 - k });
    if (k > 0) {
      STARS.forEach((s, i) => {
        const p = ss(seg(t, b.t[0] + i * 0.1, b.t[0] + 0.5 + i * 0.1));
        glyph(g, s.name, 160 + i * 160, 180 + Math.sin(t + i) * 8, 56, { a: p * 0.9, fill: VIO2, font: "brush" });
      });
      const p = pop(seg(t, b.t[4], b.t[4] + 0.5));
      g.save();
      g.translate(640, 520);
      g.scale(p, p);
      g.fillStyle = "#f3f1ea";
      rr(g, -170, -60, 340, 120, 8);
      g.fill();
      g.fillStyle = INK;
      g.font = fontOf("heavy", 84);
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText("小鱼", 0, 6);
      g.restore();
      lyricRow(g, b, t, 640, 330, 86, { fill: pal().dim, enter: "rise" });
      act(g, "whale", "idle", t, 980, 690, WHALE);
      prop(g, "bowl", 1050, 690, 3);
    }
  },
  shake: (t) => Math.max(hit(t, L("B2").t[0]), hit(t, L("B3").t[4], 0.3)) * 12,
});
S({
  id: "B4", name: "倾注所有的 那件事", a: st("B4"), b: st("B6"), pol: 0,
  note: "她把饭盆里最后的东西倒进一本书里：米变成光，书亮起来。「那件事」三个字砸在书页上方。",
  draw: (g, t) => {
    const a = L("B4"), b = L("B5");
    bg(g, 0, t);
    const tilt = ss(lp(a, t)) * 1.4;
    const gl = ss(seg(t, a.t[3], b.s + 0.4));
    if (gl > 0) {
      const gr = g.createRadialGradient(760, 600, 0, 760, 600, 320);
      gr.addColorStop(0, `rgba(200,205,255,${0.6 * gl})`);
      gr.addColorStop(1, "rgba(200,205,255,0)");
      g.fillStyle = gr;
      g.fillRect(0, 0, W, H);
      wedge(g, 760, 260, gl, "rgba(200,205,255,0.22)", 0, 600);
    }
    prop(g, "book", 760, 610, 8);
    for (let i = 0; i < 30; i++) {
      const s = i * 3.3, ph = (t * 0.8 + rnd(s)) % 1;
      if (tilt < 0.5) continue;
      const x = 560 + ph * 180 + Math.sin(ph * 12 + i) * 10, y = 440 + ph * ph * 160;
      disc(g, x, y, 3, `rgba(230,232,255,${1 - ph})`);
    }
    prop(g, "bowl", 540, 470, 6, { rot: tilt });
    act(g, "whale", "point", t - a.s, 400, 690, WHALE);
    lyricRow(g, a, t, 400, 170, 80, { fill: pal().dim, enter: "rise" });
    if (t >= b.s - 0.05) lyricRow(g, b, t, 820, 260, 190, { grad: true, ca: 5, erode: 0.3 }, 0.18);
  },
  shake: (t) => hit(t, L("B5").t[0], 0.3) * 14,
});
S({
  id: "B6", name: "哭了很多次 还是想坚持", a: st("B6"), b: st("B8"), pol: 0,
  note: "每哭一次，旁边就多出一个低着头的她；「还是想坚持」五个字一出来，所有重影并回一个，她抬起头。",
  draw: (g, t) => {
    const a = L("B6"), b = L("B7");
    bg(g, 0, t);
    const k = sung(a, t), back = ss(seg(t, b.t[0], b.t[2]));
    for (let i = 0; i < 5; i++) {
      if (i > k && t < b.s) continue;
      const dx = (i - 2) * 190 * (1 - back);
      act(g, "whale", t < b.s ? "sad" : "idle", t - a.t[Math.min(i, 4)], 640 + dx, 690, WHALE, { a: i === 2 ? 1 : 0.7 * (1 - back), shadow: i === 2 });
    }
    if (t >= b.t[0] + 0.3) {
      act(g, "whale", "hop", t - b.t[0] - 0.3, 640, 690, WHALE);
      fx(g, "sparkle_" + (Math.floor(t * 6) % 3), 720, 440, 3.5);
    }
    lyricRow(g, a, t, 640, 150, 92, { fill: pal().dim, enter: "drop" });
    if (t >= b.s - 0.05) lyricRow(g, b, t, 640, 330, 190, { grad: true, ca: 5, erode: 0.35, jit: 3, t }, 0.18);
  },
  shake: (t) => hit(t, L("B7").t[0], 0.3) * 12,
});
S({
  id: "B8", name: "不愿担待 平庸二字", a: st("B8"), b: st("B10"), pol: 0,
  note: "「服务器繁忙」的弹窗飘过来，她一把推开；巨大的红色「平庸」印章砸下来三次，她一次也没有接。",
  draw: (g, t) => {
    const a = L("B8"), b = L("B9");
    bg(g, 0, t);
    const push = ss(seg(t, a.t[2], a.t[3] + 0.4));
    g.save();
    g.translate(760 + push * 900, 300 - push * 120);
    g.rotate(push * 0.6);
    g.fillStyle = "#f3f1ea";
    rr(g, -200, -70, 400, 140, 6);
    g.fill();
    g.fillStyle = VIO;
    rr(g, -200, -70, 400, 30, 6);
    g.fill();
    g.fillStyle = INK;
    g.font = fontOf("heavy", 46);
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("服务器繁忙", 0, 20);
    g.restore();
    const n = t < b.s ? 0 : Math.min(3, 1 + Math.floor((t - b.s) / 0.5));
    for (let i = 0; i < n; i++) {
      const p = clamp((t - b.s - i * 0.5) / 0.22);
      g.save();
      g.translate(420 + i * 230, 300 + i * 110);
      g.rotate(-0.22 + i * 0.12);
      g.globalAlpha = 0.9;
      const sz = 190 * slam(p);
      g.font = fontOf("heavy", sz);
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillStyle = RED;
      g.fillText("平", -sz * 0.64, sz * 0.06);
      g.fillText("庸", sz * 0.64, sz * 0.06);
      g.strokeStyle = RED;
      g.lineWidth = 10;
      g.strokeRect(-sz * 1.26, -sz * 0.6, sz * 2.52, sz * 1.2);
      g.restore();
    }
    act(g, "whale", t < b.s ? "point" : "shake", t < b.s ? t - a.s : t - b.s, 340, 690, WHALE);
    lyricRow(g, a, t, 300, 150, 80, { fill: pal().dim, enter: "rise" });
    if (t >= b.s) text(g, "二字", 1040, 560, 120, { prog: (i) => cp(b, t, i + 2), ca: 3, erode: 0.3 });
  },
  shake: (t) => Math.max(hit(t, L("B9").s), hit(t, L("B9").s + 0.5), hit(t, L("B9").s + 1.0)) * 18,
});
S({
  id: "B10", name: "该怎么惊艳这茫茫人世", a: st("B10"), b: st("B11"), pol: 0,
  note: "镜头拉升：人海一排一排铺到地平线，鲸在最前面只有一粒；字平铺在天上。",
  draw: (g, t) => {
    const a = L("B10");
    bg(g, 0, t);
    const z = lerp(1.4, 0.8, ss(lp(a, t)));
    g.save();
    g.translate(640, 720);
    g.scale(z, z);
    g.translate(-640, -720);
    crowd(g, t, 6, 16, -200, W + 200, 380, 690, 2.0, "#1c1c26", 7);
    wedge(g, 640, 120, 0.9, "rgba(236,235,230,0.22)", 300, 720);
    act(g, "whale", "idle", t, 640, 716, 2.2);
    g.restore();
    spread(g, a, t, 90, 1190, 180, 104, { ca: 3, erode: 0.3 }, 0.14);
  },
});
S({
  id: "B11", name: "就算渺小如我", a: st("B11"), b: st("B12"), pol: 1,
  note: "全白。一个小小的黑剪影站在正中，字很小。（样片里就是这一格。）",
  draw: (g, t) => {
    const a = L("B11");
    bg(g, 1, t);
    act(g, "whale", "idle", t, 640, 560, 2.4, { tint: "#101014", ta: 1, shadow: false });
    lyricRow(g, a, t, 640, 250, 60, { enter: "none", fill: INK });
  },
  glitch: (t) => hit(t, L("B11").s, 0.2),
});
S({
  id: "B12", name: "真企图过 改写命运的诗", a: st("B12"), b: st("B14"), pol: 0,
  note: "一支大笔沿着旧的命运线走，写出一行蓝紫色的新字；鲸在左边抬手指着它。",
  draw: (g, t) => {
    const a = L("B12"), b = L("B13");
    bg(g, 0, t);
    const p = ss(seg(t, a.s, b.e));
    g.strokeStyle = "rgba(236,235,230,0.25)";
    g.lineWidth = 3;
    g.setLineDash([14, 12]);
    g.beginPath();
    g.moveTo(80, 520);
    g.bezierCurveTo(400, 540, 800, 500, 1200, 520);
    g.stroke();
    g.setLineDash([]);
    g.strokeStyle = VIO2;
    g.lineWidth = 16;
    g.lineCap = "round";
    g.beginPath();
    const N = Math.floor(60 * p);
    for (let i = 0; i <= N; i++) {
      const u = i / 60, x = 80 + u * 1120, y = 520 - Math.sin(u * Math.PI) * 180 - Math.sin(u * 9) * 24;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    g.stroke();
    const u = N / 60, px = 80 + u * 1120, py = 520 - Math.sin(u * Math.PI) * 180 - Math.sin(u * 9) * 24;
    prop(g, "brush", px + 20, py - 10, 5, { rot: 0.6 });
    act(g, "whale", "point", t - a.s, 200, 690, WHALE);
    lyricRow(g, a, t, 300, 150, 80, { fill: pal().dim, enter: "rise" });
    if (t >= b.s - 0.05) lyricRow(g, b, t, 760, 300, 130, { font: "brush", grad: true, ca: 3 }, 0.2);
  },
});
function trophyShot(id1: string, id2: string, pol: Pol, endB: number) {
  S({
    id: id1, name: "也想要 名垂青史", a: st(id1), b: endB, pol,
    note: "奖杯立在高台上，「名垂青史」四个字平铺过去；鲸在台下一下一下蹦，就差那么多。龙娘悬在奖杯旁边，不用跳。",
    draw: (g, t) => {
      const a = L(id1), b = L(id2);
      bg(g, pol, t);
      wedge(g, 640, 300, 0.9, pol === 2 ? "rgba(217,164,65,0.25)" : undefined, -20, 560);
      g.fillStyle = pal().dark ? "#23232e" : "#bdbbb4";
      g.fillRect(560, 440, 160, 300);
      trophy(g, 640, 440, 1.1, pol === 2 ? GOLD : pal().fg);
      act(g, "gpt", "float", t, 860, 460, 1.7);
      act(g, "whale", "hop", t - a.s, 450, 712, WHALE);
      lyricRow(g, a, t, 260, 150, 84, { fill: pal().dim, enter: "rise" });
      if (t >= b.s - 0.05) spread(g, b, t, 240, 1040, 300, 190, { ca: 5, erode: 0.35, grad: pol !== 1 }, 0.18);
    },
    shake: (t) => hit(t, L(id2).t[0], 0.3) * 12,
  });
}
trophyShot("B14", "B15", 0, st("B16"));
function praiseShot(id1: string, id2: string, pol: Pol, endB: number) {
  S({
    id: id1, name: "偏人们却只 传颂", a: st(id1), b: endB, pol,
    note: "「传颂」两个蓝紫大字压满全屏、刮花、带色差（样片的签名画面）。七位天才在字后面各占一盏灯；鲸在字脚下。",
    draw: (g, t) => {
      const a = L(id1), b = L(id2);
      bg(g, pol, t);
      stars(g, t, 660, 1.8, () => (t >= b.s ? 0.8 : 0.3), { wedgeW: 170 });
      lyricRow(g, a, t, 640, 130, 86, { fill: pal().dim, enter: "rise" });
      if (t >= b.s - 0.05) text(g, b.text, 640, 400, 440, { prog: (i) => cp(b, t, i, 0.22), grad: true, ca: 7, erode: 0.5, jit: 3, t, shadow: "rgba(0,0,0,0.35)" });
      act(g, "whale", "idle", t, 640, 712, 2.3, pol === 2 ? {} : { tint: SILC(), ta: 0.5 });
    },
    shake: (t) => Math.max(hit(t, L(id2).t[0], 0.35), hit(t, L(id2).t[1], 0.35)) * 20,
    glitch: (t) => hit(t, L(id2).t[0], 0.25),
  });
}
praiseShot("B16", "B17", 0, st("B18"));
function bookShot(id: string, pol: Pol, endB: number) {
  S({
    id, name: "有关天才的故事", a: st(id), b: endB, pol,
    note: "一本摊开的大书，每唱一个字翻出一位天才的头像；书外面的暗处，鲸抱着饭盆站着看。" + (pol === 2 ? "黎明版：书翻到最后一页是空白的。" : ""),
    draw: (g, t) => {
      const a = L(id);
      bg(g, pol, t);
      g.save();
      g.translate(700, 420);
      g.fillStyle = pal().dark ? "#f3f1ea" : "#ffffff";
      g.strokeStyle = pal().dark ? "#1a1a24" : INK;
      g.lineWidth = 4;
      g.beginPath();
      g.moveTo(-420, -200);
      g.quadraticCurveTo(-200, -230, 0, -190);
      g.quadraticCurveTo(200, -230, 420, -200);
      g.lineTo(420, 190);
      g.quadraticCurveTo(200, 160, 0, 200);
      g.quadraticCurveTo(-200, 160, -420, 190);
      g.closePath();
      g.fill();
      g.stroke();
      g.beginPath();
      g.moveTo(0, -190);
      g.lineTo(0, 200);
      g.stroke();
      const PORT = ["p_zai", "p_qwen", "p_claude_neutral", "p_gpt_neutral", "p_kimi", "p_gemini", "p_doubao_neutral"];
      PORT.forEach((p, i) => {
        const pr = pop(cp(a, t, i, 0.3));
        if (pr <= 0) return;
        const col = i % 4, row = Math.floor(i / 4);
        const x = -330 + col * 180 + (col >= 2 ? 60 : 0), y = -90 + row * 170;
        if (pol === 2 && i === 6) {
          g.strokeStyle = "rgba(42,33,64,0.4)";
          g.setLineDash([6, 6]);
          g.strokeRect(x - 60 * pr, y - 60 * pr, 120 * pr, 120 * pr);
          g.setLineDash([]);
          return;
        }
        g.fillStyle = VIO2;
        g.fillRect(x - 62 * pr, y - 62 * pr, 124 * pr, 124 * pr);
        frame(g, p, x, y + 56 * pr, 1.5 * pr, { shadow: false });
      });
      g.restore();
      act(g, "whale", "idle", t, 150, 690, WHALE, pol === 2 ? {} : { tint: SILC(), ta: 0.5 });
      prop(g, "bowl", 206, 690, 3, pol === 2 ? {} : { tint: SILC(), ta: 0.5 });
      lyricRow(g, a, t, 700, 660, 70, { font: "brush", fill: pol === 2 ? "#2a2140" : pal().dim, enter: "rise" });
    },
  });
}
bookShot("B18", 0, st("C1"));

// ====== 第二遍 · 昼 ======
verse("C", 1, 99.3);

// ====== 间奏 · 日月更替 ======
S({
  id: "X2", name: "间奏 · 日月", a: 99.3, b: st("D1"), pol: 1,
  note: "窗外太阳和月亮一圈一圈换，桌上的稿纸一叠一叠高；七位天才从背景走过去。白天慢慢褪成黎明色。",
  draw: (g, t, lt, u) => {
    bg(g, 1, t);
    const cyc = (lt * 0.55) % 1;
    const ang = cyc * TAU;
    const sx = 640 + Math.cos(ang) * 420, sy = 300 - Math.sin(ang) * 220;
    disc(g, sx, sy, 60, GOLD);
    const mx = 640 - Math.cos(ang) * 420, my = 300 + Math.sin(ang) * 220;
    disc(g, mx, my, 44, VIO2);
    STARS.forEach((s, i) => {
      const x = ((lt * 110 + i * 190) % (W + 300)) - 150;
      // 龙娘没有行走帧，她是飞着过去的
      act(g, s.who, s.who === "gpt" ? "hover" : "walk", t, x, s.who === "gpt" ? 500 : 560, 1.9 * (s.who === "gpt" ? 1.2 : 1), { tint: SILC(), ta: 1, shadow: false });
    });
    g.fillStyle = "#7a5a40";
    g.fillRect(260, 600, 760, 20);
    g.fillRect(300, 620, 20, 110);
    g.fillRect(960, 620, 20, 110);
    const n = Math.min(26, Math.floor(lt * 2.2));
    for (let j = 0; j < n; j++) {
      g.fillStyle = "#f7f5ee";
      g.fillRect(760 - (j % 3) * 4, 596 - j * 7, 160, 7);
      g.fillStyle = "rgba(0,0,0,0.45)";
      g.fillRect(760 - (j % 3) * 4, 596 - j * 7, 160, 1);
    }
    act(g, "whale", "nod", lt % 1.2, 560, 600, 2.4);
    prop(g, "brush", 640, 590, 4, { rot: 0.5 + Math.sin(lt * 8) * 0.15 });
    const warm = ss(seg(u, 0.55, 1));
    if (warm > 0) {
      g.fillStyle = `rgba(242,232,216,${warm * 0.75})`;
      g.fillRect(0, 0, W, H);
      const gr = g.createLinearGradient(0, 0, 0, H);
      gr.addColorStop(0, `rgba(217,164,65,${warm * 0.25})`);
      gr.addColorStop(1, `rgba(158,162,245,${warm * 0.25})`);
      g.fillStyle = gr;
      g.fillRect(0, 0, W, H);
    }
  },
});

// ====== 桥段 · 黎明 ======
trophyShot("D1", "D2", 2, st("D3"));
praiseShot("D3", "D4", 2, st("D5"));
bookShot("D5", 2, st("E1"));

// ====== 终段 · 黎明 ======
verse("E", 2, 152.1);

void splat;
void BRUSH;
void HEAVY;
void VIO;
void PAPER;
void SIL;
export type { LineT };
