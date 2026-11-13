// 把 番外MV/红色高跟鞋 逐帧截下来，再和音轨合成 MP4。
//
// 这支片子整幅画面都在一张 2D canvas 上（renderFilm 是 t 的纯函数），所以抽帧就是
// 「让页面画第 n 帧 → toBlob → POST 回来」，不经过 CDP 的 base64，也不需要整页截图
// （无显卡机器上整页截图每张要六秒）。
//
// 用法：
//   node tools/shoot_hsg.mjs --dist 番外MV/红色高跟鞋/dist --frames /tmp/hsgframes
//   可选：--from 秒  --to 秒  --fps 30  --audio 番外MV/红色高跟鞋/src/mv/assets/song.mp3
//         --out 番外MV/红色高跟鞋/成片/红色高跟鞋.mp4  --still 秒  --crf 23
// 说明：帧落在系统临时目录，成片才写回仓库（*.mp4 默认不进库，要入库得显式 git add -f）。
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const arg = (n, d) => {
  const i = process.argv.indexOf(n);
  return i > 0 ? process.argv[i + 1] : d;
};

const dist = path.resolve(REPO, arg('--dist', '番外MV/红色高跟鞋/dist'));
const outDir = path.resolve(arg('--frames', path.join(process.env.TMPDIR || '/tmp', 'hsgframes')));
const audio = path.resolve(REPO, arg('--audio', '番外MV/红色高跟鞋/src/mv/assets/song.mp3'));
const outFile = path.resolve(REPO, arg('--out', '番外MV/红色高跟鞋/成片/红色高跟鞋.mp4'));
const CRF = String(arg('--crf', '20'));
const FPS = Number(arg('--fps', 30));
const W = 1920;
const H = 1080;
const from = Number(arg('--from', 0));
const to = Number(arg('--to', 0));

if (!fs.existsSync(path.join(dist, 'index.html'))) {
  console.error(`找不到 ${dist}/index.html，先在 番外MV/红色高跟鞋 里构建（vite build）`);
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });
for (const f of fs.readdirSync(outDir)) if (f.endsWith('.jpg')) fs.unlinkSync(path.join(outDir, f));

/* ---------------- 静态服务器 ---------------- */
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.json': 'application/json',
};
const server = http.createServer((req, res) => {
  // 页面把画好的 JPEG POST 回来
  if (req.method === 'POST' && (req.url || '').startsWith('/frame')) {
    const n = Number(new URL(req.url, 'http://x').searchParams.get('n'));
    const file = path.join(outDir, `f${String(n).padStart(5, '0')}.jpg`);
    const ws = fs.createWriteStream(file);
    req.pipe(ws);
    ws.on('finish', () => { res.writeHead(200); res.end('ok'); });
    ws.on('error', () => { res.writeHead(500); res.end('write failed'); });
    return;
  }
  const rel = decodeURIComponent((req.url || '/').split('?')[0]);
  const file = path.join(dist, rel === '/' ? 'index.html' : rel.slice(1));
  if (!file.startsWith(dist) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '0.0.0.0', r));
const port = server.address().port;

/* ---------------- 浏览器 ---------------- */
const exe = await chromium.executablePath();
process.env.LD_LIBRARY_PATH = ['/tmp/al2023/lib', '/tmp/al2023', '/tmp', process.env.LD_LIBRARY_PATH || ''].join(':');
const browser = await puppeteer.launch({
  executablePath: exe,
  env: { ...process.env },
  headless: true,
  args: [...chromium.args, '--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  defaultViewport: { width: W, height: H, deviceScaleFactor: 1 },
});
const page = await browser.newPage();
page.on('console', (m) => { if (m.type() === 'error') console.log('[page]', m.text().slice(0, 200)); });
page.on('pageerror', (e) => console.log('[page:error]', String(e).slice(0, 300)));

await page.goto(`http://127.0.0.1:${port}/?render=1`, { waitUntil: 'load', timeout: 180000 });
await page.waitForFunction('window.__ready === true || window.__error', { timeout: 300000 });
const err = await page.evaluate(() => window.__error || '');
if (err) {
  console.error('页面报错：', err);
  await browser.close();
  server.close();
  process.exit(1);
}

// 画第 n 帧并把 JPEG POST 回去（页面内完成，二进制只走一次 HTTP）
await page.evaluate(() => {
  window.__capture = async (t, n) => {
    window.__setFrame(t);
    const cv = document.querySelector('canvas');
    const blob = await new Promise((res) => cv.toBlob(res, 'image/jpeg', 0.95));
    await fetch(`/frame?n=${n}`, { method: 'POST', body: blob });
    return true;
  };
});

// 只抽一帧看构图
const still = arg('--still', null);
if (still !== null) {
  const t = Number(still);
  const b64 = await page.evaluate(async (tt) => {
    window.__setFrame(tt);
    const cv = document.querySelector('canvas');
    const blob = await new Promise((res) => cv.toBlob(res, 'image/png'));
    return await new Promise((res) => {
      const fr = new FileReader();
      fr.onload = () => res(String(fr.result));
      fr.readAsDataURL(blob);
    });
  }, t);
  const outp = path.join(outDir, `still_${t}s.png`);
  fs.writeFileSync(outp, Buffer.from(b64.slice(b64.indexOf(',') + 1), 'base64'));
  await browser.close();
  server.close();
  console.log(`STILL ${outp}`);
  process.exit(0);
}

const duration = await page.evaluate(() => window.__ready && 47.63);
const end = to > 0 ? Math.min(to, duration) : duration - 1 / FPS;
const total = Math.max(1, Math.round((end - from) * FPS));
console.log(`[shot] ${from.toFixed(2)}s → ${end.toFixed(2)}s，共 ${total} 帧 → ${outDir}`);

const t0 = Date.now();
for (let i = 0; i < total; i++) {
  const t = from + i / FPS;
  const ok = await page.evaluate((tt, n) => window.__capture(tt, n), t, i);
  if (!ok) throw new Error(`第 ${i} 帧没画出来`);
  if ((i + 1) % 150 === 0) {
    const sec = (Date.now() - t0) / 1000;
    const rate = (i + 1) / sec;
    console.log(`  ${i + 1}/${total} · ${rate.toFixed(2)} fps · 还需 ${Math.round((total - i - 1) / Math.max(0.01, rate))}s`);
  }
}
await browser.close();
server.close();
console.log(`SHOT_OK ${total} 帧 · ${((Date.now() - t0) / 1000).toFixed(0)}s`);

/* ---------------- 合成 ---------------- */
const FFDIR = path.join(REPO, 'node_modules/@remotion/compositor-linux-x64-gnu');
const ffmpeg = path.join(FFDIR, 'ffmpeg');
process.env.LD_LIBRARY_PATH = `${FFDIR}:${process.env.LD_LIBRARY_PATH || ''}`;

fs.mkdirSync(path.dirname(outFile), { recursive: true });
const run = (args) =>
  new Promise((res, rej) => {
    const p = spawn(ffmpeg, args, { stdio: ['ignore', 'inherit', 'inherit'] });
    p.on('close', (c) => (c === 0 ? res() : rej(new Error(`ffmpeg 退出码 ${c}`))));
  });

await run([
  '-y', '-framerate', String(FPS), '-i', path.join(outDir, 'f%05d.jpg'),
  '-i', audio,
  '-c:v', 'libx264', '-preset', 'medium', '-crf', CRF, '-pix_fmt', 'yuv420p',
  '-c:a', 'aac', '-b:a', '192k',
  '-shortest', '-movflags', '+faststart',
  outFile,
]);
const mb = (fs.statSync(outFile).size / 1048576).toFixed(1);
console.log(`DONE ${path.relative(REPO, outFile)} · ${mb} MB`);
