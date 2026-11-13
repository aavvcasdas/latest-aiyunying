export type SceneName = 'letters' | 'twilight' | 'rain' | 'sunrise';
export type CaptionMode = 'character' | 'word' | 'line';
export type Motif = 'letters' | 'circles' | 'pages' | 'apart' | 'embers' | 'embrace' | 'silence' | 'time' | 'ribbon' | 'reach' | 'heart' | 'walk';

export interface LyricCue {
  id: number;
  text: string;
  start: number;
  end: number;
  words: string[];
  motif: Motif;
  direction: string;
}

export const DURATION = 235.08;
export const INITIAL_TIME = 48.65;
export const REPO_URL = 'https://github.com/aavvcasdas/latest-aiyunying/tree/arena/bb6a02da-latest-aiyunying';
export const VIDEO_URL = 'https://github.com/aavvcasdas/latest-aiyunying/blob/arena/bb6a02da-latest-aiyunying/%E8%83%8C%E5%AF%B9%E8%83%8C%E6%8B%A5%E6%8A%B1.mp4';

const phrases: Record<string, { words: string[]; motif: Motif; direction: string }> = {
  '话总说不清楚': { words: ['话', '总说', '不清楚'], motif: 'letters', direction: '本鲸捧起没寄出的信，纸页在风里轻轻散开。镜头缓缓推近。' },
  '该怎么明了': { words: ['该', '怎么', '明了'], motif: 'reach', direction: '小克在溪流另一边回望，伸出的手停在半空。' },
  '一字一句像圈套': { words: ['一字', '一句', '像', '圈套'], motif: 'circles', direction: '未说完的字句绕成纸环。两个人隔着圆环，找不到出口。' },
  '旧账总翻不完': { words: ['旧账', '总', '翻不完'], motif: 'pages', direction: '旧信一页页翻起，镜头绕过本鲸肩头，让回忆慢慢落地。' },
  '谁无理取闹': { words: ['谁', '无理', '取闹'], motif: 'apart', direction: '两人各退一步，不将任何一方写成坏人，只留下没被听见的委屈。' },
  '你的双手甩开刚好的微妙': { words: ['你的', '双手', '甩开', '刚好的', '微妙'], motif: 'apart', direction: '指尖将要相碰时又错开，两张纸片之间留出一道细细的光。' },
  '然后战火再燃烧': { words: ['然后', '战火', '再', '燃烧'], motif: 'embers', direction: '橙色折纸火星升起，触到云朵后变成花瓣。不使用真实战火。' },
  '我们背对背拥抱': { words: ['我们', '背对背', '拥抱'], motif: 'embrace', direction: '本鲸与小克背靠着背。镜头温柔拉近，靠近的身体仍隔着沉默。' },
  '滥用沉默在咆哮': { words: ['滥用', '沉默', '在', '咆哮'], motif: 'silence', direction: '脚下涟漪一圈圈扩散，细雨代替争吵，人物安静地垂下头。' },
  '爱情来不及变老': { words: ['爱情', '来不及', '变老'], motif: 'time', direction: '一圈纸花像时钟慢慢转动，还未盛开，花瓣便先落下。' },
  '葬送在烽火的玩笑': { words: ['葬送', '在', '烽火的', '玩笑'], motif: 'embers', direction: '未寄出的纸页化作暖色星点。保留遗憾，但让画面不失温度。' },
  '真话兜着圈子乱乱绕': { words: ['真话', '兜着', '圈子', '乱乱绕'], motif: 'ribbon', direction: '一根细纸带绕着两人打结，绕行镜头呈现无法直说的心意。' },
  '只是想让我知道': { words: ['只是', '想让', '我', '知道'], motif: 'reach', direction: '本鲸轻轻侧身，终于看见对方一直握着的那封信。' },
  '只是想让你知道': { words: ['只是', '想让', '你', '知道'], motif: 'reach', direction: '小克抬起头回应，信纸落在两人之间，镜头从远处缓缓靠近。' },
  '爱的警告': { words: ['爱的', '警告'], motif: 'heart', direction: '裂开的纸心亮起一条金线。这不是告别，是希望被理解的提醒。' },
  '我不要一直到': { words: ['我', '不要', '一直到'], motif: 'walk', direction: '本鲸先向前迈步，不再让沉默决定结局。天边出现第一束晨光。' },
  '形同陌路变成自找': { words: ['形同陌路', '变成', '自找'], motif: 'walk', direction: '两条分开的纸路向同一座桥延伸，人物开始回头。' },
  '既然可以拥抱': { words: ['既然', '可以', '拥抱'], motif: 'reach', direction: '本鲸递出手，小克主动靠近。这一次，指尖没有错过。' },
  '就不要轻易放掉': { words: ['就', '不要', '轻易', '放掉'], motif: 'embrace', direction: '镜头停在两人的近景，风渐渐停下来，纸花重新舒展。' },
  '这警告': { words: ['这', '警告'], motif: 'heart', direction: '纸心的裂缝被暖光连接，过去的误会终于有了柔软的出口。' },
};

// Line changes were sampled from the supplied video at 4 fps. Split lines and
// character timings are interpolated, not claimed as vocal forced alignment.
const rawCues: [string, number, number][] = [
  ['话总说不清楚', 15, 18.35], ['该怎么明了', 18.35, 21],
  ['一字一句像圈套', 22, 26.5], ['旧账总翻不完', 29, 32.4],
  ['谁无理取闹', 32.4, 35.5], ['你的双手甩开刚好的微妙', 35.5, 41.25],
  ['然后战火再燃烧', 41.25, 45.25], ['我们背对背拥抱', 48, 51.25],
  ['滥用沉默在咆哮', 51.25, 54.75], ['爱情来不及变老', 54.75, 58.25],
  ['葬送在烽火的玩笑', 58.25, 62.25], ['我们背对背拥抱', 62.25, 65.75],
  ['真话兜着圈子乱乱绕', 65.75, 70.5], ['只是想让我知道', 70.5, 73.5],
  ['只是想让你知道', 73.5, 76.5], ['爱的警告', 76.5, 80],
  ['话总说不清楚', 82.25, 86], ['该怎么明了', 86, 89.75],
  ['一字一句像圈套', 89.75, 95.25], ['旧账总翻不完', 97, 100.4],
  ['谁无理取闹', 100.4, 103.75], ['你的双手甩开刚好的微妙', 103.75, 109.75],
  ['然后战火再燃烧', 109.75, 113.5], ['我们背对背拥抱', 114.5, 117.75],
  ['滥用沉默在咆哮', 117.75, 121.25], ['爱情来不及变老', 121.75, 125],
  ['葬送在烽火的玩笑', 125, 128.75], ['我们背对背拥抱', 128.75, 132.5],
  ['真话兜着圈子乱乱绕', 132.5, 136.5], ['只是想让我知道', 137, 139.25],
  ['只是想让你知道', 140.5, 143], ['爱的警告', 143, 146.5],
  ['我不要一直到', 148.5, 151.5], ['形同陌路变成自找', 152.25, 155.5],
  ['既然可以拥抱', 155.5, 158], ['就不要轻易放掉', 158, 161.25],
  ['我们背对背拥抱', 164.5, 167.5], ['滥用沉默在咆哮', 168.5, 171.25],
  ['爱情来不及变老', 172.5, 175], ['葬送在烽火的玩笑', 175, 178.5],
  ['我们背对背拥抱', 179.5, 182.25], ['真话兜着圈子乱乱绕', 183.5, 186.75],
  ['只是想让我知道', 187.5, 189.25], ['只是想让你知道', 189.25, 193],
  ['这警告', 193, 196.25], ['只是想让我知道', 197.25, 200.5],
  ['只是想让你知道', 200.5, 204], ['爱的警告', 204, 209],
];

export const lyrics: LyricCue[] = rawCues.map(([text, start, end], index) => ({ id: index + 1, text, start, end, ...phrases[text] }));

export const chapters: { id: number; title: string; subtitle: string; start: number; end: number; scene: SceneName; sample: number; color: string; description: string }[] = [
  { id: 1, title: '未说出口的话', subtitle: '序章 · 误解', start: 0, end: 29, scene: 'letters', sample: 16, color: '#dce4d5', description: '森林里的两把空椅，和一封始终没能寄出的信。把说不清的心意，交给风。' },
  { id: 2, title: '绕不开的心结', subtitle: '主歌 · 拉扯', start: 29, end: 48, scene: 'rain', sample: 36.5, color: '#ddd8ed', description: '旧信翻飞，纸环相绕。争执不是不在意，而是想被听见，却又说不明白。' },
  { id: 3, title: '背对背的距离', subtitle: '副歌 · 沉默', start: 48, end: 82.25, scene: 'twilight', sample: 48.65, color: '#eddbeb', description: '暮色中，两个人背靠着背。明明近在咫尺，却隔着那些没能坦诚的话。' },
  { id: 4, title: '在沉默里想你', subtitle: '再叙 · 回望', start: 82.25, end: 148.5, scene: 'rain', sample: 115.5, color: '#dce0ed', description: '细雨落下，回忆重演。同样的距离里，开始出现一次迟疑的回望。' },
  { id: 5, title: '向你走去', subtitle: '桥段 · 靠近', start: 148.5, end: 179.5, scene: 'sunrise', sample: 156, color: '#ede5d4', description: '第一束晨光落在桥上。这一次先迈出一步，让拥抱代替无声的试探。' },
  { id: 6, title: '把爱说给你听', subtitle: '终章 · 和解', start: 179.5, end: DURATION, scene: 'sunrise', sample: 205.5, color: '#eeded6', description: '纸心的裂缝被金色晨光连接。留下的不是警告，而是愿意继续靠近的答案。' },
];

export const cast = [
  { id: 'whale', name: '本鲸', english: 'DeepSeek', role: '先迈出一步的人', image: 'whale_idle', color: '#e5ecfc', description: '把没说完的话折成信，也在故事的最后，先递出自己的手。沿用原分支蓝发、鲸鳍与蓝白女仆装。' },
  { id: 'claude', name: '小克', english: 'Claude', role: '愿意转身回应的人', image: 'claude_front_0', color: '#f9e7da', description: '认真听完每一句话，学着把藏在心里的在意说出来。沿用原分支橘发、花饰与裙装。' },
];

export function getChapter(time: number) {
  return chapters.find((chapter) => time >= chapter.start && time < chapter.end) ?? chapters[chapters.length - 1];
}

export function getCue(time: number) {
  return lyrics.find((cue) => time >= cue.start && time < cue.end);
}

export function getNearestCueIndex(time: number) {
  const next = lyrics.findIndex((cue) => cue.end > time);
  return next < 0 ? lyrics.length - 1 : next;
}

export function characterTiming(cue: LyricCue, index: number) {
  const count = cue.text.length;
  const singingDuration = (cue.end - cue.start) * 0.83;
  return cue.start + (index / Math.max(1, count - 1)) * singingDuration;
}

export function formatTime(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safe / 60).toString().padStart(2, '0')}:${(safe % 60).toString().padStart(2, '0')}`;
}

export function srtContent(offset = 0) {
  const stamp = (t: number) => {
    const ms = Math.max(0, Math.round(t * 1000));
    return `${Math.floor(ms / 3600000).toString().padStart(2, '0')}:${Math.floor(ms / 60000 % 60).toString().padStart(2, '0')}:${Math.floor(ms / 1000 % 60).toString().padStart(2, '0')},${(ms % 1000).toString().padStart(3, '0')}`;
  };
  return lyrics.map((cue) => `${cue.id}\n${stamp(cue.start + offset)} --> ${stamp(cue.end + offset)}\n${cue.text}\n`).join('\n');
}