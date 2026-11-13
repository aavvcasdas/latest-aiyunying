import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { ChevronDown, Film, Maximize2, Minus, Music2, Plus, Redo2, Subtitles, Undo2, Volume2, VolumeX } from 'lucide-react';
import { DURATION, formatTime, FPS, getScene, type Project } from '../lib/project';

export function Timeline({ project, frame, onSeek, undo, redo, canUndo, canRedo, muted, onMute }: {
  project: Project; frame: number; onSeek: (seconds: number) => void;
  undo: () => void; redo: () => void; canUndo: boolean; canRedo: boolean; muted: boolean; onMute: () => void;
}) {
  const [zoom, setZoom] = useState(100);
  const [waveform, setWaveform] = useState<number[]>([]);
  const viewport = useRef<HTMLDivElement>(null);
  const activeScene = getScene(project.scenes, frame / FPS);
  useEffect(() => { fetch('/audio/waveform.json').then((response) => response.json()).then(setWaveform).catch(() => setWaveform([])); }, []);

  const seekAt = (event: MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    onSeek(Math.max(0, Math.min(DURATION - 0.05, ((event.clientX - rect.left) / rect.width) * DURATION)));
  };

  return (
    <section className="timeline-panel" aria-label="分镜时间线">
      <div className="timeline-heading"><div className="section-title"><Film size={17} /><h2>分镜时间线</h2><span className="timeline-hint">让画面，跟着心跳</span></div><div className="timeline-tools"><button className="icon-button" aria-label="撤销" title="撤销" onClick={undo} disabled={!canUndo}><Undo2 size={16} /></button><button className="icon-button" aria-label="重做" title="重做" onClick={redo} disabled={!canRedo}><Redo2 size={16} /></button><i /><button className="icon-button" aria-label="缩小时间线" onClick={() => setZoom(Math.max(100, zoom - 25))} disabled={zoom === 100}><Minus size={15} /></button><span className="zoom-label">{zoom}%</span><button className="icon-button" aria-label="放大时间线" onClick={() => setZoom(Math.min(250, zoom + 25))} disabled={zoom === 250}><Plus size={15} /></button><button className="icon-button" aria-label="适应完整时间线" onClick={() => { setZoom(100); viewport.current?.scrollTo({ left: 0 }); }}><Maximize2 size={14} /></button></div></div>
      <div className="timeline-content">
        <div className="track-labels"><div className="track-label-spacer"><span>轨道</span><ChevronDown size={12} /></div><div className="track-label visual-label"><Film size={15} /><span>画面</span><small>04</small></div><div className="track-label music-label"><Music2 size={15} /><span>音乐</span><button aria-label={muted ? '打开音乐轨道' : '静音音乐轨道'} onClick={onMute}>{muted ? <VolumeX size={12} /> : <Volume2 size={12} />}</button></div><div className="track-label subtitle-label"><Subtitles size={15} /><span>字幕</span><small>{project.lyrics.length}</small></div></div>
        <div ref={viewport} className="timeline-viewport"><div className="timeline-tracks" style={{ width: `${zoom}%` }}>
          <div className="time-ruler" onClick={seekAt} role="presentation">{Array.from({ length: 9 }, (_, i) => <span key={i} style={{ left: `${i * 12.5}%` }}>{formatTime(i * DURATION / 8)}</span>)}</div>
          <div className="visual-track">{project.scenes.map((scene, index) => <button key={scene.id} className={`scene-clip scene-clip-${index + 1} ${activeScene.id === scene.id ? 'active' : ''}`} style={{ left: `${scene.from / DURATION * 100}%`, width: `${(scene.to - scene.from) / DURATION * 100}%` }} onClick={() => onSeek(scene.from)} title={`${scene.title} · ${formatTime(scene.from)}`}><img src={scene.image} alt={scene.title} /><span className="scene-clip-shade" /><span className="scene-clip-title"><b>{String(index + 1).padStart(2, '0')}</b>{scene.title}</span></button>)}</div>
          <div className={`audio-track ${muted ? 'track-muted' : ''}`} onClick={seekAt} role="presentation"><span className="audio-track-title"><Music2 size={11} />雨爱 · 司凤版</span><svg viewBox="0 0 1000 38" preserveAspectRatio="none" aria-label="原声波形">{waveform.map((value, i) => <line key={i} x1={i / waveform.length * 1000} x2={i / waveform.length * 1000} y1={19 - value * 16} y2={19 + value * 16} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />)}</svg></div>
          <div className={`subtitle-track ${!project.settings.showSubtitles ? 'track-muted' : ''}`}>{project.lyrics.map((line) => <button key={line.id} onClick={() => onSeek(line.start)} style={{ left: `${line.start / DURATION * 100}%`, width: `${(line.end - line.start) / DURATION * 100}%` }} title={line.text}>{line.text}</button>)}</div>
          <div className="timeline-playhead" style={{ left: `${frame / FPS / DURATION * 100}%` }}><span /></div>
        </div></div>
      </div>
      <div className="timeline-footer"><span><span className="small-dot" />音乐、镜头与字幕同步播放</span><span>点击分镜或波形，去往故事的任何一刻</span></div>
    </section>
  );
}