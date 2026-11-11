import { Muxer, ArrayBufferTarget } from "mp4-muxer";
import { W, H, START, TOTAL_END, AUDIO_OFFSET } from "./core";
import type { AtlasData } from "./three/actors";
import { Film } from "./film";
import { decodeSong, envelope, type Player } from "./audio";

export interface ExportProgress {
  phase: "prepare" | "audio" | "video" | "mux" | "done";
  done: number;
  total: number;
  note?: string;
}
export interface ExportResult {
  blob: Blob;
  filename: string;
  container: "mp4" | "webm";
  width: number;
  height: number;
  codec: string;
  seconds: number;
}
export interface ExportOptions {
  width: 1280 | 1920;
  fps: 30;
  onProgress: (p: ExportProgress) => void;
  signal?: { cancelled: boolean };
  /** 只导出一段（原曲时间），默认整片 */
  from?: number;
  to?: number;
}

export function webCodecsSupported() {
  return typeof window !== "undefined" && "VideoEncoder" in window && "AudioEncoder" in window && "VideoFrame" in window;
}
const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** WebCodecs：离线逐帧渲染（不受实时速度限制）→ H.264 + AAC → MP4 */
export async function exportMp4(A: AtlasData, o: ExportOptions): Promise<ExportResult> {
  const width = o.width;
  const height = Math.round((width * H) / W);
  const fps = o.fps;
  const T0 = o.from ?? START;
  const T1 = o.to ?? TOTAL_END;
  const duration = T1 - T0;
  const totalFrames = Math.round(duration * fps);
  o.onProgress({ phase: "prepare", done: 0, total: 1, note: "检查编码器、搭建全部镜头…" });

  const bitrate = width >= 1920 ? 9_000_000 : 5_500_000;
  let videoCodec = "";
  for (const codec of width >= 1920 ? ["avc1.640028", "avc1.4d0028", "avc1.42002a"] : ["avc1.64001f", "avc1.4d001f", "avc1.42001f"]) {
    const r = await VideoEncoder.isConfigSupported({ codec, width, height, bitrate, framerate: fps }).catch(() => ({ supported: false }));
    if (r.supported) {
      videoCodec = codec;
      break;
    }
  }
  if (!videoCodec) throw new Error("这个浏览器不支持 H.264 编码（VideoEncoder）");
  let audioCodec: "aac" | "opus" = "aac";
  let sampleRate = 44100;
  const aacOk = await AudioEncoder.isConfigSupported({ codec: "mp4a.40.2", sampleRate, numberOfChannels: 2, bitrate: 192_000 }).catch(() => ({ supported: false }));
  if (!aacOk.supported) {
    const opusOk = await AudioEncoder.isConfigSupported({ codec: "opus", sampleRate: 48000, numberOfChannels: 2, bitrate: 160_000 }).catch(() => ({ supported: false }));
    if (!opusOk.supported) throw new Error("这个浏览器不支持 AAC / Opus 音频编码（AudioEncoder）");
    audioCodec = "opus";
    sampleRate = 48000;
  }

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: "avc", width, height, frameRate: fps },
    audio: { codec: audioCodec, numberOfChannels: 2, sampleRate },
    fastStart: "in-memory",
    firstTimestampBehavior: "offset",
  });
  let encodeError: unknown = null;

  // ---- 音轨：按采样对位 + 包络 ----
  o.onProgress({ phase: "audio", done: 0, total: 1, note: "解码音轨…" });
  const song = await decodeSong(sampleRate);
  const ae = new AudioEncoder({ output: (c, m) => muxer.addAudioChunk(c, m), error: (e) => (encodeError = e) });
  ae.configure({ codec: audioCodec === "aac" ? "mp4a.40.2" : "opus", sampleRate, numberOfChannels: 2, bitrate: audioCodec === "aac" ? 192_000 : 160_000 });
  const total = Math.round(duration * sampleRate);
  const ch0 = song.getChannelData(0);
  const ch1 = song.numberOfChannels > 1 ? song.getChannelData(1) : ch0;
  const base = Math.round((T0 - AUDIO_OFFSET) * sampleRate);
  const BLOCK = 2048;
  for (let n = 0; n < total; n += BLOCK) {
    if (o.signal?.cancelled) throw new Error("已取消");
    const len = Math.min(BLOCK, total - n);
    const data = new Float32Array(len * 2);
    for (let i = 0; i < len; i++) {
      const si = base + n + i;
      const g = envelope(T0 + (n + i) / sampleRate);
      data[i] = (si >= 0 && si < ch0.length ? ch0[si] : 0) * g;
      data[len + i] = (si >= 0 && si < ch1.length ? ch1[si] : 0) * g;
    }
    const ad = new AudioData({ format: "f32-planar", sampleRate, numberOfFrames: len, numberOfChannels: 2, timestamp: Math.round((n / sampleRate) * 1e6), data });
    ae.encode(ad);
    ad.close();
    if (n % (BLOCK * 48) === 0) {
      o.onProgress({ phase: "audio", done: n, total, note: audioCodec === "aac" ? "AAC 编码" : "Opus 编码" });
      await sleep(0);
    }
  }
  await ae.flush();
  ae.close();
  if (encodeError) throw encodeError;

  // ---- 画面：独立的 3D 舞台逐帧渲染（不带自由视角） ----
  const out = document.createElement("canvas");
  const film = new Film(A, out, width, height);
  try {
    o.onProgress({ phase: "prepare", done: 0, total: 1, note: "编译着色器…" });
    film.stage.prewarm();
    const ve = new VideoEncoder({ output: (c, m) => muxer.addVideoChunk(c, m), error: (e) => (encodeError = e) });
    ve.configure({ codec: videoCodec, width, height, bitrate, framerate: fps, latencyMode: "quality" });
    const t0 = performance.now();
    for (let i = 0; i < totalFrames; i++) {
      if (o.signal?.cancelled) {
        ve.close();
        throw new Error("已取消");
      }
      if (encodeError) throw encodeError;
      film.frame(T0 + i / fps);
      const vf = new VideoFrame(out, { timestamp: Math.round((i * 1e6) / fps), duration: Math.round(1e6 / fps) });
      ve.encode(vf, { keyFrame: i % (fps * 2) === 0 });
      vf.close();
      while (ve.encodeQueueSize > 8) await sleep(1);
      if (i % 5 === 0) {
        const el = (performance.now() - t0) / 1000;
        const rate = i / Math.max(el, 0.01);
        o.onProgress({ phase: "video", done: i, total: totalFrames, note: `${rate.toFixed(1)} 帧/秒 · 约剩 ${Math.max(0, (totalFrames - i) / Math.max(rate, 0.1)).toFixed(0)} 秒` });
        await sleep(0);
      }
    }
    await ve.flush();
    ve.close();
    if (encodeError) throw encodeError;
  } finally {
    film.dispose();
  }
  o.onProgress({ phase: "mux", done: 1, total: 1, note: "封装 MP4…" });
  muxer.finalize();
  const blob = new Blob([muxer.target.buffer], { type: "video/mp4" });
  o.onProgress({ phase: "done", done: 1, total: 1 });
  return { blob, filename: `坏女孩_鲸鱼娘xClaude_3D复刻MV_${height}p.mp4`, container: "mp4", width, height, codec: `H.264 ${videoCodec} + ${audioCodec.toUpperCase()}`, seconds: duration };
}

/** 兜底：MediaRecorder 实时录制（浏览器没有 WebCodecs 时） */
export async function exportRealtime(A: AtlasData, player: Player, o: ExportOptions): Promise<ExportResult> {
  const out = document.createElement("canvas");
  const film = new Film(A, out, W, H);
  const dest = player.createStreamDest();
  const stream = new MediaStream([...out.captureStream(30).getVideoTracks(), ...dest.stream.getAudioTracks()]);
  const mime = ['video/mp4;codecs="avc1.42E01E,mp4a.40.2"', "video/mp4", "video/webm;codecs=vp9,opus", "video/webm"].find((m) => MediaRecorder.isTypeSupported(m));
  if (!mime) throw new Error("这个浏览器不支持录制");
  const container: "mp4" | "webm" = mime.startsWith("video/mp4") ? "mp4" : "webm";
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6_000_000, audioBitsPerSecond: 192_000 });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const stopped = new Promise<void>((r) => (rec.onstop = () => r()));
  rec.start(500);
  await player.play(START);
  try {
    await new Promise<void>((resolve, reject) => {
      const loop = () => {
        if (o.signal?.cancelled) return reject(new Error("已取消"));
        const T = player.time;
        film.frame(T);
        o.onProgress({ phase: "video", done: T - START, total: TOTAL_END - START, note: "实时录制中（请保持标签页在前台）" });
        if (T >= TOTAL_END - 0.05 || !player.playing) resolve();
        else requestAnimationFrame(loop);
      };
      loop();
    });
  } finally {
    player.pause();
    rec.stop();
    film.dispose();
  }
  await stopped;
  o.onProgress({ phase: "done", done: 1, total: 1 });
  return { blob: new Blob(chunks, { type: mime.split(";")[0] }), filename: `坏女孩_鲸鱼娘xClaude_3D复刻MV.${container}`, container, width: W, height: H, codec: mime, seconds: TOTAL_END - START };
}
