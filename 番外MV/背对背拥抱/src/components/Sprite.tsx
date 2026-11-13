import type { CSSProperties } from "react";
import atlasUrl from "@/assets/cast_atlas.png";
import { ATLAS_H, ATLAS_W, has, rect } from "@/lib/atlas";

/** 头像格（面板用）：直接从图集切，像素不插值 */
export function Portrait({ cell, size = 64 }: { cell: string; size?: number }) {
  if (!has(cell)) return null;
  const [x, y, w, h] = rect(cell);
  const k = size / Math.max(w, h);
  return (
    <div
      className="sprite"
      style={
        {
          "--k": k,
          width: w * k,
          height: h * k,
          backgroundImage: `url(${atlasUrl})`,
          backgroundSize: `${ATLAS_W * k}px ${ATLAS_H * k}px`,
          backgroundPosition: `${-x * k}px ${-y * k}px`,
        } as CSSProperties
      }
    />
  );
}
