import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import atlasUrl from './assets/atlas.png';
import fontUrl from './assets/font.woff2';
import songUrl from './assets/song.mp3';
import { createFilm, DUR, H, LINES, SHOTS, W, CUE } from './mv/film';

type Film = { render: (g: CanvasRenderingContext2D, t: number, opts?: object) => { shot: string } };

const SET_COLOR: Record<string, string> = {
  bamboo: '#3f8f6a', hill: '#4b5bb0', galaxy: '#3a3f9a', creek_spring: '#7fcf8a', creek_summer: '#3fb4ff', creek_autumn: '#f0a040', creek_winter: '#c8d8ea',
  garden_day: '#ff9bbf', garden_dusk: '#e8718d', garden_night: '#7a5ab0', meadow: '#c76a9a', meadow_night: '#5a4a9a', pond: '#d98a6a', beach: '#3a7ab0',
};
const SET_NAME: Record<string, string> = {
  bamboo: '竹林', hill: '萤火山坡', galaxy: '银河风铃亭', creek_spring: '溪边·春', creek_summer: '溪边·夏', creek_autumn: '溪边·秋', creek_winter: '溪边·冬',
  garden_day: '樱花草花园·昼', garden_dusk: '樱花草花园·黄昏', garden_night: '樱花草花园·夜', meadow: '黄昏草地', meadow_night: '夜草地', pond: '荷塘钟楼', beach: '白沙滩',
};
const CAST = [
  { id: 'whale', name: '本鲸', role: '种下樱花草的人（主角）' },
  { id: 'claude', name: '小克', role: '恋人，先听完再回应' },
  { id: 'kimi', name: 'Kimi', role: '月光下讲古老神话的人' },
  { id: 'qwen', name: '千问', role: '摇扇送来晚风' },
  { id: 'zai', name: '狐狸', role: '数满山的钱币' },
  { id: 'gemini', name: '猫', role: '追萤火虫 / 风铃旁' },
  { id: 'doubao', name: '豆包', role: '先踩拍暖场，唱摇篮曲' },
  { id: 'gpt', name: '龙娘', role: '只从银河上方掠过' },
];
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export default function App() {
  const cv = useRef<HTMLCanvasElement>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const film = useRef<Film | null>(null);
  const orbit = useRef({ yaw: 0, pitch: 0, zoom: 1 });
  const drag = useRef<{ x: number; y: number } | null>(null);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [subs, setSubs] = useState(true);
  const [tab, setTab] = useState<'lyrics' | 'shots' | 'cast'>('lyrics');
  const [recording, setRecording] = useState(false);
  const subsRef = useRef(subs);
  subsRef.current = subs;
  const recRef = useRef<MediaRecorder | null>(null);
  const audioCtx = useRef<{ ctx: AudioContext; dest: MediaStreamAudioDestinationNode } | null>(null);
  const lyricBox = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let dead = false;
    const img = new Image();
    const a = new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej; img.src = atlasUrl; });
    const f = (async () => { try { const ff = new FontFace('BG', `url(${fontUrl})`); await ff.load(); document.fonts.add(ff); } catch { /* 字体失败就用系统字体 */ } })();
    Promise.all([a, f]).then(() => {
      if (dead) return;
      film.current = createFilm({ atlas: img, makeCanvas: (w: number, h: number) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; } }) as Film;
      setReady(true);
    });
    return () => { dead = true; };
  }, []);

  const draw = useCallback((t: number) => {
    const g = cv.current?.getContext('2d');
    if (g && film.current) film.current.render(g, t, { subtitles: subsRef.current, orbit: orbit.current });
  }, []);

  // 离线渲染钩子：只重绘画面并同步音轨时钟，不启动播放。
  useEffect(() => {
    if (!ready) return;
    const w = window as Window & { __mvReady?: boolean; __mvSeek?: (t: number) => void };
    w.__mvReady = true;
    w.__mvSeek = (t: number) => {
      const T = Math.max(0, Math.min(DUR - 0.05, t));
      if (audio.current) audio.current.currentTime = T;
      draw(T);
    };
    return () => { delete w.__mvReady; delete w.__mvSeek; };
  }, [ready, draw]);

  useEffect(() => {
    if (!ready) return;
    let raf = 0, last = -1;
    const loop = () => {
      const el = audio.current;
      const t = el ? el.currentTime : 0;
      draw(t);
      if (Math.abs(t - last) > 0.05) { setTime(t); last = t; }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [ready, draw]);

  const toggle = () => { const el = audio.current; if (!el) return; if (el.paused) el.play(); else el.pause(); };
  const seek = (t: number) => { const el = audio.current; if (el) el.currentTime = Math.max(0, Math.min(DUR - 0.05, t)); };

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); toggle(); }
      if (e.code === 'ArrowRight') seek((audio.current?.currentTime ?? 0) + 5);
      if (e.code === 'ArrowLeft') seek((audio.current?.currentTime ?? 0) - 5);
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);

  const curLine = useMemo(() => LINES.findIndex((l) => time >= l.start - 0.3 && time < l.end + 0.25), [time]);
  const curShot = useMemo(() => SHOTS.findIndex((s) => time >= s.start && time < s.end), [time]);

  useEffect(() => {
    const box = lyricBox.current; if (!box) return;
    const el = box.querySelector<HTMLElement>('[data-active="1"]');
    if (el) box.scrollTo({ top: el.offsetTop - box.clientHeight / 2 + el.clientHeight / 2, behavior: 'smooth' });
  }, [curLine, curShot, tab]);

  const record = async () => {
    const el = audio.current, c = cv.current; if (!el || !c) return;
    if (recording) { recRef.current?.stop(); return; }
    if (!audioCtx.current) {
      const ctx = new AudioContext(); const src = ctx.createMediaElementSource(el); const dest = ctx.createMediaStreamDestination();
      src.connect(ctx.destination); src.connect(dest); audioCtx.current = { ctx, dest };
    }
    await audioCtx.current.ctx.resume();
    const stream = new MediaStream([...c.captureStream(30).getVideoTracks(), ...audioCtx.current.dest.stream.getAudioTracks()]);
    const mime = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find((m) => MediaRecorder.isTypeSupported(m)) || '';
    const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000 });
    const chunks: Blob[] = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      setRecording(false); el.pause();
      const url = URL.createObjectURL(new Blob(chunks, { type: 'video/webm' }));
      const a = document.createElement('a'); a.href = url; a.download = '樱花草_MV.webm'; a.click();
    };
    const onEnd = () => { if (rec.state !== 'inactive') rec.stop(); el.removeEventListener('ended', onEnd); };
    el.addEventListener('ended', onEnd);
    orbit.current = { yaw: 0, pitch: 0, zoom: 1 };
    el.currentTime = 0; recRef.current = rec; rec.start(500); setRecording(true); el.play();
  };

  const fullscreen = () => { const c = cv.current?.parentElement; if (c) (document.fullscreenElement ? document.exitFullscreen() : c.requestFullscreen()); };

  return (
    <div className="min-h-screen bg-[#120c24] text-pink-50" style={{ fontFamily: '"PingFang SC","Microsoft YaHei",system-ui,sans-serif' }}>
      <div className="mx-auto max-w-[1500px] px-4 py-5">
        <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-wide"><span className="text-pink-300">樱花草</span> <span className="text-base font-normal text-pink-200/70">· 软 3D 逐字卡点 MV</span></h1>
            <p className="mt-1 text-sm text-pink-200/60">像素纸片人 × Canvas2D 低多边形世界 · 62 句歌词逐字实测 · {SHOTS.length} 个分镜 · 拖动画面可环绕视角</p>
          </div>
          <div className="text-right text-xs text-pink-200/50">节拍 148 BPM · 4:37</div>
        </header>

        <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
          <div>
            <div className="relative overflow-hidden rounded-2xl bg-black shadow-[0_0_60px_rgba(255,120,180,0.18)] ring-1 ring-pink-300/20">
              <canvas
                ref={cv} width={W} height={H}
                className="block aspect-video w-full cursor-grab active:cursor-grabbing"
                onClick={() => { if (!drag.current) toggle(); }}
                onPointerDown={(e) => { drag.current = null; (e.target as HTMLElement).setPointerCapture(e.pointerId); (e.target as HTMLElement).dataset.sx = `${e.clientX},${e.clientY}`; }}
                onPointerMove={(e) => {
                  if (!(e.buttons & 1)) return;
                  const [sx, sy] = ((e.target as HTMLElement).dataset.sx || '0,0').split(',').map(Number);
                  if (!drag.current && Math.hypot(e.clientX - sx, e.clientY - sy) < 5) return;
                  const p = drag.current || { x: sx, y: sy };
                  orbit.current.yaw -= (e.clientX - p.x) * 0.005; orbit.current.pitch += (e.clientY - p.y) * 0.004;
                  drag.current = { x: e.clientX, y: e.clientY };
                }}
                onPointerUp={() => { setTimeout(() => { drag.current = null; }, 0); }}
                onWheel={(e) => { orbit.current.zoom = Math.max(0.5, Math.min(2.2, orbit.current.zoom * (e.deltaY > 0 ? 1.06 : 0.94))); }}
              />
              {!ready && <div className="absolute inset-0 grid place-items-center text-pink-200">正在载入角色图集与字体…</div>}
              {ready && !playing && (
                <button onClick={toggle} className="absolute left-1/2 top-1/2 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-pink-400/80 text-3xl text-white shadow-xl backdrop-blur transition hover:scale-110">▶</button>
              )}
            </div>

            {/* 时间轴：分镜色块 + 歌词刻度 */}
            <div className="mt-3 rounded-xl bg-white/5 p-3 ring-1 ring-white/10">
              <div className="relative h-9 cursor-pointer select-none" onPointerDown={(e) => {
                const r = e.currentTarget.getBoundingClientRect(); const go = (x: number) => seek(((x - r.left) / r.width) * DUR);
                go(e.clientX); const mv = (ev: PointerEvent) => go(ev.clientX); const up = () => { window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); };
                window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up);
              }}>
                <div className="absolute inset-x-0 top-0 h-4 overflow-hidden rounded">
                  {SHOTS.map((s, i) => (
                    <div key={i} title={s.name} className="absolute top-0 h-full border-r border-black/40" style={{ left: `${(s.start / DUR) * 100}%`, width: `${((s.end - s.start) / DUR) * 100}%`, background: SET_COLOR[s.set] || '#888', opacity: i === curShot ? 1 : 0.55 }} />
                  ))}
                </div>
                <div className="absolute inset-x-0 top-5 h-3">
                  {LINES.map((l, i) => (
                    <div key={i} className="absolute top-0 h-full rounded-sm" style={{ left: `${(l.start / DUR) * 100}%`, width: `${((l.end - l.start) / DUR) * 100}%`, background: i === curLine ? '#ffd1e4' : 'rgba(255,200,225,0.35)' }} />
                  ))}
                </div>
                <div className="absolute top-[-3px] h-[42px] w-0.5 bg-white shadow" style={{ left: `${(time / DUR) * 100}%` }} />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <button onClick={toggle} disabled={!ready} className="rounded-lg bg-pink-400 px-4 py-1.5 font-semibold text-[#2a0f22] hover:bg-pink-300 disabled:opacity-40">{playing ? '❚❚ 暂停' : '▶ 播放'}</button>
                <span className="tabular-nums text-pink-100/80">{fmt(time)} / {fmt(DUR)}</span>
                <span className="ml-2 truncate text-pink-200/70">镜头：{SHOTS[curShot]?.name ?? '—'}</span>
                <div className="ml-auto flex flex-wrap gap-2">
                  <button onClick={() => setSubs((s) => !s)} className="rounded-lg bg-white/10 px-3 py-1.5 hover:bg-white/20">{subs ? '字幕：开' : '字幕：关'}</button>
                  <button onClick={() => { orbit.current = { yaw: 0, pitch: 0, zoom: 1 }; }} className="rounded-lg bg-white/10 px-3 py-1.5 hover:bg-white/20">复位视角</button>
                  <button onClick={fullscreen} className="rounded-lg bg-white/10 px-3 py-1.5 hover:bg-white/20">全屏</button>
                  <button onClick={record} disabled={!ready} className={`rounded-lg px-3 py-1.5 ${recording ? 'bg-red-500 text-white' : 'bg-white/10 hover:bg-white/20'}`}>{recording ? '■ 停止录制' : '● 录制 WebM'}</button>
                </div>
              </div>
            </div>
          </div>

          <aside className="flex h-[min(78vh,760px)] flex-col rounded-2xl bg-white/5 ring-1 ring-white/10">
            <div className="flex border-b border-white/10 text-sm">
              {([['lyrics', '逐字卡点'], ['shots', '分镜表'], ['cast', '登场人物']] as const).map(([k, n]) => (
                <button key={k} onClick={() => setTab(k)} className={`flex-1 py-2.5 ${tab === k ? 'border-b-2 border-pink-300 text-pink-200' : 'text-pink-100/50 hover:text-pink-100'}`}>{n}</button>
              ))}
            </div>
            <div ref={lyricBox} className="relative flex-1 overflow-y-auto p-2">
              {tab === 'lyrics' && CUE.map((c: any, i: number) => {
                const active = i === curLine;
                return (
                  <button key={i} data-active={active ? '1' : '0'} onClick={() => seek(c.start - 0.4)} className={`mb-1 block w-full rounded-lg px-3 py-2 text-left transition ${active ? 'bg-pink-400/20 ring-1 ring-pink-300/50' : 'hover:bg-white/5'}`}>
                    <div className="mb-0.5 text-[11px] tabular-nums text-pink-200/40">{fmt(c.start)}.{String(Math.floor((c.start % 1) * 100)).padStart(2, '0')} · {c.sec}</div>
                    <div className="flex flex-wrap gap-x-2 text-lg leading-snug">
                      {c.words.map(([w, ci]: [string, number]) => {
                        const on = time >= c.t[ci];
                        return <span key={ci} className={`transition-colors ${on && active ? 'text-pink-300' : active ? 'text-white' : 'text-pink-50/70'}`} title={`${c.t[ci].toFixed(2)}s`}>{w}</span>;
                      })}
                    </div>
                  </button>
                );
              })}
              {tab === 'shots' && SHOTS.map((s, i) => (
                <button key={i} data-active={i === curShot ? '1' : '0'} onClick={() => seek(s.start + 0.01)} className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm ${i === curShot ? 'bg-pink-400/20 ring-1 ring-pink-300/50' : 'hover:bg-white/5'}`}>
                  <span className="w-7 text-right tabular-nums text-pink-200/40">{i + 1}</span>
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: SET_COLOR[s.set] }} />
                  <span className="flex-1">{s.name}<span className="ml-2 text-xs text-pink-200/40">{SET_NAME[s.set]}</span></span>
                  <span className="tabular-nums text-xs text-pink-200/50">{fmt(s.start)}</span>
                </button>
              ))}
              {tab === 'cast' && (
                <div className="space-y-2 p-2 text-sm">
                  <p className="text-pink-200/60">角色全部取自分支的像素图集（设定/人物），一人一个形象，不换画风。</p>
                  {CAST.map((c) => (
                    <div key={c.id} className="rounded-lg bg-white/5 px-3 py-2"><span className="font-semibold text-pink-200">{c.name}</span><span className="ml-2 text-xs text-pink-200/40">{c.id}</span><div className="text-pink-50/70">{c.role}</div></div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
        <audio ref={audio} src={songUrl} preload="auto" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />
        <p className="mt-4 text-center text-xs text-pink-200/30">空格 播放/暂停 · ← → 快退/快进 5 秒 · 拖动画面环绕 · 滚轮缩放</p>
      </div>
    </div>
  );
}
