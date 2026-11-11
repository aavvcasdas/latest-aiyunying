# 坏女孩 MV（3D 夜雨 · 鲸鱼娘 × Claude）

来源：用户提供的 `3d坏女孩.zip`（Vite + React + three.js 单页应用，不是 Remotion 模板）。
整份源码、图集、字体、音轨都在这个目录里——音轨是 `src/assets/songData.ts` 里的 base64，不依赖外部文件。

## 做了什么改动

| 改动 | 位置 | 说明 |
|---|---|---|
| **片头只留两行**：歌名 + 歌手名 | `src/mv/film.ts` 的 `titleCard()` | 原来还有第三行「鲸鱼娘 × Claude · 像素 3D 夜雨复刻」，删掉了；片头现在只有「坏女孩」和「徐良 / 小凌」 |
| **歌词条不再出现歌手名** | `src/mv/film.ts` 的 `lyric()` | 删掉了每句前面那颗写着「徐良 / 小凌」的小药丸；两个人的音色仍靠逐字染色的色相区分（小凌偏粉、徐良偏蓝） |
| 走路修复同步回模板 | `通用模板/engine/actors.ts` 的 `walkBy()` | 一轮步态走过的距离改成 **1.15 × 当前缩放**（跟人物大小走），并加了 0.035 的上下颠；另加 `walkX(a, b, p, y, z)` 帮手。这份 MV 本来就是这么走的，现在模板里的 Day/MV 也一致了 |

片尾卡没动（仍是主演名单）。如果也要只留歌名/歌手名，改 `titleCard()` 里 `kind === "end"` 那一支。

## 怎么出片

这个工程不是 Remotion，用「无头浏览器逐帧截图 + ffmpeg 编码」：

```bash
cd 番外MV/坏女孩
npm install
npx vite build                       # 打成 dist/index.html（单文件，7.7 MB，音轨内联）

cd ../..
npm i -D puppeteer-core
node tools/shoot_mv.mjs 番外MV/坏女孩/dist /tmp/brframes      # 20.475–217.7 秒，30fps → 5917 张 JPG
```

`tools/shoot_mv.mjs` 起一个本地静态服务 → 用 `@sparticuz/chromium` 启 headless Chrome（软件 WebGL）→
等 `window.__mv.ready` → 按帧调 `window.__mv.render(T)` 拿 JPEG → 落盘。
浏览器依赖库在 `/tmp/al2023/lib`，脚本里已经把 `LD_LIBRARY_PATH` 指过去了。

编码 + 混音（音轨从原曲 20.0 秒截起，画面从 20.475 秒起，所以音频要 `-ss 0.475`）：

```bash
ffmpeg -framerate 30 -i /tmp/brframes/f%05d.jpg \
       -ss 0.475 -t 197.225 -i /tmp/song.m4a \
       -map 0:v -map 1:a -c:v libx264 -crf 20 -preset medium -pix_fmt yuv420p \
       -c:a aac -b:a 192k -af apad -movflags +faststart -y 番外MV/坏女孩/成片/坏女孩.mp4
```

## 关键常量（`src/mv/core.ts`）

| 项 | 值 |
|---|---|
| 画面 | 1280 × 720 @ 30fps |
| 节拍 | 126.99 BPM（126.99），首拍 22.365 秒 |
| 起片 | 20.475 秒（第一句人声前一小节的鼓点） |
| 音轨 | 内嵌 m4a，从原曲 20.0 秒截起，195.11 秒 |
| 终止 | 215.1 秒 + 2.6 秒片尾卡 = 217.7 秒 |

## 注意

- 这首是《坏女孩》（徐良 / 小凌），原曲版权不在仓库里，公开前自己核授权。
- 页面里的 `exportTest()` 是浏览器里用 WebCodecs 直接导 MP4 的兜底；无头 Chromium 一般不带 H.264 编码器，所以这里走逐帧截图这条路。
