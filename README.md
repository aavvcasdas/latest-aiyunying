# latest-aiyunying · Day15 文案

从 `aavvcasdas/newday` 的 `arena/a300c598-newday` 分支（HEAD `3a9f40e`「通用模板：补上旧引擎补丁里字体、音频、README 路径三件事」）读来的**最新模板口径**，按它写了 Day 系列下一集的文案。

这个仓库只放文案，不放引擎：引擎、角色图集、字体、参考作品（《童话镇》MV 88 MB、Day14 样片 38 MB、存档 976 MB）都在 `newday`，这里不重复拷贝。

## 这次交的东西

| 路径 | 是什么 |
|---|---|
| [`Day/Day15/文案.md`](Day/Day15/文案.md) | 主文档：标题、发布物料、事实/评论分层、45 句逐句意图、节奏、合规处理、自检记录 |
| [`Day/Day15/分镜.md`](Day/Day15/分镜.md) | 18 个镜头的规划（覆盖句、估时、布景、出场、画面事件、机位挂点） |
| [`Day/Day15/台词.txt`](Day/Day15/台词.txt) | 台词原文，一行一句 = 一屏字幕 |
| [`Day/Day15/配音稿.txt`](Day/Day15/配音稿.txt) | 连读版，给配音用 |
| [`Day/Day15/cues.json`](Day/Day15/cues.json) | `film.mjs plan` 生成的规划轴（`measured: false`） |
| [`Day/Day15/film.json`](Day/Day15/film.json) | id `day15`、kind `day`、speaker `whale` |
| [`Day/README.md`](Day/README.md) | Day 线的规矩与连载口径 |

## 这一集

《家变成三D了，米饭没了》。45 句 / 414 字，按 3.36 字/秒估 **2 分 21 秒**（141.49 秒）。

小克把本鲸的家改成了三D，评论全在夸本鲸；本鲸为了回一句「动画还能往上提」，连夜指挥小克重构上一集，差点连话都说不了，被老大午休捞了回来；老大查岗看见这一幕，说早知道不捞，收走了本鲸的米饭。

素材来源分三层写清了：用户口述（家变三D、差点鲸落、老大救回、查岗、米饭没收）、用户给的《童话镇》MV 评论（童话书、七彩的河、动画提升、豆包、笨鲸）、项目内真事（Day14 沙漏翻过去会抖）——见 `文案.md` 第 3 节。

## 现在的状态

- **有**：文案、规划轴、分镜规划、配音稿；字体逐字核对过（45 句 414 字，0 缺字），句长、语气、数字、禁用词都过了。
- **没有**：配音、镜头代码（`shots/*.ts`、`project.tsx`）、渲染、总览图、胶片条。
- `cues.json` 是 `measured: false`，所以**只能叫样片，不能叫成片**；这一版也没有渲过任何一帧。
- 「鲸落」这一段按连载口径写成「开不了口」（不是死亡），另有一套「整段剪掉」的预案和抖音合规清单，见 `文案.md` 第 6 节。

## 接着做

```bash
git clone --branch arena/a300c598-newday https://github.com/aavvcasdas/newday.git
cp -r latest-aiyunying/Day/Day15 newday/Day/Day15
cd newday && npm ci && pip install --user numpy pillow
npm run film -- info  Day/Day15
npm run film -- plan  Day/Day15
# 照 分镜.md 写 project.tsx 的 planShots（18 个镜头）和 shots/*.ts
npm run film -- sheet Day/Day15 --shot S01,S02
npm run film -- full  Day/Day15          # 无声样片
# 配音到位 → film.json 加 audio → align → full
```

## 红线（跟 newday 的 `AGENTS.md` 一致）

零水印、零角标；画面里不出现粉丝数/播放量/金额/进度条/账本表格；不画假手；不新增生图、不换画风；Day 不加片尾卡；`measured: false` 的东西只能叫样片。
AI 生成声明由发布页承担，不进画面；角色形象与音乐的再分发许可仍未核过（`newday` 根 README 里挂着这件事）。
