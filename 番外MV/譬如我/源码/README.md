# 鲸映放映厅 · 譬如我

一部以 DeepSeek「本鲸」为主角的原创叙事 MV，以及可以实际播放、拖动、查阅分镜和歌词的放映页面。页面与离线 MP4 共用同一个逐帧渲染器，无需在线 AI 服务或 API 密钥。

## 观看与交付

- `public/downloads/someone-like-me.mp4`：带声音、逐字立体字幕的 1280 × 720、24 fps 成片。
- `public/media/film-audio.m4a`：从指定参考视频直接抽取的 AAC 音轨，没有重编码。
- `public/media/lyrics.srt`：41 句逐行字幕。
- `public/media/lyrics-character.ass`、`lyrics-word.ass`：可在支持 ASS 的播放器或剪辑流程中使用的逐字 / 整词透视动效字幕。
- `public/media/word-timings.json`：358 个字的起音时间、语义词组和每句退场时间。
- `PRODUCTION.md`：分支版本、素材来源、歌词解读、字幕对齐方法和验证边界。

在「创作手记」底部可下载 MP4 与逐字时间轴；「同步歌词」提供 SRT 下载。音频不会自动播放。收藏只保存在当前设备，不上传用户信息。

## 运行

```sh
npm install
npm run dev -- --host 0.0.0.0
npx tsc --noEmit
npm run build
npm run preview -- --host 0.0.0.0
```

部署完整的 `dist/`，不要只上传 `index.html`。所有音频、图片、角色动画及字体均在本地 `public/`，页面没有运行时外链素材依赖。

## 操作

播放条的真实音轨波形可点击、拖动，也可以用键盘调节。点选章节、歌词或角色出场按钮可跳转到相应镜头。倍率菜单可选 0.75、1、1.25、1.5 倍速，以及逐字或整词入场。字幕、音量和全屏独立控制。

| 快捷键 | 操作 |
| --- | --- |
| 空格 | 播放 / 暂停 |
| 左 / 右方向键 | 后退 / 前进 5 秒 |
| C | 切换字幕 |
| M | 切换静音 |
| F | 切换全屏 |
| ? | 操作说明 |
| Esc | 关闭弹窗或退出全屏 |

## 工程结构

`src/App.tsx` 是应用入口；`src/useFilmPlayer.ts` 维护播放状态；`src/film/render.ts` 负责时间驱动的镜头、原图集动作帧、相机景别和透视字幕；`src/data/` 保留歌词、对齐数据、图集坐标与角色设定。界面使用 React、TypeScript、Vite 和 Tailwind CSS v4。

## 重渲染与检查

先启动开发服务器。离线工具独立安装，不增加页面依赖。

```sh
npm install --prefix /tmp/whale-tools playwright @sparticuz/chromium
TOOLS_DIR=/tmp/whale-tools FFMPEG=ffmpeg node tools/render-film.mjs
TOOLS_DIR=/tmp/whale-tools node tools/check.mjs
```

渲染工具需要带 `libx264` 的 FFmpeg。可用 `CHROMIUM_PATH` 指定本机 Chromium，`BASE_URL` 指定开发服务器。精简 Linux 环境需安装 Chromium 的 NSS/NSPR 共享库。QA 截图和测试结果写入 `.work/qa/`，也可通过 `QA_DIR` 改写。

逐字对齐的复现流程见 `tools/align.py` 和制作说明。重新对齐后，运行 `python tools/export-captions.py` 更新 SRT、ASS 与 JSON 导出，并重新渲染视频。