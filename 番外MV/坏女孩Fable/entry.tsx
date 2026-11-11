// Remotion 入口：一份合成，《坏女孩》fable5.2 版。出片命令见 tools/render_fable.mjs。
import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { Fable } from './Fable';
import { DUR, FPS, W, H } from './api/engine';

const Root: React.FC = () => (
  <Composition
    id="Fable"
    component={Fable}
    durationInFrames={Math.round((DUR as number) * (FPS as number))}
    fps={FPS as number}
    width={(W as number)}
    height={(H as number)}
  />
);

registerRoot(Root);
