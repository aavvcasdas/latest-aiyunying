// 《动作总览 v2》的排镜：没有歌词、没有音源，两镜各 24 秒（12 轮 × 每轮 2 秒），切点写死。
import { defineProject, type CueFile } from '@tpl/project';
import { finishTimeline, type RawShot } from '@tpl/timeline';
import cues from './cues.json';
import film from './film.json';
import { SHOTS } from './shots/shots';

const MARKS: [string, number][] = [['S1', 0], ['S2', 24]];
export const DURATION = 48;

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
    // 没有音乐，但引擎每帧都要一份节拍：给一条安静的网格，镜头里没人用它
    beat: 0.6,
    grid: { period: 0.6, first: 0, bar: 4 },
  }),
});
