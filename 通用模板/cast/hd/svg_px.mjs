#!/usr/bin/env node
// svg_px.mjs —— 把像素图转成 SVG：每个调色板颜色一条 path（像素块），不是「一张图塞进 SVG」。
//
// 为什么要这样转（针对用户反馈的「样片 svg 挺大」「白边也复刻过来了」）：
//   1. 体积：像素画只有几十种颜色，同一颜色的相邻像素方块能合并成一段矩形轮廓。
//      一条「横向连成一串的像素方块」= 4 个数（x y w h），比逐像素一个 <rect> 少一个数量级；
//      颜色用 CSS 类写一次，路径里只有数字。实测见下（--report）。
//   2. 白边：转换前先过一遍「去抠边残留」——和 通用模板/cast/hd/hd_base.py 同一套规则：
//      墨线内侧那一圈里，比里面亮、朝白偏、往里又找不到相近颜色的像素，重上色成里面的颜色。
//      真正的东西（蕾丝、围裙、手、浅色发梢）有 ≥2 像素厚，会被认作「有支撑」不动。
//   3. 干净：透明像素不写进 SVG（不会把黑底 / 白底一起复刻过来）；半透明像素按原 alpha 写 fill-opacity。
//
// 用法：
//   node 通用模板/cast/hd/svg_px.mjs <输入.png> <输出.svg>   [--scale 2] [--title 名字]
//   node 通用模板/cast/hd/svg_px.mjs --sheet <输入.png> <输出.svg> --cols 8 --rows 1 ...
// 也可以当模块用：renderSvg({ rgba, w, h, scale, title }) → { svg, bytes, colors, rects }。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decodePNG } from './motion_hd.mjs';

const INK = [24, 20, 37];
const LUM = [0.299, 0.587, 0.114];

/** 平移一个掩码（零填充） */
function shift(m, w, h, dx, dy) {
  const o = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const sy = y - dy; if (sy < 0 || sy >= h) continue;
    for (let x = 0; x < w; x++) {
      const sx = x - dx; if (sx < 0 || sx >= w) continue;
      o[y * w + x] = m[sy * w + sx];
    }
  }
  return o;
}

/** 距透明区几圈：1 = 贴着透明（4 邻域），2 = 再往里一圈…… */
function edgeDist(op, w, h, levels = 4) {
  const d = new Uint8Array(w * h);
  let cur = Uint8Array.from(op);
  for (let lv = 1; lv <= levels; lv++) {
    const nb = new Uint8Array(w * h).fill(1);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const s = shift(cur, w, h, dx, dy);
      for (let i = 0; i < nb.length; i++) nb[i] &= s[i];
    }
    const ring = new Uint8Array(w * h);
    for (let i = 0; i < nb.length; i++) { ring[i] = cur[i] & (nb[i] ? 0 : 1); d[i] = ring[i] ? lv : d[i]; }
    cur = nb;
  }
  for (let i = 0; i < d.length; i++) if (!d[i] && cur[i]) d[i] = levels + 1;
  return d;
}

/**
 * 去抠边残留：只动「墨线内侧 / 轮廓里侧那一圈」里比里面更亮、朝白偏、且往里两圈找不到相近颜色的像素。
 * 返回改过的 RGBA（不改 alpha，轮廓形状不变）。
 */
export function defringe(rgba, w, h) {
  const op = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) op[i] = rgba[i * 4 + 3] > 0 ? 1 : 0;
  const d = edgeDist(op, w, h, 3);
  const isInk = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    if (!op[i]) continue;
    const dr = Math.abs(rgba[i * 4] - INK[0]) + Math.abs(rgba[i * 4 + 1] - INK[1]) + Math.abs(rgba[i * 4 + 2] - INK[2]);
    isInk[i] = dr < 6 ? 1 : 0;
  }
  // 墨线旁边那一圈
  const nearInk = new Uint8Array(w * h);
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const s = shift(isInk, w, h, dx, dy);
    for (let i = 0; i < nearInk.length; i++) nearInk[i] |= s[i];
  }
  const out = new Uint8ClampedArray(rgba);
  let removed = 0;
  const lum = (i) => rgba[i * 4] * LUM[0] + rgba[i * 4 + 1] * LUM[1] + rgba[i * 4 + 2] * LUM[2];
  const colorDist = (i, j) => Math.abs(rgba[i * 4] - rgba[j * 4]) + Math.abs(rgba[i * 4 + 1] - rgba[j * 4 + 1]) + Math.abs(rgba[i * 4 + 2] - rgba[j * 4 + 2]);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    if (!op[i] || isInk[i]) continue;
    const ring = d[i];
    if (ring > 3) continue;
    if (ring === 2 && !nearInk[i]) continue;
    // 往里两圈的平均色（跳过墨线和更贴边的像素）
    let r = 0, g = 0, b = 0, n = 0;
    for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
      const xx = x + dx, yy = y + dy;
      if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
      const j = yy * w + xx;
      if (!op[j] || isInk[j] || d[j] <= ring) continue;
      r += rgba[j * 4]; g += rgba[j * 4 + 1]; b += rgba[j * 4 + 2]; n++;
    }
    if (!n) continue;
    const base = [r / n, g / n, b / n];
    const baseLum = base[0] * LUM[0] + base[1] * LUM[1] + base[2] * LUM[2];
    // 「有支撑」：附近（3 像素内）有颜色相近、更靠里的实心像素 —— 蕾丝、围裙、手这类东西就是靠这个留下来的
    let support = false;
    for (let dy = -3; dy <= 3 && !support; dy++) for (let dx = -3; dx <= 3; dx++) {
      const xx = x + dx, yy = y + dy;
      if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
      const j = yy * w + xx;
      if (!op[j] || d[j] <= ring + 1) continue;
      if (colorDist(i, j) < 54) { support = true; break; }
    }
    if (support) continue;
    const whiteness = Math.min(rgba[i * 4], rgba[i * 4 + 1], rgba[i * 4 + 2]) - Math.min(base[0], base[1], base[2]);
    if (lum(i) - baseLum > (ring < 3 ? 18 : 29) && whiteness > 0) {
      out[i * 4] = Math.round(base[0]); out[i * 4 + 1] = Math.round(base[1]); out[i * 4 + 2] = Math.round(base[2]);
      removed++;
    }
  }
  return { rgba: out, removed };
}

/**
 * 把 RGBA 转成「合并过的横向像素段」：同色、同一行、左右相连的像素并成一段。
 * 返回 [{ c: 颜色 rgba 键, x, y, w, a: alpha }]。
 */
export function runs(rgba, w, h, merge = 2) {
  const out = [];
  const keyAt = (i) => (rgba[i * 4] << 24 | rgba[i * 4 + 1] << 16 | rgba[i * 4 + 2] << 8 | rgba[i * 4 + 3]) >>> 0;
  for (let y = 0; y < h; y++) {
    let x = 0;
    while (x < w) {
      const i = y * w + x;
      if (!rgba[i * 4 + 3]) { x++; continue; }
      const key = keyAt(i);
      let x2 = x + 1;
      while (x2 < w) {
        const j = y * w + x2;
        if (!rgba[j * 4 + 3] || keyAt(j) !== key) break;
        x2++;
      }
      // 合并：同一行里，两段同色之间只隔几个别的像素（发型高光、眼睛、衣褶就在这种缝里），
      // 把它们并成一段，缝隙由后面画的段盖住——肉眼一模一样，节点数少一大截。
      let gap = 0;
      while (x2 + gap < w) {
        const j = y * w + x2 + gap;
        if (rgba[j * 4 + 3] && keyAt(j) === key) break;
        gap++;
        if (gap > merge) break;
      }
      if (gap <= merge && x2 + gap < w && keyAt(y * w + x2 + gap) === key) {
        x2 = x2 + gap;
        while (x2 < w) {
          const j = y * w + x2;
          if (!rgba[j * 4 + 3] || keyAt(j) !== key) break;
          x2++;
        }
      }
      out.push({ key, x, y, w: x2 - x });
      x = x2;
    }
  }
  return out;
}

/** 矩形轮廓合并：同一行里相邻、同一颜色的段，和上一行完全对齐的，就往下长成矩形（少一半以上节点） */
export function rects(rgba, w, h) {
  const rs = runs(rgba, w, h);
  const byPos = new Map(rs.map((r) => [`${r.x},${r.y},${r.w}`, r]));
  const used = new Set();
  const out = [];
  for (const r of rs) {
    if (used.has(r)) continue;
    let hh = 1;
    while (true) {
      const nx = byPos.get(`${r.x},${r.y + hh},${r.w}`);
      if (!nx || nx.key !== r.key || used.has(nx)) break;
      used.add(nx); hh++;
    }
    out.push({ key: r.key, x: r.x, y: r.y, w: r.w, h: hh });
  }
  return out;
}

const hex2 = (n) => n.toString(16).padStart(2, '0');

/**
 * 像素图 → SVG。
 *   scale   一个像素画几单位（只影响显示大小，路径里仍是原像素坐标）
 *   title   写进 <title>，无障碍用
 *   merge   同一行两段同色之间隔几个像素以内就并成一段（默认 2；填 0 = 严格逐像素）
 * 颜色用 CSS 类：每个颜色一条 <path class="cN">，路径里只有数字。
 */
export function renderSvg({ rgba, w, h, scale = 1, title = '像素角色' }) {
  const list = rects(rgba, w, h);
  const colors = new Map();
  for (const r of list) (colors.get(r.key) ?? colors.set(r.key, []).get(r.key)).push(r);
  let body = '';
  const cls = [];
  [...colors.entries()].sort((a, b) => a[0] - b[0]).forEach(([key, rs], i) => {
    const a = key & 255, rgb = [key >>> 24 & 255, key >>> 16 & 255, key >>> 8 & 255];
    const op = a / 255;
    const line = rs.filter((r) => r.h === 1), block = rs.filter((r) => r.h > 1);
    cls.push(`.c${i}{fill:#${rgb.map(hex2).join('')}${op < 1 ? `;fill-opacity:${+op.toFixed(3)}` : ''}${line.length ? `;stroke:#${rgb.map(hex2).join('')}` : ''}}`);
    if (block.length) body += `<path class="c${i}" d="${block.map((r) => `M${r.x} ${r.y}h${r.w}v${r.h}h-${r.w}z`).join('')}"/>`;
    // 一条横线用 stroke 写：M x .5 h长（线宽 1，正好盖住整行像素）
    if (line.length) body += `<path class="c${i}" stroke-width="1" d="${line.map((r) => `M${r.x} ${r.y + 0.5}h${r.w}`).join('')}"/>`;
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w * scale}" height="${h * scale}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges"><title>${title}</title><style>${cls.join('')}</style>${body}</svg>`;
  return { svg, bytes: Buffer.byteLength(svg), colors: colors.size, rects: list.length };
}

// ---------------- 命令行 ----------------
const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const argv = process.argv.slice(2);
  const flag = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
  const noDefringe = argv.includes('--no-defringe');
  const scale = Number(flag('--scale', 1));
  const cols = Number(flag('--cols', 1)), rows = Number(flag('--rows', 1));
  const pos = argv.filter((a, i) => !a.startsWith('--') && !(i > 0 && argv[i - 1].startsWith('--')));
  const [src, dst] = pos;
  if (!src || !dst) { console.error('用法：node svg_px.mjs <输入.png> <输出.svg> [--scale 2] [--cols 8 --rows 1] [--no-defringe] [--title 名字]'); process.exit(1); }
  const { rgba, w, h } = await decodePNG(new Uint8Array(fs.readFileSync(src)));
  const cw = Math.floor(w / cols), ch = Math.floor(h / rows);
  let out = null, total = 0, totalErr = 0, colors = 0, n = 0;
  if (cols * rows === 1) {
    const d = noDefringe ? { rgba, removed: 0 } : defringe(rgba, w, h);
    out = renderSvg({ rgba: d.rgba, w, h, scale, title: flag('--title', path.basename(src, '.png')) });
    console.log(`${path.basename(src)}：${w}×${h} · ${out.colors} 色 · ${out.rects} 个矩形 · SVG ${(out.bytes / 1024).toFixed(1)} KB${d.removed ? ` · 去掉抠边残留 ${d.removed} 像素` : ''}`);
  } else {
    // 网格图（每个动作一张）：每格转成一个 <g transform>，整张图一个 SVG
    let body = '', cls = new Map(), sheet = '';
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const cell = new Uint8ClampedArray(cw * ch * 4);
      for (let y = 0; y < ch; y++) {
        const o = ((r * ch + y) * w + c * cw) * 4;
        cell.set(rgba.subarray(o, o + cw * 4), y * cw * 4);
      }
      const d = noDefringe ? { rgba: cell, removed: 0 } : defringe(cell, cw, ch);
      totalErr += d.removed;
      const sv = renderSvg({ rgba: d.rgba, w: cw, h: ch, scale, title: `帧 ${r * cols + c + 1}` });
      n++;
      const inner = sv.svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
      // 颜色类名加上格子前缀，避免互相覆盖
      const pref = `f${r * cols + c}_`;
      const inner2 = inner.replace(/class="c(\d+)"/g, (_m, i) => `class="${pref}c${i}"`).replace(/\.c(\d+)\{/g, (_m, i) => `.${pref}c${i}{`);
      body += `<g transform="translate(${c * cw} ${r * ch})">${inner2}</g>`;
      total += sv.bytes;
    }
    sheet = `<svg xmlns="http://www.w3.org/2000/svg" width="${w * scale}" height="${h * scale}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">${body}</svg>`;
    out = { svg: sheet, bytes: Buffer.byteLength(sheet), colors: 0, rects: 0 };
    console.log(`${path.basename(src)}：${cols}×${rows} 格 · ${n} 帧 · SVG ${(out.bytes / 1024).toFixed(1)} KB${totalErr ? ` · 去掉抠边残留 ${totalErr} 像素` : ''}`);
  }
  fs.mkdirSync(path.dirname(path.resolve(dst)), { recursive: true });
  fs.writeFileSync(dst, out.svg);
  void total; void colors;
}
