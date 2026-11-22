"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import MVPlayer from "./MVPlayer";
import { SHOTS } from "@/lib/mv/timeline";
import { IDEA3D } from "@/lib/mv3d/ideas";

type Note = { id: number; shotIndex: number; word: string; author: string; rating: number; content: string; createdAt: string };

const CAST = [
  { id: "whale", name: "鲸鱼娘 DeepSeek", role: "「我」——孤单的小孩，想要更大的世界", color: "bg-blue-500" },
  { id: "claude", name: "小克 Claude", role: "「你」——当然陪在身边的那个人", color: "bg-orange-500" },
  { id: "gpt", name: "白龙娘 GPT", role: "驮着大家「飞到蓝蓝的天边」", color: "bg-violet-300" },
  { id: "qwen", name: "千问", role: "花园里的朋友", color: "bg-pink-400" },
  { id: "doubao", name: "豆包 Seed", role: "花园里的朋友", color: "bg-sky-400" },
  { id: "gemini", name: "Gemini", role: "花园里的朋友", color: "bg-indigo-400" },
  { id: "kimi", name: "Kimi", role: "花园里的朋友", color: "bg-fuchsia-300" },
  { id: "zai", name: "阔耳狐 GLM", role: "打盹，被「暖暖的光线」叫醒", color: "bg-yellow-400" },
];

export default function Studio({ mode = "3d" }: { mode?: "2d" | "3d" }) {
  const [cur, setCur] = useState(0);
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteShot, setNoteShot] = useState(1);
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [rating, setRating] = useState(5);
  const [msg, setMsg] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const r = await fetch("/api/notes").catch(() => null);
    if (r?.ok) setNotes(((await r.json()) as { notes: Note[] }).notes);
  }, []);
  useEffect(() => { void load(); }, [load]);

  const onShot = useCallback((i: number) => {
    setCur(i);
    const el = listRef.current?.querySelector<HTMLElement>(`[data-shot="${i}"]`);
    if (el && listRef.current) listRef.current.scrollTo({ top: el.offsetTop - listRef.current.offsetTop - 80, behavior: "smooth" });
  }, []);

  const seekTo = (i: number) => {
    const au = document.querySelector("audio");
    if (au) au.currentTime = SHOTS[i].start + 0.001;
    setNoteShot(i);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    const r = await fetch("/api/notes", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ shotIndex: noteShot, content, author, rating }) });
    if (r.ok) { setContent(""); setMsg("已记录 ✓"); void load(); } else setMsg("提交失败");
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-sky-100 via-amber-50 to-pink-50 pb-16">
      <header className="mx-auto max-w-7xl px-5 pt-8">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-sky-600">番外MV · 八位 AI 娘 · {mode === "3d" ? "three.js 3D 版" : "Canvas2D 像素版"}</p>
          <a href={mode === "3d" ? "/2d" : "/"} className="rounded-full bg-white px-3 py-1 text-xs font-bold text-sky-700 shadow ring-1 ring-sky-200">切换到 {mode === "3d" ? "2D 像素版" : "3D 版"} →</a>
        </div>
        <h1 className="mt-1 text-4xl font-black text-slate-900 md:text-5xl">《我和你》<span className="ml-2 text-xl font-bold text-rose-400">童年动画主题曲</span></h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          逐字分镜：每一个词一个镜头，共 {SHOTS.length} 镜 / 60.4 秒。{mode === "3d"
            ? "three.js 实时 3D：像素 AI 娘做成始终朝向镜头的纸片人（NearestFilter 硬边），天空、云海、山丘、房间、电视、玩具、时钟、花园、地球全部用几何体和着色器搭出来，每镜都有自己的机位运动。"
            : "背景全部由 Canvas2D 代码实时绘制。"}角色都用 latest-aiyunying 原有的 Q 版像素图集，没有生成背景图。卡点用 Whisper 逐字时间戳加人声起音点实测校准。
        </p>
      </header>

      <section className="mx-auto mt-6 grid max-w-7xl gap-6 px-5 lg:grid-cols-[1fr_380px]">
        <div>
          <MVPlayer onShotChange={onShot} mode={mode} />

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-white p-5 shadow ring-1 ring-slate-200">
              <h2 className="text-lg font-black text-slate-900">歌词理解</h2>
              <ul className="mt-2 space-y-2 text-sm leading-relaxed text-slate-700">
                <li><b>主歌 · 小小的孤单：</b>晴天却没人玩，玩具、电视、球鞋都是童年房间里的东西，也都留不住时间。画面收在一个房间里，暖色压暗、加暗角。</li>
                <li><b>转折 · 想去更大的世界：</b>「我要」是一个站起来的动作，镜头从房间一路拉到星球，接着是背包、三格不同的风景和藏宝图。</li>
                <li><b>「当然 你陪在身边」：</b>整首歌的核心。探险不是一个人去的，所以「你」用聚光灯单独亮相。研究资料里鲸鱼娘和小克是一条互相成全的关系线，这里沿用。</li>
                <li><b>副歌一 · 一起做的事：</b>飞、种、分享，都是动词，是两个人<em>一起去做</em>。白龙娘带飞，花园里加进朋友。</li>
                <li><b>「再靠近一点」×2：</b>两人的距离分 6 镜一步步缩短，第二遍换成粉色特写，最后碰到时白光转场。</li>
                <li><b>副歌二 · 从「做」到「是」：</b>「就像」是比喻。我们<em>就是</em>花园、<em>就是</em>光线：每个人头顶开出自己颜色的花，再化成光，最后「把地球照亮」。</li>
              </ul>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow ring-1 ring-slate-200">
              <h2 className="text-lg font-black text-slate-900">登场人物</h2>
              <ul className="mt-2 space-y-1.5 text-sm">
                {CAST.map((c) => (
                  <li key={c.id} className="flex items-start gap-2">
                    <span className={`mt-1 h-3 w-3 shrink-0 rounded-full ${c.color}`} />
                    <span><b>{c.name}</b> <span className="text-slate-500">— {c.role}</span></span>
                  </li>
                ))}
              </ul>
              <h3 className="mt-4 font-black text-slate-900">原创像素道具（仅道具）</h3>
              <p className="mt-1 text-xs text-slate-500">玩具堆 / 显像管电视 / 球鞋 / 探险背包 / 纸飞机 / 喷壶，由仓库脚本手绘为透明 PNG。人物沿用仓库原有图集，未生成新人物。</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <a href="/downloads/wohe-ni-props.zip" download className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-bold text-white shadow hover:bg-emerald-600">⬇ 下载 zip</a>
                <a href="/downloads/wohe-ni-props-README.md" target="_blank" className="rounded-full bg-white px-4 py-2 text-sm font-bold text-emerald-700 shadow ring-1 ring-emerald-200">📄 README</a>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 rounded-xl bg-slate-800 p-3">
                {["toys", "tv", "sneakers", "backpack", "paperplane", "wateringcan"].map((p) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={p} src={`/mv/props/${p}.png`} alt={p} className="h-12 w-auto" style={{ imageRendering: "pixelated" }} />
                ))}
              </div>
            </div>
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="rounded-2xl bg-white shadow ring-1 ring-slate-200">
            <h2 className="border-b border-slate-100 px-4 py-3 text-lg font-black text-slate-900">逐词分镜表 <span className="text-sm font-normal text-slate-400">点击跳转</span></h2>
            <div ref={listRef} className="max-h-[520px] overflow-y-auto">
              {SHOTS.map((s, i) => (
                <button key={i} data-shot={i} onClick={() => seekTo(i)}
                  className={`block w-full border-b border-slate-50 px-4 py-2 text-left text-sm transition ${i === cur ? "bg-amber-100" : "hover:bg-sky-50"}`}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-400">{String(i).padStart(2, "0")}</span>
                    <span className="font-mono text-xs text-sky-600">{s.start.toFixed(2)}s</span>
                    <b className={s.word ? "text-rose-500" : "text-slate-400"}>{s.word || (i === 0 ? "片头" : "尾奏")}</b>
                    <span className="ml-auto text-[10px] text-slate-400">{s.cast}</span>
                  </div>
                  <p className="mt-0.5 text-xs leading-snug text-slate-600">{s.idea}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow ring-1 ring-slate-200">
            <h2 className="text-lg font-black text-slate-900">审片意见</h2>
            <p className="text-xs text-slate-500">自检只能证明没坏，好不好看要有人从头看到尾。意见挂在对应镜头上。</p>
            <form onSubmit={submit} className="mt-3 space-y-2 text-sm">
              <div className="flex gap-2">
                <select value={noteShot} onChange={(e) => setNoteShot(parseInt(e.target.value, 10))} className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5">
                  {SHOTS.map((s, i) => <option key={i} value={i}>#{i} {s.word || (i === 0 ? "片头" : "尾奏")}</option>)}
                </select>
                <select value={rating} onChange={(e) => setRating(parseInt(e.target.value, 10))} className="rounded-lg border border-slate-200 px-2 py-1.5">
                  {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{"★".repeat(r)}</option>)}
                </select>
              </div>
              <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="署名（可空）" className="w-full rounded-lg border border-slate-200 px-2 py-1.5" />
              <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="这一镜的意见…" rows={2} className="w-full rounded-lg border border-slate-200 px-2 py-1.5" />
              <div className="flex items-center gap-2">
                <button className="rounded-full bg-sky-500 px-4 py-1.5 font-bold text-white hover:bg-sky-600" disabled={!content.trim()}>提交</button>
                <button type="button" onClick={() => setNoteShot(cur)} className="text-xs text-sky-600 underline">用当前镜头</button>
                <span className="text-xs text-emerald-600">{msg}</span>
              </div>
            </form>
            <ul className="mt-3 max-h-56 space-y-2 overflow-y-auto">
              {notes.length === 0 && <li className="text-xs text-slate-400">还没有意见。</li>}
              {notes.map((n) => (
                <li key={n.id} className="rounded-lg bg-slate-50 p-2 text-xs">
                  <button onClick={() => seekTo(n.shotIndex)} className="font-mono text-sky-600 underline">#{n.shotIndex} {n.word}</button>
                  <span className="ml-2 text-amber-500">{"★".repeat(n.rating)}</span>
                  <span className="ml-2 text-slate-400">{n.author}</span>
                  <p className="mt-1 text-slate-700">{n.content}</p>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </section>

      <footer className="mx-auto mt-10 max-w-7xl px-5 text-xs text-slate-400">
        角色形象原作 ZipZipPipe《大AI和小AI们》（CC BY-NC-SA 4.0），像素图集来自 aavvcasdas/latest-aiyunying。音乐取自仓库 我和你.WAV，授权未核，公开发布前请自行确认。
      </footer>
    </main>
  );
}
