import type { Assets } from "./assets";

export const W = 640;
export const H = 360;
export type G = CanvasRenderingContext2D;

export const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
export const easeIn = (t: number) => Math.pow(clamp(t), 3);
export const easeInOut = (t: number) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const backOut = (t: number) => { t = clamp(t); const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
export const elastic = (t: number) => { t = clamp(t); if (t === 0 || t === 1) return t; return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1; };
/** 固定种子随机数：同一 i 永远同一结果（逐帧可复现）。 */
export const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

export const CHAR_COLOR: Record<string, string> = {
  whale: "#3b6fd8", claude: "#ff8a3d", gpt: "#e8e4ff", doubao: "#5fb8ff",
  gemini: "#8a7dff", kimi: "#b9a8e8", qwen: "#7a5cff", zai: "#2d2d3a",
};
export const FLOWER_COLOR: Record<string, string> = {
  whale: "#4f8dff", claude: "#ff9a3c", gpt: "#f4f0ff", doubao: "#66d4ff",
  gemini: "#a78bfa", kimi: "#f0c4ff", qwen: "#ff6fae", zai: "#ffe066",
};

export function sky(g: G, top: string, bottom: string, mid?: string) {
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, top);
  if (mid) gr.addColorStop(0.55, mid);
  gr.addColorStop(1, bottom);
  g.fillStyle = gr;
  g.fillRect(0, 0, W, H);
}

export function glow(g: G, x: number, y: number, r: number, color: string, a = 1) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, color);
  gr.addColorStop(1, "rgba(255,255,255,0)");
  g.save(); g.globalAlpha = a; g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore();
}

export function rays(g: G, x: number, y: number, n: number, rot: number, color: string, len = 600, width = 0.12, a = 0.35) {
  g.save(); g.translate(x, y); g.rotate(rot); g.globalAlpha = a; g.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const an = (i / n) * Math.PI * 2;
    g.beginPath(); g.moveTo(0, 0);
    g.lineTo(Math.cos(an - width) * len, Math.sin(an - width) * len);
    g.lineTo(Math.cos(an + width) * len, Math.sin(an + width) * len);
    g.closePath(); g.fill();
  }
  g.restore();
}

export function sun(g: G, x: number, y: number, r: number, rot: number, face = true) {
  glow(g, x, y, r * 3.2, "rgba(255,240,170,0.9)", 0.8);
  rays(g, x, y, 12, rot, "#fff3b0", r * 2.4, 0.09, 0.55);
  g.fillStyle = "#ffd84a"; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  g.fillStyle = "#fff0a0"; g.beginPath(); g.arc(x - r * 0.25, y - r * 0.25, r * 0.55, 0, Math.PI * 2); g.fill();
  if (face && r > 14) {
    g.fillStyle = "#6b4a1e";
    g.fillRect(x - r * 0.35, y - r * 0.1, 3, 4); g.fillRect(x + r * 0.25, y - r * 0.1, 3, 4);
    g.fillStyle = "#ff9b8a"; g.fillRect(x - r * 0.55, y + r * 0.15, 5, 3); g.fillRect(x + r * 0.4, y + r * 0.15, 5, 3);
    g.strokeStyle = "#6b4a1e"; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y + r * 0.12, r * 0.18, 0.2, Math.PI - 0.2); g.stroke();
  }
}

export function moon(g: G, x: number, y: number, r: number) {
  glow(g, x, y, r * 3, "rgba(200,210,255,0.6)", 0.7);
  g.fillStyle = "#f6f2d0"; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  g.fillStyle = "rgba(20,24,60,1)"; g.beginPath(); g.arc(x + r * 0.45, y - r * 0.25, r * 0.85, 0, Math.PI * 2); g.fill();
}

export function cloud(g: G, x: number, y: number, s: number, color = "#ffffff", a = 1) {
  g.save(); g.globalAlpha = a; g.fillStyle = color;
  const b = [[0, 0, 18], [20, -8, 22], [42, 0, 17], [-18, 4, 13], [58, 6, 11]];
  for (const [dx, dy, r] of b) { g.beginPath(); g.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2); g.fill(); }
  g.fillRect(x - 18 * s, y, 76 * s, 14 * s);
  g.globalAlpha = a * 0.18; g.fillStyle = "#7aa0d8"; g.fillRect(x - 18 * s, y + 10 * s, 76 * s, 4 * s);
  g.restore();
}

export function clouds(g: G, t: number, speed: number, n: number, yMin: number, yMax: number, s0: number, color = "#fff", a = 0.95, seed = 1) {
  for (let i = 0; i < n; i++) {
    const s = s0 * (0.6 + rnd(i + seed) * 0.8);
    const span = W + 200;
    const x = ((rnd(i * 3 + seed) * span - t * speed * (0.6 + s)) % span + span) % span - 100;
    const y = lerp(yMin, yMax, rnd(i * 7 + seed));
    cloud(g, x, y, s, color, a);
  }
}

export function hills(g: G, y: number, color: string, amp: number, freq: number, phase: number) {
  g.fillStyle = color; g.beginPath(); g.moveTo(0, H);
  for (let x = 0; x <= W; x += 4) g.lineTo(x, y + Math.sin(x * freq + phase) * amp + Math.sin(x * freq * 2.3 + phase * 1.7) * amp * 0.35);
  g.lineTo(W, H); g.closePath(); g.fill();
}

export function grassTufts(g: G, y0: number, t: number, color = "#3d9a4a", n = 50, seed = 5) {
  g.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const x = rnd(i + seed) * W, y = y0 + rnd(i * 2 + seed) * (H - y0);
    const sw = Math.sin(t * 3 + i) * 1.5;
    g.beginPath(); g.moveTo(x - 2, y); g.lineTo(x + sw, y - 6); g.lineTo(x + 2, y); g.fill();
  }
}

export function flower(g: G, x: number, y: number, s: number, color: string, grow = 1, sway = 0, center = "#ffe066") {
  if (grow <= 0) return;
  const stem = 22 * s * clamp(grow * 1.6);
  g.strokeStyle = "#3a9a4a"; g.lineWidth = Math.max(1.5, 2.2 * s);
  g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + sway * 0.5, y - stem * 0.5, x + sway, y - stem); g.stroke();
  if (grow > 0.35) { g.fillStyle = "#4cb85a"; g.beginPath(); g.ellipse(x + 4 * s, y - stem * 0.4, 5 * s, 2.5 * s, -0.5, 0, Math.PI * 2); g.fill(); }
  const bloom = clamp((grow - 0.55) / 0.45);
  if (bloom <= 0) return;
  const fx = x + sway, fy = y - stem, r = 7 * s * backOut(bloom);
  g.fillStyle = color;
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2 + sway * 0.05; g.beginPath(); g.arc(fx + Math.cos(a) * r * 0.75, fy + Math.sin(a) * r * 0.75, r * 0.55, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = center; g.beginPath(); g.arc(fx, fy, r * 0.45, 0, Math.PI * 2); g.fill();
}

export function heart(g: G, x: number, y: number, s: number, color = "#ff5f8f", a = 1) {
  g.save(); g.globalAlpha = a; g.fillStyle = color; g.translate(x, y); g.scale(s, s);
  g.beginPath(); g.moveTo(0, 4); g.bezierCurveTo(-10, -4, -6, -12, 0, -6); g.bezierCurveTo(6, -12, 10, -4, 0, 4); g.fill();
  g.fillStyle = "rgba(255,255,255,0.6)"; g.fillRect(-5, -7, 2, 2);
  g.restore();
}

export function star(g: G, x: number, y: number, r: number, color = "#fff6c0", a = 1, rot = 0) {
  g.save(); g.globalAlpha = a; g.fillStyle = color; g.translate(x, y); g.rotate(rot); g.beginPath();
  for (let i = 0; i < 8; i++) { const rr = i % 2 ? r * 0.35 : r; const an = (i / 8) * Math.PI * 2; g.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); }
  g.closePath(); g.fill(); g.restore();
}

export function starfield(g: G, t: number, n = 70, a = 1, seed = 9) {
  for (let i = 0; i < n; i++) {
    const tw = 0.5 + 0.5 * Math.sin(t * (1 + rnd(i) * 3) + i);
    g.fillStyle = `rgba(255,255,230,${a * (0.3 + tw * 0.7)})`;
    const s = rnd(i + seed) > 0.85 ? 2 : 1;
    g.fillRect(Math.floor(rnd(i * 3 + seed) * W), Math.floor(rnd(i * 5 + seed) * H * 0.8), s, s);
  }
}

export function confetti(g: G, t: number, n = 60, seed = 3, a = 1) {
  const cols = ["#ff6fae", "#ffd84a", "#5fd0ff", "#8affc1", "#ff8a3d", "#a78bfa"];
  for (let i = 0; i < n; i++) {
    const x = (rnd(i + seed) * W + Math.sin(t * 2 + i) * 12 + W) % W;
    const y = ((rnd(i * 2 + seed) * H + t * (50 + rnd(i) * 70)) % (H + 20)) - 10;
    g.save(); g.globalAlpha = a; g.translate(x, y); g.rotate(t * 4 + i);
    g.fillStyle = cols[i % cols.length]; g.fillRect(-2, -1, 4, 2.5); g.restore();
  }
}

export function speedLines(g: G, t: number, color = "rgba(255,255,255,0.7)", n = 26, dir: "left" | "down" = "left") {
  g.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const len = 30 + rnd(i) * 80;
    if (dir === "left") {
      const y = rnd(i * 3) * H; const x = ((rnd(i * 5) * W - t * 900) % (W + len) + W + len) % (W + len) - len;
      g.fillRect(x, y, len, 1.5);
    } else {
      const x = rnd(i * 3) * W; const y = ((rnd(i * 5) * H - t * 700) % (H + len) + H + len) % (H + len) - len;
      g.fillRect(x, H - y, 1.5, len);
    }
  }
}

export function vignette(g: G, a = 0.5, color = "0,0,0") {
  const gr = g.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.62);
  gr.addColorStop(0, `rgba(${color},0)`); gr.addColorStop(1, `rgba(${color},${a})`);
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
}

export function flash(g: G, a: number, color = "255,255,255") {
  if (a <= 0) return;
  g.fillStyle = `rgba(${color},${clamp(a)})`; g.fillRect(0, 0, W, H);
}

export function room(g: G, dim = 0, floorY = 270) {
  // 墙
  const gr = g.createLinearGradient(0, 0, 0, floorY);
  gr.addColorStop(0, "#f3e6d4"); gr.addColorStop(1, "#e7d3bb");
  g.fillStyle = gr; g.fillRect(0, 0, W, floorY);
  // 墙纸小星星
  g.fillStyle = "rgba(200,170,140,0.35)";
  for (let i = 0; i < 40; i++) g.fillRect(Math.floor(rnd(i) * W), Math.floor(rnd(i + 50) * (floorY - 30)), 2, 2);
  // 踢脚线 + 木地板
  g.fillStyle = "#c79a6c"; g.fillRect(0, floorY - 6, W, 6);
  g.fillStyle = "#b9875a"; g.fillRect(0, floorY, W, H - floorY);
  g.fillStyle = "#a87648";
  for (let y = floorY + 14; y < H; y += 16) g.fillRect(0, y, W, 2);
  for (let i = 0; i < 18; i++) g.fillRect(Math.floor(rnd(i + 7) * W), floorY + Math.floor(rnd(i + 9) * 6) * 16, 2, 16);
  if (dim > 0) { g.fillStyle = `rgba(40,40,70,${dim})`; g.fillRect(0, 0, W, H); }
}

export function windowFrame(g: G, x: number, y: number, w: number, h: number, inner: (g: G) => void) {
  g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); inner(g); g.restore();
  g.fillStyle = "#fff8ee"; g.fillRect(x - 6, y - 6, w + 12, 6); g.fillRect(x - 6, y + h, w + 12, 10);
  g.fillRect(x - 6, y, 6, h); g.fillRect(x + w, y, 6, h); g.fillRect(x + w / 2 - 2, y, 4, h); g.fillRect(x, y + h / 2 - 2, w, 4);
  g.fillStyle = "#e0cdb4"; g.fillRect(x - 10, y + h + 10, w + 20, 4);
}

export function globe(g: G, x: number, y: number, r: number, rot: number, lit = 1, cityLights = 0) {
  g.save();
  glow(g, x, y, r * 1.6, `rgba(120,200,255,${0.5 * lit + 0.1})`, 1);
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.clip();
  g.fillStyle = "#2f7fd6"; g.fillRect(x - r, y - r, r * 2, r * 2);
  // 大陆：按经度滚动的色块
  const lands = [[0.0, -0.3, 0.5, 0.42], [0.9, 0.3, 0.42, 0.45], [1.9, -0.1, 0.6, 0.38], [2.9, 0.4, 0.36, 0.3], [3.8, -0.45, 0.42, 0.28], [4.9, 0.1, 0.48, 0.42]];
  for (const [lon, lat, sw, sh] of lands) {
    const a = ((lon + rot) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
    if (Math.abs(a) > Math.PI / 2 + 0.3) continue;
    const cx = x + Math.sin(a) * r, cy = y + lat * r;
    const squash = Math.max(0.15, Math.cos(a));
    g.fillStyle = "#56b866"; g.beginPath(); g.ellipse(cx, cy, sw * r * squash, sh * r, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#86d07a"; g.beginPath(); g.ellipse(cx - sw * r * 0.2 * squash, cy - sh * r * 0.2, sw * r * 0.5 * squash, sh * r * 0.45, 0, 0, Math.PI * 2); g.fill();
    if (cityLights > 0) {
      for (let k = 0; k < 6; k++) {
        const on = rnd(lon * 10 + k) < cityLights;
        if (!on) continue;
        g.fillStyle = "#fff2a0"; g.fillRect(cx + (rnd(k + lon) - 0.5) * sw * r * squash, cy + (rnd(k * 3 + lon) - 0.5) * sh * r, 2, 2);
      }
    }
  }
  // 云带
  g.fillStyle = "rgba(255,255,255,0.55)";
  for (let k = 0; k < 5; k++) { const cx = x + ((k * 47 + rot * 40) % (r * 2.6)) - r * 1.3; g.fillRect(cx, y - r * 0.6 + k * r * 0.28, r * 0.5, 3); }
  // 夜面
  if (lit < 1) {
    const sh = g.createLinearGradient(x - r, y, x + r, y);
    const edge = lerp(-0.2, 1.2, lit);
    sh.addColorStop(0, "rgba(8,10,40,0)"); sh.addColorStop(clamp(edge), "rgba(8,10,40,0)");
    sh.addColorStop(clamp(edge + 0.25), "rgba(8,10,40,0.82)"); sh.addColorStop(1, "rgba(8,10,40,0.82)");
    g.fillStyle = sh; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  g.fillStyle = "rgba(255,255,255,0.25)"; g.beginPath(); g.arc(x - r * 0.35, y - r * 0.4, r * 0.35, 0, Math.PI * 2); g.fill();
  g.restore();
  g.strokeStyle = "rgba(200,240,255,0.8)"; g.lineWidth = 2; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke();
}

export function rainbow(g: G, x: number, y: number, r: number, p = 1, a = 0.8) {
  const cols = ["#ff5f6d", "#ffa94d", "#ffe066", "#69db7c", "#4dabf7", "#9775fa"];
  g.save(); g.globalAlpha = a; g.lineWidth = 7;
  cols.forEach((c, i) => { g.strokeStyle = c; g.beginPath(); g.arc(x, y, r - i * 7, Math.PI, Math.PI + Math.PI * clamp(p)); g.stroke(); });
  g.restore();
}

let tintCanvas: HTMLCanvasElement | null = null;
/** 画像素角色：(x, y) 是脚底中心。 */
export function actor(g: G, A: Assets, char: string, action: string, x: number, y: number, scale: number, t: number, opts: { flip?: boolean; alpha?: number; fps?: number; loop?: boolean; tint?: string; tintA?: number } = {}) {
  const f = action === "fly" && char === "gpt" ? A.act("gpt", "fly", t, opts.fps ?? 6) : A.act(char, action, t, opts.fps ?? 8, opts.loop ?? true);
  if (!f) return;
  const w = f.w * scale, h = f.h * scale;
  g.save();
  g.globalAlpha = opts.alpha ?? 1;
  g.translate(Math.round(x), Math.round(y));
  if (opts.flip) g.scale(-1, 1);
  if (opts.tint && opts.tintA) {
    // 只给角色像素上色：先在离屏画布里 source-atop，再贴回来
    if (!tintCanvas) tintCanvas = document.createElement("canvas");
    tintCanvas.width = f.w; tintCanvas.height = f.h;
    const tc = tintCanvas.getContext("2d")!;
    tc.clearRect(0, 0, f.w, f.h);
    tc.globalCompositeOperation = "source-over"; tc.globalAlpha = 1;
    tc.drawImage(f.img, f.x, f.y, f.w, f.h, 0, 0, f.w, f.h);
    tc.globalCompositeOperation = "source-atop"; tc.globalAlpha = clamp(opts.tintA); tc.fillStyle = opts.tint;
    tc.fillRect(0, 0, f.w, f.h);
    g.drawImage(tintCanvas, 0, 0, f.w, f.h, -w / 2, -h, w, h);
  } else {
    g.drawImage(f.img, f.x, f.y, f.w, f.h, -w / 2, -h, w, h);
  }
  g.restore();
}

export function shadow(g: G, x: number, y: number, w: number, a = 0.25) {
  g.fillStyle = `rgba(0,0,0,${a})`; g.beginPath(); g.ellipse(x, y, w, w * 0.25, 0, 0, Math.PI * 2); g.fill();
}

export function prop(g: G, A: Assets, name: string, x: number, y: number, scale: number, rot = 0, alpha = 1) {
  const im = A.props.get(name);
  if (im) {
    g.save(); g.globalAlpha = alpha; g.translate(x, y); g.rotate(rot);
    g.drawImage(im, -im.width * scale / 2, -im.height * scale, im.width * scale, im.height * scale);
    g.restore(); return;
  }
  const f = A.frame("prop_" + name);
  if (f) { g.save(); g.globalAlpha = alpha; g.translate(x, y); g.rotate(rot); g.drawImage(f.img, f.x, f.y, f.w, f.h, -f.w * scale / 2, -f.h * scale, f.w * scale, f.h * scale); g.restore(); }
}

export function fx(g: G, A: Assets, name: string, x: number, y: number, scale: number, t = 0, alpha = 1) {
  const list = A.actions.get("fx_" + name);
  const f = list ? list[Math.floor(t * 8) % list.length] : A.frame("fx_" + name);
  if (!f) return;
  g.save(); g.globalAlpha = alpha;
  g.drawImage(f.img, f.x, f.y, f.w, f.h, Math.round(x - f.w * scale / 2), Math.round(y - f.h * scale), f.w * scale, f.h * scale);
  g.restore();
}

export function frameBorder(g: G, inset: number, color = "#fff") {
  g.strokeStyle = color; g.lineWidth = 3; g.strokeRect(inset, inset, W - inset * 2, H - inset * 2);
}
