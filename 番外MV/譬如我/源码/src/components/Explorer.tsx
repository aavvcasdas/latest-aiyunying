import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { cast, chapters, chapterAt, clock, DURATION, lineAt, lyrics, two, type CastMember } from '../data/film'
import { Icon } from './Icon'

export type Tab = 'story' | 'lyrics' | 'cast'
const titles = { story: ['叙事分镜', 'STORYBOARD'], lyrics: ['同步歌词', 'LYRIC SCRIPT'], cast: ['登场角色', 'THE CAST'] }

export function Explorer({ tab, time, playing, onPlay, onCast }: { tab: Tab; time: number; playing: boolean; onPlay: (t: number) => void; onCast: (c: CastMember) => void }) {
  const current = chapterAt(time)
  const line = lineAt(time)
  const [follow, setFollow] = useState(true)
  const lyricBox = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (tab !== 'lyrics' || !follow || !playing || line < 0 || !lyricBox.current) return
    const box = lyricBox.current
    const row = box.querySelector<HTMLButtonElement>(`[data-line="${line}"]`)
    if (row) box.scrollTo({ top: row.offsetTop - box.clientHeight*.4, behavior: 'smooth' })
  }, [line, follow, tab, playing])

  return <section id="explorer" className="explorer page-gutter" aria-label={titles[tab][0]}>
    <div className="explorer-heading">
      <div className="section-title"><span className="heading-mark" /><h2>{titles[tab][0]}</h2><span className="section-english">{titles[tab][1]}</span></div>
      {tab === 'story' && <div className="chapter-index"><span>共 <b>04</b> 章</span><i /><button aria-label="分镜：上一章" disabled={current === 0} onClick={() => onPlay(chapters[current-1].start)}><Icon name="left" size={14} /></button><button aria-label="分镜：下一章" disabled={current === 3} onClick={() => onPlay(chapters[current+1].start)}><Icon name="right" size={14} /></button></div>}
      {tab === 'lyrics' && <div className="lyric-tools"><button className={`follow-control ${follow ? 'on' : ''}`} aria-pressed={follow} onClick={() => setFollow(v => !v)}><i />跟随播放</button><a href="/media/lyrics.srt" download="譬如我-同步歌词.srt" title="下载 SRT 字幕"><Icon name="download" size={16} /><span>字幕</span></a></div>}
      {tab === 'cast' && <span className="subtle-count">08 位角色</span>}
    </div>
    {tab === 'story' && <div className="chapter-grid panel-enter">{chapters.map((c, i) => <button key={c.title} className={`chapter-card ${i === current ? 'current' : ''}`} onClick={() => onPlay(c.start)} style={{ '--chapter-color': c.color, '--delay': `${i*55}ms` } as CSSProperties} aria-label={`播放第 ${i+1} 章：${c.title}，从 ${clock(c.start)} 开始`}>
      <div className="chapter-image"><img src={`/images/${c.image}.jpg`} alt={c.title} loading="eager" /><div className="thumb-shade" /><span className="chapter-number">CHAPTER <b>{two(i+1)}</b></span><span className="chapter-stamp">{clock(c.start)}</span><span className="chapter-play"><Icon name="play" size={19} /></span></div>
      <div className="chapter-caption"><span className="chapter-rule" /><h3>{c.title}</h3>{i === current && playing ? <span className="playing-bars" aria-label="正在播放"><i /><i /><i /></span> : <Icon name="arrow" className="chapter-link" size={15} />}</div>
      <p>{c.description}</p>
    </button>)}</div>}
    {tab === 'lyrics' && <div className="lyrics-panel panel-enter"><div className="lyric-intro"><span className="small-label">SYNCHRONIZED LYRICS</span><h3>每一个字，<br />都有落点。</h3><p>点选歌词，跳至对应的人声时刻。</p><span className="lyric-credit">41 句歌词 <i /> 358 个逐字时间点</span></div><div className="lyric-scroll" ref={lyricBox} tabIndex={0} aria-label="完整歌词，可滚动查看">{lyrics.map((l, i) => <button key={i} data-line={i} className={`lyric-row ${i === line ? 'active' : ''}`} onClick={() => onPlay(l.start)}><span className="lyric-time">{clock(l.start)}</span><span>{Array.from(l.text).map((c, k) => <span key={k} className={i === line && time >= l.times[k] ? 'sung' : ''}>{c}</span>)}</span><Icon name="play" size={13} /></button>)}</div></div>}
    {tab === 'cast' && <div className="cast-grid panel-enter">{cast.map(c => <button className="cast-entry" key={c.id} style={{ '--cast-color': c.color } as CSSProperties} onClick={() => onCast(c)}><div className="cast-image"><img src={`/cast/${c.id}.png`} alt={`${c.name}的分支原始像素立绘`} /></div><div className="cast-info"><span className="small-label">{c.model}</span><h3>{c.name}</h3><span>{c.role}</span></div><Icon name="arrow" className="cast-arrow" size={14} /></button>)}</div>}
    {tab === 'story' && <div className="story-footnote"><span className="tiny-frame"><Icon name="film" size={13} /></span><span>选择分镜，从这里进入故事</span><span className="story-duration">FILM DURATION <b>{clock(DURATION)}</b></span></div>}
  </section>
}