import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Film,
  Layers,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Users,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import bgmUrl from './assets/jimo-yanhuo.mp3';
import { CAST_PROFILES, findShotAt, FULL_SONG_LYRICS, MV_DURATION, SHOTS, type ShotDef } from './mv/data';
import { MVEngine } from './mv/engine';

declare global {
  interface Window {
    __mv?: {
      seek: (t: number) => void;
      getTime: () => number;
      duration: number;
      isReady: () => boolean;
    };
  }
}

function formatTime(sec: number) {
  const s = Math.max(0, Math.min(MV_DURATION, sec));
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

export function App() {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const engineRef = useRef<MVEngine | null>(null);
  const rafRef = useRef<number>(0);
  const currentTimeRef = useRef<number>(0);
  const playingRef = useRef<boolean>(false);

  const [ready, setReady] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadLabel, setLoadLabel] = useState('初始化 Three.js 场景...');
  const [loadError, setLoadError] = useState<string | null>(null);

  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [time, setTime] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.9);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsActive, setControlsActive] = useState(true);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'shots' | 'cast' | 'lyrics'>('shots');
  const [hoverTimeline, setHoverTimeline] = useState<{ xPct: number; t: number; shot: ShotDef } | null>(null);

  const hideTimerRef = useRef<number | null>(null);

  const activeShot = useMemo(() => findShotAt(time), [time]);

  const wakeControls = useCallback(() => {
    setControlsActive(true);
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => {
      if (playingRef.current) setControlsActive(false);
    }, 2800);
  }, []);

  // Render a specific timestamp deterministically
  const renderAt = useCallback((t: number) => {
    const clamped = Math.max(0, Math.min(MV_DURATION, t));
    currentTimeRef.current = clamped;
    setTime(clamped);
    engineRef.current?.render(clamped);
  }, []);

  // Seek audio + Three.js engine together
  const seekTo = useCallback(
    (t: number, autoDismissCurtain = true) => {
      const clamped = Math.max(0, Math.min(MV_DURATION - 0.01, t));
      if (autoDismissCurtain) setStarted(true);
      setEnded(false);
      if (audioRef.current) {
        try {
          audioRef.current.currentTime = clamped;
        } catch {
          // Audio metadata may not yet be seekable before first play
        }
      }
      renderAt(clamped);
    },
    [renderAt]
  );

  // Initialize Three.js + Blender GLB engine
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = canvasWrapRef.current;
    if (!canvas || !wrap) return;

    let cancelled = false;
    const engine = new MVEngine(canvas);
    engineRef.current = engine;

    const doResize = () => {
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        engine.resize(Math.floor(rect.width), Math.floor(rect.height));
        if (engine.ready) {
          engine.render(currentTimeRef.current);
        }
      }
    };

    const ro = new ResizeObserver(doResize);
    ro.observe(wrap);
    doResize();

    engine
      .init((p, label) => {
        if (cancelled) return;
        setLoadProgress(p);
        setLoadLabel(label);
      })
      .then(() => {
        if (cancelled) return;
        setReady(true);
        doResize();
        // Render an evocative preview still of Shot 1 (restored viaduct opening) behind the curtain
        engine.render(2.55);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
        setLoadError(err instanceof Error ? err.message : String(err));
      });

    return () => {
      cancelled = true;
      ro.disconnect();
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Expose deterministic inspection hook on window.__mv
  useEffect(() => {
    window.__mv = {
      seek: (t: number) => {
        if (audioRef.current && !audioRef.current.paused) {
          audioRef.current.pause();
        }
        playingRef.current = false;
        setPlaying(false);
        seekTo(t, true);
      },
      getTime: () => currentTimeRef.current,
      duration: MV_DURATION,
      isReady: () => Boolean(engineRef.current?.ready),
    };
    return () => {
      delete window.__mv;
    };
  }, [seekTo]);

  // Main animation loop synchronized to audio clock
  useEffect(() => {
    playingRef.current = playing;
    if (!playing || !ready) {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    let lastPerf = performance.now();
    const tick = (now: number) => {
      if (!playingRef.current) return;
      const dt = Math.min(0.1, (now - lastPerf) / 1000);
      lastPerf = now;

      const audio = audioRef.current;
      let nextT = currentTimeRef.current + dt;
      if (audio && !audio.paused && Number.isFinite(audio.currentTime)) {
        nextT = audio.currentTime;
      }

      if (nextT >= MV_DURATION - 0.02) {
        currentTimeRef.current = MV_DURATION;
        setTime(MV_DURATION);
        engineRef.current?.render(MV_DURATION);
        if (audio && !audio.paused) audio.pause();
        playingRef.current = false;
        setPlaying(false);
        setEnded(true);
        setControlsActive(true);
        return;
      }

      currentTimeRef.current = nextT;
      setTime(nextT);
      engineRef.current?.render(nextT);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, ready]);

  // Audio volume / mute sync
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = muted;
    audio.volume = volume;
  }, [muted, volume]);

  const startOrTogglePlay = useCallback(async () => {
    if (!ready) return;
    const audio = audioRef.current;
    if (!playingRef.current) {
      const fromStart = !started || ended || currentTimeRef.current >= MV_DURATION - 0.15;
      const startT = fromStart ? 0 : currentTimeRef.current;
      setStarted(true);
      setEnded(false);
      currentTimeRef.current = startT;
      setTime(startT);
      if (audio) {
        audio.currentTime = startT;
        try {
          await audio.play();
        } catch {
          // Allow silent visual playback if browser blocks autoplay
        }
      }
      playingRef.current = true;
      setPlaying(true);
      wakeControls();
    } else {
      if (audio && !audio.paused) audio.pause();
      playingRef.current = false;
      setPlaying(false);
      setControlsActive(true);
    }
  }, [ready, started, ended, wakeControls]);

  const jumpShot = useCallback(
    (delta: number) => {
      const idx = SHOTS.findIndex((s) => s.id === activeShot.id);
      const nextIdx = Math.max(0, Math.min(SHOTS.length - 1, idx + delta));
      seekTo(SHOTS[nextIdx].start + 0.05);
    },
    [activeShot.id, seekTo]
  );

  const toggleFullscreen = useCallback(() => {
    const el = stageRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  // Keyboard shortcuts: Space (Play/Pause), Left/Right (Prev/Next shot), M (Mute), F (Fullscreen)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        startOrTogglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        jumpShot(1);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        jumpShot(-1);
      } else if (e.key === 'm' || e.key === 'M') {
        setMuted((v) => !v);
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [startOrTogglePlay, jumpShot, toggleFullscreen]);

  const handleTimelineInteract = (e: React.MouseEvent<HTMLDivElement>, commit: boolean) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const t = pct * MV_DURATION;
    if (commit) {
      seekTo(t);
    } else {
      setHoverTimeline({ xPct: pct * 100, t, shot: findShotAt(t) });
    }
  };

  // Show karaoke subtitle cleanly inside the bottom dark slate-navy letterbox bar
  const subtitleOpacity = !started ? 0 : time > 63.3 ? Math.max(0, 1 - (time - 63.3) / 1.1) : 1;

  return (
    <div
      ref={stageRef}
      onMouseMove={wakeControls}
      className="relative flex h-screen w-screen flex-col items-center justify-center overflow-hidden bg-[#0b131d] select-none"
    >
      {/* Hidden synchronized BGM audio track (寂寞烟火.WAV -> high quality stereo MP3) */}
      <audio ref={audioRef} src={bgmUrl} preload="auto" playsInline />

      {/* Main Centered Cinema Stage */}
      <div className="relative flex h-full w-full flex-col items-center justify-center px-3 py-3 sm:px-6 sm:py-5">
        {/* 16:9 Cinema Frame (Pure 3D Canvas + Authentic Reference-Style Slate Subtitle Bar) */}
        <div
          className="relative flex w-full max-w-[1280px] flex-col overflow-hidden rounded-xl border border-[#8fb4ce]/15 bg-[#142533] shadow-[0_24px_80px_rgba(0,0,0,0.68)]"
          style={{
            aspectRatio: '16 / 9',
            maxHeight: 'calc(100vh - 96px)',
          }}
        >
          {/* Three.js + Blender 3D Viewport (top 87.5% of 16:9 frame) */}
          <div
            ref={canvasWrapRef}
            onClick={() => {
              if (started) startOrTogglePlay();
            }}
            className="relative w-full flex-1 cursor-pointer overflow-hidden bg-[#1e2438]"
          >
            <canvas ref={canvasRef} className="block h-full w-full" />

            {/* Loading Overlay */}
            {!ready && !loadError && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#131b2b]/90 backdrop-blur-sm">
                <div className="mb-3 flex items-center gap-2 text-[#f3e5c2]">
                  <Sparkles className="h-5 w-5 animate-pulse text-[#8fd6ee]" />
                  <span className="text-lg font-medium tracking-[0.18em]">《寂寞烟火》</span>
                </div>
                <div className="h-1.5 w-60 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#5b9dff] via-[#8fd6ee] to-[#f4ce86] transition-all duration-200"
                    style={{ width: `${Math.round(loadProgress * 100)}%` }}
                  />
                </div>
                <p className="mt-2.5 text-xs tracking-wider text-[#b8c6d8]">{loadLabel}</p>
              </div>
            )}

            {/* Error fallback */}
            {loadError && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#141b29]/95 p-6 text-center">
                <p className="text-sm font-medium text-rose-300">3D 场景载入失败</p>
                <p className="mt-1 max-w-md text-xs text-slate-400">{loadError}</p>
              </div>
            )}

            {/* Pre-play Elegant Cinema Curtain (vanishes completely once playback begins) */}
            {ready && !started && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-gradient-to-b from-[#171d31]/50 via-[#1b2236]/42 to-[#142533]/78 backdrop-blur-[1.5px]">
                <div className="flex flex-col items-center px-6 text-center">
                  <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-[#f3d89e]/30 bg-[#142533]/70 px-3.5 py-1 text-[11px] tracking-[0.22em] text-[#f3d89e]">
                    THREE.JS × BLENDER 3D STORYBOARD MV
                  </span>
                  <h1
                    className="text-4xl font-semibold tracking-[0.26em] text-[#f7f1df] drop-shadow-[0_4px_24px_rgba(12,20,36,0.75)] sm:text-5xl"
                    style={{ fontFamily: '"Noto Serif SC", serif' }}
                  >
                    寂寞烟火
                  </h1>
                  <p className="mt-3 max-w-lg text-xs leading-relaxed tracking-[0.12em] text-[#d5dfeb]/90 sm:text-sm">
                    暮色体素微缩分镜 · 11 组 Blender 3D 场景 · 分支九位角色演绎 · 补全原片缺失首句
                  </p>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startOrTogglePlay();
                    }}
                    className="group mt-7 inline-flex items-center gap-3 rounded-full border border-[#f5dfa8]/45 bg-[#182c3d]/85 px-7 py-3 text-sm font-medium tracking-[0.2em] text-[#fbf5e4] shadow-[0_12px_36px_rgba(0,0,0,0.45)] backdrop-blur-md transition hover:scale-[1.03] hover:border-[#8fd6ee]/70 hover:bg-[#1f394e]"
                  >
                    <Play className="h-4 w-4 fill-[#f4d48e] text-[#f4d48e] transition group-hover:scale-110" />
                    <span>播放 MV</span>
                  </button>
                  <span className="mt-3 text-[11px] tracking-[0.16em] text-[#a9bdd0]/75">
                    空格播放 / 暂停 · 方向键切换分镜
                  </span>
                </div>
              </div>
            )}

            {/* Graceful Replay Overlay after dawn cream fade-out */}
            {ready && ended && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#f5eed8]/35 backdrop-blur-[2px]">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startOrTogglePlay();
                  }}
                  className="inline-flex items-center gap-2.5 rounded-full border border-[#24384a]/25 bg-[#142533]/88 px-6 py-2.5 text-sm font-medium tracking-[0.18em] text-[#f5eed8] shadow-xl transition hover:scale-105 hover:bg-[#1b3346]"
                >
                  <RotateCcw className="h-4 w-4 text-[#8fd6ee]" />
                  <span>重新播放</span>
                </button>
              </div>
            )}
          </div>

          {/* Authentic Dark Slate-Navy Bottom Subtitle Bar (exact visual grammar of reference MV) */}
          <div className="flex h-[12.5%] min-h-[44px] w-full items-center justify-center border-t border-white/[0.06] bg-[#142533] px-6">
            <div
              className="mv-subtitle flex items-center justify-center text-center text-base font-medium sm:text-xl md:text-2xl transition-opacity duration-300"
              style={{ opacity: subtitleOpacity }}
            >
              {activeShot.words.map((w, i) => {
                const sung = time >= w.t - 0.04;
                const activeColor = activeShot.tone === 'cyan' ? '#8fd6ee' : '#f2cf88';
                return (
                  <span
                    key={`${activeShot.id}-${i}`}
                    className="transition-colors duration-150"
                    style={{
                      color: sung ? activeColor : '#ebe5d6',
                      textShadow: sung
                        ? activeShot.tone === 'cyan'
                          ? '0 0 12px rgba(143,214,238,0.45)'
                          : '0 0 12px rgba(242,207,136,0.42)'
                        : 'none',
                    }}
                  >
                    {w.text}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Minimal Auto-Dimming Cinema Transport Bar (sits cleanly below the 16:9 frame) */}
        <div
          className={`mt-3 w-full max-w-[1280px] rounded-xl border border-white/[0.08] bg-[#101c28]/88 px-4 py-2.5 backdrop-blur-md transition-opacity duration-500 ${
            controlsActive || !playing || drawerOpen ? 'opacity-100' : 'opacity-25 hover:opacity-100'
          }`}
        >
          {/* Interactive Timeline with 18 Storyboard Cut Markers */}
          <div
            onClick={(e) => handleTimelineInteract(e, true)}
            onMouseMove={(e) => handleTimelineInteract(e, false)}
            onMouseLeave={() => setHoverTimeline(null)}
            className="group relative mb-2.5 flex h-4 cursor-pointer items-center"
          >
            {/* Track background */}
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/10 transition-all group-hover:h-2">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#5b9dff] via-[#8fd6ee] to-[#f3cf88]"
                style={{ width: `${(time / MV_DURATION) * 100}%` }}
              />
            </div>

            {/* 18 Storyboard tick markers */}
            {SHOTS.slice(1).map((s) => (
              <div
                key={s.id}
                className="pointer-events-none absolute top-1/2 h-2.5 w-[1.5px] -translate-y-1/2 bg-[#0c1520]/85"
                style={{ left: `${(s.start / MV_DURATION) * 100}%` }}
              />
            ))}

            {/* Playhead thumb */}
            <div
              className="pointer-events-none absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#0e1b26] bg-[#f5eed8] shadow transition-transform group-hover:scale-125"
              style={{ left: `${(time / MV_DURATION) * 100}%` }}
            />

            {/* Hover Shot Preview Tooltip */}
            {hoverTimeline && (
              <div
                className="pointer-events-none absolute bottom-6 z-30 -translate-x-1/2 whitespace-nowrap rounded-lg border border-[#8fd6ee]/25 bg-[#0f1d2a]/95 px-2.5 py-1.5 text-[11px] shadow-xl"
                style={{
                  left: `${Math.max(10, Math.min(90, hoverTimeline.xPct))}%`,
                }}
              >
                <span className="mr-1.5 font-mono text-[#8fd6ee]">
                  #{String(hoverTimeline.shot.id).padStart(2, '0')} {formatTime(hoverTimeline.t)}
                </span>
                <span className="text-[#f3ead5]">{hoverTimeline.shot.lyric}</span>
              </div>
            )}
          </div>

          {/* Control Row */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#c7d6e6]">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={startOrTogglePlay}
                disabled={!ready}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#1a2e40] text-[#f5eed8] transition hover:bg-[#234059] disabled:opacity-40"
                title={playing ? '暂停 (Space)' : '播放 (Space)'}
              >
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-[1px]" />}
              </button>

              <button
                onClick={() => jumpShot(-1)}
                disabled={!ready}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#b7c9db] transition hover:bg-white/10 hover:text-white disabled:opacity-40"
                title="上一分镜 (←)"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => jumpShot(1)}
                disabled={!ready}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#b7c9db] transition hover:bg-white/10 hover:text-white disabled:opacity-40"
                title="下一分镜 (→)"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              <span className="ml-1 font-mono text-[11px] text-[#9eb6cc]">
                {formatTime(time)} <span className="text-white/30">/</span> {formatTime(MV_DURATION)}
              </span>

              <span className="hidden items-center gap-1.5 rounded-md border border-white/[0.07] bg-white/[0.04] px-2 py-1 text-[11px] text-[#d8e2ec] md:inline-flex">
                <span className="font-mono text-[#8fd6ee]">
                  镜 {String(activeShot.id).padStart(2, '0')}/18
                </span>
                <span className="text-white/25">·</span>
                <span className="max-w-[210px] truncate text-[#efe6d1]">{activeShot.title}</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Volume */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setMuted((m) => !m)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#b7c9db] transition hover:bg-white/10 hover:text-white"
                  title="静音 (M)"
                >
                  {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={muted ? 0 : volume}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setVolume(v);
                    if (v > 0 && muted) setMuted(false);
                  }}
                  className="hidden h-1 w-16 cursor-pointer accent-[#8fd6ee] sm:block"
                  aria-label="音量"
                />
              </div>

              {/* Collapsible Storyboard & Cast Inspector */}
              <button
                onClick={() => setDrawerOpen((v) => !v)}
                className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-medium tracking-wider transition ${
                  drawerOpen
                    ? 'border-[#8fd6ee]/50 bg-[#8fd6ee]/15 text-[#c8effc]'
                    : 'border-white/10 bg-white/[0.04] text-[#d3e0ec] hover:bg-white/10'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>分镜与选角</span>
              </button>

              <button
                onClick={toggleFullscreen}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#b7c9db] transition hover:bg-white/10 hover:text-white"
                title="全屏 (F)"
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Optional Collapsible Director / Storyboard / Cast Drawer */}
      {drawerOpen && (
        <aside className="fixed inset-y-0 right-0 z-40 flex w-full max-w-[390px] flex-col border-l border-[#8fd6ee]/15 bg-[#0e1925]/96 shadow-[-20px_0_60px_rgba(0,0,0,0.6)] backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3.5">
            <div>
              <h2 className="text-sm font-semibold tracking-[0.14em] text-[#f5eed8]">《寂寞烟火》分镜台</h2>
              <p className="mt-0.5 text-[11px] text-[#8ea6bc]">Three.js + Blender 3D · 18 镜逐词编排</p>
            </div>
            <button
              onClick={() => setDrawerOpen(false)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[#9ab0c4] transition hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Tabs */}
          <div className="grid grid-cols-3 gap-1 border-b border-white/[0.08] p-2 text-xs">
            <button
              onClick={() => setDrawerTab('shots')}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 font-medium transition ${
                drawerTab === 'shots' ? 'bg-[#1e3448] text-[#8fd6ee]' : 'text-[#9cb1c5] hover:bg-white/5'
              }`}
            >
              <Film className="h-3.5 w-3.5" />
              <span>分镜 (18)</span>
            </button>
            <button
              onClick={() => setDrawerTab('cast')}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 font-medium transition ${
                drawerTab === 'cast' ? 'bg-[#1e3448] text-[#f3cf88]' : 'text-[#9cb1c5] hover:bg-white/5'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>选角 (9)</span>
            </button>
            <button
              onClick={() => setDrawerTab('lyrics')}
              className={`flex items-center justify-center gap-1.5 rounded-lg py-1.5 font-medium transition ${
                drawerTab === 'lyrics' ? 'bg-[#1e3448] text-[#f5eed8]' : 'text-[#9cb1c5] hover:bg-white/5'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>歌词</span>
            </button>
          </div>

          {/* Drawer Body */}
          <div className="mv-scroll flex-1 overflow-y-auto p-3">
            {drawerTab === 'shots' && (
              <div className="space-y-2">
                {SHOTS.map((s) => {
                  const isCurrent = s.id === activeShot.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => seekTo(s.start + 0.08)}
                      className={`w-full rounded-xl border p-3 text-left transition ${
                        isCurrent
                          ? 'border-[#8fd6ee]/50 bg-[#193044]/90'
                          : 'border-white/[0.06] bg-white/[0.025] hover:border-white/15 hover:bg-white/[0.05]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="rounded bg-[#112130] px-1.5 py-0.5 font-mono text-[10px] text-[#8fd6ee]">
                            #{String(s.id).padStart(2, '0')}
                          </span>
                          <span className="font-mono text-[10px] text-[#8ea5bb]">
                            {s.start.toFixed(1)}s–{s.end.toFixed(1)}s
                          </span>
                          {s.restoredMissingLine && (
                            <span className="rounded bg-[#f2cf88]/20 px-1.5 py-0.5 text-[10px] text-[#f2cf88]">
                              补全缺句
                            </span>
                          )}
                        </div>
                        <span
                          className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                          style={{
                            backgroundColor: `${s.keywordColor}22`,
                            color: s.keywordColor,
                          }}
                        >
                          3D字「{s.keyword}」
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm font-medium text-[#f5eed8]">{s.lyric}</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-[#9cb3c9]">{s.directorNote}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-1">
                        <span className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-[10px] text-[#98c6de]">
                          {s.blenderAsset}
                        </span>
                        {s.cast.map((cid) => {
                          const prof = CAST_PROFILES.find((p) => p.id === cid);
                          return (
                            <span
                              key={cid}
                              className="rounded-full px-1.5 py-0.5 text-[10px]"
                              style={{
                                backgroundColor: `${prof?.color ?? '#8fd6ee'}20`,
                                color: prof?.color ?? '#c9e4f5',
                              }}
                            >
                              {prof?.name.split('（')[0] ?? cid}
                            </span>
                          );
                        })}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {drawerTab === 'cast' && (
              <div className="space-y-2.5">
                <p className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-2.5 text-[11px] leading-relaxed text-[#a8bdd0]">
                  全部角色均来自仓库分支 <code className="text-[#8fd6ee]">人物/atlas.png</code> 与{' '}
                  <code className="text-[#8fd6ee]">笨鱼_px.png</code>，严格按 <code className="text-[#f2cf88]">设定/人物/</code> 习性与关系分配分镜。
                </p>
                {CAST_PROFILES.map((c) => {
                  const appeared = SHOTS.filter((s) => s.cast.includes(c.id));
                  return (
                    <div
                      key={c.id}
                      className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium" style={{ color: c.color }}>
                          {c.name}
                        </span>
                        <span className="rounded bg-white/[0.06] px-2 py-0.5 text-[10px] text-[#d5e0ea]">
                          {c.role}
                        </span>
                      </div>
                      <p className="mt-1.5 text-[11px] leading-relaxed text-[#9fb5ca]">{c.trait}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {appeared.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => seekTo(s.start + 0.1)}
                            className="rounded bg-[#162a3c] px-1.5 py-0.5 font-mono text-[10px] text-[#8fd6ee] transition hover:bg-[#21405a]"
                          >
                            镜{String(s.id).padStart(2, '0')}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {drawerTab === 'lyrics' && (
              <div className="space-y-3">
                <div className="rounded-xl border border-[#8fd6ee]/20 bg-[#15283a]/60 p-3 text-[11px] leading-relaxed text-[#b7cde0]">
                  音源 <code className="text-[#f2cf88]">寂寞烟火.WAV</code>（65.09 秒）完整演唱两段副歌共 18 句，包含参考视频遗漏的首句「我曾经走过多遥远的路」；原词中「学会享受寂寞 / 朋友快乐 / 跨年烟火」的情感意象亦完整融入时光岸边与跨年烟火群像分镜。
                </div>
                <div className="space-y-1.5 px-1">
                  {FULL_SONG_LYRICS.map((line, idx) => {
                    const isDivider = line.startsWith('—');
                    const isActive = !isDivider && activeShot.lyric === line;
                    return (
                      <p
                        key={idx}
                        className={
                          isDivider
                            ? 'pt-2 text-center text-[10px] tracking-[0.2em] text-[#7c95ac]'
                            : `rounded-md px-2 py-1 text-xs transition ${
                                isActive
                                  ? 'bg-[#1c354a] font-medium text-[#f3d48e]'
                                  : 'text-[#c2d2e2]'
                              }`
                        }
                      >
                        {line}
                      </p>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}

export default App;
