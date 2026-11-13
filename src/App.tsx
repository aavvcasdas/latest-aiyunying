import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDownToLine, ArrowRight, ArrowUpRight, BookOpen, Box, Check, ChevronRight, CircleHelp, Code2, Download, FileCode2, Grid2X2, History, Layers3, Menu, MonitorPlay, Play, ShieldCheck, Sparkles, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CHARACTERS, REPOSITORY, asset, type Action, type Background, type Character, type View } from './data';
import PreviewPanel, { Toggle } from './components/Preview';
import { ActionTile, CategoryTabs, EmptyResults, SearchInput } from './components/MotionLibrary';
import Dialog from './components/Dialog';
import Documentation from './components/Documentation';
import { Github } from './components/Icons';

type Modal = 'help' | 'changelog' | 'patch' | 'expanded' | null;
function getInitialCharacter() {
  try { return CHARACTERS.find((c) => c.id === localStorage.getItem('motion-character')) || CHARACTERS[0]; }
  catch { return CHARACTERS[0]; }
}

export default function App() {
  const [view, setView] = useState<View>('preview');
  const [character, setCharacter] = useState<Character>(getInitialCharacter);
  const [actionId, setActionId] = useState('idle');
  const [category, setCategory] = useState('全部动作');
  const [query, setQuery] = useState('');
  const [libraryCharacter, setLibraryCharacter] = useState('all');
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [rate, setRate] = useState(1);
  const [loop, setLoop] = useState(true);
  const [background, setBackground] = useState<Background>('lilac');
  const [compare, setCompare] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const [patch, setPatch] = useState('');
  const [toast, setToast] = useState('');
  const [mobileNav, setMobileNav] = useState(false);
  const [guideTab, setGuideTab] = useState('quick');
  const searchRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const action = character.actions.find((a) => a.id === actionId) || character.actions[0];

  const notify = useCallback((message: string) => {
    clearTimeout(toastTimer.current); setToast(message);
    toastTimer.current = setTimeout(() => setToast(''), 3400);
  }, []);
  const navigate = (next: View) => {
    setView(next); setQuery(''); setCategory('全部动作'); setMobileNav(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const guide = () => { navigate('docs'); setGuideTab('guide'); };
  const chooseCharacter = (next: Character) => {
    setCharacter(next); setActionId('idle'); setFrame(0); setPlaying(true); setCategory('全部动作'); setQuery('');
    try { localStorage.setItem('motion-character', next.id); } catch { /* Storage is optional. */ }
  };
  const chooseAction = (next: Action, owner = character) => {
    setCharacter(owner); setActionId(next.id); setFrame(0); setPlaying(true);
    if (view === 'library') { setView('preview'); setQuery(''); setCategory('全部动作'); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  };
  const togglePlayback = useCallback(() => {
    if (!loop && frame === 23) setFrame(0);
    setPlaying((previous) => !previous);
  }, [loop, frame]);

  useEffect(() => {
    if (!playing || view !== 'preview') return;
    let id: number, previous = performance.now(), carry = 0;
    const tick = (now: number) => {
      carry += Math.min(now - previous, 150) * 12 * rate / 1000; previous = now;
      const steps = Math.floor(carry);
      if (steps > 0) { carry -= steps; setFrame((current) => loop ? (current + steps) % 24 : Math.min(23, current + steps)); }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [playing, rate, loop, view]);
  useEffect(() => { if (frame === 23 && !loop) setPlaying(false); }, [frame, loop]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) return;
      if (event.key === ' ' && ['BUTTON', 'A'].includes(target.tagName)) return;
      if (event.key === ' ' && view === 'preview' && (!modal || modal === 'expanded')) { event.preventDefault(); togglePlayback(); }
      if (event.key === '/' && !modal && view !== 'docs') { event.preventDefault(); searchRef.current?.focus(); }
      if ((event.key === 'ArrowRight' || event.key === 'ArrowLeft') && view === 'preview' && (!modal || modal === 'expanded')) {
        event.preventDefault(); setPlaying(false); setFrame((f) => (f + (event.key === 'ArrowRight' ? 1 : 23)) % 24);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view, modal, togglePlayback]);
  useEffect(() => {
    if (modal !== 'patch' || patch) return;
    fetch('/downloads/motion-v2.patch').then((r) => { if (!r.ok) throw new Error('Patch unavailable'); return r.text(); }).then(setPatch).catch(() => notify('补丁读取失败，请尝试直接下载。'));
  }, [modal, patch, notify]);

  const headings = {
    preview: ['小小角色，鲜活动起来。', '为 latest-aiyunying 打磨的像素动作，让每一次出场都恰到好处。'],
    library: ['好动作，值得下一个故事。', '九位伙伴，一百零八种表达。找到合适的动作，带回你的项目。'],
    docs: ['从这里，让角色动起来。', '素材、补丁和替换指南都已备好，接下来交给你的故事。'],
  };
  const downloadProps = (label: string) => ({ onClick: () => notify(`正在下载${label}，请查看浏览器下载列表。`) });
  const previewProps = { character, action, frame, playing, rate, loop, background, compare, onPlay: togglePlayback, onFrame: (value: number) => { setPlaying(false); setFrame(value); }, onRate: setRate, onLoop: () => setLoop((v) => !v), onCompare: setCompare, onExpand: () => setModal('expanded') };
  const visibleActions = character.actions.filter((a) => (category === '全部动作' || a.category === category) && `${a.name} ${a.id} ${a.description}`.toLowerCase().includes(query.toLowerCase()));
  const libraryActions = CHARACTERS.filter((c) => libraryCharacter === 'all' || c.id === libraryCharacter).flatMap((owner) => owner.actions.map((item) => ({ owner, item }))).filter(({ owner, item }) => (category === '全部动作' || item.category === category) && `${item.name} ${item.id} ${owner.name} ${owner.model}`.toLowerCase().includes(query.toLowerCase()));

  return <div className="app-shell">
    {mobileNav && <button className="mobile-backdrop" aria-label="关闭导航" onClick={() => setMobileNav(false)} />}
    <aside className={`sidebar ${mobileNav ? 'is-open' : ''}`}>
      <button className="brand" onClick={() => navigate('preview')} aria-label="AI 动作工坊首页"><span className="brand-mark"><span /><span /><span /></span><span><strong>AI 动作工坊<span className="brand-dot">.</span></strong><small>MAKE CHARACTERS ALIVE</small></span></button>
      <div className="sidebar-project"><span className="project-icon"><Box size={17} /></span><div><strong>latest-aiyunying</strong><span>人物动作重制计划</span></div><span className="project-dot" /></div>
      <div className="nav-label">工作空间</div>
      <nav className="main-nav" aria-label="主导航"><button className={view === 'preview' ? 'active' : ''} onClick={() => navigate('preview')}><MonitorPlay size={18} />动作工作台<span className="active-nav-dot" /></button><button className={view === 'library' ? 'active' : ''} onClick={() => navigate('library')}><Grid2X2 size={18} />动作资源库<span className="nav-count">108</span></button><button className={view === 'docs' ? 'active' : ''} onClick={() => { navigate('docs'); setGuideTab('quick'); }}><FileCode2 size={18} />补丁与集成</button></nav>
      <div className="nav-label resources-label">资源与帮助</div>
      <nav className="main-nav secondary-nav" aria-label="资源导航"><button onClick={guide}><BookOpen size={17} />人物替换指南<ArrowUpRight size={14} className="nav-end" /></button><button onClick={() => setModal('changelog')}><History size={17} />更新日志<span className="tiny-new">NEW</span></button><a href={REPOSITORY} target="_blank" rel="noreferrer"><Github size={17} />查看源项目<ArrowUpRight size={14} className="nav-end" /></a></nav>
      <div className="sidebar-bottom"><div className="sidebar-note"><span className="note-spark"><Sparkles size={20} strokeWidth={1.5} /></span><p>每个小动作，<br />都有一点大不同。</p><span>MADE FOR YOUR LITTLE WORLD</span></div><button className="help-link" onClick={() => setModal('help')}><CircleHelp size={17} /><span>需要一点帮助？</span><ChevronRight size={14} /></button><div className="sidebar-version"><span><span className="status-dot" />本地资源已就绪</span><span>v2.0.0</span></div></div>
    </aside>
    <div className="workspace">
      <header className="topbar"><div className="breadcrumb"><button className="mobile-menu icon-button" aria-label="打开导航" onClick={() => setMobileNav(true)}><Menu size={21} /></button><Layers3 size={16} /><span>工作空间</span><ChevronRight size={13} /><strong>人物动作优化</strong></div><div className="topbar-right"><span className="ready-label"><span className="status-dot" />像素不变，生命力升级</span><span className="topbar-divider" /><button className="icon-button" aria-label="使用帮助" onClick={() => setModal('help')}><CircleHelp size={18} /></button><a className="icon-button github-link" href={REPOSITORY} target="_blank" rel="noreferrer" aria-label="GitHub 源项目"><Github size={19} /></a><span className="user-avatar">M<span /></span></div></header>
      <main className="main-content">
        <motion.section className="page-heading" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .5 }}><div><div className="page-eyebrow"><span />A LITTLE MORE ALIVE</div><h1>{headings[view][0]}</h1><p>{headings[view][1]}</p></div><div className="heading-actions"><button className="button button-secondary" onClick={guide}><BookOpen size={16} />替换指南</button><a className="button button-primary" href="/downloads/ai-motion-v2-complete.zip" download {...downloadProps('完整资源包')}><Download size={16} />下载完整资源包</a></div></motion.section>
        <div className="workspace-tabs"><div role="tablist" aria-label="工作台视图"><button role="tab" aria-selected={view === 'preview'} className={view === 'preview' ? 'selected' : ''} onClick={() => navigate('preview')}><Play size={15} />动作预览</button><button role="tab" aria-selected={view === 'library'} className={view === 'library' ? 'selected' : ''} onClick={() => navigate('library')}><Grid2X2 size={15} />动作资源库</button><button role="tab" aria-selected={view === 'docs'} className={view === 'docs' ? 'selected' : ''} onClick={() => navigate('docs')}><Code2 size={16} />补丁与文档</button></div><span className="workspace-meta"><span className="status-dot" />9 位角色<span className="meta-separator">/</span>108 组动作<span className="version-label">V2.0</span></span></div>
        <AnimatePresence mode="wait">
          {view === 'preview' && <motion.div key="preview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: .25 }}>
            <section className="workbench" aria-label="人物动作预览与设置"><PreviewPanel {...previewProps} /><aside className="character-settings"><div className="panel-heading"><h2>选择角色</h2><span>9 位伙伴</span></div><div className="selected-character"><strong>{character.name}</strong><span>{character.model}</span>{character.id === 'whale' && <small>主角</small>}</div><div className="character-grid">{CHARACTERS.map((c) => <button key={c.id} className={`character-choice ${c.id === character.id ? 'selected' : ''}`} onClick={() => chooseCharacter(c)} aria-label={`选择${c.name}`} aria-pressed={c.id === character.id} title={c.description}><span className="character-avatar"><img src={asset(c.id, 'avatar.png')} alt="" />{c.id === character.id && <span className="avatar-check"><Check size={9} strokeWidth={3} /></span>}</span><span>{c.name}</span></button>)}</div><div className="preview-options"><div className="option-row"><span>预览背景</span><div className="background-options">{(['lilac', 'transparent', 'dark'] as Background[]).map((bg) => <button key={bg} className={`background-swatch swatch-${bg} ${background === bg ? 'selected' : ''}`} onClick={() => setBackground(bg)} aria-label={`${bg === 'lilac' ? '浅紫' : bg === 'transparent' ? '透明棋盘' : '深色'}背景`} aria-pressed={background === bg}>{background === bg && <Check size={12} />}</button>)}</div></div><div className="option-row"><span>循环播放</span><Toggle checked={loop} onClick={() => setLoop((v) => !v)} label="循环播放" /></div></div><a className="button download-current" href={asset(character.id, `${action.id}.gif`)} download={`${character.id}-${action.id}.gif`} {...downloadProps(`${character.name} · ${action.name}`)}><ArrowDownToLine size={15} />下载当前 GIF<span>{Math.round(action.gifBytes / 1024)} KB</span></a></aside></section>
            <section className="motion-library" aria-label="角色动作库"><div className="section-heading"><div className="section-title"><h2>动作库<span>12</span></h2><p>一点日常，一点情绪，还有她独有的小习惯。</p></div><div className="library-tools"><SearchInput value={query} onChange={setQuery} inputRef={searchRef} /><a className="text-button" href={`/downloads/${character.id}-motion-v2.zip`} download {...downloadProps(`${character.name}的角色资源`)}><Download size={15} />下载角色资源</a></div></div><div className="library-filter"><CategoryTabs value={category} onChange={setCategory} /><span className="library-hint"><span className="mint-dot" />点击动作，即刻预览</span></div>{visibleActions.length ? <div className="action-grid">{visibleActions.map((item, index) => <ActionTile key={`${character.id}-${item.id}`} owner={character} action={item} index={index} selected={item.id === action.id} onSelect={() => chooseAction(item)} onDownload={() => notify(`正在下载${item.name} GIF`)} />)}</div> : <EmptyResults onReset={() => { setQuery(''); setCategory('全部动作'); }} />}</section>
            <div className="workspace-footer"><span><ShieldCheck size={13} />透明背景 · 无缝循环 · PNG 图集同步提供</span><button onClick={() => { navigate('docs'); setGuideTab('notes'); }}>关于素材与使用边界<ArrowUpRight size={12} /></button></div>
          </motion.div>}
          {view === 'library' && <motion.section key="library" className="full-library" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><div className="library-intro"><div><h2>所有好动作，都在这里<span>108</span></h2><p>预览后按需下载，或者带走整套资源。</p></div><SearchInput value={query} onChange={setQuery} inputRef={searchRef} /></div><div className="character-library-filter"><button className={libraryCharacter === 'all' ? 'selected' : ''} onClick={() => setLibraryCharacter('all')}><span className="all-characters"><Layers3 size={22} /></span><span>全部角色</span></button>{CHARACTERS.map((c) => <button key={c.id} className={libraryCharacter === c.id ? 'selected' : ''} onClick={() => setLibraryCharacter(c.id)}><span><img src={asset(c.id, 'avatar.png')} alt="" /></span><span>{c.name}</span></button>)}</div><div className="library-filter"><CategoryTabs value={category} onChange={setCategory} /><span className="results-count">找到 {libraryActions.length} 组动作</span></div>{libraryActions.length ? <div className="action-grid">{libraryActions.map(({ item, owner }, index) => <ActionTile key={`${owner.id}-${item.id}`} owner={owner} action={item} index={index % 12} showOwner onSelect={() => chooseAction(item, owner)} onDownload={() => notify(`正在下载${owner.name} · ${item.name}`)} />)}</div> : <EmptyResults onReset={() => { setQuery(''); setCategory('全部动作'); setLibraryCharacter('all'); }} />}</motion.section>}
          {view === 'docs' && <motion.div key="docs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><Documentation tab={guideTab} setTab={setGuideTab} actionId={action.id} notify={notify} onPatch={() => setModal('patch')} /></motion.div>}
        </AnimatePresence>
      </main>
    </div>
    <AnimatePresence>{toast && <motion.div className="toast" role="status" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}><span><Check size={15} /></span>{toast}<button aria-label="关闭提示" onClick={() => setToast('')}><X size={14} /></button></motion.div>}</AnimatePresence>
    <AnimatePresence>{modal && <Dialog title={modal === 'help' ? '给动作工坊的一点说明' : modal === 'changelog' ? '让小世界，一点点变好。' : modal === 'patch' ? '引擎集成补丁' : '大一点，看仔细一点。'} onClose={() => setModal(null)} wide={modal === 'expanded' || modal === 'patch'}>
      {modal === 'expanded' ? <PreviewPanel {...previewProps} expanded /> : modal === 'help' ? <div className="help-content"><p>选择一位角色，再点击喜欢的动作。可逐帧查看、调节速度，或切换背景检查透明边缘。</p><div className="shortcut-list"><span>播放 / 暂停<kbd>Space</kbd></span><span>前一帧 / 后一帧<span><kbd>←</kbd><kbd>→</kbd></span></span><span>搜索动作<kbd>/</kbd></span><span>关闭弹窗<kbd>Esc</kbd></span></div><div className="help-note"><ShieldCheck size={19} /><p>GIF 与 PNG 渲染资源同步提供。项目授权尚需确认，请在公开发布前核实素材来源。</p></div><button className="button button-primary" onClick={() => { setModal(null); guide(); }}>阅读替换指南<ArrowRight size={15} /></button></div> : modal === 'changelog' ? <div className="changelog"><span className="release-label">V2.0.0 · MOTION REWORK</span><h3>熟悉的角色，新的小动作。</h3><p>保留九位伙伴的原始像素辨识度，补充自然呼吸、情绪表达与设定专属动作。</p><ul><li><Check size={15} />108 组透明 GIF 与二十四帧 PNG 图集</li><li><Check size={15} />专属动作：递饭、翻书、沙漏、卷轴与查证</li><li><Check size={15} />确定性动作 API，支持逐帧与分段渲染</li><li><Check size={15} />可回滚安装器与中文图片替换指南</li></ul><p className="muted">程序分层动画扩展，不包含全新手绘立绘或口型同步。</p></div> : <div className="patch-modal"><div><span>motion-v2.patch</span><a href="/downloads/motion-v2.patch" download className="text-button" {...downloadProps('补丁')}><Download size={15} />下载补丁</a></div><pre>{patch || '正在读取补丁...'}</pre></div>}
    </Dialog>}</AnimatePresence>
  </div>;
}