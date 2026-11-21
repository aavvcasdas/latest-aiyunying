#!/usr/bin/env node
// svg_pack.mjs —— 把八位角色的高清基础格导成 SVG（每人一个文件），给「矢量角色」用。
//
//   node 通用模板/cast/hd/svg_pack.mjs                       写到 人物/q版HD_2x/svg/
//   node 通用模板/cast/hd/svg_pack.mjs --out /tmp/svg        换目录
//   node 通用模板/cast/hd/svg_pack.mjs --only whale,claude   只导两位
//   node 通用模板/cast/hd/svg_pack.mjs --report              只报体积（不写文件）
//
// 每个文件把这位角色的全部基础格排成一格一格（同一格宽高，和 index.json 的 cell 一致），
// 方便拼动作；单格的 SVG 就用 svg_px.mjs 直接转。转换规则见 svg_px.mjs 开头：同色像素方块合并成路径、
// 先去掉抠边残留（白边）、透明像素不写进去。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePNG } from './motion_hd.mjs';
import { renderSvg, defringe } from './svg_px.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../../..');
const PACK = path.join(REPO, '人物/q版HD_2x');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i < 0 ? d : process.argv[i + 1]; };
const OUT = path.resolve(arg('--out', path.join(PACK, 'svg')));
const REPORT = process.argv.includes('--report');
const only = arg('--only', null);
const index = JSON.parse(fs.readFileSync(path.join(PACK, 'index.json'), 'utf8'));
const ids = (only ? only.split(',') : Object.keys(index.chars)).filter((id) => { if (!index.chars[id]) throw new Error(`没有角色「${id}」`); return true; });

/** 这张格子里有哪些基础格属于这位角色（名字前缀或角色标识） */
const keysOf = (id) => Object.keys(index.base).filter((k) => new RegExp(`^${id}_`).test(k) || k.startsWith(`walk_${id}`) || k.startsWith(`p_${id}`) && id !== 'gpt');

let total = 0, cells = 0;
fs.mkdirSync(OUT, { recursive: true });
for (const id of ids) {
  const keys = keysOf(id).sort();
  if (!keys.length) { console.log(`${id}: 没有基础格，跳过`); continue; }
  const arts = [];
  for (const k of keys) {
    const { rgba, w, h } = await decodePNG(new Uint8Array(fs.readFileSync(path.join(PACK, index.base[k].file))));
    const d = defringe(rgba, w, h);
    arts.push({ k, rgba: d.rgba, w, h, removed: d.removed });
  }
  // 排成一列（每格按最大宽高对齐）：拼动作时和 cast_atlas 的「逐格坐标」一个意思
  const cw = Math.max(...arts.map((a) => a.w)), ch = Math.max(...arts.map((a) => a.h));
  const sheetW = cw * arts.length, sheetH = ch;
  const sheet = new Uint8ClampedArray(sheetW * sheetH * 4);
  arts.forEach((a, i) => {
    const ox = i * cw + Math.floor((cw - a.w) / 2), oy = ch - a.h;
    for (let y = 0; y < a.h; y++) sheet.set(a.rgba.subarray(y * a.w * 4, (y + 1) * a.w * 4), ((oy + y) * sheetW + ox) * 4);
  });
  const sv = renderSvg({ rgba: sheet, w: sheetW, h: sheetH, scale: 2, title: `${index.chars[id].name}（${id}）基础格` });
  const rects = keys.map((k, i) => ({ key: k, x: i * cw, y: 0, w: cw, h: ch }));
  const json = JSON.stringify({ id, name: index.chars[id].name, scale: index.scale, sheet: { w: sheetW, h: sheetH }, cells: rects }, null, 1) + '\n';
  total += sv.bytes + json.length; cells += keys.length;
  if (!REPORT) {
    fs.writeFileSync(path.join(OUT, `${id}.svg`), sv.svg);
    fs.writeFileSync(path.join(OUT, `${id}.json`), json);
  }
  console.log(`${id.padEnd(7)} ${String(keys.length).padStart(3)} 格 · ${sv.colors} 色 · 矩形 ${sv.rects} · SVG ${(sv.bytes / 1024).toFixed(1)} KB · 去残留 ${arts.reduce((n, a) => n + a.removed, 0)} 像素`);
}
console.log(`合计 ${ids.length} 位 · ${cells} 格 · ${(total / 1024 / 1024).toFixed(2)} MB${REPORT ? '（只报体积，没写文件）' : ` → ${path.relative(REPO, OUT)}/`}`);
