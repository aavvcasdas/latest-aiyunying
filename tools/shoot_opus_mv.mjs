#!/usr/bin/env node
// 把 opus5.5 上传的两份 Vite 单文件 MV（把回忆拼好_opus5.5max / 把回忆拼好_opus5.5）逐帧截下来。
//
// 这两个工程不是模板里的作品目录，跑不了 `npm run film`：它们各自带一套 three.js 引擎，
// 页面里留了预览用的时间钩子（max 版是 window.__mv.seek(t)，另一版是 window.__seek(t)）。
// 这里做的事和 tools/shoot_mv.mjs 一样：起一个静态服务器 → headless chromium → 固定时间逐帧截图。
//
// 截图走整页而不是 canvas.toDataURL：两支片子都有 DOM 叠层（闪白 / 淡出 / 边框 / 黑场），
// 只抓 canvas 会把这些丢掉。
//
// 用法：
//   node tools/shoot_opus_mv.mjs --dist /tmp/dist_max --out /tmp/frames_max
//   node tools/shoot_opus_mv.mjs --dist /tmp/dist_mem --out /tmp/frames_mem --from 10 --to 12
//   node tools/shoot_opus_mv.mjs --dist /tmp/dist_gq_fable5.1max --out /tmp/frames_gq_fable --dur 183.7
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

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const dist = path.resolve(opt('--dist', ''));
const outDir = path.resolve(opt('--out', '/tmp/frames'));
const FPS = Number(opt('--fps', 30));
const DUR = Number(opt('--dur', 60));
const NO_LYRICS = process.argv.includes('--no-lyrics');   // 只对《勾指起誓》fable 版的第二参数生效
const W = Number(opt('--w', 1920));
const H = Number(opt('--h', 1080));
const format = imageFormatFromArgv(argv);
const ext = frameExtension(format);
const Q = Number(opt('--quality', DEFAULT_JPEG_QUALITY));
const from = Number(opt('--from', 0));
const to = Number(opt('--to', DUR));
if (!opt('--dist')) { console.error('用法：node tools/shoot_opus_mv.mjs --dist <构建目录> --out <帧目录>'); process.exit(2); }

await clearFrames(outDir);

const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '');
  const file = path.join(dist, rel === '' ? 'index.html' : rel);
  if (!fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': file.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

process.env.LD_LIBRARY_PATH = ['/tmp/al2023/lib', '/tmp/al2023', '/tmp', process.env.LD_LIBRARY_PATH || ''].join(':');
const browser = await puppeteer.launch({
  executablePath: await chromium.executablePath(),
  env: { ...process.env },
  headless: true,
  args: [...chromium.args, '--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'],
  defaultViewport: { width: W, height: H, deviceScaleFactor: 1 },
});
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('[page error]', String(e).slice(0, 300)));
page.on('console', (m) => { if (m.type() === 'error') console.log('[console]', m.text().slice(0, 300)); });

await page.goto(`http://127.0.0.1:${port}/?t=${from}`, { waitUntil: 'load', timeout: 180000 });

// 两个版本各自的钩子：都叫 seek(t)，随便哪一个在都算准备好
await page.waitForFunction(() => {
  const c = document.querySelector('canvas');
  if (!c) return false;
  const hook = window.__mv || null;
  if (hook && typeof hook.ready === 'function' && !hook.ready()) return false;
  if (typeof window.__mvRender === 'function') return true;   // 《勾指起誓》三版：页面自己装帧钩子
  return !!window.__seek || !!(hook && typeof hook.seek === 'function');
}, { timeout: 300000, polling: 250 });

// 只留舞台：隐藏页面外框（标题、播放条、分镜表），把舞台铺满视口
await installCaptureClock(page);
await prepareCaptureStage(page);

// 取「最大的那块 canvas」（页面里常还有小尺寸的角色头像 canvas）
await page.waitForFunction((w, h) => {
  const cs = [...document.querySelectorAll('canvas')];
  return cs.some((c) => c.width >= w - 2 && c.height >= h - 2);
}, { timeout: 60000, polling: 100 }, W, H);

// 两条取帧路径：
//  · 页面里给了 __mvRender(t)（把回忆拼好版）：直接渲一帧 → 离屏合成闪白/淡出 → 返回 JPEG dataURL，最快；
//  · 否则（max 版）：__seek/__mv.seek(t) 之后整页截图，DOM 叠层（闪白 / 黑场 / 边框）自动带上。
const hookPre = await page.evaluate(() => {
  if (typeof window.__mvRender === 'function') return 'mvRender';
  if (window.__mv && typeof window.__mv.render === 'function') return 'mv.render';
  return '';
});
// 页面自己的 rAF 循环会和截帧抢 CPU（软件光栅下这是 3 倍差距）
await freezePageLoop(page);
const hook = hookPre;

const total = Math.round((to - from) * FPS);
const t0 = Date.now();
for (let i = 0; i < total; i++) {
  const t = from + i / FPS;
  const file = path.join(outDir, `f${String(i).padStart(5, '0')}.${ext}`);
  await page.evaluate((h, tt, nl) => {
    if (h === 'mvRender') window.__mvRender(tt, nl);
    else if (h === 'mv.render') window.__mv.render(tt);
    else if (window.__seek) window.__seek(tt);
    else window.__mv.seek(tt);
  }, hook, t, NO_LYRICS);
  await captureFrame(page, { file, format, quality: Q });
  if (i % 100 === 0 && i > 0) {
    const sec = (Date.now() - t0) / 1000;
    console.log(`${i}/${total} 张 · ${(i / sec).toFixed(2)} fps · 预计还需 ${Math.round((sec / i) * (total - i))}s`);
  }
}
console.log(`SHOT_OK ${total} 帧 → ${outDir}`);

await browser.close();
server.close();
