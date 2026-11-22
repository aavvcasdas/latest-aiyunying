import { lineAt } from "./timeline";

const OUT_W = 1280;
const OUT_H = 720;

export function drawLyrics(g: CanvasRenderingContext2D, t: number) {
  const line = lineAt(t);
  if (!line) return;
  const fade = Math.min(1, (t - (line.start - 0.15)) / 0.15, (line.end + 0.35 - t) / 0.25);
  const isChorus = line.section !== "主歌";
  const size = isChorus ? 46 : 44;
  g.save();
  g.globalAlpha = Math.max(0, fade);
  g.font = `900 ${size}px "Wohe CJK","PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans CJK SC",sans-serif`;
  g.textBaseline = "alphabetic";
  const words = line.words;
  const widths = words.map((w) => g.measureText(w.text).width);
  const gap = 14;
  const total = widths.reduce((a, b) => a + b, 0) + gap * (words.length - 1);
  let x = (OUT_W - total) / 2;
  const y = OUT_H - 52;
  // 底衬
  const grd = g.createLinearGradient(0, OUT_H - 140, 0, OUT_H);
  grd.addColorStop(0, "rgba(0,0,0,0)"); grd.addColorStop(1, "rgba(0,0,0,0.35)");
  g.fillStyle = grd; g.fillRect(0, OUT_H - 140, OUT_W, 140);
  words.forEach((w, i) => {
    const next = words[i + 1]?.start ?? line.end;
    const active = t >= w.start && t < next;
    const past = t >= next;
    const k = active ? Math.min(1, (t - w.start) / 0.12) : 0;
    const bounce = active ? Math.sin(Math.min(1, (t - w.start) / 0.25) * Math.PI) * 10 : 0;
    const sc = active ? 1 + 0.18 * (1 - Math.min(1, (t - w.start) / 0.3)) + 0.06 : 1;
    g.save();
    g.translate(x + widths[i] / 2, y - bounce);
    g.scale(sc, sc);
    g.textAlign = "center";
    g.lineJoin = "round";
    g.lineWidth = 9; g.strokeStyle = active ? "#ff4f8b" : "rgba(30,40,80,0.85)";
    g.strokeText(w.text, 0, 0);
    g.fillStyle = active ? "#fff6a8" : past ? "#ffffff" : "rgba(255,255,255,0.55)";
    g.fillText(w.text, 0, 0);
    if (active) {
      // 卡拉OK 填色进度
      const prog = Math.min(1, (t - w.start) / Math.max(0.1, next - w.start));
      g.save(); g.beginPath(); g.rect(-widths[i] / 2, -size, widths[i] * prog, size * 1.4); g.clip();
      g.fillStyle = "#ffd23f"; g.fillText(w.text, 0, 0); g.restore();
      g.globalAlpha = k;
    }
    g.restore();
    x += widths[i] + gap;
  });
  g.restore();
}
