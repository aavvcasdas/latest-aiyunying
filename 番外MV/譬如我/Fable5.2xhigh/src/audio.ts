// 精华版 BGM：分支原声《譬如我精华.WAV》(28.003s) 转 MP3 后以 base64 内嵌（见 assets/bgm.ts）。
// 已在 Chromium 里实测：解码后与原 WAV 偏移 0 采样、时长一致，逐字时间可直接沿用。
// 画面由 AudioContext 时钟驱动，字幕卡点跟着声音走。
import { BGM_B64 } from "./assets/bgm";

export class Player {
  ctx: AudioContext | null = null;
  buf: AudioBuffer | null = null;
  src: AudioBufferSourceNode | null = null;
  gain: GainNode | null = null;
  playing = false;
  /** 解码失败或截图调试时：退化为无声的系统时钟 */
  silent = false;
  muted = false;
  volume = 0.9;
  error = "";
  private offset = 0;
  private startAt = 0;
  private clock0 = 0;
  private req = 0;
  private lat = 0;
  onEnded: (() => void) | null = null;

  async load(): Promise<void> {
    if (this.buf || this.silent) return;
    try {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AC();
      const bin = atob(BGM_B64);
      const u8 = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
      this.buf = await new Promise<AudioBuffer>((ok, bad) => this.ctx!.decodeAudioData(u8.buffer, ok, bad));
      this.gain = this.ctx.createGain();
      this.gain.gain.value = this.muted ? 0 : this.volume;
      this.gain.connect(this.ctx.destination);
    } catch (e) {
      this.silent = true;
      this.error = e instanceof Error ? e.message : String(e);
    }
  }

  get duration(): number {
    return this.buf?.duration ?? 28.003;
  }

  time(): number {
    if (!this.playing) return this.offset;
    if (this.ctx && !this.silent) {
      // 扣掉声卡输出延迟：让画面对齐"听到"的那一下，而不是"送出"的那一下
      const cur = Math.min(0.12, (this.ctx as AudioContext & { outputLatency?: number }).outputLatency || 0);
      this.lat += Math.max(-0.0005, Math.min(0.0005, cur - this.lat)); // 每帧最多挪 0.5ms，时钟不跳
      return Math.max(0, this.offset + (this.ctx.currentTime - this.startAt) - this.lat);
    }
    return this.offset + (performance.now() / 1000 - this.clock0);
  }

  async play(from?: number): Promise<void> {
    const request = ++this.req;
    if (from !== undefined) this.offset = from;
    if (this.ctx && !this.silent && this.buf) {
      if (this.ctx.state !== "running") await this.ctx.resume();
      if (request !== this.req) return;
      this.stopSrc();
      const s = this.ctx.createBufferSource();
      s.buffer = this.buf;
      s.connect(this.gain!);
      s.onended = () => {
        if (this.src === s && this.playing) {
          this.offset = this.duration;
          this.playing = false;
          this.src = null;
          this.onEnded?.();
        }
      };
      this.startAt = this.ctx.currentTime + 0.03;
      s.start(this.startAt, Math.max(0, Math.min(this.offset, this.duration - 0.05)));
      this.src = s;
    } else {
      this.clock0 = performance.now() / 1000;
    }
    this.playing = true;
  }

  pause(): void {
    ++this.req;
    if (!this.playing) return;
    this.offset = this.time();
    this.playing = false;
    this.stopSrc();
  }

  seek(t: number): void {
    const was = this.playing;
    if (was) {
      this.stopSrc();
      this.playing = false;
    }
    this.offset = Math.max(0, Math.min(this.duration, t));
    if (was) void this.play();
  }

  setMuted(m: boolean): void {
    this.muted = m;
    if (this.gain) this.gain.gain.value = m ? 0 : this.volume;
  }

  private stopSrc(): void {
    if (this.src) {
      this.src.onended = null;
      try {
        this.src.stop();
      } catch {
        /* 已停 */
      }
      this.src.disconnect();
      this.src = null;
    }
  }
}
