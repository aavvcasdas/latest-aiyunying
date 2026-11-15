import React from 'react';
import cast from '../data/cast.json';
import { rnd, FONT } from './util';

const FR = cast.frames as unknown as Record<string, number[]>;
const AC = cast.actions as unknown as Record<string, Record<string, { fps: number; loop: boolean; frames: string[] }>>;

/** 贴纸白边 + 硬投影：像素小人变成「剪下来的纸片人」 */
export const STICKER =
  'drop-shadow(1px 0 0 #fff) drop-shadow(-1px 0 0 #fff) drop-shadow(0 1px 0 #fff) drop-shadow(0 -1px 0 #fff) drop-shadow(1.5px 2px 0 rgba(0,0,0,.28))';
/** 关灯之后：只剩一圈霓虹线稿 */
export const NEON = (c: string) =>
  `saturate(.35) brightness(.5) contrast(1.15) drop-shadow(1px 0 0 ${c}) drop-shadow(-1px 0 0 ${c}) drop-shadow(0 1px 0 ${c}) drop-shadow(0 -1px 0 ${c}) drop-shadow(0 0 3px ${c})`;

type PProps = {
  x?: number; y?: number; z?: number; w: number; h: number;
  r?: number; rx?: number; ry?: number; s?: number; o?: number;
  origin?: string; className?: string; style?: React.CSSProperties; children?: React.ReactNode;
};
/** 一张摆在 3D 空间里的纸：坐标以画面中心为原点，x 向右、y 向下、z 朝镜头 */
export function P({ x = 0, y = 0, z = 0, w, h, r = 0, rx = 0, ry = 0, s = 1, o = 1, origin, className, style, children }: PProps) {
  if (o <= 0.004) return null;
  return (
    <div
      className={className}
      style={{
        position: 'absolute', left: 640 + x - w / 2, top: 360 + y - h / 2, width: w, height: h,
        opacity: o < 1 ? o : undefined, transformOrigin: origin,
        transform: `translate3d(0,0,${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotate(${r}deg) scale(${s})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** 机位：整个场景反向移动 */
export function Cam({ x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, children }: { x?: number; y?: number; z?: number; rx?: number; ry?: number; rz?: number; children?: React.ReactNode }) {
  return (
    <div className="p3d" style={{ position: 'absolute', inset: 0, transform: `translate3d(${-x}px,${-y}px,${z}px) rotateX(${rx}deg) rotateY(${ry}deg) rotate(${rz}deg)` }}>
      {children}
    </div>
  );
}

type SpriteProps = {
  who: 'whale' | 'claude'; act?: string; t: number; x?: number; y?: number; z?: number;
  k?: number; flip?: boolean; r?: number; o?: number; filter?: string; frame?: number; sy?: number;
};
/** 分支图集里的像素人物。锚点在脚底中央。 */
export function Sprite({ who, act = 'idle', t, x = 0, y = 0, z = 0, k = 3, flip = false, r = 0, o = 1, filter = STICKER, frame, sy = 1 }: SpriteProps) {
  if (o <= 0.004) return null;
  const a = AC[who][act] || AC[who].idle;
  const n = a.frames.length;
  const tt = Math.max(0, t);
  const i = frame !== undefined ? Math.min(n - 1, frame) : a.loop ? Math.floor(tt * a.fps) % n : Math.min(n - 1, Math.floor(tt * a.fps));
  const [fx, fy, w, h] = FR[a.frames[i]];
  // 容器就是这一格精灵本身的矩形（有真实面积，3D 深度排序才可靠），以脚底中央为轴
  return (
    <div
      className="spr"
      style={{
        position: 'absolute', left: 640 + x - w / 2, top: 360 + y - h, width: w, height: h,
        opacity: o < 1 ? o : undefined, transformOrigin: '50% 100%',
        transform: `translate3d(0,0,${z}px) rotate(${r}deg) scale(${flip ? -k : k},${k * sy})`,
        backgroundPosition: `-${fx}px -${fy}px`, filter,
      }}
    />
  );
}

/** 小图里的迷你人物（照片、镜子、胶片格里用） */
export function Mini({ who, k = 0.6, x = 0, y = 0, flip = false, gray = 0, frame }: { who: 'whale' | 'claude'; k?: number; x?: number; y?: number; flip?: boolean; gray?: number; frame?: string }) {
  const [fx, fy, w, h] = FR[frame || (who === 'whale' ? 'whale_idle' : 'claude_front_0')];
  return (
    <div style={{ position: 'absolute', left: x, top: y, width: 0, height: 0, transform: `scale(${flip ? -k : k},${k})` }}>
      <div className="spr" style={{ position: 'absolute', left: -w / 2, top: -h, width: w, height: h, backgroundPosition: `-${fx}px -${fy}px`, filter: gray ? `grayscale(${gray})` : undefined }} />
    </div>
  );
}

const PHOTO_BG = [
  'linear-gradient(#9fd3f5 62%,#8fd08a 62%)',
  'linear-gradient(#ffc38a 30%,#f58a6a 62%,#7d5a8c 62%)',
  'linear-gradient(#1c2257 64%,#39407e 64%)',
  'linear-gradient(#ffd6e6 62%,#f3a6c4 62%)',
  'linear-gradient(#bfe8d0 62%,#e9d79a 62%)',
];
/** 拍立得：两个人的合照。fade → 1 时褪成白纸；solo 时照片里只剩她一个 */
export function Photo({ x = 0, y = 0, z = 0, r = 0, rx = 0, ry = 0, w = 120, fade = 0, kind = 0, o = 1, s = 1, solo = false }: { x?: number; y?: number; z?: number; r?: number; rx?: number; ry?: number; w?: number; fade?: number; kind?: number; o?: number; s?: number; solo?: boolean }) {
  const h = w * 1.18;
  const iw = w * 0.86;
  const ih = w * 0.8;
  return (
    <P x={x} y={y} z={z} r={r} rx={rx} ry={ry} w={w} h={h} o={o} s={s} style={{ background: '#fbf8f0', boxShadow: '2px 4px 0 rgba(0,0,0,.22)', borderRadius: 2 }}>
      <div style={{ position: 'absolute', left: (w - iw) / 2, top: w * 0.07, width: iw, height: ih, background: PHOTO_BG[kind % PHOTO_BG.length], overflow: 'hidden' }}>
        {kind % PHOTO_BG.length === 2 && <div style={{ position: 'absolute', right: iw * 0.12, top: ih * 0.1, width: iw * 0.2, height: iw * 0.2, borderRadius: '50%', boxShadow: `inset -${iw * 0.06}px ${iw * 0.02}px 0 0 #f7cf3d` }} />}
        <Mini who="whale" k={iw / 190} x={iw * (solo ? 0.5 : 0.34)} y={ih * 0.97} />
        {!solo && <Mini who="claude" k={iw / 190} x={iw * 0.68} y={ih * 0.97} />}
        <div style={{ position: 'absolute', inset: 0, background: '#fbf8f0', opacity: fade }} />
      </div>
    </P>
  );
}

export function Heart({ size = 100, color = '#f06a4d', stroke, sw = 4, style }: { size?: number; color?: string; stroke?: string; sw?: number; style?: React.CSSProperties }) {
  return (
    <svg width={size} height={size * 0.9} viewBox="-4 -4 108 98" style={{ display: 'block', overflow: 'visible', ...style }}>
      <path d="M50 88 C10 55 0 35 0 22 C0 8 12 0 25 0 C37 0 46 8 50 16 C54 8 63 0 75 0 C88 0 100 8 100 22 C100 35 90 55 50 88Z" fill={color} stroke={stroke} strokeWidth={stroke ? sw : 0} strokeLinejoin="round" />
    </svg>
  );
}

/** 剪纸弯月 */
export function Moon({ x = 0, y = 0, z = 0, size = 200, r = -20, color = '#f6c935', o = 1 }: { x?: number; y?: number; z?: number; size?: number; r?: number; color?: string; o?: number }) {
  return (
    <P x={x} y={y} z={z} w={size} h={size} r={r} o={o} style={{ borderRadius: '50%', boxShadow: `inset ${-size * 0.3}px ${size * 0.06}px 0 0 ${color}`, filter: 'drop-shadow(3px 5px 0 rgba(0,0,0,.25))' }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', backgroundImage: 'radial-gradient(rgba(190,120,0,.35) 1.5px, transparent 2px)', backgroundSize: '12px 12px', WebkitMaskImage: `radial-gradient(circle at ${50 - 30}% ${50 + 6}%, transparent ${size * 0.5 - 1}px, #000 ${size * 0.5}px)`, maskImage: `radial-gradient(circle at ${50 - 30}% ${50 + 6}%, transparent ${size * 0.5 - 1}px, #000 ${size * 0.5}px)` }} />
    </P>
  );
}

export function Cloud({ x = 0, y = 0, z = 0, s = 1, color = '#fff', o = 1 }: { x?: number; y?: number; z?: number; s?: number; color?: string; o?: number }) {
  return (
    <P x={x} y={y} z={z} w={220} h={90} s={s} o={o} style={{ filter: 'drop-shadow(2px 4px 0 rgba(0,0,0,.18))' }}>
      <div style={{ position: 'absolute', left: 0, top: 36, width: 220, height: 54, borderRadius: 30, background: color }} />
      <div style={{ position: 'absolute', left: 30, top: 10, width: 80, height: 80, borderRadius: '50%', background: color }} />
      <div style={{ position: 'absolute', left: 95, top: 0, width: 90, height: 90, borderRadius: '50%', background: color }} />
    </P>
  );
}

const BGS: Record<string, React.CSSProperties> = {
  kraft: { background: 'radial-gradient(ellipse at 50% 45%, #c79a62 0%, #a97a45 70%, #8a6034 100%)' },
  kraftDark: { background: 'radial-gradient(ellipse at 50% 50%, #6b4a2b 0%, #3d2a18 75%)' },
  blue: { background: '#3a6cc0' },
  mat: { backgroundColor: '#2f9b5d', backgroundImage: 'linear-gradient(rgba(255,255,255,.22) 1px, transparent 1px),linear-gradient(90deg, rgba(255,255,255,.22) 1px, transparent 1px)', backgroundSize: '44px 44px' },
  night: { background: 'linear-gradient(#10143a 0%, #232a66 100%)' },
  ink: { background: '#121018' },
  purple: { backgroundColor: '#6f58ad', backgroundImage: 'radial-gradient(rgba(255,255,255,.1) 2px, transparent 3px)', backgroundSize: '18px 18px' },
  paper: { background: '#efe8d8' },
  stripes: { background: 'repeating-linear-gradient(45deg,#8e9fc8 0 10px,#8797c0 10px 20px)' },
  sky: { background: 'linear-gradient(#7fb4e8 0%, #cfe6f7 100%)' },
  rain: { backgroundColor: '#6f9fdc', backgroundImage: 'radial-gradient(rgba(255,255,255,.12) 2px, transparent 3px)', backgroundSize: '16px 16px' },
  lined: { backgroundColor: '#f1ece0', backgroundImage: 'linear-gradient(rgba(90,120,170,.25) 1px, transparent 1px)', backgroundSize: '100% 34px' },
};
export function Bg({ kind, z = -500, o = 1, style }: { kind: keyof typeof BGS | string; z?: number; o?: number; style?: React.CSSProperties }) {
  return <P z={z} w={3000} h={1800} o={o} style={{ ...BGS[kind], ...style }} />;
}

/** 放射光：整张纸在转，不重画渐变 */
export function Burst({ a = '#f7c531', b = '#fbe38a', rot = 0, z = -480, o = 1 }: { a?: string; b?: string; rot?: number; z?: number; o?: number }) {
  return (
    <P z={z} w={3200} h={3200} r={rot} o={o} style={{ background: `repeating-conic-gradient(${a} 0 9deg, ${b} 9deg 18deg)` }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,.28) 2.5px, transparent 3.5px)', backgroundSize: '18px 18px' }} />
    </P>
  );
}

const tornCache: Record<string, string> = {};
/** 手撕纸边 */
export function torn(seed: number, n = 22, amp = 1.4) {
  const key = `${seed}-${n}-${amp}`;
  if (tornCache[key]) return tornCache[key];
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) pts.push(`${(i / n) * 100}% ${rnd(i, seed) * amp}%`);
  for (let i = 0; i <= n; i++) pts.push(`${100 - rnd(i, seed + 1) * amp}% ${(i / n) * 100}%`);
  for (let i = 0; i <= n; i++) pts.push(`${100 - (i / n) * 100}% ${100 - rnd(i, seed + 2) * amp}%`);
  for (let i = 0; i <= n; i++) pts.push(`${rnd(i, seed + 3) * amp}% ${100 - (i / n) * 100}%`);
  return (tornCache[key] = `polygon(${pts.join(',')})`);
}

/** 山丘 / 波浪的顶边（用在撕纸山坡上） */
export function hill(seed: number, n = 16, amp = 30) {
  const pts: string[] = ['0% 100%'];
  for (let i = 0; i <= n; i++) pts.push(`${(i / n) * 100}% ${amp * (0.5 + 0.5 * Math.sin(i * 0.9 + seed * 2.1)) + rnd(i, seed) * 6}%`);
  pts.push('100% 100%');
  return `polygon(${pts.join(',')})`;
}

/** 手写小纸条 / 剪报字块 */
export function Tag({ text, x = 0, y = 0, z = 0, r = 0, s = 1, size = 30, bg = '#fff', fg = '#222', o = 1, pad = 10 }: { text: string; x?: number; y?: number; z?: number; r?: number; s?: number; size?: number; bg?: string; fg?: string; o?: number; pad?: number }) {
  if (o <= 0.004 || s <= 0.004) return null;
  return (
    <div style={{ position: 'absolute', left: 640 + x, top: 360 + y, opacity: o < 1 ? o : undefined, transform: `translate3d(-50%,-50%,${z}px) rotate(${r}deg) scale(${s})`, whiteSpace: 'nowrap', background: bg, color: fg, fontFamily: FONT, fontSize: size, lineHeight: 1, padding: `${pad * 0.7}px ${pad}px`, boxShadow: '2px 3px 0 rgba(0,0,0,.25)' }}>{text}</div>
  );
}

/** 纸人 */
export function Person({ x = 0, y = 0, z = 0, s = 1, r = 0, color = '#5aa9e6', o = 1 }: { x?: number; y?: number; z?: number; s?: number; r?: number; color?: string; o?: number }) {
  return (
    <P x={x} y={y} z={z} w={40} h={60} s={s} r={r} o={o}>
      <svg width="40" height="60" viewBox="0 0 40 60" style={{ overflow: 'visible', filter: 'drop-shadow(1px 2px 0 rgba(0,0,0,.25))' }}>
        <circle cx="20" cy="9" r="8" fill={color} />
        <path d="M20 17 L2 26 L5 32 L15 28 L11 58 L18 58 L20 42 L22 58 L29 58 L25 28 L35 32 L38 26 Z" fill={color} />
      </svg>
    </P>
  );
}

export function Star({ x = 0, y = 0, z = 0, s = 1, r = 0, color = '#ffe27a', o = 1 }: { x?: number; y?: number; z?: number; s?: number; r?: number; color?: string; o?: number }) {
  return (
    <P x={x} y={y} z={z} w={30} h={30} s={s} r={r} o={o}>
      <svg width="30" height="30" viewBox="0 0 30 30" style={{ overflow: 'visible' }}>
        <path d="M15 1 L19 11 L29 11 L21 18 L24 28 L15 22 L6 28 L9 18 L1 11 L11 11Z" fill={color} />
      </svg>
    </P>
  );
}

export function Plane({ x = 0, y = 0, z = 0, s = 1, r = 0 }: { x?: number; y?: number; z?: number; s?: number; r?: number }) {
  return (
    <P x={x} y={y} z={z} w={150} h={60} s={s} r={r}>
      <svg width="150" height="60" viewBox="0 0 150 60" style={{ overflow: 'visible', filter: 'drop-shadow(2px 4px 0 rgba(0,0,0,.2))' }}>
        <path d="M0 14 L150 0 L62 40 Z" fill="#ffffff" />
        <path d="M62 40 L150 0 L78 58 Z" fill="#d9dde6" />
        <path d="M0 14 L62 40 L56 24 Z" fill="#eceff5" />
      </svg>
    </P>
  );
}

export function Envelope({ x = 0, y = 0, z = 0, r = 0, s = 1, o = 1, stamp = 0 }: { x?: number; y?: number; z?: number; r?: number; s?: number; o?: number; stamp?: number }) {
  return (
    <P x={x} y={y} z={z} r={r} s={s} o={o} w={170} h={110} style={{ background: '#fbf6ea', boxShadow: '2px 4px 0 rgba(0,0,0,.22)', border: '5px solid transparent', borderImage: 'repeating-linear-gradient(45deg,#e0554f 0 10px,#fbf6ea 10px 20px,#4f7fd0 20px 30px,#fbf6ea 30px 40px) 5' }}>
      <div style={{ position: 'absolute', left: 14, top: 40, width: 80, height: 4, background: '#b9b2a3' }} />
      <div style={{ position: 'absolute', left: 14, top: 54, width: 60, height: 4, background: '#b9b2a3' }} />
      <div style={{ position: 'absolute', right: 10, top: 8, width: 26, height: 30, background: '#f49ac1', border: '2px dashed #fff' }} />
      {stamp > 0 && (
        <div style={{ position: 'absolute', left: 22, top: 34, transform: `rotate(-12deg) scale(${stamp})`, border: '4px solid #d8322b', color: '#d8322b', fontFamily: FONT, fontSize: 26, padding: '2px 8px', lineHeight: 1.1, whiteSpace: 'nowrap', background: 'rgba(251,246,234,.6)' }}>查无此人</div>
      )}
    </P>
  );
}

/** 一排波浪（扇贝边） */
export function Wave({ y, z = 0, color, shift = 0, h = 500 }: { y: number; z?: number; color: string; shift?: number; h?: number }) {
  return (
    <P x={shift} y={y + h / 2} z={z} w={2400} h={h} style={{ background: `radial-gradient(circle at 40px -8px, transparent 36px, ${color} 37px) 0 0/80px 100% repeat-x`, filter: 'drop-shadow(0 -3px 0 rgba(255,255,255,.35))' }} />
  );
}

export function Rain({ t, n = 46, color = 'rgba(255,255,255,.55)', z = 60 }: { t: number; n?: number; color?: string; z?: number }) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const sp = 520 + rnd(i, 3) * 380;
    const y = ((rnd(i, 1) * 1000 + t * sp) % 1000) - 500;
    const x = (rnd(i, 2) - 0.5) * 1700 - y * 0.12;
    out.push(<P key={i} x={x} y={y} z={z - rnd(i, 4) * 300} w={3} h={34 + rnd(i, 5) * 30} r={7} style={{ background: color, borderRadius: 2 }} />);
  }
  return <>{out}</>;
}
