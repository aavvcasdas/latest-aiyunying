#!/usr/bin/env node
// bake_hd_atlas.mjs —— 把 682 格高清素材装进「一张」图集，给引擎当高清细节层用。
//
//   node 通用模板/cast/hd/bake_hd_atlas.mjs            烘焙 cast_hd_atlas.png + cast_hd_atlas.json
//   node 通用模板/cast/hd/bake_hd_atlas.mjs --check    核对现有图集与素材是否一致（不写盘）
//   node 通用模板/cast/hd/bake_hd_atlas.mjs --psnr     顺便量一下「图集里的格子」和「原始素材」的像素差
//
// 为什么是「一张图集」而不是「一格一张小图」：
//   · 引擎里一个角色就是一张卡片，着色器按 rect 去贴图上取像素。换成每格一张贴图，就得给每个角色多挂几层、
//     每层一个 sampler；而 682 格的总面积只有 22.6 Mpx（2 倍），打一张 4096 宽的图集足够放下；
//   · 大图集只要一次解码（一次 ~9 MB 的 PNG），比两百张小图各来一次 HTTP + 解码更省；
//   · 显存 22.6 Mpx × 4B ≈ 90 MB，只在「打开了高清」的页面上占；不想要就整包删掉，引擎自动退回 1 倍图集。
//
// 格子怎么摆：按 1 倍坐标表的顺序，一行一行往右摆（行高 = 该行最高的一格），宽度超过 4096 就换行。
// 每格的 rect 记在 cast_hd_atlas.json（高清像素坐标）。基础格直接用 base/ 里的高清图；
// 派生动作格（act_*）用 <角色>/<动作>.png 里对应的那一帧——它们和 1 倍坐标表里的格子尺寸不同
// （派生格用的是「这位角色最大的格子」，四周留了晃动余量），所以引擎按「底边中点对齐」摆进卡片。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { S, decodePNG, quantizePNG } from './motion_hd.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../../..');
const PACK = path.join(REPO, '人物/q版HD_2x');
const ONE_X = path.join(REPO, '通用模板/engine/assets/cast_atlas.json');
const OUT_PNG = path.join(REPO, '通用模板/engine/assets/cast_hd_atlas.png');
const OUT_JSON = path.join(REPO, '通用模板/engine/assets/cast_hd_atlas.json');
const MAXW = 6144;   // 6 个精灵宽；高度必须控制在 8192 以内（SwiftShader / 部分 GPU 的贴图上限）
const CHECK = process.argv.includes('--check');
const PSNR = process.argv.includes('--psnr');

const one = JSON.parse(fs.readFileSync(ONE_X, 'utf8'));

const index = JSON.parse(fs.readFileSync(path.join(PACK, 'index.json'), 'utf8'));
const cache = new Map();
const load = async (file) => {
  if (!cache.has(file)) cache.set(file, await decodePNG(new Uint8Array(fs.readFileSync(path.join(PACK, file)))));
  return cache.get(file);
};

/**
 * 每一格的高清画：尺寸统一成「1 倍 rect × scale」，按底边中点对齐。
 *   · 基础格（base/<格子名>.png）：本身就是 1 倍格放大，走路帧多补过 1 像素墨线（四周各多 scale 像素）；
 *     按底边中点裁回 1 倍 rect 的大小——多出来的那圈墨线超出画框，本来就不会显示。
 *   · 派生动作格（act_*）：<角色>/<动作>.png 里那一帧是「这位角色最大的格子」（四周留了晃动余量），
 *     比 1 倍坐标表里这一格大。同样按底边中点裁到 1 倍 rect 的大小：画面内容和 1 倍那一格对得上，
 *     引擎就可以只按 1 倍那一套坐标摆卡片。
 */
async function cellArt(key) {
  const r = one.s[key], w1 = r[2], h1 = r[3], tw = w1 * S, th = h1 * S;
  let src = null, sw = 0, sh = 0;
  if (index.base[key]) { const b = await load(index.base[key].file); src = b.rgba; sw = b.w; sh = b.h; }
  else if (key.startsWith('act_')) {
    // 格子名可能带下划线（act_whale_lookaround_3），动作名要从右往左切
    const m = /^act_([a-z]+)_([a-z0-9_]+)_(\d+)$/.exec(key);
    if (!m) throw new Error(`「${key}」认不出是哪个动作`);
    const [, id, name, frame] = m;
    const act = index.chars[id]?.actions?.[name];
    // 1 倍图集里还留着几个动作格（whale 的 eat / spin，claude 的 petri，doubao / gemini / qwen 的 spin），
    // HD 动作表按设计不再派生它们（spin 会把人压成细条、petri 用原图硬切）。高清图集里这几格留空，
    // 引擎对着空 rect 不取样、照旧显示 1 倍那一层——它们不会「消失」，只是在这几格上没有高清细节。
    if (!act) return null;
    const strip = await load(act.file);
    const cw = index.chars[id].cell[0], ch = index.chars[id].cell[1], i = Number(frame);
    if (i >= act.frames) throw new Error(`${id}/${name} 只有 ${act.frames} 帧，要取第 ${i} 帧`);
    // 先把这一帧切出来（不复制：用「整条带的偏移 + 每行宽度」描述）
    const ox = (i % act.cols) * cw, oy = Math.floor(i / act.cols) * ch;
    src = strip.rgba; sw = strip.w; sh = strip.h;
    const out = new Uint8ClampedArray(tw * th * 4);
    // 对齐：把这一帧的「内容外框底边中点」挪到 1 倍那一格的「内容外框底边中点」。
    // 派生格的画布是这位角色最大的格子（四周留了晃动余量），比 1 倍格宽、脚底也不在格底，
    // 只按格宽 / 格底对齐会让整格偏几十像素（gpt 的振翅悬停就只剩躯干）。按内容外框对齐才和 1 倍层重合。
    // 派生格自己留了晃动余量，格底就是脚底、格宽中点就是脚底中心：按这两条对齐到 1 倍格。
    // （只按「脚底」对齐会让卡通大格在画框里上下颠倒地偏；按格底中点最稳。）
    const dx = Math.round(cw / 2 - tw / 2);
    const dy = index.chars[id].anchor[1] - th;
    for (let y = 0; y < th; y++) {
      const sy = oy + y + dy; if (sy < 0 || sy >= sh) continue;
      for (let x = 0; x < tw; x++) {
        const sx = ox + x + dx; if (sx < 0 || sx >= sw) continue;
        const a = (sy * sw + sx) * 4, b = (y * tw + x) * 4;
        out[b] = src[a]; out[b + 1] = src[a + 1]; out[b + 2] = src[a + 2]; out[b + 3] = src[a + 3];
      }
    }
    return { rgba: out, w: tw, h: th };
  } else return null; // 道具 / 表情贴（prop_* / fx_*）：高清包不派生它们，留空
  // 基础格：按底边中点裁到 tw × th（基础格就是 1 倍格本身放大，底边中点 = 脚底中点）
  const dst = new Uint8ClampedArray(tw * th * 4);
  const pad = index.base[key] ? Math.max(0, sh - th) : 0;   // 补过墨线的走路帧：上下各多 scale 像素，取下半部分
  const fx = Math.round(sw / 2 - tw / 2), fy = sh - th;
  for (let y = 0; y < th; y++) {
    const sy = fy + y; if (sy < 0 || sy >= sh) continue;
    for (let x = 0; x < tw; x++) {
      const sx = fx + x; if (sx < 0 || sx >= sw) continue;
      const a = (sy * sw + sx) * 4, b = (y * tw + x) * 4;
      dst[b] = src[a]; dst[b + 1] = src[a + 1]; dst[b + 2] = src[a + 2]; dst[b + 3] = src[a + 3];
    }
  }
  void pad;
  return { rgba: dst, w: tw, h: th };
}

/** 摆格：按 1 倍坐标表的顺序，一行行往右摆 */
async function pack() {
  const keys = Object.keys(one.s);
  const cells = {}, arts = new Map();
  // 先把每格的画取出来，再按「高的先摆」排序：同一行里高度相近，行尾的空隙就少。
  // 顺序只影响图集排布，rect 都记在 json 里，引擎按名字取。
  for (const key of keys) {
    const art = await cellArt(key);
    if (!art) { cells[key] = null; continue; }   // 没有高清版的格子：空 rect
    arts.set(key, art);
  }
  const order = [...arts.keys()].sort((a, b) => arts.get(b).h - arts.get(a).h || arts.get(b).w - arts.get(a).w || (a < b ? -1 : 1));
  let x = 0, y = 0, rowH = 0;
  for (const key of order) {
    const art = arts.get(key);
    if (x + art.w > MAXW) { x = 0; y += rowH; rowH = 0; }
    cells[key] = [x, y, art.w, art.h];
    x += art.w; rowH = Math.max(rowH, art.h);
  }
  const w = MAXW, h = y + rowH;
  if (h > 8192) throw new Error(`高清图集高 ${h}px，超过 8192 的上限（部分 GPU / SwiftShader 只到 8192）：把 MAXW 调大或减少格数`);
  return { w, h, cells, arts, keys };
}

const { w, h, cells, arts, keys } = await pack();

if (CHECK) {
  const bad = [];
  if (!fs.existsSync(OUT_PNG) || !fs.existsSync(OUT_JSON)) bad.push('高清图集还没烘（cast_hd_atlas.png / .json 不在）');
  else {
    const meta = JSON.parse(fs.readFileSync(OUT_JSON, 'utf8'));
    if (meta.w !== w || meta.h !== h) bad.push(`图集尺寸 ${meta.w}×${meta.h} 与素材算出来的 ${w}×${h} 不一致`);
    for (const key of keys) {
      const a = meta.s[key], b = cells[key];
      if (b === null) { if (a) bad.push(`「${key}」没有高清版，图集里却记了 rect`); continue; }
      if (!a) { bad.push(`图集里没有「${key}」`); continue; }
      if (a.join(',') !== b.join(',')) bad.push(`「${key}」位置 ${a} ≠ 素材算出来的 ${b}`);
    }
    const size = fs.statSync(OUT_PNG).size;
    console.log(`高清图集核对：${keys.length} 格 · ${w}×${h} · PNG ${(size / 1e6).toFixed(1)} MB`);
  }
  if (bad.length) { console.error(`高清图集没通过核对（${bad.length} 项）：\n  - ${bad.slice(0, 20).join('\n  - ')}`); process.exit(1); }
  process.exit(0);
}

// 拼图：透明处保持 (0,0,0,0)（和 1 倍图集同一个规矩），不做颜色外扩——
// 引擎取样是「按像素中心、带 fwidth 的重叠采样」，不会把透明区的颜色插进来。
const rgba = new Uint8ClampedArray(w * h * 4);
for (const key of keys) {
  if (!cells[key]) continue;
  const [cx, cy] = cells[key], art = arts.get(key);
  for (let yy = 0; yy < art.h; yy++) {
    const src = yy * art.w * 4, dst = ((cy + yy) * w + cx) * 4;
    rgba.set(art.rgba.subarray(src, src + art.w * 4), dst);
  }
}
// 不做颜色外扩：引擎的着色器是按「像素中心 + 半像素夹取」取样的，放大时就是精确的最近邻；
// 缩小时浏览器按直通 alpha 插值，透明处 RGB=0 和 1 倍图集完全一样（1 倍图集透明处本来就是 0），
// 不会多出新的边。这样调色板也不用为「外扩色」多花几百个位置。

if (PSNR) {
  let se = 0, n = 0, worst = [];
  for (const key of keys) {
    if (!cells[key]) continue;
    const [cx, cy] = cells[key], art = arts.get(key);
    let e = 0;
    for (let yy = 0; yy < art.h; yy++) for (let xx = 0; xx < art.w; xx++) {
      const a = (yy * art.w + xx) * 4, b = ((cy + yy) * w + cx + xx) * 4;
      const da = rgba[b + 3] - art.rgba[a + 3]; e += da * da;
      if (art.rgba[a + 3]) for (let k = 0; k < 3; k++) { const d = rgba[b + k] - art.rgba[a + k]; e += d * d; }
    }
    const mse = Math.max(1e-20, e / Math.max(1, art.w * art.h * 4));
    worst.push([mse > 0 ? 10 * Math.log10(255 * 255 / mse) : 99, key]);
    se += e; n += art.w * art.h * 4;
  }
  worst.sort((p, q) => p[0] - q[0]);
  console.log(`拼图后与素材的逐像素差：整体 PSNR ${(10 * Math.log10(255 * 255 / (se / n))).toFixed(1)} dB`);
  console.log(`最差的几格：${worst.slice(0, 5).map(([p, k]) => `${k} ${p.toFixed(1)}dB`).join('、')}`);
}

const png = await quantizePNG(rgba, w, h);
fs.writeFileSync(OUT_PNG, png);
fs.writeFileSync(OUT_JSON, JSON.stringify({
  w, h, scale: S,
  note: '高清细节层：每格 rect 是高清像素坐标，宽高 = 1 倍 rect × scale，按底边中点对齐（引擎只按 1 倍坐标摆卡片）。null = 这一格没有高清版，用 1 倍图集。透明处 RGB 为 0。',
  s: cells,
}, null, 1) + '\n');
console.log(`写完：cast_hd_atlas.png ${(png.length / 1e6).toFixed(1)} MB · ${keys.length} 格 · ${w}×${h}`);
