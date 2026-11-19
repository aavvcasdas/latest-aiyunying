# 番外 MV ·《浪人琵琶》

大肥鱼翻唱版。1280×720 · 30 fps · 172.9 秒 · 42 镜 · 37 句演唱 + 4 句间奏题跋。
Canvas2D 纸本手卷画风；八位角色全部用 `人物/atlas.png` 里的像素造型，布景与道具由代码绘制，没有生成图。

完整说明（歌词核对、选角、红线核对、没做的事）看 [`remade.md`](remade.md)。

## 跑起来

```bash
cd 番外MV/浪人琵琶/源码
npm install
npm run dev      # 预览
npm run build    # 出 dist/index.html
```

构建前会自动执行 `scripts/link-assets.mjs`，从仓库根取 `人物/atlas.png` 与 `大肥鱼翻唱《浪人琵琶》.mp3`
到 `src/assets/`（不入库）。找不到、或图集不是坐标表对应的那一张，会直接报错停下。

## 出片

```bash
# 在仓库根
node tools/shoot_vite_mv.mjs --dist 番外MV/浪人琵琶/源码/dist --out /tmp/frames_lrpp --still 23.5 --w 1280 --h 720
node tools/shoot_vite_mv.mjs --dist 番外MV/浪人琵琶/源码/dist --out /tmp/frames_lrpp --dur 172.9 --fps 30 --w 1280 --h 720
```

## 文件

| 路径 | 是什么 |
| --- | --- |
| `remade.md` | 这次新增的全部说明 |
| `分镜表.md` | 42 镜的起止时间、对应歌词、画面（由源码生成） |
| `歌词.srt` / `cues.json` | 实测卡点（由源码生成） |
| `设定表_追加.md` | 贴进 `番外MV/设定表.md` 的一节 |
| `静帧/` | 封面一张、分镜总览一张 |
| `源码/src/mv/lyrics.ts` | 歌词卡点——改时间只改这里 |
| `源码/src/mv/shotsA.ts` `shotsB.ts` | 镜头。时机都挂在句子上（`LT(n)` 句首切镜、`LM(n)` 后半句） |
| `源码/src/mv/sets.ts` | 五块布景 |
| `源码/src/mv/core.ts` | 引擎与纸艺道具 |

## 改东西时

- **改某句的时间**：只改 `lyrics.ts` 那一行；镜头会跟着走。
- **改画面上的字**（歌词、匾、木牌）：改完重跑 `python3 tools/subset_font.py <MaShanZheng-Regular.ttf>`，缺字会报错。
- **母版图集重排之后**：重跑仓库根的 `tools/gen_atlas_ts.py`，把生成的 `atlasData.ts` 覆盖到 `src/mv/`，
  再把 `scripts/link-assets.mjs` 里的 sha256 前缀换成新的。
- 写镜头守三条：逐帧函数只读时间；角色每帧重新摆；缺素材就报错。

## 现状

成片已出并入库：`成片/浪人琵琶_fable5.2.mp4`（1280×720 @30fps / 2:52.9 / 38.7 MB / 5187 帧，2026-11-19 渲染）。
`成片/浪人琵琶_fable5.2_分镜总览.jpg` 是 42 镜的总览。没有人整片看过、听过。详见 `remade.md` 第 8 节；
放进仓库时动过哪几处见 `适配说明.md`。
