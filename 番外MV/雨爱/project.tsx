// 《雨爱》（司凤版）治愈风 MV —— 照《童话镇》的做法写的新作品：
// three.js 搭的 3D 世界 + 项目图集里的 2D 像素角色当纸片人，Remotion 逐帧驱动；卡点按音轨实测。
// 角色只用 通用模板/engine/assets/cast_atlas.png 里现成的造型格，没有新画任何立绘。
import { defineProject, type CueFile } from '@tpl/project';
import cues from './cues.json';
import film from './film.json';
import { plan, sectionOfCue } from './plan';
import { SHOTS_A } from './shots/shotsA';
import { SHOTS_B } from './shots/shotsB';
import { SHOTS_C } from './shots/shotsC';

export default defineProject({
  id: film.id,
  kind: 'mv',
  title: film.title,
  cues: cues as unknown as CueFile,
  shots: [...SHOTS_A, ...SHOTS_B, ...SHOTS_C],
  plan,
  subtitle: 'lyric',
  lyricTone: 'rain',
  // 片头卡按规矩只放两行：歌名 + 版本。别的一律不放（字幕条里也不写歌手名）。
  cards: { title: { main: '雨爱', sub: '司凤版' }, end: { shot: 'OUT', text: '雨停了 爱还在' } },
  sectionOf: sectionOfCue,
});
