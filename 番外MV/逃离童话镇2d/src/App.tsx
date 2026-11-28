import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import songUrl from './assets/song.mp3';
import { SHOTS, loadAtlas, FONT, rnd, clamp, seg, beatPulse, type Frame, type Hud, type Shot } from './mv/engine';
import { LINES, END, FADE_A } from './mv/lyrics';
import { registerAll } from './mv/all';

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export default function App() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const subRef = useRef<HTMLDivElement>(null);
  const sub2Ref = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const fadeRef = useRef<HTMLDivElement>(null);
  const barTRef = useRef<HTMLDivElement>(null);
  const barBRef = useRef<HTMLDivElement>(null);
  const seekRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const tRef = useRef(0);
  const [ready, setReady] = useState(false);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [ui, setUi] = useState(true);
  const [err, setErr] = useState('');
  const uiTimer = useRef(0);

  useEffect(() => {
    let raf = 0, dead = false;
    const canvas = canvasRef.current!, wrap = wrapRef.current!, audio = audioRef.current!;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
    } catch (e) { setErr('当前浏览器无法启用 WebGL，无法播放三维 MV。'); return; }
    renderer.setClearColor(0x000000);
    const cam = new THREE.PerspectiveCamera(35, 16 / 9, 0.1, 400);
    const resize = () => {
      const w = wrap.clientWidth, h = wrap.clientHeight;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(w, h, false);
      wrap.style.setProperty('--u', `${h / 100}px`);
    };
    const ro = new ResizeObserver(resize); ro.observe(wrap); resize();

    const hud: Hud = { flash: 0, flashCol: '#fff', fade: 0, bars: 1, shake: 0, tint: '', glitch: 0 };
    let curLine = -2, curOn = -1, lastShot: Shot | null = null;
    const tmp = new THREE.Vector3();

    const renderAt = (t: number) => {
      tRef.current = t;
      let sh: Shot | null = null;
      for (let i = SHOTS.length - 1; i >= 0; i--) if (t >= SHOTS[i].a) { sh = SHOTS[i]; break; }
      if (!sh) sh = SHOTS[0];
      if (!sh.scene) { sh.scene = new THREE.Scene(); sh.obj = sh.build(sh.scene); }
      hud.flash = 0; hud.flashCol = '#fff'; hud.fade = 0; hud.bars = 1; hud.shake = 0; hud.tint = ''; hud.glitch = 0;
      const f: Frame = {
        t, lt: t - sh.a, p: clamp((t - sh.a) / (sh.b - sh.a)), dur: sh.b - sh.a, cam, hud, bp: beatPulse(t),
        look: (px, py, pz, tx, ty, tz, fov = 35, roll = 0) => {
          const s = hud.shake;
          cam.position.set(px + (rnd(Math.floor(t * 60)) - 0.5) * s, py + (rnd(Math.floor(t * 60) + 9) - 0.5) * s, pz);
          cam.up.set(Math.sin(roll), Math.cos(roll), 0);
          cam.lookAt(tmp.set(tx, ty, tz));
          if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
        },
      };
      sh.draw(sh.obj, f);
      renderer.render(sh.scene!, cam);
      if (sh !== lastShot) { lastShot = sh; (window as any).__shot = sh.id; }
      // ── HUD
      const endFade = seg(t, END - 3.2, END - 0.4);
      flashRef.current!.style.opacity = String(clamp(hud.flash));
      flashRef.current!.style.background = hud.flashCol;
      fadeRef.current!.style.opacity = String(clamp(Math.max(hud.fade, endFade)));
      const bh = 9 * hud.bars;
      barTRef.current!.style.height = `${bh}%`; barBRef.current!.style.height = `${bh}%`;
      canvas.style.filter = hud.tint || '';
      // ── 字幕
      let li = -1;
      for (let i = 0; i < LINES.length; i++) if (t >= LINES[i].a && t < LINES[i].b) { li = i; break; }
      const sub = subRef.current!, sub2 = sub2Ref.current!;
      if (li !== curLine) {
        curLine = li; curOn = -1;
        if (li < 0) { sub.innerHTML = ''; sub2.textContent = ''; }
        else {
          const L = LINES[li];
          sub.className = 'mv-sub ' + (L.style === 'en' ? 'mv-sub-en' : 'mv-sub-zh');
          sub.innerHTML = L.w.map(w => `<span>${w[1].replace(/</g, '&lt;')}</span>`).join(L.style === 'en' ? ' ' : '');
          sub2.textContent = L.en ?? '';
        }
      }
      if (li >= 0) {
        const L = LINES[li]; let n = 0;
        for (const w of L.w) if (t >= w[0] - 0.03) n++;
        if (n !== curOn) {
          curOn = n;
          const sp = sub.children;
          for (let i = 0; i < sp.length; i++) sp[i].className = i < n - 1 ? 'on' : i === n - 1 ? 'on now' : '';
        }
      }
      if (seekRef.current) seekRef.current.style.width = `${(t / END) * 100}%`;
      if (timeRef.current) timeRef.current.textContent = `${fmt(t)} / ${fmt(END)}`;
    };

    // 平滑时钟：以音频为准，帧间用高精度计时补足，偏差过大时立即对齐
    let clock = 0, last = performance.now();
    const loop = () => {
      if (dead) return;
      const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now;
      const at = audio.currentTime;
      if (audio.paused || audio.seeking) clock = at;
      else { clock += dt; const d = at - clock; clock = Math.abs(d) > 0.09 ? at : clock + d * 0.08; }
      let t = Math.max(0, clock);
      if (at >= END || t >= END) { audio.pause(); t = END; setEnded(true); setPlaying(false); }
      audio.volume = clamp(1 - seg(t, FADE_A, END - 0.6));
      renderAt(t);
      raf = requestAnimationFrame(loop);
    };

    (async () => {
      try {
        const sample = '逃离童话镇乖巧猎枪STOP';
        await Promise.all([
          loadAtlas(),
          ...Object.values(FONT).map(f => (document as any).fonts.load(`64px ${f.split(',')[0]}`, sample).catch(() => 0)),
        ]);
        if (dead) return;
        try { // 内联音频转成 Blob 地址，保证各浏览器都能拖动进度
          const blob = await (await fetch(songUrl)).blob();
          audio.src = URL.createObjectURL(blob);
        } catch { audio.src = songUrl; }
        registerAll();
        SHOTS.sort((a, b) => a.a - b.a);
        // 预先搭好所有布景，切镜头时不卡顿
        for (const s of SHOTS) { s.scene = new THREE.Scene(); s.obj = s.build(s.scene); }
        const params = new URLSearchParams(location.search);
        const q = params.get('t');
        // 出片模式：不跑自己的播放循环，只等外部逐帧 seek（否则 rAF 会把 seek 的帧覆盖掉）
        const still = params.has('capture');
        (window as any).__mv = { seek: (t: number) => renderAt(t), shots: SHOTS.map(s => [s.id, s.a, s.b]) };
        (window as any).__captureStage = () => wrapRef.current;
        if (q !== null || still) { renderAt(q !== null ? parseFloat(q) : 0); setReady(true); setStarted(true); setPlaying(false); return; }
        renderAt(0);
        setReady(true);
        raf = requestAnimationFrame(loop);
      } catch (e: any) { console.error(e); setErr('加载失败：' + (e?.message ?? e)); }
    })();
    return () => { dead = true; cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose(); };
  }, []);

  const poke = useCallback(() => {
    setUi(true); window.clearTimeout(uiTimer.current);
    uiTimer.current = window.setTimeout(() => setUi(false), 2200);
  }, []);
  const toggle = useCallback(() => {
    const a = audioRef.current!; if (!ready) return;
    if (a.paused) {
      if (a.currentTime >= END - 0.05) { a.currentTime = 0; setEnded(false); }
      a.play().then(() => { setStarted(true); setPlaying(true); }).catch(() => setErr('音频无法播放，请再点一次。'));
    } else { a.pause(); setPlaying(false); }
    poke();
  }, [ready, poke]);
  const replay = useCallback(() => {
    const a = audioRef.current!; a.currentTime = 0; setEnded(false);
    a.play().then(() => { setStarted(true); setPlaying(true); }).catch(() => 0);
  }, []);
  const seekTo = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const a = audioRef.current!; a.currentTime = clamp((e.clientX - r.left) / r.width) * (END - 0.1); setEnded(false);
    e.stopPropagation(); poke();
  }, [poke]);
  const full = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen?.().catch(() => 0);
  }, []);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const a = audioRef.current!;
      if (e.code === 'Space') { e.preventDefault(); toggle(); }
      if (e.code === 'ArrowRight') { a.currentTime = Math.min(END - 0.2, a.currentTime + 5); poke(); }
      if (e.code === 'ArrowLeft') { a.currentTime = Math.max(0, a.currentTime - 5); setEnded(false); poke(); }
    };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [toggle, poke]);

  // 出片模式（?capture 或 --query capture）：只留舞台本身，不显示封面 / 控制条 / 结束卡
  const capture = typeof location !== 'undefined' && new URLSearchParams(location.search).has('capture');
  const showUi = (ui || !playing) && !capture;
  return (
    <div className="mv-root" onMouseMove={poke}>
      <audio ref={audioRef} preload="auto" />
      <div ref={wrapRef} className="mv-stage" onClick={toggle} style={{ cursor: showUi ? 'pointer' : 'none' }} data-capture={capture ? '1' : undefined}>
        <canvas ref={canvasRef} className="mv-canvas" />
        <div className="mv-vignette" />
        <div className="mv-grain" />
        <div ref={flashRef} className="mv-flash" />
        <div ref={barTRef} className="mv-bar mv-bar-t" />
        <div ref={barBRef} className="mv-bar mv-bar-b" />
        <div className="mv-subwrap">
          <div ref={subRef} className="mv-sub" />
          <div ref={sub2Ref} className="mv-sub2" />
        </div>
        <div ref={fadeRef} className="mv-fade" />

        {started && !ended && (
          <div className={`mv-ctrl ${showUi ? 'show' : ''}`} onClick={e => e.stopPropagation()}>
            <button className="mv-btn" onClick={toggle} aria-label={playing ? '暂停' : '播放'}>
              {playing
                ? <svg viewBox="0 0 24 24" width="18" height="18"><rect x="5" y="4" width="5" height="16" fill="currentColor" /><rect x="14" y="4" width="5" height="16" fill="currentColor" /></svg>
                : <svg viewBox="0 0 24 24" width="18" height="18"><path d="M6 4l14 8-14 8z" fill="currentColor" /></svg>}
            </button>
            <div className="mv-seek" onClick={seekTo}><div ref={seekRef} className="mv-seek-fill" /></div>
            <span ref={timeRef} className="mv-time">0:00</span>
            <button className="mv-btn" onClick={full} aria-label="全屏">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
            </button>
          </div>
        )}

        {!started && !capture && (
          <div className="mv-cover">
            <div className="mv-cover-in">
              <div className="mv-cover-kicker">立 体 童 话 书 · 三 维 音 乐 影 像</div>
              <h1 className="mv-cover-title">逃离童话镇</h1>
              <div className="mv-cover-line">Stop！我不喜欢这个故事。</div>
              <button className="mv-play" disabled={!ready} onClick={e => { e.stopPropagation(); toggle(); }}>
                {err ? '出错了' : ready ? '拉开帷幕' : '布景搭建中…'}
              </button>
              <div className="mv-cover-tip">{err || '建议佩戴耳机 · 空格键暂停 · 左右方向键快进快退'}</div>
            </div>
          </div>
        )}
        {ended && !capture && (
          <div className="mv-cover mv-cover-end">
            <div className="mv-cover-in">
              <div className="mv-cover-kicker">这 一 次 · 结 局 由 她 落 笔</div>
              <h1 className="mv-cover-title">逃离童话镇</h1>
              <button className="mv-play" onClick={e => { e.stopPropagation(); replay(); }}>再看一遍</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
