// 音轨：从原视频里抽出的 BGM（mp3 内嵌进单文件）。Web Audio 解码，画面时钟以音频时钟为准。
import songUrl from './assets/song.mp3';

export class Player {
  ctx: AudioContext | null = null;
  buf: AudioBuffer | null = null;
  private src: AudioBufferSourceNode | null = null;
  private gain: GainNode | null = null;
  playing = false;
  duration = 60;
  silent = false;
  private base = 0;
  private offset = 0;
  private wall = 0;
  onEnded?: () => void;

  async load() {
    try {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctx();
      this.gain = this.ctx.createGain(); this.gain.gain.value = 0.92; this.gain.connect(this.ctx.destination);
      const ab = await (await fetch(songUrl)).arrayBuffer();
      this.buf = await this.ctx.decodeAudioData(ab);
      this.duration = Math.min(60, this.buf.duration);
    } catch (e) {
      console.warn('音频解码失败，改为无声播放', e);
      this.buf = null; this.silent = true;
    }
  }
  time(): number {
    if (!this.playing) return this.offset;
    if (this.ctx && this.buf) return Math.min(this.duration, this.ctx.currentTime - this.base);
    return Math.min(this.duration, (performance.now() - this.wall) / 1000);
  }
  async play(from?: number) {
    if (from !== undefined) this.offset = from;
    if (this.offset >= this.duration - 0.05) this.offset = 0;
    this.stopSrc();
    if (this.ctx && this.buf) {
      if (this.ctx.state !== 'running') await this.ctx.resume();
      const s = this.ctx.createBufferSource(); s.buffer = this.buf; s.connect(this.gain!);
      s.start(0, this.offset);
      this.base = this.ctx.currentTime - this.offset;
      s.onended = () => { if (this.src === s && this.playing) { this.playing = false; this.offset = this.duration; this.onEnded?.(); } };
      this.src = s;
    } else {
      this.wall = performance.now() - this.offset * 1000;
    }
    this.playing = true;
  }
  pause() {
    if (!this.playing) return;
    this.offset = this.time(); this.playing = false; this.stopSrc();
  }
  seek(t: number) {
    const v = Math.max(0, Math.min(this.duration - 0.01, t));
    if (this.playing) { this.pause(); void this.play(v); } else this.offset = v;
  }
  private stopSrc() {
    if (!this.src) return;
    const s = this.src; this.src = null; s.onended = null;
    try { s.stop(); } catch { /* 已经停了 */ }
    s.disconnect();
  }
}
