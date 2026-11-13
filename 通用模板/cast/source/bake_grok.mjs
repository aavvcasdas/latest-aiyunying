#!/usr/bin/env node
// 由 Gemini 的像素格派生 Grok 的像素格（金发 / 黑礼服 / 角 / 斧形腰饰）。
// 用法：node cast/source/bake_grok.mjs   → 重写 cast/source/grok_data.js
// 只读 Cast 精灵表里的 gemini_*，不改动原有格子；输出与 walk_cycle_data.js 同格式。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const imp = (f) => import(pathToFileURL(path.join(HERE, f)).href);
const { RGB, T } = await imp('px.js');
const { getBakedSprite, RAW_SPRITES } = await imp('sprites_data.js');
await imp('walk_cycle_data.js');

const hex = (i) => '#' + RGB[i].map((v) => v.toString(16).padStart(2, '0')).join('');
const IDX = new Map();                       // '#rrggbb' -> 调色板号
RGB.forEach((_, i) => { if (i !== T) IDX.set(hex(i), i); });
const H = (h) => { const v = IDX.get(h); if (v == null) throw new Error('调色板里没有 ' + h); return v; };

// 金发（冷 / 暖两档，按原图蓝紫的浓淡分开，保留原发丝的光影层次）
const GOLD_COLD = ['#733e39', '#b86f50', '#d9822b', '#e4a672', '#feae34', '#ffd166', '#fff3b0'].map(H);
const GOLD_WARM = ['#5a403b', '#b86f50', '#e4a672', '#feae34', '#ffd166', '#fff3b0'].map(H);
// 黑礼服（原图的白 / 米白 / 浅紫按明度压进这一条）
const BLACK = ['#141318', '#181425', '#262b44'].map(H);

const INK = H('#181425'), STEEL = H('#c0cbdc'), STEEL_D = H('#8b9bb4'), GLINT = H('#ffd166'), HAFT = H('#b86f50');

const lum = (i) => { const [r, g, b] = RGB[i]; return 0.299 * r + 0.587 * g + 0.114 * b; };
const sat = (i) => { const [r, g, b] = RGB[i]; return Math.max(r, g, b) - Math.min(r, g, b); };
const isSkin = (i) => RGB[i][0] - RGB[i][2] >= 20 && lum(i) >= 150;
const isHair = (i) => lum(i) >= 32 && sat(i) >= 40 && RGB[i][2] - RGB[i][0] >= 12;
const ramp = (v, lo, hi, r) => {
  const t = hi === lo ? 0 : Math.max(0, Math.min(1, (v - lo) / (hi - lo)));
  return r[Math.min(r.length - 1, Math.round(t * (r.length - 1)))];
};

function label(w, h, pass) {                      // 8 邻接连通块
  const lab = new Int32Array(w * h).fill(-1), comps = [];
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i0 = y * w + x;
    if (lab[i0] >= 0 || !pass(x, y)) continue;
    const cid = comps.length; comps.push([]); lab[i0] = cid;
    const q = [[x, y]];
    while (q.length) {
      const [cx, cy] = q.pop(); comps[cid].push([cx, cy]);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const j = ny * w + nx;
        if (lab[j] >= 0 || !pass(nx, ny)) continue;
        lab[j] = cid; q.push([nx, ny]);
      }
    }
  }
  return { lab, comps };
}

const PAD = 9;                                    // 头顶留 9 行给角
// 角：从发顶两侧长出，向外弯（dx 指远离中心的方向，dy 向上为负）
const HORN_ROWS = { '-9': [0], '-8': [0], '-7': [-1, 0], '-6': [-1, 0], '-5': [-1, 0, 1], '-4': [-1, 0, 1], '-3': [-2, -1, 0, 1], '-2': [-2, -1, 0, 1], '-1': [-2, -1, 0, 1, 2], '0': [-2, -1, 0, 1, 2], '1': [-2, -1, 0, 1, 2, 3], '2': [-2, -1, 0, 1, 2, 3] };
const HORN_LIGHT = [[0, -7], [-1, -4], [0, -2]];   // 角上的高光
const HORN_HL = [[0, -8], [-1, -6], [-1, -3], [0, -1]];

function bake(srcKey, { pad = PAD, horns = true, axe = true } = {}) {
  const s = getBakedSprite(srcKey);
  if (!s) throw new Error('缺少精灵 ' + srcKey);
  const { w, h, d } = s;
  const at = (x, y) => d[y * w + x];
  const opaque = (x, y) => at(x, y) !== T;

  // 1. 脸：最大的皮肤连通块（眼睛要原样保留，色号再像也按块判）
  const skin = label(w, h, (x, y) => opaque(x, y) && isSkin(at(x, y)));
  const face = skin.comps.reduce((a, b) => (b.length > a.length ? b : a), []);
  const fx0 = Math.min(...face.map((p) => p[0])), fx1 = Math.max(...face.map((p) => p[0]));
  const fy0 = Math.min(...face.map((p) => p[1])), fy1 = Math.max(...face.map((p) => p[1]));
  const chin = fy1;

  // 2. 眼睛：脸框内高饱和的蓝紫小块
  const eyes = new Set();
  for (const c of label(w, h, (x, y) => opaque(x, y) && x >= fx0 && x <= fx1 && y >= fy0 && y <= fy1 && sat(at(x, y)) >= 40 && RGB[at(x, y)][2] - RGB[at(x, y)][0] >= 10).comps) {
    const xs = c.map((p) => p[0]), ys = c.map((p) => p[1]);
    if (c.length >= 3 && Math.max(...xs) - Math.min(...xs) <= 11 && Math.max(...ys) - Math.min(...ys) <= 8) c.forEach((p) => eyes.add(p[1] * w + p[0]));
  }

  // 3. 头发：从头顶按颜色漫延；再补两圈孔（只补蓝调像素，别啃到裙子）
  const hair = new Set(); const q = [];
  for (let x = 0; x < w; x++) for (let y = 0; y < Math.min(4, h); y++) {
    const i = at(x, y); if (i !== T && isHair(i) && !hair.has(y * w + x)) { hair.add(y * w + x); q.push([x, y]); }
  }
  while (q.length) {
    const [x, y] = q.pop();
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const j = ny * w + nx;
      if (hair.has(j)) continue;
      const i = at(nx, ny);
      if (i !== T && isHair(i)) { hair.add(j); q.push([nx, ny]); }
    }
  }
  for (let pass = 0; pass < 2; pass++) {
    const add = [];
    for (const p of hair) {
      const x = p % w, y = (p - x) / w;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const j = ny * w + nx;
        if (hair.has(j) || eyes.has(j)) continue;
        const i = at(nx, ny);
        if (i === T || isSkin(i)) continue;
        if (ny > chin + 6) continue;                                  // 腰部以下不补
        if (RGB[i][2] - RGB[i][0] < 6 || lum(i) < 32) continue;        // 只补蓝调的发丝
        add.push(j);
      }
    }
    add.forEach((j) => hair.add(j));
  }

  // 4. 上色
  const W = w, HT = h + pad, out = new Uint8Array(W * HT).fill(T);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = at(x, y); if (i === T) continue;
    const j = y * w + x;
    let v;
    if (lum(i) < 32 || isSkin(i) || eyes.has(j)) v = i;               // 轮廓、皮肤、眼睛原样
    else if (hair.has(j)) v = ramp(lum(i), 110, 235, RGB[i][2] - RGB[i][0] >= 40 ? GOLD_COLD : GOLD_WARM);
    else v = ramp(lum(i), 60, 250, BLACK);
    out[(y + pad) * W + x] = v;
  }


  // 5. 清理（2026-11 修）：Gemini 发丝里的暗部饱和度不够，会被当成「衣服」压成黑色，头发里留下一块块黑斑；
  //    闭眼那一格，盖在脸上的发丝又被当成「眼睛」原样留下（一块淡紫）。这里按邻居把它们收回金发：
  //    · 黑礼服色、四周八格里金发占一半以上、且不贴透明（不是外轮廓）→ 取邻居里最多的那一档金色
  //    · 残留的蓝紫色、紧挨着三格以上金发 → 按明度落到金发色阶
  //    反复三遍，块状黑斑由外向内收掉；皮肤、眼睛（四周不是金发）不受影响。
  const GOLDS = new Set([...GOLD_COLD, ...GOLD_WARM]), DARKS = new Set(BLACK);
  for (let pass = 0; pass < 3; pass++) {
    const src = out.slice();
    for (let y = 1; y < HT - 1; y++) for (let x = 1; x < W - 1; x++) {
      const v = src[y * W + x]; if (v === T) continue;
      const cnt = new Map(); let gold = 0, clear = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const n = src[(y + dy) * W + x + dx];
        if (n === T) clear++;
        else if (GOLDS.has(n)) { gold++; cnt.set(n, (cnt.get(n) ?? 0) + 1); }
      }
      const blueish = !GOLDS.has(v) && !DARKS.has(v) && RGB[v][2] - RGB[v][0] >= 12 && sat(v) >= 25;
      if ((DARKS.has(v) || v === INK) && gold >= 5 && clear === 0) out[y * W + x] = [...cnt].sort((a, b) => b[1] - a[1])[0][0];
      else if (blueish && gold >= 3) out[y * W + x] = ramp(lum(v), 110, 235, GOLD_WARM);
    }
  }

  const put = (x, y, v) => { if (x >= 0 && y >= 0 && x < W && y < HT) out[y * W + x] = v; };
  let top = 0; while (top < HT && !out.slice(top * W, (top + 1) * W).some((v) => v !== T)) top++;
  const row = []; for (let x = 0; x < W; x++) if (out[(top + 1) * W + x] !== T) row.push(x);
  const cx = Math.round((Math.min(...row) + Math.max(...row)) / 2);

  if (horns) for (const side of [-1, 1]) {
    const bx = cx + side * 4, by = top + 9;
    for (const [dyS, dxs] of Object.entries(HORN_ROWS)) {
      const dy = Number(dyS);
      for (const dx of dxs) put(bx + side * dx, by + dy, H('#262b44'));
      put(bx + side * dxs[0], by + dy, INK); put(bx + side * dxs[dxs.length - 1], by + dy, INK);
    }
    for (const [dx, dy] of HORN_LIGHT) put(bx + side * dx, by + dy, GLINT);
    for (const [dx, dy] of HORN_HL) put(bx + side * dx, by + dy, H('#3a4466'));
  }
  if (axe) {                                     // 斧形腰饰：短柄 + 三角刃
    const ax = cx + 9, ay = top + 52;
    for (let i = 0; i < 5; i++) put(ax + i, ay + i, i % 2 ? HAFT : H('#684c44'));
    for (let dy = 0; dy < 4; dy++) for (let dx = 0; dx <= 3 - Math.max(0, dy - 1); dx++) {
      put(ax + dx, ay + dy - 4, dx === 0 && dy === 0 ? STEEL_D : STEEL);
    }
    put(ax, ay - 5, STEEL); put(ax + 1, ay - 5, INK); put(ax - 1, ay - 4, INK);
  }
  return [W, HT, out];
}

// RLE + base64（与 sprites_data.js 的 getBakedSprite 同一套：254 后面跟「重复次数、色号」）
function encode(bytes) {
  const out = [];
  for (let i = 0; i < bytes.length;) {
    let n = 1;
    while (i + n < bytes.length && bytes[i + n] === bytes[i] && n < 255) n++;
    if (n >= 3) { out.push(254, n, bytes[i]); i += n; } else { out.push(bytes[i]); i++; }
  }
  return Buffer.from(out).toString('base64');
}

const jobs = [
  ['grok_front_0', 'gemini_front_0'], ['grok_front_1', 'gemini_front_1'],
  ['grok_side_0', 'gemini_side_0'], ['grok_side_1', 'gemini_side_1'],
  ...Array.from({ length: 8 }, (_, i) => [`walk_grok_${i}`, `walk_gemini_${i}`]),
  ['p_grok', 'p_gemini', { pad: 0, horns: false, axe: false }],
];

const lines = jobs.map(([key, src, opt]) => {
  const [w, h, data] = bake(src, opt ?? {});
  return `  ${key}: [${w}, ${h}, '${encode(data)}'],`;
});

const head = `// Generated by cast/source/bake_grok.mjs —— 不要手改；要改造型就改 bake_grok.mjs 再跑。
// Grok 的像素格：形体取自 gemini_*（同一套比例与画法），换色 + 加角 + 加斧形腰饰。
// 金发：#733e39→#fff3b0 六～七档；黑礼服：#141318→#3a4466 四档；眼睛与皮肤原样保留。
// 头部上方留 9 行给角，所以身体格高 93（其余角色是 84 或 90）。
import { RAW_SPRITES } from './sprites_data.js';

Object.assign(RAW_SPRITES, {
`;
fs.writeFileSync(path.join(HERE, 'grok_data.js'), head + lines.join('\n') + '\n});\n');
console.log('写了 grok_data.js：', jobs.length, '格');

