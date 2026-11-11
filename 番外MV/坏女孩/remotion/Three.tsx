// 《坏女孩》3d 版（three.js 软 3D）搬进 Remotion：每帧调一次 film.frame(T)，画到同一块 canvas 上。
// 引擎和镜头一行没改，动的是片头卡与歌词条（见 src/mv/film.ts 的 titleCard / lyric）。
import React, { useLayoutEffect, useRef, useState } from 'react';
import { AbsoluteFill, Audio, continueRender, delayRender, useCurrentFrame, useVideoConfig } from 'remotion';
import { START, AUDIO_OFFSET } from '../src/mv/core';
import { Film, loadAssets } from '../src/mv/film';
import song from '../src/assets/songData';

export const Three: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cv = useRef<HTMLCanvasElement>(null);
  const film = useRef<Film | null>(null);
  const [ready, setReady] = useState(false);
  const released = useRef(false);
  const [handle] = useState(() => delayRender('坏女孩 3D：等图集、字体与首帧', { timeoutInMilliseconds: 180000 }));

  useLayoutEffect(() => {
    let dead = false;
    loadAssets()
      .then((A) => {
        if (dead || !cv.current) return;
        film.current = new Film(A, cv.current, 1280, 720);
        setReady(true);
      })
      .catch(() => setReady(true));
    return () => { dead = true; };
  }, []);

  useLayoutEffect(() => {
    if (!ready) return;
    if (!film.current) { if (!released.current) { released.current = true; continueRender(handle); } return; }
    film.current.frame(START + frame / fps);
    if (!released.current) { released.current = true; continueRender(handle); }
  }, [ready, frame, fps, handle]);

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <canvas ref={cv} style={{ width: '100%', height: '100%', display: 'block' }} />
      <Audio src={song} trimBefore={Math.round((START - AUDIO_OFFSET) * fps)} />
    </AbsoluteFill>
  );
};
