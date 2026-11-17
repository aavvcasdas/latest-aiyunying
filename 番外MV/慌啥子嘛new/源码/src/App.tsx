import { useCallback, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { Download, Play, RotateCcw } from 'lucide-react';
import { type AtlasData, CAST_INFO, type CharId, loadAtlas } from './mv/actors';
import { AUDIO_FALLBACK_URL, AUDIO_URL, DURATION, FPS, activeCueAt } from './mv/cues';
import { MVEngine, type OverlayState } from './mv/engine';
import { FONT, loadFonts } from './mv/fonts';
import { ALL_SHOTS } from './mv/shots';
import { Controls, PixelAvatar } from './components/Controls';
import { exportMp4 } from './mv/exportMp4';
import { LyricBar } from './components/LyricBar';
import { TitleCard } from './components/TitleCard';
import { ExportDialog } from './components/ExportDialog';

declare global {
  interface Window {
    __seek?: (t: number) => void;
    __mv?: {
      ready: () => boolean;
      seek: (t: number) => void;
      duration: number;
      fps: number;
    };
  }
}

const PREVIEW_TIME = 18.25; // 开播前静态展示帧：坝坝茶院与「慌啥子嘛 慢慢来」3D 立体字块

export function App() {
  const isClean =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).has('clean');

  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const engineRef = useRef<MVEngine | null>(null);
  const hideTimerRef = useRef<number | null>(null);

  const [atlas, setAtlas] = useState<AtlasData | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [started, setStarted] = useState(isClean);
  const [ended, setEnded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [showWords3D, setShowWords3D] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hudVisible, setHudVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const [stageSize, setStageSize] = useState({ w: 1280, h: 720 });
  const [currentTime, setCurrentTime] = useState(isClean ? 0 : PREVIEW_TIME);
  const [overlay, setOverlay] = useState<OverlayState | null>(null);

  const renderAt = useCallback((t: number) => {
    const eng = engineRef.current;
    if (!eng) return;
    const clamped = Math.max(0, Math.min(DURATION, t));
    const ov = eng.render(clamped);
    setCurrentTime(clamped);
    setOverlay(ov);
  }, []);

  // 1. 严格预载模板字体 + 八位像素角色图集
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [, loadedAtlas] = await Promise.all([loadFonts(), loadAtlas()]);
        if (cancelled) return;
        setAtlas(loadedAtlas);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 2. 初始化 3D MV 引擎与自适应 16:9 舞台尺寸 + __seek 逐帧导出钩子
  useEffect(() => {
    if (!atlas || !canvasRef.current || !stageRef.current) return;

    const eng = new MVEngine(canvasRef.current, atlas, ALL_SHOTS);
    engineRef.current = eng;

    const fitStage = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      let w = vw;
      let h = (vw * 9) / 16;
      if (h > vh) {
        h = vh;
        w = (vh * 16) / 9;
      }
      w = Math.max(320, Math.floor(w));
      h = Math.max(180, Math.floor(h));
      setStageSize({ w, h });
      eng.resize(w, h, window.devicePixelRatio || 1);
      const a = audioRef.current;
      const tNow = a && startedRef.current ? a.currentTime : isClean ? 0 : PREVIEW_TIME;
      const ov = eng.render(Math.max(0, Math.min(DURATION, tNow)));
      setOverlay(ov);
    };

    fitStage();
    setReady(true);

    // 兼容目标分支 tools/shoot_vite_mv.mjs 的确定性跳帧接口
    const seekForCapture = (t: number) => {
      const a = audioRef.current;
      if (a && !a.paused) a.pause();
      const clamped = Math.max(0, Math.min(DURATION, Number(t) || 0));
      const ov = eng.render(clamped);
      flushSync(() => {
        setStarted(true);
        setEnded(false);
        setPlaying(false);
        setHudVisible(false);
        setDrawerOpen(false);
        setCurrentTime(clamped);
        setOverlay(ov);
      });
    };

    window.__seek = seekForCapture;
    // 自检钩子：渲染小样验证 MP4 编码管线（不影响正常导出按钮）
    (window as unknown as { __export?: unknown }).__export = async (opt?: {
      seconds?: number;
      width?: number;
      height?: number;
    }) => {
      const res = await exportMp4({
        atlas,
        width: opt?.width ?? 640,
        height: opt?.height ?? 360,
        durationSec: opt?.seconds ?? 6,
      });
      return { bytes: res.blob.size, frames: res.videoFrames, audio: res.audio, type: res.blob.type };
    };
    window.__mv = {
      ready: () => true,
      seek: seekForCapture,
      duration: DURATION,
      fps: FPS,
    };

    window.addEventListener('resize', fitStage);
    return () => {
      window.removeEventListener('resize', fitStage);
      delete window.__seek;
      delete window.__mv;
      eng.dispose();
      engineRef.current = null;
    };
  }, [atlas, isClean]);

  const startedRef = useRef(started);
  startedRef.current = started;

  // 3. 播放时以音轨采样时钟 currentTime 驱动 60fps 零漂移渲染
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const loop = () => {
      const a = audioRef.current;
      if (a) {
        renderAt(a.currentTime);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing, renderAt]);

  // 4. 播放时鼠标静止 2.2 秒自动隐藏控制栏，保持纯净零遮挡 MV 画面
  const bumpHud = useCallback(() => {
    if (isClean) return;
    setHudVisible(true);
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => {
      if (audioRef.current && !audioRef.current.paused) {
        setHudVisible(false);
      }
    }, 2200);
  }, [isClean]);

  const startFromBeginning = useCallback(async () => {
    const a = audioRef.current;
    if (!a) return;
    setStarted(true);
    setEnded(false);
    a.currentTime = 0;
    renderAt(0);
    try {
      await a.play();
      setPlaying(true);
      bumpHud();
    } catch {
      setPlaying(false);
    }
  }, [bumpHud, renderAt]);

  const togglePlay = useCallback(async () => {
    const a = audioRef.current;
    if (!a) return;
    if (!started) {
      await startFromBeginning();
      return;
    }
    if (ended || a.currentTime >= DURATION - 0.15) {
      await startFromBeginning();
      return;
    }
    if (a.paused) {
      try {
        await a.play();
        setPlaying(true);
        bumpHud();
      } catch {
        setPlaying(false);
      }
    } else {
      a.pause();
      setPlaying(false);
      setHudVisible(true);
    }
  }, [started, ended, startFromBeginning, bumpHud]);

  const seekTo = useCallback(
    (t: number) => {
      const clamped = Math.max(0, Math.min(DURATION, t));
      const a = audioRef.current;
      if (!started) setStarted(true);
      setEnded(false);
      if (a) a.currentTime = clamped;
      renderAt(clamped);
      bumpHud();
    },
    [started, renderAt, bumpHud]
  );

  const toggleMute = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    const next = !muted;
    a.muted = next;
    setMuted(next);
    bumpHud();
  }, [muted, bumpHud]);

  const toggleWords3D = useCallback(() => {
    const next = !showWords3D;
    setShowWords3D(next);
    if (engineRef.current) {
      engineRef.current.showWords3D = next;
      const a = audioRef.current;
      renderAt(started && a ? a.currentTime : currentTime);
    }
    bumpHud();
  }, [showWords3D, started, currentTime, renderAt, bumpHud]);

  const toggleFullscreen = useCallback(() => {
    const el = rootRef.current;
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

  // 5. 键盘快捷键
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.code === 'Space' || e.code === 'KeyK') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        seekTo((audioRef.current?.currentTime ?? 0) + 3.7);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        seekTo((audioRef.current?.currentTime ?? 0) - 3.7);
      } else if (e.code === 'KeyM') {
        toggleMute();
      } else if (e.code === 'KeyF') {
        toggleFullscreen();
      } else if (e.code === 'KeyB') {
        setDrawerOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [togglePlay, seekTo, toggleMute, toggleFullscreen]);

  const S = stageSize.w / 1920;
  const activeCue = started ? activeCueAt(currentTime) : null;

  return (
    <div
      ref={rootRef}
      onMouseMove={bumpHud}
      onTouchStart={bumpHud}
      className="relative w-screen h-screen bg-[#09070f] flex items-center justify-center overflow-hidden"
      style={{ fontFamily: FONT }}
    >
      {/* 实测对齐音源（本地优先，目标分支原 MP3 自动回退） */}
      <audio
        ref={audioRef}
        src={AUDIO_URL}
        crossOrigin="anonymous"
        preload="auto"
        onError={(e) => {
          const el = e.currentTarget;
          if (!el.dataset.fallback) {
            el.dataset.fallback = '1';
            el.src = AUDIO_FALLBACK_URL;
            el.load();
          }
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => {
          setPlaying(false);
          if (!isClean) setHudVisible(true);
        }}
        onEnded={() => {
          setPlaying(false);
          setEnded(true);
          renderAt(DURATION);
          if (!isClean) setHudVisible(true);
        }}
      />

      {/* 16:9 纯净零水印立体绘本 MV 舞台 */}
      <div
        ref={stageRef}
        onClick={() => {
          if (started && !drawerOpen) togglePlay();
        }}
        className="relative overflow-hidden bg-[#120d1f] shadow-[0_0_80px_rgba(0,0,0,0.9)]"
        style={{ width: stageSize.w, height: stageSize.h, cursor: playing && !hudVisible ? 'none' : 'pointer' }}
      >
        <canvas ref={canvasRef} className="block w-full h-full" />

        {/* 序章片名卡 */}
        {started && overlay && (
          <TitleCard visible={overlay.showTitle} progress={overlay.titleProgress} S={S} />
        )}

        {/* 逐字逐词精准卡点绘本字幕条 */}
        {started && <LyricBar cue={activeCue} T={currentTime} S={S} />}

        {/* 闪白与渐黑转场叠层 */}
        {started && overlay && overlay.white > 0.005 && (
          <div
            className="pointer-events-none absolute inset-0 bg-[#fffaf0]"
            style={{ opacity: overlay.white }}
          />
        )}
        {started && overlay && overlay.black > 0.005 && (
          <div
            className="pointer-events-none absolute inset-0 bg-[#09070f]"
            style={{ opacity: overlay.black }}
          />
        )}
      </div>

      {/* 加载态 / 报错态 */}
      {!ready && !error && (
        <div className="fixed inset-0 z-50 bg-[#110c1d] flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-[#ffd166]/25 border-t-[#ffd166] animate-spin" />
          <div className="text-xl text-[#ffd86b] tracking-widest">正在翻开立体绘本…</div>
        </div>
      )}
      {error && (
        <div className="fixed inset-0 z-50 bg-[#140d1f] flex items-center justify-center p-6">
          <div className="max-w-md rounded-2xl border border-rose-400/50 bg-rose-950/50 p-6 text-center">
            <div className="text-lg text-rose-200">素材加载失败</div>
            <div className="mt-2 text-sm text-rose-100/80">{error}</div>
          </div>
        </div>
      )}

      {/* 开播前暖金绘本幕布（点击后立即消失，正片零角标零遮挡） */}
      {ready && !started && !isClean && atlas && (
        <div
          onClick={startFromBeginning}
          className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-gradient-to-t from-[#0f0a1c]/82 via-[#171029]/45 to-[#0f0a1c]/65 backdrop-blur-[2px] cursor-pointer px-4"
        >
          <div className="text-center max-w-xl">
            <div
              className="text-5xl sm:text-7xl text-[#fff8e7] tracking-[0.16em]"
              style={{
                textShadow:
                  '0 5px 0 #3b2116, 0 12px 34px rgba(0,0,0,0.65), 0 0 40px rgba(255,209,102,0.4)',
              }}
            >
              慌啥子嘛
            </div>
            <div className="mt-3 text-lg sm:text-2xl text-[#ffd86b] tracking-[0.28em]">
              慢慢来 · 立体绘本音乐短片
            </div>

            {/* 八位分支登场人物像素头像一字排开 */}
            <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-2 rounded-2xl bg-[#161029]/78 border border-[#ffd166]/35 px-4 py-2.5 shadow-xl">
              {(Object.keys(CAST_INFO) as CharId[]).map((cid) => (
                <div key={cid} className="flex flex-col items-center gap-1">
                  <PixelAvatar atlas={atlas} charId={cid} size={38} />
                  <span className="text-[11px] text-amber-100/85">{CAST_INFO[cid].name}</span>
                </div>
              ))}
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startFromBeginning();
                }}
                className="group inline-flex items-center gap-3 rounded-full bg-[#ffd166] hover:bg-[#ffe085] text-[#211536] px-8 py-3.5 text-xl shadow-[0_10px_35px_rgba(255,209,102,0.42)] hover:scale-105 active:scale-95 transition cursor-pointer"
              >
                <Play className="w-6 h-6 fill-current" />
                <span className="tracking-widest">翻开绘本播放</span>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setExportOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-full border border-[#ffd166]/55 bg-[#201735]/85 hover:bg-[#2e2149] text-[#ffe082] px-5 py-3 text-base shadow-xl hover:scale-105 active:scale-95 transition cursor-pointer"
                title="离线渲染并导出 MP4 成片"
              >
                <Download className="w-5 h-5" />
                <span className="tracking-wider">导出 MP4</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 播放完毕重播轻提示 */}
      {started && ended && !isClean && (
        <div className="fixed inset-0 z-30 flex items-center justify-center pointer-events-none">
          <button
            onClick={startFromBeginning}
            className="pointer-events-auto inline-flex items-center gap-2.5 rounded-full bg-[#ffd166]/95 hover:bg-[#ffe18c] text-[#1e1330] px-7 py-3 text-lg shadow-2xl hover:scale-105 active:scale-95 transition cursor-pointer"
          >
            <RotateCcw className="w-5 h-5" />
            <span className="tracking-widest">再听一遍</span>
          </button>
        </div>
      )}

      {/* MP4 导出面板 */}
      {!isClean && (
        <ExportDialog open={exportOpen} atlas={atlas} onClose={() => setExportOpen(false)} />
      )}

      {/* 自动隐去的剧场控制条 + 分镜抽屉 */}
      {ready && started && !isClean && atlas && overlay && (
        <Controls
          visible={hudVisible || !playing}
          playing={playing}
          muted={muted}
          currentTime={currentTime}
          shotIdx={overlay.shotIdx}
          shots={ALL_SHOTS}
          atlas={atlas}
          showWords3D={showWords3D}
          drawerOpen={drawerOpen}
          isFullscreen={isFullscreen}
          onTogglePlay={togglePlay}
          onRestart={startFromBeginning}
          onSeek={seekTo}
          onToggleMute={toggleMute}
          onToggleWords3D={toggleWords3D}
          onToggleDrawer={() => setDrawerOpen((v) => !v)}
          onToggleFullscreen={toggleFullscreen}
          onExport={() => setExportOpen(true)}
        />
      )}
    </div>
  );
}

export default App;
