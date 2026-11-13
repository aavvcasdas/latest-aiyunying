import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const failures = [];
page.on('pageerror', (error) => failures.push(error.message));
page.on('response', (response) => { if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`); });
await page.goto('http://localhost:5173', { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.locator('.mv-canvas.is-ready').waitFor({ timeout: 60000 });
await page.waitForTimeout(900);
assert.equal(await page.locator('.lyric-line').count(), 48);
assert.match(await page.locator('.lyric-line.current').innerText(), /我们背对背拥抱/);
assert.ok(await page.locator('audio').evaluate((audio) => audio.duration > 234 && audio.duration < 237));
assert.ok(await page.locator('.lyrics-list').evaluate((list) => list.scrollTop > 0));
assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
await page.screenshot({ path: 'reference/desktop.png', fullPage: true });

await page.getByRole('button', { name: '播放', exact: true }).click();
await page.waitForTimeout(1200);
assert.ok(await page.locator('audio').evaluate((audio) => !audio.paused && audio.currentTime > 49));
await page.getByRole('button', { name: '暂停', exact: true }).click();

await page.getByRole('button', { name: '章节 5：向你走去' }).click();
assert.ok(await page.locator('audio').evaluate((audio) => Math.abs(audio.currentTime - 148.5) < 0.1));
await page.getByRole('button', { name: '逐词', exact: true }).click();
assert.equal(await page.getByRole('button', { name: '逐词', exact: true }).getAttribute('aria-pressed'), 'true');
await page.getByRole('switch', { name: '3D 空间字幕' }).click();
assert.equal(await page.getByRole('switch', { name: '3D 空间字幕' }).getAttribute('aria-checked'), 'false');
await page.getByRole('switch', { name: '3D 空间字幕' }).click();
await page.getByRole('button', { name: '整句', exact: true }).click();
assert.equal(await page.getByRole('button', { name: '整句', exact: true }).getAttribute('aria-pressed'), 'true');
await page.getByRole('button', { name: '逐字', exact: true }).click();

await page.getByRole('button', { name: /字幕时间校准/ }).click();
await page.locator('#offset').focus();
for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight');
await page.getByRole('button', { name: '应用时间校准' }).click();
assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('whale-mv-preferences')).offset), 0.25);

await page.getByRole('button', { name: '导出作品', exact: true }).click();
await page.getByRole('button', { name: /歌词字幕 SRT/ }).click();
const srtDownload = page.waitForEvent('download');
await page.getByRole('button', { name: '导出 SRT 字幕' }).click();
const srt = await fs.readFile(await (await srtDownload).path(), 'utf8');
assert.ok(srt.includes('00:00:15,250'));
assert.equal(srt.split('-->').length - 1, 48);
await page.getByRole('button', { name: /分镜工程 JSON/ }).click();
const jsonDownload = page.waitForEvent('download');
await page.getByRole('button', { name: '导出 JSON 工程' }).click();
const project = JSON.parse(await fs.readFile(await (await jsonDownload).path(), 'utf8'));
assert.equal(project.lyrics.length, 48);
assert.equal(project.chapters.length, 6);
assert.equal(project.lyrics[0].characters[0].start, 15.25);
await page.getByRole('button', { name: /完整 MV MP4/ }).click();
const movieDownload = page.waitForEvent('download');
await page.getByRole('button', { name: '下载完整 MP4' }).click();
const moviePath = await (await movieDownload).path();
assert.ok((await fs.stat(moviePath)).size > 1000000);
const metadata = await page.evaluate(() => new Promise((resolve, reject) => {
  const video = document.createElement('video');
  const timer = setTimeout(() => { video.remove(); reject(new Error('MP4 metadata timeout')); }, 15000);
  video.muted = true;
  video.preload = 'metadata';
  video.onloadedmetadata = () => {
    clearTimeout(timer);
    resolve({ width: video.videoWidth, height: video.videoHeight, duration: video.duration });
    video.removeAttribute('src'); video.load(); video.remove();
  };
  video.onerror = () => { clearTimeout(timer); video.remove(); reject(new Error('MP4 decoding failed')); };
  video.src = '/assets/back-to-back-mv.mp4';
}));
assert.equal(metadata.width, 1280);
assert.equal(metadata.height, 720);
assert.ok(Math.abs(metadata.duration - 235.08) < 0.1);
await page.getByRole('button', { name: '关闭弹窗', exact: true }).click();

await page.getByRole('button', { name: '播放设置', exact: true }).click();
await page.getByLabel('播放速度', { exact: true }).selectOption('1.25');
assert.equal(await page.locator('audio').evaluate((audio) => audio.playbackRate), 1.25);
await page.getByRole('button', { name: '播放设置', exact: true }).click();

await page.getByRole('tab', { name: '分镜脚本' }).click();
await page.getByRole('textbox', { name: '搜索分镜' }).fill('拥抱');
assert.ok(await page.locator('.shot-row').count() >= 6);
await page.screenshot({ path: 'reference/storyboard.png', fullPage: false });
await page.getByRole('textbox', { name: '搜索分镜' }).fill('没有这句歌词');
assert.equal(await page.locator('.empty-state').count(), 1);
await page.getByRole('button', { name: '查看全部分镜' }).click();
assert.equal(await page.getByRole('textbox', { name: '搜索分镜' }).inputValue(), '');

await page.getByRole('tab', { name: '人物与素材' }).click();
await page.locator('.cast-choice').filter({ hasText: '小克' }).click();
await page.locator('.action-select select').selectOption('nod');
await page.waitForTimeout(500);
assert.ok(await page.locator('.cast-portrait img').evaluate((image) => image.complete && image.naturalWidth > 0));
await page.screenshot({ path: 'reference/cast.png', fullPage: false });

await page.getByRole('button', { name: '创作偏好', exact: true }).click();
await page.getByRole('button', { name: '恢复默认设置' }).click();
await page.getByRole('button', { name: '保存并继续' }).click();
assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('whale-mv-preferences')).offset), 0);
await page.getByRole('tab', { name: 'MV 预览' }).click();
await page.getByRole('button', { name: '章节 3：背对背的距离' }).click();
await page.getByRole('button', { name: '沉浸播放', exact: true }).click();
assert.equal(await page.locator('.player.is-immersive').count(), 1);
await page.keyboard.press('Escape');
assert.equal(await page.locator('.player.is-immersive').count(), 0);

await page.getByRole('button', { name: '静音', exact: true }).click();
assert.equal(await page.locator('audio').evaluate((audio) => audio.volume), 0);
await page.getByRole('button', { name: '取消静音', exact: true }).click();
assert.ok(await page.locator('audio').evaluate((audio) => audio.volume > 0));

await page.setViewportSize({ width: 390, height: 844 });
await page.waitForTimeout(500);
assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
await page.screenshot({ path: 'reference/mobile.png', fullPage: true });
await page.getByRole('button', { name: '导出作品', exact: true }).click();
assert.ok(await page.locator('[role="dialog"]').isVisible());
await page.screenshot({ path: 'reference/mobile-export.png', fullPage: false });
await page.keyboard.press('Escape');
await page.locator('[role="dialog"]').waitFor({ state: 'hidden' });
assert.equal(await page.locator('[role="dialog"]').count(), 0);

await page.setViewportSize({ width: 768, height: 1024 });
await page.waitForTimeout(300);
assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth));
assert.deepEqual(failures, []);
console.log('PASS: audio, 48 lyrics, seeking, modes, caption toggle, calibration, SRT, JSON, MP4 download/decoding, speed, storyboard search, original character actions, immersive mode, mute, mobile, tablet, no runtime or network errors.');
await browser.close();