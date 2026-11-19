# 当前 MV 的人物图集：存在哪里、坐标怎么读

> 这一页讲的就是现在这一部——《譬如我》3D 版（`番外MV/譬如我_sonnet5.5/`）：它的图集在哪、坐标表怎么读、
> 角色为什么看着糊。图集与仓库母版 `通用模板/engine/assets/cast_atlas.png` 逐字节相同。

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

## 6. 为什么角色看着糊（2026-11-18 实测）

结论：**不是「挤到一张图」的锅**。图集打包效率是好的——538 帧共 4.81 Mpx，占 2048×3126（6.40 Mpx）的 **75%**，几乎没有空白浪费；
就算把每个角色拆成独立文件，单帧还是 84×90，一样糊。真正的三个原因，按贡献从大到小：

**① 源头分辨率不够（根本原因）**
单帧中位数 90×90（最小 39×86，最大 148×186）。1280×720 画面里，近景的鲸约 250 px 高（`px=1/46` 加相机距离），
也就是 **把 90 px 的图放大了 2.8 倍**；脸只有约 30×30 px 的信息量，放大后五官必然糊。
`magFilter = NearestFilter` 让放大后的边缘是硬方块（所以看起来是「马赛克边缘 + 糊脸」的混合观感，不是均匀的模糊）。

**② 全屏后期吃对比度（观感上最像「糊」的那一层）**
`UnrealBloomPass` 强度 0.45–0.6、阈值 0.8，加上 FX 里 `ca = 0.0012 + hit*0.009` 的色差——**基线 0.0012 让每一帧都带红蓝边**。
实测：鲸的白色围裙在 A 里被 bloom 烧穿成一团白；把 bloom 缩到 0.45 倍、阈值抬到 0.95、色差基线归零，围裙上的鲸鱼图案立刻回来了。

**③ 出片链路的二次损失（次要）**
`toDataURL(image/jpeg, 0.94)` → h264 crf23。颗粒是 shader 每帧现算的噪声，编码器为了保住它吃掉大量码率，反而把细节抹平。

### 实测对比（`清晰度对比.jpg`，同一帧 145 s，放大 3 倍看）

| 方案 | 做法 | 效果 | 代价 |
| --- | --- | --- | --- |
| A 现状 | 720p 直出、bloom 0.5、色差 0.0012 | 白围裙过曝、轮廓带红蓝边 | — |
| B 只改后期 | bloom ×0.45、阈值 0.95、色差基线 0 | 细节回来、剪影干净；边缘仍是硬方块 | 要重渲，20 分钟；片子会变"素"一点 |
| C 2× 超采样 | 2560×1440 渲染 → LANCZOS 降到 1280×720 | 边缘方块变成亚像素，最接近"变清楚" | 软件光栅化像素量 ×4，约 80 分钟 |

C 不是增加细节，是把 `NearestFilter` 的方块边缘做了抗锯齿，所以"方块感"消失、脸的模糊依旧（源头就 30 px）。
要真正变清楚只有一条路：**把母版图集分辨率提上去**（4× 重绘或超分到 8192×12504 已经顶到 WebGL 纹理上限，
建议按角色拆成多张，一角色一张或两角色一张，每张不超过 4096）。

### 如果以后要重做图集，顺序建议

1. 先在母版上按 2–4 倍分辨率重绘/超分（这是唯一能加细节的步骤）；
2. 拆图：`whale` 92 帧最重，单独一张 4096×4096 够用；其余角色两两合并；
3. `RECTS` / 行表照旧生成，`Actor` 里的 UV 换算只依赖 `ATLAS_W/ATLAS_H`，改常量即可；
4. 出片时用 1.5× 超采样 + B 的后期参数，边缘和对比度一起解决。
