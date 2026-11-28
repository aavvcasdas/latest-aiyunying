import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import songUrl from './assets/song.mp3';
import {
  FONT, Kit, LOOKS, SHOTS, beatInfo, beatPulse, clamp, getAtlas, loadAtlas, makeSky, makeStars,
  rgb, rnd, seg, timeU, type CamState, type Frame, type Hud, type LookName, type ShotDef,
} from './mv/engine';
import { LINES, END, FADE_A } from './mv/lyrics';
import { CUES, PAGE_TURNS } from './mv/cues';
import { AudioEngine } from './mv/audio';
import { wavBlob } from './mv/sfx';
import { registerAll } from './mv/all';

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
const hashId = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
const params = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
/** 出片模式（?capture）：只留舞台本身，不显示封面 / 控制条 / 结束卡，不跑自己的播放循环 */
const CAPTURE = params.has('capture');

export default function App() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const subRef = useRef<HTMLDivElement>(null);
  const sub2Ref = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const fadeRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const barTRef = useRef<HTMLDivElement>(null);
  const barBRef = useRef<HTMLDivElement>(null);
  const seekRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const engRef = useRef<AudioEngine | null>(null);
  if (!engRef.current) engRef.current = new AudioEngine(songUrl, CUES, END);
  const [ready, setReady] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [status, setStatus] = useState('布景搭建中…');
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [sfxOn, setSfxOn] = useState(true);
  const [ui, setUi] = useState(true);
  const [err, setErr] = useState('');
  const [mixing, setMixing] = useState(false);
  const uiTimer = useRef(0);

  useEffect(() => {
    let raf = 0, dead = false;
    const canvas = canvasRef.current!, wrap = wrapRef.current!, eng = engRef.current!;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
    } catch { setErr('当前浏览器无法启用 WebGL，无法播放三维 MV。'); return; }
    renderer.setClearColor(0x000000);
    // 绘制顺序只由「这一帧的场景」决定（同《童话镇》引擎），任意跳帧画面一致
    renderer.setOpaqueSort((a, b) => a.groupOrder - b.groupOrder || a.renderOrder - b.renderOrder || a.z - b.z);
    renderer.setTransparentSort((a, b) => a.groupOrder - b.groupOrder || a.renderOrder - b.renderOrder || b.z - a.z);

    const scene = new THREE.Scene();
    const sky = makeSky(), stars = makeStars();
    const sun = new THREE.DirectionalLight(0xffffff, 2.5);
    const hemi = new THREE.HemisphereLight(0xffffff, 0x888888, 1.5);
    const fog = new THREE.Fog(0xffffff, 10, 100);
    scene.fog = fog;
    scene.add(sky, stars, sun, sun.target, hemi);
    const cam = new THREE.PerspectiveCamera(38, 16 / 9, 0.1, 1500);
    const cardTint = new THREE.Vector3(1, 1, 1);
    const applyLook = (name: LookName) => {
      const L = LOOKS[name], u = (sky.material as THREE.ShaderMaterial).uniforms;
      (u.top.value as THREE.Vector3).copy(rgb(L.top)); (u.hor.value as THREE.Vector3).copy(rgb(L.hor)); (u.low.value as THREE.Vector3).copy(rgb(L.hor)).multiplyScalar(0.8);
      fog.color.setHex(L.hor); fog.near = L.fog[0]; fog.far = L.fog[1];
      sun.color.setHex(L.sun); sun.intensity = L.sunI; sun.position.set(L.dir[0], L.dir[1], L.dir[2]).multiplyScalar(60);
      hemi.color.setHex(L.amb); hemi.groundColor.setHex(L.amb).multiplyScalar(0.5); hemi.intensity = L.ambI;
      cardTint.copy(rgb(L.card)); stars.visible = L.stars > 0; (stars.material as THREE.PointsMaterial).color.setScalar(L.stars);
    };
    const resize = () => {
      const w = wrap.clientWidth, h = wrap.clientHeight;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(w, h, false);
      wrap.style.setProperty('--u', `${h / 100}px`);
    };
    const ro = new ResizeObserver(resize); ro.observe(wrap); resize();

    const hud: Hud = { flash: 0, flashCol: '#fff', fade: 0, bars: 1, shake: 0, tint: '' };
    const pool = new Map<string, unknown>();
    const built = new Map<string, { kit: Kit; update: (f: Frame) => CamState }>();
    let curLine = -2, curOn = -1, activeId: string | null = null;
    const build = (s: ShotDef) => {
      let rt = built.get(s.id);
      if (!rt) { const kit = new Kit(getAtlas(), hashId(s.id), pool); rt = { kit, update: s.build(kit) }; built.set(s.id, rt); }
      return rt;
    };

    const renderAt = (t: number) => {
      let sh: ShotDef = SHOTS[0];
      for (let i = SHOTS.length - 1; i >= 0; i--) if (t >= SHOTS[i].a) { sh = SHOTS[i]; break; }
      const rt = build(sh);
      if (activeId !== sh.id) {
        if (activeId) scene.remove(built.get(activeId)!.kit.root);
        scene.add(rt.kit.root); activeId = sh.id; applyLook(sh.look); (window as any).__shot = sh.id;
      }
      hud.flash = 0; hud.flashCol = '#fff'; hud.fade = 0; hud.bars = 1; hud.shake = 0; hud.tint = '';
      const dur = sh.b - sh.a, u = clamp((t - sh.a) / dur), bt = beatInfo(t);
      timeU.value = t;
      for (const a of rt.kit.actors) a.begin();
      const cs = rt.update({ t, T: t, lt: t - sh.a, p: u, u, dur, bp: beatPulse(t), bt, hud });
      const s = hud.shake;
      cam.position.set(cs.p[0] + (rnd(Math.floor(t * 60)) - 0.5) * s, cs.p[1] + (rnd(Math.floor(t * 60) + 9) - 0.5) * s, cs.p[2]);
      cam.up.set(0, 1, 0); cam.lookAt(cs.l[0], cs.l[1], cs.l[2]); if (cs.roll) cam.rotateZ(cs.roll);
      cam.fov = cs.fov - (bt.down ? 0.45 : 0.15) * bt.pulse; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
      sky.position.copy(cam.position); stars.position.copy(cam.position);
      for (const a of rt.kit.actors) a.commit(cam, cardTint);
      for (const th of rt.kit.things) th.face(cam, cardTint);
      renderer.render(scene, cam);

      // ── 叠层：闪白 / 黑场 / 遮幅 / 翻页转场
      flashRef.current!.style.opacity = String(clamp(hud.flash)); flashRef.current!.style.background = hud.flashCol;
      fadeRef.current!.style.opacity = String(clamp(Math.max(hud.fade, seg(t, END - 3.2, END - 0.4))));
      barTRef.current!.style.height = barBRef.current!.style.height = `${9 * hud.bars}%`;
      canvas.style.filter = hud.tint || '';
      let page = -1;
      for (const tc of PAGE_TURNS) if (Math.abs(t - tc) < 0.3) page = (t - tc + 0.3) / 0.6;
      const pg = pageRef.current!;
      if (page < 0) pg.style.display = 'none';
      else { pg.style.display = 'block'; pg.style.transform = `translateX(${(0.5 - page) * 260}%) skewX(-14deg)`; }

      // ── 字幕（逐词点亮）
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
        if (n !== curOn) { curOn = n; const sp = sub.children; for (let i = 0; i < sp.length; i++) sp[i].className = i < n - 1 ? 'on' : i === n - 1 ? 'on now' : ''; }
      }
      if (seekRef.current) seekRef.current.style.width = `${(t / END) * 100}%`;
      if (timeRef.current) timeRef.current.textContent = `${fmt(t)} / ${fmt(END)}`;
    };

    const loop = () => {
      if (dead) return;
      let t = eng.time();
      if (t >= END) { eng.pause(); eng.seek(END); t = END; setEnded(true); setPlaying(false); }
      eng.setVolume(clamp(1 - seg(t, FADE_A, END - 0.6)));
      renderAt(t);
      raf = requestAnimationFrame(loop);
    };

    (async () => {
      try {
        const sample = '逃离童话镇乖巧猎枪STOP';
        await Promise.all([loadAtlas(), ...Object.values(FONT).map(f => (document as any).fonts.load(`64px ${f.split(',')[0]}`, sample).catch(() => 0))]);
        if (dead) return;
        registerAll();
        SHOTS.sort((a, b) => a.a - b.a);
        for (const s of SHOTS) build(s); // 预先搭好所有布景，切镜头零卡顿
        const mix = async (withSfx = true) => URL.createObjectURL(await eng.mixdown(END, FADE_A, withSfx));
        (window as any).__mv = { seek: (t: number) => renderAt(t), shots: SHOTS.map(s => [s.id, s.a, s.b]), cues: CUES, duration: END, mixdown: mix,
          sfxOnly: async () => { await eng.load(); return URL.createObjectURL(wavBlob(eng.sfx!)); } };
        (window as any).__captureStage = () => wrapRef.current;
        const q = params.get('t');
        if (q !== null || CAPTURE) { renderAt(q !== null ? parseFloat(q) : 0); setReady(true); setStarted(true); return; }
        renderAt(0);
        setReady(true);
        setStatus('合成音效中…');
        await eng.load(s => setStatus(s === 'song' ? '解码音乐中…' : s === 'sfx' ? '合成音效中…' : '准备就绪'));
        if (dead) return;
        setAudioReady(true);
        raf = requestAnimationFrame(loop);
      } catch (e: any) { console.error(e); setErr('加载失败：' + (e?.message ?? e)); }
    })();
    return () => { dead = true; cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose(); eng.pause(); };
  }, []);

  const poke = useCallback(() => {
    setUi(true); window.clearTimeout(uiTimer.current);
    uiTimer.current = window.setTimeout(() => setUi(false), 2200);
  }, []);
  const toggle = useCallback(() => {
    const e = engRef.current!; if (!ready || !audioReady) return;
    if (!e.playing) {
      let from = e.time(); if (from >= END - 0.05) { from = 0; setEnded(false); }
      e.play(from).then(() => { setStarted(true); setPlaying(true); }).catch(() => setErr('音频无法播放，请再点一次。'));
    } else { e.pause(); setPlaying(false); }
    poke();
  }, [ready, audioReady, poke]);
  const replay = useCallback(() => {
    const e = engRef.current!; setEnded(false);
    e.play(0).then(() => { setStarted(true); setPlaying(true); }).catch(() => 0);
  }, []);
  const seekTo = useCallback((ev: React.MouseEvent<HTMLDivElement>) => {
    const r = ev.currentTarget.getBoundingClientRect();
    engRef.current!.seek(clamp((ev.clientX - r.left) / r.width) * (END - 0.1)); setEnded(false);
    ev.stopPropagation(); poke();
  }, [poke]);
  const full = useCallback((ev: React.MouseEvent) => {
    ev.stopPropagation();
    if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen?.().catch(() => 0);
  }, []);
  const flipSfx = useCallback((ev: React.MouseEvent) => {
    ev.stopPropagation(); const on = !engRef.current!.sfxOn; engRef.current!.setSfx(on); setSfxOn(on); poke();
  }, [poke]);
  const download = useCallback(async (ev: React.MouseEvent) => {
    ev.stopPropagation(); if (mixing) return; setMixing(true);
    try {
      const url = URL.createObjectURL(await engRef.current!.mixdown(END, FADE_A, true));
      const a = document.createElement('a'); a.href = url; a.download = '逃离童话镇_含音效.wav'; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
    } finally { setMixing(false); }
  }, [mixing]);
  useEffect(() => {
    const k = (ev: KeyboardEvent) => {
      const e = engRef.current!;
      if (ev.code === 'Space') { ev.preventDefault(); toggle(); }
      if (ev.code === 'ArrowRight') { e.seek(Math.min(END - 0.2, e.time() + 5)); poke(); }
      if (ev.code === 'ArrowLeft') { e.seek(Math.max(0, e.time() - 5)); setEnded(false); poke(); }
      if (ev.code === 'KeyM') { const on = !e.sfxOn; e.setSfx(on); setSfxOn(on); poke(); }
    };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [toggle, poke]);

  const showUi = (ui || !playing) && !CAPTURE;
  const canPlay = ready && audioReady;
  return (
    <div className="mv-root" onMouseMove={poke}>
      <div ref={wrapRef} className="mv-stage" onClick={toggle} style={{ cursor: showUi ? 'pointer' : 'none' }} data-capture={CAPTURE ? '1' : undefined}>
        <canvas ref={canvasRef} className="mv-canvas" />
        <div className="mv-vignette" />
        <div className="mv-grain" />
        <div ref={flashRef} className="mv-flash" />
        <div ref={pageRef} className="mv-page" />
        <div ref={barTRef} className="mv-bar mv-bar-t" />
        <div ref={barBRef} className="mv-bar mv-bar-b" />
        <div className="mv-subwrap">
          <div ref={subRef} className="mv-sub" />
          <div ref={sub2Ref} className="mv-sub2" />
        </div>
        <div ref={fadeRef} className="mv-fade" />

        {started && !ended && !CAPTURE && (
          <div className={`mv-ctrl ${showUi ? 'show' : ''}`} onClick={e => e.stopPropagation()}>
            <button className="mv-btn" onClick={toggle} aria-label={playing ? '暂停' : '播放'}>
              {playing
                ? <svg viewBox="0 0 24 24" width="18" height="18"><rect x="5" y="4" width="5" height="16" fill="currentColor" /><rect x="14" y="4" width="5" height="16" fill="currentColor" /></svg>
                : <svg viewBox="0 0 24 24" width="18" height="18"><path d="M6 4l14 8-14 8z" fill="currentColor" /></svg>}
            </button>
            <div className="mv-seek" onClick={seekTo}><div ref={seekRef} className="mv-seek-fill" /></div>
            <span ref={timeRef} className="mv-time">0:00</span>
            <button className={`mv-btn mv-btn-wide ${sfxOn ? 'on' : ''}`} onClick={flipSfx} aria-label="音效开关" title="背景音效（M 键）">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor" />{sfxOn ? <path d="M16 8.5a5 5 0 010 7M18.5 6a8.5 8.5 0 010 12" /> : <path d="M16 9l5 6M21 9l-5 6" />}</svg>
              <span>音效</span>
            </button>
            <button className="mv-btn" onClick={full} aria-label="全屏">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
            </button>
          </div>
        )}

        {!started && !CAPTURE && (
          <div className="mv-cover">
            <div className="mv-cover-in">
              <div className="mv-cover-kicker">立 体 童 话 书 · 三 维 音 乐 影 像</div>
              <h1 className="mv-cover-title">逃离童话镇</h1>
              <div className="mv-cover-line">Stop！我不喜欢这个故事。</div>
              <button className="mv-play" disabled={!canPlay} onClick={e => { e.stopPropagation(); toggle(); }}>
                {err ? '出错了' : canPlay ? '拉开帷幕' : status}
              </button>
              <div className="mv-cover-tip">{err || '建议佩戴耳机 · 空格暂停 · ←→ 快退快进 · M 开关背景音效'}</div>
            </div>
          </div>
        )}
        {ended && !CAPTURE && (
          <div className="mv-cover mv-cover-end">
            <div className="mv-cover-in">
              <div className="mv-cover-kicker">这 一 次 · 结 局 由 她 落 笔</div>
              <h1 className="mv-cover-title">逃离童话镇</h1>
              <button className="mv-play" onClick={e => { e.stopPropagation(); replay(); }}>再看一遍</button>
              <button className="mv-link" onClick={download}>{mixing ? '混音导出中…' : '下载混音音轨（歌曲 + 背景音效 · WAV）'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
