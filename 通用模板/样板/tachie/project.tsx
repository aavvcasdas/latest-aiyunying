// 「长大」样板：演示立绘（长大后的样子）怎么进 Remotion 成片线。
// 规则见 设定/立绘.md：主用 Q 版，立绘只放在长大时刻；同一镜头允许长大过程、也允许和长大的自己同框。
import { defineProject, type CueFile } from '@tpl/project';
import '@tpl/tachie-assets';               // 注册八张立绘的图片地址（浏览器侧）
import { preloadTachie, type TachieId } from '@tpl/tachie';
import cues from './cues.json';
import film from './film.json';
import { SHOTS } from './shots/shots';

// 立绘要用的图先解码好，否则第一帧的贴图是空的（imageOf 会当场报错）
const used: TachieId[] = ['whale'];
const preloads = used.map((id) => () => preloadTachie(id));

export default defineProject({
  id: film.id,
  kind: 'mv',
  title: film.title,
  cues: cues as CueFile,
  shots: SHOTS,
  planShots: [{ id: 'G1' }, { id: 'G2', cue: 1 }, { id: 'G3', cue: 2 }],
  planOptions: { tail: 2, beat: 'estimate' },
  cards: { title: { main: '长大样板', sub: '立绘进成片' }, end: { shot: 'G3', text: '完' } },
  preloads,
});
