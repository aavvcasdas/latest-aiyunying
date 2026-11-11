import fontData from "../assets/fontData";
import { W, H, FONT, clamp01 } from "./core";
import { cueAt, type Cue } from "./cues";
import { loadAtlas, type AtlasData } from "./three/actors";
import { Stage, type Frame, type ShotDef } from "./three/stage";
import { SHOTS } from "./three/shots";

let fontReady: Promise<void> | null = null;
/** 模板字体 ZCOOL KuaiLe（OFL），随包加载；失败直接报错 */
export function loadFont() {
  if (!fontReady) {
    fontReady = (async () => {
      const ff = new FontFace("ZCOOL KuaiLe", `url("${fontData}")`);
      await ff.load();
      document.fonts.add(ff);
      await document.fonts.ready;
    })();
  }
  return fontReady;
}

export async function loadAssets(): Promise<AtlasData> {
  await loadFont();
  return loadAtlas();
}

/** 一部片子 = 3D 舞台 + 2D 合成层（字幕、字卡、滤镜） */
export class Film {
  gl: HTMLCanvasElement;
  stage: Stage;
  ctx: CanvasRenderingContext2D;
  constructor(A: AtlasData, public out: HTMLCanvasElement, public w = W, public h = H) {
    this.gl = document.createElement("canvas");
    this.gl.width = w;
    this.gl.height = h;
    out.width = w;
    out.height = h;
    this.stage = new Stage(this.gl, w, h, A, SHOTS);
    this.ctx = out.getContext("2d", { alpha: false })!;
  }
  frame(T: number, user = false): { shot: ShotDef; f: Frame } {
    const r = this.stage.render(T, user);
    compose(this.ctx, this.gl, r.f, T, this.w, this.h);
    return r;
  }
  dispose() {
    this.stage.dispose();
  }
}

export function compose(ctx: CanvasRenderingContext2D, gl: HTMLCanvasElement, f: Frame, T: number, w: number, h: number) {
  const s = w / W;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (f.fx.sepia > 0) ctx.filter = `sepia(${f.fx.sepia}) saturate(${1 - f.fx.sepia * 0.25}) brightness(1.06) contrast(0.95)`;
  ctx.drawImage(gl, 0, 0, w, h);
  ctx.filter = "none";
  ctx.scale(s, s);
  // 暗角
  if (f.fx.vignette > 0) {
    const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.38, W / 2, H / 2, H * 0.98);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, `rgba(0,0,0,${f.fx.vignette})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }
  if (f.fx.sepia > 0) {
    ctx.globalAlpha = 0.06 * f.fx.sepia;
    for (let i = 0; i < 260; i++) {
      const k = f.frame * 7 + i * 13;
      const x = (Math.sin(k * 12.9898) * 43758.5453) % 1;
      const y = (Math.sin(k * 78.233) * 12543.123) % 1;
      ctx.fillStyle = i % 2 ? "#fff" : "#000";
      ctx.fillRect(Math.abs(x) * W, Math.abs(y) * H, 2, 2);
    }
    ctx.globalAlpha = 1;
  }
  if (f.fx.flash > 0) {
    ctx.globalAlpha = clamp01(f.fx.flash);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }
  if (f.fx.title) titleCard(ctx, f.fx.title, f.fx.titleA, T);
  const cue = cueAt(T);
  if (cue) lyric(ctx, cue, T);
  if (f.fx.black > 0) {
    ctx.globalAlpha = clamp01(f.fx.black);
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
}

function neon(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, color: string, a: number) {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.font = `${size}px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = color;
  for (const blur of [40, 18]) {
    ctx.shadowBlur = blur;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }
  ctx.shadowBlur = 6;
  ctx.fillStyle = "#fff6fb";
  ctx.fillText(text, x, y);
  ctx.restore();
}
function plain(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, color: string, a: number) {
  ctx.save();
  ctx.globalAlpha = a;
  ctx.font = `${size}px ${FONT}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = size * 0.16;
  ctx.strokeStyle = "rgba(10,6,20,0.85)";
  ctx.lineJoin = "round";
  ctx.strokeText(text, x, y);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function titleCard(ctx: CanvasRenderingContext2D, kind: "pre" | "end", a: number, T: number) {
  if (a <= 0) return;
  const flick = Math.sin(T * 37) > 0.93 ? 0.55 : 1;
  ctx.save();
  ctx.fillStyle = `rgba(4,2,12,${0.35 * a})`;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  neon(ctx, "坏女孩", W / 2, H / 2 - 50, 150, "#ff3d9a", a * flick);
  if (kind === "pre") {
    // 片头只留两行：歌名 + 歌手名。别的字（版本说明、主演、制作）一律不放。
    plain(ctx, "徐良 / 小凌", W / 2, H / 2 + 62, 34, "#ffd7ee", a);
  } else {
    plain(ctx, "主演  鲸鱼娘（坏女孩）  Claude", W / 2, H / 2 + 62, 30, "#ffd7ee", a);
    plain(ctx, "GPT 龙娘 · Kimi · Gemini · 千问 · 智谱 · 豆包", W / 2, H / 2 + 108, 24, "#bfe9ff", a * 0.9);
    plain(ctx, "FIN", W / 2, H - 96, 30, "#ffffff", a * 0.7);
  }
}

/** 歌词条：逐字染色（卡拉 OK） */
function lyric(ctx: CanvasRenderingContext2D, cue: Cue, T: number) {
  const a = Math.min(1, (T - (cue.start - 0.25)) / 0.2, (cue.end + 0.35 - T) / 0.25);
  if (a <= 0) return;
  const chars = [...cue.text];
  const n = chars.filter((c) => c !== " ").length;
  const fillDur = Math.min(cue.end - cue.start, 0.3 * n + 0.5) * 0.92;
  const prog = ((T - cue.start) / fillDur) * n;
  const size = 46;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.font = `${size}px ${FONT}`;
  ctx.textBaseline = "middle";
  const widths = chars.map((c) => (c === " " ? size * 0.5 : ctx.measureText(c).width));
  const tw = widths.reduce((p, v) => p + v, 0);
  const y = H - 64;
  const x0 = W / 2 - tw / 2;
  // 底带
  const band = ctx.createLinearGradient(0, y - 60, 0, H);
  band.addColorStop(0, "rgba(6,3,14,0)");
  band.addColorStop(1, "rgba(6,3,14,0.6)");
  ctx.fillStyle = band;
  ctx.fillRect(0, y - 60, W, H - y + 60);
  // 字幕里不出现歌手名（原来这里的「徐良 / 小凌」小药丸去掉了）；音色靠逐字染色的色相区分
  ctx.font = `${size}px ${FONT}`;
  ctx.lineJoin = "round";
  let x = x0;
  let j = 0;
  const grad = ctx.createLinearGradient(0, y - size / 2, 0, y + size / 2);
  grad.addColorStop(0, cue.singer === "小凌" ? "#ffd1ea" : "#d8f6ff");
  grad.addColorStop(1, cue.singer === "小凌" ? "#ff3d9a" : "#22b8ff");
  chars.forEach((c, i) => {
    const cw = widths[i];
    if (c !== " ") {
      ctx.lineWidth = 8;
      ctx.strokeStyle = "rgba(8,4,18,0.9)";
      ctx.strokeText(c, x, y);
      ctx.fillStyle = "#ffffff";
      ctx.fillText(c, x, y);
      const amt = clamp01(prog - j);
      if (amt > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(x - 2, y - size, cw * amt + 2, size * 2);
        ctx.clip();
        ctx.fillStyle = grad;
        ctx.fillText(c, x, y);
        ctx.restore();
      }
      j++;
    }
    x += cw;
  });
  ctx.restore();
}
