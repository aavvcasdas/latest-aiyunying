// 浏览器端高清视频与剧照导出器（同步混入原曲《樱花树下的约定.mp3》音轨）
import type { MvAudio } from './audio';
import type { MvEngine } from './engine';
import { DURATION, TITLE } from './timeline';

export interface ExportOptions {
  from: number;
  to: number;
  width: number;
  includeLyrics: boolean;
  onProgress: (p: number, elapsed: number, label: string) => void;
}

export interface ExportController {
  cancel: () => void;
  promise: Promise<{ url: string; filename: string; ext: string } | null>;
}

function pickMime(): { mime: string; ext: string } {
  const candidates: [string, string][] = [
    ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'mp4'],
    ['video/mp4', 'mp4'],
    ['video/webm;codecs=vp9,opus', 'webm'],
    ['video/webm;codecs=vp8,opus', 'webm'],
    ['video/webm', 'webm'],
  ];
  if (typeof MediaRecorder !== 'undefined') {
    for (const [mime, ext] of candidates) {
      if (MediaRecorder.isTypeSupported(mime)) return { mime, ext };
    }
  }
  return { mime: 'video/webm', ext: 'webm' };
}

export function startVideoExport(
  engine: MvEngine,
  audio: MvAudio,
  opts: ExportOptions,
): ExportController {
  let cancelled = false;

  const promise = new Promise<{ url: string; filename: string; ext: string } | null>(async (resolve, reject) => {
    const prevW = engine.width;
    const prevH = engine.height;
    const prevHidden = engine.lyrics?.hidden ?? false;
    const targetH = Math.round((opts.width * 9) / 16);

    try {
      audio.pause();
      engine.resize(opts.width, targetH, 1);
      engine.setLyricsVisible(opts.includeLyrics);

      const stream = engine.canvas.captureStream(30);
      const audioTrack = audio.getExportAudioTrack();
      if (audioTrack) stream.addTrack(audioTrack);

      const { mime, ext } = pickMime();
      const bitrate = opts.width >= 1920 ? 8_500_000 : 5_200_000;
      const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: bitrate });
      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunks.push(ev.data);
      };

      const done = new Promise<Blob>((res) => {
        recorder.onstop = () => res(new Blob(chunks, { type: mime }));
      });

      const from = Math.max(0, opts.from);
      const to = Math.min(DURATION, Math.max(from + 1, opts.to));
      const span = to - from;

      audio.seek(from);
      engine.renderAt(from);
      recorder.start(250);
      await audio.play();

      await new Promise<void>((finish) => {
        const tick = () => {
          if (cancelled) { finish(); return; }
          const cur = audio.currentTime;
          engine.renderAt(cur);
          const p = Math.min(1, Math.max(0, (cur - from) / span));
          opts.onProgress(p, cur, `正在录制 ${cur.toFixed(1)}s / ${to.toFixed(1)}s`);
          if (cur >= to - 0.04 || !audio.playing) {
            finish();
            return;
          }
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });

      audio.pause();
      if (recorder.state !== 'inactive') recorder.stop();
      const blob = await done;

      engine.setLyricsVisible(!prevHidden);
      engine.resize(prevW, prevH);
      engine.renderAt(audio.currentTime);

      if (cancelled) {
        resolve(null);
        return;
      }

      const url = URL.createObjectURL(blob);
      const tag = span >= DURATION - 2 ? '完整版' : `${Math.round(from)}s-${Math.round(to)}s`;
      const filename = `${TITLE}_${opts.width}p_${tag}.${ext}`;
      resolve({ url, filename, ext });
    } catch (err) {
      engine.setLyricsVisible(!prevHidden);
      engine.resize(prevW, prevH);
      reject(err);
    }
  });

  return {
    cancel: () => { cancelled = true; },
    promise,
  };
}

export function downloadStillPng(engine: MvEngine, t: number, includeLyrics: boolean) {
  const url = engine.captureFrame(t, !includeLyrics, 1920, 'image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = `${TITLE}_${t.toFixed(1)}s${includeLyrics ? '' : '_无字幕'}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
