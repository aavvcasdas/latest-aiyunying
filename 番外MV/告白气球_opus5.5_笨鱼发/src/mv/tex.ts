import * as THREE from "three";
import fontUrl from "../assets/kuaile.otf?inline";

// ───────── 数学 ─────────
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (t: number) => { t = clamp(t); return t * t * (3 - 2 * t); };
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
export const easeIn = (t: number) => Math.pow(clamp(t), 3);
export const easeInOut = (t: number) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const back = (t: number) => { t = clamp(t); const c = 1.7; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
export const seg = (T: number, a: number, b: number) => clamp((T - a) / Math.max(1e-6, b - a));
export const bump = (T: number, a: number, b: number) => Math.sin(Math.PI * seg(T, a, b));
export function rng(seed: number) {
  let s = (seed * 2654435761) >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}

// ───────── 节拍（约 93 BPM，由主歌两遍的小节长度实测平均）─────────
export const BEAT = 0.6445;
export const BEAT0 = 24.27;
export const beatPos = (T: number) => (T - BEAT0) / BEAT;
export const beatPhase = (T: number) => { const b = beatPos(T); return b - Math.floor(b); };
export const beatPulse = (T: number, k = 6) => Math.exp(-beatPhase(T) * k);

// ───────── 画布 ─────────
export function cv(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")!];
}
export function toTex(c: HTMLCanvasElement, opt: { repeat?: boolean; nearest?: boolean } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (opt.repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  if (opt.nearest) { t.magFilter = THREE.NearestFilter; }
  return t;
}
export const FONT = "MVKuaile";
export async function loadFonts() {
  const f = new FontFace(FONT, `url(${fontUrl})`);
  await f.load(); document.fonts.add(f);
}
const F = (px: number) => `${px}px ${FONT}`;

// ───────── 三维字的字面：奶油 / 玫瑰 / 天空 ─────────
export type FaceStyle = "cream" | "rose" | "sky" | "ink";
const faceCache: Record<string, THREE.Texture> = {};
export function faceTex(style: FaceStyle): THREE.Texture {
  if (faceCache[style]) return faceCache[style];
  const S = 256; const [c, g] = cv(S, S); const r = rng(style.length * 31 + 7);
  const grad = g.createLinearGradient(0, 0, 0, S);
  if (style === "rose") { grad.addColorStop(0, "#ff8fb4"); grad.addColorStop(0.55, "#ffc2d6"); grad.addColorStop(1, "#fff1f5"); }
  else if (style === "sky") { grad.addColorStop(0, "#8fc4ff"); grad.addColorStop(0.6, "#cfe5ff"); grad.addColorStop(1, "#ffffff"); }
  else if (style === "ink") { grad.addColorStop(0, "#3a2a40"); grad.addColorStop(1, "#1a1020"); }
  else { grad.addColorStop(0, "#ffffff"); grad.addColorStop(1, "#ffe9d6"); }
  g.fillStyle = grad; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 700; i++) { g.fillStyle = `rgba(255,255,255,${r() * 0.25})`; const s = r() * 3 + 1; g.fillRect(r() * S, r() * S, s, s); }
  g.fillStyle = "rgba(255,255,255,.55)"; g.fillRect(0, S * 0.08, S, S * 0.06);
  const t = toTex(c, { repeat: true }); t.offset.set(0, 0.1);
  return (faceCache[style] = t);
}

// ───────── 通用纹理 ─────────
export function glowTex(color = "255,255,255", inner = 1) {
  const [c, g] = cv(128, 128); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, `rgba(${color},${inner})`); gr.addColorStop(0.25, `rgba(${color},${inner * 0.5})`); gr.addColorStop(1, `rgba(${color},0)`);
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return toTex(c);
}
export function leafTex() {
  const [c, g] = cv(64, 64);
  g.fillStyle = "#ffffff"; g.beginPath(); g.moveTo(32, 2);
  g.bezierCurveTo(56, 14, 60, 40, 32, 62); g.bezierCurveTo(4, 40, 8, 14, 32, 2); g.fill();
  g.strokeStyle = "rgba(90,50,10,.55)"; g.lineWidth = 2; g.beginPath(); g.moveTo(32, 6); g.lineTo(32, 60);
  for (let i = 0; i < 4; i++) { g.moveTo(32, 18 + i * 10); g.lineTo(18, 10 + i * 10); g.moveTo(32, 18 + i * 10); g.lineTo(46, 10 + i * 10); }
  g.stroke(); return toTex(c);
}
export function smileTex(bg = "#ff8fb4") {
  const [c, g] = cv(256, 128); g.fillStyle = bg; g.fillRect(0, 0, 256, 128);
  g.strokeStyle = "#5a2440"; g.lineWidth = 7; g.lineCap = "round";
  g.beginPath(); g.arc(112, 52, 5, 0, 7); g.arc(144, 52, 5, 0, 7); g.stroke();
  g.beginPath(); g.arc(128, 62, 22, 0.25 * Math.PI, 0.75 * Math.PI); g.stroke();
  g.fillStyle = "rgba(255,90,140,.45)"; g.beginPath(); g.arc(98, 72, 9, 0, 7); g.arc(158, 72, 9, 0, 7); g.fill();
  return toTex(c);
}
// 巴黎式立面：奶油石墙 + 灰蓝屋顶 + 一格格窗；夜里窗子亮（emissive）
export function facadeTex(seed: number, floors = 4, cols = 5) {
  const W = 512, H = 640; const [c, g] = cv(W, H); const [ce, ge] = cv(W, H); const r = rng(seed);
  const wall = ["#efe2c8", "#e8d5b5", "#f2e7d3", "#e6d0b0"][seed % 4];
  g.fillStyle = wall; g.fillRect(0, 0, W, H);
  g.fillStyle = "#5d6b80"; g.fillRect(0, 0, W, 96); g.fillStyle = "#4b576a"; for (let x = 20; x < W; x += 92) g.fillRect(x, 24, 46, 56);
  g.fillStyle = "rgba(120,90,60,.18)"; for (let y = 96; y < H; y += 24) g.fillRect(0, y, W, 2);
  ge.fillStyle = "#000"; ge.fillRect(0, 0, W, H);
  const fh = (H - 140) / floors, cw = W / cols;
  for (let f = 0; f < floors; f++) for (let k = 0; k < cols; k++) {
    const x = k * cw + cw * 0.22, y = 110 + f * fh + fh * 0.12, w = cw * 0.56, h = fh * 0.68;
    g.fillStyle = "#3a4458"; g.fillRect(x, y, w, h); g.fillStyle = "#8fa6c4"; g.fillRect(x + 4, y + 4, w - 8, h * 0.45);
    g.strokeStyle = "#f7f0e2"; g.lineWidth = 4; g.strokeRect(x, y, w, h); g.beginPath(); g.moveTo(x + w / 2, y); g.lineTo(x + w / 2, y + h); g.stroke();
    g.fillStyle = "#2c2c34"; g.fillRect(x - 6, y + h - 6, w + 12, 6); for (let b = x - 4; b < x + w + 4; b += 9) g.fillRect(b, y + h - 22, 3, 18);
    if (r() < 0.55) { const a = 0.55 + r() * 0.45; ge.fillStyle = `rgba(255,${190 + Math.floor(r() * 40)},${110 + Math.floor(r() * 60)},${a})`; ge.fillRect(x + 4, y + 4, w - 8, h - 8); }
  }
  return { map: toTex(c), emissive: toTex(ce) };
}
export function awningTex(a: string, b: string) {
  const [c, g] = cv(256, 128); for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? b : a; g.fillRect(i * 32, 0, 32, 128); }
  g.fillStyle = "rgba(0,0,0,.12)"; g.fillRect(0, 108, 256, 20); return toTex(c);
}
export function signTex(text: string, bg: string, fg: string, w = 512, h = 128) {
  const [c, g] = cv(w, h); g.fillStyle = bg; g.fillRect(0, 0, w, h); g.strokeStyle = fg; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, h - 16);
  g.fillStyle = fg; g.font = F(h * 0.56); g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, w / 2, h / 2 + 4); return toTex(c);
}
export function stoneTex(base: string, rep: number, seed = 3) {
  const [c, g] = cv(256, 256); const r = rng(seed); g.fillStyle = base; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 32) for (let x = (y / 32) % 2 ? -16 : 0; x < 256; x += 32) { g.fillStyle = `rgba(${r() < 0.5 ? "0,0,0" : "255,255,255"},${r() * 0.08})`; g.fillRect(x + 1, y + 1, 30, 30); }
  g.strokeStyle = "rgba(0,0,0,.18)"; g.lineWidth = 2; for (let y = 0; y <= 256; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); }
  const t = toTex(c, { repeat: true }); t.repeat.set(rep, rep); return t;
}
// 玫瑰卡：给 小刻（写错）→ 红笔圈出「刻」→ 旁边改成「克」
export function cardTex(state: { n: number; circle: number; fix: boolean }) {
  const [c, g] = cv(320, 200); g.fillStyle = "#fffaf0"; g.fillRect(0, 0, 320, 200);
  g.strokeStyle = "#ff8fb4"; g.lineWidth = 8; g.strokeRect(6, 6, 308, 188);
  g.fillStyle = "#e0507e"; g.beginPath(); g.arc(282, 40, 12, 0, 7); g.arc(298, 40, 12, 0, 7); g.fill(); g.beginPath(); g.moveTo(272, 46); g.lineTo(290, 70); g.lineTo(308, 46); g.fill();
  const txt = ["给", "小", "刻"]; g.fillStyle = "#3a2a40"; g.font = F(70); g.textBaseline = "middle";
  for (let i = 0; i < Math.min(3, state.n); i++) g.fillText(txt[i], 36 + i * 82, 112);
  if (state.circle > 0) { g.strokeStyle = "#e03a3a"; g.lineWidth = 6; g.beginPath(); g.ellipse(234, 112, 44, 40, -0.2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * state.circle); g.stroke(); }
  if (state.fix) { g.fillStyle = "#e03a3a"; g.font = F(50); g.fillText("克", 262, 54); }
  return toTex(c);
}
export function tagTex(front: boolean) {
  const [c, g] = cv(160, 96); g.fillStyle = front ? "#fff4d6" : "#f0e2c0"; g.beginPath(); g.moveTo(30, 6); g.lineTo(154, 6); g.lineTo(154, 90); g.lineTo(30, 90); g.lineTo(4, 48); g.closePath(); g.fill();
  g.strokeStyle = "#b08a4a"; g.lineWidth = 4; g.stroke(); g.fillStyle = "#b08a4a"; g.beginPath(); g.arc(24, 48, 6, 0, 7); g.fill();
  if (front) { g.fillStyle = "#8a2a2a"; g.font = F(46); g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("最贵", 94, 50); }
  else { g.strokeStyle = "#c98a3a"; g.lineWidth = 3; g.beginPath(); g.moveTo(94, 22); g.bezierCurveTo(118, 34, 116, 62, 94, 76); g.bezierCurveTo(72, 62, 70, 34, 94, 22); g.stroke(); }
  return toTex(c);
}
export function lipTex() {
  const [c, g] = cv(128, 64); g.fillStyle = "rgba(226,70,120,.85)";
  g.beginPath(); g.moveTo(10, 32); g.bezierCurveTo(34, 6, 52, 14, 64, 22); g.bezierCurveTo(76, 14, 94, 6, 118, 32); g.bezierCurveTo(90, 58, 38, 58, 10, 32); g.fill();
  g.strokeStyle = "rgba(160,30,70,.7)"; g.lineWidth = 3; g.beginPath(); g.moveTo(14, 32); g.bezierCurveTo(44, 38, 84, 38, 114, 32); g.stroke(); return toTex(c);
}
// 咖啡面：p 0 → 1 由漩涡搅成一颗心
export function latteTex(p: number) {
  const [c, g] = cv(256, 256); g.fillStyle = "#6b3f22"; g.beginPath(); g.arc(128, 128, 128, 0, 7); g.fill();
  g.strokeStyle = "#f6e6cf"; g.lineCap = "round";
  const sw = 1 - p; g.lineWidth = 10;
  if (sw > 0.02) { g.globalAlpha = sw; g.beginPath(); for (let a = 0; a < 18; a += 0.1) { const rr = 6 + a * 6; const x = 128 + Math.cos(a + p * 6) * rr, y = 128 + Math.sin(a + p * 6) * rr; a ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); }
  if (p > 0.02) { g.globalAlpha = clamp(p * 1.4); g.fillStyle = "#f6e6cf"; const s = 0.4 + 0.6 * p; g.save(); g.translate(128, 136); g.scale(s, s); g.beginPath(); g.moveTo(0, 60); g.bezierCurveTo(-90, 0, -60, -80, 0, -36); g.bezierCurveTo(60, -80, 90, 0, 0, 60); g.fill(); g.restore(); }
  g.globalAlpha = 1; return toTex(c);
}
// 恋爱日记的一页：用笔画出来的小记录（不是图片）
export type Doodle = "cup" | "card" | "balloon" | "leaf" | "lights" | "tower" | "heart" | "bottle";
export function pageTex(items: Doodle[], seed = 1) {
  const W = 1024, H = 256; const [c, g] = cv(W, H); const r = rng(seed);
  g.fillStyle = "#fbf3e2"; g.fillRect(0, 0, W, H); g.strokeStyle = "rgba(180,140,90,.25)"; g.lineWidth = 2;
  for (let y = 40; y < H; y += 36) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  const cw = W / items.length;
  items.forEach((it, i) => {
    const cx = cw * i + cw / 2, cy = H / 2 + (r() - 0.5) * 16; g.save(); g.translate(cx, cy); g.rotate((r() - 0.5) * 0.18);
    g.fillStyle = "#fff"; g.fillRect(-96, -100, 192, 200); g.strokeStyle = "#d9c7a6"; g.lineWidth = 3; g.strokeRect(-96, -100, 192, 200);
    g.lineWidth = 6; g.lineCap = "round"; g.lineJoin = "round"; g.strokeStyle = "#5a3a50"; g.fillStyle = "#ffb3c9";
    if (it === "cup") { g.beginPath(); g.moveTo(-50, -30); g.lineTo(-40, 50); g.lineTo(40, 50); g.lineTo(50, -30); g.closePath(); g.fillStyle = "#fff"; g.fill(); g.stroke(); g.beginPath(); g.arc(58, 8, 18, -1.3, 1.3); g.stroke(); g.fillStyle = "#e2467a"; g.beginPath(); g.ellipse(-22, -24, 14, 7, 0, 0, 7); g.fill(); }
    if (it === "card") { g.fillStyle = "#fffaf0"; g.fillRect(-64, -40, 128, 80); g.strokeStyle = "#ff8fb4"; g.strokeRect(-64, -40, 128, 80); g.fillStyle = "#3a2a40"; g.font = F(40); g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("小克", 0, 4); }
    if (it === "balloon") { g.beginPath(); g.ellipse(0, -18, 46, 54, 0, 0, 7); g.fill(); g.stroke(); g.beginPath(); g.moveTo(0, 36); g.bezierCurveTo(14, 60, -14, 74, 6, 92); g.stroke(); g.beginPath(); g.arc(0, -10, 16, 0.3, 2.8); g.stroke(); g.fillStyle = "#5a3a50"; g.beginPath(); g.arc(-14, -30, 4, 0, 7); g.arc(14, -30, 4, 0, 7); g.fill(); }
    if (it === "leaf") { g.fillStyle = "#f0a23a"; g.beginPath(); g.moveTo(0, -70); g.bezierCurveTo(56, -40, 50, 30, 0, 70); g.bezierCurveTo(-50, 30, -56, -40, 0, -70); g.fill(); g.stroke(); g.beginPath(); g.moveTo(0, -60); g.lineTo(0, 66); g.stroke(); }
    if (it === "lights") { g.beginPath(); g.moveTo(-80, -40); g.quadraticCurveTo(0, 30, 80, -40); g.stroke(); for (let k = 0; k < 6; k++) { const t = k / 5; const x = lerp(-70, 70, t), y = -36 + Math.sin(Math.PI * t) * 54; g.fillStyle = "#ffd36b"; g.beginPath(); g.arc(x, y + 10, 9, 0, 7); g.fill(); } }
    if (it === "tower") { g.beginPath(); g.moveTo(-50, 80); g.quadraticCurveTo(-10, 0, -4, -80); g.lineTo(4, -80); g.quadraticCurveTo(10, 0, 50, 80); g.stroke(); g.beginPath(); g.moveTo(-34, 20); g.lineTo(34, 20); g.moveTo(-18, -20); g.lineTo(18, -20); g.stroke(); }
    if (it === "heart") { g.fillStyle = "#ff6f9c"; g.beginPath(); g.moveTo(0, 56); g.bezierCurveTo(-90, 0, -50, -76, 0, -30); g.bezierCurveTo(50, -76, 90, 0, 0, 56); g.fill(); g.stroke(); }
    if (it === "bottle") { g.fillStyle = "#ffd6e4"; g.beginPath(); g.roundRect(-40, -20, 80, 90, 18); g.fill(); g.stroke(); g.strokeRect(-14, -50, 28, 30); }
    g.restore();
  });
  return toTex(c);
}
export function labelTex() {
  const [c, g] = cv(256, 128); g.fillStyle = "#fff6fa"; g.fillRect(0, 0, 256, 128); g.strokeStyle = "#e0507e"; g.lineWidth = 5; g.strokeRect(10, 10, 236, 108);
  g.fillStyle = "#c03a6a"; g.font = F(58); g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("梦境", 128, 68); return toTex(c);
}
