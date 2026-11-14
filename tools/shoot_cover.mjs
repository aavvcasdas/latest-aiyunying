#!/usr/bin/env node
// 出封面用的「干净剧照」：同 tools/shoot_opus_mv.mjs 起 headless chromium，
// 但调页面上的 __mv.cover(t) —— 那一版渲染会把 MV 自带的歌词条藏掉，
// 于是封面底图上不会剩任何字幕碎片（封面只放主题）。
//
// 用法：
//   node tools/shoot_cover.mjs --dist /tmp/dist_max3 --out /tmp/covers_max --times 17.6,26.0
// 产物：<out>/c17.60.jpg …
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const dist = path.resolve(opt('--dist', ''));
const outDir = path.resolve(opt('--out', '/tmp/covers'));
const W = Number(opt('--w', 1920));
const H = Number(opt('--h', 1080));
const times = String(opt('--times', '17.6')).split(',').map(Number);
if (!opt('--dist')) { console.error('用法：node tools/shoot_cover.mjs --dist <构建目录> --out <目录> --times 17.6,26'); process.exit(2); }
fs.mkdirSync(outDir, { recursive: true });

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

await page.goto(`http://127.0.0.1:${port}/?t=${times[0]}`, { waitUntil: 'load', timeout: 180000 });
// 两版封面钩子的名字不一样：max 版是 __mv.cover(t)，把回忆拼好版是 __mvCover(t)
const HOOK = await page.waitForFunction(() => {
  const c = document.querySelector('canvas');
  if (!c) return false;
  const m = window.__mv;
  if (m && typeof m.cover === 'function' && (typeof m.ready !== 'function' || m.ready())) return '__mv.cover';
  if (typeof window.__mvCover === 'function') return '__mvCover';
  return false;
}, { timeout: 300000, polling: 250 }).then((h) => h.jsonValue());
console.log('封面钩子：', HOOK);

await page.evaluate(() => {
  const c = document.querySelector('canvas');
  const st = c.parentElement;
  document.documentElement.style.background = '#000';
  document.body.style.visibility = 'hidden'; document.body.style.overflow = 'hidden';
  Object.assign(st.style, {
    visibility: 'visible', position: 'fixed', left: '0', top: '0',
    width: '100vw', height: '100vh', aspectRatio: 'auto', borderRadius: '0',
    margin: '0', boxShadow: 'none', outline: 'none',
  });
  document.querySelectorAll('audio,video').forEach((el) => { el.pause(); el.muted = true; });
  window.requestAnimationFrame = () => 0; // 冻住页面自播，别抢 CPU
});

for (const t of times) {
  const url = await page.evaluate((h, tt) => (h === '__mvCover' ? window.__mvCover(tt) : window.__mv.cover(tt)), HOOK, t);
  const file = path.join(outDir, `c${t.toFixed(2)}.jpg`);
  fs.writeFileSync(file, Buffer.from(url.slice(url.indexOf(',') + 1), 'base64'));
  console.log('✓', file);
}
await browser.close();
server.close();
