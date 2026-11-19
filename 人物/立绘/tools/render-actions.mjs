// 立绘动作离线渲染：不进浏览器、不碰数据库，直接把「立绘 + 骨架动作」渲成图。
//
//   node tools/render-actions.mjs                 # 全部角色 × 招牌动作
//   node tools/render-actions.mjs whale gpt       # 只渲这两位
//   node tools/render-actions.mjs whale wave 16   # 指定动作与帧数
//
// 依赖：@napi-rs/canvas、esbuild（把 src/mv 里的 TS 直接打包，不另抄一份逻辑）
// 产物：../番外MV/立绘/预览/<角色>_<动作>.gif  ＋ ../番外MV/立绘/立绘_动作总览.jpg
import { buildSync } from "esbuild";
import { createCanvas, loadImage, GlobalFonts } from "@napi-rs/canvas";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "..", "番外MV", "立绘");
const FRAME_DIR = "/tmp/tachie_frames";

/* ------------------------------ 1. 打包 TS ------------------------------ */
const entry = path.join("/tmp", "tachie_entry.ts");
fs.writeFileSync(
  entry,
  [
    'export { drawTachie, drawEmote, buildMips, pickMip } from "' + path.join(ROOT, "src/mv/rig.ts") + '";',
    'export { ACTIONS, poseOf, basePose } from "' + path.join(ROOT, "src/mv/actions.ts") + '";',
    'export { CAST } from "' + path.join(ROOT, "src/mv/cast.ts") + '";',
  ].join("\n"),
);
const bundle = "/tmp/tachie_bundle.mjs";
buildSync({ entryPoints: [entry], bundle: true, format: "esm", outfile: bundle, logLevel: "error" });
const { drawTachie, drawEmote, buildMips, pickMip, ACTIONS, poseOf, CAST } = await import(
  pathToFileURL(bundle).href + "?v=" + Date.now()
);

/* 字体：仓库自带站酷快乐体（OFL），总览图上的角色名要用它 */
for (const f of [path.join(ROOT, "../通用模板/engine/assets/fonts/ZCOOLKuaiLe-Regular.ttf")]) {
  if (fs.existsSync(f)) { GlobalFonts.registerFromPath(f, "ZCOOL KuaiLe"); break; }
}

/* ------------------------------ 2. 构图参数 ------------------------------ */
const W = 540, H = 760;
const GY = 716;            // 脚底
const HGT = 640;           // 立绘在画面上的高度
const PX = W / 2;
const BOTTOM = "#eef1f7";
const BG_TOP = "#dfe8f6";

function mkPair(w, h) {
  const c = createCanvas(w, h);
  return { canvas: c, ctx: c.getContext("2d") };
}

function paintBg(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, BG_TOP);
  g.addColorStop(1, BOTTOM);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // 地线
  ctx.fillStyle = "rgba(20,24,52,0.10)";
  ctx.fillRect(0, GY, W, H - GY);
  ctx.strokeStyle = "rgba(20,24,52,0.16)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, GY + 1);
  ctx.lineTo(W, GY + 1);
  ctx.stroke();
}

/* ------------------------------ 3. 渲一帧 ------------------------------ */
let T = 0; // 全局时间，呼吸叠加用它

function renderFrame(ctx, img, mips, m, action, t) {
  T += 1 / 30;
  const pose = poseOf(action, t, t * 1.5, T, m.cx * 9);
  paintBg(ctx);
  // 影子
  ctx.save();
  ctx.globalAlpha = 0.26;
  ctx.fillStyle = "#101226";
  ctx.beginPath();
  ctx.ellipse(PX + pose.dx * HGT, GY + 2, HGT * 0.15 * Math.max(0.3, 1 - pose.lift * 4), HGT * 0.022, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const mip = pickMip(mips, HGT);
  const head = drawTachie(ctx, mip, m, pose, PX, GY, HGT, false);

  const emote = ACTIONS[action]?.emote;
  if (emote && emote !== "none") {
    drawEmote(ctx, emote, head.x + HGT * 0.05, head.y - HGT * 0.02, HGT * 0.075, 0);
  }
  // 角标：角色名 · 动作名（总览图里用）
  return head;
}

/* ------------------------------ 4. 出图 ------------------------------ */
const ffmpeg = (() => {
  try {
    return execFileSync("python3", ["-c", "import imageio_ffmpeg;print(imageio_ffmpeg.get_ffmpeg_exe())"], { encoding: "utf8" }).trim();
  } catch {
    return "ffmpeg";
  }
})();

function gif(frames, out, fps = 15) {
  fs.rmSync(FRAME_DIR, { recursive: true, force: true });
  fs.mkdirSync(FRAME_DIR, { recursive: true });
  frames.forEach((buf, i) => fs.writeFileSync(path.join(FRAME_DIR, `f${String(i).padStart(4, "0")}.png`), buf));
  const args = ["-y", "-i", path.join(FRAME_DIR, "f%04d.png"), "-vf", `fps=${fps},scale=360:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=3`, out];
  execFileSync(ffmpeg, args, { stdio: "ignore" });
}

const ids = Object.keys(CAST);
let pick = process.argv.slice(2).filter((a) => !/^\d+$/.test(a));
const frameArg = process.argv.slice(2).find((a) => /^\d+$/.test(a));
const NF = frameArg ? parseInt(frameArg, 10) : 15;
if (!pick.length) pick = ids;

const HAVE = new Set(fs.existsSync(path.join(ROOT, "art/tachie"))
  ? fs.readdirSync(path.join(ROOT, "art/tachie")).filter((f) => f.endsWith(".png")).map((f) => f.slice(0, -4))
  : []);
if (!HAVE.size) {
  console.error("art/tachie/ 里没有立绘：先放 <角色>.png（透明底、全身、1280 高），或跑 tools/key-tachie 抠绿幕。");
  process.exit(1);
}

fs.mkdirSync(path.join(OUT_DIR, "预览"), { recursive: true });
const sheetRows = [];

for (const id of pick) {
  if (!HAVE.has(id)) {
    console.error(`跳过 ${id}：art/tachie/${id}.png 不存在`);
    continue;
  }
  const m = CAST[id];
  const img = await loadImage(path.join(ROOT, "art/tachie", `${id}.png`));
  const meta = { ...m, w: img.width, h: img.height };
  const mips = buildMips(img, img.width, img.height, mkPair);

  const primary = m.actions[1] ?? "idle";
  const demo = [...new Set([m.actions[0] ?? "idle", primary, m.actions[2] ?? primary])];
  for (const action of demo) {
    const def = ACTIONS[action] ?? ACTIONS.idle;
    const dur = def.dur ?? 2.4;
    const frames = [];
    const c = createCanvas(W, H);
    const ctx = c.getContext("2d");
    for (let i = 0; i < NF; i++) {
      const t = def.loop ? (i / NF) * dur : (i / (NF - 1)) * def.dur;
      renderFrame(ctx, img, mips, meta, action, t);
      frames.push(await c.encode("png"));
    }
    const f = path.join(OUT_DIR, "预览", `${id}_${action}.gif`);
    gif(frames, f);
    console.log(`${m.name} · ${action} → ${path.relative(ROOT, f)}`);
  }

  // 总览：这位角色的六个动作，各取一遍里最开的那一帧
  const acts = m.actions.slice(0, 6);
  const c = createCanvas(W, H);
  const ctx = c.getContext("2d");
  const row = [];
  for (const action of acts) {
    const def = ACTIONS[action] ?? ACTIONS.idle;
    renderFrame(ctx, img, mips, meta, action, def.loop ? (def.dur ?? 2.4) * 0.55 : (def.dur ?? 2.4) * 0.85);
    row.push({ buf: await c.encode("png"), label: def.label ?? action });
  }
  sheetRows.push({ id, row });
}

/* 总览拼图 */
if (sheetRows.length) {
  const CW = 300, CH = Math.round((W / H) * CW);
  const cols = 6, rows = sheetRows.length;
  const LBL = 190;
  const sheet = createCanvas(CW * cols + LBL + 24, CH * rows + 56);
  const s = sheet.getContext("2d");
  s.fillStyle = "#12141f";
  s.fillRect(0, 0, sheet.width, sheet.height);
  s.fillStyle = "#f4f6fb";
  s.font = '26px "ZCOOL KuaiLe"';
  s.fillText("立绘动作总览（长大后的样子 · 默认不用）", 20, 36);
  for (let r = 0; r < rows; r++) {
    const { id, row } = sheetRows[r];
    for (let k = 0; k < row.length; k++) {
      const im = await loadImage(row[k].buf);
      s.drawImage(im, LBL + k * CW, 56 + r * CH, CW, CH);
      s.fillStyle = "rgba(18,20,31,0.55)";
      s.fillRect(LBL + k * CW, 56 + r * CH + CH - 26, CW, 26);
      s.fillStyle = "#f4f6fb";
      s.font = '17px "ZCOOL KuaiLe"';
      s.fillText(row[k].label, LBL + k * CW + 10, 56 + r * CH + CH - 7);
      s.fillStyle = "rgba(255,255,255,0.35)";
      s.fillRect(LBL + k * CW, 56 + r * CH, 1, CH);
    }
    s.fillStyle = "#f4f6fb";
    s.font = '24px "ZCOOL KuaiLe"';
    s.fillText(CAST[id].name, 16, 56 + r * CH + CH / 2 - 6);
    s.fillStyle = "#8f97b2";
    s.font = '14px "ZCOOL KuaiLe"';
    s.fillText(CAST[id].alias, 16, 56 + r * CH + CH / 2 + 16);
  }
  fs.writeFileSync(path.join(OUT_DIR, "立绘_动作总览.png"), sheet.encodeSync("png"));
  console.log(`总览 → 番外MV/立绘/立绘_动作总览.png`);
}
