import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CUES } from "@/data/cues";
import { CAST, CAST_ORDER } from "@/data/cast";
import { FH, FPS, FW, LOOKS, fmtTime, type Cue } from "@/lib/mv";
import { useMVPlayer } from "@/hooks/useMVPlayer";
import { StageView } from "@/components/StageView";
import { LyricBar, type LyricTone } from "@/components/LyricBar";
import { LyricCanvas, drawCard } from "@/lib/lyricCanvas";
import { Chip, SidePanel, TopBar, Transport, type Tab } from "@/components/Hud";

declare global {
  interface Window {
    /** 出片桥：渲染模式（?render=1）下，外部逐帧驱动 */
    __mv?: {
      ready: boolean;
      fps: number;
      duration: number;
      cues: number;
      /** 把画面推到 t 秒这一帧，返回合成好的 JPEG（不落盘，交给出片脚本） */
      capture: (t: number) => Promise<Blob | null>;
    };
  }
}

export default function App() {
  const p = useMVPlayer();
  const render = p.renderMode;
  const cue = CUES[p.cueIndex];
  const look = LOOKS[cue.shot.look];

  const [started, setStarted] = useState(false);
  const [stageReady, setStageReady] = useState(false);
  const [panel, setPanel] = useState(false);
  /* 出片开关：字幕条开、立体字牌开、特效开、不加「下一句」提示 */
  const [renderToggles] = useState(() => ({ subtitles: true, karaoke: false, words3d: false, fxOn: true, wordMark: true }));
  const [tab, setTab] = useState<Tab>("cues");
  const [tone, setTone] = useState<LyricTone>("gold");
  const [karaoke, setKaraoke] = useState(true); /* 出片时关掉「下一句」提示 */
  const [subtitles, setSubtitles] = useState(true);
  const [words3d, setWords3d] = useState(true);
  const [wordMark, setWordMark] = useState(true);
  const [showTags, setShowTags] = useState(false);
  const [fxOn, setFxOn] = useState(true);
  const [fit, setFit] = useState(0.42);

  const wrapRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);
  const flashRef = useRef<HTMLDivElement | null>(null);
  const workRef = useRef<HTMLSpanElement | null>(null);
  const pointer = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const rootRef = useRef<HTMLDivElement | null>(null);

  /* 图集最迟 4 秒后放行（图集随页面内嵌，正常一瞬就好） */
  useEffect(() => {
    const id = window.setTimeout(() => setStageReady(true), 4000);
    return () => window.clearTimeout(id);
  }, []);

  /* 画面按 1600×900 画，再整体缩放贴屏 */
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    if (render) {
      setFit(1); // 出片：画框按 1:1 铺满 1600×900 视口
      return;
    }
    const measure = () => {
      const r = el.getBoundingClientRect();
      setFit(Math.max(0.2, Math.min(r.width / FW, r.height / FH)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [panel, render]);

  /* 每帧：能量写进 CSS 变量、烧录工作样片时码 */
  useEffect(() => {
    return p.subscribe((t, e) => {
      frameRef.current?.style.setProperty("--energy", e.toFixed(3));
      if (flashRef.current && cue.shot.flash) {
        const lt = t - cue.start;
        const o = lt >= 0 && lt < 0.46 ? 0.95 * (1 - lt / 0.46) : 0;
        flashRef.current.style.opacity = String(Math.max(0, o));
      }
      if (workRef.current) {
        workRef.current.textContent = `SHOT ${String(cue.i + 1).padStart(2, "0")} · ${fmtTime(t)} · LOOK ${cue.shot.look} · ${look.name} · SET ${cue.shot.set}`;
      }
    });
  }, [p, cue, look]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const r = wrapRef.current?.getBoundingClientRect();
    if (!r) return;
    pointer.current.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.current.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
  }, []);

  const start = useCallback(() => {
    setStarted(true);
    if (render) return; // 渲染模式没有音频，时间由外部给
    p.play();
    if (p.anchors.length === 0 && p.offset === 0) void p.autoAlign();
  }, [p, render]);

  /* ---------------- 出片合成：3D 画布 + 字卡 + 字幕 → 一张 canvas ---------------- */
  const lyricRef = useRef<LyricCanvas | null>(null);
  const compRef = useRef<{ cv: HTMLCanvasElement; g: CanvasRenderingContext2D } | null>(null);

  useEffect(() => {
    if (!render) return;
    const cv = document.createElement("canvas");
    cv.width = FW;
    cv.height = FH;
    const g = cv.getContext("2d", { alpha: false });
    if (!g) return;
    compRef.current = { cv, g };
    const lc = new LyricCanvas(cv);
    lyricRef.current = lc;
    void lc.loadFonts();
    return () => {
      compRef.current = null;
      lyricRef.current = null;
    };
  }, [render]);

  /* 出片桥：外部逐帧驱动（详见 tools/shoot_bb.mjs）
   *
   * 出片不靠 DOM 叠层，也不靠 React 的提交时序：
   *   · 镜头由这里按时间直接算，命中切点就同步 stage.setCue，省掉一帧延迟
   *   · 字幕 / 字卡 / 闪白 / 呼吸光全部画进同一张 2D canvas
   *   · 结果以 JPEG blob 交出去（脚本走 HTTP 收，不过 CDP 序列化）
   */
  const stageOf = () =>
    (window as unknown as { __stage?: { setCue: (c: Cue, force?: boolean) => void } }).__stage;
  const bridgeRef = useRef<{ lastCue: number }>({ lastCue: -1 });

  useEffect(() => {
    if (!render || !stageReady) return;
    const raf = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

    const pick = (t: number) => {
      let idx = 0;
      for (let k = 0; k < CUES.length; k++) {
        if (t >= CUES[k].start) idx = k;
        else break;
      }
      return idx;
    };

    const capture = async (t: number): Promise<Blob | null> => {
      const comp = compRef.current;
      if (!comp) return null;
      const { cv, g } = comp;

      // 1) 镜头：切点同步切，不等 React
      const idx = pick(t);
      const c = CUES[idx];
      if (bridgeRef.current.lastCue !== idx) {
        bridgeRef.current.lastCue = idx;
        stageOf()?.setCue(c, true);
      }

      // 2) 时间 + 能量推进一帧（subscribers 会把 stage.update 跑完、画布画好）
      p.setRenderFrame(t, 0);
      await raf(); // 让 WebGL 把这一帧真正交出去

      // 3) 合成
      const src = frameRef.current?.querySelector("canvas") as HTMLCanvasElement | null;
      if (!src) return null;
      const e = p.getEnergy();
      const look = LOOKS[c.shot.look];

      g.fillStyle = "#0c0819";
      g.fillRect(0, 0, FW, FH);
      g.drawImage(src, 0, 0, FW, FH);

      // 能量呼吸光
      const grad = g.createRadialGradient(FW / 2, FH * 0.78, 0, FW / 2, FH * 0.78, FW * 0.55);
      grad.addColorStop(0, look.light);
      grad.addColorStop(1, "rgba(0,0,0,0)");
      g.save();
      g.globalCompositeOperation = "screen";
      g.globalAlpha = Math.min(1, 0.03 + e * 0.18);
      g.fillStyle = grad;
      g.fillRect(0, 0, FW, FH);
      g.restore();

      // 片内字卡
      if (c.shot.card) drawCard(g, c.shot.card, c.i === 0, look);

      // 切镜闪白 / 渐黑
      if (c.shot.flash) {
        const lt = t - c.start;
        if (lt >= 0 && lt < 0.46) {
          g.save();
          g.globalAlpha = 0.95 * (1 - lt / 0.46);
          g.fillStyle = c.shot.flash === "white" ? "#fff8ea" : "#08050f";
          g.fillRect(0, 0, FW, FH);
          g.restore();
        }
      }

      // 暗角
      const vg = g.createRadialGradient(FW / 2, FH * 0.45, 0, FW / 2, FH * 0.45, FW * 0.72);
      vg.addColorStop(0, "rgba(12,7,26,0)");
      vg.addColorStop(0.4, "rgba(12,7,26,0)");
      vg.addColorStop(1, "rgba(12,7,26,.55)");
      g.fillStyle = vg;
      g.fillRect(0, 0, FW, FH);

      // 字幕条压在最上层（纸条本身自带底色，不会被暗角吃掉）
      lyricRef.current?.draw(c, t, e);

      return new Promise<Blob | null>((res) => cv.toBlob((b) => res(b), "image/jpeg", 0.94));
    };

    window.__mv = {
      ready: true,
      fps: FPS,
      duration: p.duration,
      cues: CUES.length,
      capture,
    };
    return () => {
      window.__mv = undefined;
      bridgeRef.current.lastCue = -1;
    };
  }, [render, stageReady, p]);

  /* 渲染模式：不用点开场卡，直接把画面交给出片桥 */
  useEffect(() => {
    if (!render) return;
    setStarted(true);
    setKaraoke(renderToggles.karaoke);
    setWords3d(renderToggles.words3d);
    setFxOn(renderToggles.fxOn);
    setWordMark(renderToggles.wordMark);
    setSubtitles(renderToggles.subtitles);
    setStageReady(true);
  }, [render, renderToggles]);

  const fullscreen = useCallback(() => {
    const el = rootRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.code === "Space") {
        e.preventDefault();
        if (!started) start();
        else p.toggle();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        p.seek(p.getTime() + (e.shiftKey ? 15 : 5));
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        p.seek(p.getTime() - (e.shiftKey ? 15 : 5));
      } else if (e.code === "ArrowDown") {
        e.preventDefault();
        p.stepCue(1);
      } else if (e.code === "ArrowUp") {
        e.preventDefault();
        p.stepCue(-1);
      } else if (e.key === "f" || e.key === "F") {
        fullscreen();
      } else if (e.key === "s" || e.key === "S") {
        setSubtitles((v) => !v);
      } else if (e.key === "k" || e.key === "K") {
        setKaraoke((v) => !v);
      } else if (e.key === "w" || e.key === "W") {
        setWords3d((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [p, started, start, fullscreen]);

  const nextCue = useMemo(() => CUES.slice(p.cueIndex + 1).find((c) => c.text) ?? null, [p.cueIndex]);
  const onstage = useMemo(() => CAST_ORDER.filter((id) => cue.shot.cast.some((c) => c.id === id)), [cue]);

  return (
    <div
      ref={rootRef}
      data-render={render ? "1" : undefined}
      className={`flex h-full flex-col overflow-hidden bg-[#120d22]${render ? " render-mode" : ""}`}
    >
      <audio ref={p.audioRef} src={p.src} preload="auto" className="hidden" />

      {!render && <TopBar p={p} cue={cue} onTogglePanel={() => setPanel((v) => !v)} />}

      <div className="relative flex min-h-0 flex-1">
        <main
          ref={wrapRef}
          onPointerMove={onPointerMove}
          onPointerLeave={() => {
            pointer.current.tx = 0;
            pointer.current.ty = 0;
          }}
          className="relative min-w-0 flex-1 overflow-hidden"
          style={{
            background: `radial-gradient(120% 100% at 50% 0%, ${look.swatch[0]}66, #0c0819 70%)`,
            transition: "background 700ms linear",
          }}
        >
          <div className="absolute inset-0 grid place-items-center">
            <div
              ref={frameRef}
              data-frame
              className="grain relative overflow-hidden"
              style={{
                width: FW,
                height: FH,
                transform: `scale(${fit})`,
                transformOrigin: "center center",
                borderRadius: 4,
                background: "#0c0819",
                boxShadow: `0 40px 120px rgba(0,0,0,.65), 0 0 0 1px rgba(255,209,102,.16), 0 0 calc(60px + var(--energy,0) * 120px) ${look.light}22`,
                transition: "box-shadow 300ms linear",
              }}
            >
              <StageView p={p} cue={cue} fxOn={fxOn} words3d={words3d} showTags={showTags} pointer={pointer} onReady={() => setStageReady(true)} />

              {/* 能量呼吸光 */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background: `radial-gradient(70% 55% at 50% 78%, ${look.light}, transparent 70%)`,
                  opacity: "calc(.03 + var(--energy,0) * .18)",
                  mixBlendMode: "screen",
                }}
              />

              {/* 字卡（前奏 / 间奏 / 落幅） */}
              {cue.shot.card && (
                <div key={cue.i} className="reveal pointer-events-none absolute inset-x-0 top-[13%] flex flex-col items-center">
                  <div
                    className="font-display px-10 py-5 text-center"
                    style={{
                      fontSize: cue.i === 0 ? 96 : 62,
                      letterSpacing: cue.i === 0 ? 14 : 8,
                      color: "#fff6d8",
                      textShadow: `0 3px 0 ${look.ink}, 0 6px 0 ${look.ink}aa, 0 16px 40px rgba(8,4,20,.6)`,
                      transform: "rotate(-1.2deg)",
                    }}
                  >
                    {cue.shot.card.title}
                  </div>
                  {cue.shot.card.sub && (
                    <div
                      className="mt-2 rounded-full border px-5 py-1.5"
                      style={{
                        fontFamily: "var(--display)",
                        fontSize: cue.i === 0 ? 24 : 19,
                        letterSpacing: 6,
                        color: look.paper,
                        borderColor: `${look.light}66`,
                        background: "rgba(16,10,32,.45)",
                        transform: "rotate(0.8deg)",
                      }}
                    >
                      {cue.shot.card.sub}
                    </div>
                  )}
                </div>
              )}

              {subtitles && !render && (
                <LyricBar
                  cue={cue}
                  next={nextCue}
                  getTime={p.getTime}
                  getEnergy={p.getEnergy}
                  tone={tone}
                  karaoke={karaoke}
                  onWord={wordMark}
                  visible={Boolean(cue.text)}
                  paused={!p.playing}
                />
              )}

              {/* 切镜：闪白 / 渐黑（出片模式按时间算，避免逐帧截图把它冻成一层白膜） */}
              {cue.shot.flash && (
                <div
                  key={`f${cue.i}`}
                  ref={flashRef}
                  className="pointer-events-none absolute inset-0"
                  style={
                    render
                      ? { background: cue.shot.flash === "white" ? "#fff8ea" : "#08050f", opacity: 0, zIndex: 70 }
                      : {
                          background: cue.shot.flash === "white" ? "#fff8ea" : "#08050f",
                          animation: "flashWhite 460ms ease-out forwards",
                          zIndex: 70,
                        }
                  }
                />
              )}

              <div className="vignette pointer-events-none absolute inset-0" style={{ zIndex: 55 }} />

              {/* 左侧镜号轨（出片时藏掉） */}
              {!render && (
              <div className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 flex-col gap-[3px]" style={{ zIndex: 74 }}>
                {CUES.map((c) => (
                  <span
                    key={c.i}
                    style={{
                      width: c.i === cue.i ? 16 : 7,
                      height: 3,
                      borderRadius: 2,
                      background: c.i === cue.i ? "#ffd166" : c.i < cue.i ? "rgba(255,224,170,.34)" : "rgba(255,224,170,.14)",
                      transition: "all 260ms ease-out",
                      boxShadow: c.i === cue.i ? "0 0 10px rgba(255,209,102,.8)" : "none",
                    }}
                  />
                ))}
              </div>
              )}

              {/* 工作样片烧录（出片时藏掉） */}
              {!render && (
              <>
              <div className="pointer-events-none absolute bottom-2.5 left-4 flex items-center gap-2" style={{ zIndex: 74 }}>
                <span className="h-2 w-2 rounded-full" style={{ background: p.playing ? "#ff6b6b" : "#7f8db0", boxShadow: p.playing ? "0 0 10px #ff6b6b" : "none" }} />
                <span ref={workRef} className="font-mono-num text-[11px] tracking-[0.16em] text-[rgba(255,246,224,.55)]">
                  SHOT 01 · 0:00.00 · LOOK dusk · 黄昏 · SET shore
                </span>
              </div>
              <div className="pointer-events-none absolute bottom-2.5 right-4 flex items-center gap-2" style={{ zIndex: 74 }}>
                <span className="font-mono-num text-[11px] tracking-[0.16em] text-[rgba(255,246,224,.4)]">three.js · 1600 × 900 · 像素纸片人</span>
              </div>
              </>
              )}

              {/* 开场场记卡 */}
              {!started && !render && (
                <div className="absolute inset-0" style={{ zIndex: 80, background: "radial-gradient(90% 70% at 30% 70%, rgba(10,6,22,.72), rgba(10,6,22,.42))" }}>
                  <div className="paper absolute left-[6%] top-[50%] w-[540px] -rotate-[1.6deg] p-6" style={{ borderRadius: 3, boxShadow: "0 26px 60px rgba(6,3,16,.6)" }}>
                    <div className="flex items-center gap-2 text-[11px] tracking-[0.3em] text-[#7a5a2b]">
                      <span className="inline-block h-[3px] w-8 bg-[#c9922f]" />
                      番外 MV · 复刻 · 立体童话书做法
                    </div>
                    <h2 className="font-display mt-2 text-[64px] leading-[0.95] text-[#241c44]" style={{ textShadow: "0 3px 0 #f0c987, 0 6px 0 #d9a857, 0 12px 22px rgba(80,50,10,.35)" }}>
                      背对背
                      <br />
                      拥抱
                    </h2>
                    <p className="mt-3 text-[13px] leading-relaxed text-[#4a3d63]">
                      照《童话镇》那套：<span className="font-semibold">three.js 搭的立体世界</span>（toon 体块 + 墨线 + 三灯 look）里，立着仓库自带的
                      <span className="font-semibold">像素纸片人</span>；歌词按<span className="font-semibold">字与词</span>做成挂在镜头前的立体字牌，唱到哪张哪张往前顶。
                      全片 {CUES.length} 镜 / {fmtTime(p.duration)}。
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {onstage.length === 0 && <Chip color="#7a5a2b">空镜 · 黄昏纸岸</Chip>}
                      {CAST_ORDER.slice(0, 6).map((id) => (
                        <span key={id} className="rounded-[3px] border border-[#d8bd8c] bg-[#fffaf0] px-2 py-[3px] text-[11px] text-[#5b4326]">
                          {CAST[id].name}
                        </span>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={start}
                      disabled={!stageReady}
                      className="btn mt-5 flex w-full items-center justify-center gap-3 rounded-[4px] border-2 border-[#8a5a12] px-5 py-3 disabled:opacity-60"
                      style={{
                        background: "linear-gradient(180deg,#ffd98a,#f2b64c)",
                        color: "#3a2408",
                        fontFamily: "var(--display)",
                        fontSize: 22,
                        letterSpacing: 8,
                        boxShadow: "0 8px 0 #a9762a, 0 16px 26px rgba(80,50,10,.35)",
                      }}
                    >
                      <svg width="18" height="20" viewBox="0 0 18 20">
                        <path d="M1 1.6 L16.4 10 L1 18.4 Z" fill="currentColor" />
                      </svg>
                      {stageReady ? "放这支片子" : "纸片人装载中…"}
                    </button>
                    <div className="mt-2 text-[11px] tracking-[0.12em] text-[#7a6a4b]">空格 = 播放 / 暂停 · ←→ 跳 5 秒 · ↑↓ 换镜 · W 立体字牌 · S 字幕条 · K 下一句</div>
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[#e2cda4] pt-2 text-[11px] text-[#6c5a3c]">
                      <span>音源：背对背拥抱.m4a（{fmtTime(p.duration)} · 已内嵌）</span>
                      <a className="underline decoration-dotted underline-offset-2 hover:text-[#a3641a]" href="https://github.com/aavvcasdas/latest-aiyunying/blob/arena/bb6a02da-latest-aiyunying/%E8%83%8C%E5%AF%B9%E8%83%8C%E6%8B%A5%E6%8A%B1.mp4" target="_blank" rel="noreferrer">
                        对照原片 mp4
                      </a>
                      <a className="underline decoration-dotted underline-offset-2 hover:text-[#a3641a]" href="https://github.com/aavvcasdas/latest-aiyunying/tree/arena/bb6a02da-latest-aiyunying" target="_blank" rel="noreferrer">
                        素材分支
                      </a>
                    </div>
                  </div>

                  <div className="absolute right-[5%] top-[12%] w-[280px] rotate-[2deg] rounded-[3px] border border-[rgba(255,209,102,.35)] bg-[rgba(16,10,32,.72)] p-3 backdrop-blur-[2px]">
                    <div className="font-display text-[15px] tracking-[0.2em] text-[#ffe9b8]">选角</div>
                    <ul className="mt-2 space-y-1 text-[11.5px] leading-snug text-[rgba(255,244,224,.72)]">
                      <li><span className="text-[#ffd166]">本鲸</span> 主角 · 背对背的那一半</li>
                      <li><span className="text-[#ffd166]">小克</span> 戴金冠 · 先听完再改一个字</li>
                      <li><span className="text-[#ffd166]">Kimi</span> 旧账卷轴 · 翻不完的那条</li>
                      <li><span className="text-[#ffd166]">千问</span> 排顺序 · 这一步不能跳</li>
                      <li><span className="text-[#ffd166]">猫</span> 绕圈 · 真话在圈上跑</li>
                      <li><span className="text-[#ffd166]">豆包</span> 送信 · 把话送到手上</li>
                      <li><span className="text-[#ffd166]">智谱</span> 影子 · 不肯长大的那个</li>
                      <li><span className="text-[#ffd166]">龙娘</span> 烽火 · 立起来又飞走</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {panel && !render && (
          <div className="absolute inset-y-0 right-0 z-40 w-[86vw] max-w-[380px] shrink-0 lg:static lg:z-20 lg:w-[368px] lg:max-w-none">
            <SidePanel p={p} cue={cue} tab={tab} setTab={setTab} />
          </div>
        )}
      </div>

      {!render && (
      <Transport
        p={p}
        tone={tone}
        setTone={setTone}
        karaoke={karaoke}
        setKaraoke={setKaraoke}
        subtitles={subtitles}
        setSubtitles={setSubtitles}
        showTags={showTags}
        setShowTags={setShowTags}
        wordMark={wordMark}
        setWordMark={setWordMark}
        fxOn={fxOn}
        setFxOn={setFxOn}
        words3d={words3d}
        setWords3d={setWords3d}
        onFullscreen={fullscreen}
      />
      )}
    </div>
  );
}
