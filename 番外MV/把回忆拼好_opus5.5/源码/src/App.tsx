import { useEffect, useRef, useState } from 'react';
import songUrl from './assets/song.mp3';
import { Stage } from './mv/stage';
import { loadFont } from './mv/glyphs';
import { loadAtlas } from './mv/kit';
import { SHOTS_A } from './mv/shotsA';
import { SHOTS_B } from './mv/shotsB';
import { DURATION, LINES, lineAt, TITLE_START } from './mv/timing';

const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const stageRef = useRef<Stage | null>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const fadeRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState('');
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [shot, setShot] = useState(0);
  const manualT = useRef(0);

  useEffect(() => {
    let raf = 0;
    let disposed = false;
    (async () => {
      try {
        await Promise.all([loadFont(), loadAtlas()]);
        if (disposed) return;
        const st = new Stage(canvasRef.current!);
        st.setShots([...SHOTS_A, ...SHOTS_B]);
        stageRef.current = st;
        const q = new URLSearchParams(location.search).get('t');
        if (q) {
          manualT.current = parseFloat(q);
          setStarted(true);
        }
        (window as unknown as { __seek: (t: number) => void }).__seek = (t: number) => {
          manualT.current = t;
          if (audioRef.current) audioRef.current.currentTime = t;
        };
        // 出片用：给定时间 → 渲一帧并把画面读成 JPEG dataURL（顺带报出闪白 / 淡出的不透明度，
        // 这两层是 DOM 叠层，画不进 canvas，交给截帧脚本在后期合成）。
        const off = document.createElement('canvas');
        const offCtx = off.getContext('2d')!;
        (window as unknown as { __mvRender: (t: number) => { url: string; flash: number; fade: number } }).__mvRender = (t: number) => {
          manualT.current = t;
          st.render(Math.min(DURATION - 0.001, t));
          // 闪白 / 淡出是 DOM 叠层，画不进 canvas：在这里补到一张离屏 2D 画布上再导出
          const src = canvasRef.current!;
          if (off.width !== src.width || off.height !== src.height) { off.width = src.width; off.height = src.height; }
          const g = offCtx;
          g.drawImage(src, 0, 0);
          if (st.flash > 0) { g.fillStyle = `rgba(255,255,255,${Math.min(1, st.flash)})`; g.fillRect(0, 0, off.width, off.height); }
          if (st.fade > 0) { g.fillStyle = `rgba(0,0,0,${Math.min(1, st.fade)})`; g.fillRect(0, 0, off.width, off.height); }
          return { url: off.toDataURL('image/jpeg', 0.93), flash: st.flash, fade: st.fade };
        };
        // 出封面用：同一套渲染，只是不画歌词条
        (window as unknown as { __mvCover: (t: number) => string }).__mvCover = (t: number) => {
          manualT.current = t;
          st.hideLyrics = true;
          st.render(Math.min(DURATION - 0.001, t));
          st.hideLyrics = false;
          const src = canvasRef.current!;
          if (off.width !== src.width || off.height !== src.height) { off.width = src.width; off.height = src.height; }
          const g = offCtx;
          g.drawImage(src, 0, 0);
          if (st.flash > 0) { g.fillStyle = `rgba(255,255,255,${Math.min(1, st.flash)})`; g.fillRect(0, 0, off.width, off.height); }
          if (st.fade > 0) { g.fillStyle = `rgba(0,0,0,${Math.min(1, st.fade)})`; g.fillRect(0, 0, off.width, off.height); }
          return off.toDataURL('image/jpeg', 0.95);
        };
        const resize = () => {
          const b = boxRef.current!.getBoundingClientRect();
          st.resize(Math.max(2, Math.round(b.width)), Math.max(2, Math.round(b.height)));
        };
        resize();
        new ResizeObserver(resize).observe(boxRef.current!);
        let lastUi = 0;
        const loop = () => {
          const a = audioRef.current!;
          const t = !a.paused ? a.currentTime : manualT.current;
          if (!a.paused) manualT.current = t;
          st.render(Math.min(DURATION - 0.001, t));
          if (flashRef.current) flashRef.current.style.opacity = String(st.flash);
          if (fadeRef.current) fadeRef.current.style.opacity = String(st.fade);
          const now = performance.now();
          if (now - lastUi > 100) {
            lastUi = now;
            setTime(t);
            setShot(st.current(t));
          }
          raf = requestAnimationFrame(loop);
        };
        loop();
        setReady(true);
      } catch (e) {
        console.error(e);
        setErr(String(e));
      }
    })();
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
    };
  }, []);

  const play = async () => {
    const a = audioRef.current!;
    if (a.ended || a.currentTime >= DURATION - 0.05) a.currentTime = 0;
    await a.play();
    setStarted(true);
  };
  const toggle = () => (audioRef.current!.paused ? play() : audioRef.current!.pause());
  const seek = (t: number) => {
    manualT.current = t;
    audioRef.current!.currentTime = t;
    setTime(t);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        toggle();
      }
      if (e.code === 'ArrowRight') seek(Math.min(DURATION, manualT.current + 2));
      if (e.code === 'ArrowLeft') seek(Math.max(0, manualT.current - 2));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const shots = stageRef.current?.shots ?? [];
  const li = time >= TITLE_START ? -1 : lineAt(time);

  return (
    <div className="min-h-screen w-full bg-[#14121c] text-[#f3e9dc] flex flex-col items-center" style={{ fontFamily: 'KuaiLe, system-ui, sans-serif' }}>
      <div className="w-full max-w-[1280px] px-3 pt-4 pb-2 flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl tracking-wider">《把回忆拼好给你》</h1>
          <p className="text-xs md:text-sm text-[#bfb3a6] mt-1">立体拼图版 · 本鲸 × 小克</p>
        </div>
        <div className="text-xs text-[#8f8478] text-right hidden sm:block">
          空格 播放暂停 · 左右键 快退快进
        </div>
      </div>

      <div className="w-full max-w-[1280px] px-3">
        <div ref={boxRef} className="relative w-full aspect-video rounded-xl overflow-hidden shadow-2xl bg-black ring-1 ring-white/10">
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" onClick={() => started && toggle()} />
          <div ref={flashRef} className="pointer-events-none absolute inset-0 bg-white" style={{ opacity: 0 }} />
          <div ref={fadeRef} className="pointer-events-none absolute inset-0 bg-black" style={{ opacity: 0 }} />
          {!started && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-[#2a2448]/80 via-[#5a3f6a]/70 to-[#f0a88a]/60 backdrop-blur-[2px]">
              <div className="text-3xl md:text-5xl tracking-[0.2em] drop-shadow-lg">把回忆拼好给你</div>
              <div className="mt-3 text-sm md:text-base text-[#fbe8d8]/90">本鲸（我） · 小克（你）</div>
              <button
                disabled={!ready}
                onClick={play}
                className="mt-8 px-8 py-3 rounded-full bg-[#ffd36e] text-[#5a2a1a] text-lg shadow-lg hover:scale-105 active:scale-95 transition disabled:opacity-50"
              >
                {err ? '加载失败' : ready ? '点击播放' : '拼图块加载中…'}
              </button>
              {err && <div className="mt-3 text-xs text-red-300 max-w-md text-center">{err}</div>}
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center gap-3">
          <button onClick={toggle} disabled={!ready} className="w-11 h-11 shrink-0 rounded-full bg-[#ffd36e] text-[#5a2a1a] flex items-center justify-center shadow hover:brightness-105">
            {playing ? (
              <svg width="16" height="16" viewBox="0 0 16 16"><rect x="3" y="2" width="3.5" height="12" rx="1" fill="currentColor" /><rect x="9.5" y="2" width="3.5" height="12" rx="1" fill="currentColor" /></svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16"><path d="M4 2.5v11l9-5.5z" fill="currentColor" /></svg>
            )}
          </button>
          <span className="text-xs tabular-nums text-[#bfb3a6] w-10">{fmt(time)}</span>
          <div className="relative flex-1 h-8 flex items-center">
            <div className="absolute inset-x-0 h-2 rounded-full bg-white/10 overflow-hidden flex">
              {shots.map((s, i) => (
                <div key={i} className="h-full border-r border-black/40" style={{ width: `${((Math.min(DURATION, s.end) - s.start) / DURATION) * 100}%`, background: i === shot ? '#ffd36e' : i % 2 ? '#ffffff22' : '#ffffff14' }} />
              ))}
            </div>
            <input
              type="range"
              min={0}
              max={DURATION}
              step={0.01}
              value={time}
              onChange={(e) => seek(parseFloat(e.target.value))}
              className="absolute inset-x-0 w-full opacity-0 cursor-pointer h-8"
            />
            <div className="absolute w-3 h-3 rounded-full bg-white shadow pointer-events-none" style={{ left: `calc(${(time / DURATION) * 100}% - 6px)` }} />
          </div>
          <span className="text-xs tabular-nums text-[#8f8478] w-10 text-right">{fmt(DURATION)}</span>
        </div>
      </div>

      <div className="w-full max-w-[1280px] px-3 py-5 grid md:grid-cols-2 gap-4">
        <section className="rounded-xl bg-white/[0.04] ring-1 ring-white/10 p-4">
          <h2 className="text-lg mb-3 text-[#ffd36e]">歌词（逐字卡点）</h2>
          <ol className="space-y-1.5 text-sm">
            {LINES.map((l, i) => (
              <li key={i}>
                <button onClick={() => seek(l.start + 0.01)} className={`text-left w-full rounded px-2 py-1 transition ${i === li ? 'bg-[#ffd36e]/15' : 'hover:bg-white/5'}`}>
                  <span className="text-[#8f8478] tabular-nums mr-2 text-xs">{fmt(l.start)}</span>
                  {[...l.text].map((ch, k) => {
                    const on = i === li && time >= l.chars[k];
                    const key = l.keys.some(([a, b]) => k >= a && k < b);
                    return (
                      <span key={k} className={on ? (key ? 'text-[#ff8f6b]' : 'text-[#ffd36e]') : key ? 'text-[#e8cdb8]' : 'text-[#cfc4b8]'}>
                        {ch}
                      </span>
                    );
                  })}
                </button>
              </li>
            ))}
          </ol>
        </section>
        <section className="rounded-xl bg-white/[0.04] ring-1 ring-white/10 p-4">
          <h2 className="text-lg mb-3 text-[#ffd36e]">分镜（一句一镜）</h2>
          <ol className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-sm">
            {shots.map((s, i) => (
              <li key={i}>
                <button onClick={() => seek(s.start + 0.08)} className={`w-full text-left rounded px-2 py-1.5 transition ${i === shot ? 'bg-[#ffd36e]/15 text-[#ffd36e]' : 'hover:bg-white/5 text-[#cfc4b8]'}`}>
                  <span className="text-xs text-[#8f8478] mr-2">{s.def.id.replace('S', '')}</span>
                  {s.def.name}
                </button>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-xs leading-relaxed text-[#8f8478]">
            原曲音轨与歌词时间取自原视频；人物来自分支图集（本鲸、小克）。每个字是一块立体拼图，在它被唱出的那一刻落下。
          </p>
        </section>
      </div>

      <audio
        ref={audioRef}
        src={songUrl}
        preload="auto"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
    </div>
  );
}
