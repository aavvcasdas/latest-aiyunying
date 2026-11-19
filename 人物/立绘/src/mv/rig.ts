// 立绘骨架：把一张立绘沿「脊柱」切成几十到一百多条横带，每条按姿态各自平移 / 旋转 / 缩放后再画。
// 脊柱从脚底往上逐条积分，所以弯腰、歪头、屈膝、点头都是连续的形变，而不是整张图在抖。
import type { CastMeta } from "./types";
import type { Pose } from "./actions";

export type Ctx2D = CanvasRenderingContext2D;
export type Img = CanvasImageSource;

const HIP = 0.46;
const smooth = (a: number, b: number, v: number) => {
  const k = v <= a ? 0 : v >= b ? 1 : (v - a) / (b - a);
  return k * k * (3 - 2 * k);
};

/** 立绘的一级缩放图：按画面上的实际大小挑最接近的一级，避免逐条缩小时出横纹 */
export interface Mip {
  img: Img;
  w: number;
  h: number;
}

export interface CanvasPair {
  canvas: Img;
  ctx: Ctx2D;
}

/** 原图 + 1/2 + 1/4 三级 */
export function buildMips(img: Img, w: number, h: number, make: (w: number, h: number) => CanvasPair): Mip[] {
  const mips: Mip[] = [{ img, w, h }];
  for (let i = 0; i < 2; i++) {
    const prev = mips[mips.length - 1];
    const nw = Math.round(prev.w / 2), nh = Math.round(prev.h / 2);
    const c = make(nw, nh);
    c.ctx.imageSmoothingEnabled = true;
    c.ctx.imageSmoothingQuality = "high";
    c.ctx.drawImage(prev.img, 0, 0, prev.w, prev.h, 0, 0, nw, nh);
    mips.push({ img: c.canvas, w: nw, h: nh });
  }
  return mips;
}

export function pickMip(mips: Mip[], pixels: number): Mip {
  let best = mips[0];
  for (const m of mips) if (m.h >= pixels * 0.92) best = m;
  return best;
}

export interface HeadAnchor {
  x: number;
  y: number;
}

/**
 * @param px,gy 脚底落点（画布坐标）
 * @param H 立绘在画布上的高度
 * @returns 头顶位置，表情贴挂在这里
 */
export function drawTachie(ctx: Ctx2D, src: Mip, m: CastMeta, p: Pose, px: number, gy: number, H: number, flip: boolean): HeadAnchor {
  const img = src.img, iw = src.w, ih = src.h;
  // 条数跟着画面上的大小走：近景切 112 条，远处的小人六七十条就够
  const STRIPS = Math.max(48, Math.min(112, Math.round(H / 7)));
  const hs = ih / STRIPS;
  const s = H / ih;
  const neckV = 1 - m.neck;
  const dir = flip ? -1 : 1;
  const turn = Math.abs(p.turn) < 0.04 ? (p.turn < 0 ? -0.04 : 0.04) : p.turn;
  const ox = px + dir * p.dx * H;
  const oy = gy - p.lift * H;
  const halfW = iw * 0.5;

  ctx.save();
  ctx.translate(ox, oy);
  ctx.scale(dir * turn, 1);
  let x = 0, y = 0, prevAng = p.rot;
  for (let k = 0; k < STRIPS; k++) {
    const v = (k + 0.5) / STRIPS;
    const hw = smooth(neckV - 0.045, neckV + 0.045, v);
    const ang = p.rot + p.bend * v + p.wave * Math.sin(p.wavePhase - v * 4) * v + p.headRot * hw;
    const syL = p.sy * (v < HIP ? p.legSy : v < neckV ? p.torsoSy : p.headSy);
    const cb = (v - (neckV - 0.13)) / 0.09;
    const sxL = p.sx * (1 + p.chest * Math.exp(-cb * cb));
    const off = p.headDx * H * hw;
    const spx = iw * (m.cx + (m.hx - m.cx) * v);
    // 相邻两条转角不同时外侧会裂缝：按转角差把这一条往下多画几行盖住
    const ov = k === 0 ? 0 : Math.min(hs * 0.9, 1.2 + Math.abs(ang - prevAng) * halfW);
    ctx.save();
    ctx.translate(x + off * Math.cos(ang), y + off * Math.sin(ang));
    ctx.rotate(ang);
    ctx.scale(sxL * s, syL * s);
    ctx.drawImage(img, 0, ih - (k + 1) * hs, iw, hs + ov, -spx, -hs, iw, hs + ov);
    ctx.restore();
    x += Math.sin(ang) * hs * s * syL;
    y -= Math.cos(ang) * hs * s * syL;
    prevAng = ang;
  }
  ctx.restore();
  return { x: ox + dir * turn * x, y: oy + y };
}

/* ---------------------------------- 表情贴 ---------------------------------- */

export const EMOTES: Record<string, string> = {
  none: "不要",
  heart: "爱心",
  sweat: "汗滴",
  anger: "生气",
  exclaim: "感叹",
  question: "疑问",
  zzz: "睡觉",
  sparkle: "闪光",
  shine: "亮光",
  bulb: "灯泡",
  steam: "热气",
  gloom: "阴郁",
  note: "音符",
};
export const EMOTE_IDS = Object.keys(EMOTES);

function heartPath(ctx: Ctx2D, r: number) {
  ctx.beginPath();
  ctx.moveTo(0, r * 0.9);
  ctx.bezierCurveTo(-r * 1.5, -r * 0.1, -r * 0.7, -r * 1.2, 0, -r * 0.35);
  ctx.bezierCurveTo(r * 0.7, -r * 1.2, r * 1.5, -r * 0.1, 0, r * 0.9);
  ctx.closePath();
}
function star4(ctx: Ctx2D, x: number, y: number, r: number) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 ? r * 0.32 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath();
}
function glyph(ctx: Ctx2D, ch: string, x: number, y: number, size: number, fill: string) {
  ctx.font = `900 ${size}px "ZCOOL KuaiLe", "Arial Black", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = size * 0.22;
  ctx.strokeStyle = "#fff";
  ctx.strokeText(ch, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(ch, x, y);
}

/** 画在 (x, y) 附近、大小约 s 的头顶表情贴；t 是出现后的秒数 */
export function drawEmote(ctx: Ctx2D, kind: string, x: number, y: number, s: number, t: number) {
  if (!kind || kind === "none" || t < 0) return;
  const k = Math.min(1, t / 0.22);
  const pop = 1 + 2.2 * (k - 1) ** 3 + 1.2 * (k - 1) ** 2; // easeOutBack
  ctx.save();
  ctx.translate(x, y + Math.sin(t * 3) * s * 0.07);
  ctx.scale(pop, pop);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = s * 0.12;
  switch (kind) {
    case "heart": {
      const b = 1 + 0.12 * Math.sin(t * 7);
      ctx.scale(b, b);
      heartPath(ctx, s * 0.5);
      ctx.stroke();
      ctx.fillStyle = "#ff5c8a";
      ctx.fill();
      break;
    }
    case "sweat": {
      const dy = ((t * 0.5) % 1) * s * 0.35;
      ctx.translate(0, dy);
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.55);
      ctx.bezierCurveTo(s * 0.45, 0, s * 0.35, s * 0.45, 0, s * 0.45);
      ctx.bezierCurveTo(-s * 0.35, s * 0.45, -s * 0.45, 0, 0, -s * 0.55);
      ctx.stroke();
      ctx.fillStyle = "#7cc7ff";
      ctx.fill();
      break;
    }
    case "anger": {
      const b = 1 + 0.1 * Math.sin(t * 12);
      ctx.scale(b, b);
      for (const [lw, col] of [[s * 0.3, "#fff"], [s * 0.15, "#f43f5e"]] as [number, string][]) {
        ctx.lineWidth = lw;
        ctx.strokeStyle = col;
        for (let i = 0; i < 4; i++) {
          ctx.save();
          ctx.rotate((i * Math.PI) / 2);
          ctx.beginPath();
          ctx.moveTo(s * 0.14, -s * 0.5);
          ctx.quadraticCurveTo(s * 0.14, -s * 0.14, s * 0.5, -s * 0.14);
          ctx.stroke();
          ctx.restore();
        }
      }
      break;
    }
    case "exclaim":
      glyph(ctx, "!", 0, 0, s * 1.25, "#f59e0b");
      break;
    case "question":
      ctx.rotate(0.12 * Math.sin(t * 3));
      glyph(ctx, "?", 0, 0, s * 1.2, "#6366f1");
      break;
    case "zzz":
      for (let i = 0; i < 3; i++) {
        const ph = (t * 0.45 + i / 3) % 1;
        ctx.globalAlpha = Math.sin(ph * Math.PI);
        glyph(ctx, "Z", ph * s * 0.7, -ph * s * 1.1 + s * 0.3, s * (0.4 + ph * 0.5), "#60a5fa");
      }
      break;
    case "sparkle":
      for (let i = 0; i < 3; i++) {
        const tw = 0.6 + 0.4 * Math.sin(t * 6 + i * 2.1);
        star4(ctx, [-0.35, 0.35, 0.05][i] * s, [0.15, -0.05, -0.5][i] * s, s * [0.3, 0.42, 0.24][i] * tw);
        ctx.lineWidth = s * 0.08;
        ctx.stroke();
        ctx.fillStyle = "#fde047";
        ctx.fill();
      }
      break;
    case "shine": {
      ctx.rotate(t * 0.8);
      ctx.strokeStyle = "#fde68a";
      ctx.lineWidth = s * 0.08;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const r1 = s * 0.42, r2 = s * (0.62 + 0.08 * Math.sin(t * 6 + i));
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
        ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
        ctx.stroke();
      }
      star4(ctx, 0, 0, s * 0.36);
      ctx.fillStyle = "#fff7c2";
      ctx.fill();
      break;
    }
    case "bulb": {
      ctx.beginPath();
      ctx.arc(0, -s * 0.1, s * 0.36, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#fde047";
      ctx.fill();
      ctx.fillStyle = "#94a3b8";
      ctx.fillRect(-s * 0.16, s * 0.24, s * 0.32, s * 0.2);
      ctx.strokeStyle = "#fde047";
      ctx.lineWidth = s * 0.07;
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI * (0.1 + i * 0.2);
        ctx.beginPath();
        ctx.moveTo(Math.cos(a) * s * 0.5, -s * 0.1 + Math.sin(a) * s * 0.5);
        ctx.lineTo(Math.cos(a) * s * 0.66, -s * 0.1 + Math.sin(a) * s * 0.66);
        ctx.stroke();
      }
      break;
    }
    case "steam":
      for (const [lw, col] of [[s * 0.2, "#fff"], [s * 0.1, "#fda4af"]] as [number, string][]) {
        ctx.lineWidth = lw;
        ctx.strokeStyle = col;
        for (let i = -1; i <= 1; i++) {
          const ph = (t * 0.6 + (i + 1) * 0.3) % 1;
          ctx.globalAlpha = 1 - ph * 0.7;
          ctx.beginPath();
          const bx = i * s * 0.3, by = s * 0.4 - ph * s * 0.4;
          ctx.moveTo(bx, by);
          ctx.bezierCurveTo(bx + s * 0.14, by - s * 0.2, bx - s * 0.14, by - s * 0.4, bx, by - s * 0.6);
          ctx.stroke();
        }
      }
      break;
    case "gloom":
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = s * 0.09;
      for (let i = 0; i < 5; i++) {
        const len = s * (0.45 + 0.25 * Math.sin(i * 2.3 + t * 2));
        ctx.beginPath();
        ctx.moveTo((i - 2) * s * 0.2, -s * 0.4);
        ctx.lineTo((i - 2) * s * 0.2, -s * 0.4 + len);
        ctx.stroke();
      }
      break;
    case "note": {
      ctx.rotate(0.2 * Math.sin(t * 5));
      const draw = (fillOnly: boolean) => {
        ctx.beginPath();
        ctx.ellipse(-s * 0.12, s * 0.3, s * 0.2, s * 0.15, -0.4, 0, Math.PI * 2);
        if (!fillOnly) ctx.stroke();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(s * 0.06, s * 0.28);
        ctx.lineTo(s * 0.06, -s * 0.45);
        ctx.quadraticCurveTo(s * 0.4, -s * 0.35, s * 0.34, -s * 0.05);
        ctx.stroke();
      };
      ctx.fillStyle = "#fff";
      ctx.lineWidth = s * 0.24;
      draw(false);
      ctx.strokeStyle = "#ec4899";
      ctx.fillStyle = "#ec4899";
      ctx.lineWidth = s * 0.1;
      draw(true);
      break;
    }
  }
  ctx.restore();
}
