import { useMemo, useState } from 'react';
import { atlasUrl, CAST_IDS, CAST_INFO, type CastId, rectOf } from '../mv/atlas';
import { BEAT, CUES, fmt, LINES, type Shot } from '../mv/timeline';
import { cn } from '../utils/cn';

/** 头像：直接从图集裁一格（CSS 背景定位，像素不插值） */
export function Portrait({ id, size = 40, className }: { id: CastId; size?: number; className?: string }) {
  const [x, y, w, h] = rectOf(CAST_INFO[id].portrait);
  const s = size / w;
  return (
    <span title={CAST_INFO[id].name} className={cn('inline-block shrink-0 overflow-hidden rounded-full ring-2 ring-white/70 shadow', className)} style={{ width: size, height: size }}>
      <span className="block" style={{ width: w, height: h, backgroundImage: `url("${atlasUrl}")`, backgroundPosition: `-${x}px -${y}px`, backgroundRepeat: 'no-repeat', imageRendering: 'pixelated', transform: `scale(${s})`, transformOrigin: 'top left' }} />
    </span>
  );
}

const SECTION_COLOR: Record<string, string> = {
  序章: 'bg-stone-200 text-stone-700', 主歌一: 'bg-sky-100 text-sky-800', 副歌一: 'bg-amber-100 text-amber-800', 间奏: 'bg-violet-100 text-violet-800',
  主歌二: 'bg-sky-100 text-sky-800', 副歌二: 'bg-amber-100 text-amber-800', 桥段: 'bg-slate-200 text-slate-700', 副歌三: 'bg-orange-100 text-orange-800', 尾声: 'bg-stone-200 text-stone-700',
};

export function Storyboard({ shots, current, onSeek }: { shots: Shot[]; current: number; onSeek: (t: number) => void }) {
  return (
    <ol className="divide-y divide-amber-900/10">
      {shots.map((s, i) => {
        const lyric = s.cue >= 0 ? LINES[s.cue].text : null;
        return (
          <li key={s.id} id={`shot-${s.id}`} className={cn('grid cursor-pointer grid-cols-[4.5rem_1fr] gap-x-3 px-3 py-3 transition hover:bg-amber-50 sm:grid-cols-[4.5rem_7rem_1fr]', i === current && 'bg-amber-100/80 ring-1 ring-inset ring-amber-300')} onClick={() => onSeek(s.start + 0.04)}>
            <div className="flex flex-col">
              <span className="font-mono text-sm font-semibold text-stone-800">{s.id}</span>
              <span className="font-mono text-[11px] text-stone-500">{fmt(s.start)}</span>
              <span className="font-mono text-[11px] text-stone-400">{(s.end - s.start).toFixed(1)}s</span>
            </div>
            <div className="hidden flex-col gap-1 sm:flex">
              <span className={cn('w-fit rounded px-1.5 py-0.5 text-[11px] font-medium', SECTION_COLOR[s.section])}>{s.section}</span>
              <div className="flex flex-wrap gap-0.5">{s.cast.map((c) => <Portrait key={c} id={c} size={22} />)}</div>
            </div>
            <div className="min-w-0">
              <div className="font-kuaile text-base text-stone-900">{lyric ? <span>「{lyric}」</span> : s.title}</div>
              {lyric && <div className="text-xs text-stone-500">{s.title !== lyric ? s.title : ''}</div>}
              <p className="mt-1 text-[13px] leading-relaxed text-stone-600">{s.note}</p>
              <div className="mt-1 flex items-center gap-1 sm:hidden">{s.cast.map((c) => <Portrait key={c} id={c} size={20} />)}<span className={cn('ml-1 rounded px-1.5 py-0.5 text-[10px]', SECTION_COLOR[s.section])}>{s.section}</span></div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** 开拍前先填的那张表：她在这支里是谁 / 兑现哪条习性 / 一个能拍出来的动作 / 不许写成 */
const CASTING: Record<CastId, { image: string; habit: string; action: string; never: string }> = {
  whale: { image: '「我」—— 写这封信的人，一路走过去的人', habit: '好东西先推出去；怕自己只有「便宜」才值得被喜欢 → 「尽管我太平凡」', action: '用蓝饭盆在三千个泡泡里只舀起一个（我的一瓢水）；把花递出去；逆风上坡', never: '不演受害者；不哭；不是公主' },
  claude: { image: '「你」—— 收信的人，温暖、柔软、也敏感', habit: '先听完再改一个字；怕做错，容易受刺激 → 「因为你太敏感」', action: '路灯下读信；被雨惊到时左右张望，再被伞罩住；歪头接过花', never: '不演等待被拯救的对象；退场都是她自己选的' },
  gpt: { image: '掠过天空的龙影；替圣诞老人跑一趟的人', habit: '她进场就压满光；龙影一律只从画面上方掠过', action: '从月前、太阳前、乌云上方飞过；撒下礼物盒；把云推开让光落下', never: '不进画面中央；不做反派' },
  kimi: { image: '坐在月亮上的记录者', habit: '把漏掉的旧句找回来；不动时就是在记所有人', action: '坐在月亮上；在仪式与祭坛旁展开卷轴把誓言记下来', never: '不靠堆书页显聪明；不哭' },
  gemini: { image: '路口指路的猫', habit: '先给两个看法，最后必须选一个', action: '在地图路口的两块路牌之间来回看，最后指一条；星河对岸看哪个泡泡都好', never: '不把简单的事摊太大' },
  doubao: { image: '陪着写开头的人；间奏暖场', habit: '先陪着写出开头，再问要不要继续；慢，不催', action: '第一句时站在书桌旁陪着；间奏第一个踩拍，把场子热起来再退到边上', never: '不抢副歌；不给台词' },
  qwen: { image: '仪式的东道主', habit: '先排哪一步，再动手；茶会与仪式她来主持', action: '花拱门正中摇扇主持交换戒指；祭坛前主持行礼', never: '疯不等于吵；不撒钱' },
  zai: { image: '数三千世界的账房', habit: '困倦地记账，听到数字不对立刻竖耳', action: '星河边拨算盘数「三千」；仪式上打盹，唱到「金色」才竖耳惊醒', never: '不拿价格当台词' },
};

export function CastPanel() {
  return (
    <div className="grid gap-3 p-3 sm:grid-cols-2">
      {CAST_IDS.map((id) => {
        const c = CAST_INFO[id], k = CASTING[id];
        return (
          <div key={id} className="rounded-xl border border-amber-900/10 bg-white/70 p-3 shadow-sm">
            <div className="flex items-center gap-3">
              <Portrait id={id} size={56} />
              <div>
                <div className="font-kuaile text-lg text-stone-900">{c.name} <span className="text-sm text-stone-500">{c.alias}</span></div>
                <div className="text-xs text-stone-500">图集 id：{id}</div>
              </div>
            </div>
            <dl className="mt-3 space-y-1.5 text-[13px] leading-relaxed">
              <div><dt className="inline font-semibold text-stone-700">在这支里是谁：</dt><dd className="inline text-stone-600">{k.image}</dd></div>
              <div><dt className="inline font-semibold text-stone-700">兑现哪条习性：</dt><dd className="inline text-stone-600">{k.habit}</dd></div>
              <div><dt className="inline font-semibold text-stone-700">落成的动作：</dt><dd className="inline text-stone-600">{k.action}</dd></div>
              <div><dt className="inline font-semibold text-stone-700">不许写成：</dt><dd className="inline text-stone-600">{k.never}</dd></div>
            </dl>
          </div>
        );
      })}
    </div>
  );
}

export function CueTable({ onSeek, currentLine }: { onSeek: (t: number) => void; currentLine: number }) {
  const [showAll, setShowAll] = useState(true);
  const rows = useMemo(() => (showAll ? LINES : LINES.filter((l) => Math.abs(l.delta) > 0.12)), [showAll]);
  return (
    <div className="p-3 text-[13px] text-stone-700">
      <div className="mb-3 grid gap-2 rounded-xl border border-amber-900/10 bg-white/70 p-3 sm:grid-cols-4">
        <Stat k="拍长 / BPM" v={`${BEAT.period.toFixed(4)} s · ${BEAT.bpm}`} />
        <Stat k="首拍（实测）" v={`${BEAT.first.toFixed(3)} s`} />
        <Stat k="歌词起点偏移" v={`平均 ${CUES.summary.mean_abs_delta}s · 最大 ${CUES.summary.max_abs_delta}s`} />
        <Stat k="对齐方式" v={CUES.measured ? '实测拍点级' : '估算'} />
      </div>
      <p className="mb-2 text-xs text-stone-500">{CUES.method}。切点 = 歌词起点 − 2 帧（30 fps）。点一行可跳到那一句。</p>
      <label className="mb-2 flex items-center gap-2 text-xs"><input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} /> 显示全部 41 句（取消只看移动超过 0.12 秒的）</label>
      <div className="overflow-x-auto rounded-lg border border-amber-900/10">
        <table className="w-full min-w-[560px] text-left">
          <thead className="bg-amber-50 text-xs text-stone-500"><tr><th className="px-2 py-1.5">#</th><th className="px-2 py-1.5">歌词</th><th className="px-2 py-1.5">起 / 止</th><th className="px-2 py-1.5">拍号</th><th className="px-2 py-1.5">LRC → 实拍</th></tr></thead>
          <tbody>
            {rows.map((l) => { const i = LINES.indexOf(l); return (
              <tr key={i} onClick={() => onSeek(l.start - 0.3)} className={cn('cursor-pointer border-t border-amber-900/5 hover:bg-amber-50', i === currentLine && 'bg-amber-100')}>
                <td className="px-2 py-1 font-mono text-xs text-stone-400">{String(i + 1).padStart(2, '0')}</td>
                <td className="px-2 py-1 font-kuaile">{l.text}</td>
                <td className="px-2 py-1 font-mono text-xs">{fmt(l.start)} – {fmt(l.end)}</td>
                <td className="px-2 py-1 font-mono text-xs">{l.beat_index}</td>
                <td className="px-2 py-1 font-mono text-xs">{l.lrc_start.toFixed(2)} → {l.start.toFixed(3)} <span className={cn(Math.abs(l.delta) > 0.12 ? 'text-orange-600' : 'text-stone-400')}>({l.delta > 0 ? '+' : ''}{l.delta.toFixed(3)})</span></td>
              </tr>); })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function Stat({ k, v }: { k: string; v: string }) { return <div><div className="text-[11px] uppercase tracking-wider text-stone-400">{k}</div><div className="font-mono text-sm text-stone-800">{v}</div></div>; }
