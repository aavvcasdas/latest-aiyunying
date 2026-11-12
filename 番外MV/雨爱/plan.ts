// 《雨爱》（司凤版）的排镜规则：30 个镜头的起点全部由 23 句歌词的起点与实测拍点派生。
// 写法沿用《童话镇》的 plan.ts：歌词一句一镜，切点 = 这一句起点 − 2 帧；长句在句中的实拍上再切一刀。
//
//   序章 I1 / I2        0 秒 / 第一句之前倒数第 2 小节的第一拍（9.855 秒）
//   L01–L11             一句一镜
//   L12a / L12b         「让想念继续 | 让爱变透明」        句起点 + 8 个八分音符处再切
//   L13a / L13b         「我爱上给我勇气的 | Rainie love」 句起点 + 9 个八分音符
//   L14–L17             一句一镜
//   L18a / L18b         「我相信我将会看到 | 彩虹的美丽」   句起点 + 11 个八分音符
//   L19–L22             雨后重唱，一句一镜
//   L23a / L23b         同第 18 句
//   OUT                 最后一句结束后 0.15 秒起，到音轨结束（131.2 秒）
import { finishTimeline, LEAD, type RawShot, type Timeline } from '@tpl/timeline';
import cues from './cues.json';

const BEAT = cues.beat;
const E8 = BEAT.eighth.period;
export const DURATION = 131.2;
const pad = (n: number) => String(n).padStart(2, '0');

export function plan(s: number[], e: number[]): Timeline {
  if (s.length !== 23 || e.length !== 23) throw new Error(`[雨爱] 排镜规则按 23 句歌词写死，收到 ${s.length} 句`);
  const raw: RawShot[] = [];
  const push = (id: string, a: number, cue = -1) => raw.push({ id, a, cue });
  const cut = (c: number, eighths: number) => s[c] + eighths * E8 - LEAD;
  push('I1', 0);
  push('I2', BEAT.first - 4 * BEAT.period);
  for (let c = 0; c < 11; c++) push(`L${pad(c + 1)}`, s[c] - LEAD, c);
  push('L12a', s[11] - LEAD, 11); push('L12b', cut(11, 8), 11);
  push('L13a', s[12] - LEAD, 12); push('L13b', cut(12, 9), 12);
  for (let c = 13; c < 17; c++) push(`L${pad(c + 1)}`, s[c] - LEAD, c);
  push('L18a', s[17] - LEAD, 17); push('L18b', cut(17, 11), 17);
  for (let c = 18; c < 22; c++) push(`L${pad(c + 1)}`, s[c] - LEAD, c);
  push('L23a', s[22] - LEAD, 22); push('L23b', cut(22, 11), 22);
  push('OUT', Math.max(e[22], s[22] + 1.5) + 0.15);
  // 节拍网格用实测值（四分音符 0.74066 秒，first 落在小节第一拍），全片一张网格
  return finishTimeline({ starts: s, ends: e, raw, duration: DURATION, beat: BEAT.period, grid: { period: BEAT.period, first: BEAT.first, bar: BEAT.bar } });
}

export type Section = '序章' | '主歌' | '副歌一' | '副歌二' | '雨后重唱' | '尾声';
export const sectionOfCue = (c: number): Section => (c < 0 ? '序章' : c < 8 ? '主歌' : c < 13 ? '副歌一' : c < 18 ? '副歌二' : '雨后重唱');
