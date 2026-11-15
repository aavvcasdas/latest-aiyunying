# 情歌：开场与细节优化

## 本轮范围

- `src/mv/opening.ts`：替换原来的三个长镜头，增加八镜头「回忆序章」。开场直接展示人物和琥珀中的回忆，不再从黑场和远处的小星球开始。
- `src/mv/engine.ts`：保留第一句起唱点和后续歌词时间；字幕在泛光之后单独合成；小屏和竖屏使用轻量渲染路径。
- `src/mv/lyrics.ts`：减小字幕弹跳和行间错位，限制上一句的退场时间，避免两句重叠。
- `src/mv/scenesA.ts`、`src/mv/scenesB.ts`：琥珀人物构图、确定性的漂浮动画、河岸草木与石头、船尾涟漪、默片曝光与投影光束。
- `src/App.tsx`、`src/index.css`：全幅观看页面；歌词、分镜和人物置于影片下方；保留进度拖动、歌词跳转、章节、音量、字幕开关、键盘与全屏。

## 开场节奏

| 时间 | 镜头 |
| --- | --- |
| 0:00 | 琥珀中的两个人，落泪与渐淡的回忆 |
| 0:02.8 | 未寄出的信，信封展开 |
| 0:05.8 | 回忆放映厅全景，片名出现 |
| 0:09.4 | 唱片落针，旋律启动 |
| 0:12.6 | 沿着琴键走向回忆 |
| 0:16.2 | 星河向一颗红豆汇聚 |
| 0:19.7 | 告别留下的空位 |
| 0:22.8 | 穿入琥珀，接回原来的第一句 |

开场的剪辑点是本轮的镜头设计，不是新增的人声强制对齐结果。原版 `generated.ts` 中的逐字时间本轮未改动，也未人工逐字复核。

## 素材来源

原工程交接时二进制素材缺失，已从用户提供的已部署版本中恢复同一份图集、音轨和歌词字体：

- `src/assets/atlas.png`：原版重排的分支角色图集，SHA-256 前缀 `deadc0e5f9e93b22`。
- `src/assets/song.mp3`：原版音轨，SHA-256 前缀 `258b50fcbb94f709`。
- `src/assets/zcool.woff2`：原版 ZCOOL KuaiLe 子集，SHA-256 前缀 `ebc971196510b155`。
- `src/assets/cover.jpg`：本项目三维场景的真实渲染帧，不是外部图片或新生成的人物。
- `src/assets/title.ttf`、`src/assets/ui-cjk.ttf`：Google Fonts 的 Noto Serif SC / Noto Sans SC 字符子集，仅用于网页界面。

新场景的照片道具也只使用原角色图集，其他环境与材质由代码绘制。未新增人物、未修改角色画风，未推送远程分支、未发布视频。音乐与角色的公开传播许可仍需另行确认。

## 验证

```sh
npx tsc --noEmit
npm run build
```

浏览器检查脚本为 `tests/review-mv.cjs`。测试依赖可以独立安装，不进入影片包：

```sh
npm install --prefix /tmp/mv-tools puppeteer-core@23 @sparticuz/chromium@131
AWS_EXECUTION_ENV=AWS_Lambda_nodejs20.x AWS_LAMBDA_JS_RUNTIME=nodejs20.x node tests/review-mv.cjs
```

先启动 `npm run dev -- --host 0.0.0.0`。测试默认访问 `http://localhost:5173/`，截图与 JSON 报告写入 `/tmp/mv-qa`，可通过 `MV_URL` 和 `MV_QA_OUT` 指定位置。

自动验证不等同于人工看完整片或听完整曲；没有将逐字字幕声明为人工核准。

### 本轮检查结果

- TypeScript 检查、Vite 生产构建通过。
- 生产页面的 51 个镜头均完成抽帧，包括 8 个新开场镜头，无浏览器运行错误。
- 播放与暂停、键盘快进、音量、字幕开关、进出全屏、歌词跳转、分镜筛选与人物页通过自动检查。
- 390px 手机首屏可见画面，播放切换为 16:9，无水平溢出。
- 先跳到其他镜头再返回琥珀，同一时间点的图像一致。
- 机器结果保存在 `tests/qa-summary.json`；全曲听审和人工逐字校准未进行。