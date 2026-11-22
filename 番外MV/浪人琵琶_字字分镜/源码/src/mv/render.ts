// 逐帧渲染：只读时间 t。镜头之间用「墨晕」转场；底部歌词逐词点亮。
import { G, W, H, C, FONT, seg, eo, rnd, TAU, grain, vignette } from "./draw";
import { SHOTS, Shot } from "./shots";
import { LINES, lineAt, DURATION } from "./timeline";

const TRANS = 0.32;
let scratch: HTMLCanvasElement | null = null;

export function shotAt(t: number): { shot: Shot; i: number } {
  for (let i = SHOTS.length - 1; i >= 0; i--) if (t >= SHOTS[i].t0) return { shot: SHOTS[i], i };
  return { shot: SHOTS[0], i: 0 };
}

function inkMask(g: G, u: number, seed: number) {
  // 几团墨从画面中央往外晕
  g.beginPath();
  const blobs = 5;
  for (let b = 0; b < blobs; b++) {
    const cx = W / 2 + (rnd(seed + b) - 0.5) * W * 0.7;
    const cy = H / 2 + (rnd(seed + b + 9) - 0.5) * H * 0.6;
    const r = eo(u) * (W * 0.75) * (0.6 + rnd(seed + b + 3) * 0.6);
    const n = 24;
    for (let i = 0; i <= n; i++) {
      const an = (i / n) * TAU;
      const rr = r * (0.85 + 0.2 * rnd(seed * 7 + b * 31 + (i % n)));
      const x = cx + Math.cos(an) * rr;
      const y = cy + Math.sin(an) * rr;
      i ? g.lineTo(x, y) : g.moveTo(x, y);
    }
    g.closePath();
  }
}

export function render(g: G, t: number) {
  t = Math.max(0, Math.min(DURATION - 1e-3, t));
  const { shot, i } = shotAt(t);
  g.save();
  g.clearRect(0, 0, W, H);
  const u = seg(t, shot.t0, shot.t0 + TRANS);
  if (i > 0 && u < 1) {
    // 上一镜停在尾帧，这一镜从墨晕里长出来
    const prev = SHOTS[i - 1];
    g.save();
    prev.draw(g, shot.t0 - 1e-3);
    g.restore();
    if (!scratch) {
      scratch = document.createElement("canvas");
      scratch.width = W;
      scratch.height = H;
    }
    const sg = scratch.getContext("2d")!;
    sg.save();
    sg.clearRect(0, 0, W, H);
    shot.draw(sg, t);
    sg.restore();
    g.save();
    inkMask(g, u, i * 13);
    g.clip();
    g.drawImage(scratch, 0, 0);
    g.restore();
    // 墨边
    g.save();
    g.strokeStyle = `rgba(30,26,23,${0.3 * (1 - u)})`;
    g.lineWidth = 4;
    inkMask(g, u, i * 13);
    g.stroke();
    g.restore();
  } else {
    g.save();
    shot.draw(g, t);
    g.restore();
  }
  grain(g, 0.035);
  vignette(g, 0.38);
  lyricBar(g, t);
  g.restore();
}

function lyricBar(g: G, t: number) {
  const line = lineAt(t);
  if (!line) return;
  const fadeIn = seg(t, line.t0, line.t0 + 0.2);
  const fadeOut = 1 - seg(t, line.t1 - 0.15, line.t1);
  const a = Math.min(fadeIn, fadeOut);
  const size = 46;
  g.save();
  g.globalAlpha = a;
  g.font = `${size}px ${FONT}, serif`;
  g.textBaseline = "middle";
  const chars: { ch: string; t0: number; t1: number }[] = [];
  for (const w of line.words) {
    const cs = [...w.text];
    cs.forEach((ch, k) => chars.push({ ch, t0: w.t0 + ((w.t1 - w.t0) * k) / cs.length, t1: w.t0 + ((w.t1 - w.t0) * (k + 1)) / cs.length }));
  }
  const step = size * 1.02;
  const total = step * chars.length;
  const x0 = W / 2 - total / 2 + step / 2;
  const y = H - 58;
  // 底衬：一抹淡墨
  const gr = g.createLinearGradient(0, y - 50, 0, y + 50);
  gr.addColorStop(0, "rgba(20,16,12,0)");
  gr.addColorStop(0.5, "rgba(20,16,12,0.42)");
  gr.addColorStop(1, "rgba(20,16,12,0)");
  g.fillStyle = gr;
  g.fillRect(W / 2 - total / 2 - 80, y - 50, total + 160, 100);
  g.textAlign = "center";
  chars.forEach((c, i) => {
    const x = x0 + i * step;
    const lit = seg(t, c.t0, c.t0 + 0.12);
    const pop = 1 + 0.18 * Math.max(0, 1 - Math.abs(t - c.t0) / 0.18);
    g.save();
    g.translate(x, y);
    g.scale(pop, pop);
    g.lineWidth = 6;
    g.lineJoin = "round";
    g.strokeStyle = "rgba(20,14,10,0.85)";
    g.strokeText(c.ch, 0, 0);
    g.fillStyle = "#f4ead6";
    g.fillText(c.ch, 0, 0);
    if (lit > 0) {
      g.globalAlpha = lit * a;
      g.fillStyle = C.gold2;
      g.fillText(c.ch, 0, 0);
    }
    g.restore();
  });
  g.restore();
}

export { LINES };
