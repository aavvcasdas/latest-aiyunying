import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MVPlayer, { type PlayerHandle } from './components/MVPlayer';
import { CastPanel, CueTable, Storyboard } from './components/Panels';
import { FilmEngine } from './mv/engine';
import { BPM, LINES } from './mv/cues';
import { DURATION, fmt } from './mv/timeline';
import { cn } from './utils/cn';

type Tab = '分镜表' | '人物' | '卡点';

const MEANING: { k: string; v: string }[] = [
  { k: '主歌 · 夏夜', v: '晚风、竹林、月光、萤火、银河、风铃——歌先搭好一个安静的夏夜。「满山飞舞的钱币」是把萤火比作金币：在恋爱的人眼里，这一山的光就是全部的财富。' },
  { k: '织女星 · 神话', v: '织女星引出牛郎织女：被银河隔开的两个人。第一遍是「古老浪漫的神话」（旁观），第二遍变成「许下爱恋的愿望」（自己也许愿）——从听故事的人变成故事里的人。' },
  { k: '导歌 · 时间', v: '「流水走过，就像四季的变换」说时间在走；「幸福在蔓延，爱你永恒不孤单」是回答：时间走，爱留下，而且会蔓延开。' },
  { k: '副歌 · 樱花草', v: '樱花草（报春花）是春天最早开的小花。手中→种下→怀中→思念：先是牵着，再一起种下青春，再贴近听见心跳，最后分开时偷偷想念——这一株花就是「相爱的记号」，到最后一句变成「相爱的味道」。' },
];

export default function App() {
  const engine = useMemo(() => new FilmEngine(), []);
  const handle = useRef<PlayerHandle | null>(null);
  const [shotIdx, setShotIdx] = useState(0);
  const [t, setT] = useState(0);
  const [tab, setTab] = useState<Tab>('分镜表');
  const [follow, setFollow] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);

  const onTime = useCallback((T: number, si: number) => { setT(T); setShotIdx((p) => (p === si ? p : si)); }, []);
  const seek = (T: number) => handle.current?.seek(T, true);

  useEffect(() => {
    if (!follow || tab !== '分镜表') return;
    const el = document.getElementById(`shot-${engine.shots[shotIdx]?.id}`), box = listRef.current;
    if (el && box) { const r = el.getBoundingClientRect(), b = box.getBoundingClientRect(); if (r.top < b.top || r.bottom > b.bottom) el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
  }, [shotIdx, follow, tab, engine.shots]);

  const chars = LINES.reduce((a, L) => a + L.words.reduce((b, w) => b + w.c.length, 0), 0);
  const cur = engine.shots[shotIdx];

  return (
    <div className="min-h-screen bg-[#fbeff3] text-stone-800" style={{ backgroundImage: 'radial-gradient(rgba(200,90,140,0.09) 1px, transparent 1px)', backgroundSize: '16px 16px' }}>
      <header className="border-b border-pink-900/10 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-end justify-between gap-3 px-4 py-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.35em] text-pink-700/70">番外MV · 鲸鱼娘像素剧场 · 软 3D</div>
            <h1 className="font-kuaile mt-1 text-3xl text-stone-900 sm:text-4xl">《樱花草》<span className="ml-2 text-lg text-stone-500">原唱 Sweety · 词曲 李天龙</span></h1>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-stone-500">
            <span>1280×720 · 30 fps</span><span>{fmt(DURATION)}</span><span>{engine.shots.length} 镜 / {LINES.length} 句 / {chars} 字卡点</span><span>{BPM.toFixed(2)} BPM 实测</span>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1500px] gap-5 px-4 py-5 lg:grid-cols-[minmax(0,1fr)_430px]">
        <section className="space-y-4">
          <div className="overflow-hidden rounded-2xl shadow-[0_20px_60px_rgba(120,40,80,0.3)] ring-1 ring-black/20">
            <MVPlayer engine={engine} onTime={onTime} handleRef={handle} />
          </div>
          {cur && (
            <div className="flex flex-wrap items-center gap-2 rounded-xl bg-white/70 px-4 py-2 text-sm">
              <span className="font-mono text-xs text-stone-400">当前镜头</span>
              <span className="font-mono font-semibold">{cur.id}</span>
              <span className="font-kuaile text-base text-pink-700">{cur.label}</span>
              <span className="text-xs text-stone-500">{cur.note}</span>
            </div>
          )}

          <article className="rounded-2xl border border-pink-900/10 bg-white/75 p-5 text-[14px] leading-relaxed text-stone-700">
            <h2 className="font-kuaile text-xl text-stone-900">歌在说什么 → 分镜怎么想的</h2>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {MEANING.map((m) => (
                <div key={m.k} className="rounded-xl bg-pink-50/80 p-3">
                  <div className="font-kuaile text-pink-700">{m.k}</div>
                  <p className="mt-1 text-[13px]">{m.v}</p>
                </div>
              ))}
            </div>
            <ul className="mt-4 grid gap-x-6 gap-y-1.5 text-[13px] sm:grid-cols-2">
              <li><b>谁演谁</b>：本鲸是捧着樱花草的「我」，小克是「你」（全片唯一戴金冠）；Kimi 是织女星，龙娘拖出银河，狐狸数「钱币」萤火，千问摇风铃、敲钟，猫在溪边选季节、听蛙鸣，豆包种花并在 La 段暖场。</li>
              <li><b>一句两镜</b>：每句歌词在逗号处切成两镜，比喻各成一个能走进去的软 3D 场景；前奏四镜、器乐间奏两镜、尾声一镜。</li>
              <li><b>四遍副歌四种光</b>：黄昏粉 → 夜紫灯会 → 黎明 → 春日。同一套动作（漫步、种花、心跳、思念）随着光一遍遍变暖。</li>
              <li><b>卡在字上</b>：萤火齐闪、风铃一串串响、钟声荡开的声波、青蛙鼓鸣囊、豆包种下的每一朵花，都挂在对应字的起唱时间上，不写死百分比。</li>
              <li><b>软 3D 字幕</b>：沿用坏女孩 Fable 版的深色金边字条；字是有厚度的立体字，逐字从左往右扫金、落位回弹；正在唱的词下面亮一条粉色光带。</li>
              <li><b>卡点实测</b>：mp3 解码 → 频谱通量自相关得 74.00 BPM、首拍 0.34 s（全曲相位漂移 ≤ 5 ms）→ 色度自相似切段落 → 谐波起音 + 人声音高新颖度，在十六分音符格上做动态规划，重复段落合并求共识。</li>
            </ul>
            <p className="mt-3 text-[12px] text-stone-500">说明：音轨在第二遍副歌之后还有一段 La la 和两遍副歌（按这首歌的原结构），给出的歌词只到第二遍「味道」，后面的段落按原歌词结构补齐（第三遍以「记号」收，第四遍以「味道」收）。卡点由机器测出，没有人从头到尾对着听过一遍。</p>
          </article>
        </section>

        <aside className="flex max-h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-2xl border border-pink-900/10 bg-[#fff7fa]/95 shadow-lg lg:sticky lg:top-4">
          <div className="flex items-center gap-1 border-b border-pink-900/10 px-2 pt-2">
            {(['分镜表', '人物', '卡点'] as Tab[]).map((x) => (
              <button key={x} onClick={() => setTab(x)} className={cn('rounded-t-lg px-4 py-2 text-sm transition', tab === x ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800')}>{x}</button>
            ))}
            {tab === '分镜表' && <label className="ml-auto flex items-center gap-1 pr-2 text-xs text-stone-500"><input type="checkbox" checked={follow} onChange={(e) => setFollow(e.target.checked)} />跟随播放</label>}
          </div>
          <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto">
            {tab === '分镜表' && <Storyboard shots={engine.shots} current={shotIdx} onSeek={seek} />}
            {tab === '人物' && <CastPanel />}
            {tab === '卡点' && <CueTable t={t} onSeek={seek} />}
          </div>
        </aside>
      </main>

      <footer className="mx-auto max-w-[1500px] px-4 pb-8 pt-2 text-xs text-stone-500">
        角色像素造型沿用项目图集（八位角色；Grok 暂无造型格未上场）。原曲录音与角色形象的授权未经核实，公开传播前须自行确认。字体：站酷快乐体（OFL，已按片中用字子集化）。零水印、零角标。
      </footer>
    </div>
  );
}
