import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { inflate } from '/home/user/sandbox/node_modules/@sparticuz/chromium/build/esm/lambdafs.js';

const dist = path.resolve('dist');
const MIME = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.png':'image/png','.mp3':'audio/mpeg','.ttf':'font/ttf'};
const server = http.createServer((req,res)=>{
  const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/,'');
  const file = path.join(dist, rel === '' ? 'index.html' : rel);
  if (!file.startsWith(dist) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, {'content-type': MIME[path.extname(file)] || 'application/octet-stream'});
  fs.createReadStream(file).pipe(res);
});
const libRoot = await inflate(path.join(process.cwd(), 'node_modules/@sparticuz/chromium/bin/al2023.tar.br'));
process.env.LD_LIBRARY_PATH = `${libRoot}/lib:${process.env.LD_LIBRARY_PATH || ''}`;
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const port = server.address().port;
const browser = await puppeteer.launch({
  executablePath: await chromium.executablePath(),
  headless: true,
  args: [...chromium.args, '--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'],
  defaultViewport: { width: 1920, height: 1080 },
});
const page = await browser.newPage();
page.on('console', m => { if (m.type()==='error') console.log('[console]', m.text().slice(0,300)); });
await page.goto(`http://127.0.0.1:${port}/?clean`, {waitUntil:'load', timeout:120000});
await page.waitForFunction(()=>!!window.__mv && window.__mv.ready(), {timeout:120000});
await page.evaluate(()=>document.fonts.ready);
const caps = await page.evaluate(() => ({
  videoEncoder: typeof VideoEncoder !== 'undefined',
  audioEncoder: typeof AudioEncoder !== 'undefined',
}));
console.log('WebCodecs:', JSON.stringify(caps));

// Test the real export entry (1280x720) via module import through the app bundle is not exposed;
// use page-level runtime check of encoder support + capture 3 frames as sanity.
for (const t of [12.5, 30.6, 78.6]) {
  await page.evaluate((tt)=>window.__seek(tt), t);
  await new Promise(r=>setTimeout(r,650));
  await page.screenshot({path:`/tmp/ref/shots/fix${t}.png`});
}
await browser.close(); server.close();
