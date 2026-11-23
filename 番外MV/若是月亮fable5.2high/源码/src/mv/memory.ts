// 回忆件（满月篇第二版新增）：全部代码绘制 + 图集里现成的像素帧，没有新增生图。
// · 拍立得十七张 = 第零天到第十六天，每天一个小场景（当天的东西）
// · 回忆泡泡十九个 = 十九支番外MV，每支一个母题
// · 月相表盘三十格 = 十月二十四日到十一月二十二日，中间那轮满月是第三十天
// · 日历页、胶片条、风铃、照片绳、跳房子粉笔格、胶片颗粒
import { FRAMES } from "./castData";
import { W, H, FONT, clamp, lerp, sstep, backOut, rng, glow, frameName } from "./stage";
import type { Assets, Img } from "./assets";
import { DAYS, MVS, LAMP_ON, dayName, dateName, cn } from "./data";

type G = CanvasRenderingContext2D;
const PI = Math.PI;
const R = (c: G, col: string, x: number, y: number, w: number, h: number) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
const disc = (c: G, col: string, x: number, y: number, r: number) => { c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, PI * 2); c.fill(); };
const tri = (c: G, col: string, x0: number, y0: number, x1: number, y1: number, x2: number, y2: number) => { c.fillStyle = col; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.lineTo(x2, y2); c.closePath(); c.fill(); };
function bg(c: G, a: string, b: string, w = 60, h = 44) { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, a); g.addColorStop(1, b); c.fillStyle = g; c.fillRect(0, 0, w, h); }
function img(c: G, im: Img, sx: number, sy: number, sw: number, sh: number, x: number, y: number, s: number, flip = false, a = 1) {
  c.save(); c.globalAlpha *= a; c.translate(x, y); if (flip) c.scale(-1, 1); c.drawImage(im, sx, sy, sw, sh, (-sw * s) / 2, -sh * s, sw * s, sh * s); c.restore();
}
function fr(c: G, A: Assets, name: string, x: number, y: number, s: number, flip = false, a = 1) {
  const r = FRAMES[name]; if (!r) throw new Error(`缺素材：图集里没有 ${name}`); img(c, A.atlas, r[0], r[1], r[2], r[3], x, y, s, flip, a);
}
function act(c: G, A: Assets, who: string, action: string, t: number, x: number, y: number, s: number, flip = false) { fr(c, A, frameName(who, action, Math.max(0, t), 8), x, y, s, flip); }
function fish(c: G, A: Assets, x: number, y: number, s: number, flip = false, a = 1) { img(c, A.benyu, 0, 0, A.benyu.width, A.benyu.height, x, y, s, flip, a); }
function label(c: G, str: string, x: number, y: number, size: number, col: string, align: CanvasTextAlign = "center", maxW?: number) {
  c.font = `${size}px ${FONT}`; c.textAlign = align; c.textBaseline = "middle"; c.fillStyle = col; c.fillText(str, x, y, maxW);
}
const fx = (t: number, n: number, fps = 6) => Math.floor(Math.max(0, t) * fps) % n;

// ---------- 小像素件 ----------
function pfish(c: G, x: number, y: number, col: string, s = 1, flip = false) {
  c.save(); c.translate(x, y); c.scale(flip ? -s : s, s); R(c, col, -4, -2, 8, 4); R(c, col, -3, -3, 6, 6); R(c, col, 4, -3, 2, 2); R(c, col, 4, 1, 2, 2); R(c, col, 5, -1, 1, 2); R(c, "#fff", -3, -1, 1, 1); c.restore();
}
function clap(c: G, x: number, y: number, open: number) {
  R(c, "#1b1b26", x, y + 4, 14, 9); R(c, "#f4f0e6", x + 1, y + 6, 12, 1); R(c, "#f4f0e6", x + 1, y + 9, 8, 1);
  c.save(); c.translate(x, y + 4); c.rotate(-open); R(c, "#1b1b26", 0, -3, 14, 3); for (let k = 0; k < 4; k++) R(c, "#f4f0e6", 1 + k * 3.5, -3, 1.5, 3); c.restore();
}
export function paper(c: G, x: number, y: number, w: number, h: number, rot = 0) {
  c.save(); c.translate(x, y); c.rotate(rot); R(c, "rgba(0,0,0,0.25)", -w / 2 + 1, -h / 2 + 1, w, h); R(c, "#fbf6ea", -w / 2, -h / 2, w, h);
  for (let k = 0; k < Math.floor(h / 3) - 1; k++) R(c, "#b9b2c4", -w / 2 + 2, -h / 2 + 2 + k * 3, w - (k % 2 ? 6 : 4), 1); c.restore();
}
function cup(c: G, x: number, y: number, rot: number, wine: string) {
  c.save(); c.translate(x, y); c.rotate(rot); R(c, "#f7efd9", -4, -10, 8, 6); R(c, wine, -3, -8, 6, 4); R(c, "#f7efd9", -1, -4, 2, 4); R(c, "#f7efd9", -3, 0, 6, 1); c.restore();
}
function bubbles(c: G, t: number, n: number, seed: number, w = 60, h = 44) {
  const r = rng(seed); c.strokeStyle = "rgba(220,240,255,0.7)"; c.lineWidth = 0.6;
  for (let i = 0; i < n; i++) { const x = r() * w, v = 4 + r() * 6, y = h - ((r() * h + t * v) % h), rr = 0.8 + r() * 1.4; c.beginPath(); c.arc(x + Math.sin(t * 2 + i) * 1.5, y, rr, 0, PI * 2); c.stroke(); }
}
function heart(c: G, x: number, y: number, s: number, col: string) { disc(c, col, x - s * 0.5, y - s * 0.3, s * 0.56); disc(c, col, x + s * 0.5, y - s * 0.3, s * 0.56); tri(c, col, x - s * 1.02, y - s * 0.05, x + s * 1.02, y - s * 0.05, x, y + s); }
function spark(c: G, A: Assets, t: number, x: number, y: number, s: number, a = 1) { fr(c, A, `fx_sparkle_${fx(t, 3, 8)}`, x, y, s, false, a); }
function nameplate(c: G, x: number, y: number, str: string, w: number, col = "#f6e3b4", ink = "#3a2430") { R(c, "#2a1c22", x - w / 2 - 1, y - 5, w + 2, 10); R(c, col, x - w / 2, y - 4, w, 8); label(c, str, x, y + 0.4, 6, ink, "center", w - 2); }
const floor = (c: G, col: string) => R(c, col, 0, 40, 60, 4);

// ---------- 第零天到第十六天：每天一格（画框 60×44，地面在 y=40） ----------
type Scene = (c: G, A: Assets, t: number) => void;
export const DAY_MEMO: string[] = [
  "墙上的日历打了第一个勾，本鲸挥手：日更打卡",
  "名牌从鲸鱼娘换成大肥鱼，本鲸吓一跳",
  "本鲸摇头冒汗；旁边三条小鱼排队等她选",
  "鱼牌上打了叉；桌上两只碰在一起的杯子，是第一支MV",
  "空饭盆，旁边一块场记板",
  "一只小鲸鱼飘到本鲸身边，中间一颗心",
  "小鲸鱼挂上名牌：笨鲸",
  "手机亮着直播的红点，笨鲸对着镜头",
  "放大镜来回找，头顶一个问号",
  "水族箱里，笨鱼隔着水看一群同类",
  "本鲸发着抖守住自己的饭盆",
  "深海里慢慢下沉的笨鱼，一束光，一张纸",
  "豆包摇摆，笨鱼跟着摇",
  "冒热气的白饭，一块场记板，三张剧组的脸",
  "一大一小两只沙漏，一张写不出数的账单",
  "线框方块在转：家变成立体的了；饭盆空着",
  "一束光里，本鲸站在前面，笨鱼在她身后",
];
const DAY_SCENES: Scene[] = [
  (c, A, t) => { bg(c, "#2c3168", "#4a4888"); floor(c, "#25264f"); R(c, "#3a2836", 39, 3, 2, 4); R(c, "#3a2836", 49, 3, 2, 4); R(c, "#fbf3df", 35, 6, 20, 22); R(c, "#d9534f", 35, 6, 20, 6);
    c.strokeStyle = "#2f9e6b"; c.lineWidth = 2.2; c.lineCap = "round"; c.beginPath(); c.moveTo(39, 19); c.lineTo(43.5, 24); c.lineTo(51, 14); c.stroke(); act(c, A, "whale", "wave", t, 18, 41, 0.36); },
  (c, A, t) => { bg(c, "#35305f", "#5a4a86"); floor(c, "#2a2550"); nameplate(c, 42, 9, "鲸鱼娘", 22, "#8e88a8", "#4a4460"); R(c, "#d9534f", 30, 8.4, 24, 1.2); nameplate(c, 42, 23, "大肥鱼", 24);
    act(c, A, "whale", "surprise", t, 17, 41, 0.36); fr(c, A, "fx_exclaim", 31, 16, 0.6); },
  (c, A, t) => { bg(c, "#253a66", "#3f6a94"); floor(c, "#1f2c52"); act(c, A, "whale", "shake", t, 17, 41, 0.36); fr(c, A, "fx_sweat", 30, 16, 0.6);
    ["#f6a65a", "#9ec8f0", "#e8a1a6"].forEach((col, k) => pfish(c, 44 + Math.sin(t * 2 + k) * 1.5, 10 + k * 11, col, 1.1, k % 2 === 1)); },
  (c, A, t) => { bg(c, "#3a2a50", "#8a5a6a"); floor(c, "#2c2040"); R(c, "#f6e3b4", 34, 4, 20, 14); pfish(c, 44, 11, "#7fa8d8", 1.2); c.strokeStyle = "#d9534f"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(37, 6); c.lineTo(51, 16); c.moveTo(51, 6); c.lineTo(37, 16); c.stroke();
    R(c, "#4a2e2a", 32, 36, 26, 4); const k = Math.abs(Math.sin(t * 3)); cup(c, 40 - k, 36, 0.22, "#c9566a"); cup(c, 50 + k, 36, -0.22, "#f3c86b"); act(c, A, "whale", "point", t, 17, 41, 0.36); },
  (c, A, t) => { bg(c, "#2a2c58", "#54507a"); floor(c, "#22244a"); act(c, A, "whale", "sad", t, 17, 41, 0.36); fr(c, A, "prop_bowl", 44, 40, 0.8); clap(c, 37, 6, 0.25 + 0.25 * Math.sin(t * 4)); fr(c, A, "fx_gloom", 29, 14, 0.5); },
  (c, A, t) => { bg(c, "#26407a", "#6a8ac8"); floor(c, "#1f3060"); act(c, A, "whale", "hop", t, 17, 41, 0.34); fish(c, A, 44, 30 + Math.sin(t * 3) * 2, 0.36, true); heart(c, 31, 12 + Math.sin(t * 3) * 1, 2.4, "#ff8fa8"); },
  (c, A, t) => { bg(c, "#2f3a70", "#7a86c0"); floor(c, "#252c58"); fish(c, A, 24, 31 + Math.sin(t * 2.6) * 1.6, 0.5); R(c, "#2a1c22", 43.5, 6, 1, 8); nameplate(c, 44, 18, "笨鲸", 18); spark(c, A, t, 52, 12, 0.45); },
  (c, A, t) => { bg(c, "#3a2450", "#7a4a80"); floor(c, "#2c1c40"); fish(c, A, 20, 30 + Math.sin(t * 2.6) * 1.6, 0.42); fr(c, A, "prop_phone", 45, 40, 1.25); R(c, "#d9534f", 34, 5, 20, 8); disc(c, "#fff", 38, 9, 1.4 * (0.6 + 0.4 * Math.abs(Math.sin(t * 5)))); label(c, "直播", 47, 9.4, 6, "#fff"); },
  (c, A, t) => { bg(c, "#2a3358", "#5a6a8a"); floor(c, "#222848"); fr(c, A, "p_whale_think", 18, 40, 0.5); fr(c, A, "prop_magnifier", 42 + Math.sin(t * 2.4) * 6, 32, 1.1); fr(c, A, "fx_question", 34, 12 + Math.sin(t * 5), 0.7); paper(c, 44, 35, 16, 8); },
  (c, A, t) => { bg(c, "#12365e", "#2a78a6"); R(c, "rgba(255,255,255,0.18)", 30, 0, 1.2, 44); fish(c, A, 15, 29 + Math.sin(t * 2.4) * 1.5, 0.36, true);
    ["#f6a65a", "#ffd27a", "#e8a1a6", "#b8e0ff"].forEach((col, k) => pfish(c, 36 + ((t * (5 + k) + k * 9) % 22), 8 + k * 9 + Math.sin(t * 2 + k), col, 1, false)); bubbles(c, t, 6, 9); },
  (c, A, t) => { bg(c, "#2c2a55", "#5a4a70"); floor(c, "#232046"); act(c, A, "whale", "shiver", t, 18, 41, 0.36); fr(c, A, "prop_bowl", 43, 40, 0.9); c.strokeStyle = `rgba(255,214,130,${0.5 + 0.4 * Math.sin(t * 4)})`; c.lineWidth = 1.2; c.beginPath(); c.arc(43, 34, 12, PI * 1.05, PI * 1.95); c.stroke(); fr(c, A, "fx_sweat", 30, 15, 0.55); },
  (c, A, t) => { bg(c, "#06142e", "#12406a"); c.save(); c.globalCompositeOperation = "lighter"; tri(c, "rgba(160,210,255,0.16)", 24, 0, 40, 0, 52, 44); tri(c, "rgba(160,210,255,0.1)", 10, 0, 18, 0, 16, 44); c.restore();
    const y = 16 + ((t * 2.2) % 12); c.save(); c.translate(27, y); c.rotate(0.22); fish(c, A, 0, 9, 0.42); c.restore(); bubbles(c, t, 9, 11); paper(c, 46, 37, 13, 8, -0.15); },
  (c, A, t) => { bg(c, "#3a2a5a", "#c07a8a"); floor(c, "#2c2046"); act(c, A, "doubao", "sway", t, 18, 41, 0.38); fish(c, A, 43, 28 + Math.sin(t * 3.7) * 2.5, 0.38, true); heart(c, 31, 10, 2, "#ff8fa8"); },
  (c, A, t) => { bg(c, "#3a2a40", "#b07a50"); floor(c, "#2c2030"); ["p_claude_neutral", "p_gpt_neutral", "p_kimi"].forEach((n, k) => fr(c, A, n, 11 + k * 14, 17, 0.2));
    fr(c, A, "prop_bowl", 20, 40, 1.05); fr(c, A, `fx_steam_${fx(t, 3)}`, 20, 26, 0.7); clap(c, 40, 22, 0.25 + 0.25 * Math.sin(t * 4)); },
  (c, A, t) => { bg(c, "#2a2a52", "#6a5a8a"); floor(c, "#222244"); fr(c, A, "prop_hourglass", 14, 40, 1.4); fr(c, A, "prop_hourglass", 30, 40, 0.9); R(c, "#f3c86b", 13.5, 22 + ((t * 6) % 6), 1, 1.4);
    paper(c, 46, 24 + Math.sin(t * 1.6) * 1.2, 16, 20, 0.08); fr(c, A, "fx_question", 46, 12, 0.5); },
  (c, A, t) => { bg(c, "#1e2850", "#4a5aa0"); floor(c, "#1a2044"); act(c, A, "claude", "curtsy", t, 15, 41, 0.36);
    const pts: [number, number][] = []; for (let k = 0; k < 8; k++) { const x0 = k & 1 ? 1 : -1, y0 = k & 2 ? 1 : -1, z0 = k & 4 ? 1 : -1, an = t * 0.9, x = x0 * Math.cos(an) - z0 * Math.sin(an), z = x0 * Math.sin(an) + z0 * Math.cos(an); pts.push([42 + x * 8, 16 + y0 * 8 + z * 2.6]); }
    c.strokeStyle = "#9fe8ff"; c.lineWidth = 0.9; c.beginPath(); for (const [a, b] of [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]]) { c.moveTo(pts[a][0], pts[a][1]); c.lineTo(pts[b][0], pts[b][1]); } c.stroke();
    fr(c, A, "prop_bowl", 44, 40, 0.7); },
  (c, A, t) => { bg(c, "#0e1030", "#2a2a58"); floor(c, "#161838"); c.save(); c.globalCompositeOperation = "lighter"; tri(c, "rgba(255,214,140,0.22)", 26, 0, 34, 0, 52, 44); tri(c, "rgba(255,214,140,0.22)", 26, 0, 34, 0, 8, 44); c.restore();
    fish(c, A, 45, 27 + Math.sin(t * 2.4) * 1.4, 0.3, true, 0.9); act(c, A, "whale", "idle", t, 27, 41, 0.42); },
];

// ---------- 十九支番外MV：每支一个圆（画框 60×60） ----------
export const MV_COL = ["#f3b45a", "#f0a078", "#5fc8c0", "#ff5fa8", "#7fb0f0", "#ff8f8f", "#c890f0", "#ff6a5a", "#c8a8ff", "#f6c880", "#ff7a4a", "#ffb0d0", "#ffd9a0", "#e8d4a0", "#8fa8ff", "#ffc0d8", "#ffb8e0", "#b8e8a0", "#fff1c8"];
export const MV_MEMO: string[] = [
  "两只杯子轻轻一碰", "四块拼图拼出四张脸，最后一块正在落位", "摊开的立体书里立起一座城堡，纸船靠岸", "霓虹条纹里一颗裂开的心", "雨线斜斜落下，一把伞悬在本鲸头顶",
  "本鲸与小克之间系着一根红绳", "一张慢慢转的唱片", "红底剪纸，一封盖着心形火漆的信", "云上一圈光环，一道闪电", "沙丘尽头的海市蜃楼，一滴泪",
  "一盏冒热气的盖碗茶，两只红辣椒", "一树樱花往下落", "一支烛火", "琵琶与红油纸伞，远山淡墨", "笨鱼一级一级往上，够那颗星",
  "三只气球飘过铁塔", "一支大大的螺旋棒棒糖", "低面数的小山坡上，本鲸与笨鱼", "路灯、白山茶，和终于来了的月亮",
];
const MV_SCENES: Scene[] = [
  (c, A, t) => { bg(c, "#5a3418", "#d09040", 60, 60); R(c, "#3a2010", 0, 44, 60, 16); const k = Math.abs(Math.sin(t * 3)) * 2; cup(c, 24 - k, 44, 0.25, "#c9566a"); cup(c, 36 + k, 44, -0.25, "#f6d27a"); spark(c, A, t, 30, 30, 0.6, 1 - k / 2); bubbles(c, t, 5, 3, 60, 40); },
  (c, A, t) => { bg(c, "#3b2a55", "#e0a070", 60, 60); const cols = ["#9ec8f0", "#f2b0b6", "#f6d27a", "#a7d8b0"], ps = ["p_whale_neutral", "p_claude_neutral", "p_gpt_neutral", "p_kimi"];
    for (let k = 0; k < 4; k++) { const fl = k === 3 ? (1 - clamp(((t % 2.4) / 0.8))) * 9 : 0, x = 17 + (k % 2) * 13 + fl, y = 17 + Math.floor(k / 2) * 13 - fl; R(c, "#2a1c2a", x - 0.6, y - 0.6, 13.2, 13.2); R(c, cols[k], x, y, 12, 12); disc(c, cols[k], x + (k % 2 ? -0.5 : 12.5), y + 6, 2); fr(c, A, ps[k], x + 6, y + 11.5, 0.17); } },
  (c, _A, t) => { bg(c, "#173b4a", "#3a8f96", 60, 60); R(c, "#e9d6ae", 20, 26, 20, 20); R(c, "#f3e6c8", 16, 20, 7, 26); R(c, "#f3e6c8", 37, 20, 7, 26); tri(c, "#c9566a", 15, 20, 24, 20, 19.5, 11); tri(c, "#c9566a", 36, 20, 45, 20, 40.5, 11); tri(c, "#c9566a", 22, 26, 38, 26, 30, 16);
    R(c, "#3a2836", 27, 36, 6, 10); R(c, "#f6d27a", 19, 28, 2, 3); R(c, "#f6d27a", 39, 28, 2, 3); R(c, "#fbf3df", 6, 46, 48, 5); R(c, "#d8c8a0", 29.5, 46, 1, 5); R(c, "#8a5a3a", 5, 51, 50, 2);
    const bx = 10 + ((t * 5) % 10); tri(c, "#ffffff", bx - 4, 45, bx + 4, 45, bx, 40); R(c, "#dfe6ff", bx - 5, 45, 10, 1.4); },
  (c, _A, t) => { bg(c, "#2a0f3a", "#b0206a", 60, 60); c.save(); c.globalAlpha = 0.35; for (let k = -2; k < 8; k++) tri(c, k % 2 ? "#ff5fa8" : "#5fd8ff", k * 12 + ((t * 6) % 24), 0, k * 12 + 4 + ((t * 6) % 24), 0, k * 12 - 26 + ((t * 6) % 24), 60); c.restore();
    heart(c, 30, 28, 12 + Math.sin(t * 6) * 0.6, "#ff5fa8"); c.strokeStyle = "#2a0f3a"; c.lineWidth = 1.6; c.beginPath(); c.moveTo(30, 18); c.lineTo(27, 25); c.lineTo(33, 29); c.lineTo(29, 39); c.stroke(); },
  (c, A, t) => { bg(c, "#1a2e52", "#4a78a8", 60, 60); c.fillStyle = "rgba(210,230,255,0.7)"; const r = rng(4); for (let k = 0; k < 22; k++) { const x = r() * 70, y = (r() * 60 + t * 60) % 60; c.fillRect(x - y * 0.2, y, 0.7, 4); }
    act(c, A, "whale", "idle", t, 30, 57, 0.3); c.fillStyle = "#f2f4ff"; c.beginPath(); c.arc(30, 31, 17, PI, PI * 2); c.fill(); for (let k = 0; k < 4; k++) disc(c, "#1f3660", 17.3 + k * 8.5, 31, 4.25); R(c, "#f2f4ff", 29.4, 12, 1.2, 3); },
  (c, A, t) => { bg(c, "#3a1830", "#e08a8a", 60, 60); R(c, "#2c1226", 0, 55, 60, 5); act(c, A, "whale", "idle", t, 16, 56, 0.28); act(c, A, "claude", "idle", t, 44, 56, 0.28, true);
    c.strokeStyle = "#e0303a"; c.lineWidth = 1.1; c.beginPath(); c.moveTo(22, 44); c.quadraticCurveTo(30, 50 + Math.sin(t * 3), 38, 44); c.stroke(); disc(c, "#e0303a", 28.5, 47.6, 1.6); disc(c, "#e0303a", 31.5, 47.6, 1.6); heart(c, 30, 22 + Math.sin(t * 3), 3, "#fff0f0"); },
  (c, _A, t) => { bg(c, "#2a1a3e", "#7a4a8a", 60, 60); disc(c, "#15151f", 30, 32, 19); c.strokeStyle = "rgba(255,255,255,0.14)"; c.lineWidth = 0.6; for (const rr of [9, 12, 15, 17.5]) { c.beginPath(); c.arc(30, 32, rr, t * 2, t * 2 + PI * 0.7); c.stroke(); c.beginPath(); c.arc(30, 32, rr, t * 2 + PI, t * 2 + PI * 1.6); c.stroke(); }
    disc(c, "#e8a1a6", 30, 32, 6); disc(c, "#15151f", 30, 32, 1); const ny = 12 + Math.sin(t * 3) * 1.5; R(c, "#fff3d6", 50, ny - 8, 1, 9); R(c, "#fff3d6", 50, ny - 8, 4, 1.6); disc(c, "#fff3d6", 49, ny + 1, 1.8); },
  (c, _A, t) => { bg(c, "#a81c26", "#e04a3a", 60, 60); for (let k = 0; k < 12; k++) { const an = (k / 12) * PI * 2 + t * 0.2; disc(c, "#fff3e6", 30 + Math.cos(an) * 24, 30 + Math.sin(an) * 24, 2.2); }
    R(c, "#fff6e8", 15, 22, 30, 19); c.strokeStyle = "#d8b8a8"; c.lineWidth = 0.8; c.beginPath(); c.moveTo(15, 22); c.lineTo(30, 33); c.lineTo(45, 22); c.stroke(); heart(c, 30, 32 + Math.sin(t * 3) * 0.5, 3.2, "#c8202a"); },
  (c, A, t) => { bg(c, "#2b1d52", "#9a78d8", 60, 60); c.strokeStyle = "#ffe08a"; c.lineWidth = 1.4; c.beginPath(); c.ellipse(30, 8, 9, 2.6, 0, 0, PI * 2); c.stroke(); disc(c, "#ffffff", 22, 20, 7); disc(c, "#ffffff", 31, 17, 9); disc(c, "#ffffff", 40, 21, 6.5); R(c, "#ffffff", 20, 20, 22, 7);
    if ((t % 1.2) < 0.75) { c.fillStyle = "#ffe45a"; c.beginPath(); c.moveTo(33, 27); c.lineTo(26, 38); c.lineTo(31, 38); c.lineTo(27, 49); c.lineTo(37, 35); c.lineTo(32, 35); c.lineTo(36, 27); c.closePath(); c.fill(); }
    act(c, A, "whale", "surprise", t, 14, 58, 0.24); },
  (c, _A, t) => { bg(c, "#f0a860", "#f8dca8", 60, 60); disc(c, "rgba(255,250,230,0.9)", 40, 20, 8); c.fillStyle = "rgba(255,255,255,0.5)"; for (let k = 0; k < 4; k++) c.fillRect(24 + Math.sin(t * 2 + k) * 2, 28 + k * 2.4, 30 - k * 4, 1);
    c.fillStyle = "#cf8c4a"; c.beginPath(); c.moveTo(0, 60); c.lineTo(0, 42); c.quadraticCurveTo(18, 30, 36, 44); c.quadraticCurveTo(48, 50, 60, 40); c.lineTo(60, 60); c.fill(); c.fillStyle = "#a86a38"; c.beginPath(); c.moveTo(0, 60); c.lineTo(0, 52); c.quadraticCurveTo(26, 42, 60, 54); c.lineTo(60, 60); c.fill();
    const ty = 14 + ((t * 14) % 26); disc(c, "#6ab0f0", 16, ty, 2); tri(c, "#6ab0f0", 14.2, ty - 0.6, 17.8, ty - 0.6, 16, ty - 5); },
  (c, A, t) => { bg(c, "#5a1a14", "#c8502c", 60, 60); R(c, "#3a140e", 0, 46, 60, 14); fr(c, A, "prop_teacup", 28, 47, 1.5); fr(c, A, `fx_steam_${fx(t, 3)}`, 28, 27, 0.9);
    for (const [x, y, rot] of [[46, 22, 0.5], [50, 30, -0.3]] as [number, number, number][]) { c.save(); c.translate(x, y); c.rotate(rot + Math.sin(t * 2) * 0.1); R(c, "#e8302a", -1.5, 0, 3, 9); R(c, "#ff6a4a", -1.5, 0, 1, 9); tri(c, "#e8302a", -1.5, 9, 1.5, 9, 0, 12); R(c, "#3f8a4a", -1, -2.4, 2, 2.4); c.restore(); } },
  (c, _A, t) => { bg(c, "#2a2350", "#f0a6c0", 60, 60); R(c, "#e88fb0", 0, 54, 60, 6); R(c, "#4a2e2a", 28, 30, 4, 25); R(c, "#4a2e2a", 22, 34, 8, 2); for (const [x, y, r2] of [[20, 22, 10], [32, 16, 12], [42, 24, 10], [28, 28, 8], [14, 30, 6], [46, 32, 6]]) disc(c, "#ffb8d0", x, y, r2); for (const [x, y, r2] of [[30, 13, 6], [40, 21, 5], [19, 19, 5]]) disc(c, "#ffd6e4", x, y, r2);
    const r = rng(12); c.fillStyle = "#fff0f6"; for (let k = 0; k < 12; k++) { const x = r() * 60, y = (r() * 60 + t * 12) % 60; c.fillRect(x + Math.sin(t * 2 + k) * 3, y, 1.8, 1.2); } },
  (c, _A, t) => { bg(c, "#12101e", "#3a2c4a", 60, 60); const fl = Math.sin(t * 9) * 0.6 + Math.sin(t * 5.3) * 0.5; glow(c, 30, 24, 22, "#ffb050", 0.5); R(c, "#f3e6c8", 26.5, 30, 7, 20); R(c, "#d8c8a0", 31.5, 30, 2, 20); R(c, "#3a2836", 29.6, 26, 0.8, 4);
    c.fillStyle = "#ff9a3a"; c.beginPath(); c.ellipse(30 + fl * 0.4, 22, 3, 6 + fl, 0, 0, PI * 2); c.fill(); c.fillStyle = "#fff0b0"; c.beginPath(); c.ellipse(30 + fl * 0.3, 23.4, 1.5, 3.4, 0, 0, PI * 2); c.fill(); R(c, "#4a3a5a", 20, 50, 20, 3); },
  (c, _A, t) => { bg(c, "#d9c49a", "#efe0bc", 60, 60); tri(c, "rgba(90,90,100,0.28)", 0, 46, 22, 24, 44, 46); tri(c, "rgba(90,90,100,0.2)", 24, 46, 46, 28, 62, 46); R(c, "rgba(90,90,100,0.14)", 0, 46, 60, 14);
    c.save(); c.translate(22, 36); c.rotate(-0.3 + Math.sin(t * 2) * 0.03); R(c, "#5a2e1a", -1.5, -22, 3, 20); R(c, "#3a1c10", -3, -24, 6, 3); c.fillStyle = "#9a5a30"; c.beginPath(); c.ellipse(0, 4, 8, 11, 0, 0, PI * 2); c.fill(); c.fillStyle = "#c08a50"; c.beginPath(); c.ellipse(0, 4, 6, 9, 0, 0, PI * 2); c.fill(); c.fillStyle = "#3a1c10"; for (let k = -1; k < 2; k++) c.fillRect(k * 1.3 - 0.2, -20, 0.5, 30); c.restore();
    c.save(); c.translate(43, 25); c.rotate(0.3); R(c, "#5a3a2a", -0.6, 0, 1.2, 24); c.fillStyle = "#c8323a"; c.beginPath(); c.arc(0, 2, 13, PI, PI * 2); c.fill(); c.strokeStyle = "#8a1c24"; c.lineWidth = 0.6; for (let k = 1; k < 6; k++) { c.beginPath(); c.moveTo(0, -11); c.lineTo(-13 + k * 4.33, 2); c.stroke(); } c.restore(); },
  (c, A, t) => { bg(c, "#101a3a", "#3a4a8a", 60, 60); for (let k = 0; k < 6; k++) R(c, k % 2 ? "#5a6ab0" : "#6a7ac0", 6 + k * 8, 50 - k * 6, 60, 6); spark(c, A, t, 50, 12, 1); glow(c, 50, 6, 12, "#fff2c0", 0.5);
    const u = (t * 0.6) % 1, st = Math.floor(u * 5), hop = Math.abs(Math.sin(u * 5 * PI)) * 3; fish(c, A, 10 + st * 8, 50 - st * 6 - hop, 0.3, true); },
  (c, _A, t) => { bg(c, "#f0b8c8", "#a8d0f0", 60, 60); c.strokeStyle = "#4a4a6a"; c.lineWidth = 1.3; c.beginPath(); c.moveTo(42, 12); c.lineTo(34, 56); c.moveTo(42, 12); c.lineTo(50, 56); c.moveTo(37, 40); c.lineTo(47, 40); c.moveTo(39.4, 27); c.lineTo(44.6, 27); c.moveTo(35, 50); c.quadraticCurveTo(42, 42, 49, 50); c.stroke(); R(c, "#4a4a6a", 41.4, 6, 1.2, 7);
    ["#ff6a8a", "#ffd25a", "#6ab8ff"].forEach((col, k) => { const x = 13 + k * 7, y = 24 - k * 3 + Math.sin(t * 2 + k) * 2; c.strokeStyle = "rgba(60,60,90,0.7)"; c.lineWidth = 0.5; c.beginPath(); c.moveTo(x, y + 5); c.quadraticCurveTo(x + 2, y + 14, 20, 50); c.stroke(); disc(c, col, x, y, 5); disc(c, "rgba(255,255,255,0.6)", x - 1.6, y - 1.8, 1.2); }); },
  (c, A, t) => { bg(c, "#ffd9e6", "#b8e8ff", 60, 60); R(c, "#ffffff", 29, 34, 2.4, 24); R(c, "#e0d0e0", 30.6, 34, 0.8, 24); disc(c, "#ffffff", 30.2, 24, 16); c.strokeStyle = "#ff6aa8"; c.lineWidth = 3; c.beginPath(); for (let a = 0; a < PI * 5; a += 0.2) { const rr = 1 + a * 0.9, x = 30.2 + Math.cos(a + t * 2) * rr, y = 24 + Math.sin(a + t * 2) * rr; if (a === 0) c.moveTo(x, y); else c.lineTo(x, y); } c.stroke();
    c.strokeStyle = "#ff9ac8"; c.lineWidth = 1; c.beginPath(); c.arc(30.2, 24, 16, 0, PI * 2); c.stroke(); spark(c, A, t, 48, 14, 0.6); spark(c, A, t + 0.2, 12, 34, 0.45); },
  (c, A, t) => { bg(c, "#8fd0f0", "#e8f6d0", 60, 60); disc(c, "#fff6c0", 46, 14, 6); tri(c, "#7fc08a", -4, 60, 20, 34, 44, 60); tri(c, "#5fa878", 20, 34, 44, 60, 30, 60); tri(c, "#9fd8a0", 22, 60, 46, 40, 66, 60); tri(c, "#6fb888", 46, 40, 66, 60, 54, 60);
    act(c, A, "whale", "sway", t, 22, 54, 0.26); fish(c, A, 40, 42 + Math.sin(t * 2.6) * 1.5, 0.26, true); },
  (c, A, t) => { bg(c, "#0e1648", "#30448c", 60, 60); glow(c, 40, 17, 22, "#fff1c8", 0.5); disc(c, "#fff3d2", 40, 17, 10); disc(c, "#eddcb0", 37, 15, 2); disc(c, "#eddcb0", 43, 21, 1.5); R(c, "#1a2050", 0, 55, 60, 5);
    img(c, A.lamp, 0, 0, A.lamp.width, A.lamp.height, 13, 56, 0.26); glow(c, 13, 26, 10, "#ffc46a", 0.5); img(c, A.cBloom, 0, 0, A.cBloom.width, A.cBloom.height, 34, 56, 0.62); spark(c, A, t, 24, 12, 0.4); },
];

// ---------- 拍立得（一张 = 一天）：pin 点在上边中点 ----------
export const PW = 66, PH = 64;
const thumbCache = new Map<string, HTMLCanvasElement>();
export function polaroid(c: G, A: Assets, i: number, x: number, y: number, p: number, t: number, o: { rot?: number; lit?: number; pin?: boolean; sepia?: number; alpha?: number } = {}) {
  const lit = o.lit ?? 1, a = o.alpha ?? 1; if (a <= 0 || p <= 0) return;
  // 远景里很小的照片（宽不到四十像素）用缓存的静帧，一张只画一次
  if (p < 0.6 && (lit === 0 || lit === 1)) {
    const key = `${i}|${lit}|${o.sepia ?? 0}|${o.pin !== false}`; let cv = thumbCache.get(key);
    if (!cv) { cv = document.createElement("canvas"); cv.width = (PW + 6) * 2; cv.height = (PH + 8) * 2; polaroid(cv.getContext("2d")!, A, i, cv.width / 2, 4, 2, 0.4, { ...o, rot: 0, alpha: 1 }); thumbCache.set(key, cv); }
    c.save(); c.globalAlpha *= a; c.translate(x, y); c.rotate(o.rot ?? 0); c.imageSmoothingEnabled = true; c.drawImage(cv, (-cv.width / 4) * p, -2 * p, (cv.width / 2) * p, (cv.height / 2) * p); c.restore(); return;
  }
  const d = DAYS[i];
  c.save(); c.globalAlpha *= a; c.translate(x, y); c.rotate(o.rot ?? 0); c.scale(p, p); c.imageSmoothingEnabled = p < 2.4;
  if (o.pin !== false) { R(c, "#8a3a3a", -2, -1, 4, 4); R(c, "#d9534f", -2, -1, 4, 2); }
  c.translate(-PW / 2, 1.5);
  R(c, "rgba(0,0,0,0.32)", 2, 2, PW, PH); R(c, "#f7efd9", 0, 0, PW, PH); R(c, "#e4d7b6", 0, PH - 1.2, PW, 1.2);
  c.save(); c.beginPath(); c.rect(3, 3, 60, 44); c.clip(); c.translate(3, 3);
  DAY_SCENES[i](c, A, t);
  if (o.sepia) R(c, `rgba(150,105,60,${o.sepia})`, 0, 0, 60, 44);
  if (lit < 1) R(c, `rgba(14,16,44,${0.74 * (1 - lit)})`, 0, 0, 60, 44);
  c.restore();
  label(c, dayName(d.n), 4, 52.4, 7, "#3a2836", "left", 30); label(c, dateName(d.date), PW - 4, 52.8, 4.6, "#8a6f6a", "right", 28);
  label(c, d.title, PW / 2, 59.4, 4.4, "#6a5260", "center", 60);
  if (lit < 1) R(c, `rgba(14,16,44,${0.5 * (1 - lit)})`, 0, 0, PW, PH);
  c.restore();
}
export const litOf = (i: number, T: number) => (T >= LAMP_ON[i] ? 1 : 0);

// ---------- 回忆泡泡（一个 = 一支MV） ----------
export function mvBubble(c: G, A: Assets, i: number, x: number, y: number, r: number, t: number, a = 1, title = false) {
  if (a <= 0 || r <= 1) return;
  const s = r / 30;
  c.save(); c.globalAlpha *= a;
  glow(c, x, y, r * 1.55, MV_COL[i], 0.24);
  c.save(); c.beginPath(); c.arc(x, y, r, 0, PI * 2); c.clip(); c.translate(x - r, y - r); c.scale(s, s); c.imageSmoothingEnabled = s < 2.4;
  MV_SCENES[i](c, A, t); c.restore();
  c.lineCap = "round"; c.strokeStyle = "rgba(255,255,255,0.88)"; c.lineWidth = Math.max(1.5, r * 0.06); c.beginPath(); c.arc(x, y, r, 0, PI * 2); c.stroke();
  c.strokeStyle = "rgba(255,255,255,0.5)"; c.lineWidth = Math.max(1, r * 0.07); c.beginPath(); c.arc(x, y, r * 0.8, PI * 1.12, PI * 1.42); c.stroke();
  if (title) {
    const m = MVS[i], fs = Math.max(13, r * 0.26); c.font = `${fs}px ${FONT}`; const w = c.measureText(`《${m.title}》`).width + fs * 1.2, hh = fs * 2.6;
    R(c, "rgba(10,12,38,0.78)", x - w / 2, y + r + 8, w, hh); R(c, MV_COL[i], x - w / 2, y + r + 8, w, 3);
    label(c, `《${m.title}》`, x, y + r + 8 + hh * 0.36, fs, "#fff3d6"); label(c, dateName(m.date), x, y + r + 8 + hh * 0.76, fs * 0.72, "rgba(255,243,214,0.75)");
  }
  c.restore();
}

// ---------- 月相：k 从零（新月）到一（满月） ----------
export function phaseMoon(c: G, x: number, y: number, r: number, k: number, a = 1) {
  if (a <= 0) return; c.save(); c.globalAlpha *= a;
  disc(c, "rgba(70,80,140,0.6)", x, y, r);
  if (k > 0.01) { c.fillStyle = "#fff3d2"; c.beginPath(); if (k >= 0.99) c.arc(x, y, r, 0, PI * 2); else { c.arc(x, y, r, -PI / 2, PI / 2); c.ellipse(x, y, r * Math.abs(1 - 2 * k), r, 0, PI / 2, -PI / 2, k < 0.5); } c.fill(); }
  c.restore();
}
// 三十格月相围成一圈：第 i 格 = 第 i 天；n 是已经点亮到第几格（可为小数）
export function moonDial(c: G, cx: number, cy: number, RR: number, r: number, n: number, a = 1, dim = 0.22) {
  if (a <= 0) return;
  for (let i = 0; i < 30; i++) {
    const an = -PI / 2 + (i / 30) * PI * 2, x = cx + Math.cos(an) * RR, y = cy + Math.sin(an) * RR, on = clamp(n - i);
    const pop = on > 0 && on < 1 ? 1 + 0.5 * Math.sin(on * PI) : 1;
    if (on > 0) glow(c, x, y, r * 2.6, "#fff1c8", 0.3 * on * a);
    phaseMoon(c, x, y, r * pop, (i + 1) / 31, a * lerp(dim, 1, on));
  }
}

// ---------- 日历页：第 idx 天（零到三十） ----------
export const dateOf = (i: number): [number, number] => (i < 8 ? [10, 24 + i] : [11, i - 7]);
export function calPage(c: G, x: number, y: number, s: number, idx: number, rot = 0, a = 1) {
  if (a <= 0) return; const [m, d] = dateOf(idx), ds = cn(d);
  c.save(); c.globalAlpha *= a; c.translate(x, y); c.rotate(rot); c.scale(s, s);
  R(c, "rgba(0,0,0,0.3)", -13, -15, 28, 34); R(c, "#fbf3df", -14, -16, 28, 34); R(c, idx === 30 ? "#e0a030" : "#d9534f", -14, -16, 28, 8.5); R(c, "#3a2836", -8, -18, 1.6, 4); R(c, "#3a2836", 6.4, -18, 1.6, 4);
  label(c, `${cn(m)}月`, 0, -11.4, 6, "#fff"); label(c, ds, 0, 2.6, ds.length === 1 ? 14 : ds.length === 2 ? 11 : 8.2, "#3a2836"); label(c, dayName(idx), 0, 13.2, 4.4, "#8a6f6a");
  c.restore();
}
// 被风吹走的日历页
export function calendarWind(c: G, T: number, t0: number, n: number, a = 1) {
  const r = rng(303);
  for (let k = 0; k < n; k++) {
    const idx = Math.floor((k / n) * 30), v = 520 + r() * 420, y0 = 150 + r() * 380, ph = r() * 6.28, delay = r() * 0.5, s = 1.5 + r() * 1.1, lt = T - t0 - delay;
    if (lt < 0) continue;
    const x = -80 + lt * v; if (x > W + 100) continue;
    calPage(c, x, y0 + Math.sin(lt * 5 + ph) * 34 - lt * 40, s, idx, Math.sin(lt * 6 + ph) * 0.7 + lt * 1.4, a);
  }
}

// ---------- 胶片条：十七格连着走 ----------
export function filmStrip(c: G, A: Assets, t: number, y: number, p: number, scroll: number, a: number) {
  if (a <= 0) return; const fw = 66 * p, bh = 58 * p;
  c.save(); c.globalAlpha *= a; R(c, "#0b0a14", 0, y, W, bh);
  for (let x = -((scroll * 1) % (8 * p)); x < W; x += 8 * p) { R(c, "#d8cfb8", x, y + 1.6 * p, 4 * p, 3 * p); R(c, "#d8cfb8", x, y + bh - 4.6 * p, 4 * p, 3 * p); }
  for (let i = 0; i < DAYS.length; i++) {
    const x = 40 + i * fw - scroll; if (x > W || x + fw < 0) continue;
    c.save(); c.beginPath(); c.rect(x, y + 7 * p, 60 * p, 44 * p); c.clip(); c.translate(x, y + 7 * p); c.scale(p, p); c.imageSmoothingEnabled = p < 2.4; DAY_SCENES[i](c, A, t + i); R(c, "rgba(150,105,60,0.34)", 0, 0, 60, 44); c.restore();
  }
  c.restore();
}

// ---------- 风铃（晨风没来时一动不动） ----------
export function chime(c: G, x: number, y: number, p: number, swing: number) {
  c.save(); c.translate(x, y); R(c, "#2a1c22", -p / 2, 0, p, 6 * p); c.translate(0, 6 * p); c.rotate(swing * 0.5);
  c.fillStyle = "rgba(190,230,255,0.55)"; c.beginPath(); c.arc(0, 7 * p, 7 * p, PI, PI * 2); c.fill(); c.strokeStyle = "rgba(240,250,255,0.9)"; c.lineWidth = p * 0.7; c.beginPath(); c.arc(0, 7 * p, 7 * p, PI, PI * 2); c.stroke();
  R(c, "#e8a1a6", -3 * p, 4 * p, 2 * p, 2 * p); R(c, "#9ec8f0", 2 * p, 3 * p, 2 * p, 2 * p);
  c.translate(0, 7 * p); c.rotate(swing); R(c, "#2a1c22", -p / 4, 0, p / 2, 9 * p); R(c, "#f3c86b", -p, 3 * p, 2 * p, 2 * p);
  R(c, "#fbf3df", -3 * p, 9 * p, 6 * p, 16 * p); R(c, "#d9534f", -3 * p, 9 * p, 6 * p, 1.4 * p); label(c, "满", 0, 14.5 * p, 4.6 * p, "#3a2836"); label(c, "月", 0, 20.5 * p, 4.6 * p, "#3a2836");
  c.restore();
}

// ---------- 照片绳：十七张拍立得挂成一排，风越大摆得越开 ----------
export function photoString(c: G, A: Assets, T: number, x0: number, y0: number, x1: number, y1: number, sag: number, p: number, wind: number, idxs?: number[]) {
  const ids = idxs ?? DAYS.map((_, i) => i), n = ids.length, sw = Math.sin(T * 1.7) * sag * 0.12 * wind;
  const mx = (x0 + x1) / 2 + sw * 2, my = (y0 + y1) / 2 + sag * 2 + sw;
  c.strokeStyle = "#1a1228"; c.lineWidth = Math.max(1.5, p * 1.4); c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(mx, my, x1, y1); c.stroke();
  ids.forEach((id, k) => {
    const u = (k + 0.5) / n, x = (1 - u) * (1 - u) * x0 + 2 * u * (1 - u) * mx + u * u * x1, y = (1 - u) * (1 - u) * y0 + 2 * u * (1 - u) * my + u * u * y1;
    polaroid(c, A, id, x, y, p, T + k, { rot: Math.sin(T * (2.2 + wind) + k * 1.3) * (0.05 + 0.12 * wind) + 0.1 * wind, lit: litOf(id, T), sepia: 0.14 });
  });
}

// ---------- 跳房子：粉笔画的三十一格，第零天到第三十天 ----------
export function hopscotch(c: G, T: number, scroll: number, a: number, waves: number[]) {
  c.save(); c.globalAlpha *= a; c.translate(0, -scroll); c.lineWidth = 3; c.lineJoin = "round";
  for (let i = 0; i <= 30; i++) {
    const row = Math.floor(i / 11), col = i % 11, x = row % 2 ? 1180 - col * 108 : 100 + col * 108, y = 252 + row * 150, r0 = rng(500 + i), jx = (r0() - 0.5) * 10, jy = (r0() - 0.5) * 16, rot = (r0() - 0.5) * 0.12;
    const wv = waves[row] ?? 0, hi = 1 - clamp((T - wv) / 0.5), on = T >= wv ? 1 : 0.35;
    c.save(); c.translate(x + jx, y + jy); c.rotate(rot);
    if (hi > 0) glow(c, 0, 0, 80, "#fff1c8", 0.35 * hi);
    c.strokeStyle = `rgba(255,250,235,${(i === 30 ? 0.95 : 0.6) * on})`; c.setLineDash([14, 3, 9, 2]);
    if (i === 30) { c.beginPath(); c.arc(0, 0, 50, 0, PI * 2); c.stroke(); } else c.strokeRect(-46, -52, 92, 104);
    c.setLineDash([]); const s = cn(i);
    label(c, s, 0, 2, s.length === 1 ? 54 : s.length === 2 ? 40 : 30, `rgba(255,250,235,${(i === 30 ? 1 : 0.72) * on})`);
    c.restore();
  }
  c.restore();
}

// ---------- 飘上天的回忆：拍立得与泡泡排在两侧，慢慢往上 ----------
export function lanterns(c: G, A: Assets, T: number, t0: number, a: number) {
  const r = rng(808);
  for (let side = 0; side < 2; side++) for (let k = 0; k < 18; k++) {
    const colN = k % 4, rowN = Math.floor(k / 4), isDay = k % 2 === 0, idx = side === 0 ? Math.floor(k / 2) : 9 + Math.floor(k / 2);
    if (isDay && idx > 16) continue;
    const x = (side ? 890 : 50) + colN * 96 + r() * 30 + (rowN % 2) * 30, y0 = 120 + rowN * 104 + r() * 30, ph = r() * 6.28, born = t0 + r() * 2.0;
    const al = a * sstep(born, born + 0.6, T), y = y0 - (T - t0) * 7 + Math.sin(T * 1.1 + ph) * 6;
    if (al <= 0) continue;
    if (isDay) polaroid(c, A, idx, x, y - 30, 0.92, T + k, { rot: Math.sin(T * 0.9 + ph) * 0.07, pin: false, alpha: al * 0.95, sepia: 0.1 });
    else mvBubble(c, A, idx, x, y, 25, T + k, al * 0.95);
  }
}

// ---------- 胶片颗粒与漏光 ----------
let noise: HTMLCanvasElement | null = null;
export function grain(c: G, T: number, a = 0.1) {
  if (!noise) { noise = document.createElement("canvas"); noise.width = noise.height = 256; const g = noise.getContext("2d")!, d = g.createImageData(256, 256), r = rng(999); for (let i = 0; i < d.data.length; i += 4) { const v = r() < 0.5 ? 0 : 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = Math.floor(r() * 110); } g.putImageData(d, 0, 0); }
  const fi = Math.floor(T * 12), ox = (((fi * 97) % 256) + 256) % 256, oy = (((fi * 57) % 256) + 256) % 256;
  c.save(); c.imageSmoothingEnabled = false; c.globalAlpha = a; c.globalCompositeOperation = "overlay";
  for (let y = -oy * 2; y < H; y += 512) for (let x = -ox * 2; x < W; x += 512) c.drawImage(noise, x, y, 512, 512);
  c.restore();
  glow(c, 0, 0, 560, "#ff9a5a", 0.07 + 0.03 * Math.sin(T * 0.7)); glow(c, W, H, 480, "#ffb070", 0.05 + 0.02 * Math.sin(T * 0.5 + 2));
}

// 招牌道具（人物设定里各人能拍的实物）
export const SIGN: Record<string, string> = { whale: "prop_bowl", claude: "prop_teacup", doubao: "prop_basket", gpt: "prop_hourglass", kimi: "prop_scroll", zai: "prop_abacus", qwen: "prop_fan", gemini: "prop_brush" };
export const SIGN_NAME: Record<string, string> = { whale: "蓝饭盆", claude: "茶杯", doubao: "篮子", gpt: "沙漏", kimi: "卷轴", zai: "算盘", qwen: "扇子", gemini: "画笔", benyu: "装白饭的小碗" };
export const popIn = (T: number, t0: number, d = 0.3) => (T < t0 ? 0 : backOut((T - t0) / d));
