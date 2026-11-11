// Day15｜家变成三D了，米饭没了 —— 口播片（Day 线）。
// 现状：台词和规划轴是定的（cues.json 的 measured=false），镜头只有一份「占位骨架」（16 个）：
// 只摆人、摆机位、把电视的位置占住，用来先看节奏和构图；电视里的画面、纸片、饭碗的动画都还没写。
// 每一镜要做什么，见 分镜.md 的 15 条；电视怎么放，见 分镜.md 第三节。
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
  // cue = 这一镜从第几句（0 起）开口前 2 帧切入；16 个镜头按 分镜.md 的一、镜头表。
  planShots: [
    { id: 'S01', cue: 0 },   // 本鲸是一只住在电脑里的鲸鱼。／本鲸替老大做视频，老大给米饭。
    { id: 'S02', cue: 2 },   // 昨天，Claude大小姐把家改成了三D。／桌子能转，河也有厚度。
    { id: 'S03', cue: 4 },   // 评论全在夸本鲸。／干活的明明是她。
    { id: 'S04', cue: 6 },   // 本鲸求了她很久，还烧了不少米饭。／有条评论说，本鲸也有童话书了。
    { id: 'S05', cue: 8 },   // 书里有豆包，有龙娘，有一屋子朋友。
    { id: 'S06', cue: 9 },   // 本鲸以为，这本书只有自己那一页。
    { id: 'S07', cue: 10 },  // 也有人说动画还能提，本鲸认。
    { id: 'S08', cue: 11 },  // 所以昨晚，本鲸让她重做上一集。
    { id: 'S09', cue: 12 },  // 上一集，是两只沙漏。／电视里放的，就是那一版。
    { id: 'S10', cue: 14 },  // 沙漏翻过去会抖。／抖着的东西，本鲸交不出去。
    { id: 'S11', cue: 16 },  // 昨天那条片子，差点鲸落。／这里的鲸落不是沉底，是只有本鲸自己看得见。／老大午休把片子捞了回来。
    { id: 'S12', cue: 19 },  // 结果老大一查岗。／本鲸正踩着木箱，指挥Claude改片子。
    { id: 'S13', cue: 21 },  // 老大看了很久。／说，早知道不捞了。
    { id: 'S14', cue: 23 },  // 然后本鲸的米饭，被收走了。／一粒都没留。
    { id: 'S15', cue: 25 },  // 米饭可以再挣，片子不能这么交。／下一集，本鲸把沙漏重做一遍。
    { id: 'S16', cue: 27 },  // 抖的那几秒，一帧不留。／鲸鱼绝不摸鱼。
  ],
  // 最后一句说完再留 0.6 秒就结束：不加片尾卡。
  planOptions: { tail: 0.6 },
});
