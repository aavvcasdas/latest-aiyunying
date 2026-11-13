// 软立体逐字字幕：每个字按自己的卡点入场。
//  · 纸条小字：一张带厚度的米白纸片翻贴上去。
//  · 立体大字：多层挤出的厚边 + 柔和渐变面 + 投影；落定之后挤出方向和倾斜缓慢摆动，
//    看起来像一块软软的立体字在呼吸；起砸 → 落定之间从大缩到原位，落地有回弹。
import { CREAM, FONT, W, backOut, beatPulse, clamp, easeIn, easeOut, hash, lerp, rr, seg, type Ctx } from './core';
import { LINES, type Ch, type Line, type Style } from './cues';

interface Big {
  size: number;
  adv: number;
  face: [string, string];
  side: [string, string];
  depth: number;
  rim?: string;
  rimW?: number;
  dash?: string;
  enter: 'stitch' | 'grow' | 'rise' | 'slam';
  ring?: string;
  skew?: number;
  drift?: boolean;
}

const BIG: Partial<Record<Style, Big>> = {
  quilt: { size: 176, adv: 170, face: ['#ffc2d2', '#ea6c91'], side: ['#c5507a', '#8f3458'], depth: 13, rim: '#b9466e', rimW: 10, dash: '#fff4ea', enter: 'stitch' },
  cozy: { size: 168, adv: 164, face: ['#cdd8e8', '#7f93b2'], side: ['#5a6c8e', '#3b4a6a'], depth: 13, rim: '#f6f0e2', rimW: 9, enter: 'grow' },
  wind: { size: 226, adv: 206, face: ['#ffffff', '#b4ebe4'], side: ['#4cb6b0', '#2a888b'], depth: 15, enter: 'rise', skew: -0.22, drift: true },
  mist: { size: 164, adv: 156, face: ['#ffffff', '#ded0f2'], side: ['#a893d1', '#7a66aa'], depth: 12, enter: 'grow', drift: true },
  perfume: { size: 172, adv: 166, face: ['#ffc4d1', '#f0728f'], side: ['#c0507a', '#8c3258'], depth: 13, rim: '#b9466e', rimW: 10, dash: '#fff4ea', enter: 'stitch' },
  love: { size: 186, adv: 178, face: ['#ff6373', '#d01f3a'], side: ['#96122b', '#640a1e'], depth: 14, rim: '#8e1029', rimW: 10, dash: '#ffe9de', enter: 'grow' },
  heel: { size: 150, adv: 146, face: ['#ff6e7c', '#da2240'], side: ['#e9b550', '#ad7620'], depth: 12, rim: '#fff6e6', rimW: 8, enter: 'slam', ring: '#ffd98a' },
  gold: { size: 200, adv: 190, face: ['#fffef8', '#f0e1bd'], side: ['#e6b04c', '#a67022'], depth: 16, enter: 'slam', ring: '#ffe6a8' },
  title: { size: 272, adv: 262, face: ['#fffef8', '#f0e1bd'], side: ['#e6b04c', '#a06a1e'], depth: 24, enter: 'slam', ring: '#ffe6a8' },
};

interface Slot {
  ch: Ch;
  i: number;
  cx: number;
  cy: number;
  seed: number;
}

const advOf = (ch: Ch) => (ch.s === 'tag' ? 104 : ch.s === 'sign' || ch.s === 'stamp' ? 160 : BIG[ch.s]!.adv * (ch.k || 1));

const CACHE = new Map<string, Slot[]>();
function layout(line: Line): Slot[] {
  let slots = CACHE.get(line.id);
  if (slots) return slots;
  const ws = line.chars.map(advOf);
  const total = ws.reduce((a, b) => a + b, 0);
  let x = line.center ? (W - total) / 2 : 62;
  const y = line.y ?? 110;
  const lid = LINES.indexOf(line);
  slots = line.chars.map((ch, i) => {
    const s: Slot = { ch, i, cx: x + ws[i] / 2, cy: ch.s === 'tag' ? y : y + 6, seed: lid * 31 + i * 7 + 1 };
    x += ws[i];
    return s;
  });
  CACHE.set(line.id, slots);
  return slots;
}

/** 挤出方向：落定后缓慢摆动，这就是「软立体」的来源 */
function extrude(t: number, i: number, depth: number): [number, number] {
  const th = 0.95 + Math.sin(t * 0.9 + i * 0.6) * 0.3;
  return [Math.cos(th) * depth, Math.sin(th) * depth];
}

function paperPath(ctx: Ctx, seed: number, b: number, ox: number, oy: number) {
  const j = (n: number) => (hash(seed * 7.3 + n) - 0.5) * 6;
  ctx.beginPath();
  ctx.moveTo(-b + j(1) + ox, -b + j(2) + oy);
  ctx.lineTo(j(3) + ox, -b + j(4) * 0.6 + oy);
  ctx.lineTo(b + j(5) + ox, -b + j(6) + oy);
  ctx.lineTo(b + j(7) * 0.6 + ox, j(8) + oy);
  ctx.lineTo(b + j(9) + ox, b + j(10) + oy);
  ctx.lineTo(j(11) + ox, b + j(12) * 0.6 + oy);
  ctx.lineTo(-b + j(13) + ox, b + j(14) + oy);
  ctx.lineTo(-b + j(15) * 0.6 + ox, j(16) + oy);
  ctx.closePath();
}

function setFont(ctx: Ctx, size: number) {
  ctx.font = `${size}px ${FONT}, "PingFang SC", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
}

function drawGlyph(ctx: Ctx, c: string, st: Big, t: number, i: number, reveal: number) {
  setFont(ctx, st.size);
  if (reveal < 1) {
    // 绗缝入场：先一针一针缝出虚线轮廓，落定那一下才填满
    ctx.save();
    ctx.beginPath();
    ctx.rect(-st.size, -st.size * 0.62, st.size * 2, st.size * 1.24 * reveal);
    ctx.clip();
    ctx.globalAlpha *= 0.3 * reveal;
    ctx.fillStyle = st.face[1];
    ctx.fillText(c, 0, 0);
    ctx.globalAlpha /= 0.3 * reveal || 1;
    ctx.setLineDash([11, 9]);
    ctx.lineWidth = 5;
    ctx.strokeStyle = st.dash || CREAM;
    ctx.strokeText(c, 0, 0);
    ctx.restore();
    return;
  }
  const [ex, ey] = extrude(t, i, st.depth);
  // 投影
  ctx.fillStyle = 'rgba(14,8,32,.3)';
  ctx.fillText(c, ex * 1.5 + 5, ey * 1.5 + 9);
  // 厚边：一层层往后叠
  const n = Math.ceil(st.depth / 1.7);
  for (let j = n; j >= 1; j--) {
    const u = j / n;
    const col = u > 0.55 ? st.side[1] : st.side[0];
    if (st.rim || j === n) {
      ctx.lineWidth = st.rim ? st.rimW! : 4;
      ctx.strokeStyle = col;
      ctx.strokeText(c, ex * u, ey * u);
    }
    ctx.fillStyle = col;
    ctx.fillText(c, ex * u, ey * u);
  }
  if (st.rim) {
    ctx.lineWidth = st.rimW!;
    ctx.strokeStyle = st.rim;
    ctx.strokeText(c, 0, 0);
  }
  // 正面：自上而下的柔和渐变
  const g = ctx.createLinearGradient(0, -st.size * 0.5, 0, st.size * 0.5);
  g.addColorStop(0.1, st.face[0]);
  g.addColorStop(0.9, st.face[1]);
  ctx.fillStyle = g;
  ctx.fillText(c, 0, 0);
  if (st.dash) {
    ctx.setLineDash([10, 8]);
    ctx.lineWidth = 3.2;
    ctx.strokeStyle = st.dash;
    ctx.strokeText(c, 0, 0);
    ctx.setLineDash([]);
  }
}

function drawTag(ctx: Ctx, c: string, seed: number) {
  const b = 45;
  ctx.fillStyle = 'rgba(12,8,28,.32)';
  paperPath(ctx, seed, b, 5, 8);
  ctx.fill();
  ctx.fillStyle = '#cbbd9f';
  paperPath(ctx, seed, b, 2.5, 4);
  ctx.fill();
  ctx.fillStyle = '#f7f1e2';
  paperPath(ctx, seed, b, 0, 0);
  ctx.fill();
  setFont(ctx, 62);
  ctx.fillStyle = '#39323f';
  ctx.fillText(c, 0, 2);
}

function drawSign(ctx: Ctx, c: string, t: number, i: number) {
  const b = 70;
  const [ex, ey] = extrude(t, i, 9);
  ctx.fillStyle = 'rgba(8,6,26,.35)';
  ctx.fillRect(-b + ex * 1.5 + 4, -b + ey * 1.5 + 8, b * 2, b * 2);
  ctx.fillStyle = '#0f1338';
  for (let j = 6; j >= 1; j--) ctx.fillRect(-b + (ex * j) / 6, -b + (ey * j) / 6, b * 2, b * 2);
  const g = ctx.createLinearGradient(0, -b, 0, b);
  g.addColorStop(0, '#2f3866');
  g.addColorStop(1, '#222a52');
  ctx.fillStyle = g;
  ctx.fillRect(-b, -b, b * 2, b * 2);
  ctx.lineWidth = 5;
  ctx.strokeStyle = CREAM;
  ctx.strokeRect(-b + 2.5, -b + 2.5, b * 2 - 5, b * 2 - 5);
  setFont(ctx, 104);
  ctx.fillStyle = 'rgba(8,6,26,.45)';
  ctx.fillText(c, 3, 6);
  ctx.fillStyle = '#fbf5e4';
  ctx.fillText(c, 0, 1);
}

function drawStamp(ctx: Ctx, c: string) {
  const b = 68;
  const red = '#d62b3d';
  ctx.fillStyle = 'rgba(214,43,61,.16)';
  ctx.beginPath();
  rr(ctx, -b, -b, b * 2, b * 2, 14);
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = red;
  ctx.beginPath();
  rr(ctx, -b, -b, b * 2, b * 2, 14);
  ctx.stroke();
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  rr(ctx, -b + 12, -b + 12, b * 2 - 24, b * 2 - 24, 8);
  ctx.stroke();
  setFont(ctx, 104);
  ctx.fillStyle = 'rgba(214,43,61,.28)';
  ctx.fillText(c, 4, 5);
  ctx.fillStyle = red;
  ctx.fillText(c, 0, 1);
}

function drawSlot(ctx: Ctx, line: Line, s: Slot, t: number) {
  const { ch, i } = s;
  const age = t - ch.t;
  const d = ch.land - ch.t;
  const la = t - ch.land;
  const k = seg(age, 0, d);
  const flipSign = i % 2 ? 1 : -1;
  let a = 1, ox = 0, oy = 0, rot = 0, sc = 1;

  // 退场
  const te = t - line.out - (line.exit === 'tumble' ? i * 0.022 : 0);
  if (te > 0) {
    if (line.exit === 'fade') {
      const q = seg(te, 0, 0.42);
      a *= 1 - q;
      oy -= 16 * easeIn(q);
    } else {
      const q = seg(te, 0, 0.45);
      a *= 1 - q;
      rot += q * 1.7 * flipSign;
      sc *= 1 - 0.5 * q;
      ox -= 46 * q;
      oy += -26 * q + 50 * q * q;
    }
  }
  if (ch.drop !== undefined && t > ch.drop) {
    const td = t - ch.drop;
    oy += 1500 * td * td;
    rot += td * 2.4;
    ox += 70 * td;
  }
  if (ch.tilt !== undefined && t > ch.tilt) {
    const q = easeOut(seg(t, ch.tilt, ch.tilt + 0.25));
    rot -= 0.14 * q;
    oy -= 14 * q;
  }
  if (a <= 0.004) return;

  const squash = la > 0 ? Math.exp(-la * 9) * Math.sin(la * 34) * 0.1 : 0;
  const live = clamp(la * 4);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.translate(s.cx + ox, s.cy + oy);

  if (ch.s === 'tag') {
    const baseRot = (hash(s.seed) - 0.5) * 0.11;
    ctx.translate(0, -24 * (1 - easeOut(k)));
    ctx.rotate(rot + baseRot + (1 - k) * 0.28 * flipSign);
    ctx.scale(sc * lerp(0.6, 1, backOut(k)), sc * Math.max(0.06, backOut(k)));
    ctx.globalAlpha *= clamp(k * 3);
    drawTag(ctx, ch.c, s.seed);
  } else if (ch.s === 'sign' || ch.s === 'stamp') {
    const slam = lerp(3.0, 1, easeIn(k));
    const baseRot = ch.s === 'stamp' ? (i % 2 ? 0.05 : -0.07) : (hash(s.seed) - 0.5) * 0.07;
    ctx.rotate(rot + baseRot + (1 - k) * 0.3 * flipSign + Math.sin(t * 1.5 + i) * 0.018 * live);
    ctx.scale(sc * slam * (1 + squash), sc * slam * (1 - squash));
    ctx.globalAlpha *= lerp(0.22, ch.s === 'stamp' ? 0.92 : 1, k);
    if (ch.s === 'sign') drawSign(ctx, ch.c, t, i);
    else drawStamp(ctx, ch.c);
  } else {
    const st = BIG[ch.s]!;
    const K = ch.k || 1;
    let al = 1, r0 = 0, reveal = 1, rise = 0, es = 1;
    if (st.enter === 'slam') {
      es = lerp(3.1, 1, easeIn(k));
      al = lerp(0.22, 1, k);
      r0 = (1 - k) * 0.22 * flipSign;
    } else if (st.enter === 'grow') {
      es = lerp(0.12, 1, backOut(k));
      al = clamp(k * 2.5);
    } else if (st.enter === 'rise') {
      rise = (1 - easeOut(k)) * 110;
      es = lerp(0.7, 1, easeOut(k));
      al = clamp(k * 2);
    } else {
      reveal = k;
      if (la > 0) es = 1 + 0.16 * Math.exp(-la * 13);
    }
    const sway = Math.sin(t * 1.6 + i * 1.3) * 0.03 * live;
    const sk = (st.skew || 0) + Math.sin(t * 1.25 + i * 0.9) * 0.035 * live;
    const bob = (st.drift ? Math.sin(t * 2.1 + i * 1.1) * 9 : Math.sin(t * 1.9 + i) * 2.5) * live;
    const bp = 1 + 0.022 * beatPulse(t) * live;
    ctx.translate(0, bob + rise);
    ctx.rotate(rot + r0 + sway);
    ctx.transform(1, 0, sk, 1, 0, 0);
    ctx.scale(sc * es * K * bp * (1 + squash), sc * es * K * bp * (1 - squash));
    ctx.globalAlpha *= al;
    drawGlyph(ctx, ch.c, st, t, i, reveal);
  }
  ctx.restore();
}

const CONFETTI = ['#ffe6a8', '#f58aa8', '#8fd0ea', '#fff7e6', '#e8405a', '#b9e3a8'];

/** 落定那一下的冲击环、射线、纸屑 */
function drawImpact(ctx: Ctx, line: Line, s: Slot, t: number) {
  const { ch } = s;
  const la = t - ch.land;
  if (la < 0 || la > 1 || t > line.out) return;
  const st = BIG[ch.s];
  const ring = ch.s === 'stamp' ? '#e8566a' : st?.ring;
  if (!ring) return;
  const K = (ch.k || 1) * (ch.s === 'title' ? 1.35 : 1);
  ctx.save();
  ctx.translate(s.cx, s.cy);
  const k = seg(la, 0, 0.4);
  if (k < 1) {
    const r = lerp(64, 175, easeOut(k)) * K;
    ctx.globalAlpha = 1 - k;
    ctx.strokeStyle = ring;
    ctx.lineWidth = 6 * (1 - k) + 1.5;
    ctx.setLineDash([18, 13]);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    for (let n = 0; n < 12; n++) {
      const ang = (n / 12) * Math.PI * 2 + s.seed;
      const r0 = r + 16, r1 = r + 16 + 40 * (1 - k);
      ctx.beginPath();
      ctx.moveTo(Math.cos(ang) * r0, Math.sin(ang) * r0);
      ctx.lineTo(Math.cos(ang) * r1, Math.sin(ang) * r1);
      ctx.stroke();
    }
  }
  if (ch.s === 'gold' || ch.s === 'title') {
    const fa = 1 - seg(la, 0.55, 1);
    for (let n = 0; n < 16; n++) {
      const ang = hash(s.seed * 3.3 + n) * Math.PI * 2;
      const v = (230 + hash(s.seed + n * 1.7) * 300) * K;
      const x = Math.cos(ang) * v * la;
      const y = Math.sin(ang) * v * la - 90 * la + 560 * la * la;
      ctx.save();
      ctx.globalAlpha = fa;
      ctx.translate(x, y);
      ctx.rotate(la * 9 * (hash(n + s.seed) - 0.5) + n);
      ctx.fillStyle = CONFETTI[n % CONFETTI.length];
      ctx.fillRect(-7, -4, 14, 8);
      ctx.restore();
    }
  }
  ctx.restore();
}

/** 吊牌背后的放射线（左灯右行 / 最后唯一） */
function drawRays(ctx: Ctx, line: Line, s: Slot, t: number) {
  const la = t - s.ch.land;
  if (la < 0 || t > line.out) return;
  const g = easeOut(seg(la, 0, 0.25));
  ctx.save();
  ctx.translate(s.cx, s.cy);
  ctx.strokeStyle = 'rgba(244,237,220,.4)';
  ctx.lineWidth = 2;
  for (let n = 0; n < 8; n++) {
    const ang = (n / 8) * Math.PI * 2 + hash(s.seed + n) * 0.6;
    const len = 70 + (90 + hash(s.seed * 3 + n) * 120) * g;
    ctx.beginPath();
    ctx.moveTo(Math.cos(ang) * 60, Math.sin(ang) * 60);
    ctx.lineTo(Math.cos(ang) * len, Math.sin(ang) * len);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawSubtitles(ctx: Ctx, t: number) {
  for (const line of LINES) {
    if (t < line.chars[0].t || t > line.out + 0.8) continue;
    const slots = layout(line);
    for (const s of slots) if (s.ch.s === 'sign') drawRays(ctx, line, s, t);
    // 已落定的先画，正在砸下来的压在最上面
    for (let pass = 0; pass < 2; pass++) {
      for (const s of slots) {
        if (t < s.ch.t) continue;
        const entering = t < s.ch.land;
        if ((pass === 1) !== entering) continue;
        drawSlot(ctx, line, s, t);
      }
    }
    for (const s of slots) drawImpact(ctx, line, s, t);
  }
}

const WEIGHT: Partial<Record<Style, number>> = { gold: 1, title: 1, stamp: 0.6, sign: 0.45, heel: 0.4 };

/** 大字落地的冲击量（0..1），给镜头震动用 */
export function impact(t: number): number {
  let m = 0;
  for (const line of LINES) {
    for (const ch of line.chars) {
      const w = WEIGHT[ch.s];
      if (!w) continue;
      const la = t - ch.land;
      if (la >= 0 && la < 0.4) m = Math.max(m, w * Math.exp(-la * 11));
    }
  }
  return m;
}
