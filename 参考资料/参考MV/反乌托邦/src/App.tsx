import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import atlasData from './mv/assets/atlas';
import fontData from './mv/assets/font';
import { createFilm, DUR, LINES, SHOTS, W, H, TITLE } from './mv/film';
import { SRT_LINES } from './mv/lyrics';
import { SongPlayer } from './mv/audio';
import { canWebCodecs, exportMp4, recordRealtime, type Env, type ExportResult } from './mv/exporter';

type Film = { render: (g: CanvasRenderingContext2D, t: number, o?: { scale?: number; subtitles?: boolean }) => unknown };
type Ex = { status: 'idle' | 'running' | 'done' | 'error'; p: number; info: string; res?: ExportResult & { url: string } };

const REPO = 'https://github.com/aavvcasdas/latest-aiyunying';
const BR = 'arena/25fbb036-latest-aiyunying';
const LINKS = [
  { label: '整个分支（项目源码）', href: `${REPO}/tree/${BR}` },
  { label: '原曲音源 反乌托邦.mp4', href: `${REPO}/blob/${BR}/%E5%8F%8D%E4%B9%8C%E6%89%98%E9%82%A6.mp4` },
  { label: '音源直链（raw）', href: `https://raw.githubusercontent.com/aavvcasdas/latest-aiyunying/${BR}/%E5%8F%8D%E4%B9%8C%E6%89%98%E9%82%A6.mp4` },
  { label: '引擎来源：番外MV/坏女孩Fable', href: `${REPO}/tree/${BR}/%E7%95%AA%E5%A4%96MV/%E5%9D%8F%E5%A5%B3%E5%AD%A9Fable` },
  { label: '人物设定：番外MV/童话镇', href: `${REPO}/tree/${BR}/%E7%95%AA%E5%A4%96MV/%E7%AB%A5%E8%AF%9D%E9%95%87` },
];
const CAST = [
  { who: '鲸鱼娘', role: '主角 · 歌里的「我」', look: '蓝发女仆 + 鲸尾', scenes: '点着小灯坐折纸船、站在树桩上为你唱歌、小星球上看星空、等不来的南瓜马车、八音盒里背着发条钥匙' },
  { who: '智谱', role: '彼得潘 · 歌里的「你」', look: '黑发哥特裙', scenes: '想飞的心被露水网罩住、放下小刀开成花、化成星尘飞向永无岛、最后飞回来' },
  { who: 'Claude', role: '唯一戴金冠的公主', look: '橙发 + 金冠', scenes: '把吉他放上折纸船、翻立体相册、八小时清醒' },
  { who: 'GPT 龙娘', role: '龙 / 反派影子', look: '白发龙角', scenes: '托走那颗叫「理想」的星、小银龙绕星球、树林后的淡紫色大影子、结尾飞过城堡' },
  { who: '豆包', role: '小红帽', look: '红兜帽 + 披风', scenes: '在树篱迷宫里找路' },
  { who: 'Gemini', role: '爱丽丝', look: '蓝色蝴蝶结', scenes: '八小时种朵花、晚霞花海同行' },
  { who: 'Kimi', role: '灰姑娘 / 智者', look: '银色小王冠', scenes: '望向雾里看不见的地方、睡在云上做梦、看签字笔画出乌托邦' },
  { who: '千问', role: '疯帽子', look: '高礼帽', scenes: '他的钟永远停在六点，陪着等那班不存在的车' },
];
const STORY = [
  ['反乌托邦', '彩虹河小镇失去颜色的夜晚。「我」点着一盏小灯、坐着折纸船，一直为「你」唱歌。'],
  ['渴望自由的心 / 网', '一颗长着翅膀想飞的心，被一张挂着露水的网罩住。'],
  ['别再把小刀带在身上', '彼得潘的小刀落了地，落下的地方开出一朵花。'],
  ['不存在的下一班', '童话小车站边，南瓜马车只剩金线的幻影；疯帽子的钟永远停在六点。'],
  ['如此的平淡', '同一片花海，却是童话书里还没上色的一页。'],
  ['签字笔画出了乌托邦', '一支笔从左画到右，画过的地方小镇有了颜色。'],
  ['没用的零件', '八音盒里一颗谁也不咬合的小齿轮，自己转着，开了花。'],
  ['你的歌声我永远都能听见', '你飞回来了；彩虹河一段段亮起，窗子一扇扇亮起，天亮了。'],
];
const FIXES = [
  ['困在张没空隙的网', '困在一张没空隙的网'], ['在这个世界难免会灭迷茫', '在这个世界难免会迷茫'], ['你那颗望自由的心脏困在着没空隙的网', '只因为你那渴望自由的心脏 / 困在一张没空隙的网'],
  ['我们的周围并非的光亮', '我们的周围并非没光亮'], ['在黑暗漫长的反复的方刻下', '在黑暗漫长的反乌托邦 / 活下去'], ['活着没用的零件活下去', '我想活成没用的零件 / 活下去'],
  ['我爱唱这句 / 没人能听见', '呼唤唱着 / 却没人能听见'], ['呼啸过成没用的零件活下去', '我想活成没用的零件 / 活下去'], ['当你歌声', '但你歌声'], ['在这般乌托邦里嗯', '在这反乌托邦里'],
];

const fmt = (t: number) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`;
const srtTime = (t: number) => { const ms = Math.round(t * 1000), h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000); return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms % 1000).padStart(3, '0')}`; };
const mb = (n: number) => `${(n / 1048576).toFixed(1)} MB`;

export default function App() {
  const cvRef = useRef<HTMLCanvasElement>(null);
  const filmRef = useRef<Film | null>(null);
  const player = useMemo(() => new SongPlayer(DUR), []);
  const started = useRef(false), dirty = useRef(true), abortRef = useRef({ aborted: false });
  const [env, setEnv] = useState<Env | null>(null);
  const [err, setErr] = useState('');
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [res, setRes] = useState<1080 | 720>(1080);
  const [ex, setEx] = useState<Ex>({ status: 'idle', p: 0, info: '' });
  const [copied, setCopied] = useState(false);
  const [staticMp4, setStaticMp4] = useState<string | null>(null);

  // 图集与字体就位后才开始画（第一帧必须是真的画出来的）
  useEffect(() => {
    let dead = false;
    (async () => {
      const img = new Image(); img.src = atlasData; await img.decode();
      const ff = new FontFace('BG', `url("${fontData}")`); await ff.load(); document.fonts.add(ff);
      if (dead) return;
      const e: Env = { atlas: img, makeCanvas: (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; } };
      filmRef.current = createFilm(e) as Film; setEnv(e);
    })().catch((e) => setErr('素材加载失败：' + String(e)));
    return () => { dead = true; };
  }, []);

  // 若托管保留了与页面同目录的成片文件，就给出直链
  useEffect(() => {
    const url = new URL('./fanwutuobang.mp4', location.href).href;
    fetch(url, { method: 'HEAD' }).then((r) => { const ct = r.headers.get('content-type') || '', len = +(r.headers.get('content-length') || 0); if (r.ok && ct.includes('video') && len > 1e6) setStaticMp4(url); }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!env) return;
    const cv = cvRef.current!, g = cv.getContext('2d')!;
    let raf = 0, lastUi = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const tt = started.current ? player.time() : 1.7;
      if (player.playing || dirty.current) { filmRef.current!.render(g, tt, { scale: cv.width / W }); dirty.current = false; }
      if (now - lastUi > 100) { lastUi = now; setT(started.current ? tt : 0); setPlaying(player.playing); }
    };
    raf = requestAnimationFrame(loop);
    player.onEnd = () => { dirty.current = true; };
    return () => cancelAnimationFrame(raf);
  }, [env, player]);

  const toggle = useCallback(async () => {
    if (player.playing) { player.pause(); dirty.current = true; return; }
    setLoadingAudio(true);
    try { started.current = true; await player.play(); } catch (e) { setErr('音频解码失败：' + String(e)); } finally { setLoadingAudio(false); }
  }, [player]);
  const seek = useCallback((v: number) => { started.current = true; player.seek(v); dirty.current = true; setT(v); }, [player]);

  const runExport = useCallback(async () => {
    if (!env) return;
    player.pause(); dirty.current = true;
    const abort = { aborted: false }; abortRef.current = abort;
    setEx({ status: 'running', p: 0, info: '准备编码器…' });
    let last = 0;
    const opts = { width: res === 1080 ? 1920 : 1280, height: res === 1080 ? 1080 : 720, fps: 30, signal: abort, onProgress: (p: number, info: string) => { const n = performance.now(); if (n - last > 120 || p > 0.99) { last = n; setEx((s) => ({ ...s, p, info })); } } };
    try {
      let r: ExportResult;
      try { r = await exportMp4(env, opts); } catch (e: any) { if (e?.message === 'NO_WEBCODECS') { setEx((s) => ({ ...s, info: '浏览器不支持 WebCodecs，改为实时录制…' })); r = await recordRealtime(env, opts); } else throw e; }
      const url = URL.createObjectURL(r.blob);
      setEx({ status: 'done', p: 1, info: '完成', res: { ...r, url } });
      const a = document.createElement('a'); a.href = url; a.download = `反乌托邦.${r.ext}`; document.body.appendChild(a); a.click(); a.remove();
    } catch (e: any) {
      setEx(e?.message === 'ABORT' ? { status: 'idle', p: 0, info: '已取消' } : { status: 'error', p: 0, info: String(e?.message || e) });
    }
  }, [env, player, res]);

  const srtUrl = useMemo(() => { const txt = SRT_LINES.map((l, i) => `${i + 1}\n${srtTime(l.start)} --> ${srtTime(l.end)}\n${l.text}\n`).join('\n'); return URL.createObjectURL(new Blob([txt], { type: 'text/plain;charset=utf-8' })); }, []);
  const curLine = LINES.findIndex((l: any, i: number) => t >= l.s - 0.08 && t < (LINES[i + 1]?.s ?? DUR) - 0.08);
  const curShot = SHOTS.find((s: any) => t >= s.start && t < s.end);
  const copy = async (s: string) => { try { await navigator.clipboard.writeText(s); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* 无剪贴板权限 */ } };

  return (
    <div className="min-h-screen bg-[#1b1e52] text-slate-200">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(255,150,190,0.26),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(255,220,140,0.16),transparent_50%)]" />
      <header className="relative mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-3 px-5 pb-3 pt-7">
        <div>
          <h1 className="text-3xl font-black tracking-widest text-white [text-shadow:0_3px_0_rgba(255,120,160,.9),0_0_26px_rgba(255,170,200,.6)] sm:text-4xl">{TITLE}</h1>
          <p className="mt-1 text-sm text-slate-400">治愈童话版 MV · 《童话镇》彩虹河小镇画风与人物设定 · 坏女孩 Fable 软 3D 引擎 · 122 BPM 实测卡点 · {fmt(DUR)}</p>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-1 text-rose-200">{SHOTS.length} 个镜头</span>
          <span className="rounded-full border border-cyan-400/40 bg-cyan-400/10 px-3 py-1 text-cyan-200">{LINES.length} 条歌词字幕</span>
        </div>
      </header>

      <main className="relative mx-auto grid max-w-7xl gap-5 px-5 pb-16 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section>
          <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-black shadow-[0_0_60px_rgba(255,170,200,0.28)]">
            <canvas ref={cvRef} width={W} height={H} className="block aspect-video w-full" onClick={toggle} />
            {(!env || !playing) && (
              <button onClick={toggle} disabled={!env} className="absolute inset-0 flex items-center justify-center bg-black/25 transition hover:bg-black/10">
                <span className="flex h-20 w-20 items-center justify-center rounded-full border border-white/30 bg-white/10 backdrop-blur-sm transition group-hover:scale-105">
                  {!env || loadingAudio ? <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <svg viewBox="0 0 24 24" className="ml-1 h-9 w-9 fill-white"><path d="M8 5v14l11-7z" /></svg>}
                </span>
              </button>
            )}
          </div>
          <div className="mt-3 flex items-center gap-3">
            <button onClick={toggle} disabled={!env} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg shadow-rose-500/30 transition hover:bg-rose-400 disabled:opacity-40" aria-label="播放或暂停">
              {playing ? <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg> : <svg viewBox="0 0 24 24" className="ml-0.5 h-5 w-5 fill-white"><path d="M8 5v14l11-7z" /></svg>}
            </button>
            <span className="w-24 shrink-0 font-mono text-xs text-slate-400">{fmt(t)} / {fmt(DUR)}</span>
            <input type="range" min={0} max={DUR} step={0.01} value={t} onChange={(e) => seek(+e.target.value)} className="h-1.5 w-full cursor-pointer accent-rose-500" aria-label="进度" />
          </div>
          <div className="mt-2 flex min-h-6 flex-wrap gap-x-4 text-xs text-slate-500">
            <span>镜头：<b className="text-slate-300">{curShot ? `${curShot.i + 1}. ${curShot.name}` : '—'}</b></span>
            <span>布景：<b className="text-slate-300">{curShot?.set ?? '—'}</b></span>
          </div>
          {err && <p className="mt-3 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">{err}</p>}

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <h2 className="mb-3 text-sm font-bold tracking-wider text-white">歌词字幕（点击跳转）</h2>
              <ol className="max-h-[420px] space-y-0.5 overflow-y-auto pr-1 text-sm">
                {LINES.map((l: any, i: number) => (
                  <li key={i}>
                    <button onClick={() => seek(l.s)} className={`flex w-full gap-3 rounded-md px-2 py-1 text-left transition ${i === curLine ? 'bg-amber-400/15 text-amber-200' : 'hover:bg-white/5'}`}>
                      <span className="w-14 shrink-0 font-mono text-xs leading-5 text-slate-500">{fmt(l.s)}</span><span>{l.parts.join(' ')}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <h2 className="mb-3 text-sm font-bold tracking-wider text-white">分镜（{SHOTS.length} 镜，按歌词切）</h2>
              <ol className="max-h-[420px] space-y-0.5 overflow-y-auto pr-1 text-sm">
                {SHOTS.map((s: any) => (
                  <li key={s.i}>
                    <button onClick={() => seek(s.start + 0.08)} className={`flex w-full gap-3 rounded-md px-2 py-1 text-left transition ${curShot?.i === s.i ? 'bg-cyan-400/15 text-cyan-200' : 'hover:bg-white/5'}`}>
                      <span className="w-14 shrink-0 font-mono text-xs leading-5 text-slate-500">{fmt(s.start)}</span><span className="flex-1">{s.name}</span><span className="text-xs leading-5 text-slate-600">{s.set}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <h2 className="mb-3 text-sm font-bold tracking-wider text-white">人物（按《童话镇》设定匹配）</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {CAST.map((c) => (
                <div key={c.who} className="rounded-xl border border-white/5 bg-black/30 p-3 text-sm">
                  <div className="flex items-baseline justify-between gap-2"><b className="text-white">{c.who}</b><span className="text-xs text-rose-300">{c.role}</span></div>
                  <div className="mt-1 text-xs text-slate-400">{c.look} · {c.scenes}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-rose-500/30 bg-gradient-to-b from-rose-500/10 to-transparent p-4">
            <h2 className="text-base font-bold text-white">导出 MP4</h2>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">逐帧调用同一份渲染函数（不是录屏），H.264 视频 + 原曲 AAC 音轨原样封装，片头只有{TITLE}，字幕已烧进画面。</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {([1080, 720] as const).map((r) => (
                <button key={r} disabled={ex.status === 'running'} onClick={() => setRes(r)} className={`rounded-lg border px-3 py-2 text-sm transition ${res === r ? 'border-rose-400 bg-rose-500/20 text-white' : 'border-white/10 text-slate-400 hover:border-white/30'}`}>{r === 1080 ? '1920×1080' : '1280×720'} · 30fps</button>
              ))}
            </div>
            {ex.status !== 'running' ? (
              <button onClick={runExport} disabled={!env} className="mt-3 w-full rounded-xl bg-rose-500 py-3 text-sm font-bold text-white shadow-lg shadow-rose-500/30 transition hover:bg-rose-400 disabled:opacity-40">⬇ 导出 MP4 并下载</button>
            ) : (
              <button onClick={() => { abortRef.current.aborted = true; }} className="mt-3 w-full rounded-xl border border-white/20 py-3 text-sm text-slate-200 hover:bg-white/5">取消导出</button>
            )}
            {ex.status === 'running' && (
              <div className="mt-3">
                <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-rose-500 to-amber-400 transition-[width]" style={{ width: `${(ex.p * 100).toFixed(1)}%` }} /></div>
                <p className="mt-1.5 flex justify-between text-xs text-slate-400"><span>{ex.info}</span><span>{(ex.p * 100).toFixed(0)}%</span></p>
              </div>
            )}
            {ex.status === 'error' && <p className="mt-3 rounded-lg bg-red-500/10 p-2 text-xs text-red-200">导出失败：{ex.info}</p>}
            {!canWebCodecs() && ex.status === 'idle' && <p className="mt-2 text-xs text-amber-300">当前浏览器没有 WebCodecs，会改为实时录制（约 2 分钟）。推荐用新版 Chrome / Edge。</p>}
            {ex.status === 'done' && ex.res && (
              <div className="mt-4 space-y-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3">
                <a href={ex.res.url} download={`反乌托邦.${ex.res.ext}`} className="block rounded-lg bg-emerald-500 py-2.5 text-center text-sm font-bold text-white hover:bg-emerald-400">下载 反乌托邦.{ex.res.ext}（{mb(ex.res.blob.size)}）</a>
                <p className="text-xs text-emerald-100/80">完整下载链接（本页打开期间有效，可右键另存为）：</p>
                <div className="flex gap-2">
                  <a href={ex.res.url} download={`反乌托邦.${ex.res.ext}`} className="min-w-0 flex-1 truncate rounded-md bg-black/40 px-2 py-1.5 font-mono text-[11px] text-emerald-200 underline">{ex.res.url}</a>
                  <button onClick={() => copy(ex.res!.url)} className="shrink-0 rounded-md border border-white/20 px-2 text-xs hover:bg-white/10">{copied ? '已复制' : '复制'}</button>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-400">{ex.res.codec} · {ex.res.frames} 帧 · 用时 {(ex.res.ms / 1000).toFixed(0)} 秒</p>
              </div>
            )}
            {staticMp4 && (
              <div className="mt-3 rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-3 text-xs">
                <p className="mb-1 text-cyan-100">预渲染成片直链（与本页同目录）：</p>
                <a href={staticMp4} download="反乌托邦.mp4" className="break-all font-mono text-cyan-200 underline">{staticMp4}</a>
              </div>
            )}
            <a href={srtUrl} download="反乌托邦.srt" className="mt-3 block rounded-lg border border-white/10 py-2 text-center text-xs text-slate-300 hover:bg-white/5">下载歌词字幕 .srt</a>
          </div>

          <div className="rounded-2xl border border-pink-300/30 bg-pink-300/[0.07] p-4 text-xs">
            <h2 className="mb-2 text-sm font-bold text-white">这一版怎么理解歌词</h2>
            <ul className="space-y-2">
              {STORY.map(([k, v]) => (<li key={k}><b className="text-pink-200">{k}</b><br /><span className="leading-relaxed text-slate-300">{v}</span></li>))}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs leading-relaxed text-slate-400">
            <h2 className="mb-2 text-sm font-bold text-white">卡点怎么来的</h2>
            <p>原曲音轨实测 <b className="text-slate-200">122.0 BPM</b>（拍长 0.492 秒，全程漂移 ≤ 0.012 秒）。每句起点按原 MV 每 0.5 秒一帧的画面逐句核对，再吸附到实拍上；切镜比歌词早 2 帧，画面里的大字随唱到的字逐个弹出，字幕逐字染金。给出的时间戳整体早 0.5–1 秒，0:52–1:19 一段原本没有时间戳，均已补齐。</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs">
            <h2 className="mb-2 text-sm font-bold text-white">歌词校对（按原 MV 画面上的字）</h2>
            <ul className="space-y-1.5">
              {FIXES.map(([a, b]) => (<li key={a}><span className="text-slate-500 line-through">{a}</span><br /><span className="text-amber-200">{b}</span></li>))}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs">
            <h2 className="mb-2 text-sm font-bold text-white">来源</h2>
            <ul className="space-y-1.5">
              {LINKS.map((l) => (<li key={l.href}><a href={l.href} target="_blank" rel="noreferrer" className="text-cyan-300 underline-offset-2 hover:underline">{l.label}</a></li>))}
            </ul>
            <p className="mt-3 text-slate-500">画面零水印、零角标；角色只用项目图集里的像素造型。原曲与角色形象公开发布前请自行核实授权。</p>
          </div>
        </aside>
      </main>
    </div>
  );
}
