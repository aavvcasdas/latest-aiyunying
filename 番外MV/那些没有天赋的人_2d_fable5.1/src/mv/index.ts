// 《譬如我》大字版渲染入口：render(g, t) 是时间 t 的纯函数。
import { G, H, W, cached, clamp, setEnv, Env } from "./core";
import { PALS, flash, grain, seg, shake, slice, ss } from "./kit";
import { LINES } from "./lyricsData";
import { SHOTS, Shot } from "./shots";

export const DURATION = 152.1;
export { LINES, SHOTS, W, H };
export type { Shot, Env };

SHOTS.forEach((s, i) => {
  const n = SHOTS[i + 1];
  if (!(s.b - s.a > 0.3)) throw new Error(`镜头 ${s.id} 时长不对：${s.a} → ${s.b}`);
  if (n && Math.abs(n.a - s.b) > 1e-6) throw new Error(`镜头 ${s.id} → ${n.id} 没接上：${s.b} / ${n.a}`);
});
if (Math.abs(SHOTS[0].a - 0.1) > 0.2 || SHOTS[SHOTS.length - 1].b !== DURATION) throw new Error("镜头没有盖满全曲");

export function init(env: Env) {
  setEnv(env);
}
export function shotIndex(t: number) {
  for (let i = SHOTS.length - 1; i >= 0; i--) if (t >= SHOTS[i].a) return i;
  return 0;
}
/** clean=true 不画颗粒和暗角（看结构用） */
export function render(g: G, t: number, clean = false) {
  t = clamp(t, 0, DURATION);
  const i = shotIndex(t), s = SHOTS[i], lt = t - s.a, u = clamp(lt / (s.b - s.a));
  const buf = cached("frame", W, H, () => {});
  const b = buf.getContext("2d") as G;
  b.save();
  b.setTransform(1, 0, 0, 1, 0, 0);
  b.globalAlpha = 1;
  b.globalCompositeOperation = "source-over";
  b.fillStyle = PALS[s.pol].bg;
  b.fillRect(0, 0, W, H);
  const sh = s.shake ? s.shake(t, lt) : 0;
  const [dx, dy] = sh > 0 ? shake(t, t - 0.001, sh, 1) : [0, 0];
  b.translate(dx, dy);
  if (t < 0.1) b.fillRect(0, 0, W, H);
  else s.draw(b, t, lt, u);
  b.restore();
  g.save();
  g.globalAlpha = 1;
  g.globalCompositeOperation = "source-over";
  g.drawImage(buf, 0, 0);
  const gl = s.glitch ? s.glitch(t, lt) : 0;
  if (gl > 0) slice(g, buf, t, gl);
  if (!clean) grain(g, t);
  // 开头从黑里亮起来，结尾收进暖纸
  const a0 = 1 - seg(t, 0, 0.6);
  if (a0 > 0) {
    g.fillStyle = `rgba(0,0,0,${a0})`;
    g.fillRect(0, 0, W, H);
  }
  const end = ss(seg(t, DURATION - 0.6, DURATION - 0.05));
  if (end > 0) {
    g.fillStyle = `rgba(242,232,216,${end})`;
    g.fillRect(0, 0, W, H);
  }
  flash(g, t, -1);
  g.restore();
}
