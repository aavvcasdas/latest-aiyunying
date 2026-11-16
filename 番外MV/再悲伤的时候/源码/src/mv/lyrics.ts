// 歌词理解表：每句的分词（「/」分词，「*」关键词）、三维字卡的入场方式、版式、高亮色、画面说明。
// 时间不在这里：逐字起音全部来自 timing.ts（实测）。
import { LINES } from './timing';

export type Style =
  | 'rain' | 'shiver' | 'mirage' | 'drift' | 'hesitate' | 'sneak' | 'moon' | 'deep' | 'bloom' | 'wish' | 'eyelid'
  | 'flicker' | 'burst' | 'float' | 'sweep' | 'turn' | 'wave' | 'halt' | 'calm' | 'vast' | 'sun';
export type Layout = 'low' | 'top' | 'left' | 'right' | 'center' | 'vert' | 'arc';

export interface LineSpec { seg: string; style: Style; layout: Layout; hi: string; scene: string; note: string }

export const SPEC: LineSpec[] = [
  { seg: '在/*悲伤/的/时候', style: 'rain', layout: 'low', hi: '#9fd3ff', scene: '雨夜码头', note: '雨夜的码头，本鲸一个人站在路灯下。字像雨点一颗颗落进字槽。' },
  { seg: '在/*痛苦/的/时候', style: 'shiver', layout: 'low', hi: '#8fc4ff', scene: '雨夜码头', note: '雨更大，本鲸缩成一团发抖；「痛」字落下时劈下一道闪电。' },
  { seg: '*坦率/像/沙漠里/的/*海市蜃楼', style: 'mirage', layout: 'top', hi: '#ffcf8a', scene: '黄昏沙漠', note: '想坦白的心意像沙漠里的海市蜃楼：热浪里摇晃着小克的倒影，本鲸伸手，它就散了。' },
  { seg: '我/看着/你/*背影', style: 'drift', layout: 'right', hi: '#ffd9a8', scene: '傍晚街道', note: '小克沿着街往远处走，越走越小；本鲸停在原地看她的背影。' },
  { seg: '想/*开口', style: 'hesitate', layout: 'left', hi: '#ffd9a8', scene: '傍晚街道', note: '本鲸伸出手，空白的对话框冒出来，在拖长的「口」里慢慢瘪掉。' },
  { seg: '那/*勇气/却/和/*时间/偷偷/*溜走', style: 'sneak', layout: 'low', hi: '#ffd08f', scene: '时钟广场', note: '勇气是一颗小小的心，跟着飞转的指针偷偷溜出画面；唱完的字也一个个溜走。' },
  { seg: '*思念/知/*难眠', style: 'moon', layout: 'vert', hi: '#d9d2ff', scene: '月夜卧室', note: '睡不着的夜。窗外月牙上坐着守夜的 Kimi，本鲸的「Zzz」一冒出来就破了。' },
  { seg: '*时间/不知/*深浅', style: 'deep', layout: 'center', hi: '#c9b8ff', scene: '时钟深渊', note: '镜头坠进满是时钟的深渊，猫（Gemini）抱着她的两只钟东张西望——时间不知深浅。' },
  { seg: '想做/你/*锦上添花/一场/*盛宴', style: 'bloom', layout: 'low', hi: '#ffd27a', scene: '梦里的盛宴', note: '梦里的盛宴：每唱一个字桌上开一朵花，本鲸把饭碗递向小克，大家围坐。' },
  { seg: '是/*唯一/*心愿', style: 'wish', layout: 'low', hi: '#ffe3a3', scene: '许愿', note: '本鲸低头许愿，一盏孔明灯从她手边升起。' },
  { seg: '可/*睁眼', style: 'eyelid', layout: 'center', hi: '#cfe8ff', scene: '睁眼', note: '「可、睁、眼」三拍：眼皮合上—半睁—全睁。盛宴碎成金色纸片，落进现实的雨里。' },
  { seg: '*现实/和/*梦/啊/原来/都在/*一瞬间', style: 'flicker', layout: 'low', hi: '#ffffff', scene: '梦与现实', note: '每唱一个字切一次世界：冷雨与暖光跟着十六分音符来回闪，本鲸站在同一个位置。「间」字白闪进副歌。' },
  { seg: '我们的/*心/像/*烟火', style: 'burst', layout: 'top', hi: '#ffb3d1', scene: '湖边烟火', note: '副歌。第一枚烟火在「心」字升空，在「火」字炸成一颗心。' },
  { seg: '*一朵/*连结/着/*一朵', style: 'burst', layout: 'low', hi: '#ffc58f', scene: '烟火连珠', note: '七个字七朵烟火：大家沿湖依次点燃，金线把它们一朵朵连起来。' },
  { seg: '不/*独自/*飘落', style: 'float', layout: 'top', hi: '#ffd6a0', scene: '火花飘落', note: '落下的火星两两相随，不独自飘落，落到并排站着的大家头顶。' },
  { seg: '*赶走/了/*寂寞', style: 'sweep', layout: 'low', hi: '#bfe9ff', scene: '云开', note: '回到码头：雨停，乌云被推开，月亮和星星露出来，本鲸跳了起来。' },
  { seg: '*转身/你/在/*原地/*等我', style: 'turn', layout: 'low', hi: '#ffcf9e', scene: '路灯下', note: '本鲸转身，镜头绕到她身后：小克还在那盏路灯下等她。' },
  { seg: '也许/会/偶尔/*停泊', style: 'wave', layout: 'low', hi: '#a8e4ff', scene: '小船停泊', note: '两人的小船顺着水漂到灯塔边，在「停泊」两个字上停稳。' },
  { seg: '*结束/向前的/*念头', style: 'halt', layout: 'low', hi: '#ffe0b0', scene: '不再赶路', note: '向前的路灯从远到近一盏盏熄灭，本鲸停下脚步，坐到看书的小克身边。' },
  { seg: '也/*不畏/*寂寞', style: 'calm', layout: 'top', hi: '#d8e6ff', scene: '星空', note: '银河下的礁石，本鲸一个人也不怕了，点点头。流星划过。' },
  { seg: '和/*天空/*海阔', style: 'vast', layout: 'center', hi: '#bfefff', scene: '天空海阔', note: '镜头一路拉远拉高，海天一线泛白；龙姐的影子只从画面上方掠过。' },
  { seg: '*转身/看见/你/*灿烂的/*笑容', style: 'sun', layout: 'low', hi: '#ffd36e', scene: '日出', note: '日出里再转身一次：小克和大家都在，笑得很灿烂。' },
];

export interface Seg { c: string; word: number; key: boolean }
export interface ParsedLine { segs: Seg[]; words: { from: number; to: number; key: boolean; text: string }[] }

export function parseLine(i: number): ParsedLine {
  const src = SPEC[i].seg; const segs: Seg[] = []; const words: ParsedLine['words'] = [];
  src.split('/').forEach((w, wi) => {
    const key = w.startsWith('*'); const s = key ? w.slice(1) : w; const from = segs.length;
    for (const c of s) segs.push({ c, word: wi, key });
    words.push({ from, to: segs.length - 1, key, text: s });
  });
  const joined = segs.map((s) => s.c).join('');
  if (joined !== LINES[i].text) throw new Error(`分词与歌词对不上：${joined} ≠ ${LINES[i].text}`);
  return { segs, words };
}
export const PARSED = SPEC.map((_, i) => parseLine(i));
