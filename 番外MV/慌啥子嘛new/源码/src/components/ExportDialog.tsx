// MP4 导出面板：1080p / 720p 选择、逐帧进度、取消与自动下载
import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Download, Film, Loader2, TriangleAlert, X } from 'lucide-react';
import type { AtlasData } from '../mv/actors';
import { DURATION, FPS } from '../mv/cues';
import { downloadBlob, exportMp4, type ExportResult } from '../mv/exportMp4';

interface ExportDialogProps {
  open: boolean;
  atlas: AtlasData | null;
  onClose: () => void;
}

type Status = 'idle' | 'running' | 'done' | 'error';

export function ExportDialog({ open, atlas, onClose }: ExportDialogProps) {
  const [quality, setQuality] = useState<'1080' | '720'>('1080');
  const [status, setStatus] = useState<Status>('idle');
  const [ratio, setRatio] = useState(0);
  const [phase, setPhase] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState<ExportResult | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && status !== 'running') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, status, onClose]);

  if (!open) return null;

  const totalFrames = Math.ceil(DURATION * FPS);

  const start = async () => {
    if (!atlas || status === 'running') return;
    const controller = new AbortController();
    abortRef.current = controller;
    setStatus('running');
    setRatio(0);
    setError('');
    setResult(null);
    setPhase('准备 3D 立体绘本…');
    try {
      const [w, h] = quality === '1080' ? [1920, 1080] : [1280, 720];
      const res = await exportMp4({
        atlas,
        width: w,
        height: h,
        signal: controller.signal,
        onProgress: (r, p) => {
          setRatio(r);
          setPhase(p);
        },
      });
      setResult(res);
      setStatus('done');
      downloadBlob(res.blob, res.filename);
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        setStatus('idle');
        setPhase('已取消导出');
      } else {
        setStatus('error');
        setError(e instanceof Error ? e.message : String(e));
      }
    } finally {
      abortRef.current = null;
    }
  };

  const cancel = () => {
    abortRef.current?.abort();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#ffd166]/35 bg-[#161129] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5">
          <div className="flex items-center gap-2 text-lg text-[#ffd86b]">
            <Film className="h-5 w-5" />
            导出 MP4 · 慌啥子嘛 · 慢慢来
          </div>
          <button
            onClick={onClose}
            disabled={status === 'running'}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-amber-100 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40"
            title={status === 'running' ? '导出过程中请先取消' : '关闭'}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <p className="text-sm leading-relaxed text-amber-100/75">
            全片 {Math.floor(DURATION / 60)} 分 {Math.round(DURATION % 60)} 秒 · {totalFrames} 帧 · {FPS}fps。
            导出画面包含 3D 立体绘本场景、3D 逐字逐词积木、片名卡与逐字卡点字幕，内置原曲音轨（H.264 + AAC）。
          </p>

          <div className="flex items-center gap-2">
            <span className="text-sm text-amber-100/70">清晰度</span>
            {(['1080', '720'] as const).map((q) => (
              <button
                key={q}
                onClick={() => setQuality(q)}
                disabled={status === 'running'}
                className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                  quality === q
                    ? 'border-[#ffd166] bg-[#ffd166]/20 text-[#ffe082]'
                    : 'border-white/15 bg-white/5 text-white/65 hover:bg-white/10'
                } disabled:cursor-not-allowed`}
              >
                {q === '1080' ? '1920 × 1080' : '1280 × 720'}
              </button>
            ))}
          </div>

          {status === 'running' && (
            <div className="space-y-2">
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#ffb357] to-[#ffe985] transition-[width] duration-200"
                  style={{ width: `${Math.round(ratio * 100)}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-amber-100/75">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {phase}
                </span>
                <span className="tabular-nums">{Math.round(ratio * 100)}%</span>
              </div>
              <p className="text-[11px] text-amber-100/45">
                导出在本机浏览器内完成，不会上传素材；请保持此页面在前台，直到下载自动开始。
              </p>
            </div>
          )}

          {status === 'done' && result && (
            <div className="flex items-start gap-2 rounded-xl border border-emerald-300/30 bg-emerald-400/10 px-3 py-2.5 text-sm text-emerald-100">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                导出完成：{result.videoFrames} 帧，{(result.blob.size / 1024 / 1024).toFixed(1)} MB
                {result.audio ? '，含原曲音轨' : '（浏览器不支持音频编码，仅画面）'}。已开始下载。
                <button
                  onClick={() => downloadBlob(result.blob, result.filename)}
                  className="ml-2 underline decoration-emerald-300/60 underline-offset-2 hover:text-white"
                >
                  再下载一次
                </button>
              </span>
            </div>
          )}

          {status === 'error' && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-300/35 bg-rose-400/10 px-3 py-2.5 text-sm text-rose-100">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error || '导出失败，请重试。'}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            {status === 'running' ? (
              <button
                onClick={cancel}
                className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm text-white/85 transition hover:bg-white/20"
              >
                取消导出
              </button>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10"
                >
                  关闭
                </button>
                <button
                  onClick={start}
                  disabled={!atlas}
                  className="flex items-center gap-2 rounded-lg bg-[#ffd166] px-5 py-2 text-sm font-semibold text-[#211536] shadow-lg transition hover:bg-[#ffe085] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  {status === 'done' ? '重新导出' : '开始导出'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
