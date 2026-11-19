// 《浪人琵琶》渲染入口：render(g, t) 是时间 t 的纯函数——同一个 t 永远画出同一帧。
import { C, G, H, TONES, W, cached, clamp, mount, rr, seal, seg, setEnv, ss, vtext, Env } from "./core";
import { DURATION, LINES } from "./lyrics";
import { SHOTS_A, Shot } from "./shotsA";
import { SHOTS_B } from "./shotsB";

export { DURATION, LINES, W, H };
export type { Shot, Env };
export const SHOTS: Shot[] = [...SHOTS_A, ...SHOTS_B];
// 自检：镜头必须首尾相接、盖满全曲
SHOTS.forEach((s, i) => {
  const next = SHOTS[i + 1];
  if (!(s.b - s.a > 0.5)) throw new Error(`镜头 ${s.id} 时长不对：${s.a} → ${s.b}`);
  if (next && Math.abs(next.a - s.b) > 1e-6) throw new Error(`镜头 ${s.id} → ${next.id} 没接上：${s.b} / ${next.a}`);
});
if (SHOTS[0].a !== 0 || SHOTS[SHOTS.length - 1].b !== DURATION) throw new Error("镜头没有盖满全曲");

export function init(env: Env) {
  setEnv(env);
}
export function shotIndex(t: number) {
  for (let i = SHOTS.length - 1; i >= 0; i--) if (t >= SHOTS[i].a) return i;
  return 0;
}
function drawShot(g: G, s: Shot, t: number) {
  g.save();
  s.draw(g, t, t - s.a, clamp((t - s.a) / (s.b - s.a)));
  g.restore();
}
function lyric(g: G, t: number, s: Shot) {
  const T = TONES[s.tone];
  for (const L of LINES) {
    if (t < L.t - 0.06 || t >= L.e + 0.45) continue;
    const out = 1 - seg(t, L.e + 0.12, L.e + 0.45);
    const size = 46, xr = W - 86, xl = xr - 64, y0 = 92;
    const ra = seg(t, L.t - 0.06, Math.min(L.m - 0.06, L.t + L.a.length * 0.24));
    const rb = seg(t, L.m - 0.06, Math.min(L.e - 0.15, L.m + L.b.length * 0.26));
    const col = L.sung ? T.text : T.dark ? "#f3b39c" : C.red;
    // 签条：一列字一条纸，压在人物上也读得清
    const slip = (x: number, y: number, n: number, a: number) => {
      if (a <= 0) return;
      g.save();
      g.globalAlpha = a;
      g.fillStyle = T.dark ? "rgba(9,14,34,0.62)" : "rgba(251,245,230,0.74)";
      rr(g, x - size * 0.66, y - 12, size * 1.32, n * size * 1.06 + 22, 6);
      g.fill();
      g.strokeStyle = T.dark ? "rgba(217,164,65,0.55)" : "rgba(107,70,48,0.4)";
      g.lineWidth = 1.5;
      g.stroke();
      g.restore();
    };
    slip(xr, y0, L.a.length + (L.sung ? 0 : 1.1), out * ss(seg(t, L.t - 0.06, L.t + 0.2)));
    slip(xl, y0 + size * 1.15, L.b.length, out * ss(seg(t, L.m - 0.1, L.m + 0.16)));
    vtext(g, L.a, xr, y0, size, col, ra, null, out);
    vtext(g, L.b, xl, y0 + size * 1.15, size, col, rb, null, out);
    if (!L.sung) seal(g, xr, y0 + L.a.length * size * 1.06 + 14, 17, "题跋", out * ss(ra));
  }
}
/** 画时间 t 的那一帧。clean=true 不画歌词（出无字版 / 封面用） */
export function render(g: G, t: number, clean = false) {
  t = clamp(t, 0, DURATION);
  const i = shotIndex(t), s = SHOTS[i];
  g.save();
  g.globalAlpha = 1;
  g.globalCompositeOperation = "source-over";
  if (s.fade && i > 0 && t < s.a + s.fade) {
    drawShot(g, SHOTS[i - 1], t);
    const buf = cached("xfade", W, H, () => {});
    const bg = buf.getContext("2d") as G;
    bg.save();
    bg.clearRect(0, 0, W, H);
    drawShot(bg, s, t);
    bg.restore();
    g.globalAlpha = ss((t - s.a) / s.fade);
    g.drawImage(buf, 0, 0);
    g.globalAlpha = 1;
  } else drawShot(g, s, t);
  if (!clean) lyric(g, t, s);
  // 收卷：最后一秒淡回纸色
  const end = seg(t, DURATION - 1.0, DURATION - 0.1);
  if (end > 0) {
    g.fillStyle = `rgba(239,227,200,${end})`;
    g.fillRect(0, 0, W, H);
  }
  mount(g);
  g.restore();
}
