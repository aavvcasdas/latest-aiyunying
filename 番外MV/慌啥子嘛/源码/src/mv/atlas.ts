// 角色图集：来自分支 通用模板/engine/assets/cast_atlas.png + .json
import atlasUrl from '../assets/cast_atlas.png';
import atlasJson from '../assets/cast_atlas.json';

export type Fr = { x: number; y: number; w: number; h: number };
const S = (atlasJson as { s: Record<string, number[]> }).s;

export type CharId = 'whale' | 'gpt' | 'claude' | 'gemini' | 'kimi' | 'doubao' | 'qwen' | 'zai';
export const CAST: CharId[] = ['whale', 'doubao', 'gpt', 'kimi', 'gemini', 'claude', 'qwen', 'zai'];

export const NAMES: Record<CharId, string> = {
  whale: '本鲸',
  doubao: '豆包',
  gpt: '龙娘',
  kimi: 'Kimi',
  gemini: '猫',
  claude: '小克',
  qwen: '千问',
  zai: '狐狸',
};

interface CharMeta {
  base: number; // 站立格的像素高
  height: number; // 对应的世界高度
  front: string;
  side: string | null;
  walk: string;
  portrait: string;
}

export const CHAR: Record<CharId, CharMeta> = {
  whale: { base: 88, height: 1.7, front: 'whale_idle', side: null, walk: 'walk_whale', portrait: 'p_whale_neutral' },
  gpt: { base: 176, height: 2.35, front: 'gpt_boss_idle', side: null, walk: 'act_gpt_hover', portrait: 'p_gpt_neutral' },
  claude: { base: 90, height: 1.72, front: 'claude_front_0', side: 'claude_side_0', walk: 'walk_claude', portrait: 'p_claude_neutral' },
  gemini: { base: 84, height: 1.66, front: 'gemini_front_0', side: 'gemini_side_0', walk: 'walk_gemini', portrait: 'p_gemini' },
  kimi: { base: 84, height: 1.66, front: 'kimi_front_0', side: 'kimi_side_0', walk: 'walk_kimi', portrait: 'p_kimi' },
  doubao: { base: 84, height: 1.6, front: 'doubao_cage_0', side: null, walk: 'walk_doubao_big', portrait: 'p_doubao_neutral' },
  qwen: { base: 84, height: 1.66, front: 'qwen_front_0', side: 'qwen_side_0', walk: 'walk_qwen', portrait: 'p_qwen' },
  zai: { base: 84, height: 1.66, front: 'zai_front_0', side: 'zai_side_0', walk: 'walk_zai', portrait: 'p_zai' },
};

export function hasFrame(name: string): boolean {
  return !!S[name];
}

export function fr(name: string): Fr {
  const a = S[name];
  if (!a) throw new Error(`图集里没有这一格：${name}`);
  return { x: a[0], y: a[1], w: a[2], h: a[3] };
}

const seqCache = new Map<string, number>();
export function seqLen(prefix: string): number {
  let n = seqCache.get(prefix);
  if (n === undefined) {
    n = 0;
    while (S[`${prefix}_${n}`]) n++;
    seqCache.set(prefix, n);
  }
  return n;
}

/** 某一格应有的世界高度（飞行形态另算） */
export function heightOf(id: CharId, frame: string): number {
  const f = fr(frame);
  if (id === 'gpt' && (frame.startsWith('gpt_fly') || frame.startsWith('act_gpt_hover'))) return (f.h / 104) * 1.75;
  const m = CHAR[id];
  return (f.h / m.base) * m.height;
}

/** 派生动作：act_<id>_<name>_<i> */
export function actFrame(id: CharId, name: string, t: number, fps = 8, offset = 0): string {
  const prefix = `act_${id}_${name}`;
  const n = seqLen(prefix);
  if (n === 0) return CHAR[id].front;
  const i = ((Math.floor(t * fps + offset) % n) + n) % n;
  return `${prefix}_${i}`;
}

/** 步态格（八格一循环） */
export function walkFrame(id: CharId, t: number, fps = 9, offset = 0): string {
  const prefix = CHAR[id].walk;
  const n = seqLen(prefix);
  const i = ((Math.floor(t * fps + offset) % n) + n) % n;
  return `${prefix}_${i}`;
}

/** 两格交替的正面待机（原有造型） */
export function frontFrame(id: CharId, t: number, period = 2.4): string {
  const m = CHAR[id];
  const alt = m.front.replace(/_0$/, '_1');
  if (m.front === 'whale_idle') return (t % period) < 0.18 ? 'whale_blink' : 'whale_idle';
  if (m.front === 'gpt_boss_idle') return (t % period) < 0.18 ? 'gpt_boss_blink' : 'gpt_boss_idle';
  if (hasFrame(alt)) return (t % period) < 0.2 ? alt : m.front;
  return m.front;
}

export function sideFrame(id: CharId): string | null {
  return CHAR[id].side;
}

export const ATLAS_URL = atlasUrl;
let img: CanvasImageSource | null = null;
export function atlasImage(): CanvasImageSource {
  if (!img) throw new Error('图集还没加载');
  return img;
}
export function setAtlasImage(i: CanvasImageSource) {
  img = i;
}
export function loadAtlas(): Promise<CanvasImageSource> {
  if (img) return Promise.resolve(img);
  return new Promise((res, rej) => {
    const im = new Image();
    im.onload = () => {
      img = im;
      res(im);
    };
    im.onerror = () => rej(new Error('图集加载失败'));
    im.src = atlasUrl;
  });
}
