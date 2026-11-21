#!/usr/bin/env node
// bake_hd.mjs —— 从高清基础格（人物/q版HD_2x/base/*.png）派生全部动作，写成每个动作一张网格图 + index.json。
//   node 通用模板/cast/hd/bake_hd.mjs                 全部八位
//   node 通用模板/cast/hd/bake_hd.mjs --only whale    只烘一位
//   node 通用模板/cast/hd/bake_hd.mjs --check         不写图，只核对 index.json 与磁盘上的图是否一致
//   node 通用模板/cast/hd/bake_hd.mjs --png8          把动作网格图压成调色板 PNG（约省 70%，像素逐字节不变）
// 零依赖（PNG 编解码在 motion_hd.mjs 里），Node ≥ 18。
//
// 产物：人物/q版HD_2x/<角色>/<动作>.png + index.json（帧表：格宽高、脚底锚点、每动作的 frames/cols/rows/fps/loop）
//       动作图只用来预览和当素材包，不进图集；进成片的是下面 bake_hd_atlas.mjs 烘的那张。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { S, CAST, CHAR_IDS, ACTIONS_OF, actionMeta, baseKeysOf, premultiply, layoutOf, renderAction, toSheet, bleedEdges, encodePNG, decodePNG, quantizePNG } from './motion_hd.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const arg = (k, d) => { const i = process.argv.indexOf(k); return i < 0 ? d : process.argv[i + 1]; };
const ROOT = path.resolve(arg('--root', path.join(HERE, '../../../人物/q版HD_2x')));
const BASE = path.join(ROOT, 'base'), only = arg('--only', null), CHECK = process.argv.includes('--check');
const PNG8 = process.argv.includes('--png8');
const ids = only ? only.split(',') : CHAR_IDS;
for (const id of ids) if (!CAST[id]) { console.error(`没有角色「${id}」`); process.exit(1); }

const pngSize = (file) => { const b = fs.readFileSync(file); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }; };

if (CHECK) {
  const index = JSON.parse(fs.readFileSync(path.join(ROOT, 'index.json'), 'utf8')); const bad = []; let n = 0;
  for (const [id, c] of Object.entries(index.chars)) for (const [name, a] of Object.entries(c.actions)) {
    const f = path.join(ROOT, a.file); n++;
    if (!fs.existsSync(f)) { bad.push(`缺图 ${a.file}`); continue; }
    const s = pngSize(f); if (s.w !== a.cols * c.cell[0] || s.h !== a.rows * c.cell[1]) bad.push(`${a.file} 尺寸 ${s.w}×${s.h} ≠ ${a.cols}×${a.rows} 格 × ${c.cell.join('×')}`);
    if (a.cols * a.rows < a.frames) bad.push(`${a.file} 格数不够放 ${a.frames} 帧`);
    if (!ACTIONS_OF[id]?.includes(name)) bad.push(`${id}/${name} 不在动作表里`);
  }
  for (const [k, b] of Object.entries(index.base)) if (!fs.existsSync(path.join(ROOT, b.file))) bad.push(`缺基础格 ${b.file}`);
  if (index.scale !== S) bad.push(`index.json 写的是 ${index.scale} 倍，这份代码是 ${S} 倍`);
  if (bad.length) { console.error(`HD 图包没通过核对（${bad.length} 项）：\n  - ${bad.join('\n  - ')}`); process.exit(1); }
  console.log(`HD 图包核对一致：${Object.keys(index.chars).length} 位 · ${n} 个动作 · ${Object.keys(index.base).length} 张基础格 · ${index.scale} 倍`);
  process.exit(0);
}

const cache = new Map();
const load = async (k) => {
  if (!cache.has(k)) { const f = path.join(BASE, k + '.png'); if (!fs.existsSync(f)) throw new Error(`缺基础格 ${f}`); const { rgba, w, h } = await decodePNG(new Uint8Array(fs.readFileSync(f))); cache.set(k, premultiply(rgba, w, h)); }
  return cache.get(k);
};
const indexFile = path.join(ROOT, 'index.json');
const index = fs.existsSync(indexFile) ? JSON.parse(fs.readFileSync(indexFile, 'utf8')) : { scale: S, note: '', chars: {}, base: {} };
index.scale = S; index.note = '每个动作一张网格图，帧号从左到右、从上到下；同一角色所有动作同格同锚点。anchor = 脚底中心在格内的像素坐标。';
const t0 = Date.now(); let frames = 0, bytes = 0;
for (const id of ids) {
  const keys = baseKeysOf(id); for (const k of keys) await load(k);
  const layout = layoutOf(id, (k) => cache.get(k)), lm = new Map(), actions = {};
  fs.mkdirSync(path.join(ROOT, id), { recursive: true });
  for (const name of ACTIONS_OF[id]) {
    const meta = actionMeta(name), fr = renderAction(id, name, (k) => cache.get(k), layout, lm), sheet = toSheet(fr, layout.cw, layout.ch);
    bleedEdges(sheet.rgba, sheet.w, sheet.h, 3);
    const png = PNG8 ? await quantizePNG(sheet.rgba, sheet.w, sheet.h) : await encodePNG(sheet.rgba, sheet.w, sheet.h);
    const file = `${id}/${name}.png`;
    fs.writeFileSync(path.join(ROOT, file), png); frames += meta.n; bytes += png.length;
    actions[name] = { label: meta.label, file, frames: meta.n, cols: sheet.cols, rows: sheet.rows, fps: meta.fps, loop: meta.loop };
  }
  index.chars[id] = { name: CAST[id].name, cell: [layout.cw, layout.ch], anchor: [layout.cw / 2, layout.footY], size1x: [layout.cw / S, layout.ch / S], actions };
  console.log(`${id.padEnd(7)} ${Object.keys(actions).length} 个动作 · 格 ${layout.cw}×${layout.ch} · ${((Date.now() - t0) / 1000).toFixed(0)}s`);
}
index.base = {};
for (const f of fs.readdirSync(BASE).filter((f) => f.endsWith('.png')).sort()) { const s = pngSize(path.join(BASE, f)); index.base[f.slice(0, -4)] = { file: `base/${f}`, w: s.w, h: s.h }; }
fs.writeFileSync(indexFile, JSON.stringify(index, null, 1) + '\n');
console.log(`写完：${frames} 帧 · ${(bytes / 1e6).toFixed(1)} MB · index.json（${Object.keys(index.base).length} 张基础格）`);
