// 动态字卡：每一句歌词的版式（按逐字起音时间落字）
import { Ctx, FONT, W, H, clamp, easeOut, getSpeck, hash, mkCanvas, roundRect, sm } from "./fx";
import { LINES, LineT } from "./lyrics";

export interface Pal {
  name: "night" | "ink" | "day" | "dawn";
  bg: string;
  fg: string;
  gradTop: string;
  gradBot: string;
  ground: string;
  fig: string; // 剪影填充
  add: boolean; // 光是否用加色
  warm: string;
  cool: string;
}

export const PALS: Record<Pal["name"], Pal> = {
  night: { name: "night", bg: "#05060a", fg: "#f4f2ff", gradTop: "#f1efff", gradBot: "#6f78ff", ground: "#10121a", fig: "#0a0c13", add: true, warm: "#ff8a3d", cool: "#5c78ff" },
  ink: { name: "ink", bg: "#08080a", fg: "#f2f2f2", gradTop: "#f6f6ff", gradBot: "#7580ff", ground: "#17171c", fig: "#0b0b0e", add: true, warm: "#ff8a3d", cool: "#5c78ff" },
  day: { name: "day", bg: "#ebeae5", fg: "#0d0d11", gradTop: "#0b1033", gradBot: "#3a4cff", ground: "#c9c8c1", fig: "#1b1c22", add: false, warm: "#ff8a3d", cool: "#4358ff" },
  dawn: { name: "dawn", bg: "#0e1838", fg: "#fff3dc", gradTop: "#fff7e6", gradBot: "#ffb45e", ground: "#1a2350", fig: "#0a0f26", add: true, warm: "#ffb45e", cool: "#8ea2ff" },
};

export interface CharSpec {
  ch: string;
  x: number;
  y: number;
  size: number;
  t: number;
  until: number;
  fill: string; // 'fg' | 'grad' | 具体颜色
  rot?: number;
  anim?: "slam" | "drop" | "fade";
  extrude?: boolean;
}
export interface BandSpec {
  x: number;
  y: number;
  w: number;
  h: number;
  col: string;
  t: number;
  until: number;
}
export interface Layout {
  chars: CharSpec[];
  bands: BandSpec[];
}

export const FIG_X = [250, 380, 510, 640, 770, 900, 1030];

const HOLD = 0.32;

function row(l: LineT, o: { cx?: number; x0?: number; y: number; size: number; step: number; fill?: string; from?: number; to?: number; rot?: number; anim?: CharSpec["anim"]; extrude?: boolean }): CharSpec[] {
  const from = o.from ?? 0;
  const to = o.to ?? l.text.length;
  const n = to - from;
  const out: CharSpec[] = [];
  for (let i = from; i < to; i++) {
    const k = i - from;
    const x = o.x0 !== undefined ? o.x0 + k * o.step : (o.cx ?? W / 2) + (k - (n - 1) / 2) * o.step;
    out.push({ ch: l.text[i], x, y: o.y, size: o.size, t: l.t[i], until: l.e + HOLD, fill: o.fill ?? "fg", rot: o.rot, anim: o.anim ?? "slam", extrude: o.extrude });
  }
  return out;
}

function one(l: LineT, i: number, x: number, y: number, size: number, fill = "fg", extra: Partial<CharSpec> = {}): CharSpec {
  return { ch: l.text[i], x, y, size, t: l.t[i], until: l.e + HOLD, fill, anim: "slam", ...extra };
}

function seq(l: LineT, size: number, fill = "fg", cx = W / 2, cy = H / 2): CharSpec[] {
  return [...l.text].map((ch, i) => ({
    ch,
    x: cx,
    y: cy,
    size,
    t: l.t[i],
    until: i < l.text.length - 1 ? l.t[i + 1] : l.e + HOLD,
    fill,
    anim: "slam" as const,
    extrude: true,
  }));
}

function band(l: LineT, x: number, y: number, w: number, h: number, col: string): BandSpec {
  return { x, y, w, h, col, t: l.s, until: l.e + HOLD };
}

export function layoutOf(l: LineT, pal: Pal): Layout {
  const sec = l.id[0];
  let n = +l.id.slice(1);
  const bands: BandSpec[] = [];
  let chars: CharSpec[] = [];
  const grand = "grad";
  let g: string = sec === "D" ? "B" : sec;
  if (sec === "D") n += 13;
  const verse = g === "A" || g === "C" || g === "E";

  if (verse) {
    switch (n) {
      case 1:
        chars = row(l, { y: 120, size: 60, step: 62, anim: "fade" });
        break;
      case 2:
        chars = l.text.split("").map((_, i) => one(l, i, FIG_X[i], 560, 62, "fg", { anim: "fade" }));
        break;
      case 3:
        chars = row(l, { y: 330, size: 300, step: 300, fill: grand, extrude: true });
        break;
      case 4:
        chars = row(l, { x0: 90, y: 118, size: 58, step: 78, rot: -0.03 });
        chars[4].size = 112;
        chars[4].fill = "#9be04f";
        chars[4].y = 126;
        chars[4].x = 90 + 4 * 78 + 22;
        chars[5].x += 52;
        chars[6].x += 52;
        break;
      case 5:
        chars = seq(l, 540, grand);
        break;
      case 6: {
        chars = [
          one(l, 0, 150, 200, 150, pal.warm),
          one(l, 1, 150, 360, 150, pal.warm),
          one(l, 2, 640, 290, 56, "fg"),
          one(l, 3, 1130, 200, 150, pal.cool),
          one(l, 4, 1130, 360, 150, pal.cool),
        ];
        break;
      }
      case 7:
        chars = row(l, { y: 640, size: 118, step: 130 });
        break;
      case 8:
        chars = l.text.split("").map((_, i) => one(l, i, 150 + i * 140, 170, 112, "fg", { anim: "drop" }));
        break;
      case 9:
        chars = row(l, { y: 380, size: 330, step: 340, fill: "fg", extrude: true });
        break;
      case 10:
        chars = row(l, { x0: 105, y: 92, size: 84, step: 118, rot: -0.02 });
        break;
      case 11:
        chars = [
          one(l, 0, 590, 330, 46, "#4a6bff"),
          one(l, 1, 640, 330, 46, "#4a6bff"),
          one(l, 2, 690, 330, 46, "#4a6bff"),
          one(l, 3, 150, 160, 250, "fg", { extrude: true }),
          one(l, 4, 1130, 160, 250, "fg", { extrude: true }),
          one(l, 5, 150, 560, 250, "fg", { extrude: true }),
          one(l, 6, 1130, 560, 250, "fg", { extrude: true }),
          one(l, 7, 590, 400, 40, "fg"),
          one(l, 8, 640, 400, 40, "fg"),
          one(l, 9, 690, 400, 40, "fg"),
        ];
        break;
      case 12:
        chars = [...row(l, { x0: 110, y: 120, size: 52, step: 70, from: 0, to: 5 }), ...row(l, { cx: 640, y: 585, size: 136, step: 160, from: 5, to: 9, fill: "#f4f6ff" })];
        bands.push({ x: 150, y: 505, w: 980, h: 160, col: "rgba(58,92,255,0.6)", t: l.t[5], until: l.e + HOLD });
        break;
      case 13:
        chars = seq(l, 560, grand);
        break;
      case 14:
        chars = [
          one(l, 0, 190, 300, 380, grand, { extrude: true }),
          one(l, 1, 470, 470, 200, grand, { extrude: true }),
          one(l, 2, 690, 150, 60),
          one(l, 3, 750, 150, 60),
          one(l, 4, 810, 150, 60),
          one(l, 5, 930, 470, 270, grand, { extrude: true }),
          one(l, 6, 1130, 540, 220, grand, { extrude: true }),
        ];
        break;
    }
  } else {
    switch (n) {
      case 1:
        chars = row(l, { y: 270, size: 128, step: 138, extrude: true });
        break;
      case 2:
        chars = row(l, { y: 120, size: 40, step: 60 });
        bands.push(band(l, 500, 96, 280, 52, "rgba(70,84,120,0.75)"));
        break;
      case 3:
        chars = row(l, { y: 190, size: 104, step: 124, fill: grand, extrude: true });
        break;
      case 4:
        chars = row(l, { y: 150, size: 58, step: 120 });
        break;
      case 5:
        chars = row(l, { y: 360, size: 240, step: 250, fill: grand, extrude: true });
        break;
      case 6:
        chars = row(l, { x0: 90, y: 115, size: 78, step: 100 });
        break;
      case 7:
        chars = row(l, { y: 270, size: 210, step: 236, fill: grand, extrude: true });
        break;
      case 8:
        chars = row(l, { y: 130, size: 112, step: 150 });
        break;
      case 9:
        chars = row(l, { y: 330, size: 170, step: 210, fill: "#ff5d5d", extrude: true });
        break;
      case 10:
        chars = [...row(l, { y: 130, size: 92, step: 150, from: 0, to: 5 }), ...row(l, { y: 270, size: 150, step: 170, from: 5, to: 10, fill: grand, extrude: true })];
        break;
      case 11:
        chars = row(l, { y: 640, size: 54, step: 96 });
        break;
      case 12:
        chars = row(l, { x0: 100, y: 120, size: 56, step: 80 });
        break;
      case 13:
        chars = row(l, { y: 250, size: 130, step: 160, extrude: true });
        break;
      case 14:
        chars = l.text.split("").map((_, i) => one(l, i, [150, 640, 1130][i], 140, 92));
        break;
      case 15:
        chars = row(l, { y: 310, size: 190, step: 224, fill: grand, extrude: true });
        break;
      case 16:
        chars = row(l, { y: 300, size: 200, step: 244, fill: grand, extrude: true });
        break;
      case 17:
        chars = [one(l, 0, 390, 370, 520, grand, { extrude: true }), one(l, 1, 890, 370, 520, grand, { extrude: true })];
        break;
      case 18:
        chars = row(l, { y: 70, size: 30, step: 62, fill: "#d9dfef" });
        bands.push(band(l, 330, 46, 620, 48, "rgba(54,72,104,0.82)"));
        break;
    }
  }

  // 日间过曝版把「渐变」字换成深蓝，「fg」已经是墨色
  void pal;
  return { chars, bands };
}

// ─── 渲染 ───
let TC: HTMLCanvasElement | null = null;
const cache = new Map<string, Layout>();

export function layoutCached(l: LineT, pal: Pal): Layout {
  const k = l.id + pal.name;
  let v = cache.get(k);
  if (!v) {
    v = layoutOf(l, pal);
    cache.set(k, v);
  }
  return v;
}

function fillOf(c: Ctx, f: string, y: number, size: number, pal: Pal): string | CanvasGradient {
  if (f === "fg") return pal.fg;
  if (f === "grad") {
    const g = c.createLinearGradient(0, y - size * 0.5, 0, y + size * 0.5);
    g.addColorStop(0.1, pal.gradTop);
    g.addColorStop(0.95, pal.gradBot);
    return g;
  }
  return f;
}

export function drawText(main: Ctx, t: number, pal: Pal, only?: (l: LineT) => boolean) {
  if (!TC) TC = mkCanvas(W, H);
  const c = TC.getContext("2d")!;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalCompositeOperation = "source-over";
  c.globalAlpha = 1;
  c.clearRect(0, 0, W, H);
  let any = false;
  const rk = Math.floor(t * 18);
  for (const l of LINES) {
    if (t < l.s - 0.05 || t > l.e + HOLD + 0.05) continue;
    if (only && !only(l)) continue;
    const lay = layoutCached(l, pal);
    for (const b of lay.bands) {
      if (t < b.t || t > b.until) continue;
      any = true;
      const a = sm(b.t, b.t + 0.15, t) * (1 - sm(b.until - 0.12, b.until, t));
      c.globalAlpha = a;
      c.fillStyle = b.col;
      roundRect(c, b.x, b.y, b.w, b.h, 4);
      c.fill();
    }
    c.globalAlpha = 1;
    lay.chars.forEach((s, i) => {
      if (t < s.t || t > s.until) return;
      any = true;
      const life = t - s.t;
      let sc = 1;
      let a = 1;
      let dx = 0;
      let dy = 0;
      let chroma = 2;
      const anim = s.anim ?? "slam";
      if (anim === "slam") {
        sc = 1 + 0.5 * Math.exp(-life * 13);
        a = clamp(life / 0.035);
        chroma = 2 + 15 * Math.exp(-life * 7);
        if (life < 0.16) {
          dx = (hash(rk + i * 3.1) - 0.5) * 8;
          dy = (hash(rk + i * 5.7) - 0.5) * 6;
        }
      } else if (anim === "drop") {
        const p = Math.max(0, life - 0.42);
        dy = 640 * p * p;
        a = clamp(life / 0.05) * (1 - sm(0.9, 1.5, life));
        sc = 1 + 0.35 * Math.exp(-life * 12);
        chroma = 4 + p * 10;
      } else {
        a = sm(0, 0.3, life);
        chroma = 3;
      }
      a *= 1 - sm(s.until - 0.14, s.until, t);
      if (a <= 0.01) return;
      c.save();
      c.translate(s.x + dx, s.y + dy);
      c.rotate((s.rot ?? 0) + (anim === "drop" ? Math.max(0, life - 0.42) * 0.8 * (i % 2 ? 1 : -1) : 0));
      c.scale(sc, sc);
      c.globalAlpha = a;
      c.font = `900 ${s.size}px ${FONT}`;
      c.textAlign = "center";
      c.textBaseline = "middle";
      // 色差鬼影
      c.fillStyle = "rgba(255,40,90,0.7)";
      c.fillText(s.ch, chroma, 0);
      c.fillStyle = "rgba(30,220,255,0.7)";
      c.fillText(s.ch, -chroma, 0);
      if (s.extrude && s.size > 140) {
        c.fillStyle = pal.name === "day" ? "#9aa0c8" : "#1a1c4a";
        for (let k = 8; k >= 1; k--) c.fillText(s.ch, k * 1.1, k * 1.5);
      }
      c.fillStyle = fillOf(c, s.fill, 0, s.size, pal);
      c.fillText(s.ch, 0, 0);
      c.restore();
    });
  }
  if (!any) return;
  // 斑驳：把字啃出旧油墨的缺口
  const sp = getSpeck();
  const pat = c.createPattern(sp, "repeat");
  if (pat) {
    const k = Math.floor(t * 8);
    const ox = hash(k) * 512;
    const oy = hash(k + 9) * 512;
    c.globalCompositeOperation = "destination-out";
    c.globalAlpha = 0.9;
    c.save();
    c.translate(-ox, -oy);
    c.fillStyle = pat;
    c.fillRect(ox, oy, W, H);
    c.restore();
    c.globalCompositeOperation = "source-over";
  }
  c.globalAlpha = 1;
  main.save();
  main.setTransform(1, 0, 0, 1, 0, 0);
  main.drawImage(TC, 0, 0);
  main.restore();
}

export { easeOut };
