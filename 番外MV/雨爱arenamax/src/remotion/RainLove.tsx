import { useMemo } from 'react';
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { Audio } from '@remotion/media';
import { useRainSans } from './font';
import { AUDIO_SRC, buildShots, currentLyric, getScene, type Project, type Scene } from '../lib/project';

export type RainLoveProps = { project: Project };

const clamp = { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' } as const;

function ScenePlane({ scene, frame, fps, project, opacity = 1 }: {
  scene: Scene; frame: number; fps: number; project: Project; opacity?: number;
}) {
  const progress = Math.max(0, Math.min(1, (frame / fps - scene.from) / (scene.to - scene.from)));
  const isFinal = scene.id === 4;
  const scale = isFinal ? 1.09 - progress * 0.07 : 1.02 + progress * 0.065;
  const x = scene.id % 2 ? progress * -14 : progress * 14;
  const y = scene.id === 3 ? Math.sin(frame / 95) * 9 : Math.sin(frame / 150) * 3;
  const filter = project.settings.palette === 'warm'
    ? 'sepia(0.16) saturate(0.91) brightness(1.04)'
    : project.settings.palette === 'dream'
      ? 'hue-rotate(12deg) saturate(0.8) brightness(1.04)'
      : 'none';

  return (
    <AbsoluteFill style={{ opacity, overflow: 'hidden' }}>
      <Img src={staticFile(scene.image.slice(1))} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `translate(${x}px, ${y}px) scale(${scale})`, filter }} />
      {project.settings.particles && (
        <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
          {Array.from({ length: scene.id < 3 ? 34 : 20 }, (_, i) => {
            const seed = (i * 137.508) % 1920;
            if (scene.id < 3) {
              const dropY = ((i * 89 + frame * (2.2 + (i % 4) * 0.55)) % 1160) - 60;
              return <line key={i} x1={seed} x2={seed - 3} y1={dropY} y2={dropY + 13 + (i % 3) * 5} stroke="white" strokeWidth={1.5} opacity={0.1 + (i % 4) * 0.035} strokeLinecap="round" />;
            }
            return <circle key={i} cx={seed + Math.sin(frame / 85 + i) * 20} cy={((i * 73 - frame * 0.3) % 1080 + 1080) % 1080} r={2 + i % 3} fill="#fff8d7" opacity={0.18 + (Math.sin(frame / 24 + i) + 1) * 0.2} />;
          })}
        </svg>
      )}
    </AbsoluteFill>
  );
}

export function RainLove({ project }: RainLoveProps) {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  // 字体没就绪就挂住这一帧（原来在模块顶层 delayRender，多帧并发时会漏清句柄）
  useRainSans();
  const seconds = frame / fps;
  const shots = useMemo(() => buildShots(project), [project]);
  const scene = getScene(shots, seconds);
  const index = shots.indexOf(scene);
  const previous = index > 0 ? shots[index - 1] : null;
  const transition = interpolate(frame, [scene.from * fps, scene.from * fps + 25], [0, 1], clamp);
  const lineIndex = currentLyric(project.lyrics, seconds);
  const line = lineIndex >= 0 ? project.lyrics[lineIndex] : null;
  const subtitleOpacity = line
    ? Math.min(interpolate(frame, [line.start * fps, line.start * fps + 7], [0, 1], clamp), interpolate(frame, [line.end * fps - 7, line.end * fps], [1, 0], clamp))
    : 0;
  const titleOpacity = interpolate(frame, [0, 20, 525, 585], [0.95, 1, 1, 0], clamp);
  const outroOpacity = interpolate(frame, [durationInFrames - 30, durationInFrames - 1], [0, 0.25], clamp);

  return (
    <AbsoluteFill style={{ backgroundColor: '#e7ebe5', fontFamily: 'Rain Sans, Noto Sans SC, sans-serif' }}>
      <Audio src={staticFile(AUDIO_SRC.slice(1))} volume={interpolate(frame, [durationInFrames - 35, durationInFrames], [1, 0], clamp)} />
      {previous && transition < 1 && <ScenePlane scene={previous} frame={frame} fps={fps} project={project} />}
      <ScenePlane scene={scene} frame={frame} fps={fps} project={project} opacity={previous ? transition : 1} />
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(38,56,48,0.1) 0%, transparent 35%, transparent 65%, rgba(28,40,34,0.24) 100%)' }} />
      <div style={{ position: 'absolute', left: 94, top: 73, color: '#fffdf7', opacity: titleOpacity, textShadow: '0 2px 20px rgba(38,56,48,0.13)' }}>
        <div style={{ fontSize: 66, fontWeight: 400, letterSpacing: 13 }}>{project.title}</div>
        <div style={{ fontSize: 16, fontWeight: 400, letterSpacing: 8, marginTop: 14 }}>RAINIE LOVE</div>
      </div>
      {project.settings.showSubtitles && line && (
        <div style={{ position: 'absolute', bottom: 78, width: '100%', display: 'flex', justifyContent: 'center', opacity: frame === 0 ? 1 : subtitleOpacity, transform: `translateY(${(1 - subtitleOpacity) * 5}px)` }}>
          <div style={{ fontSize: project.settings.fontSize, fontWeight: 450, letterSpacing: 4, lineHeight: 1.65, color: '#fffdf8', textAlign: 'center', textShadow: '0 2px 10px rgba(29,46,40,0.42)', padding: '7px 32px', borderRadius: 12, backgroundColor: project.settings.subtitleStyle === 'soft' ? 'rgba(39,53,46,0.34)' : 'transparent' }}>{line.text}</div>
        </div>
      )}
      {seconds > 125 && <div style={{ position: 'absolute', bottom: 105, width: '100%', color: '#fffdf6', fontSize: 40, letterSpacing: 7, textAlign: 'center', textShadow: '0 2px 12px rgba(30,50,30,0.3)', opacity: interpolate(frame, [3750, 3780], [0, 1], clamp) }}>雨会停，美好会发生。</div>}
      <AbsoluteFill style={{ backgroundColor: '#fdfbf4', opacity: outroOpacity }} />
    </AbsoluteFill>
  );
}