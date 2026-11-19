// 立绘动作库。
// 每个动作不是换图，而是一组「骨架参数」随时间的函数：整体位移 / 起跳 / 倾斜、脊柱弯曲、
// 头部转动与俯仰、腿与躯干的压缩、胸口呼吸、纸片翻面、染色。rig.ts 按这组参数把立绘逐条形变画出来。

export interface Pose {
  /** 朝面向方向的位移（占身高比例） */
  dx: number;
  /** 离地高度（占身高比例） */
  lift: number;
  /** 整体倾斜（弧度，正值 = 向面向方向倒） */
  rot: number;
  sx: number;
  sy: number;
  /** 脊柱弯曲：从脚到头累计转过的弧度 */
  bend: number;
  /** 头绕颈线转动 */
  headRot: number;
  /** 头部纵向压缩（点头、低头） */
  headSy: number;
  headDx: number;
  /** 腿部 / 躯干纵向压缩（屈膝、鞠躬） */
  legSy: number;
  torsoSy: number;
  /** 胸口呼吸起伏 */
  chest: number;
  /** 纸片翻面：1 正面，-1 镜像，中间经过 0 */
  turn: number;
  /** 沿身体向上传的摆动波 */
  wave: number;
  wavePhase: number;
  tint: string | null;
  tintA: number;
  alpha: number;
  /** 定格：不叠加呼吸 */
  still: boolean;
}

export interface ActCtx {
  /** 动作开始后经过的秒数 */
  t: number;
  /** 全曲拍位（踩拍类动作用它对齐音乐） */
  beat: number;
}

export interface ActionDef {
  label: string;
  /** 循环动作；否则播一遍后停在结尾姿态 */
  loop: boolean;
  /** 一遍的秒数（预览台循环用） */
  dur: number;
  /** 自带的表情贴 */
  emote?: string;
  fn: (c: ActCtx, p: Pose) => void;
}

export function basePose(): Pose {
  return {
    dx: 0, lift: 0, rot: 0, sx: 1, sy: 1, bend: 0, headRot: 0, headSy: 1, headDx: 0, legSy: 1, torsoSy: 1,
    chest: 0, turn: 1, wave: 0, wavePhase: 0, tint: null, tintA: 0, alpha: 1, still: false,
  };
}

const { sin, cos, abs, exp, PI, floor, min, max } = Math;
const c01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const frac = (v: number) => v - floor(v);
/** 0→1 缓入缓出 */
const rise = (t: number, d: number) => {
  const k = c01(t / d);
  return k * k * (3 - 2 * k);
};
/** 起 a 秒、停 h 秒、收 r 秒的包络 */
const arc = (t: number, a: number, h: number, r: number) => (t < a + h ? rise(t, a) : 1 - rise(t - a - h, r));
/** 翻面：±1 之间快速过零 */
const flipTo = (v: number) => max(-1, min(1, v * 4));

export const ACTIONS: Record<string, ActionDef> = {
  idle: { label: "待机呼吸", loop: true, dur: 3, fn: () => {} },
  float: {
    label: "悬浮", loop: true, dur: 3.7,
    fn: ({ t }, p) => { p.lift = 0.035 + 0.018 * sin(t * 1.7); p.bend = 0.02 * sin(t * 0.9); p.wave = 0.015; p.wavePhase = t * 1.7; },
  },
  hover: {
    label: "振翅", loop: true, dur: 3,
    fn: ({ t }, p) => { p.lift = 0.06 + 0.02 * sin(t * 2.2) + 0.006 * sin(t * 14); p.sy = 1 + 0.008 * sin(t * 14); p.rot = 0.03 * sin(t * 1.1); },
  },
  step: {
    label: "踩拍", loop: true, dur: 2.8,
    fn: ({ beat }, p) => {
      const k = exp(-frac(beat) * 6);
      p.sy = 1 - 0.035 * k; p.sx = 1 + 0.02 * k; p.rot = 0.025 * sin(beat * PI); p.headRot = -0.035 * sin(beat * PI);
    },
  },
  sway: {
    label: "摇摆", loop: true, dur: 2.8,
    fn: ({ beat }, p) => {
      p.bend = 0.13 * sin(beat * PI); p.headRot = 0.05 * sin(beat * PI - 0.8); p.dx = 0.012 * sin(beat * PI);
      p.wave = 0.02; p.wavePhase = beat * PI;
    },
  },
  hop: {
    label: "开心跳", loop: true, dur: 2.8, emote: "note",
    fn: ({ beat }, p) => {
      const ph = frac(beat);
      const air = ph < 0.6 ? sin((ph / 0.6) * PI) : 0;
      const land = ph >= 0.6 ? exp(-(ph - 0.6) * 9) : 0;
      p.lift = 0.06 * air; p.sy = 1 + 0.04 * air - 0.05 * land; p.sx = 1 - 0.02 * air + 0.03 * land;
      p.headRot = 0.03 * sin(beat * PI);
    },
  },
  cheer: {
    label: "欢呼", loop: true, dur: 2.8, emote: "sparkle",
    fn: ({ beat }, p) => {
      const ph = frac(beat);
      const air = ph < 0.65 ? sin((ph / 0.65) * PI) : 0;
      const land = ph >= 0.65 ? exp(-(ph - 0.65) * 9) : 0;
      p.lift = 0.09 * air; p.sy = 1 + 0.05 * air - 0.06 * land; p.sx = 1 - 0.025 * air + 0.035 * land;
      p.bend = 0.06 * sin(beat * PI); p.headRot = -0.05 * sin(beat * PI);
    },
  },
  nod: {
    label: "点头", loop: false, dur: 1.3,
    fn: ({ t }, p) => { const n = t < 1.2 ? sin((t / 0.6) * PI) ** 2 : 0; p.headSy = 1 - 0.1 * n; p.torsoSy = 1 - 0.015 * n; },
  },
  shake: {
    label: "摇头", loop: false, dur: 1.3,
    fn: ({ t }, p) => { const e = t < 1.3 ? sin((t / 1.3) * PI) : 0; const s = sin(t * 15); p.headDx = 0.012 * s * e; p.headRot = 0.04 * s * e; },
  },
  tilt: {
    label: "歪头", loop: false, dur: 2.2,
    fn: ({ t }, p) => { const e = rise(t, 0.4); p.headRot = 0.15 * e; p.bend = 0.03 * e; },
  },
  bow: {
    label: "鞠躬", loop: false, dur: 2.2,
    fn: ({ t }, p) => { const e = arc(t, 0.5, 0.9, 0.6); p.torsoSy = 1 - 0.15 * e; p.headSy = 1 - 0.15 * e; p.sx = 1 + 0.015 * e; p.rot = 0.02 * e; },
  },
  curtsy: {
    label: "提裙行礼", loop: false, dur: 2,
    fn: ({ t }, p) => { const e = arc(t, 0.4, 0.7, 0.5); p.legSy = 1 - 0.1 * e; p.headSy = 1 - 0.08 * e; p.headRot = 0.07 * e; p.bend = 0.02 * e; },
  },
  wave: {
    label: "打招呼", loop: true, dur: 2.8, emote: "sparkle",
    fn: ({ t }, p) => {
      const e = rise(t, 0.3);
      p.rot = 0.04 * e; p.bend = (0.07 + 0.03 * sin(t * 9)) * e; p.headRot = (0.08 + 0.03 * sin(t * 9 + 1)) * e;
      p.lift = 0.02 * abs(sin(t * 4.5)) * e;
    },
  },
  point: {
    label: "递出去", loop: false, dur: 2,
    fn: ({ t }, p) => { const e = arc(t, 0.3, 1, 0.5); p.dx = 0.035 * e; p.sx = 1 + 0.05 * e; p.sy = 1 + 0.05 * e; p.rot = 0.03 * e; p.headRot = -0.03 * e; },
  },
  lean: {
    label: "靠近", loop: false, dur: 2.4,
    fn: ({ t }, p) => { const e = rise(t, 0.9); p.rot = 0.045 * e; p.headRot = 0.06 * e; p.bend = 0.03 * e; },
  },
  eat: {
    label: "干饭", loop: true, dur: 2.4, emote: "steam",
    fn: ({ t }, p) => { const n = abs(sin(t * 8)); p.headSy = 1 - 0.05 * n; p.lift = 0.004 * n; p.headRot = 0.02 * sin(t * 4); },
  },
  surprise: {
    label: "吃惊", loop: false, dur: 1.4, emote: "exclaim",
    fn: ({ t }, p) => {
      const k = exp(-t * 5);
      p.lift = t < 0.3 ? 0.05 * sin((t / 0.3) * PI) : 0; p.sy = 1 + 0.07 * k; p.sx = 1 - 0.03 * k; p.dx = 0.004 * sin(t * 50) * exp(-t * 3);
    },
  },
  sad: {
    label: "低落", loop: false, dur: 2.6, emote: "gloom",
    fn: ({ t }, p) => {
      const e = rise(t, 1.2);
      p.headSy = 1 - 0.07 * e; p.torsoSy = 1 - 0.03 * e; p.headRot = 0.07 * e; p.bend = 0.035 * e; p.tint = "#1b2a52"; p.tintA = 0.22 * e;
    },
  },
  spin: {
    label: "转圈", loop: false, dur: 1.2,
    fn: ({ t }, p) => { const ph = c01(t / 0.9); p.turn = cos(ph * 2 * PI); p.lift = 0.03 * sin(ph * PI); },
  },
  shiver: {
    label: "发抖", loop: true, dur: 2.4, emote: "sweat",
    fn: ({ t }, p) => {
      p.dx = 0.004 * sin(t * 55); p.sx = 0.985; p.sy = 0.99; p.legSy = 0.98; p.headRot = 0.01 * sin(t * 40); p.tint = "#9fc4ff"; p.tintA = 0.12;
    },
  },
  lookaround: {
    label: "左右张望", loop: true, dur: 2.4,
    fn: ({ t }, p) => { p.turn = flipTo(cos(frac(t / 2.4) * 2 * PI)); p.headRot = 0.05; p.bend = 0.02; },
  },
  choose: {
    label: "两边想想再选", loop: false, dur: 3.2, emote: "question",
    fn: ({ t }, p) => {
      if (t < 1) { p.turn = flipTo(cos(t * PI)); p.headRot = 0.06; }
      else if (t < 2) { p.turn = flipTo(-cos((t - 1) * PI)); p.headRot = 0.06; }
      else if (t < 3) { const n = sin(((t - 2) / 0.5) * PI) ** 2; p.headSy = 1 - 0.1 * n; }
    },
  },
  think: {
    label: "思考", loop: false, dur: 2.6, emote: "bulb",
    fn: ({ t }, p) => { const e = rise(t, 0.5); p.headRot = 0.11 * e; p.bend = -0.03 * e; p.rot = 0.01 * sin(t * 0.8); },
  },
  read: {
    label: "看书", loop: false, dur: 3,
    fn: ({ t }, p) => { const e = rise(t, 0.5); p.headSy = 1 - 0.05 * e; p.headRot = 0.035 * e + 0.01 * sin(t * 0.6); },
  },
  doze: {
    label: "打盹", loop: true, dur: 3.4, emote: "zzz",
    fn: ({ t }, p) => {
      const ph = frac(t / 3.4);
      const d = ph < 0.8 ? rise(ph, 0.8) : 1 - rise(ph - 0.8, 0.08);
      p.headSy = 1 - 0.1 * d; p.headRot = 0.13 * d; p.bend = 0.04 * d; p.torsoSy = 1 - 0.02 * d;
    },
  },
  alert: {
    label: "惊醒竖耳", loop: false, dur: 1.4, emote: "exclaim",
    fn: ({ t }, p) => {
      const k = exp(-t * 4);
      p.sy = 1 + 0.07 * k; p.sx = 1 - 0.03 * k; p.lift = 0.035 * sin(min(t / 0.25, 1) * PI); p.dx = 0.003 * sin(t * 60) * k; p.headRot = -0.02;
    },
  },
  cast: {
    label: "施法", loop: true, dur: 3.2, emote: "shine",
    fn: ({ t }, p) => {
      p.lift = 0.04 + 0.012 * sin(t * 2); p.sy = 1.02; p.bend = -0.03; p.headRot = -0.04; p.tint = "#ffe9a0"; p.tintA = 0.12 + 0.08 * sin(t * 4);
      p.wave = 0.02; p.wavePhase = t * 2;
    },
  },
  rage: {
    label: "生气", loop: true, dur: 2.8, emote: "anger",
    fn: ({ t, beat }, p) => {
      p.dx = 0.005 * sin(t * 45); p.sy = 1 - 0.03 * exp(-frac(beat) * 7); p.tint = "#ff3b3b"; p.tintA = 0.16; p.headRot = 0.02 * sin(t * 30);
    },
  },
  petri: {
    label: "石化", loop: false, dur: 2.4,
    fn: ({ t }, p) => { const e = rise(t, 0.25); p.tint = "#9aa0a8"; p.tintA = 0.72 * e; p.still = true; p.dx = 0.004 * sin(t * 70) * exp(-t * 6); },
  },
  shy: {
    label: "害羞", loop: false, dur: 2.6, emote: "heart",
    fn: ({ t }, p) => {
      const e = rise(t, 0.5);
      p.headRot = 0.1 * e; p.sx = 1 - 0.02 * e; p.headSy = 1 - 0.03 * e; p.bend = 0.03 * sin(t * 2.2) * e; p.tint = "#ff8fb0"; p.tintA = 0.08 * e;
    },
  },
  walk: {
    label: "走", loop: true, dur: 2.8,
    fn: ({ beat }, p) => {
      p.lift = 0.014 * abs(sin(beat * PI)); p.rot = 0.022 * sin(beat * PI); p.bend = -0.03 * sin(beat * PI); p.headRot = 0.015 * sin(beat * PI + 0.5);
    },
  },
  run: {
    label: "跑", loop: true, dur: 2.8,
    fn: ({ beat }, p) => { p.lift = 0.03 * abs(sin(beat * 2 * PI)); p.rot = 0.07; p.bend = 0.03 * sin(beat * 2 * PI); p.headRot = -0.03; },
  },
};

export const ACTION_IDS = Object.keys(ACTIONS);

/** 算出某一时刻的姿态；T 是全局时间，只用来叠呼吸，seed 让每个人的呼吸错开 */
export function poseOf(action: string, t: number, beat: number, T: number, seed: number): Pose {
  const p = basePose();
  const def = ACTIONS[action] ?? ACTIONS.idle;
  if (t >= 0) def.fn({ t, beat }, p);
  if (!p.still) {
    p.chest += 0.014 * sin(T * 1.9 + seed);
    p.sy += 0.003 * sin(T * 1.9 + seed);
    p.headRot += 0.012 * sin(T * 0.83 + seed * 2);
    p.bend += 0.008 * sin(T * 0.61 + seed);
  }
  return p;
}
