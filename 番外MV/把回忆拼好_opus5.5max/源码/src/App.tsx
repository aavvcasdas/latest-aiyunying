import { useCallback, useEffect, useRef, useState } from 'react';
import { Engine } from './mv/engine';
import { NAMES, SHOTS } from './mv/shots';
import { Player } from './mv/audio';
import { ATLAS_URL } from './mv/actors';
import { ATLAS_H, ATLAS_RECTS, ATLAS_W, DURATION, LYRICS } from './mv/data';
import { FONT_FAMILY } from './mv/glyphs';
import { KEYWORDS } from './mv/lyricsRig';

const FF = `'${FONT_FAMILY}', 'PingFang SC', 'Microsoft YaHei', sans-serif`;
const fmt = (t: number) => { const m = Math.floor(t / 60); const s = t - m * 60; return `${m}:${s.toFixed(1).padStart(4, '0')}`; };
const FACE: Record<string, string> = { whale: 'act_whale_idle_0', claude: 'act_claude_idle_0', gemini: 'act_gemini_idle_0', gpt: 'act_gpt_hover_0', kimi: 'act_kimi_idle_0', doubao: 'act_doubao_idle_0', qwen: 'act_qwen_idle_0', zai: 'act_zai_idle_0' };

function Sprite({ k, h }: { k: string; h: number }) {
  const r = ATLAS_RECTS[k];
  if (!r) return null;
  const s = h / r[3];
  return (
    <div
      style={{
        width: r[2] * s, height: h, backgroundImage: `url(${ATLAS_URL})`, backgroundRepeat: 'no-repeat',
        backgroundSize: `${ATLAS_W * s}px ${ATLAS_H * s}px`, backgroundPosition: `-${r[0] * s}px -${r[1] * s}px`, imageRendering: 'pixelated',
      }}
    />
  );
}

const CAST = [
  { id: 'whale', role: '「我」· 主角', desc: '渺小又真实的那块蓝色拼图。好东西总先推给别人——爱炙热的你，却忘了爱自己。道具：蓝饭盆（收集快乐）。最后把拼好的回忆推到你面前。' },
  { id: 'claude', role: '「你」', desc: '带着暖光漂来的橘色拼图，正好补上她缺的那一块。灰暗的日子端来两杯茶陪着发呆，翻开书拨开阴霾。道具：茶杯、书。' },
  { id: 'gemini', role: '时差的守钟人', desc: '「我们的爱总有时差」：站在白天与黑夜的缝上，左右各举一只猫耳钟（她的两只钟），先看两边，最后必须选一个。' },
  { id: 'gpt', role: '群像', desc: '龙娘、Kimi、豆包、千问、狐狸：开头灰色原野上一个个小小的灰影，结尾一起有了颜色，围过来看拼好的回忆。' },
];

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const whiteRef = useRef<HTMLDivElement>(null);
  const blackRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);
  const engineRef = useRef<Engine | null>(null);
  const dirty = useRef(true);
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading');
  const [progress, setProgress] = useState(0);
  const [err, setErr] = useState('');
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [shot, setShot] = useState(0);
  const [silent, setSilent] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current!, stage = stageRef.current!;
    const eng = new Engine(canvas, SHOTS); engineRef.current = eng;
    const player = new Player(); playerRef.current = player;
    player.onEnded = () => { setPlaying(false); dirty.current = true; };
    let alive = true;
    const resize = () => { const r = stage.getBoundingClientRect(); eng.setSize(r.width, r.height); dirty.current = true; };
    const ro = new ResizeObserver(resize); ro.observe(stage); resize();
    (async () => {
      try {
        await Promise.all([eng.load((p) => { if (alive) setProgress(p); }), player.load()]);
        if (!alive) return;
        setSilent(player.silent); setProgress(1); setPhase('ready'); dirty.current = true;
      } catch (e) {
        console.error(e);
        if (alive) { setErr(e instanceof Error ? e.message : String(e)); setPhase('error'); }
      }
    })();
    // 预览 / 自检用的小钩子：在控制台里 __mv.seek(秒) 跳到任意一帧
    (window as unknown as { __mv: unknown }).__mv = {
      seek: (t: number) => { player.seek(t); setStarted(true); dirty.current = true; },
      ready: () => eng.ready,
      // 截帧用：给时间就给一帧（离屏合成闪白 / 黑场后导 JPEG），tools/shoot_opus_mv.mjs 走这条路
      render: (t: number) => {
        player.seek(t); eng.render(t);
        if (whiteRef.current) whiteRef.current.style.opacity = String(eng.fx.white);
        if (blackRef.current) blackRef.current.style.opacity = String(eng.fx.black);
        if (frameRef.current) frameRef.current.style.opacity = String(eng.fx.frame);
        const src = canvas;
        const off = document.createElement('canvas');
        off.width = src.width; off.height = src.height;
        const g = off.getContext('2d')!;
        g.drawImage(src, 0, 0);
        if (eng.fx.white > 0) { g.fillStyle = `rgba(255,255,255,${eng.fx.white})`; g.fillRect(0, 0, off.width, off.height); }
        if (eng.fx.black > 0) { g.fillStyle = `rgba(0,0,0,${eng.fx.black})`; g.fillRect(0, 0, off.width, off.height); }
        return off.toDataURL('image/jpeg', 0.93);
      },
      // 出封面用：不画歌词条（封面只要主题，不要字幕碎片），tools/shoot_cover.mjs 走这条路
      cover: (t: number) => {
        player.seek(t);
        const ly = (eng as unknown as { lyric: { root: { visible: boolean } } | null }).lyric;
        if (ly) ly.root.visible = false;
        eng.render(t);
        const src = canvas;
        const off = document.createElement('canvas');
        off.width = src.width; off.height = src.height;
        const g = off.getContext('2d')!;
        g.drawImage(src, 0, 0);
        if (eng.fx.white > 0) { g.fillStyle = `rgba(255,255,255,${eng.fx.white})`; g.fillRect(0, 0, off.width, off.height); }
        if (eng.fx.black > 0) { g.fillStyle = `rgba(0,0,0,${eng.fx.black})`; g.fillRect(0, 0, off.width, off.height); }
        if (ly) ly.root.visible = true;
        return off.toDataURL('image/jpeg', 0.95);
      },
    };
    let raf = 0, lastQ = -1, lastShot = -1;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      if (!eng.ready) return;
      let T = player.time();
      if (player.playing && T >= DURATION - 0.02) { player.pause(); player.seek(DURATION); T = player.time(); setPlaying(false); dirty.current = true; }
      if (player.playing || dirty.current) {
        dirty.current = false;
        eng.render(T);
        if (whiteRef.current) whiteRef.current.style.opacity = String(eng.fx.white);
        if (blackRef.current) blackRef.current.style.opacity = String(eng.fx.black);
        if (frameRef.current) frameRef.current.style.opacity = String(eng.fx.frame);
      }
      const q = Math.floor(T * 10);
      if (q !== lastQ) { lastQ = q; setTime(T); }
      if (eng.shotIndex !== lastShot) { lastShot = eng.shotIndex; setShot(eng.shotIndex); }
    };
    raf = requestAnimationFrame(loop);
    return () => { alive = false; cancelAnimationFrame(raf); ro.disconnect(); player.pause(); };
  }, []);

  const toggle = useCallback(async () => {
    const p = playerRef.current;
    if (!p || phase !== 'ready') return;
    if (p.playing) { p.pause(); setPlaying(false); }
    else { await p.play(); setPlaying(true); setStarted(true); }
    dirty.current = true;
  }, [phase]);

  const seek = useCallback((t: number) => {
    const p = playerRef.current; if (!p) return;
    p.seek(Math.max(0, Math.min(DURATION - 0.01, t))); setTime(p.time()); dirty.current = true;
  }, []);

  const jump = useCallback(async (t: number) => {
    const p = playerRef.current; if (!p || phase !== 'ready') return;
    seek(t);
    if (!p.playing) { await p.play(t); setPlaying(true); setStarted(true); }
  }, [phase, seek]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.code === 'Space') { e.preventDefault(); void toggle(); }
      if (e.code === 'ArrowRight') seek((playerRef.current?.time() ?? 0) + 3);
      if (e.code === 'ArrowLeft') seek((playerRef.current?.time() ?? 0) - 3);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle, seek]);

  const full = () => { const s = stageRef.current; if (!s) return; if (document.fullscreenElement) void document.exitFullscreen(); else void s.requestFullscreen?.(); };
  const cur = SHOTS[shot];

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,#2a2350_0%,#12131f_55%,#0b0c14_100%)] text-slate-100">
      <div className="mx-auto max-w-[1180px] px-4 pb-16 pt-6 sm:px-6">
        <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl tracking-wide text-amber-100 sm:text-4xl" style={{ fontFamily: FF }}>《把回忆拼好给你》</h1>
            <p className="mt-1 text-sm text-slate-400">立体拼图 MV · 鲸鱼娘 × 小克 · 逐字卡点复刻 · 60 秒 · 22 镜 · 17 句</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 ring-1 ring-white/10">
            {['whale', 'claude', 'gemini', 'gpt', 'kimi', 'doubao', 'qwen', 'zai'].map((id) => <div key={id} title={NAMES[id]}><Sprite k={FACE[id]} h={30} /></div>)}
          </div>
        </header>

        <div ref={stageRef} className="group relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] ring-1 ring-white/10" onClick={() => started && void toggle()}>
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.38)_100%)]" />
          <div ref={whiteRef} className="pointer-events-none absolute inset-0 bg-white opacity-0" />
          <div ref={blackRef} className="pointer-events-none absolute inset-0 bg-black opacity-0" />
          <div ref={frameRef} className="pointer-events-none absolute inset-[6%] opacity-0">
            {['left-0 top-0 border-l-4 border-t-4', 'right-0 top-0 border-r-4 border-t-4', 'bottom-0 left-0 border-b-4 border-l-4', 'bottom-0 right-0 border-b-4 border-r-4'].map((c) => (
              <div key={c} className={`absolute h-[12%] w-[8%] border-white/90 ${c}`} />
            ))}
          </div>
          {!started && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0c0f24]/80 backdrop-blur-[2px]">
              <div className="mb-4 flex items-end gap-3">
                <Sprite k="act_whale_idle_0" h={110} />
                <Sprite k="act_claude_idle_0" h={112} />
              </div>
              <h2 className="text-center text-3xl text-amber-100 sm:text-5xl" style={{ fontFamily: FF }}>把回忆拼好给你</h2>
              <p className="mt-2 text-center text-xs text-slate-300 sm:text-sm">BGM 与逐字卡点取自原视频 · 角色来自分支图集</p>
              {phase === 'loading' && (
                <div className="mt-6 w-56">
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-amber-300 transition-all" style={{ width: `${Math.round(progress * 100)}%` }} /></div>
                  <p className="mt-2 text-center text-xs text-slate-400">正在拼拼图… {Math.round(progress * 100)}%</p>
                </div>
              )}
              {phase === 'ready' && (
                <button onClick={(e) => { e.stopPropagation(); void toggle(); }} className="mt-6 rounded-full bg-amber-300 px-8 py-3 text-lg font-bold text-[#2a1d10] shadow-lg shadow-amber-500/30 transition hover:scale-105 hover:bg-amber-200" style={{ fontFamily: FF }}>
                  ▶ 播放
                </button>
              )}
              {phase === 'error' && <p className="mt-6 max-w-md px-6 text-center text-sm text-rose-300">加载失败：{err}</p>}
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3 rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10">
          <button disabled={phase !== 'ready'} onClick={() => void toggle()} className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-300 text-[#2a1d10] transition hover:bg-amber-200 disabled:opacity-40" aria-label={playing ? '暂停' : '播放'}>
            {playing ? (
              <svg width="14" height="14" viewBox="0 0 14 14"><rect x="2" y="1" width="3.5" height="12" rx="1" fill="currentColor" /><rect x="8.5" y="1" width="3.5" height="12" rx="1" fill="currentColor" /></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 1.5v11l9.5-5.5z" fill="currentColor" /></svg>
            )}
          </button>
          <span className="w-24 font-mono text-xs tabular-nums text-slate-300">{fmt(time)} / {fmt(DURATION)}</span>
          <input type="range" min={0} max={DURATION} step={0.01} value={time} disabled={phase !== 'ready'} onChange={(e) => seek(parseFloat(e.target.value))} className="min-w-[160px] flex-1 accent-amber-300" />
          <button onClick={full} className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-slate-200 hover:bg-white/20">全屏</button>
        </div>
        {silent && <p className="mt-2 text-xs text-rose-300">这个浏览器没能解码音轨，正在无声播放（画面卡点不受影响）。</p>}

        <div className="mt-3 rounded-xl bg-gradient-to-r from-amber-200/10 to-transparent p-4 ring-1 ring-amber-200/15">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="rounded bg-amber-300/90 px-1.5 py-0.5 font-mono text-[11px] font-bold text-[#2a1d10]">{cur.id}</span>
            <span className="text-lg text-amber-100" style={{ fontFamily: FF }}>{cur.name}</span>
            <span className="text-sm text-slate-300">「{cur.lyric}」</span>
            <span className="font-mono text-[11px] text-slate-500">{cur.t0.toFixed(2)}–{cur.t1.toFixed(2)}s</span>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-slate-300">{cur.note}</p>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
          <section>
            <h3 className="mb-3 text-xl text-amber-100" style={{ fontFamily: FF }}>分镜表 · 理解歌词再拍</h3>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {SHOTS.map((s, i) => (
                <button key={s.id} onClick={() => void jump(s.t0 + 0.01)} className={`rounded-xl p-3 text-left ring-1 transition ${i === shot ? 'bg-amber-200/15 ring-amber-300/60' : 'bg-white/[0.04] ring-white/10 hover:bg-white/[0.08]'}`}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] text-amber-300">{s.id}</span>
                    <span className="text-sm font-semibold text-slate-100">{s.name}</span>
                    <span className="ml-auto font-mono text-[10px] text-slate-500">{s.t0.toFixed(1)}s</span>
                  </div>
                  <div className="mt-1 text-xs text-amber-100/80">「{s.lyric}」</div>
                  <p className="mt-1.5 line-clamp-3 text-[11px] leading-relaxed text-slate-400">{s.note}</p>
                  <div className="mt-2 flex items-end gap-1">
                    {s.cast.slice(0, 8).map((c) => <div key={c} title={NAMES[c]}><Sprite k={FACE[c]} h={22} /></div>)}
                  </div>
                </button>
              ))}
            </div>
          </section>

          <aside className="space-y-8">
            <section>
              <h3 className="mb-3 text-xl text-amber-100" style={{ fontFamily: FF }}>登场人物</h3>
              <div className="space-y-2.5">
                {CAST.map((c) => (
                  <div key={c.id} className="flex gap-3 rounded-xl bg-white/[0.04] p-3 ring-1 ring-white/10">
                    <div className="flex w-14 shrink-0 items-end justify-center"><Sprite k={FACE[c.id]} h={56} /></div>
                    <div>
                      <div className="text-sm"><span className="font-semibold text-slate-100">{NAMES[c.id]}</span><span className="ml-2 text-amber-300">{c.role}</span></div>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{c.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            <section>
              <h3 className="mb-1 text-xl text-amber-100" style={{ fontFamily: FF }}>逐字卡点</h3>
              <p className="mb-3 text-[11px] leading-relaxed text-slate-500">从原视频逐帧量出每块字幕拼图的弹出时刻（30fps），再与人声起音核对。画面里每个立体字都按这里的时间弹出；金 / 粉 / 蓝 / 灰是关键词。</p>
              <div className="space-y-1.5">
                {LYRICS.map((l, li) => {
                  const kw = new Map<number, string>();
                  for (const [s, n, kind] of KEYWORDS[li] ?? []) for (let j = s; j < s + n; j++) kw.set(j, kind);
                  const color: Record<string, string> = { gold: 'text-amber-300', pink: 'text-pink-300', blue: 'text-sky-300', grey: 'text-slate-400' };
                  const active = time >= l.t[0] && time < l.end;
                  return (
                    <button key={li} onClick={() => void jump(Math.max(0, l.t[0] - 0.3))} className={`flex w-full items-baseline gap-2 rounded-lg px-2 py-1 text-left transition ${active ? 'bg-white/10' : 'hover:bg-white/5'}`}>
                      <span className="w-10 shrink-0 font-mono text-[10px] text-slate-500">{l.t[0].toFixed(2)}</span>
                      <span className="text-sm" style={{ fontFamily: FF }}>
                        {Array.from(l.text).map((ch, ci) => (
                          <span key={ci} title={`${l.t[ci].toFixed(2)}s`} className={`${kw.has(ci) ? color[kw.get(ci)!] : 'text-slate-200'} ${active && time >= l.t[ci] ? 'opacity-100' : active ? 'opacity-35' : ''}`}>{ch}</span>
                        ))}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          </aside>
        </div>
        <footer className="mt-12 text-center text-[11px] text-slate-600">空格 播放 / 暂停 · ← → 快退 / 快进 3 秒 · 点画面也能暂停</footer>
      </div>
    </div>
  );
}
