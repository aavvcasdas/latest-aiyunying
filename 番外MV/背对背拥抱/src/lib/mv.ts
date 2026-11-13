import type { CharId } from "@/data/cast";

/* ------------------------------------------------------------------ *
 * 画面：three.js 搭的立体世界 + 图集像素纸片人；画在 1600×900 的胶片框里再整体贴屏。
 * 世界单位：人身高约 1.7，脚底 y = 0。
 * ------------------------------------------------------------------ */
export const FW = 1600;
/** 出片帧率。渲染模式（?render=1）按这个固定步进，不跟浏览器刷新率走。 */
export const FPS = 30;
export const FH = 900;
export const SONG_DURATION = 234.917;

/* ---------------- 光照预设（沿用模板 kit.ts 的 LOOKS 口径，另加 ember / dawn） ---------------- */
export type LookId = "dusk" | "golden" | "night" | "ember" | "magic" | "rainEve" | "afterRain" | "dawn" | "sea" | "stage";
export type SetId = "shore" | "hill" | "ring" | "sea";
export type FxKind = "petal" | "ember" | "heart" | "ring" | "note" | "star" | "rain" | "bubble" | "butterfly" | "smoke" | "leaf" | "spark" | "slip";

export interface Look {
  id: LookId;
  name: string;
  top: number;
  hor: number;
  low: number;
  fog: [number, number];
  sun: number;
  sunI: number;
  dir: [number, number, number];
  amb: number;
  ambI: number;
  ground: number;
  far: number;
  stars: number;
  orb: "sun" | "moon" | "none";
  ambient: FxKind | "none";
  /** HUD 用的 css 色 */
  light: string;
  ink: string;
  paper: string;
  swatch: [string, string, string];
}

const L = (o: Look) => o;
export const LOOKS: Record<LookId, Look> = {
  dusk: L({ id: "dusk", name: "黄昏", top: 0x7d3a94, hor: 0xff8f6b, low: 0x4a3463, fog: [40, 300], sun: 0xffa27a, sunI: 2.4, dir: [0.6, 0.4, 0.5], amb: 0x8f6fd8, ambI: 1.5, ground: 0x6f5f93, far: 0x5a3f7a, stars: 0.35, orb: "sun", ambient: "petal", light: "#ffbe7d", ink: "#221a3d", paper: "#ffe0d6", swatch: ["#7d3a94", "#ff8f6b", "#6f5f93"] }),
  golden: L({ id: "golden", name: "暖午后", top: 0xf2915f, hor: 0xffd9a0, low: 0x7a5a3a, fog: [35, 280], sun: 0xffb36b, sunI: 2.8, dir: [-0.7, 0.36, 0.35], amb: 0x8f7fd0, ambI: 1.4, ground: 0x86b86f, far: 0xb07a7a, stars: 0, orb: "sun", ambient: "petal", light: "#ffe08a", ink: "#2b3a2c", paper: "#ffe8cf", swatch: ["#f2915f", "#ffd9a0", "#86b86f"] }),
  night: L({ id: "night", name: "夜", top: 0x0a1036, hor: 0x39408f, low: 0x141a3a, fog: [30, 230], sun: 0xb4c8ff, sunI: 2.1, dir: [-0.4, 0.75, 0.5], amb: 0x5f6ac8, ambI: 1.7, ground: 0x2e3a6e, far: 0x252c62, stars: 1, orb: "moon", ambient: "star", light: "#9fb6ff", ink: "#0b0f28", paper: "#d4dcff", swatch: ["#0a1036", "#39408f", "#2e3a6e"] }),
  ember: L({ id: "ember", name: "烽火", top: 0x2b1330, hor: 0xe0663f, low: 0x3a1d2a, fog: [26, 180], sun: 0xff8a4d, sunI: 2.9, dir: [0.1, 0.35, 0.7], amb: 0xa05a5a, ambI: 1.3, ground: 0x5a2f3f, far: 0x4a1f33, stars: 0, orb: "sun", ambient: "ember", light: "#ff9357", ink: "#26101c", paper: "#ffd9c0", swatch: ["#2b1330", "#e0663f", "#5a2f3f"] }),
  magic: L({ id: "magic", name: "紫色魔法", top: 0x2c1763, hor: 0xb960d6, low: 0x2a1850, fog: [25, 200], sun: 0xf3b6ff, sunI: 2.0, dir: [0.4, 0.7, 0.6], amb: 0x7a5fd8, ambI: 1.5, ground: 0x3d2a6e, far: 0x432a7d, stars: 0.7, orb: "moon", ambient: "star", light: "#d9a6ff", ink: "#1b1040", paper: "#f0dcff", swatch: ["#2c1763", "#b960d6", "#3d2a6e"] }),
  rainEve: L({ id: "rainEve", name: "雨夜", top: 0x27386b, hor: 0x6d86b5, low: 0x26304e, fog: [18, 120], sun: 0xbfd0ff, sunI: 1.6, dir: [-0.3, 0.8, 0.5], amb: 0x7f93cc, ambI: 1.9, ground: 0x3b4664, far: 0x2b3550, stars: 0, orb: "none", ambient: "rain", light: "#93a7cc", ink: "#121829", paper: "#dfe6ff", swatch: ["#27386b", "#6d86b5", "#3b4664"] }),
  afterRain: L({ id: "afterRain", name: "雨后", top: 0x5fb0ee, hor: 0xfff1d6, low: 0x5a7a66, fog: [45, 340], sun: 0xfff4d6, sunI: 2.6, dir: [0.5, 0.75, 0.5], amb: 0xc4dcff, ambI: 1.7, ground: 0x7fc08a, far: 0x8fb3c9, stars: 0, orb: "sun", ambient: "bubble", light: "#cdeeff", ink: "#25402f", paper: "#ffffff", swatch: ["#5fb0ee", "#fff1d6", "#7fc08a"] }),
  dawn: L({ id: "dawn", name: "天亮", top: 0x3f5f9e, hor: 0xffb98c, low: 0x5a6a5a, fog: [40, 320], sun: 0xffd7a1, sunI: 2.6, dir: [0.0, 0.4, 0.8], amb: 0xa8a0d8, ambI: 1.6, ground: 0x8fbf8a, far: 0xa98fb5, stars: 0.1, orb: "sun", ambient: "petal", light: "#ffd7a1", ink: "#3a2b3f", paper: "#fff2dc", swatch: ["#3f5f9e", "#ffb98c", "#8fbf8a"] }),
  sea: L({ id: "sea", name: "水下", top: 0x0d4f8f, hor: 0x2aa3c8, low: 0x0b3f57, fog: [3, 46], sun: 0xb8f2ff, sunI: 1.9, dir: [0.1, 1, 0.2], amb: 0x3a9fd0, ambI: 1.7, ground: 0x3a8a92, far: 0x0b4a6b, stars: 0, orb: "sun", ambient: "bubble", light: "#8ff0e6", ink: "#04202f", paper: "#c4ecff", swatch: ["#0d4f8f", "#2aa3c8", "#3a8a92"] }),
  stage: L({ id: "stage", name: "舞台", top: 0x160d1c, hor: 0x4a2233, low: 0x1a1029, fog: [18, 110], sun: 0xffe2b0, sunI: 2.6, dir: [0.2, 0.8, 0.8], amb: 0x7a5568, ambI: 1.3, ground: 0x3a2644, far: 0x2b1a44, stars: 0, orb: "none", ambient: "note", light: "#ffd166", ink: "#150c26", paper: "#fff0dc", swatch: ["#160d1c", "#4a2233", "#3a2644"] }),
};

export const SET_OF_LOOK: Record<LookId, SetId> = {
  dusk: "shore",
  golden: "shore",
  ember: "shore",
  rainEve: "shore",
  afterRain: "shore",
  dawn: "shore",
  night: "hill",
  magic: "ring",
  sea: "sea",
  stage: "ring",
};

/* ---------------- 镜头 ---------------- */
export type V3 = [number, number, number];

export interface Cam {
  pos: V3;
  look: V3;
  /** 镜头内的终点（推 / 拉 / 摇），按镜头时长缓动 */
  to?: { pos?: V3; look?: V3 };
  fov?: number;
}

export interface FxSpec {
  kind: FxKind;
  n: number;
  /** 集中在世界坐标 (x, z) 附近 */
  at?: [number, number];
  zone?: "sky" | "ground" | "all";
}

export type PropKind = "lantern" | "flower" | "rock" | "boat" | "clock" | "scroll" | "fan" | "note" | "board" | "arch" | "tree" | "pine" | "house";

export interface PropSpec {
  kind: PropKind;
  x: number;
  z: number;
  size?: number;
  ry?: number;
}

export interface Placement {
  id: CharId;
  cell?: string;
  face?: "front" | "side";
  pose?: string;
  walk?: boolean;
  x: number;
  z: number;
  from?: { x?: number; z?: number };
  /** 走位用时（秒） */
  move?: number;
  size?: number;
  flip?: boolean;
  alpha?: number;
  tint?: string;
  sil?: boolean;
  /** 相对镜头的转身角（度）：背对背靠它 */
  ry?: number;
  tilt?: number;
  lift?: number;
  fly?: boolean;
  wear?: "crown" | "bow" | "tiara";
  talk?: boolean;
  tag?: string;
}

export interface Shot {
  set: SetId;
  look: LookId;
  cam: Cam;
  cast: Placement[];
  props?: PropSpec[];
  fx?: FxSpec[];
  flash?: "white" | "black";
  card?: { title: string; sub?: string };
  note: string;
}

export type Section = "intro" | "verse" | "chorus" | "bridge" | "inter" | "outro";

export interface Cue {
  i: number;
  text: string | null;
  start: number;
  end: number;
  section: Section;
  shot: Shot;
}

/* ---------------- 缓动 ---------------- */
export const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/* ---------------- 词 / 字 卡点 ---------------- */
const WORDS = [
  "说不清楚", "一字一句", "无理取闹", "背对背", "形同陌路", "乱乱绕", "翻不完", "来不及",
  "旧账", "总", "圈套", "怎么", "明了", "双手", "甩开", "刚好", "微妙",
  "战火", "燃烧", "拥抱", "滥用", "沉默", "咆哮", "爱情", "变老", "葬送", "烽火",
  "玩笑", "真话", "兜着", "圈子", "只是", "知道", "想让", "警告", "不要", "一直", "变成",
  "自找", "既然", "可以", "轻易", "放掉", "我们", "然后", "你的", "话", "像", "谁", "这",
  "该", "的", "在", "让", "我", "你", "爱", "到", "再", "就",
];
const MAXW = 4;

/** 贪心最长匹配切词；切不出就退成单字。 */
export function segment(text: string): string[] {
  const out: string[] = [];
  let i = 0;
  while (i < text.length) {
    let hit = "";
    for (let Ln = Math.min(MAXW, text.length - i); Ln >= 2; Ln--) {
      const cand = text.slice(i, i + Ln);
      if (WORDS.includes(cand)) {
        hit = cand;
        break;
      }
    }
    if (hit) {
      out.push(hit);
      i += hit.length;
    } else {
      out.push(text[i]);
      i += 1;
    }
  }
  return out;
}

export interface CharCue {
  ch: string;
  w: number;
  word: string;
  t0: number;
  t1: number;
}

/** 一句的时间先按词的字数分给词（词尾留气口），词内再平分给字。 */
export function charCues(cue: Cue): CharCue[] {
  if (!cue.text) return [];
  const words = segment(cue.text);
  const total = words.reduce((s, w) => s + w.length, 0);
  const dur = cue.end - cue.start;
  const sung = dur * 0.88;
  const out: CharCue[] = [];
  let t = cue.start;
  words.forEach((word, wi) => {
    const wDur = (sung * word.length) / total;
    const gap = Math.min(0.09, wDur * 0.12);
    let ct = t;
    const per = (wDur - gap) / word.length;
    for (const ch of word) {
      out.push({ ch, w: wi, word, t0: ct, t1: ct + per });
      ct += per;
    }
    t += wDur;
  });
  return out;
}

/* ---------------- 校准 ---------------- */
export interface Anchor {
  model: number;
  real: number;
}

export function fitCalibration(anchors: Anchor[]): { offset: number; rate: number } {
  if (anchors.length === 0) return { offset: 0, rate: 1 };
  if (anchors.length === 1) return { offset: anchors[0].real - anchors[0].model, rate: 1 };
  const n = anchors.length;
  const sx = anchors.reduce((s, a) => s + a.model, 0);
  const sy = anchors.reduce((s, a) => s + a.real, 0);
  const sxx = anchors.reduce((s, a) => s + a.model * a.model, 0);
  const sxy = anchors.reduce((s, a) => s + a.model * a.real, 0);
  const denom = n * sxx - sx * sx;
  if (Math.abs(denom) < 1e-6) return { offset: sy / n - sx / n, rate: 1 };
  const b = (n * sxy - sx * sy) / denom;
  const a = (sy - b * sx) / n;
  return { offset: a, rate: Math.min(1.15, Math.max(0.85, b)) };
}

export function fmtTime(t: number): string {
  const s = Math.max(0, t);
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const cs = Math.floor((s * 100) % 100);
  return `${m}:${String(sec).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

/** 从解码好的音频里找「人声进来」的那一刻 */
export function detectVocalOnset(buffer: AudioBuffer): number | null {
  const data = buffer.getChannelData(0);
  const sr = buffer.sampleRate;
  const hop = Math.floor(sr * 0.02);
  const n = Math.floor(data.length / hop);
  const env = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = 0; j < hop; j += 2) {
      const v = data[i * hop + j] || 0;
      sum += v * v;
    }
    env[i] = Math.sqrt(sum / (hop / 2));
  }
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, env[i]);
  const th = peak * 0.16;
  for (let i = 20; i < n - 25; i++) {
    let ok = true;
    for (let j = 0; j < 25; j++) {
      if (env[i + j] < th) {
        ok = false;
        break;
      }
    }
    if (ok) return i * 0.02;
  }
  return null;
}
