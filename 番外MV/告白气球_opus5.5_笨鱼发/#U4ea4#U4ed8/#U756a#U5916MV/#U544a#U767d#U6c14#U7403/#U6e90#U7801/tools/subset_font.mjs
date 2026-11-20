// 用法（仓库根目录）：node 番外MV/告白气球/源码/tools/subset_font.mjs  —— 改过画面上的字之后重跑
import fs from "fs"; import path from "path";
import { createRequire } from "module"; const require = createRequire(import.meta.url); const opentype = require("opentype.js");
const walk = (d) => fs.readdirSync(d).flatMap((f) => { const p = path.join(d, f); return fs.statSync(p).isDirectory() ? walk(p) : /\.(tsx?|html)$/.test(f) ? [p] : []; });
let text = ""; for (const f of [...walk("番外MV/告白气球/源码/src"), "番外MV/告白气球/源码/index.html"]) text += fs.readFileSync(f, "utf8");
text += fs.readFileSync("番外MV/告白气球/源码/src/mv/lyricsData.ts", "utf8");
const set = new Set([...text].filter((c) => c.charCodeAt(0) > 32)); for (let i = 32; i < 127; i++) set.add(String.fromCharCode(i));
const fb = fs.readFileSync("通用模板/engine/assets/fonts/ZCOOLKuaiLe-Regular.ttf"); const font = opentype.parse(fb.buffer.slice(fb.byteOffset, fb.byteOffset + fb.byteLength));
const glyphs = [font.glyphs.get(0)]; const miss = [];
for (const ch of set) { const g = font.charToGlyph(ch); if (!g || g.index === 0) { if (ch.charCodeAt(0) > 0x2e80) miss.push(ch); continue; } glyphs.push(new opentype.Glyph({ name: "u" + ch.codePointAt(0).toString(16), unicode: ch.codePointAt(0), advanceWidth: g.advanceWidth, path: g.path })); }
const out = new opentype.Font({ familyName: "MVKuaile", styleName: "Regular", unitsPerEm: font.unitsPerEm, ascender: font.ascender, descender: font.descender, glyphs });
fs.writeFileSync("番外MV/告白气球/源码/src/assets/kuaile.otf", Buffer.from(out.toArrayBuffer()));
console.log("glyphs", glyphs.length, "bytes", fs.statSync("番外MV/告白气球/源码/src/assets/kuaile.otf").size, "missing CJK:", miss.join(""));
