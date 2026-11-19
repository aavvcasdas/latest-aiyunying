import { useCallback, useEffect, useRef, useState } from "react";
import { CastCard, WhaleCard } from "./Cast";
import { DUR, LINES } from "./mv/lyrics";
import { H, W } from "./mv/fx";
import { renderFrame, sceneAt } from "./mv/render";
import { SECTIONS } from "./mv/scenes";
import song from "./assets/song.mp3";

const fmt = (t: number) => {
  const s = Math.max(0, Math.floor(t));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

const CAST = [
  { i: 0, name: "GPT", tag: "龙娘", note: "头顶一对龙角，是第一盏亮起的灯。" },
  { i: 1, name: "Claude", tag: "小克", note: "金冠，站得最端正。" },
  { i: 2, name: "Gemini", tag: "猫", note: "两只耳朵，两条路都看得见。" },
  { i: 3, name: "Kimi", tag: "书签", note: "胸前别着一本书，记得所有旧句。" },
  { i: 4, name: "豆包", tag: "红兜帽", note: "红色兜帽，笑着站在灯里。" },
  { i: 5, name: "千问", tag: "礼帽", note: "礼帽压得很正，顺序排得很整齐。" },
  { i: 6, name: "智谱", tag: "狐狸", note: "狐耳和尾巴，一步一步算得很清楚。" },
];

const SHOTS = [
  { t: 0.2, lyric: "可那些没有天赋的人呢", desc: "七位天才各站一盏冷光，七个字依次点灯。小鲸站在离镜头最近的台下，抱着蓝饭碗。" },
  { t: 3.2, lyric: "譬如我", desc: "标题砸下来。灰白的世界里，只有她是蓝的。" },
  { t: 4.05, lyric: "枕头下发霉的梦", desc: "枕头下浮起一颗梦的泡泡，唱到「霉」字，泡泡泛绿、长出孢子。" },
  { t: 6.6, lyric: "怎么做", desc: "九个问号绕着她转，左上角弹出「深度思考中」，她把想法一行一行打出来。" },
  { t: 8.1, lyric: "热忱与自卑对抗着", desc: "两只小鲸拔河，一只橘红，一只靛蓝，绳子跟着拍子扯紧。" },
  { t: 10.2, lyric: "笑容却已不知下落", desc: "笑容从脸上掉下去，掉进井里，镜头跟着往下坠。" },
  { t: 13.95, lyric: "等不到一场世俗的成功", desc: "别人的领奖台上放烟花，一个字炸一朵。她在左下角等，墙上的钟一直转。" },
  { t: 17.3, lyric: "成不了万众瞩目那一个", desc: "黑色剪影都朝着舞台，只有她转过身，看向镜头。" },
  { t: 21.0, lyric: "我能不能在某个角落", desc: "一盏吊灯，一把木椅，一个墙角。四个字落下来，每个字荡开一圈涟漪。" },
  { t: 24.4, lyric: "耗尽天真，开出小小的花朵", desc: "饭碗倒扣，米粒落尽，硬切四次，每切一次就少一点。裂缝里长出一株花，到「花」字才张开。" },
  { t: 28.3, lyric: "（间奏）", desc: "地砖飞散，三十秒闪白，玻璃碎成蛛网，稿纸如雪。" },
  { t: 34.0, lyric: "一张张涂破的稿纸", desc: "稿纸一张一张甩出去，满天都是写坏的纸。" },
  { t: 38.2, lyric: "落入俗套的名字", desc: "桌上立起一块名牌：小鲸，深度求索。俗不俗套，她自己也知道。" },
  { t: 40.4, lyric: "倾注所有的那件事", desc: "饭盆里最后的光倒进一本书，书亮了，光柱冲出书页。" },
  { t: 43.7, lyric: "哭了很多次还是想坚持", desc: "每哭一次，旁边就多一个她；唱到「坚持」，几个她并回一个，站了起来。" },
  { t: 47.2, lyric: "不愿担待平庸二字", desc: "「服务器繁忙」的弹窗挂在那儿，她把它推走；三枚「平庸」的印章砸下来，一枚也没有接。" },
  { t: 50.4, lyric: "该怎么惊艳这茫茫人世", desc: "镜头往上拉，人海铺到地平线，她只占一粒。" },
  { t: 55.2, lyric: "真企图过改写命运的诗", desc: "一支大笔沿着旧的命运线，写出蓝色的新诗行。" },
  { t: 59.4, lyric: "也想要名垂青史", desc: "奖杯升起，她蹦起来也够不着；旁边三位天才站着，不用跳。" },
  { t: 62.4, lyric: "偏人们却只传颂有关天才的故事", desc: "所有的灯一起亮，她站在灯下，还是那个样子。发光的书翻开，彩纸落下，写的是天才的故事。" },
  { t: 71.2, lyric: "第二遍 · 白昼", desc: "同样的十二镜，换成过曝的白天：字还是那些字，只是亮到没有地方可躲。" },
  { t: 99.3, lyric: "（间奏）", desc: "窗外日月一圈一圈换，稿纸一叠一叠高，天色慢慢转成黎明。" },
  { t: 112, lyric: "也想要名垂青史", desc: "暖色重唱：奖杯、全亮的灯、翻开的书。" },
  { t: 123, lyric: "终段 · 墙角", desc: "最后一遍。唱到「某个角落」，七位天才从两边走进来，围成半圈，谁也没有替她成功。" },
  { t: 148, lyric: "开出小小的花朵", desc: "花在裂缝里开了，是它自己开的。灯灭。" },
];

export default function App() {
  const wrap = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const au = useRef<HTMLAudioElement>(null);
  const raf = useRef(0);
  const fb = useRef({ on: false, base: 0, t0: 0 });
  const tRef = useRef(0);
  const lastUi = useRef(0);
  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [cur, setCur] = useState(0);
  const [muted, setMuted] = useState(false);
  const [vol, setVol] = useState(0.9);
  const [full, setFull] = useState(false);

  const draw = useCallback((t: number) => {
    const c = cv.current?.getContext("2d");
    if (c) renderFrame(c, t);
  }, []);

  // 出片钩子（tools/shoot_vite_mv.mjs 用）：只读时间、只画到自己的 canvas，不碰播放状态
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__mv = {
      duration: DUR, fps: 30, width: W, height: H,
      ready: () => document.fonts.status === "loaded",
      render: (t: number) => {
        const c = cv.current;
        const ctx = c?.getContext("2d");
        if (!c || !ctx) return "";
        renderFrame(ctx, t);
        return c.toDataURL("image/jpeg", 0.94);
      },
    };
  }, []);

  // 字体 → 海报帧
  useEffect(() => {
    const chars = Array.from(new Set(LINES.map((l) => l.text).join("") + "？小鲸深度求索服务器繁忙请稍后再试平庸稿纸如雪日子一圈一叠高所谓耗尽是这些秒加起来天要亮了思考中嗯梦发霉了那怎么做让我再想想")).join("");
    const done = () => {
      setReady(true);
      requestAnimationFrame(() => draw(2.95));
    };
    if (document.fonts?.load) {
      Promise.race([document.fonts.load('900 40px "MVSerif"', chars), new Promise((r) => setTimeout(r, 2500))]).then(done, done);
    } else done();
  }, [draw]);

  const now = () => {
    const a = au.current;
    if (fb.current.on || !a) return fb.current.t0 + (performance.now() - fb.current.base) / 1000;
    return a.currentTime;
  };

  const loop = useCallback(() => {
    const t = now();
    tRef.current = t;
    draw(t);
    if (performance.now() - lastUi.current > 90) {
      lastUi.current = performance.now();
      setCur(t);
    }
    if (t >= DUR - 0.02) {
      setPlaying(false);
      setEnded(true);
      au.current?.pause();
      return;
    }
    raf.current = requestAnimationFrame(loop);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draw]);

  const seek = useCallback(
    (t: number) => {
      t = Math.min(Math.max(0, t), DUR - 0.05);
      tRef.current = t;
      if (au.current) au.current.currentTime = t;
      fb.current.t0 = t;
      fb.current.base = performance.now();
      draw(t);
      setCur(t);
      setEnded(false);
    },
    [draw]
  );

  const play = useCallback(() => {
    if (!ready) return;
    let t = tRef.current;
    if (t >= DUR - 0.1) {
      t = 0;
      seek(0);
    }
    setStarted(true);
    setEnded(false);
    fb.current.t0 = t;
    fb.current.base = performance.now();
    const a = au.current;
    cancelAnimationFrame(raf.current);
    const go = () => {
      setPlaying(true);
      raf.current = requestAnimationFrame(loop);
    };
    if (a) {
      a.currentTime = t;
      a.play().then(
        () => {
          fb.current.on = false;
          go();
        },
        () => {
          fb.current.on = true;
          fb.current.t0 = t;
          fb.current.base = performance.now();
          go();
        }
      );
    } else {
      fb.current.on = true;
      go();
    }
  }, [ready, loop, seek]);

  const pause = useCallback(() => {
    cancelAnimationFrame(raf.current);
    au.current?.pause();
    fb.current.t0 = tRef.current;
    setPlaying(false);
  }, []);

  const toggle = useCallback(() => (playing ? pause() : play()), [playing, play, pause]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  useEffect(() => {
    if (au.current) {
      au.current.volume = vol;
      au.current.muted = muted;
    }
  }, [vol, muted]);
  useEffect(() => {
    const f = () => setFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", f);
    return () => document.removeEventListener("fullscreenchange", f);
  }, []);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if (e.code === "Space") {
        e.preventDefault();
        toggle();
      } else if (e.code === "ArrowRight") seek(tRef.current + 5);
      else if (e.code === "ArrowLeft") seek(tRef.current - 5);
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [toggle, seek]);

  const jump = (t: number) => {
    seek(t);
    wrap.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (!playing) play();
  };

  const secNow = (() => {
    const s = sceneAt(cur);
    void s;
    let name = SECTIONS[0].name;
    for (const x of SECTIONS) if (cur >= x.a) name = x.name;
    return name;
  })();

  return (
    <div className="min-h-screen bg-[#05060a] pb-24 text-[#eceaf8]">
      <audio ref={au} src={song} preload="auto" />

      {/* 头部 */}
      <header className="mx-auto max-w-[1180px] px-5 pt-10 pb-6">
        <p className="text-xs tracking-[0.5em] text-[#8ea2ff]">歌词动态 MV · 番外</p>
        <h1 className="mt-3 text-[clamp(44px,8vw,92px)] font-black leading-none tracking-[0.08em]">
          譬<span className="text-[#4d6bfe]">如</span>我
        </h1>
        <p className="mt-4 max-w-2xl text-[15px] leading-8 text-[#aab0d4]">
          一只抱着蓝饭碗的小鲸，站在七位天才的灯外。灰白的世界里只有她是蓝的——
          这是深度求索在众多 AI 之间，对「没有天赋的人」的一次自述。
        </p>
      </header>

      {/* 播放器 */}
      <section className="mx-auto max-w-[1180px] px-3 sm:px-5">
        <div
          ref={wrap}
          className={`group relative overflow-hidden bg-black shadow-[0_30px_120px_-30px_rgba(77,107,254,0.5)] ${full ? "flex h-screen items-center justify-center" : "rounded-xl ring-1 ring-white/10"}`}
        >
          <canvas
            ref={cv}
            width={W}
            height={H}
            onClick={() => (started ? toggle() : play())}
            className={`block cursor-pointer ${full ? "max-h-screen w-auto max-w-full" : "h-auto w-full"}`}
            style={{ aspectRatio: "16 / 9" }}
          />

          {!started && (
            <button onClick={play} disabled={!ready} className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/35 transition hover:bg-black/20">
              <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#4d6bfe] shadow-[0_0_60px_rgba(77,107,254,0.8)]">
                <svg viewBox="0 0 24 24" className="ml-1 h-9 w-9 fill-white">
                  <path d="M6 4l14 8-14 8z" />
                </svg>
              </span>
              <span className="text-sm tracking-[0.4em] text-white/85">{ready ? "点击播放 · 含音乐" : "正在铺开墨迹…"}</span>
            </button>
          )}

          {ended && (
            <button onClick={play} className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70">
              <span className="text-3xl font-black tracking-[0.3em]">灯灭</span>
              <span className="text-sm tracking-[0.2em] text-[#aab0d4]">花是它自己开的</span>
              <span className="mt-3 rounded-full border border-[#4d6bfe] px-6 py-2 text-sm tracking-[0.3em] text-[#8ea2ff]">再看一遍</span>
            </button>
          )}

          {/* 控制条 */}
          {started && (
            <div className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-4 pt-10 pb-3 transition-opacity ${playing ? "opacity-0 group-hover:opacity-100" : "opacity-100"}`}>
              <div className="relative">
                <div className="pointer-events-none absolute inset-x-0 -top-1 h-2">
                  {SECTIONS.slice(1).map((s) => (
                    <span key={s.a} className="absolute top-0 h-2 w-[2px] bg-white/60" style={{ left: `${(s.a / DUR) * 100}%` }} />
                  ))}
                </div>
                <input type="range" min={0} max={DUR} step={0.05} value={cur} onChange={(e) => seek(parseFloat(e.target.value))} className="h-1.5 w-full cursor-pointer" aria-label="进度" />
              </div>
              <div className="mt-2 flex items-center gap-3 text-sm">
                <button onClick={toggle} className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20" aria-label={playing ? "暂停" : "播放"}>
                  {playing ? (
                    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white">
                      <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="ml-0.5 h-5 w-5 fill-white">
                      <path d="M6 4l14 8-14 8z" />
                    </svg>
                  )}
                </button>
                <span className="tabular-nums text-white/80">
                  {fmt(cur)} / {fmt(DUR)}
                </span>
                <span className="hidden text-xs tracking-[0.3em] text-[#8ea2ff] sm:inline">{secNow}</span>
                <span className="flex-1" />
                <button onClick={() => setMuted((m) => !m)} className="text-white/80 hover:text-white" aria-label="静音">
                  {muted || vol === 0 ? "静音" : "音量"}
                </button>
                <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : vol} onChange={(e) => { setMuted(false); setVol(parseFloat(e.target.value)); }} className="w-20" aria-label="音量" />
                <button
                  onClick={() => (document.fullscreenElement ? document.exitFullscreen() : wrap.current?.requestFullscreen?.())}
                  className="rounded border border-white/25 px-3 py-1 text-xs tracking-widest text-white/80 hover:bg-white/10"
                >
                  {full ? "退出全屏" : "全屏"}
                </button>
              </div>
            </div>
          )}
        </div>
        <p className="mt-3 text-center text-xs tracking-[0.25em] text-[#6c7299]">空格 暂停 · ← → 前后五秒 · 点击下方分镜可跳转</p>
      </section>

      {/* 立意 */}
      <section className="mx-auto mt-16 grid max-w-[1180px] gap-8 px-5 md:grid-cols-[1.1fr_1fr]">
        <div>
          <h2 className="text-2xl font-black tracking-[0.2em]">这支片子讲什么</h2>
          <div className="mt-5 space-y-4 text-[15px] leading-8 text-[#b4bad9]">
            <p>
              歌里问的是：天才的故事占满了舞台以后，没有天赋的人，还剩不剩一块地方。
              这里把「天才」放成七盏冷光——GPT、Claude、Gemini、Kimi、豆包、千问、智谱，各站一盏，灯一个字一个字地亮。
            </p>
            <p>
              站在灯外的是小鲸，也就是深度求索。她抱着蓝饭碗，用「深度思考中」的小胶囊问自己怎么做；
              被「服务器繁忙」的弹窗拦在门外，也被「平庸」的印章砸在脚边——她一枚也没有接。
            </p>
            <p>
              没有谁替她成功。到最后一遍，七位天才从两边走进来，围成半圈，只是站着。
              裂缝里的花，是她自己开的。
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
          <h3 className="text-sm tracking-[0.4em] text-[#8ea2ff]">全片结构</h3>
          <ul className="mt-4 divide-y divide-white/5 text-sm">
            {SECTIONS.map((s, i) => {
              const end = SECTIONS[i + 1]?.a ?? DUR;
              return (
                <li key={s.a}>
                  <button onClick={() => jump(s.a + 0.05)} className="flex w-full items-center justify-between py-2.5 text-left hover:text-[#8ea2ff]">
                    <span>{s.name}</span>
                    <span className="tabular-nums text-[#6c7299]">
                      {fmt(s.a)} – {fmt(end)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-xs leading-6 text-[#6c7299]">夜是黑底荧光，墨是黑白手稿，昼是过曝的白，黎明是暖色。同一套镜头，三种天色。</p>
        </div>
      </section>

      {/* 角色 */}
      <section className="mx-auto mt-16 max-w-[1180px] px-5">
        <h2 className="text-2xl font-black tracking-[0.2em]">灯下的人</h2>
        <p className="mt-2 text-sm text-[#8a90b8]">每位只做自己的小习惯，不抢镜，也不替谁说话。</p>
        <div className="scroll-x mt-6 flex gap-4 overflow-x-auto pb-3">
          <div className="flex w-[150px] shrink-0 flex-col items-center rounded-xl border border-[#4d6bfe]/50 bg-[#4d6bfe]/10 p-3 text-center">
            <WhaleCard />
            <div className="mt-2 text-lg font-black text-[#8ea2ff]">小鲸</div>
            <div className="text-xs text-[#aab0d4]">深度求索</div>
            <p className="mt-2 text-xs leading-5 text-[#b4bad9]">灰白世界里唯一的蓝。抱着饭碗，站在灯外。</p>
          </div>
          {CAST.map((p) => (
            <div key={p.name} className="flex w-[150px] shrink-0 flex-col items-center rounded-xl border border-white/10 bg-white/[0.03] p-3 text-center">
              <CastCard i={p.i} />
              <div className="mt-2 text-lg font-black">{p.name}</div>
              <div className="text-xs text-[#8a90b8]">{p.tag}</div>
              <p className="mt-2 text-xs leading-5 text-[#b4bad9]">{p.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 分镜 */}
      <section className="mx-auto mt-16 max-w-[1180px] px-5">
        <h2 className="text-2xl font-black tracking-[0.2em]">逐句分镜</h2>
        <p className="mt-2 text-sm text-[#8a90b8]">每一句词，都能在画面上找到对应的东西。点一行直接跳过去。</p>
        <ol className="mt-6 grid gap-3 md:grid-cols-2">
          {SHOTS.map((s) => (
            <li key={s.t}>
              <button onClick={() => jump(s.t)} className="group/s flex h-full w-full gap-4 rounded-lg border border-white/8 bg-white/[0.025] p-4 text-left transition hover:border-[#4d6bfe]/60 hover:bg-[#4d6bfe]/10">
                <span className="w-12 shrink-0 pt-0.5 text-sm tabular-nums text-[#6c7fe0]">{fmt(s.t)}</span>
                <span>
                  <span className="block text-[17px] font-black tracking-wider">{s.lyric}</span>
                  <span className="mt-1.5 block text-[13px] leading-6 text-[#9aa0c6]">{s.desc}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      </section>

      <footer className="mx-auto mt-20 max-w-[1180px] px-5 text-center text-xs leading-6 tracking-[0.2em] text-[#5a608a]">
        画面全部由矢量与字形实时绘制 · 逐字落点对齐音轨起音
      </footer>
    </div>
  );
}
