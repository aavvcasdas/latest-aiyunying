"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Assets } from "@/lib/mv/assets";
import { W, H } from "@/lib/mv/draw";
import { renderShot } from "@/lib/mv/shots";
import { DURATION, SHOTS, shotAt } from "@/lib/mv/timeline";
import { drawLyrics } from "@/lib/mv/lyrics";
import type { Director } from "@/lib/mv3d/director";
import { IDEA3D } from "@/lib/mv3d/ideas";

const OUT_W = 1280;
const OUT_H = 720;

function fmt(t: number) {
  const m = Math.floor(t / 60), s = t - m * 60;
  return `${m}:${s.toFixed(2).padStart(5, "0")}`;
}

export default function MVPlayer({ onShotChange, mode = "3d" }: { onShotChange?: (i: number) => void; mode?: "2d" | "3d" }) {
  const directorRef = useRef<Director | null>(null);
  const prevFrame = useRef<HTMLCanvasElement | null>(null);
  const cutAt = useRef(-1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const assetsRef = useRef<Assets | null>(null);
  const bufA = useRef<HTMLCanvasElement | null>(null);
  const bufB = useRef<HTMLCanvasElement | null>(null);
  const audioCtxRef = useRef<{ ctx: AudioContext; dest: MediaStreamAudioDestinationNode } | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [shotIdx, setShotIdx] = useState(0);
  const [recording, setRecording] = useState(false);
  const [showLyrics, setShowLyrics] = useState(true);
  const showLyricsRef = useRef(true);
  const lastShot = useRef(-1);

  useEffect(() => { showLyricsRef.current = showLyrics; }, [showLyrics]);

  useEffect(() => {
    const a = new Assets();
    assetsRef.current = a;
    const mk = () => { const c = document.createElement("canvas"); c.width = W; c.height = H; return c; };
    bufA.current = mk(); bufB.current = mk();
    a.load()
      .then(async () => {
        if (mode === "3d") {
          const { Director } = await import("@/lib/mv3d/director");
          directorRef.current = new Director(a, OUT_W, OUT_H);
          const pc = document.createElement("canvas"); pc.width = OUT_W; pc.height = OUT_H; prevFrame.current = pc;
        }
        setReady(true);
      })
      .catch((e: Error) => setError(e.message));
    return () => { directorRef.current?.dispose(); directorRef.current = null; };
  }, [mode]);

  const drawFrame = useCallback((t: number) => {
    const canvas = canvasRef.current, A = assetsRef.current;
    if (!canvas || !A || !A.ready || !bufA.current || !bufB.current) return;
    const out = canvas.getContext("2d")!;
    if (mode === "3d") {
      const dir = directorRef.current, pc = prevFrame.current;
      if (!dir || !pc) return;
      const before = dir.idx;
      let res: ReturnType<Director["render"]>;
      try { res = dir.render(t); } catch (err) { console.error(err); return; }
      const { idx, post } = res;
      if (idx !== before && before !== -1) {
        // 切镜：保存上一帧做 0.15s 交叉淡出
        pc.getContext("2d")!.drawImage(canvas, 0, 0);
        cutAt.current = performance.now();
      }
      out.globalAlpha = 1;
      out.fillStyle = "#000"; out.fillRect(0, 0, OUT_W, OUT_H);
      out.drawImage(dir.canvas, 0, 0, OUT_W, OUT_H);
      const since = (performance.now() - cutAt.current) / 1000;
      if (cutAt.current >= 0 && since >= 0 && since < 0.15) { out.globalAlpha = 1 - since / 0.15; out.drawImage(pc, 0, 0); out.globalAlpha = 1; }
      if (post.vignette > 0) {
        const gr = out.createRadialGradient(OUT_W / 2, OUT_H / 2, OUT_H * 0.35, OUT_W / 2, OUT_H / 2, OUT_W * 0.62);
        gr.addColorStop(0, `rgba(${post.vignetteColor},0)`); gr.addColorStop(1, `rgba(${post.vignetteColor},${post.vignette})`);
        out.fillStyle = gr; out.fillRect(0, 0, OUT_W, OUT_H);
      }
      if (post.flash > 0) { out.fillStyle = `rgba(${post.flashColor},${Math.min(1, post.flash)})`; out.fillRect(0, 0, OUT_W, OUT_H); }
      if (showLyricsRef.current) drawLyrics(out, t);
      if (idx !== lastShot.current) { lastShot.current = idx; setShotIdx(idx); onShotChange?.(idx); }
      return;
    }
    const i = shotAt(t);
    const shot = SHOTS[i];
    const lt = t - shot.start;
    const d = Math.max(0.05, shot.end - shot.start);
    const ga = bufA.current.getContext("2d")!;
    ga.setTransform(1, 0, 0, 1, 0, 0); ga.globalAlpha = 1; ga.globalCompositeOperation = "source-over";
    ga.imageSmoothingEnabled = false;
    ga.clearRect(0, 0, W, H);
    ga.save();
    renderShot(shot.key, { g: ga, A, t, lt, p: Math.min(1, lt / d), d });
    ga.restore();

    // 切镜：前一镜 0.12s 交叉淡出 + 新镜轻微推入
    const XF = 0.12;
    out.imageSmoothingEnabled = false;
    out.fillStyle = "#000"; out.fillRect(0, 0, OUT_W, OUT_H);
    if (lt < XF && i > 0) {
      const prev = SHOTS[i - 1];
      const gb = bufB.current.getContext("2d")!;
      gb.setTransform(1, 0, 0, 1, 0, 0); gb.globalAlpha = 1; gb.imageSmoothingEnabled = false; gb.clearRect(0, 0, W, H);
      gb.save();
      const plt = t - prev.start, pd = Math.max(0.05, prev.end - prev.start);
      renderShot(prev.key, { g: gb, A, t, lt: plt, p: Math.min(1, plt / pd), d: pd });
      gb.restore();
      out.drawImage(bufB.current, 0, 0, OUT_W, OUT_H);
      out.globalAlpha = lt / XF;
    }
    const punch = 1 + 0.035 * Math.max(0, 1 - lt / 0.22);
    const pw = OUT_W * punch, ph = OUT_H * punch;
    out.drawImage(bufA.current, (OUT_W - pw) / 2, (OUT_H - ph) / 2, pw, ph);
    out.globalAlpha = 1;

    if (showLyricsRef.current) drawLyrics(out, t);

    if (i !== lastShot.current) { lastShot.current = i; setShotIdx(i); onShotChange?.(i); }
  }, [onShotChange, mode]);

  useEffect(() => {
    if (!ready) return;
    let raf = 0;
    const loop = () => {
      const au = audioRef.current;
      const t = au ? au.currentTime : 0;
      drawFrame(t);
      setTime(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [ready, drawFrame]);

  const toggle = () => {
    const au = audioRef.current; if (!au) return;
    if (au.paused) { void au.play(); } else au.pause();
  };
  const seek = (t: number) => { const au = audioRef.current; if (au) au.currentTime = Math.max(0, Math.min(DURATION - 0.01, t)); };

  const record = async () => {
    const au = audioRef.current, canvas = canvasRef.current;
    if (!au || !canvas) return;
    if (!audioCtxRef.current) {
      const ctx = new AudioContext();
      const src = ctx.createMediaElementSource(au);
      const dest = ctx.createMediaStreamDestination();
      src.connect(dest); src.connect(ctx.destination);
      audioCtxRef.current = { ctx, dest };
    }
    await audioCtxRef.current.ctx.resume();
    const stream = new MediaStream([...canvas.captureStream(30).getVideoTracks(), ...audioCtxRef.current.dest.stream.getAudioTracks()]);
    const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus") ? "video/webm;codecs=vp9,opus" : "video/webm";
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 });
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    rec.onstop = () => {
      const url = URL.createObjectURL(new Blob(chunks, { type: "video/webm" }));
      const a = document.createElement("a"); a.href = url; a.download = "我和你_MV.webm"; a.click();
      setRecording(false);
    };
    recRef.current = rec;
    au.currentTime = 0;
    rec.start(500);
    setRecording(true);
    await au.play();
  };

  useEffect(() => {
    const au = audioRef.current; if (!au) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnd = () => { setPlaying(false); if (recRef.current && recRef.current.state === "recording") recRef.current.stop(); };
    au.addEventListener("play", onPlay); au.addEventListener("pause", onPause); au.addEventListener("ended", onEnd);
    return () => { au.removeEventListener("play", onPlay); au.removeEventListener("pause", onPause); au.removeEventListener("ended", onEnd); };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT" || (e.target as HTMLElement)?.tagName === "TEXTAREA") return;
      if (e.code === "Space") { e.preventDefault(); toggle(); }
      if (e.code === "ArrowRight") seek((audioRef.current?.currentTime ?? 0) + 2);
      if (e.code === "ArrowLeft") seek((audioRef.current?.currentTime ?? 0) - 2);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const shot = SHOTS[shotIdx];

  return (
    <div className="w-full">
      <div className="relative overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/10">
        <canvas ref={canvasRef} width={OUT_W} height={OUT_H} className="block aspect-video w-full cursor-pointer" style={{ imageRendering: "pixelated" }} onClick={toggle} />
        {!ready && (
          <div className="absolute inset-0 grid place-items-center bg-sky-200 text-sky-900">
            {error ? <p className="text-red-600">{error}</p> : <p className="animate-pulse text-lg font-bold">正在加载 Q 版像素图集与 3D 场景…</p>}
          </div>
        )}
        {ready && !playing && time < 0.05 && (
          <button onClick={toggle} className="absolute inset-0 grid place-items-center bg-black/25 text-white">
            <span className="rounded-full bg-white/90 px-8 py-4 text-xl font-black text-sky-700 shadow-xl">▶ 播放《我和你》</span>
          </button>
        )}
      </div>
      <audio ref={audioRef} src="/mv/audio/wohe-ni.wav" preload="auto" />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button onClick={toggle} disabled={!ready} className="rounded-full bg-sky-500 px-5 py-2 font-bold text-white shadow hover:bg-sky-600 disabled:opacity-50">
          {playing ? "❚❚ 暂停" : "▶ 播放"}
        </button>
        <span className="font-mono text-sm text-slate-600">{fmt(time)} / {fmt(DURATION)}</span>
        <input type="range" min={0} max={DURATION} step={0.01} value={time} onChange={(e) => seek(parseFloat(e.target.value))} className="flex-1 accent-sky-500" />
        <label className="flex items-center gap-1 text-sm text-slate-600">
          <input type="checkbox" checked={showLyrics} onChange={(e) => setShowLyrics(e.target.checked)} /> 歌词
        </label>
        <button onClick={() => canvasRef.current?.requestFullscreen()} className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow ring-1 ring-slate-200">⛶ 全屏</button>
        <button onClick={record} disabled={!ready || recording} className="rounded-full bg-rose-500 px-4 py-2 text-sm font-bold text-white shadow hover:bg-rose-600 disabled:opacity-50">
          {recording ? "● 录制中（播完自动下载）" : "● 录制成片 WebM"}
        </button>
      </div>

      <div className="mt-3 rounded-xl bg-white/80 p-3 text-sm text-slate-700 ring-1 ring-slate-200">
        <span className="mr-2 rounded bg-sky-100 px-2 py-0.5 font-mono text-xs text-sky-700">#{shotIdx} · {shot.start.toFixed(2)}s</span>
        {shot.word && <b className="mr-2 text-rose-500">「{shot.word}」</b>}
        <span>{mode === "3d" ? (IDEA3D[shot.key] ?? shot.idea) : shot.idea}</span>
      </div>
    </div>
  );
}
