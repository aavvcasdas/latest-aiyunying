// 镜头公用的小积木：角色上场的几种写法、群像站位、层叠山丘。
import { actFrame, CastId, drawSprite, drawThing, frontFrame, walkFrame, type DrawOpts } from '../atlas';
import { cloud, Ctx, H, hash, hills, LOOKS, Look, many, sky, stars, sun, W, lerp, TAU, moon } from '../kit';
import type { Beat, Frame } from '../timeline';

export const GROUND = 880; // 角色平面的默认地面（脚底基线）

export const beatSq = (bt: Beat, amt = 0.06) => bt.pulse * amt * (bt.down ? 1 : 0.55);
export const bob = (T: number, amp = 4, sp = 2.2) => Math.sin(T * sp) * amp;

/** 正面待机（眨眼） */
export function front(f: Frame, id: CastId, x: number, y: number, o: DrawOpts = {}): void {
  drawSprite(f.ctx, frontFrame(id, f.T + hash(x) * 2), x, y, o);
}
/** 派生动作（8 fps） */
export function act(f: Frame, id: CastId, action: string, x: number, y: number, o: DrawOpts = {}, speed = 1, t0 = f.t): void {
  drawSprite(f.ctx, actFrame(id, action, t0, speed), x, y, o);
}
/** 按位移迈步：dist 为已走的像素 */
export function walk(f: Frame, id: CastId, dist: number, x: number, y: number, o: DrawOpts = {}): void {
  drawSprite(f.ctx, walkFrame(id, dist), x, y, { lift: Math.abs(Math.sin((dist / 260) * TAU * 2)) * 3, ...o });
}
/** 侧面站姿（默认朝右；flip 朝左） */
export function side(f: Frame, id: CastId, x: number, y: number, o: DrawOpts = {}): void {
  const key = id === 'whale' ? 'walk_whale_0' : id === 'doubao' ? 'walk_doubao_big_0' : id === 'gpt' ? 'gpt_fly_0' : `${id}_side_0`;
  drawSprite(f.ctx, key, x, y, o);
}
export const thing = (f: Frame, key: string, x: number, y: number, s = 4, alpha = 1, rot = 0) => drawThing(f.ctx, key, x, y, s, alpha, rot);

/** 龙影：只从画面上方掠过，不进画面中央。u 为 0–1 的飞行进度，dir=1 从左到右 */
export function dragonPass(f: Frame, u: number, y = 180, dir = 1, scale = 2.6, tint: string | null = 'rgba(40,30,60,0.85)', alpha = 1): void {
  if (u <= 0 || u >= 1) return;
  const x = dir > 0 ? lerp(-200, W + 200, u) : lerp(W + 200, -200, u);
  const yy = y + Math.sin(u * Math.PI) * -60 + Math.sin(f.T * 6) * 6;
  drawSprite(f.ctx, actFrame('gpt', 'hover', f.T, 1.2), x, yy, { scale, flip: dir < 0, tint, alpha, shadow: false });
}

/** 六位见证人（除了主角二人）排成一排，各做自己的招牌小动作 */
export function witnesses(f: Frame, y: number, scale = 3, spread = 1, alpha = 1, who: CastId[] = ['zai', 'kimi', 'qwen', 'doubao', 'gemini']): void {
  const n = who.length;
  who.forEach((id, i) => {
    const x = W / 2 + ((i - (n - 1) / 2) * 300) * spread;
    const o: DrawOpts = { scale, alpha, sq: beatSq(f.bt, 0.04) };
    switch (id) {
      case 'qwen': act(f, 'qwen', 'sway', x, y, o, 0.9); thing(f, 'prop_fan', x + 60 * scale / 3, y - 120 * scale / 3, scale, alpha); break;
      case 'doubao': act(f, 'doubao', 'step', x, y, o); break;
      case 'gemini': act(f, 'gemini', 'choose', x, y, o, 0.8); break;
      case 'kimi': act(f, 'kimi', 'nod', x, y, o, 0.7); thing(f, 'prop_scroll', x + 70 * scale / 3, y - 100 * scale / 3, scale, alpha); break;
      case 'zai': act(f, 'zai', f.t % 6 < 4.5 ? 'doze' : 'alert', x, y, o, 0.8); thing(f, 'prop_abacus', x - 90 * scale / 3, y - 20, scale, alpha); break;
      default: front(f, id, x, y, o);
    }
  });
}

/** 层叠山丘的外景：天空 + 三层视差山 + 地面。offset 用来做机位横移 */
export function landscape(ctx: Ctx, look: Look, T: number, offset = 0, groundY = GROUND, withSun = true): void {
  const L = LOOKS[look];
  sky(ctx, look);
  if (look === 'night' || look === 'magic') stars(ctx, T, 140, 3, 0.9, H * 0.75);
  if (withSun) {
    if (look === 'night') moon(ctx, W * 0.78, 200, 90, 0.5);
    else if (look === 'dusk' || look === 'golden') sun(ctx, W * 0.72, groundY - 290, 80, look === 'dusk' ? '#ffb27a' : '#ffe08a', 3.2);
    else if (look === 'day') sun(ctx, W * 0.8, 170, 70, '#fff2b0', 2.6);
  }
  if (look !== 'night' && look !== 'storm') many(5, (i) => cloud(ctx, ((hash(i) * W * 1.3 - offset * 0.08 + T * 8) % (W * 1.3) + W * 1.3) % (W * 1.3) - W * 0.15, 120 + hash(i + 3) * 200, 50 + hash(i + 7) * 40, '#ffffff', look === 'dusk' ? 0.7 : 0.9));
  hills(ctx, groundY - 180, L.far, 170, 1.0, 0.4, offset * 0.15);
  hills(ctx, groundY - 90, L.mid, 120, 1.6, 2.1, offset * 0.35);
  hills(ctx, groundY - 10, L.near, 70, 2.3, 4.0, offset * 0.6);
  ctx.fillStyle = L.ground; ctx.fillRect(-100, groundY, W + 200, H - groundY + 100);
  ctx.strokeStyle = 'rgba(60,40,30,0.3)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-100, groundY); ctx.lineTo(W + 100, groundY); ctx.stroke();
}

/** 简单的小鸟 */
export function birds(ctx: Ctx, T: number, n = 6, x0 = 300, y0 = 220, alpha = 0.7): void {
  ctx.save(); ctx.strokeStyle = `rgba(60,50,60,${alpha})`; ctx.lineWidth = 3; ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) { const x = x0 + i * 46 + (i % 2) * 20 + T * 30, y = y0 + (i % 3) * 18 + Math.sin(T * 3 + i) * 6; const w = 10 + 4 * Math.sin(T * 10 + i); ctx.beginPath(); ctx.moveTo(x - 14, y); ctx.quadraticCurveTo(x - 7, y - w, x, y); ctx.quadraticCurveTo(x + 7, y - w, x + 14, y); ctx.stroke(); }
  ctx.restore();
}
