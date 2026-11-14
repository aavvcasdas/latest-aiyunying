import React from 'react';
import { CheckCircle2, Download, Film, Loader2, Sparkles, X, AlertCircle } from 'lucide-react';
import type { ExportProgress, ExportQuality, ExportResult } from '../mv/mp4Exporter';
import { triggerDownload } from '../mv/mp4Exporter';

interface Props {
  open: boolean;
  quality: ExportQuality;
  onQualityChange: (q: ExportQuality) => void;
  showLyrics: boolean;
  onToggleLyrics: (v: boolean) => void;
  exporting: boolean;
  progress: ExportProgress | null;
  result: ExportResult | null;
  error: string | null;
  onStart: () => void;
  onCancel: () => void;
  onClose: () => void;
}

function formatEta(sec: number | null): string {
  if (sec == null || !Number.isFinite(sec)) return '计算中…';
  if (sec < 60) return `约 ${Math.ceil(sec)} 秒`;
  const m = Math.floor(sec / 60);
  const s = Math.ceil(sec % 60);
  return `约 ${m} 分 ${s} 秒`;
}

export const ExportModal: React.FC<Props> = ({
  open,
  quality,
  onQualityChange,
  showLyrics,
  onToggleLyrics,
  exporting,
  progress,
  result,
  error,
  onStart,
  onCancel,
  onClose,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-amber-300/30 bg-[#171329] shadow-[0_24px_80px_rgba(0,0,0,0.65)] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-[#221b3d] to-[#19142c]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400/15 border border-amber-300/35 flex items-center justify-center text-amber-300">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-wide text-amber-100">导出《勾指起誓》完整 MV</h3>
              <p className="text-xs text-slate-400">H.264 + AAC 音画同步封装 · 30 fps · 含《童话镇》风格卡点字幕</p>
            </div>
          </div>
          {!exporting && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
              aria-label="关闭"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {!exporting && !result && (
            <>
              <div className="space-y-2.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-amber-200/80">选择导出分辨率</label>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { q: '720p' as const, title: '高清 720p', desc: '1280×720 · 导出更快（推荐）' },
                    { q: '1080p' as const, title: '全高清 1080p', desc: '1920×1080 · 影院级像素锐度' },
                  ]).map((item) => (
                    <button
                      key={item.q}
                      type="button"
                      onClick={() => onQualityChange(item.q)}
                      className={`text-left p-3.5 rounded-xl border transition cursor-pointer ${
                        quality === item.q
                          ? 'border-amber-300 bg-amber-400/12 shadow-[0_0_20px_rgba(255,209,102,0.15)]'
                          : 'border-white/10 bg-white/[0.03] hover:border-white/25'
                      }`}
                    >
                      <div className="text-sm font-bold text-white flex items-center justify-between">
                        {item.title}
                        {quality === item.q && <Sparkles className="w-4 h-4 text-amber-300" />}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center justify-between p-3.5 rounded-xl border border-white/10 bg-white/[0.03] cursor-pointer">
                <div>
                  <div className="text-sm font-medium text-slate-100">烧录《童话镇》风格金色扫色字幕</div>
                  <div className="text-xs text-slate-400 mt-0.5">使用站酷快乐体逐字卡点染色，全片零水印、零角标</div>
                </div>
                <input
                  type="checkbox"
                  checked={showLyrics}
                  onChange={(e) => onToggleLyrics(e.target.checked)}
                  className="w-4 h-4 accent-amber-400 cursor-pointer"
                />
              </label>

              <div className="rounded-xl bg-indigo-950/60 border border-indigo-400/20 px-4 py-3 text-xs text-indigo-200/90 leading-relaxed">
                导出过程会在浏览器本地逐帧渲染全部 53 个 3D 立体童话书分镜（共 5511 帧）并混入《勾指起誓》原曲音轨，期间请保持本标签页开启。
              </div>
            </>
          )}

          {exporting && progress && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium text-amber-200">
                  <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                  {progress.message}
                </span>
                <span className="font-mono font-bold text-amber-300">{progress.percent.toFixed(1)}%</span>
              </div>

              <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden border border-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 via-yellow-300 to-rose-400 transition-all duration-150"
                  style={{ width: `${Math.max(2, Math.min(100, progress.percent))}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2">
                  <div className="text-slate-400">当前进度</div>
                  <div className="font-mono text-slate-100 mt-0.5">{progress.frame} / {progress.totalFrames} 帧</div>
                </div>
                <div className="rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2">
                  <div className="text-slate-400">当前分镜</div>
                  <div className="font-mono text-amber-300 mt-0.5">{progress.shotId}</div>
                </div>
                <div className="rounded-lg bg-white/[0.04] border border-white/10 px-3 py-2">
                  <div className="text-slate-400">预计剩余</div>
                  <div className="text-slate-100 mt-0.5">{formatEta(progress.etaSec)}</div>
                </div>
              </div>

              {progress.lyric && (
                <div className="rounded-xl bg-[#120e22] border border-amber-300/25 px-4 py-2.5 text-center">
                  <span className="text-xs text-slate-400 mr-2">正在渲染歌词</span>
                  <span className="text-sm font-bold text-amber-200">「{progress.lyric}」</span>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2.5 rounded-xl bg-rose-950/60 border border-rose-400/30 p-3.5 text-xs text-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <div>{error}</div>
            </div>
          )}

          {result && !exporting && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl bg-emerald-950/50 border border-emerald-400/30 p-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                <div>
                  <div className="text-sm font-bold text-emerald-200">《勾指起誓》MV 导出成功！</div>
                  <div className="text-xs text-emerald-300/80 mt-0.5">
                    {result.filename} · {result.width}×{result.height} · {(result.sizeBytes / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => triggerDownload(result.url, result.filename)}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 text-[#1c142d] font-bold text-sm flex items-center justify-center gap-2 shadow-[0_8px_28px_rgba(255,209,102,0.35)] transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                下载 {result.filename}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 bg-[#131024]">
          {exporting ? (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl border border-rose-400/40 bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 text-sm font-medium transition cursor-pointer"
            >
              取消导出
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-white/15 hover:bg-white/10 text-slate-300 text-sm transition cursor-pointer"
              >
                {result ? '完成' : '先再看看'}
              </button>
              {!result && (
                <button
                  type="button"
                  onClick={onStart}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 text-[#1b132b] font-bold text-sm flex items-center gap-2 shadow-[0_6px_24px_rgba(255,209,102,0.32)] transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  开始渲染并导出 MP4
                </button>
              )}
              {result && (
                <button
                  type="button"
                  onClick={onStart}
                  className="px-4 py-2 rounded-xl border border-amber-300/35 bg-amber-400/10 hover:bg-amber-400/20 text-amber-200 text-sm font-medium transition cursor-pointer"
                >
                  重新渲染
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
