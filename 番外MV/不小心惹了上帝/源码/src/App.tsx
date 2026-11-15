import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Clapperboard,
  Download,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Repeat,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Subtitles,
  Users,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { getPortraitDataUrl, type AtlasData } from './mv/actors';
import { MVAudio } from './mv/audio';
import { BEAT_FIRST, BEAT_PERIOD, BPM, clamp, SONG_DURATION } from './mv/core';
import { MVEngine } from './mv/engine';
import {
  CAST_PROFILES,
  LYRIC_CUES,
  parseSegSrc,
  SHOT_PLAN,
  type LyricCue,
  type ShotMeta,
} from './mv/timeline';

function formatTime(sec: number): string {
  const s = Math.max(0, sec);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem < 10 ? '0' : ''}${rem.toFixed(2)}`;
}

// 出片用：?clean 直接进影院模式（工作台 HUD 全藏），配合 window.__seek(t) 逐帧截图
const PARAMS = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
const CLEAN = PARAMS.has('clean');

const STYLE_LABELS: Record<LyricCue['style'], string> = {
  thunderDrop: '神罚坠落',
  vortexDive: '星穹穿入',
  impactShake: '雷霆震颤',
  driftWave: '风浪浮沉',
  pageFlip: '残页翻飞',
  tearFall: '泪珠缓坠',
  dreamPop: '入梦轻跃',
  heavySink: '无力沉降',
  miracleRise: '曙光奇迹',
};

export function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stageWrapRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<MVEngine | null>(null);
  const audioRef = useRef<MVAudio | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [loop, setLoop] = useState(true);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.9);
  const [showLyrics3D, setShowLyrics3D] = useState(true);
  const [lyricOffset, setLyricOffset] = useState(0);
  const [cinemaMode, setCinemaMode] = useState(CLEAN);
  const [activeTab, setActiveTab] = useState<'storyboard' | 'cast'>('storyboard');
  const [showOffsetSlider, setShowOffsetSlider] = useState(false);

  // MP4 export state
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportError, setExportError] = useState<string | null>(null);
  const exportingRef = useRef(false);
  const exportCancelRef = useRef(false);

  const [currentTime, setCurrentTime] = useState(0.24);
  const [activeShot, setActiveShot] = useState<ShotMeta>(SHOT_PLAN[0]);
  const [beatPulse, setBeatPulse] = useState(0);
  const [portraits, setPortraits] = useState<Record<string, string>>({});

  // Refs synced into RAF loop
  const playingRef = useRef(false);
  const loopRef = useRef(true);
  const timeRef = useRef(0.24);
  const scrubbingRef = useRef(false);

  useEffect(() => {
    loopRef.current = loop;
  }, [loop]);

  // Pre-compute beat ticks along 0..SONG_DURATION
  const beatTicks = useMemo(() => {
    const out: { t: number; down: boolean }[] = [];
    let idx = 0;
    while (true) {
      const t = BEAT_FIRST + idx * BEAT_PERIOD;
      if (t > SONG_DURATION) break;
      out.push({ t, down: idx % 4 === 0 });
      idx++;
    }
    return out;
  }, []);

  // Pre-parsed lyric word/character metadata for live sync strip
  const parsedLyrics = useMemo(
    () =>
      LYRIC_CUES.map((cue) => ({
        cue,
        parsed: parseSegSrc(cue.segSrc),
      })),
    []
  );

  // Extract pixel portraits once atlas loads
  const extractPortraits = useCallback((atlas: AtlasData) => {
    const map: Record<string, string> = {};
    for (const p of CAST_PROFILES) {
      map[p.id] = getPortraitDataUrl(atlas, p.portraitKey);
    }
    setPortraits(map);
  }, []);

  // Initialize Three.js MVEngine + Audio + RAF loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new MVEngine(canvas);
    const audio = new MVAudio();
    engineRef.current = engine;
    audioRef.current = audio;
    audio.setVolume(0.9);

    let disposed = false;
    let rafId = 0;
    let lastUiSync = 0;

    const doResize = () => {
      const wrap = stageWrapRef.current;
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      engine.resize(Math.max(1, Math.floor(rect.width)), Math.max(1, Math.floor(rect.height)));
    };

    const ro = new ResizeObserver(doResize);
    if (stageWrapRef.current) ro.observe(stageWrapRef.current);
    doResize();

    engine
      .init()
      .then((atlas) => {
        if (disposed) return;
        extractPortraits(atlas);
        setLoading(false);
        // Render crisp opening frame immediately
        engine.renderAt(timeRef.current, 0);

        // 出片钩子：外部按帧设时间并立刻渲一帧（页面自身的播放逻辑不受影响）
        (window as unknown as { __seek?: (t: number) => void; __ready?: boolean }).__seek = (t: number) => {
          timeRef.current = clamp(t, 0, SONG_DURATION);
          engine.renderAt(timeRef.current, 0);   // 音频能量只影响 ±0.45° 的 FOV 冲拳，出片时取 0
        };
        (window as unknown as { __ready?: boolean }).__ready = true;

        const tick = (now: number) => {
          if (disposed) return;
          rafId = requestAnimationFrame(tick);

          let t = timeRef.current;
          let energy = 0;
          if (playingRef.current && !scrubbingRef.current) {
            t = audio.currentTime;
            energy = audio.getEnergy();
            if (audio.el.ended || t >= SONG_DURATION - 0.03) {
              if (loopRef.current) {
                audio.seek(0);
                audio.play().catch(() => {});
                t = 0;
              } else {
                playingRef.current = false;
                setPlaying(false);
                t = SONG_DURATION;
              }
            }
            timeRef.current = t;
          }

          const tel = engine.renderAt(t, energy);

          // Update React HUD at ~30Hz for crisp lyric/beat indicators without unnecessary React churn
          if (now - lastUiSync > 32) {
            lastUiSync = now;
            setCurrentTime(tel.t);
            setActiveShot(tel.shot);
            setBeatPulse(tel.beat.pulse);
          }
        };

        rafId = requestAnimationFrame(tick);
      })
      .catch((err) => {
        if (!disposed) {
          setLoadErr(String(err?.message || err));
          setLoading(false);
        }
      });

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      ro.disconnect();
      audio.dispose();
      engine.dispose();
    };
  }, [extractPortraits]);

  // Keep engine toggles synced
  useEffect(() => {
    engineRef.current?.setLyricsVisible(showLyrics3D);
  }, [showLyrics3D]);

  useEffect(() => {
    engineRef.current?.setLyricOffset(lyricOffset);
  }, [lyricOffset]);

  // Playback controls
  const startPlayback = useCallback(async (fromTime?: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    if (fromTime !== undefined) {
      audio.seek(fromTime);
      timeRef.current = fromTime;
      setCurrentTime(fromTime);
    } else if (!hasStarted) {
      audio.seek(0);
      timeRef.current = 0;
      setCurrentTime(0);
    }
    try {
      await audio.play();
      setHasStarted(true);
      playingRef.current = true;
      setPlaying(true);
    } catch {
      // Autoplay blocked fallback
    }
  }, [hasStarted]);

  const togglePlay = useCallback(() => {
    if (exportingRef.current) return;
    const audio = audioRef.current;
    if (!audio) return;
    if (playingRef.current) {
      audio.pause();
      playingRef.current = false;
      setPlaying(false);
    } else {
      startPlayback();
    }
  }, [startPlayback]);

  const replay = useCallback(() => {
    startPlayback(0);
  }, [startPlayback]);

  const seekTo = useCallback((sec: number, autoPlay = false) => {
    if (exportingRef.current) return;
    const clamped = clamp(sec, 0, SONG_DURATION - 0.02);
    timeRef.current = clamped;
    setCurrentTime(clamped);
    audioRef.current?.seek(clamped);
    engineRef.current?.renderAt(clamped, 0);
    if (autoPlay) {
      startPlayback(clamped);
    }
  }, [startPlayback]);

  // ---- MP4 export: record the WebGL canvas + mux the original BGM in real time ----
  const exportMP4 = useCallback(async () => {
    const engine = engineRef.current;
    const audio = audioRef.current;
    const canvas = canvasRef.current;
    if (!engine || !audio || !canvas || exportingRef.current) return;

    if (typeof MediaRecorder === 'undefined') {
      setExportError('当前浏览器不支持 MediaRecorder，无法导出 MP4（请使用最新版 Chrome / Edge / Safari）。');
      return;
    }
    const mimeCandidates = [
      'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
      'video/mp4',
      'video/webm;codecs=vp9,opus',
      'video/webm',
    ];
    const mimeType = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) || '';
    const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';

    exportingRef.current = true;
    exportCancelRef.current = false;
    setExporting(true);
    setExportProgress(0);
    setExportError(null);

    const wrap = stageWrapRef.current;
    const prevRect = wrap?.getBoundingClientRect();
    const EXPORT_W = 1280;
    const EXPORT_H = 720;
    engine.setExportMode(true);
    engine.resize(EXPORT_W, EXPORT_H);

    let recorder: MediaRecorder | null = null;
    try {
      // Build the WebAudio graph first so the record tap exists
      await audio.play();
      audio.pause();

      const canvasStream = canvas.captureStream(30);
      const tracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];
      const audioStream = audio.getRecordStream();
      if (audioStream) tracks.push(...audioStream.getAudioTracks());
      const stream = new MediaStream(tracks);

      const chunks: Blob[] = [];
      recorder = new MediaRecorder(stream, {
        mimeType: mimeType || undefined,
        videoBitsPerSecond: 8_000_000,
        audioBitsPerSecond: 192_000,
      });
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      const stopped = new Promise<void>((resolve) => {
        recorder!.onstop = () => resolve();
      });

      // Record from the very first frame, then play the BGM in sync
      loopRef.current = false;
      audio.seek(0);
      timeRef.current = 0;
      setCurrentTime(0);
      recorder.start(250);
      await audio.play();
      playingRef.current = true;
      setPlaying(true);
      setHasStarted(true);

      const poll = window.setInterval(() => {
        setExportProgress(clamp(audio.currentTime / SONG_DURATION, 0, 1));
      }, 120);

      await new Promise<void>((resolve) => {
        const check = () => {
          if (
            exportCancelRef.current ||
            audio.el.ended ||
            audio.currentTime >= SONG_DURATION - 0.05 ||
            !playingRef.current
          ) {
            resolve();
          } else {
            requestAnimationFrame(check);
          }
        };
        check();
      });
      window.clearInterval(poll);
      setExportProgress(1);

      if (recorder.state !== 'inactive') recorder.stop();
      await stopped;

      if (!exportCancelRef.current && chunks.length > 0) {
        const blob = new Blob(chunks, { type: mimeType || 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `不小心惹了上帝_3D像素MV.${ext}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 4000);
      }
    } catch (err) {
      if (!exportCancelRef.current) {
        setExportError(`导出失败：${String((err as Error)?.message || err)}`);
      }
    } finally {
      audio.pause();
      playingRef.current = false;
      setPlaying(false);
      loopRef.current = loop;
      engine.setExportMode(false);
      if (prevRect) engine.resize(Math.floor(prevRect.width), Math.floor(prevRect.height));
      exportingRef.current = false;
      setExporting(false);
    }
  }, [loop]);

  const cancelExport = useCallback(() => {
    exportCancelRef.current = true;
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      audioRef.current?.setMuted(next);
      return next;
    });
  }, []);

  const handleVolumeChange = useCallback((v: number) => {
    setVolume(v);
    audioRef.current?.setVolume(v);
    if (v > 0 && muted) {
      setMuted(false);
      audioRef.current?.setMuted(false);
    }
  }, [muted]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        seekTo(timeRef.current - 1.0);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        seekTo(timeRef.current + 1.0);
      } else if (e.key === 'r' || e.key === 'R') {
        replay();
      } else if (e.key === 'l' || e.key === 'L') {
        setShowLyrics3D((v) => !v);
      } else if (e.key === 'f' || e.key === 'F') {
        setCinemaMode((v) => !v);
      } else if (e.key === 'Escape' && cinemaMode) {
        setCinemaMode(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePlay, seekTo, replay, cinemaMode]);

  // Determine currently active lyric cue for the live Word/Char Beat-Sync Strip
  const activeLyricEntry = useMemo(() => {
    const t = currentTime + lyricOffset;
    for (const entry of parsedLyrics) {
      if (t >= entry.cue.t[0] - 0.35 && t <= entry.cue.end + 0.18) {
        return entry;
      }
    }
    return null;
  }, [currentTime, lyricOffset, parsedLyrics]);

  // Scrubber pointer handler
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const updateScrubFromClientX = useCallback(
    (clientX: number) => {
      const el = timelineRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const frac = clamp((clientX - rect.left) / Math.max(1, rect.width), 0, 1);
      seekTo(frac * SONG_DURATION);
    },
    [seekTo]
  );

  const onTimelinePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    scrubbingRef.current = true;
    updateScrubFromClientX(e.clientX);
  };
  const onTimelinePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!scrubbingRef.current) return;
    updateScrubFromClientX(e.clientX);
  };
  const onTimelinePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!scrubbingRef.current) return;
    scrubbingRef.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <div
      className={`min-h-screen w-full bg-[#080610] text-[#f5f0e8] flex flex-col ${
        cinemaMode ? 'fixed inset-0 z-50 overflow-hidden bg-black' : ''
      }`}
    >
      {/* Top Studio Header (hidden in cinema mode) */}
      {!cinemaMode && (
        <header className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 pt-4 pb-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400/25 to-rose-500/25 border border-amber-300/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-amber-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold tracking-wide text-amber-50 truncate">
                  《不小心惹了上帝》· 3D 像素群像卡点 MV
                </h1>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-400/15 border border-amber-300/25 text-amber-200 font-medium">
                  {BPM.toFixed(1)} BPM 实测逐字卡点
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                分支角色图集（8 位 AI 娘 · 682 帧像素动作） × 11 镜原创 3D 分镜 × 逐字/分词 3D 立体字幕
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 shrink-0">
            <span className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10">
              Space 播放 · ←/→ 跳转 · F 影院模式
            </span>
          </div>
        </header>
      )}

      {/* Main 16:9 Cinema Stage */}
      <main
        className={`w-full flex flex-col items-center ${
          cinemaMode
            ? 'flex-1 justify-center px-0'
            : 'max-w-[1280px] mx-auto px-4 sm:px-6 pb-8'
        }`}
      >
        <div
          className={`relative w-full ${
            cinemaMode
              ? 'h-full flex items-center justify-center bg-black'
              : 'rounded-2xl overflow-hidden border border-white/10 shadow-[0_24px_80px_rgba(0,0,0,0.75)] bg-[#0c0818]'
          }`}
        >
          {/* 16:9 WebGL Canvas Wrapper */}
          <div
            ref={stageWrapRef}
            onClick={() => {
              if (!loading && hasStarted) togglePlay();
            }}
            className={`relative w-full aspect-video cursor-pointer select-none overflow-hidden ${
              cinemaMode ? 'max-h-screen max-w-[177.78vh]' : ''
            }`}
          >
            <canvas ref={canvasRef} className="block w-full h-full" />

            {/* Subtle cinematic letterbox vignette */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  'radial-gradient(ellipse at center, transparent 58%, rgba(6,4,14,0.48) 100%)',
              }}
            />

            {/* Shot-cut flash / fade transitions are baked into the WebGL canvas (see MVEngine overlay pass) */}

            {/* Loading State */}
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#090612]/90 backdrop-blur-sm z-20">
                <div className="w-10 h-10 rounded-full border-2 border-amber-300/30 border-t-amber-300 animate-spin mb-3" />
                <p className="text-sm text-amber-100/90 tracking-wide">
                  正在装载分支角色像素图集（682 帧）与 3D 字幕字形…
                </p>
              </div>
            )}

            {/* Error State */}
            {loadErr && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 p-6 text-center z-20">
                <p className="text-rose-300 font-semibold mb-1">资源初始化失败</p>
                <p className="text-xs text-slate-400 max-w-md">{loadErr}</p>
              </div>
            )}

            {/* Opening Start Curtain Overlay (disappears cleanly once playing -> zero watermarks!) */}
            {!loading && !loadErr && !hasStarted && !CLEAN && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  startPlayback(0);
                }}
                className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gradient-to-t from-[#080612]/90 via-[#0e0920]/55 to-[#080612]/65 backdrop-blur-[2px] transition-all group"
              >
                <div className="flex items-center gap-2 mb-4 px-3 py-1.5 rounded-full bg-white/[0.06] border border-amber-300/25">
                  {CAST_PROFILES.map((c) =>
                    portraits[c.id] ? (
                      <img
                        key={c.id}
                        src={portraits[c.id]}
                        alt={c.name}
                        title={`${c.name} (${c.alias})`}
                        className="w-7 h-7 pixelated rounded-md bg-black/30 border border-white/10"
                      />
                    ) : null
                  )}
                </div>

                <h2 className="text-2xl sm:text-4xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-[#fff7d6] via-[#ffd166] to-[#f97316] drop-shadow-[0_4px_24px_rgba(255,180,60,0.35)] mb-2">
                  不小心惹了上帝
                </h2>
                <p className="text-xs sm:text-sm text-amber-100/75 mb-6 tracking-wide text-center px-4">
                  本鲸 × 龙娘（上帝）× 全员八位 AI 娘 · 11 镜原创 3D 分镜 · 逐字分词立体卡点
                </p>

                <button
                  type="button"
                  className="flex items-center gap-2.5 px-7 py-3 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-rose-400 text-[#190c1c] font-bold text-sm sm:text-base shadow-[0_0_36px_rgba(251,191,36,0.45)] group-hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                >
                  <Play className="w-5 h-5 fill-current" />
                  播放 MV（原声同步卡点）
                </button>
              </div>
            )}

            {/* Paused subtle indicator after started */}
            {!loading && hasStarted && !playing && !exporting && !CLEAN && (
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20">
                <div className="w-16 h-16 rounded-full bg-black/55 border border-amber-200/40 backdrop-blur-md flex items-center justify-center shadow-2xl">
                  <Play className="w-7 h-7 text-amber-200 fill-amber-200 ml-0.5" />
                </div>
              </div>
            )}

            {/* MP4 Export progress overlay */}
            {exporting && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#0a0614]/88 backdrop-blur-sm px-6 text-center"
              >
                <div className="w-12 h-12 rounded-full border-2 border-amber-300/30 border-t-amber-300 animate-spin mb-4" />
                <h3 className="text-base sm:text-lg font-bold text-amber-100 mb-1.5">
                  正在导出 MP4（1280×720 · 画面 + 原声混流）
                </h3>
                <p className="text-xs text-slate-400 mb-4 max-w-md leading-relaxed">
                  实时逐帧录制中，请保持本页面在前台、不要切换标签页。导出完成后将自动开始下载。
                </p>
                <div className="w-full max-w-sm h-2.5 rounded-full bg-white/10 overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 to-rose-400 transition-[width] duration-150"
                    style={{ width: `${Math.round(exportProgress * 100)}%` }}
                  />
                </div>
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-xs font-mono text-amber-200">
                    {Math.round(exportProgress * 100)}%
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    {formatTime(exportProgress * SONG_DURATION)} / {formatTime(SONG_DURATION)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={cancelExport}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/[0.07] hover:bg-white/[0.14] border border-white/15 text-xs text-slate-200 cursor-pointer transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  取消导出
                </button>
              </div>
            )}

            {/* Export error toast */}
            {exportError && !exporting && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-950/90 border border-rose-400/40 text-xs text-rose-100 shadow-2xl max-w-[90%]">
                <span className="flex-1">{exportError}</span>
                <button
                  type="button"
                  onClick={() => setExportError(null)}
                  className="p-1 rounded hover:bg-white/10 cursor-pointer shrink-0"
                  title="关闭"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Cinema Mode Floating Exit Bar */}
            {cinemaMode && !CLEAN && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 rounded-full bg-black/65 hover:bg-black/80 backdrop-blur-md border border-white/15 opacity-25 hover:opacity-100 transition-opacity"
              >
                <button
                  type="button"
                  onClick={togglePlay}
                  className="p-1.5 rounded-full hover:bg-white/10 text-amber-200 cursor-pointer"
                  title="播放/暂停"
                >
                  {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={replay}
                  className="p-1.5 rounded-full hover:bg-white/10 text-slate-200 cursor-pointer"
                  title="重播"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <span className="text-xs font-mono text-amber-100/90 px-1">
                  {formatTime(currentTime)} / {formatTime(SONG_DURATION)}
                </span>
                <button
                  type="button"
                  onClick={() => setCinemaMode(false)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-slate-200 cursor-pointer"
                  title="退出影院模式 (Esc)"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Studio Transport, Beat Timeline & Live Word/Char Sync Monitor (Hidden in Cinema Mode) */}
          {!cinemaMode && (
            <div className="bg-[#110d1e]/95 border-t border-white/10 px-4 sm:px-5 pt-3 pb-4 space-y-3">
              {/* Interactive 11-Shot Storyboard + Beat-Tick Scrubber */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="inline-block w-2 h-2 rounded-full shrink-0 transition-transform"
                      style={{
                        backgroundColor: activeShot.accent,
                        transform: `scale(${1 + beatPulse * 0.55})`,
                        boxShadow: `0 0 ${8 + beatPulse * 12}px ${activeShot.accent}`,
                      }}
                    />
                    <span className="font-semibold text-amber-100 truncate">
                      {activeShot.title}
                    </span>
                    <span className="hidden sm:inline text-slate-500">·</span>
                    <span className="hidden sm:inline text-slate-300 truncate">
                      {activeShot.lyric}
                    </span>
                  </div>
                  <div className="font-mono text-amber-200/90 shrink-0 ml-2">
                    {formatTime(currentTime)}{' '}
                    <span className="text-slate-500">/ {formatTime(SONG_DURATION)}</span>
                  </div>
                </div>

                {/* Click/Drag Scrubber with 11 Shot Segments & Real Beat Ticks */}
                <div
                  ref={timelineRef}
                  onPointerDown={onTimelinePointerDown}
                  onPointerMove={onTimelinePointerMove}
                  onPointerUp={onTimelinePointerUp}
                  className="relative h-8 rounded-lg bg-black/45 border border-white/10 overflow-hidden cursor-ew-resize select-none"
                >
                  {/* 11 Storyboard shot color bands */}
                  <div className="absolute inset-0 flex">
                    {SHOT_PLAN.map((sh) => {
                      const widthPct = ((sh.end - sh.start) / SONG_DURATION) * 100;
                      const isCur = sh.id === activeShot.id;
                      return (
                        <div
                          key={sh.id}
                          style={{
                            width: `${widthPct}%`,
                            backgroundColor: isCur ? `${sh.accent}38` : `${sh.accent}14`,
                          }}
                          title={`${sh.title} (${formatTime(sh.start)}) — ${sh.lyric}`}
                          className="h-full border-r border-white/10 last:border-r-0 flex items-end px-1 pb-0.5 overflow-hidden transition-colors"
                        >
                          <span
                            className={`text-[9px] font-mono truncate ${
                              isCur ? 'text-white font-bold' : 'text-white/45'
                            }`}
                          >
                            {sh.id}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Real 102.4 BPM Beat Ticks */}
                  {beatTicks.map((b, i) => (
                    <div
                      key={i}
                      style={{ left: `${(b.t / SONG_DURATION) * 100}%` }}
                      className={`pointer-events-none absolute top-0 w-px ${
                        b.down ? 'h-3 bg-amber-200/55' : 'h-1.5 bg-white/20'
                      }`}
                    />
                  ))}

                  {/* Playhead */}
                  <div
                    style={{ left: `${(currentTime / SONG_DURATION) * 100}%` }}
                    className="pointer-events-none absolute top-0 bottom-0 w-0.5 bg-amber-300 shadow-[0_0_10px_#fbbf24]"
                  >
                    <div className="w-2.5 h-2.5 -ml-[4px] -mt-0.5 rounded-full bg-amber-200 border border-[#1a102b]" />
                  </div>
                </div>
              </div>

              {/* Control Row + Live Word/Char Beat-Sync Readout */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Transport Controls */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-[#180d24] font-bold text-xs cursor-pointer transition-colors"
                  >
                    {playing ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" /> 暂停
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" /> 播放
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={replay}
                    className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/10 border border-white/10 text-slate-200 cursor-pointer"
                    title="从头播放 (R)"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoop((v) => !v)}
                    className={`p-2 rounded-lg border cursor-pointer transition-colors ${
                      loop
                        ? 'bg-amber-400/20 border-amber-300/40 text-amber-200'
                        : 'bg-white/[0.04] border-white/10 text-slate-400 hover:text-slate-200'
                    }`}
                    title="循环播放"
                  >
                    <Repeat className="w-3.5 h-3.5" />
                  </button>

                  {/* Volume */}
                  <div className="flex items-center gap-1.5 pl-1">
                    <button
                      type="button"
                      onClick={toggleMute}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 cursor-pointer"
                      title="静音"
                    >
                      {muted || volume === 0 ? (
                        <VolumeX className="w-4 h-4 text-rose-300" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={muted ? 0 : volume}
                      onChange={(e) => handleVolumeChange(Number(e.target.value))}
                      className="w-16 accent-amber-400 cursor-pointer"
                      aria-label="音量"
                    />
                  </div>
                </div>

                {/* Live Word & Character 3D Sync Monitor */}
                <div className="flex-1 min-w-[230px] flex items-center justify-center px-3 py-1.5 rounded-lg bg-black/35 border border-white/[0.08] overflow-x-auto">
                  {activeLyricEntry ? (
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-amber-200/90 font-medium">
                        {STYLE_LABELS[activeLyricEntry.cue.style]}
                      </span>
                      <div className="flex items-center gap-2">
                        {activeLyricEntry.parsed.words.map((wd, wi) => {
                          const tNow = currentTime + lyricOffset;
                          const wt0 = activeLyricEntry.cue.t[wd.from];
                          const wt1 = activeLyricEntry.cue.t[wd.to];
                          const wordHit = tNow >= wt0 && tNow <= wt1 + 0.35;
                          return (
                            <span
                              key={wi}
                              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md transition-all ${
                                wd.key
                                  ? wordHit
                                    ? 'bg-amber-400/25 ring-1 ring-amber-300/60 scale-105'
                                    : 'bg-amber-400/10'
                                  : wordHit
                                    ? 'bg-white/10'
                                    : ''
                              }`}
                            >
                              {Array.from({ length: wd.to - wd.from + 1 }, (_, k) => {
                                const ci = wd.from + k;
                                const ch = activeLyricEntry.parsed.segs[ci].c;
                                const ct = activeLyricEntry.cue.t[ci];
                                const lit = tNow >= ct;
                                const fresh = tNow >= ct && tNow < ct + 0.25;
                                return (
                                  <span
                                    key={ci}
                                    className={`text-xs sm:text-sm font-bold transition-all ${
                                      fresh
                                        ? wd.key
                                          ? 'text-amber-300 scale-125 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]'
                                          : 'text-sky-200 scale-115'
                                        : lit
                                          ? wd.key
                                            ? 'text-amber-200'
                                            : 'text-white'
                                          : 'text-slate-500'
                                    }`}
                                  >
                                    {ch}
                                  </span>
                                );
                              })}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">
                      {currentTime < 1.06
                        ? '序幕 · 0.22s 人声起拍砸出 3D 片名'
                        : '间奏 · 裂隙生花 · 全员集结迎接终章'}
                    </span>
                  )}
                </div>

                {/* Right-side Tools */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowLyrics3D((v) => !v)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${
                      showLyrics3D
                        ? 'bg-amber-400/15 border-amber-300/35 text-amber-200'
                        : 'bg-white/[0.04] border-white/10 text-slate-400'
                    }`}
                    title="显示/隐藏 3D 字幕 (L)"
                  >
                    <Subtitles className="w-3.5 h-3.5" />
                    3D字幕
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowOffsetSlider((v) => !v)}
                    className={`p-2 rounded-lg border cursor-pointer transition-colors ${
                      showOffsetSlider || lyricOffset !== 0
                        ? 'bg-sky-400/15 border-sky-300/35 text-sky-200'
                        : 'bg-white/[0.04] border-white/10 text-slate-400 hover:text-slate-200'
                    }`}
                    title="卡点同步微调（蓝牙耳机延迟补偿）"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setCinemaMode(true)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/12 border border-white/10 text-xs text-slate-100 cursor-pointer"
                    title="纯净影院模式 (F)"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    影院
                  </button>

                  <button
                    type="button"
                    onClick={exportMP4}
                    disabled={exporting || loading}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-400/25 to-rose-400/25 hover:from-amber-400/40 hover:to-rose-400/40 border border-amber-300/40 text-xs font-semibold text-amber-100 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    title="实时录制 1280×720 成片并下载 MP4（画面 + 原声 BGM 混流）"
                  >
                    <Download className="w-3.5 h-3.5" />
                    导出 MP4
                  </button>
                </div>
              </div>

              {/* Optional Subtitle Sync Offset Micro-Tuner */}
              {showOffsetSlider && (
                <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 rounded-lg bg-sky-950/35 border border-sky-400/20 text-xs">
                  <span className="text-sky-200/90">
                    3D 字幕卡点微调（适配蓝牙耳机延迟）：
                    <strong className="font-mono ml-1 text-white">
                      {lyricOffset >= 0 ? `+${lyricOffset.toFixed(2)}s` : `${lyricOffset.toFixed(2)}s`}
                    </strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={-0.25}
                      max={0.25}
                      step={0.01}
                      value={lyricOffset}
                      onChange={(e) => setLyricOffset(Number(e.target.value))}
                      className="w-40 accent-sky-400 cursor-pointer"
                    />
                    <button
                      type="button"
                      onClick={() => setLyricOffset(0)}
                      className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-slate-200 cursor-pointer"
                    >
                      归零
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Interactive Storyboard & Branch Cast Panel (Hidden in Cinema Mode) */}
        {!cinemaMode && (
          <section className="w-full mt-5 rounded-2xl bg-[#100c1c] border border-white/10 overflow-hidden">
            {/* Tabs */}
            <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-white/10 bg-white/[0.02]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('storyboard')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold cursor-pointer transition-colors ${
                    activeTab === 'storyboard'
                      ? 'bg-amber-400/20 text-amber-200 border border-amber-300/35'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Clapperboard className="w-4 h-4" />
                  11 镜原创分镜脚本
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('cast')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold cursor-pointer transition-colors ${
                    activeTab === 'cast'
                      ? 'bg-amber-400/20 text-amber-200 border border-amber-300/35'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  分支登场人物（8 位）
                </button>
              </div>
              <span className="hidden sm:inline text-xs text-slate-500">
                点击任意分镜卡可直接跳转对应 3D 镜头并同步播放
              </span>
            </div>

            {activeTab === 'storyboard' ? (
              <div className="p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[430px] overflow-y-auto cinema-scroll">
                {SHOT_PLAN.map((sh) => {
                  const isCur = sh.id === activeShot.id;
                  return (
                    <button
                      key={sh.id}
                      type="button"
                      onClick={() => seekTo(sh.start + 0.02, true)}
                      className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                        isCur
                          ? 'bg-white/[0.08] border-amber-300/50 shadow-[0_0_24px_rgba(251,191,36,0.12)]'
                          : 'bg-white/[0.025] border-white/[0.08] hover:bg-white/[0.055] hover:border-white/20'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shrink-0"
                              style={{
                                backgroundColor: `${sh.accent}28`,
                                color: sh.accent,
                              }}
                            >
                              {sh.id}
                            </span>
                            <span className="text-xs font-semibold text-amber-50 truncate">
                              {sh.title}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">
                            {sh.start.toFixed(2)}s
                          </span>
                        </div>

                        <p className="text-sm font-bold text-amber-200/95 tracking-wide">
                          {sh.lyric}
                        </p>
                        <p className="text-[11px] leading-relaxed text-slate-400">{sh.note}</p>
                      </div>

                      {/* Cast portrait pills for this shot */}
                      <div className="flex items-center gap-1.5 pt-1 border-t border-white/[0.06] flex-wrap">
                        {sh.cast.map((cid) => {
                          const prof = CAST_PROFILES.find((p) => p.id === cid);
                          return (
                            <span
                              key={cid}
                              className="inline-flex items-center gap-1 pr-2 pl-0.5 py-0.5 rounded-full bg-black/40 border border-white/10 text-[10px] text-slate-300"
                            >
                              {portraits[cid] && (
                                <img
                                  src={portraits[cid]}
                                  alt={prof?.name}
                                  className="w-4 h-4 pixelated rounded-full"
                                />
                              )}
                              {prof?.name.split(' / ')[0]}
                            </span>
                          );
                        })}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {CAST_PROFILES.map((c) => {
                  const featuredShots = SHOT_PLAN.filter((s) => s.cast.includes(c.id));
                  return (
                    <div
                      key={c.id}
                      className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.08] flex flex-col justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className="w-14 h-14 rounded-xl shrink-0 flex items-center justify-center border border-white/15 bg-black/45 overflow-hidden"
                          style={{ boxShadow: `inset 0 0 18px ${c.color}25` }}
                        >
                          {portraits[c.id] ? (
                            <img
                              src={portraits[c.id]}
                              alt={c.name}
                              className="w-12 h-12 pixelated object-contain"
                            />
                          ) : null}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-sm font-bold text-white truncate">{c.name}</h3>
                          </div>
                          <p className="text-[11px] font-mono" style={{ color: c.color }}>
                            {c.alias}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                            {c.roleInMv}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-white/[0.06]">
                        <div className="text-[10px] text-slate-400">
                          像素道具：<span className="text-amber-200/85">{c.prop}</span>
                        </div>
                        <div className="flex items-center gap-1 flex-wrap">
                          {featuredShots.map((sh) => (
                            <button
                              key={sh.id}
                              type="button"
                              onClick={() => seekTo(sh.start + 0.02, true)}
                              className="px-1.5 py-0.5 rounded bg-white/[0.06] hover:bg-amber-400/25 text-[10px] font-mono text-slate-300 hover:text-amber-100 cursor-pointer transition-colors"
                              title={`跳转 ${sh.title}`}
                            >
                              {sh.id}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
