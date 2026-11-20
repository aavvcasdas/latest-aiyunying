import { lineOf, type CamFn, type CardPos, type Ctx, type Shot } from "./engine";
import { easeIn, easeInOut, easeOut, lerp, seg } from "./tex";

type Cam = (c: CamFn, u: number, d: number, x: Ctx) => void;
const P = (u: number, d: number) => u / Math.max(d, 1e-6);
const V3 = (a: number[], b: number[], t: number) => a.map((v, i) => lerp(v, b[i], t)) as [number, number, number];

const CAMS: Record<string, Cam> = {
  open: (c, u, d) => { const t = easeInOut(P(u, d)); c(lerp(3, 1, t), lerp(2.0, 2.5, t), lerp(3.2, 4.8, t), -8, 6, 80, 42); },
  promenade: (c, u, d) => { const t = easeInOut(P(u, d)); c(lerp(-10, -3, t), 1.7, -1.4, lerp(-7, 0, t), 1.3, 4.5, 44); },
  arrive: (c, _u, _d, x) => { const wx = lerp(-15, -4.5, easeInOut(seg(x.T, 12.2, 18.2))); c(wx + 2.4, 1.6, -0.7, wx + 0.3, 1.1, 3.2, 42); },
  cafeIntro: (c, u, d) => { const t = easeInOut(P(u, d)); c(lerp(-0.6, -1.4, t), lerp(2.2, 1.7, t), lerp(4.4, 2.4, t), -2.0, 1.4, -5.2, 42); },
  coffee: (c, u, d) => { const t = easeOut(P(u, d)); c(-2, lerp(4.2, 1.9, t), lerp(2.2, 0.6, t), -2, lerp(3.7, 1.25, t), -5, 42); },
  sip: (c, u, d, x) => { const t = easeInOut(P(u, d)); if (x.p.v) c(lerp(-2.0, -2.6, t), 1.55, lerp(-0.6, -1.1, t), -3.4, 1.1, -4.6, 40); else c(lerp(1.6, 1.0, t), 1.6, lerp(-0.2, -0.7, t), -1.9, 1.1, -4.6, 40); },
  lip: (c, u, d, x) => { const ox = x.p.v ? 0.67 : 0; const t = easeInOut(seg(u, 0, Math.min(d, 2.4))); const b = easeInOut(seg(u, 2.4, d)); c(lerp(-3.45, -3.25, t) + ox - b * 0.3, lerp(1.2, 1.32, t) + b * 0.35, lerp(-3.48, -3.1, t) + b * 2.2, -3.7 + ox + b * 0.25, lerp(1.08, 1.15, t) + b * 0.1, -4.1 - b * 0.4, lerp(24, 30, t) + b * 10); },
  floristW: (c, u, d) => { const t = easeInOut(P(u, d)); c(lerp(5.2, 5.8, t), 1.9, -0.3, 5.6, 1.15, -5.4, 40); },
  floristM: (c, u, d) => { const t = easeOut(P(u, d)); c(5.33, lerp(1.95, 1.8, t), lerp(-5.0, -5.08, t), 5.33, 1.0, -5.42, 32); },
  card: (c, u, d) => { const t = easeOut(P(u, d)); c(-3.44, lerp(1.82, 1.7, t), lerp(-3.4, -3.48, t), -3.45, 0.97, -3.84, 32); },
  balloon: (c, u, d, x) => { const L = lineOf(x.p.lineId); const t = P(u, d); const up = easeIn(seg(x.T, L.t[4], L.e + 0.4)); c(lerp(0.2, 0.8, t), 1.8, -1.9, lerp(2.0, 0.6, up), lerp(1.7, 3.6, up), lerp(3.0, 1.8, up), 42); },
  sky: (c, u, d) => { const t = P(u, d); const a = [-1.6, 5.6, -1.2], b = [-3.0, 6.6, -2.6], e = [-4.1, 1.7, -4.8]; const l = t < 0.55 ? V3(a, b, easeOut(t / 0.55)) : V3(b, e, easeInOut((t - 0.55) / 0.45)); c(-0.4, lerp(0.5, 1.0, t), 0.9, l[0], l[1], l[2], 50); },
  chase: (c, u, d) => { const t = easeInOut(P(u, d)); c(lerp(-1.4, -6.0, t), 1.55, 0.2, lerp(-2.6, -7.0, t), 1.15, -3.9, 40); },
  gift: (c, u, d) => { const t = easeInOut(P(u, d)); c(lerp(-7.4, -8.0, t), 1.9, 0.3, -8.6, 1.0, -5.3, 40); },
  leaf: (c, u, d) => { const t = easeInOut(P(u, d)); c(lerp(-4.0, -4.4, t), lerp(1.0, 1.2, t), lerp(0.6, 0.2, t), -5.5, lerp(2.0, 1.5, t), -3.6, 44); },
  date: (c, u, d) => { const t = easeInOut(P(u, d)); c(lerp(5.4, 6.2, t), 2.3, lerp(-1.0, -0.4, t), 6.1, 1.0, 4.4, 42); },
  mess: (c, u, _d) => { c(6.6, 2.0, -0.6, 6.0, 1.0, 4.4, 40, Math.sin(u * 7) * 0.012); },
  world: (c, u, d) => { const t = easeInOut(P(u, d)); const p = V3([6.4, 1.9, 0.4], [2.5, 8, -2.5], t), l = V3([6.4, 1.4, 5.2], [-12, 5, 60], t); c(p[0], p[1], p[2], l[0], l[1], l[2], lerp(40, 46, t)); },
  parapet: (c, u, d) => { const t = easeInOut(P(u, d)); c(6.4, 1.7, lerp(0.0, 0.9, t), 6.4, 1.5, 6, 40); },
  sweet: (c, u, d) => { const t = easeInOut(P(u, d)); c(lerp(4.6, 5.4, t), 1.9, 0.2, 6.4, 1.4, 5.4, 40); },
  eyes: (c, _u, _d, x) => { const L = lineOf(x.p.lineId); const q = easeInOut(seg(x.T, L.t[6] - 0.2, L.t[6] + 1.6)); const p = V3([6.4, 1.6, 0.4], [7.0, 1.55, 2.9], q), l = V3([6.4, 1.5, 5.5], [7.0, 1.45, 5.2], q); c(p[0], p[1], p[2], l[0], l[1], l[2], lerp(40, 30, q)); },
  yes: (c, u, d) => { const t = easeInOut(P(u, d)); c(6.4, 1.5, lerp(0.9, 0.2, t), 6.6, 1.9, 5.4, 42); },
  dusk: (c, u, d) => { const t = easeInOut(P(u, d)); c(lerp(-9, -1, t), 3.0, -1.4, lerp(-6, 2, t), 1.0, 8, 46); },
  prep: (c, u, d) => { const t = easeInOut(P(u, d)); c(lerp(-2.5, 2.5, t), 1.9, -4.2, 0, 2.4, 2.5, 50); },
  kimi: (c, u, d) => { const up = easeIn(seg(u, d - 2.6, d)); c(-5.4, 1.6, 0.9, -6.4, lerp(1.2, 9, up), lerp(4.9, 12, up), 42); },
  latte: (c, u, d) => { const t = easeOut(P(u, d)); c(5.78, lerp(1.7, 1.5, t), lerp(5.3, 5.1, t), 5.78, 1.13, 4.86, 30); },
  final: (c, _u, _d, x) => { const L = lineOf(x.p.lineId); const T = x.T; const a = easeInOut(seg(T, L.s, L.t[6])); const q = easeInOut(seg(T, L.t[6] - 0.2, L.t[6] + 1.8)); const p = V3(V3([6.4, 1.7, -0.2], [6.4, 1.6, 1.2], a), [7.0, 1.55, 2.9], q), l = V3([6.6, 1.6, 5.4], [7.0, 1.45, 5.2], q); c(p[0], p[1], p[2], l[0], l[1], l[2], lerp(lerp(40, 36, a), 30, q)); },
  finale: (c, u, d) => { const t = easeInOut(P(u, d)); c(6.6, 2.1, lerp(-0.6, -1.4, t), 6.8, 2.0, 5.4, 46); },
  rise: (c, u, d) => { const t = seg(u, 0, d); const e = easeInOut(t); c(lerp(6.4, 5.4, e), lerp(3.2, 13, e), lerp(-1.2, 4.5, e), 7.0 - t * 2, lerp(6, 17, e), lerp(9, 16, e), 44); },
  diary: (c, u, d) => { const t = easeInOut(P(u, d)); c(lerp(-5.2, 2.4, t), 1.9, 8.6, lerp(-5.2, 2.4, t), 1.55, 0, 44); },
  perfume: (c, u, d) => { const t = easeInOut(P(u, d)); c(lerp(2.6, 1.8, t), 1.1, lerp(7.2, 6.0, t), 1.6, 0.7, 0, 42); },
  bottle: (c, u, d) => { const a = lerp(-0.45, 0.35, easeInOut(P(u, d))); c(1.4 + Math.sin(a) * 6.0, 0.2, -0.5 + Math.cos(a) * 6.0, 0.9, -0.9, -0.5, 40); },
  swirl: (c, u, d) => { const t = easeIn(P(u, d)); c(1.4 + Math.sin(u * 0.8) * 0.5, lerp(2.6, 5.6, t), lerp(6.0, 0.6, t), 1.4, -0.8, -0.5, lerp(40, 58, t)); },
};

const mk = (s: number, e: number, set: string, pal: Shot["pal"], cam: string, p: any = {}, cp: CardPos = "bottom"): Shot => ({ s, e, set, pal, cam: CAMS[cam], p: { scene: p.scene ?? cam, ...p, _s: s }, cp });

// 主歌：A（晨）/ C（夜）。同样的机位，第二遍让小克往前走一步
function verse(sec: "A" | "C"): Shot[] {
  const v = sec === "A" ? 0 : 1; const pal = v ? "night" : "morning"; const L = (n: number) => lineOf(sec + n); const id = (n: number) => sec + n;
  const t = (n: number) => L(n).s; const nxt = (n: number) => (n < 11 ? L(n + 1).s : sec === "A" ? 65.69 : 150.77);
  const fsplit = L(4).t[3] + 0.4; const lsplit = L(8).t[7] - 0.15;
  return [
    mk(t(1), t(2), "street", pal, "coffee", { lineId: id(1), v }, "top"),
    mk(t(2), t(3), "street", pal, "sip", { lineId: id(2), v }, "top"),
    mk(t(3), t(4), "street", pal, "lip", { lineId: id(3), v }, "bottom"),
    ...(v
      ? [mk(t(4), t(5), "street", pal, "card", { lineId: id(4), v }, "top")]
      : [mk(t(4), fsplit, "street", pal, "floristW", { lineId: id(4), v, scene: "florist" }, "top"), mk(fsplit, t(5), "street", pal, "floristM", { lineId: id(4), v, scene: "florist" }, "top")]),
    mk(t(5), t(6), "street", pal, "balloon", { lineId: id(5), v }, "bottom"),
    mk(t(6), t(7), "street", pal, "sky", { lineId: id(6), v }, "bottom"),
    mk(t(7), t(8), "street", pal, "chase", { lineId: id(7), v }, "top"),
    mk(t(8), lsplit, "street", pal, "gift", { lineId: id(8), v }, "top"),
    mk(lsplit, t(9), "street", pal, "leaf", { lineId: id(8), v }, "right"),
    mk(t(9), t(10), "street", pal, "date", { lineId: id(9), v }, "top"),
    mk(t(10), t(11), "street", pal, "mess", { lineId: id(10), v }, "top"),
    mk(t(11), nxt(11), "street", pal, "world", { lineId: id(11), v }, "top"),
  ];
}
// 副歌：B（黄昏，两个人）/ D（夜，大家都在）
function chorus(sec: "B" | "D", end: number): Shot[] {
  const v = sec === "B" ? 0 : 1; const pal = v ? "night" : "sunset"; const L = (n: number) => lineOf(sec + n); const id = (n: number) => sec + n;
  return [
    mk(L(1).s, L(2).s, "street", pal, "parapet", { lineId: id(1), v }, "top"),
    mk(L(2).s, L(3).s, "street", pal, "sweet", { lineId: id(2), v }, "top"),
    mk(L(3).s, L(4).s, "street", pal, "eyes", { lineId: id(3), v }, "left"),
    mk(L(4).s, end, "street", pal, "yes", { lineId: id(4), v }, "top"),
  ];
}

export function buildShots(): Shot[] {
  const S: Shot[] = [];
  const A1 = lineOf("A1").s, C1 = lineOf("C1").s;
  S.push(mk(0, 6.2, "street", "morning", "open", {}, "none"));
  S.push(mk(6.2, 12.2, "street", "morning", "promenade", {}, "none"));
  S.push(mk(12.2, 18.5, "street", "morning", "arrive", {}, "none"));
  S.push(mk(18.5, A1, "street", "morning", "cafeIntro", {}, "none"));
  S.push(...verse("A"));
  S.push(...chorus("B", 88.0));
  S.push(mk(88.0, 95.0, "street", "night", "dusk", {}, "none"));
  S.push(mk(95.0, 102.5, "street", "night", "prep", {}, "none"));
  S.push(mk(102.5, C1, "street", "night", "kimi", {}, "none"));
  S.push(...verse("C"));
  S.push(...chorus("D", lineOf("E1").s));
  const E = (n: number) => lineOf("E" + n);
  S.push(mk(E(1).s, E(2).s, "dream", "dream", "diary", { lineId: "E1" }, "bottom"));
  S.push(mk(E(2).s, E(3).s, "dream", "dream", "perfume", { lineId: "E2" }, "top"));
  S.push(mk(E(3).s, E(4).s, "dream", "dream", "bottle", { lineId: "E3" }, "top"));
  const cut = E(4).t[3] - 0.1;
  S.push(mk(E(4).s, cut, "dream", "dream", "swirl", { lineId: "E4" }, "top"));
  S.push(mk(cut, E(5).s, "street", "night", "latte", { lineId: "E4" }, "top"));
  S.push(mk(E(5).s, E(6).s, "street", "night", "final", { lineId: "E5" }, "left"));
  S.push(mk(E(6).s, 206.6, "street", "night", "finale", { lineId: "E6" }, "top"));
  S.push(mk(206.6, 212.98, "street", "night", "rise", {}, "none"));
  for (let i = 1; i < S.length; i++) if (Math.abs(S[i].s - S[i - 1].e) > 1e-6) throw new Error(`镜头不连续 ${S[i - 1].e} → ${S[i].s}`);
  return S;
}
export const CUT_FLASHES: [number, number][] = [[12.2, 0.12], [lineOf("E4").t[3] - 0.1, 0.35], [lineOf("E6").s, 0.2]];
