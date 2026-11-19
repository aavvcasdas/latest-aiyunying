"use client";

import { useEffect, useRef, useState } from "react";
import { loadAssets, makeEnv } from "./assets";
import { ACTIONS, ACTION_IDS } from "@/mv/actions";
import { CAST, CAST_IDS } from "@/mv/cast";
import { EMOTES, EMOTE_IDS, type Ctx2D } from "@/mv/rig";
import { BGS, FRAMINGS, renderShot, type Env } from "@/mv/scene";
import type { CastId, Framing, Shot } from "@/mv/types";

const W = 800;
const H = 900;

interface Stage {
  who: CastId;
  action: string;
  emote: string;
  framing: Framing;
  bg: string;
  flip: boolean;
  /** 动作从哪一刻（performance.now 秒）开始 */
  startedAt: number;
}

export default function CastStudio() {
  const [who, setWho] = useState<CastId>("whale");
  const [action, setAction] = useState("wave");
  const [emote, setEmote] = useState("");
  const [framing, setFraming] = useState<Framing>("full");
  const [bg, setBg] = useState("day");
  const [flip, setFlip] = useState(false);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadErr, setLoadErr] = useState("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const envRef = useRef<Env | null>(null);
  const stage = useRef<Stage>({ who, action, emote, framing, bg, flip, startedAt: 0 });

  useEffect(() => {
    const s = stage.current;
    const restart = s.who !== who || s.action !== action;
    Object.assign(s, { who, action, emote, framing, bg, flip });
    if (restart) s.startedAt = performance.now() / 1000;
  }, [who, action, emote, framing, bg, flip]);

  useEffect(() => {
    let alive = true;
    loadAssets((d, total) => alive && setProgress(d / total))
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

  useEffect(() => {
    if (!ready) return;
    const canvas = canvasRef.current;
    const env = envRef.current;
    if (!canvas || !env) return;
    const ctx = canvas.getContext("2d") as Ctx2D;
    ctx.imageSmoothingQuality = "high";
    let raf = 0;
    const frame = (now: number) => {
      const s = stage.current;
      const T = now / 1000;
      const def = ACTIONS[s.action] ?? ACTIONS.idle;
      let lt = T - s.startedAt;
      // 一次性动作播完歇一秒再重播，方便反复看
      if (!def.loop) lt = lt % (def.dur + 1);
      const shot: Shot = {
        id: "preview", b0: 0, b1: 1e6, title: "", line: -1, bg: s.bg, fx: "none", cam: "still", framing: s.framing,
        actors: [{ who: s.who, action: s.action, x: 0, flip: s.flip, emote: s.emote || undefined, delay: 0.1 }],
      };
      renderShot(ctx, env, shot, T, lt);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [ready]);

  const m = CAST[who];
  const signature = m.actions.filter((id) => ACTIONS[id]);
  const others = ACTION_IDS.filter((id) => !signature.includes(id));
  const replay = () => {
    stage.current.startedAt = performance.now() / 1000;
  };

  const actionButton = (id: string) => (
    <button
      key={id}
      type="button"
      onClick={() => {
        setAction(id);
        replay();
      }}
      aria-pressed={action === id}
      className={`rounded-lg border px-2.5 py-2 text-left text-sm transition-colors ${
        action === id ? "border-amber-300 bg-amber-300/15 text-amber-100" : "border-line bg-panel-2/60 text-slate-300 hover:border-slate-500"
      }`}
    >
      <span className="block">{ACTIONS[id].label}</span>
      <span className="block text-[11px] text-slate-500">{id} · {ACTIONS[id].loop ? "循环" : "一次"}</span>
    </button>
  );

  return (
    <main className="mx-auto max-w-[1560px] px-4 py-5 sm:px-6">
      <div className="mb-5 max-w-3xl">
        <h1 className="font-display text-3xl text-amber-100">立绘动作库</h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          八位角色都换成了立绘。动作不是换图：一张立绘沿脊柱切成百来条，按动作的参数逐条平移、旋转、压缩，再叠上呼吸，所以点头、歪头、鞠躬、屈膝、起跳都是连续的形变。点右边的动作实时看效果。
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)_minmax(300px,380px)]">
        {/* 角色 */}
        <div className="grid grid-cols-4 gap-2 self-start sm:grid-cols-8 lg:grid-cols-2">
          {CAST_IDS.map((id) => {
            const c = CAST[id];
            const on = id === who;
            return (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setWho(id);
                  if (!c.actions.includes(action)) setAction(c.actions[1] ?? "idle");
                }}
                aria-pressed={on}
                className={`overflow-hidden rounded-xl border text-left transition-all ${on ? "border-transparent ring-2" : "border-line hover:border-slate-500"}`}
                style={on ? { boxShadow: `0 0 0 2px ${c.color}` } : undefined}
              >
                <span className="block aspect-square overflow-hidden" style={{ background: `linear-gradient(160deg, ${c.color}55, #151729)` }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.src} alt={`${c.name}的立绘`} className="h-[260%] w-full max-w-none object-cover object-top" loading="lazy" />
                </span>
                <span className="block bg-panel px-2 py-1.5">
                  <span className="block truncate text-sm text-slate-100">{c.name}</span>
                  <span className="block truncate text-[11px] text-slate-500">{c.alias}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* 预览 */}
        <div className="min-w-0">
          <div className="relative mx-auto w-full max-w-[640px] overflow-hidden rounded-2xl border border-line bg-black shadow-2xl shadow-black/50" style={{ aspectRatio: `${W} / ${H}` }}>
            <canvas ref={canvasRef} width={W} height={H} className="block h-full w-full" aria-label={`${m.name}正在演示动作：${ACTIONS[action]?.label ?? action}`} />
            {!ready && (
              <div className="absolute inset-0 grid place-items-center bg-ink">
                {loadErr ? (
                  <p className="max-w-xs px-6 text-center text-sm text-rose-300">{loadErr}。刷新页面重试。</p>
                ) : (
                  <div className="w-48 text-center">
                    <p className="font-display mb-3 text-lg text-amber-100">立绘入场中…</p>
                    <div className="h-1.5 overflow-hidden rounded-full bg-panel-2">
                      <div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-pink-300 transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="mx-auto mt-3 flex max-w-[640px] flex-wrap items-center gap-2 text-xs text-slate-300">
            <div className="flex overflow-hidden rounded-full border border-line" role="group" aria-label="景别">
              {(Object.keys(FRAMINGS) as Framing[]).map((f) => (
                <button key={f} type="button" onClick={() => setFraming(f)} aria-pressed={framing === f} className={`px-3 py-1.5 ${framing === f ? "bg-amber-300 text-slate-900" : "hover:bg-panel-2"}`}>
                  {FRAMINGS[f]}
                </button>
              ))}
            </div>
            <select value={bg} onChange={(e) => setBg(e.target.value)} aria-label="背景" className="!rounded-full !px-3">
              {Object.entries(BGS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <label className="flex cursor-pointer items-center gap-1.5 rounded-full border border-line px-3 py-1.5">
              <input type="checkbox" checked={flip} onChange={(e) => setFlip(e.target.checked)} />
              朝左
            </label>
            <button type="button" onClick={replay} className="rounded-full border border-line px-3 py-1.5 hover:border-slate-500">
              重播动作
            </button>
          </div>
        </div>

        {/* 动作 */}
        <div className="min-w-0 space-y-4">
          <div className="rounded-2xl border border-line bg-panel p-4" style={{ borderTop: `3px solid ${m.color}` }}>
            <h2 className="font-display text-2xl text-slate-50">
              {m.name} <span className="font-sans text-sm text-slate-400">{m.alias}</span>
            </h2>
            <p className="mt-2 text-sm text-slate-300">{m.look}</p>
            <p className="mt-1 text-sm text-slate-500">「{m.motto}」</p>
          </div>

          <div className="rounded-2xl border border-line bg-panel p-4">
            <h3 className="text-sm font-medium text-amber-100">招牌动作 <span className="font-normal text-slate-500">· {signature.length} 个</span></h3>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">{signature.map(actionButton)}</div>
            <h3 className="mt-4 text-sm font-medium text-slate-300">其他动作 <span className="font-normal text-slate-500">· 每个人都能演</span></h3>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">{others.map(actionButton)}</div>
          </div>

          <div className="rounded-2xl border border-line bg-panel p-4">
            <h3 className="text-sm font-medium text-slate-300">头顶表情贴</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {["", ...EMOTE_IDS].map((id) => (
                <button
                  key={id || "auto"}
                  type="button"
                  onClick={() => setEmote(id)}
                  aria-pressed={emote === id}
                  className={`rounded-full border px-3 py-1 text-xs ${emote === id ? "border-pink-300 bg-pink-300/15 text-pink-100" : "border-line text-slate-300 hover:border-slate-500"}`}
                >
                  {id ? EMOTES[id] : "跟随动作"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
