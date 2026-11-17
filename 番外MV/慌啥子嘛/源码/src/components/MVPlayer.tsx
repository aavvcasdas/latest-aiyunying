import { useCallback, useEffect, useRef, useState } from 'react';
import songUrl from '../assets/song.mp3';
import { loadAtlas, CAST, CHAR, NAMES } from '../mv/atlas';
import { View, sprite2d } from '../mv/engine';
import { renderFrame } from '../mv/render';
import { SONG_END, fmtTime } from '../mv/timing';

const W = 1280;
const H = 720;

function Portrait({ id }: { id: (typeof CAST)[number] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    sprite2d(ctx, CHAR[id].portrait, c.width / 2, c.height - 4, c.height - 8);
  }, [id]);
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="rounded-2xl bg-white/15 p-1 shadow-[0_6px_18px_rgba(30,30,80,0.25)] backdrop-blur-sm">
        <canvas ref={ref} width={72} height={72} className="block h-[64px] w-[64px] rounded-xl bg-white/20" style={{ imageRendering: 'pixelated' }} />
      </div>
      <span className="text-[12px] tracking-wide text-white/85">{NAMES[id]}</span>
    </div>
  );
}

export default function MVPlayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const viewRef = useRef<View | null>(null);
  const clockRef = useRef({ base: 0, perf: 0 });
  const lastRenderedRef = useRef(-1);
  const playingRef = useRef(false);
  const hideTimer = useRef<number | null>(null);

  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(SONG_END);
  const [uiVisible, setUiVisible] = useState(true);

  // 资源
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.src = songUrl;
    audioRef.current = audio;
    const onMeta = () => setDuration(audio.duration || SONG_END);
    const onEnd = () => {
      playingRef.current = false;
      setPlaying(false);
      setUiVisible(true);
    };
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('ended', onEnd);
    const fontReady = typeof document !== 'undefined' && 'fonts' in document ? Promise.race([document.fonts.load('700 40px "ZCOOL KuaiLe"').catch(() => undefined), new Promise((r) => setTimeout(r, 2500))]) : Promise.resolve();
    Promise.all([loadAtlas(), fontReady])
      .then(() => setReady(true))
      .catch((e: Error) => setError(e.message));
    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('ended', onEnd);
    };
  }, []);

  // 渲染循环
  useEffect(() => {
    if (!ready) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const scratch = document.createElement('canvas');
    scratch.width = 640;
    scratch.height = 640;
    const view = new View(ctx, W, H, scratch.getContext('2d')!);
    viewRef.current = view;

    // 出片钩子：给 t 就渲那一帧并返回 JPEG dataURL（纯函数式渲帧，任意跳转都得到同一帧）
    (window as unknown as { __mv?: unknown }).__mv = {
      duration: SONG_END,
      render: (t: number) => {
        const tt = Math.max(0, Math.min(SONG_END, t));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        renderFrame(view, tt);
        lastRenderedRef.current = tt;
        return canvas.toDataURL('image/jpeg', 0.92);
      },
    };
    let raf = 0;
    let lastState = -1;
    const loop = () => {
      const a = audioRef.current;
      if (a) {
        let t: number;
        if (playingRef.current) {
          // 用高精度时钟平滑 currentTime，偏差大了再校正
          const est = clockRef.current.base + (performance.now() - clockRef.current.perf) / 1000;
          if (Math.abs(est - a.currentTime) > 0.07) {
            clockRef.current = { base: a.currentTime, perf: performance.now() };
            t = a.currentTime;
          } else t = est;
        } else t = a.currentTime;
        if (playingRef.current || Math.abs(t - lastRenderedRef.current) > 0.0005) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          renderFrame(view, t);
          lastRenderedRef.current = t;
        }
        if (Math.abs(t - lastState) > 0.25) {
          lastState = t;
          setTime(t);
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [ready]);

  const play = useCallback(async () => {
    const a = audioRef.current;
    if (!a) return;
    try {
      await a.play();
      clockRef.current = { base: a.currentTime, perf: performance.now() };
      playingRef.current = true;
      setPlaying(true);
      setStarted(true);
    } catch (e) {
      setError('浏览器不允许自动播放，请再点一次');
      console.error(e);
    }
  }, []);
  const pause = useCallback(() => {
    audioRef.current?.pause();
    playingRef.current = false;
    setPlaying(false);
    setUiVisible(true);
  }, []);
  const toggle = useCallback(() => (playingRef.current ? pause() : void play()), [pause, play]);
  const seek = useCallback((t: number) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Math.max(0, Math.min(duration - 0.05, t));
    clockRef.current = { base: a.currentTime, perf: performance.now() };
    setTime(a.currentTime);
  }, [duration]);

  // 键盘
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!started) return;
      if (e.code === 'Space') {
        e.preventDefault();
        toggle();
      } else if (e.code === 'ArrowRight') seek((audioRef.current?.currentTime ?? 0) + 5);
      else if (e.code === 'ArrowLeft') seek((audioRef.current?.currentTime ?? 0) - 5);
      else if (e.key === 'f' || e.key === 'F') toggleFullscreen();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [started, toggle, seek]);

  // 鼠标不动就把控制条藏起来
  const poke = useCallback(() => {
    setUiVisible(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      if (playingRef.current) setUiVisible(false);
    }, 2600);
  }, []);

  const toggleFullscreen = () => {
    const el = wrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.();
  };

  const onBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    seek(((e.clientX - r.left) / r.width) * duration);
  };

  const progress = duration ? Math.min(1, time / duration) : 0;

  return (
    <div ref={wrapRef} className="fixed inset-0 flex items-center justify-center overflow-hidden bg-[#0d1030] select-none" onMouseMove={poke} onTouchStart={poke} style={{ cursor: uiVisible || !playing ? 'default' : 'none' }}>
      {/* 背景柔光 */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(90,110,200,0.35),rgba(13,16,48,0)_60%)]" />
      <div className="relative aspect-video w-[min(100vw,177.78vh)] max-h-screen shadow-[0_30px_80px_rgba(0,0,0,0.5)]">
        <canvas ref={canvasRef} className="block h-full w-full rounded-sm bg-[#1a2150]" onClick={() => started && toggle()} />

        {/* 开始页 */}
        {!started && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-[linear-gradient(180deg,rgba(61,78,160,0.55),rgba(255,170,140,0.35)_70%,rgba(255,220,170,0.45))] backdrop-blur-[2px]">
            <div className="text-center">
              <div className="text-[clamp(40px,9vw,96px)] font-black leading-none tracking-[0.12em] text-white drop-shadow-[0_6px_0_rgba(190,110,70,0.8)]" style={{ fontFamily: '"ZCOOL KuaiLe","Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif' }}>
                慌啥子嘛
              </div>
              <div className="mt-3 text-[clamp(14px,2.2vw,22px)] tracking-[0.5em] text-white/90" style={{ fontFamily: '"ZCOOL KuaiLe","Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif' }}>
                慢慢来 · 治愈软立体像素 MV
              </div>
            </div>
            {ready && (
              <div className="flex flex-wrap items-end justify-center gap-3 px-6">
                {CAST.map((id) => (
                  <Portrait key={id} id={id} />
                ))}
              </div>
            )}
            <button
              onClick={() => void play()}
              disabled={!ready}
              className="group mt-2 flex items-center gap-3 rounded-full bg-white/90 px-8 py-3 text-[18px] font-bold text-[#4a4f8a] shadow-[0_10px_30px_rgba(40,40,100,0.35)] transition hover:scale-105 hover:bg-white disabled:opacity-60"
              style={{ fontFamily: '"ZCOOL KuaiLe","Noto Sans SC","PingFang SC","Microsoft YaHei",sans-serif' }}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ff9f6a] text-white">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
              {ready ? '开始播放' : '正在加载图集…'}
            </button>
            {error && <div className="text-sm text-rose-100">{error}</div>}
            <div className="text-[12px] text-white/70">空格 暂停 · 左右键 快进快退 · F 全屏</div>
          </div>
        )}

        {/* 控制条 */}
        {started && (
          <div className={`absolute inset-x-0 bottom-0 flex items-center gap-3 bg-[linear-gradient(0deg,rgba(10,12,40,0.75),rgba(10,12,40,0))] px-4 pb-3 pt-8 transition-opacity duration-300 ${uiVisible ? 'opacity-100' : 'opacity-0'}`}>
            <button onClick={toggle} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/90 text-[#4a4f8a] shadow hover:bg-white" aria-label={playing ? '暂停' : '播放'}>
              {playing ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <span className="w-[42px] text-right text-[12px] tabular-nums text-white/90">{fmtTime(time)}</span>
            <div className="group relative h-6 flex-1 cursor-pointer" onClick={onBarClick}>
              <div className="absolute inset-x-0 top-1/2 h-[5px] -translate-y-1/2 rounded-full bg-white/25" />
              <div className="absolute left-0 top-1/2 h-[5px] -translate-y-1/2 rounded-full bg-[linear-gradient(90deg,#ffd27a,#ff9f6a)]" style={{ width: `${progress * 100}%` }} />
              <div className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow transition-transform group-hover:scale-125" style={{ left: `${progress * 100}%` }} />
            </div>
            <span className="w-[42px] text-[12px] tabular-nums text-white/70">{fmtTime(duration)}</span>
            <button onClick={toggleFullscreen} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/30" aria-label="全屏">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
