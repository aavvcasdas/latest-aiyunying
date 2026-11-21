// 立体卡点字幕
// · 按「词」分块分行，关键词放大、有自己的颜色
// · 按「字」入场：每个字在自己的实测起音时间砸进来（之前不可见）
// · 每个字是真 3D：5 层沿 Z 轴叠出厚度 + 正面渐变，整块字带朝向并缓慢摆动，透视会让厚度露出来
// · 一个词的最后一个字唱出来的那一下 = 词卡点：整词一胀、扫光，并通知画面炸环 / 冲屏
// 注意：3D 祖先元素上不能常驻 opacity / filter（会把子层压平），只在入场、离场的瞬间用。
import { useEffect, useRef, type CSSProperties } from "react";
import { LINES, type Fx, type LChar, type LLine, type LWord } from "./lyrics";

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const range = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const eOut = (p: number) => 1 - Math.pow(1 - p, 3);
const eBack = (p: number) => {
  const c = 1.70158;
  return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2);
};
const eBounce = (p: number) => {
  const n = 7.5625;
  const d = 2.75;
  if (p < 1 / d) return n * p * p;
  if (p < 2 / d) return n * (p - 1.5 / d) * (p - 1.5 / d) + 0.75;
  if (p < 2.5 / d) return n * (p - 2.25 / d) * (p - 2.25 / d) + 0.9375;
  return n * (p - 2.625 / d) * (p - 2.625 / d) + 0.984375;
};
/** 舞台单位（1280 宽时 1 单位 = 1px） */
const u = (n: number) => `calc(var(--u) * ${n.toFixed(2)})`;

const EM: Record<number, number> = { [-1]: 0.68, 0: 1, 1: 1.3, 2: 1.75 };
const LAYERS = [1, 2, 3, 4, 5];

interface Pose { x: number; y: number; z: number; rx: number; ry: number; rz: number; sc: number; op: number }

/** 单个字的入场姿态，a: 0→1 */
function enter(fx: Fx, a: number, seed: number): Pose {
  const e = eOut(a);
  const b = eBack(a);
  const p: Pose = { x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, sc: 1, op: Math.min(1, a * 4) };
  switch (fx) {
    case "slam": // 从镜头前砸进去
      p.sc = lerp(2.3, 1, b);
      p.z = lerp(170, 0, e);
      p.rx = lerp(-70, 0, e);
      p.y = lerp(-36, 0, e);
      break;
    case "drop": // 掉下来弹两下
      p.y = lerp(-280, 0, eBounce(a));
      p.rz = lerp((seed - 0.5) * 60, 0, e);
      p.rx = lerp(42, 0, e);
      break;
    case "rise": // 从下面翻上来
      p.y = lerp(110, 0, e);
      p.rx = lerp(-62, 0, e);
      p.sc = lerp(0.7, 1, b);
      break;
    case "zoom": // 从远处冲到面前
      p.sc = lerp(0.15, 1, b);
      p.z = lerp(-420, 0, e);
      p.ry = lerp(65, 0, e);
      break;
    case "shake": // 砸下来还在抖
      p.sc = lerp(1.9, 1, e);
      p.x = Math.sin(a * 40) * (1 - a) * 14;
      p.rz = Math.sin(a * 33) * (1 - a) * 16;
      break;
    default: // type：一个字一个字敲出来
      p.sc = lerp(1.6, 1, e);
      p.z = lerp(90, 0, e);
  }
  return p;
}

function Char({ line, w, ch, t, hitK }: { line: LLine; w: LWord; ch: LChar; t: number; hitK: number }) {
  if (t < ch.t) {
    return <span className="ch3d wait">{ch.ch}</span>;
  }
  const dur = line.fx === "type" ? 0.14 : 0.26;
  const a = clamp((t - ch.t) / dur);
  const seed = (ch.gi * 0.37 + 0.13) % 1;
  const p = enter(line.fx, a, seed);
  const singing = t < ch.end ? 1 : 1 - clamp((t - ch.end) / 0.2);
  p.z += 30 * singing * a; // 正在唱的字浮在最前
  p.sc *= 1 + hitK * (w.em >= 1 ? 0.24 : 0.12); // 词卡点：整词一胀
  if (w.fall) { // 「下落」：唱完真的往下掉
    const f = t - ch.t - 0.22;
    if (f > 0) {
      p.y += Math.min(280, 420 * f * f);
      p.rz += f * 60 * (seed > 0.5 ? 1 : -1);
      p.op *= 1 - range(f, 0.4, 0.75);
    }
  }
  const style: CSSProperties = {
    transform: `translate3d(${u(p.x)},${u(p.y)},${u(p.z)}) rotateX(${p.rx.toFixed(1)}deg) rotateY(${p.ry.toFixed(1)}deg) rotateZ(${p.rz.toFixed(1)}deg) scale(${p.sc.toFixed(3)})`,
    opacity: p.op < 0.995 ? p.op : undefined,
  };
  return (
    <span className={"ch3d" + (t < ch.end ? " on" : "")} style={style}>
      {LAYERS.map((i) => (
        <span key={i} className={`ext e${i}`} aria-hidden="true">
          {ch.ch}
        </span>
      ))}
      <span className="front">{ch.ch}</span>
    </span>
  );
}

function Line({ line, t, reg }: { line: LLine; t: number; reg: Map<string, HTMLSpanElement> }) {
  const inP = eOut(range(t, line.start - 0.26, line.start + 0.08));
  const outP = range(t, line.out - 0.18, line.out);
  const sway = Math.sin(t * 0.9 + line.start) * 2.6;
  const ry = line.ry * (1 + 0.7 * (1 - inP)) + sway;
  const rx = line.rx + Math.cos(t * 0.7 + line.start) * 1.3;
  const style: CSSProperties = {
    left: `${line.ax * 100}%`,
    top: `${line.ay * 100}%`,
    fontSize: u(line.size),
    transform: `translate(-50%,-50%) translateZ(${u(-160 * (1 - inP))}) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(${u(-34 * outP)}) scale(${(1 + 0.08 * outP).toFixed(3)})`,
    opacity: outP > 0 ? 1 - outP : undefined,
  };
  return (
    <div className="line3d" style={style}>
      {line.rows.map((row, ri) => (
        <div className="row3d" key={ri}>
          {row.map((w) => {
            const hitK = t >= w.hitT ? Math.exp(-(t - w.hitT) / 0.13) : 0;
            const ws = {
              fontSize: `${EM[w.em] ?? 1}em`,
              "--hue": w.hue,
              transform: w.dx || w.dy ? `translate(${u(w.dx)},${u(w.dy)})` : undefined,
            } as CSSProperties;
            return (
              <span
                key={w.key}
                className={"word3d" + (t >= w.hitT && t < w.hitT + 0.45 ? " hit" : "")}
                style={ws}
                ref={(el) => {
                  if (el) reg.set(w.key, el);
                  else reg.delete(w.key);
                }}
              >
                {w.chars.map((ch) => (
                  <Char key={ch.gi} line={line} w={w} ch={ch} t={t} hitK={hitK} />
                ))}
                <span className="word-flash" />
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

interface Props {
  t: number;
  onHit: (x01: number, y01: number, hue: number, strong: boolean) => void;
}

export default function Subtitles3D({ t, onHit }: Props) {
  const root = useRef<HTMLDivElement>(null);
  const reg = useRef(new Map<string, HTMLSpanElement>());
  const prev = useRef(t);

  // 词卡点：时间越过某个词最后一个字的起音 → 在这个词的真实屏幕位置通知画面
  useEffect(() => {
    const pt = prev.current;
    prev.current = t;
    if (t <= pt || t - pt > 0.3) return; // 拖进度 / 重播不补发
    const box = root.current?.getBoundingClientRect();
    if (!box || box.width < 2) return;
    for (const line of LINES) {
      if (t < line.start - 0.1 || pt > line.end + 0.1) continue;
      for (const w of line.rows.flat()) {
        if (pt < w.hitT && t >= w.hitT) {
          const r = reg.current.get(w.key)?.getBoundingClientRect();
          if (r) onHit((r.left + r.width / 2 - box.left) / box.width, (r.top + r.height / 2 - box.top) / box.height, w.hue, w.em >= 1);
          else onHit(line.ax, line.ay, w.hue, w.em >= 1);
        }
      }
    }
  }, [t, onHit]);

  const live = LINES.filter((l) => t > l.start - 0.3 && t < l.out + 0.02);
  return (
    <div ref={root} className="sub-stage">
      {live.map((line) => (
        <Line key={line.text} line={line} t={t} reg={reg.current} />
      ))}
    </div>
  );
}
