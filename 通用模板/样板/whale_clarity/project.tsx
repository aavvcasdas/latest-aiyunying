// 本鲸清晰度检查样板：不是成片，只是给 `npm run preview` 增加一组真实模板引擎镜头。
import { defineProject, type CueFile } from '@tpl/project';
import cues from './cues.json';
import film from './film.json';
import { SHOTS } from './shots/shots';

export default defineProject({
  id: film.id,
  kind: 'day',
  title: film.title,
  cues: cues as CueFile,
  shots: SHOTS,
  planShots: SHOTS.map((s, i) => ({ id: s.id, cue: i })),
  planOptions: { tail: 0.5, beat: 'none' },
  subtitle: 'lyric',
  lyricTone: 'rain',
});
