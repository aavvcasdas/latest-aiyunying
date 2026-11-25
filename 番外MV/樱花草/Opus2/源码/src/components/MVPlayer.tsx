import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import mp3Url from '../assets/yinghuacao.mp3';
import fontUrl from '../assets/zcool-sub.ttf';
import { loadAtlas } from '../mv/atlas';
import type { FilmEngine } from '../mv/engine';
import { H, W } from '../mv/soft3d';
import { DURATION, fmt } from '../mv/timeline';

export interface PlayerHandle { seek: (t: number, play?: boolean) => void; time: () => number }

const SEC_COLORS: Record<string, string> = {
  前奏: '#64748b', 主歌一: '#3b82f6', 导歌一: '#14b8a6', 副歌一: '#ec4899', 间奏: '#a855f7', 啦啦间奏: '#f59e0b',
  主歌二: '#2563eb', 导歌二: '#0d9488', 副歌二: '#db2777', 啦啦尾奏: '#d97706', 副歌三: '#f472b6', 副歌四: '#e11d48', 尾声: '#475569',
};
export const secColor = (s: string) => SEC_COLORS[s] ?? '#888';

export default function MVPlayer({ engine, onTime, handleRef }: { engine: FilmEngine; onTime: (t: number, shot: number) => void; handleRef: Ref<PlayerHandle | null> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const [subs, setSubs] = useState(true);
  const subsRef = useRef(true);
  subsRef.current = subs;
  const lastUi = useRef(0);

  const draw = useCallback((T: number) => {
    const g = canvasRef.current?.getContext('2d');
    if (!g) return;
    engine.render(g, T, { subtitles: subsRef.current });
    const now = performance.now();
    if (now - lastUi.current > 90) { lastUi.current = now; setT(T); onTime(T, engine.shotIndex(T)); }
  }, [engine, onTime]);

  // 素材：图集 + 字体，就位后走一遍全片预检
  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const face = new FontFace('ZCOOL KuaiLe', `url(${fontUrl})`);
        await Promise.all([loadAtlas(), face.load().then((f) => { document.fonts.add(f); })]);
        if (dead) return;
        const g = canvasRef.current!.getContext('2d')!;
        const errs = engine.preflight(g);
        if (errs.length) { setError(errs.slice(0, 6).join('\n')); return; }
        setReady(true);
        draw(0);
      } catch (e) { setError((e as Error).message); }
    })();
    return () => { dead = true; };
  }, [engine, draw]);

  // 自动渲染 / 截帧钩子：不会启动音频播放，仅按指定时间重绘画面
  useEffect(() => {
    if (!ready) return;
    const w = window as Window & { __mvReady?: boolean; __mvSeek?: (t: number) => void };
    w.__mvReady = true;
    w.__mvSeek = (time: number) => {
      const T = Math.max(0, Math.min(DURATION - 0.05, time));
      if (audioRef.current) audioRef.current.currentTime = T;
      draw(T);
    };
    return () => { delete w.__mvReady; delete w.__mvSeek; };
  }, [ready, draw]);

  // 播放循环：时间只认音频
  useEffect(() => {
    if (!ready || !playing) return;
    let raf = 0, lastFrame = -1;
    const loop = () => {
      const a = audioRef.current;
      if (a) { const T = a.currentTime; const fr = Math.floor(T * 30); if (fr !== lastFrame) { lastFrame = fr; draw(T); } }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [ready, playing, draw]);

  const play = useCallback(async () => { try { await audioRef.current?.play(); setPlaying(true); } catch { setPlaying(false); } }, []);
  const pause = useCallback(() => { audioRef.current?.pause(); setPlaying(false); }, []);
  const toggle = useCallback(() => { if (audioRef.current?.paused) void play(); else pause(); }, [play, pause]);
  const seek = useCallback((T: number, andPlay = false) => {
    const a = audioRef.current; if (!a) return;
    const v = Math.max(0, Math.min(DURATION - 0.05, T));
    a.currentTime = v; draw(v);
    if (andPlay) void play();
  }, [draw, play]);
  useImperativeHandle(handleRef, () => ({ seek, time: () => audioRef.current?.currentTime ?? 0 }), [seek]);

  useEffect(() => { if (ready && !playing) draw(audioRef.current?.currentTime ?? 0); }, [subs, ready, playing, draw]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.code === 'Space') { e.preventDefault(); toggle(); }
      if (e.code === 'ArrowLeft') seek((audioRef.current?.currentTime ?? 0) - 5);
      if (e.code === 'ArrowRight') seek((audioRef.current?.currentTime ?? 0) + 5);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle, seek]);

  const fullscreen = () => { const el = wrapRef.current; if (!el) return; if (document.fullscreenElement) void document.exitFullscreen(); else void el.requestFullscreen(); };
  const segs = engine.shots.reduce<{ sec: string; a: number; b: number }[]>((acc, s) => {
    const last = acc[acc.length - 1];
    if (last && last.sec === s.sec) last.b = s.end; else acc.push({ sec: s.sec, a: s.start, b: s.end });
    return acc;
  }, []);

  return (
    <div ref={wrapRef} className="mv-wrap bg-[#0b0820]">
      <div className="mv-box relative w-full">
        <canvas ref={canvasRef} width={W} height={H} className="block aspect-video w-full cursor-pointer bg-[#0b0820]" onClick={() => ready && toggle()} />
        {!ready && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-pink-100">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-pink-300/30 border-t-pink-300" />
            <div className="text-sm tracking-widest">载入像素图集与字体 · 全片预检中…</div>
          </div>
        )}
        {error && <pre className="absolute inset-0 overflow-auto whitespace-pre-wrap bg-red-950/90 p-6 text-sm text-red-100">预检失败：{'\n'}{error}</pre>}
        {ready && !playing && t < 0.05 && (
          <button onClick={() => void play()} className="absolute inset-0 m-auto flex h-24 w-24 items-center justify-center rounded-full bg-pink-400/85 text-white shadow-[0_0_60px_rgba(255,150,200,0.7)] transition hover:scale-105" aria-label="播放">
            <svg viewBox="0 0 24 24" className="ml-1 h-10 w-10 fill-current"><path d="M8 5v14l11-7z" /></svg>
          </button>
        )}
      </div>
      <audio ref={audioRef} src={mp3Url} preload="auto" onEnded={() => setPlaying(false)} onPause={() => setPlaying(false)} onPlay={() => setPlaying(true)} />
      <div className="flex items-center gap-3 bg-[#140f2e] px-3 py-2 text-pink-50">
        <button onClick={toggle} disabled={!ready} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pink-400 text-white transition hover:bg-pink-300 disabled:opacity-40" aria-label={playing ? '暂停' : '播放'}>
          {playing ? <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg> : <svg viewBox="0 0 24 24" className="ml-0.5 h-5 w-5 fill-current"><path d="M8 5v14l11-7z" /></svg>}
        </button>
        <span className="w-24 shrink-0 font-mono text-xs tabular-nums text-pink-100/80">{fmt(t)} / {fmt(DURATION)}</span>
        <div className="relative h-7 flex-1 cursor-pointer" onClick={(e) => { const r = e.currentTarget.getBoundingClientRect(); seek(((e.clientX - r.left) / r.width) * DURATION); }}>
          <div className="absolute inset-x-0 top-2 flex h-3 overflow-hidden rounded-full">
            {segs.map((s, i) => <div key={i} title={s.sec} style={{ width: `${((s.b - s.a) / DURATION) * 100}%`, background: secColor(s.sec) }} className="h-full opacity-60" />)}
          </div>
          <div className="absolute top-2 h-3 rounded-l-full bg-white/35" style={{ width: `${(t / DURATION) * 100}%` }} />
          <div className="absolute top-0.5 h-6 w-1.5 -translate-x-1/2 rounded bg-white shadow" style={{ left: `${(t / DURATION) * 100}%` }} />
        </div>
        <button onClick={() => setSubs((v) => !v)} className={`rounded px-2 py-1 text-xs ${subs ? 'bg-pink-400/30 text-pink-50' : 'bg-white/10 text-pink-100/60'}`}>字幕</button>
        <button onClick={fullscreen} className="rounded bg-white/10 px-2 py-1 text-xs hover:bg-white/20">全屏</button>
      </div>
    </div>
  );
}
