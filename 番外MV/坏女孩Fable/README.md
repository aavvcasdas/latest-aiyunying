# 坏女孩（fable5.2）· Remotion 版

来源：用户提供的 `fable5.2坏女孩.zip`（Vite + React，zip 原件放在本目录的 `来源/` 下，2026-11-12 从仓库根挪进来；`src/mv/engine.ts` 是一套 **Canvas2D 画家算法**的软 3D 引擎，
1280×720 @24fps，195 秒；同一份 `render(ctx, t)` 既在网页里实时预览，也能被逐帧调用）。
这里没有重写引擎，只做了三件事：补齐素材、套一层 Remotion 合成、按规矩改片头。

> 谁在这支片子里演谁、这个形象兑现她哪条习性：[`../设定表.md`](../设定表.md)。

## 目录

| 路径 | 内容 |
|---|---|
| `api/engine.ts` | 原包引擎，一行没改（`render(g, t, {subtitles})` 是纯函数，同一个 t 永远同一帧） |
| `api/beats.json` `api/cast_atlas.json` | 原包鼓点 / 角色图集切片表（与 `3d坏女孩.zip` 里那份**完全一致**，已核对） |
| `assets/atlasData.ts` `assets/fontData.ts` | 原包缺的像素图集与字体，从 `3d坏女孩.zip` 里补齐（base64） |
| `public/song.m4a` | 内嵌音轨，从原曲 20.0 秒截起，195.11 秒 |
| `Fable.tsx` | Remotion 合成：一块 canvas + 每帧 `render()` + `<Audio>` + 片头卡 |
| `entry.tsx` | `registerRoot` + `<Composition id="Fable">`（4680 帧 = 195×24） |
| 成片（成片/坏女孩_fable5.2.mp4） | 出片结果。2026-11-12 已出库，跑下面那条命令就回来 |

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

## 发布物料

封面与标题在 `发布/` 下：`发布/发布文案.md` 里是四张封面（3:4 与 4:3 各一主一备）、主标题加三条备选、简介与话题；
图由 `python3 番外MV/坏女孩Fable/make_covers.py` 出（取成片真帧，裁掉底部字幕带，字用模板字体），重跑一遍就把四张覆盖回去。

## 注意

- 原包 `public/` 里只有 `bad-girl.srt`，**没有** `atlas.png` / `ZCOOL.ttf` / 歌曲文件；不补齐的话网页一打开就报「角色图集 atlas.png 加载失败」。素材来源见上表。
- 这首是《坏女孩》（徐良 / 小凌），原曲版权不在仓库里，公开前自己核授权。
