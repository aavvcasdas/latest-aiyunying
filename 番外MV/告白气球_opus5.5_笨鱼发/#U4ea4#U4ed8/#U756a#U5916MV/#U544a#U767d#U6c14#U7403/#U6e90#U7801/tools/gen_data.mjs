// 用法（仓库根目录）：node 番外MV/告白气球/源码/tools/gen_data.mjs <周二珂告白气球.krc 解密后的文本>
// 产出 lyricsData.ts / glyphs.json / atlasData.ts；偏移 OFF 为与 mp3 起音曲线互相关实测的 -50 毫秒
import fs from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const opentype = require("opentype.js");
const OFF = -50; // 实测偏移
const USER = `塞纳河畔 左岸的咖啡|我手一杯 品尝你的美|留下唇印的嘴|花店玫瑰 名字写错谁|告白气球 风吹到对街|微笑在天上飞|你说你有点难追 想让我知难而退|礼物不需挑最贵 只要香榭的落叶|喔 营造浪漫的约会|不害怕搞砸一切|拥有你就拥有 全世界|亲爱的 爱上你 从那天起|甜蜜的很轻易|亲爱的 别任性 你的眼睛|在说我愿意`.split("|");
const BRIDGE = `亲爱的 爱上你 恋爱日记|飘香水的回忆|一整瓶 的梦境 全都有你|搅拌在一起|亲爱的 别任性 你的眼睛|在说我愿意`.split("|");
const order = [...USER.slice(0, 11).map((t, i) => ["A" + (i + 1), t]), ...USER.slice(11).map((t, i) => ["B" + (i + 1), t]), ...USER.slice(0, 11).map((t, i) => ["C" + (i + 1), t]), ...USER.slice(11).map((t, i) => ["D" + (i + 1), t]), ...BRIDGE.map((t, i) => ["E" + (i + 1), t])];
const krc = fs.readFileSync((process.argv[2] ?? "song.krc"), "utf8").split(/\r?\n/).filter((l) => /^\[\d+,\d+\]/.test(l));
if (krc.length !== order.length) throw new Error("line count " + krc.length + " vs " + order.length);
const r2 = (v) => Math.round(v * 100) / 100;
const LINES = krc.map((l, k) => {
  const [, ls] = l.match(/^\[(\d+),(\d+)\]/); const ts = [], du = []; let sung = "";
  for (const m of l.matchAll(/<(\d+),(\d+),\d+>([^<]*)/g)) { const ch = m[3].replace(/\s/g, ""); if (!ch) continue; ts.push((+ls + +m[1] + OFF) / 1000); du.push(+m[2] / 1000); sung += ch; }
  const [id, txt] = order[k]; const text = txt.replace(/\s/g, "");
  if (text.length !== ts.length) throw new Error(`${id} len ${text} vs ${sung}`);
  if (text !== sung) console.log(`  显示以用户歌词为准 ${id}: 唱本「${sung}」→「${text}」`);
  const ph = txt.split(" ").map((p) => p.length);
  return { id, text, ph, s: r2(ts[0] - 0.02), e: r2(ts[ts.length - 1] + Math.min(du[du.length - 1], 1.6)), sec: id[0], t: ts.map(r2) };
});
fs.writeFileSync("番外MV/告白气球/源码/src/mv/lyricsData.ts", "// 由酷狗 KRC 逐字时间轴（周二珂《告白气球》213 秒版）生成，整体校正 -50 毫秒（与 mp3 起音曲线互相关实测）。不手改。\n// ph = 词组长度（歌词里的空格），t = 每个字的起音（秒）\nexport interface LineT { id: string; text: string; ph: number[]; s: number; e: number; sec: string; t: number[] }\nexport const LINES: LineT[] = " + JSON.stringify(LINES) + ";\n");
for (const l of LINES) console.log(l.id.padEnd(4), String(l.s).padStart(7), String(l.e).padStart(7), l.text);
// ── 三维字形 ──
const fb = fs.readFileSync("通用模板/engine/assets/fonts/ZCOOLKuaiLe-Regular.ttf"); const font = opentype.parse(fb.buffer.slice(fb.byteOffset, fb.byteOffset + fb.byteLength));
const EXTRA = "告白气球周二珂";
const chars = [...new Set([...LINES.map((l) => l.text).join("") + EXTRA])];
const sc = 1000 / font.unitsPerEm; const R = (v) => Math.round(v * sc);
const glyphs = {}; const missing = [];
for (const ch of chars) {
  const g = font.charToGlyph(ch); if (!g || g.index === 0) { missing.push(ch); continue; }
  let o = ""; for (const c of g.path.commands) {
    if (c.type === "M") o += `m ${R(c.x)} ${R(c.y)} `; else if (c.type === "L") o += `l ${R(c.x)} ${R(c.y)} `;
    else if (c.type === "Q") o += `q ${R(c.x)} ${R(c.y)} ${R(c.x1)} ${R(c.y1)} `; else if (c.type === "C") o += `b ${R(c.x)} ${R(c.y)} ${R(c.x1)} ${R(c.y1)} ${R(c.x2)} ${R(c.y2)} `;
  }
  const bb = g.getBoundingBox(); glyphs[ch] = { ha: R(g.advanceWidth), x_min: R(bb.x1), x_max: R(bb.x2), o: o.trim() };
}
if (missing.length) throw new Error("字体缺字 " + missing.join(""));
const tf = { glyphs, familyName: "ZCOOL KuaiLe", ascender: R(font.ascender), descender: R(font.descender), underlinePosition: R(font.tables.post.underlinePosition), underlineThickness: R(font.tables.post.underlineThickness), boundingBox: { yMin: R(font.tables.head.yMin), xMin: R(font.tables.head.xMin), yMax: R(font.tables.head.yMax), xMax: R(font.tables.head.xMax) }, resolution: 1000, original_font_information: { license: "SIL Open Font License 1.1", source: "通用模板/engine/assets/fonts/ZCOOLKuaiLe-Regular.ttf" } };
fs.writeFileSync("番外MV/告白气球/源码/src/assets/glyphs.json", JSON.stringify(tf));
console.log("glyphs", chars.length, "unitsPerEm", font.unitsPerEm, "sample 我", JSON.stringify(glyphs["我"]).slice(0, 90));
// ── 图集 ──
const atlas = JSON.parse(fs.readFileSync("通用模板/engine/assets/cast_atlas.json", "utf8"));
const acts = JSON.parse(fs.readFileSync("通用模板/engine/assets/cast_actions.json", "utf8"));
const S = atlas.s; const A = {};
for (const [who, m] of Object.entries(acts.actions)) { A[who] = {}; for (const [k, v] of Object.entries(m)) A[who][k] = { fps: v.fps, loop: !!v.loop, frames: v.frames }; }
const need = (k) => { if (!S[k]) throw new Error("图集缺格 " + k); return k; };
const walkKey = { whale: "walk_whale", claude: "walk_claude", doubao: "walk_doubao_big", gemini: "walk_gemini", kimi: "walk_kimi", qwen: "walk_qwen", zai: "walk_zai" };
for (const [who, p] of Object.entries(walkKey)) A[who].walk = { fps: 10, loop: true, frames: [0, 1, 2, 3, 4, 5, 6, 7].map((i) => need(`${p}_${i}`)) };
for (const who of ["claude", "gemini", "kimi", "qwen", "zai"]) { A[who].side = { fps: 2, loop: true, frames: [need(`${who}_side_0`), need(`${who}_side_1`)] }; A[who].front = { fps: 2, loop: true, frames: [need(`${who}_front_0`)] }; A[who].blink = { fps: 6, loop: false, frames: [need(`${who}_front_0`), need(`${who}_front_1`), need(`${who}_front_0`)] }; }
A.gpt.fly = { fps: 6, loop: true, frames: [need("gpt_fly_0"), need("gpt_fly_1")] };
const THINGS = { ...Object.fromEntries(acts.props.map((p) => [p, [need(p)]])), ...Object.fromEntries(Object.entries(acts.fx).map(([k, v]) => [k, v.map(need)])) };
const used = new Set([...Object.values(A).flatMap((m) => Object.values(m).flatMap((a) => a.frames)), ...Object.values(THINGS).flat()]);
const RECTS = Object.fromEntries(Object.entries(S).filter(([k]) => used.has(k)));
fs.writeFileSync("番外MV/告白气球/源码/src/mv/atlasData.ts", `// 由 通用模板/engine/assets/cast_atlas.json + cast_actions.json 生成（图集 png 与模板逐字节一致）。不手改。\nexport const ATLAS_W=${atlas.w};export const ATLAS_H=${atlas.h};\nexport const RECTS:Record<string,[number,number,number,number]>=${JSON.stringify(RECTS)};\nexport const ACTIONS:Record<string,Record<string,{fps:number;loop:boolean;frames:string[]}>>=${JSON.stringify(A)};\nexport const THINGS:Record<string,string[]>=${JSON.stringify(THINGS)};\n`);
console.log("rects", Object.keys(RECTS).length, "walk whale", S.walk_whale_0, "fly", S.gpt_fly_0, "card", S.prop_card);
