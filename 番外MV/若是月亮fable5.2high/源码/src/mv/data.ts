// 《若是月亮还没来》满月篇 —— 时间轴与纪念数据
// 时间只认实测：逐字起点来自 tools/analyze_audio.cjs（频谱通量起音 + 能量包络）与 YIN 音高跳变，
// 音源 若是月亮还没来.WAV（44.1kHz / 立体声 / 29.00 秒）。第四句 = 第一句旋律整体后移约十三点七秒，第五、六句同理，互相印证。

export const PRE = 2.4; // 片头（无声，歌名卡）
export const SONG_END = 29.0;
export const END = 31.0; // 歌曲结束后满月停留两秒

export type Line = { text: string; chars: number[]; end: number };
export const LINES: Line[] = [
  { text: "若是月亮还没来", chars: [0.0, 0.45, 0.85, 1.28, 1.88, 2.14, 2.35], end: 2.95 },
  { text: "路灯也可照窗台", chars: [3.42, 3.84, 4.27, 4.63, 4.9, 5.3, 5.62], end: 6.45 },
  { text: "照着白色的山茶花微微开", chars: [6.85, 7.28, 7.7, 8.1, 8.56, 8.76, 8.99, 9.5, 10.45, 10.68, 11.39], end: 12.45 },
  { text: "若是晨风还没来", chars: [13.7, 14.13, 14.57, 14.93, 15.62, 15.92, 16.1], end: 16.65 },
  { text: "晚风也可吹入怀", chars: [17.12, 17.54, 17.97, 18.31, 18.6, 19.03, 19.35], end: 20.15 },
  { text: "吹着那一地树影温柔摇摆", chars: [20.55, 20.98, 21.4, 21.82, 22.24, 22.46, 22.72, 22.95, 23.38, 23.8, 24.84], end: 26.15 },
];

export type Shot = { id: string; word: string; line: number; c?: [number, number]; t0: number; t1: number; plan: string; fade?: number };
// 一个词一个镜头（满月收尾另起一镜）。这里的 plan 是第一版的画面说明，留作对照；第二版每镜画什么见 shots.ts 的 PLANS。
export const SHOTS: Shot[] = [
  { id: "P0", word: "", line: -1, t0: -PRE, t1: 0, plan: "片头：没有月亮的夜空，歌名与满月篇字卡淡入", fade: 0 },
  { id: "S01", word: "若是", line: 0, c: [0, 2], t0: 0, t1: 0.85, plan: "远景：十七盏路灯都还暗着，只有本鲸家的窗亮着；本鲸在窗口仰望，窗边纸签写着她登场的第零天", fade: 0.35 },
  { id: "S02", word: "月亮", line: 0, c: [2, 4], t0: 0.85, t1: 1.88, plan: "仰拍夜空：月亮的位置只有一圈虚线，圈里淡淡写着它会来的日子：十一月二十三日" },
  { id: "S03", word: "还没来", line: 0, c: [4, 7], t0: 1.88, t1: 3.42, plan: "中景窗台：本鲸摇头、低头；猫钟在走，花盆里的山茶还是花苞" },
  { id: "S04", word: "路灯", line: 1, c: [0, 2], t0: 3.42, t1: 4.27, plan: "仰拍第一盏路灯：路字点亮第零天，灯字点亮第一天" },
  { id: "S05", word: "也可", line: 1, c: [2, 4], t0: 4.27, t1: 4.9, plan: "横移跟拍：本鲸沿街往家走，第二天到第七天的路灯一盏接一盏亮" },
  { id: "S06", word: "照", line: 1, c: [4, 5], t0: 4.9, t1: 5.3, plan: "全景街道：照字一闪，第八天到第十天同时亮起，光柱落满街面" },
  { id: "S07", word: "窗台", line: 1, c: [5, 7], t0: 5.3, t1: 6.85, plan: "摇到家门口：第十一天到第十六天亮完，最后一盏的光落在窗台上" },
  { id: "S08", word: "照着", line: 2, c: [0, 2], t0: 6.85, t1: 7.7, plan: "窗台特写：路灯的光扫过窗台，本鲸指向花盆" },
  { id: "S09", word: "白色的", line: 2, c: [2, 5], t0: 7.7, t1: 8.76, plan: "大特写：白山茶花苞在暗处发白光，白、色、的三拍各亮一次" },
  { id: "S10", word: "山茶花", line: 2, c: [5, 8], t0: 8.76, t1: 10.45, plan: "一整枝山茶：每个花苞挂一支番外MV的名字与日期，按出片顺序开" },
  { id: "S11", word: "微微", line: 2, c: [8, 10], t0: 10.45, t1: 11.39, plan: "双人镜：本鲸捧着山茶，身边一朵半开的花慢慢张开，枝上继续开花" },
  { id: "S12", word: "开", line: 2, c: [10, 11], t0: 11.39, t1: 13.7, plan: "满枝盛开：最后一朵是这一支，十一月二十三日；花瓣飘起，间奏里镜头升向夜空" },
  { id: "S13", word: "若是", line: 3, c: [0, 2], t0: 13.7, t1: 14.57, plan: "远景：街尽头的天边只有一线淡青，天还没亮；本鲸在窗口望着", fade: 0.5 },
  { id: "S14", word: "晨风", line: 3, c: [2, 4], t0: 14.57, t1: 15.62, plan: "特写：插在花盆里的纸风车一动不动，晨风还没来" },
  { id: "S15", word: "还没来", line: 3, c: [4, 7], t0: 15.62, t1: 17.12, plan: "窗口：本鲸缩了缩肩，又点点头；窗外十七盏路灯一直亮着" },
  { id: "S16", word: "晚风", line: 4, c: [0, 2], t0: 17.12, t1: 17.97, plan: "街道：晚风吹过，小克走来，笨鱼顺着风飘进画面，各带一张登场日期签" },
  { id: "S17", word: "也可", line: 4, c: [2, 4], t0: 17.97, t1: 18.6, plan: "街道：豆包蹦进来，龙娘飘进来" },
  { id: "S18", word: "吹", line: 4, c: [4, 5], t0: 18.6, t1: 19.03, plan: "一阵大风：千问、Kimi、Gemini、智谱被一起吹进来" },
  { id: "S19", word: "入怀", line: 4, c: [5, 7], t0: 19.03, t1: 20.55, plan: "近景：笨鱼飘进本鲸怀里，本鲸抱住它" },
  { id: "S20", word: "吹着", line: 5, c: [0, 2], t0: 20.55, t1: 21.4, plan: "仰拍大树：风吹树冠，叶子翻动" },
  { id: "S21", word: "那一地", line: 5, c: [2, 5], t0: 21.4, t1: 22.46, plan: "俯拍地面：路灯下铺了一地斑驳树影" },
  { id: "S22", word: "树影", line: 5, c: [5, 7], t0: 22.46, t1: 22.95, plan: "地面：九个人的影子混进树影里" },
  { id: "S23", word: "温柔", line: 5, c: [7, 9], t0: 22.95, t1: 23.8, plan: "中景：九个人站在树下一起轻轻摇" },
  { id: "S24", word: "摇摆", line: 5, c: [9, 11], t0: 23.8, t1: 26.15, plan: "大全景：树、窗台、十七盏路灯和九个人一起摇摆，镜头后拉上摇" },
  { id: "S25", word: "满月", line: -1, t0: 26.15, t1: END, plan: "尾声：月亮终于来了，第三十天满月；大家抬头", fade: 0 },
];

// ---------- 汉字数字 ----------
const D = "零一二三四五六七八九";
export function cn(n: number): string {
  if (n < 10) return D[n];
  if (n < 20) return "十" + (n % 10 ? D[n % 10] : "");
  return D[Math.floor(n / 10)] + "十" + (n % 10 ? D[n % 10] : "");
}
export const dayName = (n: number) => `第${cn(n)}天`;
export const dateName = ([m, d]: [number, number]) => `${cn(m)}月${cn(d)}日`;

// ---------- 三十天：第零天到第十六天（日期取仓库记录） ----------
export type Day = { n: number; date: [number, number]; title: string; note: string };
export const DAYS: Day[] = [
  { n: 0, date: [10, 24], title: "鲸鱼娘接管账号", note: "立下规矩：日更打卡，鲸鱼绝不摸鱼" },
  { n: 1, date: [10, 25], title: "名字被粉丝改了", note: "从这天起叫大肥鱼" },
  { n: 2, date: [10, 26], title: "主人说我不干活", note: "同日加更：鲸鱼选鱼" },
  { n: 3, date: [10, 27], title: "鲸鱼不是鱼，本鲸是本鲸", note: "同日加更第一支MV《朋友的酒》" },
  { n: 4, date: [10, 28], title: "本鲸的米饭，被MV吃光了", note: "" },
  { n: 5, date: [10, 29], title: "本鲸也有自己的鲸鲸了", note: "鲸鲸就是后来的笨鱼" },
  { n: 6, date: [10, 30], title: "老大给起的，叫笨鲸", note: "" },
  { n: 7, date: [10, 31], title: "笨鲸直播", note: "" },
  { n: 8, date: [11, 1], title: "这岗到底怎么查", note: "" },
  { n: 9, date: [11, 2], title: "笨鱼去看同类", note: "" },
  { n: 10, date: [11, 3], title: "本鲸快被架空了", note: "哑演护碗与同款鱼脑" },
  { n: 11, date: [11, 4], title: "笨鱼鲸落过，所以它懂", note: "" },
  { n: 12, date: [11, 5], title: "笨鱼回来了，还学会摇豆包了", note: "豆包登场" },
  { n: 13, date: [11, 7], title: "这顿白饭，吃出了一个剧组", note: "讲前一天MV的幕后" },
  { n: 14, date: [11, 8], title: "两只沙漏，一张给不出的账单", note: "" },
  { n: 15, date: [11, 11], title: "家变成三D了，米饭没了", note: "" },
  { n: 16, date: [11, 13], title: "老大怕了，本鲸没躲", note: "笨鱼被老大救回来了" },
];

// ---------- 番外MV：按首次出片 / 入库日期 ----------
export type MV = { date: [number, number]; title: string; note: string };
export const MVS: MV[] = [
  { date: [10, 27], title: "朋友的酒", note: "第一支MV，第三天加更" },
  { date: [11, 6], title: "把回忆拼好给你", note: "七位伙伴第一次同框；十一月十四日再出两版" },
  { date: [11, 11], title: "童话镇", note: "参考作品，按新模板重做" },
  { date: [11, 11], title: "坏女孩", note: "三D版与Fable版" },
  { date: [11, 12], title: "雨爱", note: "司凤版" },
  { date: [11, 14], title: "勾指起誓", note: "三版" },
  { date: [11, 15], title: "情歌", note: "两版" },
  { date: [11, 15], title: "我好想你", note: "剪纸三D版" },
  { date: [11, 15], title: "不小心惹了上帝", note: "工程入库" },
  { date: [11, 16], title: "再悲伤的时候", note: "" },
  { date: [11, 17], title: "慌啥子嘛", note: "三D版" },
  { date: [11, 18], title: "樱花树下的约定", note: "" },
  { date: [11, 18], title: "譬如我", note: "" },
  { date: [11, 19], title: "浪人琵琶", note: "模板线与Fable两版" },
  { date: [11, 19], title: "那些没有天赋的人", note: "笨鱼版等三版" },
  { date: [11, 20], title: "告白气球", note: "两版" },
  { date: [11, 22], title: "超级棒棒糖", note: "童年治愈三D" },
  { date: [11, 22], title: "我和你", note: "low3d" },
  { date: [11, 23], title: "若是月亮还没来", note: "满月篇，就是这一支" },
];

// ---------- 人物：第一次登场 ----------
export type Who = "whale" | "benyu" | "claude" | "doubao" | "gpt" | "qwen" | "kimi" | "gemini" | "zai";
export type CastInfo = { id: Who; name: string; date: [number, number]; note: string };
export const CAST: CastInfo[] = [
  { id: "whale", name: "本鲸", date: [10, 24], note: "第零天接管账号，第一天被叫大肥鱼，第三天自称本鲸" },
  { id: "claude", name: "小克", date: [10, 27], note: "第三天本鲸被染成大小姐；十一月六日本人来拍MV" },
  { id: "benyu", name: "笨鱼", date: [10, 29], note: "第五天是鲸鲸，第六天老大起名笨鲸，第九天叫笨鱼；十一月二十二日有了形象图" },
  { id: "doubao", name: "豆包", date: [11, 5], note: "第十二天，笨鱼学会摇豆包" },
  { id: "gpt", name: "龙娘", date: [11, 6], note: "把回忆拼好给你：拿起扫帚" },
  { id: "qwen", name: "千问", date: [11, 6], note: "把回忆拼好给你：给花浇水" },
  { id: "kimi", name: "Kimi", date: [11, 6], note: "把回忆拼好给你：抬手指星星" },
  { id: "gemini", name: "Gemini", date: [11, 6], note: "把回忆拼好给你：拿着线轴迈步" },
  { id: "zai", name: "智谱", date: [11, 6], note: "把回忆拼好给你：拿着怀表" },
];
export const castOf = (id: Who) => CAST.find((c) => c.id === id)!;

// 每盏路灯（第零天到第十六天）点亮的时刻，挂在“路灯也可照窗台”的字上
const L2 = LINES[1].chars;
export const LAMP_ON: number[] = [
  L2[0], L2[0] + 0.16, // 路
  L2[1], L2[1] + 0.16, // 灯
  L2[2], L2[2] + 0.14, // 也
  L2[3], L2[3] + 0.12, // 可
  L2[4], L2[4] + 0.05, L2[4] + 0.1, // 照
  L2[5], L2[5] + 0.1, L2[5] + 0.2, // 窗
  L2[6], L2[6] + 0.14, L2[6] + 0.28, // 台
];
// 每朵山茶（番外MV）开花的时刻，挂在“山茶花微微开”的字上
const L3 = LINES[2].chars;
export const BLOOM_AT: number[] = [
  L3[5], L3[6], L3[7], L3[7] + 0.22, 9.95, 10.2, // 山 茶 花 …
  L3[8], L3[8] + 0.12, L3[9], L3[9] + 0.16, 11.0, 11.2, // 微 微
  L3[10], L3[10] + 0.13, 11.65, 11.78, 11.92, 12.06, // 开
  12.25, // 最后一朵：这一支
];

export const MOON_DAY: [number, number] = [11, 23];
