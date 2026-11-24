// Shared deterministic post-processor for AI-generated green-screen character assets.
// The two moon MV projects delegate here instead of maintaining two copies.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { createRequire } = require('node:module');

const REPO = path.resolve(__dirname, '../..');

function load(projectRoot, name) {
  const projectRequire = createRequire(path.join(projectRoot, 'package.json'));
  try { return projectRequire(name); } catch { return require(name); }
}

function sha256(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function run(options = {}) {
  const projectRoot = path.resolve(options.projectRoot || process.cwd());
  const rawDir = path.resolve(projectRoot, options.rawDir || 'gen_raw');
  const outDir = path.resolve(projectRoot, options.outDir || 'src/assets/gen');
  // Historical AI assets may pin a recorded pre-redraw baseline via options.paletteAtlas;
  // otherwise the blue gain follows the current master atlas mirror.
  const paletteAtlas = path.resolve(options.paletteAtlas || path.join(REPO, '人物/atlas.png'));
  const paletteIndex = path.resolve(options.paletteIndex || path.join(REPO, '人物/index.json'));
  const benyuSource = path.resolve(options.benyuSource || path.join(REPO, '人物/q版/笨鱼.png'));
  const check = Boolean(options.check);
  const manifestOnly = Boolean(options.manifestOnly);
  const problems = [];
  const { PNG } = load(projectRoot, 'pngjs');
  const jpeg = load(projectRoot, 'jpeg-js');

  // Check / manifest-only modes must not overwrite existing character art.
  if (!check && !manifestOnly) fs.mkdirSync(outDir, { recursive: true });

  function decode(file) {
    const buf = fs.readFileSync(file);
    if (buf[0] === 0x89 && buf[1] === 0x50) {
      const png = PNG.sync.read(buf);
      return { w: png.width, h: png.height, data: png.data };
    }
    const img = jpeg.decode(buf, { useTArray: true, formatAsRGBA: true });
    return { w: img.width, h: img.height, data: img.data };
  }

  const smooth = (a, b, x) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };

  function chromaKey(img, aggressive) {
    const { w, h, data } = img;
    const out = new Float32Array(w * h * 4);
    for (let i = 0; i < w * h; i++) {
      let r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
      const d = Math.sqrt(r * r + (255 - g) * (255 - g) + b * b);
      const a = smooth(45, 115, d);
      const mx = Math.max(r, b);
      if (aggressive) { if (g > mx) g = mx + (g - mx) * 0.15; }
      else if (g - mx > 110) g = mx + 10;
      out[i * 4] = r; out[i * 4 + 1] = g; out[i * 4 + 2] = b; out[i * 4 + 3] = a;
    }
    return { w, h, px: out };
  }

  function bbox(k, x0 = 0, x1 = k.w) {
    let minX = 1e9, minY = 1e9, maxX = -1, maxY = -1;
    for (let y = 0; y < k.h; y++) for (let x = x0; x < x1; x++) {
      if (k.px[(y * k.w + x) * 4 + 3] > 0.5) {
        if (x < minX) minX = x; if (x > maxX) maxX = x;
        if (y < minY) minY = y; if (y > maxY) maxY = y;
      }
    }
    if (maxX < minX || maxY < minY) throw new Error('抠图后找不到不透明像素');
    return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
  }

  function splitColumns(k, minGap = 12) {
    const cols = new Array(k.w).fill(0);
    for (let x = 0; x < k.w; x++) for (let y = 0; y < k.h; y++) {
      if (k.px[(y * k.w + x) * 4 + 3] > 0.5) cols[x]++;
    }
    const parts = []; let start = -1, gap = 0;
    for (let x = 0; x < k.w; x++) {
      if (cols[x] > 2) { if (start < 0) start = x; gap = 0; }
      else if (start >= 0) { gap++; if (gap >= minGap) { parts.push([start, x - gap + 1]); start = -1; gap = 0; } }
    }
    if (start >= 0) parts.push([start, k.w]);
    return parts.filter(([a, b]) => b - a > 40);
  }

  function resample(k, box, outH, pad = 1) {
    const scale = box.h / outH;
    const outW = Math.max(1, Math.round(box.w / scale));
    const W = outW + pad * 2, H = outH + pad * 2;
    const png = new PNG({ width: W, height: H });
    png.data.fill(0);
    for (let oy = 0; oy < outH; oy++) for (let ox = 0; ox < outW; ox++) {
      const sx0 = box.x + ox * scale, sx1 = box.x + (ox + 1) * scale;
      const sy0 = box.y + oy * scale, sy1 = box.y + (oy + 1) * scale;
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let sy = Math.floor(sy0); sy < Math.ceil(sy1); sy++) for (let sx = Math.floor(sx0); sx < Math.ceil(sx1); sx++) {
        if (sx < 0 || sy < 0 || sx >= k.w || sy >= k.h) continue;
        const j = (sy * k.w + sx) * 4, al = k.px[j + 3];
        r += k.px[j] * al; g += k.px[j + 1] * al; b += k.px[j + 2] * al; a += al; n++;
      }
      const cov = n ? a / n : 0;
      const o = ((oy + pad) * W + (ox + pad)) * 4;
      if (cov >= 0.5 && a > 0) {
        png.data[o] = Math.round(r / a); png.data[o + 1] = Math.round(g / a); png.data[o + 2] = Math.round(b / a); png.data[o + 3] = 255;
      }
    }
    return png;
  }

  const outputs = [];
  function save(png, name) {
    const file = path.join(outDir, name);
    const bytes = PNG.sync.write(png);
    const sha = crypto.createHash('sha256').update(bytes).digest('hex');
    const record = { name, w: png.width, h: png.height, bytes: bytes.length, sha256: sha };
    if (check || manifestOnly) {
      if (!fs.existsSync(file)) problems.push(`${name}: 缺派生文件`);
      else if (sha256(file) !== sha) problems.push(`${name}: 现有文件与确定性后处理结果不一致`);
      else console.log(`OK ${path.relative(REPO, file)}  ${png.width}x${png.height}`);
    } else {
      fs.writeFileSync(file, bytes);
      console.log(`${file}  ${png.width}x${png.height}`);
    }
    outputs.push(record);
    return png;
  }

  const idx = JSON.parse(fs.readFileSync(paletteIndex, 'utf8'));
  const atlasPng = PNG.sync.read(fs.readFileSync(paletteAtlas));
  function blueMean(get, n) {
    let r = 0, g = 0, b = 0, c = 0;
    for (let i = 0; i < n; i++) {
      const [R, G, B, A] = get(i);
      if (A > 128 && B > R + 25 && B > G) { r += R; g += G; b += B; c++; }
    }
    return c ? [r / c, g / c, b / c] : null;
  }
  const [fx, fy, fw, fh] = idx.sheets['q版/whale.png'].frames.find((f) => f.name === 'act_whale_idle_0').atlas;
  const refBlue = blueMean((i) => {
    const x = fx + (i % fw), y = fy + Math.floor(i / fw), o = (y * atlasPng.width + x) * 4;
    return atlasPng.data.slice(o, o + 4);
  }, fw * fh);
  function matchPalette(png) {
    const mean = blueMean((i) => png.data.slice(i * 4, i * 4 + 4), png.width * png.height);
    if (!refBlue || !mean) { console.log('palette gain skipped: no blue reference pixels'); return png; }
    const gain = mean.map((v, c) => Math.min(1.15, Math.max(0.6, refBlue[c] / Math.max(1, v))));
    for (let i = 0; i < png.width * png.height; i++) {
      const o = i * 4, R = png.data[o], G = png.data[o + 1], B = png.data[o + 2];
      if (png.data[o + 3] && B > R + 25 && B > G) {
        for (let c = 0; c < 3; c++) png.data[o + c] = Math.min(255, Math.round(png.data[o + c] * gain[c]));
      }
    }
    console.log('palette gain', gain.map((v) => v.toFixed(2)).join(','));
    return png;
  }

  const inputs = [];
  const raw = (name) => {
    const file = path.join(rawDir, name);
    inputs.push({ name, sha256: sha256(file), bytes: fs.statSync(file).size });
    return decode(file);
  };

  for (const [src, name] of [
    ['whale_sit_lookup.png', 'whale_lookup'],
    ['whale_hug_benyu.png', 'whale_hug_benyu'],
    ['whale_hold_camellia.png', 'whale_hold_camellia'],
  ]) {
    const k = chromaKey(raw(src), true);
    save(matchPalette(resample(k, bbox(k), 96)), `${name}.png`);
  }
  {
    const k = chromaKey(raw('prop_streetlamp.png'), true);
    save(resample(k, bbox(k), 160), 'streetlamp.png');
  }
  {
    const k = chromaKey(raw('prop_camellia_stages.png'), false);
    const parts = splitColumns(k);
    if (parts.length < 3) throw new Error(`山茶花只切出 ${parts.length} 段，期望 3 段`);
    console.log('camellia parts:', parts.slice(0, 3));
    const names = ['camellia_bud', 'camellia_half', 'camellia_bloom'];
    parts.slice(0, 3).forEach(([a, b], i) => {
      const box = bbox(k, a, b);
      save(resample(k, box, 28), `${names[i]}.png`);
      save(resample(k, box, 96), `${names[i]}_hd.png`);
    });
  }
  {
    inputs.push({ name: '人物/q版/笨鱼.png', sha256: sha256(benyuSource), bytes: fs.statSync(benyuSource).size });
    const img = PNG.sync.read(fs.readFileSync(benyuSource));
    const k = { w: img.width, h: img.height, px: Float32Array.from(img.data, (v, i) => (i % 4 === 3 ? v / 255 : v)) };
    save(resample(k, bbox(k), 44), 'benyu_px.png');
  }

  const manifest = {
    schema: 1,
    generatedBy: 'tools/generated_assets/process_generated.cjs',
    provenance: 'legacy_unknown: model/version/seed were not recorded when these five images were generated',
    projectRoot: path.relative(REPO, projectRoot),
    inputs,
    outputs,
  };
  const manifestFile = path.join(outDir, 'manifest.json');
  const manifestText = JSON.stringify(manifest, null, 2) + '\n';
  if (check) {
    if (!fs.existsSync(manifestFile)) problems.push('manifest.json: 缺后处理清单');
    else if (fs.readFileSync(manifestFile, 'utf8') !== manifestText) problems.push('manifest.json: 与确定性后处理结果不一致');
    if (problems.length) {
      console.error('GENERATED_POSTPROCESS_FAIL\n  - ' + problems.join('\n  - '));
      throw new Error(`generated postprocess check failed for ${path.relative(REPO, projectRoot)}`);
    }
    console.log(`GENERATED_POSTPROCESS_OK ${outputs.length} outputs · ${inputs.length} inputs · ${path.relative(REPO, projectRoot)}`);
  } else if (manifestOnly) {
    if (problems.length) {
      console.error('GENERATED_POSTPROCESS_MANIFEST_FAIL\n  - ' + problems.join('\n  - '));
      throw new Error(`cannot write manifest: derived files do not match for ${path.relative(REPO, projectRoot)}`);
    }
    fs.writeFileSync(manifestFile, manifestText);
    console.log(`GENERATED_POSTPROCESS_MANIFEST_OK ${path.relative(REPO, manifestFile)}`);
  } else {
    fs.writeFileSync(manifestFile, manifestText);
  }
  return manifest;
}

module.exports = { run };

if (require.main === module) run({ projectRoot: process.cwd(), check: process.argv.includes('--check'), manifestOnly: process.argv.includes('--manifest-only') });
