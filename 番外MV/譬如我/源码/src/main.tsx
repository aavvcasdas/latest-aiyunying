import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { loadFilm, drawFilm } from "./film/render";
import { DURATION } from "./data/film";

// 出片钩子：window.__mv.render(t) 渲一帧（1280×720，逐字立体字幕）并返回 JPEG dataURL。
// 与页面播放共用同一个确定性渲染器，所以任意跳转都得到同一帧。
{
  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext("2d", { alpha: false })!;
  let assets: Awaited<ReturnType<typeof loadFilm>> | null = null;
  const ready = loadFilm().then((a) => {
    assets = a;
    return true;
  });
  (window as unknown as { __mv: unknown }).__mv = {
    duration: DURATION,
    ready: () => assets !== null,
    render: (t: number) => {
      if (!assets) throw new Error("film assets not ready");
      const tt = Math.max(0, Math.min(DURATION, t));
      drawFilm(ctx, assets, tt, true, "character", false);
      return canvas.toDataURL("image/jpeg", 0.94);
    },
    whenReady: () => ready,
  };
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
