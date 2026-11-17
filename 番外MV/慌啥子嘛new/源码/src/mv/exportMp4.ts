// 浏览器端离线 MP4 导出：WebCodecs（H.264 + AAC）逐帧确定性渲染 + mp4-muxer 封装
// 导出画面包含：3D 立体绘本场景、3D 逐字逐词积木、片名卡、逐字卡点字幕条与闪白渐黑转场
import { ArrayBufferTarget, Muxer } from 'mp4-muxer';
import { type AtlasData } from './actors';
import { AUDIO_FALLBACK_URL, AUDIO_URL, DURATION, FPS, activeCueAt } from './cues';
import { MVEngine } from './engine';
import { FONT } from './fonts';
import { ALL_SHOTS } from './shots';
import { clamp01, cssHex } from './kit';

export interface ExportOptions {
  atlas: AtlasData;
  width: number;
  height: number;
  onProgress?: (ratio: number, phase: string) => void;
  signal?: AbortSignal;
  /** 仅用于自检的片段时长（正常导出不传 = 全片） */
  durationSec?: number;
}

const yieldToUi = () => new Promise<void>((r) => setTimeout(r, 0));

async function pickVideoConfig(width: number, height: number): Promise<VideoEncoderConfig> {
  const candidates = ['avc1.640028', 'avc1.4D4028', 'avc1.42001F', 'avc1.42E01F'];
  for (const codec of candidates) {
    const cfg: VideoEncoderConfig = {
      codec,
      width,
      height,
      bitrate: width >= 1920 ? 7_000_000 : 3_500_000,
      framerate: FPS,
      avc: { format: 'avc' },
    };
    try {
      const s = await VideoEncoder.isConfigSupported(cfg);
      if (s.supported) return cfg;
    } catch {
      /* 尝试下一个档位 */
    }
  }
  throw new Error('当前浏览器不支持 H.264 视频编码（WebCodecs）。请使用新版 Chrome / Edge 再导出。');
}

async function pickAudioConfig(sampleRate: number, channels: number): Promise<AudioEncoderConfig | null> {
  const candidates: AudioEncoderConfig[] = [
    { codec: 'mp4a.40.2', sampleRate, numberOfChannels: channels, bitrate: 192_000 },
    { codec: 'opus', sampleRate, numberOfChannels: channels, bitrate: 160_000 },
  ];
  for (const cfg of candidates) {
    try {
      const s = await AudioEncoder.isConfigSupported(cfg);
      if (s.supported) return cfg;
    } catch {
      /* 继续尝试 */
    }
  }
  return null;
}

/** 把场景 canvas + 片名字卡 + 卡拉OK字幕 + 转场合成到导出画布 */
function paintFrame(
  c: CanvasRenderingContext2D,
  scene: HTMLCanvasElement,
  width: number,
  height: number,
  T: number,
  ov: ReturnType<MVEngine['render']>
) {
  const S = width / 1920;
  c.clearRect(0, 0, width, height);
  c.drawImage(scene, 0, 0, width, height);

  const cue = activeCueAt(T);
  if (cue) {
    const enter = clamp01((T - (cue.start - 0.05)) / 0.14);
    const exit = clamp01((cue.end + 0.16 - T) / 0.16);
    const alpha = Math.min(enter, exit);
    if (alpha > 0.01) {
      c.save();
      c.globalAlpha = alpha;
      c.font = `900 ${56 * S}px ${FONT}`;
      c.textBaseline = 'alphabetic';

      // 逐词量宽（含词间距）
      let barW = 72 * S;
      const wordWidths = cue.words.map((w, wi) => {
        const first = cue.chars[w.charIndices[0]];
        const gap = first?.gapBefore ? 22 * S : wi > 0 ? 2 * S : 0;
        let ww = gap;
        for (const ci of w.charIndices) ww += c.measureText(cue.chars[ci].ch).width + 4.4 * S;
        barW += ww;
        return { ww, gap };
      });
      const barH = 92 * S;
      const bx = (width - barW) / 2;
      const by = height - 26 * S - barH;

      c.fillStyle = 'rgba(22,16,40,0.86)';
      c.beginPath();
      c.roundRect(bx, by, barW, barH, 8 * S);
      c.fill();
      c.strokeStyle = '#ffd166';
      c.lineWidth = 3.6 * S;
      c.beginPath();
      c.moveTo(bx + 8 * S, by + 1.8 * S);
      c.lineTo(bx + barW - 8 * S, by + 1.8 * S);
      c.moveTo(bx + 8 * S, by + barH - 1.8 * S);
      c.lineTo(bx + barW - 8 * S, by + barH - 1.8 * S);
      c.stroke();

      c.textAlign = 'left';
      const baseY = by + 62 * S;
      let x = bx + 36 * S;
      cue.words.forEach((w, wi) => {
        const meta = wordWidths[wi];
        x += meta.gap;
        for (const ci of w.charIndices) {
          const ch = cue.chars[ci];
          const cw = c.measureText(ch.ch).width;
          const p = clamp01((T - ch.t0) / Math.max(0.08, ch.t1 - ch.t0));
          c.fillStyle = '#ffffff';
          c.shadowColor = 'rgba(0,0,0,0.65)';
          c.shadowBlur = 6 * S;
          c.shadowOffsetY = 2 * S;
          c.fillText(ch.ch, x, baseY);
          c.shadowBlur = 0;
          c.shadowOffsetY = 0;
          if (p > 0) {
            c.save();
            c.beginPath();
            c.rect(x - 2 * S, baseY - 60 * S, (cw + 4 * S) * p, 78 * S);
            c.clip();
            c.fillStyle = '#ffd84a';
            c.fillText(ch.ch, x, baseY);
            c.restore();
          }
          x += cw + 4.4 * S;
        }
        // 词组底部卡点指示线
        const lineW = meta.ww - meta.gap - 2 * S;
        const lp = clamp01((T - w.t0) / Math.max(0.08, w.t1 - w.t0));
        c.fillStyle = cssHex(w.accent);
        c.globalAlpha = alpha * (T >= w.t0 && T <= w.t1 + 0.04 ? 0.95 : T > w.t1 ? 0.5 : 0.16);
        c.fillRect(x - lineW - 2 * S, baseY + 12 * S, Math.max(6 * S, lineW * (lp || 1)), 3 * S);
        c.globalAlpha = alpha;
      });
      c.restore();
    }
  }

  // 片名卡
  if (ov.showTitle && ov.titleProgress > 0.01) {
    const p = ov.titleProgress;
    c.save();
    c.globalAlpha = p;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = `900 ${118 * S}px ${FONT}`;
    c.fillStyle = 'rgba(59,33,22,0.9)';
    c.fillText('慌啥子嘛', width / 2, 100 * S + 6 * S);
    c.fillStyle = '#fff8e7';
    c.fillText('慌啥子嘛', width / 2, 100 * S);
    c.font = `900 ${40 * S}px ${FONT}`;
    c.fillStyle = '#ffd86b';
    c.fillText('慢 慢 来', width / 2, 196 * S);
    c.strokeStyle = 'rgba(255,216,110,0.85)';
    c.lineWidth = 2.5 * S;
    c.beginPath();
    c.moveTo(width / 2 - 120 * S, 172 * S);
    c.lineTo(width / 2 + 120 * S, 172 * S);
    c.moveTo(width / 2 - 120 * S, 220 * S);
    c.lineTo(width / 2 + 120 * S, 220 * S);
    c.stroke();
    c.restore();
  }

  if (ov.white > 0.004) {
    c.fillStyle = `rgba(255,250,240,${ov.white})`;
    c.fillRect(0, 0, width, height);
  }
  if (ov.black > 0.004) {
    c.fillStyle = `rgba(9,7,15,${ov.black})`;
    c.fillRect(0, 0, width, height);
  }
}

export interface ExportResult {
  blob: Blob;
  filename: string;
  videoFrames: number;
  audio: boolean;
}

export async function exportMp4(opts: ExportOptions): Promise<ExportResult> {
  if (typeof VideoEncoder === 'undefined') {
    throw new Error('当前浏览器不支持 WebCodecs 导出。请使用新版 Chrome / Edge，或点击画面录制。');
  }
  const { atlas, width, height, onProgress, signal } = opts;
  const duration = Math.min(DURATION, opts.durationSec ?? DURATION);
  const totalFrames = Math.ceil(duration * FPS);

  onProgress?.(0.01, '准备 3D 立体绘本…');
  const glCanvas = document.createElement('canvas');
  glCanvas.width = width;
  glCanvas.height = height;
  glCanvas.style.cssText = 'position:fixed;left:-99999px;top:0;pointer-events:none;';
  document.body.appendChild(glCanvas);
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = width;
  exportCanvas.height = height;
  const ctx = exportCanvas.getContext('2d', { alpha: false })!;
  if (!ctx.roundRect) throw new Error('当前浏览器缺少 Canvas roundRect，请升级浏览器。');

  const engine = new MVEngine(glCanvas, atlas, ALL_SHOTS);
  engine.resize(width, height, 1);

  // —— 音轨解码 ——
  let audioBuffer: AudioBuffer | null = null;
  let audioCfg: AudioEncoderConfig | null = null;
  const audioCtx = new AudioContext();
  try {
    onProgress?.(0.02, '解码原曲音轨…');
    let res = await fetch(AUDIO_URL);
    if (!res.ok) res = await fetch(AUDIO_FALLBACK_URL);
    if (!res.ok) throw new Error(`音轨取不到（HTTP ${res.status}）`);
    const bytes = await res.arrayBuffer();
    audioBuffer = await audioCtx.decodeAudioData(bytes);
    audioCfg = await pickAudioConfig(audioBuffer.sampleRate, Math.min(2, audioBuffer.numberOfChannels));
  } catch (e) {
    console.warn('[export] 音轨未就绪，将导出纯画面 MP4', e);
  } finally {
    await audioCtx.close();
  }

  const videoCfg = await pickVideoConfig(width, height);
  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: { codec: 'avc', width, height, frameRate: FPS },
    audio: audioBuffer && audioCfg
      ? {
          codec: audioCfg.codec === 'opus' ? 'opus' : 'aac',
          numberOfChannels: Math.min(2, audioBuffer.numberOfChannels),
          sampleRate: audioBuffer.sampleRate,
        }
      : undefined,
    fastStart: 'in-memory',
  });

  let encoderError: Error | null = null;
  const videoEncoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => {
      encoderError = e instanceof Error ? e : new Error(String(e));
    },
  });
  videoEncoder.configure(videoCfg);

  let audioEncoder: AudioEncoder | null = null;
  if (audioBuffer && audioCfg) {
    audioEncoder = new AudioEncoder({
      output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
      error: (e) => console.warn('[export] 音频编码告警', e),
    });
    audioEncoder.configure(audioCfg);
  }

  const throwIfAborted = () => {
    if (signal?.aborted) throw new DOMException('已取消导出', 'AbortError');
    if (encoderError) throw encoderError;
  };

  try {
    // —— 音轨先编码（把解码后的采样切成 AudioData 块） ——
    if (audioBuffer && audioEncoder && audioCfg) {
      const ch = Math.min(2, audioBuffer.numberOfChannels);
      const sr = audioBuffer.sampleRate;
      const framesTotal = Math.floor(Math.min(audioBuffer.duration, duration) * sr);
      const channels: Float32Array[] = [];
      for (let ci = 0; ci < ch; ci++) channels.push(audioBuffer.getChannelData(ci));
      const block = 8192;
      for (let off = 0; off < framesTotal; off += block) {
        throwIfAborted();
        const n = Math.min(block, framesTotal - off);
        const planar = new Float32Array(n * ch);
        for (let ci = 0; ci < ch; ci++) planar.set(channels[ci].subarray(off, off + n), ci * n);
        const data = new AudioData({
          format: 'f32-planar',
          sampleRate: sr,
          numberOfFrames: n,
          numberOfChannels: ch,
          timestamp: Math.round((off / sr) * 1_000_000),
          data: planar,
        });
        audioEncoder.encode(data);
        data.close();
        if (audioEncoder.encodeQueueSize > 40) {
          await new Promise<void>((r) => {
            const tick = () => (audioEncoder!.encodeQueueSize <= 12 ? r() : setTimeout(tick, 4));
            tick();
          });
        }
      }
      await audioEncoder.flush();
      audioEncoder.close();
    }

    // —— 逐帧渲染 + H.264 编码 ——
    for (let i = 0; i < totalFrames; i++) {
      throwIfAborted();
      const T = Math.min(duration, i / FPS);
      const ov = engine.render(T);
      paintFrame(ctx, glCanvas, width, height, T, ov);
      const frame = new VideoFrame(exportCanvas, {
        timestamp: Math.round((i * 1_000_000) / FPS),
        duration: Math.round(1_000_000 / FPS),
      });
      videoEncoder.encode(frame, { keyFrame: i % (FPS * 2) === 0 });
      frame.close();

      if (i % 6 === 0) {
        onProgress?.(0.04 + (i / totalFrames) * 0.92, `正在逐帧绘制与编码 ${i + 1} / ${totalFrames}`);
        await yieldToUi();
      }
      if (videoEncoder.encodeQueueSize > 10) {
        await new Promise<void>((r) => {
          const tick = () => (videoEncoder.encodeQueueSize <= 4 ? r() : setTimeout(tick, 3));
          tick();
        });
      }
    }

    throwIfAborted();
    onProgress?.(0.97, '封装 MP4 文件…');
    await videoEncoder.flush();
    videoEncoder.close();
    muxer.finalize();
    const buffer = target.buffer;
    const blob = new Blob([buffer], { type: 'video/mp4' });
    onProgress?.(1, '导出完成！');
    return {
      blob,
      filename: `慌啥子嘛_慢慢来_${width}x${height}_${FPS}fps.mp4`,
      videoFrames: totalFrames,
      audio: Boolean(audioEncoder),
    };
  } finally {
    try {
      if (videoEncoder.state !== 'closed') videoEncoder.close();
    } catch {
      /* noop */
    }
    try {
      if (audioEncoder && audioEncoder.state !== 'closed') audioEncoder.close();
    } catch {
      /* noop */
    }
    engine.dispose();
    glCanvas.remove();
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
