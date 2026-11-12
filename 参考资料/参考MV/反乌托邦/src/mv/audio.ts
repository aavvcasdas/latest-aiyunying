// 音轨：仓库根目录 反乌托邦.mp4 里的 AAC 原样抽出（ADTS），在浏览器里拆成一帧帧 AAC。
// 原文件第一帧是编码器预滚（skip_samples = 1024），这里直接丢掉，剩下的帧与原片时间轴逐采样对齐：
// 第 n 帧的时间 = n × 1024 / 44100 秒。导出 MP4 时这些帧原样封进去，不重新编码。
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import songB64 from './assets/song';

export type Aac = { frames: Uint8Array[]; asc: Uint8Array; sampleRate: number; channels: number; frameDur: number };
const RATES = [96000, 88200, 64000, 48000, 44100, 32000, 24000, 22050, 16000, 12000, 11025, 8000, 7350];
let cache: Aac | null = null;

export function getAac(): Aac {
  if (cache) return cache;
  const bin = atob(songB64), u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  const frames: Uint8Array[] = [];
  let off = 0, prof = 2, sfi = 4, ch = 2;
  while (off + 7 <= u8.length) {
    if (u8[off] !== 0xff || (u8[off + 1] & 0xf0) !== 0xf0) { off++; continue; }
    const hl = u8[off + 1] & 1 ? 7 : 9;
    prof = ((u8[off + 2] >> 6) & 3) + 1; sfi = (u8[off + 2] >> 2) & 15; ch = ((u8[off + 2] & 1) << 2) | ((u8[off + 3] >> 6) & 3);
    const len = ((u8[off + 3] & 3) << 11) | (u8[off + 4] << 3) | (u8[off + 5] >> 5);
    if (len < hl || off + len > u8.length) break;
    frames.push(u8.subarray(off + hl, off + len)); off += len;
  }
  if (frames.length < 100) throw new Error('音轨解析失败：AAC 帧太少');
  const sampleRate = RATES[sfi];
  const asc = new Uint8Array([(prof << 3) | (sfi >> 1), ((sfi & 1) << 7) | (ch << 3)]);
  cache = { frames: frames.slice(1), asc, sampleRate, channels: ch, frameDur: 1024 / sampleRate };
  return cache;
}

export const aacMeta = (a: Aac) => ({ decoderConfig: { codec: 'mp4a.40.2', numberOfChannels: a.channels, sampleRate: a.sampleRate, description: a.asc } });

/** 把 AAC 帧封成一个只有音轨的 m4a（给网页播放 / decodeAudioData 用） */
export function buildM4a(): ArrayBuffer {
  const a = getAac();
  const mx = new Muxer({ target: new ArrayBufferTarget(), audio: { codec: 'aac', numberOfChannels: a.channels, sampleRate: a.sampleRate }, fastStart: 'in-memory' });
  a.frames.forEach((f, i) => mx.addAudioChunkRaw(f, 'key', Math.round(i * a.frameDur * 1e6), Math.round(a.frameDur * 1e6), i === 0 ? (aacMeta(a) as any) : undefined));
  mx.finalize();
  return mx.target.buffer;
}

export async function decodeSong(ac: BaseAudioContext): Promise<AudioBuffer> {
  try { return await ac.decodeAudioData(buildM4a()); }
  catch {
    const bin = atob(songB64), u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return await ac.decodeAudioData(u8.buffer);
  }
}

/** 网页预览用的播放器：以 AudioContext 的时钟为准，画面跟着声音走 */
export class SongPlayer {
  ac: AudioContext | null = null; buf: AudioBuffer | null = null; src: AudioBufferSourceNode | null = null;
  startAt = 0; offset = 0; playing = false; dur: number; onEnd: (() => void) | null = null;
  private loading: Promise<void> | null = null;
  constructor(dur: number) { this.dur = dur; }
  load() {
    if (!this.loading) this.loading = (async () => { this.ac = new AudioContext(); this.buf = await decodeSong(this.ac); })();
    return this.loading;
  }
  time() {
    if (!this.playing || !this.ac) return this.offset;
    const lat = (this.ac as any).outputLatency || this.ac.baseLatency || 0;
    return Math.max(0, Math.min(this.dur, this.offset + (this.ac.currentTime - this.startAt) - lat));
  }
  async play(from?: number) {
    await this.load(); const ac = this.ac!;
    if (ac.state === 'suspended') await ac.resume();
    this.stopSrc();
    if (from != null) this.offset = from;
    if (this.offset >= this.dur - 0.05) this.offset = 0;
    const src = ac.createBufferSource(); src.buffer = this.buf; src.connect(ac.destination);
    this.startAt = ac.currentTime + 0.03; src.start(this.startAt, this.offset); this.src = src; this.playing = true;
    src.onended = () => { if (this.src === src) { this.src = null; this.playing = false; this.offset = this.dur; this.onEnd?.(); } };
  }
  pause() { if (!this.playing) return; this.offset = this.time(); this.stopSrc(); this.playing = false; }
  seek(t: number) { const was = this.playing; this.offset = Math.max(0, Math.min(this.dur, t)); if (was) void this.play(this.offset); }
  private stopSrc() { const s = this.src; this.src = null; if (s) { s.onended = null; try { s.stop(); } catch { /* 已停 */ } } }
}
