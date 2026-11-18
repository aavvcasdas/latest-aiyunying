import { useCallback, useEffect, useRef, useState } from "react";
import { createMV } from "./mv";
import type { MV } from "./mv/engine";
import { LINES } from "./mv/lyricsData";
import { ARC, MAP, THEME } from "./mv/concept";
import bgmUrl from "./assets/bgm.m4a";

const DUR = 152.1;
const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;

export default function App() {
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const mvRef = useRef<MV | null>(null);
  const T = useRef(0);
  const dirty = useRef(true);
  const playingRef = useRef(false);
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
        const mv = await createMV(canvas.current!, Math.round(box.width), Math.round(box.height));
        if (dead) return;
        mvRef.current = mv;
        // 出片钩子（tools/shoot_vite_mv.mjs 用）：render(t, clean, w, h) 直接把当前帧吐成 JPEG dataURL
        (window as any).__mv = {
          duration: DUR, shots: mv.shots.length, ready: () => true,
          render: (s: number, _clean?: boolean, w = 1280, h = 720) => {
            const c = canvas.current!;
            if (c.width !== w || c.height !== h) mv.resize(w, h);
            T.current = s; mv.render(s);
            return c.toDataURL("image/jpeg", 0.94);
          },
        };
        mv.render(0); setReady(true);
      } catch (e: any) { console.error(e); setErr(String(e?.message || e)); }
    })();
    return () => { dead = true; };
  }, []);

  // 尺寸跟随
  useEffect(() => {
    const el = wrap.current; if (!el) return;
    const ro = new ResizeObserver(() => { const r = el.getBoundingClientRect(); mvRef.current?.resize(Math.round(r.width), Math.round(r.height)); dirty.current = true; });
    ro.observe(el); return () => ro.disconnect();
  }, []);

  // 渲染循环：播放时以音频时间为准
  useEffect(() => {
    let raf = 0, last = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const mv = mvRef.current; if (!mv) return;
      const a = audio.current;
      if (playingRef.current && a) { T.current = a.currentTime; if (a.ended) { playingRef.current = false; setPlaying(false); } dirty.current = true; }
      if (dirty.current) { dirty.current = false; mv.render(T.current); }
      if (now - last > 90) { last = now; setT(T.current); }
    };
    raf = requestAnimationFrame(loop); return () => cancelAnimationFrame(raf);
  }, []);

  const play = useCallback(() => {
    const a = audio.current; if (!a) return;
    if (a.ended || T.current >= DUR - 0.2) { a.currentTime = 0; T.current = 0; }
    a.currentTime = T.current; a.play().then(() => { playingRef.current = true; setPlaying(true); setStarted(true); }).catch((e) => setErr("音频播放失败：" + e));
  }, []);
  const pause = useCallback(() => { audio.current?.pause(); playingRef.current = false; setPlaying(false); }, []);
  const seek = (v: number) => { T.current = v; if (audio.current) audio.current.currentTime = v; dirty.current = true; setT(v); };

  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.code === "Space") { e.preventDefault(); playingRef.current ? pause() : play(); } if (e.code === "ArrowRight") seek(Math.min(DUR, T.current + 3)); if (e.code === "ArrowLeft") seek(Math.max(0, T.current - 3)); };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, [play, pause]);

  const cur = LINES.filter((l) => t >= l.s - 0.05 && t <= l.e + 0.35).slice(-1)[0];

  return (
    <div className="fixed inset-0 bg-black text-white select-none overflow-hidden flex flex-col items-center justify-center" style={{ fontFamily: "MVSerif,'Noto Serif SC','Songti SC','SimSun',serif" }}>
      <div className="relative w-full" style={{ maxWidth: "calc((100vh - 76px) * 16 / 9)", aspectRatio: "16 / 9" }}>
        <div ref={wrap} className="absolute inset-0 bg-black overflow-hidden">
          <canvas ref={canvas} className="w-full h-full block" onClick={() => (playing ? pause() : started && play())} />
        </div>

        {!started && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6" style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(40,48,120,.55), rgba(0,0,0,.92) 70%)" }}>
            <div className="text-[11px] tracking-[0.5em] text-indigo-200/70 mb-3">3D 逐字卡点 · 重新构造的 MV</div>
            <h1 className="text-6xl md:text-8xl font-black tracking-[0.2em] mb-3" style={{ background: "linear-gradient(180deg,#7f86ff,#f2f3ff)", WebkitBackgroundClip: "text", color: "transparent" }}>譬如我</h1>
            <p className="max-w-xl text-sm md:text-base text-indigo-100/80 leading-relaxed mb-7">{THEME}</p>
            {err ? <div className="text-red-300 text-sm max-w-lg">{err}</div> : (
              <button disabled={!ready} onClick={play} className="px-9 py-3 rounded-full border border-indigo-300/60 bg-indigo-500/20 hover:bg-indigo-400/40 transition text-lg tracking-[0.3em] disabled:opacity-40">
                {ready ? "▶ 开始播放" : "正在搭建舞台…"}
              </button>
            )}
            <div className="mt-5 text-[11px] text-indigo-200/50">空格 播放/暂停 · ←/→ 快进快退 · 建议戴耳机</div>
          </div>
        )}

        {started && !playing && t >= DUR - 0.3 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40"><button onClick={play} className="px-8 py-3 rounded-full border border-white/50 hover:bg-white/10 tracking-[0.3em]">重播</button></div>
        )}

        {info && (
          <div className="absolute inset-0 overflow-y-auto bg-black/88 backdrop-blur-sm p-6 md:p-10 text-sm leading-relaxed">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-4"><h2 className="text-2xl font-black tracking-widest text-indigo-200">歌词怎么读，画面怎么长</h2><button onClick={() => setInfo(false)} className="px-3 py-1 border border-white/30 rounded hover:bg-white/10">关闭</button></div>
              <p className="text-indigo-100/85 mb-5">{THEME}</p>
              <h3 className="text-indigo-300 font-bold mb-2">整支片子的光</h3>
              <ul className="mb-6 space-y-2">{ARC.map(([a, b]) => <li key={a}><span className="text-indigo-200 font-bold">{a}</span>　{b}</li>)}</ul>
              <h3 className="text-indigo-300 font-bold mb-2">逐句对照</h3>
              <div className="grid gap-x-6 gap-y-2" style={{ gridTemplateColumns: "minmax(0,14rem) 1fr" }}>
                {MAP.map(([a, b]) => (<div key={a} className="contents"><div className="text-indigo-200">{a}</div><div className="text-white/80">{b}</div></div>))}
              </div>
              <h3 className="text-indigo-300 font-bold mt-6 mb-2">卡点是怎么来的</h3>
              <p className="text-white/75">音轨取自原片（AAC 无损抽出）。每个字的起音由「音轨频谱起音检测 + 原片画面切点 + 约 74 BPM 的拍点」共同对齐，三遍主歌各自实测，不是复制同一份时间表；
                每个字都是真正挤出厚度、带倒角的三维字形，字在起音那一拍从镜头前砸进字槽，词组按语义拆开，整句在下一句的第一个字之前退场。</p>
            </div>
          </div>
        )}
      </div>

      {/* 控制条 */}
      <div className="w-full flex flex-col items-center gap-1 px-4 pt-2" style={{ height: 76 }}>
        <div className="h-6 text-lg tracking-[0.25em] flex gap-[1px] text-indigo-100/90 whitespace-nowrap overflow-hidden">
          {cur && [...cur.text].map((ch, i) => <span key={i} style={{ color: t >= cur.t[i] ? "#aab4ff" : "rgba(255,255,255,.28)", textShadow: t >= cur.t[i] && t < cur.t[i] + 0.25 ? "0 0 12px #7f94ff" : "none" }}>{ch}</span>)}
        </div>
        <div className="flex items-center gap-3 w-full max-w-4xl">
          <button onClick={() => (playing ? pause() : play())} disabled={!ready} className="w-9 h-9 rounded-full border border-white/40 hover:bg-white/10 grid place-items-center text-sm">{playing ? "❚❚" : "▶"}</button>
          <span className="text-xs tabular-nums w-10 text-right text-white/70">{fmt(t)}</span>
          <input type="range" min={0} max={DUR} step={0.05} value={t} onChange={(e) => seek(parseFloat(e.target.value))} className="flex-1 accent-indigo-400" />
          <span className="text-xs tabular-nums w-10 text-white/70">{fmt(DUR)}</span>
          <button onClick={() => setInfo((v) => !v)} className="px-3 h-8 text-xs rounded border border-white/30 hover:bg-white/10 tracking-widest">解读</button>
        </div>
      </div>
      <audio ref={audio} src={bgmUrl} preload="auto" />
    </div>
  );
}
