// 自检：在 Node 里用 @napi-rs/canvas 逐镜头抽帧拼成总览图（不进成片，只看构图有没有坏）
import { build } from 'esbuild';
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { createCanvas, loadImage, GlobalFonts } = require('/tmp/tools/node_modules/@napi-rs/canvas');
await build({ entryPoints: ['src/mv/film.ts'], bundle: true, format: 'esm', platform: 'node', outfile: '/tmp/qa/film.mjs', loader: { '.json': 'json' }, logLevel: 'error' });
const M = await import('/tmp/qa/film.mjs?' + Date.now());
GlobalFonts.registerFromPath('/tmp/an/font.ttf', 'BG');
const atlas = await loadImage(fs.readFileSync('/tmp/an/atlas.png'));
const film = M.createFilm({ atlas, makeCanvas: (w, h) => createCanvas(w, h) });
const args = process.argv.slice(2);
const times = args[0] === 'shots' ? M.SHOTS.map((s) => +(s.start + (s.end - s.start) * (+args[1] || 0.6)).toFixed(2)) : args[0].split(',').map(Number);
const cols = +(args[2] || 6), tw = +(process.env.TW || 320), th = (tw * 9) / 16, rows = Math.ceil(times.length / cols);
const sheet = createCanvas(cols * tw, rows * th), sg = sheet.getContext('2d');
const cv = createCanvas(1280, 720), g = cv.getContext('2d');
let worst = 0;
for (let i = 0; i < times.length; i++) {
  const t0 = performance.now(); const r = film.render(g, times[i]); const dt = performance.now() - t0; worst = Math.max(worst, dt);
  sg.drawImage(cv, (i % cols) * tw, Math.floor(i / cols) * th, tw, th);
  sg.fillStyle = 'rgba(0,0,0,0.6)'; sg.fillRect((i % cols) * tw, Math.floor(i / cols) * th, 150, 18); sg.fillStyle = '#ff0'; sg.font = '13px sans-serif'; sg.fillText(`${times[i].toFixed(2)}s ${r.shot}`, (i % cols) * tw + 3, Math.floor(i / cols) * th + 13);
}
fs.writeFileSync(args[3] || 'ref/an/qa.png', sheet.toBuffer('image/png'));
console.log('frames', times.length, 'shots', M.SHOTS.length, 'lines', M.LINES.length, 'worst ms', worst.toFixed(1));
