#!/usr/bin/env node
// Capture the whole 本鲸 action set through the real 通用模板 preview engine.
//
// Start `npm run preview` first, then run `npm run clarity:shoot`. The script
// opens the `whale-clarity` project in Chromium, forces the Remotion player to
// its native 1920×1080 composition size, hides UI chrome / controls, seeks to
// each of the 13 action shots and saves a lossless PNG for each one. It also
// saves the full preview UI as context and a JSON manifest of what it saw.
import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import chromium, { inflate } from '@sparticuz/chromium';

const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};
const url = opt('--url', 'http://127.0.0.1:5173/#whale-clarity');
const outDir = path.resolve(opt('--out', 'docs/quality_comparison/whale_redraw/template_clarity'));
const prefix = opt('--prefix', 'template');
const W = Number(opt('--w', 1920));
const H = Number(opt('--h', 1080));
fs.mkdirSync(outDir, { recursive: true });

const errors = [];
const libRoot = await inflate(path.join(process.cwd(), 'node_modules/@sparticuz/chromium/bin/al2023.tar.br'));
process.env.LD_LIBRARY_PATH = `${libRoot}/lib:${process.env.LD_LIBRARY_PATH || ''}`;
const browser = await puppeteer.launch({
  executablePath: await chromium.executablePath(),
  env: { ...process.env },
  headless: true,
  args: [...chromium.args, '--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'],
  defaultViewport: { width: 1600, height: 1000, deviceScaleFactor: 1 },
});
const page = await browser.newPage();
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
page.on('requestfailed', (r) => errors.push(`requestfailed: ${r.url()} ${r.failure()?.errorText || ''}`));

await page.goto(url, { waitUntil: 'networkidle2', timeout: 180000 });
await page.evaluate(() => document.fonts.ready);
await page.waitForSelector('.player canvas', { timeout: 180000 });
await page.waitForFunction(() => !document.querySelector('.err') && !document.querySelector('.empty'), { timeout: 180000 });
await new Promise((r) => setTimeout(r, 1200));

// Make sure the QA project is selected even if the hash was ignored.
await page.evaluate(() => {
  const on = document.querySelector('.tab.on');
  if (!on || !on.textContent.includes('本鲸清晰度')) {
    const tab = [...document.querySelectorAll('.tab')].find((b) => b.textContent.includes('本鲸清晰度'));
    tab?.click();
  }
});
await new Promise((r) => setTimeout(r, 1200));
const selected = await page.evaluate(() => document.querySelector('.tab.on')?.textContent?.trim() || '');
if (!selected.includes('本鲸清晰度')) throw new Error(`whale-clarity tab not selected: ${selected}`);
await page.screenshot({ path: path.join(outDir, 'preview_ui.png') });

// Hide the lyric bar, then force the player to native 1920×1080 and remove all chrome.
await page.evaluate(() => {
  const b = [...document.querySelectorAll('button')].find((x) => x.textContent.includes('隐藏字幕'));
  b?.click();
});
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
await page.evaluate(({ width, height }) => {
  const app = document.querySelector('.app'); const top = document.querySelector('.top');
  const main = document.querySelector('.main'); const stage = document.querySelector('.stage');
  const side = document.querySelector('.side'); const player = document.querySelector('.player');
  document.body.style.margin = '0'; document.body.style.overflow = 'hidden';
  app.style.gridTemplateRows = '1fr'; top.style.display = 'none';
  main.style.gridTemplateColumns = '1fr'; side.style.display = 'none';
  stage.style.padding = '0'; stage.style.overflow = 'hidden';
  for (const sel of ['.meta', '.ctrl', '.now']) document.querySelector(sel)?.setAttribute('style', 'display:none!important');
  player.style.width = `${width}px`; player.style.height = `${height}px`;
  player.style.border = '0'; player.style.borderRadius = '0'; player.style.position = 'relative';
  const wrapper = player.querySelector(':scope > div:last-child');
  if (!wrapper) return;
  [...wrapper.children].slice(1).forEach((c) => { c.style.display = 'none'; });
  const inner = wrapper.firstElementChild;
  if (inner) {
    inner.style.width = `${width}px`; inner.style.height = `${height}px`;
    inner.style.left = '0'; inner.style.top = '0';
    const rp = inner.querySelector('.__remotion-player');
    if (rp) {
      rp.style.transform = 'none'; rp.style.marginLeft = '0'; rp.style.marginTop = '0';
      rp.style.width = `${width}px`; rp.style.height = `${height}px`;
    }
  }
}, { width: W, height: H });
await new Promise((r) => setTimeout(r, 700));

const shots = await page.evaluate(() => [...document.querySelectorAll('.side .shot')].map((b) => ({
  id: b.querySelector('b')?.textContent?.trim() || '',
  text: b.textContent.replace(/\s+/g, ' ').trim(),
})));
if (shots.length !== 13) throw new Error(`expected 13 whale action shots, got ${shots.length}`);

for (let i = 0; i < shots.length; i++) {
  const { id } = shots[i];
  const name = id.replace(/^A\d+_/, '');
  await page.evaluate((n) => document.querySelectorAll('.side .shot')[n].click(), i);
  await page.waitForFunction((want) => document.querySelector('.shot.on b')?.textContent?.trim() === want, { timeout: 30000 }, id);
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await new Promise((r) => setTimeout(r, 220));
  const file = path.join(outDir, `${prefix}_${String(i + 1).padStart(2, '0')}_${name}.png`);
  await page.screenshot({ path: file, clip: { x: 0, y: 0, width: W, height: H } });
  shots[i].file = path.relative(process.cwd(), file);
  shots[i].frame = Number((shots[i].text.match(/第\s*(\d+)\s*帧/) || [])[1] ?? -1);
}

const report = {
  url, selected, width: W, height: H, shots, errors,
  status: errors.length ? 'errors' : 'ok',
};
fs.writeFileSync(path.join(outDir, 'template_clarity.json'), JSON.stringify(report, null, 2) + '\n');
console.log(`PREVIEW_CLARITY_${report.status.toUpperCase()} 13 shots · ${W}×${H} · errors ${errors.length} → ${outDir}`);
if (errors.length) console.log(errors.join('\n'));
await browser.close();
if (errors.length) process.exitCode = 1;
