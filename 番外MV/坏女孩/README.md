# 坏女孩 MV（3D 夜雨 · 鲸鱼娘 × Claude）

来源：用户提供的 `3d坏女孩.zip`（Vite + React + three.js 单页应用，不是 Remotion 模板）。zip 原件放在本目录的 `来源/` 下（2026-11-12 从仓库根挪进来）。
整份源码、图集、字体、音轨都在这个目录里——音轨是 `src/assets/songData.ts` 里的 base64，不依赖外部文件。

> 谁在这支片子里演谁、这个形象兑现她哪条习性：[`../设定表.md`](../设定表.md)。

## 做了什么改动

| 改动 | 位置 | 说明 |
|---|---|---|
| **片头只留两行**：歌名 + 歌手名 | `src/mv/film.ts` 的 `titleCard()` | 原来还有第三行「鲸鱼娘 × Claude · 像素 3D 夜雨复刻」，删掉了；片头现在只有「坏女孩」和「徐良 / 小凌」 |
| **歌词条不再出现歌手名** | `src/mv/film.ts` 的 `lyric()` | 删掉了每句前面那颗写着「徐良 / 小凌」的小药丸；两个人的音色仍靠逐字染色的色相区分（小凌偏粉、徐良偏蓝） |
| 走路修复同步回模板 | `通用模板/engine/actors.ts` 的 `walkBy()` | 一轮步态走过的距离改成 **1.15 × 当前缩放**（跟人物大小走），并加了 0.035 的上下颠；另加 `walkX(a, b, p, y, z)` 帮手。这份 MV 本来就是这么走的，现在模板里的 Day/MV 也一致了 |

片尾卡没动（仍是主演名单）。如果也要只留歌名/歌手名，改 `titleCard()` 里 `kind === "end"` 那一支。

## 怎么出片（Remotion，一条命令）

这个工程原本是 Vite + three.js 单页应用；现在包了一层 Remotion 合成（`remotion/entry.tsx` + `remotion/Three.tsx`），
引擎和镜头一行没改：每帧调一次 `film.frame(T)`，画到同一块 canvas 上，配音/音轨由 Remotion 混进去。

```bash
cd 番外MV/坏女孩 && npm install
cd ../..
node tools/render_zip_mv.mjs three3d          # → 成片/坏女孩_3d.mp4（1280×720 30fps，5917 帧，3:17；这个 mp4 2026-11-12 出库，跑这条就回来）
node tools/render_zip_mv.mjs three3d --still 30   # 只想看一眼：抽第 30 秒那一帧
```

- 合成 id `ThreeMV`，时长 (TOTAL_END − START) × 30 帧；音频 trimBefore = (START − AUDIO_OFFSET) × fps。
  （TOTAL_END / START / AUDIO_OFFSET 是 `tools/shoot_mv.mjs` 与这份工程源码里的常量，不在命令行选项里。）
- 2 核机器上大约 1–2 帧/秒，整片 1 小时上下；`CONCURRENCY=1` 可以让它别把机器占满。
- 旧的「无头浏览器逐帧截图 + ffmpeg 编码」路子（`tools/shoot_mv.mjs`）还在，但按用户要求，出片一律走 Remotion。

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
