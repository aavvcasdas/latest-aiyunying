// @ts-nocheck
// 《反乌托邦》成片渲染：render(g, t) 是纯函数，同一个 t 永远同一帧（网页预览 / 导出 MP4 共用）。
// 渲染流程沿用坏女孩 Fable：天空 → 背景层 → 收集可绘制体 → 画家算法排序 → 后期 → 关键词 → 字幕 → 片头。
import { W, H, NEAR, PX, TAU, clamp, sm, mix3, hash, rgb, META, setEnv, Set3, makeCam, clipNear, drawWear } from './core';
import { pulse, dpulse, energy, beatK } from './beat';
import { LINES, DUR } from './lyrics';
import { SHOTS_RAW } from './shots';
import { getSet } from './sets';

export { W, H, DUR, LINES };
export const TITLE = '《反乌托邦》';
export const SHOTS = SHOTS_RAW.map((s, i) => ({ i, start: s.a, end: Math.min(s.b, DUR), name: s.name, set: s.set }));

// ---------- 角色（项目图集里的像素角色纸片 + 童话镇穿戴） ----------
const CAST = {
  whale: { walk: 'walk_whale_', front: ['whale_big_idle', 'whale_big_blink'] },
  claude: { walk: 'walk_claude_', front: ['claude_front_0', 'claude_front_1'], side: 'claude_side_', wear: 'crown' },
  kimi: { walk: 'walk_kimi_', front: ['kimi_front_0', 'kimi_front_1'], side: 'kimi_side_', wear: 'tiara' },
  gemini: { walk: 'walk_gemini_', front: ['gemini_front_0', 'gemini_front_1'], side: 'gemini_side_', wear: 'bow' },
  qwen: { walk: 'walk_qwen_', front: ['qwen_front_0', 'qwen_front_1'], side: 'qwen_side_', wear: 'tophat' },
  zai: { walk: 'walk_zai_', front: ['zai_front_0', 'zai_front_1'], side: 'zai_side_' },
  doubao: { walk: 'walk_doubao_big_', front: ['doubao_cage_0', 'doubao_cage_1'], wear: 'hood' },
  gpt: { walk: 'gpt_fly_', front: ['gpt_boss_idle', 'gpt_boss_blink'] },
};
for (const id in CAST) { let n = 0; while (META.s[CAST[id].walk + n]) n++; CAST[id].n = n; if (!n) throw new Error('缺角色步态：' + id); for (const k of CAST[id].front) if (!META.s[k]) throw new Error('缺角色造型：' + k); }
const cellScale = (key) => (key.startsWith('whale_big') ? 0.6 : key.startsWith('gpt_boss') ? 0.58 : 1) * PX;
function track(k, t) {
  const n = k.length; let dist = 0;
  if (t <= k[0][0]) return { x: k[0][1], z: k[0][2], y: k[0][3] || 0, vx: 0, vz: 0, dist: 0, moving: false };
  for (let i = 0; i < n - 1; i++) {
    const A = k[i], B = k[i + 1], dx = B[1] - A[1], dz = B[2] - A[2], L = Math.hypot(dx, dz), dt = B[0] - A[0];
    if (t >= B[0]) { dist += L; continue; }
    const q = (t - A[0]) / dt; return { x: A[1] + dx * q, z: A[2] + dz * q, y: (A[3] || 0) + ((B[3] || 0) - (A[3] || 0)) * q, vx: dx / dt, vz: dz / dt, dist: dist + L * q, moving: L / dt > 0.15 };
  }
  const Z = k[n - 1]; return { x: Z[1], z: Z[2], y: Z[3] || 0, vx: 0, vz: 0, dist, moving: false };
}
const STRIDE = 1.35; // 一轮 8 帧步态走过的世界距离：帧号由走过的距离决定，脚不打滑
function actorAt(a, t, cam) {
  const cs = CAST[a.c]; if (!cs) throw new Error('缺角色：' + a.c);
  let x, y, z, moving = false, dist = 0, vx = 0, vz = 0, flip = !!a.flip;
  if (a.at) { [x, y, z] = a.at(t); if (a.autoFlip) { const n = a.at(t + 0.04), p0 = cam.proj([x, y, z]), p1 = cam.proj(n); flip = !!(p0 && p1 && p1[0] < p0[0]); } }
  else { const tr = track(a.k, t); ({ x, y, z, moving, dist, vx, vz } = tr); }
  const bk = beatK(t), p = pulse(t);
  let key = null, bounce = 0, lean = a.lean ? a.lean(t) : 0;
  if (moving && !a.noWalk) {
    key = cs.walk + (Math.floor((dist / STRIDE) * cs.n) % cs.n);
    const p0 = cam.proj([x, 0, z]), p1 = cam.proj([x + vx * 0.2, 0, z + vz * 0.2]); flip = !!(p0 && p1 && p1[0] < p0[0]);
    bounce = 0.035 * Math.abs(Math.sin((dist / STRIDE) * Math.PI * 2));
  } else {
    key = a.pose ? a.pose(t) : null;
    if (a.dance) { if (!key) key = cs.side && bk % 4 >= 2 ? cs.side + (((bk % 2) + 2) % 2) : cs.front[0]; if (cs.side && bk % 8 >= 4) flip = !flip; bounce = 0.16 * p + 0.04 * Math.abs(Math.sin(t * 5 + (a.ph || 0))); lean += 0.07 * Math.sin(t * 4.2 + (a.ph || 0)); }
    if (!key) key = !a.noBlink && (t * 0.83 + (a.ph || 0) * 0.7 + a.c.length * 0.31) % 3.3 < 0.13 ? cs.front[1] : cs.front[0];
  }
  if (a.flipAt) { let n = 0; for (const ft of a.flipAt) if (t >= ft) n++; if (n % 2) flip = !flip; }
  if (!META.s[key]) throw new Error('缺角色造型：' + key);
  return { c: a.c, x, y, z, key, flip, bounce, lean, alpha: a.alpha ? clamp(a.alpha(t)) : 1, tint: a.tint, s: a.s || 1, wear: a.wear === undefined ? cs.wear : a.wear, gy: a.gy ?? 0, noShadow: a.noShadow };
}

const PAPER = '#f8f3e8';
const ST = { face: 0, sprite: 1, glow: 2, text: 3, custom: 4, line: 5, dot: 6, shadow: 7, beam: 8, photo: 9 };
const shotAt = (t) => { for (const s of SHOTS_RAW) if (t >= s.a && t < s.b) return s; return SHOTS_RAW[SHOTS_RAW.length - 1]; };

// ---------- 字幕：金边暗底条，唱到的字逐个染金（不写演唱者） ----------
function drawSubtitle(g, t) {
  let L = null;
  for (let i = 0; i < LINES.length; i++) { const l = LINES[i], nx = LINES[i + 1], end = nx ? nx.s - 0.08 : DUR; if (t >= l.s - 0.08 && t < end) { L = l; break; } }
  if (!L) return;
  const age = t - L.s, fs = 40; g.save(); g.font = `${fs}px BG`; g.textBaseline = 'middle'; g.textAlign = 'left';
  const ws = L.chars.map((c) => (c === ' ' ? fs * 0.3 : g.measureText(c).width + 2)), tw = ws.reduce((a, b) => a + b, 0), x0 = W / 2 - tw / 2, y = H - 58, pop = age > 0 && age < 0.25 ? 1 + 0.06 * Math.exp(-age * 12) * Math.cos(age * 20) : 1;
  g.translate(W / 2, y); g.scale(pop, pop); g.translate(-W / 2, -y);
  g.fillStyle = 'rgba(10,10,24,0.84)'; g.beginPath(); g.roundRect(x0 - 26, y - 34, tw + 52, 68, 6); g.fill(); g.strokeStyle = '#c9a227'; g.lineWidth = 2.5; g.stroke();
  let x = x0; L.chars.forEach((ch, i) => { const ct = L.ct[i]; if (ct != null) { const on = t >= ct, k = on ? clamp((t - ct) / 0.12) : 0; g.fillStyle = on ? '#ffd84a' : '#ffffff'; g.fillText(ch, x + 1, y + 2 - (on ? (1 - k) * 5 : 0)); } x += ws[i]; });
  g.restore();
}
// ---------- 画面里的大字：童话书贴纸样式（白边彩字），跟着唱到的字一个个弹出来 ----------
function drawWords(g, shot, t) {
  const list = shot.words; if (!list) return;
  for (let i = 0; i < list.length; i++) {
    const w = list[i], next = list[i + 1], end = Math.min(w.until ?? (next ? next.at - 0.04 : shot.b), shot.b);
    if (t < w.at - 0.03 || t >= end) continue;
    const out = clamp((end - t) / 0.14), size = w.size || 140, chars = Array.from(w.w);
    g.save(); g.font = `${size}px BG`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    const cw = chars.map((c) => g.measureText(c).width), tw = cw.reduce((a, b) => a + b, 0);
    let x = (w.x ?? 0.5) * W - tw / 2; const y = (w.y ?? 0.3) * H;
    chars.forEach((ch, j) => {
      const at = w.ts?.[j] ?? w.at, age = t - at; const cx = x + cw[j] / 2; x += cw[j];
      if (age < -0.03) return;
      const a = clamp(age / 0.08 + 0.4) * out, pop = 1 + 0.45 * Math.exp(-Math.max(0, age) * 13);
      g.save(); g.translate(cx, y + Math.sin(t * 3 + j) * 3); g.rotate(((j % 2) * 2 - 1) * 0.05); g.scale(pop, pop); g.globalAlpha = a;
      g.shadowColor = 'rgba(90,60,90,0.35)'; g.shadowBlur = size * 0.12; g.shadowOffsetY = size * 0.05;
      g.lineWidth = size * 0.17; g.strokeStyle = '#ffffff'; g.strokeText(ch, 0, 0);
      g.shadowColor = 'rgba(0,0,0,0)'; g.shadowBlur = 0; g.shadowOffsetY = 0; g.fillStyle = w.col || '#ff7f9f'; g.fillText(ch, 0, 0);
      g.restore();
    });
    g.restore();
  }
}
// ---------- 片头卡：只有歌名《反乌托邦》，别的一个字都不放 ----------
function drawTitle(g, t) {
  const a = Math.min(1, t / 0.4, (2.85 - t) / 0.45); if (a <= 0.002) return;
  g.save(); g.globalAlpha = a;
  const sc = 0.94 + 0.06 * Math.min(1, t / 0.45), fs = 104; g.translate(W / 2, 132); g.scale(sc, sc); g.font = `${fs}px BG`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  g.shadowColor = 'rgba(120,70,60,0.4)'; g.shadowBlur = 18; g.shadowOffsetY = 6; g.lineWidth = 20; g.strokeStyle = '#ffffff'; g.strokeText(TITLE, 0, 0);
  g.shadowColor = 'rgba(0,0,0,0)'; g.shadowBlur = 0; g.shadowOffsetY = 0;
  const gr = g.createLinearGradient(0, -fs / 2, 0, fs / 2); gr.addColorStop(0, '#ff9ab8'); gr.addColorStop(1, '#ff6184'); g.fillStyle = gr; g.fillText(TITLE, 0, 0);
  g.restore();
}

export function createFilm(env) {
  setEnv(env);
  const tmp = env.makeCanvas(200, 200), tg = tmp.getContext('2d');
  function render(g, tf, opts = {}) {
    const t = clamp(tf, 0, DUR - 0.001), S0 = opts.scale || 1, shot = shotAt(t);
    const u = t - shot.a, kq = clamp(u / (shot.b - shot.a)), p = pulse(t), dp = dpulse(t), e = energy(t), bk = beatK(t), set = getSet(shot.set);
    let pos, tgt, fov;
    if (shot.camf) ({ pos, tgt, fov } = shot.camf(t, kq, u));
    else { const [p0, t0, p1, t1, f] = shot.cam, k = (shot.ease || sm)(kq); tgt = mix3(t0, t1, k); const pp = mix3(p0, p1, k); pos = [pp[0] + Math.sin(t * 0.7) * 0.05, pp[1] + Math.sin(t * 0.9) * 0.03, pp[2]]; fov = f; }
    if (shot.shake) { const s = shot.shake(t, kq, p); pos = [pos[0] + (hash(t * 61.3) - 0.5) * s, pos[1] + (hash(t * 47.1 + 3) - 0.5) * s, pos[2]]; }
    pos = [pos[0], Math.max(0.2, pos[1]), pos[2]];
    const cam = makeCam(pos, tgt, fov - (shot.noZoom ? 0 : 0.6 * p)), F = cam.F, roll = shot.roll ? shot.roll(kq, t) : 0;
    g.setTransform(S0, 0, 0, S0, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.lineJoin = 'round'; g.lineCap = 'butt'; g.shadowBlur = 0;
    g.fillStyle = '#000'; g.fillRect(0, 0, W, H);
    if (roll) { const z = 1 + Math.abs(Math.sin(roll)) * 0.95; g.translate(W / 2, H / 2); g.rotate(roll); g.scale(z, z); g.translate(-W / 2, -H / 2); }
    // 天空
    const hy = H / 2 + (cam.f[1] / Math.max(0.05, Math.hypot(cam.f[0], cam.f[2]))) * F, sk = g.createLinearGradient(0, hy - 560, 0, hy);
    sk.addColorStop(0, set.sky[0]); sk.addColorStop(0.62, set.sky[1]); sk.addColorStop(1, set.sky[2]); g.fillStyle = sk; g.fillRect(0, 0, W, H);
    if (set.stars) { const yaw = Math.atan2(cam.f[0], -cam.f[2]); g.fillStyle = '#fff'; for (let i = 0; i < set.stars; i++) { const sx = (((hash(i) * 2400 - yaw * 700) % 2400) + 2400) % 2400 - 560, sy = set.starsAll ? hash(i + 99) * H : hy - 40 - hash(i + 99) * 520; if (sx < 0 || sx > W || sy < 0) continue; g.globalAlpha = 0.35 + 0.6 * hash(i + 7) * (0.7 + 0.3 * Math.sin(t * 2 + i)); g.fillRect(sx, sy, 2, 2); } g.globalAlpha = 1; }
    const ctx = { t, u, k: kq, p, dp, e, bk, cam, set, shot, a: shot.a, b: shot.b, penX: shot.sketch ? shot.sketch(kq, t) : null };
    if (set.bg && !shot.paper) set.bg(g, t, cam, ctx);
    if (!set.noFloor) { g.fillStyle = rgb(set.fog); g.fillRect(-W, Math.max(-H, hy), W * 3, H * 3); }
    if (ctx.penX != null) { const sp = shot.paper ? null : cam.proj([ctx.penX, 0, shot.penZ ?? -6]), px = shot.paper ? 0 : sp ? clamp(sp[0], 0, W) : W; g.fillStyle = PAPER; g.fillRect(px, 0, W - px, H); }
    // 收集可绘制体
    const ents = []; let seq = 0;
    const S2 = new Set3({ light: set.L, amb: set.amb });
    const adder = {
      glow: (q3, r, col, a = 1) => { const q = cam.proj(q3); if (q) ents.push({ k: q[2], t: ST.glow, q, r, col, a }); },
      text: (q3, str, size, col, a = 1, plain = false) => { const q = cam.proj(q3); if (q) ents.push({ k: q[2] - 0.7, t: ST.text, q, str, size, col, a, plain }); },
      custom: (q3, fn, bias = 0) => { const q = cam.proj(q3); if (q) ents.push({ k: q[2] - 0.05 - bias, t: ST.custom, q, fn }); },
      dot: (q3, r, col, a = 1) => { const q = cam.proj(q3); if (q) ents.push({ k: q[2], t: ST.dot, q, r, col, a }); },
      line: (a, b, w, col, alpha = 1) => { let ca = cam.toCam(a), cb = cam.toCam(b); if (ca[2] < NEAR && cb[2] < NEAR) return; if (ca[2] < NEAR) { const q = (NEAR - ca[2]) / (cb[2] - ca[2]); ca = [ca[0] + (cb[0] - ca[0]) * q, ca[1] + (cb[1] - ca[1]) * q, NEAR]; } else if (cb[2] < NEAR) { const q = (NEAR - cb[2]) / (ca[2] - cb[2]); cb = [cb[0] + (ca[0] - cb[0]) * q, cb[1] + (ca[1] - cb[1]) * q, NEAR]; } const z = (ca[2] + cb[2]) / 2; ents.push({ k: z, t: ST.line, x0: W / 2 + (ca[0] / ca[2]) * F, y0: H / 2 - (ca[1] / ca[2]) * F, x1: W / 2 + (cb[0] / cb[2]) * F, y1: H / 2 - (cb[1] / cb[2]) * F, w: Math.max(1, (w * F) / z), col, alpha, z }); },
      beam: (top, floor, r, col, a) => { const q0 = cam.proj(top), q1 = cam.proj([floor[0] - r, floor[1], floor[2]]), q2 = cam.proj([floor[0] + r, floor[1], floor[2]]); if (q0 && q1 && q2) ents.push({ k: (q0[2] + q1[2]) / 2 - 0.5, t: ST.beam, q0, q1, q2, col, a }); },
      photo: (tl, tr, bl, key, a = 1) => { const p0 = cam.proj(tl), p1 = cam.proj(tr), p2 = cam.proj(bl), p3 = cam.proj([tr[0] + bl[0] - tl[0], tr[1] + bl[1] - tl[1], tr[2] + bl[2] - tl[2]]); if (p0 && p1 && p2 && p3) ents.push({ k: (p0[2] + p1[2] + p2[2] + p3[2]) / 4 - 0.2, t: ST.photo, p0, p1, p2, key, a }); },
    };
    Object.assign(ctx, { add: adder, S2 });
    const states = shot.actors.map((a) => actorAt(a, t, cam)); ctx.st = states;
    if (set.dyn && !shot.noDyn) set.dyn(t, adder, S2, p, e, ctx);
    if (!shot.paper) for (const gl of set.glows) adder.glow(gl.pos, gl.r, gl.col, gl.a);
    for (const tx of set.texts) adder.text(tx.pos, tx.str, tx.size, tx.col, tx.plain ? 1 : 0.82 + 0.18 * p - (Math.sin(t * 23 + tx.pos[0]) > 0.94 ? 0.4 : 0), tx.plain);
    if (!shot.paper) for (const ln of set.lines) adder.line(ln.a, ln.b, ln.w, ln.col, ln.alpha);
    if (shot.fx) shot.fx(ctx);
    for (const st of states) {
      if (st.alpha <= 0.01) continue; const q = cam.proj([st.x, st.y, st.z]); if (!q) continue;
      ents.push({ k: q[2], t: ST.sprite, q, st });
      if (!set.noShadow && !st.noShadow) { const gq = cam.proj([st.x, st.gy + 0.01, st.z]); if (gq) ents.push({ k: st.gy > 0.05 ? q[2] + 0.02 : 1e7 - 9e4 - seq++ * 1e-3, t: ST.shadow, q: gq, a: st.alpha * 0.3 * clamp(1 - (st.y - st.gy)) }); }
    }
    const pushFaces = (faces) => {
      for (let i = 0; i < faces.length; i++) {
        const f = faces[i], cp = cam.pos;
        if (!f.two && f.n[0] * (f.c[0] - cp[0]) + f.n[1] * (f.c[1] - cp[1]) + f.n[2] * (f.c[2] - cp[2]) >= 0) continue;
        let poly = f.pts.map(cam.toCam), cl = false; for (const q of poly) if (q[2] < NEAR) { cl = true; break; }
        if (cl) { poly = clipNear(poly); if (poly.length < 3) continue; }
        const n = poly.length, xy = new Array(n * 2); let zs = 0, minx = 1e9, maxx = -1e9, miny = 1e9, maxy = -1e9;
        for (let j = 0; j < n; j++) { const z = poly[j][2], x = W / 2 + (poly[j][0] / z) * F, y = H / 2 - (poly[j][1] / z) * F; xy[j * 2] = x; xy[j * 2 + 1] = y; zs += z; if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y; }
        if (maxx < -W * 0.6 || minx > W * 1.6 || maxy < -H * 0.6 || miny > H * 1.6) continue;
        ents.push({ k: f.layer === 0 ? 1e7 - f.order * 1e4 - seq++ * 1e-3 : zs / n + f.bias, t: ST.face, f, xy, z: zs / n });
      }
    };
    pushFaces(set.faces); pushFaces(S2.faces);
    ents.sort((a, b) => b.k - a.k);
    const fogK = (z, emit) => clamp((z - set.fogNear) / (set.fogFar - set.fogNear)) * (emit ? 0.55 : 1), fg = set.fog, penX = ctx.penX;
    for (const en of ents) {
      switch (en.t) {
        case ST.face: {
          const f = en.f, xy = en.xy;
          g.beginPath(); g.moveTo(xy[0], xy[1]); for (let j = 2; j < xy.length; j += 2) g.lineTo(xy[j], xy[j + 1]); g.closePath();
          if (penX != null && f.c[0] > penX) { g.fillStyle = PAPER; g.fill(); if (f.edge) { g.strokeStyle = 'rgba(70,62,52,0.85)'; g.lineWidth = 1.3; g.stroke(); } break; }
          const base = f.colFn ? f.colFn(t, p, bk) : f.col, q = fogK(en.z, f.emit), r = base[0] + (fg[0] - base[0]) * q, gg = base[1] + (fg[1] - base[1]) * q, b = base[2] + (fg[2] - base[2]) * q, css = `rgb(${r | 0},${gg | 0},${b | 0})`;
          if (f.alpha < 1) { g.globalAlpha = f.alpha; g.fillStyle = css; g.fill(); g.globalAlpha = 1; break; }
          g.fillStyle = css; g.fill(); g.strokeStyle = f.edge ? `rgb(${(r * 0.84) | 0},${(gg * 0.82) | 0},${(b * 0.86) | 0})` : css; g.lineWidth = f.edge ? 1.2 : 1; g.stroke(); break;
        }
        case ST.shadow: { const kk = en.q[3]; g.fillStyle = `rgba(0,0,0,${en.a})`; g.beginPath(); g.ellipse(en.q[0], en.q[1], 0.42 * kk, 0.42 * kk * clamp(Math.abs(cam.f[1]) + 0.12, 0.12, 0.6), 0, 0, TAU); g.fill(); break; }
        case ST.sprite: {
          const st = en.st, cell = META.s[st.key], kk = en.q[3], sc = cellScale(st.key) * st.s * kk, cw = cell[2], ch = cell[3], tint = st.tint || set.tint, dark = st.tint && /0\.(8|9)\d*\)$/.test(st.tint) ? st.tint : false;
          const draw = (alpha, mirror) => {
            g.save(); g.globalAlpha = alpha; g.translate(en.q[0], en.q[1] - (mirror ? -st.bounce * kk : st.bounce * kk)); g.rotate(mirror ? -st.lean : st.lean); g.scale((st.flip ? -1 : 1) * sc, (mirror ? -1 : 1) * sc); g.imageSmoothingEnabled = false;
            if (st.wear) drawWear(g, st.wear, ch, true, dark);
            if (tint) { tg.globalCompositeOperation = 'source-over'; tg.clearRect(0, 0, 200, 200); tg.drawImage(env.atlas, cell[0], cell[1], cw, ch, 0, 0, cw, ch); tg.globalCompositeOperation = 'source-atop'; tg.fillStyle = tint; tg.fillRect(0, 0, cw, ch); g.drawImage(tmp, 0, 0, cw, ch, -cw / 2, -ch, cw, ch); }
            else g.drawImage(env.atlas, cell[0], cell[1], cw, ch, -cw / 2, -ch, cw, ch);
            if (st.wear) drawWear(g, st.wear, ch, false, dark);
            g.restore();
          };
          if (set.mirror && st.y - st.gy < 0.05) { const rq = cam.proj([st.x, st.gy, st.z]); if (rq) draw(st.alpha * 0.22, true); }
          draw(st.alpha, false); break;
        }
        case ST.glow: { const R = en.r * en.q[3]; if (R < 1) break; const x = en.q[0], y = en.q[1], gr = g.createRadialGradient(x, y, 0, x, y, R); gr.addColorStop(0, rgb(en.col, en.a)); gr.addColorStop(1, rgb(en.col, 0)); g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(x - R, y - R, R * 2, R * 2); g.globalCompositeOperation = 'source-over'; break; }
        case ST.text: { const fs = en.size * en.q[3]; if (fs < 4) break; g.save(); g.globalAlpha = clamp(en.a); g.font = `${fs}px BG`; g.textAlign = 'center'; g.textBaseline = 'middle'; if (en.plain) { g.fillStyle = en.col; g.fillText(en.str, en.q[0], en.q[1]); g.restore(); break; } g.shadowColor = en.col; g.shadowBlur = fs * 0.35; g.fillStyle = en.col; g.fillText(en.str, en.q[0], en.q[1]); g.shadowBlur = fs * 0.1; g.fillStyle = '#fff'; g.fillText(en.str, en.q[0], en.q[1]); g.restore(); break; }
        case ST.custom: g.save(); en.fn(g, en.q[0], en.q[1], en.q[3]); g.restore(); g.globalAlpha = 1; break;
        case ST.line: { const q = fogK(en.z, true), c = en.col; g.globalAlpha = clamp(en.alpha); g.strokeStyle = `rgb(${(c[0] + (fg[0] - c[0]) * q) | 0},${(c[1] + (fg[1] - c[1]) * q) | 0},${(c[2] + (fg[2] - c[2]) * q) | 0})`; g.lineWidth = en.w; g.lineCap = 'round'; g.beginPath(); g.moveTo(en.x0, en.y0); g.lineTo(en.x1, en.y1); g.stroke(); g.globalAlpha = 1; break; }
        case ST.dot: { const R = Math.max(0.8, en.r * en.q[3]); g.globalAlpha = clamp(en.a); g.fillStyle = rgb(en.col); g.beginPath(); g.arc(en.q[0], en.q[1], R, 0, TAU); g.fill(); g.globalAlpha = 1; break; }
        case ST.beam: { g.globalCompositeOperation = 'lighter'; g.fillStyle = rgb(en.col, clamp(en.a)); g.beginPath(); g.moveTo(en.q0[0], en.q0[1]); g.lineTo(en.q1[0], en.q1[1]); g.lineTo(en.q2[0], en.q2[1]); g.closePath(); g.fill(); g.globalCompositeOperation = 'source-over'; break; }
        case ST.photo: {
          let { p0, p1, p2 } = en; if (p1[0] < p0[0]) { const p3 = [p1[0] + p2[0] - p0[0], p1[1] + p2[1] - p0[1]]; [p0, p1, p2] = [p1, p0, p3]; }
          const cell = META.s[en.key]; if (!cell) throw new Error('缺相片：' + en.key);
          g.save(); g.globalAlpha = en.a; g.transform(p1[0] - p0[0], p1[1] - p0[1], p2[0] - p0[0], p2[1] - p0[1], p0[0], p0[1]);
          g.fillStyle = '#fffaf0'; g.fillRect(-0.07, -0.07, 1.14, 1.24); g.imageSmoothingEnabled = false; g.drawImage(env.atlas, cell[0], cell[1], cell[2], cell[3], 0, 0, 1, 1); g.restore(); break;
        }
      }
    }
    // 后期：雨、褪色、回忆暖光、HUD、暗角、闪白、关键词、字幕、片头、转场
    g.setTransform(S0, 0, 0, S0, 0, 0);
    if (set.rain) { g.strokeStyle = 'rgba(190,210,255,0.5)'; g.lineWidth = 1.5; g.beginPath(); for (let i = 0; i < 110; i++) { const x = (hash(i) * 1500 + t * -120 * (0.7 + hash(i + 3))) % 1400, y = ((hash(i + 50) * 800 + t * 1100 * (0.7 + hash(i + 9) * 0.6)) % 800) - 40; g.moveTo(x, y); g.lineTo(x - 5, y + 22); } g.stroke(); g.fillStyle = 'rgba(40,60,140,0.12)'; g.fillRect(0, 0, W, H); }
    if (shot.desat) { g.globalCompositeOperation = 'saturation'; g.fillStyle = `rgba(128,128,128,${shot.desat})`; g.fillRect(0, 0, W, H); g.globalCompositeOperation = 'source-over'; }
    if (shot.warm) { const wg = g.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 760); wg.addColorStop(0, 'rgba(255,240,210,0.05)'); wg.addColorStop(1, 'rgba(255,226,170,0.62)'); g.fillStyle = wg; g.fillRect(0, 0, W, H); }
    if (shot.post) shot.post(g, ctx);
    if (shot.hud) shot.hud(g, ctx);
    const vg = g.createRadialGradient(W / 2, H / 2, 280, W / 2, H / 2, 840); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(80,44,84,${0.2 - 0.05 * p})`); g.fillStyle = vg; g.fillRect(0, 0, W, H);
    if (shot.flash && dp > 0.5) { g.fillStyle = '#fff'; g.globalAlpha = 0.12 * dp; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
    drawWords(g, shot, t);
    if (opts.subtitles !== false) drawSubtitle(g, t);
    drawTitle(g, t);
    const fin = clamp(u / 0.16); if (fin < 1 && t > 0.6) { g.fillStyle = '#fff8ec'; g.globalAlpha = (1 - fin) * 0.32; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
    if (t < 0.35) { g.fillStyle = '#fff8ec'; g.globalAlpha = 1 - t / 0.35; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
    if (t > DUR - 0.8) { g.fillStyle = '#fff8ec'; g.globalAlpha = clamp((t - (DUR - 0.8)) / 0.7); g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
    return { shot: shot.name, ents: ents.length };
  }
  return { render };
}
