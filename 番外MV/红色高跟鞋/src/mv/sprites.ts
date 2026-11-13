// 人物：直接用分支里 通用模板/engine/assets 的像素图集（裁出本片用到的格子），
// 当作贴纸小人站进剪纸世界——外面描一圈米白纸边。
import { ATLAS_META } from './atlasMeta';
import { CREAM, env, heels, type Ctx } from './core';

export interface Atlas {
  img: CanvasImageSource;
  sil: CanvasImageSource; // 同一张图集的纯色剪影，用来描纸边
}

export function buildAtlas(img: CanvasImageSource, w: number, h: number): Atlas {
  const c = env.makeCanvas(w, h);
  const x = c.getContext('2d')!;
  x.drawImage(img, 0, 0);
  x.globalCompositeOperation = 'source-in';
  x.fillStyle = CREAM;
  x.fillRect(0, 0, w, h);
  return { img, sil: c };
}

/** 按动作表（cast_actions.json 的 fps / loop / frames）取当前帧的格子名 */
export function frameKey(who: string, act: string, at: number): string {
  const a = ATLAS_META.actions[who]?.[act];
  if (!a) throw new Error(`图集里没有 ${who}.${act} 这个动作`);
  const n = a.frames.length;
  let i = Math.floor(Math.max(0, at) * a.fps);
  i = a.loop ? i % n : Math.min(n - 1, i);
  return a.frames[i];
}

const RING: [number, number][] = [
  [1, 0], [-1, 0], [0, 1], [0, -1], [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7],
];

/** 画一格：(x, y) 是脚底中心；s 是放大倍数；ol 是纸边宽度（单位：像素格） */
export function sprite(ctx: Ctx, A: Atlas, key: string, x: number, y: number, s: number, flip = false, ol = 1.4, alpha = 1) {
  const r = ATLAS_META.rects[key];
  if (!r) throw new Error(`图集里没有 ${key} 这一格`);
  const [sx, sy, w, h] = r;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip ? -s : s, s);
  ctx.imageSmoothingEnabled = false;
  if (alpha < 1) ctx.globalAlpha *= alpha;
  if (ol > 0) for (const [ox, oy] of RING) ctx.drawImage(A.sil, sx, sy, w, h, -w / 2 + ox * ol, -h + oy * ol, w, h);
  ctx.drawImage(A.img, sx, sy, w, h, -w / 2, -h, w, h);
  ctx.restore();
}

export interface Act {
  who: string;
  act: string;
  at: number;
  x: number;
  y: number;
  s?: number;
  flip?: boolean;
  shoes?: number; // >0：脚上穿着红鞋（值是闪光强度）
}

export function actor(ctx: Ctx, A: Atlas, a: Act, defS = 2.3) {
  const s = a.s ?? defS;
  ctx.fillStyle = 'rgba(10,8,30,.3)';
  ctx.beginPath();
  ctx.ellipse(a.x, a.y, 30 * s, 5.5 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  sprite(ctx, A, frameKey(a.who, a.act, a.at), a.x, a.y, s, !!a.flip);
  if (a.shoes) heels(ctx, a.x, a.y + 3 * s, s * 0.2);
}
