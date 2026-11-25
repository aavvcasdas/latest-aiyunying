import React, { useEffect, useRef, useState } from 'react';
import { Film, Music, Sparkles, Users, X } from 'lucide-react';
import { ATLAS_META, ATLAS_URL, CAST_PROFILES, type CharId } from '../mv/actors';
import { SHOT_MAP } from '../mv/engine';
import {
  CHAPTERS,
  LYRIC_CUES,
  SHOT_SLOTS,
  type WordTone,
} from '../mv/timeline';

export function formatTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

/** 直接从原版 cast_atlas.png 精确裁切 64×64 角色像素头像 */
export const PixelAvatar: React.FC<{ portraitKey: string; size?: number; color?: string }> = ({
  portraitKey,
  size = 44,
  color = '#ff9ec4',
}) => {
  const rect = ATLAS_META.s[portraitKey];
  if (!rect) return null;
  const [x, y, w, h] = rect;
  const scale = size / Math.max(w, h);
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-xl border border-white/15 bg-[#1a162b]"
      style={{
        width: size,
        height: size,
        boxShadow: `0 0 16px -4px ${color}66`,
      }}
    >
      <div
        className="pixel-art"
        style={{
          width: w,
          height: h,
          backgroundImage: `url(${ATLAS_URL})`,
          backgroundPosition: `-${x}px -${y}px`,
          backgroundSize: `${ATLAS_META.w}px ${ATLAS_META.h}px`,
          backgroundRepeat: 'no-repeat',
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
      />
    </div>
  );
};

const CAST_BY_ID = Object.fromEntries(CAST_PROFILES.map((c) => [c.id, c])) as Record<
  CharId,
  (typeof CAST_PROFILES)[number]
>;

const TONE_BADGE: Record<WordTone, string> = {
  base: 'bg-white/10 text-amber-50 border-white/15',
  sakura: 'bg-pink-400/25 text-pink-200 border-pink-300/45',
  gold: 'bg-amber-400/25 text-amber-200 border-amber-300/45',
  mint: 'bg-emerald-400/25 text-emerald-200 border-emerald-300/45',
  star: 'bg-sky-400/25 text-sky-200 border-sky-300/45',
};

interface DrawerProps {
  tab: 'shots' | 'lyrics' | 'cast' | null;
  onClose: () => void;
  onTabChange: (tab: 'shots' | 'lyrics' | 'cast') => void;
  currentTime: number;
  currentShotId: string;
  onJump: (time: number, autoPlay?: boolean) => void;
}

export const DrawerPanels: React.FC<DrawerProps> = ({
  tab,
  onClose,
  onTabChange,
  currentTime,
  currentShotId,
  onJump,
}) => {
  const [sectionFilter, setSectionFilter] = useState<string>('全部');
  const activeLyricRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (tab === 'lyrics' && activeLyricRef.current) {
      activeLyricRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, [tab, Math.floor(currentTime / 3)]);

  if (!tab) return null;

  const filteredShots =
    sectionFilter === '全部'
      ? SHOT_SLOTS
      : SHOT_SLOTS.filter((s) => s.section === sectionFilter);

  const jumpToShot = (shotId: string) => {
    const found = SHOT_SLOTS.find((s) => s.id === shotId);
    if (found) onJump(found.a + 0.12, true);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-pink-200/15 bg-[#120f21]/92 shadow-2xl backdrop-blur-xl">
      {/* 顶部标签栏 */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onTabChange('shots')}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
              tab === 'shots'
                ? 'bg-pink-400/25 text-pink-100 ring-1 ring-pink-300/40'
                : 'text-white/65 hover:bg-white/8 hover:text-white'
            }`}
          >
            <Film className="h-3.5 w-3.5" />
            分镜表
          </button>
          <button
            onClick={() => onTabChange('lyrics')}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
              tab === 'lyrics'
                ? 'bg-pink-400/25 text-pink-100 ring-1 ring-pink-300/40'
                : 'text-white/65 hover:bg-white/8 hover:text-white'
            }`}
          >
            <Music className="h-3.5 w-3.5" />
            字词卡点
          </button>
          <button
            onClick={() => onTabChange('cast')}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
              tab === 'cast'
                ? 'bg-pink-400/25 text-pink-100 ring-1 ring-pink-300/40'
                : 'text-white/65 hover:bg-white/8 hover:text-white'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            登场角色
          </button>
        </div>
        <button
          onClick={onClose}
          aria-label="关闭面板"
          className="rounded-full p-1.5 text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* 分镜表视图 */}
      {tab === 'shots' && (
        <>
          <div className="mv-scroll flex gap-1.5 overflow-x-auto border-b border-white/8 px-4 py-2.5">
            {['全部', ...CHAPTERS.map((c) => c.name)].map((sec) => (
              <button
                key={sec}
                onClick={() => setSectionFilter(sec)}
                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] transition ${
                  sectionFilter === sec
                    ? 'bg-pink-300/25 text-pink-100 ring-1 ring-pink-300/40'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                }`}
              >
                {sec}
              </button>
            ))}
          </div>
          <div className="mv-scroll flex-1 space-y-2 overflow-y-auto p-3.5">
            {filteredShots.map((slot) => {
              const def = SHOT_MAP[slot.id];
              const active = slot.id === currentShotId;
              return (
                <button
                  key={slot.id}
                  onClick={() => onJump(slot.a + 0.08, true)}
                  className={`w-full rounded-2xl border p-3 text-left transition ${
                    active
                      ? 'border-pink-300/50 bg-pink-400/15 shadow-lg shadow-pink-500/10'
                      : 'border-white/8 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-[10px] text-pink-200">
                        {slot.id}
                      </span>
                      <span className="text-xs font-semibold text-white">{def.title}</span>
                    </div>
                    <span className="font-mono text-[11px] text-white/45">
                      {formatTime(slot.a)}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-pink-200/85">{def.lyric}</p>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-white/55">
                    {def.note}
                  </p>
                  {def.cast.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {def.cast.map((cid) => (
                        <span
                          key={cid}
                          className="rounded-full bg-white/8 px-2 py-0.5 text-[10px]"
                          style={{ color: CAST_BY_ID[cid].color }}
                        >
                          {CAST_BY_ID[cid].name}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* 软3D逐词+逐字卡点对齐面板 */}
      {tab === 'lyrics' && (
        <div className="mv-scroll flex-1 space-y-2.5 overflow-y-auto p-3.5">
          <div className="rounded-xl border border-pink-300/20 bg-pink-400/8 px-3 py-2 text-[11px] leading-relaxed text-pink-100/85">
            <Sparkles className="mr-1 inline h-3.5 w-3.5 text-pink-300" />
            点击任意<b>词语</b>或<b>单句</b>可直达该毫秒卡点：词块底座按词对齐Q弹，字面按实测音节逐字扫光挤出。
          </div>
          {LYRIC_CUES.map((cue) => {
            const isNow = currentTime >= cue.start - 0.12 && currentTime <= cue.end + 0.15;
            return (
              <div
                key={cue.id}
                ref={isNow ? activeLyricRef : undefined}
                className={`rounded-2xl border p-2.5 transition ${
                  isNow
                    ? 'border-pink-300/50 bg-pink-400/14'
                    : 'border-white/8 bg-white/[0.03] hover:border-white/15'
                }`}
              >
                <div className="mb-1.5 flex items-center justify-between text-[10px] text-white/45">
                  <span>{cue.section}</span>
                  <button
                    onClick={() => onJump(Math.max(0, cue.start - 0.05), true)}
                    className="font-mono hover:text-pink-200"
                  >
                    {formatTime(cue.start)}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {cue.words.map((w) => {
                    const wActive = isNow && currentTime >= w.t0 && currentTime <= w.tEnd + 0.12;
                    return (
                      <button
                        key={w.index}
                        onClick={() => onJump(Math.max(0, w.t0 - 0.03), true)}
                        className={`rounded-lg border px-2 py-0.5 font-mv text-sm transition ${
                          TONE_BADGE[w.tone]
                        } ${
                          wActive
                            ? 'scale-105 ring-2 ring-white/75 brightness-125'
                            : 'opacity-85 hover:opacity-100'
                        }`}
                      >
                        {cue.style === 'lala'
                          ? w.label
                          : cue.chars.slice(w.from, w.to + 1).map((ct) => {
                              const cSung = isNow && currentTime >= ct.t0;
                              return (
                                <span
                                  key={ct.index}
                                  className={cSung ? 'text-white drop-shadow' : ''}
                                >
                                  {ct.ch}
                                </span>
                              );
                            })}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 八位分支角色设定与选角表 */}
      {tab === 'cast' && (
        <div className="mv-scroll flex-1 space-y-2.5 overflow-y-auto p-3.5">
          <p className="px-1 text-[11px] leading-relaxed text-white/60">
            全员采用目标分支原版角色图集与派生动作，一人一形象，依据《樱花草》词意与各自习性编排登场。
          </p>
          {CAST_PROFILES.map((c) => (
            <div
              key={c.id}
              className="rounded-2xl border border-white/10 bg-white/[0.035] p-3 transition hover:border-white/20"
            >
              <div className="flex items-center gap-3">
                <PixelAvatar portraitKey={c.portrait} size={48} color={c.color} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{c.name}</span>
                    <span className="truncate text-[11px] text-white/45">{c.alias}</span>
                  </div>
                  <div className="mt-0.5 text-xs font-medium" style={{ color: c.color }}>
                    {c.mvRole}
                  </div>
                </div>
                <button
                  onClick={() => jumpToShot(c.appearShot)}
                  className="shrink-0 rounded-full border border-white/15 bg-white/8 px-2.5 py-1 text-[11px] text-white/85 transition hover:border-pink-300/50 hover:bg-pink-400/20 hover:text-white"
                >
                  看登场
                </button>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-white/65">
                <span className="text-white/40">习性：</span>
                {c.habit}
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-white/65">
                <span className="text-white/40">演出：</span>
                {c.sceneAction}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
