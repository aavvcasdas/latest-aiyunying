// Shared capture/quality defaults for every Vite / Remotion frame exporter.
// The canonical numbers live in tools/render_defaults.json; Python encoders read it too.
import defaults from './render_defaults.json' with { type: 'json' };

export const DEFAULT_IMAGE_FORMAT = defaults.imageFormat;
export const DEFAULT_JPEG_QUALITY = defaults.jpegQuality;
export const DEFAULT_CRF = defaults.crf;
export const DEFAULT_MAXRATE = defaults.maxrate;
export const VISUAL_QUALITY_PROFILE = Object.freeze({ ...defaults.visualQuality });

export function imageFormatFromArgv(argv, aliases = ['--format', '--image-format']) {
  let raw = DEFAULT_IMAGE_FORMAT;
  for (const name of aliases) {
    const i = argv.indexOf(name);
    if (i >= 0 && argv[i + 1]) { raw = argv[i + 1]; break; }
  }
  const value = String(raw).toLowerCase();
  if (!['png', 'jpeg', 'jpg'].includes(value)) throw new Error(`未知图片格式：${raw}（可选 png / jpeg）`);
  return value === 'jpg' ? 'jpeg' : value;
}

export function frameExtension(format) { return format === 'jpeg' ? 'jpg' : 'png'; }

export function screenshotOptions(format, quality, extra = {}) {
  if (format === 'jpeg') return { type: 'jpeg', quality, optimizeForSpeed: true, ...extra };
  return { type: 'png', ...extra };
}

export function dataUrlToBuffer(url) {
  if (typeof url !== 'string' || !url.includes(',')) throw new Error('截帧钩子没有返回 dataURL');
  return Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
}

/** Save the original rAF before a capture script freezes the page's animation loop. */
export async function installCaptureClock(page) {
  await page.evaluate(() => {
    if (!window.__filmRAF) window.__filmRAF = window.requestAnimationFrame.bind(window);
  });
}

/** Stop the page's own playback loop so it cannot race the deterministic frame exporter. */
export async function freezePageLoop(page) {
  await page.evaluate(() => { window.requestAnimationFrame = () => 0; });
}

/** Wait two real animation frames using the saved clock, even after rAF was frozen. */
export async function settleFrame(page) {
  await page.evaluate(() => new Promise((resolve) => {
    const raf = window.__filmRAF || window.requestAnimationFrame.bind(window);
    raf(() => raf(resolve));
  }));
}

/** Make the largest canvas's stage fill the viewport and hide unrelated UI. */
export async function prepareCaptureStage(page) {
  await page.evaluate(() => {
    const canvases = [...document.querySelectorAll('canvas')].sort((a, b) => b.width * b.height - a.width * a.height);
    const canvas = canvases[0];
    // 页面可以用 window.__captureStage 指定「整页出片」的舞台（例如 3D 视口 + 内嵌字幕条的那一层），
    // 不指定时退回 canvas 的父元素。
    const custom = (typeof window.__captureStage === 'function' && window.__captureStage()) || null;
    const stage = custom || canvas?.parentElement;
    if (!stage) return;
    document.documentElement.style.background = '#000';
    document.body.style.overflow = 'hidden';
    document.body.style.visibility = 'hidden';
    const keep = new Set();
    let node = stage;
    while (node && node !== document.body) { keep.add(node); node.style.visibility = 'visible'; node = node.parentElement; }
    for (const child of document.body.children) if (!keep.has(child)) child.style.visibility = 'hidden';
    Object.assign(stage.style, {
      visibility: 'visible', position: 'fixed', left: '0', top: '0',
      width: '100vw', height: '100vh', aspectRatio: 'auto', borderRadius: '0',
      margin: '0', boxShadow: 'none', outline: 'none',
    });
    // 页面自己指定舞台时不要动 canvas 尺寸：那个舞台里通常还有 canvas 之外的东西（比如字幕条），
    // 把 canvas 拉到 100% 会把它盖住。
    if (canvas && !custom) Object.assign(canvas.style, { width: '100%', height: '100%', objectFit: 'contain' });
    document.querySelectorAll('audio,video').forEach((el) => { el.pause(); el.muted = true; });
  });
}

/** Prefer a whole-page screenshot: DOM flashes / fades / borders stay in the frame. */
export async function captureFrame(page, { file, format, quality }) {
  await settleFrame(page);
  await page.screenshot(screenshotOptions(format, quality, { path: file, captureBeyondViewport: false }));
}

/** Lossless PNG straight from the largest canvas; used only when DOM overlays are known absent. */
export async function canvasPngDataUrl(page) {
  return page.evaluate(() => {
    const c = [...document.querySelectorAll('canvas')].sort((a, b) => b.width * b.height - a.width * a.height)[0];
    if (!c) throw new Error('页面里没有 canvas');
    return c.toDataURL('image/png');
  });
}

export async function clearFrames(outDir) {
  const fs = await import('node:fs');
  const path = await import('node:path');
  fs.mkdirSync(outDir, { recursive: true });
  for (const f of fs.readdirSync(outDir)) if (/\.(png|jpe?g)$/i.test(f)) fs.unlinkSync(path.join(outDir, f));
}
