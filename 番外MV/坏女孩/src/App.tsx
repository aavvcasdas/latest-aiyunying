import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { W, H, START, TOTAL_END, AUDIO_END, BPM, BAR, BAR0, fmtTime, barAt } from "./mv/core";
import { CUES, ROWS, cueAt } from "./mv/cues";
import { Film, loadAssets } from "./mv/film";
import { SHOTS } from "./mv/three/shots";
import type { AtlasData } from "./mv/three/actors";
import { decodeSong, Player } from "./mv/audio";
import { exportMp4, exportRealtime, webCodecsSupported, type ExportProgress, type ExportResult } from "./mv/export";
import { cn } from "./utils/cn";

type Status = "loading" | "ready" | "error";
const shotAt = (T: number) => {
  let r = SHOTS[0];
  for (const s of SHOTS) if (s.start <= T) r = s;
  return r;
};

declare global {
  interface Window {
    __mv?: {
      ready: boolean;
      shots: [string, number, number][];
      render: (T: number) => string;
      exportTest: (from: number, to: number, width?: 1280 | 1920) => Promise<{ size: number; codec: string; url: string }>;
    };
  }
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const filmRef = useRef<Film | null>(null);
  const atlasRef = useRef<AtlasData | null>(null);
  const playerRef = useRef<Player | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [err, setErr] = useState("");
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(START);
  const [freeCam, setFreeCam] = useState(false);
  const freeRef = useRef(false);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [result, setResult] = useState<(ExportResult & { url: string }) | null>(null);
  const [exportErr, setExportErr] = useState("");
  const [res, setRes] = useState<1280 | 1920>(1280);
  const [tab, setTab] = useState<"lyrics" | "shots">("lyrics");
  const [copied, setCopied] = useState(false);
  const cancelRef = useRef({ cancelled: false });
  const listRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    freeRef.current = freeCam;
    if (!freeCam && filmRef.current) filmRef.current.stage.user = { yaw: 0, pitch: 0, zoom: 1 };
  }, [freeCam]);

  // 载入：字体 → 图集 → 3D 舞台；音轨并行解码
  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const [A, song] = await Promise.all([loadAssets(), decodeSong()]);
        if (dead || !canvasRef.current) return;
        atlasRef.current = A;
        filmRef.current = new Film(A, canvasRef.current, W, H);
        playerRef.current = new Player(song);
        window.__mv = {
          ready: true,
          shots: SHOTS.map((s) => [s.id, s.start, s.end] as [string, number, number]),
          render: (T: number) => {
            filmRef.current!.frame(T);
            return canvasRef.current!.toDataURL("image/jpeg", 0.85);
          },
          exportTest: async (from, to, width = 1280) => {
            const r = await exportMp4(A, { width, fps: 30, from, to, onProgress: () => {} });
            const url = URL.createObjectURL(r.blob);
            return { size: r.blob.size, codec: r.codec, url };
          },
        };
        setStatus("ready");
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
        setStatus("error");
      }
    })();
    return () => {
      dead = true;
      playerRef.current?.destroy();
      filmRef.current?.dispose();
    };
  }, []);

  // 渲染循环
  useEffect(() => {
    if (status !== "ready") return;
    let raf = 0;
    let last = 0;
    const loop = (now: number) => {
      const p = playerRef.current;
      const film = filmRef.current;
      if (p && film && !exportingRef.current) {
        const T = p.time;
        try {
          film.frame(T, freeRef.current);
        } catch (e) {
          setErr(e instanceof Error ? e.message : String(e));
        }
        if (p.playing && T >= TOTAL_END - 0.03) {
          p.pause();
          p.seek(START);
        }
        if (now - last > 100) {
          last = now;
          setTime(T);
          setPlaying(p.playing);
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [status]);
  const exportingRef = useRef(false);
  useEffect(() => {
    exportingRef.current = exporting;
  }, [exporting]);

  const toggle = useCallback(async () => {
    const p = playerRef.current;
    if (!p) return;
    if (p.playing) p.pause();
    else await p.play();
    setPlaying(p.playing);
  }, []);
  const seek = useCallback((T: number) => {
    playerRef.current?.seek(T);
    setTime(T);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "SELECT") return;
      if (e.code === "Space") {
        e.preventDefault();
        void toggle();
      } else if (e.code === "ArrowRight") seek(Math.min(TOTAL_END, (playerRef.current?.time ?? START) + 2));
      else if (e.code === "ArrowLeft") seek(Math.max(START, (playerRef.current?.time ?? START) - 2));
      else if (e.code === "KeyF") setFreeCam((v) => !v);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, seek]);

  // 自由视角：拖拽旋转、滚轮缩放、双击复位
  const onPointerDown = (e: React.PointerEvent) => {
    if (!freeCam) return;
    drag.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const film = filmRef.current;
    if (!freeCam || !drag.current || !film) return;
    const dx = e.clientX - drag.current.x;
    const dy = e.clientY - drag.current.y;
    drag.current = { x: e.clientX, y: e.clientY };
    film.stage.user.yaw -= dx * 0.008;
    film.stage.user.pitch = Math.max(-1.2, Math.min(1.2, film.stage.user.pitch + dy * 0.006));
  };
  const onWheel = (e: React.WheelEvent) => {
    const film = filmRef.current;
    if (!freeCam || !film) return;
    film.stage.user.zoom = Math.max(0.35, Math.min(3, film.stage.user.zoom * (e.deltaY > 0 ? 1.08 : 0.93)));
  };

  const shot = useMemo(() => shotAt(time), [time]);
  const cue = useMemo(() => cueAt(time), [time]);
  useEffect(() => {
    const key = tab === "lyrics" ? (cue ? `c${cue.i}` : "") : `s${shot.id}`;
    if (!key) return;
    listRef.current?.querySelector<HTMLElement>(`[data-k="${key}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [cue, shot.id, tab]);

  const startExport = useCallback(async () => {
    const A = atlasRef.current;
    const p = playerRef.current;
    if (!A || !p || exporting) return;
    p.pause();
    setPlaying(false);
    setExporting(true);
    setExportErr("");
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    cancelRef.current = { cancelled: false };
    try {
      const opts = { width: res, fps: 30 as const, onProgress: setProgress, signal: cancelRef.current };
      let r: ExportResult;
      if (webCodecsSupported()) {
        try {
          r = await exportMp4(A, opts);
        } catch (e) {
          if (cancelRef.current.cancelled) throw e;
          setProgress({ phase: "prepare", done: 0, total: 1, note: `WebCodecs 失败（${e instanceof Error ? e.message : e}），改用实时录制` });
          r = await exportRealtime(A, p, opts);
        }
      } else r = await exportRealtime(A, p, opts);
      const url = URL.createObjectURL(r.blob);
      setResult({ ...r, url });
      const a = document.createElement("a");
      a.href = url;
      a.download = r.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      setExportErr(e instanceof Error ? e.message : String(e));
      setProgress(null);
    } finally {
      setExporting(false);
    }
  }, [exporting, res, result]);

  const pct = progress && progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;
  const total = TOTAL_END - START;

  return (
    <div className="min-h-screen bg-[#07050f] text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,61,154,0.16),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(56,232,255,0.12),transparent_50%)]" />
      <main className="relative mx-auto max-w-7xl px-4 py-7 md:px-8">
        <header className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold tracking-[0.3em] text-pink-300/80">THREE.JS 3D 世界 · 像素纸片人 · 歌词卡点</p>
            <h1 className="mt-1 text-3xl font-black tracking-tight md:text-4xl">
              《坏女孩》<span className="text-pink-400">鲸鱼娘</span> × <span className="text-cyan-300">Claude</span>
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-300/80">
              按 newday 仓库《童话镇》模板的做法重做：three.js 搭 3D 布景（雨夜街道 · 霓虹酒吧 · 卧室 · 天台 · 化妆间），八位像素角色当纸片人站在里面；跳过前奏，{SHOTS.length} 个镜头在每句歌词开口前 2 帧切入，歌词条逐字染色。
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            {["主角 鲸鱼娘（坏女孩）", "配角 Claude", "陌生的肩 GPT 龙娘", "路人 Kimi · Gemini · 千问 · 智谱", "红舞鞋 豆包"].map((t) => (
              <span key={t} className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-slate-200">
                {t}
              </span>
            ))}
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          <section className="space-y-4">
            <div className={cn("relative overflow-hidden rounded-2xl border bg-black shadow-[0_0_80px_rgba(255,61,154,0.15)]", freeCam ? "border-cyan-300/60" : "border-white/10")}>
              <canvas
                ref={canvasRef}
                width={W}
                height={H}
                className={cn("block aspect-video w-full touch-none", freeCam ? "cursor-grab active:cursor-grabbing" : "cursor-pointer")}
                onClick={() => !freeCam && void toggle()}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={() => (drag.current = null)}
                onWheel={onWheel}
                onDoubleClick={() => filmRef.current && (filmRef.current.stage.user = { yaw: 0, pitch: 0, zoom: 1 })}
              />
              {status !== "ready" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/85 text-center">
                  {status === "loading" ? (
                    <>
                      <div className="h-10 w-10 animate-spin rounded-full border-2 border-pink-400 border-t-transparent" />
                      <p className="text-sm text-slate-300">正在载入字体、像素图集、音轨并搭建 3D 布景…</p>
                    </>
                  ) : (
                    <p className="max-w-md text-sm text-rose-300">载入失败：{err}</p>
                  )}
                </div>
              )}
              {status === "ready" && !playing && !exporting && !freeCam && (
                <button onClick={() => void toggle()} className="absolute inset-0 m-auto flex h-20 w-20 items-center justify-center rounded-full bg-pink-500/90 text-3xl text-white shadow-lg shadow-pink-500/40 transition hover:scale-105" aria-label="播放">
                  ▶
                </button>
              )}
              {freeCam && <div className="pointer-events-none absolute left-3 top-3 rounded-lg bg-cyan-400/90 px-2.5 py-1 text-xs font-bold text-[#04202a]">自由视角：拖拽旋转 · 滚轮缩放 · 双击复位</div>}
              {exporting && <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-sm text-cyan-100">正在导出（预览暂停）…</div>}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex flex-wrap items-center gap-3">
                <button onClick={() => void toggle()} disabled={status !== "ready" || exporting} className="rounded-xl bg-pink-500 px-5 py-2 text-sm font-bold text-white transition hover:bg-pink-400 disabled:opacity-40">
                  {playing ? "暂停" : "播放"}
                </button>
                <button onClick={() => seek(START)} disabled={status !== "ready" || exporting} className="rounded-xl border border-white/15 px-4 py-2 text-sm transition hover:bg-white/10 disabled:opacity-40">
                  回到开头
                </button>
                <button onClick={() => setFreeCam((v) => !v)} disabled={status !== "ready"} className={cn("rounded-xl border px-4 py-2 text-sm transition disabled:opacity-40", freeCam ? "border-cyan-300 bg-cyan-400/20 text-cyan-100" : "border-white/15 hover:bg-white/10")}>
                  {freeCam ? "退出自由视角" : "自由视角（F）"}
                </button>
                <div className="font-mono text-sm tabular-nums text-slate-300">
                  {fmtTime(time - START)} / {fmtTime(total)}
                  <span className="ml-2 text-xs text-slate-500">原曲 {fmtTime(time)} · 第 {barAt(time) >= 0 ? Math.floor(barAt(time)) : "—"} 小节</span>
                </div>
              </div>
              <input type="range" min={START} max={TOTAL_END} step={0.01} value={time} disabled={status !== "ready" || exporting} onChange={(e) => seek(parseFloat(e.target.value))} className="mt-3 w-full accent-pink-500" />
              <div className="relative mt-1 h-2.5 w-full">
                {SHOTS.map((s) => (
                  <button
                    key={s.id}
                    title={`${s.id} ${s.title}`}
                    onClick={() => seek(s.start + 0.05)}
                    className={cn("absolute top-0 h-2.5 rounded-sm transition", s.id === shot.id ? "bg-pink-400" : s.cue ? "bg-white/20 hover:bg-cyan-300/70" : "bg-violet-400/30 hover:bg-cyan-300/70")}
                    style={{ left: `${((s.start - START) / total) * 100}%`, width: `calc(${((s.end - s.start) / total) * 100}% - 1px)` }}
                  />
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span className="rounded-md bg-pink-500/20 px-2 py-0.5 font-bold text-pink-200">{shot.id}</span>
                <span className="font-semibold text-slate-200">{shot.title}</span>
                <span className="text-slate-500">·</span>
                <span>{shot.note}</span>
              </div>
              {err && status === "ready" && <p className="mt-2 text-xs text-rose-300">渲染报错：{err}</p>}
            </div>

            <div className="rounded-2xl border border-cyan-300/20 bg-gradient-to-br from-cyan-400/10 to-pink-500/10 p-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-bold">导出 MP4</h2>
                  <p className="text-xs text-slate-400">在你的浏览器里逐帧离线渲染整片（{fmtTime(total)}，30 fps，H.264 + AAC 192k），画面与预览逐帧一致（不含自由视角）。完成后自动下载，并在下面给出下载按钮和完整下载链接。推荐 Chrome / Edge。</p>
                </div>
                <div className="flex items-center gap-2">
                  <select value={res} disabled={exporting} onChange={(e) => setRes(parseInt(e.target.value) as 1280 | 1920)} className="rounded-lg border border-white/15 bg-[#120a1c] px-2 py-1.5 text-sm">
                    <option value={1280}>1280 × 720</option>
                    <option value={1920}>1920 × 1080</option>
                  </select>
                  {!exporting ? (
                    <button onClick={() => void startExport()} disabled={status !== "ready"} className="rounded-xl bg-cyan-400 px-5 py-2 text-sm font-bold text-[#06202a] transition hover:bg-cyan-300 disabled:opacity-40">
                      ⬇ 导出 MP4
                    </button>
                  ) : (
                    <button onClick={() => (cancelRef.current.cancelled = true)} className="rounded-xl border border-rose-400/50 px-4 py-2 text-sm font-bold text-rose-200 hover:bg-rose-500/20">
                      取消
                    </button>
                  )}
                </div>
              </div>
              {progress && progress.phase !== "done" && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-slate-300">
                    <span>
                      {{ prepare: "准备", audio: "音轨编码", video: "逐帧渲染 + H.264 编码", mux: "封装", done: "完成" }[progress.phase]}
                      {progress.note ? ` · ${progress.note}` : ""}
                    </span>
                    <span className="font-mono">{pct}%</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full bg-gradient-to-r from-cyan-300 to-pink-400" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )}
              {exportErr && <p className="mt-3 text-sm text-rose-300">导出失败：{exportErr}</p>}
              {result && (
                <div className="mt-3 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm">
                  <p className="font-semibold text-emerald-200">
                    导出完成 · {result.codec} · {result.width}×{result.height} · {fmtTime(result.seconds)} · {(result.blob.size / 1048576).toFixed(1)} MB
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <a href={result.url} download={result.filename} className="rounded-lg bg-emerald-400 px-4 py-1.5 font-bold text-[#06201a] hover:bg-emerald-300">
                      ⬇ 下载 {result.filename}
                    </a>
                    <a href={result.url} target="_blank" rel="noreferrer" className="text-emerald-200 underline underline-offset-4">
                      新标签页打开
                    </a>
                    <button
                      onClick={() => {
                        void navigator.clipboard?.writeText(result.url);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1500);
                      }}
                      className="text-emerald-200 underline underline-offset-4"
                    >
                      {copied ? "已复制" : "复制下载链接"}
                    </button>
                  </div>
                  <p className="mt-2 break-all font-mono text-[11px] text-slate-400">完整下载链接：{result.url}</p>
                  {result.container === "webm" && <p className="mt-1 text-xs text-amber-200">这个浏览器录不了 MP4，输出的是 WebM；用 Chrome / Edge 重新导出可得 MP4。</p>}
                </div>
              )}
            </div>
          </section>

          <aside className="flex max-h-[calc(100vh-3rem)] flex-col rounded-2xl border border-white/10 bg-white/[0.04] lg:sticky lg:top-6">
            <div className="flex border-b border-white/10">
              {(
                [
                  ["lyrics", `歌词卡点（${CUES.length} 句）`],
                  ["shots", `分镜（${SHOTS.length} 镜）`],
                ] as const
              ).map(([k, label]) => (
                <button key={k} onClick={() => setTab(k)} className={cn("flex-1 px-4 py-3 text-sm font-bold transition", tab === k ? "bg-white/10 text-pink-200" : "text-slate-400 hover:text-slate-200")}>
                  {label}
                </button>
              ))}
            </div>
            <div ref={listRef} className="flex-1 overflow-y-auto p-2">
              {tab === "lyrics"
                ? CUES.map((c) => {
                    const on = cue?.i === c.i;
                    const head = c.i === 0 ? "第一遍" : c.i === 20 ? "第二遍（原曲重复段）" : c.i === 40 ? "桥段" : c.i === 44 ? "尾段副歌" : "";
                    return (
                      <div key={c.i}>
                        {head && <p className="px-2 pb-1 pt-3 text-[11px] font-bold tracking-widest text-slate-500">{head}</p>}
                        <button data-k={`c${c.i}`} onClick={() => seek(c.start - 0.3)} className={cn("mb-1 flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left transition", on ? "border-pink-400/60 bg-pink-500/15" : "border-transparent hover:bg-white/5")}>
                          <span className="w-12 shrink-0 font-mono text-[11px] text-slate-500">{fmtTime(c.start - START)}</span>
                          <span className={cn("shrink-0 rounded px-1.5 text-[10px] font-bold", c.singer === "小凌" ? "bg-pink-500/30 text-pink-200" : "bg-cyan-500/25 text-cyan-200")}>{c.singer}</span>
                          <span className={cn("flex-1 text-sm", on ? "text-white" : "text-slate-300")}>{c.text}</span>
                          <span className="shrink-0 text-[10px] text-slate-600">行{c.row}</span>
                        </button>
                      </div>
                    );
                  })
                : SHOTS.map((s) => {
                    const on = s.id === shot.id;
                    return (
                      <button key={s.id} data-k={`s${s.id}`} onClick={() => seek(s.start + 0.05)} className={cn("mb-1 w-full rounded-xl border p-2.5 text-left transition", on ? "border-pink-400/60 bg-pink-500/15" : "border-transparent hover:bg-white/5")}>
                        <div className="flex items-center gap-2 text-xs">
                          <span className={cn("rounded px-1.5 py-0.5 font-bold", on ? "bg-pink-400 text-white" : "bg-white/10 text-slate-300")}>{s.id}</span>
                          <span className="font-semibold text-slate-100">{s.title}</span>
                          <span className="text-[10px] text-slate-500">{s.set}</span>
                          <span className="ml-auto font-mono text-slate-500">{fmtTime(s.start - START)}</span>
                        </div>
                        {s.cue && <p className="mt-1 text-xs text-pink-200/80">「{s.cue.text}」</p>}
                        <p className="mt-1 text-xs leading-relaxed text-slate-400">{s.note}</p>
                        <p className="mt-0.5 text-[11px] text-slate-500">出场：{s.cast}</p>
                      </button>
                    );
                  })}
            </div>
          </aside>
        </div>

        <section className="mt-7 grid gap-4 md:grid-cols-3">
          <Note title="3D 世界怎么搭的">
            沿用模板的做法：three.js 卡通材质（三阶色带）+ 墨线外描边的体块搭景，路灯 / 霓虹 / 舞池是真实点光源；角色是图集里的像素纸片，脚底在地面、朝镜头转向、带接触阴影、进雾。五个布景、全局四盏灯数量固定（切镜不重编译着色器）；每帧只读时间，任意跳帧、任意分段导出都得到同一帧。
          </Note>
          <Note title="卡点与字幕">
            节拍网格实测 {BPM.toFixed(2)} BPM（小节 {BAR.toFixed(3)} s，首拍 {BAR0.toFixed(3)} s）。{CUES.length} 句歌词的起点取自 LRC，吸附到最近的实测半拍（最多挪 0.118 s），切镜在开口前 2 帧；间奏四镜切在小节强拍上。字幕用模板字体 ZCOOL KuaiLe，按演唱者（徐良 / 小凌）分色逐字染色。
          </Note>
          <Note title="走路修复与说明">
            步态按「走过的距离」取 8 格中的一格（一轮 = 1.15 倍身高），位移与脚步一一对应不打滑，奔跑时步频随速度自然加快。音源取自分支里的参考视频，在 {fmtTime(AUDIO_END)} 处（最后一句中途）截止，所以片尾 1.4 s 淡出后接静音字卡。共 {ROWS.length} 行歌词全部覆盖（第二遍主歌是原曲重复段，镜头全部换了变体）。
          </Note>
        </section>
      </main>
    </div>
  );
}

function Note({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
      <h3 className="text-sm font-bold text-pink-200">{title}</h3>
      <p className="mt-2 text-xs leading-relaxed text-slate-400">{children}</p>
    </div>
  );
}
