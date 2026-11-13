import { createCanvas, GlobalFonts, loadImage } from '@napi-rs/canvas';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { assetNames, defaultOptions, renderMV, type ImageAssets } from '../src/lib/renderMV';
import { chapters, DURATION, lyrics, srtContent } from '../src/data/mv';

const root = process.cwd();
const output = path.join(root, 'public/assets');
await mkdir(output, { recursive: true });
GlobalFonts.registerFromPath(path.join(output, 'ZCOOLKuaiLe-Regular.ttf'), 'ZCOOL KuaiLe');
const assets: ImageAssets = {};
await Promise.all(assetNames.map(async (name) => {
  const extension = name.startsWith('scene-') ? 'jpg' : 'png';
  assets[name] = await loadImage(path.join(output, `${name}.${extension}`)) as unknown as CanvasImageSource;
}));

const canvas = createCanvas(1280, 720);
const ctx = canvas.getContext('2d') as unknown as CanvasRenderingContext2D;

for (const chapter of chapters) {
  renderMV(ctx, assets, chapter.sample, defaultOptions);
  await writeFile(path.join(output, `chapter-${chapter.id}.jpg`), await canvas.encode('jpeg', 88));
}
await writeFile(path.join(output, 'back-to-back.srt'), srtContent());
console.log('Six chapter thumbnails and SRT generated.');

if (process.argv.includes('--stills')) process.exit(0);

const fps = 24;
const frameCount = Math.ceil(DURATION * fps);
const ffmpeg = spawn(process.env.FFMPEG_PATH ?? 'ffmpeg', [
  '-y', '-loglevel', 'warning',
  '-f', 'image2pipe', '-framerate', String(fps), '-vcodec', 'mjpeg', '-i', '-',
  '-i', path.join(output, 'back-to-back.mp3'),
  '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '21',
  '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-t', String(DURATION),
  '-movflags', '+faststart', path.join(output, 'back-to-back-mv.mp4'),
], { stdio: ['pipe', 'inherit', 'inherit'] });

const finished = once(ffmpeg, 'close');
ffmpeg.on('error', (error) => { console.error(error); process.exit(1); });
const started = Date.now();
for (let frame = 0; frame < frameCount; frame++) {
  renderMV(ctx, assets, frame / fps, defaultOptions);
  const buffer = await canvas.encode('jpeg', 91);
  if (!ffmpeg.stdin.write(buffer)) await once(ffmpeg.stdin, 'drain');
  if (frame % (fps * 10) === 0) console.log(`Rendered ${(frame / fps).toFixed(0)} / ${DURATION} seconds (${((Date.now() - started) / 1000).toFixed(1)}s elapsed)`);
}
ffmpeg.stdin.end();
const [code] = await finished;
if (code !== 0) throw new Error(`Encoder failed with exit code ${code}`);
await writeFile(path.join(output, 'render-info.json'), JSON.stringify({
  title: '背对背拥抱', width: 1280, height: 720, fps, duration: DURATION, frameCount,
  lyricLines: lyrics.length, audio: 'Supplied branch audio, transcoded without timing edits',
  captionAlignment: 'Line boundaries sampled from source MV at 4 fps. Character timing interpolated; not vocally verified.',
  renderer: 'Shared deterministic Canvas2D renderer with paper-depth typography',
  buildTimeSeconds: (Date.now() - started) / 1000,
}, null, 2));
console.log('MP4 render complete.');