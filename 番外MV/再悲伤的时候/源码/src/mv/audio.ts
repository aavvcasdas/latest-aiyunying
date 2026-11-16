// 音轨：WebAudio 解码整首歌，用 AudioContext 的时钟当画面时间（逐帧对齐）；解不开就退成无声时钟。
import songUrl from '../assets/song.mp3';
import { DURATION } from './timing';

export class Player {
  ctx: AudioContext | null = null; buf: AudioBuffer | null = null; src: AudioBufferSourceNode | null = null; gain: GainNode | null = null;
  playing = false; offset = 0; startAt = 0; silent = false; muted = false; onEnded: (() => void) | null = null; private clock0 = 0;
  async load() {
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AC(); const ab = await (await fetch(songUrl)).arrayBuffer();
      this.buf = await new Promise<AudioBuffer>((ok, bad) => this.ctx!.decodeAudioData(ab, ok, bad));
      this.gain = this.ctx.createGain(); this.gain.connect(this.ctx.destination);
    } catch (e) { console.warn('音轨载入失败，改为无声时钟', e); this.silent = true; }
  }
  get duration() { return this.buf?.duration ?? DURATION; }
  time() {
    if (!this.playing) return this.offset;
    if (this.ctx && !this.silent) return Math.max(0, this.offset + (this.ctx.currentTime - this.startAt));
    return this.offset + (performance.now() / 1000 - this.clock0);
  }
  async play(from?: number) {
    if (from !== undefined) this.offset = from;
    if (this.offset >= this.duration - 0.05) this.offset = 0;
    if (this.ctx && !this.silent && this.buf) {
      if (this.ctx.state !== 'running') await this.ctx.resume();
      this.stopSrc(); const s = this.ctx.createBufferSource(); s.buffer = this.buf; s.connect(this.gain!);
      s.onended = () => { if (this.src === s && this.playing) { this.offset = this.duration; this.playing = false; this.src = null; this.onEnded?.(); } };
      this.startAt = this.ctx.currentTime + 0.03; s.start(this.startAt, Math.max(0, this.offset)); this.src = s;
    } else this.clock0 = performance.now() / 1000;
    this.playing = true;
  }
  pause() { if (!this.playing) return; this.offset = this.time(); this.playing = false; this.stopSrc(); }
  seek(t: number) { const was = this.playing; if (was) { this.stopSrc(); this.playing = false; } this.offset = Math.max(0, Math.min(t, this.duration)); if (was) void this.play(); }
  setMuted(m: boolean) { this.muted = m; if (this.gain) this.gain.gain.value = m ? 0 : 1; }
  private stopSrc() { if (this.src) { this.src.onended = null; try { this.src.stop(); } catch { /* 已停 */ } this.src.disconnect(); this.src = null; } }
}
