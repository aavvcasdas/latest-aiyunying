// 交付打包：remade.md + 分镜表 + 歌词.srt + cues.json + 完整源码与素材 → zip
// 文档里的时间全部从 timeline.ts 现算，不另抄一份数字。
import { zipSync, strToU8 } from "fflate";
import { LINES, DURATION, FPS } from "../mv/timeline";
import { SHOTS } from "../mv/shots";
import remade from "./remade.md?raw";
import prepare from "./prepare_assets.py?raw";
import castUrl from "../assets/cast.png?url";
import audioUrl from "../assets/langren.m4a?url";
import fontUrl from "../assets/mvbrush.woff2?url";

const DIR = "番外MV/浪人琵琶_字字分镜/";

const srcFiles = import.meta.glob(["/src/**/*.{ts,tsx,css}", "/index.html", "/vite.config.ts", "/tsconfig.json"], {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const ts = (t: number) => {
  const ms = Math.round(t * 1000);
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  const r = ms % 1000;
  const p = (n: number, k = 2) => String(n).padStart(k, "0");
  return `${p(h)}:${p(m)}:${p(s)},${p(r, 3)}`;
};

export function buildSrt() {
  return LINES.map((l, i) => `${i + 1}\n${ts(l.t0)} --> ${ts(l.t1)}\n${l.text}\n`).join("\n");
}
export function buildCues() {
  return JSON.stringify(
    {
      title: "浪人琵琶_字字分镜",
      audio: "浪人琵琶.WAV",
      duration: DURATION,
      fps: FPS,
      frames: Math.round(DURATION * FPS),
      size: [1280, 720],
      measured: true,
      method: "句起点：对仓库根 浪人琵琶.mp4 底部字幕条按每秒四帧逐格实测；词起点：句内按字数平分演唱段（句长百分之八十八）",
      lines: LINES.map((l) => ({
        id: l.id,
        text: l.text,
        t0: +l.t0.toFixed(3),
        t1: +l.t1.toFixed(3),
        words: l.words.map((w) => ({ text: w.text, t0: +w.t0.toFixed(3), t1: +w.t1.toFixed(3) })),
      })),
      shots: SHOTS.map((s) => ({ id: s.id, line: s.line, t0: +s.t0.toFixed(3), t1: +s.t1.toFixed(3), frames: [Math.round(s.t0 * FPS), Math.round(s.t1 * FPS)] })),
    },
    null,
    2,
  );
}
export function buildBoard() {
  let md = "# 《浪人琵琶》字字分镜 · 分镜表\n\n> 1280×720 · 30 fps · 30.14 秒 · 十一镜 · 三十四词拍。时间单位：秒。\n\n";
  for (const s of SHOTS) {
    const lines = LINES.filter((l) => l.words.some((w) => w.t0 >= s.t0 - 1e-6 && w.t0 < s.t1 - 1e-6));
    md += `## 第 ${s.id} 镜　${s.t0.toFixed(2)} – ${s.t1.toFixed(2)}\n\n| 词 | 起 | 画面 |\n|---|---|---|\n`;
    for (const l of lines)
      for (const w of l.words)
        if (w.t0 >= s.t0 - 1e-6 && w.t0 < s.t1 - 1e-6) md += `| ${w.text} | ${w.t0.toFixed(2)} | ${w.idea} |\n`;
    md += "\n";
  }
  return md;
}

const PKG = {
  name: "langren-pipa-zizi",
  private: true,
  version: "0.0.0",
  type: "module",
  scripts: { dev: "vite", build: "vite build", preview: "vite preview" },
  dependencies: { clsx: "2.1.1", fflate: "^0.8.2", react: "19.2.6", "react-dom": "19.2.6", "tailwind-merge": "3.4.0" },
  devDependencies: {
    "@tailwindcss/vite": "4.1.17",
    "@types/node": "22.19.17",
    "@types/react": "19.2.7",
    "@types/react-dom": "19.2.3",
    "@vitejs/plugin-react": "5.1.1",
    tailwindcss: "4.1.17",
    typescript: "5.9.3",
    vite: "7.3.7",
    "vite-plugin-singlefile": "2.3.0",
  },
};

async function bin(url: string) {
  return new Uint8Array(await (await fetch(url)).arrayBuffer());
}
function save(name: string, data: BlobPart, type: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([data], { type }));
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

export function downloadRemade() {
  save("remade.md", remade, "text/markdown;charset=utf-8");
}

export async function buildZip(): Promise<Uint8Array> {
  const files: Record<string, Uint8Array> = {};
  files[DIR + "remade.md"] = strToU8(remade);
  files[DIR + "分镜表.md"] = strToU8(buildBoard());
  files[DIR + "歌词.srt"] = strToU8(buildSrt());
  files[DIR + "cues.json"] = strToU8(buildCues());
  const S = DIR + "源码/";
  for (const [p, txt] of Object.entries(srcFiles)) files[S + p.replace(/^\//, "")] = strToU8(txt);
  files[S + "src/delivery/remade.md"] = strToU8(remade);
  files[S + "src/delivery/prepare_assets.py"] = strToU8(prepare);
  files[S + "scripts/prepare_assets.py"] = strToU8(prepare);
  files[S + "package.json"] = strToU8(JSON.stringify(PKG, null, 2) + "\n");
  files[S + ".gitignore"] = strToU8("node_modules\ndist\n");
  files[S + "src/assets/cast.png"] = await bin(castUrl);
  files[S + "src/assets/langren.m4a"] = await bin(audioUrl);
  files[S + "src/assets/mvbrush.woff2"] = await bin(fontUrl);
  return zipSync(files, { level: 6 });
}

export async function downloadZip() {
  const zip = await buildZip();
  save("浪人琵琶_字字分镜.zip", zip as BlobPart, "application/zip");
}
