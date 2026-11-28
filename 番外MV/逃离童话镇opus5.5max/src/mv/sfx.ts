/**
 * 程序化音效库：全部用 Web Audio 节点即时合成（不引入任何外部音频素材），
 * 用 OfflineAudioContext 一次性渲染成一整条与歌曲等长的「音效轨」。
 * 噪声与随机全部来自固定种子，所以同一份时间表每次渲染出来的声音逐采样相同。
 */
export type Sfx =
  | 'whoosh' | 'whooshUp' | 'swell' | 'pageFlip' | 'pop' | 'sparkle' | 'chime' | 'ding' | 'musicbox'
  | 'growl' | 'howl' | 'roar' | 'chomp' | 'slash' | 'rip' | 'bells' | 'kiss' | 'confetti' | 'cheer'
  | 'clapper' | 'tapeStop' | 'stamp' | 'thud' | 'heartbeat' | 'drip' | 'tick' | 'splash' | 'bubbles'
  | 'magic' | 'gulp' | 'clink' | 'boom' | 'whirr' | 'twang' | 'flap' | 'boing' | 'inflate' | 'jingle'
  | 'clank' | 'shatter' | 'crash' | 'gunCock' | 'gunshot' | 'echo' | 'firework' | 'step' | 'quill'
  | 'splat' | 'creak';

/** t = 画面事件发生的秒数（音效的「打点」就在这一刻），v 音量，p 声像 −1…1，r 音高倍率 */
export interface Cue { t: number; s: Sfx; v?: number; p?: number; r?: number }

const WET: Partial<Record<Sfx, number>> = {
  sparkle: 0.5, chime: 0.45, ding: 0.4, musicbox: 0.4, bells: 0.5, howl: 0.5, drip: 0.7, echo: 0.45,
  gunshot: 0.55, magic: 0.5, firework: 0.45, boom: 0.35, roar: 0.3, shatter: 0.3, clink: 0.35, kiss: 0.2,
  heartbeat: 0.25, splash: 0.25, cheer: 0.25, crash: 0.25,
};

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export async function renderSfx(cues: Cue[], dur: number, sr = 44100): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(2, Math.ceil(dur * sr), sr);
  const rand = mulberry(20260519);

  // 共用的两秒白噪声
  const nb = ctx.createBuffer(1, sr * 2, sr);
  { const d = nb.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = rand() * 2 - 1; }
  // 房间混响脉冲（指数衰减噪声 + 几个早期反射）
  const irLen = Math.floor(sr * 2.0);
  const ir = ctx.createBuffer(2, irLen, sr);
  for (let ch = 0; ch < 2; ch++) {
    const d = ir.getChannelData(ch);
    for (let i = 0; i < irLen; i++) d[i] = (rand() * 2 - 1) * Math.pow(1 - i / irLen, 3.4);
    for (const [ms, g] of [[11, 0.5], [23, 0.35], [37, 0.25]]) d[Math.floor((ms + ch * 3) * sr / 1000)] += g;
  }
  const verb = ctx.createConvolver(); verb.normalize = true; verb.buffer = ir;
  const verbIn = ctx.createGain(); verbIn.gain.value = 0.8;
  const dry = ctx.createGain(); dry.gain.value = 1;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -12; comp.knee.value = 8; comp.ratio.value = 4; comp.attack.value = 0.002; comp.release.value = 0.18;
  verbIn.connect(verb); verb.connect(comp); dry.connect(comp); comp.connect(ctx.destination);

  const T = (t: number) => Math.max(0, t);
  const N = (t: number, d: number) => {
    const s = ctx.createBufferSource(); s.buffer = nb; s.loop = true;
    s.start(T(t), rand() * 1.5); s.stop(T(t) + d + 0.05); return s;
  };
  const O = (type: OscillatorType, f: number, t: number, d: number) => {
    const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, T(t));
    o.start(T(t)); o.stop(T(t) + d + 0.05); return o;
  };
  const F = (type: BiquadFilterType, f: number, q = 0.7) => {
    const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b;
  };
  /** 包络：a 秒升到 peak，再 d 秒指数衰减到静音 */
  const G = (t: number, a: number, d: number, peak: number) => {
    const g = ctx.createGain(); t = T(t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(Math.max(0.0002, peak), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
    return g;
  };
  const chain = (...n: AudioNode[]) => { for (let i = 0; i < n.length - 1; i++) n[i].connect(n[i + 1]); return n[n.length - 1]; };
  /** 一个「声部」的出口：声像 + 干声 + 混响送出 */
  const voice = (pan: number, wet: number) => {
    const inp = ctx.createGain();
    const p = ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan));
    inp.connect(p); p.connect(dry);
    if (wet > 0) { const w = ctx.createGain(); w.gain.value = wet; p.connect(w); w.connect(verbIn); }
    return inp;
  };
  const exp = (pr: AudioParam, v: number, t: number) => pr.exponentialRampToValueAtTime(Math.max(0.01, v), T(t));
  const vib = (o: OscillatorNode, hz: number, depth: number, t: number, d: number) => {
    const l = O('sine', hz, t, d), lg = ctx.createGain(); lg.gain.value = depth; l.connect(lg); lg.connect(o.frequency);
    return lg;
  };
  const randAmp = (g: GainNode, t: number, d: number, peak: number, n: number) => {
    t = T(t); g.gain.setValueAtTime(0.0001, t);
    for (let k = 1; k <= n; k++) g.gain.linearRampToValueAtTime(peak * (0.12 + rand() * 0.88), t + (k / n) * d * 0.9);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  };
  const bell = (o: AudioNode, t: number, f: number, v: number, ratios: number[], amps: number[], decs: number[]) => {
    ratios.forEach((ra, i) => chain(O('sine', f * ra, t, decs[i]), G(t, 0.003, decs[i], amps[i] * v), o));
  };
  const blip = (o: AudioNode, t: number, f0: number, f1: number, d: number, v: number, type: OscillatorType = 'sine') => {
    const x = O(type, f0, t, d); exp(x.frequency, f1, t + d * 0.7); chain(x, G(t, 0.002, d, v), o);
  };
  const click = (o: AudioNode, t: number, f: number, q: number, d: number, v: number) => chain(N(t, d + 0.01), F('bandpass', f, q), G(t, 0.0008, d, v), o);
  const thump = (o: AudioNode, t: number, f0: number, f1: number, d: number, v: number) => {
    const x = O('sine', f0, t, d); exp(x.frequency, f1, t + d * 0.6); chain(x, G(t, 0.002, d, v), o);
  };

  const R: Record<Sfx, (t: number, v: number, r: number, o: AudioNode) => void> = {
    whoosh: (t, v, r, o) => {
      const f = F('bandpass', 300 * r, 1.1); f.frequency.setValueAtTime(300 * r, T(t));
      exp(f.frequency, 2600 * r, t + 0.28); exp(f.frequency, 500 * r, t + 0.62);
      chain(N(t, 0.66), f, G(t, 0.26, 0.38, 0.6 * v), o);
    },
    whooshUp: (t, v, r, o) => {
      const f = F('bandpass', 250 * r, 1.2); f.frequency.setValueAtTime(250 * r, T(t)); exp(f.frequency, 5200 * r, t + 0.65);
      chain(N(t, 0.75), f, G(t, 0.6, 0.12, 0.5 * v), o);
    },
    swell: (t, v, r, o) => { // 反向镲片：在 t 之前 0.6 秒升起，正好在 t 截断
      const t0 = T(t - 0.6), f = F('highpass', 1500 * r, 0.8); f.frequency.setValueAtTime(1500 * r, t0); exp(f.frequency, 7000 * r, t);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.55 * v, T(t)); g.gain.linearRampToValueAtTime(0.0001, T(t) + 0.03);
      chain(N(t0, 0.66), f, g, o);
    },
    pageFlip: (t, v, r, o) => {
      for (let k = 0; k < 3; k++) { const tk = t + k * 0.07; chain(N(tk, 0.07), F('highpass', 1800), F('bandpass', 3200 * r, 0.9), G(tk, 0.004, 0.065, (0.55 - k * 0.13) * v), o); }
      chain(N(t, 0.3), F('lowpass', 900), G(t, 0.03, 0.25, 0.15 * v), o);
    },
    pop: (t, v, r, o) => { blip(o, t, 900 * r, 170 * r, 0.13, 0.6 * v); click(o, t, 3500, 0.8, 0.012, 0.25 * v); },
    sparkle: (t, v, r, o) => {
      const fs = [2093, 2349, 2637, 3136, 3520, 4186];
      for (let k = 0; k < 6; k++) { const f = fs[Math.floor(rand() * fs.length)] * r, tk = t + k * 0.055; chain(O('triangle', f, tk, 0.5), G(tk, 0.002, 0.45, 0.17 * v), o); }
    },
    chime: (t, v, r, o) => bell(o, t, 1568 * r, v, [1, 2.76, 5.4], [0.32, 0.12, 0.05], [1.4, 0.7, 0.35]),
    ding: (t, v, r, o) => bell(o, t, 2093 * r, v, [1, 2.4, 4.1], [0.3, 0.14, 0.06], [0.9, 0.5, 0.25]),
    musicbox: (t, v, r, o) => {
      [0, 4, 7, 12, 11, 7, 4, 7].forEach((s, i) => {
        const tk = t + i * 0.21, f = 1046.5 * r * Math.pow(2, s / 12);
        chain(O('sine', f, tk, 0.7), G(tk, 0.002, 0.6, 0.16 * v), o);
        chain(O('triangle', f * 2, tk, 0.3), G(tk, 0.002, 0.25, 0.04 * v), o);
      });
    },
    growl: (t, v, r, o) => {
      const lp = F('lowpass', 520, 1.2), g = ctx.createGain(); g.gain.value = 0.6;
      O('sawtooth', 72 * r, t, 1.0).connect(lp); O('sawtooth', 75.5 * r, t, 1.0).connect(lp);
      const l = O('sine', 17, t, 1.0), lg = ctx.createGain(); lg.gain.value = 0.35; l.connect(lg); lg.connect(g.gain);
      chain(lp, g, G(t, 0.14, 0.86, 0.55 * v), o);
      chain(N(t, 1.0), F('lowpass', 260), G(t, 0.2, 0.7, 0.3 * v), o);
    },
    howl: (t, v, r, o) => {
      for (const [m, a] of [[1, 0.3], [2, 0.08]] as const) {
        const x = O('sine', 330 * r * m, t, 1.7); t = T(t);
        x.frequency.linearRampToValueAtTime(560 * r * m, t + 0.45); x.frequency.linearRampToValueAtTime(610 * r * m, t + 0.9); x.frequency.linearRampToValueAtTime(430 * r * m, t + 1.6);
        vib(x, 5.5, 10 * m, t, 1.7); chain(x, G(t, 0.35, 1.3, a * v), o);
      }
      chain(N(t, 1.5), F('bandpass', 1200, 1), G(t, 0.3, 1.1, 0.05 * v), o);
    },
    roar: (t, v, r, o) => {
      const lp = F('lowpass', 420, 1.4), g = ctx.createGain(); g.gain.value = 0.6;
      O('sawtooth', 52 * r, t, 1.6).connect(lp); O('sawtooth', 55 * r, t, 1.6).connect(lp); O('square', 104 * r, t, 1.6).connect(lp);
      const l = O('sine', 11, t, 1.6), lg = ctx.createGain(); lg.gain.value = 0.4; l.connect(lg); lg.connect(g.gain);
      chain(lp, g, G(t, 0.18, 1.4, 0.6 * v), o);
      const f = F('bandpass', 350, 0.8); f.frequency.setValueAtTime(350, T(t)); exp(f.frequency, 1400, t + 0.5); exp(f.frequency, 300, t + 1.5);
      chain(N(t, 1.6), f, G(t, 0.25, 1.3, 0.45 * v), o);
    },
    chomp: (t, v, r, o) => { thump(o, t, 170 * r, 48, 0.28, 0.95 * v); click(o, t, 1900 * r, 3, 0.03, 0.6 * v); click(o, t + 0.035, 1500 * r, 3, 0.03, 0.45 * v); },
    slash: (t, v, r, o) => {
      const f = F('highpass', 1500 * r, 0.9); f.frequency.setValueAtTime(1500 * r, T(t)); exp(f.frequency, 6500 * r, t + 0.15);
      chain(N(t, 0.32), f, G(t, 0.008, 0.26, 0.5 * v), o);
      for (const fr of [2800, 4150]) chain(O('sine', fr * r, t, 0.4), G(t, 0.003, 0.35, 0.07 * v), o);
    },
    rip: (t, v, r, o) => { const g = ctx.createGain(); randAmp(g, t, 0.6, 0.5 * v, 26); chain(N(t, 0.62), F('bandpass', 1300 * r, 0.9), g, o); },
    bells: (t, v, r, o) => {
      [783.99, 659.25, 783.99, 523.25].forEach((f, i) => bell(o, t + i * 0.42, f * r, v,
        [0.5, 1, 1.19, 1.5, 2.0, 2.74, 3.0], [0.05, 0.14, 0.06, 0.04, 0.045, 0.02, 0.012], [2.6, 2.2, 1.6, 1.4, 1.0, 0.6, 0.5]));
    },
    kiss: (t, v, r, o) => {
      click(o, t, 2600, 2, 0.025, 0.5 * v);
      const x = O('sine', 650 * r, t + 0.01, 0.16); x.frequency.linearRampToValueAtTime(1150 * r, T(t) + 0.06); x.frequency.linearRampToValueAtTime(520 * r, T(t) + 0.15);
      chain(x, G(t + 0.01, 0.01, 0.14, 0.22 * v), o);
    },
    confetti: (t, v, r, o) => {
      chain(N(t, 0.1), F('lowpass', 3500), G(t, 0.001, 0.08, 0.7 * v), o); thump(o, t, 220 * r, 80, 0.08, 0.45 * v);
      for (let k = 0; k < 22; k++) click(o, t + 0.05 + rand() * 0.75, 6000, 0.7, 0.008, (0.1 + rand() * 0.15) * v);
    },
    cheer: (t, v, _r, _o) => {
      for (let k = 0; k < 70; k++) {
        const u = rand(), tk = t + u * 1.6, a = Math.sqrt(Math.sin(Math.PI * u)) * 0.22 * v;
        chain(N(tk, 0.03), F('bandpass', 1100 + rand() * 900, 0.8), G(tk, 0.001, 0.012 + rand() * 0.01, a), voice(rand() * 1.6 - 0.8, 0.25));
      }
    },
    clapper: (t, v, _r, o) => {
      click(o, t, 2400, 5, 0.014, 0.95 * v); chain(O('sine', 1100, t, 0.09), G(t, 0.001, 0.06, 0.3 * v), o);
      click(o, t + 0.016, 2000, 5, 0.012, 0.7 * v); thump(o, t, 260, 90, 0.08, 0.4 * v);
    },
    tapeStop: (t, v, r, o) => {
      const x = O('sawtooth', 300 * r, t, 0.6); exp(x.frequency, 40, t + 0.55);
      const f = F('lowpass', 1800, 0.9); f.frequency.setValueAtTime(1800, T(t)); exp(f.frequency, 260, t + 0.55);
      chain(x, f, G(t, 0.01, 0.55, 0.2 * v), o);
    },
    stamp: (t, v, r, o) => { thump(o, t, 150 * r, 45, 0.32, 0.9 * v); chain(N(t, 0.06), F('lowpass', 2200), G(t, 0.001, 0.05, 0.35 * v), o); },
    thud: (t, v, r, o) => { thump(o, t, 95 * r, 36, 0.55, 1.0 * v); chain(N(t, 0.4), F('lowpass', 380), G(t, 0.002, 0.35, 0.5 * v), o); },
    heartbeat: (t, v, r, o) => { thump(o, t, 62 * r, 38, 0.16, 0.95 * v); thump(o, t + 0.24, 58 * r, 36, 0.16, 0.7 * v); },
    drip: (t, v, r, o) => blip(o, t, 1500 * r, 650 * r, 0.16, 0.35 * v),
    tick: (t, v, r, o) => { click(o, t, 5200, 1, 0.006, 0.4 * v); chain(O('sine', 2600 * r, t, 0.04), G(t, 0.001, 0.03, 0.14 * v), o); },
    splash: (t, v, r, o) => {
      const f = F('lowpass', 6500, 0.7); f.frequency.setValueAtTime(6500, T(t)); exp(f.frequency, 700, t + 0.6);
      chain(N(t, 0.8), f, G(t, 0.005, 0.75, 0.65 * v), o);
      for (let k = 0; k < 6; k++) { const tk = t + 0.15 + rand() * 0.55, f0 = 280 + rand() * 300; blip(o, tk, f0 * r, f0 * 2.6 * r, 0.07, 0.15 * v); }
    },
    bubbles: (t, v, r, o) => { for (let k = 0; k < 10; k++) { const tk = t + rand() * 1.0, f0 = 280 + rand() * 300; blip(o, tk, f0 * r, f0 * 2.6 * r, 0.07, 0.2 * v); } },
    magic: (t, v, r, o) => {
      [1046.5, 1318.5, 1568, 2093, 2637, 3136].forEach((f, i) => { const tk = t + i * 0.06; chain(O('triangle', f * r, tk, 0.55), G(tk, 0.002, 0.5, 0.15 * v), o); });
      chain(N(t, 1.1), F('highpass', 6000), G(t, 0.5, 0.6, 0.08 * v), o);
    },
    gulp: (t, v, r, o) => {
      const x = O('sine', 220 * r, t, 0.5); exp(x.frequency, 1100 * r, t + 0.45);
      const g = ctx.createGain(); g.gain.setValueAtTime(0.0001, T(t)); g.gain.exponentialRampToValueAtTime(0.3 * v, T(t) + 0.42); g.gain.linearRampToValueAtTime(0.0001, T(t) + 0.48);
      chain(x, g, o);
      const f = F('bandpass', 400, 1.2); f.frequency.setValueAtTime(400, T(t)); exp(f.frequency, 3000, t + 0.45);
      const g2 = ctx.createGain(); g2.gain.setValueAtTime(0.0001, T(t)); g2.gain.exponentialRampToValueAtTime(0.15 * v, T(t) + 0.42); g2.gain.linearRampToValueAtTime(0.0001, T(t) + 0.48);
      chain(N(t, 0.5), f, g2, o);
    },
    clink: (t, v, r, o) => { bell(o, t, 2700 * r, v, [1, 1.596, 2.267], [0.22, 0.13, 0.09], [0.45, 0.3, 0.2]); click(o, t, 6000, 0.8, 0.004, 0.3 * v); },
    boom: (t, v, r, o) => { thump(o, t, 62 * r, 30, 1.6, 1.0 * v); chain(N(t, 1.4), F('lowpass', 220), G(t, 0.01, 1.3, 0.6 * v), o); },
    whirr: (t, v, r, o) => {
      const g = ctx.createGain(); g.gain.value = 0.55;
      const l = O('sine', 15, t, 1.6), lg = ctx.createGain(); lg.gain.value = 0.45; l.connect(lg); lg.connect(g.gain);
      chain(O('sawtooth', 105 * r, t, 1.6), F('bandpass', 700, 1.5), g, G(t, 0.2, 1.3, 0.3 * v), o);
    },
    twang: (t, v, r, o) => {
      const x = O('triangle', 95 * r, t, 0.75); x.frequency.linearRampToValueAtTime(165 * r, T(t) + 0.08); x.frequency.linearRampToValueAtTime(120 * r, T(t) + 0.7);
      vib(x, 7, 6, t, 0.75); chain(x, F('lowpass', 1600), G(t, 0.002, 0.7, 0.5 * v), o);
    },
    flap: (t, v, _r, o) => chain(N(t, 0.3), F('lowpass', 650), G(t, 0.05, 0.22, 0.45 * v), o),
    boing: (t, v, r, o) => {
      const x = O('sine', 190 * r, t, 0.55); x.frequency.linearRampToValueAtTime(520 * r, T(t) + 0.06); x.frequency.linearRampToValueAtTime(260 * r, T(t) + 0.45);
      const lg = vib(x, 28, 40, t, 0.55); lg.gain.setValueAtTime(40, T(t)); lg.gain.linearRampToValueAtTime(2, T(t) + 0.5);
      chain(x, G(t, 0.002, 0.5, 0.33 * v), o);
    },
    inflate: (t, v, r, o) => {
      const x = O('square', 300 * r, t, 0.3); x.frequency.linearRampToValueAtTime(900 * r, T(t) + 0.25); vib(x, 22, 40, t, 0.3);
      chain(x, F('lowpass', 1500), G(t, 0.01, 0.25, 0.16 * v), o);
    },
    jingle: (t, v, _r, o) => { for (let k = 0; k < 7; k++) { const tk = t + k * 0.045 + rand() * 0.02; chain(O('sine', 3000 + rand() * 3500, tk, 0.3), G(tk, 0.001, 0.12 + rand() * 0.12, 0.12 * v), o); click(o, tk, 7000, 0.8, 0.003, 0.1 * v); } },
    clank: (t, v, r, o) => { click(o, t, 2600 * r, 6, 0.03, 0.7 * v); bell(o, t, 880 * r, v, [1, 1.58, 2.62], [0.25, 0.18, 0.1], [0.22, 0.16, 0.1]); thump(o, t, 120, 60, 0.1, 0.4 * v); },
    shatter: (t, v, _r, o) => {
      chain(N(t, 0.45), F('highpass', 2800), G(t, 0.001, 0.4, 0.75 * v), o); thump(o, t, 140, 60, 0.12, 0.4 * v);
      for (let k = 0; k < 26; k++) { const tk = t + rand() * 0.75; chain(O('sine', 3000 + rand() * 6000, tk, 0.3), G(tk, 0.0005, 0.05 + rand() * 0.2, (0.06 + rand() * 0.1) * v), o); }
    },
    crash: (t, v, r, o) => {
      for (let k = 0; k < 6; k++) { const tk = t + k * 0.11 + rand() * 0.05; thump(o, tk, (110 - k * 8) * r, 40, 0.25, (0.7 - k * 0.08) * v); chain(N(tk, 0.2), F('bandpass', 700 + rand() * 600, 1.1), G(tk, 0.002, 0.18, 0.35 * v), o); }
      chain(N(t, 1.1), F('lowpass', 300), G(t, 0.01, 1.0, 0.4 * v), o);
    },
    gunCock: (t, v, _r, o) => { click(o, t, 3200, 5, 0.012, 0.7 * v); chain(O('sine', 1900, t, 0.06), G(t, 0.001, 0.05, 0.2 * v), o); click(o, t + 0.16, 2600, 5, 0.012, 0.8 * v); chain(O('sine', 1350, t + 0.16, 0.06), G(t + 0.16, 0.001, 0.05, 0.22 * v), o); },
    gunshot: (t, v, _r, o) => {
      chain(N(t, 0.4), F('lowpass', 9000), G(t, 0.0007, 0.28, 1.0 * v), o); thump(o, t, 140, 42, 0.32, 0.9 * v);
      chain(N(t, 1.0), F('lowpass', 900), G(t, 0.02, 0.9, 0.25 * v), o);
    },
    echo: (t, v, r, o) => { // 「回响」：一声铜锣，延迟正好一拍（0.51 秒），回声自己落在后面的拍子上
      const src = ctx.createGain();
      bell(src, t, 196 * r, v, [1, 2.014, 2.988, 4.49], [0.35, 0.18, 0.11, 0.05], [1.5, 1.1, 0.8, 0.5]);
      const d = ctx.createDelay(2); d.delayTime.value = 0.51064;
      const fb = ctx.createGain(); fb.gain.value = 0.5; const lp = F('lowpass', 2500);
      src.connect(o); src.connect(d); d.connect(lp); lp.connect(fb); fb.connect(d); lp.connect(o);
    },
    firework: (t, v, r, o) => {
      const w = O('sine', 1400 * r, t - 0.65, 0.65); exp(w.frequency, 2600 * r, t - 0.05); chain(w, G(t - 0.65, 0.1, 0.55, 0.06 * v), o);
      chain(N(t, 0.4), F('lowpass', 3800), G(t, 0.001, 0.35, 0.7 * v), o); thump(o, t, 90, 40, 0.3, 0.5 * v);
      for (let k = 0; k < 24; k++) click(o, t + 0.08 + rand() * 0.8, 5000, 0.7, 0.01, (0.05 + rand() * 0.12) * v);
    },
    step: (t, v, _r, o) => { chain(N(t, 0.08), F('lowpass', 900), G(t, 0.002, 0.07, 0.35 * v), o); thump(o, t, 115, 60, 0.07, 0.3 * v); },
    quill: (t, v, r, o) => { const g = ctx.createGain(); randAmp(g, t, 0.7, 0.4 * v, 30); chain(N(t, 0.72), F('bandpass', 4200 * r, 2.5), g, o); },
    splat: (t, v, _r, o) => { chain(N(t, 0.18), F('lowpass', 1300), G(t, 0.002, 0.16, 0.6 * v), o); thump(o, t, 320, 75, 0.12, 0.4 * v); },
    creak: (t, v, r, o) => {
      const x = O('sawtooth', 130 * r, t, 0.8);
      for (let k = 1; k < 16; k++) x.frequency.setValueAtTime(130 * r * (0.9 + rand() * 0.25), T(t) + k * 0.05);
      const g = ctx.createGain(); randAmp(g, t, 0.8, 0.25 * v, 16);
      chain(x, F('bandpass', 950, 7), g, o);
    },
  };

  for (const c of cues) {
    const fn = R[c.s];
    if (!fn) throw new Error(`[sfx] 未知音效：${c.s}`);
    fn(c.t, c.v ?? 1, c.r ?? 1, voice(c.p ?? 0, WET[c.s] ?? 0.15));
  }
  return ctx.startRendering();
}

/** AudioBuffer → 16 位 PCM WAV（导出给出片工具编码用） */
export function wavBlob(buf: AudioBuffer): Blob {
  const ch = buf.numberOfChannels, len = buf.length, sr = buf.sampleRate;
  const out = new DataView(new ArrayBuffer(44 + len * ch * 2));
  const ws = (o: number, s: string) => { for (let i = 0; i < s.length; i++) out.setUint8(o + i, s.charCodeAt(i)); };
  ws(0, 'RIFF'); out.setUint32(4, 36 + len * ch * 2, true); ws(8, 'WAVE'); ws(12, 'fmt ');
  out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, ch, true); out.setUint32(24, sr, true);
  out.setUint32(28, sr * ch * 2, true); out.setUint16(32, ch * 2, true); out.setUint16(34, 16, true); ws(36, 'data'); out.setUint32(40, len * ch * 2, true);
  const data = Array.from({ length: ch }, (_, i) => buf.getChannelData(i));
  let o = 44;
  for (let i = 0; i < len; i++) for (let c = 0; c < ch; c++) { const s = Math.max(-1, Math.min(1, data[c][i])); out.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true); o += 2; }
  return new Blob([out], { type: 'audio/wav' });
}
