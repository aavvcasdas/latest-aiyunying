// 引擎：给一个时间点画出这一帧（无随机、无累积状态）。镜头画面 → 转场特效 → 片头字卡 → 歌词条。
import { CAST_IDS, type CastId, hasAction, hasSprite, loadAtlas, rectOf } from './atlas';
import { clamp, ease, FONT, GOLD, H, INK, lerp, W } from './kit';
import { SHOTS_A } from './shots/shotsA';
import { SHOTS_B } from './shots/shotsB';
import { SHOTS_C } from './shots/shotsC';
import { beatAt, LINES, lineAt, planShots, type Shot, shotAt } from './timeline';

export const TITLE = { main: '勾指起誓', sub: '洛天依 · 词曲 ilem' };

export class FilmEngine {
  readonly shots: Shot[];
  constructor() {
    this.shots = planShots([...SHOTS_A, ...SHOTS_B, ...SHOTS_C]);
  }

  shotIndex(T: number): number { return shotAt(this.shots, T); }

  /** opts.lyrics === false 时不画底部歌词条（出封面静帧用，成片一律带歌词） */
  render(ctx: CanvasRenderingContext2D, T: number, opts?: { lyrics?: boolean }): void {
    const i = this.shotIndex(T);
    const s = this.shots[i];
    const t = T - s.start, dur = s.end - s.start, u = clamp(t / dur);
    const bt = beatAt(T);
    const { line, lineU } = lineAt(T);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    s.draw({ ctx, T, t, u, dur, bt, line, lineU, shotBeat: (T - s.start) / (60 / 85.01) });
    ctx.restore();
    this.fx(ctx, s, t, dur);
    if (s.fx?.title) this.titleCard(ctx, t);
    if (line >= 0 && opts?.lyrics !== false) this.lyric(ctx, line, lineU, T);
  }

  private fx(ctx: CanvasRenderingContext2D, s: Shot, t: number, dur: number): void {
    const f = s.fx;
    if (!f) return;
    const white = (a: number) => { if (a > 0.005) { ctx.fillStyle = `rgba(255,251,240,${clamp(a)})`; ctx.fillRect(0, 0, W, H); } };
    const black = (a: number) => { if (a > 0.005) { ctx.fillStyle = `rgba(8,6,8,${clamp(a)})`; ctx.fillRect(0, 0, W, H); } };
    if (f.flashIn) white(Math.exp(-t * 7) * 0.92);
    if (f.whiteIn) white(1 - ease(t / f.whiteIn));
    if (f.whiteOut) white(ease((t - (dur - f.whiteOut)) / f.whiteOut));
    if (f.fadeIn) black(1 - ease(t / f.fadeIn));
    if (f.fadeOut) black(ease((t - (dur - f.fadeOut)) / f.fadeOut));
  }

  /** 片头：只留歌名与歌手名两行 */
  private titleCard(ctx: CanvasRenderingContext2D, t: number): void {
    const a = ease((t - 1.0) / 1.2) * (1 - ease((t - 5.4) / 1.2));
    if (a <= 0) return;
    const rise = (1 - ease((t - 1.0) / 1.2)) * 20;
    ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    ctx.font = `150px ${FONT}`; ctx.lineWidth = 22; ctx.strokeStyle = INK; ctx.strokeText(TITLE.main, W / 2, H * 0.4 + rise);
    ctx.fillStyle = GOLD; ctx.fillText(TITLE.main, W / 2, H * 0.4 + rise);
    ctx.font = `46px ${FONT}`; ctx.lineWidth = 10; ctx.strokeText(TITLE.sub, W / 2, H * 0.4 + 120 + rise);
    ctx.fillStyle = '#fff6e0'; ctx.fillText(TITLE.sub, W / 2, H * 0.4 + 120 + rise);
    ctx.restore();
  }

  /** 歌词条：手写体、逐字染色；唱到哪里哪个字变金 */
  private lyric(ctx: CanvasRenderingContext2D, line: number, lineU: number, T: number): void {
    const l = LINES[line];
    const text = l.text;
    const tIn = T - l.start, tOut = l.end - T;
    const alpha = clamp(tIn / 0.12) * clamp(tOut / 0.12 + 0.2);
    if (alpha <= 0) return;
    const size = text.length > 10 ? 58 : 64;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = `${size}px ${FONT}`; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.lineJoin = 'round';
    const gap = size * 0.08;
    const widths = Array.from(text).map((ch) => ctx.measureText(ch).width);
    const total = widths.reduce((a, b) => a + b, 0) + gap * (text.length - 1);
    const y = 985 + (1 - clamp(tIn / 0.12)) * 10;
    let x = W / 2 - total / 2;
    // 唱到的进度：这一句的最后一个字通常拖长，所以按 0.86 的时长铺满所有字
    const sung = clamp(lineU / 0.86) * text.length;
    // 底衬：柔和的暗带
    const g = ctx.createLinearGradient(0, y - size, 0, y + size);
    g.addColorStop(0, 'rgba(30,20,20,0)'); g.addColorStop(0.5, 'rgba(30,20,20,0.28)'); g.addColorStop(1, 'rgba(30,20,20,0)');
    ctx.fillStyle = g; ctx.fillRect(W / 2 - total / 2 - 60, y - size, total + 120, size * 2);
    Array.from(text).forEach((ch, i) => {
      const w = widths[i];
      ctx.lineWidth = size * 0.17; ctx.strokeStyle = 'rgba(58,45,43,0.95)';
      ctx.strokeText(ch, x, y);
      ctx.fillStyle = '#fff8ea'; ctx.fillText(ch, x, y);
      const frac = clamp(sung - i);
      if (frac > 0) {
        ctx.save(); ctx.beginPath(); ctx.rect(x - 2, y - size, (w + 4) * frac, size * 2); ctx.clip();
        ctx.fillStyle = GOLD; ctx.fillText(ch, x, y);
        ctx.restore();
      }
      x += w + gap;
    });
    ctx.restore();
  }
}

/** 开渲前的角色预检：把每个镜头抽几帧跑一遍镜头逻辑，图集里没有的格、动作名写错，开播前一次列全 */
export function castPreflight(engine: FilmEngine, canvas: HTMLCanvasElement, samples = 4): string[] {
  const ctx = canvas.getContext('2d');
  if (!ctx) return ['无法创建画布'];
  const problems: string[] = [];
  for (const s of engine.shots) {
    for (let k = 0; k < samples; k++) {
      const T = lerp(s.start + 0.02, s.end - 0.02, samples === 1 ? 0.5 : k / (samples - 1));
      try { engine.render(ctx, T); }
      catch (e) { problems.push(`${s.id} @ ${T.toFixed(2)}s：${(e as Error).message}`); break; }
    }
  }
  // 静态核对：每位角色至少有正面格与行走格
  for (const id of CAST_IDS) {
    if (!hasAction(id, 'nod')) problems.push(`${id} 缺少动作 nod`);
    try { rectOf(id === 'gpt' ? 'gpt_fly_0' : id === 'doubao' ? 'walk_doubao_big_0' : `walk_${id}_0`); } catch (e) { problems.push((e as Error).message); }
  }
  if (!hasSprite('p_whale_neutral')) problems.push('缺少头像格');
  return problems;
}
export type { CastId };
export { loadAtlas };
