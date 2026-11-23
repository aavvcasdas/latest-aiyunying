import { useCallback, useEffect, useRef, useState } from "react";
import { Renderer, shotIndexAt } from "./mv/render";
import { loadAssets, AUDIO_URL, SPRITE_URLS } from "./mv/assets";
import { SHOTS, PRE, END, SONG_END, DAYS, MVS, CAST, LINES, dayName, dateName } from "./mv/data";
import { srt, cuesJson, storyboardMd, PROMPTS } from "./mv/docs";
import { makeZip, type ZipFile } from "./mv/zip";
import remade from "../deliverables/remade.md?raw";

const fmt = (t: number) => { const s = Math.max(0, t + PRE); return `${Math.floor(s / 60)}:${(s % 60).toFixed(1).padStart(4, "0")}`; };
const zipPathOf = (name: string) =>
  name === "benyu_px.png" ? "人物/q版/笨鱼_px.png" : name.startsWith("whale_") ? `人物/生成/满月篇/${name}` : `人物/道具/满月篇/${name}`;

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob), a = document.createElement("a");
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
}

type Tab = "board" | "days" | "assets";

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const rangeRef = useRef<HTMLInputElement>(null);
  const clock = useRef({ playing: false, T: -PRE, T0: -PRE, perf0: 0 });
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [shot, setShot] = useState(0);
  const [tab, setTab] = useState<Tab>("board");
  const [zipping, setZipping] = useState(false);

  useEffect(() => {
    let alive = true;
    loadAssets()
      .then((A) => { if (!alive || !canvasRef.current) return; rendererRef.current = new Renderer(canvasRef.current, A); rendererRef.current.render(-0.6); setReady(true); })
      .catch((e: Error) => setError(e.message));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!ready) return;
    let raf = 0, lastShot = -1;
    const tick = () => {
      const s = clock.current, a = audioRef.current;
      if (s.playing && a) {
        let T = s.T0 + (performance.now() - s.perf0) / 1000;
        if (T >= 0 && T < SONG_END - 0.05) {
          if (a.paused) { a.currentTime = T; a.play().catch(() => undefined); }
          else if (a.currentTime > 0.05 && Math.abs(a.currentTime - T) > 0.04) { T = a.currentTime; s.T0 = T; s.perf0 = performance.now(); }
        }
        if (T >= END) { T = END - 0.001; s.playing = false; setPlaying(false); a.pause(); }
        s.T = T;
      }
      try { rendererRef.current?.render(s.T); } catch (e) { setError((e as Error).message); return; }
      if (timeRef.current) timeRef.current.textContent = `${fmt(s.T)} / ${fmt(END)}`;
      if (rangeRef.current && document.activeElement !== rangeRef.current) rangeRef.current.value = String(s.T);
      const i = shotIndexAt(s.T); if (i !== lastShot) { lastShot = i; setShot(i); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ready]);

  const seek = useCallback((T: number) => {
    const s = clock.current, a = audioRef.current;
    T = Math.min(END - 0.001, Math.max(-PRE, T)); s.T = s.T0 = T; s.perf0 = performance.now();
    if (a) { if (T >= 0 && T < SONG_END) a.currentTime = T; if (!s.playing || T < 0 || T >= SONG_END) a.pause(); }
  }, []);
  const play = useCallback(() => {
    const s = clock.current; if (s.T >= END - 0.05) seek(-PRE);
    s.T0 = s.T; s.perf0 = performance.now(); s.playing = true; setPlaying(true); setStarted(true);
  }, [seek]);
  const pause = useCallback(() => { clock.current.playing = false; audioRef.current?.pause(); setPlaying(false); }, []);
  const toggle = useCallback(() => (clock.current.playing ? pause() : play()), [pause, play]);

  // 自检用：逐帧截图脚本按时间跳转（不影响播放）
  useEffect(() => {
    if (!ready) return;
    const w = window as unknown as { __mvSeek?: (t: number) => void; __mvReady?: boolean };
    w.__mvSeek = (t: number) => { seek(t); rendererRef.current?.render(t); }; w.__mvReady = true;
  }, [ready, seek]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.code === "Space" && (e.target as HTMLElement).tagName !== "INPUT") { e.preventDefault(); if (ready) toggle(); } };
    window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
  }, [ready, toggle]);

  const buildZip = async () => {
    setZipping(true);
    try {
      const enc = new TextEncoder(), files: ZipFile[] = [
        { name: "remade.md", data: enc.encode(remade) },
        { name: "番外MV/若是月亮还没来_满月篇/分镜.md", data: enc.encode(storyboardMd()) },
        { name: "番外MV/若是月亮还没来_满月篇/歌词.srt", data: enc.encode(srt()) },
        { name: "番外MV/若是月亮还没来_满月篇/cues.json", data: enc.encode(cuesJson()) },
        ...Object.entries(PROMPTS).map(([n, t]) => ({ name: `人物/提示词/满月篇/${n}`, data: enc.encode(t) })),
      ];
      for (const [n, url] of Object.entries(SPRITE_URLS)) files.push({ name: zipPathOf(n), data: new Uint8Array(await (await fetch(url)).arrayBuffer()) });
      download(makeZip(files), "满月篇_新增素材.zip");
    } finally { setZipping(false); }
  };

  const cur = SHOTS[shot];
  return (
    <div className="min-h-screen bg-[#060816] text-slate-100" style={{ fontFamily: '"PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif' }}>
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(243,200,107,0.08),transparent_60%)]" />
      <header className="relative mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-3 px-5 pt-8 pb-4">
        <div>
          <p className="text-xs tracking-[0.3em] text-amber-200/70">番外MV · 满月篇</p>
          <h1 className="mt-1 text-3xl font-bold tracking-wide text-amber-50 md:text-4xl">若是月亮还没来</h1>
          <p className="mt-1 text-sm text-slate-400">第零天 十月二十四日 → 第三十天 十一月二十三日 · 一个词一个镜头 · 二十五镜</p>
        </div>
        <div className="text-right text-xs leading-5 text-slate-500">
          <div>音源 若是月亮还没来.WAV · 二十九秒 · 卡点实测</div>
          <div>人物来自 arena/bb6a02da 分支图集 · 背景全部代码绘制</div>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl px-5 pb-16">
        <div className="relative overflow-hidden rounded-2xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/10">
          <canvas ref={canvasRef} width={1280} height={720} className="block aspect-video w-full bg-black" onClick={() => ready && toggle()} />
          {(!started || !ready) && (
            <button onClick={() => ready && play()} className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/45 backdrop-blur-[1px] transition hover:bg-black/35">
              {error ? <span className="max-w-md px-6 text-center text-rose-300">{error}</span> : (
                <>
                  <span className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100/95 text-[#151833] shadow-[0_0_60px_rgba(243,200,107,0.55)]">
                    {ready ? <svg viewBox="0 0 24 24" className="ml-1 h-9 w-9 fill-current"><path d="M8 5v14l11-7z" /></svg> : <span className="h-8 w-8 animate-spin rounded-full border-4 border-[#151833]/30 border-t-[#151833]" />}
                  </span>
                  <span className="text-lg tracking-widest text-amber-50">{ready ? "播放 · 满月篇" : "素材加载中"}</span>
                </>
              )}
            </button>
          )}
        </div>
        <audio ref={audioRef} src={AUDIO_URL} preload="auto" />

        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl bg-white/[0.04] px-4 py-3 ring-1 ring-white/10">
          <button onClick={toggle} disabled={!ready} className="rounded-lg bg-amber-200 px-4 py-1.5 text-sm font-semibold text-[#151833] transition hover:bg-amber-100 disabled:opacity-40">{playing ? "暂停" : "播放"}</button>
          <button onClick={() => { seek(-PRE); if (!clock.current.playing) play(); }} disabled={!ready} className="rounded-lg bg-white/10 px-3 py-1.5 text-sm transition hover:bg-white/20 disabled:opacity-40">从头</button>
          <input ref={rangeRef} type="range" min={-PRE} max={END} step={0.01} defaultValue={-PRE} onInput={(e) => seek(parseFloat((e.target as HTMLInputElement).value))} className="h-1 min-w-[180px] flex-1 cursor-pointer accent-amber-300" />
          <span ref={timeRef} className="w-28 text-right font-mono text-xs text-slate-400">0:00.0 / {fmt(END)}</span>
          <span className="rounded-md bg-amber-300/10 px-2 py-1 text-xs text-amber-200">{cur.id}{cur.word ? ` · ${cur.word}` : cur.id === "P0" ? " · 片头" : ""}</span>
        </div>

        <nav className="mt-8 flex gap-2 border-b border-white/10">
          {([["board", "逐词分镜"], ["days", "三十天"], ["assets", "新增素材 · remade · zip"]] as [Tab, string][]).map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} className={`-mb-px rounded-t-lg px-4 py-2 text-sm transition ${tab === k ? "border border-b-[#060816] border-white/10 bg-[#0b0e22] text-amber-100" : "text-slate-400 hover:text-slate-200"}`}>{label}</button>
          ))}
        </nav>

        {tab === "board" && (
          <section className="mt-6">
            <div className="mb-4 space-y-1 text-sm text-slate-400">
              {LINES.map((l) => <div key={l.text}><span className="mr-3 font-mono text-xs text-slate-500">{l.chars[0].toFixed(2)}s</span><span className="text-slate-200">{l.text}</span></div>)}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {SHOTS.map((s, i) => (
                <button key={s.id} onClick={() => seek(s.t0 + 0.001)} className={`group rounded-xl p-4 text-left ring-1 transition ${i === shot ? "bg-amber-200/10 ring-amber-300/50" : "bg-white/[0.03] ring-white/10 hover:bg-white/[0.06]"}`}>
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono text-xs text-slate-500">{s.id}</span>
                    <span className="font-mono text-xs text-slate-500">{s.t0.toFixed(2)}–{s.t1.toFixed(2)}s</span>
                  </div>
                  <div className="mt-1 text-2xl font-bold text-amber-50">{s.word || (s.id === "P0" ? "片头" : "满月")}</div>
                  <p className="mt-2 text-sm leading-6 text-slate-400 group-hover:text-slate-300">{s.plan}</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {tab === "days" && (
          <section className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="rounded-xl bg-white/[0.03] p-5 ring-1 ring-white/10">
              <h3 className="text-lg font-semibold text-amber-100">路灯 · 第零天到第十六天</h3>
              <p className="mb-3 text-xs text-slate-500">十七盏路灯，在「路灯也可照窗台」七个字上依次点亮</p>
              <ol className="space-y-2">{DAYS.map((d) => <li key={d.n} className="text-sm"><span className="mr-2 inline-block w-16 text-amber-200">{dayName(d.n)}</span><span className="mr-2 text-slate-500">{dateName(d.date)}</span><span className="text-slate-200">{d.title}</span>{d.note && <div className="ml-[4.5rem] text-xs text-slate-500">{d.note}</div>}</li>)}</ol>
            </div>
            <div className="rounded-xl bg-white/[0.03] p-5 ring-1 ring-white/10">
              <h3 className="text-lg font-semibold text-amber-100">山茶 · 十九支番外MV</h3>
              <p className="mb-3 text-xs text-slate-500">一朵一支，在「山茶花微微开」上按出片顺序开</p>
              <ol className="space-y-2">{MVS.map((m) => <li key={m.title} className="text-sm"><span className="mr-2 text-slate-500">{dateName(m.date)}</span><span className="text-slate-200">《{m.title}》</span>{m.note && <div className="text-xs text-slate-500">{m.note}</div>}</li>)}</ol>
            </div>
            <div className="rounded-xl bg-white/[0.03] p-5 ring-1 ring-white/10">
              <h3 className="text-lg font-semibold text-amber-100">晚风 · 人物第一次登场</h3>
              <p className="mb-3 text-xs text-slate-500">晚风把伙伴们一个个吹到身边</p>
              <ol className="space-y-3">{CAST.map((c) => <li key={c.id} className="text-sm"><span className="mr-2 text-amber-200">{c.name}</span><span className="text-slate-500">{dateName(c.date)}</span><div className="text-xs leading-5 text-slate-500">{c.note}</div></li>)}</ol>
              <p className="mt-4 text-xs leading-5 text-slate-600">老大没有造型、Grok 造型已撤，都不上画面。</p>
            </div>
          </section>
        )}

        {tab === "assets" && (
          <section className="mt-6 space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={buildZip} disabled={zipping} className="rounded-lg bg-amber-200 px-4 py-2 text-sm font-semibold text-[#151833] hover:bg-amber-100 disabled:opacity-50">{zipping ? "打包中" : "下载 满月篇_新增素材.zip"}</button>
              <button onClick={() => download(new Blob([remade], { type: "text/markdown" }), "remade.md")} className="rounded-lg bg-white/10 px-4 py-2 text-sm hover:bg-white/20">下载 remade.md</button>
              <span className="text-xs text-slate-500">在仓库根目录解压即可：新素材落到 人物/道具/满月篇、人物/生成/满月篇、人物/提示词/满月篇，分镜与卡点落到 番外MV/若是月亮还没来_满月篇</span>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {Object.entries(SPRITE_URLS).map(([n, url]) => (
                <figure key={n} className="flex flex-col items-center rounded-xl bg-[#11143a] p-3 ring-1 ring-white/10">
                  <div className="flex h-36 items-end"><img src={url} alt={n} className="max-h-36" style={{ imageRendering: "pixelated", height: n.includes("streetlamp") ? 144 : n.endsWith("_hd.png") ? 112 : n.startsWith("whale") ? 132 : 72 }} /></div>
                  <figcaption className="mt-2 break-all text-center text-[11px] text-slate-400">{zipPathOf(n).split("/").slice(-2).join("/")}</figcaption>
                </figure>
              ))}
            </div>
            <pre className="max-h-[560px] overflow-auto whitespace-pre-wrap rounded-xl bg-black/40 p-5 text-xs leading-6 text-slate-300 ring-1 ring-white/10">{remade}</pre>
          </section>
        )}
      </main>
    </div>
  );
}
