// 胶片层（暗角 / 扫描线 / 颗粒 / 上下黑边）+ HUD + 片名页 + 片尾卡
import type { MouseEvent } from "react";
import { DUR, TICKS, beatPhase } from "./lyrics";

interface Props {
  t: number;
  ready: boolean;
  loadErr: string;
  started: boolean;
  playing: boolean;
  busy: boolean;
  muted: boolean;
  subsOn: boolean;
  /** 音轨没能解码，正在无声播放 */
  silent: boolean;
  onStart: () => void;
  onToggle: () => void;
  onReplay: () => void;
  onSeek: (x01: number) => void;
  onMute: () => void;
  onSubs: () => void;
}

const fmt = (s: number) => `00:${s.toFixed(1).padStart(4, "0")}`;
const CAST = ["GPT", "Claude", "Gemini", "Kimi", "Qwen", "GLM", "豆包"];

export default function Overlay(p: Props) {
  const t = Math.min(p.t, DUR);
  const phase = beatPhase(p.t);
  const ended = p.started && !p.playing && p.t >= DUR - 0.05;

  const seek = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    p.onSeek(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)));
  };

  return (
    <>
      <div className="vignette" />
      <div className="scanlines" />
      <div className="grain" />
      <div className="letterbox top" />
      <div className="letterbox bottom" />

      {p.started && (
        <div className="hud">
          <div className="hud-tl">
            <span className="rec-dot" />
            <span className="rec">REC</span>
            <span className="tc">{fmt(t)} / {fmt(DUR)}</span>
            <span className="beats">
              {[0, 1, 2, 3].map((i) => (
                <i key={i} className={phase >= i / 4 && phase < (i + 1) / 4 ? "on" : ""} />
              ))}
            </span>
            {p.silent && <span className="warn">音轨解码失败 · 无声播放</span>}
          </div>
          <div className="hud-tr">《譬如我》· 精华版</div>

          <div className="ctrl-bar">
            <button className="ctrl-btn" onClick={p.onReplay} title="从头播放">⏮</button>
            <button className="ctrl-btn" onClick={p.onToggle} title={p.playing ? "暂停（空格）" : "播放（空格）"}>
              {p.playing ? "⏸" : "▶"}
            </button>
            <button className="ctrl-btn" onClick={p.onMute} title="静音">{p.muted ? "🔇" : "🔊"}</button>
            <button className={"ctrl-btn" + (p.subsOn ? "" : " off")} onClick={p.onSubs} title="字幕开关">
              字幕
            </button>
            <div className="progress" onClick={seek} title="点击跳转；每一道刻度是一个字的起音">
              <div className="fill" style={{ width: `${(t / DUR) * 100}%` }} />
              {TICKS.map((tk, i) => (
                <span key={i} className={"tick" + (p.t >= tk.t ? " past" : "")} style={{ left: `${(tk.t / DUR) * 100}%` }} />
              ))}
            </div>
            <span className="pct">{fmt(t)}</span>
          </div>
        </div>
      )}

      {!p.started && (
        <div className="start-veil">
          <div className="title-block">
            <div className="title">譬如我</div>
            <div className="sub">精华版 MV · 28 秒 · 逐字立体卡点字幕</div>
            <div className="tagline">台上是被传颂的名字，角落里是一头鲸</div>
          </div>
          <div className="chips">
            <span className="cast-chip main">本鲸 · DeepSeek</span>
            {CAST.map((c) => (
              <span key={c} className="cast-chip">{c}</span>
            ))}
          </div>
          <button className="big-play" onClick={p.onStart} disabled={!p.ready || p.busy}>
            {p.loadErr ? "素材载入失败" : !p.ready ? "载入中…" : p.busy ? "解码音轨…" : "▶ 播放"}
          </button>
          {p.loadErr && <div className="credits warn">{p.loadErr}</div>}
          <div className="credits">
            音乐与人物取自项目分支（譬如我精华.WAV / 人物像素图集）· 角色间的站位是本片的虚构演出，不是模型能力评测
          </div>
        </div>
      )}

      {ended && (
        <div className="end-card">
          <div className="end-title">开出小小的花朵</div>
          <div className="end-sub">《譬如我》· 精华版</div>
          <button className="big-play small" onClick={p.onReplay}>↺ 再看一遍</button>
        </div>
      )}
    </>
  );
}
