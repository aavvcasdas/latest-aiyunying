import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Captions,
  ChevronLeft,
  ChevronRight,
  Film,
  Maximize2,
  Minimize2,
  Music,
  Pause,
  Play,
  RotateCcw,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react';
import songUrl from './assets/song.mp3';
import { DrawerPanels, formatTime } from './components/DrawerPanels';
import { MVEngine, SHOT_MAP } from './mv/engine';
import {
  activeCueAt,
  CHAPTERS,
  DURATION,
  SHOT_SLOTS,
  shotSlotAt,
} from './mv/timeline';

// 首屏静帧时刻：副歌一「恋人手中樱花草」全词点亮瞬间（兼顾角色、五瓣樱花草与软3D字词字幕展示）
const POSTER_TIME = 67.22;

export function App() {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const isClean = params.has('clean');
  const queryT = useMemo(() => {
    const raw = params.get('t');
    if (raw === null || raw === '') return null;
    const n = Number(raw);
    return Number.isFinite(n) ? Math.max(0, Math.min(DURATION - 0.01, n)) : null;
  }, [params]);

  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const engineRef = useRef<MVEngine | null>(null);

  const timeRef = useRef<number>(queryT ?? POSTER_TIME);
  const showLyricsRef = useRef<boolean>(true);
  const playingRef = useRef<boolean>(false);
  const hasStartedRef = useRef<boolean>(queryT !== null || isClean);
  const hideTimerRef = useRef<number | null>(null);

  const [ready, setReady] = useState(false);
  const [hasStarted, setHasStarted] = useState(queryT !== null || isClean);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(queryT ?? POSTER_TIME);
  const [showLyrics, setShowLyrics] = useState(true);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.9);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hudVisible, setHudVisible] = useState(true);
  const [drawerTab, setDrawerTab] = useState<'shots' | 'lyrics' | 'cast' | null>(null);
  const [hoverInfo, setHoverInfo] = useState<{ pct: number; time: number; label: string } | null>(
    null
  );

  const syncCanvasSize = useCallback(() => {
    const eng = engineRef.current;
    const el = stageRef.current;
    if (!eng || !el) return;
    const rect = el.getBoundingClientRect();
    if (rect.width < 10 || rect.height < 10) return;
    const dpr = isClean ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    eng.setSize(rect.width, rect.height, dpr);
    eng.renderAt(timeRef.current, showLyricsRef.current, 0);
  }, [isClean]);

  const seekTo = useCallback((t: number, autoPlay = false) => {
    const clamped = Math.max(0, Math.min(DURATION - 0.01, t));
    timeRef.current = clamped;
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      setHasStarted(true);
    }
    const audio = audioRef.current;
    if (audio) {
      try {
        audio.currentTime = clamped;
      } catch {
        // 音频尚未就绪时由 onLoadedMetadata 同步
      }
      if (autoPlay) {
        audio
          .play()
          .then(() => {
            playingRef.current = true;
            setPlaying(true);
          })
          .catch(() => {
            playingRef.current = false;
            setPlaying(false);
          });
      }
    }
    setCurrentTime(clamped);
    engineRef.current?.renderAt(clamped, showLyricsRef.current, 0);
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!hasStartedRef.current) {
      seekTo(0, true);
      return;
    }
    if (playingRef.current) {
      audio.pause();
      playingRef.current = false;
      setPlaying(false);
    } else {
      if (timeRef.current >= DURATION - 0.25) {
        audio.currentTime = 0;
        timeRef.current = 0;
      } else if (Math.abs(audio.currentTime - timeRef.current) > 0.15) {
        audio.currentTime = timeRef.current;
      }
      audio
        .play()
        .then(() => {
          playingRef.current = true;
          setPlaying(true);
        })
        .catch(() => {});
    }
  }, [seekTo]);

  // 初始化软3D引擎、自适应画幅与离线逐帧钩子
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const eng = new MVEngine(canvas);
    engineRef.current = eng;
    let cancelled = false;

    eng.init().then(() => {
      if (cancelled) return;
      syncCanvasSize();
      const initT = queryT ?? (isClean ? 0 : POSTER_TIME);
      timeRef.current = initT;
      eng.renderAt(initT, showLyricsRef.current, 0);
      setReady(true);

      const hook = {
        ready: () => eng.isReady(),
        render: (t: number, clean = false, width?: number) => eng.captureDataURL(t, clean, width),
        cover: (t: number, width?: number) => eng.captureDataURL(t, true, width),
        seek: (t: number) => {
          audioRef.current?.pause();
          playingRef.current = false;
          timeRef.current = t;
          setCurrentTime(t);
          eng.renderAt(t, showLyricsRef.current, 0);
        },
        duration: DURATION,
      };
      window.__mv = hook;
      window.__seek = hook.seek;
      // 离线渲染专用：直接更新引擎，避免逐帧触发 React 面板状态重绘。
      window.__mvSeek = (t: number) => {
        const clamped = Math.max(0, Math.min(DURATION - 0.01, t));
        timeRef.current = clamped;
        eng.renderAt(clamped, showLyricsRef.current, 0);
      };
      window.__mvRender = (t: number, clean = false) => eng.captureDataURL(t, clean);
      window.__mvCover = (t: number) => eng.captureDataURL(t, true);
    });

    const ro = new ResizeObserver(() => syncCanvasSize());
    if (stageRef.current) ro.observe(stageRef.current);

    return () => {
      cancelled = true;
      ro.disconnect();
      eng.dispose();
      engineRef.current = null;
    };
  }, [isClean, queryT, syncCanvasSize]);

  // 主播放循环：严格对齐 audio.currentTime 驱动画面与软3D字词卡点
  useEffect(() => {
    if (!ready) return;
    let rafId = 0;
    let lastUiUpdate = 0;

    const tick = (now: number) => {
      const eng = engineRef.current;
      const audio = audioRef.current;
      if (eng && audio && playingRef.current && !audio.paused) {
        const t = audio.currentTime;
        timeRef.current = t;
        eng.renderAt(t, showLyricsRef.current, 0);
        if (now - lastUiUpdate > 65) {
          lastUiUpdate = now;
          setCurrentTime(t);
        }
      }
      rafId = window.requestAnimationFrame(tick);
    };
    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [ready]);

  // 同步字幕开关到实时画面
  useEffect(() => {
    showLyricsRef.current = showLyrics;
    engineRef.current?.renderAt(timeRef.current, showLyrics, 0);
  }, [showLyrics]);

  // 同步音量与静音
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.muted = muted;
  }, [volume, muted]);

  // 全屏状态监听
  useEffect(() => {
    const onFs = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  const stepShot = useCallback(
    (delta: number) => {
      const { index } = shotSlotAt(timeRef.current);
      const next = Math.max(0, Math.min(SHOT_SLOTS.length - 1, index + delta));
      seekTo(SHOT_SLOTS[next].a + 0.06, playingRef.current);
    },
    [seekTo]
  );

  // 快捷键控制
  useEffect(() => {
    if (isClean) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        if (e.shiftKey) stepShot(1);
        else seekTo(timeRef.current + 3, playingRef.current);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        if (e.shiftKey) stepShot(-1);
        else seekTo(timeRef.current - 3, playingRef.current);
      } else if (e.key === 'c' || e.key === 'C') {
        setShowLyrics((v) => !v);
      } else if (e.key === 'm' || e.key === 'M') {
        setMuted((v) => !v);
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'r' || e.key === 'R') {
        seekTo(0, true);
      } else if (e.key === 'Escape' && drawerTab) {
        setDrawerTab(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerTab, isClean, seekTo, stepShot, toggleFullscreen, togglePlay]);

  // 播放时自动隐藏底部控制栏，移动鼠标唤醒
  const bumpHud = useCallback(() => {
    setHudVisible(true);
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    if (playingRef.current && !drawerTab) {
      hideTimerRef.current = window.setTimeout(() => setHudVisible(false), 3200);
    }
  }, [drawerTab]);

  useEffect(() => {
    if (!playing || drawerTab) {
      setHudVisible(true);
      if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    } else {
      bumpHud();
    }
  }, [playing, drawerTab, bumpHud]);

  const { slot: curSlot } = shotSlotAt(currentTime);
  const curShot = SHOT_MAP[curSlot.id];
  const curCue = activeCueAt(currentTime);
  const progressPct = Math.min(100, Math.max(0, (currentTime / DURATION) * 100));

  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    seekTo(pct * DURATION, playingRef.current || !hasStartedRef.current);
  };

  const handleHoverBar = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const t = pct * DURATION;
    const { slot } = shotSlotAt(t);
    setHoverInfo({ pct: pct * 100, time: t, label: `${slot.id} · ${SHOT_MAP[slot.id].title}` });
  };

  return (
    <div
      onMouseMove={isClean ? undefined : bumpHud}
      className="relative flex h-full w-full items-center justify-center bg-[#0a0913] select-none"
    >
      <audio
        ref={audioRef}
        src={songUrl}
        preload="auto"
        onEnded={() => {
          playingRef.current = false;
          setPlaying(false);
          setHudVisible(true);
        }}
      />

      {/* 16:9 软3D绘本主银幕 */}
      <div
        ref={stageRef}
        className={
          isClean
            ? 'relative h-screen w-screen overflow-hidden bg-black'
            : 'relative aspect-video max-h-full w-full max-w-[177.78vh] overflow-hidden bg-[#111022] shadow-[0_24px_90px_rgba(0,0,0,0.75)]'
        }
      >
        <canvas
          ref={canvasRef}
          onClick={isClean ? undefined : togglePlay}
          className="block h-full w-full cursor-pointer"
        />

        {/* 载入中柔和提示 */}
        {!ready && !isClean && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#121024]">
            <div className="h-9 w-9 animate-spin rounded-full border-2 border-pink-300/25 border-t-pink-300" />
            <p className="font-mv text-base tracking-wider text-pink-100/85">
              正在翻开《樱花草》软3D花语绘本…
            </p>
          </div>
        )}

        {/* 首屏轻透开场引导层（保留背后完整鲜活的软3D画面与字词字幕） */}
        {ready && !hasStarted && !isClean && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-start bg-gradient-to-b from-[#0d0a1c]/65 via-transparent to-[#0d0a1c]/45 pt-7 sm:pt-10">
            <h1 className="font-mv text-3xl tracking-widest text-white drop-shadow-[0_4px_18px_rgba(255,133,179,0.55)] sm:text-5xl">
              樱花草
            </h1>
            <p className="mt-1.5 text-xs tracking-[0.22em] text-pink-100/85 drop-shadow sm:text-sm">
              软3D立体绘本 · 逐字逐词对齐卡点
            </p>
            <div className="pointer-events-auto mt-4 flex flex-wrap items-center justify-center gap-2.5">
              <button
                onClick={() => seekTo(0, true)}
                className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-400 to-rose-400 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_28px_rgba(244,114,182,0.5)] transition hover:scale-105 hover:brightness-110 active:scale-95"
              >
                <Play className="h-4 w-4 fill-current" />
                从头播放
              </button>
              <button
                onClick={() => seekTo(64.48, true)}
                className="flex items-center gap-1.5 rounded-full border border-white/25 bg-[#161229]/65 px-4 py-2.5 text-xs font-medium text-pink-100 backdrop-blur-md transition hover:border-pink-300/60 hover:bg-pink-400/20"
              >
                直达副歌
              </button>
            </div>
          </div>
        )}

        {/* 顶部轻透分镜与当前逐词指示条（鼠标悬停时浮现，自动隐去） */}
        {!isClean && ready && hasStarted && (
          <div
            className={`pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-black/60 via-black/20 to-transparent px-4 pt-3 pb-8 transition-opacity duration-300 ${
              hudVisible ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded-full border border-pink-300/35 bg-pink-400/20 px-2.5 py-0.5 font-medium text-pink-100 backdrop-blur-md">
                {curSlot.section}
              </span>
              <span className="rounded-full bg-black/35 px-2.5 py-0.5 text-white/85 backdrop-blur-md">
                {curSlot.id} · {curShot.title}
              </span>
            </div>

            {/* 实时词组切分指示胶囊（直观呼应画面下方软3D词块对齐） */}
            {curCue && curCue.style !== 'lala' && (
              <div className="hidden items-center gap-1 rounded-full border border-white/12 bg-black/35 px-2.5 py-1 text-[11px] backdrop-blur-md md:flex">
                {curCue.words.map((w) => {
                  const hit = currentTime >= w.t0 && currentTime <= w.tEnd + 0.1;
                  const done = currentTime > w.tEnd + 0.1;
                  return (
                    <span
                      key={w.index}
                      className={`rounded px-1.5 py-0.5 transition ${
                        hit
                          ? 'bg-pink-400/40 font-semibold text-white'
                          : done
                            ? 'text-pink-200/80'
                            : 'text-white/40'
                      }`}
                    >
                      {w.label}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 底部自动隐藏影院控制栏（首屏待播时收起段落条，避免遮挡软3D逐词字幕） */}
        {!isClean && ready && (
          <div
            className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0b0916]/85 via-[#0b0916]/35 to-transparent px-4 pt-5 pb-2.5 transition-opacity duration-300 ${
              hudVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
          >
            {/* 段落快捷跳点 */}
            {hasStarted && (
              <div className="mv-scroll mb-1.5 hidden items-center gap-1 overflow-x-auto sm:flex">
              {CHAPTERS.map((ch) => {
                const isCur = curSlot.section === ch.name;
                return (
                  <button
                    key={ch.name}
                    onClick={() => seekTo(ch.start + 0.04, true)}
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] transition ${
                      isCur
                        ? 'bg-pink-400/35 font-medium text-pink-100 ring-1 ring-pink-300/50'
                        : 'bg-white/8 text-white/65 hover:bg-white/16 hover:text-white'
                    }`}
                  >
                    {ch.name}
                  </button>
                );
              })}
              </div>
            )}

            {/* 进度条 */}
            <div
              onClick={handleScrub}
              onMouseMove={handleHoverBar}
              onMouseLeave={() => setHoverInfo(null)}
              className="group relative flex h-4 cursor-pointer items-center"
            >
              {hoverInfo && (
                <div
                  className="pointer-events-none absolute -top-7 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/15 bg-[#17122b]/95 px-2 py-0.5 text-[11px] text-pink-100 shadow-lg"
                  style={{ left: `${Math.min(92, Math.max(8, hoverInfo.pct))}%` }}
                >
                  {formatTime(hoverInfo.time)} · {hoverInfo.label}
                </div>
              )}
              <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/18 transition-all group-hover:h-2">
                {CHAPTERS.slice(1).map((ch) => (
                  <div
                    key={ch.name}
                    className="absolute top-0 bottom-0 w-px bg-white/35"
                    style={{ left: `${(ch.start / DURATION) * 100}%` }}
                  />
                ))}
                <div
                  className="h-full rounded-full bg-gradient-to-r from-pink-300 via-rose-400 to-amber-300"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div
                className="pointer-events-none absolute h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 border-white bg-pink-400 shadow-md transition-transform group-hover:scale-125"
                style={{ left: `${progressPct}%` }}
              />
            </div>

            {/* 播放与功能按钮列 */}
            <div className="mt-1 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <button
                  onClick={togglePlay}
                  title="播放 / 暂停 (Space)"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-400/90 text-white shadow transition hover:bg-pink-400"
                >
                  {playing ? (
                    <Pause className="h-4 w-4 fill-current" />
                  ) : (
                    <Play className="h-4 w-4 translate-x-0.5 fill-current" />
                  )}
                </button>
                <button
                  onClick={() => seekTo(0, true)}
                  title="从头播放 (R)"
                  className="rounded-full p-1.5 text-white/75 transition hover:bg-white/12 hover:text-white"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => stepShot(-1)}
                  title="上一镜 (Shift+←)"
                  className="hidden rounded-full p-1.5 text-white/75 transition hover:bg-white/12 hover:text-white sm:inline-flex"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => stepShot(1)}
                  title="下一镜 (Shift+→)"
                  className="hidden rounded-full p-1.5 text-white/75 transition hover:bg-white/12 hover:text-white sm:inline-flex"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                <div className="group/vol ml-1 flex items-center gap-1">
                  <button
                    onClick={() => setMuted((v) => !v)}
                    title="静音 (M)"
                    className="rounded-full p-1.5 text-white/75 transition hover:bg-white/12 hover:text-white"
                  >
                    {muted || volume === 0 ? (
                      <VolumeX className="h-4 w-4 text-pink-300" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.02}
                    value={muted ? 0 : volume}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setVolume(v);
                      if (v > 0 && muted) setMuted(false);
                    }}
                    aria-label="音量"
                    className="hidden h-1 w-16 cursor-pointer accent-pink-400 md:block"
                  />
                </div>

                <span className="ml-1.5 font-mono text-xs text-white/75">
                  {formatTime(currentTime)}{' '}
                  <span className="text-white/40">/ {formatTime(DURATION)}</span>
                </span>
              </div>

              <div className="flex items-center gap-1 sm:gap-1.5">
                <button
                  onClick={() => setShowLyrics((v) => !v)}
                  title="软3D字幕开关 (C)"
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition ${
                    showLyrics
                      ? 'bg-pink-400/25 text-pink-100 ring-1 ring-pink-300/40'
                      : 'bg-white/8 text-white/55 hover:text-white'
                  }`}
                >
                  <Captions className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">3D字幕</span>
                </button>
                <button
                  onClick={() => setDrawerTab((t) => (t === 'shots' ? null : 'shots'))}
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition ${
                    drawerTab === 'shots'
                      ? 'bg-pink-400/30 text-pink-100 ring-1 ring-pink-300/45'
                      : 'bg-white/8 text-white/75 hover:bg-white/15 hover:text-white'
                  }`}
                >
                  <Film className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">分镜</span>
                </button>
                <button
                  onClick={() => setDrawerTab((t) => (t === 'lyrics' ? null : 'lyrics'))}
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition ${
                    drawerTab === 'lyrics'
                      ? 'bg-pink-400/30 text-pink-100 ring-1 ring-pink-300/45'
                      : 'bg-white/8 text-white/75 hover:bg-white/15 hover:text-white'
                  }`}
                >
                  <Music className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">字词</span>
                </button>
                <button
                  onClick={() => setDrawerTab((t) => (t === 'cast' ? null : 'cast'))}
                  className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition ${
                    drawerTab === 'cast'
                      ? 'bg-pink-400/30 text-pink-100 ring-1 ring-pink-300/45'
                      : 'bg-white/8 text-white/75 hover:bg-white/15 hover:text-white'
                  }`}
                >
                  <Users className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">角色</span>
                </button>
                <button
                  onClick={toggleFullscreen}
                  title="全屏 (F)"
                  className="rounded-full p-1.5 text-white/75 transition hover:bg-white/12 hover:text-white"
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 侧边抽屉：分镜表 / 字词卡点 / 登场角色 */}
      {!isClean && (
        <DrawerPanels
          tab={drawerTab}
          onClose={() => setDrawerTab(null)}
          onTabChange={setDrawerTab}
          currentTime={currentTime}
          currentShotId={curSlot.id}
          onJump={seekTo}
        />
      )}
    </div>
  );
}

export default App;
