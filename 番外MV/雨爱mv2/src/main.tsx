import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { loadFonts } from "./engine/fonts";

// 先把随片打包的字体注册好再画页面：这样没有系统中文字体的环境里，页面文字从第一帧起就能落到它上面
// （字体是内联的 data URI，几十毫秒就好；真加载失败也照常开页面，合成里会再报一次）。
const mount = () =>
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
loadFonts().then(mount, mount);
