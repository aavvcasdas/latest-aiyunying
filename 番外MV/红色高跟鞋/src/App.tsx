import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import atlasUrl from './mv/assets/atlas.png';
import fontUrl from './mv/assets/font.woff';
import songUrl from './mv/assets/song.mp3';
import { BPM, DUR, H, W } from './mv/core';
import { LINES, lineAt, type Style } from './mv/cues';
import { renderFilm } from './mv/film';
import { buildAtlas, type Atlas } from './mv/sprites';

const fmt = (t: number) => {
  const s = Math.max(0, t);
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}.${Math.floor((s % 1) * 10)}`;
};

// 逐字条里每种字的颜色（和画面里的立体字同色系）
const TINT: Record<Style, string> = {
  tag: '#f4eddc', quilt: '#f58aa8', cozy: '#9fb3d1', wind: '#8fe3da', mist: '#d9c8f2', perfume: '#f58aa8',
  love: '#ff5a6c', heel: '#ff6e7c', sign: '#9db4ff', gold: '#ffd98a', stamp: '#ff5a6c', title: '#ffd98a',
};

const CAST = [
  { id: 'whale', name: '本鲸', role: '追着红鞋的女孩', note: '隔着橱窗看、转身走开、在桥上淋雨——怕自己不够好才不被留下。' },
  { id: 'claude', name: '小克', role: '鞋店里的那个人', note: '一直在橱窗里看着，不解释；最后撑着伞把鞋盒送到桥上。' },
  { id: 'gemini', name: '猫', role: '斑马线对面的路人', note: '左看右看选不定路，正好站在「左灯右行」那一句里。' },
  { id: 'zai', name: '狐狸', role: '长椅上打盹的路人', note: '路灯下睡过整条街的风雪。' },
  { id: 'extras', name: '豆包 · Kimi · 千问', role: '栈桥上的远景路人', note: '结尾只做各自的招牌小动作，不抢主角。' },
];

const TOTAL_CHARS = LINES.reduce((n, l) => n + l.chars.length, 0);

function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const el = document.createElement('a');
  el.href = url;
  el.download = name;
  el.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const srtTime = (t: number) => {
  const ms = Math.round(t * 1000);
  const p = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};

function exportCues() {
  const data = {
    title: '红色高跟鞋',
    duration: DUR,
    bpm: BPM,
    measured: true,
    lines: LINES.map((l) => ({
      id: l.id,
      text: l.text,
      start: l.chars[0].t,
      end: l.out,
      chars: l.chars.map((c) => ({ c: c.c, t: c.t, land: c.land, style: c.s, ...(c.src ? { src: c.src } : {}) })),
    })),
  };
  download('cues.json', JSON.stringify(data, null, 2), 'application/json');
}

function exportSrt() {
  const srt = LINES.map((l, i) => `${i + 1}\n${srtTime(l.chars[0].t)} --> ${srtTime(l.out)}\n${l.text}\n`).join('\n');
  download('歌词.srt', srt, 'text/plain');
}

export default function App() {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const atlasRef = useRef<Atlas | null>(null);
  const clock = useRef({ base: 0, stamp: 0, last: -1, drawn: -1, size: 0 });

  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [muted, setMuted] = useState(false);
  const [t, setT] = useState(0);

  // 素材：字体、图集、音轨都内联在这一个文件里
  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const font = new FontFace('MVFont', `url(${fontUrl})`);
        await font.load();
        document.fonts.add(font);
        const img = new Image();
        img.src = atlasUrl;
        await img.decode();
        // 转成 Blob 地址，拖动进度更稳；取不到就直接用内联地址
        let src = songUrl;
        try {
          src = URL.createObjectURL(await (await fetch(songUrl)).blob());
        } catch {
          src = songUrl;
        }
        const audio = new Audio(src);
        audio.preload = 'auto';
        if (dead) return;
        atlasRef.current = buildAtlas(img, img.naturalWidth, img.naturalHeight);
        audioRef.current = audio;
        audio.addEventListener('play', () => { setPlaying(true); setStarted(true); setEnded(false); });
        audio.addEventListener('pause', () => setPlaying(false));
        audio.addEventListener('ended', () => { setPlaying(false); setEnded(true); });
        setReady(true);
      } catch (e) {
        setError(String(e));
      }
    })();
    return () => {
      dead = true;
      audioRef.current?.pause();
    };
  }, []);

  // 以音轨时间为准；两次 currentTime 更新之间用系统时钟补帧，画面不卡顿
  const now = useCallback(() => {
    const a = audioRef.current;
    if (!a) return 0;
    if (a.ended) return DUR;
    const ct = a.currentTime;
    if (a.paused) return ct;
    const c = clock.current;
    const n = performance.now();
    if (ct !== c.last) {
      c.last = ct;
      c.base = ct;
      c.stamp = n;
    }
    return Math.min(DUR, c.base + ((n - c.stamp) / 1000) * a.playbackRate);
  }, []);

  useEffect(() => {
    if (!ready) return;
    let raf = 0;
    let uiStamp = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const cv = canvasRef.current, A = atlasRef.current;
      if (!cv || !A) return;
      const rect = cv.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(320, Math.min(W, Math.round(rect.width * dpr)));
      const h = Math.round((w * H) / W);
      if (cv.width !== w || cv.height !== h) {
        cv.width = w;
        cv.height = h;
      }
      const time = now();
      const c = clock.current;
      if (time !== c.drawn || c.size !== w) {
        c.drawn = time;
        c.size = w;
        const ctx = cv.getContext('2d')!;
        ctx.setTransform(w / W, 0, 0, w / W, 0, 0);
        ctx.globalAlpha = 1;
        try {
          renderFilm(ctx, A, time);
        } catch (e) {
          cancelAnimationFrame(raf);
          setError(String(e));
          return;
        }
      }
      const n = performance.now();
      if (n - uiStamp > 45) {
        uiStamp = n;
        setT(time);
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [ready, now]);

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused || a.ended) {
      if (a.ended || a.currentTime >= DUR - 0.05) a.currentTime = 0;
      clock.current.last = -1;
      void a.play();
    } else a.pause();
  }, []);

  const seek = useCallback((time: number) => {
    const a = audioRef.current;
    if (!a) return;
    a.currentTime = Math.max(0, Math.min(DUR - 0.02, time));
    clock.current.last = -1;
    setEnded(false);
    setStarted(true);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); toggle(); }
      else if (e.code === 'ArrowLeft') seek(now() - 2);
      else if (e.code === 'ArrowRight') seek(now() + 2);
      else if (e.code === 'Home') seek(0);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle, seek, now]);

  const scrub = (e: React.PointerEvent) => {
    const r = barRef.current!.getBoundingClientRect();
    seek(((e.clientX - r.left) / r.width) * DUR);
  };

  const fullscreen = () => {
    const el = stageRef.current;
    if (!el) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void el.requestFullscreen?.();
  };

  const line = lineAt(t);
  const ticks = useMemo(() => LINES.flatMap((l) => l.chars.map((c) => ({ t: c.t, big: c.s !== 'tag', s: c.s }))), []);

  return (
    <div className="min-h-screen bg-[#14132b] text-[#f4eddc]" style={{ fontFamily: '"PingFang SC","Microsoft YaHei","Noto Sans SC",system-ui,sans-serif' }}>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs tracking-[0.3em] text-[#f58aa8]">番外 MV · 复刻</p>
            <h1 className="mt-1 text-3xl font-black tracking-wide sm:text-4xl">
              《红色高跟鞋》
              <span className="ml-3 align-middle text-base font-medium text-[#b9b4d6]">本鲸 × 小克</span>
            </h1>
          </div>
          <p className="text-xs leading-relaxed text-[#b9b4d6]">
            {DUR.toFixed(1)} 秒 · {LINES.length} 句 · {TOTAL_CHARS} 个字逐字卡点 · {BPM} BPM
          </p>
        </header>

        {/* 舞台 */}
        <div ref={stageRef} className="stage relative flex items-center justify-center overflow-hidden rounded-2xl bg-black shadow-[0_30px_80px_-20px_rgba(0,0,0,.8)] ring-1 ring-white/10">
          <canvas ref={canvasRef} className="block aspect-video w-full cursor-pointer" onClick={toggle} />
          {(!started || ended || !ready) && (
            <button
              type="button"
              onClick={toggle}
              disabled={!ready}
              className="group absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#14132b]/55 backdrop-blur-[2px] transition hover:bg-[#14132b]/40 disabled:cursor-wait"
            >
              {error ? (
                <span className="rounded-lg bg-[#d62a3c] px-4 py-2 text-sm">素材加载失败：{error}</span>
              ) : !ready ? (
                <span className="animate-pulse text-sm tracking-widest text-[#b9b4d6]">正在摆好纸片与音轨</span>
              ) : (
                <>
                  <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#e02a42] shadow-[0_8px_0_#8e1029,0_18px_30px_rgba(0,0,0,.45)] ring-4 ring-[#f4eddc] transition group-hover:scale-105 sm:h-24 sm:w-24">
                    <svg viewBox="0 0 24 24" className="ml-1 h-9 w-9 fill-[#f4eddc] sm:h-11 sm:w-11"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5Z" /></svg>
                  </span>
                  <span className="text-sm tracking-[0.25em]">{ended ? '再看一遍' : '点击播放（有声音）'}</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* 控制条 */}
        <div className="mt-4 rounded-2xl bg-[#1d1c3d] p-4 ring-1 ring-white/5">
          <div className="flex items-center gap-3">
            <button type="button" onClick={toggle} disabled={!ready} aria-label={playing ? '暂停' : '播放'} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e02a42] text-[#f4eddc] shadow-[0_4px_0_#8e1029] transition active:translate-y-0.5 active:shadow-[0_2px_0_#8e1029] disabled:opacity-40">
              {playing ? (
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current"><rect x="6" y="5" width="4.5" height="14" rx="1.2" /><rect x="13.5" y="5" width="4.5" height="14" rx="1.2" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" className="ml-0.5 h-5 w-5 fill-current"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12.5-7.5a1 1 0 0 0 0-1.72L8.5 3.64A1 1 0 0 0 7 4.5Z" /></svg>
              )}
            </button>
            <span className="w-24 shrink-0 text-sm tabular-nums text-[#b9b4d6]">
              <b className="text-[#f4eddc]">{fmt(t)}</b> / {fmt(DUR)}
            </span>
            <div
              ref={barRef}
              role="slider"
              aria-label="进度"
              aria-valuemin={0}
              aria-valuemax={DUR}
              aria-valuenow={t}
              tabIndex={0}
              onPointerDown={(e) => { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); scrub(e); }}
              onPointerMove={(e) => { if (e.buttons & 1) scrub(e); }}
              className="relative h-11 flex-1 cursor-pointer touch-none select-none"
            >
              <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-[#2c2b55]" />
              <div className="absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-gradient-to-r from-[#f58aa8] to-[#e02a42]" style={{ width: `${(t / DUR) * 100}%` }} />
              {ticks.map((k, i) => (
                <span
                  key={i}
                  className="absolute bottom-0 w-px rounded-full"
                  style={{ left: `${(k.t / DUR) * 100}%`, height: k.big ? 14 : 8, background: TINT[k.s], opacity: t >= k.t ? 1 : 0.35, width: k.big ? 2 : 1 }}
                />
              ))}
              <div className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f4eddc] shadow-[0_2px_0_#b9466e]" style={{ left: `${(t / DUR) * 100}%` }} />
            </div>
            <button type="button" aria-label={muted ? '取消静音' : '静音'} onClick={() => { const a = audioRef.current; if (a) { a.muted = !a.muted; setMuted(a.muted); } }} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2c2b55] text-[#f4eddc] transition hover:bg-[#3a3970]">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Z" className="fill-current" />
                {muted ? <path d="m16 9.5 5 5m0-5-5 5" /> : <path d="M16 8.5a5 5 0 0 1 0 7m2.5-9.5a8.5 8.5 0 0 1 0 12" />}
              </svg>
            </button>
            <button type="button" aria-label="全屏" onClick={fullscreen} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2c2b55] text-[#f4eddc] transition hover:bg-[#3a3970]">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
            </button>
          </div>

          {/* 逐字条：每个字到了自己的卡点才亮 */}
          <div className="mt-3 flex min-h-[64px] flex-wrap items-center justify-center gap-x-1 gap-y-1 rounded-xl bg-[#14132b] px-3 py-2">
            {line ? (
              line.chars.map((c, i) => {
                const hit = t >= c.t;
                const big = c.s !== 'tag';
                return (
                  <span
                    key={line.id + i}
                    className="inline-block font-black transition-all duration-150"
                    style={{
                      fontSize: big ? 34 : 22,
                      color: hit ? TINT[c.s] : '#4a4980',
                      transform: hit ? 'translateY(0) scale(1)' : 'translateY(4px) scale(.86)',
                      textShadow: hit && big ? '0 2px 0 rgba(0,0,0,.45), 0 0 18px ' + TINT[c.s] + '66' : 'none',
                    }}
                  >
                    {c.c}
                  </span>
                );
              })
            ) : (
              <span className="text-sm tracking-widest text-[#4a4980]">♪</span>
            )}
          </div>
          <p className="mt-2 text-center text-[11px] text-[#7d7aa8]">空格 播放/暂停 · ← → 前后两秒 · 进度条上的刻度是每个字的卡点（长刻度 = 立体大字）</p>
        </div>

        {/* 说明 */}
        <div className="mt-6 grid gap-4 md:grid-cols-5">
          <section className="rounded-2xl bg-[#1d1c3d] p-5 ring-1 ring-white/5 md:col-span-3">
            <h2 className="text-sm font-bold tracking-[0.2em] text-[#f58aa8]">谁演谁</h2>
            <ul className="mt-3 divide-y divide-white/5">
              {CAST.map((c) => (
                <li key={c.id} className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-baseline sm:gap-4">
                  <span className="w-40 shrink-0 font-bold">{c.name}</span>
                  <span className="w-40 shrink-0 text-sm text-[#ffd98a]">{c.role}</span>
                  <span className="text-sm leading-relaxed text-[#b9b4d6]">{c.note}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-2xl bg-[#1d1c3d] p-5 text-sm leading-relaxed text-[#b9b4d6] ring-1 ring-white/5 md:col-span-2">
            <h2 className="text-sm font-bold tracking-[0.2em] text-[#f58aa8]">这支片子怎么来的</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>音轨从分支里的《红色高跟鞋》.mp4 直接抽出，没有另找音源。</li>
              <li>歌词与卡点对原片字幕区逐帧比对：小字取贴上去的那一帧，大字取起砸和落定两帧。</li>
              <li>第一遍「红色高跟鞋」原片没有出字，这五个字的时刻取自人声起音。</li>
              <li>人物用分支图集里的像素小人和各自的动作格；字体是仓库自带的站酷快乐体。</li>
              <li>画面是逐帧按时间算出来的，拖到哪一秒都是同一帧。</li>
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={exportCues} className="rounded-lg bg-[#2c2b55] px-3 py-2 text-xs font-bold text-[#f4eddc] transition hover:bg-[#3a3970]">导出逐字卡点 cues.json</button>
              <button type="button" onClick={exportSrt} className="rounded-lg bg-[#2c2b55] px-3 py-2 text-xs font-bold text-[#f4eddc] transition hover:bg-[#3a3970]">导出 歌词.srt</button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
