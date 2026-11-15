import React from 'react';
import data from '../data/lyrics.json';
import { seg, lerp, eOut, eIn, eIO, back, rnd, bump, clamp, FONT } from './util';

export type Ch = { c: string; t: number; e: number };
export type Line = { sec: number; idx: number; kind: string; phrases: Ch[][][]; start: number; end: number; text: string };
export const LINES = data.lines as unknown as Line[];
export const DURATION = data.duration as number;

/** 第 li 行第 ci 个字的起音时刻（镜头里的动作都挂在字上，不写死秒数） */
const FLAT: Ch[][] = LINES.map((l) => l.phrases.flat(2));
export const ct = (li: number, ci: number) => FLAT[li][Math.min(ci, FLAT[li].length - 1)].t;
export const lineOf = (li: number) => LINES[li];

const PAL: [string, string][] = [
  ['#f6d54a', '#2a2210'], ['#ef6461', '#fff'], ['#4f9fe8', '#fff'], ['#6fcf8b', '#12301f'],
  ['#f7a8c8', '#5b1f3a'], ['#f59a3d', '#fff'], ['#b59cf2', '#fff'], ['#ffffff', '#222'], ['#23232b', '#fff'],
];
const KRAFT: [string, string][] = [['#ead7ad', '#3a2a14'], ['#f3e6c4', '#3a2a14'], ['#dcc391', '#3a2a14'], ['#fff8e6', '#3a2a14']];
const NEONC = ['#7df9ff', '#ff8ad8', '#ffe66d', '#9dff8a', '#c4a1ff', '#ffa25e'];
const FONTS = [FONT, FONT, FONT, '"STKaiti","KaiTi","Kaiti SC",' + FONT, '"Songti SC","SimSun",' + FONT];

type FC = Ch & { wi: number; pi: number; i: number; n: number; wEnd: number; x: number; y: number; S: number; col: string; fg: string; rot: number; font: string; wRot: number };

const HERO_POS: Record<number, [number, number, number]> = {
  2: [0, -150, 1], 7: [0, -150, 1], 4: [300, -205, 0.6], 9: [300, -205, 0.6], 10: [0, -215, 0.66], 11: [0, -250, 0.52],
};
const isNeon = (l: Line) => ((l.sec === 0 || l.sec === 5) && l.idx >= 2) || ((l.sec === 1 || l.sec === 6) && l.idx === 3 && l.sec === 1);

function layout(line: Line, li: number): FC[] {
  const out: FC[] = [];
  const hero = line.kind === 'hero';
  const [hx, hy, hs] = HERO_POS[line.sec] || [0, 0, 1];
  let wi = 0;
  let i = 0;
  const rows: FC[][] = [];
  line.phrases.forEach((ph, pi) => {
    const S = hero ? (pi === 0 ? 116 : 96) * hs : 52;
    const gap = S * 0.07;
    const wgap = hero ? S * 0.1 : 13;
    let x = 0;
    const row: FC[] = hero ? [] : rows[0] || [];
    if (!hero && pi > 0) x = (row.length ? row[row.length - 1].x + S / 2 : 0) + 36;
    ph.forEach((wd, k) => {
      const pal = hero ? PAL : line.kind === 'verse' ? KRAFT : PAL;
      const ci = Math.floor(rnd(li * 31 + wi * 7, 5) * pal.length);
      const wRot = (rnd(wi, li + 9) - 0.5) * (hero ? 7 : 5);
      if (k > 0) x += wgap;
      wd.forEach((c, m) => {
        const cc = hero ? Math.floor(rnd(li * 13 + i * 5, 2) * PAL.length) : ci;
        out.push({
          ...c, wi, pi, i, n: 0, wEnd: wd[wd.length - 1].t, x: x + S / 2, y: 0, S,
          col: pal[cc][0], fg: pal[cc][1], rot: wRot + (rnd(i, li) - 0.5) * 6, font: FONTS[Math.floor(rnd(i, li + 77) * FONTS.length)], wRot,
        });
        row.push(out[out.length - 1]);
        x += S + (m < wd.length - 1 ? gap : 0);
        i++;
      });
      wi++;
    });
    if (hero) rows.push(row);
    else rows[0] = row;
  });
  // 居中；副歌大字两行、第二行左对齐偏右一点（照原片的排法）
  rows.forEach((row, r) => {
    const w = row[row.length - 1].x + row[0].S / 2;
    const off = hero ? (r === 0 ? -w / 2 : -(rows[0][rows[0].length - 1].x + rows[0][0].S / 2) / 2 + rows[0][0].S * 0.35) : -w / 2;
    row.forEach((f) => {
      f.x += off + (hero ? hx : 0);
      f.y = hero ? hy + r * rows[0][0].S * 1.02 + (rnd(f.i, 3) - 0.5) * 8 * hs : 268 + (rnd(f.i, li + 3) - 0.5) * 7;
    });
  });
  out.forEach((f) => (f.n = out.length));
  return out;
}
const LAYOUT: FC[][] = LINES.map(layout);

type Fx = { dx: number; dy: number; sc: number; o: number; ry: number; gray: number };
/** 副歌的收尾：下一句唱什么，大字就怎么收场 */
function heroFx(line: Line, tail: Line | undefined, tailFlat: Ch[] | undefined, f: FC, t: number): Fx {
  const fx: Fx = { dx: 0, dy: 0, sc: 1, o: 1, ry: 0, gray: 0 };
  if (!tail || !tailFlat || t < tail.start) return fx;
  const last = tailFlat[tailFlat.length - 1].t;
  const u = seg(t, tail.start, last + 0.5);
  const sec = line.sec;
  if (sec === 2 || sec === 7) {
    // 却不露痕迹：字一点点褪掉，只剩纸上的印子
    const k = eOut(seg(t, tail.start + f.i * 0.12, last + 0.3));
    fx.o = lerp(1, 0.1, k);
    fx.gray = k;
  } else if (sec === 4 || sec === 9) {
    // 却欺骗自己：一张张翻过去，背面什么都没写
    const ft = lerp(tail.start, last, f.i / Math.max(1, f.n - 1));
    fx.ry = 180 * eIO(seg(t, ft, ft + 0.45));
  } else if (sec === 10) {
    // 就当作秘密：字都收拢进那颗心里
    const g = eIO(seg(t, tail.start + f.i * 0.06, tail.start + 1.25 + f.i * 0.06));
    fx.dx = (0 - f.x) * g;
    fx.dy = (40 - f.y) * g;
    fx.sc = lerp(1, 0.12, g);
    fx.o = 1 - seg(g, 0.8, 1);
  } else if (sec === 11) {
    // 就深藏在心：一个个掉进箱子里
    const t0 = tailFlat[1].t - 0.2 + f.i * 0.11;
    const g = eIn(seg(t, t0, t0 + 0.7));
    fx.dx = (0 - f.x) * g * 0.9;
    fx.dy = (150 - f.y) * g;
    fx.sc = lerp(1, 0.14, g);
    fx.o = 1 - seg(g, 0.86, 1);
  }
  fx.o *= 1 - seg(u, 1, 1.0001) * 0;
  return fx;
}

function Tile({ f, t, line, exitAt, neon, fx }: { f: FC; t: number; line: Line; exitAt: number; neon: boolean; fx?: Fx }) {
  const t0 = f.t - 0.035; // 提前一帧起跳，落地正好压在起音上
  if (t < t0) return null;
  const hero = line.kind === 'hero';
  const p = seg(t, t0, t0 + (hero ? 0.26 : 0.2));
  const land = eOut(p);
  const over = back(p, 2.4);
  // 正在唱的字：浮起来、放大、发亮
  const hold = p >= 1 ? 1 - seg(t, f.e - 0.06, f.e + 0.22) : p;
  // 一个词唱完：整词一起鼓一下
  const wb = bump(seg(t, f.wEnd + 0.02, f.wEnd + 0.3));
  // 整句收场
  const xo = seg(t, exitAt + f.i * 0.025, exitAt + 0.3 + f.i * 0.025);
  if (xo >= 1) return null;
  const z = lerp(hero ? 520 : 340, 0, land) + hold * (hero ? 60 : 44) + wb * 18;
  const rx = lerp(-78, 0, land) + xo * 80;
  const sc = lerp(1.9, 1, over) * (1 + hold * 0.13 + wb * 0.05) * (fx ? fx.sc : 1);
  const y = f.y + (fx ? fx.dy : 0) + eIn(xo) * 70 - wb * 4;
  const x = f.x + (fx ? fx.dx : 0);
  const o = (1 - xo) * clamp(p * 4) * (fx ? fx.o : 1);
  if (o <= 0.004) return null;
  const ry = fx ? fx.ry : 0;
  const backSide = ry > 90;
  const S = f.S;
  const glow = hold > 0.05;
  const nc = NEONC[(f.wi + line.idx) % NEONC.length];
  const base: React.CSSProperties = neon
    ? { background: 'rgba(10,8,20,.55)', border: `2px solid ${nc}`, color: nc, textShadow: `0 0 8px ${nc}`, boxShadow: `0 0 ${6 + hold * 16}px ${nc}` }
    : {
        background: backSide ? '#cdb58a' : f.col, color: f.fg,
        boxShadow: `${2 + hold * 5}px ${3 + hold * 9}px 0 rgba(0,0,0,${0.3 - hold * 0.1})${glow ? `, 0 0 ${hold * 22}px rgba(255,255,255,${hold * 0.75})` : ''}`,
        filter: fx && fx.gray > 0.01 ? `grayscale(${fx.gray})` : undefined,
      };
  return (
    <div
      style={{
        position: 'absolute', left: 640 + x - S / 2, top: 360 + y - S / 2, width: S, height: S,
        opacity: o < 1 ? o : undefined,
        transform: `translate3d(0,0,${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotate(${f.rot * land}deg) scale(${sc})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: f.font, fontSize: S * 0.72, lineHeight: 1, fontWeight: 700, borderRadius: 2, ...base,
      }}
    >
      {backSide ? '' : f.c}
    </div>
  );
}

/** 3D 逐字卡点字幕层 */
export function Lyrics({ t }: { t: number }) {
  const out: React.ReactNode[] = [];
  for (let li = 0; li < LINES.length; li++) {
    const line = LINES[li];
    const hero = line.kind === 'hero';
    const tail = hero ? LINES[li + 1] : undefined;
    const exitAt = hero && tail ? tail.end + 0.1 : line.end;
    if (t < line.start - 0.1 || t > exitAt + 1.2) continue;
    const neon = isNeon(line);
    const tailFlat = hero ? FLAT[li + 1] : undefined;
    const sway = Math.sin(t * 0.55 + li) * (hero ? 7 : 5);
    out.push(
      <div
        key={li}
        className="p3d"
        style={{
          position: 'absolute', inset: 0,
          transformOrigin: hero ? '50% 40%' : '50% 88%',
          transform: hero ? `translateZ(30px) rotateY(${sway}deg) rotateX(${4 + Math.sin(t * 0.4) * 3}deg)` : `translateZ(40px) rotateX(14deg) rotateY(${sway}deg)`,
        }}
      >
        {LAYOUT[li].map((f) => (
          <Tile key={f.i} f={f} t={t} line={line} exitAt={exitAt} neon={neon} fx={hero ? heroFx(line, tail, tailFlat, f, t) : undefined} />
        ))}
      </div>,
    );
  }
  return <>{out}</>;
}

/** 片头那四个大字用的同款字块 */
export function BigTile({ c, t, at, x, y, S = 120, i = 0, z = 0 }: { c: string; t: number; at: number; x: number; y: number; S?: number; i?: number; z?: number }) {
  if (t < at) return null;
  const p = seg(t, at, at + 0.28);
  const land = eOut(p);
  const [col, fg] = PAL[[0, 7, 2, 4][i % 4]];
  const wb = bump(seg(t, at + 0.28, at + 0.6));
  return (
    <div
      style={{
        position: 'absolute', left: 640 + x - S / 2, top: 360 + y - S / 2, width: S, height: S,
        opacity: clamp(p * 4),
        transform: `translate3d(0,0,${z + lerp(560, 0, land) + wb * 14}px) rotateX(${lerp(-80, 0, land)}deg) rotate(${(rnd(i, 4) - 0.5) * 12 * land}deg) scale(${lerp(1.9, 1, back(p, 2.4))})`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', background: col, color: fg,
        fontFamily: FONT, fontSize: S * 0.74, lineHeight: 1, boxShadow: '4px 6px 0 rgba(0,0,0,.3)', borderRadius: 2,
      }}
    >
      {c}
    </div>
  );
}
