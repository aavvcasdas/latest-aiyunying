"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { loadAssets, makeEnv } from "./assets";
import { ACTIONS, ACTION_IDS } from "@/mv/actions";
import { CAST, CAST_IDS } from "@/mv/cast";
import { EMOTES, EMOTE_IDS, type Ctx2D } from "@/mv/rig";
import { BGS, CAMS, FRAMINGS, FXS, renderMv, shotIndexAt, type Env } from "@/mv/scene";
import { DEFAULT_SHOTS, applyPatches } from "@/mv/shots";
import { DURATION, LINES, bt, fmtTime, toBeat } from "@/mv/timeline";
import type { ActorCue, CastId, Framing, Shot, ShotPatch } from "@/mv/types";

const W = 1280;
const H = 720;
const SONG = "/audio/goujiqishi.mp3";

const toPatch = (s: Shot): ShotPatch => ({ bg: s.bg, fx: s.fx, cam: s.cam, framing: s.framing, actors: s.actors });

interface Clock {
  playing: boolean;
  /** 暂停时停在的秒数 */
  t: number;
  /** 播放时：base 秒对应 performance.now() = at */
  base: number;
  at: number;
}

export default function MvPlayer({ initialPatches, dbOk }: { initialPatches: Record<string, ShotPatch>; dbOk: boolean }) {
  const [shots, setShots] = useState<Shot[]>(() => applyPatches(initialPatches));
  const [dirty, setDirty] = useState<Set<string>>(() => new Set());
  const [cur, setCur] = useState(0);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadErr, setLoadErr] = useState("");
  const [loopShot, setLoopShot] = useState(false);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const envRef = useRef<Env | null>(null);
  const shotsRef = useRef(shots);
  const clock = useRef<Clock>({ playing: false, t: 0, base: 0, at: 0 });
  const loopRef = useRef({ on: false, target: 0 });
  const recRef = useRef<MediaRecorder | null>(null);
  const audioGraph = useRef<{ ac: AudioContext; src: MediaElementAudioSourceNode } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    shotsRef.current = shots;
  }, [shots]);
  useEffect(() => {
    loopRef.current.on = loopShot;
  }, [loopShot]);

  /* ------------------------------- 时钟与播放 ------------------------------- */

  const getT = useCallback(() => {
    const c = clock.current;
    return c.playing ? Math.min(DURATION, c.base + (performance.now() - c.at) / 1000) : c.t;
  }, []);

  const seek = useCallback((t: number) => {
    const c = clock.current;
    const v = Math.max(0, Math.min(DURATION - 0.02, t));
    c.t = v;
    c.base = v;
    c.at = performance.now();
    loopRef.current.target = shotIndexAt(shotsRef.current, toBeat(v));
    const a = audioRef.current;
    if (a) {
      try {
        a.currentTime = v;
      } catch {
        /* 音轨还没就绪：画面照走 */
      }
    }
    setTime(v);
  }, []);

  const pause = useCallback(() => {
    const c = clock.current;
    c.t = getT();
    c.playing = false;
    audioRef.current?.pause();
    setPlaying(false);
  }, [getT]);

  const play = useCallback(() => {
    const c = clock.current;
    if (c.t >= DURATION - 0.1) seek(0);
    c.base = c.t;
    c.at = performance.now();
    c.playing = true;
    setPlaying(true);
    const a = audioRef.current;
    if (a) {
      try {
        a.currentTime = c.base;
      } catch {
        /* 同上 */
      }
      a.play().catch(() => undefined);
    }
  }, [seek]);

  const toggle = useCallback(() => (clock.current.playing ? pause() : play()), [pause, play]);

  const stopRecording = useCallback(() => {
    const rec = recRef.current;
    if (rec && rec.state !== "inactive") rec.stop();
  }, []);

  /* --------------------------------- 素材 --------------------------------- */

  useEffect(() => {
    let alive = true;
    const onProgress = (d: number, total: number) => alive && setProgress(d / total);
    loadAssets(onProgress)
      .then((assets) => {
        if (!alive) return;
        envRef.current = makeEnv(W, H, assets);
        setReady(true);
      })
      .catch((err: Error) => alive && setLoadErr(err.message));
    return () => {
      alive = false;
    };
  }, []);

  // 逐帧出片契约：render(t) 只依赖 t，不读 rAF / performance.now / 音频播放头。
  // tools/shoot_film_adapter.mjs 会先冻住页面自播循环，再按固定时间取 PNG 帧。
  useEffect(() => {
    if (!ready) return;
    const w = window as typeof window & {
      __FILM__?: {
        ready: () => boolean;
        duration: number;
        fps: number;
        render: (t: number) => void;
      };
    };
    w.__FILM__ = {
      ready: () => ready && !!envRef.current,
      duration: DURATION,
      fps: 30,
      render: (t: number) => {
        const canvas = canvasRef.current;
        const env = envRef.current;
        if (!canvas || !env) return;
        const ctx = canvas.getContext("2d") as Ctx2D;
        ctx.imageSmoothingQuality = "high";
        renderMv(ctx, env, shotsRef.current, Math.max(0, Math.min(DURATION - 0.001, t)), true);
      },
    };
    return () => {
      delete w.__FILM__;
    };
  }, [ready]);

  /* -------------------------------- 渲染循环 -------------------------------- */

  useEffect(() => {
    if (!ready) return;
    const canvas = canvasRef.current;
    const env = envRef.current;
    if (!canvas || !env) return;
    const ctx = canvas.getContext("2d") as Ctx2D;
    ctx.imageSmoothingQuality = "high";
    let raf = 0;
    let lastIdx = -1;
    let lastUi = 0;
    const frame = (now: number) => {
      const c = clock.current;
      const a = audioRef.current;
      let T = getT();
      // 画面跟着音轨走：差出 0.12 秒就以音轨为准
      if (c.playing && a && !a.paused && a.readyState >= 2 && Math.abs(a.currentTime - T) > 0.12) {
        c.base = a.currentTime;
        c.at = now;
        T = a.currentTime;
      }
      if (c.playing && T >= DURATION - 0.02) {
        c.t = DURATION - 0.02;
        c.playing = false;
        a?.pause();
        setPlaying(false);
        stopRecording();
      }
      // 循环本镜：走出这个镜头就跳回它的开头
      const lp = loopRef.current;
      if (lp.on && c.playing && !recRef.current && shotIndexAt(shotsRef.current, toBeat(T)) !== lp.target) {
        T = bt(shotsRef.current[lp.target].b0);
        c.base = T;
        c.at = now;
        if (a) a.currentTime = T;
      }
      const idx = renderMv(ctx, env, shotsRef.current, T, c.playing);
      if (idx !== lastIdx) {
        lastIdx = idx;
        setCur(idx);
      }
      if (now - lastUi > 120) {
        lastUi = now;
        setTime(T);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [ready, getT, stopRecording]);

  // 镜头列表跟着当前镜头滚动
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-shot="${cur}"]`);
    const box = listRef.current;
    if (el && box) {
      const top = el.offsetTop - box.clientHeight / 2 + el.clientHeight / 2;
      box.scrollTo({ top, behavior: "smooth" });
    }
    setMsg(null);
  }, [cur]);

  // 键盘：空格播放 / 暂停，左右方向键切镜头
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      // 焦点在分镜列表上时，空格和方向键照样管播放（回车才是「跳到这个镜头」）；其余按钮、输入框保持各自的键盘行为
      const inShotList = !!el?.closest("[data-shot]");
      if (!inShotList && (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA" || tag === "BUTTON" || tag === "A")) return;
      if (e.code === "Space") {
        e.preventDefault();
        toggle();
      } else if (e.code === "ArrowRight" || e.code === "ArrowLeft") {
        e.preventDefault();
        const i = shotIndexAt(shotsRef.current, toBeat(getT())) + (e.code === "ArrowRight" ? 1 : -1);
        const s = shotsRef.current[Math.max(0, Math.min(shotsRef.current.length - 1, i))];
        seek(bt(s.b0) + 0.01);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, seek, getT]);

  /* --------------------------------- 录制 --------------------------------- */

  const toggleRecord = useCallback(async () => {
    if (recRef.current) {
      stopRecording();
      return;
    }
    const canvas = canvasRef.current;
    const a = audioRef.current;
    if (!canvas || typeof MediaRecorder === "undefined" || !canvas.captureStream) {
      setMsg({ ok: false, text: "这个浏览器不支持画布录制，请换用新版 Chrome 或 Edge。" });
      return;
    }
    const stream = canvas.captureStream(30);
    let dest: MediaStreamAudioDestinationNode | null = null;
    try {
      if (a) {
        if (!audioGraph.current) {
          const ac = new AudioContext();
          const src = ac.createMediaElementSource(a);
          src.connect(ac.destination);
          audioGraph.current = { ac, src };
        }
        const { ac, src } = audioGraph.current;
        await ac.resume();
        dest = ac.createMediaStreamDestination();
        src.connect(dest);
        dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
      }
    } catch {
      setMsg({ ok: false, text: "音轨接不进录制，这一版只录画面。" });
    }
    const mime = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm", "video/mp4"].find((m) => MediaRecorder.isTypeSupported(m));
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 });
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      recRef.current = null;
      setRecording(false);
      pause();
      if (dest && audioGraph.current) audioGraph.current.src.disconnect(dest);
      stream.getTracks().forEach((t) => t.stop());
      if (!chunks.length) return;
      const blob = new Blob(chunks, { type: rec.mimeType || "video/webm" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `勾指起誓_立绘版.${blob.type.includes("mp4") ? "mp4" : "webm"}`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setMsg({ ok: true, text: `录好了，已下载（${(blob.size / 1048576).toFixed(1)} MB）。` });
    };
    recRef.current = rec;
    setRecording(true);
    pause();
    seek(0);
    rec.start(1000);
    play();
  }, [pause, play, seek, stopRecording]);

  /* --------------------------------- 编排 --------------------------------- */

  const shot = shots[cur] ?? shots[0];

  const patchShot = (id: string, part: Partial<ShotPatch>) => {
    setShots((prev) => prev.map((s) => (s.id === id ? { ...s, ...part } : s)));
    setDirty((prev) => new Set(prev).add(id));
    setMsg(null);
  };
  const patchActor = (i: number, part: Partial<ActorCue>) =>
    patchShot(shot.id, { actors: shot.actors.map((a, k) => (k === i ? { ...a, ...part } : a)) });

  const clearDirty = (id: string) =>
    setDirty((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

  const save = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/shots/${shot.id}`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(toPatch(shot)) });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "保存失败");
      setShots((prev) => prev.map((s) => (s.id === shot.id ? { ...s, edited: true } : s)));
      clearDirty(shot.id);
      setMsg({ ok: true, text: `镜头 ${shot.id} 的编排已存进数据库。` });
    } catch (err) {
      setMsg({ ok: false, text: `${(err as Error).message}。你的改动还在页面上，可以再试一次。` });
    } finally {
      setBusy(false);
    }
  };

  const reset = async () => {
    setBusy(true);
    try {
      if (shot.edited) {
        const res = await fetch(`/api/shots/${shot.id}`, { method: "DELETE" });
        if (!res.ok) throw new Error("恢复失败");
      }
      const def = DEFAULT_SHOTS.find((s) => s.id === shot.id);
      if (def) setShots((prev) => prev.map((s) => (s.id === shot.id ? def : s)));
      clearDirty(shot.id);
      setMsg({ ok: true, text: `镜头 ${shot.id} 已恢复成默认编排。` });
    } catch (err) {
      setMsg({ ok: false, text: `${(err as Error).message}，数据库暂时不可用。` });
    } finally {
      setBusy(false);
    }
  };

  const isDirty = dirty.has(shot.id);
  const line = shot.line >= 0 ? LINES[shot.line].text : null;

  return (
    <main className="mx-auto grid max-w-[1560px] gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_330px]">
      <section className="min-w-0 space-y-4">
        {/* 画面 */}
        <div className="overflow-hidden rounded-2xl border border-line bg-black shadow-2xl shadow-black/50">
          <div className="relative aspect-video w-full">
            <canvas
              ref={canvasRef}
              width={W}
              height={H}
              onClick={() => ready && toggle()}
              className="block h-full w-full cursor-pointer"
              aria-label="MV 画面，点击播放或暂停"
            />
            {!ready && (
              <div className="absolute inset-0 grid place-items-center bg-ink">
                {loadErr ? (
                  <p className="max-w-sm px-6 text-center text-sm text-rose-300">{loadErr}。刷新页面重试。</p>
                ) : (
                  <div className="w-56 text-center">
                    <p className="font-display mb-3 text-lg text-amber-100">立绘入场中…</p>
                    <div className="h-1.5 overflow-hidden rounded-full bg-panel-2">
                      <div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-pink-300 transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />
                    </div>
                  </div>
                )}
              </div>
            )}
            {ready && !playing && time < 0.05 && (
              <button
                type="button"
                onClick={play}
                className="absolute inset-0 grid place-items-center bg-black/35 transition-colors hover:bg-black/20"
                aria-label="播放 MV"
              >
                <span className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-amber-300 to-pink-300 text-slate-900 shadow-xl">
                  <svg viewBox="0 0 24 24" className="ml-1 h-9 w-9" fill="currentColor" aria-hidden="true"><path d="M7 4.5v15l13-7.5z" /></svg>
                </span>
              </button>
            )}
            {recording && (
              <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1 text-xs text-rose-200">
                <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
                录制中（这个标记不会录进视频）
              </div>
            )}
          </div>

          {/* 控制条 */}
          <div className="space-y-2 bg-panel px-3 py-3 sm:px-4">
            <input
              type="range"
              min={0}
              max={DURATION}
              step={0.01}
              value={time}
              disabled={!ready || recording}
              onChange={(e) => seek(+e.target.value)}
              className="block w-full"
              aria-label="播放进度"
            />
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
              <button
                type="button"
                onClick={toggle}
                disabled={!ready}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-to-br from-amber-300 to-pink-300 text-slate-900 disabled:opacity-40"
                aria-label={playing ? "暂停" : "播放"}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                  {playing ? <path d="M6 5h4v14H6zM14 5h4v14h-4z" /> : <path d="M7 4.5v15l13-7.5z" />}
                </svg>
              </button>
              <span className="tabular-nums text-slate-300">
                {fmtTime(time)} <span className="text-slate-500">/ {fmtTime(DURATION)}</span>
              </span>
              <span className="min-w-0 flex-1 truncate text-slate-400">
                <span className="mr-2 rounded bg-panel-2 px-1.5 py-0.5 text-xs text-amber-200">{shot.id}</span>
                {shot.title}
              </span>
              <label className="flex cursor-pointer items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs text-slate-300 hover:border-slate-500">
                <input type="checkbox" checked={loopShot} onChange={(e) => { loopRef.current.target = cur; setLoopShot(e.target.checked); }} />
                循环本镜
              </label>
              <button
                type="button"
                onClick={toggleRecord}
                disabled={!ready}
                className={`rounded-full border px-3 py-1.5 text-xs disabled:opacity-40 ${recording ? "border-rose-400 bg-rose-500/20 text-rose-100" : "border-line text-slate-300 hover:border-slate-500"}`}
              >
                {recording ? "停止并下载" : "录制整片"}
              </button>
              <button
                type="button"
                onClick={() => canvasRef.current?.requestFullscreen?.().catch(() => undefined)}
                className="rounded-full border border-line px-3 py-1.5 text-xs text-slate-300 hover:border-slate-500"
              >
                全屏
              </button>
            </div>
          </div>
        </div>
        <audio ref={audioRef} src={SONG} preload="auto" className="hidden" />

        {/* 编排 */}
        <div className="rounded-2xl border border-line bg-panel p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-display text-xl text-amber-100">
                镜头编排 <span className="text-slate-400">· {shot.id}</span>
                {shot.edited && <span className="ml-2 rounded-full bg-emerald-500/15 px-2 py-0.5 align-middle font-sans text-xs text-emerald-300">已改过</span>}
                {isDirty && <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 align-middle font-sans text-xs text-amber-300">未保存</span>}
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                {shot.title}
                {line && <span className="ml-2 text-pink-200">♪ {line}</span>}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={reset}
                disabled={busy || (!shot.edited && !isDirty)}
                className="rounded-lg border border-line px-3 py-2 text-sm text-slate-300 hover:border-slate-500 disabled:opacity-40"
              >
                恢复默认
              </button>
              <button
                type="button"
                onClick={save}
                disabled={busy || !isDirty}
                className="rounded-lg bg-gradient-to-r from-amber-300 to-pink-300 px-4 py-2 text-sm font-medium text-slate-900 disabled:opacity-40"
              >
                {busy ? "处理中…" : "保存编排"}
              </button>
            </div>
          </div>

          {msg && (
            <p role="status" className={`mt-3 rounded-lg px-3 py-2 text-sm ${msg.ok ? "bg-emerald-500/10 text-emerald-200" : "bg-rose-500/10 text-rose-200"}`}>
              {msg.text}
            </p>
          )}
          {!dbOk && !msg && (
            <p className="mt-3 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-200">数据库暂时连不上：现在看到的是默认分镜，改动可以预览但可能存不进去。</p>
          )}

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="背景">
              <select value={shot.bg} onChange={(e) => patchShot(shot.id, { bg: e.target.value })}>
                {Object.entries(BGS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </Field>
            <Field label="特效">
              <select value={shot.fx} onChange={(e) => patchShot(shot.id, { fx: e.target.value })}>
                {Object.entries(FXS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label="运镜">
              <select value={shot.cam} onChange={(e) => patchShot(shot.id, { cam: e.target.value })}>
                {Object.entries(CAMS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field label="景别">
              <select value={shot.framing} onChange={(e) => patchShot(shot.id, { framing: e.target.value as Framing })}>
                {Object.entries(FRAMINGS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
          </div>

          <div className="mt-5 space-y-2">
            {shot.actors.length === 0 && <p className="rounded-lg border border-dashed border-line px-3 py-4 text-center text-sm text-slate-400">这个镜头里没有人。加一位角色让她上场。</p>}
            {shot.actors.map((a, i) => {
              const m = CAST[a.who];
              const others = ACTION_IDS.filter((id) => !m.actions.includes(id));
              return (
                <div key={i} className="grid grid-cols-2 items-end gap-x-3 gap-y-2 rounded-xl border border-line bg-panel-2/50 p-3 sm:grid-cols-[1fr_1.2fr_1fr] xl:grid-cols-[0.9fr_1.1fr_0.9fr_1.6fr_0.8fr_auto]">
                  <Field label="角色">
                    <select value={a.who} onChange={(e) => patchActor(i, { who: e.target.value as CastId })} style={{ borderLeft: `3px solid ${m.color}` }}>
                      {CAST_IDS.map((id) => <option key={id} value={id}>{CAST[id].name}</option>)}
                    </select>
                  </Field>
                  <Field label="动作">
                    <select value={a.action} onChange={(e) => patchActor(i, { action: e.target.value })}>
                      <optgroup label={`${m.name}的招牌动作`}>
                        {m.actions.filter((id) => ACTIONS[id]).map((id) => <option key={id} value={id}>{ACTIONS[id].label}</option>)}
                      </optgroup>
                      <optgroup label="其他动作">
                        {others.map((id) => <option key={id} value={id}>{ACTIONS[id].label}</option>)}
                      </optgroup>
                    </select>
                  </Field>
                  <Field label="表情贴">
                    <select value={a.emote ?? ""} onChange={(e) => patchActor(i, { emote: e.target.value || undefined })}>
                      <option value="">跟随动作</option>
                      {EMOTE_IDS.map((id) => <option key={id} value={id}>{EMOTES[id]}</option>)}
                    </select>
                  </Field>
                  <Field label={`站位 ${a.x.toFixed(2)}`}>
                    <input type="range" min={-1} max={1} step={0.02} value={a.x} onChange={(e) => patchActor(i, { x: +e.target.value })} className="h-[30px]" />
                  </Field>
                  <Field label="移动到">
                    <input
                      type="number"
                      min={-1.2}
                      max={1.2}
                      step={0.05}
                      placeholder="不动"
                      value={a.x2 ?? ""}
                      onChange={(e) => patchActor(i, { x2: e.target.value === "" ? undefined : Math.max(-1.2, Math.min(1.2, +e.target.value)) })}
                    />
                  </Field>
                  <div className="flex items-center gap-3 pb-1">
                    <label className="flex cursor-pointer items-center gap-1.5 text-xs text-slate-300">
                      <input type="checkbox" checked={!!a.flip} onChange={(e) => patchActor(i, { flip: e.target.checked || undefined })} />
                      朝左
                    </label>
                    <button
                      type="button"
                      onClick={() => patchShot(shot.id, { actors: shot.actors.filter((_, k) => k !== i) })}
                      className="rounded-md px-2 py-1 text-xs text-rose-300 hover:bg-rose-500/10"
                      aria-label={`让${m.name}退场`}
                    >
                      退场
                    </button>
                  </div>
                </div>
              );
            })}
            <button
              type="button"
              disabled={shot.actors.length >= 8}
              onClick={() => {
                const used = new Set(shot.actors.map((a) => a.who));
                const who = CAST_IDS.find((id) => !used.has(id)) ?? "whale";
                patchShot(shot.id, { actors: [...shot.actors, { who, action: "idle", x: 0 }] });
              }}
              className="w-full rounded-xl border border-dashed border-line py-2.5 text-sm text-slate-300 hover:border-amber-300/60 hover:text-amber-100 disabled:opacity-40"
            >
              ＋ 加一位角色
            </button>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-slate-500">
            改动立刻反映在画面上；勾上「循环本镜」可以边放边调。站位 -1 是画面最左、1 是最右；「走」「跑」会按「移动到」的方向自动转身。空格播放 / 暂停，← → 切镜头。
          </p>
        </div>
      </section>

      {/* 镜头列表 */}
      <aside className="min-w-0 lg:sticky lg:top-4 lg:self-start">
        <div className="rounded-2xl border border-line bg-panel">
          <div className="flex items-baseline justify-between px-4 pb-2 pt-4">
            <h2 className="font-display text-lg text-amber-100">分镜</h2>
            <span className="text-xs text-slate-500">{shots.length} 个镜头 · {LINES.length} 句词</span>
          </div>
          <div ref={listRef} className="thin-scroll relative max-h-[420px] overflow-y-auto px-2 pb-2 lg:max-h-[calc(100vh-150px)]">
            {shots.map((s, i) => (
              <button
                key={s.id}
                type="button"
                data-shot={i}
                onClick={() => seek(bt(s.b0) + 0.01)}
                aria-current={i === cur ? "true" : undefined}
                className={`mb-1 flex w-full items-start gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors ${i === cur ? "bg-gradient-to-r from-amber-300/20 to-pink-300/10 ring-1 ring-amber-300/40" : "hover:bg-panel-2"}`}
              >
                <span className={`mt-0.5 w-10 shrink-0 rounded px-1 py-0.5 text-center text-[11px] tabular-nums ${i === cur ? "bg-amber-300 text-slate-900" : "bg-panel-2 text-slate-400"}`}>{s.id}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] text-slate-200">{s.title}</span>
                  <span className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                    <span className="tabular-nums">{fmtTime(bt(s.b0))}</span>
                    <span className="flex gap-0.5">
                      {s.actors.map((a, k) => <span key={k} className="h-2 w-2 rounded-full" style={{ background: CAST[a.who].color }} title={CAST[a.who].name} />)}
                    </span>
                    {(s.edited || dirty.has(s.id)) && <span className={dirty.has(s.id) ? "text-amber-300" : "text-emerald-300"}>{dirty.has(s.id) ? "未保存" : "已改"}</span>}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </aside>
    </main>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1 text-xs text-slate-400">
      <span>{label}</span>
      {children}
    </label>
  );
}
