import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'
import type { Player } from '../useFilmPlayer'
import { chapters, chapterAt, clock, DURATION, two } from '../data/film'
import { drawFilm, loadFilm, type FilmAssets } from '../film/render'
import waveform from '../data/waveform.json'

export function FilmPlayer({ p, onNotes }: { p: Player; onNotes: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [assets, setAssets] = useState<FilmAssets | null>(null)
  const [assetError, setAssetError] = useState(false)
  const [menu, setMenu] = useState<'speed' | 'volume' | null>(null)
  const [hoverTime, setHoverTime] = useState<number | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const state = useRef(p)
  state.current = p
  const getAssets = () => { setAssetError(false); loadFilm().then(setAssets).catch(() => setAssetError(true)) }

  useEffect(() => { const timer = window.setTimeout(getAssets, 350); return () => clearTimeout(timer) }, [])
  useEffect(() => {
    if (!p.started || !assets || !canvas.current) return
    const ctx = canvas.current.getContext('2d', { alpha: false })
    if (!ctx) return
    let frame = 0, last = -1, updated = 0
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const tick = (now: number) => {
      const player = state.current
      const t = player.audio.current?.currentTime ?? 0
      const filmFrame = Math.floor(t*24)
      if (last !== filmFrame && !document.hidden) {
        drawFilm(ctx, assets, t, player.captions, player.mode, reduced)
        last = filmFrame
        if (now-updated > 110) { player.setTime(t); updated = now }
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [p.started, assets, p.captions, p.mode])
  useEffect(() => {
    if (!menu) return
    const close = (e: PointerEvent) => { if (!menuRef.current?.contains(e.target as Node)) setMenu(null) }
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(null) }
    document.addEventListener('pointerdown', close); document.addEventListener('keydown', key)
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', key) }
  }, [menu])
  const current = chapterAt(p.time)
  const next = () => void p.play(chapters[(current+1)%chapters.length].start)
  const progress = Math.max(0, Math.min(1, p.time/p.duration))

  return <section ref={p.container} className={`cinema ${p.started ? 'has-started' : ''} ${p.fallbackFull ? 'fallback-full' : ''}`} aria-label="譬如我 MV 放映器">
    <audio ref={p.audio} preload="auto" onPlay={() => p.setPlaying(true)} onPause={() => p.setPlaying(false)}
      onTimeUpdate={e => p.setTime(e.currentTarget.currentTime)}
      onLoadedMetadata={e => p.setDuration(Number.isFinite(e.currentTarget.duration) ? e.currentTarget.duration : DURATION)}
      onEnded={() => { p.setEnded(true); p.setPlaying(false); p.setTime(p.duration) }}>
      <source src="/media/film-audio.m4a" type="audio/mp4" /><source src="/media/someone-like-me.mp3" type="audio/mpeg" />
    </audio>
    <div className="film-stage">
      {!p.started && <>
        <img className="hero-art" src="/images/rooftop.jpg" alt="深夜天台上的本鲸，望着城市上空由星光组成的鲸鱼" fetchPriority="high" />
        <div className="hero-grade" />
        <div className="poster-content page-gutter">
          <div className="film-kicker"><span /> ORIGINAL MUSIC FILM</div>
          <h1>譬如我</h1>
          <div className="film-english">SOMEONE LIKE ME</div>
          <p className="film-description">以 DeepSeek 的目光，望向那些未被看见的梦。</p>
          <div className="hero-actions">
            <button className="primary-action" onClick={() => void p.play()}><Icon name="play" size={17} />播放 MV</button>
            <button className="secondary-action" onClick={onNotes}><Icon name="book" size={17} />创作手记</button>
          </div>
        </div>
        <div className="hero-dust" aria-hidden="true">{Array.from({ length: 9 }, (_, i) => <i key={i} style={{ left: `${32+i*7}%`, top: `${12+(i*19)%73}%`, animationDelay: `${-i*1.1}s` }} />)}</div>
      </>}
      {p.started && <>
        <canvas ref={canvas} className="film-canvas" width="1280" height="720" aria-label={`正在放映：${chapters[current].title}，${clock(p.time)}`} />
        <button className="film-hit-area" onClick={p.toggle} aria-label={p.playing ? '暂停影片' : '继续播放影片'} />
        <div className="film-topline"><button className="back-cover" onClick={p.cover}><Icon name="left" size={15} />返回封面</button><span>CH. {two(current+1)}<i />{chapters[current].title}</span></div>
        {!assets && !assetError && <div className="loading-film"><span className="loading-ring" />正在准备放映</div>}
        {assetError && <div className="film-message"><p>场景未能载入</p><button className="primary-action" onClick={getAssets}>重新加载</button></div>}
        {!p.playing && !p.ended && assets && !p.error && <button className="pause-indicator" onClick={p.toggle} aria-label="继续放映"><Icon name="play" size={28} /></button>}
        {p.ended && <div className="end-screen"><span className="small-label">END OF FILM</span><h2>小小的花，也有自己的春天。</h2><div className="flex items-center justify-center gap-3"><button className="primary-action" onClick={() => void p.play(0)}><Icon name="loop" size={17} />重新放映</button><button className="secondary-action" onClick={p.cover}>返回封面</button></div></div>}
      </>}
      {p.error && <div className="film-message" role="alert"><p>{p.error}</p><button className="primary-action" onClick={() => void p.play()}>重试播放</button><button onClick={p.cover}>返回封面</button></div>}
    </div>
    <div className="transport page-gutter" ref={menuRef}>
      <div className="transport-basic">
        <button className="transport-icon main-transport" onClick={p.toggle} title="播放 / 暂停（空格）" aria-label={p.playing ? '暂停' : '播放'}><Icon name={p.playing ? 'pause' : 'play'} size={20} /></button>
        <button className="transport-icon skip" onClick={next} title="下一章节" aria-label="下一章节"><Icon name="next" size={16} /></button>
        <span className="timecode"><b>{clock(p.time)}</b><i>/</i>{clock(p.duration)}</span>
      </div>
      <div className="wave-scrubber" onPointerMove={e => { const r = e.currentTarget.getBoundingClientRect(); setHoverTime(Math.max(0, Math.min(1, (e.clientX-r.left)/r.width))*p.duration) }} onPointerLeave={() => setHoverTime(null)}>
        <svg className="waveform" width="100%" height="30" preserveAspectRatio="none" viewBox="0 0 712 32" aria-hidden="true">
          {waveform.map((v, i) => <rect key={i} x={i*4} y={16-v*12.5} width="2" height={Math.max(2, v*25)} rx=".9" fill={i/waveform.length <= progress ? '#73dfd4' : '#3e4e55'} />)}
        </svg>
        <span className="wave-cursor" style={{ left: `${progress*100}%` }} />
        {hoverTime !== null && <span className="wave-tooltip" style={{ left: `${Math.min(96, Math.max(4, hoverTime/p.duration*100))}%` }}>{clock(hoverTime)}</span>}
        <input type="range" min="0" max={p.duration} step="0.01" value={p.time} onChange={e => p.seek(+e.target.value)} aria-label="播放进度" aria-valuetext={`${clock(p.time)}，共 ${clock(p.duration)}`} />
      </div>
      <div className="transport-extra">
        <button className={`captions-control ${p.captions ? 'enabled' : ''}`} aria-pressed={p.captions} onClick={() => p.setCaptions(!p.captions)} title="切换逐字字幕（C）"><Icon name="cc" size={19} /><span>3D 字幕</span></button>
        <div className="popover-anchor"><button className="speed-control" aria-label="播放设置" aria-expanded={menu === 'speed'} onClick={() => setMenu(menu === 'speed' ? null : 'speed')}>{p.speed.toFixed(p.speed === 1 ? 1 : 2).replace(/0$/, p.speed === 1 ? '0' : '')}<span>×</span></button>
          {menu === 'speed' && <div className="settings-popover"><span className="popover-label">播放速度</span><div className="speed-options">{[.75, 1, 1.25, 1.5].map(s => <button key={s} className={s === p.speed ? 'chosen' : ''} aria-pressed={s === p.speed} onClick={() => p.setSpeed(s)}>{s}×</button>)}</div><span className="popover-label">字幕入场方式</span><div className="caption-options">{(['character', 'word'] as const).map(m => <button className={p.mode === m ? 'chosen' : ''} key={m} aria-pressed={p.mode === m} onClick={() => { p.setMode(m); p.setCaptions(true) }}>{m === 'character' ? '逐字卡点' : '整词入场'}{p.mode === m && <Icon name="check" size={13} />}</button>)}</div></div>}
        </div>
        <div className="popover-anchor volume-anchor"><button className="transport-icon" aria-label="音量设置" aria-expanded={menu === 'volume'} onClick={() => setMenu(menu === 'volume' ? null : 'volume')} title="音量"><Icon name={p.muted || p.volume === 0 ? 'mute' : 'volume'} size={19} /></button>
          {menu === 'volume' && <div className="volume-popover"><button aria-label={p.muted ? '取消静音' : '静音'} onClick={() => p.setMuted(!p.muted)}><Icon name={p.muted || p.volume === 0 ? 'mute' : 'volume'} size={17} /></button><input type="range" min="0" max="1" step="0.01" value={p.muted ? 0 : p.volume} onChange={e => { p.setMuted(false); p.setVolume(+e.target.value) }} aria-label="音量" /><span>{Math.round((p.muted ? 0 : p.volume)*100)}%</span></div>}
        </div>
        <button className="transport-icon fullscreen-control" aria-label={p.full ? '退出全屏' : '全屏放映'} onClick={() => void p.fullscreen()} title="全屏（F）"><Icon name={p.full ? 'shrink' : 'expand'} size={18} /></button>
      </div>
    </div>
  </section>
}