import { useCallback, useEffect, useRef, useState } from "react";
import { createMV } from "./mv";
import type { MV } from "./mv/engine";
import { LINES } from "./mv/lyricsData";
import { ARC, CASTING, CHAPTERS, LAYERS, LOGLINE, MAP, THEME } from "./mv/concept";
import bgmUrl from "./assets/bgm.mp3";

const DUR = 212.98;
const POSTER_T = 69.2; // 开始前的封面帧：黄昏的河边，两个逆光的人
const BAR_H = 92;
const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
const chapterAt = (t: number) => { let c = CHAPTERS[0]; for (const x of CHAPTERS) if (t >= x[0]) c = x; return c; };

export default function App() {
  const root = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const mvRef = useRef<MV | null>(null);
  const T = useRef(POSTER_T);
  const dirty = useRef(true);
  const playingRef = useRef(false);
  const startedRef = useRef(false);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState("");
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const [info, setInfo] = useState(false);

  // 初始化三维世界
  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const box = wrap.current!.getBoundingClientRect();
        const mv = await createMV(canvas.current!, Math.max(2, Math.round(box.width)), Math.max(2, Math.round(box.height)));
        if (dead) return;
        mvRef.current = mv;
        // 出片钩子（tools/shoot_vite_mv.mjs 用）：render(t, clean, w, h) 直接把当前帧吐成 PNG dataURL
        (window as any).__mv = {
          duration: DUR, shots: mv.shots.length, ready: () => true,
          render: (s: number, _clean?: boolean, w = 1280, h = Math.round((w * 9) / 16)) => {
            const c = canvas.current!;
            if (c.width !== w || c.height !== h) mv.resize(w, h);
            T.current = s; mv.render(s);
            return c.toDataURL("image/png");
          },
        };
        mv.render(T.current); setReady(true);
      } catch (e: any) { console.error(e); setErr(String(e?.message || e)); }
    })();
    return () => { dead = true; };
  }, []);

  // 尺寸跟随
  useEffect(() => {
    const el = wrap.current; if (!el) return;
    const ro = new ResizeObserver(() => { const r = el.getBoundingClientRect(); if (r.width > 1 && r.height > 1) mvRef.current?.resize(Math.round(r.width), Math.round(r.height)); dirty.current = true; });
    ro.observe(el); return () => ro.disconnect();
  }, []);

  // 渲染循环：播放时以音频时间为准
  useEffect(() => {
    let raf = 0, last = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const mv = mvRef.current; if (!mv) return;
      const a = audio.current;
      if (playingRef.current && a) { T.current = a.currentTime; if (a.ended) { T.current = DUR; playingRef.current = false; setPlaying(false); } dirty.current = true; }
      if (dirty.current) { dirty.current = false; mv.render(T.current); }
      if (now - last > 90) { last = now; setT(startedRef.current ? T.current : 0); }
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, []);

  const play = useCallback(() => {
    const a = audio.current; if (!a) return;
    if (!startedRef.current || a.ended || T.current >= DUR - 0.2) T.current = 0;
    a.currentTime = T.current;
    a.play().then(() => { startedRef.current = true; playingRef.current = true; setPlaying(true); setStarted(true); }).catch((e) => setErr("音频播放失败：" + e));
  }, []);
  const pause = useCallback(() => { audio.current?.pause(); playingRef.current = false; setPlaying(false); }, []);
  const seek = useCallback((v: number) => {
    v = Math.min(DUR, Math.max(0, v));
    if (!startedRef.current) { startedRef.current = true; setStarted(true); }
    T.current = v; if (audio.current) audio.current.currentTime = v; dirty.current = true; setT(v);
  }, []);
  const toggle = useCallback(() => (playingRef.current ? pause() : play()), [play, pause]);
  const fullscreen = useCallback(() => { if (document.fullscreenElement) document.exitFullscreen?.(); else root.current?.requestFullscreen?.().catch(() => {}); }, []);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.code === "Space") { e.preventDefault(); toggle(); }
      else if (e.code === "ArrowRight") seek(T.current + 3);
      else if (e.code === "ArrowLeft") seek(T.current - 3);
      else if (e.code === "KeyF") fullscreen();
      else if (e.code === "Escape") setInfo(false);
    };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, [toggle, seek, fullscreen]);

  const cur = started ? LINES.filter((l) => t >= l.s - 0.05 && t <= l.e + 0.35).slice(-1)[0] : undefined;
  const ended = started && !playing && t >= DUR - 0.25;
  const chap = chapterAt(t);

  return (
    <div ref={root} className="fixed inset-0 bg-[#05060b] text-white select-none overflow-hidden flex flex-col" style={{ fontFamily: "MVKuaile,'PingFang SC','Microsoft YaHei',sans-serif" }}>
      {/* 画面 */}
      <div className="flex-1 min-h-0 flex items-center justify-center">
        <div className="relative w-full" style={{ maxWidth: `calc((100dvh - ${BAR_H}px) * 16 / 9)`, aspectRatio: "16 / 9" }}>
          <div ref={wrap} className="absolute inset-0 bg-black overflow-hidden">
            <canvas ref={canvas} className="w-full h-full block cursor-pointer" onClick={() => started && toggle()} />
          </div>

          {!started && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-5" style={{ background: "radial-gradient(ellipse at 50% 55%, rgba(5,6,11,.72), rgba(5,6,11,.9) 75%)" }}>
              <div className="text-[9px] sm:text-[11px] tracking-[0.45em] text-indigo-200/70 mb-2 sm:mb-3">番外 MV · 逐字卡点 · 塞纳河左岸</div>
              <h1 className="font-black tracking-[0.2em] pl-[0.2em] leading-none mb-2 sm:mb-4" style={{ fontSize: "clamp(2.4rem, 9vw, 6.5rem)", background: "linear-gradient(180deg,#fff4f8 15%,#ff8fb4 95%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>告白气球</h1>
              <div className="text-indigo-100/80 tracking-[0.5em] text-xs sm:text-sm -mt-1 mb-3 sm:mb-5">周二珂</div>
              <p className="hidden sm:block max-w-xl text-sm md:text-base text-indigo-100/85 leading-relaxed mb-6">{LOGLINE}</p>
              {err ? <div className="text-red-300 text-sm max-w-lg">{err}</div> : (
                <button disabled={!ready} onClick={play} className="px-7 sm:px-9 py-2 sm:py-3 rounded-full border border-indigo-300/60 bg-indigo-500/25 hover:bg-indigo-400/45 active:scale-95 transition text-sm sm:text-lg tracking-[0.3em] pl-[calc(1.75rem+0.3em)] disabled:opacity-40 cursor-pointer disabled:cursor-wait">
                  {ready ? "▶ 开始播放" : "正在搭建舞台…"}
                </button>
              )}
              <div className="hidden md:block mt-5 text-[11px] text-indigo-200/50 tracking-wider">空格 播放 / 暂停 · ← → 快退快进 · F 全屏 · 建议戴耳机</div>
            </div>
          )}

          {ended && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center bg-black/70 px-5">
              <p className="text-indigo-100/90 tracking-[0.3em] leading-loose text-sm sm:text-xl mb-4 sm:mb-7">她没有说出口。<br />她的眼睛说了。</p>
              <div className="flex gap-3">
                <button onClick={play} className="px-6 sm:px-8 py-2 sm:py-2.5 rounded-full border border-white/50 hover:bg-white/10 tracking-[0.3em] text-sm cursor-pointer">重播</button>
                <button onClick={() => setInfo(true)} className="px-6 sm:px-8 py-2 sm:py-2.5 rounded-full border border-indigo-300/50 text-indigo-200 hover:bg-indigo-400/15 tracking-[0.3em] text-sm cursor-pointer">解读</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 控制条 */}
      <div className="shrink-0 w-full flex flex-col items-center justify-center gap-2 px-3 sm:px-5" style={{ height: BAR_H }}>
        <div className="h-7 flex items-center text-base sm:text-xl tracking-[0.25em] whitespace-nowrap overflow-hidden">
          {cur ? [...cur.text].map((ch, i) => <span key={cur.id + i} style={{ color: t >= cur.t[i] ? "#aab4ff" : "rgba(255,255,255,.26)", textShadow: t >= cur.t[i] && t < cur.t[i] + 0.25 ? "0 0 12px #7f94ff" : "none" }}>{ch}</span>)
            : <span className="text-[11px] sm:text-xs tracking-[0.4em] text-white/25">{started ? "· · ·" : "本鲸告白 · 小克的眼睛"}</span>}
        </div>
        <div className="flex items-center gap-2 sm:gap-3 w-full max-w-5xl">
          <button onClick={toggle} disabled={!ready} aria-label={playing ? "暂停" : "播放"} className="shrink-0 w-9 h-9 rounded-full border border-white/40 hover:bg-white/10 grid place-items-center text-sm cursor-pointer disabled:opacity-40">{playing ? "❚❚" : "▶"}</button>
          <span className="shrink-0 text-xs tabular-nums w-9 text-right text-white/70">{fmt(t)}</span>
          {/* 进度条：章节刻度 + 透明的原生滑块负责交互 */}
          <div className="relative flex-1 h-6 group">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 rounded-full bg-white/15 overflow-hidden">
              <div className="h-full bg-indigo-400" style={{ width: `${(t / DUR) * 100}%` }} />
            </div>
            {CHAPTERS.slice(1).map(([s, name]) => <div key={name} title={name} className="absolute top-1/2 -translate-y-1/2 w-[2px] h-2.5 bg-white/45" style={{ left: `${(s / DUR) * 100}%` }} />)}
            <div className="absolute top-1/2 w-3 h-3 -mt-1.5 -ml-1.5 rounded-full bg-indigo-200 shadow-[0_0_8px_#7f94ff] transition-transform group-hover:scale-125" style={{ left: `${(t / DUR) * 100}%` }} />
            <input type="range" aria-label="进度" min={0} max={DUR} step={0.05} value={t} onChange={(e) => seek(parseFloat(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
          </div>
          <span className="shrink-0 text-xs tabular-nums w-9 text-white/70">{fmt(DUR)}</span>
          <span className="hidden md:block shrink-0 w-28 text-[11px] text-indigo-200/70 tracking-widest truncate">{chap[1]}</span>
          <button onClick={() => setInfo((v) => !v)} className="shrink-0 px-3 h-8 text-xs rounded border border-white/30 hover:bg-white/10 tracking-widest cursor-pointer">解读</button>
          <button onClick={fullscreen} aria-label="全屏" title="全屏 (F)" className="hidden sm:grid shrink-0 w-8 h-8 rounded border border-white/30 hover:bg-white/10 place-items-center cursor-pointer"><svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M1 5V1h4M9 1h4v4M13 9v4H9M5 13H1V9" /></svg></button>
        </div>
      </div>

      {/* 解读面板 */}
      {info && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-[#05060b]/95 backdrop-blur-sm select-text" style={{ fontFamily: "MVKuaile,'PingFang SC','Microsoft YaHei',sans-serif" }}>
          <div className="max-w-4xl mx-auto px-5 sm:px-8 py-6 sm:py-10 text-sm leading-relaxed">
            <div className="sticky top-0 -mx-5 sm:-mx-8 px-5 sm:px-8 py-3 mb-4 flex items-center justify-between bg-[#05060b]/90 backdrop-blur border-b border-white/10">
              <h2 className="text-lg sm:text-2xl font-black tracking-widest text-indigo-200">歌词怎么读，画面怎么长</h2>
              <button onClick={() => setInfo(false)} className="px-4 py-1.5 border border-white/30 rounded hover:bg-white/10 cursor-pointer">关闭</button>
            </div>
            <p className="text-indigo-100/90 text-base leading-loose mb-8">{THEME}</p>

            <h3 className="text-indigo-300 font-bold tracking-widest mb-3">这支 MV 里，谁演谁</h3>
            <div className="grid gap-3 sm:grid-cols-2 mb-8">
              {CASTING.map(([who, role, habit, act, no], i) => (
                <div key={who} className={`rounded-lg border p-4 ${i === 0 ? "sm:col-span-2 border-indigo-400/60 bg-indigo-500/10" : "border-white/12 bg-white/[0.03]"}`}>
                  <div className="flex flex-wrap items-baseline gap-x-3 mb-1.5"><span className="font-bold text-indigo-200 text-base">{who}</span><span className="text-white/60">{role}</span></div>
                  <div className="text-white/55 mb-1"><span className="text-indigo-300/70">习性　</span>{habit}</div>
                  <div className="text-white/85"><span className="text-indigo-300/70">动作　</span>{act}</div>
                  <div className="text-white/45 mt-1"><span className="text-rose-300/70">不许　</span>{no}</div>
                </div>
              ))}
            </div>

            <h3 className="text-indigo-300 font-bold tracking-widest mb-3">整支片子的光</h3>
            <ul className="mb-8 space-y-2.5">{ARC.map(([a, b]) => <li key={a}><span className="text-indigo-200 font-bold">{a}</span>　<span className="text-white/80">{b}</span></li>)}</ul>

            <h3 className="text-indigo-300 font-bold tracking-widest mb-3">逐句对照</h3>
            <div className="mb-8 divide-y divide-white/8">
              {MAP.map(([a, b]) => (
                <div key={a} className="py-2 sm:grid sm:gap-6" style={{ gridTemplateColumns: "15rem 1fr" }}>
                  <div className="text-indigo-200">{a}</div><div className="text-white/80">{b}</div>
                </div>
              ))}
            </div>

            <h3 className="text-indigo-300 font-bold tracking-widest mb-3">三层要分开说</h3>
            <ul className="mb-8 space-y-2.5">{LAYERS.map(([a, b]) => <li key={a}><span className="inline-block px-2 py-0.5 mr-2 rounded bg-indigo-500/20 text-indigo-200 text-xs tracking-widest">{a}</span><span className="text-white/75">{b}</span></li>)}</ul>

            <h3 className="text-indigo-300 font-bold tracking-widest mb-3">下载工程</h3>
            <p className="text-white/70 mb-8">解开后把 <code className="text-rose-200">番外MV/告白气球/</code> 整个目录放进仓库的 <code className="text-rose-200">番外MV/</code>：
              <a className="ml-2 underline text-rose-200 hover:text-rose-100" href="./告白气球_MV.zip" download>告白气球_MV.zip</a>
              <a className="ml-4 underline text-rose-200 hover:text-rose-100" href="./告白气球_README.md" target="_blank" rel="noreferrer">README.md</a></p>
            <h3 className="text-indigo-300 font-bold tracking-widest mb-3">卡点是怎么来的</h3>
            <p className="text-white/70 mb-4">每个字的起音取自周二珂这一版的逐字时间轴（酷狗 KRC，213 秒版），再和这份 mp3 的起音曲线做互相关，整体校正负五十毫秒。字按歌词里的空格切成词组，在起音那一拍像气球一样从下方浮起来，唱完往上飘走；字卡只放在画面上下或两侧，不压在人脸上。</p>
          </div>
        </div>
      )}
      <audio ref={audio} src={bgmUrl} preload="auto" />
    </div>
  );
}
