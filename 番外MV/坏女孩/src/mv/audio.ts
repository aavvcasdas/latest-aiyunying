import songData from "../assets/songData";
import { START, AUDIO_END, AUDIO_OFFSET, TOTAL_END, FADE_IN, FADE_OUT } from "./core";

let bytes: Promise<ArrayBuffer> | null = null;
function songBytes() {
  if (!bytes) bytes = fetch(songData).then((r) => r.arrayBuffer());
  return bytes;
}

/** 解码内嵌音轨（缓冲区第 0 秒 = 原曲 AUDIO_OFFSET 秒） */
export async function decodeSong(sampleRate?: number): Promise<AudioBuffer> {
  const b = (await songBytes()).slice(0);
  const ac = sampleRate ? new OfflineAudioContext(2, sampleRate, sampleRate) : new AudioContext();
  try {
    return await ac.decodeAudioData(b);
  } finally {
    if (ac instanceof AudioContext) void ac.close();
  }
}

/** 淡入淡出包络（原曲时间） */
export function envelope(T: number) {
  if (T >= AUDIO_END || T < START) return 0;
  let g = 1;
  if (T < START + FADE_IN) g = (T - START) / FADE_IN;
  if (T > AUDIO_END - FADE_OUT) g = Math.min(g, (AUDIO_END - T) / FADE_OUT);
  return Math.max(0, g);
}

/** 预览播放器：时间以 AudioContext 时钟为准 */
export class Player {
  private ac = new AudioContext();
  private gain: GainNode;
  private src: AudioBufferSourceNode | null = null;
  private startedAt = 0;
  private offset = START;
  playing = false;
  streamDest: MediaStreamAudioDestinationNode | null = null;

  constructor(private buffer: AudioBuffer) {
    this.gain = this.ac.createGain();
    this.gain.connect(this.ac.destination);
  }
  createStreamDest() {
    this.streamDest = this.ac.createMediaStreamDestination();
    this.gain.connect(this.streamDest);
    return this.streamDest;
  }
  get time() {
    if (!this.playing) return this.offset;
    return Math.min(TOTAL_END, this.offset + (this.ac.currentTime - this.startedAt));
  }
  async play(from?: number) {
    await this.ac.resume();
    if (from !== undefined) this.offset = from;
    if (this.offset >= TOTAL_END - 0.05) this.offset = START;
    this.stopSource();
    const T0 = this.offset;
    const now = this.ac.currentTime + 0.03;
    this.startedAt = now;
    this.playing = true;
    if (T0 < AUDIO_END) {
      const src = this.ac.createBufferSource();
      src.buffer = this.buffer;
      src.connect(this.gain);
      const g = this.gain.gain;
      g.cancelScheduledValues(0);
      g.setValueAtTime(envelope(T0), now);
      if (T0 < START + FADE_IN) g.linearRampToValueAtTime(1, now + (START + FADE_IN - T0));
      const foStart = AUDIO_END - FADE_OUT;
      if (T0 < foStart) g.setValueAtTime(1, now + (foStart - T0));
      g.linearRampToValueAtTime(0, now + (AUDIO_END - T0));
      const off = Math.max(0, T0 - AUDIO_OFFSET);
      src.start(now, off, Math.max(0, Math.min(this.buffer.duration - off, AUDIO_END - T0)));
      this.src = src;
    }
  }
  pause() {
    if (!this.playing) return;
    this.offset = this.time;
    this.playing = false;
    this.stopSource();
  }
  seek(T: number) {
    const was = this.playing;
    this.pause();
    this.offset = Math.max(START, Math.min(TOTAL_END, T));
    if (was) void this.play();
  }
  private stopSource() {
    if (this.src) {
      try {
        this.src.stop();
      } catch {
        /* 已停止 */
      }
      this.src.disconnect();
      this.src = null;
    }
  }
  destroy() {
    this.stopSource();
    void this.ac.close();
  }
}
