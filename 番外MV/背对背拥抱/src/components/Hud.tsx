import { useEffect, useMemo, useRef, useState } from "react";
import type { MVPlayer } from "@/hooks/useMVPlayer";
import { CAST, CAST_ORDER } from "@/data/cast";
import { CUES, SECTION_COLOR, SECTION_LABEL } from "@/data/cues";
import { LOOKS } from "@/lib/mv";
import { fmtTime } from "@/lib/mv";
import type { Cue } from "@/lib/mv";
import { Portrait } from "@/components/Sprite";
import type { LyricTone } from "@/components/LyricBar";

/* ------------------------------- 小组件 ------------------------------- */
export function Chip({
  children,
  color,
  title,
}: {
  children: React.ReactNode;
  color?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className="inline-flex items-center gap-1.5 rounded-[4px] border px-2 py-[3px] text-[11px] leading-none tracking-[0.12em]"
      style={{
        borderColor: color ?? "rgba(255,209,102,.32)",
        color: color ?? "#ffe9b8",
        background: "rgba(255,255,255,.04)",
        fontFamily: "var(--body)",
      }}
    >
      {children}
    </span>
  );
}

function IconBtn({
  onClick,
  children,
  label,
  active,
  wide,
}: {
  onClick: () => void;
  children: React.ReactNode;
  label: string;
  active?: boolean;
  wide?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={`btn rounded-[5px] border px-2.5 py-1.5 text-[12px] tracking-[0.08em] ${wide ? "min-w-[86px]" : ""}`}
      style={{
        borderColor: active ? "rgba(255,209,102,.85)" : "rgba(255,224,170,.2)",
        background: active ? "linear-gradient(180deg,rgba(255,209,102,.26),rgba(255,209,102,.1))" : "rgba(255,255,255,.04)",
        color: active ? "#ffe9a8" : "rgba(255,240,214,.72)",
      }}
    >
      {children}
    </button>
  );
}

/* ------------------------------- 顶栏 ------------------------------- */
export function TopBar({ p, cue, onTogglePanel }: { p: MVPlayer; cue: Cue; onTogglePanel: () => void }) {
  const meterRef = useRef<HTMLDivElement>( null);
  const barsRef = useRef<Array<HTMLSpanElement | null>>([]);
  const timeRef = useRef<HTMLSpanElement | null>(null);
  const shotRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    return p.subscribe((t, e) => {
      if (timeRef.current) timeRef.current.textContent = fmtTime(t);
      if (meterRef.current) meterRef.current.style.opacity = String(0.45 + e * 0.55);
      barsRef.current.forEach((b, i) => {
        if (!b) return;
        const th = (i + 1) / barsRef.current.length;
        b.style.background = e > th ? "#ffd166" : "rgba(255,224,170,.18)";
        b.style.transform = `scaleY(${0.4 + Math.min(1, e * 1.6) * (1 - i * 0.05)})`;
      });
      if (shotRef.current) shotRef.current.textContent = cue.shot.note;
    });
  }, [p, cue]);

  const look = LOOKS[cue.shot.look];
  return (
    <header className="panel relative z-30 flex items-center gap-4 border-x-0 border-t-0 px-4 py-2.5">
      <div className="flex items-baseline gap-3">
        <h1
          className="font-display text-[26px] leading-none tracking-[0.06em]"
          style={{ color: "#ffe9b8", textShadow: "0 2px 0 #8a5a12, 0 6px 18px rgba(255,180,80,.25)" }}
        >
          背对背拥抱
        </h1>
        <span className="hidden text-[11px] tracking-[0.3em] text-[#cbb8e8] sm:inline">纸片人 · 治愈系复刻</span>
      </div>

      <div className="mx-1 h-7 w-px bg-[rgba(255,224,170,.16)]" />

      <div className="flex items-center gap-2">
        <Chip color={SECTION_COLOR[cue.section]}>{SECTION_LABEL[cue.section]}</Chip>
        <Chip>
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: look.light }} />
          {look.name}
        </Chip>
        <Chip>第 {String(cue.i + 1).padStart(2, "0")} / {CUES.length} 镜</Chip>
        <Chip color={p.mode === "audio" ? "#8fd6a8" : "#f2a7a0"}>
          {p.mode === "audio" ? "音轨已对齐" : "无声样片"}
        </Chip>
      </div>

      <span ref={shotRef} className="hidden min-w-0 flex-1 truncate text-[12px] text-[rgba(255,240,214,.5)] xl:block">
        {cue.shot.note}
      </span>

      <div className="ml-auto flex items-center gap-3">
        <div ref={meterRef} className="flex h-6 items-end gap-[3px]" title="实时能量（Web Audio）">
          {Array.from({ length: 9 }).map((_, i) => (
            <span
              key={i}
              ref={(el) => {
                barsRef.current[i] = el;
              }}
              className="block w-[4px] rounded-[1px]"
              style={{ height: `${8 + i * 1.8}px`, background: "rgba(255,224,170,.18)", transformOrigin: "bottom", transition: "background 90ms linear" }}
            />
          ))}
        </div>
        <span ref={timeRef} className="font-mono-num text-[15px] text-[#ffe9b8]">
          0:00.00
        </span>
        <span className="font-mono-num text-[12px] text-[rgba(255,240,214,.4)]">/ {fmtTime(p.duration)}</span>
        <IconBtn onClick={onTogglePanel} label="面板">
          面板
        </IconBtn>
      </div>
    </header>
  );
}

/* ------------------------------- 走带 ------------------------------- */
export function Transport({
  p,
  tone,
  setTone,
  karaoke,
  setKaraoke,
  subtitles,
  setSubtitles,
  showTags,
  setShowTags,
  wordMark,
  setWordMark,
  fxOn,
  setFxOn,
  words3d,
  setWords3d,
  onFullscreen,
}: {
  p: MVPlayer;
  tone: LyricTone;
  setTone: (t: LyricTone) => void;
  karaoke: boolean;
  setKaraoke: (v: boolean) => void;
  subtitles: boolean;
  setSubtitles: (v: boolean) => void;
  showTags: boolean;
  setShowTags: (v: boolean) => void;
  wordMark: boolean;
  setWordMark: (v: boolean) => void;
  fxOn: boolean;
  setFxOn: (v: boolean) => void;
  words3d: boolean;
  setWords3d: (v: boolean) => void;
  onFullscreen: () => void;
}) {
  const fillRef = useRef<HTMLDivElement | null>(null);
  const headRef = useRef<HTMLDivElement | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return p.subscribe((t) => {
      const pct = (t / p.duration) * 100;
      if (fillRef.current) fillRef.current.style.width = `${pct}%`;
      if (headRef.current) headRef.current.style.left = `${pct}%`;
    });
  }, [p]);

  const onScrub = (e: React.PointerEvent) => {
    const el = barRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    p.seek(ratio * p.duration);
  };

  return (
    <footer className="panel relative z-30 border-x-0 border-b-0 px-4 py-3">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={p.toggle}
          className="btn grid h-12 w-12 place-items-center rounded-full border-2"
          style={{
            borderColor: "#ffd166",
            background: p.playing ? "radial-gradient(circle at 35% 30%,#fff3cf,#ffc94d 60%,#d99a20)" : "radial-gradient(circle at 35% 30%,#fff8ea,#f0d9a8 60%,#c9a86a)",
            color: "#2a1d3f",
            boxShadow: "0 6px 18px rgba(255,180,80,.28)",
          }}
          aria-label={p.playing ? "暂停" : "播放"}
        >
          {p.playing ? (
            <svg width="16" height="18" viewBox="0 0 16 18"><rect x="1" y="1" width="5" height="16" rx="1.5" fill="currentColor" /><rect x="10" y="1" width="5" height="16" rx="1.5" fill="currentColor" /></svg>
          ) : (
            <svg width="17" height="18" viewBox="0 0 17 18"><path d="M2 1.6 L15.4 9 L2 16.4 Z" fill="currentColor" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
          )}
        </button>

        <IconBtn onClick={() => p.stepCue(-1)} label="上一镜">
          ◀◀ 上一镜
        </IconBtn>
        <IconBtn onClick={() => p.stepCue(1)} label="下一镜">
          下一镜 ▶▶
        </IconBtn>
        <IconBtn onClick={() => p.seek(0)} label="回到片头">
          ⟲ 片头
        </IconBtn>

        {/* 进度条 + 卡点刻度 */}
        <div className="relative mx-2 h-11 flex-1 select-none" ref={barRef} onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture?.(e.pointerId); onScrub(e); }} onPointerMove={(e) => { if (e.buttons) onScrub(e); }}>
          <div className="absolute left-0 right-0 top-1/2 h-[7px] -translate-y-1/2 overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,.09)" }}>
            <div ref={fillRef} className="h-full rounded-full" style={{ width: "0%", background: "linear-gradient(90deg,#f2a7a0,#ffd166 60%,#fff3c4)", boxShadow: "0 0 14px rgba(255,209,102,.5)" }} />
          </div>
          {CUES.map((c) => (
            <span
              key={c.i}
              className="absolute top-1/2 -translate-y-1/2"
              style={{
                left: `${(c.start / p.duration) * 100}%`,
                width: 2,
                height: c.text ? 15 : 9,
                background: SECTION_COLOR[c.section],
                opacity: c.text ? 0.85 : 0.4,
                borderRadius: 2,
              }}
              title={`${fmtTime(c.start)} · ${c.text ?? SECTION_LABEL[c.section]}`}
            />
          ))}
          <div ref={headRef} className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#2a1d3f]" style={{ left: "0%", background: "radial-gradient(circle at 35% 30%,#fff8ea,#ffc94d)", boxShadow: "0 0 12px rgba(255,209,102,.8)" }} />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] tracking-[0.14em] text-[rgba(255,240,214,.5)]">音量</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={p.volume}
            onChange={(e) => p.setVolume(Number(e.target.value))}
            className="w-20"
            style={{ ["--fill" as string]: `${p.volume * 100}%` }}
            aria-label="音量"
          />
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[11px] tracking-[0.24em] text-[rgba(255,240,214,.42)]">画面</span>
        <IconBtn onClick={() => setWords3d(!words3d)} active={words3d} label="立体字牌">立体字牌</IconBtn>
        <IconBtn onClick={() => setSubtitles(!subtitles)} active={subtitles} label="字幕条">字幕条</IconBtn>
        <IconBtn onClick={() => setKaraoke(!karaoke)} active={karaoke} label="下一句预告">下一句</IconBtn>
        <IconBtn onClick={() => setWordMark(!wordMark)} active={wordMark} label="按词画线">按词画线</IconBtn>
        <IconBtn onClick={() => setTone(tone === "gold" ? "rain" : "gold")} label="字幕配色">
          {tone === "gold" ? "童话金" : "雨天蓝"}
        </IconBtn>
        <IconBtn onClick={() => setShowTags(!showTags)} active={showTags} label="名牌">名牌</IconBtn>
        <IconBtn onClick={() => setFxOn(!fxOn)} active={fxOn} label="粒子特效">粒子</IconBtn>
        <IconBtn onClick={onFullscreen} label="全屏">全屏</IconBtn>
        <span className="ml-auto text-[11px] tracking-[0.1em] text-[rgba(255,240,214,.36)]">
          空格 播放 / ←→ ±5s / ↑↓ 换镜 / F 全屏
        </span>
      </div>
    </footer>
  );
}

/* ------------------------------- 侧栏 ------------------------------- */
export type Tab = "cues" | "cast" | "shot" | "cal";

export function SidePanel({ p, cue, tab, setTab }: { p: MVPlayer; cue: Cue; tab: Tab; setTab: (t: Tab) => void }) {
  const tabs: Array<[Tab, string]> = [
    ["cues", "卡点表"],
    ["cast", "纸片人"],
    ["shot", "分镜"],
    ["cal", "校准"],
  ];
  return (
    <aside className="panel z-20 flex h-full w-full flex-col border-y-0 border-r-0">
      <div className="flex gap-1 border-b border-[rgba(255,224,170,.14)] p-2">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className="btn flex-1 rounded-[4px] px-2 py-1.5 text-[12px] tracking-[0.14em]"
            style={{
              fontFamily: "var(--display)",
              background: tab === id ? "linear-gradient(180deg,rgba(255,209,102,.3),rgba(255,209,102,.12))" : "transparent",
              color: tab === id ? "#ffe9a8" : "rgba(255,240,214,.55)",
              border: `1px solid ${tab === id ? "rgba(255,209,102,.6)" : "rgba(255,224,170,.14)"}`,
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto p-3">
        {tab === "cues" && <CueSheet p={p} cueIndex={cue.i} />}
        {tab === "cast" && <CastSheet cue={cue} />}
        {tab === "shot" && <ShotSheet cue={cue} />}
        {tab === "cal" && <Calibration p={p} />}
      </div>
    </aside>
  );
}

function CueSheet({ p, cueIndex }: { p: MVPlayer; cueIndex: number }) {
  const listRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-i="${cueIndex}"]`);
    el?.scrollIntoView?.({ block: "nearest", behavior: "smooth" });
  }, [cueIndex]);
  return (
    <div ref={listRef} className="flex flex-col gap-1">
      {CUES.map((c) => {
        const on = c.i === cueIndex;
        const past = c.i < cueIndex;
        return (
          <button
            key={c.i}
            data-i={c.i}
            type="button"
            onClick={() => p.seek(c.start + 0.02)}
            className="btn group flex items-center gap-2 rounded-[4px] border px-2 py-1.5 text-left"
            style={{
              borderColor: on ? "rgba(255,209,102,.75)" : "rgba(255,224,170,.1)",
              background: on ? "linear-gradient(90deg,rgba(255,209,102,.2),rgba(255,209,102,.04))" : "transparent",
              opacity: past ? 0.5 : 1,
            }}
          >
            <span className="font-mono-num w-[54px] shrink-0 text-[11px]" style={{ color: on ? "#ffe9a8" : "rgba(255,240,214,.45)" }}>
              {fmtTime(c.start)}
            </span>
            <span className="h-3 w-[3px] shrink-0 rounded-full" style={{ background: SECTION_COLOR[c.section] }} />
            <span
              className="min-w-0 flex-1 truncate text-[13px]"
              style={{
                fontFamily: c.text ? "var(--display)" : "var(--body)",
                letterSpacing: c.text ? "0.06em" : "0.16em",
                color: on ? "#fff6d8" : c.text ? "rgba(255,244,224,.82)" : "rgba(255,240,214,.42)",
              }}
            >
              {c.text ?? `— ${SECTION_LABEL[c.section]} · ${c.shot.note.slice(0, 12)}…`}
            </span>
            <span className="font-mono-num shrink-0 text-[10px] text-[rgba(255,240,214,.3)]">{String(c.i + 1).padStart(2, "0")}</span>
          </button>
        );
      })}
    </div>
  );
}

function CastSheet({ cue }: { cue: Cue }) {
  const onStage = useMemo(() => new Set(cue.shot.cast.map((c) => c.id)), [cue]);
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[11px] leading-relaxed tracking-[0.06em] text-[rgba(255,240,214,.5)]">
        登场人物一律用仓库自带图集里的像素纸片人（<span className="text-[#ffd166]">cast_atlas.png</span>），一格都不新增生图。
        这一镜上场的人边框会亮。
      </p>
      {CAST_ORDER.map((id) => {
        const m = CAST[id];
        const on = onStage.has(id);
        const cells = [
          m.cells.front?.[0],
          m.cells.side?.[0],
          m.cells.walkPrefix ? `${m.cells.walkPrefix}_3` : undefined,
          Object.values(m.cells.poses)[0],
        ].filter(Boolean) as string[];
        return (
          <div
            key={id}
            className="rounded-[5px] border p-2 transition-all duration-300"
            style={{
              borderColor: on ? `${m.color}cc` : "rgba(255,224,170,.12)",
              background: on ? `linear-gradient(120deg, ${m.color}22, transparent 70%)` : "rgba(255,255,255,.02)",
              boxShadow: on ? `0 0 22px ${m.color}33` : "none",
            }}
          >
            <div className="flex items-center gap-2">
              <div className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-[4px] border border-[rgba(255,209,102,.3)] bg-[#1b1436]">
                <Portrait cell={m.cells.portrait} size={44} />
              </div>
              <div className="min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-[17px]" style={{ color: on ? "#fff6d8" : "rgba(255,244,224,.8)" }}>{m.name}</span>
                  <span className="font-mono-num text-[10px] text-[rgba(255,240,214,.4)]">{id}</span>
                  {on && <span className="text-[10px] tracking-[0.2em] text-[#ffd166]">● 在场</span>}
                </div>
                <div className="truncate text-[11px] text-[rgba(255,240,214,.5)]">{m.alias}</div>
              </div>
            </div>
            <div className="mt-1.5 flex gap-1.5">
              {cells.slice(0, 4).map((c) => (
                <div key={c} className="grid h-[46px] w-[46px] place-items-center rounded-[3px] bg-[rgba(255,255,255,.04)]">
                  <Portrait cell={c} size={40} />
                </div>
              ))}
            </div>
            <dl className="mt-2 space-y-1 text-[11px] leading-relaxed">
              <div><dt className="inline text-[#ffd166]">形象 · </dt><dd className="inline text-[rgba(255,244,224,.78)]">{m.role}</dd></div>
              <div><dt className="inline text-[#ffd166]">习性 · </dt><dd className="inline text-[rgba(255,244,224,.6)]">{m.trait}</dd></div>
              <div><dt className="inline text-[#ffd166]">动作 · </dt><dd className="inline text-[rgba(255,244,224,.6)]">{m.action}</dd></div>
            </dl>
          </div>
        );
      })}
    </div>
  );
}

function ShotSheet({ cue }: { cue: Cue }) {
  const look = LOOKS[cue.shot.look];
  const row = (k: string, v: React.ReactNode) => (
    <div className="flex gap-2 border-b border-[rgba(255,224,170,.08)] py-1.5 text-[12px]">
      <span className="w-[62px] shrink-0 tracking-[0.16em] text-[rgba(255,240,214,.42)]">{k}</span>
      <span className="min-w-0 flex-1 text-[rgba(255,244,224,.85)]">{v}</span>
    </div>
  );
  return (
    <div className="flex flex-col">
      <div className="mb-2 rounded-[5px] border border-[rgba(255,209,102,.3)] bg-[rgba(255,209,102,.07)] p-2.5">
        <div className="font-display text-[19px] leading-tight text-[#fff6d8]">
          {cue.text ?? `${SECTION_LABEL[cue.section]} · 无词`}
        </div>
        <div className="font-mono-num mt-1 text-[11px] text-[rgba(255,240,214,.5)]">
          {fmtTime(cue.start)} → {fmtTime(cue.end)} · {(cue.end - cue.start).toFixed(2)}s
        </div>
      </div>
      {row("镜头", `第 ${cue.i + 1} 镜 / 共 ${CUES.length} 镜`)}
      {row("说明", cue.shot.note)}
      {row(
        "光照",
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full" style={{ background: look.light }} />
          {look.name}（{look.id}）
          <span className="flex gap-1">
            {look.swatch.map((c) => (
              <span key={c} className="inline-block h-3 w-3 rounded-[2px]" style={{ background: c }} />
            ))}
          </span>
        </span>,
      )}
      {row("搭景", { shore: "黄昏纸岸", hill: "夜 · 山坡", ring: "紫色光圈", sea: "水下" }[cue.shot.set])}
      {row(
        "机位",
        <span className="font-mono-num text-[11px]">
          pos ({cue.shot.cam.pos.map((v) => v.toFixed(1)).join(", ")}) → look ({cue.shot.cam.look.map((v) => v.toFixed(1)).join(", ")})
          {cue.shot.cam.to ? " · 镜内推拉" : " · 固定"} · fov {cue.shot.cam.fov ?? 40}°
        </span>,
      )}
      {row("切镜", cue.shot.flash === "white" ? "闪白" : cue.shot.flash === "black" ? "渐黑" : "硬切")}
      <div className="mt-2 text-[11px] tracking-[0.2em] text-[rgba(255,240,214,.42)]">站位</div>
      <div className="mt-1 flex flex-col gap-1">
        {cue.shot.cast.length === 0 && <span className="text-[12px] text-[rgba(255,240,214,.4)]">空镜</span>}
        {cue.shot.cast.map((c, i) => (
          <div key={i} className="flex items-center gap-2 rounded-[4px] bg-[rgba(255,255,255,.03)] px-2 py-1">
            <Portrait cell={c.cell ?? (c.face === "side" ? (CAST[c.id].cells.side?.[0] ?? CAST[c.id].cells.front?.[0] ?? CAST[c.id].cells.portrait) : (CAST[c.id].cells.front?.[0] ?? CAST[c.id].cells.portrait))} size={34} />
            <span className="font-display text-[14px] text-[#fff2d4]">{CAST[c.id].name}</span>
            <span className="font-mono-num ml-auto text-[10px] text-[rgba(255,240,214,.45)]">
              x{c.x} z{c.z ?? 0}
              {c.walk ? ` →${c.from?.x ?? "?"}` : ""}
              {c.ry ? ` ry${c.ry}°` : ""}
              {c.sil ? " 剪影" : ""}
              {c.wear ? ` 戴${c.wear}` : ""}
            </span>
          </div>
        ))}
      </div>
      {(cue.shot.props?.length ?? 0) > 0 && (
        <>
          <div className="mt-3 text-[11px] tracking-[0.2em] text-[rgba(255,240,214,.42)]">道具</div>
          <div className="mt-1 flex flex-wrap gap-1">
            {cue.shot.props!.map((pr, i) => (
              <Chip key={i}>{pr.kind}@{pr.x}</Chip>
            ))}
          </div>
        </>
      )}
      {(cue.shot.fx?.length ?? 0) > 0 && (
        <>
          <div className="mt-3 text-[11px] tracking-[0.2em] text-[rgba(255,240,214,.42)]">特效贴片</div>
          <div className="mt-1 flex flex-wrap gap-1">
            {cue.shot.fx!.map((f, i) => (
              <Chip key={i} color="#8fd6a8">{f.kind} × {f.n}</Chip>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Calibration({ p }: { p: MVPlayer }) {
  const [busy, setBusy] = useState(false);
  const auto = async () => {
    setBusy(true);
    await p.autoAlign();
    setBusy(false);
  };
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[11px] leading-relaxed text-[rgba(255,240,214,.55)]">
        时间轴是<span className="text-[#ffd166]">规划轴</span>（按曲式排的），要对到真实音轨上有三种办法：自动找前奏人声、
        手动平移 / 变速、或者在唱到某一句的第一字时点「钉这一句」——钉两个点以上会自动做线性拟合（offset + rate）。
      </p>

      <div>
        <div className="mb-1 flex items-baseline justify-between">
          <label className="text-[11px] tracking-[0.18em] text-[rgba(255,240,214,.5)]" htmlFor="off">平移 offset</label>
          <span className="font-mono-num text-[12px] text-[#ffe9b8]">{p.offset.toFixed(2)} s</span>
        </div>
        <input id="off" type="range" min={-8} max={8} step={0.05} value={p.offset}
          onChange={(e) => p.setOffset(Number(e.target.value))} className="w-full"
          style={{ ["--fill" as string]: `${((p.offset + 8) / 16) * 100}%` }} />
      </div>

      <div>
        <div className="mb-1 flex items-baseline justify-between">
          <label className="text-[11px] tracking-[0.18em] text-[rgba(255,240,214,.5)]" htmlFor="rate">变速 rate</label>
          <span className="font-mono-num text-[12px] text-[#ffe9b8]">× {p.rate.toFixed(3)}</span>
        </div>
        <input id="rate" type="range" min={0.9} max={1.1} step={0.001} value={p.rate}
          onChange={(e) => p.setRate(Number(e.target.value))} className="w-full"
          style={{ ["--fill" as string]: `${((p.rate - 0.9) / 0.2) * 100}%` }} />
      </div>

      <div className="flex flex-wrap gap-1.5">
        <IconBtn onClick={p.addAnchorHere} label="钉这一句" wide>钉这一句</IconBtn>
        <IconBtn onClick={auto} label="自动找前奏" wide>{busy || p.aligning ? "解码中…" : "自动找前奏"}</IconBtn>
        <IconBtn onClick={p.clearAnchors} label="清掉钉点" wide>清掉钉点</IconBtn>
        <IconBtn onClick={p.resetCalibration} label="全部重置" wide>全部重置</IconBtn>
      </div>

      <div className="rounded-[5px] border border-[rgba(255,224,170,.14)] bg-[rgba(255,255,255,.02)] p-2">
        <div className="mb-1 text-[11px] tracking-[0.18em] text-[rgba(255,240,214,.45)]">钉点（{p.anchors.length}）</div>
        {p.anchors.length === 0 && <div className="text-[12px] text-[rgba(255,240,214,.35)]">还没有钉点：播放到某一句的第一个字时点「钉这一句」。</div>}
        <div className="flex flex-col gap-1">
          {p.anchors.map((a, i) => (
            <div key={i} className="font-mono-num flex justify-between text-[11px] text-[rgba(255,244,224,.7)]">
              <span>#{i + 1} 规划轴 {a.model.toFixed(2)}s</span>
              <span>音轨 {a.real.toFixed(2)}s</span>
              <span className="text-[#ffd166]">Δ {(a.real - a.model).toFixed(2)}s</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[5px] border border-[rgba(255,224,170,.14)] p-2 text-[11px] leading-relaxed text-[rgba(255,240,214,.5)]">
        拟合结果：<span className="font-mono-num text-[#ffe9b8]">real = {p.offset.toFixed(2)} + {p.rate.toFixed(3)} × model</span>
        <br />
        音源：<span className="font-mono-num">{p.mode === "audio" ? "背对背拥抱.m4a（235s，随页面内嵌）" : "读取失败 → 无声样片模式"}</span>
      </div>
    </div>
  );
}
