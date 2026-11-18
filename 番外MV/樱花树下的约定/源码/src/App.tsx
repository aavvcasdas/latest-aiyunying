import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Camera,
  Clapperboard,
  Download,
  Film,
  Maximize2,
  Minimize2,
  Music2,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Subtitles,
  Users,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { MvAudio } from './mv/audio';
import { getAtlasImage, getSpriteRect } from './mv/core';
import { MvEngine } from './mv/engine';
import { type ExportController, downloadStillPng, startVideoExport } from './mv/exporter';
import { getLineWords } from './mv/lyrics3d';
import {
  CAST,
  CHAPTERS,
  type CastMember,
  type ChapterId,
  DURATION,
  LYRICS,
  SHOTS,
  STYLE_LABEL,
  SUBTITLE,
  TITLE,
  fmtTime,
  lineAt,
  shotAt,
} from './mv/timeline';

/** 直接从分支 cast_atlas.png 绘制锐利像素角色头像（绝不重绘改画风） */
function PixelAvatar({ sprite, size = 64, ready }: { sprite: string; size?: number; ready: boolean }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    if (!ready || !ref.current) return;
    const img = getAtlasImage();
    if (!img) return;
    const [sx, sy, sw, sh] = getSpriteRect(sprite);
    const cv = ref.current;
    cv.width = size;
    cv.height = size;
    const g = cv.getContext('2d');
    if (!g) return;
    g.clearRect(0, 0, size, size);
    g.imageSmoothingEnabled = false;
    const scale = Math.min((size - 6) / sw, (size - 6) / sh);
    const dw = Math.round(sw * scale);
    const dh = Math.round(sh * scale);
    const dx = Math.round((size - dw) / 2);
    const dy = Math.round(size - dh - 2);
    g.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
  }, [sprite, size, ready]);

  return <canvas ref={ref} width={size} height={size} className="pixelated shrink-0" style={{ width: size, height: size }} />;
}

const CAST_NAME: Record<string, string> = Object.fromEntries(
  CAST.map((c) => [c.id, c.name.split('（')[0]]),
);

type TabKey = 'lyrics' | 'shots' | 'cast';

export function App() {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<MvEngine | null>(null);
  const audioRef = useRef<MvAudio | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const exportCtrlRef = useRef<ExportController | null>(null);

  const initialQueryT = useMemo(() => {
    const p = new URLSearchParams(window.location.search);
    const raw = p.get('t');
    if (raw === null) return null;
    const v = Number(raw);
    return Number.isFinite(v) ? Math.max(0, Math.min(DURATION, v)) : null;
  }, []);

  const [loadPct, setLoadPct] = useState(0);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(initialQueryT !== null);
  const [time, setTime] = useState(initialQueryT ?? 1.15);
  const [volume, setVolume] = useState(0.9);
  const [muted, setMuted] = useState(false);
  const [showLyrics, setShowLyrics] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVis, setControlsVis] = useState(true);
  const [hoverTime, setHoverTime] = useState<number | null>(null);

  const [tab, setTab] = useState<TabKey>('lyrics');
  const [shotFilter, setShotFilter] = useState<ChapterId | 'all'>('all');

  // 视频导出弹窗状态
  const [exportOpen, setExportOpen] = useState(false);
  const [exportPreset, setExportPreset] = useState<'full' | 'verse2' | 'chorus2' | 'clip30'>('full');
  const [exportWidth, setExportWidth] = useState<1280 | 1920>(1280);
  const [exportLyrics, setExportLyrics] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [exportProg, setExportProg] = useState(0);
  const [exportStatus, setExportStatus] = useState('');
  const [exportResult, setExportResult] = useState<{ url: string; filename: string } | null>(null);

  const curShot = useMemo(() => shotAt(time), [time]);
  const curLineIdx = useMemo(() => lineAt(time), [time]);
  const curChapter = useMemo(() => {
    let cur = CHAPTERS[0];
    for (const ch of CHAPTERS) if (time >= ch.t - 0.05) cur = ch;
    return cur;
  }, [time]);

  // 初始化三维引擎、音轨与自动化逐帧录制钩子
  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;

    const engine = new MvEngine(canvas);
    const audio = new MvAudio();
    engineRef.current = engine;
    audioRef.current = audio;

    const syncSize = () => {
      if (!stageRef.current || !engineRef.current || exporting) return;
      const rect = stageRef.current.getBoundingClientRect();
      if (rect.width > 10 && rect.height > 10) {
        engineRef.current.resize(rect.width, rect.height);
        if (engineRef.current.ready && !audioRef.current?.playing) {
          engineRef.current.renderAt(audioRef.current?.currentTime || initialQueryT || 1.15);
        }
      }
    };

    const ro = new ResizeObserver(syncSize);
    ro.observe(stage);

    let rafId = 0;
    let lastUiSync = 0;

    engine.init((p) => setLoadPct(p)).then(() => {
      if (engine.disposed) return;
      syncSize();
      const startT = initialQueryT ?? 1.15;
      audio.seek(startT);
      engine.renderAt(startT);
      setTime(startT);
      setReady(true);

      // 注册兼容 shoot_opus_mv.mjs 与 shoot_vite_mv.mjs 的标准确定性钩子
      const seekFn = (t: number) => {
        audio.pause();
        const ct = Math.max(0, Math.min(DURATION, Number(t) || 0));
        audio.seek(ct);
        engine.renderAt(ct);
        setHasStarted(true);
        setPlaying(false);
        setTime(ct);
      };

      window.__seek = seekFn;
      window.__mvRender = (t: number, noLyrics = false) => {
        audio.pause();
        return engine.captureFrame(Number(t) || 0, !!noLyrics);
      };
      window.__mv = {
        ready: () => engine.ready,
        seek: seekFn,
        play: async () => {
          setHasStarted(true);
          await audio.play();
          setPlaying(true);
        },
        pause: () => {
          audio.pause();
          setPlaying(false);
        },
        duration: () => DURATION,
        time: () => audio.currentTime,
        setLyrics: (vis: boolean) => {
          engine.setLyricsVisible(vis);
          setShowLyrics(vis);
          engine.renderAt(audio.currentTime);
        },
        render: (t: number, clean = false, width?: number) => {
          audio.pause();
          return engine.captureFrame(Number(t) || 0, clean, width);
        },
        shots: () => SHOTS.map(({ index, a, b, scene, v, label }) => ({ index, a, b, scene, v, label })),
      };

      const loop = (now: number) => {
        if (engine.disposed) return;
        if (audio.playing) {
          const ct = audio.currentTime;
          engine.renderAt(ct);
          if (now - lastUiSync > 55) {
            lastUiSync = now;
            setTime(ct);
          }
          if (ct >= DURATION - 0.05) {
            audio.pause();
            setPlaying(false);
            setControlsVis(true);
          }
        }
        rafId = requestAnimationFrame(loop);
      };
      rafId = requestAnimationFrame(loop);
    });

    const onEnded = () => {
      setPlaying(false);
      setControlsVis(true);
    };
    audio.el.addEventListener('ended', onEnded);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      audio.el.removeEventListener('ended', onEnded);
      audio.dispose();
      engine.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bumpControls = useCallback(() => {
    setControlsVis(true);
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    if (audioRef.current?.playing) {
      hideTimerRef.current = window.setTimeout(() => setControlsVis(false), 2600);
    }
  }, []);

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    const engine = engineRef.current;
    if (!audio || !engine || !ready || exporting) return;
    if (audio.playing) {
      audio.pause();
      setPlaying(false);
      setControlsVis(true);
    } else {
      if (!hasStarted) {
        audio.seek(0);
        setTime(0);
        setHasStarted(true);
      }
      await audio.play();
      setPlaying(true);
      bumpControls();
    }
  }, [ready, exporting, hasStarted, bumpControls]);

  const jumpTo = useCallback(
    async (t: number, autoPlay = true) => {
      const audio = audioRef.current;
      const engine = engineRef.current;
      if (!audio || !engine || !ready || exporting) return;
      const ct = Math.max(0, Math.min(DURATION - 0.05, t));
      setHasStarted(true);
      audio.seek(ct);
      engine.renderAt(ct);
      setTime(ct);
      if (autoPlay) {
        await audio.play();
        setPlaying(true);
        bumpControls();
      }
    },
    [ready, exporting, bumpControls],
  );

  const toggleLyrics = useCallback(() => {
    const next = !showLyrics;
    setShowLyrics(next);
    if (engineRef.current) {
      engineRef.current.setLyricsVisible(next);
      if (!audioRef.current?.playing) engineRef.current.renderAt(time);
    }
  }, [showLyrics, time]);

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    setMuted(audioRef.current.toggleMute());
  }, []);

  const onVolumeInput = useCallback((v: number) => {
    setVolume(v);
    if (audioRef.current) {
      audioRef.current.setVolume(v);
      setMuted(v === 0);
    }
  }, []);

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
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  // 键盘快捷键：Space 播放/暂停，←/→ 快退快进 5s，M 静音，C 三维字幕，F 全屏
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (exportOpen || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
      else if (e.code === 'ArrowRight' || e.code === 'KeyL') { e.preventDefault(); jumpTo((audioRef.current?.currentTime ?? time) + 5, playing); }
      else if (e.code === 'ArrowLeft' || e.code === 'KeyJ') { e.preventDefault(); jumpTo((audioRef.current?.currentTime ?? time) - 5, playing); }
      else if (e.code === 'KeyM') toggleMute();
      else if (e.code === 'KeyC') toggleLyrics();
      else if (e.code === 'KeyF') toggleFullscreen();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [exportOpen, togglePlay, jumpTo, time, playing, toggleMute, toggleLyrics, toggleFullscreen]);

  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    jumpTo(ratio * DURATION, playing || !hasStarted);
  };

  const handleHoverScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverTime(ratio * DURATION);
  };

  const runExport = async () => {
    const engine = engineRef.current;
    const audio = audioRef.current;
    if (!engine || !audio || exporting) return;
    if (exportResult) {
      URL.revokeObjectURL(exportResult.url);
      setExportResult(null);
    }

    let from = 0, to = DURATION;
    if (exportPreset === 'verse2') { from = 54.0; to = 86.6; }
    else if (exportPreset === 'chorus2') { from = 120.4; to = 156.5; }
    else if (exportPreset === 'clip30') {
      from = Math.min(DURATION - 10, Math.max(0, time));
      to = Math.min(DURATION, from + 30);
    }

    setExporting(true);
    setPlaying(false);
    setExportProg(0);
    setExportStatus('正在准备高清画布与音轨...');

    const ctrl = startVideoExport(engine, audio, {
      from,
      to,
      width: exportWidth,
      includeLyrics: exportLyrics,
      onProgress: (p, _el, label) => {
        setExportProg(p);
        setExportStatus(label);
      },
    });
    exportCtrlRef.current = ctrl;

    try {
      const res = await ctrl.promise;
      if (res) {
        setExportResult({ url: res.url, filename: res.filename });
        setExportStatus('录制完成，可立即下载视频文件');
      } else {
        setExportStatus('已取消录制');
      }
    } catch (err) {
      setExportStatus(`导出失败：${err instanceof Error ? err.message : '浏览器不支持录制'}`);
    } finally {
      setExporting(false);
      exportCtrlRef.current = null;
    }
  };

  const filteredShots = useMemo(
    () => (shotFilter === 'all' ? SHOTS : SHOTS.filter((s) => s.ch === shotFilter)),
    [shotFilter],
  );

  const parsedLyrics = useMemo(
    () => LYRICS.map((l) => ({ line: l, words: getLineWords(l) })),
    [],
  );

  const hoverShot = hoverTime !== null ? shotAt(hoverTime) : null;

  return (
    <div className="min-h-screen bg-[#0b0910] text-[#f5efe8]">
      {/* 顶部极简题头 */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#f9a8d4]/30 to-[#fda4af]/10 text-[#f9a8d4] ring-1 ring-[#f9a8d4]/30">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <h1 className="text-base font-semibold tracking-wide text-[#fff5f8] sm:text-lg">
              《{TITLE}》
            </h1>
            <p className="text-xs text-[#b8a9be]">{SUBTITLE}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => engineRef.current && downloadStillPng(engineRef.current, time, showLyrics)}
            disabled={!ready || exporting}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/6 px-3 py-1.5 text-xs text-[#e8dce8] ring-1 ring-white/10 transition hover:bg-white/12 disabled:opacity-40"
            title="下载当前画面 1080p 剧照"
          >
            <Camera className="h-3.5 w-3.5 text-[#f9a8d4]" />
            <span className="hidden sm:inline">剧照</span>
          </button>
          <button
            onClick={() => setExportOpen(true)}
            disabled={!ready}
            className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#f472b6]/85 to-[#fb7185]/85 px-3.5 py-1.5 text-xs font-medium text-white shadow-lg shadow-[#f472b6]/20 transition hover:from-[#f472b6] hover:to-[#fb7185] disabled:opacity-40"
          >
            <Download className="h-3.5 w-3.5" />
            <span>导出视频</span>
          </button>
        </div>
      </header>

      {/* 全幅 16:9 剧场舞台（画面本体零水印、零常驻角标） */}
      <section className="mx-auto max-w-6xl px-0 sm:px-6">
        <div
          ref={stageRef}
          onMouseMove={bumpControls}
          onMouseLeave={() => playing && setControlsVis(false)}
          className="group relative aspect-video w-full overflow-hidden bg-black shadow-2xl shadow-black/70 sm:rounded-2xl sm:ring-1 sm:ring-white/12"
        >
          <canvas
            ref={canvasRef}
            onClick={togglePlay}
            className="block h-full w-full cursor-pointer"
          />

          {/* 载入进度层 */}
          {!ready && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0d0a14]/92 backdrop-blur-sm">
              <div className="mb-3 text-sm tracking-widest text-[#f9a8d4]">
                正在载入角色图集与三维分镜 · {Math.round(loadPct * 100)}%
              </div>
              <div className="h-1 w-52 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#f9a8d4] via-[#fda4af] to-[#fde68a] transition-all duration-200"
                  style={{ width: `${Math.round(loadPct * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* 首屏轻透播放入口（点击立即从 0:00 同步播放原曲与三维分镜） */}
          {ready && !playing && !hasStarted && !exporting && (
            <button
              onClick={togglePlay}
              aria-label="播放 MV"
              className="mv-ui absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-black/55 via-transparent to-transparent transition hover:bg-black/20"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#fff5f8]/90 text-[#1d1126] shadow-2xl shadow-[#f472b6]/40 ring-4 ring-[#f9a8d4]/35 transition-transform duration-200 hover:scale-105 sm:h-20 sm:w-20">
                <Play className="ml-1 h-7 w-7 fill-current sm:h-8 sm:w-8" />
              </span>
              <span className="mt-3 rounded-full bg-black/50 px-4 py-1 text-xs tracking-widest text-[#fce7f3] backdrop-blur-md ring-1 ring-white/15">
                点击播放完整 MV · 02:55
              </span>
            </button>
          )}

          {/* 底部自动隐匿剧场控制条 */}
          {ready && !exporting && (
            <div
              className={`mv-ui absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-3 pb-2.5 pt-8 transition-opacity duration-300 sm:px-5 sm:pb-3.5 ${
                controlsVis || !playing ? 'opacity-100' : 'pointer-events-none opacity-0'
              }`}
            >
              {/* 可拖拽进度条（含悬浮镜头预览提示） */}
              <div
                onClick={handleScrub}
                onMouseMove={handleHoverScrub}
                onMouseLeave={() => setHoverTime(null)}
                className="relative mb-2.5 flex h-4 cursor-pointer items-center"
              >
                {hoverTime !== null && hoverShot && (
                  <div
                    className="pointer-events-none absolute -top-8 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#161122]/95 px-2.5 py-1 text-[11px] text-[#fce7f3] shadow-lg ring-1 ring-white/15"
                    style={{ left: `${Math.min(92, Math.max(8, (hoverTime / DURATION) * 100))}%` }}
                  >
                    {fmtTime(hoverTime)} · #{String(hoverShot.index + 1).padStart(2, '0')} {hoverShot.label}
                  </div>
                )}
                <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/20 transition-all hover:h-2">
                  {/* 篇章刻度 */}
                  {CHAPTERS.slice(1).map((ch) => (
                    <span
                      key={ch.id}
                      className="absolute top-0 bottom-0 w-px bg-black/65"
                      style={{ left: `${(ch.t / DURATION) * 100}%` }}
                    />
                  ))}
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#f9a8d4] via-[#fb7185] to-[#fde68a]"
                    style={{ width: `${(time / DURATION) * 100}%` }}
                  />
                </div>
              </div>

              {/* 播放按钮组 */}
              <div className="flex items-center justify-between gap-2 text-xs text-[#f5efe8]">
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    onClick={togglePlay}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/14 text-white transition hover:bg-white/25"
                    title={playing ? '暂停 (Space)' : '播放 (Space)'}
                  >
                    {playing ? <Pause className="h-4 w-4 fill-current" /> : <Play className="ml-0.5 h-4 w-4 fill-current" />}
                  </button>
                  <button
                    onClick={() => jumpTo(0, true)}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-white/75 transition hover:bg-white/12 hover:text-white"
                    title="从头播放"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                  <span className="font-mono text-[11px] tabular-nums text-white/90 sm:text-xs">
                    {fmtTime(time)} <span className="text-white/45">/ {fmtTime(DURATION)}</span>
                  </span>
                  <span className="hidden items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] text-[#fce7f3] md:inline-flex">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: curChapter.color }} />
                    #{String(curShot.index + 1).padStart(2, '0')} {curShot.label}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2.5">
                  {/* 音量 */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={toggleMute}
                      className="flex h-7 w-7 items-center justify-center rounded-full text-white/80 transition hover:bg-white/12 hover:text-white"
                      title="静音 (M)"
                    >
                      {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.02}
                      value={muted ? 0 : volume}
                      onChange={(e) => onVolumeInput(Number(e.target.value))}
                      aria-label="音量"
                      className="hidden h-1 w-16 cursor-pointer accent-[#f9a8d4] sm:block"
                    />
                  </div>

                  {/* 三维逐字逐词歌词开关 */}
                  <button
                    onClick={toggleLyrics}
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] transition ${
                      showLyrics
                        ? 'bg-[#f9a8d4]/25 text-[#fce7f3] ring-1 ring-[#f9a8d4]/45'
                        : 'bg-white/8 text-white/55 hover:text-white/85'
                    }`}
                    title="开关三维逐字歌词 (C)"
                  >
                    <Subtitles className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">词卡</span>
                  </button>

                  {/* 全屏 */}
                  <button
                    onClick={toggleFullscreen}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-white/80 transition hover:bg-white/12 hover:text-white"
                    title="全屏 (F)"
                  >
                    {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 实时分镜说明条 + 八大篇章跳转 */}
      <section className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
        <div className="flex flex-col gap-3 rounded-2xl bg-white/[0.035] p-3.5 ring-1 ring-white/8 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span
                className="rounded-full px-2.5 py-0.5 font-medium text-[#120d1a]"
                style={{ backgroundColor: curChapter.color }}
              >
                {curChapter.name}
              </span>
              <span className="font-mono text-[#f9a8d4]">
                镜头 #{String(curShot.index + 1).padStart(2, '0')} / {SHOTS.length}
              </span>
              <span className="font-medium text-white">{curShot.label}</span>
              <span className="text-[#a899b2]">
                登场：{curShot.cast.map((id) => CAST_NAME[id]).join(' · ')}
              </span>
            </div>
            <p className="mt-1.5 truncate text-xs text-[#cbbdd4] sm:text-[13px]">{curShot.detail}</p>
          </div>

          {curLineIdx >= 0 && (
            <div className="shrink-0 rounded-xl bg-white/[0.04] px-3 py-1.5 text-right ring-1 ring-white/8">
              <div className="text-[10px] text-[#b4a3be]">
                词意动态 · {STYLE_LABEL[LYRICS[curLineIdx].style]}
              </div>
              <div className="mt-0.5 flex flex-wrap justify-end gap-1 text-xs">
                {parsedLyrics[curLineIdx].words.map((w, wi) => {
                  const active = time >= w.t0 - 0.04 && time <= w.t1 + 0.08;
                  return (
                    <span
                      key={wi}
                      className={`rounded px-1 py-0.5 transition ${
                        active
                          ? 'bg-[#f9a8d4]/30 font-semibold text-white'
                          : w.key
                            ? 'text-[#fbcfe8]'
                            : 'text-[#b8a9be]'
                      }`}
                    >
                      {w.text}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 篇章直达按钮 */}
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
          {CHAPTERS.map((ch) => {
            const active = curChapter.id === ch.id;
            return (
              <button
                key={ch.id}
                onClick={() => jumpTo(ch.t, true)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs transition ${
                  active
                    ? 'bg-white/14 font-medium text-white ring-1 ring-[#f9a8d4]/50'
                    : 'bg-white/[0.03] text-[#b5a6bd] hover:bg-white/[0.08] hover:text-white'
                }`}
              >
                <span
                  className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle"
                  style={{ backgroundColor: ch.color }}
                />
                {ch.name}
                <span className="ml-1.5 font-mono text-[10px] opacity-60">{fmtTime(ch.t)}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 影片下方三栏内容：逐词歌词 / 65镜分镜脚本 / 分支八位登场人物 */}
      <main className="mx-auto max-w-6xl px-4 pt-6 pb-16 sm:px-6">
        <div className="mb-5 flex items-center gap-2 border-b border-white/10 pb-3">
          {(
            [
              ['lyrics', '逐字逐词歌词', Music2, `${LYRICS.length} 句`],
              ['shots', '分镜设计总览', Clapperboard, `${SHOTS.length} 镜`],
              ['cast', '登场人物设定', Users, `${CAST.length} 位`],
            ] as const
          ).map(([key, label, Icon, badge]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition sm:text-sm ${
                tab === key
                  ? 'bg-[#f9a8d4]/20 text-[#fff0f6] ring-1 ring-[#f9a8d4]/45'
                  : 'text-[#afa0b8] hover:bg-white/6 hover:text-white'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{label}</span>
              <span className="rounded-full bg-white/8 px-1.5 py-0.5 text-[10px] opacity-80">{badge}</span>
            </button>
          ))}
        </div>

        {/* 1. 逐字逐词语义歌词 */}
        {tab === 'lyrics' && (
          <div className="grid gap-2 sm:grid-cols-2">
            {parsedLyrics.map(({ line, words }) => {
              const isCur = curLineIdx === line.idx;
              return (
                <button
                  key={line.idx}
                  onClick={() => jumpTo(line.t[0], true)}
                  className={`flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5 text-left transition ${
                    isCur
                      ? 'bg-gradient-to-r from-[#f9a8d4]/20 to-[#fde68a]/10 ring-1 ring-[#f9a8d4]/50'
                      : 'bg-white/[0.025] ring-1 ring-white/6 hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex min-w-0 items-baseline gap-2.5">
                    <span className="shrink-0 font-mono text-[11px] tabular-nums text-[#9d8ea8]">
                      {fmtTime(line.t[0])}
                    </span>
                    <div className="flex flex-wrap items-center gap-1 text-sm">
                      {words.map((w, wi) => {
                        const wActive = isCur && time >= w.t0 - 0.04 && time <= w.t1 + 0.06;
                        return (
                          <span
                            key={wi}
                            className={`rounded px-1 py-0.5 transition ${
                              wActive
                                ? 'bg-[#f472b6]/40 font-semibold text-white shadow-sm'
                                : w.key
                                  ? 'font-medium text-[#fce7f3] underline decoration-[#f9a8d4]/45 decoration-dotted underline-offset-4'
                                  : 'text-[#d6c8de]'
                            }`}
                          >
                            {w.text}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-white/6 px-2 py-0.5 text-[10px] text-[#bfaeca]">
                    {STYLE_LABEL[line.style]}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* 2. 65 镜分镜细节总览 */}
        {tab === 'shots' && (
          <div>
            <div className="mb-4 flex flex-wrap gap-1.5">
              <button
                onClick={() => setShotFilter('all')}
                className={`rounded-full px-3 py-1 text-xs transition ${
                  shotFilter === 'all'
                    ? 'bg-[#f9a8d4] font-medium text-[#160d1f]'
                    : 'bg-white/6 text-[#b8a9be] hover:bg-white/12'
                }`}
              >
                全部（{SHOTS.length}）
              </button>
              {CHAPTERS.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => setShotFilter(ch.id)}
                  className={`rounded-full px-3 py-1 text-xs transition ${
                    shotFilter === ch.id
                      ? 'bg-[#f9a8d4] font-medium text-[#160d1f]'
                      : 'bg-white/6 text-[#b8a9be] hover:bg-white/12'
                  }`}
                >
                  {ch.name}
                </button>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredShots.map((s) => {
                const active = curShot.index === s.index;
                const lyr = s.line !== undefined ? LYRICS[s.line] : null;
                return (
                  <button
                    key={s.index}
                    onClick={() => jumpTo(s.a + 0.06, true)}
                    className={`flex flex-col justify-between rounded-xl p-3.5 text-left transition ${
                      active
                        ? 'bg-[#f9a8d4]/16 ring-1 ring-[#f9a8d4]/60'
                        : 'bg-white/[0.03] ring-1 ring-white/8 hover:bg-white/[0.065]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono font-semibold text-[#f9a8d4]">
                          #{String(s.index + 1).padStart(2, '0')} · {s.label}
                        </span>
                        <span className="font-mono tabular-nums text-[#9d8ea8]">
                          {fmtTime(s.a)}–{fmtTime(s.b)}
                        </span>
                      </div>
                      {lyr && (
                        <div className="mt-1.5 truncate text-xs font-medium text-[#fff0f6]">
                          「{lyr.text}」
                        </div>
                      )}
                      <p className="mt-1.5 text-xs leading-relaxed text-[#c2b3cb]">{s.detail}</p>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1">
                      {s.cast.map((cid) => (
                        <span
                          key={cid}
                          className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] text-[#e6d8ec]"
                        >
                          {CAST_NAME[cid]}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. 分支八位登场人物设定卡 */}
        {tab === 'cast' && (
          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {CAST.map((m: CastMember) => (
              <div
                key={m.id}
                className="flex flex-col justify-between rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/8 transition hover:bg-white/[0.055]"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-16 w-16 items-center justify-center rounded-xl bg-black/40 ring-1 ring-white/10"
                      style={{ boxShadow: `inset 0 0 22px ${m.accent}22` }}
                    >
                      <PixelAvatar sprite={m.sprite} size={58} ready={ready} />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-white">{m.name}</div>
                      <div
                        className="mt-0.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium text-[#120c1a]"
                        style={{ backgroundColor: m.accent }}
                      >
                        {m.role}
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-[#cfc1d8]">{m.habit}</p>
                  <p className="mt-2 text-[11px] leading-relaxed text-[#9f90ab]">
                    登场：{m.spotlight}
                  </p>
                </div>

                <button
                  onClick={() => jumpTo(m.jumpTime, true)}
                  className="mt-3.5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-white/8 py-1.5 text-xs text-[#fce7f3] transition hover:bg-[#f9a8d4]/25"
                >
                  <Film className="h-3.5 w-3.5 text-[#f9a8d4]" />
                  <span>观看代表镜头（{fmtTime(m.jumpTime)}）</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 视频与高清剧照导出弹窗 */}
      {exportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#161120] p-5 text-[#f5efe8] shadow-2xl ring-1 ring-white/15">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">导出《{TITLE}》视频</h2>
              <button
                onClick={() => {
                  if (exporting) exportCtrlRef.current?.cancel();
                  setExportOpen(false);
                }}
                className="rounded-full p-1 text-white/60 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs">
              <div>
                <div className="mb-1.5 text-[#b8a9be]">录制范围（同步混入原曲音轨）</div>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      ['full', '完整全曲 (02:55)'],
                      ['verse2', '剑影沧桑段 (32s)'],
                      ['chorus2', '升调高潮段 (36s)'],
                      ['clip30', '当前起 30 秒片段'],
                    ] as const
                  ).map(([id, name]) => (
                    <button
                      key={id}
                      disabled={exporting}
                      onClick={() => setExportPreset(id)}
                      className={`rounded-xl px-3 py-2 text-left transition ${
                        exportPreset === id
                          ? 'bg-[#f9a8d4]/25 font-medium text-white ring-1 ring-[#f9a8d4]/60'
                          : 'bg-white/5 text-[#c6b7cf] hover:bg-white/10'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="mb-1.5 text-[#b8a9be]">输出分辨率</div>
                  <div className="inline-flex rounded-xl bg-white/5 p-1">
                    {([1280, 1920] as const).map((w) => (
                      <button
                        key={w}
                        disabled={exporting}
                        onClick={() => setExportWidth(w)}
                        className={`rounded-lg px-3 py-1 transition ${
                          exportWidth === w ? 'bg-[#f9a8d4] font-medium text-[#160d1f]' : 'text-[#c6b7cf]'
                        }`}
                      >
                        {w === 1920 ? '1080p' : '720p'}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="flex cursor-pointer items-center gap-2 pt-4 text-[#e5d8ec]">
                  <input
                    type="checkbox"
                    checked={exportLyrics}
                    disabled={exporting}
                    onChange={(e) => setExportLyrics(e.target.checked)}
                    className="accent-[#f9a8d4]"
                  />
                  <span>包含逐字逐词歌词</span>
                </label>
              </div>

              {(exporting || exportStatus) && (
                <div className="rounded-xl bg-black/35 p-3 ring-1 ring-white/8">
                  <div className="flex items-center justify-between text-[11px] text-[#e8dce8]">
                    <span>{exportStatus}</span>
                    {exporting && <span className="font-mono">{Math.round(exportProg * 100)}%</span>}
                  </div>
                  {exporting && (
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#f9a8d4] to-[#fde68a] transition-all"
                        style={{ width: `${Math.round(exportProg * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                {!exporting ? (
                  <button
                    onClick={runExport}
                    className="flex-1 rounded-xl bg-gradient-to-r from-[#f472b6] to-[#fb7185] py-2.5 font-medium text-white shadow-lg shadow-[#f472b6]/25 transition hover:brightness-110"
                  >
                    开始合成录制
                  </button>
                ) : (
                  <button
                    onClick={() => exportCtrlRef.current?.cancel()}
                    className="flex-1 rounded-xl bg-white/12 py-2.5 font-medium text-white transition hover:bg-white/20"
                  >
                    停止录制
                  </button>
                )}

                {exportResult && !exporting && (
                  <a
                    href={exportResult.url}
                    download={exportResult.filename}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#fde68a] px-4 py-2.5 font-medium text-[#1b1222] transition hover:brightness-105"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>保存文件</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
