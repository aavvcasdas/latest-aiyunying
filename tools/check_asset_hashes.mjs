#!/usr/bin/env node
// Hash-verified asset source of truth. Run `node tools/check_asset_hashes.mjs --write`
// after an intentional asset rebuild, then commit the regenerated manifest.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST = path.join(ROOT, 'assets.manifest.json');
const MASTER = '通用模板/engine/assets/cast_atlas.png';

// Mirrors must be byte-identical to the master atlas. Variants are deliberately
// repacked atlases with their own recorded hash. Generated assets are checked by
// tools/generated_assets/validate_generated.py.
const SPEC = [
  { path: MASTER, role: 'canonical-atlas', source: MASTER },
  { path: '通用模板/engine/assets/cast_atlas.json', role: 'canonical-rects' },
  { path: '通用模板/engine/assets/cast_actions.json', role: 'canonical-actions' },
  { path: '通用模板/engine/assets/tachie_anchors.json', role: 'canonical-rig-anchors' },
  { path: '人物/atlas.png', role: 'atlas-mirror', source: MASTER },
  { path: '人物/index.json', role: 'derived-index' },
  { path: '人物/生成/满月篇/assets.manifest.json', role: 'generated-asset-manifest' },
  { path: '番外MV/若是月亮还没来/源码/src/assets/gen/manifest.json', role: 'generated-postprocess-manifest' },
  { path: '番外MV/若是月亮fable5.2high/源码/src/assets/gen/manifest.json', role: 'generated-postprocess-manifest' },
  { path: '番外MV/不小心惹了上帝/源码/src/assets/cast_atlas.png', role: 'atlas-mirror', source: MASTER },
  { path: '番外MV/告白气球_opus5.5_笨鱼发/src/assets/atlas.png', role: 'atlas-mirror', source: MASTER },
  { path: '番外MV/情歌_opus5.5max/源码/src/assets/atlas.png', role: 'atlas-mirror', source: MASTER },
  { path: '番外MV/情歌_opus5.5max-gpt6max开头/源码/src/assets/atlas.png', role: 'atlas-mirror', source: MASTER },
  { path: '番外MV/若是月亮fable5.2high/源码/src/assets/atlas.png', role: 'atlas-mirror', source: MASTER },
  { path: '番外MV/若是月亮还没来/源码/src/assets/atlas.png', role: 'atlas-mirror', source: MASTER },
  { path: '番外MV/譬如我/src/assets/atlas.png', role: 'atlas-mirror', source: MASTER },
  { path: '番外MV/超级棒棒糖_童年治愈3D/源码/public/mv/atlas.png', role: 'atlas-mirror', source: MASTER },
  { path: '番外MV/把回忆拼好_opus5.5max/源码/src/mv/assets/atlas.png', role: 'repacked-atlas-variant', note: '1024×1922 repack for the opus engine' },
  { path: '通用模板/engine/assets/fonts/ZCOOLKuaiLe-Regular.ttf', role: 'canonical-font' },
  { path: '人物/立绘/public/fonts/ZCOOLKuaiLe-Regular.ttf', role: 'font-mirror', source: '通用模板/engine/assets/fonts/ZCOOLKuaiLe-Regular.ttf' },
  { path: '人物/立绘/public/audio/goujiqishi.mp3', role: 'audio-copy', source: '《勾指起誓》.mp3' },
  { path: '《勾指起誓》.mp3', role: 'canonical-audio' },
  { path: '人物/立绘/art/tachie/metrics.json', role: 'standing-art-metrics' },
  { path: 'tools/render_defaults.json', role: 'render-quality-defaults' },
  { path: 'requirements.txt', role: 'python-bootstrap' },
  { path: '.github/workflows/ci.yml', role: 'ci-workflow' },
  ...['whale', 'gpt', 'claude', 'doubao', 'gemini', 'kimi', 'qwen', 'zai'].flatMap((id) => [
    { path: `人物/立绘/art/tachie/${id}.png`, role: 'canonical-tachie' },
    { path: `人物/立绘/public/tachie/${id}.png`, role: 'tachie-mirror', source: `人物/立绘/art/tachie/${id}.png` },
  ]),
];

const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const stat = (entry) => {
  const abs = path.join(ROOT, entry.path);
  if (!fs.existsSync(abs)) throw new Error(`缺文件：${entry.path}`);
  const bytes = fs.statSync(abs).size;
  return { ...entry, sha256: sha256(abs), bytes };
};

const write = process.argv.includes('--write');
if (write) {
  const manifest = {
    schema: 1,
    generatedBy: 'tools/check_asset_hashes.mjs --write',
    note: 'Commit this file after an intentional asset rebuild. Mirrors must match their source hash.',
    files: SPEC.map(stat),
  };
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`ASSET_MANIFEST_OK ${manifest.files.length} files → ${path.relative(ROOT, MANIFEST)}`);
  process.exit(0);
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const byPath = new Map(manifest.files.map((f) => [f.path, f]));
const problems = [];
for (const expected of manifest.files) {
  const abs = path.join(ROOT, expected.path);
  if (!fs.existsSync(abs)) { problems.push(`${expected.path}: 文件不存在`); continue; }
  const actual = stat({ path: expected.path });
  if (actual.sha256 !== expected.sha256) problems.push(`${expected.path}: SHA256 不一致`);
  if (actual.bytes !== expected.bytes) problems.push(`${expected.path}: 字节数不一致`);
  if (expected.source && byPath.has(expected.source)) {
    const source = byPath.get(expected.source);
    if (actual.sha256 !== source.sha256) problems.push(`${expected.path}: 与 ${expected.source} 不是同一份`);
  }
}
for (const entry of SPEC) if (!byPath.has(entry.path)) problems.push(`${entry.path}: 清单里没有这一项`);
if (problems.length) {
  console.error('ASSET_HASH_FAIL\n  - ' + [...new Set(problems)].join('\n  - '));
  process.exit(1);
}
console.log(`ASSET_HASH_OK ${manifest.files.length} files · master ${manifest.files[0].sha256.slice(0, 12)}`);
