// 把 番外MV/背对背拥抱 这支 three.js + DOM 叠层的 MV 逐帧截下来，再和音频合成 MP4。
//
// 和 tools/shoot_mv.mjs 的区别：
//   · 那支坏女孩整幅画面在 canvas 上，toDataURL 一把就够；
//   · 这支的字幕条 / 字卡 / 闪白式叠层，出片时改由页面自己画进同一张 2D canvas
//     （见 src/lib/lyricCanvas.ts 与 App 里的出片桥），再整张 POST 回来。
//     走整页截图会慢一个量级：无显卡机器上 SwiftShader 每张要六秒。
//
// 用法：
//   node tools/shoot_bb.mjs --dist 番外MV/背对背拥抱/dist --frames /tmp/bbframes
//   可选：--from 秒  --to 秒  --fps 30  --audio 背对背拥抱.mp3  --out 成片/背对背拥抱.mp4
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

const dist = path.resolve(REPO, arg('--dist', '番外MV/背对背拥抱/dist'));
const outDir = path.resolve(arg('--frames', path.join(process.env.TMPDIR || '/tmp', 'bbframes')));
const audio = path.resolve(REPO, arg('--audio', '背对背拥抱.mp3'));
const outFile = path.resolve(REPO, arg('--out', '番外MV/背对背拥抱/成片/背对背拥抱.mp4'));
const FPS = Number(arg('--fps', 30));
const WORKERS = Math.max(1, Number(arg('--workers', 1)));
const W = 1600;
const H = 900;
const from = Number(arg('--from', 0));
const to = Number(arg('--to', 0));

if (!fs.existsSync(path.join(dist, 'index.html'))) {
  console.error(`找不到 ${dist}/index.html，先在 番外MV/背对背拥抱 里 npm run build`);
  process.exit(1);
}

fs.mkdirSync(outDir, { recursive: true });
for (const f of fs.readdirSync(outDir)) if (f.endsWith('.jpg')) fs.unlinkSync(path.join(outDir, f));

/* ---------------- 起一个静态服务器 ---------------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.png': 'image/png', '.ttf': 'font/ttf', '.m4a': 'audio/mp4' };
const server = http.createServer((req, res) => {
  // 页面把合成好的 JPEG 直接 POST 回来：二进制只走一次 HTTP，不经过 CDP 的 base64。
  // 帧号写在查询串里（多个窗口并行时各写各的，不会串号）。
  if (req.method === 'POST' && (req.url || '').startsWith('/frame')) {
    const n = Number(new URL(req.url, 'http://x').searchParams.get('n'));
    const file = path.join(outDir, `f${String(n).padStart(5, '0')}.jpg`);
    const ws = fs.createWriteStream(file);
    req.pipe(ws);
    ws.on('finish', () => {
      res.writeHead(200);
      res.end('ok');
    });
    ws.on('error', () => {
      res.writeHead(500);
      res.end('write failed');
    });
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
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

/* ---------------- 起浏览器（多窗口并行） ---------------- */
const exe = await chromium.executablePath();
process.env.LD_LIBRARY_PATH = ['/tmp/al2023/lib', '/tmp/al2023', '/tmp', process.env.LD_LIBRARY_PATH || ''].join(':');
const LAUNCH = {
  executablePath: exe,
  env: { ...process.env },
  headless: true,
  args: [...chromium.args, '--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  defaultViewport: { width: W, height: H, deviceScaleFactor: 1 },
};

async function openWorker() {
  const browser = await puppeteer.launch(LAUNCH);
  const page = await browser.newPage();
  page.on('console', (m) => {
    if (m.type() === 'error') console.log('[page]', m.text().slice(0, 200));
  });
  page.on('pageerror', (e) => console.log('[page:error]', String(e).slice(0, 300)));
  // ?render=1：隐藏所有叠加层（面板/片头卡/镜号轨/时码/角标），时间交给出片桥
  await page.goto(`http://127.0.0.1:${port}/?render=1`, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction('window.__mv && window.__mv.ready', { timeout: 300000 });
  return { browser, page };
}

const first = await openWorker();
const duration = await first.page.evaluate(() => window.__mv.duration);
const cues = await first.page.evaluate(() => window.__mv.cues);
console.log(`[mv] ${cues} 镜 · ${duration.toFixed(3)}s · ${FPS}fps · ${WORKERS} 个窗口`);

// 抽帧：只要这一秒的一张，方便看构图
const still = arg('--still', null);
if (still !== null) {
  const t = Number(still);
  const blobB64 = await first.page.evaluate(async (tt) => {
    const b = await window.__mv.capture(tt);
    if (!b) return '';
    return await new Promise((res) => {
      const fr = new FileReader();
      fr.onload = () => res(String(fr.result));
      fr.readAsDataURL(b);
    });
  }, t);
  const outp = path.join(outDir, `still_${t}s.jpg`);
  fs.writeFileSync(outp, Buffer.from(blobB64.slice(blobB64.indexOf(',') + 1), 'base64'));
  await first.browser.close();
  server.close();
  console.log(`STILL ${outp}`);
  process.exit(0);
}

const end = to > 0 ? Math.min(to, duration) : duration - 1 / FPS;
const total = Math.max(1, Math.round((end - from) * FPS));
console.log(`[shot] ${from.toFixed(2)}s → ${end.toFixed(2)}s，共 ${total} 帧 → ${outDir}`);

const workers = [first];
for (let k = 1; k < WORKERS; k++) workers.push(await openWorker());

const t0 = Date.now();
let next = 0;
let done = 0;

async function runWorker(w) {
  for (;;) {
    const i = next++;
    if (i >= total) return;
    const t = from + i / FPS;
    // 页面里把 3D 画布 + 字卡 + 字幕合成一张 1600×900，然后自己 POST 回来
    const ok = await w.page.evaluate(
      async (tt, n) => {
        const blob = await window.__mv.capture(tt);
        if (!blob) return false;
        await fetch(`/frame?n=${n}`, { method: 'POST', body: blob });
        return true;
      },
      t,
      i,
    );
    if (!ok) throw new Error(`第 ${i} 帧没合成出来`);
    done++;
    if (done % 150 === 0) {
      const sec = (Date.now() - t0) / 1000;
      const rate = done / sec;
      console.log(`  ${done}/${total} · ${rate.toFixed(2)} fps · 还需 ${Math.round((total - done) / Math.max(0.01, rate))}s`);
    }
  }
}

await Promise.all(workers.map(runWorker));
for (const w of workers) await w.browser.close();
server.close();
console.log(`SHOT_OK ${total} 帧 · ${((Date.now() - t0) / 1000).toFixed(0)}s`);

/* ---------------- 合成 ---------------- */
const FFDIR = path.join(REPO, 'node_modules/@remotion/compositor-linux-x64-gnu');
const ffmpeg = path.join(FFDIR, 'ffmpeg');
process.env.LD_LIBRARY_PATH = `${FFDIR}:${process.env.LD_LIBRARY_PATH || ''}`;

if (audio && fs.existsSync(audio)) {
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  const ss = from > 0 ? ['-ss', String(from)] : [];
  const dur = ['-t', String(end - from)];
  const args = [
    '-y',
    '-framerate', String(FPS),
    '-i', path.join(outDir, 'f%05d.jpg'),
    ...ss, '-i', audio, ...dur,
    '-map', '0:v:0', '-map', '1:a:0',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '192k',
    '-shortest',
    outFile,
  ];
  console.log(`[mux] ffmpeg → ${path.relative(REPO, outFile)}`);
  await new Promise((resolve, reject) => {
    const p = spawn(ffmpeg, args, { stdio: ['ignore', 'inherit', 'inherit'], env: process.env });
    p.on('exit', (c) => (c === 0 ? resolve() : reject(new Error(`ffmpeg 退出码 ${c}`))));
  });
  const size = fs.statSync(outFile).size;
  console.log(`DONE ${path.relative(REPO, outFile)} · ${(size / 1048576).toFixed(1)} MB`);
} else {
  console.log('没有音源，只出帧');
}
