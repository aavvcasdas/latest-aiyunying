// 逐字逐词精准卡点卡拉OK字幕条（纯函数式 T -> 画面，造型传承《童话镇》金边绘本字幕）
import React from 'react';
import type { LyricCue } from '../mv/cues';
import { FONT } from '../mv/fonts';
import { clamp01, cssHex } from '../mv/kit';

interface LyricBarProps {
  cue: LyricCue | null;
  T: number;
  /** 相对于 1920px 宽舞台的比例系数 */
  S: number;
}

export const LyricBar: React.FC<LyricBarProps> = ({ cue, T, S }) => {
  if (!cue) return null;

  const enter = clamp01((T - (cue.start - 0.05)) / 0.14);
  const exit = clamp01((cue.end + 0.16 - T) / 0.16);
  const alpha = Math.min(enter, exit);
  if (alpha <= 0.01) return null;

  const dy = (1 - enter) * 14 * S;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center"
      style={{
        paddingBottom: `${26 * S}px`,
        opacity: alpha,
        transform: `translateY(${dy}px)`,
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'flex-end',
          padding: `${11 * S}px ${36 * S}px ${14 * S}px`,
          background: 'rgba(22, 16, 40, 0.86)',
          borderTop: `${3.6 * S}px solid #ffd166`,
          borderBottom: `${3.6 * S}px solid #ffd166`,
          borderRadius: `${8 * S}px`,
          boxShadow: `0 ${10 * S}px ${32 * S}px rgba(0, 0, 0, 0.45)`,
          gap: `${6 * S}px`,
        }}
      >
        {cue.words.map((word, wIdx) => {
          const wActive = T >= word.t0 && T <= word.t1 + 0.04;
          const wDone = T > word.t1;
          const wProg = clamp01((T - word.t0) / Math.max(0.08, word.t1 - word.t0));
          const firstChar = cue.chars[word.charIndices[0]];
          const accentCss = cssHex(word.accent);

          return (
            <span
              key={wIdx}
              style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'baseline',
                marginLeft: firstChar?.gapBefore ? `${22 * S}px` : wIdx > 0 ? `${2 * S}px` : 0,
                paddingBottom: `${4 * S}px`,
              }}
            >
              {word.charIndices.map((ci) => {
                const ch = cue.chars[ci];
                const dur = Math.max(0.08, ch.t1 - ch.t0);
                const cp = clamp01((T - ch.t0) / dur);
                const age = T - ch.t0;
                const bounce = age >= 0 && age < 0.28 ? Math.sin((age / 0.28) * Math.PI) * 7 * S : 0;
                const scale = age >= 0 && age < 0.22 ? 1 + Math.sin((age / 0.22) * Math.PI) * 0.1 : 1;

                return (
                  <span
                    key={ci}
                    style={{
                      position: 'relative',
                      display: 'inline-block',
                      fontSize: `${56 * S}px`,
                      fontWeight: 900,
                      lineHeight: 1.12,
                      paddingInline: `${2.2 * S}px`,
                      transform: `translateY(${-bounce}px) scale(${scale})`,
                      transformOrigin: 'center bottom',
                    }}
                  >
                    {/* 未唱纯白底层 */}
                    <span
                      style={{
                        color: '#ffffff',
                        textShadow: `0 ${2 * S}px ${6 * S}px rgba(0,0,0,0.65)`,
                      }}
                    >
                      {ch.ch}
                    </span>
                    {/* 逐字精确卡点金色染色层 */}
                    {cp > 0 && (
                      <span
                        aria-hidden="true"
                        style={{
                          position: 'absolute',
                          left: `${2.2 * S}px`,
                          top: 0,
                          color: '#ffd84a',
                          clipPath: `inset(-15% ${(1 - cp) * 100}% -15% 0)`,
                          textShadow:
                            cp < 1
                              ? `0 0 ${16 * S}px rgba(255, 216, 74, 0.75), 0 ${2 * S}px ${5 * S}px rgba(0,0,0,0.6)`
                              : `0 ${2 * S}px ${5 * S}px rgba(0,0,0,0.6)`,
                        }}
                      >
                        {ch.ch}
                      </span>
                    )}
                  </span>
                );
              })}

              {/* 词组底部细金/词色卡点指示线 */}
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  left: `${2 * S}px`,
                  right: `${2 * S}px`,
                  bottom: 0,
                  height: `${3 * S}px`,
                  borderRadius: 999,
                  background: accentCss,
                  opacity: wActive ? 0.95 : wDone ? 0.48 : 0.14,
                  transform: `scaleX(${wProg > 0 ? Math.max(0.15, wProg) : 1})`,
                  transformOrigin: 'left center',
                }}
              />
            </span>
          );
        })}
      </div>
    </div>
  );
};
