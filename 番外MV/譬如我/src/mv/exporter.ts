import {
  AudioBufferSource, BufferTarget, CanvasSource, Mp4OutputFormat, Output, Quality,
  canEncodeAudio, canEncodeVideo,
} from 'mediabunny';
import { registerAacEncoder } from '@mediabunny/aac-encoder';
import type { Engine } from './engine';

interface ExportOptions {
  engine: Engine;
  audio: AudioBuffer;
  showLyrics: boolean;
  signal: AbortSignal;
  onProgress?: (progress: number) => void;
  fps?: number;
  duration?: number;
}

let aacRegistered = false;

/** Render against explicit timestamps instead of recording the preview clock. */
export async function exportMp4({ engine, audio, showLyrics, signal, onProgress, fps = 24, duration = audio.duration }: ExportOptions): Promise<Blob> {
  const canvas = engine.renderer.domElement;
  const width = canvas.width;
  const height = canvas.height;
  const videoQuality = new Quality({ bitrate: 5_000_000 });
  const audioQuality = new Quality({ bitrate: 160_000 });
  const checkCancel = () => {
    if (signal.aborted) throw new DOMException('Export cancelled', 'AbortError');
  };

  checkCancel();
  if (!(await canEncodeVideo('avc', { width, height, frameRate: fps, quality: videoQuality }))) {
    throw new Error('当前浏览器不支持 H.264 编码，请使用新版 Chrome、Edge 或 Safari 重试。');
  }
  if (!(await canEncodeAudio('aac', { numberOfChannels: audio.numberOfChannels, sampleRate: audio.sampleRate, quality: audioQuality }))) {
    if (!aacRegistered) { registerAacEncoder(); aacRegistered = true; }
  }
  checkCancel();

  const target = new BufferTarget();
  const output = new Output({ format: new Mp4OutputFormat({ fastStart: 'in-memory' }), target });
  const video = new CanvasSource(canvas, { codec: 'avc', quality: videoQuality, keyFrameInterval: 2 });
  const sound = new AudioBufferSource({ codec: 'aac', quality: audioQuality });
  output.addVideoTrack(video, { frameRate: fps });
  output.addAudioTrack(sound);
  output.setMetadataTags({ title: '譬如我', artist: '鲸鱼娘音乐影像' });

  try {
    await output.start();
    const total = Math.min(duration, audio.duration);
    const frames = Math.ceil(total * fps);
    for (let frame = 0; frame < frames; frame++) {
      checkCancel();
      if (frame % fps === 0) {
        const from = Math.round((frame / fps) * audio.sampleRate);
        const length = Math.min(audio.sampleRate, audio.length - from, Math.ceil(total * audio.sampleRate) - from);
        if (length > 0) {
          const part = new AudioBuffer({ numberOfChannels: audio.numberOfChannels, length, sampleRate: audio.sampleRate });
          for (let ch = 0; ch < audio.numberOfChannels; ch++) part.copyToChannel(audio.getChannelData(ch).subarray(from, from + length), ch);
          await sound.add(part);
        }
      }
      const timestamp = frame / fps;
      engine.render(timestamp, !showLyrics);
      await video.add(timestamp, Math.min(1 / fps, total - timestamp));
      if (frame % 6 === 0) {
        onProgress?.(frame / frames);
        // Yield between batches so the progress and cancel controls stay responsive.
        await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
      }
    }
    checkCancel();
    video.close();
    sound.close();
    onProgress?.(0.99);
    await output.finalize();
    checkCancel();
    if (!target.buffer) throw new Error('影片编码未完成，请重试。');
    return new Blob([target.buffer], { type: 'video/mp4' });
  } catch (error) {
    if (output.state === 'started' || output.state === 'pending') await output.cancel().catch(() => {});
    throw error;
  }
}
