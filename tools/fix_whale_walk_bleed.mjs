#!/usr/bin/env node
// 修本鲸（whale）八帧步态的“多出来的鱼尾”。
//
// 通用模板/cast/source/walk_cycle_data.js 由 tools/remotion-engine/bake_tonghuazhen_walk_cycles.py 生成
// （该生成脚本不在本仓库，步态条带是按 90 px 定距切格的），切格时把隔壁实例的边角一起切了进来：
//   · E1  x ≥ 66, y 60..76 —— 腰侧裙摆右前方一片淡蓝色的“鱼尾尖”，与身体没有连接，
//         就是观众看到的那条“前面多出的鱼尾”）；
//   · E2  x ≥ 69, y 77..88 —— 右下角另一只靴子的边缘，同样越界。
// 本脚本只做减法：把这些越界像素置 255（透明），真正的鲸尾（左下方那条长尾）与其它像素一律不动。
//
//   node tools/fix_whale_walk_bleed.mjs          就地改写 walk_cycle_data.js
//   node tools/fix_whale_walk_bleed.mjs --check  只检查还有没有残留，不改写
//
// 改完记得 npm run atlas 重建 通用模板/engine/assets/cast_atlas.png。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(HERE, '../通用模板/cast/source/walk_cycle_data.js');
const T = 255;

// 越界区域（含边界）
const ZONES = [
  { name: 'E1', x0: 66, x1: 89, y0: 60, y1: 76 },
  { name: 'E2', x0: 69, x1: 89, y0: 77, y1: 88 },
];

// E1 在个别帧里和裙摆粘连，会在 x 64..65 留下几颗残渣。八帧里这些位置本该是空白
// （干净帧在 y 64..70 的裙摆右缘都止于 x ≤ 63），所以这一小块直接清空。
const PALE_ZONE = { x0: 64, x1: 65, y0: 64, y1: 70 };

function decode(w, h, b64) {
  const bin = Buffer.from(b64, 'base64');
  const d = new Uint8Array(w * h);
  let p = 0;
  for (let i = 0; i < bin.length; i++) {
    const b = bin[i];
    if (b === 254) {
      const run = bin[++i];
      const val = bin[++i];
      d.fill(val, p, p + run);
      p += run;
    } else {
      d[p++] = b;
    }
  }
  if (p !== w * h) throw new Error(`解码长度不符：得到 ${p}，应为 ${w * h}`);
  return d;
}

function encode(d) {
  const out = [];
  let i = 0;
  while (i < d.length) {
    let j = i + 1;
    while (j < d.length && d[j] === d[i]) j++;
    const run = j - i;
    if (d[i] !== 254 && run >= 4) {
      out.push(254, run, d[i]);
    } else {
      for (let k = 0; k < run; k++) out.push(d[i]);
    }
    i = j;
  }
  return Buffer.from(out).toString('base64');
}

const text = fs.readFileSync(DATA_PATH, 'utf8');
const check = process.argv.includes('--check');
let out = text;
let total = 0;
const report = [];

for (let f = 0; f < 8; f++) {
  const key = `walk_whale_${f}`;
  const re = new RegExp(`(${key}: \\[)(\\d+), (\\d+), '([^']*)'(\\])`);
  const m = text.match(re);
  if (!m) throw new Error(`找不到 ${key}`);
  const w = Number(m[2]);
  const h = Number(m[3]);
  const d = decode(w, h, m[4]);

  let n = 0;
  for (const z of ZONES) {
    for (let y = Math.max(0, z.y0); y <= Math.min(h - 1, z.y1); y++) {
      for (let x = Math.max(0, z.x0); x <= Math.min(w - 1, z.x1); x++) {
        const p = y * w + x;
        if (d[p] !== T) { d[p] = T; n++; }
      }
    }
  }
  for (let y = PALE_ZONE.y0; y <= PALE_ZONE.y1; y++) {
    for (let x = PALE_ZONE.x0; x <= PALE_ZONE.x1; x++) {
      const p = y * w + x;
      if (d[p] !== T) { d[p] = T; n++; }
    }
  }
  total += n;
  report.push(`${key}: 清掉 ${n} px`);

  if (!check) {
    const b64 = encode(d);
    if (decode(w, h, b64).some((v, i) => v !== d[i])) throw new Error(`${key} 重新编码后不一致`);
    out = out.replace(re, (_all, a, ww, hh, _b, tail) => `${a}${ww}, ${hh}, '${b64}'${tail}`);
  }
}

if (check) {
  console.log(report.join('\n'));
  if (total === 0) console.log('✅ 八帧越界像素都已清干净');
  else { console.log(`❌ 还剩 ${total} px 越界像素，需要重新运行（去掉 --check）`); process.exit(1); }
} else {
  if (out === text) console.log('八帧本来就没有越界像素，文件未改动');
  else { fs.writeFileSync(DATA_PATH, out); console.log(report.join('\n')); console.log(`✅ 已改写 walk_cycle_data.js，共清掉 ${total} px`); }
}
