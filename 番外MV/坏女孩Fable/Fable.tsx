// 《坏女孩》fable5.2 版：把那份 Canvas2D 引擎原样搬进 Remotion 合成里逐帧画。
// 引擎是纯函数 render(ctx, t)，同一个 t 永远给同一帧，所以并发、跳帧、分段渲染都一致。
import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { AbsoluteFill, Audio, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import atlasData from './assets/atlasData';
import fontData from './assets/fontData';
import { DUR, createFilm, W } from './api/engine';

type Film = { render: (g: CanvasRenderingContext2D, t: number, opts?: object) => unknown };

export const Fable: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cv = useRef<HTMLCanvasElement>(null);
  const film = useRef<Film | null>(null);
  const [handle] = useState(() => delayRender('坏女孩：等图集与字体', { timeoutInMilliseconds: 120000 }));
  const [ready, setReady] = useState(false);
  const released = useRef(false);

  // 图集（像素角色）与字体先就位，画面才有东西可画
  useLayoutEffect(() => {
    let dead = false;
    const img = new Image();
    const atlas = new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error('角色图集解码失败'));
      img.src = atlasData;
    });
    const font = (async () => {
      try {
        const ff = new FontFace('BG', `url("${fontData}")`);
        await ff.load();
        document.fonts.add(ff);
      } catch {
        /* 字体加载失败就退回系统字体，不至于整片不出 */
      }
    })();
    Promise.all([atlas, font])
      .then(() => {
        if (dead) return;
        film.current = createFilm({
          atlas: img,
          makeCanvas: (w: number, h: number) => {
            const c = document.createElement('canvas');
            c.width = w;
            c.height = h;
            return c;
          },
        }) as Film;
        setReady(true);
      })
      .catch(() => setReady(true));
    return () => { dead = true; };
  }, [handle]);

  // 图集和字体就位后（ready）再放行截帧：第一帧必须真的是画出来的，不能是空画布。
  useLayoutEffect(() => {
    if (!ready) return;
    const el = cv.current;
    const f = film.current;
    if (!el || !f) { if (!released.current) { released.current = true; continueRender(handle); } return; }
    const g = el.getContext('2d');
    if (!g) return;
    f.render(g, frame / fps, { subtitles: true });
    if (!released.current) { released.current = true; continueRender(handle); }
  }, [ready, frame, fps, handle]);

  const total = useMemo(() => Math.round(DUR * fps), [fps]);
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <canvas ref={cv} width={W} height={720} style={{ width: '100%', height: '100%', display: 'block' }} />
      <Audio src={staticFile('song.m4a')} />
      <TitleCard frame={frame} fps={fps} total={total} />
    </AbsoluteFill>
  );
};

/** 片头卡：只放歌名和歌手名两行，别的一律不放（字幕条里也不写歌手名）。 */
const TitleCard: React.FC<{ frame: number; fps: number; total: number }> = ({ frame, fps }) => {
  const t = frame / fps;
  const a = Math.min(1, Math.max(0, t / 0.45), Math.max(0, (1.55 - t) / 0.35));
  if (a <= 0.002) return null;
  const font = '"BG","ZCOOL KuaiLe","PingFang SC","Noto Sans CJK SC",sans-serif';
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-start', paddingTop: 74, opacity: a, pointerEvents: 'none' }}>
      {/* 一块软暗底，歌名压在像素画上也看得清 */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 330,
        background: 'linear-gradient(180deg, rgba(12,6,24,.82) 0%, rgba(12,6,24,.55) 46%, rgba(12,6,24,0) 100%)',
      }} />
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
          fontSize: 104, fontWeight: 900, letterSpacing: 16, color: '#fff', fontFamily: font, lineHeight: 1.08,
          textShadow: '0 0 24px rgba(255,120,190,.95), 0 0 56px rgba(120,180,255,.75), 0 5px 0 rgba(0,0,0,.6)',
          transform: `scale(${0.95 + 0.05 * a})`,
        }}>坏女孩</div>
        <div style={{
          marginTop: 10, padding: '6px 22px', borderRadius: 999, fontFamily: font,
          fontSize: 30, fontWeight: 700, letterSpacing: 6, color: '#fff4fb',
          background: 'rgba(20,8,32,.62)', border: '1px solid rgba(255,190,225,.55)',
          textShadow: '0 2px 8px rgba(0,0,0,.8)',
        }}>徐良 / 小凌</div>
      </div>
    </AbsoluteFill>
  );
};
