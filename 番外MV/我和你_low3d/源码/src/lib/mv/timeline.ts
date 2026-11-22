// 《我和你》时间轴 —— 每个「词」一个镜头。
// 时间来自实测：faster-whisper(small) 逐字时间戳 + 人声频段(250–3500Hz)谱通量起音点校正，
// 乐句网格约 3.45s/句（≈139 BPM，两小节一句）。音频 60.42s。

export type Word = { text: string; start: number };
export type Line = { id: string; section: string; text: string; start: number; end: number; words: Word[] };

export const DURATION = 60.42;

export const LINES: Line[] = [
  { id: "L1", section: "主歌", text: "晴天 有点孤单", start: 0.45, end: 3.6, words: [
    { text: "晴天", start: 0.45 }, { text: "有点", start: 1.6 }, { text: "孤单", start: 2.4 } ] },
  { id: "L2", section: "主歌", text: "玩具 丢在旁边", start: 3.85, end: 7.1, words: [
    { text: "玩具", start: 3.85 }, { text: "丢在", start: 4.7 }, { text: "旁边", start: 5.8 } ] },
  { id: "L3", section: "主歌", text: "电视 里没有新鲜", start: 7.34, end: 10.5, words: [
    { text: "电视", start: 7.34 }, { text: "里", start: 8.14 }, { text: "没有", start: 8.46 }, { text: "新鲜", start: 9.12 } ] },
  { id: "L4", section: "主歌", text: "球鞋 跑不过时间", start: 10.8, end: 13.9, words: [
    { text: "球鞋", start: 10.8 }, { text: "跑不过", start: 11.6 }, { text: "时间", start: 12.64 } ] },
  { id: "L5", section: "主歌", text: "我要 更大的世界", start: 14.22, end: 17.4, words: [
    { text: "我要", start: 14.22 }, { text: "更大的", start: 14.92 }, { text: "世界", start: 16.14 } ] },
  { id: "L6", section: "主歌", text: "装满 不同的探险", start: 17.82, end: 21.0, words: [
    { text: "装满", start: 17.82 }, { text: "不同的", start: 18.64 }, { text: "探险", start: 19.78 } ] },
  { id: "L7", section: "主歌", text: "当然 你陪在身边", start: 21.26, end: 24.4, words: [
    { text: "当然", start: 21.26 }, { text: "你", start: 21.78 }, { text: "陪在", start: 22.4 }, { text: "身边", start: 23.12 } ] },
  { id: "L8", section: "主歌", text: "每秒每天", start: 24.72, end: 26.6, words: [
    { text: "每秒", start: 24.72 }, { text: "每天", start: 25.58 } ] },
  { id: "C1", section: "副歌", text: "我和你飞到蓝蓝的天边", start: 26.78, end: 29.95, words: [
    { text: "我和你", start: 26.78 }, { text: "飞到", start: 27.38 }, { text: "蓝蓝的", start: 27.82 }, { text: "天边", start: 28.9 } ] },
  { id: "C2", section: "副歌", text: "我和你种下满满的花园", start: 30.1, end: 33.4, words: [
    { text: "我和你", start: 30.1 }, { text: "种下", start: 30.84 }, { text: "满满的", start: 31.3 }, { text: "花园", start: 32.36 } ] },
  { id: "C3", section: "副歌", text: "我和你分享暖暖的光线", start: 33.6, end: 36.9, words: [
    { text: "我和你", start: 33.6 }, { text: "分享", start: 34.36 }, { text: "暖暖的", start: 34.62 }, { text: "光线", start: 35.86 } ] },
  { id: "R1", section: "副歌", text: "再靠近一点", start: 37.05, end: 38.7, words: [
    { text: "再", start: 37.05 }, { text: "靠近", start: 37.62 }, { text: "一点", start: 38.04 } ] },
  { id: "R2", section: "副歌", text: "再靠近一点", start: 38.8, end: 40.35, words: [
    { text: "再", start: 38.8 }, { text: "靠近", start: 39.2 }, { text: "一点", start: 39.6 } ] },
  { id: "C4", section: "副歌Ⅱ", text: "我和你飞到蓝蓝的天边", start: 40.5, end: 43.8, words: [
    { text: "我和你", start: 40.5 }, { text: "飞到", start: 41.3 }, { text: "蓝蓝的", start: 41.72 }, { text: "天边", start: 42.82 } ] },
  { id: "C5", section: "副歌Ⅱ", text: "我和你就像满满的花园", start: 44.0, end: 47.3, words: [
    { text: "我和你", start: 44.0 }, { text: "就像", start: 44.8 }, { text: "满满的", start: 45.2 }, { text: "花园", start: 46.26 } ] },
  { id: "C6", section: "副歌Ⅱ", text: "我和你就像暖暖的光线", start: 47.45, end: 50.8, words: [
    { text: "我和你", start: 47.45 }, { text: "就像", start: 48.3 }, { text: "暖暖的", start: 48.68 }, { text: "光线", start: 49.74 } ] },
  { id: "F", section: "尾句", text: "把地球照亮", start: 50.95, end: 53.4, words: [
    { text: "把", start: 50.95 }, { text: "地球", start: 51.54 }, { text: "照亮", start: 51.92 } ] },
];

export type Shot = {
  key: string; // 渲染函数名
  start: number;
  end: number;
  word: string; // 对应的词（片头/片尾为空）
  lineId: string;
  cast: string;
  idea: string; // 这个词的意思 → 画面怎么重构
};

// 每个词的画面重构（词义 → 画面）。顺序与 LINES 中词一一对应。
const IDEAS: Record<string, [string, string, string]> = {
  "L1-晴天": ["sunny", "whale", "天空大晴，太阳从云后升起，光芒缓缓旋转；镜头往下摇到一扇窗"],
  "L1-有点": ["window", "whale", "窗里，鲸鱼娘趴在窗台托腮；「有点」= 一点点，画面只亮一小块光斑"],
  "L1-孤单": ["lonely", "whale", "镜头拉远，空荡荡的大房间里只剩她一个；暗角收紧、单片落叶飘下、头顶冒出阴云"],
  "L2-玩具": ["toys", "whale", "玩具堆（泰迪熊、火箭、积木）弹跳登场，像在等人来玩"],
  "L2-丢在": ["toss", "whale", "玩具被抛起又落地，翻滚着停下——「丢」的抛物线"],
  "L2-旁边": ["aside", "whale", "镜头横移：玩具被留在画面边上，鲸鱼娘从旁边走过，没回头"],
  "L3-电视": ["tv", "whale", "老电视「啪」地亮起，兔耳天线抖两下"],
  "L3-里": ["tvzoom", "whale", "镜头推进屏幕「里」面，边框扩大到撑满画面"],
  "L3-没有": ["static", "whale", "雪花噪点 + 彩条测试图来回切台，什么都没有"],
  "L3-新鲜": ["bored", "whale", "鲸鱼娘在电视前摇头，问号冒出；屏幕里一直重复同一个旋转图案"],
  "L4-球鞋": ["sneakers", "whale", "球鞋特写，鞋带一甩，地面画出起跑线"],
  "L4-跑不过": ["run", "whale", "她迈腿狂奔，背景却越滚越快把她往后甩——跑不过"],
  "L4-时间": ["clock", "whale", "巨大的钟面指针飞转，太阳从东跑到西，天色由昼转暮，沙漏倾泻"],
  "L5-我要": ["iwant", "whale", "她猛地站起、伸手一指，感叹号炸开，背景放射线"],
  "L5-更大的": ["zoomout", "whale", "镜头一路拉远：房间→小镇→云层，画框一圈圈变大"],
  "L5-世界": ["world", "whale", "她站在一颗小星球顶上，星球慢慢转，大陆和海洋从脚下滑过"],
  "L6-装满": ["pack", "whale", "探险背包张开，地图、指南针、放大镜、书一件件飞进去"],
  "L6-不同的": ["triptych", "whale", "画面切成三格：深海、森林、雪山——三种不同的地方，她在每格里探头"],
  "L6-探险": ["map", "whale", "藏宝图铺开，虚线路径一笔笔画出，她举着放大镜沿路走"],
  "L7-当然": ["of_course", "whale+claude", "叮！星光一闪，一个熟悉的身影在门口出现（剪影）"],
  "L7-你": ["you", "claude", "聚光灯打在小克身上，她提裙行礼，向日葵发饰发光，心形冒出"],
  "L7-陪在": ["walkto", "whale+claude", "小克一步步走向鲸鱼娘，两人的脚印连成一条线"],
  "L7-身边": ["side", "whale+claude", "两人并肩坐在草坡上看夕阳，影子靠在一起"],
  "L8-每秒": ["seconds", "whale+claude", "秒针滴答，每跳一下两人就换一个姿势——每一秒都在一起"],
  "L8-每天": ["days", "whale+claude", "日月交替快速轮转，天色循环，两人始终站在同一个位置"],
  "C1-我和你": ["duo", "whale+claude", "副歌爆发：两人同框跳起挥手，彩色纸屑"],
  "C1-飞到": ["takeoff", "whale+claude+gpt", "白龙娘俯冲接住两人，纸飞机一起起飞，地面急速下坠"],
  "C1-蓝蓝的": ["bluesky", "whale+claude+gpt", "满屏的蓝：多层云海视差飞驰，速度线"],
  "C1-天边": ["horizon", "whale+claude+gpt", "飞到天与地相接的那条线，彩虹横跨，地平线泛起金边"],
  "C2-我和你": ["land", "whale+claude", "落在一片空地上，两人对视点头"],
  "C2-种下": ["plant", "whale+claude", "喷壶浇水、种子落进土里，水珠溅起"],
  "C2-满满的": ["sprout", "whale+claude", "嫩芽从左到右一排排冒出、长高、开花，铺满整个画面"],
  "C2-花园": ["garden", "all", "完整的花园：千问、豆包、Gemini、Kimi 在花丛里蹦跳，蝴蝶飞舞"],
  "C3-我和你": ["sunset_duo", "whale+claude", "暖色调，两人捧手，掌心间有一团小小的光"],
  "C3-分享": ["share", "whale+claude", "光球从鲸鱼娘手里抛到小克手里——分享"],
  "C3-暖暖的": ["warm", "whale+claude", "整个画面染成橘金，光晕一圈圈扩散，温度上升（热气纹）"],
  "C3-光线": ["rays", "all", "一束光分裂成八道彩色光线，照到每个朋友身上；打盹的阔耳狐被照醒"],
  "R1-再": ["closer1", "whale+claude", "两人站在画面两端，距离很远"],
  "R1-靠近": ["closer2", "whale+claude", "两人各自往中间走，镜头往里推"],
  "R1-一点": ["closer3", "whale+claude", "只差一点点——停住，中间冒出一颗小心"],
  "R2-再": ["closer4", "whale+claude", "第二次：更近的特写，背景变成粉色泡泡"],
  "R2-靠近": ["closer5", "whale+claude", "继续靠近，心越来越大"],
  "R2-一点": ["closer6", "whale+claude", "终于碰到——一圈白光炸开，转场"],
  "C4-我和你": ["duo2", "all", "八个人一起跳起来，全员挥手"],
  "C4-飞到": ["takeoff2", "all", "全员乘纸飞机/白龙起飞，队形像一串风筝"],
  "C4-蓝蓝的": ["bluesky2", "all", "穿过蓝天和云洞，队伍螺旋上升"],
  "C4-天边": ["horizon2", "all", "冲到天边，天空由蓝转紫，星星一颗颗亮起"],
  "C5-我和你": ["duo3", "whale+claude", "两人站在花园中央，手拉手"],
  "C5-就像": ["like_flower", "all", "「就像」= 比喻：每个人头顶长出一朵自己颜色的花，人和花叠在一起"],
  "C5-满满的": ["fill_flower", "all", "八色花朵从中心向外一圈圈铺满画面"],
  "C5-花园": ["garden2", "all", "大家就是花园本身：八朵大花摇摆，每朵花心是一位 AI 娘"],
  "C6-我和你": ["glow_duo", "whale+claude", "夜色中两人身上开始发光"],
  "C6-就像": ["like_light", "all", "每个人化作一颗光点，光点里还能看到她们的身影"],
  "C6-暖暖的": ["warm2", "all", "八颗光点汇成一圈暖色光环，慢慢旋转"],
  "C6-光线": ["beams", "all", "光环射出八道光线，划破夜空"],
  "F-把": ["earth_dark", "all", "夜里的地球缓缓转过来，大家围在它周围"],
  "F-地球": ["earth", "all", "镜头对准地球：海洋、大陆、云层清晰可见"],
  "F-照亮": ["lightup", "all", "光扫过地球，暗面一片片亮起来，城市灯火、彩虹环绕，全员欢呼"],
};

function buildShots(): Shot[] {
  const shots: Shot[] = [{ key: "intro", start: 0, end: LINES[0].start, word: "", lineId: "", cast: "", idea: "白光淡入，阳光洒下" }];
  LINES.forEach((line, li) => {
    line.words.forEach((w, wi) => {
      const next = line.words[wi + 1]?.start ?? LINES[li + 1]?.start ?? 53.5;
      const idea = IDEAS[`${line.id}-${w.text}`];
      shots.push({ key: idea[0], start: w.start, end: next, word: w.text, lineId: line.id, cast: idea[1], idea: idea[2] });
    });
  });
  shots.push({ key: "outro", start: 53.5, end: DURATION, word: "", lineId: "", cast: "all", idea: "尾奏：朝阳下八位 AI 娘排排站谢幕，演职员表" });
  return shots;
}

export const SHOTS: Shot[] = buildShots();

export function shotAt(t: number): number {
  for (let i = SHOTS.length - 1; i >= 0; i--) if (t >= SHOTS[i].start) return i;
  return 0;
}

export function lineAt(t: number): Line | null {
  for (const l of LINES) if (t >= l.start - 0.15 && t < (l.end + 0.35)) return l;
  return null;
}
