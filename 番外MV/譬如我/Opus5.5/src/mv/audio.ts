// 音轨：WebAudio 解码 28 秒《譬如我》精华版，以 AudioContext 时钟精确同步画面与逐字字幕
import songUrl from '../assets/essence.wav';
import { DURATION } from './generated';

export class Player {
  ctx: AudioContext | null = null;
  buf: AudioBuffer | null = null;
  src: AudioBufferSourceNode | null = null;
  gain: GainNode | null = null;
  playing = false;
  offset = 0;
  startAt = 0;
  silent = false;
  muted = false;
  onEnded: (() => void) | null = null;
  volume = 0.85;
  disposed = false;
  private playRequest = 0;
  private clock0 = 0;

  async load(onP?: (p: number) => void) {
    try {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AC();
      const res = await fetch(songUrl);
      onP?.(0.5);
      if (!res.ok) throw new Error(`Audio HTTP ${res.status}`);
      const ab = await res.arrayBuffer();
      if (this.disposed) return;
      this.buf = await new Promise<AudioBuffer>((ok, bad) => this.ctx!.decodeAudioData(ab, ok, bad));
      if (this.disposed) return;
      this.gain = this.ctx.createGain();
      this.gain.gain.value = this.muted ? 0 : this.volume;
      this.gain.connect(this.ctx.destination);
      onP?.(1);
    } catch (e) {
      if (!this.disposed) throw new Error(`原声音轨载入失败：${e instanceof Error ? e.message : String(e)}`);
    }
  }

  get duration() {
    return this.buf?.duration ?? DURATION;
  }

  time() {
    if (!this.playing) return this.offset;
    if (this.ctx && !this.silent) return Math.max(0, this.offset + (this.ctx.currentTime - this.startAt));
    return this.offset + (performance.now() / 1000 - this.clock0);
  }

  async play(from?: number) {
    const request = ++this.playRequest;
    if (from !== undefined) this.offset = from;
    if (this.ctx && !this.silent && this.buf) {
      if (this.ctx.state !== 'running') await this.ctx.resume();
      if (request !== this.playRequest || this.disposed) return;
      this.stopSrc();
      const s = this.ctx.createBufferSource();
      s.buffer = this.buf;
      s.connect(this.gain!);
      s.onended = () => {
        if (this.src === s && this.playing) {
          this.offset = Math.min(this.time(), this.duration);
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

  pause() {
    ++this.playRequest;
    if (!this.playing) return;
    this.offset = this.time();
    this.playing = false;
    this.stopSrc();
  }

  seek(t: number) {
    const was = this.playing;
    if (was) {
      this.stopSrc();
      this.playing = false;
    }
    this.offset = Math.max(0, Math.min(this.duration - 0.04, t));
    if (was) void this.play();
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.gain) this.gain.gain.value = m ? 0 : this.volume;
  }

  setVolume(v: number) {
    this.volume = Math.max(0, Math.min(1, v));
    this.setMuted(this.muted);
  }

  dispose() {
    this.disposed = true;
    this.pause();
    this.stopSrc();
    this.gain?.disconnect();
    if (this.ctx?.state !== 'closed') void this.ctx?.close().catch(() => {});
  }

  private stopSrc() {
    if (this.src) {
      this.src.onended = null;
      try {
        this.src.stop();
      } catch {
        /* already stopped */
      }
      this.src.disconnect();
      this.src = null;
    }
  }
}
