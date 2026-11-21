// 画笔：逻辑舞台 1280x720 上的基础绘制（像素精灵、光、文字、粒子）。
import type { Cast } from "./cast";

export const W = 1280;
export const H = 720;
export const TAU = Math.PI * 2;
export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
/** t 在 [a,b] 内的 0..1 进度 */
export const range = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const eOut = (p: number) => 1 - Math.pow(1 - p, 3);
export const eIO = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
export const eBack = (p: number) => {
  const c = 1.70158;
  return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2);
};
/** 稳定的伪随机 0..1 */
export const rnd = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const FONTS = {
  serif: '"MVSong","Noto Serif SC","Songti SC","SimSun",serif',
  sans: '"MVUI","PingFang SC","Microsoft YaHei","Noto Sans SC","Noto Sans CJK SC",system-ui,sans-serif',
  mono: 'ui-monospace,"SF Mono",Menlo,Consolas,"Noto Sans Mono",monospace',
};
const OUT8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7]];

export interface SpriteOpts {
  alpha?: number;
  flip?: boolean;
  rot?: number;
  fps?: number;
  /** 整个人画成剪影 */
  sil?: "dark" | "white";
  /** 染色（热忱的橙 / 自卑的蓝） */
  tint?: string;
  tintAmt?: number;
  /** 像素描边（比模糊发光更贴像素画风） */
  outline?: string;
  outlineW?: number;
  outlineA?: number;
  /** 0..1 压暗 */
  dim?: number;
}
export interface TextOpts {
  font?: keyof typeof FONTS;
  align?: CanvasTextAlign;
  base?: CanvasTextBaseline;
  weight?: number;
  alpha?: number;
  glow?: string;
  blur?: number;
}

/** 粒子形状 */
export const K = { dot: 0, glow: 1, cross: 2, rect: 3, petal: 4, ring: 5, heart: 6, streak: 7, star: 8 } as const;
export interface Part {
  k: number;
  x: number; y: number; vx: number; vy: number;
  g: number; drag: number;
  life: number; max: number;
  size: number; grow: number;
  hue: number; sat: number; lit: number; a: number;
  rot: number; vr: number; wob: number; seed: number;
  add: boolean;
}
interface Ring { x: number; y: number; r: number; a: number; hue: number }

export class Painter {
  c: CanvasRenderingContext2D;
  /** 本帧时间步长（秒） */
  dt = 0;
  private scale = 1;
  private partList: Part[] = [];
  private ringList: Ring[] = [];
  private tmpA = document.createElement("canvas");
  private tmpB = document.createElement("canvas");

  constructor(public canvas: HTMLCanvasElement, public cast: Cast) {
    this.c = canvas.getContext("2d")!;
  }

  /** 每帧核对画布分辨率——不依赖外部 resize 时序 */
  fit(): void {
    const cw = this.canvas.clientWidth || W;
    const ch = this.canvas.clientHeight || H;
    const dpr = Math.min(window.devicePixelRatio || 1, 2, 1920 / cw);
    const w = Math.max(2, Math.round(cw * dpr));
    const h = Math.max(2, Math.round(ch * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.scale = this.canvas.width / W;
  }

  begin(): void {
    const c = this.c;
    c.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    c.globalAlpha = 1;
    c.globalCompositeOperation = "source-over";
    c.clearRect(0, 0, W, H);
  }

  /** 镜头：以 (cx,cy) 为中心放大 z 倍 */
  cam(z: number, cx = W / 2, cy = H / 2): void {
    const c = this.c;
    c.translate(W / 2, H / 2);
    c.scale(z, z);
    c.translate(-cx, -cy);
  }

  // ---------- 光 ----------
  glow(x: number, y: number, r: number, hue: number, a: number, sat = 100, lit = 65, add = false): void {
    if (a <= 0 || r <= 0) return;
    const c = this.c;
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `hsla(${hue},${sat}%,${lit}%,${a})`);
    g.addColorStop(1, `hsla(${hue},${sat}%,${lit}%,0)`);
    if (add) c.globalCompositeOperation = "lighter";
    c.fillStyle = g;
    c.fillRect(x - r, y - r, r * 2, r * 2);
    if (add) c.globalCompositeOperation = "source-over";
  }

  /** 光柱：从 (x0,y0) 半宽 w0 打到 (x1,y1) 半宽 w1 */
  beam(x0: number, y0: number, x1: number, y1: number, w0: number, w1: number, hue: number, a: number, lit = 78): void {
    if (a <= 0) return;
    const c = this.c;
    const g = c.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, `hsla(${hue},100%,${lit}%,${a})`);
    g.addColorStop(1, `hsla(${hue},100%,${lit}%,0)`);
    c.fillStyle = g;
    c.beginPath();
    c.moveTo(x0 - w0, y0);
    c.lineTo(x0 + w0, y0);
    c.lineTo(x1 + w1, y1);
    c.lineTo(x1 - w1, y1);
    c.closePath();
    c.fill();
  }

  // ---------- 路径 ----------
  rr(x: number, y: number, w: number, h: number, r: number): void {
    const c = this.c;
    const q = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + q, y);
    c.arcTo(x + w, y, x + w, y + h, q);
    c.arcTo(x + w, y + h, x, y + h, q);
    c.arcTo(x, y + h, x, y, q);
    c.arcTo(x, y, x + w, y, q);
    c.closePath();
  }

  star(x: number, y: number, r: number, rot = -Math.PI / 2, inner = 0.45): void {
    const c = this.c;
    c.beginPath();
    for (let i = 0; i < 10; i++) {
      const rr = i % 2 ? r * inner : r;
      const a = rot + (i * Math.PI) / 5;
      if (i === 0) c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
      else c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    c.closePath();
  }

  heart(x: number, y: number, s: number): void {
    const c = this.c;
    c.beginPath();
    c.moveTo(x, y + s * 0.9);
    c.bezierCurveTo(x - s * 1.3, y - s * 0.1, x - s * 0.6, y - s * 1.1, x, y - s * 0.35);
    c.bezierCurveTo(x + s * 0.6, y - s * 1.1, x + s * 1.3, y - s * 0.1, x, y + s * 0.9);
    c.closePath();
  }

  poly(pts: number[]): void {
    const c = this.c;
    c.beginPath();
    c.moveTo(pts[0], pts[1]);
    for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
    c.closePath();
  }

  vgrad(y0: number, y1: number, top: string, bottom: string): CanvasGradient {
    const g = this.c.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, top);
    g.addColorStop(1, bottom);
    return g;
  }

  text(s: string, x: number, y: number, px: number, color: string, o: TextOpts = {}): void {
    const c = this.c;
    c.save();
    c.font = `${o.weight ?? 700} ${px}px ${FONTS[o.font ?? "sans"]}`;
    c.textAlign = o.align ?? "center";
    c.textBaseline = o.base ?? "middle";
    if (o.alpha !== undefined) c.globalAlpha *= o.alpha;
    if (o.glow) {
      c.shadowColor = o.glow;
      c.shadowBlur = o.blur ?? 12;
    }
    c.fillStyle = color;
    c.fillText(s, x, y);
    c.restore();
  }

  // ---------- 像素精灵 ----------
  /** 角色动画帧：脚底踩在 (x,y)，身高按 idle 帧算 h */
  sprite(char: string, action: string, animT: number, x: number, y: number, h: number, o: SpriteOpts = {}): void {
    const fr = this.cast.frames(char, action);
    const f = fr[Math.floor(Math.max(0, animT) * (o.fps ?? 9)) % fr.length];
    this.blit(f, x, y, h / this.cast.ref(char), o);
  }

  /** 单帧（道具 / 特效 / 头像 / 高清立绘）：底边中点在 (x,y)，按倍数缩放 */
  single(name: string, x: number, y: number, s: number, o: SpriteOpts = {}): void {
    const f = this.cast.single(name);
    if (f) this.blit(f, x, y, s, o);
  }

  private blit(f: number[], x: number, y: number, s: number, o: SpriteOpts): void {
    const c = this.c;
    const cast = this.cast;
    const [fx, fy, fw, fh] = f;
    const w = fw * s;
    const h = fh * s;
    c.save();
    c.imageSmoothingEnabled = s < 1.6; // 放大时保持像素颗粒，缩小时才平滑
    c.translate(Math.round(x), Math.round(y));
    if (o.rot) c.rotate(o.rot);
    if (o.flip) c.scale(-1, 1);
    const a = c.globalAlpha * (o.alpha ?? 1);
    if (o.outline) {
      const tb = this.tmpB;
      tb.width = fw;
      tb.height = fh;
      const x2 = tb.getContext("2d")!;
      x2.drawImage(cast.white, fx, fy, fw, fh, 0, 0, fw, fh);
      x2.globalCompositeOperation = "source-in";
      x2.fillStyle = o.outline;
      x2.fillRect(0, 0, fw, fh);
      const d = o.outlineW ?? 2;
      c.globalAlpha = a * (o.outlineA ?? 1);
      for (const [dx, dy] of OUT8) c.drawImage(tb, -w / 2 + dx * d, -h + dy * d, w, h);
    }
    c.globalAlpha = a;
    if (o.sil) {
      c.drawImage(o.sil === "dark" ? cast.dark : cast.white, fx, fy, fw, fh, -w / 2, -h, w, h);
    } else if (o.tint) {
      const ta = this.tmpA;
      ta.width = fw;
      ta.height = fh;
      const x1 = ta.getContext("2d")!;
      x1.drawImage(cast.img, fx, fy, fw, fh, 0, 0, fw, fh);
      x1.globalCompositeOperation = "source-atop";
      x1.globalAlpha = o.tintAmt ?? 0.55;
      x1.fillStyle = o.tint;
      x1.fillRect(0, 0, fw, fh);
      c.drawImage(ta, -w / 2, -h, w, h);
    } else {
      c.drawImage(cast.img, fx, fy, fw, fh, -w / 2, -h, w, h);
    }
    if (o.dim) {
      c.globalAlpha = a * o.dim;
      c.drawImage(cast.dark, fx, fy, fw, fh, -w / 2, -h, w, h);
    }
    c.restore();
  }

  // ---------- 粒子 ----------
  /** 按"每秒 rate 个"算出本帧该生成几个（与帧率无关） */
  emit(rate: number): number {
    const n = rate * this.dt;
    const k = Math.floor(n);
    return k + (Math.random() < n - k ? 1 : 0);
  }

  spawn(o: Partial<Part> & { x: number; y: number }): void {
    if (this.partList.length > 900) this.partList.shift();
    this.partList.push({
      k: K.dot, vx: 0, vy: 0, g: 0, drag: 0, life: 0, max: 1, size: 3, grow: 0,
      hue: 220, sat: 90, lit: 75, a: 1, rot: 0, vr: 0, wob: 0, seed: Math.random() * 100, add: false,
      ...o,
    });
  }

  clearParts(): void {
    this.partList.length = 0;
  }

  /** 推进并绘制粒子（由各分镜在自己的镜头变换内调用，层次由调用位置决定） */
  drawParts(t: number): void {
    const c = this.c;
    const dt = this.dt;
    for (let i = this.partList.length - 1; i >= 0; i--) {
      const p = this.partList[i];
      p.life += dt;
      if (p.life >= p.max) {
        this.partList.splice(i, 1);
        continue;
      }
      const k = p.life / p.max;
      p.vy += p.g * dt;
      if (p.drag) {
        const d = Math.max(0, 1 - p.drag * dt);
        p.vx *= d;
        p.vy *= d;
      }
      p.x += (p.vx + Math.sin(t * 3 + p.seed * 7) * p.wob) * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      const env = Math.min(1, k / 0.12) * (1 - Math.max(0, (k - 0.55) / 0.45));
      const alpha = p.a * env;
      if (alpha <= 0.004) continue;
      const size = p.size * (1 + p.grow * k);
      const col = `hsla(${p.hue},${p.sat}%,${p.lit}%,${alpha})`;
      c.save();
      if (p.add) c.globalCompositeOperation = "lighter";
      c.translate(p.x, p.y);
      switch (p.k) {
        case K.glow: {
          const g = c.createRadialGradient(0, 0, 0, 0, 0, size * 3);
          g.addColorStop(0, col);
          g.addColorStop(1, `hsla(${p.hue},${p.sat}%,${p.lit}%,0)`);
          c.fillStyle = g;
          c.fillRect(-size * 3, -size * 3, size * 6, size * 6);
          break;
        }
        case K.cross: {
          c.strokeStyle = col;
          c.lineWidth = Math.max(1.5, size * 0.14);
          c.beginPath();
          c.moveTo(-size, 0); c.lineTo(size, 0);
          c.moveTo(0, -size); c.lineTo(0, size);
          c.moveTo(-size * 0.4, -size * 0.4); c.lineTo(size * 0.4, size * 0.4);
          c.moveTo(size * 0.4, -size * 0.4); c.lineTo(-size * 0.4, size * 0.4);
          c.stroke();
          break;
        }
        case K.rect: {
          c.rotate(p.rot);
          c.scale(1, Math.cos(p.rot * 2.3 + p.seed));
          c.fillStyle = col;
          c.fillRect(-size, -size * 0.62, size * 2, size * 1.24);
          break;
        }
        case K.petal: {
          c.rotate(p.rot);
          c.fillStyle = col;
          c.beginPath();
          c.ellipse(0, 0, size, size * 0.5, 0, 0, TAU);
          c.fill();
          break;
        }
        case K.ring: {
          c.strokeStyle = col;
          c.lineWidth = 1.6;
          c.beginPath();
          c.arc(0, 0, size, 0, TAU);
          c.stroke();
          c.fillStyle = `hsla(${p.hue},${p.sat}%,95%,${alpha * 0.8})`;
          c.beginPath();
          c.arc(-size * 0.35, -size * 0.35, size * 0.18, 0, TAU);
          c.fill();
          break;
        }
        case K.heart: {
          c.rotate(Math.sin(t * 4 + p.seed) * 0.25);
          c.fillStyle = col;
          this.heart(0, 0, size);
          c.fill();
          break;
        }
        case K.streak: {
          c.strokeStyle = col;
          c.lineWidth = size;
          c.lineCap = "round";
          c.beginPath();
          c.moveTo(0, 0);
          c.lineTo(-p.vx * 0.035, -p.vy * 0.035);
          c.stroke();
          break;
        }
        case K.star: {
          c.fillStyle = col;
          this.star(0, 0, size, p.rot);
          c.fill();
          break;
        }
        default: {
          c.fillStyle = col;
          c.beginPath();
          c.arc(0, 0, size, 0, TAU);
          c.fill();
        }
      }
      c.restore();
    }
  }

  // ---------- 词卡点冲击环 ----------
  ring(x: number, y: number, hue: number): void {
    this.ringList.push({ x, y, r: 10, a: 0.9, hue });
    if (this.ringList.length > 20) this.ringList.shift();
  }

  drawRings(): void {
    const c = this.c;
    for (let i = this.ringList.length - 1; i >= 0; i--) {
      const r = this.ringList[i];
      r.r += 640 * this.dt;
      r.a -= 1.9 * this.dt;
      if (r.a <= 0) {
        this.ringList.splice(i, 1);
        continue;
      }
      c.save();
      c.globalCompositeOperation = "lighter";
      c.strokeStyle = `hsla(${r.hue},100%,72%,${r.a * 0.8})`;
      c.lineWidth = 2.5;
      c.beginPath();
      c.arc(r.x, r.y, r.r, 0, TAU);
      c.stroke();
      c.restore();
    }
  }
}
