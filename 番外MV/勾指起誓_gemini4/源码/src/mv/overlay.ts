import { FONT_FAMILY } from '../engine/fonts';
import { clamp01, ease, seg } from '../engine/kit';
import { cueAt, FPS, shotIndexAt, type Timeline } from '../engine/timeline';
import { LYRIC_TEXTS } from './cues';
import { SHOT_BY_ID } from './shots';

/** 在 2D 画布上带字距绘制文字，并精确返回总宽度（用于逐字金色扫色裁剪） */
function measureSpacedText(ctx: CanvasRenderingContext2D, text: string, spacing: number): number {
  let total = 0;
  for (let i = 0; i < text.length; i++) {
    total += ctx.measureText(text[i]).width;
    if (i < text.length - 1) total += spacing;
  }
  return total;
}

function drawSpacedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  startX: number,
  y: number,
  spacing: number,
  strokeWidth = 0,
) {
  let x = startX;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (strokeWidth > 0) ctx.strokeText(ch, x, y);
    ctx.fillText(ch, x, y);
    x += ctx.measureText(ch).width + spacing;
  }
}

/** 圆角矩形路径 */
function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * 绘制《童话镇》同款画面叠层：闪白 / 渐白 / 渐黑 + 序章片名卡 + 逐字金色扫色字幕条。
 * 实时播放器与离线 MP4 导出器共用此纯函数，确保所见即所得，且严守零水印、零角标红线。
 */
export function drawMvOverlay(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  frame: number,
  tl: Timeline,
  showLyrics = true,
) {
  const S = W / 1920;
  const t = frame / FPS;
  const si = shotIndexAt(tl, t);
  const st = tl.shots[si];
  const def = SHOT_BY_ID[st.id];
  const fx = def?.fx;
  const u = clamp01((t - st.a) / Math.max(0.001, st.b - st.a));

  // 1. 闪白 / 渐白 / 渐黑转场
  let white = 0;
  if (fx?.flash) {
    for (const p of fx.flash) {
      const dt = (u - p) * (st.b - st.a);
      if (dt >= 0 && dt < 0.22) white = Math.max(white, 1 - dt / 0.22);
    }
  }
  if (fx?.whiteOut) white = Math.max(white, ease(seg(u, 0.72, 1)));
  if (fx?.whiteIn) white = Math.max(white, 1 - ease(seg(u, 0, 0.24)));

  let black = 0;
  if (fx?.blackIn) black = Math.max(black, 1 - ease(seg(u, 0, 0.22)));
  if (fx?.blackOut) black = Math.max(black, ease(seg(u, 0.52, 0.96)));

  if (white > 0.005) {
    ctx.save();
    ctx.fillStyle = `rgba(255,252,244,${clamp01(white)})`;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // 2. 序章片名卡（仅 I1 中段柔雅显现，遵循《童话镇》极简双行样式）
  if (fx?.title) {
    const aIn = ease(seg(u, 0.16, 0.34));
    const aOut = 1 - ease(seg(u, 0.74, 0.92));
    const alpha = clamp01(aIn * aOut);
    if (alpha > 0.01) {
      ctx.save();
      ctx.globalAlpha = alpha;
      const dy = (1 - aIn) * 24 * S;
      const cy = H * 0.24 + dy;
      const mainText = '勾指起誓';
      const subText = '鲸鱼娘番外篇';

      ctx.font = `900 ${Math.round(112 * S)}px "${FONT_FAMILY}", "PingFang SC", "Microsoft YaHei", sans-serif`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'left';
      const spMain = 22 * S;
      const wMain = measureSpacedText(ctx, mainText, spMain);
      const xMain = (W - wMain) / 2;

      ctx.shadowColor = 'rgba(20,12,38,0.58)';
      ctx.shadowBlur = 24 * S;
      ctx.shadowOffsetY = 8 * S;
      ctx.lineWidth = 10 * S;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#24183d';
      ctx.fillStyle = '#fff5cc';
      drawSpacedText(ctx, mainText, xMain, cy, spMain, 10 * S);

      // 副标题细金饰线 + 小字
      ctx.shadowBlur = 12 * S;
      ctx.font = `700 ${Math.round(34 * S)}px "${FONT_FAMILY}", "PingFang SC", "Microsoft YaHei", sans-serif`;
      const spSub = 10 * S;
      const wSub = measureSpacedText(ctx, subText, spSub);
      const xSub = (W - wSub) / 2;
      const ySub = cy + 84 * S;
      ctx.lineWidth = 5 * S;
      ctx.strokeStyle = '#24183d';
      ctx.fillStyle = '#ffd866';
      drawSpacedText(ctx, subText, xSub, ySub, spSub, 5 * S);

      // 两侧金色细横线
      ctx.strokeStyle = 'rgba(255,216,102,0.85)';
      ctx.lineWidth = 3 * S;
      const lineLen = 58 * S;
      const gap = 22 * S;
      ctx.beginPath();
      ctx.moveTo(xSub - gap - lineLen, ySub);
      ctx.lineTo(xSub - gap, ySub);
      ctx.moveTo(xSub + wSub + gap, ySub);
      ctx.lineTo(xSub + wSub + gap + lineLen, ySub);
      ctx.stroke();

      ctx.restore();
    }
  }

  // 3. 《童话镇》同款居中歌词条（深靛蓝底 + 上下金线 + 逐字金色扫色）
  if (showLyrics) {
    const cue = cueAt(tl, t, 0, 0);
    if (cue) {
      const text = LYRIC_TEXTS[cue.i] ?? '';
      if (text) {
        const opacity = Math.min(1, (cue.age * FPS) / 4);
        const dy = (1 - Math.min(1, (cue.age * FPS) / 5)) * 16 * S;
        const fontSize = Math.round(58 * S);
        const spacing = 5 * S;
        const padX = 40 * S;
        const padTop = 14 * S;
        const padBottom = 16 * S;
        const borderH = 4 * S;
        const radius = 6 * S;

        ctx.save();
        ctx.globalAlpha = clamp01(opacity);
        ctx.font = `900 ${fontSize}px "${FONT_FAMILY}", "PingFang SC", "Microsoft YaHei", sans-serif`;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'left';

        const textW = measureSpacedText(ctx, text, spacing);
        const boxW = textW + padX * 2;
        const boxH = fontSize * 1.15 + padTop + padBottom;
        const boxX = (W - boxW) / 2;
        const boxY = H - 46 * S - boxH + dy;

        // 投影 + 深靛蓝圆角背景
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.38)';
        ctx.shadowBlur = 30 * S;
        ctx.shadowOffsetY = 8 * S;
        roundRectPath(ctx, boxX, boxY, boxW, boxH, radius);
        ctx.fillStyle = 'rgba(24,18,44,0.86)';
        ctx.fill();
        ctx.restore();

        // 上下金色边框（与 subtitles.tsx 的 borderTop / borderBottom 一致）
        ctx.fillStyle = '#ffd166';
        ctx.fillRect(boxX + radius * 0.4, boxY, boxW - radius * 0.8, borderH);
        ctx.fillRect(boxX + radius * 0.4, boxY + boxH - borderH, boxW - radius * 0.8, borderH);

        const textX = boxX + padX;
        const textY = boxY + boxH / 2 + 1 * S;

        // 底层白字
        ctx.fillStyle = '#ffffff';
        drawSpacedText(ctx, text, textX, textY, spacing);

        // 上层金色逐字扫色（clipPath inset 等价裁剪）
        const sweepW = textW * clamp01(cue.p);
        if (sweepW > 0.5) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(textX - 2 * S, boxY, sweepW + 4 * S, boxH);
          ctx.clip();
          ctx.fillStyle = '#ffd84a';
          drawSpacedText(ctx, text, textX, textY, spacing);
          ctx.restore();
        }

        ctx.restore();
      }
    }
  }

  // 4. 渐黑叠在最顶层（确保开场黑入 / 尾声黑出纯净收束）
  if (black > 0.005) {
    ctx.save();
    ctx.fillStyle = `rgba(8,6,16,${clamp01(black)})`;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
}
