import { test, expect } from '@playwright/test';

test('all nine characters have twelve playable motions', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('.action-tile')).toHaveCount(12);
  for (const name of ['鲸鱼娘', '龙娘', '小克', '猫猫', '月球少女', '豆包', '千问', '小狐狸', 'Grok']) {
    await page.getByRole('button', { name: `选择${name}`, exact: true }).click();
    await expect(page.locator('.selected-character strong')).toHaveText(name);
    await expect(page.locator('.action-tile')).toHaveCount(12);
    await page.getByRole('button', { name: '专属动作', exact: true }).click();
    await expect(page.locator('.action-tile')).toHaveCount(2);
    await page.locator('.action-select').first().click();
    await expect(page.locator('.now-playing strong')).not.toHaveText('待机呼吸');
  }
  expect(errors).toEqual([]);
});

test('player pauses, seeks, steps, changes speed and compares original', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: '暂停动画', exact: true }).click();
  const slider = page.getByRole('slider', { name: '动画帧' });
  const current = await slider.inputValue();
  await page.waitForTimeout(250);
  await expect(slider).toHaveValue(current);
  await slider.fill('7');
  await expect(slider).toHaveValue('7');
  await page.getByRole('button', { name: '下一帧', exact: true }).click();
  await expect(slider).toHaveValue('8');
  await page.getByRole('button', { name: '上一帧', exact: true }).click();
  await expect(slider).toHaveValue('7');
  await page.getByRole('combobox', { name: '播放速度' }).selectOption('0.5');
  await expect(page.getByRole('combobox', { name: '播放速度' })).toHaveValue('0.5');
  await page.getByRole('button', { name: '原版对比', exact: true }).click();
  await expect(page.getByAltText('鲸鱼娘原版待机静帧')).toBeVisible();
  await page.getByRole('button', { name: '深色背景' }).click();
  await expect(page.locator('.preview-stage')).toHaveClass(/stage-dark/);
  await page.getByRole('button', { name: '放大预览' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('search and all-library character filters are functional', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('textbox', { name: '搜索动作' }).fill('offer_rice');
  await expect(page.locator('.action-tile')).toHaveCount(1);
  await page.getByRole('textbox', { name: '搜索动作' }).fill('not-an-action');
  await expect(page.getByText('这个小动作，还没找到。')).toBeVisible();
  await page.getByRole('button', { name: '清除筛选' }).click();
  await expect(page.locator('.action-tile')).toHaveCount(12);
  await page.getByRole('tab', { name: '动作资源库' }).click();
  await expect(page.locator('.action-tile')).toHaveCount(108);
  await page.locator('.character-library-filter').getByRole('button', { name: '小克', exact: true }).click();
  await expect(page.locator('.action-tile')).toHaveCount(12);
  await page.getByRole('button', { name: '专属动作', exact: true }).click();
  await expect(page.locator('.action-tile')).toHaveCount(2);
  await page.getByRole('button', { name: '预览小克的认真翻书' }).click();
  await expect(page.locator('.now-playing strong')).toHaveText('认真翻书');
  await expect(page.locator('.selected-character strong')).toHaveText('小克');
});

test('real GIF, complete zip, patch and Chinese markdown download', async ({ page, request }) => {
  await page.goto('/');
  const gifDownload = page.waitForEvent('download');
  await page.getByRole('link', { name: /下载当前 GIF/ }).click();
  expect((await gifDownload).suggestedFilename()).toBe('whale-idle.gif');
  const zip = await request.get('/downloads/ai-motion-v2-complete.zip');
  expect(zip.ok()).toBeTruthy();
  expect((await zip.body()).subarray(0, 2).toString()).toBe('PK');
  const gif = await request.get('/assets/characters/whale/idle.gif');
  expect((await gif.body()).subarray(0, 6).toString()).toBe('GIF89a');
  const md = await request.get('/downloads/replacement-guide.md');
  expect(await md.text()).toContain('人物动作替换指南');
  await page.getByRole('tab', { name: '补丁与文档' }).click();
  await page.getByRole('button', { name: '查看补丁内容' }).click();
  await expect(page.getByRole('dialog').locator('pre')).toContainText('motion(action: string');
});

test('single shot stops and looping can be restored', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('switch', { name: '循环播放' }).click();
  await expect(page.getByRole('switch', { name: '循环播放' })).toHaveAttribute('aria-checked', 'false');
  await page.getByRole('combobox', { name: '播放速度' }).selectOption('2');
  await expect(page.getByRole('button', { name: '播放动画', exact: true })).toBeVisible();
  await expect(page.getByRole('slider', { name: '动画帧' })).toHaveValue('23');
  await page.getByRole('switch', { name: '循环播放' }).click();
  await page.getByRole('button', { name: '播放动画', exact: true }).click();
  await expect(page.getByRole('button', { name: '暂停动画', exact: true })).toBeVisible();
});

test('mobile navigation, docs and layout do not overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.waitForTimeout(450);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  expect((await page.locator('.sidebar').boundingBox())!.x).toBeLessThan(-200);
  await page.getByRole('button', { name: '打开导航' }).click();
  await page.getByRole('button', { name: '人物替换指南' }).click();
  await expect(page.getByText('选对文件，替换就很简单。')).toBeVisible();
  await page.waitForTimeout(400);
  expect((await page.locator('.sidebar').boundingBox())!.x).toBeLessThan(-200);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});