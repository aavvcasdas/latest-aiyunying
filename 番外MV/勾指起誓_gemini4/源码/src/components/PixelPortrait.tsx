import React, { useEffect, useRef } from 'react';
import type { AtlasData } from '../engine/actors';

interface Props {
  atlas: AtlasData | null;
  cell: string;
  size?: number;
  className?: string;
}

/** 从已加载的 cast_atlas.png 无损整数倍渲染像素角色头像 */
export const PixelPortrait: React.FC<Props> = ({ atlas, cell, size = 44, className = '' }) => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv || !atlas) return;
    const r = atlas.rects[cell];
    if (!r) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    cv.width = r[2];
    cv.height = r[3];
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.drawImage(atlas.tex.image as CanvasImageSource, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3]);
  }, [atlas, cell]);

  return (
    <canvas
      ref={ref}
      style={{
        width: size,
        height: size,
        imageRendering: 'pixelated',
      }}
      className={`block shrink-0 ${className}`}
    />
  );
};
