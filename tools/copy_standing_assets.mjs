#!/usr/bin/env node
// Byte-identical mirrors for the standalone standing-art app. No image is regenerated:
// the existing transparent art/tachie PNGs, the OFL font and the song are copied as-is.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IDS = ['whale', 'gpt', 'claude', 'gemini', 'kimi', 'doubao', 'qwen', 'zai'];
const PAIRS = [
  ...IDS.map((id) => [`人物/立绘/art/tachie/${id}.png`, `人物/立绘/public/tachie/${id}.png`]),
  ['通用模板/engine/assets/fonts/ZCOOLKuaiLe-Regular.ttf', '人物/立绘/public/fonts/ZCOOLKuaiLe-Regular.ttf'],
  ['《勾指起誓》.mp3', '人物/立绘/public/audio/goujiqishi.mp3'],
];
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const copy = (src, dst) => {
  const from = path.join(ROOT, src), to = path.join(ROOT, dst);
  if (!fs.existsSync(from)) throw new Error(`缺源文件：${src}`);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  if (!fs.existsSync(to) || sha(from) !== sha(to)) fs.copyFileSync(from, to);
  if (sha(from) !== sha(to)) throw new Error(`复制后哈希不一致：${dst}`);
  console.log(`OK ${dst}`);
};
for (const [src, dst] of PAIRS) copy(src, dst);
console.log(`STANDING_ASSETS_OK ${PAIRS.length} byte-identical copies`);
