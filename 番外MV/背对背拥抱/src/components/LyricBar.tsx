import { useEffect, useMemo, useRef } from "react";
import type { CSSProperties } from "react";
import type { Cue } from "@/lib/mv";
import { FH, FW, charCues, clamp } from "@/lib/mv";

export type LyricTone = "gold" | "rain";

const TONE = {
  gold: {
    bar: "rgba(24,18,44,.86)",
    edge: "#ffd166",
    dim: "rgba(255,255,255,.44)",
    sung: "#ffd84a",
    hot: "#fff6d8",
    cold: ["#4a3a72", "#3a2c5c", "#2c2148", "#1e1634"],
    warm: ["#e0a445", "#c2802f", "#9c5f1f", "#77441a"],
    glow: "rgba(255,209,102,.55)",
  },
  rain: {
    bar: "rgba(16,32,62,.74)",
    edge: "#aadcff",
    dim: "rgba(232,244,255,.46)",
    sung: "#ffdc8f",
    hot: "#f4fcff",
    cold: ["#3d5a86", "#2f476c", "#243755", "#1a2940"],
    warm: ["#6fa8cf", "#4d84ab", "#376789", "#274f6b"],
    glow: "rgba(170,220,255,.5)",
  },
} as const;

interface Props {
  cue: Cue;
  next: Cue | null;
  getTime: () => number;
  getEnergy: () => number;
  tone: LyricTone;
  karaoke: boolean;
  visible: boolean;
  paused: boolean;
  onWord?: boolean;
}

function extrude(colors: readonly string[], extra = "") {
  return `0 2px 0 ${colors[0]}, 0 4px 0 ${colors[1]}, 0 6px 0 ${colors[2]}, 0 8px 0 ${colors[3]}, 0 13px 20px rgba(6,3,16,.5)${extra}`;
}

/**
 * 歌词条（复刻仓库 MV 的写法再往软 3D 推一层）：
 *   · 整句一次出现，纸条带金边、有厚度，随镜头微微仰着
 *   · 按「词」分组：唱到哪个词，词底下一条金线亮起来
 *   · 按「字」卡点：唱到的字往前顶（translateZ）、放大、由白转金，唱过落回金色
 */
export function LyricBar({ cue, next, getTime, getEnergy, tone, karaoke, visible, onWord = true }: Props) {
  const chars = useMemo(() => charCues(cue), [cue]);
  const charRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const wordRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const t = TONE[tone];

  const words = useMemo(() => {
    const out: Array<{ word: string; from: number; to: number }> = [];
    chars.forEach((c, i) => {
      const last = out[out.length - 1];
      if (last && i > 0 && c.w === chars[i - 1].w) last.to = i;
      else out.push({ word: c.word, from: i, to: i });
    });
    return out;
  }, [chars]);

  useEffect(() => {
    charRefs.current = [];
    wordRefs.current = [];
  }, [cue]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!visible) return;
      const time = getTime();
      const energy = getEnergy();
      cardRef.current?.style.setProperty("--energy", energy.toFixed(3));

      for (let i = 0; i < chars.length; i++) {
        const el = charRefs.current[i];
        if (!el) continue;
        const c = chars[i];
        const span = Math.max(0.08, c.t1 - c.t0);
        const p = clamp((time - c.t0) / span);

        if (time >= c.t1) {
          const settle = clamp((time - c.t1) / 0.3);
          el.style.transform = `translateZ(${12 * (1 - settle)}px) scale(${1 + 0.07 * (1 - settle)})`;
          el.style.color = t.sung;
          el.style.textShadow = extrude(t.warm, `, 0 0 ${16 * (1 - settle)}px ${t.glow}`);
        } else if (time >= c.t0) {
          const kick = Math.sin(Math.PI * p);
          const beat = energy * 0.55;
          const dir = i % 2 ? 1 : -1;
          el.style.transform = `translateZ(${24 + 34 * kick + 22 * beat}px) scale(${1 + 0.22 * kick + 0.12 * beat}) rotate(${(1 - p) * -5 * dir}deg)`;
          el.style.color = p > 0.4 ? t.hot : "#ffffff";
          el.style.textShadow = extrude(t.warm, `, 0 0 ${20 + 34 * kick}px ${t.glow}, 0 0 ${60 * kick}px ${t.glow}`);
        } else {
          const near = clamp(1 - (c.t0 - time) / 0.55);
          el.style.transform = `translateZ(${-8 + 12 * near}px) scale(${1 + 0.03 * near})`;
          el.style.color = t.dim;
          el.style.textShadow = extrude(t.cold);
        }
      }

      for (let w = 0; w < words.length; w++) {
        const el = wordRefs.current[w];
        if (!el) continue;
        const grp = words[w];
        const on = time >= chars[grp.from].t0 - 0.02 && time <= chars[grp.to].t1 + 0.14;
        el.style.opacity = on ? "1" : "0";
        el.style.transform = on ? "scaleX(1)" : "scaleX(.55)";
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [chars, words, visible, getTime, getEnergy, t]);

  if (!cue.text) return null;

  const n = cue.text.length;
  const size = n > 10 ? 44 : n > 8 ? 50 : n > 6 ? 56 : 62;

  const barStyle: CSSProperties = {
    position: "relative",
    padding: "14px 46px 16px",
    background: t.bar,
    borderTop: `4px solid ${t.edge}`,
    borderBottom: `4px solid ${t.edge}`,
    borderRadius: tone === "rain" ? 20 : 6,
    boxShadow: `0 12px 36px rgba(4,2,12,.5), 0 0 calc(24px + var(--energy,0) * 70px) ${t.glow}`,
  };

  const textStyle: CSSProperties = {
    fontFamily: "var(--display)",
    fontSize: size,
    lineHeight: 1.2,
    letterSpacing: n > 9 ? 3 : 7,
    whiteSpace: "nowrap",
    display: "block",
  };

  return (
    <div
      className="absolute left-0 right-0 flex flex-col items-center"
      style={{
        bottom: 38,
        perspective: 1200,
        perspectiveOrigin: "50% 30%",
        opacity: visible ? 1 : 0,
        transition: "opacity 240ms linear",
        pointerEvents: "none",
        zIndex: 60,
      }}
    >
      {next?.text && karaoke && (
        <div
          className="mb-3 rounded-full px-4 py-[3px]"
          style={{
            fontFamily: "var(--display)",
            fontSize: 19,
            letterSpacing: 5,
            color: "rgba(255,246,224,.6)",
            background: "rgba(18,12,38,.55)",
            border: "1px solid rgba(255,209,102,.2)",
          }}
        >
          下一句 · {next.text}
        </div>
      )}

      <div
        key={cue.i}
        ref={cardRef}
        className="lyric-3d reveal"
        style={{ transform: "rotateX(10deg)", transformStyle: "preserve-3d" }}
      >
        {/* 纸条的厚度 */}
        <div
          aria-hidden
          style={{
            ...barStyle,
            position: "absolute",
            inset: 0,
            transform: "translateZ(-18px) scale(1.015)",
            background: "rgba(10,6,22,.92)",
            borderTopColor: "rgba(255,209,102,.4)",
            borderBottomColor: "rgba(255,209,102,.4)",
            boxShadow: "none",
          }}
        />
        <div
          aria-hidden
          style={{
            ...barStyle,
            position: "absolute",
            inset: 0,
            transform: "translateZ(-9px) scale(1.007)",
            background: "rgba(16,11,32,.9)",
            borderTopColor: "rgba(255,209,102,.65)",
            borderBottomColor: "rgba(255,209,102,.65)",
            boxShadow: "none",
          }}
        />

        <div style={barStyle}>
          <span style={textStyle}>
            {words.map((grp, wi) => (
              <span key={wi} style={{ position: "relative", display: "inline-block", marginRight: grp.word.length > 1 ? 3 : 0 }}>
                {onWord && (
                  <span
                    ref={(el) => {
                      wordRefs.current[wi] = el;
                    }}
                    style={{
                      position: "absolute",
                      left: "4%",
                      right: "4%",
                      bottom: -8,
                      height: 4,
                      borderRadius: 3,
                      background: `linear-gradient(90deg, transparent, ${t.edge}, transparent)`,
                      opacity: 0,
                      transform: "scaleX(.55)",
                      transition: "opacity 110ms linear, transform 170ms cubic-bezier(.2,.9,.3,1.5)",
                    }}
                  />
                )}
                {chars.slice(grp.from, grp.to + 1).map((c, i) => {
                  const idx = grp.from + i;
                  return (
                    <span
                      key={idx}
                      className="ch"
                      ref={(el) => {
                        charRefs.current[idx] = el;
                      }}
                      style={{ color: t.dim, textShadow: extrude(t.cold) }}
                    >
                      {c.ch}
                    </span>
                  );
                })}
              </span>
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}

/** 模板口径：字幕条占画面高度 79%–96%，重要的东西放在它上面 */
export const BAR_ZONE = { top: FH * 0.79, bottom: FH * 0.96, width: FW };
