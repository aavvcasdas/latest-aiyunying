import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

// 不用 StrictMode：开发模式下它会把 effect 跑两遍，同一块 canvas 会被建两次 WebGL 渲染器。
createRoot(document.getElementById("root")!).render(<App />);
