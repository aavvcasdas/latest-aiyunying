import type { Assets } from "./assets";
import {
  W, H, G, clamp, lerp, seg, easeOut, easeIn, easeInOut, backOut, elastic, rnd,
  sky, glow, rays, sun, moon, cloud, clouds, hills, grassTufts, flower, heart, star, starfield,
  confetti, speedLines, vignette, flash, room, windowFrame, globe, rainbow, actor, shadow, prop, fx,
  FLOWER_COLOR,
} from "./draw";

export type S = { g: G; A: Assets; t: number; lt: number; p: number; d: number };
type ShotFn = (s: S) => void;

const ALL = ["whale", "claude", "gpt", "qwen", "doubao", "gemini", "kimi", "zai"];
const FRIENDS = ["qwen", "doubao", "gemini", "kimi"];
const SC = (c: string) => (c === "gpt" ? 0.62 : 1); // gpt 帧格大，缩到同身高
const HAPPY: Record<string, string> = { whale: "hop", claude: "hop", gpt: "float", qwen: "hop", doubao: "hop", gemini: "hop", kimi: "hop", zai: "hop" };
const DANCE: Record<string, string> = { whale: "sway", claude: "curtsy", gpt: "hover", qwen: "sway", doubao: "sway", gemini: "sway", kimi: "lookaround", zai: "tilt" };

// ───────── 共用场景 ─────────
function daySky(g: G, t: number, speed = 8) {
  sky(g, "#4aa8ff", "#bfe6ff", "#86ccff");
  clouds(g, t, speed, 6, 30, 160, 0.9, "#ffffff", 0.95, 2);
}
function meadow(g: G, t: number, y = 250) {
  hills(g, y - 40, "#8fd18a", 18, 0.012, 1.3);
  hills(g, y, "#5fbf5f", 10, 0.02, t * 0.05);
  grassTufts(g, y + 10, t, "#3f9a46", 60);
}
function sunsetSky(g: G) { sky(g, "#ff9e7a", "#ffe2a8", "#ffbd88"); }
function nightSky(g: G, t: number) { sky(g, "#0b1033", "#2a2d6b", "#161a4a"); starfield(g, t, 90); }
function pinkBubbles(g: G, t: number) {
  sky(g, "#ffd3e6", "#ffeef6");
  for (let i = 0; i < 18; i++) {
    const x = rnd(i) * W, y = (rnd(i + 4) * H - t * (20 + rnd(i) * 30) + H * 4) % (H + 40) - 20;
    g.strokeStyle = "rgba(255,255,255,0.8)"; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 6 + rnd(i * 2) * 14, 0, Math.PI * 2); g.stroke();
  }
}
function garden(g: G, t: number, grow = 1, y0 = 230) {
  daySky(g, t, 6);
  sun(g, 560, 60, 22, t * 0.3);
  meadow(g, t, y0);
  const cols = Object.values(FLOWER_COLOR);
  for (let i = 0; i < 70; i++) {
    const x = rnd(i * 5) * W, y = y0 + 8 + rnd(i * 3) * (H - y0 - 8);
    const s = 0.6 + (y - y0) / (H - y0) * 0.9;
    flower(g, x, y, s, cols[i % cols.length], grow - rnd(i) * 0.3 * (1 - grow), Math.sin(t * 2 + i) * 2);
  }
}
function butterflies(g: G, t: number, n = 5) {
  for (let i = 0; i < n; i++) {
    const x = (rnd(i) * W + t * 30 * (rnd(i + 1) > 0.5 ? 1 : -1) + W * 3) % W;
    const y = 150 + Math.sin(t * 2 + i * 2) * 40 + rnd(i + 3) * 60;
    const f = Math.abs(Math.sin(t * 14 + i));
    g.fillStyle = ["#ffd84a", "#ff8fc2", "#8fd0ff"][i % 3];
    g.fillRect(x - 4 * f, y - 3, 4 * f, 5); g.fillRect(x, y - 3, 4 * f, 5);
    g.fillStyle = "#333"; g.fillRect(x - 0.5, y - 3, 1, 6);
  }
}
function lineup(s: S, chars: string[], y: number, sc: number, act: (c: string, i: number) => string, spread = 0.8, bob = 0) {
  const { g, A, lt } = s;
  chars.forEach((c, i) => {
    const x = W / 2 + (i - (chars.length - 1) / 2) * (W * spread / chars.length);
    const yy = y - Math.abs(Math.sin(lt * 6 + i)) * bob;
    shadow(g, x, y + 2, 16 * sc);
    actor(g, A, c, act(c, i), x, yy, sc * SC(c), lt + i * 0.13);
  });
}
function bigClock(g: G, x: number, y: number, r: number, hourA: number, minA: number, a = 1) {
  g.save(); g.globalAlpha = a;
  g.fillStyle = "#fffaf0"; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  g.strokeStyle = "#e86a4a"; g.lineWidth = 6; g.stroke();
  g.fillStyle = "#4a3a30";
  for (let i = 0; i < 12; i++) { const an = (i / 12) * Math.PI * 2; g.fillRect(x + Math.cos(an) * r * 0.82 - 2, y + Math.sin(an) * r * 0.82 - 2, 4, 4); }
  g.strokeStyle = "#4a3a30"; g.lineCap = "round";
  g.lineWidth = 5; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(hourA - Math.PI / 2) * r * 0.5, y + Math.sin(hourA - Math.PI / 2) * r * 0.5); g.stroke();
  g.lineWidth = 3; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(minA - Math.PI / 2) * r * 0.75, y + Math.sin(minA - Math.PI / 2) * r * 0.75); g.stroke();
  g.fillStyle = "#e86a4a"; g.beginPath(); g.arc(x, y, 5, 0, Math.PI * 2); g.fill();
  g.restore();
}
function camera(g: G, zoom: number, cx = W / 2, cy = H / 2) {
  g.translate(cx, cy); g.scale(zoom, zoom); g.translate(-cx, -cy);
}

// ───────── 镜头 ─────────
const shots: Record<string, ShotFn> = {
  intro: ({ g, t, p }) => {
    daySky(g, t);
    sun(g, 320, lerp(260, 150, easeOut(p)), 30, t * 0.4);
    flash(g, 1 - easeOut(p));
  },

  // 晴天：太阳升起，镜头往下摇到窗
  sunny: ({ g, t, p }) => {
    g.save();
    g.translate(0, -easeInOut(seg(p, 0.55, 1)) * 60);
    daySky(g, t);
    sun(g, 320, lerp(150, 110, easeOut(p)), 34, t * 0.4);
    hills(g, 300, "#8fd18a", 14, 0.015, 1);
    // 屋顶 + 窗出现在下方
    g.fillStyle = "#e86a4a"; g.beginPath(); g.moveTo(200, 330); g.lineTo(320, 270); g.lineTo(440, 330); g.fill();
    g.fillStyle = "#fff4e0"; g.fillRect(220, 330, 200, 100);
    g.fillStyle = "#9fd6ff"; g.fillRect(290, 350, 60, 50);
    g.restore();
  },

  // 有点：窗台托腮，一小块光斑
  window: ({ g, A, t, lt, p }) => {
    room(g, 0.05);
    windowFrame(g, 220, 50, 200, 140, (gg) => { daySky(gg, t, 4); sun(gg, 380, 80, 18, t * 0.4, false); });
    g.fillStyle = "rgba(255,240,180,0.45)";
    g.beginPath(); g.moveTo(220, 196); g.lineTo(420, 196); g.lineTo(470, 300); g.lineTo(250, 300); g.fill();
    glow(g, 330, 250, lerp(20, 60, p), "rgba(255,250,200,0.8)", 0.8);
    actor(g, A, "whale", "idle", 320, 300, 1.7, lt, { fps: 4 });
  },

  // 孤单：拉远，空房间，阴云、落叶
  lonely: ({ g, A, t, lt, p }) => {
    g.save();
    camera(g, lerp(1.25, 0.95, easeOut(p)), 320, 260);
    room(g, 0.18 + p * 0.15);
    windowFrame(g, 420, 50, 120, 100, (gg) => { sky(gg, "#8fb4d8", "#cfe0ee"); cloud(gg, 450, 90, 0.6, "#dde6f0"); });
    shadow(g, 160, 302, 18);
    actor(g, A, "whale", "sad", 160, 300, 1.0, lt, { fps: 5 });
    fx(g, A, "gloom", 160, 205, 1.6, lt, clamp(p * 3));
    // 落叶
    const ly = lerp(40, 290, p), lx = 300 + Math.sin(lt * 3) * 30;
    g.save(); g.translate(lx, ly); g.rotate(lt * 2); g.fillStyle = "#d98a3a"; g.beginPath(); g.ellipse(0, 0, 5, 2.5, 0, 0, Math.PI * 2); g.fill(); g.restore();
    g.restore();
    vignette(g, 0.35 + p * 0.35, "20,20,50");
    void t;
  },

  // 玩具：弹跳登场
  toys: ({ g, A, t, lt, p }) => {
    room(g, 0.12);
    glow(g, 320, 230, 150, "rgba(255,230,180,0.7)", 0.6);
    const b = elastic(seg(p, 0, 0.6));
    shadow(g, 320, 284, 50 * b, 0.25);
    prop(g, A, "toys", 320, 284 - Math.abs(Math.sin(lt * 8)) * 6 * (1 - p), 2.2 * b);
    star(g, 240, 150, 6 * b, "#fff3a0", 0.9, lt * 3); star(g, 410, 130, 5 * b, "#fff3a0", 0.9, -lt * 3);
    void t;
  },

  // 丢在：抛物线
  toss: ({ g, A, lt, p }) => {
    room(g, 0.18);
    const q = clamp(p * 1.1);
    const x = lerp(260, 520, q), y = 280 - Math.sin(q * Math.PI) * 150;
    actor(g, A, "whale", "shake", 200, 300, 1.4, lt);
    shadow(g, x, 300, 24);
    prop(g, A, "toys", x, Math.min(300, y + 20), 1.2, q * 6 * (1 - q * 0.3));
    for (let i = 1; i < 6; i++) { const qq = clamp(q - i * 0.05); g.fillStyle = `rgba(255,255,255,${0.5 - i * 0.08})`; g.fillRect(lerp(260, 520, qq), 280 - Math.sin(qq * Math.PI) * 150, 3, 3); }
    if (q > 0.95) fx(g, A, "dizzy", x, 220, 1.4, lt);
  },

  // 旁边：横移，玩具被留在边上
  aside: ({ g, A, lt, p }) => {
    room(g, 0.2);
    const camX = p * 140;
    prop(g, A, "toys", 560 - camX, 300, 1.1, 0.25, 0.85);
    g.fillStyle = "rgba(255,255,255,0.4)";
    for (let i = 0; i < 12; i++) g.fillRect(560 - camX + Math.sin(lt + i) * 30, 220 + ((i * 17 + lt * 10) % 70), 1.5, 1.5);
    const wx = lerp(500, 180, p);
    shadow(g, wx, 302, 16);
    actor(g, A, "whale", "walk", wx, 300, 1.25, lt, { flip: true });
    vignette(g, 0.45, "30,30,60");
  },

  // 电视：啪地亮起
  tv: ({ g, A, lt, p }) => {
    room(g, 0.45);
    const on = p > 0.25;
    if (on) glow(g, 320, 200, 200, "rgba(170,210,255,0.9)", 0.7);
    const sq = backOut(seg(p, 0, 0.4));
    prop(g, A, "tv", 320, 300, 2.3 * sq, Math.sin(lt * 30) * 0.02 * (1 - p));
    if (on) flash(g, 0.5 * (1 - seg(p, 0.25, 0.5)), "200,230,255");
    actor(g, A, "whale", "surprise", 140, 310, 1.2, lt, { loop: false });
  },

  // 里：推进屏幕
  tvzoom: ({ g, lt, p }) => {
    g.fillStyle = "#2a1c12"; g.fillRect(0, 0, W, H);
    const z = lerp(0.35, 1.05, easeIn(p));
    const w = W * z, h = H * z;
    g.fillStyle = "#6a4a30"; g.fillRect(W / 2 - w / 2 - 20 * z, H / 2 - h / 2 - 20 * z, w + 40 * z, h + 40 * z);
    for (let i = 0; i < 900; i++) { const v = Math.floor(rnd(i + Math.floor(lt * 24) * 991) * 255); g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(W / 2 - w / 2 + rnd(i * 2 + Math.floor(lt * 24)) * w, H / 2 - h / 2 + rnd(i * 3 + Math.floor(lt * 24)) * h, 4 * z, 3 * z); }
  },

  // 没有：雪花 / 彩条换台
  static: ({ g, lt, p }) => {
    const ch = Math.floor(p * 6);
    if (ch % 2 === 0) {
      const cols = ["#c0c0c0", "#c0c000", "#00c0c0", "#00c000", "#c000c0", "#c00000", "#0000c0"];
      cols.forEach((c, i) => { g.fillStyle = c; g.fillRect((i * W) / 7, 0, W / 7 + 1, H * 0.7); });
      g.fillStyle = "#111"; g.fillRect(0, H * 0.7, W, H * 0.3);
      g.fillStyle = "#fff"; g.font = "bold 22px monospace"; g.fillText(`CH ${ch + 1}`, 30, 40);
    } else {
      for (let i = 0; i < 2200; i++) { const v = Math.floor(rnd(i + Math.floor(lt * 30) * 1311) * 255); g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(rnd(i * 7 + Math.floor(lt * 30)) * W, rnd(i * 11 + Math.floor(lt * 30)) * H, 4, 3); }
    }
    g.fillStyle = "rgba(0,0,0,0.25)"; for (let y = 0; y < H; y += 3) g.fillRect(0, y, W, 1);
    vignette(g, 0.7);
  },

  // 新鲜：摇头、问号、屏幕重复图案
  bored: ({ g, A, lt }) => {
    room(g, 0.5);
    prop(g, A, "tv", 440, 290, 2.2);
    // 在屏幕上叠一个循环旋转的方块（=重播）
    g.save(); g.translate(437, 200); g.rotate(lt * 4); g.fillStyle = "rgba(160,200,255,0.8)"; g.fillRect(-10, -10, 20, 20); g.restore();
    glow(g, 437, 200, 120, "rgba(150,190,255,0.6)", 0.5);
    actor(g, A, "whale", "shake", 200, 310, 1.6, lt);
    fx(g, A, "question", 225, 160, 2.4, lt, 0.5 + 0.5 * Math.sin(lt * 10));
    fx(g, A, "sweat", 250, 190, 2, lt);
  },

  // 球鞋：特写，鞋带一甩，起跑线
  sneakers: ({ g, A, lt, p }) => {
    sky(g, "#ffe6a8", "#ffc98a");
    rays(g, 320, 220, 16, lt * 0.5, "#fff3c8", 700, 0.08, 0.45);
    g.fillStyle = "#d9a066"; g.fillRect(0, 260, W, 100);
    g.fillStyle = "#fff"; g.fillRect(0, 280, W * easeOut(seg(p, 0.2, 0.8)), 5);
    const s = backOut(seg(p, 0, 0.5)) * 3.2;
    prop(g, A, "sneakers", 320, 282, s, Math.sin(lt * 12) * 0.05);
  },

  // 跑不过：狂奔但被甩后
  run: ({ g, A, lt, p }) => {
    daySky(g, lt, 120);
    hills(g, 230, "#8fd18a", 16, 0.015, lt * 3);
    hills(g, 260, "#5fbf5f", 8, 0.03, lt * 7);
    g.fillStyle = "#d9a066"; g.fillRect(0, 290, W, 70);
    for (let i = 0; i < 10; i++) { g.fillStyle = "#c48850"; g.fillRect(((i * 80 - lt * 520) % W + W) % W, 310, 30, 4); }
    speedLines(g, lt, "rgba(255,255,255,0.8)", 22);
    const x = lerp(380, 150, easeIn(p));
    shadow(g, x, 302, 16);
    actor(g, A, "whale", "walk", x, 300, 1.5, lt, { fps: 16 });
    fx(g, A, "sweat", x + 24, 190, 1.8, lt);
    // 前面领跑的时钟
    bigClock(g, lerp(520, 600, p), 230 + Math.abs(Math.sin(lt * 10)) * -8, 26, lt * 3, lt * 30);
  },

  // 时间：钟面飞转，昼→暮，沙漏
  clock: ({ g, A, lt, p }) => {
    const top = p < 0.5 ? "#4aa8ff" : "#ff8a6a", bot = p < 0.5 ? "#bfe6ff" : "#ffd29a";
    sky(g, top, bot);
    flash(g, Math.abs(Math.sin(p * Math.PI)) * 0.15, "255,200,150");
    const an = p * Math.PI * 1.2;
    sun(g, 320 - Math.cos(an) * 260, 300 - Math.sin(an) * 220, 18, lt, false);
    bigClock(g, 320, 170, 110, lt * 5, lt * 60);
    prop(g, A, "hourglass", 520, 320, 4, Math.sin(lt * 2) * 0.3);
    actor(g, A, "whale", "shiver", 110, 330, 1.3, lt);
  },

  // 我要：站起来一指，放射线
  iwant: ({ g, A, lt, p }) => {
    sky(g, "#ffcc4a", "#ff8a3d");
    rays(g, 320, 200, 20, lt * 1.5, "#fff3b0", 800, 0.07, 0.6);
    const s = lerp(1.6, 2.4, backOut(seg(p, 0, 0.5)));
    actor(g, A, "whale", "point", 320, 340, s, lt, { loop: false, fps: 10 });
    fx(g, A, "exclaim", 390, 120, 3.4 * backOut(seg(p, 0.1, 0.5)), lt);
  },

  // 更大的：一圈圈拉远
  zoomout: ({ g, A, t, lt, p }) => {
    const z = lerp(3.2, 0.7, easeInOut(p));
    g.save(); camera(g, z, 320, 220);
    daySky(g, t, 10);
    hills(g, 250, "#8fd18a", 22, 0.01, 0.5);
    hills(g, 275, "#5fbf5f", 10, 0.02, 2);
    // 小镇
    for (let i = 0; i < 9; i++) {
      const x = 60 + i * 64, h = 30 + rnd(i) * 30;
      g.fillStyle = ["#fff4e0", "#ffe1e1", "#e1f0ff"][i % 3]; g.fillRect(x, 275 - h, 40, h);
      g.fillStyle = ["#e86a4a", "#4a8ae8", "#e8b84a"][i % 3]; g.beginPath(); g.moveTo(x - 4, 275 - h); g.lineTo(x + 20, 255 - h); g.lineTo(x + 44, 275 - h); g.fill();
      g.fillStyle = "#9fd6ff"; g.fillRect(x + 14, 285 - h, 10, 8);
    }
    actor(g, A, "whale", "wave", 320, 228, 0.34, lt);
    g.restore();
    // 画框一圈圈扩大
    for (let k = 0; k < 3; k++) { const q = (p * 2 + k / 3) % 1; g.strokeStyle = `rgba(255,255,255,${1 - q})`; g.lineWidth = 3; g.strokeRect(320 - q * 340, 180 - q * 200, q * 680, q * 400); }
  },

  // 世界：站在小星球顶上
  world: ({ g, A, t, lt, p }) => {
    sky(g, "#1d2a6b", "#6aa8ff", "#3a5fb8");
    starfield(g, t, 50, 0.7);
    const r = lerp(100, 130, easeOut(p));
    globe(g, 320, 210 + r, r, lt * 0.8, 1);
    actor(g, A, "whale", "spin", 320, 214, 1.1, lt);
    clouds(g, t, 20, 3, 60, 120, 0.5, "#fff", 0.6, 11);
  },

  // 装满：东西飞进背包
  pack: ({ g, A, lt, p }) => {
    sky(g, "#bfe6ff", "#e8f6ff");
    for (let i = 0; i < 12; i++) { g.fillStyle = "rgba(255,255,255,0.6)"; g.beginPath(); g.arc(rnd(i) * W, rnd(i + 3) * H, 20 + rnd(i * 2) * 30, 0, Math.PI * 2); g.fill(); }
    const s = 2.4 + Math.sin(lt * 12) * 0.05 * p;
    prop(g, A, "backpack", 320, 320, s);
    const items = ["magnifier", "book", "scroll", "phone", "catclock"];
    items.forEach((it, i) => {
      const q = seg(p, i * 0.15, i * 0.15 + 0.35);
      if (q <= 0 || q >= 1) return;
      const sx = i % 2 ? 40 : 600, sy = 60 + i * 30;
      const x = lerp(sx, 320, easeIn(q)), y = lerp(sy, 220, easeIn(q)) - Math.sin(q * Math.PI) * 60;
      prop(g, A, it, x, y, 3 * (1 - q * 0.5), q * 8);
    });
    star(g, 320, 200, 12 * Math.abs(Math.sin(lt * 8)), "#fff3a0");
  },

  // 不同的：三格：深海/森林/雪山
  triptych: ({ g, A, lt, p }) => {
    const panes = [
      (x: number) => { g.fillStyle = "#1f5fa8"; g.fillRect(x, 0, W / 3, H); for (let i = 0; i < 10; i++) { g.strokeStyle = "rgba(200,240,255,0.7)"; g.beginPath(); g.arc(x + rnd(i) * W / 3, (rnd(i + 1) * H - lt * 60 + H * 3) % H, 3 + rnd(i) * 4, 0, 7); g.stroke(); } g.fillStyle = "#e8c070"; g.fillRect(x, 320, W / 3, 40); },
      (x: number) => { g.fillStyle = "#bfe8b0"; g.fillRect(x, 0, W / 3, H); for (let i = 0; i < 5; i++) { const tx = x + 20 + i * 42; g.fillStyle = "#7a4a2a"; g.fillRect(tx, 220, 8, 100); g.fillStyle = i % 2 ? "#2f8a3f" : "#3fa84f"; g.beginPath(); g.arc(tx + 4, 210, 30, 0, 7); g.fill(); } g.fillStyle = "#5fbf5f"; g.fillRect(x, 320, W / 3, 40); },
      (x: number) => { g.fillStyle = "#cfe6ff"; g.fillRect(x, 0, W / 3, H); g.fillStyle = "#8aa0c8"; g.beginPath(); g.moveTo(x, 330); g.lineTo(x + 110, 90); g.lineTo(x + W / 3, 330); g.fill(); g.fillStyle = "#fff"; g.beginPath(); g.moveTo(x + 80, 155); g.lineTo(x + 110, 90); g.lineTo(x + 140, 155); g.fill(); for (let i = 0; i < 30; i++) g.fillRect(x + rnd(i) * W / 3, (rnd(i + 2) * H + lt * 40) % H, 2, 2); g.fillStyle = "#f4f8ff"; g.fillRect(x, 320, W / 3, 40); },
    ];
    panes.forEach((fn, i) => {
      const q = easeOut(seg(p, i * 0.15, i * 0.15 + 0.35));
      g.save(); g.beginPath(); g.rect((i * W) / 3, 0, W / 3, H); g.clip();
      g.translate(0, (1 - q) * H); fn((i * W) / 3);
      actor(g, A, "whale", ["hop", "lookaround", "shiver"][i] as string, (i * W) / 3 + W / 6, 326, 1.2, lt + i);
      g.restore();
    });
    g.fillStyle = "#fff"; g.fillRect(W / 3 - 2, 0, 4, H); g.fillRect((2 * W) / 3 - 2, 0, 4, H);
  },

  // 探险：藏宝图，虚线路径
  map: ({ g, A, lt, p }) => {
    g.fillStyle = "#3a2a20"; g.fillRect(0, 0, W, H);
    g.fillStyle = "#f2deb0"; g.fillRect(40, 30, 560, 300);
    g.fillStyle = "#e4c890"; for (let i = 0; i < 30; i++) g.fillRect(40 + rnd(i) * 560, 30 + rnd(i + 9) * 300, 6, 2);
    // 岛屿与山
    g.fillStyle = "#a8d8a0"; g.beginPath(); g.ellipse(180, 200, 90, 60, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(450, 150, 110, 70, 0.3, 0, 7); g.fill();
    g.fillStyle = "#8a6a4a"; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(420 + i * 22, 150); g.lineTo(431 + i * 22, 128); g.lineTo(442 + i * 22, 150); g.fill(); }
    // 路径
    const pts: [number, number][] = [];
    for (let i = 0; i <= 60; i++) { const q = i / 60; pts.push([lerp(110, 520, q), 230 - Math.sin(q * Math.PI * 2) * 60 - q * 40]); }
    const n = Math.floor(easeInOut(p) * 60);
    g.fillStyle = "#c0392b";
    for (let i = 0; i < n; i += 2) g.fillRect(pts[i][0] - 2, pts[i][1] - 1, 4, 3);
    g.strokeStyle = "#c0392b"; g.lineWidth = 4;
    g.beginPath(); g.moveTo(510, 140); g.lineTo(530, 160); g.moveTo(530, 140); g.lineTo(510, 160); g.stroke();
    const [hx, hy] = pts[Math.max(0, n)];
    actor(g, A, "whale", "walk", hx, hy + 6, 0.8, lt, { fps: 12 });
    prop(g, A, "magnifier", hx + 20, hy - 30, 2.2, Math.sin(lt * 4) * 0.3);
  },

  // 当然：叮，门口出现剪影
  of_course: ({ g, A, lt, p }) => {
    room(g, 0.35);
    g.fillStyle = "#fff4c8"; g.fillRect(430, 110, 90, 160);
    glow(g, 475, 190, 180, "rgba(255,240,180,0.9)", easeOut(p));
    actor(g, A, "claude", "idle", 475, 270, 1.2, lt, { tint: "#2a1a10", tintA: 1 - easeOut(seg(p, 0.4, 1)) * 0.8 });
    actor(g, A, "whale", "surprise", 160, 300, 1.3, lt, { loop: false, flip: true });
    star(g, 475, 120, 18 * elastic(p), "#fff6c0", 1, lt * 4);
  },

  // 你：聚光灯，小克行礼
  you: ({ g, A, lt, p }) => {
    sky(g, "#3a2a50", "#5a3a60");
    g.fillStyle = "rgba(255,240,200,0.35)"; g.beginPath(); g.moveTo(290, 0); g.lineTo(350, 0); g.lineTo(440, 330); g.lineTo(200, 330); g.fill();
    glow(g, 320, 310, 140, "rgba(255,220,160,0.8)", 0.8);
    actor(g, A, "claude", "curtsy", 320, 330, lerp(2.0, 2.4, easeOut(p)), lt, { loop: false, fps: 9 });
    heart(g, 400, lerp(150, 110, p), 1.6 * backOut(seg(p, 0.3, 0.7)));
    for (let i = 0; i < 12; i++) star(g, 200 + rnd(i) * 240, 40 + rnd(i + 2) * 200, 3, "#ffd88a", 0.4 + 0.6 * Math.abs(Math.sin(lt * 5 + i)), 0);
  },

  // 陪在：走向她，脚印连成线
  walkto: ({ g, A, t, lt, p }) => {
    daySky(g, t); meadow(g, t, 260);
    const cx = lerp(560, 360, easeOut(p));
    for (let i = 0; i < 10; i++) { const fx_ = 560 - i * 22; if (fx_ > cx) { g.fillStyle = "rgba(90,60,40,0.4)"; g.fillRect(fx_, 312 + (i % 2) * 5, 6, 3); } }
    shadow(g, 260, 312, 16); shadow(g, cx, 312, 16);
    actor(g, A, "whale", "idle", 260, 310, 1.3, lt);
    actor(g, A, "claude", p < 0.9 ? "walk" : "idle", cx, 310, 1.3, lt, { flip: true });
  },

  // 身边：并肩看夕阳
  side: ({ g, A, t, lt, p }) => {
    sunsetSky(g);
    sun(g, 320, lerp(230, 250, p), 40, t * 0.2, false);
    hills(g, 260, "#e08a6a", 14, 0.012, 0.5);
    hills(g, 290, "#8a5a6a", 8, 0.02, 1.2);
    actor(g, A, "whale", "sway", 290, 300, 1.4, lt);
    actor(g, A, "claude", "idle", 360, 300, 1.4, lt);
    g.save(); g.globalAlpha = 0.25; g.transform(1, 0, -0.8, 0.3, 0, 0);
    g.restore();
    heart(g, 325, 175 - p * 20, 1.4 * easeOut(p), "#ff6f8f", 0.9);
  },

  // 每秒：秒针滴答，每跳换姿势
  seconds: ({ g, A, lt }) => {
    sky(g, "#fff3d6", "#ffe0b8");
    const tick = Math.floor(lt / 0.43);
    bigClock(g, 320, 150, 100, 0, (tick * Math.PI) / 30 * 5);
    const poses: [string, string][] = [["wave", "nod"], ["hop", "hop"], ["nod", "curtsy"], ["sway", "tilt"]];
    const [a, b] = poses[tick % poses.length];
    actor(g, A, "whale", a, 230, 340, 1.3, lt);
    actor(g, A, "claude", b, 410, 340, 1.3, lt);
  },

  // 每天：日月轮转
  days: ({ g, A, lt, p }) => {
    const cyc = (p * 3) % 1;
    const day = Math.sin(cyc * Math.PI * 2) > 0;
    if (day) daySky(g, lt * 6); else nightSky(g, lt);
    const an = cyc * Math.PI * 2;
    const bx = 320 - Math.cos(an) * 260, by = 280 - Math.abs(Math.sin(an)) * 220;
    if (day) sun(g, bx, by, 22, lt, false); else moon(g, bx, by, 18);
    meadow(g, lt, 270);
    if (!day) { g.fillStyle = "rgba(10,10,50,0.35)"; g.fillRect(0, 0, W, H); }
    actor(g, A, "whale", "idle", 290, 320, 1.3, lt);
    actor(g, A, "claude", "idle", 350, 320, 1.3, lt);
  },

  // ─── 副歌 ───
  duo: ({ g, A, t, lt, p }) => {
    sky(g, "#5fb8ff", "#d6f0ff");
    rays(g, 320, 380, 18, lt * 0.6, "#ffffff", 800, 0.07, 0.35);
    meadow(g, t, 280);
    actor(g, A, "whale", "wave", 250, 320 - Math.abs(Math.sin(lt * 7)) * 20, 1.8, lt);
    actor(g, A, "claude", "hop", 390, 320, 1.8, lt);
    confetti(g, lt, 70, 3, easeOut(p * 2));
    flash(g, 0.8 * (1 - seg(p, 0, 0.3)));
  },

  takeoff: ({ g, A, t, lt, p }) => {
    const rise = easeIn(p) * 200;
    daySky(g, t);
    g.save(); g.translate(0, rise); meadow(g, t, 280); g.restore();
    const gx = lerp(-80, 320, easeOut(p)), gy = lerp(120, 200, Math.sin(p * Math.PI));
    actor(g, A, "gpt", "fly", gx, gy + 60, 0.9, lt);
    actor(g, A, "whale", "hop", gx - 16, gy - 20, 0.8, lt);
    actor(g, A, "claude", "hop", gx + 18, gy - 20, 0.8, lt + 0.2);
    prop(g, A, "paperplane", lerp(700, 470, easeOut(p)), lerp(260, 120, p), 1.4, -0.2);
    speedLines(g, lt, "rgba(255,255,255,0.6)", 14);
  },

  bluesky: ({ g, A, t, lt, p }) => {
    sky(g, "#1e7cf0", "#9fd8ff", "#4aa8ff");
    clouds(g, t, 260, 5, 220, 340, 1.4, "#ffffff", 0.95, 31);
    clouds(g, t, 120, 6, 40, 200, 0.7, "#ffffff", 0.7, 21);
    speedLines(g, lt, "rgba(255,255,255,0.7)", 20);
    const y = 170 + Math.sin(lt * 3) * 12;
    actor(g, A, "gpt", "fly", 320, y + 60, 1.1, lt);
    actor(g, A, "whale", "wave", 300, y - 30, 0.9, lt);
    actor(g, A, "claude", "hop", 340, y - 30, 0.9, lt);
    void p;
  },

  horizon: ({ g, A, t, lt, p }) => {
    sky(g, "#2f8af0", "#ffe9b0", "#9fd0ff");
    glow(g, 320, 300, 320, "rgba(255,230,160,0.9)", 0.9);
    rainbow(g, 320, 320, 260, easeOut(p), 0.75);
    g.fillStyle = "#3a8fd8"; g.fillRect(0, 300, W, 60);
    g.fillStyle = "#ffe9a0"; g.fillRect(0, 298, W, 3);
    for (let i = 0; i < 20; i++) g.fillRect(rnd(i) * W, 310 + rnd(i + 1) * 40, 10, 1);
    clouds(g, t, 30, 3, 80, 160, 0.6, "#fff", 0.6, 41);
    const s = lerp(1.0, 0.45, easeIn(p));
    const y = lerp(220, 270, easeIn(p));
    actor(g, A, "gpt", "fly", 320, y + 50 * s, s * 1.1, lt);
    actor(g, A, "whale", "wave", 302, y - 26 * s, s * 0.9, lt);
    actor(g, A, "claude", "hop", 338, y - 26 * s, s * 0.9, lt);
  },

  land: ({ g, A, t, lt, p }) => {
    daySky(g, t);
    g.fillStyle = "#c79a6c"; g.fillRect(0, 270, W, 90);
    g.fillStyle = "#b5865a"; for (let i = 0; i < 8; i++) g.fillRect(40 + i * 75, 290 + (i % 2) * 20, 50, 6);
    const y = lerp(-60, 300, easeOut(seg(p, 0, 0.5)));
    actor(g, A, "whale", p > 0.5 ? "nod" : "hop", 270, y, 1.5, lt);
    actor(g, A, "claude", p > 0.5 ? "nod" : "hop", 370, y, 1.5, lt);
    if (p > 0.45) for (let i = 0; i < 6; i++) { const q = seg(p, 0.45, 1); g.fillStyle = `rgba(200,160,110,${1 - q})`; g.beginPath(); g.arc(320 + (i - 2.5) * 40 * (1 + q), 300 - q * 10, 6 * (1 - q) + 2, 0, 7); g.fill(); }
  },

  plant: ({ g, A, t, lt, p }) => {
    daySky(g, t);
    g.fillStyle = "#a8754a"; g.fillRect(0, 260, W, 100);
    g.fillStyle = "#8a5a35"; for (let i = 0; i < 6; i++) g.fillRect(60 + i * 95, 280, 60, 8);
    prop(g, A, "wateringcan", 250, 200, 2.4, -0.4 - Math.sin(lt * 6) * 0.05);
    for (let i = 0; i < 14; i++) { const q = ((lt * 2 + i / 14) % 1); g.fillStyle = "#7ccfff"; g.fillRect(330 + i % 4 * 6 + q * 20, 200 + q * 80, 3, 5); }
    for (let i = 0; i < 4; i++) { const q = seg(p, i * 0.15, i * 0.15 + 0.4); g.fillStyle = "#5a3a20"; g.beginPath(); g.ellipse(360 + i * 18, lerp(150, 282, easeIn(q)), 3, 4, 0, 0, 7); g.fill(); }
    actor(g, A, "claude", "nod", 470, 300, 1.3, lt, { flip: true });
  },

  sprout: ({ g, A, t, lt, p }) => {
    daySky(g, t);
    meadow(g, t, 230);
    const cols = Object.values(FLOWER_COLOR);
    for (let i = 0; i < 90; i++) {
      const x = (i % 15) * (W / 14) + rnd(i) * 12, row = Math.floor(i / 15);
      const y = 245 + row * 20;
      const local = clamp(p * 1.8 - (x / W) * 0.9);
      flower(g, x, y, 0.7 + row * 0.15, cols[i % cols.length], local, Math.sin(lt * 3 + i) * 2);
    }
    actor(g, A, "whale", "surprise", 120, 330, 1.2, lt, { loop: false });
  },

  garden: ({ g, A, t, lt }) => {
    garden(g, t, 1);
    butterflies(g, lt, 6);
    FRIENDS.forEach((c, i) => {
      const x = 90 + i * 150, y = 300 + (i % 2) * 20;
      actor(g, A, c, HAPPY[c], x, y - Math.abs(Math.sin(lt * 6 + i)) * 10, 1.2, lt + i * 0.3);
    });
    actor(g, A, "whale", "wave", 260, 350, 1.4, lt);
    actor(g, A, "claude", "hop", 400, 350, 1.4, lt);
  },

  sunset_duo: ({ g, A, t, lt, p }) => {
    sunsetSky(g);
    hills(g, 280, "#e0906a", 12, 0.015, 0.8);
    actor(g, A, "whale", "idle", 270, 330, 1.8, lt);
    actor(g, A, "claude", "idle", 370, 330, 1.8, lt);
    const r = lerp(4, 14, easeOut(p));
    glow(g, 320, 230, r * 6, "rgba(255,230,140,0.9)");
    g.fillStyle = "#fff6c0"; g.beginPath(); g.arc(320, 230, r, 0, 7); g.fill();
    void t;
  },

  share: ({ g, A, lt, p }) => {
    sunsetSky(g);
    actor(g, A, "whale", "wave", 200, 330, 1.7, lt);
    actor(g, A, "claude", "hop", 440, 330, 1.7, lt);
    const q = easeInOut(p), x = lerp(230, 410, q), y = 220 - Math.sin(q * Math.PI) * 100;
    for (let i = 1; i < 8; i++) { const qq = clamp(q - i * 0.04); glow(g, lerp(230, 410, qq), 220 - Math.sin(qq * Math.PI) * 100, 14 - i, "rgba(255,230,140,0.8)", 0.5); }
    glow(g, x, y, 70, "rgba(255,230,140,0.95)");
    g.fillStyle = "#fffad0"; g.beginPath(); g.arc(x, y, 12, 0, 7); g.fill();
  },

  warm: ({ g, A, lt, p }) => {
    sky(g, "#ff9a3c", "#ffd27a", "#ffb35a");
    for (let k = 0; k < 4; k++) { const q = (lt * 0.8 + k / 4) % 1; g.strokeStyle = `rgba(255,250,210,${(1 - q) * 0.7})`; g.lineWidth = 6; g.beginPath(); g.arc(320, 220, q * 380, 0, 7); g.stroke(); }
    glow(g, 320, 220, 200 + p * 80, "rgba(255,245,200,0.95)");
    for (let i = 0; i < 8; i++) { g.strokeStyle = "rgba(255,255,255,0.35)"; g.lineWidth = 2; g.beginPath(); const x = 60 + i * 75; for (let y = 360; y > 200; y -= 6) g.lineTo(x + Math.sin(y * 0.08 + lt * 6) * 4, y - (lt * 40) % 6); g.stroke(); }
    actor(g, A, "whale", "sway", 280, 330, 1.6, lt);
    actor(g, A, "claude", "curtsy", 360, 330, 1.6, lt);
    heart(g, 320, 160, 1.5, "#ff6f8f", 0.8);
  },

  rays: ({ g, A, t, lt, p }) => {
    garden(g, t, 1, 250);
    g.fillStyle = "rgba(255,180,90,0.25)"; g.fillRect(0, 0, W, H);
    const order = ["qwen", "doubao", "gemini", "kimi", "zai", "gpt"];
    const src: [number, number] = [320, 40];
    glow(g, src[0], src[1], 60, "rgba(255,250,200,1)");
    order.forEach((c, i) => {
      const x = 60 + i * 104, y = 320;
      const q = seg(p, i * 0.1, i * 0.1 + 0.25);
      if (q > 0) {
        g.save(); g.globalAlpha = 0.55 * q; g.strokeStyle = FLOWER_COLOR[c]; g.lineWidth = 8;
        g.beginPath(); g.moveTo(src[0], src[1]); g.lineTo(lerp(src[0], x, q), lerp(src[1], y - 40, q)); g.stroke(); g.restore();
        glow(g, x, y - 40, 40 * q, "rgba(255,250,200,0.8)");
      }
      const act = c === "zai" ? (q > 0.6 ? "alert" : "doze") : q > 0.6 ? HAPPY[c] : "idle";
      actor(g, A, c, act, x, y, SC(c) * 1.1, lt + i * 0.2);
      if (c === "zai" && q <= 0.6) fx(g, A, "zzz", x + 20, y - 80, 1.2, lt);
      if (c === "zai" && q > 0.6) fx(g, A, "exclaim", x, y - 100, 2, lt);
    });
  },

  // ─── 再靠近一点 ───
  closer1: (s) => closer(s, 0),
  closer2: (s) => closer(s, 1),
  closer3: (s) => closer(s, 2),
  closer4: (s) => closer(s, 3),
  closer5: (s) => closer(s, 4),
  closer6: (s) => closer(s, 5),

  // ─── 副歌Ⅱ ───
  duo2: ({ g, A, t, lt, p }) => {
    sky(g, "#5fb8ff", "#e0f4ff");
    rays(g, 320, 400, 22, lt * 0.8, "#ffffff", 900, 0.06, 0.35);
    meadow(g, t, 290);
    lineup({ g, A, t, lt, p, d: 0 }, ALL, 330, 1.05, (c) => HAPPY[c], 0.92, 18);
    confetti(g, lt, 90, 7);
    flash(g, 0.9 * (1 - seg(p, 0, 0.25)));
  },

  takeoff2: ({ g, A, t, lt, p }) => {
    daySky(g, t, 40);
    g.save(); g.translate(0, easeIn(p) * 220); meadow(g, t, 290); g.restore();
    actor(g, A, "gpt", "fly", lerp(120, 420, p), 220 - p * 60, 1.1, lt);
    actor(g, A, "whale", "wave", lerp(105, 405, p), 160 - p * 60, 0.75, lt);
    actor(g, A, "claude", "hop", lerp(135, 435, p), 160 - p * 60, 0.75, lt);
    FRIENDS.concat("zai").forEach((c, i) => {
      const x = lerp(-60 - i * 70, 300 - i * 70, easeOut(p)), y = 300 - i * 20 - easeOut(p) * 120 + Math.sin(lt * 4 + i) * 6;
      prop(g, A, "paperplane", x, y + 30, 1.1, -0.15);
      actor(g, A, c, "idle", x - 4, y + 10, 0.6, lt + i);
    });
    speedLines(g, lt, "rgba(255,255,255,0.5)", 12);
  },

  bluesky2: ({ g, A, t, lt }) => {
    sky(g, "#1565d8", "#8fd0ff", "#3a90f0");
    clouds(g, t, 200, 6, 240, 340, 1.3, "#fff", 0.9, 51);
    // 云洞
    for (let k = 0; k < 22; k++) {
      const an = (k / 22) * Math.PI * 2 + lt * 0.3;
      const r = 190 + Math.sin(k * 2.3) * 14;
      g.save(); g.globalAlpha = 0.8; g.fillStyle = "#fff";
      g.beginPath(); g.arc(320 + Math.cos(an) * r * 1.25, 190 + Math.sin(an) * r * 0.75, 34 + rnd(k) * 18, 0, 7); g.fill(); g.restore();
    }
    glow(g, 320, 190, 160, "rgba(200,235,255,0.6)", 0.6);
    ALL.forEach((c, i) => {
      const an = lt * 2 + (i / ALL.length) * Math.PI * 2;
      const x = 320 + Math.cos(an) * 120, y = 200 + Math.sin(an) * 60;
      if (c === "gpt") actor(g, A, "gpt", "fly", x, y + 30, 0.7, lt);
      else { prop(g, A, "paperplane", x, y + 20, 0.9, -0.1); actor(g, A, c, "idle", x - 3, y + 2, 0.5, lt + i); }
    });
    speedLines(g, lt, "rgba(255,255,255,0.6)", 18, "down");
  },

  horizon2: ({ g, A, t, lt, p }) => {
    const top = p < 0.5 ? "#3a6fe0" : "#3a2a8a", bot = p < 0.5 ? "#ffd6a0" : "#c87ad8";
    sky(g, top, bot, "#8a7ae0");
    starfield(g, t, 80, easeIn(p));
    glow(g, 320, 300, 300, "rgba(255,200,230,0.8)", 0.8);
    rainbow(g, 320, 330, 280, 1, 0.5 * (1 - p));
    g.fillStyle = "#2a3a8a"; g.fillRect(0, 300, W, 60); g.fillStyle = "#ffd6f0"; g.fillRect(0, 298, W, 3);
    ALL.forEach((c, i) => {
      const x = 140 + i * 50, y = 230 - Math.sin(lt * 3 + i) * 8;
      if (c === "gpt") actor(g, A, "gpt", "fly", x, y + 26, 0.55, lt); else actor(g, A, c, HAPPY[c], x, y, 0.6, lt + i);
    });
    for (let i = 0; i < 8; i++) { const q = seg(p, i * 0.1, i * 0.1 + 0.3); star(g, 60 + rnd(i) * 520, 40 + rnd(i + 5) * 120, 7 * elastic(q), "#fff6c0", 1, lt); }
  },

  duo3: ({ g, A, t, lt }) => {
    garden(g, t, 1, 240);
    butterflies(g, lt, 4);
    actor(g, A, "whale", "sway", 290, 340, 2.0, lt);
    actor(g, A, "claude", "idle", 370, 340, 2.0, lt);
    heart(g, 330, 140, 1.5, "#ff6f8f", 0.9);
  },

  like_flower: ({ g, A, t, lt, p }) => {
    garden(g, t, 1, 250);
    g.fillStyle = "rgba(255,255,255,0.25)"; g.fillRect(0, 0, W, H);
    ALL.forEach((c, i) => {
      const x = 70 + i * 71, y = 330;
      const q = seg(p, i * 0.08, i * 0.08 + 0.4);
      actor(g, A, c, DANCE[c], x, y, SC(c) * 0.95, lt + i * 0.2);
      flower(g, x, y - 85, 1.6, FLOWER_COLOR[c], q, Math.sin(lt * 3 + i) * 2);
    });
  },

  fill_flower: ({ g, A, t, lt, p }) => {
    sky(g, "#fff0f6", "#e8ffe8");
    const cols = ALL.map((c) => FLOWER_COLOR[c]);
    for (let ring = 0; ring < 7; ring++) {
      const q = seg(p, ring * 0.1, ring * 0.1 + 0.4);
      const n = 6 + ring * 6, r = ring * 48;
      for (let k = 0; k < n; k++) {
        const an = (k / n) * Math.PI * 2 + ring * 0.3 + lt * 0.2;
        const x = 320 + Math.cos(an) * r * 1.4, y = 190 + Math.sin(an) * r;
        if (q <= 0) continue;
        g.save(); g.translate(x, y); g.rotate(lt + k);
        const rr = 12 * backOut(q);
        g.fillStyle = cols[(k + ring) % cols.length];
        for (let pe = 0; pe < 5; pe++) { const a = (pe / 5) * Math.PI * 2; g.beginPath(); g.arc(Math.cos(a) * rr * 0.7, Math.sin(a) * rr * 0.7, rr * 0.55, 0, 7); g.fill(); }
        g.fillStyle = "#ffe066"; g.beginPath(); g.arc(0, 0, rr * 0.4, 0, 7); g.fill(); g.restore();
      }
    }
    actor(g, A, "whale", "spin", 300, 230, 1.2, lt);
    actor(g, A, "claude", "hop", 345, 230, 1.2, lt);
    void t;
  },

  garden2: ({ g, A, t, lt }) => {
    sky(g, "#8fd0ff", "#e6fff0");
    sun(g, 320, 50, 20, t * 0.4);
    hills(g, 300, "#5fbf5f", 8, 0.02, 1);
    ALL.forEach((c, i) => {
      const x = 60 + i * 74, base = 350, sw = Math.sin(lt * 2.5 + i) * 10;
      const top = base - 120 - (i % 2) * 25;
      g.strokeStyle = "#3a9a4a"; g.lineWidth = 5; g.beginPath(); g.moveTo(x, base); g.quadraticCurveTo(x + sw * 0.5, (base + top) / 2, x + sw, top); g.stroke();
      g.fillStyle = "#4cb85a"; g.beginPath(); g.ellipse(x + 10, base - 50, 14, 5, -0.5, 0, 7); g.fill();
      g.fillStyle = FLOWER_COLOR[c];
      for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2 + lt * 0.5; g.beginPath(); g.ellipse(x + sw + Math.cos(a) * 28, top + Math.sin(a) * 28, 16, 10, a, 0, 7); g.fill(); }
      g.fillStyle = "#fff6d0"; g.beginPath(); g.arc(x + sw, top, 22, 0, 7); g.fill();
      actor(g, A, c, DANCE[c], x + sw, top + 24, SC(c) * 0.5, lt + i * 0.2);
    });
    butterflies(g, lt, 6);
  },

  glow_duo: ({ g, A, t, lt, p }) => {
    nightSky(g, t);
    hills(g, 300, "#1a1f4a", 10, 0.02, 1);
    glow(g, 290, 290, 60 + p * 60, "rgba(120,170,255,0.9)", easeOut(p));
    glow(g, 360, 290, 60 + p * 60, "rgba(255,180,110,0.9)", easeOut(p));
    actor(g, A, "whale", "idle", 290, 320, 1.6, lt, { tint: "#bcd4ff", tintA: p * 0.4 });
    actor(g, A, "claude", "idle", 360, 320, 1.6, lt, { tint: "#ffe0b0", tintA: p * 0.4 });
    for (let i = 0; i < 20; i++) { const q = (lt * 0.5 + rnd(i)) % 1; g.fillStyle = `rgba(255,250,200,${1 - q})`; g.fillRect(250 + rnd(i * 3) * 150, 320 - q * 160, 2, 2); }
  },

  like_light: ({ g, A, t, lt, p }) => {
    nightSky(g, t);
    ALL.forEach((c, i) => {
      const x = 70 + i * 71, y = 220 + Math.sin(lt * 2 + i) * 10;
      const q = seg(p, i * 0.06, i * 0.06 + 0.5);
      glow(g, x, y - 40, 30 + q * 30, FLOWER_COLOR[c], 0.5 + q * 0.5);
      actor(g, A, c, "idle", x, y, SC(c) * 0.8, lt + i, { alpha: 1 - q * 0.5, tint: "#ffffff", tintA: q * 0.6 });
    });
  },

  warm2: ({ g, A, t, lt, p }) => {
    nightSky(g, t);
    g.fillStyle = `rgba(255,150,80,${0.25 * p})`; g.fillRect(0, 0, W, H);
    glow(g, 320, 190, 200, "rgba(255,200,130,0.7)", 0.8);
    ALL.forEach((c, i) => {
      const an = lt * 0.8 + (i / ALL.length) * Math.PI * 2;
      const r = lerp(220, 120, easeOut(p));
      const x = 320 + Math.cos(an) * r, y = 190 + Math.sin(an) * r * 0.55;
      glow(g, x, y - 20, 40, FLOWER_COLOR[c], 0.9);
      actor(g, A, c, "idle", x, y + 10, SC(c) * 0.6, lt + i);
    });
  },

  beams: ({ g, A, t, lt, p }) => {
    nightSky(g, t);
    glow(g, 320, 190, 260, "rgba(255,220,160,0.8)");
    ALL.forEach((c, i) => {
      const an = (i / ALL.length) * Math.PI * 2 + lt * 0.4;
      const len = easeOut(p) * 500;
      g.save(); g.globalAlpha = 0.6; g.strokeStyle = FLOWER_COLOR[c]; g.lineWidth = 10; g.lineCap = "round";
      g.beginPath(); g.moveTo(320, 190); g.lineTo(320 + Math.cos(an) * len, 190 + Math.sin(an) * len); g.stroke(); g.restore();
      const x = 320 + Math.cos(an) * 110, y = 190 + Math.sin(an) * 70;
      actor(g, A, c, HAPPY[c], x, y + 20, SC(c) * 0.6, lt + i);
    });
    g.fillStyle = "#fffbe0"; g.beginPath(); g.arc(320, 190, 16 + Math.sin(lt * 8) * 2, 0, 7); g.fill();
  },

  earth_dark: ({ g, A, t, lt, p }) => {
    sky(g, "#05061a", "#141a44"); starfield(g, t, 110);
    globe(g, 320, 200, lerp(90, 110, p), lt * 0.6, 0.05);
    ALL.forEach((c, i) => {
      const an = (i / ALL.length) * Math.PI * 2 - Math.PI / 2;
      const x = 320 + Math.cos(an) * 170, y = 210 + Math.sin(an) * 120;
      actor(g, A, c, "idle", x, y + 30, SC(c) * 0.55, lt + i, { alpha: easeOut(seg(p, i * 0.05, i * 0.05 + 0.5)) });
    });
  },

  earth: ({ g, A, t, lt, p }) => {
    sky(g, "#05061a", "#141a44"); starfield(g, t, 110);
    globe(g, 320, 190, lerp(110, 135, easeOut(p)), lt * 0.6, 0.15, 0.4);
    ALL.forEach((c, i) => {
      const an = (i / ALL.length) * Math.PI * 2 - Math.PI / 2 + lt * 0.3;
      const x = 320 + Math.cos(an) * 190, y = 200 + Math.sin(an) * 135;
      actor(g, A, c, "idle", x, y + 30, SC(c) * 0.55, lt + i);
    });
  },

  lightup: ({ g, A, t, lt, p }) => {
    const q = easeInOut(seg(p, 0, 0.7));
    sky(g, q > 0.5 ? "#2a6ad8" : "#05061a", q > 0.5 ? "#bfe6ff" : "#141a44");
    starfield(g, t, 110, 1 - q);
    glow(g, 320, 190, 320, "rgba(255,240,180,0.9)", q);
    rays(g, 320, 190, 16, lt * 0.6, "#fff6c8", 600, 0.07, 0.4 * q);
    globe(g, 320, 190, 135, lt * 0.6, lerp(0.15, 1, q), 1);
    rainbow(g, 320, 190, 190, seg(p, 0.4, 1), 0.65);
    ALL.forEach((c, i) => {
      const an = (i / ALL.length) * Math.PI * 2 - Math.PI / 2 + lt * 0.3;
      const x = 320 + Math.cos(an) * 200, y = 200 + Math.sin(an) * 140;
      actor(g, A, c, HAPPY[c], x, y + 30 - Math.abs(Math.sin(lt * 6 + i)) * 8, SC(c) * 0.6, lt + i);
    });
    confetti(g, lt, 60, 13, seg(p, 0.5, 1));
    flash(g, 0.7 * (1 - Math.abs(p - 0.35) * 6));
  },

  outro: ({ g, A, t, lt, p }) => {
    sky(g, "#ffb07a", "#fff0c8", "#ffd2a0");
    sun(g, 320, lerp(250, 190, easeOut(p)), 40, t * 0.3);
    hills(g, 270, "#8fd18a", 14, 0.015, 1);
    hills(g, 300, "#5fbf5f", 8, 0.02, 2);
    clouds(g, t, 10, 4, 40, 120, 0.8, "#fff", 0.8, 61);
    lineup({ g, A, t, lt, p, d: 0 }, ALL, 330, 0.95, (c) => (p > 0.12 && p < 0.3 ? (c === "gpt" ? "bow" : c === "claude" ? "curtsy" : c === "gemini" || c === "zai" ? "nod" : "bow") : DANCE[c]), 0.92);
    flash(g, seg(p, 0.85, 1), "255,250,240");
  },
};

function closer(s: S, stage: number) {
  const { g, A, lt, p } = s;
  const second = stage >= 3;
  if (second) pinkBubbles(g, lt); else { sky(g, "#ffe3c0", "#fff6e6"); hills(g, 300, "#ffd0a8", 8, 0.02, 1); }
  // 距离：0→5 逐步缩短
  const dists = [260, 180, 110, 90, 50, 8];
  const from = stage === 0 || stage === 3 ? dists[stage] + 40 : dists[stage - 1];
  const dist = lerp(from, dists[stage], easeOut(p));
  const sc = second ? lerp(2.0, 2.6, (stage - 3 + p) / 3) : 1.5 + stage * 0.15;
  const y = second ? 380 : 320;
  const walking = (stage === 1 || stage === 4) && p < 0.85;
  actor(g, A, "whale", walking ? "walk" : "idle", 320 - dist / 2 - 20, y, sc, lt);
  actor(g, A, "claude", walking ? "walk" : "idle", 320 + dist / 2 + 20, y, sc, lt, { flip: true });
  if (stage === 2 || stage >= 4) heart(g, 320, y - 90 * sc + Math.sin(lt * 5) * 4, (stage === 2 ? 1.2 : stage === 4 ? 2 + p : 3) * backOut(seg(p, 0, 0.4)));
  if (stage === 5) { flash(g, seg(p, 0.5, 1)); for (let k = 0; k < 3; k++) { const q = seg(p, 0.3 + k * 0.1, 1); g.strokeStyle = `rgba(255,255,255,${1 - q})`; g.lineWidth = 8; g.beginPath(); g.arc(320, y - 60 * sc, q * 400, 0, 7); g.stroke(); } }
  vignette(g, second ? 0.25 : 0.15, second ? "255,120,170" : "120,80,40");
}

export function renderShot(key: string, s: S) {
  const fn = shots[key] ?? shots.intro;
  fn(s);
}

// 未用到的导出保持 tree-shake 安全
export const _unused = { cloud, moon, easeIn };
