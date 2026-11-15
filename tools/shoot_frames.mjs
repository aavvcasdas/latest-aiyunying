#!/usr/bin/env node
// 把一份 Vite 单文件 MV 工程（vite build 出来的 dist）逐帧截成 JPEG 序列。
// 给 2026-11-15 的三份工程用：《我好想你》（DOM / CSS 3D 剪纸）与《情歌》两版（three.js）。
//
// 和 tools/shoot_opus_mv.mjs 是同一个思路（静态服务器 → headless chromium → 固定时间逐帧取图），多了三件事：
//   · 帧文件按**绝对帧号**命名（f00000.jpg = 第 0 帧），所以可以分段跑、几路一起跑，最后不用改名；
//   · **已经有的帧跳过**：中途被打断（浏览器被系统杀掉、机器重启）之后原样再跑一遍就接着渲；
//   · 浏览器崩了自己重开，从缺的那一帧继续（最多 --retries 次）。
//   · 每 --recycle 帧（默认 1500）主动换一个新浏览器，内存不会一路涨到被系统杀掉。
//
// 两条取帧路径（按页面上有哪个钩子自动选）：
//   · window.__mvRender(t, noLyric, w, h) → JPEG dataURL：three.js 那两版，直接从 canvas 取；
//   · window.__seek(t)：DOM 那一版（要带 ?capture），摆好时间后整页截图。
//
// 用法：
//   node tools/shoot_frames.mjs --dist /tmp/dist_love --out /tmp/frames_love --dur 261.5
//   node tools/shoot_frames.mjs --dist /tmp/dist_miss --out /tmp/frames_miss --dur 329.33 --query "t=0&clean&capture"
//   node tools/shoot_frames.mjs --dist … --out … --dur … --a 3000 --b 6000      # 只渲第 3000–5999 帧
//   node tools/shoot_frames.mjs --dist … --out … --stills 12.5,60,120           # 只出这几个时间点（s012.500.jpg）
//   node tools/shoot_frames.mjs --dist … --out … --stills 1 --cover             # 调 __mv.cover(t) 出网页封面底图
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import * as chromiumMod from '@sparticuz/chromium';

const chromium = chromiumMod.default || chromiumMod;

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : d; };
const has = (n) => argv.includes(n);
if (!opt('--dist')) { console.error('用法：node tools/shoot_frames.mjs --dist <构建目录> --out <帧目录> --dur <秒>'); process.exit(2); }
const dist = path.resolve(opt('--dist'));
const outDir = path.resolve(opt('--out', '/tmp/frames'));
const FPS = Number(opt('--fps', 30));
const DUR = Number(opt('--dur', 60));
const W = Number(opt('--w', 1920));
const H = Number(opt('--h', 1080));
const Q = Number(opt('--quality', 95));
const QUERY = opt('--query', '');
const NO_LYRICS = has('--no-lyrics');
const COVER = has('--cover');
const RETRIES = Number(opt('--retries', 20));
const RECYCLE = Number(opt('--recycle', 1500));   // 每渲这么多帧换一个新浏览器：长片渲到后面内存只涨不落
const TOTAL = Math.round(DUR * FPS);
const A = Number(opt('--a', 0));
const B = Math.min(TOTAL, Number(opt('--b', TOTAL)));
const stills = opt('--stills') ? String(opt('--stills')).split(',').map(Number) : null;
const tag = opt('--tag', path.basename(outDir));

fs.mkdirSync(outDir, { recursive: true });
const frameFile = (i) => path.join(outDir, `f${String(i).padStart(5, '0')}.jpg`);
const stillFile = (t) => path.join(outDir, `${COVER ? 'c' : 's'}${t.toFixed(3).padStart(7, '0')}.jpg`);
// 写完整文件再改名：被打断时不会留下半张图（半张图会被「已有就跳过」当成渲完了）
const save = (file, buf) => { fs.writeFileSync(file + '.part', buf); fs.renameSync(file + '.part', file); };
const todo = () => {
  if (stills) return stills.map((t) => ({ t, file: stillFile(t) }));
  const out = [];
  for (let i = A; i < B; i++) if (!fs.existsSync(frameFile(i))) out.push({ t: i / FPS, file: frameFile(i), i });
  return out;
};

const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '');
  const file = path.join(dist, rel === '' ? 'index.html' : rel);
  if (!fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': file.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

// @sparticuz/chromium 的动态库（libnspr4 等）只在 Lambda 环境里才自动解包，这里自己解一次（做法同 通用模板/cli/film.mjs）
const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const inflate = chromiumMod.inflate || chromium.inflate;
const al = path.join(REPO, 'node_modules/@sparticuz/chromium/bin/al2023.tar.br');
if (typeof inflate === 'function' && fs.existsSync(al)) await inflate(al);
process.env.LD_LIBRARY_PATH = ['/tmp/al2023/lib', '/tmp/al2023', '/tmp', process.env.LD_LIBRARY_PATH || ''].join(':');
// 无头环境里没有中文字体：把模板字体挂进 fontconfig 兜底（页面自己的 @font-face / FontFace 仍然优先）
const FONT_DIR = path.join(REPO, '通用模板/engine/assets/fonts');
const fontDir = path.join(os.tmpdir(), 'newday-film-fonts');
fs.mkdirSync(fontDir, { recursive: true });
for (const f of fs.readdirSync(FONT_DIR)) if (/\.(ttf|otf)$/i.test(f)) fs.copyFileSync(path.join(FONT_DIR, f), path.join(fontDir, f));
const conf = path.join(fontDir, 'fonts.conf');
fs.writeFileSync(conf, `<?xml version="1.0"?>\n<!DOCTYPE fontconfig SYSTEM "fonts.dtd">\n<fontconfig>\n  <include ignore_missing="yes">/etc/fonts/fonts.conf</include>\n  <dir>${fontDir}</dir>\n  <cachedir>${path.join(fontDir, 'cache')}</cachedir>\n</fontconfig>\n`);
process.env.FONTCONFIG_FILE = conf;
const exe = await chromium.executablePath();

async function session(list) {
  const browser = await puppeteer.launch({
    executablePath: exe,
    env: { ...process.env },
    headless: true,
    protocolTimeout: 600000,
    args: [...chromium.args, '--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required', '--hide-scrollbars'],
    defaultViewport: { width: W, height: H, deviceScaleFactor: 1 },
  });
  try {
    const page = await browser.newPage();
    page.on('pageerror', (e) => console.log(`[${tag}] [page error]`, String(e).slice(0, 300)));
    page.on('console', (m) => { if (m.type() === 'error') console.log(`[${tag}] [console]`, m.text().slice(0, 300)); });
    await page.goto(`http://127.0.0.1:${port}/${QUERY ? '?' + QUERY : ''}`, { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => {
      const hook = window.__mv || null;
      if (hook && typeof hook.ready === 'function' && !hook.ready()) return false;
      return typeof window.__mvRender === 'function' || typeof window.__seek === 'function';
    }, { timeout: 300000, polling: 250 });
    await page.evaluate(() => document.fonts.ready.then(() => true));
    const mode = await page.evaluate(() => (typeof window.__mvRender === 'function' ? 'canvas' : 'dom'));

    if (mode === 'canvas') {
      // 页面自己的 requestAnimationFrame 循环也在渲，会和取帧抢 CPU：停掉
      await page.evaluate(() => { window.requestAnimationFrame = () => 0; document.querySelectorAll('audio,video').forEach((el) => { el.pause(); el.muted = true; }); });
    } else {
      await page.evaluate(() => { document.querySelectorAll('audio,video').forEach((el) => { el.pause(); el.muted = true; }); });
      // 第一帧先摆一次并等两拍：精灵图、字体第一次上屏要解码
      await page.evaluate((tt) => { window.__seek(tt); return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(true)))); }, list[0].t);
      await page.screenshot({ type: 'jpeg', quality: 50 });
    }
    const cdp = await page.createCDPSession();

    const t0 = Date.now();
    let done = 0;
    for (const it of list) {
      if (done >= RECYCLE) break;
      if (mode === 'canvas') {
        const url = await page.evaluate((tt, nl, w, h, cover) => (cover ? window.__mv.cover(tt) : window.__mvRender(tt, nl, w, h)), it.t, NO_LYRICS, W, H, COVER);
        if (!url || url.length < 1000) throw new Error(`第 ${it.t.toFixed(3)} 秒没有取到画面`);
        save(it.file, Buffer.from(url.slice(url.indexOf(',') + 1), 'base64'));
      } else {
        await page.evaluate((tt) => { window.__seek(tt); return new Promise((r) => requestAnimationFrame(() => r(true))); }, it.t);
        const { data } = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: Q, optimizeForSpeed: true, captureBeyondViewport: false });
        save(it.file, Buffer.from(data, 'base64'));
      }
      done++;
      if (done % 100 === 0) {
        const sec = (Date.now() - t0) / 1000;
        console.log(`[${tag}] ${done}/${list.length} 张（帧 ${it.i ?? '-'}）· ${(done / sec).toFixed(2)} fps · 预计还需 ${Math.round((sec / done) * (list.length - done))}s`);
      }
    }
  } finally {
    await browser.close().catch(() => {});
  }
}

let tries = 0;
for (;;) {
  const list = todo();
  if (!list.length || (stills && tries > 0 && list.every((x) => fs.existsSync(x.file)))) break;
  try {
    await session(list);
    if (stills) break;
  } catch (e) {
    tries++;
    console.log(`[${tag}] 第 ${tries} 次中断：${String(e).slice(0, 200)}`);
    if (tries > RETRIES) { console.error(`[${tag}] 重试 ${RETRIES} 次仍失败，停下`); server.close(); process.exit(1); }
    await new Promise((r) => setTimeout(r, 3000));
  }
}
server.close();
if (stills) console.log(`[${tag}] STILLS_OK ${stills.length} 张 → ${outDir}`);
else {
  let miss = 0;
  for (let i = A; i < B; i++) if (!fs.existsSync(frameFile(i))) miss++;
  console.log(miss ? `[${tag}] 还缺 ${miss} 帧` : `[${tag}] SHOT_OK 帧 ${A}–${B - 1}（共 ${B - A} 张）→ ${outDir}`);
  process.exit(miss ? 1 : 0);
}
