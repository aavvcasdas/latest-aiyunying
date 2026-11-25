#!/usr/bin/env node
// 《寂寞烟火》上传工程专用逐帧采集：舞台含 DOM 歌词，不采集播放控件。
// 先在 番外MV/寂寞烟火/源码 执行 npm ci && npm run build。
// node tools/shoot_jimo_mv.mjs --out /tmp/jimo_frames [--from 0 --to 65.09] [--fps 30]
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import puppeteer from 'puppeteer-core';
import chromium, { inflate } from '@sparticuz/chromium';

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(name); return i === -1 ? def : args[i + 1]; };
const dist = path.resolve('番外MV/寂寞烟火/源码/dist');
const out = path.resolve(opt('--out', '/tmp/jimo_frames'));
const fps = Number(opt('--fps', 30));
const from = Number(opt('--from', 0));
const to = Number(opt('--to', 65.09));
if (!(fps > 0 && from >= 0 && to > from && to <= 65.09)) throw new Error('采集时间或帧率无效');
fs.mkdirSync(out, { recursive: true });
if (fs.readdirSync(out).some(f => /^f\d+\.png$/.test(f))) throw new Error('输出帧目录非空，请使用新的空目录');
const server = http.createServer((req, res) => {
  if (req.url !== '/' && !req.url.startsWith('/?')) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
  fs.createReadStream(path.join(dist, 'index.html')).pipe(res);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const lib = await inflate(path.resolve('node_modules/@sparticuz/chromium/bin/al2023.tar.br'));
process.env.LD_LIBRARY_PATH = `${lib}/lib:${process.env.LD_LIBRARY_PATH || ''}`;
const browser = await puppeteer.launch({
  executablePath: await chromium.executablePath(),
  headless: true,
  args: [...chromium.args, '--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  defaultViewport: { width: 1280, height: 720, deviceScaleFactor: 1 },
});
try {
  const page = await browser.newPage();
  let pageError;
  page.on('pageerror', e => { pageError = e; console.error('[pageerror]', e); });
  page.on('console', m => { if (m.type() === 'error') console.error('[console]', m.text()); });
  await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => window.__mv?.isReady(), { timeout: 300000, polling: 250 });
  await page.evaluate(async () => {
    await document.fonts.ready;
    if (!document.fonts.check('15px "MV Local"')) throw new Error('中文字体未载入');
    const canvas = document.querySelector('canvas');
    const stage = canvas?.parentElement?.parentElement;
    if (!stage || !stage.querySelector('.mv-subtitle')) throw new Error('找不到含字幕的舞台');
    document.body.style.visibility = 'hidden';
    Object.assign(stage.style, {
      visibility: 'visible', position: 'fixed', inset: '0', width: '1280px', height: '720px',
      maxWidth: 'none', maxHeight: 'none', border: '0', borderRadius: '0', margin: '0', boxShadow: 'none',
    });
    const style = document.createElement('style');
    style.textContent = '* { transition: none !important; animation: none !important; }';
    document.head.appendChild(style);
    document.querySelectorAll('audio,video').forEach(el => { el.pause(); el.muted = true; });
  });
  // Wait for the stage resize to propagate before stopping the preview loop.
  await page.waitForFunction(() => {
    const c = document.querySelector('canvas');
    return c && c.width === 1280 && c.height === 630;
  }, { timeout: 60000 });
  await page.evaluate(() => { window.requestAnimationFrame = () => 0; });
  const total = Math.ceil((to - from) * fps);
  const start = Date.now();
  for (let i = 0; i < total; i++) {
    if (pageError) throw pageError;
    await page.evaluate(t => window.__mv.seek(t), from + i / fps);
    await page.screenshot({ path: path.join(out, `f${String(i).padStart(5, '0')}.png`), type: 'png', captureBeyondViewport: false, optimizeForSpeed: true });
    if (i && i % 30 === 0) console.log(`${i}/${total} 帧 ${(i / ((Date.now() - start) / 1000)).toFixed(2)} fps`);
  }
  console.log(`SHOT_OK ${total} 帧 → ${out}`);
} finally {
  await browser.close();
  server.close();
}
