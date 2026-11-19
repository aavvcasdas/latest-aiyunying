import { lineOf, type CamFn, type Ctx, type Shot } from "./engine";
import { smileY } from "./setsA";
import { easeIn, easeInOut, easeOut, lerp } from "./tex";

type Cam = (c: CamFn, u: number, d: number, x: Ctx) => void;
const P = (u: number, d: number) => u / Math.max(d, 1e-6);

// 每种场景的镜头：v 为第几遍（0 夜 / 1 昼 / 2 黎明），换方向、换机位
const CAMS: Record<string, (v?: number) => Cam> = {
  stage: (v) => (c, u, d) => { const t = easeInOut(P(u, d)), m = v === 1 ? -1 : 1; c(m * lerp(0, 0.6, t), lerp(2.4, 1.9, t) + (v === 2 ? 0.5 : 0), lerp(11, 8.2, t), 0, 2.2, -3, lerp(42, 38, t), m * lerp(0.03, 0, t)); },
  bed0: (v) => (c, u, d) => { const t = easeOut(P(u, d)), m = v === 1 ? -1 : 1; c(m * lerp(0.5, 0.2, t) + (v === 1 ? 5.5 : 0), lerp(6.5, 3.2, t), lerp(4, 3.5, t), 0.4, 0.8, -1, 40, m * 0.05); },
  bed1: (v) => (c, u, d) => { const t = easeInOut(P(u, d)); if (v === 1) c(lerp(1.5, -2.5, t), lerp(3.2, 2.2, t), lerp(2.8, 2.6, t), -1.9, 1.9, -1.1, 40); else c(lerp(-3.5, 0.5, t), lerp(1.4, 2.6, t), lerp(3.2, 2.4, t), -1.5, 1.8, -1, 40, v === 2 ? -0.06 : 0); },
  qmaze: (v) => (c, u, d) => { const t = easeOut(P(u, d)), m = v === 1 ? -1 : 1; c(m * lerp(6, -2, t), lerp(2.2, 1.6, t), lerp(6, 7, t), 0, 1.2, 0, 42, m * lerp(0.2, -0.1, t)); },
  tug: (v) => (c, u, d) => { const t = P(u, d), a = (v === 1 ? 1 : -1) * lerp(-0.5, 0.5, t); c(Math.sin(a) * 9, lerp(1.8, 1.5, t), Math.cos(a) * lerp(9, 6.5, easeIn(t)), 0, 1.2, 0, lerp(40, 36, t), Math.sin(u * 7) * 0.012); },
  smile: () => (c, u, d, x) => { const L = lineOf(x.p.lineId); const ys = smileY(x.T, L); const t = P(u, d); const cy = Math.min(2.2, ys + 0.9); c(Math.sin(u * 0.8) * 0.5, cy, lerp(8, 7, t), 0, Math.min(1.4, ys), 0.7, lerp(40, 46, t), Math.sin(u * 2) * 0.02 + (ys < 1 ? 0.06 : 0)); },
  beam: (v) => (c, u, d) => { const t = easeIn(P(u, d)), m = v === 1 ? -1 : 1; c(m * 0.3, lerp(1.4, 1.5, t), lerp(9, 5.5, t), 0, 1.3, 0, lerp(40, 34, t)); },
  podium: (v) => (c, u, d) => { const t = easeInOut(P(u, d)), m = v === 1 ? -1 : 1; c(m * lerp(-6, 2, t), lerp(2.4, 3, t), lerp(9, 8, t), 0, 2, -6, lerp(40, 36, easeIn(P(u, d)))); },
  crowd: (v) => (c, u, d) => { const t = easeInOut(P(u, d)), m = v === 1 ? -1 : 1; c(m * lerp(-0.8, 0.8, t), lerp(1.3, 1.6, t), lerp(10, 8, t), 0, 3.2, -14, 40, m * lerp(0.02, -0.02, t)); },
  corner: (v) => (c, u, d) => { const t = easeInOut(P(u, d)); const a = (v === 1 ? -1 : 1) * lerp(0.35, -0.2, t); c(-2.5 + Math.sin(a) * 7.5, lerp(2.2, 1.9, t), -2.5 + Math.cos(a) * 7.5, -2.8, 1.3, -3, 40); },
  bowl: (v) => (c, u, _d, x) => { const ts: number[] = x.p.cuts; let i = 0; ts.forEach((t, k) => { if (x.T >= t) i = k; }); const S = [[2.5, 1.8, 7.5], [-1.5, 1.2, 6], [3.5, 3.0, 6.5], [0.8, 1.0, 5]]; const q = S[(i + (v ?? 0)) % 4]; c(q[0], q[1], q[2] - u * 0.1, 0.8, 1.1, 0.4, 38, [0.04, -0.05, 0.06, 0][i % 4]); },
  flower: (v) => (c, u, d) => { const t = easeInOut(P(u, d)); if (v === 2) c(lerp(-1.5, -2.3, t), lerp(1.7, 3.4, t), lerp(4.4, 6.9, t), -2.5, lerp(1.45, 1.25, t), -3.2, 40); else c(lerp(-0.5, -2.6, t), lerp(1.2, 1.8, t), lerp(3.5, 1.4, t), -2.9, lerp(1.1, 1.6, t), -3.3, 40); },
  shatter: () => (c, u, d) => { const t = P(u, d); if (u < 1.83) c(0, lerp(2, 6.5, easeIn(u / 1.83)), lerp(6, 10, easeIn(u / 1.83)), 0, 0.6, 0, 40, Math.sin(u * 9) * 0.01 * u); else c(Math.sin(u * 0.4) * 2, lerp(1.8, 2.4, t), lerp(6, 7.5, t), 0, 1.2, 0, 40); },
  desk0: () => (c, u, d) => { const t = easeInOut(P(u, d)); c(lerp(-5, 3, t), lerp(2.6, 2.2, t), lerp(7, 6, t), 0, 1.8, -1.5, 40); },
  desk1: () => (c, u, d) => { const t = easeOut(P(u, d)); c(lerp(-3, -1.5, t), lerp(2.4, 2.0, t), lerp(3.5, 3.0, t), -1.5, 1.6, -1.2, 35); },
  desk2: () => (c, u, d) => { const t = easeOut(P(u, d)); c(lerp(0.4, 0.2, t), lerp(2.6, 2.0, t), lerp(2.8, 2.0, t), 0.1, 1.4, -0.4, 38); },
  pour: () => (c, u, d, x) => { const t = P(u, d); if (x.T > 42.85) c(lerp(3.2, 1.6, easeOut((x.T - 42.85) / 0.4)), 1.4, 4.4, 0.8, 0.5, 1.2, 38); else c(lerp(4.6, 3.4, t), lerp(1.8, 1.4, t), lerp(5.8, 4.6, t), 0.9, 1.0, 0.9, 40); },
  ghost0: () => (c, u, d) => { const t = easeInOut(P(u, d)); c(0, lerp(2, 1.4, t), lerp(8, 6.5, t), 0, 1.2, 0, 40); },
  ghost1: () => (c, u, d) => { const t = easeOut(P(u, d)); c(0, lerp(1.0, 2.4, t), lerp(7, 9, t), 0, 1.4, 0, lerp(38, 46, t)); },
  stamp: () => (c, u, d) => { const t = easeInOut(P(u, d)); c(lerp(-1, 0, t), lerp(3.5, 3.0, t), lerp(8, 6.5, t), 0, 1, 0, 40); },
  vast: () => (c, u, d) => { const t = easeIn(P(u, d)); c(0, lerp(1.4, 16, t), lerp(9.5, 22, t), 0, lerp(1.5, 2, t), lerp(-10, -20, t), lerp(40, 46, t)); },
  tiny: () => (c, u, d) => { const t = easeIn(P(u, d)); c(0, lerp(2.5, 22, t), lerp(7, 18, t), 0, 0, -2, lerp(40, 50, t)); },
  poem: () => (c, u, d) => { const t = easeInOut(P(u, d)); c(lerp(-3, 4, t), lerp(7.5, 6.5, t), lerp(8, 6, t), lerp(-5, 5, t), 0, -1.3, 40); },
  trophy: () => (c, u, d, x) => { const t = easeInOut(P(u, d)); const a = lerp(-0.8, 0.3, t); const low = x.T > lineOf(x.p.l2).s; c(1 + Math.sin(a) * 9, low ? lerp(2.2, 0.8, easeOut((x.T - lineOf(x.p.l2).s) / 0.5)) : 2.2, -1 + Math.cos(a) * 9, 2, low ? 2.4 : 1.6, -1.5, 40); },
  dolly: () => (c, u, d) => { const t = easeInOut(P(u, d)); c(0, lerp(1.8, 3.4, t), lerp(6.5, 12, t), 0, 1.5, -6, 40); },
  story: () => (c, u, d) => { const t = P(u, d); const a = lerp(-0.5, 0.6, t); c(Math.sin(a) * 8, lerp(2.4, 3.2, t), -4 + Math.cos(a) * 8, 0, 1.8, -4, 40, Math.sin(u * 0.9) * 0.02); },
  lapse0: () => (c, u, d) => { const t = easeInOut(P(u, d)); c(lerp(-6, -1, t), lerp(3, 2.4, t), lerp(8, 6, t), 0, 1.8, -1.5, 40); },
  lapse1: () => (c, u, d) => { const t = easeInOut(P(u, d)); c(lerp(0, 0.6, t), 2.25, lerp(3.2, 2.6, t), 0.6, 1.5, -1, 38); },
  lapse2: () => (c, u, d) => { const t = easeInOut(P(u, d)); c(lerp(5, -5, t), 3, 5, 0, 1.8, -1.5, 42); },
};
void easeOut;

const vTimes: Record<string, number[]> = {
  A: [0, 3.15, 4.05, 6.55, 8.05, 10.15, 12.9, 13.95, 17.25, 20.95, 24.35, 25.15, 28.3],
  C: [71.0, 74.75, 75.85, 77.95, 78.95, 80.95, 83.95, 85.45, 88.85, 91.95, 95.0, 95.95, 99.3],
  E: [123.0, 126.75, 127.95, 129.95, 130.95, 133.45, 135.95, 137.25, 140.95, 144.0, 147.0, 147.95, 152.1],
};
const PALN: Record<string, "night" | "day" | "dawn"> = { A: "night", C: "day", E: "dawn" };

function verse(sec: "A" | "C" | "E"): Shot[] {
  const v = sec === "A" ? 0 : sec === "C" ? 1 : 2; const t = vTimes[sec]; const id = (n: number) => sec + n; const pal = PALN[sec];
  const mk = (i: number, set: string, p: any, cam: Cam): Shot => ({ s: t[i], e: t[i + 1], set, pal, p, cam });
  const A13 = lineOf(id(13));
  return [
    mk(0, "stage", { lineId: id(2) }, CAMS.stage(v)),
    mk(1, "bed", { lineId: id(3) }, CAMS.bed0(v)),
    mk(2, "bed", { lineId: id(4), mold: true }, CAMS.bed1(v)),
    mk(3, "qmaze", { lineId: id(5) }, CAMS.qmaze(v)),
    mk(4, "tug", { lineId: id(6) }, CAMS.tug(v)),
    mk(5, "smile", { lineId: id(8) }, CAMS.smile()),
    mk(6, "beam", { lineId: id(9), act: v === 2 ? "hop" : "nod" }, CAMS.beam(v)),
    mk(7, "podium", { lineId: id(10) }, CAMS.podium(v)),
    mk(8, "crowd", { lineId: id(11) }, CAMS.crowd(v)),
    // 终段：七位从「我能不能在某个角落」的第一个字开始往墙角走；「开出小小的花朵」七个字各递一粒米；「朵」落下后她鞠一躬
    mk(9, "corner", { lineId: id(12), ripIdx: [5, 6, 7, 8], gatherAt: sec === "E" ? t[9] : undefined }, CAMS.corner(v)),
    mk(10, "bowl", { lineId: id(13), tilt: [A13.s, A13.e - 0.05], cuts: A13.t }, CAMS.bowl(v)),
    mk(11, "corner", { lineId: id(14), flower: true, gatherAt: sec === "E" ? t[9] : undefined, grains: sec === "E" ? id(14) : undefined, bowAt: sec === "E" ? lineOf(id(14)).t[6] + 0.4 : undefined, act: "idle" }, CAMS.flower(v)),
  ];
}

export function buildShots(): Shot[] {
  const S: Shot[] = [];
  S.push(...verse("A"));
  S.push({ s: 28.3, e: 34.0, set: "shatter", pal: "night", cam: CAMS.shatter() });
  // ── 段落 B：稿纸、饭盆、平庸、诗、奖杯 ──
  S.push({ s: 34.0, e: 36.55, set: "desk", pal: "night", p: { lineId: "B1" }, cam: CAMS.desk0() });
  S.push({ s: 36.55, e: 38.15, set: "desk", pal: "night", p: { lineId: "B1" }, cam: CAMS.desk1() });
  S.push({ s: 38.15, e: 40.35, set: "desk", pal: "night", p: { lineId: "B3", plate: true }, cam: CAMS.desk2() });
  S.push({ s: 40.35, e: 43.65, set: "bowl", pal: "night", p: { lineId: "B4", tilt: [40.5, 42.6], book: true, act: "eat", cuts: [0] }, cam: CAMS.pour() });
  S.push({ s: 43.65, e: 45.35, set: "ghost", pal: "night", p: {}, cam: CAMS.ghost0() });
  S.push({ s: 45.35, e: 47.15, set: "ghost", pal: "night", p: {}, cam: CAMS.ghost1() });
  S.push({ s: 47.15, e: 50.35, set: "stamp", pal: "night", p: {}, cam: CAMS.stamp() });
  S.push({ s: 50.35, e: 53.55, set: "crowd", pal: "night", p: { lineId: "B10", vast: true }, cam: CAMS.vast() });
  S.push({ s: 53.55, e: 55.15, set: "tiny", pal: "day", p: {}, cam: CAMS.tiny() });
  S.push({ s: 55.15, e: 59.0, set: "poem", pal: "night", p: {}, cam: CAMS.poem() });
  S.push({ s: 59.0, e: 62.35, set: "trophy", pal: "night", p: { l1: "B14", l2: "B15" }, cam: CAMS.trophy() });
  S.push({ s: 62.35, e: 65.1, set: "stage", pal: "night", p: { lineId: "B16", allLit: true, whaleAct: "sad" }, cam: CAMS.dolly() });
  S.push({ s: 65.1, e: 71.0, set: "stage", pal: "night", p: { lineId: "B17", allLit: true, book: true, cheer: true }, cam: CAMS.story() });
  // ── 第二遍主歌（白昼）──
  S.push(...verse("C"));
  // ── 间奏：日月更替，稿纸越堆越高 ──
  S.push({ s: 99.3, e: 103.4, set: "desk", pal: "night", p: { lapse: 99.3 }, cam: CAMS.lapse0() });
  S.push({ s: 103.4, e: 107.5, set: "desk", pal: "night", p: { lapse: 99.3 }, cam: CAMS.lapse1() });
  S.push({ s: 107.5, e: 112.0, set: "desk", pal: "dawn", p: { lapse: 99.3 }, cam: CAMS.lapse2() });
  S.push({ s: 112.0, e: 114.05, set: "trophy", pal: "dawn", p: { l1: "D1", l2: "D2" }, cam: CAMS.trophy() });
  S.push({ s: 114.05, e: 117.0, set: "stage", pal: "dawn", p: { lineId: "D3", allLit: true, whaleAct: "sad" }, cam: CAMS.dolly() });
  S.push({ s: 117.0, e: 123.0, set: "stage", pal: "dawn", p: { lineId: "D4", allLit: true, book: true, cheer: true }, cam: CAMS.story() });
  // ── 终段主歌（黎明）──
  S.push(...verse("E"));
  for (let i = 0; i < S.length; i++) if (i && Math.abs(S[i].s - S[i - 1].e) > 1e-6) throw new Error(`镜头不连续 ${S[i - 1].e} → ${S[i].s}`);
  return S;
}
