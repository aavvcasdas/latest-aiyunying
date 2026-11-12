// @ts-nocheck
// 节拍：由原曲（仓库根目录 反乌托邦.mp4 的音轨）实测。
// 谱通量自相关 → 122.0 BPM（拍长 0.4918 秒），相位 0.076 秒；每 15 秒一窗复核，最大漂移 ±0.012 秒，全程稳定。
// 低频能量最强的拍落在第 2、6、10…拍（重拍 = 1.060 + 1.967n 秒）。env 是 8Hz 的低频能量包络（0–1）。
import B from './data/beats.json';
import { clamp } from './core';

export const BPM = B.bpm, PER = 60 / B.bpm, PH = B.phase;
export const beatK = (t) => Math.floor((t - PH) / PER);
export const beatT = (k) => PH + k * PER;
export const isDown = (k) => (((k - 2) % 4) + 4) % 4 === 0;
/** 最近一拍之后的衰减脉冲（0–1） */
export const pulse = (t) => { if (t < 0.5) return 0; const k = beatK(t); return Math.exp(-(t - beatT(k)) / 0.16); };
/** 最近一个重拍之后的衰减脉冲 */
export const dpulse = (t) => { if (t < 0.5) return 0; let k = beatK(t); for (let i = 0; i < 4 && !isDown(k); i++) k--; return Math.exp(-(t - beatT(k)) / 0.22); };
export const energy = (t) => B.env[clamp(Math.floor(t * B.envHz), 0, B.env.length - 1)] || 0;
