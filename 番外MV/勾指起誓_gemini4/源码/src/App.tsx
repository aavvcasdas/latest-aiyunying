import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Film,
  ListMusic,
  Maximize2,
  Pause,
  Play,
  SlidersHorizontal,
  Sparkles,
  Subtitles,
  Users,
  Volume2,
  VolumeX,
  RotateCcw,
} from 'lucide-react';
import { loadAtlas, type AtlasData, type CharId } from './engine/actors';
import { FilmEngine } from './engine/engine';
import { loadFonts } from './engine/fonts';
import { beatAt, cueAt, FPS, shotIndexAt } from './engine/timeline';
import { LYRIC_LINES, LYRIC_TEXTS, type SectionName } from './mv/cues';
import { buildTimeline, sectionOfShot } from './mv/plan';
import { drawMvOverlay } from './mv/overlay';
import { ALL_SHOTS, CAST_LIST, SHOT_BY_ID } from './mv/shots';
import {
  exportMvToMp4,
  triggerDownload,
  type ExportProgress,
  type ExportQuality,
  type ExportResult,
} from './mv/mp4Exporter';
import { PixelPortrait } from './components/PixelPortrait';
import { ExportModal } from './components/ExportModal';

const AUDIO_URL = './assets/gouzhiqishi.mp3';
const PREVIEW_W = 1280;
const PREVIEW_H = 720;

const SECTION_COLORS: Record<SectionName, string> = {
  序章: '#f59e0b',
  主歌一: '#60a5fa',
  副歌一: '#f472b6',
  间奏一: '#34d399',
  主歌二: '#818cf8',
  副歌二: '#fb7185',
  桥段间奏: '#c084fc',
  终章副歌: '#fbbf24',
  尾声: '#94a3b8',
};

const PORTRAIT_OF: Record<CharId, string> = {
  whale: 'p_whale_neutral',
  claude: 'p_claude_neutral',
  gpt: 'p_gpt_neutral',
  doubao: 'p_doubao_neutral',
  kimi: 'p_kimi',
  gemini: 'p_gemini',
  qwen: 'p_qwen',
  zai: 'p_zai',
};

function fmtTime(sec: number): string {
  const s = Math.max(0, sec);
  const m = Math.floor(s / 60);
  const r = s - m * 60;
  return `${String(m).padStart(2, '0')}:${r < 10 ? '0' : ''}${r.toFixed(1)}`;
}

export function App() {
  const [atlas, setAtlas] = useState<AtlasData | null>(null);
  const [loadingMsg, setLoadingMsg] = useState('正在加载八位像素角色图集与站酷快乐体…');
  const [loadErr, setLoadErr] = useState<string | null>(null);

  // 播放与时间轴状态
  const [syncOffset, setSyncOffset] = useState(0);
  const [showOffsetPanel, setShowOffsetPanel] = useState(false);
  const [showLyrics, setShowLyrics] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.92);
  const [curTime, setCurTime] = useState(0);
  const [beatPulse, setBeatPulse] = useState(0);

  // 右侧面板 Tab 与分镜筛选
  const [activeTab, setActiveTab] = useState<'shots' | 'cast' | 'lyrics'>('shots');
  const [sectionFilter, setSectionFilter] = useState<SectionName | '全部'>('全部');

  // MP4 导出状态
  const [exportOpen, setExportOpen] = useState(false);
  const [exportQuality, setExportQuality] = useState<ExportQuality>('720p');
  const [exporting, setExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const [exportErr, setExportErr] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const timeline = useMemo(() => buildTimeline(syncOffset), [syncOffset]);

  // Canvas & 引擎 & 音频引用
  const stageWrapRef = useRef<HTMLDivElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const glCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<FilmEngine | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const rafRef = useRef<number>(0);
  const lastRenderedFrameRef = useRef<number>(-1);
  const activeShotCardRef = useRef<HTMLButtonElement | null>(null);

  // 当前分镜与歌词
  const activeShotIdx = shotIndexAt(timeline, curTime);
  const activeShotTime = timeline.shots[activeShotIdx];
  const activeShotDef = SHOT_BY_ID[activeShotTime.id];
  const activeCue = cueAt(timeline, curTime, 0, 0);
  const activeSection = sectionOfShot(activeShotTime.id);

  // 渲染指定帧到主画布
  const renderAtTime = useCallback(
    (tSec: number, force = false) => {
      const engine = engineRef.current;
      const glCanvas = glCanvasRef.current;
      const disp = displayCanvasRef.current;
      if (!engine || !glCanvas || !disp) return;
      const frame = Math.max(0, Math.min(timeline.frames - 1, Math.floor(tSec * FPS)));
      if (!force && frame === lastRenderedFrameRef.current) return;
      lastRenderedFrameRef.current = frame;

      engine.render(frame, timeline);
      const ctx = disp.getContext('2d');
      if (ctx) {
        ctx.drawImage(glCanvas, 0, 0, PREVIEW_W, PREVIEW_H);
        drawMvOverlay(ctx, PREVIEW_W, PREVIEW_H, frame, timeline, showLyrics);
      }
      const bt = beatAt(timeline, frame / FPS);
      setBeatPulse(bt.pulse);
    },
    [timeline, showLyrics],
  );

  // 启动加载：像素图集 + 字体 + 离屏 WebGL FilmEngine
  useEffect(() => {
    let dead = false;
    Promise.all([loadAtlas(), loadFonts()])
      .then(([loadedAtlas]) => {
        if (dead) return;
        setLoadingMsg('正在初始化 3D 立体童话书场景…');
        const glCv = document.createElement('canvas');
        glCv.width = PREVIEW_W;
        glCv.height = PREVIEW_H;
        glCanvasRef.current = glCv;
        engineRef.current = new FilmEngine(glCv, PREVIEW_W, PREVIEW_H, loadedAtlas, ALL_SHOTS);
        setAtlas(loadedAtlas);
      })
      .catch((e) => {
        if (!dead) setLoadErr(e instanceof Error ? e.message : String(e));
      });

    return () => {
      dead = true;
      cancelAnimationFrame(rafRef.current);
      engineRef.current?.dispose(true);
      engineRef.current = null;
    };
  }, []);

  // 出片用：另起一套 1920×1080 的离屏引擎（预览只有 720p），给时间就给一帧；
  // 合成方式与 mp4Exporter 里一致：three 画到 glCanvas → 2D 合成 + 歌词叠层。
  useEffect(() => {
    if (!atlas) return;
    const w = 1920, h = 1080;
    const gl = document.createElement('canvas'); gl.width = w; gl.height = h;
    const comp = document.createElement('canvas'); comp.width = w; comp.height = h;
    const cctx = comp.getContext('2d')!;
    const eng = new FilmEngine(gl, w, h, atlas, ALL_SHOTS);
    (window as unknown as { __mvRender: (t: number) => string }).__mvRender = (t: number) => {
      const frame = Math.max(0, Math.min(timeline.frames - 1, Math.floor(t * FPS)));
      eng.render(frame, timeline);
      cctx.drawImage(gl, 0, 0, w, h);
      drawMvOverlay(cctx, w, h, frame, timeline, true);
      return comp.toDataURL('image/jpeg', 0.95);
    };
    return () => {
      delete (window as unknown as { __mvRender?: (t: number) => string }).__mvRender;
      eng.dispose(true);
    };
  }, [atlas, timeline]);

  // 初始化完成或字幕/偏移变化时重绘当前帧
  useEffect(() => {
    if (!atlas) return;
    renderAtTime(curTime, true);
  }, [atlas, showLyrics, timeline, renderAtTime, curTime]);

  // 音量同步
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = muted ? 0 : volume;
  }, [volume, muted]);

  // 播放主循环（音频作为主时钟）
  useEffect(() => {
    if (!playing) {
      cancelAnimationFrame(rafRef.current);
      return;
    }
    const tick = () => {
      const a = audioRef.current;
      if (!a) return;
      const t = a.currentTime;
      setCurTime(t);
      renderAtTime(t, false);
      if (t >= timeline.duration - 0.04 || a.ended) {
        a.pause();
        setPlaying(false);
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, timeline, renderAtTime]);

  const seekTo = useCallback(
    (tSec: number, autoPlay?: boolean) => {
      const clamped = Math.max(0, Math.min(timeline.duration - 0.05, tSec));
      const a = audioRef.current;
      if (a) a.currentTime = clamped;
      setCurTime(clamped);
      renderAtTime(clamped, true);
      if (autoPlay && a) {
        a.play().then(() => setPlaying(true)).catch(() => {});
      }
    },
    [timeline, renderAtTime],
  );

  const togglePlay = useCallback(() => {
    const a = audioRef.current;
    if (!a || !atlas) return;
    if (playing) {
      a.pause();
      setPlaying(false);
    } else {
      if (a.currentTime >= timeline.duration - 0.25) {
        a.currentTime = 0;
        setCurTime(0);
      }
      a.play()
        .then(() => setPlaying(true))
        .catch(() => setPlaying(false));
    }
  }, [playing, atlas, timeline]);

  const stepShot = useCallback(
    (delta: number) => {
      const next = Math.max(0, Math.min(timeline.shots.length - 1, activeShotIdx + delta));
      seekTo(timeline.shots[next].a + 0.04);
    },
    [activeShotIdx, timeline, seekTo],
  );

  const toggleFullscreen = useCallback(() => {
    const el = stageWrapRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      el.requestFullscreen?.().catch(() => {});
    }
  }, []);

  // 键盘快捷键：Space 播放暂停，左右键切镜，F 全屏
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (exportOpen) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        stepShot(-1);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        stepShot(1);
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [exportOpen, togglePlay, stepShot, toggleFullscreen]);

  // 播放时自动滚动高亮分镜到视野内
  useEffect(() => {
    if (playing && activeTab === 'shots' && activeShotCardRef.current) {
      activeShotCardRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [activeShotIdx, playing, activeTab]);

  // 开始导出 MP4
  const handleStartExport = useCallback(async () => {
    if (!atlas || exporting) return;
    // 先暂停主预览播放以释放 GPU 资源
    const a = audioRef.current;
    if (a && !a.paused) {
      a.pause();
      setPlaying(false);
    }
    if (exportResult?.url) {
      URL.revokeObjectURL(exportResult.url);
    }
    setExportResult(null);
    setExportErr(null);
    setExporting(true);
    const ac = new AbortController();
    abortRef.current = ac;

    try {
      const res = await exportMvToMp4({
        atlas,
        timeline,
        audioUrl: AUDIO_URL,
        quality: exportQuality,
        showLyrics,
        signal: ac.signal,
        onProgress: setExportProgress,
      });
      setExportResult(res);
      triggerDownload(res.url, res.filename);
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        setExportErr('已取消导出。');
      } else {
        setExportErr(e instanceof Error ? e.message : String(e));
      }
    } finally {
      setExporting(false);
      abortRef.current = null;
    }
  }, [atlas, exporting, exportResult, timeline, exportQuality, showLyrics]);

  const handleCancelExport = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const filteredShots = useMemo(() => {
    return timeline.shots.filter((st) => sectionFilter === '全部' || sectionOfShot(st.id) === sectionFilter);
  }, [timeline, sectionFilter]);

  const sections: (SectionName | '全部')[] = ['全部', '序章', '主歌一', '副歌一', '间奏一', '主歌二', '副歌二', '桥段间奏', '终章副歌', '尾声'];

  return (
    <div className="min-h-screen bg-[#0e0c1a] text-slate-100 flex flex-col selection:bg-amber-400/30">
      <audio ref={audioRef} src={AUDIO_URL} preload="auto" />

      {/* 顶部影院栏 */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#120f22]/90 backdrop-blur-md">
        <div className="max-w-[1520px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-300/25 to-rose-400/20 border border-amber-300/40 flex items-center justify-center overflow-hidden shadow-inner">
              {atlas ? (
                <PixelPortrait atlas={atlas} cell="p_whale_neutral" size={34} />
              ) : (
                <Sparkles className="w-5 h-5 text-amber-300" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h1 className="text-lg sm:text-xl font-black tracking-wide text-amber-100 truncate font-display">
                  《勾指起誓》
                </h1>
                <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-400/15 text-amber-200 border border-amber-300/30">
                  鲸鱼娘立体童话书 MV
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                8 位像素角色 · 53 个歌词解读分镜 · 85.0 BPM 实测对齐 · 《童话镇》金色扫色字幕
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* 字幕开关 */}
            <button
              type="button"
              onClick={() => setShowLyrics((v) => !v)}
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition cursor-pointer ${
                showLyrics
                  ? 'border-amber-300/40 bg-amber-400/12 text-amber-200'
                  : 'border-white/10 bg-white/[0.03] text-slate-400 hover:text-white'
              }`}
              title="开关《童话镇》卡点字幕条"
            >
              <Subtitles className="w-4 h-4" />
              字幕{showLyrics ? '开' : '关'}
            </button>

            {/* 拍点微调 */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowOffsetPanel((v) => !v)}
                className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border transition cursor-pointer ${
                  syncOffset !== 0
                    ? 'border-sky-400/50 bg-sky-400/15 text-sky-200'
                    : 'border-white/10 bg-white/[0.03] text-slate-300 hover:text-white'
                }`}
                title="微调歌词与音轨整体偏移"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                卡点 {syncOffset >= 0 ? '+' : ''}{syncOffset.toFixed(2)}s
              </button>
              {showOffsetPanel && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-amber-300/30 bg-[#1a1530] p-4 shadow-2xl z-40">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-semibold text-amber-200">歌词卡点微调</span>
                    <button
                      type="button"
                      onClick={() => setSyncOffset(0)}
                      className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />重置
                    </button>
                  </div>
                  <input
                    type="range"
                    min={-0.6}
                    max={0.6}
                    step={0.02}
                    value={syncOffset}
                    onChange={(e) => setSyncOffset(parseFloat(e.target.value))}
                    className="w-full accent-amber-400"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 mt-1 font-mono">
                    <span>-0.60s</span>
                    <span className="text-amber-300 font-bold">{syncOffset.toFixed(2)}s</span>
                    <span>+0.60s</span>
                  </div>
                </div>
              )}
            </div>

            {/* 顶部主导出按钮 */}
            <button
              type="button"
              disabled={!atlas}
              onClick={() => setExportOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 disabled:opacity-45 text-[#1b132b] font-bold text-xs sm:text-sm shadow-[0_6px_22px_rgba(255,209,102,0.3)] transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              导出 MP4
            </button>
          </div>
        </div>
      </header>

      {/* 主体：左侧 16:9 影院舞台 + 底部导出卡；右侧分镜/人物/歌词导演台 */}
      <main className="flex-1 max-w-[1520px] w-full mx-auto px-4 sm:px-6 py-5 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_400px] gap-6 items-start">
        {/* 左侧主列 */}
        <section className="space-y-4 min-w-0">
          {/* 16:9 3D MV 影院舞台 */}
          <div
            ref={stageWrapRef}
            className="relative w-full aspect-video rounded-2xl overflow-hidden bg-[#090712] border border-amber-300/25 shadow-[0_24px_70px_rgba(0,0,0,0.65)] group"
          >
            <canvas
              ref={displayCanvasRef}
              width={PREVIEW_W}
              height={PREVIEW_H}
              onClick={togglePlay}
              className="w-full h-full object-contain block cursor-pointer"
            />

            {/* 加载遮罩 */}
            {!atlas && !loadErr && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0e0b1c]/95 gap-3 p-6 text-center">
                <div className="w-12 h-12 rounded-2xl border-2 border-amber-300/50 border-t-amber-300 animate-spin" />
                <div className="text-sm font-medium text-amber-100">{loadingMsg}</div>
                <div className="text-xs text-slate-400">正在载入分支原版像素角色图集（cast_atlas.png）与 3D 引擎</div>
              </div>
            )}

            {loadErr && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#180d1e]/95 p-6 text-center gap-2">
                <div className="text-rose-400 font-bold">素材加载失败</div>
                <div className="text-xs text-rose-200 max-w-md">{loadErr}</div>
              </div>
            )}

            {/* 初始暂停时的居中播放邀请（开播后彻底消失，不遮挡纯洁画面） */}
            {atlas && !playing && curTime < 0.05 && (
              <button
                type="button"
                onClick={togglePlay}
                className="absolute inset-0 flex flex-col items-center justify-center bg-black/30 hover:bg-black/20 transition cursor-pointer"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-300 to-yellow-400 text-[#1b132b] flex items-center justify-center shadow-[0_0_50px_rgba(255,209,102,0.55)] group-hover:scale-105 transition">
                  <Play className="w-9 h-9 fill-current ml-1" />
                </div>
                <div className="mt-4 px-4 py-1.5 rounded-full bg-[#18122c]/85 border border-amber-300/40 text-amber-100 text-sm font-bold tracking-wider">
                  点击播放《勾指起誓》完整 MV
                </div>
              </button>
            )}
          </div>

          {/* 节拍时间轴与播控条（位于画布外下方，永不遮挡字幕） */}
          <div className="rounded-2xl border border-white/10 bg-[#161229] p-4 space-y-3 shadow-xl">
            {/* 53 分镜分段进度轨 */}
            <div className="space-y-1.5">
              <div
                className="relative h-4 rounded-full bg-[#0d0a18] border border-white/10 overflow-hidden cursor-pointer select-none"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                  seekTo(ratio * timeline.duration);
                }}
              >
                {/* 各分镜色带 */}
                {timeline.shots.map((st) => {
                  const left = (st.a / timeline.duration) * 100;
                  const width = ((st.b - st.a) / timeline.duration) * 100;
                  const col = SECTION_COLORS[sectionOfShot(st.id)];
                  return (
                    <div
                      key={st.id}
                      style={{ left: `${left}%`, width: `${width}%`, backgroundColor: col }}
                      className="absolute top-0 bottom-0 opacity-30 border-r border-[#0e0c1a]/70"
                      title={`${st.id} · ${SHOT_BY_ID[st.id]?.title ?? ''}`}
                    />
                  );
                })}
                {/* 已播放金色高亮 */}
                <div
                  className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-amber-400/90 via-yellow-300/90 to-rose-400/90 pointer-events-none"
                  style={{ width: `${Math.min(100, (curTime / timeline.duration) * 100)}%` }}
                />
                {/* 播放头 */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_#fff] pointer-events-none"
                  style={{ left: `calc(${Math.min(100, (curTime / timeline.duration) * 100)}% - 2px)` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-amber-200 font-semibold">{fmtTime(curTime)}</span>
                  <span>/</span>
                  <span>{fmtTime(timeline.duration)}</span>
                  <span className="hidden sm:inline text-slate-500">·</span>
                  <span className="hidden sm:inline-flex items-center gap-1.5 text-slate-300">
                    <span
                      className="inline-block w-2 h-2 rounded-full bg-amber-300 transition-transform duration-75"
                      style={{ transform: `scale(${0.8 + beatPulse * 0.9})`, opacity: 0.4 + beatPulse * 0.6 }}
                    />
                    85 BPM 节拍脉冲
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="px-2 py-0.5 rounded-md text-[10px] font-sans font-bold text-[#140f24]"
                    style={{ backgroundColor: SECTION_COLORS[activeSection] }}
                  >
                    {activeSection}
                  </span>
                  <span className="text-amber-300 font-bold">{activeShotTime.id}</span>
                  <span className="text-slate-400 hidden sm:inline">
                    ({activeShotIdx + 1}/{timeline.shots.length})
                  </span>
                </div>
              </div>
            </div>

            {/* 播控按钮行 */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => stepShot(-1)}
                  className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10 text-slate-200 transition cursor-pointer"
                  title="上一分镜 (←)"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={!atlas}
                  onClick={togglePlay}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-45 text-[#1b132b] font-bold text-sm flex items-center gap-1.5 shadow-[0_4px_16px_rgba(255,209,102,0.3)] transition cursor-pointer"
                >
                  {playing ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                  {playing ? '暂停' : '播放'}
                </button>
                <button
                  type="button"
                  onClick={() => stepShot(1)}
                  className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10 text-slate-200 transition cursor-pointer"
                  title="下一分镜 (→)"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMuted((m) => !m)}
                    className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition cursor-pointer"
                    title="静音 / 取消静音"
                  >
                    {muted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.02}
                    value={muted ? 0 : volume}
                    onChange={(e) => {
                      setMuted(false);
                      setVolume(parseFloat(e.target.value));
                    }}
                    className="w-20 sm:w-24 accent-amber-400 cursor-pointer"
                    aria-label="音量"
                  />
                </div>
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition cursor-pointer"
                  title="全屏观影 (F)"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* 当前分镜导演解说卡 */}
          <div className="rounded-2xl border border-amber-300/20 bg-gradient-to-br from-[#19152e] to-[#131024] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-amber-400/20 text-amber-200 border border-amber-300/35">
                  {activeShotTime.id}
                </span>
                <h2 className="text-base font-bold text-white">{activeShotDef.title}</h2>
                <span className="text-[11px] px-2 py-0.5 rounded-md bg-white/5 text-slate-400 border border-white/10">
                  光照 · {activeShotDef.look}
                </span>
              </div>
              {activeCue && (
                <div className="text-sm font-bold text-amber-300">
                  ♪ 「{LYRIC_TEXTS[activeCue.i]}」
                </div>
              )}
              <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed">{activeShotDef.note}</p>
            </div>

            {/* 本镜登场像素角色头像 */}
            <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
              {activeShotDef.cast.map((cid) => (
                <div
                  key={cid}
                  title={CAST_LIST.find((c) => c.id === cid)?.name}
                  className="p-1 rounded-xl bg-[#241e42] border border-amber-300/30"
                >
                  <PixelPortrait atlas={atlas} cell={PORTRAIT_OF[cid]} size={38} />
                </div>
              ))}
            </div>
          </div>

          {/* 页面底部专属「导出 MP4」下载卡片 */}
          <div className="rounded-2xl border border-amber-300/35 bg-gradient-to-r from-[#231b3f] via-[#1b1533] to-[#261938] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-200 font-bold text-base">
                <Film className="w-5 h-5 text-amber-300" />
                生成并下载《勾指起誓》完整成片（MP4）
              </div>
              <p className="text-xs text-slate-300/85 leading-relaxed">
                将全部 53 个 3D 立体童话书分镜、8 位像素角色表演、《童话镇》风格金色扫色字幕与原曲《勾指起誓》音轨封装为标准 H.264 / AAC MP4 视频文件。
              </p>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="inline-flex rounded-xl border border-white/15 bg-black/25 p-1 text-xs">
                {(['720p', '1080p'] as const).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setExportQuality(q)}
                    className={`px-3 py-1.5 rounded-lg font-mono font-semibold transition cursor-pointer ${
                      exportQuality === q ? 'bg-amber-400/25 text-amber-200' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
              <button
                type="button"
                disabled={!atlas}
                onClick={() => setExportOpen(true)}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-300 hover:brightness-105 disabled:opacity-45 text-[#1b132b] font-black text-sm flex items-center gap-2 shadow-[0_8px_28px_rgba(255,209,102,0.38)] transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                导出 MP4 下载
              </button>
            </div>
          </div>
        </section>

        {/* 右侧：分镜脚本 / 登场人物 / 同步歌词 */}
        <aside className="rounded-2xl border border-white/10 bg-[#151126] flex flex-col overflow-hidden lg:sticky lg:top-20 lg:max-h-[calc(100vh-6.5rem)] shadow-xl">
          {/* Tab 栏 */}
          <div className="grid grid-cols-3 border-b border-white/10 bg-[#1a1530] p-1.5 gap-1">
            {([
              { id: 'shots' as const, label: `分镜 (${timeline.shots.length})`, icon: Film },
              { id: 'cast' as const, label: '人物 (8)', icon: Users },
              { id: 'lyrics' as const, label: `歌词 (${LYRIC_LINES.length})`, icon: ListMusic },
            ]).map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTab(t.id)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                    active
                      ? 'bg-amber-400/20 text-amber-200 border border-amber-300/35'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Tab 1: 53 分镜表 */}
          {activeTab === 'shots' && (
            <div className="flex flex-col min-h-0 flex-1">
              <div className="px-3 py-2.5 border-b border-white/10 flex gap-1.5 overflow-x-auto no-scrollbar">
                {sections.map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setSectionFilter(sec)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition cursor-pointer ${
                      sectionFilter === sec
                        ? 'bg-amber-400 text-[#1a122a] font-bold'
                        : 'bg-white/[0.04] text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {sec}
                  </button>
                ))}
              </div>
              <div className="overflow-y-auto p-2.5 space-y-2 max-h-[540px] lg:max-h-none flex-1">
                {filteredShots.map((st) => {
                  const def = SHOT_BY_ID[st.id];
                  const isActive = st.id === activeShotTime.id;
                  const lyric = st.cue >= 0 ? LYRIC_TEXTS[st.cue] : null;
                  const sec = sectionOfShot(st.id);
                  return (
                    <button
                      key={st.id}
                      ref={isActive ? activeShotCardRef : null}
                      type="button"
                      onClick={() => seekTo(st.a + 0.04)}
                      className={`w-full text-left p-3 rounded-xl border transition cursor-pointer ${
                        isActive
                          ? 'border-amber-300/70 bg-amber-400/12 shadow-[0_0_20px_rgba(255,209,102,0.14)]'
                          : 'border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-1.5 h-4 rounded-full shrink-0"
                            style={{ backgroundColor: SECTION_COLORS[sec] }}
                          />
                          <span className="font-mono text-xs font-bold text-amber-300">{st.id}</span>
                          <span className="text-xs font-bold text-white truncate">{def.title}</span>
                        </div>
                        <span className="font-mono text-[11px] text-slate-400 shrink-0">{fmtTime(st.a)}</span>
                      </div>
                      {lyric && (
                        <div className="text-xs text-amber-200/90 mt-1.5 font-medium truncate">
                          ♪ {lyric}
                        </div>
                      )}
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">{def.note}</p>
                      <div className="flex items-center gap-1 mt-2">
                        {def.cast.map((cid) => (
                          <div key={cid} className="p-0.5 rounded-md bg-[#221c3b] border border-white/10">
                            <PixelPortrait atlas={atlas} cell={PORTRAIT_OF[cid]} size={22} />
                          </div>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tab 2: 八位分支像素人物 */}
          {activeTab === 'cast' && (
            <div className="overflow-y-auto p-3 space-y-2.5 max-h-[540px] lg:max-h-none flex-1">
              {CAST_LIST.map((c) => {
                const charShots = timeline.shots.filter((st) => SHOT_BY_ID[st.id].cast.includes(c.id));
                return (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl border border-white/10 bg-white/[0.025] flex gap-3 items-start"
                  >
                    <div
                      className="p-1.5 rounded-xl bg-[#221b3d] border shrink-0"
                      style={{ borderColor: `${c.accent}66` }}
                    >
                      <PixelPortrait atlas={atlas} cell={c.portrait} size={52} />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-white truncate">{c.name}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-slate-300">
                          {charShots.length} 镜
                        </span>
                      </div>
                      <div className="text-xs text-amber-200/90">{c.role}</div>
                      <div className="text-[11px] text-slate-400">道具元素：{c.props}</div>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {charShots.slice(0, 6).map((st) => (
                          <button
                            key={st.id}
                            type="button"
                            onClick={() => seekTo(st.a + 0.04)}
                            className="px-1.5 py-0.5 rounded bg-white/[0.06] hover:bg-amber-400/25 hover:text-amber-200 text-[10px] font-mono text-slate-300 transition cursor-pointer"
                          >
                            {st.id}
                          </button>
                        ))}
                        {charShots.length > 6 && (
                          <span className="text-[10px] text-slate-500 self-center">+{charShots.length - 6}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab 3: 41 句实时卡点歌词 */}
          {activeTab === 'lyrics' && (
            <div className="overflow-y-auto p-3 space-y-1.5 max-h-[540px] lg:max-h-none flex-1">
              {LYRIC_LINES.map((line, i) => {
                const isCur = activeCue?.i === i;
                return (
                  <button
                    key={`${i}-${line.start}`}
                    type="button"
                    onClick={() => seekTo(line.start)}
                    className={`w-full text-left px-3 py-2 rounded-xl border flex items-center justify-between gap-3 transition cursor-pointer ${
                      isCur
                        ? 'border-amber-300/60 bg-amber-400/15 text-amber-200 font-bold'
                        : 'border-transparent hover:bg-white/[0.05] text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono text-[10px] text-slate-500 w-5 shrink-0">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="text-xs sm:text-sm truncate">{line.text}</span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-400 shrink-0">{fmtTime(line.start)}</span>
                  </button>
                );
              })}
            </div>
          )}
        </aside>
      </main>

      {/* MP4 导出弹窗 */}
      <ExportModal
        open={exportOpen}
        quality={exportQuality}
        onQualityChange={setExportQuality}
        showLyrics={showLyrics}
        onToggleLyrics={setShowLyrics}
        exporting={exporting}
        progress={exportProgress}
        result={exportResult}
        error={exportErr}
        onStart={handleStartExport}
        onCancel={handleCancelExport}
        onClose={() => setExportOpen(false)}
      />
    </div>
  );
}

export default App;
