// 由同一份数据生成交付文档：分镜.md / 歌词.srt / cues.json / 生图提示词
import { LINES, SHOTS, DAYS, MVS, CAST, LAMP_ON, BLOOM_AT, PRE, END, SONG_END, dayName, dateName } from "./data";

const ts = (t: number) => { const ms = Math.round(Math.max(0, t) * 1000); const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000); return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")},${String(ms % 1000).padStart(3, "0")}`; };

export function srt(): string {
  return LINES.map((l, i) => `${i + 1}\n${ts(l.chars[0])} --> ${ts(l.end)}\n${l.text}\n`).join("\n");
}

export function cuesJson(): string {
  return JSON.stringify({
    title: "若是月亮还没来 · 满月篇", audio: { file: "若是月亮还没来.WAV", seconds: SONG_END, sampleRate: 44100, channels: 2 },
    measured: true, method: "频谱通量起音 + 能量包络（tools/analyze_audio.cjs）+ YIN 音高跳变；第四至六句与第一至三句旋律互证",
    prelude: PRE, end: END,
    lines: LINES.map((l) => ({ text: l.text, start: l.chars[0], end: l.end, chars: [...l.text].map((ch, i) => ({ ch, t: l.chars[i] })) })),
    shots: SHOTS.map((s) => ({ id: s.id, word: s.word, start: s.t0, end: s.t1 })),
    lamps: DAYS.map((d, i) => ({ day: d.n, on: +LAMP_ON[i].toFixed(2) })),
    blooms: MVS.map((m, i) => ({ mv: m.title, at: +BLOOM_AT[i].toFixed(2) })),
  }, null, 2);
}

export function storyboardMd(): string {
  const rows = SHOTS.map((s) => `| ${s.id} | ${s.word || "—"} | ${s.t0.toFixed(2)}–${s.t1.toFixed(2)} | ${(s.t1 - s.t0).toFixed(2)} | ${s.plan} |`).join("\n");
  const lamps = DAYS.map((d, i) => `| ${dayName(d.n)} | ${dateName(d.date)} | ${d.title} | ${LAMP_ON[i].toFixed(2)} |`).join("\n");
  const blooms = MVS.map((m, i) => `| 《${m.title}》 | ${dateName(m.date)} | ${m.note || "—"} | ${BLOOM_AT[i].toFixed(2)} |`).join("\n");
  const cast = CAST.map((c) => `| ${c.name} | ${dateName(c.date)} | ${c.note} |`).join("\n");
  return `# 分镜 · 若是月亮还没来（满月篇）

一个词一个镜头。时间是歌曲时间（秒，实测）；片头在歌曲之前 ${PRE} 秒，整片到 ${END} 秒。画面 1280×720，Canvas2D：背景全部程序绘制（低分辨率像素层放大四倍），人物用图集像素帧与满月篇新增的三张本鲸姿态。

## 立意

- 若是月亮还没来：满月（第三十天）还没到的那些夜里。
- 路灯也可照窗台：十七盏路灯就是第零天到第十六天，每天亮一盏，最后照到本鲸的窗台。
- 照着白色的山茶花微微开：窗台上的山茶一朵朵开，每一朵是一支番外MV。
- 若是晨风还没来，晚风也可吹入怀：天还没亮也没关系，晚风把伙伴们一个个吹到身边，笨鱼回到怀里。
- 吹着那一地树影温柔摇摆：九个人的影子和树影一起摇；尾奏里月亮终于来了，满月。

## 逐镜

| 镜 | 词 | 时间 | 时长 | 画面 |
| --- | --- | --- | --- | --- |
${rows}

## 路灯：第零天到第十六天（点亮时刻挂在「路灯也可照窗台」的字上）

| 天 | 日期 | 标题 | 点亮 |
| --- | --- | --- | --- |
${lamps}

## 山茶：番外MV（开花时刻挂在「山茶花微微开」的字上）

| MV | 日期 | 备注 | 开花 |
| --- | --- | --- | --- |
${blooms}

## 晚风：人物第一次登场

| 人物 | 日期 | 说明 |
| --- | --- | --- |
${cast}

## 规矩自查

- 零水印、零角标；没有粉丝数、播放量、进度条、数据曲线；画面上的数字全写成汉字。
- 不伪造接触：入怀用本鲸抱着笨鱼的整张图，指花用指向动作，不给道具画手。
- 时机挂在字上（逐字实测时间），不写死镜头百分比。
- 没有人整片看过、听过。
`;
}

const RULE = "单个 Q 版（chibi）动漫少女立绘，2.5 头身，大头小身，纯绿幕背景。\n\n【比例】头（含头发）占整个身高的 40% 以上；圆脸、大眼睛（眼睛占脸宽一半以上）、小鼻小口；身体只比头略高，手臂短圆、腿短、手掌小、脚小；可爱玩偶感，绝对不要长腿、不要成年女性身材、不要七头身。\n\n【角色：鲸鱼娘（DeepSeek），深蓝×白女仆装】整段沿用 人物/提示词/whale_q版_绿幕.txt 的角色段落（深蓝到浅海蓝渐层长卷发、呆毛、白色蕾丝女仆头饰、鲸鱼尾鳍耳饰、深蓝女仆连衣裙、白围裙小鲸鱼刺绣、白裤袜、深蓝玛丽珍鞋、身后深蓝鲸鱼尾巴）。\n";
const TAIL = "\n【画面】全身完整入画，头顶与鞋底都不被裁掉；纯绿 #00FF00 平涂纯色背景，无阴影、无地面线、无渐变、无边框；单人、单视角。\n【画风】16-bit 像素风 Q 版，干净深色描边；深蓝 + 白；不要文字、水印、logo。\n\n后处理：tools/process_generated.cjs（抠绿、去溢色、裁边、缩到 96 px 高、alpha 硬边、按图集本鲸配色校正）。\n边界：只在满月篇里用，没有烘进图集。\n";
export const PROMPTS: Record<string, string> = {
  "whale_仰望_绿幕.txt": `本鲸 · 仰望（满月篇 S01 S06 S13 S24 S25）\n口径见 人物/提示词/00_通用规则.txt。\n\n${RULE}\n【姿态】四分之三侧身朝右，双手放在身前，抬头望向右上方的夜空，带着期待的浅笑。（原意是坐在窗台上，出图为站姿；镜头里只露上半身。）\n${TAIL}`,
  "whale_抱笨鱼_绿幕.txt": `本鲸 · 抱住笨鱼（满月篇 S19 入怀）\n口径见 人物/提示词/00_通用规则.txt。\n\n${RULE}\n【姿态】正面站立，眯眼开心地笑，两只短手臂把一只小鲸鱼抱在胸前。小鲸鱼照 人物/q版/笨鱼.png：长春花蓝渐变身体、白肚皮细线、一只黑眼睛带一根睫毛、粉腮红、笑、深蓝尾鳍、抱着装白米饭的小蓝碗。\n${TAIL}`,
  "whale_捧山茶_绿幕.txt": `本鲸 · 捧着白山茶（满月篇 S11 微微）\n口径见 人物/提示词/00_通用规则.txt。\n\n${RULE}\n【姿态】正面站立，两只小手在胸前捧着一朵白山茶（短绿茎、两片叶），低头温柔地看着花，脸上淡淡腮红。\n${TAIL}`,
  "道具_白山茶三态_绿幕.txt": "道具 · 白山茶三态（满月篇 窗台与山茶枝）\n\n像素风游戏道具图，一排三朵分开摆放、中间留大空隙的白山茶，从左到右：①合着的白色花苞带绿色萼片；②半开的白山茶；③盛开的白山茶，层层圆花瓣、黄色小花蕊。每朵带一小段绿茎和两片深绿亮叶。16-bit 复古 JRPG 道具图标风，干净深色描边，花瓣用白、奶白、淡蓝灰分层。纯绿 #00FF00 平涂背景，无阴影、无地面、无渐变、无边框，不要文字水印。\n\n后处理：按竖向空列切成三张；小号 28 px 高（枝头、窗台），特写版 96 px 高。保留叶子的绿，不做强去溢色。\n",
  "道具_路灯_绿幕.txt": "道具 · 路灯（满月篇 十七盏路灯 = 第零天到第十六天）\n\n像素风游戏道具，一盏老式可爱路灯竖直站立，灯顶到底座完整入画：深海军蓝铁杆、一个小小卷曲装饰托架、四面暖黄发光玻璃的灯笼头和尖顶小帽、圆形底座。16-bit 复古 JRPG 风，干净深色描边，简单赛璐璐阴影，竖构图居中。纯绿 #00FF00 平涂背景，背景上不要光晕、无阴影、无地面、无渐变，不要文字水印。\n\n后处理：缩到 162 px 高；熄灯版由代码把灯罩暖黄像素压成夜色（assets.ts 的 unlit）。\n",
};
