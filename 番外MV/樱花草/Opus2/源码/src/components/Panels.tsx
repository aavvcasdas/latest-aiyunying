import atlasJson from '../assets/cast_atlas.json';
import atlasUrl from '../assets/cast_atlas.png';
import { CAST, CAST_IDS, type CastId } from '../mv/atlas';
import type { PlannedShot } from '../mv/engine';
import { LINES } from '../mv/cues';
import { fmt } from '../mv/timeline';
import { cn } from '../utils/cn';
import { secColor } from './MVPlayer';

const ATLAS = atlasJson as unknown as { w: number; h: number; s: Record<string, [number, number, number, number]> };

export function Sprite({ k, size, className }: { k: string; size: number; className?: string }) {
  const r = ATLAS.s[k];
  if (!r) return null;
  const sc = size / Math.max(r[2], r[3]);
  return (
    <span className={cn('inline-block shrink-0', className)} style={{ width: r[2] * sc, height: r[3] * sc, backgroundImage: `url(${atlasUrl})`, backgroundPosition: `${-r[0] * sc}px ${-r[1] * sc}px`, backgroundSize: `${ATLAS.w * sc}px ${ATLAS.h * sc}px`, imageRendering: 'pixelated' }} />
  );
}
export const Portrait = ({ id, size = 28 }: { id: CastId; size?: number }) => (
  <span className="inline-flex overflow-hidden rounded-full ring-2 ring-white/70" style={{ width: size, height: size, background: CAST[id].color }} title={CAST[id].name}>
    <Sprite k={CAST[id].portrait} size={size} />
  </span>
);

export function Storyboard({ shots, current, onSeek }: { shots: PlannedShot[]; current: number; onSeek: (t: number) => void }) {
  return (
    <ol className="divide-y divide-pink-900/10">
      {shots.map((s, i) => (
        <li key={s.id} id={`shot-${s.id}`}>
          <button onClick={() => onSeek(s.start + 0.02)} className={cn('flex w-full gap-3 px-3 py-2.5 text-left transition', i === current ? 'bg-pink-100/80' : 'hover:bg-white/70')}>
            <div className="w-14 shrink-0 pt-0.5">
              <div className="font-mono text-[11px] font-semibold text-stone-700">{s.id}</div>
              <div className="font-mono text-[10px] text-stone-400">{fmt(s.start)}</div>
              <div className="font-mono text-[10px] text-stone-400">{(s.end - s.start).toFixed(1)}s</div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded px-1.5 py-0.5 text-[10px] text-white" style={{ background: secColor(s.sec) }}>{s.sec}</span>
                <span className="font-kuaile text-[15px] text-stone-900">{s.label}</span>
              </div>
              <p className="mt-1 text-[12px] leading-snug text-stone-600">{s.note}</p>
              {s.cast.length > 0 && <div className="mt-1.5 flex flex-wrap gap-1">{s.cast.map((c) => <Portrait key={c} id={c} size={22} />)}</div>}
            </div>
          </button>
        </li>
      ))}
    </ol>
  );
}

export function CastPanel() {
  return (
    <div className="space-y-3 p-3">
      <p className="rounded-lg bg-white/70 p-3 text-[12px] leading-relaxed text-stone-600">一支 MV 一个人只演一个形象；性格靠动作兑现。歌里的感情戏只在这支片子里成立，不回写进日常线。Grok 暂无造型格，本片没有上场。</p>
      {CAST_IDS.map((id) => {
        const c = CAST[id];
        return (
          <div key={id} className="rounded-xl border border-pink-900/10 bg-white/80 p-3 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-20 w-20 shrink-0 items-end justify-center rounded-lg" style={{ background: `${c.color}22` }}><Sprite k={c.front[0]} size={72} /></div>
              <div className="min-w-0">
                <div className="flex items-baseline gap-2"><span className="font-kuaile text-lg text-stone-900">{c.name}</span><span className="text-[11px] text-stone-400">{c.alias}</span></div>
                <div className="text-[13px] font-medium" style={{ color: c.color }}>{c.role}</div>
                <div className="mt-0.5 text-[11px] text-stone-500">出场：{c.scenes}</div>
              </div>
            </div>
            <div className="mt-2 space-y-1 text-[12px] leading-snug text-stone-600">
              <p><b className="text-stone-800">习性</b>　{c.trait}</p>
              <p><b className="text-stone-800">落成动作</b>　{c.action}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function CueTable({ t, onSeek }: { t: number; onSeek: (t: number) => void }) {
  return (
    <div className="p-3">
      <p className="mb-3 rounded-lg bg-white/70 p-3 text-[12px] leading-relaxed text-stone-600">
        每个字一个卡点（点字可跳转）。词之间用细线分组——歌词条上正在唱的「词」会亮粉色光带，字从左往右扫金。时间全部来自对这条 mp3 的实测：74.00 BPM 节拍网格 + 人声起音，重复段落合并求共识，吸附到八分音符。
      </p>
      <div className="space-y-2">
        {LINES.map((L) => {
          const active = t >= L.start - 0.2 && t <= L.end + 0.3;
          return (
            <div key={L.id} className={cn('rounded-lg border px-2.5 py-2 transition', active ? 'border-pink-300 bg-pink-50 shadow-sm' : 'border-transparent bg-white/60')}>
              <div className="mb-1 flex items-center gap-2 text-[10px] text-stone-400">
                <span className="rounded px-1 text-white" style={{ background: secColor(L.sec) }}>{L.sec}</span>
                <span className="font-mono">#{String(L.id + 1).padStart(2, '0')} · {fmt(L.start)} → {fmt(L.end)}</span>
              </div>
              <div className="flex flex-wrap items-end gap-y-1">
                {L.words.map((w, wi) => (
                  <span key={wi} className={cn('flex items-end', w.sep ? 'mr-2' : '', w.sep === '，' ? 'mr-4' : '')}>
                    <span className="flex rounded-md border border-pink-900/10 bg-white/80 p-0.5">
                      {w.c.map(([ch, t0], ci) => {
                        const on = t >= t0;
                        return (
                          <button key={ci} onClick={() => onSeek(t0 - 0.6)} title={`${ch} @ ${t0.toFixed(2)}s`} className={cn('flex min-w-[26px] flex-col items-center rounded px-0.5 transition', on && active ? 'bg-amber-300 text-stone-900' : 'hover:bg-pink-100')}>
                            <span className="font-kuaile text-[15px] leading-tight">{ch}</span>
                            <span className="font-mono text-[9px] text-stone-400">{t0.toFixed(1)}</span>
                          </button>
                        );
                      })}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
