import React from 'react';
import { Composition, registerRoot } from 'remotion';
import { Three } from './Three';
import { START, TOTAL_END, H, W } from '../src/mv/core';

const FPS = 30;
const Root: React.FC = () => (
  <Composition
    id="ThreeMV"
    component={Three}
    durationInFrames={Math.round((TOTAL_END - START) * FPS)}
    fps={FPS}
    width={W}
    height={H}
  />
);
registerRoot(Root);
