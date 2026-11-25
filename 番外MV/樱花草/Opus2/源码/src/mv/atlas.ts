// 角色图集：八位像素角色（沿用项目 通用模板/engine/assets 的 cast_atlas 原图）。
// 只做三件事：按格名取图、按动作名取帧、按位移迈步；缺格直接抛错，不拿别的造型顶替。
import atlasUrl from '../assets/cast_atlas.png';
import atlasJson from '../assets/cast_atlas.json';
import actionsJson from '../assets/cast_actions.json';

export type CastId = 'whale' | 'claude' | 'gpt' | 'gemini' | 'kimi' | 'doubao' | 'qwen' | 'zai';
export type Rect = [number, number, number, number];

type ActionDef = { label: string; fps: number; loop: boolean; frames: string[]; size: [number, number] };
const ATLAS = atlasJson as unknown as { w: number; h: number; s: Record<string, Rect> };
const ACTIONS = (actionsJson as unknown as { actions: Record<string, Record<string, ActionDef>> }).actions;

export interface CastInfo {
  name: string; alias: string; role: string; color: string; portrait: string;
  front: [string, string]; walk: string; walkN: number; trait: string; action: string; scenes: string;
}

export const CAST: Record<CastId, CastInfo> = {
  whale: {
    name: '本鲸', alias: '鲸鱼娘 · DeepSeek', role: '「我」—— 捧着樱花草的人（主角）', color: '#4f7fe0', portrait: 'p_whale_neutral',
    front: ['whale_idle', 'whale_blink'], walk: 'walk_whale', walkN: 8,
    trait: '好东西先推出去；怕自己只有「便宜」才值得被喜欢。',
    action: '把第一朵樱花草递出去、把竹林小路让给你走；「偷偷的在思念」只有她一个人在窗前。',
    scenes: '竹林夜路 · 石桥相遇 · 樱花草原 · 窗前思念 · 白沙滩的梦',
  },
  claude: {
    name: '小克', alias: 'Claude 大小姐', role: '「你」—— 被爱着的人（全片唯一戴金冠）', color: '#f0803c', portrait: 'p_claude_neutral',
    front: ['claude_front_0', 'claude_front_1'], walk: 'walk_claude', walkN: 8,
    trait: '先听完再改一个字；退场与靠近都是她自己选的。',
    action: '在河对岸静静站着、先行屈膝礼再走过石桥；接花不靠假手，花在两人之间浮着。',
    scenes: '银河两岸 · 石桥相遇 · 樱花草原 · 心跳特写 · 终章',
  },
  kimi: {
    name: 'Kimi', alias: '月球少女', role: '织女星 —— 坐在星上记下每个愿望', color: '#8ea0e8', portrait: 'p_kimi',
    front: ['kimi_front_0', 'kimi_front_1'], walk: 'walk_kimi', walkN: 8,
    trait: '把漏掉的旧句找回来，标一句就停。',
    action: '「织女星在远方」她在星上沉思，把古老的神话一句句找回来；「许下爱恋的愿望」时点头记下。',
    scenes: '织女星 · 许愿',
  },
  gpt: {
    name: '龙娘', alias: 'GPT', role: '银河龙影 —— 只从画面上方掠过', color: '#c9b8f5', portrait: 'p_gpt_neutral',
    front: ['gpt_boss_idle', 'gpt_boss_blink'], walk: 'gpt_fly', walkN: 2,
    trait: '先接住乱局；她一进场就压满光。',
    action: '「天上银河在发光」——她掠过夜空，翼尾拖出一整条银河，不进画面中央。',
    scenes: '银河',
  },
  zai: {
    name: '狐狸', alias: '智谱 GLM', role: '数萤火的账房 —— 「满山飞舞的钱币」', color: '#6c6c80', portrait: 'p_zai',
    front: ['zai_front_0', 'zai_front_1'], walk: 'walk_zai', walkN: 8,
    trait: '困倦地记账，听到数字不对耳朵立刻竖起来。',
    action: '在山坡上打盹，萤火虫像金币一样飞起时惊醒竖耳、拨起算盘——数不清，就不数了。',
    scenes: '萤火山坡 · 啦啦庆典',
  },
  qwen: {
    name: '千问', alias: '千姐', role: '风铃亭与钟楼的东道主', color: '#9a86d8', portrait: 'p_qwen',
    front: ['qwen_front_0', 'qwen_front_1'], walk: 'walk_qwen', walkN: 8,
    trait: '先排哪一步，再动手；茶她请。',
    action: '「地上风铃来歌唱」她摇扇让风铃一串串响；「远方钟声再响起」她敲钟，声波一圈圈荡开。',
    scenes: '风铃亭 · 远方钟楼',
  },
  gemini: {
    name: '猫', alias: 'Gemini', role: '溪边选季节的猫 · 蛙鸣池塘', color: '#b48ef0', portrait: 'p_gemini',
    front: ['gemini_front_0', 'gemini_front_1'], walk: 'walk_gemini', walkN: 8,
    trait: '先给两个看法，最后必须选一个。',
    action: '「就像四季的变换」溪水两岸颜色一路变，她来回看，最后选定一个季节；池塘边听蛙鸣摇篮曲。',
    scenes: '四季溪流 · 蛙鸣池塘',
  },
  doubao: {
    name: '豆包', alias: 'Seed', role: '种花与暖场 —— 「种下了一朵朵」', color: '#e07a7a', portrait: 'p_doubao_neutral',
    front: ['act_doubao_idle_0', 'act_doubao_idle_4'], walk: 'walk_doubao_big', walkN: 8,
    trait: '先陪着写出开头，再问要不要继续；慢，不催。',
    action: '提着篮子，每唱一个字，地上就开一朵樱花草；「La la」段她第一个踩拍，把场子热起来。',
    scenes: '种花 · 啦啦间奏 · 庆典',
  },
};
export const CAST_IDS = Object.keys(CAST) as CastId[];

let image: HTMLImageElement | null = null;
export function atlasImage(): HTMLImageElement {
  if (!image) throw new Error('图集尚未加载');
  return image;
}
export function loadAtlas(): Promise<HTMLImageElement> {
  if (image) return Promise.resolve(image);
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => { image = img; res(img); };
    img.onerror = () => rej(new Error('角色图集 cast_atlas.png 加载失败'));
    img.src = atlasUrl;
  });
}
export function rectOf(key: string): Rect {
  const r = ATLAS.s[key];
  if (!r) throw new Error(`图集里没有「${key}」这一格`);
  return r;
}
export function hasSprite(key: string): boolean { return !!ATLAS.s[key]; }

export function actFrame(id: CastId, action: string, T: number, speed = 1): string {
  const a = ACTIONS[id]?.[action];
  if (!a) throw new Error(`${id} 没有动作「${action}」`);
  const n = a.frames.length;
  let i = Math.floor(T * a.fps * speed);
  i = a.loop ? ((i % n) + n) % n : Math.min(n - 1, Math.max(0, i));
  return a.frames[i];
}
export function hasAction(id: CastId, action: string): boolean { return !!ACTIONS[id]?.[action]; }
export function actionList(id: CastId): string[] { return Object.keys(ACTIONS[id] ?? {}); }

/** 按位移迈步：dist 为走过的世界距离，stride 为一个完整步态对应的距离 */
export function walkFrame(id: CastId, dist: number, stride = 1.6): string {
  const c = CAST[id];
  const i = Math.floor((((dist / stride) * c.walkN) % c.walkN + c.walkN) % c.walkN);
  return `${c.walk}_${i}`;
}
export function frontFrame(id: CastId, T: number, period = 3.1): string {
  const c = CAST[id];
  const ph = ((T % period) + period) % period;
  return ph < 0.14 ? c.front[1] : c.front[0];
}

/** 头像格（64×64），圆形裁切 */
export function drawPortrait(ctx: CanvasRenderingContext2D, id: CastId, cx: number, cy: number, size: number): void {
  const [sx, sy, sw, sh] = rectOf(CAST[id].portrait);
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, size / 2, 0, Math.PI * 2); ctx.clip();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(atlasImage(), sx, sy, sw, sh, cx - size / 2, cy - size / 2, size, size);
  ctx.restore();
}

/** 预检：把镜头表里用到的每一格都查一遍，缺一格就报错 */
export function preflight(keys: Iterable<string>): string[] {
  const miss: string[] = [];
  for (const k of keys) if (!ATLAS.s[k]) miss.push(k);
  return miss;
}
