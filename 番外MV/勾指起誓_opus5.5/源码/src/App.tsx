import { memo, useCallback, useEffect, useRef, useState } from 'react';
import Player, { type PlayerApi } from './components/Player';
import { renderFrame } from './mv/render';
import { H, W } from './mv/gfx';
import { LINES, SHOTS, bt, shotAt, toBeat } from './mv/timeline';

const fmt = (t: number) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, '0')}`;
const SECTIONS: { name: string; from: string; to: string; tone: string }[] = [
  { name: '序章', from: 'I1', to: 'I4', tone: 'from-rose-400 to-orange-300' },
  { name: '主歌 A', from: 'L01', to: 'L08', tone: 'from-sky-400 to-indigo-400' },
  { name: '副歌 A', from: 'L09', to: 'L16', tone: 'from-amber-300 to-pink-400' },
  { name: '间奏 · 出发', from: 'N1', to: 'N8', tone: 'from-emerald-300 to-teal-400' },
  { name: '主歌 B', from: 'M01', to: 'M08', tone: 'from-violet-400 to-fuchsia-400' },
  { name: '副歌 B', from: 'M09', to: 'M16', tone: 'from-amber-300 to-rose-400' },
  { name: '间奏 · 四季', from: 'K1', to: 'K8', tone: 'from-lime-300 to-emerald-400' },
  { name: '终章', from: 'F01', to: 'OUT', tone: 'from-yellow-300 to-orange-400' },
];

const CAST = [
  { id: 'whale', name: '本鲸', role: '「我」· 向前挪一步的人', how: '先问哪条不能改，再筛 → 所以她总是「递出去、让位、先靠近」', acts: '捧饭盆递水 · 一步步靠近 · 登顶插旗', color: 'bg-sky-500' },
  { id: 'claude', name: '小克', role: '「你」· 信、礼物、月色', how: '先听完再改一个字，怕做错 → 敏感时先僵住，被温柔对待后自己点头', acts: '读信 · 从礼盒里探出头 · 含羞草前的「紧张→点头」', color: 'bg-orange-500' },
  { id: 'kimi', name: 'Kimi', role: '月牙上的守夜人', how: '把漏掉的旧句找回来 → 替「月色真美」记下那一句', acts: '月牙上思考', color: 'bg-violet-400' },
  { id: 'doubao', name: '豆包', role: '圣诞老人', how: '先陪着，不催 → 戴着红帽慢慢把礼物送到', acts: '雪夜扛着篮子走来 · 雪村里再路过一次', color: 'bg-red-500' },
  { id: 'gemini', name: '猫', role: '岔路口的猫', how: '先给两个看法，最后必须选一个 → 站在岔路中间，选定右边', acts: '路口「选择」动作', color: 'bg-indigo-400' },
  { id: 'gpt', name: '龙娘', role: '龙影', how: '龙影只从画面上方掠过，不进画面 → 只做剪影', acts: '万水千山上空掠过', color: 'bg-slate-300' },
  { id: 'qwen', name: '千问', role: '鸟居下的虔诚', how: '先排顺序再动手 → 这次老老实实鞠一躬', acts: '「虔诚牵的手」鞠躬 · 野餐、夜宿时倒茶', color: 'bg-rose-400' },
  { id: 'zai', name: '狐狸', role: '账本与算盘', how: '单位不对就醒 → 数着被切开的线，对不上就竖耳朵', acts: '「分割人生的线」里拨算盘', color: 'bg-zinc-500' },
];

function useThumbs(on: boolean) {
  const [thumbs, setThumbs] = useState<string[]>([]);
  useEffect(() => {
    if (!on) return; let dead = false; const full = document.createElement('canvas'); full.width = W; full.height = H;
    const fc = full.getContext('2d')!; const tc = document.createElement('canvas'); tc.width = 320; tc.height = 180; const tg = tc.getContext('2d')!;
    const out: string[] = []; let i = 0;
    const step = () => {
      if (dead) return;
      for (let k = 0; k < 3 && i < SHOTS.length; k++, i++) {
        const s = SHOTS[i]; const t = bt(s.b0 + (s.b1 - s.b0) * 0.62);
        try { renderFrame(fc, t, { lyrics: false, grain: false }); tg.drawImage(full, 0, 0, 320, 180); out[i] = tc.toDataURL('image/jpeg', 0.72); } catch { out[i] = ''; }
      }
      setThumbs([...out]); if (i < SHOTS.length) setTimeout(step, 16);
    };
    setTimeout(step, 200); return () => { dead = true; };
  }, [on]);
  return thumbs;
}

const Card = memo(function Card({ i, thumb, active, onPick }: { i: number; thumb?: string; active: boolean; onPick: (i: number) => void }) {
  const s = SHOTS[i]; const line = s.line >= 0 ? LINES[s.line].text : null;
  return (
    <button onClick={() => onPick(i)} className={`group overflow-hidden rounded-xl bg-white/5 text-left ring-1 transition hover:-translate-y-0.5 hover:bg-white/10 ${active ? 'ring-2 ring-amber-300' : 'ring-white/10'}`}>
      <div className="relative aspect-video bg-[#1b1038]">
        {thumb ? <img src={thumb} alt={s.title} className="h-full w-full object-cover" /> : <div className="h-full w-full animate-pulse bg-white/5" />}
        <span className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-xs font-bold text-amber-200">{s.id}</span>
        <span className="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 py-0.5 text-xs tabular-nums text-white/80">{fmt(bt(s.b0))}</span>
      </div>
      <div className="space-y-1 p-3">
        <div className="text-sm font-medium text-white">{s.title}</div>
        <div className="truncate text-xs text-pink-200/80">{line ? `「${line}」` : '（器乐）'}</div>
      </div>
    </button>
  );
});

export default function App() {
  const api = useRef<PlayerApi>(null);
  const [t, setT] = useState(0);
  const [ready, setReady] = useState(false);
  const thumbs = useThumbs(ready);
  const onTime = useCallback((v: number) => setT(v), []);
  const onReady = useCallback((ok: boolean) => setReady(ok), []);
  const cur = shotAt(Math.max(0, toBeat(t)));
  const pick = useCallback((i: number) => { api.current?.seek(bt(SHOTS[i].b0) + 0.01, true); window.scrollTo({ top: 0, behavior: 'smooth' }); }, []);

  return (
    <div className="min-h-screen bg-[#0d0620] text-white" style={{ fontFamily: '"ZCOOL KuaiLe","PingFang SC","Microsoft YaHei",sans-serif' }}>
      <div className="pointer-events-none fixed inset-0 -z-0 bg-[radial-gradient(ellipse_at_top,rgba(236,72,153,0.18),transparent_60%),radial-gradient(ellipse_at_bottom_right,rgba(251,191,36,0.10),transparent_55%)]" />
      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm tracking-[0.3em] text-pink-300/80">番外 MV · 立体童话书</p>
            <h1 className="mt-1 text-4xl text-amber-200 sm:text-5xl">勾指起誓</h1>
            <p className="mt-2 text-white/60">本鲸 × 小克 · 把每一句歌词排成一页会动的纸艺立体书</p>
          </div>
          <ul className="flex flex-wrap gap-2 text-sm text-white/80">
            {[`${SHOTS.length} 个镜头`, `${LINES.length} 句歌词`, '85 BPM', '3 分 03 秒'].map((x) => <li key={x} className="rounded-full bg-white/10 px-3 py-1 ring-1 ring-white/10">{x}</li>)}
          </ul>
        </header>

        <Player apiRef={api} onTime={onTime} ready={onReady} />
        <p className="mt-3 text-center text-sm text-white/45">空格 播放/暂停 · ←/→ 快退快进 5 秒 · F 全屏 · 点下方任一分镜直接跳过去</p>

        <section className="mt-12">
          <div className="mb-4 flex items-end justify-between"><h2 className="text-2xl text-amber-200">分镜总览</h2><span className="text-sm text-white/50">一句词一个镜头 · 切点压在拍点上</span></div>
          <div className="space-y-8">
            {SECTIONS.map((sec) => {
              const a = SHOTS.findIndex((s) => s.id === sec.from), b = SHOTS.findIndex((s) => s.id === sec.to);
              return (
                <div key={sec.name}>
                  <div className="mb-3 flex items-center gap-3"><span className={`rounded-full bg-gradient-to-r ${sec.tone} px-3 py-1 text-sm font-bold text-[#2a0f2e]`}>{sec.name}</span><span className="text-sm text-white/45">{fmt(bt(SHOTS[a].b0))} – {fmt(bt(SHOTS[b].b1))}</span></div>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                    {SHOTS.slice(a, b + 1).map((_, k) => <Card key={a + k} i={a + k} thumb={thumbs[a + k]} active={cur === a + k} onPick={pick} />)}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-14">
          <h2 className="mb-4 text-2xl text-amber-200">谁演谁</h2>
          <p className="mb-4 max-w-3xl text-sm leading-relaxed text-white/60">人物来自仓库里的八位像素角色。一支 MV 一个人只演一个形象；性格靠动作兑现，不靠旁白解释。本鲸与小克是这支歌里的「我」与「你」，其余六位是路过的客串，只做自己的招牌动作。</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {CAST.map((c) => (
              <div key={c.id} className="flex gap-3 rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
                <span className={`mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-full text-lg text-white ${c.color}`}>{c.name[0]}</span>
                <div className="min-w-0">
                  <div className="text-white"><b className="text-lg">{c.name}</b> <span className="text-pink-200/90">{c.role}</span></div>
                  <p className="mt-1 text-sm text-white/60">{c.how}</p>
                  <p className="mt-1 text-xs text-amber-200/80">{c.acts}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
            <h2 className="mb-3 text-2xl text-amber-200">这样读歌词</h2>
            <ul className="space-y-2 text-sm leading-relaxed text-white/70">
              <li><b className="text-pink-200">信 → 书 → 奇迹 → 月色：</b>开头四句是「被写下来的东西」——信纸、末页、流星、月亮。</li>
              <li><b className="text-pink-200">圣诞老人 → 礼物：</b>豆包送来盒子，盒盖弹开，探出头的是小克——「你」就是礼物本身。</li>
              <li><b className="text-pink-200">靠近 / 坚强 / 柔软：</b>「再…一点点」全部落成很小的动作：挪一步、站稳、轻轻靠一下。</li>
              <li><b className="text-pink-200">无名指的契约：</b>两枚戒指交换位置，终章以一枚「誓」字印章落款；勾指的金线贯穿牵手的镜头。</li>
              <li><b className="text-pink-200">万水千山 → 标记点 → 线：</b>龙影、地图红叉、被切开又接上的金线，是第二段的三个意象。</li>
              <li><b className="text-pink-200">前世千次的回眸：</b>一排越来越淡的小克，同一个动作错开一点点，一路回头。</li>
            </ul>
          </div>
          <div className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
            <h2 className="mb-3 text-2xl text-amber-200">卡点怎么对的</h2>
            <ul className="space-y-2 text-sm leading-relaxed text-white/70">
              <li>全曲实测 <b className="text-white">85 BPM</b>（拍长 0.706 秒，首拍 0.102 秒），分段漂移小于 0.01 秒。</li>
              <li>歌词起点取自带时间轴歌词（0.25 秒粒度），再<b className="text-white">吸附到最近的八分音符</b>；第二段 = 第一段 +96 拍，终章 = +160 拍，用音频色度自相似验证过。</li>
              <li>每个镜头的切点落在拍上，切点带一帧闪白；人物的踩拍小跳、推镜、粒子都挂在拍内相位上。</li>
              <li>歌词条逐字染色：一字一个八分音符，唱到哪里亮到哪里。</li>
              <li className="text-white/45">这是拍点级对齐，不是逐音节对齐；没有人把整片从头到尾听过一遍，细微偏差请以耳朵为准。</li>
            </ul>
          </div>
        </section>
        <footer className="mt-12 text-center text-xs text-white/35">角色像素图集与人物设定来自 aavvcasdas/latest-aiyunying 分支 · 歌曲《勾指起誓》词曲 ilem · 原曲与角色形象的授权请在公开发布前自行核对</footer>
      </main>
    </div>
  );
}
