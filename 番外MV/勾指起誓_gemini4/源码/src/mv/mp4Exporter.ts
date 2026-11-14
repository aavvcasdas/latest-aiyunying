import { ArrayBufferTarget, Muxer } from 'mp4-muxer';
import type { AtlasData } from '../engine/actors';
import { FilmEngine } from '../engine/engine';
import { FPS, shotIndexAt, type Timeline } from '../engine/timeline';
import { LYRIC_TEXTS } from './cues';
import { drawMvOverlay } from './overlay';
import { ALL_SHOTS } from './shots';

export type ExportQuality = '720p' | '1080p';

export interface ExportProgress {
  phase: 'preparing' | 'audio' | 'rendering' | 'finalizing' | 'done' | 'error';
  percent: number;
  frame: number;
  totalFrames: number;
  etaSec: number | null;
  shotId: string;
  lyric: string;
  message: string;
}

export interface ExportResult {
  blob: Blob;
  url: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  width: number;
  height: number;
  usedWebCodecs: boolean;
}

const QUALITY_MAP: Record<ExportQuality, { w: number; h: number; videoBitrate: number }> = {
  '720p': { w: 1280, h: 720, videoBitrate: 4_500_000 },
  '1080p': { w: 1920, h: 1080, videoBitrate: 7_200_000 },
};

async function pickH264Config(width: number, height: number, bitrate: number): Promise<VideoEncoderConfig | null> {
  if (typeof VideoEncoder === 'undefined') return null;
  const codecs = ['avc1.640028', 'avc1.4d0028', 'avc1.42001f', 'avc1.42e01e'];
  for (const codec of codecs) {
    const cfg: VideoEncoderConfig = {
      codec,
      width,
      height,
      bitrate,
      framerate: FPS,
      avc: { format: 'avc' },
    };
    try {
      const sup = await VideoEncoder.isConfigSupported(cfg);
      if (sup.supported) return cfg;
    } catch {
      // try next profile
    }
  }
  return null;
}

async function pickAudioConfig(sampleRate: number, numberOfChannels: number): Promise<AudioEncoderConfig | null> {
  if (typeof AudioEncoder === 'undefined') return null;
  const cfg: AudioEncoderConfig = {
    codec: 'mp4a.40.2',
    sampleRate,
    numberOfChannels,
    bitrate: 192_000,
  };
  try {
    const sup = await AudioEncoder.isConfigSupported(cfg);
    if (sup.supported) return cfg;
  } catch {
    return null;
  }
  return null;
}

/**
 * 浏览器端离线逐帧渲染并封装真 MP4（H.264 + AAC），含完整音轨与《童话镇》风格卡点字幕。
 */
export async function exportMvToMp4(opts: {
  atlas: AtlasData;
  timeline: Timeline;
  audioUrl: string;
  quality: ExportQuality;
  showLyrics: boolean;
  signal?: AbortSignal;
  onProgress: (p: ExportProgress) => void;
}): Promise<ExportResult> {
  const { atlas, timeline, audioUrl, quality, showLyrics, signal, onProgress } = opts;
  const { w, h, videoBitrate } = QUALITY_MAP[quality];
  const totalFrames = timeline.frames;

  const checkAbort = () => {
    if (signal?.aborted) throw new DOMException('用户取消了导出', 'AbortError');
  };

  onProgress({
    phase: 'preparing',
    percent: 0,
    frame: 0,
    totalFrames,
    etaSec: null,
    shotId: 'I1',
    lyric: '',
    message: '正在检测编码器与解码《勾指起誓》音轨…',
  });

  // 1. 获取并解码完整音频 PCM
  const audioResp = await fetch(audioUrl, { signal });
  if (!audioResp.ok) throw new Error(`音频获取失败（HTTP ${audioResp.status}）`);
  const audioArrayBuf = await audioResp.arrayBuffer();
  checkAbort();

  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const actx = new AudioCtx();
  const decoded = await actx.decodeAudioData(audioArrayBuf.slice(0));
  await actx.close().catch(() => {});
  checkAbort();

  const videoCfg = await pickH264Config(w, h, videoBitrate);
  const channels = Math.min(2, decoded.numberOfChannels);
  const audioCfg = await pickAudioConfig(decoded.sampleRate, channels);

  // 若浏览器不支持 WebCodecs H.264，自动降级为实时 MediaRecorder 录制
  if (!videoCfg) {
    return exportFallbackMediaRecorder({
      atlas,
      timeline,
      decoded,
      w,
      h,
      showLyrics,
      signal,
      onProgress,
    });
  }

  // 2. 初始化 mp4-muxer
  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: { codec: 'avc', width: w, height: h },
    ...(audioCfg
      ? { audio: { codec: 'aac', numberOfChannels: channels, sampleRate: decoded.sampleRate } }
      : {}),
    fastStart: 'in-memory',
  });

  // 3. 编码 AAC 音轨（如果支持 AudioEncoder）
  if (audioCfg) {
    onProgress({
      phase: 'audio',
      percent: 2,
      frame: 0,
      totalFrames,
      etaSec: null,
      shotId: 'I1',
      lyric: '',
      message: '正在封装 AAC 立体声音轨…',
    });

    let audioErr: Error | null = null;
    const audioEncoder = new AudioEncoder({
      output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
      error: (e) => { audioErr = e; },
    });
    audioEncoder.configure(audioCfg);

    const sr = decoded.sampleRate;
    const maxSamples = Math.min(decoded.length, Math.ceil(timeline.duration * sr));
    const fadeSamples = Math.round(1.0 * sr);
    const chunkFrames = 4096;

    for (let offset = 0; offset < maxSamples; offset += chunkFrames) {
      checkAbort();
      if (audioErr) throw audioErr;
      const n = Math.min(chunkFrames, maxSamples - offset);
      // AudioData f32-planar layout: [ch0 samples..., ch1 samples...]
      const planar = new Float32Array(n * channels);
      for (let ch = 0; ch < channels; ch++) {
        const src = decoded.getChannelData(Math.min(ch, decoded.numberOfChannels - 1));
        const base = ch * n;
        for (let i = 0; i < n; i++) {
          const idx = offset + i;
          let sample = src[idx] ?? 0;
          // 结尾 1 秒平滑淡出，防止断音爆声
          const remain = maxSamples - idx;
          if (remain < fadeSamples) sample *= remain / fadeSamples;
          planar[base + i] = sample;
        }
      }
      const ad = new AudioData({
        format: 'f32-planar',
        sampleRate: sr,
        numberOfFrames: n,
        numberOfChannels: channels,
        timestamp: Math.round((offset / sr) * 1_000_000),
        data: planar,
      });
      audioEncoder.encode(ad);
      ad.close();

      while (audioEncoder.encodeQueueSize > 12) {
        await new Promise((r) => setTimeout(r, 4));
      }
    }
    await audioEncoder.flush();
    audioEncoder.close();
    if (audioErr) throw audioErr;
  }

  // 4. 离屏 Three.js 渲染器 + 2D 合成画布 + H.264 VideoEncoder
  const glCanvas = document.createElement('canvas');
  glCanvas.width = w;
  glCanvas.height = h;
  const compCanvas = document.createElement('canvas');
  compCanvas.width = w;
  compCanvas.height = h;
  const compCtx = compCanvas.getContext('2d')!;

  const engine = new FilmEngine(glCanvas, w, h, atlas, ALL_SHOTS);
  let videoErr: Error | null = null;
  const videoEncoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => { videoErr = e; },
  });
  videoEncoder.configure(videoCfg);

  const startedAt = performance.now();
  const frameUs = Math.round(1_000_000 / FPS);

  try {
    for (let f = 0; f < totalFrames; f++) {
      checkAbort();
      if (videoErr) throw videoErr;

      // 渲染 3D 场景
      engine.render(f, timeline);
      // 合成 3D 画面 + 《童话镇》风格卡点字幕 & 转场
      compCtx.drawImage(glCanvas, 0, 0, w, h);
      drawMvOverlay(compCtx, w, h, f, timeline, showLyrics);

      const vf = new VideoFrame(compCanvas, {
        timestamp: f * frameUs,
        duration: frameUs,
      });
      videoEncoder.encode(vf, { keyFrame: f % 60 === 0 });
      vf.close();

      // 控制编码队列背压，防止内存暴涨
      while (videoEncoder.encodeQueueSize > 8) {
        await new Promise((r) => setTimeout(r, 4));
      }

      if (f % 10 === 0 || f === totalFrames - 1) {
        const elapsed = (performance.now() - startedAt) / 1000;
        const fpsNow = (f + 1) / Math.max(0.05, elapsed);
        const etaSec = Math.max(0, (totalFrames - f - 1) / Math.max(1, fpsNow));
        const t = f / FPS;
        const st = timeline.shots[shotIndexAt(timeline, t)];
        const lyric = st.cue >= 0 ? LYRIC_TEXTS[st.cue] : '';

        onProgress({
          phase: 'rendering',
          percent: 4 + (f / totalFrames) * 92,
          frame: f + 1,
          totalFrames,
          etaSec,
          shotId: st.id,
          lyric,
          message: `逐帧编码 H.264（${w}×${h} · ${fpsNow.toFixed(1)} 帧/秒）`,
        });
        // 让出主线程保证进度条与取消按钮流畅响应
        await new Promise((r) => setTimeout(r, 0));
      }
    }

    onProgress({
      phase: 'finalizing',
      percent: 97,
      frame: totalFrames,
      totalFrames,
      etaSec: 1,
      shotId: 'OUT',
      lyric: '',
      message: '正在写入 MP4 封装索引…',
    });

    await videoEncoder.flush();
    videoEncoder.close();
    if (videoErr) throw videoErr;
    muxer.finalize();

    const blob = new Blob([target.buffer], { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);
    const filename = `勾指起誓_鲸鱼娘MV_${quality}.mp4`;

    onProgress({
      phase: 'done',
      percent: 100,
      frame: totalFrames,
      totalFrames,
      etaSec: 0,
      shotId: 'OUT',
      lyric: '',
      message: `MP4 导出完成（${(blob.size / 1024 / 1024).toFixed(1)} MB）`,
    });

    return {
      blob,
      url,
      filename,
      mimeType: 'video/mp4',
      sizeBytes: blob.size,
      width: w,
      height: h,
      usedWebCodecs: true,
    };
  } finally {
    try {
      if (videoEncoder.state !== 'closed') videoEncoder.close();
    } catch {
      // ignore
    }
    engine.dispose(true);
  }
}

/** 无 WebCodecs 浏览器降级：使用 MediaRecorder 实时录制画布与音轨 */
async function exportFallbackMediaRecorder(opts: {
  atlas: AtlasData;
  timeline: Timeline;
  decoded: AudioBuffer;
  w: number;
  h: number;
  showLyrics: boolean;
  signal?: AbortSignal;
  onProgress: (p: ExportProgress) => void;
}): Promise<ExportResult> {
  const { atlas, timeline, decoded, w, h, showLyrics, signal, onProgress } = opts;
  const glCanvas = document.createElement('canvas');
  glCanvas.width = w;
  glCanvas.height = h;
  const compCanvas = document.createElement('canvas');
  compCanvas.width = w;
  compCanvas.height = h;
  const compCtx = compCanvas.getContext('2d')!;
  const engine = new FilmEngine(glCanvas, w, h, atlas, ALL_SHOTS);

  const actx = new AudioContext();
  const dest = actx.createMediaStreamDestination();
  const src = actx.createBufferSource();
  src.buffer = decoded;
  src.connect(dest);

  const stream = new MediaStream([
    ...compCanvas.captureStream(FPS).getVideoTracks(),
    ...dest.stream.getAudioTracks(),
  ]);

  const mime =
    MediaRecorder.isTypeSupported('video/mp4;codecs=avc1,mp4a.40.2') ? 'video/mp4;codecs=avc1,mp4a.40.2'
      : MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4'
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus'
          : 'video/webm';

  const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 4_500_000 });
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (ev) => { if (ev.data.size > 0) chunks.push(ev.data); };

  const done = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mime.split(';')[0] }));
    recorder.onerror = () => reject(new Error('浏览器录制失败'));
  });

  recorder.start(500);
  src.start();
  const startWall = performance.now();

  try {
    while (true) {
      if (signal?.aborted) throw new DOMException('用户取消了导出', 'AbortError');
      const elapsed = (performance.now() - startWall) / 1000;
      if (elapsed >= timeline.duration) break;
      const f = Math.min(timeline.frames - 1, Math.floor(elapsed * FPS));
      engine.render(f, timeline);
      compCtx.drawImage(glCanvas, 0, 0, w, h);
      drawMvOverlay(compCtx, w, h, f, timeline, showLyrics);
      const st = timeline.shots[shotIndexAt(timeline, elapsed)];
      onProgress({
        phase: 'rendering',
        percent: Math.min(98, (elapsed / timeline.duration) * 100),
        frame: f,
        totalFrames: timeline.frames,
        etaSec: Math.max(0, timeline.duration - elapsed),
        shotId: st.id,
        lyric: st.cue >= 0 ? LYRIC_TEXTS[st.cue] : '',
        message: '正在使用实时录制模式合成视频…',
      });
      await new Promise((r) => requestAnimationFrame(r));
    }
  } finally {
    try { src.stop(); } catch { /* ignore */ }
    if (recorder.state !== 'inactive') recorder.stop();
    await actx.close().catch(() => {});
    engine.dispose(true);
  }

  const blob = await done;
  const ext = mime.includes('mp4') ? 'mp4' : 'webm';
  const url = URL.createObjectURL(blob);
  return {
    blob,
    url,
    filename: `勾指起誓_鲸鱼娘MV.${ext}`,
    mimeType: blob.type,
    sizeBytes: blob.size,
    width: w,
    height: h,
    usedWebCodecs: false,
  };
}

/** 触发浏览器文件下载 */
export function triggerDownload(url: string, filename: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
