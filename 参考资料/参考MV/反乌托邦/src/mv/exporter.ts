// 导出 MP4：逐帧调用同一份 render()（不是录屏），WebCodecs 编 H.264，原曲 AAC 帧原样封装（不重编码）。
// 不支持 WebCodecs 的浏览器退回 MediaRecorder 实时录制（要等整首歌放完）。
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import { createFilm, DUR, W } from './film';
import { getAac, aacMeta, decodeSong } from './audio';

export type Env = { atlas: CanvasImageSource; makeCanvas: (w: number, h: number) => HTMLCanvasElement };
export type ExportOpts = { width: number; height: number; fps: number; onProgress: (p: number, info: string) => void; signal: { aborted: boolean } };
export type ExportResult = { blob: Blob; mime: string; codec: string; frames: number; ms: number; ext: string };

const yieldUI = () => new Promise<void>((r) => { const ch = new MessageChannel(); ch.port1.onmessage = () => r(); ch.port2.postMessage(0); });

async function pickCodec(width: number, height: number, fps: number, bitrate: number) {
  const VE = (globalThis as any).VideoEncoder; if (!VE) return null;
  const cands: { mux: 'avc' | 'vp9' | 'av1'; codec: string }[] = [
    { mux: 'avc', codec: 'avc1.640028' }, { mux: 'avc', codec: 'avc1.4d0028' }, { mux: 'avc', codec: 'avc1.42e028' }, { mux: 'avc', codec: 'avc1.42001f' },
    { mux: 'vp9', codec: 'vp09.00.40.08' }, { mux: 'av1', codec: 'av01.0.08M.08' },
  ];
  for (const c of cands) {
    const config: any = { codec: c.codec, width, height, bitrate, framerate: fps, latencyMode: 'quality' };
    if (c.mux === 'avc') config.avc = { format: 'avc' };
    try { const r = await VE.isConfigSupported(config); if (r?.supported) return { ...c, config }; } catch { /* 下一个 */ }
  }
  return null;
}

export function canWebCodecs() { return typeof (globalThis as any).VideoEncoder === 'function' && typeof (globalThis as any).VideoFrame === 'function'; }

export async function exportMp4(env: Env, o: ExportOpts): Promise<ExportResult> {
  const t0 = performance.now(), { width, height, fps } = o, bitrate = width >= 1920 ? 9_000_000 : 5_500_000;
  const vc = await pickCodec(width, height, fps, bitrate);
  if (!vc) throw new Error('NO_WEBCODECS');
  const aac = getAac();
  const muxer = new Muxer({ target: new ArrayBufferTarget(), video: { codec: vc.mux, width, height, frameRate: fps }, audio: { codec: 'aac', numberOfChannels: aac.channels, sampleRate: aac.sampleRate }, fastStart: 'in-memory', firstTimestampBehavior: 'offset' });
  let encErr: any = null;
  const VE = (globalThis as any).VideoEncoder, VF = (globalThis as any).VideoFrame;
  const enc = new VE({ output: (chunk: any, meta: any) => muxer.addVideoChunk(chunk, meta), error: (e: any) => { encErr = e; } });
  enc.configure(vc.config);
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
  const g = canvas.getContext('2d', { alpha: false }) as CanvasRenderingContext2D;
  const film = createFilm(env), N = Math.round(DUR * fps); let ai = 0;
  const pushAudio = (tEnd: number) => { while (ai < aac.frames.length && ai * aac.frameDur < tEnd) { muxer.addAudioChunkRaw(aac.frames[ai], 'key', Math.round(ai * aac.frameDur * 1e6), Math.round(aac.frameDur * 1e6), ai === 0 ? (aacMeta(aac) as any) : undefined); ai++; } };
  try {
    for (let i = 0; i < N; i++) {
      if (o.signal.aborted) throw new Error('ABORT');
      if (encErr) throw encErr;
      film.render(g, i / fps, { scale: width / W });
      const frame = new VF(canvas, { timestamp: Math.round((i * 1e6) / fps), duration: Math.round(1e6 / fps) });
      enc.encode(frame, { keyFrame: i % (fps * 2) === 0 }); frame.close();
      pushAudio((i + 1) / fps);
      while (enc.encodeQueueSize > 6) await new Promise((r) => setTimeout(r, 2));
      if (i % 4 === 0) { o.onProgress(i / N, `逐帧渲染 + 编码 ${i}/${N} 帧`); await yieldUI(); }
    }
    o.onProgress(0.995, '收尾：封装 MP4');
    await enc.flush(); pushAudio(DUR + 1);
  } finally { try { enc.close(); } catch { /* 已关 */ } }
  muxer.finalize();
  return { blob: new Blob([muxer.target.buffer], { type: 'video/mp4' }), mime: 'video/mp4', codec: `${vc.codec} + AAC-LC（原曲音轨原样）`, frames: N, ms: performance.now() - t0, ext: 'mp4' };
}

/** 退路：实时录制（画布 + 音轨），浏览器支持 mp4 就出 mp4，否则出 webm */
export async function recordRealtime(env: Env, o: ExportOpts): Promise<ExportResult> {
  const t0 = performance.now(), canvas = document.createElement('canvas'); canvas.width = o.width; canvas.height = o.height;
  const g = canvas.getContext('2d') as CanvasRenderingContext2D, film = createFilm(env);
  const ac = new AudioContext(), buf = await decodeSong(ac), dest = ac.createMediaStreamDestination(), src = ac.createBufferSource();
  src.buffer = buf; src.connect(dest); src.connect(ac.destination);
  const stream = (canvas as any).captureStream(o.fps) as MediaStream; stream.addTrack(dest.stream.getAudioTracks()[0]);
  const mime = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm'].find((m) => (window as any).MediaRecorder?.isTypeSupported(m));
  if (!mime) throw new Error('这个浏览器既不支持 WebCodecs 也不支持 MediaRecorder，无法导出');
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6_000_000 }), chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  film.render(g, 0, { scale: o.width / W }); rec.start(500); const start = ac.currentTime + 0.15; src.start(start);
  await new Promise<void>((res) => { const loop = () => { const t = ac.currentTime - start; if (t >= DUR || o.signal.aborted) { res(); return; } film.render(g, Math.max(0, t), { scale: o.width / W }); o.onProgress(Math.max(0, t) / DUR, '实时录制中（请保持本页在前台）'); requestAnimationFrame(loop); }; loop(); });
  await new Promise<void>((r) => { rec.onstop = () => r(); rec.stop(); });
  try { src.stop(); } catch { /* 已停 */ } void ac.close();
  if (o.signal.aborted) throw new Error('ABORT');
  const type = mime.split(';')[0];
  return { blob: new Blob(chunks, { type }), mime: type, codec: `MediaRecorder ${mime}`, frames: Math.round(DUR * o.fps), ms: performance.now() - t0, ext: type === 'video/mp4' ? 'mp4' : 'webm' };
}
