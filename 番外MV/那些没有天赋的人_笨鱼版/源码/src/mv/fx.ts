// 通用工具：缓动、确定性随机、纹理（颗粒 / 斑驳 / 暗角）
export const W = 1280;
export const H = 720;

export type Ctx = CanvasRenderingContext2D;

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const sm = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
export const easeIn = (t: number) => Math.pow(clamp(t), 3);
export const easeInOut = (t: number) => {
  t = clamp(t);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
export const easeOutBack = (t: number) => {
  t = clamp(t);
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
export const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function mkCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

let grainTile: HTMLCanvasElement | null = null;
let speckTile: HTMLCanvasElement | null = null;
let scratchTile: HTMLCanvasElement | null = null;
let vignette: HTMLCanvasElement | null = null;

export function getGrain() {
  if (grainTile) return grainTile;
  const c = mkCanvas(256, 256);
  const x = c.getContext("2d")!;
  const img = x.createImageData(256, 256);
  const r = rng(7);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = r() * 255;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  grainTile = c;
  return c;
}

// 斑驳的「蚀」：用来把字啃出旧油墨的缺口
export function getSpeck() {
  if (speckTile) return speckTile;
  const c = mkCanvas(512, 512);
  const x = c.getContext("2d")!;
  const r = rng(19);
  x.fillStyle = "#000";
  for (let i = 0; i < 900; i++) {
    const px = r() * 512;
    const py = r() * 512;
    const s = Math.pow(r(), 3) * 7 + 0.6;
    x.globalAlpha = 0.55 + r() * 0.45;
    x.beginPath();
    x.ellipse(px, py, s, s * (0.5 + r()), r() * 3, 0, Math.PI * 2);
    x.fill();
  }
  // 几条干裂的细线
  x.strokeStyle = "#000";
  for (let i = 0; i < 40; i++) {
    x.globalAlpha = 0.8;
    x.lineWidth = 0.7 + r() * 1.3;
    let px = r() * 512;
    let py = r() * 512;
    x.beginPath();
    x.moveTo(px, py);
    for (let k = 0; k < 6; k++) {
      px += (r() - 0.5) * 50;
      py += (r() - 0.5) * 50;
      x.lineTo(px, py);
    }
    x.stroke();
  }
  speckTile = c;
  return c;
}

export function getScratch() {
  if (scratchTile) return scratchTile;
  const c = mkCanvas(W, H);
  const x = c.getContext("2d")!;
  const r = rng(33);
  x.strokeStyle = "#fff";
  for (let i = 0; i < 26; i++) {
    x.globalAlpha = 0.25 + r() * 0.55;
    x.lineWidth = 0.6 + r() * 1.1;
    const px = r() * W;
    const py = r() * H * 0.5;
    x.beginPath();
    x.moveTo(px, py);
    x.lineTo(px + (r() - 0.5) * 6, py + 120 + r() * 500);
    x.stroke();
  }
  scratchTile = c;
  return c;
}

export function getVignette() {
  if (vignette) return vignette;
  const c = mkCanvas(W, H);
  const x = c.getContext("2d")!;
  const g = x.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.0);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.78)");
  x.fillStyle = g;
  x.fillRect(0, 0, W, H);
  vignette = c;
  return c;
}

export function roundRect(c: Ctx, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  c.beginPath();
  c.moveTo(x + rr, y);
  c.arcTo(x + w, y, x + w, y + h, rr);
  c.arcTo(x + w, y + h, x, y + h, rr);
  c.arcTo(x, y + h, x, y, rr);
  c.arcTo(x, y, x + w, y, rr);
  c.closePath();
}

export const FONT = '"MVSerif","Noto Serif SC","Songti SC","STSong","SimSun",serif';
