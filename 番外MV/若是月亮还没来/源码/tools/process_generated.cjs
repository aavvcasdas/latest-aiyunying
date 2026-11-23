// 生图后处理：绿幕抠图 → 去溢色 → 裁边 → 面积平均降采样到图集像素密度 → alpha 硬边
// 用法：node tools/process_generated.cjs
// 输入 gen_raw/*.png（生图原件，可能是 PNG 或 JPEG 数据），输出 public/assets/gen/*.png
const fs = require("fs");
const path = require("path");
const { PNG } = require("pngjs");
const jpeg = require("jpeg-js");

const RAW = "gen_raw";
const OUT = "public/assets/gen";
fs.mkdirSync(OUT, { recursive: true });

function decode(file) {
  const buf = fs.readFileSync(file);
  if (buf[0] === 0x89 && buf[1] === 0x50) {
    const png = PNG.sync.read(buf);
    return { w: png.width, h: png.height, data: png.data };
  }
  const img = jpeg.decode(buf, { useTArray: true, formatAsRGBA: true });
  return { w: img.width, h: img.height, data: img.data };
}

const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// 绿幕抠图：离键色 (0,255,0) 的距离 → alpha；去溢色
function chromaKey(img, aggressive) {
  const { w, h, data } = img;
  const out = new Float32Array(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    let r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
    const d = Math.sqrt(r * r + (255 - g) * (255 - g) + b * b);
    const a = smooth(45, 115, d);
    const mx = Math.max(r, b);
    if (aggressive) { if (g > mx) g = mx + (g - mx) * 0.15; }
    else if (g - mx > 110) g = mx + 10;
    out[i * 4] = r; out[i * 4 + 1] = g; out[i * 4 + 2] = b; out[i * 4 + 3] = a;
  }
  return { w, h, px: out };
}

function bbox(k, x0 = 0, x1 = k.w) {
  let minX = 1e9, minY = 1e9, maxX = -1, maxY = -1;
  for (let y = 0; y < k.h; y++) for (let x = x0; x < x1; x++) {
    if (k.px[(y * k.w + x) * 4 + 3] > 0.5) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  }
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

// 按竖向空列把一排道具切开
function splitColumns(k, minGap = 12) {
  const cols = new Array(k.w).fill(0);
  for (let x = 0; x < k.w; x++) for (let y = 0; y < k.h; y++) if (k.px[(y * k.w + x) * 4 + 3] > 0.5) { cols[x]++; }
  const parts = []; let start = -1, gap = 0;
  for (let x = 0; x < k.w; x++) {
    if (cols[x] > 2) { if (start < 0) start = x; gap = 0; }
    else if (start >= 0) { gap++; if (gap >= minGap) { parts.push([start, x - gap + 1]); start = -1; gap = 0; } }
  }
  if (start >= 0) parts.push([start, k.w]);
  return parts.filter(([a, b]) => b - a > 40);
}

// 面积平均降采样（预乘 alpha），再把 alpha 二值化成硬边（图集同款 alphaTest）
function resample(k, box, outH, pad = 1) {
  const scale = box.h / outH;
  const outW = Math.max(1, Math.round(box.w / scale));
  const W = outW + pad * 2, H = outH + pad * 2;
  const png = new PNG({ width: W, height: H });
  png.data.fill(0);
  for (let oy = 0; oy < outH; oy++) for (let ox = 0; ox < outW; ox++) {
    const sx0 = box.x + ox * scale, sx1 = box.x + (ox + 1) * scale;
    const sy0 = box.y + oy * scale, sy1 = box.y + (oy + 1) * scale;
    let r = 0, g = 0, b = 0, a = 0, n = 0;
    for (let sy = Math.floor(sy0); sy < Math.ceil(sy1); sy++) for (let sx = Math.floor(sx0); sx < Math.ceil(sx1); sx++) {
      if (sx < 0 || sy < 0 || sx >= k.w || sy >= k.h) continue;
      const j = (sy * k.w + sx) * 4, al = k.px[j + 3];
      r += k.px[j] * al; g += k.px[j + 1] * al; b += k.px[j + 2] * al; a += al; n++;
    }
    const cov = n ? a / n : 0;
    const o = ((oy + pad) * W + (ox + pad)) * 4;
    if (cov >= 0.5 && a > 0) {
      png.data[o] = Math.round(r / a); png.data[o + 1] = Math.round(g / a); png.data[o + 2] = Math.round(b / a); png.data[o + 3] = 255;
    }
  }
  return png;
}

function save(png, name) {
  const file = path.join(OUT, name);
  fs.writeFileSync(file, PNG.sync.write(png));
  console.log(`${file}  ${png.width}x${png.height}`);
  return { name, w: png.width, h: png.height };
}

const manifest = [];
// 图集本鲸 idle 第一帧的蓝色系均值，用来把生图的头发/裙子拉到同一色板
const idx = JSON.parse(fs.readFileSync("public/assets/cast/index.json", "utf8"));
const atlasPng = PNG.sync.read(fs.readFileSync("public/assets/cast/atlas.png"));
function blueMean(get, n) {
  let r = 0, g = 0, b = 0, c = 0;
  for (let i = 0; i < n; i++) { const [R, G, B, A] = get(i); if (A > 128 && B > R + 25 && B > G) { r += R; g += G; b += B; c++; } }
  return [r / c, g / c, b / c];
}
const [fx, fy, fw, fh] = idx.sheets["q版/whale.png"].frames.find((f) => f.name === "act_whale_idle_0").atlas;
const refBlue = blueMean((i) => { const x = fx + (i % fw), y = fy + Math.floor(i / fw), o = (y * atlasPng.width + x) * 4; return atlasPng.data.slice(o, o + 4); }, fw * fh);
function matchPalette(png) {
  const m = blueMean((i) => png.data.slice(i * 4, i * 4 + 4), png.width * png.height);
  const gain = m.map((v, c) => Math.min(1.15, Math.max(0.6, refBlue[c] / v)));
  for (let i = 0; i < png.width * png.height; i++) {
    const o = i * 4, R = png.data[o], G = png.data[o + 1], B = png.data[o + 2];
    if (png.data[o + 3] && B > R + 25 && B > G) for (let c = 0; c < 3; c++) png.data[o + c] = Math.min(255, Math.round(png.data[o + c] * gain[c]));
  }
  console.log("palette gain", gain.map((v) => v.toFixed(2)).join(","));
  return png;
}
// 人物（本鲸三个新姿态）：96px 高，与图集 84×90 单帧同一像素密度
for (const [src, name] of [["whale_sit_lookup.png", "whale_lookup"], ["whale_hug_benyu.png", "whale_hug_benyu"], ["whale_hold_camellia.png", "whale_hold_camellia"]]) {
  const k = chromaKey(decode(path.join(RAW, src)), true);
  const box = bbox(k);
  manifest.push(save(matchPalette(resample(k, box, 96)), `${name}.png`));
}
// 路灯：160px 高（约为人物 1.7 倍）
{
  const k = chromaKey(decode(path.join(RAW, "prop_streetlamp.png")), true);
  manifest.push(save(resample(k, bbox(k), 160), "streetlamp.png"));
}
// 白山茶花三态：切成三张；小号 28px（枝头用）+ 大号 96px（特写用）
{
  const k = chromaKey(decode(path.join(RAW, "prop_camellia_stages.png")), false);
  const parts = splitColumns(k);
  console.log("camellia parts:", parts);
  const names = ["camellia_bud", "camellia_half", "camellia_bloom"];
  parts.slice(0, 3).forEach(([a, b], i) => {
    const box = bbox(k, a, b);
    manifest.push(save(resample(k, box, 28), `${names[i]}.png`));
    manifest.push(save(resample(k, box, 96), `${names[i]}_hd.png`));
  });
}
// 笨鱼：项目已有的矢量图（人物/q版/笨鱼.png），只做像素化副本，不改造型
{
  const img = PNG.sync.read(fs.readFileSync("public/assets/cast/benyu.png"));
  const k = { w: img.width, h: img.height, px: Float32Array.from(img.data, (v, i) => (i % 4 === 3 ? v / 255 : v)) };
  manifest.push(save(resample(k, bbox(k), 44), "benyu_px.png"));
}
fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));
