import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ATLAS_IMG } from './mv/core';
import { Player } from './mv/audio';
import { CAST, Engine, SECTIONS, SHOTS, TITLE } from './mv/engine';
import { exportMp4 } from './mv/exporter';
import { DURATION, LYRICS, RECTS } from './mv/generated';
import { REP, wordsOf } from './mv/type3d';

type Phase = 'loading' | 'ready' | 'playing' | 'paused' | 'ended' | 'error';
type ExportState = 'idle' | 'rendering' | 'saving';
const COVER_TIME = 31.85;
const fmt = (t: number) => `${Math.floor(Math.max(0, t) / 60)}:${String(Math.floor(Math.max(0, t) % 60)).padStart(2, '0')}`;
const repeat = ['', '第二遍', '第三遍'];

const paths = {
  play: 'M8 5v14l11-7z',
  pause: 'M6 5h4v14H6zm8 0h4v14h-4z',
  replay: 'M12 5V1L7 6l5 5V7a6 6 0 1 1-6 6H4a8 8 0 1 0 8-8z',
  download: 'M12 3v11m-4-4 4 4 4-4M5 17v3h14v-3',
  volume: 'M4 9v6h4l5 4V5L8 9H4zm12-.5a5 5 0 0 1 0 7',
  mute: 'M4 9v6h4l5 4V5L8 9H4zm12 0 5 6m0-6-5 6',
  full: 'M4 9V4h5m6 0h5v5M4 15v5h5m6 0h5v-5',
  arrow: 'M5 12h14m-5-5 5 5-5 5',
};
function Icon({ name, size = 20 }: { name: keyof typeof paths; size?: number }) {
  const solid = name === 'play' || name === 'pause' || name === 'replay';
  return <svg width={size} height={size} viewBox="0 0 24 24" fill={solid ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={solid ? 0 : 1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]} /></svg>;
}

function Sprite({ frame }: { frame: string }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const rect = RECTS[frame];
    const cv = canvas.current;
    if (!rect || !cv || !ATLAS_IMG) return;
    cv.width = rect[2]; cv.height = rect[3];
    const context = cv.getContext('2d');
    if (!context) return;
    context.imageSmoothingEnabled = false;
    context.drawImage(ATLAS_IMG, rect[0], rect[1], rect[2], rect[3], 0, 0, rect[2], rect[3]);
  }, [frame]);
  return <canvas ref={canvas} className="cast-sprite" aria-hidden="true" />;
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerWrapRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<Engine | null>(null);
  const playerRef = useRef<Player | null>(null);
  const exportRef = useRef<AbortController | null>(null);
  const startedRef = useRef(false);
  const lyricRef = useRef(true);
  const redrawRef = useRef(true);
  const mountedRef = useRef(false);
  const downloadRef = useRef('');
  const noticeTimer = useRef<number | null>(null);

  const [phase, setPhase] = useState<Phase>('loading');
  const [load, setLoad] = useState(0);
  const [error, setError] = useState('');
  const [time, setTime] = useState(0);
  const [line, setLine] = useState(-1);
  const [shot, setShot] = useState(0);
  const [showLyrics, setShowLyrics] = useState(true);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [exportState, setExportState] = useState<ExportState>('idle');
  const [exportProgress, setExportProgress] = useState(0);
  const [notice, setNotice] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');

  const say = useCallback((message: string) => {
    setNotice(message);
    if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(''), 8000);
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const canvas = canvasRef.current!;
    let engine: Engine;
    try { engine = new Engine(canvas); }
    catch { setError('无法创建影片画面，请检查浏览器是否支持 WebGL。'); setPhase('error'); return () => { mountedRef.current = false; }; }
    const player = new Player();
    engineRef.current = engine; playerRef.current = player;
    let dead = false, raf = 0, lastTime = -1, lastDraw = -1, engineLoad = 0, audioLoad = 0;
    const progress = () => { if (!dead) setLoad(engineLoad * 0.7 + audioLoad * 0.3); };
    const fit = () => {
      if (exportRef.current) return;
      const r = canvas.getBoundingClientRect();
      if (r.width > 2 && r.height > 2) { engine.setSize(Math.round(r.width), Math.round(r.height)); redrawRef.current = true; }
    };
    Promise.all([
      engine.load((p) => { engineLoad = p; progress(); }),
      player.load((p) => { audioLoad = p; progress(); }),
    ]).then(() => {
      if (dead) return;
      fit();
      setPhase('ready');
    }).catch((e: unknown) => {
      if (dead) return;
      setError(e instanceof Error ? e.message : String(e)); setPhase('error');
    });
    player.onEnded = () => { if (!dead) { setTime(player.duration); setPhase('ended'); redrawRef.current = true; } };

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (!engine.ready || exportRef.current) return;
      const position = Math.min(player.time(), DURATION - 0.001);
      const t = startedRef.current ? position : COVER_TIME;
      if (redrawRef.current || (player.playing && now - lastDraw >= 1000 / 30)) {
        engine.render(t, !lyricRef.current);
        redrawRef.current = false; lastDraw = now;
      }
      if (Math.abs(position - lastTime) > 0.08 || (lastTime < 0 && !startedRef.current)) {
        lastTime = position; setTime(position); setLine(engine.lineAt(position)); setShot(engine.shotAt(position));
      }
    };
    raf = requestAnimationFrame(tick);
    const observer = new ResizeObserver(fit); observer.observe(canvas);
    // 出片钩子（tools/shoot_vite_mv.mjs 认 render/seek）：只读时间、只画到自己的 canvas
    (window as unknown as Record<string, unknown>).__mv = {
      engine, player, duration: DURATION, fps: 24,
      ready: () => (engine as unknown as { ready?: boolean }).ready === true,
      seek: (t: number) => engine.render(t, false),
      render: (t: number, clean = false, w = 1280, h = Math.round((w * 9) / 16)) => {
        const cv = engine.renderer.domElement;
        if (cv.width !== w || cv.height !== h) engine.setSize(w, h);
        engine.render(t, !!clean);
        return cv.toDataURL('image/jpeg', 0.94);
      },
    };
    return () => {
      dead = true; mountedRef.current = false; exportRef.current?.abort();
      cancelAnimationFrame(raf); observer.disconnect();
      engine.dispose(); player.dispose();
      if (noticeTimer.current) window.clearTimeout(noticeTimer.current);
      if (downloadRef.current) URL.revokeObjectURL(downloadRef.current);
    };
  }, []);

  const toggle = useCallback(() => {
    const player = playerRef.current;
    if (!player || exportRef.current || phase === 'loading' || phase === 'error') return;
    if (player.playing) { player.pause(); setPhase('paused'); redrawRef.current = true; return; }
    startedRef.current = true;
    redrawRef.current = true;
    setPhase('playing');
    void player.play(phase === 'ended' || player.time() >= DURATION - 0.3 ? 0 : undefined).catch(() => {
      if (mountedRef.current) { setPhase('paused'); say('播放未能启动，请检查浏览器的声音权限后重试。'); }
    });
  }, [phase, say]);

  const seek = useCallback((value: number, play = false) => {
    const player = playerRef.current;
    if (!player || exportRef.current || phase === 'loading' || phase === 'error') return;
    const t = Math.max(0, Math.min(DURATION - 0.05, value));
    const wasPlaying = player.playing;
    startedRef.current = true; player.seek(t); setTime(t); redrawRef.current = true;
    if (play && !wasPlaying) {
      setPhase('playing');
      void player.play().catch(() => { if (mountedRef.current) { setPhase('paused'); say('播放未能启动，请重试。'); } });
    } else if (!wasPlaying) setPhase('paused');
  }, [phase, say]);

  const fullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => say('无法退出全屏。'));
    else if (playerWrapRef.current?.requestFullscreen) void playerWrapRef.current.requestFullscreen().catch(() => say('当前浏览器无法进入全屏。'));
    else say('当前浏览器不支持全屏。');
  }, [say]);

  const flipLyrics = useCallback(() => {
    if (exportRef.current) return;
    setShowLyrics((v) => { lyricRef.current = !v; redrawRef.current = true; return !v; });
  }, []);
  const flipMute = useCallback(() => {
    setMuted((v) => { playerRef.current?.setMuted(!v); return !v; });
  }, []);

  const beginExport = useCallback(async () => {
    const player = playerRef.current, engine = engineRef.current;
    if (!engine || !player?.buf || exportRef.current || phase === 'loading' || phase === 'error') return;
    const snapshot = { time: player.time(), started: startedRef.current, phase, w: engine.w, h: engine.h, ratio: engine.renderer.getPixelRatio() };
    const controller = new AbortController(); exportRef.current = controller;
    player.pause(); setPhase(snapshot.started ? 'paused' : 'ready');
    setExportProgress(0); setExportState('rendering'); setNotice('');
    engine.renderer.setPixelRatio(1); engine.setSize(1280, 720);
    try {
      const blob = await exportMp4({
        engine, audio: player.buf, showLyrics: lyricRef.current, signal: controller.signal,
        onProgress: (p) => { if (mountedRef.current) { setExportProgress(p); if (p >= 0.99) setExportState('saving'); } },
      });
      if (!mountedRef.current || controller.signal.aborted) return;
      if (downloadRef.current) URL.revokeObjectURL(downloadRef.current);
      const url = URL.createObjectURL(blob); downloadRef.current = url; setDownloadUrl(url);
      const link = document.createElement('a'); link.href = url; link.download = 'Someone-Like-Me.mp4'; document.body.appendChild(link); link.click(); link.remove();
      say(`MP4 已生成（${(blob.size / 1048576).toFixed(1)} MB）。如未自动下载，可点击“再次保存”。`);
    } catch (e) {
      if (mountedRef.current) say(e instanceof DOMException && e.name === 'AbortError' ? '已取消导出。' : e instanceof Error ? e.message : '导出失败，请重试。');
    } finally {
      exportRef.current = null;
      if (!engine.disposed) {
        engine.renderer.setPixelRatio(snapshot.ratio);
        const r = canvasRef.current?.getBoundingClientRect();
        engine.setSize(r?.width ? Math.round(r.width) : snapshot.w, r?.height ? Math.round(r.height) : snapshot.h);
      }
      if (!player.disposed) player.seek(snapshot.time);
      startedRef.current = snapshot.started; redrawRef.current = true;
      if (mountedRef.current) { setExportState('idle'); setPhase(snapshot.phase === 'ended' ? 'ended' : snapshot.started ? 'paused' : 'ready'); setTime(snapshot.time); }
    }
  }, [phase, say]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (exportRef.current) { if (e.key === 'Escape') exportRef.current.abort(); return; }
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      if (e.code === 'Space' && target.tagName !== 'BUTTON') { e.preventDefault(); toggle(); }
      else if (e.code === 'ArrowRight') { e.preventDefault(); seek((playerRef.current?.time() ?? 0) + 5); }
      else if (e.code === 'ArrowLeft') { e.preventDefault(); seek((playerRef.current?.time() ?? 0) - 5); }
      else if (e.key.toLowerCase() === 'f') fullscreen();
      else if (e.key.toLowerCase() === 'l') flipLyrics();
      else if (e.key.toLowerCase() === 'm') flipMute();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle, seek, fullscreen, flipLyrics, flipMute]);

  const current = line >= 0 ? LYRICS[line] : null;
  const words = useMemo(() => current ? wordsOf(current.text) : [], [current]);
  const section = useMemo(() => SECTIONS.reduce((a, s) => time >= s.t ? s : a, SECTIONS[0]), [time]);
  const groups = useMemo(() => SECTIONS.map((s, i) => ({
    ...s,
    lines: LYRICS.map((l, k) => ({ l, k })).filter(({ l }) => l.t[0] >= s.t && l.t[0] < (SECTIONS[i + 1]?.t ?? DURATION)),
  })).filter((g) => g.lines.length), []);
  const ready = phase !== 'loading' && phase !== 'error';
  const exporting = exportState !== 'idle';
  const canPlay = ready && !exporting;

  return <div className="app-shell">
    <header className="topbar page-width">
      <a href="#top" className="brand"><span className="brand-mark"><span /></span><span>NEWDAY <i /> <b>鲸鱼娘番外</b></span></a>
      <span className="topbar-right">DEEPSEEK <i /> ORIGINAL MUSIC VIDEO</span>
    </header>

    <main id="top" className="page-width">
      <section className="hero" aria-labelledby="film-title">
        <div className="hero-heading">
          <div><p className="eyebrow"><span /> MUSIC FILM <i /> 01</p><h1 id="film-title">{TITLE}</h1><p className="hero-copy">在天才的故事之外，给每一份坚持留一个角落。</p></div>
          <div className="hero-actions"><div className="hero-caption"><span>鲸鱼娘音乐影像</span><span>02:32 <i /> 43 个镜头</span></div><button className="export-button" onClick={() => void beginExport()} disabled={!canPlay} title="在本机逐帧生成 720p MP4，包含原曲和当前字幕设置"><Icon name="download" size={17} />导出 MP4</button></div>
        </div>

        <div className="player-wrap" ref={playerWrapRef}>
          <div className="screen">
            <canvas ref={canvasRef} className="film-canvas" onClick={toggle} aria-label="譬如我影片画面" />
            {phase === 'loading' && <div className="screen-status"><span className="loading-mark" /><strong>正在准备画面与原声</strong><div className="loading-line"><i style={{ width: `${Math.round(load * 100)}%` }} /></div><small>{Math.round(load * 100)}%</small></div>}
            {phase === 'error' && <div className="screen-status"><strong>影片未能载入</strong><small>{error}</small><button className="retry-button" onClick={() => window.location.reload()}>重新载入</button></div>}
            {(phase === 'ready' || phase === 'ended') && !exporting && <button className="cover-play" onClick={toggle} aria-label={phase === 'ended' ? '重新播放影片' : '播放影片'}><span><Icon name={phase === 'ended' ? 'replay' : 'play'} size={20} /></span><b>{phase === 'ended' ? '再看一遍' : '播放影片'}</b></button>}
            {exporting && <div className="export-overlay" role="status" aria-live="polite"><div><span className="export-dot" />{exportState === 'saving' ? '正在封装 MP4' : '正在逐帧导出 MP4'}<strong>{exportProgress > 0 && exportProgress < 0.01 ? (exportProgress * 100).toFixed(1) : Math.round(exportProgress * 100)}%</strong><button onClick={() => exportRef.current?.abort()}>取消</button></div><progress value={exportProgress} max={1} aria-label="导出进度" /><small>720p · 原曲与当前字幕 · 所需时间取决于设备，请保持页面打开。</small></div>}
          </div>

          <div className="control-bar">
            <button className="control-play" onClick={toggle} disabled={!canPlay} aria-label={phase === 'playing' ? '暂停影片' : '播放影片'}><Icon name={phase === 'playing' ? 'pause' : phase === 'ended' ? 'replay' : 'play'} size={18} /></button>
            <span className="player-time"><b>{fmt(time)}</b><i>/</i>{fmt(DURATION)}</span>
            <div className="timeline"><input type="range" min="0" max={DURATION} step="0.01" value={time} onChange={(e) => seek(Number(e.target.value))} disabled={!canPlay} aria-label="影片进度" aria-valuetext={`${fmt(time)} / ${fmt(DURATION)}`} style={{ '--progress': `${(time / DURATION) * 100}%` } as React.CSSProperties} />{SECTIONS.slice(1).map((s) => <span className="chapter-mark" key={s.t} style={{ left: `${s.t / DURATION * 100}%` }} title={s.name} />)}</div>
            <span className="current-section">{section.name}</span>
            <span className="control-rule" />
            <button className={`control-text ${showLyrics ? 'active' : ''}`} onClick={flipLyrics} disabled={exporting} aria-pressed={showLyrics} title="字幕开关 (L)">字幕</button>
            <button className="control-icon" onClick={flipMute} aria-label={muted ? '取消静音' : '静音'} title="静音 (M)"><Icon name={muted ? 'mute' : 'volume'} size={19} /></button>
            <input className="volume-range" type="range" min="0" max="1" step="0.01" value={volume} aria-label="音量" onChange={(e) => { const v = Number(e.target.value); setVolume(v); playerRef.current?.setVolume(v); }} />
            <button className="control-icon" onClick={fullscreen} aria-label="切换全屏" title="全屏 (F)"><Icon name="full" size={18} /></button>
          </div>

          {downloadUrl && <div className="player-bottom"><span>导出完成，如果未自动下载：</span><a href={downloadUrl} download="Someone-Like-Me.mp4" className="save-again">再次保存 MP4 <Icon name="arrow" size={14} /></a></div>}
        </div>
        <div className="hero-foot"><span><i /> 三维场景 · 分支像素角色</span><span className="shortcut">空格 播放 / ← → 跳转 / F 全屏</span></div>
      </section>

      <section className="lyrics-section" aria-labelledby="lyric-title">
        <div className="section-heading"><div><p className="eyebrow"><span /> WORDS &amp; TIME</p><h2 id="lyric-title">歌词时间轴</h2></div><p>点选任意一句，从那一刻开始。</p></div>
        <div className="lyrics-layout">
          <div className="now-playing"><div className="now-label"><span>正在唱</span><span>{String(shot + 1).padStart(2, '0')} / {SHOTS.length} <i /> {SHOTS[shot]?.label}</span></div><div className="current-words">{current ? words.map((w, i) => <span key={i} className={`${w.key >= 2 ? 'word-major' : w.key === 1 ? 'word-key' : ''} ${time >= current.t[w.from] ? 'word-sung' : ''}`}>{w.text}</span>) : <span className="instrumental">随旋律前行</span>}</div><p className="lyric-note">每个字随原声落下，每个词在唱完时轻轻回响。</p></div>
          <div className="lyric-list" aria-label="点击歌词跳转">{groups.map((g) => <div className="lyric-group" key={g.t}><div className="lyric-group-name">{g.name}<span>{fmt(g.t)}</span></div>{g.lines.map(({ l, k }) => <button key={k} className={`lyric-row ${line === k ? 'selected' : ''}`} onClick={() => seek(l.t[0] - 0.1, true)} disabled={!canPlay} aria-current={line === k ? 'true' : undefined}><span className="lyric-time">{fmt(l.t[0])}</span><span className="lyric-text">{l.text}</span>{REP[k] > 0 && <small>{repeat[REP[k]]}</small>}<Icon name="arrow" size={14} /></button>)}</div>)}</div>
        </div>
      </section>

      <section className="cast-section" aria-labelledby="cast-title"><div className="section-heading"><div><p className="eyebrow"><span /> THE CAST</p><h2 id="cast-title">登场人物</h2></div><p>沿用分支里的像素造型。</p></div><div className="cast-grid">{CAST.map((c) => <div className="cast-item" key={c.ch}><div className="cast-art">{ready && <Sprite frame={`act_${c.ch}_${c.ch === 'gpt' ? 'float' : 'idle'}_0`} />}</div><div><p className="cast-model">{c.model}</p><h3>{c.name}</h3><p className="cast-role">{c.role}</p></div></div>)}</div></section>

      <section className="story-section" aria-labelledby="story-title"><div className="section-heading"><div><p className="eyebrow"><span /> BEHIND THE LYRICS</p><h2 id="story-title">关于这段故事</h2></div></div><div className="story-grid"><div><span>01 / 梦</span><h3>枕头下的那张纸</h3><p>她小心展开发霉的梦，稿纸上画着后来会开出的花。</p></div><div><span>02 / 坚持</span><h3>没有被写完的诗</h3><p>涂破的稿纸堆在桌边，眼泪落下后，她还是继续写。</p></div><div><span>03 / 花朵</span><h3>属于自己的角落</h3><p>不必成为万众瞩目的那一个，小小的花也会开。</p></div></div></section>
      <footer className="footer"><span>NEWDAY <i /> 譬如我</span><p>画面沿用原版实时渲染与分支人物图集。逐字时间为机器对齐，尚未人工逐字听审；公开传播前请确认音轨与角色许可。</p></footer>
    </main>
    {notice && <div className="toast" role="status">{notice}<button onClick={() => setNotice('')} aria-label="关闭提示">×</button></div>}
  </div>;
}