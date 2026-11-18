// Offline export uses the same deterministic renderer as the interactive film.
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { mkdir, copyFile, unlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { pathToFileURL } from 'node:url'

const require = createRequire(resolve(process.env.TOOLS_DIR || '.', 'package.json'))
const { chromium } = require('playwright')
const serverChromium = (await import(pathToFileURL(require.resolve('@sparticuz/chromium')).href)).default
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || await serverChromium.executablePath(), args: serverChromium.args, headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
const fps = 24, duration = 152.13
const output = 'public/downloads/someone-like-me.mp4'
const temporary = resolve(tmpdir(), `whale-cinema-${process.pid}.mp4`)
await mkdir('public/downloads', { recursive: true })
try {
  await page.route('**/__offline-render', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><head><style>@font-face{font-family:"Film Serif";src:url("/fonts/film-serif.woff2");font-weight:600}</style></head><body></body></html>' }))
  await page.goto(new URL('/__offline-render', process.env.BASE_URL || 'http://localhost:5173/').href)
  await page.evaluate(async () => {
    const { loadFilm, drawFilm } = await import('/src/film/render.ts')
    const assets = await loadFilm()
    const canvas = document.createElement('canvas')
    canvas.width = 1280; canvas.height = 720
    const ctx = canvas.getContext('2d', { alpha: false })
    window.filmFrame = time => {
      drawFilm(ctx, assets, time, true, 'character', false)
      return canvas.toDataURL('image/jpeg', .94).split(',')[1]
    }
  })
  const ff = spawn(process.env.FFMPEG || 'ffmpeg', ['-y', '-hide_banner', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-vcodec', 'mjpeg', '-i', 'pipe:0', '-i', 'public/media/film-audio.m4a', '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'libx264', '-preset', 'veryfast', '-threads', '2', '-crf', '22', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-t', String(duration), '-movflags', '+faststart', '-metadata', 'title=譬如我 | Someone Like Me', '-metadata', 'comment=Whale Cinema. Original chapter film with audio-aligned kinetic subtitles.', temporary], { stdio: ['pipe', 'ignore', 'inherit'] })
  const finished = once(ff, 'close')
  for (let i = 0; i < Math.ceil(duration*fps); i++) {
    const frame = await page.evaluate(t => window.filmFrame(t), i/fps)
    if (!ff.stdin.write(Buffer.from(frame, 'base64'))) await once(ff.stdin, 'drain')
    if (i % (fps*10) === 0) console.log(`Rendered ${(i/fps).toFixed(0)} / ${duration} seconds`)
  }
  ff.stdin.end()
  const [code] = await finished
  if (code !== 0) throw new Error(`FFmpeg exited with ${code}`)
  await copyFile(temporary, output)
  await unlink(temporary)
  console.log(`Exported ${output}`)
} finally { await browser.close() }