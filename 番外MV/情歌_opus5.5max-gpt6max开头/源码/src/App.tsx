import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Engine, SECTIONS, SHOTS } from "./mv/engine";
import { Player } from "./mv/audio";
import { ATLAS_H, ATLAS_W, DURATION, LYRICS, RECTS } from "./mv/generated";
import { wordsOf } from "./mv/lyrics";
import atlasUrl from "./assets/atlas.png";

type Tab = "lyrics" | "storyboard" | "cast";
type IconName =
  | "play"
  | "pause"
  | "sound"
  | "mute"
  | "expand"
  | "close"
  | "back"
  | "next"
  | "replay"
  | "chevron"
  | "captions";
const fmt = (t: number) =>
  `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(Math.floor(Math.max(0, t) % 60)).padStart(2, "0")}`;
const CAST = [
  {
    id: "whale",
    name: "鲸鱼娘",
    role: "「我」",
    action: "idle",
    description: "把回忆收进琥珀，也学着把拳头松开。下一首情歌，唱给自己。",
  },
  {
    id: "claude",
    name: "小克",
    role: "「你」",
    action: "idle",
    description: "写下第一首歌的人。认真相遇，也温柔地选择告别。",
  },
  {
    id: "gpt",
    name: "龙娘",
    role: "回忆里的困兽",
    action: "float",
    description: "从暴怒到温柔。栏杆散开时，回忆终于可以自由飞翔。",
  },
  {
    id: "qwen",
    name: "千问",
    role: "命运的东道主",
    action: "idle",
    description: "在疯帽子的茶会上，把生活的顺序重新洗一遍。",
  },
  {
    id: "gemini",
    name: "猫",
    role: "路口的守钟人",
    action: "idle",
    description: "看过两个方向，最终还是要选择一条自己的路。",
  },
  {
    id: "kimi",
    name: "Kimi",
    role: "记忆的收藏者",
    action: "idle",
    description: "四季不停翻页，她把重要的旧句留在卷轴里。",
  },
  {
    id: "zai",
    name: "狐狸",
    role: "胶卷放映员",
    action: "idle",
    description: "在慢动作里打盹，又在定格的那一瞬间醒来。",
  },
  {
    id: "doubao",
    name: "豆包",
    role: "温柔的陪唱者",
    action: "idle",
    description: "先陪你踩下第一拍，再陪你把这首歌唱完。",
  },
];

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    play: <path d="m9 5 11 7-11 7Z" fill="currentColor" stroke="none" />,
    pause: <path d="M8 5v14M16 5v14" strokeWidth="3" />,
    sound: (
      <>
        <path d="m11 5-5 4H3v6h3l5 4Z" />
        <path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" />
      </>
    ),
    mute: (
      <>
        <path d="m11 5-5 4H3v6h3l5 4Z" />
        <path d="m16 9 6 6m0-6-6 6" />
      </>
    ),
    expand: <path d="M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    back: (
      <>
        <path d="M5 5v14" />
        <path d="m19 5-10 7 10 7Z" fill="currentColor" stroke="none" />
      </>
    ),
    next: (
      <>
        <path d="M19 5v14" />
        <path d="m5 5 10 7-10 7Z" fill="currentColor" stroke="none" />
      </>
    ),
    replay: <path d="M4 10a8 8 0 1 1 1 8M4 4v6h6" />,
    chevron: <path d="m8 5 7 7-7 7" />,
    captions: (
      <>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M10 10a2.5 2.5 0 1 0 0 4m8-4a2.5 2.5 0 1 0 0 4" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

function Sprite({
  id,
  action,
  height = 80,
}: {
  id: string;
  action: string;
  height?: number;
}) {
  const r = RECTS[`act_${id}_${action}_0`];
  if (!r) return null;
  const s = height / r[3];
  return (
    <span
      className="cast-sprite"
      aria-hidden="true"
      style={{
        width: r[2] * s,
        height,
        backgroundImage: `url(${atlasUrl})`,
        backgroundSize: `${ATLAS_W * s}px ${ATLAS_H * s}px`,
        backgroundPosition: `-${r[0] * s}px -${r[1] * s}px`,
      }}
    />
  );
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const cinemaRef = useRef<HTMLElement>(null);
  const detailRef = useRef<HTMLElement>(null);
  const lyricListRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const playerRef = useRef<Player | null>(null);
  const stateRef = useRef({
    started: false,
    captions: true,
    dirty: true,
    hover: false,
  });
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [line, setLine] = useState(-1);
  const [shot, setShot] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [captions, setCaptions] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [tab, setTab] = useState<Tab>("lyrics");
  const [onlyOpening, setOnlyOpening] = useState(true);
  const [following, setFollowing] = useState(true);
  const [notice, setNotice] = useState("");
  const [silent, setSilent] = useState(false);
  const [loadedVisual, setLoadedVisual] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const lastInteraction = useRef(0);
  const sizeRef = useRef({ w: 1440, h: 810 });
  const lineWords = useMemo(() => LYRICS.map((l) => wordsOf(l.text)), []);
  const ended = started && !playing && time >= DURATION - 0.15;

  useEffect(() => {
    let alive = true,
      raf = 0,
      engine: Engine | null = null;
    const player = new Player();
    playerRef.current = player;
    const current = stateRef.current;
    current.started = false;
    current.dirty = true;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let observer: ResizeObserver | null = null;
    let graphicProgress = 0,
      audioProgress = 0;
    const report = () =>
      alive &&
      setProgress(
        Math.min(99, Math.round(graphicProgress * 65 + audioProgress * 35)),
      );
    player.onEnded = () => {
      if (alive) {
        setPlaying(false);
        current.dirty = true;
      }
    };
    (async () => {
      try {
        engine = new Engine(canvasRef.current!);
        engineRef.current = engine;
        const resize = () => {
          if (!alive || !engine || !screenRef.current) return;
          const r = screenRef.current.getBoundingClientRect();
          sizeRef.current = { w: Math.round(r.width), h: Math.round(r.height) };
          engine.setSize(sizeRef.current.w, sizeRef.current.h);
          current.dirty = true;
        };
        observer = new ResizeObserver(resize);
        observer.observe(screenRef.current!);
        resize();
        await Promise.all([
          engine.load((p) => {
            graphicProgress = p;
            report();
          }),
          player.load((p) => {
            audioProgress = p;
            report();
          }),
        ]);
        if (!alive || !engine) return;
        player.setVolume(0.8);
        setSilent(player.silent);
        // Warm both compositor buffers before revealing the canvas.
        engine.render(1, true, true);
        engine.render(1, true, true);
        setLoadedVisual(true);
        setProgress(100);
        setPhase("ready");
        let lastUI = -1,
          lastDraw = 0,
          lastShot = -1,
          lastLine = -2;
        const startedAt = performance.now();
        const renderLoop = (now: number) => {
          if (!alive || !engine) return;
          raf = requestAnimationFrame(renderLoop);
          if (document.hidden) return;
          let t = player.time();
          if (player.playing && t >= DURATION - 0.04) {
            player.pause();
            player.seek(DURATION - 0.04);
            t = player.time();
            setPlaying(false);
            current.dirty = true;
          }
          const ambient = !current.started && !reduced;
          if (
            current.dirty ||
            ((player.playing || ambient) &&
              now - lastDraw >= (ambient ? 65 : 30))
          ) {
            if (current.started) engine.render(t, !current.captions);
            else
              engine.render(
                reduced ? 1 : 1 + (now - startedAt) / 1000,
                true,
                true,
              );
            lastDraw = now;
            current.dirty = false;
          }
          if (current.started) {
            const tick = Math.floor(t * 8);
            if (tick !== lastUI) {
              lastUI = tick;
              setTime(t);
            }
            const li = engine.lineAt(t);
            if (li !== lastLine) {
              lastLine = li;
              setLine(li);
            }
            if (engine.shotIndex !== lastShot) {
              lastShot = engine.shotIndex;
              setShot(lastShot);
            }
          }
          if (
            player.playing &&
            now - lastInteraction.current > 2800 &&
            !current.hover
          )
            setControlsVisible(false);
        };
        raf = requestAnimationFrame(renderLoop);
        const capture = (
          t: number,
          clean = false,
          cover = false,
          width = 1600,
        ) => {
          if (!engine || !alive) return "";
          const { w, h } = sizeRef.current;
          engine.setSize(width, (width * 9) / 16);
          engine.render(t, clean, cover);
          const url = canvasRef.current!.toDataURL("image/jpeg", 0.94);
          engine.setSize(w, h);
          current.dirty = true;
          return url;
        };
        (window as unknown as { __mv: unknown }).__mv = {
          ready: () => !!engine?.ready,
          render: (t: number, clean = false, width = 1280) =>
            capture(t, clean, false, width),
          cover: (t = 1) => capture(t, true, true),
          seek: (t: number) => {
            player.seek(t);
            current.started = true;
            current.dirty = true;
            setStarted(true);
            setTime(t);
          },
          state: () => ({
            playing: player.playing,
            time: player.time(),
            audioReady: !!player.buf,
            shot: engine?.shotIndex,
            duration: player.duration,
            captions: current.captions,
            muted: player.muted,
            volume: player.volume,
          }),
          shots: SHOTS,
        };
      } catch (e) {
        if (alive) {
          setPhase("error");
          setError(e instanceof Error ? e.message : String(e));
        }
      }
    })();
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      observer?.disconnect();
      engine?.dispose();
      player.dispose();
    };
  }, []);

  const wake = useCallback(() => {
    lastInteraction.current = performance.now();
    setControlsVisible(true);
  }, []);
  const begin = useCallback(
    async (at?: number) => {
      const p = playerRef.current;
      if (!p || phase !== "ready") return;
      try {
        const from = at ?? (p.time() >= DURATION - 0.15 ? 0 : p.time());
        await p.play(from);
        stateRef.current.started = true;
        stateRef.current.dirty = true;
        setStarted(true);
        setPlaying(true);
        setTime(from);
        setNotice("");
        wake();
      } catch {
        setNotice("声音暂时无法播放，请再点一次播放。");
      }
    },
    [phase, wake],
  );
  const toggle = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    if (p.playing) {
      p.pause();
      setPlaying(false);
      stateRef.current.dirty = true;
      wake();
    } else void begin();
  }, [begin, wake]);
  const seek = useCallback(
    (t: number) => {
      if (phase !== "ready") return;
      const value = Math.max(0, Math.min(DURATION - 0.04, t));
      playerRef.current?.seek(value);
      stateRef.current.started = true;
      stateRef.current.dirty = true;
      setStarted(true);
      setTime(value);
      wake();
    },
    [phase, wake],
  );
  const jump = useCallback(
    (t: number) => {
      void begin(t);
    },
    [begin],
  );
  const next = useCallback(
    (direction: number) => {
      const p = playerRef.current;
      if (!p) return;
      const starts = SECTIONS.map((s) => s.t);
      const target =
        direction > 0
          ? starts.find((t) => t > p.time() + 0.1)
          : [...starts].reverse().find((t) => t < p.time() - 1.4);
      seek(target ?? (direction > 0 ? DURATION - 0.04 : 0));
    },
    [seek],
  );
  const changeMute = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    const m = !p.muted;
    p.setMuted(m);
    setMuted(m);
    wake();
  }, [wake]);
  const changeCaptions = useCallback(() => {
    stateRef.current.captions = !stateRef.current.captions;
    stateRef.current.dirty = true;
    setCaptions(stateRef.current.captions);
    wake();
  }, [wake]);
  const changeFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (cinemaRef.current?.requestFullscreen)
        await cinemaRef.current.requestFullscreen();
      else setNotice("此浏览器不支持全屏，可横屏观看。");
      wake();
    } catch {
      setNotice("全屏未能开启，可横屏观看。");
    }
  }, [wake]);
  const openDetails = useCallback((value: Tab) => {
    setTab(value);
    detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    const onFull = () => {
      setFullscreen(!!document.fullscreenElement);
      stateRef.current.dirty = true;
    };
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        /INPUT|TEXTAREA|SELECT|BUTTON/.test(target.tagName) ||
        target.isContentEditable
      )
        return;
      const p = playerRef.current;
      if (e.code === "Space") {
        e.preventDefault();
        toggle();
      } else if (e.code === "ArrowRight" || e.code === "ArrowLeft") {
        e.preventDefault();
        seek((p?.time() ?? 0) + (e.code === "ArrowRight" ? 5 : -5));
      } else if (e.code === "ArrowDown" || e.code === "ArrowUp") {
        e.preventDefault();
        const t = p?.time() ?? 0;
        const at =
          e.code === "ArrowDown"
            ? LYRICS.find((l) => l.t[0] > t + 0.5)?.t[0]
            : [...LYRICS].reverse().find((l) => l.t[0] < t - 1)?.t[0];
        seek(at !== undefined ? at - 0.3 : 0);
      } else if (e.code === "KeyM") changeMute();
      else if (e.code === "KeyF") void changeFullscreen();
      else if (e.code === "KeyC") changeCaptions();
    };
    document.addEventListener("fullscreenchange", onFull);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("fullscreenchange", onFull);
      window.removeEventListener("keydown", onKey);
    };
  }, [toggle, seek, changeMute, changeFullscreen, changeCaptions]);

  useEffect(() => {
    if (!following || tab !== "lyrics" || line < 0) return;
    const list = lyricListRef.current;
    const el = list?.querySelector<HTMLElement>(`[data-line="${line}"]`);
    if (list && el)
      list.scrollTo({
        top:
          el.offsetTop -
          list.offsetTop -
          list.clientHeight / 2 +
          el.clientHeight / 2,
        behavior: "smooth",
      });
  }, [line, tab, following]);

  const activeChapter = SECTIONS.findIndex(
    (s, i) => time >= s.t && time < (SECTIONS[i + 1]?.t ?? DURATION),
  );
  const visibleShots = onlyOpening
    ? SHOTS.filter((s) => s.scene === "opening")
    : SHOTS;

  return (
    <div className="app-shell">
      <header className="site-header">
        <a
          className="wordmark"
          href="#"
          aria-label="newday 首页"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <svg
            width="29"
            height="29"
            viewBox="0 0 32 32"
            fill="none"
            aria-hidden="true"
          >
            <circle
              cx="16"
              cy="16"
              r="13"
              stroke="currentColor"
              strokeWidth="1.3"
            />
            <circle
              cx="16"
              cy="16"
              r="8"
              stroke="currentColor"
              strokeWidth="0.8"
            />
            <circle cx="16" cy="16" r="2.5" fill="currentColor" />
            <path
              d="M7 17a9 9 0 0 1 9-10m9 8a9 9 0 0 1-9 10"
              stroke="currentColor"
              strokeWidth="1.3"
            />
          </svg>
          <span>
            newday<span className="wordmark-dot">.</span>
          </span>
          <span className="wordmark-caption">鲸鱼娘的音乐宇宙</span>
        </a>
        <nav aria-label="页面导航">
          <a href="#film" className="nav-active">
            音乐影像
          </a>
          <button onClick={() => openDetails("storyboard")}>创作手记</button>
          <button onClick={() => openDetails("cast")}>
            认识她们 <Icon name="chevron" size={12} />
          </button>
        </nav>
      </header>
      <main>
        <section
          id="film"
          ref={cinemaRef}
          className={`cinema ${started ? "is-started" : "is-cover"} ${fullscreen ? "is-fullscreen" : ""}`}
          aria-label="情歌 MV 播放器"
        >
          <div
            ref={screenRef}
            className="film-screen"
            onPointerMove={wake}
            onPointerDown={wake}
            style={{
              cursor:
                fullscreen && playing && !controlsVisible ? "none" : undefined,
            }}
          >
            <div className="cover-backdrop" aria-hidden="true" />
            <canvas
              ref={canvasRef}
              className={
                loadedVisual ? "scene-canvas is-visible" : "scene-canvas"
              }
              onClick={() => started && toggle()}
              aria-label="情歌三维音乐影像"
            />
            {!started && (
              <div className="film-intro">
                <div className="intro-copy">
                  <p className="eyebrow">
                    <span /> A LITTLE LOVE SONG
                  </p>
                  <h1>情歌</h1>
                  <p className="intro-sentence">把回忆，唱成下一首歌。</p>
                  <div className="intro-actions">
                    <button
                      className="primary-play"
                      onClick={() => void begin(0)}
                      disabled={phase !== "ready"}
                    >
                      <Icon name="play" size={18} />
                      {phase === "loading"
                        ? `正在准备 ${progress}%`
                        : phase === "error"
                          ? "暂时无法播放"
                          : "播放完整 MV"}
                      {phase === "ready" && (
                        <span className="button-duration">04:21</span>
                      )}
                    </button>
                    <button
                      className="text-link"
                      onClick={() => jump(LYRICS[0].t[0] - 0.3)}
                      disabled={phase !== "ready"}
                    >
                      从第一句开始 <Icon name="chevron" size={14} />
                    </button>
                  </div>
                  <p className="intro-credit">
                    原唱 梁静茹 <i /> 鲸鱼娘番外影像
                  </p>
                </div>
                <span className="intro-bottom">留在歌里的，都是好时光。</span>
              </div>
            )}
            {phase === "error" && (
              <div className="player-error" role="alert">
                <p>画面未能加载</p>
                <small>{error}</small>
                <button onClick={() => window.location.reload()}>
                  重新加载
                </button>
              </div>
            )}
            {notice && (
              <div className="player-notice" role="status">
                {notice}
                <button onClick={() => setNotice("")} aria-label="关闭提示">
                  <Icon name="close" size={15} />
                </button>
              </div>
            )}
            {silent && phase === "ready" && (
              <div className="audio-warning" role="status">
                音轨暂时无法解码，当前为无声预览。
                <button onClick={() => window.location.reload()}>
                  重试声音
                </button>
              </div>
            )}
            {ended && (
              <div className="end-screen">
                <p className="eyebrow">THE END · A NEW BEGINNING</p>
                <h2>还有下一首情歌。</h2>
                <button className="primary-play" onClick={() => jump(0)}>
                  <Icon name="replay" size={18} /> 再听一次
                </button>
              </div>
            )}
            {started && !playing && !ended && phase === "ready" && (
              <button
                className="paused-play"
                aria-label="继续播放"
                onClick={() => void begin()}
              >
                <Icon name="play" size={28} />
              </button>
            )}
          </div>
          <div
            className={`transport ${fullscreen && playing && !controlsVisible ? "transport-hidden" : ""}`}
            onPointerEnter={() => {
              stateRef.current.hover = true;
              wake();
            }}
            onPointerLeave={() => {
              stateRef.current.hover = false;
              wake();
            }}
          >
            <div
              className="seek-track"
              style={
                { "--progress": `${(time / DURATION) * 100}%` } as CSSProperties
              }
            >
              <div className="seek-fill" />
              <div className="chapter-marks" aria-hidden="true">
                {SECTIONS.slice(1).map((s) => (
                  <i key={s.t} style={{ left: `${(s.t / DURATION) * 100}%` }} />
                ))}
              </div>
              <input
                aria-label="播放进度"
                type="range"
                min="0"
                max={DURATION - 0.04}
                step="0.1"
                value={time}
                onChange={(e) => seek(Number(e.target.value))}
                disabled={phase !== "ready"}
              />
            </div>
            <div className="transport-row">
              <div className="transport-main">
                <button
                  className="icon-button skip-button"
                  onClick={() => next(-1)}
                  aria-label="上一章节"
                  disabled={phase !== "ready"}
                >
                  <Icon name="back" size={16} />
                </button>
                <button
                  className="icon-button play-control"
                  onClick={toggle}
                  aria-label={playing ? "暂停" : "播放"}
                  disabled={phase !== "ready"}
                >
                  <Icon name={playing ? "pause" : "play"} size={22} />
                </button>
                <button
                  className="icon-button skip-button"
                  onClick={() => next(1)}
                  aria-label="下一章节"
                  disabled={phase !== "ready"}
                >
                  <Icon name="next" size={16} />
                </button>
                <span className="timecode">
                  {fmt(time)} <span>/ {fmt(DURATION)}</span>
                </span>
                <span className="transport-divider" />
                <span className="now-playing">
                  {started ? SHOTS[shot]?.label : "情歌"}
                  <span>{started ? "" : "一段关于回忆与释怀的旅程"}</span>
                </span>
              </div>
              <div className="transport-options">
                <div className="sound-control">
                  <button
                    className="icon-button"
                    aria-label={muted ? "取消静音" : "静音"}
                    onClick={changeMute}
                  >
                    <Icon
                      name={muted || volume === 0 ? "mute" : "sound"}
                      size={18}
                    />
                  </button>
                  <input
                    aria-label="音量"
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={muted ? 0 : volume}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      setVolume(n);
                      setMuted(false);
                      playerRef.current?.setMuted(false);
                      playerRef.current?.setVolume(n);
                    }}
                  />
                </div>
                <button
                  className={`icon-button ${captions ? "is-selected" : ""}`}
                  aria-label={captions ? "关闭三维字幕" : "开启三维字幕"}
                  aria-pressed={captions}
                  title="三维字幕 (C)"
                  onClick={changeCaptions}
                >
                  <Icon name="captions" size={20} />
                </button>
                <button
                  className="icon-button"
                  aria-label={fullscreen ? "退出全屏" : "全屏观看"}
                  title="全屏 (F)"
                  onClick={() => void changeFullscreen()}
                >
                  <Icon name={fullscreen ? "close" : "expand"} size={19} />
                </button>
              </div>
            </div>
          </div>
        </section>
        <section
          ref={detailRef}
          id="notes"
          className="film-details"
          aria-label="歌词、分镜与人物"
        >
          <div className="details-navigation">
            <div className="detail-tabs" role="tablist" aria-label="影像详情">
              {(
                [
                  ["lyrics", "随歌看词"],
                  ["storyboard", "镜头手记"],
                  ["cast", "登场人物"],
                ] as [Tab, string][]
              ).map(([key, label]) => (
                <button
                  key={key}
                  id={`tab-${key}`}
                  role="tab"
                  aria-selected={tab === key}
                  aria-controls={`panel-${key}`}
                  onClick={() => setTab(key)}
                >
                  {label}
                </button>
              ))}
            </div>
            <span className="keyboard-hint">
              <kbd>空格</kbd> 播放 / 暂停 <span /> 戴上耳机，进入故事
            </span>
          </div>
          {tab === "lyrics" && (
            <div
              id="panel-lyrics"
              role="tabpanel"
              aria-labelledby="tab-lyrics"
              className="lyrics-layout"
            >
              <div className="section-introduction">
                <p className="eyebrow">WORDS THAT STAY</p>
                <h2>
                  有些话，
                  <br />
                  只有歌记得。
                </h2>
                <p>
                  让每一个字落在旋律里。
                  <br />
                  点击歌词，回到那一刻。
                </p>
                <button
                  className={`follow-toggle ${following ? "is-on" : ""}`}
                  aria-pressed={following}
                  onClick={() => setFollowing(!following)}
                >
                  <span />
                  {following ? "跟随播放" : "自由浏览"}
                </button>
              </div>
              <div className="lyric-panel">
                <div className="lyric-section-picker">
                  <label htmlFor="chapter-picker">选择乐章</label>
                  <select
                    id="chapter-picker"
                    value={activeChapter < 0 ? 0 : activeChapter}
                    onChange={(e) => jump(SECTIONS[Number(e.target.value)].t)}
                  >
                    {SECTIONS.map((s, i) => (
                      <option key={s.t} value={i}>
                        {s.name} · {fmt(s.t)}
                      </option>
                    ))}
                  </select>
                </div>
                <div
                  className="lyric-list"
                  ref={lyricListRef}
                  tabIndex={0}
                  aria-label="完整歌词"
                >
                  {LYRICS.map((l, i) => {
                    let ci = 0;
                    const active = i === line;
                    return (
                      <button
                        key={i}
                        data-line={i}
                        onClick={() => jump(l.t[0] - 0.3)}
                        className={`lyric-line ${active ? "is-current" : ""}`}
                        aria-current={active ? "true" : undefined}
                      >
                        <span className="lyric-time">{fmt(l.t[0])}</span>
                        <span className="lyric-text">
                          {lineWords[i].map((word, wi) => (
                            <span
                              key={wi}
                              className={
                                word.key ? "lyric-word keyword" : "lyric-word"
                              }
                            >
                              {[...word.text].map((char) => {
                                const k = ci++;
                                return (
                                  <span
                                    key={k}
                                    className={
                                      active && time >= l.t[k] ? "is-sung" : ""
                                    }
                                  >
                                    {char}
                                  </span>
                                );
                              })}
                            </span>
                          ))}
                        </span>
                        <span className="line-play">
                          <Icon name="play" size={14} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          {tab === "storyboard" && (
            <div
              id="panel-storyboard"
              role="tabpanel"
              aria-labelledby="tab-storyboard"
              className="storyboard-panel"
            >
              <div className="storyboard-heading">
                <div>
                  <p className="eyebrow">BEHIND THE FRAMES</p>
                  <h2>从一滴回忆，走进一首歌。</h2>
                  <p>不是重放同一个故事，而是给歌词一个新的世界。</p>
                </div>
                <div className="shot-filter" aria-label="分镜范围">
                  <button
                    className={onlyOpening ? "active" : ""}
                    onClick={() => setOnlyOpening(true)}
                  >
                    开场序章
                  </button>
                  <button
                    className={!onlyOpening ? "active" : ""}
                    onClick={() => setOnlyOpening(false)}
                  >
                    完整分镜
                  </button>
                </div>
              </div>
              <div className="shot-list">
                {visibleShots.map((s) => {
                  const i = SHOTS.indexOf(s);
                  return (
                    <button
                      key={s.a}
                      className={`shot-item ${shot === i && started ? "is-current" : ""}`}
                      onClick={() => jump(s.a)}
                    >
                      <span className="shot-number">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="shot-name">
                        {s.label.replace("序章 · ", "")}
                        <small>
                          {s.line ? LYRICS[s.line - 1].text : "回忆序章 · 前奏"}
                        </small>
                      </span>
                      <span className="shot-timing">
                        {fmt(s.a)} <span>至</span> {fmt(s.b)}
                      </span>
                      <Icon name="play" size={16} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {tab === "cast" && (
            <div
              id="panel-cast"
              role="tabpanel"
              aria-labelledby="tab-cast"
              className="cast-panel"
            >
              <div className="storyboard-heading">
                <div>
                  <p className="eyebrow">THE FAMILIAR FACES</p>
                  <h2>熟悉的她们，新的故事。</h2>
                  <p>沿用分支中的八位像素角色，不改变原有造型。</p>
                </div>
              </div>
              <div className="cast-grid">
                {CAST.map((c) => (
                  <article className="cast-member" key={c.id}>
                    <div className="cast-portrait">
                      <Sprite
                        id={c.id}
                        action={c.action}
                        height={c.id === "gpt" ? 102 : 82}
                      />
                    </div>
                    <div>
                      <h3>
                        {c.name} <span>{c.role}</span>
                      </h3>
                      <p>{c.description}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
      <footer className="site-footer">
        <span>
          newday. <span>让小小的世界，有一首自己的歌。</span>
        </span>
        <small>非商业同人预览 · 字幕沿用自动对齐结果，待人工复核</small>
        <a href="#film">
          回到影像 <Icon name="chevron" size={12} />
        </a>
      </footer>
    </div>
  );
}
