// 把 番外MV/坏女孩Fable 这份 Canvas2D 引擎工程用 Remotion 出成 MP4（画面 + 内嵌音轨一起出）。
// 用法：node tools/render_zip_mv.mjs fable [--frames a:b] [--still 秒] [--out 路径]
//       入口、合成 id、public 目录都写在下面的 PROJECTS 里，加一部新片子就加一条。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import chromium from '@sparticuz/chromium';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FFDIR = path.join(REPO, 'node_modules/@remotion/compositor-linux-x64-gnu');
process.env.LD_LIBRARY_PATH = `${FFDIR}:${process.env.LD_LIBRARY_PATH || ''}`;
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
  concurrency: Number(process.env.CONCURRENCY || 2),
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

const size = fs.statSync(outFile).size;
console.log(`DONE ${path.relative(REPO, outFile)} · ${(size / 1048576).toFixed(1)} MB`);
