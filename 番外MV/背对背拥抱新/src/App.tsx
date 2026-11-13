import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowDownToLine, ArrowLeft, ArrowRight, AudioLines, Check, ChevronDown, ChevronRight, CircleHelp, Clapperboard, Download, ExternalLink, FileJson, Film, FolderHeart, Heart, Image, Layers3, Leaf, ListMusic, Maximize2, Music2, Play, Search, Settings2, SlidersHorizontal, Sparkles, Subtitles, Users, X } from 'lucide-react';
import { Player, useMVAssets } from './components/Player';
import { Modal } from './components/Modal';
import { cast, chapters, characterTiming, DURATION, formatTime, getChapter, getNearestCueIndex, INITIAL_TIME, lyrics, REPO_URL, srtContent, VIDEO_URL, type CaptionMode } from './data/mv';
import { defaultOptions, type RenderOptions } from './lib/renderMV';

type Tab = 'preview' | 'storyboard' | 'cast';
type Dialog = 'export' | 'calibrate' | 'help' | 'preferences' | null;
type ExportType = 'video' | 'subtitles' | 'project';

function readPreferences(): RenderOptions {
  try {
    const stored = JSON.parse(localStorage.getItem('whale-mv-preferences') ?? '{}');
    return { ...defaultOptions, motion: !window.matchMedia('(prefers-reduced-motion: reduce)').matches, ...stored };
  } catch { return defaultOptions; }
}

function downloadText(filename: string, content: string, type = 'text/plain;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function BrandMark() {
  return <svg viewBox="0 0 36 36" fill="none" aria-hidden="true"><path d="M7 20c0-6 4-10 10-10 5 0 9 3 11 7 1-2 3-3 5-3-1 3-2 5-5 6-1 6-5 10-11 10S7 26 7 20Z" fill="currentColor" /><path d="M12 24c3 3 7 3 10 0" stroke="#8c75bd" strokeWidth="1.6" strokeLinecap="round" /><circle cx="13" cy="18" r="1.3" fill="#8c75bd" /><path d="M17 6V3m-4 4-2-2m10 2 2-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;
}

function App() {
  const [tab, setTab] = useState<Tab>('preview');
  const [dialog, setDialog] = useState<Dialog>(null);
  const [time, setTime] = useState(INITIAL_TIME);
  const [duration, setDuration] = useState(DURATION);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [rate, setRate] = useState(1);
  const [immersive, setImmersive] = useState(false);
  const [options, setOptions] = useState<RenderOptions>(readPreferences);
  const [follow, setFollow] = useState(() => {
    try { return localStorage.getItem('whale-mv-follow') !== 'false'; } catch { return true; }
  });
  const [draftOffset, setDraftOffset] = useState(0);
  const [exportType, setExportType] = useState<ExportType>('video');
  const [toast, setToast] = useState('');
  const [query, setQuery] = useState('');
  const [expandedChapter, setExpandedChapter] = useState(3);
  const [selectedCast, setSelectedCast] = useState('whale');
  const [castAction, setCastAction] = useState('idle');
  const [castFrame, setCastFrame] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const lyricListRef = useRef<HTMLDivElement>(null);
  const initialSeek = useRef(false);
  const { assets, ready, error: assetError } = useMVAssets();
  const chapter = getChapter(time);
  const currentIndex = getNearestCueIndex(time - options.offset);
  const currentCue = lyrics[currentIndex];

  const notify = useCallback((message: string) => setToast(message), []);

  useEffect(() => { if (toast) { const timer = setTimeout(() => setToast(''), 4200); return () => clearTimeout(timer); } }, [toast]);
  useEffect(() => { try { localStorage.setItem('whale-mv-preferences', JSON.stringify(options)); } catch { /* Playback also works when browser storage is unavailable. */ } }, [options]);
  useEffect(() => { try { localStorage.setItem('whale-mv-follow', String(follow)); } catch { /* Storage is optional. */ } }, [follow]);
  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume; }, [volume]);
  useEffect(() => { if (audioRef.current) audioRef.current.playbackRate = rate; }, [rate]);
  useEffect(() => {
    if (!playing) return;
    let last = 0;
    let raf = 0;
    const update = (stamp: number) => {
      if (stamp - last > 80 && audioRef.current) { setTime(audioRef.current.currentTime); last = stamp; }
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const seek = useCallback((nextTime: number) => {
    const next = Math.max(0, Math.min(duration, nextTime));
    if (audioRef.current) audioRef.current.currentTime = next;
    setTime(next);
  }, [duration]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !ready) return;
    if (audio.paused) {
      if (audio.currentTime >= duration - 0.1) seek(0);
      audio.play().catch(() => notify('音轨暂时无法播放，请稍后重试。'));
    } else audio.pause();
  }, [duration, notify, ready, seek]);

  const skip = useCallback((direction: number) => {
    const index = getNearestCueIndex(audioRef.current?.currentTime ?? time);
    seek(lyrics[Math.max(0, Math.min(lyrics.length - 1, index + direction))].start);
  }, [seek, time]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (dialog || (e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName))) return;
      if (e.code === 'Space' && e.target instanceof HTMLElement && e.target.tagName === 'BUTTON') return;
      if (e.code === 'Space') { e.preventDefault(); togglePlay(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); seek((audioRef.current?.currentTime ?? time) + 5); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); seek((audioRef.current?.currentTime ?? time) - 5); }
      if (e.key.toLowerCase() === 'm') setVolume((v) => v === 0 ? 0.7 : 0);
      if (e.key.toLowerCase() === 'f') { setTab('preview'); setImmersive((v) => !v); }
      if (e.key === 'Escape') setImmersive(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [dialog, seek, time, togglePlay]);

  useEffect(() => {
    if (!follow || tab !== 'preview') return;
    const list = lyricListRef.current;
    const active = list?.querySelector<HTMLElement>('[data-current="true"]');
    if (list && active) list.scrollTo({ top: active.offsetTop - list.clientHeight * 0.38, behavior: options.motion ? 'smooth' : 'instant' });
  }, [currentIndex, follow, tab, options.motion]);

  useEffect(() => {
    if (tab !== 'cast') return;
    const timer = setInterval(() => setCastFrame((f) => (f + 1) % (castAction === 'idle' ? 8 : 6)), 125);
    return () => clearInterval(timer);
  }, [tab, castAction]);

  const setMode = (mode: CaptionMode) => setOptions((prev) => ({ ...prev, mode }));
  const toggleMotion = () => setOptions((prev) => ({ ...prev, motion: !prev.motion }));
  const showCalibration = () => { setDraftOffset(options.offset * 1000); setDialog('calibrate'); };
  const previewAt = (at: number) => { seek(at); setTab('preview'); };
  const currentCast = cast.find((person) => person.id === selectedCast)!;
  const filteredLyrics = useMemo(() => lyrics.filter((cue) => !query || cue.text.includes(query) || cue.direction.includes(query)), [query]);

  const exportWork = () => {
    if (exportType === 'video') {
      const link = document.createElement('a'); link.href = '/assets/back-to-back-mv.mp4'; link.download = '背对背拥抱-治愈系MV.mp4'; link.click();
      notify('标准版 MP4 已开始下载。');
    } else if (exportType === 'subtitles') {
      downloadText('背对背拥抱.srt', srtContent(options.offset)); notify('48 句字幕已导出，包含当前校准偏移。');
    } else {
      downloadText('背对背拥抱-分镜工程.json', JSON.stringify({ title: '背对背拥抱', duration, fps: 24, resolution: [1280, 720], source: REPO_URL, alignment: { lineMethod: 'reference-video-subtitle-sampling', sampleInterval: 0.25, characterMethod: 'interpolated-not-vocal-verified' }, options, cast, chapters, lyrics: lyrics.map((cue) => ({ ...cue, characters: [...cue.text].map((text, i) => ({ text, start: characterTiming(cue, i) + options.offset })) })) }, null, 2), 'application/json');
      notify('人物、分镜与字级时间轴已导出。');
    }
  };

  const navItems = [{ id: 'preview' as Tab, icon: Clapperboard, name: '创作' }, { id: 'storyboard' as Tab, icon: Layers3, name: '分镜' }, { id: 'cast' as Tab, icon: Users, name: '素材' }];

  return (
    <div className="app-shell">
      <audio ref={audioRef} src="/assets/back-to-back.mp3" preload="auto" onLoadedMetadata={(e) => { setDuration(e.currentTarget.duration); if (!initialSeek.current) { e.currentTarget.currentTime = INITIAL_TIME; initialSeek.current = true; } }} onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => { setPlaying(false); setTime(duration); }} onError={() => notify('音轨加载失败，请检查网络后刷新页面。')} />

      <aside className="sidebar" aria-label="主导航">
        <button className="sidebar-brand" aria-label="鲸屿映画首页" onClick={() => setTab('preview')}><BrandMark /></button>
        <div className="sidebar-nav">{navItems.map(({ id, icon: Icon, name }) => <button key={id} className={`nav-item ${tab === id ? 'selected' : ''}`} onClick={() => setTab(id)} aria-current={tab === id ? 'page' : undefined}><Icon size={22} strokeWidth={1.65} /><span>{name}</span>{tab === id && <motion.i layoutId="sidebar-active" transition={{ duration: 0.22 }} />}</button>)}</div>
        <div className="sidebar-bottom"><button className="nav-item" onClick={() => setDialog('help')} aria-label="使用帮助"><CircleHelp size={21} strokeWidth={1.6} /><span>帮助</span></button><button className="nav-item" onClick={() => setDialog('preferences')} aria-label="创作偏好"><Settings2 size={21} strokeWidth={1.6} /><span>设置</span></button><div className="sidebar-divider" /><div className="user-avatar" title="本地创作空间"><img src="/assets/whale_idle.png" alt="本鲸头像" /></div></div>
      </aside>

      <div className="workspace">
        <header className="topbar"><div className="wordmark">鲸屿映画<span className="wordmark-divider" /><span className="wordmark-subtitle">把旋律，折成故事</span></div><div className="topbar-right"><a href={REPO_URL} target="_blank" rel="noreferrer" className="branch-link"><span className={`status-dot ${ready ? 'ready' : ''}`} />{ready ? '分支素材已连接' : '正在连接素材'}<ExternalLink size={12} /></a><span className="topbar-divider" /><span className="local-project"><FolderHeart size={16} />我的创作空间</span></div></header>

        <motion.main className="main-content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: 'easeOut' }}>
          <div className="project-heading"><div><div className="breadcrumb"><span>我的作品</span><ChevronRight size={12} /><span>治愈系音乐故事</span></div><div className="title-row"><h1>背对背拥抱</h1><span className="style-label"><Sparkles size={13} />治愈系重制</span></div><p className="project-description">把没说出口的话，藏进一个温柔的拥抱里。</p></div><div className="project-actions"><a className="reference-link" href={VIDEO_URL} target="_blank" rel="noreferrer"><Play size={14} />查看原 MV<ExternalLink size={12} /></a><button className="button button-primary" onClick={() => setDialog('export')}><Download size={16} />导出作品</button></div></div>

          <div className="workspace-tabs"><div role="tablist" aria-label="作品内容">{[{ id: 'preview' as Tab, label: 'MV 预览', icon: Film }, { id: 'storyboard' as Tab, label: '分镜脚本', icon: Layers3 }, { id: 'cast' as Tab, label: '人物与素材', icon: Users }].map(({ id, label, icon: Icon }) => <button key={id} role="tab" aria-selected={tab === id} className={`workspace-tab ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}><Icon size={16} />{label}{tab === id && <motion.span layoutId="tab-underline" transition={{ duration: 0.24 }} />}</button>)}</div><span className="format-note"><span className="ratio-icon" />16:9<span className="note-dot" />720P<span className="note-dot" />纯净无水印</span></div>

          {tab === 'preview' && <div className="preview-content" role="tabpanel">
            <div className="preview-grid">
              <div className="preview-left">
                <Player audioRef={audioRef} assets={assets} ready={ready} assetError={assetError} time={time} duration={duration} playing={playing} volume={volume} rate={rate} immersive={immersive} options={options} onPlay={togglePlay} onSeek={seek} onSkip={skip} onVolume={setVolume} onRate={setRate} onImmersive={() => setImmersive(!immersive)} onMotion={toggleMotion} />
                <div className="player-caption"><span><Leaf size={14} />纸片人的世界，也有真实的心事。</span><button onClick={() => setImmersive(true)}><Maximize2 size={13} />沉浸播放<span className="keycap">F</span></button></div>
              </div>

              <aside className="lyrics-panel" aria-label="歌词与节拍">
                <div className="lyrics-panel-heading"><div><span className="panel-title"><AudioLines size={17} />歌词与节拍</span><p>让每个字，都落在心跳上</p></div><button className={`icon-button follow-button ${follow ? 'is-active' : ''}`} title={follow ? '关闭歌词自动跟随' : '开启歌词自动跟随'} aria-label="歌词自动跟随" aria-pressed={follow} onClick={() => setFollow(!follow)}><ListMusic size={17} /></button></div>
                <div className="caption-toggle-row"><span><span className="cube-icon">3D</span>空间字幕</span><button className={`switch ${options.captions ? 'on' : ''}`} role="switch" aria-checked={options.captions} aria-label="3D 空间字幕" onClick={() => setOptions((o) => ({ ...o, captions: !o.captions }))}><span /></button></div>
                <div className="caption-mode" role="group" aria-label="字幕模式">{([{ id: 'character', label: '逐字' }, { id: 'word', label: '逐词' }, { id: 'line', label: '整句' }] as { id: CaptionMode; label: string }[]).map((mode) => <button className={options.mode === mode.id ? 'selected' : ''} key={mode.id} onClick={() => setMode(mode.id)} aria-pressed={options.mode === mode.id}>{mode.label}</button>)}</div>
                <div className="lyrics-list" ref={lyricListRef}>{lyrics.map((cue, index) => <button key={cue.id} data-current={index === currentIndex} className={`lyric-line ${index === currentIndex ? 'current' : ''} ${index < currentIndex ? 'past' : ''}`} onClick={() => seek(cue.start + options.offset)} title={`跳转到 ${formatTime(cue.start)}`}><span className="lyric-marker">{index === currentIndex ? <AudioLines size={13} /> : <span />}</span><span className="lyric-text">{cue.text}</span><time>{formatTime(cue.start)}</time></button>)}</div>
                <button className="calibrate-link" onClick={showCalibration}><span><SlidersHorizontal size={14} />字幕时间校准</span><span>{options.offset === 0 ? '微调节拍' : `${options.offset > 0 ? '+' : ''}${Math.round(options.offset * 1000)} ms`}<ChevronRight size={14} /></span></button>
              </aside>
            </div>

            <section className="chapters-section" aria-label="故事分镜"><div className="section-heading"><div><h2><Clapperboard size={17} />故事分镜</h2><span>6 个章节<span className="small-dot">·</span>48 个歌词镜头</span></div><button className="text-button" onClick={() => { setExpandedChapter(chapter.id); setTab('storyboard'); }}>查看完整脚本<ArrowRight size={14} /></button></div><div className="chapter-grid">{chapters.map((item) => <button className={`chapter-item ${chapter.id === item.id ? 'current' : ''}`} key={item.id} onClick={() => seek(item.id === 3 ? INITIAL_TIME : item.start)} aria-label={`章节 ${item.id}：${item.title}`} aria-pressed={chapter.id === item.id}><div className="chapter-image"><img src={`/assets/chapter-${item.id}.jpg`} alt={item.title} /><span className="chapter-number">0{item.id}</span><time>{formatTime(item.start)}</time>{chapter.id === item.id && <span className="chapter-selected"><AudioLines size={12} />当前分镜</span>}</div><div className="chapter-name"><span>{item.title}</span>{chapter.id === item.id && <span className="chapter-active-dot" />}</div><span className="chapter-subtitle">{item.subtitle}</span></button>)}</div></section>
            <footer className="workspace-footer"><span><span className="status-dot ready" />创作偏好已保存在本机</span><span>原分支纸片人<span className="small-dot">·</span>用一首歌的时间，慢慢靠近</span><button onClick={() => setDialog('help')}><CircleHelp size={13} />创作说明</button></footer>
          </div>}

          {tab === 'storyboard' && <section className="storyboard-view" role="tabpanel"><div className="view-heading"><div><span className="eyebrow">THE STORY BEHIND THE SONG</span><h2>让歌词，有迹可循。</h2><p>从误解到和解，一句歌词，一个温柔的镜头。</p></div><label className="search-field"><Search size={16} /><input placeholder="搜索歌词或分镜..." aria-label="搜索分镜" value={query} onChange={(e) => setQuery(e.target.value)} />{query && <button className="icon-button" aria-label="清除搜索" onClick={() => setQuery('')}><X size={14} /></button>}</label></div><div className="story-chapters">{chapters.map((item) => {
            const cues = filteredLyrics.filter((cue) => cue.start >= item.start && cue.start < item.end);
            if (query && cues.length === 0) return null;
            const expanded = expandedChapter === item.id || !!query;
            return <div className={`story-chapter ${expanded ? 'expanded' : ''}`} key={item.id}><button className="story-chapter-heading" onClick={() => setExpandedChapter(expandedChapter === item.id ? 0 : item.id)} aria-expanded={expanded}><img src={`/assets/chapter-${item.id}.jpg`} alt="" /><span className="story-number">0{item.id}</span><div><h3>{item.title}<small>{formatTime(item.start)} - {formatTime(item.end)}</small></h3><p>{item.description}</p></div><span className="shot-count">{cues.length} 镜</span><ChevronDown size={18} /></button>{expanded && <div className="shot-list">{cues.map((cue) => <div className="shot-row" key={cue.id}><span className="shot-id">{String(cue.id).padStart(2, '0')}</span><time>{formatTime(cue.start)}</time><div><h4>{cue.text}</h4><p>{cue.direction}</p></div><button className="shot-preview" onClick={() => previewAt(cue.start)}><Play size={13} />预览</button></div>)}{item.id === 6 && <div className="story-ending"><Heart size={15} />209 秒后进入无歌词尾奏，两人相伴，画面在晨光里淡出。</div>}</div>}</div>;
          })}{filteredLyrics.length === 0 && <div className="empty-state"><Search size={28} /><h3>还没有找到这句心事</h3><p>试试搜索「拥抱」「信纸」或「晨光」。</p><button className="button button-secondary" onClick={() => setQuery('')}>查看全部分镜</button></div>}</div></section>}

          {tab === 'cast' && <section className="cast-view" role="tabpanel"><div className="view-heading"><div><span className="eyebrow">THE ORIGINAL PAPER CAST</span><h2>还是熟悉的她们。</h2><p>只使用当前分支的原始纸片人，不替换造型，不重绘人物。</p></div><a className="button button-secondary" href={REPO_URL} target="_blank" rel="noreferrer">查看原分支<ExternalLink size={14} /></a></div><div className="cast-layout"><div className="cast-selector">{cast.map((person) => <button className={`cast-choice ${selectedCast === person.id ? 'selected' : ''}`} key={person.id} onClick={() => { setSelectedCast(person.id); setCastAction('idle'); setCastFrame(0); }} style={{ '--cast-color': person.color } as CSSProperties}><img src={`/assets/${person.image}.png`} alt={person.name} /><div><h3>{person.name}<span>{person.english}</span></h3><p>{person.role}</p></div>{selectedCast === person.id && <Check size={18} />}</button>)}<div className="cast-source-note"><Image size={17} /><p>人物与动作来自分支原始图集。<br /><code>通用模板/engine/assets/</code></p></div></div><div className="cast-stage"><div className="cast-portrait" style={{ '--cast-color': currentCast.color } as CSSProperties}><span className="portrait-orbit" /><img src={`/assets/act_${selectedCast}_${castAction}_${castFrame % (castAction === 'idle' ? 8 : 6)}.png`} alt={`${currentCast.name}的原始${castAction === 'idle' ? '待机' : '情绪'}动作`} /><span className="portrait-ground" /></div><div className="cast-detail"><span className="eyebrow">{currentCast.english.toUpperCase()}</span><h3>{currentCast.name}</h3><h4>{currentCast.role}</h4><p>{currentCast.description}</p><label className="action-select">原分支动作<select value={castAction} onChange={(e) => { setCastAction(e.target.value); setCastFrame(0); }}><option value="idle">呼吸待机</option><option value="sad">低头难过</option><option value={selectedCast === 'whale' ? 'point' : 'nod'}>{selectedCast === 'whale' ? '递出手，靠近你' : '轻轻点头，回应你'}</option></select></label></div></div></div><section className="source-details"><h3>关于这个小小的世界</h3><div><p><strong>人物没有变</strong>本鲸与小克沿用原分支 PNG 图集与动作帧；本次感情叙事为独立 MV 演绎，不回写原角色关系。</p><p><strong>场景温柔了一点</strong>纸艺森林、暮色花园、月下小路与晨光桥梁，为本次 MV 新制作的四套场景。</p><p><strong>发布前，请确认授权</strong>音乐和角色的公开传播授权尚未核实。当前作品用于创作预览，公开发布前请核对原素材许可。</p></div></section></section>}
        </motion.main>
      </div>

      <AnimatePresence>{toast && <motion.div className="toast" role="status" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}><Check size={17} /><span>{toast}</span><button aria-label="关闭提示" onClick={() => setToast('')}><X size={14} /></button></motion.div>}</AnimatePresence>

      <AnimatePresence>{dialog === 'export' && <Modal title="把这份温柔带走" eyebrow="EXPORT YOUR STORY" onClose={() => setDialog(null)}><p className="modal-intro">一首歌，一个完整的纸上故事。选择你需要的格式。</p><div className="export-preview"><img src="/assets/chapter-3.jpg" alt="背对背拥抱预览" /><div><h3>背对背拥抱</h3><p>治愈系 MV · {formatTime(duration)}</p><span>本鲸 & 小克</span></div></div><div className="export-options">{[{ id: 'video' as ExportType, icon: Film, title: '完整 MV', detail: 'MP4 · 1280 × 720 · 24 fps' }, { id: 'subtitles' as ExportType, icon: Subtitles, title: '歌词字幕', detail: 'SRT · 48 句 · 含校准偏移' }, { id: 'project' as ExportType, icon: FileJson, title: '分镜工程', detail: 'JSON · 人物、镜头与字级时间轴' }].map(({ id, icon: Icon, title, detail }) => <button className={`export-option ${exportType === id ? 'selected' : ''}`} key={id} onClick={() => setExportType(id)}><Icon size={21} /><div><strong>{title}</strong><span>{detail}</span></div><span className="radio-dot">{exportType === id && <i />}</span></button>)}</div><p className="export-note">{exportType === 'video' ? '视频为已渲染的标准版，包含 BGM 与逐字字幕。预览中的字幕模式和时间微调不改变此文件。' : exportType === 'subtitles' ? '字幕按原 MV 换行时间整理，并应用你设置的时间偏移。逐字节奏仍需试听校准。' : '工程记录全部 48 个歌词镜头、分词和插值字级时间。可用于后续精调，不包含源素材文件。'}</p><button className="button button-primary button-full" onClick={exportWork}><ArrowDownToLine size={17} />{exportType === 'video' ? '下载完整 MP4' : exportType === 'subtitles' ? '导出 SRT 字幕' : '导出 JSON 工程'}</button><p className="license-note">仅供创作预览，公开发布前请确认音乐及角色授权。</p></Modal>}</AnimatePresence>

      <AnimatePresence>{dialog === 'calibrate' && <Modal title="让字幕，跟上心跳" eyebrow="LYRIC TIMING" onClose={() => setDialog(null)}><p className="modal-intro">如果听起来稍早或稍晚，可以微调字幕相对音乐的时间。</p><div className="calibration-preview"><Music2 size={22} /><span>{currentCue.text}</span><small>{formatTime(currentCue.start)}</small></div><div className="offset-heading"><label htmlFor="offset">字幕整体偏移</label><strong>{draftOffset > 0 ? '+' : ''}{draftOffset} <small>ms</small></strong></div><input id="offset" className="offset-slider" type="range" min={-1500} max={1500} step={50} value={draftOffset} onChange={(e) => setDraftOffset(Number(e.target.value))} /><div className="range-labels"><span>字幕提前</span><button onClick={() => setDraftOffset(0)}>重置为 0</button><span>字幕延后</span></div><div className="timing-explanation"><strong>关于当前对齐精度</strong><p>句级时间来自原 MV 字幕画面，采样间隔为 250 ms。拆句及字词卡点采用插值生成，未经过完整的人声强制对齐或逐句听校。</p><a href={VIDEO_URL} target="_blank" rel="noreferrer">打开原 MV 对照<ExternalLink size={12} /></a></div><button className="button button-primary button-full" onClick={() => { setOptions((o) => ({ ...o, offset: draftOffset / 1000 })); setDialog(null); notify('字幕时间已更新并保存在本机。'); }}><Check size={16} />应用时间校准</button></Modal>}</AnimatePresence>

      <AnimatePresence>{dialog === 'preferences' && <Modal title="按你的节奏，慢慢来" eyebrow="YOUR CREATIVE SPACE" onClose={() => setDialog(null)}><p className="modal-intro">这些偏好只保存在当前浏览器，不会修改原始素材。</p><div className="preference-row"><div><strong>场景动态</strong><p>轻缓镜头、纸片动作与漂浮光点</p></div><button className={`switch ${options.motion ? 'on' : ''}`} role="switch" aria-label="场景动态" aria-checked={options.motion} onClick={toggleMotion}><span /></button></div><div className="preference-row"><div><strong>歌词自动跟随</strong><p>播放时，让当前歌词停在视线中央</p></div><button className={`switch ${follow ? 'on' : ''}`} role="switch" aria-label="自动跟随偏好" aria-checked={follow} onClick={() => setFollow(!follow)}><span /></button></div><div className="preference-row"><div><strong>空间字幕</strong><p>在画面里展示立体的字词卡点</p></div><button className={`switch ${options.captions ? 'on' : ''}`} role="switch" aria-label="空间字幕偏好" aria-checked={options.captions} onClick={() => setOptions((o) => ({ ...o, captions: !o.captions }))}><span /></button></div><button className="button button-secondary button-full preference-reset" onClick={() => { setOptions(defaultOptions); setFollow(true); setVolume(0.7); setRate(1); notify('已恢复默认创作偏好。'); }}>恢复默认设置</button><button className="button button-primary button-full" onClick={() => setDialog(null)}>保存并继续</button></Modal>}</AnimatePresence>

      <AnimatePresence>{dialog === 'help' && <Modal title="欢迎来到鲸屿映画" eyebrow="A LITTLE HELP" onClose={() => setDialog(null)}><p className="modal-intro">这是一部可以播放、阅读分镜和导出的治愈系纸片人 MV。</p><div className="help-shortcuts"><div><span>播放 / 暂停</span><kbd>Space</kbd></div><div><span>后退 / 快进 5 秒</span><span><kbd><ArrowLeft size={13} /></kbd><kbd><ArrowRight size={13} /></kbd></span></div><div><span>进入 / 退出沉浸模式</span><kbd>F</kbd></div><div><span>静音 / 取消静音</span><kbd>M</kbd></div></div><div className="help-body"><h3>怎样看这个故事？</h3><p>点击下方章节切换场景，点击右侧歌词跳转时间。在「分镜脚本」中，可以查看每句歌词对应的镜头构思。</p><h3>字幕卡点说明</h3><p>句级时间参考原 MV 画面，字词采用节奏插值。可以切换逐字、逐词或整句，并在「字幕时间校准」中微调。</p><h3>素材与发布</h3><p>使用原分支本鲸、小克纸片人与用户提供的 BGM。场景为新制作。角色和音乐的公开发布许可尚未核实。</p></div><a className="button button-secondary button-full" href={REPO_URL} target="_blank" rel="noreferrer">查看素材来源<ExternalLink size={14} /></a></Modal>}</AnimatePresence>
    </div>
  );
}

export default App;