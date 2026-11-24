// Standing-art anchor / transparency check.
//
// The eight checked-in art/tachie/*.png files are already transparent. The old
// green-screen keyer assumed a green background and would destroy them. This tool
// is check-only by default: it verifies dimensions/alpha against the shared anchor
// manifest and refreshes art/tachie/metrics.json. It never generates new art.
//
//   node tools/key-tachie.mjs            # 默认检查，不写图片
//   node tools/key-tachie.mjs --check    # 同上
//   node tools/key-tachie.mjs --write    # 只更新 metrics.json
import pngjs from "pngjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import anchorsJson from "../../../通用模板/engine/assets/tachie_anchors.json" with { type: "json" };

const { PNG } = pngjs;
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "art/tachie");
const IDS = Object.keys(anchorsJson.anchors);
const write = process.argv.includes("--write");
const metricsPath = path.join(OUT, "metrics.json");

const problems = [];
const cornerAlphas = {};
for (const id of IDS) {
  const a = anchorsJson.anchors[id];
  const file = path.join(OUT, `${id}.png`);
  if (!fs.existsSync(file)) { problems.push(`${id}: 缺 ${path.relative(ROOT, file)}`); continue; }
  const png = PNG.sync.read(fs.readFileSync(file));
  const alphaAt = (x, y) => png.data[(y * png.width + x) * 4 + 3];
  const cornerAlpha = [
    alphaAt(0, 0),
    alphaAt(png.width - 1, 0),
    alphaAt(0, png.height - 1),
    alphaAt(png.width - 1, png.height - 1),
  ];
  cornerAlphas[id] = cornerAlpha;
  if (png.width !== a.w || png.height !== a.h) problems.push(`${id}: 尺寸 ${png.width}×${png.height}，锚点表 ${a.w}×${a.h}`);
  if (!cornerAlpha.every((v) => v === 0)) problems.push(`${id}: 四角不是全透明，不能喂给横带骨架`);
  console.log(`${id}: ${png.width}×${png.height} · neck ${a.neck} · cx ${a.cx} · hx ${a.hx} · alpha ${cornerAlpha.join("/")}`);
}

const metrics = {
  schema: 1,
  generatedBy: "tools/key-tachie.mjs",
  layerStatus: anchorsJson.layerStatus,
  note: anchorsJson.note,
  anchors: Object.fromEntries(IDS.map((id) => [id, { ...anchorsJson.anchors[id], alphaCorners: cornerAlphas[id] }])),
};
if (write) {
  fs.writeFileSync(metricsPath, JSON.stringify(metrics, null, 2) + "\n");
  console.log(`WROTE ${path.relative(ROOT, metricsPath)}`);
} else {
  console.log("CHECK_ONLY 没有写图片；加 --write 只更新 metrics.json");
}
if (problems.length) {
  console.error("TACHIE_CHECK_FAIL\n  - " + problems.join("\n  - "));
  process.exit(1);
}
console.log(`TACHIE_CHECK_OK ${IDS.length} transparent standing-art files · single-layer`);
