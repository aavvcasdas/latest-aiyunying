// 时间轴：41 句歌词的起点派生出 51 个镜头的切点。
//   序章 I1–I3        第一句开口之前，三段
//   L01–L16           主歌一 + 副歌一，一句一镜，切点 = 这一句起点 − 2 帧
//   间奏 N1–N3        第 16 句结束到第 17 句开口之间三等分
//   L17–L32           主歌二 + 副歌二
//   桥段 B1–B3        第 32 句结束到「所以」之间三等分
//   L33–L41           末段副歌（「所以」单独一镜）
//   OUT               最后一句结束后 0.15 秒起，到音频结束
import cuesJson from './cues.json';
import type { CastId } from './atlas';
import type { Ctx, Look } from './kit';

export const FPS = 30;
export const LEAD = 2 / FPS;

export interface Cue { text: string; start: number; end: number; lrc_start: number; delta: number; beat_index: number }
export interface CueFile { measured: boolean; method: string; beat: { period: number; first: number; bpm: number; bar: number }; audio_duration: number; lines: Cue[]; summary: { lines: number; mean_abs_delta: number; max_abs_delta: number } }
export const CUES = cuesJson as CueFile;
export const LINES = CUES.lines;
export const DURATION = CUES.audio_duration;
export const BEAT = CUES.beat;

export type Section = '序章' | '主歌一' | '副歌一' | '间奏' | '主歌二' | '副歌二' | '桥段' | '副歌三' | '尾声';

export interface Beat { idx: number; phase: number; pulse: number; down: boolean; n: number }
export function beatAt(T: number): Beat {
  const idx = (T - BEAT.first) / BEAT.period;
  const fl = Math.floor(idx), phase = idx - fl;
  // 歌词都落在 beat_index ≡ 1 (mod 4) 上，所以小节头取 (fl-1) % 4 === 0
  const down = (((fl - 1) % 4) + 4) % 4 === 0;
  return { idx, phase, pulse: Math.exp(-phase * 5), down, n: fl };
}

export interface Frame {
  ctx: Ctx;
  T: number;      // 全片绝对秒
  t: number;      // 镜头内秒
  u: number;      // 镜头进度 0–1
  dur: number;    // 镜头时长
  bt: Beat;
  line: number;   // 正在唱的句号（0 起），没有在唱为 -1
  lineU: number;  // 这一句唱到的进度 0–1
  shotBeat: number; // 镜头开始以来经过的拍数（含小数）
}

export interface ShotFx { flashIn?: boolean; fadeIn?: number; fadeOut?: number; title?: boolean; whiteOut?: number; whiteIn?: number }
export interface ShotDef {
  id: string;
  section: Section;
  title: string;
  cast: CastId[];
  note: string;
  look: Look;
  fx?: ShotFx;
  draw: (f: Frame) => void;
}
export interface Shot extends ShotDef { start: number; end: number; cue: number }

export function planShots(defs: ShotDef[]): Shot[] {
  const s = LINES.map((l) => l.start), e = LINES.map((l) => l.end);
  if (s.length !== 41) throw new Error(`[勾指起誓] 排镜规则按 41 句歌词写死，收到 ${s.length} 句`);
  const raw: { id: string; a: number; cue: number }[] = [];
  const push = (id: string, a: number, cue = -1) => raw.push({ id, a, cue });
  const pad = (n: number) => String(n).padStart(2, '0');
  const t0 = s[0] - LEAD;
  push('I1', 0); push('I2', t0 * 0.345); push('I3', t0 * 0.665);
  for (let c = 0; c < 16; c++) push(`L${pad(c + 1)}`, s[c] - LEAD, c);
  const n0 = e[15] + 0.05, n1 = s[16] - LEAD;
  push('N1', n0); push('N2', n0 + (n1 - n0) / 3); push('N3', n0 + ((n1 - n0) * 2) / 3);
  for (let c = 16; c < 32; c++) push(`L${pad(c + 1)}`, s[c] - LEAD, c);
  const b0 = e[31] + 0.05, b1 = s[32] - LEAD;
  push('B1', b0); push('B2', b0 + (b1 - b0) / 3); push('B3', b0 + ((b1 - b0) * 2) / 3);
  for (let c = 32; c < 41; c++) push(`L${pad(c + 1)}`, s[c] - LEAD, c);
  push('OUT', e[40] + 0.15);
  const byId = new Map(defs.map((d) => [d.id, d]));
  const shots: Shot[] = raw.map((r, i) => {
    const d = byId.get(r.id);
    if (!d) throw new Error(`排镜引用了不存在的镜头 ${r.id}`);
    const start = Math.round(r.a * FPS) / FPS;
    const end = i + 1 < raw.length ? Math.round(raw[i + 1].a * FPS) / FPS : DURATION;
    return { ...d, start, end, cue: r.cue };
  });
  const used = new Set(raw.map((r) => r.id));
  for (const d of defs) if (!used.has(d.id)) throw new Error(`注册了却没用上的镜头 ${d.id}`);
  return shots;
}

export function shotAt(shots: Shot[], T: number): number {
  let lo = 0, hi = shots.length - 1;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (shots[mid].start <= T) lo = mid; else hi = mid - 1; }
  return lo;
}
export function lineAt(T: number): { line: number; lineU: number } {
  for (let i = 0; i < LINES.length; i++) { const l = LINES[i]; if (T >= l.start && T < l.end) return { line: i, lineU: (T - l.start) / (l.end - l.start) }; }
  return { line: -1, lineU: 0 };
}
export const fmt = (t: number) => { const m = Math.floor(t / 60), s = t - m * 60; return `${m}:${s.toFixed(2).padStart(5, '0')}`; };
