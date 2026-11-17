// 歌词条：逐字软 3D 字块，按词飞入，唱到哪个字哪个字亮起来、弹一下
import { LINES, LEAD, type LyricLine, charProgress } from './timing';
import { clamp01, ease, easeOut, lerp, mix, alpha, rgba } from './engine';

export const FONT = '"ZCOOL KuaiLe", "Noto Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Source Han Sans SC", sans-serif';

const isChorus = (i: number) => (i % 20 < 4) || (i >= 12 && i < 20) || i >= 28;

interface Palette {
  faceTop: string;
  faceBot: string;
  extrude: string;
  glow: string;
}
const CHORUS_P: Palette = { faceTop: '#fff6d2', faceBot: '#ffb86c', extrude: '#c7703e', glow: '#ffd27a' };
const VERSE_P: Palette = { faceTop: '#f3f7ff', faceBot: '#9fc3ff', extrude: '#4f6fb8', glow: '#a9c6ff' };
const IDLE_P: Palette = { faceTop: '#ffffff', faceBot: '#e7ebf7', extrude: '#5d678f', glow: '#ffffff' };

function softText(ctx: CanvasRenderingContext2D, ch: string, x: number, y: number, size: number, depth: number, pal: Palette, mixT: number, glowA: number) {
  // 挤出层
  const ex = mix(IDLE_P.extrude, pal.extrude, mixT);
  for (let i = depth; i >= 1; i--) {
    const k = i / depth;
    ctx.fillStyle = mix(ex, '#1a1f3a', k * 0.35);
    ctx.fillText(ch, x + i * 0.9, y + i * 1.15);
  }
  // 顶面
  const g = ctx.createLinearGradient(0, y - size * 0.95, 0, y + size * 0.12);
  g.addColorStop(0, mix(IDLE_P.faceTop, pal.faceTop, mixT));
  g.addColorStop(1, mix(IDLE_P.faceBot, pal.faceBot, mixT));
  ctx.fillStyle = g;
  if (glowA > 0.01) {
    ctx.shadowColor = alpha(pal.glow, glowA);
    ctx.shadowBlur = size * 0.5;
  }
  ctx.fillText(ch, x, y);
  ctx.shadowBlur = 0;
  ctx.shadowColor = 'transparent';
  // 细描边让字从背景里浮出来
  ctx.lineWidth = Math.max(1, size * 0.03);
  ctx.strokeStyle = rgba(255, 255, 255, 0.35 * mixT + 0.15);
  ctx.strokeText(ch, x, y);
}

function drawLine(ctx: CanvasRenderingContext2D, W: number, H: number, L: LyricLine, t: number, a: number) {
  const size = Math.round(H * 0.064);
  const adv = size * 1.1;
  const gap = size * 0.55;
  const n = L.chars.length;
  const width = n * adv + (L.words.length - 1) * gap;
  const x0 = (W - width) / 2 + adv / 2;
  const baseY = H * 0.885;
  const pal = isChorus(L.i) ? CHORUS_P : VERSE_P;
  ctx.save();
  ctx.font = `700 ${size}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  // 底部柔光衬底，保证任何背景上可读
  const g = ctx.createLinearGradient(0, baseY - size * 1.9, 0, H);
  g.addColorStop(0, 'rgba(20,24,50,0)');
  g.addColorStop(0.55, `rgba(20,24,50,${0.26 * a})`);
  g.addColorStop(1, `rgba(20,24,50,${0.4 * a})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, baseY - size * 1.9, W, H);

  L.chars.forEach((c, i) => {
    const x = x0 + i * adv + c.word * gap;
    // 按词飞入：词之间错开，词内再错开一点
    const inT = L.start - LEAD + c.word * 0.09 + (i - L.words.slice(0, c.word).join('').length) * 0.03;
    const appear = ease((t - inT) / 0.32);
    if (appear <= 0) return;
    const p = charProgress(c, t);
    const sung = t >= c.t;
    const k = clamp01((t - c.t) / 0.34);
    const pop = sung ? Math.sin(k * Math.PI) : 0;
    const mixT = sung ? clamp01((t - c.t) / 0.1) : 0;
    const singing = p >= 0 && p <= 1;
    const scale = (0.86 + 0.14 * appear) * (1 + 0.24 * pop);
    const lift = (1 - appear) * size * 0.6 + pop * size * 0.18 + (sung ? size * 0.04 : 0);
    const glowA = singing ? lerp(0.95, 0.45, p) : sung ? 0.18 : 0;
    ctx.save();
    ctx.globalAlpha = a * appear;
    ctx.translate(x, baseY - lift);
    ctx.scale(scale, scale);
    softText(ctx, c.ch, 0, 0, size, 5, pal, mixT, glowA);
    ctx.restore();
  });
  ctx.restore();
}

/** 画出此刻该在屏幕上的歌词（含飞入与收尾） */
export function drawLyrics(ctx: CanvasRenderingContext2D, W: number, H: number, t: number) {
  for (let i = 0; i < LINES.length; i++) {
    const L = LINES[i];
    const inStart = L.start - LEAD;
    const outStart = L.end - 0.55;
    const outEnd = L.end - 0.22;
    if (t < inStart || t > outEnd) continue;
    const a = t < outStart ? 1 : 1 - easeOut((t - outStart) / (outEnd - outStart));
    if (a <= 0.01) continue;
    drawLine(ctx, W, H, L, t, a);
  }
}

/** 片头字卡：歌名逐字弹入 */
export function drawTitle(ctx: CanvasRenderingContext2D, W: number, H: number, t: number, o: { fadeIn: number; fadeOut: number; outDur?: number; sub?: string; y?: number }) {
  const inA = clamp01((t - o.fadeIn) / 0.6);
  const outA = 1 - clamp01((t - o.fadeOut) / (o.outDur ?? 1));
  const a = Math.min(inA, outA);
  if (a <= 0) return;
  const title = '慌啥子嘛';
  const size = Math.round(H * 0.17);
  const adv = size * 1.12;
  const cy = (o.y ?? 0.44) * H;
  const x0 = W / 2 - (adv * (title.length - 1)) / 2;
  ctx.save();
  ctx.font = `700 ${size}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const pal: Palette = { faceTop: '#fffaf0', faceBot: '#ffc98a', extrude: '#c9865a', glow: '#ffe2a8' };
  for (let i = 0; i < title.length; i++) {
    const k = clamp01((t - o.fadeIn - i * 0.16) / 0.7);
    if (k <= 0) continue;
    const bounce = 1 - Math.pow(1 - k, 3);
    const drop = (1 - bounce) * size * 0.9;
    const wob = Math.sin(t * 1.6 + i * 1.2) * size * 0.025;
    ctx.save();
    ctx.globalAlpha = a * clamp01(k * 2);
    ctx.translate(x0 + i * adv, cy - drop + wob);
    const sc = 0.9 + 0.1 * bounce;
    ctx.scale(sc, sc);
    ctx.shadowColor = 'rgba(40,30,60,0.35)';
    ctx.shadowBlur = size * 0.25;
    ctx.shadowOffsetY = size * 0.08;
    softText(ctx, title[i], 0, size * 0.36, size, 9, pal, 1, 0.35);
    ctx.restore();
  }
  if (o.sub) {
    const ks = clamp01((t - o.fadeIn - 1.1) / 0.8);
    if (ks > 0) {
      const ss = Math.round(H * 0.052);
      ctx.font = `700 ${ss}px ${FONT}`;
      ctx.globalAlpha = a * ks;
      ctx.translate(W / 2, cy + size * 0.95 + (1 - ks) * 14);
      // 一条柔和的横线托着副题
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-ss * 3.2, -ss * 0.05);
      ctx.lineTo(-ss * 2.2, -ss * 0.05);
      ctx.moveTo(ss * 2.2, -ss * 0.05);
      ctx.lineTo(ss * 3.2, -ss * 0.05);
      ctx.stroke();
      softText(ctx, o.sub, 0, ss * 0.35, ss, 4, { faceTop: '#ffffff', faceBot: '#dfe9ff', extrude: '#6a7bb0', glow: '#ffffff' }, 1, 0.2);
    }
  }
  ctx.restore();
}
