// 离线出片入口：?render=1 时接管整个页面，只留一块 1920×1080 的画布，
// 由外部脚本逐帧驱动 window.__setFrame(t)。
//
// 原工程只有网页预览（音轨推着 requestAnimationFrame 跑），没有命令行出片的入口。
// core.ts 里 env.makeCanvas 本来就是为「离线抽帧时换成别的画布实现」留的注入点，
// 这里不动它，直接复用同一个 renderFilm(ctx, atlas, t) 纯函数——
// 同一个 t 永远画出同一帧，所以抽帧结果和网页里看到的完全一致。
import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import atlasUrl from './mv/assets/atlas.png';
import fontUrl from './mv/assets/font.woff';
import { DUR, H, W } from './mv/core';
import { loadFilm } from './render-loader';

function RenderApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const film = await loadFilm();
        if (dead) return;
        const cv = canvasRef.current!;
        cv.width = W;
        cv.height = H;
        const ctx = cv.getContext('2d')!;
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        // 外部驱动：给定秒数就画这一帧
        (window as unknown as { __setFrame: (t: number) => void }).__setFrame = (t: number) => {
          film.paint(ctx, t);
        };
        // 第一帧先画出来，外部确认画布非空再开始
        film.paint(ctx, 0);
        (window as unknown as { __ready: boolean }).__ready = true;
        setReady(true);
      } catch (e) {
        setErr(String(e));
        (window as unknown as { __error: string }).__error = String(e);
      }
    })();
    return () => { dead = true; };
  }, []);

  return (
    <div style={{ margin: 0, padding: 0, background: '#000', width: W, height: H }}>
      <canvas ref={canvasRef} style={{ display: 'block', width: W, height: H }} />
      {!ready && (
        <div style={{ position: 'fixed', left: 20, top: 20, color: err ? '#f66' : '#ccc', font: '16px monospace' }}>
          {err || 'loading…'}
        </div>
      )}
    </div>
  );
}

// 只在 ?render=1 时接管：网页预览（产品形态）完全不受影响
if (new URLSearchParams(location.search).get('render') === '1') {
  document.body.innerHTML = '<div id="render-root"></div>';
  document.body.style.margin = '0';
  document.body.style.overflow = 'hidden';
  createRoot(document.getElementById('render-root')!).render(<RenderApp />);
} else {
  // 正常预览：交给原来的 App
  void import('./App').then(({ default: App }) => {
    import('react').then(({ StrictMode }) => {
      createRoot(document.getElementById('root')!).render(
        <StrictMode>
          <App />
        </StrictMode>,
      );
    });
  });
}

export {};
