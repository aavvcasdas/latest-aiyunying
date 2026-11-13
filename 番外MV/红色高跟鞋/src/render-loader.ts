// 出片用的素材加载器：图集 + 字体一并就绪，返回一个只依赖 t 的 paint(ctx, t)。
// 和网页预览用的是同一套 buildAtlas / renderFilm，参数完全一样。
import atlasUrl from './mv/assets/atlas.png';
import fontUrl from './mv/assets/font.woff';
import { DUR, H, W } from './mv/core';
import { renderFilm } from './mv/film';
import { buildAtlas, type Atlas } from './mv/sprites';

export interface Film {
  paint: (ctx: CanvasRenderingContext2D, t: number) => void;
  duration: number;
}

let cached: Promise<Film> | null = null;

export function loadFilm(): Promise<Film> {
  if (cached) return cached;
  cached = (async () => {
    // 字体：和 App.tsx 里同一个做法——无头环境没有任何中文字体，
    // 不显式加载，所有字都是豆腐块
    const font = new FontFace('MVFont', `url(${fontUrl})`);
    await font.load();
    document.fonts.add(font);
    await document.fonts.ready;

    const img = new Image();
    img.src = atlasUrl;
    await img.decode();

    const atlas: Atlas = buildAtlas(img, img.naturalWidth, img.naturalHeight);

    const paint = (ctx: CanvasRenderingContext2D, t: number) => {
      const time = Math.max(0, Math.min(DUR, t));
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      renderFilm(ctx, atlas, time);
      ctx.restore();
    };

    return { paint, duration: DUR };
  })();
  return cached;
}

export { DUR, H, W };
