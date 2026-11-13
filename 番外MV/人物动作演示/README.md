# 《人物动作演示》· 派生动作 / 道具 / 表情贴的效果片

**这是一支效果片，不是 MV**：没有歌、没有歌词、没有字幕、没有解说、没有片名卡。拍它的目的只有一个——
把 2026-11 补丁（`replace-character-animation-assets.zip`）搬进本分支之后，新增的派生动作、像素道具、表情贴
到底长什么样，让人一次看全。

**规格**：12 个镜头、60.0 秒（1800 帧，1920×1080 @30fps）、无声。

## 分镜（镜头切点是写死的秒数，见 `project.tsx` 的 `MARKS`）

| 镜头 | 起止 | 演什么 |
|---|---|---|
| `A0` | 0–5s | 八位排成一排 `idle(T)`：呼吸 + 眨眼；龙娘是悬浮待机（以前只能 `front(T)` 站着不动） |
| `B1` | 5–9.5s | 本鲸：`wave` 挥手 → `point` 递出去 → `eat` 干饭（手边摆 `prop_bowl`）→ `hop` 开心跳 |
| `B2` | 9.5–14s | 龙娘：`float` 悬浮 → `hover` 振翅 → `cast` 施法（`fx_sparkle`）→ `rage` 生气（`fx_anger`） |
| `B3` | 14–18.5s | 小克：`curtsy` 提裙行礼（手边 `prop_teacup`）→ `read` 看书（`prop_book`）→ `petri` 石化（`fx_question`）→ `lookaround` |
| `B4` | 18.5–23s | 豆包：`step` 踩拍 → `sway` 摇摆 → `spin` 转圈（`fx_sparkle`）→ `hop`；`prop_basket` `prop_redshoes` 在脚边 |
| `B5` | 23–27s | 猫：`lookaround` → `choose` 两边想想再选（`fx_question`）→ `sway`；`prop_catclock` `prop_brush` |
| `B6` | 27–31s | 狐狸：`doze` 打盹（`fx_zzz`）→ `alert` 惊醒竖耳（`fx_exclaim`）→ `lookaround`；`prop_abacus` `prop_eyemask` |
| `B7` | 31–35s | Kimi：`think` 想事情（`fx_bulb`）→ `nod` → `lookaround`；`prop_scroll` |
| `B8` | 35–39s | 千问：`spin` 疯帽子转圈（`fx_shine`）→ `bow` 东道主 → `sway`；`prop_fan` `prop_teacup` |
| `C1` | 39–48s | 12 张表情贴一张一张数过去（每张 0.75 秒）：爱心 / 汗滴 / 生气 / 感叹 / 疑问 / 睡觉 / 闪光 / 晕眩 / 灯泡 / 热气 / 阴郁 / 亮光 |
| `D1` | 48–56s | 15 件道具在地上排成一排，从左到右一件一件亮出来，机位跟着扫 |
| `E1` | 56–60s | 回到八个人一起待机，机位后拉，渐黑收尾 |

## 文件

| 文件 | 说明 |
|---|---|
| `film.json` | 元数据：**没有 `audio`、没有 `subtitles`**，`output` 写成「成片/人物动作演示」 |
| `project.tsx` | `defineProject` + 自己写的 `plan`：切点来自写死的 `MARKS` 表，不走「按歌词句首派生」 |
| `cues.json` | 占位：引擎要求 cues 里至少一句，这一句的时间在片子之外（−30s），永远不会被画出来；`measured: false` |
| `歌词.srt` | 同上，一行占位（`requireFreshText` 要文件在、sha 对得上） |
| `shots/shots.ts` | 12 个镜头的布景、机位、动作表；道具每帧 `.at(…)`，不用就 `.hide()` |
| `成片/人物动作演示.mp4` | 成片（无声；同目录有 `qa.json`、`人物动作演示_分镜总览.jpg`） |

## 出片

```bash
npm run film -- info   番外MV/人物动作演示     # 时间轴 + 角色预检（8 角色 / 127 格）+ 文字预检
npm run film -- stills 番外MV/人物动作演示 60 210 1310
npm run film -- frames 番外MV/人物动作演示     # 逐帧 PNG → 系统临时目录
npm run film -- encode 番外MV/人物动作演示 --out 番外MV/人物动作演示/成片/人物动作演示.mp4
npm run film -- qa     番外MV/人物动作演示 --skip-frames
```

没有音源，所以 `full` 不会走 `mux`；这条片子的片子名与「无声」是写在一起的：**它没有音轨，不是漏了音轨**。

## 自检（`成片/qa.json`）

- 逐帧查过 1800 帧：尺寸全对、没有连续两帧一模一样（没有卡住）、没有空白背景帧、没有冻结段、12 个镜头都有可见的切换点。
- 亮度 36.6–70.6，序列 md5 `3fc7f73cc20ed9b15388661dbebfb64a`。
- **一条已知的「问题」**：`qa` 报 `1 句的字幕条没检测到：[1]`。这是故意的——引擎要求 `cues.json` 至少有一句，
  这句占位写在 −30 秒（片外），永远不该被画出来；qa 按「每句都该有字幕条」去抽查，就把它算成缺一条。
  这条片子的定义就是没有字幕，所以不修，只在这里写明。
- `qa` 另外提示「卡点是估算的（`measured=false`）：只能当无声样片，不能当成片交付」——同样因为它没有音源可测。
  它是一支效果片，不走 `mux`，也就没有「成片」这一步。
