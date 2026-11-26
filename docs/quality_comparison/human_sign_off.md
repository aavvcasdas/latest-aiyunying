# 人工签收：未签

**状态：NOT SIGNED（2026-11-24）**

本轮可复现机器检查已通过（最新 `npm run qa:all`：52 JS + 13 Python 测试、typecheck、图集 682 格、`WHALE_REDRAW_OK 111 frames · 13 actions · 92 derived frames · 9 mirrors`、挥手 / 递出去回滚校验（4 张基础格逐像素等于加裙子固定之前的 f23… 快照）、58 个步态格无边界碎片、8 张立绘锚点、42 个资产哈希、11 个历史素材 / 22 份副本、两份月亮工程各 11 个派生图后处理哈希，以及 24 帧画质 / 运动 QA 平均帧差 1.997；另按用户授权输出 13 张 1920×1080 整模板清晰度镜头和 6.5 秒 / 78 帧的三版无声短片对照；`clothes_stability.json` / `whale_redraw_qa.json` 的 `errors` 均为 `[]`；仅保留历史生图 `legacy_unknown` 警告），但没有把任一整片从头到尾看过、听过，也没有做音频复核。按仓库规矩，机器检查、浏览器截图或短片对照通过不等于成片好看；发布前必须由人完成下面几项并把本文件改成已签。

- [ ] 整片从头到尾看过：镜头衔接、走位、遮挡、构图、闪白 / 长大切换
- [ ] 全程听过：音画同步、歌词卡点、片尾收束、无爆音 / 静音段
- [ ] 抽看真实逐帧 PNG 序列（不是模拟对照图）：确认没有空帧、冻帧、错帧、字幕残影
- [ ] 抽看本鲸 111 帧与 13 组动作的前后对照，确认新造型、步态、转圈衔接没有异物或断帧（机器检查见 `whale_redraw/whale_redraw_qa.json`）
- [ ] 抽看 6.5 秒三版短片对照，确认挥手 / 递出去已按你的指令回退到「加裙子固定之前」的原始参考格（手臂是原始姿势、裙摆跟着动，仍带有原始稿里的第三只手——这是你要求的）、干饭 8 帧都有可见饭碗、`idle` / `blink` 基础格是重画前旧版围裙 / 裙摆 / 靴子、其余动作下半身没有被锁死、发抖 / 摇摆舞 / 吃惊头身裙摆联动、8 帧走路已按最新指令回退到本次项目改动之前（节奏 / 裙摆 / 第三只手都是重画前的样子）、转圈不再细面条、`master_soft` 边缘不过糊（`whale_redraw/film_compare.mp4`、`whale_redraw/film_compare_contact.png`、`whale_redraw/new_fix_overview.png`）
- [ ] 抽看真实模板预览台 13 个动作的 1920×1080 清晰度检查，确认挥手那只手、递出去那只手、饭碗、裙摆和像素边缘在整模板里没有糊掉，也没有第三只手（`whale_redraw/gesture_hands_fix.png`）（`whale_redraw/template_clarity/template_clarity_contact.png`、`whale_redraw/template_clarity/template_clarity_details.png`）
- [ ] 抽看相邻动作卡与待机 8 帧，确认统一的是旧版下半身基础稿，不再随基础稿切换换衣服，也确实能随呼吸 / 点头 / 摇摆自然运动（`whale_redraw/clothes_fix_comparison.png`、`whale_redraw/clothes_idle_before_after.png`、`whale_redraw/clothes_stability.json`）
- [ ] 确认公开发布页的 AI 生成声明、音乐与角色形象授权边界
- [ ] 若使用 CRF16 / 12000k 母版，确认文件大小符合发布平台 / GitHub 限制

自动检查可复现命令：

```bash
npm run qa:all
npm run whale:qa -- --write
npm run walk:check
npm run clarity:shoot
npm run capture:film -- --dist <构建目录> --out /tmp/frames --dur <时长> --format png
npm run qa:motion -- --frames /tmp/frames
```

自动产物：`character_quality_comparison.png`、`comparison.json`、`motion_contact_sheet.png`、`motion_qa.json`、`generated_asset_report.json`、`assets.manifest.json`，以及 `whale_redraw/` 下的前后总览、局部对照、`new_fix_overview.png`、`new_fix_*.png`、`whale_redraw_qa.json`、`clothes_stability.json`、`linked_fix_similarity.json`、`clothes_fix_similarity.json`、`v2_similarity.json`、`final_similarity.json`、`film_compare.mp4`、`film_compare_contact.png`、`film_compare_frames/` 与 `template_clarity/`。这些只能说明「没坏」；上面的人眼 / 人耳项目仍为空。

签收人：________  日期：________  备注：________

## 2026-11-26：paperdoll 隔离实验（未签）

- 范围：仅新增 `paperdoll/` 的路线评估与完整像素贴图无声原型；未修改现行模板、人物母版或既有 MV 源码，不使原有作品因本次代码变更而过期。
- 机器检查：新增 13 项 Python 测试通过；`npm run typecheck` 通过；现行模板的 13 项 Python 测试单独运行通过。
- `npm test`：52 项 JS 中 51 项通过，1 项失败。失败是既有文档引用的 `通用模板/actions_preview/film_compare/compare.mp4` 在当前工作区不存在；没有伪造文件或放宽测试。JS 失败使串联的模板 Python 测试未自动执行，所以上面单独运行了它们。
- 样片：`paperdoll/demo/无声样片.mp4`（忽略入库），1280×720 / 30 fps / 8 秒；FFmpeg 完整解码验证 240 帧、无音轨；时间来自合成网格，`measured=false`，不代表歌曲实测对齐。
- `paperdoll/demo/qa.json` 只记录小型场景渲染与编码耗时，不是旧 / 新引擎同场景性能对比。
- 尚未通过人工整片观看，无音频可听，也未验证双人接触、独立肢体或 mesh；原型不等于成片质量验收。

- [ ] 人工完整观看无声样片，确认脚底、起落与镜头切换
- [ ] 后续在同资产、同音源、同输出参数条件下完成互动镜头 A/B
- [ ] 正式 MV 另行完成实测对齐、整片观看和全程试听

### 同日追加：用户授权参考图重绘（未签）

用户提供 GitHub 参考图与长提示词，明确要求重新生成并给端口看样片。使用图片生成工具完成单人全身图，用户选择第一张；未使用视频生成模型、未覆盖图集。仅为独立试片授权。

- `paperdoll/demo/重绘本鲸无声样片.mp4`：八秒 / 240 帧 / H.264，无音频，已完整解码；`measured=false`。
- 实验测试 17 项通过，包含白底连通去除、封闭白色衣物保留、实际 alpha、跳帧确定性与边界帧。
- 页面及图像 / 视频 HTTP 检查返回 200；端口 8000，绑定 `0.0.0.0`。
- 已检查样片封面，未由人完整观看；浏览器自动化因缺系统 `libnspr4.so` 未运行，未验证浏览器实际播放与手机布局。
- 当前只含整图呼吸 / 回弹 / 轻跳 / 摇摆，无独立肢体与接物。来源和哈希见 `paperdoll/assets/regeneration.manifest.json`。

### 同日再次追加：Cutout / Iki 重做（未签）

用户否定上一轮“整图抖动”，授权查看 Cutout 与 Live2D 类自动绑定路线重新生成。本轮新增两张必要的补画底图，人工标注独立部件与关节；未覆盖现行图集、人物母版或既有 MV。原始角色提示词完整保存至 `paperdoll/prompts/本鲸重绘_用户原始提示词.md`。

- A 是本地两骨骼蒙皮 + WebGL2，不是 Meta 自动识别 / BVH；A2 实际调用 Iki 自动绑定器、校验并由 IkiPlayer 播放八部件模型。
- 原先缺浏览器共享库的问题已通过复用 Chromium 包自带的 NSS 库解决，无需 root 或 apt；本轮已完成实际浏览器运行与交互验证。
- 8 项骨骼 Node 测试通过；浏览器验证脸和围裙在挥手时逐像素静止、图像发生非整图变化、随机跳帧确定性、Iki 眼 / 嘴参数与滑块交互、标签 / 骨骼开关及 390px 宽无水平溢出。控制台无脚本或纹理错误。
- `paperdoll/demo/Cutout关节无声样片.mp4` 与 `paperdoll/demo/Iki面部无声样片.mp4` 各八秒 / 240 帧 / 无音轨，分别完整解码与逐帧计数通过，MP4 仍忽略入库。首次整体导出超出 180 秒后复用了临时帧补完，未凑帧或拉长时长；完整结果见 `paperdoll/demo/cutout-qa.json`。
- 已抽看挥手、踏步、睁眼、闭眼、张嘴静帧，**无人完整观看签收**。未验证自然步态、遮挡碰撞、接物、音频口型、大角度转头或头发物理；不代表达到正式 MV 品质。

本轮最终复核：paperdoll Python 测试 23/23、骨骼 Node 测试 8/8、浏览器交互检查通过；`npm run typecheck` 通过；现行模板 Python 测试单独运行 13/13。根 `npm test` 仍为 JS 51/52，唯一失败仍是既有文档引用但未入工作区的历史 compare.mp4，没有改变测试来掩盖。未人工签收、未提交、未推送。


### 同日最终修订：同角色 Cutout + Iki 组合（未签）

用户明确否定上一轮软蒙皮和 A2 肤色，并要求组合而非分开的两条预览。本轮旧视频不再作为交付入口。

- 已生成无眼无嘴底图 v2，局部安装中性肤色皮肤，原闭嘴线从底图移除；原长提示词未改，另存分层修订提示词。取色修正为鼻梁，不从腮红采样。
- 上下段各一张刚性纹理，绕真实关节旋转；不再沿骨段加权弯曲。正面单图先做招手、脚底固定，不宣称完成自然走路。Iki 只画六个独立面部部件，统一时间与坐标合成到 Cutout 同一画布。
- 新入口为 `paperdoll/demo/Cutout-Iki组合无声样片.mp4`；先检查组合六格再全导出，8 秒 / 240 帧 / 30fps，无音轨，measured=false。机器记录在 cutout-qa.json。无视频生成模型。
- 模板追加 whale_cutout 和真实分层绘制 / 预载路径；旧八位立绘、像素图集均未覆盖。通用模板层 API 不是 Iki 完整绑定，不冒称自然眨眼或左右臂 IK。
- 用户已解除禁生图 / 永久哈希锁；保留可更新版本、来源、缺文件 / 缺字 / 实测音轨 / 确定性质量检查。已检查《童话镇》L01 六格与临时新分层项目六格。
- 已抽看组合挥手 / 张嘴 / 闭眼 / 六格；**未人工整片签收或试听**。需要用户确认正常运动的观感，机器通过不代替视觉认可。无声样片不能被称作音频口型同步成片。


### 用户再次否定后：改通用角色 / 模板，不导出新样片（未签）

上述独立实验的视觉结论被用户否定，不能继续作为正常手脚的证明。最新改动在通用模板：rig 声明强制固定骨长三段纹理 / FK / IK，缺绑定报错，不落回横带；重定膝 / 踝位置，手掌和鞋独立，支撑期世界脚踝固定，摆动脚抬起、双臂反相。新身体补画仅重建被遮挡的头发和尾巴，关节盖片是局部刚性美术，不伸长纹理补缝。

同一个 Tachie 在模板 commit 中每帧画独立眼睛、眉形、眼睑、嘴形与泪光，六种表情可直接切换。预览为模板骨架定格台，能暂停 / 逐帧 / 肘角归零；没有导出本轮 MP4。旧 8000 实验服务关闭，活动预览为 5173 的 rig 页面。

已验证骨长、直臂共线、脚踝世界接地、同向屈膝、无 scale/shear 的骨段绘制与跳帧确定性；真实浏览器六表情像素不同，表情不影响腿部像素，自动切换与逐帧有效，控制台无错误。模板 R1 的 319 帧顺逆序与 29 字字形检查通过，六格临时静帧检查通过；童话镇 L01 的 4272 帧顺逆序 / 188 字和六格回归通过。第一次并行静帧检查在 180 秒截止，随后关闭取消导出遗留的浏览器，只重跑单独六格成功，没有用旧静帧凑数。

仍需人工确认：当前正面原画的二维走路是否自然，肩 / 膝轮廓与遮挡是否达到预期。新协议只实绑本鲸，旧八位立绘没有假装全部完成。当前丰富表情是模板同步绘制，并非声称旧 Iki 模型已拥有完整喜怒哀乐绑定。人工签收 false，未提交、未推送。
