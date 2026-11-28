#!/usr/bin/env node
// 从「页面自己带时间钩子」的 Vite MV 工程里，用页面自己的 mixdown() 导出整条音轨。
//
// 有些工程（《逃离童话镇 opus5.5max》这一支）除了歌还有一整套按节拍合成的音效轨，
// 播放时由 WebAudio 实时混音，导出静帧再编码时那段代码不参与——直接拿 song.mp3 当音轨
// 会把铃、盖章、彩带、烟花全丢掉。这里让页面在离线上下文里跑一遍它自己的混音，
// 拿到的就是用户在浏览器里听到的那一版（含音乐淡出与限幅）。
//
// 页面需要暴露以下任一钩子：
//   window.__mv.mixdown(withSfx)   → Promise<Blob>（《逃离童话镇》系列）
//   window.__mv.mixdown(end, fadeA, withSfx)
//
// 用法：
//   node tools/grab_vite_mv_audio.mjs --dist 番外MV/逃离童话镇opus5.5max/dist --out /tmp/etz_audio.wav
//   node tools/grab_vite_mv_audio.mjs --dist ... --out ... --no-sfx     只要歌，不要音效
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import puppeteer from 'puppeteer-core';
import chromium, { inflate } from '@sparticuz/chromium';

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const dist = path.resolve(opt('--dist', ''));
if (!opt('--dist') || !opt('--out')) {
  console.error('用法：node tools/grab_vite_mv_audio.mjs --dist <构建目录> --out <音轨.wav> [--no-sfx]');
  process.exit(2);
}
const outFile = path.resolve(opt('--out', ''));
const withSfx = !argv.includes('--no-sfx');

const libRoot = await inflate(path.join(process.cwd(), 'node_modules/@sparticuz/chromium/bin/al2023.tar.br'));
process.env.LD_LIBRARY_PATH = `${libRoot}/lib:${process.env.LD_LIBRARY_PATH || ''}`;

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '');
  const file = path.join(dist, rel === '' ? 'index.html' : rel);
  if (!file.startsWith(dist) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));

const browser = await puppeteer.launch({
  executablePath: await chromium.executablePath(),
  env: { ...process.env },
  headless: true,
  args: [...chromium.args, '--no-sandbox', '--autoplay-policy=no-user-gesture-required'],
});
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('[page error]', String(e).slice(0, 300)));

// ?capture 只渲染一帧就停，不会起播放循环，正好用来拿钩子
await page.goto(`http://127.0.0.1:${server.address().port}/?capture`, { waitUntil: 'load', timeout: 180000 });
await page.waitForFunction(() => !!(window.__mv && (typeof window.__mv.mixdown === 'function')), { timeout: 300000, polling: 250 });

console.log(`[mixdown] 开始${withSfx ? '（歌 + 音效）' : '（只要歌）'}…`);
const b64 = await page.evaluate(async (sfx) => {
  const fn = window.__mv.mixdown;
  // 钩子返回的可能是 Blob，也可能是 URL.createObjectURL 出来的字符串，两种都接
  let blob = fn.length >= 2 ? await fn(window.__mv.duration, undefined, sfx) : await fn(sfx);
  if (typeof blob === 'string') blob = await (await fetch(blob)).blob();
  const buf = new Uint8Array(await blob.arrayBuffer());
  let s = '';
  for (let i = 0; i < buf.length; i++) s += String.fromCharCode(buf[i]);
  return btoa(s);
}, withSfx);
if (!b64) throw new Error('mixdown 返回空');
fs.mkdirSync(path.dirname(outFile), { recursive: true });
fs.writeFileSync(outFile, Buffer.from(b64, 'base64'));
console.log(`MIX_OK ${outFile} ${fs.statSync(outFile).size} B`);
await browser.close();
server.close();
