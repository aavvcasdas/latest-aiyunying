import { useEffect, useRef, useState, type RefObject } from 'react';
import { Expand, Minimize2, Pause, Play, Settings2, SkipBack, SkipForward, Volume2, VolumeX, X } from 'lucide-react';
import { formatTime } from '../data/mv';
import { assetNames, renderMV, type ImageAssets, type RenderOptions } from '../lib/renderMV';

export function useMVAssets() {
  const [assets, setAssets] = useState<ImageAssets>({});
  const [error, setError] = useState(false);
  useEffect(() => {
    let disposed = false;
    const loaded: ImageAssets = {};
    const requests = assetNames.map((name) => new Promise<void>((resolve, reject) => {
      const image = new Image();
      image.onload = () => { loaded[name] = image; resolve(); };
      image.onerror = () => reject(new Error(`Missing original asset: ${name}`));
      image.src = `/assets/${name}.${name.startsWith('scene-') ? 'jpg' : 'png'}`;
    }));
    Promise.all([...requests, document.fonts.load('20px "ZCOOL KuaiLe"')])
      .then(() => { if (!disposed) setAssets(loaded); })
      .catch(() => { if (!disposed) setError(true); });
    return () => { disposed = true; };
  }, []);
  return { assets, ready: Object.keys(assets).length > 0, error };
}

interface PlayerProps {
  audioRef: RefObject<HTMLAudioElement | null>;
  assets: ImageAssets;
  ready: boolean;
  assetError: boolean;
  time: number;
  duration: number;
  playing: boolean;
  volume: number;
  rate: number;
  immersive: boolean;
  options: RenderOptions;
  onPlay: () => void;
  onSeek: (time: number) => void;
  onSkip: (direction: number) => void;
  onVolume: (volume: number) => void;
  onRate: (rate: number) => void;
  onImmersive: () => void;
  onMotion: () => void;
}

export function Player(props: PlayerProps) {
  const { audioRef, assets, ready, time, duration, playing, options } = props;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [settings, setSettings] = useState(false);
  const settingsRef = useRef<HTMLDivElement>(null);
  const lastVolume = useRef(0.7);

  useEffect(() => {
    if (!ready) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    let animation = 0;
    let lastFrame = -1;
    const paint = () => {
      const t = playing && audioRef.current ? audioRef.current.currentTime : time;
      // Rendering at 30 fps is sufficient for the source sprite animation.
      const frame = Math.floor(t * 30);
      if (frame !== lastFrame) {
        renderMV(ctx, assets, t, options);
        lastFrame = frame;
      }
      if (playing) animation = requestAnimationFrame(paint);
    };
    paint();
    return () => cancelAnimationFrame(animation);
  }, [assets, ready, playing, time, options, audioRef]);

  useEffect(() => {
    if (!settings) return;
    const close = (e: PointerEvent) => {
      if (!settingsRef.current?.contains(e.target as Node)) setSettings(false);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [settings]);

  const mute = () => {
    if (props.volume > 0) { lastVolume.current = props.volume; props.onVolume(0); }
    else props.onVolume(lastVolume.current);
  };

  return (
    <div className={`player ${props.immersive ? 'is-immersive' : ''}`}>
      {props.immersive && <div className="cinema-heading"><span>背对背拥抱 <small>鲸屿映画</small></span><button className="icon-button" onClick={props.onImmersive} aria-label="退出沉浸模式"><X size={22} /></button></div>}
      <div className="canvas-shell">
        {!ready && <img className="scene-placeholder" src="/assets/scene-twilight.jpg" alt="暮色中的纸艺花园" />}
        <canvas
          ref={canvasRef} width={1280} height={720}
          className={`mv-canvas ${ready ? 'is-ready' : ''}`}
          role="button" tabIndex={0} aria-label={playing ? '暂停 MV 画面' : '播放 MV 画面'}
          onClick={props.onPlay}
          onKeyDown={(e) => { if (e.key === 'Enter') props.onPlay(); }}
        />
        {!ready && <div className="scene-loading">{props.assetError ? <><span>原分支素材暂未加载成功</span><button onClick={() => window.location.reload()}>重新加载</button></> : <><span className="loading-orbit" /><span>正在展开纸上的世界...</span></>}</div>}
      </div>
      <div className="player-controls">
        <input
          className="seek-bar" aria-label="播放进度" type="range" min={0} max={duration} step={0.01} value={time}
          onChange={(e) => props.onSeek(Number(e.target.value))}
          style={{ '--progress': `${time / duration * 100}%` } as React.CSSProperties}
        />
        <div className="controls-row">
          <div className="transport">
            <button className="icon-button skip-button" aria-label="上一个分镜" onClick={() => props.onSkip(-1)}><SkipBack size={17} /></button>
            <button className="play-button" aria-label={playing ? '暂停' : '播放'} onClick={props.onPlay} disabled={!ready}>{playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}</button>
            <button className="icon-button skip-button" aria-label="下一个分镜" onClick={() => props.onSkip(1)}><SkipForward size={17} /></button>
            <div className="time-display"><span>{formatTime(time >= duration - 0.05 ? Math.round(time) : time)}</span><span className="time-divider">/</span><span>{formatTime(Math.round(duration))}</span></div>
          </div>
          <div className="playback-tools">
            <button className="icon-button" aria-label={props.volume === 0 ? '取消静音' : '静音'} onClick={mute}>{props.volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}</button>
            <input className="volume-slider" aria-label="音量" type="range" min={0} max={1} step={0.05} value={props.volume} onChange={(e) => props.onVolume(Number(e.target.value))} />
            <span className="quality-label">720P</span>
            <div className="settings-anchor" ref={settingsRef}>
              <button className={`icon-button ${settings ? 'is-active' : ''}`} aria-label="播放设置" aria-expanded={settings} onClick={() => setSettings(!settings)}><Settings2 size={17} /></button>
              {settings && <div className="player-settings"><h4>播放设置</h4><label><span>播放速度</span><select aria-label="播放速度" value={props.rate} onChange={(e) => props.onRate(Number(e.target.value))}><option value={0.75}>0.75x</option><option value={1}>1.0x</option><option value={1.25}>1.25x</option><option value={1.5}>1.5x</option></select></label><label><span>镜头与粒子动效</span><button className={`switch ${options.motion ? 'on' : ''}`} role="switch" aria-checked={options.motion} aria-label="镜头与粒子动效" onClick={props.onMotion}><span /></button></label><small>按空格播放，方向键快进或后退</small></div>}
            </div>
            <button className="icon-button" aria-label={props.immersive ? '退出沉浸模式' : '沉浸播放'} onClick={props.onImmersive}>{props.immersive ? <Minimize2 size={18} /> : <Expand size={18} />}</button>
          </div>
        </div>
      </div>
    </div>
  );
}