// 给定时刻 t，把这一帧画出来（纯函数：任意跳转都得到同一帧）
import { View, clamp01, rgba } from './engine';
import { shotAt, resolveLook, type Frame } from './scenes';
import { LINES, beatInfo, SONG_END, VOCAL_END, BLOCK1 } from './timing';
import { drawLyrics, drawTitle } from './subtitles';

export function renderFrame(view: View, t: number) {
  const { ctx, W, H } = view;
  const shot = shotAt(t);
  const dur = shot.end - shot.start;
  const dt = t - shot.start;
  const u = clamp01(dt / dur);
  const beat = beatInfo(t);
  const line = shot.line !== undefined ? LINES[shot.line] : null;
  const f: Frame = { v: view, t, u, dt, dur, beat, W, H, line };
  view.look = resolveLook(shot, f);
  view.q.length = 0;
  ctx.save();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  shot.render(f);
  view.flush();
  ctx.restore();

  // 下拍时很轻的一下提亮（只在唱的时候）
  if (t > BLOCK1 - 0.1 && t < VOCAL_END) {
    ctx.fillStyle = rgba(255, 250, 235, 0.05 * beat.downPulse);
    ctx.fillRect(0, 0, W, H);
  }
  // 暗角
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 0.95);
  vg.addColorStop(0, 'rgba(20,20,45,0)');
  vg.addColorStop(1, 'rgba(20,20,45,0.32)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
  // 切镜的柔光
  if (shot.start > 0.1 && dt < 0.24) {
    ctx.fillStyle = rgba(255, 250, 240, 0.55 * (1 - dt / 0.24));
    ctx.fillRect(0, 0, W, H);
  }
  // 歌词
  drawLyrics(ctx, W, H, t);
  // 字卡
  drawTitle(ctx, W, H, t, { fadeIn: 0.9, fadeOut: 6.1, outDur: 0.9, sub: '慢 慢 来' });
  if (t > 172) drawTitle(ctx, W, H, t, { fadeIn: 172.7, fadeOut: 177.4, outDur: 1.0, sub: '慢 慢 来' });
  // 开头淡入、结尾淡出
  if (t < 1.3) {
    ctx.fillStyle = rgba(12, 14, 36, 1 - clamp01(t / 1.3));
    ctx.fillRect(0, 0, W, H);
  }
  if (t > SONG_END - 1.0) {
    ctx.fillStyle = rgba(255, 252, 246, clamp01((t - (SONG_END - 1.0)) / 1.0));
    ctx.fillRect(0, 0, W, H);
  }
}
