// 角色图集：八位像素角色（沿用项目 通用模板/engine/assets 的 cast_atlas），
// 这里只做「按格名取图、按动作名取帧、按位移迈步」三件事；缺格直接抛错，不拿别的造型顶替。
import atlasUrl from '../assets/cast_atlas.png';
import atlasJson from '../assets/cast_atlas.json';
import actionsJson from '../assets/cast_actions.json';

export type CastId = 'whale' | 'claude' | 'gpt' | 'gemini' | 'kimi' | 'doubao' | 'qwen' | 'zai';
export type Rect = [number, number, number, number];

type ActionDef = { label: string; fps: number; loop: boolean; frames: string[]; size: [number, number] };
type ActionsFile = { actions: Record<string, Record<string, ActionDef>> };

const ATLAS = atlasJson as unknown as { w: number; h: number; s: Record<string, Rect> };
const ACTIONS = (actionsJson as unknown as ActionsFile).actions;

export const CAST_INFO: Record<CastId, { name: string; alias: string; role: string; color: string; portrait: string; front: string[]; side: string; walk: string; walkN: number; traits: string }> = {
  whale: { name: '本鲸', alias: '鲸鱼娘 · DeepSeek', role: '「我」—— 写信的人', color: '#4f7fe0', portrait: 'p_whale_neutral', front: ['whale_idle', 'whale_blink'], side: 'walk_whale_0', walk: 'walk_whale', walkN: 8, traits: '好东西先推出去；怕自己只有「便宜」才值得被喜欢 —— 所以唱「尽管我太平凡」' },
  claude: { name: '小克', alias: 'Claude 大小姐', role: '「你」—— 收信的人', color: '#f0803c', portrait: 'p_claude_neutral', front: ['claude_front_0', 'claude_front_1'], side: 'claude_side_0', walk: 'walk_claude', walkN: 8, traits: '先听完再改一个字；温暖、柔软、也容易受刺激 —— 「因为你太敏感」' },
  gpt: { name: '龙娘', alias: 'GPT', role: '掠过天空的龙影 · 送礼物的人', color: '#c9b8f5', portrait: 'p_gpt_neutral', front: ['gpt_boss_idle', 'gpt_boss_blink'], side: 'gpt_fly_0', walk: 'gpt_fly', walkN: 2, traits: '她进场就压满光；一律只从画面上方掠过' },
  kimi: { name: 'Kimi', alias: '月球少女', role: '坐在月亮上的记录者', color: '#8ea0e8', portrait: 'p_kimi', front: ['kimi_front_0', 'kimi_front_1'], side: 'kimi_side_0', walk: 'walk_kimi', walkN: 8, traits: '把漏掉的旧句找回来；不动时就是在记所有人 —— 她记下这份誓言' },
  gemini: { name: '猫', alias: 'Gemini', role: '路口指路的猫', color: '#b48ef0', portrait: 'p_gemini', front: ['gemini_front_0', 'gemini_front_1'], side: 'gemini_side_0', walk: 'walk_gemini', walkN: 8, traits: '先给两个看法，最后必须选一个 —— 万水千山的路口' },
  doubao: { name: '豆包', alias: 'Seed', role: '陪着写开头 · 暖场踩拍', color: '#e07a7a', portrait: 'p_doubao_neutral', front: ['act_doubao_idle_0', 'act_doubao_idle_4'], side: 'walk_doubao_big_0', walk: 'walk_doubao_big', walkN: 8, traits: '先陪着写出开头，再问要不要继续；间奏时第一个踩拍' },
  qwen: { name: '千问', alias: '千姐', role: '仪式的东道主', color: '#9a86d8', portrait: 'p_qwen', front: ['qwen_front_0', 'qwen_front_1'], side: 'qwen_side_0', walk: 'walk_qwen', walkN: 8, traits: '先排哪一步再动手；茶会与仪式她来主持' },
  zai: { name: '狐狸', alias: '智谱 GLM', role: '数三千世界的账房', color: '#6c6c80', portrait: 'p_zai', front: ['zai_front_0', 'zai_front_1'], side: 'zai_side_0', walk: 'walk_zai', walkN: 8, traits: '困倦地记账，听到数字不对立刻竖耳 —— 「三千」她来数' },
};

export const CAST_IDS = Object.keys(CAST_INFO) as CastId[];

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
    img.onerror = () => rej(new Error('角色图集加载失败'));
    img.src = atlasUrl;
  });
}

export function rectOf(key: string): Rect {
  const r = ATLAS.s[key];
  if (!r) throw new Error(`图集里没有「${key}」这一格`);
  return r;
}
export function hasSprite(key: string): boolean { return !!ATLAS.s[key]; }

/** 动作帧：按 cast_actions.json 的 fps 取帧，T 为秒；loop=false 的动作停在最后一帧 */
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

/** 按位移迈步：dist 为已走过的像素（角色平面），stride 为一整个步态循环对应的位移 */
export function walkFrame(id: CastId, dist: number, stride = 260): string {
  const c = CAST_INFO[id];
  const n = c.walkN;
  const i = Math.floor(((dist / stride) * n) % n + n) % n;
  return `${c.walk}_${i}`;
}

/** 正面待机：隔几秒眨一次眼 */
export function frontFrame(id: CastId, T: number, period = 3.1): string {
  const c = CAST_INFO[id];
  const ph = ((T % period) + period) % period;
  return ph < 0.14 ? c.front[1] : c.front[0];
}

export interface DrawOpts {
  scale?: number;        // 像素放大倍数
  flip?: boolean;        // 朝左
  alpha?: number;
  lift?: number;         // 离地（像素，角色平面）
  sq?: number;           // 踩拍挤压：>0 压扁一点
  tilt?: number;         // 倾斜（弧度）
  tint?: string | null;  // 剪影染色
  shadow?: boolean;      // 脚下接触阴影
  shadowAlpha?: number;
  glow?: string | null;  // 身后柔光
}

/**
 * 把一格精灵画到 (x, y)：x 为横向中心，y 为脚底基线（卡片底边 = 脚底）。
 * 像素关掉插值，任意缩放下保持锐利。
 */
export function drawSprite(ctx: CanvasRenderingContext2D, key: string, x: number, y: number, o: DrawOpts = {}): void {
  const [sx, sy, sw, sh] = rectOf(key);
  const s = o.scale ?? 4;
  const w = sw * s, h = sh * s;
  const lift = o.lift ?? 0;
  const sq = o.sq ?? 0;
  const alpha = o.alpha ?? 1;
  if (alpha <= 0) return;
  ctx.save();
  if (o.shadow !== false) {
    const sa = (o.shadowAlpha ?? 0.22) * alpha * Math.max(0.25, 1 - lift / (h * 0.9));
    ctx.globalAlpha = sa;
    ctx.fillStyle = '#2b2118';
    ctx.beginPath();
    const rw = w * 0.34 * (1 - lift / (h * 2.2));
    ctx.ellipse(x, y + 2, Math.max(6, rw), Math.max(3, rw * 0.28), 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = alpha;
  ctx.translate(x, y - lift);
  if (o.tilt) ctx.rotate(o.tilt);
  if (o.flip) ctx.scale(-1, 1);
  if (sq) ctx.scale(1 + sq * 0.9, 1 - sq);
  if (o.glow) {
    const g = ctx.createRadialGradient(0, -h * 0.5, h * 0.1, 0, -h * 0.5, h * 0.75);
    g.addColorStop(0, o.glow); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -h * 0.5, w * 0.9, h * 0.72, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.imageSmoothingEnabled = false;
  if (o.tint) {
    // 剪影：先画图形，再用 source-in 盖色（离屏）
    const oc = scratch(Math.ceil(w), Math.ceil(h));
    const octx = oc.getContext('2d')!;
    octx.clearRect(0, 0, oc.width, oc.height);
    octx.imageSmoothingEnabled = false;
    octx.drawImage(atlasImage(), sx, sy, sw, sh, 0, 0, w, h);
    octx.globalCompositeOperation = 'source-in';
    octx.fillStyle = o.tint; octx.fillRect(0, 0, oc.width, oc.height);
    octx.globalCompositeOperation = 'source-over';
    ctx.drawImage(oc, 0, 0, oc.width, oc.height, -w / 2, -h, w, h);
  } else {
    ctx.drawImage(atlasImage(), sx, sy, sw, sh, -w / 2, -h, w, h);
  }
  ctx.restore();
}

let scratchCanvas: HTMLCanvasElement | null = null;
function scratch(w: number, h: number): HTMLCanvasElement {
  if (!scratchCanvas) scratchCanvas = document.createElement('canvas');
  if (scratchCanvas.width < w || scratchCanvas.height < h) { scratchCanvas.width = Math.max(w, scratchCanvas.width); scratchCanvas.height = Math.max(h, scratchCanvas.height); }
  return scratchCanvas;
}

/** 小图：道具 / 表情贴，以中心点摆放 */
export function drawThing(ctx: CanvasRenderingContext2D, key: string, cx: number, cy: number, scale = 4, alpha = 1, rot = 0): void {
  const [sx, sy, sw, sh] = rectOf(key);
  const w = sw * scale, h = sh * scale;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, cy); if (rot) ctx.rotate(rot);
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(atlasImage(), sx, sy, sw, sh, -w / 2, -h / 2, w, h);
  ctx.restore();
}

/** 头像格（64×64），圆角裁切 */
export function drawPortrait(ctx: CanvasRenderingContext2D, id: CastId, cx: number, cy: number, size: number, alpha = 1): void {
  const [sx, sy, sw, sh] = rectOf(CAST_INFO[id].portrait);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath(); ctx.arc(cx, cy, size / 2, 0, Math.PI * 2); ctx.clip();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(atlasImage(), sx, sy, sw, sh, cx - size / 2, cy - size / 2, size, size);
  ctx.restore();
}

export function spriteSize(key: string): { w: number; h: number } { const r = rectOf(key); return { w: r[2], h: r[3] }; }
export { atlasUrl };
