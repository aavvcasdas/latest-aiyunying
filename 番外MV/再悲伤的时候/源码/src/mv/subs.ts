// 三维逐字歌词卡：每个字 = 字槽（提前浮现的淡字）+ 正面 + 五层厚度 + 光晕。
// 字在实测起音那一拍「落进字槽」，字内从左到右（竖排从上到下）卡拉 OK 填色，填满正好是下一个字的起音；
// 关键词在最后一个字起音时整词弹一下、发光。入场方式按歌词意思逐句挑（见 lyrics.ts）。
import * as THREE from 'three';
import fontUrl from '../assets/zcool.woff';
import { LINES } from './timing';
import { PARSED, SPEC, type LineSpec, type ParsedLine, type Style } from './lyrics';
import { Particles, TEX, bump, clamp, decay, eBack, eIn, eOut, hash, lerp, range } from './core';

export const FONT = 'ZCOOLKL';
export async function loadFont() {
  try { const ff = new FontFace(FONT, `url(${fontUrl})`); await ff.load(); document.fonts.add(ff); }
  catch (e) { console.warn('字体载入失败，退回系统字体', e); }
}

// ---------- 字形图集：R = 字身，G = 描边 ----------
const CELL = 128, COLS = 16; const GI = new Map<string, number>(); let GT: THREE.CanvasTexture; let ROWS = 1;
function buildGlyphs(extra: string) {
  const chars = [...new Set(LINES.map((l) => l.text).join('') + extra)]; ROWS = Math.ceil(chars.length / COLS);
  const cv = document.createElement('canvas'); cv.width = COLS * CELL; cv.height = ROWS * CELL; const g = cv.getContext('2d')!;
  g.fillStyle = '#000'; g.fillRect(0, 0, cv.width, cv.height); g.globalCompositeOperation = 'lighter';
  g.font = `${Math.round(CELL * 0.74)}px '${FONT}', 'PingFang SC', 'Microsoft YaHei', sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
  chars.forEach((c, i) => {
    const x = (i % COLS) * CELL + CELL / 2, y = Math.floor(i / COLS) * CELL + CELL * 0.54;
    g.strokeStyle = 'rgb(0,255,0)'; g.lineWidth = CELL * 0.14; g.strokeText(c, x, y); g.fillStyle = 'rgb(255,0,0)'; g.fillText(c, x, y); GI.set(c, i);
  });
  GT = new THREE.CanvasTexture(cv); GT.colorSpace = THREE.NoColorSpace; GT.anisotropy = 4;
}
function rectOf(c: string) { const i = GI.get(c) ?? 0; return new THREE.Vector4((i % COLS) / COLS, 1 - (Math.floor(i / COLS) + 1) / ROWS, 1 / COLS, 1 / ROWS); }

const VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }';
const FS = `uniform sampler2D map; uniform vec4 rect; uniform float fill, opacity, glow, vert, mode; uniform vec3 cBase, cHi, cLine, cDepth; varying vec2 vUv;
void main(){
  vec4 s = texture2D(map, rect.xy + vUv * rect.zw); float body = s.r, line = s.g, a = max(body, line); vec3 col;
  if (mode > 1.5) { col = mix(cLine, cBase, body); a *= opacity; }
  else if (mode > 0.5) { if (a < 0.35) discard; col = cDepth; a = opacity; }
  else {
    float coord = vert > 0.5 ? 1.0 - vUv.y : vUv.x;
    float f = smoothstep(fill - 0.06, fill + 0.04, coord);
    float edge = (1.0 - smoothstep(0.0, 0.08, abs(coord - fill))) * step(0.002, fill) * step(fill, 0.998);
    col = mix(cLine, mix(cHi, cBase, f), body) + body * (edge * 0.55 + glow * 0.45) * cHi; a *= opacity;
  }
  if (a < 0.01) discard;
  gl_FragColor = vec4(col, a);
  #include <colorspace_fragment>
}`;
const GEO = new THREE.PlaneGeometry(1, 1);
function cardMat(c: string, mode: number, hi: THREE.Color, depth: THREE.Color) {
  return new THREE.ShaderMaterial({
    vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: mode === 1, side: THREE.DoubleSide,
    uniforms: { map: { value: GT }, rect: { value: rectOf(c) }, fill: { value: 0 }, opacity: { value: 1 }, glow: { value: 0 }, vert: { value: 0 }, mode: { value: mode },
      cBase: { value: new THREE.Color('#f6f7ff') }, cHi: { value: hi.clone() }, cLine: { value: new THREE.Color('#141a33') }, cDepth: { value: depth.clone() } },
  });
}

interface Card { g: THREE.Group; face: THREE.Mesh; fm: THREE.ShaderMaterial; dm: THREE.ShaderMaterial; slot: THREE.Mesh; sm: THREE.ShaderMaterial; halo: THREE.Sprite; refl?: THREE.Mesh; rm?: THREE.ShaderMaterial; hx: number; hy: number; size: number }
const WARM = new THREE.Color('#ffc46b'), COOL = new THREE.Color('#8fd0ff');

class SubLine {
  root = new THREE.Group(); cards: Card[] = []; text: string; on: number[]; end: number; spec: LineSpec; P: ParsedLine; vert: boolean;
  constructor(text: string, on: number[], end: number, spec: LineSpec, P: ParsedLine, scene: THREE.Scene) {
    this.text = text; this.on = on; this.end = end; this.spec = spec; this.P = P; this.vert = spec.layout === 'vert';
    const hi = new THREE.Color(spec.hi), depth = hi.clone().multiplyScalar(0.28).lerp(new THREE.Color('#0b1024'), 0.45);
    const n = text.length, base = spec.layout === 'center' ? 0.74 : spec.layout === 'vert' ? 0.6 : n > 9 ? 0.5 : 0.56;
    const sizes = P.segs.map((s) => base * (s.key ? 1.12 : 1)); const gap = 0.06 * base;
    const total = sizes.reduce((a, b) => a + b, 0) + gap * (n - 1); let cur = -total / 2;
    P.segs.forEach((s, k) => {
      const size = sizes[k]; const mid = cur + size / 2; cur += size + gap;
      let hx = this.vert ? 0 : mid, hy = this.vert ? -mid : 0;
      if (spec.layout === 'arc') { const a = (mid / total) * 1.4; hx = Math.sin(a) * 3.2; hy = Math.cos(a) * 3.2 - 3.2; }
      const g = new THREE.Group(); const fm = cardMat(s.c, 0, hi, depth), dm = cardMat(s.c, 1, hi, depth), sm = cardMat(s.c, 2, hi, depth);
      fm.uniforms.vert.value = this.vert ? 1 : 0;
      const face = new THREE.Mesh(GEO, fm); face.renderOrder = 3; g.add(face);
      for (let d = 1; d <= 5; d++) { const m = new THREE.Mesh(GEO, dm); m.position.z = -d * 0.022 * size / 0.5; m.renderOrder = 1; g.add(m); }
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: TEX.glow, color: hi, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
      halo.scale.set(size * 2.4, size * 2.4, 1); halo.position.z = -0.15; halo.renderOrder = 0; g.add(halo);
      g.scale.setScalar(size);
      const slot = new THREE.Mesh(GEO, sm); slot.renderOrder = 2; slot.scale.setScalar(size); slot.position.set(hx, hy, -0.02); this.root.add(slot);
      const card: Card = { g, face, fm, dm, slot, sm, halo, hx, hy, size };
      if (spec.style === 'mirage') { const rm = cardMat(s.c, 0, hi, depth); const refl = new THREE.Mesh(GEO, rm); refl.renderOrder = 2; this.root.add(refl); card.refl = refl; card.rm = rm; }
      this.root.add(g); this.cards.push(card);
    });
    const L = spec.layout; const r = this.root;
    if (L === 'low') { r.position.set(0, -1.78, 0); r.rotation.set(-0.16, -0.05, 0); }
    else if (L === 'top') { r.position.set(0, 1.72, 0); r.rotation.set(0.14, 0.05, 0); }
    else if (L === 'left') { r.position.set(-2.55, -1.15, 0); r.rotation.set(-0.08, 0.38, 0.02); }
    else if (L === 'right') { r.position.set(2.45, -1.3, 0); r.rotation.set(-0.08, -0.38, -0.02); }
    else if (L === 'center') { r.position.set(0, -0.95, 0.4); r.rotation.set(-0.05, 0, 0); }
    else if (L === 'vert') { r.position.set(3.35, 0.15, 0); r.rotation.set(0, -0.32, 0); }
    else { r.position.set(0, 1.9, 0); }
    r.visible = false; scene.add(r);
  }

  update(t: number, fx: Particles) {
    const n = this.text.length, t0 = this.on[0], t1 = this.end, st: Style = this.spec.style;
    const from = t0 - 0.42, to = t1 + 0.62; this.root.visible = t > from && t < to; if (!this.root.visible) return;
    const ghost = range(t, from, from + 0.24);
    this.root.updateMatrixWorld();
    for (let k = 0; k < n; k++) {
      const c = this.cards[k], seg = this.P.segs[k], word = this.P.words[seg.word];
      const on = this.on[k], next = k < n - 1 ? this.on[k + 1] : t1, dur = clamp(next - on, 0.1, 1.6);
      const lead = st === 'rain' || st === 'deep' || st === 'sweep' || st === 'halt' ? 0.2 : 0.15;
      const pin = range(t, on - lead, on + 0.02), q = 1 - eOut(pin), landed = t >= on;
      const fill = range(t, on, on + dur * 0.94);
      const wl = this.on[word.to], pop = seg.key ? bump(t, wl, 0.34) : 0, sing = landed && t < next + 0.05 ? 1 : 0;
      const ex = range(t, t1 + 0.05 + k * 0.025, t1 + 0.4 + k * 0.025), exE = eIn(ex);
      let x = c.hx, y = c.hy, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, op = pin > 0 ? lerp(0.0, 1, eOut(range(t, on - lead, on - lead * 0.3))) : 0;
      let glow = pop * 1.1 + (seg.key ? sing * 0.35 : 0);
      const sd = hash(k * 7.1 + t0);
      switch (st) {
        case 'rain': { const pr = range(t, on - 0.2, on); y += (1 - pr * pr) * 1.9; const sq = bump(t, on, 0.18); sy *= 1 - 0.28 * sq; sx *= 1 + 0.18 * sq; y -= exE * 0.9; break; }
        case 'shiver': rz += q * (k % 2 ? 0.9 : -0.9); sx = sy = 1 + q * 0.7; x += Math.sin(t * 70 + k) * 0.035 * decay(t, on, 4) * (landed ? 1 : 0); break;
        case 'mirage': x += Math.sin(t * 5.5 + k * 0.9) * 0.05 * (0.4 + q); sy *= 1 + Math.sin(t * 7 + k) * 0.04; op *= 0.82 + 0.18 * Math.sin(t * 3 + k); y += q * 0.25; break;
        case 'drift': x += q * 1.3; ry += q * 0.7; x += exE * 0.8; break;
        case 'hesitate': sx = sy = lerp(1, 0.15, q) * (k === n - 1 ? 1 + 0.16 * fill : 1); rz += Math.sin(t * 9 + k * 2) * 0.06 * (landed ? 1 - fill * 0.6 : 0); break;
        case 'sneak': { x -= q * 0.6; const s0 = Math.max(on + dur + 0.12, this.on[Math.min(n - 1, 7)] + (k >= 7 ? dur + 0.1 : 0)); const sn = range(t, s0, s0 + 0.55); x += eIn(sn) * 3.4; ry -= sn * 0.9; op *= 1 - sn; break; }
        case 'moon': sx = sy = 1 + q * 0.6; y += q * 0.35; glow += 0.25 * (landed ? 1 : 0); break;
        case 'deep': z -= q * 9; rx += q * 1.3; z -= exE * 6; break;
        case 'bloom': rz += q * -2.4; sx = sy = eBack(pin, 2.2); break;
        case 'wish': y -= q * 0.9; glow += 0.3 * fill; y += exE * 0.8; break;
        case 'eyelid': sy *= eOut(range(t, on - 0.04, on + 0.18)); sx = sy > 0 ? 1 : 0; op = Math.max(op, landed ? 1 : 0); glow += decay(t, on, 5) * 1.2; break;
        case 'flicker': { const cool = k % 2 === 0; c.fm.uniforms.cHi.value.copy(cool ? COOL : WARM); sx = sy = 1 + q * 0.5 + bump(t, on, 0.15) * 0.15; if (k >= n - 3) glow += decay(t, on, 6) * 1.5; break; }
        case 'burst': { const a = sd * Math.PI * 2; x = lerp(c.hx, 0, q) + Math.cos(a) * q * 0.5; y = lerp(c.hy, -0.25, q) + Math.sin(a) * q * 0.5; sx = sy = eBack(pin, 2.6); rz += q * (sd - 0.5) * 4; x += (c.hx) * exE * 0.6; y += exE * 0.6; break; }
        case 'float': y += q * 1.5 + Math.sin(t * 2.2 + k) * 0.05; x += Math.sin(q * 3 + k) * 0.25 * q; y -= exE * 1.2; break;
        case 'sweep': x -= q * 3.8; rz += q * 1.6; x += exE * 2.5; break;
        case 'turn': ry += q * Math.PI; break;
        case 'wave': y += Math.sin(t * 3.2 + k * 0.7) * 0.06 - q * 0.6; rz += Math.sin(t * 3.2 + k * 0.7 + 1) * 0.04; break;
        case 'halt': { const pr = range(t, on - 0.2, on); x -= (1 - eOut(pr)) * 2.4; sx *= 1 + bump(t, on, 0.14) * 0.25; sy *= 1 - bump(t, on, 0.14) * 0.15; break; }
        case 'calm': y -= q * 0.3; break;
        case 'vast': x = c.hx * lerp(1, 0.15, q) * (1 + exE * 0.8); sx = sy = 1 + q * 0.5; break;
        case 'sun': ry += q * Math.PI * 0.6; sx = sy = eBack(pin, 2); glow += seg.key ? 0.3 : 0; break;
      }
      // 通用退场：淡出 + 往后飘
      op *= ghost * (1 - ex); z -= exE * 0.6; if (st !== 'rain' && st !== 'float' && st !== 'wish') y += exE * 0.25;
      const pp = 1 + pop * 0.2;
      c.g.position.set(x, y, z); c.g.rotation.set(rx, ry, rz); c.g.scale.set(c.size * sx * pp, c.size * sy * pp, c.size * pp);
      c.fm.uniforms.fill.value = fill; c.fm.uniforms.opacity.value = op; c.fm.uniforms.glow.value = glow;
      c.dm.uniforms.opacity.value = op > 0.5 ? (op - 0.5) * 2 : 0; c.g.visible = op > 0.01;
      (c.halo.material as THREE.SpriteMaterial).opacity = clamp(glow * 0.55) * op;
      c.sm.uniforms.opacity.value = 0.22 * ghost * (1 - eOut(range(t, on - 0.05, on + 0.12))) * (1 - ex);
      if (c.refl && c.rm) {
        c.refl.position.set(x + Math.sin(t * 8 + k) * 0.08, c.hy - c.size * 1.08, -0.05); c.refl.scale.set(c.size * sx, -c.size * sy * 0.9, c.size);
        c.rm.uniforms.fill.value = fill; c.rm.uniforms.opacity.value = op * 0.28;
      }
      // 粒子：关键词落地迸光；盛宴句每字开花；烟火句每字火星
      const emit = st === 'bloom' || st === 'burst' ? 1 : seg.key && k === word.to ? 1 : 0;
      if (emit && t >= on && t < on + 0.7) {
        const wp = new THREE.Vector3(); c.g.getWorldPosition(wp); const age = t - on;
        const col = st === 'bloom' ? [1, 0.75, 0.82] : (this.spec.hi === '#ffffff' ? [1, 1, 1] : [c.fm.uniforms.cHi.value.r, c.fm.uniforms.cHi.value.g, c.fm.uniforms.cHi.value.b]);
        for (let i = 0; i < 12; i++) {
          const a = (i / 12) * Math.PI * 2 + sd * 3, sp = (0.7 + hash(i + k * 3) * 0.6) * c.size * 1.6, s = sp * (1 - Math.exp(-age * 5));
          fx.add(wp.x + Math.cos(a) * s, wp.y + Math.sin(a) * s - age * age * 0.6, wp.z + 0.1, col[0], col[1], col[2], (1 - age / 0.7) * 0.9, (st === 'bloom' ? 0.09 : 0.06) * c.size * 2);
        }
      }
    }
  }
}

export class Subtitles {
  scene = new THREE.Scene(); cam = new THREE.PerspectiveCamera(30, 16 / 9, 0.1, 100); lines: SubLine[] = []; fx: Particles;
  constructor() {
    buildGlyphs('在悲伤的时候');
    LINES.forEach((l, i) => this.lines.push(new SubLine(l.text, l.on, l.end, SPEC[i], PARSED[i], this.scene)));
    // 片尾标题卡：同一套字卡，按拍落下
    const tOn = [50.02, 50.1, 50.18, 50.26, 50.34, 50.42];
    const tspec: LineSpec = { seg: '在/*悲伤/的/时候', style: 'calm', layout: 'center', hi: '#ffe2a0', scene: '', note: '' };
    this.lines.push(new SubLine('在悲伤的时候', tOn, 99, tspec, { segs: [...'在悲伤的时候'].map((c, i) => ({ c, word: i, key: i === 1 || i === 2 })), words: [...'在悲伤的时候'].map((c, i) => ({ from: i, to: i, key: i === 1 || i === 2, text: c })) }, this.scene));
    this.fx = new Particles(1200); this.scene.add(this.fx.pts);
    this.cam.position.set(0, 0, 10);
  }
  update(t: number) {
    this.cam.position.set(Math.sin(t * 0.37) * 0.25, Math.sin(t * 0.29) * 0.12, 10); this.cam.lookAt(0, 0, 0);
    this.fx.begin(); for (const l of this.lines) l.update(t, this.fx); this.fx.commit();
  }
}
