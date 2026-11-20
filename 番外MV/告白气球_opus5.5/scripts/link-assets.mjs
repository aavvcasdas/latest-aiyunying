#!/usr/bin/env node
// 构建 / 预览之前：从仓库根把图集与音轨取进 src/assets/。
// 这两个文件不入库（见 .gitignore），免得同一份素材在仓库里有两个来源。
// 规矩：缺素材直接报错，不拿别的东西顶替。
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assets = path.join(app, "src", "assets");
// atlasData.ts 的坐标是照这张图生成的；母版重排后要重跑 tools/gen_atlas_ts.py 并更新这里
const ATLAS_SHA = "5f9894b6ad38";
const NEED = [
  { from: "人物/atlas.png", to: "atlas.png", sha: ATLAS_SHA },
  { from: "告白气球-周二珂.mp3", to: "bgm.mp3" },
];

function findUp(rel) {
  let dir = app;
  for (let i = 0; i < 8; i++) {
    const p = path.join(dir, rel);
    if (fs.existsSync(p)) return p;
    const up = path.dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return null;
}
const sha = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");

fs.mkdirSync(assets, { recursive: true });
for (const n of NEED) {
  const dst = path.join(assets, n.to);
  if (!fs.existsSync(dst)) {
    const src = findUp(n.from);
    if (!src) {
      console.error(`缺素材：从 ${app} 往上找不到「${n.from}」。请把它放到 ${dst}`);
      process.exit(1);
    }
    fs.copyFileSync(src, dst);
    console.log(`取素材 ${path.relative(app, src)} -> src/assets/${n.to}`);
  }
  if (n.sha && !sha(dst).startsWith(n.sha)) {
    console.error(`src/assets/${n.to} 不是坐标表对应的那张图集（sha256 应以 ${n.sha} 开头）。\n母版重排过的话：重跑仓库根 tools/gen_atlas_ts.py，覆盖 src/mv/atlasData.ts，再更新本脚本里的 ATLAS_SHA。`);
    process.exit(1);
  }
}
