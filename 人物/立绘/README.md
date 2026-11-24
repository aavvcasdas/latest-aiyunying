# 立绘（长大后的样子）

> **先说规矩**：这八张全身立绘是角色的**长大后的样子**。
> **主要用 Q 版；长大时刻才接立绘**。允许混用，也允许同一个镜头里混（渐变长大、和长大的自己对话）——
> 已经接进 Remotion 成片线：`通用模板/engine/tachie.ts`，样板 `通用模板/样板/tachie/`。完整规则见 [`../设定/立绘.md`](../设定/立绘.md)。
> 其余所有画面照旧用 Q 版图集（`通用模板/engine/assets/cast_atlas.png`）。

这套东西是从用户 2026-11-14 上传的 `立绘.zip`（工程包）＋ `立绘图片.zip`（八张图）落进仓库的。
原包是《勾指起誓》的「立绘版」网页工程：把代码做的 MV 搬成网页，角色从 Q 版像素纸片人换成**立绘**，动作由一套骨架形变**实时渲染**。

- `/` —— MV 播放台：62 个镜头、41 句歌词卡拍；逐镜可改编排（谁上场、做什么动作、背景、特效、运镜、景别），改动存进 PostgreSQL。
- `/cast` —— 立绘动作库：八位角色 × 8–13 个动作 × 12 种头顶表情贴，点一下实时预览。

**这里只用它的动作引擎，不重渲整支成片**：`npm run actions:render` 离线把「立绘 + 动作」渲成 gif 和总览图，
产物在系统临时目录 `/tmp/tachie_preview/`（脚本现产，不入库）——总览图一张、八个角色各三个动作的 gif 共 24 个。

## 立绘怎么动起来的

一位角色只有一张立绘，没有分层、没有逐帧图。`src/mv/rig.ts` 把立绘沿脊柱切成 48–112 条横带，从脚底往上逐条积分位置和角度；
`src/mv/actions.ts` 里每个动作是一组参数随时间的函数（起跳、倾斜、脊柱弯曲、头部转动与俯仰、屈膝、躯干压缩、胸口呼吸、纸片翻面、染色）。
所以点头、歪头、鞠躬、行礼、摇摆、起跳、转身都是连续形变，并且都叠着呼吸。

**做不到的**：单张立绘没有独立的手臂和五官，所以没有抬手、眨眼、口型。「打招呼」是侧身加轻跳，「递出去」是整个人向前探，不是真的伸手。
要这些得把立绘拆层（手臂、眼睛、嘴各一层）再接进骨架。

## 目录

| 路径 | 内容 |
| --- | --- |
| `art/raw/` | 八张立绘原图（透明底、1280 高、全身正面）；用户上传的 `立绘图片.zip` 解在这里 |
| `art/tachie/` | 可直接喂给骨架的那份（与原图同尺寸）；换图就覆盖这里 |
| `src/mv/cast.ts` | 八位角色：立绘路径、尺寸、颈线 `neck` 与脊柱 `cx` / `hx`、招牌动作（数值是从这批图上量出来的，不要随便改） |
| `src/mv/actions.ts` | 动作库：每个动作一组参数随时间的函数 |
| `src/mv/rig.ts` | 立绘骨架渲染：切横带、逐条积分、表情贴 |
| `src/mv/scene.ts` | 背景调色、粒子、运镜、歌词扫色、整帧合成 |
| `src/mv/shots.ts` | 默认分镜表，一行一个镜头；演员写法 `角色:动作@站位[>移动到][<][!表情][*缩放]` |
| `src/mv/timeline.ts` | 85 BPM 的拍点与 41 句歌词 |
| `src/components/` | 播放台、动作库页面（`/cast`）、素材加载 |
| `src/db/schema.ts` | `shot_overrides`：只存被改过的镜头 |
| `tools/render-actions.mjs` | **离线渲染**：不进浏览器，直接出 gif / 总览图；逐帧纯函数，不再用全局累加 `T` |
| `tools/key-tachie.mjs` | 默认检查八张透明底 + 骨架锚点；`--write` 只刷新 `art/tachie/metrics.json`，不生成新图 |
| `tools/key-tachie.cjs` | 旧版绿幕抠图脚本，默认 check-only；`--write` 也只对真正的绿幕原图生效，输出 `public/tachie/*.png` |

## 离线渲一套动作（不需要浏览器、不需要数据库）

```bash
cd 人物/立绘 && npm install       # @napi-rs/canvas / esbuild / sharp 已写进 devDependencies

npm run actions:render                   # 八个角色 × 招牌三个动作 + 总览图
npm run tachie:check                     # 检查透明底、尺寸与骨架锚点
npm run assets:mirror                    # 逐字节复制现有立绘 / 字体 / 音轨到 public/
```

产物都在 `/tmp/tachie_preview/`：

- `/tmp/tachie_preview/立绘_动作总览.png` —— 八行，一行一位角色，六列是她的六个动作（各取一遍里最开的那一帧）
- `/tmp/tachie_preview/<角色>_<动作>.gif` —— 360 宽，15fps，动作循环

脚本会把 `src/mv` 里的 TS 用 esbuild 现场打包（不另抄一份逻辑），再用 `@napi-rs/canvas` 逐帧画。
`rig.ts` / `actions.ts` 改了，重跑一遍就是新的。网页播放台还通过 `window.__FILM__` 暴露纯函数逐帧接口，
可用 `npm run capture:film` 从仓库根出 lossless PNG 帧，不再依赖浏览器实时录屏。

## 换立绘

1. **本次修复没有换图、没有新增生图**。`art/tachie/*.png` 保持原样；`public/tachie/*.png` 只是逐字节副本，`assets.manifest.json` 会核对两边哈希。
2. 骨架参数只读 `通用模板/engine/assets/tachie_anchors.json`；网页 `cast.ts`、模板 `tachie.ts` 和离线工具共用这一份，不再各写一套数字。当前 `layerStatus` 是 `single-layer`，没有独立眼睛 / 嘴 / 手图层。
3. 真要换图（需要用户明确批准）：新图必须透明底、全身、正面站立、统一 1280 高；更新锚点 JSON、`npm run assets:mirror` 与 `assets.manifest.json`，再 `npm run tachie:check` 和 `npm run actions:render` 验证。不要覆盖历史原图。

## 发布前要自己确认的

- **立绘是 AI 生成的**（`立绘图片.zip` 里的 `立绘说明.txt` 也这么写）。原仓库 `设定/动作库.md` 写着「不许生图，不许把外部素材抠进来」，
  这套立绘破了那条；要不要改规矩、平台上要不要补「AI 生成」声明，见 [`../素材许可与来源.md`](../素材许可与来源.md)。
  这也是它**默认不用**的原因之一。
- **音乐**：《勾指起誓》的音轨原仓库自己写着没有授权记录，公开前要核。
- 字体是站酷快乐体（OFL），许可文件在 `public/fonts/`。
- 网页上的「录制整片」仍是浏览器实时录屏（WebM），机器卡的时候会掉帧；**成片 / QA 请用 `npm run capture:film` 的纯函数逐帧 PNG**。上面的 `render-actions.mjs` 只用于单角色、单动作预览。
