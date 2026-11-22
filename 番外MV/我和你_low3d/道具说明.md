# 《我和你》low3d 像素道具

本工程从 `我和你opus5.5-low3d.zip` 解压，首页默认是 three.js 3D 版。运行时会从 `/mv/props/` 加载六张透明 PNG，供 3D 纸片道具使用。

## 道具清单

| 文件 | 尺寸 | 画面内容 |
|---|---:|---|
| `toys.png` | 96×72 | 积木与玩具小火车 |
| `tv.png` | 96×72 | 复古显像管电视 |
| `sneakers.png` | 96×72 | 一双蓝色儿童跑鞋 |
| `backpack.png` | 96×72 | 红黄探险背包 |
| `paperplane.png` | 96×72 | 折纸飞机 |
| `wateringcan.png` | 96×72 | 蓝绿色浇水壶 |

以上六张均为本仓库内用 Pillow 绘制的原创像素风透明素材，生成脚本在 `素材/generate_props.py`；**不是 AI 生成人物，也没有改动仓库角色图集**。透明底、RGBA，运行时采用 three.js 平面贴图和 nearest 采样。已实际用于 3D MV 的道具镜头。

角色图集则来自仓库 `人物/` 原有资源，WAV 来自仓库根目录 `我和你.WAV`。成片中保留逐词歌词字幕。字幕使用 Google Fonts Noto Sans SC 字符子集（SIL Open Font License，许可证随 `源码/public/fonts/` 提供）。

## 位置与复现

- 页面与 three.js 源码：`源码/`
- 运行素材：`源码/public/mv/props/`
- 元数据：`道具索引.json`
- 重绘素材：在仓库根目录执行 `python3 '番外MV/我和你_low3d/素材/generate_props.py'`
- 下载包：`源码/public/downloads/wohe-ni-props.zip`
