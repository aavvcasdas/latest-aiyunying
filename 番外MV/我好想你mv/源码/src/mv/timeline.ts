import type React from 'react';
import { LINES, DURATION } from './Lyrics';
import type { SP } from './scenesA';
import { Intro, Title, DarkRoom, RoomOn, RoomOff, Calendar, Leave, Fade, Numb, Chorus, Tiptoe, Orbit, Tears, Mask, Mirror } from './scenesA';
import { Flight, Film, Phone, Album, Balloon, Secret, Box, MoonEnd, End } from './scenesB';

export type Shot = { id: string; name: string; at: number; end: number; C: React.FC<SP>; v: 1 | 2; flash?: string };

/** 镜头切点挂在歌词行上：S(n) = 第 n 行第一个字的起音 */
const S = (n: number) => LINES[n].start;
const raw: [string, string, number, React.FC<SP>, 1 | 2, string?][] = [
  ['intro', '片头 · 翻开故事书', 0, Intro, 1],
  ['title', '切割垫上的四个字', 12.6, Title, 1, '#fff'],
  ['dark', '你也看得到月亮吗', 26.2, DarkRoom, 1, '#000'],
  ['on1', '开了灯 眼前的模样', S(0) - 0.3, RoomOn, 1],
  ['off1', '关了灯 全都一个样', S(2) - 0.04, RoomOff, 1],
  ['cal', '生命 随年月流去', S(4) - 0.2, Calendar, 1, '#fff'],
  ['leave', '随着你离去', S(5) - 0.12, Leave, 1, '#fff'],
  ['fade', '随往事淡去 随梦境睡去', S(6) - 0.12, Fade, 1, '#000'],
  ['numb', '随麻痹的心逐渐远去', S(7) - 0.12, Numb, 1, '#000'],
  ['chorus1', '我好想你 好想你', S(8) - 0.1, Chorus, 1, '#fff'],
  ['tiptoe1', '我还踮着脚思念', S(10) - 0.25, Tiptoe, 1, '#000'],
  ['orbit1', '我还任记忆盘旋', S(11) - 0.12, Orbit, 1, '#fff'],
  ['tears1', '我还闭着眼流泪', S(12) - 0.12, Tears, 1, '#fff'],
  ['mask1', '我还装作无所谓', S(13) - 0.12, Mask, 1, '#fff'],
  ['mirror1', '却欺骗自己', S(14) - 0.1, Mirror, 1, '#fff'],
  ['flight', '间奏 · 纸飞机', 134.6, Flight, 1, '#fff'],
  ['on2', '开了灯 眼前的模样', S(16) - 0.3, RoomOn, 2, '#fff'],
  ['off2', '关了灯 全都一个样', S(18) - 0.04, RoomOff, 2],
  ['film', '生命 随年月流去', S(20) - 0.2, Film, 2, '#fff'],
  ['phone', '快乐渺无音讯', S(21) - 0.12, Phone, 2, '#fff'],
  ['album', '随往事淡去 随梦境睡去', S(22) - 0.12, Album, 2, '#fff'],
  ['balloon', '随麻痹的心逐渐远去', S(23) - 0.12, Balloon, 2, '#000'],
  ['chorus2', '我好想你 好想你', S(24) - 0.1, Chorus, 2, '#fff'],
  ['tiptoe2', '我还踮着脚思念', S(26) - 0.25, Tiptoe, 2, '#000'],
  ['orbit2', '我还任记忆盘旋', S(27) - 0.12, Orbit, 2, '#000'],
  ['tears2', '我还闭着眼流泪', S(28) - 0.12, Tears, 2, '#000'],
  ['mask2', '我还装作无所谓', S(29) - 0.12, Mask, 2, '#000'],
  ['mirror2', '却欺骗自己', S(30) - 0.2, Mirror, 2, '#fff'],
  ['secret', '就当作秘密', S(32) - 0.2, Secret, 2, '#fff'],
  ['box', '就深藏在心', S(34) - 0.2, Box, 2, '#000'],
  ['moon', '尾奏 · 月亮上', 292.0, MoonEnd, 2, '#fff'],
  ['end', '片尾', 318.5, End, 2, '#000'],
];

export const SHOTS: Shot[] = raw.map((r, i) => ({ id: r[0], name: r[1], at: r[2], end: i + 1 < raw.length ? raw[i + 1][2] : DURATION, C: r[3], v: r[4], flash: r[5] }));

export function shotAt(t: number): Shot {
  for (let i = SHOTS.length - 1; i >= 0; i--) if (t >= SHOTS[i].at) return SHOTS[i];
  return SHOTS[0];
}
