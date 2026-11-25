// 时间轴：拍点、句子、逐字。所有时间都来自 cues.ts（实测）。
import { BEAT, BEAT0, DURATION, LINES, type Line } from './cues';

export { BEAT, BEAT0, DURATION, LINES };
export const FPS = 30;
export const LEAD = 0.085; // 切镜点：起唱前两帧多一点

export const barT = (b: number) => BEAT0 + b * 4 * BEAT;
export const cutAt = (i: number) => LINES[i].start - LEAD;
/** 句中逗号之后第一个字的时间（which = 'last' 取最后一个逗号） */
export function halfAt(i: number, which: 'first' | 'last' = 'last'): number {
  const ws = LINES[i].words;
  let idx = -1;
  ws.forEach((w, k) => { if (w.sep === '，' && (which === 'last' || idx < 0)) idx = k; });
  if (idx < 0 || idx + 1 >= ws.length) throw new Error(`第 ${i} 句没有逗号可切`);
  return ws[idx + 1].c[0][1] - LEAD;
}
export function onsets(i: number): number[] { return LINES[i].words.flatMap((w) => w.c.map((c) => c[1])); }

export function beatPhase(T: number): { beat: number; frac: number; pulse: number } {
  const b = (T - BEAT0) / BEAT, beat = Math.floor(b), frac = b - beat;
  return { beat, frac, pulse: T < BEAT0 ? 0 : Math.exp(-(frac * BEAT) / 0.16) };
}

/** 当前显示的句子：起唱前 0.25 秒浮出，唱完后 0.35 秒退场 */
export function lineAt(T: number): { line: number; L: Line | null } {
  for (let i = 0; i < LINES.length; i++) {
    const L = LINES[i];
    const nextStart = i + 1 < LINES.length ? LINES[i + 1].start : Infinity;
    if (T >= L.start - 0.25 && T < Math.min(L.end + 0.35, nextStart - 0.25)) return { line: i, L };
  }
  return { line: -1, L: null };
}
/** 某句已唱出的字数、距上一个字起唱的秒数 */
export function sung(i: number, T: number): { k: number; hit: number } {
  if (i < 0) return { k: 0, hit: 99 };
  const os = onsets(i);
  let k = 0; for (const o of os) if (T >= o) k++;
  return { k, hit: k ? T - os[k - 1] : 99 };
}
export function fmt(t: number): string { const m = Math.floor(t / 60), s = t - m * 60; return `${m}:${s.toFixed(1).padStart(4, '0')}`; }
