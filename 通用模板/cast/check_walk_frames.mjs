#!/usr/bin/env node
// Generic walk-frame bleed check. It inspects the baked sprite data, not the PNG,
// so it can run before `npm run atlas` writes a new image.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');

/**
 * Find disconnected non-transparent components touching the left/right/bottom edge
 * of a walk cell. Those are the classic "next cell's boot/tail bled into this frame"
 * artefacts. The largest component is assumed to be the character.
 */
export function inspectWalkSprites(getSprite, keys, options = {}) {
  const T = options.transparent ?? 255;
  const minPixels = options.minPixels ?? 3;
  const maxMainRatio = options.maxMainRatio ?? 0.35;
  const problems = [];
  const walkKeys = keys.filter((k) => /^(walk_|gpt_fly_)/.test(k)).sort();

  for (const key of walkKeys) {
    const spr = getSprite(key);
    if (!spr) { problems.push(`${key}: 精灵数据里没有这一格`); continue; }
    const { w, h, d } = spr;
    if (w < 8 || h < 8) { problems.push(`${key}: 格子太小 ${w}×${h}`); continue; }
    const seen = new Uint8Array(w * h);
    const components = [];
    const queue = new Int32Array(w * h);
    for (let start = 0; start < w * h; start++) {
      if (seen[start] || d[start] === T) continue;
      let head = 0, tail = 0;
      queue[tail++] = start; seen[start] = 1;
      let size = 0, minX = w, maxX = -1, minY = h, maxY = -1;
      let left = false, right = false, bottom = false;
      while (head < tail) {
        const p = queue[head++], x = p % w, y = (p / w) | 0;
        size++;
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
        if (x === 0) left = true;
        if (x === w - 1) right = true;
        if (y === h - 1) bottom = true;
        const neighbours = [x > 0 ? p - 1 : -1, x + 1 < w ? p + 1 : -1, y > 0 ? p - w : -1, y + 1 < h ? p + w : -1];
        for (const n of neighbours) {
          if (n >= 0 && !seen[n] && d[n] !== T) { seen[n] = 1; queue[tail++] = n; }
        }
      }
      components.push({ size, minX, maxX, minY, maxY, left, right, bottom });
    }
    if (!components.length) { problems.push(`${key}: 全透明`); continue; }
    components.sort((a, b) => b.size - a.size);
    const main = components[0];
    for (const c of components.slice(1)) {
      const touchesOuterEdge = c.left || c.right || c.bottom;
      const nearMargin = c.minX < w * 0.12 || c.maxX > w * 0.88 || c.maxY > h * 0.88;
      const suspicious = c.size >= minPixels && c.size <= main.size * maxMainRatio && touchesOuterEdge && nearMargin;
      if (suspicious) {
        problems.push(`${key}: 边缘有 ${c.size} px 的独立碎片（bbox ${c.minX},${c.minY}–${c.maxX},${c.maxY}），疑似邻格溢色`);
      }
    }
  }
  return { checked: walkKeys.length, problems };
}

async function loadRepo() {
  const imp = (f) => import(pathToFileURL(path.join(HERE, f)).href);
  const { T } = await imp('source/px.js');
  const { getBakedSprite } = await imp('source/sprites_data.js');
  await imp('source/walk_cycle_data.js');
  await imp('source/actions_data.js');
  const meta = JSON.parse(fs.readFileSync(path.join(REPO, '通用模板/engine/assets/cast_atlas.json'), 'utf8'));
  return { getBakedSprite, keys: Object.keys(meta.s), T };
}

export async function checkCurrentRepo() {
  const { getBakedSprite, keys, T } = await loadRepo();
  return inspectWalkSprites(getBakedSprite, keys, { transparent: T });
}

const isCli = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isCli) {
  const result = await checkCurrentRepo();
  if (result.problems.length) {
    console.error('WALK_BLEED_FAIL\n  - ' + result.problems.join('\n  - '));
    process.exit(1);
  }
  console.log(`WALK_BLEED_OK ${result.checked} walk frames · no disconnected border fragments`);
}
