import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MVPlayer, { type PlayerHandle } from './components/MVPlayer';
import { CastPanel, CueTable, Storyboard } from './components/Panels';
import { FilmEngine } from './mv/engine';
import { BEAT, DURATION, fmt, lineAt, LINES } from './mv/timeline';
import { cn } from './utils/cn';

type Tab = '分镜表' | '人物' | '卡点';

export default function App() {
  const engine = useMemo(() => new FilmEngine(), []);
  const handle = useRef<PlayerHandle | null>(null);
  const [shotIdx, setShotIdx] = useState(0);
  const [line, setLine] = useState(-1);
  const [tab, setTab] = useState<Tab>('分镜表');
  const [follow, setFollow] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);
  const lastT = useRef(0);

  const onTime = useCallback((t: number, si: number) => {
    lastT.current = t;
    setShotIdx((p) => (p === si ? p : si));
    const l = lineAt(t).line;
    setLine((p) => (p === l ? p : l));
  }, []);

  useEffect(() => {
    if (!follow || tab !== '分镜表') return;
    const el = document.getElementById(`shot-${engine.shots[shotIdx]?.id}`);
    const box = listRef.current;
    if (el && box) { const r = el.getBoundingClientRect(), b = box.getBoundingClientRect(); if (r.top < b.top || r.bottom > b.bottom) el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
  }, [shotIdx, follow, tab, engine.shots]);

  const seek = (t: number) => handle.current?.seek(t, true);
  const sections = useMemo(() => {
    const m = new Map<string, number>(); engine.shots.forEach((s) => m.set(s.section, (m.get(s.section) ?? 0) + 1)); return [...m.entries()];
  }, [engine.shots]);

  return (
    <div className="min-h-screen bg-[#f3ead9] text-stone-800" style={{ backgroundImage: 'radial-gradient(rgba(120,90,50,0.08) 1px, transparent 1px)', backgroundSize: '14px 14px' }}>
      <header className="border-b border-amber-900/10 bg-[#fbf5e8]/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-end justify-between gap-3 px-4 py-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.35em] text-amber-700/70">番外MV · 鲸鱼娘像素剧场</div>
            <h1 className="font-kuaile mt-1 text-3xl text-stone-900 sm:text-4xl">《勾指起誓》<span className="ml-2 text-lg text-stone-500">原唱 洛天依 · 词曲 ilem</span></h1>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-stone-500">
            <span>1920×1080 · 30 fps</span><span>{fmt(DURATION)}</span><span>{engine.shots.length} 镜 / {LINES.length} 句</span><span>{BEAT.bpm} BPM 实测</span>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1500px] gap-5 px-4 py-5 lg:grid-cols-[minmax(0,1fr)_420px]">
        <section className="space-y-4">
          <div className="overflow-hidden rounded-2xl shadow-[0_20px_60px_rgba(80,50,20,0.25)] ring-1 ring-black/20">
            <MVPlayer engine={engine} onTime={onTime} handleRef={handle} />
          </div>

          <article className="rounded-2xl border border-amber-900/10 bg-[#fbf5e8]/80 p-5 text-[14px] leading-relaxed text-stone-700">
            <h2 className="font-kuaile text-xl text-stone-900">分镜怎么想的：一封信的旅程</h2>
            <p className="mt-2">这首歌从「你是信的开头诗的内容」唱起，到「因为要走很远」收尾——它本身就是一封写给对方的信，前半段数着「你是什么」，副歌把誓言落到无名指上。所以整支 MV 的世界是<strong>一张正在写的信纸</strong>：钢笔落下第一笔，墨线长成小路，信纸立起来变成纸雕的世界；主歌里每一个比喻都做成一个可以走进去的立体场景（月亮、雪夜礼物、三千泡泡的星河、手绘地图、分割人生的金线），副歌回到两个人：靠近、变强、交换戒指、勾指起誓、走很远的路。最后一镜把整片风景缩回信纸上——这一路都写在信里。</p>
            <ul className="mt-3 grid gap-x-6 gap-y-1 sm:grid-cols-2">
              <li><b>谁演谁</b>：本鲸是写信的「我」（她怕自己只有「便宜」才值得被喜欢，所以有「尽管我太平凡」那一镜）；小克是收信的「你」（温暖、柔软、敏感）。歌里的感情戏只在这支里成立，不回写进日常线。</li>
              <li><b>一句词一个镜头</b>：41 句歌词 41 镜，切点挂在实测拍点前 2 帧；序章、两段间奏各三镜，尾声一镜，共 51 镜。</li>
              <li><b>卡点只认实测</b>：解码音频做频谱通量 → 自相关得 85.01 BPM、首拍 21.295 s，全曲漂移不超过 0.01 s；LRC 起点吸附到最近的半拍（两处人声切分前置取四分之一拍），平均移动 0.093 s。</li>
              <li><b>不画假手</b>：角色是纸片人，「牵手」「勾指」用两人之间的一根金线来说，光点沿线来回跑。龙娘一律只从画面上方掠过。</li>
              <li><b>歌词条</b>：手写体嵌进构图，逐字染金，不用大字遮脸；片头只留歌名与歌手两行，最后一句唱完就结束，不加片尾卡，零水印零角标。</li>
              <li><b>动作三层</b>：全身走位靠按位移迈步的行走格，局部靠派生动作（挥手、递出去、鞠躬、歪头、惊讶、打盹、竖耳），关键姿势靠机位、道具与光。</li>
            </ul>
          </article>
        </section>

        <aside className="flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-2xl border border-amber-900/10 bg-[#fbf5e8]/90 shadow-lg lg:sticky lg:top-4">
          <div className="flex items-center gap-1 border-b border-amber-900/10 px-2 pt-2">
            {(['分镜表', '人物', '卡点'] as Tab[]).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={cn('rounded-t-lg px-4 py-2 text-sm transition', tab === t ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800')}>{t}</button>
            ))}
            {tab === '分镜表' && <label className="ml-auto flex items-center gap-1 pr-2 text-xs text-stone-500"><input type="checkbox" checked={follow} onChange={(e) => setFollow(e.target.checked)} />跟随播放</label>}
          </div>
          {tab === '分镜表' && (
            <div className="flex flex-wrap gap-1 border-b border-amber-900/10 px-3 py-2 text-[11px] text-stone-500">
              {sections.map(([s, n]) => <span key={s} className="rounded bg-white/70 px-1.5 py-0.5">{s} {n}</span>)}
            </div>
          )}
          <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto">
            {tab === '分镜表' && <Storyboard shots={engine.shots} current={shotIdx} onSeek={seek} />}
            {tab === '人物' && <CastPanel />}
            {tab === '卡点' && <CueTable onSeek={seek} currentLine={line} />}
          </div>
        </aside>
      </main>

      <footer className="mx-auto max-w-[1500px] px-4 pb-8 pt-2 text-xs text-stone-500">
        角色像素造型沿用项目图集（八位角色，Grok 暂无造型格故未上场）；原曲录音与角色形象的授权未经核实，公开传播前须自行确认。字体：站酷快乐体（OFL）。
      </footer>
    </div>
  );
}
