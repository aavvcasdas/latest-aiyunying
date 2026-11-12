// 自检 + 预渲染：Node 里逐帧调用同一份 render()，管道喂给 ffmpeg 编 H.264，音轨直接从原曲 mp4 拷贝（保留编码器预滚的编辑表，逐采样对齐）
import { build } from 'esbuild';
import fs from 'fs';
import { spawn } from 'child_process';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { createCanvas, loadImage, GlobalFonts } = require('/tmp/tools/node_modules/@napi-rs/canvas');
await build({ entryPoints: ['src/mv/film.ts'], bundle: true, format: 'esm', platform: 'node', outfile: '/tmp/qa/film.mjs', loader: { '.json': 'json' }, logLevel: 'error' });
const M = await import('/tmp/qa/film.mjs?' + Date.now());
GlobalFonts.registerFromPath('/tmp/qa/bg.ttf', 'BG');
const atlas = await loadImage(fs.readFileSync('/tmp/an/atlas.png'));
const film = M.createFilm({ atlas, makeCanvas: (w, h) => createCanvas(w, h) });
const Wd = 1280, Hd = 720, FPS = 30, N = Math.round(M.DUR * FPS), out = process.argv[2] || '/tmp/qa/fanwutuobang.mp4';
const ff = spawn('/tmp/tools/node_modules/ffmpeg-static/ffmpeg', ['-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${Wd}x${Hd}`, '-r', String(FPS), '-i', '-', '-i', '/tmp/repo/song.mp4', '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', 'medium', '-crf', '23', '-tune', 'animation', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
const cv = createCanvas(Wd, Hd), g = cv.getContext('2d');
const t0 = Date.now(); let worst = 0, errors = 0;
for (let i = 0; i < N; i++) {
  const a = performance.now();
  try { film.render(g, i / FPS); } catch (e) { errors++; if (errors < 5) console.error('frame', i, e.message); }
  worst = Math.max(worst, performance.now() - a);
  const buf = g.getImageData(0, 0, Wd, Hd).data;
  if (!ff.stdin.write(Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength))) await new Promise((r) => ff.stdin.once('drain', r));
}
ff.stdin.end();
await new Promise((r) => ff.on('close', r));
console.log('frames', N, 'errors', errors, 'worst render ms', worst.toFixed(1), 'total s', ((Date.now() - t0) / 1000).toFixed(0));
