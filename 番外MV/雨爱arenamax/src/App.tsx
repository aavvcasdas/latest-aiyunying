import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Player, type CallbackListener, type PlayerRef } from '@remotion/player';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { ArrowDownToLine, ArrowLeft, ArrowRight, AudioLines, Check, CheckCheck, ChevronDown, ChevronRight, CircleHelp, Cloud, CloudRain, Download, Expand, Film, Heart, Images, LayoutPanelTop, Leaf, Maximize, Music2, Pause, Pencil, Play, Rainbow, Repeat2, Settings2, SkipBack, SkipForward, SlidersHorizontal, Sparkles, Subtitles, Type, Upload, Volume2, VolumeX, WandSparkles } from 'lucide-react';
import { RainLove } from './remotion/RainLove';
import { AUDIO_SRC, currentLyric, DEFAULT_PROJECT, DURATION, downloadBlob, formatTime, FPS, getScene, INITIAL_FRAME, isProject, loadProject, TOTAL_FRAMES, type Lyric, type Project, type Scene, type VideoSettings } from './lib/project';
import { Modal } from './components/Modal';
import { ExportDialog } from './components/ExportDialog';
import { Timeline } from './components/Timeline';

type Dialog = 'export' | 'lyrics' | 'assets' | 'audio' | 'settings' | 'help' | 'rename' | null;

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return <button className={`toggle ${checked ? 'checked' : ''}`} role="switch" aria-checked={checked} aria-label={label} onClick={onChange}><span /></button>;
}

function IconButton({ children, label, onClick, active = false, className = '' }: { children: ReactNode; label: string; onClick: () => void; active?: boolean; className?: string }) {
  return <button className={`icon-button ${active ? 'is-active' : ''} ${className}`} aria-label={label} title={label} onClick={onClick}>{children}</button>;
}

function StyleControls({ settings, onChange }: { settings: VideoSettings; onChange: (patch: Partial<VideoSettings>) => void }) {
  return <div className="style-controls">
    <div className="style-intro"><div className="style-intro-icon"><Sparkles size={23} /></div><div><strong>温柔，是画面的底色</strong><p>柔软材质 · 轻盈运镜 · 细腻光影</p></div></div>
    <div className="control-group"><label>画面色调</label><div className="palette-options">{([{ id: 'original', title: '雨后青', colors: ['#d0ddd4', '#b9cdd3', '#f2e9dc'] }, { id: 'warm', title: '暖阳奶油', colors: ['#e9d8bc', '#eedcca', '#f4eade'] }, { id: 'dream', title: '云间梦境', colors: ['#d6c7e3', '#c5cee2', '#e9d7e2'] }] as const).map((palette) => <button key={palette.id} className={`palette-option ${settings.palette === palette.id ? 'selected' : ''}`} onClick={() => onChange({ palette: palette.id })}><span className="palette-swatch">{palette.colors.map((color) => <i key={color} style={{ backgroundColor: color }} />)}{settings.palette === palette.id && <Check size={13} />}</span><span>{palette.title}</span></button>)}</div></div>
    <div className="control-group"><label>字幕样式</label><div className="subtitle-options"><button className={settings.subtitleStyle === 'clean' ? 'selected' : ''} onClick={() => onChange({ subtitleStyle: 'clean' })}><span className="type-example">雨爱的秘密</span><span>极简白字</span></button><button className={settings.subtitleStyle === 'soft' ? 'selected' : ''} onClick={() => onChange({ subtitleStyle: 'soft' })}><span className="type-example type-example-soft">雨爱的秘密</span><span>柔光衬底</span></button></div></div>
    <div className="control-group"><label className="range-heading">字幕字号<span>{settings.fontSize} px</span></label><input className="style-range" type="range" min="34" max="68" step="2" value={settings.fontSize} aria-label="字幕字号" onChange={(event) => onChange({ fontSize: Number(event.target.value) })} /></div>
    <div className="setting-line"><div><strong>雨滴与微光</strong><p>让画面多一点呼吸感</p></div><Toggle checked={settings.particles} onChange={() => onChange({ particles: !settings.particles })} label="雨滴与微光特效" /></div>
  </div>;
}

function LyricEditor({ lyrics, onSave, onClose }: { lyrics: Lyric[]; onSave: (lyrics: Lyric[]) => void; onClose: () => void }) {
  const [draft, setDraft] = useState(lyrics.map((line) => ({ ...line })));
  const [error, setError] = useState('');
  function save() {
    if (draft.some((line, index) => !line.text.trim() || !Number.isFinite(line.start) || !Number.isFinite(line.end) || line.start < 0 || line.end <= line.start || line.end > DURATION || (index > 0 && line.start < draft[index - 1].end))) {
      setError('请填写每一句歌词，确保开始早于结束，且相邻字幕不重叠。时间范围为 0 至 131.26 秒。'); return;
    }
    onSave(draft.map((line) => ({ ...line, text: line.text.trim() }))); onClose();
  }
  const update = (index: number, patch: Partial<Lyric>) => setDraft((lines) => lines.map((line, i) => i === index ? { ...line, ...patch } : line));
  return <Modal title="每一句，都值得被看见" subtitle="编辑歌词与出现时间。时间单位为秒，修改后会同步到画面和时间线。" onClose={onClose} wide><div className="lyric-editor-table"><div className="lyric-editor-head"><span>歌词</span><span>开始 / 秒</span><span>结束 / 秒</span></div>{draft.map((line, index) => <div className="lyric-edit-row" key={line.id}><label><span>{String(index + 1).padStart(2, '0')}</span><input aria-label={`第 ${index + 1} 句歌词`} value={line.text} onChange={(e) => update(index, { text: e.target.value })} /></label><input type="number" step="0.1" min="0" max={DURATION} aria-label={`第 ${index + 1} 句开始时间`} value={line.start} onChange={(e) => update(index, { start: Number(e.target.value) })} /><input type="number" step="0.1" min="0" max={DURATION} aria-label={`第 ${index + 1} 句结束时间`} value={line.end} onChange={(e) => update(index, { end: Number(e.target.value) })} /></div>)}</div>{error && <p className="form-error">{error}</p>}<div className="modal-actions"><button className="button button-secondary" onClick={onClose}>取消</button><button className="button button-primary" onClick={save}><Check size={16} />保存字幕</button></div></Modal>;
}

function SceneEditor({ scene, onSave, onClose }: { scene: Scene; onSave: (scene: Scene) => void; onClose: () => void }) {
  const [draft, setDraft] = useState(scene);
  return <Modal title="给这一幕，一个温柔的名字" subtitle={`${formatTime(scene.from)} - ${formatTime(scene.to)} · 分镜 ${String(scene.id).padStart(2, '0')}`} onClose={onClose}><img className="scene-editor-image" src={scene.image} alt={scene.title} /><label className="field-label">分镜名称<input maxLength={18} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label><label className="field-label">一句话故事<input maxLength={40} value={draft.subtitle} onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })} /></label><label className="field-label">镜头设计笔记<textarea rows={3} value={draft.direction} onChange={(e) => setDraft({ ...draft, direction: e.target.value })} /></label><div className="modal-actions"><button className="button button-secondary" onClick={onClose}>取消</button><button className="button button-primary" disabled={!draft.title.trim()} onClick={() => { onSave(draft); onClose(); }}><Check size={16} />保存分镜</button></div></Modal>;
}

export default function App() {
  const [history, setHistory] = useState<Project[]>(() => [loadProject()]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const project = history[historyIndex];
  const [view, setView] = useState<'create' | 'storyboard'>('create');
  const [tab, setTab] = useState<'lyrics' | 'style'>('lyrics');
  const [dialog, setDialog] = useState<Dialog>(null);
  const [sceneEditor, setSceneEditor] = useState<Scene | null>(null);
  const [frame, setFrame] = useState(INITIAL_FRAME);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [loop, setLoop] = useState(false);
  const [rate, setRate] = useState(1);
  const [saveState, setSaveState] = useState('saved');
  const [toast, setToast] = useState('');
  const [nameDraft, setNameDraft] = useState(project.title);
  const player = useRef<PlayerRef>(null);
  const importInput = useRef<HTMLInputElement>(null);
  const lyricScroll = useRef<HTMLDivElement>(null);
  const activeLine = currentLyric(project.lyrics, frame / FPS);
  const scene = getScene(project.scenes, frame / FPS);
  const inputProps = useMemo(() => ({ project }), [project]);

  function commit(next: Project) {
    setHistory((all) => [...all.slice(0, historyIndex + 1), next]);
    setHistoryIndex(historyIndex + 1);
  }
  function settings(patch: Partial<VideoSettings>) { commit({ ...project, settings: { ...project.settings, ...patch } }); }
  const seek = useCallback((seconds: number) => {
    const next = Math.max(0, Math.min(TOTAL_FRAMES - 1, Math.round(seconds * FPS)));
    player.current?.seekTo(next); setFrame(next);
  }, []);
  const toggleMute = useCallback(() => {
    if (player.current?.isMuted()) { player.current.unmute(); setMuted(false); }
    else { player.current?.mute(); setMuted(true); }
  }, []);

  useEffect(() => {
    const instance = player.current;
    if (!instance) return;
    const update: CallbackListener<'frameupdate'> = (event) => setFrame(event.detail.frame);
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    instance.addEventListener('frameupdate', update);
    instance.addEventListener('play', onPlay);
    instance.addEventListener('pause', onPause);
    instance.addEventListener('ended', onPause);
    return () => { instance.removeEventListener('frameupdate', update); instance.removeEventListener('play', onPlay); instance.removeEventListener('pause', onPause); instance.removeEventListener('ended', onPause); };
  }, []);

  useEffect(() => {
    setSaveState('saving');
    const timeout = window.setTimeout(() => {
      try { localStorage.setItem('rainfilm-project-v2', JSON.stringify(project)); setSaveState('saved'); } catch { setSaveState('unavailable'); }
    }, 450);
    return () => window.clearTimeout(timeout);
  }, [project]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(''), 3500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    if (!playing || activeLine < 0 || !lyricScroll.current) return;
    const row = lyricScroll.current.querySelector<HTMLElement>(`[data-lyric="${activeLine}"]`);
    if (row) lyricScroll.current.scrollTo({ top: row.offsetTop - lyricScroll.current.offsetTop - lyricScroll.current.clientHeight / 2 + 22, behavior: 'smooth' });
  }, [activeLine, playing]);

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if (dialog || sceneEditor || (event.target instanceof HTMLElement && (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(event.target.tagName) || event.target.isContentEditable))) return;
      if (event.code === 'Space') { event.preventDefault(); player.current?.toggle(); }
      if (event.key === 'ArrowRight') { event.preventDefault(); seek((player.current?.getCurrentFrame() ?? 0) / FPS + 5); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); seek((player.current?.getCurrentFrame() ?? 0) / FPS - 5); }
      if (event.key.toLowerCase() === 'm') toggleMute();
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [dialog, sceneEditor, seek, toggleMute]);

  function openDialog(next: Dialog) { if (next === 'export') player.current?.pause(); setDialog(next); }
  async function importProject(file?: File) {
    if (!file) return;
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!isProject(parsed)) throw new Error('这个文件不是有效的雨映项目，请选择此前下载的项目 JSON。');
      player.current?.pause(); commit(parsed); seek(INITIAL_FRAME / FPS); setDialog(null);
      setToast('项目已恢复，继续你的温柔创作。');
    } catch (error) { setToast(error instanceof Error ? error.message : '无法读取项目文件，请重试。'); }
    if (importInput.current) importInput.current.value = '';
  }
  function previewScene(item: Scene) { setView('create'); seek(item.from); player.current?.play(); }
  async function fullscreen() {
    try { await player.current?.requestFullscreen(); } catch { setToast('此浏览器暂不支持全屏，你仍可正常预览影片。'); }
  }

  const navItems = [
    { id: 'create', icon: WandSparkles, title: '创作' },
    { id: 'storyboard', icon: LayoutPanelTop, title: '分镜' },
    { id: 'assets', icon: Images, title: '素材' },
    { id: 'audio', icon: Music2, title: '音乐' },
  ];

  return (
    <MotionConfig reducedMotion="user">
      <div className="app-shell">
        <input ref={importInput} type="file" accept=".json,application/json" hidden aria-label="导入雨映项目" onChange={(event) => void importProject(event.target.files?.[0])} />
        <header className="topbar">
          <button className="brand" onClick={() => setView('create')} aria-label="雨映创作首页"><span className="brand-mark"><CloudRain size={29} strokeWidth={1.6} /></span><span className="brand-name">雨映<span>Rainfilm</span></span></button>
          <div className="topbar-divider" /><span className="brand-tagline">让每一句歌词，都有画面</span>
          <div className="topbar-right"><button className="workspace-picker" onClick={() => openDialog('settings')}>我的工作空间<ChevronDown size={13} /></button><span className="header-separator" /><IconButton label="使用帮助" onClick={() => openDialog('help')}><CircleHelp size={19} /></IconButton><button className="avatar" aria-label="项目与工作空间设置" onClick={() => openDialog('settings')}>L<span /></button></div>
        </header>
        <aside className="sidebar"><nav aria-label="主要导航">{navItems.map((item) => <button key={item.id} className={`nav-item ${(dialog ? dialog === item.id : view === item.id) ? 'active' : ''}`} onClick={() => item.id === 'create' || item.id === 'storyboard' ? setView(item.id) : openDialog(item.id as Dialog)}><item.icon size={21} strokeWidth={1.7} /><span>{item.title}</span></button>)}</nav><div className="sidebar-bottom"><button className="nav-item" onClick={() => openDialog('settings')}><Settings2 size={20} strokeWidth={1.6} /><span>设置</span></button><div className="sidebar-flower"><Leaf size={19} strokeWidth={1.4} /></div></div></aside>

        <motion.main className="studio-main" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
          <div className="breadcrumb"><button onClick={() => setView('create')}>我的创作</button><ChevronRight size={12} /><span>音乐影像</span></div>
          <section className="project-heading"><div className="project-heading-left"><div className="project-title-row"><h1>{project.title}</h1><span className="artist-name">司凤版</span><button className="project-edit" aria-label="修改影片名称" onClick={() => { setNameDraft(project.title); openDialog('rename'); }}><Pencil size={13} /></button><button className="style-badge" onClick={() => { setView('create'); setTab('style'); }}><Sparkles size={12} />治愈系 Soft 3D</button></div><p>把想念交给雨，把温柔留给你。</p></div><div className="project-actions"><span className="save-status"><CheckCheck size={14} />{saveState === 'saving' ? '保存中...' : saveState === 'saved' ? '已自动保存' : '仅本次会话'}</span><button className="button button-secondary preview-button" onClick={(event) => { setView('create'); player.current?.toggle(event); }}>{playing ? <Pause size={15} /> : <Play size={15} />}<span>{playing ? '暂停预览' : '预览 MV'}</span></button><button className="button button-primary" onClick={() => openDialog('export')}><Download size={16} />导出影片<ChevronDown size={13} /></button></div></section>

          <div className={view === 'create' ? 'editor-grid' : 'editor-grid editor-hidden'}>
            <section className="preview-panel" aria-label="MV 画面预览"><div className="preview-heading"><div className="section-title"><span className="preview-heading-icon"><Film size={16} /></span><h2>画面预览</h2></div><div className="preview-heading-right"><span className="live-label"><span />实时预览</span><span className="mini-divider" /><span className="aspect-label">16:9</span><IconButton label="全屏预览" onClick={() => void fullscreen()}><Expand size={14} /></IconButton></div></div>
              <div className="video-stage"><Player ref={player} component={RainLove} inputProps={inputProps} durationInFrames={TOTAL_FRAMES} initialFrame={INITIAL_FRAME} compositionWidth={1920} compositionHeight={1080} fps={FPS} style={{ width: '100%', aspectRatio: '16 / 9' }} controls={false} clickToPlay doubleClickToFullscreen initialVolume={0.8} playbackRate={rate} loop={loop} moveToBeginningWhenEnded={false} numberOfSharedAudioTags={1} errorFallback={() => <div className="player-error"><CloudRain size={36} /><p>画面暂时走神了，刷新页面再试一次。</p></div>} /></div>
              <div className="transport"><input className="seek-range" type="range" min="0" max={TOTAL_FRAMES - 1} value={frame} aria-label="影片播放进度" onChange={(event) => seek(Number(event.target.value) / FPS)} style={{ '--seek-progress': `${frame / (TOTAL_FRAMES - 1) * 100}%` } as CSSProperties} /><div className="transport-row"><div className="transport-left"><IconButton label="后退 5 秒" onClick={() => seek(frame / FPS - 5)}><SkipBack size={16} /></IconButton><button className="play-button" aria-label={playing ? '暂停播放' : '播放影片'} onClick={(event) => player.current?.toggle(event)}>{playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}</button><IconButton label="前进 5 秒" onClick={() => seek(frame / FPS + 5)}><SkipForward size={16} /></IconButton><span className="time-display"><b>{formatTime(frame / FPS)}</b><span>/</span>{formatTime(DURATION)}</span></div><div className="transport-right"><IconButton label={loop ? '关闭循环播放' : '循环播放'} active={loop} onClick={() => setLoop(!loop)}><Repeat2 size={15} /></IconButton><div className="volume-control"><IconButton label={muted ? '取消静音' : '静音'} onClick={toggleMute}>{muted ? <VolumeX size={16} /> : <Volume2 size={16} />}</IconButton><input type="range" aria-label="音量" min="0" max="1" step="0.05" value={muted ? 0 : volume} onChange={(event) => { const value = Number(event.target.value); setVolume(value); player.current?.setVolume(value); if (value > 0) { player.current?.unmute(); setMuted(false); } }} /></div><select className="playback-rate" value={rate} aria-label="播放速度" onChange={(event) => setRate(Number(event.target.value))}><option value="0.75">0.75x</option><option value="1">1.0x</option><option value="1.25">1.25x</option><option value="1.5">1.5x</option></select><IconButton label="进入全屏" onClick={() => void fullscreen()}><Maximize size={15} /></IconButton></div></div></div>
              <div className="preview-footer"><span><span className="scene-dot" />{String(scene.id).padStart(2, '0')}<span className="footer-slash">/ 04</span><span className="current-scene-title">{scene.title}</span></span><span>1920 × 1080<span className="footer-mid-dot">·</span>30 FPS</span></div>
            </section>

            <div className="lyrics-column"><section className="lyrics-panel"><div className="panel-tabs" role="tablist"><button role="tab" aria-selected={tab === 'lyrics'} onClick={() => setTab('lyrics')} className={tab === 'lyrics' ? 'active' : ''}><Subtitles size={16} />歌词与字幕{tab === 'lyrics' && <motion.span layoutId="panel-tab" className="tab-underline" />}</button><button role="tab" aria-selected={tab === 'style'} onClick={() => setTab('style')} className={tab === 'style' ? 'active' : ''}><SlidersHorizontal size={15} />画面风格{tab === 'style' && <motion.span layoutId="panel-tab" className="tab-underline" />}</button></div>
              {tab === 'lyrics' ? <><div className="lyrics-intro"><div><span className="synced-label"><span><Check size={10} strokeWidth={3} /></span>已对齐 {project.lyrics.length} 句歌词</span><button className="edit-lyrics-button" onClick={() => openDialog('lyrics')}><Pencil size={12} />编辑</button></div><p>点击歌词，走进对应的画面</p></div><div ref={lyricScroll} className="lyrics-scroll">{project.lyrics.map((line, index) => <button key={line.id} data-lyric={index} className={`lyric-row ${activeLine === index ? 'active' : ''}`} onClick={() => seek(line.start + 0.1)}><span className="lyric-number">{activeLine === index ? <AudioLines size={15} className={playing ? 'playing-lines' : ''} /> : String(index + 1).padStart(2, '0')}</span><span className="lyric-text">{line.text}</span><span className="lyric-time">{formatTime(line.start)}</span></button>)}</div><div className="lyrics-bottom"><div className="subtitle-toggle-line"><span><Type size={15} />画面字幕</span><Toggle label="显示中文字幕" checked={project.settings.showSubtitles} onChange={() => settings({ showSubtitles: !project.settings.showSubtitles })} /></div><button className="subtitle-style-link" onClick={() => setTab('style')}><span><span className="font-preview">Aa</span>{project.settings.subtitleStyle === 'clean' ? '极简白字' : '柔光衬底'}<span className="subtitle-style-size">{project.settings.fontSize} px · 底部居中</span></span><ChevronRight size={14} /></button></div></> : <div className="style-scroll"><StyleControls settings={project.settings} onChange={settings} /></div>}
            </section></div>
          </div>

          {view === 'storyboard' && <motion.section className="storyboard" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}><div className="storyboard-heading"><div><span className="eyebrow">THE STORY OF RAIN</span><h2>从一滴雨，到一道彩虹。</h2><p>四个情绪章节，陪想念走向释怀。</p></div><button className="button button-secondary" onClick={() => setView('create')}><ArrowLeft size={15} />返回创作</button></div><div className="storyboard-grid">{project.scenes.map((item, index) => { const Icon = [CloudRain, Heart, Cloud, Rainbow][index]; return <article className="storyboard-scene" key={item.id}><button className="storyboard-image" onClick={() => previewScene(item)}><img src={item.image} alt={item.title} /><span><Play size={21} fill="currentColor" /></span></button><div className="storyboard-scene-meta"><span><Icon size={14} />CHAPTER {String(index + 1).padStart(2, '0')}</span><span>{formatTime(item.from)} - {formatTime(item.to)}</span></div><div className="storyboard-title"><h3>{item.title}</h3><IconButton label={`编辑分镜 ${item.title}`} onClick={() => setSceneEditor(item)}><Pencil size={14} /></IconButton></div><p className="storyboard-subtitle">{item.subtitle}</p><p className="storyboard-direction">{item.direction}</p><button className="text-button" onClick={() => previewScene(item)}>走进这一幕<ArrowRight size={14} /></button></article>; })}</div></motion.section>}

          <Timeline project={project} frame={frame} onSeek={(time) => { setView('create'); seek(time); }} undo={() => setHistoryIndex(Math.max(0, historyIndex - 1))} redo={() => setHistoryIndex(Math.min(history.length - 1, historyIndex + 1))} canUndo={historyIndex > 0} canRedo={historyIndex < history.length - 1} muted={muted} onMute={toggleMute} />
          <footer className="workspace-footer"><span><Leaf size={13} />慢一点，美好正在发生。</span><span>Made with <span className="remotion-symbol" /> Remotion<span className="footer-mid-dot">·</span>用画面，拥抱每一种心情</span></footer>
        </motion.main>

        <AnimatePresence>
          {dialog === 'export' && <ExportDialog key="export" project={project} scene={scene} onClose={() => setDialog(null)} />}
          {dialog === 'lyrics' && <LyricEditor key="lyrics" lyrics={project.lyrics} onSave={(lyrics) => { commit({ ...project, lyrics }); setToast('每一句温柔，都已保存。'); }} onClose={() => setDialog(null)} />}
          {dialog === 'rename' && <Modal key="rename" title="为这段故事命名" subtitle="这个名字也会出现在影片的开场。" onClose={() => setDialog(null)}><label className="field-label">影片名称<input value={nameDraft} onChange={(event) => setNameDraft(event.target.value)} maxLength={14} autoFocus onKeyDown={(event) => { if (event.key === 'Enter' && nameDraft.trim()) { commit({ ...project, title: nameDraft.trim() }); setDialog(null); } }} /></label><div className="modal-actions"><button className="button button-primary" disabled={!nameDraft.trim()} onClick={() => { commit({ ...project, title: nameDraft.trim() }); setDialog(null); }}>保存名称<Check size={15} /></button></div></Modal>}
          {dialog === 'assets' && <Modal key="assets" title="故事里的小小世界" subtitle="四张原创软 3D 场景，已经安放在影片里。点击可定位对应分镜。" onClose={() => setDialog(null)} wide><div className="asset-grid">{project.scenes.map((item) => <article key={item.id}><button onClick={() => { setDialog(null); setView('create'); seek(item.from); }}><img src={item.image} alt={item.title} /></button><div><span>{item.title}<small>1568 × 882 · 场景原画</small></span><a className="icon-button" href={item.image} download={`${item.title}.png`} aria-label={`下载${item.title}原画`}><ArrowDownToLine size={17} /></a></div></article>)}</div><div className="asset-audio"><Music2 size={20} /><div><strong>雨爱 · 司凤版</strong><p>原始音轨 · AAC · 02:11</p></div><a className="icon-button" href={AUDIO_SRC} download="雨爱-司凤版.m4a" aria-label="下载音乐素材"><Download size={17} /></a></div></Modal>}
          {dialog === 'audio' && <Modal key="audio" title="听见雨，听见想念" subtitle="影片使用你提供的司凤版原声，音频已从源文件中无损提取。" onClose={() => setDialog(null)}><div className="music-art"><img src="/images/rain-window.png" alt="雨爱的音乐封面" /><div><span>ORIGINAL SOUNDTRACK</span><h3>雨爱</h3><p>司凤版 · 02:11</p></div></div><div className="music-player"><button className="play-button" onClick={(event) => player.current?.toggle(event)} aria-label={playing ? '暂停音乐' : '播放音乐'}>{playing ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" />}</button><input className="style-range" type="range" aria-label="音乐进度" min="0" max={TOTAL_FRAMES - 1} value={frame} onChange={(e) => seek(Number(e.target.value) / FPS)} /><span>{formatTime(frame / FPS)}</span></div><div className="setting-line"><div><strong>原声音量</strong><p>预览音量，导出时保留原声</p></div><input className="volume-slider" type="range" min="0" max="1" step="0.05" value={volume} aria-label="原声音量" onChange={(e) => { const value = Number(e.target.value); setVolume(value); player.current?.setVolume(value); }} /></div><div className="modal-actions"><a className="button button-secondary" href="https://github.com/aavvcasdas/latest-aiyunying/blob/arena/25fbb036-latest-aiyunying/%E3%80%8A%E9%9B%A8%E7%88%B1%E3%80%8B%E5%8F%B8%E5%87%A4%E7%89%88.mp3" target="_blank" rel="noreferrer">查看原始音源<ArrowRight size={14} /></a><a className="button button-primary" href={AUDIO_SRC} download="雨爱-司凤版.m4a"><Download size={15} />下载原声</a></div></Modal>}
          {dialog === 'settings' && <Modal key="settings" title="创作，也可以很轻松" subtitle="项目保存在当前浏览器中，你的修改会自动留存。" onClose={() => setDialog(null)}><div className="project-info-list"><div><span>影片名称</span><strong>{project.title} · 司凤版</strong></div><div><span>画幅与帧率</span><strong>16:9 · 1920 × 1080 · 30 fps</strong></div><div><span>故事长度</span><strong>02:11 · 4 个章节 · {project.lyrics.length} 句字幕</strong></div><div><span>存储状态</span><strong className="tiny-success"><Check size={14} />本地自动保存</strong></div></div><div className="setting-line"><div><strong>循环播放</strong><p>让雨声，再陪你一会儿</p></div><Toggle checked={loop} onChange={() => setLoop(!loop)} label="项目循环播放" /></div><div className="settings-links"><button onClick={() => importInput.current?.click()}><Upload size={16} />导入项目备份<ChevronRight size={15} /></button><button onClick={() => { downloadBlob(new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' }), `${project.title}-project.json`); setToast('项目文件已保存到下载文件夹。'); }}><Download size={16} />备份当前项目<ChevronRight size={15} /></button><button onClick={() => { commit(DEFAULT_PROJECT); setDialog(null); seek(0); setToast('已恢复初始创作，可通过撤销找回修改。'); }}><Repeat2 size={16} />恢复初始创作<ChevronRight size={15} /></button></div></Modal>}
          {dialog === 'help' && <Modal key="help" title="让灵感，轻轻流动" subtitle="欢迎来到雨映，一个把歌词变成温柔画面的地方。" onClose={() => setDialog(null)}><div className="help-steps"><div><span>01</span><div><strong>听一听这场雨</strong><p>点击播放，音乐、画面和中文字幕会一起展开。</p></div></div><div><span>02</span><div><strong>走进每一句歌词</strong><p>点击右侧歌词或下方分镜，跳转到对应的时刻。你也可以编辑字幕和微调时间。</p></div></div><div><span>03</span><div><strong>留下属于你的温柔</strong><p>调整色调与字幕样式，再导出带原声的完整 MV。修改自动保存在当前浏览器。</p></div></div></div><div className="keyboard-shortcuts"><span><kbd>Space</kbd>播放 / 暂停</span><span><kbd>←</kbd><kbd>→</kbd>跳转 5 秒</span><span><kbd>M</kbd>静音</span></div><button className="button button-primary help-button" onClick={() => setDialog(null)}>开始我的创作<Sparkles size={15} /></button></Modal>}
          {sceneEditor && <SceneEditor key="scene-editor" scene={sceneEditor} onClose={() => setSceneEditor(null)} onSave={(updated) => { commit({ ...project, scenes: project.scenes.map((item) => item.id === updated.id ? updated : item) }); setToast('这一幕的故事，已更新。'); }} />}
        </AnimatePresence>
        <AnimatePresence>{toast && <motion.div role="status" className="toast" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}><span><Check size={14} /></span>{toast}</motion.div>}</AnimatePresence>
      </div>
    </MotionConfig>
  );
}
