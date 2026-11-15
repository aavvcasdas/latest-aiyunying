import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import bgmUrl from './assets/bgm.mp3';
import { Lyrics, DURATION, LINES } from './mv/Lyrics';
import { SHOTS, shotAt } from './mv/timeline';
import { seg, clamp } from './mv/util';

const params = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
const T0 = params.has('t') ? parseFloat(params.get('t') || '0') : null;
const CLEAN = params.has('clean');

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export default function App() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const manual = useRef<number>(T0 ?? 0);
  const pending = useRef<number | null>(T0);
  const [t, setT] = useState<number>(T0 ?? 0);
  const [src, setSrc] = useState<string>('');
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(T0 !== null);
  const [scale, setScale] = useState(1);
  const [ui, setUi] = useState(true);
  const uiTimer = useRef<number>(0);

  // BGM：内联在页面里，转成 Blob 以便随意拖动
  useEffect(() => {
    let url = '';
    fetch(bgmUrl)
      .then((r) => r.blob())
      .then((b) => {
        url = URL.createObjectURL(b);
        setSrc(url);
      })
      .catch(() => setSrc(bgmUrl));
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, []);

  useEffect(() => {
    const fit = () => setScale(Math.min(window.innerWidth / 1280, window.innerHeight / 720));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  // 时钟：画面只认音频时间。两次音频时间更新之间用系统时钟补帧，偏了就重新对齐。
  useEffect(() => {
    let raf = 0;
    const st = { base: 0, stamp: performance.now() };
    const loop = () => {
      const a = audioRef.current;
      const now = performance.now();
      let cur = manual.current;
      if (a && a.readyState >= 1) {
        cur = a.currentTime;
        if (pending.current !== null) {
          // 音频还没就绪时点过的位置，就绪后第一帧补上
          cur = pending.current;
          a.currentTime = cur;
          pending.current = null;
          st.base = cur;
          st.stamp = now;
        } else if (!a.paused && !a.seeking) {
          const est = st.base + (now - st.stamp) / 1000;
          if (Math.abs(est - cur) < 0.1) cur = est;
          else {
            st.base = cur;
            st.stamp = now;
          }
        } else {
          st.base = cur;
          st.stamp = now;
        }
        manual.current = cur;
      }
      setT((p) => (Math.abs(p - cur) > 0.0005 ? cur : p));
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const seekTo = useCallback((x: number) => {
    const v = clamp(x, 0, DURATION - 0.05);
    manual.current = v;
    const a = audioRef.current;
    if (a && a.readyState >= 1) a.currentTime = v;
    else pending.current = v;
    setT(v);
  }, []);

  // 离线出片用：把 seekTo 挂到 window 上，tools/shoot_vite_mv.mjs 按帧调用（页面本身的行为不变）
  useEffect(() => {
    (window as unknown as { __seek?: (t: number) => void }).__seek = (x: number) => { setStarted(true); seekTo(x); };
    return () => { delete (window as unknown as { __seek?: unknown }).__seek; };
  }, [seekTo]);

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    setStarted(true);
    if (a.paused) {
      if (a.ended || a.currentTime >= DURATION - 0.1) a.currentTime = 0;
      a.play().catch(() => {});
    } else a.pause();
  }, []);

  const poke = useCallback(() => {
    setUi(true);
    window.clearTimeout(uiTimer.current);
    uiTimer.current = window.setTimeout(() => setUi(false), 2600);
  }, []);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        toggle();
      } else if (e.code === 'ArrowRight') seekTo(manual.current + 5);
      else if (e.code === 'ArrowLeft') seekTo(manual.current - 5);
      poke();
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [toggle, seekTo, poke]);

  const shot = shotAt(t);
  const Scene = shot.C;
  const flash = shot.flash ? (1 - seg(t, shot.at, shot.at + 0.24)) * 0.9 : 0;
  const black = Math.max(1 - seg(t, 0, 0.7), seg(t, DURATION - 3.2, DURATION - 0.4));
  const marks = useMemo(() => LINES.filter((l) => l.kind === 'hero').map((l) => l.start / DURATION), []);
  const showUi = !CLEAN && started && (ui || !playing);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0d0b10]" onMouseMove={poke} onTouchStart={poke}>
      <audio
        ref={audioRef}
        src={src || undefined}
        preload="auto"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
      {/* 1280×720 的舞台，整体缩放到窗口 */}
      <div
        className="stage absolute left-1/2 top-1/2 overflow-hidden bg-black"
        style={{ width: 1280, height: 720, marginLeft: -640, marginTop: -360, transform: `scale(${scale})`, perspective: 1100, perspectiveOrigin: '50% 50%', cursor: showUi || !started ? 'default' : 'none' }}
        onClick={() => started && toggle()}
      >
        <Scene key={shot.id} t={t} lt={t - shot.at} d={shot.end - shot.at} v={shot.v} L={shot.v === 2 ? 16 : 0} />
        <Lyrics t={t} />
        <div className="grain pointer-events-none absolute inset-0" />
        <div className="vignette pointer-events-none absolute inset-0" />
        {flash > 0.01 && <div className="pointer-events-none absolute inset-0" style={{ background: shot.flash, opacity: flash }} />}
        {black > 0.01 && <div className="pointer-events-none absolute inset-0 bg-black" style={{ opacity: black }} />}
      </div>

      {/* 开场卡片 */}
      {!started && !CLEAN && (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'radial-gradient(ellipse at center,#c79a62,#8a6034)' }}>
          <div className="grain pointer-events-none absolute inset-0" />
          <div className="relative mx-4 max-w-xl rotate-[-1.5deg] bg-[#3a6cc0] p-3 shadow-[8px_10px_0_rgba(0,0,0,.3)]">
            <div className="border-4 border-dashed border-white/90 px-8 py-9 text-center">
              <div className="inline-block rotate-[-2deg] bg-[#f6d54a] px-6 py-2 text-6xl text-[#222] shadow-[5px_6px_0_rgba(0,0,0,.3)]">我好想你</div>
              <div className="mt-5 inline-block rotate-[1.5deg] bg-[#23232b] px-4 py-1.5 text-xl text-white">苏打绿 Sodagreen · 鲸鱼娘 番外</div>
              <p className="mt-6 text-lg leading-relaxed text-white/95">
                主角 <span className="bg-white px-1.5 text-[#3a6cc0]">鲸鱼娘</span> ，被想念的人 <span className="bg-[#f59a3d] px-1.5 text-white">小克</span>
                <br />
                剪纸定格 · 立体字幕 · 逐字卡点
              </p>
              <button
                onClick={toggle}
                disabled={!src}
                className="mt-7 cursor-pointer bg-[#ef6461] px-10 py-3 text-3xl text-white shadow-[5px_6px_0_rgba(0,0,0,.35)] transition-transform hover:-translate-y-0.5 hover:rotate-[-2deg] active:translate-y-0.5 disabled:opacity-60"
              >
                {src ? '点击播放' : '加载中…'}
              </button>
              <p className="mt-4 text-base text-white/80">请戴耳机 · 全屏观看</p>
            </div>
          </div>
        </div>
      )}

      {/* 控制条 */}
      <div
        className="absolute inset-x-0 bottom-0 flex items-center gap-3 px-4 pb-3 pt-10 text-white transition-opacity duration-300"
        style={{ opacity: showUi ? 1 : 0, pointerEvents: showUi ? 'auto' : 'none', background: 'linear-gradient(transparent, rgba(0,0,0,.7))' }}
      >
        <button onClick={toggle} className="w-16 shrink-0 cursor-pointer rotate-[-2deg] bg-[#f6d54a] px-2 py-1 text-lg text-[#222] shadow-[3px_3px_0_rgba(0,0,0,.4)]">
          {playing ? '暂停' : '播放'}
        </button>
        <span className="w-24 shrink-0 text-center text-sm tabular-nums" style={{ fontFamily: 'ui-monospace, monospace' }}>
          {fmt(t)} / {fmt(DURATION)}
        </span>
        <div className="relative flex h-6 flex-1 items-center">
          <input className="seek w-full cursor-pointer" type="range" min={0} max={DURATION} step={0.05} value={t} onChange={(e) => seekTo(parseFloat(e.target.value))} style={{ background: `linear-gradient(90deg,#f6d54a ${(t / DURATION) * 100}%, rgba(255,255,255,.25) ${(t / DURATION) * 100}%)` }} />
          {marks.map((m, i) => (
            <span key={i} className="pointer-events-none absolute top-0 h-1.5 w-1.5 rounded-full bg-[#ef6461]" style={{ left: `${m * 100}%` }} />
          ))}
        </div>
        <span className="hidden w-44 shrink-0 truncate text-sm text-white/80 md:block">{shot.name}</span>
        <button onClick={() => seekTo(0)} className="shrink-0 cursor-pointer bg-white/15 px-2 py-1 text-sm hover:bg-white/25">从头</button>
        <button
          onClick={() => {
            if (document.fullscreenElement) document.exitFullscreen();
            else document.documentElement.requestFullscreen?.().catch(() => {});
          }}
          className="shrink-0 cursor-pointer bg-white/15 px-2 py-1 text-sm hover:bg-white/25"
        >
          全屏
        </button>
      </div>
      {!CLEAN && SHOTS.length === 0 && null}
    </div>
  );
}
