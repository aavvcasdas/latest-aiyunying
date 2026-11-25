import { useCallback, useEffect, useRef, useState } from 'react';
import atlasUrl from '../assets/atlas.png';
import tachieUrl from '../assets/tachie_whale.png';
import fishUrl from '../assets/benyu.png';
import bgmUrl from '../assets/bgm.mp3';
import { W, H } from './kit';
import { loadImage, setImages } from './cast';
import { DUR, renderFrame } from './film';

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export default function Player() {
  const wrap = useRef<HTMLDivElement>(null);
  const cvs = useRef<HTMLCanvasElement>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const clock = useRef({ t: 0, perf: 0, drawn: -1 });
  const hideTimer = useRef<number>(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [time, setTime] = useState(0);
  const [muted, setMuted] = useState(false);
  const [ui, setUi] = useState(true);
  // 出片时把封面卡 / 控制条收起来，只留画布本体。
  // captureRef 是同步开关：外部一调 render() 就置位，页面自己的 rAF 循环立刻停手，
  // 不会再拿音轨时间（封面帧 9.6s）把刚画好的那一帧盖掉。
  const [capture, setCapture] = useState(false);
  const captureRef = useRef(false);

  // 素材：图集、立绘、音轨
  useEffect(() => {
    let dead = false, url = '';
    (async () => {
      try {
        const [a, t, f] = await Promise.all([loadImage(atlasUrl), loadImage(tachieUrl), loadImage(fishUrl)]);
        setImages(a, t, f);
        let src = bgmUrl;
        try { const blob = await (await fetch(bgmUrl)).blob(); url = URL.createObjectURL(blob); src = url; } catch { /* 取不到就直接用内嵌地址 */ }
        if (dead) return;
        if (audio.current) { audio.current.src = src; audio.current.load(); }
        setReady(true);
      } catch (e) { if (!dead) setError('素材加载失败，请刷新重试'); console.error(e); }
    })();
    return () => { dead = true; if (url) URL.revokeObjectURL(url); };
  }, []);

  // 画布尺寸跟着容器走
  const resize = useCallback(() => {
    const el = wrap.current, cv = cvs.current; if (!el || !cv) return;
    const bw = el.clientWidth, bh = el.clientHeight, cw = Math.min(bw, (bh * W) / H), dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pw = Math.round(Math.min(1920, Math.max(640, cw * dpr))), ph = Math.round((pw * H) / W);
    if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; clock.current.drawn = -1; }
    cv.style.width = `${cw}px`; cv.style.height = `${(cw * H) / W}px`;
  }, []);
  useEffect(() => { resize(); window.addEventListener('resize', resize); document.addEventListener('fullscreenchange', resize); return () => { window.removeEventListener('resize', resize); document.removeEventListener('fullscreenchange', resize); }; }, [resize]);

  // 逐帧：时间只认音轨
  useEffect(() => {
    if (!ready) return;
    let raf = 0, lastUi = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const a = audio.current, cv = cvs.current, k = clock.current; if (!a || !cv) return;
      if (captureRef.current) return; // 出片中：画面只由 __mv.render() 决定
      let t = a.currentTime;
      if (!a.paused && !a.ended) {
        const est = k.t + (now - k.perf) / 1000;
        if (Math.abs(est - t) < 0.12 && est >= t - 0.02) t = est; else { k.t = t; k.perf = now; }
      } else { k.t = t; k.perf = now; }
      if (!started && t === 0) t = 9.6; // 封面帧
      if (Math.abs(t - k.drawn) < 1e-4) return;
      k.drawn = t;
      const c = cv.getContext('2d'); if (!c) return;
      const sc = cv.width / W; c.setTransform(sc, 0, 0, sc, 0, 0);
      renderFrame(c, t, { sub: started });
      if (now - lastUi > 200) { lastUi = now; setTime(a.currentTime); }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [ready, started]);

  // 出片钩子：外部按帧调用 __mv.render(t) 就能拿到固定 1280×720 的画面。
  // 只在 window 上挂一个对象，页面本身行为不变（播放、拖进度条仍是原来那套）。
  useEffect(() => {
    const api = {
      ready: () => Boolean(ready && cvs.current),
      width: W,
      height: H,
      dur: DUR,
      render: (t: number, _noLyric = false, width = W) => {
        const cv = cvs.current; if (!cv) return false;
        captureRef.current = true;
        const pw = width || W, ph = Math.round((pw * H) / W);
        if (cv.width !== pw || cv.height !== ph) { cv.width = pw; cv.height = ph; }
        cv.style.width = `${pw}px`; cv.style.height = `${ph}px`;
        clock.current.drawn = -1;
        const c = cv.getContext('2d'); if (!c) return false;
        c.setTransform(1, 0, 0, 1, 0, 0);
        c.clearRect(0, 0, pw, ph);
        const sc = pw / W; c.setTransform(sc, 0, 0, sc, 0, 0);
        renderFrame(c, t, { sub: true });
        setCapture(true);
        return true;
      },
    };
    (window as unknown as { __mv: unknown }).__mv = api;
    return () => { delete (window as unknown as { __mv?: unknown }).__mv; };
  }, [ready]);

  const poke = useCallback(() => {
    setUi(true); window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => { if (audio.current && !audio.current.paused) setUi(false); }, 2600);
  }, []);
  const toggle = useCallback(() => {
    const a = audio.current; if (!a || !ready) return;
    if (a.ended || a.currentTime >= DUR - 0.05) a.currentTime = 0;
    if (a.paused) { setStarted(true); setEnded(false); a.play().catch(() => setError('浏览器拦截了自动播放，请再点一次')); } else a.pause();
    poke();
  }, [ready, poke]);
  const seek = useCallback((t: number) => { const a = audio.current; if (!a) return; a.currentTime = Math.max(0, Math.min(DUR - 0.05, t)); setTime(a.currentTime); setEnded(false); clock.current.drawn = -1; poke(); }, [poke]);
  const full = useCallback(() => { const el = wrap.current; if (!el) return; if (document.fullscreenElement) document.exitFullscreen(); else el.requestFullscreen?.().catch(() => undefined); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === 'k') { e.preventDefault(); toggle(); }
      else if (e.key === 'ArrowRight') seek((audio.current?.currentTime ?? 0) + 5);
      else if (e.key === 'ArrowLeft') seek((audio.current?.currentTime ?? 0) - 5);
      else if (e.key === 'f') full();
      else if (e.key === 'm') setMuted((m) => !m);
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [toggle, seek, full]);
  useEffect(() => { if (audio.current) audio.current.muted = muted; }, [muted]);

  const showUi = ui || !playing;
  return (
    <div ref={wrap} onMouseMove={poke} onTouchStart={poke} className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[#070910]" style={{ cursor: showUi ? 'default' : 'none' }}>
      <canvas ref={cvs} onClick={toggle} className="block bg-white shadow-[0_0_80px_rgba(120,180,255,0.18)]" aria-label="万分之一的光 MV 画面" />
      <audio ref={audio} preload="auto" onPlay={() => { setPlaying(true); setError(''); }} onPause={() => setPlaying(false)} onEnded={() => { setPlaying(false); setEnded(true); setUi(true); }} />

      {(!started || ended) && !capture && (
        <button type="button" onClick={toggle} disabled={!ready} className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-white/35 backdrop-blur-[3px] transition-colors hover:bg-white/25 focus:outline-none">
          <span className="text-[13px] font-medium tracking-[0.5em] text-sky-600/80">像素番外 MV</span>
          <span className="text-4xl font-bold tracking-[0.18em] text-slate-700 drop-shadow-[0_0_18px_rgba(255,255,255,0.9)] sm:text-6xl">万分之一的光</span>
          <span className="mt-2 flex h-20 w-20 items-center justify-center rounded-full bg-white/90 text-sky-500 shadow-[0_8px_40px_rgba(90,160,240,0.45)] ring-1 ring-sky-200 transition-transform duration-200 hover:scale-110">
            {ready ? (ended ? <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></svg> : <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.2v13.6a1 1 0 0 0 1.5.86l11-6.8a1 1 0 0 0 0-1.72l-11-6.8A1 1 0 0 0 8 5.2z" /></svg>) : <span className="h-7 w-7 animate-spin rounded-full border-[3px] border-sky-200 border-t-sky-500" />}
          </span>
          <span className="text-sm tracking-widest text-slate-600/80">{error || (ready ? (ended ? '再看一遍' : '点击播放 · 建议打开声音') : '正在准备素材…')}</span>
        </button>
      )}

      {started && !ended && !capture && (
        <div className={`absolute inset-x-0 bottom-0 flex items-center gap-3 bg-gradient-to-t from-black/55 to-transparent px-4 pb-3 pt-10 text-white transition-opacity duration-300 sm:px-6 ${showUi ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
          <button type="button" onClick={toggle} aria-label={playing ? '暂停' : '播放'} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 hover:bg-white/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
            {playing ? <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="5" y="4" width="5" height="16" rx="1" /><rect x="14" y="4" width="5" height="16" rx="1" /></svg> : <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>}
          </button>
          <span className="w-11 shrink-0 text-right text-xs tabular-nums">{fmt(time)}</span>
          <input type="range" min={0} max={DUR} step={0.05} value={time} onChange={(e) => seek(Number(e.target.value))} aria-label="进度" className="mv-range h-1 min-w-0 flex-1 cursor-pointer appearance-none rounded-full" style={{ background: `linear-gradient(to right,#8fd0ff ${(time / DUR) * 100}%,rgba(255,255,255,.3) ${(time / DUR) * 100}%)` }} />
          <span className="w-11 shrink-0 text-xs tabular-nums">{fmt(DUR)}</span>
          <button type="button" onClick={() => setMuted((m) => !m)} aria-label={muted ? '取消静音' : '静音'} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor" />{muted ? <path d="m16 9 5 6m0-6-5 6" /> : <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />}</svg>
          </button>
          <button type="button" onClick={full} aria-label="全屏" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
          </button>
        </div>
      )}
    </div>
  );
}
