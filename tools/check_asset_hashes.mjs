#!/usr/bin/env node
// Updateable asset version records, NOT a ban on new/generated artwork. Run `node tools/check_asset_hashes.mjs --write`
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

// Discover additive characters from the registry instead of fixing the whitelist
// to eight historical ids. Paths use the same base as key-tachie.mjs.
const anchors=JSON.parse(fs.readFileSync(path.join(ROOT,'通用模板/engine/assets/tachie_anchors.json'),'utf8')).anchors;
for(const a of Object.values(anchors)) for(const file of [a.base,...Object.values(a.layers??{})].filter(Boolean)) {
  const relative=path.relative(ROOT,path.resolve(ROOT,'人物/立绘',file)).split(path.sep).join('/');
  if(relative.startsWith('../')) throw new Error('Asset path must stay inside repository: '+file);
  if(!SPEC.some(e=>e.path===relative)) SPEC.push({path:relative,role:'registered-tachie-layer'});
}

for(const a of Object.values(anchors)) if(a.rig){
  const bindFile=path.resolve(ROOT,'通用模板/engine/assets',a.rig);
  const relative=path.relative(ROOT,bindFile).split(path.sep).join('/');
  if(relative.startsWith('../'))throw new Error('Rig outside repository');
  SPEC.push({path:relative,role:'rigid-bind'});
  const bind=JSON.parse(fs.readFileSync(bindFile,'utf8'));
  for(const file of Object.values(bind.files)){
    const full=path.resolve(path.dirname(bindFile),file),p=path.relative(ROOT,full).split(path.sep).join('/');
    if(p.startsWith('../'))throw new Error('Rig artwork outside repository');
    if(!SPEC.some(e=>e.path===p))SPEC.push({path:p,role:'rigid-link-artwork'});
  }
}

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
    note: 'Updateable version record. New generated assets and intentional replacements are allowed; default check reports hash drift without blocking. --strict audits recorded versions. Missing files and inconsistent live mirrors still fail.',
    files: SPEC.map(stat),
  };
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`ASSET_MANIFEST_OK ${manifest.files.length} files → ${path.relative(ROOT, MANIFEST)}`);
  process.exit(0);
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const byPath = new Map(manifest.files.map((f) => [f.path, f]));
const problems = [], drift = [];
const strict=process.argv.includes('--strict');
for (const expected of manifest.files) {
  const abs = path.join(ROOT, expected.path);
  if (!fs.existsSync(abs)) { problems.push(`${expected.path}: 文件不存在`); continue; }
  const actual = stat({ path: expected.path });
  if (actual.sha256 !== expected.sha256) drift.push(`${expected.path}: SHA256 已更新`);
  if (actual.bytes !== expected.bytes) drift.push(`${expected.path}: 字节数已更新`);
  if (expected.source && byPath.has(expected.source)) {
    const sourcePath=path.join(ROOT,expected.source);
    if(!fs.existsSync(sourcePath)){problems.push(`${expected.source}: 文件不存在`);continue;}
    const source = stat({path:expected.source});
    if (actual.sha256 !== source.sha256) problems.push(`${expected.path}: 与 ${expected.source} 不是同一份`);
  }
}
for (const entry of SPEC) if (!byPath.has(entry.path)) {
  if(!fs.existsSync(path.join(ROOT,entry.path))) problems.push(`${entry.path}: 文件不存在`);
  else drift.push(`${entry.path}: 新增注册素材，尚未记录版本`);
}
if(drift.length){
  console.warn('ASSET_VERSION_CHANGED（允许有意更新；运行 npm run assets:write 刷新记录）\n  - '+drift.join('\n  - '));
  if(strict)problems.push(...drift);
}
if (problems.length) {
  console.error('ASSET_HASH_FAIL\n  - ' + [...new Set(problems)].join('\n  - '));
  process.exit(1);
}
console.log(`ASSET_HASH_OK ${manifest.files.length} recorded files · current master ${sha256(path.join(ROOT,MASTER)).slice(0,12)}`);
