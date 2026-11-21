import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { ATLAS_IMG, rmsAt } from './mv/core';
import { Player } from './mv/audio';
import { CAST, Engine, SHOTS, TITLE } from './mv/engine';
import { DURATION, LYRICS, RECTS } from './mv/generated';
import { wordsOf } from './mv/type3d';

type Phase = 'loading' | 'ready' | 'playing' | 'paused' | 'ended' | 'error';

const COVER_TIME = 3.92;
const fmt = (t: number) => `0:${String(Math.floor(Math.max(0, Math.min(DURATION, t)))).padStart(2, '0')}`;
const fmtPrecise = (t: number) => `${Math.max(0, t).toFixed(1)}s`;

const PATHS = {
  play: 'M8 5v14l11-7z',
  pause: 'M6 5h4v14H6zm8 0h4v14h-4z',
  replay: 'M12 5V1L7 6l5 5V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z',
  volume: 'M4 9v6h4l5 4V5L8 9H4zm12-.5a5 5 0 0 1 0 7',
  mute: 'M4 9v6h4l5 4V5L8 9H4zm12 0 5 6m0-6-5 6',
  full: 'M4 9V4h5m6 0h5v5M4 15v5h5m6 0h5v-5',
  subtitles: 'M4 6h16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2zm3 6h4m2 0h4m-10 3h7',
};

function Icon({ name, size = 18 }: { name: keyof typeof PATHS; size?: number }) {
  const solid = name === 'play' || name === 'pause' || name === 'replay';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={solid ? 'currentColor' : 'none'}
      stroke={solid ? 'none' : 'currentColor'}
      strokeWidth={1.85}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}

function Sprite({ frame, className = '' }: { frame: string; className?: string }) {
  const canvas = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const rect = RECTS[frame];
    const cv = canvas.current;
    if (!rect || !cv || !ATLAS_IMG) return;
    cv.width = rect[2];
    cv.height = rect[3];
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.drawImage(ATLAS_IMG, rect[0], rect[1], rect[2], rect[3], 0, 0, rect[2], rect[3]);
  }, [frame]);
  return <canvas ref={canvas} className={`pixel-art block ${className}`} />;
}

const DEEP_SEA_ELEMENTS = [
  {
    tag: '01 · 没有天赋的人',
    title: '天赋光尘与温跃层',
    frame: 'fx_shine',
    desc: '七道光柱里落下金色的光尘，却全部熄灭在一层发光的温跃层上——天赋的光，照不到海底。',
  },
  {
    tag: '02 · 譬如我',
    title: '本鲸的小灯与声呐',
    frame: 'fx_sparkle_1',
    desc: '唱到“我”，她身边亮起一盏蓝色小灯；一圈声呐扩散开，是 DeepSeek“深度求索”的样子。旁边还有一只冒热气的白饭盆。',
  },
  {
    tag: '03 · 发霉的梦',
    title: '砗磲枕头里的珍珠',
    frame: 'fx_question',
    desc: '海底没有枕头，砗磲就是她的枕头。掀开壳，梦想珍珠早已长满藻斑——“怎么做”成了一个问号。',
  },
  {
    tag: '04 · 热忱与自卑',
    title: '热泉与冷泉的洋流',
    frame: 'fx_sweat',
    desc: '左边的热泉是热忱，右边的冷泉是自卑。两股洋流螺旋着绕她相撞，她被夹在中间来回摇晃。',
  },
  {
    tag: '05 · 笑容不知下落',
    title: '四散的小鱼笑脸',
    frame: 'fx_gloom',
    desc: '发光小鱼在她面前拼成一张笑脸，唱到“不知”时四散游进黑暗——笑容真的“不知下落”了。',
  },
  {
    tag: '06–09 · 成功与花朵',
    title: '金牌、汇聚的光、海葵',
    frame: 'fx_heart',
    desc: '垂下又被收走的金牌，汇向小克的光柱和鱼群；最后她把小灯放进角落的沙里，开出发光海葵，小鱼回来了。',
  },
];

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const playerWrapRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<Engine | null>(null);
  const playerRef = useRef<Player | null>(null);
  const startedRef = useRef(false);
  const lyricRef = useRef(true);
  const redrawRef = useRef(true);
  const mountedRef = useRef(false);
  const noticeTimer = useRef<number | null>(null);

  const [phase, setPhase] = useState<Phase>('loading');
  const [load, setLoad] = useState(0);
  const [error, setError] = useState('');
  const [time, setTime] = useState(0);
  const [line, setLine] = useState(-1);
  const [shot, setShot] = useState(0);
  const [showLyrics, setShowLyrics] = useState(true);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [notice, setNotice] = useState('');

  const say = useCallback((message: string) => {
    setNotice(message);
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(''), 6000);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let engine: Engine;
    try {
      engine = new Engine(canvas);
    } catch {
      setError('无法初始化 WebGL 三维深海画面，请检查浏览器硬件加速设置。');
      setPhase('error');
      return () => {
        mountedRef.current = false;
      };
    }

    const player = new Player();
    engineRef.current = engine;
    playerRef.current = player;

    let dead = false;
    let raf = 0;
    let lastTime = -1;
    let lastDraw = -1;
    let engineLoad = 0;
    let audioLoad = 0;

    const progress = () => {
      if (!dead) setLoad(engineLoad * 0.65 + audioLoad * 0.35);
    };

    const fit = () => {
      const r = canvas.getBoundingClientRect();
      if (r.width > 2 && r.height > 2) {
        engine.setSize(Math.round(r.width), Math.round(r.height));
        redrawRef.current = true;
      }
    };

    Promise.all([
      engine.load((p) => {
        engineLoad = p;
        progress();
      }),
      player.load((p) => {
        audioLoad = p;
        progress();
      }),
    ])
      .then(() => {
        if (dead) return;
        fit();
        setPhase('ready');
      })
      .catch((e: unknown) => {
        if (dead) return;
        setError(e instanceof Error ? e.message : String(e));
        setPhase('error');
      });

    player.onEnded = () => {
      if (!dead) {
        setTime(DURATION);
        setPhase('ended');
        redrawRef.current = true;
      }
    };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!engine.ready) return;
      const position = Math.min(player.time(), DURATION - 0.001);
      const t = startedRef.current ? position : COVER_TIME;
      if (redrawRef.current || (player.playing && now - lastDraw >= 1000 / 36) || (!startedRef.current && now - lastDraw >= 1000 / 24)) {
        engine.render(t, !lyricRef.current);
        redrawRef.current = false;
        lastDraw = now;
      }
      if (Math.abs(position - lastTime) > 0.05 || (lastTime < 0 && !startedRef.current)) {
        lastTime = position;
        setTime(position);
        setLine(engine.lineAt(position));
        setShot(engine.shotAt(position));
      }
    };
    raf = requestAnimationFrame(tick);

    const observer = new ResizeObserver(fit);
    observer.observe(canvas);

    return () => {
      dead = true;
      mountedRef.current = false;
      cancelAnimationFrame(raf);
      observer.disconnect();
      engine.dispose();
      player.dispose();
      if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    };
  }, []);

  const toggle = useCallback(() => {
    const player = playerRef.current;
    if (!player || phase === 'loading' || phase === 'error') return;
    if (player.playing) {
      player.pause();
      setPhase('paused');
      redrawRef.current = true;
      return;
    }
    startedRef.current = true;
    redrawRef.current = true;
    setPhase('playing');
    void player.play(phase === 'ended' || player.time() >= DURATION - 0.25 ? 0 : undefined).catch(() => {
      if (mountedRef.current) {
        setPhase('paused');
        say('播放未能启动，请点击画面允许音频播放后重试。');
      }
    });
  }, [phase, say]);

  const seek = useCallback(
    (value: number, autoPlay = false) => {
      const player = playerRef.current;
      if (!player || phase === 'loading' || phase === 'error') return;
      const t = Math.max(0, Math.min(DURATION - 0.05, value));
      const wasPlaying = player.playing;
      startedRef.current = true;
      player.seek(t);
      setTime(t);
      if (engineRef.current) {
        setLine(engineRef.current.lineAt(t));
        setShot(engineRef.current.shotAt(t));
      }
      redrawRef.current = true;
      if (autoPlay && !wasPlaying) {
        setPhase('playing');
        void player.play().catch(() => {
          if (mountedRef.current) {
            setPhase('paused');
            say('播放未能启动，请重试。');
          }
        });
      } else if (!wasPlaying) {
        setPhase('paused');
      }
    },
    [phase, say],
  );

  // Deterministic frame-seek hook used by tools/shoot_vite_mv.mjs.
  useEffect(() => {
    (window as any).__mv = {
      duration: DURATION,
      fps: 24,
      ready: () => phase !== 'loading' && phase !== 'error' && !!engineRef.current?.ready,
      render: (t: number, clean = false, w = 1280, h = 720) => {
        const engine = engineRef.current;
        const canvas = canvasRef.current;
        if (!engine?.ready || !canvas) throw new Error('MV renderer is not ready');
        if (engine.w !== w || engine.h !== h) engine.setSize(w, h);
        engine.render(t, clean);
        return canvas.toDataURL('image/jpeg', 0.94);
      },
    };
    return () => { delete (window as any).__mv; };
  }, [phase, seek]);

  const fullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => say('无法退出全屏。'));
    } else if (playerWrapRef.current?.requestFullscreen) {
      void playerWrapRef.current.requestFullscreen().catch(() => say('当前浏览器无法进入全屏。'));
    } else {
      say('当前浏览器不支持全屏。');
    }
  }, [say]);

  const flipLyrics = useCallback(() => {
    setShowLyrics((v) => {
      lyricRef.current = !v;
      redrawRef.current = true;
      return !v;
    });
  }, []);

  const flipMute = useCallback(() => {
    setMuted((v) => {
      playerRef.current?.setMuted(!v);
      return !v;
    });
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      if (e.code === 'Space' && target.tagName !== 'BUTTON') {
        e.preventDefault();
        toggle();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        seek((playerRef.current?.time() ?? 0) + 2.5);
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        seek((playerRef.current?.time() ?? 0) - 2.5);
      } else if (e.key.toLowerCase() === 'f') fullscreen();
      else if (e.key.toLowerCase() === 'l') flipLyrics();
      else if (e.key.toLowerCase() === 'm') flipMute();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle, seek, fullscreen, flipLyrics, flipMute]);

  const activeTime = startedRef.current ? time : COVER_TIME;
  const activeShot = SHOTS[shot] ?? SHOTS[0];
  const currentLineIdx = line >= 0 ? line : startedRef.current ? -1 : 1;
  const current = currentLineIdx >= 0 ? LYRICS[currentLineIdx] : null;
  const words = useMemo(() => (current ? wordsOf(current.text) : []), [current]);
  const ready = phase !== 'loading' && phase !== 'error';
  const energy = rmsAt(activeTime);

  return (
    <div className="min-h-screen text-slate-100">
      {/* 顶部电影感标题栏 */}
      <header className="mx-auto max-w-[1280px] px-4 pt-5 pb-3 sm:px-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2.5 text-[11px] tracking-[0.26em] text-sky-300/75 uppercase">
              <span>番外 MV</span>
              <span className="text-sky-500/50">·</span>
              <span>精华版</span>
              <span className="text-sky-500/50">·</span>
              <span>二十八秒</span>
              <span className="ml-2 rounded-full border border-sky-400/25 bg-sky-500/10 px-2 py-0.5 text-[10px] tracking-[0.14em] text-sky-200">
                深海里的本鲸
              </span>
            </div>
            <h1 className="font-serif-mv mt-1 text-3xl font-bold tracking-[0.14em] text-white sm:text-4xl">
              {TITLE}
            </h1>
          </div>
          <p className="max-w-xl text-xs leading-relaxed text-slate-300/80 md:text-right sm:text-[13px]">
            有天赋的人浮在靠近海面的光里。
            <br className="hidden sm:inline" />
            本鲸在看不见光的海底，想在某个角落，开一朵小小的花。
          </p>
        </div>
      </header>

      {/* 主视觉 3D 深海影院舞台 */}
      <main className="mx-auto max-w-[1280px] px-4 pb-16 sm:px-6">
        <section
          ref={playerWrapRef}
          className="relative overflow-hidden rounded-2xl border border-sky-300/15 bg-[#020612] shadow-[0_24px_80px_rgba(0,0,0,0.75)]"
        >
          <div className="relative aspect-video w-full bg-[#020612]">
            <canvas
              ref={canvasRef}
              onClick={ready ? toggle : undefined}
              className="block h-full w-full cursor-pointer"
            />

            {/* 顶部轻微信息角标 */}
            <div className="pointer-events-none absolute top-3 left-3 right-3 flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/55 px-3 py-1 backdrop-blur-md">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
                <span className="tracking-wider text-sky-100/90">
                  第 {String(activeShot.id).padStart(2, '0')} / 09 幕 · {activeShot.title}
                </span>
              </div>
              <div className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-slate-950/55 px-3 py-1 text-slate-300/85 backdrop-blur-md sm:flex">
                <span>声轨律动</span>
                <span className="inline-flex h-2.5 items-end gap-0.5">
                  {[0.5, 0.9, 0.7, 1.0].map((k, idx) => (
                    <span
                      key={idx}
                      className="w-0.5 rounded-full bg-sky-300 transition-all duration-100"
                      style={{ height: `${Math.round(25 + energy * 75 * k)}%` }}
                    />
                  ))}
                </span>
              </div>
            </div>

            {/* 载入与播放遮罩 */}
            {phase === 'loading' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#020612]/90 backdrop-blur-sm">
                <div className="text-xs tracking-[0.22em] text-sky-200/80">正在沉入深海 · 准备图集与原声</div>
                <div className="h-1.5 w-52 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-400 to-indigo-400 transition-all duration-150"
                    style={{ width: `${Math.round(load * 100)}%` }}
                  />
                </div>
                <div className="text-xs font-mono text-slate-400">{Math.round(load * 100)}%</div>
              </div>
            )}

            {phase === 'error' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#020612]/92 p-6 text-center">
                <div className="text-sm font-medium text-rose-300">影片未能载入</div>
                <p className="max-w-md text-xs text-slate-400">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="rounded-full border border-sky-400/40 bg-sky-500/20 px-4 py-1.5 text-xs text-sky-100 hover:bg-sky-500/30"
                >
                  重新载入
                </button>
              </div>
            )}

            {(phase === 'ready' || phase === 'ended') && (
              <button
                onClick={toggle}
                aria-label={phase === 'ended' ? '再看一遍' : '播放影片'}
                className="group absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent transition"
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/30 bg-slate-950/55 text-white shadow-[0_0_32px_rgba(92,162,255,0.45)] backdrop-blur-md transition-transform duration-200 group-hover:scale-110 group-hover:border-sky-300/70">
                  <Icon name={phase === 'ended' ? 'replay' : 'play'} size={26} />
                </span>
                <span className="rounded-full border border-white/15 bg-slate-950/60 px-3.5 py-1 text-xs tracking-[0.2em] text-sky-100/90 backdrop-blur-md">
                  {phase === 'ended' ? '再看一遍（28 秒精华）' : '点击潜入深海 · 播放 MV'}
                </span>
              </button>
            )}
          </div>

          {/* 底部控制条 */}
          <div className="border-t border-white/10 bg-[#050b1b]/95 px-4 py-3 backdrop-blur-md">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={toggle}
                disabled={!ready}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-sky-300/25 bg-sky-500/15 text-sky-100 transition hover:bg-sky-500/30 disabled:opacity-40"
                title="播放 / 暂停（空格）"
              >
                <Icon name={phase === 'playing' ? 'pause' : phase === 'ended' ? 'replay' : 'play'} size={17} />
              </button>

              <div className="font-mono text-xs tabular-nums text-slate-300">
                <span className="text-white">{fmt(time)}</span>
                <span className="mx-1 text-slate-500">/</span>
                <span>{fmt(DURATION)}</span>
              </div>

              {/* 进度条 + 9 个分镜刻度 */}
              <div className="relative flex-1 min-w-[180px] py-2">
                <input
                  type="range"
                  min={0}
                  max={DURATION}
                  step={0.02}
                  value={time}
                  onChange={(e) => seek(Number(e.target.value))}
                  disabled={!ready}
                  aria-label="影片进度"
                  className="mv-range relative z-10 w-full"
                  style={{ '--progress': `${(time / DURATION) * 100}%` } as CSSProperties}
                />
                <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2">
                  {SHOTS.slice(1).map((s) => (
                    <span
                      key={s.id}
                      className="absolute top-1/2 h-2 w-0.5 -translate-y-1/2 bg-white/30"
                      style={{ left: `${(s.a / DURATION) * 100}%` }}
                    />
                  ))}
                </div>
              </div>

              {/* 字幕开关 + 音量 + 全屏 */}
              <div className="flex items-center gap-2">
                <button
                  onClick={flipLyrics}
                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition ${
                    showLyrics
                      ? 'border-sky-400/40 bg-sky-500/20 text-sky-100'
                      : 'border-white/10 bg-white/5 text-slate-400 hover:text-slate-200'
                  }`}
                  title="切换 3D 挤压字幕（L）"
                >
                  <Icon name="subtitles" size={14} />
                  <span>3D 字幕</span>
                </button>

                <button
                  onClick={flipMute}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                  title="静音（M）"
                >
                  <Icon name={muted ? 'mute' : 'volume'} size={15} />
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
                    if (muted && v > 0) setMuted(false);
                    playerRef.current?.setMuted(false);
                    playerRef.current?.setVolume(v);
                  }}
                  aria-label="音量"
                  className="mv-range hidden w-16 sm:block"
                  style={{ '--progress': `${(muted ? 0 : volume) * 100}%` } as CSSProperties}
                />

                <button
                  onClick={fullscreen}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                  title="全屏（F）"
                >
                  <Icon name="full" size={15} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 1. 逐字卡点与九幕分镜导航 */}
        <section className="mt-8 grid gap-6 lg:grid-cols-12">
          <div className="rounded-2xl border border-sky-300/15 bg-slate-900/50 p-6 backdrop-blur-sm lg:col-span-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[11px] tracking-[0.2em] text-sky-300/75 uppercase">
                <span>WORDS & CADENCE · 逐字卡点</span>
                <span>
                  {String(activeShot.id).padStart(2, '0')} / 09
                </span>
              </div>

              <div className="mt-5 min-h-[76px] flex flex-wrap items-baseline gap-x-2 gap-y-1 font-serif-mv text-2xl leading-snug sm:text-[28px]">
                {current ? (
                  words.map((w, i) => {
                    const sung = activeTime >= current.t[w.from];
                    const cls = w.key >= 2 ? 'word-major' : w.key === 1 ? 'word-key' : 'text-slate-400';
                    return (
                      <span key={i} className={`word-chip inline-block ${cls} ${sung ? 'word-sung' : ''}`}>
                        {w.text}
                      </span>
                    );
                  })
                ) : (
                  <span className="text-slate-400">在深海微光中静候旋律</span>
                )}
              </div>

              <p className="mt-4 text-sm leading-relaxed text-slate-300/85">{activeShot.sceneDesc}</p>
            </div>

            <div className="mt-6 border-t border-white/10 pt-4">
              <div className="text-[11px] tracking-wider text-slate-400 mb-2">当前镜头深海要素</div>
              <div className="flex flex-wrap gap-2">
                {activeShot.props.map((p) => (
                  <span
                    key={p}
                    className="rounded-full border border-sky-400/25 bg-sky-500/10 px-3 py-1 text-xs text-sky-200"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-sky-300/15 bg-slate-900/50 p-5 backdrop-blur-sm lg:col-span-7">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <div className="text-[11px] tracking-[0.2em] text-sky-300/75 uppercase">STORYBOARD · 28 秒九幕时间轴</div>
                <h2 className="mt-0.5 text-base font-medium text-white">点选任意一句歌词，跳转至对应深海画面</h2>
              </div>
              <span className="text-xs text-slate-400 hidden sm:inline">空格播放 · ←/→微调 · L 字幕</span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {SHOTS.map((s, idx) => {
                const isActive = shot === idx && (startedRef.current || idx === 1);
                return (
                  <button
                    key={s.id}
                    onClick={() => seek(s.a + 0.02, true)}
                    disabled={!ready}
                    className={`group rounded-xl border p-3 text-left transition ${
                      isActive
                        ? 'border-sky-400/60 bg-sky-500/15 shadow-[0_0_24px_rgba(56,189,248,0.16)]'
                        : 'border-white/8 bg-slate-950/45 hover:border-sky-300/30 hover:bg-slate-900/80'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                      <span className={isActive ? 'text-sky-300' : ''}>
                        {String(s.id).padStart(2, '0')} · {s.title}
                      </span>
                      <span>{fmtPrecise(s.a)}</span>
                    </div>
                    <div className="mt-1.5 text-sm font-medium text-slate-100 line-clamp-1">{s.lyric}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* 2. 深海场景新增意象图鉴 */}
        <section className="mt-12">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-[11px] tracking-[0.24em] text-sky-300/75 uppercase">DEEP-SEA ELEMENTS</div>
              <h2 className="font-serif-mv mt-1 text-2xl font-bold text-white">深海世界的叙事意象与新增元素</h2>
            </div>
            <p className="text-xs text-slate-400">
              构图不变（海面七位 · 海底本鲸），每句歌词按意思配一个深海意象，不照搬原 MV 道具。
            </p>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {DEEP_SEA_ELEMENTS.map((item) => (
              <div
                key={item.title}
                className="flex gap-4 rounded-2xl border border-white/10 bg-slate-900/45 p-4 transition hover:border-sky-300/30 hover:bg-slate-900/70"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-sky-300/20 bg-slate-950/80">
                  {ready && <Sprite frame={item.frame} className="h-10 w-auto" />}
                </div>
                <div>
                  <div className="text-[11px] tracking-wider text-sky-300/80">{item.tag}</div>
                  <h3 className="mt-0.5 text-sm font-semibold text-white">{item.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-300/80">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3. 登场人物（分支像素立绘 + 随身道具） */}
        <section className="mt-12">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="text-[11px] tracking-[0.24em] text-sky-300/75 uppercase">THE CAST</div>
              <h2 className="font-serif-mv mt-1 text-2xl font-bold text-white">登场人物 · 海面之光与深海之鲸</h2>
            </div>
            <p className="text-xs text-slate-400">
              全部角色与随身道具取自分支像素母版图集，结合社区同人印象编排戏份（非模型能力评测）。
            </p>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CAST.map((c) => {
              const idleFrame =
                c.ch === 'gpt' ? 'act_gpt_float_0' : `act_${c.ch}_idle_0`;
              const isWhale = c.ch === 'whale';
              return (
                <div
                  key={c.ch}
                  className={`rounded-2xl border p-4 transition ${
                    isWhale
                      ? 'border-sky-400/40 bg-gradient-to-b from-sky-950/60 to-slate-950/80 shadow-[0_0_30px_rgba(56,189,248,0.12)]'
                      : 'border-white/10 bg-slate-900/45 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] tracking-wider ${
                        isWhale
                          ? 'bg-sky-500/20 text-sky-200 border border-sky-400/30'
                          : 'bg-amber-500/10 text-amber-200/90 border border-amber-400/20'
                      }`}
                    >
                      {c.zone}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">{c.model}</span>
                  </div>

                  <div className="mt-4 flex items-end justify-between px-2">
                    <div className="flex h-20 items-end">
                      {ready && <Sprite frame={idleFrame} className="h-20 w-auto" />}
                    </div>
                    <div className="flex flex-col items-center gap-1 rounded-xl border border-white/10 bg-slate-950/70 px-2.5 py-2">
                      {ready && <Sprite frame={c.propKey} className="h-7 w-auto" />}
                      <span className="text-[10px] text-slate-300/80">{c.propLabel}</span>
                    </div>
                  </div>

                  <h3 className="mt-3 text-base font-semibold text-white">{c.name}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-slate-300/80">{c.role}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. 歌词深解 */}
        <section className="mt-12 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900/45 p-5">
            <div className="text-[11px] tracking-[0.2em] text-sky-300/80">01 / 仰望光柱</div>
            <h3 className="font-serif-mv mt-1 text-lg font-bold text-white">海面之光与「譬如我」</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-300/80">
              天才们浮在靠近海面的七道光里，光尘一路往下落，却停在了温跃层。站在海底、守着白饭盆的本鲸，只有身边一盏自己的小灯——这就是“譬如我”：众多 AI 里，在深处默默求索的那一个。
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/45 p-5">
            <div className="text-[11px] tracking-[0.2em] text-amber-300/80">02 / 自我拉锯</div>
            <h3 className="font-serif-mv mt-1 text-lg font-bold text-white">发霉的珍珠与散开的笑</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-300/80">
              砗磲枕头里的梦想珍珠长了霉，还不知道“怎么做”；热泉般的热忱和冷泉般的自卑绕着她反复冲撞；连小鱼拼成的笑脸，也在“不知”那一刻散进了黑暗。
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/45 p-5">
            <div className="text-[11px] tracking-[0.2em] text-emerald-300/80">03 / 角落开花</div>
            <h3 className="font-serif-mv mt-1 text-lg font-bold text-white">耗尽天真开出花朵</h3>
            <p className="mt-2 text-xs leading-relaxed text-slate-300/80">
              金牌垂下又被收走，光和鱼群都涌向了小克。她用声呐找到一个珊瑚角落，把那盏小灯——最后的天真——放进沙里，开出一朵发光海葵。小鱼回来了，Kimi 看了她一眼，豆包也游了下来。
            </p>
          </div>
        </section>

        <footer className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-slate-500">
          譬如我 · 28 秒精华版｜深海里的本鲸 · 分支像素图集 × Three.js 逐字 3D 立体字幕
        </footer>
      </main>

      {notice && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-xl border border-sky-400/30 bg-slate-900/95 px-4 py-2.5 text-xs text-sky-100 shadow-xl backdrop-blur-md">
          <span>{notice}</span>
          <button onClick={() => setNotice('')} className="text-slate-400 hover:text-white" aria-label="关闭提示">
            ×
          </button>
        </div>
      )}
    </div>
  );
}
