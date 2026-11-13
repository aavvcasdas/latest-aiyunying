#!/usr/bin/env node
// Run from the target repository. Assets are resolved next to this installer.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = process.cwd();
const template = path.join(root, '通用模板');
const sourceFile = path.join(here, 'motion-v2.json');
const metaFile = path.join(template, 'engine/assets/cast_atlas.json');
const actorFile = path.join(template, 'engine/actors.ts');
const bakeFile = path.join(template, 'cast/bake_atlas.mjs');
const pngFile = path.join(template, 'engine/assets/cast_atlas.png');
const dataFile = path.join(template, 'cast/source/motion-v2.json');
const testFile = path.join(template, 'tests/cast.test.mjs');
const backup = path.join(root, '.motion-v2-backup');
const targets = [actorFile, bakeFile, metaFile, pngFile, dataFile, testFile];

function restore() {
  const stateFile = path.join(backup, 'state.json');
  if (!fs.existsSync(stateFile)) throw new Error('No motion-v2 backup found.');
  const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  for (const item of state) {
    const target = path.join(root, item.path);
    if (item.existed) fs.copyFileSync(path.join(backup, item.index), target);
    else fs.rmSync(target, { force: true });
  }
  fs.rmSync(backup, { recursive: true });
  console.log('Restored the exact files saved before installation.');
}

if (process.argv.includes('--rollback')) {
  restore();
  process.exit(0);
}
if (!fs.existsSync(metaFile) || !fs.existsSync(actorFile)) throw new Error('Run from the latest-aiyunying repository root.');
if (!fs.existsSync(sourceFile)) throw new Error('Extract the COMPLETE download; motion-v2.json is required.');
if (fs.existsSync(backup)) throw new Error('Backup already exists. Roll back before installing again.');
const patchFile = path.join(here, 'motion-v2.patch');
execFileSync('git', ['apply', '--check', patchFile], { cwd: root, stdio: 'inherit' });
const cells = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));
if (Object.keys(cells).length !== 2592) throw new Error('Expected 108 complete, 24-frame sequences.');
for (const [key, [w, h, encoded]] of Object.entries(cells)) {
  const pixels = zlib.inflateSync(Buffer.from(encoded, 'base64'));
  if (!Number.isInteger(w) || !Number.isInteger(h) || w < 1 || h < 1 || w > 128 || h > 128 || pixels.length !== w * h * 4) throw new Error(`Invalid motion cell: ${key}`);
}
fs.mkdirSync(backup);
const state = targets.map((file, i) => {
  const existed = fs.existsSync(file);
  if (existed) fs.copyFileSync(file, path.join(backup, String(i)));
  return { path: path.relative(root, file), index: String(i), existed };
});
fs.writeFileSync(path.join(backup, 'state.json'), JSON.stringify(state, null, 2));

try {
  execFileSync('git', ['apply', patchFile], { cwd: root, stdio: 'inherit' });
  const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
  const width = 4096;
  const startY = meta.h + 2;
  const positions = new Map();
  let unique = 0;
  let x = 2, y = startY, rowHeight = 0;
  for (const [key, [w, h, data]] of Object.entries(cells)) {
    const hash = crypto.createHash('sha256').update(`${w}:${h}:${data}`).digest('hex');
    let rect = positions.get(hash);
    if (!rect) {
      if (x + w + 2 > width) { x = 2; y += rowHeight + 2; rowHeight = 0; }
      rect = [x, y, w, h];
      positions.set(hash, rect);
      x += w + 2;
      rowHeight = Math.max(rowHeight, h);
      unique++;
    }
    meta.s[key] = rect;
  }
  meta.w = width;
  meta.h = y + rowHeight + 2;
  if (meta.h > 8192) throw new Error('Atlas exceeds the 8192px compatibility budget.');
  fs.copyFileSync(sourceFile, dataFile);
  fs.writeFileSync(metaFile, JSON.stringify(meta));
  execFileSync(process.execPath, [path.join(template, 'cast/bake_atlas.mjs')], { cwd: root, stdio: 'inherit' });
  execFileSync(process.execPath, [path.join(template, 'cast/bake_atlas.mjs'), '--check'], { cwd: root, stdio: 'inherit' });
  console.log(`Installed 108 motions / 2592 frames (${unique} unique cells).`);
  console.log('Use actor.motion("idle", T) or actor.motion("offer_rice", T).');
  console.log('Legacy animations remain unchanged. See the replacement guide before rerendering.');
} catch (error) {
  console.error('Installation failed. Restoring the original files.');
  restore();
  throw error;
}