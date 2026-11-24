// Thin project adapter for the shared deterministic post-processor.
// The old duplicate implementation wrote to public/assets/gen and could not find
// the repository's 笨鱼 source. The shared tool writes to src/assets/gen (the
// directory actually imported by the MV) and records input/output hashes.
const path = require('node:path');
const { run } = require('../../../../tools/generated_assets/process_generated.cjs');

// These five historical AI assets are hash-locked. Their blue palette gain was
// originally derived from act_whale_idle_0 in the pre-redraw master atlas, so
// pin that baseline instead of silently recoloring locked art after the
// 2026-11-24 user-authorized 本鲸 master rebuild.
const paletteAtlas = path.resolve(__dirname, '../../../../docs/quality_comparison/whale_redraw/cast_atlas.before.png');

run({
  projectRoot: path.join(__dirname, '..'),
  paletteAtlas,
  check: process.argv.includes('--check'),
  manifestOnly: process.argv.includes('--manifest-only'),
});
