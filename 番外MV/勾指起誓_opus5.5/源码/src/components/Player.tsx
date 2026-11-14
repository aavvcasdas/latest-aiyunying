import { useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import songUrl from '../assets/song.mp3';
import { loadAtlas, W, H } from '../mv/gfx';
import { renderFrame } from '../mv/render';
import { DURATION, SHOTS, bt, shotAt, toBeat } from '../mv/timeline';

export interface PlayerApi { seek: (t: number, play?: boolean) => void; toggle: () => void }

const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;

const Icon = ({ d, size = 22 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d={d} /></svg>
);
const PLAY = 'M8 5v14l11-7z';
const PAUSE = 'M6 5h4v14H6zM14 5h4v14h-4z';
const FULL = 'M5 5h5v2H7v3H5zM14 5h5v5h-2V7h-3zM5 14h2v3h3v2H5zM17 14h2v5h-5v-2h3z';
const VOL = 'M4 9v6h4l5 4V5L8 9zM16 8.5a5 5 0 010 7M16 8.5v7';
const MUTE = 'M4 9v6h4l5 4V5L8 9zM16 9l5 6M21 9l-5 6';

export default function Player({ apiRef, onTime, ready: onReady }: { apiRef: Ref<PlayerApi>; onTime: (t: number) => void; ready: (ok: boolean) => void }) {
  const cvs = useRef<HTMLCanvasElement>(null);
  const aud = useRef<HTMLAudioElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [muted, setMuted] = useState(false);
  const [err, setErr] = useState('');
  const poster = bt(3.6);

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        await Promise.all([document.fonts.load('44px "ZCOOL KuaiLe"'), loadAtlas()]);
        if (dead) return; setReady(true); onReady(true);
      } catch (e) { setErr(String((e as Error).message ?? e)); }
    })();
    return () => { dead = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready) return;
    const ctx = cvs.current!.getContext('2d')!; let raf = 0; let n = 0;
    const loop = () => {
      const a = aud.current!; const t = started ? a.currentTime : ((window as unknown as { __mvTime?: number }).__mvTime ?? poster);
      try { renderFrame(ctx, t); } catch (e) { setErr(String((e as Error).message ?? e)); return; }
      if (n++ % 4 === 0) { setTime(t); onTime(t); }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, started]);

  // 出片用：离屏画布按同一套 renderFrame 画一帧（原生 1280×720），tools/shoot_opus_mv.mjs 走这条路
  useEffect(() => {
    if (!ready) return;
    const off = document.createElement('canvas'); off.width = W; off.height = H;
    const octx = off.getContext('2d')!;
    (window as unknown as { __mvRender: (t: number) => string }).__mvRender = (t: number) => {
      renderFrame(octx, Math.max(0, Math.min(DURATION - 0.001, t)));
      return off.toDataURL('image/jpeg', 0.95);
    };
  }, [ready]);

  const api: PlayerApi = {
    seek: (t, play = true) => {
      const a = aud.current!; a.currentTime = Math.max(0, Math.min(DURATION - 0.05, t)); setStarted(true);
      if (play) void a.play();
    },
    toggle: () => { const a = aud.current!; setStarted(true); if (a.paused) { if (a.ended) a.currentTime = 0; void a.play(); } else a.pause(); },
  };
  useImperativeHandle(apiRef, () => api);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.code === 'Space') { e.preventDefault(); api.toggle(); }
      if (e.code === 'ArrowRight') api.seek(aud.current!.currentTime + 5, !aud.current!.paused);
      if (e.code === 'ArrowLeft') api.seek(aud.current!.currentTime - 5, !aud.current!.paused);
      if (e.code === 'KeyF') void wrap.current?.requestFullscreen?.();
    };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  });

  const cur = SHOTS[shotAt(Math.max(0, toBeat(started ? time : poster)))];
  return (
    <div ref={wrap} className="group relative w-full overflow-hidden rounded-2xl bg-black shadow-2xl shadow-fuchsia-900/40 ring-1 ring-white/10">
      <div className="relative aspect-video w-full">
        <canvas ref={cvs} width={W} height={H} className="absolute inset-0 h-full w-full cursor-pointer" onClick={() => started && api.toggle()} />
        {!ready && !err && <div className="absolute inset-0 grid place-items-center text-white/70">正在装订立体书…</div>}
        {err && <div className="absolute inset-0 grid place-items-center bg-black/80 p-6 text-center text-rose-300">{err}</div>}
        {ready && !started && (
          <button onClick={() => api.seek(0)} className="absolute inset-0 grid place-items-center bg-gradient-to-t from-black/60 via-black/10 to-transparent">
            <span className="flex items-center gap-3 rounded-full bg-gradient-to-r from-amber-300 to-pink-400 px-9 py-4 text-xl font-bold text-[#3a0f22] shadow-xl shadow-pink-500/40 transition hover:scale-105">
              <Icon d={PLAY} size={28} /> 开始播放
            </span>
          </button>
        )}
      </div>
      <div className="flex items-center gap-3 bg-[#140a2a] px-4 py-3 text-white">
        <button onClick={api.toggle} className="grid h-10 w-10 place-items-center rounded-full bg-white/10 hover:bg-white/20" aria-label={playing ? '暂停' : '播放'}>
          <Icon d={playing ? PAUSE : PLAY} />
        </button>
        <span className="w-24 shrink-0 text-sm tabular-nums text-white/70">{fmt(started ? time : 0)} / {fmt(DURATION)}</span>
        <input type="range" min={0} max={DURATION} step={0.01} value={started ? time : 0} onChange={(e) => api.seek(Number(e.target.value), !aud.current!.paused)}
          className="h-1.5 flex-1 cursor-pointer accent-pink-400" aria-label="进度" />
        <span className="hidden w-28 shrink-0 truncate text-right text-sm text-amber-200 sm:block">{started ? `${cur.id} · ${cur.title.split('：')[0]}` : ''}</span>
        <button onClick={() => { const a = aud.current!; a.muted = !a.muted; setMuted(a.muted); }} className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/10" aria-label="静音">
          <Icon d={muted ? MUTE : VOL} />
        </button>
        <button onClick={() => void wrap.current?.requestFullscreen?.()} className="grid h-10 w-10 place-items-center rounded-full hover:bg-white/10" aria-label="全屏"><Icon d={FULL} /></button>
      </div>
      <audio ref={aud} src={songUrl} preload="auto" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} />
    </div>
  );
}
