// 人物动作总览：八位角色 × 高清派生动作（没有音源，只出无声样片）。
// 一句一个动作，排镜按 cue 切：每个角色一镜，镜头的起止正好是它那几句的起止。
import { defineProject, type CueFile } from '@tpl/project';
import cues from './cues.json';
import film from './film.json';
import { GROUPS, SHOTS } from './shots/shots';
import { FIRST_LINE } from './shots/shots';

export default defineProject({
  id: film.id,
  kind: 'day',
  title: film.title,
  cues: cues as CueFile,
  shots: SHOTS,
  // 每位角色一镜：从他那组的第一句开口前 2 帧切入
  planShots: GROUPS.map((g, i) => ({ id: `G_${g.id}`, cue: FIRST_LINE[i] })),
  // 最后一句说完就结束，不留片尾卡（AGENTS.md：不加片尾卡）
  planOptions: { tail: 0.2 },
});
