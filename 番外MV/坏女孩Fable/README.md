# 坏女孩（fable5.2）· Remotion 版

来源：用户提供的 `fable5.2坏女孩.zip`（Vite + React，zip 原件放在本目录的 `来源/` 下，2026-11-12 从仓库根挪进来；`src/mv/engine.ts` 是一套 **Canvas2D 画家算法**的软 3D 引擎，
1280×720 @24fps，195 秒；同一份 `render(ctx, t)` 既在网页里实时预览，也能被逐帧调用）。
在原包引擎上补齐素材、接入 Remotion，并修正逐句歌词轴和间奏分镜。

> 谁在这支片子里演谁、这个形象兑现她哪条习性：[`../设定表.md`](../设定表.md)。

## 目录

| 路径 | 内容 |
|---|---|
| `api/engine.ts` | 基于原包修订的引擎（`render(g, t, {subtitles})` 是纯函数，同一个 t 永远同一帧） |
| `api/beats.json` `api/cast_atlas.json` | 原包鼓点 / 角色图集切片表（与 `3d坏女孩.zip` 里那份**完全一致**，已核对） |
| `assets/atlasData.ts` `assets/fontData.ts` | 原包缺的像素图集与字体，从 `3d坏女孩.zip` 里补齐（base64） |
| `public/song.m4a` | 内嵌音轨，从原曲 20.0 秒截起，195.11 秒 |
| `Fable.tsx` | Remotion 合成：一块 canvas + 每帧 `render()` + `<Audio>` + 片头卡 |
| `entry.tsx` | `registerRoot` + `<Composition id="Fable">`（4680 帧 = 195×24） |
| 成片（成片/坏女孩_fable5.2.mp4） | 本次重新渲染的交付成片（允许入库的媒体例外） |

## 按规矩改的地方

| 改动 | 说明 |
|---|---|
| **片头只放两行**：歌名 + 歌手名 | `Fable.tsx` 的 `TitleCard`（原包引擎里没有片头卡，新建的）：0.45 秒淡入、1.55 秒淡出，只有「坏女孩」和「徐良 / 小凌」 |
| **歌词条不出现歌手名** | 原包 `drawSubtitle()` 本来就只画歌词、逐字染金，没有演唱者标签——保持原样，没有再加 |
| 走路修复与模板一致 | 引擎里角色本来就按位移迈步（不按时间），和 `通用模板/engine/actors.ts` 改完后的 `walkBy()` 是同一套做法 |

## 出片

```bash
npm i                      # 仓库根目录装依赖（Remotion + @sparticuz/chromium）
node tools/render_zip_mv.mjs fable --still 30     # 先抽一帧看构图
node tools/render_zip_mv.mjs fable                # 整片出 mp4（画面 + 音轨一起）
node tools/render_zip_mv.mjs fable --frames 0:240 # 只出一段，调试用
```

渲染走 Remotion 的 `bundle` + `selectComposition` + `renderMedia`，浏览器用 `@sparticuz/chromium`，
`gl=swangle` 软件 WebGL；`public/` 里的 `song.m4a` 由 `<Audio src={staticFile(...)}>` 直接混进 mp4。

## 注意

- 原包 `public/` 里只有 `bad-girl.srt`，**没有** `atlas.png` / `ZCOOL.ttf` / 歌曲文件；不补齐的话网页一打开就报「角色图集 atlas.png 加载失败」。素材来源见上表。
- 这首是《坏女孩》（徐良 / 小凌），原曲版权不在仓库里，公开前自己核授权。

## 2026-11-12 同步与分镜修订

- 音源从原曲 20 秒起；实测 126.999 BPM，拍长 0.47245 秒。
- 删除等距句长公式，改为 52 个逐句演唱起点。特别拆开「熟悉的侧脸」「迷人的笑脸 吸引视线」，以及「黑色的眼线 你的指间」「有一点轻蔑」。
- 句首对位与逐字染色分开：逐字高亮仍是句内插值，不宣称音素级强制对齐。
- 成片 60.60–92.99 秒间奏从四段同构横移改为十二镜：春日并肩、夏日绕行、秋日分岔、雪中空位、雨夜独行、人群擦肩、窗前未眠、桥上回望、夜空旋转、空场试灯、豆包踩拍、重回街口。长短镜头交替，主体保持原像素图集。
- 成片 150.20–153.37 秒增加桥段前灯光与距离镜头，停止拉长倒带镜头。片头增加河岸推进镜头。
- 不重复哭泣镜头，不显示来电计数与心电数据 HUD；倒带字卡不再使用字体缺失的箭头。
- `通用模板/tests/fable.test.mjs` 检查关键歌词时间、间奏无歌词、镜头连续覆盖和逐字轴单调性。

同源字幕与分镜表：`node tools/export_fable_timeline.mjs`，写入 `成片/坏女孩_fable5.2.srt` 与 `成片/分镜时间轴.json`。

最终音轨使用原始 AAC 包直接封装，避免二次编码延迟；本次机器检查与抽帧检查范围见 `成片/验收.md`。
