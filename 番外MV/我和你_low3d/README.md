# 《我和你》three.js 3D MV

按分支中的 `我和你opus5.5-low3d.zip`（提交 `f4ad3b9`）完成的 low3d 版渲染；不是 high ZIP，也不是 2D 页面。Next.js 首页 `/` 默认挂载 `<Studio mode="3d" />`。

## 交付

- 成片：`成片/我和你_3D_MV.mp4`
- 格式：H.264 / AAC，1280×720，30 fps，约 60.42 秒
- 源工程：`源码/`
- 角色图集：`源码/public/mv/cast/`（取自仓库 `人物/`）
- 歌曲 WAV：`源码/public/mv/audio/wohe-ni.wav`（仓库根目录 `我和你.WAV`）
- 六张原创像素道具：`源码/public/mv/props/`；脚本及说明见 `素材/`、`道具说明.md`

成片使用 three.js 3D 场景、仓库已有 Q 版角色图集和逐词中文字幕。字幕字体为 Google Fonts Noto Sans SC 字符子集，OFL 许可证位于 `源码/public/fonts/OFL-Noto.txt`。

## 本地构建

```sh
cd 源码
npm ci
npm run typecheck
DATABASE_URL='postgres://user:pass@127.0.0.1:5432/app' npm run build
```

`build` 固定使用 Next.js webpack bundler，避免此 Next.js 版本在仓库中文路径下触发 Turbopack 的 UTF-8 路径 panic。站点的 MV 页面及素材不依赖数据库；数据库变量仅供 Next.js 构建 API 路由时读取。运行后网页播放区的 WebM 录制按钮可导出浏览器录屏。

## 来源与授权提示

本次只从 low3d 工程取用源码和分镜，角色与歌曲素材来自同一仓库现有资源。新增六张道具为仓库内脚本绘制的透明像素 PNG，不是新增人物。仓库中歌曲与角色素材的公开传播授权仍需自行确认。
