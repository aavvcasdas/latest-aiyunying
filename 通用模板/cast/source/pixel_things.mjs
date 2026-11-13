// pixel_things.mjs —— 道具（prop_*）与表情贴（fx_*）的像素格。
// 全部用几何笔画 + 自动描墨线画出来，颜色只取 px.js 调色板里的现成色（H('#rrggbb') 查不到就报错）。
// 设定出处：番外MV/人物设定.md 第 2 节每张卡的「道具」一格。
import { T, blank } from './motion_core.mjs';

export function makeThings(H) {
  const C = {
    ink: H('#181425'), w: H('#ffffff'), s: H('#c0cbdc'), S: H('#8b9bb4'), sl: H('#5a6988'), ds: H('#3a4466'),
    b: H('#0099db'), B: H('#124e89'), cy: H('#2ce8f5'), wl: H('#5fa8f5'), wm: H('#2762b3'), wd: H('#16386e'),
    r: H('#e43b44'), R: H('#a22633'), hot: H('#ff0044'), o: H('#f77622'), a: H('#feae34'), y: H('#fee761'),
    g: H('#63c74d'), G: H('#3e8948'), n: H('#b86f50'), N: H('#733e39'), u: H('#3e2731'), t: H('#e4a672'), d: H('#ead4aa'),
    p: H('#f6757a'), P: H('#b55088'), v: H('#68386c'), lav: H('#9d8df2'), ah: H('#f3e5c0'),
    q: H('#ffd166'), Q: H('#d9822b'), e: H('#fff3b0'), dv: H('#432375'), am: H('#7b4bc4'),
  };
  const mk = (w, h) => blank(w, h);
  const P = (s, x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < s.w && y < s.h) s.d[y * s.w + x] = c; };
  const rect = (s, x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) P(s, x + i, y + j, c); };
  const ell = (s, cx, cy, rx, ry, c, f = () => true) => {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const k = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2; if (k <= 1 && f(x, y)) P(s, x, y, c);
    }
  };
  const line = (s, x0, y0, x1, y1, c) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) || 1; for (let i = 0; i <= n; i++) P(s, x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, c); };
  /** 自动墨线：任何与实心像素四邻相接的透明像素涂成墨色 */
  const outline = (s, col = C.ink) => {
    const src = new Uint8Array(s.d);
    for (let y = 0; y < s.h; y++) for (let x = 0; x < s.w; x++) {
      if (src[y * s.w + x] !== T) continue;
      const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const X = x + dx, Y = y + dy; return X >= 0 && Y >= 0 && X < s.w && Y < s.h && src[Y * s.w + X] !== T && src[Y * s.w + X] !== col; });
      if (nb) s.d[y * s.w + x] = col;
    }
    return s;
  };

  const things = {};

  // —— 本鲸：蓝饭盆（满满一碗）
  things.prop_bowl = (() => {
    const s = mk(22, 16);
    ell(s, 11, 6, 8, 4.2, C.w); ell(s, 11, 5, 6, 3, C.w);
    [[7, 5], [12, 4], [15, 6], [9, 7], [13, 7]].forEach(([x, y]) => P(s, x, y, C.d));
    ell(s, 11, 7, 9.5, 7, C.wm, (x, y) => y >= 8);
    ell(s, 11, 7, 9.5, 7, C.wl, (x, y) => y >= 8 && y <= 9);
    ell(s, 11, 7, 9.5, 7, C.wd, (x, y) => y >= 12);
    line(s, 5, 10, 7, 12, C.w); rect(s, 14, 11, 3, 1, C.wl); // 高光与小鲸鳍纹
    rect(s, 7, 14, 9, 1, C.wd);
    return outline(s);
  })();

  // —— 龙娘 / 小克：沙漏（一大一小两只，这里出单只；小号用 size 缩）
  things.prop_hourglass = (() => {
    const s = mk(15, 20);
    rect(s, 1, 1, 13, 2, C.q); rect(s, 1, 17, 13, 2, C.q); rect(s, 1, 2, 13, 1, C.Q); rect(s, 1, 17, 13, 1, C.Q);
    for (let y = 3; y < 17; y++) {
      const k = Math.abs(y - 10) / 7, hw = Math.max(1, Math.round(5 * k));
      rect(s, 7 - hw, y, hw * 2 + 1, 1, C.s);
      if (y <= 5 && y >= 4) rect(s, 7 - hw + 1, y, hw * 2 - 1, 1, C.a);
      if (y >= 13) rect(s, 7 - hw + 1, y, hw * 2 - 1, 1, C.a);
    }
    line(s, 7, 6, 7, 13, C.a); P(s, 4, 4, C.w); P(s, 4, 15, C.w);
    rect(s, 0, 3, 1, 14, C.N); rect(s, 14, 3, 1, 14, C.N);
    return outline(s);
  })();

  // —— 小克：茶杯（带碟）
  things.prop_teacup = (() => {
    const s = mk(19, 14);
    rect(s, 3, 3, 11, 7, C.w); ell(s, 8.5, 9.5, 5.5, 2.5, C.w);
    ell(s, 8.5, 3, 5.5, 1.6, C.n); rect(s, 3, 6, 11, 1, C.p); P(s, 6, 6, C.r); P(s, 11, 6, C.r);
    ell(s, 15.5, 6, 2.5, 2.5, C.w, (x, y) => (x - 15.5) ** 2 + (y - 6) ** 2 >= 1.4);
    ell(s, 9, 12, 8.5, 1.6, C.s); rect(s, 4, 4, 1, 4, C.s);
    return outline(s);
  })();

  // —— 小克：书（折了一个角）
  things.prop_book = (() => {
    const s = mk(18, 15);
    rect(s, 1, 2, 16, 11, C.am); rect(s, 2, 3, 14, 9, C.lav); rect(s, 8, 2, 2, 11, C.dv);
    rect(s, 2, 12, 15, 1, C.ah);
    for (const y of [5, 7, 9]) { rect(s, 3, y, 4, 1, C.w); rect(s, 11, y, 4, 1, C.w); }
    P(s, 15, 3, C.ah); P(s, 14, 3, C.ah); P(s, 15, 4, C.ah);
    rect(s, 12, 0, 2, 4, C.r); // 书签
    return outline(s);
  })();

  // —— Kimi：卷轴 + 书签
  things.prop_scroll = (() => {
    const s = mk(22, 15);
    rect(s, 4, 2, 14, 11, C.ah);
    for (const [y, w] of [[4, 10], [6, 7], [8, 11], [10, 6]]) rect(s, 6, y, w, 1, C.t);
    rect(s, 1, 1, 3, 13, C.n); rect(s, 18, 1, 3, 13, C.n); rect(s, 2, 1, 1, 13, C.t); rect(s, 19, 1, 1, 13, C.t);
    rect(s, 14, 2, 2, 7, C.lav); P(s, 14, 9, C.lav); P(s, 15, 10, C.lav);
    return outline(s);
  })();

  // —— 千问：折扇
  things.prop_fan = (() => {
    const s = mk(23, 14);
    const cx = 11.5, cy = 12.5;
    for (let y = 0; y < 14; y++) for (let x = 0; x < 23; x++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy, r = Math.hypot(dx, dy), a = Math.atan2(-dy, dx);
      if (a < 0.2 || a > Math.PI - 0.2 || r > 11 || r < 3) continue;
      const seg = Math.floor((a - 0.2) / ((Math.PI - 0.4) / 9));
      P(s, x, y, r > 9.6 ? C.R : seg % 2 ? C.r : C.w);
    }
    ell(s, 11.5, 11, 3, 2, C.r, (x, y) => y <= 11); rect(s, 11, 11, 2, 2, C.q);
    return outline(s);
  })();

  // —— 狐狸：算盘
  things.prop_abacus = (() => {
    const s = mk(22, 14);
    rect(s, 1, 1, 20, 12, C.N); rect(s, 3, 3, 16, 8, C.u); rect(s, 3, 5, 16, 1, C.n);
    for (let i = 0; i < 5; i++) {
      const x = 4 + i * 3; rect(s, x + 1, 3, 1, 8, C.S);
      rect(s, x, 3 + (i % 2), 3, 1, C.r); rect(s, x, 7 + (i % 3 === 0 ? 0 : 1), 3, 1, C.a); rect(s, x, 9, 3, 1, C.a);
    }
    return outline(s);
  })();

  // —— 狐狸：眼罩
  things.prop_eyemask = (() => {
    const s = mk(22, 9);
    ell(s, 6.5, 4.5, 5.5, 3.5, C.ds); ell(s, 15.5, 4.5, 5.5, 3.5, C.ds); rect(s, 6, 2, 10, 5, C.ds);
    rect(s, 0, 4, 2, 1, C.N); rect(s, 20, 4, 2, 1, C.N);
    for (const cx of [6, 15]) { rect(s, cx - 2, 4, 5, 1, C.w); P(s, cx - 2, 3, C.w); P(s, cx + 2, 3, C.w); }
    return outline(s);
  })();

  // —— Grok：手机 / 放大镜 / 来源卡
  things.prop_phone = (() => {
    const s = mk(11, 18);
    rect(s, 1, 1, 9, 16, C.ds); rect(s, 2, 3, 7, 11, C.b); rect(s, 2, 3, 7, 3, C.cy);
    rect(s, 3, 8, 5, 1, C.w); rect(s, 3, 10, 3, 1, C.w); rect(s, 4, 15, 3, 1, C.q); rect(s, 4, 2, 3, 1, C.sl);
    return outline(s);
  })();
  things.prop_magnifier = (() => {
    const s = mk(18, 18);
    ell(s, 7, 7, 6, 6, C.s); ell(s, 7, 7, 4.4, 4.4, C.cy); ell(s, 7, 7, 4.4, 4.4, C.wl, (x, y) => x + y > 15);
    P(s, 5, 4, C.w); P(s, 4, 5, C.w); P(s, 5, 5, C.w);
    for (let i = 0; i < 6; i++) { rect(s, 11 + i, 11 + i, 2, 2, i < 1 ? C.S : C.N); }
    return outline(s);
  })();
  things.prop_card = (() => {
    const s = mk(18, 13);
    rect(s, 1, 1, 16, 11, C.w); rect(s, 1, 1, 16, 3, C.q); rect(s, 3, 6, 9, 1, C.S); rect(s, 3, 8, 12, 1, C.S);
    ell(s, 14, 9, 1.6, 1.6, C.r);
    return outline(s);
  })();

  // —— 豆包：篮子（盖着红布）与红舞鞋
  things.prop_basket = (() => {
    const s = mk(20, 17);
    ell(s, 10, 7, 6.5, 6, C.N, (x, y) => y <= 7 && (x - 10) ** 2 / 42 + (y - 7) ** 2 / 36 >= 0.62);
    rect(s, 2, 8, 16, 7, C.n);
    for (let y = 9; y < 15; y += 2) for (let x = 3 + (y % 4 === 1 ? 0 : 2); x < 17; x += 4) rect(s, x, y, 2, 1, C.t);
    ell(s, 10, 8, 8, 2.4, C.r); P(s, 6, 7, C.p); P(s, 13, 8, C.p); rect(s, 1, 8, 2, 3, C.r);
    return outline(s);
  })();
  things.prop_redshoes = (() => {
    const s = mk(22, 10);
    for (const ox of [1, 12]) {
      ell(s, ox + 5, 6, 4.5, 2.5, C.r); rect(s, ox + 1, 6, 9, 2, C.r); rect(s, ox + 1, 8, 9, 1, C.R);
      rect(s, ox + 3, 4, 3, 1, C.R); P(s, ox + 7, 5, C.p); rect(s, ox + 2, 3, 5, 1, C.r);
    }
    return outline(s);
  })();

  // —— 猫：猫耳钟、香蕉画笔
  things.prop_catclock = (() => {
    const s = mk(18, 19);
    for (const [x0, dir] of [[3, 1], [14, -1]]) for (let i = 0; i < 4; i++) rect(s, x0 - (dir < 0 ? i : 0), 1 + i, i + 1, 1, C.lav);
    ell(s, 9, 10.5, 7.5, 7.5, C.lav); ell(s, 9, 10.5, 6, 6, C.w);
    line(s, 9, 10, 9, 6, C.ink); line(s, 9, 10, 12, 11, C.ink); P(s, 9, 5, C.r); P(s, 9, 16, C.S); P(s, 4, 10, C.S); P(s, 14, 10, C.S);
    return outline(s);
  })();
  things.prop_brush = (() => {
    const s = mk(20, 12);
    for (let x = 2; x < 15; x++) { const yc = 6 - Math.sin((x - 2) / 13 * Math.PI) * 3; rect(s, x, Math.round(yc), 1, 3, C.y); P(s, x, Math.round(yc) + 2, C.a); }
    rect(s, 1, 6, 2, 2, C.N); rect(s, 15, 5, 2, 3, C.s); rect(s, 17, 5, 2, 3, C.lav); P(s, 19, 6, C.am);
    return outline(s);
  })();

  // ================= 表情贴 fx_* =================
  things.fx_heart = (() => { const s = mk(13, 12); ell(s, 4, 4, 3.2, 3.2, C.r); ell(s, 8.5, 4, 3.2, 3.2, C.r); for (let y = 4; y < 11; y++) rect(s, 1 + (y - 4), y, 11 - 2 * (y - 4), 1, C.r); P(s, 3, 3, C.p); P(s, 4, 2, C.w); return outline(s); })();
  things.fx_sweat = (() => { const s = mk(9, 13); ell(s, 4, 8, 3, 3.5, C.cy); for (let y = 1; y < 7; y++) rect(s, 4 - Math.floor((y - 1) / 2), y, 1 + 2 * Math.floor((y - 1) / 2), 1, C.cy); P(s, 3, 8, C.w); P(s, 3, 9, C.w); return outline(s); })();
  things.fx_anger = (() => {
    const s = mk(14, 14);
    for (const [x, y, w, h] of [[2, 4, 3, 2], [4, 2, 2, 3], [8, 2, 2, 3], [9, 4, 3, 2], [2, 8, 3, 2], [4, 9, 2, 3], [9, 8, 3, 2], [8, 9, 2, 3]]) rect(s, x, y, w, h, C.r);
    return outline(s);
  })();
  things.fx_exclaim = (() => { const s = mk(7, 16); rect(s, 2, 1, 3, 9, C.y); rect(s, 3, 1, 1, 8, C.e); rect(s, 2, 12, 3, 3, C.y); return outline(s); })();
  things.fx_question = (() => {
    const s = mk(11, 16);
    rect(s, 2, 1, 7, 2, C.w); rect(s, 1, 2, 2, 3, C.w); rect(s, 8, 2, 2, 4, C.w); rect(s, 6, 5, 3, 2, C.w); rect(s, 4, 6, 3, 3, C.w); rect(s, 4, 11, 3, 3, C.w);
    return outline(s);
  })();
  const zz = (n) => { const s = mk(22, 20); const Z = (x, y, k, c) => { rect(s, x, y, 3 * k + 1, k, c); for (let i = 0; i <= 3 * k; i++) rect(s, x + 3 * k - i, y + k + Math.floor(i * (k * 2 - 1) / (3 * k)), k, 1, c); rect(s, x, y + 3 * k, 3 * k + 1, k, c); };
    if (n >= 0) Z(1, 12 - 0, 1, C.w); if (n >= 1) Z(7, 6, 1, C.w); if (n >= 2) Z(13, 1, 2, C.w); return outline(s); };
  things.fx_zzz_0 = zz(0); things.fx_zzz_1 = zz(1); things.fx_zzz_2 = zz(2);
  const spark = (k) => { const s = mk(13, 13); const r = [2, 5, 3][k]; rect(s, 6, 6 - r, 1, 2 * r + 1, C.e); rect(s, 6 - r, 6, 2 * r + 1, 1, C.e); if (k === 1) { rect(s, 5, 5, 3, 3, C.y); P(s, 6, 6, C.w); } else P(s, 6, 6, C.w); return outline(s); };
  things.fx_sparkle_0 = spark(0); things.fx_sparkle_1 = spark(1); things.fx_sparkle_2 = spark(2);
  const dizzy = (k) => { const s = mk(26, 10); for (let i = 0; i < 3; i++) { const a = k * Math.PI / 6 + i * Math.PI * 2 / 3; const x = 13 + Math.cos(a) * 10, y = 5 + Math.sin(a) * 3; rect(s, x - 1, y, 3, 1, C.y); rect(s, x, y - 1, 1, 3, C.y); } return outline(s); };
  for (let k = 0; k < 4; k++) things[`fx_dizzy_${k}`] = dizzy(k);
  things.fx_bulb = (() => { const s = mk(13, 17); ell(s, 6.5, 6, 5, 5, C.y); ell(s, 5, 4.5, 1.8, 1.8, C.e); rect(s, 4, 10, 5, 2, C.y); rect(s, 4, 12, 5, 3, C.S); rect(s, 4, 13, 5, 1, C.s); return outline(s); })();
  const steam = (k) => { const s = mk(12, 16); for (let i = 0; i < 2; i++) for (let y = 1; y < 14; y++) P(s, 3 + i * 5 + Math.round(Math.sin((y + k * 3 + i * 4) / 2.2) * 1.4), y, C.w); return outline(s, C.s); };
  things.fx_steam_0 = steam(0); things.fx_steam_1 = steam(1); things.fx_steam_2 = steam(2);
  things.fx_gloom = (() => { const s = mk(20, 14); for (let i = 0; i < 4; i++) rect(s, 2 + i * 5, 1 + (i % 2) * 2, 1, 9 - (i % 2) * 2, C.lav); return outline(s, C.dv); })();
  things.fx_shine = (() => { const s = mk(24, 10); for (const [x0, y0, x1, y1] of [[2, 9, 5, 2], [11, 9, 11, 1], [21, 9, 18, 2]]) line(s, x0, y0, x1, y1, C.e); return outline(s, C.Q); })();

  return things;
}
