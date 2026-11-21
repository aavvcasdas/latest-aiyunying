import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { SERIF_WOFF2_B64 } from "./assets/fontData";
import { Player } from "./audio";
import { Cast } from "./cast";
import { DUR } from "./lyrics";
import Overlay from "./Overlay";
import { MvRenderer, W } from "./scenes";
import Subtitles3D from "./Subtitles3D";

/** 歌词字体：内嵌的 Noto Serif SC 子集。载入失败就退回系统宋体，不影响播放。 */
async function loadFont(): Promise<void> {
  try {
    const ff = new FontFace("MVSong", `url(data:font/woff2;base64,${SERIF_WOFF2_B64})`, { weight: "400 900" });
    await ff.load();
    document.fonts.add(ff);
  } catch {
    /* 系统字体兜底 */
  }
}

interface DebugHook {
  ready: () => boolean;
  go: (at: number) => void;
  freeze: (at: number) => void;
  seek: (at: number) => void;
}

export default function App() {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<MvRenderer | null>(null);
  const playerRef = useRef<Player | null>(null);
  if (!playerRef.current) playerRef.current = new Player();
  const player = playerRef.current;

  const tRef = useRef(0);
  const startedRef = useRef(false);
  const hitAt = useRef(0);
  const moveAt = useRef(0);

  const [ready, setReady] = useState(false);
  const [loadErr, setLoadErr] = useState("");
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [busy, setBusy] = useState(false);
  const [t, setT] = useState(0);
  const [muted, setMuted] = useState(false);
  const [subsOn, setSubsOn] = useState(true);
  const [silent, setSilent] = useState(false);
  const [idle, setIdle] = useState(false);
  const [unit, setUnit] = useState(1);

  // 字体 + 角色图集（都内嵌在页面里，不发网络请求）
  useEffect(() => {
    let dead = false;
    void loadFont();
    Cast.load()
      .then((cast) => {
        if (dead || !canvasRef.current) return;
        rendererRef.current = new MvRenderer(canvasRef.current, cast);
        setReady(true);
      })
      .catch((e: unknown) => {
        if (!dead) setLoadErr(e instanceof Error ? e.message : String(e));
      });
    return () => {
      dead = true;
    };
  }, []);

  // 舞台单位：1280 宽时 --u = 1px，字幕和 HUD 都按它等比缩放
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      if (el.clientWidth > 2) setUnit(el.clientWidth / W);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const begin = useCallback(() => {
    startedRef.current = true;
    setStarted(true);
  }, []);

  // 主循环：音频时钟 → 画面 + 字幕
  useEffect(() => {
    let raf = 0;
    let lastDrawn = -1;
    const loop = () => {
      const r = rendererRef.current;
      if (!startedRef.current) {
        r?.renderTitle(performance.now() / 1000);
      } else {
        let now = player.playing ? player.time() : tRef.current;
        if (player.playing && now >= DUR) {
          player.pause();
          player.seek(DUR);
          now = DUR;
          setPlaying(false);
        }
        tRef.current = now;
        // A paused export frame is static: redraw only when its timestamp changes, rather than
        // rerendering the canvas and every React overlay at display refresh rate.
        if (player.playing || Math.abs(now - lastDrawn) > 0.0001) {
          r?.render(now, Math.exp(-(performance.now() - hitAt.current) / 180));
          lastDrawn = now;
          setT(now);
        }
        if (player.playing) setIdle(performance.now() - moveAt.current > 2200);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [player]);

  useEffect(() => {
    player.onEnded = () => {
      tRef.current = DUR;
      setT(DUR);
      setPlaying(false);
    };
  }, [player]);

  const handleStart = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    await player.load();
    setSilent(player.silent);
    setBusy(false);
    tRef.current = 0;
    moveAt.current = performance.now();
    begin();
    await player.play(0);
    setPlaying(true);
  }, [busy, player, begin]);

  const handleReplay = useCallback(() => {
    player.pause();
    tRef.current = 0;
    moveAt.current = performance.now();
    void player.play(0);
    setPlaying(true);
  }, [player]);

  const handleToggle = useCallback(() => {
    if (!startedRef.current) return;
    if (player.playing) {
      player.pause();
      setPlaying(false);
    } else if (tRef.current >= DUR - 0.1) {
      handleReplay();
    } else {
      void player.play(tRef.current);
      setPlaying(true);
    }
  }, [player, handleReplay]);

  const handleSeek = useCallback(
    (x01: number) => {
      const nt = Math.min(DUR - 0.05, x01 * DUR);
      player.seek(nt);
      tRef.current = nt;
      setT(nt);
    },
    [player],
  );

  const handleMute = useCallback(() => {
    setMuted((m) => {
      player.setMuted(!m);
      return !m;
    });
  }, [player]);

  const handleHit = useCallback((x01: number, y01: number, hue: number) => {
    hitAt.current = performance.now();
    rendererRef.current?.hit(x01, y01, hue);
  }, []);

  // 空格：播放 / 暂停
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        handleToggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleToggle]);

  // 截图 / 调试钩子：__mv.go(t) 以无声时钟从 t 播放；__mv.freeze(t) 定格在 t
  useEffect(() => {
    const w = window as unknown as { __mv?: DebugHook };
    w.__mv = {
      ready: () => !!rendererRef.current,
      go: (at: number) => {
        player.silent = true;
        setSilent(false);
        begin();
        tRef.current = at;
        void player.play(at);
        setPlaying(true);
      },
      freeze: (at: number) => {
        player.pause();
        player.seek(at);
        tRef.current = at;
        setT(at);
        setPlaying(false);
      },
      seek: (at: number) => {
        player.silent = true;
        player.pause();
        player.seek(Math.max(0, Math.min(DUR - 0.001, at)));
        tRef.current = at;
        begin();
        setT(at);
        setPlaying(false);
      },
    };
    return () => {
      delete w.__mv;
    };
  }, [player, begin]);

  return (
    <div className="app-root">
      <div
        ref={stageRef}
        className={"stage" + (idle ? " is-idle" : "")}
        style={{ "--u": `${unit}px` } as CSSProperties}
        onMouseMove={() => {
          moveAt.current = performance.now();
        }}
      >
        <canvas ref={canvasRef} />
        {started && subsOn && <Subtitles3D t={t} onHit={handleHit} />}
        <Overlay
          t={t}
          ready={ready}
          loadErr={loadErr}
          started={started}
          playing={playing}
          busy={busy}
          muted={muted}
          subsOn={subsOn}
          silent={silent}
          onStart={handleStart}
          onToggle={handleToggle}
          onReplay={handleReplay}
          onSeek={handleSeek}
          onMute={handleMute}
          onSubs={() => setSubsOn((v) => !v)}
        />
      </div>
    </div>
  );
}
