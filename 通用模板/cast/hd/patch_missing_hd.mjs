#!/usr/bin/env node
// patch_missing_hd.mjs —— 补上「引擎里有这个动作、高清图集里却是空的」那些格子。
//
// 为什么会有缺口（2026-11-21 查出来）：
//   引擎的动作表 通用模板/engine/assets/cast_actions.json 是旧脚本 bake_actions.mjs 生成的；
//   高清动作包 通用模板/cast/hd/motion_hd.mjs 是另一份动作库。两边能对上的 492 格，
//   剩下 46 格（whale/eat、whale/spin、claude/petri、doubao/spin、gemini/spin、qwen/spin）
//   高清图集里是空的 —— 引擎对着空 rect 不取样、退回 1 倍那一层，于是同一个动作里
//   高清格和 1 倍格来回切换，人物忽清忽糊（`npm run film -- stills` 抽 f400 就能看到）。
//
// 这个脚本只补**高清那一层**，不动 cast_actions.json（旧片重渲逐帧一致）：
//   · spin（whale/doubao/gemini/qwen）→ 用高清库的 turn 重派生：正面 / 侧身换格转身，
//     不再像 1 倍那版把人横向压成 0.34 的细条。
//   · eat（whale）、petri（claude）→ 高清库里没有对应姿态，**不补**，继续用 1 倍。
//   补出来的格子和高清图集里其它动作格一样：按「1 倍 rect × S、底边中点对齐」裁进图集。
//
//   node 通用模板/cast/hd/patch_missing_hd.mjs --report   只报告缺口（不写盘）
//   node 通用模板/cast/hd/patch_missing_hd.mjs            补格 + 重烘高清图集
//   node 通用模板/cast/hd/patch_missing_hd.mjs --psnr     顺便量拼图像素差
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePNG, encodePNG, premultiply, frameSpec, actionMeta, renderAction, layoutOf, toSheet, bleedEdges } from './motion_hd.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../../..');
const PACK = path.join(REPO, '人物/q版HD_2x');
const ONE_X = path.join(REPO, '通用模板/engine/assets/cast_atlas.json');
const ACT = path.join(REPO, '通用模板/engine/assets/cast_actions.json');
const HD_JSON = path.join(REPO, '通用模板/engine/assets/cast_hd_atlas.json');
const ATLAS = path.join(REPO, '通用模板/cast/hd/bake_hd_atlas.mjs');

/** 引擎动作名 → 高清库动作名。没列出来的就是「补不了，留 1 倍」。 */
const FIX = { spin: 'turn' };

const REPORT = process.argv.includes('--report');
const one = JSON.parse(fs.readFileSync(ONE_X, 'utf8'));
const act = JSON.parse(fs.readFileSync(ACT, 'utf8'));
const hd = JSON.parse(fs.readFileSync(HD_JSON, 'utf8'));

const missing = [];
for (const [id, acts] of Object.entries(act.actions)) for (const [name, m] of Object.entries(acts))
  for (const f of m.frames) if (!hd.s[f]) missing.push({ id, name, key: f });

const byAct = new Map();
for (const m of missing) { const k = `${m.id}/${m.name}`; byAct.set(k, (byAct.get(k) ?? 0) + 1); }

if (REPORT) {
  for (const [k, n] of byAct) {
    const [id, name] = k.split('/');
    console.log(`${k.padEnd(18)} ${String(n).padStart(3)} 格  ${FIX[name] ? `补：按高清库「${FIX[name]}」重派生` : '不补（高清库没有这个姿态），继续用 1 倍'}`);
  }
  console.log(`合计 ${missing.length} 格 / ${byAct.size} 个动作没有高清；高清图集现在有 ${Object.values(hd.s).filter(Boolean).length} 格`);
  process.exit(0);
}

// ---- 1. 按高清库重新派生要补的动作 ----
const index = JSON.parse(fs.readFileSync(path.join(PACK, 'index.json'), 'utf8'));
const cache = new Map();
const chars = [...new Set([...byAct.keys()].map((k) => k.split('/')[0]))].filter((id) => Object.keys(FIX).some((n) => byAct.has(`${id}/${n}`)));

for (const id of chars) {
  const names = Object.keys(FIX).filter((n) => byAct.has(`${id}/${n}`));
  const store = new Map();
  const sizeOf = (k) => { const m = index.base[k]; return m ? { w: m.w, h: m.h } : null; };
  // 这一位角色在补的动作里会用到哪些基础格
  const need = new Set();
  for (const n of names) { const meta = actionMeta(FIX[n]); for (let i = 0; i < meta.n; i++) need.add(frameSpec(id, FIX[n], i).k); }
  for (const k of need) {
    const meta = index.base[k]; if (!meta) throw new Error(`${id} 要补的基础格 ${k} 不在高清包里`);
    if (!cache.has(meta.file)) cache.set(meta.file, await decodePNG(new Uint8Array(fs.readFileSync(path.join(PACK, meta.file)))));
    const { rgba, w, h } = cache.get(meta.file);
    store.set(k, { pm: premultiply(rgba, w, h), w, h });
  }
  const layout = layoutOf(id, sizeOf);
  for (const n of names) {
    const hdName = FIX[n], meta = actionMeta(hdName);
    const frames = renderAction(id, hdName, (k) => { const b = store.get(k); return b ? { pm: b.pm, w: b.w, h: b.h } : null; }, layout);
    const sheet = toSheet(frames, layout.cw, layout.ch);
    bleedEdges(sheet.rgba, sheet.w, sheet.h, 3);
    fs.mkdirSync(path.join(PACK, id), { recursive: true });
    // 存成和 bake_hd.mjs 一样的网格图（覆盖同名文件；高清图集随后重烘会取它）
    fs.writeFileSync(path.join(PACK, id, `${n}.png`), await encodePNG(sheet.rgba, sheet.w, sheet.h));
    const ent = index.chars[id].actions[n] ?? (index.chars[id].actions[n] = { label: meta.label, fps: meta.fps, loop: meta.loop, frames: meta.n, cols: sheet.cols, rows: sheet.rows, file: `${id}/${n}.png` });
    ent.file = `${id}/${n}.png`; ent.frames = meta.n; ent.cols = sheet.cols; ent.rows = sheet.rows;
    console.log(`补 ${id}/${n}：按高清库「${hdName}」重派生 ${meta.n} 帧（${sheet.w}×${sheet.h}）`);
  }
}
fs.writeFileSync(path.join(PACK, 'index.json'), JSON.stringify(index, null, 1) + '\n');

// ---- 2. 用补过的素材重烘高清图集 ----
const { spawnSync } = await import('node:child_process');
const r = spawnSync(process.execPath, [ATLAS, ...(process.argv.includes('--psnr') ? ['--psnr'] : [])], { stdio: 'inherit' });
if (r.status !== 0) throw new Error('重烘高清图集失败');
