import { FH, FW, charCues, clamp, type Cue, type Look } from "@/lib/mv";

/**
 * 出片用的字幕条：把 LyricBar 那套排版画进 2D canvas，而不是叠 DOM。
 *
 * 为什么另写一份：出片走「canvas.toBlob() → 逐帧写盘」，一次读回只要 1 秒；
 * 而整页截图（DOM 叠层一起拍）在 SwiftShader 下要 6 秒一帧，全片十几个小时。
 * 所以画面与字幕必须在同一张 canvas 上合成。
 *
 * 排版口径对齐 LyricBar（同一套 LyricTone.gold）：
 *   · 纸条在画面底部，离底 38px，上下各 4px 金边，三层厚度
 *   · 整句一次出现；唱到的词底下亮一条金线；唱到的字往前顶、由白转金
 */
export const TONE: Record<"bar"|"edge"|"dim"|"sung"|"hot"|"glow", string> = {
  bar: "rgba(24,18,44,.86)",
  edge: "#ffd166",
  dim: "rgba(255,255,255,.44)",
  sung: "#ffd84a",
  hot: "#fff6d8",
  glow: "rgba(255,209,102,.55)",
} as const;

const FONT = (px: number) => `${px}px "ZCOOL KuaiLe", "PingFang SC", "Noto Sans CJK SC", sans-serif`;

export class LyricCanvas {
  /** 字体就绪标记；字体没下来之前画的是兜底字体，字形宽度会变 */
  ready = false;
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    const c = canvas.getContext("2d");
    if (!c) throw new Error("拿不到 2D 上下文");
    this.ctx = c;
  }

  async loadFonts() {
    try {
      await (document as unknown as { fonts: FontFaceSet }).fonts.load(FONT(62), "背对背拥抱");
      await (document as unknown as { fonts: FontFaceSet }).fonts.ready;
    } catch {
      /* 字体加载失败就用兜底字体 */
    }
    this.ready = true;
  }

  /** 把这一帧的字幕画上去（cue.text 为空就什么也不画） */
  draw(cue: Cue, t: number, energy: number) {
    if (!cue.text) return;
    const g = this.ctx;
    const chars = charCues(cue);
    if (chars.length === 0) return;

    // 词分组（同 LyricBar：相邻同词的字并到一组）
    const words: Array<{ word: string; from: number; to: number }> = [];
    chars.forEach((c, i) => {
      const last = words[words.length - 1];
      if (last && i > 0 && c.w === chars[i - 1].w) last.to = i;
      else words.push({ word: c.word, from: i, to: i });
    });

    const n = cue.text.length;
    const size = n > 10 ? 44 : n > 8 ? 50 : n > 6 ? 56 : 62;
    const track = n > 9 ? 3 : 7;

    g.save();
    g.textBaseline = "middle";
    g.textAlign = "left";
    g.font = FONT(size);

    // 量一遍宽度：字距 + 词间距
    const gapBetween = (w: string) => (w.length > 1 ? 3 : 0);
    const glyphW = chars.map((c) => g.measureText(c.ch).width + track);
    let innerW = 0;
    words.forEach((w) => {
      for (let i = w.from; i <= w.to; i++) innerW += glyphW[i];
      innerW += gapBetween(w.word);
    });

    // 纸条几何
    const padX = 46;
    const padY = 14;
    const barW = innerW + padX * 2 - track;
    const barH = size * 1.2 + padY * 2 + 2;
    const cx = FW / 2;
    const bottom = FH - 38;
    const left = cx - barW / 2;
    const top = bottom - barH;

    /* ---------- 三层纸条（后两层往上错开，做出厚度） ---------- */
    const layer = (offY: number, grow: number, fill: string, edge: string) => {
      const x = left - grow;
      const y = top + offY - grow;
      const w = barW + grow * 2;
      const h = barH + grow * 2;
      g.fillStyle = fill;
      roundRect(g, x, y, w, h, 6);
      g.fill();
      g.fillStyle = edge;
      g.fillRect(x, y, w, 4);
      g.fillRect(x, y + h - 4, w, 4);
    };
    layer(6, 2.5, "rgba(10,6,22,.92)", "rgba(255,209,102,.40)");
    layer(3, 1.2, "rgba(16,11,32,.90)", "rgba(255,209,102,.65)");

    // 主纸条
    g.fillStyle = TONE.bar;
    roundRect(g, left, top, barW, barH, 6);
    g.fill();
    g.strokeStyle = "rgba(255,209,102,.75)";
    g.lineWidth = 2;
    roundRect(g, left + 1, top + 1, barW - 2, barH - 2, 6);
    g.stroke();
    g.fillStyle = TONE.edge;
    g.fillRect(left, top, barW, 4);
    g.fillRect(left, top + barH - 4, barW, 4);

    // 能量发光（shadowBlur 开销大，只对纸条画一次很淡的边）
    const glowA = 0.18 + energy * 0.5;
    g.strokeStyle = `rgba(255,209,102,${glowA.toFixed(3)})`;
    g.lineWidth = 3;
    roundRect(g, left - 2, top - 2, barW + 4, barH + 4, 8);
    g.stroke();

    /* ---------- 逐字 ---------- */
    const baseY = top + barH / 2;
    let x = left + padX;
    const lineY = top + barH - 13; // 词下金线

    words.forEach((w) => {
      const wordStart = x;
      const wordEnd = x + glyphW.slice(w.from, w.to + 1).reduce((s, v) => s + v, 0) - track;

      // 词下的金线：这个词正在唱时亮
      const on = t >= chars[w.from].t0 - 0.02 && t <= chars[w.to].t1 + 0.14;
      if (on) {
        const lg = g.createLinearGradient(wordStart, 0, wordEnd, 0);
        lg.addColorStop(0, "rgba(255,209,102,0)");
        lg.addColorStop(0.5, TONE.edge);
        lg.addColorStop(1, "rgba(255,209,102,0)");
        g.fillStyle = lg;
        g.fillRect(wordStart - 2, lineY, wordEnd - wordStart + 4, 4);
      }

      for (let i = w.from; i <= w.to; i++) {
        const c = chars[i];
        const span = Math.max(0.08, c.t1 - c.t0);
        const p = clamp((t - c.t0) / span);
        let lift = 0; // 往上顶多少
        let scale = 1;
        let color = TONE.dim;
        let glow = 0;
        // translateZ 在 2D 里换成「放大 + 微微上抬」：抬太高会压到上一行，字会打架
        if (t >= c.t1) {
          const settle = clamp((t - c.t1) / 0.3);
          lift = 3 * (1 - settle);
          scale = 1 + 0.07 * (1 - settle);
          color = TONE.sung;
          glow = 16 * (1 - settle);
        } else if (t >= c.t0) {
          const kick = Math.sin(Math.PI * p);
          const beat = energy * 0.55;
          lift = 5 + 5 * kick + 4 * beat;
          scale = 1 + 0.22 * kick + 0.12 * beat;
          color = p > 0.4 ? TONE.hot : "#ffffff";
          glow = 20 + 34 * kick;
        } else {
          const near = clamp(1 - (c.t0 - t) / 0.55);
          lift = -2 + 3 * near;
          scale = 1 + 0.03 * near;
        }

        g.save();
        g.translate(x + glyphW[i] / 2, baseY - lift);
        g.scale(scale, scale);
        g.textAlign = "center";

        // 厚度（DOM 里是 4 层 text-shadow，这里叠两层就够）
        g.fillStyle = color === TONE.dim ? "#3a2c5c" : "#b06a2c";
        g.fillText(c.ch, 0, 4);
        g.fillText(c.ch, 0, 2);

        if (glow > 0) {
          g.shadowColor = TONE.glow;
          g.shadowBlur = glow;
        }
        g.fillStyle = color;
        g.fillText(c.ch, 0, 0);
        g.restore();

        x += glyphW[i];
      }
      x += gapBetween(w.word);
    });

    g.restore();
  }
}

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  g.beginPath();
  g.moveTo(x + rr, y);
  g.lineTo(x + w - rr, y);
  g.quadraticCurveTo(x + w, y, x + w, y + rr);
  g.lineTo(x + w, y + h - rr);
  g.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  g.lineTo(x + rr, y + h);
  g.quadraticCurveTo(x, y + h, x, y + h - rr);
  g.lineTo(x, y + rr);
  g.quadraticCurveTo(x, y, x + rr, y);
  g.closePath();
}

/**
 * 片内字卡（前奏 / 间奏 / 落幅）：大标题 + 一行小注。
 * 口径照 App 里那块 DOM 字卡：居中、顶部 13% 起、微旋 -1.2°、白字带墨线厚边。
 */
export function drawCard(g: CanvasRenderingContext2D, card: { title: string; sub?: string }, big: boolean, look: Look) {
  const size = big ? 96 : 62;
  const track = big ? 14 : 8;
  const cx = FW / 2;
  const y = FH * 0.13;

  g.save();
  g.textAlign = "center";
  g.textBaseline = "top";
  g.translate(cx, y);
  g.rotate((-1.2 * Math.PI) / 180);

  g.font = FONT(size);
  const chars = [...card.title];
  const widths = chars.map((c) => g.measureText(c).width);
  const total = widths.reduce((a, b) => a + b, 0) + track * (chars.length - 1);
  let x = -total / 2;
  chars.forEach((c, i) => {
    // 墨线厚边：往下叠两层
    g.fillStyle = look.ink;
    g.fillText(c, x + widths[i] / 2, 6);
    g.fillText(c, x + widths[i] / 2, 3);
    g.fillStyle = "#fff6d8";
    g.fillText(c, x + widths[i] / 2, 0);
    x += widths[i] + track;
  });

  if (card.sub) {
    const subSize = big ? 24 : 19;
    const subTrack = 6;
    g.font = FONT(subSize);
    const sw = [...card.sub].map((c) => g.measureText(c).width);
    const sTotal = sw.reduce((a, b) => a + b, 0) + subTrack * (sw.length - 1);
    const padX = 20;
    const h = subSize + 14;
    const top = size + 14;
    g.fillStyle = "rgba(16,10,32,.45)";
    roundRect(g, -sTotal / 2 - padX, top, sTotal + padX * 2, h, h / 2);
    g.fill();
    g.strokeStyle = `${look.light}66`;
    g.lineWidth = 1.5;
    roundRect(g, -sTotal / 2 - padX, top, sTotal + padX * 2, h, h / 2);
    g.stroke();
    g.fillStyle = look.paper;
    g.textBaseline = "middle";
    let sx = -sTotal / 2;
    [...card.sub].forEach((c, i) => {
      g.fillText(c, sx + sw[i] / 2, top + h / 2);
      sx += sw[i] + subTrack;
    });
  }
  g.restore();
}
