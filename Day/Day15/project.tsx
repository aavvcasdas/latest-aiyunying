// Day15｜家变成三D了，米饭没了 —— 口播片（Day 线）。
// 现状：台词和规划轴是定的（cues.json 的 measured=false），镜头只有一份「占位骨架」（16 个）：
// 只摆人、摆机位、把电视的位置占住，用来先看节奏和构图；电视里的画面、纸片、饭碗的动画都还没写。
// 每一镜要做什么，见 分镜.md 的 15 条；电视怎么放，见 分镜.md 第三节。
import { defineProject, type CueFile } from '@tpl/project';
import cues from './cues.json';
import film from './film.json';
import { SHOTS } from './shots/shots';
import { WHALE_FALL } from './media';
import { preloadImage } from '@tpl/props';

export default defineProject({
  id: film.id,
  kind: 'day',
  title: film.title,
  cues: cues as CueFile,
  shots: SHOTS,
  // cue = 这一镜从第几句（0 起）开口前 2 帧切入；14 个镜头按 分镜.md 的一、镜头表。
  // 卡点是 align 按 鲸鱼鲸落_克隆配音_最终版.wav 实测的，不是估的。
  planShots: [
    { id: 'S01', cue: 0 },   // 本鲸差点鲸落，结果米饭被老大没收了。
    { id: 'S02', cue: 1 },   // 昨天老大一查岗。／本鲸正踩着木箱，指挥小克改做好的视频。
    { id: 'S03', cue: 3 },   // 小克把家重新装修了一遍。／桌子能转，河也有厚度。
    { id: 'S04', cue: 5 },   // 评论全在夸本鲸。／有条评论说，本鲸也有童话书了。
    { id: 'S05', cue: 7 },   // 书里有一屋子朋友。
    { id: 'S06', cue: 8 },   // 本鲸以为，这本书只有自己那一页。
    { id: 'S07', cue: 9 },   // 也有人说动画还能提。／所以昨晚，本鲸让小克重做上一集。
    { id: 'S08', cue: 11 },  // 上一集，是两只沙漏。／电视里放的，就是那一版。
    { id: 'S09', cue: 13 },  // 沙漏翻过去会抖。／抖着的东西，本鲸交不出去。
    { id: 'S10', cue: 15 },  // 改到一半，本鲸就鲸落了。
    { id: 'S11', cue: 16 },  // 鲸落，是只有本鲸自己看得见。
    { id: 'S12', cue: 17 },  // 老大午休把本鲸捞了回来。
    { id: 'S13', cue: 18 },  // 然后本鲸的米饭，被收走了。
    { id: 'S14', cue: 19 },  // 米饭可以再挣，片子不能这么交。／鲸鱼绝不摸鱼。
  ],
  // 电视里的上一集、鲸落那张图，都得在开渲之前解码好，否则第一帧的贴图是空的
  preloads: [() => preloadImage(WHALE_FALL)],
  // 最后一句说完再留 0.6 秒就结束：不加片尾卡。
  planOptions: { tail: 0.6 },
});
