# Rainfilm / 雨映

为《雨爱》司凤版制作的治愈系软 3D 音乐影像工作台。界面入口为 `src/App.tsx`，影片组件为 `src/remotion/RainLove.tsx`。

## 使用

这个目录是独立工程（Vite + React + Remotion），依赖不在仓库根。进本目录 `npm install` 一次，再 `npx vite` 开工作台、`npx vite build` 出静态站。
- 点击播放，或用空格键播放 / 暂停。左右方向键跳转 5 秒，M 键切换静音。
- 点击歌词或时间线可定位影片。支持歌词和时间编辑、字幕开关、字号、色调、粒子特效、分镜笔记、撤销和重做。
- 修改保存在当前浏览器的 localStorage 中。导出面板可保存项目 JSON 和 SRT 字幕；设置中的“导入项目备份”可恢复此前下载的 JSON。
- 原版 1080p MP4 出片后用 `node tools/render_zip_mv.mjs yuai` 重新渲染，成片见 `成片/雨爱.mp4`（本仓库里 `*.mp4` 默认不入库，这一份是明确留下的）。
- 修改后的影片通过 `@remotion/web-renderer` 在本地浏览器导出。支持完整影片、当前章节和 5 秒试片，支持取消渲染。编码支持取决于浏览器；MP4 编码不可用时请选择 WebM。需要 HTTPS 或 localhost 环境。

## 影片

- 1920 × 1080，30 fps，3938 帧，约 2 分 11 秒。
- 原音源虽然命名为 MP3，实际包含 H.264 视频和 AAC 音频。`public/audio/rain-love.m4a` 为原 AAC 音轨的无损提取，没有重新演唱或替换音乐。
- 四组原创软 3D 风格场景：雨窗、雨伞、云端记忆、雨后彩虹。
- Remotion 逐帧驱动运镜、交叉淡化、雨滴、微光、字幕和片尾。场景使用 3D 风格渲染图，不是可旋转的实时 3D 模型。
- 18 句用户提供的歌词，加上原声中重复副歌的 5 句，共 23 个字幕片段。起止时间参考原声自动逐词转录，中文以用户提供文本为准，可在编辑器逐句微调。
- 原声的前奏和尾奏均保留。工作台初始预览定位在 16.2 秒，便于看到歌词和画面；完整导出从 0 秒开始。
- 时间线的波形由原始音频实际采样生成，素材、字体及音轨均在本地提供。

## Remotion Studio 与命令行

在本目录用 `npx remotion studio src/remotion/Root.tsx` 打开 Remotion Studio。

本仓库里出片不用上面那条 remotion 命令，走根目录的统一脚本（它已经把 chromium、字体、音轨、publicDir 都配好了）：`node tools/render_zip_mv.mjs yuai`。

如需渲染编辑后的项目，把下载的 JSON 包装成 `{ "project": … }` 交给 Remotion 的 props 参数。命令行渲染需要受支持的 Chromium 和相应系统依赖。

## 在这个仓库里出片

zip 里只带网页工程，音轨、字体、场景图、图集都缺；补齐后由一个统一的脚本出片：

```bash
node tools/render_zip_mv.mjs yuai            # 出完整成片
node tools/render_zip_mv.mjs yuai --still 24 # 只抽第 24 秒一帧看效果
```

补齐的三样（zip 里没有）：

1. `public/audio/rain-love.m4a`——从仓库根的《雨爱》司凤版源文件 `-c:a copy` 无损取出 AAC 音轨（那份文件后缀是 mp3，实际是 MP4 容器）。
2. `public/fonts/rain-sans.woff2`——无头渲染环境没有任何中文字体，不补就是豆腐块；用站酷快乐体按全片用字裁子集。
3. `public/images/*.png` 四张场景原画本就在 zip 里，但代码里写的是 `.jpg`，已统一改成 `.png`。

字体加载原来写在 `src/remotion/font.ts` 的模块顶层（`import './font'` 就挂一个 `delayRender`）。多帧并发时会有句柄没人清，整片渲到两成多就抛 `delayRender ... not cleared after 298000ms`。现在改成 `useRainSans()` 在组件里加载，句柄随这一帧的挂载和卸载，全片能一口气渲完。

## 素材与许可

音频来源是用户提供的 GitHub 链接，仅用于本次创作。公开发布音乐影片前请确认相关音乐授权。场景原画为本项目生成。中文字体是站酷快乐体（ZCOOL KuaiLe，SIL OFL 1.1）按本片用字裁的子集，223 个字形、24 KB，见 `public/fonts/rain-sans.woff2`。Remotion 的使用遵循其自身许可条款。

## 验证

先开工作台，再用 playwright 跑 `tests/studio.spec.ts`，可检查播放、逐句跳转、字幕编辑、本地保存、项目恢复、影片下载和移动端布局。

测试与 `tests/`、`.venv/`、`.work/` 都没随 zip 一起进仓库（体积和可复现性原因），要跑得回原 zip 里取。