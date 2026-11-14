// 总渲染：给歌曲时间 → 画一帧（镜头 + 暗角 + 颗粒 + 切点闪白 + 歌词条）。无状态。
import { W, H, Frame, clamp, FONT } from './gfx';
import { PERIOD, SHOTS, LINES, shotAt, lineAt, toBeat } from './timeline';
import { S1 } from './shots1';
import { S2 } from './shots2';

const SHOT_FN = { ...S1, ...S2 };
let grain: HTMLCanvasElement | null = null;
let vig: HTMLCanvasElement | null = null;
function prep() {
  if (grain) return;
  grain = document.createElement('canvas'); grain.width = W + 200; grain.height = H + 200;
  const g = grain.getContext('2d')!; const id = g.createImageData(grain.width, grain.height);
  for (let i = 0; i < id.data.length; i += 4) { const v = Math.random() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
  g.putImageData(id, 0, 0);
  vig = document.createElement('canvas'); vig.width = W; vig.height = H;
  const v = vig.getContext('2d')!; const gr = v.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 1.0);
  gr.addColorStop(0, 'rgba(20,5,40,0)'); gr.addColorStop(1, 'rgba(20,5,40,0.5)'); v.fillStyle = gr; v.fillRect(0, 0, W, H);
}

export const SHOT_IDS_MISSING = SHOTS.filter((s) => !(s.id in SHOT_FN)).map((s) => s.id);

export function renderFrame(ctx: CanvasRenderingContext2D, t: number, opts: { lyrics?: boolean; grain?: boolean } = {}) {
  prep();
  const b = toBeat(t); const si = shotAt(Math.max(0, b)); const sh = SHOTS[si];
  const bp = ((b % 1) + 1) % 1;
  const f: Frame = {
    c: ctx, t, b, u: clamp((b - sh.b0) / (sh.b1 - sh.b0)), st: Math.max(0, (b - sh.b0) * PERIOD), bp, pulse: Math.exp(-bp * 4.5),
    dur: (sh.b1 - sh.b0) * PERIOD, cam: { x: 0, y: 0, z: 1 },
  };
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.clip();
  const fn = SHOT_FN[sh.id]; if (fn) fn(f); else { ctx.fillStyle = '#222'; ctx.fillRect(0, 0, W, H); }
  ctx.restore();
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
  ctx.drawImage(vig!, 0, 0);
  if (opts.grain !== false && !(window as unknown as { __mvNoGrain?: boolean }).__mvNoGrain) { ctx.globalAlpha = 0.05; const o = (Math.floor(t * 12) % 5) * 40; ctx.drawImage(grain!, -o, -o); ctx.globalAlpha = 1; }
  // 切点闪白：落在拍点上
  if (si > 0 && sh.id !== 'OUT') { const fl = 1 - f.st / 0.16; if (fl > 0) { ctx.fillStyle = `rgba(255,255,255,${0.5 * fl * fl})`; ctx.fillRect(0, 0, W, H); } }
  if (opts.lyrics !== false) drawLyric(ctx, b);
  ctx.restore();
}

function drawLyric(c: CanvasRenderingContext2D, b: number) {
  const li = lineAt(b); if (li < 0) return; const L = LINES[li];
  const a = clamp((b - (L.b0 - 0.2)) / 0.25) * clamp((L.b1 - b) / 0.3 + 0.0001);
  if (a <= 0) return;
  const chars = [...L.text]; const n = chars.length; const prog = clamp((b - L.b0) / L.sweep) * n;
  const size = 44; c.save(); c.globalAlpha = a; c.font = `${size}px ${FONT}`; c.textBaseline = 'middle'; c.textAlign = 'left';
  const ws = chars.map((ch) => c.measureText(ch).width + 3); const tw = ws.reduce((p, q) => p + q, 0);
  const bw = tw + 76, bh = 74, bx = W / 2 - bw / 2, by = 622, rise = (1 - clamp((b - (L.b0 - 0.2)) / 0.25)) * 14;
  c.translate(0, rise);
  c.fillStyle = 'rgba(18,10,40,0.74)'; c.beginPath(); c.roundRect(bx, by, bw, bh, 37); c.fill();
  c.strokeStyle = 'rgba(255,214,120,0.55)'; c.lineWidth = 2; c.stroke();
  let x = bx + 38;
  chars.forEach((ch, i) => {
    const k = clamp(prog - i); const cur = prog > i && prog < i + 1;
    const y = by + bh / 2 + 2 - (cur ? 5 : 0);
    c.lineWidth = 6; c.lineJoin = 'round'; c.strokeStyle = 'rgba(20,10,40,0.9)'; c.strokeText(ch, x, y);
    c.fillStyle = '#ffffff'; c.fillText(ch, x, y);
    if (k > 0) { c.save(); c.beginPath(); c.rect(x - 2, y - size, (ws[i] + 4) * k, size * 2); c.clip(); c.fillStyle = '#ffcf5a'; c.fillText(ch, x, y); c.restore(); }
    x += ws[i];
  });
  c.restore();
}
