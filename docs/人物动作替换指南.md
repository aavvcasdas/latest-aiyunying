# 人物动作替换指南

版本：2.0.0。目标仓库：aavvcasdas/latest-aiyunying。
目标分支：`arena/25fbb036-latest-aiyunying`。
制作基线提交：`2779ffd5e407e39f8acee50bc274de2fa8beeaa7`。

## 本次提供什么

- 九位角色，每人十二个动作，共一百零八个透明背景 GIF。
- 每个动作二十四帧、十二 FPS、两秒一轮；GIF 使用 80/90/80 毫秒的帧时长交替，确保总长正好两秒。
- 每个动作同时提供 3072 x 128 的透明 PNG 横向图集，单帧 128 x 128；GIF 放大到 256 x 256，使用最近邻采样。
- `motion-v2.patch`：扩展现行 Actor 动作 API，支持确定性的逐帧渲染。
- `motion-v2.json`：可重建的无损像素源数据，不依赖 GIF 解码。
- `install-motion-v2.mjs`：检查补丁、备份、安装、重建与回滚。
- `manifest.json`：角色、动作、帧率和描述的机器可读清单。

本版本在原角色像素素材上制作分层位移、衣摆跟随、动作时间曲线及像素道具，不是重新绘制的整套立绘。通用动作不等于完整骨骼动画。它不提供口型或逐音节同步。道具接触、动作节奏和角色辨识度仍需要逐个连续播放确认。

## 一、下载与解压

在工作台右上角下载 `ai-motion-v2-complete.zip`，完整解压。不要只下载 `.patch`：补丁不包含二进制图像和像素源数据。

解压后的目录如下：

```text
ai-motion-v2/
  install-motion-v2.mjs
  motion-v2.patch
  motion-v2.json
  manifest.json
  人物动作替换指南.md
  characters/
    whale/idle.gif
    whale/idle.png
    whale/idle-poster.png
    ...
```

工作台中的「下载当前 GIF」只下载当前动作；「下载角色资源」包含当前角色的十二组 GIF、PNG 图集和静帧，不包含引擎安装所需的全部像素源数据。要装补丁，请下载完整资源包。

## 二、安装补丁

先提交或备份自己的未提交改动。推荐新建分支，不要在旧存档内安装。

```bash
git switch arena/25fbb036-latest-aiyunying
git switch -c fix/character-motion-v2
# 把解压后的 ai-motion-v2 文件夹放在仓库根目录
node ai-motion-v2/install-motion-v2.mjs
```

需要 Node.js 22.18 或以上、Git，以及原仓库依赖。安装器会修改以下五个引擎与素材文件，并在 `.motion-v2-backup/` 中保留它们安装前的副本：

```text
通用模板/engine/actors.ts
通用模板/cast/bake_atlas.mjs
通用模板/engine/assets/cast_atlas.json
通用模板/engine/assets/cast_atlas.png
通用模板/cast/source/motion-v2.json
```

此外会更新 `通用模板/tests/cast.test.mjs`，保留原回归测试，更新总格数断言并新增动作确定性测试。六个文件均会备份。先运行 `git apply --check`，不匹配会停止，不强行覆盖。本补丁不改 `存档/`，不修改原角色格子的尺寸、坐标、头像或默认播放方法。

新增引擎格子会裁掉顶部和左右对称的透明留白，保留统一的脚底与水平中心；相同像素帧共用坐标，减少显存占用。烘焙图集宽度为 4096 像素，高度限制在 8192 以内。下载的单独 PNG 横向图集仍保留完整 128 x 128 帧。

## 三、在镜头中替换旧动作

GIF 只用于预览或普通网页，不能把 GIF 文件路径直接传给 `.set()`。Remotion 需要从绝对时间得到确定的帧，因此正式渲染使用 PNG 图集。

原来的镜头：

```ts
return ({ T }) => {
  whale.front(T).at(-1, 0, 0);
  return camera;
};
```

替换为：

```ts
return ({ T }) => {
  whale.motion('idle', T).at(-1, 0, 0);
  return camera;
};
```

专属动作示例：

```ts
return (f) => {
  // 动作时机跟随台词，不写死镜头百分比。
  whale.motion(f.said >= 2 ? 'offer_rice' : 'idle', f.T).at(-1, 0, 0);
  return camera;
};
```

API：`actor.motion(action, T, rate = 1, loop = true)`。`T` 单位为秒，可以是全片时间或由句子起点计算的动作局部时间。`rate` 必须为正有限数；`loop=false` 时夹在首尾帧，不循环。未安装或不存在的动作直接报错，不使用别的造型顶替。负时间在循环模式下安全回绕。每一帧仍然必须明确写出动作和位置。

旧 `.front()`、`.walk()`、`.walkBy()` 和 `.walkX()` 保留原行为，不会静默替换已有成片。行走新镜头用 `.motion('walk', T)` 配合明确的位移函数；它不自动做位移驱动的脚步配准。如果需要严格不滑步，请继续使用旧 `.walkBy()`，或为新步态按实际位移计算局部动作时间。

## 四、动作对照

全员通用：`idle` 待机呼吸、`walk` 轻快行走、`wave` 挥手招呼、`talk` 开口说话、`bow` 礼貌鞠躬、`sit` 安静坐下、`happy` 开心雀跃、`think` 歪头思考、`surprise` 惊讶后退、`jump` 活力跳跃。

| 角色 ID | 专属动作一 | 专属动作二 |
| --- | --- | --- |
| whale | offer_rice 递出饭碗 | tail_beat 鲸尾打拍 |
| gpt | hourglass 举起沙漏 | shield 展翼守护 |
| claude | read 认真翻书 | tea 端杯思考 |
| gemini | clock 对照时钟 | paint 提笔创作 |
| kimi | scroll 展开卷轴 | bookmark 夹好书签 |
| doubao | basket 递出篮子 | dance 轻快踩拍 |
| qwen | fan 轻摇折扇 | serve_tea 茶会邀请 |
| zai | abacus 拨动算盘 | wake 睡醒认真 |
| grok | verify 放大镜查证 | phone 核对消息 |

这是按仓库设定制作的同人表演，不是厂商官方人设。Gemini 与 Kimi 是不同人物；Grok 不戴金冠，不占公主位。

## 五、只替换普通网页图片

复制选中的 GIF 到自己的静态目录，然后明确修改实际图片引用。不要把示例路径当成原仓库现有路径。

```html
<img src="/characters/whale/offer_rice.gif"
     alt="鲸鱼娘递出饭碗" width="256" height="256"
     style="image-rendering: pixelated" />
```

透明 GIF 的边缘采用一位透明度，正式合成优先使用 PNG 图集。下载的 PNG 是横向二十四帧，不是一张普通立绘。`*-poster.png` 才是单张静帧。

## 六、校验与回滚

```bash
npm run atlas:check
npm run typecheck
npm test
npm run film -- sheet 番外MV/童话镇
# 查看实际改过的镜头，确认动作前后不出框
npm run film -- sheet Day/Day14 --shot C05,C06
```

补丁已同步更新 `cast.test.mjs` 的总格数断言，并增加新动作的序列完整性、负时间回绕、随机跳帧确定性、单次播放夹帧和非法参数测试。原始步态和头像的回归断言保留。不要删掉空格、缺号、越界或确定性检测。工作台不声称已完成整部影片的渲染或人工审片。

回滚：在仓库根目录执行以下命令，恢复安装器保存的原始文件。回滚会覆盖安装之后对上述六个文件的修改，请先另存这些改动。

```bash
node ai-motion-v2/install-motion-v2.mjs --rollback
```

镜头源码一旦改用新动作，旧成片就不再对应当前源码，需要重渲。不要把通过机器检查等同于动作好看或音画同步；最终发布前要连续播放、人工审片。

## 七、素材来源与授权

基础像素角色来自目标分支的 `通用模板/engine/assets/cast_atlas.png`，其源数据位于 `通用模板/cast/source/`。动作由本交付内的确定性生成脚本在这些像素上加工，附加道具为程序绘制。

上游 `素材许可与来源.md` 已说明人物素材的再分发许可尚未确认。本资源包不承诺这些形象可商用，也不改变原始素材的授权条件。请只用于项目内评估；公开再分发、商业发布前自行核权。项目名与模型名归各自权利人所有。本交付未推送到 GitHub，也未替用户发布任何成片。

## 八、本次验证范围

- 已检查一百零八个 GIF 的透明度、二十四帧、两秒时长与循环设置，PNG 横向图集尺寸和下载包校验和。
- 已在原项目副本验证补丁安装、回滚、重新安装和图集逐字节重建一致性。
- 已确认原始一百二十一格的坐标和像素不变，并通过十一项角色引擎回归测试。
- 已通过六项浏览器端测试，覆盖九位角色、播放控制、分类搜索、真实下载、补丁查看和移动端导航。
- 已进行真实 WebGL 引擎静帧试渲，图集尺寸 4096 x 5367，低于实测 8192 像素纹理上限。
- 已通过工作台 TypeScript 检查和生产构建。未运行源仓库完整测试集，未重新渲染整部影片，也没有人连续审看整部影片。