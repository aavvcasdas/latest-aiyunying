// 一帧画面怎么画：背景（调色）→ 后景粒子 → 立绘（带动作）→ 前景粒子 → 环境光 → 暗角 → 歌词。
// 全是时间的纯函数，拖进度条到哪一帧都画得出同一张。
import type { Shot, ActorCue, Framing } from "./types";
import { CAST } from "./cast";
import { ACTIONS, poseOf } from "./actions";
import { drawTachie, drawEmote, pickMip, type Ctx2D, type Img, type Mip, type CanvasPair } from "./rig";
import { LINES, PERIOD, DURATION, bt, toBeat, lineAt } from "./timeline";

export interface Env {
  W: number;
  H: number;
  /** 背景图：bg_meadow / bg_night */
  images: Record<string, Img | undefined>;
  /** 每位角色的立绘（多级缩放） */
  tachie: Record<string, Mip[] | undefined>;
  /** 与主画布等大的暂存画布：染色 / 半透明的立绘先画在这里再合成 */
  scratch: CanvasPair;
  /** 给了造画布的办法，就把调好色的背景缓存下来，不必每帧重做全屏混合 */
  make?: (w: number, h: number) => CanvasPair;
  bgCache?: Record<string, CanvasPair>;
}

export const FONT = '"ZCOOL KuaiLe", "PingFang SC", "Microsoft YaHei", sans-serif';

type Layer = [GlobalCompositeOperation, string, number];
interface BgDef {
  label: string;
  img: "meadow" | "night";
  grade: Layer[];
  /** 罩在整幅画面（含立绘）上的环境光，让人物吃进场景的颜色 */
  ambient?: Layer;
}

export const BGS: Record<string, BgDef> = {
  day: { label: "山坡 · 晴天", img: "meadow", grade: [["soft-light", "#9fd4ff", 0.5], ["screen", "#bfe2ff", 0.1]] },
  dusk: { label: "山坡 · 黄昏", img: "meadow", grade: [["multiply", "#ffb47a", 0.45], ["soft-light", "#ff6a3d", 0.3]], ambient: ["multiply", "#ffe2c8", 0.6] },
  dawn: { label: "山坡 · 清晨", img: "meadow", grade: [["soft-light", "#ffc2dc", 0.5], ["screen", "#ff9ec0", 0.1]], ambient: ["soft-light", "#ffd6e6", 0.25] },
  gold: { label: "山坡 · 金色契约", img: "meadow", grade: [["multiply", "#ffd36b", 0.5], ["screen", "#ffe9a8", 0.18]], ambient: ["soft-light", "#ffd98a", 0.35] },
  snow: { label: "山坡 · 雪天", img: "meadow", grade: [["color", "#9aa7b8", 0.75], ["screen", "#dfe9ff", 0.32]], ambient: ["soft-light", "#cfe0ff", 0.3] },
  grey: { label: "山坡 · 灰色街角", img: "meadow", grade: [["color", "#808488", 0.92], ["multiply", "#8a909c", 0.45]], ambient: ["color", "#8a8f98", 0.45] },
  night: { label: "湖畔 · 星夜", img: "night", grade: [], ambient: ["multiply", "#b9c3ff", 0.55] },
  nightwarm: { label: "湖畔 · 灯笼暖光", img: "night", grade: [["soft-light", "#ffb060", 0.45]], ambient: ["multiply", "#ffd9b0", 0.5] },
  dream: { label: "湖畔 · 梦境", img: "night", grade: [["screen", "#ff7ac8", 0.14], ["soft-light", "#c28bff", 0.4]], ambient: ["soft-light", "#e6b8ff", 0.3] },
};
export const FXS: Record<string, string> = {
  none: "无", petals: "花瓣", snow: "雪", stars: "星星", meteor: "流星雨", fireflies: "萤火", sparkles: "金色光点",
  hearts: "爱心", leaves: "落叶", fireworks: "烟花", rain: "雨",
};
export const CAMS: Record<string, string> = {
  still: "固定", pushIn: "推近", pullOut: "拉远", panL: "左摇", panR: "右摇", drift: "漂移", shake: "卡拍震动",
};
export const FRAMINGS: Record<Framing, string> = { full: "全身", knee: "七分身", bust: "近景" };

const { sin, cos, PI, floor, min, max, abs, exp } = Math;
const c01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const ease = (v: number) => { const k = c01(v); return k * k * (3 - 2 * k); };
const frac = (v: number) => v - floor(v);
const rnd = (i: number, k: number) => frac(sin(i * 127.1 + k * 311.7) * 43758.5453);

/* ---------------------------------- 背景 ---------------------------------- */

function drawBg(ctx: Ctx2D, env: Env, id: string, zoom: number, panX: number, lift: number) {
  const { W, H } = env;
  const def = BGS[id] ?? BGS.day;
  const img = env.images[`bg_${def.img}`] as (Img & { width: number; height: number }) | undefined;
  const place = (src: Img, iw: number, ih: number) => {
    const s = max(W / iw, H / ih) * zoom;
    const dw = iw * s, dh = ih * s;
    ctx.drawImage(src, (W - dw) / 2 + panX, (H - dh) / 2 - lift * H, dw, dh);
  };
  if (img && env.make && def.grade.length) {
    const cache = (env.bgCache ??= {});
    let c = cache[id];
    if (!c) {
      const cw = 1600, ch = Math.round((1600 * img.height) / img.width);
      c = cache[id] = env.make(cw, ch);
      c.ctx.drawImage(img, 0, 0, cw, ch);
      overlay(c.ctx, { ...env, W: cw, H: ch }, def.grade);
    }
    place(c.canvas, 1600, Math.round((1600 * img.height) / img.width));
    return;
  }
  if (img) {
    place(img, img.width, img.height);
  } else {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, def.img === "night" ? "#0d1238" : "#8ec5ff");
    g.addColorStop(1, def.img === "night" ? "#2a2456" : "#d8f0c4");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  overlay(ctx, env, def.grade);
}

function overlay(ctx: Ctx2D, env: Env, layers: Layer[]) {
  for (const [op, color, a] of layers) {
    ctx.save();
    ctx.globalCompositeOperation = op;
    ctx.globalAlpha = a;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, env.W, env.H);
    ctx.restore();
  }
}

/* ---------------------------------- 粒子 ---------------------------------- */

function drawFx(ctx: Ctx2D, kind: string, T: number, W: number, H: number, front: boolean) {
  if (!kind || kind === "none") return;
  const u = H / 720;
  ctx.save();
  const each = (n: number, fn: (i: number) => void) => {
    for (let i = 0; i < n; i++) if ((i % 3 === 0) === front) fn(i);
  };
  switch (kind) {
    case "petals":
      each(54, (i) => {
        const sp = 0.05 + rnd(i, 1) * 0.06;
        const y = frac(rnd(i, 2) + T * sp) * 1.1 - 0.05;
        const x = frac(rnd(i, 3) + T * 0.02 + 0.04 * sin(T * 0.9 + i)) ;
        const r = (5 + rnd(i, 4) * 6) * u * (front ? 1.6 : 1);
        ctx.save();
        ctx.translate(x * W, y * H);
        ctx.rotate(T * (0.8 + rnd(i, 5)) + i);
        ctx.scale(1, 0.55 + 0.4 * sin(T * 2 + i));
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = i % 2 ? "#ffc1d9" : "#ffe0ec";
        ctx.beginPath();
        ctx.ellipse(0, 0, r, r * 0.6, 0, 0, PI * 2);
        ctx.fill();
        ctx.restore();
      });
      break;
    case "leaves":
      each(42, (i) => {
        const sp = 0.07 + rnd(i, 1) * 0.08;
        const x = frac(rnd(i, 3) + T * sp);
        const y = frac(rnd(i, 2) + T * sp * 0.45 + 0.03 * sin(T * 1.3 + i));
        const r = (6 + rnd(i, 4) * 6) * u * (front ? 1.6 : 1);
        ctx.save();
        ctx.translate(x * W, y * H);
        ctx.rotate(T * (1 + rnd(i, 5)) + i);
        ctx.scale(1, 0.5 + 0.45 * sin(T * 2.4 + i));
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = ["#f59e0b", "#ea580c", "#fcd34d"][i % 3];
        ctx.beginPath();
        ctx.ellipse(0, 0, r, r * 0.45, 0, 0, PI * 2);
        ctx.fill();
        ctx.restore();
      });
      break;
    case "snow":
      ctx.fillStyle = "#fff";
      each(120, (i) => {
        const sp = 0.04 + rnd(i, 1) * 0.07;
        const y = frac(rnd(i, 2) + T * sp);
        const x = frac(rnd(i, 3) + 0.02 * sin(T * 0.8 + i * 1.7));
        ctx.globalAlpha = 0.55 + 0.4 * rnd(i, 6);
        ctx.beginPath();
        ctx.arc(x * W, y * H, (1.5 + rnd(i, 4) * 3) * u * (front ? 1.7 : 1), 0, PI * 2);
        ctx.fill();
      });
      break;
    case "rain":
      ctx.strokeStyle = "#cfe0ff";
      ctx.lineWidth = 1.4 * u;
      each(120, (i) => {
        const y = frac(rnd(i, 2) + T * (0.9 + rnd(i, 1) * 0.5));
        const x = frac(rnd(i, 3) - y * 0.08);
        ctx.globalAlpha = 0.25 + 0.3 * rnd(i, 6);
        ctx.beginPath();
        ctx.moveTo(x * W, y * H);
        ctx.lineTo(x * W - 5 * u, y * H + 30 * u);
        ctx.stroke();
      });
      break;
    case "stars":
    case "meteor":
      if (front) break;
      ctx.fillStyle = "#fff";
      for (let i = 0; i < 80; i++) {
        ctx.globalAlpha = 0.25 + 0.6 * abs(sin(T * (0.6 + rnd(i, 1)) + i));
        ctx.beginPath();
        ctx.arc(rnd(i, 2) * W, rnd(i, 3) * H * 0.6, (0.8 + rnd(i, 4) * 1.8) * u, 0, PI * 2);
        ctx.fill();
      }
      if (kind === "meteor") {
        ctx.lineCap = "round";
        for (let i = 0; i < 6; i++) {
          const ph = frac(T * 0.42 + rnd(i, 7));
          if (ph > 0.45) continue;
          const k = ph / 0.45;
          const n = floor(T * 0.42 + rnd(i, 7));
          const x0 = (0.25 + rnd(i + n * 13, 8) * 0.8) * W, y0 = rnd(i + n * 13, 9) * H * 0.3;
          const x = x0 - k * W * 0.42, y = y0 + k * H * 0.34;
          const g = ctx.createLinearGradient(x, y, x + 150 * u, y - 120 * u);
          g.addColorStop(0, "rgba(255,255,255,0.95)");
          g.addColorStop(1, "rgba(255,255,255,0)");
          ctx.globalAlpha = sin(k * PI);
          ctx.strokeStyle = g;
          ctx.lineWidth = 3 * u;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + 150 * u, y - 120 * u);
          ctx.stroke();
        }
      }
      break;
    case "fireflies":
      ctx.globalCompositeOperation = "lighter";
      each(36, (i) => {
        const x = (rnd(i, 2) + 0.06 * sin(T * (0.3 + rnd(i, 1) * 0.4) + i)) * W;
        const y = (0.3 + rnd(i, 3) * 0.65 + 0.05 * cos(T * (0.35 + rnd(i, 5) * 0.4) + i * 2)) * H;
        const a = 0.35 + 0.65 * abs(sin(T * (0.8 + rnd(i, 6)) + i));
        const r = (9 + rnd(i, 4) * 9) * u * (front ? 1.5 : 1);
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, `rgba(255,244,170,${a})`);
        g.addColorStop(0.3, `rgba(255,214,90,${a * 0.5})`);
        g.addColorStop(1, "rgba(255,200,60,0)");
        ctx.fillStyle = g;
        ctx.fillRect(x - r, y - r, r * 2, r * 2);
      });
      break;
    case "sparkles":
      ctx.globalCompositeOperation = "lighter";
      each(48, (i) => {
        const y = 1.05 - frac(rnd(i, 2) + T * (0.05 + rnd(i, 1) * 0.07)) * 1.1;
        const x = rnd(i, 3) + 0.02 * sin(T + i);
        const r = (4 + rnd(i, 4) * 7) * u * (front ? 1.5 : 1) * (0.5 + 0.5 * abs(sin(T * 3 + i)));
        ctx.fillStyle = i % 2 ? "rgba(255,226,140,0.9)" : "rgba(255,250,220,0.9)";
        ctx.beginPath();
        for (let j = 0; j < 8; j++) {
          const a = (j / 8) * PI * 2;
          const rr = j % 2 ? r * 0.28 : r;
          ctx.lineTo(x * W + cos(a) * rr, y * H + sin(a) * rr);
        }
        ctx.fill();
      });
      break;
    case "hearts":
      each(27, (i) => {
        const y = 1.08 - frac(rnd(i, 2) + T * (0.06 + rnd(i, 1) * 0.06)) * 1.2;
        const x = rnd(i, 3) + 0.03 * sin(T * 1.2 + i);
        const r = (8 + rnd(i, 4) * 10) * u * (front ? 1.5 : 1);
        ctx.save();
        ctx.translate(x * W, y * H);
        ctx.rotate(0.3 * sin(T * 2 + i));
        ctx.globalAlpha = 0.75;
        ctx.fillStyle = i % 2 ? "#ff7aa8" : "#ffb3cc";
        ctx.beginPath();
        ctx.moveTo(0, r * 0.9);
        ctx.bezierCurveTo(-r * 1.5, -r * 0.1, -r * 0.7, -r * 1.2, 0, -r * 0.35);
        ctx.bezierCurveTo(r * 0.7, -r * 1.2, r * 1.5, -r * 0.1, 0, r * 0.9);
        ctx.fill();
        ctx.restore();
      });
      break;
    case "fireworks":
      if (front) break;
      ctx.globalCompositeOperation = "lighter";
      for (let b = 0; b < 4; b++) {
        const period = 2.1 + b * 0.37;
        const n = floor(T / period + b * 0.31);
        const age = frac(T / period + b * 0.31) * period;
        if (age > 1.6) continue;
        const cx = (0.15 + rnd(n, b + 1) * 0.7) * W, cy = (0.12 + rnd(n, b + 5) * 0.28) * H;
        const hue = floor(rnd(n, b + 9) * 360);
        const k = age / 1.6;
        const R = (1 - exp(-age * 3)) * 170 * u;
        ctx.fillStyle = `hsla(${hue},95%,70%,${(1 - k) * 0.95})`;
        for (let j = 0; j < 36; j++) {
          const a = (j / 36) * PI * 2 + n;
          const rr = R * (0.55 + 0.45 * rnd(j, n));
          ctx.beginPath();
          ctx.arc(cx + cos(a) * rr, cy + sin(a) * rr + age * age * 22 * u, (3.2 - k * 2) * u, 0, PI * 2);
          ctx.fill();
        }
      }
      break;
  }
  ctx.restore();
}

/* ---------------------------------- 立绘 ---------------------------------- */

const FRAME: Record<Framing, { h: number; gy: number; bgZoom: number; bgLift: number }> = {
  full: { h: 0.8, gy: 0.945, bgZoom: 1.08, bgLift: 0 },
  knee: { h: 1.25, gy: 1.31, bgZoom: 1.22, bgLift: -0.05 },
  bust: { h: 1.95, gy: 2.02, bgZoom: 1.42, bgLift: -0.09 },
};

function drawActor(ctx: Ctx2D, env: Env, cue: ActorCue, idx: number, shot: Shot, T: number, lt: number, cam: [number, number, number]) {
  const { W, H } = env;
  const m = CAST[cue.who];
  const mips = env.tachie[cue.who];
  if (!m || !mips) return;
  const fr = FRAME[shot.framing] ?? FRAME.full;
  const dur = max(0.5, (shot.b1 - shot.b0) * PERIOD);
  let x = cue.x;
  let flip = !!cue.flip;
  if (cue.x2 !== undefined && cue.x2 !== cue.x) {
    const moving = cue.action === "walk" || cue.action === "run";
    x = cue.x + (cue.x2 - cue.x) * (moving ? c01(lt / dur) : ease(lt / (dur * 0.7)));
    if (moving) flip = cue.x2 < cue.x;
  }
  const t = lt - (cue.delay ?? 0.15);
  const pose = poseOf(cue.action, t, toBeat(T), T, idx * 1.7 + m.cx * 9);
  const hgt = fr.h * H * (cue.scale ?? 1);
  const px = W * (0.5 + x * 0.5);
  const gy = fr.gy * H;
  const [z, e, f] = cam;
  const img = pickMip(mips, hgt * z);

  // 脚下的影子（全身镜才看得见）
  if (shot.framing === "full") {
    ctx.save();
    ctx.setTransform(z, 0, 0, z, e, f);
    ctx.globalAlpha = 0.28 * pose.alpha;
    ctx.fillStyle = "#101226";
    ctx.beginPath();
    ctx.ellipse(px + (flip ? -1 : 1) * pose.dx * hgt, gy + hgt * 0.004, hgt * 0.15 * max(0.3, 1 - pose.lift * 4), hgt * 0.02, 0, 0, PI * 2);
    ctx.fill();
    ctx.restore();
  }

  let head;
  if (pose.tint || pose.alpha < 1) {
    const s = env.scratch.ctx;
    s.setTransform(1, 0, 0, 1, 0, 0);
    s.globalCompositeOperation = "source-over";
    s.globalAlpha = 1;
    s.clearRect(0, 0, W, H);
    s.setTransform(z, 0, 0, z, e, f);
    head = drawTachie(s, img, m, pose, px, gy, hgt, flip);
    s.setTransform(1, 0, 0, 1, 0, 0);
    if (pose.tint) {
      s.globalCompositeOperation = "source-atop";
      s.globalAlpha = c01(pose.tintA);
      s.fillStyle = pose.tint;
      s.fillRect(0, 0, W, H);
      s.globalCompositeOperation = "source-over";
      s.globalAlpha = 1;
    }
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = pose.alpha;
    ctx.drawImage(env.scratch.canvas, 0, 0);
    ctx.restore();
  } else {
    ctx.save();
    ctx.setTransform(z, 0, 0, z, e, f);
    head = drawTachie(ctx, img, m, pose, px, gy, hgt, flip);
    ctx.restore();
  }

  const emote = cue.emote ?? ACTIONS[cue.action]?.emote;
  if (emote && emote !== "none") {
    const side = flip ? -1 : 1;
    const es = hgt * 0.075;
    ctx.save();
    ctx.setTransform(z, 0, 0, z, e, f);
    const ey = max(head.y + hgt * 0.05, (es * 1.1 - f) / z);
    drawEmote(ctx, emote, head.x + side * hgt * 0.13, ey, es, t - 0.1);
    ctx.restore();
  }
}

function camera(shot: Shot, T: number, lt: number, env: Env): { z: number; pan: number; sx: number; sy: number } {
  const dur = max(0.5, (shot.b1 - shot.b0) * PERIOD);
  const p = c01(lt / dur);
  const ph = frac(toBeat(T));
  let z = 1.03, pan = 0, sx = 0, sy = 0;
  switch (shot.cam) {
    case "pushIn": z = 1.02 + 0.09 * ease(p); break;
    case "pullOut": z = 1.12 - 0.09 * ease(p); break;
    case "panL": z = 1.06; pan = (0.5 - p) * 0.06; break;
    case "panR": z = 1.06; pan = (p - 0.5) * 0.06; break;
    case "drift": z = 1.05 + 0.012 * sin(T * 0.5); pan = 0.012 * sin(T * 0.35); break;
    case "shake": {
      const k = exp(-ph * 8);
      z = 1.05 + 0.02 * k; sx = 0.006 * k * sin(T * 70); sy = 0.006 * k * cos(T * 60);
      break;
    }
  }
  z += 0.004 * exp(-ph * 6); // 每拍轻轻一顶
  return { z, pan: pan * env.W, sx: sx * env.W, sy: sy * env.H };
}

/** 画一个镜头在某一刻的样子（不含歌词与转场）。T：全曲秒；lt：进入本镜后的秒数 */
export function renderShot(ctx: Ctx2D, env: Env, shot: Shot, T: number, lt: number) {
  const { W, H } = env;
  const fr = FRAME[shot.framing] ?? FRAME.full;
  const c = camera(shot, T, lt, env);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#0b0d1a";
  ctx.fillRect(0, 0, W, H);

  // 背景比人物动得少：视差
  drawBg(ctx, env, shot.bg, fr.bgZoom * (1 + (c.z - 1) * 0.6), -c.pan * 0.5 + c.sx, fr.bgLift - c.sy / H);
  drawFx(ctx, shot.fx, T, W, H, false);

  const cam: [number, number, number] = [c.z, W / 2 + c.z * (-W / 2 - c.pan) + c.sx, H * 0.6 + c.z * (-H * 0.6) + c.sy];
  shot.actors.forEach((cue, i) => drawActor(ctx, env, cue, i, shot, T, lt, cam));
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  drawFx(ctx, shot.fx, T, W, H, true);
  const amb = (BGS[shot.bg] ?? BGS.day).ambient;
  if (amb) overlay(ctx, env, [amb]);

  const vg = ctx.createRadialGradient(W / 2, H * 0.48, H * 0.35, W / 2, H * 0.5, H * 1.05);
  vg.addColorStop(0, "rgba(8,8,24,0)");
  vg.addColorStop(1, "rgba(8,8,24,0.55)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);

  if (shot.caption) drawCaption(ctx, env, shot.caption, lt);
}

function drawCaption(ctx: Ctx2D, env: Env, text: string, lt: number) {
  const { W, H } = env;
  const [title, sub] = text.split("|");
  const a = ease(lt / 1.2);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = "rgba(10,10,30,0.35)";
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  const size = H * (title.length > 6 ? 0.1 : 0.19);
  ctx.font = `${size}px ${FONT}`;
  ctx.shadowColor = "rgba(255,190,120,0.9)";
  ctx.shadowBlur = H * 0.04;
  ctx.fillStyle = "#fff6e6";
  ctx.fillText(title, W / 2, H * 0.44 + (1 - a) * H * 0.03);
  ctx.shadowBlur = 0;
  if (sub) {
    ctx.font = `${H * 0.045}px ${FONT}`;
    ctx.fillStyle = "rgba(255,240,220,0.9)";
    ctx.fillText(sub, W / 2, H * 0.44 + size * 0.85);
  }
  ctx.restore();
}

function drawLyric(ctx: Ctx2D, env: Env, beat: number) {
  const i = lineAt(beat);
  if (i < 0) return;
  const { W, H } = env;
  const L = LINES[i];
  const a = min(c01((beat - L.b0 + 0.2) / 0.3), c01((L.b1 - beat) / 0.35));
  const prog = c01((beat - L.b0) / L.sweep);
  const size = H * 0.068;
  const y = H * 0.895;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.font = `${size}px ${FONT}`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  const tw = ctx.measureText(L.text).width;
  const x0 = (W - tw) / 2;
  ctx.lineWidth = size * 0.2;
  ctx.strokeStyle = "rgba(24,16,48,0.82)";
  ctx.strokeText(L.text, x0, y);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(L.text, x0, y);
  // 卡拉 OK 扫色：唱到哪个字，颜色走到哪
  ctx.beginPath();
  ctx.rect(x0 - 4, y - size, (tw + 8) * prog, size * 2);
  ctx.clip();
  const g = ctx.createLinearGradient(x0, 0, x0 + tw, 0);
  g.addColorStop(0, "#ffd166");
  g.addColorStop(1, "#ff8fb3");
  ctx.fillStyle = g;
  ctx.fillText(L.text, x0, y);
  ctx.restore();
}

export function shotIndexAt(shots: Shot[], beat: number): number {
  let lo = 0, hi = shots.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (shots[mid].b0 <= beat) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

/**
 * 整支 MV 在 T 秒的画面。
 * @param cuts 是否画转场（镜头间的闪白 / 黑场、片头片尾的淡入淡出）；暂停着逐镜检查时关掉，免得正好停在一片白或一片黑上
 */
export function renderMv(ctx: Ctx2D, env: Env, shots: Shot[], T: number, cuts = true): number {
  const beat = toBeat(T);
  const idx = shotIndexAt(shots, beat);
  const shot = shots[idx];
  const lt = max(0, T - bt(shot.b0));
  renderShot(ctx, env, shot, T, lt);
  drawLyric(ctx, env, beat);

  // 转场：唱词的镜头卡点闪白，间奏的镜头从黑里淡出
  const { W, H } = env;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (cuts && idx > 0 && lt < 0.32) {
    const lyric = shot.line >= 0;
    ctx.globalAlpha = (1 - lt / 0.32) ** 2 * (lyric ? 0.55 : 0.8);
    ctx.fillStyle = lyric ? "#fff8ee" : "#0a0a18";
    ctx.fillRect(0, 0, W, H);
  }
  const edge = min(c01(T / 1.2), c01((DURATION - T) / 2.5));
  if (cuts && edge < 1) {
    ctx.globalAlpha = 1 - edge;
    ctx.fillStyle = "#05050c";
    ctx.fillRect(0, 0, W, H);
  }
  ctx.globalAlpha = 1;
  return idx;
}
