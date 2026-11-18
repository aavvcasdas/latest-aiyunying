import { useCallback, useEffect, useRef, useState } from 'react'
import { Brand, Icon } from './components/Icon'
import { FilmPlayer } from './components/FilmPlayer'
import { Explorer, type Tab } from './components/Explorer'
import { Dialog } from './components/Dialog'
import { CharacterDetail, Notes } from './components/Notes'
import { type CastMember } from './data/film'
import { useFilmPlayer } from './useFilmPlayer'

type Modal = 'notes' | 'sources' | 'keys' | null
const nav: { tab: Tab; text: string }[] = [{ tab: 'story', text: '放映厅' }, { tab: 'lyrics', text: '同步歌词' }, { tab: 'cast', text: '角色档案' }]
const smooth = () => matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' as const : 'smooth' as const

export default function App() {
  const player = useFilmPlayer()
  const [tab, setTab] = useState<Tab>('story')
  const [modal, setModal] = useState<Modal>(null)
  const [member, setMember] = useState<CastMember | null>(null)
  const [saved, setSaved] = useState(() => { try { return localStorage.getItem('whale-cinema-saved') === '1' } catch { return false } })
  const [announcement, setAnnouncement] = useState('')
  const livePlayer = useRef(player)
  livePlayer.current = player
  const open = (m: Modal) => { player.audio.current?.pause(); setModal(m) }
  const navigate = (v: Tab) => {
    setTab(v)
    if (v === 'story') window.scrollTo({ top: 0, behavior: smooth() })
    else requestAnimationFrame(() => document.getElementById('explorer')?.scrollIntoView({ behavior: smooth(), block: 'start' }))
  }
  const playAt = (t: number) => {
    setMember(null); setModal(null); void player.play(t)
    requestAnimationFrame(() => player.container.current?.scrollIntoView({ behavior: smooth(), block: 'start' }))
  }
  const save = () => {
    const next = !saved; setSaved(next)
    try { localStorage.setItem('whale-cinema-saved', next ? '1' : '0') } catch { /* Keep session state when storage is unavailable. */ }
    setAnnouncement(next ? '影片已收藏到此设备' : '已取消收藏')
  }
  useEffect(() => { if (!announcement) return; const timer = setTimeout(() => setAnnouncement(''), 2400); return () => clearTimeout(timer) }, [announcement])
  const closeModal = useCallback(() => { setModal(null); setMember(null) }, [])
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (document.querySelector('dialog[open]') || e.ctrlKey || e.metaKey || e.altKey) return
      const target = e.target as HTMLElement
      if (target.closest('input,select,textarea,[contenteditable="true"]') || (target.closest('button,a') && [' ', 'Enter'].includes(e.key))) return
      const p = livePlayer.current
      if (e.code === 'Space') { e.preventDefault(); p.toggle() }
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); p.seek((p.audio.current?.currentTime ?? 0)+(e.key === 'ArrowRight' ? 5 : -5)) }
      if (e.key.toLowerCase() === 'm') p.setMuted(!p.muted)
      if (e.key.toLowerCase() === 'c') p.setCaptions(!p.captions)
      if (e.key.toLowerCase() === 'f') void p.fullscreen()
      if (e.key === '?') { p.audio.current?.pause(); setModal('keys') }
    }
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key)
  }, [])
  return <>
    <header className="site-header page-gutter">
      <button className="brand-home" aria-label="鲸映，返回放映厅" onClick={() => { player.cover(); navigate('story') }}><Brand /></button><span className="header-divider" />
      <nav className="main-nav" aria-label="主导航">{nav.map(n => <button key={n.tab} className={tab === n.tab ? 'selected' : ''} aria-current={tab === n.tab ? 'page' : undefined} onClick={() => navigate(n.tab)}><i />{n.text}</button>)}</nav>
      <div className="header-end"><span className="headphone-note"><Icon name="headphones" size={15} />建议佩戴耳机观看</span><button className={`save-button ${saved ? 'saved' : ''}`} aria-label={saved ? '已收藏' : '收藏作品'} aria-pressed={saved} onClick={save}><Icon name={saved ? 'check' : 'bookmark'} size={15} /><span>{saved ? '已收藏' : '收藏作品'}</span></button></div>
    </header>
    <main><FilmPlayer p={player} onNotes={() => open('notes')} /><Explorer tab={tab} time={player.time} playing={player.playing} onPlay={playAt} onCast={c => { player.audio.current?.pause(); setMember(c) }} /></main>
    <footer className="site-footer page-gutter"><div className="footer-brand"><span className="footer-dot" />WHALE CINEMA<span className="footer-separator">/</span><span>独立音乐影像计划</span></div><div className="footer-actions"><button onClick={() => open('keys')}>快捷键</button><i /><button onClick={() => open('sources')}>素材与鸣谢<Icon name="arrow" size={12} /></button></div></footer>
    <div className={`toast ${announcement ? 'visible' : ''}`} role="status" aria-live="polite">{announcement && <><Icon name="check" size={15} />{announcement}</>}</div>
    {(modal || member) && <Dialog onClose={closeModal} label={member ? `${member.name}角色档案` : modal === 'keys' ? '键盘快捷键' : '影片创作档案'} className={modal === 'keys' ? 'keys-dialog' : member ? 'cast-dialog' : ''}>
      {member && <CharacterDetail member={member} onPlay={() => playAt(member.time)} />}
      {(modal === 'notes' || modal === 'sources') && <Notes initial={modal === 'sources' ? 'sources' : 'notes'} />}
      {modal === 'keys' && <div className="keys-content"><span className="small-label">SCREENING CONTROLS</span><h2>放映快捷键</h2>{[['Space', '播放 / 暂停'], ['←  →', '后退 / 前进 5 秒'], ['C', '显示 / 隐藏字幕'], ['M', '静音 / 恢复声音'], ['F', '进入 / 退出全屏'], ['Esc', '关闭弹窗 / 退出全屏']].map(([key, detail]) => <div className="key-row" key={key}><span>{detail}</span><kbd>{key}</kbd></div>)}</div>}
    </Dialog>}
  </>
}
