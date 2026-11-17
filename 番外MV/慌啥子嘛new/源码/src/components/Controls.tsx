// 剧场悬浮控制条与 47 镜分镜 + 八位像素角色速览抽屉（播放静止时自动完全隐藏，保持画面零角标零遮挡）
import React, { useEffect, useRef } from 'react';
import {
  Box,
  Download,
  Film,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { type AtlasData, CAST_INFO, type CharId } from '../mv/actors';
import { CUES, DURATION, SHOT_SLOTS } from '../mv/cues';
import type { ShotDef } from '../mv/engine';

export const PixelAvatar: React.FC<{ atlas: AtlasData; charId: CharId; size?: number }> = ({
  atlas,
  charId,
  size = 34,
}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const key = CAST_INFO[charId].portrait;
  const r = atlas.rects[key];

  useEffect(() => {
    const cv = ref.current;
    if (!cv || !r) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.drawImage(atlas.img, r[0], r[1], r[2], r[3], 0, 0, cv.width, cv.height);
  }, [atlas, r]);

  if (!r) return null;
  return (
    <canvas
      ref={ref}
      width={r[2] * 2}
      height={r[3] * 2}
      title={`${CAST_INFO[charId].name} · ${CAST_INFO[charId].role}`}
      className="pixel-crisp block rounded-md bg-[#281f42] border border-[#ffd166]/60 shrink-0"
      style={{ width: size, height: size }}
    />
  );
};

function fmtTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${String(rem).padStart(2, '0')}`;
}

interface ControlsProps {
  visible: boolean;
  playing: boolean;
  muted: boolean;
  currentTime: number;
  shotIdx: number;
  shots: ShotDef[];
  atlas: AtlasData;
  showWords3D: boolean;
  drawerOpen: boolean;
  isFullscreen: boolean;
  onTogglePlay: () => void;
  onRestart: () => void;
  onSeek: (t: number) => void;
  onToggleMute: () => void;
  onToggleWords3D: () => void;
  onToggleDrawer: () => void;
  onToggleFullscreen: () => void;
  onExport: () => void;
}

const SECTION_MARKS: { label: string; t: number }[] = [
  { label: '序章', t: 0 },
  { label: '引歌', t: SHOT_SLOTS[4].start },
  { label: '主歌一', t: SHOT_SLOTS[8].start },
  { label: '副歌一', t: SHOT_SLOTS[16].start },
  { label: '间奏', t: SHOT_SLOTS[24].start },
  { label: '主歌二', t: SHOT_SLOTS[28].start },
  { label: '副歌二', t: SHOT_SLOTS[36].start },
  { label: '尾声', t: SHOT_SLOTS[44].start },
];

export const Controls: React.FC<ControlsProps> = ({
  visible,
  playing,
  muted,
  currentTime,
  shotIdx,
  shots,
  atlas,
  showWords3D,
  drawerOpen,
  isFullscreen,
  onTogglePlay,
  onRestart,
  onSeek,
  onToggleMute,
  onToggleWords3D,
  onToggleDrawer,
  onToggleFullscreen,
  onExport,
}) => {
  const activeShot = shots[shotIdx];
  const activeSlot = SHOT_SLOTS[shotIdx];
  const pct = Math.min(100, Math.max(0, (currentTime / DURATION) * 100));
  const showBar = visible || drawerOpen;

  return (
    <>
      {/* 底部半透明剧场控制栏 */}
      <div
        className={`fixed inset-x-0 bottom-0 z-30 transition-all duration-300 ${
          showBar ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <div className="mx-auto max-w-4xl px-4 pb-3">
          <div className="rounded-2xl bg-[#140f24]/88 backdrop-blur-md border border-[#ffd166]/30 px-4 py-2.5 shadow-2xl">
            {/* 段落时间轴拖拽条 */}
            <div className="relative group flex items-center h-5 cursor-pointer">
              <input
                type="range"
                min={0}
                max={DURATION}
                step={0.02}
                value={currentTime}
                onChange={(e) => onSeek(Number(e.target.value))}
                aria-label="播放进度"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="w-full h-1.5 rounded-full bg-white/15 overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-[#ffb357] via-[#ffd166] to-[#ffe985]"
                  style={{ width: `${pct}%` }}
                />
              </div>
              {SECTION_MARKS.slice(1).map((m) => (
                <span
                  key={m.label}
                  title={m.label}
                  className="pointer-events-none absolute top-1.5 w-0.5 h-2 bg-white/40 rounded-full"
                  style={{ left: `${(m.t / DURATION) * 100}%` }}
                />
              ))}
              <div
                className="pointer-events-none absolute w-3.5 h-3.5 rounded-full bg-[#ffd86b] border-2 border-[#1b1330] shadow -translate-x-1/2"
                style={{ left: `${pct}%` }}
              />
            </div>

            {/* 按钮与当前镜头登场人物 */}
            <div className="mt-1 flex items-center justify-between gap-3 text-sm">
              <div className="flex items-center gap-2">
                <button
                  onClick={onTogglePlay}
                  className="w-9 h-9 rounded-full bg-[#ffd166] text-[#1c132e] flex items-center justify-center hover:bg-[#ffe08a] active:scale-95 transition cursor-pointer"
                  title={playing ? '暂停 (空格)' : '播放 (空格)'}
                >
                  {playing ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>
                <button
                  onClick={onRestart}
                  className="w-8 h-8 rounded-full bg-white/10 text-amber-100 flex items-center justify-center hover:bg-white/20 transition cursor-pointer"
                  title="从头播放"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={onToggleMute}
                  className="w-8 h-8 rounded-full bg-white/10 text-amber-100 flex items-center justify-center hover:bg-white/20 transition cursor-pointer"
                  title={muted ? '取消静音 (M)' : '静音 (M)'}
                >
                  {muted ? <VolumeX className="w-4 h-4 text-rose-300" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <span className="ml-1 text-xs text-amber-100/85 tabular-nums tracking-wider">
                  {fmtTime(currentTime)} / {fmtTime(DURATION)}
                </span>
              </div>

              {/* 当前分镜信息 + 登场像素角色头像 */}
              <div className="hidden sm:flex items-center gap-2 min-w-0">
                <span className="px-2 py-0.5 rounded bg-[#ffd166]/18 border border-[#ffd166]/35 text-[#ffd86b] text-xs shrink-0">
                  {activeSlot?.section} · {activeShot?.id}
                </span>
                <span className="text-amber-50/90 text-xs truncate max-w-[160px]">
                  {activeShot?.title}
                </span>
                <div className="flex items-center -space-x-1 ml-1">
                  {activeShot?.cast.slice(0, 5).map((cid) => (
                    <PixelAvatar key={cid} atlas={atlas} charId={cid} size={24} />
                  ))}
                </div>
              </div>

              {/* 右侧功能键 */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onToggleWords3D}
                  className={`px-2.5 h-8 rounded-lg text-xs flex items-center gap-1.5 border transition cursor-pointer ${
                    showWords3D
                      ? 'bg-[#ffd166]/20 border-[#ffd166]/55 text-[#ffe082]'
                      : 'bg-white/8 border-white/15 text-white/60 hover:text-white'
                  }`}
                  title="开关场景内 3D 逐字逐词积木"
                >
                  <Box className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">立体字词</span>
                </button>
                <button
                  onClick={onExport}
                  className="px-2.5 h-8 rounded-lg text-xs flex items-center gap-1.5 border border-[#ffd166] bg-[#ffd166] text-[#1c132e] hover:bg-[#ffe085] transition cursor-pointer font-semibold"
                  title="导出 MP4 成片"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">导出 MP4</span>
                </button>
                <button
                  onClick={onToggleDrawer}
                  className={`px-2.5 h-8 rounded-lg text-xs flex items-center gap-1.5 border transition cursor-pointer ${
                    drawerOpen
                      ? 'bg-[#ffd166] border-[#ffd166] text-[#1c132e]'
                      : 'bg-white/10 border-white/15 text-amber-100 hover:bg-white/20'
                  }`}
                  title="打开分镜与登场人物总览"
                >
                  <Film className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">分镜</span>
                </button>
                <button
                  onClick={onToggleFullscreen}
                  className="w-8 h-8 rounded-lg bg-white/10 text-amber-100 flex items-center justify-center hover:bg-white/20 transition cursor-pointer"
                  title="全屏 (F)"
                >
                  {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧分镜与八位角色总览抽屉 */}
      {drawerOpen && (
        <div className="fixed right-3 top-3 bottom-20 z-40 w-80 sm:w-96 rounded-2xl bg-[#161129]/95 backdrop-blur-lg border border-[#ffd166]/35 shadow-2xl flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <div>
              <div className="text-base text-[#ffd86b] tracking-wider">慌啥子嘛 · 分镜与演员表</div>
              <div className="text-[11px] text-amber-100/60">
                全片四十七镜 · 三十六句逐字卡点 · 八位像素角色
              </div>
            </div>
            <button
              onClick={onToggleDrawer}
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-amber-100 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 八位分支登场角色头像栏 */}
          <div className="px-3 py-2.5 border-b border-white/10 bg-black/20">
            <div className="grid grid-cols-4 gap-1.5">
              {(Object.keys(CAST_INFO) as CharId[]).map((cid) => (
                <div
                  key={cid}
                  className="flex items-center gap-1.5 rounded-lg bg-white/5 px-1.5 py-1 border border-white/8"
                >
                  <PixelAvatar atlas={atlas} charId={cid} size={26} />
                  <span className="text-[11px] text-amber-50/90 truncate">{CAST_INFO[cid].name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 段落快捷跳转 */}
          <div className="px-3 py-2 border-b border-white/10 flex flex-wrap gap-1">
            {SECTION_MARKS.map((m) => (
              <button
                key={m.label}
                onClick={() => onSeek(m.t + 0.02)}
                className="px-2 py-0.5 rounded-md bg-white/8 hover:bg-[#ffd166]/25 text-[11px] text-amber-100/85 hover:text-[#ffe082] transition cursor-pointer"
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* 47 镜逐镜列表 */}
          <div className="flex-1 overflow-y-auto mv-scroll p-2 space-y-1">
            {SHOT_SLOTS.map((sl, idx) => {
              const def = shots[idx];
              const cue = sl.cueIdx >= 0 ? CUES[sl.cueIdx] : null;
              const active = idx === shotIdx;
              return (
                <button
                  key={sl.id}
                  onClick={() => onSeek(sl.start + 0.03)}
                  className={`w-full text-left rounded-xl px-3 py-2 transition flex items-center justify-between gap-2 cursor-pointer ${
                    active
                      ? 'bg-[#ffd166]/22 border border-[#ffd166]/60'
                      : 'bg-white/4 hover:bg-white/10 border border-transparent'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#ffd86b] tabular-nums">{sl.id}</span>
                      <span className="text-[11px] text-white/45 tabular-nums">{fmtTime(sl.start)}</span>
                      <span className="text-xs text-amber-50 truncate">
                        {cue ? cue.text : def.title}
                      </span>
                    </div>
                    {cue && (
                      <div className="mt-0.5 text-[10px] text-amber-200/60 truncate">
                        分词：{cue.words.map((w) => w.text).join(' · ')}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center -space-x-1 shrink-0">
                    {def.cast.slice(0, 3).map((cid) => (
                      <PixelAvatar key={cid} atlas={atlas} charId={cid} size={20} />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};
