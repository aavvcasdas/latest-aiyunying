// @ts-nocheck
// 《反乌托邦》童话版分镜：一句歌词一个镜头（两句长句再切一刀），切点 = 这一句起点 − 2 帧（0.07 秒）。
// 镜头内的时机都挂在歌词上（wAt / charTimes），不写死镜头百分比。
//
// 重新理解歌词 —— 把它当成一本治愈的童话书来讲：
//   「反乌托邦」= 彩虹河小镇失去了颜色的那些夜晚；「我」（鲸鱼娘）点着一盏小灯、坐着折纸船，一直为「你」唱歌。
//   「你」（智谱 = 彼得潘）有一颗长着翅膀、想飞的心，被一张露水网罩住；她带着彼得潘的小刀，后来放下了，落地的地方开出一朵花。
//   「平淡的人生」= 童话书里还没上色的一页；「签字笔画出了乌托邦」= 有人拿笔把它重新画上颜色。
//   「没用的零件」= 八音盒里一颗不和谁咬合、却自己开了花的小齿轮。结尾：你飞回来了，歌声让彩虹河和每一扇窗重新亮起来。
// 选角按《童话镇》设定：鲸鱼娘 = 主角；智谱 = 彼得潘；Claude = 唯一戴金冠的公主；豆包 = 小红帽；Gemini = 爱丽丝；
// Kimi = 灰姑娘 / 智者；千问 = 疯帽子；GPT 龙娘 = 龙 / 反派影子。
import { LINES, wAt, wTimes, charTimes, DUR } from './lyrics';
import { sm, lerp, TAU } from './core';
import { beatK } from './beat';
import { MZ, ROWS, ROW_W, riverZ, PUMPKIN } from './sets';
import * as X from './fx';
import * as Y from './fairy';

const L = (i) => LINES[i].s, T = (i) => (i === 0 ? 0 : LINES[i].s - 0.07);
const A = (c, k, o = {}) => ({ c, k, ...o });
const S = (c, x, z, o = {}) => A(c, [[0, x, z, o.y || 0]], o);
const D = (c, x, z, o = {}) => S(c, x, z, { dance: true, ...o });
const shots = [];
const add = (a, b, set, o) => shots.push({ a, b, set, ...o });
const word = (w, i, o = {}) => ({ w, at: wAt(i, w), ts: wTimes(i, w), ...o });
const orbit = (c, d, h, a, fov, ty = 0) => ({ pos: [c[0] + Math.sin(a) * d, c[1] + h, c[2] + Math.cos(a) * d], tgt: [c[0], c[1] + ty, c[2]], fov });
const GROUP = ['gpt', 'qwen', 'claude', 'whale', 'zai', 'gemini', 'kimi', 'doubao'];
const row = (o = {}) => GROUP.map((id, i) => S(id, -5.6 + i * 1.6, (i % 2) * 0.5 - 0.25, { ph: i, ...o }));
const sing = (t) => (beatK(t) % 2 ? 'whale_big_wave' : null);
const sail = (a, x0, v) => (t) => { const x = x0 + (t - a) * v; return [x, 0.2 + Math.sin(t * 2.4) * 0.04, riverZ(x)]; };
const ER = 2.6, SHADE = 'rgba(120,80,50,0.82)';
const glare = (i) => ({ fx(c) { const q = sm((c.t - L(i)) / 0.7); c.add.glow([0, 4.4, -9], 10 + 30 * q, [255, 244, 200], 0.5 + 0.5 * q); c.add.glow([0, 4.4, -9], 3 + 9 * q, [255, 255, 255], 1); }, post(g, c) { X.whiteout(g, 0.36 * sm((c.t - L(i) - 0.15) / 0.7)); } });
const PINK = '#ff7f9f', GOLD = '#f5a623', BLUE = '#5a9ae8', MINT = '#35b58a', LILAC = '#9a7ae0', ORANGE = '#ff8a3a';

// ===================== 主歌一：你的心，和那张网 =====================
// 0 只因为你那渴望自由的心脏 —— 森林空地，「你」仰着头，一颗长翅膀的心扑扇着往天上飞
add(0, T(1), 'glade', { name: '想飞的心', cam: [[0, 1.5, 10.5], [0, 2.1, -0.5], [0, 1.8, 7.8], [0, 2.3, -0.5], 38], actors: [S('zai', 0, 0.6)],
  fx(c) { Y.wingHeart3(c, [Math.sin(c.t * 1.3) * 0.3, 2.75 + 0.45 * sm(c.k) + Math.sin(c.t * 2.6) * 0.1, -0.2], 0.8, { flap: 0.6 }); X.sparkle3(c, [0, 3.0, -0.2], wAt(0, '心脏'), 10, [255, 220, 230]); },
  words: [word('心脏', 0, { x: 0.8, y: 0.5, size: 130, col: PINK })] });
// 1 困在一张没空隙的网 —— 露水丝网罩下来，越收越密，心在里面急得乱撞
add(T(1), T(2), 'glade', { name: '没空隙的网', cam: [[3.6, 2.0, 9.4], [0, 1.7, -0.6], [-2.8, 2.3, 8.4], [0, 1.9, -0.6], 40], actors: [S('zai', 0, -0.3, { lean: () => -0.04 })],
  fx(c) { const q = sm((c.t - L(1)) / 1.6); Y.wingHeart3(c, [Math.sin(c.t * 9) * 0.5 * (1 - q * 0.6), 2.55 + Math.abs(Math.sin(c.t * 7)) * 0.25, -0.6], 0.6, { flap: 0.7, fast: true }); Y.dewNet3(c, [0, 1.2, -0.6], lerp(3.6, 2.7, q), Math.round(lerp(6, 14, q)), c.t * 0.3); },
  words: [word('网', 1, { x: 0.16, y: 0.34, size: 180, col: BLUE })] });
// 2 我们的周围并非没光亮 —— 夜里的彩虹河小镇：窗子亮着，路灯亮着，孔明灯升起来，大家站成一排
add(T(2), T(3), 'townNight', { name: '周围并非没光亮', cam: [[-6.5, 3.0, 12.8], [-1.6, 1.0, -1], [5.2, 3.0, 11.6], [1.6, 1.0, -1], 40], actors: row(),
  fx(c) { Y.lanterns(c, 9, [-12, 24, -5.5, 2.5, 8], 3, 0.7); }, words: [word('光亮', 2, { x: 0.5, y: 0.18, size: 120, col: GOLD })] });
// 3 只是太耀眼 —— 太阳一下子亮得睁不开眼，人都成了剪影
add(T(3), T(4), 'townDay', { name: '太耀眼', noZoom: true, cam: [[0, 0.9, 10.5], [0, 2.4, -8], [0, 0.85, 9.0], [0, 2.8, -8], 44], actors: row({ tint: SHADE }), ...glare(3), words: [word('太耀眼', 3, { x: 0.5, y: 0.24, size: 130, col: GOLD })] });
// 4 将我们灼伤 —— 太阳太烫了，四个人躲到一朵大蘑菇底下
add(T(4), T(5), 'sunny', { name: '躲进蘑菇伞', cam: [[1.6, 1.4, 8.8], [0, 1.5, 0], [-1.0, 1.3, 7.4], [0, 1.5, 0], 38], actors: ['claude', 'whale', 'zai', 'gemini'].map((id, i) => S(id, -2.4 + i * 1.6, 0, { ph: i })),
  fx(c) { if (c.t > wAt(4, '灼伤')) X.bubble3(c, [-0.8, 2.25, 0], '好烫'); }, words: [word('灼伤', 4, { x: 0.82, y: 0.2, size: 130, col: ORANGE })] });
// 5 在这个世界难免会迷茫 —— 俯瞰树篱迷宫：鲸鱼娘走到岔路口左右张望，小红帽在另一条路上找路
add(T(5), T(6), 'maze', { name: '树篱迷宫', cam: [[0, 13, 10], [0, 0, -5], [2.4, 11, 8], [MZ.colX * 0.6, 0, MZ.rowZ - 2], 44],
  actors: [A('whale', [[T(5), MZ.x0 - 1.2, MZ.rowZ], [L(5) + 1.1, MZ.colX, MZ.rowZ], [T(6) + 1, MZ.colX, MZ.rowZ]], { flipAt: [L(5) + 1.35, L(5) + 1.6] }), A('doubao', [[T(5), MZ.colX, MZ.z0 - 1], [T(6), MZ.colX, MZ.rowZ - 3.2]])],
  fx(c) { if (c.t > L(5) + 1.2) X.bubble3(c, [MZ.colX, 2.3, MZ.rowZ], '？'); }, words: [word('迷茫', 5, { x: 0.82, y: 0.2, size: 130, col: MINT })] });
// 6 但别再把小刀带在身上 —— 「你」攥着彼得潘的小刀；鲸鱼娘走过去，两人中间长出一朵花，唱到「带在身上」刀落了地
add(T(6), T(7), 'glade', { name: '放下小刀', cam: [[0.9, 1.35, 6.6], [0.2, 1.0, 0], [0.3, 1.2, 5.2], [0.2, 1.0, 0], 34],
  actors: [S('zai', 1.0, 0), A('whale', [[T(6), -2.6, 0.25], [L(6) + 1.1, -0.45, 0.25], [T(7) + 1, -0.45, 0.25]])],
  fx(c) { const t0 = wAt(6, '带'); Y.dagger3(c, [1.36, 0.74, 0.12], t0); X.flowerGrow3(c, [0.3, 0, 0.4], L(6) + 0.9, [255, 150, 190]); X.hearts3(c, [0.3, 1.7, 0.2], t0 + 0.4, [255, 150, 190], 4); },
  words: [word('小刀', 6, { x: 0.18, y: 0.26, size: 130, col: BLUE })] });
// 7 至少我还在为你而歌唱 —— 夜里的空地，鲸鱼娘站在树桩上唱，萤火虫围着，「你」在旁边听
add(T(7), T(8), 'gladeNight', { name: '为你而歌唱', cam: [[-1.2, 1.6, 8.0], [0.6, 1.4, 0], [-0.4, 1.5, 6.2], [0.7, 1.5, 0], 36],
  actors: [S('whale', 0, -0.2, { y: 0.45, gy: 0.45, pose: sing }), S('zai', 2.6, 0.9, { lean: (t) => 0.05 * Math.sin(t * 2.5) })],
  fx(c) { X.notes3(c, [0.35, 2.0, -0.1], c.a + 0.2, '#ffe9a8'); for (let i = 0; i < 4; i++) { const rr = (c.t * 1.3 + i * 1.1) % 4.4; X.ring3(c.add, 0, 0.03, -0.2, 1.1 + rr, 40, 0.04, [255, 230, 150], 0.7 * (1 - rr / 4.4)); } },
  words: [word('歌唱', 7, { x: 0.2, y: 0.26, size: 140, col: GOLD })] });
// 8 在黑暗漫长的反乌托邦 —— 小镇没了颜色：灰蓝的房子、灰色的河；只有她的小纸船上亮着一盏灯
const s8 = sail(T(8), -4.5, 3.6);
add(T(8), T(9), 'townDark', { name: '没有颜色的小镇', noZoom: true, cam: [[-7, 4.2, 6.5], [-3, 0.6, -7], [4, 3.4, 5.5], [2.5, 0.6, -7], 44], actors: [A('whale', null, { at: s8, s: 0.75, noShadow: true })],
  fx(c) { const [x, y, z] = s8(c.t); Y.boat3(c.S2, x, y - 0.2, z, 1.3); c.add.glow([x + 1.0, y + 0.9, z], 2.8, [255, 214, 140], 0.6 + 0.2 * c.p); c.add.dot([x + 1.0, y + 0.9, z + 0.05], 0.1, [255, 240, 190]); },
  words: [word('反乌托邦', 8, { x: 0.5, y: 0.2, size: 110, col: '#8e9ae8' })] });

// ===================== 副歌一：转啊转 =====================
// 9 天空和地球转啊转 —— 小王子式的小星球慢慢转，整片星空也在转，鲸鱼娘小小地站在上面
add(T(9), T(10), 'starsky', { name: '天空和地球', camf: (t, k) => orbit([0, 0, -2], 11.5, 2.4, -0.7 + k * 1.1, 40, 0.4), actors: [S('whale', 0, -2, { y: ER, s: 0.5 })],
  fx(c) { Y.planet3(c, [0, 0, -2], ER, c.t * 0.7); }, words: [word('转啊转', 9, { x: 0.5, y: 0.16, size: 120, col: LILAC })] });
// 10 我站在地上看了又看 —— 夜晚的小山坡，极光在头顶飘，每唱一个「看」就回一次头
add(T(10), T(11), 'hill', { name: '看了又看', cam: [[2.4, 0.9, 6.6], [0, 1.7, -4], [1.2, 0.8, 5.0], [0, 2.0, -4], 42], actors: [S('whale', 0, 0, { flipAt: charTimes(10, '看') })],
  words: [word('看了又看', 10, { x: 0.5, y: 0.16, size: 110, col: MINT })] });
// 11a 终点公交站无人在 —— 童话小车站空着，鲸鱼娘一个人走过来
const bus1 = L(11) + 1.85;
add(T(11), bus1, 'busstop', { name: '终点站没有人', cam: [[5.2, 1.9, 10.5], [-0.6, 1.4, -1], [3.0, 1.7, 8.8], [-0.8, 1.4, -1], 38], actors: [A('whale', [[T(11), -9.5, 0.5], [bus1 + 0.6, -2.6, 0.5]])] });
// 11b 永远不存在的下一班 —— 路边的南瓜马车只剩金线的幻影，慢慢散了，还是一只南瓜
add(bus1, T(12), 'busstop', { name: '不会来的南瓜马车', cam: [[3.4, 1.7, 9.6], [-1.6, 1.1, 0.6], [2.6, 1.6, 8.6], [-1.8, 1.1, 0.8], 40], actors: [S('whale', -0.4, 0.3)],
  fx(c) { Y.ghostCoach3(c, [PUMPKIN[0], PUMPKIN[1] + 0.3, PUMPKIN[2]], 1 - sm((c.t - bus1 - 0.4) / 1.3)); if (c.t > wAt(11, '下一班')) X.bubble3(c, [-0.4, 2.3, 0.3], '……'); },
  words: [word('下一班', 11, { x: 0.74, y: 0.18, size: 120, col: ORANGE })] });
// 12 我站在原地转又转 —— 旋转木马的八音盒台上，镜头绕着她转一整圈
add(T(12), T(13), 'carousel', { name: '原地转又转', camf: (t, k) => orbit([0, 1.7, 0], 9.2, 0.5, k * TAU, 40), actors: [S('whale', 0, 0, { y: 0.12, gy: 0.12, dance: true })],
  words: [word('转又转', 12, { x: 0.17, y: 0.3, size: 100, col: PINK })] });
// 13 回忆像相册 翻了又翻 —— 小木屋里立着一本大大的立体相册，相片是大家；公主站在一旁翻
add(T(13), T(14), 'cottage', { name: '回忆像相册', cam: [[2.2, 1.9, 8.4], [0, 1.6, -2], [0.9, 1.7, 6.6], [0, 1.6, -2], 38], actors: [S('claude', -3.1, -0.4)],
  fx(c) { X.album3(c, [0, 0, -2.2], [L(13) + 0.35, ...charTimes(13, '翻')]); },
  words: [word('相册', 13, { x: 0.82, y: 0.2, size: 110, col: ORANGE }), word('翻了又翻', 13, { x: 0.8, y: 0.2, size: 96, col: ORANGE })] });
// 14 人生本该如花绚烂 —— 晴空、彩虹、一整片花海，蝴蝶在飞，鲸鱼娘从花里走过
add(T(14), T(15), 'meadow', { name: '如花绚烂', cam: [[-3.2, 1.3, 7.6], [-1, 1.2, 0], [2.6, 1.2, 7.0], [1.4, 1.2, 0], 38], actors: [A('whale', [[T(14), -3.6, 0.5], [T(15), 2.4, 0.5]])],
  words: [word('绚烂', 14, { x: 0.5, y: 0.2, size: 140, col: PINK })] });
// 15 为何我的却如此的平淡 —— 同一片花海，却是童话书里还没上色的一页，只有她自己有颜色
add(T(15), T(16), 'meadow', { name: '没上色的一页', paper: true, noDyn: true, sketch: () => -1e9, noZoom: true, cam: [[0, 1.5, 11], [0, 1.2, 0], [0, 1.5, 10.2], [0, 1.2, 0], 40], actors: [S('whale', 0, 0.5, { s: 0.9 })],
  words: [word('平淡', 15, { x: 0.5, y: 0.24, size: 110, col: '#b4aa9c' })] });

// ===================== 过门：都带走吧 → 画一个乌托邦 =====================
// 16 就把我吉他带走吧 —— 黄昏的河边，公主抱着吉他弹；唱到「带走吧」吉他落进漂过的折纸船
const s16 = sail(T(16), -6.5, 5);
add(T(16), T(17), 'townDusk', { name: '吉他放上纸船', cam: [[0.8, 2.9, 8.6], [0, 0.8, -3], [1.4, 2.7, 7.4], [0.8, 0.8, -3.5], 40], actors: [S('claude', -1.5, 0.5, { dance: true })],
  fx(c) {
    const t0 = wAt(16, '带'), b = s16(c.t), st = c.st[0], q = sm((c.t - t0) / 0.55), from = [st.x + 0.06, st.y + 0.62 + st.bounce, st.z + 0.14], to = [b[0], b[1] + 0.75, b[2]];
    const p = [lerp(from[0], to[0], q), lerp(from[1], to[1], q) + Math.sin(q * Math.PI) * 1.4, lerp(from[2], to[2], q)];
    Y.boat3(c.S2, b[0], b[1] - 0.2, b[2], 1.5); if (q > 0 && q < 1) c.add.glow(p, 0.9, [255, 230, 160], 0.4);
    c.add.custom(p, (g, x, y, k) => X.guitarShape(g, x, y, k, lerp(0.85, 0.4, q)), 0.3);
  }, words: [word('吉他', 16, { x: 0.8, y: 0.22, size: 130, col: ORANGE })] });
// 17 就把我的歌也带走吧 —— 金色五线谱丝带载着音符飘向天边，鲸鱼娘挥手告别
add(T(17), T(18), 'townDusk', { name: '歌也带走吧', cam: [[-2.8, 1.6, 7.8], [0.4, 1.8, -2], [-1.4, 1.7, 6.4], [1.2, 2.2, -2], 40], actors: [S('whale', -1.0, 0.2, { pose: () => 'whale_big_wave' })],
  fx(c) { Y.staffRibbon(c, [-0.4, 1.6, 0.1], c.a); }, words: [word('歌', 17, { x: 0.84, y: 0.62, size: 160, col: PINK })] });
// 18 连同我的理想 —— 晚霞云海上孔明灯一盏盏升空，龙娘（影子）托着那颗叫「理想」的星星越飞越高
add(T(18), T(19), 'sunsetsky', { name: '理想飞走了', cam: [[0, 1.3, 9.2], [0, 2.2, 0], [0, 1.9, 8.2], [0, 3.6, 0], 38], actors: [A('gpt', [[T(18), 0, 0, 0.3], [T(19), 0.3, 0, 2.4]], { pose: () => 'gpt_boss_cast0', noWalk: true, noShadow: true })],
  fx(c) { const s = c.st[0]; X.star3(c, [s.x + 0.45, s.y + 2.2, 0.15], 0.32); Y.lanterns(c, 12, [-7, 14, -6, 5, 7], 5, 0.8); }, words: [word('理想', 18, { x: 0.8, y: 0.3, size: 130, col: GOLD })] });
// 19 我的人生统统都带走吧 —— 折纸船载着吉他、星星、音符顺着彩虹河漂远，鲸鱼娘站在岸边看
const s19 = sail(T(19), -4, 4.2);
add(T(19), T(20), 'townDusk', { name: '纸船统统带走', cam: [[-2.5, 3.2, 7.6], [-1, 0.6, -4.5], [1.5, 3.6, 7.2], [4.5, 0.6, -6.5], 40], actors: [S('whale', -1.8, -0.6)],
  fx(c) { const b = s19(c.t); Y.boat3(c.S2, b[0], b[1] - 0.2, b[2], 1.6); Y.cargo3(c, [b[0], b[1] + 0.8, b[2]]); c.add.glow([b[0], 1.2, b[2]], 2.2, [255, 230, 170], 0.3); },
  words: [word('统统都带走吧', 19, { x: 0.5, y: 0.18, size: 92, col: ORANGE })] });
// 20 也许某个看不见的地方 —— 雾里只有一点城堡的影子，智者（Kimi）和鲸鱼娘望着那边
add(T(20), T(21), 'mist', { name: '看不见的地方', cam: [[-2.4, 1.6, 7.8], [0.2, 1.8, -8], [-0.9, 1.6, 6.4], [0.4, 2.6, -12], 40], actors: [S('whale', -0.9, 0), S('kimi', 0.8, 0.2, { pose: () => 'kimi_side_0' })],
  words: [word('看不见', 20, { x: 0.5, y: 0.18, size: 110, col: LILAC })] });
// 21 签字笔画出了乌托邦 —— 一支签字笔从左往右画，画过的地方，彩虹河小镇有了颜色
add(T(21), T(22), 'townDay', { name: '画出乌托邦', penZ: -6, sketch: (k, t) => lerp(-17, 20, sm((t - L(21) + 0.1) / 1.75)), cam: [[0, 5.2, 13], [0, 0.6, -7], [0, 4.4, 11.5], [0, 0.8, -7], 44], actors: [S('kimi', -3.4, 0.6)],
  fx(c) { X.pen3(c, [Math.min(c.penX, 11), 0.05, -2.4]); }, words: [word('乌托邦', 21, { x: 0.24, y: 0.18, size: 120, col: PINK })] });
// 22–24 八小时清醒 / 做梦 / 种朵花 —— 三色大钟：醒（公主在书桌前）、梦（灰姑娘睡在云上）、花（爱丽丝种出一朵花）
add(T(22), T(23), 'clock', { name: '八小时清醒', clock: 0, cam: [[6.4, 1.9, 7.2], [2.6, 2.2, -2], [5.0, 1.9, 6.0], [2.4, 2.3, -2], 40], actors: [S('claude', 3.2, 0.5)],
  fx(c) { c.add.glow([4.1, 1.05, 0.15], 0.9, [160, 220, 255], 0.35 + 0.2 * c.p); }, words: [word('清醒', 22, { x: 0.2, y: 0.2, size: 110, col: GOLD })] });
add(T(23), T(24), 'clock', { name: '八小时做梦', clock: 1, cam: [[0, 2.0, 7.6], [0, 1.8, -2], [0, 1.9, 6.4], [0, 1.9, -2], 40], actors: [S('kimi', 0, 1.3, { y: 0.62, gy: 0.62, pose: () => 'kimi_front_1' })],
  fx(c) { X.zzz3(c, [0.35, 2.1, 1.3], T(23)); }, words: [word('做梦', 23, { x: 0.82, y: 0.2, size: 110, col: BLUE })] });
add(T(24), T(25), 'clock', { name: '八小时种朵花', clock: 2, cam: [[-6.4, 1.8, 7.0], [-2.8, 1.5, -1], [-5.0, 1.6, 5.8], [-3.0, 1.3, 0], 40], actors: [S('gemini', -3.4, 0.7)],
  fx(c) { X.flowerGrow3(c, [-4.4, 0.4, 0.9], L(24) + 0.15); }, words: [word('种朵花', 24, { x: 0.8, y: 0.2, size: 110, col: MINT })] });

// ===================== 主歌二：夜里的想念 =====================
// 25 夜晚的凉风吹过身边空荡的街上 —— 夜里的小镇，路上只有她一个人，风带着叶子吹过去
add(T(25), T(26), 'townNight', { name: '夜晚的凉风', cam: [[-3.2, 2.5, 8.6], [-1, 0.9, -1], [3.2, 2.6, 8.4], [2.6, 0.9, -1], 38], actors: [A('whale', [[T(25), -4.6, 0.6], [T(26) + 0.5, 6.8, 0.6]])],
  fx(c) { Y.breeze3(c); }, words: [word('凉风', 25, { x: 0.5, y: 0.18, size: 110, col: BLUE }), word('空荡', 25, { x: 0.5, y: 0.18, size: 110, col: LILAC })] });
// 26 只剩想念 —— 空空的路上，萤火虫聚成一颗心
add(T(26), T(27), 'townNight', { name: '只剩想念', cam: [[0, 1.5, 7.4], [0, 1.7, -3], [0, 1.6, 6.4], [0, 2.0, -3], 38], actors: [], fx(c) { Y.fireflyHeart(c, [0, 2.0, -1], T(26)); },
  words: [word('想念', 26, { x: 0.82, y: 0.3, size: 130, col: GOLD })] });
// 27 想念你天真无邪笑颜 —— 回忆里的晚霞花海，「你」笑着跟着拍子蹦
add(T(27), T(28), 'meadowSunset', { name: '天真无邪笑颜', warm: 1, cam: [[1.2, 1.3, 5.4], [0, 1.0, 0.5], [0.4, 1.15, 4.4], [0, 1.0, 0.5], 34], actors: [D('zai', 0, 0.5)],
  fx(c) { X.hearts3(c, [0.5, 1.7, 0.5], L(27) + 0.3, [255, 170, 200], 4); X.hearts3(c, [-0.5, 1.7, 0.5], L(27) + 1.2, [255, 170, 200], 4); X.sparkle3(c, [0, 1.1, 0.6], L(27) + 0.1, 10, [255, 240, 190]); },
  words: [word('笑颜', 27, { x: 0.8, y: 0.26, size: 130, col: PINK })] });
// 28 回头你却早就已经不见 —— 鲸鱼娘一回头，「你」化成星尘，飞向远处那颗最亮的星（永无岛）
const gone = wAt(28, '不见');
add(T(28), T(29), 'hill2', { name: '回头不见', cam: [[0, 1.4, 7.6], [0, 1.5, 0], [0, 1.3, 6.6], [0, 1.7, 0], 38],
  actors: [S('whale', -1.4, 0.4, { flipAt: [L(28) + 0.1] }), S('zai', 1.4, -0.2, { alpha: (t) => 1 - sm((t - gone + 0.7) / 1.0) })],
  fx(c) { X.dissolve3(c, [1.4, 0.9, -0.2], gone - 0.8, [255, 236, 170]); c.add.glow([4.5, 6.5, -12], 1.6 + c.p, [255, 250, 220], 0.9); },
  words: [word('不见', 28, { x: 0.2, y: 0.24, size: 130, col: LILAC })] });
// 29 不堪的生活每天重演 —— 一排一模一样的小房子，门口一模一样的她做着一模一样的动作，太阳月亮一拍一换
add(T(29), T(30), 'rows', { name: '每天重演', cam: [[0, 2.2, 13], [0, 1.6, -2], [0, 2.0, 11.6], [0, 1.6, -2], 40],
  actors: ROWS.map((x) => S('whale', x, -1.0, { s: 0.8, pose: (t) => ['whale_big_idle', 'whale_big_wave', 'whale_big_idle', 'whale_big_point'][((beatK(t) % 4) + 4) % 4] })),
  post(g, c) { const n = sm(-Math.sin(c.t * ROW_W) * 2); if (n > 0) { g.fillStyle = `rgba(36,44,120,${(0.4 * n).toFixed(3)})`; g.fillRect(0, 0, 1280, 720); } },
  words: [word('每天重演', 29, { x: 0.5, y: 0.18, size: 110, col: BLUE })] });
// 30 这世界早已换了人间 —— 还是那座小镇，已经下雪了
add(T(30), T(31), 'townSnow', { name: '换了人间', cam: [[-2, 1.6, 9], [0, 1.4, -4], [1.5, 3.4, 11], [0, 1.6, -6], 42], actors: [S('whale', 0, 0.6)], words: [word('换了人间', 30, { x: 0.5, y: 0.18, size: 110, col: BLUE })] });
// 31 路灯矗立街边依旧耀眼 —— 两排暖黄路灯一直排到远处，鲸鱼娘迎面走来
add(T(31), T(32), 'avenue', { name: '路灯依旧耀眼', cam: [[0.6, 1.6, 9.2], [0, 1.8, -20], [0.2, 1.5, 7.6], [0, 1.6, -20], 40], actors: [A('whale', [[T(31), -1.2, -6.5], [T(32), 0.6, -3.6]])],
  words: [word('路灯', 31, { x: 0.5, y: 0.16, size: 120, col: GOLD })] });
// 32 照亮我的人生无奈的从前 —— 一盏路灯照着地上散落的旧相片，鲸鱼娘低头看
add(T(32), T(33), 'lampphotos', { name: '无奈的从前', cam: [[2.6, 3.4, 6.8], [0.2, 0.3, -0.6], [1.7, 2.5, 5.3], [0.2, 0.5, -0.6], 40], actors: [S('whale', -1.1, -0.9)],
  fx(c) { X.groundPhotos(c, [0.4, 0, -0.4]); }, words: [word('从前', 32, { x: 0.82, y: 0.2, size: 120, col: ORANGE })] });

// ===================== 副歌二 =====================
// 33 天空和地球转啊转 —— 这次龙娘化成小银龙绕着星球飞
const dragon = (t) => { const a = t * 1.5, R = ER + 1.25; return [Math.cos(a) * R, 0.6 + Math.sin(t * 2.2) * 0.5, -2 + Math.sin(a) * R]; };
add(T(33), T(34), 'starsky2', { name: '银龙绕星球', camf: (t, k) => orbit([0, 0, -2], 12.5, 3.0, 0.6 - k * 0.9, 42, 0.3),
  actors: [S('whale', 0, -2, { y: ER, s: 0.5 }), A('gpt', null, { at: dragon, autoFlip: true, pose: (t) => 'gpt_fly_' + (Math.floor(t * 6) % 2), s: 0.9, noShadow: true })],
  fx(c) { Y.planet3(c, [0, 0, -2], ER, c.t * 0.7, { atm: [255, 190, 230] }); for (let i = 1; i < 16; i++) c.add.dot(dragon(c.t - i * 0.035), 0.09 * (1 - i / 16), [255, 230, 140], 0.8 * (1 - i / 16)); },
  words: [word('转啊转', 33, { x: 0.5, y: 0.16, size: 120, col: PINK })] });
// 34 我站在地上看了又看 —— 粉紫色极光
add(T(34), T(35), 'hill2', { name: '看了又看·二', cam: [[-2.4, 0.9, 6.6], [0, 1.7, -4], [-1.2, 0.8, 5.0], [0, 2.0, -4], 42], actors: [S('whale', 0, 0, { flipAt: charTimes(34, '看') })],
  words: [word('看了又看', 34, { x: 0.5, y: 0.16, size: 110, col: LILAC })] });
// 35a 终点公交站无人在 —— 下雨了，站台只有鲸鱼娘一个
const bus2 = L(35) + 1.85;
add(T(35), bus2, 'busstopRain', { name: '终点站·雨', cam: [[3.8, 1.7, 8.8], [0, 1.3, -1], [1.6, 1.5, 7.0], [-0.2, 1.3, -1], 38], actors: [S('whale', 0.4, -0.75)] });
// 35b 永远不存在的下一班 —— 疯帽子（千问）也来等车：他那只钟永远停在六点（下午茶的时间永远不走）
add(bus2, T(36), 'busstopRain', { name: '停摆的钟', cam: [[-2.6, 1.3, 7.2], [0.6, 2.0, -1], [-1.6, 1.2, 6.0], [0.6, 2.2, -1], 40], actors: [S('whale', -0.5, -0.6), S('qwen', 1.4, -0.5)],
  fx(c) { X.stopClock3(c, [0.4, 4.1, -1.1], 0.75); }, words: [word('下一班', 35, { x: 0.24, y: 0.2, size: 120, col: ORANGE })] });
// 36 我站在原地转又转 —— 大家像木马一样围着她转
const RING = ['claude', 'gemini', 'kimi', 'qwen', 'doubao', 'zai', 'gpt'];
add(T(36), T(37), 'carousel', { name: '大家围着转', camf: (t, k) => orbit([0, 1.7, 0], 9.6, 0.7, -k * TAU * 0.75, 40),
  actors: [S('whale', 0, 0, { y: 0.12, gy: 0.12, dance: true }), ...RING.map((id, i) => A(id, null, { at: (t) => { const a = t * 1.1 + (i / 7) * TAU; return [Math.cos(a) * 2.5, 0.12 + 0.25 * Math.abs(Math.sin(t * 3.2 + i * 0.9)), Math.sin(a) * 2.5]; }, gy: 0.12, ph: i }))],
  words: [word('转又转', 36, { x: 0.17, y: 0.3, size: 100, col: PINK })] });
// 37 回忆像相册 翻了又翻 —— 这次是鲸鱼娘自己站在相册前
add(T(37), T(38), 'cottage', { name: '回忆像相册·二', cam: [[-2.2, 1.9, 8.4], [0, 1.6, -2], [-0.9, 1.7, 6.6], [0, 1.6, -2], 38], actors: [S('whale', 3.0, -0.4)],
  fx(c) { X.album3(c, [0, 0, -2.2], [L(37) + 0.35, ...charTimes(37, '翻')], 3); },
  words: [word('相册', 37, { x: 0.18, y: 0.2, size: 110, col: ORANGE }), word('翻了又翻', 37, { x: 0.2, y: 0.2, size: 96, col: ORANGE })] });
// 38 人生本该如花绚烂 —— 晚霞花海，三个人并肩走
add(T(38), T(39), 'meadowSunset', { name: '如花绚烂·晚霞', cam: [[3.2, 1.3, 7.8], [1, 1.2, 0], [-2.6, 1.2, 7.2], [-1.4, 1.2, 0], 38],
  actors: [A('claude', [[T(38), 3.2, 0.2], [T(39), -2.0, 0.2]]), A('whale', [[T(38), 4.4, 0.7], [T(39), -0.8, 0.7]]), A('gemini', [[T(38), 5.6, 0.2], [T(39), 0.4, 0.2]])],
  words: [word('如花', 38, { x: 0.5, y: 0.2, size: 140, col: PINK })] });
// 39 为何我的却如此的平淡 —— 又是没上色的那一页；但她脚边，第一朵有颜色的小花冒出来了
add(T(39), T(40), 'meadow', { name: '没上色的一页·一朵花', paper: true, noDyn: true, sketch: () => -1e9, noZoom: true, cam: [[0, 1.4, 8.6], [0.3, 1.1, 0], [0, 1.4, 7.6], [0.3, 1.1, 0], 40], actors: [S('whale', 0, 0.5, { s: 0.9 })],
  fx(c) { X.flowerGrow3(c, [1.1, 0, 0.8], L(39) + 0.35, [255, 130, 170]); }, words: [word('平淡', 39, { x: 0.5, y: 0.22, size: 110, col: '#b4aa9c' })] });

// ===================== 主歌三：大家都来了 =====================
// 40 只因为你那渴望自由的心脏 —— 那颗心没力气了，贴着一块创可贴；鲸鱼娘跑过来
add(T(40), T(41), 'glade', { name: '贴着创可贴的心', cam: [[0, 1.6, 9.6], [0, 1.9, -0.5], [0, 1.7, 7.6], [0, 2.0, -0.5], 38], actors: [S('zai', 0.5, 0.4), A('whale', [[T(40), -5, 0.6], [L(40) + 1.5, -1.1, 0.6], [T(41) + 1, -1.1, 0.6]])],
  fx(c) { Y.wingHeart3(c, [0.5, 2.6 + Math.sin(c.t * 2) * 0.08, -0.2], 0.72, { flap: 0.25, patch: true, dim: 0.5 }); }, words: [word('心脏', 40, { x: 0.82, y: 0.4, size: 130, col: PINK })] });
// 41 困在一张没空隙的网 —— 网外面站着赶来的大家，树林后面是龙娘淡紫色的大影子
add(T(41), T(42), 'glade', { name: '网外的大家', cam: [[-4.4, 2.3, 10.2], [0, 1.9, -0.8], [3.4, 2.5, 9.4], [0, 2.0, -0.8], 42],
  actors: [S('zai', 0, -0.4), S('whale', -4.0, 1.0), S('claude', -5.3, 0.3), S('gemini', 4.1, 0.9), S('kimi', 5.4, 0.2), S('gpt', 4.6, -9.5, { s: 2.8, tint: 'rgba(96,70,140,0.86)', pose: () => 'gpt_boss_rage', noShadow: true })],
  fx(c) { c.add.glow([4.6, 3.6, -10.5], 8, [210, 170, 255], 0.35 + 0.15 * c.p); Y.wingHeart3(c, [Math.sin(c.t * 8) * 0.3, 2.6, -0.7], 0.55, { flap: 0.6, fast: true, patch: true }); Y.dewNet3(c, [0, 1.2, -0.7], 2.7, 14, c.t * 0.3); },
  words: [word('网', 41, { x: 0.5, y: 0.14, size: 150, col: BLUE })] });
// 42–44 周围并非没光亮 / 太耀眼 / 灼伤（反打）
add(T(42), T(43), 'townNight', { name: '周围并非没光亮·二', cam: [[6.0, 0.8, 11.5], [1.5, 1.6, 0], [-5.4, 0.9, 11.0], [-1.5, 1.6, 0], 40], actors: row(),
  fx(c) { Y.lanterns(c, 16, [-12, 24, -5.5, 3, 8], 9, 0.8); }, words: [word('光亮', 42, { x: 0.5, y: 0.16, size: 120, col: GOLD })] });
add(T(43), T(44), 'townDay', { name: '太耀眼·二', noZoom: true, cam: [[2.4, 1.0, 10.5], [0, 2.6, -8], [-2.4, 0.9, 9.4], [0, 2.8, -8], 44], actors: row({ tint: SHADE }), ...glare(43), words: [word('太耀眼', 43, { x: 0.5, y: 0.24, size: 130, col: GOLD })] });
add(T(44), T(45), 'sunny', { name: '躲进蘑菇伞·二', cam: [[-1.8, 1.2, 8.6], [0, 1.6, 0], [1.2, 1.2, 7.4], [0, 1.6, 0], 38], actors: ['qwen', 'kimi', 'whale', 'zai', 'doubao'].map((id, i) => S(id, -3.0 + i * 1.5, (i % 2) * 0.4, { ph: i })),
  fx(c) { if (c.t > wAt(44, '灼伤')) X.bubble3(c, [1.5, 2.25, 0.4], '好烫'); }, words: [word('灼伤', 44, { x: 0.18, y: 0.2, size: 130, col: ORANGE })] });
// 45 在这个世界难免会迷茫 —— 迷宫里的人更多了，树篱外游走着一只淡淡的龙影
add(T(45), T(46), 'maze', { name: '树篱迷宫·二', cam: [[-2.4, 12, 9.6], [0, 0, -5], [0, 13, 8.6], [0, 0, -6], 44],
  actors: [S('whale', MZ.colX, MZ.rowZ, { flipAt: [L(45) + 0.5, L(45) + 1.0] }), A('claude', [[T(45), MZ.x1 + 1, MZ.rowZ], [T(46), MZ.colX + 3.2, MZ.rowZ]]), A('doubao', [[T(45), MZ.colX, MZ.z0 - 1], [T(46), MZ.colX, MZ.rowZ - 3.2]]),
    A('gemini', [[T(45), MZ.colX, MZ.z1 + 1.5], [T(46), MZ.colX, MZ.rowZ + 3]]), A('gpt', [[T(45), 13, -19], [T(46), 9, -19]], { s: 2.2, tint: 'rgba(96,70,140,0.86)', pose: () => 'gpt_boss_rage', noWalk: true, noShadow: true })],
  words: [word('迷茫', 45, { x: 0.82, y: 0.2, size: 130, col: MINT })] });
// 46 但别再把小刀带在身上 —— 鲸鱼娘就站在「你」身边；刀落了地，落下的地方开出一朵花
add(T(46), T(47), 'glade', { name: '小刀开成花', cam: [[-0.8, 1.3, 6.2], [0.3, 1.0, 0], [-0.1, 1.2, 5.2], [0.3, 1.0, 0], 34], actors: [S('zai', 1.0, 0), S('whale', -0.4, 0.25)],
  fx(c) { const t0 = wAt(46, '带'); Y.dagger3(c, [1.36, 0.74, 0.12], t0, { bloom: true }); X.hearts3(c, [0.3, 1.8, 0.2], t0 + 0.5, [255, 150, 190], 5); }, words: [word('小刀', 46, { x: 0.82, y: 0.26, size: 130, col: BLUE })] });
// 47 至少我还在为你而歌唱 —— 这次所有人都围在树桩边听
add(T(47), T(48), 'gladeNight', { name: '为你而歌唱·二', cam: [[0, 2.0, 10], [0, 1.4, -0.4], [0, 1.7, 8.0], [0, 1.4, -0.4], 40],
  actors: [S('whale', 0, -0.2, { y: 0.45, gy: 0.45, pose: sing }), S('zai', 1.9, 1.3), D('claude', -2.6, 0.2, { ph: 1 }), D('gemini', 3.4, -0.2, { ph: 2 }), D('kimi', -4.0, -1.2, { ph: 3 }), D('qwen', 4.6, -1.4, { ph: 4 }), D('doubao', -1.8, -2.2, { ph: 5 }), D('gpt', 2.0, -2.6, { ph: 6 })],
  fx(c) { X.notes3(c, [0.35, 2.0, -0.1], c.a + 0.1, '#ffe9a8'); for (let i = 0; i < 4; i++) { const rr = (c.t * 1.3 + i * 1.1) % 4.4; X.ring3(c.add, 0, 0.03, -0.2, 1.1 + rr, 40, 0.04, [255, 230, 150], 0.7 * (1 - rr / 4.4)); } },
  words: [word('歌唱', 47, { x: 0.5, y: 0.14, size: 130, col: GOLD })] });
// 48 在黑暗漫长的反乌托邦 —— 小镇还是灰的，但她的纸船后面，跟上来了好几盏灯
const s48 = sail(T(48), 4.5, -3.6);
add(T(48), T(49), 'townDark', { name: '没有颜色的小镇·二', noZoom: true, cam: [[7, 4.0, 6.5], [3, 0.6, -7], [-4, 3.2, 5.8], [-2.5, 0.6, -7], 44], actors: [A('whale', null, { at: s48, s: 0.75, noShadow: true })],
  fx(c) { const [x, y, z] = s48(c.t); Y.boat3(c.S2, x, y - 0.2, z, 1.3); c.add.glow([x - 1.0, y + 0.9, z], 2.8, [255, 214, 140], 0.6 + 0.2 * c.p); Y.lanterns(c, 8, [x + 1, 7, -8, 3, 5], 4, 0.6); },
  words: [word('反乌托邦', 48, { x: 0.5, y: 0.2, size: 110, col: '#8e9ae8' })] });

// ===================== 尾声：活下去 =====================
// 49 活下去 —— 八音盒里糖果色的齿轮一圈圈转，鲸鱼娘背上有一把小小的发条钥匙
add(T(49), T(50), 'gears', { name: '活下去', cam: [[0, 1.6, 9.5], [0, 2.4, -3], [0, 1.5, 8.2], [0, 2.4, -3], 42], actors: [S('whale', 0.2, 0.6)], fx(c) { Y.windKey3(c, c.st[0]); }, words: [word('活下去', 49, { x: 0.5, y: 0.16, size: 150, col: PINK })] });
// 50 我想活成没用的零件 —— 推近：她身边一颗谁也不咬合的小齿轮，自己转着，上面开出一朵花
add(T(50), T(51), 'gears', { name: '没用的小零件', cam: [[1.6, 1.0, 5.0], [0.7, 0.9, 0.6], [1.1, 0.95, 4.2], [0.7, 0.9, 0.6], 36], actors: [S('whale', 0.0, 0.6)],
  fx(c) { Y.windKey3(c, c.st[0]); X.gear3(c.S2, 1.6, 0.62, 0.9, 0.56, 8, 0.2, c.t * 1.4, [255, 176, 196]); X.flowerGrow3(c, [1.6, 1.16, 0.85], L(50) + 0.5, [255, 214, 110]); }, words: [word('零件', 50, { x: 0.82, y: 0.22, size: 130, col: GOLD })] });
// 51 活下去
add(T(51), T(52), 'gears', { name: '活下去·二', cam: [[-3.0, 2.6, 10.5], [0, 2.8, -3], [3.0, 2.4, 10.0], [0, 2.8, -3], 44], actors: [S('whale', 0.2, 0.6, { pose: () => 'whale_big_wave' })], fx(c) { Y.windKey3(c, c.st[0]); }, words: [word('活下去', 51, { x: 0.5, y: 0.16, size: 160, col: PINK })] });
// 52 呼唤唱着 却没人能听见 —— 夜晚的山坡上只有她，歌声化成音符飘向没有人的远处
add(T(52), T(53), 'hill', { name: '没人能听见', cam: [[0, 1.6, 7.6], [0, 1.4, 0], [0, 1.4, 6.0], [0, 1.4, 0], 38], actors: [S('whale', 0, 0, { pose: sing })],
  fx(c) { X.notes3(c, [0.35, 1.5, 0.1], c.a, '#cfe0ff'); for (let i = 0; i < 4; i++) { const rr = (c.t * 1.4 + i * 0.75) % 3; X.ring3(c.add, 0, 0.03, 0, 0.4 + rr, 40, 0.04, [200, 220, 255], 0.7 * (1 - rr / 3)); } }, words: [word('没人能听见', 52, { x: 0.5, y: 0.16, size: 100, col: LILAC })] });
// 53–55 活下去 / 零件 / 活下去 —— 大家一个个走进八音盒
add(T(53), T(54), 'gears', { name: '活下去·三', cam: [[0, 1.8, 11.5], [0, 2.4, -3], [0, 1.7, 10.0], [0, 2.4, -3], 44],
  actors: [S('whale', 0.2, 0.6), D('claude', -2.0, 0.9, { ph: 1 }), D('gemini', 2.4, 1.0, { ph: 2 }), D('kimi', -3.8, 1.4, { ph: 3 }), D('qwen', 4.0, 1.4, { ph: 4 })], fx(c) { Y.windKey3(c, c.st[0]); }, words: [word('活下去', 53, { x: 0.5, y: 0.16, size: 160, col: PINK })] });
add(T(54), T(55), 'gears', { name: '没用的零件·全员', cam: [[-2.6, 1.4, 10.0], [0, 1.6, 0], [2.0, 1.4, 9.0], [0, 1.6, 0], 42], actors: row(), words: [word('零件', 54, { x: 0.5, y: 0.16, size: 140, col: GOLD })] });
add(T(55), T(56), 'gears', { name: '活下去·四', flash: 1, cam: [[0, 2.4, 12.5], [0, 2.8, -3], [0, 2.0, 10.5], [0, 2.6, -3], 46], actors: row({ dance: true }), words: [word('活下去', 55, { x: 0.5, y: 0.16, size: 170, col: PINK })] });
// 56 但你歌声 我永远都能听见 —— 「你」从天上飞回来，落在鲸鱼娘身边；彩虹河一段段亮起，窗子一扇扇亮起
const land = (t) => { const q = sm((t - T(56)) / 1.25); return [lerp(7, 0.9, q), lerp(4.2, 0, q) + Math.sin(q * Math.PI) * 0.6, lerp(-2, 0.1, q)]; };
add(T(56), T(57), 'townWake', { name: '我永远都能听见', cam: [[0, 3.2, 11.5], [0, 1.0, -3], [0, 2.9, 10.2], [0, 1.1, -3], 40],
  actors: [S('whale', -0.7, 0.1, { pose: sing }), A('zai', null, { at: land, autoFlip: true, pose: (t) => (t < T(56) + 1.25 ? 'zai_side_0' : null), noShadow: true }), S('claude', -2.4, -0.3), S('qwen', -4.0, 0.2), S('gemini', 2.6, -0.3), S('kimi', 4.2, 0.2), S('doubao', 5.8, -0.2)],
  fx(c) { X.hearts3(c, [0.1, 2.0, 0.1], wAt(56, '听见'), [255, 150, 190], 5); for (let i = 1; i < 12; i++) { const p = land(c.t - i * 0.04); if (p[1] > 0.05) c.add.dot([p[0], p[1] + 0.8, p[2]], 0.08 * (1 - i / 12), [255, 236, 150], 0.85 * (1 - i / 12)); } },
  words: [word('听见', 56, { x: 0.5, y: 0.16, size: 130, col: GOLD })] });
// 57 在这反乌托邦里 —— 天亮了，小镇的颜色全回来了；那颗长翅膀的心飞出网、飞过城堡，大家在河边挥手
add(T(57), DUR + 0.2, 'townDawn', { name: '在这反乌托邦里', cam: [[0, 2.4, 10], [0, 1.2, -4], [0, 5.6, 15], [0, 2.2, -10], 40],
  actors: [...['qwen', 'claude', 'whale', 'zai', 'gemini', 'kimi', 'doubao'].map((id, i) => D(id, -4.8 + i * 1.6, (i % 2) * 0.5 - 0.25, id === 'whale' ? { ph: i, pose: sing } : { ph: i })),
    A('gpt', null, { at: (t) => [-10 + (t - T(57)) * 5.5, 8 + Math.sin(t * 2) * 0.5, -16], autoFlip: true, pose: (t) => 'gpt_fly_' + (Math.floor(t * 6) % 2), s: 1.8, noShadow: true })],
  fx(c) { const u = c.t - T(57); Y.wingHeart3(c, [2.5 + u * 0.9, 3.6 + u * 1.0, -4], 0.6, { flap: 0.7 }); X.sparkle3(c, [0, 2.4, 0], T(57) + 0.2, 14, [255, 240, 190]); } });

shots.sort((x, y) => x.a - y.a);
for (let i = 0; i < shots.length - 1; i++) if (Math.abs(shots[i].b - shots[i + 1].a) > 1e-6) throw new Error(`[分镜] 第 ${i} 镜与下一镜之间有缝：${shots[i].b} → ${shots[i + 1].a}`);
export const SHOTS_RAW = shots;
