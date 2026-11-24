import { useCallback, useEffect, useRef, useState } from 'react';
import { MV } from './mv/engine';
import { Player } from './mv/audio';
import { DURATION, LINES } from './mv/timing';
import { PARSED, SPEC } from './mv/lyrics';
import { charIdx } from './mv/core';

const ZC = "'ZCOOLKL', 'PingFang SC', 'Microsoft YaHei', sans-serif";
const fmt = (t: number) => { const s = Math.max(0, t); const m = Math.floor(s / 60); const r = s - m * 60; return `${m}:${r < 10 ? '0' : ''}${r.toFixed(2)}`; };
const CAST = [
  { n: '本鲸', r: '我：在雨里、在梦里、在转身里', c: '#5b8cff' },
  { n: '小克', r: '你：背影、海市蜃楼、原地等我', c: '#ff8a3d' },
  { n: 'Kimi', r: '月牙上守夜的人', c: '#7d8bd6' },
  { n: '猫 Gemini', r: '抱着两只钟的时间深渊', c: '#c9a6ff' },
  { n: '千问 · 豆包 · 狐狸', r: '盛宴的客人、点烟火的伙伴', c: '#9ad1b0' },
  { n: '龙娘', r: '只从画面上方掠过的龙影', c: '#cfd6e6' },
];

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mvRef = useRef<MV | null>(null);
  const playerRef = useRef<Player>(new Player());
  const dirty = useRef(true);
  const started = useRef(false);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [everPlayed, setEverPlayed] = useState(false);
  const [time, setTime] = useState(0);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    if (started.current) return; started.current = true;
    let raf = 0; let lastUi = 0; const player = playerRef.current;
    (async () => {
      try {
        const [mv] = await Promise.all([MV.create(canvasRef.current!, setProgress), player.load()]);
        mvRef.current = mv; setReady(true);
        player.onEnded = () => { setPlaying(false); setEnded(true); dirty.current = true; };
        (window as unknown as Record<string, unknown>).__mv = { render: (t: number) => { mv.render(t); return canvasRef.current!.toDataURL('image/png'); }, duration: DURATION, lines: LINES };
        const loop = (now: number) => {
          const t = Math.min(player.time(), DURATION);
          if (player.playing || dirty.current) { mv.render(t); dirty.current = false; }
          if (now - lastUi > 60) { setTime(t); lastUi = now; }
          raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
      } catch (e) { console.error(e); setError(String(e instanceof Error ? e.message : e)); }
    })();
    return () => cancelAnimationFrame(raf);
  }, []);

  const play = useCallback(async () => {
    const p = playerRef.current; if (!ready) return;
    if (p.playing) { p.pause(); setPlaying(false); dirty.current = true; return; }
    if (ended) { p.offset = 0; setEnded(false); }
    await p.play(); setPlaying(true); setEverPlayed(true);
  }, [ready, ended]);
  const seek = useCallback((t: number) => { const p = playerRef.current; p.seek(Math.max(0, Math.min(DURATION, t))); setEnded(false); setTime(p.time()); dirty.current = true; }, []);
  const toggleMute = useCallback(() => { const p = playerRef.current; p.setMuted(!p.muted); setMuted(p.muted); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.code === 'Space') { e.preventDefault(); void play(); }
      else if (e.code === 'ArrowRight') seek(playerRef.current.time() + 3);
      else if (e.code === 'ArrowLeft') seek(playerRef.current.time() - 3);
      else if (e.code === 'KeyM') toggleMute();
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [play, seek, toggleMute]);

  const cur = (() => { let k = -1; LINES.forEach((l, i) => { if (time >= l.on[0] - 0.12) k = i; }); return k; })();

  return (
    <div className="min-h-screen w-full bg-[#070a16] text-slate-100" style={{ backgroundImage: 'radial-gradient(1200px 600px at 20% -10%, rgba(91,140,255,0.16), transparent), radial-gradient(900px 500px at 100% 10%, rgba(255,138,61,0.10), transparent)' }}>
      <div className="mx-auto max-w-[1320px] px-4 py-6 md:px-6">
        <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl tracking-wider md:text-4xl" style={{ fontFamily: ZC }}>在悲伤的时候</h1>
            <p className="mt-1 text-sm text-slate-400">番外 MV · 本鲸 × 小克 · 三维逐字卡点（{LINES.length} 句 / {LINES.reduce((a, l) => a + l.text.length, 0)} 字，起音全部实测）</p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-slate-400">
            <span className="rounded-full border border-white/10 px-3 py-1">空格 播放/暂停</span>
            <span className="rounded-full border border-white/10 px-3 py-1">← → 跳 3 秒</span>
            <span className="rounded-full border border-white/10 px-3 py-1">M 静音</span>
          </div>
        </header>

        <div className="relative w-full overflow-hidden rounded-xl bg-black shadow-2xl shadow-black/60 ring-1 ring-white/10" style={{ aspectRatio: '16 / 9' }}>
          <canvas ref={canvasRef} width={1280} height={720} className="block h-full w-full" onClick={() => void play()} />
          {!ready && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#05070f]">
              <div className="text-2xl tracking-[0.3em] text-slate-200" style={{ fontFamily: ZC }}>在悲伤的时候</div>
              <div className="h-1 w-64 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-sky-400 to-amber-300 transition-all" style={{ width: `${Math.round(progress * 100)}%` }} /></div>
              <div className="text-xs text-slate-500">载入音轨、像素图集、编译二十二个镜头… {Math.round(progress * 100)}%</div>
            </div>
          )}
          {error && <div className="absolute inset-0 flex items-center justify-center bg-black/90 p-6 text-center text-sm text-rose-300">画面初始化失败：{error}<br />请换用支持 WebGL2 的浏览器。</div>}
          {ready && !playing && (!everPlayed || ended) && (
            <button onClick={() => void play()} className="group absolute inset-0 flex flex-col items-center justify-center gap-5 bg-gradient-to-b from-black/30 via-black/45 to-black/70 transition hover:from-black/20">
              <div className="text-4xl tracking-[0.35em] text-white drop-shadow-lg md:text-6xl" style={{ fontFamily: ZC }}>在悲伤的时候</div>
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/15 ring-2 ring-white/60 backdrop-blur transition group-hover:scale-110 group-hover:bg-white/25">
                <svg viewBox="0 0 24 24" className="ml-1 h-9 w-9 fill-white">{ended ? <path d="M12 5V2L7 6l5 4V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z" /> : <path d="M8 5v14l11-7z" />}</svg>
              </div>
              <div className="text-sm text-slate-200/80">{ended ? '重播' : '点击播放（带声音）'}</div>
            </button>
          )}
        </div>

        <div className="mt-3 flex items-center gap-3 rounded-xl bg-white/[0.04] px-3 py-2 ring-1 ring-white/10">
          <button onClick={() => void play()} disabled={!ready} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20 disabled:opacity-40" aria-label={playing ? '暂停' : '播放'}>
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">{playing ? <path d="M6 5h4v14H6zM14 5h4v14h-4z" /> : <path d="M8 5v14l11-7z" />}</svg>
          </button>
          <span className="w-28 shrink-0 font-mono text-xs tabular-nums text-slate-300">{fmt(time)} / {fmt(DURATION)}</span>
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-x-0 top-1/2 h-3 -translate-y-1/2">
              {LINES.map((l, i) => <div key={i} className="absolute top-0 h-3 rounded-sm" style={{ left: `${(l.on[0] / DURATION) * 100}%`, width: `${((l.end - l.on[0]) / DURATION) * 100}%`, background: i === cur ? SPEC[i].hi : 'rgba(255,255,255,0.12)' }} />)}
            </div>
            <input type="range" min={0} max={DURATION} step={0.01} value={time} onChange={(e) => seek(parseFloat(e.target.value))} className="relative z-10 w-full cursor-pointer accent-amber-300" disabled={!ready} />
          </div>
          <button onClick={toggleMute} className="shrink-0 rounded-lg px-2 py-1 text-xs text-slate-300 ring-1 ring-white/10 hover:bg-white/10">{muted ? '静音中' : '声音'}</button>
        </div>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            <h2 className="mb-3 text-lg text-slate-200" style={{ fontFamily: ZC }}>分镜 · 歌词理解</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {LINES.map((l, i) => {
                const active = i === cur, k = active ? charIdx(i, time) : -1, P = PARSED[i], S = SPEC[i];
                return (
                  <button key={i} onClick={() => seek(l.on[0] - 0.35)} className={`rounded-xl p-3 text-left ring-1 transition ${active ? 'bg-white/[0.09] ring-white/30' : 'bg-white/[0.03] ring-white/[0.06] hover:bg-white/[0.06]'}`}>
                    <div className="mb-1 flex items-center justify-between text-[11px] text-slate-500">
                      <span>第 {i + 1} 句 · {S.scene}</span><span className="font-mono">{l.on[0].toFixed(2)}s – {l.end.toFixed(2)}s</span>
                    </div>
                    <div className="text-xl leading-snug" style={{ fontFamily: ZC }}>
                      {P.words.map((w, wi) => (
                        <span key={wi} className={`mr-1.5 inline-block ${w.key ? 'border-b-2' : ''}`} style={{ borderColor: S.hi }}>
                          {[...w.text].map((c, ci) => { const idx = w.from + ci; const sung = active && idx <= k; return <span key={ci} style={{ color: sung ? S.hi : w.key ? '#f5f7ff' : '#c4cad8', textShadow: sung ? `0 0 12px ${S.hi}` : 'none' }}>{c}</span>; })}
                        </span>
                      ))}
                    </div>
                    <div className="mt-1 font-mono text-[10px] leading-relaxed text-slate-500">{l.on.map((o, j) => `${l.text[j]}${o.toFixed(2)}`).join('  ')}</div>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-400">{S.note}</p>
                  </button>
                );
              })}
            </div>
          </div>
          <aside className="space-y-4">
            <div className="rounded-xl bg-white/[0.03] p-4 ring-1 ring-white/[0.06]">
              <h3 className="mb-2 text-base text-slate-200" style={{ fontFamily: ZC }}>登场人物</h3>
              <p className="mb-3 text-xs text-slate-500">像素造型与动作全部取自分支 通用模板 图集（原像素，只裁出用到的格）。</p>
              <ul className="space-y-2">{CAST.map((c) => <li key={c.n} className="flex gap-2 text-sm"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: c.c }} /><span><span className="text-slate-200">{c.n}</span><span className="text-slate-500"> — {c.r}</span></span></li>)}</ul>
            </div>
            <div className="rounded-xl bg-white/[0.03] p-4 text-xs leading-relaxed text-slate-400 ring-1 ring-white/[0.06]">
              <h3 className="mb-2 text-base text-slate-200" style={{ fontFamily: ZC }}>卡点怎么来的</h3>
              <ol className="list-decimal space-y-1 pl-4">
                <li>MDX-Net 把人声从伴奏里分出来。</li>
                <li>Whisper 对人声出逐字时间戳（分三段，带歌词提示）。</li>
                <li>按人声能量、音高变化、频谱通量把每个字吸附到真正的起音上（动态规划，保证字序与最小间隔）。</li>
                <li>逐句对频谱图人工核对，修正「口」「花」「转」与「可睁眼」三拍。</li>
              </ol>
              <p className="mt-2">画面：每个字在起音那一拍落进字槽，字内卡拉 OK 填色到下一个字；关键词在最后一个字起音时整词弹起发光；每个镜头的切点在句首字前 0.1 秒。</p>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
