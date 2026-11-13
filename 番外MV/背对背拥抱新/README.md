# 背对背拥抱 MV（新版 · 纸艺世界）

来源：用户提供的 `背对背拥抱mv.zip`（注意**没有连字符**，和根目录里那个 `背对背拥抱-mv.zip` 不是同一个文件）。

这是同一首歌的**另一套独立实现**，和 `番外MV/背对背拥抱/` 那支 three.js 版并列存在、互不覆盖：

| | 这支（纸艺版） | `番外MV/背对背拥抱/`（three.js 版） |
|---|---|---|
| 渲染器 | 纯 Canvas2D / 2.5D（`src/lib/renderMV.ts`） | three.js 立体世界 |
| 画幅 | 1280×720 / 24 fps / 5642 帧 / 235.08 秒 | 1600×900 / 30 fps / 7046 帧 / 234.88 秒 |
| 字幕 | 48 句，行边界从原片 4 fps 采样，字级是插值 | 48 句，按真人声逐句实测 |
| 出片 | 自带 `scripts/render-mv.ts`，`@napi-rs/canvas` 直接 pipe 给 ffmpeg | `tools/shoot_bb.mjs` 逐帧截浏览器 |

> 谁在这支片子里演谁：本鲸 × 小克。和 three.js 版同一个关系设定，是 MV 的独立演绎。

## zip 里缺的三样

`public/assets/` 里场景图（4 张 jpg）、`actions.json`、SRT、许可证都在，缺的是：

| 缺的东西 | 怎么补的 |
|---|---|
| 49 张角色 PNG（`act_whale_*`、`act_claude_*`、`whale_idle`、`claude_front_0`、`claude_side_0`） | `actions.json` 里的格子名和尺寸跟仓库 `通用模板/engine/assets/cast_atlas.json` 完全对得上，逐格裁出。49 张全部命中，没有缺失 |
| `public/assets/ZCOOLKuaiLe-Regular.ttf` | 渲染脚本第 12 行要按路径注册这个字体。直接用模板里的完整 TTF |
| `public/assets/back-to-back.mp3` | 用根目录的 `背对背拥抱.mp3`。（README 说源文件其实是 AAC-in-MP4、已转过一次码；根目录那份就是转好的，时长 235.08 秒与 `DURATION` 一致） |

## 出片

进这个目录 `npx tsx scripts/render-mv.ts` 就是出全片。想先看构图就加上 stills 子开关（脚本里判断的是命令行里有没有这个词），只出 6 张章节缩略图和 SRT。

这个脚本自己调 ffmpeg。本仓库的环境里 ffmpeg 在 `node_modules/@remotion/compositor-linux-x64-gnu/`，所以要用环境变量把路径指过去（脚本读的是 FFMPEG_PATH），同时把同一个目录加进 LD_LIBRARY_PATH——它缺的 .so 都在那儿。两个都设好再跑，否则 ffmpeg 找不到或者起不来。

2 核机器上全片约 6 分钟（比浏览器逐帧截快一个量级——它不经过浏览器）。

成片：`成片/背对背拥抱新.mp4`，1280×720 / 24fps / 5642 帧 / 235.08 秒 / 64 MB。
脚本默认把成片写在素材目录里（它按脚本自身的位置拼输出路径），渲完要自己挪到 `成片/`，免得让网页也去加载六十多兆的成片。

## 两处需要知道的限制

这两条是原 README 自己写明的，不是本次改动引入的：

- **字级时间是插值，不是人声强制对齐。** 行边界是从参考片 4 fps 采样的，句内每个字的出现时刻是均匀插值。要更准得跑一遍强制对齐。
- **原 README 说「The video has not been reviewed end-to-end by a person」。** 这次渲完全片后抽帧看过：30 秒、90 秒、180 秒、232 秒四处画面、角色、字幕都正常，字体不是豆腐块，图形没串位。

## 素材与许可

角色图从 `通用模板/engine/assets/cast_atlas.png` 按分支坐标裁切，没有重画。
中文字体：站酷快乐体（渲染用，SIL OFL 1.1）+ Noto Sans SC（界面用，SIL OFL 1.1），许可证在 `public/assets/`。
音乐、参考片、场景原画为用户提供；公开前请自行确认授权。
