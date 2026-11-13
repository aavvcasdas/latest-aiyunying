#!/usr/bin/env node
// 把 motion-v2 的动作格追加进图集坐标表 通用模板/engine/assets/cast_atlas.json
//
//   npm run motion      # 追加坐标 + 重烘图集（内部会跑一遍 bake_atlas.mjs）
//
// 来源：通用模板/cast/source/motion-v2.json（无损像素源数据，{ key: [w, h, zlib+base64] }）。
// 每个动作 24 帧、12 fps、两秒一轮，格子名 `motion_<角色>_<动作>_<帧号>`。
//
// 规则与上游安装器一致：
//   · 原有格子（立绘 / 步态 / 派生动作 / 道具 / 表情贴）的坐标一格不动，新格子从它们下面开始排；
//   · 图集宽度 4096，行高取该行最高的一格；像素完全相同的帧共用一个矩形（省显存）；
//   · 高度超过 8192 就报错（兼容性上限）；
//   · 重复执行是安全的：先把已有的 motion_ 格子摘掉，再从底边重新排。
// 本分支已删 Grok 形象，motion-v2.json 里 Grok 的 288 格在上游就已经被剔掉了。
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const META_PATH = path.join(HERE, '../engine/assets/cast_atlas.json');
const MOTION_PATH = path.join(HERE, 'source/motion-v2.json');
const WIDTH = 4096;
const MAX_H = 8192;

if (!fs.existsSync(MOTION_PATH)) throw new Error(`没有 ${path.relative(process.cwd(), MOTION_PATH)}：把上游资源包里的 motion-v2.json 放到这里`);
const meta = JSON.parse(fs.readFileSync(META_PATH, 'utf8'));
const motion = JSON.parse(fs.readFileSync(MOTION_PATH, 'utf8'));

// 每个格子的像素长度要能对上，否则宁可停在这里，也不写到半张图集里
for (const [key, [w, h, data]] of Object.entries(motion)) {
  const px = zlib.inflateSync(Buffer.from(data, 'base64'));
  if (!Number.isInteger(w) || !Number.isInteger(h) || w < 1 || h < 1 || w > 128 || h > 128) throw new Error(`[motion-v2] 「${key}」尺寸不合法`);
  if (px.length !== w * h * 4) throw new Error(`[motion-v2] 「${key}」像素长度不符`);
}

// 先摘掉上次排的 motion_ 格子，再算原有格子的底边
const stale = Object.keys(meta.s).filter((k) => k.startsWith('motion_'));
for (const k of stale) delete meta.s[k];
let baseH = 0;
for (const [, [, y0, , h]] of Object.entries(meta.s)) baseH = Math.max(baseH, y0 + h);
if (!baseH) throw new Error('坐标表里一格都没有：先跑 npm run actions');

let x = 2, y = baseH + 2, rowHeight = 0, unique = 0;
const placed = new Map();
for (const [key, [w, h, data]] of Object.entries(motion)) {
  const hash = crypto.createHash('sha256').update(`${w}:${h}:${data}`).digest('hex');
  let rect = placed.get(hash);
  if (!rect) {
    if (x + w + 2 > WIDTH) { x = 2; y += rowHeight + 2; rowHeight = 0; }
    rect = [x, y, w, h];
    placed.set(hash, rect);
    x += w + 2;
    rowHeight = Math.max(rowHeight, h);
    unique++;
  }
  meta.s[key] = rect;
}
meta.w = WIDTH;
meta.h = y + rowHeight + 2;
if (meta.h > MAX_H) throw new Error(`图集高度 ${meta.h} 超过 ${MAX_H} 的兼容上限`);

fs.writeFileSync(META_PATH, JSON.stringify(meta));
console.log(`motion-v2：${Object.keys(motion).length} 格动作 / ${unique} 个不同的矩形（去重省了 ${Object.keys(motion).length - unique} 格）`);
console.log(`cast_atlas.json：${Object.keys(meta.s).length} 格，${meta.w}×${meta.h}（原有 ${Object.keys(meta.s).length - Object.keys(motion).length} 格坐标没动）`);

execFileSync(process.execPath, [path.join(HERE, 'bake_atlas.mjs')], { stdio: 'inherit' });
execFileSync(process.execPath, [path.join(HERE, 'bake_atlas.mjs'), '--check'], { stdio: 'inherit' });
