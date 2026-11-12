// 把 番外MV/坏女孩Fable 这份 Canvas2D 引擎工程用 Remotion 出成 MP4（画面 + 内嵌音轨一起出）。
// 用法：node tools/render_zip_mv.mjs fable [--frames a:b] [--still 秒] [--out 路径]
//       入口、合成 id、public 目录都写在下面的 PROJECTS 里，加一部新片子就加一条。
import fs from 'node:fs';
import { brotliDecompressSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import chromium from '@sparticuz/chromium';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FFDIR = path.join(REPO, 'node_modules/@remotion/compositor-linux-x64-gnu');
process.env.LD_LIBRARY_PATH = `${FFDIR}:${process.env.LD_LIBRARY_PATH || ''}`;
// 非 Lambda Linux 也需要包内的 NSS/NSPR；chromium.executablePath 默认不会在这里解开它们。
if (process.platform === 'linux' && process.arch === 'x64' && !fs.existsSync('/tmp/al2023/lib/libnspr4.so')) {
  const require = createRequire(import.meta.url);
  const bin = path.resolve(path.dirname(require.resolve('@sparticuz/chromium')), '../bin/al2023.tar.br');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mv-chromium-'));
  try {
    const tar = path.join(tmp, 'libs.tar');
    fs.writeFileSync(tar, brotliDecompressSync(fs.readFileSync(bin)));
    fs.mkdirSync('/tmp/al2023', {recursive: true});
    execFileSync('tar', ['xf', tar, '-C', '/tmp/al2023']);
  } finally { fs.rmSync(tmp, {recursive: true, force: true}); }
}
for (const lib of ['/tmp/al2023/lib', '/tmp/al2023', '/tmp']) {
  if (fs.existsSync(lib)) process.env.LD_LIBRARY_PATH = `${lib}:${process.env.LD_LIBRARY_PATH}`;
}

const PROJECTS = {
  three3d: {
    name: '坏女孩（3d · three.js）',
    dir: '番外MV/坏女孩',
    entry: '番外MV/坏女孩/remotion/entry.tsx',
    id: 'ThreeMV',
    publicDir: '番外MV/坏女孩/public',
    out: '番外MV/坏女孩/成片/坏女孩_3d.mp4',
  },
  fable: {
    name: '坏女孩（fable5.2）',
    dir: '番外MV/坏女孩Fable',
    entry: '番外MV/坏女孩Fable/entry.tsx',
    id: 'Fable',
    publicDir: '番外MV/坏女孩Fable/public',
    out: '番外MV/坏女孩Fable/成片/坏女孩_fable5.2.mp4',
  },
};

const argv = process.argv.slice(2);
const key = argv.find((a) => !a.startsWith('--')) || 'fable';
const opt = (n) => { const i = argv.indexOf(n); return i >= 0 ? argv[i + 1] : null; };
const P = PROJECTS[key];
if (!P) { console.error(`没有这个工程：${key}（可选：${Object.keys(PROJECTS).join(' / ')}）`); process.exit(1); }

const entryPoint = path.join(REPO, P.entry);
const publicDir = path.join(REPO, P.publicDir);
const outFile = path.resolve(REPO, opt('--out') || P.out);
fs.mkdirSync(path.dirname(outFile), { recursive: true });

const { bundle } = await import('@remotion/bundler');
const renderer = await import('@remotion/renderer');

const browserExecutable = await chromium.executablePath();
const chromiumOptions = { gl: process.env.FILM_GL || 'swangle' };

console.log(`[bundle] ${P.name} ← ${P.entry}`);
const serveUrl = await bundle({ entryPoint, publicDir, ignoreRegisterRootWarning: true });

const composition = await renderer.selectComposition({ serveUrl, id: P.id, inputProps: {}, browserExecutable, chromiumOptions });
console.log(`[comp] ${composition.id} ${composition.width}×${composition.height} @${composition.fps}fps · ${composition.durationInFrames} 帧`);

const still = opt('--still');
if (still) {
  const frame = Math.round(Number(still) * composition.fps);
  const output = path.join(REPO, P.dir, '成片', `抽帧_${still}s.png`);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  await renderer.renderStill({ composition, serveUrl, output, frame, imageFormat: 'png', inputProps: {}, browserExecutable, chromiumOptions, timeoutInMilliseconds: 180000 });
  console.log(`STILL ${path.relative(REPO, output)}`);
  process.exit(0);
}

const range = opt('--frames');
const frameRange = range ? range.split(':').map(Number) : null;

await renderer.renderMedia({
  composition,
  serveUrl,
  codec: 'h264',
  outputLocation: outFile,
  inputProps: {},
  browserExecutable,
  chromiumOptions,
  concurrency: Number(process.env.CONCURRENCY || 1),
  frameRange,
  imageFormat: 'jpeg',
  jpegQuality: 92,
  crf: 20,
  audioCodec: 'aac',
  audioBitrate: '192k',
  timeoutInMilliseconds: 300000,
  onProgress: ({ renderedFrames, encodedFrames, progress }) => {
    if (renderedFrames % 120 === 0) console.log(`[render] 已渲 ${renderedFrames} / 已编码 ${encodedFrames} · ${(progress * 100).toFixed(1)}%`);
  },
});

// Fable 的音轨无裁切/变速/淡出：直接复用源 AAC 包，避免 Remotion 再编码引入约 2 个 AAC 帧延迟。
// 保留视频逐帧渲染结果，不重编码视频；容器 edit list 保持源 AAC 的首帧补偿。
if (key === 'fable' && !frameRange) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fable-mux-'));
  try {
    const muxed = path.join(tmp, 'final.mp4');
    execFileSync(path.join(FFDIR, 'ffmpeg'), [
      '-v', 'error', '-i', outFile, '-i', path.join(publicDir, 'song.m4a'),
      '-map', '0:v:0', '-map', '1:a:0', '-c', 'copy',
      '-t', String(composition.durationInFrames / composition.fps),
      '-movflags', '+faststart', '-y', muxed,
    ]);
    fs.copyFileSync(muxed, outFile);
  } finally { fs.rmSync(tmp, {recursive: true, force: true}); }
}

const size = fs.statSync(outFile).size;
console.log(`DONE ${path.relative(REPO, outFile)} · ${(size / 1048576).toFixed(1)} MB`);
