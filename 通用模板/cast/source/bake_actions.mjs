#!/usr/bin/env node
// 派生动作烘焙：从八位角色已有的像素格派生新动作（act_*）、道具（prop_*）、表情贴（fx_*）。
//
//   npm run actions                    → 重写 cast/source/actions_data.js、engine/assets/cast_actions.json，
//                                        并把新格子追加进 engine/assets/cast_atlas.json（原有 121 格坐标一格不动）
//   npm run actions -- --gif <目录>     → 另外把每个动作出一张 GIF 预览（×3 放大，带表情贴）+ manifest.json
//   之后 npm run atlas 重烘 cast_atlas.png。
//
// 规矩（AGENTS.md「画面红线」）：不新增生图、不换画风。这里没有任何外部图片：
//   动作 = 对原格做形变（motion_core.mjs，只搬像素、不新增颜色）；
//   道具 / 表情贴 = 几何笔画 + 自动墨线（pixel_things.mjs），颜色只取 px.js 调色板。
// 动作名与道具清单取自 番外MV/人物设定.md 第 2 节（习性 / 道具 / MV 用法）。
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { T, pose, landmarks, stamp, blank, despeckle, encodeRLE, bbox } from './motion_core.mjs';
import { makeThings } from './pixel_things.mjs';
import { encodeGif } from './gif.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const imp = (f) => import(pathToFileURL(path.join(HERE, f)).href);
const { RGB } = await imp('px.js');
const { getBakedSprite } = await imp('sprites_data.js');
await imp('walk_cycle_data.js');

const ASSETS = path.join(HERE, '../../engine/assets');
const META_PATH = path.join(ASSETS, 'cast_atlas.json');
const ACTIONS_JSON = path.join(ASSETS, 'cast_actions.json');
const DATA_OUT = path.join(HERE, 'actions_data.js');

const hex = (i) => '#' + RGB[i].map((v) => v.toString(16).padStart(2, '0')).join('');
const IDX = new Map(); RGB.forEach((_, i) => { if (i !== T && !IDX.has(hex(i))) IDX.set(hex(i), i); });
const H = (h) => { const v = IDX.get(h); if (v == null) throw new Error('调色板里没有 ' + h); return v; };
if (RGB.length > 254) throw new Error('调色板超过 254 色，RLE 编码会与 254 号冲突');

const spr = (k) => { const s = getBakedSprite(k); if (!s) throw new Error(`精灵数据里没有「${k}」`); return s; };

// ---------------- 九位角色：用到的原格与身体比例 ----------------
const CHARS = {
  whale:  { name: '本鲸', front: 'whale_idle', blink: 'whale_blink', wave: 'whale_wave', point: 'whale_point', ratio: { neck: 0.47, hip: 0.72 } },
  gpt:    { name: '龙娘', front: 'gpt_boss_idle', blink: 'gpt_boss_blink', rage: 'gpt_boss_rage', cast: ['gpt_boss_cast0', 'gpt_boss_cast1'], fly: ['gpt_fly_0', 'gpt_fly_1'], ratio: { neck: 0.36, hip: 0.6 } },
  claude: { name: '小克', front: 'claude_front_0', blink: 'claude_front_1', side: 'claude_side_0', petri: 'claude_petri', ratio: { neck: 0.45, hip: 0.7 } },
  doubao: { name: '豆包', front: 'doubao_cage_0', blink: 'doubao_cage_1', ratio: { neck: 0.33, hip: 0.62 } },
  gemini: { name: '猫', front: 'gemini_front_0', blink: 'gemini_front_1', side: 'gemini_side_0', ratio: { neck: 0.44, hip: 0.68 } },
  kimi:   { name: 'Kimi', front: 'kimi_front_0', blink: 'kimi_front_1', side: 'kimi_side_0', ratio: { neck: 0.4, hip: 0.66 } },
  qwen:   { name: '千问', front: 'qwen_front_0', blink: 'qwen_front_1', side: 'qwen_side_0', ratio: { neck: 0.4, hip: 0.66 } },
  zai:    { name: '狐狸', front: 'zai_front_0', blink: 'zai_front_1', side: 'zai_side_0', ratio: { neck: 0.44, hip: 0.68 } },
};

// ---------------- 动作库 ----------------
// 每个动作：label 中文名 / fps / loop / fx 推荐表情贴 / padX padTop 留白 / frames(c) → [{k: 原格, ...姿态}]
const S = Math.sin, PI2 = Math.PI * 2;
const rep = (n, f) => Array.from({ length: n }, (_, i) => f(i, i / n));
const LIB = {
  idle:     { label: '呼吸待机', fps: 8, loop: true, padX: 3, padTop: 2,
    frames: (c) => [0, 0, 1, 2, 2, 1, 0, 0].map((v, i) => ({ k: i === 5 ? c.blink : c.front, headDy: v * 0.6, bow: v * 0.008, sy: 1 - v * 0.004 })) },
  nod:      { label: '点头', fps: 10, loop: false, padX: 3, padTop: 2,
    frames: (c) => [0, 1.6, 3, 2, 0.6, 0].map((v) => ({ k: v > 2.5 ? c.blink : c.front, headDy: v, bow: v * 0.012 })) },
  shake:    { label: '摇头', fps: 12, loop: false, padX: 6, padTop: 2,
    frames: (c) => [0, -2, -3, -1, 1.5, 3, 2, 0].map((v) => ({ k: c.front, headDx: v, head: -v * 0.012 })) },
  tilt:     { label: '歪头（疑问）', fps: 8, loop: false, fx: 'fx_question', padX: 8, padTop: 4,
    frames: (c) => [0, 0.06, 0.12, 0.16, 0.18, 0.18].map((v, i) => ({ k: i === 3 ? c.blink : c.front, head: v, sway: v * 6 })) },
  think:    { label: '想事情', fps: 6, loop: true, fx: 'fx_bulb', padX: 8, padTop: 4,
    frames: (c) => rep(8, (i, t) => ({ k: i === 6 ? c.blink : c.front, head: -0.1 - 0.03 * S(t * PI2), headDy: -0.5 + S(t * PI2) * 0.8, sway: -2 })) },
  bow:      { label: '鞠躬', fps: 10, loop: false, padX: 3, padTop: 2,
    frames: (c) => [0, 0.06, 0.12, 0.17, 0.2, 0.2, 0.12, 0.04].map((v) => ({ k: v > 0.15 ? c.blink : c.front, bow: v * 1.6, headDy: v * 4 })) },
  curtsy:   { label: '提裙行礼', fps: 10, loop: false, padX: 4, padTop: 2,
    frames: (c) => [0, 0.05, 0.1, 0.14, 0.14, 0.1, 0.04, 0].map((v) => ({ k: v > 0.1 ? c.blink : c.front, bow: v * 1.5, headDy: v * 3, sy: 1 - v * 0.35, sx: 1 + v * 0.15 })) },
  hop:      { label: '开心跳', fps: 12, loop: true, fx: 'fx_sparkle', padX: 5, padTop: 16,
    frames: (c) => [
      { sy: 0.9, sx: 1.06 }, { sy: 1.07, sx: 0.96, dy: -4 }, { dy: -11, sy: 1.03 }, { dy: -15, k: c.blink }, { dy: -12 }, { dy: -5, sy: 1.04, sx: 0.97 }, { sy: 0.9, sx: 1.07 }, { sy: 0.97, sx: 1.02 },
    ].map((p) => ({ k: c.front, ...p })) },
  sway:     { label: '摇摆舞', fps: 8, loop: true, padX: 8, padTop: 3,
    frames: (c) => rep(8, (i, t) => ({ k: c.front, sway: 5 * S(t * PI2), head: -0.07 * S(t * PI2), sy: 1 - 0.02 * Math.abs(S(t * PI2 * 2)) })) },
  step:     { label: '踩拍', fps: 8, loop: true, padX: 7, padTop: 6,
    frames: (c) => rep(8, (i, t) => { const beat = i % 4 === 0; return { k: c.front, sy: beat ? 0.92 : 1.02, sx: beat ? 1.05 : 0.99, dy: beat ? 0 : -Math.round(3 * S((i % 4) / 4 * Math.PI)), lean: (i < 4 ? 0.06 : -0.06), head: (i < 4 ? -0.04 : 0.04) }; }) },
  shiver:   { label: '发抖', fps: 16, loop: true, fx: 'fx_sweat', padX: 4, padTop: 2,
    frames: (c) => [1, -1, 1, -1].map((v, i) => ({ k: c.front, dx: v * 0.6, sway: -v * 1.2, sy: 0.97, sx: 1.01, headDy: 1 + (i % 2) * 0.4 })) },
  surprise: { label: '吃惊', fps: 12, loop: false, fx: 'fx_exclaim', padX: 4, padTop: 10,
    frames: (c) => [{ sy: 0.93, sx: 1.04 }, { sy: 1.1, sx: 0.95, dy: -4 }, { sy: 1.07, dy: -2 }, { sy: 1.04, dy: -1 }, { sy: 1.03 }, { sy: 1.03 }].map((p) => ({ k: c.front, ...p })) },
  sad:      { label: '低落', fps: 6, loop: false, fx: 'fx_gloom', padX: 4, padTop: 2,
    frames: (c) => [0, 0.3, 0.6, 0.85, 1, 1].map((v, i) => ({ k: i >= 4 ? c.blink : c.front, headDy: v * 3, bow: v * 0.05, sy: 1 - v * 0.02, head: v * 0.05 })) },
  spin:     { label: '转圈', fps: 12, loop: true, padX: 2, padTop: 2,
    frames: (c) => c.side
      ? [{ k: c.front }, { k: c.front, sx: 0.62 }, { k: c.side }, { k: c.side, sx: 0.72 }, { k: c.side, sx: 0.72, flip: true }, { k: c.side, flip: true }, { k: c.front, sx: 0.62, flip: true }, { k: c.front }]
      : [1, 0.66, 0.34, 0.66, 1, 0.66, 0.34, 0.66].map((v, i) => ({ k: c.front, sx: v, flip: i >= 3 && i <= 6 })) },
  lookaround: { label: '左右张望', fps: 6, loop: true, padX: 3, padTop: 2,
    frames: (c) => [{ k: c.front }, { k: c.side }, { k: c.side, head: -0.04 }, { k: c.front }, { k: c.side, flip: true }, { k: c.side, flip: true, head: 0.04 }, { k: c.front }, { k: c.blink }] },
  // —— 专属动作 ——
  wave:     { label: '挥手打招呼', fps: 8, loop: true, padX: 5, padTop: 3,
    frames: (c) => [{ k: c.front }, { k: c.wave }, { k: c.wave, head: 0.05, sway: 1 }, { k: c.wave, head: 0.08, sway: 2 }, { k: c.wave, head: 0.05, sway: 1 }, { k: c.wave }, { k: c.wave, head: -0.03, sway: -1 }, { k: c.wave }] },
  point:    { label: '递出去（让位）', fps: 8, loop: false, padX: 8, padTop: 2,
    frames: (c) => [{ k: c.front }, { k: c.front, lean: 0.03 }, { k: c.point, lean: 0.06 }, { k: c.point, lean: 0.08, headDy: 1 }, { k: c.point, lean: 0.08, headDy: 1 }, { k: c.point, lean: 0.05 }] },
  eat:      { label: '干饭', fps: 12, loop: true, fx: 'fx_steam', padX: 3, padTop: 2,
    frames: (c) => [0, 3, 1, 3, 0, 3, 1, 0].map((v) => ({ k: v >= 3 ? c.blink : c.front, headDy: v, bow: v * 0.012, sy: 1 - v * 0.006 })) },
  float:    { label: '悬浮待机', fps: 8, loop: true, padX: 3, padTop: 8,
    frames: (c) => rep(8, (i, t) => ({ k: i === 5 ? c.blink : c.front, dy: -4 - 3 * S(t * PI2), sway: 1.5 * S(t * PI2 + 1) })) },
  hover:    { label: '振翅飞行', fps: 8, loop: true, padX: 3, padTop: 8,
    frames: (c) => rep(8, (i, t) => ({ k: c.fly[i % 2], dy: -3 - 3 * S(t * PI2), head: 0.03 * S(t * PI2) })) },
  cast:     { label: '施法', fps: 10, loop: true, fx: 'fx_sparkle', padX: 4, padTop: 6,
    // 只用 cast0：原图 cast1 的小腿是坏的（白色硬块），不拿它当关键帧
    frames: (c) => rep(8, (i, t) => ({ k: c.cast[0], dy: -Math.round(2.5 * Math.abs(S(t * PI2))), sy: 1 + 0.02 * S(t * PI2 * 2), lean: 0.03 * S(t * PI2), head: -0.02 * S(t * PI2) })) },
  rage:     { label: '生气', fps: 14, loop: true, fx: 'fx_anger', padX: 5, padTop: 4,
    frames: (c) => [2, -2, 1.5, -1.5, 2, -2].map((v) => ({ k: c.rage, dx: v * 0.7, sy: 1.03, sway: v * 0.8 })) },
  petri:    { label: '石化', fps: 8, loop: false, fx: 'fx_sweat', padX: 4, padTop: 2,
    frames: (c) => [{ k: c.front }, { k: c.front, dx: 1 }, { k: c.front, dx: -1 }, { k: c.petri, sy: 1.02 }, { k: c.petri }, { k: c.petri }] },
  read:     { label: '低头看书', fps: 5, loop: true, fx: 'fx_sparkle', padX: 3, padTop: 2,
    frames: (c) => [2, 2.4, 2.8, 2.4, 2, 2].map((v, i) => ({ k: i === 3 ? c.blink : c.front, headDy: v, bow: 0.03, head: 0.04 })) },
  choose:   { label: '两边想想再选', fps: 7, loop: false, fx: 'fx_bulb', padX: 8, padTop: 3,
    frames: (c) => [0, 0.08, 0.14, 0.14, 0.06, -0.06, -0.14, -0.14, -0.06, 0].map((v, i) => ({ k: i === 9 ? c.blink : c.front, head: v, sway: v * 14, headDy: i === 9 ? 2 : 0 })) },
  doze:     { label: '打盹', fps: 4, loop: true, fx: 'fx_zzz', padX: 5, padTop: 2,
    frames: (c) => [0.5, 1.2, 2, 2.8, 3.4, 3.6, 1, 0.5].map((v) => ({ k: c.blink, headDy: v, head: v * 0.03, bow: v * 0.01 })) },
  alert:    { label: '惊醒竖耳', fps: 12, loop: false, fx: 'fx_exclaim', padX: 3, padTop: 10,
    frames: (c) => [{ k: c.blink, headDy: 3 }, { k: c.blink, headDy: 2 }, { k: c.front, sy: 1.09, dy: -3 }, { k: c.front, sy: 1.05, dy: -1 }, { k: c.front, sy: 1.03 }, { k: c.front, sy: 1.02 }] },
  scoff:    { label: '挑眉锐评', fps: 8, loop: false, fx: 'fx_shine', padX: 7, padTop: 3,
    frames: (c) => [0, -0.04, -0.08, -0.1, -0.1, -0.1].map((v, i) => ({ k: i === 1 ? c.blink : c.front, head: v, sway: v * 22, headDx: v * 10 })) },
};

const ROSTER = {
  whale:  ['idle', 'wave', 'point', 'eat', 'hop', 'nod', 'shake', 'bow', 'sway', 'surprise', 'sad', 'spin', 'shiver'],
  gpt:    ['float', 'hover', 'cast', 'rage', 'nod', 'tilt', 'bow', 'surprise', 'shake'],
  claude: ['idle', 'curtsy', 'read', 'tilt', 'nod', 'shake', 'petri', 'lookaround', 'sad', 'hop'],
  doubao: ['idle', 'step', 'sway', 'hop', 'nod', 'bow', 'tilt', 'surprise', 'spin'],
  gemini: ['idle', 'lookaround', 'choose', 'hop', 'sway', 'spin', 'nod', 'surprise', 'tilt'],
  kimi:   ['idle', 'think', 'nod', 'bow', 'lookaround', 'shake', 'sad', 'hop'],
  qwen:   ['idle', 'spin', 'bow', 'sway', 'nod', 'tilt', 'hop', 'shake'],
  zai:    ['idle', 'doze', 'alert', 'nod', 'shake', 'tilt', 'hop', 'lookaround'],
};
// 每位的推荐道具（人物设定.md 第 2 节「道具」）
const PROPS_OF = {
  whale: ['prop_bowl', 'prop_basket'], gpt: ['prop_hourglass'], claude: ['prop_teacup', 'prop_book', 'prop_hourglass'],
  doubao: ['prop_basket', 'prop_redshoes'], gemini: ['prop_catclock', 'prop_brush'], kimi: ['prop_scroll'],
  qwen: ['prop_fan', 'prop_teacup'], zai: ['prop_abacus', 'prop_eyemask'],
};

// ---------------- 烘焙 ----------------
const cells = {};      // key -> Spr
const actions = {};    // id -> name -> meta
const gifJobs = [];

for (const [id, c] of Object.entries(CHARS)) {
  actions[id] = {};
  const base = spr(c.front);
  const L0 = landmarks(base, c.ratio);
  for (const name of ROSTER[id]) {
    const A = LIB[name];
    const list = A.frames(c);
    const srcs = list.map((f) => spr(f.k));
    const maxW = Math.max(...srcs.map((s) => s.w)), maxH = Math.max(...srcs.map((s) => s.h));
    const CW = maxW + 2 * A.padX, CH = maxH + A.padTop;
    const keys = [];
    list.forEach((f, i) => {
      const s = srcs[i];
      // 换了原格（侧身、施法…）就重新量一次身体基准点，但脖子 / 胯的高度沿用正面格，免得头一跳一跳
      const L = f.k === c.front ? L0 : { ...landmarks(s, c.ratio), neckY: L0.neckY - (base.h - s.h), hipY: L0.hipY - (base.h - s.h) };
      const cell = { w: CW, h: CH, ox: Math.round(CW / 2 - L.cx), oy: CH - s.h };
      let out = pose(s, L, f, cell);
      out = despeckle(out);
      const key = `act_${id}_${name}_${i}`;
      cells[key] = out; keys.push(key);
    });
    actions[id][name] = { label: A.label, fps: A.fps, loop: A.loop, frames: keys, fx: A.fx ?? null, size: [CW, CH] };
    gifJobs.push({ id, name, keys, A });
  }
}

const THINGS = makeThings(H);
for (const [k, s] of Object.entries(THINGS)) cells[k] = s;

// ---------------- 写 actions_data.js ----------------
const lines = Object.entries(cells).map(([k, s]) => `  ${k}: [${s.w}, ${s.h}, '${Buffer.from(encodeRLE(s.d)).toString('base64')}'],`);
fs.writeFileSync(DATA_OUT, `// Generated by cast/source/bake_actions.mjs —— 不要手改；要改动作就改 bake_actions.mjs 再跑。
// 派生动作（act_*）：只对原格做形变（motion_core.mjs），每个像素都是原图里已有的调色板号。
// 道具（prop_*）与表情贴（fx_*）：几何笔画 + 自动墨线，颜色只取 px.js 调色板。
import { RAW_SPRITES } from './sprites_data.js';

Object.assign(RAW_SPRITES, {
${lines.join('\n')}
});
`);

// ---------------- 写 cast_actions.json ----------------
const fxSeq = {};
for (const k of Object.keys(THINGS)) if (k.startsWith('fx_')) { const m = /^(fx_[a-z]+)(?:_(\d+))?$/.exec(k); (fxSeq[m[1]] ??= []).push(k); }
fs.writeFileSync(ACTIONS_JSON, JSON.stringify({
  note: '由 cast/source/bake_actions.mjs 生成，不要手改。actions[角色][动作] = { label, fps, loop, frames, fx, size }',
  actions, props: Object.keys(THINGS).filter((k) => k.startsWith('prop_')), propsOf: PROPS_OF, fx: fxSeq,
}, null, 1) + '\n');

// ---------------- 追加进 cast_atlas.json（天际线装箱；原有格子不动） ----------------
const meta = JSON.parse(fs.readFileSync(META_PATH, 'utf8'));
const NEW = /^(act_|prop_|fx_)/;
const keep = Object.fromEntries(Object.entries(meta.s).filter(([k]) => !NEW.test(k)));
const AW = 2048, GAP = 2;
const sky = new Int32Array(AW);
for (const [x0, y0, w, h] of Object.values(keep)) for (let x = Math.max(0, x0 - GAP); x < Math.min(AW, x0 + w + GAP); x++) sky[x] = Math.max(sky[x], y0 + h + GAP);
const order = Object.entries(cells).sort((a, b) => b[1].h - a[1].h || b[1].w - a[1].w);
const placed = {};
for (const [k, s] of order) {
  const w = s.w + GAP; let best = -1, bestY = 1e9;
  for (let x = GAP; x + w <= AW; x++) {
    let y = 0; for (let i = x; i < x + w; i++) if (sky[i] > y) y = sky[i];
    if (y < bestY) { bestY = y; best = x; }
  }
  placed[k] = [best, bestY, s.w, s.h];
  for (let i = best; i < best + w; i++) sky[i] = bestY + s.h + GAP;
}
const AH = Math.max(...sky) + GAP;
const ordered = { ...keep };
for (const k of Object.keys(cells)) ordered[k] = placed[k];
const json = '{\n  "w": ' + AW + ',\n  "h": ' + AH + ',\n  "s": {\n' + Object.entries(ordered).map(([k, r]) => `    "${k}": [${r.join(', ')}]`).join(',\n') + '\n  }\n}\n';
fs.writeFileSync(META_PATH, json);

const nAct = Object.values(actions).reduce((n, a) => n + Object.keys(a).length, 0);
console.log(`派生动作 ${nAct} 个 / ${Object.keys(cells).filter((k) => k.startsWith('act_')).length} 格；道具 ${Object.keys(THINGS).filter((k) => k.startsWith('prop_')).length} 件；表情贴 ${Object.keys(THINGS).filter((k) => k.startsWith('fx_')).length} 格`);
console.log(`cast_atlas.json：${Object.keys(ordered).length} 格，${AW}×${AH}（原有 ${Object.keys(keep).length} 格坐标不变）——接着跑 npm run atlas`);

// ---------------- GIF 预览（可选） ----------------
const gi = process.argv.indexOf('--gif');
if (gi > 0) {
  const dir = path.resolve(process.argv[gi + 1] ?? path.join(process.env.TMPDIR ?? '/tmp', 'cast_gif'));
  fs.mkdirSync(dir, { recursive: true });
  const Z = 3, PAL = RGB.map((c) => c);
  const manifest = { chars: {}, things: {} };
  const scaleUp = (s, z) => { const o = new Uint8Array(s.w * z * s.h * z); for (let y = 0; y < s.h * z; y++) for (let x = 0; x < s.w * z; x++) o[y * s.w * z + x] = s.d[Math.floor(y / z) * s.w + Math.floor(x / z)]; return o; };
  const fxTop = 20;
  for (const { id, name, keys, A } of gifJobs) {
    const fr = keys.map((k) => cells[k]);
    const W = fr[0].w + 16, Hh = fr[0].h + fxTop;
    const fxKeys = A.fx ? fxSeq[A.fx] : null;
    const bb = bbox(cells[keys[0]]);
    const frames = fr.map((s, i) => {
      const can = blank(W, Hh);
      stamp(can, s, 8, fxTop);
      if (fxKeys) { const fx = cells[fxKeys[i % fxKeys.length]]; stamp(can, fx, Math.min(W - fx.w, 8 + bb.x1 - 4), Math.max(0, fxTop + bb.y0 - fx.h + 6)); }
      return scaleUp(can, Z);
    });
    const loops = A.loop ? frames : [...frames, ...Array(Math.ceil(A.fps * 0.6)).fill(frames[frames.length - 1])];
    const file = `${id}_${name}.gif`;
    fs.writeFileSync(path.join(dir, file), encodeGif({ w: W * Z, h: Hh * Z, frames: loops, palette: PAL, delayCs: Math.round(100 / A.fps) }));
    (manifest.chars[id] ??= { name: CHARS[id].name, props: PROPS_OF[id], actions: [] }).actions.push({ name, label: A.label, file, frames: keys.length, fps: A.fps, loop: A.loop, fx: A.fx ?? null, keys });
  }
  for (const [k, s] of Object.entries(THINGS)) {
    const file = `${k}.gif`;
    fs.writeFileSync(path.join(dir, file), encodeGif({ w: s.w * 4, h: s.h * 4, frames: [scaleUp(s, 4)], palette: PAL, delayCs: 100 }));
    manifest.things[k] = { file, w: s.w, h: s.h };
  }
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 1));
  console.log(`GIF 预览 ${gifJobs.length + Object.keys(THINGS).length} 张 → ${dir}`);
}
