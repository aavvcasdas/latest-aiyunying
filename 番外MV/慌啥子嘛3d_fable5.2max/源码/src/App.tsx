import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Engine } from './mv/engine';
import { Player } from './mv/audio';
import { ATLAS_H, ATLAS_W, DURATION, LYRICS, RECTS } from './mv/data';
import { FONT_STACK, LINE_DEF, wordsOf } from './mv/lyrics3d';
import { SECTIONS, SHOTS } from './mv/shots';
import atlasUrl from './assets/atlas.png';

const fmt = (t: number) => { const m = Math.floor(t / 60); const s = Math.floor(t % 60); return `${m}:${String(s).padStart(2, '0')}`; };

function Sprite({ k, h }: { k: string; h: number }) {
  const r = RECTS[k]; if (!r) return null; const s = h / r[3];
  return <div style={{ width: r[2] * s, height: h, backgroundImage: `url(${atlasUrl})`, backgroundRepeat: 'no-repeat', backgroundSize: `${ATLAS_W * s}px ${ATLAS_H * s}px`, backgroundPosition: `-${r[0] * s}px -${r[1] * s}px`, imageRendering: 'pixelated' }} />;
}

const CAST = [
  { k: 'act_whale_idle_0', name: '鲸鱼娘', role: '主角 ·「你」', desc: '一早扛着箱子赶路、被钟追着跑的人。被千姐一句「慌啥子嘛」叫停，学会一件件卸下、躺下看星星。' },
  { k: 'act_qwen_idle_0', name: '千问', role: '说四川话的人', desc: '摇着扇子的千姐，整首歌的「旁白」。茶馆的东家，有时清醒有时醉。' },
  { k: 'act_kimi_idle_0', name: '月球少女', role: '月亮爬上来', desc: '太阳一下山，她就跟着月亮一起爬上来；片尾陪鲸鱼娘坐在月亮上。' },
  { k: 'act_claude_idle_0', name: '小克', role: '花会开', desc: '花饰大小姐。她一行礼，满坡的花就跟着字一朵朵开。' },
  { k: 'act_gpt_float_0', name: '龙娘', role: '风啊轻轻吹', desc: '展翅掠过月亮，带来一阵轻轻的风；倒挂着拍了一张不完美的合照。' },
  { k: 'act_gemini_idle_0', name: '猫', role: '自己的节拍', desc: '节拍舞台上，每个人跳在不同的分拍上，她跳得最慢也没关系。' },
  { k: 'act_zai_idle_0', name: '狐狸', role: '不必完美', desc: '本来想画一个完美的圆，画出来歪歪的——那就让它歪着。' },
  { k: 'act_doubao_idle_0', name: '豆包', role: '好运在等你', desc: '站在山坡上陪幸运星一起等，等你慢慢走过来。' },
];

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
  const [loff, setLoff] = useState(0);

  useEffect(() => {
    const wrap = wrapRef.current!;
    const fit = () => {
      const full = !!document.fullscreenElement; setFs(full);
      const availW = full ? window.innerWidth : wrap.clientWidth;
      const maxH = full ? window.innerHeight : Math.max(240, window.innerHeight * 0.72);
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
      render: (t: number, noLyric = false, width = 0) => { if (width) eng.setSize(width, Math.round((width * 9) / 16)); player.seek(t); eng.render(t, noLyric); return canvasRef.current!.toDataURL('image/jpeg', 0.9); },
      qa: (t: number) => {
        player.seek(t); eng.render(t, false);
        const W = eng.world!, cam = eng.cam, cv = canvasRef.current!;
        const g2 = document.createElement('canvas'); g2.width = 160; g2.height = 90; const gx = g2.getContext('2d')!;
        gx.drawImage(cv, 0, 0, 160, 90); const d = gx.getImageData(0, 0, 160, 90).data;
        let lum = 0, sat = 0; for (let i = 0; i < d.length; i += 4) { const mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]); lum += (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114); sat += mx - mn; }
        lum /= d.length / 4; sat /= d.length / 4;
        const v = new (Object.getPrototypeOf(cam.position).constructor)();
        const actors = Object.entries(W.cast).filter(([, a]) => a.root.visible).map(([k, a]) => {
          v.copy(a.root.position); v.y += 1.0; v.project(cam);
          return { k, sx: +((v.x + 1) / 2).toFixed(2), sy: +((1 - v.y) / 2).toFixed(2), inFrame: v.x > -1 && v.x < 1 && v.y > -1 && v.y < 1 && v.z < 1 };
        });
        const shot = eng.shotIndex;
        return `t=${t.toFixed(1)} shot=${shot} lum=${lum.toFixed(0)} sat=${sat.toFixed(0)} cam=[${cam.position.x.toFixed(1)},${cam.position.y.toFixed(1)},${cam.position.z.toFixed(1)}] 人:` + actors.map((a) => `${a.k}${a.inFrame ? '' : '!出框'}(${a.sx},${a.sy})`).join(' ');
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
      const p = playerRef.current; if (!p) return;
      if (e.code === 'Space') { e.preventDefault(); void toggle(); }
      else if (e.code === 'ArrowRight') seek(p.time() + 5);
      else if (e.code === 'ArrowLeft') seek(p.time() - 5);
      else if (e.code === 'KeyF') stageRef.current?.requestFullscreen?.();
      else if (e.code === 'KeyM') { const m = !p.muted; p.setMuted(m); setMuted(m); }
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [toggle, seek]);

  useEffect(() => {
    if (tab !== 'lyrics' || line < 0) return;
    const el = listRef.current?.querySelector(`[data-line="${line}"]`) as HTMLElement | null;
    if (el && listRef.current) { const box = listRef.current; box.scrollTo({ top: el.offsetTop - box.clientHeight / 2 + el.clientHeight / 2, behavior: 'smooth' }); }
  }, [line, tab]);

  const lineWords = useMemo(() => LYRICS.map((l) => wordsOf(l.text)), []);
  const cur = line >= 0 ? LYRICS[line] : null;
  const curMean = cur ? LINE_DEF[cur.text]?.mean : '';
  const ended = started && !playing && time >= DURATION - 0.2;
  const barRef = useRef<HTMLDivElement>(null);
  const onBar = (e: React.PointerEvent) => { const r = barRef.current!.getBoundingClientRect(); seek(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * DURATION); };
  const section = [...SECTIONS].reverse().find((s) => time >= s.t)?.name ?? '';

  return (
    <div className="min-h-screen w-full text-[#3b2a5c] flex flex-col" style={{ fontFamily: FONT_STACK, background: 'linear-gradient(180deg,#fff4e6 0%,#ffe6ef 45%,#e9e6ff 100%)' }}>
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 md:px-8 pt-4 pb-3">
        <div className="flex items-baseline gap-3">
          <h1 className="text-3xl md:text-4xl tracking-[0.25em] text-[#ff7a59]" style={{ textShadow: '0 3px 0 #ffd2b8, 0 6px 14px rgba(255,122,89,0.35)' }}>慌啥子嘛</h1>
          <span className="text-xs md:text-sm text-[#7a6a9a]">鲸鱼娘番外 MV · 软 3D 逐字逐词歌词 · 130 BPM 卡点</span>
        </div>
        <nav className="flex gap-1.5 text-sm">
          {([['lyrics', '歌词与意思'], ['cast', '登场人物'], ['shots', '分镜']] as [Tab, string][]).map(([k, n]) => (
            <button key={k} onClick={() => setTab(k)} className={`px-3.5 py-1.5 rounded-full transition shadow-sm ${tab === k ? 'bg-[#ff8a65] text-white shadow-[0_3px_0_#e0603d]' : 'bg-white/70 text-[#6b5a8a] hover:bg-white'}`}>{n}</button>
          ))}
        </nav>
      </header>

      <main className="flex-1 flex flex-col xl:flex-row gap-4 px-3 md:px-8 pb-6">
        <section ref={wrapRef} className="flex-1 min-w-0 flex flex-col items-center">
          <div ref={stageRef} onPointerMove={poke} className="relative rounded-[22px] overflow-hidden bg-[#1c1640] shadow-[0_18px_50px_rgba(90,60,140,0.35)] ring-4 ring-white/70" style={{ width: size.w, height: size.h, borderRadius: fs ? 0 : undefined }}>
            <canvas ref={canvasRef} className="block w-full h-full" onClick={() => void toggle()} />
            {phase !== 'ready' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-[#ffd9c2] to-[#c9c2ff]">
                <div className="text-4xl tracking-[0.3em] text-white" style={{ textShadow: '0 4px 0 #ff8a65' }}>慌啥子嘛</div>
                {phase === 'loading' ? (<>
                  <div className="w-56 h-3 rounded-full bg-white/60 overflow-hidden"><div className="h-full bg-[#ff8a65] transition-all" style={{ width: `${Math.round(prog * 100)}%` }} /></div>
                  <div className="text-sm text-[#5b4a7a]">慢慢来，载入中 {Math.round(prog * 100)}%</div>
                </>) : <div className="text-sm text-red-700 px-6 text-center">载入失败：{err}</div>}
              </div>
            )}
            {phase === 'ready' && !started && (
              <button onClick={() => void toggle()} className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/25 hover:bg-black/15 transition group">
                <span className="w-24 h-24 rounded-full bg-white/90 flex items-center justify-center shadow-[0_6px_0_#ffb59c] group-hover:scale-105 transition">
                  <span className="ml-2 border-l-[30px] border-l-[#ff7a59] border-y-[19px] border-y-transparent" />
                </span>
                <span className="text-white text-lg tracking-widest drop-shadow">点击开始观看</span>
                {silent && <span className="text-xs text-white/80">（这个浏览器解不开音轨，会按无声时钟播放）</span>}
              </button>
            )}
            {ended && (
              <button onClick={() => void jump(0)} className="absolute right-4 top-4 px-4 py-2 rounded-full bg-white/90 text-[#ff7a59] text-sm shadow">重播</button>
            )}
            {phase === 'ready' && started && (
              <div className={`absolute inset-x-0 bottom-0 px-4 pb-3 pt-10 bg-gradient-to-t from-black/55 to-transparent transition-opacity ${ctlVis || !playing ? 'opacity-100' : 'opacity-0'}`}>
                <div ref={barRef} onPointerDown={(e) => { (e.target as HTMLElement).setPointerCapture(e.pointerId); onBar(e); }} onPointerMove={(e) => e.buttons && onBar(e)} className="relative h-2.5 rounded-full bg-white/25 cursor-pointer">
                  <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#ffd166] to-[#ff8a65]" style={{ width: `${(time / DURATION) * 100}%` }} />
                  {SECTIONS.map((s) => <div key={s.name + s.t} className="absolute top-1/2 -translate-y-1/2 w-1 h-3.5 rounded bg-white/70" style={{ left: `${(s.t / DURATION) * 100}%` }} title={s.name} />)}
                </div>
                <div className="mt-2 flex items-center gap-3 text-white text-sm">
                  <button onClick={() => void toggle()} className="w-9 h-9 rounded-full bg-white/90 text-[#ff7a59] flex items-center justify-center">
                    {playing ? <span className="flex gap-1"><span className="w-1.5 h-4 bg-current rounded" /><span className="w-1.5 h-4 bg-current rounded" /></span> : <span className="ml-1 border-l-[13px] border-l-current border-y-[8px] border-y-transparent" />}
                  </button>
                  <span className="tabular-nums">{fmt(time)} / {fmt(DURATION)}</span>
                  <span className="hidden sm:inline px-2 py-0.5 rounded-full bg-white/20 text-xs">{section} · {SHOTS[shot]?.label}</span>
                  <span className="flex-1" />
                  <button onClick={() => { const p = playerRef.current; if (!p) return; const m = !p.muted; p.setMuted(m); setMuted(m); }} className="px-2 py-1 rounded bg-white/15 text-xs">{muted ? '取消静音' : '静音'}</button>
                  <button onClick={() => (fs ? document.exitFullscreen() : stageRef.current?.requestFullscreen?.())} className="px-2 py-1 rounded bg-white/15 text-xs">{fs ? '退出全屏' : '全屏'}</button>
                </div>
              </div>
            )}
          </div>
          <div className="w-full mt-3 rounded-2xl bg-white/70 px-5 py-3 shadow-sm" style={{ maxWidth: size.w }}>
            <div className="text-xs text-[#9a8ab8] mb-1">这一句在说什么</div>
            <div className="text-[15px] leading-relaxed min-h-[1.6em]">{cur ? <><span className="text-[#ff7a59] mr-2">「{cur.text}」</span>{curMean}</> : started ? '（间奏，慢慢听）' : '一首四川话的歌：「慌啥子嘛」就是「急什么嘛」。整支片子从「大家都在赶」开始，到「坐在月亮上睡着」结束。'}</div>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#7a6a9a]">
            <span className="text-[#9a8ab8]">歌词对齐微调</span>
            <button onClick={() => { const v = Math.max(-1.5, +(loff - 0.05).toFixed(2)); setLoff(v); if (engineRef.current) engineRef.current.lyricOffset = v; dirty.current = true; }} className="px-2.5 py-1 rounded-full bg-white/80 hover:bg-white shadow-sm">提前 0.05 秒</button>
            <span className="tabular-nums w-16 text-center">{loff > 0 ? '+' : ''}{loff.toFixed(2)} 秒</span>
            <button onClick={() => { const v = Math.min(1.5, +(loff + 0.05).toFixed(2)); setLoff(v); if (engineRef.current) engineRef.current.lyricOffset = v; dirty.current = true; }} className="px-2.5 py-1 rounded-full bg-white/80 hover:bg-white shadow-sm">延后 0.05 秒</button>
            <button onClick={() => { setLoff(0); if (engineRef.current) engineRef.current.lyricOffset = 0; dirty.current = true; }} className="px-2 py-1 rounded-full bg-white/50 hover:bg-white/80">归零</button>
            <span className="text-[#b8a8d0]">·</span>
            <span className="text-[#9a8ab8]">空格 播放/暂停 · ←→ 快退/快进 5 秒 · F 全屏 · M 静音</span>
          </div>
        </section>

        <aside className="xl:w-[400px] w-full rounded-3xl bg-white/75 shadow-[0_10px_30px_rgba(120,90,170,0.18)] overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 120px)' }}>
          {tab === 'lyrics' && (
            <div ref={listRef} className="relative overflow-y-auto px-4 py-4 space-y-1.5 min-h-[300px]">
              {LYRICS.map((l, i) => {
                const active = i === line; const words = lineWords[i]; let ci = 0;
                return (
                  <button key={i} data-line={i} onClick={() => void jump(l.t[0] - 0.4)} className={`block w-full text-left rounded-2xl px-3 py-2 transition ${active ? 'bg-[#fff1e8] shadow-[0_3px_0_#ffd2b8]' : 'hover:bg-white'}`}>
                    <div className="flex flex-wrap items-baseline gap-x-1.5 text-lg">
                      <span className="text-[10px] text-[#b8a8d0] w-6 tabular-nums">{fmt(l.t[0])}</span>
                      {words.map((w, wi) => (
                        <span key={wi} className={`${w.gap ? 'ml-2' : ''} ${w.key ? 'px-1 rounded-md bg-[#ffe1d2]' : ''}`}>
                          {[...w.text].map((c) => { const k = ci++; const sung = active && k <= charIdx; return <span key={k} className="transition-colors" style={{ color: sung ? (w.key ? '#ff5f3d' : '#ff8a65') : active ? '#3b2a5c' : '#8a7aa8', textShadow: sung ? '0 2px 0 #ffd2b8' : 'none' }}>{c}</span>; })}
                        </span>
                      ))}
                    </div>
                    {active && LINE_DEF[l.text] && <div className="mt-1 ml-7 text-xs text-[#7a6a9a] leading-relaxed">{LINE_DEF[l.text].mean}</div>}
                  </button>
                );
              })}
            </div>
          )}
          {tab === 'cast' && (
            <div className="overflow-y-auto p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
              {CAST.map((c) => (
                <div key={c.name} className="flex gap-3 items-center rounded-2xl bg-white px-3 py-2.5 shadow-sm">
                  <div className="w-16 h-20 flex items-end justify-center rounded-xl bg-gradient-to-b from-[#ffe9dc] to-[#e9e3ff] shrink-0"><Sprite k={c.k} h={72} /></div>
                  <div><div className="text-base">{c.name} <span className="text-xs text-[#ff7a59] ml-1">{c.role}</span></div><div className="text-xs text-[#7a6a9a] leading-relaxed mt-0.5">{c.desc}</div></div>
                </div>
              ))}
              <p className="text-[11px] text-[#a898c0] px-1">人物形象取自分支 arena/bb6a02da-latest-aiyunying 的像素图集，在三维世界里做成带厚度的软立体贴纸。</p>
            </div>
          )}
          {tab === 'shots' && (
            <div className="overflow-y-auto p-3 space-y-1">
              {SHOTS.map((s, i) => (
                <button key={i} onClick={() => void jump(s.a + 0.02)} className={`w-full flex items-center gap-3 text-left rounded-xl px-3 py-2 text-sm transition ${i === shot ? 'bg-[#fff1e8] shadow-[0_2px_0_#ffd2b8]' : 'hover:bg-white'}`}>
                  <span className="text-[11px] text-[#b8a8d0] tabular-nums w-9">{fmt(s.a)}</span>
                  <span className="flex-1">{s.label}</span>
                  {s.line && <span className="text-[11px] text-[#9a8ab8] truncate max-w-[45%]">{LYRICS[s.line - 1].text}</span>}
                </button>
              ))}
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
