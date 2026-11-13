import { useCallback, useEffect, useRef, useState } from "react";
import songUrl from "@/assets/song.m4a";
import { CUES } from "@/data/cues";
import type { Anchor } from "@/lib/mv";
import { SONG_DURATION, clamp, detectVocalOnset, fitCalibration } from "@/lib/mv";

export type FrameFn = (modelTime: number, energy: number, playing: boolean) => void;

export interface MVPlayer {
  audioRef: React.RefObject<HTMLAudioElement | null>;
  src: string;
  playing: boolean;
  ready: boolean;
  audioOk: boolean;
  mode: "audio" | "silent";
  duration: number;
  cueIndex: number;
  uiTime: number;
  energy: number;
  offset: number;
  rate: number;
  anchors: Anchor[];
  aligning: boolean;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  seek: (modelTime: number) => void;
  stepCue: (d: number) => void;
  setOffset: (v: number) => void;
  setRate: (v: number) => void;
  addAnchorHere: () => void;
  clearAnchors: () => void;
  autoAlign: () => Promise<void>;
  resetCalibration: () => void;
  renderMode: boolean;
  setRenderFrame: (t: number, energy: number) => void;
  getTime: () => number;
  getEnergy: () => number;
  subscribe: (fn: FrameFn) => () => void;
  volume: number;
  setVolume: (v: number) => void;
}

/** 找不到音频时的兜底节拍（76 BPM 的假能量），画面照样跳 */
function fakeEnergy(t: number) {
  const beat = (t * 76) / 60;
  const p = beat - Math.floor(beat);
  return 0.18 + 0.34 * Math.pow(1 - p, 3);
}

export function useMVPlayer(): MVPlayer {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const bufRef = useRef<Uint8Array | null>(null);
  const subs = useRef<Set<FrameFn>>(new Set());

  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [audioOk, setAudioOk] = useState(true);
  const [duration, setDuration] = useState(SONG_DURATION);
  const [cueIndex, setCueIndex] = useState(0);
  const [uiTime, setUiTime] = useState(0);
  const [energy, setEnergy] = useState(0);
  const [offset, setOffsetState] = useState(0);
  const [rate, setRateState] = useState(1);
  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [aligning, setAligning] = useState(false);
  const [volume, setVolumeState] = useState(0.9);

  const timeRef = useRef(0);
  const energyRef = useRef(0);
  const offsetRef = useRef(0);
  const rateRef = useRef(1);
  const playingRef = useRef(false);
  const audioOkRef = useRef(true);
  const lastFrame = useRef(0);
  const lastSec = useRef(-1);
  const lastCue = useRef(-1);

  offsetRef.current = offset;
  rateRef.current = rate;
  playingRef.current = playing;
  audioOkRef.current = audioOk;

  const realToModel = useCallback((real: number) => (real - offsetRef.current) / rateRef.current, []);
  const modelToReal = useCallback((model: number) => offsetRef.current + model * rateRef.current, []);

  /**
   * 渲染模式（?render=1）：时间轴上不再跟音频元素走，由外部时钟逐帧设定。
   * 出片时一帧一帧地要，求出来的画面是确定的，不会因为掉帧跳镜。
   */
  const [renderMode] = useState(() => new URLSearchParams(window.location.search).has("render"));
  const renderModeRef = useRef(renderMode);
  renderModeRef.current = renderMode;

  /** 外部时钟推进一帧：只写时间/能量并广播，不碰音频元素 */
  const setRenderFrame = useCallback((t: number, e: number) => {
    timeRef.current = t;
    energyRef.current = e;
    lastSec.current = -1; // 强制下一帧把 uiTime / 光标推给界面
    subs.current.forEach((fn) => fn(t, e, true));
  }, []);

  /**
   * 出片用的能量包络：把整首歌离线解一遍，按 100Hz 算 RMS，
   * 再套和实时 analyser 同一套「快起慢落」，逐帧查表。
   * （实时 analyser 跟机器负载有关，录出来每遍都不一样；出片必须确定。）
   */
  const envRef = useRef<Float32Array | null>(null);
  const envBuild = useCallback(async () => {
    const a = audioRef.current;
    const src = a?.src || songUrl;
    if (!src) return;
    try {
      const res = await fetch(src);
      const buf = await res.arrayBuffer();
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctor();
      const audio = await ctx.decodeAudioData(buf);
      const data = audio.getChannelData(0);
      const sr = audio.sampleRate;
      const hop = Math.max(1, Math.round(sr / 100));
      const n = Math.floor(data.length / hop);
      const env = new Float32Array(n);
      let prev = 0;
      for (let i = 0; i < n; i++) {
        let sum = 0;
        const off = i * hop;
        for (let k = 0; k < hop; k++) {
          const v = data[off + k];
          sum += v * v;
        }
        const target = Math.min(1, Math.sqrt(sum / hop) * 3.4);
        prev = target > prev ? target : prev * 0.979; // 快起慢落（≈ 每 10ms 衰减到 97.9%）
        env[i] = prev;
      }
      envRef.current = env;
      void ctx.close();
    } catch {
      envRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (renderModeRef.current) void envBuild();
  }, [envBuild]);

  const envAt = useCallback((t: number) => {
    const env = envRef.current;
    if (!env || env.length === 0) return 0;
    const i = Math.round(t * 100);
    return env[Math.max(0, Math.min(env.length - 1, i))];
  }, []);

  const getTime = useCallback(() => timeRef.current, []);
  const getEnergy = useCallback(() => energyRef.current, []);
  const subscribe = useCallback((fn: FrameFn) => {
    subs.current.add(fn);
    return () => {
      subs.current.delete(fn);
    };
  }, []);

  /* ---------------- Web Audio：拿真实能量做卡点 ---------------- */
  const ensureGraph = useCallback(() => {
    const a = audioRef.current;
    if (!a || ctxRef.current) return;
    try {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctor();
      const src = ctx.createMediaElementSource(a);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.6;
      src.connect(analyser);
      analyser.connect(ctx.destination);
      ctxRef.current = ctx;
      analyserRef.current = analyser;
      bufRef.current = new Uint8Array(analyser.fftSize);
    } catch {
      analyserRef.current = null;
    }
  }, []);

  const play = useCallback(() => {
    const a = audioRef.current;
    ensureGraph();
    if (ctxRef.current?.state === "suspended") void ctxRef.current.resume();
    if (a && audioOkRef.current) {
      const p = a.play();
      if (p && typeof p.then === "function") {
        p.then(() => setPlaying(true)).catch(() => {
          setAudioOk(false);
          setPlaying(true);
        });
        return;
      }
    }
    setPlaying(true);
  }, [ensureGraph]);

  const pause = useCallback(() => {
    const a = audioRef.current;
    if (a && audioOkRef.current) a.pause();
    setPlaying(false);
  }, []);

  const toggle = useCallback(() => (playingRef.current ? pause() : play()), [pause, play]);

  const seek = useCallback(
    (modelTime: number) => {
      const t = clamp(modelTime, 0, duration);
      timeRef.current = t;
      const a = renderModeRef.current ? null : audioRef.current;
      if (a && audioOkRef.current) {
        try {
          a.currentTime = clamp(modelToReal(t), 0, Math.max(0.1, a.duration || duration));
        } catch {
          /* 有些浏览器在元数据没就绪时不让设，忽略 */
        }
      }
      lastSec.current = -1;
      setUiTime(t);
    },
    [duration, modelToReal],
  );

  const stepCue = useCallback(
    (d: number) => {
      const target = clamp(cueIndex + d, 0, CUES.length - 1);
      seek(CUES[target].start + 0.01);
    },
    [cueIndex, seek],
  );

  const setOffset = useCallback((v: number) => {
    setOffsetState(v);
    offsetRef.current = v;
  }, []);
  const setRate = useCallback((v: number) => {
    setRateState(v);
    rateRef.current = v;
  }, []);

  /** 把「现在这一句」钉在真实音频的当前位置上 */
  const addAnchorHere = useCallback(() => {
    const a = audioRef.current;
    const real = a && audioOkRef.current ? a.currentTime : timeRef.current;
    const model = CUES[cueIndex]?.start ?? timeRef.current;
    if (!Number.isFinite(real)) return;
    const next = [...anchors, { model, real }];
    setAnchors(next);
    const fit = fitCalibration(next);
    setOffset(fit.offset);
    setRate(fit.rate);
    offsetRef.current = fit.offset;
    rateRef.current = fit.rate;
  }, [anchors, audioOk, cueIndex]);

  const clearAnchors = useCallback(() => setAnchors([]), []);
  const resetCalibration = useCallback(() => {
    setAnchors([]);
    setOffset(0);
    setRate(1);
    offsetRef.current = 0;
    rateRef.current = 1;
  }, []);

  /** 解码音频，找「人声进来」那一刻，自动对到第一句 */
  const autoAlign = useCallback(async () => {
    const a = audioRef.current;
    if (!a) return;
    setAligning(true);
    try {
      const res = await fetch(a.src);
      const buf = await res.arrayBuffer();
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctor();
      const audio = await ctx.decodeAudioData(buf);
      const onset = detectVocalOnset(audio);
      void ctx.close();
      const firstSung = CUES.find((c) => c.text);
      // 只在「前奏长度合理」时才敢自动改轴：这首歌第一句在规划轴的 11.6s，
      // 真实人声落在 5–24s 之间才认，否则保持手动校准。
      if (onset != null && firstSung && onset > 5 && onset < 24) {
        const o = Number((onset - firstSung.start).toFixed(2));
        setOffset(o);
        offsetRef.current = o;
        setAnchors([{ model: firstSung.start, real: onset }]);
      }
    } catch {
      /* 解码不了就保持手动校准 */
    } finally {
      setAligning(false);
    }
  }, []);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    if (audioRef.current) audioRef.current.volume = v;
  }, []);

  /* ---------------- 主循环 ---------------- */
  useEffect(() => {
    let raf = 0;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const a = audioRef.current;
      const dt = lastFrame.current ? Math.min(0.12, (now - lastFrame.current) / 1000) : 0.016;
      lastFrame.current = now;

      let model = timeRef.current;
      if (renderModeRef.current) {
        // 出片：时间只认外部时钟，音频元素一概不碰
      } else if (a && audioOkRef.current && !a.paused && Number.isFinite(a.currentTime)) {
        model = realToModel(a.currentTime);
      } else if (playingRef.current) {
        model = timeRef.current + dt; // 无声样片模式
      }
      if (model >= duration) {
        model = duration;
        if (playingRef.current && !(a && audioOkRef.current)) setPlaying(false);
      }
      timeRef.current = model;

      // 能量
      let e = energyRef.current;
      if (renderModeRef.current) {
        e = envAt(model);
        energyRef.current = e;
      } else {
        const an = analyserRef.current;
        if (an && bufRef.current && playingRef.current) {
          an.getByteTimeDomainData(bufRef.current as Uint8Array<ArrayBuffer>);
          let sum = 0;
          for (let i = 0; i < bufRef.current.length; i++) {
            const v = (bufRef.current[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / bufRef.current.length);
          const target = clamp(rms * 3.4);
          e = target > e ? target : e * 0.88; // 快起慢落
        } else if (playingRef.current) {
          e = fakeEnergy(model);
        } else {
          e *= 0.9;
        }
        energyRef.current = e;
      }

      subs.current.forEach((fn) => fn(model, e, playingRef.current));

      const sec = Math.floor(model * 4);
      if (sec !== lastSec.current) {
        lastSec.current = sec;
        setUiTime(model);
        setEnergy(e);
      }
      let idx = 0;
      for (let i = 0; i < CUES.length; i++) {
        if (model >= CUES[i].start) idx = i;
        else break;
      }
      if (idx !== lastCue.current) {
        lastCue.current = idx;
        setCueIndex(idx);
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [duration, realToModel]);

  /* ---------------- 音频元素事件 ---------------- */
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = volume;
    const onReady = () => {
      setReady(true);
      if (Number.isFinite(a.duration) && a.duration > 1) setDuration(a.duration);
    };
    const onErr = () => {
      setAudioOk(false);
      audioOkRef.current = false;
      setReady(true);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnd = () => setPlaying(false);
    a.addEventListener("loadedmetadata", onReady);
    a.addEventListener("canplay", onReady);
    a.addEventListener("error", onErr);
    a.addEventListener("play", onPlay);
    a.addEventListener("pause", onPause);
    a.addEventListener("ended", onEnd);
    if (a.readyState >= 1) onReady();
    return () => {
      a.removeEventListener("loadedmetadata", onReady);
      a.removeEventListener("canplay", onReady);
      a.removeEventListener("error", onErr);
      a.removeEventListener("play", onPlay);
      a.removeEventListener("pause", onPause);
      a.removeEventListener("ended", onEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    audioRef,
    src: songUrl,
    playing,
    ready,
    audioOk,
    mode: audioOk ? "audio" : "silent",
    duration,
    cueIndex,
    uiTime,
    energy,
    offset,
    rate,
    anchors,
    aligning,
    play,
    pause,
    toggle,
    seek,
    stepCue,
    setOffset,
    setRate,
    addAnchorHere,
    clearAnchors,
    autoAlign,
    resetCalibration,
    renderMode,
    setRenderFrame,
    getTime,
    getEnergy,
    subscribe,
    volume,
    setVolume,
  };
}
