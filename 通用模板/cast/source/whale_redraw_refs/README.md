# 本鲸母版重画来源（2026-11-24，挥手 / 递出去已回滚到加裙子固定之前）

用户在当前分支明确选择了 `full_redraw` / `all_actions` / `sync_all`：允许重新生成全部本鲸母版帧、重建 13 个动作 / 92 个派生动作帧，并同步所有镜像与派生图。随后又选择 `master_soft` / `regen_closer` / `spin_point` / `short_film`，并追加纠正「挥手手还是断的请修复」「这对吗 / 干饭的饭呢 / 渲染整个到模板里看看清晰度」。

随后用户又用 `image-6.png` 指出 `act_whale_point_5` 仍然「3 只手」，并明确要求「重新生成这个，这个还是3只手，不要把手也固定在这张图上」，接着补充「挥手打招呼，也 3 只手，第一张，重新生成替换掉，下面的裙子就不固定了」「挥手打招呼下面的裙子不固定了，然后递出去就替换」。因此挥手 / 递出去两张基础稿改成本轮重新绘制的单手稿（`whale_wave_v4_raw.png` / `whale_point_v4_raw.png` 及后续 v5 / v6 修手稿），不再逐像素回退旧参考格，也不再贴旧下半身补丁。`ask_user` 明确只替换「递出去前 2 帧」对应的基础图（`whale_point` / `whale_big_point`），不重做整套。

**最终结论（同日最后一次 `ask_user` 选 `f23`）**：用户改口要求把挥手打招呼 / 递出去（让位）回退到「加裙子固定之前」的状态，其他 11 个动作不变。因此 `whale_wave_clean.png` / `whale_point_clean.png`（及 `_v3_clean`）已换回 `whale_{wave,point}_ref.png` 的副本，`WHALE_LINK.wave/point = 0`、`ACTIONS.point.padX = 8`；两个动作重新带原始参考稿里的第三只手，这是用户要求的取舍，`hide_extra_hands.py` 不再参与这两张稿，仅留档。

之后用户明确撤销「把下半身一直定着」的旧衣服修复：`ask_user` 澄清为 `old_lower_body`（恢复 `cast_atlas.before.png` 的重画前白色围裙 / 裙摆 / 靴子）、`unlock_all`（删除 `freezeWhaleClothes()`，让 `pose()` 自然带动头 / 躯干 / 裙摆 / 腿）、`fix_linkage_only`（只修发抖 / 摇摆舞 / 吃惊等既有动作的头身联动，不新增喜怒哀乐动作、头像或帧位，682 格坐标不变）、`fix_rhythm`（保留当前蓝发侧脸造型，重做手臂 / 双腿 / 鱼尾走路节奏，不逐像素回退旧步态，也不新生成一套走路图）。这里保存的是**这一轮单独授权**的重画依据，不是给后续作品继续「新增生图」开绿灯。

## 文件

- `*_ref.png`：从重画前母版 `cast_atlas.png` 按 `cast_atlas.json` 原坐标切出的旧本鲸参考格（正脸 / 大只 / 头像 / 步态 / 转圈等）。
- `whale_{front,blink,wave,point,side}_v1_raw.png` / `_v1_clean.png`：上一轮重画原稿与硬边清洗稿，保留作 V1 对照。
- `whale_{front,blink,wave,point,side}_v2_raw.png` / `_v2_clean.png`：以旧参考格为主、V1 为辅助的 V2 重画原稿与清洗稿。
- `whale_{wave,point}_v2_fixed_clean.png`：`fix_whale_arms.py` 的历史断手修补记录，只作历史对照。
- `whale_{wave,point}_static_hand_before.png`：被撤销的「逐像素回退旧参考格」版本备份（就是用户 image-6 里三只手的那版来源）。
- `whale_wave_v4_raw.png`、`whale_point_v4_raw.png` / `_v4_raw_edited.png` / `_v5_raw.png` / `_v6_raw.png`：本轮重新绘制的挥手 / 递出去原稿链；最终成品是下面两张 clean 稿。
- `whale_{front,blink,wave,point,side}_clean.png`：当前正式输入。`wave`（`312×352`）/ `point`（`308×352`）现为 `whale_{wave,point}_ref.png` 的副本（回滚到加裙子固定之前：原始手臂姿势 + 该稿自己的裙摆，不贴旧补丁）；只有 `front` / `blink` 的 `[0.18,0.58,0.82,1.0]` 下半身仍由 `cast_atlas.before.png` 的旧版围裙 / 裙摆 / 靴子补丁统一。`whale_{wave,point}_v3_clean.png` 与当前 clean 稿保持同步（也是 ref 副本）；`whale_{wave,point}_v2_fixed_clean.png` 是已弃用的单手稿备份；`*_oldclothes_before.png` / `*_static_hand_before.png` 是补丁前备份。**RGB 棋盘格原稿不要直接烘进图集。**
- `new_base_contact.png` / `docs/quality_comparison/whale_redraw/new_base_walk_preview.png`：基础格与 8 帧步态预览。
- `whale_sprites.json`：`encode_whale_sprites.py` 生成的 29 条索引色精灵记录（其中 8 条写入 `walk_cycle_data.js`）。`whale_side` 是当前蓝发侧面基础格，用于派生步态与转圈；它不是图集里的独立格子。
- `walk_legacy.json`：重画**之前**那套步态的逐字节备份（`walk_whale_0–7` 八帧 + `whale_walk_0–3` / `whale_map_0–3` / `whale_map_pt`），取自 commit `7217fde`。2026-11-24 用户要求「本鲸的走路回退到本次项目改动之前」，`encode_whale_sprites.py` 现在直接从这里取步态记录，不再从 `whale_side_clean.png` 派生；`whale_side` 仍用于转圈，但不是图集格子。
- `clean_whale_raw.py`、`hide_extra_hands.py`、`fix_whale_clothes.py`、`encode_whale_sprites.py`、`apply_whale_sprites.mjs`、`apply_whale_walk.py`：从 alpha 原稿重建 `sprites_data.js` / `walk_cycle_data.js` 的确定性脚本。`hide_extra_hands.py` 是上一轮单手稿的工具，现已不参与构建（仅留档）。`fix_whale_clothes.py` 的 `TARGETS = ('front','blink')`；`encode_whale_sprites.py` 对 `front` / `blink` 在 fit 之后精确贴回旧图集补丁，对 `wave` / `point` 直接用回滚后的 clean 稿（plain `fit()`）。
- `restore_original_pose_refs.py`、`fix_whale_arms.py`：**已停用**，只保留历史记录；它们就是产生三只手静态稿的路径。

## 画法与限制

- 造型锚点沿用旧本鲸格：蓝发、鲸鳍鲸尾、蓝白女仆装、白围裙；没有引入外部角色图或素材包。V2 相对 V1 更贴近旧参考的脸型、发型、帽沿和裙摆轮廓；本轮只改本鲸，不新增表情动作 / 头像 / 帧位。
- 所有下游像素仍量化到 `通用模板/cast/source/px.js` 的 248 个调色板条目（去重后 246 色），透明索引固定为 `255`。
- `encode_whale_sprites.py` 输出的索引色精灵仍是硬 alpha；`master_soft` 只在 `通用模板/cast/bake_atlas.mjs` 给 111 个本鲸格添加一层调色板内的 1px 半透明边缘（alpha `184`，由 `tools/render_defaults.json` 的 `pixelSmoothing: 0.28` 决定）。其他 7 位角色仍是 0 / 255 两档硬 alpha。
- `通用模板/engine/actors.ts` 的 `pixelMat` 对本鲸卡片使用同值 `0.28` 的十字邻域 RGB 轻微混合，并保留边缘 alpha；其他角色卡片仍为 `0`。`atlasFilter` 仍为 `nearest`，没有改成整体糊化或高分辨率母版。
- 基础格按 `cast_atlas.json` 原有尺寸重采样，保留透明留边；`front` / `blink` 的下半身仍是旧版补丁，挥手 / 递出去用自己的新裙摆（用户已明确不要固定），并且**不再在动作烘焙后锁死**。`motion_core.mjs` 的 `pose()` 新增可选 `link` 系数，把 `headDx/Dy` 的一部分从脖子平滑传到躯干、裙摆和腿，脚底仍锚定；`bake_actions.mjs` 的 `WHALE_LINK` / `WHALE_MOTION` 只覆盖本鲸，其他 7 位角色逐像素不变。
- 8 帧侧视步态**已按用户 2026-11-24 的指令整体回退到本次项目改动之前**：`walk_legacy.json` 里保存的原始记录逐字节写回 `walk_cycle_data.js` / `sprites_data.js`，因此手臂 / 双腿 / 鱼尾节奏、裙摆形状都是重画前的样子（`encode_whale_sprites.py` 的 `walk_variant()` 不再用于生成步态，仅留代码给未来重画参考）。`tools/fix_whale_walk_bleed.mjs` 的清像素补丁本来就已经应用在这份数据上，`--check` 通过；转圈仍用 `whale_side_clean.png`。
- `bake_actions.mjs` 仍在 8 张 `act_whale_eat_*` 帧里盖入既有 `prop_bowl`；`tools/check_whale_redraw.py` 现在按 `rolledBackGestureCells` 校验 `whale_wave` / `whale_point` / `whale_big_wave` / `whale_big_point` 与 `cast_atlas.clothes_before.png`（f23…）逐像素一致，并要求 clean 源等于对应 `_ref.png`；上一轮的 `singleGestureHandCells` 单手断言已按本次指令撤销。
- `spin` 仅对本鲸改用真实侧面格，并把 V1 的 `0.72` / `0.78` 横向压缩放宽到 `0.88` / `0.94`，替换原先把正脸压到 `sx: 0.34` 的细面条帧；其他 7 位角色的动作数据逐像素未变。
- `cast_atlas.json` 的 682 个矩形坐标保持不动；图集仍是 2048×3126，不属于新增高分辨率母版。

## 来源与许可状态

生成工具是 Arena `generate_image`，调用时未暴露模型名、版本或 seed，因此记为 `model_unknown / version_unknown / seed_unknown`。原稿以仓库内旧本鲸像素格为参考，属于用户明确授权的 AI 重画；角色形象的上游许可仍未核，公开前需要按 `素材许可与来源.md` 完成 AI 生成声明与授权边界确认。

## 复现顺序

```bash
.venv/bin/python 通用模板/cast/source/whale_redraw_refs/clean_whale_raw.py <raw.png> <clean.png>
# 挥手 / 递出去：缩到成品尺寸并把多余的手补平（各出一张只有一只手的 clean 稿）
.venv/bin/python 通用模板/cast/source/whale_redraw_refs/hide_extra_hands.py <raw_clean.png> whale_wave_clean.png --size 312x352
.venv/bin/python 通用模板/cast/source/whale_redraw_refs/hide_extra_hands.py <raw_clean.png> whale_point_clean.png --size 308x352
.venv/bin/python 通用模板/cast/source/whale_redraw_refs/fix_whale_clothes.py
.venv/bin/python 通用模板/cast/source/whale_redraw_refs/encode_whale_sprites.py
node 通用模板/cast/source/whale_redraw_refs/apply_whale_sprites.mjs
.venv/bin/python 通用模板/cast/source/whale_redraw_refs/apply_whale_walk.py
npm run actions
npm run atlas
.venv/bin/python tools/split_cast.py --write
# 同步 9 面镜像后再刷新清单
npm run assets:write
npm run whale:qa -- --write
npm run qa:all
```

`npm run actions` 默认保留已有坐标；只有需要重排全部派生格时才显式加 `--repack`。9 面镜像同步、派生图同步、`assets.manifest.json` 刷新、短片捕获、整模板清晰度截图与 QA 结果记录在 `docs/quality_comparison/whale_redraw/whale_redraw_report.md`；新的回归写在 `tools/check_whale_redraw.py` 的 `clothesStability` 段与 `clothes_stability.json`：旧下半身基础格 8/8 精确、84 张非转圈动作不再要求 84/84 冻结、头身联动动作已启用、8 张干饭饭碗可见、8 帧步态各不相同。`docs/quality_comparison/human_sign_off.md` 仍是 **NOT SIGNED**。
