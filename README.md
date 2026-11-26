# 番外 MV · 八位 AI 娘的像素 MV 项目

拿项目自带的八位 Q 版像素 AI 娘，给一首歌配满镜头、歌词卡在拍子上，出成片。
做法是 three.js / Canvas2D 搭场景，像素角色当 2D 纸片人站在里面，逐帧渲染（Remotion 或 Vite 单页 + 截图），音轨按实测采样对齐后混进去。

八位角色：`whale`（DeepSeek 鲸鱼娘）、`gpt`（白龙娘）、`claude`、`doubao`（豆包 Seed）、`gemini`、`kimi`、`qwen`（千问）、`zai`（GLM 阔耳狐）。

**人物素材全部在根目录 `人物/`**（图集、拆好的分组图、长大立绘、形象提示词），各 MV 工程里的副本照旧保留、代码不用改。

## 片子

| 目录 | 源码 | 成片 |
| --- | --- | --- |
| `番外MV/童话镇/` | — | 分镜总览 + srt + qa（`.mp4` 出库，见 `媒体说明.md`） |
| `番外MV/情歌_opus5.5max/`、`番外MV/情歌_opus5.5max-gpt6max开头/` | 有 | `情歌_opus5.5max.mp4`、`情歌_opus5.5max-gpt6max开头.mp4` |
| `番外MV/浪人琵琶/` | 有（模板线 + Remotion，1920×1080，44 镜 / 5187 帧 / 2:52.9） | `成片/浪人琵琶.mp4`（80 MB，2026-11-19 出片） |
| `番外MV/浪人琵琶_fable5.2/` | 有（Vite 单页 + Canvas2D 纸本手卷，1280×720，42 镜 / 5187 帧 / 2:52.9） | `成片/浪人琵琶_fable5.2.mp4`（38.7 MB，2026-11-19 出片）+ 分镜总览 |
| `番外MV/告白气球_opus5.5_笨鱼发/` | 有（React + Vite + three.js，1280×720，48 镜 / 6389 帧 / 3:32.9） | `成片/告白气球_opus5.5_笨鱼发.mp4`（78.6 MB，2026-11-20 出片） |
| `番外MV/告白气球_opus5.5/` | 有（React + Vite 单页，Canvas2D 水彩明信片，1280×720，42 镜 / 6389 帧 / 3:32.9） | `成片/告白气球_opus5.5.mp4`（37.6 MB，2026-11-20 出片） |
| `番外MV/超级棒棒糖_童年治愈3D/` | 有（Vite 单页 + three.js，1280×720，27 镜 / 2171 帧 / 1:12.4） | `成片/超级棒棒糖_童年治愈3D.mp4`（25.0 MB） |
| `番外MV/万分之一的光/` | 有（Vite 单页 + Canvas2D 像素，1280×720，约 60 镜 / 6799 帧 / 3:46.6） | `成片/万分之一的光.mp4`（48.5 MB，2026-11-24 出片）+ 封面 + 联系表 + `发布文案.md` |
| `番外MV/寂寞烟火/` | 有（React + Vite + three.js 3D 像素微缩，1280×720，18 镜 / 1953 帧 / 1:05.1） | `成片/寂寞烟火.mp4`（23.8 MB，2026-11-25 出片）+ 封面 + 联系表 + `发布文案.md` |

> 用户明确要求交付的 `.mp4` 入库；其他成片默认不入库（`.gitignore`），按 `媒体说明.md` 取回。

## 目录

| 路径 | 是什么 |
| --- | --- |
| `人物/atlas.png` | 母版图集副本：2048×3126 / 682 帧 / 八位，单帧约 84×90；`NearestFilter`，本鲸格按 `master_soft` 多一层 1px 半透明边缘，其他角色仍为硬边 |
| `人物/q版/<角色>.png` | 一位角色一张，一行动作，等格网格（538 帧） |
| `人物/行走/walk.png`（56）、`头像/portraits.png`（15）、`变体/variants.png`（37）、`道具/props.png`（15）、`特效/fx.png`（21） | 按用途拆开的分组图 |
| `人物/index.json` | 每张分组图里每帧的 `{row, col}` + 母版里的 `{x, y, w, h}` + `actions` 分组 |
| `人物/立绘/` | 七头身立绘与骨架引擎：`art/raw`（原图）、`art/tachie`（透明底）、`src/mv/rig.ts`、`人物/立绘/tools/render-actions.mjs`。**默认不用**，长大时刻才接 |
| `人物/提示词/` | 九位角色的 Q 版绿幕生图提示词（`00_通用规则.txt` 共用口径 + 每人一份） |
| `人物/参考/grok/`、`人物/生成/grok_绿幕_Q版.png` | Grok 娘的正面设定图与来源、用上面提示词出的 Q 版形象（参考用，不进图集） |
| `番外MV/<歌名>/` | 一支 MV 一个目录：`源码/` + `成片/` + `素材/` + 文案 |
| `通用模板/` | 唯一现行的制作模板：引擎、命令行、样板、测试。**从 `通用模板/README.md` 开始读** |
| `通用模板/engine/assets/cast_atlas.png` / `.json` | 图集母版本体与行表（`人物/atlas.png` 就是它的副本） |
| `设定/` | 人物设定（一人一页）、总纲、动作库 |
| `参考资料/` | 人物调研、MV 做法调研、别人那版复刻源码（只备查） |
| `tools/` | `shoot_vite_mv.mjs`（Vite 单页逐帧截图）、`encode_frames.py`（帧→mp4）、`render_zip_mv.mjs`（Remotion 出片）、`split_cast.py`（母版 → `人物/`） |

## 怎么跑

```bash
npm ci
python3 -m pip install -r requirements.txt   # CI / 普通环境
# 本机 PEP 668：python3 -m venv .venv && .venv/bin/pip install -r requirements.txt

python3 tools/split_cast.py                # 默认只检查；加 --write 才重建 人物/
npm run film -- info 番外MV/童话镇         # 看时间轴
npm run film -- sheet 番外MV/童话镇        # 分镜总览图
npm run film -- full  番外MV/童话镇        # 整片：逐帧渲染 → 编码 → 混音 → 自检
npm run new -- mv 番外MV/某首歌 "某首歌"    # 新开一部 MV
npm run preview                           # 浏览器里的预览台
npm test && npm run typecheck
```

Vite 单页那类（`番外MV/<歌名>/源码`）：

```bash
cd 番外MV/<歌名>/源码 && npx tsc --noEmit && npx vite build
node tools/shoot_vite_mv.mjs --dist dist --out /tmp/fs --dur 2 --w 1280 --h 720 --fps 24 --format png
```

## 规矩

- 新片**零水印、零角标**；画面里不出现粉丝数、播放量、进度条、数据图表。
- 时间只认实测：没对过音频的卡点（`measured=false`）只能出无声样片，出不了成片。
- 缺素材直接报错，不拿别的造型顶替。
- 自检（`qa.json`）只能证明「没坏」；好不好看、听着对不对，要人从头到尾过一遍。
- 只用 Q 版立绘；七头身立绘默认不用。
- **生图与素材更新（2026-11-26）**：允许新增生图、角色差分、透明分层与有意的素材替换；不再把历史 8 位角色或素材 SHA 当作不可更改的白名单。默认新增角色 key / 独立目录，不直接覆盖 `cast_atlas.png`。保留原始提示词、修订提示词和来源记录；哈希用于可更新的版本追踪，修改后可运行 `npm run assets:write`。缺素材、缺字、音频对齐与外部版权要求继续生效。

## 人物图集：在哪、坐标怎么读、为什么看着糊

- **根目录副本**：`人物/atlas.png`（= 母版，2048×3126 / 1.62 MB），拆好的分组图在 `人物/q版|行走|头像|变体|道具|特效/`，坐标在 `人物/index.json`。
- **各工程里的**：模板线作品从 `通用模板/engine` 取；上传的 Vite 工程自带一份 `源码/src/assets/`（图集 + 坐标表 `atlasData.ts`：逐帧 `RECTS` + 按角色分组的 `ACTIONS`）。
- **母版行表**：`通用模板/engine/assets/cast_atlas.json`（682 帧，按行记 `{y, w, h, n, fps}`，第 i 帧 x = `i × w`）。行表是「行布局」、`atlasData` 是「逐帧矩形」，**两套坐标不能混用**。
- **贴图换算**（`src/mv/engine.ts` 的 `Actor`）：`e = 0.4` 防相邻帧溢出内缩，`v` 要上下翻；材质 `MeshBasicMaterial`（`alphaTest 0.3`，不受光，靠 `color` 乘出「夜 / 昼 / 黎明」）；
  帧号 `floor((T - t0) × fps × speed)`，`loop` 取模否则夹末帧；纸片人每帧 `rotation.y` 转朝镜头。
- **坑**：走路帧在母版里叫 `walk_whale_0..7`，**不带 `act_` 前缀**，按 `act_` 扫会漏帧；单帧约 84×90，近景放大 2.8 倍，**像素块是设计如此**。
- **为什么角色看着糊**（不是「挤一张图」的锅，打包效率 75%，拆开也一样）：① 源头单帧中位 90×90，1280 宽近景要放大 2.8 倍、脸只有 30×30 的信息量（根本原因，不能靠换编码补回）；
  ② 旧 bloom 0.5 + 色差基线让白围裙烧穿；③ 旧 `toDataURL` jpeg 0.94 + h264 crf23 是二次损失。
  2026-11-24 已落地：统一 `tools/render_defaults.json`，逐帧默认 lossless PNG、CRF 16 / 12000k，关键 3D 引擎 bloom ×0.45、阈值 0.95、色差基线归零、2× 超采样，像素贴图 nearest + `alphaTest 0.3`。该轮未重画母版；同一天后续任务中用户明确授权在现有格内重画本鲸（不是新增高分辨率母版），见 [`docs/quality_comparison/whale_redraw/whale_redraw_report.md`](docs/quality_comparison/whale_redraw/whale_redraw_report.md)，其余七位角色仍沿用原图像素数据。

## 其它文档

- 派生动作、像素道具、表情贴、重烘图集：[`人物动作替换.md`](人物动作替换.md)
- 视频/音频入没入库、怎么取回：[`媒体说明.md`](媒体说明.md)
- 逐项许可与来源链：[`素材许可与来源.md`](素材许可与来源.md)
- 人物设定：[`设定/README.md`](设定/README.md)；长大立绘规则：[`设定/立绘.md`](设定/立绘.md)
- 写镜头与角色用法：[`通用模板/README.md`](通用模板/README.md)

## 质量自检与逐帧导出

```bash
npm run qa:all
npm run capture:film -- --dist <构建目录> --out /tmp/frames --dur 30 --format png
```

`npm run qa:all` 串起模板测试、共享源码类型检查（`tsconfig.quality.json`）、图集重建、本鲸重画专项检查（`npm run whale:qa`）、通用步态溢色检查、立绘锚点 / 透明底检查、资产哈希、生成素材溯源、确定性后处理检查与可复现画质对照；各历史 MV 子工程仍需各自安装依赖后单独 typecheck。统一默认值在 `tools/render_defaults.json`，逐帧契约见 `tools/capture_contract.md`；母版 / 镜像 / 立绘 / 字体 / 音轨的 SHA256 在 `assets.manifest.json`，满月篇历史生图的哈希链在 `人物/生成/满月篇/assets.manifest.json`。

`npm run qa:visual` 会重算 `docs/quality_comparison/character_quality_comparison.png` 与指标；`npm run qa:motion` 用于给一次真实帧序列做抽帧 / 冻帧扫描，参数见 `docs/quality_comparison/fix_comparison.md`。机器检查只证明「没坏」，整片观感与听感仍要在 `docs/quality_comparison/human_sign_off.md` 人工签收。

## 公开发布前要自己确认的事

- **角色形象**：像素造型沿用项目原有素材，上游再分发许可**仍未核**（见 `素材许可与来源.md`）。形象源头是 ZipZipPipe《大AI和小AI们》，CC BY-NC-SA 4.0 —— 二创要署名、不商用、同协议共享。
- **音乐**：各片原曲录音都没有授权记录，公开前自己核。
- **平台声明**：片子里不放「AI 生成」角标，合规声明在发布页用平台自带功能补上。


### 通用角色骨架调试

`npm run rig:preview` 打开模板直接驱动的骨架定格台：暂停 / 逐帧、固定肩肘角、三段刚性手脚、走路接地与喜怒哀乐切换。当前工作不再导出 paperdoll 样片；新骨架协议和接口见 `通用模板/角色骨架.md`。原有八张单层立绘没有被虚假标记为全部重绑完成。
