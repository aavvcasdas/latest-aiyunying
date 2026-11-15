import * as THREE from 'three';
import fontUrl from '../assets/zcool.woff2';
import { backOut, clamp, easeIn, easeOut, hash, PI, range, smooth } from './core';
import { texGlow } from './kit';
import { LYRIC_CUES, parseSegSrc, type LyricCue, type LyricStyle } from './timeline';

export const FONT_FAMILY = 'ZCOOLKL';
export const FONT_STACK = `'${FONT_FAMILY}', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif`;

let fontLoaded = false;
export async function loadLyricsFont(): Promise<void> {
  if (fontLoaded) return;
  try {
    const ff = new FontFace(FONT_FAMILY, `url(${fontUrl})`);
    await ff.load();
    document.fonts.add(ff);
    fontLoaded = true;
  } catch (e) {
    console.warn('[lyrics3d] ZCOOL font load fallback:', e);
  }
}

const CELL = 128;
const COLS = 16;
let glyphTex: THREE.CanvasTexture | null = null;
let glyphRows = 1;
const glyphMap = new Map<string, number>();

export function buildGlyphAtlas(extraChars = ''): void {
  const charSet = new Set<string>();
  for (const cue of LYRIC_CUES) {
    for (const ch of cue.text) charSet.add(ch);
  }
  for (const ch of extraChars) {
    if (ch.trim()) charSet.add(ch);
  }
  const chars = [...charSet];
  glyphRows = Math.max(1, Math.ceil(chars.length / COLS));

  const cv = document.createElement('canvas');
  cv.width = COLS * CELL;
  cv.height = glyphRows * CELL;
  const g = cv.getContext('2d')!;
  g.fillStyle = '#000000';
  g.fillRect(0, 0, cv.width, cv.height);
  g.font = `94px ${FONT_STACK}`;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.lineJoin = 'round';
  g.lineCap = 'round';

  glyphMap.clear();
  chars.forEach((ch, idx) => {
    const x = (idx % COLS) * CELL + CELL / 2;
    const y = Math.floor(idx / COLS) * CELL + CELL / 2 + 4;
    g.strokeStyle = '#00ff00';
    g.lineWidth = 18;
    g.strokeText(ch, x, y);
    g.fillStyle = '#ff0000';
    g.fillText(ch, x, y);
    glyphMap.set(ch, idx);
  });

  if (glyphTex) glyphTex.dispose();
  glyphTex = new THREE.CanvasTexture(cv);
  glyphTex.colorSpace = THREE.NoColorSpace;
  glyphTex.anisotropy = 8;
  glyphTex.minFilter = THREE.LinearMipmapLinearFilter;
  glyphTex.generateMipmaps = true;
  glyphTex.needsUpdate = true;
}

function rectOf(c: string): THREE.Vector4 {
  const i = glyphMap.get(c) ?? 0;
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  return new THREE.Vector4(
    col / COLS,
    1 - (row + 1) / glyphRows,
    (col + 1) / COLS,
    1 - row / glyphRows
  );
}

const GLYPH_VERT = `
uniform vec4 uRect;
varying vec2 vUv;
varying vec2 vLoc;
void main() {
  vLoc = uv;
  vUv = vec2(mix(uRect.x, uRect.z, uv.x), mix(uRect.y, uRect.w, uv.y));
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const GLYPH_FRAG = `
uniform sampler2D map;
uniform vec3 cBase;
uniform vec3 cHi;
uniform vec3 cStroke;
uniform float uFill;
uniform float uOp;
uniform float uDepth;
uniform float uGlow;
varying vec2 vUv;
varying vec2 vLoc;
void main() {
  vec4 t = texture2D(map, vUv);
  float f = t.r;
  float s = t.g;
  float a = clamp(f + s, 0.0, 1.0);
  if (uDepth > 0.5) {
    if (a < 0.45) discard;
    gl_FragColor = vec4(cStroke, uOp);
    return;
  }
  if (a < 0.03) discard;
  float sweep = smoothstep(uFill - 0.08, uFill + 0.08, vLoc.x);
  vec3 fillCol = mix(cHi, cBase, sweep) * (1.0 + uGlow * 0.45);
  vec3 col = (fillCol * f + cStroke * s) / max(a, 0.001);
  gl_FragColor = vec4(col, a * uOp);
}`;

const GLYPH_PLANE = new THREE.PlaneGeometry(1, 1);

function makeGlyphMat(
  rect: THREE.Vector4,
  baseHex: number,
  hiHex: number,
  strokeHex: number,
  isDepth: boolean
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      map: { value: glyphTex },
      uRect: { value: rect },
      cBase: { value: new THREE.Color(baseHex) },
      cHi: { value: new THREE.Color(hiHex) },
      cStroke: { value: new THREE.Color(strokeHex) },
      uFill: { value: 0 },
      uOp: { value: 0 },
      uDepth: { value: isDepth ? 1 : 0 },
      uGlow: { value: 0 },
    },
    vertexShader: GLYPH_VERT,
    fragmentShader: GLYPH_FRAG,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });
}

interface GlyphCard {
  c: string;
  i: number;
  wordIdx: number;
  key: boolean;
  x: number;
  y: number;
  t0: number;
  t1: number;
  wt0: number;
  wt1: number;
  r: number;
  baseScale: number;
  g: THREE.Group;
  m: THREE.ShaderMaterial;
  dm: THREE.ShaderMaterial;
  gm: THREE.ShaderMaterial;
  ghost: THREE.Mesh;
  glow: THREE.Sprite | null;
}

interface WordBar {
  mesh: THREE.Mesh;
  mat: THREE.MeshBasicMaterial;
  wt0: number;
  wt1: number;
  key: boolean;
  width: number;
  x: number;
  y: number;
}

export class Line3D {
  grp = new THREE.Group();
  glyphs: GlyphCard[] = [];
  bars: WordBar[] = [];
  style: LyricStyle;
  start: number;
  end: number;
  prevEnd: number;
  nextStart: number;
  tilt: number;
  showGhost: boolean;

  constructor(
    cue: LyricCue,
    idx: number,
    opts?: {
      ghost?: boolean;
      yOverride?: number;
      sizeOverride?: number;
      scaleKey?: number;
      prevEnd?: number;
      nextStart?: number;
    }
  ) {
    this.style = cue.style;
    this.start = cue.t[0];
    this.end = cue.end;
    this.prevEnd = opts?.prevEnd ?? -10;
    this.nextStart = opts?.nextStart ?? 999;
    this.tilt = cue.tilt ?? (idx % 2 === 0 ? 0.1 : -0.1);
    this.showGhost = opts?.ghost ?? true;

    const S = opts?.sizeOverride ?? cue.size ?? 0.46;
    const keyBoost = opts?.scaleKey ?? (cue.style === 'miracleRise' ? 1.24 : 1.13);
    const [hiCol, keyCol, strokeCol, depthCol] = cue.colors;
    const parsed = parseSegSrc(cue.segSrc);
    const adv = S * 1.05;
    const wordGap = S * 0.36;

    // Layout character X positions grouped by word and row
    const rowsX: number[][] = Array.from({ length: parsed.rows }, () => []);
    const xs: number[] = [];
    let lastRow = -1;
    let lastWord = -1;
    let cursorX = 0;

    parsed.segs.forEach((seg) => {
      if (seg.row !== lastRow) {
        cursorX = 0;
        lastRow = seg.row;
        lastWord = seg.word;
      } else {
        cursorX += adv;
        if (seg.word !== lastWord) {
          cursorX += wordGap;
          lastWord = seg.word;
        }
      }
      xs.push(cursorX);
      rowsX[seg.row].push(cursorX);
    });

    const baseY = opts?.yOverride ?? cue.y ?? -1.32;
    const n = parsed.segs.length;
    const gxList: number[] = [];
    const gyList: number[] = [];

    parsed.segs.forEach((seg, i) => {
      const rx = rowsX[seg.row];
      const rowW = rx[rx.length - 1] - rx[0];
      let gx = xs[i] - rowW / 2;
      let gy = baseY;
      if (parsed.rows === 2) {
        gx += seg.row === 0 ? -S * 0.48 : S * 0.48;
        gy += seg.row === 0 ? S * 0.64 : -S * 0.64;
      }
      gxList.push(gx);
      gyList.push(gy);

      const t0 = cue.t[i] ?? cue.t[cue.t.length - 1];
      const t1 = Math.max(
        t0 + 0.08,
        i < n - 1 ? cue.t[i + 1] : Math.min(cue.end, t0 + 0.65)
      );
      const wd = parsed.words[seg.word];
      const wt0 = cue.t[wd.from] ?? t0;
      const wt1 = cue.t[wd.to] ?? t0;
      const rect = rectOf(seg.c);

      const m = makeGlyphMat(rect, 0xf7f2e8, seg.key ? keyCol : hiCol, strokeCol, false);
      const dm = makeGlyphMat(rect, 0, 0, seg.key ? depthCol : 0x261a44, true);
      const gm = makeGlyphMat(rect, 0xf4efe4, 0xf4efe4, strokeCol, false);

      const g = new THREE.Group();
      // 5 layers of 3D extruded depth thickness
      for (let k = 5; k >= 1; k--) {
        const dMesh = new THREE.Mesh(GLYPH_PLANE, dm);
        dMesh.position.set(0.013 * k, -0.013 * k, -0.042 * k);
        dMesh.renderOrder = 1000 + (6 - k);
        g.add(dMesh);
      }
      const front = new THREE.Mesh(GLYPH_PLANE, m);
      front.renderOrder = 1010;
      g.add(front);

      const baseScale = S * (seg.key ? keyBoost : 1.0);
      g.scale.setScalar(baseScale);

      let glow: THREE.Sprite | null = null;
      if (seg.key) {
        glow = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: texGlow(),
            color: keyCol,
            transparent: true,
            opacity: 0,
            blending: THREE.AdditiveBlending,
            depthTest: false,
            depthWrite: false,
          })
        );
        glow.scale.setScalar(2.4);
        glow.renderOrder = 998;
        g.add(glow);
      }

      const ghost = new THREE.Mesh(GLYPH_PLANE, gm);
      ghost.renderOrder = 996;
      ghost.scale.setScalar(baseScale * 0.92);
      ghost.position.set(gx, gy, -0.08);

      this.grp.add(g, ghost);
      this.glyphs.push({
        c: seg.c,
        i,
        wordIdx: seg.word,
        key: seg.key,
        x: gx,
        y: gy,
        t0,
        t1,
        wt0,
        wt1,
        r: hash(idx * 37 + i * 11 + 5),
        baseScale,
        g,
        m,
        dm,
        gm,
        ghost,
        glow,
      });
    });

    // Subtle glowing 3D word-grouping accent underbars beneath each semantic word
    parsed.words.forEach((wd) => {
      const xStart = gxList[wd.from];
      const xEnd = gxList[wd.to];
      const yPos = gyList[wd.from] - S * 0.56;
      const width = Math.max(S * 0.72, xEnd - xStart + S * 0.82);
      const centerX = (xStart + xEnd) / 2;
      const mat = new THREE.MeshBasicMaterial({
        color: wd.key ? keyCol : hiCol,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        depthWrite: false,
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, wd.key ? 0.048 : 0.026), mat);
      mesh.position.set(centerX, yPos, -0.04);
      mesh.renderOrder = 999;
      this.grp.add(mesh);
      this.bars.push({
        mesh,
        mat,
        wt0: cue.t[wd.from] ?? this.start,
        wt1: cue.t[wd.to] ?? this.start,
        key: wd.key,
        width,
        x: centerX,
        y: yPos,
      });
    });
  }

  /** Updates every 3D glyph & word accent bar; returns 0..1 keyword beat kick for camera punch */
  update(t: number): number {
    const tightAfter = this.nextStart - this.end < 0.32;
    const exitSpan = tightAfter ? 0.15 : 0.32;
    const exitBase = tightAfter ? Math.min(this.end - 0.06, this.nextStart - 0.14) : this.end + 0.02;
    const visStart = Math.max(this.start - 0.45, this.prevEnd - 0.02);
    const visEnd = Math.min(this.end + 0.55, this.nextStart + 0.04);
    const vis = t > visStart && t < visEnd;
    this.grp.visible = vis;
    if (!vis) return 0;

    // Gentle 3D spatial sway in camera space
    this.grp.rotation.set(
      Math.sin(t * 0.7) * 0.025,
      this.tilt * Math.cos(t * 0.65),
      Math.sin(t * 0.5) * 0.014
    );

    let kick = 0;
    const lineProg = range(t, this.start, this.end);
    const st = this.style;
    const ghostStart = Math.max(this.start - 0.40, this.prevEnd + 0.02);
    const ghostIn =
      this.showGhost && ghostStart < this.start - 0.06
        ? 0.15 * range(t, ghostStart, this.start - 0.05)
        : 0;

    for (const g of this.glyphs) {
      const lead =
        st === 'vortexDive' ? 0.22 : st === 'tearFall' ? 0.30 : st === 'miracleRise' ? 0.26 : 0.18;
      const a = range(t, g.t0 - lead, g.t0);
      const ex = exitBase + g.i * (tightAfter ? 0.008 : 0.02);
      const e = range(t, ex, ex + exitSpan);

      const charLand = t >= g.t0 ? Math.exp(-(t - g.t0) * 8.5) : 0;
      const wordPop = g.key && t >= g.wt1 ? Math.exp(-(t - g.wt1) * 5.0) : 0;
      if (g.key && t >= g.wt1 && t < g.wt1 + 0.22) {
        kick = Math.max(kick, 1 - (t - g.wt1) / 0.22);
      }

      let x = g.x;
      let y = g.y;
      let z = 0;
      let rx = 0;
      let ry = 0;
      let rz = 0;
      let s = 1;
      let op = smooth(a * 1.9);
      const ia = 1 - easeOut(a);

      switch (st) {
        case 'thunderDrop': {
          y += ia * 2.5;
          if (t >= g.t0) y += Math.sin(clamp((t - g.t0) / 0.22) * PI) * 0.12;
          rz = ia * (g.r - 0.5) * 1.3;
          z = g.key ? 0.16 : 0;
          break;
        }
        case 'vortexDive': {
          const ang = ia * PI * 1.35 * (g.i % 2 ? 1 : -1);
          z = -ia * 5.2 + (t >= g.t0 ? Math.sin((t - g.t0) * 5) * 0.04 : 0);
          rz = ang * 0.55;
          ry = ia * 0.9;
          break;
        }
        case 'impactShake': {
          z = ia * 2.6;
          s *= 1 + ia * 0.85;
          if (t >= g.t0) {
            const amp = Math.exp(-(t - g.t0) * 4.5) * (g.key ? 0.13 : 0.06) + 0.006;
            x += Math.sin(t * 58 + g.i * 7) * amp;
            y += Math.cos(t * 51 + g.i * 5) * amp;
          }
          break;
        }
        case 'driftWave': {
          y -= ia * 1.1;
          rx = -ia * 1.2;
          const wave = Math.sin(t * 3.1 - g.i * 0.55);
          y += wave * 0.085;
          rz += wave * 0.08;
          break;
        }
        case 'pageFlip': {
          ry = (1 - backOut(a, 1.3)) * PI * 0.95;
          z = -ia * 1.4;
          y += Math.sin(t * 1.8 + g.i) * 0.025;
          break;
        }
        case 'tearFall': {
          y += ia * 1.65;
          z = -ia * 1.2;
          if (t >= g.t0) {
            // Soft floating shimmer like water reflections
            y -= (t - g.t0) * 0.035;
            y += Math.sin(t * 2.4 + g.i * 0.7) * 0.03;
          }
          break;
        }
        case 'dreamPop': {
          const pop = backOut(a, 2.2);
          s *= Math.max(0.01, pop);
          y -= (1 - pop) * 0.65;
          rz = (1 - pop) * (g.r - 0.5) * 0.8 + Math.sin(t * 3.5 + g.i) * 0.04;
          break;
        }
        case 'heavySink': {
          z = -ia * 2.4;
          y += ia * 0.45 - lineProg * 0.18;
          rx = ia * 0.6;
          break;
        }
        case 'miracleRise': {
          y -= ia * 1.7;
          z = -ia * 2.6 + (g.key ? 0.25 : 0);
          ry = (1 - backOut(a, 1.4)) * PI * 0.75;
          if (t >= g.t0) {
            y += Math.sin(t * 2.8 + g.i * 0.6) * 0.05;
          }
          break;
        }
      }

      // Bespoke exits
      if (e > 0) {
        if (st === 'pageFlip') {
          y -= easeIn(e) * 2.2;
          rz += e * (g.r - 0.5) * 2.2;
          s *= 1 - e * 0.4;
        } else if (st === 'tearFall' || st === 'heavySink') {
          y -= easeIn(e) * 1.8;
          z -= e * 1.0;
        } else if (st === 'miracleRise') {
          y += easeOut(e) * 0.9;
          z += easeIn(e) * 2.2;
        } else {
          y += easeOut(e) * 0.45;
          z += e * 1.5;
          rx += e * 0.65;
        }
        op *= 1 - e;
      }

      const scalePulse = 1 + charLand * (g.key ? 0.34 : 0.20) + wordPop * 0.28;
      g.g.position.set(x, y, z);
      g.g.rotation.set(rx, ry, rz);
      g.g.scale.setScalar(g.baseScale * s * scalePulse);

      g.m.uniforms.uFill.value = range(t, g.t0, g.t1);
      g.m.uniforms.uOp.value = op;
      g.dm.uniforms.uOp.value = op * 0.94;
      g.m.uniforms.uGlow.value = wordPop + charLand * 0.35;
      g.gm.uniforms.uOp.value = a > 0 ? ghostIn * (1 - smooth(a * 2.2)) : ghostIn * (1 - e);

      if (g.glow) {
        (g.glow.material as THREE.SpriteMaterial).opacity =
          op * (0.22 + 0.65 * wordPop + 0.25 * charLand) * (t >= g.t0 ? 1 : 0.15);
      }
    }

    // Animate word-level sync underbars
    const lineOut = 1 - range(t, exitBase, exitBase + exitSpan);
    for (const b of this.bars) {
      const wProg = range(t, b.wt0, Math.max(b.wt0 + 0.12, b.wt1 + 0.18));
      const pop = b.key && t >= b.wt1 ? Math.exp(-(t - b.wt1) * 4.5) : 0;
      const active = t >= b.wt0 - 0.05 ? 1 : 0;
      b.mesh.scale.set(b.width * Math.max(0.01, easeOut(wProg)), 1 + pop * 1.6, 1);
      b.mat.opacity = active * lineOut * (b.key ? 0.55 + pop * 0.45 : 0.24);
    }

    return kick;
  }
}

export class Lyrics3DManager {
  root = new THREE.Group();
  lines: Line3D[] = [];
  titleCard: Line3D;
  kick = 0;
  hidden = false;

  constructor() {
    this.root.position.set(0, 0, -6.2);

    // Dramatic 0.22s vocal-hook 3D Title Card in the prologue!
    this.titleCard = new Line3D(
      {
        id: 'TITLE',
        text: '不小心惹了上帝',
        segSrc: '不小心/惹了/*上帝',
        t: [0.16, 0.20, 0.24, 0.28, 0.32, 0.38, 0.44],
        end: 0.94,
        style: 'miracleRise',
        colors: [0xfff2c2, 0xffb703, 0x1b0e2e, 0x6b2814],
        y: 0.22,
        size: 0.62,
        tilt: 0,
      },
      -1,
      { ghost: false, yOverride: 0.15, sizeOverride: 0.64, scaleKey: 1.2 }
    );
    this.root.add(this.titleCard.grp);

    LYRIC_CUES.forEach((cue, i) => {
      const prevEnd = i === 0 ? 0.96 : LYRIC_CUES[i - 1].end;
      const nextStart = i < LYRIC_CUES.length - 1 ? LYRIC_CUES[i + 1].t[0] : 999;
      const line3d = new Line3D(cue, i, { prevEnd, nextStart });
      this.lines.push(line3d);
      this.root.add(line3d.grp);
    });
  }

  update(t: number, fov: number) {
    // Keep 3D subtitle screen-size consistent regardless of camera FOV zoom!
    const fovScale = Math.tan((fov * PI) / 360) / Math.tan((40 * PI) / 360);
    this.root.scale.setScalar(fovScale);
    this.root.visible = !this.hidden;
    this.root.rotation.set(-0.03, Math.sin(t * 0.4) * 0.045, 0);

    let kick = this.titleCard.update(t) * 0.65;
    for (const line of this.lines) {
      kick = Math.max(kick, line.update(t));
    }
    this.kick = kick;
  }
}
