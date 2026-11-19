import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import atlasUrl from "./assets/atlas.png";
import bgmUrl from "./assets/bgm.mp3";
import fontUrl from "./assets/brush.woff2";
import heavyUrl from "./assets/heavy.woff2";
import { RECTS } from "./mv/atlasData";
import { DURATION, H, LINES, SHOTS, W, init, render, shotIndex } from "./mv";
import Delivery from "./Delivery";

const CAST = [
  { p: "p_whale_neutral", name: "本鲸", role: "「譬如我」——没有天赋的那一个", habit: "先问哪条不能改，再筛；饭先推给更饿的人", acts: "站在灯外看镜头、躺在发霉的枕头上、倒空饭盆、够不着奖杯、在墙角等" },
  { p: "p_gpt_neutral", name: "龙娘", role: "被追光点名的「那一个」", habit: "先接住乱局；进场就压满光", acts: "台上最亮一束光里；追光扫到「那」字停在她头上；悬在奖杯旁边不用跳" },
  { p: "p_claude_neutral", name: "小克", role: "七位天才之一；黎明时第一个走进她角落的人", habit: "先听完再改一个字；表面严格，私下给肥鱼留饭", acts: "「某个角落」走到她旁边；「耗尽天真」把自己那份推过来" },
  { p: "p_kimi", name: "Kimi", role: "七位天才之一", habit: "把漏掉的旧句找回来", acts: "聚光灯站位、故事书头像、黎明时围成半圈" },
  { p: "p_gemini", name: "猫", role: "七位天才之一", habit: "先给两个看法再选一个", acts: "同上" },
  { p: "p_qwen", name: "千问", role: "七位天才之一", habit: "先排哪一步再动手", acts: "同上" },
  { p: "p_zai", name: "狐狸", role: "七位天才之一", habit: "困倦地记账，账不对就醒", acts: "同上" },
  { p: "p_doubao_neutral", name: "豆包", role: "七位天才之一", habit: "先陪着写出开头", acts: "同上" },
];

const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
const clean = typeof location !== "undefined" && /[?&]clean\b/.test(location.search);

function Portrait({ name }: { name: string }) {
  const [x, y, w, h] = RECTS[name];
  const k = 52 / h;
  return (
    <span
      className="pixel block shrink-0 rounded-sm bg-[#e9dcc0]"
      style={{ width: w * k, height: 52, backgroundImage: `url(${atlasUrl})`, backgroundPosition: `-${x * k}px -${y * k}px`, backgroundSize: `${2048 * k}px auto` }}
      aria-hidden
    />
  );
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const ready = useRef(false);
  const noLyric = useRef(false);
  const anchor = useRef({ a: -1, p: 0 });
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState(false);
  const [now, setNow] = useState(0);
  const [hideLyric, setHideLyric] = useState(false);
  const [muted, setMuted] = useState(false);
  const [tab, setTab] = useState<"shots" | "lyrics" | "cast">("shots");

  const draw = useCallback((t: number) => {
    const cv = canvasRef.current;
    if (!cv || !ready.current) return;
    render(cv.getContext("2d")!, t, noLyric.current);
  }, []);

  // 载入：图集 + 字体 → 引擎
  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const img = new Image();
        img.src = atlasUrl;
        const face = new FontFace("MVBrush", `url(${fontUrl})`);
        const heavy = new FontFace("MVHeavy", `url(${heavyUrl})`);
        await Promise.all([img.decode(), face.load().then((f) => document.fonts.add(f)), heavy.load().then((f) => document.fonts.add(f))]);
        if (dead) return;
        init({
          make: (w, h) => {
            const c = document.createElement("canvas");
            c.width = w;
            c.height = h;
            return c;
          },
          atlas: img,
        });
        ready.current = true;
        setLoaded(true);
        draw(0);
      } catch (e) {
        setError(String(e));
      }
    })();
    return () => {
      dead = true;
    };
  }, [draw]);

  // 播放循环：以音频时间为准；两次读数之间用系统时钟补帧，免得画面一顿一顿
  useEffect(() => {
    if (!loaded) return;
    let raf = 0, last = -1, lastUi = -1;
    const tick = () => {
      const a = audioRef.current;
      if (a) {
        let t = a.currentTime;
        if (!a.paused && !a.ended) {
          if (t !== anchor.current.a) anchor.current = { a: t, p: performance.now() };
          else t = Math.min(DURATION, t + (performance.now() - anchor.current.p) / 1000);
        }
        if (t !== last) {
          draw(t);
          // 界面（时间、第几镜、列表高亮）每零点一秒跟一次就够，不必每帧重排
          if (Math.abs(t - lastUi) > 0.09 || a.paused) {
            setNow(t);
            lastUi = t;
          }
          last = t;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [loaded, draw]);

  const seek = useCallback(
    (t: number) => {
      const a = audioRef.current;
      const tt = Math.max(0, Math.min(DURATION - 0.02, t));
      if (a) a.currentTime = tt;
      anchor.current = { a: -1, p: 0 };
      draw(tt);
      setNow(tt);
    },
    [draw],
  );
  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a || !ready.current) return;
    if (a.paused) {
      if (a.currentTime >= DURATION - 0.05) a.currentTime = 0;
      void a.play();
    } else a.pause();
  }, []);

  // 截帧钩子：tools/shoot_vite_mv.mjs 认这两个
  useEffect(() => {
    const w = window as unknown as Record<string, unknown>;
    let off: HTMLCanvasElement | null = null;
    w.__mv = {
      ready: () => ready.current,
      duration: DURATION,
      fps: 30,
      seek: (t: number) => seek(t),
      render: (t: number, noLyrics = false, width = W) => {
        if (!off) off = document.createElement("canvas");
        const k = width / W;
        off.width = Math.round(W * k);
        off.height = Math.round(H * k);
        const g = off.getContext("2d")!;
        g.setTransform(k, 0, 0, k, 0, 0);
        render(g, t, noLyrics);
        return off.toDataURL("image/jpeg", 0.92);
      },
    };
    w.__seek = (t: number) => seek(t);
    return () => {
      delete w.__mv;
      delete w.__seek;
    };
  }, [seek]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "BUTTON") return;
      if (e.code === "Space") {
        e.preventDefault();
        toggle();
      } else if (e.code === "ArrowRight") seek((audioRef.current?.currentTime ?? 0) + 5);
      else if (e.code === "ArrowLeft") seek((audioRef.current?.currentTime ?? 0) - 5);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [seek, toggle]);

  const si = shotIndex(now);
  const shot = SHOTS[si];
  const lineNow = useMemo(() => LINES.findIndex((l) => now >= l.s - 0.05 && now < l.e + 0.3), [now]);
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>('[data-on="1"]');
    const box = listRef.current;
    if (el && box) box.scrollTo({ top: el.offsetTop - box.clientHeight / 2 + el.clientHeight / 2, behavior: "smooth" });
    else if (box) box.scrollTo({ top: 0 });
  }, [si, lineNow, tab]);

  const stage = (
    <div ref={stageRef} className={clean ? "fixed inset-0 bg-black" : "relative aspect-video w-full overflow-hidden bg-[#0c1530]"}>
      <canvas ref={canvasRef} width={W} height={H} className="block h-full w-full cursor-pointer" onClick={toggle} aria-label="《譬如我》大字版 MV 画面，点击播放或暂停" />
      {!clean && !playing && loaded && now < 0.05 && (
        <button onClick={toggle} className="absolute inset-0 grid place-items-center bg-[#0b1126]/35 transition hover:bg-[#0b1126]/20" aria-label="播放">
          <span className="grid h-20 w-20 place-items-center rounded-full border border-[#d9a441] bg-[#b5352b] text-[#f6e9d2] shadow-[0_8px_30px_rgba(0,0,0,.45)] sm:h-24 sm:w-24">
            <svg viewBox="0 0 24 24" className="ml-1 h-9 w-9 fill-current">
              <path d="M7 4.5v15l13-7.5z" />
            </svg>
          </span>
        </button>
      )}
      {!clean && !loaded && <div className="absolute inset-0 grid place-items-center text-sm tracking-[0.3em] text-[#f3d691]">{error ? `载入失败：${error}` : "展卷中"}</div>}
    </div>
  );

  const audio = (
    <audio
      ref={audioRef}
      src={bgmUrl}
      preload="auto"
      muted={muted}
      onPlay={() => setPlaying(true)}
      onPause={() => setPlaying(false)}
      onEnded={() => setPlaying(false)}
    />
  );
  if (clean) return <>{stage}{audio}</>;

  return (
    <div className="min-h-screen bg-[#0b1126] text-[#e9dcc0]">
      <div className="brocade h-3 w-full" />
      <header className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-x-8 gap-y-3 px-4 pt-7 pb-5 sm:px-6">
        <div className="flex items-end gap-4">
          <h1 className="heavy text-5xl leading-none text-[#f6e9d2] sm:text-6xl">譬如我</h1>
          <span className="brush mb-1 rounded-[3px] bg-[#b5352b] px-1.5 py-1 text-base leading-none text-[#f6e9d2]">大字版</span>
        </div>
        <p className="text-sm leading-relaxed text-[#b9ad92]">
          二分三十二秒 · {SHOTS.length} 镜 · 六十五句逐字卡点 · 八位出场
          <br />
          照样片的大字动态排版重做：整屏粗黑体、黑白对撞、蓝紫渐变、划痕颗粒。人物全部来自项目图集，没有一张生成图。
        </p>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <section className="overflow-hidden rounded-md border border-[#d9a441]/45 bg-[#141b33] shadow-[0_20px_60px_rgba(0,0,0,.5)]">
          {stage}
          {audio}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-3 sm:px-4">
            <button onClick={toggle} disabled={!loaded} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#b5352b] text-[#f6e9d2] transition hover:bg-[#c9443a] disabled:opacity-40" aria-label={playing ? "暂停" : "播放"}>
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">{playing ? <path d="M7 5h4v14H7zM13 5h4v14h-4z" /> : <path d="M8 5v14l11-7z" />}</svg>
            </button>
            <span className="w-24 shrink-0 text-sm tabular-nums text-[#f3d691]">
              {fmt(now)} <span className="text-[#8f8672]">/ {fmt(DURATION)}</span>
            </span>
            <div className="relative h-8 min-w-[180px] flex-1">
              <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-[#2a3358]">
                <div className="h-full bg-[#d9a441]" style={{ width: `${(now / DURATION) * 100}%` }} />
              </div>
              {SHOTS.map((s) => (
                <span key={s.id} className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-[#0b1126]/70" style={{ left: `${(s.a / DURATION) * 100}%` }} />
              ))}
              <input type="range" min={0} max={DURATION} step={0.01} value={now} onChange={(e) => seek(Number(e.target.value))} className="seek absolute inset-0 w-full" aria-label="进度" />
            </div>
            <div className="flex shrink-0 gap-2 text-xs">
              <button
                onClick={() => {
                  noLyric.current = !hideLyric;
                  setHideLyric(!hideLyric);
                  draw(audioRef.current?.currentTime ?? 0);
                }}
                className={`rounded border px-2.5 py-1.5 transition ${hideLyric ? "border-[#d9a441] bg-[#d9a441] text-[#0b1126]" : "border-[#d9a441]/50 text-[#f3d691] hover:border-[#d9a441]"}`}
              >
                无字版
              </button>
              <button onClick={() => setMuted(!muted)} className={`rounded border px-2.5 py-1.5 transition ${muted ? "border-[#d9a441] bg-[#d9a441] text-[#0b1126]" : "border-[#d9a441]/50 text-[#f3d691] hover:border-[#d9a441]"}`}>
                静音
              </button>
              <button onClick={() => void stageRef.current?.requestFullscreen?.()} className="rounded border border-[#d9a441]/50 px-2.5 py-1.5 text-[#f3d691] transition hover:border-[#d9a441]">
                全屏
              </button>
            </div>
          </div>
          <div className="border-t border-[#d9a441]/25 bg-[#101730] px-3 py-3 text-sm leading-relaxed sm:px-4">
            <span className="mr-2 rounded-sm bg-[#d9a441] px-1.5 py-0.5 text-xs font-semibold text-[#0b1126]">
              第 {si + 1} 镜 · {shot.id}
            </span>
            <span className="text-[#f6e9d2]">{shot.name}</span>
            <p className="mt-1 text-[#b9ad92]">{shot.note}</p>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
          <div className="rounded-md bg-[#efe3c8] text-[#231d18]">
            <div className="flex border-b border-[#231d18]/15" role="tablist">
              {([["shots", "分镜"], ["lyrics", "歌词卡点"], ["cast", "选角"]] as const).map(([k, label]) => (
                <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`brush px-5 py-3 text-2xl transition ${tab === k ? "border-b-2 border-[#b5352b] text-[#b5352b]" : "text-[#5a4a3c] hover:text-[#231d18]"}`}>
                  {label === "歌词卡点" ? "歌词" : label}
                </button>
              ))}
            </div>
            <div ref={listRef} className="relative max-h-[30rem] overflow-y-auto p-2 sm:p-3">
              {tab === "shots" &&
                SHOTS.map((s, i) => (
                  <button key={s.id} data-on={i === si ? 1 : 0} onClick={() => seek(s.a + 0.02)} className={`flex w-full gap-3 rounded px-2 py-2 text-left transition ${i === si ? "bg-[#231d18] text-[#f6e9d2]" : "hover:bg-[#231d18]/8"}`}>
                    <span className={`w-12 shrink-0 pt-0.5 text-xs tabular-nums ${i === si ? "text-[#f3d691]" : "text-[#8a6b3a]"}`}>{fmt(s.a)}</span>
                    <span className="min-w-0">
                      <span className="block text-[15px] font-semibold">{s.name}</span>
                      <span className={`block text-[13px] leading-relaxed ${i === si ? "text-[#d8ccb0]" : "text-[#5a4a3c]"}`}>{s.note}</span>
                    </span>
                  </button>
                ))}
              {tab === "lyrics" &&
                LINES.map((l, i) => (
                  <button key={l.id} data-on={i === lineNow ? 1 : 0} onClick={() => seek(l.s)} className={`flex w-full items-baseline gap-3 rounded px-2 py-1.5 text-left transition ${i === lineNow ? "bg-[#231d18] text-[#f6e9d2]" : "hover:bg-[#231d18]/8"}`}>
                    <span className={`w-14 shrink-0 text-xs tabular-nums ${i === lineNow ? "text-[#f3d691]" : "text-[#8a6b3a]"}`}>{l.s.toFixed(2)}</span>
                    <span className="w-8 shrink-0 text-xs text-[#8a6b3a]">{l.id}</span>
                    <span className="text-[15px]">{l.text}</span>
                  </button>
                ))}
              {tab === "cast" && (
                <ul className="divide-y divide-[#231d18]/10">
                  {CAST.map((c) => (
                    <li key={c.name} className="flex gap-3 px-2 py-3">
                      <Portrait name={c.p} />
                      <div className="min-w-0 text-[13px] leading-relaxed">
                        <p className="text-[15px] font-semibold">
                          {c.name} <span className="font-normal text-[#b5352b]">饰 {c.role}</span>
                        </p>
                        <p className="text-[#5a4a3c]">习性：{c.habit}</p>
                        <p className="text-[#5a4a3c]">落成动作：{c.acts}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="space-y-4 text-[15px] leading-[1.9] text-[#d8ccb0]">
            <h2 className="brush text-3xl text-[#f3d691]">这首歌在讲什么</h2>
            <p>
              《譬如我》不是在问怎么成为天才，是在问：天才的故事占满了舞台以后，<b className="text-[#f6e9d2]">没有天赋的人还能不能有一块地方</b>。
              所以把「众多 AI」直接搬上舞台——龙娘、小克、猫、Kimi、千问、狐狸、豆包是被聚光灯点名的七位；鲸鱼娘是站在灯外、抱着饭盆、攥着稿纸的那一个。
            </p>
            <p>
              主歌唱了三遍，画面给三种底：第一遍<b className="text-[#f6e9d2]">夜</b>（黑底白字，自我怀疑）；第二遍<b className="text-[#f6e9d2]">昼</b>（白底黑字，什么都看得清，却还是没人看她）；
              第三遍<b className="text-[#f6e9d2]">黎明</b>（暖纸、蓝紫与金）：追光还是停在龙娘头上，可小克走进了她的角落，饭盆被扶正，小花在「花」字上开了。没有人替她成功，但她不再是一个人。
            </p>
            <p className="rounded border border-[#d9a441]/40 bg-[#141b33] p-3 text-sm leading-relaxed text-[#b9ad92]">
              <b className="text-[#f3d691]">为什么重做：</b>旧的三维版（<code>番外MV/譬如我_sonnet5.5</code>）画面暗、字小、人物糊，和样片「字是主角」的气质对不上。这一版换成 Canvas2D 大字排版，
              沿用旧版实测的六十五句逐字卡点、同一张图集、同一支音轨；三维版源码原样保留，由你决定留哪一版。
            </p>
          </div>
        </section>

        <Delivery />
      </main>
      <div className="brocade h-3 w-full" />
    </div>
  );
}
