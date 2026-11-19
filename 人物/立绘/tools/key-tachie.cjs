// 把绿幕立绘抠成透明底：art/raw/<角色>.png → public/tachie/<角色>.webp
// 用法：node tools/key-tachie.cjs            （全部重抠）
//       node tools/key-tachie.cjs whale gpt  （只抠这两位）
// 换立绘的流程：把新的绿幕图（纯绿 #00FF00 底、全身、正面站立）放进 art/raw/ 覆盖同名文件，跑这个脚本，
// 再把打印出来的宽高填回 src/mv/cast.ts 的 w / h；颈线 neck 与脊柱 cx / hx 按新图量一下。
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = path.join(__dirname, "..");
const RAW = path.join(ROOT, "art/raw");
const OUT = path.join(ROOT, "public/tachie");
const HEIGHT = 1280;
const ALL = ["whale", "gpt", "claude", "gemini", "kimi", "doubao", "qwen", "zai"];

(async () => {
  const ids = process.argv.slice(2).length ? process.argv.slice(2) : ALL;
  fs.mkdirSync(OUT, { recursive: true });
  for (const id of ids) {
    const file = path.join(RAW, `${id}.png`);
    if (!fs.existsSync(file)) {
      console.error(`缺原图：${file}`);
      process.exitCode = 1;
      continue;
    }
    const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const { width: W, height: H } = info;

    // 底色取四边像素的中位数，不假定它正好是 #00FF00
    const rs = [], gs = [], bs = [];
    const push = (x, y) => { const i = (y * W + x) * 4; rs.push(data[i]); gs.push(data[i + 1]); bs.push(data[i + 2]); };
    for (let x = 0; x < W; x += 3) { push(x, 0); push(x, 2); push(x, H - 1); }
    for (let y = 0; y < H; y += 3) { push(0, y); push(2, y); push(W - 1, y); }
    const med = (a) => a.sort((p, q) => p - q)[a.length >> 1];
    const bg = [med(rs), med(gs), med(bs)];
    const d0 = bg[1] - Math.max(bg[0], bg[2]);
    if (d0 < 80) {
      console.error(`${id}：底色 rgb(${bg}) 不够绿，抠不干净，跳过`);
      process.exitCode = 1;
      continue;
    }

    // 按「绿得多出多少」算透明度，并把边缘残留的绿压回去
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
    await sharp(data, { raw: { width: W, height: H, channels: 4 } })
      .extract({ left: x0, top: y0, width: cw, height: ch })
      .resize(outW, HEIGHT, { fit: "fill" })
      .webp({ quality: 90, alphaQuality: 100 })
      .toFile(path.join(OUT, `${id}.webp`));
    console.log(`${id}: w ${outW}, h ${HEIGHT}`);
  }
})();
