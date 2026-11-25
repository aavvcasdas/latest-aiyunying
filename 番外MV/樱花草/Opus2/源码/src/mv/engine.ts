// 引擎：给一个时间点画出这一帧。镜头 → 布景 + 演员 → 后期（花瓣 / 心跳 / 星座 / 闪白 / 渐黑）→ 片头 → 软 3D 歌词条。
import { CAST_IDS, frontFrame, preflight } from './atlas';
import { LINES } from './cues';
import { drawSet, LOOKS, SETS } from './sets';
import { SHOTS, type F, type ShotDef } from './shots';
import { clamp, ease, H, hash, lerp, lerp3, Scene, W } from './soft3d';
import { beatPhase, DURATION, lineAt, sung } from './timeline';

export const FONT = '"ZCOOL KuaiLe", "Noto Sans SC", "PingFang SC", sans-serif';
export const TITLE = { main: '樱花草', sub: '原唱 Sweety · 词曲 李天龙' };

export interface PlannedShot extends ShotDef { start: number; end: number; index: number }

export class FilmEngine {
  readonly shots: PlannedShot[];
  constructor() {
    const s = [...SHOTS].sort((a, b) => a.at - b.at);
    this.shots = s.map((x, i) => ({ ...x, index: i, start: i === 0 ? 0 : x.at, end: i + 1 < s.length ? s[i + 1].at : DURATION }));
    for (const p of this.shots) if (p.end - p.start < 0.4) throw new Error(`镜头 ${p.id} 太短（${(p.end - p.start).toFixed(2)} 秒）`);
  }
  shotIndex(T: number): number {
    let lo = 0, hi = this.shots.length - 1;
    while (lo < hi) { const m = (lo + hi + 1) >> 1; if (this.shots[m].start <= T) lo = m; else hi = m - 1; }
    return lo;
  }

  render(g: CanvasRenderingContext2D, T: number, opts: { subtitles?: boolean } = {}): void {
    T = clamp(T, 0, DURATION - 0.001);
    const si = this.shotIndex(T), s = this.shots[si];
    const t = T - s.start, dur = s.end - s.start, u = clamp(t / dur);
    const bp = beatPhase(T);
    const cur = lineAt(T).line, line = s.line ?? cur;
    const { k, hit } = sung(line, T);
    const f: F = { T, t, u, dur, pulse: bp.pulse, beat: bp.beat, k, hit, line };

    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    const c = s.cam, ku = ease(u);
    const p = c.p1 ? lerp3(c.p0, c.p1, ku) : c.p0, tg = c.t1 ? lerp3(c.t0, c.t1, ku) : c.t0;
    const hand: [number, number, number] = [Math.sin(T * 0.7) * 0.03, Math.sin(T * 0.9) * 0.02, 0];
    const lively = /副歌|啦啦/.test(s.sec);
    const fov = lerp(c.fov ?? 45, c.fov1 ?? c.fov ?? 45, ku) - (lively ? bp.pulse * 0.9 : 0);
    const look = LOOKS[s.look ?? SETS[s.set].look];
    const sc = new Scene(look, [p[0] + hand[0], p[1] + hand[1], p[2]], tg, fov, c.roll ?? 0);
    drawSet(g, sc, s.set, { T, pulse: bp.pulse, k: k + bp.beat, hit, u });
    s.act?.(sc, f);
    sc.flush(g);

    // ---- 后期 ----
    if (s.fx?.petals) this.petals(g, T);
    if (s.fx?.heart) { const gr = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.9); gr.addColorStop(0, 'rgba(255,120,170,0)'); gr.addColorStop(1, `rgba(255,120,170,${0.12 + bp.pulse * 0.28})`); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
    if (s.fx?.mark) this.constellation(g, T, u);
    this.vignette(g);
    const prev = this.shots[si - 1];
    if (prev && prev.sec !== s.sec && s.sec !== '尾声') this.fill(g, '255,250,240', Math.exp(-t * 6) * 0.85);
    else if (t < 0.12) this.fill(g, '255,255,255', (1 - t / 0.12) * 0.18);
    if (s.fx?.fadeIn) this.fill(g, '4,4,12', 1 - ease(t / s.fx.fadeIn));
    if (s.fx?.fadeOut) this.fill(g, '4,4,12', ease((t - (dur - s.fx.fadeOut)) / s.fx.fadeOut));
    if (s.fx?.title) this.title(g, t);
    if (opts.subtitles !== false && cur >= 0) this.subtitle(g, cur, T);
  }

  private fill(g: CanvasRenderingContext2D, c: string, a: number): void { if (a > 0.004) { g.fillStyle = `rgba(${c},${clamp(a)})`; g.fillRect(0, 0, W, H); } }
  private vignette(g: CanvasRenderingContext2D): void {
    const gr = g.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 0.95);
    gr.addColorStop(0, 'rgba(10,6,20,0)'); gr.addColorStop(1, 'rgba(10,6,20,0.42)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  }
  private petals(g: CanvasRenderingContext2D, T: number): void {
    for (let i = 0; i < 46; i++) {
      const sp = 40 + hash(i) * 60, x = ((hash(i * 3.7) * W + T * (30 + hash(i * 2) * 50)) % (W + 80)) - 40, y = ((hash(i * 5.1) * H + T * sp) % (H + 60)) - 30;
      const r = 4 + hash(i * 9) * 6;
      g.save(); g.translate(x + Math.sin(T * 1.4 + i) * 18, y); g.rotate(T * (1 + hash(i)) + i); g.scale(1, 0.55 + 0.45 * Math.sin(T * 3 + i));
      g.fillStyle = i % 3 ? 'rgba(255,183,207,0.9)' : 'rgba(255,240,246,0.9)'; g.beginPath(); g.ellipse(0, 0, r, r * 0.6, 0, 0, Math.PI * 2); g.fill(); g.restore();
    }
  }
  /** 「记号」：星星一颗颗亮起、连成一颗心 */
  private constellation(g: CanvasRenderingContext2D, T: number, u: number): void {
    const n = 22, cx = W / 2, cy = H * 0.3, s = 9.5;
    const pts = Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2; return [cx + 16 * Math.pow(Math.sin(a), 3) * s, cy - (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) * s] as const; });
    const shown = u * 1.4 * n;
    g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const a = clamp(shown - i); if (a <= 0) break;
      const [x, y] = pts[i], [x2, y2] = pts[(i + 1) % n], b = clamp(shown - i - 1);
      if (b > 0) { g.strokeStyle = `rgba(255,200,230,${0.55 * b})`; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y); g.lineTo(lerp(x, x2, b), lerp(y, y2, b)); g.stroke(); }
      const gr = g.createRadialGradient(x, y, 0, x, y, 16); gr.addColorStop(0, `rgba(255,240,250,${a})`); gr.addColorStop(1, 'rgba(255,180,220,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, 16, 0, Math.PI * 2); g.fill();
      g.fillStyle = `rgba(255,255,255,${a * (0.8 + 0.2 * Math.sin(T * 5 + i))})`; g.beginPath(); g.arc(x, y, 2.6, 0, Math.PI * 2); g.fill();
    }
    g.restore();
  }
  /** 片头：只留歌名与原唱两行 */
  private title(g: CanvasRenderingContext2D, t: number): void {
    const a = ease((t - 1.2) / 1.2) * (1 - ease((t - 5.2) / 1.0));
    if (a <= 0) return;
    const rise = (1 - ease((t - 1.2) / 1.2)) * 16;
    g.save(); g.globalAlpha = a; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    g.font = `112px ${FONT}`;
    for (let d = 7; d > 0; d--) { g.fillStyle = `rgb(${120 - d * 8},${40 - d * 3},${80 - d * 5})`; g.fillText(TITLE.main, W / 2, H * 0.4 + rise + d); }
    const gr = g.createLinearGradient(0, H * 0.4 - 56, 0, H * 0.4 + 56); gr.addColorStop(0, '#fff2f7'); gr.addColorStop(1, '#ff9fc4');
    g.fillStyle = gr; g.fillText(TITLE.main, W / 2, H * 0.4 + rise);
    g.font = `30px ${FONT}`; g.fillStyle = '#fff6e8'; g.fillText(TITLE.sub, W / 2, H * 0.4 + 92 + rise);
    g.restore();
  }

  /**
   * 软 3D 歌词条：深色圆角条 + 金边（沿用坏女孩 Fable 版的样子），
   * 字是有厚度的立体字：逐字从左往右扫金、起唱那一下落位回弹；正在唱的「词」底下亮一条粉色光带。
   */
  private subtitle(g: CanvasRenderingContext2D, i: number, T: number): void {
    const L = LINES[i];
    const age = T - (L.start - 0.25);
    const nextStart = i + 1 < LINES.length ? LINES[i + 1].start : Infinity;
    const outT = Math.min(L.end + 0.35, nextStart - 0.25);
    const fade = clamp(age / 0.18) * clamp((outT - T) / 0.18);
    if (fade <= 0) return;
    const isLa = L.text.startsWith('La');
    const fs = isLa ? 36 : 40, gapWord = isLa ? 16 : 6, gapComma = 30;
    g.save(); g.font = `${fs}px ${FONT}`; g.textBaseline = 'middle'; g.textAlign = 'left';
    type C = { ch: string; x: number; w: number; t0: number; t1: number };
    const words: { x0: number; x1: number; t0: number; t1: number; cs: C[] }[] = [];
    let x = 0;
    for (const w of L.words) {
      const cs: C[] = []; const x0 = x;
      for (const [ch, t0, t1] of w.c) { const cw = g.measureText(ch).width + (isLa ? 2 : 3); cs.push({ ch, x, w: cw, t0, t1 }); x += cw; }
      words.push({ x0, x1: x, t0: w.c[0][1], t1: w.c[w.c.length - 1][2], cs });
      x += w.sep === '，' ? gapComma : w.sep === ' ' ? gapWord : 0;
    }
    const tw = x, x0 = W / 2 - tw / 2, y = H - 62;
    const pop = age < 0.3 ? 1 + 0.07 * Math.exp(-age * 12) * Math.cos(age * 22) : 1;
    g.globalAlpha = fade;
    g.translate(W / 2, y); g.scale(pop, pop); g.translate(-W / 2, -y);
    // 底条
    g.fillStyle = 'rgba(12,10,30,0.8)'; g.beginPath(); g.roundRect(x0 - 30, y - 38, tw + 60, 76, 10); g.fill();
    g.strokeStyle = '#c9a227'; g.lineWidth = 2.5; g.stroke();
    g.strokeStyle = 'rgba(255,220,140,0.25)'; g.lineWidth = 1; g.beginPath(); g.roundRect(x0 - 24, y - 32, tw + 48, 64, 7); g.stroke();
    // 词光带
    for (const w of words) {
      if (T < w.t0 - 0.02 || T > w.t1 + 0.1) continue;
      const k = clamp((T - w.t0) / Math.max(0.1, w.t1 - w.t0));
      const a = Math.min(1, (T - w.t0 + 0.02) / 0.1) * (1 - clamp((T - w.t1) / 0.1));
      const gr = g.createLinearGradient(x0 + w.x0, 0, x0 + w.x1, 0);
      gr.addColorStop(0, `rgba(255,120,175,${0.75 * a})`); gr.addColorStop(clamp(k + 0.001), `rgba(255,170,205,${0.75 * a})`); gr.addColorStop(Math.min(1, k + 0.02), `rgba(255,170,205,${0.18 * a})`); gr.addColorStop(1, `rgba(255,170,205,${0.18 * a})`);
      g.fillStyle = gr; g.beginPath(); g.roundRect(x0 + w.x0 - 2, y + fs * 0.48, w.x1 - w.x0 + 4, 5, 3); g.fill();
    }
    // 立体字
    const DEPTH = 4;
    for (const w of words) {
      const wActive = T >= w.t0 && T <= w.t1;
      for (const c of w.cs) {
        const on = T >= c.t0, kk = on ? clamp((T - c.t0) / 0.14) : 0;
        const dy = on ? -(1 - kk) * 7 + Math.sin(kk * Math.PI) * -2 : 0;
        const lift = wActive ? -2 : 0;
        const cx = x0 + c.x, cy = y + 2 + dy + lift;
        const prog = clamp((T - c.t0) / Math.max(0.08, Math.min(c.t1 - c.t0, 0.5)));
        // 侧面（厚度）
        for (let d = DEPTH; d >= 1; d--) { g.fillStyle = on ? `rgb(${150 - d * 10},${70 - d * 6},${30})` : `rgb(${40 + d * 4},${42 + d * 4},${78 + d * 6})`; g.fillText(c.ch, cx + d * 0.5, cy + d); }
        // 正面：白 → 金，从左往右扫
        g.fillStyle = '#ffffff'; g.fillText(c.ch, cx, cy);
        if (prog > 0) {
          g.save(); g.beginPath(); g.rect(cx - 2, cy - fs, (c.w + 2) * prog + 1, fs * 2); g.clip();
          const gr = g.createLinearGradient(0, cy - fs / 2, 0, cy + fs / 2); gr.addColorStop(0, '#fff3a6'); gr.addColorStop(0.55, '#ffd84a'); gr.addColorStop(1, '#ff9f2e');
          g.fillStyle = gr; g.fillText(c.ch, cx, cy); g.restore();
        }
        if (on && kk < 1) { g.fillStyle = `rgba(255,255,255,${0.6 * (1 - kk)})`; g.fillText(c.ch, cx, cy); }
      }
    }
    g.restore();
  }

  /** 开播前把每个镜头的头 / 中 / 尾各画一遍：缺格、缺动作直接报错 */
  preflight(g: CanvasRenderingContext2D): string[] {
    const errs: string[] = [];
    const miss = preflight(CAST_IDS.flatMap((id) => [frontFrame(id, 0), frontFrame(id, 0.05)]));
    if (miss.length) errs.push(`图集缺格：${miss.join('、')}`);
    for (const s of this.shots) for (const k of [0.02, 0.5, 0.98]) {
      try { this.render(g, s.start + (s.end - s.start) * k); } catch (e) { errs.push(`${s.id}：${(e as Error).message}`); break; }
    }
    return errs;
  }
}
