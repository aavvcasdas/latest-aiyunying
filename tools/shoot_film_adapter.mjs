#!/usr/bin/env node
// Canonical deterministic capture for browser MVs.
//
// It understands the shared `window.__FILM__` contract and the legacy
// `__mv.render` / `__mvRender` / `__seek` hooks. The page's own rAF loop is frozen,
// every time is rendered exactly once, and frames default to lossless PNG.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import puppeteer from 'puppeteer-core';
import chromium, { inflate } from '@sparticuz/chromium';
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
const opt = (name, fallback) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};
if (!opt('--dist')) {
  console.error('用法：node tools/shoot_film_adapter.mjs --dist <构建目录> --out <帧目录> [--dur 秒] [--fps 30] [--w 1280] [--h 720] [--format png|jpeg] [--still 秒]');
  process.exit(2);
}
const dist = path.resolve(opt('--dist', ''));
const outDir = path.resolve(opt('--out', '/tmp/film_frames'));
const format = imageFormatFromArgv(argv);
const ext = frameExtension(format);
const quality = Number(opt('--quality', DEFAULT_JPEG_QUALITY));
const fps = Number(opt('--fps', 30));
const W = Number(opt('--w', 1280));
const H = Number(opt('--h', 720));
const from = Number(opt('--from', 0));
const requestedDur = Number(opt('--dur', 0));
const requestedTo = Number(opt('--to', 0));
const still = opt('--still', null);
const noLyrics = argv.includes('--no-lyrics');

await clearFrames(outDir);
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg', '.m4a': 'audio/mp4', '.wav': 'audio/wav', '.mp4': 'video/mp4',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf', '.json': 'application/json',
};
const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '');
  const file = path.join(dist, rel === '' ? 'index.html' : rel);
  if (!file.startsWith(dist) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const libRoot = await inflate(path.join(process.cwd(), 'node_modules/@sparticuz/chromium/bin/al2023.tar.br'));
process.env.LD_LIBRARY_PATH = `${libRoot}/lib:${process.env.LD_LIBRARY_PATH || ''}`;
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

await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'load', timeout: 180000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForFunction(() => {
  const film = window.__FILM__;
  if (film && typeof film.render === 'function' && (typeof film.ready !== 'function' || film.ready())) return true;
  const mv = window.__mv;
  if (mv && typeof mv.ready === 'function' && !mv.ready()) return false;
  return !!(mv && typeof mv.render === 'function') || typeof window.__mvRender === 'function'
    || typeof window.__seek === 'function' || !!(mv && typeof mv.seek === 'function');
}, { timeout: 300000, polling: 250 });

const adapter = await page.evaluate(() => {
  const film = window.__FILM__;
  if (film && typeof film.render === 'function') return { kind: 'film', duration: Number(film.duration) || 0, fps: Number(film.fps) || 0 };
  const mv = window.__mv;
  if (mv && typeof mv.render === 'function') return { kind: 'mv.render', duration: Number(mv.duration) || 0, fps: Number(mv.fps) || 0 };
  if (typeof window.__mvRender === 'function') return { kind: 'mvRender', duration: 0, fps: 0 };
  return { kind: 'seek', duration: 0, fps: 0 };
});
console.log(`[adapter] ${adapter.kind}`);
const duration = requestedDur || adapter.duration;
if (!(duration > 0)) throw new Error('没有 --dur，且页面没有给出 duration');
const to = requestedTo || duration;

await installCaptureClock(page);
await prepareCaptureStage(page);
await freezePageLoop(page);

async function renderAt(t) {
  await page.evaluate(({ kind, seconds, width, nl }) => {
    if (kind === 'film') return window.__FILM__.render(seconds);
    if (kind === 'mv.render') return window.__mv.render(seconds, false, width);
    if (kind === 'mvRender') return window.__mvRender(seconds, nl);
    const seek = window.__seek || (window.__mv && window.__mv.seek);
    return seek(seconds);
  }, { kind: adapter.kind, seconds: t, width: W, nl: noLyrics });
}

async function shoot(t, file) {
  await renderAt(t);
  await captureFrame(page, { file, format, quality });
}

if (still !== null) {
  const file = path.join(outDir, `still_${Number(still).toFixed(2)}.${ext}`);
  await shoot(Number(still), file);
  console.log(`STILL ${file}`);
} else {
  const total = Math.max(0, Math.round((to - from) * fps));
  for (let i = 0; i < total; i++) {
    const t = from + i / fps;
    await shoot(t, path.join(outDir, `f${String(i).padStart(5, '0')}.${ext}`));
    if (i % 150 === 0 && i > 0) console.log(`${i}/${total} frames`);
  }
  console.log(`SHOT_OK ${total} ${format.toUpperCase()} frames → ${outDir}`);
}
await browser.close();
server.close();
