// 整份源码原样带进 zip，解开就是能构建的工程。
// 注意：import.meta.glob 不会把写它的这个文件自己算进去，所以放在单独的模块里，App.tsx 再用 ?raw 把本文件补上。
export const SRC = import.meta.glob(["/src/**/*.{ts,tsx,css}", "/src/assets/*.txt", "/index.html", "/package.json", "/vite.config.ts", "/tsconfig.json", "/tools/*.cjs"], { query: "?raw", import: "default", eager: true }) as Record<string, string>;
export const SRC_ROOT = "番外MV/若是月亮还没来/源码/";
