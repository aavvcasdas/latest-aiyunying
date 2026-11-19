// 总渲染：选镜头 → 画场景 → 后期（色差切片 / 暗角 / 颗粒 / 划痕 / 闪白 / 黑场）
import { Ctx, H, W, clamp, getGrain, getScratch, getVignette, hash } from "./fx";
import { S } from "./kit";
import { LINES, DUR } from "./lyrics";
import { SCENES } from "./scenes";
import { PALS, Pal, drawText } from "./typo";

const SEC_PAL: Record<string, Pal["name"]> = { A: "night", I1: "ink", B: "ink", C: "day", I2: "dawn", D: "dawn", E: "dawn" };
const FLASH: Array<[number, number]> = [
  [28.3, 0.7],
  [30.13, 1],
  [34.0, 0.45],
  [71.2, 0.9],
  [99.3, 0.4],
  [112.0, 0.75],
  [123.0, 0.55],
];

export function sceneAt(t: number) {
  for (let i = SCENES.length - 1; i >= 0; i--) if (t >= SCENES[i].a) return SCENES[i];
  return SCENES[0];
}

export function palAt(t: number) {
  return PALS[SEC_PAL[sceneAt(t).sec]];
}

export function renderFrame(c: Ctx, tt: number) {
  const t = clamp(tt, 0, DUR - 0.001);
  const sc = sceneAt(t);
  const pal = PALS[SEC_PAL[sc.sec]];
  const dur = sc.b - sc.a;
  const lt = t - sc.a;
  c.setTransform(1, 0, 0, 1, 0, 0);
  c.globalAlpha = 1;
  c.globalCompositeOperation = "source-over";
  c.shadowBlur = 0;
  c.fillStyle = pal.bg;
  c.fillRect(0, 0, W, H);

  // 最近一次起音：给镜头一个小小的「顿」
  let lastHit = -9;
  for (const l of LINES) if (l.s <= t) lastHit = l.s;
  const hit = t - lastHit;
  const punch = 0.018 * Math.exp(-hit * 11);
  const u = clamp(lt / dur);
  const zoom = 1 + 0.035 * u + punch;
  let drawn = false;
  const S: S = {
    c,
    t,
    lt,
    dur,
    u,
    pal,
    sec: sc.sec,
    P: sc.P,
    text: () => {
      if (drawn) return;
      drawn = true;
      drawText(c, t, pal);
    },
  };
  c.save();
  c.translate(W / 2, H / 2);
  c.scale(zoom, zoom);
  const sh = hit < 0.12 ? 3 : 0;
  c.translate(-W / 2 + (hash(Math.floor(t * 30)) - 0.5) * sh, -H / 2 + (hash(Math.floor(t * 30) + 7) - 0.5) * sh);
  sc.fn(S);
  c.restore();
  c.globalAlpha = 1;
  c.globalCompositeOperation = "source-over";
  if (!drawn) drawText(c, t, pal);

  // 色差切片
  if (hit < 0.1 && hit >= 0) {
    const seed = Math.floor(t * 40);
    const cv = c.canvas;
    for (let i = 0; i < 4; i++) {
      const y = hash(seed + i * 3) * (H - 60);
      const h = 8 + hash(seed + i * 5) * 40;
      const dx = (hash(seed + i * 7) - 0.5) * 60;
      c.drawImage(cv, 0, y, W, h, dx, y, W, h);
    }
  }

  // 暗角
  c.globalAlpha = pal.name === "day" ? 0.4 : 0.9;
  c.drawImage(getVignette(), 0, 0);

  // 颗粒
  const gf = Math.floor(t * 24);
  const gp = c.createPattern(getGrain(), "repeat");
  if (gp) {
    c.save();
    c.globalCompositeOperation = "overlay";
    c.globalAlpha = pal.name === "day" ? 0.22 : 0.16;
    c.translate(Math.floor(hash(gf) * 256), Math.floor(hash(gf + 3) * 256));
    c.fillStyle = gp;
    c.fillRect(-256, -256, W + 256, H + 256);
    c.restore();
  }
  // 划痕
  if (hash(gf * 1.3) > 0.55) {
    c.save();
    c.globalAlpha = 0.16 + 0.2 * hash(gf + 11);
    c.globalCompositeOperation = pal.name === "day" ? "multiply" : "screen";
    c.drawImage(getScratch(), (hash(gf + 5) - 0.5) * 80, (hash(gf + 8) - 0.5) * 30);
    c.restore();
  }
  // 闪白
  for (const [ft, k] of FLASH) {
    if (t >= ft && t < ft + 0.8) {
      c.globalAlpha = clamp(k * Math.exp(-(t - ft) * 7));
      c.fillStyle = "#fff";
      c.fillRect(0, 0, W, H);
    }
  }
  // 黑场：开头淡入，结尾灯灭
  const fi = 1 - clamp(t / 0.35);
  const fo = clamp((t - 150.4) / 1.5);
  const bk = Math.max(fi, fo);
  if (bk > 0) {
    c.globalAlpha = bk;
    c.fillStyle = "#000";
    c.fillRect(0, 0, W, H);
  }
  c.globalAlpha = 1;
}
