import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import mp3Url from '../assets/goujiqishi.mp3';
import fontUrl from '../assets/ZCOOLKuaiLe-Regular.ttf';
import { castPreflight, FilmEngine, loadAtlas } from '../mv/engine';
import { H, W } from '../mv/kit';
import { DURATION, fmt, type Shot } from '../mv/timeline';
import { cn } from '../utils/cn';

export type PlayerHandle = { seek: (t: number, play?: boolean) => void };

interface Props {
  engine: FilmEngine;
  onTime?: (t: number, shotIndex: number) => void;
  handleRef?: React.MutableRefObject<PlayerHandle | null>;
}

type Status = 'loading' | 'ready' | 'error';

export default function MVPlayer({ engine, onTime, handleRef }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [problems, setProblems] = useState<string[]>([]);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [shotIdx, setShotIdx] = useState(0);
  const [quality, setQuality] = useState(1);
  const [fps, setFps] = useState(0);
  const [showUi, setShowUi] = useState(true);
  const qualityRef = useRef(1);
  const lastRender = useRef(-1);
  const frameTimes = useRef<number[]>([]);
  const hideTimer = useRef<number | null>(null);

  // 加载：图集 + 字体 → 角色预检
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const face = new FontFace('ZCOOL KuaiLe', `url("${fontUrl}")`);
        await face.load();
        document.fonts.add(face);
        await loadAtlas();
        const small = document.createElement('canvas'); small.width = W / 4; small.height = H / 4;
        const ctx = small.getContext('2d')!; ctx.scale(0.25, 0.25);
        const probs = castPreflight(engine, small, 2);
        if (!alive) return;
        setProblems(probs);
        setStatus('ready');
      } catch (e) {
        if (!alive) return;
        setProblems([(e as Error).message]);
        setStatus('error');
      }
    })();
    return () => { alive = false; };
  }, [engine]);

  const draw = useCallback((T: number, force = false) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const q = qualityRef.current;
    const cw = Math.round(W * q), ch = Math.round(H * q);
    if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; }
    if (!force && Math.abs(T - lastRender.current) < 1 / 31) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const t0 = performance.now();
    ctx.setTransform(q, 0, 0, q, 0, 0);
    ctx.clearRect(0, 0, W, H);
    try { engine.render(ctx, Math.min(T, DURATION - 0.001)); } catch (e) { console.error(e); }
    lastRender.current = T;
    const dt = performance.now() - t0;
    const ft = frameTimes.current; ft.push(dt); if (ft.length > 45) ft.shift();
    if (ft.length === 45) {
      const avg = ft.reduce((a, b) => a + b, 0) / ft.length;
      if (avg > 30 && qualityRef.current > 0.5) { qualityRef.current = Math.max(0.5, qualityRef.current - 0.25); setQuality(qualityRef.current); ft.length = 0; }
      setFps(Math.round(1000 / Math.max(avg, 1000 / 30)));
    }
    const si = engine.shotIndex(T);
    setShotIdx(si); setTime(T); onTime?.(T, si);
  }, [engine, onTime]);

  // 出片用：给时间就给一帧（原尺寸 1920×1080，不走自适应降质），tools/shoot_opus_mv.mjs 走这条路。
  // 预览循环里的自适应降质靠 qualityRef，这里每次先钉回 1，画出来的永远是满分辨率。
  useEffect(() => {
    if (status !== 'ready') return;
    (window as unknown as { __mvRender: (t: number) => string }).__mvRender = (t: number) => {
      qualityRef.current = 1;
      draw(Math.max(0, Math.min(DURATION - 0.001, t)), true);
      return canvasRef.current!.toDataURL('image/jpeg', 0.95);
    };
  }, [status, draw]);

  // 渲染循环：跟着音频时间走
  useEffect(() => {
    if (status !== 'ready') return;
    let raf = 0;
    const loop = () => {
      const a = audioRef.current;
      if (a) { const T = a.currentTime; if (!a.paused) draw(T); }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    draw(0, true);
    return () => cancelAnimationFrame(raf);
  }, [status, draw]);

  const play = useCallback(async () => {
    const a = audioRef.current; if (!a) return;
    if (a.ended || a.currentTime >= DURATION - 0.05) a.currentTime = 0;
    try { await a.play(); setPlaying(true); setStarted(true); } catch (e) { console.error(e); }
  }, []);
  const pause = useCallback(() => { audioRef.current?.pause(); setPlaying(false); }, []);
  const toggle = useCallback(() => { if (audioRef.current?.paused) void play(); else pause(); }, [play, pause]);
  const seek = useCallback((t: number, doPlay?: boolean) => {
    const a = audioRef.current; if (!a) return;
    a.currentTime = Math.max(0, Math.min(DURATION - 0.01, t));
    draw(a.currentTime, true);
    if (doPlay) void play();
  }, [draw, play]);

  useEffect(() => { if (handleRef) handleRef.current = { seek }; }, [handleRef, seek]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (status !== 'ready') return;
      if (e.code === 'Space') { e.preventDefault(); toggle(); }
      if (e.code === 'ArrowLeft') seek((audioRef.current?.currentTime ?? 0) - 5);
      if (e.code === 'ArrowRight') seek((audioRef.current?.currentTime ?? 0) + 5);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [status, toggle, seek]);

  const onEnded = () => { setPlaying(false); draw(DURATION - 0.001, true); };
  const poke = () => {
    setShowUi(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setShowUi(false), 2600);
  };
  const fullscreen = () => { const el = wrapRef.current; if (!el) return; if (document.fullscreenElement) void document.exitFullscreen(); else void el.requestFullscreen?.(); };

  const shot: Shot | undefined = engine.shots[shotIdx];
  const progress = useMemo(() => (time / DURATION) * 100, [time]);

  return (
    <div ref={wrapRef} className="mv-wrap relative w-full select-none bg-black" onMouseMove={poke} onTouchStart={poke}>
      <div className="mv-box relative w-full" style={{ aspectRatio: '16 / 9' }}>
        <canvas ref={canvasRef} width={W} height={H} className="absolute inset-0 h-full w-full" style={{ imageRendering: 'auto' }} onClick={() => { if (status === 'ready' && started) toggle(); }} />
        <audio ref={audioRef} src={mp3Url} preload="auto" onEnded={onEnded} onPause={() => setPlaying(false)} onPlay={() => setPlaying(true)} />

        {/* 加载 / 开始 */}
        {(!started || status !== 'ready') && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1a1412]/80 backdrop-blur-sm">
            {status === 'loading' && (
              <div className="flex flex-col items-center gap-4 text-amber-100/90">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-200/30 border-t-amber-300" />
                <div className="text-sm tracking-widest">正在装载图集、字体与角色预检…</div>
              </div>
            )}
            {status === 'error' && (
              <div className="max-w-xl rounded-xl border border-red-300/40 bg-red-950/60 p-6 text-red-100">
                <div className="mb-2 font-semibold">素材没有就位，不能出片</div>
                <ul className="list-disc pl-5 text-sm">{problems.map((p, i) => <li key={i}>{p}</li>)}</ul>
              </div>
            )}
            {status === 'ready' && (
              <button onClick={() => void play()} className="group flex flex-col items-center gap-5 focus:outline-none">
                <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-amber-200/70 bg-amber-300/10 transition group-hover:scale-105 group-hover:bg-amber-300/25">
                  <svg viewBox="0 0 24 24" className="ml-1 h-11 w-11 fill-amber-100"><path d="M8 5v14l11-7z" /></svg>
                </div>
                <div className="text-center">
                  <div className="font-kuaile text-4xl tracking-[0.3em] text-amber-100">勾指起誓</div>
                  <div className="mt-2 text-sm tracking-widest text-amber-100/70">点击开始播放 · 1920×1080 · 3 分 03 秒 · 51 镜</div>
                  {problems.length > 0 && <div className="mt-3 text-xs text-red-200">角色预检有 {problems.length} 处提醒：{problems[0]}</div>}
                </div>
              </button>
            )}
          </div>
        )}

        {/* 控制条 */}
        {started && status === 'ready' && (
          <div className={cn('absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent px-4 pb-3 pt-10 transition-opacity duration-500', showUi || !playing ? 'opacity-100' : 'opacity-0')}>
            <div className="group relative mb-2 h-2 w-full cursor-pointer rounded-full bg-white/20" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); seek(((e.clientX - r.left) / r.width) * DURATION); }}>
              {engine.shots.map((s) => <div key={s.id} className="absolute top-0 h-full w-px bg-white/25" style={{ left: `${(s.start / DURATION) * 100}%` }} />)}
              <div className="absolute left-0 top-0 h-full rounded-full bg-amber-300" style={{ width: `${progress}%` }} />
              <div className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber-200 shadow" style={{ left: `${progress}%` }} />
            </div>
            <div className="flex items-center gap-3 text-sm text-white/90">
              <button onClick={toggle} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20" aria-label={playing ? '暂停' : '播放'}>
                {playing ? <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M6 5h4v14H6zm8 0h4v14h-4z" /></svg> : <svg viewBox="0 0 24 24" className="ml-0.5 h-5 w-5 fill-current"><path d="M8 5v14l11-7z" /></svg>}
              </button>
              <span className="tabular-nums">{fmt(time)} / {fmt(DURATION)}</span>
              {shot && <span className="hidden truncate rounded bg-white/10 px-2 py-0.5 text-xs text-amber-100 sm:inline">{shot.id} · {shot.section} · {shot.title}</span>}
              <span className="ml-auto hidden text-xs text-white/50 sm:inline">{Math.round(W * quality)}×{Math.round(H * quality)}{fps ? ` · ${fps} fps` : ''}</span>
              <button onClick={fullscreen} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20" aria-label="全屏">
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-2"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
