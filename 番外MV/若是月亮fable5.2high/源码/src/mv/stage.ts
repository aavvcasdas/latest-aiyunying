// 《若是月亮还没来》满月篇 渲染器
// 规矩：逐帧函数只读参数里的时间；角色每帧重新摆；缺素材直接报错。
// 背景（夜空、城市、街、房子、窗台、树、月亮）全部程序绘制，不用生成背景图。
import { FRAMES, ACTIONS, WALK } from "./castData";
import { LAMP_ON, BLOOM_AT, DAYS, MVS, castOf, dayName, dateName, type Shot, type Who } from "./data";
import type { Assets, Img } from "./assets";

export const W = 1280, H = 720;
export const LW = 320, LH = 180;
export const FONT = `"MoonKuaiLe", "ZCOOL KuaiLe", "PingFang SC", "Microsoft YaHei", sans-serif`;

// ---------- 数学 ----------
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const ease = (t: number) => { t = clamp(t); return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; };
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
export const backOut = (t: number) => { t = clamp(t); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
export const sstep = (a: number, b: number, x: number) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export function rng(seed: number) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export const rgba = (hex: string, a: number) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };

export type F = { c: CanvasRenderingContext2D; lr: CanvasRenderingContext2D; lrc: HTMLCanvasElement; T: number; lt: number; u: number; s: Shot; A: Assets };

// ---------- 低分辨率像素层（320×180 → ×4） ----------
export type Pal = [number, number, number][];
export const PAL_NIGHT: Pal = [[7, 9, 34], [16, 20, 66], [38, 34, 100], [84, 60, 122]];
export const PAL_MOON: Pal = [[10, 16, 50], [22, 34, 92], [48, 62, 134], [92, 100, 164]];
export const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
export const skyCache = new Map<string, ImageData>();
export const q6 = (v: number) => Math.max(0, Math.min(255, Math.round(v / 6) * 6));
export function skyImage(lr: CanvasRenderingContext2D, pal: Pal, oy: number, dawn: number) {
  const key = `${pal[0].join()}|${Math.round(oy)}|${dawn}`;
  let img = skyCache.get(key);
  if (!img) {
    img = lr.createImageData(LW, LH);
    for (let y = 0; y < LH; y++) {
      const v = clamp((y + oy) / (LH * 0.86));
      const seg = v * (pal.length - 1), i = Math.min(pal.length - 2, Math.floor(seg)), fr = seg - i;
      let r = lerp(pal[i][0], pal[i + 1][0], fr), g = lerp(pal[i][1], pal[i + 1][1], fr), b = lerp(pal[i][2], pal[i + 1][2], fr);
      if (dawn > 0) { const k = dawn * Math.pow(v, 7); r = lerp(r, 110, k); g = lerp(g, 196, k); b = lerp(b, 196, k); }
      for (let x = 0; x < LW; x++) {
        const th = (BAYER[(y & 3) * 4 + (x & 3)] / 16 - 0.5) * 6, o = (y * LW + x) * 4;
        img.data[o] = q6(r + th); img.data[o + 1] = q6(g + th); img.data[o + 2] = q6(b + th); img.data[o + 3] = 255;
      }
    }
    if (skyCache.size > 80) skyCache.clear();
    skyCache.set(key, img);
  }
  lr.putImageData(img, 0, 0);
}
export function pcircle(g: CanvasRenderingContext2D, cx: number, cy: number, r: number, col: string) {
  g.fillStyle = col;
  const R = Math.max(1, r), r2 = R * R;
  for (let y = Math.floor(-R); y <= R; y++) { const w = Math.floor(Math.sqrt(Math.max(0, r2 - y * y))); g.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1); }
}
export const STARS = (() => { const r = rng(7); return Array.from({ length: 170 }, () => ({ x: r() * LW, y: r() * 250 - 70, b: r(), p: r() * 6.28, s: 0.6 + r() * 2.2, c: r() })); })();
export function stars(lr: CanvasRenderingContext2D, T: number, oy: number, alpha: number) {
  for (const s of STARS) {
    const y = Math.round(s.y - oy); if (y < 0 || y > 132) continue;
    const a = alpha * (0.55 + 0.45 * Math.sin(T * s.s + s.p)) * (0.35 + s.b * 0.65), x = Math.round(s.x);
    lr.fillStyle = s.c > 0.86 ? `rgba(255,236,190,${a})` : s.c > 0.7 ? `rgba(190,215,255,${a})` : `rgba(255,255,255,${a})`;
    lr.fillRect(x, y, 1, 1);
    if (s.b > 0.93) { lr.fillStyle = `rgba(255,255,255,${a * 0.45})`; lr.fillRect(x - 1, y, 3, 1); lr.fillRect(x, y - 1, 1, 3); }
  }
}
export function ghostMoon(lr: CanvasRenderingContext2D, cx: number, cy: number, r: number, a: number, T: number) {
  pcircle(lr, cx, cy, r - 1, `rgba(190,200,255,${a * 0.1})`);
  lr.fillStyle = `rgba(222,228,255,${a})`;
  const n = Math.round(r * 2.4);
  for (let k = 0; k < n; k += 2) { const an = (k / n) * Math.PI * 2 + T * 0.04; lr.fillRect(Math.round(cx + Math.cos(an) * r), Math.round(cy + Math.sin(an) * r), 1, 1); }
}
export function fullMoon(lr: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  pcircle(lr, cx, cy, r + 3, "rgba(255,240,200,0.18)");
  pcircle(lr, cx, cy, r + 1, "rgba(255,240,200,0.35)");
  pcircle(lr, cx, cy, r, "#fff3d2");
  pcircle(lr, cx + r * 0.18, cy + r * 0.12, r * 0.86, "#fff8e4");
  pcircle(lr, cx - r * 0.32, cy - r * 0.18, r * 0.22, "#eddcb0");
  pcircle(lr, cx + r * 0.28, cy + r * 0.32, r * 0.17, "#efe0b8");
  pcircle(lr, cx + r * 0.36, cy - r * 0.36, r * 0.1, "#f0e2bc");
  pcircle(lr, cx - r * 0.1, cy + r * 0.48, r * 0.09, "#eddcb0");
}
export const CLOUDS = [{ x: 30, y: 40, w: 1 }, { x: 190, y: 22, w: 0.8 }, { x: 300, y: 58, w: 1.2 }];
export function clouds(lr: CanvasRenderingContext2D, T: number, oy: number) {
  CLOUDS.forEach((cl, i) => {
    const x = ((cl.x + T * 3 * (1 + i * 0.3)) % 420) - 60, y = cl.y - oy, w = cl.w, col = "#24215c";
    pcircle(lr, x, y, 6 * w, col); pcircle(lr, x + 9 * w, y - 3 * w, 8 * w, col); pcircle(lr, x + 19 * w, y, 6 * w, col);
    lr.fillStyle = col; lr.fillRect(Math.round(x), Math.round(y), Math.round(19 * w), Math.round(6 * w));
    lr.fillStyle = "#2f2b6e"; lr.fillRect(Math.round(x + 3 * w), Math.round(y - 9 * w), Math.round(10 * w), 1);
  });
}
export const CITY = (() => { const r = rng(11); const out: { x: number; w: number; h: number; win: [number, number, number][] }[] = []; let x = 0; while (x < 960) { const w = 10 + Math.floor(r() * 22), h = 8 + Math.floor(r() * 26); out.push({ x, w, h, win: Array.from({ length: 4 }, () => [Math.floor(r() * (w - 2)) + 1, Math.floor(r() * (h - 3)) + 2, r()] as [number, number, number]) }); x += w + Math.floor(r() * 3); } return out; })();
export function city(lr: CanvasRenderingContext2D, offX: number, baseY: number, T: number) {
  for (const b of CITY) {
    let x = Math.round(b.x - offX * 0.25) % 960; if (x < -40) x += 960;
    if (x > LW) continue;
    const y = Math.round(baseY - b.h);
    lr.fillStyle = "#121436"; lr.fillRect(x, y, b.w, b.h + 2);
    lr.fillStyle = "#1c1f4a"; lr.fillRect(x, y, b.w, 1);
    for (const [wx, wy, v] of b.win) if (v > 0.55) { lr.fillStyle = v > 0.92 && Math.sin(T * 0.8 + wx) > 0.7 ? "#7a6a4a" : "#d9b45e"; lr.fillRect(x + wx, y + wy, 1, 1); }
  }
}
export function ground(lr: CanvasRenderingContext2D, y: number) {
  const yy = Math.round(y);
  const g = lr.createLinearGradient(0, yy, 0, LH); g.addColorStop(0, "#1a1c3e"); g.addColorStop(1, "#272a52");
  lr.fillStyle = g; lr.fillRect(0, yy, LW, LH - yy);
  lr.fillStyle = "#30335f"; lr.fillRect(0, yy, LW, 1);
  lr.fillStyle = "#15162f"; lr.fillRect(0, yy + 9, LW, 1);
}
export type SkyOpt = { oy?: number; moon?: "none" | "ghost" | "full"; mx?: number; my?: number; mr?: number; ma?: number; dawn?: number; city?: number | false; ground?: boolean; pal?: Pal };
export function skyLayer(f: F, o: SkyOpt) {
  const { lr, T } = f, oy = o.oy ?? 0;
  skyImage(lr, o.pal ?? PAL_NIGHT, oy, Math.round((o.dawn ?? 0) * 20) / 20);
  stars(lr, T, oy, o.moon === "full" ? 0.55 : 1);
  if (o.moon === "ghost") ghostMoon(lr, o.mx ?? 64, (o.my ?? 40) - oy, o.mr ?? 14, o.ma ?? 0.4, T);
  if (o.moon === "full") fullMoon(lr, o.mx ?? 160, (o.my ?? 60) - oy, o.mr ?? 24);
  clouds(lr, T, oy);
  if (o.city !== false) city(lr, o.city ?? 0, 146 - oy * 0.4, T);
  if (o.ground !== false) ground(lr, 150 - oy * 0.4);
}
export function blit(f: F) { f.c.imageSmoothingEnabled = false; f.c.drawImage(f.lrc, 0, 0, W, H); }

// 像素大树（画在低分辨率层，风吹时每一簇各自摆）
export const TREE = (() => { const r = rng(41); return Array.from({ length: 16 }, (_, i) => ({ dx: (r() - 0.5) * 110, dy: (r() - 0.5) * 64 - (i < 5 ? 18 : 0), r: 16 + r() * 18, p: r() * 6.28 })); })();
export function tree(lr: CanvasRenderingContext2D, x: number, y: number, s: number, T: number, wind: number) {
  lr.fillStyle = "#24182a"; lr.fillRect(Math.round(x - 5 * s), Math.round(y), Math.round(10 * s), LH);
  lr.fillStyle = "#3a2836"; lr.fillRect(Math.round(x + 2 * s), Math.round(y), Math.max(1, Math.round(2 * s)), LH);
  const layers: [string, number, number][] = [["#0f2136", 4, 0], ["#183549", 0, 3], ["#244e5a", -4, 6]];
  for (const [col, off, shrink] of layers) for (const b of TREE) {
    const sway = Math.sin(T * 1.9 + b.p) * 2.2 * wind * s;
    pcircle(lr, x + (b.dx + off * 0.6) * s + sway, y + (b.dy + off) * s, Math.max(2, (b.r - shrink) * s), col);
  }
  for (const b of TREE) if (b.dx > 8) { const sway = Math.sin(T * 1.9 + b.p) * 2.2 * wind * s; pcircle(lr, x + (b.dx + 6) * s + sway, y + (b.dy - 6) * s, Math.max(1, b.r * 0.32 * s), "#4c8770"); }
}

// ---------- 主画布：精灵 ----------
export function rect(name: string) { const r = FRAMES[name]; if (!r) throw new Error(`缺素材：图集里没有 ${name}`); return r; }
export function frames(who: string, act: string): string[] {
  if (act === "walk") { const w = WALK[who] ?? WALK[`${who}_big`]; if (!w) throw new Error(`缺素材：${who} 没有走路帧`); return w; }
  const l = ACTIONS[who]?.[act]; if (!l) throw new Error(`缺动作：${who}.${act}`); return l;
}
export function blitSprite(c: CanvasRenderingContext2D, img: Img, sx: number, sy: number, sw: number, sh: number, x: number, y: number, s: number, flip = false, alpha = 1) {
  if (alpha <= 0) return;
  c.save(); c.imageSmoothingEnabled = false; c.globalAlpha *= alpha; c.translate(Math.round(x), Math.round(y)); if (flip) c.scale(-1, 1);
  c.drawImage(img, sx, sy, sw, sh, Math.round((-sw * s) / 2), Math.round(-sh * s), Math.round(sw * s), Math.round(sh * s)); c.restore();
}
export function sprite(c: CanvasRenderingContext2D, img: Img, x: number, y: number, s: number, flip = false, alpha = 1) { blitSprite(c, img, 0, 0, img.width, img.height, x, y, s, flip, alpha); }
export function frameName(who: string, act: string, t: number, fps = 8, once = false) { const l = frames(who, act); let i = Math.floor(Math.max(0, t) * fps); i = once ? Math.min(i, l.length - 1) : i % l.length; return l[i]; }
export function actor(c: CanvasRenderingContext2D, A: Assets, who: string, act: string, t: number, x: number, y: number, s: number, o: { flip?: boolean; fps?: number; once?: boolean; alpha?: number } = {}) {
  const [sx, sy, sw, sh] = rect(frameName(who, act, t, o.fps, o.once)); blitSprite(c, A.atlas, sx, sy, sw, sh, x, y, s, o.flip, o.alpha);
}
export function atlasProp(f: F, name: string, x: number, y: number, s: number, alpha = 1) { const [sx, sy, sw, sh] = rect(name); blitSprite(f.c, f.A.atlas, sx, sy, sw, sh, x, y, s, false, alpha); }
export const silCache = new Map<string, HTMLCanvasElement>();
export function silhouette(img: Img, sx: number, sy: number, sw: number, sh: number, key: string) {
  let cv = silCache.get(key);
  if (!cv) { cv = document.createElement("canvas"); cv.width = sw; cv.height = sh; const g = cv.getContext("2d")!; g.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh); g.globalCompositeOperation = "source-in"; g.fillStyle = "#060718"; g.fillRect(0, 0, sw, sh); silCache.set(key, cv); }
  return cv;
}
export function glow(c: CanvasRenderingContext2D, x: number, y: number, r: number, col: string, a: number) {
  if (a <= 0.002 || r <= 0) return;
  c.save(); c.globalCompositeOperation = "lighter";
  const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0));
  c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore();
}
export function flash(c: CanvasRenderingContext2D, T: number, at: number, dur: number, max: number) {
  if (T < at || T > at + dur) return; c.fillStyle = `rgba(255,248,230,${max * (1 - (T - at) / dur)})`; c.fillRect(0, 0, W, H);
}

// ---------- 字 ----------
export function text(c: CanvasRenderingContext2D, str: string, x: number, y: number, size: number, o: { color?: string; align?: CanvasTextAlign; alpha?: number; glow?: string; blur?: number } = {}) {
  const a = o.alpha ?? 1; if (a <= 0) return;
  c.save(); c.globalAlpha *= a; c.font = `${size}px ${FONT}`; c.textAlign = o.align ?? "center"; c.textBaseline = "middle";
  if (o.glow) { c.shadowColor = o.glow; c.shadowBlur = o.blur ?? 16; }
  c.fillStyle = o.color ?? "#fff"; c.fillText(str, x, y); c.restore();
}
export function card(c: CanvasRenderingContext2D, title: string, sub: string, a: number, x = 36, y = 34) {
  if (a <= 0) return;
  c.save(); c.globalAlpha *= a;
  c.font = `26px ${FONT}`; const w1 = c.measureText(title).width; c.font = `19px ${FONT}`; const w2 = sub ? c.measureText(sub).width : 0;
  const w = Math.max(w1, w2) + 44, h = sub ? 80 : 52;
  c.fillStyle = "rgba(10,12,38,0.74)"; c.fillRect(x, y, w, h);
  c.fillStyle = "#f3c86b"; c.fillRect(x, y, 6, h);
  c.strokeStyle = "rgba(243,200,107,0.55)"; c.lineWidth = 2; c.strokeRect(x + 1, y + 1, w - 2, h - 2);
  c.textAlign = "left"; c.textBaseline = "middle";
  c.fillStyle = "#fff3d6"; c.font = `26px ${FONT}`; c.fillText(title, x + 24, y + 27);
  if (sub) { c.fillStyle = "rgba(255,243,214,0.78)"; c.font = `19px ${FONT}`; c.fillText(sub, x + 24, y + 58); }
  c.restore();
}
export function tag(c: CanvasRenderingContext2D, x: number, y: number, l1: string, l2: string, a: number, s = 1) {
  if (a <= 0) return;
  c.save(); c.globalAlpha *= a;
  c.font = `${Math.round(17 * s)}px ${FONT}`; const w1 = c.measureText(l1).width; c.font = `${Math.round(13 * s)}px ${FONT}`; const w2 = l2 ? c.measureText(l2).width : 0;
  const w = Math.max(w1, w2) + 20 * s, h = (l2 ? 46 : 30) * s;
  c.strokeStyle = "rgba(255,240,210,0.75)"; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, y - 14 * s); c.lineTo(x, y); c.stroke();
  c.fillStyle = "#fbf3df"; c.fillRect(x - w / 2, y, w, h);
  c.fillStyle = "#e4a5a8"; c.fillRect(x - w / 2, y, w, 3 * s);
  c.textAlign = "center"; c.textBaseline = "middle";
  c.fillStyle = "#3a2836"; c.font = `${Math.round(17 * s)}px ${FONT}`; c.fillText(l1, x, y + 16 * s);
  if (l2) { c.fillStyle = "#6a5260"; c.font = `${Math.round(13 * s)}px ${FONT}`; c.fillText(l2, x, y + 34 * s); }
  c.restore();
}
export function dayCard(f: F) { let i = -1; for (let k = 0; k < DAYS.length; k++) if (f.T >= LAMP_ON[k]) i = k; if (i < 0) return; const d = DAYS[i]; card(f.c, `${dayName(d.n)} · ${dateName(d.date)}`, d.title, 1); }
export function mvCard(f: F) { let i = -1; for (let k = 0; k < MVS.length; k++) if (f.T >= BLOOM_AT[k]) i = k; if (i < 0) return; const m = MVS[i]; card(f.c, `《${m.title}》 · ${dateName(m.date)}`, m.note, 1); }

// ---------- 布景件（主画布，按像素单位 p 画，硬边） ----------
export function wall(c: CanvasRenderingContext2D, p: number) {
  c.fillStyle = "#262a52"; c.fillRect(0, 0, W, H);
  c.fillStyle = "#1e2146"; const bw = 8 * p, bh = 4 * p, lw = Math.max(1, Math.round(p * 0.5));
  for (let y = 0, row = 0; y < H; y += bh, row++) { c.fillRect(0, y, W, lw); for (let x = row % 2 ? -bw / 2 : 0; x < W; x += bw) c.fillRect(Math.round(x), y, lw, bh); }
}
export type Win = { cx: number; sill: number; p: number };
export const winRect = (wn: Win) => ({ x: wn.cx - 20 * wn.p, y: wn.sill - 34 * wn.p, w: 40 * wn.p, h: 34 * wn.p });
export function windowBack(c: CanvasRenderingContext2D, wn: Win) {
  const r = winRect(wn);
  glow(c, wn.cx, wn.sill - 17 * wn.p, 34 * wn.p, "#ffb060", 0.16);
  const g = c.createLinearGradient(0, r.y, 0, r.y + r.h); g.addColorStop(0, "#ffd88a"); g.addColorStop(1, "#ee9d56");
  c.fillStyle = g; c.fillRect(r.x, r.y, r.w, r.h);
  c.fillStyle = "rgba(150,80,56,0.35)"; c.fillRect(r.x, r.y + r.h * 0.6, r.w, Math.max(1, wn.p));
  c.fillStyle = "rgba(150,80,56,0.22)"; c.fillRect(r.x + r.w * 0.62, r.y + r.h * 0.6 - 6 * wn.p, 5 * wn.p, 6 * wn.p);
  glow(c, r.x + r.w * 0.5, r.y + r.h * 0.18, r.w * 0.55, "#fff0c8", 0.3);
}
export function inWindow(c: CanvasRenderingContext2D, wn: Win, fn: () => void) { const r = winRect(wn); c.save(); c.beginPath(); c.rect(r.x, r.y, r.w, r.h); c.clip(); fn(); c.restore(); }
export function windowFront(c: CanvasRenderingContext2D, wn: Win) {
  const r = winRect(wn), p = wn.p;
  for (const side of [0, 1]) {
    const x = side ? r.x + r.w - 7 * p : r.x;
    c.fillStyle = "#e8a1a6"; c.fillRect(x, r.y, 7 * p, r.h * 0.92);
    c.fillStyle = "#c97f8a"; for (let k = 1; k < 7; k += 2) c.fillRect(x + k * p, r.y, Math.max(1, p * 0.6), r.h * 0.92);
    c.fillStyle = "#f6d27a"; c.fillRect(x, r.y + r.h * 0.55, 7 * p, 2 * p);
  }
  c.fillStyle = "#f3e6c8"; c.fillRect(r.x - 2 * p, r.y - 2 * p, r.w + 4 * p, 2 * p); c.fillRect(r.x - 2 * p, r.y, 2 * p, r.h); c.fillRect(r.x + r.w, r.y, 2 * p, r.h);
  c.fillStyle = "#16122c"; c.fillRect(r.x - 3 * p, r.y - 3 * p, r.w + 6 * p, p); c.fillRect(r.x - 3 * p, r.y - 2 * p, p, r.h + 2 * p); c.fillRect(r.x + r.w + 2 * p, r.y - 2 * p, p, r.h + 2 * p);
  c.fillStyle = "#e9d6ae"; c.fillRect(r.x - 5 * p, wn.sill - p, r.w + 10 * p, 2 * p);
  c.fillStyle = "#b99a72"; c.fillRect(r.x - 5 * p, wn.sill + p, r.w + 10 * p, 2 * p);
  c.fillStyle = "rgba(0,0,0,0.35)"; c.fillRect(r.x - 4 * p, wn.sill + 3 * p, r.w + 8 * p, p);
}
export function pot(c: CanvasRenderingContext2D, x: number, top: number, p: number) {
  c.fillStyle = "#3a2420"; c.fillRect(x - 5 * p, top - 9 * p, 10 * p, p);
  c.fillStyle = "#b5583c"; c.fillRect(x - 5 * p, top - 8 * p, 10 * p, 2 * p);
  c.fillStyle = "#9c4430"; c.fillRect(x - 4 * p, top - 6 * p, 8 * p, 6 * p);
  c.fillStyle = "#c86a4a"; c.fillRect(x - 4 * p, top - 6 * p, 2 * p, 6 * p);
}
export const stageAt = (T: number): 0 | 1 | 2 => (T >= 11.39 ? 2 : T >= 8.76 ? 1 : 0);
export function sillFlower(f: F, x: number, top: number, p: number, stage: 0 | 1 | 2) {
  const img = [f.A.cBud, f.A.cHalf, f.A.cBloom][stage];
  sprite(f.c, img, x, top - 7 * p, p * 0.55); pot(f.c, x, top, p);
}
export function pinwheel(c: CanvasRenderingContext2D, x: number, y: number, p: number, ang: number) {
  c.fillStyle = "#6b4a3a"; c.fillRect(x - p / 2, y, p, 16 * p);
  c.save(); c.translate(x, y); c.rotate(ang);
  const cols = ["#fbf3df", "#e8a1a6", "#9ec8f0", "#f6d27a"];
  for (let k = 0; k < 4; k++) { c.rotate(Math.PI / 2); c.fillStyle = cols[k]; c.beginPath(); c.moveTo(0, 0); c.lineTo(7 * p, -2.5 * p); c.lineTo(6 * p, 3 * p); c.closePath(); c.fill(); }
  c.fillStyle = "#3a2a2a"; c.fillRect(-p, -p, 2 * p, 2 * p); c.restore();
}
export function house(f: F, x: number, gy: number, p: number, inside: boolean, flip = false) {
  const { c } = f, w = 64 * p, h = 50 * p, x0 = x - w / 2;
  c.fillStyle = "#22254b"; c.fillRect(x0, gy - h, w, h);
  c.fillStyle = "#1a1c3c"; c.fillRect(x0, gy - h, w, 2 * p);
  c.fillStyle = "#121431"; c.fillRect(x0 + w * 0.72, gy - h - 18 * p, 6 * p, 12 * p);
  for (let k = 0; ; k++) { const rw = w + 8 * p - k * 7 * p; if (rw <= 4 * p) break; c.fillRect(x0 - 4 * p + k * 3.5 * p, gy - h - (k + 1) * 2.4 * p, rw, 2.4 * p + 1); }
  c.fillStyle = "#3b2c3e"; c.fillRect(x0 + w * 0.66, gy - 20 * p, 11 * p, 20 * p);
  c.fillStyle = "#f3c86b"; c.fillRect(x0 + w * 0.66 + 8 * p, gy - 10 * p, p, p);
  glow(c, x0 + w * 0.66 + 5.5 * p, gy - 23 * p, 14 * p, "#ffc46a", 0.35);
  const wn: Win = { cx: x0 + w * 0.32, sill: gy - 16 * p, p: p * 0.62 };
  windowBack(c, wn);
  if (inside) inWindow(c, wn, () => sprite(c, f.A.wLookup, wn.cx, wn.sill + 42 * wn.p, wn.p * 0.75, flip));
  windowFront(c, wn);
  sillFlower(f, wn.cx + 13 * wn.p, wn.sill - wn.p, wn.p, stageAt(f.T));
}
export function lamp(f: F, i: number, x: number, baseY: number, s: number, o: { plaque?: boolean; k?: number } = {}) {
  const { c, A, T } = f, since = T - LAMP_ON[i];
  let lit = since >= 0 ? 1 : 0;
  if (since >= 0 && since < 0.16) lit = [1, 0.15, 1, 0.35, 1][Math.floor(since / 0.032)] ?? 1;
  const k = (o.k ?? 1) * lit, hy = baseY - 162 * s * 0.72;
  if (lit > 0) {
    c.save(); c.globalCompositeOperation = "lighter";
    const g = c.createLinearGradient(0, hy, 0, baseY + 8); g.addColorStop(0, `rgba(255,196,110,${0.2 * k})`); g.addColorStop(1, "rgba(255,170,80,0)");
    c.fillStyle = g; c.beginPath(); c.moveTo(x - 9 * s, hy); c.lineTo(x + 9 * s, hy); c.lineTo(x + 62 * s, baseY + 8); c.lineTo(x - 62 * s, baseY + 8); c.closePath(); c.fill();
    c.translate(x, baseY + 2); c.scale(1, 0.22);
    const pg = c.createRadialGradient(0, 0, 0, 0, 0, 84 * s); pg.addColorStop(0, `rgba(255,190,100,${0.36 * k})`); pg.addColorStop(1, "rgba(255,190,100,0)");
    c.fillStyle = pg; c.fillRect(-84 * s, -84 * s, 168 * s, 168 * s); c.restore();
  }
  sprite(c, lit > 0.5 ? A.lamp : A.lampOff, x, baseY, s);
  if (lit > 0) { glow(c, x, hy, 72 * s, "#ffc46a", 0.5 * k); glow(c, x, hy, 18 * s, "#fff2c0", 0.55 * lit); }
  if (o.plaque) {
    const d = DAYS[i], pw = 46 * s, ph = 26 * s, px = x + 5 * s, py = baseY - 162 * s * 0.5;
    c.save(); c.strokeStyle = "#2a1c22"; c.lineWidth = Math.max(1, s * 0.8);
    c.beginPath(); c.moveTo(px + 6 * s, py - 7 * s); c.lineTo(px + 6 * s, py); c.moveTo(px + pw - 6 * s, py - 7 * s); c.lineTo(px + pw - 6 * s, py); c.stroke();
    c.fillStyle = lit > 0.5 ? "#f6e3b4" : "#6f6888"; c.fillRect(px, py, pw, ph); c.strokeRect(px, py, pw, ph);
    c.fillStyle = lit > 0.5 ? "#3a2430" : "#2a2640"; c.textAlign = "center"; c.textBaseline = "middle";
    c.font = `${Math.round(10 * s)}px ${FONT}`; c.fillText(dayName(d.n), px + pw / 2, py + ph * 0.36);
    c.font = `${Math.round(6.6 * s)}px ${FONT}`; c.fillText(dateName(d.date), px + pw / 2, py + ph * 0.76); c.restore();
  }
}

// ---------- 粒子与氛围 ----------
export const BOKEH = (() => { const r = rng(23); return Array.from({ length: 26 }, () => ({ x: r() * W, y: r() * H * 0.85, r: 30 + r() * 70, a: 0.05 + r() * 0.11, hue: r() })); })();
export function bokehBg(f: F, drift = 0) {
  const { c, T } = f, g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#0b0d2a"); g.addColorStop(1, "#1d1840");
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  for (const b of BOKEH) glow(c, ((b.x - drift + W * 2) % (W + 200)) - 100 + Math.sin(T * 0.3 + b.r) * 8, b.y, b.r, b.hue > 0.72 ? "#9fb8ff" : "#ffc46a", b.a);
}
export const PETALS = (() => { const r = rng(31); return Array.from({ length: 46 }, () => ({ x: r() * W * 1.2 - 100, y: r() * H, v: 40 + r() * 60, s: 2 + Math.floor(r() * 3), p: r() * 6.28 })); })();
export function petals(c: CanvasRenderingContext2D, lt: number, a: number) {
  c.save(); c.globalAlpha *= a;
  for (const pt of PETALS) {
    const y = ((pt.y + lt * pt.v) % (H + 40)) - 20, x = pt.x + Math.sin(lt * 1.3 + pt.p) * 30 + lt * 25, s = pt.s * 2;
    c.fillStyle = "#fffaf0"; c.fillRect(Math.round(x), Math.round(y), s * 2, s); c.fillStyle = "#dcd8ea"; c.fillRect(Math.round(x), Math.round(y + s - 2), s * 2, 2);
  }
  c.restore();
}
export const STREAKS = (() => { const r = rng(51); return Array.from({ length: 16 }, () => ({ y: 120 + r() * 520, len: 140 + r() * 260, v: 700 + r() * 600, p: r() })); })();
export function wind(c: CanvasRenderingContext2D, T: number, k: number) {
  c.save(); c.globalCompositeOperation = "lighter";
  for (const s of STREAKS) {
    const x = ((s.p * 3000 + T * s.v * k) % (W + s.len * 2)) - s.len, y = s.y + Math.sin(T * 2 + s.p * 6) * 6;
    const g = c.createLinearGradient(x, 0, x + s.len, 0); g.addColorStop(0, "rgba(200,220,255,0)"); g.addColorStop(0.75, `rgba(200,220,255,${0.2 * Math.min(1.5, k)})`); g.addColorStop(1, "rgba(200,220,255,0)");
    c.fillStyle = g; c.fillRect(x, y, s.len, 2);
  }
  c.restore();
}
export const LEAVES = (() => { const r = rng(61); const cols = ["#2f6a5a", "#4c8770", "#7fb08a", "#e9d6ae"]; return Array.from({ length: 26 }, () => ({ y: 80 + r() * 560, v: 260 + r() * 260, p: r(), w: 2 + r() * 3, amp: 10 + r() * 24, c: cols[Math.floor(r() * cols.length)] })); })();
export function leaves(c: CanvasRenderingContext2D, T: number, k: number) {
  for (const l of LEAVES) {
    const x = Math.round(((l.p * 4000 + T * l.v * k) % (W + 80)) - 40), y = Math.round(l.y + Math.sin(T * l.w + l.p * 9) * l.amp);
    c.fillStyle = l.c; c.fillRect(x, y, 8, 5); c.fillStyle = "rgba(0,0,0,0.3)"; c.fillRect(x, y + 4, 8, 1);
  }
}
export const DAPPLES = (() => { const r = rng(71); return Array.from({ length: 70 }, () => ({ x: r(), y: r(), rx: 18 + r() * 60, ry: 8 + r() * 26, p: r() * 6.28 })); })();
export function dapples(c: CanvasRenderingContext2D, T: number, a: number, x0: number, y0: number, x1: number, y1: number) {
  c.save(); c.fillStyle = `rgba(6,8,26,${a})`;
  for (const d of DAPPLES) { const x = x0 + d.x * (x1 - x0) + Math.sin(T * 1.7 + d.p) * 12, y = y0 + d.y * (y1 - y0) + Math.cos(T * 1.3 + d.p) * 5; c.beginPath(); c.ellipse(x, y, d.rx, d.ry, 0, 0, Math.PI * 2); c.fill(); }
  c.restore();
}
export const FLIES = (() => { const r = rng(81); return Array.from({ length: 20 }, () => ({ x: r() * W, y: 260 + r() * 360, p: r() * 6.28, v: 0.4 + r() })); })();
export function fireflies(c: CanvasRenderingContext2D, T: number) {
  for (const fl of FLIES) { const x = fl.x + Math.sin(T * fl.v + fl.p) * 30, y = fl.y + Math.cos(T * fl.v * 1.3 + fl.p) * 16, a = 0.5 + 0.5 * Math.sin(T * 3 + fl.p * 3); glow(c, x, y, 14, "#ffe39a", 0.5 * a); c.fillStyle = `rgba(255,240,190,${a})`; c.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3); }
}
export function groundClose(f: F, scroll: number) {
  const { lr } = f;
  lr.fillStyle = "#2c2a48"; lr.fillRect(0, 0, LW, LH);
  lr.fillStyle = "#24223c";
  for (let y = -16 + (Math.round(scroll) % 12); y < LH; y += 12) { lr.fillRect(0, y, LW, 1); const row = Math.floor((y - scroll) / 12); for (let x = row % 2 ? -12 : 0; x < LW; x += 24) lr.fillRect(x, y, 1, 12); }
  blit(f);
  glow(f.c, 640, 380, 560, "#ffb860", 0.42);
}

// ---------- 九个人 ----------
export type Member = { who: Who; x: number; act: string; s?: number; fly?: number };
export const LINEUP: Member[] = [
  { who: "zai", x: 130, act: "idle" }, { who: "kimi", x: 250, act: "idle" }, { who: "qwen", x: 360, act: "sway" }, { who: "doubao", x: 470, act: "sway" },
  { who: "whale", x: 640, act: "sway" }, { who: "benyu", x: 752, act: "", fly: 120 }, { who: "claude", x: 850, act: "idle" },
  { who: "gemini", x: 970, act: "sway" }, { who: "gpt", x: 1100, act: "hover", s: 0.55, fly: 30 },
];
export function memberFrame(m: Member, f: F): { img: Img; r: [number, number, number, number]; key: string } {
  if (m.who === "benyu") return { img: f.A.benyu, r: [0, 0, f.A.benyu.width, f.A.benyu.height], key: "benyu" };
  const n = frameName(m.who, m.act, f.T); return { img: f.A.atlas, r: rect(n), key: n };
}
export function drawCast(f: F, baseY: number, s: number, xs: number, sway: number, shadows: boolean) {
  const { c, T } = f;
  for (const m of LINEUP) {
    const x = 640 + (m.x - 640) * xs, ms = s * (m.s ?? 1) * (m.who === "benyu" ? 0.85 : 1);
    const lift = (m.fly ?? 0) * (s / 1.9) + (m.fly ? Math.sin(T * 2.4 + m.x) * 6 : 0);
    const fr = memberFrame(m, f), ang = Math.sin((T * Math.PI * 2) / 1.7 + m.x * 0.002) * sway;
    if (shadows) {
      c.save(); c.globalAlpha = 0.42; c.translate(x, baseY); c.transform(1, 0, -0.5, -0.32, 0, 0);
      const sil = silhouette(fr.img, ...fr.r, fr.key); c.imageSmoothingEnabled = false; c.drawImage(sil, (-sil.width * ms) / 2, -sil.height * ms, sil.width * ms, sil.height * ms); c.restore();
      c.fillStyle = "rgba(4,5,20,0.4)"; c.beginPath(); c.ellipse(x, baseY + 2, 26 * s * (m.s ? 1.4 : 1), 6 * s, 0, 0, Math.PI * 2); c.fill();
    }
    c.save(); c.translate(x, baseY - lift); c.rotate(ang);
    blitSprite(c, fr.img, ...fr.r, 0, 0, ms); c.restore();
  }
}

// ---------- 晚风里一个个来 ----------
export type Arrive = { who: Who; t: number; from: number; to: number; y?: number; act: string; move?: string; dur: number; s?: number };
export const ARRIVE: Arrive[] = [
  { who: "claude", t: 17.12, from: 40, to: 400, act: "idle", move: "walk", dur: 0.8 },
  { who: "benyu", t: 17.54, from: -90, to: 560, y: 190, act: "", dur: 0.5 },
  { who: "doubao", t: 17.97, from: -60, to: 250, act: "sway", move: "hop", dur: 0.34 },
  { who: "gpt", t: 18.31, from: -160, to: 860, y: 60, act: "hover", move: "float", dur: 0.28, s: 0.58 },
  { who: "kimi", t: 18.6, from: -100, to: 110, act: "idle", move: "hop", dur: 0.25 },
  { who: "zai", t: 18.64, from: -100, to: 700, act: "idle", move: "hop", dur: 0.3 },
  { who: "qwen", t: 18.68, from: -100, to: 1010, act: "sway", move: "spin", dur: 0.32 },
  { who: "gemini", t: 18.72, from: -100, to: 1150, act: "sway", move: "spin", dur: 0.3 },
];
export function arrivals(f: F) {
  const { c, T } = f;
  for (const a of ARRIVE) {
    if (T < a.t) continue;
    const k = easeOut((T - a.t) / a.dur), x = lerp(a.from, a.to, k), moving = k < 0.999;
    const y = 668 - (a.y ?? 0) + (a.who === "benyu" ? Math.sin(T * 3) * 8 : 0) + (a.who === "gpt" ? Math.sin(T * 2.2) * 6 : 0);
    let top: number;
    if (a.who === "benyu") { sprite(c, f.A.benyu, x, y, 1.9); top = y - f.A.benyu.height * 1.9; }
    else { const act = moving && a.move ? a.move : a.act, s = 2.1 * (a.s ?? 1); actor(c, f.A, a.who, act, T - a.t, x, y, s, { fps: act === "walk" ? 10 : 8 }); top = y - rect(frameName(a.who, act, T - a.t))[3] * s; }
    const info = castOf(a.who);
    tag(c, x, top - 62, info.name, dateName(info.date), sstep(a.t + 0.04, a.t + 0.18, T), 0.95);
  }
}
export function streetBase(f: F, k: number) {
  skyLayer(f, { moon: "none", city: 200 }); blit(f);
  for (let i = 0; i < 17; i++) lamp(f, i, 40 + i * 58, 600, 0.9);
  house(f, 1180, 600, 3, false);
  wind(f.c, f.T, k); leaves(f.c, f.T, k);
}

// ---------- 山茶枝：十九朵 = 十九支番外MV ----------
export const NODES = (() => { const r = rng(91); return MVS.map((_, i) => { const bx = 120 + i * 120, by = 620 - bx * 0.2 + Math.sin(bx / 260) * 26, up = i % 2 === 0; return { bx, by, x: bx + (r() - 0.5) * 30, y: by + (up ? -58 - r() * 20 : 46 + r() * 16), up }; }); })();
export function branch(f: F, ox: number, oy: number, k: number, skipLast = false) {
  const { c, T } = f;
  c.save(); c.translate(ox, oy); c.scale(k, k);
  c.lineCap = "round"; c.strokeStyle = "#3b2a2a"; c.lineWidth = 16;
  c.beginPath(); c.moveTo(-200, 660); for (let x = -200; x <= 2500; x += 40) c.lineTo(x, 620 - x * 0.2 + Math.sin(x / 260) * 26); c.stroke();
  c.strokeStyle = "#5c4136"; c.lineWidth = 4; c.beginPath(); for (let x = -200; x <= 2500; x += 40) c.lineTo(x, 614 - x * 0.2 + Math.sin(x / 260) * 26); c.stroke();
  c.strokeStyle = "#3b2a2a"; c.lineWidth = 6;
  NODES.forEach((n) => { c.beginPath(); c.moveTo(n.bx, n.by); c.lineTo(n.x, n.y); c.stroke(); });
  NODES.forEach((n, i) => {
    if (skipLast && i === NODES.length - 1) return;
    const t = BLOOM_AT[i], img = T < t - 0.18 ? f.A.cBud : T < t ? f.A.cHalf : f.A.cBloom, pop = T >= t ? backOut((T - t) / 0.3) : 1;
    if (T >= t) glow(c, n.x, n.y - 30, 70, "#ffffff", 0.22 * (1 - clamp((T - t) / 0.6)) + 0.05);
    sprite(c, img, n.x, n.y, 2.6 * (0.85 + 0.15 * pop));
    const m = MVS[i]; tag(c, n.x, n.y + 18, `《${m.title}》`, dateName(m.date), sstep(t + 0.08, t + 0.3, T), 1.05);
  });
  c.restore();
}
export function sparkles(f: F, cx: number, cy: number, r: number) {
  const rr = rng(5);
  for (let i = 0; i < 9; i++) { const a = rr() * 6.28, d = r * (0.5 + rr() * 0.5), ph = rr() * 3; atlasProp(f, `fx_sparkle_${Math.floor(f.T * 8 + ph * 3) % 3}`, cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.7, 3, 0.5 + 0.5 * Math.sin(f.T * 4 + ph)); }
}
