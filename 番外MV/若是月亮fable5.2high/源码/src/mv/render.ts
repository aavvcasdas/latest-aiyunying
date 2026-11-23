// 《若是月亮还没来》满月篇 渲染器（对外入口）
// 布景件在 stage.ts，回忆件在 memory.ts，二十五个镜头在 shots.ts。
import { W, H, LW, LH, FONT, clamp, lerp, ease, easeOut, backOut, sstep, text } from "./stage";
import { LINES, SHOTS, PRE, END, type Shot } from "./data";
import type { Assets } from "./assets";
import { SHOT_FN } from "./shots";
import { grain } from "./memory";
export { W, H, FONT } from "./stage";

// 镜头大字（这一镜的词）
const WORD_POS: Record<string, [number, number, number]> = {
  S01: [190, 230, 86], S02: [250, 200, 96], S03: [1050, 200, 84], S04: [990, 220, 96], S05: [640, 170, 90], S06: [640, 200, 128], S07: [400, 200, 92],
  S08: [230, 190, 92], S09: [640, 140, 84], S10: [790, 120, 88], S11: [1110, 250, 84], S12: [640, 290, 112], S13: [300, 220, 88], S14: [1010, 210, 92],
  S15: [1060, 210, 84], S16: [1000, 112, 84], S17: [1000, 112, 84], S18: [720, 104, 116], S19: [640, 200, 96], S20: [1040, 190, 92], S21: [640, 118, 84],
  S22: [1040, 150, 96], S23: [640, 170, 92], S24: [640, 150, 100],
};
function shotWord(c: CanvasRenderingContext2D, s: Shot, T: number) {
  const pos = WORD_POS[s.id]; if (!s.word || !pos) return;
  const lt = T - s.t0, dur = s.t1 - s.t0, a = Math.min(sstep(0, 0.1, lt), 1 - sstep(dur - 0.08, dur, lt));
  if (a <= 0) return;
  c.save(); c.translate(pos[0], pos[1]); const sc = lerp(0.72, 1, backOut(lt / 0.3)); c.scale(sc, sc);
  text(c, s.word, 0, 0, pos[2], { alpha: a * 0.9, glow: "rgba(255,214,150,0.85)", blur: 24, color: "#fff8ea" }); c.restore();
}
function lyrics(c: CanvasRenderingContext2D, T: number) {
  for (let li = 0; li < LINES.length; li++) {
    const L = LINES[li], next = LINES[li + 1]?.chars[0] ?? 99, stop = Math.min(next - 0.12, L.end + 0.9);
    if (T < L.chars[0] - 0.3 || T >= stop) continue;
    const a = Math.min(sstep(L.chars[0] - 0.3, L.chars[0] - 0.08, T), 1 - sstep(stop - 0.25, stop, T));
    const chars = [...L.text], y = 664;
    c.save(); c.globalAlpha = a;
    const g = c.createLinearGradient(0, y - 56, 0, H); g.addColorStop(0, "rgba(5,6,20,0)"); g.addColorStop(1, "rgba(5,6,20,0.6)"); c.fillStyle = g; c.fillRect(0, y - 56, W, H - y + 56);
    c.font = `46px ${FONT}`; c.textBaseline = "middle"; c.textAlign = "left";
    const ws = chars.map((ch) => c.measureText(ch).width + 8), total = ws.reduce((s, v) => s + v, 0);
    let x = W / 2 - total / 2;
    chars.forEach((ch, i) => {
      const k = clamp((T - L.chars[i]) / 0.14), lift = T >= L.chars[i] ? (1 - easeOut((T - L.chars[i]) / 0.25)) * 7 : 0;
      c.shadowColor = k > 0 ? "rgba(255,196,110,0.95)" : "rgba(0,0,0,0.6)"; c.shadowBlur = k > 0 ? 16 * k : 6;
      c.fillStyle = k > 0 ? `rgba(255,${Math.round(lerp(255, 242, k))},${Math.round(lerp(255, 212, k))},${0.5 + 0.5 * k})` : "rgba(226,230,255,0.42)";
      c.fillText(ch, x, y - lift); x += ws[i];
    });
    c.restore();
  }
}
function vignette(c: CanvasRenderingContext2D) {
  const g = c.createRadialGradient(W / 2, H / 2, H * 0.36, W / 2, H / 2, H * 0.98); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,12,0.55)");
  c.fillStyle = g; c.fillRect(0, 0, W, H);
}

// ---------- 对外 ----------
type Target = { c: CanvasRenderingContext2D; lrc: HTMLCanvasElement; lr: CanvasRenderingContext2D };
function makeTarget(cv: HTMLCanvasElement): Target { const lrc = document.createElement("canvas"); lrc.width = LW; lrc.height = LH; return { c: cv.getContext("2d")!, lrc, lr: lrc.getContext("2d")! }; }
export function shotIndexAt(T: number) { const i = SHOTS.findIndex((s) => T >= s.t0 && T < s.t1); return i < 0 ? (T < 0 ? 0 : SHOTS.length - 1) : i; }

export class Renderer {
  private main: Target; private buf: Target; private bufCanvas: HTMLCanvasElement;
  constructor(canvas: HTMLCanvasElement, private A: Assets) {
    canvas.width = W; canvas.height = H; this.main = makeTarget(canvas);
    this.bufCanvas = document.createElement("canvas"); this.bufCanvas.width = W; this.bufCanvas.height = H; this.buf = makeTarget(this.bufCanvas);
  }
  render(T: number) {
    T = clamp(T, -PRE, END - 0.001);
    const i = shotIndexAt(T), s = SHOTS[i], c = this.main.c, lt = T - s.t0;
    this.drawShot(this.main, i, T);
    if (s.fade && lt < s.fade && i > 0) { this.drawShot(this.buf, i - 1, T); c.save(); c.globalAlpha = 1 - ease(lt / s.fade); c.drawImage(this.bufCanvas, 0, 0); c.restore(); }
    grain(c, T);
    lyrics(c, T);
    const black = Math.max(1 - sstep(-PRE, -PRE + 0.9, T), sstep(END - 0.8, END, T));
    if (black > 0) { c.fillStyle = `rgba(0,0,0,${black})`; c.fillRect(0, 0, W, H); }
  }
  private drawShot(tg: Target, i: number, T: number) {
    const s = SHOTS[i], fn = SHOT_FN[s.id];
    if (!fn) throw new Error(`缺镜头：${s.id}`);
    tg.c.save(); tg.c.clearRect(0, 0, W, H);
    fn({ c: tg.c, lr: tg.lr, lrc: tg.lrc, T, lt: T - s.t0, u: clamp((T - s.t0) / (s.t1 - s.t0)), s, A: this.A });
    tg.c.restore();
    tg.c.save(); vignette(tg.c); shotWord(tg.c, s, T); tg.c.restore();
  }
}
