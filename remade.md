# Q 版人物（立绘图集）存在哪里

> 记录时间 2026-11-18。查的是《譬如我》3D 版（`番外MV/譬如我_sonnet5.5/`）这一包，图集与仓库母版逐字节相同。

## 1. 看图集：`番外MV/譬如我_sonnet5.5/源码/src/assets/atlas.png`

| 项 | 值 |
| --- | --- |
| 尺寸 | 2048 × 3126，RGBA PNG |
| 体积 | 1 689 618 B（1.62 MB） |
| `sha256` | `5f9894b6ad38c26a…`（与 `通用模板/engine/assets/cast_atlas.png` **完全相同**） |
| 风格 | Q 版像素立绘，单帧 84×90 上下，`NearestFilter` 硬边 |

这一包的美术是齐的，图集直接就是母版，**没有做过重排**（对比：上一版 `譬如我` 的包只带代码，才需要按行坐标重新拼 `motion.webp`）。

## 2. 坐标表：`番外MV/譬如我_sonnet5.5/源码/src/mv/atlasData.ts`

同一个工程里的 TypeScript 文件，三样东西：

- `ATLAS_W = 2048` / `ATLAS_H = 3126`
- `RECTS`：**686 条**矩形，键名是帧名，值是 `[x, y, w, h]`，例如 `act_whale_idle_0: [1118, 2055, 84, 90]`
- `ACTIONS`：`角色 → 动作 → { fps, loop, frames[], size[] }`，共 **8 个角色 / 59 个动作 / 538 帧**

> 686 条里只用到 538 帧，多出的矩形是别的片子借过的帧，留在表里无害。

### 角色 × 动作一览

| 角色 | 动作 | 帧 | 动作名 |
| --- | --- | --- | --- |
| `whale`（鲸鱼娘） | 13 | 92 | idle, wave, point, eat, hop, nod, shake, bow, sway, surprise, sad, spin, shiver |
| `gpt` | 9 | 64 | float, hover, cast, rage, nod, tilt, bow, surprise, shake |
| `claude` | 10 | 70 | idle, curtsy, read, tilt, nod, shake, petri, lookaround, sad, hop |
| `doubao` | 9 | 66 | idle, step, sway, hop, nod, bow, tilt, surprise, spin |
| `gemini` | 9 | 68 | idle, lookaround, choose, hop, sway, spin, nod, surprise, tilt |
| `kimi` | 8 | 60 | idle, think, nod, bow, lookaround, shake, sad, hop |
| `qwen` | 8 | 60 | idle, spin, bow, sway, nod, tilt, hop, shake |
| `zai` | 8 | 58 | idle, doze, alert, nod, shake, tilt, hop, lookaround |

## 3. 母版（所有片子共用的源头）

- `通用模板/engine/assets/cast_atlas.png`（2048×3126，1.62 MB）
- `通用模板/engine/assets/cast_atlas.json`（30 KB，**按行**记：每行 `{ y, w, h, n, fps }`，第 i 帧的 x = `i × w`）

各工程里的副本（都是这张图 / 这份行表）：

| 路径 | 内容 |
| --- | --- |
| `番外MV/譬如我_sonnet5.5/源码/src/assets/atlas.png` + `src/mv/atlasData.ts` | 图集本体 + 逐帧矩形表（当前项目） |
| `番外MV/不小心惹了上帝/源码/src/assets/{cast_atlas.png, cast_atlas.json}` | 图 + 行表 |
| `番外MV/樱花树下的约定/源码/src/assets/cast_atlas.json` | 只有行表 |
| `番外MV/坏女孩Fable/api/cast_atlas.json` | 只有行表 |
| `参考资料/参考MV/反乌托邦/src/mv/data/cast_atlas.json` | 只有行表 |

## 4. 怎么用（`src/mv/engine.ts` 的 `Actor`）

```ts
// 按帧名查矩形 → 换算 UV（e = 0.4 是防相邻帧溢出的内缩）
const [x, y, w, h] = RECTS[actions[who][action].frames[idx]];
const e = 0.4;
const u0 = (x + e) / 2048, u1 = (x + w - e) / 2048;
const v0 = 1 - (y + h - e) / 3126, v1 = 1 - (y + e) / 3126;   // 图集 y 轴朝下，v 要翻
// 贴到 1×1 平面，px = 1/46 定世界尺寸 → 鲸约 2 个世界单位高
mesh.scale.set(w * (1 / 46) * k * flip, h * (1 / 46) * k, 1);
```

- 材质是 `MeshBasicMaterial({ map: atlas, alphaTest: 0.3, side: DoubleSide })`：**不受光照**，靠 `mat.color` 乘色来表现「夜 / 昼 / 黎明」三套调色。
- 帧号由时间算：`floor((T - t0) × fps × speed)`，`loop` 为真就取模，否则夹到末帧。
- 每帧还会 `rotation.y = atan2(cam.x - x, cam.z - z)`，让纸片人始终转向镜头（billboard）。

## 5. 坑 / 注意事项

- **`whale-walk` 在母版里叫 `walk_whale_0..7`**，不是 `act_whale_walk_*`。按 `act_` 前缀扫会漏帧，`坏女孩Fable` 曾经就崩在「缺帧 `act_whale_walk_5`」上。
- 母版行表是「行布局」，`atlasData.ts` 是「逐帧矩形」，两套坐标不能混用；要新角色请从行表生成矩形，别手抄。
- 单帧只有 84×90 上下，1280 宽下近景会放大 3–4 倍，**看到像素块是设计如此**，不是渲染坏了。要更细腻只能换更高分辨率的母版。
- 图集体积小、变化少，适合直接入库；`dist/` 与 `node_modules/` 已在 `.gitignore` 里，别把构建产物带进来。
