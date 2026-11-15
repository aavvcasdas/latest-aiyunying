import bgmUrl from '../assets/bgm.wav';
import { SONG_DURATION } from './core';

export class MVAudio {
  el: HTMLAudioElement;
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private recordDest: MediaStreamAudioDestinationNode | null = null;
  private freqData: Uint8Array<ArrayBuffer> | null = null;
  private connected = false;

  constructor() {
    this.el = new Audio(bgmUrl);
    this.el.preload = 'auto';
    this.el.crossOrigin = 'anonymous';
  }

  private ensureGraph() {
    if (this.connected) return;
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      const src = this.ctx.createMediaElementSource(this.el);
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.72;
      src.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
      // Extra tap so MP4 export can mux the original BGM into the recording
      this.recordDest = this.ctx.createMediaStreamDestination();
      this.analyser.connect(this.recordDest);
      this.freqData = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount));
      this.connected = true;
    } catch {
      // Fallback safely to plain HTMLAudioElement playback without analyser
    }
  }

  async play(): Promise<void> {
    this.ensureGraph();
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume().catch(() => {});
    }
    if (this.el.currentTime >= SONG_DURATION - 0.08) {
      this.el.currentTime = 0;
    }
    await this.el.play();
  }

  pause() {
    this.el.pause();
  }

  seek(sec: number) {
    this.el.currentTime = Math.max(0, Math.min(SONG_DURATION - 0.02, sec));
  }

  setMuted(muted: boolean) {
    this.el.muted = muted;
  }

  setVolume(vol: number) {
    this.el.volume = Math.max(0, Math.min(1, vol));
  }

  get currentTime(): number {
    return this.el.currentTime || 0;
  }

  get paused(): boolean {
    return this.el.paused;
  }

  /** Audio stream (with the BGM track) for MediaRecorder muxing; null if WebAudio graph unavailable */
  getRecordStream(): MediaStream | null {
    if (this.recordDest) return this.recordDest.stream;
    const anyEl = this.el as HTMLAudioElement & { captureStream?: () => MediaStream };
    if (typeof anyEl.captureStream === 'function') {
      try {
        return anyEl.captureStream();
      } catch {
        return null;
      }
    }
    return null;
  }

  /** Returns normalized 0..1 bass/mid audio energy for subtle camera/light punch */
  getEnergy(): number {
    if (!this.analyser || !this.freqData || this.el.paused) return 0;
    this.analyser.getByteFrequencyData(this.freqData);
    let sum = 0;
    const bins = 24;
    for (let i = 1; i <= bins; i++) sum += this.freqData[i];
    return Math.min(1, sum / (bins * 175));
  }

  dispose() {
    this.el.pause();
    this.el.src = '';
    if (this.ctx) {
      this.ctx.close().catch(() => {});
    }
  }
}
