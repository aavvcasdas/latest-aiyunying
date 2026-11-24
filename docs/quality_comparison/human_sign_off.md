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
