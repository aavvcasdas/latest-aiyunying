import * as THREE from 'three';
import { hash, many, PI, rgb } from './core';
import type { LookPreset } from './timeline';

export interface LookSpec {
  skyTop: number;
  skyMid: number;
  skyBot: number;
  fog: number;
  fogNear: number;
  fogFar: number;
  hemiSky: number;
  hemiGnd: number;
  hemiInt: number;
  dirColor: number;
  dirInt: number;
  dirPos: [number, number, number];
  rimColor: number;
  rimInt: number;
  cardTint: number;
}

export const LOOKS: Record<LookPreset, LookSpec> = {
  cathedral: {
    skyTop: 0x160f30,
    skyMid: 0x301c54,
    skyBot: 0x734252,
    fog: 0x261844,
    fogNear: 20,
    fogFar: 90,
    hemiSky: 0xffe4a0,
    hemiGnd: 0x2a1b47,
    hemiInt: 1.05,
    dirColor: 0xffd573,
    dirInt: 1.65,
    dirPos: [7, 15, 8],
    rimColor: 0x9b6bff,
    rimInt: 0.7,
    cardTint: 0xfff0d4,
  },
  astral: {
    skyTop: 0x05091a,
    skyMid: 0x0f1f4a,
    skyBot: 0x1b3b6b,
    fog: 0x0a1430,
    fogNear: 18,
    fogFar: 82,
    hemiSky: 0x8be9ff,
    hemiGnd: 0x18133a,
    hemiInt: 1.0,
    dirColor: 0xffde85,
    dirInt: 1.5,
    dirPos: [0, 12, 10],
    rimColor: 0x38bdf8,
    rimInt: 1.1,
    cardTint: 0xe3f6ff,
  },
  tribunal: {
    skyTop: 0x1a0714,
    skyMid: 0x451128,
    skyBot: 0x8a2c2b,
    fog: 0x320e20,
    fogNear: 16,
    fogFar: 75,
    hemiSky: 0xffb36b,
    hemiGnd: 0x2b0b1d,
    hemiInt: 0.95,
    dirColor: 0xffc857,
    dirInt: 1.9,
    dirPos: [4, 18, 6],
    rimColor: 0xff3b5c,
    rimInt: 1.15,
    cardTint: 0xffdfd4,
  },
  storm: {
    skyTop: 0x091324,
    skyMid: 0x152b44,
    skyBot: 0x284b63,
    fog: 0x14273d,
    fogNear: 14,
    fogFar: 68,
    hemiSky: 0x8ec5e8,
    hemiGnd: 0x0d1b2a,
    hemiInt: 0.9,
    dirColor: 0xaad8ff,
    dirInt: 1.25,
    dirPos: [-9, 14, 9],
    rimColor: 0x5eead4,
    rimInt: 0.65,
    cardTint: 0xcbe4f5,
  },
  archive: {
    skyTop: 0x191026,
    skyMid: 0x33203d,
    skyBot: 0x694545,
    fog: 0x291a33,
    fogNear: 16,
    fogFar: 72,
    hemiSky: 0xf7d098,
    hemiGnd: 0x261830,
    hemiInt: 1.0,
    dirColor: 0xffcf87,
    dirInt: 1.4,
    dirPos: [8, 12, 7],
    rimColor: 0xc084fc,
    rimInt: 0.75,
    cardTint: 0xfce7cb,
  },
  tears: {
    skyTop: 0x071026,
    skyMid: 0x11254d,
    skyBot: 0x294a7a,
    fog: 0x0f2042,
    fogNear: 18,
    fogFar: 80,
    hemiSky: 0xbbe6ff,
    hemiGnd: 0x101c38,
    hemiInt: 1.05,
    dirColor: 0xffe49e,
    dirInt: 1.45,
    dirPos: [0, 16, -6],
    rimColor: 0x7dd3fc,
    rimInt: 1.0,
    cardTint: 0xdff2ff,
  },
  dreamgate: {
    skyTop: 0x1a113b,
    skyMid: 0x3c276e,
    skyBot: 0x7a57a3,
    fog: 0x332061,
    fogNear: 18,
    fogFar: 78,
    hemiSky: 0xe9d5ff,
    hemiGnd: 0x2c1b54,
    hemiInt: 1.15,
    dirColor: 0xffe2a8,
    dirInt: 1.45,
    dirPos: [-6, 12, 9],
    rimColor: 0x8ef5d4,
    rimInt: 0.85,
    cardTint: 0xf5ebff,
  },
  rooftop: {
    skyTop: 0x0e1529,
    skyMid: 0x1e2c4f,
    skyBot: 0x455073,
    fog: 0x1c2847,
    fogNear: 18,
    fogFar: 82,
    hemiSky: 0xcbdcf5,
    hemiGnd: 0x161d33,
    hemiInt: 1.0,
    dirColor: 0xfff0d1,
    dirInt: 1.35,
    dirPos: [-8, 14, -5],
    rimColor: 0x93c5fd,
    rimInt: 0.75,
    cardTint: 0xe3ecfa,
  },
  bloom: {
    skyTop: 0x1f224f,
    skyMid: 0x5d4173,
    skyBot: 0xd68c74,
    fog: 0x4d3a66,
    fogNear: 20,
    fogFar: 88,
    hemiSky: 0xffd7a8,
    hemiGnd: 0x2c234d,
    hemiInt: 1.15,
    dirColor: 0xffca7a,
    dirInt: 1.6,
    dirPos: [10, 10, -8],
    rimColor: 0x7ce8ff,
    rimInt: 0.8,
    cardTint: 0xfff0e0,
  },
  miracle: {
    skyTop: 0x3e3b82,
    skyMid: 0xc26d88,
    skyBot: 0xffcf86,
    fog: 0xc97b84,
    fogNear: 26,
    fogFar: 110,
    hemiSky: 0xfff1cc,
    hemiGnd: 0x5c3c6b,
    hemiInt: 1.25,
    dirColor: 0xffe094,
    dirInt: 1.85,
    dirPos: [0, 12, -14],
    rimColor: 0xff8ab5,
    rimInt: 0.95,
    cardTint: 0xfff8eb,
  },
};

// Shared 3-band toon gradient map
let _toonGrad: THREE.DataTexture | null = null;
function toonGrad() {
  if (!_toonGrad) {
    const data = new Uint8Array([92, 92, 92, 255, 178, 178, 178, 255, 255, 255, 255, 255]);
    _toonGrad = new THREE.DataTexture(data, 3, 1);
    _toonGrad.minFilter = THREE.NearestFilter;
    _toonGrad.magFilter = THREE.NearestFilter;
    _toonGrad.needsUpdate = true;
  }
  return _toonGrad;
}

export function toonMat(color: number, emissive = 0x000000, emissiveIntensity = 0): THREE.MeshToonMaterial {
  return new THREE.MeshToonMaterial({
    color,
    gradientMap: toonGrad(),
    emissive,
    emissiveIntensity,
  });
}

export function basicMat(color: number, opacity = 1, additive = false): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color,
    transparent: opacity < 1 || additive,
    opacity,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    depthWrite: opacity >= 1 && !additive,
    side: THREE.DoubleSide,
  });
}

const inkMat = new THREE.MeshBasicMaterial({ color: 0x160f29, side: THREE.BackSide });

export function withInk(geo: THREE.BufferGeometry, mat: THREE.Material, outline = 0.04): THREE.Group {
  const g = new THREE.Group();
  const m = new THREE.Mesh(geo, mat);
  g.add(m);
  if (outline > 0) {
    const o = new THREE.Mesh(geo, inkMat);
    o.scale.setScalar(1 + outline);
    g.add(o);
  }
  return g;
}

export const box = (w: number, h: number, d: number, col: number, ink = 0.035, em = 0, emI = 0) => {
  const g = withInk(new THREE.BoxGeometry(w, h, d), toonMat(col, em, emI), ink);
  g.position.y = h / 2;
  const wrap = new THREE.Group();
  wrap.add(g);
  return wrap;
};

export const cyl = (rt: number, rb: number, h: number, col: number, segs = 12, ink = 0.035, em = 0, emI = 0) => {
  const g = withInk(new THREE.CylinderGeometry(rt, rb, h, segs), toonMat(col, em, emI), ink);
  g.position.y = h / 2;
  const wrap = new THREE.Group();
  wrap.add(g);
  return wrap;
};

export const cone = (r: number, h: number, col: number, segs = 10, ink = 0.035, em = 0, emI = 0) => {
  const g = withInk(new THREE.ConeGeometry(r, h, segs), toonMat(col, em, emI), ink);
  g.position.y = h / 2;
  const wrap = new THREE.Group();
  wrap.add(g);
  return wrap;
};

export const ball = (r: number, col: number, ink = 0.035, em = 0, emI = 0) =>
  withInk(new THREE.SphereGeometry(r, 16, 12), toonMat(col, em, emI), ink);

export const disc = (r: number, col: number, opacity = 1) => {
  const m = new THREE.Mesh(
    new THREE.CircleGeometry(r, 48).rotateX(-PI / 2),
    opacity < 1 ? basicMat(col, opacity) : toonMat(col)
  );
  return m;
};

export const torus = (r: number, tube: number, col: number, em = 0, emI = 0, segs = 32) =>
  new THREE.Mesh(new THREE.TorusGeometry(r, tube, 10, segs), toonMat(col, em, emI));

export function put<T extends THREE.Object3D>(parent: THREE.Object3D, child: T, x = 0, y = 0, z = 0): T {
  child.position.set(x, y, z);
  parent.add(child);
  return child;
}

export function setOp(obj: THREE.Object3D, op: number) {
  obj.traverse((ch) => {
    const m = (ch as THREE.Mesh).material;
    if (m && 'opacity' in m) {
      (m as THREE.Material & { opacity: number }).opacity = op;
    }
  });
}

// ---------- Procedural Canvas Textures ----------
const texCache = new Map<string, THREE.CanvasTexture>();
function cachedTex(key: string, w: number, h: number, draw: (c: CanvasRenderingContext2D, w: number, h: number) => void) {
  let t = texCache.get(key);
  if (!t) {
    const cv = document.createElement('canvas');
    cv.width = w;
    cv.height = h;
    draw(cv.getContext('2d')!, w, h);
    t = new THREE.CanvasTexture(cv);
    t.needsUpdate = true;
    texCache.set(key, t);
  }
  return t;
}

export const texGlow = () =>
  cachedTex('glow', 128, 128, (c, w, h) => {
    const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.28, 'rgba(255,245,220,0.68)');
    g.addColorStop(0.65, 'rgba(255,220,160,0.16)');
    g.addColorStop(1, 'rgba(255,220,160,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
  });

export const texStar = () =>
  cachedTex('star', 128, 128, (c, w, h) => {
    c.translate(w / 2, h / 2);
    const g = c.createRadialGradient(0, 0, 2, 0, 0, 56);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.4, 'rgba(255,244,180,0.85)');
    g.addColorStop(1, 'rgba(255,244,180,0)');
    c.fillStyle = g;
    c.beginPath();
    for (let i = 0; i < 8; i++) {
      const r = i % 2 === 0 ? 54 : 11;
      const a = (i * PI) / 4;
      if (i === 0) c.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else c.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    c.closePath();
    c.fill();
  });

export const texTear = () =>
  cachedTex('tear', 128, 128, (c) => {
    c.beginPath();
    c.moveTo(64, 10);
    c.bezierCurveTo(96, 54, 106, 84, 64, 114);
    c.bezierCurveTo(22, 84, 32, 54, 64, 10);
    c.closePath();
    const g = c.createLinearGradient(44, 14, 84, 114);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.45, '#bfe9ff');
    g.addColorStop(1, '#ffe08a');
    c.fillStyle = g;
    c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.9)';
    c.lineWidth = 4;
    c.stroke();
    c.fillStyle = 'rgba(255,255,255,0.85)';
    c.beginPath();
    c.ellipse(51, 68, 8, 15, -0.25, 0, PI * 2);
    c.fill();
  });

export const texRipple = () =>
  cachedTex('ripple', 256, 256, (c, w, h) => {
    c.strokeStyle = 'rgba(255,240,180,0.95)';
    c.lineWidth = 7;
    c.beginPath();
    c.arc(w / 2, h / 2, 104, 0, PI * 2);
    c.stroke();
    c.strokeStyle = 'rgba(130,220,255,0.65)';
    c.lineWidth = 3;
    c.beginPath();
    c.arc(w / 2, h / 2, 82, 0, PI * 2);
    c.stroke();
  });

export const texRoseWindow = () =>
  cachedTex('roseWindow', 512, 512, (c, w, h) => {
    const cx = w / 2;
    const cy = h / 2;
    const bg = c.createRadialGradient(cx, cy, 12, cx, cy, 240);
    bg.addColorStop(0, '#fff7cc');
    bg.addColorStop(0.32, '#ffd166');
    bg.addColorStop(0.65, '#6b3fa0');
    bg.addColorStop(1, '#1a224d');
    c.fillStyle = bg;
    c.beginPath();
    c.arc(cx, cy, 236, 0, PI * 2);
    c.fill();

    // Petals of stained glass
    const cols = ['#ffd166', '#7dd3fc', '#f472b6', '#c084fc', '#fde68a', '#38bdf8'];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * PI * 2;
      c.save();
      c.translate(cx, cy);
      c.rotate(a);
      c.fillStyle = cols[i % cols.length];
      c.globalAlpha = 0.72;
      c.beginPath();
      c.moveTo(0, -34);
      c.quadraticCurveTo(36, -110, 0, -210);
      c.quadraticCurveTo(-36, -110, 0, -34);
      c.fill();
      c.globalAlpha = 1;
      c.strokeStyle = '#18102b';
      c.lineWidth = 7;
      c.stroke();
      c.restore();
    }
    // Concentric mullions
    c.strokeStyle = '#18102b';
    for (const r of [42, 118, 185, 234]) {
      c.lineWidth = r === 234 ? 14 : 7;
      c.beginPath();
      c.arc(cx, cy, r, 0, PI * 2);
      c.stroke();
    }
  });

export const texLightning = () =>
  cachedTex('lightning', 128, 256, (c) => {
    c.strokeStyle = '#fff9d6';
    c.shadowColor = '#fbbf24';
    c.shadowBlur = 18;
    c.lineWidth = 10;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(64, 4);
    c.lineTo(38, 86);
    c.lineTo(78, 108);
    c.lineTo(44, 186);
    c.lineTo(74, 200);
    c.lineTo(54, 252);
    c.stroke();
  });

export const texMemoryCard = (variant: number) =>
  cachedTex(`mem_${variant}`, 256, 300, (c, w, h) => {
    // Tattered warm-sepia polaroid / blueprint memory card
    c.fillStyle = '#efe3cc';
    c.fillRect(0, 0, w, h);
    c.strokeStyle = '#2d1c3a';
    c.lineWidth = 8;
    c.strokeRect(4, 4, w - 8, h - 8);
    // Inner photo frame
    const pal = [
      ['#1b2a4a', '#4b7fa8', '#ffe49e'],
      ['#2d1a3d', '#7b4f91', '#ffb7c5'],
      ['#1c303a', '#41737a', '#a3f0e0'],
      ['#362124', '#85463b', '#ffd180'],
    ][variant % 4];
    const g = c.createLinearGradient(20, 20, 20, 215);
    g.addColorStop(0, pal[0]);
    g.addColorStop(1, pal[1]);
    c.fillStyle = g;
    c.fillRect(20, 22, w - 40, 192);
    // Abstract scene sketch inside memory
    c.fillStyle = pal[2];
    c.beginPath();
    c.arc(w * (0.35 + (variant % 3) * 0.15), 78, 22, 0, PI * 2);
    c.fill();
    c.fillStyle = 'rgba(16,12,28,0.45)';
    c.fillRect(20, 152, w - 40, 62);
    // Rain / scratch lines
    c.strokeStyle = 'rgba(255,255,255,0.28)';
    c.lineWidth = 2;
    for (let i = 0; i < 12; i++) {
      const x = 30 + hash(variant * 19 + i) * 190;
      c.beginPath();
      c.moveTo(x, 26);
      c.lineTo(x - 14, 208);
      c.stroke();
    }
    // Crack line across frame
    c.strokeStyle = '#241430';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(20, 40 + variant * 18);
    c.lineTo(106, 118);
    c.lineTo(164, 96);
    c.lineTo(w - 20, 174);
    c.stroke();
    // Handwritten scribble bar at bottom
    c.fillStyle = '#5c4b59';
    c.fillRect(34, 240, 120, 8);
    c.fillRect(34, 258, 86, 6);
  });

export const texSignBoard = (title: string, sub: string, bg: string, fg: string, border: string) =>
  cachedTex(`sign_${title}_${sub}`, 256, 128, (c, w, h) => {
    c.fillStyle = bg;
    c.fillRect(6, 6, w - 12, h - 12);
    c.strokeStyle = border;
    c.lineWidth = 8;
    c.strokeRect(6, 6, w - 12, h - 12);
    c.fillStyle = fg;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = `bold 44px 'ZCOOLKL', sans-serif`;
    c.fillText(title, w / 2, 52);
    c.font = `bold 24px 'ZCOOLKL', sans-serif`;
    c.globalAlpha = 0.85;
    c.fillText(sub, w / 2, 95);
  });

export function glowSprite(size: number, color: number, opacity = 0.85, tex?: THREE.Texture) {
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: tex ?? texGlow(),
      color,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  );
  s.scale.setScalar(size);
  return s;
}

export function flatSprite(size: number, color: number, tex: THREE.Texture, opacity = 1) {
  const s = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: tex,
      color,
      transparent: true,
      opacity,
      depthWrite: false,
    })
  );
  s.scale.setScalar(size);
  return s;
}

// ---------- Original 3D Set-Piece Builders ----------

/** Sky-dome gradient backdrop updated per LookSpec */
export function createSkyDome() {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    uniforms: {
      cTop: { value: new THREE.Color(0x160f30) },
      cMid: { value: new THREE.Color(0x301c54) },
      cBot: { value: new THREE.Color(0x734252) },
    },
    vertexShader: `varying vec3 vPos; void main(){ vPos = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 cTop; uniform vec3 cMid; uniform vec3 cBot; varying vec3 vPos;
    void main(){
      float y = clamp(vPos.y * 1.15 + 0.15, 0.0, 1.0);
      vec3 col = y < 0.45 ? mix(cBot, cMid, y / 0.45) : mix(cMid, cTop, (y - 0.45) / 0.55);
      gl_FragColor = vec4(col, 1.0);
    }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(180, 24, 16), mat);
  return { mesh, mat };
}

/** Towering golden-ivory celestial archway */
export function celestialArch(span = 5.6, height = 7.4, col = 0xead8be, gold = 0xf4c553) {
  const g = new THREE.Group();
  const half = span / 2;
  for (const s of [-1, 1]) {
    put(g, cyl(0.32, 0.42, height * 0.72, col, 10), s * half, 0, 0);
    put(g, box(1.05, 0.36, 1.05, gold, 0.03), s * half, 0, 0);
    put(g, box(0.95, 0.3, 0.95, gold, 0.03), s * half, height * 0.72, 0);
  }
  const arch = new THREE.Mesh(
    new THREE.TorusGeometry(half, 0.24, 10, 28, PI),
    toonMat(gold, gold, 0.2)
  );
  arch.position.set(0, height * 0.72, 0);
  g.add(arch);
  const halo = new THREE.Mesh(
    new THREE.TorusGeometry(half * 0.76, 0.06, 8, 28, PI),
    basicMat(0xfff1a8, 0.85, true)
  );
  halo.position.set(0, height * 0.72, 0.15);
  g.add(halo);
  return g;
}

/** Giant 3D Golden Quota Hourglass (signature prop for GPT / God) */
export function giantHourglass(scale = 1, sandCol = 0xffd166) {
  const g = new THREE.Group();
  put(g, cyl(0.7, 0.76, 0.18, 0xd49b35, 12), 0, 0, 0);
  put(g, cyl(0.76, 0.7, 0.18, 0xd49b35, 12), 0, 2.22, 0);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * PI * 2 + PI / 4;
    put(g, cyl(0.055, 0.055, 2.24, 0xf2c85b, 6, 0), Math.cos(a) * 0.56, 0.08, Math.sin(a) * 0.56);
  }
  // Glass bulbs
  const topBulb = new THREE.Mesh(new THREE.ConeGeometry(0.54, 1.02, 12), basicMat(0xbfe9ff, 0.32));
  topBulb.rotation.x = PI;
  topBulb.position.y = 1.72;
  g.add(topBulb);
  const botBulb = new THREE.Mesh(new THREE.ConeGeometry(0.54, 1.02, 12), basicMat(0xbfe9ff, 0.32));
  botBulb.position.y = 0.68;
  g.add(botBulb);
  // Glowing golden sand
  const sandBot = cone(0.42, 0.55, sandCol, 10, 0, sandCol, 0.35);
  put(g, sandBot, 0, 0.18, 0);
  const sandStream = cyl(0.03, 0.03, 0.88, 0xfff3b0, 6, 0, 0xffe082, 0.6);
  put(g, sandStream, 0, 0.55, 0);
  g.scale.setScalar(scale);
  return g;
}

/** Whale's workshop peak/valley flip sign */
export function peakValleySign() {
  const g = new THREE.Group();
  put(g, cyl(0.07, 0.09, 1.45, 0x7a5136, 8), 0, 0, 0);
  const board = new THREE.Mesh(
    new THREE.BoxGeometry(1.45, 0.78, 0.1),
    [
      toonMat(0x8a5b3b),
      toonMat(0x8a5b3b),
      toonMat(0x8a5b3b),
      toonMat(0x8a5b3b),
      new THREE.MeshBasicMaterial({ map: texSignBoard('峰 / 谷', '省下加个蛋', '#fff4dc', '#1f2d59', '#2b7de9') }),
      new THREE.MeshBasicMaterial({ map: texSignBoard('谷 时 惠', '马上交付', '#e0f7ff', '#0b4a6f', '#38bdf8') }),
    ]
  );
  board.position.set(0, 1.55, 0);
  g.add(board);
  return { g, board };
}

/** Spinning Astrolabe Ring for Soul Tunnel */
export function astrolabeRing(r: number, col = 0xffd166, glowCol = 0x38bdf8) {
  const g = new THREE.Group();
  g.add(torus(r, 0.085, col, col, 0.35, 36));
  const inner = new THREE.Mesh(new THREE.TorusGeometry(r * 0.86, 0.035, 8, 32), basicMat(glowCol, 0.85, true));
  g.add(inner);
  many(8, (i) => {
    const a = (i / 8) * PI * 2;
    const node = put(g, ball(0.12, i % 2 ? col : glowCol, 0, glowCol, 0.5), Math.cos(a) * r, Math.sin(a) * r, 0);
    node.scale.setScalar(i % 2 ? 1 : 0.7);
  });
  return g;
}

/** Giant 3D Celestial Judgment Scale */
export function judgmentScales() {
  const g = new THREE.Group();
  put(g, cyl(0.18, 0.36, 5.2, 0xd49b35, 10), 0, 0, 0);
  put(g, ball(0.32, 0xffe082, 0.03, 0xffc857, 0.4), 0, 5.25, 0);
  const beam = new THREE.Group();
  beam.position.set(0, 5.1, 0);
  put(beam, box(5.4, 0.18, 0.22, 0xf2c85b, 0.03), 0, -0.09, 0);
  const leftPan = new THREE.Group();
  leftPan.position.set(-2.4, 0, 0);
  put(leftPan, cyl(0.03, 0.03, 2.0, 0xffe082, 6, 0), 0, -2.0, 0);
  put(leftPan, cyl(0.95, 0.5, 0.26, 0xe8b548, 12), 0, -2.2, 0);
  const rightPan = new THREE.Group();
  rightPan.position.set(2.4, 0, 0);
  put(rightPan, cyl(0.03, 0.03, 2.0, 0xffe082, 6, 0), 0, -2.0, 0);
  put(rightPan, cyl(0.95, 0.5, 0.26, 0xe8b548, 12), 0, -2.2, 0);
  beam.add(leftPan, rightPan);
  g.add(beam);
  return { g, beam, leftPan, rightPan };
}

/** Broken storm-tossed walkway plank */
export function brokenPlank(w = 2.6, d = 1.6, col = 0x5c4738) {
  const g = new THREE.Group();
  put(g, box(w, 0.18, d, col, 0.03), 0, -0.09, 0);
  put(g, box(w * 0.92, 0.06, 0.16, 0x3b2c23, 0), 0, 0.06, -d * 0.36);
  put(g, box(w * 0.92, 0.06, 0.16, 0x3b2c23, 0), 0, 0.06, d * 0.36);
  return g;
}

/** Cracked Floating 3D Memory Frame */
export function memoryFrame(variant: number, w = 2.1, h = 2.45) {
  const g = new THREE.Group();
  const card = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, 0.09),
    [
      toonMat(0x523b5e),
      toonMat(0x523b5e),
      toonMat(0x523b5e),
      toonMat(0x523b5e),
      new THREE.MeshBasicMaterial({ map: texMemoryCard(variant) }),
      new THREE.MeshBasicMaterial({ map: texMemoryCard(variant + 2) }),
    ]
  );
  g.add(card);
  return g;
}

/** Monumental Stained-Glass Cathedral Rose Window */
export function stainedRoseWindow(radius = 5.8) {
  const g = new THREE.Group();
  const discM = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 40),
    new THREE.MeshBasicMaterial({
      map: texRoseWindow(),
      transparent: true,
      opacity: 0.95,
      side: THREE.DoubleSide,
    })
  );
  g.add(discM);
  g.add(torus(radius, 0.25, 0x241838, 0x3d2861, 0.2, 36));
  const halo = glowSprite(radius * 2.7, 0xffdf99, 0.45);
  halo.position.z = -0.3;
  g.add(halo);
  return g;
}

/** Whimsical Dream-Gate VIP Customs Kiosk */
export function dreamGatehouse() {
  const g = new THREE.Group();
  // Cloud base
  many(7, (i) => {
    const a = (i / 7) * PI * 2;
    put(g, ball(1.0 + hash(i) * 0.5, 0xd8c8ff, 0.025, 0x8b6bd6, 0.15), Math.cos(a) * 2.1, -0.35, Math.sin(a) * 1.4);
  });
  // Brass arch gate
  put(g, cyl(0.14, 0.18, 3.6, 0xf2c85b, 10), -1.7, 0, 0);
  put(g, cyl(0.14, 0.18, 3.6, 0xf2c85b, 10), 1.7, 0, 0);
  const arch = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.14, 8, 24, PI), toonMat(0xf2c85b, 0xffd166, 0.35));
  arch.position.set(0, 3.55, 0);
  g.add(arch);
  // Glowing neon-brass VIP dream sign
  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, 1.05, 0.16),
    new THREE.MeshBasicMaterial({ map: texSignBoard('梦境通道', 'VIP 熟人通道', '#261447', '#8ef5d4', '#ffd166') })
  );
  sign.position.set(0, 4.3, 0.15);
  g.add(sign);
  // Velvet rope barrier (pivots up when Qwen opens it!)
  const ropePivot = new THREE.Group();
  ropePivot.position.set(-1.6, 1.15, 0.35);
  put(ropePivot, box(3.2, 0.11, 0.11, 0xf43f5e, 0.02, 0xf43f5e, 0.25), 1.6, 0, 0);
  g.add(ropePivot);
  return { g, ropePivot };
}

/** Giant Clockwork Fate Gear */
export function fateGear(radius = 3.2, teeth = 14, col = 0x64748b, rimCol = 0xcbd5e1) {
  const g = new THREE.Group();
  g.add(torus(radius, 0.26, col, 0x1e293b, 0.1, 28));
  g.add(torus(radius * 0.45, 0.14, rimCol, 0x334155, 0.1, 20));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * PI * 2;
    const spoke = box(radius * 1.9, 0.18, 0.16, col, 0.02);
    spoke.rotation.z = a;
    g.add(spoke);
  }
  for (let i = 0; i < teeth; i++) {
    const a = (i / teeth) * PI * 2;
    const tooth = box(0.42, 0.45, 0.32, rimCol, 0.025);
    tooth.position.set(Math.cos(a) * (radius + 0.22), Math.sin(a) * (radius + 0.22), 0);
    tooth.rotation.z = a - PI / 2;
    g.add(tooth);
  }
  return g;
}

/** Stylized Cloud Cluster */
export function cloudPuff(seed: number, scale = 1, col = 0xe8dcff, em = 0x5c428a) {
  const g = new THREE.Group();
  many(5, (i) => {
    const x = (i - 2) * 0.72;
    const y = (hash(seed + i * 3) - 0.3) * 0.45;
    const r = 0.65 + hash(seed + i * 7) * 0.55;
    put(g, ball(r, col, 0.02, em, 0.18), x, y, (hash(seed + i) - 0.5) * 0.6);
  });
  g.scale.setScalar(scale);
  return g;
}

/** Luminous Folded Origami Whale */
export function origamiWhale(col = 0x7ce8ff, glowCol = 0xfff0b3) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.OctahedronGeometry(0.45, 0), toonMat(col, glowCol, 0.45));
  body.scale.set(1.5, 0.75, 0.7);
  g.add(body);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.55, 4), toonMat(0xbae6fd, glowCol, 0.5));
  tail.rotation.z = -PI / 2;
  tail.position.set(-0.72, 0.08, 0);
  g.add(tail);
  const halo = glowSprite(1.5, glowCol, 0.5);
  g.add(halo);
  return g;
}

/** Blooming Sky Flower / Dawn Wildflower */
export function skyFlower(petalCol = 0xffd166, scale = 1) {
  const g = new THREE.Group();
  put(g, cyl(0.035, 0.045, 0.65, 0x4ade80, 6, 0), 0, 0, 0);
  put(g, ball(0.14, 0xfff7cc, 0, 0xffd166, 0.6), 0, 0.68, 0);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * PI * 2;
    const p = ball(0.13, petalCol, 0.02, petalCol, 0.3);
    p.scale.set(1.2, 0.5, 0.8);
    put(g, p, Math.cos(a) * 0.2, 0.68, Math.sin(a) * 0.2);
  }
  g.scale.setScalar(scale);
  return g;
}

/** Warm Floating Paper Lantern */
export function warmLantern(col = 0xffcf70) {
  const g = new THREE.Group();
  put(g, cyl(0.18, 0.2, 0.36, col, 8, 0.03, col, 0.65), 0, 0, 0);
  put(g, cyl(0.13, 0.13, 0.06, 0x3b2316, 8, 0), 0, 0.36, 0);
  put(g, cyl(0.13, 0.13, 0.06, 0x3b2316, 8, 0), 0, -0.05, 0);
  put(g, glowSprite(1.3, col, 0.55), 0, 0.18, 0);
  return g;
}

export function cardTintVec(look: LookPreset): THREE.Vector3 {
  return rgb(LOOKS[look].cardTint);
}
