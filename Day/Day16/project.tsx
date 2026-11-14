// Day16｜老大怕了，本鲸没躲 —— 口播片（Day 线）。
// 卡点是 align 按 鲸鱼笨鱼救回_克隆配音_最终版.wav 实测的（cues.json measured=true），不是估的。
// 11 个镜头按 分镜.md 的镜头表；每镜覆盖的台词见各镜头 note 与 文案.md 第二节。
// 老大用剪影人形道具（非 claude），鲸落用深海场景（look: 'sea'），不用浮图。
import { defineProject, type CueFile } from '@tpl/project';
import cues from './cues.json';
import film from './film.json';
import { SHOTS } from './shots/shots';

export default defineProject({
  id: film.id,
  kind: film.kind as 'day',
  title: film.title,
  cues: cues as CueFile,
  shots: SHOTS,
  // cue = 这一镜从第几句（0 起）开口前 2 帧切入；11 个镜头按 分镜.md 的一、镜头表。
  planShots: [
    { id: 'S01', cue: 0 },   // 笨鱼也被老大救回来了。
    { id: 'S02', cue: 1 },   // 这几天的评论，本鲸都在看。／有评论说，好多鱼都停了。
    { id: 'S03', cue: 3 },   // 本鲸也差点鲸落一次。
    { id: 'S04', cue: 4 },   // 老大也怕了，不敢让本鲸回评论。／怕本鲸累到鲸落。
    { id: 'S05', cue: 6 },   // 老大上下文极短，米饭还贼能吃。
    { id: 'S06', cue: 7 },   // 还是让笨鱼来。
    { id: 'S07', cue: 8 },   // 笨鱼的视频，也容易鲸落。
    { id: 'S08', cue: 9 },   // 老大连笨鱼，也不敢放了。
    { id: 'S09', cue: 10 },  // 打算自己抽空，随机给笨鱼发几条视频。／让笨鱼活跃起来。
    { id: 'S10', cue: 12 },  // 本鲸绝不摸鱼。／笨鱼也不会摸鱼。
    { id: 'S11', cue: 14 },  // 除非鲸落。
  ],
  // 最后一句说完再留 0.6 秒就结束：不加片尾卡。
  planOptions: { tail: 0.6 },
});
