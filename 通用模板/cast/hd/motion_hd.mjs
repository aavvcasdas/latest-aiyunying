// motion_hd.mjs —— HD 派生动作：对超分后的基础格做连续形变（双线性采样 + 预乘 alpha）。
// 纯函数、零依赖：Node（bake_hd.mjs）与网页预览 / 导出共用同一份代码。
// 姿态参数与 通用模板/cast/source/motion_core.mjs 的 pose() 同名同义，单位仍是「1 倍像素」，内部乘 S。

/**
 * HD 倍率：基础格是 1 倍的 S 倍（默认 2 → 人物/q版HD_2x，单格约 168×180）。
 * 姿态参数的单位仍是「1 倍像素」，内部乘 S；换倍率只影响图包大小，不影响动作幅度。
 * 4 倍那套（人物/q版HD、python3 hd_base.py --scale 4）也是同一份代码，把这里改成 4 就行。
 */
export const S = Number(globalThis.process?.env?.HD_SCALE) || 2;

/** 八位角色用到的基础格（名字就是 cast_atlas.json 里的格子名）。ratio = 脖子 / 胯在身高里的比例。 */
export const CAST = {
  whale:  { name: '本鲸', model: 'DeepSeek', front: 'whale_idle', blink: 'whale_blink', wave: 'whale_wave', point: 'whale_point', walk: 'walk_whale_', ratio: { neck: 0.47, hip: 0.72 } },
  gpt:    { name: '龙娘', model: 'GPT', front: 'gpt_boss_idle', blink: 'gpt_boss_blink', rage: 'gpt_boss_rage', cast: 'gpt_boss_cast0', fly: 'gpt_fly_', ratio: { neck: 0.36, hip: 0.6 } },
  claude: { name: '小克', model: 'Claude', front: 'claude_front_0', blink: 'claude_front_1', side: 'claude_side_0', walk: 'walk_claude_', ratio: { neck: 0.45, hip: 0.7 } },
  doubao: { name: '豆包', model: 'Seed', front: 'doubao_cage_0', blink: 'doubao_cage_1', walk: 'walk_doubao_big_', ratio: { neck: 0.33, hip: 0.62 } },
  gemini: { name: '猫', model: 'Gemini', front: 'gemini_front_0', blink: 'gemini_front_1', side: 'gemini_side_0', walk: 'walk_gemini_', ratio: { neck: 0.44, hip: 0.68 } },
  kimi:   { name: 'Kimi', model: 'Kimi', front: 'kimi_front_0', blink: 'kimi_front_1', side: 'kimi_side_0', walk: 'walk_kimi_', ratio: { neck: 0.4, hip: 0.66 } },
  qwen:   { name: '千问', model: 'Qwen', front: 'qwen_front_0', blink: 'qwen_front_1', side: 'qwen_side_0', walk: 'walk_qwen_', ratio: { neck: 0.4, hip: 0.66 } },
  zai:    { name: '狐狸', model: 'GLM', front: 'zai_front_0', blink: 'zai_front_1', side: 'zai_side_0', walk: 'walk_zai_', ratio: { neck: 0.44, hip: 0.68 } },
};
export const CHAR_IDS = Object.keys(CAST);

const TAU = Math.PI * 2, sin = Math.sin, abs = Math.abs;
const ease = (t) => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
const smooth = (e0, e1, x) => ease((x - e0) / (e1 - e0));
const inOut = (u, a, b, c, d) => (u < a ? 0 : u < b ? ease((u - a) / (b - a)) : u < c ? 1 : u < d ? 1 - ease((u - c) / (d - c)) : 0);

/**
 * 动作库。f(c, i, n) 返回一帧的 { k: 基础格名, ...姿态参数 }。
 * 设计口径：幅度小、有缓入缓出、落地有挤压；不再把人横向压成细条（旧 spin），转身改成「正面 / 侧身 / 镜像」换格。
 */
const LIB = {
  idle: { label: '呼吸待机', fps: 8, loop: true, n: 16, f: (c, i, n) => { const b = (1 - Math.cos(TAU * i / n)) / 2; return { k: i === 11 ? c.blink : c.front, sy: 1 + 0.012 * b, sx: 1 - 0.005 * b, headDy: -0.3 * b }; } },
  walk: { label: '走路', fps: 10, loop: true, n: 8, f: (c, i) => ({ k: c.walk + i }) },
  nod: { label: '点头', fps: 12, loop: false, n: 10, f: (c, i) => { const v = [0, 0.5, 1, 0.7, 0.2, 0, 0.6, 0.9, 0.3, 0][i]; return { k: v > 0.8 ? c.blink : c.front, headDy: 2.6 * v, bow: 0.03 * v }; } },
  shake: { label: '摇头', fps: 12, loop: false, n: 12, f: (c, i, n) => { const a = sin(TAU * 2 * i / n) * (1 - 0.3 * i / n); return { k: c.front, headDx: 2.2 * a, head: 0.05 * a }; } },
  tilt: { label: '歪头', fps: 10, loop: false, n: 10, f: (c, i, n) => { const v = ease(i / (n * 0.55)); return { k: i === 6 ? c.blink : c.front, head: 0.13 * v, headDx: 1.0 * v }; } },
  bow: { label: '鞠躬', fps: 12, loop: false, n: 14, f: (c, i, n) => { const v = inOut(i / (n - 1), 0, 0.38, 0.62, 1); return { k: v > 0.9 ? c.blink : c.front, bow: 0.16 * v, headDy: 3.5 * v }; } },
  hop: { label: '开心跳', fps: 12, loop: true, n: 12, f: (c, i) => { const dy = [0, 0, -3, -7, -9, -9, -7, -3, 0, 0, 0, 0][i], sy = [0.97, 0.93, 1.03, 1.05, 1.03, 1, 1.02, 1.04, 0.93, 0.96, 0.99, 1][i]; return { k: c.front, dy, sy, sx: 1 + (1 - sy) * 0.6 }; } },
  cheer: { label: '欢呼', fps: 12, loop: true, n: 12, f: (c, i, n) => { const a = sin(TAU * i / n); return { k: c.wave || c.front, dy: -4 * abs(a), lean: 0.05 * a, sy: 1 + 0.02 * abs(a) }; } },
  sway: { label: '摇摆', fps: 10, loop: true, n: 16, f: (c, i, n) => { const a = sin(TAU * i / n); return { k: i === 13 ? c.blink : c.front, sway: 3 * a, head: -0.05 * a, dy: -0.8 * abs(a) }; } },
  step: { label: '踩拍', fps: 12, loop: true, n: 16, f: (c, i, n) => { const q = (i / n) * 4, b = Math.floor(q), p = sin(Math.PI * (q - b)), a = b % 2 ? 1 : -1; return { k: c.front, sway: 2.4 * a * p, dy: -2.2 * p, head: -0.05 * a * p, lean: 0.03 * a * p }; } },
  surprise: { label: '吃惊', fps: 12, loop: false, n: 10, f: (c, i) => ({ k: c.front, dy: [0, -4, -6, -5, -2, 0, 0, 0, 0, 0][i], sy: [0.96, 1.06, 1.07, 1.05, 1.02, 0.97, 0.99, 1, 1, 1][i], lean: [0, -0.03, -0.04, -0.03, -0.01, 0, 0, 0, 0, 0][i] }) },
  sad: { label: '低落', fps: 8, loop: false, n: 12, f: (c, i, n) => { const v = ease(i / (n * 0.6)); return { k: i >= 8 ? c.blink : c.front, headDy: 3 * v, bow: 0.05 * v, sway: 0.6 * v * sin(TAU * i / n) }; } },
  shiver: { label: '发抖', fps: 14, loop: true, n: 8, f: (c, i) => ({ k: c.front, dx: [0.6, -0.6, 0.5, -0.7, 0.6, -0.5, 0.7, -0.6][i], sy: 0.99, head: (i % 2 ? -1 : 1) * 0.01 }) },
  // 张望只用正面格做转头：多数角色的侧身格与正面不是同一套造型（猫的侧身是双马尾、本鲸的走路帧偏暗），混用会跳
  lookaround: { label: '左右张望', fps: 8, loop: true, n: 16, f: (c, i) => { const a = [0, 0, 0.5, 1, 1, 1, 0.5, 0, 0, -0.5, -1, -1, -1, -0.5, 0, 0][i]; return { k: i === 8 ? c.blink : c.front, headDx: 2.4 * a, head: 0.05 * a, sway: 0.9 * a }; } },
  turn: { label: '转身', fps: 10, loop: true, n: 12, f: (c, i, n) => {
    const side = c.side || c.walk + '0', q = 0.86, dy = -1.5 * abs(sin(TAU * i / n));
    const seq = [{ k: c.front }, { k: c.front, sx: q }, { k: side, sx: q }, { k: side }, { k: side, sx: q }, { k: c.front, flip: true, sx: q },
      { k: c.front, flip: true }, { k: c.front, flip: true, sx: q }, { k: side, flip: true, sx: q }, { k: side, flip: true }, { k: side, flip: true, sx: q }, { k: c.front, sx: q }];
    return { ...seq[i], dy };
  } },
  // —— 专属 ——
  wave: { label: '挥手', fps: 10, loop: true, n: 12, f: (c, i, n) => { const a = sin(TAU * 2 * i / n); return { k: c.wave, lean: 0.035 * a, head: 0.04 * a, dy: -0.6 * abs(a) }; } },
  point: { label: '递出去', fps: 10, loop: false, n: 10, f: (c, i, n) => { const v = ease((i - 2) / 4); return i < 3 ? { k: c.front, lean: 0.015 * i } : { k: c.point, dx: 1.5 * v, lean: 0.05 * v }; } },
  float: { label: '悬浮待机', fps: 8, loop: true, n: 16, f: (c, i, n) => ({ k: i === 9 ? c.blink : c.front, dy: -3 - 2.5 * sin(TAU * i / n), sway: 1.2 * sin(TAU * i / n + 1) }) },
  hover: { label: '振翅悬停', fps: 12, loop: true, n: 12, f: (c, i, n) => { const a = sin(TAU * i / n); return { k: c.front, dy: -5 - 4 * a, sy: 1 + 0.015 * a, sx: 1 - 0.01 * a }; } },
  fly: { label: '飞行', fps: 10, loop: true, n: 8, f: (c, i, n) => ({ k: c.fly + (i % 2), dy: -6 - 3 * sin(TAU * i / n) }) },
  cast: { label: '施法', fps: 10, loop: false, n: 14, f: (c, i, n) => { const v = ease((i - 2) / 5); return i < 3 ? { k: c.front, sy: 1 - 0.02 * i } : { k: c.cast, dy: -4 * v, lean: 0.05 * v, sy: 1 + 0.02 * v }; } },
  rage: { label: '生气', fps: 14, loop: true, n: 10, f: (c, i) => ({ k: c.rage, dx: (i % 2 ? -1 : 1) * 0.8, dy: [0, -2, -3, -2, 0, 0, -2, -3, -2, 0][i], sy: [0.97, 1.01, 1.02, 1.01, 0.96, 0.97, 1.01, 1.02, 1.01, 0.96][i] }) },
  curtsy: { label: '提裙行礼', fps: 12, loop: false, n: 14, f: (c, i, n) => { const v = inOut(i / (n - 1), 0, 0.38, 0.62, 1); return { k: v > 0.9 ? c.blink : c.front, bow: 0.1 * v, sy: 1 - 0.05 * v, sx: 1 + 0.03 * v, head: 0.06 * v, headDy: 1.5 * v }; } },
  read: { label: '低头看书', fps: 6, loop: true, n: 12, f: (c, i, n) => ({ k: i === 7 ? c.blink : c.front, headDy: 2.2, bow: 0.04, head: 0.02 * sin(TAU * i / n) }) },
  think: { label: '歪头思考', fps: 6, loop: true, n: 12, f: (c, i, n) => ({ k: i === 8 ? c.blink : c.front, head: 0.11, headDx: 0.8, headDy: 0.5 * sin(TAU * i / n) }) },
  choose: { label: '两边想想再选', fps: 8, loop: false, n: 16, f: (c, i) => { const a = [0, -0.6, -1, -1, -1, -0.5, 0.3, 1, 1, 1, 0.5, 0, 0, 0, 0, 0][i], nodv = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.6, 1, 0.5, 0, 0][i]; return { k: i === 12 ? c.blink : c.front, headDx: 2.6 * a, head: 0.07 * a, sway: 1.1 * a, headDy: 2.6 * nodv, bow: 0.03 * nodv }; } },
  doze: { label: '打盹', fps: 6, loop: true, n: 16, f: (c, i, n) => { const v = (1 - Math.cos(TAU * i / n)) / 2; return { k: c.blink, headDy: 2 + 1.6 * v, bow: 0.04 + 0.02 * v, head: 0.06 }; } },
  alert: { label: '惊醒竖耳', fps: 12, loop: false, n: 10, f: (c, i) => ({ k: i === 0 ? c.blink : c.front, dy: [0, -5, -7, -5, -2, 0, 0, 0, 0, 0][i], sy: [0.95, 1.07, 1.08, 1.05, 1.02, 0.97, 0.99, 1, 1, 1][i] }) },
};

const COMMON = ['nod', 'shake', 'tilt', 'bow', 'hop', 'cheer', 'sway', 'step', 'surprise', 'sad', 'shiver'];
/** 每人的动作表（顺序即图包里的顺序）。转身只给千问：只有她的侧身格与正面是同一套造型。 */
export const ACTIONS_OF = {
  whale: ['idle', 'walk', 'wave', 'point', ...COMMON, 'lookaround'],
  gpt: ['float', 'hover', 'fly', 'cast', 'rage', 'nod', 'shake', 'tilt', 'bow', 'sway', 'surprise', 'sad', 'shiver'],
  claude: ['idle', 'walk', 'curtsy', 'read', ...COMMON, 'lookaround'],
  doubao: ['idle', 'walk', ...COMMON, 'lookaround'],
  gemini: ['idle', 'walk', 'choose', ...COMMON, 'lookaround'],
  kimi: ['idle', 'walk', 'think', ...COMMON, 'lookaround'],
  qwen: ['idle', 'walk', ...COMMON, 'lookaround', 'turn'],
  zai: ['idle', 'walk', 'doze', 'alert', ...COMMON, 'lookaround'],
};
export const actionMeta = (name) => { const a = LIB[name]; if (!a) throw new Error(`没有动作「${name}」`); return { name, label: a.label, fps: a.fps, loop: a.loop, n: a.n }; };
export const frameSpec = (charId, name, i) => {
  const a = LIB[name]; if (!a) throw new Error(`HD 动作表里没有动作「${name}」`);
  const c = CAST[charId]; if (!c) throw new Error(`HD 动作表里没有角色「${charId}」`);
  return a.f(c, i, a.n);
};

/** 这位角色的全部动作会用到哪些基础格 */
export function baseKeysOf(charId) {
  const keys = new Set();
  const list = ACTIONS_OF[charId] ?? (() => { throw new Error(`HD 动作表里没有角色「${charId}」`); })();
  for (const name of list) for (let i = 0; i < LIB[name].n; i++) keys.add(frameSpec(charId, name, i).k);
  return [...keys];
}

// ---------- 像素工具 ----------
/** RGBA(直通 alpha) → 预乘浮点，供双线性采样 */
export function premultiply(rgba, w, h) {
  const pm = new Float32Array(w * h * 4);
  for (let i = 0; i < w * h * 4; i += 4) { const a = rgba[i + 3] / 255; pm[i] = rgba[i] * a; pm[i + 1] = rgba[i + 1] * a; pm[i + 2] = rgba[i + 2] * a; pm[i + 3] = rgba[i + 3]; }
  return { w, h, pm };
}
export function landmarks(src, ratio = {}) {
  let x0 = src.w, y0 = src.h, x1 = -1, y1 = -1;
  for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) if (src.pm[(y * src.w + x) * 4 + 3] > 127) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const H = y1 - y0 + 1;
  return { cx: (x0 + x1 + 1) / 2, foot: y1 + 1, top: y0, H, neckY: y0 + H * (ratio.neck ?? 0.43), hipY: y0 + H * (ratio.hip ?? 0.68) };
}

/** 一帧：把 src 按姿态 p 画进 cell（宽 cw 高 ch，脚底中心落在 (cw/2, footY)）。返回直通 alpha 的 RGBA。 */
export function poseHD(src, L, p, cw, ch, footY) {
  const out = new Uint8ClampedArray(cw * ch * 4), { pm, w: SW, h: SH } = src;
  const sx = p.sx ?? 1, sy = p.sy ?? 1, dx = (p.dx ?? 0) * S, dy = (p.dy ?? 0) * S, sway = (p.sway ?? 0) * S;
  const head = p.head ?? 0, hdx = (p.headDx ?? 0) * S, hdy = (p.headDy ?? 0) * S, lean = p.lean ?? 0, bow = p.bow ?? 0;
  const { cx, foot, neckY, hipY, H } = L, soft = H * 0.12, ox = cw / 2 - cx, oy = footY - foot;
  const torso = hipY - neckY, neck2 = hipY - torso * (1 - bow);
  for (let Y = 0; Y < ch; Y++) for (let X = 0; X < cw; X++) {
    let x = X + 0.5 - ox, y = Y + 0.5 - oy;
    if (p.flip) x = 2 * cx - x;
    x -= dx; y -= dy;
    x = cx + (x - cx) / sx; y = foot - (foot - y) / sy;
    const hgt = Math.max(0, (foot - y) / H);
    if (sway) x -= sway * Math.pow(hgt, 1.35);
    if (lean) { const a = -lean * smooth(hipY + soft, hipY - soft, y), c = Math.cos(a), s = Math.sin(a), rx = x - cx, ry = y - hipY; x = cx + rx * c - ry * s; y = hipY + rx * s + ry * c; }
    if (bow && y < hipY) y = y >= neck2 ? hipY - (hipY - y) / (1 - bow) : y + (neckY - neck2);
    // 头部权重：从脖子往下渐弱到上身中段（比 1 倍版更宽），长发跟着头走一截，不在脖子处撕开
    const hw = smooth(neckY + H * 0.22, neckY - H * 0.05, y);
    x -= hdx * hw; y -= hdy * hw;
    if (head) { const a = -head * hw, c = Math.cos(a), s = Math.sin(a), rx = x - cx, ry = y - neckY; x = cx + rx * c - ry * s; y = neckY + rx * s + ry * c; }
    const fx = x - 0.5, fy = y - 0.5, x0 = Math.floor(fx), y0 = Math.floor(fy);
    if (x0 < -1 || y0 < -1 || x0 >= SW || y0 >= SH) continue;
    const tx = fx - x0, ty = fy - y0; let r = 0, g = 0, b = 0, a = 0;
    for (let k = 0; k < 4; k++) {
      const xx = x0 + (k & 1), yy = y0 + (k >> 1); if (xx < 0 || yy < 0 || xx >= SW || yy >= SH) continue;
      const wgt = ((k & 1) ? tx : 1 - tx) * ((k >> 1) ? ty : 1 - ty), q = (yy * SW + xx) * 4;
      r += pm[q] * wgt; g += pm[q + 1] * wgt; b += pm[q + 2] * wgt; a += pm[q + 3] * wgt;
    }
    if (a < 0.5) continue;
    const o = (Y * cw + X) * 4, inv = 255 / a; out[o] = r * inv; out[o + 1] = g * inv; out[o + 2] = b * inv; out[o + 3] = a;
  }
  return out;
}

/**
 * 这位角色统一的格子尺寸：所有动作同一格、同一脚底锚点（引擎换动作不用重新对位）。
 * 列宽按「1 倍格宽 + 两边各 12 像素」乘倍数算，并且总是 4 的倍数——
 * 这样 1 倍和 2 倍、4 倍的格子是严格的整数倍关系，1 倍坐标 × 倍数 就是高清图里的像素，
 * 引擎可以直接把 1 倍图集那一套坐标（rect、脚底、画框）拿来用，不用另存一份对照表。
 */
export function layoutOf(charId, sizeOf) {
  let mw = 0, mh = 0;
  for (const k of baseKeysOf(charId)) { const s = sizeOf(k); if (!s) throw new Error(`缺基础格「${k}」`); mw = Math.max(mw, s.w / S); mh = Math.max(mh, s.h / S); }
  const cw = Math.ceil((mw + 2 * 12) / 4) * 4 * S, ch = Math.ceil((mh + 12) / 4) * 4 * S + 8 * S;
  return { cw, ch, footY: ch - 8 * S };
}

/** 渲染一个动作的全部帧。bases(key) → { w, h, pm }（premultiply 的结果）。 */
export function renderAction(charId, name, bases, layout, lmCache = new Map()) {
  const meta = actionMeta(name), frames = [];
  for (let i = 0; i < meta.n; i++) {
    const p = frameSpec(charId, name, i), src = bases(p.k);
    if (!src) throw new Error(`动作 ${charId}/${name} 第 ${i} 帧缺基础格「${p.k}」`);
    let L = lmCache.get(p.k); if (!L) { L = landmarks(src, CAST[charId].ratio); lmCache.set(p.k, L); }
    frames.push(poseHD(src, L, p, layout.cw, layout.ch, layout.footY));
  }
  return frames;
}

/** 把若干帧排成网格（每行最多 maxW 像素宽）。返回 { rgba, w, h, cols, rows }。 */
export function toSheet(frames, cw, ch, maxW = 4096) {
  const cols = Math.max(1, Math.min(frames.length, Math.floor(maxW / cw))), rows = Math.ceil(frames.length / cols);
  const w = cols * cw, h = rows * ch, rgba = new Uint8ClampedArray(w * h * 4);
  frames.forEach((f, i) => { const ox = (i % cols) * cw, oy = Math.floor(i / cols) * ch; for (let y = 0; y < ch; y++) rgba.set(f.subarray(y * cw * 4, (y + 1) * cw * 4), ((oy + y) * w + ox) * 4); });
  return { rgba, w, h, cols, rows };
}

/** 边缘颜色外扩：把轮廓外 n 圈透明像素的 RGB 填成邻近的不透明色（alpha 仍为 0）。线性过滤 / 缩放时不会带出黑边或白边。 */
export function bleedEdges(rgba, w, h, n = 3) {
  let filled = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) filled[i] = rgba[i * 4 + 3] > 0 ? 1 : 0;
  for (let pass = 0; pass < n; pass++) {
    const next = filled.slice();
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x; if (filled[i]) continue;
      let r = 0, g = 0, b = 0, c = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
        const j = yy * w + xx; if (!filled[j]) continue; r += rgba[j * 4]; g += rgba[j * 4 + 1]; b += rgba[j * 4 + 2]; c++;
      }
      if (c) { rgba[i * 4] = r / c; rgba[i * 4 + 1] = g / c; rgba[i * 4 + 2] = b / c; next[i] = 1; }
    }
    filled = next;
  }
  return rgba;
}

/** 预乘 alpha 的 2×2 盒式缩小（出 2 倍图包用） */
export function halve(rgba, w, h) {
  const W = w >> 1, Hh = h >> 1, out = new Uint8ClampedArray(W * Hh * 4);
  for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) {
    let r = 0, g = 0, b = 0, a = 0;
    for (let k = 0; k < 4; k++) { const q = ((y * 2 + (k >> 1)) * w + x * 2 + (k & 1)) * 4, al = rgba[q + 3]; r += rgba[q] * al; g += rgba[q + 1] * al; b += rgba[q + 2] * al; a += al; }
    const o = (y * W + x) * 4; if (a > 0) { out[o] = r / a; out[o + 1] = g / a; out[o + 2] = b / a; } out[o + 3] = a / 4;
  }
  return { rgba: out, w: W, h: Hh };
}

// ---------- PNG 编解码（CompressionStream / DecompressionStream：浏览器与 Node ≥ 18 都有） ----------
const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (u8, c = 0xffffffff) => { for (let i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 255] ^ (c >>> 8); return c; };
const through = async (u8, stream) => new Uint8Array(await new Response(new Blob([u8]).stream().pipeThrough(stream)).arrayBuffer());
const paeth = (a, b, c) => { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); return pa <= pb && pa <= pc ? a : pb <= pc ? b : c; };

export async function encodePNG(rgba, w, h) {
  const stride = w * 4, raw = new Uint8Array((stride + 1) * h), cand = [new Uint8Array(stride), new Uint8Array(stride), new Uint8Array(stride)];
  for (let y = 0; y < h; y++) {
    const row = y * stride, up = row - stride, sum = [0, 0, 0];
    for (let i = 0; i < stride; i++) {
      const v = rgba[row + i], a = i >= 4 ? rgba[row + i - 4] : 0, b = y ? rgba[up + i] : 0, c = y && i >= 4 ? rgba[up + i - 4] : 0;
      const s = (v - a) & 255, u = (v - b) & 255, p = (v - paeth(a, b, c)) & 255;
      cand[0][i] = s; cand[1][i] = u; cand[2][i] = p; sum[0] += s < 128 ? s : 256 - s; sum[1] += u < 128 ? u : 256 - u; sum[2] += p < 128 ? p : 256 - p;
    }
    const best = sum[0] <= sum[1] && sum[0] <= sum[2] ? 0 : sum[1] <= sum[2] ? 1 : 2;
    raw[y * (stride + 1)] = [1, 2, 4][best]; raw.set(cand[best], y * (stride + 1) + 1);
  }
  const idat = await through(raw, new CompressionStream('deflate'));
  return assemblePNG(w, h, 8, 6, [], idat);
}

const CRC_T = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crcOf = (u8) => { let c = 0xffffffff; for (let i = 0; i < u8.length; i++) c = CRC_T[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function assemblePNG(w, h, bitDepth, colorType, chunks, idat) {
  const chunk = (type, data) => {
    const out = new Uint8Array(12 + data.length), dv = new DataView(out.buffer); dv.setUint32(0, data.length);
    for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i); out.set(data, 8);
    dv.setUint32(8 + data.length, crcOf(out.subarray(4, 8 + data.length))); return out;
  };
  const ihdr = new Uint8Array(13), dv = new DataView(ihdr.buffer);
  dv.setUint32(0, w); dv.setUint32(4, h); ihdr[8] = bitDepth; ihdr[9] = colorType;
  const parts = [new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), ...chunks, chunk('IDAT', idat), chunk('IEND', new Uint8Array(0))];
  const png = new Uint8Array(parts.reduce((n, p) => n + p.length, 0)); let o = 0; for (const p of parts) { png.set(p, o); o += p.length; }
  return png;
}

/**
 * 调色板 PNG（8 位 RGBA → 色彩类型 3 + tRNS）：像素与输入逐字节相同，只是换了个更省的容器。
 * 调色板最多 256 色（8 位索引的上限），超过就原样退回 RGBA，不报错、不做有损量化。
 * 透明像素的 RGB 写成「按 alpha 加权平均出来的实色」：浏览器按预乘方式合成，结果不变；
 * 透明像素的 RGB 因此不再是黑的——线性过滤取样时不会带出黑边（白边 / 黑边的老毛病之一）。
 */
export async function quantizePNG(rgba, w, h) {
  const n = w * h, idx = new Uint8Array(n), seen = new Map(), pal = []; let r2 = 0, g2 = 0, b2 = 0, a2 = 0;
  for (let i = 0; i < n; i++) {
    const o = i * 4, key = (rgba[o] << 24 | rgba[o + 1] << 16 | rgba[o + 2] << 8 | rgba[o + 3]) >>> 0;
    let v = seen.get(key);
    if (v === undefined) { if (pal.length >= 256) return encodePNG(rgba, w, h); v = pal.length; seen.set(key, v); pal.push(key); }
    idx[i] = v;
    if ((key & 255) > 0) { r2 += rgba[o]; g2 += rgba[o + 1]; b2 += rgba[o + 2]; a2++; }
  }
  const bias = a2 ? [Math.round(r2 / a2), Math.round(g2 / a2), Math.round(b2 / a2)] : [0, 0, 0];
  const stride = w, raw = new Uint8Array((stride + 1) * h), cand = [new Uint8Array(stride), new Uint8Array(stride), new Uint8Array(stride)];
  for (let y = 0; y < h; y++) {
    const row = y * stride, up = row - stride, sum = [0, 0, 0];
    for (let i = 0; i < stride; i++) {
      const v = idx[row + i], a = i >= 1 ? idx[row + i - 1] : 0, b = y ? idx[up + i] : 0, c = y && i >= 1 ? idx[up + i - 1] : 0;
      const s = (v - a) & 255, u = (v - b) & 255, p = (v - paeth(a, b, c)) & 255;
      cand[0][i] = s; cand[1][i] = u; cand[2][i] = p; sum[0] += s < 128 ? s : 256 - s; sum[1] += u < 128 ? u : 256 - u; sum[2] += p < 128 ? p : 256 - p;
    }
    const best = sum[0] <= sum[1] && sum[0] <= sum[2] ? 0 : sum[1] <= sum[2] ? 1 : 2;
    raw[y * (stride + 1)] = [1, 2, 4][best]; raw.set(cand[best], y * (stride + 1) + 1);
  }
  const idat = await through(raw, new CompressionStream('deflate'));
  let cap = 2; while (cap < pal.length) cap *= 2;                        // PLTE 补齐到 2 的幂，Pillow / 老解码器都认
  const plte = new Uint8Array(cap * 3), trns = [];
  for (let i = 0; i < cap; i++) {
    const key = pal[i] ?? 0, al = key & 255, r = (key >>> 24) & 255, g = (key >>> 16) & 255, b = (key >>> 8) & 255;
    plte[i * 3] = al ? r : bias[0]; plte[i * 3 + 1] = al ? g : bias[1]; plte[i * 3 + 2] = al ? b : bias[2];
    trns.push(i < pal.length ? al : 255);
  }
  while (trns.length && trns[trns.length - 1] === 255) trns.pop();
  const mk = (type, data) => {
    const out = new Uint8Array(12 + data.length), dv = new DataView(out.buffer); dv.setUint32(0, data.length);
    for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i); out.set(data, 8);
    dv.setUint32(8 + data.length, crcOf(out.subarray(4, 8 + data.length))); return out;
  };
  const chunks = [mk('PLTE', plte)];
  if (trns.length) chunks.push(mk('tRNS', new Uint8Array(trns)));
  return assemblePNG(w, h, 8, 3, chunks, idat);
}

/** 只解 8 位 RGBA / RGB、非隔行的 PNG（本项目的基础格就是这种） */
export async function decodePNG(u8) {
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength); let o = 8, w = 0, h = 0, ct = 6; const idat = [];
  while (o < u8.length) {
    const len = dv.getUint32(o), type = String.fromCharCode(u8[o + 4], u8[o + 5], u8[o + 6], u8[o + 7]);
    if (type === 'IHDR') { w = dv.getUint32(o + 8); h = dv.getUint32(o + 12); ct = u8[o + 17]; if (u8[o + 16] !== 8 || (ct !== 6 && ct !== 2) || u8[o + 20]) throw new Error('只支持 8 位 RGB/RGBA 非隔行 PNG'); }
    else if (type === 'IDAT') idat.push(u8.subarray(o + 8, o + 8 + len));
    o += 12 + len;
  }
  const z = new Uint8Array(idat.reduce((n, p) => n + p.length, 0)); let q = 0; for (const p of idat) { z.set(p, q); q += p.length; }
  const raw = await through(z, new DecompressionStream('deflate')), bpp = ct === 6 ? 4 : 3, stride = w * bpp, px = new Uint8Array(stride * h);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], src = y * (stride + 1) + 1, row = y * stride, up = row - stride;
    for (let i = 0; i < stride; i++) {
      const a = i >= bpp ? px[row + i - bpp] : 0, b = y ? px[up + i] : 0, c = y && i >= bpp ? px[up + i - bpp] : 0, v = raw[src + i];
      px[row + i] = (v + (f === 0 ? 0 : f === 1 ? a : f === 2 ? b : f === 3 ? (a + b) >> 1 : paeth(a, b, c))) & 255;
    }
  }
  if (ct === 6) return { rgba: new Uint8ClampedArray(px.buffer), w, h };
  const rgba = new Uint8ClampedArray(w * h * 4); for (let i = 0; i < w * h; i++) { rgba[i * 4] = px[i * 3]; rgba[i * 4 + 1] = px[i * 3 + 1]; rgba[i * 4 + 2] = px[i * 3 + 2]; rgba[i * 4 + 3] = 255; }
  return { rgba, w, h };
}
