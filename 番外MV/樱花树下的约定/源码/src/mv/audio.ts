// 音轨同步控制器：载入分支原曲《樱花树下的约定.mp3》，支持精准跳转、静音与视频导出混流
import songUrl from '../assets/song.mp3';
import { DURATION } from './timeline';
import { clamp } from './core';

export class MvAudio {
  el: HTMLAudioElement;
  private actx: AudioContext | null = null;
  private srcNode: MediaElementAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private destNode: MediaStreamAudioDestinationNode | null = null;
  private fallbackPlaying = false;
  private fallbackT = 0;
  private lastWall = 0;

  constructor() {
    this.el = new Audio();
    this.el.src = songUrl;
    this.el.preload = 'auto';
    this.el.crossOrigin = 'anonymous';
    this.el.volume = 0.9;
  }

  get duration(): number {
    const d = this.el.duration;
    return Number.isFinite(d) && d > 10 ? Math.min(d, DURATION) : DURATION;
  }

  get currentTime(): number {
    if (this.fallbackPlaying) {
      const now = performance.now();
      this.fallbackT += (now - this.lastWall) / 1000;
      this.lastWall = now;
      if (this.fallbackT >= DURATION) {
        this.fallbackT = DURATION;
        this.fallbackPlaying = false;
      }
      return this.fallbackT;
    }
    return clamp(this.el.currentTime || 0, 0, DURATION);
  }

  get playing(): boolean {
    return (!this.el.paused && !this.el.ended) || this.fallbackPlaying;
  }

  get muted(): boolean {
    return this.el.muted;
  }

  get volume(): number {
    return this.el.volume;
  }

  setVolume(v: number) {
    const cv = clamp(v, 0, 1);
    this.el.volume = cv;
    if (cv > 0 && this.el.muted) this.el.muted = false;
  }

  toggleMute(): boolean {
    this.el.muted = !this.el.muted;
    return this.el.muted;
  }

  async play(): Promise<void> {
    if (this.currentTime >= DURATION - 0.15) this.seek(0);
    if (this.actx && this.actx.state === 'suspended') {
      await this.actx.resume().catch(() => {});
    }
    try {
      this.fallbackPlaying = false;
      await this.el.play();
    } catch {
      // 无音频设备或自动播放受限环境下的确定性时钟兜底
      this.fallbackT = this.el.currentTime || 0;
      this.lastWall = performance.now();
      this.fallbackPlaying = true;
    }
  }

  pause() {
    if (this.fallbackPlaying) {
      this.fallbackPlaying = false;
      try { this.el.currentTime = this.fallbackT; } catch { /* ignore */ }
    }
    this.el.pause();
  }

  seek(t: number) {
    const ct = clamp(t, 0, DURATION - 0.01);
    this.fallbackT = ct;
    this.lastWall = performance.now();
    try {
      this.el.currentTime = ct;
    } catch { /* ignore */ }
  }

  /** 为浏览器端视频导出建立无损音轨流（同时保留扬声器监听） */
  getExportAudioTrack(): MediaStreamTrack | null {
    try {
      if (!this.actx) {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.actx = new AC();
        this.srcNode = this.actx.createMediaElementSource(this.el);
        this.gainNode = this.actx.createGain();
        this.destNode = this.actx.createMediaStreamDestination();
        this.srcNode.connect(this.gainNode);
        this.gainNode.connect(this.actx.destination);
        this.srcNode.connect(this.destNode);
      }
      if (this.actx.state === 'suspended') this.actx.resume().catch(() => {});
      return this.destNode?.stream.getAudioTracks()[0] ?? null;
    } catch {
      return null;
    }
  }

  dispose() {
    this.pause();
    this.el.src = '';
    if (this.actx) {
      this.actx.close().catch(() => {});
      this.actx = null;
    }
  }
}
