// motion_core.mjs —— 像素角色「派生动作」的核心：只对已有像素格做形变，不新增颜色、不换画风。
//
// 做法（RotSprite 简化版）：
//   1. 原格先做两次 Scale2x（4 倍），像素边缘被「推」成斜线而不是糊开；
//   2. 每个目标像素反算回源图坐标（弯腰 / 歪头 / 压扁 / 摇摆 / 平移……全部写成一个反向映射）；
//   3. 在 4 倍图上取最近邻，落回 1 倍。
// 结果的每个像素都是原图里已有的调色板号（255 = 透明），所以图集重烘后仍是「同一套像素」。
//
// 本文件是纯函数，不依赖 Node / 浏览器：bake_actions.mjs 和网页预览共用同一份。

export const T = 255;

/** @typedef {{w:number,h:number,d:Uint8Array}} Spr */

export const blank = (w, h) => ({ w, h, d: new Uint8Array(w * h).fill(T) });
export const clone = (s) => ({ w: s.w, h: s.h, d: new Uint8Array(s.d) });

export function bbox(s) {
  let x0 = s.w, y0 = s.h, x1 = -1, y1 = -1;
  for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) {
    if (s.d[y * s.w + x] !== T) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  return { x0, y0, x1, y1, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

function scale2x(s) {
  const W = s.w * 2, H = s.h * 2, o = new Uint8Array(W * H);
  const g = (x, y) => (x < 0 || y < 0 || x >= s.w || y >= s.h ? T : s.d[y * s.w + x]);
  for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) {
    const P = g(x, y), A = g(x, y - 1), B = g(x + 1, y), C = g(x - 1, y), D = g(x, y + 1);
    let e0 = P, e1 = P, e2 = P, e3 = P;
    if (C === A && C !== D && A !== B) e0 = A;
    if (A === B && A !== C && B !== D) e1 = B;
    if (D === C && D !== B && C !== A) e2 = C;
    if (B === D && B !== A && D !== C) e3 = D;
    const i = y * 2 * W + x * 2;
    o[i] = e0; o[i + 1] = e1; o[i + W] = e2; o[i + W + 1] = e3;
  }
  return { w: W, h: H, d: o };
}
const up4Cache = new WeakMap();
export function up4(s) {
  let u = up4Cache.get(s);
  if (!u) { u = scale2x(scale2x(s)); up4Cache.set(s, u); }
  return u;
}

const smooth = (e0, e1, x) => { const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

/**
 * 身体基准点（以原格坐标计）：脚底中心、脖子、胯。比例按 Q 版头身估，逐角色可覆盖。
 */
export function landmarks(s, ratio = {}) {
  const b = bbox(s);
  const neck = ratio.neck ?? 0.43, hip = ratio.hip ?? 0.68;
  return {
    cx: ratio.cx != null ? b.x0 + b.w * ratio.cx : (b.x0 + b.x1 + 1) / 2,
    foot: b.y1 + 1, top: b.y0, H: b.h,
    neckY: b.y0 + b.h * neck, hipY: b.y0 + b.h * hip,
  };
}

/**
 * 一帧的姿态参数（全部可缺省）：
 *   dx, dy      整体平移（像素）；dy 为负 = 向上（跳起）
 *   sx, sy      以脚底中心为原点的缩放（挤压 / 拉伸）
 *   sway        摇摆：头顶横移多少像素，脚底不动（越往上移得越多）
 *   head        歪头角度（弧度，正 = 顺时针），以脖子为轴，头发往下渐弱
 *   headDx/Dy   头部平移（摇头 / 点头），同样往下渐弱
 *   lean        上半身以胯为轴倾斜（弧度）
 *   bow         正面鞠躬：上半身朝胯压缩的比例（0 = 不鞠躬，0.2 = 压掉两成高）
 *   flip        水平翻转
 */
export function pose(src, L, p, cell) {
  const { w: CW, h: CH, ox, oy } = cell; // 原格在目标格里的偏移
  const U = up4(src);
  const out = blank(CW, CH);
  const sx = p.sx ?? 1, sy = p.sy ?? 1, dx = p.dx ?? 0, dy = p.dy ?? 0;
  const sway = p.sway ?? 0, head = p.head ?? 0, hdx = p.headDx ?? 0, hdy = p.headDy ?? 0;
  const lean = p.lean ?? 0, bow = p.bow ?? 0;
  const soft = L.H * 0.12;
  const { cx, foot, neckY, hipY, H } = L;
  for (let Y = 0; Y < CH; Y++) for (let X = 0; X < CW; X++) {
    // 目标像素中心 → 原格坐标系
    let x = X + 0.5 - ox, y = Y + 0.5 - oy;
    if (p.flip) x = 2 * cx - x;
    // 1. 平移
    x -= dx; y -= dy;
    // 2. 以脚底中心缩放
    x = cx + (x - cx) / sx; y = foot - (foot - y) / sy;
    // 3. 摇摆（剪切，越高越多，带一点弧度）
    const hgt = Math.max(0, (foot - y) / H);
    x -= sway * Math.pow(hgt, 1.35);
    // 4. 上半身以胯为轴倾斜
    if (lean) {
      const wgt = smooth(hipY + soft, hipY - soft, y);
      const a = -lean * wgt, c = Math.cos(a), s = Math.sin(a);
      const rx = x - cx, ry = y - hipY;
      x = cx + rx * c - ry * s; y = hipY + rx * s + ry * c;
    }
    // 5. 正面鞠躬：胯以上朝胯压缩
    //    只压躯干（脖子到胯），头整体往下平移——脸不变形
    if (bow && y < hipY) {
      const torso = hipY - neckY, neck2 = hipY - torso * (1 - bow);
      y = y >= neck2 ? hipY - (hipY - y) / (1 - bow) : y + (neckY - neck2);
    }
    // 6. 头部平移（点头 / 摇头）
    const hw = smooth(neckY + soft, neckY - soft * 0.5, y);
    x -= hdx * hw; y -= hdy * hw;
    // 7. 歪头
    if (head) {
      const a = -head * hw, c = Math.cos(a), s = Math.sin(a);
      const rx = x - cx, ry = y - neckY;
      x = cx + rx * c - ry * s; y = neckY + rx * s + ry * c;
    }
    const ux = Math.floor(x * 4), uy = Math.floor(y * 4);
    if (ux < 0 || uy < 0 || ux >= U.w || uy >= U.h) continue;
    out.d[Y * CW + X] = U.d[uy * U.w + ux];
  }
  return out;
}

/** 把 b 盖到 a 上（透明不盖） */
export function stamp(a, b, x0, y0) {
  for (let y = 0; y < b.h; y++) for (let x = 0; x < b.w; x++) {
    const v = b.d[y * b.w + x]; if (v === T) continue;
    const X = x + x0, Y = y + y0;
    if (X < 0 || Y < 0 || X >= a.w || Y >= a.h) continue;
    a.d[Y * a.w + X] = v;
  }
  return a;
}

/** 孤立杂点清理：四邻全透明的单个像素，或被同一种颜色四面包围的单个异色点 */
export function despeckle(s) {
  const o = clone(s);
  const g = (x, y) => (x < 0 || y < 0 || x >= s.w || y >= s.h ? T : s.d[y * s.w + x]);
  for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) {
    const v = g(x, y); if (v === T) continue;
    const n = [g(x - 1, y), g(x + 1, y), g(x, y - 1), g(x, y + 1)];
    if (n.every((q) => q === T)) o.d[y * s.w + x] = T;
  }
  return o;
}

export function flipX(s) {
  const o = blank(s.w, s.h);
  for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) o.d[y * s.w + x] = s.d[y * s.w + (s.w - 1 - x)];
  return o;
}

// ---------- RLE + base64（与 sprites_data.js 的 getBakedSprite 同一套）----------
export function encodeRLE(bytes) {
  const out = [];
  for (let i = 0; i < bytes.length;) {
    let n = 1;
    while (i + n < bytes.length && bytes[i + n] === bytes[i] && n < 255) n++;
    if (n >= 3) { out.push(254, n, bytes[i]); i += n; } else { out.push(bytes[i]); i++; }
  }
  return out;
}
