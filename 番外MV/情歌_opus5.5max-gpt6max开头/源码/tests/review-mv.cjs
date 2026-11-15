const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { createRequire } = require("node:module");

const tools = createRequire(
  path.join(process.env.MV_TOOLS || "/tmp/mv-tools", "package.json"),
);
const puppeteer = tools("puppeteer-core");
const chromium = tools("@sparticuz/chromium");
const output = process.env.MV_QA_OUT || "/tmp/mv-qa";
const url = process.env.MV_URL || "http://localhost:5173/";
fs.mkdirSync(output, { recursive: true });

async function ready(page, width, height) {
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "reduce" },
  ]);
  await page.goto(url, { waitUntil: "networkidle0", timeout: 120000 });
  await page.waitForFunction(() => window.__mv?.ready(), { timeout: 180000 });
  await page.evaluate(() => document.fonts.ready);
}

async function inspectPixels(page) {
  return page.evaluate(() => {
    const source = document.querySelector("canvas");
    const sample = document.createElement("canvas");
    sample.width = 64;
    sample.height = 36;
    const g = sample.getContext("2d");
    g.drawImage(source, 0, 0, 64, 36);
    const pixels = g.getImageData(0, 0, 64, 36).data;
    let light = 0,
      nonblack = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      const l = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
      light += l;
      if (l > 8) nonblack++;
    }
    return {
      luminance: light / (64 * 36),
      visibleFraction: nonblack / (64 * 36),
    };
  });
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: await chromium.executablePath(),
    headless: chromium.headless,
    args: [
      ...chromium.args,
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
      "--autoplay-policy=no-user-gesture-required",
    ],
  });
  const errors = [];
  const record = (page) => {
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => {
      if (m.type() === "error") errors.push(m.text());
    });
  };
  const page = await browser.newPage();
  record(page);
  try {
    await ready(page, 1440, 900);
    assert.equal(
      await page.evaluate(() => window.__mv.state().audioReady),
      true,
    );
    const initial = await inspectPixels(page);
    assert(
      initial.luminance > 8,
      "The first view must contain a visible scene",
    );
    await page.screenshot({
      path: `${output}/desktop.jpg`,
      type: "jpeg",
      quality: 90,
      fullPage: true,
    });
    const cover = await page.evaluate(() => window.__mv.cover(1));
    fs.writeFileSync(
      `${output}/cover.jpg`,
      Buffer.from(cover.split(",")[1], "base64"),
    );

    await page.click(".primary-play");
    await page.waitForFunction(() => window.__mv.state().playing);
    await page.waitForFunction(() => window.__mv.state().time > 0.2);
    await page.click(".play-control");
    assert.equal(await page.evaluate(() => window.__mv.state().playing), false);
    await page.evaluate(() => document.activeElement?.blur());
    const before = await page.evaluate(() => window.__mv.state().time);
    await page.keyboard.press("ArrowRight");
    const after = await page.evaluate(() => window.__mv.state().time);
    assert(Math.abs(after - before - 5) < 0.15, "Seek keyboard shortcut");
    await page.click('[aria-label="静音"]');
    assert.equal(await page.evaluate(() => window.__mv.state().muted), true);
    await page.click('[aria-label="取消静音"]');
    await page.click('[aria-label="关闭三维字幕"]');
    assert.equal(
      await page.evaluate(() => window.__mv.state().captions),
      false,
    );
    await page.click('[aria-label="开启三维字幕"]');
    await page.click('[aria-label="全屏观看"]');
    await page.waitForFunction(() => !!document.fullscreenElement);
    await page.waitForSelector('[aria-label="退出全屏"]');
    await page.click('[aria-label="退出全屏"]');
    await page.waitForFunction(() => !document.fullscreenElement);
    await page.waitForSelector('[aria-label="全屏观看"]');

    await page.click("#tab-storyboard");
    assert.equal(await page.$$eval(".shot-item", (els) => els.length), 8);
    await page.click(".shot-filter button:last-child");
    const shots = await page.evaluate(() => window.__mv.shots);
    assert.equal(
      await page.$$eval(".shot-item", (els) => els.length),
      shots.length,
    );
    await page.click("#tab-cast");
    assert.equal(await page.$$eval(".cast-member", (els) => els.length), 8);
    await page.click("#tab-lyrics");
    assert.equal(await page.$$eval(".lyric-line", (els) => els.length), 38);
    await page.click('.lyric-line[data-line="5"]');
    await page.waitForFunction(() => window.__mv.state().playing);
    await page.click(".play-control");
    assert(await page.evaluate(() => window.__mv.state().time > 60));

    const frames = [];
    for (let i = 0; i < shots.length; i++) {
      const shot = shots[i],
        t = Number((shot.a + (shot.b - shot.a) * 0.48).toFixed(3));
      const data = await page.evaluate(
        (t) => window.__mv.render(t, false, 960),
        t,
      );
      const name = `${String(i).padStart(2, "0")}-${t.toFixed(2)}.jpg`;
      fs.writeFileSync(
        `${output}/${name}`,
        Buffer.from(data.split(",")[1], "base64"),
      );
      frames.push({ ...shot, time: t, file: name });
      console.log("Frame", i + 1, "/", shots.length, shot.label);
    }

    const a = await page.evaluate(() => window.__mv.render(30, false, 960));
    await page.evaluate(() => window.__mv.render(196, false, 960));
    const b = await page.evaluate(() => window.__mv.render(30, false, 960));
    assert.equal(
      a,
      b,
      "Seeking back to amber must reproduce the exact same frame",
    );
    await page.evaluate(() => window.__mv.seek(261.46));
    await page.waitForSelector(".end-screen");

    const mobile = await browser.newPage();
    record(mobile);
    await ready(mobile, 390, 844);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const portrait = await inspectPixels(mobile);
    assert(portrait.luminance > 8, "Portrait cover must not be black");
    assert.equal(
      await mobile.evaluate(() => document.documentElement.scrollWidth),
      390,
    );
    await mobile.screenshot({
      path: `${output}/mobile.jpg`,
      type: "jpeg",
      quality: 90,
      fullPage: true,
    });
    await mobile.click(".primary-play");
    await mobile.waitForFunction(() => window.__mv.state().playing);
    await mobile.click(".play-control");
    const ratio = await mobile.$eval(
      ".film-screen",
      (e) => e.clientWidth / e.clientHeight,
    );
    assert(Math.abs(ratio - 16 / 9) < 0.02, "Mobile playback preserves 16:9");
    await mobile.evaluate(() => window.__mv.seek(7.5));
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await mobile.screenshot({
      path: `${output}/mobile-playing.jpg`,
      type: "jpeg",
      quality: 90,
    });
    assert.deepEqual(errors, [], "No runtime or renderer errors");
    const report = {
      passed: true,
      automatedOnly: true,
      humanFullPlaybackReviewed: false,
      audioAudited: false,
      frames,
      desktop: initial,
      mobile: portrait,
      errors,
    };
    fs.writeFileSync(`${output}/report.json`, JSON.stringify(report, null, 2));
    console.log(
      "PASS: playback, keyboard seek, sound, captions, fullscreen, all tabs, deterministic seek, mobile,",
      shots.length,
      "shot frames",
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
