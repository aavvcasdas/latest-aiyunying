// 把 番外MV/坏女孩 这个 Vite 单文件成片逐帧截下来（headless chromium），给 ffmpeg 编码用。
// 用法：node tools/shoot_mv.mjs <dist目录> <输出帧目录> [--from s] [--to s] [--batch 12]
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import {
  DEFAULT_JPEG_QUALITY,
  captureFrame,
  clearFrames,
  frameExtension,
  freezePageLoop,
  imageFormatFromArgv,
  installCaptureClock,
  prepareCaptureStage,
} from './capture_quality.mjs';

const dist = path.resolve(process.argv[2] || '番外MV/坏女孩/dist');
const out = path.resolve(process.argv[3] || '/tmp/brframes');
const arg = (n, d) => { const i = process.argv.indexOf(n); return i > 0 ? Number(process.argv[i + 1]) : d; };
const FPS = 30, START = 20.475, TOTAL_END = 217.7;
const from = arg('--from', START), to = arg('--to', TOTAL_END), batch = arg('--batch', 12);
const format = imageFormatFromArgv(process.argv.slice(2));
const ext = frameExtension(format);
const quality = arg('--quality', DEFAULT_JPEG_QUALITY);

await clearFrames(out);
void batch; // 保留参数兼容旧命令；现在逐帧截图，避免把 JPEG dataURL 写进 PNG 序列。

const server = http.createServer((req, res) => {
  const file = path.join(dist, req.url === '/' ? 'index.html' : req.url.slice(1));
  if (!fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': file.endsWith('.html') ? 'text/html' : 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const exe = await chromium.executablePath();
process.env.LD_LIBRARY_PATH = ['/tmp/al2023/lib', '/tmp/al2023', '/tmp', process.env.LD_LIBRARY_PATH || ''].join(':');
const browser = await puppeteer.launch({
  executablePath: exe,
  env: { ...process.env },
  headless: true,
  args: [...chromium.args, '--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  defaultViewport: { width: 1280, height: 720 },
});
const page = await browser.newPage();
page.on('console', (m) => { if (m.type() === 'error') console.log('[page]', m.text().slice(0, 200)); });
await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'load', timeout: 120000 });
await page.waitForFunction('window.__mv && window.__mv.ready', { timeout: 180000 });
await installCaptureClock(page);
await prepareCaptureStage(page);
await freezePageLoop(page);

const total = Math.round((to - from) * FPS);
const t0 = Date.now();
for (let i = 0; i < total; i++) {
  const t = from + i / FPS;
  await page.evaluate((tt) => { window.__mv.render(tt); }, t);
  const file = path.join(out, `f${String(i).padStart(5, '0')}.${ext}`);
  await captureFrame(page, { file, format, quality });
  if (i % 300 === 0 && i > 0) {
    const sec = (Date.now() - t0) / 1000;
    console.log(`${i}/${total} 张 · ${(i / sec).toFixed(1)} fps · 预计还需 ${Math.round((sec / i) * (total - i))}s`);
  }
}
const done = total;
console.log(`SHOT_OK ${done} 帧 → ${out}`);
await browser.close();
server.close();
