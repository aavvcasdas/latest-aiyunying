// 《告白气球》渲染入口：render(g, t) 是时间 t 的纯函数——同一个 t 永远画出同一帧。
import { G, H, W, cached, clamp, setEnv, Env } from "./core";
import { DURATION, LINES, charTimes } from "./lyrics";
import { PTONES, PINK } from "./paris";
import { SHOTS_A, Shot } from "./shotsA";
import { SHOTS_B } from "./shotsB";

export { DURATION, LINES, W, H };
export type { Shot, Env };
export const SHOTS: Shot[] = [...SHOTS_A, ...SHOTS_B];
SHOTS.forEach((s, i) => {
  const n = SHOTS[i + 1];
  if (!(s.b - s.a > 0.5)) throw new Error(`镜头 ${s.id} 时长不对：${s.a} → ${s.b}`);
  if (n && Math.abs(n.a - s.b) > 1e-6) throw new Error(`镜头 ${s.id} → ${n.id} 没接上：${s.b} / ${n.a}`);
});
if (SHOTS[0].a !== 0 || SHOTS[SHOTS.length - 1].b !== DURATION) throw new Error("镜头没有盖满全曲");

export function init(env: Env) {
  setEnv(env);
}
export function shotIndex(t: number) {
  for (let i = SHOTS.length - 1; i >= 0; i--) if (t >= SHOTS[i].a) return i;
  return 0;
}
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const ss = (u: number) => u * u * (3 - 2 * clamp(u));
function drawShot(g: G, s: Shot, t: number) {
  g.save();
  s.draw(g, t, t - s.a, clamp((t - s.a) / (s.b - s.a)));
  g.restore();
}
/** 下三分之一的歌词条：逐字弹出 */
function lyric(g: G, t: number, s: Shot) {
  const T = PTONES[s.tone];
  for (const l of LINES) {
    if (t < l.t - 0.1 || t > l.e + 0.5) continue;
    const out = 1 - seg(t, l.e + 0.15, l.e + 0.5);
    const full = (l.a + "  " + l.b).replace(/ /g, "　");
    const ts = charTimes(l);
    const size = 44;
    g.save();
    g.font = `${size}px MVKuaiLe, "PingFang SC", sans-serif`;
    const w = g.measureText(full).width;
    const x0 = W / 2 - w / 2, y = H - 78;
    g.globalAlpha = out * ss(seg(t, l.t - 0.1, l.t + 0.15));
    g.fillStyle = T.ribbon;
    g.beginPath();
    g.roundRect(x0 - 30, y - size * 0.82, w + 60, size * 1.64, size * 0.82);
    g.fill();
    disc(g, x0 - 8, y, 7, PINK);
    disc(g, x0 + w + 8, y, 7, PINK);
    g.textBaseline = "middle";
    g.textAlign = "left";
    let x = x0, k = 0;
    for (const ch of full) {
      const cw = g.measureText(ch).width;
      if (ch !== "　") {
        const p = clamp((t - ts[k]) / 0.18);
        k++;
        if (p > 0) {
          const sc = p >= 1 ? 1 : 0.4 + 0.6 * p + Math.sin(p * Math.PI) * 0.25;
          g.save();
          g.translate(x + cw / 2, y - (1 - p) * 10);
          g.scale(sc, sc);
          g.globalAlpha = out * Math.min(1, p * 2);
          g.fillStyle = T.text;
          g.textAlign = "center";
          g.fillText(ch, 0, 2);
          g.restore();
        }
      }
      x += cw;
    }
    g.restore();
  }
}
function disc(g: G, x: number, y: number, r: number, c: string) {
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fillStyle = c;
  g.fill();
}
/** clean=true 不画歌词 */
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
  // 柔光暗角
  const v = g.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 0.95);
  v.addColorStop(0, "rgba(90,40,60,0)");
  v.addColorStop(1, PTONES[s.tone].dark ? "rgba(10,10,30,0.45)" : "rgba(120,60,80,0.18)");
  g.fillStyle = v;
  g.fillRect(0, 0, W, H);
  const a0 = 1 - seg(t, 0, 0.8), a1 = seg(t, DURATION - 1.2, DURATION - 0.1);
  if (a0 > 0 || a1 > 0) {
    g.fillStyle = `rgba(255,248,244,${Math.max(a0, a1)})`;
    g.fillRect(0, 0, W, H);
  }
  g.restore();
}
