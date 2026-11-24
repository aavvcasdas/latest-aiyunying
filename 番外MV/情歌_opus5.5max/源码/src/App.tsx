import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Engine, SECTIONS, SHOTS } from './mv/engine';
import { Player } from './mv/audio';
import { ATLAS_H, ATLAS_W, DURATION, LYRICS, RECTS } from './mv/generated';
import { FONT_STACK, wordsOf } from './mv/lyrics';
import atlasUrl from './assets/atlas.png';

const fmt = (t: number) => { const m = Math.floor(t / 60); const s = Math.floor(t % 60); return `${m}:${String(s).padStart(2, '0')}`; };

function Sprite({ k, h, className = '' }: { k: string; h: number; className?: string }) {
  const r = RECTS[k]; if (!r) return null; const s = h / r[3];
  return (
    <div className={className} style={{ width: r[2] * s, height: h, backgroundImage: `url(${atlasUrl})`, backgroundRepeat: 'no-repeat', backgroundSize: `${ATLAS_W * s}px ${ATLAS_H * s}px`, backgroundPosition: `-${r[0] * s}px -${r[1] * s}px`, imageRendering: 'pixelated' }} />
  );
}

const CAST = [
  { k: 'act_whale_idle_0', name: '鲸鱼娘', role: '「我」· 主角', desc: '把回忆收进琥珀的人。看着情书磨成沙、念头顺水溜走，最后学会放开拳头，把这首情歌唱给下一段人生。' },
  { k: 'act_claude_idle_0', name: '小克', role: '「你」', desc: '写下「我的第一首歌」的人。告别是她自己选的：演唱会上提裙行礼、礼貌地吻别；片尾回到星球上一起挥手。' },
  { k: 'act_gpt_float_0', name: '龙娘', role: '回忆如困兽', desc: '笼子里暴怒的龙，寂寞太久渐渐温柔。拳头一松，栏杆飞散，她振翅飞走——反而更自由。' },
  { k: 'act_qwen_idle_0', name: '千问', role: '命运好幽默', desc: '疯帽子茶会的东道主，站上长桌把牌洗乱；话还没说出口，气泡就破了，满桌沉默。' },
  { k: 'act_gemini_idle_0', name: '猫', role: '路口 · 守钟人', desc: '举着两只猫耳钟看四季转过；在爱丽丝的路口先看两边，最后必须选一个。' },
  { k: 'act_kimi_idle_0', name: 'Kimi', role: '记忆', desc: '捧着卷轴的月球少女，时光飞快时在一旁把所有人都记下来。' },
  { k: 'act_zai_idle_0', name: '狐狸', role: '胶卷放映员', desc: '缱绻胶卷转着，她在放映机旁打盹；「定格」那一下，惊醒竖耳。' },
  { k: 'act_doubao_idle_0', name: '豆包', role: '暖场', desc: '告别的演唱会上先在台下踩拍把场子热起来，大合唱时一起摇摆。' },
];
const LINE_ACC = ['#ffc35a', '#ffd6a0', '#8be9ff', '#8be9ff', '#f0abfc', '#ff6b81', '#c4b5fd', '#c4b5fd', '#f5deb3', '#e5e5e5', '#ff9bd5', '#ff9bd5', '#9cc9ff', '#9cc9ff', '#b8c6db', '#ffc9a8', '#ffc9a8', '#ffe08a',
  '#e9d5ff', '#ff6b81', '#c4b5fd', '#ffd59e', '#c7d2fe', '#c7d2fe', '#f5d6a8', '#f5d6a8', '#ff9bd5', '#f5deb3', '#ffc35a', '#ff9bd5', '#ff9bd5', '#ffe08a', '#ffb86b', '#ffb86b', '#e7d7c1', '#fde68a', '#ffd1b3', '#ffe08a'];

type Tab = 'lyrics' | 'cast' | 'shots';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const playerRef = useRef<Player | null>(null);
  const dirty = useRef(true);
  const idleRef = useRef(0);
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading');
  const [prog, setProg] = useState(0);
  const [err, setErr] = useState('');
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [line, setLine] = useState(-1);
  const [charIdx, setCharIdx] = useState(-1);
  const [shot, setShot] = useState(0);
  const [tab, setTab] = useState<Tab>('lyrics');
  const [muted, setMuted] = useState(false);
  const [silent, setSilent] = useState(false);
  const [ctlVis, setCtlVis] = useState(true);
  const [size, setSize] = useState({ w: 960, h: 540 });
  const [fs, setFs] = useState(false);

  // 舞台尺寸：永远 16:9
  useEffect(() => {
    const wrap = wrapRef.current!;
    const fit = () => {
      const full = !!document.fullscreenElement; setFs(full);
      const availW = full ? window.innerWidth : wrap.clientWidth;
      const maxH = full ? window.innerHeight : Math.max(240, window.innerHeight * 0.74);
      const w = Math.floor(Math.min(availW, (maxH * 16) / 9)); setSize({ w, h: Math.floor((w * 9) / 16) });
    };
    const ro = new ResizeObserver(fit); ro.observe(wrap); window.addEventListener('resize', fit); document.addEventListener('fullscreenchange', fit); fit();
    return () => { ro.disconnect(); window.removeEventListener('resize', fit); document.removeEventListener('fullscreenchange', fit); };
  }, []);
  useEffect(() => { engineRef.current?.setSize(size.w, size.h); dirty.current = true; }, [size]);

  useEffect(() => {
    const eng = new Engine(canvasRef.current!); engineRef.current = eng; eng.setSize(size.w, size.h);
    const player = new Player(); playerRef.current = player;
    player.onEnded = () => { setPlaying(false); dirty.current = true; };
    let alive = true; let pe = 0, pa = 0;
    const upd = () => alive && setProg(pe * 0.6 + pa * 0.4);
    (async () => {
      try {
        await Promise.all([eng.load((p) => { pe = p; upd(); }), player.load((p) => { pa = p; upd(); })]);
        if (!alive) return; setSilent(player.silent); setPhase('ready'); dirty.current = true;
      } catch (e) { console.error(e); if (alive) { setErr(e instanceof Error ? e.message : String(e)); setPhase('error'); } }
    })();
    (window as unknown as { __mv: unknown }).__mv = {
      ready: () => eng.ready,
      seek: (t: number) => { player.seek(t); setStarted(true); dirty.current = true; },
      render: (t: number, noLyric = false, width = 0) => {
        if (width) { eng.setSize(width, Math.round((width * 9) / 16)); }
        player.seek(t); eng.render(t, noLyric);
        return canvasRef.current!.toDataURL('image/png');
      },
    };
    let raf = 0, lastQ = -1, lastLine = -2, lastChar = -2, lastShot = -1;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!eng.ready) return;
      let T = player.time();
      if (player.playing && T >= DURATION - 0.03) { player.pause(); player.seek(DURATION - 0.03); T = player.time(); setPlaying(false); }
      if (player.playing || dirty.current) { dirty.current = false; eng.render(T); }
      const q = Math.floor(T * 8); if (q !== lastQ) { lastQ = q; setTime(T); }
      const li = eng.lineAt(T); if (li !== lastLine) { lastLine = li; setLine(li); }
      let ci = -1; if (li >= 0) { const tt = LYRICS[li].t; for (let i = 0; i < tt.length; i++) if (T >= tt[i]) ci = i; }
      if (ci !== lastChar) { lastChar = ci; setCharIdx(ci); }
      if (eng.shotIndex !== lastShot) { lastShot = eng.shotIndex; setShot(eng.shotIndex); }
      if (player.playing && performance.now() - idleRef.current > 2600) setCtlVis(false);
    };
    raf = requestAnimationFrame(loop);
    return () => { alive = false; cancelAnimationFrame(raf); player.pause(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const poke = useCallback(() => { idleRef.current = performance.now(); setCtlVis(true); }, []);
  const toggle = useCallback(async () => {
    const p = playerRef.current; if (!p || phase !== 'ready') return;
    if (p.playing) { p.pause(); setPlaying(false); }
    else { if (p.time() >= DURATION - 0.1) p.seek(0); await p.play(); setPlaying(true); setStarted(true); }
    dirty.current = true; poke();
  }, [phase, poke]);
  const seek = useCallback((t: number) => { const p = playerRef.current; if (!p) return; p.seek(Math.max(0, Math.min(DURATION - 0.05, t))); setTime(p.time()); dirty.current = true; poke(); }, [poke]);
  const jump = useCallback(async (t: number) => {
    const p = playerRef.current; if (!p || phase !== 'ready') return; seek(t);
    if (!p.playing) { await p.play(t); setPlaying(true); setStarted(true); }
  }, [phase, seek]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      const p = playerRef.current; if (!p) return;
      if (e.code === 'Space') { e.preventDefault(); void toggle(); }
      else if (e.code === 'ArrowRight') seek(p.time() + 5);
      else if (e.code === 'ArrowLeft') seek(p.time() - 5);
      else if (e.code === 'ArrowDown' || e.code === 'ArrowUp') {
        e.preventDefault(); const T = p.time(); const starts = LYRICS.map((l) => l.t[0] - 0.3);
        if (e.code === 'ArrowDown') { const n = starts.find((s) => s > T + 0.05); if (n !== undefined) void jump(n); }
        else { const prev = [...starts].reverse().find((s) => s < T - 1.2); void jump(prev ?? 0); }
      } else if (e.code === 'KeyF') stageRef.current?.requestFullscreen?.();
      else if (e.code === 'KeyM') { const m = !p.muted; p.setMuted(m); setMuted(m); }
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [toggle, seek, jump]);

  useEffect(() => {
    if (tab !== 'lyrics' || line < 0) return;
    const el = listRef.current?.querySelector(`[data-line="${line}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [line, tab]);

  const lineWords = useMemo(() => LYRICS.map((l) => wordsOf(l.text)), []);
  const ended = started && !playing && time >= DURATION - 0.2;
  const cur = line >= 0 ? LYRICS[line] : null;
  const barRef = useRef<HTMLDivElement>(null);
  const onBar = (e: React.PointerEvent) => {
    const r = barRef.current!.getBoundingClientRect(); const f = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)); seek(f * DURATION);
  };

  return (
    <div className="min-h-screen w-full bg-[#07060f] text-[#efe9ff] flex flex-col" style={{ fontFamily: FONT_STACK, backgroundImage: 'radial-gradient(1200px 600px at 20% -10%, rgba(120,80,200,0.18), transparent), radial-gradient(900px 500px at 100% 110%, rgba(255,140,90,0.12), transparent)' }}>
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 md:px-8 pt-4 pb-3">
        <div className="flex items-baseline gap-3">
          <h1 className="text-3xl tracking-[0.3em] text-[#ffd6a0]" style={{ textShadow: '0 0 18px rgba(255,170,90,0.45)' }}>情歌</h1>
          <span className="text-xs md:text-sm text-white/55">鲸鱼娘番外 MV · 逐字三维歌词卡点 · 像素纸片人立在三维世界里</span>
        </div>
        <nav className="flex gap-1.5 text-sm">
          {([['lyrics', '歌词'], ['cast', '人物'], ['shots', '分镜']] as [Tab, string][]).map(([k, n]) => (
            <button key={k} onClick={() => setTab(k)} className={`px-3 py-1.5 rounded-full border transition ${tab === k ? 'bg-[#ffd6a0] text-[#2a1630] border-transparent' : 'border-white/15 text-white/70 hover:text-white hover:border-white/40'}`}>{n}</button>
          ))}
        </nav>
      </header>

      <main className="flex-1 flex flex-col xl:flex-row gap-5 px-3 md:px-8 pb-8">
        <section ref={wrapRef} className="flex-1 min-w-0 flex flex-col items-center">
          <div ref={stageRef} onMouseMove={poke} onTouchStart={poke} className={`relative overflow-hidden bg-black select-none ${fs ? '' : 'rounded-2xl ring-1 ring-white/10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]'}`} style={{ width: size.w, height: size.h, cursor: ctlVis || !playing ? 'default' : 'none' }}>
            <canvas ref={canvasRef} className="absolute inset-0 block" style={{ width: size.w, height: size.h }} onClick={() => started && void toggle()} />

            {phase !== 'ready' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[#07060f]">
                <div className="flex items-end gap-3 opacity-90">{CAST.slice(0, 4).map((c, i) => <Sprite key={c.k} k={c.k} h={i === 2 ? 70 : 52} className="animate-pulse" />)}</div>
                {phase === 'loading' ? (
                  <>
                    <div className="w-64 h-1.5 rounded-full bg-white/10 overflow-hidden"><div className="h-full bg-gradient-to-r from-[#ffb36b] to-[#ff7eb6] transition-all" style={{ width: `${Math.round(prog * 100)}%` }} /></div>
                    <div className="text-sm text-white/60">载入音轨、图集与字体 · {Math.round(prog * 100)}%</div>
                  </>
                ) : <div className="text-sm text-red-300 max-w-md text-center px-6">载入失败：{err}</div>}
              </div>
            )}

            {phase === 'ready' && !started && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-black/30 via-black/45 to-black/75 backdrop-blur-[1px]">
                <div className="text-[13px] tracking-[0.5em] text-white/60 mb-2">鲸鱼娘番外</div>
                <div className="text-6xl md:text-7xl tracking-[0.35em] pl-[0.35em] text-[#ffe2b8]" style={{ textShadow: '0 0 30px rgba(255,160,90,0.65), 0 4px 0 #3a1838' }}>情歌</div>
                <div className="mt-3 text-sm text-white/70">时光是琥珀 · 一整个宇宙换一颗红豆 · 还好我有我这一首情歌</div>
                <div className="mt-6 flex items-end gap-2 md:gap-3">{CAST.map((c) => <Sprite key={c.k} k={c.k} h={c.k.includes('gpt') ? 74 : 54} />)}</div>
                <button onClick={() => void toggle()} className="mt-7 group flex items-center gap-3 px-8 py-3 rounded-full bg-[#ffd6a0] text-[#2a1630] text-lg shadow-[0_0_40px_rgba(255,190,120,0.45)] hover:scale-105 active:scale-95 transition">
                  <span className="inline-block w-0 h-0 border-y-[9px] border-y-transparent border-l-[14px] border-l-[#2a1630]" />播放
                </button>
                <div className="mt-4 text-xs text-white/45">{silent ? '音轨没能解码，将以无声时钟播放' : '建议打开声音 · 空格 播放或暂停 · 上下键 按句跳转'}</div>
              </div>
            )}

            {ended && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/55">
                <div className="text-4xl tracking-[0.3em] text-[#ffe2b8] mb-5">谢谢收听</div>
                <button onClick={() => void jump(0)} className="px-7 py-2.5 rounded-full bg-[#ffd6a0] text-[#2a1630]">重播</button>
              </div>
            )}

            {phase === 'ready' && started && (
              <div className={`absolute inset-x-0 bottom-0 px-4 pb-3 pt-10 bg-gradient-to-t from-black/75 to-transparent transition-opacity duration-500 ${ctlVis || !playing ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <div ref={barRef} onPointerDown={onBar} className="relative h-6 cursor-pointer group">
                  <div className="absolute top-1/2 -translate-y-1/2 inset-x-0 h-1.5 rounded-full bg-white/15" />
                  <div className="absolute top-1/2 -translate-y-1/2 left-0 h-1.5 rounded-full bg-gradient-to-r from-[#ffb36b] to-[#ff7eb6]" style={{ width: `${(time / DURATION) * 100}%` }} />
                  {LYRICS.map((l, i) => <div key={i} className="absolute top-1/2 -translate-y-1/2 w-[2px] h-2.5 rounded" style={{ left: `${(l.t[0] / DURATION) * 100}%`, background: LINE_ACC[i], opacity: 0.7 }} />)}
                  <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 -ml-[7px] rounded-full bg-white shadow" style={{ left: `${(time / DURATION) * 100}%` }} />
                </div>
                <div className="flex items-center gap-3 text-sm mt-1">
                  <button onClick={() => void toggle()} className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center" aria-label={playing ? '暂停' : '播放'}>
                    {playing ? <span className="flex gap-1"><i className="block w-1 h-3.5 bg-white" /><i className="block w-1 h-3.5 bg-white" /></span> : <span className="ml-0.5 w-0 h-0 border-y-[7px] border-y-transparent border-l-[11px] border-l-white" />}
                  </button>
                  <span className="tabular-nums text-white/80 font-sans">{fmt(time)} / {fmt(DURATION)}</span>
                  <span className="hidden md:inline text-white/50 truncate">{SHOTS[shot]?.label}</span>
                  <div className="flex-1" />
                  <button onClick={() => { const p = playerRef.current; if (!p) return; const m = !p.muted; p.setMuted(m); setMuted(m); }} className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-xs">{muted ? '静音中' : '声音开'}</button>
                  <button onClick={() => (document.fullscreenElement ? document.exitFullscreen() : stageRef.current?.requestFullscreen?.())} className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 text-xs">{fs ? '退出全屏' : '全屏'}</button>
                </div>
              </div>
            )}
          </div>

          <div className="w-full mt-3 flex flex-wrap gap-1.5 justify-center" style={{ maxWidth: size.w }}>
            {SECTIONS.map((s, i) => {
              const next = SECTIONS[i + 1]?.t ?? DURATION; const on = time >= s.t && time < next;
              return <button key={s.name} onClick={() => void jump(s.t)} className={`px-2.5 py-1 rounded-md text-xs border transition ${on ? 'border-[#ffd6a0] text-[#ffd6a0] bg-[#ffd6a0]/10' : 'border-white/10 text-white/55 hover:text-white'}`}>{s.name}</button>;
            })}
          </div>
          {cur && started && (
            <div className="mt-3 text-center text-lg md:text-xl tracking-wider" style={{ maxWidth: size.w }}>
              {[...cur.text].map((c, i) => <span key={i} className="transition-colors duration-150" style={{ color: i <= charIdx ? LINE_ACC[line] : 'rgba(255,255,255,0.35)' }}>{c}</span>)}
            </div>
          )}
        </section>

        <aside className="xl:w-[380px] w-full shrink-0 rounded-2xl bg-white/[0.035] ring-1 ring-white/10 flex flex-col max-h-[80vh]">
          {tab === 'lyrics' && (
            <>
              <div className="px-5 pt-4 pb-2 text-xs text-white/50 leading-relaxed">逐字时间：从《情歌》音轨的人声起音实测，并对过参考 MV 的字幕条。彩色的是关键词——词落完最后一个字时，画面里整词再弹一下。点一句跳过去。</div>
              <div ref={listRef} className="overflow-y-auto px-3 pb-4 space-y-1">
                {LYRICS.map((l, i) => {
                  const on = i === line; let ci = 0;
                  return (
                    <button key={i} data-line={i} onClick={() => void jump(l.t[0] - 0.3)} className={`w-full text-left px-3 py-2 rounded-xl transition flex items-baseline gap-3 ${on ? 'bg-white/10 ring-1 ring-white/15' : 'hover:bg-white/5'}`}>
                      <span className="text-[11px] tabular-nums text-white/35 w-9 shrink-0 font-sans">{fmt(l.t[0])}</span>
                      <span className="text-[15px] leading-7 tracking-wide">
                        {lineWords[i].map((w, wi) => (
                          <span key={wi} className="mr-1.5">
                            {[...w.text].map((c) => { const k = ci++; const sung = on && k <= charIdx; return <span key={k} style={{ color: sung ? LINE_ACC[i] : w.key ? (on ? '#fff' : LINE_ACC[i] + 'cc') : on ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.55)', textShadow: sung ? `0 0 10px ${LINE_ACC[i]}88` : 'none' }}>{c}</span>; })}
                          </span>
                        ))}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
          {tab === 'cast' && (
            <div className="overflow-y-auto p-4 space-y-3">
              <div className="text-xs text-white/50 leading-relaxed px-1">登场人物全部用分支里的像素图集原样出演（不换画风、不加手）。</div>
              {CAST.map((c) => (
                <div key={c.k} className="flex gap-3 p-3 rounded-xl bg-white/[0.04] ring-1 ring-white/5">
                  <div className="w-16 h-20 shrink-0 flex items-end justify-center"><Sprite k={c.k} h={c.k.includes('gpt') ? 78 : 62} /></div>
                  <div className="min-w-0">
                    <div className="flex items-baseline gap-2"><span className="text-base text-[#ffe2b8]">{c.name}</span><span className="text-xs text-[#ff9bd5]">{c.role}</span></div>
                    <p className="text-[13px] text-white/65 leading-relaxed mt-1">{c.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab === 'shots' && (
            <div className="overflow-y-auto p-3 space-y-1">
              <div className="text-xs text-white/50 leading-relaxed px-2 pb-2">按歌词意思重新搭的四十六个镜头：每句词进镜头前零点三秒切，卡点挂在句子上。</div>
              {SHOTS.map((s, i) => (
                <button key={i} onClick={() => void jump(s.a)} className={`w-full text-left px-3 py-1.5 rounded-lg flex items-center gap-3 text-sm transition ${i === shot ? 'bg-white/10 text-white' : 'text-white/65 hover:bg-white/5'}`}>
                  <span className="text-[11px] tabular-nums text-white/35 w-20 shrink-0 font-sans">{fmt(s.a)}–{fmt(s.b)}</span>
                  <span className="truncate">{s.label}</span>
                  {s.line && <span className="ml-auto text-[11px] text-white/35 truncate max-w-[45%]">{LYRICS[s.line - 1].text}</span>}
                </button>
              ))}
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
