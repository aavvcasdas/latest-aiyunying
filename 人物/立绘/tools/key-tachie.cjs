// Legacy green-screen keyer, kept only for future explicitly approved raw art.
// Current art/raw/*.png files are already transparent, so the default is check-only.
// Running with --write will refuse transparent inputs and will never overwrite
// art/tachie/*.png; it writes a PNG to public/tachie only from a real green screen.
//
//   node tools/key-tachie.cjs            # 只检查，不写文件
//   node tools/key-tachie.cjs --write    # 仅绿幕原图才写 public/tachie/*.png
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const RAW = path.join(ROOT, "art/raw");
const OUT = path.join(ROOT, "public/tachie");
const HEIGHT = 1280;
const IDS = ["whale", "gpt", "claude", "gemini", "kimi", "doubao", "qwen", "zai"];
const write = process.argv.includes("--write");

(async () => {
  if (!write) {
    console.log("CHECK_ONLY 当前立绘已经是透明底；不重抠、不生成新图。要验证请用 tools/key-tachie.mjs。");
    return;
  }
  const sharp = require("sharp");
  fs.mkdirSync(OUT, { recursive: true });
  for (const id of IDS) {
    const file = path.join(RAW, `${id}.png`);
    if (!fs.existsSync(file)) { console.error(`缺原图：${file}`); process.exitCode = 1; continue; }
    const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width: W, height: H } = info;
    const cornerAlpha = [0, W - 1, (H - 1) * W, H * W - 1].map((p) => data[p * 4 + 3]);
    if (cornerAlpha.every((a) => a === 0)) {
      console.log(`${id}: 原图已经透明，跳过（用 npm run assets:mirror 复制现有 art/tachie）`);
      continue;
    }
    const rs = [], gs = [], bs = [];
    const push = (x, y) => { const i = (y * W + x) * 4; rs.push(data[i]); gs.push(data[i + 1]); bs.push(data[i + 2]); };
    for (let x = 0; x < W; x += 3) { push(x, 0); push(x, 2); push(x, H - 1); }
    for (let y = 0; y < H; y += 3) { push(0, y); push(2, y); push(W - 1, y); }
    const med = (a) => a.sort((p, q) => p - q)[a.length >> 1];
    const bg = [med(rs), med(gs), med(bs)];
    const d0 = bg[1] - Math.max(bg[0], bg[2]);
    if (d0 < 80) { console.error(`${id}：底色 rgb(${bg}) 不够绿，跳过`); process.exitCode = 1; continue; }
    const lo = d0 * 0.22, hi = d0 * 0.62;
    let x0 = W, y0 = H, x1 = 0, y1 = 0;
    for (let p = 0; p < W * H; p++) {
      const i = p * 4, m = Math.max(data[i], data[i + 2]), d = data[i + 1] - m;
      let a = 1 - (d - lo) / (hi - lo); a = a < 0 ? 0 : a > 1 ? 1 : a;
      if (d > 0) data[i + 1] = Math.round(m + Math.min(d, 6) * a * 0.5);
      data[i + 3] = Math.round(a * 255);
      if (a > 0.06) {
        const x = p % W, y = (p / W) | 0;
        if (x < x0) x0 = x; if (x > x1) x1 = x;
        if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
    }
    const cw = x1 - x0 + 1, ch = y1 - y0 + 1, outW = Math.round((cw * HEIGHT) / ch);
    await sharp(data, { raw: { width: W, height: H, channels: 4 } })
      .extract({ left: x0, top: y0, width: cw, height: ch })
      .resize(outW, HEIGHT, { fit: "fill" })
      .png({ compressionLevel: 9, palette: false })
      .toFile(path.join(OUT, `${id}.png`));
    console.log(`${id}: 绿幕 → ${path.join(OUT, `${id}.png`)}`);
  }
})();
