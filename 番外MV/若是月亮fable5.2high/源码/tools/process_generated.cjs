// Thin project adapter for the shared deterministic post-processor.
// The old duplicate implementation wrote to public/assets/gen and could not find
// the repository's 笨鱼 source. The shared tool writes to src/assets/gen (the
// directory actually imported by the MV) and records input/output hashes.
const path = require('node:path');
const { run } = require('../../../../tools/generated_assets/process_generated.cjs');

// Five green-screen originals are archived once in the sister moon project;
// this project only mirrors the derived transparent PNGs. Keep the locked
// outputs pinned to the pre-redraw 本鲸 palette baseline so the 2026-11-24
// master rebuild does not silently recolor historical generated assets.
const rawDir = path.resolve(__dirname, '../../../若是月亮还没来/源码/gen_raw');
const paletteAtlas = path.resolve(__dirname, '../../../../docs/quality_comparison/whale_redraw/cast_atlas.before.png');

run({
  projectRoot: path.join(__dirname, '..'),
  rawDir,
  paletteAtlas,
  check: process.argv.includes('--check'),
  manifestOnly: process.argv.includes('--manifest-only'),
});
