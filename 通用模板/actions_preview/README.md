# 模板动作预览台

零依赖浏览器预览，直接读取：

- `通用模板/engine/assets/cast_atlas.png`
- `通用模板/engine/assets/cast_atlas.json`
- `通用模板/engine/assets/cast_actions.json`

启动：

```bash
npm run actions:preview
```

默认监听 `0.0.0.0:4173`，根路径 `/` 就是预览页。需要换端口时设置环境变量 `PORT`，例如 `PORT=4174 npm run actions:preview`。

页面默认展示全部 8 位角色的 74 个动作 / 538 帧；「只看本鲸 13 动作」按钮会切到本轮重画后的 13 个动作 / 92 帧。也可切换 15 件道具、12 组表情贴（共 21 格）。每个卡片按动作表 fps 播放，显示整段胶片，点击胶片格可暂停并定位到指定帧；速度、逐帧、重置都只改浏览器里的帧索引，不写盘、不生成 GIF、不替换母版。

## 本鲸修复短片对照

首页内嵌 6.5 秒无声短片；全屏页面在 `/film/`，MP4 在 `/film/compare.mp4`，静态分镜在 `/film/contact.png`。短片使用模板捕获契约 `window.__FILM__`，把 13 个本鲸动作按同一坐标表并排渲染三列：重画前原版、V1 重构、当前修正版。当前列把挥手 / 递出去换成重新绘制的单手稿（不再回退原参考格、裙摆也不再固定）、把可见饭碗烘进 8 张干饭帧；`idle` / `blink` 基础格恢复重画前旧版围裙 / 裙摆 / 靴子，但不再锁死下半身，`pose()` 让头、肩、躯干、裙摆和腿自然联动，8 帧侧视走路重做手臂 / 双腿 / 鱼尾节奏。挥手 / 递出去附手臂局部放大，干饭附饭碗框，正面帧附青色下半身框，转圈附细面条帧说明。它不是整片渲染，也不是音频或人眼签收。

`film_compare/` 是本轮短片的可复现静态 dist：`index.html`、`film.js`、`cast_atlas.json`、`cast_actions.json`、`original.png`、`v1.png`、`v2.png`、`v2_similarity.json`、`compare.mp4`、`contact.png`。服务用同源相对 URL 读取这些快照；如果 canonical 母版之后再次变化，需要重新复制 `v2.png`、刷新 `v2_similarity.json` 并重渲短片。

实际捕获 / 编码命令：

```bash
npm run capture:film -- --dist 通用模板/actions_preview/film_compare --out /tmp/whale_film_frames --dur 6.5 --fps 12 --w 1280 --h 720 --format png
node tools/run_python.mjs tools/encode_frames.py --frames /tmp/whale_film_frames --fps 12 --out docs/quality_comparison/whale_redraw/film_compare.mp4
```

代表 PNG 帧在 `docs/quality_comparison/whale_redraw/film_compare_frames/`，总览图在 `docs/quality_comparison/whale_redraw/film_compare_contact.png`。短片文件本身未加入 `assets.manifest.json`，不作为 canonical 母版镜像。

实现文件：`server.mjs`（HTTP / API / `/film/` 静态路由）、`index.html`、`app.js`（Canvas 取帧与播放）、`styles.css`、`film_compare/`。服务只读仓库资产，所有浏览器请求都走同源相对 URL。
