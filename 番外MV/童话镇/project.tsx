// 《童话镇》立体童话书复刻 —— 通用模板的参考作品（MV 线）。
// 画面源码来自 通用模板/来源/remotion-fix-and-mv-recreation.zip，镜头代码只改了 import 路径。
import { defineProject, type CueFile } from '@tpl/project';
import cues from './cues.json';
import film from './film.json';
import { plan, sectionOfCue } from './plan';
import { SHOTS_A } from './shots/shotsA';
import { SHOTS_B } from './shots/shotsB';

export default defineProject({
  id: film.id,
  kind: 'mv',
  title: film.title,
  cues: cues as CueFile,
  shots: [...SHOTS_A, ...SHOTS_B],
  plan,
  subtitle: 'lyric',
  // 片头卡按规矩只放两行：歌名 + 歌手名。别的一律不放（字幕条里也不写歌手名）。
  cards: { title: { main: '童话镇', sub: '陈一发儿' }, end: { shot: 'OUT', text: '很久很久以后' } },
  sectionOf: sectionOfCue,
});
