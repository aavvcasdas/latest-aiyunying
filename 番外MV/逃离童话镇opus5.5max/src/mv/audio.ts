/**
 * 播放引擎：歌曲与音效轨都解码成 AudioBuffer，用同一个 AudioContext 时钟同时起播——
 * 两条轨在采样级别对齐，画面时间直接读这个时钟（扣掉输出延迟），所以「画面 / 歌 / 音效」三者永远同一刻。
 */
import { renderSfx, wavBlob, type Cue } from './sfx';

export const SONG_LEVEL = 0.9;
export const SFX_LEVEL = 0.62;

export class AudioEngine {
  ctx: AudioContext | null = null;
  song: AudioBuffer | null = null;
  sfx: AudioBuffer | null = null;
  playing = false;
  sfxOn = true;
  private master: GainNode | null = null;
  private songG: GainNode | null = null;
  private sfxG: GainNode | null = null;
  private srcs: AudioBufferSourceNode[] = [];
  private t0 = 0;
  private off = 0;
  private loading: Promise<void> | null = null;

  constructor(private songUrl: string, private cues: Cue[], private dur: number) {}

  /** 解码歌曲 + 离线合成音效轨（不需要用户手势，可以在封面阶段就做完） */
  load(onStep?: (s: 'song' | 'sfx' | 'done') => void) {
    if (!this.loading) {
      this.loading = (async () => {
        onStep?.('song');
        const arr = await (await fetch(this.songUrl)).arrayBuffer();
        this.song = await new OfflineAudioContext(2, 44100, 44100).decodeAudioData(arr);
        onStep?.('sfx');
        this.sfx = await renderSfx(this.cues, this.dur + 1);
        onStep?.('done');
      })();
    }
    return this.loading;
  }

  private ensure() {
    if (!this.ctx) {
      const AC: typeof AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AC({ latencyHint: 'interactive' });
      this.master = ctx.createGain(); this.songG = ctx.createGain(); this.sfxG = ctx.createGain();
      this.songG.gain.value = SONG_LEVEL; this.sfxG.gain.value = this.sfxOn ? SFX_LEVEL : 0;
      const lim = ctx.createDynamicsCompressor();
      lim.threshold.value = -2; lim.knee.value = 3; lim.ratio.value = 10; lim.attack.value = 0.002; lim.release.value = 0.15;
      this.songG.connect(this.master); this.sfxG.connect(this.master); this.master.connect(lim); lim.connect(ctx.destination);
      this.ctx = ctx;
    }
    return this.ctx;
  }

  private stopSrcs() {
    for (const s of this.srcs) { try { s.stop(); } catch { /* 已停 */ } s.disconnect(); }
    this.srcs = [];
  }

  async play(from: number) {
    await this.load();
    const ctx = this.ensure();
    if (ctx.state !== 'running') await ctx.resume();
    this.stopSrcs();
    const when = ctx.currentTime + 0.06;
    const pairs: [AudioBuffer | null, GainNode | null][] = [[this.song, this.songG], [this.sfx, this.sfxG]];
    for (const [buf, g] of pairs) {
      if (!buf || !g || from >= buf.duration) continue;
      const s = ctx.createBufferSource(); s.buffer = buf; s.connect(g); s.start(when, Math.max(0, from)); this.srcs.push(s);
    }
    this.t0 = when; this.off = from; this.playing = true;
  }

  pause() { this.off = this.time(); this.stopSrcs(); this.playing = false; }

  seek(t: number) { if (this.playing) void this.play(t); else this.off = t; }

  /** 现在「听到」的是第几秒：时钟 − 起播时刻 − 输出延迟 */
  time() {
    if (!this.playing || !this.ctx) return this.off;
    const lat = (this.ctx.outputLatency || 0) + (this.ctx.baseLatency || 0);
    return Math.max(this.off, this.off + (this.ctx.currentTime - this.t0) - lat);
  }

  setVolume(v: number) { if (this.ctx && this.master) this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.04); }

  setSfx(on: boolean) {
    this.sfxOn = on;
    if (this.ctx && this.sfxG) this.sfxG.gain.setTargetAtTime(on ? SFX_LEVEL : 0, this.ctx.currentTime, 0.03);
  }

  /** 离线混音：歌 + 音效（含片尾淡出）→ WAV。给逐帧出片后编码用（页面里的音量淡出在导出时不参与，这里补上） */
  async mixdown(end: number, fadeA: number, withSfx = true): Promise<Blob> {
    await this.load();
    const sr = 44100, ctx = new OfflineAudioContext(2, Math.ceil(end * sr), sr);
    const master = ctx.createGain();
    master.gain.setValueAtTime(1, 0); master.gain.setValueAtTime(1, fadeA); master.gain.linearRampToValueAtTime(0.0001, end - 0.6);
    const lim = ctx.createDynamicsCompressor();
    lim.threshold.value = -2; lim.knee.value = 3; lim.ratio.value = 10; lim.attack.value = 0.002; lim.release.value = 0.15;
    master.connect(lim); lim.connect(ctx.destination);
    const add = (buf: AudioBuffer | null, level: number) => {
      if (!buf) return;
      const s = ctx.createBufferSource(), g = ctx.createGain(); g.gain.value = level; s.buffer = buf; s.connect(g); g.connect(master); s.start(0);
    };
    add(this.song, SONG_LEVEL);
    if (withSfx) add(this.sfx, SFX_LEVEL);
    return wavBlob(await ctx.startRendering());
  }
}
