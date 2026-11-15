import * as THREE from 'three';

export const PI = Math.PI;
export const TAU = Math.PI * 2;

export const clamp = (v: number, lo = 0, hi = 1) => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const seg = (u: number, a: number, b: number) => clamp((u - a) / Math.max(1e-6, b - a));
export const range = (t: number, a: number, b: number) => clamp((t - a) / Math.max(1e-6, b - a));
export const smooth = (t: number) => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};
export const ease = (t: number) => {
  const x = clamp(t);
  return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
};
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
export const easeIn = (t: number) => Math.pow(clamp(t), 3);
export const backOut = (t: number, s = 1.70158) => {
  const x = clamp(t) - 1;
  return 1 + (s + 1) * x * x * x + s * x * x;
};
export const hash = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return s - Math.floor(s);
};
export const many = <T,>(n: number, f: (i: number) => T): T[] =>
  Array.from({ length: n }, (_, i) => f(i));

export type Vec3 = [number, number, number];

export interface Cam {
  pos: Vec3;
  look: Vec3;
  fov: number;
  roll?: number;
}

export const cam = (pos: Vec3, look: Vec3, fov = 40, roll = 0): Cam => ({
  pos,
  look,
  fov,
  roll,
});

export const mixCam = (a: Cam, b: Cam, t: number): Cam => ({
  pos: [lerp(a.pos[0], b.pos[0], t), lerp(a.pos[1], b.pos[1], t), lerp(a.pos[2], b.pos[2], t)],
  look: [lerp(a.look[0], b.look[0], t), lerp(a.look[1], b.look[1], t), lerp(a.look[2], b.look[2], t)],
  fov: lerp(a.fov, b.fov, t),
  roll: lerp(a.roll ?? 0, b.roll ?? 0, t),
});

export const glide = (a: Cam, b: Cam, u: number): Cam => mixCam(a, b, ease(u));

export const shakeCam = (c: Cam, T: number, amp: number, freq = 34): Cam => ({
  pos: [
    c.pos[0] + Math.sin(T * freq) * amp,
    c.pos[1] + Math.cos(T * freq * 1.17) * amp * 0.8,
    c.pos[2],
  ],
  look: [
    c.look[0] + Math.sin(T * freq * 0.85 + 1.3) * amp * 0.4,
    c.look[1] + Math.cos(T * freq * 1.07 + 0.5) * amp * 0.35,
    c.look[2],
  ],
  fov: c.fov,
  roll: (c.roll ?? 0) + Math.sin(T * freq * 0.7) * amp * 0.25,
});

// Measured from 不小心惹了上帝.WAV: 102.39 BPM, beat period = 0.5860s, phase = 0.300s
export const SONG_DURATION = 24.8686;
export const BEAT_PERIOD = 0.586;
export const BEAT_FIRST = 0.300;
export const BPM = 60 / BEAT_PERIOD;

export interface Beat {
  idx: number;
  bar: number;
  inBar: number;
  frac: number;
  pulse: number; // sharp 1 -> 0 decay right on every beat
  down: boolean; // true on bar downbeat
  halfPulse: number; // eighth-note pulse
}

export function beatAt(t: number): Beat {
  const shifted = t - BEAT_FIRST;
  const fBeat = shifted / BEAT_PERIOD;
  const idx = Math.floor(fBeat);
  const frac = ((fBeat % 1) + 1) % 1;
  const bar = Math.floor(idx / 4);
  const inBar = ((idx % 4) + 4) % 4;
  const pulse = Math.exp(-frac * 5.2);
  const hFrac = (((shifted / (BEAT_PERIOD * 0.5)) % 1) + 1) % 1;
  const halfPulse = Math.exp(-hFrac * 5.8);
  return {
    idx,
    bar,
    inBar,
    frac,
    pulse,
    down: inBar === 0,
    halfPulse,
  };
}

export const beatSq = (bt: Beat, amt = 0.08) => bt.pulse * amt * (bt.down ? 1.15 : 0.7);

export const rgb = (hex: number) => {
  const c = new THREE.Color(hex);
  return new THREE.Vector3(c.r, c.g, c.b);
};
