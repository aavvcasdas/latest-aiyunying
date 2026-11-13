import { motion } from 'framer-motion';
import { ChevronDown, Maximize2, Pause, Play, Repeat2, SkipBack, SkipForward } from 'lucide-react';
import type { CSSProperties } from 'react';
import { asset, type Action, type Background, type Character } from '../data';

export function Sprite({ character, action, frame, thumbnail, index = 0 }: { character: Character; action: Action; frame?: number; thumbnail?: boolean; index?: number }) {
  const fit = character.id === 'gpt' ? .86 : ['jump', 'happy', 'think', 'surprise', 'dance'].includes(action.id) ? .96 : 1;
  return <div role="img" aria-label={`${character.name}，${action.name}`} className={`sprite ${thumbnail ? 'sprite-thumbnail' : 'sprite-controlled'}`} style={{ '--sprite-fit': fit, backgroundImage: `url("${asset(character.id, `${action.id}.png`)}")`, ...(thumbnail ? { animationDelay: `${index * -.17}s` } : { backgroundPosition: `${(frame || 0) / 23 * 100}% 0` }) } as CSSProperties & { '--sprite-fit': number }} />;
}

export function Toggle({ checked, onClick, label }: { checked: boolean; onClick: () => void; label: string }) {
  return <button role="switch" aria-checked={checked} aria-label={label} onClick={onClick} className={`toggle ${checked ? 'is-on' : ''}`}><span /></button>;
}

export interface PreviewProps {
  character: Character; action: Action; frame: number; playing: boolean; rate: number;
  loop: boolean; background: Background; compare: boolean; expanded?: boolean;
  onPlay: () => void; onFrame: (frame: number) => void; onRate: (rate: number) => void;
  onLoop: () => void; onCompare: (compare: boolean) => void; onExpand: () => void;
}

export default function PreviewPanel(props: PreviewProps) {
  const { character, action, frame, playing, rate, loop, background, compare, expanded, onPlay, onFrame, onRate, onLoop, onCompare, onExpand } = props;
  return (
    <div className={`preview-panel ${expanded ? 'expanded-preview' : ''}`}>
      <div className="preview-toolbar"><h2><span className="live-dot" />实时预览</h2><div><div className="comparison-switch"><button className={!compare ? 'selected' : ''} onClick={() => onCompare(false)}>新版动作</button><button className={compare ? 'selected' : ''} onClick={() => onCompare(true)}>原版对比</button></div>{!expanded && <><span className="toolbar-divider" /><button className="icon-button" aria-label="放大预览" onClick={onExpand}><Maximize2 size={15} /></button></>}</div></div>
      <div className={`preview-stage stage-${background} ${compare ? 'is-comparing' : ''}`}>
        <span className="stage-caption">A LITTLE MORE ALIVE.</span><span className="stage-spec">PNG SEQUENCE / 12 FPS</span>
        {!compare && <><span className="stage-word" aria-hidden="true">MOTION</span><span className="stage-ring ring-one" /><span className="stage-ring ring-two" /><span className="stage-plus plus-one">+</span><span className="stage-plus plus-two">+</span></>}
        <div className="stage-cast">
          {compare && <div className="cast-position original-position"><div className="stage-platform" /><img className="original-sprite" src={asset(character.id, 'original.png')} alt={`${character.name}原版待机静帧`} /><span className="compare-label">原版待机</span></div>}
          <motion.div className="cast-position" key={`${character.id}-${compare}`} initial={{ opacity: 0, scale: .94, y: 6 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 190, damping: 22 }}><div className="stage-platform" /><Sprite character={character} action={action} frame={frame} />{compare && <span className="compare-label">新版 · {action.name}</span>}</motion.div>
        </div>
        <div className="stage-character-label"><strong>{character.name}</strong><span>{character.model}</span></div><span className="transparent-label"><span className="checker-icon" />透明素材</span>
      </div>
      <div className="player">
        <div className="now-playing"><div><span className="action-indicator" /><strong>{action.name}</strong><code>{action.id}</code></div><span>24 帧<span>·</span>2.0 秒<span>·</span>{action.category}</span></div>
        <div className="player-controls">
          <button className={`play-button ${playing ? 'is-playing' : ''}`} aria-label={playing ? '暂停动画' : '播放动画'} title="播放 / 暂停 (Space)" onClick={onPlay}>{playing ? <Pause size={13} fill="currentColor" /> : <Play size={13} fill="currentColor" />}</button>
          <button className="icon-button step-button" aria-label="上一帧" onClick={() => onFrame((frame + 23) % 24)}><SkipBack size={13} /></button><button className="icon-button step-button" aria-label="下一帧" onClick={() => onFrame((frame + 1) % 24)}><SkipForward size={13} /></button>
          <input className="timeline" aria-label="动画帧" type="range" min="0" max="23" value={frame} onChange={(event) => onFrame(Number(event.target.value))} style={{ '--progress': `${frame / 23 * 100}%` } as CSSProperties} />
          <span className="time-display">{String(frame + 1).padStart(2, '0')}<span> / 24</span></span>
          <button className={`icon-button loop-button ${loop ? 'is-active' : ''}`} aria-label={loop ? '关闭循环播放' : '开启循环播放'} aria-pressed={loop} onClick={onLoop}><Repeat2 size={16} /></button>
          <div className="rate-control"><select aria-label="播放速度" value={rate} onChange={(event) => onRate(Number(event.target.value))}><option value="0.5">0.5x</option><option value="1">1x</option><option value="1.5">1.5x</option><option value="2">2x</option></select><ChevronDown size={11} /></div>
        </div>
      </div>
    </div>
  );
}