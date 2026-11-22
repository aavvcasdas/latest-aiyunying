import { useCallback, useEffect, useRef, useState } from "react";
import { render, shotAt } from "./mv/render";
import { setAtlas, W, H, FONT } from "./mv/draw";
import { LINES, DURATION, wordAt } from "./mv/timeline";
import { SHOTS } from "./mv/shots";
import castUrl from "./assets/cast.png?url";
import audioUrl from "./assets/langren.m4a?url";
import fontUrl from "./assets/mvbrush.woff2?url";
import { downloadZip, downloadRemade, buildZip } from "./delivery/pack";

const fmt = (t: number) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, "0")}`;

export default function App() {
  const cvRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [busy, setBusy] = useState(false);
  const timeRef = useRef(0);

  // 资源：字体 + 图集
  useEffect(() => {
    let alive = true;
    const img = new Image();
    img.src = castUrl;
    const face = new FontFace(FONT, `url(${fontUrl})`);
    Promise.all([img.decode(), face.load().then((f) => document.fonts.add(f))]).then(() => {
      if (!alive) return;
      setAtlas(img);
      // 与仓库 tools/shoot_vite_mv.mjs 对接：window.__mv.render(t, clean, width) 直接返回画面 JPEG
      const off = document.createElement("canvas");
      (window as unknown as { __mv: unknown }).__mv = {
        duration: DURATION,
        render: (t: number, _clean?: boolean, width?: number) => {
          const w = width || W;
          off.width = w;
          off.height = Math.round((w * H) / W);
          const g = off.getContext("2d")!;
          g.save();
          g.scale(w / W, w / W);
          render(g, t);
          g.restore();
          return off.toDataURL("image/jpeg", 0.92);
        },
        seek: (t: number) => draw(t),
        pack: async () => {
          const z = await buildZip();
          let s = "";
          for (let i = 0; i < z.length; i += 0x8000) s += String.fromCharCode(...z.subarray(i, i + 0x8000));
          return btoa(s);
        },
      };
      setReady(true);
    });
    // 逐帧截图用：window.__seek(t) 画出指定时刻
    (window as unknown as { __seek: (t: number) => void }).__seek = (t: number) => {
      const g = cvRef.current?.getContext("2d");
      if (g) render(g, t);
    };
    return () => {
      alive = false;
    };
  }, []);

  const draw = useCallback((t: number) => {
    const g = cvRef.current?.getContext("2d");
    if (g) render(g, t);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const q = new URLSearchParams(location.search).get("t");
    if (q) {
      timeRef.current = parseFloat(q);
      setTime(timeRef.current);
    }
    draw(timeRef.current);
    let raf = 0;
    const loop = () => {
      const a = audioRef.current;
      if (a && !a.paused) {
        timeRef.current = a.currentTime;
        draw(a.currentTime);
        setTime(a.currentTime);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [ready, draw]);

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      if (a.currentTime >= DURATION - 0.05) a.currentTime = 0;
      a.play();
    } else a.pause();
  };
  const seek = (t: number) => {
    const a = audioRef.current;
    timeRef.current = t;
    if (a) a.currentTime = t;
    setTime(t);
    draw(t);
  };

  const cur = wordAt(time);
  const { shot } = shotAt(time);

  return (
    <div className="min-h-screen bg-[#16110d] text-[#efe4cf]" style={{ fontFamily: `"Noto Serif SC", "Songti SC", serif` }}>
      <header className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-4 px-6 pt-8 pb-4">
        <div>
          <h1 className="text-4xl tracking-widest text-[#f3d691]" style={{ fontFamily: `${FONT}, serif` }}>
            浪人琵琶 · 字字分镜
          </h1>
          <p className="mt-1 text-sm text-[#b8a88d]">
            番外 MV 重制 · 十句歌词 · 三十四个词拍 · 十一镜 · 八位像素 AI 娘出演 · 1280×720 / 30.1 秒
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => downloadRemade()}
            className="rounded border border-[#d8a23e]/60 px-4 py-2 text-sm text-[#f3d691] transition hover:bg-[#d8a23e]/15"
          >
            下载 remade.md
          </button>
          <button
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                await downloadZip();
              } finally {
                setBusy(false);
              }
            }}
            className="rounded bg-[#b8312a] px-4 py-2 text-sm text-white shadow transition hover:bg-[#d0433a] disabled:opacity-60"
          >
            {busy ? "打包中…" : "下载工程 zip"}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-16">
        <div className="relative overflow-hidden rounded-lg shadow-2xl ring-1 ring-[#d8a23e]/30">
          <canvas ref={cvRef} width={W} height={H} className="block aspect-video w-full bg-[#efe6d2]" onClick={toggle} />
          {!playing && ready && (
            <button
              onClick={toggle}
              className="absolute inset-0 m-auto flex h-24 w-24 items-center justify-center rounded-full bg-[#b8312a]/90 text-3xl text-white shadow-xl transition hover:scale-105"
              aria-label="播放"
            >
              ▶
            </button>
          )}
          {!ready && <div className="absolute inset-0 flex items-center justify-center text-[#5a4a3c]">研墨中…</div>}
        </div>
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="auto"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
        />

        {/* 播放控制（画面外） */}
        <div className="mt-4 flex items-center gap-4">
          <button onClick={toggle} className="w-20 rounded bg-[#2a211a] px-3 py-2 text-sm ring-1 ring-[#d8a23e]/30 hover:bg-[#3a2d22]">
            {playing ? "暂停" : "播放"}
          </button>
          <div className="relative flex-1">
            <div className="flex h-6 overflow-hidden rounded">
              {SHOTS.map((s) => (
                <div
                  key={s.id}
                  className={`border-r border-[#16110d] text-[10px] leading-6 text-center ${s.id === shot.id ? "bg-[#b8312a]/70" : "bg-[#3a2d22]"}`}
                  style={{ width: `${((s.t1 - s.t0) / DURATION) * 100}%` }}
                >
                  {s.id}
                </div>
              ))}
            </div>
            <input
              type="range"
              min={0}
              max={DURATION}
              step={0.01}
              value={time}
              onChange={(e) => seek(parseFloat(e.target.value))}
              className="absolute inset-0 w-full cursor-pointer opacity-0"
            />
            <div className="pointer-events-none absolute top-0 h-6 w-0.5 bg-[#f3d691]" style={{ left: `${(time / DURATION) * 100}%` }} />
          </div>
          <span className="w-24 text-right font-mono text-sm text-[#b8a88d]">
            {fmt(time)} / {fmt(DURATION)}
          </span>
        </div>

        {/* 当前词拍 */}
        <div className="mt-5 rounded-lg bg-[#211913] p-4 ring-1 ring-[#d8a23e]/20">
          <div className="text-xs text-[#8f7f66]">当前词拍 · 第 {shot.id} 镜</div>
          {cur ? (
            <div className="mt-1 flex flex-wrap items-baseline gap-3">
              <span className="text-3xl text-[#f3d691]" style={{ fontFamily: `${FONT}, serif` }}>
                {cur.word.text}
              </span>
              <span className="text-sm text-[#d9cbb0]">{cur.word.idea}</span>
            </div>
          ) : (
            <div className="mt-1 text-sm text-[#d9cbb0]">起手</div>
          )}
        </div>

        {/* 分镜表 */}
        <h2 className="mt-10 mb-3 text-2xl text-[#f3d691]" style={{ fontFamily: `${FONT}, serif` }}>
          逐词分镜
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          {LINES.map((l) => (
            <div key={l.id} className="rounded-lg bg-[#211913] p-4 ring-1 ring-[#d8a23e]/15">
              <button onClick={() => seek(l.t0 + 0.01)} className="flex w-full items-baseline justify-between text-left">
                <span className="text-xl" style={{ fontFamily: `${FONT}, serif` }}>
                  {l.text}
                </span>
                <span className="font-mono text-xs text-[#8f7f66]">
                  {l.t0.toFixed(2)}–{l.t1.toFixed(2)}s
                </span>
              </button>
              <ul className="mt-2 space-y-1.5">
                {l.words.map((w, i) => {
                  const on = cur && cur.line.id === l.id && cur.wi === i;
                  return (
                    <li key={i}>
                      <button
                        onClick={() => seek(w.t0 + 0.2)}
                        className={`flex w-full gap-3 rounded px-2 py-1 text-left text-sm transition ${on ? "bg-[#b8312a]/40" : "hover:bg-white/5"}`}
                      >
                        <span className="w-16 shrink-0 text-[#f3d691]" style={{ fontFamily: `${FONT}, serif` }}>
                          {w.text}
                        </span>
                        <span className="text-[#cdbfa4]">{w.idea}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-10 text-xs leading-6 text-[#7d6e57]">
          人物：鲸鱼娘（浪人小生）、Claude（你）、GPT 龙娘（施雨）、千问、Gemini、智谱阔耳狐，全部取自分支 人物/atlas.png，像素原样。背景与道具（花伞、铜钟、黄历、水袖、茶壶、玻璃杯、琵琶、拼图）全部代码绘制，未生成任何图片。
          音轨：仓库根 浪人琵琶.WAV。字体：马善政楷书（OFL，已裁子集）。形象源头 ZipZipPipe《大AI和小AI们》CC BY-NC-SA 4.0。
        </p>
      </main>
    </div>
  );
}
