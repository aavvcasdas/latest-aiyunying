import { Composition, registerRoot } from 'remotion';
import { RainLove } from './RainLove';
import { DEFAULT_PROJECT, FPS, TOTAL_FRAMES } from '../lib/project';

function RemotionRoot() {
  return <Composition id="RainLove" component={RainLove} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1920} height={1080} defaultProps={{ project: DEFAULT_PROJECT }} />;
}

registerRoot(RemotionRoot);