#!/usr/bin/env node
// 把用户上传的 Vite 单页 MV 工程逐帧截下来（这三支都是「页面里自己带时间钩子」的写法）。
//
// 三种取帧路径，脚本自动选：
//   1. window.__mv.render(t, clean, width)  → 直接返回 canvas 的 JPEG dataURL（最快，拿到的就是画面本体）
//   2. window.__seek(t) / window.__mv.seek(t) → 设定时间后整页截图（DOM 叠层：闪白 / 黑场 / 胶片颗粒 会一起带上）
//   3. 都没有 → 报错，请先在页面里装钩子
//
// 用法：
//   node tools/shoot_vite_mv.mjs --dist 番外MV/情歌_opus5.5max/源码/dist --out /tmp/frames_qg --dur 261.5
//   node tools/shoot_vite_mv.mjs --dist ... --out ... --from 10 --to 20     只截一段
//   node tools/shoot_vite_mv.mjs --dist ... --out ... --still 42           只出一张静帧（看构图用）
//   node tools/shoot_vite_mv.mjs --dist ... --out ... --query clean        给页面加 ?clean（隐藏界面）
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import puppeteer from 'puppeteer-core';
import chromium, { inflate } from '@sparticuz/chromium';

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const dist = path.resolve(opt('--dist', ''));
if (!opt('--dist')) { console.error('用法：node tools/shoot_vite_mv.mjs --dist <构建目录> --out <帧目录> [--dur 秒] [--fps 30] [--from] [--to] [--still]'); process.exit(2); }
const outDir = path.resolve(opt('--out', '/tmp/frames'));
const FPS = Number(opt('--fps', 30));
const DUR = Number(opt('--dur', 60));
const W = Number(opt('--w', 1920));
const H = Number(opt('--h', 1080));
const Q = Number(opt('--quality', 92));
const from = Number(opt('--from', 0));
const to = Number(opt('--to', DUR));
const still = opt('--still', null);
const query = opt('--query', '');
const hide = (opt('--hide', '') || '').split(',').map((x) => x.trim()).filter(Boolean);

// chromium 的 .so 在压缩包里，先解出来再加进 LD_LIBRARY_PATH（和 通用模板/cli/film.mjs 的 prepareBrowser() 同理）
const libRoot = await inflate(path.join(process.cwd(), 'node_modules/@sparticuz/chromium/bin/al2023.tar.br'));
process.env.LD_LIBRARY_PATH = `${libRoot}/lib:${process.env.LD_LIBRARY_PATH || ''}`;

fs.mkdirSync(outDir, { recursive: true });
if (!still) for (const f of fs.readdirSync(outDir)) if (f.endsWith('.jpg')) fs.unlinkSync(path.join(outDir, f));

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2', '.ttf': 'font/ttf' };
const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '');
  const file = path.join(dist, rel === '' ? 'index.html' : rel);
  if (!file.startsWith(dist) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

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

await page.goto(`http://127.0.0.1:${port}/${query ? `?${query}` : ''}`, { waitUntil: 'load', timeout: 180000 });

await page.waitForFunction(() => {
  const hook = window.__mv || null;
  if (hook && typeof hook.ready === 'function' && !hook.ready()) return false;
  return typeof window.__seek === 'function'
    || !!(hook && (typeof hook.seek === 'function' || typeof hook.render === 'function'));
}, { timeout: 300000, polling: 250 });

// 页面字号：等字体（ZCOOL 子集）解码完再开始，否则前几帧的字会掉回系统字体
await page.evaluate(() => document.fonts.ready);
await new Promise((r) => setTimeout(r, 600));

const mode = await page.evaluate(() => (window.__mv && typeof window.__mv.render === 'function') ? 'render' : 'seek');
console.log(`[mode] ${mode}`);

if (mode === 'seek') {
  // 整页截图：只留舞台，铺满视口
  await page.evaluate(() => {
    const c = [...document.querySelectorAll('canvas')].sort((a, b) => b.width * b.height - a.width * a.height)[0];
    const st = c ? c.parentElement : null;
    document.documentElement.style.background = '#000';
    document.body.style.overflow = 'hidden';
    if (st) {
      const keep = new Set([st]);
      document.body.style.visibility = 'hidden';
      Object.assign(st.style, { visibility: 'visible', position: 'fixed', left: '0', top: '0', width: '100vw', height: '100vh', aspectRatio: 'auto', borderRadius: '0', margin: '0', boxShadow: 'none', outline: 'none' });
      void keep;
    }
    document.querySelectorAll('audio,video').forEach((el) => { el.pause(); el.muted = true; });
  });
}

// 有些页面的叠层很贵：比如《我好想你》那层 grain 是 feTurbulence + mix-blend-mode:multiply，
// 全屏混合让每帧截图多花 300–450 ms（实测 2.6 fps → 1.2 fps）。这类层可以让脚本先摘掉，
// 出片后再用 ffmpeg 的 noise 补回颗粒感。
if (hide.length) {
  await page.evaluate((sels) => { for (const s of sels) document.querySelectorAll(s).forEach((el) => { el.style.display = 'none'; }); }, hide);
  console.log(`[hide] ${hide.join(' ')}`);
}

if (still !== null) {
  const t = Number(still);
  let buf;
  if (mode === 'render') {
    const url = await page.evaluate((tt, w) => { const r = window.__mv.render(tt, false, w); return typeof r === 'string' ? r : r.url; }, t, W);
    buf = Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
  } else {
    await page.evaluate((tt) => { const s = window.__seek || (window.__mv && window.__mv.seek); s(tt); return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); }, t);
    buf = await page.screenshot({ type: 'jpeg', quality: Q, optimizeForSpeed: true });
  }
  const file = path.join(outDir, `still_${t.toFixed(2)}.jpg`);
  fs.writeFileSync(file, buf);
  console.log(`STILL ${file}`);
  await browser.close(); server.close();
  process.exit(0);
}

// 有渲染钩子时把页面自己的 rAF 循环停掉，免得和截帧抢 CPU
if (mode === 'render') await page.evaluate(() => { window.requestAnimationFrame = () => 0; });

const total = Math.round((to - from) * FPS);
const t0 = Date.now();
for (let i = 0; i < total; i++) {
  const t = from + i / FPS;
  const file = path.join(outDir, `f${String(i).padStart(5, '0')}.jpg`);
  if (mode === 'render') {
    const url = await page.evaluate((tt, w) => { const r = window.__mv.render(tt, false, w); return typeof r === 'string' ? r : r.url; }, t, W);
    fs.writeFileSync(file, Buffer.from(url.slice(url.indexOf(',') + 1), 'base64'));
  } else {
    await page.evaluate((tt) => { const s = window.__seek || (window.__mv && window.__mv.seek); s(tt); return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); }, t);
    await page.screenshot({ type: 'jpeg', quality: Q, optimizeForSpeed: true, path: file });
  }
  if (i % 150 === 0 && i > 0) {
    const sec = (Date.now() - t0) / 1000;
    console.log(`${i}/${total} 张 · ${(i / sec).toFixed(2)} fps · 预计还需 ${Math.round((sec / i) * (total - i))}s`);
  }
}
console.log(`SHOT_OK ${total} 帧 → ${outDir}`);
await browser.close();
server.close();
