import * as THREE from "three";
import serifUrl from "../assets/serif.woff2?inline";

// ───────── 小工具 ─────────
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (t: number) => { t = clamp(t); return t * t * (3 - 2 * t); };
export const easeOut = (t: number) => 1 - Math.pow(1 - clamp(t), 3);
export const easeIn = (t: number) => Math.pow(clamp(t), 3);
export const easeInOut = (t: number) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const back = (t: number) => { t = clamp(t); const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
export const seg = (T: number, a: number, b: number) => clamp((T - a) / Math.max(1e-6, b - a));
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
// 音轨实测：约 74 BPM，拍点相位 15.45 s
export const BEAT = 0.8108;
export const beatPos = (T: number) => (T - 15.45) / BEAT;
export const beatPhase = (T: number) => { const b = beatPos(T); return b - Math.floor(b); };
export const beatPulse = (T: number, k = 6) => Math.exp(-beatPhase(T) * k);

export function cv(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement("canvas"); c.width = w; c.height = h; return [c, c.getContext("2d")!];
}
export function toTex(c: HTMLCanvasElement, opt: { repeat?: boolean } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  if (opt.repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export const FONT = "MVSerif";
export async function loadFonts() {
  const f = new FontFace(FONT, `url(${serifUrl})`, { weight: "900" });
  await f.load(); document.fonts.add(f);
}

// ───────── 文字用的纹理（字面：渐变 + 破损斑点洞） ─────────
export type FaceStyle = "bone" | "ink" | "blue" | "plate";
const faceCache: Record<string, THREE.Texture> = {};
export function faceTex(style: FaceStyle): THREE.Texture {
  if (faceCache[style]) return faceCache[style];
  const S = 512; const [c, g] = cv(S, S); const r = rng(style.length * 77 + 5);
  const grad = g.createLinearGradient(0, 0, 0, S);
  if (style === "blue") { grad.addColorStop(0, "#5e63ff"); grad.addColorStop(0.35, "#8d8dff"); grad.addColorStop(0.75, "#cfd0ff"); grad.addColorStop(1, "#ffffff"); }
  else if (style === "bone") { grad.addColorStop(0, "#fffdf6"); grad.addColorStop(1, "#cfc9b8"); }
  else if (style === "ink") { grad.addColorStop(0, "#2a2b36"); grad.addColorStop(1, "#050507"); }
  else { grad.addColorStop(0, "#ffffff"); grad.addColorStop(1, "#dfe6ff"); }
  g.fillStyle = grad; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${style === "ink" ? "255,255,255" : "40,40,70"},${r() * 0.12})`; const s = r() * 4 + 1; g.fillRect(r() * S, r() * S, s, s); }
  g.strokeStyle = style === "ink" ? "rgba(255,255,255,.12)" : "rgba(20,20,60,.16)"; g.lineWidth = 1.2;
  for (let i = 0; i < 22; i++) { g.beginPath(); const x = r() * S, y = r() * S; g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 160, y + (r() - 0.5) * 40); g.stroke(); }
  if (style !== "plate") {
    g.globalCompositeOperation = "destination-out"; g.fillStyle = "#000";
    for (let i = 0; i < 150; i++) { const x = r() * S, y = r() * S, s = r() * r() * 11 + 1.5; g.beginPath(); g.arc(x, y, s, 0, 7); g.fill(); }
    for (let i = 0; i < 16; i++) { g.fillRect(r() * S, r() * S, r() * 30 + 6, r() * 2.2 + 0.8); }
    g.globalCompositeOperation = "source-over";
  }
  const t = toTex(c, { repeat: true }); t.repeat.set(1, 1); t.offset.set(0, 0.1);
  return (faceCache[style] = t);
}

// ───────── 通用纹理 ─────────
export function glowTex(color = "255,255,255", inner = 1) {
  const [c, g] = cv(128, 128); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, `rgba(${color},${inner})`); gr.addColorStop(0.4, `rgba(${color},${inner * 0.35})`); gr.addColorStop(1, `rgba(${color},0)`);
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return toTex(c);
}
export function paperTex(base = "#ebe8df", dark = "40,35,30", w = 512, h = 512, rep = 1) {
  const [c, g] = cv(w, h); const r = rng(11); g.fillStyle = base; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 4200; i++) { g.fillStyle = `rgba(${dark},${r() * 0.1})`; const s = r() * 3 + 0.5; g.fillRect(r() * w, r() * h, s, s); }
  for (let i = 0; i < 40; i++) { g.strokeStyle = `rgba(${dark},${r() * 0.08})`; g.beginPath(); const x = r() * w, y = r() * h; g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 90, y + (r() - 0.5) * 90); g.stroke(); }
  const t = toTex(c, { repeat: true }); t.repeat.set(rep, rep); return t;
}
export function concreteTex(dark = false, rep = 3) {
  const [c, g] = cv(512, 512); const r = rng(dark ? 3 : 9);
  g.fillStyle = dark ? "#1b1c22" : "#a6a59f"; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 9000; i++) { const v = r(); g.fillStyle = v > 0.5 ? `rgba(255,255,255,${r() * 0.07})` : `rgba(0,0,0,${r() * 0.12})`; const s = r() * 4 + 0.6; g.fillRect(r() * 512, r() * 512, s, s); }
  g.strokeStyle = dark ? "rgba(0,0,0,.6)" : "rgba(50,50,50,.5)"; g.lineWidth = 2; g.strokeRect(1, 1, 510, 510);
  const t = toTex(c, { repeat: true }); t.repeat.set(rep, rep); return t;
}
export function scribbleTex(seed = 1) {
  const [c, g] = cv(256, 340); const r = rng(seed * 31); g.fillStyle = "#f3f0e6"; g.fillRect(0, 0, 256, 340);
  g.strokeStyle = "rgba(90,110,170,.35)"; g.lineWidth = 1; for (let y = 28; y < 340; y += 18) { g.beginPath(); g.moveTo(10, y); g.lineTo(246, y); g.stroke(); }
  g.strokeStyle = "rgba(20,20,30,.75)"; g.lineWidth = 1.6;
  for (let k = 0; k < 9; k++) { g.beginPath(); let x = 14 + r() * 30, y = 20 + k * 34 + r() * 10; g.moveTo(x, y); for (let i = 0; i < 26; i++) { x += 7 + r() * 5; y += (r() - 0.5) * 12; g.lineTo(Math.min(x, 244), y); } g.stroke(); }
  g.strokeStyle = "rgba(30,40,160,.8)"; g.lineWidth = 3;
  for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(20 + r() * 30, 60 + r() * 200); for (let i = 0; i < 14; i++) g.lineTo(20 + r() * 210, 40 + r() * 260); g.stroke(); }
  return toTex(c);
}
export function smileTex() {
  const [c, g] = cv(256, 256); const gr = g.createRadialGradient(100, 90, 10, 128, 128, 120);
  gr.addColorStop(0, "#9fb3ff"); gr.addColorStop(1, "#3b5bff"); g.fillStyle = gr; g.beginPath(); g.arc(128, 128, 112, 0, 7); g.fill();
  g.strokeStyle = "#fff"; g.lineCap = "round"; g.lineWidth = 14; g.beginPath(); g.arc(128, 132, 58, 0.15 * Math.PI, 0.85 * Math.PI); g.stroke();
  g.fillStyle = "#fff"; g.beginPath(); g.ellipse(92, 98, 12, 18, 0, 0, 7); g.ellipse(164, 98, 12, 18, 0, 0, 7); g.fill();
  return toTex(c);
}
export function popupTex() {
  const [c, g] = cv(640, 300); g.fillStyle = "#f4f6ff"; g.fillRect(0, 0, 640, 300);
  g.fillStyle = "#4d6bfe"; g.fillRect(0, 0, 640, 58); g.strokeStyle = "#fff"; g.lineWidth = 7; g.lineCap = "round";
  g.beginPath(); g.moveTo(588, 18); g.lineTo(616, 42); g.moveTo(616, 18); g.lineTo(588, 42); g.stroke();
  g.fillStyle = "#fff"; g.beginPath(); g.arc(34, 29, 12, 0, 7); g.fill();
  g.fillStyle = "#12142a"; g.font = `900 64px ${FONT}`; g.textAlign = "center"; g.fillText("服务器繁忙", 320, 160);
  g.fillStyle = "#555a80"; g.font = `900 40px ${FONT}`; g.fillText("请稍后再试", 320, 226);
  g.strokeStyle = "#4d6bfe"; g.lineWidth = 6; g.strokeRect(3, 3, 634, 294);
  return toTex(c);
}
export function stampTex(text: string, color = "#4d6bfe") {
  const [c, g] = cv(512, 256); const r = rng(text.length * 13);
  g.strokeStyle = color; g.fillStyle = color; g.lineWidth = 14; g.strokeRect(14, 14, 484, 228);
  g.font = `900 150px ${FONT}`; g.textAlign = "center"; g.fillText(text, 256, 178);
  g.globalCompositeOperation = "destination-out"; for (let i = 0; i < 700; i++) { g.fillStyle = `rgba(0,0,0,${r()})`; g.fillRect(r() * 512, r() * 256, r() * 6 + 1, r() * 4 + 1); }
  return toTex(c);
}
export function nameTex(text: string) {
  const [c, g] = cv(512, 192); g.fillStyle = "#f0ede2"; g.fillRect(0, 0, 512, 192); g.strokeStyle = "#222"; g.lineWidth = 6; g.strokeRect(8, 8, 496, 176);
  g.fillStyle = "#16161c"; g.font = `900 120px ${FONT}`; g.textAlign = "center"; g.fillText(text, 256, 132); return toTex(c);
}
export function clockTex() {
  const [c, g] = cv(256, 256); g.fillStyle = "#f2efe6"; g.beginPath(); g.arc(128, 128, 122, 0, 7); g.fill();
  g.strokeStyle = "#16161c"; g.lineWidth = 8; g.stroke(); g.lineWidth = 5;
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; g.beginPath(); g.moveTo(128 + Math.sin(a) * 100, 128 - Math.cos(a) * 100); g.lineTo(128 + Math.sin(a) * 114, 128 - Math.cos(a) * 114); g.stroke(); }
  return toTex(c);
}
export function crackTex() {
  const [c, g] = cv(512, 512); const r = rng(5); g.strokeStyle = "#fff"; g.lineCap = "round";
  const branch = (x: number, y: number, a: number, len: number, w: number) => {
    if (len < 14 || w < 0.5) return; g.lineWidth = w; g.beginPath(); g.moveTo(x, y);
    const nx = x + Math.cos(a) * len, ny = y + Math.sin(a) * len; g.lineTo(nx, ny); g.stroke();
    branch(nx, ny, a + (r() - 0.5) * 0.9, len * 0.82, w * 0.86); if (r() > 0.45) branch(nx, ny, a + (r() > 0.5 ? 1 : -1) * (0.5 + r() * 0.7), len * 0.62, w * 0.7);
  };
  for (let i = 0; i < 9; i++) branch(256, 256, (i / 9) * Math.PI * 2 + r() * 0.4, 70, 5);
  return toTex(c);
}
export function personTex(arms = 0) {
  const [c, g] = cv(128, 192); g.fillStyle = "#000";
  g.beginPath(); g.arc(64, 54, 26, 0, 7); g.fill(); g.beginPath(); g.moveTo(10, 192); g.quadraticCurveTo(14, 98, 64, 94); g.quadraticCurveTo(114, 98, 118, 192); g.fill();
  if (arms) { g.lineCap = "round"; g.lineWidth = 17; g.strokeStyle = "#000"; g.beginPath(); g.moveTo(24, 130); g.lineTo(8, 52); g.moveTo(104, 130); g.lineTo(120, 52); g.stroke(); }
  return toTex(c);
}
export function pillowTex() {
  const [c, g] = cv(256, 160); g.fillStyle = "#e9e6dc"; g.beginPath(); g.roundRect(4, 4, 248, 152, 38); g.fill();
  g.strokeStyle = "rgba(0,0,0,.4)"; g.lineWidth = 3; g.stroke();
  const r = rng(4); for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(70,110,60,${0.25 + r() * 0.35})`; g.beginPath(); g.arc(20 + r() * 216, 14 + r() * 132, r() * 11 + 2, 0, 7); g.fill(); }
  return toTex(c);
}
export function bubbleTex() {
  const [c, g] = cv(256, 256); const gr = g.createRadialGradient(100, 90, 8, 128, 128, 120);
  gr.addColorStop(0, "rgba(220,230,255,.95)"); gr.addColorStop(1, "rgba(110,140,255,.55)");
  g.fillStyle = gr; g.beginPath(); g.arc(128, 128, 118, 0, 7); g.fill(); g.strokeStyle = "rgba(255,255,255,.9)"; g.lineWidth = 5; g.stroke();
  g.fillStyle = "#2b49d8"; g.beginPath(); g.ellipse(120, 140, 52, 28, -0.3, 0, 7); g.fill();
  g.beginPath(); g.moveTo(160, 120); g.quadraticCurveTo(200, 90, 196, 70); g.quadraticCurveTo(176, 90, 150, 104); g.fill();
  g.fillStyle = "#fff"; for (let i = 0; i < 7; i++) { g.beginPath(); g.arc(40 + i * 28, 60 + (i % 3) * 14, 3, 0, 7); g.fill(); }
  return toTex(c);
}
