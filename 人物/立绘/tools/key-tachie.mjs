// 绿幕立绘 → 透明底（本仓库没有 public/tachie，直接出到 art/tachie/<角色>.png）
// 算法与 tools/key-tachie.cjs 一致：底色取四边中位数，按「绿得多出多少」算透明度，边缘残留的绿压回去。
// 顺带把骨架要用的三个数（neck / cx / hx）从新图上量出来，写进 art/tachie/metrics.json。
//
//   node tools/key-tachie.mjs            # art/raw/*.png 全部重抠
//   node tools/key-tachie.mjs whale gpt  # 只抠这两位
import { createCanvas, loadImage } from "@napi-rs/canvas";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const RAW = path.join(ROOT, "art/raw");
const OUT = path.join(ROOT, "art/tachie");
const HEIGHT = 1280;
/** 下巴占全高的比例（7.5 头身） */
const NECK = 0.145;
const ALL = ["whale", "gpt", "claude", "gemini", "kimi", "doubao", "qwen", "zai"];

fs.mkdirSync(OUT, { recursive: true });
const metricsPath = path.join(OUT, "metrics.json");
const metrics = fs.existsSync(metricsPath) ? JSON.parse(fs.readFileSync(metricsPath, "utf8")) : {};

const ids = process.argv.slice(2).length ? process.argv.slice(2) : ALL;
for (const id of ids) {
  const file = path.join(RAW, `${id}.png`);
  if (!fs.existsSync(file)) {
    console.error(`缺原图：${file}`);
    continue;
  }
  const img = await loadImage(file);
  const W = img.width, H = img.height;
  const c = createCanvas(W, H);
  const ctx = c.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const idata = ctx.getImageData(0, 0, W, H);
  const data = idata.data;

  // 底色：四边像素中位数
  const rs = [], gs = [], bs = [];
  const push = (x, y) => { const i = (y * W + x) * 4; rs.push(data[i]); gs.push(data[i + 1]); bs.push(data[i + 2]); };
  for (let x = 0; x < W; x += 3) { push(x, 0); push(x, 2); push(x, H - 1); }
  for (let y = 0; y < H; y += 3) { push(0, y); push(2, y); push(W - 1, y); }
  const med = (a) => a.sort((p, q) => p - q)[a.length >> 1];
  const bg = [med(rs), med(gs), med(bs)];
  const d0 = bg[1] - Math.max(bg[0], bg[2]);
  if (d0 < 80) {
    console.error(`${id}：底色 rgb(${bg}) 不够绿，抠不干净，跳过`);
    continue;
  }

  const lo = d0 * 0.22, hi = d0 * 0.62;
  let x0 = W, y0 = H, x1 = 0, y1 = 0;
  for (let p = 0; p < W * H; p++) {
    const i = p * 4;
    const m = Math.max(data[i], data[i + 2]);
    const d = data[i + 1] - m;
    let a = 1 - (d - lo) / (hi - lo);
    a = a < 0 ? 0 : a > 1 ? 1 : a;
    if (d > 0) data[i + 1] = Math.round(m + Math.min(d, 6) * a * 0.5);
    data[i + 3] = Math.round(a * 255);
    if (a > 0.06) {
      const x = p % W, y = (p / W) | 0;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
  const outW = Math.round((cw * HEIGHT) / ch);

  const cut = createCanvas(W, H);
  cut.getContext("2d").putImageData(idata, 0, 0);
  const out = createCanvas(outW, HEIGHT);
  const octx = out.getContext("2d");
  octx.imageSmoothingQuality = "high";
  octx.drawImage(cut, x0, y0, cw, ch, 0, 0, outW, HEIGHT);
  fs.writeFileSync(path.join(OUT, `${id}.png`), await out.encode("png"));

  /* ---- 量骨架参数：颈线、脚底中心、头部中心 ---- */
  const px = octx.getImageData(0, 0, outW, HEIGHT).data;
  const alphaAt = (x, y) => px[(y * outW + x) * 4 + 3];
  const rowWidth = (y) => {
    let l = -1, r = -1;
    for (let x = 0; x < outW; x++) if (alphaAt(x, y) > 40) { if (l < 0) l = x; r = x; }
    return l < 0 ? null : { l, r, w: r - l + 1 };
  };
  const centroid = (ya, yb) => {
    let s = 0, n = 0;
    for (let y = Math.floor(ya * HEIGHT); y < Math.floor(yb * HEIGHT); y++) {
      const rw = rowWidth(y);
      if (rw) { s += (rw.l + rw.r) / 2; n++; }
    }
    return n ? s / n / outW : 0.5;
  };
  // 颈线：这批立绘是 7.5 头身（原 Q 版是 0.18–0.21），下巴大致落在 14.5% 处。
  // 不按「最窄一行」自动找——长发会把脖子那一行撑宽，量出来会偏到头顶。
  const neck = NECK;
  metrics[id] = { w: outW, h: HEIGHT, neck: +neck.toFixed(3), cx: +centroid(0.95, 1).toFixed(3), hx: +centroid(0, 0.15).toFixed(3) };
  console.log(`${id}: w ${outW}, h ${HEIGHT}, neck ${metrics[id].neck}, cx ${metrics[id].cx}, hx ${metrics[id].hx}`);
}

fs.writeFileSync(metricsPath, JSON.stringify(metrics, null, 2) + "\n");
