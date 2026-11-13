// 《人物动作演示》的排镜：没有歌词、没有音源，镜头切点是写死的一张表（秒）。
// 之所以不走 planShots：那一套是按「第几句歌词开口前 2 帧」派生切点的，这部片子一句歌词都没有。
import { defineProject, type CueFile } from '@tpl/project';
import { finishTimeline, type RawShot } from '@tpl/timeline';
import cues from './cues.json';
import film from './film.json';
import { SHOTS } from './shots/shots';

/** 全片 60 秒；表格是 [镜头 id, 起点秒]。每个角色一个 4–4.5 秒的镜头，最后两镜数表情贴和道具。 */
const MARKS: [string, number][] = [
  ['A0', 0], ['B1', 5], ['B2', 9.5], ['B3', 14], ['B4', 18.5],
  ['B5', 23], ['B6', 27], ['B7', 31], ['B8', 35],
  ['C1', 39], ['D1', 48], ['E1', 56],
];
export const DURATION = 60;

export default defineProject({
  id: film.id,
  kind: 'mv',
  title: film.title,
  cues: cues as CueFile,
  shots: SHOTS,
  plan: (starts, ends) => finishTimeline({
    starts, ends,
    raw: MARKS.map(([id, a]) => ({ id, a }) as RawShot),
    duration: DURATION,
    // 没有音乐，但引擎每帧都要一份节拍：给一条安静的 100 BPM 网格，镜头里没人用它
    beat: 0.6,
    grid: { period: 0.6, first: 0, bar: 4 },
  }),
});
