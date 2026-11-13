import { useEffect, useRef, useState } from 'react';
import { ArrowDownToLine, Check, ChevronRight, Clapperboard, Download, FileText, Film, LoaderCircle, X } from 'lucide-react';
import { Modal } from './Modal';
import { RainLove } from '../remotion/RainLove';
import { DEFAULT_PROJECT, downloadBlob, FPS, makeSrt, TOTAL_FRAMES, type Project, type Scene } from '../lib/project';

export function ExportDialog({ project, scene, onClose }: { project: Project; scene: Scene; onClose: () => void }) {
  const [format, setFormat] = useState<'mp4' | 'webm'>('mp4');
  const [resolution, setResolution] = useState('1080');
  const [range, setRange] = useState('full');
  const [status, setStatus] = useState<'idle' | 'rendering' | 'complete' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Blob | null>(null);
  const controller = useRef<AbortController | null>(null);
  const useMaster = format === 'mp4' && resolution === '1080' && range === 'full' && JSON.stringify(project) === JSON.stringify(DEFAULT_PROJECT);
  const filename = `Rainfilm-${resolution}p.${format}`;

  useEffect(() => () => controller.current?.abort(), []);

  function resetResult() { setStatus('idle'); setResult(null); setError(''); setProgress(0); }

  async function readMaster(signal: AbortSignal) {
    const response = await fetch('/exports/rain-love.mp4', { signal });
    if (!response.ok || !response.body || response.headers.get('Content-Type')?.includes('text/html')) throw new Error('影片暂时无法下载，请稍后重试，或选择 WebM 在浏览器中导出。');
    const length = Number(response.headers.get('Content-Length'));
    const reader = response.body.getReader();
    const chunks: BlobPart[] = [];
    let received = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      if (length) setProgress(Math.min(99, Math.round(received / length * 100)));
    }
    return new Blob(chunks, { type: 'video/mp4' });
  }

  async function render() {
    setStatus('rendering'); setError(''); setProgress(0); setResult(null);
    const abortController = new AbortController();
    controller.current = abortController;
    try {
      if (useMaster) {
        const blob = await readMaster(abortController.signal);
        if (abortController.signal.aborted) return;
        setResult(blob); setProgress(100); setStatus('complete');
        downloadBlob(blob, filename);
        return;
      }
      await document.fonts.ready;
      const { canRenderMediaOnWeb, renderMediaOnWeb } = await import('@remotion/web-renderer');
      const scale = resolution === '720' ? 2 / 3 : 1;
      const videoCodec = format === 'mp4' ? 'h264' as const : 'vp8' as const;
      const supported = await canRenderMediaOnWeb({ width: 1920, height: 1080, scale, container: format, videoCodec });
      if (!supported.canRender) throw new Error(format === 'mp4' ? '当前浏览器不支持 MP4 编码，请切换为 WebM，或使用最新版 Chrome。' : '当前浏览器不支持视频编码，请使用最新版 Chrome，在 localhost 或 HTTPS 页面中导出。');
      if (abortController.signal.aborted) return;
      const frameRange: [number, number] | undefined = range === 'scene'
        ? [Math.round(scene.from * FPS), Math.min(TOTAL_FRAMES - 1, Math.round(scene.to * FPS) - 1)]
        : range === 'preview' ? [0, 149] : undefined;
      const rendered = await renderMediaOnWeb({
        composition: { id: 'RainLove', component: RainLove, durationInFrames: TOTAL_FRAMES, fps: FPS, width: 1920, height: 1080, defaultProps: { project } },
        inputProps: { project }, container: format, videoCodec,
        audioCodec: supported.resolvedAudioCodec ?? undefined,
        scale, frameRange, signal: abortController.signal,
        videoBitrate: 'high', outputTarget: 'arraybuffer',
        onProgress: ({ progress: value }) => setProgress(Math.round(value * 100)),
      });
      const blob = await rendered.getBlob();
      if (abortController.signal.aborted) return;
      setResult(blob); setProgress(100); setStatus('complete');
      downloadBlob(blob, filename);
    } catch (reason) {
      if (controller.current !== abortController) return;
      if (abortController.signal.aborted) { setStatus('idle'); return; }
      setError(reason instanceof Error ? reason.message : '导出失败，请重试或尝试 WebM 格式。'); setStatus('error');
    }
  }

  function cancel() { controller.current?.abort(); setStatus('idle'); }

  return (
    <Modal title="把温柔，保存下来" subtitle="导出你的《雨爱》音乐影像，留住每一帧心动。" onClose={() => { controller.current?.abort(); onClose(); }}>
      <div className="export-summary"><img src={project.scenes[0].image} alt="雨爱影片封面" /><div><strong>{project.title}<span>司凤版</span></strong><p>治愈系 Soft 3D · 02:11 · 30 fps</p><span className="tiny-success"><Check size={13} />音乐与中文字幕将一同导出</span></div></div>
      <div className="form-grid">
        <label className="field-label">影片格式<select aria-label="影片格式" value={format} onChange={(e) => { setFormat(e.target.value as 'mp4' | 'webm'); resetResult(); }} disabled={status === 'rendering'}><option value="mp4">MP4 · H.264</option><option value="webm">WebM · VP8</option></select></label>
        <label className="field-label">画面清晰度<select aria-label="画面清晰度" value={resolution} onChange={(e) => { setResolution(e.target.value); resetResult(); }} disabled={status === 'rendering'}><option value="1080">1080p · 全高清</option><option value="720">720p · 轻量预览</option></select></label>
      </div>
      <label className="field-label">导出范围<select aria-label="导出范围" value={range} onChange={(e) => { setRange(e.target.value); resetResult(); }} disabled={status === 'rendering'}><option value="full">完整 MV · 2 分 11 秒</option><option value="scene">当前分镜 · {scene.title}</option><option value="preview">快速试片 · 前 5 秒</option></select></label>
      <div className="export-note"><Clapperboard size={17} /><p>{useMaster ? '原版影片已由 Remotion 完整渲染，可直接下载。修改画面或字幕后，也可以在浏览器中重新导出。' : '由 Remotion 在本地浏览器逐帧渲染。请保持此页面打开，完整影片可能需要几分钟。'}</p></div>
      {status === 'rendering' && <div className="render-progress" aria-live="polite"><div><span><LoaderCircle size={15} className="spin" />{useMaster ? '正在准备完整影片...' : `正在绘制温柔的第 ${Math.round(progress)}%...`}</span><b>{progress}%</b></div><progress max="100" value={progress} /><button className="text-button" onClick={cancel}><X size={13} />取消{useMaster ? '下载' : '渲染'}</button></div>}
      {status === 'error' && <p className="form-error" role="alert">{error}</p>}
      {status === 'complete' && <div className="export-success"><Check size={18} /><span>影片已生成，下载已开始。{result && ` ${(result.size / 1024 / 1024).toFixed(1)} MB`}</span></div>}
      <button className="button button-primary export-main-button" disabled={status === 'rendering'} onClick={() => status === 'complete' && result ? downloadBlob(result, filename) : void render()}>{status === 'rendering' ? <LoaderCircle className="spin" size={17} /> : status === 'complete' ? <ArrowDownToLine size={17} /> : <Film size={17} />}{status === 'rendering' ? '正在导出影片' : status === 'complete' ? '再次下载影片' : useMaster ? '下载完整影片' : '开始导出影片'}<ChevronRight size={16} /></button>
      <div className="export-secondary"><button onClick={() => downloadBlob(new Blob([makeSrt(project.lyrics)], { type: 'text/plain;charset=utf-8' }), `${project.title}.srt`)}><FileText size={15} />下载 SRT 字幕</button><button onClick={() => downloadBlob(new Blob([JSON.stringify(project, null, 2)], { type: 'application/json' }), `${project.title}-project.json`)}><Download size={15} />保存项目文件</button></div>
    </Modal>
  );
}