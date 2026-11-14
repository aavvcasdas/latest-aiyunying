// 排镜：一句词一个镜头（长句在词意转折处再切一刀），切点比实测起唱早 2 帧。
import { DURATION, LYRICS } from './data';
import type { ShotDef, ShotSpec } from './engine';
import { SHOTS_A } from './shotsA';
import { SHOTS_B } from './shotsB';

const PRE = 2 / 30;
const ALL: ShotSpec[] = [...SHOTS_A, ...SHOTS_B];
const starts = ALL.map((s) => (s.from ? Math.max(0, LYRICS[s.from[0]].t[s.from[1]] - PRE) : 0));
export const SHOTS: ShotDef[] = ALL.map((s, i) => ({ ...s, t0: starts[i], t1: i + 1 < ALL.length ? starts[i + 1] : DURATION }));

export const NAMES: Record<string, string> = { whale: '鲸鱼娘', claude: '小克', gemini: '猫', gpt: '龙娘', kimi: 'Kimi', doubao: '豆包', qwen: '千问', zai: '狐狸' };
