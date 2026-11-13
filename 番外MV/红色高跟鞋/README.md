# 红色高跟鞋 MV（剪纸夜街 · 本鲸 × 小克）

来源：用户提供的 `红色高跟鞋.zip`（Vite + React + TypeScript 单页应用）。
整片是一张 2D canvas：`src/mv/film.ts` 的 `renderFilm(ctx, atlas, t)` 是 `t` 的纯函数，同一个 `t` 永远画出同一帧。

- 画幅 1920×1080，30 fps，**1428 帧 / 47.60 秒**
- 测试拍 96.75 BPM，第一拍 0.03 秒；22 句、84 个字逐字卡点
- 五个剪纸场景：夜街 / 卧室 / 天桥 / 鞋盒 / 栈桥

> 谁在这支片子里演谁：本鲸追着红鞋的女孩，小克是鞋店里的人。这是 MV 的独立演绎，不写进 Day 线。

## zip 里缺的三样

| 缺的东西 | 怎么补的 |
|---|---|
| `src/mv/assets/atlas.png` | zip 里没有图，只有 `src/mv/atlasMeta.ts` 里 245 格的坐标（按 1024×1966 的排版写的）。仓库里的 `通用模板/engine/assets/cast_atlas.png` 是同一批像素素材、不同排版：245 格**逐格尺寸完全一致**。按格子名从仓库版重排出一张 1024×1966 的，逐格比对 **245/245 像素一致**，画面等价 |
| `src/mv/assets/font.woff` | 无头环境没有任何中文字体。用站酷快乐体按全片实际用到的 67 个字裁子集（11.8 KB，零缺字） |
| `src/mv/assets/song.mp3` | 音轨不在仓库里。由用户提供 `《红色高跟鞋》 .mp4`（1920×1080，47.633 秒）`-vn` 取出音频转成 MP3（44.1 kHz 立体声，1.1 MB）。片子 `DUR = 47.63` 与该文件的视频时长逐位对上 |

## 补的出片入口

工程原本只有网页预览（音轨推着 `requestAnimationFrame` 跑），没有命令行出片入口。补了两个文件，**网页预览一行没改**：

- `src/render-entry.tsx`：`?render=1` 时接管页面，只留一块 1920×1080 画布，暴露 `window.__setFrame(t)`；不带这个参数就走原来的 `App`。
- `src/render-loader.ts`：加载图集和字体，返回 `paint(ctx, t)`。和预览用同一套 `buildAtlas` / `renderFilm`。

`src/main.tsx` 从 `import './App'` 改成 `import './render-entry'`（后者在不带参数时原样挂载 `App`）。

出片：

```bash
node tools/shoot_hsg.mjs --dist 番外MV/红色高跟鞋/dist --frames /tmp/hsgf --still 21   # 抽一帧看构图
node tools/shoot_hsg.mjs --dist 番外MV/红色高跟鞋/dist --frames /tmp/hsgfull            # 出全片
```

先在这个目录里 `npx vite build` 出 `dist`（`vite-plugin-singlefile` 会把图集、字体、音轨全部内联成一个 HTML）。

成片：`成片/红色高跟鞋.mp4`，1920×1080 / 30fps / 1428 帧 / 47.60 秒 / 50 MB（原始 79 MB，CRF 23 压过）。

## 素材与许可

人物形象取自 `通用模板/engine/assets/cast_atlas.png`，按本片自己的坐标裁切，没有重画。
中文字体是站酷快乐体（ZCOOL KuaiLe，SIL OFL 1.1）子集。
音乐与画面素材为用户提供，公开前请自行确认授权。
