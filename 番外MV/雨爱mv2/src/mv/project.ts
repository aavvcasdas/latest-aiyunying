// 《雨爱》（司凤版）治愈风 MV —— 照《童话镇》的做法写：
//   cues.json   22 句歌词的起止（按原曲实测拍点对过）
//   plan()      这首歌自己的排镜规则：31 个镜头的起点全部由歌词起点 + 实测拍点派生
//   shotsA / B  31 个镜头
// 画面 = three.js 3D 世界 + 图集里现成的像素角色当纸片人，Remotion 逐帧驱动。
import { defineProject, type CueFile } from '../engine/project';
import { finishTimeline, LEAD, type RawShot, type Timeline } from '../engine/timeline';
import cues from './cues.json';
import { SHOTS_A } from './shotsA';
import { SHOTS_B } from './shotsB';

/** 八分音符（秒）与第一个重拍的时刻：都来自对原曲的实测 */
const E: number = cues.beat.eighth, B0: number = cues.beat.first;
/** 音轨总长 131.26 秒；片子在 131.2 秒结束 */
export const DURATION = 131.2;
const pad = (n: number) => String(n).padStart(2, '0');

/**
 * 排镜规则：
 *   序章 I1–I3        0 秒 / 半小节处 / 第一个重拍（歌声在它之后两小节进）
 *   L01–L11           一句一镜，切点 = 这一句起点 − 2 帧
 *   L12a / L12b       「让想念继续｜让爱变透明」后半句正好晚一小节（8 个八分音符），在那里再切一刀
 *   L13a / L13b       「我爱上给我勇气的｜Rainie love」晚 10 个八分音符
 *   L14–L16           一句一镜
 *   L17a / L17b       「雨爱的秘密｜能一直延续」晚一小节
 *   L18a / L18b       「我相信我将会看到｜彩虹的美丽」晚 9 个八分音符，切点带闪白
 *   L19–L21           反复段，一句一镜
 *   L22a / L22b       最后一句放慢了：「彩虹」晚 12 个八分音符，切点 = 快门闪白
 *   OUT               最后一句唱完 0.15 秒起，到音轨结束
 */
export function plan(s: number[], e: number[]): Timeline {
  if (s.length !== 22 || e.length !== 22) throw new Error(`[雨爱] 排镜规则按 22 句歌词写死，收到 ${s.length} 句`);
  const raw: RawShot[] = [];
  const push = (id: string, a: number, cue = -1) => raw.push({ id, a, cue });
  push('I1', 0); push('I2', B0 - 12 * E - LEAD); push('I3', B0 - LEAD);
  for (let c = 0; c < 11; c++) push(`L${pad(c + 1)}`, s[c] - LEAD, c);
  push('L12a', s[11] - LEAD, 11); push('L12b', s[11] + 8 * E - LEAD, 11);
  push('L13a', s[12] - LEAD, 12); push('L13b', s[12] + 10 * E - LEAD, 12);
  for (let c = 13; c < 16; c++) push(`L${pad(c + 1)}`, s[c] - LEAD, c);
  push('L17a', s[16] - LEAD, 16); push('L17b', s[16] + 8 * E - LEAD, 16);
  push('L18a', s[17] - LEAD, 17); push('L18b', s[17] + 9 * E - LEAD, 17);
  for (let c = 18; c < 21; c++) push(`L${pad(c + 1)}`, s[c] - LEAD, c);
  push('L22a', s[21] - LEAD, 21); push('L22b', s[21] + 12 * E - LEAD, 21);
  push('OUT', Math.max(e[21], s[21] + 1.5) + 0.15);
  // 节拍用实测网格：四分音符 0.74066 秒，第一个重拍 10.2255 秒，四拍一小节
  return finishTimeline({ starts: s, ends: e, raw, duration: DURATION, beat: cues.beat.period, grid: { period: cues.beat.period, first: B0, bar: 4 } });
}

export type Section = '序章' | '主歌' | '导歌' | '副歌一' | '副歌二' | '副歌三' | '尾声';
export const sectionOfCue = (c: number): Section => (c < 0 ? '序章' : c < 4 ? '主歌' : c < 8 ? '导歌' : c < 13 ? '副歌一' : c < 18 ? '副歌二' : '副歌三');

export const project = defineProject({
  id: 'yuai',
  kind: 'mv',
  title: '雨爱',
  cues: cues as CueFile,
  shots: [...SHOTS_A, ...SHOTS_B],
  plan,
  subtitle: 'lyric',
  // 片头卡按规矩只放两行：歌名 + 版本名（音源文件名就叫「司凤版」，不另编歌手名）
  cards: { title: { main: '雨爱', sub: '司凤版' }, end: { shot: 'OUT', text: '雨停了 爱还在' } },
  sectionOf: sectionOfCue,
});

export const beatInfo = { bpm: cues.beat.bpm as number, period: cues.beat.period as number, eighth: E, first: B0 };
