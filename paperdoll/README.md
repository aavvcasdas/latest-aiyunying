> 最新决定：用户已否定这里的上一轮手脚 / 表情表现，并要求停止导出样片、主要修改通用角色与模板。当前活动入口是 `npm run rig:preview`（5173 端口），说明见 `通用模板/角色骨架.md`。以下内容仅保留实验历史，不作为最新角色实现的验收结论。旧 8000 端口预览已关闭。

# 纸片人路线评估与隔离原型

**现行制作入口仍是 `通用模板/`；这里不是替代模板。** 不使用视频生成模型。首次评估未新增图片，后续按用户明确授权重绘本鲸并补画必要的遮挡区域；未覆盖现行图集。

## 当前入口：Cutout + Iki 同角色组合

上一轮分开的 A / A2 与软蒙皮已被用户否定，不再作为当前方案。页面现在只展示**一个组合角色**：上下段刚性 Cutout 手脚 + 真正 Iki 独立眼睛 / 嘴部，统一时间、统一坐标、统一输出画布。

- 当前视频：`demo/Cutout-Iki组合无声样片.mp4`，8 秒 / 240 帧 / 30fps / 1280×720，无音轨，`measured=false`。
- 先看 `demo/Cutout-Iki六格检查.png`。脚底固定，做双侧招手 / 收臂；正面单图不侧折膝盖冒充自然走路。
- 刚性部件保留形状和骨长，不再使用 42px 线性混合蒙皮；圆形重叠关节遮缝。
- 重新生成 `assets/whale-face-cleanplate-v2.png`，只安装五官孔洞的皮肤；鼻梁与其他脸颊保持原像素。匹配取样只用鼻梁，不把腮红铺进眼眶。底图没有原来的闭嘴线。
- Iki 模型现在为 6 个**纯面部部件** / 11 参数，没有第二个 body / face 覆盖刚性身体。没有音频口型、`.moc3` 或大角度转头声明。
- [原始长提示词](prompts/本鲸重绘_用户原始提示词.md) 保持逐字不变；[分层修订提示词](prompts/本鲸_分层修订提示词.md) 单独保存。
- 用户已解除禁止生图与不可更新哈希规则。旧像素图集不覆盖，模板追加 `whale_cutout`，并真正支持独立层挂接 / 透明度 / 旋转。模板的通用层 API 不是 Iki 参数引擎；本页才是实际 Cutout + Iki 组合执行器。
- 来源与更新哈希：`assets/cutout-provenance.json`；机器报告：`demo/cutout-qa.json`，人工签收仍为 false。

### 复现当前组合

```bash
npm ci --prefix paperdoll/runtime
python3 paperdoll/tools/prepare_cutout.py
python3 paperdoll/tools/prepare_iki.py
npm run model --prefix paperdoll/runtime
npm run bundle --prefix paperdoll/runtime
python3 -m http.server 8000 --bind 0.0.0.0 --directory paperdoll
```

另一个终端执行：

```bash
python3 -m unittest discover -s paperdoll/tests -v
npm test --prefix paperdoll/runtime
node paperdoll/tools/render_puppets.mjs --check
node paperdoll/tools/render_puppets.mjs
```

根目录依赖使用 `npm ci`。先检查六格，再导出视频；当前无歌曲、无镜头切换，因此这 8 秒是确定性的关节技术测试，不是按歌词比例排镜的正式 MV。接入歌曲时仍走模板 align 与句子 / 实测拍点事件，缺字和缺音源不能绕过。MP4 被根忽略规则排除；临时序列在系统临时目录。

以下保留前两次实验的复现方式与历史限制，不应当作最新页面的功能描述。

先读：

- [诊断报告](诊断报告.md)：当前仓库的证据、限制和保留项。
- [新方案](新方案.md)：角色能力契约、拍点事件分镜、分层表演与分阶段验收。
- [拆件制作提案](prompts/拆件提示词.md)：仅供后续授权时使用。

## 本轮原型

只用现有图集的 `whale_idle`，演示待机、踩拍、跳跃、摇摆四个连续镜头。完整图统一变换，不做会撕开裙摆和长发的水平带错位。

- 1280×720，30 fps，8 秒，240 帧。
- 120 BPM **合成网格，`measured=false`**；无声、无歌词，不是实测卡点 MV。
- 像素 NEAREST 采样，无生图、换脸、立绘替换、假手或水印。
- Pillow 逐帧求值，经无损 RGB 管道交 FFmpeg；无截图浏览器、无 JPEG 二次损失、无落盘帧序列。
- 文件必须含“无声样片”，拒绝所有有声输出；正式 MV 仍须模板 `align/full`。
- 单层整图变换是能力兜底，**尚未消除立牌感，也未实现自动绑骨、头发弹簧、独立挥手、双人接物或词级字幕**。

## 复现

从仓库根目录执行。依赖复用根目录 `requirements.txt`，无需 PyAV：

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/python -m unittest discover -s paperdoll/tests -v
.venv/bin/python paperdoll/tools/make_demo.py
```

可选输出路径：

```bash
.venv/bin/python paperdoll/tools/make_demo.py --output /tmp/纸片人无声样片.mp4
```

默认样片位于 `paperdoll/demo/无声样片.mp4`，被仓库现有 `*.mp4` 规则忽略，不提交。静帧 `demo/跳跃检查.png` 和参数 / 耗时 `demo/qa.json` 用于复查。该耗时只对应小型整图场景，不能与旧版复杂 3D 场景直接比较。无人工整片签收。

水平裁片工具（只裁片和坐标，不做语义分件）：

```bash
.venv/bin/python paperdoll/tools/split_parts.py 人物/q版/whale.png /tmp/paperdoll-parts
```

## 后续最有价值的实验

选一个现有 MV 的八秒双人镜头，先定义“预备、递出、接住、反应”的拍点事件和手部锚点。缺图先报错，经授权才补差分 / 分层图，再评估 mesh。使用同资产、同音轨、同分辨率和同机器做 A/B；未通过之前不迁移旧片、不冻结现行引擎。

## 2026-11-26：用户授权的重绘样片

上文“无新增图片”描述首轮路线评估。后续用户明确要求按其 GitHub 参考图及长提示词重新生成，本轮已生成单人全身图，并由用户选择第一张。授权范围为独立试片，不覆盖图集、不放宽其他角色或正式 MV 的规则。

- 原图：`assets/whale-regenerated.png`；透明衍生：`assets/whale-regenerated-cutout.png`。
- 参考来源、授权范围与资产哈希：`assets/regeneration.manifest.json`。参考图再分发权未独立核实，暂不接入正式 MV。
- 重新渲染：`python3 paperdoll/tools/make_regenerated_demo.py`。
- 启动页面：`python3 -m http.server 8000 --bind 0.0.0.0 --directory paperdoll`。
- 页面提供自动循环、逐段跳转、重播、原图查看、MP4 下载及参考图展开；无第三方 CDN。
- 样片：`demo/重绘本鲸无声样片.mp4`，8 秒 / 240 帧 / 1280×720 / H.264，仍遵循 MP4 不入 Git 的规则。
- 内容：呼吸、节拍压缩回弹、轻跳、摇摆；使用完整单层图片及柔和采样，没有独立骨骼、口型、挥手或接物，节拍是合成网格，不是歌曲实测。
- 检查：17 项实验测试通过，视频完整解码通过；HTTP 页面、原图、透明图和视频返回 200。已检查封面静帧；无人工整片签收。尝试浏览器自动化时，环境缺少 `libnspr4.so`，未完成浏览器端播放 / 手机截图验证，不把 HTTP 可访问等同于浏览器播放已验收。
