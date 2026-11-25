import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

// 体素文字在 Canvas 上生成，必须等本地中文字体载入后再初始化场景。
await document.fonts.load('15px "MV Local"');
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
