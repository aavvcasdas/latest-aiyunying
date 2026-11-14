import { finishTimeline, LEAD, type RawShot, type Timeline } from '../engine/timeline';
import { LYRIC_ENDS, LYRIC_STARTS, MEASURED_BEAT, SONG_DURATION, type SectionName } from './cues';

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * 《勾指起誓》53 镜排镜规则（参照《童话镇》「一句一镜 + 切点提前 2 帧落拍」）：
 *   · 序章 I1–I3         00:00.00 – 00:21.78（三段渐进：启卷 / 初遇 / 执笔）
 *   · L01–L08            主歌一 8 句（一句一镜）
 *   · L09–L16            副歌一 8 句（一句一镜）
 *   · 间奏一 N1–N4       01:07.15 – 01:29.55（32 拍，每 8 拍一镜，豆包暖场 → 全员巡游 → 启程）
 *   · L17–L24            主歌二 8 句（一句一镜）
 *   · L25–L32            副歌二 8 句（一句一镜）
 *   · 桥段间奏 B1–B4     02:14.92 – 02:37.31（32 拍，每 8 拍一镜，篝火 → 天灯 → 烟花 → 聚光）
 *   · L33–L41            终章副歌 9 句（一句一镜，含「所以」独立聚光瞬切）
 *   · 尾声 OUT           03:00.22 – 03:03.70（合上童话书，渐黑余韵）
 */
export function buildTimeline(offsetSec = 0): Timeline {
  const s = LYRIC_STARTS.map((v) => Math.max(0.5, v + offsetSec));
  const e = LYRIC_ENDS.map((v) => Math.min(SONG_DURATION - 0.2, v + offsetSec));
  const raw: RawShot[] = [];
  const push = (id: string, a: number, cue = -1) => raw.push({ id, a, cue });

  // 序章 3 镜
  const t0 = Math.max(3, s[0] - LEAD);
  push('I1', 0);
  push('I2', t0 * 0.36);
  push('I3', t0 * 0.68);

  // 主歌一 + 副歌一（L01–L16）
  for (let c = 0; c < 16; c++) push(`L${pad(c + 1)}`, s[c] - LEAD, c);

  // 间奏一 4 镜（每 8 拍切一镜）
  const n0 = e[15] + 0.04;
  const n1 = s[16] - LEAD;
  for (let i = 0; i < 4; i++) push(`N${i + 1}`, n0 + ((n1 - n0) * i) / 4);

  // 主歌二 + 副歌二（L17–L32）
  for (let c = 16; c < 32; c++) push(`L${pad(c + 1)}`, s[c] - LEAD, c);

  // 桥段间奏 4 镜
  const b0 = e[31] + 0.04;
  const b1 = s[32] - LEAD;
  for (let i = 0; i < 4; i++) push(`B${i + 1}`, b0 + ((b1 - b0) * i) / 4);

  // 终章副歌（L33–L41）
  for (let c = 32; c < 41; c++) push(`L${pad(c + 1)}`, s[c] - LEAD, c);

  // 尾声
  const end = Math.min(SONG_DURATION - 1.2, e[40] + 0.08);
  push('OUT', end);

  return finishTimeline({
    starts: s,
    ends: e,
    raw,
    duration: SONG_DURATION,
    beat: MEASURED_BEAT.period,
    grid: {
      period: MEASURED_BEAT.period,
      first: MEASURED_BEAT.first + offsetSec,
      bar: MEASURED_BEAT.bar,
    },
  });
}

export function sectionOfShot(id: string): SectionName {
  if (id.startsWith('I')) return '序章';
  if (id.startsWith('N')) return '间奏一';
  if (id.startsWith('B')) return '桥段间奏';
  if (id === 'OUT') return '尾声';
  const n = Number(id.slice(1));
  if (n <= 8) return '主歌一';
  if (n <= 16) return '副歌一';
  if (n <= 24) return '主歌二';
  if (n <= 32) return '副歌二';
  return '终章副歌';
}
