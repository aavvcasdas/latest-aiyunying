// 《浪人琵琶》（大肥鱼翻唱版）—— 一句词一个镜头，间奏三镜，共 44 镜。
// 谁演谁、为什么这样排：见同目录 README.md 与 分镜脚本.md。
import { defineProject, type CueFile } from '@tpl/project';
import cues from './cues.json';
import film from './film.json';
import { SHOTS_A } from './shots/shotsA';
import { SHOTS_B } from './shots/shotsB';

// 句序号（0 起）：L0–L6 副歌一 · L7–L12 主歌 · L13–L19 预副歌一 · L20–L26 副歌二 · （间奏）· L27–L33 预副歌二 · L34–L40 副歌三
const lyricShots = (ids: string[], first: number) => ids.map((id, i) => ({ id, cue: first + i }));

export default defineProject({
  id: film.id,
  kind: 'mv',
  title: film.title,
  cues: cues as CueFile,
  shots: [...SHOTS_A, ...SHOTS_B],
  planShots: [
    { id: 'C01' },                                                     // 第一镜永远从 0 秒开始（这首歌开口就是第一句）
    ...lyricShots(['C02', 'C03', 'C04', 'C05', 'C06', 'C07'], 1),       // 副歌一
    ...lyricShots(['C08', 'C09', 'C10', 'C11', 'C12', 'C13'], 7),       // 主歌
    ...lyricShots(['C14', 'C15', 'C16', 'C17', 'C18', 'C19', 'C20'], 13), // 预副歌一
    ...lyricShots(['C21', 'C22', 'C23', 'C24', 'C25', 'C26', 'C27'], 20), // 副歌二
    { id: 'N1', after: 26 },                                           // 间奏（106.9–120.3 秒，4 小节）按小节三等分
    { id: 'N2', at: 111.0 },
    { id: 'N3', at: 115.5 },
    ...lyricShots(['C28', 'C29', 'C30', 'C31', 'C32', 'C33', 'C34'], 27), // 预副歌二
    ...lyricShots(['C35', 'C36', 'C37', 'C38', 'C39', 'C40', 'C41'], 34), // 副歌三
  ],
  // 音频在最后一个字落下后 0.3 秒就结束了，所以 tail 只留 0.3；跑过 align 之后节拍用实测的
  planOptions: { tail: 0.3, beat: 'measured' },
  // 片头卡只放两行：歌名 + 歌手名。不放片尾卡（最后一句唱完渐黑结束）。
  cards: { title: { main: '浪人琵琶', sub: '大肥鱼' } },
});
