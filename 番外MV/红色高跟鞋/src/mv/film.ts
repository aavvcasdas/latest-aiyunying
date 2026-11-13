// 分镜总谱：renderFilm(ctx, A, t) 是 t 的纯函数。
//
// 谁演谁（照 番外MV/设定表.md 第 5 节先填表再开拍）：
//   本鲸 whale  = 追着红鞋的女孩（主角）。兑现「怕自己不够好才不被留下」：隔着橱窗看、转身走开、桥上淋雨。
//   小克 claude = 鞋店里的那个人。兑现「先听完，不解释」：一直在橱窗里看着，最后撑伞把鞋盒送到桥上。
//   猫 gemini   = 斑马线对面左右张望、选不定路的路人（「左灯右行」）。
//   狐狸 zai    = 路灯长椅上打盹的路人。
//   豆包 / Kimi / 千问 = 结尾栈桥上的远景路人，只做各自的招牌小动作。
import { CREAM, H, W, clamp, easeOut, env, kf, lerp, pick, seg, type Ctx } from './core';
import { HEEL_HITS, LINES } from './cues';
import { GROUND, bridge, petals, pier, room, shoebox, street, type Cam, type Floaty } from './scenes';
import type { Act, Atlas } from './sprites';
import { drawSubtitles, impact } from './subtitles';

const FEET = GROUND + 18; // 人行道上的站位
const BF = GROUND + 6; // 桥面上的站位
const lin = (k: number) => k;
const tri = (t: number, a: number, b: number, c: number) => (t < b ? seg(t, a, b) : 1 - seg(t, b, c));

// 两次擦除转场：色带完全盖住画面的那一刻换场
const RIBBON: [number, number] = [18.15, 18.95];
const TEAR: [number, number] = [38.3, 39.05];
const T_RIBBON = RIBBON[0] + 0.49 * (RIBBON[1] - RIBBON[0]);
const T_TEAR = TEAR[0] + 0.49 * (TEAR[1] - TEAR[0]);

const landOf = (lineIdx: number, c: string) => LINES[lineIdx].chars.find((x) => x.c === c)!.land;
const T_STOP = landOf(6, '停');
const T_CHASE = landOf(6, '追');
const T_CLASH = landOf(4, '冲');
const T_CRAZY = landOf(5, '疯');

function heelPulse(t: number) {
  let m = 0;
  for (const h of HEEL_HITS) if (t >= h) m = Math.max(m, Math.exp(-(t - h) * 7));
  return m;
}

const hearts = (times: number[], x: number, y: number, dx = 16): Floaty[] => times.map((t0, i) => ({ t0, x: x + ((i % 3) - 1) * dx, y }));

function scene(ctx: Ctx, A: Atlas, t: number) {
  // ① 0–4.15 夜街全景 → 推进亮着粉窗帘的那扇窗
  if (t < 4.15) {
    const cam: Cam = { x: kf(t, [[0, 860], [2, 960], [4.1, 500]]), y: kf(t, [[0, 470], [2, 480], [4.1, 480]]), z: kf(t, [[0, 0.9], [2, 0.98], [4.1, 3.3]]) };
    street(ctx, A, t, cam, {
      actors: [{ who: 'zai', act: 'doze', at: t, x: 1255, y: 742, s: 2 }],
      inShop: { who: 'claude', act: 'idle', at: t, x: 1815, y: GROUND + 14 },
    });
    return;
  }
  // ② 4.15–8.6 卧室：你像窝在被子里的舒服
  if (t < 8.6) {
    const w = pick(t, [[4.15, 'sway'], [7.6, 'wave']]);
    room(ctx, A, t, { ...w, outX: lerp(180, 520, seg(t, 4.4, 8.6)), zoom: 1 + 0.05 * seg(t, 4.15, 8.6), hearts: hearts([7.69, 7.97, 8.2], 760, 520, 40) });
    return;
  }
  // ③ 8.6–13.5 出门，起风：却又像风捉摸不住
  if (t < 13.5) {
    const cam: Cam = { x: kf(t, [[8.6, 600], [11.2, 980], [13.5, 1090]]), y: kf(t, [[8.6, 560], [13.5, 570]]), z: kf(t, [[8.6, 1.55], [10.6, 1.3], [13.5, 1.75]]) };
    const walking = t >= 8.9 && t < 11.2;
    const w = walking ? { act: 'walk', at: t - 8.9 } : t < 8.9 ? { act: 'idle', at: t } : pick(t, [[11.2, 'shiver'], [12.5, 'surprise']]);
    street(ctx, A, t, cam, {
      actors: [
        { who: 'zai', act: 'doze', at: t, x: 1255, y: 742, s: 2 },
        { who: 'whale', ...w, x: kf(t, [[8.9, 495], [11.2, 1040]], lin), y: FEET },
      ],
      inShop: { who: 'claude', act: 'lookaround', at: t, x: 1815, y: GROUND + 14 },
      wind: seg(t, 9.9, 10.2) * (1 - seg(t, 10.75, 11.3)),
    });
    return;
  }
  // ④ 13.5–18.54 路灯下：像手腕上散发的香水味（丝带一路飘向鞋店）
  if (t < T_RIBBON) {
    const cam: Cam = { x: kf(t, [[13.5, 1090], [16.6, 1100], [18.5, 1500]]), y: kf(t, [[13.5, 570], [14.3, 600], [18.5, 590]]), z: kf(t, [[13.5, 1.75], [14.3, 2.1], [16.6, 2.1], [18.5, 1.6]]) };
    const w = pick(t, [[13.5, 'idle'], [14.09, 'point'], [15.03, 'spin'], [15.78, 'sway']]);
    street(ctx, A, t, cam, {
      actors: [
        { who: 'zai', act: 'doze', at: t, x: 1255, y: 742, s: 2 },
        { who: 'whale', ...w, x: 1040, y: FEET },
      ],
      inShop: { who: 'claude', act: 'idle', at: t, x: 1815, y: GROUND + 14 },
      ribbon: { p: seg(t, 16.3, 18.25), x: 1095, y: FEET - 118 },
      hearts: hearts([16.92, 17.52, 17.98], 1110, FEET - 200),
    });
    return;
  }
  // ⑤ 18.54–23.25 橱窗前：像爱不释手的 红色高跟鞋
  if (t < 23.25) {
    const hp = heelPulse(t);
    const cam: Cam = { x: kf(t, [[18.54, 1620], [22.3, 1660], [23.25, 1720]]), y: 610, z: 1.8 + 0.1 * hp };
    const leaving = t >= 22.3;
    const w = leaving ? { act: 'walk', at: t - 22.3 } : pick(t, [[18.54, 'point'], [20.45, 'hop'], [21.95, 'sad']]);
    street(ctx, A, t, cam, {
      actors: [{ who: 'whale', ...w, x: kf(t, [[22.3, 1375], [23.3, 1560]], lin), y: FEET }],
      inShop: { who: 'claude', ...pick(t, [[18.54, 'idle'], [20.5, 'tilt'], [21.9, 'lookaround']]), x: 1815, y: GROUND + 14 },
      pulse: hp,
      hearts: hearts([19.22, 19.55, 19.7, 20.03], 1425, FEET - 215),
    });
    return;
  }
  // ⑥ 23.25–30.25 斑马线：我爱你有种左灯右行的冲突 / 疯狂却怕
  if (t < 30.25) {
    const cam: Cam = {
      x: kf(t, [[23.25, 2690], [28.45, 2760]]),
      y: kf(t, [[23.25, 540], [28.45, 540], [28.9, 470], [29.7, 470], [30.25, -380]]),
      z: kf(t, [[23.25, 1.2], [28.45, 1.2], [28.9, 0.8]]),
    };
    const crossed = t >= 27.95; // 公交车挡住的那一刻，她已经到了马路对面
    const actors: Act[] = [{ who: 'gemini', act: 'choose', at: t, x: 3400, y: FEET }];
    if (!crossed) {
      const walking = t >= 23.4 && t < 24.9;
      const w = walking ? { act: 'walk', at: t - 23.4 } : pick(t, [[23.25, 'idle'], [24.9, 'idle'], [T_CLASH, 'surprise']]);
      actors.push({ who: 'whale', ...w, x: kf(t, [[23.4, 2400], [24.9, 2690]], lin), y: FEET });
    } else {
      actors.push({ who: 'whale', act: 'sad', at: t - 27.95, x: 3090, y: FEET });
    }
    const out = t >= 24.4;
    if (out) {
      const walking = t < 26.9;
      const c = walking ? { act: 'walk', at: t - 24.4 } : pick(t, [[26.9, 'idle'], [T_CLASH, 'lookaround'], [T_CRAZY, 'sad']]);
      actors.push({ who: 'claude', ...c, x: kf(t, [[24.4, 2080], [26.9, 2400]], lin), y: FEET });
    }
    const clash = t >= T_CLASH;
    street(ctx, A, t, cam, {
      actors,
      inShop: out ? null : { who: 'claude', act: 'lookaround', at: t, x: 1815, y: GROUND + 14 },
      sig: [t >= 25.0, t >= 25.27 && !clash, t >= 26.4, t >= 26.67 && !clash],
      busX: t >= 27.2 && t < 28.85 ? lerp(1650, 4150, seg(t, 27.2, 28.8)) : null,
      rain: seg(t, 28.7, 29.4),
      dark: 0.3 * seg(t, 28.5, 29.0),
      snow: 1 - seg(t, 28.5, 29.2),
    });
    return;
  }
  // ⑦ 30.25–38.67 天桥淋雨：没有退路 / 你能否让我停止这种追逐
  if (t < T_TEAR) {
    const cam: Cam = { x: kf(t, [[30.25, 960], [35, 990], [38.7, 1010]]), y: kf(t, [[30.25, 520], [38.7, 560]]), z: kf(t, [[30.25, 1.0], [33.3, 1.1], [35.2, 1.22], [38.7, 1.3]]) };
    const w = pick(t, [[30.25, 'sad'], [32.5, 'surprise'], [33.4, 'shiver'], [T_STOP, 'surprise'], [36.3, 'nod'], [T_CHASE, 'hop']]);
    const actors: Act[] = [{ who: 'whale', ...w, x: 960, y: BF }];
    let umb = null;
    if (t >= 34.3) {
      const cx = kf(t, [[34.3, 1780], [35.45, 1135]], lin);
      const c = t < 35.45 ? { act: 'walk', at: t - 34.3 } : pick(t, [[35.45, 'idle'], [36.63, 'nod'], [T_CHASE, 'curtsy']]);
      actors.push({ who: 'claude', ...c, x: cx, y: BF, flip: true });
      umb = { x: cx - 88, y: BF - 400 };
    }
    bridge(ctx, A, t, cam, {
      actors,
      umb,
      rain: t < T_STOP ? 1 : lerp(1, 0.22, seg(t, T_STOP, T_STOP + 0.5)),
      hearts: hearts([T_CHASE, 37.72, 38.0], 1045, BF - 300, 30),
    });
    return;
  }
  // ⑧ 38.67–39.72 鞋盒
  if (t < 39.72) {
    shoebox(ctx, A, t, easeOut(seg(t, 38.85, 39.5)));
    return;
  }
  // ⑨ 39.72–43.3 并肩：就当那双最后唯一的
  if (t < 43.3) {
    const cam: Cam = { x: 960, y: 590, z: kf(t, [[39.72, 1.4], [43.3, 1.28]]) };
    bridge(ctx, A, t, cam, {
      actors: [
        { who: 'claude', ...pick(t, [[39.72, 'idle'], [40.77, 'nod'], [41.3, 'curtsy'], [42.2, 'idle']]), x: 845, y: BF },
        { who: 'whale', ...pick(t, [[39.72, 'sway'], [41.2, 'hop'], [42.3, 'sway']]), x: 1075, y: BF, shoes: 1 },
      ],
      rain: 0,
      hearts: hearts([40.17, 40.47, 40.77, 41.08, 41.7, 42.3], 960, BF - 290, 34),
    });
    return;
  }
  // ⑩ 43.3– 栈桥：红色高跟鞋
  const cam: Cam = { x: 960, y: kf(t, [[43.3, 575], [46.6, 540]], easeOut), z: kf(t, [[43.3, 2.0], [46.6, 1.0]], easeOut) };
  pier(ctx, A, t, cam, {
    actors: [
      { who: 'claude', act: 'idle', at: t, x: 912, y: 800 },
      { who: 'whale', act: 'sway', at: t, x: 1010, y: 800, shoes: 1 },
    ],
    extras: [
      { who: 'doubao', act: 'sway', at: t, x: 450, y: 800 },
      { who: 'kimi', act: 'idle', at: t, x: 1480, y: 800 },
      { who: 'qwen', act: 'idle', at: t, x: 1640, y: 800 },
    ],
    hearts: hearts([43.52, 43.85, 44.13, 44.45, 44.75, 45.3, 45.9, 46.4], 962, 590, 26),
  });
}

/** 斜向扫过整屏的色带（香水丝带 / 撕开的包装纸） */
function band(ctx: Ctx, t: number, [t0, t1]: [number, number], c1: string, c2: string, torn: boolean) {
  const k = seg(t, t0, t1);
  if (k <= 0 || k >= 1) return;
  ctx.save();
  ctx.translate(lerp(-1750, 3700, k), H / 2);
  ctx.rotate(-0.2);
  const edge = (x: number, dir: number) => {
    ctx.beginPath();
    ctx.moveTo(x, -1100);
    for (let y = -1100; y <= 1100; y += 60) ctx.lineTo(x + dir * (torn ? ((y / 60) % 2 ? 26 : -8) : Math.sin(y / 140) * 22), y);
    ctx.lineTo(x - dir * 2700, 1100);
    ctx.lineTo(x - dir * 2700, -1100);
    ctx.closePath();
  };
  ctx.save();
  edge(1330, 1);
  ctx.clip();
  ctx.save();
  edge(-1330, -1);
  ctx.clip();
  ctx.fillStyle = CREAM;
  ctx.fillRect(-1400, -1100, 2800, 2200);
  ctx.restore();
  ctx.restore();
  ctx.fillStyle = c1;
  ctx.fillRect(-1296, -1100, 2592, 2200);
  ctx.fillStyle = c2;
  ctx.fillRect(-520, -1100, 760, 2200);
  ctx.restore();
}

let grain: CanvasPattern | null = null;
function finish(ctx: Ctx) {
  if (!grain) {
    const c = env.makeCanvas(256, 256);
    const x = c.getContext('2d')!;
    for (let i = 0; i < 9000; i++) {
      const v = Math.random() > 0.5 ? 255 : 0;
      x.fillStyle = `rgba(${v},${v},${v},${0.03 + Math.random() * 0.07})`;
      x.fillRect(Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), 2, 2);
    }
    grain = ctx.createPattern(c, 'repeat');
  }
  if (grain) {
    ctx.fillStyle = grain;
    ctx.fillRect(0, 0, W, H);
  }
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 1.05);
  g.addColorStop(0, 'rgba(10,6,30,0)');
  g.addColorStop(1, 'rgba(10,6,30,.5)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

const wash = (ctx: Ctx, color: string, a: number) => {
  if (a <= 0) return;
  ctx.globalAlpha = clamp(a);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1;
};

export function renderFilm(ctx: Ctx, A: Atlas, t: number) {
  ctx.save();
  const im = impact(t);
  if (im > 0.01) {
    ctx.translate(W / 2, H / 2);
    ctx.scale(1 + 0.022 * im, 1 + 0.022 * im);
    ctx.translate(-W / 2 + Math.sin(t * 95) * 8 * im, -H / 2 + Math.cos(t * 81) * 6 * im);
  }
  scene(ctx, A, t);
  ctx.restore();

  // 转场
  wash(ctx, '#f6f0e6', tri(t, 3.85, 4.15, 4.5));
  wash(ctx, '#f6f0e6', tri(t, 8.3, 8.6, 8.95));
  band(ctx, t, RIBBON, '#f3a0bb', '#fbd3df', false);
  wash(ctx, '#f6f0e6', tri(t, 22.85, 23.25, 23.6));
  wash(ctx, '#1a1c40', tri(t, 29.8, 30.25, 30.65));
  band(ctx, t, TEAR, '#5b8fc7', '#dfe9f5', true);
  wash(ctx, '#1d2046', tri(t, 39.56, 39.72, 39.9));
  wash(ctx, '#6a4f92', tri(t, 42.98, 43.3, 43.62));
  petals(ctx, t, 42.82);

  drawSubtitles(ctx, t);
  finish(ctx);
  wash(ctx, '#000', seg(t, 46.75, 47.5));
}
